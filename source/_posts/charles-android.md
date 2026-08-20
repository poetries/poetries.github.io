---
title: Charles 抓安卓 7 以上 HTTPS 接口全流程 模拟器写入系统证书实战
description: 安卓 7 起 App 默认不再信任用户安装的 CA，Charles 装了证书也抓不到明文。这篇用 Google APIs 模拟器 + writable-system 启动 + adb root + subject_hash_old 计算证书文件名 + push 到 /system/etc/security/cacerts 的完整路径，一步一图讲清安卓 HTTPS 抓包。
date: 2023-09-24 10:09:43
tags:
  - 调试
  - Charles
  - Android
  - 抓包
  - HTTPS
categories: Tools
---

联调的时候最难受的场景是这样的：`App` 里某个接口返回不对，后端说参数没收到，客户端说我明明传了，两边谁也拿不出证据。这时候只要能把真实报文抓出来，争论一秒钟结束。`Charles` 抓 `HTTP` 谁都会，但换成安卓 7 以上的 `HTTPS`，很多人会卡住：证书按教程装了，手机设置里也能看到，`Charles` 里那条请求却始终是 `Unknown`，或者干脆报 `SSL handshake failed`。

这篇把我在安卓模拟器上跑通的这条路完整记一遍。核心思路是绕开「用户证书不被信任」这个限制，直接把 `Charles` 的根证书写进模拟器的**系统证书目录**。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 安卓 7 到底改了什么，为什么以前的抓包姿势突然就失效了
- 为什么模拟器镜像必须选 `Google APIs` 那一档，选错了 `adb root` 直接报错
- `-writable-system` 这个启动参数解决的是什么问题
- 怎么用 `openssl` 的 `subject_hash_old` 算出安卓认的那个证书文件名
- `adb push` 到 `/system/etc/security/cacerts` 之后为什么一定要重启
- 代理配好了还是抓不到包时，按什么顺序排查

## 一、先搞清楚安卓 7 到底改了什么

`HTTPS` 抓包的原理不复杂，`Charles` 做的是一次中间人：它用自己的根证书重新签发目标站点的证书，客户端只要信任这张根证书，加密流量就能被解开看到明文。所以整件事的关键只有一句话，**客户端信不信任 Charles 的根证书**。

安卓 7.0（`API 24`）之前，你在系统设置里手动装一张 CA 证书，它会进「用户证书库」，而当时的默认策略是用户证书库和系统证书库一视同仁，`App` 里的网络请求都认。那时候抓包简单得像喝水。

从安卓 7.0 开始，Google 引入了 `Network Security Config`，并且把默认策略改了：**只要 App 的 `targetSdkVersion >= 24`，它默认只信任系统证书库，用户自己装的 CA 一律不认**。这条改动的动机是防中间人攻击，站在安全角度完全合理，站在调试角度就是当头一棒。

所以从那之后想抓安卓 `HTTPS` 明文，只剩两条路：

- **改 App**。在 `res/xml` 下写一份 `network_security_config.xml`，在 `debug-overrides` 里把 `user` 证书库加回来。这条路最干净，但前提是**你手里有 App 源码并且能重新打包**。抓第三方 `App` 就免谈了。
- **改系统**。想办法把 `Charles` 的根证书直接塞进系统证书库 `/system/etc/security/cacerts`。这条路不挑 `App`，但需要 `root` 权限和一个可写的 `/system` 分区。

真机上走第二条路要刷 `Magisk`，折腾成本高还有变砖风险。而**安卓模拟器天生就带一个可 root 的调试环境**，这才是这篇选模拟器的原因。

