---
title: Ionic 项目 iOS 打包真机调试与上架 App Store 全流程
description: Ionic 加 Cordova 项目打 iOS 包的完整实操记录，从模拟器运行、注册设备 UDID、Xcode 自动管理签名，到 Archive 导出测试包 ipa、在 App Store Connect 创建应用、用 Application Loader 或 Xcode 上传构建版本，再到 Info.plist 权限描述配置，一步一图。
date: 2019-10-07 08:10:24
tags:
 - Ionic
 - Angular
 - iOS
 - Cordova
 - 打包发布
categories: Front-End
---

`Ionic` 项目写完了，浏览器里跑得挺好，接下来才是真正的关卡：怎么把它变成一个能装到 iPhone 上、最后躺进 App Store 的东西。这条路上你会在终端、`Xcode`、苹果开发者后台、`App Store Connect` 四个地方来回跳，任何一步没对齐，报出来的错都长得像天书。

这篇是我当年把这条路整个走通一遍留下的记录，六十多张截图基本覆盖了每一次点击。每张图前面我补了「这一步在做什么」，后面补了「做完应该看到什么、这里的坑在哪」，照着走应该不至于卡死。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `Ionic` 项目怎么加 iOS 平台，为什么每次改完代码都得跑 `build` 加 `prepare`
- 模拟器跑起来的完整路径，以及双击工程文件打不开时的权限处理
- 设备 `UDID` 从哪拿、配到哪去，`iTunes` 没了之后换什么方式取
- 用 `Xcode` 自动管理证书，比手动折腾 CSR 省多少事
- `Archive` 打测试包 `ipa` 的八步操作，以及 code sign 类报错怎么读
- 在 `App Store Connect` 建应用、传构建版本的两条路径（`Application Loader` 和 `Xcode`）
- 上架前 `Info.plist` 里那十几个权限描述键，漏一个就会被打回
- 这套技术栈今天的状态，以及这篇内容哪些还有效、哪些已经变了

## 一、先说清楚这套栈现在的状态

这篇写于 2019 年，用的是 `Ionic 3` 加 `Cordova`。`Apache Cordova` 现在已经不再活跃维护，项目退役进了 `Apache Attic` 归档，具体以 <https://attic.apache.org/> 上的公告为准。`Ionic` 官方推的原生方案换成了 `Capacitor`，新项目建议直接走那条路。

但这篇里真正占篇幅的东西，其实跟 `Cordova` 关系不大。**苹果那套签名、打包、上架的流程，是横在所有 iOS 应用面前的同一道关**，用 `Cordova`、用 `Capacitor`、用 `React Native`、写纯原生，走的都是同一批界面。所以下面第三节往后的内容，换个技术栈照样能用，只有第二节那几条 `ionic cordova` 命令是这套栈特有的。

