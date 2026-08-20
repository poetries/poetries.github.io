---
title: 微信h5网页跳转小程序方案 开放标签实战
description: 用微信 JS-SDK 的 wx-open-launch-weapp 开放标签，让公众号 H5 网页一键跳转小程序，含接入条件、Vue 落地代码、版本判断与降级方案。
date: 2020-07-24 12:01:24
tags:
  - 小程序
  - 微信JS-SDK
  - H5
categories: Front-End
---

公众号里推了一个活动 H5，用户看完想下单，结果下单流程在小程序里。以前只能在页面上放一张小程序码，配一行「长按识别进入小程序」，用户长按、识别、确认，三步走完还得再找一遍商品。转化率什么样可想而知。

微信后来开放了一组开放标签，其中 `wx-open-launch-weapp` 就是专门解决这件事的，H5 上放一个按钮，点一下直接拉起指定小程序的指定页面。这篇把接入过程完整记一遍，从资格确认、JS-SDK 配置，到在 Vue 项目里的具体写法，再到版本判断和降级。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 开放标签的主体资格和系统版本门槛，哪些账号根本接不了
- 微信 JS-SDK 的两种引入方式，以及 `openTagList` 这个容易漏的字段
- 在 Vue 项目里让自定义标签不报错的配置
- 怎么判断微信版本，以及原文那段版本判断代码为什么是错的
- 开放标签内部的样式限制和 `username`、`path` 两个参数的填法
- `launch` 和 `error` 两个回调事件怎么用
- 微信后台的配置路径这几年的变化，和相关的注意事项

## 一、先确认你有没有资格接

这一步别跳过，很多人代码写完了才发现账号根本用不了这个能力。

主体要求上，开放标签仅开放给已认证的服务号。订阅号不行，未认证的服务号也不行。如果你手上是个订阅号，到这里就可以停了，得先去做认证或者换主体。

系统要求上，微信版本要求为 `7.0.12` 及以上，系统版本要求为 `iOS 10.3` 及以上、`Android 5.0` 及以上。低于这个版本的客户端上，开放标签是渲染不出来的，页面上就是一片空白。

所以降级方案不是可选项，是必选项。

除了这两条硬门槛，还有两个前置动作要做：页面必须部署在公众号后台配置过的 JS 接口安全域名下，并且必须是 HTTPS。这两条不满足的话，`wx.config` 那一步就直接过不去。

## 二、接入微信JS-SDK

有两种引入方式，看你的项目是什么形态。

包使用方式，适合有构建流程的工程化项目：

```js
"weixin-js-sdk": "^1.6.0"
```

直接在页面上使用，适合传统的多页项目。在需要调用 JS 接口的页面引入如下 JS 文件：`http://res.wx.qq.com/open/js/jweixin-1.6.0.js`，这个地址是支持 `https` 的。实际接入时请直接写 `https`，因为你的页面本来就必须是 HTTPS，混着引 HTTP 资源会被浏览器拦掉。

引入之后调 `wx.config` 注入配置：

```js
wx.config({
  appId: '',
  debug: true,
  timestamp: '',
  nonceStr: '',
  signature: '',
  jsApiList: [],
  openTagList: ['wx-open-launch-app','wx-open-launch-weapp'] // 获取开放标签权限
});
```

这段配置里最容易漏的就是 `openTagList`。很多人照着普通 JS-SDK 的文档抄，只填了 `jsApiList`，然后发现按钮死活不出来。开放标签的权限和普通 JS 接口的权限是分开申请的，用到哪个标签就把哪个标签名写进 `openTagList`。

需要注意的点归纳成三条：

- `wx.config` 内要列出使用到的 `openTagList`
- 要符合开放平台列出的要求，见 `https://developers.weixin.qq.com/doc/oplatform/Mobile_App/WeChat_H5_Launch_APP.html`
- 如果你还要跳 App，App 端需要按文档接入微信 SDK，见 `https://developers.weixin.qq.com/doc/oplatform/Mobile_App/Access_Guide/iOS.html`