顺着上面聊，`iOS` 那边的逻辑其实是一样的，也是「装证书」和「信任证书」两件事，只是入口藏在设置里。我另外写过一篇 [Charles 抓 iOS 真机 HTTPS 全流程](https://feinterview.poetries.top/blog/charles-ios-real-device-https-capture)，两边对照着看会清楚很多。

## 二、创建模拟器时一定要选 Google APIs 的镜像

先说结论，镜像选错这一步，后面全白搭。

在 `Android Studio` 的 `Device Manager` 里新建 AVD，走到选系统镜像那一屏时，注意看每个版本后面跟着的 `Target` 那一列，它有三种值：`Android x.x`（AOSP 纯净镜像）、`Google APIs`、`Google Play`。要选的是中间那个 `Google APIs`。

![在 Android Studio 中新建模拟器时选择系统镜像，Target 一列需要选中带 Google APIs 的那一档](https://s.poetries.top/uploads/2023/09/167b68ff97543b8f.png)

> 这里我们使用安卓`9.0 Google APIs`的模拟器（装最新版本也可以），记得要装`Google APIs`的，否则执行`adb root`获取`root`权限会报错`adbd cannot run as root in production builds`

这个报错的来源是镜像的构建类型。带 `Google Play` 标记的镜像是按 `user` 构建（生产构建）打的，`adbd` 里根本没有提权分支，所以 `adb root` 会直接告诉你「生产构建下 adbd 不能以 root 运行」。`Google APIs` 这一档是 `userdebug` 构建，`adbd` 保留了提权能力，这才是我们要的。

选完镜像继续走完向导，起个好记的名字，比如下面命令里会用到的 `Pixel_XL_API_28`。到这一步模拟器只是建好了，**先别用图形界面的那个绿色三角去启动它**，原因在下一节。

## 三、用命令行启动模拟器，加上 -writable-system

为什么不能点绿色三角？因为图形界面启动的模拟器，`/system` 分区是以只读方式挂载的，后面 `adb push` 证书那一步会直接失败。要让 `/system` 可写，必须在启动时带上 `-writable-system` 参数，而这个参数只能从命令行传。

先看一眼本机都有哪些模拟器，拿到准确的 AVD 名字：

```bash
emulator -list-avds
```

`emulator` 这个可执行文件在 `$ANDROID_HOME/emulator/` 下，如果提示命令找不到，把它加进 `PATH` 或者直接用绝对路径调用。

![终端执行 emulator -list-avds 后列出本机已创建的模拟器名称](https://s.poetries.top/uploads/2023/09/8a76711c15bfcf3e.png)

输出就是一行行的 AVD 名字，注意它和你在界面上看到的显示名不完全一样，空格会被换成下划线，以命令行输出的这个为准。拿到名字之后这样启动：

```bash
# 需要以这样的方式启动安卓模拟器才可转到包
emulator -avd Pixel_XL_API_28 -writable-system
```

启动会比平时慢一些，而且这个终端窗口不能关，关了模拟器就跟着退出了。想让它跑到后台可以在命令末尾加 `&`。

这里有个坑要注意：**只要你用图形界面重启过一次模拟器，`-writable-system` 就失效了**，得回到命令行重新启动。我一开始就是在这栽的，改完证书发现没生效，排查半天才想起中途手贱点过界面上的重启按钮。

## 四、拿到 root 权限并让 /system 可写

模拟器起来之后，执行这两条：

```bash
adb root
adb remount
```

这两条各干各的事，别混为一谈。`adb root` 是让 `adbd` 这个守护进程以 `root` 身份重启，执行完之后你后续所有 `adb shell` 命令都是 `root` 身份。`adb remount` 是把 `/system` 从只读重新挂载成读写，它依赖前一步的 `root` 身份，也依赖启动时那个 `-writable-system`。

命令执行完之后，模拟器会重新启动。如果启动成功，那么手机的`root`权限已开启。

判断有没有成功很简单，`adb remount` 成功会打印 `remount succeeded`；失败一般是两种情况，要么提示 `adbd cannot run as root in production builds`（镜像选错了，回第二节），要么提示 `Not running as root` 或者 `remount failed`（`-writable-system` 没带，回第三节）。

补一句我没完全跑通的部分：安卓 10 及以上的镜像因为引入了 `dm-verity` 校验和动态分区，光靠 `adb remount` 经常还是写不进去，社区的做法是先 `adb shell avbctl disable-verification` 再 `adb reboot` 然后重新 `adb root && adb remount`。这套我只在少数几个镜像上试过，不同 `emulator` 版本表现不太一样。**这篇里所有步骤是在 API 28 上完整验证的**，版本越低这条路越顺。

## 五、从 Charles 导出根证书

系统这边准备好了，回到 `Charles` 拿证书。菜单走 `Help → SSL Proxying → Save Charles Root Certificate`，在保存对话框里把格式选成 **PEM**（`.pem`），存到一个待会好找的目录，比如桌面。

![Charles 的 Help - SSL Proxying 菜单中导出根证书，保存格式选择 PEM](https://s.poetries.top/uploads/2023/09/8068bd69e487f012.png)

格式这里别随手点默认。`Charles` 支持导出 `.pem`、`.cer`、`.p12` 几种，后面 `openssl` 计算 hash 和安卓系统证书库要求的都是 **PEM 编码的 X.509 证书**，选错格式下一步 `openssl` 会直接报解析错误。导出后的默认文件名一般是 `charles-ssl-proxying-certificate.pem`，下文的命令都按这个名字写。

顺手说一句，`Charles` 的根证书是**每台机器独立生成**的，你同事的证书对你的模拟器没用，换电脑之后也要重新导出重新装。

## 六、按安卓的规则给证书算文件名

安卓的系统证书库 `/system/etc/security/cacerts` 不是随便丢文件进去就行的，它要求文件名是**证书 subject 的哈希值加上一个序号后缀**，形如 `dfaf1.0`。系统查证书的时候直接按这个名字定位，名字不对等于没装。

这个哈希用 `openssl` 算：

```bash
openssl x509 -subject_hash_old -in charles-ssl-proxying-certificate.pem
```

![终端执行 openssl x509 -subject_hash_old 后输出的证书 hash 值](https://s.poetries.top/uploads/2023/09/051c22061247f384.png)

输出的第一行就是那串 8 位十六进制的哈希，比如 `dfaf1`，下面跟着的是证书的文本内容，不用管。

为什么参数是 `-subject_hash_old` 而不是 `-subject_hash`？因为安卓用的是 `OpenSSL 0.9.8` 时代的旧哈希算法，`OpenSSL 1.0` 之后换了新算法，两者算出来的值完全不同。这里用新算法算出来的哈希去命名，文件放进去系统也认不出来。**这是这一步唯一一个容易搞错的地方**，参数末尾那个 `_old` 不能省。

后缀 `.0` 是序号，用来区分哈希碰撞的不同证书。一般情况下 `.0` 就够了，只有当目录里已经存在同名 `.0` 文件时才需要往后排 `.1`。

## 七、把证书 push 进系统信任库并重启

哈希拿到了，把证书推进去：

```bash
adb push charles-ssl-proxying-certificate.pem /system/etc/security/cacerts/xxx.0
```

- 这里的`xxx.0`是上面的`hash值` 例如`dfaf1.0`
- 安装完成后，进入`adb shell`，执行`reboot`重启模拟器，**切记**：`一定要重启模拟器证书才会生效`

推完最好顺手把权限改对，系统证书库里的文件权限一般是 `644`，权限不对有些镜像会跳过读取：

```bash
adb shell chmod 644 /system/etc/security/cacerts/dfaf1.0
adb shell reboot
```

那为什么非得重启不可呢？因为安卓的系统 CA 列表是在系统启动阶段加载进内存的，你往目录里丢文件不会触发重新加载。不重启的话，文件明明在那，`App` 发起握手时用的还是旧的信任列表，表现出来就是「证书装了但没用」。这个坑我踩过，`push` 完直接抓包发现还是失败，以为哈希算错了，回头重算了三遍。

重启完成后，去模拟器的 `设置 → 安全 → 加密与凭据 → 信任的凭据`，切到 `系统` 这一栏往下翻，能找到 `Charles Proxy CA` 才算真的成功。

![模拟器设置中信任的凭据系统标签页里出现 Charles 证书，说明证书已写入系统证书库](https://s.poetries.top/uploads/2023/09/38cdb96a1af15879.png)

看到`charles`证书安装到系统目录才算成功。

注意看它出现在哪一栏。如果 `Charles Proxy CA` 出现在 `用户` 那一栏而不是 `系统` 栏，说明你实际走的还是「设置里手动装用户证书」那条路，对 `targetSdkVersion >= 24` 的 `App` 依然无效，得回到第七节重来。

## 八、把模拟器的流量指向 Charles

证书信任解决了，剩下的就是让流量绕道到 `Charles`。模拟器里有两种配法。

一种是在系统设置里改：长按 Wi-Fi 名称 `AndroidWifi` 选修改网络，展开高级选项，把代理改成「手动」，主机名填 `10.0.2.2`，端口填 `8888`。这里的 `10.0.2.2` 是安卓模拟器约定的特殊地址，它在模拟器内部指向**宿主机的 127.0.0.1**，所以不用去查你电脑的局域网 IP。端口要和 `Charles` 里 `Proxy → Proxy Settings` 中 `HTTP Proxy` 的监听端口一致，默认就是 `8888`。

![在模拟器的 Wi-Fi 高级设置中把代理改为手动，填入主机名与端口指向宿主机的 Charles](https://s.poetries.top/uploads/2023/09/4ccabc1ea3295b2d.png)

另一种更省事，启动模拟器时直接把代理带上：

```bash
emulator -avd Pixel_XL_API_28 -writable-system -http-proxy http://127.0.0.1:8888
```

保存之后 `Charles` 通常会弹一个 `Allow / Deny` 询问是否放行这台设备，点 `Allow`。这一步做完，模拟器发出的全部 `HTTP/HTTPS` 流量都会先经过 `Charles`。

## 九、验证抓包

拿模拟器里的浏览器或者你要调的 `App` 随便发一个 `HTTPS` 请求，回到 `Charles` 左侧列表，展开对应域名，右侧 `Contents` 面板里请求行、`Header`、`Body`、响应 `JSON` 全是明文，这就是成功的样子。

![Charles 中成功抓到模拟器发出的 HTTPS 请求，右侧 Contents 面板显示解密后的明文报文](https://s.poetries.top/uploads/2023/09/ba150e9d39dcef21.png)

如果这里显示的是 `Unknown` 或者一堆二进制，多半不是证书的问题，而是 `SSL Proxying` 白名单没配。`Charles` 出于性能考虑默认不解密所有 `HTTPS`，你得告诉它解哪些域名：菜单 `Proxy → SSL Proxying Settings`，勾上 `Enable SSL Proxying`，在 `Include` 里 `Add` 一条，`Host` 填 `*`、`Port` 填 `443` 先全解，调完再收窄。更快的做法是在左侧那条请求上右键选 `Enable SSL Proxying`，`Charles` 会自动把域名加进白名单。

## 十、抓不到包时的排查清单

把上面每一步可能翻车的点拉成一张表，出问题的时候从上往下过一遍：

| 现象 | 最可能的原因 | 处理 |
|---|---|---|
| `adb root` 报 `adbd cannot run as root in production builds` | 镜像选成了 `Google Play` 那一档 | 重建 AVD，选 `Google APIs` |
| `adb remount` 提示 `remount failed` | 启动时没带 `-writable-system`，或中途用界面重启过 | 关掉模拟器，回命令行重新启动 |
| `adb push` 提示 `Read-only file system` | 同上，`/system` 还是只读 | 先 `adb root` 再 `adb remount` |
| `openssl` 报无法解析证书 | 导出时格式选成了 `.cer` 或 `.p12` | 重新导出，选 `PEM` |
| 证书出现在「用户」栏而不是「系统」栏 | 走的是设置里手动安装那条路 | 按第七节 `push` 到 `cacerts` |
| 证书推进去了但抓不到明文 | 没重启模拟器 | `adb shell reboot` |
| `Charles` 里一条请求都没有 | 代理没配或端口不一致 | 核对 `10.0.2.2:8888` 与 `Proxy Settings` |
| 请求显示 `Unknown` 或密文 | `SSL Proxying` 白名单没配 | 右键请求选 `Enable SSL Proxying` |
| 某个 App 单独抓不到 | 该 App 做了证书绑定（`SSL Pinning`） | 系统证书库这条路对它无效，只能改包或用 hook 框架 |

最后一行单独说一句。有些 `App` 会在代码里写死只信任某张指定证书的指纹，这就是 `SSL Pinning`，它对系统证书库的改动免疫。碰上这种，把证书装进系统也没用，得从 `App` 侧下手，那是另一个话题了。

## 总结

安卓 7 之后抓 `HTTPS` 变难，难点不在 `Charles` 怎么用，而在「用户证书不再被默认信任」这一条系统策略。整条链路真正卡人的是三个环节：

镜像必须是 `Google APIs` 这一档，`adbd` 才有提权能力；模拟器必须用命令行加 `-writable-system` 启动，`/system` 才能挂成读写；证书文件名必须用 `subject_hash_old` 算，而且 `push` 完必须重启，系统才会重新加载信任列表。

这三条任何一条断了，表现出来都是同一个症状「装了证书还是抓不到」，所以排查的时候别盯着 `Charles` 的配置反复改，先回头确认这三步是不是真的做到位了。

最后提醒一句安全底线，把根证书装进系统信任库，等于放弃了这台设备上所有 `HTTPS` 流量的加密保护。这套操作只在自己的调试模拟器上做，别在装有真实账号的设备上留着。

## 参考

- Android 开发者文档：网络安全配置 <https://developer.android.com/privacy-and-security/security-config>
- Android 开发者文档：Changes to Trusted Certificate Authorities in Android Nougat <https://android-developers.googleblog.com/2016/07/changes-to-trusted-certificate.html>
- Charles 官方文档：SSL Proxying <https://www.charlesproxy.com/documentation/proxying/ssl-proxying/>
- Android Emulator 命令行参数 <https://developer.android.com/studio/run/emulator-commandline>
- [前端进阶之旅](https://interview.poetries.top)
