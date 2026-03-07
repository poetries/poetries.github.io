---
title: React Native之蓝牙连接心率带设备
date: 2019-10-02 11:20:12
tags: 
 - RN
 - react
categories: Front-End
---

> - 本文主要介绍 `react-native-ble-manager` 连接心率带设备。
> - 文档地址 https://github.com/innoveit/react-native-ble-manager#methods

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

compomentDidMount(){
    this.initDevInfo()
    this.startScan()
}
handleStopScan = () => {
        console.log('停止扫描')
}
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