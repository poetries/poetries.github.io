---
title: H5之微信公众号分享 JS-SDK接入与二次分享失效排查
description: 微信公众号 H5 分享完整接入笔记，含 JS-SDK 五步配置、分享文案规范、updateAppMessageShareData 用法，以及 hash 路由二次分享失效的两种解法。
date: 2020-05-24 13:21:43
tags:
  - 公众号分享
  - 微信JS-SDK
  - H5
categories: Front-End
---

活动页做完了，测试提了个 bug：分享到朋友圈之后，标题变成了一串网址，图标是默认的灰色地球。改完签名逻辑，标题图标都正常了，测试又提了个新的：第一个人分享出去是好的，第二个人从群里点进来再转发，标题又变回网址了。

这两个问题背后是同一件事，微信的分享签名和当前页面 URL 是绑死的。这篇把公众号 H5 分享从零接入的完整过程记一遍，JS-SDK 的五个步骤、分享接口的用法、平台对文案和图片的硬性要求，重点是最后那个二次分享失效的坑怎么绕过去。

使用微信的分享功能，需要使用微信 `JS-SDK` 来完成，而且只能点击微信右上角的 `...` 调起分享面板，不能直接由页面行为唤起。本文用的是当时的 js-sdk 最新版。

[微信JS-SDK](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html)是微信公众平台面向网页开发者提供的基于微信内的网页开发工具包。通过使用微信 `JS-SDK`，网页开发者可借助微信高效地使用拍照、选图、语音、位置等手机系统的能力，同时可以直接使用微信分享、扫一扫、卡券、支付等微信特有的能力。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- JS-SDK 接入的五个步骤，以及 `config`、`ready`、`error` 三者的执行关系
- 所有接口通用的五个回调参数分别在什么时候触发
- 微信对分享标题、图标、描述、链接的硬性规范和文案红线
- `updateAppMessageShareData` 和 `updateTimelineShareData` 两个接口的用法
- 分享出去的链接为什么会被微信加上 query，以及它怎么把签名搞坏的
- hash 路由下二次分享失效的两种解法和各自的代价
- 一份 React 项目里的完整落地代码

## 一、JSSDK使用步骤

### 1.1 步骤一 绑定域名

登录微信公众平台，进入公众号设置，功能设置，填写「JS接口安全域名」。

这一步是所有后续工作的前提。域名没绑，`wx.config` 直接就返回 `invalid url domain`，代码写得再对也没用。填的是域名不带协议和路径，而且需要在域名根目录放一个微信给的校验文件。

### 1.2 步骤二 引入JS文件

在需要调用 JS 接口的页面引入如下 JS 文件，支持 https：http://res.wx.qq.com/open/js/jweixin-1.6.0.js

如需进一步提升服务稳定性，当上述资源不可访问时，可改访问：http://res2.wx.qq.com/open/js/jweixin-1.6.0.js，同样支持 https。

备注：支持使用 AMD/CMD 标准模块加载方法加载。

实际接入时直接写 `https` 就行，你的页面本来也必须是 HTTPS，页面里混着引 HTTP 资源会被浏览器直接拦掉。

### 1.3 步骤三 通过config接口注入权限验证配置

所有需要使用 JS-SDK 的页面必须先注入配置信息，否则将无法调用。

```js
wx.config({
  debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
  appId: '', // 必填，公众号的唯一标识
  timestamp: 0, // 必填，生成签名的时间戳
  nonceStr: '', // 必填，生成签名的随机串
  signature: '',// 必填，签名
  jsApiList: [] // 必填，需要使用的JS接口列表
});
```

关于 `config` 有几条要记住：

- `config` 是一个客户端的异步操作
- 在引入 `JS-SDK` 后调用，也应该尽可能早地调用
- 同一个 `url` 仅需调用一次
- 对于变化 `url` 的 `SPA` 类型的 web app，可在每次 `url` 变化时进行调用
- 低于 `Android6.2` 版本的微信客户端，不支持 `pushState` 这个 H5 新特性，使用 pushState 来实现 web app 的页面会导致签名失败

