---
title: 小程序直播总结 live-pusher与live-player接入实践
description: 小程序直播的三种实现方案对比，重点讲 live-pusher 和 live-player 原生接入，含类目资质、推拉流流程、腾讯云直播配置与 IM 互动。
date: 2020-06-14 15:20:12
tags:
  - 小程序
  - 直播
  - 音视频
categories: Front-End
---

产品那边提了个需求，要在小程序里做直播。听上去像是加个播放器的事，真去调研才发现门槛全在代码之外：类目过不过得了、资质有没有、推流地址从哪来、服务端要不要自己搭。技术选型反而是最后才轮到的事。

这篇把当时调研和接入的过程完整记一遍，三条实现路线各自的适用场景，`live-pusher` 和 `live-player` 两个组件的参数怎么配，腾讯云直播那边的域名和 CNAME 怎么弄，最后是 IM 互动和直播回放。看完你应该能判断出自己这个项目该走哪条路。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 小程序直播的三种实现方案，各自的成本和限制
- 类目和资质门槛，哪些账号根本开不了直播
- 推流和拉流的完整链路，以及两张 API 调用流程图怎么读
- `live-player` 的 live 与 RTC 两种模式，`min-cache` 和 `max-cache` 怎么调
- `live-pusher` 的 SD / HD / FHD / RTC 四种模式怎么选
- 云直播服务的选型，推流域名与播放域名的 CNAME 配置
- 直播回放和 IM 弹幕互动的接入路径
- 这几年微信和云厂商这边变了什么

## 一、小程序直播功能目前有哪些实现方案

先把路摆出来，一共三条。

内嵌腾讯直播 H5。腾讯直播已改名 NOW 直播，小程序接入工具文档已经找不到了。这条路当时就走不通，列在这里是为了说明它曾经存在过。

小程序原生实现。小程序对直播和 `websocket` 都做了比较好的封装，通过 `live-pusher`、`live-player` 组件和 `websocket API` 就能实现直播互动功能。这条路自由度最高，弹幕、连麦、礼物这些自定义交互都能做，代价是链路要自己搭，云直播的账单也要自己扛。

接入小程序直播插件实现。小程序直播是微信提供给小程序开发者的直播组件。这条路接入最快，微信把推流端、播放端、商品挂载、回放这一整套都封装好了，代价是交互样式和业务流程基本按微信的来，改不了多少。

我的判断是这样：如果你的诉求就是「电商小程序里加个直播卖货」，走插件；如果你要做的是在线教育、多人连麦、或者直播界面上有大量自定义交互，那只能走原生。这篇后面主要讲原生这条路。

## 二、小程序原生实现直播功能流程

微信小程序从 `1.7` 开始，为开发者提供了两个新接口，`live-pusher` 和 `live-player`，可以在小程序上实现单向的直播功能。通过和其他技术结合，比如 `WebRTC`，开发者们还可以进一步在小程序直播的基础上实现连麦功能。

### 2.1 先过类目这一关

由于微信对小程序直播功能的类目有限制，限定了特定类目的小程序才能使用。

