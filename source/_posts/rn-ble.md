---
title: React Native蓝牙连接心率带设备实战
description: 用 react-native-ble-manager 在 React Native 里读心率带数据的完整过程，覆盖 BLE 初始化、Android 定位权限、广播扫描参数、心率与步数的十六进制解析，以及定时扫描和事件监听的资源回收。
date: 2019-10-02 11:20:12
tags:
  - RN
  - react
  - 蓝牙
categories: Front-End
---

做一个运动记录类的 `App`，要把用户胸前那条心率带的数据实时读进来，画成曲线，再定时推给后端。听起来只是「连个蓝牙」，真动手才发现 `BLE`（低功耗蓝牙）这套东西和平时写业务代码完全是两个思路，权限、扫描、广播包、特征值订阅，每一层都有自己的坑。尤其是 `Android` 上那个「不开定位就扫不到设备」的行为，第一次遇到能让人怀疑人生。

这篇把当时用 `react-native-ble-manager` 打通心率带的整个流程拆开讲，从初始化一路讲到数据解析，顺带把原代码里几处会漏内存和拼错的地方改掉。文档地址是 https://github.com/innoveit/react-native-ble-manager#methods ，参数细节以它为准。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `BLE` 读数据的两条路线，广播扫描和连接订阅，分别适合什么场景
- `react-native-ble-manager` 的初始化顺序，`start` 和 `enableBluetooth` 谁先谁后
- 为什么 `Android` 上不给定位权限就扫不到任何蓝牙设备
- `BleManager.scan` 四个参数各自控制什么，`scanMode` 和 `numberOfMatches` 怎么调
- 从广播包的十六进制串里解析电量、心率、步数
- 定时扫描的写法，以及事件监听不回收会怎么样
- 原代码里的几处问题和改法
- 2019 年到现在，`Android` 蓝牙权限模型发生了什么变化

## 一、先选路线，广播还是连接

`BLE` 里拿设备数据有两条完全不同的路。搞清楚自己走哪条，后面的代码才不会拧巴。

第一条是「连接后订阅特征值」。流程是扫描发现设备，`connect` 建立连接，`retrieveServices` 拿到服务和特征值列表，然后对某个特征值 `startNotification`，设备每次有新数据就主动推给你。标准的心率服务（`Heart Rate Service`，`UUID` 是 `180d`）就是这么设计的，数据准、延迟低、能双向通信。代价是连接本身有开销，一次只能连有限个设备，断线还得写重连逻辑。

第二条是「只读广播包」。`BLE` 设备在没被连接的时候会周期性地往外播报一个广播包，里面能塞一小段自定义数据。你只要一直扫描，就能从广播里把这段数据捞出来，全程不建立连接。

原文这个心率带走的是第二条路。

好处很实在。不用管连接状态，不用处理断线重连，一台手机可以同时收多条心率带的数据，做团课那种多人同屏的场景特别合适。代价是数据量受限，广播包能塞的字节数很少，而且推送频率由设备决定，你只能被动等。厂商在广播包里塞了电量、心率、步数三个值，够用了。

所以下面所有代码的核心逻辑就一句话，反复扫描，在扫描回调里解析广播包。

## 二、初始化和事件监听

先看初始化这一段。

```js
// 以下是处理蓝牙设备的逻辑
state = {
    scanning: false,//蓝牙是否在扫描
}

// 初始化蓝牙设备信息
initDevInfo = ()=>{
    //创建对用户的请求，以激活蓝牙
    BleManager.enableBluetooth()
        .then(() => {
            console.log('开启成功');
        })
        .catch((error) => {
            console.log('The user refuse to enable bluetooth');
        });
        
    //初始化设备
    BleManager.start({ showAlert: false }).then(() => {
        console.log('开始了')
    });
    this.onCheckLocation();

    this.handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral);
    this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan);
}
```

