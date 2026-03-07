---
title: Taro开发小程序体验
date: 2018-09-03 19:30:43
tags: 
  - 小程序
  - Taro
categories: Front-End
---



## 一、初识Taro

### 1.1 优点

> 小程序中无法使用 `npm` 来进行第三方库的管理，无法使用一些比较新的 `ES` 规范等等，针对小程序端的开发弊端，`Taro` 具有以下的优秀特性

- 支持使用 `npm/yarn` 安装管理第三方依赖。
- 支持使用 `ES7/ES8` 甚至更加新的 `ES` 规范，一切都可自行配置
- 支持使用 `CSS` 预编译器，例如 `Sass` 等
- 支持使用 `Redux` 进行状态管理
- 小程序 `API` 优化，异步 `API Promise` 化等


### 1.2 快速开始

> 微信小程序编译预览模式

```npm
# npm script
$ npm run dev:weapp
# 仅限全局安装
$ taro build --type weapp --watch
# npx用户也可以使用
$ npx taro build --type weapp --watch
```

> H5 编译预览模式

```npm
# npm script
$ npm run dev:h5
# 仅限全局安装
$ taro build --type h5 --watch
# npx用户也可以使用
$ npx taro build --type h5 --watch
```

> RN 编译预览模式

```npm
# npm script
$ npm run dev:rn
# 仅限全局安装
$ taro build --type rn --watch
# npx用户也可以使用
$ npx taro build --type rn --watch
```



**目录结构**

```
├── dist                   编译结果目录
├── config                 配置目录
|   ├── dev.js             开发时配置
|   ├── index.js           默认配置
|   └── prod.js            打包时配置
├── src                    源码目录
|   ├── pages              页面文件目录
|   |   ├── index          index页面目录
|   |   |   ├── index.js   index页面逻辑
|   |   |   └── index.css  index页面样式
|   ├── app.css            项目总通用样式
|   └── app.js             项目入口文件
└── package.json
```

> 进入项目目录开始开发，可以选择小程序预览模式，或者h5预览模式，若使用微信小程序预览模式，则需要自行下载并打开微信开发者工具，选择预览项目根目录

**注意**

- 需要设置关闭`ES6`转`ES5`功能，开启可能报错
- 需要设置关闭上传代码时样式自动补全，开启可能报错
- 需要设置关闭代码压缩上传，开启可能报错

### 1.3 语法风格

> Taro 的语法规则基于 `React` 规范，它采用与 `React` 一致的组件化思想，组件生命周期与 `React` 保持一致，同时在书写体验上也尽量与 `React` 类似，支持使用 `JSX` 语法

> 一个普通的入口文件示例如下`app.js`

```javascript
import Taro, { Component } from '@tarojs/taro'
import Index from './pages/index'

import './app.scss'

class App extends Component {
  // 项目配置
  config = {
    pages: [
      'pages/index/index'
    ],
    window: {
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: '#fff',
      navigationBarTitleText: 'WeChat',
      navigationBarTextStyle: 'black'
    }
  }

  componentWillMount () {}

  componentDidMount () {}

  componentDidShow () {}

  componentDidHide () {}

  render () {
    return (
      <Index />
    )
  }
}
```

## 二、生命周期函数

**App.js生命周期**

|生命周期方法|	作用|	说明|
|---|---|---|
|`componentWillMount`|	程序被载入|	对应微信小程序`onLaunch`|
|`componentDidMount`|	程序被载入|	对应微信小程序`onLaunch`，在`componentWillMount`之后执行|
|`componentDidShow`	|程序展示出来|	对应微信小程序`onShow`|
|`componentDidHide`|	程序被隐藏|	对应微信小程序onHide|

> 不过当然也包含`componentWillUnmout`和`componentWillReceiveProps`等`react`原始生命周期函数，用来编写自定义组件


**页面生命周期**

|生命周期方法|作用|	说明|
|---|---|---|
|`componentWillMount	`|页面被载入|	在微信小程序中这一生命周期方法对应 `onLoad`|
|`componentDidMount`|	页面渲染完成|	在微信小程序中这一生命周期方法对应 `onReady`|
|`shouldComponentUpdate`|	页面是否需要更新	| |
|`componentWillUpdate`|	页面即将更新|	|
|`componentDidUpdate	`|页面更新完毕|	|
|`componentWillUnmount`|	页面退出|	在微信小程序中这一生命周期方法对应 `onUnload`|
|`componentDidShow`|	页面展示出来|	在微信小程序中这一生命周期方法对应`onShow`，在`H5`中同样实现|
|`componentDidHide`|	页面被隐藏|	在微信小程序中这一生命周期方法对应 `onHide`，在`H5`中同样实现|

> 微信小程序中 `onLoad` 通常带有一个参数 `options`，在 `Taro` 中你可以在所有生命周期方法中通过 `this.$router.params `访问到，在其他端也适用


## 三、路由

> 我们只需要在入口文件的 `config `配置中指定好 `pages`，然后就可以在代码中通过` Taro` 提供的 API 来跳转到目的页面，例如


```javascript
// 跳转到目的页面，打开新页面
Taro.navigateTo({
  url: '/pages/page/path/name'
})

// 跳转到目的页面，在当前页面打开
Taro.redirectTo({
  url: '/pages/page/path/name'
})
```

**传参**

> 我们可以通过在所有跳转的 url 后面添加查询字符串参数进行跳转传参，例如


```javascript
// 传入参数 id=2&type=test
Taro.navigateTo({
  url: '/pages/page/path/name?id=2&type=test'
})
```

> 这样的话，在跳转成功的目标页的生命周期方法里就能通过 `this.$router.params` 获取到传入的参数，例如上述跳转，在目标页的 `componentWillMount` 生命周期里获取入参


```javascript
class C extends Taro.Component {
  componentWillMount () {
    console.log(this.$router.params) // 输出 { id: 2, type: 'test' }
  }
}
```

## 四、专属的方法

> 在小程序中，页面还有在一些专属的方法成员，如下

|方法|	作用|
|---|---|
|`onPullDownRefresh`|	页面相关事件处理函数--监听用户下拉动作|
|`onReachBottom`|	页面上拉触底事件的处理函数|
|`onShareAppMessage`|	用户点击右上角转发|
|`onPageScroll`|	页面滚动触发事件的处理函数|
|`onTabItemTap`|	当前是 tab 页时，点击 `tab` 时触发|

> 以上成员方案在 `Taro` 的页面中同样可以使用，书写同名方法即可，不过需要注意的，目前暂时只有微信小程序端支持这些方法，编译到H5端后这些方法均会失效

## 五、更多参考

- [Taro文档](https://nervjs.github.io/taro/)
- [Taro-UI](https://taro-ui.aotu.io/#/)
- [一文看懂，支撑京东核心业务小程序的统一开发框架「Taro」](https://baijiahao.baidu.com/s?id=1603297934363840853&wfr=spider&for=pc)

