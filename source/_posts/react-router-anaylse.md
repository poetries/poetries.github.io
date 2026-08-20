---
title: React Router 原理详解，history 库与路由匹配机制
date: 2018-12-20 14:00:24
description: 从 history 库的三种实现讲到 React Router 的 URL 与 UI 同步机制，拆清楚 hash 模式和 history 模式的差别、点击 Link 之后路由系统内部到底发生了什么。
tags:
  - React
  - Javascript
  - React Router
  - 前端路由
categories: Front-End
---

单页应用里点一个导航链接，地址栏变了，页面内容换了，浏览器却没有发起一次文档请求，后退按钮还能正常用。第一次见到这个效果的时候我挺好奇的，地址栏都变了浏览器凭什么不去请求服务器？后来去翻 React Router 的源码才发现，这里面真正干活的其实不是 React Router 本身，而是它底下那个叫 `history` 的库。

这篇顺着这条线往下拆。先讲 `history` 库怎么用三套不同的底层机制抹平环境差异，再讲 React Router 怎么把 URL 变化翻译成组件渲染，最后把点击一个 `<Link>` 之后系统内部发生的完整链路走一遍。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `history` 库的三种实现分别对应什么环境
- 为什么 `history` 里的 location 比浏览器原生的多一个 `key` 字段
- hash 模式和 history 模式在前进、回退、状态存储上的具体差别
- React Router 把「URL 与 UI 同步」拆成了哪两层
- 用户点击 `Link` 之后，从 DOM 事件到组件重渲染的完整链路
- 路由匹配算法在做什么，v6 为什么改掉了它
- 这套原理到 React Router v7 的现状

## 一、React Router基础之history

### 1.1 History介绍

`history` 是一个独立的第三方 js 库，可以用来兼容在不同浏览器、不同环境下对历史记录的管理，拥有统一的 API。具体来说里面的 `history` 分为三类：

- 老浏览器的 `history`：主要通过 `hash` 来实现，对应 `createHashHistory`
- 高版本浏览器：通过 `html5` 里面的 `history`，对应 `createBrowserHistory`
- `node` 环境下：主要存储在 memory 里面，对应 `createMemoryHistory`

先说说为什么要抹平这三者。浏览器提供的历史记录 API 本身就是分裂的，HTML5 之前只能靠 hash 变化做假路由，HTML5 之后有了 `pushState` 但需要服务端配合，而在 Node 里跑服务端渲染或者跑单元测试时根本没有 `window`。上层的 React Router 不想为这三种情况各写一套逻辑，就需要有人先把差异吃掉。

上面针对不同的环境提供了三个 API，但是三个 API 有一些共性的操作，将其抽象成了一个公共的文件 `createHistory`。

```js

// 内部的抽象实现
function createHistory(options={}) {
  ...
  return {
    listenBefore, // 内部的hook机制，可以在location发生变化前执行某些行为，AOP的实现
    listen, // location发生改变时触发回调
    transitionTo, // 执行location的改变
    push, // 改变location
    replace,
    go,
    goBack,
    goForward,
    createKey, // 创建location的key，用于唯一标示该location，是随机生成的
    createPath,
    createHref,
    createLocation, // 创建location
  }
}
```

这份接口清单值得盯一会儿。它里面同时包含了两类东西，`push`、`replace`、`go` 这些是「让 URL 变」的命令式方法，`listen`、`listenBefore` 是「URL 变了通知我」的订阅方法。整个前端路由的骨架就是这两类方法拼出来的，上层框架负责在订阅回调里决定渲染什么。

上述这些方式是 `history` 内部最基础的方法，`createHashHistory`、`createBrowserHistory`、`createMemoryHistory` 只是覆盖其中的某些方法而已。其中需要注意的是，此时的 `location` 跟浏览器原生的 `location` 是不相同的，最大的区别就在于里面多了 `key` 字段，`history` 内部通过 `key` 来进行 `location` 的操作。

```js
function createLocation() {
  return {
    pathname, // url的基本路径
    search, // 查询字段
    hash, // url中的hash值
    state, // url对应的state字段
    action, // 分为 push、replace、pop三种
    key // 生成方法为: Math.random().toString(36).substr(2, length)
  }
}
```

那为什么非要加个 `key`？