这里做了四件事。`enableBluetooth` 会弹一个系统级的请求，让用户把蓝牙开关打开，这个只在 `Android` 上有效，`iOS` 不允许应用直接开关蓝牙，只能引导用户自己去设置里开。`start` 是初始化 `BleManager` 模块本身，`showAlert: false` 的意思是蓝牙没开的时候不要弹那个默认的系统提示框，因为我们自己已经用 `enableBluetooth` 处理过了。

然后是两个事件监听。`BleManagerDiscoverPeripheral` 每扫到一个外围设备就触发一次，这是整套逻辑真正干活的地方。`BleManagerStopScan` 在一轮扫描结束时触发。

这块有个执行顺序的问题要注意。上面这段是把 `enableBluetooth` 和 `start` 并排写的，两个都是异步的，谁先完成不确定。更稳的写法是先 `start`，等它 `resolve` 之后再去 `enableBluetooth` 和挂监听，因为 `start` 没完成之前原生模块还没准备好，这时候注册的监听有可能收不到事件。

```js
// 更稳的初始化顺序：先 start，再处理蓝牙开关和监听
initDevInfo = async () => {
  await BleManager.start({ showAlert: false })
  if (Platform.OS === 'android') {
    try {
      await BleManager.enableBluetooth()
    } catch (e) {
      console.log('用户拒绝开启蓝牙')
    }
  }
  await this.onCheckLocation()
  this.handlerDiscover = bleManagerEmitter.addListener(
    'BleManagerDiscoverPeripheral',
    this.handleDiscoverPeripheral
  )
  this.handlerStop = bleManagerEmitter.addListener(
    'BleManagerStopScan',
    this.handleStopScan
  )
}
```

## 三、Android 上不给定位权限就扫不到设备

这个是我当时排查了整整一下午的问题。代码一行没错，`iOS` 上一切正常，`Android` 上 `scan` 调用成功、`BleManagerStopScan` 也按时触发，就是一个 `BleManagerDiscoverPeripheral` 都收不到。

原因在 `Android` 系统这边。从 `Android 6.0` 开始，`BLE` 扫描被归类成了「可以推断用户位置」的能力，因为周围有哪些蓝牙信标本身就能定位。所以系统要求应用必须持有位置权限才允许扫描，没有权限的时候扫描接口照常返回成功，只是结果列表永远是空的。不报错，不提示，就是空。

这个设计我一开始也没想到，找了半天以为是设备广播有问题。

所以要有这么一段权限检查。

```js
 //检查是否获得定位权限
	 onCheckLocation =()=>{
        if(Platform.OS === 'ios'){
            return false;
        }
        const granted =PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION)

        granted.then((data)=>{
            if(!data){
                this.requestLocationPermission()
            }
        }).catch((err)=>{
            console.log('err---------',err.toString())
        })
    }
```

`PermissionsAndroid.check` 只查不弹框，返回一个 `Promise`。没有权限就走到 `requestLocationPermission` 去真正申请。

```js
    //申请地址权限 有些安卓设备比如华为，需要开启定位才可以扫描到蓝牙设备
    async requestLocationPermission() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                {
                    //第一次请求拒绝后提示用户你为什么要这个权限
                    'title': '是否允许地址查询权限',
                    'message': '此权限会造成系统异常，请允许',
                    buttonNeutral: '等会再问我',
                    buttonNegative: '不行',
                    buttonPositive: '好的',
                }
            )

            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                showMsg("你已获取了定位权限")
            } else {
                showMsg("获取定位权限失败,会造成系统异常")
            }
        } catch (err) {
            showMsg(err.toString())
        }
}
```

`PermissionsAndroid.request` 的第二个参数是弹框文案。这段文案值得多花点心思，因为用户看到「运动 `App` 要定位权限」的第一反应就是拒绝。原文这个「此权限会造成系统异常，请允许」的写法其实不太好，容易被当成恐吓，写成「用于搜索附近的心率设备，不会记录你的位置」这类说明性文案，通过率会高一些。