`signature` 那几个字段是后端算好返回给你的，不要在前端拼。签名的原始串里包含当前页面的 URL，这块的坑我在另一篇里写得比较细，可以对照着看：[H5之微信公众号分享](https://feinterview.poetries.top/blog/wx-share)。

在微信开发者工具内打开你的网页测试，如果显示这样的返回，说明你已经接入 JS-SDK 成功了：

```js
{errMsg: "config:ok"}
```

调试期间 `debug: true` 一定要开着，配置错了它会直接 alert 出具体原因，比自己猜快得多。上线前记得关掉。

## 三、在Vue中使用例子

下面这套是在 Vue 2 项目里的完整落地过程，分四步。

### 第1步 在main.js中设置

`wx-open-launch-weapp` 不是标准 HTML 元素，也不是 Vue 组件，Vue 在编译模板时碰到它会警告「未知的自定义元素」。所以要先告诉 Vue 忽略这几个标签：

```js
// 忽略微信自定义标签
Vue.config.ignoredElements = ['wx-open-launch-weapp','wx-open-launch-app']
```

这行代码不写不会导致功能不可用，但控制台会一直刷警告。而且在某些构建配置下警告会被当成错误处理，直接把编译卡住。

### 第2步 获取微信版本

先判断是不是在微信环境里，再取版本号：

```js
// 判断微信环境内
isWechat() {
  let ua = window.navigator.userAgent.toLowerCase()
  // console.log(ua)
  if (ua.match(/MicroMessenger/i)) {
    return true
  } else {
    return false
  }
},

// 获取微信版本
// return eg. 7.0.16.1600
getWeixinVersion() {
  return navigator.userAgent.match(/MicroMessenger\/([\d\.]+)/i)[1]
},
```

`getWeixinVersion` 里直接对 `match` 的结果取下标是有风险的，非微信环境下 `match` 返回 `null`，这句会直接抛错。原文用 `isWechat() && getWeixinVersion()` 的短路写法把它挡住了，逻辑上没问题，但如果这个函数被别处单独调用就会炸。稳妥的做法是在函数内部自己判空。

然后在 `created` 里做版本比较：

```js
created(){
  // 微信版本号大于 7.0.12 开放标签才可进行
  const wxVersion = this.isWechat() && this.getWeixinVersion() || ''
  if(wxVersion){
    let v = wxVersion.split('.')
    if(v[0]>=7){
      if(v[1]>=0){
        if(v[2]>=12){
          this.enableLaunchWeapp = true
        }
      }
    }
  }
},
```

这段是原文的写法，我当时也是这么写的。但这里有个坑要注意，这个三层嵌套的判断是错的。

你想想看，微信版本走到 `8.0.5` 的时候会发生什么？`v[0]` 是 8，大于 7，进第一层；`v[1]` 是 0，进第二层；`v[2]` 是 5，小于 12，判断失败。结果一个明显比 `7.0.12` 新的版本被当成了低版本，开放标签被降级掉了。

版本号比较不能逐段独立判断，要按位比较并且高位分出胜负就立即返回。改成这样：

```js
// 把版本号按段比较，高位一旦分出大小就返回，避免 8.0.5 被误判
function gteVersion(current, target) {
  const a = String(current).split('.').map(Number)
  const b = String(target).split('.').map(Number)
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const x = a[i] || 0
    const y = b[i] || 0
    if (x > y) return true
    if (x < y) return false
  }
  return true
}
```

调用起来就一行：

```js
created(){
  const wxVersion = this.isWechat() ? this.getWeixinVersion() : ''
  this.enableLaunchWeapp = !!wxVersion && gteVersion(wxVersion, '7.0.12')
},
```

微信版本号有时候是四段的，比如注释里那个 `7.0.16.1600`，上面这个函数对段数不一致的情况也能正确处理，多出来的位按 0 补。

### 第3步 在页面上展示

如果微信版本低于 `7.0.12`，开放标签是无法使用的，需要降级处理。所以模板里用 `enableLaunchWeapp` 分了两个分支：

```html
<div v-if="enableLaunchWeapp">
  <wx-open-launch-weapp
    id="launch-btn"
    username="gh_edc489d117fa3d"
    path="/pages/home/index.html"
  >
    <script type="text/wxtag-template">
      <style>
        .goodsname {
          font-size: 16px;
          color: #333333;
          font-weight: 600;
          line-height: 24px;
          margin-bottom: 5px;
        }
      </style>
      <h1 class="goodsname">{{ goodsInfo.goodsName }}</h1>
    </script>
  </wx-open-launch-weapp>
</div>
<h1 v-else>{{ goodsInfo.goodsName }}</h1>
```

上面 `username` 那个值是示例，换成你自己小程序的原始 ID。

这段模板里有四个点必须说清楚，每一个我都卡过：

- 在 Vue 中需要用 `text/wxtag-template` 类型的脚本标签把内容包裹起来，否则按钮不能展示。这个标签不是真的脚本，微信会把它的内容当成模板取出来渲染到开放标签内部
- `username` 为小程序原始 ID，以 `gh_` 开头，需要在小程序后台的设置里获取。注意不是 AppID，这两个很容易搞混
- `path` 是打开小程序的指定页面，需要加上 `.html`，比如 `/pages/home/index.html`
- `style` 中的样式写法需要注意，`goods-name` 这种带连字符的类名好像不支持，需要写成 `goodsname`，而且只支持 px 格式

最后这条我排查了挺久。开放标签内部是一块独立的渲染区域，外面的 CSS 进不去，里面的样式只能写在这个模板里的 `style` 块中，而且支持的属性和写法都是受限的。rem、vw 这些相对单位不要用，直接写 px。带连字符的类名不生效这条是我实测的结论，不排除后来微信放开了限制，具体请以官方文档为准。

还有一个视觉上的坑。开放标签渲染出来的是一个透明的可点击区域，覆盖在你的模板内容上。你在外面给 `wx-open-launch-weapp` 设的宽高如果和内部模板对不上，就会出现「按钮看着在这里，点了没反应」或者「按钮外面一圈也能点」的情况。稳妥的做法是给外层容器和内部模板设一样的尺寸。

### 第4步 监听开放标签回调事件

开放标签会派发两个自定义事件，`launch` 表示跳转指令已经发出，`error` 表示跳转失败：

```js
mounted(){
  var btn = document.getElementById('launch-btn')
  btn.addEventListener('launch', e => {
    console.log('success');
  });
  btn.addEventListener('error',  e => {
    console.log('fail', e.detail);
  });
}
```

`error` 回调里的 `e.detail` 是关键，跳转失败的具体原因都在里面。常见的失败原因是原始 ID 填错、小程序未发布、目标页面路径不存在、或者两个账号没有绑定在同一个开放平台主体下。有时候点了没反应又没有报错，先把 `e.detail` 打出来看一眼，能省不少时间。

这里有个时机问题。如果按钮是 `v-if` 条件渲染出来的，`mounted` 时它不一定已经在 DOM 里，`getElementById` 会拿到 `null`。用 `this.$nextTick` 包一层，或者把监听逻辑挪到 `enableLaunchWeapp` 变成 `true` 之后再执行。

另外提醒一句，`launch` 事件只代表跳转指令发出去了，不代表用户真的进了小程序。用户在确认弹窗上点了取消，也不会走 `error`。所以别把埋点的「跳转成功」直接挂在这个事件上。

## 四、这几年变了什么

这篇是 2020 年 7 月写的，有几处需要更新说明。

微信后台的菜单位置这几年调整过。文中提到的原始 ID 获取路径、JS 接口安全域名的配置入口，具体在哪一级菜单下会随着后台改版变动，请以你打开时实际看到的后台为准。找不到的时候用后台自带的搜索框搜关键词通常最快。

Vue 版本相关。`Vue.config.ignoredElements` 是 Vue 2 的全局配置。Vue 3 里这个配置换了位置和名字，需要在创建应用实例后通过编译选项里的自定义元素判断函数来声明，具体的配置项名称请以 Vue 官方文档为准。原理是一样的，都是告诉编译器「这个标签不是组件，原样输出就行」。

JS-SDK 的版本号。文中用的是 `1.6.0`，后续微信发布过新版本。开放标签这块的用法本身变化不大，但建议接入前对照一遍官方文档当前推荐的版本。

还有一点，`wx-open-launch-weapp` 依赖的公众号和小程序需要在同一个开放平台账号下完成绑定关系。这条要求在文档里的位置比较靠后，容易漏看，但它是跳转能不能成功的前提之一。

## 五、几个常见问题的排查顺序

真接入的时候出问题，按这个顺序查会快一些。

按钮完全不显示，先看 `wx.config` 是不是返回了 `config:ok`，再看 `openTagList` 有没有把用到的标签名写进去，最后看当前微信版本够不够 `7.0.12`。开着 `debug: true` 的话前两步会直接 alert 告诉你。

按钮显示了但点不动，八成是尺寸问题，检查外层容器和内部模板的宽高是不是对得上，以及有没有别的元素盖在上面。

点了报错，看 `e.detail`。原始 ID、页面路径、账号绑定关系这三样挨个核一遍。

在微信开发者工具里正常但真机不行，这种情况优先怀疑域名。开发者工具对安全域名的校验没有真机严格，真机上域名不在白名单里就是不工作。

在真机上正常但换了台手机不行，看微信版本和系统版本，这就是降级分支存在的意义。

## 总结

开放标签这套方案的接入成本不算高，四步代码就能跑通，但它的门槛全在代码之外：认证服务号、HTTPS、JS 安全域名、公众号和小程序的绑定关系，缺一个都不行。所以动手之前先花十分钟把资格和配置确认完，比写完代码再回头查要划算。

代码层面有两个点值得记住。一个是版本号比较不能像原文那样逐段独立判断，`8.0.5` 会被 `v[2]>=12` 直接判死，必须按位比较并在高位分出胜负时立即返回。另一个是开放标签内部是独立的渲染环境，样式写在内部模板的 `style` 块里，只用 px，别指望外面的 CSS 能进去。

降级分支不要省。开放标签用不了的时候，页面得能退回到原来那套长按识别小程序码的方案，而不是给用户看一片空白。

## 参考

- [微信公众平台 开放标签说明文档](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_Open_Tag.html)
- [微信 JS-SDK 说明文档](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html)
- [微信开放平台 H5 跳转 App 文档](https://developers.weixin.qq.com/doc/oplatform/Mobile_App/WeChat_H5_Launch_APP.html)
- [微信开放社区 开放标签相关讨论](https://developers.weixin.qq.com/community/develop/article/doc/0006c218d103a089e79a8720a56813)
- [前端进阶之旅](https://interview.poetries.top)
