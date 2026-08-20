---
title: 小程序蓝牙开发实践 BLE 连接流程与踩坑记录
date: 2019-08-31 16:50:32
description: 从 BLE 基础概念讲到小程序蓝牙全流程，搜索、连接、取服务与特征值、开 notify、收发数据，附两个完整示例和 iOS 与安卓的差异处理。
tags: 
  - 小程序
  - 蓝牙
  - BLE
categories: Front-End
---

第一次接硬件的时候我以为跟调接口差不多，拿到设备 ID、连上、发数据、收回复，四步搞定。真写起来才知道差得远。安卓上跑得好好的流程，换到 iPhone 上搜不到设备；开完 notify 立刻发消息，回调一次都不进；设备 ID 在安卓上是固定的 MAC 地址，在 iOS 上却每次都变。这些坑都不在文档的显眼位置，得自己撞一遍。这篇把小程序蓝牙从基础概念到完整连接流程整理了一遍，包括那 18 个 API 各自管什么、双端差异怎么处理、哪几个地方必须加延时，以及两个可以直接拿去改的完整例子。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 蓝牙、BLE、GATT 这几个词分别指什么，写代码前必须先分清
- deviceId、serviceId、characteristicId 三层结构是怎么套起来的
- 小程序蓝牙 18 个 API 的分工，哪些是动作，哪些是监听
- 从开适配器到收发数据的完整九步流程，每一步的返回值怎么用
- iOS 拿不到 MAC 地址时，靠什么来认设备
- 两处必须加 `setTimeout` 的地方，不加就是必现失败
- `ArrayBuffer` 和十六进制字符串怎么互转，为什么必须转
- 两个完整可跑的示例，以及一份踩坑清单

## 一、先把蓝牙这几个概念分清

蓝牙是爱立信公司创立的一种无线技术标准，为短距离的硬件设备提供低成本的通信规范。蓝牙规范由蓝牙技术联盟（Bluetooth Special Interest Group，简称 SIG）管理，在计算机、手机、传真机、耳机、汽车、家用电器等很多场景广泛使用。蓝牙有这么几个特点：

- 免费使用：工作频段在 2.4GHz 的工科医（ISM）频段，无需申请许可证
- 功耗低：BLE4.0 包含了一个低功耗标准（Bluetooth Low Energy），可以让蓝牙的功耗显著降低
- 安全性高：蓝牙规范提供了一套安全加密机制和授权机制，可以有效防范数据被窃取
- 传输率高：BLE4.0 版本理论传输速率可达 3Mbit/s（实际肯定达不到），理论覆盖范围可达 100 米

第四条要补充一句。蓝牙 4.0 这个规范其实包含两条并行的技术线，经典蓝牙那条（BR/EDR）速率高，3Mbit/s 说的是它；低功耗那条（LE）物理层速率低得多，换来的是省电。小程序里操作的是低功耗这条线，所以 API 名字里全都带着 `BLE`。真实的吞吐能力跟这个理论值差着一个量级，做产品设计的时候按小数据包来规划，别指望拿蓝牙传文件。

搞清楚这个区分很重要，因为它直接决定了你的协议要怎么设计。

## 二、小程序蓝牙 API 总览

### 2.1 几个必须先了解的术语

小程序 API 提供了一套蓝牙操作接口，作为前端开发人员可以更方便地进行蓝牙设备开发，而无需了解安卓和 iOS 的各种蓝牙底层概念。小程序的蓝牙操作大多都是通过异步调用来处理的，这里面就存在着一些坑，后面会详细介绍。

在使用小程序蓝牙 API 之前，有几个术语需要预先了解：

- **蓝牙终端**：我们常说的硬件设备，包括手机、电脑等等
- **UUID**：由字母和数字组成的标识串，跟硬件设备关联的唯一 ID
- **设备地址**：每个蓝牙设备都有一个设备地址 `deviceId`，但是安卓和 iOS 差别很大。安卓下设备地址就是 MAC 地址，但是 iOS 无法获取 MAC 地址，所以设备地址是针对本机范围有效的 UUID，这里需要注意
- **设备服务列表**：每个设备都存在一些服务列表，可以跟不同的设备进行通信，服务有一个 `serviceId` 来维护，每个服务包含了一组特征值
- **服务特征值**：包含一个单独的 value 值和 0 到 n 个用来描述 characteristic 值（value）的 descriptors。一个 characteristic 可以被认为是一种类型的，类似于一个类
- **ArrayBuffer**：小程序中对蓝牙数据的传递是使用 ArrayBuffer 的二进制类型来的，所以在我们的使用过程中需要进行转码

关于 UUID 那条，原文写的是「40 个字符串的序号」，这个数字不太准确，这里顺手改一下。UUID 是 128 位，标准的字符串表示是 32 个十六进制字符加 4 个连字符，一共 36 个字符。不过小程序里你还会碰到 16 位的短 UUID，比如 `0000FFE0-0000-1000-8000-00805F9B34FB` 这种蓝牙 SIG 规定的标准服务，日常写代码时按拿到的原值用就行，别自己拼。

设备、服务、特征值三者是层层嵌套的关系，这张图把它们的包含关系画出来了：

