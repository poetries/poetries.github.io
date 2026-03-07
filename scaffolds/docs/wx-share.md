---
title: H5之微信公众号分享
date: 2020-05-24 13:21:43
tags: 公众号分享
categories: Front-End
---

> 使用微信的分享功能，需要使用微信`JS-SDK`来完成。且只能点击微信右上角的`...`调起分享面板，不能直接由页面行为唤起！本教程使用js-sdk最新版

[微信JS-SDK](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html)是微信公众平台面向网页开发者提供的基于微信内的网页开发工具包。通过使用微信`JS-SDK`，网页开发者可借助微信高效地使用拍照、选图、语音、位置等手机系统的能力，同时可以直接使用微信分享、扫一扫、卡券、支付等微信特有的能力

## 一、JSSDK使用步骤

**1. 步骤一：绑定域名**

> 登录微信公众平台 --> 公众号设置 --> 功能设置 --> 填写“JS接口安全域名”

**2. 步骤二：引入JS文件**

- 在需要调用JS接口的页面引入如下JS文件，（支持https）：http://res.wx.qq.com/open/js/jweixin-1.6.0.js
- 如需进一步提升服务稳定性，当上述资源不可访问时，可改访问：http://res2.wx.qq.com/open/js/jweixin-1.6.0.js （支持https）。
- 备注：支持使用 AMD/CMD 标准模块加载方法加载

**3. 步骤三：通过config接口注入权限验证配置**

> 所有需要使用JS-SDK的页面必须先注入配置信息，否则将无法调用

```js
wx.config({
  debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
  appId: '', // 必填，公众号的唯一标识
  timestamp: , // 必填，生成签名的时间戳
  nonceStr: '', // 必填，生成签名的随机串
  signature: '',// 必填，签名
  jsApiList: [] // 必填，需要使用的JS接口列表
});
```

- `config`是一个客户端的异步操作
- 在`JS-SDK`后调用，也应该尽可能早的调用
- 同一个`url`仅需调用一次
- 对于变化`url`的`SPA`的`web app`可在每次`url`变化时进行调用
- 低于`Android6.2`版本的微信客户端，不支持`pushState`的H5新特性，使用pushState来实现web app的页面会导致签名失败

**4. 步骤四：通过ready接口处理成功验证**

```js
wx.ready(function(){
  // config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
});
```

> 由于config是一个异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中

**注**：无论`config`成功或失败，`ready`中的内容都会被执行！

**5. 步骤五：通过error接口处理失败验证**

```js
wx.error(function(res){
  // config信息验证失败会执行error函数，如签名过期导致验证失败，具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。
});
```

**6. 通用参数：**

> 所有接口通过`wx`对象(也可使用`jWeixin`对象)来调用，参数是一个对象，除了每个接口本身需要传的参数之外，还有以下通用函数参数：

- `success` 接口调用成功时执行的回调函数。
- `fail` 接口调用失败时执行的回调函数。
- `complete` 接口调用完成时执行的回调函数，无论成功或失败都会执行。
- `cancel` 用户点击取消时的回调函数，仅部分有用户取消操作的api才会用到。
- `trigger` 监听Menu中的按钮点击时触发的方法，该方法仅支持Menu中的相关接口。

```js
// 回调参数：

{
    xxx: xxx,
    errMsg: '' // 接口调用成功/失败信息
}
```

## 二、微信分享

> 用户调用微信的分享功能，可以自定义分享的title和描述，以及小图标和链接。可以分享到群、好友、朋友圈、QQ、QQ空间等

**分享设计规范**

- 分享标题：14字以内，建议使用朋友般亲切的口吻
- 分享图标：尺寸`120*120`，大小不超过`10K`，不支持`GIF`格式。必须采用`https`协议。
- 分享描述：`20`字以内，对标题的简要解读。
- 分享链接：外链页面所在服务器至少能支持每秒`1500`次的访问压力，且每次访问的响应时间`200ms`以内。必须采用`https`协议。
- 分享行为：**页面上无分享按钮**，页面上无诱导分享行为，包含但不限于分享后才能看到特定的信息，分享后才能进行下一步流程，分享后可以获得奖励等
- 分享文案：分享时“文案”和“图片”可以正常显示，分享后链接可以访问。
- 分享标题和描述不能出现敏感词汇，否则会导致部分不可预知的问题。比如分享者可以看到分享图标，被分享者看不到图标等。

> 敏感词举例：红包、现金、到账等

**注：** 分享的图标链接和分享链接尽量保持为同一域名下的资源。否则可能会出现分享不成功或分享图标不显示的情况。

> 由于不能由页面直接唤起微信的分享面板，所以就需要一个弹窗浮层来引导用户用户去点击`...`按钮唤起分享面板。注意这个弹窗浮层不能出现诱导分享的内容。

**分享或广告文案禁止内容：**

