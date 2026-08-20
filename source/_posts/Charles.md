---
title: Charles 抓包总是看不到 HTTPS？从证书到断点调试一次讲透
description: 一篇可直接照做的 Charles 抓包指南，覆盖 macOS 代理、HTTPS 证书、iOS 与 Android 真机、Map Local、断点改包、弱网模拟和常见故障排查。
date: 2018-03-22 10:09:43
tags:
  - 调试
  - Charles
  - HTTPS
categories: Tools
---

> 文章首发于: https://feinterview.poetries.top/blog/Charles

浏览器请求能看到，手机 App 却一片空白；HTTP 抓到了，HTTPS 只剩一串 `CONNECT`；证书装过，接口还是报不受信任。第一次用 Charles 时，大概率会在这几个地方来回折腾。

先说结论，Charles 抓包不是点一下录制按钮就结束了。真正需要接通的是三层链路，客户端把流量发给代理、客户端信任 Charles 根证书、目标域名开启 SSL Proxying。少一层，表现都像是「Charles 不好用」。这篇按排查顺序把链路重新走一遍，再聊 Map Local、断点、重复请求和弱网模拟怎么用于日常开发。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Charles 抓包链路里每一层在做什么
- macOS 浏览器和手机真机怎样接入代理
- 为什么 HTTPS 只能看到 `CONNECT`，证书该怎么装
- `Map Local`、`Breakpoints`、`Repeat Advanced` 分别适合什么场景
- 如何模拟高延迟、低带宽和接口异常
- 抓不到包、证书报错、App 拒绝连接时怎么定位
- 调试结束后需要恢复哪些系统设置

## 一、先把 Charles 的角色弄清楚

Charles 是一个 HTTP 和 SOCKS 代理。客户端不再直接访问接口，而是先把请求交给 Charles，Charles 再访问目标服务器，并把响应转回客户端。请求与响应经过它时，我们才有机会查看、重放或修改数据。

```text
浏览器 / 手机 App
        │  HTTP Proxy
        ▼
     Charles
        │  HTTP / HTTPS
        ▼
      服务端
```

这张旧版界面截图还能帮助认识两个主要视图。左边按域名组织请求，右边查看请求头、响应头和正文。不同版本菜单位置可能有变化，能力本身没有变。