因为浏览器原生的 `location` 只是当前地址的一份描述，它不区分「你是新推进来的」还是「你是后退回来的」。而路由库需要给每一条历史记录挂上额外的数据（也就是 `state`），还需要在你后退回某一条时把当时的数据取回来。`key` 就是这份额外数据的索引，随机生成，唯一标识一条历史记录。后面第 1.2.3 节讲 `sessionStorage` 存储时，存进去的键就是它。

`action` 字段也是同一个用途，它告诉上层这次变化是 `PUSH`、`REPLACE` 还是 `POP`，前进和后退的动画方向、要不要销毁缓存的页面，全靠它区分。

### 1.2 内部解析

三个 API 的大致技术实现如下：

- `createBrowserHistory`：利用 HTML5 里面的 `history`
- `createHashHistory`：通过 `hash` 来存储在不同状态下的 `history` 信息
- `createMemoryHistory`：在内存中进行历史记录的存储

#### 1.2.1 执行URL前进

- `createBrowserHistory`：`pushState`、`replaceState`
- `createHashHistory`：`location.hash=*** location.replace()`
- `createMemoryHistory`：在内存中进行历史记录的存储

```js
// 伪代码

// createBrowserHistory(HTML5)中的前进实现
function finishTransition(location) {
  ...
  const historyState = { key };
  ...
  if (location.action === 'PUSH') {
    window.history.pushState(historyState, null, path);
  } else {
    window.history.replaceState(historyState, null, path)
  }
}
```

这段是 history 模式的核心。`pushState` 干的事非常克制，它往浏览器历史栈里推一条记录、把地址栏改成 `path`，然后就没有然后了，不发请求、不刷新页面、也不触发任何事件。正因为它什么都不做，才留出了让 JS 接管后续渲染的空间。

注意第一个参数 `historyState` 里只放了 `{ key }`，真正的业务数据没有塞进去。原因是 `pushState` 的 state 有大小限制，各浏览器实现不一，稳妥的做法是只存一个索引，数据放别处。

hash 模式这边：

```js
// createHashHistory的内部实现
function finishTransition(location) {
  ...
  if (location.action === 'PUSH') {
    window.location.hash = path;
  } else {
    window.location.replace(
      window.location.pathname + window.location.search + '#' + path
    );
  }
}
```

改 `window.location.hash` 就等于往历史栈推一条记录，这是浏览器很早就有的行为。要实现 replace 语义就麻烦一点，得手动拼出完整 URL 再调 `location.replace`，因为直接改 hash 是没有替换语义的。

内存版最简单，一个数组就够了：

```js
// createMemoryHistory的内部实现
entries = [];
function finishTransition(location) {
  ...
  switch (location.action) {
    case 'PUSH':
      entries.push(location);
      break;
    case 'REPLACE':
      entries[current] = location;
      break;
  }
}
```

`createMemoryHistory` 平时用不到，但服务端渲染和 Jest 单元测试里全靠它。没有 `window` 的环境下，路由状态就是这个数组加一个游标。

#### 1.2.2 检测URL回退

前进是我们主动调 API，回退是用户按浏览器按钮，得靠监听。

- `createBrowserHistory`：`popstate`
- `createHashHistory`：`hashchange`
- `createMemoryHistory`：因为是在内存中操作，跟浏览器没有关系，不涉及 UI 层面的事情，所以可以直接进行历史信息的回退

```js
// 伪代码

// createBrowserHistory(HTML5)中的后退检测
function startPopStateListener({ transitionTo }) {
  function popStateListener(event) {
    ...
    transitionTo( getCurrentLocation(event.state) );
  }
  addEventListener(window, 'popstate', popStateListener);
  ...
}
 
// createHashHistory的后退检测
function startPopStateListener({ transitionTo }) {
  function hashChangeListener(event) {
    ...
    transitionTo( getCurrentLocation(event.state) );
  }
  addEventListener(window, 'hashchange', hashChangeListener);
  ...
}
// createMemoryHistory的内部实现
function go(n) {
  if (n) {
    ...
    current += n;
    const currentLocation = getCurrentLocation();
    // change action to POP
    history.transitionTo({ ...currentLocation, action: POP });
  }
}
```

这里有个很多人会栽的细节：`pushState` 和 `replaceState` 自己是不会触发 `popstate` 事件的。只有用户点浏览器的前进后退按钮，或者代码调 `history.back()`、`history.go()`，才会触发。

所以你自己写一个迷你路由的时候，光监听 `popstate` 是不够的，还得在自己调用 `pushState` 的地方手动通知一次。上面 `createBrowserHistory` 的 `finishTransition` 里为什么要有一整套 `transitionTo` 流程，原因就在这。它得同时覆盖「我改的」和「用户改的」两条路径。

