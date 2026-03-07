---
title: React Native打包前凑之iOS证书配置
date: 2019-10-03 19:10:12
tags: 
 - RN
 - IOS证书
categories: Front-End
---

> iOS证书配置

![](https://poetries1.gitee.io/img-repo/2019/10/693.png)

## 一、Overview

> 我们都知道开发一款应用需要配置苹果常用证书、`AppId`,`Provisioning Profiles`，如果有推送还需要配置推送证书等

## 二、App ID

> `App ID` 是每个应用的独立标识，在设置中可以配置该应用的权限，比如：`Push Notifications`、`Network Extensions`等。

## 三、开发者证书

- iOS证书是用来证明iOS App内容（executable code）的合法性和完整性的数字证书。对于想安装到真机或发布到AppStore的应用程序（App），只有经过签名验证（Signature Validated）才能确保来源可信，并且保证App内容是完整、未经篡改的。
- 数字证书是一个经证书授权中心数字签名的包含公开密钥拥有者信息以及公开密钥的文件。具有时效性，只在特定的时间段内有效。
- 开发证书类型分为两种，一种开发证书（iOS Development）一种发布证书(iOS Distribution)。开发证书（iOS Development）用于开发和调试应用程序，可用于真机调试；生产证书用于打包上传App Store，用于验证开发者身份

## 四、推送证书

> 如果项目中集成了推送功能，同样需要配置推送证书。推送证书同样也分两种：开发（Apple Development iOS Push Services）、生产（Apple Production iOS Push Services）。推送证书在AppID中创建生成，同时生成的的p12文件需要上传到服务端后台（友盟后台、极光后台或自己服务端后台）

## 五、配置文件（Provisioning Profiles）

> 配置文件同样也分两种，分为开发（`Development`）和发布（`Distribution`），配置文件（`Provisioning Profiles`）中包含了证书、`App ID`、设备（Devices），后缀名为`.mobileprovision`。它在开发者账号体系中扮演着配置和验证的角色，是真机调试和打包上架必须的文件

- 一个`Provisioning Profile`对应一个Explicit App ID或Wildcard App ID
- `Provisioning Profile`决定`Xcode`用哪个证书（公钥）/私钥组合（Key Pair/Signing Identity）来签名应用程序（`Signing Product`）,将在应用程序打包时嵌入到`.ipa`包里
- `Provisioning Profile` 把这些信息全部打包在一起，方便我们在调试和发布程序打包时使用。这样，只要在不同的情况下选择不同的`Provisioning Profile`文件就可以了
- `Provisioning Profile`也分为`Development`和`Distribution`两类，有效期同`Certificate`一样。`Development`版本的`ProvisioningProfile`用于开发调试，`Distribution`版本的`ProvisioningProfile`主要用于提交`App Store`审核，其不指定开发测试的`Devices`

> ps:打`Ad-hoc`包的时候，如果遇到刚添加的设备`UDID`没添加进去，可以将开发模式的配置文件下载下来，打包后直接选中即可

![](https://poetries1.gitee.io/img-repo/2019/10/694.png)

在配置证书之前我们需要有一个开发账号。个人账号和公司账号类似，每年都需要支付99刀，其中公司账号需要邓白氏编码而个人账号并不需要。

如果项目需要不通过App Store进行安装，可以申请企业账号。当然了，也可以找一些第三方直接打企业包，比如蒲公英之类的

## 六、创建CSR文件（证书请求文件）

> CSR（`Certificate signing request`）即证书请求文件。证书申请者在申请数字证书时由CSP(加密服务提供者)在生成私钥的同时也生成证书请求文件（CSR文件），证书申请者只要把CSR文件提交给证书颁发机构后（创建App ID时上传到苹果后台），证书颁发机构使用其根证书私钥签名生成证书公钥文件（开发者证书）

- 关于CSR文件的创建，我们可以直接使用Mac上的钥匙串访问直接请求。

**具体步骤为： 钥匙串访问 -> 钥匙串访问 -> 证书助理 -> 从证书颁发机构请求证书**

**1、打开电脑上的钥匙串访问，选中证书助理；**

![](https://poetries1.gitee.io/img-repo/2019/10/695.png)

**2、用户电子邮件地址填开发者账号的邮箱，名称可以随意填，然后保存到磁盘上。**

![](https://poetries1.gitee.io/img-repo/2019/10/696.png)

**3、Keychain将生成一个包含开发者身份信息的CSR（Certificate Signing Request）文件。同时，Keychain Access->Keys（密钥）中增加一对Public/Private Key Pair**

### 创建App ID

**1、登录苹果开发者中心,或者直接登录Apple Member Center选择Certificates,Identifiers & Profiles**

![](https://poetries1.gitee.io/img-repo/2019/10/697.png)

**2、选择Identifiers 中的 App IDs，然后点上方的加号；**

![](https://poetries1.gitee.io/img-repo/2019/10/698.png)

**3、添加App ID Description和Bundle ID**

- 在“Explicit App ID”栏下的“Bundle ID”项中输入App ID（反域名格式，如：com.company.test）
- 这里“Bundle ID”对应Xcode中的“Bundle identifier” Explicit App ID：唯一的App ID，用于唯一标识一个应用程序。例如“com.apple.garageband”这个App ID，用于标识Bundle Identifier为“com.apple.garageband”的App
- Wildcard App ID：含有通配符的App ID，用于标识一组应用程序。例如“”（实际上是Application Identifier Prefix）表示所有应用程序；而“com.apple.”可以表示Bundle Identifier以“com.apple.”开头（苹果公司）的所有应用程序。
- 在“App Services”栏下选择应用要使用到的服务（如要使用推送功能，勾选“Push Notifications”）
- 点击continue->点击submit->点击done，申请App IDs完成。点击All IDs可查看申请的ID，点击该ID
- 点击 对应名称 可对该App ID进行编辑

## 七、创建开发者证书 和 推送证书

**1、选择Certificates,然后选择上方的加号；**

![](https://poetries1.gitee.io/img-repo/2019/10/699.png)

**2、选择相应的证书，因为开发调试证书、生产发布证书、开发环境推送证书、生产环境推送证书基本都类似，所以这里只选择开发调试证书为例。**

![](https://poetries1.gitee.io/img-repo/2019/10/699.jpg)

**3、一路点击Continue, 到Generate后选择一开始生成的CSR文件上传，然后再继续点击Continue**

![](https://poetries1.gitee.io/img-repo/2019/10/701.png)

**4、生成完开发调试、生成调试证书 和 开发环境推送证书、生成环境推送证书，可以在“Certificates”->“All”中查看该证书，并进行下载或删除**


**5、下载到桌面上，然后双击添加到钥匙串中，可在Keychain Access->“证书”中查看**

> 使用友盟，生成的推送证书（开发环境和生产环境）需要从钥匙串访问中导出p12文件，添加到友盟后台

## 八、推送证书 

> 导出p12文件上传到友盟（极光）后台

**1、由上一步创建了开发环境的推送证书和生成环境的推送证书，下载到电脑上后，直接双击即可安装到钥匙串中。**

![](https://poetries1.gitee.io/img-repo/2019/10/702.png)

**2、选中相应证书（开发环境推送证书或生成环境推送证书）右键 导出；**

![](https://poetries1.gitee.io/img-repo/2019/10/703.png)

**3、点击存储后需要输入密码，密码要记住，上传到友盟（极光）后台时，需要用到**

![](https://poetries1.gitee.io/img-repo/2019/10/704.png)

### 创建配置文件（Provisioning Profiles）

**1、选中Provisioning Profiles 然后选中上方的加号。**

![](https://poetries1.gitee.io/img-repo/2019/10/705.png)

**2、配置文件也分为开发和发布，我们这里以Ad Hoc为例，因为我们打测试包的时候，如果有些设备的UDID未添加进配置文件中，我们需要下载配置文件手动选择。而其他的的配置文件目前的Xcode会自动请求，所以一般不需要我们自己手动创建**

![](https://poetries1.gitee.io/img-repo/2019/10/706.png)

**3、选择刚创建的App ID,选择相应证书、选择测试的设备，然后创建名称一直点击Continue即可，最后下载下来**

![](https://poetries1.gitee.io/img-repo/2019/10/707.png)
![](https://poetries1.gitee.io/img-repo/2019/10/708.png)

到此为止证书和配置文件之类的都创建完了~~

## 九、总结：

- 导出p12证书的时候需要密码，上传到友盟（极光）后台需要输入密码。
- 开发和生成的推送证书创建成功后，到相应App ID 下查看是否有，如果没有可以停段时间刷新下，或下载下来手动上传上去。
- 新添加上的测试机的UDID，打包的时候没打包上去，需要重新创建配置文件，下载后将本地的删除，然后双击。不过刚添加UDID，重新创建配置文件后，我一般在打包的时候手动选择配置文件。