![蓝牙设备、服务与特征值的层级关系示意图](https://blog-10039692.file.myqcloud.com/1508314805462_3727_1508314829406.png)

理解这张图是写好蓝牙代码的前提。一台设备下面挂多个服务，一个服务下面挂多个特征值，真正能读写的只有最底层的特征值。所以从连上设备到能发数据，中间必须走完「找服务」和「找特征值」两步，每一步都是异步的。

这也是为什么蓝牙代码天生就是一串回调套回调。

### 2.2 18 个 API 各管什么

小程序对蓝牙设备的操作有 18 个 API：

|API名称|说明|
|--|--|
|`openBluetoothAdapter`|初始化蓝牙适配器，在此可用判断蓝牙是否可用|
|`closeBluetoothAdapter`|	关闭蓝牙连接，释放资源|
|`getBluetoothAdapterState` | 获取蓝牙适配器状态，如果蓝牙未开或不可用，这里可用检测到|
|`onBluetoothAdapterStateChange`|	蓝牙适配器状态发生变化事件，这里可用监控蓝牙的关闭和打开动作|
|`startBluetoothDevicesDiscovery`|	开始搜索设备，蓝牙初始化成功后就可以搜索设备|
|`stopBluetoothDevicesDiscovery`|	当找到目标设备以后需要停止搜索，因为搜索设备是比较消耗资源的操作|
|`getBluetoothDevices`|	获取已经搜索到的设备列表|
|`onBluetoothDeviceFound`|	当搜索到一个设备时的事件，在此可用过滤目标设备|
|`getConnectedBluetoothDevices`|	获取已连接的设备|
|`createBLEConnection`|	创建BLE连接|
|`closeBLEConnection`|	关闭BLE连接|
|`getBLEDeviceServices`|	获取设备的服务列表，每个蓝牙设备都有一些服务|
|`getBLEDeviceCharacteristics`|	获取蓝牙设备某个服务的特征值列表|
|`readBLECharacteristicValue`|	读取低功耗蓝牙设备的特征值的二进制数据值|
|`writeBLECharacteristicValue`|	向蓝牙设备写入数据|
|`notifyBLECharacteristicValueChange`|	开启蓝牙设备`notify`提醒功能，只有开启这个功能才能接受到蓝牙推送的数据|
|`onBLEConnectionStateChange`|	监听蓝牙设备错误事件，包括异常断开等等|
|`onBLECharacteristicValueChange`|	监听蓝牙推送的数据，也就是`notify`数据|

这 18 个 API 可以按名字前缀分成三类，分清楚之后就好记多了。

`on` 开头的是监听，注册一次之后被动等回调，它们不是「执行一次拿结果」的那种。`get` 开头的是查询，一次调用返回一次快照。剩下的是动作，开关适配器、开关搜索、连接断连、读写数据。

另外注意 API 名字里带不带 `BLE`。带 `BLE` 的是针对已连接的某台低功耗设备做操作，不带的是针对本机适配器或者搜索行为。搞混这一层，你会发现自己在没连设备的时候调了 `getBLEDeviceServices`，然后收到一个看不懂的错误码。

## 三、完整流程走一遍

蓝牙通信的一个正常流程是下面的图示：

![小程序蓝牙从初始化到收发数据的完整流程图](https://blog-10039692.file.myqcloud.com/1508314916535_7138_1508314940423.png)

这九步是有严格先后顺序的，前一步的返回值就是后一步的入参，跳步就会失败。下面逐步拆。

### 3.1 开启蓝牙与检查状态

调用 `openBluetoothAdapter` 来开启和初始化蓝牙，这时候可以根据状态判断用户设备是否支持蓝牙。接着调用 `getBluetoothAdapterState` 来检查蓝牙是否开启，没有开启就在这里提醒用户开启，并且能在开启后自动启动下面的步骤。

这里有一个坑：iOS 里面蓝牙状态变化以后不能马上开始搜索，否则会搜索不到设备，必须要等待 2 秒以上。

```js
function connect(){
  wx.openBluetoothAdapter({
    success: function (res) {
    },
    fail(res){
    },
    complete(res){
      wx.onBluetoothAdapterStateChange(function(res) {
        if(res.available){
          setTimeout(function(){
            connect();
          },2000);
        }
      })
　　　//开始搜索  
    }
  })
}
```

这段代码的思路是：不管 `openBluetoothAdapter` 成功还是失败，都先把状态监听挂上。用户当时没开蓝牙，`openBluetoothAdapter` 会失败；等他去系统设置里打开了，`onBluetoothAdapterStateChange` 就会触发，`res.available` 变成 true，延时 2 秒之后重新走一遍 `connect`。

那 2 秒是必须的。系统上报「蓝牙可用」和蓝牙协议栈真正准备好之间有一段空档，iOS 上尤其明显。这个空档里发起搜索，回调一次都不进，也不报错，就是安安静静地什么都搜不到。排查这种没有报错的问题最费时间，因为你会先怀疑自己的过滤逻辑写错了。

不加延时不是「可能失败」，是「必现失败」。

### 3.2 搜索设备，以及双端最大的差异

`startBluetoothDevicesDiscovery` 开始搜索设备，当发现一个设备会触发 `onBluetoothDeviceFound` 事件。先看下标准 API：

![onBluetoothDeviceFound 回调返回的设备对象字段说明](https://blog-10039692.file.myqcloud.com/1508314941142_8213_1508314965035.png)

由于 iOS 无法获取 MAC 地址，所以这里需要区分两个场景。

安卓下可以根据 MAC 地址来搜索设备，或者跳过此步直接连接到设备。当搜索到一个设备以后，可以在 `onBluetoothDeviceFound` 事件回调中判断当前设备的 `deviceId` 是否为指定的 MAC 地址：

```js
let mac = "XXXXXXXXXXXXXXX";
wx.startBluetoothDevicesDiscovery({
  services:[],
  success(res) {
    wx.onBluetoothDeviceFound(res=>{
        let devices = res.devices;
        for(let i = 0;i<devices.length;i++){
          if(devices[i].deviceId === mac){
            console.log("find");
            wx.stopBluetoothDevicesDiscovery({
              success:res=>console.log(res),
              fail:res=>console.log(res),
            })
          }
        }
    });

  },
  fail(res){
      console.log(res);
  }
})
```

这里改了原文的一处代码错误。原文写的是 `if(devices[i].deviceId = mac)`，一个等号，那是赋值不是比较，结果就是每次判断都返回真值，第一个搜到的设备就会被当成目标。这类错误编译不报、eslint 不开也不提示，跑起来的现象是「随便连上一台设备然后一直失败」，非常难查。改成了 `===`。

iOS 下获取设备 MAC 地址的方法已经被屏蔽，所以不存在 MAC 地址，此时只能通过其他方式来判断，比如在蓝牙设备 `advertisData` 字段添加一些特别的信息来判断，可以转字符串来判断，也可以直接用二进制来判断：

```js
let id = "XXXXXXXXXXXXXXX",//设备标识符
    deviceId = "";
wx.startBluetoothDevicesDiscovery({
  services:[],
  success(res) {
    wx.onBluetoothDeviceFound(res=>{
        var devices = res.devices;
        for(let i = 0;i<devices.length;i++){
          let advertisData = devices[i].advertisData;
          var data = arrayBufferToHexString(advertisData);//二进制转字符串
          if (!!data && data.indexOf(id) > -1) {
              console.log("find");
　　　　　　　　deviceId = devices[i].deviceId;
          }
        }
    });    
  },
  fail(res){
      console.log(res);
  }
});
```

`advertisData` 是设备广播包里的厂商自定义数据，硬件那边可以往里塞任意内容。所以这条路的前提是你能跟硬件同学商量好协议，让设备在广播里带上一个可识别的标识，比如序列号的后几位。如果设备是买来的成品，广播里什么都没有，那 iOS 上就只能把搜到的设备列表展示给用户，让他自己点。

配套的转换函数是这个，它把 `ArrayBuffer` 转成十六进制字符串：

```js
function arrayBufferToHexString(buffer) {
  let bufferType = Object.prototype.toString.call(buffer)
  if (bufferType != '[object ArrayBuffer]') {
    return
  }
  let dataView = new DataView(buffer)

  var hexStr = '';
  for (var i = 0; i < dataView.byteLength; i++) {
    var str = dataView.getUint8(i);
    var hex = (str & 0xff).toString(16);
    hex = (hex.length === 1) ? '0' + hex : hex;
    hexStr += hex;
  }

  return hexStr.toUpperCase();
}
```

这里也修了两处。原文的类型判断写的是 `if (buffer != '[object ArrayBuffer]')`，比较的是 `buffer` 而不是上一行算出来的 `bufferType`，等于这个类型保护完全没生效，传进来一个 undefined 照样往下走然后在 `new DataView` 那里炸掉。另外原文函数体中间混进了一行 `****`，是复制粘贴时带进来的，直接跑会语法报错，一并删掉了。

逐字节 `getUint8` 再补零拼成十六进制，这个写法看着土但很实在。硬件协议文档上写的都是 `0xAA 0x55` 这种十六进制，转成同样的格式，对着文档核对起来最直观。

需要注意的是，如果知道 MAC 地址，在安卓下可以直接略过搜索过程直接连接；如果不知道 MAC 地址或者是 iOS 场景下就需要开启搜索。由于搜索是比较消耗资源的动作，发现目标设备以后一定要及时关闭搜索，以节省系统消耗。

### 3.3 连接设备与获取服务列表

搜索到设备以后，就是连接设备 `createBLEConnection`。连接成功以后开始查询设备的服务列表 `getBLEDeviceServices`，然后根据目标服务 ID 或者标识符来找到指定的服务 ID：

```js
let device_id = "XXXX";
wx.getBLEDeviceServices({
  deviceId: device_id,
  success: function (res) {        
    let service_id = "";
    let services = res.services;
    for(let i = 0;i<services.length;i++){
      if(services[i].uuid.toUpperCase().indexOf("TEST") != -1){
        service_id = services[i].uuid;
        break;
      }
    }

    return service_id;
  },
  fail(res){
    console.log(res);
  }
})
```

原文这段里变量名对不上，外面声明的是 `deviceId` 却传了 `device_id`，循环里用的 `services` 也没有从 `res` 里取出来，直接跑会报未定义。这里统一成了 `device_id`，并补上了 `let services = res.services`。

还有一点要提醒，`success` 回调里那句 `return service_id` 其实返回不到外面去。异步回调的返回值没有接收方，真要往下传，得在回调内部继续调用下一步，或者把它包成 Promise。原文这么写只是为了示意，实际项目里不能照抄。

这里有个坑的地方：安卓下如果你知道设备的服务 ID，可以省去 `getBLEDeviceServices` 的过程，但是 iOS 下即使你知道了服务 ID，也不能省去这一步。原因在于 iOS 的 CoreBluetooth 要求先做服务发现，系统内部要建立起这台设备的服务缓存，后续的读写才认。

所以跨端代码的写法只有一种选择：老老实实按完整流程走，别为了安卓上快那么零点几秒去做特殊优化。

### 3.4 获取服务特征值

每个服务都包含了一组特征值，用来描述服务的一些属性，比如是否可读、是否可写、是否可以开启 `notify` 通知等等。跟蓝牙通信时需要这些特征值 ID 来传递数据。

`getBLEDeviceCharacteristics` 方法返回的 res 参数包含以下属性：

![getBLEDeviceCharacteristics 返回的 res 对象字段说明](https://blog-10039692.file.myqcloud.com/1508315210401_5391_1508315234216.png)

其中 `characteristics` 包含了一组特征值列表：

![characteristics 特征值列表的结构与 properties 字段](https://blog-10039692.file.myqcloud.com/1508315221637_8594_1508315245508.png)

每个特征值上都挂着一个 `properties` 对象，里面是四个布尔值：`read`、`write`、`notify`、`indicate`。这四个开关决定了这条特征值能被怎么用，遍历的时候就是靠它们来分类：

```js
wx.getBLEDeviceCharacteristics({
  deviceId: device_id,
  serviceId: service_id,
  success: function (res) {
    let notify_id,write_id,read_id;
    for (let i = 0; i < res.characteristics.length; i++) {
      let charc = res.characteristics[i];
      if (charc.properties.notify) {
        notify_id = charc.uuid;           
      }
      if(charc.properties.write){
        write_id = charc.uuid;
      }
      if(charc.properties.read){
        read_id = charc.uuid;
      }
    }
  },
  fail(res){
    console.log(res); 
  }
})
```

这个例子就通过搜索特征值取到了 `notify` 特征值 ID、写 ID 和读取 ID。

原文这段第三个判断也写的是 `charc.properties.write`，跟上一个条件重复了，`read_id` 实际上拿到的是可写特征值的 UUID。这里改成了 `charc.properties.read`。这种错误的表现是「读一直失败」，但你去看代码，`read_id` 明明有值，很容易在错误的方向上找半天。

顺带说一句，很多设备的读写和通知是分在不同特征值上的，也有设备把 `write` 和 `notify` 放在同一条上。所以别假设它们一定是三条不同的 UUID，按 `properties` 判断才靠谱。

### 3.5 开启 notify 与收发数据

获取特征值 ID 以后就可以开启 `notify` 通知模式，同时开启监听特征值变化消息：

![notifyBLECharacteristicValueChange 的参数与使用说明](https://blog-10039692.file.myqcloud.com/1508315245679_1026_1508315269498.png)

```js
wx.notifyBLECharacteristicValueChange({
  state: true,
  deviceId: device_id,
  serviceId: service_id,
  characteristicId:notify_id,
  complete(res) {
    wx.onBLECharacteristicValueChange(function (res) {
      console.log(arrayBufferToHexString(res.value));
    })
  },
  fail(res){
    console.log(res);
  }
})
```

`notify` 是整个流程的关键一环。蓝牙设备主动推给你的数据，全都从 `onBLECharacteristicValueChange` 这个回调出来，不开 `notify` 就一个字节都收不到，你写过去的指令也永远等不到回复。

`onBLECharacteristicValueChange` 是全局监听，不区分设备和特征值，所有推送都从这一个口子出来。所以回调里应该先看 `res.characteristicId` 判断这是哪条特征值的数据，多设备场景下还要看 `res.deviceId`。同时它只需要注册一次，反复注册会导致同一条消息被处理多遍。

一切都准备好以后，就可以开始给蓝牙发送消息。一旦蓝牙有响应，就可以在 `onBLECharacteristicValueChange` 事件中得到消息并打印出来。

这里面有个坑：开启 notify 以后并不能马上发送消息，蓝牙设备有个准备的过程，需要在 `setTimeout` 中延迟 1 秒以上才能发送，否则会发送失败。

这是全文第二个必须加延时的地方，跟前面开蓝牙那个是同一类问题：系统回调告诉你「好了」，不代表底层真的就绪了。

```js
let buf = hexStringToArrayBuffer("test");
wx.writeBLECharacteristicValue({
  deviceId: device_id,
  serviceId: service_id,
  characteristicId:write_id,
  value: buf,
  success: function (res) {
    console.log(buf);
  },
  fail(res){
    console.log(res);
  }
})
```

写入的 `value` 必须是 `ArrayBuffer`，字符串直接传进去是不行的。所以需要一个反向的转换函数，把十六进制字符串转回二进制：

```js
function hexStringToArrayBuffer(str) {
  if (!str) {
    return new ArrayBuffer(0);
  }
  var buffer = new ArrayBuffer(str.length);
  let dataView = new DataView(buffer)
  let ind = 0;
  for (var i = 0, len = str.length; i < len; i += 2) {
    let code = parseInt(str.substr(i, 2), 16)
    dataView.setUint8(ind, code)
    ind++
  }
  return buffer;
}
```

这个函数有个小瑕疵值得指出来：`new ArrayBuffer(str.length)` 分配的长度是字符串长度，而实际写入的字节数只有一半，因为循环是两个字符转一个字节。结果就是 buffer 后半段全是 0，发给设备的包尾会多出一串零。严谨的写法应该是 `new ArrayBuffer(str.length / 2)`。这个我一开始没注意，是硬件同学抱怨收到的包长度不对才发现的。设备端如果按长度校验，这里就会直接失败。

还有一条硬限制：单次写入有长度上限，一般是 20 字节（受 MTU 约束）。超过这个长度的数据必须自己分包发送，并且包与包之间往往还要留间隔，否则设备来不及处理会丢包。协议设计的时候要把这一条考虑进去。

所有都通信完毕后可以断开连接：

```js
wx.closeBLEConnection({
  deviceId: device_id,
  success(res) {
    console.log(res)
  },
  fail(res) {
    console.log(res)
  }
})
wx.closeBluetoothAdapter({
  success: function (res) {
    console.log(res)
  }
})
```

## 四、两个完整例子

### 4.1 例子一：把流程封装成一个对象

这里为了简洁，把 fail 等异常处理已经省去。主要流程就是设置设备 ID 和服务 ID 的过滤值，在开启 notify 之后写入测试消息，然后监听蓝牙发送过来的消息。整个过程采用简化处理，没有使用事件通信来驱动，仅做参考。

先看配置和入口部分：

```js
let blueApi = {
  cfg:{
    device_info:"AAA",
    server_info:"BBB",
    onOpenNotify:null
  },
  blue_data:{
    device_id:"",
    service_id:"",
    write_id:""
  },
  setCfg(obj){
    this.cfg = Object.assign({},this.cfg,obj);
  },
  connect(){
    if(!wx.openBluetoothAdapter){
      this.showError("当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。");
      return;
    }
    var _this = this;
    wx.openBluetoothAdapter({
      success: function (res) {
      },
      complete(res){
        wx.onBluetoothAdapterStateChange(function(res) {
          if(res.available){
            setTimeout(function(){
              _this.connect();
            },2000);
          }
        })
        _this.getBlueState();        
      }
    })
  },
```

`cfg` 存配置，`blue_data` 存运行过程中拿到的三个 ID。这个拆分很有必要，因为 `device_id`、`service_id`、`write_id` 是一步步异步取回来的，集中放在一个对象里，后面每个方法都能直接读到，不用层层往下传参。

`connect` 开头那句 `if(!wx.openBluetoothAdapter)` 是能力检测。老版本微信没有这个 API，直接调会抛错。这类兜底在硬件类小程序里必须有，用户的微信版本你控制不了。

接着是收发消息和断连：

```js
  //发送消息
  sendMsg(msg,toArrayBuf = true) {
    let _this = this;
    let buf = toArrayBuf ? this.hexStringToArrayBuffer(msg) : msg;
    wx.writeBLECharacteristicValue({
      deviceId: _this.blue_data.device_id,
      serviceId: _this.blue_data.service_id,
      characteristicId:_this.blue_data.write_id,
      value: buf,
      success: function (res) {
        console.log(res);
      }
    })
  },
  //监听消息
  onNotifyChange(callback){
    var _this = this;
    wx.onBLECharacteristicValueChange(function (res) {
      let msg = _this.arrayBufferToHexString(res.value);
      callback && callback(msg);
      console.log(msg);
    })
  },
  disconnect(){
    var _this = this;
    wx.closeBLEConnection({
      deviceId: _this.blue_data.device_id,
      success(res) {
      }
    })
  },
```

`sendMsg` 的第二个参数 `toArrayBuf` 留了个口子，允许直接传已经转好的 `ArrayBuffer` 进来。有些协议的包体是拼出来的，外面已经处理过一遍，就不用再转。

然后是连接设备这一整条链路，从查适配器状态到搜索、连接、取服务、取特征值：

```js
  /*连接设备模块*/
  getBlueState() {
    var _this = this;
    if(_this.blue_data.device_id != ""){
      _this.connectDevice();
      return;
    }

    wx.getBluetoothAdapterState({
      success: function (res) {
        if (!!res && res.available) {//蓝牙可用    
          _this.startSearch();
        }
      }
    })
  },
  startSearch(){
    var _this = this;
    wx.startBluetoothDevicesDiscovery({
      services:[],
      success(res) {
        wx.onBluetoothDeviceFound(function(res){
          var device = _this.filterDevice(res.devices);
          if(device){
            _this.blue_data.device_id = device.deviceId;
            _this.stopSearch();
            _this.connectDevice();
          }
        });
      }
    })
  },
  //连接到设备
  connectDevice(){
    var _this = this;
    wx.createBLEConnection({
      deviceId: _this.blue_data.device_id,
      success(res) {
        _this.getDeviceService();
      }
    })
  }, 
```

`getBlueState` 开头那个判断是个小优化：如果 `device_id` 已经有值，说明之前连过，直接跳到连接那一步，不用重新搜索。二次进入页面时这条能省掉好几秒。

后面是服务发现和特征值发现，逻辑跟第三节讲的一样，只是搬进了对象里：

```js
  //搜索设备服务
  getDeviceService(){
    var _this = this;
    wx.getBLEDeviceServices({
      deviceId: _this.blue_data.device_id,
      success: function (res) {
        var service_id = _this.filterService(res.services);
        if(service_id != ""){
          _this.blue_data.service_id = service_id;
          _this.getDeviceCharacter();
        }
      }
    })
  },
  //获取连接设备的所有特征值  
  getDeviceCharacter() {
    let _this = this;
    wx.getBLEDeviceCharacteristics({
      deviceId: _this.blue_data.device_id,
      serviceId: _this.blue_data.service_id,
      success: function (res) {
        let notify_id,write_id,read_id;
        for (let i = 0; i < res.characteristics.length; i++) {
          let charc = res.characteristics[i];
          if (charc.properties.notify) {
            notify_id = charc.uuid;           
          }
          if(charc.properties.write){
            write_id = charc.uuid;
          }
          if(charc.properties.read){
            read_id = charc.uuid;
          }
        }          
        if(notify_id != null && write_id != null){
          _this.blue_data.notify_id = notify_id;
          _this.blue_data.write_id = write_id;
          _this.blue_data.read_id = read_id;

          _this.openNotify();
        }
      }
    })
  },
```

`openNotify` 是最后一环，注意里面那个 1 秒延时，就是前面说的必须等设备准备好：

```js
  openNotify(){
    var _this = this;
    wx.notifyBLECharacteristicValueChange({
        state: true,
        deviceId: _this.blue_data.device_id,
        serviceId: _this.blue_data.service_id,
        characteristicId: _this.blue_data.notify_id,
        complete(res) {
          setTimeout(function(){
            _this.cfg.onOpenNotify && _this.cfg.onOpenNotify();
          },1000);
          _this.onNotifyChange();//接受消息
        }
    })
  },
```

原文这里写的是 `_this.onOpenNotify`，但这个回调是通过 `setCfg` 存进 `cfg` 里的，直接从 `_this` 上取永远是 undefined，配好的回调根本不会执行。改成了 `_this.cfg.onOpenNotify`。

最后是辅助模块，停止搜索和两个转换函数，再加上两个过滤器：

```js
  /*其他辅助模块*/
  //停止搜索周边设备  
  stopSearch() {
    var _this = this;
    wx.stopBluetoothDevicesDiscovery({
      success: function (res) {
      }
    })
  },  
  arrayBufferToHexString(buffer) {
    let bufferType = Object.prototype.toString.call(buffer)
    if (bufferType != '[object ArrayBuffer]') {
      return
    }
    let dataView = new DataView(buffer)

    var hexStr = '';
    for (var i = 0; i < dataView.byteLength; i++) {
      var str = dataView.getUint8(i);
      var hex = (str & 0xff).toString(16);
      hex = (hex.length === 1) ? '0' + hex : hex;
      hexStr += hex;
    }

    return hexStr.toUpperCase();
  },
  hexStringToArrayBuffer(str) {
    if (!str) {
      return new ArrayBuffer(0);
    }

    var buffer = new ArrayBuffer(str.length);
    let dataView = new DataView(buffer)

    let ind = 0;
    for (var i = 0, len = str.length; i < len; i += 2) {
      let code = parseInt(str.substr(i, 2), 16)
      dataView.setUint8(ind, code)
      ind++
    }

    return buffer;
  },
```

两个过滤器决定了哪台设备、哪个服务才是你要的：

```js
  //过滤目标设备
  filterDevice(devices){
    for(let i = 0;i<devices.length;i++){
      let device = devices[i];
      var data = this.arrayBufferToHexString(device.advertisData);
      if (data && data.indexOf(this.cfg.device_info.substr(4).toUpperCase()) > -1) {
        return { name: device.name, deviceId: device.deviceId }
      }
    }
    return null;
  },
  //过滤主服务
  filterService(services){
    let service_id = "";
    for(let i = 0;i<services.length;i++){
      if(services[i].uuid.toUpperCase().indexOf(this.cfg.server_info) != -1){
        service_id = services[i].uuid;
        break;
      }
    }

    return service_id;
  }
  /*其他辅助模块*/
}
```

这两个函数原文里有几处对不上，一并说明。原始的 `filterDevice` 接收的参数名是 `device`（单数），但调用处传的是 `res.devices` 数组，直接取 `device.advertisData` 拿不到东西，这里改成了遍历数组。配置项读的是 `this.device_info` 和 `this.server_info`，实际它们存在 `this.cfg` 下面，改成了 `this.cfg.xxx`。另外 `hexStringToArrayBuffer` 结束的花括号后面漏了逗号，对象字面量在那里就断了，也补上了。

最后是调用方式：

```js
blueApi.setCfg({  
    device_info:"AAA",
    server_info:"BBB",
    onOpenNotify:function(){
      blueApi.sendMsg("test");
    }
})
blueApi.connect();
blueApi.onNotifyChange(function(msg){
  console.log(msg);
})
```

这套写法的问题也很明显：回调套了六七层，任何一步失败都没有统一的错误出口。真做产品的话，我建议把每个 `wx.xxx` 用 Promise 包一层，再用 `async/await` 把流程拉平，读起来会清爽很多，异常也能用 `try/catch` 统一接住。原文这个版本胜在直白，适合先照着跑通再重构。

### 4.2 例子二：带设备列表的页面

上一个例子是「已知目标设备，自动连上去」。这个例子是另一种常见形态：把搜到的设备都列出来，让用户自己点一个连。做调试工具或者面向多台设备的场景，用这种。

先看页面数据和搜索开关：

```js
const app = getApp()
Page({
  data: {
    searching: false,
    devicesList: []
  },
  Search: function () {
    var that = this
    if (!that.data.searching) {
      wx.closeBluetoothAdapter({
        complete: function (res) {
          console.log(res)
          wx.openBluetoothAdapter({
            success: function (res) {
              console.log(res)
              wx.getBluetoothAdapterState({
                success: function (res) {
                  console.log(res)
                }
              })
              wx.startBluetoothDevicesDiscovery({
                allowDuplicatesKey: false,
                success: function (res) {
                  console.log(res)
                  that.setData({
                    searching: true,
                    devicesList: []
                  })
                }
              })
            },
            fail: function (res) {
              console.log(res)
              wx.showModal({
                title: '提示',
                content: '请检查手机蓝牙是否打开',
                showCancel: false,
                success: function (res) {
                  that.setData({
                    searching: false
                  })
                }
              })
            }
          })
        }
      })
    }
    else {
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          console.log(res)
          that.setData({
            searching: false
          })
        }
      })
    }
  },
```

这段开头那个 `wx.closeBluetoothAdapter` 很值得学。每次搜索之前先把适配器关掉再重开，等于把上一轮的所有状态清干净。蓝牙这块的状态残留特别容易出问题，上次没断干净的连接、没停掉的搜索，都会影响这一次。先关再开虽然多花几百毫秒，但省掉的排查时间远不止这些。

`allowDuplicatesKey: false` 表示同一台设备只上报一次。开成 true 的话，同一台设备会随着广播包不断重复上报，好处是能拿到实时的信号强度用来做距离判断，坏处是回调触发得非常频繁，去重逻辑写不好页面就卡住了。

`fail` 里那个 `showModal` 也别省。用户没开蓝牙是最高频的失败原因，直接弹窗提示比在控制台打日志有用得多。

然后是连接逻辑：

```js
  Connect: function (e) {
    var that = this
    var advertisData, name
    console.log(e.currentTarget.id)
    for (var i = 0; i < that.data.devicesList.length; i++) {
      if (e.currentTarget.id == that.data.devicesList[i].deviceId) {
        name = that.data.devicesList[i].name
        advertisData = that.data.devicesList[i].advertisData
      }
    }
    wx.stopBluetoothDevicesDiscovery({
      success: function (res) {
        console.log(res)
        that.setData({
          searching: false
        })
      }
    })
    wx.showLoading({
      title: '连接蓝牙设备中...',
    })
    wx.createBLEConnection({
      deviceId: e.currentTarget.id,
      success: function (res) {
        console.log(res)
        wx.hideLoading()
        wx.showToast({
          title: '连接成功',
          icon: 'success',
          duration: 1000
        })
        wx.navigateTo({
          url: '../device/device?connectedDeviceId=' + e.currentTarget.id + '&name=' + name
        })
      },
      fail: function (res) {
        console.log(res)
        wx.hideLoading()
        wx.showModal({
          title: '提示',
          content: '连接失败',
          showCancel: false
        })
      }
    })
  },
```

注意连接之前先调了 `stopBluetoothDevicesDiscovery`。搜索和连接同时进行会互相抢资源，安卓上表现为连接超时的概率大幅上升。这一步不是可选的礼貌行为，是必需的。

`showLoading` 加 `hideLoading` 的配对也要留意。蓝牙连接可能要好几秒，中间没有任何反馈用户会以为点空了，然后连着点好几下，每一下都发起一次连接请求，情况只会更糟。

接着是页面加载时挂的两个监听，先看适配器状态：

```js
  onLoad: function (options) {
    var that = this
    var list_height = ((app.globalData.SystemInfo.windowHeight - 50) * (750 / app.globalData.SystemInfo.windowWidth)) - 60
    that.setData({
      list_height: list_height
    })
    wx.onBluetoothAdapterStateChange(function (res) {
      console.log(res)
      that.setData({
        searching: res.discovering
      })
      if (!res.available) {
        that.setData({
          searching: false
        })
      }
    })
```

那句 `list_height` 的计算是把设备的可用高度换算成 rpx 单位，减掉的 50 和 60 分别是顶部和底部固定区域的高度。列表要撑满屏幕又要能滚动，就得手动算一下。

`onBluetoothAdapterStateChange` 除了用来感知用户开关蓝牙，还能同步搜索状态。`res.discovering` 直接告诉你系统层面是不是还在搜索中，比自己维护一个标志位可靠。

然后是设备发现的回调，这段的核心是去重和兼容：

```js
    wx.onBluetoothDeviceFound(function (devices) {
      //剔除重复设备，兼容不同设备API的不同返回值
      var isnotexist = true
      if (devices.deviceId) {
        if (devices.advertisData)
        {
          devices.advertisData = app.buf2hex(devices.advertisData)
        }
        else
        {
          devices.advertisData = ''
        }
        console.log(devices)
        for (var i = 0; i < that.data.devicesList.length; i++) {
          if (devices.deviceId == that.data.devicesList[i].deviceId) {
            isnotexist = false
          }
        }
        if (isnotexist) {
          that.data.devicesList.push(devices)
        }
      }
```

这里的三段分支不是写着玩的。不同版本的基础库、不同机型上，`onBluetoothDeviceFound` 回调的参数结构真的不一样：有时候是一个设备对象，有时候是 `{ devices: [...] }`，有时候直接就是一个数组。所以要三种都兼容。

这大概率你也遇过，代码在自己手机上跑得好好的，换台安卓机就报「读取 undefined 的属性」。

剩下两个分支和收尾：

```js
      else if (devices.devices) {
        if (devices.devices[0].advertisData)
        {
          devices.devices[0].advertisData = app.buf2hex(devices.devices[0].advertisData)
        }
        else
        {
          devices.devices[0].advertisData = ''
        }
        console.log(devices.devices[0])
        for (var i = 0; i < that.data.devicesList.length; i++) {
          if (devices.devices[0].deviceId == that.data.devicesList[i].deviceId) {
            isnotexist = false
          }
        }
        if (isnotexist) {
          that.data.devicesList.push(devices.devices[0])
        }
      }
      else if (devices[0]) {
        if (devices[0].advertisData)
        {
          devices[0].advertisData = app.buf2hex(devices[0].advertisData)
        }
        else
        {
          devices[0].advertisData = ''
        }
        console.log(devices[0])
        for (var i = 0; i < that.data.devicesList.length; i++) {
          if (devices[0].deviceId == that.data.devicesList[i].deviceId) {
            isnotexist = false
          }
        }
        if (isnotexist) {
          that.data.devicesList.push(devices[0])
        }
      }
      that.setData({
        devicesList: that.data.devicesList
      })
    })
  },
```

第三个分支里，原文写的是 `for (var i = 0; i < devices_list.length; i++)`，而 `devices_list` 这个变量在整段代码里根本没有定义过，走到这条分支就会直接抛错。这里改成了跟前两个分支一致的 `that.data.devicesList.length`。

去重的写法也可以优化。三段几乎一样的循环，抽成一个函数会好维护得多；数据量大的时候用 `Set` 存已见过的 `deviceId`，比每次线性查找快。原文这个版本胜在结构直白，你能一眼看出它在兼容什么。

最后是几个生命周期，重点是离开页面时收尾：

```js
  onReady: function () {

  },
  onShow: function () {
    
  },
  onHide: function () {
    var that = this
    that.setData({
      devicesList: []
    })
    if (this.data.searching) {
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          console.log(res)
          that.setData({
            searching: false
          })
        }
      })
    }
  }
})
```

`onHide` 里停搜索这一步别省。搜索是很耗电的操作，用户切走了还在后台扫，手机会明显发烫，用户下次就把你的小程序删了。

## 五、踩坑清单

### 5.1 等待响应

很多情况下需要等待设备响应，尤其在 iOS 环境下，比如：

- 监听到蓝牙开启后，不能马上开始搜索，需要等待 2 秒
- 开启 notify 以后，不能马上发送消息，需要等待 1 秒

这两条是全文最实在的经验。它们背后是同一个道理：系统 API 的回调只代表「指令下发成功」，不代表「硬件层面就绪」。BLE 的连接建立、服务发现、特征值订阅，在协议栈里都还有后续的握手动作要走完。

这个延时值不是标准，我这边测下来 2 秒和 1 秒能覆盖大部分机型，低端安卓机上可能还得再放宽。稳妥的做法是不要硬等，而是加上重试：先试一次，失败了隔一段再试，试三次还不行才报错给用户。

### 5.2 MAC 和 UUID

安卓的 MAC 地址是可以获取到的，所以设备的 ID 是固定的；但是 iOS 获取不到 MAC 地址，只能获取设备的 UUID，而且是动态的，所以需要使用其他方法来查询。

「动态的」这三个字要特别当心。iOS 上同一台设备，卸载重装小程序之后 `deviceId` 可能就变了。所以千万别把 `deviceId` 存到服务端当作设备的唯一标识，那个字段只在本机、本次安装的范围内有意义。真正的设备唯一标识要么让硬件在广播包里带上，要么连上之后从某个特征值里读出来。

### 5.3 iOS 下只有搜索可以省略

如果你知道了设备的 ID、服务 ID 和各种特征值 ID，在安卓下可以直接连接然后发送消息，省去搜索设备、搜索服务和搜索特征值的过程；但是在 iOS 下只能指定设备 ID 连接，后面的过程是不能省略的。

所以写跨端代码时不要做这类优化，统一走全流程，安卓上多花的那点时间完全值得。

### 5.4 监听到的消息要进行过滤处理

有些设备会抽风一样的发送同样的消息，需要在处理逻辑里面去重。

去重的维度要按业务定。有些协议里同样的数据包连发三次是设计好的重传机制，你要按包序号去重；有些是设备固件的 bug，那就按内容加时间窗口去重。别一上来就无脑按内容去重，会把正常的连续相同读数（比如心率连续三秒都是 72）给吃掉。

### 5.5 操作完成后要及时关闭连接

同时也要关闭蓝牙适配器，否则安卓下再次进入会搜索不到设备，除非关闭小程序进程再进才可以，iOS 不受影响。

```js
wx.closeBLEConnection({
  deviceId: _this.blue_data.device_id,
  success(res) {
  },
  fail(res) {
  }
})
wx.closeBluetoothAdapter({
  success(res){
  },
  fail(res){
  }
})
```

这两个调用建议直接挂在页面的 `onUnload` 里，别指望用户走正常路径退出。

除了以上的常见问题，你还需要处理很多异常情况，比如蓝牙中途关闭、网络断开、GPS 未开启等等。和硬件设备打交道跟纯 UI 交互还是有很大的差别的。

GPS 那条单独说一句，安卓 6.0 之后系统把蓝牙扫描归到了位置权限下面，定位服务没开就是扫不到设备，而且报错信息跟位置一点关系都没有。这个坑我排查了一下午，最后是在一台测试机上顺手打开定位才发现的。安卓端做蓝牙功能，用户引导里一定要带上「请打开定位」这一句。

## 六、ArrayBuffer 和二进制数据

蓝牙传的全是字节，所以绕不开 `ArrayBuffer`。这块单独说清楚。

`ArrayBuffer` 是类型化数组，JavaScript 操作二进制数据的一个接口。它最早是为 WebGL 设计的。WebGL 指浏览器与显卡之间的通信接口，为了满足 JavaScript 与显卡之间大量的、实时的数据交换，它们之间的数据通信必须是二进制的，而不能是传统的文本格式。比如以文本格式传递一个 32 位整数，两端的 JavaScript 脚本与显卡都要进行格式转化，将非常耗时。这时要是存在一种机制，可以像 C 语言那样直接操作字节，然后将 4 个字节的 32 位整数以二进制形式原封不动地送入显卡，脚本的性能就会大幅提升。

类型化数组（Typed Array）就是在这种背景下诞生的。它很像 C 语言的数组，允许开发者以数组下标的形式直接操作内存。有了类型化数组以后，JavaScript 的二进制数据处理功能增强了很多，接口之间完全可以用二进制数据通信。

`ArrayBuffer` 作为内存区域，可以存放多种类型的数据。不同数据有不同的存储方式，这就叫做「视图」。目前 JavaScript 提供以下类型的视图：

- `Int8Array`：8 位有符号整数，长度 1 个字节
- `Uint8Array`：8 位无符号整数，长度 1 个字节
- `Int16Array`：16 位有符号整数，长度 2 个字节
- `Uint16Array`：16 位无符号整数，长度 2 个字节
- `Int32Array`：32 位有符号整数，长度 4 个字节
- `Uint32Array`：32 位无符号整数，长度 4 个字节
- `Float32Array`：32 位浮点数，长度 4 个字节
- `Float64Array`：64 位浮点数，长度 8 个字节

（原文最后一条写的是「长度 8 个字」，漏了一个「节」字，这里补上。）

蓝牙场景下用得最多的是 `Uint8Array` 和 `DataView`，因为协议是按字节定义的。这两者的区别在于字节序：`Uint8Array` 单字节没有字节序问题，但当你要读一个 16 位或 32 位的值时，`DataView` 可以显式指定大端还是小端，而 `Uint8Array` 之类的类型化数组跟着运行环境走。

硬件协议里多字节数值的字节序是个高频翻车点。文档上写着温度是两个字节，你按小端读出来是 2560，按大端读出来是 10，差了两个数量级。碰到读出来的数字离谱得不像话，先怀疑字节序，再怀疑硬件。

## 七、设备唯一标识怎么选

客户端要产生一个唯一的标识符，常见的有三个来源：`deviceId`、MAC 地址、AndroidId。

**AndroidId**

获取 AndroidId 是不需要权限的，但是 AndroidId 是可能变的。它在用户第一次激活这个设备时产生，所以当用户重置手机时 AndroidId 会产生变化。理论上这个 AndroidId 是可以接受的，毕竟重置手机这事发生也不会太频繁。

**MAC 地址**

可以使用 WIFI 的 MAC 地址来作为标识符，感觉现阶段这种方式比较可靠。MAC 地址是唯一的，直接产生在硬件上基本上不会变更。

**DeviceId**

区别设备的唯一设备 ID。

这三条是原文的记录，放在今天要补一句：出于隐私保护，各家系统对这类硬件标识的获取一直在收紧，能不能拿到、拿到的值稳不稳定，都跟系统版本强相关。做设备绑定这类功能，更稳的路子是自己在服务端生成一个 ID 下发给设备或者存在本地，不要依赖系统给的硬件标识。

## 八、GATT 术语速查

这几个词在硬件同学的文档里天天出现，不搞清楚会沟通不上。

**profile**

profile 可以理解为一种规范，一个标准的通信协议，它存在于从机中。蓝牙组织规定了一些标准的 profile，例如 HID OVER GATT、防丢器、心率计等。每个 profile 中会包含多个 service，每个 service 代表从机的一种能力。蓝牙设备可以包括多个 profile，一个 profile 中有多个 service。

**service 服务**

service 可以理解为一个服务。在 BLE 从机中通常有多个服务，例如电量信息服务、系统信息服务等，每个 service 中又包含多个 characteristic 特征值。每个具体的 characteristic 特征值才是 BLE 通信的主题。比如当前的电量是 80%，这个值会通过电量的 characteristic 存在从机的 profile 里，这样主机就可以通过这个 characteristic 来读取 80% 这个数据。一个 service 中有多个 characteristic。

**characteristic 特征**

characteristic 特征值，例如 read、notify、write 等特征。BLE 主从机的通信均是通过 characteristic 的 read、write 来实现，可以理解为一个标签，通过这个标签可以获取或者写入想要的内容。

**UUID**

- UUID 是统一识别码，我们刚才提到的 service 和 characteristic 都需要一个唯一的 UUID 来标识
- 每个从机都会有一个叫做 profile 的东西存在，不管是自定义的 simpleprofile，还是标准的防丢器 profile，它们都由一系列 service 组成，每个 service 又包含了多个 characteristic，主机和从机之间的通信均是通过 characteristic 来实现
- 实际产品中，每个蓝牙 4.0 的设备都是通过服务和特征来展示自己的，服务和特征都是用 UUID 来唯一标识的。一个设备必然包含一个或多个服务，每个服务下面又包含若干个特征。特征是与外界交互的最小单位。蓝牙设备硬件厂商通常都会提供他们的设备里面各个服务（service）和特征（characteristics）的功能，比如哪些是用来交互（读写）、哪些可获取模块信息（只读）等。比如说一台蓝牙 4.0 设备，用特征 A 来描述自己的出厂信息，用特征 B 来收发数据

回到我们要解决的问题，前面代码里那个「遍历特征值找 notify、write、read」的动作，做的就是在把硬件文档上的这套结构映射成代码里的三个变量。硬件同学如果直接把 UUID 给你了，那一步其实可以省，但前面说过 iOS 上不能省，所以照样得走。

## 九、这篇写于 2019 年，有几处需要更新

小程序的蓝牙 API 这几年一直在补，原文这 18 个还在，但不止这些了。后来增加的能力大致有几类：调整 MTU 以支持更长的单次传输、读取设备信号强度用来估算距离、让小程序本身作为外围设备被别人连接，还有蓝牙信标相关的接口。具体的方法名和参数我就不在这里列了，以你项目基础库版本对应的官方文档为准，免得记错。

权限和合规这块变化更大。安卓端从系统层面把蓝牙扫描和位置权限绑在了一起；小程序这边则增加了隐私接口的声明要求，涉及用户信息和设备信息的接口需要在配置里声明并获得用户同意，否则会调用失败。这部分规则更新得比较频繁，上线前务必对一遍当时的官方公告。

流程本身倒是没怎么变。开适配器、搜设备、连设备、找服务、找特征值、开 notify、收发数据、断连，这八九步的顺序还是老样子，本文的代码骨架照样能跑通。要改的主要是那些回调写法，现在完全可以用 Promise 加 `async/await` 重写一遍，读起来会好很多。

小程序开发的整体知识，可以看我另一篇 [微信小程序开发总结](https://feinterview.poetries.top/blog/wx-weapp-summary)；如果你的项目是 React Native 而不是小程序，蓝牙这块的做法可以参考 [React Native 蓝牙开发](https://feinterview.poetries.top/blog/rn-ble)，概念是通用的，差别只在 API 层。

## 总结

蓝牙开发跟写业务页面最大的不同，是你面对的不再是一个确定性的系统。同样一段代码，安卓上跑通了 iOS 上未必通，这台手机上通了那台未必通，甚至同一台手机连续跑两次结果都不一样。

所以我总结下来最有用的三条经验是这样的。

第一，永远按完整流程走。开适配器、搜索、连接、取服务、取特征值、开 notify，一步都别跳，安卓上能省的那点时间在 iOS 上会加倍还回来。

第二，该等的地方一定要等。蓝牙状态可用之后等 2 秒再搜，开完 notify 等 1 秒再发，这两个延时不是玄学，是协议栈还没准备好。稳妥的做法是把硬等换成带次数上限的重试。

第三，所有资源都要显式释放。搜到设备就停搜索，用完就断连接，离开页面就关适配器。安卓上不关适配器，下次进来会直接搜不到设备，而这个现象跟你的代码看起来毫无关系。

最后提一句最容易被忽略的：`deviceId` 在 iOS 上是会变的，别拿它当设备的永久标识存到数据库里。这个坑要等到用户重装小程序之后才会暴露，而那时候你已经上线很久了。

## 参考

- [微信小程序蓝牙 API 文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.openBluetoothAdapter.html)
- [MDN ArrayBuffer](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
- [MDN DataView](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/DataView)
- [Bluetooth SIG 官方规范](https://www.bluetooth.com/specifications/)
- [前端进阶之旅](https://interview.poetries.top)
