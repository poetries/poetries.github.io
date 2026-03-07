---
title: 小程序直播总结
date: 2020-06-14 15:20:12
tags: 
  - 小程序
  - 直播
categories: Front-End
---

## 一、小程序直播功能目前有哪些实现方案

- 内嵌腾讯直播H5：腾讯直播已改名NOW直播，小程序接入工具文档无法找到
- 小程序原生实现：小程序对直播和`websocket`都进行了比较好的封装，通过`live-pusher` `live-player`组件和`websocket API`即可实现直播互动功能
- 接入小程序直播插件实现：小程序直播，是微信提供给小程序开发者的直播组件。


## 二、小程序原生实现直播功能流程

> 微信小程序从`1.7`开始，为开发者提供了两个新接口，`<live-pusher>`和`<live-player>`，可以在小程序上实现单向的直播功能。通过与技术的结合，比如`WebRTC`，开发者们还可以进一步在小程序直播的基础上实现连麦功能

> 首先由于微信对小程序直播功能类目有限制，限定了特定类目的小程序使用

![](https://poetries1.gitee.io/img-repo/2020/06/8.webp)

**另外需要注意的两点：**

- 个人号无法申请使用直播功能；
- 社交类目开通直播功能需要相关视频许可和文网文资质许可；
- 所以小程序开通直播的业务，要根据产品的目的和场景去申请对应的类目。

> 在小程序管理后台，「开发」-「接口设置」中自助开通对应的权限，如下图所示：

![](https://poetries1.gitee.io/img-repo/2020/06/9.png)


![](https://poetries1.gitee.io/img-repo/2020/06/7.webp)

> 微信小程序原生实现直播功能流程如上图所示，录制端小程序通过`[live-pusher]`组件对手机和麦克风的数据进行采集和编码推流到服务器，服务器端对数据进行加工处理并分发给多个客户端，播放端小程序通过`[live-player]`组件从云端拉流并进行实时无差异的解码和渲染，从而实现直播小程序完整互动功能


**1. 推流 API 调用流程图**

![](https://poetries1.gitee.io/img-repo/2020/06/1.jpg)

**2. 拉流 API 调用流程图**

![](https://poetries1.gitee.io/img-repo/2020/06/2.jpg)

## 三、小程序直播实现过程

> 微信小程序中的推拉流功能，需要用到微信提供的 `live-player` `live-pusher` 标签

### 3.1 live-player

> `live-player` 是微信提供的支持实时音视频播放的组件，[官方介绍详见组件介绍](https://developers.weixin.qq.com/miniprogram/dev/component/live-player.html)。

创建 live-player 的演示源码如下

```js
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

**请注意**

- `live` 模式主要用于直播类场景，比如赛事直播、在线教育、远程培训等等。该模式下，小程序内部的模块会优先保证观看体验的流畅，通过调整 `min-cache` 和 `max-cache` 属性，您可以调节观众(播放)端所感受到的时间延迟的大小，文档下面会详细介绍这两个参数
- `RTC` 则主要用于双向视频通话或多人视频通话场景，比如金融开会、在线客服、车险定损、培训会议 等等。在此模式下，对 `min-cache` 和 `max-cache` 的设置不会起作用，因为小程序内部会自动将延迟控制在一个很低的水平(`500ms `左右)。

### 3.2 live-pusher

> live-pusher 是微信提供的支持实时音视频录制的组件，[官方介绍详见：组件介绍](https://developers.weixin.qq.com/miniprogram/dev/component/live-pusher.html)

> 创建 `live-pusher` 的演示源码如下

```js
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

**请注意：**

- SD、HD 和 FHD 主要用于直播类场景，比如赛事直播、在线教育、远程培训等等。SD、HD 和 FHD 分别对应三种默认的清晰度。该模式下，小程序会更加注重清晰度和观看的流畅性，不会过分强调低延迟，也不会为了延迟牺牲画质和流畅性
- RTC 则主要用于双向视频通话或多人视频通话场景，比如金融开会、在线客服、车险定损、培训会议 等等。该模式下，小程序会更加注重降低点到点的时延，也会优先保证声音的质量，在必要的时候会对画面清晰度和画面的流畅性进行一定的缩水

### 3.3 服务端的选择

> 由于自己搭`rtmp`（例如`Nginx rtmp`）成本较高，技术实现难度大，考虑云服务商提供的视频直播服务产品，生成推流地址和播放地址，目前市面上主流的云直播产品有：腾讯云、阿里云、七牛云等。

![](https://poetries1.gitee.io/img-repo/2020/06/10.png)

> 各平台均提供内容接入与分发和分布式实时视频处理技术，每个平台提供的功能大同小异但各有千秋，平均费用大概 20-30元/100G，100G流量可以满足100人同时在线直播4小时

**接下来选择腾讯云直播进行接入体验**

1. 申请腾讯云账号，开通云直播权限，它会赠送20gb流量给你 超出需要自己花钱。开通流程请参考下面的文档：https://cloud.tencent.com/document/product/454/12517
2. 域名管理，在这里面会看到两个域名 一个是推流域名 一个是播放域名，域名可以用自己的 （建议配置自己的域名，2019/2/26上线查看时发现赠送的播放域名已失效）。具体看下面的文档 https://cloud.tencent.com/document/product/267/20381


![](https://poetries1.gitee.io/img-repo/2020/06/11.png)

> 由于腾讯云不再赠送播放域名，所以需要租用或者使用自己的域名生成播放地址，自己的播放域名不能直接访问，需要完成CNAME配置

![](https://poetries1.gitee.io/img-repo/2020/06/12.png)

3. 最后，小程序直播组件API接入

> 第一步：`<live-pusher>`推流（数据包实时上传）示例代码：

使用`<live-pusher>`发布流，这里使用的参数 `min-bitrate="200"` 最小码率 `max-bitrate="400"` 最大码率 `mode="RTC"` RTC模式，加入房间之后我们需要调用 `publish `返回一个 `rtmp` 推流地址

```js
<live-pusher
  autopush
  min-bitrate="200"
  max-bitrate="400"
  mode="RTC"
  url="{{publishPath}}">
</live-pusher>
```

> 先使用 `wx.createLivePusherContext` 创建 `LivePusherContext`，再使用 setData 设置好 publishPath 之后发布

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

> 第二步：`<live-player>`播放（数据包实时下载）示例代码：

使用`<live-player>`订阅流，加入房间之后我们可以调用 `subscribe` 返回一个 `rtmp` 拉流地址。 下面我们使用了 `wx:for` 遍历 `data.subscribeList` 渲染一个订阅的列表

```js
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

### 3.4 直播回放功能

> 参考 [腾讯云](https://cloud.tencent.com/document/product/454/8681#1.-.E7.9B.B4.E6.92.AD.E5.BD.95.E5.88.B6.E7.9A.84.E5.8E.9F.E7.90.86.E6.98.AF.E4.BB.80.E4.B9.88.EF.BC.9F)接入实现，一般是后台来实现


## 四、即时通信 IM

> 在直播中加入Im功能，参考[腾讯云IM](https://cloud.tencent.com/document/product/269)接入

- https://github.com/tencentyun/TIMSDK/tree/master/WXMini
- https://cloud.tencent.com/document/product/269/37448
- [IM sdk文档](https://imsdk-1252463788.file.myqcloud.com/IM_DOC/Web/SDK.html#createTextMessage)

## 五、完整示例

> 实现效果

![](https://poetries1.gitee.io/img-repo/2020/06/13.png)

> 部分代码参考 https://github.com/poetries/weapp-live