`hashchange` 这边行为不一样，无论是代码改 hash 还是用户点后退，都会触发。所以 hash 模式的实现反而更省心一点。

#### 1.2.3 state的存储

为了维护 `state` 的状态，将其存储在 `sessionStorage` 里面。

```js
// createBrowserHistory/createHashHistory中state的存储
function saveState(key, state) {
  ...
  window.sessionStorage.setItem(createKey(key), JSON.stringify(state));
}
function readState(key) {
  ...
  json = window.sessionStorage.getItem(createKey(key));
  return JSON.parse(json);
}
// createMemoryHistory仅仅在内存中，所以操作比较简单
const storage = createStateStorage(entries); // storage = {entry.key: entry.state}
 
function saveState(key, state) {
  storage[key] = state
}
function readState(key) {
  return storage[key]
}
```

回到前面留的那个问题，为什么 location 需要 `key`。这段代码就是答案，`key` 是 `sessionStorage` 里的键名。

选 `sessionStorage` 而不是 `localStorage` 也是有讲究的。路由状态的生命周期应该和这个标签页绑定，你关掉页面再打开，之前那些历史记录的附加数据就该消失，`sessionStorage` 正好是这个语义。用 `localStorage` 会跨会话残留，多开几个标签页还会互相污染。

hash 模式必须走 `sessionStorage` 是没得选，因为 hash 本身只能存字符串，塞不下对象。history 模式其实可以直接用 `pushState` 的 state 参数，但为了两种模式行为一致，早期版本统一走了 sessionStorage。

### 1.3 小结

**路由原理**

前端路由实现起来其实很简单，核心就是监听 URL 的变化，然后匹配路由规则，显示相应的页面，并且无须刷新。目前单页面使用的路由就只有两种实现方式：

- `hash` 模式
- `history` 模式

`www.test.com/#/` 就是 Hash URL，当 `#` 后面的哈希值发生变化时，不会向服务器请求数据，可以通过 `hashchange` 事件来监听到 URL 的变化，从而进行跳转页面。（原文这里把 `#` 误写成了 `##`，改回来了。）

History 模式是 HTML5 新推出的功能，比之 Hash URL 更加美观。

好看只是表面，两者真正的差别在部署上。hash 部分不会被发送到服务器，所以用户刷新 `example.com/#/user/1` 时服务器收到的请求永远是 `example.com/`，怎么配都不会 404。history 模式下刷新 `example.com/user/1`，浏览器会实打实地向服务器请求这个路径，服务器上没有这个文件就直接 404 了。

解决办法是在服务端加一条兜底规则，把所有未匹配到静态资源的请求都返回 `index.html`。Nginx 里就是那行很常见的配置：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

这个坑我见过太多次了，本地 `dev-server` 跑得好好的，一部署到线上刷新就白屏，十有八九是 `try_files` 没配。因为开发服务器默认帮你做了这件事。

另外 SEO 也是选型考虑之一。搜索引擎爬 hash URL 的支持情况一直不理想，需要 SEO 的站点基本只能用 history 模式配合服务端渲染。

## 二、react-router的基本原理

实现 URL 与 UI 界面的同步。其中在 `react-router` 中，URL 对应 `Location` 对象，而 UI 是由 react components 来决定的，这样就转变成 `location` 与 `components` 之间的同步问题。

