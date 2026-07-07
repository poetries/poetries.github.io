---
title: Charles 抓包 iOS 真机 HTTPS 全流程实战从代理到证书信任一次讲透
description: 一份 Charles + iOS 真机 HTTPS 抓包的完整踩坑实录。从关闭 VPN、Charles 代理端口配置、Help 里的安装移动端证书入口，到 iPhone 设置 Wi-Fi 代理、chls.pro/ssl 下载证书、安装描述文件、关于本机开启证书信任设置，一步一图讲清每个环节，并附常见连不上、证书灰、看不到明文的排查清单。
date: 2026-07-07 21:55:12
tags:
  - Charles
  - iOS
  - 抓包
  - HTTPS
  - 网络调试
  - 调试技巧
categories: Front-End
---

做移动端开发或者接口联调，迟早会遇到这么一类问题：`App` 里某个请求返回不对，后端说「我这边没问题」，前端说「我参数传对了」，两边互相甩锅。这时候最有力的证据就是**把真机上那条请求的完整报文（`URL`、`Header`、`Body`、`Response`）原原本本抓出来**。`Charles` 就是干这个的老牌工具，但真正卡住大多数人的从来不是抓 `HTTP`，而是 **iOS 真机 + HTTPS 明文** 这一段——代理连不上、证书装了却是灰的、抓下来全是乱码。

我最近在 `Mac` 上用 `Charles 5.1` 抓一台 iPhone 真机的 `HTTPS` 流量（演示里抓的是 `chatgpt.com` 的 `backend-api`），把整条链路从头到尾又踩了一遍，顺手把每一步都截了图。这篇文章就以这套截图为线索，把 **Charles 端配置 + iPhone 端配置 + 证书信任** 三段拆开讲清楚，让你照着做一次就能通，而不是对着一堆「装了证书还是抓不到」的帖子干瞪眼。

在本篇文章中，我们将从浅入深，一起把下面这些环节走通：

- 为什么抓包**第一件事是关掉 VPN**，不然全流程都白搭
- `Charles` 端怎么确认代理端口、打开 `HTTP/2` 与透明代理
- `Help → SSL Proxying` 里那个「安装到移动设备」入口到底给了你什么信息
- iPhone 怎么把 `Wi-Fi` 代理指向 `Mac`，再用 `chls.pro/ssl` 下载证书
- 描述文件安装 + **关于本机里的「证书信任设置」** 这一步为什么最容易被漏
- 抓到明文后 `SSL Proxying` 白名单怎么配，以及连不上/证书灰/乱码的排查清单

## 一、动手前的三个前提

真机抓包本质上是「让手机的所有流量先绕道到你电脑上的 `Charles`，再由 `Charles` 转发出去」。要让这条路走通，开工前先确认三件事，否则后面每一步都可能莫名其妙失败：

- **手机和电脑连的是同一个 `Wi-Fi`**（同一网段），这是代理能互通的物理前提。
- **关闭手机上的 VPN / 加速器 / 科学上网工具**。这是最高频的坑：`VPN` 会把流量从另一条隧道送出去，直接绕过你设置的 `HTTP` 代理，结果就是 `Charles` 里一条请求都不出现。记住一句话——**抓包必须关闭 VPN**。
- **电脑防火墙放行 `Charles`**。`macOS` 首次运行会弹窗询问是否允许接入网络连接，选允许即可。

这三点看着简单，但「明明配好了却抓不到包」的案例里，八成以上都栽在 `VPN` 没关或者不在同一 `Wi-Fi` 上。

## 二、Charles 端确认代理端口

先看 `Charles` 这一侧。打开 `Charles`，进入 `Proxy → Proxy Settings`，核对 `HTTP Proxy` 的监听端口——默认是 `8888`，这个端口号待会要原样填到 iPhone 的 `Wi-Fi` 代理里，两边必须一致。