顺带说一下这篇和 [RN 构建 iOS 包发布到 AppStore 全流程](https://feinterview.poetries.top/blog/ios-build) 的分工。那篇是从 `React Native` 项目出发的，讲得更细的是**签名体系本身**：App ID、证书、描述文件、设备这四样东西各自管什么、怎么串起来、描述文件为什么一变就得重新打包。这篇则是**操作流水线**，从终端命令一直到点提交审核，胜在步骤密度。两篇配着看正好，概念不清就翻那篇，忘了下一步点哪就翻这篇。

界面方面有几处这些年确实变了，我在对应位置都会标出来，最主要的三处是：`iTunes Connect` 改名成了 `App Store Connect`；`Application Loader` 被 `Xcode` 移除，替代品是独立的 `Transporter` App；`iTunes` 在新版 macOS 上被拆掉了，取 `UDID` 得换别的路子。

## 二、先在模拟器里跑起来

上真机之前，先确保项目能在模拟器里出画面。这一步走通，说明构建链路是好的，后面出问题就可以专心排查签名。

**安装 Ionic 与 Cordova**

```
sudo cnpm install -g cordova ionic
```

这条是原文的命令，我保留。但现在别照抄了，两个地方要改：`cnpm` 装全局 CLI 容易出怪问题（它用的是软链接式安装），换回 `npm` 加镜像更稳；`sudo` 装全局包会让 `node_modules` 里一堆文件属主变成 root，后面装插件时权限问题就是这么来的，更好的做法是用 `nvm` 管理 `Node`，全局目录在用户空间里，根本不需要 `sudo`。

**Ionic 创建浏览器运行的项目**

- 创建项目: `sudo ionic start myApp tabs`
- cd 到刚才创建的项目
- `sudo ionic serve` 浏览器运行项目

`tabs` 是模板名，起手用它比 `blank` 省事，因为底部导航、页面结构、路由都给你搭好了，直接照着改。

**Ionic 借助 cordova 创建 ios 手机上可以安装的应用**

- 创建项目: `sudo ionic start myApp tabs`
- cd 到刚才创建的项目
- `sudo ionic cordova platform add ios` 把 ios 环境添加到我们的项目
- `sudo yarn install`
- 修改代码后运行 `sudo ionic build --prod`(打包) 以及 `sudo ionic cordova prepare` (这个是拷贝`www`目录资源到ios工程下)。必须运行，否则调试会卡死

最后那条是这一节最关键的一句，值得单独拎出来说。

`ionic build` 干的事是把 `src` 下的 `TypeScript` 和模板编译成静态资源，产物落在项目根目录的 `www`。而 `Xcode` 打开的那个原生工程读的是 `platforms/ios/www`，两者是两份文件。`cordova prepare` 就是把前者拷到后者，顺带把插件配置同步进原生工程。

漏了这两步的表现特别迷惑：代码明明改了，模拟器里跑的还是老版本，你会开始怀疑是缓存、是没重新编译、是 `Xcode` 抽风。其实只是资源没拷过去。**建议直接把这两条命令串成一个 `npm` 脚本**，别指望每次都记得手动跑。

**可能遇到的错误以及解决方案**

加 iOS 平台的时候，`Cordova` 要去下载平台模板和一堆依赖，网络不通就会卡在这里报错。

![执行 ionic cordova platform add ios 时因网络问题下载失败的报错信息](https://s.poetries.top/gitee/2019/10/ionic/1.png)

- 使用软件中的提供的翻墙工具重试，如果不行继续看第二步骤
- 手机开启热点，让电脑连接手机用手机的网络下载

这两条是当年的应急办法。更工程化的解法是给 `npm` 配国内镜像，再给终端配好代理环境变量（`export https_proxy=...`），因为 `Cordova` 底下有一部分下载走的是它自己的进程，不读 `npm` 的配置，只认环境变量。这个我排查了一下午才想明白，光在 `.npmrc` 里配镜像是不够的。

**找到对应目录下面的文件双击用 Xcode 打开**

平台加好之后，`platforms/ios` 目录下会生成一整套 iOS 原生工程，找到那个工程文件双击，`Xcode` 就会接管。

![在 platforms/ios 目录下找到 Xcode 工程文件并双击打开](https://s.poetries.top/gitee/2019/10/ionic/2.png)

> 注意:xcode 用最新的版本

这句要补一句背景。`Xcode` 版本和 iOS SDK 是绑定的，太老的 `Xcode` 编不出支持新系统的包，苹果对上架包的最低 `Xcode` 版本也有硬性要求，而且这个要求会随时间往上抬。所以「用最新版本」这个建议是对的。但反过来也有个坑：`Cordova` 生成的原生工程用的是老模板，遇到太新的 `Xcode` 有时候会因为新的构建规则报错，这种情况要么升 `cordova-ios` 平台版本，要么临时降 `Xcode`。

顺便提一句，如果你的项目装过带原生依赖的插件，`Cordova` 会用 `CocoaPods` 管理它们，这时候要打开的是 `.xcworkspace` 而不是 `.xcodeproj`，开错的表现是编译时一堆找不到头文件的错。

**如果双击遇到权限问题如下**

![双击工程文件时提示没有权限打开的报错](https://s.poetries.top/gitee/2019/10/ionic/3.png)

> 可以用命令修改权限，cd 到要修改权限的目录执行下面命令

```
sudo chmod -R 777 *
```

这个报错的根源就是前面那些 `sudo`。用 `sudo` 跑 `ionic cordova platform add ios` 生成出来的目录属主是 root，你当前用户没有写权限，`Xcode` 自然打不开。

`chmod -R 777` 能解决问题，但它是把所有人的读写执行权限全开了，属于大锤砸核桃。更干净的做法是把属主改回自己：

```bash
sudo chown -R $(whoami) ./platforms ./plugins
```

改完之后往后就别再用 `sudo` 跑 `ionic` 命令了，不然过两天又是同样的问题。

**在 xcode 中选择对应模拟器运行**

工程打开之后，在 `Xcode` 顶部工具栏的设备下拉里选一个模拟器，点左边的运行按钮。

![在 Xcode 顶部设备下拉中选择模拟器并点击运行](https://s.poetries.top/gitee/2019/10/ionic/4.png)

> 注意:调整模拟器大小只需要拉动模拟器边缘即可

第一次编译会比较慢，之后就快了。模拟器里能看到你的页面，说明「代码 → 构建 → 拷贝 → 原生工程 → 跑起来」这条链路整个通了。

这里有个模拟器的局限要提前知道：相机、蓝牙、推送、定位这些原生能力在模拟器上要么不可用，要么是假数据。所以调 UI 用模拟器，调原生插件必须上真机，这也是下一节要做的事。

## 三、真机调试

### 3.1 真机调试之前的准备工作

- 你得有苹果开发者账号个人($99)、公司($99)、企业($299)账号均可
- 能上网的苹果电脑 macos(苹果虚拟机也可以)、Xcode、iOS 设备(iPhone、ipad 均 可)

价格这块我按当年记的原样保留，具体金额和账号类型以苹果官网当前公示为准，这些年调整过。

补一条当时没写的：**如果只是想把 App 装到自己手边这台设备上调试，其实不需要付费账号**。免费的 Apple ID 也能在 `Xcode` 里做真机调试，代价是证书有效期只有七天，到期得重新装一次，而且能装的 App 数量有限制。但只要你需要发给别人测试、需要上架，付费账号就是绕不过去的。

### 3.2 开发者中心配置调试设备的 UDID

先说个术语上的事。原文这里写的是 `uuid`，其实苹果那边叫 `UDID`（Unique Device Identifier，设备唯一标识），跟编程里常说的 `UUID` 不是一回事，别搜错关键词。下文我统一写成 `UDID`。

**1. 获取 iPhone 手机的 UDID，手机连接电脑，打开 iTunes 软件，点击序列号字母处**

这是当年最方便的办法：`iTunes` 连上设备之后，摘要页会显示序列号，**在序列号那行文字上点一下，它会切换成 UDID**，右键可以复制。

![用 iTunes 连接 iPhone 后进入设备摘要页](https://s.poetries.top/gitee/2019/10/ionic/5.png)
![点击序列号处切换显示为 UDID 并复制](https://s.poetries.top/gitee/2019/10/ionic/6.png)

这条路现在走不通了，因为 `iTunes` 在新版 macOS 上被拆掉了。替代方式有三条，按方便程度排：

一是用 `Finder`，设备连上电脑之后会出现在 `Finder` 左侧边栏，点进去在设备信息那一行反复点击，同样会在序列号、UDID、IMEI 之间轮换。

二是用 `Xcode`，菜单走 `Window → Devices and Simulators`，选中设备，右侧的 `Identifier` 就是 `UDID`，这条最稳。

三是设备不在手边时，让对方用手机 `Safari` 打开分发平台的 UDID 获取页（比如蒲公英的工具页），按提示装一个描述文件，页面会把 `UDID` 显示出来让他复制发给你。

**2. 配置 iPhone 手机的 UDID，打开平台开发者中心进行配置**

拿到 `UDID` 之后，登录 <https://developer.apple.com/account>，进 `Certificates, Identifiers & Profiles`，在左侧 `Devices` 菜单里点加号，填设备名和 `UDID` 注册进去。

![在苹果开发者中心的 Devices 页面注册设备 UDID](https://s.poetries.top/gitee/2019/10/ionic/7.png)

这里有个坑要注意，而且是这一整篇里最容易白费时间的一个：**新注册的设备不会让已经打好的旧包突然能装**。设备列表是被写进描述文件、描述文件又被打进 `ipa` 里的，所以加完设备之后必须回后台把描述文件重新生成一遍，然后重新 `Archive` 重新导出，测试同学下新链接才行。这条我踩过，加完设备让人重装了三次同一个包。

另外注册进去的设备是要占额度的，删除还只能在会员年度续费时操作，所以别拿它当草稿本用，随手把同事的旧手机全塞进去，年底会不够用。

### 3.3 用 Xcode 自动管理证书文件

**手动创建证书文件参考下面地址:**

> https://jingyan.baidu.com/article/d3b74d640735c71f77e609f0.html

> 现在用 xcode 开发项目我们可以自动适配我们的证书，选择自动化配置证书意味着你不会 在证书设置和编译的时候浪费更多的时间,并且你可以更好的设置适合你的 Xcode

这个取舍是对的。手动那套要走「钥匙串生成 CSR → 上传到后台 → 下载 cer → 双击导入 → 再建描述文件 → 下载 → 双击导入」，步骤多，而且私钥一旦丢了或者换台电脑就得重来。自动签名会替你把开发证书和描述文件都建好并保持同步，日常开发够用了。

**1、点击 xcode 选择 Preference，如下图**

`Xcode` 顶部菜单里找 `Preferences`（新版本改叫 `Settings`），切到 `Accounts` 标签页。

![在 Xcode 菜单中打开 Preferences 设置面板](https://s.poetries.top/gitee/2019/10/ionic/8.png)

**2、弹出下面界面输入自己的账户名和密码**

点左下角加号添加 Apple ID，输入账号密码登录。

![在 Accounts 面板中添加 Apple ID 并输入账号密码](https://s.poetries.top/gitee/2019/10/ionic/9.png)

登录之后左侧会列出这个账号下的 Team，如果你同时在个人账号和公司账号里，**这里一定要认准团队名**，选错了后面证书和描述文件全建到另一个团队去，怎么都匹配不上。现在登录还会要求二次验证，手机上收个验证码即可。

**3、选择对应的项目 选择 General->勾选自动管理签名->设置 Team 开发者账户->选择开发的设备**

回到项目，选中 `TARGETS` 下的主 target，找到签名相关的设置（老版本在 `General` 里，新版本拆成了独立的 `Signing & Capabilities` 标签页），勾上 `Automatically manage signing`，`Team` 选你的团队。

![在项目设置中勾选自动管理签名并选择开发者 Team](https://s.poetries.top/gitee/2019/10/ionic/10.png)

勾上的一瞬间 `Xcode` 就开始干活了：去后台查有没有可用的开发证书，没有就自动申请一张，同时生成一份匹配当前 `Bundle Identifier` 的描述文件下载到本地。**几秒钟之后这一屏的红色报错消失、`Signing Certificate` 显示成 `iPhone Developer: 你的名字`，就说明成功了**。

如果这里一直报 `No profiles for 'xxx' were found`，先检查 `Bundle Identifier` 是不是和后台的 App ID 一字不差（大小写也算），`Cordova` 项目里这个值来自 `config.xml` 根节点的 `id` 属性。

**4、设置所有工程的 Build settings 为 Automatic (默认可以不用管)**

![在 Build Settings 中确认签名相关配置为 Automatic](https://s.poetries.top/gitee/2019/10/ionic/11.png)
![确认所有 target 的签名设置一致](https://s.poetries.top/gitee/2019/10/ionic/12.png)

这一步括号里写了「默认可以不用管」，多数情况确实如此。要留意的是 `Cordova` 项目除了主 target 之外，插件有时候会带进来额外的 target，如果编译报某个子 target 签名失败，就到这里把它也设成自动。

### 3.4 真机调试

- 连上手机，然后在手机上面选择信任此电脑
- 选择调试设备为自己的手机

设备插上线，手机屏幕会弹「要信任此电脑吗」，点信任并输入锁屏密码。然后回 `Xcode`，把顶部的设备下拉从模拟器切成你这台真机。

![在 Xcode 设备下拉中把目标从模拟器切换为已连接的真机](https://s.poetries.top/gitee/2019/10/ionic/13.png)

- 点击运行

![点击运行按钮开始向真机编译安装](https://s.poetries.top/gitee/2019/10/ionic/14.png)

编译完 `Xcode` 会把包推到手机上自动启动。第一次装还会多一道：手机上要去 `设置 → 通用 → VPN与设备管理` 里，把你这个开发者证书标记为信任，否则点开 App 会提示「不受信任的开发者」。

- 点击允许

![在弹出的钥匙串访问确认框中点击允许](https://s.poetries.top/gitee/2019/10/ionic/15.png)

这个弹窗是 macOS 的钥匙串在问你，`codesign` 要读取私钥，是否允许。点「始终允许」，省得每次编译都弹一次。

> 注意：每次修改代码后，都需要重新执行 ` sudo ionic build --prod` 以及 `sudo ionic cordova prepare`。这样比较麻烦，建议在浏览器端调试好了在调试ios、安卓端的

这条建议很实在。真机这一圈跑下来至少一两分钟，拿它调 UI 细节太浪费时间了。我的做法是把逻辑分层：界面和业务逻辑全在浏览器里用 `ionic serve` 调完，只有涉及原生插件（相机、蓝牙、推送这类）的部分才上真机验证。

真机上想看 `WebView` 里的报错也不用靠 `alert` 硬调，`Mac` 上打开 `Safari` 的开发菜单，能直接连到设备上的 `WebView` 开出完整 `DevTools`，具体接法可以看 [真机调试 WebView 的完整指南](https://feinterview.poetries.top/blog/webview-real-device-debugging-ios-safari-android-chrome)。

## 四、创建测试包 ipa

真机自己能跑了，接下来要产出一个能发给别人装的 `ipa`。

- 进入苹果开发者中心，配置需要测试项目的人员手机的 `UDID` 以及调试设备的 `UDID`
- 配置应用包名称
- 打包测试证书需要连接 `iphone` 手机，不然 Archive 会是灰色的
- 选择 `product – Archive` 进行打包

第三条要更正一下，这是当年的经验说法，不够准确。`Archive` 变灰的真正原因是**运行目标选成了模拟器**。把顶部的设备下拉切成 `Generic iOS Device`（新版 `Xcode` 里叫 `Any iOS Device (arm64)`）就能点了，手边有没有真机其实无所谓。当年之所以觉得「插上手机就好了」，是因为插手机会顺带把目标切成真机。

下面这一串是 `Archive` 和导出的完整过程。

第一步，从 `Product` 菜单里选 `Archive`，开始编译归档。

![在 Product 菜单中选择 Archive 开始归档构建](https://s.poetries.top/gitee/2019/10/ionic/20.png)

编译过程比平时慢，因为归档走的是 `Release` 配置，要做完整优化。

归档成功后 `Xcode` 会自动弹出 `Organizer` 窗口，列出这次的归档记录，带版本号和创建时间。

![归档完成后弹出的 Organizer 窗口，列出本次归档记录](https://s.poetries.top/gitee/2019/10/ionic/21.png)

选中这条记录，点右侧的分发按钮进入分发方式选择。

![在 Organizer 中选中归档记录并点击分发按钮](https://s.poetries.top/gitee/2019/10/ionic/22.png)

分发方式这一屏是整个流程的岔路口，选错了导出来的包用不了。几个选项的含义：`App Store` 是传给苹果上架或走 `TestFlight`；`Ad Hoc` 导出能装在已注册设备上的 `ipa`，发内测就选它；`Enterprise` 需要企业开发者账号；`Development` 导出开发包。

![在分发方式列表中选择对应的导出类型](https://s.poetries.top/gitee/2019/10/ionic/23.png)

选完类型下一屏是导出选项，`App Thinning` 保持默认就行，除非你明确要针对特定机型瘦身。

![配置导出选项，包括 App Thinning 等设置](https://s.poetries.top/gitee/2019/10/ionic/24.png)

再往下 `Xcode` 会让你确认用哪套签名，自动或手动都行，自动的话它会去后台找匹配的描述文件。

![确认导出时使用的签名方式](https://s.poetries.top/gitee/2019/10/ionic/25.png)

接着是一屏摘要，把 `Bundle Identifier`、版本号、使用的描述文件列出来让你核对。这一屏别急着划过去，**上架被拒的很多低级问题在这里就能看出来**。

![导出前的摘要页，核对包名与描述文件信息](https://s.poetries.top/gitee/2019/10/ionic/26.png)

确认无误点导出，选一个保存目录，进去就能看到那个 `.ipa` 文件了。

![导出完成后在指定目录生成的 ipa 文件](https://s.poetries.top/gitee/2019/10/ionic/27.png)

拿到 `ipa` 之后，发给测试同学的方式一般是传到蒲公英、fir.im 这类内测分发平台，生成一个二维码扫码安装。要注意装不上的话九成不是包的问题，而是对方设备的 `UDID` 不在描述文件的设备列表里，回第 3.2 节补进去再重新打包。

**可能遇到的错误**

![Archive 过程中出现的构建报错提示](https://s.poetries.top/gitee/2019/10/ionic/28.png)

> 如果是 code sign 相关的错误

![与代码签名相关的报错详情界面](https://s.poetries.top/gitee/2019/10/ionic/29.png)

`code sign` 这类报错看着吓人，其实信息量很足，值得花两分钟读完再动手。常见的就三种情况：

一是找不到匹配的描述文件，多半是 `Bundle Identifier` 和后台 App ID 对不上，或者团队选错了。二是找不到签名身份，说明证书导入了但私钥不在钥匙串里，得从当初生成证书那台机器导一份 `.p12` 过来。三是描述文件过期或者被吊销了，回后台重新生成一份，`Xcode` 里刷新一下。

我的经验是遇到签名问题先别搜报错原文，**先去 `Signing & Capabilities` 那一屏看 `Xcode` 自己给的红字提示**，它通常直接告诉你缺什么，比搜出来的一堆过时答案准得多。

## 五、发布到 App Store

内测跑通了，最后一段是上架。这段分四件事：后台建应用、配正式证书打包、上传构建版本、提交审核。

### 5.1 登录 iTunes Connect 创建应用

传包之前后台必须先有一条对应的 App 记录，否则包传上去会直接被拒收。

顺带说一下，`iTunes Connect` 这个名字后来改成了 `App Store Connect`，入口是 <https://appstoreconnect.apple.com>，或者从开发者账号首页点进去。下面截图里的旧界面和现在长得不一样了，但字段和步骤是对得上的。

从开发者中心进入应用管理后台。

![从苹果开发者中心进入 iTunes Connect 应用管理后台](https://s.poetries.top/gitee/2019/10/ionic/37.png)

进去之后找到「我的 App」列表页。

![进入我的 App 列表页面](https://s.poetries.top/gitee/2019/10/ionic/38.png)

点左上角加号，选「新建 App」，弹出创建表单。

![点击加号选择新建 App 并弹出创建表单](https://s.poetries.top/gitee/2019/10/ionic/39.png)

表单里几个字段说明一下。`平台` 勾 `iOS`；`名称` 是显示在 App Store 上的名字，全球唯一，被占了就得换；`主要语言` 按目标市场选；`套装 ID` 从下拉里选你的 App ID，选不到说明 App ID 没建或者团队不对；`SKU` 是给你内部用的唯一编号，不对外显示，填成和包名一样最省心。

![在创建表单中填写平台、名称、主要语言与套装 ID](https://s.poetries.top/gitee/2019/10/ionic/40.png)

填完提交，创建成功后会跳进这个 App 的详情页。

![创建成功后进入 App 详情页](https://s.poetries.top/gitee/2019/10/ionic/41.png)

详情页左侧是版本信息、App 信息、定价、`TestFlight` 这些栏目，需要逐个补齐。

![App 详情页左侧的版本信息与各项配置栏目](https://s.poetries.top/gitee/2019/10/ionic/42.png)

版本信息页里要填的东西不少：应用截图（各尺寸都得传）、描述、关键词、支持网址、隐私政策链接。

![在版本信息页填写应用截图、描述与关键词等资料](https://s.poetries.top/gitee/2019/10/ionic/43.png)

这些资料可以先填一部分存草稿，不影响你先传包上来。但**隐私政策链接和年龄分级问卷是必填项**，缺了没法提交审核，建议一开始就准备好。

![继续补齐版本信息中的其余必填项](https://s.poetries.top/gitee/2019/10/ionic/44.png)

此刻「构建版本」那一块还是空的，因为包还没传，这就是接下来要干的事。

### 5.2 配置发布证书并打正式包

内测用的是 `Ad Hoc`，上架得换成 `App Store` 类型的描述文件，对应的证书也从开发证书换成发布证书。

在开发者后台的 `Certificates` 里新建一张发布类型的证书。

![在开发者后台的 Certificates 中新建发布类型证书](https://s.poetries.top/gitee/2019/10/ionic/30.png)

按提示上传 `CSR` 文件。`CSR` 的生成方式是打开 Mac 上的「钥匙串访问」，菜单走 `证书助理 → 从证书颁发机构请求证书`，邮箱填自己的，选「存储到磁盘」，得到一个 `.certSigningRequest` 文件传上去。

![上传 CSR 请求文件完成证书创建](https://s.poetries.top/gitee/2019/10/ionic/31.png)

这里有个团队协作的坑要注意：**发布证书全团队只需要一张**。谁生成的，私钥就在谁的钥匙串里，别人要打包得从这台机器导出 `.p12` 再导入自己的钥匙串。每人各建一张的话，很快会撞上苹果对发布证书数量的限制。

证书下载下来双击导入钥匙串，在「我的证书」里展开能看到证书下面挂着一把私钥，才算真的可用。

![证书下载并导入钥匙串后的状态](https://s.poetries.top/gitee/2019/10/ionic/45.png)

然后回 `Profiles` 建一份 `App Store` 类型的描述文件，选同一个 App ID 和刚才那张发布证书。`App Store` 类型不需要选设备，因为它面向所有人。

![创建 App Store 类型的发布描述文件](https://s.poetries.top/gitee/2019/10/ionic/46.png)

准备工作齐了，回 `Xcode` 重新走一遍 `Archive`，区别在分发方式这一屏要选 `App Store`。

> 这里选择直接导出上传

![在分发方式选择页选择 App Store 类型](https://s.poetries.top/gitee/2019/10/ionic/47.png)

下一屏会问你是直接 `Upload` 还是 `Export` 导出 `ipa` 之后再用别的工具传。选 `Export` 就得到一个本地的正式包，配合下一节的 `Application Loader` 使用；选 `Upload` 则由 `Xcode` 一路传完，对应第 5.4 节。

![选择直接上传或导出 ipa 后再上传](https://s.poetries.top/gitee/2019/10/ionic/48.png)

接着确认签名方式和一屏摘要。

![确认签名方式与导出配置](https://s.poetries.top/gitee/2019/10/ionic/49.png)

导出完成，得到正式版的 `ipa`。

![导出完成后生成的正式版 ipa 包](https://s.poetries.top/gitee/2019/10/ionic/50.png)

### 5.3 用 Application Loader 上传构建版本

> 使用 `Application Loader` 把本地的正式包发布到 `App Store Connect`，也可以使用 Xcode 把应用发布到 App Store

先说一句时效性的话：`Application Loader` 已经被苹果从 `Xcode` 里移除了，替代品是 Mac App Store 上一个独立的 App 叫 `Transporter`，界面更简单，把 `ipa` 拖进去点上传就行，也支持断点续传。下面这套流程的逻辑是一样的，看图理解步骤即可，工具换了名字。

> 打开 application loader 上传应用包

![打开 Application Loader 准备上传应用包](https://s.poetries.top/gitee/2019/10/ionic/33.png)

登录之后选「交付您的应用」，然后选中本地那个 `ipa`。

![在 Application Loader 中选择交付应用并指定本地 ipa](https://s.poetries.top/gitee/2019/10/ionic/34.png)

工具会先解析包，把应用名、包名、版本号、构建号显示出来让你核对。

![工具解析 ipa 后显示应用名与版本信息供核对](https://s.poetries.top/gitee/2019/10/ionic/51.png)

确认后开始上传，这一步会先跑一轮校验。图标尺寸不对、`Info.plist` 字段非法、权限描述缺失这些问题会在这里被打回来，改完重新 `Archive` 即可。

![上传过程中的校验与进度显示](https://s.poetries.top/gitee/2019/10/ionic/52.png)

上传完成会有明确的成功提示。

![上传完成的成功提示界面](https://s.poetries.top/gitee/2019/10/ionic/53.png)

传完先别急着回后台找包，苹果那边要跑一轮自动处理（解包、校验、生成各种衍生产物），一般几分钟到半小时不等，处理期间状态显示为「正在处理」，处理完你会收到一封邮件。

![回到后台查看构建版本的处理状态](https://s.poetries.top/gitee/2019/10/ionic/54.png)

> 应用升级需要修改版本号，然后 build 上传

![修改版本号与构建号后重新打包上传](https://s.poetries.top/gitee/2019/10/ionic/55.png)

这里要分清两个号，混淆的人特别多。`Version`（对应 `Info.plist` 里的 `CFBundleShortVersionString`）是给用户看的，形如 `1.0.1`；`Build`（对应 `CFBundleVersion`）是构建号，同一个 `Version` 下每传一次就得往上加一。**只是重传一个修复包的话，`Version` 可以不动，把 `Build` 加一就行**；号没改就传，苹果会直接拒收，报错是构建版本已存在。

`Cordova` 项目里 `Version` 来自 `config.xml` 根节点的 `version` 属性，`Build` 对应 `ios-CFBundleVersion` 属性，改完记得跑 `cordova prepare` 同步进原生工程，光在 `Xcode` 里改会被下次 `prepare` 冲掉。

> 然后在这里可以有多个版本，选择一个提交审核即可

![后台构建版本列表中可以看到多个已上传的版本](https://s.poetries.top/gitee/2019/10/ionic/56.png)

在版本页面的「构建版本」区域点加号，把处理完成的那个包选进来。

![在构建版本区域点击加号选择要提交的包](https://s.poetries.top/gitee/2019/10/ionic/57.png)

> 保存之后提交审核

![保存版本信息后点击提交以供审核](https://s.poetries.top/gitee/2019/10/ionic/58.png)

**登录 Application Loader 报错**

![Application Loader 登录时提示账号或密码错误](https://s.poetries.top/gitee/2019/10/ionic/35.png)

这个报错的原因是账号开了双重认证之后，第三方工具不能直接用 Apple ID 的登录密码，得用「App 专用密码」。

> 登录:https://appleid.apple.com/account/manage

在这个页面的安全设置里生成一个 App 专用密码，生成之后会给你一串短横线分隔的字符。

![在 Apple ID 管理页生成 App 专用密码](https://s.poetries.top/gitee/2019/10/ionic/36.png)

> 然后用生成的密码作为登录密码

注意这串密码只显示一次，当场复制存好。它是绑定到具体用途的，可以随时吊销单独一个而不影响主密码。

### 5.4 直接在 Xcode 中上传应用

如果不想折腾额外的工具，`Xcode` 自己就能一路传完，这也是我更推荐的路径，因为少一个环节就少一处出错的可能。

> 修改版本后，选择 archive

改好版本号，重新走 `Product → Archive`。

![修改版本号后重新执行 Archive](https://s.poetries.top/gitee/2019/10/ionic/59.png)

归档完成在 `Organizer` 里选中记录，点分发，这次在分发方式里选 `App Store`。

![在 Organizer 中选择 App Store 分发方式](https://s.poetries.top/gitee/2019/10/ionic/60.png)

下一屏选 `Upload` 而不是 `Export`。

![选择 Upload 直接上传到 App Store Connect](https://s.poetries.top/gitee/2019/10/ionic/61.png)

后面几屏是符号文件和签名的确认。`Upload your app's symbols` 建议勾上，这样线上崩溃日志才能被符号化，不然你拿到的是一堆内存地址，根本看不出崩在哪。确认摘要之后点上传。

![确认上传选项与摘要后开始上传](https://s.poetries.top/gitee/2019/10/ionic/62.png)

> 然后可以在开发者中心选择上传的版本

等处理完成后回后台，构建版本列表里就能看到这个包了。

![在后台构建版本列表中看到刚上传的包](https://s.poetries.top/gitee/2019/10/ionic/63.png)

选中它，补齐剩下的资料，提交审核。

![选中构建版本并提交审核](https://s.poetries.top/gitee/2019/10/ionic/64.png)

> 提交审核后一般七个工作日左右

这个时间是当年的体感，现在快多了，多数情况一两天内就有结果，具体以 `App Store Connect` 上显示的状态为准。被拒也很正常，看清楚拒绝理由里引用的是哪条 `Guideline`，改完重新传一个 `Build` 号更大的包，然后回版本页面把原来那个构建版本换成新的再提交。最后这一步容易忘，改了半天代码结果提交上去的还是旧包。

## 六、打包上传前，在 info.plist 添加权限

> Xcode 打包上传 app store 提示 Missing info.plist key NSPhotoLibraryUsageDescription 错误

这是上架被拒和上传被打回的头号原因，尤其对混合 App，因为很多 `Cordova` 插件会悄悄引入相机、相册、定位的权限声明，你自己代码没调用也会被扫出来。

**Info.plist 添加权限**

> 项目调用了摄像机，需要配置一下权限

在 `Xcode` 里打开 `Info.plist`，点加号新增条目，填对应的键和一句中文说明。

![在 Xcode 中打开 Info.plist 并新增权限用途描述条目](https://s.poetries.top/gitee/2019/10/ionic/65.png)

> 为了保护隐私，最终用户必须明确的允许应用程序访问提醒信号、照片、位置、联系人、和日历数 据。为了说服用户接受，它有助于解释应用程序可以怎样使用这类数据，并且说明访问他的原因。给 位于 `Info.plist` 文件顶层的以下键分配字符串值。当 iOS 提示用户有关特定资源的权限时，他将显示 这些字符串，作为他的标准对话框的一部分。

常用的键名对照如下：

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

![Info.plist 中配置完成的权限描述列表](https://s.poetries.top/gitee/2019/10/ionic/66.png)

写这段文案有两个雷区。一是干脆没写，App 一调用权限就直接崩溃，审核必挂；二是写得太敷衍，只写「需要访问相机」这种，审核员会引用 `Guideline 5.1.1` 打回来要求补充具体用途。**正确写法是把使用场景说出来**，例如「用于拍摄头像照片并上传到您的个人资料」。

`Cordova` 项目还有个额外的坑。`Info.plist` 在 `platforms/ios` 目录下，那是生成物，你手动改完下次 `cordova prepare` 就没了。正确的做法是写进 `config.xml` 的 `<edit-config>` 节点，或者用 `cordova-plugin-ios-permissions` 这类专门管权限描述的插件，让它每次 `prepare` 时自动注入。这个我踩过一次，改完打包发现权限描述又没了，反复三次才想明白是被覆盖了。

另外蓝牙那一项要留意，`NSBluetoothPeripheralUsageDescription` 后来被 `NSBluetoothAlwaysUsageDescription` 取代了，新系统上只写老的那个可能不生效。具体以你目标 iOS 版本对应的官方文档为准。

## 总结

整条流程走下来，真正需要记住的不是几十个按钮的位置，而是三条规律。

第一条，`Ionic` 这边所有「改了代码不生效」的问题，答案都是 `ionic build` 加 `cordova prepare`。`platforms/` 目录是生成物不是源码，你在里面改的一切都可能被下一次 `prepare` 冲掉，包括 `Info.plist`。

第二条，苹果那边所有「明明配好了却装不上」的问题，根子都在描述文件这条链上。App ID 定身份，证书证来源，描述文件把「身份 + 来源 + 设备」绑成一份许可证打进包里。所以只要包名、证书、设备列表任何一个变了，描述文件就得重新生成，包也得重新打。

第三条，上传被打回和审核被拒是两回事。被打回是机器校验，问题在包本身（图标、权限描述、字段非法），改完重传即可；被拒是人工审核，会引用具体的 `Guideline` 条目，得看懂那条规则再改。

至于工具，这些年变了不少：`iTunes` 取 `UDID` 换成了 `Finder` 或 `Xcode`，`Application Loader` 换成了 `Transporter`，`iTunes Connect` 改叫 `App Store Connect`。名字在变，流程的骨架没变，理解了上面三条规律，界面怎么改都能自己摸出来。

想把签名体系这块彻底理清楚，可以再看一遍 [RN 构建 iOS 包发布到 AppStore 全流程](https://feinterview.poetries.top/blog/ios-build)，那篇专门拆了四样东西之间的依赖关系；`Ionic 3` 本身的用法和 Android 端打包我整理在 [混合 App 之 Ionic3 小结篇](https://feinterview.poetries.top/blog/ionic3-summary)。

## 参考

- Apple 开发者文档：Certificates, Identifiers & Profiles <https://developer.apple.com/help/account/>
- Apple 开发者文档：Distributing your app for beta testing and releases <https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases>
- Apple 隐私权限用途描述键说明 <https://developer.apple.com/documentation/bundleresources/information-property-list/protected-resources>
- App Store 审核指南 <https://developer.apple.com/app-store/review/guidelines/>
- Ionic 官方文档 <https://ionicframework.com/docs>
- Apache Cordova iOS 平台指南 <https://cordova.apache.org/docs/en/latest/guide/platforms/ios/index.html>
- Apache Attic <https://attic.apache.org/>
- [前端进阶之旅](https://interview.poetries.top)
