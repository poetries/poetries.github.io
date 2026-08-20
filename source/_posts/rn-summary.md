---
title: React Native 适配 Android 与 iOS 完整总结篇
description: 一篇讲完 React Native 双端适配的全流程，涵盖 iOS/Android 环境搭建、真机调试、矢量图标接入、react-native-router-flux 与 react-navigation 路由方案、Flexbox 布局差异和 Android 签名打包。
date: 2019-06-08 14:50:12
tags: 
 - RN
 - react
 - 移动端
categories: Front-End
---

同一份 React Native 代码，在 iPhone 模拟器上跑得好好的，装到 Android 真机上导航栏就顶进状态栏，`react-native-vector-icons` 的图标全变成豆腐块，打包出来的 APK 还死活装不上。做 RN 双端适配那阵子，这类问题基本每周都要撞一遍。这篇是我当时攒下来的完整笔记，从 macOS 上把 iOS 和 Android 两套环境搭起来开始，一路记到矢量图标接入、两套路由方案怎么选、Flexbox 在 RN 里和 Web 的差异、`Platform.OS` 分支怎么写，最后落到 Android 签名打包。读完你能拿到一份可以直接照着抄的双端适配清单。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- iOS 与 Android 双端开发环境怎么搭，`react-native init` 卡人的那几个点在哪
- 远程调试、Live Reload、genymotion 模拟器和安卓真机调试的完整链路
- `react-native-vector-icons` 在两个平台上的自动配置与手动配置
- `react-native-router-flux` 的用法和全套 API 速查表
- RN 常见组件、样式写法、长列表与网络请求的注意事项
- RN 里的 Flexbox 和 Web CSS 到底差在哪几处
- `Platform.OS`、api doc 平台标识、图片 `@2x/@3x` 这些具体的适配手段
- `react-navigation` 的页面跳转、参数传递与标题栏定制
- Android 签名打包 APK 的完整步骤
- 这套 2019 年的写法，放到今天的 RN 新架构下哪些还成立、哪些已经变了

先说清楚一件事。这篇笔记写于 2019 年 6 月，当时 React Native 还是老架构，JS 和原生之间靠 Bridge 异步通信，iOS 上默认跑 JavaScriptCore。后来官方推了新架构，渲染层换成 Fabric，原生模块换成 TurboModules，默认引擎换成 Hermes，`react-native link` 这套手动 link 流程也被自动 linking 取代了。文中的命令和配置我一个字都没删，它们记录了那个版本真实的样子；每一节后面我会另起一段，补上现在的做法和已经废弃的部分。具体版本号和 API 名字请以[官方文档](https://reactnative.dev/docs/getting-started)为准，我不打算凭记忆瞎写。

## 一、环境搭建

RN 劝退新人的第一关从来不是写代码，是环境。iOS 和 Android 两套原生工具链要各配一遍，任何一环缺了都是编译到一半报一串看不懂的原生错误。这一节把两边的步骤拆开走一遍，顺带把调试链路也串上，因为环境搭完不会调试，等于白搭。

### 1.1 React Native环境搭建

#### 1.1.1 IOS环境搭建

> 环境：`MacOS`

iOS 这边只能在 macOS 上做，这是 Xcode 的硬限制，Windows 用户从一开始就只能搞 Android。先把 Node 和 Watchman 装上，前者跑打包器，后者是 Facebook 出的文件系统监听工具，RN 的 Metro 打包器靠它感知文件变化，装了之后热更新明显跟手。

```bash
# 如果你已经安装了 Node，请检查其版本是否在 v8.3 以上
brew install node 

# Watchman则是由 Facebook 提供的监视文件系统变更的工具。安装此工具可以提高开发时的性能
brew install watchman
```

- **注意**：不要使用 `cnpm`！`cnpm` 安装的模块路径比较奇怪，`packager` 不能正常识别！

这条注意事项要单独拎出来说。`cnpm` 为了处理依赖会把 `node_modules` 铺成一堆软链接结构，Metro 顺着这些链接找模块的时候会解析到奇怪的路径上，报出来的错通常是「找不到某个模块」，但你去目录里看模块明明在。这个我踩过，排查了小半天才反应过来是包管理器的锅。要装源慢就配 registry 镜像，别换客户端。

```
npm install -g yarn react-native-cli
```

**1. 创建新项目**

> `init` 命令默认会创建最新的版本，而目前最新的`0.45` 及以上版本需要下载 `boost` 等几个第三方库编译。这些库在国内即便翻墙也很难下载成功，导致很多人无法运行`iOS`项目。可以暂时创建`0.44.3`的版本

```
react-native init MyApp --version 0.44.3
```

这里锁 `0.44.3` 是个很有年代感的操作。`0.45` 之后 iOS 端编译需要从源码拉 `boost`、`folly`、`glog` 这几个 C++ 依赖，下载源在国内经常连不上，编译走到一半就断在下载环节。当时的通用解法就是退版本，或者手动把这几个压缩包塞进 `~/.rncache` 目录再重编。

现在这条建议已经不适用了。新版本的依赖分发方式变了，iOS 侧依赖统一走 CocoaPods 管理，而且 `react-native-cli` 这个全局包官方早就不推荐装，改用 `npx react-native@latest init`（更晚的版本又推荐走 Community CLI，具体以官方文档为准）。如果你是现在才开始新项目，直接按官网的最新指引走，不要锁 `0.44.3`，那个版本连 Hooks 都还没有。

**2. 编译并运行 React Native 应用**

1). **运行方式一** 在你的项目目录中运行`react-native run-ios`

```
cd MyApp
react-native run-ios
```

2). **运行方式二** 在`xCode`中运行

> 打开`xcode`选择项目中`myApp/ios/myApp.xcodeproj`，然后点击左上角运行即可


> 更多详情 https://reactnative.cn/docs/getting-started.html

两种跑法的差别在于，命令行方式会顺带帮你起 Metro 打包服务，适合日常改 JS；Xcode 方式能看到完整的原生编译日志，一旦是原生层报错，只有这条路能定位。我的习惯是平时用命令行，编译一失败就切回 Xcode 看红字。

**3. 远程调试**

- `ctrl + R`刷新
- `ctrl + D` 选择对应的工具调试

模拟器上按 `Command + D`（文中写的 `ctrl + D` 是 Windows/Linux 键位习惯，macOS 模拟器上是 `Command + D`）会弹出开发者菜单，里面的刷新、远程调试、性能监控都在这。真机上则是摇一摇手机弹出同一个菜单。

