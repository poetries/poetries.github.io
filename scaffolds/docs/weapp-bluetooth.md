---
title: 小程序蓝牙记录
date: 2019-08-31 16:50:32
tags: 
  - 小程序
  - 蓝牙
categories: Front-End
---

## 一、背景介绍

> 蓝牙是爱立信公司创立的一种无线技术标准，为短距离的硬件设备提供低成本的通信规范。蓝牙规范由蓝牙技术联盟（Bluetooth Special Interest Group，简称SIG）管理，在计算机，手机，传真机，耳机，汽车，家用电器等等很多场景广泛使用。蓝牙具有以下一些特点

- 免费使用：使用的工作频段在2.4GHz的工科医（ISM）频段，无需申请许可证。
- 功耗低：BLE4.0包含了一个低功耗标准(Bluetooth Low Energy)，可以让蓝牙的功耗显著降低
- 安全性高：蓝牙规范提供了一套安全加密机制和授权机制，可以有效防范数据被窃取
- 传输率高：目前最新BLE4.0版本，理论传输速率可达3Mbit/s(实际肯定达不到)，理论覆盖范围可达100米

## 二、小程序蓝牙介绍

### 2.1 介绍 

> 小程序API提供了一套蓝牙操作接口，所以作为我们前端开发人员可以更加方便的进行蓝牙设备开发，而无需了解安卓和IOS的各种蓝牙底层概念。小程序的蓝牙操作大多都是通过异步调用来处理的，这里面就存在着一些坑，后面会详细介绍。在使用小程序蓝牙API之前有几个概念或者说术语需要预先了解

- 蓝牙终端：我们常说的硬件设备，包括手机，电脑等等。
- UUID:是由子母和数字组成的40个字符串的序号,根据硬件设备有关联的唯一ID
- 设备地址：每个蓝牙设备都有一个设备地址deviceId，但是安卓和IOS差别很大，安卓下设备地址就是mac地址，但是IOS无法获取mac地址，所以设备地址是针对本机范围有效的UUID，所以这里需要注意
- 设备服务列表：每个设备都存在一些服务列表，可以跟不同的设备进行通信，服务有一个serviceId来维护，每个服务包含了一组特征值
- 服务特征值：包含一个单独的value值和0 –n个用来描述characteristic 值（value）的descriptors。一个characteristics可以被认为是一种类型的，类似于一个类
- ArrayBuffer:小程序中对蓝牙数据的传递是使用ArrayBuffer的二进制类型来的，所以在我们的使用过程中需要进行转码