`appId`、`timestamp`、`nonceStr`、`signature` 这四个值全部由后端计算后返回，前端不要自己拼。签名的原始串里包含 `jsapi_ticket` 和当前页面的完整 URL，`jsapi_ticket` 有有效期而且有每日调用次数上限，必须在服务端缓存，不能每次请求都去微信那里换一次。

`debug: true` 在联调期间一定要开着，配置错了它会直接 alert 出具体的错误码，比自己一行行猜快太多。上线前记得关掉，不然用户会被弹窗糊一脸。

### 1.4 步骤四 通过ready接口处理成功验证

```js
wx.ready(function(){
  // config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
});
```

由于 `config` 是一个异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在 `ready` 函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在 `ready` 函数中。

注意一个反直觉的点：无论 `config` 成功或失败，`ready` 中的内容都会被执行。

所以别把 `ready` 当成「配置成功」的信号。它只表示配置流程走完了，成功与否得看 `error` 有没有被触发。想在分享设置失败时降级，判断逻辑要写在 `error` 里，不能靠 `ready` 里的接口调用是否报错去推断。

### 1.5 步骤五 通过error接口处理失败验证

```js
wx.error(function(res){
  // config信息验证失败会执行error函数，如签名过期导致验证失败，具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。
});
```

注释里最后半句是重点：对于 SPA 可以在这里更新签名。单页应用路由一变签名就可能失效，`error` 就是你重新去后端换一次签名再 `config` 的机会。

### 1.6 通用参数

所有接口通过 `wx` 对象，也可使用 `jWeixin` 对象来调用。参数是一个对象，除了每个接口本身需要传的参数之外，还有以下通用函数参数：

- `success` 接口调用成功时执行的回调函数
- `fail` 接口调用失败时执行的回调函数
- `complete` 接口调用完成时执行的回调函数，无论成功或失败都会执行
- `cancel` 用户点击取消时的回调函数，仅部分有用户取消操作的 api 才会用到
- `trigger` 监听 Menu 中的按钮点击时触发的方法，该方法仅支持 Menu 中的相关接口

回调参数的结构是这样：

```js
// 回调参数：

{
    xxx: xxx,
    errMsg: '' // 接口调用成功/失败信息
}
```

`errMsg` 是排查问题的第一手信息，格式大致是「接口名:结果」，比如 `config:ok`、`config:invalid signature`。埋点或者错误上报的时候把这个字段带上，线上出问题能直接定位。

## 二、微信分享

用户调用微信的分享功能，可以自定义分享的 title 和描述，以及小图标和链接，可以分享到群、好友、朋友圈、QQ、QQ空间等。

### 2.1 分享设计规范

这一组规范不是建议，是硬性要求，不满足会直接导致分享效果异常：

- 分享标题：14 字以内，建议使用朋友般亲切的口吻
- 分享图标：尺寸 `120*120`，大小不超过 `10K`，不支持 `GIF` 格式，必须采用 `https` 协议
- 分享描述：`20` 字以内，对标题的简要解读
- 分享链接：外链页面所在服务器至少能支持每秒 `1500` 次的访问压力，且每次访问的响应时间在 `200ms` 以内，必须采用 `https` 协议
- 分享行为：页面上无分享按钮，页面上无诱导分享行为，包含但不限于分享后才能看到特定的信息、分享后才能进行下一步流程、分享后可以获得奖励等
- 分享文案：分享时文案和图片可以正常显示，分享后链接可以访问
- 分享标题和描述不能出现敏感词汇，否则会导致部分不可预知的问题，比如分享者可以看到分享图标，被分享者看不到图标

敏感词举例：红包、现金、到账等。

图标那条我踩过。设计给的图是 200KB 的 PNG，本地测试一切正常，因为图已经在缓存里了。发到测试群里让别人点，一半人看不到图标。图标是被分享方的客户端现去拉的，超过 10K 或者服务器慢一点，它就直接放弃了。

分享的图标链接和分享链接尽量保持为同一域名下的资源，否则可能会出现分享不成功或分享图标不显示的情况。

由于不能由页面直接唤起微信的分享面板，所以就需要一个弹窗浮层来引导用户去点击 `...` 按钮唤起分享面板。注意这个弹窗浮层不能出现诱导分享的内容。

### 2.2 分享或广告文案禁止内容

这一段建议直接转给写文案的同学：

