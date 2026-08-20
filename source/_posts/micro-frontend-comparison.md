---
title: 微前端落地方案对比，qiankun 无界 Module Federation 怎么选
date: 2024-02-25 16:40:12
description: 对比 iframe、qiankun/single-spa、Module Federation、Bit、Web Components 五大微前端落地方案的原理与取舍，拆解 JS 沙箱与 CSS 隔离的实现代码，给出一条可执行的选型路径。
tags:
- 微前端
- qiankun
- Module Federation
- Web Components
- 前端架构
- 技术选型
categories: Front-End
---

一个跑了三四年的中后台，前端仓库里堆着十几个业务模块，两个组改同一个 `package.json`，谁升级一次 `element-ui` 全公司都得跟着回归。这时候有人会说，上微前端吧。可微前端不是一个包，是二十多种互相打架的实现路子，选错了就是把巨石应用换成了一堆互相依赖的碎石头。

这篇把业界主流的五个流派挨个拆开讲，原理、代码、坑点、适用规模都写清楚，最后给一条能直接照着走的选型路径，帮你在动手前先判断「这个方案到底配不配我的项目」。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 微前端到底在解决什么问题，什么情况下不该上
- 一张图看懂主流微前端方案的运行链路
- iframe 派、路由分发派、Module Federation 派、组件驱动派、Web Components 派的原理与取舍
- 快照沙箱与 Proxy 沙箱的完整实现代码，以及各自的边界
- CSS 隔离的四条路子，每条在什么场景会失效
- 多维度对比表 + 一条可执行的选型决策路径

## 一、先想清楚要不要上微前端

微前端（Micro Frontends）这个词是 Thoughtworks 在 2016 年 11 月的 Technology Radar 里提出来的，定义是「一种由独立交付的多个前端应用组成整体的架构风格，把前端应用拆成更小、更简单、能独立开发测试部署的应用，而在用户看来仍然是内聚的单个产品」。Martin Fowler 的英文版更短：*An architectural style where independently deliverable frontend applications are composed into a greater whole.*

它借的是 2014 年微服务那套思路，解决的问题也高度重合，规模变大、耦合变高、改不动了。

先说结论，微前端不是一门技术，是一整套技术加策略加规范的组合。它可能表现为一个脚手架、一套构建插件、一份团队约定，不同方案各有各的取舍，适合业务场景的就是好方案。有两个常见误解需要先掰正。第一，技术栈无关不是微前端的强制要求，你完全可以做一个全 React 的微前端体系。第二，子应用也不一定要能独立运行，拆分粒度可以是应用级、页面级，甚至组件级。

那什么情况下值得上？我自己的感受是，只有三类需求撑得起这个复杂度。

**遗留系统迁移**是最硬的理由。手上有 Backbone.js、Angular.js 或者 Vue 1 写的老系统，线上跑得好好的，业务方不给重写预算，但新功能要用 React 18 写，这时候「不重写老系统直接接入新业务」的诱惑几乎无法拒绝。第二类是**后端解耦、前端聚合**，尤其 To B 场景，客户买了你五个系统，他要的是一个入口一次登录，而不是五个域名五套导航。第三类是**系统需要动态插拔**，服务边界清晰，不同团队要能各自演进各自发版。

反过来，如果你对系统里所有架构组件都有话语权，有人力也有动力去做统一治理，或者这个系统本身就是不可分割的一整块，那引入微前端只会白白多出一层运行时复杂度。技术团队要在动手之前先算一遍收益和成本，别被热度推着走。

## 二、主流方案的运行链路长什么样

除了 iframe 和 Module Federation，主流的运行时微前端方案链路都长得差不多，理解了这张图，后面各家的差异就只是细节：

```
                    ┌─────────────────────────────┐
   URL 变化  ─────► │  基座应用 (Container)        │
                    │  路由监听 / 注册表 / 公共依赖 │
                    └──────────────┬──────────────┘
                                   │ 命中 activeRule
                                   ▼
                    ┌─────────────────────────────┐
                    │  资源加载 (import-html-entry)│
                    │  取 entry HTML → 抽 JS / CSS │
                    └──────────────┬──────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
        ┌──────────────────┐               ┌──────────────────┐
        │  JS 沙箱          │               │  CSS 隔离         │
        │  Proxy / 快照     │               │  动态样式表       │
        │  劫持 window      │               │  Shadow DOM      │
        └────────┬─────────┘               └────────┬─────────┘
                 └─────────────────┬─────────────────┘
                                   ▼
                    ┌─────────────────────────────┐
                    │  子应用 mount(props)         │
                    │  Vue2 / React18 / 老 jQuery  │
                    └─────────────────────────────┘
```