还有个坑是光有权限不够。部分机型（华为、小米那批）还要求系统的定位开关本身处于打开状态，权限给了但定位总开关关着，照样扫不到。这个用 `PermissionsAndroid` 检测不出来，得靠原生模块去读系统的 `location` 服务状态，或者干脆在扫不到设备时给用户一句提示，引导他去下拉菜单打开定位。

## 四、扫描的四个参数

扫描是这样发起的。

```js
	/**
     *开始扫描蓝牙
     */
    startScan = ()=>{
		if(bleScanTimer) clearInterval(bleScanTimer);

		bleScanTimer = setInterval(()=>{
			//扫描可用的外围设备
			BleManager.scan(["180d"], 8, false, { "scanMode": 2, "numberOfMatches": 3 }).then((results) => {
				console.log('开始扫描')
				if(!this.state.scanning) {
					this.setState({ scanning: true });
				}
			});
		}, timerHeartInterval)
	}
	stopScan = ()=>{
		if(bleScanTimer) clearInterval(bleScanTimer);
		this.setState({ scanning: false });
	}
```

`BleManager.scan` 这四个参数各管一摊，值得逐个说。

第一个 `["180d"]` 是服务 `UUID` 过滤器。`180d` 是蓝牙标准里心率服务的短 `UUID`，只有广播里声明了这个服务的设备才会被上报。加过滤能省电，也能避免回调被周围一堆蓝牙耳机、手环刷屏。如果传空数组就是不过滤，什么都上报。

第二个 `8` 是本轮扫描持续的秒数。到点自动停，触发 `BleManagerStopScan`。

第三个 `false` 是 `allowDuplicates`。这个参数很关键。传 `false` 的时候，同一个设备在一轮扫描里只上报一次；传 `true` 才会每收到一个广播包就上报一次。原文走的是广播路线，靠外层 `setInterval` 反复发起新的扫描轮次来拿到新数据，所以这里传 `false` 是成立的。但如果你想在一轮扫描里持续拿数据，就得传 `true`。

第四个是 `Android` 专属的扫描选项。`scanMode: 2` 对应 `SCAN_MODE_LOW_LATENCY`，扫描最积极、发现最快，代价是耗电明显。做实时心率这种前台强交互场景可以接受，后台长时间跑就得往下调。`numberOfMatches: 3` 对应 `MATCH_NUM_MAX_ADVERTISEMENT`，让系统尽量多上报匹配到的广播。这两个值的具体常量含义以 `Android` 官方的 `ScanSettings` 文档为准。

外层这个 `setInterval` 的节奏要和第二个参数配合。单轮扫描 8 秒，`timerHeartInterval` 就不能小于 8 秒，否则上一轮还没结束下一轮又发起，`Android` 会限制短时间内的重复扫描请求。

## 五、从广播包里解析心率

真正干活的是这个回调。

```js
// 广播的方式定时读取设备信息
handleDiscoverPeripheral = (peripheral) => {
    const {record:{mqttData,realHeartData},dispatch } = this.props;
    console.log('扫描到的外围设备---', peripheral);
    let devName = peripheral.name

    // 如果已绑定的设备编号和扫描的蓝牙编码相等
    if (mqttData.deviceCode == peripheral.name) {
        // 传感器数据解析成可读数据。这里根据设备提供商的文档处理即可
        let before = peripheral.advertising.serviceUUIDs[1].replace(/-/g, "");

        let type1 = before.substr(16, 2);
        let type2 = before.substr(24, 2);
        let analysis = {
            "id": before.substr(0, 10),
            "battery": parseInt(before.substr(14, 2), 16),
            "heartRate": type1 === "31" ? parseInt(before.substr(18, 6), 16) : null,
            "stepCount": type2 === "32" ? parseInt(before.substr(26, 6), 16) : null
        };
        console.log(analysis,'analysis')
```