- 特殊字符：不允许使用特殊字符与符号，例如 `:）` `-。-` 这类；不允许使用 `emoji` 表情
- 诱导或引导操作：不允许出现诱导或引导用户操作的描述，包含但不限于「请点击查看详情」「赶快戳开看一看」「点一下下面你就知道是什么」「点击下方了解公众号」
- 微信产品功能词汇：未经微信官方授权，禁止使用以下产品功能词汇及其谐音词汇，包含但不限于「朋友圈」「点赞」「评论」「公众号」「微信」「红包」
- `URL`：不允许直接放 URL 链接内容
- 电话号码：不允许出现电话号码
- 破折号：不允许出现破折号，它在移动端显示容易产生歧义
- 空行和空格：不允许使用空行或空格
- 不规范折行：不允许出现单个词语或文字折行
- 股票代码：不允许出现公司股票代码
- 非简体中文文字、方言、小语种：不允许使用非简体中文文字（单字、词语、成语），暂不支持使用方言和小语种作为文案
- 产品销量数据：不允许使用任何维度的产品销量数据

这份清单是当时整理的，平台的运营规范会更新，正式投放前请以微信当时的官方规范为准。

## 三、分享接口

### 3.1 自定义「分享给朋友」及「分享到QQ」按钮的分享内容

这个接口从 `1.4.0` 版本开始提供：

```js
wx.ready(function () {   //需在用户可能点击分享按钮前就先调用
  wx.updateAppMessageShareData({
    title: '', // 分享标题
    desc: '', // 分享描述
    link: '', // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
    imgUrl: '', // 分享图标
    success: function () {
      // 设置成功
    }
  })
});
```

### 3.2 自定义「分享到朋友圈」及「分享到QQ空间」按钮的分享内容

同样是 `1.4.0` 版本：

```js
wx.ready(function () {      //需在用户可能点击分享按钮前就先调用
  wx.updateTimelineShareData({
    title: '', // 分享标题
    link: '', // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
    imgUrl: '', // 分享图标
    success: function () {
      // 设置成功
    }
  })
});
```

注意 `updateTimelineShareData` 没有 `desc` 字段，朋友圈只显示标题和图标。所以标题得能独立成立，不能写成「详情见描述」这种依赖描述的句子。

这两个接口最容易被误解的地方是 `success` 回调。它表示的是「分享内容设置成功」，不是「用户完成了分享」。老版本 JS-SDK 里那两个带 `onMenuShare` 前缀的接口曾经能拿到用户确认分享的回调，新接口出于反诱导分享的考虑把这个能力收掉了。所以「分享后送积分」这种玩法，从接口层面就已经做不了了。

老的 `onMenuShareTimeline` 和 `onMenuShareAppMessage` 在文档里被标注为即将废弃，新项目直接用 `updateTimelineShareData` 和 `updateAppMessageShareData` 这一组。

## 四、分享开发调试时注意事项

先说两条结论：

- 分享出去的外链的域名必须和公众号后台配置的 JS 安全域名一致，否则会导致分享失败
- 分享出去的外链，会被微信自动加上标识参数，导致二次分享失败

第二条就是开头那个测试提的 bug。展开说一下它是怎么发生的。

假如你打开的页面是：

```
https://www.xxx.com/m/#/activity/invite/friends
```

分享出去之后，别人拿到的链接会变成：

```
https://www.xxx.com/m/?from=groupmessage&isappinstalled=0#/activity/invite/friends
```

微信自动在分享后面加上了 query 字符串，含义是这样：

```
from=groupmessage   分享到群
from=timeline  分享到朋友圈
from=singlemessage  分享到好友
isappinstalled=0    0或1，表示是否安装了app
```

安卓手机分享到朋友圈的链接，只会带 `from=timeline`。

那这个 query 为什么会把签名搞坏呢？

因为微信的签名生成时需要传一个 `url` 参数，而这个 `url` 是通过下面这句拿到的：

```js
location.href.split('#')[0]
```

取的是 URL 中 `#` 前面的部分来生成签名。第一次分享成功时，生成签名的 URL 是不带 query 字段的。通过一次分享出去的链接带上了 query 之后，`#` 前面的部分就变了，之前生成的签名对不上，导致二次分享失败。

