---
title: React Native iOS 打包发布全流程 从离线 bundle 到内测分发
date: 2019-10-04 00:10:12
description: React Native 项目打 iOS 包的完整操作记录。从 react-native bundle 打离线 jsbundle、以 Create folder references 方式加进 Xcode、改 AppDelegate 切换 jsCodeLocation，到配置签名、Archive 导出 ipa，最后发到蒲公英或 diawi 内测分发平台，每一步配图并说明做完该看到什么。
tags:
 - RN
 - react
 - iOS
 - 打包发布
 - ipa
 - 内测分发
categories: Front-End
---

RN 项目在模拟器上跑得好好的，一到打包就开始出状况：包打出来了，装到手机上一打开是红屏，提示连不上 `Metro`；或者 Archive 那一步在 Xcode 里是灰的，根本点不动。这两个问题的成因完全不同，一个是 JS 资源没打进包里，一个是设备目标选错了，但初次打包的人往往分不清，只能一遍遍重试。

这篇是把 RN 打 iOS 包这条路完整走一遍留下的记录，重点在**打包和分发**这一段：怎么把 JS 打成离线 bundle、怎么正确加进 Xcode 工程、`AppDelegate` 里那个 `#ifdef DEBUG` 在切什么、Archive 导出 ipa 的每一屏怎么选、最后怎么发给测试同学装上。证书那一层单独有一篇讲透了，这里只做速通。

