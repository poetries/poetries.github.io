---
title: RN构建iOS包发布到AppStore总结篇
date: 2023-10-22 18:10:12
tags: 
 - RN
 - react
categories: Front-End
---

## 配置development测试证书

> 使用`xcode`来管理自动生成证书，不需要在管理后台创建

### 1、创建Identifiers

> 登录 https://developer.apple.com/account

![](https://s.poetries.work/uploads/2023/10/d3d19228ec48dfe2.png)

![](https://s.poetries.work/uploads/2023/10/19657900fcb37bef.png)

![](https://s.poetries.work/uploads/2023/10/9348e21eb02eae74.png)

![](https://s.poetries.work/uploads/2023/10/4c8cddc046e42324.png)

![](https://s.poetries.work/uploads/2023/10/68e759bd80a6b7d0.png)

![](https://s.poetries.work/uploads/2023/10/1c453d7171b4d71f.png)

### 2、在Xcode端自动生成证书，不需要在管理后台添加证书

![](https://s.poetries.work/uploads/2023/10/864c4d1828d36193.png)

![](https://s.poetries.work/uploads/2023/10/7ff0853d6763d1e7.png)

> 然后到后面就看到自动创建的证书了

![](https://s.poetries.work/uploads/2023/10/dae17eae4f107800.png)

### 3、创建Profiles

![](https://s.poetries.work/uploads/2023/10/43fdac62f1c4ebea.png)

![](https://s.poetries.work/uploads/2023/10/08dbd8f12c57cd87.png)

![](https://s.poetries.work/uploads/2023/10/05aab8ad8141cbab.png)

![](https://s.poetries.work/uploads/2023/10/543f027a5d7c2043.png)

![](https://s.poetries.work/uploads/2023/10/6232eacf27532221.png)

![](https://s.poetries.work/uploads/2023/10/31b7f6ff29a2d551.png)

## 配置distribution正式环境证书

### 1、生成IOS正式环境证书

![](https://s.poetries.work/uploads/2023/10/25717985c486ad13.png)

### 2、创建Profiles

![](https://s.poetries.work/uploads/2023/10/e7815063c626ab41.png)

![](https://s.poetries.work/uploads/2023/10/5df2093eb4cf289f.png)

![](https://s.poetries.work/uploads/2023/10/32a4e9928c21e29d.png)

![](https://s.poetries.work/uploads/2023/10/09602f7d4539b5df.png)

## 配置Xcode

![](https://s.poetries.work/uploads/2023/10/55b307b2e260aee8.png)
![](https://s.poetries.work/uploads/2023/10/a8e531d89de997aa.png)

## 打测试包发布到蒲公英测试

![](https://s.poetries.work/uploads/2023/10/7c25b7fdd2cf1a4f.png)

![](https://s.poetries.work/uploads/2023/10/979bfb42f2d823c6.png)

![](https://s.poetries.work/uploads/2023/10/446e877b181200e4.png)

![](https://s.poetries.work/uploads/2023/10/c0ac19effeff23bb.png)

![](https://s.poetries.work/uploads/2023/10/7a9d940024ec8cad.png)

![](https://s.poetries.work/uploads/2023/10/e4b33263233d8db8.png)

![](https://s.poetries.work/uploads/2023/10/305c22c3e7b190b9.png)

> 上传到蒲公英内测 https://www.pgyer.com

![](https://s.poetries.work/uploads/2023/10/b15ca30cd01b19fd.png)

![](https://s.poetries.work/uploads/2023/10/b2929e57f5f970ab.png)

![](https://s.poetries.work/uploads/2023/10/a99d12324dd8a872.png)

最后把应用地址复制发给测试人员下载即可，需要注意的是我们要添加测试手机的设备UUID才可以安装到手机上测试

### 添加手机UDID到管理后台

![](https://s.poetries.work/uploads/2023/10/78653128e1967b61.png)

![](https://s.poetries.work/uploads/2023/10/6e003a3a0a8ef496.png)


### 通过蒲公英获取UDID填入即可

> 地址：https://www.pgyer.com/tools/udid/manage

![](https://s.poetries.work/uploads/2023/10/d91b1123872f2ca9.png)

> 需要注意的是：设备添加超过`20个`，需要等待`24小时`才能在iPhone手机上安装APP测试。`添加新的额设备udid，需要重新打包ipa包才能进行安装到对应手机上`

## 打正式包上传到appstore

### 进入App Store Connect创建应用才可以上传

> 入口：https://developer.apple.com/account

![](https://s.poetries.work/uploads/2023/10/098ffcfe3382883e.png)

![](https://s.poetries.work/uploads/2023/10/ad192fc1a02051d0.png)

![](https://s.poetries.work/uploads/2023/10/aa4f08b7d0b6b23d.png)

![](https://s.poetries.work/uploads/2023/10/2e2f5d4a13f43e57.png)

### 开始上传到App Store Connect

![](https://s.poetries.work/uploads/2023/10/cf408e3029539dc9.png)

![](https://s.poetries.work/uploads/2023/10/2a74082d89e946e8.png)

![](https://s.poetries.work/uploads/2023/10/64dfe89783c717ed.png)

> 上传成功后，来到app 后台

![](https://s.poetries.work/uploads/2023/10/cd1a10fc38b5c201.png)

![](https://s.poetries.work/uploads/2023/10/c5d55c40962f74ec.png)

### 如果审核失败了，重新构建版本号需要修改

> 打包后，在app store后台选择最近的构建版本

![](https://s.poetries.work/uploads/2023/10/7fc6ff00ac395145.png)

### 需要注意的是权限提示信息需要修改，否则会被拒审

![](https://s.poetries.work/uploads/2023/10/c4bfcbf056cf7932.png)

