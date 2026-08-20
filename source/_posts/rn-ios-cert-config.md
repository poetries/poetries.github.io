---
title: React Native 打包前奏之 iOS 证书与描述文件配置详解
date: 2019-10-03 19:10:12
description: 讲清 iOS 签名体系里 App ID、开发证书、发布证书、推送证书和 Provisioning Profiles 各自管什么、怎么串起来。从钥匙串生成 CSR 开始，一步一图走完创建 App ID、申请证书、导出 p12 给友盟极光、生成 Ad Hoc 描述文件的全过程，并附常见报错排查。
tags:
 - RN
 - IOS证书
 - iOS
 - 描述文件
 - 推送证书
categories: Front-End
---

第一次配 iOS 证书的人，基本都会卡在同一个地方：明明按教程一步步点完了，Xcode 还是飘红说 `No signing certificate "iOS Distribution" found`，或者包打出来了装到测试机上直接闪退。原因不是哪一步点错了，是根本没搞清楚 App ID、证书、描述文件、设备这四样东西之间的依赖关系，出问题时不知道该回头查哪一环。

这篇专门讲证书这一层，不讲打包。从钥匙串生成 CSR 开始，把 App ID、开发证书、发布证书、推送证书、描述文件挨个走一遍，每一步说清楚它在整条链路里管什么、做完应该看到什么。打包和分发的部分在另一篇里：[React Native iOS 打包发布全流程](https://feinterview.poetries.top/blog/rn-ios-distribute)。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- App ID、证书、描述文件、设备这四样东西各自管什么，谁依赖谁
- 为什么要先生成 CSR，它和钥匙串里那对公私钥是什么关系
- Explicit App ID 和 Wildcard App ID 的区别，什么时候一定不能用通配符
- 开发证书和发布证书的差别，团队里应该怎么共用
- 推送证书怎么申请、怎么导出 p12 传给友盟或极光后台
- Provisioning Profiles 里到底打包了哪些信息，为什么加了设备就必须重新生成
- 几个高频报错的定位思路

![iOS 证书与描述文件配置的整体流程示意](https://s.poetries.top/gitee/2019/10/693.png)

## 一、先把整套体系理顺

我们都知道开发一款应用需要配置苹果常用证书、`App ID`、`Provisioning Profiles`，如果有推送还需要配置推送证书等。这几个名词长得都差不多，先花两分钟把关系捋清楚，后面所有操作就都有的放矢了。

### 1.1 App ID

`App ID` 是每个应用的独立标识，在设置中可以配置该应用的权限，比如 `Push Notifications`、`Network Extensions` 等。

它对应的就是 Xcode 里的 `Bundle Identifier`，形如 `com.company.appname`。这个值一旦注册就改不了，命名之前想清楚。它除了当身份用，还负责声明这个 App 要开哪些能力，推送、`App Groups`、`Sign in with Apple` 都在这里勾。

### 1.2 开发者证书

- iOS 证书是用来证明 iOS App 内容（executable code）的合法性和完整性的数字证书。对于想安装到真机或发布到 AppStore 的应用程序（App），只有经过签名验证（Signature Validated）才能确保来源可信，并且保证 App 内容是完整、未经篡改的。
- 数字证书是一个经证书授权中心数字签名的包含公开密钥拥有者信息以及公开密钥的文件。具有时效性，只在特定的时间段内有效。
- 开发证书类型分为两种，一种开发证书（iOS Development）一种发布证书（iOS Distribution）。开发证书（iOS Development）用于开发和调试应用程序，可用于真机调试；生产证书用于打包上传 App Store，用于验证开发者身份。

补一句时效性说明：这两个名字在苹果后台已经改过了，现在列表里显示的是 `Apple Development` 和 `Apple Distribution`，含义没变，只是从「iOS 专属」扩成了跨平台通用。不同时期进后台看到的措辞可能对不上，认准 Development 和 Distribution 这两个词就行。

证书这东西的关键在于，**它和具体哪个 App 无关**。一张开发证书可以给团队里所有 App 用，它证明的是「签这个包的人是谁」，不是「这个包是哪个 App」。

### 1.3 推送证书

如果项目中集成了推送功能，同样需要配置推送证书。推送证书同样也分两种：开发（Apple Development iOS Push Services）、生产（Apple Production iOS Push Services）。推送证书在 App ID 中创建生成，同时生成的 p12 文件需要上传到服务端后台（友盟后台、极光后台或自己服务端后台）。

注意推送证书和签名证书是两条独立的线。签名证书管「谁签的包」，推送证书管「谁有资格往这个 App ID 推消息」，所以它必须绑定到具体的 App ID 上，而普通签名证书不用。这也是为什么通配符 App ID 开不了推送。

### 1.4 配置文件（Provisioning Profiles）

配置文件同样也分两种，分为开发（`Development`）和发布（`Distribution`），配置文件（`Provisioning Profiles`）中包含了证书、`App ID`、设备（Devices），后缀名为 `.mobileprovision`。它在开发者账号体系中扮演着配置和验证的角色，是真机调试和打包上架必须的文件。

- 一个 `Provisioning Profile` 对应一个 Explicit App ID 或 Wildcard App ID
- `Provisioning Profile` 决定 `Xcode` 用哪个证书（公钥）/ 私钥组合（Key Pair / Signing Identity）来签名应用程序（`Signing Product`），将在应用程序打包时嵌入到 `.ipa` 包里
- `Provisioning Profile` 把这些信息全部打包在一起，方便我们在调试和发布程序打包时使用。这样，只要在不同的情况下选择不同的 `Provisioning Profile` 文件就可以了
- `Provisioning Profile` 也分为 `Development` 和 `Distribution` 两类，有效期同 `Certificate` 一样。`Development` 版本的 `Provisioning Profile` 用于开发调试，`Distribution` 版本的 `Provisioning Profile` 主要用于提交 `App Store` 审核，其不指定开发测试的 `Devices`

先说结论，这四样里最容易出问题的永远是描述文件，因为只有它是个「组合体」。上游任何一项动了（换了证书、加了设备、改了 Bundle ID），它就作废了，得重新生成，而且**重新生成之后必须重新打包**，旧包不会自己变好。

ps：打 `Ad-hoc` 包的时候，如果遇到刚添加的设备 `UDID` 没添加进去，可以将开发模式的配置文件下载下来，打包后直接选中即可。

![Provisioning Profile 与证书、App ID、设备三者的关联关系](https://s.poetries.top/gitee/2019/10/694.png)

这张图把依赖关系画出来了，看懂它，后面出问题基本都能自己定位到是哪一环断了。

## 二、账号先选对再动手

在配置证书之前我们需要有一个开发账号。个人账号和公司账号类似，每年都需要支付 99 刀，其中公司账号需要邓白氏编码而个人账号并不需要。

如果项目需要不通过 App Store 进行安装，可以申请企业账号。当然了，也可以找一些第三方直接打企业包，比如蒲公英之类的。

这里补三句实操经验。第一，邓白氏编码（D-U-N-S Number）申请周期不短，公司账号要提前规划，别等到要上架了才去办。第二，企业账号（Apple Developer Enterprise Program）年费是 299 美元，而且苹果这些年对它的审核越来越严，明确规定只能给自己员工内部分发，拿来对外发应用是会被封的。第三，账号类型直接决定了你能用哪些分发方式，个人和公司账号只能走 App Store、TestFlight 和 Ad Hoc，企业账号才有 In-House。

选错账号类型，后面所有证书都得推倒重来。

## 三、创建 CSR 文件（证书请求文件）

CSR（`Certificate signing request`）即证书请求文件。证书申请者在申请数字证书时由 CSP（加密服务提供者）在生成私钥的同时也生成证书请求文件（CSR 文件），证书申请者只要把 CSR 文件提交给证书颁发机构后（在苹果后台创建 Certificate 时上传），证书颁发机构使用其根证书私钥签名生成证书公钥文件（开发者证书）。

这一步在做的事，说到底就是本机先造一对公私钥，私钥留在自己的钥匙串里绝不外传，把公钥连同身份信息打包成 CSR 交给苹果，苹果盖个章还给你，那就是证书。

**理解这一点很重要，因为它解释了一个高频困惑：为什么同事把证书发给我，我导入之后 Xcode 还是说找不到签名身份？** 因为他给你的是证书（公钥部分），私钥还在他电脑上。没有私钥就没法签名，正确做法是让他导出 `.p12`，那个文件里才同时包含证书和私钥。

关于 CSR 文件的创建，我们可以直接使用 Mac 上的钥匙串访问直接请求。

**具体步骤为：钥匙串访问 -> 钥匙串访问 -> 证书助理 -> 从证书颁发机构请求证书**

**1、打开电脑上的钥匙串访问，选中证书助理**

![在钥匙串访问的菜单中依次选择证书助理和从证书颁发机构请求证书](https://s.poetries.top/gitee/2019/10/695.png)

点开之后如果这个菜单项是灰的，多半是当前没有选中「登录」这个钥匙串，先在左侧点一下再试。

**2、用户电子邮件地址填开发者账号的邮箱，名称可以随意填，然后保存到磁盘上**

![在证书信息表单中填写邮箱与名称并选择存储到磁盘](https://s.poetries.top/gitee/2019/10/696.png)

这一屏有两个要点。一是必须勾「存储到磁盘」而不是「发送给 CA」，选错了不会生成文件。二是「CA 电子邮件地址」那一栏留空即可，苹果不需要它。保存完你会在桌面上拿到一个 `.certSigningRequest` 文件，这就是待会儿要上传的东西。

**3、Keychain 将生成一个包含开发者身份信息的 CSR（Certificate Signing Request）文件。同时，Keychain Access -> Keys（密钥）中增加一对 Public / Private Key Pair**

回钥匙串的「密钥」分类里确认一下，应该多出一对同名的公钥和私钥。这对钥匙千万别删，**删了之后所有用它签发的证书全部作废**。这个我踩过，重装系统没导出钥匙串，团队那张发布证书直接没法用了，只能吊销重来。稳妥的做法是配完之后立刻把私钥导出成 `.p12` 存一份到安全的地方。

## 四、创建 App ID

**1、登录苹果开发者中心，或者直接登录 Apple Member Center 选择 Certificates, Identifiers & Profiles**

![登录苹果开发者中心后进入 Certificates, Identifiers & Profiles 板块](https://s.poetries.top/gitee/2019/10/697.png)

进来第一件事是确认右上角的团队名对不对。同时挂在个人账号和公司账号下的人特别容易在这里选错，证书全建到另一个团队去了，Xcode 里怎么都匹配不上。

**2、选择 Identifiers 中的 App IDs，然后点上方的加号**

![在 Identifiers 列表页点击加号新建 App ID](https://s.poetries.top/gitee/2019/10/698.png)

点完加号会先让你选类型，选 `App IDs` 那一项。同一屏里还有 `Services IDs`、`Pass Type IDs` 之类，那是给网页登录、Wallet 卡券用的，别点错。

**3、添加 App ID Description 和 Bundle ID**

- 在「Explicit App ID」栏下的「Bundle ID」项中输入 App ID（反域名格式，如 `com.company.test`）
- 这里「Bundle ID」对应 Xcode 中的「Bundle identifier」。Explicit App ID 是唯一的 App ID，用于唯一标识一个应用程序。例如 `com.apple.garageband` 这个 App ID，用于标识 Bundle Identifier 为 `com.apple.garageband` 的 App
- Wildcard App ID：含有通配符的 App ID，用于标识一组应用程序。例如 `*`（实际上是 Application Identifier Prefix）表示所有应用程序；而 `com.apple.*` 可以表示 Bundle Identifier 以 `com.apple.` 开头（苹果公司）的所有应用程序
- 在「App Services」栏下选择应用要使用到的服务（如要使用推送功能，勾选「Push Notifications」）
- 点击 continue -> 点击 submit -> 点击 done，申请 App IDs 完成。点击 All IDs 可查看申请的 ID，点击该 ID
- 点击对应名称可对该 App ID 进行编辑

这里有个坑要注意，通配符看着省事，实际上**不支持推送、App Groups、Apple Pay 这些大部分 Capabilities**。图省事选了 Wildcard，等产品说要加推送的时候你就得重新建 App ID、重建所有描述文件、重新打包。除非你确定这个 App 永远只是个纯壳，否则一律用 Explicit。

另一个高频错误是 Bundle ID 和 Xcode 里对不上。RN 项目里这个值在 `ios/项目名.xcodeproj` 的 `PRODUCT_BUNDLE_IDENTIFIER` 里，注意 `Debug` 和 `Release` 是两份配置，改的时候两边都要改，大小写也算数。

## 五、创建开发者证书和推送证书

**1、选择 Certificates，然后选择上方的加号**

![在 Certificates 列表页点击加号新建证书](https://s.poetries.top/gitee/2019/10/699.png)

**2、选择相应的证书，因为开发调试证书、生产发布证书、开发环境推送证书、生产环境推送证书基本都类似，所以这里只选择开发调试证书为例**

类型列表里通常有这么几组：Development 组下是开发签名证书和开发推送证书，Production 组下是发布签名证书和生产推送证书。四种的申请流程一模一样，区别只在这一屏选哪一项，所以原文只演示一种是合理的，剩下三种照着走就行。

**3、一路点击 Continue，到 Generate 后选择一开始生成的 CSR 文件上传，然后再继续点击 Continue**

![在证书生成页上传第三节保存到磁盘的 CSR 文件](https://s.poetries.top/gitee/2019/10/701.png)

上传的就是第三节那个 `.certSigningRequest` 文件。如果这里报「Invalid Certificate Signing Request」，九成是文件传错了（比如传成了 `.cer`），或者这个 CSR 已经被用过一次又拿来复用了，重新生成一个即可。

**4、生成完开发调试、生产调试证书和开发环境推送证书、生产环境推送证书，可以在「Certificates」->「All」中查看该证书，并进行下载或删除**

**5、下载到桌面上，然后双击添加到钥匙串中，可在 Keychain Access -> 「证书」中查看**

双击导入之后，一定要在钥匙串的「我的证书」分类里检查一下：这条证书前面应该有个可以展开的小三角，展开后挂着一把私钥。**只有证书没有私钥的话，Xcode 打包时就会报找不到匹配的签名身份**，原因就是第三节说的那个，私钥不在这台机器上。

使用友盟，生成的推送证书（开发环境和生产环境）需要从钥匙串访问中导出 p12 文件，添加到友盟后台。

这里再补一条团队协作的经验：**发布证书全团队只需要一张**。苹果对发布证书的数量是有上限的，人人各建一张很快就会顶格。正确做法是一个人建，导出 `.p12` 加密码发给需要打包的人，别人导入即可。

## 六、推送证书导出 p12

导出 p12 文件上传到友盟（极光）后台。

**1、由上一步创建了开发环境的推送证书和生产环境的推送证书，下载到电脑上后，直接双击即可安装到钥匙串中**

![双击下载的推送证书将其安装到钥匙串中](https://s.poetries.top/gitee/2019/10/702.png)

安装成功的标志是在钥匙串「我的证书」里能看到一条 `Apple Development IOS Push Services: 你的 Bundle ID` 这样的条目，名字里带着 Push 和包名。看不到就先确认是不是导入到了「系统」钥匙串而不是「登录」钥匙串。

**2、选中相应证书（开发环境推送证书或生产环境推送证书）右键导出**

![在钥匙串中右键推送证书选择导出为 p12 文件](https://s.poetries.top/gitee/2019/10/703.png)

导出的时候有个细节：如果你选中的是证书本身，导出的 p12 会带上它下面挂的私钥；如果只选中私钥，导出的就只有私钥。推送服务需要的是**证书加私钥**，所以要选中带小三角那一整条再导出。

**3、点击存储后需要输入密码，密码要记住，上传到友盟（极光）后台时，需要用到**

![导出 p12 时设置保护密码的对话框](https://s.poetries.top/gitee/2019/10/704.png)

这个密码没有找回渠道，忘了只能重新导出一次。填完之后系统还会再要一次你的电脑登录密码用于授权，两个密码别搞混了。

顺便说一句现在的做法：APNs 除了这套 p12 证书方案，苹果还提供了基于 `.p8` 的 Token 认证方式，一个 Key 可以给账号下所有 App 用，而且不会过期，省掉了每年换证书的麻烦。友盟、极光这些第三方推送服务后来也都支持 p8 了。老项目继续用 p12 没问题，新接推送建议直接上 p8。

## 七、创建配置文件（Provisioning Profiles）

前面几样都齐了，最后一步是把它们绑在一起。

**1、选中 Provisioning Profiles 然后选中上方的加号**

![在 Profiles 列表页点击加号新建配置文件](https://s.poetries.top/gitee/2019/10/705.png)

**2、配置文件也分为开发和发布，我们这里以 Ad Hoc 为例，因为我们打测试包的时候，如果有些设备的 UDID 未添加进配置文件中，我们需要下载配置文件手动选择。而其他的配置文件目前的 Xcode 会自动请求，所以一般不需要我们自己手动创建**

![在配置文件类型选择页的 Distribution 分组下选择 Ad Hoc](https://s.poetries.top/gitee/2019/10/706.png)

这段取舍值得展开说一下。Xcode 勾上 `Automatically manage signing` 之后，开发用的那份描述文件它会自己建自己更新，确实不用管。但 Ad Hoc 这份不一样，它带设备列表，而设备是你在后台手动加的，Xcode 不一定知道你刚加了人，所以手动建一份、需要时手动选，反而更可控。

要选的类型在 Distribution 分组下。同一组里还有 `App Store`，两者的差别是：Ad Hoc 带设备列表，导出的 ipa 能直接装在注册过的机器上；App Store 不带设备列表，但只能走苹果的分发渠道，拿不到能直接装的包。

**3、选择刚创建的 App ID，选择相应证书、选择测试的设备，然后创建名称一直点击 Continue 即可，最后下载下来**

![为配置文件选择 App ID 与对应的签名证书](https://s.poetries.top/gitee/2019/10/707.png)

选 App ID 这一屏如果下拉里找不到你要的，回第四节确认 App ID 建成功了没有、是不是建到了别的团队。选证书那一屏建议把团队里所有可用的发布证书都勾上，这样谁签的包都能被这份描述文件覆盖，省得每个人各建一份。

![为配置文件勾选允许安装的测试设备并填写名称](https://s.poetries.top/gitee/2019/10/708.png)

选设备这一屏是最关键的，**没勾进来的机器，包装上去会直接装不上或者秒退**。最后给描述文件起名字的时候带上环境标识，比如 `MyApp_AdHoc`，因为 Xcode 里很快就会同时存在好几份，名字乱了非常容易选错。点 Generate 生成，Download 下载，双击 `.mobileprovision` 文件由 Xcode 自动导入。

到此为止证书和配置文件之类的都创建完了。接下来就是在 Xcode 里选中它们打包，那部分流程在 [React Native iOS 打包发布全流程](https://feinterview.poetries.top/blog/rn-ios-distribute) 里，如果你想看用 Xcode 自动签名走完整条上架路径，可以对照 [RN 构建 iOS 包发布到 AppStore 全流程](https://feinterview.poetries.top/blog/ios-build) 那篇。

## 八、几个高频报错的定位思路

配完之后真正花时间的往往是排错，把最常见的几种列在这，按现象倒推是哪一环断了。

**Xcode 报 `No signing certificate found`**：证书没导入，或者导入了但没私钥。去钥匙串「我的证书」看那条证书能不能展开出私钥，展不开就找建证书的同事要 `.p12`。

**Xcode 报 `No profiles for 'com.xxx.app' were found`**：Bundle ID 和 App ID 对不上，或者描述文件建到了别的团队。先核对 Xcode 里 `PRODUCT_BUNDLE_IDENTIFIER` 和后台 App ID 是否一字不差，再确认 Team 选对了。

**包能打出来但装不上测试机**：设备 UDID 不在描述文件的设备列表里。这是最常见的一种，解法在下面单独说。

**推送在开发环境能收到、上线之后收不到**：p12 传错了，把开发环境的推送证书传到了生产环境。这两张证书长得很像，导出时注意看名字里是 Development 还是 Production。

**证书还在有效期内却突然失效**：多半是被别人在后台 Revoke 了。团队里 Revoke 证书之前一定要吼一声，这一下会让所有依赖它的描述文件同时作废。

## 总结

整条链路走下来，值得记住的是这几条，都是我实际被绊过的地方。

导出 p12 证书的时候需要密码，上传到友盟（极光）后台需要输入密码。这个密码没有找回入口，记在密码管理器里。

开发和生产的推送证书创建成功后，到相应 App ID 下查看是否有，如果没有可以停段时间刷新下，或下载下来手动上传上去。苹果后台的状态同步偶尔会有延迟，别急着重建。

新添加上的测试机的 UDID，打包的时候没打包上去，需要重新创建配置文件，下载后将本地的删除，然后双击。不过刚添加 UDID、重新创建配置文件后，我一般在打包的时候手动选择配置文件。**这条是被坑最多的一条**，因为设备列表是写进描述文件、描述文件又被打进 ipa 里的，加了设备之后不重新生成描述文件、不重新打包，旧包永远装不上，让测试同学重装十次也没用。

再往回看一层，整套体系其实就一句话：App ID 定身份，证书证来源，描述文件把「身份 + 来源 + 设备」绑成一张许可证塞进包里。所以只要这三样里有一个变了，描述文件就得重做，包就得重打。绝大多数「明明配好了却用不了」的问题，根子都在这条链上某一环没同步。

## 参考

- Apple 开发者文档：Certificates, Identifiers & Profiles <https://developer.apple.com/help/account/>
- Apple 开发者文档：Create a certificate signing request <https://developer.apple.com/help/account/certificates/create-a-certificate-signing-request>
- Apple 开发者文档：Establishing a certificate-based connection to APNs <https://developer.apple.com/documentation/usernotifications/establishing-a-certificate-based-connection-to-apns>
- Apple Developer Enterprise Program <https://developer.apple.com/programs/enterprise/>
- React Native 官方文档：Publishing to Apple App Store <https://reactnative.dev/docs/publishing-to-app-store>
- [前端进阶之旅](https://interview.poetries.top)