![react-router 中 location 与 components 的同步关系](http://zhenhua-lee.github.io/img/react-router/base.png)

这句话是整个库的设计纲领，值得拆开看。它把一个看起来很复杂的问题化简成了一个映射：给定一个 location，应该渲染哪些组件。既然是映射，那实现上就分两步，先算出该渲染什么，再触发渲染。前一步是匹配算法，后一步是 React 自己的事。

### 2.1 优点

- 与 React 融为一体，专为 react 量身打造，编码风格与 react 保持一致，例如路由的配置可以通过 `component` 来实现
- 不需要手工维护路由 `state`，使代码变得简单
- 强大的路由管理机制，体现在如下方面
  - 路由配置：可以通过组件、配置对象来进行路由的配置
  - 路由切换：可以通过 `<Link>` `Redirect` 进行路由的切换
  - 路由加载：可以同步加载，也可以异步加载，这样就可以实现按需加载
- 使用方式：不仅可以在浏览器端使用，而且可以在服务器端使用

第一条「路由即组件」是 React Router v4 最大的设计转向，也是当年争议最大的地方。v3 之前路由是一份集中的静态配置，v4 把 `<Route>` 变成了普通组件，可以写在组件树的任意位置，跟着渲染流程动态生效。好处是路由配置能享受 React 的一切能力（条件渲染、组合、代码分割），坏处是你没法在渲染之前拿到完整的路由表，做静态分析和预取就麻烦了。这个取舍在 v6.4 又被掰回来了一部分，后面第四节讲。

### 2.2 react-router具体实现

`react-router` 在 `history` 库的基础上，实现了 URL 与 UI 的同步，分为两个层次来描述具体的实现。

**组件层面描述实现过程**

在 `react-router` 中最主要的 component 是 `Router` `RouterContext` `Link`，`history` 库起到了中间桥梁的作用。

![Router、RouterContext、Link 与 history 库的关系](http://zhenhua-lee.github.io/img/react-router/base.png)

三个角色的分工是这样的。`Router` 是根节点，它持有 history 实例并订阅变化，是唯一和外部世界打交道的地方；`RouterContext` 负责把匹配结果（当前的 location、params、匹配到的路由）通过 context 往下发，这样任意深度的组件都能读到路由信息而不用层层传 props；`Link` 是用户能点的那个入口。

这里用到的就是 React 的 context 机制，它的具体原理和重渲染范围我在 [React 之 context 跨层级传值原理](https://feinterview.poetries.top/blog/react-context) 里单独讲了。React Router 的 `withRouter` 这个高阶组件也是靠它实现的。

以 `browserHistory`（一种 history 类型，一个 history 知道如何去监听浏览器地址栏的变化，并解析这个 URL 转化为 location 对象）为例：

`browserHistory` 进行路由 state 管理，主要通过 `sessionStorage`。

```js
//保存　路由state(router state)
function saveState(key, state) {
  ...
  window.sessionStorage.setItem(createKey(key), JSON.stringify(state));
}
//读取路由state
function readState(key) {
  ...
  json = window.sessionStorage.getItem(createKey(key));
  return JSON.parse(json);
}
```

其中 `saveState` 函数传进来的 `state` 是个 json 对象，如：

```js
{route: '/about'} ///假设此时的location为'/about'
```

拿到 location 之后要做的就是匹配并渲染对应的组件。下面这段是一个极简版，它剥掉了 React Router 的所有封装，只留下最核心的那个 switch：

```js
const About = React.createClass({/*...*/}) //About 组件
const Inbox = React.createClass({/*...*/}) //Inbox 组件
const Home = React.createClass({/*...*/}) //Home组件
 render() {
    let Child
    switch (this.state.route) {
      case '/about': Child = About; break;
      case '/inbox': Child = Inbox; break;
      default:      Child = Home;
    }

    return (
      <div>
        <h1>App</h1>
        <ul>
          <li><a href="#/about">About</a></li>
          <li><a href="#/inbox">Inbox</a></li>
        </ul>
        <Child/>
      </div>
    )
  }
})

React.render(<App />, document.body)
```

看懂这段就理解了前端路由的全部秘密：路由状态就是一个普通的 state，路由匹配就是一个 switch，页面切换就是渲染一个不同的组件。React Router 做的所有事情，是把这个 switch 换成通用的路径匹配算法，把手动维护 `this.state.route` 换成自动订阅 history。

这段代码里有两处 API 已经过时了，说明一下免得照抄。`React.createClass` 在 React 15.5 就被废弃并移到独立包，现在写类组件用 `class X extends React.Component`。`React.render(<App />, document.body)` 一是渲染入口早就移到了 `ReactDOM`，二是 React 18 之后应该用 `ReactDOM.createRoot(container).render(<App />)`，三是不建议直接渲染到 `document.body`，容易和第三方脚本插入的节点打架。

**API层面描述实现过程**

为了简单说明，只描述使用 `browserHistory` 的实现，`hashHistory` 的实现过程是类似的，就不再说明。

![react-router 内部 API 调用链路图](http://zhenhua-lee.github.io/img/react-router/internal.png)

### 2.3 用户点击了Link组件后路由系统中到底发生了哪些变化

这一节是全文最值得记住的部分，因为面试问「React Router 原理」，本质上就是要你把这条链路讲清楚。

![点击 Link 后路由系统内部的完整流程](https://s.poetries.top/gitee/2019/10/429.png)

`Link` 组件最终会渲染为 HTML 标签 `<a>`，它的 `to`、`query`、`hash` 属性会被组合在一起并渲染为 `href` 属性。虽然 `Link` 被渲染为超链接，但在内部实现上使用脚本拦截了浏览器的默认行为，然后调用了 `history.pushState` 方法。

为什么非要渲染成 `<a>` 而不是随便一个 `<span>` 加点击事件？因为可访问性和用户习惯。真实的 `<a href>` 才能被读屏软件识别成链接、才能鼠标悬停时在状态栏显示目标地址、才能右键选择在新标签页打开、才能被搜索引擎爬到。React Router 是在 `onClick` 里调 `event.preventDefault()` 拦掉默认跳转，然后自己接管。

顺带说一句，正因为是拦截，它会放行一些特殊情况：按住 Ctrl 或 Cmd 点击、中键点击、`target="_blank"`，这些都不会被拦，仍然走浏览器的原生跳转打开新标签页。这个行为是刻意保留的。

接下来是内部流程：

- 系统会将上述 `location` 对象作为参数传入到 `transitionTo` 方法中，然后调用 `window.location.hash` 或者 `window.history.pushState()` 修改了应用的 URL，这取决于你创建 `history` 对象的方式。同时会触发 `history.listen` 中注册的事件监听器。
- 接下来请看路由系统内部是如何修改 UI 的。在得到了新的 `location` 对象后，系统内部的 `matchRoutes` 方法会匹配出 `Route` 组件树中与当前 `location` 对象匹配的一个子集，并且得到了 `nextState`。`state` 的结构如下：

```js
nextState = {
  location, // 当前的 location 对象
  routes, // 与 location 对象匹配的 Route 树的子集，是一个数组
  params, // 传入的 param，即 URL 中的参数
  components, // routes 中每个元素对应的组件，同样是数组
};
```

`routes` 和 `components` 都是数组，这一点透露了很关键的信息：匹配结果不是「一个」路由，而是「一条链」。访问 `/user/1/profile`，匹配到的可能是 `/user` 加 `/:id` 加 `/profile` 三层，对应三个组件，外层组件负责布局，内层组件渲染在外层的子节点位置上。嵌套路由就是这么实现的。

在 `Router` 组件的 `componentWillMount` 生命周期方法中调用了 `history.listen(listener)` 方法。`listener` 会在上述 `matchRoutes` 方法执行成功后执行 `listener(nextState)`，`nextState` 对象每个属性的具体含义已经在上述代码中注释，接下来执行 `this.setState(nextState)` 就可以实现重新渲染 `Router` 组件。

举个简单的例子，当 URL（准确地说应该是 `location.pathname`）为 `/archives/posts` 时，应用的匹配结果如下图所示：

![pathname 为 /archives/posts 时的路由匹配结果](https://s.poetries.top/gitee/2019/10/430.png)

到这里，系统已经完成了当用户点击一个由 `Link` 组件渲染出的超链接到页面刷新的全过程。

把整条链路压成一句话就是：拦截点击，改 URL，触发订阅，跑匹配算法，`setState`，React 重渲染。

顺带提一句，`componentWillMount` 这个钩子从 React 16.3 起就被标记为不安全了，现在的实现里订阅逻辑已经挪到了别处。这个改动的来龙去脉可以看 [React 16.3 新生命周期详解](https://feinterview.poetries.top/blog/react-lifecircle)。

## 三、匹配算法在算什么

上面 `matchRoutes` 一笔带过，但它其实是路由库里最有内容的一块。

要解决的问题是：给一个 `pathname` 字符串，和一堆带占位符的路径模式（`/user/:id`、`/posts/*`、`/about`），判断哪些能匹配上，并把 `:id` 这类占位符对应的实际值提取出来。

v4 和 v5 的做法是把路径模式编译成正则。`path-to-regexp` 这个库负责这件事，`/user/:id` 会被编译成类似 `/^\/user\/([^\/]+?)\/?$/` 的正则，捕获组的位置对应参数名，匹配成功后按顺序取出来组装成 `params` 对象。

编译是有成本的，所以库内部会做缓存，同一个路径模式只编译一次。

然后是选哪一个的问题。v5 用 `<Switch>` 包住一组 `<Route>`，规则是从上往下找，渲染第一个匹配上的。这套规则的后果是顺序敏感，你把 `/user` 写在 `/user/new` 前面，访问 `/user/new` 就会命中 `/user`（如果没写 `exact`）。这个坑我踩过，排查了半天最后发现只是两行的顺序问题。

v6 把这块整个换掉了。`<Switch>` 变成 `<Routes>`，匹配从「第一个」改成了「最优的那个」。库会给每个路径模式算一个分数，静态片段分高、动态片段分低、通配符分最低，然后按分数排序取最高的。于是 `/user/new` 和 `/user/:id` 同时存在时，访问 `/user/new` 一定命中前者，跟你写的顺序无关。

这个改动我自己的感受是真的舒服，写路由表终于不用在脑子里维护一份优先级了。代价是 v6 不再兼容 `path-to-regexp` 的全部语法，一些老的正则式路径写法要改。

## 四、从 v4 到 v7 变了什么

这篇写于 2018 年，讲的是 v3 到 v4 那个时代的实现。这几年 React Router 变化不小，把主要的几步补上。

v4 到 v5 基本是平滑的，v5 主要是为了配合 React 的新特性做了些内部调整，API 层面变化很小。

v6 是一次大改。`<Switch>` 换成 `<Routes>`，匹配规则从「第一个匹配」改成「最优匹配」；`component` 和 `render` 两个 prop 合并成了 `element`，直接传 JSX 元素；嵌套路由不再需要在子组件里再写一遍 `<Route>`，改成父路由里用 `<Outlet />` 占位；`useHistory` 换成了 `useNavigate`，`history.push('/a')` 变成 `navigate('/a')`。路径也支持相对写法了，嵌套路由里不用再手动拼父路径。

v6.4 引入了 data router，这一步我觉得是思路上的转向。用 `createBrowserRouter` 以配置对象的方式定义路由表，每个路由可以挂 `loader` 和 `action`，`loader` 在导航发生时就开始取数，组件里用 `useLoaderData` 直接拿结果。

它解决的是渲染时取数的瀑布问题。老写法是组件渲染出来之后在 `useEffect` 里发请求，父组件加载完才轮到子组件发请求，一层套一层。data router 因为在渲染之前就知道完整的路由表，可以把这一条链上所有的 `loader` 并行发出去。

注意这正好和 v4「路由即组件、配置是动态的」那套理念相反。能做静态分析的前提是路由表得是静态的，绕了一圈又回到了配置式。这不是倒退，是把两种模式的优点分开取用。

v7 在 2024 年底发布，把 Remix 合了进来，同一个包既可以当纯客户端路由库用，也可以当带 SSR 的全栈框架用。具体的迁移路径和 API 细节变化比较多，以官方文档为准，我这里不展开了。

不管版本怎么变，第一节讲的那套底层机制没变过。`pushState` 改地址不刷新、`popstate` 监听后退、hash 模式靠 `hashchange`、history 模式部署要配 `try_files`，这些是浏览器给的地基，换几个框架都一样。

## 总结

前端路由这件事拆开只有两步，监听 URL 变化，然后按规则渲染对应组件。难的不是这两步本身，是要在三种差异巨大的环境下都做到。

`history` 库负责第一步。它用 `pushState` 加 `popstate` 实现 history 模式，用改 hash 加 `hashchange` 实现 hash 模式，用一个数组加游标实现内存模式，对外暴露统一的 `push`、`replace`、`listen`。location 上那个 `key` 字段是它自己加的，作用是给 `sessionStorage` 里的路由状态当索引。

React Router 负责第二步。`Router` 订阅 history 变化，变化时跑 `matchRoutes` 算出匹配的路由链和参数，通过 `setState` 触发重渲染，再用 context 把路由信息发给树里任意深度的组件。`Link` 渲染成真实的 `<a>` 但拦截默认行为，保住了可访问性和右键新开标签的能力。

面试被问到的时候，从「点击 Link」开始讲到「组件重渲染」这一条完整链路，比背 API 清单有用得多。

最后留一个实用提醒：history 模式上线前一定检查服务端有没有配兜底路由，这是这套机制里最容易被漏掉的一环，而且只在刷新页面时才暴露。

## 参考

- [React Router 官方文档](https://reactrouter.com/)
- [history 库仓库](https://github.com/remix-run/history)
- [History API - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/History_API)
- [popstate 事件 - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/popstate_event)
- [hashchange 事件 - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/hashchange_event)
- [前端进阶之旅](https://interview.poetries.top)
