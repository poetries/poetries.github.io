---
title: React Native之设备真机调试
date: 2019-09-26 09:10:12
tags: 
 - RN
 - react
categories: Front-End
---


## 开启 USB 调试

> 在默认情况下 `Android` 设备只能从应用市场来安装应用。你需要开启 `USB` 调试才能自由安装开发版本的 `APP`

## 通过 USB 数据线连接设备

> 下面检查你的设备是否能正确连接到 ADB（Android Debug Bridge），使用`adb devices`命令

![](https://poetries1.gitee.io/img-repo/20190926/1.png)

## 运行应用

现在你可以运行`react-native run-android`来在设备上安装并启动应用了

## 从设备上访问开发服务器

> (Android 5.0 及以上)使用 `adb reverse` 命令

** 方式一**

- 运行`adb reverse tcp:8081 tcp:8081`
- 在命令行执行 `adb shell input keyevent 82` 弹出开发者工具。打开热更新和远程调试

**方式二**

> 摇晃手机即可弹出开发者工具

![](https://poetries1.gitee.io/img-repo/20190926/2.png)
