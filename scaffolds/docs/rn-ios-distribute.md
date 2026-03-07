---
title: React Native之iOS打包发布
date: 2019-10-04 00:10:12
tags: 
 - RN
 - react
categories: Front-End
---

> 结合这篇文章一起看 http://blog.poetries.top/2019/10/07/Ionic-ios-build

> `React Native` 应用程序开发完成后，需要先打包一个测试版，由测试人员安装应用并测试。对于 `iOS` 应用，一般来说，开发者如果需要将应用安装到某些用户的设备上，就需要将应用导出为这些设备可以直接安装的安装包（`.ipa` 文件）。本文总结了如何打包 `ipa` 并发布到应用内测分发平台供安装测试

## 一、应用程序打包

> 开发 `React Native` 应用时，js 代码和图片资源通过 `Debug Server` 提供，但是当我们需要发布应用时，就需要将 js 等资源和应用一起打包

### 1.1 打包离线资源

> 通过 `react-native bundle` 命令可以打包离线资源。为了日后把打包方便，我们把打包指令填在下`package.json`下

```json
"scripts": {
    "start": "node node_modules/react-native/local-cli/cli.js start",
    "test": "jest",
    "bundle-ios": "node node_modules/react-native/local-cli/cli.js bundle --entry-file index.js --platform ios --dev false --bundle-output ./ios/bundle/index.jsbundle --assets-dest ./ios/bundle"
  },
```

> `bundle-ios`命令参数含义

- `--entry-file`：入口文件。
- `--platform`：平台名称（ios或者android）。
- `--dev`：是否是开发模式，设置为 false 的时候将会对 JavaScript 代码进行优化处理。
- `--bundle-output`：生成的 `jsbundle` 文件的名称。
- `--assets-dest`：图片以及其他资源存放的目录

> 这样打包只需要在根目录下输入`npm run bundle-ios` 即可（切记一定要先在`项目-->ios下新建bundle`文件夹，不然会报错）

![](https://poetries1.gitee.io/img-repo/2019/10/711.png)

> 之后你会发现bundle文件下面已经有了内容（如下图）

![](https://poetries1.gitee.io/img-repo/2019/10/712.png)

### 1.2 添加离线资源到项目中

> 在`Xcode`中添加资源到项目中，必须使用`Create folder references`的方式(也就是文件夹的方式)添加`bundle`文件
夹

![](https://poetries1.gitee.io/img-repo/2019/10/713.png)

> 必须使用`Create folder references`的方式添加：

![](https://poetries1.gitee.io/img-repo/2019/10/714.png)

> 添加成功后`bundle`文件夹为蓝色（如下图）

![](https://poetries1.gitee.io/img-repo/2019/10/715.png)

### 1.3 修改 AppDelegate.m 文件

> 在开发的过程中可以在这里配置`Debug Server`的地址，当发布上线的时候，就需要使用离线的`jsbundle`文件，因此需要设置`jsCodeLocation`为本地的离线`jsbundle`。

```c
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  NSURL *jsCodeLocation;

//  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
//  jsCodeLocation = [NSURL URLWithString:@"http://192.0.0.0:8081/index.bundle?platform=ios&dev=true"];//真机Hot reloading
#ifdef DEBUG
     jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];//开发调试
#else
    jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"bundle/index" withExtension:@"jsbundle"];//上线打包
  
#endif
 ........
}
```

## 二、iOS证书配置

> 建议阅读这篇文章更详细。[React Native打包前凑之iOS证书配置](http://blog.poetries.top/2019/10/03/rn-ios-cert-config)

> 首先你的有一个开发者账号才可以进行以下步骤

> 在mac上搜索钥匙串打开

![](https://poetries1.gitee.io/img-repo/2019/10/726.png)
![](https://poetries1.gitee.io/img-repo/2019/10/727.png)

> 到 `https://developer.apple.com` 去申请证书

![](https://poetries1.gitee.io/img-repo/2019/10/728.png)

> 新建证书

![](https://poetries1.gitee.io/img-repo/2019/10/729.png)
![](https://poetries1.gitee.io/img-repo/2019/10/730.png)

> 上传之前的钥匙串文件

![](https://poetries1.gitee.io/img-repo/2019/10/731.png)

> 下载证书。双击即可安装到钥匙串中

![](https://poetries1.gitee.io/img-repo/2019/10/732.png)
![](https://poetries1.gitee.io/img-repo/2019/10/733.png)

> 新建`Identifiers`

![](https://poetries1.gitee.io/img-repo/2019/10/734.png)
![](https://poetries1.gitee.io/img-repo/2019/10/735.png)
![](https://poetries1.gitee.io/img-repo/2019/10/736.png)
![](https://poetries1.gitee.io/img-repo/2019/10/737.png)

> 新增Profiles 把设备证书以及id关联起来

![](https://poetries1.gitee.io/img-repo/2019/10/738.png)
![](https://poetries1.gitee.io/img-repo/2019/10/739.png)
![](https://poetries1.gitee.io/img-repo/2019/10/740.png)
![](https://poetries1.gitee.io/img-repo/2019/10/741.png)
![](https://poetries1.gitee.io/img-repo/2019/10/742.png)
![](https://poetries1.gitee.io/img-repo/2019/10/743.png)

> 到此证书部分添加完毕。接下来是根据已经配置的证书去打包。xcode会自动同步证书信息过来

## 三、Xcode 打包 ipa

1. 在 `Xcode` 添加前面申请证书的开发者账号（`Xcode->Preferences->Accounts`）

![](https://poetries1.gitee.io/img-repo/2019/10/716.png)

2. 这里的 `Bundle Idetifier` 应该为之前在开发者平台上添加的 `App ID` 如下图

![](https://poetries1.gitee.io/img-repo/2019/10/717.png)

3. 配置一下`code sign` 。选择 `Code Signing Identity` 安装证书

> 程序会自动选择设置

![](https://poetries1.gitee.io/img-repo/2019/10/718.png)

> 或者手动选择证书

![](https://poetries1.gitee.io/img-repo/2019/10/719.png)

4. 点击设备，选择通用 iOS 设备

![](https://poetries1.gitee.io/img-repo/2019/10/720.png)

5. 点击 `Product->Archive` 开始打包

> 打包完成后如下

![](https://poetries1.gitee.io/img-repo/2019/10/721.png)

> 点击`distribute App`

![](https://poetries1.gitee.io/img-repo/2019/10/ionic/16.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/17.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/18.png)
![](https://poetries1.gitee.io/img-repo/2019/10/ionic/19.png)


> 最后打包成`ipa`文件

![](https://poetries1.gitee.io/img-repo/2019/10/725.png)


## 四、发布到内测分发平台

> 由于新版的 iTunes 没有了应用程序选项，所以无法通过 iTunes 安装 App 到手机中。比较方便的方式是将应用发布到内测分发平台，然后扫码即可下载。目前我听得比较多的平台就是蒲公英和 fir.im，不过这两个平台都需要实名认证，有点蛋疼。具体使用哪个平台自己甄选就行，这里推荐一个不需要认证的国外平台 https://www.diawi.com

###  4.1 ipa安装到手机上

> 在Xcode的导航栏上选择`window->Devices and Simulators`，点击弹出页面里面的+号，选择`ipa`所在的文件夹,添加`ipa`，安装成功

![](https://poetries1.gitee.io/img-repo/2019/10/709.png)
![](https://poetries1.gitee.io/img-repo/2019/10/710.png)

> 以上只是测试版本打包，打包成`disctibute App`发布版本同理，这里不再赘述