这段在干什么？厂商把传感器数据编码进了第二个服务 `UUID` 里。标准 `UUID` 长这样 `0000180d-0000-1000-8000-00805f9b34fb`，去掉连字符就是一串 32 位的十六进制字符。厂商借用了这个位置，按固定偏移把设备 `ID`、电量、心率、步数拼了进去。

所以解析就是数位置。`substr(0, 10)` 取设备 `ID`，`substr(14, 2)` 按十六进制转成电量百分比。心率和步数前面各有一个类型标记位，`31` 表示后面跟的是心率，`32` 表示后面跟的是步数，标记位对不上就返回 `null`。

这套偏移量完全由设备厂商定义，换一款心率带就得重写。拿到设备之后第一件事是找厂商要广播协议文档，没有文档就只能把原始 `UUID` 打出来对着数值变化反推，那个过程很痛苦。

这里有个健壮性问题。`peripheral.advertising.serviceUUIDs[1]` 直接取下标 1，如果某次广播只带了一个 `UUID`，这行会读到 `undefined`，紧接着调 `replace` 就抛异常，整个回调挂掉。加个判断保险得多。

```js
const uuids = peripheral?.advertising?.serviceUUIDs
if (!Array.isArray(uuids) || uuids.length < 2) return
const before = uuids[1].replace(/-/g, '')
```

拿到数据之后是入库和刷新。

```js
            // 保留心率大于0的
            if(analysis.heartRate !=null && analysis.heartRate>0) {
            // 记录发送mqtt数据 每隔3秒查询一次心率数据
            mqttData.sportData.tmp.push({
                time: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                heart: analysis.heartRate,
                steps: analysis.stepCount || 0
            })

            // 记录实时曲线数据
            realHeartData.push({
                time: new Date().getTime(),
                value: analysis.heartRate
            })
            }

            // 刷新页面
            dispatch({
            type: 'record/save',
            payload: {
                mqttData,
                realHeartData
            }
            })
    }
}
```

心率为 0 或者 `null` 的样本要丢掉。心率带刚戴上、接触不良、用户中途摘下来，这几种情况传上来的都是 0，混进曲线里会画出一根扎到底的尖刺。

两个数组分别喂给两个消费者，`mqttData.sportData.tmp` 攒着定时推给后端，`realHeartData` 给前端画实时曲线。这里有个隐患，`realHeartData` 是只 `push` 不清理的，一节运动课几十分钟下来数组会涨得很大，图表重绘也会越来越慢。做曲线通常只需要最近一段窗口，加个截断更合适。

```js
// 只保留最近 N 个点，避免长时间运行后数组无限增长
const MAX_POINTS = 600
realHeartData.push({ time: Date.now(), value: analysis.heartRate })
if (realHeartData.length > MAX_POINTS) {
  realHeartData.splice(0, realHeartData.length - MAX_POINTS)
}
```

## 六、生命周期和资源回收

原代码这里有个明显的笔误，值得单独拎出来。

```js
compomentDidMount(){
    this.initDevInfo()
    this.startScan()
}
handleStopScan = () => {
        console.log('停止扫描')
}
```

`compomentDidMount` 拼错了，正确的是 `componentDidMount`，中间是 `ponent` 不是 `poment`。`React` 不认识这个名字，所以这个方法压根不会被调用，整个蓝牙初始化和扫描都不会启动。这类错误最难受的地方在于它不报错，你会一直往蓝牙那边查，查不出来。

更麻烦的是这里少了 `componentWillUnmount`。前面挂了两个事件监听、开了一个 `setInterval`，页面离开时全都没有回收。用户在心率页和其他页之间来回切几次，监听就叠了好几层，同一个广播包会触发多次解析和 `dispatch`，曲线上的点直接翻倍，同时定时器也在后台一直扫，耗电肉眼可见。

补上就好。