链路上有四个必须解决的问题，各家方案的差异全在这四点上：路由怎么分发、子应用资源怎么加载、JS 全局环境怎么隔离、样式怎么不互相污染。你在评估任何一个新框架时，直接拿这四个问题去问它就行。

## 三、iframe 派，隔离最好但体验最差

`<iframe>` 是嵌套的浏览上下文，能把另一个 HTML 页面完整塞进当前页面。用它做微前端有三个别的方案给不了的好处。

即来即用，不引任何依赖，今天下午就能上线。隔离完美，`iframe` 创建的是全新的宿主环境，JS 全局变量、CSS、路由全都天然隔开，你不用写一行沙箱代码。组合灵活，一个页面里放三个 `iframe` 挂三个子应用，互不干扰。

问题也很直接。视窗大小不同步，`iframe` 里弹一个 Modal 想相对整个浏览器窗口居中，你得靠 `postMessage` 通知父页面来画遮罩，这个我踩过，弹层多起来之后代码会非常难维护。子应用通信受限，只能传可序列化的消息，传函数、传 Proxy 对象一律不行。性能开销显著，每个 `iframe` 都要重新建一整套浏览器环境，白屏时间躲不掉。路由状态丢失，用户在 `iframe` 里点了三层，一刷新回到首页。

**无界（Wujie）** 是腾讯开源的一个思路很聪明的方案，定位是「基于 iframe 的全新微前端方案」。它把 `iframe` 的隔离性和 Shadow DOM 的隔离性拆开用，JS 放进 `iframe` 里执行并通过 Proxy 接管全局对象，DOM 写进主文档的 ShadowRoot 里做样式隔离。这样既拿到了原生 JS 隔离，又绕开了 `iframe` 视窗和渲染层面的那些老问题。

无界的优点是单页面多应用可以同时激活、隔离机制干净、组件式接入很省事。代价是它同时依赖 Shadow DOM 和 Proxy，兼容性一般，要支持老浏览器的项目得先掂量一下。

## 四、路由分发 + 资源处理派，生产环境的主力

这一派是目前落地量最大的，突出特点就是 production-ready，基座和子应用的主从关系、路由分发、资源加载、JS 沙箱、样式隔离、配套调试工具，一整套都给你备齐了。代表是基于 `single-spa` 的 `qiankun`、字节的 `Garfish`、阿里的 `icestark`。

### 4.1 single-spa，这一派的地基

`single-spa` 把自己定义成「为实现前端微服务化的 js 路由」，它做的事情非常克制：监听浏览器 URL 变化，在路由切换时判断该加载还是卸载哪个子应用，然后调子应用导出的生命周期函数。

主应用侧只有两个 API，注册和启动：

```javascript
// 主工程注册子应用
singleSpa.registerApplication({
    name: 'app1', // 子应用名称
    app: () => System.import('app1'), // 如何加载子应用（用户自定义）
    activeWhen: '/app1', // URL 匹配规则，表示何时激活这个子应用
});

// 启动主应用
singleSpa.start();
```

注意 `app` 这个字段，`single-spa` 自己不管你怎么把子应用的代码弄下来，它只要求你返回一个 Promise。这也是它和 `qiankun` 最大的分工差异，后面会讲到。

子应用这边要导出三个生命周期，主应用按需调用：

```javascript
// 子应用导出生命周期
import SubApp from './index.tsx';

export const bootstrap = () => {
    // 初始化逻辑，只在应用首次加载时执行一次
    console.log('子应用 bootstrap');
};

export const mount = (props) => {
    // 挂载逻辑，每次应用激活时执行
    ReactDOM.render(<SubApp />, props.container);
};

export const unmount = (props) => {
    // 卸载逻辑，每次应用切换时执行
    ReactDOM.unmountComponentAtNode(props.container);
};
```