![微信对小程序直播功能开放的类目限制表](https://s.poetries.top/gitee/2020/06/8.webp)

另外需要注意几点：

- 个人号无法申请使用直播功能
- 社交类目开通直播功能需要相关视频许可和文网文资质许可
- 所以小程序开通直播的业务，要根据产品的目的和场景去申请对应的类目

这条路我建议排在所有技术工作前面。类目和资质走不通，后面代码写得再漂亮也上不了线。

在小程序管理后台，「开发」-「接口设置」中自助开通对应的权限，如下图所示：

![在小程序管理后台的接口设置中自助开通直播权限](https://s.poetries.top/gitee/2020/06/9.png)

### 2.2 整条链路长什么样

![小程序原生实现直播功能的完整链路示意图](https://s.poetries.top/gitee/2020/06/7.webp)

微信小程序原生实现直播功能的流程如上图所示。录制端小程序通过 `live-pusher` 组件对手机摄像头和麦克风的数据进行采集和编码，推流到服务器；服务器端对数据进行加工处理并分发给多个客户端；播放端小程序通过 `live-player` 组件从云端拉流并进行实时无差异的解码和渲染，从而实现直播小程序完整的互动功能。

这条链路里，小程序只负责最两头的采集和渲染。中间那一大段全是云服务商的活儿。

推流 API 调用流程图：

![live-pusher 推流的 API 调用时序流程图](https://s.poetries.top/gitee/2020/06/1.jpg)

拉流 API 调用流程图：

![live-player 拉流的 API 调用时序流程图](https://s.poetries.top/gitee/2020/06/2.jpg)

这两张图读的时候盯住两件事：状态回调和错误分支。真机上出问题的时候，你能拿到的信息全在 `bindstatechange` 和 `bindnetstatus` 这两个事件里，前者报状态码，后者报网络质量。别嫌麻烦，一开始就把这两个回调的日志打全，后面排查能省一半时间。

## 三、小程序直播实现过程

微信小程序中的推拉流功能，需要用到微信提供的 `live-player` 和 `live-pusher` 标签。

### 3.1 live-player

`live-player` 是微信提供的支持实时音视频播放的组件，[官方介绍详见组件介绍](https://developers.weixin.qq.com/miniprogram/dev/component/live-player.html)。

创建 `live-player` 的演示源码如下：

```html
<live-player
    autoplay
    wx:if="{{item.playUrl}}"
    id="{{item.streamID}}"
    mode="RTC"
    object-fit="fillCrop"
    min-cache="0.1"
    max-cache="0.3"
    src="{{item.playUrl}}"
    debug="{{pushConfig.showLog}}"
    bindstatechange="onPlayStateChange"
    bindnetstatus="onPlayNetStateChange"
    binderror="error">
    <cover-view class='character' style='padding: 0 5px;'>{{item.streamID}}</cover-view>
</live-player>
```

请注意两种模式的区别。

`live` 模式主要用于直播类场景，比如赛事直播、在线教育、远程培训等等。该模式下，小程序内部的模块会优先保证观看体验的流畅，通过调整 `min-cache` 和 `max-cache` 属性，你可以调节观众端所感受到的时间延迟的大小。

`RTC` 则主要用于双向视频通话或多人视频通话场景，比如金融开会、在线客服、车险定损、培训会议等等。在此模式下，对 `min-cache` 和 `max-cache` 的设置不会起作用，因为小程序内部会自动将延迟控制在一个很低的水平，`500ms` 左右。

那 `min-cache` 和 `max-cache` 到底在调什么呢？调的是播放端的缓冲区水位。播放器不会拿到一帧就渲染一帧，它会先囤一小段数据再开始播，用来抵消网络抖动。囤得多，卡顿少但延迟大；囤得少，延迟低但网络一抖就卡。

所以这两个参数不是越小越好，它是延迟和流畅度之间的一个滑块。单向观看的直播，比如带货或者赛事，观众感知不到延迟，可以把水位调高换流畅；需要主播和观众实时对话的场景才值得压低。

还有一个 `cover-view`。`live-player` 是原生组件，层级高于普通的 WXML 元素，想在视频上盖字或者盖按钮只能用 `cover-view` 和 `cover-image`，普通的 `view` 会被压在下面看不见。这个坑我踩过，写了半天弹幕层发现真机上什么都看不到。

### 3.2 live-pusher

`live-pusher` 是微信提供的支持实时音视频录制的组件，[官方介绍详见组件介绍](https://developers.weixin.qq.com/miniprogram/dev/component/live-pusher.html)。

创建 `live-pusher` 的演示源码如下：

```html
<live-pusher
    wx:if="{{pushUrl}}"
    id="video-livePusher"
    mode="RTC"
    url="{{pushUrl}}"
    min-bitrate="{{pushConfig.minBitrate}}"
    max-bitrate="{{pushConfig.maxBitrate}}"
    aspect="{{pushConfig.aspect}}"
    beauty="{{pushConfig.isBeauty}}"
    muted="{{pushConfig.isMute}}"
    background-mute="true"
    debug="{{pushConfig.showLog}}"
    bindstatechange="onPushStateChange"
    bindnetstatus="onPushNetStateChange">
    <cover-view class='character' style='padding: 0 5px;'>{{isPublishing ? "我(" + publishStreamID + ")": ""}}</cover-view>
</live-pusher>
```

请注意，推流端的模式比播放端多几个。

SD、HD 和 FHD 主要用于直播类场景，比如赛事直播、在线教育、远程培训等等，分别对应三种默认的清晰度。该模式下，小程序会更加注重清晰度和观看的流畅性，不会过分强调低延迟，也不会为了延迟牺牲画质和流畅性。

RTC 则主要用于双向视频通话或多人视频通话场景。该模式下，小程序会更加注重降低点到点的时延，也会优先保证声音的质量，在必要的时候会对画面清晰度和画面的流畅性进行一定的缩水。

`min-bitrate` 和 `max-bitrate` 是码率上下限，单位是 kbps。移动端网络波动大，推流端会在这个区间内动态调整。区间给窄了，网络一差就只能丢帧；给宽了，画质会在好网和差网之间明显跳变。这个值没有标准答案，得看你的内容类型，画面静态多的场景可以把上限压低。

`background-mute` 这个属性容易被忽略，它决定 App 切到后台时是否静音推流。主播接了个电话回来发现直播断了，多半就是后台策略没配对。

### 3.3 服务端的选择

自己搭 RTMP 服务，比如 `Nginx rtmp`，成本较高，技术实现难度大。所以更现实的做法是用云服务商提供的视频直播服务产品，让它生成推流地址和播放地址。目前市面上主流的云直播产品有腾讯云、阿里云、七牛云等。

![主流云直播服务商的功能与价格对比](https://s.poetries.top/gitee/2020/06/10.png)

各平台均提供内容接入与分发和分布式实时视频处理技术，每个平台提供的功能大同小异但各有千秋。按当时的价格，平均费用大概 20 到 30 元每 100G，100G 流量可以满足 100 人同时在线直播 4 小时。这个数字是 2020 年的行情，现在的定价和赠送政策早就变了，只能当个数量级参考。

接下来选择腾讯云直播进行接入体验。

第一步，申请腾讯云账号，开通云直播权限。当时它会赠送 20GB 流量，超出需要自己花钱。开通流程请参考文档：https://cloud.tencent.com/document/product/454/12517

第二步，域名管理。在这里面会看到两个域名，一个是推流域名，一个是播放域名。域名可以用自己的，建议配置自己的域名，2019 年 2 月 26 日上线查看时发现赠送的播放域名已失效。具体看文档：https://cloud.tencent.com/document/product/267/20381

![腾讯云直播控制台的域名管理界面](https://s.poetries.top/gitee/2020/06/11.png)

由于腾讯云不再赠送播放域名，所以需要租用或者使用自己的域名生成播放地址。自己的播放域名不能直接访问，需要完成 CNAME 配置。

![播放域名的 CNAME 解析配置示意](https://s.poetries.top/gitee/2020/06/12.png)

CNAME 这一步是很多人卡住的地方。你在腾讯云控制台加了域名，它会给你一个 CNAME 目标值，你得去自己的 DNS 服务商那里把这条解析加上，流量才会真正走到腾讯云的节点。解析生效有延迟，配完先用 `dig` 或者 `nslookup` 确认一下再回来调代码，不然你会以为是自己的推流参数写错了。

还有一点，推流地址通常带有过期时间和鉴权签名。这套签名的生成一定要放在自己的后端，不要把密钥打进小程序包里。小程序的代码包是能被解出来的。

### 3.4 组件 API 接入

第一步，`live-pusher` 推流，也就是数据包实时上传。

使用 `live-pusher` 发布流，这里用到的参数是 `min-bitrate="200"` 最小码率，`max-bitrate="400"` 最大码率，`mode="RTC"` RTC 模式。加入房间之后我们需要调用 `publish` 返回一个 `rtmp` 推流地址。

```html
<live-pusher
  autopush
  min-bitrate="200"
  max-bitrate="400"
  mode="RTC"
  url="{{publishPath}}">
</live-pusher>
```

先使用 `wx.createLivePusherContext` 创建 `LivePusherContext`，再使用 `setData` 设置好 `publishPath` 之后发布：

```js
// index.js

Page({
  data: {
    publishPath: undefined,
  },
  publish() {
  // joinRoom 之后调用
  // 创建 LivePusherContext
  const pushContext = wx.createLivePusherContext()
  const path = session.publish()
  this.setData(
    { publishPath: path },
    () => {
      pushContext.start({
          success: () => {
            console.log('推流成功')
          },
          fail: () => {
            console.log('推流开始失败')
          }
        })
    })
  }
})
```

这段代码里有个细节值得单独说：`pushContext.start` 是放在 `setData` 的回调里调用的，不是紧跟在 `setData` 后面。因为 `setData` 是异步的，视图层要等下一次渲染才拿到 `publishPath`，此时组件的 `url` 还是空的，直接调 `start` 会失败。这类「明明地址是对的却推不上去」的问题，十有八九出在这个时序上。

第二步，`live-player` 播放，也就是数据包实时下载。

使用 `live-player` 订阅流，加入房间之后我们可以调用 `subscribe` 返回一个 `rtmp` 拉流地址。下面我们使用了 `wx:for` 遍历 `data.subscribeList` 渲染一个订阅的列表：

```html
<live-player
  autoplay
  wx:key="{{item.key}}"
  wx:for="{{subscribeList}}"
  min-cache="0.2"
  max-cache="0.8"
  src="{{item.url}}"
  mode="RTC">
</live-player>
```

多路播放这里要注意同屏数量的限制。原生组件是有性能上限的，同一个页面上同时渲染多个 `live-player` 在中低端机上很容易发热和掉帧。多人连麦的场景，超出可见范围的流应该主动停掉而不是留着。

### 3.5 直播回放功能

参考[腾讯云](https://cloud.tencent.com/document/product/454/8681#1.-.E7.9B.B4.E6.92.AD.E5.BD.95.E5.88.B6.E7.9A.84.E5.8E.9F.E7.90.86.E6.98.AF.E4.BB.80.E4.B9.88.EF.BC.9F)的接入实现，一般是后台来做。

原理是云端在分发的同时把流录制成文件，直播结束后生成一个点播地址。所以回放不是 `live-player` 的活儿，它放的是直播流；回放要用普通的 `video` 组件播点播地址。这两个组件别搞混。

## 四、即时通信 IM

直播只解决了「看得到」，弹幕、点赞、送礼这些互动得靠另一条通道。在直播中加入 IM 功能，可以参考[腾讯云 IM](https://cloud.tencent.com/document/product/269) 接入：

- https://github.com/tencentyun/TIMSDK/tree/master/WXMini
- https://cloud.tencent.com/document/product/269/37448
- [IM sdk文档](https://imsdk-1252463788.file.myqcloud.com/IM_DOC/Web/SDK.html#createTextMessage)

自己用 `websocket` 撸一套当然也行，小程序的 WebSocket API 封装得不错。但真做起来你会发现麻烦的不是连接，是消息可靠性、断线重连、历史消息拉取、以及大房间里的消息限流。一个几千人的直播间，弹幕不做合并和抽样，客户端会被消息刷到卡死。这些东西 IM SDK 里都有现成的，自己造轮子的收益不高。

不管走哪条路，记得把域名加到小程序后台的 socket 合法域名白名单里，这个和 request 的白名单是分开的。小程序后台的这些配置项我在[微信小程序开发总结](https://feinterview.poetries.top/blog/wx-weapp-summary)里也整理过。

## 五、完整示例

实现效果：

![小程序直播功能的最终实现效果截图](https://s.poetries.top/gitee/2020/06/13.png)

部分代码参考 https://github.com/poetries/weapp-live

## 六、这几年变了什么

这篇是 2020 年 6 月写的，音视频这块变化不小，有几处需要说明。

微信后台的菜单位置这几年调整过。文中提到的「开发」-「接口设置」这个路径，以及类目管理的入口，随着后台改版会变动，请以你打开时实际看到的后台为准。

直播相关的类目和资质口径也调整过。微信这几年在直播能力上的布局有变化，视频号直播起来之后，小程序侧直播的权限口径、可申请的类目范围都动过。开工之前请以官方文档和你的后台实际能勾选的选项为准，别照着这篇 2020 年的截图去对。

腾讯云的价格和赠送策略。文中那个 20GB 赠送流量、20 到 30 元每 100G 的价格，是 2020 年的行情，现在肯定不是这个数了。选型阶段直接去看各家当前的定价页。

原生组件的能力也在迭代。`live-pusher` 和 `live-player` 后续加过一些属性和状态码，模式的行为描述也做过调整。参数含义这块我这篇写的是当时的理解，具体的属性列表和默认值请以组件文档为准。

最后说句实在的，这套原生方案我是在一个规模不大的项目上跑通的，多人连麦和大房间的压力场景我没有完整验证过。如果你的量级更大，弱网表现和同屏路数这两块建议自己压一遍再定方案。

## 总结

小程序直播这件事，技术选型排在第二位，第一位是类目和资质。类目过不了，原生和插件两条路都堵死，所以立项时先去后台看看能不能勾选。

真到选方案，判断标准就一条：交互要不要自定义。要就走 `live-pusher` 加 `live-player` 的原生方案，不要就走微信的直播插件，能省下的不只是代码，还有整条云直播链路的运维和账单。

原生方案里几个容易栽的地方值得重复一遍。视频上的浮层只能用 `cover-view`，普通 `view` 会被原生组件压住。推流地址要在 `setData` 的回调里才调 `start`，直接调会因为视图层还没拿到 URL 而失败。播放端的 `min-cache` 和 `max-cache` 是延迟与流畅度的滑块，单向观看的场景没必要压到最低。鉴权签名一律放后端，别打进代码包。

回放走的是点播地址和 `video` 组件，不是 `live-player`；IM 建议直接用现成 SDK，消息限流和断线重连这些自己写代价不低。

## 参考

- [小程序 live-player 组件文档](https://developers.weixin.qq.com/miniprogram/dev/component/live-player.html)
- [小程序 live-pusher 组件文档](https://developers.weixin.qq.com/miniprogram/dev/component/live-pusher.html)
- [腾讯云 云直播产品文档](https://cloud.tencent.com/document/product/267)
- [腾讯云 即时通信 IM 文档](https://cloud.tencent.com/document/product/269)
- [weapp-live 示例代码](https://github.com/poetries/weapp-live)
- [前端进阶之旅](https://interview.poetries.top)
