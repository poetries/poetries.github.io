---
title: Ionic之调用原生模块相机
date: 2019-10-07 14:10:24
tags: 
 - Ionic
 - Angular
categories: Front-End
---


## 一、Ionic Native 的使用

> Ionic 在 `cordova` 的基础上面又进行了封装，可以让我们更方便的在 ionic 中使用 `cordova` 插件

**使用方法:**

1. 找到对应的Api:

> https://ionicframework.com/docs/native/device/

2. 安装相关的设备插件

```bash
ionic cordova plugin add cordova-plugin-device 

npm install @ionic-native/device --save
```

> - 注意: 安装 `ionic` 调用原生 api 的插件的时候在模块加上 `--save` 
> - 注意: `ios` 安装插件的时候命令签名加 `sudo`

3. 在`app.module.ts`中引入注册相应模块

```
import { Device } from '@ionic-native/device/ngx';
```

```js
providers: [
    StatusBar,
    SplashScreen,
    Device,
    { 
        provide: RouteReuseStrategy, useClass: IonicRouteStrategy 
    }
]
```

4. 在用到的页面引入看文档使用

```js
import { Device } from '@ionic-native/device/ngx'; 

constructor(private device: Device) { }
...
console.log('Device UUID is: ' + this.device.uuid);
```

## 二、Cordova 常用命令以及插件的使用

**1、增加平台**

```
cordova platform add android
cordova platform add ios

ionic cordova platform add android
ionic cordova platform add ios
```

**2、移除平台**

```
cordova platform rm android 
cordova platform rm ios

ionic cordova platform rm android 
ionic cordova platform rm ios
```

**3、修改代码后让代码生效**

```
cordova prepare

ionic cordova prepare
```

**4、真机运行**

```
cordova run android

ionic cordova run android
```

**5、安装插件--建议看 ionic 官方文档**

```js
//设备 API
cordova plugin add org.apache.cordova.device

//网络(事件)
cordova plugin add org.apache.cordova.network-information 

//电池(事件)
cordova plugin 
add org.apache.cordova.battery-status 

//加速器
cordova plugin add org.apache.cordova.device-motion 

//罗盘
cordova plugin add org.apache.cordova.device-orientation 

//定位
cordova plugin add org.apache.cordova.geolocation

//摄像头
cordova plugin add org.apache.cordova.camera

//媒体文件处理
cordova plugin add org.apache.cordova.media-capture cordova plugin add org.apache.cordova.media

//文件访问
cordova plugin add org.apache.cordova.file

//文件传输
cordova plugin add org.apache.cordova.file-transfer

//对话框
cordova plugin add org.apache.cordova.dialogs

//震动
cordova plugin add org.apache.cordova.vibration

//联系人
cordova plugin add org.apache.cordova.contacts

//全球化
cordova plugin add org.apache.cordova.globalization 

//闪屏
cordova plugin add org.apache.cordova.splashscreen 

//打开新的浏览器窗口
cordova plugin add org.apache.cordova.inappbrowser 

//调试控制台
cordova plugin add org.apache.cordova.console
```

**6、查看已经安装的插件**

```
cordova plugin list
```

**7、删除插件**

```
cordova plugin rm org.apache.cordova.console

cordova plugin rm org.apache.cordova.geolocation
```