`bootstrap` 只跑一次，`mount` 和 `unmount` 每次切换都跑。写子应用时最容易出事的就是 `unmount`，定时器、全局事件监听、第三方 SDK 实例，这些在 `unmount` 里没清干净，切几次应用内存就上去了。

Vue 子应用可以用官方适配包 `single-spa-vue` 省掉样板代码：

```javascript
// main.js
import singleSpaVue from 'single-spa-vue';

const appOptions = {
   el: '#vue',
   router,
   render: h => h(App)
}

// 在非子应用中正常挂载应用
if (!window.singleSpaNavigate) {
    delete appOptions.el;
    new Vue(appOptions).$mount('#app');
}

const vueLifeCycle = singleSpaVue({
   Vue,
   appOptions
});

// 子应用必须导出以下生命周期
export const bootstrap = vueLifeCycle.bootstrap;
export const mount = vueLifeCycle.mount;
export const unmount = vueLifeCycle.unmount;
export default vueLifeCycle;
```

`window.singleSpaNavigate` 这个判断是关键，它让同一份代码既能被基座加载，又能自己 `npm run dev` 独立跑起来，日常开发不用每次都起基座。

`single-spa` 的账很好算。优势是轻量（gzip 后不到 5kb）、框架无关、路由劫持做得完善。局限是它**不做 JS 沙箱，也不做 CSS 隔离**。这就是为什么国内几乎没人直接用裸的 `single-spa` 上生产，大家用的都是基于它二次封装的框架。

### 4.2 qiankun，国内落地量最大的一个

`qiankun` 是蚂蚁基于 `single-spa` 孵化的实现，口号是「可能是你见过最完善的微前端解决方案」，也是 `single-spa` 官方推荐名单上的方案。它在 `single-spa` 上补了两块最缺的东西：用 `import-html-entry` 负责子应用 HTML/JS/CSS 资源的加载与执行，再加上一套完整的 JS 沙箱和样式隔离。

主应用配置长这样：

```javascript
import { registerMicroApps, start } from 'qiankun';

// 注册子应用
const apps = [
  {
    name: 'vueApp', // 子应用名称
    // 默认会加载这个 HTML，解析里面的 js 动态执行（子应用必须支持跨域）
    entry: '//localhost:10000',
    container: '#vue', // 容器
    activeRule: '/vue', // 激活的路径
    props: { // 传递属性给子应用
      a: 1,
    }
  },
  {
    name: 'reactApp',
    entry: '//localhost:20000',
    container: '#react',
    activeRule: '/react'
  },
];

// 注册应用
registerMicroApps(apps);

// 启动
start({
  prefetch: false, // 取消预加载
  sandbox: true // 开启沙箱
});
```

这里有个坑要注意，`entry` 填的是一个 HTML 地址而不是 JS 地址。`qiankun` 会把这个 HTML 抓下来，正则抽出里面的 `<script>` 和 `<link>`，再逐个取回来在沙箱里执行。所以子应用的开发服务器**必须开跨域**，否则你连 HTML 都拿不到，控制台里会是一片 CORS 报错。

子应用侧，Vue 2 的写法是这样：

```javascript
// src/main.js
let instance = null;

function render(props) {
  instance = new Vue({
    router,
    render: h => h(App)
  }).$mount('#app');
}

// 独立运行微应用
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

// 如果被 qiankun 使用，动态注入路径
if (window.__POWERED_BY_QIANKUN__) {
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}

// 子应用的协议 - 导出供父应用调用
export async function bootstrap() {}
export async function mount(props) {
  render();
}
export async function unmount(props) {
  instance.$destroy();
}
```

`__webpack_public_path__` 那一行很多人会漏。子应用被基座加载时，页面地址是基座的域名，如果不动态改 publicPath，子应用去请求自己的异步 chunk、图片、字体时会打到基座域名上，全部 404。

构建配置也得配合，输出格式必须是 UMD，`library` 名字要能被 `qiankun` 从 window 上取到：