问题的根子在于 hash 路由把真实路径藏在了 `#` 后面，而微信偏偏往 `#` 前面塞参数。

解决办法有两个。

第一个是替换路径，进页面先把这些参数洗掉：

```js
let href = window.location.href;
if(href.indexOf('groupmessage') > -1 || href.indexOf('singlemessage') > -1 || href.indexOf('timeline') > -1){
    href = href.replace(/\?from=(groupmessage|singlemessage|timeline)(\S*)#/, '#');
    window.location.href = href;
}
```

不过这样会导致页面请求两次，细心的用户可能会感知到。或者用户网络不稳定时，他会感觉到页面刷新了两次。

第二个是生成签名的时候动态获取 url，传给生成签名的接口。每次打开页面时，都获取到 URL 中 `#` 前面的部分传给签名生成接口，保证每次的签名都是有效的。

这两个方案我更推荐第二个。第一个是在客户端把 URL 掰回原样，属于绕；第二个是承认 URL 会变，让签名跟着 URL 走，属于正面解决。第一个方案还有个隐藏代价，`window.location.href` 赋值会触发一次完整的页面加载，SPA 的首屏成本又付了一遍。

如果你的项目还没定路由模式，直接用 history 模式能少掉大半麻烦，因为路径在 `#` 前面，微信加的 query 也在 `#` 前面，两者本来就在同一个签名范围里，只要签名用的是当前完整 URL 就一直有效。

## 五、实战

下面是一个 hash 路由项目里的完整落地代码，分享链接到朋友圈时需要特殊处理 URL。

第一步，请求后端接口拿到微信配置信息，然后注入：

```js
// 请求后台接口 获取微信配置信息
*getWxSignature({ payload, callback }, { call, put, select }) {
  const res = yield call(rGetWxSign, payload);

  if(res.code !==0) {return;}

  // 通过config接口注入权限验证配置
  wx.config({
    debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来
    appId: res.data.appId, // 必填，公众号的唯一标识
    timestamp: res.data.timestamp, // 必填，生成签名的时间戳
    nonceStr: res.data.nonceStr, // 必填，生成签名的随机串
    signature: res.data.signature, // 必填，签名，见附录1
    jsApiList: [
      'updateTimelineShareData',
      'updateAppMessageShareData'
    ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
  })
}
```

`jsApiList` 里要写全你会用到的接口名，漏了哪个，调用时就报没有权限。

第二步，取当前页面 URL 时把 hash 砍掉，再传给签名接口：

```js
// 获取微信签名
getWxSignature() {
  let url = location.href
  // 如果页面url是hash路由形式 需要处理一下参数
  let i = url.indexOf('#')
  if (i !== -1) {
    url = url.substring(0, i)
  }
  dispatch({
    type: `${namespace}/getWxSignature`,
    payload: {url}
  });
}
```

这就是上面说的第二种解法，签名跟着当前 URL 走。这里传给后端的 URL 必须和前端 `location.href` 的 `#` 前半段一字不差，多一个斜杠或者少一个参数都会导致 `invalid signature`。

第三步，页面加载完成后注册分享内容：

```js
// 页面加载完成就执行初始化监听
handleWxShare = ()=>{
    const {pagedata: {mainData={},projectInfo={}}} = this.props;

    wx.ready(() => {
      console.log('wx.ready:',projectInfo)
      // 所有接口调用都必须在config接口获得结果之后
      let linkUrl = location.href

      // 监听右上角分享到朋友圈事件
      wx.updateTimelineShareData({
        title: mainData.title, // 分享标题
        desc: (projectInfo.project || {}).projectName || '', // 分享描述
        link: linkUrl, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
        imgUrl: mainData.sharePicUrl, // 分享图标
        success: () => {
          console.log('分享成功')
        },
        cancel: () => {
          console.log('取消分享')
        }
      })
    })

    wx.error(function(res){
      // config信息验证失败会执行error函数，如签名过期导致验证失败，对于SPA可以在这里更新签名
      console.log(res,'wx error')
    });
  }
```

发送给朋友的接口写法完全一样，只是换成 `updateAppMessageShareData`：

