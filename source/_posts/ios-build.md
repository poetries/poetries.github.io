---
title: RN 构建 iOS 包发布到 AppStore 全流程 证书描述文件与上架实战
date: 2023-10-22 18:10:12
description: 一份 React Native 项目打 iOS 包的完整流程记录。从 Apple Developer 后台创建 App ID、Xcode 自动生成开发与发布证书、配置 Development 和 Distribution 描述文件，到 Archive 导出 ipa 发蒲公英内测、注册设备 UDID，再到 App Store Connect 创建应用、上传构建版本、处理被拒审的权限描述，一步一图讲清每个环节。
tags:
  - RN
  - react
  - iOS
  - App Store
  - 证书
  - 打包发布
categories: Front-End
---

第一次给 `React Native` 项目打 iOS 包上架，最劝退的不是代码，是苹果那一整套签名体系。你会在 `Apple Developer` 后台、`Xcode`、`App Store Connect` 三个地方来回跳，面对 `Identifiers`、`Certificates`、`Profiles`、`Devices` 这四个长得都差不多的菜单，不知道该先点哪个。等你终于点完了，`Xcode` 一句 `No profiles for 'com.xxx.app' were found` 又把你打回原点。

这篇是我把这条路完整走通一遍之后留下的记录，从后台建 `App ID` 开始，一直到包被 `App Store Connect` 收下、审核被拒之后怎么补救为止。每一步配了截图，也把每一步「在做什么」和「做完应该看到什么」写清楚。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 证书、App ID、描述文件、设备这四样东西各自管什么，它们是怎么串起来的
- 为什么推荐让 `Xcode` 自动管理签名，而不是在后台手动创建证书
- 开发环境（`Development`）和正式环境（`Distribution`）两套证书 + 描述文件怎么配
- `Xcode` 里 `Signing & Capabilities` 那一屏每个选项该怎么填
- 怎么 `Archive` 导出 `ipa`，上传到蒲公英给测试同学装
- 设备 `UDID` 从哪来、注册到哪、注册完为什么还得重新打包
- `App Store Connect` 建应用、传构建版本的完整路径
- 审核被拒最常见的那个原因，以及重新构建时版本号怎么改

## 一、先把四个概念理顺

苹果这套签名体系之所以绕，是因为它把一件事拆成了四样东西，缺一不可。动手之前先花两分钟理清楚，后面所有操作就都有的放矢了。

**App ID（Identifiers）** 是你这个 App 的唯一身份，对应 `Xcode` 里的 `Bundle Identifier`，形如 `com.company.appname`。它还负责声明这个 App 要用哪些能力（推送、`Sign in with Apple`、`App Groups` 这些）。一个 App ID 一旦创建就不能改，所以命名前想清楚。

**证书（Certificates）** 证明「这个包是我签的」。它分两大类：`Apple Development`（开发证书，装到调试设备上跑）和 `Apple Distribution`（发布证书，用来打 `Ad Hoc` 内测包和上架包）。证书本身和具体哪个 App 无关，一个团队的证书可以给所有 App 用。

**描述文件（Provisioning Profiles）** 是把上面几样绑在一起的那张「许可证」。它记录了「哪个 App ID + 哪张证书 + 哪些设备」这三者的组合，装到设备上的包必须能匹配上一份有效的描述文件，系统才肯让它运行。

**设备（Devices）** 就是通过 `UDID` 注册进后台的测试机列表。只有 `Development` 和 `Ad Hoc` 两种描述文件需要它，上架用的 `App Store` 描述文件不含设备列表，因为它面向所有人。

先说结论，这四样里最容易出问题的是描述文件，因为它是唯一一个「组合体」，上游任何一项变了（换了证书、加了设备、改了 Bundle ID），它就得重新生成，而且**重新生成之后必须重新打包**，旧包不会自动生效。

> 使用`xcode`来管理自动生成证书，不需要在管理后台创建