```js
componentDidMount() {
  this.initDevInfo()
  this.startScan()
}

componentWillUnmount() {
  // 停掉定时扫描
  this.stopScan()
  // 摘掉事件监听，否则重复进入页面会叠加多份回调
  this.handlerDiscover && this.handlerDiscover.remove()
  this.handlerStop && this.handlerStop.remove()
  // 停掉可能还在进行中的那一轮扫描
  BleManager.stopScan().catch(() => {})
}
```

`stopScan` 那个函数原文只清了定时器，没有调 `BleManager.stopScan()`。清定时器只是不再发起新的扫描轮次，当前正在进行的那一轮还会跑完剩下的几秒，期间照样触发回调。两个都停才干净。

## 七、这几年蓝牙权限变了不少

2019 年这套代码放到现在，主逻辑还能用，权限那块必须改。

`Android 12` 引入了一组独立的蓝牙运行时权限，扫描和连接不再统一挂在位置权限下面，而是拆成了扫描类和连接类两种。如果你的应用确实不用蓝牙做定位，还可以在清单里给扫描权限声明一个「不用于推导位置」的标记，声明之后就不必再申请位置权限了。这一改动让文案好写很多，用户看到「附近设备」比看到「位置」的接受度高得多。具体的权限名和标记属性以 `Android` 官方的蓝牙权限文档为准，我这边只在自己的项目目标版本上验证过，不同 `targetSdkVersion` 下行为有差异。

另一个变化是库的选择。`react-native-ble-manager` 一直在维护，同时社区里 `react-native-ble-plx` 也是很常见的选项，两者 `API` 风格不太一样，前者偏事件驱动，后者偏 `Promise` 和 `Observable`。做广播扫描这类场景我个人还是习惯前者，回调模型和 `BLE` 本身的异步特性更贴。

`iOS` 这边变化相对小，主要是 `Info.plist` 里的蓝牙用途说明字段要写清楚，审核会看。后台持续扫描要额外声明后台模式，而且苹果对此审核比较严，没有充分理由基本过不了。

最后提一句调试。蓝牙这块模拟器完全帮不上忙，必须真机。真机调试怎么连、`Metro` 端口怎么转发、连不上怎么排查，可以看这篇[React Native 真机调试完整流程](https://feinterview.poetries.top/blog/rn-device-debug)。如果你做的是小程序端的蓝牙，思路是相通的，可以对照看[微信小程序蓝牙开发](https://feinterview.poetries.top/blog/weapp-bluetooth)。

## 总结

用广播方式读心率带，整条链路是这样的。先 `BleManager.start` 初始化模块，`Android` 上补齐定位权限（新版本改成蓝牙扫描权限），挂上 `BleManagerDiscoverPeripheral` 监听，然后用 `setInterval` 按固定节奏反复发起 `BleManager.scan`，在回调里按厂商协议从广播包的十六进制串里切出电量、心率、步数，过滤掉为 0 的脏数据，最后分别喂给上报队列和实时曲线。

原代码里那几处问题，`compomentDidMount` 拼错导致初始化根本没执行、缺 `componentWillUnmount` 导致监听和定时器泄漏、`serviceUUIDs[1]` 不判空可能抛异常、曲线数组无限增长，都是那种「短时间跑不出问题、跑久了才炸」的类型，一起改掉更省心。

如果你也在做 `BLE` 相关的功能，我的建议是先花半天把设备厂商的广播协议文档吃透，比直接上手写代码效率高得多。协议看明白了，剩下的就是体力活。

## 参考

- [react-native-ble-manager 官方仓库](https://github.com/innoveit/react-native-ble-manager#methods)
- [Android 蓝牙权限官方文档](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions)
- [Android BLE 扫描 ScanSettings 官方文档](https://developer.android.com/reference/android/bluetooth/le/ScanSettings)
- [Bluetooth SIG 官方指定编号文档](https://www.bluetooth.com/specifications/assigned-numbers/)
- [React Native PermissionsAndroid 官方文档](https://reactnative.dev/docs/permissionsandroid)
- [前端进阶之旅](https://interview.poetries.top)