```js
// 监听右上角发送给朋友事件
wx.updateAppMessageShareData({
  title: mainData.title, // 分享标题
  desc: (projectInfo.project || {}).projectName || '', // 分享描述
  link: linkUrl, // 分享链接
  imgUrl: mainData.sharePicUrl, // 分享图标
  success: () => {
    console.log('分享成功')
  },
  cancel: () => {
    console.log('取消分享')
  }
})
```

最后是那段兜底的 URL 清洗，放在 `componentDidMount` 里：

```js
componentDidMount() {
    // 微信分享到朋友圈、发送朋友分享的链接带上微信加上的参数 导致分享不了
    let href = window.location.href
    // from=groupmessage   分享到群
    // from=timeline  分享到朋友圈
    // from=singlemessage  分享到好友
    if(~href.indexOf('from=timeline') || ~href.indexOf('from=singlemessage') || ~href.indexOf('from=groupmessage')) {
      // 带有hash路由的链接分享到朋友圈会被微信带上?from=timeline 导致二次分享的链接打不开 需要重新处理
      // 如果是history模式下的路由 不需要另外处理
      window.location.href = `${location.origin}${location.pathname}${location.hash}`
    }
  }
```

这里用了 `~href.indexOf(...)` 这种老写法，`~-1` 等于 0 是假值，其他下标都是真值。现在直接写 `href.includes('from=timeline')` 更清楚，行为完全一样。这段是 2020 年的代码，`includes` 那会儿在部分安卓 WebView 上还得靠 polyfill，现在没这个顾虑了。

顺带一提，`class` 组件加 `componentDidMount` 这套写法现在一般换成函数组件加 `useEffect`，逻辑不变，只是位置从生命周期方法挪到了副作用钩子里。

## 六、这几年变了什么

这篇是 2020 年 5 月写的，有几处需要更新说明。

微信公众平台后台的菜单位置这几年调整过。文中「公众号设置 - 功能设置 - JS接口安全域名」这个路径会随后台改版变动，请以你打开时实际看到的后台为准。找不到的时候用后台自带的搜索功能搜关键词通常最快。

JS-SDK 的版本。文中用的是 `1.6.0`，后续微信发布过新版本。分享这块的接口用法本身变化不大，但接入前建议对照一遍官方文档当前推荐的版本号。

分享规范和文案红线。第二节那两份清单是当时整理的，平台的运营规范一直在更新，正式投放之前请以微信当时的官方规范为准。

关于 SPA 签名还有一条经验值得提。社区里长期流传的说法是，iOS 微信客户端里对 SPA 做签名要用进入页面时的那个初始 URL，而不是路由跳转后的当前 URL；安卓则用当前 URL。我在自己的项目上遇到过这个现象，但没在各个客户端版本上系统验证过，这条只能当排查方向，具体行为以你的实测为准。

如果你的 H5 还要跳小程序，可以看看这篇：[微信h5网页跳转小程序方案](https://feinterview.poetries.top/blog/weapp-h5-jump)，两者用的是同一套 JS-SDK 配置，签名逻辑可以复用。

## 总结

公众号 H5 分享这套流程，真正的难点只有一个，就是签名和 URL 的绑定关系。绑定域名、引入 JS、`config`、`ready`、`error` 这五步都是照文档抄，抄对了就能跑；出问题的永远是 URL 变了而签名没跟着变。

hash 路由的项目一定要处理二次分享。微信会往 `#` 前面塞 `from=timeline` 这类参数，而签名取的正是 `#` 前面那一段，一旦对不上就失效。两种解法里，我更推荐每次进页面用当前 URL 去后端换签名，而不是在前端把 URL 洗回原样再刷新一次。新项目如果能选，直接用 history 模式，这个坑本身就不存在。

还有几个小点别忘：分享图标必须 https、小于 10K、不能是 GIF，超了别人看不到图；`ready` 无论成功失败都会执行，不能拿它当成功信号；`success` 回调表示的是设置成功而不是用户完成了分享，靠它做分享奖励是行不通的。

## 参考

- [微信JS-SDK说明文档](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html)
- [微信公众平台 分享接口相关说明](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html#4)
- [微信开放社区](https://developers.weixin.qq.com/community/develop/mixflow)
- [前端进阶之旅](https://interview.poetries.top)
