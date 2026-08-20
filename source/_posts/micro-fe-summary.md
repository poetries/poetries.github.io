---
title: 微前端实战总结，从 single-spa 到 qiankun 的原理拆解
date: 2021-07-31 20:35:08
description: 拆解微前端的四个核心机制：路由劫持、资源加载、JS 沙箱与 CSS 隔离，配 single-spa、qiankun、icestark 三套可跑通的接入代码，讲清每一步在解决什么问题。
tags:
- 微前端
- qiankun
- single-spa
- icestark
- JS 沙箱
- 样式隔离
categories: Front-End
---

一个 Vue 2 写的后台管理系统跑了两年，产品说新模块要用 React 写，同时老的那十几个页面一个都不能动。这种需求听着像抬杠，但在稍微有点年头的公司里是常态。当时我第一反应是套个 `iframe` 得了，结果试了半天，弹层居中、刷新丢路由、父子通信，每一样都要单独写补丁。

后来才发现，这类问题社区早就有一整套答案，就是微前端。这篇把我自己啃 `single-spa` 和 `qiankun` 时理清的四件事写下来，路由怎么劫持、子应用资源怎么加载、JS 全局环境怎么隔离、样式怎么不互相污染。每一块都有能跑通的代码，也标了我踩过的坑。

![微前端架构总览](https://blog.poetries.top/img/static/images/20210710171426.png)

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 微前端到底在拆什么、合什么，什么情况下不值得上
- `single-spa` 做了哪些事、又故意不做哪些事
- `qiankun` 在 `single-spa` 之上补的那两块拼图
- 飞冰 icestark 的另一种接入姿势
- CSS 隔离的四条路子，每条在什么场景会失效
- 快照沙箱与 Proxy 沙箱的完整实现，以及各自的边界
- 应用间通信和公共依赖的几种处理方式

## 一、微前端在拆什么，又在合什么

微前端现有的落地方案大致能分三类，自组织模式、基座模式，以及模块加载模式。国内绝大多数团队用的是基座模式，也就是有一个主应用负责路由和调度，若干子应用挂在它下面。

![微前端的拆与合示意](https://blog.poetries.top/img/static/images/20210731160243.png)

一句话概括，微前端就是把不同功能按不同维度拆成多个子应用，再由一个主应用把它们加载回来。

> 微前端的核心在于拆，拆完后再合。

拆的动机通常是这三个里的某一个。第一个是技术栈打架，不同团队开发同一个应用，有人要用 React 有人守着 Vue 2，谁也说服不了谁。第二个是发版被绑死，一个仓库十几个模块，任何一个改动都要全量回归、全量发布。第三个是老代码不敢碰，项目里还留着几年前的页面，业务方不给重写预算，但新功能得用新技术写。

那把一个应用划成若干子应用，各自打包成 lib，路径切换时按需加载，是不是就都解决了？子应用独立构建、独立部署，技术栈也不再受主应用限制，协同开发这件事就顺了。

代价也得先说清楚。多一层运行时调度就多一层故障面，样式串了、子应用白屏、路由回退两次，这些排查链路都比普通 SPA 长。如果你的团队对整个系统有完全的话语权，也有人力做统一治理，那老老实实做模块化和 monorepo 可能更划算。上不上微前端，先算这笔账。

关于各家方案的横向对比和选型路径，我在 [微前端落地方案对比，qiankun 无界 Module Federation 怎么选](https://feinterview.poetries.top/blog/micro-frontend-comparison) 里写得更细，这篇专注讲机制本身。

## 二、从 single-spa 到 qiankun，各自补了什么

![single-spa 与 qiankun 的演进关系](https://blog.poetries.top/img/static/images/20210731154621.png)

时间线其实很短。2018 年 `single-spa` 出现，它把自己定位成「一个用于前端微服务化的 JavaScript 前端解决方案」，做的事情非常克制，只实现了路由劫持和应用加载，样式隔离和 JS 执行隔离一概不管。

2019 年蚂蚁的 `qiankun` 基于 `single-spa` 做二次封装，公式可以写成 `single-spa + sandbox + import-html-entry`。它补上了资源加载和运行时隔离这两块，接入方式做到了接近 `iframe` 那种开箱即用的程度。

所以子应用能独立构建、运行时动态加载、主子应用完全解耦并且技术栈无关，靠的不是什么黑魔法，是一份协议。这里提前强调一下，子应用必须导出 `bootstrap`、`mount`、`unmount` 三个方法，这就是协议的全部内容。

顺着上面聊几个大家一定会问的问题。

**这不就是 iframe 吗？**并不是。`iframe` 的隔离确实最彻底，但它有几个硬伤绕不过去。子应用切了三层路由，用户一刷新就回到首页；`iframe` 内部弹一个 Modal 想相对整个浏览器窗口居中，你得靠 `postMessage` 通知父页面画遮罩；每个 `iframe` 都要重新建一整套浏览器环境，白屏时间省不掉。这几条我都踩过，弹层一多代码就很难维护了。

**应用间怎么通信？**常见的有四种路子，按耦合度从低到高排：基于 URL 传参，能力最弱但最解耦；基于 `CustomEvent` 做事件广播；基于 props 由主应用直接注入到子应用的 `mount`；再就是全局变量或者 Redux 这类共享 store。中后台项目我一般只用前三种，共享 store 一旦铺开，子应用就没法独立跑了。

**公共依赖怎么处理？**两条路，一条是 CDN 加 webpack 的 `externals`，把 React、Vue、UI 库从各自的包里剔出去；另一条是 webpack 5 的联邦模块（Module Federation），构建时就把依赖共享关系约定好。

## 三、路由劫持，single-spa 只干这一件事

要理解 `qiankun`，先得把地基那层看明白。这一节用 `single-spa` 从零搭一遍，你会很清楚地看到它缺了什么。

### 3.1 子应用导出生命周期

先建一个 Vue 子应用，用官方适配包 `single-spa-vue` 生成三个生命周期函数：

```
vue create spa-vue  
npm install single-spa-vue  
```

`single-spa-vue` 帮你做的事情是把 Vue 实例的创建和销毁包装成 `bootstrap`、`mount`、`unmount`，你不用自己手写这套样板：

```js
// main.js

import singleSpaVue from 'single-spa-vue';

const appOptions = {
   el: '#vue',
   router,
   render: h => h(App)
}

// 在非子应用中正常挂载应用
if(!window.singleSpaNavigate){
 delete appOptions.el;
 new Vue(appOptions).$mount('#app');
}

const vueLifeCycle = singleSpaVue({
   Vue,
   appOptions
});


// 子应用必须导出以下生命周期：bootstrap、mount、unmount
export const bootstrap = vueLifeCycle.bootstrap;
export const mount = vueLifeCycle.mount;
export const unmount = vueLifeCycle.unmount;
export default vueLifeCycle;
```

中间那个 `window.singleSpaNavigate` 判断是全篇最实用的一行。`single-spa` 在接管页面时会往 `window` 上挂这个标记，有它说明当前跑在基座里，就把 `el` 删掉交给基座决定挂载点；没有它说明是自己 `npm run dev` 独立跑，直接挂到 `#app`。日常改子应用的样式和交互，不用每次都把基座起起来。

子应用的路由也得跟着改，`base` 要和主应用注册时的激活路径对上，否则跳转过去会 404：

```js
// router.js
const router = new VueRouter({
  mode: 'history',
  base: '/vue',   //改变路径配置
  routes
})
```

配好之后子应用独立访问是这个样子：

![子应用配置 base 后的运行效果](https://blog.poetries.top/img/static/images/20210731155249.png)

### 3.2 把子应用打包成库

子应用要被别人加载，就不能只输出一个自己用的 bundle，得输出成 UMD 格式的库，并且挂一个能从 `window` 上取到的名字：

```js
//vue.config.js
module.exports = {
    configureWebpack: {
    // 把属性挂载到window上方便父应用调用 window.singleVue.bootstrap/mount/unmount
        output: {
            library: 'singleVue',
            libraryTarget: 'umd'
        },
        devServer:{
            port:10000
        }
    }
}
```

打完包之后，浏览器里 `window.singleVue` 上就能看到那三个生命周期方法：

![打包成 UMD 后 window 上暴露的生命周期](https://blog.poetries.top/img/static/images/20210731114005.png)

`libraryTarget: 'umd'` 这一条不能省。主应用是通过 script 标签把子应用的 JS 拉进来的，只有 UMD 会在浏览器环境下往 `window` 上挂全局变量，换成 `esm` 或者 `commonjs` 主应用什么都拿不到。

### 3.3 主应用注册与激活

主应用先准备好挂载节点：

```
<div id="nav">
    <router-link to="/vue">vue项目router-link> 
    <div id="vue">div>
div>
```

然后手动写一个加载 script 的函数，把子应用的产物一个个拉下来：

```js
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import {registerApplication,start} from 'single-spa'

Vue.config.productionTip = false

async function loadScript(url) {
  return new Promise((resolve,reject)=>{
    let script = document.createElement('script')
    script.src = url 
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// 注册应用
registerApplication('myVueApp',
  async ()=>{
    console.info('load')
    // singlespa问题 
    // 加载文件需要自己构建script标签 但是不知道应用有多少个文件
    // 样式不隔离
    // 全局对象没有js沙箱的机制 比如加载不同的应用 每个应用都用同一个环境
    // 先加载公共的
    await loadScript('http://localhost:10000/js/chunk-vendors.js')
    await loadScript('http://localhost:10000/js/app.js')

    return window.singleVue // bootstrap mount unmount
  },
  // 用户切换到/vue下 我们需要加载刚才定义的子应用
  location=>location.pathname.startsWith('/vue'),
)

start()

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
```

跑起来是这样，点击导航时子应用被挂到 `#vue` 里：

![single-spa 主应用加载子应用的效果](https://blog.poetries.top/img/static/images/20210731155355.png)

代码注释里那几行就是 `single-spa` 的全部短板，写在这儿是为了下一节做对照。加载文件要你自己拼 script 标签，可你根本不知道子应用打出来多少个 chunk，文件名带 hash 之后更是没法写死；样式不隔离；全局对象也没有任何沙箱机制，几个子应用轮流往同一个 `window` 上写东西。

还有一个必须补的动作，动态设置子应用的 publicPath：

```js
if(window.singleSpaNavigate){
  __webpack_public_path__ = 'http://localhost:10000/'
}
```

这行很多人会漏掉。子应用被基座加载时，页面地址是基座的域名，如果不改 publicPath，子应用去请求自己的异步 chunk、图片、字体时全会打到基座域名上，控制台里一片 404。

`single-spa` 本身 gzip 后不到 5kb，路由劫持做得很完善，框架无关也是真的。但它不做 JS 沙箱也不做 CSS 隔离，这就是国内几乎没人裸用它上生产的原因。

## 四、qiankun，把缺的两块补上

`qiankun` 是目前比较完善的一个微前端解决方案，在蚂蚁内部经受过大量项目考验。它和 `single-spa` 的分工差异，集中在资源加载和运行时隔离两件事上。

### 4.1 主应用注册

主应用的模板先给每个子应用留好挂载点：

```html
<template>
  <!--注意这里不要写app 否则跟子应用的加载冲突
  <div id="app">-->
  <div>
    <el-menu :router="true" mode="horizontal">
      <!-- 基座中可以放自己的路由 -->
      <el-menu-item index="/">Home</el-menu-item>

      <!-- 引用其他子应用 -->
      <el-menu-item index="/vue">vue应用</el-menu-item>
      <el-menu-item index="/react">react应用</el-menu-item>
    </el-menu>
    <router-view />

    <!-- 其他子应用的挂载节点 -->
    <div id="vue" />
    <div id="react" />
  </div>
</template>

<style>

</style>
```

注释里那句提醒是真的会坑到人。基座根节点如果也叫 `#app`，子应用挂载时很可能把基座自己整个替换掉，页面直接白屏。

注册子应用的写法和 `single-spa` 长得像，但 `entry` 那一项完全不同：

```js

import { registerMicroApps,start } from 'qiankun'
// 基座写法
const apps = [
  {
    name: 'vueApp', // 名字
    // 默认会加载这个HTML，解析里面的js动态执行 （子应用必须支持跨域）
    entry: '//localhost:10000',  
    container: '#vue', // 容器
    activeRule: '/vue', // 激活的路径 访问/vue把应用挂载到#vue上
    props: { // 传递属性给子应用接收
      a: 1,
    }
  },
  {
    name: 'reactApp',
    // 默认会加载这个HTML，解析里面的js动态执行 （子应用必须支持跨域）
    entry: '//localhost:20000',  
    container: '#react',
    activeRule: '/react' // 访问/react把应用挂载到#react上
  },
]

// 注册
registerMicroApps(apps)
// 开启
start({
  prefetch: false // 取消预加载
})
```

先说结论，`entry` 填的是一个 HTML 地址，不是 JS 地址。

这就是 `import-html-entry` 补上的那块拼图。`qiankun` 会把这个 HTML 抓下来，正则抽出里面的 `<script>` 和 `<link>`，再逐个取回来在沙箱里执行。上一节 `single-spa` 里那个「不知道子应用有多少个文件」的问题，到这儿自然就没了，因为 HTML 里本来就写着。

代价是子应用的开发服务器必须开跨域，否则你连那份 HTML 都拿不到，控制台里会是一片 CORS 报错。这个坑我第一次接入时卡了一会儿，还以为是端口写错了。

### 4.2 Vue 子应用接入

子路由的 `base` 依旧要和主应用注册的 `activeRule` 保持一致：

```js
// src/router.js

const router = new VueRouter({
  mode: 'history',
  // base里主应用里面注册的保持一致
  base: '/vue',
  routes
})
```

入口文件把渲染逻辑抽成 `render` 函数，再按是否在 `qiankun` 环境里分流：

```js
// main.js

import Vue from 'vue'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false

let instance = null
function render() {
  instance = new Vue({
    router,
    render: h => h(App)
  }).$mount('#app') // 这里是挂载到自己的HTML中 基座会拿到挂载后的HTML 将其插入进去
}

// 独立运行微应用
if(!window.__POWERED_BY_QIANKUN__) {
  render()
}

// 如果被qiankun使用 会动态注入路径
if(window.__POWERED_BY_QIANKUN__) {
  // qiankun 将会在微应用 bootstrap 之前注入一个运行时的 publicPath 变量
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}

// 子应用的协议 导出供父应用调用 必须导出promise
export async function bootstrap(props) {} // 启动可以不用写 需要导出方法
export async function mount(props) {
  render()
}
export async function unmount(props) {
  instance.$destroy()
}
```

`__POWERED_BY_QIANKUN__` 和上一节的 `window.singleSpaNavigate` 是同一个套路，换了个名字而已。`__INJECTED_PUBLIC_PATH_BY_QIANKUN__` 则把手写 publicPath 那步自动化了，`qiankun` 在子应用 bootstrap 之前就注入好，你只要把它赋给 `__webpack_public_path__`。

这里有个坑要注意，`unmount` 里除了销毁实例，定时器、全局事件监听、第三方 SDK 实例也都得清干净。`bootstrap` 只跑一次，`mount` 和 `unmount` 每次切换都跑，漏清理的东西会随着切换次数线性堆积，切个十几次内存就上去了。

构建配置和 `single-spa` 那版基本一致，多了跨域头：

```js
// vue.config.js

module.exports = {
    devServer:{
        port:10000,
        headers:{
            'Access-Control-Allow-Origin':'*' //允许访问跨域
        }
    },
    configureWebpack:{
        // 打umd包
        output:{
            library:'vueApp',
            libraryTarget:'umd'
        }
    }
}
```

### 4.3 React 子应用接入

再起一个 React 项目，用来验证技术栈无关这件事到底成不成立。路由的 `basename` 要和主应用配置对上：

```html
// app.js

import logo from './logo.svg';
import './App.css';
import {BrowserRouter,Route,Link} from 'react-router-dom'

function App() {
  return (
    // /react跟主应用配置保持一致
    <BrowserRouter basename="/react">
      <Link to="/">首页</Link>
      <Link to="/about">关于</Link>

      <Route path="/" exact render={()=>(
        <div className="App">
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <p>
              Edit <code>src/App.js</code> and save to reload.
            </p>
            <a
              className="App-link"
              href="https://reactjs.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn React
            </a>
          </header>
        </div>
      )} />
      
      <Route path="/about" exact render={()=>(
        <h1>About Page</h1>
      )}></Route>
    </BrowserRouter>
  );
}

export default App;
```

入口文件的结构和 Vue 版一模一样，只是挂载和卸载换成了 `ReactDOM` 的 API：

```js
// index.js
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

function render() {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
}

reportWebVitals();

// 独立运行
if(!window.__POWERED_BY_QIANKUN__){
  render()
}

// 子应用协议
export async function bootstrap() {}
export async function mount() {
  render()
}
export async function unmount() {
  ReactDOM.unmountComponentAtNode(document.getElementById("root"));
}
```

麻烦的是 CRA 起的项目改不了 webpack 配置。`npm run eject` 太重，一般用 `react-app-rewired` 打补丁：

```
yarn add react-app-rewired --save-dev
```

先把 `package.json` 里的 `react-scripts` 全换成 `react-app-rewired`：

```js
// react-scripts 改成 react-app-rewired
"scripts": {
    "start": "react-app-rewired start",
    "build": "react-app-rewired build",
    "test": "react-app-rewired test",
    "eject": "react-app-rewired eject"
  },
```

再在根目录建一个 `config-overrides.js`，把 UMD 输出、publicPath、跨域头这三件事补齐：

```js
// config-overrides.js

module.exports = {
  webpack: (config) => {
    // 名字和基座配置的一样
    config.output.library = 'reactApp';
    config.output.libraryTarget = "umd";
    config.output.publicPath = 'http://localhost:20000/'
    return config
  },
  devServer: function (configFunction) {
    return function (proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);

      // 配置跨域
      config.headers = {
        "Access-Control-Allow-Origin": "*",
      };
      return config;
    };
  },
};
```

端口和 socket 端口在 `.env` 里定死，不然 CRA 的热更新会连到默认端口去：

```
PORT=20000
# socket发送端口
WDS_SOCKET_PORT=20000
```

路由这块还可以再稳一点。上面的 `basename="/react"` 写死之后，子应用自己 `npm run dev` 时访问根路径就打不开了，改成按环境判断更好用：

```js
import { BrowserRouter, Route, Link } from "react-router-dom"

const BASE_NAME = window.__POWERED_BY_QIANKUN__ ? "/react" : "";

function App() {
  return (
    <BrowserRouter basename={BASE_NAME}>
      <Link to="/">首页</Link>
      <Link to="/about">关于</Link>
      <Route path="/" exact render={() => <h1>hello home</h1>} />
      <Route path="/about" render={() => <h1>hello about</h1>} />
    </BrowserRouter>
  );
}
```

两个技术栈的子应用挂在同一个基座下，跑起来是这样：

![qiankun 同时加载 Vue 与 React 子应用](https://blog.poetries.top/img/static/images/20210731205952.png)

把上面这些拼起来，`qiankun` 接入的必做项就五条：基座注册、子应用导出三个生命周期、publicPath 动态化、UMD 输出、开跨域头。少一条都跑不通，出问题时也按这五条挨个排查。

代码写完只是第一步，多个子应用怎么在一条流水线上分别构建、分别发到各自目录，我单独写了一篇 [Jenkins 部署微前端实践总结](https://feinterview.poetries.top/blog/micro-fe-deploy-summary)，那边讲上线链路。

## 五、飞冰 icestark 的另一种接法

阿里的 icestark 走的路子和 `qiankun` 不太一样，它更贴近 React 生态，主应用是一个带 Layout 的框架应用，子应用清单直接写在 `appConfig` 里。

主应用用官方脚手架起：

```js
$ npm init ice icestark-layout @icedesign/stark-layout-scaffold
$ cd icestark-layout
$ npm install
$ npm start
```

关键配置在 `src/app.jsx` 的 `icestark` 字段，注意它的 `url` 填的是**具体的 JS 文件地址数组**，而不是 `qiankun` 那样的 HTML 入口：

```js
// src/app.jsx中加入

const appConfig: IAppConfig = {

  ...
  
  icestark: {
    type: 'framework',
    Layout: FrameworkLayout,
    getApps: async () => {
      const apps = [
      {
        path: '/vue',
        title: 'vue微应用测试',
        sandbox: false,
        url: [
          // 请求子应用端口下的服务，子应用的vue.config.js里面 需要配置headers跨域请求头
          "http://localhost:3001/js/chunk-vendors.js",
          "http://localhost:3001/js/app.js",
        ],
      },
      {
        path: '/react',
        title: 'react微应用测试',
        sandbox: true,
        url: [
          "http://localhost:3000/static/js/bundle.js",
        ],
      }
    ];
      return apps;
    },
    appRouter: {
      LoadingComponent: PageLoading,
    },
  },
};
```

这里 `sandbox` 是逐个应用可配的，Vue 那个关掉了、React 那个开着。开发环境下文件名固定还好，生产环境产物带 contenthash，这份 url 清单就得靠构建流程动态生成，这也是 icestark 相比 HTML entry 方案更繁琐的地方。

侧边栏菜单要和 `path` 对上，不然点了没反应：

```js
// 侧边栏菜单
// src/layouts/menuConfig.ts 改造

const asideMenuConfig = [
  {
    name: 'vue微应用测试',
    icon: 'set',
    path: '/vue' 
  },
  {
    name: 'React微应用测试',
    icon: 'set',
    path: '/react'
  },
]
```

Vue 子应用这边先开跨域、打 UMD 包，思路和前面完全一致：

```js
// 修改vue.config.js

module.exports = {
  devServer: {
    open: true, // 设置浏览器自动打开项目
    port: 3001, // 设置端口
    // 支持跨域 方便主应用请求子应用资源
    headers: {
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    }
  },
  configureWebpack: {
    // 打包成lib包 umd格式
    output: {
      library: 'icestark-vue',
      libraryTarget: 'umd',
    },
  }
}
```

入口文件用 `@ice/stark-app` 提供的工具函数改造，`setLibraryName` 那行是最容易漏的：

```js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import {
  isInIcestark,
  getMountNode,
  registerAppEnter,
  registerAppLeave,
  setLibraryName
} from '@ice/stark-app'

let vue = createApp(App)
vue.use(store)
vue.use(router)

// 注意：`setLibraryName` 的入参需要与 webpack 工程配置的 output.library 保持一致
//  重要 不加不生效 和 vue.config.js中配置的一样
setLibraryName('icestark-vue')

export function mount({ container }) {
  console.log(container,'container')
  vue.mount(container);
}

export function unmount() {
  vue.unmount();
}
  
if (!isInIcestark()) {
  vue.mount('#app')
}
```

`mount` 拿到的 `container` 是主应用给的真实 DOM 节点，打出来看一眼心里更有数：

![icestark 主应用注入的 container 节点](https://blog.poetries.top/img/static/images/20210731130030.png)

`setLibraryName` 的入参必须和 `output.library` 一字不差，写错了主应用从 `window` 上取不到生命周期，表现是页面一片空白且控制台没有明显报错，这种最难查。

路由用 `getBasename()` 拿主应用分配的基准路径，不用像前面那样写死：

```
import { getBasename } from '@ice/stark-app';


const router = createRouter({
  // 重要 在主应用中的基准路由
  base: getBasename(),
  routes
})

export default router
```

React 子应用同理，`isInIcestark()` 判断环境，`registerAppEnter` / `registerAppLeave` 注册进出场回调：

```
// src/app.js

import { isInIcestark, getMountNode, registerAppEnter, registerAppLeave } from '@ice/stark-app';

export function mount(props) {
  ReactDOM.render(<App />, props.container);
}

export function unmount(props) {
  ReactDOM.unmountComponentAtNode(props.container);
}

if (isInIcestark()) {
  registerAppEnter(() => {
    ReactDOM.render(<App />, getMountNode());
  })
  registerAppLeave(() => {
    ReactDOM.unmountComponentAtNode(getMountNode());
  })
} else {
  ReactDOM.render(<App />, document.getElementById('root'));
}
```

原文这段里 `if (!isInIcestark())` 和后面的 `if (isInIcestark()) ... else ...` 是重复的，两处都会在独立运行时渲染一遍，我这里合并成了一个分支。

CRA 项目 `npm run eject` 之后，跨域头加在 `config/webpackDevServer.config.js`：

```js
hot: '',
port: '',
...

// 支持跨域
headers: {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
},
```

三套方案看下来，接入协议几乎是同一套，差别只在资源清单是 HTML 还是 JS 数组、以及环境判断函数叫什么名字。理解了这一点，换框架的成本就没那么吓人了。

## 六、CSS 隔离的四条路子

样式污染要分两个方向看，一个是子应用之间互相污染，另一个是主应用和子应用互相污染。这两件事的解法完全不同，混在一起谈就会绕晕。

### 6.1 子应用之间

主流做法是 Dynamic Stylesheet 动态样式表，也是 `qiankun` 的默认策略。应用切换时把老应用的 `<style>` 移除或者禁用掉，再添加新应用的，保证同一个时间点内只有一份应用样式表生效。

这套方案的前提条件很硬，同一时刻只能激活一个子应用。一旦你要在一个页面里同时挂两个子应用，它立刻失效，得换 Shadow DOM 或者给选择器加前缀。

### 6.2 主应用和子应用之间

这个方向有四条路可走，各有各的代价。

![CSS 隔离的四种方案对比](https://blog.poetries.top/img/static/images/20210731160312.png)

`BEM(Block Element Modifier)` 是最土也最可靠的一条，各应用约定各自的前缀，`.main-app-button` 和 `.child-app-button` 井水不犯河水。零运行时开销，缺点是全靠人守纪律，来个新同事不知道这个约定就破功了。

`CSS Modules` 把这件事交给构建工具，打包时按 `[name]__[local]--[hash:base64:5]` 这类规则生成带 hash 的类名，冲突概率基本为零。它管得住你自己写的样式，管不住引入的第三方 UI 库。

`css-in-js` 用 styled-components、emotion 这类库把样式绑到组件上，作用域天然收敛。代价是运行时开销和 SSR 复杂度，能管的范围和 CSS Modules 一样，止步于第三方库。

Shadow DOM 是唯一能做到浏览器层面真隔离的：

```html
<!DOCTYPE html>
<html lang="">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>shadow dom</title>
  </head>
  <body>
    <p>hello world</p>
    <div id="shadow"></div>
    <script>
      let shadowDOM = document.getElementById('shadow').attachShadow({mode: 'closed'}) // 外界无法访问 
      let pEle = document.createElement('p')
      pEle.innerHTML = 'hello shadowDOM'
      let styleEle = document.createElement('style')
      styleEle.textContent = `p{color:red} `

      shadowDOM.appendChild(styleEle)
      shadowDOM.appendChild(pEle)

      // react vue 里面的弹框等因为挂载到body上 所以用shadowDOM不行 
      // 会挂载到全局污染样式
      //document.body.appendChild(pEle)

    </script>
  </body>
</html>
```

跑出来的结果是这样，ShadowRoot 里那个 `p` 变红了，外面那个 `hello world` 一点没受影响：

![Shadow DOM 内外样式互不影响的效果](https://blog.poetries.top/img/static/images/20210731135230.png)

`attachShadow({mode: 'closed'})` 表示外界拿不到这个 ShadowRoot 的引用，`open` 则可以通过 `element.shadowRoot` 访问。做隔离用 `closed` 更彻底，但调试起来会难受一些，`qiankun` 的 `strictStyleIsolation` 用的是 `open`。

那为什么很多人开了严格模式之后又关掉了呢？

答案就在上面那两行注释里。React 和 Vue 生态的弹框、下拉、Tooltip 基本都默认往 `document.body` 上挂，一挂就跑到 ShadowRoot 外面去了，样式留在里面元素跑到外面，直接裸奔。这是 Shadow DOM 在微前端里最真实的阻力。

我自己的顺序是 BEM 或 CSS Modules 打底把自家代码管住，再考虑框架提供的选择器前缀方案，Shadow DOM 留到确实有多实例强隔离需求时再上，并且上之前一定要把组件库所有弹层的挂载点改到子应用容器里。

## 七、JS 沙箱机制

![JS 沙箱的作用示意](https://blog.poetries.top/img/static/images/20210731155716.png)

子应用运行时应该跑在一个内部沙箱环境里，要解决的事情就一句话，子应用改了 `window.xxx`，卸载之后要能恢复原样，多个子应用同时跑还不能互相看见。

主流实现有两种：快照沙箱在挂载和卸载时记录快照、切换时依据快照恢复环境，无法支持多实例；`Proxy` 代理沙箱给每个应用发一个假的全局对象，不影响真实环境。

### 7.1 快照沙箱

它的工作流程分四步：

1. 激活时将当前 `window` 属性进行快照处理
2. 失活时用快照中的内容和当前 `window` 属性比对
3. 如果属性发生变化就保存到 `modifyPropsMap` 中，并用快照还原 `window` 属性
4. 再次激活时重新拍一次快照，并用上次修改的结果还原 `window` 属性

对应的最小实现是这样：

```js
class SnapshotSandbox {
    constructor() {
        this.proxy = window; 
        this.modifyPropsMap = {}; // 修改了哪些属性
        this.active();
    }
    active() {
        this.windowSnapshot = {}; // window对象的快照
        for (const prop in window) {
            if (window.hasOwnProperty(prop)) {
                // 将window上的属性进行拍照
                this.windowSnapshot[prop] = window[prop];
            }
        }
        Object.keys(this.modifyPropsMap).forEach(p => {
            window[p] = this.modifyPropsMap[p];
        });
    }
    inactive() {
        for (const prop in window) { // diff 差异
            if (window.hasOwnProperty(prop)) {
                // 将上次拍照的结果和本次window属性做对比
                if (window[prop] !== this.windowSnapshot[prop]) {
                    // 保存修改后的结果
                    this.modifyPropsMap[prop] = window[prop]; 
                    // 还原window
                    window[prop] = this.windowSnapshot[prop]; 
                }
            }
        }
    }
}
```

用法是把 `sandbox.proxy` 当作 `window` 传进子应用的执行作用域：

```js
let sandbox = new SnapshotSandbox();
((window) => {
    window.a = 1;
    window.b = 2;
    window.c = 3
    console.log(window.a, window.b, window.c) // 1 2 3
    sandbox.inactive();
    console.log(window.a, window.b, window.c) // undefined undefined undefined
})(sandbox.proxy);
```

注意看它的 `this.proxy = window`，那个所谓的沙箱其实就是真实的 `window` 本身，它只是在进出时做了一轮记录和还原。所以两个子应用同时挂载时都往同一个 `window` 上写，谁先 `inactive` 就把谁的值当成变更记下来，另一个的状态直接被冲掉。

再加上每次激活失活都要 `for...in` 遍历整个 `window`，属性上百个，切换频繁时这笔开销也不算小。

快照沙箱只能撑住单实例场景，多实例只能靠 Proxy。

### 7.2 Proxy 代理沙箱

思路换了个方向，给每个子应用发一个空的 `fakeWindow`，写操作落在假对象上，读操作先看假对象、取不到再回退到真 `window`：

```js
class ProxySandbox {
    constructor() {
        const rawWindow = window;
        const fakeWindow = {}
        const proxy = new Proxy(fakeWindow, {
            set(target, p, value) {
                target[p] = value;
                return true
            },
            get(target, p) {
                return target[p] || rawWindow[p];
            }
        });
        this.proxy = proxy
    }
}
let sandbox1 = new ProxySandbox();
let sandbox2 = new ProxySandbox();
window.a = 1;
((window) => {
    window.a = 'hello';
    console.log(window.a) // hello
})(sandbox1.proxy);
((window) => {
    window.a = 'world';
    console.log(window.a) // world
})(sandbox2.proxy);
console.log(window.a) // 1 全局 window 没被污染
```

每个应用都创建一个 `proxy` 来代理 `window`，好处是每个应用相对独立，不需要直接更改全局的 `window` 属性，多实例天然就支持了。

不过这版是教学用的最小实现，离能上生产还差不少。`get` 里返回原生方法（`window.addEventListener`、`window.fetch`）时必须 `bind(rawWindow)`，否则会抛 Illegal invocation；`document`、`location` 这类不可写属性要单独处理；`has`、`deleteProperty`、`getOwnPropertyDescriptor` 这些陷阱也得补上。说实话我自己照着写过一版，跑通 demo 很快，一接真实项目就漏洞百出，后来还是老老实实去读 `qiankun` 的 `ProxySandbox` 源码了。

## 八、通信与公共依赖，落地时最容易返工的两件事

前面第一节列了几种通信方式，这里补一下实际选型时的判断。

props 注入是最推荐的默认选项，主应用在注册时通过 `props` 字段把用户信息、token、主题配置传下去，子应用在 `mount(props)` 里接住。它的好处是依赖关系是显式的，一眼能看出子应用需要什么。缺点是只能主传子，子应用回传要靠主应用一并传下去的回调函数。

`CustomEvent` 适合那种真正的广播场景，比如切换语言、退出登录，主子应用都监听同一个事件名。用它要特别小心解绑，`unmount` 里没 `removeEventListener` 的话，切换几次之后一次事件会触发好几个回调。

全局变量和共享 Redux store 我一般不用。它跑得通，但子应用从此就没法独立启动了，微前端最大的那个好处直接消失。

公共依赖这块，CDN 加 `externals` 是最省事的路子，React、Vue、UI 库统一从 CDN 走，各子应用的包体积立刻瘦一大圈。代价是版本被绑死，升级要全线一起升。webpack 5 的联邦模块更灵活，能按 semver 协商版本，但要求所有子应用都用 webpack 5 构建，老项目改造成本不低。

我的建议是先别急着做依赖统一。中大型团队里，能独立发版比省那几百 KB 重要得多，体积问题先用 HTTP 缓存和 CDN 缓解，等真的成为瓶颈了再动。这块我也还在摸索，不同规模的团队结论未必一样。

## 总结

微前端说到底就四件事：路由怎么劫持、资源怎么加载、JS 环境怎么隔离、样式怎么不串。评估任何一个新框架，直接拿这四个问题去问它就够了。

`single-spa` 只做了第一件，路由劫持完善、体积不到 5kb、框架无关，但资源加载要你自己拼 script 标签，沙箱和样式隔离一概没有。`qiankun` 用 `import-html-entry` 补上了资源加载，用 Proxy 沙箱和动态样式表补上了运行时隔离，接入的必做项是基座注册、导出三个生命周期、publicPath 动态化、UMD 输出、开跨域头这五条。icestark 的接入协议是同一套，区别在于它要的是 JS 文件地址数组而不是 HTML 入口，生产环境得靠构建流程动态生成清单。

沙箱这块，快照沙箱只能单实例，切换时还要遍历整个 `window`；Proxy 沙箱天然支持多实例，但要写到能上生产远比示例代码复杂，建议直接读 `qiankun` 源码。CSS 隔离没有银弹，动态样式表解决子应用之间的冲突且只在单实例下有效，BEM 和 CSS Modules 管得住自家代码，Shadow DOM 是唯一的真隔离但会被第三方组件库的弹层挂载点破功。

通信优先用 props，广播场景才上 `CustomEvent`，共享 store 尽量别碰。公共依赖先别统一，保住独立发版的能力更重要。

## 参考

- [single-spa 官方文档](https://zh-hans.single-spa.js.org/docs/configuration)
- [qiankun 官方文档](https://qiankun.umijs.org/zh/guide)
- [icestark 微前端接入指南](https://micro-frontends.ice.work/docs/guide)
- [MDN - 使用 Shadow DOM](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_components/Using_shadow_DOM)
- [MDN - Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [Martin Fowler - Micro Frontends](https://martinfowler.com/articles/micro-frontends.html)
- [前端进阶之旅](https://interview.poetries.top)
