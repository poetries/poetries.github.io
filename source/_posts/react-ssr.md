---
title: 从零到一搭建React SSR工程架构(一)
description: 不用框架手写 React SSR 同构架构，讲清 CSR 与 SSR 的差别、双端 webpack 打包、路由同构、Redux 数据预取、styled-components 样式收集与 Node 中间层代理。
date: 2018-11-18 11:10:43
tags:
   - React
   - SSR
   - 同构
   - Webpack
categories: Front-End
---

接手过一个用脚手架起的活动页，运营那边反馈搜索引擎一条都收录不到。右键查看源代码，`<body>` 里只有一个空的 `div#root`，剩下全是 script 标签。爬虫抓到的就是这么个空壳，它当然什么都索引不了。

要解决这个问题，路子只有一条，让页面内容在服务器上就渲染好，直接吐一份带内容的 HTML 给浏览器。React 这套东西叫 SSR，更准确的叫法是同构，同一份组件代码在 Node 里跑一遍生成字符串，在浏览器里再跑一遍把事件接上。

这篇不借助任何现成框架，从 webpack 配置开始，一步一步把这套架子搭出来。看完你会知道每个环节为什么必须这么写，以及哪些地方是坑。至于用框架怎么少写这些代码，放在系列第二篇讲。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 客户端渲染、服务端渲染、同构，三者到底差在哪一步
- SSR 能成立的技术前提是什么，为什么直接操作 DOM 的代码会让它崩掉
- 一次 SSR 请求从进 Node 到浏览器接管，中间到底发生了什么
- 路由为什么必须写两套，`BrowserRouter` 和 `StaticRouter` 各管什么
- 客户端和服务端的 webpack 配置差在哪几个字段上
- 服务端的 Redux Store 为什么绝对不能写成单例
- 怎么保证数据全部取回来之后才生成 HTML
- styled-components 的样式在服务端怎么收集出来
- Node 作为中间层要不要接管数据请求，代理该怎么配
- 这套 2018 年的手写方案，放到今天还剩下多少价值

## 一、先把三个概念分清楚

很多人聊 SSR 的时候其实混着说了三件事，先各自拆开。

### 1.1 什么是客户端渲染

React 在客户端执行，消耗的是客户端性能。页面初始加载的那份 HTML 里没有任何展示内容，浏览器需要先下载并执行 JavaScript 文件里的 React 代码，靠 JS 渲染生成页面，同时把交互事件绑上去。

整条链路是这样走的。

浏览器发送请求-->服务器返回`HTML`-->浏览器发送`bundle.js`请求-->服务器返回`bundle.js`-->浏览器执行`bundle.js`中的`react`代码完成渲染