这句是整篇的一个关键取舍。证书理论上可以在后台手动走「生成 CSR 请求文件 → 上传 → 下载 cer → 双击导入钥匙串」这一套，但那套流程步骤多、还容易把私钥搞丢。`Xcode` 的 `Automatically manage signing` 会替你把证书和描述文件都建好并保持同步，绝大多数情况下够用了，下面就按这个思路走。

## 二、在 Apple Developer 后台创建 App ID

第一步是给 App 上户口。

> 登录 https://developer.apple.com/account

登录之后进入 `Certificates, Identifiers & Profiles` 这个板块，这是后面所有后台操作的总入口。

![登录 Apple Developer 账号后进入 Certificates, Identifiers & Profiles 总入口](https://s.poetries.top/uploads/2023/10/d3d19228ec48dfe2.png)

进来先确认左上角的团队名对不对。如果你同时在多个开发者账号里（比如个人账号和公司账号），这里选错了，后面证书和描述文件全建到另一个团队去了，`Xcode` 里怎么都匹配不上。

在左侧菜单点 `Identifiers`，然后点列表左上角那个蓝色的加号新建。

![在左侧菜单中选择 Identifiers 并点击加号新建标识符](https://s.poetries.top/uploads/2023/10/19657900fcb37bef.png)

点完加号会先让你选类型，选第一项 `App IDs` 然后继续。这一屏还有 `Services IDs`、`Pass Type IDs` 之类的选项，那些是给推送服务、`Wallet` 卡券用的，跟打包上架没关系，别点错。

![在新建标识符的类型选择页选择 App IDs 类型](https://s.poetries.top/uploads/2023/10/9348e21eb02eae74.png)

选完类型下一屏会再问一次是 `App` 还是 `App Clip`，选 `App`。这两屏是苹果在某次改版后拆出来的，不同时期进来看到的步数可能不一样，认准最后填 `Bundle ID` 那一屏就行。

![继续选择 App 类型进入 App ID 的信息填写页](https://s.poetries.top/uploads/2023/10/4c8cddc046e42324.png)

到了填信息这一屏，两个关键字段。`Description` 随便写个能认出来的名字；`Bundle ID` 选 `Explicit`（显式），填你项目里的那个包名，比如 `com.poetries.myapp`。

![填写 App ID 的 Description 与 Explicit Bundle ID](https://s.poetries.top/uploads/2023/10/68e759bd80a6b7d0.png)

这里有个坑要注意，`Bundle ID` 必须和 `Xcode` 项目里 `General → Identity → Bundle Identifier` 那一栏**一字不差**，大小写也算。RN 项目里这个值在 `ios/项目名.xcodeproj` 的 `PRODUCT_BUNDLE_IDENTIFIER` 里，改的时候记得 `Debug` 和 `Release` 两个配置都要改。另外别选 `Wildcard`（通配符），通配符 App ID 不支持推送等大部分 `Capabilities`，后面想加功能就得推倒重来。

往下滚是 `Capabilities` 列表，用不到的能力先都别勾，之后需要了随时回来加。确认无误点 `Continue`，再点 `Register` 完成。

![确认 App ID 信息后完成注册，列表中出现新建的标识符](https://s.poetries.top/uploads/2023/10/1c453d7171b4d71f.png)

回到 `Identifiers` 列表能看到刚建好的这一条，App ID 这一步就完事了。

## 三、让 Xcode 自动生成开发证书

App ID 有了，接下来是证书。这一步不用回后台点，交给 `Xcode` 更省事。

先在 `Xcode` 顶部菜单 `Xcode → Settings → Accounts`（旧版本叫 `Preferences`）里，把你的 Apple ID 加进去并选中对应的 Team。账号没加进来，后面自动签名一定失败。

![在 Xcode 的 Accounts 设置中添加 Apple ID 并选中开发者 Team](https://s.poetries.top/uploads/2023/10/864c4d1828d36193.png)

加完账号，回到项目，选中 `TARGETS` 下的主 target，切到 `Signing & Capabilities` 标签页，勾上 `Automatically manage signing`，`Team` 选你的团队。

![在 Signing & Capabilities 中勾选 Automatically manage signing 并选择 Team](https://s.poetries.top/uploads/2023/10/7ff0853d6763d1e7.png)

勾上的一瞬间 `Xcode` 就开始干活了：它会去后台查有没有可用的开发证书，没有就自动申请一张，同时生成一份匹配当前 Bundle ID 的 `Development` 描述文件并下载到本地。整个过程几秒钟，成功之后这一屏的 `Signing Certificate` 会显示成 `Apple Development: 你的名字 (XXXXXXXXXX)`，下面的红色报错消失。

> 然后到后面就看到自动创建的证书了

![回到 Apple Developer 后台的 Certificates 列表，可以看到 Xcode 自动创建的开发证书](https://s.poetries.top/uploads/2023/10/dae17eae4f107800.png)

回后台的 `Certificates` 菜单刷新一下，能看到多了一条 `Apple Development` 类型的证书，创建者就是你。看到它说明自动签名链路是通的。

这里补一句经验，开发证书在账号里是有数量上限的（个人账号更紧），团队人一多很容易顶格。真到了上限，先去后台把那些已经离职同事或者早就换机器的旧证书 `Revoke` 掉再重来，别一直点重试。

## 四、创建 Development 描述文件

自动签名其实已经帮你生成了一份开发描述文件，但很多团队还是习惯在后台显式建一份来管控设备范围，流程也就顺手过一遍，出问题时你才知道去哪看。

在左侧菜单点 `Profiles`，然后点加号新建。

![在左侧菜单选择 Profiles 并点击加号新建描述文件](https://s.poetries.top/uploads/2023/10/43fdac62f1c4ebea.png)

第一屏选类型，在 `Development` 分组下选 `iOS App Development`。注意别选到下面 `Distribution` 分组里去了，那是第六节的事。

![在描述文件类型选择页的 Development 分组下选择 iOS App Development](https://s.poetries.top/uploads/2023/10/08dbd8f12c57cd87.png)

下一屏选 App ID，从下拉里挑第二节建的那个。这里只会列出当前团队下的 App ID，找不到就回去确认团队选对没有。

![为描述文件选择对应的 App ID](https://s.poetries.top/uploads/2023/10/05aab8ad8141cbab.png)

再下一屏选证书，把第三节里 `Xcode` 自动生成的那张 `Apple Development` 证书勾上。可以多选，勾了哪几张，用这些证书签出来的包就都能被这份描述文件覆盖。团队协作时建议全勾，省得每个人各自建一份。

![为描述文件勾选可用的开发证书](https://s.poetries.top/uploads/2023/10/543f027a5d7c2043.png)

接着是选设备。这一屏列出的是后台 `Devices` 里已注册的所有测试机，勾上需要装这个开发包的设备。**没勾进来的设备，包装上去会直接闪退或者根本装不上**，这就是第九节要专门讲注册 UDID 的原因。

![为描述文件勾选允许安装的测试设备](https://s.poetries.top/uploads/2023/10/6232eacf27532221.png)

最后一屏给描述文件起个名字，建议带上环境标识，比如 `MyApp_Dev`，以后在 `Xcode` 下拉里一眼就能认出来。点 `Generate` 生成，然后 `Download` 下载，双击下载好的 `.mobileprovision` 文件，`Xcode` 会自动把它导入。

![填写描述文件名称并生成，随后下载 mobileprovision 文件](https://s.poetries.top/uploads/2023/10/31b7f6ff29a2d551.png)

到这里开发环境这一套（App ID + 开发证书 + 开发描述文件 + 设备）就齐了，用数据线连上一台已注册的设备，`Xcode` 里选中它直接 `Run`，App 应该能装上去跑起来。

## 五、生成 Distribution 正式环境证书

开发那套只能在注册过的设备上跑，要打内测包和上架包，得换一套 `Distribution` 的证书和描述文件。

发布证书同样可以让 `Xcode` 自动生成（`Archive` 的时候它会问你），也可以在后台 `Certificates` 里点加号手动建。手动建的话在类型列表里选 `Apple Distribution`（有些账号下显示为 `iOS Distribution (App Store and Ad Hoc)`），然后按提示上传一份 `CSR` 文件。

![在 Certificates 中新建 Apple Distribution 类型的发布证书](https://s.poetries.top/uploads/2023/10/25717985c486ad13.png)

`CSR` 文件的生成方式是打开 `Mac` 上的「钥匙串访问」，菜单走 `钥匙串访问 → 证书助理 → 从证书颁发机构请求证书`，邮箱填你的，选「存储到磁盘」，得到一个 `.certSigningRequest` 文件，传上去就行。

这里有个团队协作的坑，**发布证书全团队只需要一张**。谁生成的，私钥就在谁的钥匙串里，别人要打包必须从这台机器导出一份 `.p12`（导出时会让你设密码）再导入自己的钥匙串。如果每个人各建一张，很快就会撞上苹果对发布证书数量的限制。

生成完成后下载 `.cer` 双击导入钥匙串，在「我的证书」里能展开看到证书下面挂着一把私钥，才算真的可用；只有证书没有私钥的话，`Xcode` 打包时会提示找不到匹配的签名身份。

## 六、创建 Distribution 描述文件

证书有了，配对应的描述文件。流程和第四节几乎一样，区别只在类型那一屏。

回到 `Profiles` 点加号新建，这次在 `Distribution` 分组下选。要打给测试同学装的内测包选 `Ad Hoc`，要上架 `App Store` 选 `App Store`（新版界面里叫 `App Store Connect`）。两者的差别在于：`Ad Hoc` 带设备列表，只能装在注册过的机器上；`App Store` 不带设备列表，但只能通过苹果的分发渠道安装，不能直接拿 `ipa` 装机。

![在描述文件类型选择页的 Distribution 分组下选择发布类型](https://s.poetries.top/uploads/2023/10/e7815063c626ab41.png)

下一屏还是选 App ID，和开发那份选同一个。

![为发布描述文件选择对应的 App ID](https://s.poetries.top/uploads/2023/10/5df2093eb4cf289f.png)

再下一屏选证书，这次勾第五节那张 `Apple Distribution` 证书。如果这里列表是空的，说明发布证书没建成功，或者建到别的团队去了，回第五节确认。

![为发布描述文件勾选 Apple Distribution 证书](https://s.poetries.top/uploads/2023/10/32a4e9928c21e29d.png)

最后命名生成下载。建议命名成 `MyApp_AdHoc` / `MyApp_AppStore` 这种一眼能分清用途的名字，因为接下来 `Xcode` 里会同时存在好几份描述文件，名字乱了很容易选错。

![填写发布描述文件名称并生成下载](https://s.poetries.top/uploads/2023/10/09602f7d4539b5df.png)

如果你选的是 `Ad Hoc`，中间还会多一屏选设备，逻辑和第四节一样，勾上要装内测包的机器。

## 七、在 Xcode 里把签名配置对

后台的东西都齐了，回到 `Xcode` 收口。

打开 `ios/项目名.xcworkspace`（RN 项目用了 `CocoaPods`，一定要开 `.xcworkspace` 而不是 `.xcodeproj`），选中主 target 的 `Signing & Capabilities`。

![在 Xcode 的 Signing & Capabilities 中配置 Debug 与 Release 的签名](https://s.poetries.top/uploads/2023/10/55b307b2e260aee8.png)

这一屏顶部有 `All / Debug / Release` 三个标签。默认在 `All` 下配的会同时作用于两种构建配置，如果你想让 `Debug` 用开发描述文件、`Release` 用发布描述文件，就得取消 `Automatically manage signing`，切到具体标签分别指定。RN 项目通常还有一个 `-tvOS` 或测试用的 target，那些不用管，只配主 target 就行。

![确认 Bundle Identifier、Team 与 Provisioning Profile 三项匹配](https://s.poetries.top/uploads/2023/10/a8e531d89de997aa.png)

配完检查这三项是不是对得上：`Bundle Identifier` 等于第二节建的 App ID，`Team` 是正确的团队，`Provisioning Profile` 选中了对应环境那份。三项里任何一项对不上，`Xcode` 都会在这一屏直接飘红并告诉你缺什么，报错信息其实挺准的，别急着去搜，先把它读完。

顺带说两个 RN 特有的点。`Release` 构建时 `Xcode` 会执行 `react-native-xcode.sh` 这个脚本去打 `jsbundle`，如果你的 `node` 是用 `nvm` 装的，这个脚本在 `Xcode` 的环境里可能找不到 `node`，报错形如 `command not found: node`。解法是在 `ios/.xcode.env`（或 `.xcode.env.local`）里显式写一行 `export NODE_BINARY=$(command -v node)` 指向真实路径。另外每次装完新依赖别忘了在 `ios` 目录下跑一次 `pod install`，不然 `Xcode` 里会报一堆找不到头文件的错。

## 八、打测试包并发到蒲公英

签名配好了，开始打包。这一节的目标是产出一个 `ipa` 并让测试同学能装上。

先把设备目标切成 `Any iOS Device (arm64)`。这一步很多人漏掉，**如果选的是模拟器，`Product` 菜单里的 `Archive` 是灰的**，点不动。

![在 Xcode 顶部把运行目标切换为 Any iOS Device](https://s.poetries.top/uploads/2023/10/7c25b7fdd2cf1a4f.png)

切好之后走菜单 `Product → Archive`，开始编译归档。RN 项目第一次 `Archive` 会比较慢，因为要完整编译原生依赖加上打 `jsbundle`，泡杯咖啡的时间。

![通过 Product 菜单执行 Archive 开始归档构建](https://s.poetries.top/uploads/2023/10/979bfb42f2d823c6.png)

归档成功后 `Xcode` 会自动弹出 `Organizer` 窗口，左侧按 App 分组，右侧是这次的归档记录，带版本号和创建时间。

![Archive 完成后弹出的 Organizer 窗口，列出本次归档记录](https://s.poetries.top/uploads/2023/10/446e877b181200e4.png)

选中这条记录，点右侧的 `Distribute App` 按钮，进入分发方式选择。

![在 Organizer 中点击 Distribute App 进入分发方式选择](https://s.poetries.top/uploads/2023/10/c0ac19effeff23bb.png)

分发方式这一屏有四个常见选项，含义分别是：`App Store Connect` 传给苹果（上架或 `TestFlight`）；`Ad Hoc` 导出能装在已注册设备上的 `ipa`；`Enterprise` 企业证书内部分发（需要企业开发者账号）；`Development` 导出开发包。要发蒲公英给测试装，选 `Ad Hoc`。

![在分发方式列表中选择 Ad Hoc 用于导出内测 ipa](https://s.poetries.top/uploads/2023/10/7a9d940024ec8cad.png)

下一屏是导出选项。`App Thinning` 保持 `None` 就好，除非你明确要针对特定机型瘦身；`Include manifest for over-the-air installation` 这一项如果你要自建 OTA 安装页才需要勾，走蒲公英的话它会自己生成 `plist`，不用勾。

![配置 Ad Hoc 导出选项，包括 App Thinning 与 OTA manifest](https://s.poetries.top/uploads/2023/10/e4b33263233d8db8.png)

再往下 `Xcode` 会让你确认签名方式，自动或手动都行，然后开始导出。导出完成会让你选一个保存目录，进去就能看到那个 `.ipa` 文件。

![导出完成后在指定目录中生成 ipa 安装包](https://s.poetries.top/uploads/2023/10/305c22c3e7b190b9.png)

拿到 `ipa` 之后就可以上传分发平台了。

> 上传到蒲公英内测 https://www.pgyer.com

![打开蒲公英网站准备上传 ipa 包](https://s.poetries.top/uploads/2023/10/b15ca30cd01b19fd.png)

注册登录之后，首页就有上传入口，把 `ipa` 拖进去。蒲公英会自动解析包里的 `Info.plist`，把应用名、`Bundle ID`、版本号识别出来。

![把 ipa 文件拖入蒲公英的上传区域，等待解析](https://s.poetries.top/uploads/2023/10/b2929e57f5f970ab.png)

上传完可以给这个版本写一段更新说明，也可以设置安装密码。发给外部测试时建议加个密码，`ipa` 里毕竟带着你的接口地址和配置。

![上传完成后填写版本更新说明并设置访问权限](https://s.poetries.top/uploads/2023/10/a99d12324dd8a872.png)

最后把应用地址复制发给测试人员下载即可，需要注意的是我们要添加测试手机的设备UUID才可以安装到手机上测试。

这句是这一节最关键的提醒。测试同学点开链接如果提示「无法安装应用程序」，九成不是包的问题，而是他那台机器的 `UDID` 不在 `Ad Hoc` 描述文件的设备列表里。怎么加，看下一节。

## 九、把测试机 UDID 注册进后台

回到 `Apple Developer` 后台，左侧菜单点 `Devices`，然后点加号注册新设备。

![在 Apple Developer 后台的 Devices 菜单中点击加号注册设备](https://s.poetries.top/uploads/2023/10/78653128e1967b61.png)

注册页要填两个东西：`Device Name`（随便写个能认出来的，比如「张三的 iPhone 14」）和 `Device ID (UDID)`，那串 40 位或 25 位的字符。填完点 `Continue` 再 `Register`。

![在设备注册页填写设备名称与 UDID](https://s.poetries.top/uploads/2023/10/6e003a3a0a8ef496.png)

那 `UDID` 从哪来呢？最省事的办法是让测试同学自己去蒲公英的工具页取，用手机 `Safari` 打开链接，按提示装一个描述文件，页面就会把 `UDID` 显示出来，复制发给你即可。

> 地址：https://www.pgyer.com/tools/udid/manage

![用手机浏览器打开蒲公英的 UDID 获取工具页，按提示取得设备 UDID](https://s.poetries.top/uploads/2023/10/d91b1123872f2ca9.png)

如果测试机就在手边，也可以用数据线连上 `Mac`，在 `Xcode → Window → Devices and Simulators` 里直接看到 `Identifier`，那就是 `UDID`。

> 需要注意的是：设备添加超过`20个`，需要等待`24小时`才能在iPhone手机上安装APP测试。`添加新的额设备udid，需要重新打包ipa包才能进行安装到对应手机上`

后半句是硬规则，务必记住：**新注册的设备不会让已经打好的旧包突然能装**。因为设备列表是被写进描述文件、描述文件又被打进 `ipa` 里的，加了设备之后必须回后台把 `Ad Hoc` 描述文件重新生成一遍（或者让 `Xcode` 自动刷新），然后**重新 Archive 重新导出**，测试同学再下新链接才行。这条我踩过，加完设备让测试重装了三次原来的包，白折腾半小时。

前半句关于数量和等待时间，我按当时的实际情况记录在这。苹果官方文档给的口径是每个产品族（iPhone、iPad 等各算一族）在每个会员年度内最多注册 100 台，且只有在续费时才能清理设备列表。数量策略这些年调整过几次，具体以你账号里 `Devices` 页面显示的剩余额度为准。

## 十、在 App Store Connect 创建应用

内测跑通了，接下来是上架。上传构建版本之前，`App Store Connect` 里必须先有一个对应的 App 记录，否则传上去会直接被拒绝。

> 入口：https://developer.apple.com/account

![从开发者账号页面进入 App Store Connect](https://s.poetries.top/uploads/2023/10/098ffcfe3382883e.png)

从开发者首页进 `App Store Connect`，或者直接访问 `appstoreconnect.apple.com`。进去之后点 `我的 App`。

![在 App Store Connect 中进入我的 App 列表](https://s.poetries.top/uploads/2023/10/ad192fc1a02051d0.png)

点左上角加号选「新建 App」，弹出的表单里几个字段说明一下：`平台` 勾 `iOS`；`名称` 是显示在 `App Store` 上的名字，全球唯一，被占了就得换；`主要语言` 按目标市场选；`套装 ID` 从下拉里选第二节建的那个 App ID，选不到说明 App ID 没建或者团队不对。

![在新建 App 表单中填写平台、名称、主要语言与套装 ID](https://s.poetries.top/uploads/2023/10/aa4f08b7d0b6b23d.png)

还有一个 `SKU`，它是给你内部用的唯一编号，不会对外显示，填成和 `Bundle ID` 一样最省心。填完点创建。

![填写 SKU 并完成 App 创建](https://s.poetries.top/uploads/2023/10/2e2f5d4a13f43e57.png)

创建成功后会跳进这个 App 的详情页，左侧是版本信息、`App` 信息、定价、`TestFlight` 等一堆栏目。此刻「构建版本」那一块还是空的，因为包还没传。

## 十一、上传构建版本到 App Store Connect

回到 `Xcode`，重复第八节的 `Archive` 流程，区别只在分发方式这一屏选 `App Store Connect`。

![在分发方式选择页选择 App Store Connect 用于上传](https://s.poetries.top/uploads/2023/10/cf408e3029539dc9.png)

下一屏会问你是 `Upload`（直接上传）还是 `Export`（导出 `ipa` 之后再用别的工具传）。选 `Upload` 最直接。如果你的网络传大包容易断，也可以选 `Export` 导出后用苹果官方的 `Transporter` App 传，它支持断点续传，稳一些。

![选择 Upload 直接上传或 Export 导出后再用 Transporter 上传](https://s.poetries.top/uploads/2023/10/2a74082d89e946e8.png)

接着是几屏确认：符号文件（`Include bitcode` 在新版 `Xcode` 里已经移除，看不到是正常的）、`Upload your app's symbols` 建议勾上，这样崩溃日志才能被符号化；签名方式确认；最后是一屏摘要，核对 `Bundle ID`、版本号、构建号都对，点 `Upload`。

![确认上传摘要中的 Bundle ID 与版本号后点击 Upload](https://s.poetries.top/uploads/2023/10/64dfe89783c717ed.png)

上传过程中 `Xcode` 会先做一轮校验，权限描述缺失、图标尺寸不对、`Info.plist` 字段非法这些问题会在这里就被打回来，看提示改完重新 `Archive` 即可。

> 上传成功后，来到app 后台

![上传成功后回到 App Store Connect 的 App 详情页](https://s.poetries.top/uploads/2023/10/cd1a10fc38b5c201.png)

刚传完你在后台大概率还看不到这个构建版本，别慌。苹果那边要跑一轮自动处理（解包、校验、生成各种衍生产物），一般几分钟到半小时不等，处理期间状态显示为「正在处理」，处理完你会收到一封邮件。

![在构建版本区域看到处理完成的包并选中它](https://s.poetries.top/uploads/2023/10/c5d55c40962f74ec.png)

处理完成后，去版本页面的「构建版本」区域点加号，把这个包选进来，再补齐截图、描述、关键词、隐私政策链接、分级问卷这些资料，就可以提交审核了。

顺便提一句，包传上去之后会自动出现在 `TestFlight` 里，比蒲公英那套 `Ad Hoc` 方便得多，不用管 `UDID`，测试人数上限也高。团队要是能接受苹果那道审核延迟，内测直接走 `TestFlight` 更省事。

## 十二、审核被拒之后怎么补救

上架不是一次就过的，被拒很正常。这一节讲两件被拒之后最常做的事。

第一件是重新构建。改完代码重新打包之前，**版本号必须改**，否则苹果会直接拒收，报错是构建版本已存在。

这里要分清两个号。`Version`（对应 `Info.plist` 里的 `CFBundleShortVersionString`）是给用户看的，比如 `1.0.1`；`Build`（对应 `CFBundleVersion`）是构建号，同一个 `Version` 下每传一次就得往上加一，比如 `1`、`2`、`3`。只是重新提交修复包的话，`Version` 可以不动，把 `Build` 加一就行。

> 打包后，在app store后台选择最近的构建版本

![在 App Store Connect 的构建版本列表中选择最新一次上传的构建](https://s.poetries.top/uploads/2023/10/7fc6ff00ac395145.png)

传完新包，回后台把版本页面里原来那个构建版本移除，换成刚上传的这个，再重新提交。这一步容易忘，改了半天代码结果提交上去的还是旧包。

第二件是权限描述。这是被拒的高频原因，尤其对 RN 项目，因为很多三方库会悄悄引入相机、相册、定位的权限声明。

![检查并修改 Info.plist 中的权限用途描述文案](https://s.poetries.top/uploads/2023/10/c4bfcbf056cf7932.png)

苹果的要求是：只要 App 里出现了某项隐私权限，`Info.plist` 里就必须有对应的用途描述字段，而且描述得说清楚**为什么要这个权限、用来做什么**。常见的几个是 `NSCameraUsageDescription`（相机）、`NSPhotoLibraryUsageDescription`（相册）、`NSLocationWhenInUseUsageDescription`（定位）、`NSMicrophoneUsageDescription`（麦克风）。

写这段文案有两个雷区。一是干脆没写，App 一调用权限就直接崩溃，审核必挂；二是写得太敷衍，比如只写「需要访问相机」，审核员会以 `Guideline 5.1.1` 打回来要求补充具体用途。正确写法是把场景说出来，例如「用于拍摄头像照片并上传到您的个人资料」。

RN 项目还有个额外提醒，很多库（`react-native-image-picker`、`react-native-permissions` 之类）会在 `Podspec` 里带上权限声明，你自己代码没用到也会被扫出来。上传前搜一遍最终产物的 `Info.plist`，把出现的每一项都补上文案，能省掉一轮审核往返。

调试阶段如果想看 App 内嵌 `WebView` 里到底发生了什么，可以配合 [真机调试 WebView 的完整指南](https://feinterview.poetries.top/blog/webview-real-device-debugging-ios-safari-android-chrome) 一起用，那篇讲了 `Safari` 网页检查器和 `chrome://inspect` 两条路。

## 总结

这条流程走下来，真正需要记住的不是几十个按钮的位置，而是苹果那套签名的依赖关系：

App ID 定义身份，证书证明来源，描述文件把「身份 + 来源 + 设备」绑成一份许可证，最后打进包里。所以只要 Bundle ID、证书、设备列表这三者中任何一个变了，描述文件就得重新生成，包也得重新打。绝大多数「明明配好了却装不上」的问题，根子都在这条链上某一环没同步。

实操上有三条能省掉大量时间的经验。第一，开发阶段无脑用 `Xcode` 的自动签名，别手工折腾 `CSR`；第二，发布证书全团队共用一张，靠 `.p12` 导入导出，别各建各的；第三，加了新测试设备之后一定要重新生成描述文件并重新打包，这一条被坑的人最多。

至于分发方式，如果你的团队能接受苹果那点审核延迟，内测直接走 `TestFlight` 会比 `Ad Hoc` + 蒲公英这套省心不少，不用维护 `UDID` 列表。但 `Ad Hoc` 这条路胜在完全可控、随时能发，两套都会配，遇到什么情况都不至于卡住。

## 参考

- Apple 开发者文档：Certificates, Identifiers & Profiles <https://developer.apple.com/help/account/>
- Apple 开发者文档：Distributing your app for beta testing and releases <https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases>
- App Store 审核指南 <https://developer.apple.com/app-store/review/guidelines/>
- React Native 官方文档：Publishing to Apple App Store <https://reactnative.dev/docs/publishing-to-app-store>
- 蒲公英内测分发平台 <https://www.pgyer.com>
- [前端进阶之旅](https://interview.poetries.top)