> 结合这篇文章一起看 [Ionic 打包 iOS 全流程](https://feinterview.poetries.top/blog/Ionic-ios-build)

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 开发模式的 Debug Server 和发布包的离线 bundle 差在哪，为什么打包必须换掉
- `react-native bundle` 每个参数的含义，怎么固化成一条 npm script
- 为什么加 bundle 目录必须用 `Create folder references`，用错了会怎样
- `AppDelegate.m` 里 `jsCodeLocation` 那段条件编译的作用
- 证书和描述文件的速通路径（对照截图快速过一遍）
- Xcode 里签名配置的四个关键位置
- Archive 导出 ipa 的完整点击路径，以及分发方式那一屏怎么选
- 拿到 ipa 之后怎么装到手机、怎么发到内测分发平台

## 一、发布包和调试包到底差在哪

开发 `React Native` 应用时，js 代码和图片资源通过 `Debug Server` 提供，但是当我们需要发布应用时，就需要将 js 等资源和应用一起打包。

这句话是整篇的起点，值得展开讲讲。你 `yarn start` 起来的那个东西叫 `Metro`（早期叫 `packager` 或者 `Debug Server`），它本质是一个跑在 8081 端口的本地服务，App 启动时去它那里实时请求 JS bundle。这套机制让你能热更新、能改一行代码马上看到效果，但它有个前提：**手机和你的电脑得在同一个网络里，而且你的电脑得开着**。

所以测试同学拿到包之后连不上你的电脑，App 一启动就红屏报 `Could not connect to development server`。

发布包要做的事就是把这条实时链路砍掉，提前把所有 JS 和图片资源编译成一个静态文件塞进 ipa 里，App 启动时从自己的包体里读。这就是下面要打的 `jsbundle`。

## 二、打离线资源

### 2.1 把打包命令固化到 package.json

通过 `react-native bundle` 命令可以打包离线资源。为了日后打包方便，我们把打包指令填在 `package.json` 下。

```json
"scripts": {
    "start": "node node_modules/react-native/local-cli/cli.js start",
    "test": "jest",
    "bundle-ios": "node node_modules/react-native/local-cli/cli.js bundle --entry-file index.js --platform ios --dev false --bundle-output ./ios/bundle/index.jsbundle --assets-dest ./ios/bundle"
  },
```

这段的意义在于把一条又长又容易记错的命令固定下来，以后谁来打包都不会漏参数。

`bundle-ios` 命令参数含义：

- `--entry-file`：入口文件。
- `--platform`：平台名称（ios 或者 android）。
- `--dev`：是否是开发模式，设置为 false 的时候将会对 JavaScript 代码进行优化处理。
- `--bundle-output`：生成的 `jsbundle` 文件的名称。
- `--assets-dest`：图片以及其他资源存放的目录

这几个里最容易出事的是 `--dev`。它设成 `false` 才会走生产优化，把开发期的警告、`__DEV__` 分支、YellowBox 那套东西剔掉，包体和运行时性能都差一截。忘了写这个参数默认是 `true`，打出来的包会带一堆开发期代码。

`--assets-dest` 也别漏，它管的是图片资源。只打 JS 不打资源的话，App 里所有 `require('./img/x.png')` 引的图会全部变成空白，而且不报错，非常难查。

补一句时效性说明：上面这条命令里的 `node_modules/react-native/local-cli/cli.js` 是 RN 0.5x 那个时期的路径。后来 RN 把 CLI 拆成了独立的 `@react-native-community/cli` 包，现在直接写 `npx react-native bundle --entry-file index.js ...` 就行，参数完全一样。老项目里这条路径还能跑，新项目照着官方文档写。

这样打包只需要在根目录下输入 `npm run bundle-ios` 即可（切记一定要先在 `项目 --> ios` 下新建 `bundle` 文件夹，不然会报错）。

![在项目根目录执行 npm run bundle-ios 打包离线资源](https://s.poetries.top/gitee/2019/10/711.png)

那个「先新建 bundle 文件夹」的提醒是有原因的：`--bundle-output` 只会创建文件，不会替你创建父目录，目录不存在就直接报 `ENOENT: no such file or directory`。命令跑起来之后终端会显示进度条，几十秒到一两分钟不等，看项目大小。

之后你会发现 bundle 文件下面已经有了内容（如下图）。

![打包完成后 ios/bundle 目录下生成的 index.jsbundle 与 assets 资源](https://s.poetries.top/gitee/2019/10/712.png)

正常情况下这个目录里应该有两样东西：一个 `index.jsbundle` 文件（就是打包好的 JS，通常几 MB），还有一个 `assets` 目录（项目里所有被 `require` 引用过的图片）。如果 `assets` 是空的或者压根没生成，回去检查 `--assets-dest` 参数。

### 2.2 添加离线资源到项目中

在 `Xcode` 中添加资源到项目中，必须使用 `Create folder references` 的方式（也就是文件夹的方式）添加 `bundle` 文件夹。

![在 Xcode 中右键工程选择 Add Files 添加 bundle 文件夹](https://s.poetries.top/gitee/2019/10/713.png)

操作路径是在 Xcode 左侧工程目录上右键，选 `Add Files to "项目名"`，然后在弹窗里选中刚生成的 `bundle` 文件夹。

必须使用 `Create folder references` 的方式添加：

![在添加文件的选项里选择 Create folder references 而不是 Create groups](https://s.poetries.top/gitee/2019/10/714.png)

这一屏是整节的关键，弹窗底部有两个单选项，一定要选 `Create folder references`，不要选默认的 `Create groups`。

那这两个选项差在哪呢？`Create groups`（黄色文件夹）只是 Xcode 里的一个逻辑分组，它会把目录里的文件**平铺**着加进工程，目录层级在最终的 ipa 里是不存在的。`Create folder references`（蓝色文件夹）则是保留真实目录结构，整个文件夹原样拷进包体。

RN 的资源引用是带路径的，`assets/img/logo.png` 这种，层级被拍平之后运行时就找不到图了。表现是 App 能启动、能跑，但所有图片都不显示。这个坑我踩过，排查了一下午才发现是加文件时选错了单选项。

添加成功后 `bundle` 文件夹为蓝色（如下图）。

![添加成功后 bundle 在 Xcode 工程目录中显示为蓝色文件夹](https://s.poetries.top/gitee/2019/10/715.png)

蓝色就是对的，黄色就是选错了，删掉重加一次。这是唯一一个不用运行就能确认对错的地方，加完顺手瞄一眼颜色，能省掉后面一堆无头案。

### 2.3 修改 AppDelegate.m 文件

在开发的过程中可以在这里配置 `Debug Server` 的地址，当发布上线的时候，就需要使用离线的 `jsbundle` 文件，因此需要设置 `jsCodeLocation` 为本地的离线 `jsbundle`。

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

这段代码在做的事，是让同一份工程按构建配置自动切换 JS 的来源。

`#ifdef DEBUG` 这个宏在 Debug 构建时成立，走上面那行，从 `RCTBundleURLProvider` 拿地址，也就是连本地 Metro；Release 构建时宏不成立，走 `#else` 分支，从 App 包体里读 `bundle/index.jsbundle`。这样你不用每次打包前手动改代码，切个 Scheme 就行。

有两个细节要对齐。一是 `URLForResource:@"bundle/index"` 里的 `bundle/` 前缀，它必须和你在上一节加进来的蓝色文件夹名一致，文件夹叫别的名字这里就得跟着改，否则运行时返回 `nil`，App 直接白屏闪退。二是被注释掉的那行写死 IP 的写法（`http://192.0.0.0:8081/index.bundle`），那是早年真机热重载的做法，把 IP 换成你电脑的局域网地址就能在真机上连 Metro。现在 RN 已经能自动发现开发机地址，一般用不上了，留着当个应急手段。

**Release 构建其实还有一条更省事的路**：Xcode 的 RN 模板里默认带了一个 `Bundle React Native code and images` 的 Build Phase 脚本，它会在每次 Release 构建时自动执行 bundle 命令并把产物打进包里。也就是说，如果你的工程里这个脚本是好的，第二节手动打 bundle、手动加文件夹这两步都可以省掉。手动这套的价值在于可控，脚本出问题（比如 `nvm` 装的 node 在 Xcode 环境里找不到）的时候，你有条退路。

## 三、iOS 证书配置速通

> 建议阅读这篇文章更详细。[React Native 打包前奏之 iOS 证书配置](https://feinterview.poetries.top/blog/rn-ios-cert-config)

这一节按截图把证书那条路快速过一遍，概念层面的解释（CSR 和公私钥的关系、Explicit 和 Wildcard 的区别、描述文件为什么是组合体）都在上面那篇里，这里只给操作路径。如果你更想让 Xcode 自动管理签名、不手动折腾 CSR，可以看 [RN 构建 iOS 包发布到 AppStore 全流程](https://feinterview.poetries.top/blog/ios-build) 那篇的自动签名路线。

首先你得有一个开发者账号才可以进行以下步骤。

### 3.1 用钥匙串生成 CSR

在 mac 上搜索钥匙串打开。

![在 Mac 上通过聚焦搜索打开钥匙串访问](https://s.poetries.top/gitee/2019/10/726.png)

打开之后走菜单 `钥匙串访问 -> 证书助理 -> 从证书颁发机构请求证书`。

![在钥匙串访问中通过证书助理请求证书并填写邮箱信息](https://s.poetries.top/gitee/2019/10/727.png)

填邮箱（用开发者账号那个）、填名称，下面一定要勾「存储到磁盘」，CA 邮箱留空。点继续之后桌面上会多出一个 `.certSigningRequest` 文件，这就是待会儿要上传的东西。这一步同时会在钥匙串的「密钥」里生成一对公私钥，私钥别删，删了证书就废了。

### 3.2 在开发者后台申请证书

到 `https://developer.apple.com` 去申请证书。

![登录 Apple Developer 后台进入证书管理页面](https://s.poetries.top/gitee/2019/10/728.png)

登录后进 `Certificates, Identifiers & Profiles`，进来先确认右上角的团队名对不对，多账号的人在这里选错的概率很高。

新建证书。

![在 Certificates 列表页点击加号开始新建证书](https://s.poetries.top/gitee/2019/10/729.png)

![在证书类型列表中选择需要的开发或发布证书类型](https://s.poetries.top/gitee/2019/10/730.png)

类型这一屏，真机调试选 Development 分组下的开发证书，打测试包和上架选 Production 分组下的发布证书。两者流程一样，区别只在这一次点击。

上传之前的钥匙串文件。

![在证书生成页上传前面用钥匙串生成的 CSR 文件](https://s.poetries.top/gitee/2019/10/731.png)

传的就是 3.1 那个 `.certSigningRequest`。这里报 `Invalid Certificate Signing Request` 的话，基本是文件传错了或者这个 CSR 已经被用过，重新生成一个即可。

下载证书。双击即可安装到钥匙串中。

![证书生成完成后点击 Download 下载 cer 文件](https://s.poetries.top/gitee/2019/10/732.png)

![双击下载的 cer 文件将证书安装到本机钥匙串](https://s.poetries.top/gitee/2019/10/733.png)

双击导入之后一定要去钥匙串的「我的证书」里确认一下：这条证书前面应该有个小三角，展开后挂着一把私钥。**只有证书没有私钥的话，Xcode 打包时会提示找不到匹配的签名身份**，那说明私钥不在这台机器上，得让建证书的同事导出 `.p12` 给你。

### 3.3 新建 Identifiers

新建 `Identifiers`。

![在左侧菜单进入 Identifiers 并点击加号新建标识符](https://s.poetries.top/gitee/2019/10/734.png)

![在标识符类型选择页中选择 App IDs](https://s.poetries.top/gitee/2019/10/735.png)

类型选 `App IDs`，别选到 `Services IDs` 之类去了，那是给网页登录用的。

![填写 App ID 的 Description 与 Explicit 格式的 Bundle ID](https://s.poetries.top/gitee/2019/10/736.png)

这一屏两个关键字段：`Description` 随便写个能认出来的名字，`Bundle ID` 选 Explicit（显式）并填反域名格式的包名。别图省事选 Wildcard，通配符不支持推送等大部分 Capabilities，后面想加功能就得推倒重来。

![确认信息后完成注册，Identifiers 列表中出现新建的条目](https://s.poetries.top/gitee/2019/10/737.png)

注册完回列表能看到这条新记录。这个 Bundle ID 必须和 Xcode 里 `PRODUCT_BUNDLE_IDENTIFIER` **一字不差**，大小写也算，而且 Debug 和 Release 两份配置都要对上。

### 3.4 新增 Profiles 把证书、App ID、设备关联起来

新增 Profiles 把设备证书以及 id 关联起来。

![在左侧菜单进入 Profiles 并点击加号新建描述文件](https://s.poetries.top/gitee/2019/10/738.png)

![在描述文件类型列表中选择开发或发布对应的类型](https://s.poetries.top/gitee/2019/10/739.png)

类型这一屏，真机调试选 `iOS App Development`，打给测试同学装的内测包选 Distribution 分组下的 `Ad Hoc`，上架选 `App Store`。选错了后面导出那一步会发现签名对不上。

![为描述文件选择对应的 App ID](https://s.poetries.top/gitee/2019/10/740.png)

选 3.3 建的那个 App ID。下拉里找不到就回去确认 App ID 建成功了没有、团队选对了没有。

![为描述文件勾选可用的签名证书](https://s.poetries.top/gitee/2019/10/741.png)

证书这一屏可以多选，建议把团队里所有可用证书都勾上，这样谁签的包都能被这份描述文件覆盖。

![为描述文件勾选允许安装的测试设备](https://s.poetries.top/gitee/2019/10/742.png)

设备这一屏只有 Development 和 Ad Hoc 类型才会出现。**没勾进来的机器，包装上去会直接装不上或者秒退**，这是「明明配好了却装不上」最常见的原因。

![填写描述文件名称并点击 Generate 生成后下载](https://s.poetries.top/gitee/2019/10/743.png)

最后起个带环境标识的名字，比如 `MyApp_AdHoc`，Xcode 里很快就会同时存在好几份描述文件，名字乱了很容易选错。点 Generate 生成、Download 下载，双击 `.mobileprovision` 由 Xcode 自动导入。

到此证书部分添加完毕。接下来是根据已经配置的证书去打包，Xcode 会自动同步证书信息过来。

## 四、在 Xcode 里把签名配置对

后台的东西齐了，回到 Xcode 收口。这一节的四步走完，Archive 按钮才会真正可用。

**1. 在 `Xcode` 添加前面申请证书的开发者账号（`Xcode -> Preferences -> Accounts`）**

![在 Xcode 的 Accounts 面板中添加开发者 Apple ID 账号](https://s.poetries.top/gitee/2019/10/716.png)

加完之后这一屏左边会列出你的 Apple ID，右边显示它所属的 Team。账号没加进来，Xcode 就没法去后台拉描述文件，签名那一栏永远是红的。补一句，新版 Xcode 把 `Preferences` 改名成了 `Settings`，菜单位置一样，不同 Xcode 版本这里的入口叫法有差异，找不到就在 `Xcode` 菜单下面翻一下。

**2. 这里的 `Bundle Identifier` 应该为之前在开发者平台上添加的 `App ID` 如下图**

![在 General 面板中确认 Bundle Identifier 与后台注册的 App ID 一致](https://s.poetries.top/gitee/2019/10/717.png)

选中 TARGETS 下的主 target，在 `General -> Identity` 里核对这一栏。RN 项目通常还会有测试 target，那些不用管。这一栏和后台的 App ID 差一个字符，下一步选描述文件时就会发现列表是空的。

**3. 配置一下 `code sign`。选择 `Code Signing Identity` 安装证书**

程序会自动选择设置。

![勾选自动管理签名后 Xcode 自动匹配证书和描述文件](https://s.poetries.top/gitee/2019/10/718.png)

勾上 `Automatically manage signing` 之后，Xcode 会自己去后台找匹配的证书和描述文件并下载到本地，成功的标志是这一屏的红色报错消失、`Signing Certificate` 显示成具体的证书名。绝大多数情况下这样就够了。

或者手动选择证书。

![取消自动签名后手动指定 Provisioning Profile 与签名证书](https://s.poetries.top/gitee/2019/10/719.png)

什么时候需要手动选？两种情况。一是你刚在后台加了新设备的 UDID，重新生成了 Ad Hoc 描述文件，Xcode 那边还没同步过来，这时候手动选下载好的那份最快。二是 Debug 和 Release 要用不同的描述文件，自动签名做不了这种区分，得取消勾选然后在 `Debug` / `Release` 两个标签下分别指定。

手动选的时候注意描述文件和证书要配套：Development 描述文件配开发证书，Ad Hoc / App Store 描述文件配发布证书，配错了 Archive 会在最后一步失败。

**4. 点击设备，选择通用 iOS 设备**

![在 Xcode 顶部工具栏把运行目标切换为通用 iOS 设备](https://s.poetries.top/gitee/2019/10/720.png)

这一步很多人漏掉，**目标选的是模拟器时，`Product` 菜单里的 `Archive` 是灰的**，点不动。因为模拟器跑的是 x86 架构的产物，没法用来打真机包。选成 `Generic iOS Device`（新版 Xcode 里叫 `Any iOS Device (arm64)`）之后 Archive 才会亮起来。

## 五、Archive 打包导出 ipa

**5. 点击 `Product -> Archive` 开始打包**

RN 项目第一次 Archive 会比较慢，它要完整编译所有原生依赖，加上执行 `Bundle React Native code and images` 那个脚本打 JS bundle，几分钟起步。

打包完成后如下。

![Archive 完成后自动弹出的 Organizer 归档管理窗口](https://s.poetries.top/gitee/2019/10/721.png)

归档成功后 Xcode 会自动弹出 `Organizer` 窗口，左侧按 App 分组，右侧列出这次的归档记录，带版本号、构建号和创建时间。没自动弹出的话走菜单 `Window -> Organizer` 手动打开。

如果 Archive 在中途失败，最常见的两类错误值得先排除。一类是 `command not found: node`，这是 Xcode 的执行环境里找不到用 `nvm` 装的 node，解法是在 `ios/.xcode.env`（或 `.xcode.env.local`）里写一行指向真实 node 路径。另一类是一堆找不到头文件的报错，那通常是装完新依赖忘了在 `ios` 目录跑 `pod install`。

点击 `distribute App`。

![在 Organizer 中点击 Distribute App 进入分发方式选择](https://s.poetries.top/gitee/2019/10/ionic/16.png)

点完会进入分发方式选择页，这一屏决定了你最终拿到的是什么形态的产物。

![在分发方式列表中选择 Ad Hoc 或 App Store 等发布渠道](https://s.poetries.top/gitee/2019/10/ionic/17.png)

四个常见选项的含义分别是：`App Store Connect` 直接传给苹果（上架或走 TestFlight）；`Ad Hoc` 导出能装在已注册设备上的 ipa；`Enterprise` 企业证书内部分发，需要企业开发者账号；`Development` 导出开发包。要发给测试同学装，选 `Ad Hoc`。选哪一项就得有对应类型的描述文件，这也是上一节强调配套的原因。

![配置导出选项，包括 App Thinning 与 OTA manifest](https://s.poetries.top/gitee/2019/10/ionic/18.png)

导出选项这一屏，`App Thinning` 保持 `None` 就行，除非你明确要针对特定机型瘦身。`Include manifest for over-the-air installation` 只有在你要自建一个 OTA 安装页时才需要勾，走蒲公英这类平台的话它会自己生成 plist，不用勾。

![确认签名方式并开始导出，Xcode 显示导出进度](https://s.poetries.top/gitee/2019/10/ionic/19.png)

再往下 Xcode 会让你确认签名方式（自动或手动都行）和一屏摘要，核对 Bundle ID、版本号、描述文件都对，点 Export 开始导出，然后选一个保存目录。

最后打包成 `ipa` 文件。

![导出完成后在指定目录中生成的 ipa 安装包文件](https://s.poetries.top/gitee/2019/10/725.png)

进到刚才选的目录里，会看到一个文件夹，里面除了 `.ipa` 还有 `DistributionSummary.plist`、`ExportOptions.plist` 和一个 `Packaging.log`。`.ipa` 就是要发出去的那个，另外几个是导出记录，出问题时 `Packaging.log` 里有详细信息，可以留着排查用。

## 六、发布到内测分发平台

由于新版的 iTunes 没有了应用程序选项，所以无法通过 iTunes 安装 App 到手机中。比较方便的方式是将应用发布到内测分发平台，然后扫码即可下载。目前我听得比较多的平台就是蒲公英和 fir.im，不过这两个平台都需要实名认证，有点蛋疼。具体使用哪个平台自己甄选就行，这里推荐一个不需要认证的国外平台 https://www.diawi.com

这段是当时的判断，现在补两句。一是国内平台的实名认证这几年是硬要求，绕不过去，但认证一次之后长期可用，团队长期用还是国内平台稳定。二是如果你的账号能上 App Store Connect，内测直接走 `TestFlight` 会比 Ad Hoc 这套省心得多，不用维护 UDID 列表，测试人数上限也高，代价是首次提交要过一道苹果的审核，有一到两天延迟。

不是说 Ad Hoc 不行，而是两条路各有各的场景：要随时能发、完全可控，用 Ad Hoc 加分发平台；要省掉 UDID 这套维护成本，用 TestFlight。两套都会配，遇到什么情况都不至于卡住。

### 6.1 ipa 安装到手机上

如果测试机就在手边，其实不用经过任何平台，Xcode 就能直接装。

在 Xcode 的导航栏上选择 `Window -> Devices and Simulators`，点击弹出页面里面的 + 号，选择 `ipa` 所在的文件夹，添加 `ipa`，安装成功。

![在 Xcode 的 Devices and Simulators 窗口中选中已连接的设备](https://s.poetries.top/gitee/2019/10/709.png)

打开这个窗口后左侧会列出所有通过数据线连上的设备，选中你要装的那台，右边 `INSTALLED APPS` 区域下面有一个加号。顺带一提，这个窗口里显示的 `Identifier` 就是设备的 UDID，需要往后台注册设备时，从这里复制最快。

![点击加号选择本地 ipa 文件完成安装](https://s.poetries.top/gitee/2019/10/710.png)

点加号选中导出的 `.ipa`，进度条走完 App 就装上了。这里如果报 `Unable to install`，几乎都是签名问题：要么这台设备的 UDID 不在描述文件的设备列表里，要么用的是 App Store 类型的描述文件（那种不带设备列表，本来就装不上）。

以上只是测试版本打包，打包成 `distribute App` 发布版本同理，这里不再赘述。

## 总结

这条流程走下来，真正需要记住的其实是三个容易翻车的点，剩下的都是照着点按钮。

第一个是 JS 资源。开发时靠 Metro 实时喂，打包时必须换成离线 `jsbundle`，靠 `AppDelegate.m` 里那段 `#ifdef DEBUG` 自动切换。忘了打 bundle 或者路径写错，表现是装上去红屏或者白屏闪退。

第二个是加文件时的 `Create folder references`。这个单选项选错，App 照样能跑，只是所有图片都不显示，而且不报错。加完看一眼文件夹是不是蓝色，两秒钟的事，能省掉一下午。

第三个是签名和设备。Archive 灰着点不动就去看设备目标是不是选了模拟器；包装不上测试机就去看那台机器的 UDID 在不在描述文件里。加了新设备之后**必须重新生成描述文件并重新打包**，旧包不会因为你在后台点了几下就突然能装。

至于证书那一层的原理，如果你还是觉得 App ID、证书、描述文件这三者的关系有点糊，建议回头看 [React Native 打包前奏之 iOS 证书配置](https://feinterview.poetries.top/blog/rn-ios-cert-config)，那篇把每一样东西管什么讲清楚了，这里就不重复了。

## 参考

- React Native 官方文档：Publishing to Apple App Store <https://reactnative.dev/docs/publishing-to-app-store>
- Apple 开发者文档：Distributing your app for beta testing and releases <https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases>
- Apple 开发者文档：Certificates, Identifiers & Profiles <https://developer.apple.com/help/account/>
- 蒲公英内测分发平台 <https://www.pgyer.com>
- diawi 分发平台 <https://www.diawi.com>
- [前端进阶之旅](https://interview.poetries.top)