![客户端渲染 CSR 的完整请求流程](https://s.poetries.top/gitee/2019/10/446.png)

图里最关键的信息是请求的次数。从用户按下回车到看见内容，至少要跨两个 HTTP 请求周期，中间这段时间屏幕上是白的。网速好的时候你察觉不到，4G 弱网或者首屏 bundle 有一两兆的时候，白屏能持续好几秒。

### 1.2 什么是服务端渲染

React 在服务端执行，消耗的是服务端性能。我们说的服务端渲染，只是首次加载页面的时候走服务端，后面的路由跳转还是前端路由在做客户端渲染。

用户请求服务器，服务器上直接生成 HTML 内容返回给浏览器，页面的内容是 Server 端生成的。单纯的服务端渲染页面交互能力有限，想要复杂交互，还是得引入 JavaScript 文件来辅助。

链路缩短成了这样。

浏览器发送请求-->服务器运行`React`代码生成页面-->服务器返回页面

少了一整个请求周期，这就是首屏收益的来源。

### 1.3 什么是同构

一套 React 代码，在服务端执行一次，在客户端也执行一次。

服务端执行 `renderToString` 只是把界面结构变成字符串返回，事件是绑不上的，必须在客户端再执行一次 JS 才能把交互接管过来。完整过程是这样。

服务器运行 React 代码渲染出 HTML，发送 HTML 给浏览器，浏览器接收到内容先展示出来，接着加载 js 文件，JS 中的 React 代码在浏览器端重新执行，最后由它接管页面操作。

路由同构也是同一个意思，让路由在服务端、客户端各跑一遍。

这里有个坑很多人第一次都会踩。服务端渲染出来的 HTML 是能看见的，但在客户端 JS 加载完成之前，页面上所有的点击、输入都是没反应的。用户看到按钮却点不动，这段时间在体验上反而比白屏更让人困惑。所以首屏 JS 的体积对同构应用来说，重要程度一点都没降低。

### 1.4 SSR 到底值不值得上

一般情况下写 React，页面都是客户端执行 JS 逻辑动态挂 DOM 生成的，普通单页面应用采用的就是客户端渲染。大多数场景下这完全够用，那为什么还要折腾同构。

主要是两个原因。

CSR 项目的 TTFP（Time To First Page）时间比较长。回看 1.1 那张流程图，先加载 HTML 文件，再下载页面所需的 JavaScript 文件，然后由 JS 渲染生成页面，这个过程至少涉及两个 HTTP 请求周期，一定会有耗时。低网速下访问普通的 React 或 Vue 应用初始页面会白屏，原因就在这。

CSR 项目的 SEO 能力极弱，在搜索引擎里基本不可能有好的排名。目前大多数搜索引擎主要识别的内容还是 HTML，对 JavaScript 文件内容的识别都还比较弱。如果一个项目的流量入口来自搜索引擎，用 CSR 开发就非常不合适。

SSR 的产生就是为了解决这两个问题。让 React 代码在服务器端先执行一次，用户下载到的 HTML 已经包含了所有页面展示内容，页面展示只需要经历一个 HTTP 请求周期，TTFP 能得到一倍以上的缩减。同时 HTML 里已经有了完整内容，SEO 效果也会变好。之后 React 代码在客户端再次执行，为 HTML 里的内容补上数据和事件绑定，页面就具备了 React 的各种交互能力。

但这个理念实现起来并非易事。先看一眼在 React 中实现 SSR 的架构图。

![React SSR 同构架构的整体结构图](https://s.poetries.top/gitee/2019/10/447.png)

图上多出来的每一个方块，都是你后面要维护的东西。用 SSR 会让原本简单的 React 项目变得非常复杂，可维护性降低，代码问题的追溯也变困难。

我的建议一直是这样，除非你的项目特别依赖搜索引擎流量，或者对首屏时间有硬性要求，否则不要上 SSR。

一个后台管理系统上 SSR，纯属给自己找事。

## 二、SSR 能成立，靠的是虚拟 DOM

为什么 React 这套东西能在服务器上跑起来，根子在虚拟 DOM。

SSR 的工程里，React 代码会在客户端和服务器端各执行一次。你可能会想，这没什么问题，都是 JavaScript 代码，既能在浏览器上运行，又能在 Node 环境下运行。但事实并非如此。如果你的 React 代码里存在直接操作 DOM 的代码，SSR 就实现不了，因为 Node 环境下根本没有 DOM 这个概念，这些代码在 Node 里会直接报错。

React 框架里引入了虚拟 DOM，它是真实 DOM 的一个 JavaScript 对象映射。React 做页面操作时实际上不是直接操作 DOM，而是操作虚拟 DOM，也就是操作普通的 JavaScript 对象，这就让 SSR 成为了可能。在服务器上操作 JavaScript 对象，判断环境是服务器环境，把虚拟 DOM 映射成字符串输出；在客户端也是操作 JavaScript 对象，判断环境是客户端环境，就直接把虚拟 DOM 映射成真实 DOM 完成页面挂载。

顺着这个结论往下推，有几条约束就是自然的了。组件里不能在渲染阶段读 `window`、`document`、`localStorage`，因为 Node 里这些全局对象不存在，一读就是 `ReferenceError`。要用只能放到只在客户端执行的时机里去用。老代码放 `componentDidMount`，函数组件放 `useEffect`，这两个位置服务端都不会执行。

这个我踩过，一个第三方图表库在模块顶层就去摸 `window`，服务端 `require` 进来的瞬间就崩，最后只能改成动态引入。

## 三、整体架构先过一遍

在动手写代码之前，先把一次请求的完整路径摆出来，后面每一步在做什么就有位置感了。

```text
                     ┌──────────────────────────────┐
  浏览器请求 /list   │        Node 服务 (Express)     │
  ───────────────►   │                              │
                     │  1. StaticRouter 匹配路由     │
                     │     react-router-config       │
                     │            │                  │
                     │            ▼                  │
                     │  2. 为本次请求 new 一个 Store  │
                     │            │                  │
                     │            ▼                  │
                     │  3. 收集匹配组件的 loadData    │──── API 服务器
                     │     Promise.all 等全部完成     │◄─── 取数据
                     │            │                  │
                     │            ▼                  │
                     │  4. renderToString 出 HTML     │
                     │     + 收集 styled 样式表       │
                     │            │                  │
                     │            ▼                  │
                     │  5. 拼模板，把 store 脱水成    │
                     │     window.context 注入页面    │
                     └────────────┬─────────────────┘
                                  │  带内容的 HTML
                                  ▼
                     ┌──────────────────────────────┐
                     │           浏览器              │
                     │  6. 直接展示首屏（可见不可点） │
                     │  7. 下载 client bundle        │
                     │  8. 用 window.context 注水     │
                     │     BrowserRouter + hydrate   │
                     │  9. 事件绑定完成，页面可交互   │
                     └──────────────────────────────┘
```

后面的 Step 1 到 Step 5，就是把这张图里的每个方块填上代码。第 5 步和第 8 步是一对，服务端把 Store 序列化写进页面叫脱水，客户端读回来重建 Store 叫注水，两边的初始状态必须完全一致，不然会出问题，这点后面细说。

## 四、Step 1 路由必须拆成两套

实现 React 的 SSR 架构，要让相同的 React 代码在客户端和服务器端各执行一次。注意这里说的相同的 React 代码，指的是我们写的各种组件代码。同构里只有组件代码是可以公用的，路由这种代码没有办法公用。

为什么呢。服务器端要通过请求路径找到路由组件，客户端要通过浏览器地址栏的网址找到路由组件，是完全不同的两套机制，这部分代码肯定无法公用。

### 4.1 客户端路由

```jsx
const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <div>
          <Route path='/' component={Home} />
        </div>
      </BrowserRouter>
    </Provider>
  )
}

ReactDom.render(<App />, document.querySelector('#root'))
```

客户端路由代码非常简单，大家一定很熟悉，`BrowserRouter` 会自动从浏览器地址中匹配对应的路由组件显示出来。

### 4.2 服务器端路由

```jsx
const App = () => {
  return (
    <Provider store={store}>
      <StaticRouter location={req.path} context={context}>
        <div>
          <Route path='/' component={Home} />
        </div>
      </StaticRouter>
    </Provider>
  )
}

return ReactDom.renderToString(<App />)
```

服务器端路由代码相对复杂一点，需要你把 `location`（当前请求路径）传递给 `StaticRouter`，这样它才能根据路径分析出当前需要的组件是谁。`StaticRouter` 是 React-Router 针对服务器端渲染专门提供的路由组件，它不监听地址栏，路径由你手动喂进去。

那个 `context` 对象也别忽略。服务端渲染过程中如果组件里触发了 `Redirect`，React-Router 会把跳转信息写进这个对象，你在 `renderToString` 之后检查 `context.url`，有值就说明该发 302 了，而不是把一个空页面返回出去。

### 4.3 两边的差异往上游传导

`BrowserRouter` 匹配到浏览器即将显示的路由组件，对浏览器来说要把组件转化成 DOM，所以用 `ReactDom.render` 做 DOM 挂载。`StaticRouter` 在服务器端匹配到将要显示的组件，对服务器端来说要把组件转化成字符串，调用 `ReactDom` 提供的 `renderToString` 就能得到 App 组件对应的 HTML 字符串。

对一个 React 应用来说，路由一般是整个程序的执行入口。SSR 里服务器端的路由和客户端的路由不一样，也就是说服务器端的入口代码和客户端的入口代码是不同的。

React 代码要通过 webpack 打包之后才能运行。既然两个入口不同、运行环境也不同，那就得针对运行环境做两份有区别的 webpack 打包。

## 五、Step 2 两份 webpack 配置

### 5.1 客户端 webpack 配置

这份配置的产物是给浏览器下载的，出口落在 `public` 目录，页面里用 script 标签引它。

```js
{
  entry: './src/client/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'public')
  },
  module: {
    rules: [{
      test: /\.js?$/,
      loader: 'babel-loader'
    },{
      test: /\.css?$/,
      use: ['style-loader', {
        loader: 'css-loader',
        options: {modules: true}
      }]
    },{
      test: /\.(png|jpeg|jpg|gif|svg)?$/,
      loader: 'url-loader',
      options: {
        limit: 8000,
        publicPath: '/'
      }
    }]
  }
}
```

### 5.2 服务器端 webpack 配置

这份产物是给 Node 跑的，出口落在 `build`，启动命令直接 `node build/bundle.js`。

```js
{
  target: 'node',
  entry: './src/server/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build')
  },
  externals: [nodeExternals()],
  module: {
    rules: [{
      test: /\.js?$/,
      loader: 'babel-loader'
    },{
      test: /\.css?$/,
      use: ['isomorphic-style-loader', {
        loader: 'css-loader',
        options: {modules: true}
      }]
    },{
      test: /\.(png|jpeg|jpg|gif|svg)?$/,
      loader: 'url-loader',
      options: {
        limit: 8000,
        outputPath: '../public/',
        publicPath: '/'
      }
    }]
  }
};
```

### 5.3 两份配置差在哪几个字段

两段配置放一起看，差异其实就集中在四个地方，逐个说清楚。

**入口不同**。前面已经讲过了，SSR 里服务器端渲染的代码和客户端的入口路由代码有差异，`entry` 首先肯定不同。

**`target: node`**。在服务器端运行的代码，有时需要引入 Node 的一些核心模块，得让 webpack 打包的时候能识别出这类核心模块，一旦发现是核心模块，就不必把模块代码合并到最终生成的代码里。解决办法很简单，在服务器端的 webpack 配置里加上 `target: 'node'` 就行。

**`externals: [nodeExternals()]`**。服务器端渲染的代码如果加载第三方模块，这些模块也不需要被打包到最终源码里，因为 Node 环境下通过 npm 已经装了这些包，直接引用就可以。`webpack-node-externals` 这个插件解决的就是这件事，代码里的 `nodeExternals` 指的就是它。不加这一条会怎样，你会得到一个几兆的服务端 bundle，里面把 `react`、`react-dom`、`express` 全塞进去了，构建慢不说，某些依赖被打包后还会因为找不到运行时资源直接报错。

**CSS loader 不同**。React 代码里引入 CSS 样式时，服务器端打包会处理一遍 CSS，客户端又会处理一遍。服务器端打包用的是 `isomorphic-style-loader`，它处理 CSS 的时候只在对应的 DOM 元素上生成 class 类名，然后把生成的 CSS 样式代码返回给你。客户端打包配置里用的是 `css-loader` 加 `style-loader`，`css-loader` 不但会在 DOM 上生成 class 类名、解析好 CSS 代码，还会通过 `style-loader` 把代码挂到页面上。

这么做有个副作用。页面上的样式实际上最终是客户端渲染时才添加的，所以页面可能会出现一开始没样式的情况，也就是常说的样式闪烁。解决办法是在服务器端渲染时拿到 `isomorphic-style-loader` 返回的样式代码，以字符串的形式塞进服务器端渲染出的 HTML 里。这个思路和第七节 styled-components 的处理是一样的，都是「服务端把样式收集出来，跟着首屏 HTML 一起发下去」。

图片这类文件的引入也一样，`url-loader` 会在服务器端代码和客户端代码打包过程中分别打一遍。这里我偷了个懒，无论服务器端还是客户端打包，都让产物存到 `public` 目录下，虽然文件会打出来两遍，但后打出来的会覆盖之前的，看起来还是只有一份。想优化的话可以让图片只打包一次，借助一些 webpack 插件就能实现，你甚至可以自己写个 loader 来解决。

如果你的 React 应用里没有异步数据获取，单纯做静态内容展示，配到这里一个简单的 SSR 应用就跑起来了。但真实项目里肯定要取异步数据，绝大多数情况下还要用 Redux 管理数据，那就不是这么简单了。

## 六、Step 3 异步数据获取与 Redux

先对比两边的流程差在哪。

客户端渲染中，异步数据结合 Redux 的使用方式是这样走的。

- 创建 `Store`
- 根据路由显示组件
- 派发 `Action` 获取数据
- 更新 `Store` 中的数据
- 组件 `Rerender`

在服务器端，页面一旦确定内容就没有办法 Rerender 了，HTML 字符串一旦拼出来就发走了。这就要求组件显示的时候，Store 的数据必须已经准备好，流程要改成这样。

- 创建 `Store`
- 根据路由分析 `Store` 中需要的数据
- 派发 `Action` 获取数据
- 更新 `Store` 中的数据
- 结合数据和组件生成 `HTML`，一次性返回

差别就在第二步和最后一步。客户端可以先渲染个骨架再补数据，服务端必须先把数据备齐。

### 6.1 服务端的 Store 绝对不能是单例

这一部分有坑，务必避开。客户端渲染中，用户的浏览器里永远只存在一个 Store，所以代码可以这么写。

```js
const store = createStore(reducer, defaultState)
export default store;
```

模块只会被 `require` 一次，`store` 就是个模块级单例，在浏览器里这没问题，一个页面一个用户。

然而在服务器端，这么写就出事了。服务器端进程是所有用户共用的，按上面这样构建，`Store` 变成了一个全局单例，所有用户共享同一份数据。A 用户请求进来往 Store 里写了他的个人信息，B 用户紧接着请求，读到的是 A 的数据。这不是性能问题，是数据串号的线上事故。

所以服务器端渲染里，Store 的创建应该返回一个函数，每个用户访问的时候这个函数重新执行，为每个用户提供一个独立的 Store。

```js
const getStore = (req) => {
  return createStore(reducer, defaultState);
}
export default getStore;
```

顺带一提，同样的道理也适用于任何写在模块顶层的可变状态。全局的缓存对象、用户信息、请求上下文，只要它在模块作用域里并且会被写，在服务端就是共享的。这条规则在今天的 Next.js 里同样成立，只是框架帮你把 Store 这一层藏起来了。

### 6.2 根据路由分析出要加载哪些组件

要实现这一步，服务器端首先要分析出当前路由要加载的所有组件。这里可以借助第三方包，比如 `react-router-config`，把服务器请求路径传进去，它会帮你分析出这个路径下要展示的所有组件。为什么是「所有」而不是一个，因为嵌套路由下一个 URL 往往对应一条组件链，父级 Layout 和子页面都可能各自需要数据。

拿到组件集合之后，接下来在每个组件上挂一个获取数据的方法。

```js
Home.loadData = (store) => {
  return store.dispatch(getHomeList())
}
```

这个方法需要你把服务器端渲染的 Store 传进来，它的作用就是帮服务器端的 Store 获取到这个组件所需的数据。组件上有了这样的方法，同时我们又有当前路由所需要的所有组件，依次调用各个组件上的 `loadData`，就能拿到路由所需的全部数据。

注意 `loadData` 是挂在组件这个函数对象上的静态属性，不是实例方法。服务端渲染时组件还没被实例化，只能通过静态属性这条路去要数据。

### 6.3 等所有数据都回来再生成 HTML

执行上一步的时候其实已经在更新 Store 了，但我们要保证生成 HTML 之前所有数据都获取完毕，这怎么处理。

```js
// matchedRoutes 是当前路由对应的所有需要显示的组件集合
matchedRoutes.forEach(item => {
  if (item.route.loadData) {
    const promise = new Promise((resolve, reject) => {
      item.route.loadData(store).then(resolve).catch(resolve);
    })
    promises.push(promise);
  }
})

Promise.all(promises).then(() => {
  // 生成 HTML 逻辑
})
```

构建一个 Promise 队列，等所有 Promise 都执行结束，也就是所有 `store.dispatch` 都完成之后，再去生成 HTML，结合 Redux 的 SSR 流程就通了。

这段代码里有个细节值得单独拎出来。`.catch(resolve)` 而不是 `.catch(reject)`，是故意的。只要有一个接口挂了就走 `reject`，`Promise.all` 会整体失败，结果是整个页面渲染不出来。改成 `catch` 里也 `resolve`，某个模块的数据没取到，那块区域空着，页面其余部分照常渲染出去。SSR 场景下这个降级策略基本是必须的，一个推荐位接口超时不该让整个首页 500。

代价是你会丢掉错误信息，所以实际项目里 `catch` 里除了 `resolve` 还应该打一条日志，不然线上某个模块常年空着都没人知道。

### 6.4 客户端为什么还要再取一遍数据

服务器端渲染时页面数据是通过 `loadData` 拿的。而在客户端，数据获取依然要做。

原因是这样，如果这个页面是你访问的第一个页面，你看到的内容是服务器端渲染出来的；但如果经过 react-router 路由跳转到了第二个页面，那这个页面完全是客户端渲染出来的，服务端根本没参与，数据只能客户端自己去拿。

在客户端获取数据用的是最熟悉的方式，`componentDidMount`。这里要注意，`componentDidMount` 只在客户端执行，服务器端这个生命周期函数不会执行，所以不用担心它和 `loadData` 会冲突，放心用。这也是为什么数据获取应该放在 `componentDidMount` 而不是 `componentWillMount` 里，可以避免服务器端取数据和客户端取数据打架。

补一句现在的写法。`componentWillMount` 后来被 React 标记为不安全并改名成 `UNSAFE_componentWillMount`，函数组件时代这个位置由 `useEffect` 接管，`useEffect` 同样只在客户端执行，服务端不跑，结论没变，只是 API 换了名字。

还有一个和它配套的东西是脱水与注水。服务端渲染完之后要把 Store 的当前状态序列化写进 HTML，客户端启动时读回来作为初始 state，这样两边第一次渲染的结果才一致。落到代码上就是下一节模板里那个 `window.context`。如果漏了这一步，客户端第一次渲染会用空的默认 state，和服务端发下来的 DOM 对不上，React 就会警告结构不匹配，严重的直接把首屏内容整片替换掉，SSR 白做了。

## 七、Step 4 处理 styled-components 的样式

用了 CSS-in-JS 就绕不开这一节。样式是运行时生成的，服务端不主动收集，首屏 HTML 里就一条样式规则都没有，页面会先闪一下裸结构再套上样式。

styled-components 暴露了 `ServerStyleSheet`，它允许我们把渲染过程中用到的所有 styled 组件创建成一个样式表，这个样式表稍后会传进我们的 HTML 模板。

```jsx
//render.js
import React from 'react';
import {StaticRouter} from 'react-router-dom'
import {renderToString} from 'react-dom/server'
import renderHTML from './template'
import { Provider } from 'react-redux'
import { ServerStyleSheet } from 'styled-components';

export const render = (store,routes,req,context)=>{
    const sheet = new ServerStyleSheet(); // <-- 创建样式表

    const content = renderToString(
      // 收集样式
      sheet.collectStyles(
        <Provider store={store}>
          <StaticRouter location={req.path} context={context}>
            {routes}
          </StaticRouter>
        </Provider>
      )
    )

    const styles = sheet.getStyleTags(); // <-- 从表中获取所有标签
    return renderHTML(content,store,styles)
}
```

顺序不能反。`getStyleTags` 必须在 `renderToString` 之后调用，因为样式是在渲染过程中被组件用到时才登记进 sheet 的，渲染还没发生你去取，拿到的是空字符串。这个我一开始也搞错过，把两行调换了位置，结果页面上样式一片都没有。

接着把 `styles` 作为参数加进 HTML 函数，在模板字符串里插入这个参数。

```js
// template.js
export default (content,store,styles)=>`
  <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#000000">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-touch-fullscreen" content="yes">
        <title>好物为您聚集大平台的优惠商品，让你更便捷的找到你想要的宝物</title>
        <link rel="shortcut icon" href="/favicon.ico">
        <link rel="stylesheet" href="${buildPath['vendor.css']}" />
        <link rel="stylesheet" href="${buildPath['main.css']}" />
        ${styles}
      </head>
      <body>
      <div id="root">${content}</div>
      <script>
        window.context = {
          state: ${JSON.stringify(store.getState())}
        }
      </script>
      </body>
  </html>
`
```

这份模板里有三个位置各自对应前面讲过的一件事。`${styles}` 是 Step 4 收集的样式，`${content}` 是 `renderToString` 的产物，`window.context` 就是 6.4 说的脱水。客户端 `createStore` 的时候把 `window.context.state` 当初始值传进去，两边状态就对齐了。

代码里的 `buildPath` 需要你自己从 webpack 的 manifest 里读进来，它保存的是带 hash 的文件名映射，这份代码片段里没写出来。真跑的时候这一步不能少，否则模板里这两行会渲染成 `undefined`。

还有一个安全点原文没提，但必须说。`JSON.stringify` 出来的内容如果包含用户可控的字符串，里面的 `</script>` 会提前闭合这个标签，形成 XSS 注入。生产环境要把 `<` 转义掉，或者用 `serialize-javascript` 这类库来做序列化，别直接拼。

## 八、Step 5 Node 只是一个中间层

SSR 架构里，一般 Node 只做 React 代码的服务器端渲染，Node 需要的数据通常由 API 服务器单独提供。

![Node 中间层与 API 服务器的分层结构](https://s.poetries.top/gitee/2019/10/448.png)

这张图要看的是箭头方向。服务器端渲染时，Node 直接请求 API 服务器的接口拿数据，没有任何问题，服务端之间调用不存在跨域。但在客户端就有可能存在跨域问题了。

所以这时候需要在 Node 服务上搭一个 Proxy 代理，客户端不直接请求 API 服务器，而是请求 Node 服务器，经过代理转发拿到 API 服务器的数据。

可以用 `express-http-proxy` 这样的工具快速搭代理。配置的时候记得，要让代理服务器不仅仅帮你转发请求，还要把 cookie 带上，这样才不会有权限校验上的问题。

```js
// Node 代理功能实现代码
app.use('/api', proxy('http://apiServer.com', {
  proxyReqPathResolver: function (req) {
    return '/ssr' + req.url;
  }
}));
```

这里还有一个容易漏的点。同一个页面的同一份数据，服务端走的是 `http://apiServer.com/ssr/xxx`，客户端走的是当前域名下的 `/api/xxx`，两条路径不同但必须返回同样的结构。实际做法是在请求封装里判断运行环境，服务端用绝对地址加内网域名，客户端用相对地址，业务代码里只写 `request('/list')` 这一种形式。

## 九、上线前 checklist

这套东西链路长，出问题的位置又分散，我自己整理了一份上线前逐条过的清单。

- [ ] 组件渲染阶段没有直接读 `window` / `document` / `localStorage`，需要用的全部挪进 `componentDidMount` 或 `useEffect`
- [ ] 服务端 Store 用 `getStore()` 工厂函数创建，确认没有任何模块级可变单例
- [ ] `Promise.all` 里每个数据请求都有 `catch` 兜底，并且 catch 里有日志
- [ ] 每个数据接口都设了超时时间，避免一个慢接口把 Node 的响应整个拖住
- [ ] `renderToString` 之后检查了 `context.url`，有值时返回 302 而不是空页面
- [ ] `window.context` 的序列化做了 XSS 转义
- [ ] 客户端 `createStore` 读的是 `window.context.state`，控制台没有 hydrate 结构不匹配的警告
- [ ] 服务端 webpack 配了 `target: 'node'` 和 `nodeExternals()`，bundle 体积正常
- [ ] Node 进程挂了能自动拉起，前面有 Nginx 反代，这块的具体做法在系列第三篇 [next项目部署到服务器pm2进程守护](https://feinterview.poetries.top/blog/react-ssr-next-deploy) 里
- [ ] 压过一轮，知道单机 QPS 上限在哪。`renderToString` 是同步阻塞的，它跑的时候整个事件循环都在等它

最后这条是 SSR 和 CSR 在运维上最大的区别。CSR 的 Node 只发静态文件，SSR 的 Node 每个请求都要跑一遍 React 渲染，CPU 打满得比你预期快很多。

## 十、这套写法放到今天

文章写于 2018 年，上面每一行代码在当时都是要自己写的。这几年框架层面变化不小，说说现在的位置，免得你照着这篇去搭新项目走弯路。

`renderToString` 还在，API 没被删。但从 React 18 开始，`react-dom/server` 提供了 `renderToPipeableStream`（Node 环境）和 `renderToReadableStream`（Web Stream 环境），走的是流式 SSR，配合 `Suspense` 可以让 HTML 一段一段吐给浏览器，不用等整棵树都渲染完。慢的那部分包在 `Suspense` 里先发个占位，数据回来了再补，首屏时间比同步的 `renderToString` 好一截。React 18 这一批变化我在 [React 18 新特性详解](https://feinterview.poetries.top/blog/react-18-new-features) 里写过。

`ReactDom.render` 在客户端接管 SSR 产物这件事上也被换掉了，现在对应的是 `hydrateRoot`。语义更清楚，它明确表示「DOM 已经有了，只补事件」，而不是重新渲染一遍。

至于本文里手写的路由拆分、双端 webpack、数据预取、样式收集这四件事，在 Next.js 这类框架里已经全部内置了。你不用配两份 webpack，也不用自己写 `loadData` 收集器。框架怎么把这些事替你做掉，是系列第二篇 [使用Next搭建React SSR工程架构之基础篇(二)](https://feinterview.poetries.top/blog/react-ssr-next) 的内容。

那这篇还有什么用。用处在于，框架把复杂度藏起来了，但没有消灭它。你在 Next.js 里遇到「服务端读不到 window」「hydration 报结构不匹配」「数据在两个用户之间串了」这些问题时，能想起来底下是这套机制在跑，排查速度完全不一样。

## 十一、完整代码示例

配套仓库在这里，可以直接跑起来对照着看。

> https://github.com/poetries/react-ssr

## 总结

手写一套 React SSR，绕不开的就是这几件事。

路由必须写两套，服务端用 `StaticRouter` 手动喂路径，客户端用 `BrowserRouter` 读地址栏，中间的组件代码才是公用的那部分。webpack 也得两份，服务端那份记住 `target: 'node'` 和 `nodeExternals()` 这两个字段，少一个都会出问题。

数据这块最容易出事故的是 Store 单例，服务端一定要用工厂函数按请求创建。数据预取用 `Promise.all` 等齐，但每个 Promise 都要有 catch 兜底，不能让一个接口拖垮整页。渲染完把 Store 脱水进 `window.context`，客户端注水回来，两边初始状态对齐，hydrate 才不会报错。

样式和图片这两类资源在两端都要处理一遍，服务端负责把样式字符串收集出来跟 HTML 一起发，客户端负责挂载，中间那段样式闪烁就是这么消掉的。

至于要不要上 SSR，我的答案还是那句，看你的流量是不是来自搜索引擎，或者首屏时间是不是硬指标。不是的话，这套复杂度不值得。

## 参考

- [React DOM Server API 官方文档](https://react.dev/reference/react-dom/server)
- [renderToPipeableStream 文档](https://react.dev/reference/react-dom/server/renderToPipeableStream)
- [hydrateRoot 文档](https://react.dev/reference/react-dom/client/hydrateRoot)
- [React Router StaticRouter 说明](https://reactrouter.com/)
- [webpack-node-externals](https://github.com/liady/webpack-node-externals)
- [styled-components 服务端渲染文档](https://styled-components.com/docs/advanced#server-side-rendering)
- [前端进阶之旅](https://interview.poetries.top)