![Charles 请求列表与详情面板](https://s.poetries.top/gitee/2019/10/24.png)

我自己的感受是，刚开始不要急着配通配规则。先打开一个明确的测试地址，确认 Charles 能看到请求，再逐层加入 HTTPS、真机和改包。一次改五个配置，最后很难判断到底是哪一步没通。

## 二、先跑通浏览器 HTTP 抓包

安装并启动 Charles 后，确认顶部录制按钮处于开启状态。macOS 上通常可以通过 `Proxy > macOS Proxy` 让系统代理指向 Charles。代理端口以 `Proxy Settings` 里的实际值为准，很多安装默认使用 `8888`，但它不是不能修改的常量。

先访问一个 HTTP 测试地址。如果左侧出现对应 Host，请求行里能看到 Method、Status、Content-Type 和 Timing，说明最基础的代理链路已经通了。

![Charles 工具栏](https://s.poetries.top/gitee/2019/10/25.png)

请求太多时，优先用域名过滤，不要盯着整棵树找。右键目标请求也能快速进入断点、SSL Proxying、Repeat 等操作。旧截图里的菜单名称仍有参考价值，但请以当前安装版本为准。

![Charles 请求右键菜单](https://s.poetries.top/gitee/2019/10/26.png)

如果这里就没有记录，按这个顺序检查：

1. Recording 是否开启。
2. `macOS Proxy` 是否开启，系统里有没有被 VPN 或另一个代理覆盖。
3. 客户端是否绕开系统代理，例如应用自己配置了直连。
4. 请求是否被 Charles 的 Focus、Filter 或录制规则隐藏。

基础 HTTP 没通之前先别折腾证书。

## 三、HTTPS 抓包为什么多了两道门

HTTPS 内容经过 TLS 加密，普通代理只能看到客户端要连接哪个主机，看不到请求正文。Charles 的 SSL Proxying 会在客户端和服务器之间分别建立 TLS 连接，并为目标站点动态签发证书。因此客户端必须信任 Charles 根证书，Charles 也必须知道哪些 Host 允许解密。

在 macOS 上可以从 `Help > SSL Proxying > Install Charles Root Certificate` 安装证书。证书进入钥匙串后，找到 Charles 证书，把信任设置改成「始终信任」。这一步涉及系统信任，只应该在自己的开发设备上操作。

然后在目标 Host 上右键开启 SSL Proxying，或者在 SSL Proxying Settings 里加入明确的域名和端口。调试一个接口就加一个域名，我不建议长期保留 `*:*`。全量解密噪音大，也扩大了本机调试证书的使用范围。

配置完成后重新发请求。能展开 HTTPS 的 Header 和 Body，才算真正抓通。仍然只有 `CONNECT` 时，大概率是目标 Host 没加入 SSL Proxying；浏览器直接报证书错误，则回头检查根证书有没有安装并信任。

这里有个边界要说明。证书固定的 App 会校验服务端证书或公钥，拒绝 Charles 动态签发的证书。不要试图抓取无权调试的第三方应用。自有 App 应只在 debug 构建里提供调试信任配置，生产包不能为了抓包降低证书校验。

## 四、手机真机接入 Charles

手机和电脑接入同一局域网后，先查电脑的局域网 IP，再把手机当前 Wi-Fi 的 HTTP 代理改为手动，服务器填电脑 IP，端口填 Charles `Proxy Settings` 中的端口。

```bash
# macOS 查看常见 Wi-Fi 接口地址，接口名可能不是 en0
ipconfig getifaddr en0
```

第一次连接时，Charles 通常会弹出是否允许该设备访问的提示。允许后先用手机浏览器访问 HTTP 页面，确认流量能进入 Charles。

![移动设备代理配置示意](https://s.poetries.top/gitee/2019/10/36.png)

HTTPS 还要在手机上安装并信任证书。iOS 可在已经接入代理的 Safari 中访问 `https://chls.pro/ssl` 安装描述文件，之后还要进入「设置 > 通用 > 关于本机 > 证书信任设置」开启完全信任。只安装描述文件却没开启信任，是最常见的卡点之一。

Android 7 及之后，应用默认不信任用户安装的 CA。自有 App 可以在 debug 构建的 `network_security_config.xml` 中允许用户证书，生产构建继续沿用系统默认信任策略。

```xml
<network-security-config>
  <debug-overrides>
    <trust-anchors>
      <certificates src="user" />
    </trust-anchors>
  </debug-overrides>
</network-security-config>
```

这段配置只解决自有 Android App 的 debug 抓包问题。它不能绕过证书固定，也不该进入放宽信任的生产配置。

## 五、Map Local 让线上请求读取本地文件

`Map Local` 会让命中的远程请求直接返回本地文件，适合临时替换 JavaScript、CSS、JSON 或图片。比如线上页面引用了压缩后的 `index-min.js`，本地正在调 `index.js`，不用发布测试包就能让页面加载本地版本。

![Map Local 配置入口](https://s.poetries.top/gitee/2019/10/30.png)

规则匹配要同时注意协议、Host、端口和 Path。路径支持通配符，映射目录时，本地目录不需要重复写通配符。Charles 匹配文件时不会把查询字符串算进本地文件名，因此 `/app.js?v=12` 仍可映射到 `app.js`。

![Map Local 路径映射](https://s.poetries.top/gitee/2019/10/31.png)

映射成功后，响应详情里可以看到来自本地映射的提示。刷新没有生效时，先关闭浏览器缓存，或启用 Charles 的 `No Caching`，再检查 Service Worker 有没有把请求提前拦住。

Map Local 不会执行 PHP、JSP 这类服务端脚本，它只会把文件内容原样返回。如果需要把线上接口转到本地或测试服务器，用 `Map Remote` 更合适。

## 六、用断点改请求和响应

接口边界测试最适合用 `Breakpoints`。它可以在请求发给服务器前暂停，也可以在响应回到客户端前暂停。你可以改 Header、Query、Body、状态码和响应内容，然后选择继续或终止。

![为接口开启 Breakpoints](https://s.poetries.top/gitee/2019/10/39.png)

一个很实用的测试是把成功响应改成异常响应，观察页面有没有正确处理：

```json
{
  "code": 503,
  "message": "service unavailable",
  "data": null
}
```

这段数据可以用于验证错误提示、重试按钮和 Loading 状态能否收回。测试结束后记得关闭断点，否则后面的请求会一直停在等待窗口，看起来很像接口挂了。

如果只是想重新发送同一个请求，不需要回到页面重做操作。`Repeat` 发送一次，`Repeat Advanced` 可以设置次数和并发。它适合验证幂等性、缓存和偶发错误，但不能代替专业压测。高并发请求可能影响测试环境，次数和目标必须在授权范围内。

![Repeat Advanced 设置](https://s.poetries.top/gitee/2019/10/42.png)

## 七、弱网模拟不能只改带宽

`Throttle` 能限制带宽并加入延迟。只把下载速度调低，通常模拟不出移动网络的真实体感，因为接口慢往往还受往返延迟影响。

![Charles Throttle 配置](https://s.poetries.top/gitee/2019/10/37.png)

做页面体验检查时，可以分别观察这些指标：

- 首屏骨架有没有及时出现
- 请求超时后有没有明确反馈
- 重试是否会重复提交
- 图片和非关键脚本是否阻塞主要内容
- 网络恢复后状态能不能自动回正

先从较高延迟开始更容易暴露问题。Bandwidth 控制吞吐量，Round-trip latency 控制往返延迟，MTU 则影响单个数据包的大小。具体数值应根据要模拟的网络实测来定，不要把一个预设名称当成所有地区的固定网络画像。

## 八、一份从现象反推配置的排查表

| 现象 | 优先检查 | 常见原因 |
|------|----------|----------|
| 一条请求都没有 | 系统代理、Recording | VPN 覆盖代理或客户端直连 |
| 只有 `CONNECT` | SSL Proxying Host | 域名没有加入解密列表 |
| 浏览器证书警告 | 根证书信任 | 证书安装了但未设为信任 |
| iOS HTTP 有、HTTPS 无 | 完全信任 | 描述文件已装，证书信任未开启 |
| Android 浏览器有、App 无 | debug 网络安全配置 | App 不信任用户 CA 或启用了证书固定 |
| Map Local 不生效 | 匹配规则、缓存、SW | Host/Path 不匹配或响应来自缓存 |
| 请求一直卡住 | Breakpoints | 断点仍处于开启状态 |
| 手机突然无法上网 | 电脑地址、Charles 状态 | 代理电脑休眠、IP 变化或 Charles 已退出 |

排查时一次只改一个变量。看到日志变化后再继续下一层，速度反而更快。

## 九、调试结束别忘了恢复现场

抓包工具拥有查看和修改流量的能力，用完后的清理同样重要。

- 关闭 macOS 系统代理和手机 Wi-Fi 手动代理
- 关闭全局 SSL Proxying、Breakpoints、Map Local 与 Throttle
- 删除不再使用的 Charles 根证书，至少取消完全信任
- 不导出或分享包含 Cookie、Token、手机号的 Session 文件
- 截图前清理请求头、查询参数和响应里的敏感数据
- 自有 App 的证书信任只放在 debug 构建

手机代理最容易被忘。电脑离开当前网络或关闭 Charles 后，手机仍把流量发往原地址，就会表现成「Wi-Fi 连着但打不开网页」。

## 总结

Charles 抓包的主线只有三步，流量先经过代理，客户端再信任根证书，目标 Host 最后开启 SSL Proxying。浏览器 HTTP 通了再接 HTTPS，电脑通了再接真机，定位会清楚很多。

Map Local 解决临时替换资源，Breakpoints 解决异常分支，Repeat 解决请求重放，Throttle 解决弱网体验。把它们分别用在合适的测试目标上，比把 Charles 当成一个纯粹的请求列表更有价值。第一次完整配置可以预留 20 到 30 分钟，后续日常抓包通常几分钟就能进入状态。

## 参考

- [Charles 官方文档 - Proxying](https://www.charlesproxy.com/documentation/proxying/)
- [Charles 官方文档 - SSL Certificates](https://www.charlesproxy.com/documentation/using-charles/ssl-certificates/)
- [Charles 官方文档 - Map Local](https://www.charlesproxy.com/documentation/tools/map-local/)
- [Charles 官方文档 - Breakpoints](https://www.charlesproxy.com/documentation/proxying/breakpoints/)
- [Charles 官方文档 - Throttling](https://www.charlesproxy.com/documentation/proxying/throttling/)
- [前端进阶之旅](https://interview.poetries.top)