![](https://blog-10039692.file.myqcloud.com/1508314805462_3727_1508314829406.png)

### 2.2 API总览

> 小程序对蓝牙设备的操作有18个API

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

### 2.3 主要流程

> 蓝牙通信的一个正常流程是下面的图示

![](https://blog-10039692.file.myqcloud.com/1508314916535_7138_1508314940423.png)

1. 开启蓝牙：调用`openBluetoothAdapter`来开启和初始化蓝牙，这个时候可以根据状态判断用户设备是否支持蓝牙
2. 检查蓝牙状态：调用`getBluetoothAdapterState`来检查蓝牙是否开启，如果没有开启可以在这里提醒用户开启蓝牙，并且能在开启后自动启动下面的步骤

> 这里有一个坑：IOS里面蓝牙状态变化以后不能马上开始搜索，否则会搜索不到设备，必须要等待2秒以上。

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

3. 搜索设备：`startBluetoothDevicesDiscovery`开始搜索设备，当发现一个设备会触发`onBluetoothDeviceFound`事件，首先看下标准API

![](https://blog-10039692.file.myqcloud.com/1508314941142_8213_1508314965035.png)

**由于IOS无法获取Mac地址所以这里需要区分两个场景**

1. 安卓：安卓下可以根据`Mac`地址来搜索设备，或者跳过此步直接连接到设备。当搜索到一个设备以后，可以在`onBluetoothDeviceFound`事件回调中判断当前设备的`deviceID`是否为指定的`Mac`地址

```js
let mac = "XXXXXXXXXXXXXXX";
wx.startBluetoothDevicesDiscovery({
  services:[],
  success(res) {
    wx.onBluetoothDeviceFound(res=>{
        let devices = res.devices;
        for(let i = 0;i<devices.length;i++){
          if(devices[i].deviceId = mac){
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

2. IOS：IOS下获取设备Mac地址的方法已经被屏蔽，所以不存在mac地址，此时只能通过其他方式来判断，比如在蓝牙设备advertisData字段添加一些特别的信息来判断等等，可以转字符串来判断，也可以直接用二进制来判断

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
function arrayBufferToHexString(buffer) {
  let bufferType = Object.prototype.toString.call(buffer)
  if (buffer != '[object ArrayBuffer]') {
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
****
  return hexStr.toUpperCase();
}
```

> 这里需要注意的是：如果知道mac地址在安卓下可以直接略过搜索过程直接连接，如果不知道mac地址或者是IOS场景下需要开启搜索，由于搜索是比较消耗资源的动作，所以发现目标设备以后一定要及时关闭搜索，以节省系统消耗

4. 搜索到设备以后，就是连接设备`createBLEConnection`
5. 连接成功以后就开始查询设备的服务列表：`getBLEDeviceServices`，然后根据目标服务ID或者标识符来找到指定的服务`ID`

```js
let deviceId = "XXXX";
wx.getBLEDeviceServices({
  deviceId: device_id,
  success: function (res) {        
    let service_id = "";
    for(let i = 0;i<res.services.length;i++){
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

> 这里有个坑的地方：如果是安卓下如果你知道设备的服务ID，你可以省去`getBLEDeviceServices`的过程，但是`IOS`下即使你知道了服务ID，也不能省去`getBLEDeviceServices`的过程，这是小程序里面需要注意的一点

6. 获取服务特征值：每个服务都包含了一组特征值用来描述服务的一些属性，比如是否可读，是否可写，是否可以开启`notify`通知等等，当你跟蓝牙通信时需要这些特征值ID来传递数据

> `getBLEDeviceCharacteristics`方法返回了res参数包含了以下属性

![](https://blog-10039692.file.myqcloud.com/1508315210401_5391_1508315234216.png)

> `characteristics`包含了一组特征值列表

![](https://blog-10039692.file.myqcloud.com/1508315221637_8594_1508315245508.png)

> 通过遍历特征值对象来获取想要的特征值ID

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
      if(charc.properties.write){
        read_id = charc.uuid;
      }
    }
  },
  fail(res){
    console.log(res); 
  }
})
```

> 这个例子就通过搜索特征值取到了 `notify`特征值`ID`，写`ID`和读取`ID`

7. 获取特征值ID以后就可以开启`notify`通知模式，同时开启监听特征值变化消息

![](https://blog-10039692.file.myqcloud.com/1508315245679_1026_1508315269498.png)

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

8. 一切都准备好以后，就可以开始给蓝牙发送消息，一旦蓝牙有响应，就可以在`onBLECharacteristicValueChange`事件中得到消息并打印出来

> 这里面有个坑：开启notify以后并不能马上发送消息，蓝牙设备有个准备的过程，需要在setTimeout中延迟1秒以上才能发送，否则会发送失败


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

9. 所有都通信完毕后可以断开连接:

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

### 2.4 完整例子

**例子1**

> 这里为了简洁，把fail等异常处理已经省去，主要流程就是设置设备ID和服务ID的过滤值，在开启notify之后写入测试消息，然后监听蓝牙发送过来的消息，整个过程采用简化处理，没有使用事件通信来驱动，仅做参考

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
  /*事件通信模块*/

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
          if(charc.properties.write){
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
  openNotify(){
    var _this = this;
    wx.notifyBLECharacteristicValueChange({
        state: true,
        deviceId: _this.blue_data.device_id,
        serviceId: _this.blue_data.service_id,
        characteristicId: _this.blue_data.notify_id,
        complete(res) {
          setTimeout(function(){
            _this.onOpenNotify && _this.onOpenNotify();
          },1000);
          _this.onNotifyChange();//接受消息
        }
    })
  },
  /*连接设备模块*/


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
    if (buffer != '[object ArrayBuffer]') {
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
  }
  //过滤目标设备
  filterDevice(device){
    var data = blueApi.arrayBufferToHexString(device.advertisData);
    if (data && data.indexOf(this.device_info.substr(4).toUpperCase()) > -1) {
        var obj = { name: device.name, deviceId: device.deviceId }
        return obj
    }
    else{
      return null;
    }
  },
  //过滤主服务
  filterService(services){
    let service_id = "";
    for(let i = 0;i<services.length;i++){
      if(services[i].uuid.toUpperCase().indexOf(this.server_info) != -1){
        service_id = services[i].uuid;
        break;
      }
    }

    return service_id;
  }
  /*其他辅助模块*/
}

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

**例子2**

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
        for (var i = 0; i < devices_list.length; i++) {
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

### 2.5 跳坑总结

**1. 等待响应：很多情况下需要等待设备响应，尤其在IOS环境下，比如**

- 监听到蓝牙开启后，不能马上开始搜索，需要等待2秒
- 开启notify以后，不能马上发送消息，需要等待1秒

**2. Mac和UUID**

> 安卓的mac地址是可以获取到的所以设备的ID是固定的，但是IOS是获取不到MAC地址的，只能获取设备的UUID，而且是动态的，所以需要使用其他方法来查询

**3. IOS下只有搜索可以省略**

> 如果你知道了设备的ID，服务ID和各种特征值ID，在安卓下可以直接连接，然后发送消息，省去搜索设备，搜索服务和搜索特征值的过程，但是在IOS下，只能指定设备ID连接，后面的过程是不能省略的。

**4. 监听到的消息要进行过滤处理**

> 有些设备会抽风一样的发送同样的消息，需要在处理逻辑里面去重。

**5.  操作完成后要及时关闭连接**

> 同时也要关闭蓝牙设备，否则安卓下再次进入会搜索不到设备除非关闭小程序进程再进才可以，IOS不受影响。


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

> 除了以上的常见问题，你还需要处理很多异常情况，比如蓝牙中途关闭，网络断开，GPS未开启等等场景，总之和硬件设备打交道跟纯UI交互还是有很大的差别的


## 三、其他知识

**硬件字节**

> **ArrayBuffer**：类型化数组，JavaScript操作二进制数据的一个接口。 WebGL，指浏览器与显卡之间的通信接口，为了满足JavaScript与显卡之间大量的、实时的数据交换，它们之间的数据通信必须是二进制的，而不能是传统的文本格式。 比如，以文本格式传递一个32位整数，两端的JavaScript脚本与显卡都要进行格式转化，将非常耗时。这时要是存在一种机制，可以像C语言那样，直接操作字节，然后将4个字节的32位整数，以二进制形式原封不动地送入显卡，脚本的性能就会大幅提升。 类型化数组（Typed Array）就是在这种背景下诞生的。它很像C语言的数组，允许开发者以数组下标的形式，直接操作内存。有了类型化数组以后，JavaScript的二进制数据处理功能增强了很多，接口之间完全可以用二进制数据通信

> `ArrayBuffer`作为内存区域，可以存放多种类型的数据。不同数据有不同的存储方式，这就叫做“视图”。目前，JavaScript提供以下类型的视图：

- `Int8Array`：8位有符号整数，长度1个字节。
- `Uint8Array`：8位无符号整数，长度1个字节。
- `Int16Array`：16位有符号整数，长度2个字节。
- `Uint16Array`：16位无符号整数，长度2个字节。
- `Int32Array`：32位有符号整数，长度4个字节。
- `Uint32Array`：32位无符号整数，长度4个字节。
- `Float32Array`：32位浮点数，长度4个字节。
- `Float64Array`：64位浮点数，长度8个字

**客户端要产生一个唯一的标识符：deviceId、MAC地址、AndroidId：**

**AndroidId**

> 获取AndroidId是不需要权限的但是AndroidId是可能变的，AndroidId是在用户第一次激活这个设备时产生的所以当用户重置手机时AndroidId会产生变化，理论上这个AndroidId是可以接受的毕竟重置手机这个事发生也不会太频繁

**MAC地址：**

> 可以使用WIFI的MAC地址来作为标识符，感觉现阶段这种方式比较可靠总结如下：Mac地址是唯一的，直接产生在硬件上基本上不会变更；

**DeviceId**

> 区别设备唯一设备ID。

**其他**

1. profile

> profile可以理解为一种规范，一个标准的通信协议，它存在于从机中。蓝牙组织规定了一些标准的profile，例如 HID OVER GATT ，防丢器 ，心率计等。每个profile中会包含多个service，每个service代表从机的一种能力。蓝牙设备可以包括多个Profile，一个Profile中有多个Service，

2. service服务

> service可以理解为一个服务，在ble从机中，通过有多个服务，例如电量信息服务、系统信息服务等，每个service中又包含多个characteristic特征值。每个具体的characteristic特征值才是ble通信的主题。比如当前的电量是80%，所以会通过电量的characteristic特征值存在从机的profile里，这样主机就可以通过这个characteristic来读取80%这个数据；一个Service中有多个Characteristic

3. characteristic特征

> characteristic特征值，例如：read、notify、write等特征…；ble主从机的通信均是通过characteristic的read、write来实现，可以 理解为一个标签，通过这个标签可以获取或者写入想要的内容

4. UUID

- UUID，统一识别码，我们刚才提到的service和characteristic，都需要一个唯一的uuid来标识
- 每个从机都会有一个叫做profile的东西存在，不管是上面的自定义的simpleprofile，还是标准的防丢器profile，他们都是由一些列service组成，然后每个service又包含了多个characteristic，主机和从机之间的通信，均是通过characteristic来实现。
- 实际产品中，每个蓝牙4.0的设备都是通过服务和特征来展示自己的，服务和特征都是用UUID来唯一标识的。一个设备必然包含一个或多个服务，每个服务下面又包含若干个特征。特征是与外界交互的最小单位。蓝牙设备硬件厂商通常都会提供他们的设备里面各个服务(service)和特征(characteristics)的功能，比如哪些是用来交互(读写)，哪些可获取模块信息(只读)等。比如说，一台蓝牙4.0设备，用特征A来描述自己的出厂信息，用特征B来与收发数据等。