```javascript
// vue.config.js
module.exports = {
    devServer: {
        port: 10000,
        headers: {
            'Access-Control-Allow-Origin': '*' // 允许跨域
        }
    },
    configureWebpack: {
        output: {
            library: 'vueApp',
            libraryTarget: 'umd' // 打包成 UMD 格式
        }
    }
};
```

React 子应用是同一套逻辑，只是挂载和卸载换成了 `ReactDOM` 的 API：

```javascript
// index.js
function render() {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
}

// 独立运行
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

// 子应用协议
export async function bootstrap() {}
export async function mount() {
  render();
}
export async function unmount() {
  ReactDOM.unmountComponentAtNode(document.getElementById("root"));
}
```

用 CRA 起的项目改不了 webpack 配置，得靠 `react-app-rewired` 配合 `config-overrides.js` 打补丁：

```javascript
// config-overrides.js
module.exports = {
  webpack: (config) => {
    config.output.library = 'reactApp';
    config.output.libraryTarget = "umd";
    config.output.publicPath = 'http://localhost:20000/';
    return config;
  },
  devServer: function (configFunction) {
    return function (proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);
      config.headers = {
        "Access-Control-Allow-Origin": "*",
      };
      return config;
    };
  },
};
```

上面这几段代码合在一起，就是 `qiankun` 接入的全部必做项：基座注册、子应用导出生命周期、publicPath 动态化、UMD 输出、跨域头。少一条都跑不通。

### 4.3 Garfish，字节完全自研的那个

`Garfish` 和 `qiankun` 最大的区别是它没有基于 `single-spa`，也没用 `import-html-entry`，整条链路自己写的。它的特点集中在几个工程化能力上：支持任意框架接入、预加载会自动记录用户的应用加载习惯来调整权重、支持依赖共享降低整体体积、支持多实例同时运行、提供业务插件机制。

样式隔离这块 `Garfish` 做得更细，它会劫持各种事件和资源加载，把插入的样式统一收集起来管理，同时也支持 Shadow DOM 模式。如果你的场景是一个页面里同时挂多个子应用而且样式冲突严重，它值得优先试。

## 五、Module Federation 派，构建时就把依赖接上

Module Federation（下面简称 MF）是 Webpack 5 带来的新能力，官方的说法是「多个独立的构建可以组成一个应用程序，这些独立的构建之间不应该存在依赖关系，因此可以单独开发和部署」。

它和上面那一派的思路完全不同。前面几个方案是运行时把一个完整的子应用挂进 DOM，MF 是构建时约定好模块契约，运行时按需去远端拉一个模块回来执行。所以这一派最大的特征是**去中心化**，没有基座和子应用的主从关系，每个应用既可以是暴露模块的 remote，也可以是消费模块的 host。

提供方这样配：

```javascript
// App1 - 提供方
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "app1",
      filename: "remoteEntry.js",
      library: { type: 'var', name: 'app1' },
      exposes: {
        "./Button": "./src/components/Button", // 暴露的模块
      },
      shared: ['vue', 'element-ui'] // 公共依赖
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    })
  ],
  devServer: {
    port: 3001
  }
};
```

消费方声明 remote 地址，之后就像 import 本地文件一样用：

```javascript
// App2 - 消费方
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'app2',
      filename: "remoteEntry.js",
      remotes: {
        // 引用远程模块
        app1: 'app1@http://localhost:3001/remoteEntry.js'
      },
      shared: ['vue', 'element-ui']
    }),
  ],
};

// 使用远程模块
import Button from 'app1/Button';
```

`shared` 是 MF 的灵魂，也是最容易翻车的地方。它让多个应用共用一份 `vue`，包体积一下就下来了，但共享的前提是版本能对上。两边一个用 Vue 2.6 一个用 Vue 2.7，运行时会按 semver 规则协商，协商不成就各加载各的，你会发现体积优化根本没生效。给 `shared` 显式写上 `singleton: true` 和 `requiredVersion` 是必要的自我保护。

**EMP（Enterprise Micro Frontends）** 是欢聚时代业务中台前端团队基于 MF 做的方案，把第三方依赖共享、微应用独立部署走 CDN、动态更新、去中心化、跨技术栈组件式调用这几件事包装成了完整工具链。

