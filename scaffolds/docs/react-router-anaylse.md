---
title: React Router原理
date: 2018-12-20 14:00:24
tags: 
  - React
  - Javascript
categories: Front-End
---

## 一、React Router基础之history

### 1.1 History介绍

> `history`是一个独立的第三方js库，可以用来兼容在不同浏览器、不同环境下对历史记录的管理，拥有统一的`API`。具体来说里面的`history`分为三类

- 老浏览器的`history`: 主要通过`hash`来实现，对应`createHashHistory`
- 高版本浏览器: 通过`html5`里面的`history`，对应`createBrowserHistory`
- `node`环境下: 主要存储在`memeory`里面，对应`createMemoryHistory`

> 上面针对不同的环境提供了三个`API`，但是三个`API`有一些共性的操作，将其抽象了一个公共的文件`createHistory`

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

> 上述这些方式是`history`内部最基础的方法，`createHashHistory`、`createBrowserHistory`、`createMemoryHistory`只是覆盖其中的某些方法而已。其中需要注意的是，此时的`location`跟浏览器原生的`location`是不相同的，最大的区别就在于里面多了`key`字段，`history`内部通过`key`来进行`location`的操作

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

### 1.2 内部解析

> 三个`API`的大致的技术实现如下

- `createBrowserHistory`: 利用`HTML5`里面的`history`
- `createHashHistory`: 通过`hash`来存储在不同状态下的`history`信息
- `createMemoryHistory`: 在内存中进行历史记录的存储`

#### 1.2.1 执行URL前进

- `createBrowserHistory`: `pushState`、`replaceState`
- `createHashHistory`: `location.hash=*** location.replace()`
- `createMemoryHistory`: 在内存中进行历史记录的存储

```js
// 伪代码

// createBrowserHistory(HTML5)中的前进实现
function finishTransition(location) {
  ...
  const historyState = { key };
  ...
  if (location.action === 'PUSH') ) {
    window.history.pushState(historyState, null, path);
  } else {
    window.history.replaceState(historyState, null, path)
  }
}
// createHashHistory的内部实现
function finishTransition(location) {
  ...
  if (location.action === 'PUSH') ) {
    window.location.hash = path;
  } else {
    window.location.replace(
    window.location.pathname + window.location.search + '#' + path
  );
  }
}
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
```

#### 1.2.2 检测URL回退

- `createBrowserHistory`: `popstate`
- `createHashHistory`: `hashchange`
- `createMemoryHistory`:因为是在内存中操作，跟浏览器没有关系，不涉及`UI`层面的事情，所以可以直接进行历史信息的回退

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

#### 1.2.3 state的存储

> 为了维护`state`的状态，将其存储在`sessionStorage`里面:


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

### 1.3 小结

**路由原理**

> 前端路由实现起来其实很简单，本质就是监听 `URL` 的变化，然后匹配路由规则，显示相应的页面，并且无须刷新。目前单页面使用的路由就只有两种实现方式

- `hash` 模式
- `history` 模式

> `www.test.com/##/` 就是 `Hash URL`，当 `##` 后面的哈希值发生变化时，不会向服务器请求数据，可以通过 `hashchange` 事件来监听到 `URL` 的变化，从而进行跳转页面。

![](https://user-gold-cdn.xitu.io/2018/7/11/164888109d57995f?w=942&h=493&f=png&s=39581)


> `History`模式是 `HTML5 `新推出的功能，比之 `Hash URL` 更加美观

![](https://user-gold-cdn.xitu.io/2018/7/11/164888478584a217?w=1244&h=585&f=png&s=59637)




## 二、react-router的基本原理

> 实现`URL`与`UI`界面的同步。其中在`react-router`中，`URL`对应`Location`对象，而`UI`是由`react components`来决定的，这样就转变成`location`与`components`之间的同步问题

![](http://zhenhua-lee.github.io/img/react-router/base.png)

### 2.1 优点

- 与`React`融为一体,专为`react`量身打造，编码风格与`react`保持一致，例如路由的配置可以通过`component`来实现
- 不需要手工维护路由`state`，使代码变得简单
- 强大的路由管理机制，体现在如下方面
  - 路由配置: 可以通过组件、配置对象来进行路由的配置
  - 路由切换: 可以通过`<Link>` `Redirect`进行路由的切换
  - 路由加载: 可以同步记载，也可以异步加载，这样就可以实现按需加载
- 使用方式: 不仅可以在浏览器端的使用，而且可以在服务器端的使用


### 2.2 react-router具体实现

> `react-router`在`history`库的基础上，实现了`URL`与`UI`的同步，分为两个层次来描述具体的实现。

**组件层面描述实现过程**

> 在`react-router`中最主要的`component`是`Router RouterContext Link`，`history`库起到了中间桥梁的作用

![](http://zhenhua-lee.github.io/img/react-router/base.png)

> 以`browserHistory`(一种`history`类型:一个 `history` 知道如何去监听浏览器地址栏的变化， 并解析这个 `URL` 转化为 `location` 对象)为例 :

- `browserHistory`进行路由`state`管理,主要通过`sessionStorage`

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


> 其中`saveState`函数传进来的`state`是个`json`对象，如：

```js
{route: '/about'} ///假设此时的location为'/about'
```

> 进行路由匹配，最终渲染对应的组件

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


**API层面描述实现过程**

> 为了简单说明，只描述使用`browserHistory`的实现，`hashHistory`的实现过程是类似的，就不在说明

![](http://zhenhua-lee.github.io/img/react-router/internal.png)

### 2.3 用户点击了Link组件后路由系统中到底发生了哪些变化

![](https://poetries1.gitee.io/img-repo/2019/10/429.png)

> `Link` 组件最终会渲染为 `HTML` 标签 `<a>`，它的 `to`、`query`、`hash`属性会被组合在一起并渲染为 `href` 属性。虽然 `Link` 被渲染为超链接，但在内部实现上使用脚本拦截了浏览器的默认行为，然后调用了`history.pushState` 方法

- 系统会将上述 `location`对象作为参数传入到 `TransitionTo`方法中，然后调用 `window.location.hash` 或者`window.history.pushState()` 修改了应用的 `URL`，这取决于你创建`history`对象的方式。同时会触发`history.listen` 中注册的事件监听器。
- 接下来请看路由系统内部是如何修改`UI` 的。在得到了新的`location`对象后，系统内部的 `matchRoutes` 方法会匹配出`Route` 组件树中与当前`location`对象匹配的一个子集，并且得到了 `nextState`，具体的匹配算法不在这里讲解，感兴趣的同学可以点击查看，`state` 的结构如下

```js
nextState = {
  location, // 当前的 location 对象
  routes, // 与 location 对象匹配的 Route 树的子集，是一个数组
  params, // 传入的 param，即 URL 中的参数
  components, // routes 中每个元素对应的组件，同样是数组
};
```

> 在 `Router` 组件的 `componentWillMount` 生命周期方法中调用了 `history.listen(listener)` 方法。`listener` 会在上述 `matchRoutes` 方法执行成功后执行`listener(nextState)`，`nextState`对象每个属性的具体含义已经在上述代码中注释，接下来执行`this.setState(nextState)` 就可以实现重新渲染 `Router`组件。举个简单的例子，当 URL（准确的说应该是 `location.pathname`） 为 `/archives/posts` 时，应用的匹配结果如下图所示

![](https://poetries1.gitee.io/img-repo/2019/10/430.png)

> 到这里，系统已经完成了当用户点击一个由 `Link` 组件渲染出的超链接到页面刷新的全过程