![Charles 的 Proxy Settings 面板，HTTP Proxy 端口为 8888，勾选了 Support HTTP/2 和 Enable transparent HTTP proxying](https://s.poetries.top/uploads/2026/07/1127b2a9fda862b0.jpg)

这里有两个勾选项值得留意：

- **`Support HTTP/2`**：现在绝大多数线上接口都走 `HTTP/2`（甚至 `HTTP/3`），不勾这个，很多请求会抓不全或被降级，务必打开。
- **`Enable transparent HTTP proxying`**：透明代理，配合真机抓包更稳，建议保持勾选。

`SOCKS Proxy` 这一栏真机抓包用不到，保持默认不启用即可。端口确认完点 `Done`，`Charles` 端的「入口」就算开好了。

## 三、从 Help 菜单拿到移动端安装入口

端口有了，接下来要解决 `HTTPS` 明文的核心——**证书**。`HTTPS` 是加密的，`Charles` 想看到明文，本质是做一次「中间人」：它用自己的根证书重新签发目标站点的证书，手机得先信任这张 `Charles` 根证书，加密流量才能被解开。

`Charles` 很贴心地把移动端的安装指引集中在了一个入口：顶部菜单 `Help → SSL Proxying → Install Charles Root Certificate on a Mobile Device or Remote Browser`。

![Charles 的 Help - SSL Proxying 菜单展开，红框标注 Install Charles Root Certificate on a Mobile Device or Remote Browser，弹窗提示把设备代理配置为 192.168.5.136:8888 后浏览 chls.pro/ssl 下载证书](https://s.poetries.top/uploads/2026/07/1261e5acf2233e3f.jpg)

点进去弹出的提示框，把接下来两步要用的关键信息一次性告诉了你：

> Configure your device to use Charles as its HTTP proxy on **192.168.5.136:8888**, then browse to **chls.pro/ssl** to download and install the certificate.

翻译成人话就是：

1. 把手机的 `HTTP` 代理设成 `Charles` 所在电脑的局域网 IP 加端口（这里是 `192.168.5.136:8888`，你的 IP 换成自己 `Mac` 的即可，可在 `Help → Local IP Addresses` 查到）。
2. 代理配好之后，用手机浏览器打开 `chls.pro/ssl` 这个特殊域名下载证书。

弹窗还特意提醒了一句：`iOS 10` 及以后，装完证书**还要**去 `设置 → 通用 → 关于本机 → 证书信任设置` 里手动把 `Charles` 证书**启用为受信任**——这正是第七节要讲、也是最多人漏掉的一步。

## 四、iPhone 端把 Wi-Fi 代理指向 Mac

回到 iPhone。进入 `设置 → 无线局域网`，点你当前连接的这个 `Wi-Fi` 名字右侧的 `ⓘ`，进入这个网络的详情页，一直往下滑，最底部 `HTTP 代理` 分组里有一项 `配置代理`，默认是 `关闭`。

![iPhone Wi-Fi 详情页，包含 IPv4 地址、IPv6 地址、DNS 配置，最底部 HTTP 代理分组里配置代理显示为关闭](https://s.poetries.top/uploads/2026/07/a5502020cb99297f.jpg)

顺便说一句：这个详情页往上还能看到 `IPv4 地址`、`子网掩码`、`路由器`、`DNS` 这些信息——真机抓包要求「手机和电脑在同一网段」，如果你不确定，就是在这里核对手机的 `IP` 和 `Mac` 的 `IP` 是不是同一个网段（一般前三段一致）。确认无误后点最底部的 `配置代理`，把它从 `关闭` 改成 `手动`：

![iPhone 配置代理页面，选中手动，服务器填 192.168.3.51，端口填 8888，认证保持关闭，右上角是保存按钮](https://s.poetries.top/uploads/2026/07/61f8b6dda1518b10.jpg)

在 `手动` 模式下填两个值，然后点右上角 `保存`：

- **服务器**：`Charles` 所在电脑的局域网 IP。上图填的是 `192.168.3.51`，**这只是示例**，你要换成自己 `Mac` 的实际 IP（就是第三节 `Charles` 弹窗里、或 `Help → Local IP Addresses` 里看到的那个，不同网络环境下这个 IP 会变）。
- **端口**：`8888`（和第二节 `Proxy Settings` 里的端口一致）。
- **认证**：保持 `关闭`，`Charles` 默认不需要代理认证。

保存后，手机的全部 `HTTP/HTTPS` 流量就会先流经 `Charles`。此时 `Charles` 通常会弹一个 `Allow / Deny` 的确认框，问是否允许这台设备接入，点 `Allow` 放行。放行后你在 `Charles` 左侧就能陆续看到这台手机发出的请求了——不过 `HTTPS` 现在还是加密的，得先把证书装好。

## 五、用 chls.pro/ssl 下载证书

代理生效后，用 iPhone 的 **`Safari`**（这里建议用 `Safari`，第三方浏览器对描述文件下载支持不一）打开 `chls.pro/ssl`。这个域名是 `Charles` 内部拦截处理的，只有在代理指向 `Charles` 时才能正常返回证书文件。

![iPhone Safari 打开 chls.pro 显示 Charles SSL CA Certificate installation 页面，底部提示 charles-proxy-ssl 证书下载完毕](https://s.poetries.top/uploads/2026/07/ce946066c7db463b.jpg)

页面标题是 `Charles SSL CA Certificate installation`，正文提示浏览器马上会下载并引导安装 `Charles SSL CA` 证书；如果没反应，它会提醒你「检查系统或浏览器是否已把 `Charles` 配成代理」——这句话其实就是在帮你反向确认第四步的代理有没有配对。底部出现 `charles-proxy-ssl-…-certificate.pem` **下载完毕** 就说明证书文件已经到手机上了。

这里要有个心理预期：**在新版 iOS 上，`Safari` 下载完证书并不会自动弹出安装界面**，只是把描述文件下载到了本地，需要你手动去「设置」里走安装流程，也就是下一节。

## 六、在设置里安装描述文件

下载完证书后，回到 iPhone 的 `设置`。新版 iOS 会在设置顶部（或 `设置 → 通用 → VPN 与设备管理`）出现一个待安装的描述文件入口。

![iPhone 设置的 VPN 与设备管理页面，已下载的描述文件里出现 Charles Proxy CA，VPN 显示未连接](https://s.poetries.top/uploads/2026/07/b39abf96141b6512.jpg)

进到 `VPN 与设备管理`，能看到 `已下载的描述文件` 分组里躺着一个 `Charles Proxy CA`。顺便留意这张图左上角——`VPN` 一栏显示 **未连接**，这正好印证了第一节强调的「抓包前先关 VPN」，是个可以顺手确认的状态点。点开这个 `Charles Proxy CA`：

![iPhone 安装描述文件界面，显示 Charles Proxy CA 描述文件，签名者尚未验证，右上角有蓝色安装按钮](https://s.poetries.top/uploads/2026/07/2ecc061f78c86d0e.jpg)

进入 `安装描述文件` 界面，能看到描述文件名 `Charles Proxy CA (9 May 2026, Mac)`，签名者下面标着红色的 **尚未验证**（这是自签名根证书的正常状态，不用慌），`包含` 一项写着 `证书`。点右上角蓝色的 **安装**，按提示输入锁屏密码，一路确认，把这张根证书装进系统。

装完之后**别急着高兴**——到这一步证书只是「装上了」，但系统还**没有信任**它。如果这时候直接去抓 `HTTPS`，你会发现 `Charles` 里那些 `HTTPS` 请求要么报错要么还是密文。真正的开关在下一节。

## 七、关于本机里开启证书信任（最容易漏的一步）

这是整个流程里**最反直觉、也最容易被忽略**的一步，`Charles` 的弹窗专门提醒过：装完证书还要单独去「证书信任设置」里打开完全信任的开关。

路径是 `设置 → 通用 → 关于本机`，一直往下滑到最底部，会看到一个 `证书信任设置` 入口。

![iPhone 设置的关于本机页面，底部有证书信任设置入口](https://s.poetries.top/uploads/2026/07/be9901fc17d7b3b3.jpg)

很多人卡在这里就是因为——`证书信任设置` 藏在 `关于本机` 页面的**最底下**，不往下滑根本发现不了，装完描述文件就以为大功告成了。点进 `证书信任设置`：

![iPhone 证书信任设置页面，针对根证书启用完全信任下的 Charles Proxy CA 开关已打开，弹出根证书警告提示为网站启用此证书将允许第三方查看发送给网站的任何私人数据](https://s.poetries.top/uploads/2026/07/8d3a0764bf842155.jpg)

在 `针对根证书启用完全信任` 分组里找到 `Charles Proxy CA (9 May 2026, Mac)`，把它右侧的开关**打开**。系统会弹出一个 `根证书` 警告：「为网站启用此证书将允许第三方查看发送给网站的任何私人数据」，点 **继续**。

这个警告不是吓唬你——它说的是**大实话**：一旦信任了这张根证书，`Charles`（乃至任何持有对应私钥的一方）就真的能解开你手机发出去的 `HTTPS` 明文。所以这里给一条**安全红线**：

- 只在**自己的测试机**上装、且**只在抓包期间**开启信任；
- 抓完包记得**关掉代理、关掉信任开关，乃至移除描述文件**；
- 绝不要在别人的手机、或存有敏感账号的主力机上长期开着这个信任。

开关打开、`继续` 点完，证书信任才算真正生效，`Charles` 这才具备解密你手机 `HTTPS` 流量的能力。

## 八、回到 Charles 看明文与 SSL Proxying 白名单

三段都配好后，回到 `Charles`，用手机随便刷一个走 `HTTPS` 的接口，你就能在 `Contents` 里看到解密后的明文了——请求行、`authorization`、`cookie`、`host`，以及格式化好的 `JSON` 响应体，一览无余。

事实上第三节那张 Charles 主界面的截图背景里，已经能看到一条 `GET https://chatgpt.com/backend-api/codex/models?client_version=0.142.5 → 200 OK` 被完整解密：右侧 `Contents` 面板里 `authorization` 的 `Bearer` token、`user-agent`、`host` 全是明文，下方 `JSON` 里 `"models"`、`"slug": "gpt-5.5"` 这些字段也清清楚楚——这就是抓包成功的样子。

如果你发现 `HTTPS` 请求在 `Charles` 里显示为 `Unknown` 或还是密文，多半是 **`SSL Proxying` 白名单没配**。`Charles` 出于性能和隐私考虑，默认不解密所有 `HTTPS`，你需要告诉它「解哪些域名」：

- 菜单 `Proxy → SSL Proxying Settings → SSL Proxying` 标签页，勾上 `Enable SSL Proxying`；
- 在 `Include` 列表里点 `Add`，`Host` 填目标域名（省事的话可以填 `*`、端口填 `443` 先全解，调完再收窄）；
- 或者更快的方式：在左侧请求上**右键 → `Enable SSL Proxying`**，`Charles` 会自动把该域名加进白名单。

配好白名单再刷一次，明文就出来了。

## 九、常见问题排查清单

把上面每一步可能翻车的点集中列一下，抓不到包时对着挨个排查：

| 现象 | 最可能的原因 | 处理 |
|---|---|---|
| `Charles` 里一条手机请求都没有 | 开着 `VPN`，或手机电脑不在同一 `Wi-Fi` | 关 `VPN`，确认同网段，代理 IP 填对 |
| 手机上不了网 / 一直转圈 | 代理 IP、端口填错，或 `Charles` 没开 | 核对 IP 与 `8888`，确认 `Charles` 在运行并点了 `Allow` |
| `chls.pro/ssl` 打不开 / 不下载 | 代理没真正生效 | 回到第四步重配 `Wi-Fi` 代理，确认走的是 `Charles` |
| 描述文件装了，`HTTPS` 还是报错 | `证书信任设置` 里没开完全信任 | 走第七节，`关于本机 → 证书信任设置` 打开开关 |
| `HTTPS` 请求显示 `Unknown`/密文 | `SSL Proxying` 白名单没配 | 第八节，加域名或右键 `Enable SSL Proxying` |
| 抓完之后手机网络怪怪的 | 代理没关 | 抓完把 `Wi-Fi` 代理改回 `关闭`/自动 |

## 十、总结

`Charles` 抓 iOS 真机 `HTTPS`，难点从来不在「点哪个按钮」，而在于理解**这条链路由三段拼成**，任何一段断了都抓不到：

1. **网络前提**：同一 `Wi-Fi`、**关掉 VPN**、防火墙放行——这是最容易被忽视、却最常导致「一条包都没有」的一段。
2. **代理打通**：`Charles` 端确认 `8888` 端口、开 `HTTP/2` 与透明代理；iPhone 端把 `Wi-Fi` 代理指向 `Mac` 的局域网 IP，让流量绕道过来。
3. **证书信任**：`chls.pro/ssl` 下载证书 → 设置里安装描述文件 → **关于本机 → 证书信任设置开启完全信任**，这三步缺一不可，尤其最后那个藏在页面底部的信任开关。

三段全通，再按需在 `SSL Proxying` 白名单里指定要解密的域名，你就能拿到真机上任意一条 `HTTPS` 请求的完整明文。最后再强调一遍安全底线：**中间人抓包等于放弃了这段流量的加密保护，只在自己的测试机、抓包期间临时开，用完立刻关代理、关信任、清描述文件**，别把测试用的证书信任长期留在主力机上。

## 参考

- Charles 官方文档：SSL Proxying —— <https://www.charlesproxy.com/documentation/proxying/ssl-proxying/>
- Charles 官方文档：Install Charles Root Certificate on an iOS Device —— <https://www.charlesproxy.com/documentation/faqs/ssl-connection-errors/>
- Apple 支持：在 iPhone、iPad 上信任手动安装的证书 —— <https://support.apple.com/zh-cn/102390>