需要认清的是，MF 派没有 JS 沙箱也没有 CSS 隔离，共享的模块是直接跑在同一个全局环境里的。它更适合技术栈统一的团队做代码复用和构建提速，不适合用来接管一个 jQuery 老系统。Webpack 5 的其他能力我在另一篇里写得更细，可以配合看：[Webpack 5 核心特性与构建性能优化](https://feinterview.poetries.top/blog/webpack-5-build-optimization)。

## 六、Component-driven 派，把粒度做到组件级

这一派把微前端的拆分粒度从应用级一路推到了组件级，代表是 **Bit**，GitHub 上 17k+ star，官网列出的使用方里有 eBay、Dell、Tesla 这类公司。

它的思路是每个组件独立版本、独立构建、独立发布，跨项目按组件复用，配套一整套组件市场和依赖分析工具。用它的团队通常诉求不是「把几个系统聚合到一个入口」，而是「几十个产品线之间怎么共享同一套业务组件」。这个定位和其他四派差得比较远，评估时不用硬放在一起比。

## 七、Web Components 派，赌浏览器原生标准

**MicroApp** 是京东的方案，基于类 Web Components 渲染，接入成本低到有点夸张：

```javascript
// 只需用标签包裹即可
<micro-app name="app1" url="http://localhost:3000" baseurl="/app1"></micro-app>
```

主应用侧一行标签，子应用侧几乎不用改造，这个设计是真的舒服。它内部用 CustomElement 结合自定义的 ShadowDom 实现渲染隔离，同时也提供了 JS 沙箱。

**Magic Microservices** 是字节开源的基于 Web Components 的轻量工厂函数，更偏底层，适合自己搭轮子。

这一派的赌注是浏览器原生标准，长期看方向没错。眼下的问题在于 Shadow DOM 对第三方组件库不友好，很多 UI 库的弹层、Message、Tooltip 默认往 `document.body` 上挂，一挂就跑到 ShadowRoot 外面去了，样式全丢。所以用这一派之前，先拿你项目里的组件库做一次弹层实测，别等业务写完了才发现。

## 八、JS 沙箱到底怎么实现的

沙箱要解决的事情就一句话，子应用改了 `window.xxx`，卸载之后要能恢复原样，多个子应用同时跑还不能互相看见。

### 8.1 快照沙箱

思路很朴素，激活时把 `window` 上的属性全拍一遍照存下来，卸载时再遍历一遍，对比出哪些被改了，记下来并把 `window` 还原。

```javascript
class SnapshotSandbox {
    constructor() {
        this.proxy = window;
        this.modifyPropsMap = {}; // 记录修改的属性
        this.active(); // 初始化时激活
    }

    // 激活：记录当前 window 快照
    active() {
        this.windowSnapshot = {};
        for (const prop in window) {
            if (window.hasOwnProperty(prop)) {
                // 将 window 上的属性进行拍照
                this.windowSnapshot[prop] = window[prop];
            }
        }
        // 恢复之前修改的属性
        Object.keys(this.modifyPropsMap).forEach(p => {
            window[p] = this.modifyPropsMap[p];
        });
    }

    // 失活：记录变更并还原 window
    inactive() {
        for (const prop in window) {
            if (window.hasOwnProperty(prop)) {
                // 将上次拍照的结果和本次 window 属性做对比
                if (window[prop] !== this.windowSnapshot[prop]) {
                    // 保存修改后的结果
                    this.modifyPropsMap[prop] = window[prop];
                    // 还原 window
                    window[prop] = windowSnapshot[prop];
                }
            }
        }
    }
}
```

用起来是把 `sandbox.proxy` 当 `window` 传进子应用的执行作用域：

```javascript
let sandbox = new SnapshotSandbox();

((window) => {
    window.a = 1;
    window.b = 2;
    window.c = 3;
    console.log(window.a, window.b, window.c); // 1, 2, 3
    sandbox.inactive(); // 卸载，window 恢复原状
    console.log(window.a, window.b, window.c); // undefined, undefined, undefined
})(sandbox.proxy);
```

快照沙箱只能撑住单实例场景。你想想看，它的 `proxy` 直接就是真实 `window`，两个子应用同时挂载时都往同一个 `window` 上写，谁先 `inactive` 就把谁的值当成「变更」记下来，另一个的状态直接被冲掉。而且每次激活失活都要 `for...in` 遍历整个 `window`，属性上百个，切换频繁时这笔开销不算小。

多实例场景只能靠 Proxy。

### 8.2 Proxy 代理沙箱

Proxy 沙箱给每个子应用发一个假的 `fakeWindow`，写操作落在假对象上，读操作先看假对象再回退到真 `window`。

```javascript
class ProxySandbox {
    constructor() {
        const rawWindow = window;
        const fakeWindow = {};
        const proxy = new Proxy(fakeWindow, {
            set(target, p, value) {
                target[p] = value;
                return true;
            },
            get(target, p) {
                // 优先从 fakeWindow 取，否则从真实 window 取
                return target[p] || rawWindow[p];
            }
        });
        this.proxy = proxy;
    }
}

// 使用示例
let sandbox1 = new ProxySandbox();
let sandbox2 = new ProxySandbox();

window.a = 1; // 全局变量

((window) => {
    window.a = 'hello';
    console.log(window.a); // hello（只在 sandbox1 中）
})(sandbox1.proxy);

((window) => {
    window.a = 'world';
    console.log(window.a); // world（只在 sandbox2 中）
})(sandbox2.proxy);

console.log(window.a); // 1（全局 window 未受影响）
```

真实 `window` 一点没被污染，两个沙箱各写各的，多实例天然支持。

上面这版是教学用的最小实现，生产级实现要复杂得多。比如 `get` 里返回原生方法（`window.addEventListener`、`window.fetch`）时必须 `bind(rawWindow)`，否则会抛 Illegal invocation；`document`、`location` 这类不可写属性要单独处理；还得补 `has`、`deleteProperty`、`getOwnPropertyDescriptor` 这些陷阱。真要自己写一个能上生产的沙箱，坑比想象中多，我的建议是直接读 `qiankun` 的 `ProxySandbox` 源码而不是自己造。

按 `qiankun` 2.x 的实现，浏览器支持 `Proxy` 时默认用 `ProxySandbox`（多实例），配置 `sandbox: { loose: true }` 会退回到单例的 `LegacySandbox`，浏览器不支持 `Proxy` 时才降级到 `SnapshotSandbox`。样式隔离开关也挂在同一个配置对象上：

```javascript
start({
    sandbox: {
        loose: false, // false 走多实例 ProxySandbox，true 走单例 LegacySandbox
        strictStyleIsolation: true, // 开启严格的样式隔离（Shadow DOM）
        experimentalStyleIsolation: true // 实验性的样式隔离（选择器前缀）
    }
});
```

## 九、CSS 隔离的四条路子

CSS 隔离要分两个方向看：子应用之间互相污染，以及主应用和子应用互相污染。

**动态样式表**是解决第一个方向的主流做法，也是 `qiankun` 的默认策略。应用切换时把老应用的 `<style>` 禁用掉，再启用新应用的，保证同一时刻只有一份样式生效：

```javascript
// qiankun 中的实现原理
function patchLooseStyle(appName) {
    const styles = document.querySelectorAll('style');
    styles.forEach(style => {
        // 判断样式属于哪个子应用
        const app = style.getAttribute('data-webpack');
        if (app && app !== appName) {
            style.disabled = true;
        }
    });
}
```

注意这个方案的前提是同一时刻只激活一个子应用。多实例同时挂载时它就失效了，得换 Shadow DOM 或者选择器前缀。

第二个方向，主应用和子应用之间，有四条路可走。

**BEM 命名约定**最土也最可靠，各应用带各自的前缀，没有运行时开销，缺点是靠人守纪律：

```css
/* 主应用 */
.main-app-button { }

/* 子应用 */
.child-app-button { }
```

**CSS Modules** 把这件事交给构建工具，打包时生成带 hash 的类名：

```javascript
// webpack 配置
{
    modules: {
        localIdentName: '[name]__[local]--[hash:base64:5]'
    }
}
```

编译产物是这个样子，冲突概率基本为零：

```css
.App__button--abc12 { }
```

**Shadow DOM** 是唯一能做到浏览器层面真隔离的，ShadowRoot 内部的样式出不去，外部的样式也进不来：

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Shadow DOM 隔离</title>
  </head>
  <body>
    <div id="container"></div>
    <script>
      // 创建 Shadow DOM
      let shadowDOM = document.getElementById('container').attachShadow({mode: 'open'});

      // 添加样式（隔离在 Shadow DOM 内部）
      let styleEle = document.createElement('style');
      styleEle.textContent = `
        p { color: red; }
        .title { font-size: 20px; }
      `;

      // 添加内容
      let pEle = document.createElement('p');
      pEle.textContent = 'Hello Shadow DOM';
      pEle.className = 'title';

      // 追加到 Shadow DOM
      shadowDOM.appendChild(styleEle);
      shadowDOM.appendChild(pEle);
    </script>

    <!-- 全局样式不会影响 Shadow DOM 内部 -->
    <p>这是外部的 p，不会被影响</p>
  </body>
</html>
```

那为什么大家开了 `strictStyleIsolation: true` 之后经常又关掉呢？因为 React 和 Vue 生态里的弹框、下拉、Tooltip 基本都往 `document.body` 上挂，一挂就跑到 ShadowRoot 外面，样式在里面元素在外面，直接裸奔。这是 Shadow DOM 在微前端里最真实的阻力。

**CSS-in-JS** 用 styled-components、emotion 这类库把样式绑到组件上，作用域天然收敛：

```javascript
import styled from 'styled-components';

const Button = styled.button`
  background: blue;
  color: white;
  padding: 10px 20px;
`;

// 每个组件的样式都是独立的
```

它的代价是运行时开销和 SSR 复杂度，而且只能管住你自己写的组件，管不住引入的第三方 UI 库。

回到 `qiankun`，它给了两个开关。默认走动态样式表，切换应用时禁用旧样式：

```javascript
// 内部实现简化版
function handleStyleElement(styleElement, appName) {
    if (styleElement._use) {
        // 禁用其他应用的样式
        document.querySelectorAll('style[data-single]').forEach(el => {
            if (el !== styleElement) {
                el.disabled = true;
            }
        });
    }
}
```

严格模式则直接上 Shadow DOM：

```javascript
start({
    sandbox: {
        strictStyleIsolation: true // 开启 Shadow DOM 隔离
    }
});
```

我的实践顺序是：先用 BEM 或 CSS Modules 把自家代码管住，再开 `experimentalStyleIsolation` 给子应用样式加前缀，`strictStyleIsolation` 留到确实有多实例强隔离需求时再考虑，并且上之前一定要把组件库的弹层挂载点全部改成子应用容器。

## 十、主流方案横向对比

下面这张表的 star 数是 2024 年初的量级，现在只会更多，看相对关系就好：

| 方案 | 团队 | GitHub Star | JS 沙箱 | CSS 隔离 | 多实例支持 | 框架无关 | 独立部署 | 适用场景 |
|------|------|-------------|---------|----------|-----------|---------|---------|---------|
| **qiankun** | 蚂蚁金服 | 15.1k | ✅ Proxy/快照 | ✅ | ✅ | ✅ | ✅ | 企业级中后台应用 |
| **single-spa** | Joel Denning | 12.8k | ❌ | ❌ | ✅ | ✅ | ✅ | 微前端入门基础 |
| **MicroApp** | 京东 | 5k | ✅ | ✅ | ✅ | ✅ | ✅ | 需快速接入场景 |
| **无界** | 腾讯 | 3.5k | ✅ Proxy | ✅ ShadowDOM | ✅ | ✅ | ✅ | 对隔离性要求高 |
| **Garfish** | 字节跳动 | 2.3k | ✅ | ✅ | ✅ | ✅ | ✅ | 大型复杂应用 |
| **EMP** | YY | 2.2k | ❌ | ❌ | ✅ | 部分 | ✅ | 同技术栈应用 |
| **icestark** | 阿里巴巴 | 2k | ✅ | ✅ | ✅ | ✅ | ✅ | 阿里生态应用 |
| **Bit** | Bit | 17.3k | ❌ | ❌ | ✅ | ✅ | ✅ | 组件复用优先 |
| **Module Federation** | Webpack | - | ❌ | ❌ | ✅ | ✅ | ✅ | 构建时集成 |

## 十一、一条可执行的选型路径

选型别从「哪个 star 多」开始，从约束条件开始。我一般按这个顺序过一遍。

**第一问，要不要兼容 IE 或者老 WebView。**要的话，Shadow DOM 和 Proxy 这两条路直接划掉，能选的只剩 `iframe` 和基于快照沙箱的降级方案。这一问能砍掉一半候选。

**第二问，子应用技术栈是不是统一的。**全是 React 18 且都用 Webpack 5 或 Rspack，那 Module Federation 是成本最低的答案，不用引运行时框架，构建时就把依赖共享做了。有 jQuery、Angular.js 这类老系统要接，直接进运行时方案那一派。

**第三问，一个页面里要不要同时挂多个子应用。**要的话，快照沙箱和动态样式表都撑不住，候选收敛到 `qiankun` 的 Proxy 沙箱、无界、`Garfish`、`MicroApp`。

**第四问，依赖是统一管还是各管各的。**统一管能解决 React、UI 库重复加载的问题，代价是升级要全线一起升，任何一个子应用卡住整条线都动不了。各管各的最省心，代价是用户要下好几份 React。中大型团队我倾向各管各的，先保证独立发版的能力，体积问题用 CDN 和 HTTP 缓存去缓解。

**第五问，团队有没有人能兜底。**微前端出问题时的排查链路比普通 SPA 长得多，样式为什么串了、子应用为什么白屏、路由为什么回退两次，这些都需要有人真的读过框架源码。没有这个人，就选社区最大、issue 最多的那个，出了问题至少能搜到。

按这五问走下来，中大型企业级中后台大概率落到 `qiankun` 或 `Garfish`，两个都经过大量生产验证，配套齐全。遗留系统迁移场景，无界和 `MicroApp` 的接入成本更低。组件复用优先的选 Bit。同技术栈且主要诉求是构建提速的，Module Federation 和 EMP 更轻。

最后说一句可能不太中听的话。微前端一定会让系统更复杂，产物体积会变大，问题会变得更难复现，出故障时的责任边界也会变模糊。不是说这些代价不值得付，而是你得知道自己在拿什么换什么。技术选型要跟着业务实际需求走，别跟着热度走。

## 总结

五个流派的定位其实各不相同。`iframe` 派隔离最彻底但交互体验最差，无界用 Proxy 加 Shadow DOM 把它救回来了一半。路由分发派是目前生产落地的绝对主力，`qiankun` 补齐了 `single-spa` 缺的沙箱和样式隔离，接入的必做项是基座注册、生命周期导出、publicPath 动态化、UMD 输出、跨域头这五条。Module Federation 派没有沙箱和隔离，它解决的是同技术栈下的依赖共享和构建提速。Bit 把粒度推到组件级，是另一个赛道。Web Components 派押注原生标准，眼下最大的阻力是第三方组件库的弹层挂载。

沙箱这块，快照沙箱只能单实例、切换时要遍历整个 `window`；Proxy 沙箱天然支持多实例，但要写到能上生产远比示例代码复杂。CSS 隔离没有银弹，我的顺序是 BEM 或 CSS Modules 打底，再叠 `experimentalStyleIsolation`，Shadow DOM 留到最后。

选型按五个约束条件依次筛：浏览器兼容、技术栈是否统一、是否需要多实例、依赖统一还是独立、团队有没有人能读源码兜底。筛完通常只剩一两个候选，这时候再去看 star 数和文档质量就够了。

## 参考

- [Micro Frontends 官方站点](https://micro-frontends.org/)
- [Martin Fowler - Micro Frontends](https://martinfowler.com/articles/micro-frontends.html)
- [single-spa 官方文档](https://single-spa.js.org/)
- [qiankun 官方文档](https://qiankun.umijs.org/zh)
- [Webpack Module Federation 文档](https://webpack.js.org/concepts/module-federation/)
- [无界 Wujie 官方文档](https://wujie-micro.github.io/doc/)
- [MicroApp 官方文档](https://micro-zoe.github.io/micro-app/)
- [Garfish 官方文档](https://www.garfishjs.org/)
- [MDN - 使用 Shadow DOM](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_components/Using_shadow_DOM)
- [前端进阶之旅](https://interview.poetries.top)
