---
title: Ionic之iOS打包流程
date: 2019-10-07 08:10:24
tags: 
 - Ionic
 - Angular
categories: Front-End
---

## 一、模拟器运行iOS项目

**安装 Ionic Cordova**

```
sudo cnpm install -g cordova ionic
```

**Ionic 创建浏览器运行的项目**

- 创建项目: `sudo ionic start myApp tabs`
- cd 到刚才创建的项目
- `sudo ionic serve` 浏览器运行项目

**Ionic 借助 cordova 创建 ios 手机上可以安装的应用**

- 创建项目: `sudo ionic start myApp tabs`
- cd 到刚才创建的项目
- `sudo ionic cordova platform add ios` 把 ios 环境添加到我们的项目
- `sudo yarn install`
- 修改代码后运行 `sudo ionic build --prod`(打包) 以及 `sudo ionic cordova prepare` (这个是拷贝`www`目录资源到ios工程下)。必须运行，否则调试会卡死

**可能遇到的错误以及解决方案**

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/1.png)

- 使用软件中的提供的翻墙工具重试，如果不行继续看第二步骤
- 手机开启热点，让电脑连接手机用手机的网络下载

**找到对应目录下面的文件双击用 Xcode 打开**

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/2.png)

> 注意:xcode 用最新的版本

**如果双击遇到权限问题如下**

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/3.png)

> 可以用命令修改权限，cd 到要修改权限的目录执行下面命令

```
sudo chmod -R 777 *
```

**在 xcode 中选择对应模拟器运行**

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/4.png)

> 注意:调整模拟器大小只需要拉动模拟器边缘即可

## 二、真机调试

### 2.1 真机调试之前的准备工作

- 你得有苹果开发者账号个人($99)、公司($99)、企业($299)账号均可
- 能上网的苹果电脑 macos(苹果虚拟机也可以)、Xcode、iOS 设备(iPhone、ipad 均 可)

### 2.2 开发者中心配置调试设备的 uuid

**1. 获取iPhone手机的uuid，手机连接电脑，打开iTunes软件，点击序列号字母处**

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/5.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/6.png)

**2. 配置iPhone手机的uuid，打开平台开发者中心进行配置**

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/7.png)

### 2.3 xcode 自动管理证书文件

**手动创建证书文件参考下面地址:**

> https://jingyan.baidu.com/article/d3b74d640735c71f77e609f0.html

> 现在用 xcode 开发项目我们可以自动适配我们的证书，选择自动化配置证书意味着你不会 在证书设置和编译的时候浪费更多的时间,并且你可以更好的设置适合你的 Xcode

**1、点击 xcode 选择 Preference，如下图**

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/8.png)

**2、弹出下面界面输入自己的账户名和密码**

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/9.png)

**3、选择对应的项目 选择 General->勾选自动管理签名->设置 Team 开发者账户->选择开发的 设备**

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/10.png)

**4、设置所有工程的 Build settings 为 Automatic (默认可以不用管)**

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/11.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/12.png)

### 2.4 真机调试

- 连上手机，然后在手机上面选择信任此电脑
- 选择调试设备为自己的手机

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/13.png)

- 点击运行

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/14.png)

- 点击允许

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/15.png)

> 注意：每次修改代码后，都需要重新执行 ` sudo ionic build --prod` 以及 `sudo ionic cordova prepare`。这样比较麻烦，建议在浏览器端调试好了在调试ios、安卓端的

## 三、创建测试包ipa

- 进入苹果开发者中心，配置需要测试项目的人员手机的 `uuid` 以及调试设备的 `uuid`
- 配置应用包名称
- 打包测试证书需要连接 `iphone` 手机，不然 Archive 会是灰色的
- 选择 `product – Archive` 进行打包--(具体步骤如下)

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/20.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/21.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/22.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/23.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/24.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/25.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/26.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/27.png)

**可能遇到的错误**

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/28.png)

> 如果是 code sign 相关的错误

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/29.png)

## 四、发布到 appstore

**1. 需要登录到苹果开发者中心`Itunes connect` 创建应用**

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/37.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/38.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/39.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/40.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/41.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/42.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/43.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/44.png)

**2. 配置好开发者证书以打包正式包**


![](https://poetries1.gitee.io/img-repo/2019/10/ionic/30.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/31.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/45.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/46.png)

> 这里选择直接导出上传

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/47.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/48.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/49.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/50.png)


**3. 使用 `Application Loader` 把本地的正式包发布到 `App Store Connect`，也可以使用 Xcode把应用发布到 App Store**

> 打开application loader上传应用包

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/33.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/34.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/51.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/52.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/53.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/54.png)

> 应用升级需要修改版本号，然后build上传
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/55.png)

> 然后在这里可以有多个版本，选择一个提交审核即可

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/56.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/57.png)

> 保存之后提交审核

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/58.png)


**登录 Application Loader 报错**

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/35.png)

> 登录:https://appleid.apple.com/account/manage

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/36.png)

> 然后用生成的密码作为登录密码


**4. 在xcode中上传应用**

> 修改版本后，选择achieve

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/59.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/60.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/61.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/62.png)

> 然后可以在开发者中心选择上传的版本

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/63.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/64.png)

> 提交审核后一般七个工作日左右

## 五、打包上传前，在 info.plist 添加权限

> Xcode 打包上传 app store 提示 Missing info.plist key NSPhotoLibraryUsageDescription 错误

**Info.plist 添加权限**

> 项目调用了摄像机，需要配置一下权限

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/65.png)

> 为了保护隐私，最终用户必须明确的允许应用程序访问提醒信号、照片、位置、联系人、和日历数 据。为了说服用户接受，它有助于解释应用程序可以怎样使用这类数据，并且说明访问他的原因。给 位于 `Info.plist` 文件顶层的以下键分配字符串值。当 iOS 提示用户有关特定资源的权限时，他将显示 这些字符串，作为他的标准对话框的一部分。

- 相册 `NSPhotoLibraryUsageDescription`
- 相机  `NSCameraUsageDescription`
- 麦克风 `NSMicrophoneUsageDescription`
- 位置 `NSLocationUsageDescription`
- 在使用期间访问位置 `NSLocationWhenInUseUsageDescription`
- 始终访问位置 `NSLocationAlwaysUsageDescription`
- 日历 `NSCalendarsUsageDescription`
- 提醒事项 `NSRemindersUsageDescription`
- 运动与健身 `NSMotionUsageDescription`
- 健康更新 `NSHealthUpdateUsageDescription`
- 健康分享 `NSHealthShareUsageDescription`
- 蓝牙 `NSBluetoothPeripheralUsageDescription`
- 媒体资料库 `NSAppleMusicUsageDescription`

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/66.png)