- 特殊字符：不允许使用特殊字符与符号 ，例如：`“：）” “-。-”`等； 不允许使用 `emoji` 表情
- 诱导或引导操作： 不允许出现诱导或引导用户操作的描述。包含但不限于以下文案：“请点击查看详情”、 “赶快戳开看一看”、“点一下下面你就知道是什么”、“点击下方了解公众号”
- 微信产品功能词汇：未经微信官方授权，禁止使用以下产品功能词汇及其谐音词汇。包含但不限于以下内容：“朋友圈” 、“点赞” 、“评论” 、“公众号”、 “微信”、 “红包”
- `URL`：不允许直接放URL链接内容
- 电话号码：不允许出现电话号码
- 破折号：不允许出现破折号，破折号在移动端显示容易产生歧义
- 空行&空格：不允许使用空行或空格
- 不规范折行：不允许出现单个词语或文字折行
- 股票代码：不允许出现公司股票代码
- 非简体中文文字&方言&小语种：不允许使用非简体中文文字（单字、词语、成语）。暂不支持使用方言和小语种作为文案。
- 产品销量数据：不允许使用任何维度的产品销量数据。

## 三、分享接口

**3.1 自定义“分享给朋友”及“分享到QQ”按钮的分享内容（1.4.0）**

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

**3.2 自定义“分享到朋友圈”及“分享到QQ空间”按钮的分享内容（1.4.0）**

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

## 四、分享开发调试时注意事项

- 分享出去的外链的域名必须和公众号后台配置的JS安全域名一致，否则会导致分享的失败
- 享出去的外链，会自动给加上微信标识，导致二次分享失败

```
如打开页面：

https://www.xxx.com/m/#/activity/invite/friends
分享出去链接：
```

> https://www.xxx.com/m/?from=groupmessage&isappinstalled=0#/activity/invite/friends 微信自动在分享后边加上了`query`字符串：

```
from=groupmessage   分享到群
from=timeline  分享到朋友圈
from=singlemessage  分享到好友
isappinstalled=0    0或1，表示是否安装了app
```

**注：安卓手机分享到朋友圈的链接**，只会带`from=timeline`

> 由于微信的签名生成时，需要传一个`url`参数，而这个`url`则是通过

```js
location.href.split('#')[0]
```

> 获取的`url`，取的是`url`的`#`前边的部分来生成签名，第一次分享成功，生成签名的`url`不带`query`字段。通过一次分享出去的链接，带上了`query`后，生成的签名就无效了，导致二次分享失败。

**解决办法：**

1. 替换路径

```js
let href = window.location.href;
if(href.indexOf('groupmessage') > -1 || href.indexOf('singlemessage') > -1 || href.indexOf('timeline') > -1){
    href = href.replace(/\?from=(groupmessage|singlemessage|timeline)(\S*)#/, '#');
    window.location.href = href;
}
```

> 不过这样，会导致页面请求两次，细心的用户可能会感知到。或者用户网络不稳定时，可能他会感觉到两次页面的刷新

2. 生成签名的时候，动态的获取url，传给生成签名的接口

> 每次打开页面时，都获取到url的#前边部分传给签名生成接口，保证每次的签名都是有效的

## 五、实战

> hash路由形式分享链接到朋友圈，需要特殊处理url

```js
// 请求后台接口 获取微信配置信息
*getWxSignature({ payload, callback }, { call, put, select }) {
  const res = yield call(rGetWxSign, payload);

  if(res.code !==0) {return;}

  // 通过config接口注入权限验证配置
  wx.config({
    debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
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

```js
// 页面加载完成就执行初始化监听
handleWxShare = ()=>{
    const {pagedata: {mainData={},projectInfo={}}} = this.props;
    const {pagequery} = this.state

    wx.ready(() => {
      console.log('wx.ready:',projectInfo)
      // config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
      let linkUrl = location.href

      // 监听右上角分享到朋友圈事件
      // 自定义“分享到朋友圈”及“分享到QQ空间”按钮的分享内容（1.4.0）
      wx.updateTimelineShareData({
        title: mainData.title, // 分享标题
        desc: (projectInfo.project || {}).projectName || '', // 分享描述
        link: linkUrl, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
        imgUrl: mainData.sharePicUrl, // 分享图标
        success: () => {
          // 用户确认分享后执行的回调函数
          console.log('分享成功')
        },
        cancel: () => {
          // 用户取消分享后执行的回调函数
          console.log('取消分享')
        }
      })
       // 监听右上角发送给朋友事件
       // 自定义“分享给朋友”及“分享到QQ”按钮的分享内容
       wx.updateAppMessageShareData({
        title: mainData.title, // 分享标题
        desc: (projectInfo.project || {}).projectName || '', // 分享描述
        link: linkUrl, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
        imgUrl: mainData.sharePicUrl, // 分享图标
        success: () => {
          // 用户确认分享后执行的回调函数
          console.log('分享成功')
        },
        cancel: () => {
          // 用户取消分享后执行的回调函数
          console.log('取消分享')
        }
      })
    })
    wx.error(function(res){
      // config信息验证失败会执行error函数，如签名过期导致验证失败，具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。
      console.log(res,'wx error')
    });
  }
```

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
      // https://zmjtest.kaisasso.com/wxapp/?from=timeline#/dsb/article?id=286&pid=20&uid=110
      window.location.href = `${location.origin}${location.pathname}${location.hash}` 
    }
  }
```
