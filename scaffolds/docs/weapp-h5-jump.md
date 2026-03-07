---
title: 微信h5网页跳转小程序方案
date: 2020-07-24 12:01:24
tags: 
  - 小程序
categories: Front-End
---


## 接入要求

- 主体要求: 仅开放给已认证的服务号
- 系统要求：微信版本要求为：`7.0.12`及以上。系统版本要求为：`iOS 10.3`及以上、`Android 5.0`及以上

## 接入微信JS-SDK

**包使用方式**

## 接入要求

- 主体要求: 仅开放给已认证的服务号
- 系统要求：微信版本要求为：`7.0.12`及以上。系统版本要求为：`iOS 10.3`及以上、`Android 5.0`及以上

## 接入微信JS-SDK

**包使用方式**

```js
"weixin-js-sdk": "^1.6.0"
```

**直接在页面上使用**

> 在需要调用JS接口的页面引入如下JS文件：`http://res.wx.qq.com/open/js/jweixin-1.6.0.js` （支持`https`）


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

**需要注意的点**

- `wx.config` 内列出使用到的 `openTagList`
- 符合开放平台列出的要求 `https://developers.weixin.qq.com/doc/oplatform/Mobile_App/WeChat_H5_Launch_APP.html`
- app 需要根据接入微信 sdk `https://developers.weixin.qq.com/doc/oplatform/Mobile_App/Access_Guide/iOS.html`

> 在微信开发者工具内打开你的网页测试如果显示

```js
{errMsg: "config:ok”}
```

> 说明你已经接入JS-SDK成功了

## 在vue中使用例子

## 第1步 在main.js中设置

```js
// 忽略微信自定义标签
Vue.config.ignoredElements = ['wx-open-launch-weapp','wx-open-launch-app']
```

## 第2步 获取微信版本

```js
// 获取微信版本
// return eg. 7.0.16.1600
getWeixinVersion() {
  return navigator.userAgent.match(/MicroMessenger\/([\d\.]+)/i)[1]
},
```

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

## 第3步 在页面上展示

> 如果微信版本低于7.0.12 开放标签是无法使用的，需要降级处理

```html
<div v-if="enableLaunchWeapp">
  <wx-open-launch-weapp
    id="launch-btn"
    username="gh_ed1212c48129d7fa3d"
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

**需要注意**

- 在`vue`中需要加上 `<script type="text/wxtag-template”></script>`包裹元素，否则按钮不能展示
- `username`为小程序原始id，需要在小程序后台设置那里获取
- `path`是打开小程序的指定页面，需要加上`.html` 如`/pages/home/index.html`
- `style`中样式写法需要注意，`goods-name` 好像不支持，需要这样写`goodsname`，只支持px格式

## 第4步 监听开发标签回调事件

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

## 更多参考

- 官方文档 https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_Open_Tag.html
- 其他讨论 https://developers.weixin.qq.com/community/develop/article/doc/0006c218d103a089e79a8720a56813
```js
"weixin-js-sdk": "^1.6.0"
```

**直接在页面上使用**

> 在需要调用JS接口的页面引入如下JS文件：`http://res.wx.qq.com/open/js/jweixin-1.6.0.js` （支持`https`）


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

**需要注意的点**

- `wx.config` 内列出使用到的 `openTagList`
- 符合开放平台列出的要求 `https://developers.weixin.qq.com/doc/oplatform/Mobile_App/WeChat_H5_Launch_APP.html`
- app 需要根据接入微信 sdk `https://developers.weixin.qq.com/doc/oplatform/Mobile_App/Access_Guide/iOS.html`

> 在微信开发者工具内打开你的网页测试如果显示

```js
{errMsg: "config:ok”}
```

> 说明你已经接入JS-SDK成功了

## 在vue中使用例子

## 第1步 在main.js中设置

```js
// 忽略微信自定义标签
Vue.config.ignoredElements = ['wx-open-launch-weapp','wx-open-launch-app']
```

## 第2步 获取微信版本

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

## 第3步 在页面上展示

> 如果微信版本低于7.0.12 开放标签是无法使用的，需要降级处理

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

**需要注意**

- 在`vue`中需要加上 `<script type="text/wxtag-template”></script>`包裹元素，否则按钮不能展示
- `username`为小程序原始id，需要在小程序后台设置那里获取
- `path`是打开小程序的指定页面，需要加上`.html` 如`/pages/home/index.html`
- `style`中样式写法需要注意，`goods-name` 好像不支持，需要这样写`goodsname`，只支持px格式

## 第4步 监听开发标签回调事件

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

## 更多参考

- 官方文档 https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_Open_Tag.html
- 其他讨论 https://developers.weixin.qq.com/community/develop/article/doc/0006c218d103a089e79a8720a56813