![RN 开发者菜单，包含 Reload 与 Debug 选项](https://s.poetries.top/gitee/2019/10/513.png)

**Enable Live Reload**

> 当你的js代码发生变化后，`React Native`会自动生成bundle然后传输到模拟器或手机上

Live Reload 和后面会提到的 Hot Reloading 不是一回事。Live Reload 是整个应用重新加载，页面状态全丢；Hot Reloading 只替换改动的模块，尽量保住当前页面的 state。改样式的时候用 Hot Reloading 效率高得多，改路由结构或者顶层逻辑就老老实实整刷。

![Live Reload 开启后代码保存即刷新的效果](https://s.poetries.top/gitee/2019/10/514.gif)



> 在浏览器中打开 http://localhost:8081/debugger-ui

远程调试的原理是把 JS 代码丢到 Chrome 的 V8 里跑，再通过 WebSocket 把结果发回设备。这就带来一个当年很典型的坑，开了远程调试之后所有涉及原生同步调用的东西行为都会变，性能数据也完全不能参考。所以调逻辑可以开，测性能必须关。关于双端性能怎么量，我另外整理过一篇 [React Native iOS/Android 真机性能剖析](https://feinterview.poetries.top/blog/react-native-ios-android-device-performance-profiling)，那里讲得更细。

![Chrome debugger-ui 页面](https://s.poetries.top/gitee/2019/10/515.png)

**巧用Sources面板**

远程调试打开后，Chrome DevTools 的 Sources 面板能直接给 RN 的 JS 打断点，和调网页没什么区别。断点、条件断点、调用栈、作用域变量都在，比一路 `console.log` 舒服。

![Chrome DevTools Sources 面板断点调试 RN 代码](https://raw.githubusercontent.com/crazycodeboy/RNStudyNotes/master/React%20Native%E8%B0%83%E8%AF%95%E6%8A%80%E5%B7%A7%E4%B8%8E%E5%BF%83%E5%BE%97/images/Sourcesmianban.jpg)

这里也补一句现状。基于 Chrome `debugger-ui` 的远程调试方案在后来的版本里被逐步淘汰了，官方转向了 Hermes 引擎自带的调试协议和内置的 DevTools，调试时 JS 就在设备上跑，不再搬到浏览器里，前面说的「开了远程调试行为会变」这个坑因此也就不存在了。新项目按官方文档的调试章节走即可。

**指定模拟的设备类型**

- 你可以使用`--simulator`参数，在其后加上要使用的设备名称来指定要模拟的设备类型（目前默认为`"iPhone X"`）。如果你要模拟 `iPhone 4s`，那么这样运行命令即可：`react-native run-ios --simulator "iPhone 4s"`。
- 你可以在终端中运行`xcrun simctl list devices`来查看具体可用的设备名称

指定设备这件事在做适配的时候用得非常频繁。刘海屏和非刘海屏的安全区表现不一样，小屏机上布局容易挤，所以最少要在一台带刘海的和一台小屏机上各过一遍。`xcrun simctl list devices` 列出来的名字必须一字不差地传给 `--simulator`，多个空格都不行。

![xcrun simctl list devices 输出的可用模拟器列表](https://s.poetries.top/gitee/2019/10/516.png)

#### 1.1.2 安卓环境搭建

Android 这边比 iOS 麻烦，因为要多配一套 JDK 和 Android SDK，还要手动设环境变量。整个流程的核心就四件事，装 JDK、装 Android Studio、在 SDK Manager 里勾对版本、把 `ANDROID_HOME` 写进 shell 配置。顺序不能乱，SDK 没装完就去配环境变量，`react-native run-android` 只会告诉你找不到 SDK。

**安装依赖**

> 必须安装的依赖有：`Node`、`Watchman` 和 `React Native` 命令行工具以及 JDK 和 `Android Studio`

```
brew install node
brew install watchman
```

```
npm install -g yarn react-native-cli
```

**Java Development Kit**

> `React Native` 需要 `Java Development Kit [JDK] 1.8`（暂不支持 `1.9` 及更高版本）。你可以在命令行中输入

- `javac -version`来查看你当前安装的 `JDK `版本。如果版本不合要求，则可以到 [官网](https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)上下载

JDK 版本这块当年是个高频踩坑点。机器上装了 JDK 9 或更高版本，Gradle 编译会直接报一堆和 `javax.xml.bind` 相关的错，看起来毫无头绪，实际就是版本不对。当时的标准答案就是老老实实退回 1.8。

这条现在已经过期了。RN 后续版本对 JDK 的要求一路上调，社区版本目前普遍要求 JDK 17 及以上，具体哪个 RN 版本对应哪个 JDK 请查官方的 Environment setup 页面，别照着这篇 2019 年的笔记去装 1.8。

**1. 安装 Android Studio**

> 首先下载和安装 [`Android Studio`](https://developer.android.com/studio/index.html)，国内用户可能无法打开官方链接，请自行使用搜索引擎搜索可用的下载链接。安装界面中选择"Custom"选项，确保选中了以下几项

- `Android SDK`
- `Android SDK Platform`
- `Performance (Intel ® HAXM)`
- `Android Virtual Device`

> 然后点击"`Next`"来安装选中的组件。安装完成后，看到欢迎界面时，就可以进行下面的操作了

**2. 安装 Android SDK**

> `Android Studio` 默认会安装最新版本的 `Android SDK`。目前编译 `React Native` 应用需要的是`Android 8.1 (Oreo)`版本的 `SDK`。你可以在 `Android Studio` 的 `SDK Manager` 中选择安装各版本的 `SDK`

你可以在 `Android Studio` 的欢迎界面中找到 `SDK Manager`。点击"`Configure`"，然后就能看到"`SDK Manager`"。

![Android Studio 欢迎界面进入 SDK Manager 的入口](https://s.poetries.top/gitee/2019/10/517.png)

> 在 `SDK Manager `中选择"`SDK Platforms`"选项卡，然后在右下角勾选"`Show Package Details`"。展开`Android 8.1 (Oreo)`选项，确保勾选了下面这些组件（重申你必须使用稳定的翻墙工具，否则可能都看不到这个界面）：

- `Android SDK Platform 27`
- `Intel x86 Atom_64 System Image`（官方模拟器镜像文件，使用非官方模拟器不需要安装此组件）

![SDK Platforms 选项卡中勾选 Android 8.1 相关组件](https://s.poetries.top/gitee/2019/10/518.png)

系统镜像那一项只有用官方 AVD 模拟器才需要，如果你打算用后面提到的 genymotion，或者直接插真机调试，这个几百 MB 的镜像可以不下。

> `SDK Manager` 还可以在` Android Studio` 的"Preferences"菜单中找到。具体路径是`Appearance & Behavior → System Settings → Android SDK`


- 然后点击"`SDK Tools`"选项卡，同样勾中右下角的"`Show Package Details`"。展开"`Android SDK Build-Tools`"选项，确保选中了 `React Native` 所必须的`27.0.3`版本。你可以同时安装多个其他版本

Build-Tools 的版本号必须和项目里 `android/build.gradle` 的 `buildToolsVersion` 对上。对不上的表现是 Gradle 同步阶段就失败，提示某个版本没安装。真遇到了，要么去 SDK Manager 把对应版本补上，要么改 gradle 配置指向你已经装了的版本，两条路都行。

![SDK Tools 选项卡中勾选指定版本的 Build-Tools](https://s.poetries.top/gitee/2019/10/519.png)

> 最后点击"`Apply`"来下载和安装这些组件。

这里的 `Android 8.1 (Oreo)`、`Platform 27`、`Build-Tools 27.0.3` 都是 2019 年的组合，现在早已不是这套数字了。Google Play 每年都在抬 `targetSdkVersion` 的最低门槛，新版 RN 模板给的也是更高的版本，所以这几个数字请当成「当时的快照」看，实际以你项目模板里的 gradle 配置和官方文档为准。

**3. 配置 ANDROID_HOME 环境变量**

> `React Native` 需要通过环境变量来了解你的 `Android SDK` 装在什么路径，从而正常进行编译

- 具体的做法是把下面的命令加入到`~/.bash_profile`文件中

```bash
# 如果你不是通过Android Studio安装的sdk，则其路径可能不同，请自行确定清楚。
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
```

> 如果你的命令行不是 `bash`，而是例如 `zsh` 等其他，请使用对应的配置文件

> 使用`source $HOME/.bash_profile`命令来使环境变量设置立即生效（否则重启后才生效）。可以使用`echo $ANDROID_HOME`检查此变量是否已正确设置

macOS 从 Catalina 开始默认 shell 换成了 zsh，这几行要写进 `~/.zshrc` 而不是 `~/.bash_profile`，写错文件的表现就是新开终端 `echo $ANDROID_HOME` 一片空白。另外原文里 `tools` 和 `tools/bin` 这两个路径，在新版 Android SDK 里已经被 `cmdline-tools/latest/bin` 取代，装的是新版 SDK 的话按新路径写。

**4. 编译并运行 React Native 应用**

> 确保你先运行了模拟器或者连接了真机，然后在你的项目目录中运行`react-native run-android`

顺序很关键。`run-android` 只会往「已经连上的设备」装包，它不会帮你把模拟器拉起来。设备没起就跑命令，得到的是一句 `No connected devices`，很多人会误以为是环境没配好，其实只是没开模拟器。

**Android Studio自带工具运行**

Android Studio 自带的 AVD Manager 能直接管理和启动模拟器，好处是和 SDK 版本天然对齐，坏处是吃内存、启动慢，在非 Intel 芯片上还得挑镜像架构。

![Android Studio 自带模拟器运行 RN 应用](https://s.poetries.top/gitee/2019/10/520.png)

**使用genymotion模拟器**

genymotion 当年比官方模拟器快很多，它跑在 VirtualBox 上，启动几秒钟就进系统，是那会儿很多人的首选。代价是要注册账号，个人非商用免费。

> 去官网需要注册并下载https://www.genymotion.com/，需要注册登录再下载的。注意下载`with virtualBox`版本，然后安装完成后需要登录，就是刚才注册的账号。登录后进入这个页面做两个操作

![genymotion 登录后的设备管理界面](https://s.poetries.top/gitee/2019/10/521.png)

> 点击`settings`，选择`adb`设置`sdk`就是刚才一直用的`sdk`安装路径，如下

这一步很容易被跳过，但它是整条链路能不能打通的关键。genymotion 默认用自己内置的 adb，和你系统里那个 adb 不是同一个，结果就是 genymotion 里设备明明在跑，终端 `adb devices` 却什么都看不到。把它指向刚才配的那个 SDK 路径，两边用同一个 adb，问题自然就没了。

![genymotion 设置中把 adb 指向本机 Android SDK 路径](https://s.poetries.top/gitee/2019/10/522.png)

> 启动项目，点击`genymotion`里的`start`启动我们刚才安装好的的虚拟设备，是这个样子的，此时我们刚才初始化的项目还没连上虚拟设备

![genymotion 启动后的虚拟设备桌面](https://s.poetries.top/gitee/2019/10/523.png)

> 然后在我们的工程项目里执行`adb devices`会列出当前启动的虚拟设备，能检测到说明没问题，如下图里最后一行显示的就是刚才我们开启的`genymotion`那台虚拟设备

`adb devices` 是整个 Android 调试链路的体检工具。设备列出来了就说明 adb 和设备之间通了，后面装包、reverse 端口都有基础；列不出来，先查 adb 是不是同一个、USB 调试有没有开、数据线是不是只能充电的那种。

![adb devices 列出 genymotion 虚拟设备](https://s.poetries.top/gitee/2019/10/524.png)


最后项目目录里执行

```
react-native run-android
```

> 打开`genymotion`，欢迎页面出来了，成功，修改一下文字，重新加载一遍，成功

- 第一次默认不是热加载形式，就是改变文件内容需要手动刷新的，这里设置一下热加载，以后内容这里就会自动刷新，`mac`是执行`command+r`，选择第四个`hot reloading`

![开发者菜单中开启 Hot Reloading](https://s.poetries.top/gitee/2019/10/525.png)

顺带说一句，Hot Reloading 这个能力后来被 Fast Refresh 取代了。Fast Refresh 把 Live Reload 和 Hot Reloading 合成一个开关，函数组件改动会尽量保留 state，改坏了报错也能恢复，比当年这套稳定得多，新版本里开发者菜单里已经看不到 `Hot Reloading` 这个选项了。

> 运行`react-native run-andriod` 会下载很多东西，然后出现这个标志说明编译没有问题，还缺少一个模拟设备

第一次跑 `run-android` 一定慢，Gradle 要把依赖全下一遍，网络不好的时候卡十几分钟很正常，不要以为是卡死了。下面三张图是当时的编译输出，看到 BUILD SUCCESSFUL 之后如果应用还没起来，八成就是设备没连上。

![Gradle 编译过程输出](https://s.poetries.top/gitee/2019/10/526.png)
![编译成功但提示缺少设备](https://s.poetries.top/gitee/2019/10/527.png)
![应用成功安装并启动到设备上](https://s.poetries.top/gitee/2019/10/528.png)

**如果是安卓5.0以下需要配置一下IP**

Android 5.0 以下不支持 `adb reverse`，设备没法直接把 `localhost:8081` 转发到电脑上，只能在开发者菜单的 Dev Settings 里手动填电脑的局域网 IP 和端口。前提是手机和电脑在同一个 Wi-Fi 下。

![低版本 Android 手动配置 Dev Settings 中的服务器 IP](https://s.poetries.top/gitee/2019/10/529.png)

### 1.2 安卓设备真机调试

模拟器再好用也替代不了真机。字体渲染、触摸反馈、机型定制系统的差异、性能表现，这几样只有真机上才看得准。国产 ROM 尤其如此，同一段代码在原生系统和某些定制系统上的表现能差出一截。

**1. 开启 USB 调试**

> 在默认情况下 `Android` 设备只能从应用市场来安装应用。你需要开启 `USB` 调试才能自由安装开发版本的 `APP`

开启入口一般藏在「设置 → 关于手机」，连点七次版本号解锁开发者选项，再进去打开 USB 调试。部分国产 ROM 还额外有一个「USB 安装」开关，不打开的话 adb 装包会被系统静默拦掉，报错信息还特别不明显。这个我踩过，当时以为是签名问题，折腾了很久才发现是系统拦的。

**2. 通过 USB 数据线连接设备**

> 下面检查你的设备是否能正确连接到 `ADB（Android Debug Bridge）`，使用`adb devices`命令：

![adb devices 列出已连接的 Android 真机](https://s.poetries.top/gitee/2019/10/530.png)

如果设备后面跟的是 `unauthorized` 而不是 `device`，说明手机上那个「允许 USB 调试」的授权弹窗你还没点确定，拔掉重插会再弹一次。

**3. 运行应用**

> 现在你可以运行`react-native run-android`来在设备上安装并启动应用了

**从设备上访问开发服务器**

- 运行`adb reverse tcp:8081 tcp:8081`
- 在命令行执行 `adb shell input keyevent 82`弹出开发者工具。打开热更新和远程调试

这两条命令值得单独记一下。`adb reverse tcp:8081 tcp:8081` 干的事情是把手机上的 8081 端口反向映射到电脑的 8081，这样手机里的 App 请求 `localhost:8081` 就能拿到电脑上 Metro 打包出来的 bundle，不需要连同一个 Wi-Fi，走 USB 线就行。`adb shell input keyevent 82` 则是模拟按下菜单键，用来在不方便摇手机的时候（比如手机架在支架上）弹出开发者菜单。

那结果就是，真机调试和模拟器调试的体验基本一致，改完保存直接刷新。

![真机上弹出的开发者菜单](https://s.poetries.top/gitee/2019/10/531.png)

### 1.3 移除vscode装饰器报错

这个和 RN 本身没关系，是编辑器的问题，但当年用 MobX 的项目基本都会撞上。装饰器语法 `@observable` 那一套在 TypeScript/JavaScript 里属于提案阶段的特性，VS Code 默认不认，会在编辑器里画一整片红波浪线，代码其实能正常跑，纯粹是看着糟心。

> 点击`Visual Studio Code`左下角的配置按钮。在搜索框内输入「experimentalDecorators」，发现竟然能够找到选项，如下

```
"javascript.implicitProjectConfig.experimentalDecorators": false
```

试着将`false`改为`true`，重启`Visual Studio Code`

这条配置作用于「没有 `jsconfig.json` 的隐式项目」。更干净的做法是在项目根目录建一个 `jsconfig.json`，把 `experimentalDecorators` 写进 `compilerOptions`，这样配置跟着仓库走，团队里其他人拉下来就生效，不用每个人改一遍自己的全局设置。

> https://blog.csdn.net/yiifaa/article/details/78862507


## 二、矢量图标的运用

图标这件事在双端适配里比想象中重要。用 PNG 切图，你得为 `1x/2x/3x` 各出一份，改个颜色就要重新出图，包体积还蹭蹭往上涨。矢量图标方案把图标做成字体文件，一份文件覆盖所有分辨率，颜色和大小直接用样式控制，和 Web 上的 iconfont 是一个思路。

https://github.com/oblador/react-native-vector-icons

> `react-native-vector-icons` 是可以直接使用图片名就能加载图片的第三方，类似于`web的 iconfont`矢量图，使用很方便，你不需要在工程文件夹里塞各种图片，节省很多空间，下面就来看看怎么使用吧


```
npm install react-native-vector-icons --save
npm install rnpm -g
```

装完 npm 包只完成了一半。这个库要用的是原生的字体资源，字体文件必须真的进到 Android 的 assets 目录和 iOS 的工程里，光装 JS 包是不够的。所有「图标显示成方块或者问号」的问题，根子都在字体没进包。

### 2.1 android平台

**1. 自动配置**

```bash
react-native link react-native-vector-icons
# 或者
npm install -g rnpm
rnpm link react-native-vector-icons
```

> 会为你配置好所有，但是这是成功的情况下，你不需要操心任何事，但是往往不能如愿。如果你这步成功了，而且能够正常运行，下面这些你就可以跳过

`react-native link` 干的活其实就是替你改原生工程文件，往 gradle 里塞依赖、往 `MainApplication.java` 里注册 package、把字体拷进 assets。它是纯文本匹配替换，所以只要你的原生文件被别的库改过、或者格式和它预期的不一样，它就会静默地什么都不做，或者改坏。当年这套东西不靠谱是出了名的，所以下面那份手动配置步骤才有价值。

这块现在已经变了。RN 从 0.60 起支持 autolinking，第三方原生模块靠 CLI 在构建期自动发现，`react-native link` 被标记废弃并最终移除。不过要注意，autolinking 管的是原生模块的链接，字体资源这类静态资源仍然要单独处理，目前的常见做法是在 `react-native.config.js` 里声明 `assets` 路径再跑资源链接命令，具体命令名以官方文档为准。

**2. 手动配置**

下面这四步是纯手工把这个库接进 Android 工程，看懂了它，你就大致知道 `link` 在背后做了什么，以后接别的原生库出问题也知道去哪找。

- 第一步：复制字体文件（这一步千万不能忘记，不然就算运行成功你也看不到图标）

> 找到项目`node_modules/react-native-vector-icons/Fonts`，里面有很多已经内置的图标库字体文件，依照自己的需求，复制你需要的字体文件到 `android/app/src/main/assets/fonts`，（如果没有这个目录就自行创建）

只拷你真正用到的那几个字体。这个库内置了 FontAwesome、Ionicons、MaterialIcons 等十几套图标，全拷进去会白白撑大 APK 体积。按需选，一般一两套就够一个 App 用了。

![react-native-vector-icons 内置的字体文件目录](https://s.poetries.top/gitee/2019/10/532.png)


- 第二步：配置 `android/settings.gradle`

这一步是把这个库的 Android 子工程纳入 Gradle 的构建范围，不做的话下一步的 `compile project` 会找不到目标。

在现有的代码基础上添加如下代码


```
include ':react-native-vector-icons'
project(':react-native-vector-icons').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-vector-icons/android')
```

- 第三步：配置`android/app/build.gradle`

声明完子工程的位置，还要在 app 模块的依赖里真正引它进来，这样编译时才会把这个库的代码打进 APK。

```js
dependencies {
    compile project(':react-native-vector-icons') //添加
    compile fileTree(dir: "libs", include: ["*.jar"])
    compile "com.android.support:appcompat-v7:23.0.1"
    compile "com.facebook.react:react-native:+"  // From node_modules
    compile project(':react-native-navigation')
}
```

这段是 2019 年的 Gradle 写法，`compile` 关键字在 Gradle 3.x 之后就被废弃了，现在统一用 `implementation` 或 `api`，区别在于依赖会不会传递给上层模块。另外 `com.android.support` 这套 support 库也已经整体迁到了 AndroidX，新工程里看到的会是 `androidx.appcompat`。老项目照抄这段没问题，新项目直接按当前模板的写法来。

- 第四步：配置 `android/app/src/main/java/com/xxxx/MainApplication.java`

最后一步是把这个库的 ReactPackage 注册进 RN 运行时，JS 侧才能拿到对应的原生能力。

```js
import com.oblador.vectoricons.VectorIconsPackage;
@Override
  protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
      new MainReactPackage()
+   , new VectorIconsPackage()
    );
  }
```

> 到这里配置就全部完成，接下来就可以在`rn`项目中使用`iconfont`

注意这段代码块标的是 `js`，实际内容是 Java，前面那个 `+` 是 diff 标记不是语法的一部分，照抄的时候要去掉。手动注册 package 这件事，也是 autolinking 之后不再需要手写的部分之一。

![RN 项目中矢量图标正常显示的效果](https://s.poetries.top/gitee/2019/10/533.png)

### 2.2 IOS平台

iOS 侧的思路和 Android 一样，把字体文件塞进工程，再在 `Info.plist` 里声明一遍，让系统在启动时加载这些字体。区别是 iOS 多了「声明」这一步，光把文件拖进去不写 plist 是不生效的。

> 打开你的`Xcode`项目工程，右键工程文件，选择`react`项目下的`node_modules/react-native-vector-icons/Fonts`文件

![Xcode 中把字体文件加入工程](https://s.poetries.top/gitee/2019/10/534.png)

拖文件进 Xcode 的时候要勾上 Copy items if needed，并确认 Target Membership 选中了你的 App target。这两个没勾对，编译能过但运行时字体不在包里，表现同样是一堆方块。

**在 xcode 的 Info.plist 文件中，加入 Fonts provided by application 数组**

![Info.plist 中新增 Fonts provided by application 数组](https://s.poetries.top/gitee/2019/10/535.png)

> 打开终端，输入：`rnpm link`，回车后会看到`Fonts provided by application`下加入如下字体

![Fonts provided by application 数组填充完成后的样子](https://s.poetries.top/gitee/2019/10/536.png)

这个数组里填的是字体的**文件名**（带扩展名），不是字体的 PostScript 名，两者经常不一样。写错了不会报错，只是图标不显示，排查起来很费劲。

> 重新运行`react`项目，终端输入：`react-native run-ios`，可以看到效果了

改完原生资源必须重新编译，光刷新 JS 是没用的，这一点在接任何原生库的时候都成立。


## 三、react-native-router-flux的使用

路由是 RN 项目里最早要定下来的东西之一，因为它决定了页面之间怎么组织、参数怎么传、返回键怎么处理。RN 官方早期自带的 `Navigator` 用起来相当繁琐，你得一路把 `navigator` 对象往下传，组件层级一深就很难受。`react-native-router-flux` 解决的就是这个问题，它在顶层集中声明所有页面，然后暴露一个全局的 `Actions` 对象，任何地方直接 `Actions.login()` 就能跳转，不用关心 navigator 从哪来。

> https://github.com/aksonov/react-native-router-flux

先把话说在前面。这个库在 2019 年前后确实流行，但社区重心后来整体转向了 `react-navigation`（本文第七节会讲）和 `react-native-screens` 那一套，`react-native-router-flux` 已经很久没有活跃维护了。这一节我完整保留，一是因为存量项目还有不少在用，二是它的 API 表本身就是一份很好的「移动端路由需要考虑哪些东西」的清单，看完你去看别的路由库也会更快上手。新项目我不建议再选它。

### 3.1 简介

**特性**


> `react-native-router-flux` 是一个路由包，在一个中心区域定义可切换`scene`模块。在使用过程中，跟`react-native`提供的`navigator`的区别是你不需要有`navigator`对象。你可以在任意地方使用简单的语法去控制`scene`的切换，如：` Actions.login({username, password})`  or `Actions.profile({profile})` or 甚至`Actions.profile(123)` ,其中`login` `profile`等是路由的`key`，通过调用`key`来切换路由

- 所有的参数将被注入到`this.props`中给`Sene`组件使用

**功能和亮点**

- 可定制的导航条：由`Scene`或者`Scene`的`state`去控制导航条的`show`／`hide`
- 嵌套导航：每一个`tab`都可以有自己的导航，该导航被嵌套在`root`导航中
- 使用`Action sheet` 来自定义场景渲染器
- 动态路由：动态路由将允许你通过应用的`state`去选着哪个`scene`将被渲染
- `Reset History stack`重置历史栈：新的`reset` 类型将提供清除历史栈河消除导航的返回按钮的功能
- 更加强大的状态控制：在多个`scene`中可以有不同的`state`

这几条特性里，「动态路由」和「Reset History stack」是实际项目中最常用到的。前者让你能根据登录态决定进首页还是进登录页，后者用在登录成功后清空历史栈，避免用户按返回键又退回登录页。这两个需求任何一个 App 都躲不开。

```
npm i react-native-router-flux --save
```

这个库提供了两种声明路由的方式，差别在于 `Scene` 树是写成 `Router` 的子节点，还是提前用 `Actions.create` 编译好再传进去。功能上等价，后者的好处是路由表可以单独抽成一个模块，不和 App 组件耦合在一起。

**使用方式一**

> 在你的`src/index.js`级别的文件中使用`Scene`组件定义你的`scenes`，并且`Scene`组件作为`Router`的子节点。定义好的`Scene`将由`Router`来控制其行为

```js
import {Scene, Router, Actions} from 'react-native-router-flux';
import PageOne from "./Component/PageOne"; 
import PageTwo from "./Component/PageTwo";

const Root = () => {
  return (
    <Router>
      {/* 这种写法是将全部的跳转页面都放在Root下面 */}
      <Scene key="root">
        {/* key 就是给页面的标签,供Actions使用 */}
        {/* component 设置关联的页面 */}
        {/* title 就是给页面标题 */}
        {/* initial 就是设置默认页面*/}
        <Scene
          key="one"
          component={PageOne}
          title="PageOne"
          initial={true}
        />
        <Scene key="two" component={PageTwo} title="PageTwo" />

      </Scene>
    </Router>
  );
};
```


**第二种使用方式**

> 你可以在编译期定义你所有的`scenes`，并在后面的`Router`里面使用

```jsx
import {Actions, Scene, Router} from 'react-native-router-flux';

const scenes = Actions.create(
  <Scene key="root">
    <Scene key="login" component={Login} title="Login"/>
    <Scene key="register" component={Register} title="Register"/>
    <Scene key="home" component={Home}/>
  </Scene>
);

/* ... */

class App extends React.Component {
  render() {
    return <Router scenes={scenes}/>
  }
}
```

这里原稿贴重复了一遍并且第二遍的 `import` 少了开头，已经删掉，上面这段才是完整可运行的版本。

两种方式选哪个，我的建议是路由多了就用第二种。`Actions.create` 提前把 `Scene` 树编译成路由配置，你可以把它单独放在 `src/router.js` 里，App 组件就只剩一行 `<Router scenes={scenes}/>`，看着清爽很多。

在任意地方通过导入

```js
import {Actions} from 'react-native-router-flux'
```

> 获得`Actions` 对象，`Actions`对象将是我们操作`Scenes`的遥控器。通过`Actions`我们可以向`Router`发出动作让`Router`控制`Scene`变化。

- 调用`Actions.ACTION_NAME(PARAMS)`可以展示一个`scene`，参数将被注入`scene`中
 (如`Actions.login()`切换到登录页面)
- `Actions.pop()`方法将会弹出当前的`scene`，他接受如下可选参数 
  - `{popNum:[number]}`允许你去一次弹出多个`scene`
  - `{refresh:{...propsToSetOnPreviousScene}}`允许你去刷新`pop`后的`scene`
- `Actions.refresh(PARAMS)`会更新当前`scene`的属性

`Actions` 是全局单例，这是它用起来爽的原因，也是它的问题所在。爽在任何组件里 import 一下就能跳转，不用逐层传 props；问题在于路由状态脱离了 React 的数据流，测试和调试的时候不太好追踪，多人协作时也容易出现到处随手跳转、路由关系混乱的情况。`react-navigation` 后来选择把 `navigation` 对象通过 props 和 Hook 注入，就是在这两者之间做的另一种权衡。

### 3.2 简单例子

光看 API 表容易懵，跑一个最小的两页面例子最直观。下面这份代码分三块，路由表、第一页、第二页。

```js
import {Router, Scene} from "react-native-router-flux";
import PageOne from "./Component/PageOne"; 
import PageTwo from "./Component/PageTwo";

const Root = () => {
  return (
    <Router>
      {/* 这种写法是将全部的跳转页面都放在Root下面 */}
      <Scene key="root">
        {/* key 就是给页面的标签,供Actions使用 */}
        {/* component 设置关联的页面 */}
        {/* title 就是给页面标题 */}
        {/* initial 就是设置默认页面*/}
        <Scene
          key="one"
          component={PageOne}
          title="PageOne"
          initial={true}
        />
        <Scene key="two" component={PageTwo} title="PageTwo" />

      </Scene>
    </Router>
  );
};
```

```js
// PageOne 的核心代码，点击 Text 跳转到下一个页面

//导入Action的包,处理页面跳转
import { Actions } from 'react-native-router-flux'; 

const PageOne = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.welcome}
        onPress={()=>Actions.two()} >
        我是Page One
      </Text>
    </View>
  );
};
```

```js
// PageTwo 的核心代码

export default class PageTwo extends Component {
    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.welcome}>我是Page Two </Text>
            </View>)
    }
}
```

这三段合起来才是一个能跑的最小 demo。`Root` 负责声明路由表，`PageOne` 里点文字触发 `Actions.two()`，`two` 就是 `Scene` 上写的那个 `key`，路由靠 key 找到对应的 `component` 并推进栈里。

运行就可以看到下面的效果：

![两个页面之间通过 Actions 切换的效果](https://s.poetries.top/gitee/2019/10/537.png)

简单就完成了两个页面之间的切换


**每一个`Scene component` 有如下属性**

- `key`：一个唯一的字符串，用来标识一个`Scene`，可以理解为`scene`的一个身份牌号码
- `component`：当切换到该`scene`时，`component`属性引用的组件将被渲染出来
- `title`：当切换到对应的`scene`时，屏幕顶部的导航条中间将显示该`title`
- `initial={true}` 表示默认为初始化`scene`

> 在`pageOne`中有一个`Text`组件，当点击`onPress`方法，该方法将调用`Actions.pageTwo`

- 会调用`Actions.SCENE_KEY(PARAMS) `,`SCENE_KEY`即为之前定义的`key`值，参数为可选的
- 我们的`Actions`就会通知`Router`，把`key=pageTwo`的`Scene`显示出来，如果传有参数的话，参数也会传入`Scene`组件中

```js
render() {
  const goToPageTwo = () => Actions.pageTwo({text: 'Hello World!'}); 
  return (
    <View>
      <Text onPress={goToPageTwo}>This is PageOne!</Text>
    </View>
  )
}
```

> 我们传递一个参数名为`text` 。值为`Hello World`！如下所示，我们就可以在`key=pageTwo`的`scene`的`component`属性置顶的组件中通过`props`获取该参数值

```js
render() {
  return (
    <View>
      <Text>This is PageTwo!</Text>
      <Text>{this.props.text}</Text>
    </View>
  )
}
```

这两段原稿里的 JSX 标签丢了，只剩下裸文本，我按上下文补回了 `View` 和 `Text`。这里也顺带提醒一句 RN 和 Web 的一个硬性差异，RN 里所有文字必须包在 `<Text>` 里，直接把字符串塞进 `<View>` 会直接崩，报的错是 `Text strings must be rendered within a <Text> component`。从 Web 转过来的人几乎都会踩这一下。

> 我们从`pageOne`跳转到了`pageTwo`，如果我们想跳回`pageOne`怎么办呢

- 官方提供的导航栏早已提供了一个`back icon`，我们也可以通过调用`Actions.pop()`方法将当前`scene`弹出栈，我们的`pageOne`就在栈顶了，此时显示的就是`pageOne`了，如果跳回来后我们需要刷新当前`scene`，我们可以调用`Actions.refresh(PARAMS)`

**数据传递与刷新**

正向传参很简单，`Actions.key(params)` 一路带过去就行。真正麻烦的是反向，从详情页改完数据退回列表页，列表页怎么知道要刷新。这个场景在业务里太常见了，编辑完地址返回地址列表、支付完返回订单详情，都是它。

> 页面之间的切换自然不会缺少数据的传递，而且这个路由框架可以实时 `refresh` 当前页面

- 先看页面之间传递数据吧，这里添加一个 `PageThree `

```js
import {Actions} from "react-native-router-flux"

const PageThree = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.welcome}
                //Actions.pop是退回到上一层
                  onPress={() => Actions.pop({
                      //refresh用于刷新数据
                      refresh: {
                          data: '从 three 回到 two'
                      }
                  })}>我是Page Three </Text>
        </View>
    );
};
```

`PageTwo` 也要修改一下代码

```js
import {Actions} from 'react-native-router-flux'; // New code

export default class PageTwo extends Component {

    render() {
        const data = this.props.data || "null";
        return (
            <View style={styles.container}>
                <Text style={styles.welcome}
                     //添加点击事件并传递数据到PageThree
                      onPress={() => Actions.three({data: "从 two 传递到 three"})}
                >我是Page Two </Text>
               <Text style={styles.refresh}
                //展示从PageThree传回来的数据
                > refresh:{data}</Text>
            </View>)
    }
}
```

> 最后到 `Root.js` 添加新的 `Scence`

```js
const Root = () => {
    return (
        <Router>
               //...........
                <Scene key="three"
                       component={PageThree}
                       title="PageThree"/>
            </Scene>
        </Router>
    );
};
```

`Actions.pop({refresh: {...}})` 这个写法是关键。它做的事情是弹栈的同时，把 `refresh` 里的对象合并进上一个页面的 props，触发它重新渲染。所以 `PageTwo` 里只要老老实实从 `this.props.data` 读值，什么都不用监听，数据就自己回来了。

此时运行就可以看到页面数据传递的效果了


![PageThree 返回 PageTwo 并携带数据刷新的效果](https://s.poetries.top/gitee/2019/10/538.png)

> 可以看到从 `PageThree` 回到 `PageTwo` 数据传递并刷新页面的效果，不过如果需要实时刷新当前页面呢？这时就需要使用 `Actions.refresh` 方法了

```js
export default class PageTwo extends Component {

    render() {
        const data = this.props.data || "null";
        return (
            <View style={styles.container}>
                <Text style={styles.welcome}
                      onPress={() => Actions.three({data: "从 two 传递到 three"})}
                >我是Page Two </Text>
                <Text style={styles.refresh}
                      onPress={() => Actions.refresh({
                          data: 'Changed data',
                      })}
                > refresh:{data}</Text>
            </View>)
    }
}
```

`Actions.refresh` 和上面 `pop` 里的 `refresh` 是同一套机制，区别只在于作用对象。前者刷新自己，后者刷新弹栈后露出来的那个页面。

**Tab Scene**

底部标签栏几乎是每个 App 的标配，这也是路由库必须支持的能力。这里有个坑要注意，`tabBarPosition` 在 iOS 上默认 `bottom`、Android 上默认 `top`，两个平台的默认值是反的。做双端适配的时候如果不显式指定，你会得到两个完全不同的界面。

> 通过设置 `Scene` 属性的 `Tabs` 可以设置 `Tabs` 。这个也开发中经常用到的页面效果

```js
//设置tab选中时的字体颜色和标题
const TabIcon = ({focused , title}) => {
    return (
        <Text style={{color: focused  ? 'blue' : 'black'}}>{title}</Text>
    );
};

const Root = () => {
    return (<Router>
        {/*tabBarPosition设置tab是在top还是bottom */}
        <Scene hideNavBar tabBarPosition="bottom">
            <Tabs
                key="tabbar"
                swipeEnabled
                wrap={false}
                // 是否显示标签栏文字
                showLabel={false}
                tabBarStyle={{backgroundColor: "#eee"}}
                //tab选中的颜色
                activeBackgroundColor="white"
                //tab没选中的颜色
                inactiveBackgroundColor="red"
            >
                <Scene
                    key="one"
                    icon={TabIcon}
                    component={PageOne}
                    title="PageOne"
                />

                <Scene
                    key="two"
                    component={PageTwo}
                    title="PageTwo"
                    icon={TabIcon}
                />

                <Scene
                    key="three"
                    component={PageThree}
                    title="PageThree"
                    icon={TabIcon}
                />
            </Tabs>
        </Scene>
    </Router>)
};
```

![底部 Tab 标签栏的运行效果](https://s.poetries.top/gitee/2019/10/539.png)

上面这段里，`lazy` 这个属性没写但很值得开。默认情况下所有 tab 对应的页面在初始化时就全渲染了，首屏会明显变慢；设成 `true` 之后只有切到那个 tab 才渲染，代价是第一次切换有一点点延迟。tab 里有列表或者图表的话，开它收益很大。

### 3.3 react-native-router-flux之API

下面这几张表是我当时对着官方文档整理的中文速查表，日常查属性直接翻这里。表比较长，建议配合搜索用，不用从头读到尾。

> 英文版：https://github.com/aksonov/react-native-router-flux/blob/master/docs/API.md

#### 3.3.1 Router

`Router` 是整棵路由树的根，配置项不多，但 `backAndroidHandler` 这个必须重视，它是 Android 物理返回键的总开关。iOS 没有物理返回键，所以这一项是纯 Android 侧的适配点，不处理的话用户在首页按返回会直接退出应用。

|Property| Type|	Default|	Description|
|---|---|---|---|
|`children`||`required`|页面根组件|
|`wrapBy`	|`Function`||允许集成诸如`Redux`（`connect`）和`Mobx`（`observer`）之类的状态管理方案|
|`sceneStyle`|	`Style`	||	适用于所有场景的`Style`（可选）|
|`backAndroidHandler`|	`Function`||	允许在`Android`中自定义控制返回按钮（可选）|

**backAndroidHandler用法**

```js
const onBackPress = () => {
    if (Actions.state.index !== 0) {
      return false
    }
    Actions.pop()
    return true
}

backAndroidHandler={onBackPress}
```

这段逻辑读起来有点绕，拆开看就清楚了。返回 `false` 表示「我不处理，交给系统默认行为」，返回 `true` 表示「我已经处理了，别再往下传」。所以这里的意思是，不在首页时让系统正常返回上一页；已经在首页时手动 `pop` 一次并拦截掉，不让应用退出。真实项目里首页那一支通常还会加个「再按一次退出」的 Toast。

#### 3.3.2 Scene

`Scene` 是这个库里最重要的组件，属性也最多。下面这张表几乎覆盖了页面级的所有可配置项，做双端适配时重点关注 `headerMode`（iOS 和 Android 的标题栏渲染惯例不同）、`hideNavBar`、`backButtonImage` 这几个。

> 此路由器的最重要的组件， 所有 `<Scene>` 组件必须要有一个唯一的 `key`。父节点`<Scene>`不能将`component`作为`prop`，因为它将作为其子节点的组件

|Property| Type|	Default|	Description|
|---|---|---|---|
|`key`|`string`|`required`|将用于标识页面，例如`Actions.name(params)`。必须是独一无二的|
|`path`|	`string`|	|将被用来匹配传入的深层链接和传递参数，例如：`/user/:id/`将从`/user/1234/`用`params {id：1234}`调用场景的操作。接受`uri`的模板标准|
|`component`|`React.Component`|`semi-required`|要显示的组件，定义嵌套时不需要`Scene`。|
|`back`|`boolean`|`false`|如果是`true`，则显示后退按钮，而不是由上层容器定义的左侧`/drawer`按钮|
|`backButtonImage`|	`string`||设置返回按钮的图片|
|`backButtonTintColor`|	`string`||自定义后退按钮色调|
|`init`|`boolean`|`false`|如果是`true`后退按钮不会显示|
|`clone`|	`boolean`|	`false`|标有`clone`的场景将被视为模板，并在被推送时克隆到当前场景的父节点中|
|`contentComponent`|`React.Component`|	|用于呈现抽屉内容的组件（例如导航）|
|`drawer`|	`boolean`|	`false`|	载入`DrawerNavigator`内的子页面|
|`failure`|	`Function` || 如果`on`返回一个 falsey 值，那么`failure`将被调用|
|`backTitle`	|`string`	||	指定场景的后退按钮标题|
|`backButtonTextStyle`|	`Style`||		用于返回按钮文本的样式|
|`rightTitle`|	`string`||		为场景指定右侧的按钮标题|
|`headerMode` |`string`| `float`|指定标题应该如何呈现：（`float`渲染单个标题，保持在顶部，动画随着屏幕的变化，这是`iOS`上的常见样式。）`screen`（每个屏幕都有一个标题，并且标题淡入，与屏幕一起出现，这是`Android`上的常见模式）如果为`none`（不会显示标题）|
|`hideNavBar`|	`boolean`	|`false`|	隐藏导航栏|
|`hideTabBar`|	`boolean`|	`false`|隐藏标签栏（仅适用于拥有`tabs`指定的场景）|
|`hideBackImage`| `boolean`	| `false` |隐藏返回图片|
|`initial`|`boolean`|	`false`	|设置为`true`后，会默认显示该页面|
|`leftButtonImage`|	`Image`	||	替换左侧按钮图片|
|`leftButtonTextStyle`|	`Style`||		左侧按钮的文字样式|
|`leftButtonStyle`	|`Style`		||左侧按钮的样式|
|`leftButtonIconStyle`|	`Style`		||左侧按钮的图标样式|
|`modal`|	`boolean`|	`false`|将场景容器定义为`modal`，即所有子场景都将从底部弹起到顶部。它仅适用于`containers`（与`v3`版本的语法不同）|
|`navBar`|	`React.Component`||		可以使用自定义的`React`组件来定义导航栏|
|`navBarButtonColor`|	`string`	|	|设置导航栏返回按钮的颜色|
|`navigationBarStyle`|	`Style`	||	导航栏的样式|
|`navigationBarTitleImage`	|`Object`||导航栏中的图像中覆盖`title`的`Image`|
|`navigationBarTitleImageStyle`|	`object`	||	`navigationBarTitleImage`的样式|
|`navTransparent`|	`boolean`|	`false`|	导航栏是否透明|
|`on`	|`Function`	||	又名 `onEnter`|
|`onEnter`|	`Function`	||	当Scene要被跳转时调用。props将被作为参数提供。只支持定义了`component`的场景。|
|`onExit`	|`Function`||当`Scene`要跳转离开时调用。只支持定义了`component`的场景|
|`onLeft`|	`Function`	|	|当导航栏左侧按钮被点击时调用|
|`onRight`|	`Function`	||	当导航栏右侧按钮被点击时调用|
|`renderTitle`	|`React.Component`||		使用`React`组件显示导航栏的`title`|
|`renderLeftButton`	|`React.Component	`	||使用`React`组件显示导航栏的左侧按钮|
|`renderRightButton`|	`React.Component`||使用`React`组件显示导航栏的右侧按钮|
|`renderBackButton`	|`React.Component`		||使用`React`组件显示导航栏的返回按钮|
|`rightButtonTextStyle`	|`Style`|	|	右侧按钮文字的样式|
|`success`|	`Function`	||	如`on`返回一个"真实"的值，那么`success`将被调用|
|`tabs`	|`boolean`|	`false`|将子场景加载为`TabNavigator`。其他标签导航器属性也是适用|
|`title`	|`string`	||	要显示在导航栏中心的文本|
|`titleStyle`|	`Style`||		`title`的样式|
|`type`|	`string`|	`push`|可选的导航操作。你可以使用`replace`来替换此场景中的当前场景|

这张表里 `on` / `onEnter` / `onExit` / `success` / `failure` 这一组值得单独说。它们凑在一起就是一个页面级的路由守卫，`on` 里做判断（比如查有没有登录态），返回真值走 `success`，返回假值走 `failure`，典型用法是未登录时把用户踢去登录页。用它的好处是权限判断集中在路由配置里，不用在每个页面的生命周期里各写一遍。

#### 3.3.3 Tabs (<Tabs> or <Scene tabs>)

标签栏组件

> 你可以使用`<Scene>`中的所有`props`来作为`<Tabs>`的属性。 如果要使用该组件需要设置 ` <Scene tabs={true}>`

|Property| Type|	Default|	Description|
|---|---|---|---|
|`wrap`|	`boolean`	|`true`|	自动使用自己的导航栏包装每个场景（如果不是另一个容器）。|
|`activeBackgroundColor`	|`string`	||	指定焦点的选项卡的选中背景颜色|
|`activeTintColor`	|`string`		||指定标签栏图标的选中色调颜色|
|`inactiveBackgroundColor`|	`string`	||	指定非焦点的选项卡的未选中背景颜色|
|`inactiveTintColor`|	`string`	||	指定标签栏图标的未选中色调颜色|
|`labelStyle`|`object`|		|设置`tabbar`上文字的样式|
|`lazy`|	`boolean`|	`false`|在选项卡处于活动状态之前，不会渲染选项卡场景(推荐设置成`true`)|
|`tabBarComponent`|	`React.Component`	||	使用`React`组件以自定义标签栏|
|`tabBarPosition`|	`string`||		指定标签栏位置。`iOS`上默认为`bottom`，安卓上是`top`|
|`tabBarStyle`|	`object`	||	标签栏样式|
|`tabStyle`	|`object`		||单个选项卡的样式|
|`showLabel`|	`boolean`|	`true`	|是否显示标签栏文字|
|`swipeEnabled`|	`boolean`|	`true`	|是否可以滑动选项卡|
|`animationEnabled`|	`boolean`|	`true`|	切换动画|
|`tabBarOnPress`|	`function`	||	自定义`tabbar`点击事件|
|`backToInitial`|	`boolean`|	`false`	|如果选项卡图标被点击，返回到默认选项卡|

`backToInitial` 这个属性对应的是一个很常见的交互习惯，用户在某个 tab 里点进了三层详情页，再点一次这个 tab 的图标，期望是回到该 tab 的首页而不是停在原地。微信、淘宝这类 App 都是这个行为，做产品对齐的时候容易被提出来。

#### 3.3.4 Stack (<Stack>)

> 将场景组合在一起的组件，用于自己的基于堆栈实现的导航。使用它将为此堆栈创建一个单独的`navigator`，因此，除非您添加`hideNavBar`，否则将会出现两个导航条

「出现两个导航条」这个提示很实在。嵌套导航器时每一层都会自带一个导航栏，外层一个内层一个，视觉上就是页面顶部堆了两条。解法就是给其中一层加 `hideNavBar`，具体隐藏哪一层看你想让哪层控制标题。

#### 3.3.5 Tab Scene (child <Scene> within Tabs)

> 用于实现`Tabs`的效果展示，可以自定义`icon`和`label`

|Property| Type|	Default|	Description|
|---|---|---|---|
|`icon`|	`component`|	`undefined`|	作为选项卡图标放置的`RN`组件|
|`tabBarLabel`|	`string`||		`tabbar`上的文字|

`icon` 接收的是一个组件而不是图片地址，回调参数里会给你 `focused`，选中态和未选中态的样式全靠它区分。前面 Tab 例子里那个 `TabIcon` 就是最小实现，实际项目里一般会在这里换成 `react-native-vector-icons` 的图标组件，正好和第二节接上。

#### 3.3.6 Drawer (<Drawer> or <Scene drawer>)

> 用于实现抽屉的效果，需要在对应的 `Scene` 上设置 `drawer={true}`，也就是写成 `<Scene drawer={true}>`（原文这里写成了 `<drawer tabs={true}>`，属笔误）。

|Property| Type|	Default|	Description|
|---|---|---|---|
|`drawerImage`|	`Image`		||替换抽屉`hamburger`图标，你必须把它与`drawer`一起设置|
|`drawerIcon`|	`React.Component`|	|用于抽屉`hamburger`图标的任意组件，您必须将其与`drawer`道具一起设置|
|`hideDrawerButton`|`boolean`|	`false`	|是否显示`drawerImage`或者`drawerIcon`|
|`drawerPosition`|	`string`	||	抽屉是在右边还是左边。可选属性 `right` 或 `left`|
|`drawerWidth`	|`number`		||抽屉的宽度（以像素为单位）（可选）|

`drawerWidth` 这个值不要写死。不同机型的屏幕宽度差很多，同一个 280 在小屏机上占了大半个屏，在大屏机上又显得窄。稳妥的做法是用 `Dimensions.get('window').width` 乘一个比例算出来。

#### 3.3.7 Modals (<Modal> or <Scene modal>)

> 想要实现模态，您必须将其`<Modal>`作为您`Router`的根场景。在`Modal`将正常呈现第一个场景（应该是你真正的根场景），它将渲染第一个元素作为正常场景，其他所有元素作为弹出窗口（当它们 被`push`）

示例：在下面的示例中，`root`场景嵌套在`<Modal>`中，因为它是第一个嵌套`Scene`，所以它将正常呈现。如果要`push`到`statusModal`，`errorModal`或者`loginModal`，他们将呈现为`Modal`，默认情况下会从屏幕底部向上弹出。重要的是要注意，目前`Modal`不允许透明的背景。


```jsx
//... import components
<Router>
  <Modal>
    <Scene key="root">
      <Scene key="screen1" initial={true} component={Screen1} />
      <Scene key="screen2" component={Screen2} />
    </Scene>
    <Scene key="statusModal" component={StatusModal} />
    <Scene key="errorModal" component={ErrorModal} />
    <Scene key="loginModal" component={LoginModal} />
  </Modal>
</Router>
```

这里最容易搞错的是嵌套顺序。`<Modal>` 必须是 `Router` 的根，它的第一个子 `Scene` 会被当作正常页面渲染，从第二个开始才是模态。写反了的表现是整个应用启动就是一个从底部弹上来的框，看着很莫名其妙。

#### 3.3.8 Lightbox (<Lightbox>)

> `Lightbox`是用于将组件渲染在当前组件上`Scene`的组件 。与`Modal`不同，它将允许调整大小和背景的透明度

在下面的示例中，`root`场景嵌套在中`<Lightbox>`，因为它是第一个嵌套`Scene`，所以它将正常呈现。如果要`push`到`loginLightbox`，他们将呈现为`Lightbox`，默认情况下将放置在当前场景的顶部，允许透明的背景

```jsx
//... import components
<Router>
  <Lightbox>
    <Scene key="root">
      <Scene key="screen1" initial={true} component={Screen1} />
      <Scene key="screen2" component={Screen2} />
    </Scene>

    {/* Lightbox components will lay over the screen, allowing transparency*/}
    <Scene key="loginLightbox" component={loginLightbox} />
  </Lightbox>
</Router>
```

`Modal` 和 `Lightbox` 的分工，一句话就是不透明的用 `Modal`，需要盖在当前页面上还能看到底下内容的用 `Lightbox`。确认弹窗、加载遮罩、图片预览这类都归 `Lightbox`。

#### 3.3.9 Actions

这张表是日常写业务代码翻得最多的一张，因为跳转动作全在这里。`push` / `replace` / `reset` / `popTo` 四个的区别决定了返回键的行为，选错了用户就会退到不该退的地方。登录成功用 `reset`，把登录页整个从栈里清掉；表单提交成功后跳结果页用 `replace`，避免返回时又回到已提交的表单。

- 该对象的主要工具是为您的应用程序提供导航功能。 假设您的`Router`和`Scenes`配置正确，请使用下列属性在场景之间导航。 有些提供添加的功能，将`React`道具传递到导航场景
- 这些可以直接使用，例如，`Actions.pop()`将在源代码中实现的操作，或者，您可以在场景类型中设置这些常量，当您执行`Actions.main()`时，它将根据您的场景类型或默认值来执行动作

|Property| Type|	Default|	Description|
|---|---|---|---|
|`[key]`|	`Function`	|`Object`|	`Actions`将'自动'使用路由器中的场景`key`进行导航。如果需要跳转页面，可以直接使用`Actions.key()`或`Actions[key].call()`|
|`currentScene`|	`String`	||	返回当前活动的场景|
|`jump`|	`Function`	|`(sceneKey: String, props: Object)`	|用于切换到新选项卡. For Tabs only.|
|`popTo`|	`Function`|	`(sceneKey: String, props: Object)`|	返回到指定的页面|
|`push`|	`Function`|	`(sceneKey: String, props: Object)`	|跳转到新页面|
|`refresh`|	`Function`|	`(props: Object)`|重新加载当前页面|
|`replace`|	`Function`|	`(sceneKey: String, props: Object)`|	从堆栈中弹出当前场景，并将新场景推送到导航堆栈。没有过度动画|
|`reset`|	`Function`|	`(sceneKey: String, props: Object)`|	清除路由堆栈并将场景推入第一个索引. 没有过渡动画|
|`drawerOpen`	| `Function` | |如果可用，打开`Drawer` |
|`drawerClose`|`Function`||如果可用，关闭`Drawer`|

#### 3.3.10 ActionConst

> 键入常量以确定`Scene`转换，这些是优先于手动键入其值，因为项目更新时可能会发生更改

|Property| Type|	Default|	Description|
|---|---|---|---|
|`ActionConst.JUMP`	|`string`|	`'REACT_NATIVE_ROUTER_FLUX_JUMP'`|	`jump`|
|`ActionConst.PUSH`|	`string`|	`'REACT_NATIVE_ROUTER_FLUX_PUSH'`|	`push`|
|`ActionConst.PUSH_OR_POP`|	`string`|	`'REACT_NATIVE_ROUTER_FLUX_PUSH_OR_POP'`|	`push`|
|`ActionConst.REPLACE`|	`string`|	`'REACT_NATIVE_ROUTER_FLUX_REPLACE'`|	`replace`|
|`ActionConst.BACK`	|`string`|	`'REACT_NATIVE_ROUTER_FLUX_BACK'`|	`pop`|
|`ActionConst.BACK_ACTION`|	`string`|	`'REACT_NATIVE_ROUTER_FLUX_BACK_ACTION'`|	`pop`|
|`ActionConst.POP_TO`|	`string`|	`'REACT_NATIVE_ROUTER_FLUX_POP_TO'`|	`popTo`|
|`ActionConst.REFRESH`|	`string`|	`'REACT_NATIVE_ROUTER_FLUX_REFRESH'`|	`refresh`|
|`ActionConst.RESET`|	`string`|	`'REACT_NATIVE_ROUTER_FLUX_RESET'`|	`reset`|
|`ActionConst.FOCUS`	|`string`|	`'REACT_NATIVE_ROUTER_FLUX_FOCUS'`|	`N/A`|
|`ActionConst.BLUR`	|`string`|	`'REACT_NATIVE_ROUTER_FLUX_BLUR'`|	`N/A`|
|`ActionConst.ANDROID_BACK`|	`string`	|`'REACT_NATIVE_ROUTER_FLUX_ANDROID_BACK'`	|`N/A`|

用常量而不是手写字符串，理由文档里写了，版本升级时字符串值可能变，常量名不会。这在任何库里都是通用的好习惯。

#### 3.3.11 Universal and Deep Linking

深链接是 App 绕不过去的需求，从微信里点一个链接、从短信里点一个促销地址，都要能直接落到 App 的对应页面。这一节讲的就是怎么让 web 端的 URL 结构和 App 里的路由对上。

- 考虑这样一个`web`应用程序和`app`配对，这可能有一个 url `https://thesocialnetwork.com/profile/1234/`
- 如果我们同时构建一个`web`应用程序和一个移动应用程序，我们希望能够通过`path /profile/:id/`
- 在web上，我们可能想要用一个路由器来打开我们的`<Profile />`和参数`{ id: 1234 }`
- 在移动设备上，如果我们正确地设置了`Android / iOS`环境来启动我们的应用程序并打开`RNRF<Router />`,，那么我们还需要导航到我们的移动`<Profile />`场景和参数`{ id: 1234 }`

```html
<Router uriPrefix={'thesocialnetwork.com'}>
  <Scene key="root">
     <Scene key={'home'} component={Home} />
     <Scene key={'profile'} path={"/profile/:id/"} component={Profile} />
     <Scene key={'profileForm'} path={"/edit/profile/:id/"} component={ProfileForm} />
  </Scene>
</Router>
```

> 如果用户点击`http://thesocialnetwork.com/profile/1234/`在他们的设备，他们会打开`<Router/ >`，然后调用操作`Actions.profile({ id:1234 })`

JS 侧配好 `uriPrefix` 和 `path` 只是一半的工作，另一半在原生。iOS 要在 `Info.plist` 里注册 URL Scheme，还要配 Associated Domains 和服务端的 apple-app-site-association 文件；Android 要在 `AndroidManifest.xml` 里给 Activity 加 intent-filter。这两边不配，JS 这边的路由再对也接不到跳转。具体配置项各平台都在改，以苹果和 Google 的官方文档为准。


## 四、React Native基础知识

前面三节都在讲工程配置，这一节回到写代码本身。从 Web 转过来的人最容易在这里翻车，因为 RN 的组件模型和 DOM 长得像但不是一回事，样式的写法也不完全等同于 CSS。这一节把最基础的几块过一遍。

### 4.1 常见组件

- `Image` 图片
- `Text` 文本
- `View` 包裹最外层

这三个可以粗略对应到 Web 的 `img`、`span`、`div`，但对应关系并不严格。`View` 不能直接放文字，文字必须包在 `Text` 里；`Text` 可以嵌套 `Text` 并继承样式，这一点反而比 Web 更规整；`Image` 加载本地图用 `require`，加载网络图用 `{uri: '...'}`，而且网络图必须显式给宽高，否则默认尺寸是 0，图片加载了你也看不见。这个坑非常经典。

### 4.2 样式

RN 里没有 CSS 文件，样式就是 JS 对象，属性名用小驼峰（`backgroundColor` 而不是 `background-color`），数值不带单位。既然是对象，你就能像操作普通数据一样组合、条件切换、按平台分支，这是它比 CSS 灵活的地方。

> 实际开发中组件的样式会越来越复杂，我们建议使用`StyleSheet.create`来集中定义组件的样式

```javascript
import React, { Component } from 'react';
import { AppRegistry, StyleSheet, Text, View } from 'react-native';

export default class LotsOfStyles extends Component {
  render() {
    return (
      <View>
        <Text style={styles.red}>just red</Text>
        <Text style={styles.bigblue}>just bigblue</Text>
        <Text style={[styles.bigblue, styles.red]}>bigblue, then red</Text>
        <Text style={[styles.red, styles.bigblue]}>red, then bigblue</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  bigblue: {
    color: 'blue',
    fontWeight: 'bold',
    fontSize: 30,
  },
  red: {
    color: 'red',
  },
});

AppRegistry.registerComponent('LotsOfStyles', () => LotsOfStyles);
```


> 常见的做法是按顺序声明和使用`style`属性，以借鉴`CSS`中的「层叠」做法（即后声明的属性会覆盖先声明的同名属性）

代码里 `style={[styles.bigblue, styles.red]}` 和 `style={[styles.red, styles.bigblue]}` 渲染结果不同，就是这个层叠规则在起作用，数组里靠后的覆盖靠前的。数组元素里的 `false`、`null`、`undefined` 会被忽略，所以条件样式可以直接写成 `style={[styles.base, isActive && styles.active]}`，很顺手。

`StyleSheet.create` 值不值得用，老版本 RN 里它会把样式对象注册成 ID 传给原生，减少跨 Bridge 的数据量，性能上有实际收益。新架构下这层优化的意义已经不大了，但用它仍然有好处，写错属性名会在开发期被校验出来，而裸对象不会报任何错，样式就是静默失效。所以我一直用它。

至于用什么方案组织样式，除了原生的 `StyleSheet`，社区现在也有把 Tailwind 那套原子类搬到 RN 的做法，我在 [Tailwind 在 React Native 中的使用指南](https://feinterview.poetries.top/blog/tailwind-react-native-guide) 里聊过，感兴趣可以对比着看。

### 4.3 高度与宽度


> 最简单的给组件设定尺寸的方式就是在样式中指定固定的`width`和`height`。`React Native`中的尺寸都是无单位的，表示的是与设备像素密度无关的逻辑像素点

「无单位」这件事得理解透，它是双端适配的地基。你写 `width: 50`，在 1 倍屏上就是 50 个物理像素，在 3 倍屏上系统会自动换算成 150 个物理像素，视觉大小保持一致。所以你完全不用像做 Web 那样操心 dpr，但也因此，写死的数字在不同尺寸的屏幕上占屏比例是不同的，小屏机上更容易挤爆。真要按屏幕比例来，就得用 `Dimensions` 或者百分比。


```javascript
import React, { Component } from 'react';
import { AppRegistry, View } from 'react-native';

class FixedDimensionsBasics extends Component {
  render() {
    return (
      <View>
        <View style={{width: 50, height: 50, backgroundColor: 'powderblue'}} />
        <View style={{width: 100, height: 100, backgroundColor: 'skyblue'}} />
        <View style={{width: 150, height: 150, backgroundColor: 'steelblue'}} />
      </View>
    );
  }
};
// 注册应用(registerComponent)后才能正确渲染
// 注意：只把应用作为一个整体注册一次，而不是每个组件/模块都注册
AppRegistry.registerComponent('AwesomeProject', () => FixedDimensionsBasics);
```

- 在组件样式中使用`flex`可以使其在可利用的空间中动态地扩张或收缩。一般而言我们会使用`flex:1`来指定某个组件扩张以撑满所有剩余的空间。如果有多个并列的子组件使用了`flex:1`，则这些子组件会平分父容器中剩余的空间。如果这些并列的子组件的`flex`值不一样，则谁的值更大，谁占据剩余空间的比例就更大（即占据剩余空间的比等于并列组件间`flex`值的比）
- 组件能够撑满剩余空间的前提是其父容器的尺寸不为零。如果父容器既没有固定的`width`和`height`，也没有设定`flex`，则父容器的尺寸为零。其子组件如果使用了`flex`，也是无法显示的。


```javascript
import React, { Component } from 'react';
import { AppRegistry, View } from 'react-native';

class FlexDimensionsBasics extends Component {
  render() {
    return (
      // 试试去掉父View中的`flex: 1`。
      // 则父View不再具有尺寸，因此子组件也无法再撑开。
      // 然后再用`height: 300`来代替父View的`flex: 1`试试看？
      <View style={{flex: 1}}>
        <View style={{flex: 1, backgroundColor: 'powderblue'}} />
        <View style={{flex: 2, backgroundColor: 'skyblue'}} />
        <View style={{flex: 3, backgroundColor: 'steelblue'}} />
      </View>
    );
  }
};

AppRegistry.registerComponent('AwesomeProject', () => FlexDimensionsBasics);
```

上面那条「父容器尺寸为零，子组件的 flex 就撑不开」是 RN 里最高频的布局问题，没有之一。页面白屏、组件不见了，先别怀疑数据，从最外层往里逐层检查有没有断掉的 `flex: 1`。当年排查这种问题的土办法是给每层 `View` 加个显眼的 `backgroundColor`，一眼就能看出哪一层塌了，现在有更好的选择，开发者菜单里的 Inspector 可以直接点选元素看盒模型，和浏览器的元素审查差不多。

### 4.4 处理文本输入

表单输入是业务里绕不开的一块，`TextInput` 的用法和 Web 的受控组件很像，但有几个平台差异要注意。


> `TextInput`是一个允许用户输入文本的基础组件。它有一个名为`onChangeText`的属性，此属性接受一个函数，而此函数会在文本变化时被调用。另外还有一个名为`onSubmitEditing`的属性，会在文本被提交后（用户按下软键盘上的提交键）调用


```javascript
import React, { Component } from 'react';
import { AppRegistry, Text, TextInput, View } from 'react-native';

export default class PizzaTranslator extends Component {
  constructor(props) {
    super(props);
    this.state = {text: ''};
  }

  render() {
    return (
      <View style={{padding: 10}}>
        <TextInput
          style={{height: 40}}
          placeholder="Type here to translate!"
          onChangeText={(text) => this.setState({text})}
        />
        <Text style={{padding: 10, fontSize: 42}}>
          {this.state.text.split(' ').map((word) => word && '🍕').join(' ')}
        </Text>
      </View>
    );
  }
}
```


这段 demo 用的是 `this.state` 加 class 组件的写法，现在一般写成函数组件加 `useState`，逻辑完全一样，只是少了 constructor 那几行。另外 `TextInput` 的双端差异有两处要留神，一是 Android 上默认自带一条下划线和内边距，想做统一视觉得手动把 `underlineColorAndroid` 设成 `transparent` 并调 padding；二是键盘弹出会遮住底部输入框，这在两个平台的行为不一样，通常配合 `KeyboardAvoidingView` 处理，而且 iOS 和 Android 要传不同的 `behavior`。

### 4.5 如何使用滚动视图


> `ScrollView`是一个通用的可滚动的容器，你可以在其中放入多个组件和视图，而且这些组件并不需要是同类型的。`ScrollView`不仅可以垂直滚动，还能水平滚动（通过`horizontal`属性来设置）

- `ScrollView`适合用来显示数量不多的滚动元素。放置在`ScollView`中的所有组件都会被渲染，哪怕有些组件因为内容太长被挤出了屏幕外。如果你需要显示较长的滚动列表，那么应该使用功能差不多但性能更好的`ListView`组件

「全部渲染」这四个字就是 `ScrollView` 的性能天花板。放二十个卡片没问题，放两千个，首次渲染就会卡到用户以为应用死了，内存也会一路涨。判断标准很简单，元素数量固定且不多就用它，数量不确定或者会不断追加就换列表组件。

这里补一个时效性说明，原文提到的 `ListView` 早就被官方废弃并移除了，取代它的正是下一节要讲的 `FlatList` 和 `SectionList`。现在写代码不要再找 `ListView` 了，你在新版本里根本 import 不到。


```javascript
import React, { Component } from 'react';
import{ ScrollView, Image, Text, View } from 'react-native'

export default class IScrolledDownAndWhatHappenedNextShockedMe extends Component {
  render() {
      return(
        <ScrollView>
          <Text style={{fontSize:96}}>Scroll me plz</Text>
          <Image source={require('./img/favicon.png')} />
          <Image source={require('./img/favicon.png')} />
          <Image source={require('./img/favicon.png')} />
        </ScrollView>
    );
  }
}
```

### 4.6 如何使用长列表


- `FlatList`组件用于显示一个垂直的滚动列表，其中的元素之间结构近似而仅数据不同
- `FlatList`更适于长列表数据，且元素个数可以增删。和`ScrollView`不同的是，`FlatList`并不立即渲染所有元素，而是优先渲染屏幕上可见的元素
- `FlatList`组件必须的两个属性是`data`和`renderItem`。`data`是列表的数据源，而`renderItem`则从数据源中逐个解析数据，然后返回一个设定好格式的组件来渲染


```javascript
import React, { Component } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

export default class FlatListBasics extends Component {
  render() {
    return (
      <View style={styles.container}>
        <FlatList
          data={[
            {key: 'Devin'},
            {key: 'Jackson'},
            {key: 'James'},
            {key: 'Joel'},
            {key: 'John'},
            {key: 'Jillian'},
            {key: 'Jimmy'},
            {key: 'Julie'},
          ]}
          renderItem={({item}) => <Text style={styles.item}>{item.key}</Text>}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
   flex: 1,
   paddingTop: 22
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
})
```

例子里 `data` 用的是 `{key: 'Devin'}` 这种结构，是因为 `FlatList` 默认拿 `item.key` 当唯一标识。实际业务里数据大多是后端返回的，字段名不叫 `key`，这时要显式传 `keyExtractor={item => String(item.id)}`。不传的表现是控制台一片黄色警告，列表数据更新时还可能出现错位复用，滚动几屏之后内容对不上号。

`FlatList` 用好了还有几个属性值得配。`initialNumToRender` 控制首屏渲染多少条，太大拖慢首屏、太小滚动时容易白屏；`getItemLayout` 在行高固定时能让列表跳过测量直接算位置，长列表提升很明显；`removeClippedSubviews` 在超长列表上能省内存，但在某些场景下会有渲染异常，要实测。我自己的做法是先用默认配置跑，卡了再一项项调，不要一上来就堆参数。

### 4.7 网络

> 默认情况下，`iOS`会阻止所有非`https`的请求。如果你请求的接口是`http`协议，那么首先需要添加一个`App Transport Security`的例外

这一条在联调阶段几乎人人中招。本地起的接口通常是 `http://192.168.x.x:3000` 这种，iOS 上会被 ATS 直接拦掉，报的错是网络请求失败，看起来像是接口挂了，实际是系统策略。解法是在 `Info.plist` 里给这个域名开 ATS 例外，注意只在开发配置里开，别把 `NSAllowsArbitraryLoads` 带进上架包，苹果审核会问。

Android 侧也有对应的限制，从 Android 9（API 28）开始默认禁止明文 HTTP 流量，需要通过 `network_security_config.xml` 声明允许的域名。两个平台各有各的口子，做双端联调时两边都要配。

顺带说，RN 内置的 `fetch` 和 `XMLHttpRequest` 都能用，社区更常见的是直接用 `axios`，拦截器、超时、取消这些能力现成，和 Web 项目的写法可以直接复用。

## 五、React Native布局

布局是双端适配里花时间最多的部分。RN 用的是 Facebook 自己实现的一套 Flexbox 引擎（早期叫 css-layout，后来叫 Yoga），它照着 W3C 的 Flexbox 规范做，但没有完全实现，默认值也和浏览器不一样。从 Web 转过来的人凭 CSS 直觉写，十有八九会在这几个默认值上翻车。

### 5.1 宽和高

- 一个组件的高度和宽度决定了它在屏幕上的尺寸，也就是大小
- 在`React Native`中尺寸是没有单位的，它代表了设备独立像素

```html
<View style={ {width:100,height:100,margin:40,backgroundColor:'gray'}}>
 <Text style={ {fontSize:16,margin:20}}>尺寸</Text>
</View>
```

### 5.2 和web中的差异


> `React Native`中的`FlexBox` 和`Web CSSS`上`FlexBox`的不同之处


- `flexDirection`:  `React Native`中默认为`flexDirection:'column'`，在`Web CSS`中默认为`flex-direction:'row'`
- `alignItems`:  `React Native`中默认为`alignItems:'stretch'`，在`Web CSS`中默认`align-items:'flex-start'`
- `flex`: 相比`Web CSS`的`flex`接受多参数，如:`flex: 2 2 10%`;，但在 `React Native`中`flex`只接受一个参数
- 不支持属性：`align-content`，`flex-basis`，`order`，`flex-basis`，`flex-flow`，`flex-grow`，`flex-shrink`

这四条里，前两条是最容易出事的。`flexDirection` 默认 `column` 这一点，意味着你在 RN 里写一个 `View` 包两个子元素，它们默认是上下排的，而 Web 里是左右排。做过 Web 的人第一次写 RN 布局，基本都会疑惑「我什么都没写为什么它竖着排」。原因就在这。

`alignItems` 默认 `stretch` 带来的效果是子元素在侧轴上默认被拉满。有时候这很方便，有时候你只是想让一个按钮按内容宽度显示，结果它横跨了整行，这时候要么给它 `alignSelf: 'flex-start'`，要么在父级改 `alignItems`。

不支持列表这块要补一句时效性。这份清单是 2019 年的状态，Yoga 后来陆续补齐了一些能力，`flexGrow`、`flexShrink`、`flexBasis` 在后来的版本里是可以单独写的（用小驼峰形式），`gap` 这类属性也在较新的版本中得到了支持。具体哪个版本支持到哪一步，请查官方的 Layout Props 文档，别照着这份 2019 年的清单去判断。

### 5.3 Layout 

> 以下属性是`React Native`所支持的`Flex`属性

#### 5.3.1 容器属性

- `flexDirection`: `row` `column` `row-reverse` `column-reverse`
- `flexWrap`: `wrap` `nowrap` 
- `justifyContent`: `flex-start` `flex-end` `center` `space-between` `space-around`
- `alignItems`: `flex-start` `flex-end` `center` `stretch`

#### 5.3.2 横轴和竖轴

> 主轴即水平方向的轴线，可以理解成横轴，侧轴垂直于主轴，可以理解为竖轴

这句表述要小心，它只在 `flexDirection: 'row'` 的前提下成立。主轴的方向是由 `flexDirection` 决定的，设成 `column` 时主轴就是竖直方向，侧轴变成水平方向。这一点在 RN 里尤其要留神，因为 RN 的默认值恰好就是 `column`，也就是说不写任何东西时，主轴是竖的。

理清这个之后，`justifyContent` 和 `alignItems` 谁管哪个方向就不用背了。`justifyContent` 永远管主轴，`alignItems` 永远管侧轴，主轴在哪由 `flexDirection` 说了算。

#### 5.3.3 flexDirection

> - `flexDirection`: `row` `column` `row-reverse` `column-reverse`
> - `flexDirection`属性定义了父视图中的子元素沿横轴或侧轴方片的排列方式

- `row`: 从左向右依次排列
- `row-reverse`: 从右向左依次排列
- `column(default)`: 默认的排列方式，从上向下排列
- `column-reverse`: 从下向上排列

```html
<View style={ {flexDirection:'row-reverse',backgroundColor:"darkgray",marginTop:20}}>
  <View style={ {width:40,height:40,backgroundColor:"darkcyan",margin:5}}>
    <Text style={ {fontSize:16}}>1</Text>
  </View>
  <View style={ {width:40,height:40,backgroundColor:"darkcyan",margin:5}}>
    <Text style={ {fontSize:16}}>2</Text>
  </View>
  <View style={ {width:40,height:40,backgroundColor:"darkcyan",margin:5}}>
    <Text style={ {fontSize:16}}>3</Text>
  </View>
  <View style={ {width:40,height:40,backgroundColor:"darkcyan",margin:5}}>
    <Text style={ {fontSize:16}}>4</Text>
  </View>
</View>
```

![flexDirection 四种取值的排列效果对比](https://raw.githubusercontent.com/crazycodeboy/RNStudyNotes/develop/React%20Native%E5%B8%83%E5%B1%80/React%20Native%E5%B8%83%E5%B1%80%E8%AF%A6%E7%BB%86%E6%8C%87%E5%8D%97/images/flexDirection.jpg)

上图里 `row-reverse` 的效果值得留意，它不只是把元素倒过来排，起点也从右边开始了。做阿拉伯语这类从右往左阅读的语言适配时，这个特性用得上，不过更规范的做法是用 RN 提供的 RTL 支持，让系统统一翻转整个界面。

#### 5.3.4 flexWrap

> `flexWrap`属性定义了子元素在父视图内是否允许多行排列，默认为`nowrap`

- `nowrap flex`的元素只排列在一行上，可能导致溢出
- `wrap flex`的元素在一行排列不下时，就进行多行排列

```html
<View  style={ {flexWrap:'wrap',flexDirection:'row',backgroundColor:"darkgray",marginTop:20}}>

</View>
```

![flexWrap 换行与不换行的效果对比](https://raw.githubusercontent.com/crazycodeboy/RNStudyNotes/develop/React%20Native%E5%B8%83%E5%B1%80/React%20Native%E5%B8%83%E5%B1%80%E8%AF%A6%E7%BB%86%E6%8C%87%E5%8D%97/images/flexWrap.jpg)

标签墙、筛选项这类不定数量的元素排列，就靠 `flexWrap: 'wrap'`。这里有个坑要注意，RN 早期不支持 `align-content`，所以多行之间的间距不好统一控制，通常只能靠给每个子元素加 `margin` 来凑。另外没有 `gap` 的年代，最后一行的对齐也要自己处理。

#### 5.3.5 justifyContent

> - `justifyContent`属性定义了浏览器如何分配顺着父容器主轴的弹性（`flex`）元素之间及其周围的空间，默认为`flex-start`
> - `justifyContent`: `flex-start` `flex-end` `center` `space-between` `space-around`


- `flex-start(default)`从行首开始排列。每行第一个弹性元素与行首对齐，同时所有后续的弹性元素与前一个对齐
- `flex-end` 从行尾开始排列。每行最后一个弹性元素与行尾对齐，其他元素将与后一个对齐。
- `center` 伸缩元素向每行中点排列。每行第一个元素到行首的距离将与每行最后一个元素到行尾的距离相同。
- `space-between` 在每行上均匀分配弹性元素。相邻元素间距离相同。每行第一个元素与行首对齐，每行最后一个元素与行尾对齐。
- `space-around` 在每行上均匀分配弹性元素。相邻元素间距离相同。每行第一个元素到行首的距离和每行最后一个元素到行尾的距离将会是相邻元素之间距离的一半。


```html
<View  style={ {justifyContent:'center',flexDirection:'row',backgroundColor:"darkgray",marginTop:20}}>

</View>
```


![justifyContent 五种取值在主轴上的分布效果](https://raw.githubusercontent.com/crazycodeboy/RNStudyNotes/develop/React%20Native%E5%B8%83%E5%B1%80/React%20Native%E5%B8%83%E5%B1%80%E8%AF%A6%E7%BB%86%E6%8C%87%E5%8D%97/images/justifyContent.jpg)

`space-between` 和 `space-around` 的区别，看图比看文字快。前者两端顶边，中间均分；后者每个元素左右各分到一半间距，所以两端会留出一半宽度的空隙。列表项左右分列用 `space-between`，均匀分布的图标栏用 `space-around`，这是最常见的两种用法。

#### 5.3.6 alignItems

> `alignItems` 属性以与`justify-content`相同的方式在侧轴方向上将当前行上的弹性元素对齐，默认为`stretch`。

- `flex-start` 元素向侧轴起点对齐。
- `flex-end` 元素向侧轴终点对齐。
- `center` 元素在侧轴居中。如果元素在侧轴上的高度高于其容器，那么在两个方向上溢出距离相同。
- `stretch` 弹性元素被在侧轴方向被拉伸到与容器相同的高度或宽度

```html
<View  style={ {alignItems:'center',flexDirection:'row',backgroundColor:"darkgray",marginTop:20}}>

</View>
```

原文这段代码从上一节复制过来时没改属性名，写的还是 `justifyContent`，这里已经改成本节要演示的 `alignItems`。

![alignItems 四种取值在侧轴上的对齐效果](https://raw.githubusercontent.com/crazycodeboy/RNStudyNotes/develop/React%20Native%E5%B8%83%E5%B1%80/React%20Native%E5%B8%83%E5%B1%80%E8%AF%A6%E7%BB%86%E6%8C%87%E5%8D%97/images/alignItems.jpg)

日常写得最多的居中就是 `justifyContent: 'center'` 加 `alignItems: 'center'` 两条一起上，主轴侧轴都居中，元素就正正落在容器中间。这是 RN 里最省事的居中方案，比 Web 上那些绝对定位加 transform 的写法舒服太多。

#### 5.3.7 alignSelf

> `alignSelf`属性以属性定义了`flex`容器内被选中项目的对齐方式。注意：`alignSelf` 属性可重写灵活容器的 `alignItems` 属性

- `stretch` 元素被拉伸以适应容器。
- `center` 元素位于容器的中心。
- `flex-start` 元素位于容器的开头。
- `flex-end` 元素位于容器的结尾

```html
<View style={ {alignSelf:'baseline',width:60,height:    20,backgroundColor:"darkcyan",margin:5}}>
   <Text style={ {fontSize:16}}>1</Text>
</View>
```

![alignSelf 覆盖父容器 alignItems 的效果](https://raw.githubusercontent.com/crazycodeboy/RNStudyNotes/develop/React%20Native%E5%B8%83%E5%B1%80/React%20Native%E5%B8%83%E5%B1%80%E8%AF%A6%E7%BB%86%E6%8C%87%E5%8D%97/images/alignSelf.jpg)

`alignSelf` 的价值就在于「破例」。父容器统一了对齐规则，但某一个子元素想不一样，加一行 `alignSelf` 就行，不用为它专门再包一层 `View`。例子里用的 `baseline` 是按文字基线对齐，图标和文字混排的时候比 `center` 好看。

#### 5.3.8 flex

> `flex` 属性定义了一个可伸缩元素的能力，默认为`0`

```html
<View style={ {flexDirection:'row',height:40, backgroundColor:"darkgray",marginTop:20}}>
  <View style={ {flex:1,backgroundColor:"darkcyan",margin:5}}>
    <Text style={ {fontSize:16}}>flex:1</Text>
  </View>
  <View style={ {flex:2,backgroundColor:"darkcyan",margin:5}}>
    <Text style={ {fontSize:16}}>flex:2</Text>
  </View>
  <View style={ {flex:3,backgroundColor:"darkcyan",margin:5}}>
    <Text style={ {fontSize:16}}>flex:3</Text>
  </View>          
</View>
```


![flex 取 1、2、3 时子元素按比例分配空间](https://raw.githubusercontent.com/crazycodeboy/RNStudyNotes/develop/React%20Native%E5%B8%83%E5%B1%80/React%20Native%E5%B8%83%E5%B1%80%E8%AF%A6%E7%BB%86%E6%8C%87%E5%8D%97/images/flex.jpg)

图里 1:2:3 的比例一目了然。这个特性做等分布局特别方便，三个 tab 各写 `flex: 1` 就均分了，不用去算百分比，也不用管屏幕宽度是多少。整页布局的标准骨架也是这个套路，顶部导航固定高度，中间内容 `flex: 1` 吃掉剩余空间，底部工具栏固定高度，屏幕多大都能撑住。

### 5.4 视图边框

下面几节是尺寸、间距、定位这些具体属性的清单，写法和 CSS 基本一一对应，只是名字换成了小驼峰。放在这里当速查表用。

- `borderBottomWidth number`  底部边框宽度
- `borderLeftWidth number` 左边框宽度
- `borderRightWidth number`  右边框宽度
- `borderTopWidth number` 顶部边框宽度
- `borderWidth number` 边框宽度
- `border<Bottom|Left|Right|Top>Color` 个方向边框的颜色
- `borderColor` 边框颜色

### 5.5 尺寸

- `width number`
- `height number`

### 5.6 外边距

- `margin number` 外边距
- `marginBottom number` 下外边距
- `marginHorizontal number`  左右外边距
- `marginLeft number` 左外边距
- `marginRight number` 右外边距
- `marginTop number` 上外边距
- `marginVertical number` 上下外边距

### 5.7 内边距


- `padding number` 内边距
- `paddingBottom number` 下内边距
- `paddingHorizontal number` 左右内边距
- `paddingLeft number` 做内边距
- `paddingRight number`  右内边距
- `paddingTop number`  上内边距
- `paddingVertical number`  上下内边距

`marginHorizontal` / `marginVertical` 和 `paddingHorizontal` / `paddingVertical` 这几个是 RN 特有的简写，CSS 里没有直接对应物（后来 CSS 有了逻辑属性但语义不完全一样）。用它们能少写一半代码，`paddingHorizontal: 16` 比分别写左右两条清爽多了，推荐养成习惯。

另外提醒一点，RN 的盒模型只有 `border-box` 这一种行为，没有 `boxSizing` 可配。`width` 包含 padding 和 border，不用像 Web 那样先设一遍 `box-sizing`。

### 5.8 边缘


- `left number` 属性规定元素的左边缘。该属性定义了定位元素左外边距边界与其包含块左边界之间的偏移。
- `right number` 属性规定元素的右边缘。该属性定义了定位元素右外边距边界与其包含块右边界之间的偏移
- `top number`  属性规定元素的顶部边缘。该属性定义了一个定位元素的上外边距边界与其包含块上边界之间的偏移。
- `bottom number` 属性规定元素的底部边缘。该属性定义了一个定位元素的下外边距边界与其包含块下边界之间的偏移。


### 5.9 定位(position)


> `position:absolute|relative`属性设置元素的定位方式，为将要定位的元素定义定位规则。

- `absolute`：生成绝对定位的元素，元素的位置通过 "`left`", "`top`", "`right`" 以及 "`bottom`" 属性进行规定。
- `relative`：生成相对定位的元素，相对于其正常位置进行定位。因此，"`left:20`" 会向元素的 `LEFT` 位置添加 `20` 像素。

这里有两个和 Web 差别很大的点。第一，RN 没有 `fixed`，也没有 `static`，只有 `relative`（默认）和 `absolute` 两种，想做固定在屏幕底部的悬浮按钮，做法是在最外层容器里用 `absolute` 定位，而不是找 `fixed`。第二，RN 的 `absolute` 是相对于**父元素**定位的，父元素不需要额外声明 `position: relative`，这一点比 CSS 省心，但也意味着你没法轻易跳过父级去相对更外层定位。

还有一个和层级相关的差异。RN 里没有完整的 `z-index` 语义，Android 上层级主要由元素在树里的顺序和 `elevation` 决定，iOS 上则更接近渲染顺序。所以双端做浮层的时候，同一份 `zIndex` 在两个平台上表现可能不一致，这个我踩过，最后是靠调整 JSX 里的节点顺序解决的。

## 六、React Native适配

这一节是全文的主题落点。前面五节讲的都是「怎么写 RN」，这一节讲的是「同一份代码怎么在两个平台上都表现正常」。RN 号称一次编写多端运行，实际做下来，能完全不加分支就双端跑通的界面并不多，你总得处理状态栏高度、返回键、字体渲染、组件平台差异这些事。手段其实就四类，运行时判断平台、看文档的平台标识选 API、选双端都支持的组件、用资源命名约定让系统自己挑。

### 6.1 Platform.OS

> 为了提高代码的兼容性，我们有时需要判断当前系统的平台，然后做一些适配。比如，我们在使用`StatusBar`做导航栏的时候，在`iOS`平台下根视图的位置默认情况下是占据状态栏的位置的，我们通常希望状态栏下面能显示一个导航栏，所以我们需要为`StatusBar`的外部容器设置一个高度


```html
<View style={{height: Platform.OS === 'ios' ? 20:0}}>
    <StatusBar {...this.props.statusBar} />
</View>;
```

这段代码解决的是一个很具体的现象。iOS 上 App 的根视图默认是从屏幕最顶端开始的，状态栏那一条会盖在你的内容上，导致导航栏标题和时间、信号图标叠在一起；Android 上系统会自动给你留出状态栏的位置，不需要处理。所以这里的分支就是给 iOS 补一个占位高度，Android 补 0。

那个写死的 `20` 现在已经不能用了。20 是 iPhone X 之前的状态栏高度，刘海屏机型上是 44，动态岛机型又不一样。现在的正确做法是用安全区，RN 自带 `SafeAreaView`（iOS 有效），社区更通用的是 `react-native-safe-area-context`，它能同时给出上下左右四个方向的安全区数值，两个平台都覆盖。新写代码不要再往里填魔法数字了。

除了 `Platform.OS`，还有两个 API 一起用会更顺手。`Platform.select({ios: ..., android: ...})` 让你直接按平台返回不同的值，写样式对象时比三元表达式清爽；`Platform.Version` 能拿到系统版本号，用来处理某个系统版本以下的兼容问题，比如前面提到的 Android 5.0 以下不支持 `adb reverse` 那类版本相关差异。

再补一个更彻底的做法。文件名带上 `.ios.js` 和 `.android.js` 后缀，打包器会按平台自动挑对应的文件，你在业务代码里只写 `import Foo from './Foo'`，完全看不到分支。平台差异大到需要写两套实现时，这个方式比在一个文件里堆满 `Platform.OS` 判断干净得多。

### 6.2 留意api doc的android或ios标识

> 并不是所有`React Native`的一些`api`或组件的一些属性和方法都兼容`Android`和`iOS`，在`React Native`的`api doc`中通常会在一些属性或方法的前面加上`android`或`ios`的字样来标识该属性或方法所支持的平台，如

```
android renderToHardwareTextureAndroid bool
ios shouldRasterizeIOS bool
```

> 在上述代码中，`renderToHardwareTextureAndroid bool`只支持`Android`平台，`ios shouldRasterizeIOS bool`只支持`iOS`平台，所有我们在使用这些带有标记的属性或方法的时候就需要考虑对于它们不兼容的平台我们是否需要做相应的适配了

这个习惯值得刻意养成。单平台的属性传到另一个平台上不会报错，就是静默失效，所以问题不会在开发阶段暴露，而是在测试同学拿另一台手机试的时候才被发现。我的经验是，只在一个平台上验证过的代码，永远不要默认另一个平台也没问题。

从命名规律上也能看出一些端倪，属性名带 `Android` / `IOS` 后缀的（像上面这两个），基本都是单平台的。RN 官方文档里也会在属性旁边标 iOS 或 Android 的角标，翻文档时留意一眼就够了。

### 6.3 组件选择

> 比如，我们要开发一款应用需要用到导航组件，`在React Native`组件中有`NavigatorIOS`与`Navigator`两个导航组件来供我们选择，从`api doc`中我们可以看出`NavigatorIOS`只支持`iOS`平台，`Navigator`则两个平台都支持。
所以如果我们要开发的应用需要适配`Android`和`iOS`，那么`Navigator`才是最佳的选择。

为了提高代码的复用性与兼容性建议大家在选择`React Native`组件的时候要多留意该组件是不是兼容`Android`和`iOS`，尽量选择`Android`和`iOS`平台都兼容的组件。

这条原则今天依然完全成立，只是例子里的两个组件都已经是历史了。`NavigatorIOS` 和 `Navigator` 后来都被官方从核心库里移除，导航整体交给社区方案，也就是本文第七节的 `react-navigation` 那一套。

选第三方库的时候我一般看四件事，两个平台是不是都支持、最近一次提交是什么时候、issue 里有没有一堆未回复的崩溃报告、有没有跟上 RN 新架构。最后这条现在尤其重要，老架构下写的原生模块在新架构上不一定能直接跑。举个具体的例子，`react-native-camera` 这个当年几乎人人都在用的库，现在已经处于废弃状态，社区推荐迁到 `react-native-vision-camera`。所以照着老文章选库这件事本身就有风险，选之前先去仓库看一眼状态。

### 6.4 图片适配


> 开发一款应用少不了的需要用到图标。无论是`Android`还是`iOS`，现在不同分辨率的设备越来越多，我们希望这些图标能够适配不同分辨率的设备。为此我们需要为每个图标提供`1x`、`2x`、`3x`三种大小的尺寸`，React Native`会根据屏幕的分辨率来动态的选择显示不同尺寸的图片。比如：在`img`目录下有如下三种尺寸的`check.png`

```
└── img
    ├── check.png
    ├── check@2x.png
    └── check@3x.png
```

那么我们就可以通过下面的方式来使用`check.png`


```html
<Image source={require('./img/check.png')} />
```

> 提示：我们在使用具有不同分辨率的图标时，一定要引用标准分辨率的图片如`require('./img/check.png')`，如果我们这样写`require('./img/check@2x.png')`，那么应用在不同分辨率的设备上都只会显示`check@2x.png`图片，也就无法达到图片自适配的效果。

这套 `@2x` / `@3x` 命名约定来自 iOS，RN 把它统一到了两个平台上，打包器在构建时会扫描这些后缀并按设备 dpr 选图。你在代码里永远只写基础名，选哪张是运行时的事。

还有两条相关的规则值得记住。一是 `require` 里的路径必须是静态字符串，不能拼接变量，因为打包器要在构建期就把用到的图收集进包里，运行时才拼出来的路径它看不见。想动态选图，只能提前建一个映射表，把所有 `require` 都写死在里面。二是网络图片走 `{uri}`，这条链路不参与 `@2x` 机制，多倍图得由后端或 CDN 按需求返回。

回到双端适配这个主线上，图片这块两个平台的行为其实是一致的，真正会出岔子的是 Android 上的 `resizeMode` 表现和某些机型对大图的内存处理，图特别大的时候 Android 更容易 OOM。

## 七、react-navigation

第三节讲的 `react-native-router-flux` 是那个年代的选择之一，而 `react-navigation` 是后来社区真正收敛到的方向，也是官方文档里推荐的导航方案。两者的思路差别挺大，`router-flux` 靠全局 `Actions` 单例，`react-navigation` 则把 `navigation` 对象注入到页面 props 里（后来又提供了 `useNavigation` 这类 Hook），路由状态更贴近 React 自己的数据流。

> 文档 https://reactnavigation.org/docs/zh-Hans/getting-started.html

下面这些笔记基于的是 `react-navigation` 4.x 之前的 API，`createStackNavigator` 接一个路由配置对象、页面上写 `static navigationOptions` 这套写法。从 5.x 开始它整个改成了组件式的动态 API，路由用 `<Stack.Screen>` 声明，配置项改叫 `options`，`this.props.navigation.getParam` 也换成了 `route.params`。所以这一节的代码请当作老项目的维护参考，新项目直接照官网最新版本写。API 名字和版本对应关系以官方文档为准。

### 7.1 页面切换

- 跳转到新的页面(将新路由推送到堆栈导航器，如果它尚未在堆栈中，则跳转到该页面) `this.props.navigation.navigate('Details',{})`
- 不考虑现有导航历史的情况下添加其他路由 `this.props.navigation.push`
- 返回 `this.props.navigation.goBack()`
- 返回到堆栈中的第一个页面 `navigation.popToTop()`

`navigate` 和 `push` 的区别是这里最值得记的一点。`navigate` 会先看栈里有没有同名路由，有就直接跳回去，没有才推新的；`push` 不管三七二十一直接压栈。做「商品详情页里再点相关商品」这类可以无限套娃的场景，必须用 `push`，用 `navigate` 会发现点了没反应，因为它认为你已经在那个路由上了。这个我一开始也搞混过。

### 7.2 传递参数给路由

- `navigate`接受可选的第二个参数，以便将参数传递给要导航到的路由。 例如：`this.props.navigation.navigate('RouteName', {paramName: 'value'})`。
- 我们可以使用`this.props.navigation.getParam`读取参数
- 你也可以使用 `this.props.navigation.state.params`作为`getParam`的替代方案， 如果未指定参数，它的值是 `null`


```js
/* 1. Navigate to the Details route with params */
this.props.navigation.navigate('Details', {
  itemId: 86,
  otherParam: 'anything you want here',
});

/* 2. Get the param, provide a fallback value if not available */
const { navigation } = this.props;
const itemId = navigation.getParam('itemId', 'NO-ID');
const otherParam = navigation.getParam('otherParam', 'some default value');
```

`getParam` 带默认值这个设计很实用，省掉了一堆判空。不过它在 5.x 之后被移除了，现在统一从 `route.params` 读，默认值要自己用解构默认或者 `??` 兜。逻辑没变，写法变了。

参数传递还有个原则要提一句，路由参数里只放 id 和少量标量，别把整个大对象塞进去。参数会进路由状态，对象太大会影响状态序列化和深链接还原，页面拿到 id 后自己去请求数据反而更清晰。

### 7.3 配置标题栏

标题栏是双端差异最集中的地方之一，也是 `react-navigation` 花了最多篇幅去抹平的部分。

> 每个页面组件可以有一个名为`navigationOptions`的静态属性，它是一个对象或一个返回包含各种配置选项的对象的函数。我们用于设置标题栏的标题的是`title`这个属性，如以下示例所示

```js
class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'Home',
  };

  /* render function, etc */
}

class DetailsScreen extends React.Component {
  static navigationOptions = {
    title: 'Details',
  };

  /* render function, etc */
}
```

> `createStackNavigator`默认情况下按照平台惯例设置，所以在`iOS`上标题居中，在`Android`上左对齐

这句话是整节的关键，它说明了这个库的设计取向。它默认不追求两端长得一模一样，而是各自遵守平台的设计规范，iOS 居中、Android 左对齐，都是各自系统里用户习惯的样子。

到底要不要强行统一，这是个产品问题不是技术问题。设计稿要求两端一致的话，加 `headerTitleAlign` 之类的配置就能拉齐；没这个要求的话，我更倾向于保留平台默认，用户用着更顺手，你也少维护一份分支代码。

#### 7.3.1 动态设置标题

标题依赖接口返回的数据时就需要动态设置，比如商品详情页的标题是商品名。`navigationOptions` 支持写成函数，从参数里拿 `navigation` 再读路由参数。

```js
class DetailsScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.getParam('otherParam', 'A Nested Details Screen'),
    };
  };

  /* render function, etc */
}
```

#### 7.3.2 使用setParams更新navigationOptions

> 通常有必要从已加载的页面组件本身更新当前页面的`navigationOptions`配置。 我们可以使用`this.props.navigation.setParams`来做到这一点

```html
 /* Inside of render() */
  <Button
    title="Update the title"
    onPress={() => this.props.navigation.setParams({otherParam: 'Updated!'})}
  />
```

`setParams` 是「页面自己更新自己的导航配置」的官方通道。因为 `navigationOptions` 是静态的，页面内部拿不到自己的 state，所以只能反过来，把数据写进路由参数，让 `navigationOptions` 从参数里读。这个绕法在旧版 API 里很常见，5.x 之后有了 `navigation.setOptions`，可以直接改配置，不用再借道参数了。

#### 7.3.3 调整标题样式

> 定制标题样式时有三个关键属性：headerStyle、headerTintColor和headerTitleStyle

这三个属性的分工是，容器、前景色、文字样式。记住这个划分，配色改起来就不用一个个试。

- `headerStyle`：一个应用于 `header` 的最外层 `View` 的 样式对象， 如果你设置 `backgroundColor` ，他就是`header` 的颜色
- `headerTintColor`：返回按钮和标题都使用这个属性作为它们的颜色。 在下面的例子中，我们将 `tint color` 设置为白色（#fff），所以返回按钮和标题栏标题将变为白色
- `headerTitleStyle`：如果我们想为标题定制`fontFamily`，`fontWeight`和其他`Text`样式属性，我们可以用它来完成。

```js
class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'Home',
    headerStyle: {
      backgroundColor: '#f4511e',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  };

  /* render function, etc */
}
```

补一个双端适配的细节。`headerStyle` 里如果只设 `backgroundColor`，Android 上默认还会带一条阴影（elevation），iOS 上则是一条细边框（`shadowOffset` 那套），想做完全扁平的导航栏，两个平台要各去一次，一个改 `elevation: 0`，一个改阴影相关属性。不处理的话设计同学一眼就看出两端不一样。

#### 7.3.4 统一配置所有页面头部defaultNavigationOptions

页面一多，每个页面都写一遍配色显然不现实。`defaultNavigationOptions` 就是用来收口的，在导航器层级配一次，所有子页面继承。

> 在初始化时，还可以在 `stack navigator` 的配置中指定共享的`navigationOptions` 静态属性优先于该配置

```js
const Home = createStackNavigator(
  {
    Feed: ExampleScreen,
    Profile: ExampleScreen,
  }, {
    defaultNavigationOptions: {
      headerTintColor: '#fff',
      headerStyle: {
        backgroundColor: '#000',
      },
    },
    navigationOptions: {
      tabBarLabel: 'Home!',
    },
  }
);
```

注意这段配置里 `defaultNavigationOptions` 和 `navigationOptions` 是两回事，很容易看串。前者是「发给子页面的默认配置」，后者是「这个导航器本身作为一个页面时的配置」，所以例子里 `tabBarLabel: 'Home!'` 写在后者上，因为它描述的是这整个 stack 在外层 tab 里显示成什么样。

#### 7.3.5 覆盖共享的navigationOptions

有了统一配置，个别页面想要不一样怎么办。页面自己的 `navigationOptions` 优先级更高，而且函数形式的第二个参数能拿到继承下来的配置，可以基于它做变化，而不是从零重写。

```js
class DetailsScreen extends React.Component {
  static navigationOptions = ({ navigation, navigationOptions }) => {
    const { params } = navigation.state;

    return {
      title: params ? params.otherParam : 'A Nested Details Screen',
      /* These values are used instead of the shared configuration! */
      headerStyle: {
        backgroundColor: navigationOptions.headerTintColor,
      },
      headerTintColor: navigationOptions.headerStyle.backgroundColor,
    };
  };

  /* render function, etc */
}
```

这段代码里把 `headerStyle.backgroundColor` 和 `headerTintColor` 对调了，是官方文档演示「能读到父配置」用的，实际项目里不会这么写。

### 7.4 标题栏和其所属的页面之间的交互

这是旧版 API 里最别扭的一块。导航栏右上角放一个按钮，点了之后要改页面里的 state，问题在于 `navigationOptions` 是静态属性，它拿不到组件实例。

```js
class HomeScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    return {
      headerTitle: <LogoTitle />,
      headerRight: (
        <Button
          onPress={navigation.getParam('increaseCount')} //执行事件
          title="+1"
          color="#fff"
        />
      ),
    };
  };

  componentDidMount() {
    // 设置事件
    this.props.navigation.setParams({ increaseCount: this._increaseCount });
  }

  state = {
    count: 0,
  };

  _increaseCount = () => {
    this.setState({ count: this.state.count + 1 });
  };

  /* later in the render function we display the count */
}
```

这个套路读一遍就明白了。`componentDidMount` 里把方法通过 `setParams` 塞进路由参数，`navigationOptions` 再从参数里 `getParam` 把它取出来绑到按钮上，绕了一圈才把「头部的按钮」和「页面的方法」连起来。5.x 之后 `navigation.setOptions` 可以直接在组件里写头部配置，闭包天然能访问 state 和方法，这段绕路就没有了。老项目里看到这种写法，知道它在解决什么问题就行。

## 八、打包

调试跑通只是完成了一半，能装到别人手机上、能提审上架，才算真的做完。这一节讲的是最后这一段路，改应用名和图标、加启动页、生成签名、打出可发布的包。

### 8.1 修改app名称、logo、启动图

**修改图标和名称**

> 找到根目录`/android/app/src/main/res`

`res` 目录下那一堆 `mipmap-hdpi`、`mipmap-xhdpi` 的文件夹，就是 Android 版本的多倍图机制，系统按设备密度挑对应目录里的图标。应用名则在 `res/values/strings.xml` 里的 `app_name`。这两处都是纯原生配置，改完必须重新编译，JS 侧刷新是不生效的。

![Android res 目录下的图标资源](https://s.poetries.top/gitee/2019/10/540.png)

**启动页**

> - 在`react-native`的`android`中的启动图和`IOS`不相同点在于，`android`没有默认的启动图，在`IOS`里面有
> - 使用插件 `import SplashScreen from 'react-native-splash-screen';`
> - https://github.com/crazycodeboy/react-native-splash-screen

启动页在 RN 里不只是好看的问题，它是刚需。App 冷启动时要先初始化原生容器、加载 JS bundle、跑完首屏渲染，这段时间屏幕是白的，Android 上尤其明显。启动图的作用就是把这段白屏盖住，等 JS 侧准备好了再手动调 `SplashScreen.hide()` 把它撤掉。

这也解释了为什么这个库要提供一个 JS 方法来隐藏，而不是定时消失。你得等真正的首屏渲染完成，时机由你自己判断。

![启动页配置效果](https://s.poetries.top/gitee/2019/10/541.png)

**react-native ios端icon和启动图的设置**

iOS 侧的图标走 Xcode 的 Asset Catalog（`Images.xcassets` 里的 AppIcon），启动图在老项目里是 `LaunchScreen.xib` 或者启动图集。两个平台的资源规格和尺寸要求各有一套，交给设计出图时要说清楚。

> https://www.jianshu.com/p/b49629529a95

### 8.2 Android打包APK

Android 的发布包必须签名，这是系统层面的强制要求。签名文件（keystore）代表你的应用身份，后续所有版本更新都必须用同一个 keystore 签，换了就装不上，只能让用户卸载重装。所以这个文件丢了是真的麻烦，务必备份。

**1. 在Android/app目录下执行这条命令**

```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

`keytool` 是 JDK 自带的工具，装了 JDK 就有。参数里 `-validity 10000` 是有效期天数，差不多 27 年，写这么长就是因为过期了会很难办。执行过程中会交互式地问你密码、姓名、组织这些信息，记牢密码，下一步要用。

![keytool 生成 keystore 的交互过程](https://s.poetries.top/gitee/2019/10/542.png)

```
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=123456
MYAPP_RELEASE_KEY_PASSWORD=123456
```

这四行要写进 `~/.gradle/gradle.properties`，放在用户目录而不是项目里，这样密码就不会被提交到 Git。这一点很重要，签名密码进了仓库等于身份泄露。真实项目里密码当然也不能是 `123456`，这里只是示例。CI 上打包一般走环境变量或者密钥管理服务，不落磁盘。

**2. 在app/build.gradle中配置**

配好了凭据，还要告诉 Gradle release 构建用哪套签名。

```
signingConfigs {
      release {
          if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
              storeFile file(MYAPP_RELEASE_STORE_FILE)
              storePassword MYAPP_RELEASE_STORE_PASSWORD
              keyAlias MYAPP_RELEASE_KEY_ALIAS
              keyPassword MYAPP_RELEASE_KEY_PASSWORD
          }
      }
  }
  buildTypes {
      release {
          minifyEnabled enableProguardInReleaseBuilds
          proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
          signingConfig signingConfigs.release
      }
  }
 ```

`if (project.hasProperty('MYAPP_RELEASE_STORE_FILE'))` 这个判断挺关键，它让没有配置签名信息的开发者（比如刚 clone 下来的新同事）依然能正常编译 debug 包，不会因为找不到 keystore 就直接失败。

![app/build.gradle 中签名配置的位置](https://s.poetries.top/gitee/2019/10/543.png)

 **3. 减少打包apk大小**

包体积在国内应用市场是个硬指标，用户看到几十 MB 会犹豫要不要装。RN 应用的体积主要来自三块，原生 so 库、JS bundle、图片资源。最立竿见影的一招是按 CPU 架构拆包，也就是 `splits abi`，一台设备只装它需要的那份 so，能省下相当可观的体积。另外 `minifyEnabled` 加 ProGuard 会压缩 Java 代码，注意开了之后要跟着配混淆规则，不然运行时可能崩在反射调用上。

![减少 APK 体积的构建配置](https://s.poetries.top/gitee/2019/10/544.png)

补一句现在的情况，Google Play 上架已经要求提交 AAB（Android App Bundle）而不是 APK，由商店按设备下发对应的拆分包，前面手动 `splits abi` 那套在 Play 渠道上不再需要自己做。国内应用市场大多仍然收 APK，所以两种产物可能都得出，具体看你的发行渠道。

 **4. 输出目录**
 
 > `android/app/build/outputs/apk/`

打包命令一般是在 `android` 目录下跑 `./gradlew assembleRelease`，产物就在上面这个目录。装到手机上验一遍再交给测试，别直接把没装过的包丢出去。

### 8.3 IOS打包

原文这一节是空的，当时应该是想写没写完，我这里补一段大致的路径，避免留个断头。iOS 的发布流程和 Android 完全不同，它不靠你自己生成的 keystore，而是走苹果的证书体系，需要在开发者后台创建 App ID、生成发布证书和 Provisioning Profile，在 Xcode 里选好 Signing 配置，然后 Archive 出 `.ipa`，再通过 Xcode Organizer 或者 Transporter 上传到 App Store Connect 提审。

这套流程苹果每隔一两年就会调整一次界面和叫法，我不凭记忆写具体步骤，请直接看苹果的官方文档和 RN 官网的 Publishing to App Store 章节。唯一想强调的是，证书和描述文件的有效期是有限的，团队协作时最好用 Xcode 的自动签名或者 fastlane match 之类的工具统一管理，手动传证书文件迟早出乱子。

## 九、更多参考

- [常用的react-native组件整理](https://github.com/poetries/react-native-components)
- [React Native 研究与实践](https://github.com/crazycodeboy/RNStudyNotes/)
- [从navigator到react-navigation进阶教程](http://www.devio.org/2018/05/15/navigator-to-react-navigation/)
- [React Native0.50+开发指导](http://www.devio.org/2017/12/12/React-Native0.50-Development-Guide-Chinese-update-instructions/)
- [React Native 集成分享第三方登录功能分享第三方登录模块开发(iOS)](http://www.devio.org/2017/09/30/React-Native-integration-share-third-party-login-function-ios/)
- [React Native 集成分享第三方登录功能分享第三方登录模块开发(Android)](http://www.devio.org/2017/09/10/React-Native-integration-share-third-party-login-function/)
- [教你轻松在React Native中集成统计的功能](http://www.devio.org/2017/09/03/React-Native-Integrated-analysis-function/)
- [教你轻松修改React Native端口](http://www.devio.org/2017/08/18/Modify-the-React-Native-listening-port/)
- [React Native Android iOS 教程快速创建React Native App](http://www.devio.org/2017/07/12/quickly-create-react-native-app/)
- [Mac(OSX)平台搭建React Native开发环境](http://www.devio.org/2016/05/20/React-Native-development-environment-build-mac-platform/)

这些链接都是 2016 到 2018 年之间的文章，具体的版本号和 API 大多已经过时，但里面讲的思路（原生模块怎么集成、第三方登录怎么打通、端口怎么改）到今天依然有参考价值。看的时候把版本相关的部分自动降权就好。

## 总结

把这一整篇串下来，RN 双端适配其实就是四层事情。

最底下是环境层。iOS 靠 Xcode 和 CocoaPods，Android 靠 JDK、SDK 和 Gradle，两套工具链各有各的脾气，报错信息也各说各话。这一层的经验没什么捷径，就是把 `adb devices`、`xcrun simctl list devices`、Xcode 的原生日志这几个体检工具用熟，出问题先定位在哪一层，再去查。

往上是运行时层。`Platform.OS`、`Platform.select`、`.ios.js` / `.android.js` 文件后缀，这三样构成了处理平台差异的完整工具箱，差异小用前两个，差异大就分文件。选第三方库时多花两分钟看一眼双端支持情况和维护状态，能省掉后面一堆麻烦。

再往上是布局层。RN 的 Flexbox 和 Web CSS 的三个关键差异要背下来，`flexDirection` 默认 `column`、`alignItems` 默认 `stretch`、`flex` 只收一个参数。加上「父容器没尺寸子元素 flex 撑不开」这条，四条就覆盖了绝大多数布局翻车现场。

最上面是发布层。Android 认 keystore，iOS 认苹果证书，两套身份体系互不相通，但共同点是都不能丢、都不能提交进仓库。

至于时效性，这篇写于 2019 年，那时的 RN 还是 Bridge 加 JSC 的老架构。现在新架构（Fabric、TurboModules、Hermes、JSI）已经是默认方向，`react-native link` 被 autolinking 取代，`ListView`、`NavigatorIOS` 这些组件被移除，`react-native-camera` 这类库进入废弃状态。文中的命令和配置我一条都没删，它们记录了那个阶段真实的做法；判断层面的东西（平台差异在哪、坑通常出在哪、选库看什么）反而是最耐用的部分。真要动手，命令和版本号请以[官方文档](https://reactnative.dev/docs/getting-started)为准。

## 参考

- [React Native 官方文档](https://reactnative.dev/docs/getting-started)
- [React Native 中文网](https://reactnative.cn/docs/getting-started)
- [React Navigation 官方文档](https://reactnavigation.org/docs/getting-started)
- [react-native-vector-icons](https://github.com/oblador/react-native-vector-icons)
- [react-native-router-flux](https://github.com/aksonov/react-native-router-flux)
- [Yoga 布局引擎](https://www.yogalayout.dev/)
- [Android 开发者文档 · 为应用签名](https://developer.android.com/studio/publish/app-signing)
- [React Native 研究与实践](https://github.com/crazycodeboy/RNStudyNotes/)
- [前端进阶之旅](https://interview.poetries.top)
