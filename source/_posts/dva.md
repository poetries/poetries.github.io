---
title: Dva实践总结，从五个 API 到 model 数据流落地
date: 2018-09-05 16:00:43
description: 从 dva 的 5 个 API 和 9 个概念讲起，拆开 model 里 state、reducers、effects、subscriptions 的职责边界，配计数器和用户管理两个完整案例、axios 统一拦截封装，并补上现在还要不要选 dva 的判断。
tags:
  - Dva
  - React
  - Redux
  - redux-saga
  - 状态管理
categories: Front-End
---

写 Redux 最烦的是一个功能要开三个文件。actionTypes 定义常量，actions 写创建函数，reducers 写 switch，异步还得再挂一层 redux-thunk 或者 redux-saga，改一个字段得在四个地方来回跳。dva 把这些东西收进了一个 model 文件，namespace、state、reducers、effects、subscriptions 五个字段写完，一个业务模块的数据流就齐了。

这篇是我 2018 年做 dva 项目时整理的实践笔记，从环境搭建、5 个 API、9 个概念一路写到用户管理页的完整落地，最后还有 axios 统一拦截的那套封装。原来的代码和写法我一字没删，另外补了一节现在再看 dva 的判断，什么项目还能继续用它，什么项目应该换掉。读完你至少能自己判断 model 里的一段逻辑该放 reducer 还是 effect。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- dva 到底把 React-Router、Redux、redux-saga 这三样东西粘成了什么形状
- 5 个 API 各管一件什么事，hooks 里那几个配置项分别在什么场景才会用到
- model 的五个字段怎么分工，reducer 和 effect 的边界卡在哪
- subscriptions 这个别的数据流库都没有的东西，能干什么
- 一个计数器例子把 state、action、reducer、effect、subscription 全串一遍
- 用户管理页的完整实践，从抽 model 到拆容器组件、展示组件
- 同一个需求用原生 Redux 和用 dva 分别要写多少东西
- 基于 axios 做统一错误拦截、进度条和权限跳转的一份可抄封装
- 2026 年再看 dva，什么项目还能用，什么项目该换成别的方案

## 一、环境搭建

dva 自带脚手架 `dva-cli`，三行命令就能起一个能跑的工程，省掉自己配 webpack、react-router、redux、redux-saga 这一整套的时间。

```shell
$ npm install dva-cli -g

# 创建应用
$ dva new dva-quickstart

# 启动
$ npm start
```

起完项目先看目录。dva 脚手架生成的结构本身就是一份约定，`routes` 放页面级组件，`components` 放可复用的展示组件，`models` 放数据，`services` 放接口，这套分法后面所有实践都建立在它上面。

> react项目的推荐目录结构（如果使用dva脚手架创建，则自动生成如下）

```javascript
|── /mock/             # 数据mock的接口文件
|── /src/              # 项目源码目录（我们开发的主要工作区域）
|   |── /components/   # 项目组件（用于路由组件内引用的可复用组件）
|   |── /routes/       # 路由组件（页面维度）
|   |  |── route1.js
|   |  |── route2.js   # 根据router.js中的映射，在不同的url下，挂载不同的路由组件
|   |  └── route3.js
|   |── /models/       # 数据模型（可以理解为store，用于存储数据与方法）
|   |  |── model1.js
|   |  |── model2.js   # 选择分离为多个model模型，是根据业务实体进行划分
|   |  └── model3.js
|   |── /services/     # 数据接口（处理前台页面的ajax请求，转发到后台）
|   |── /utils/        # 工具函数（工具库，存储通用函数与配置参数）
|   |── router.js       # 路由配置（定义路由与对应的路由组件）
|   |── index.js       # 入口文件
|   |── index.less
|   └── index.html
|── package.json       # 项目信息
└── proxy.config.js    # 数据mock配置
```


这里有个容易被忽略的点，`routes` 这个名字很误导人，它装的不是路由配置，而是页面维度的容器组件，真正的路由表在 `router.js` 里。后面 umi 出来之后把这个目录改名叫 `pages`，就是为了消掉这个歧义。umi 那套约定式路由怎么改变目录组织方式，我在 [使用 umi 改进 dva 项目开发](https://feinterview.poetries.top/blog/umi-dva) 里单独写过。

**使用 antd**

```
npm i babel-plugin-import --save
```

> `babel-plugin-import` 是用来按需加载 `antd` 的脚本和样式的

antd 那时候整包引进来样式几百 KB，不做按需加载首屏会被拖死。`babel-plugin-import` 干的事是在编译期把 `import { Button } from 'antd'` 改写成只引 Button 那一个模块和它的样式文件。

- 编辑 `.webpackrc`，使 `babel-plugin-import` 插件生效

```javascript
{
+  "extraBabelPlugins": [
+    ["import", { "libraryName": "antd", "libraryDirectory": "es", "style": "css" }]
+  ]
}
```

这段配置放到今天已经不需要了。antd 从 v5 开始换成了 cssinjs 方案，样式跟着组件按需注入，不再有一个整包的 `antd.css` 要你手动裁剪，`babel-plugin-import` 也就失去了存在的意义，官方文档里明确不再推荐配它。我把原来的写法留在这儿，是因为你接手 2018 到 2020 年之间的老项目，大概率还会在 `.webpackrc` 或者 `.umirc.js` 里看到它，知道它当年解决的是什么问题，你才敢删。

## 二、初识Dva

### 2.1 Dva的特性

dva 自己给的定义就一行等式，它不是又造了一个状态管理库，而是把三个已经成熟的东西粘在一起，再补上一层约定。

```
dva = React-Router + Redux + Redux-saga
```

这个定位很关键。你在 dva 里遇到的绝大多数疑问，答案都在 Redux 或者 redux-saga 的文档里，dva 只负责把它们的样板代码收掉。

- 仅有 5 个` API`，仅有5个主要的`api`
- 支持 `HMR`，支持模块的热更新
- 支持 `SSR (ServerSideRender)`，支持服务器端渲染
- 支持 `Mobile/ReactNative`，支持移动手机端的代码编写
- 支持`TypeScript`
- 支持路由和 `Model` 的动态加载

### 2.2 Dva的五个API

整个 dva 的对外接口就下面这张图上的几个方法，从创建实例、装插件、注册 model、注册路由到启动，是一条固定的流水线。

 ![dva 的五个核心 API：dva()、app.use()、app.model()、app.router()、app.start() 的调用顺序示意](https://s.poetries.top/gitee/20191001/43.png)

图里这个顺序不是随便排的，它就是每个 dva 项目 `index.js` 的样子。`app.start()` 之前的每一步都在往实例上挂东西，start 的那一刻才真正创建 redux store 并把 saga 跑起来，所以 model 和路由必须在 start 之前注册完。

#### 2.2.1 app = dva(Opts)

> `app = dva(Opts)`：创建应用，返回 `dva` 实例。(注：dva 支持多实例)**

这一步是整个应用唯一的全局配置入口。下面这些 hooks 平时你可能一个都用不上，但知道它们存在很有用，因为像日志、全局错误提示、状态持久化这类需求，正确的挂载点就在这里，而不是散在各个 model 里。

在`opts`可以配置所有的`hooks`

```javascript
const app = dva({
     history,
     initialState,
     onError,
     onAction,
     onStateChange,
     onReducer,
     onEffect,
     onHmr,
     extraReducers,
     extraEnhancers,
});
```

> hooks包含如下配置项


1、 `onError((err, dispatch) => {})`


- `effect` 执行错误或 `subscription` 通过` done` 主动抛错时触发，可用于管理全局出错状态
- 注意：`subscription` 并没有加 `try...catch`，所以有错误时需通过第二个参数 `done` 主动抛错

这个 hook 是我认为最值得第一天就配上的。effect 里如果不写 try/catch，请求挂了默认是静默失败的，页面就一直转圈，用户看不到任何提示。有了 `onError` 你可以在这里统一弹一个 antd 的 `message.error`，所有 effect 都不用自己处理异常。

```javascript
app.model({
  subscriptions: {
    setup({ dispatch }, done) {
      done(e)
    },
  },
})
```

2、 `onAction(fn | fn[])`

> 在`action`被`dispatch`时触发，用于注册 `redux` 中间件。支持函数或函数数组格式

- 例如我们要通过 `redux-logger` 打印日志

```javascript
import createLogger from 'redux-logger';
const app = dva({
  onAction: createLogger(opts),
})
```

`onAction` 的本质就是 Redux 的 `applyMiddleware`，任何一个标准 redux 中间件都能塞进来。

3、 `onStateChange(fn)`

> `state` 改变时触发，可用于同步 state 到 `localStorage`，服务器端等

做「刷新页面不丢购物车」「记住上次筛选条件」这类需求就靠它。要注意这个回调触发得非常频繁，每次 state 变都会走一遍，里面别做重活，写 localStorage 记得节流。

4、 `onReducer(fn)`

> 封装 `reducer` 执行，比如借助 `redux-undo` 实现 `redo/undo `

```javascript
import undoable from 'redux-undo';
const app = dva({
  onReducer: reducer => {
    return (state, action) => {
      const undoOpts = {};
      const newState = undoable(reducer, undoOpts)(state, action);
      // 由于 dva 同步了 routing 数据，所以需要把这部分还原
      return { ...newState, routing: newState.present.routing };
    },
  },
})
```

5、 `onEffect(fn)`

> 封装 `effect` 执行。比如 `dva-loading` 基于此实现了自动处理 `loading` 状态

这个设计我一直觉得挺聪明。`onEffect` 相当于给每个 effect 套了一层壳，进函数前打个标记、出来再抹掉，`dva-loading` 就靠这一层自动维护了全局的 `loading.effects['user/query']`，你再也不用在每个 model 里手写 `showLoading` / `hideLoading` 这一对 reducer。

6、 `onHmr(fn)`

> 热替换相关，目前用于 `babel-plugin-dva-hmr`

7、 `extraReducers`

> 指定额外的 `reducer`，比如 `redux-form` 需要指定额外的 `form reducer`


```javascript
import { reducer as formReducer } from 'redux-form'
const app = dva({
  extraReducers: {
    form: formReducer,
  },
})
```

上面这一串里，日常真正会改的其实只有一个。

> 这里比较常用的是，`history`的配置，一般默认的是`hashHistory`，如果要配置 `history `为 `browserHistory`，可以这样

```javascript
import createHistory from 'history/createBrowserHistory';
const app = dva({
  history: createHistory(),
});
```

换成 `browserHistory` 之后 URL 里的 `#` 就没了，代价是服务端要配一条 fallback 规则，把所有未匹配的路径都指回 `index.html`，否则用户刷新非首页路由会直接 404。这个坑上线当天踩的人特别多。

> `initialState`：指定初始数据，优先级高于 `model` 中的 `state`，默认是 `{}`，但是基本上都在`modal`里面设置相应的`state`

`initialState` 真正有用的场景是服务端渲染的数据注水，把服务端算好的初始状态直接塞进来。纯客户端项目里基本用不到，state 写在各自的 model 里更好维护。


#### 2.2.2 app.use(Hooks)

> app.use(Hooks)：配置 hooks 或者注册插件

这里最常见的就是`dva-loading`插件的配置

```javascript
import createLoading from 'dva-loading';
...
app.use(createLoading(opts));
```

> 但是一般对于全局的`loading`我们会根据业务的不同来显示相应不同的`loading`图标，我们可以根据自己的需要来选择注册相应的插件

装上 `dva-loading` 之后，全局 state 上会多一个 `loading` 命名空间，组件里 `mapStateToProps` 直接读 `loading.effects['users/query']` 就能拿到那个请求的进行状态，接到 antd Table 的 `loading` 属性上，一行代码搞定。这是我在 dva 项目里唯一每次都会装的插件。

#### 2.2.3 app.model(ModelObject)

> `app.model(ModelObject)`：这个是你数据逻辑处理，数据流动的地方

 ![dva model 的组成结构，包含 namespace、state、reducers、effects、subscriptions 五个部分及其数据流向](https://s.poetries.top/gitee/20191001/44.png)

这张图基本可以当 model 的字段速查表来看。左边进来的是 action，中间 effects 负责跟服务端打交道，reducers 负责改 state，subscriptions 是唯一一个从外部世界（路由、键盘、websocket）往里灌 action 的口子。后面 2.3 节会把这几块逐个拆开。

#### 2.2.4 app.unmodel(namespace)

> 取消 `model` 注册，清理 `reducers`,` effects` 和 `subscriptions`。`subscription` 如果没有返回 `unlisten` 函数，使用 `app.unmodel` 会给予警告

这个 API 平时手写得少，但按需加载的路由背后就是它在做卸载。那句警告其实是在提醒你可能有内存泄漏，`subscription` 里注册的监听如果不返回 `unlisten`，model 卸载了监听还挂着，路由来回切几次就叠了好几份。


#### 2.2.5 app.router(Function)

> 注册路由表，这一操作步骤在dva中也很重要

```javascript
// 注册路由
app.router(require('./router'))


// 路由文件
import { Router, Route } from 'dva/router';
import IndexPage from './routes/IndexPage'
import TodoList from './routes/TodoList'

function RouterConfig({ history }) {
  return (
    <Router history={history}>
        <Route path="/" component={IndexPage} />
        <Route path='/todoList' components={TodoList}/>
    </Router>
  )
}
export default RouterConfig
```

这份路由文件就是一个普通的 React 组件，`dva/router` 转手导出的其实是 react-router 的能力，所以 react-router 的文档在这里全部适用。

上面这种写法有个明显的问题，所有页面组件都在入口被静态 import 进来了，打包出来是一个大 bundle，首屏得把整个后台系统的代码都下完才能渲染。

> 如果我们想解决组件动态加载问题，我们的路由文件也可以按照下面的写法来写

```javascript
import { Router, Switch, Route } from 'dva/router'
import dynamic from 'dva/dynamic'

function RouterConfig({ history, app }) {
  const IndexPage = dynamic({
    app,
    component: () => import('./routes/IndexPage'),
  })

  const Users = dynamic({
    app,
    models: () => [import('./models/users')],
    component: () => import('./routes/Users'),
  })

  return (
    <Router history={history}>
      <Switch>
        <Route exact path="/" component={IndexPage} />
        <Route exact path="/users" component={Users} />
      </Switch>
    </Router>
  )
}

export default RouterConfig
```

> 其中`dynamic(opts)` 中`opt`包含三个配置项：

- `app`: `dva` 实例，加载 `models` 时需要
- `models`: 返回 `Promise` 数组的函数，`Promise `返回 dva model`
- `component`：返回 `Promise `的函数，`Promise `返回 `React Component`

`dynamic` 比 React 自带的懒加载多做了一件事，它能把 model 一起按需加载进来。注意上面 `IndexPage` 只传了 `component` 没传 `models`，`Users` 两个都传了，这就是「进这个页面时才注册这个页面的 model」。页面多的中后台系统，这一下能砍掉不少首屏体积。

放到今天，React 18 已经内置了 `lazy` 加 `Suspense`，路由级分包也是各框架的标配能力，`dva/dynamic` 这套自研方案的存在感就不强了。原理是一样的，都是 webpack 的动态 `import()` 拆 chunk。

#### 2.2.6 app.start


> 启动应用，即将我们的应用跑起来

前面四步都只是往实例上登记信息，直到 `app.start('#root')` 才真正把 redux store 建起来、把 saga middleware 跑起来、再把 React 应用挂到那个 DOM 节点上。所以顺序不能乱，先 model 再 router 最后 start。

### 2.3 Dva九个概念

API 只有 5 个，但要把 dva 写明白，得先分清它的 9 个概念：State、Action、dispatch、Reducer、Effect、Subscription、Model、Router、RouteComponent。前六个是数据流本身，后三个是它们的组织方式。

这一节是全篇最该慢下来读的地方，后面所有实践代码都是这几个概念的排列组合。

#### 2.3.1 State

> 初始值，我们在 `dva()` 初始化的时候和在 modal 里面的 `state` 对其两处进行定义，其中 modal 中的优先级低于传给  `dva()` 的  `opts.initialState`

```javascript
// dva()初始化
const app = dva({
  initialState: { count: 1 },
});

// modal()定义事件
app.model({
  namespace: 'count',
  state: 0,
});
```

state 在 dva 里跟在 Redux 里是一回事，整个应用一棵状态树，每个 model 的 namespace 占树上的一个属性。上面这个例子最终的全局 state 形状是 `{ count: 1 }`，因为 `initialState` 覆盖了 model 里写的 `0`。

#### 2.3.2 Action

> 表示操作事件，可以是同步，也可以是异步

- `action` 的格式如下，它需要有一个 `type `，表示这个 `action` 要触发什么操作；`payload` 则表示这个 `action` 将要传递的数据

```javascript
{
  type: String,
  payload: data,
}
```

> 我们通过 dispatch 方法来发送一个 action

```
dispatch({ type: 'todos/add', payload: 'Learn Dva' });
```

注意 `type` 里那个斜杠，`todos/add` 表示「发给 todos 这个 model 的 add」。在 model 内部用 `put` 发 action 时可以省掉 namespace 直接写 `add`，跨 model 调用就必须写全。这是 dva 相比裸 Redux 省掉 actionTypes 常量文件的关键，命名空间已经帮你隔离好了，不同 model 里的同名 action 不会撞车。

> 其实我们可以构建一个Action 创建函数，如下

```javascript
function addTodo(text) {
  return {
    type: ADD_TODO,
    text
  }
}

//我们直接dispatch(addTodo()),就发送了一个action。
dispatch(addTodo())
```

#### 2.3.3 Model

> `model` 是 `dva` 中最重要的概念，`Model` 非 `MVC` 中的 `M`，而是领域模型，用于把数据相关的逻辑聚合到一起，几乎所有的数据，逻辑都在这边进行处理分发

领域模型这个说法值得琢磨一下。它划分的依据不是「数据表」也不是「页面」，而是一块业务实体，比如「待办事项」「用户」「订单」。一块业务实体的初始数据、同步修改、异步请求、外部订阅，全都写在同一个文件里，看代码的时候不用满项目找。

下面这个 todo 的 model 是完整形态，五个字段都齐了，可以先整体扫一遍再看拆解。

```javascript
import queryString from 'query-string'
import * as todoService from '../services/todo'

export default {
  namespace: 'todo',
  state: {
    list: []
  },
  reducers: {
    save(state, { payload: { list } }) {
      return { ...state, list }
    }
  },
  effects: {
    *addTodo({ payload: value }, { call, put, select }) {
      // 模拟网络请求
      const data = yield call(todoService.query, value)
      console.log(data)
      let tempList = yield select(state => state.todo.list)
      let list = []
      list = list.concat(tempList)
      const tempObj = {}
      tempObj.title = value
      tempObj.id = list.length
      tempObj.finished = false
      list.push(tempObj)
      yield put({ type: 'save', payload: { list }})
    },
    *toggle({ payload: index }, { call, put, select }) {
      // 模拟网络请求
      const data = yield call(todoService.query, index)
      let tempList = yield select(state => state.todo.list)
      let list = []
      list = list.concat(tempList)
      let obj = list[index]
      obj.finished = !obj.finished
      yield put({ type: 'save', payload: { list } })
    },
    *delete({ payload: index }, { call, put, select }) {
      const data = yield call(todoService.query, index)
      let tempList = yield select(state => state.todo.list)
      let list = []
      list = list.concat(tempList)
      list.splice(index, 1)
      yield put({ type: 'save', payload: { list } })
    },
    *modify({ payload: { value, index } }, { call, put, select }) {
      const data = yield call(todoService.query, value)
      let tempList = yield select(state => state.todo.list)
      let list = []
      list = list.concat(tempList)
      let obj = list[index]
      obj.title = value
      yield put({ type: 'save', payload: { list } })
    }
  },
  subscriptions: {
    setup({ dispatch, history }) {
      // 监听路由的变化，请求页面数据
      return history.listen(({ pathname, search }) => {
        const query = queryString.parse(search)
        let list = []
        if (pathname === 'todoList') {
          dispatch({ type: 'save', payload: {list} })
        }
      })
    }
  }
}
```

> `model`对象中包含5个重要的属性


**state**

> 这里的 state 跟我们刚刚讲的 state 的概念是一样的，只不过她的优先级比初始化的低，但是基本上项目中的 state 都是在这里定义的

**namespace**

> `model` 的命名空间，同时也是他在全局 `state` 上的属性，只能用字符串，我们发送在发送 `action` 到相应的 `reducer` 时，就会需要用到 `namespace `

namespace 是字符串，不能带斜杠，因为斜杠是 dva 用来分隔 namespace 和 action 名的。

**Reducer**

> 以`key/value` 格式定义 `reducer`，用于处理同步操作，唯一可以修改  `state` 的地方。由  `action` 触发。其实一个纯函数

「唯一可以修改 state 的地方」这句是整套数据流的地基。reducer 必须是纯函数，进去一个旧 state 出来一个新 state，中间不发请求、不读 `Date.now()`、不改传进来的参数。这也是为什么写法固定是 `return { ...state, list }` 而不是 `state.list = list`，直接改会破坏引用比较，连接的组件可能根本不重渲染。

```javascript
namespace: 'todo',
  state: {
    list: []
  },
  // reducers 写法
  reducers: {
    save(state, { payload: { list } }) {
      return { ...state, list }
    }
 }
```



**Effect**

> 用于处理异步操作和业务逻辑，不直接修改 `state`，简单的来说，就是获取从服务端获取数据，并且发起一个 `action `交给` reducer` 的地方

effect 和 reducer 的边界就一句话，**凡是有副作用的（发请求、读路由参数、setTimeout）都归 effect，凡是纯粹的数据变形都归 reducer**。新人最常犯的错是在 reducer 里发请求，那样时间旅行调试直接废掉，state 也变得不可预测。

effect 的函数前面那个星号不是装饰，它是 generator 函数，`yield` 会把控制权交回给 redux-saga，等这一步跑完再继续。好处是异步代码读起来是从上到下的顺序，没有回调嵌套。

其中它用到了`redux-saga`，里面有几个常用的函数。

```javascript
// effects 写法
effects: {
    *addTodo({ payload: value }, { call, put, select }) {
      // 模拟网络请求
      const data = yield call(todoService.query, value)
      console.log(data)
      let tempList = yield select(state => state.todo.list)
      let list = []
      list = list.concat(tempList)
      const tempObj = {}
      tempObj.title = value
      tempObj.id = list.length
      tempObj.finished = false
      list.push(tempObj)
      yield put({ type: 'save', payload: { list }})
    },
    *toggle({ payload: index }, { call, put, select }) {
      // 模拟网络请求
      const data = yield call(todoService.query, index)
      let tempList = yield select(state => state.todo.list)
      let list = []
      list = list.concat(tempList)
      let obj = list[index]
      obj.finished = !obj.finished
      yield put({ type: 'save', payload: { list } })
    },
    *delete({ payload: index }, { call, put, select }) {
      const data = yield call(todoService.query, index)
      let tempList = yield select(state => state.todo.list)
      let list = []
      list = list.concat(tempList)
      list.splice(index, 1)
      yield put({ type: 'save', payload: { list } })
    },
    *modify({ payload: { value, index } }, { call, put, select }) {
      const data = yield call(todoService.query, value)
      let tempList = yield select(state => state.todo.list)
      let list = []
      list = list.concat(tempList)
      let obj = list[index]
      obj.title = value
      yield put({ type: 'save', payload: { list } })
    }
}
```

![redux-saga 提供的 effect 辅助函数一览，包括 call、put、select、take、fork、all 等](https://upload-images.jianshu.io/upload_images/1505342-9ecb8ba2d8fd3ec2.png)

上图是 redux-saga 提供的全部辅助函数，看着吓人，实际项目里你用到的不会超过四个。

> 在项目中最主要的会用到的是 `put` 与 `call`

具体说，`call(fn, ...args)` 调用一个返回 Promise 的函数并等它完成，`put(action)` 相当于在 effect 内部发一个新 action，`select(fn)` 从全局 state 里取值。上面 todo 的 `*addTodo` 三个都用上了，先 `call` 请求接口，再 `select` 把现有列表取出来，加完新项之后 `put` 给 reducer 存回去。

多说一句 `select`，它取的是当前时刻的全局 state，`yield` 之后 state 可能已经被别的 action 改过了，所以拿到的数据要当快照看，别缓存着重复用。这个我踩过，表现是并发操作下列表偶尔少一条。

**Subscription**

> - 以 `key/value` 格式定义 `subscription`，`subscription` 是订阅，用于订阅一个数据源，然后根据需要 dispatch 相应的 action
> - `subscription` 是订阅，用于订阅一个数据源，然后根据需要 `dispatch` 相应的` action`。在 `app.start()` 时被执行，数据源可以是当前的时间、当前页面的`url`、服务器的 `websocket` 连接、`history `路由变化等等。

subscriptions 是 dva 里最有意思的一块，Redux 和 MobX 都没有对应的概念。前面的 action 都是组件主动 dispatch 出来的，subscription 反过来，它让 model 自己去盯着外部世界，条件满足就自己发 action。

最典型的用法就是下面这段，盯着路由变化，一进 `/todoList` 就自动拉数据。这样页面组件里连 `componentDidMount` 都不用写，取数逻辑完全收在 model 里，组件退化成纯展示。

- **注意**：如果要使用 `app.unmodel()`，`subscription` 必须返回 `unlisten` 方法，用于取消数据订阅

```javascript
// subscriptions 写法
subscriptions: {
    setup({ dispatch, history }) {
      // 监听路由的变化，请求页面数据
      return history.listen(({ pathname, search }) => {
        const query = queryString.parse(search)
        let list = []
        if (pathname === 'todoList') {
          dispatch({ type: 'save', payload: {list} })
        }
      })
    }
  }
```

这里有个坑要注意，`history.listen` 只在路由发生变化时触发，首次进入页面是不会走这个回调的（取决于 history 版本和 dva 版本的行为差异）。如果你发现直接输 URL 打开页面数据是空的，刷新一下又有了，八成就是卡在这儿，解决办法是在 setup 里先手动 dispatch 一次初始请求。

#### 2.3.4 Router

> `Router` 表示路由配置信息，项目中的 `router.js`

```javascript
export default function({ history }){
  return(
    <Router history={history}>
      <Route path="/" component={App} />
    </Router>
  );
}

```

**RouteComponent**

> `RouteComponent` 表示` Router` 里匹配路径的 `Component`，通常会绑定` model `的数据。如下:

```javascript
import { connect } from 'dva';

function App() {
  return <div>App</div>;
}

function mapStateToProps(state) {
  return { todos: state.todos };
}

export default connect(mapStateToProps)(App);

```

`connect` 来自 react-redux，dva 只是转手导出。它做的事是订阅 store，把 `mapStateToProps` 挑出来的那部分数据当 props 传给组件，同时自动注入一个 `dispatch`。所以你在任何被 connect 包过的组件里都能直接 `this.props.dispatch(...)`。

### 2.4 整体架构

把上面九个概念连起来，就是下面这张数据流图。

 ![dva 整体架构图：Route Component 通过 dispatch 发出 action，经 effect 请求服务端后交给 reducer 修改 state，再由 connect 驱动组件重新渲染](https://s.poetries.top/gitee/20191001/45.png)


- 首先我们根据 `url` 访问相关的 `Route-Component`，在组件中我们通过 `dispatch `发送 `action` 到 `model` 里面的 `effect` 或者直接 `Reducer`
- 当我们将`action`发送给`Effect`，基本上是取服务器上面请求数据的，服务器返回数据之后，`effect` 会发送相应的 `action `给 `reducer`，由唯一能改变 `state `的 `reducer` 改变 `state` ，然后通过`connect`重新渲染组件。
- 当我们将`action`发送给`reducer`，那直接由 `reducer` 改变 `state`，然后通过` connect `重新渲染组件

记住这两条分岔就够了。要不要走 effect，判断标准只有一个，这次操作需不需要跟外部世界打交道。

### 2.5 Dva图解

上面那张架构图是结果，这一节讲的是它怎么一步步演化出来的，理解了演化过程，你就知道每一层为什么存在。

**图解一：加入Saga**

> `React` 只负责页面渲染, 而不负责页面逻辑, 页面逻辑可以从中单独抽取出来, 变成 `store`

 ![React 组件只负责渲染，页面逻辑抽离到 store，异步操作由 saga 中间件拦截处理的分层示意图](https://s.poetries.top/gitee/20191001/46.png)


> 使用 `Middleware` 拦截 `action`, 这样一来异步的网络操作也就很方便了, 做成一个 `Middleware`就行了, 这里使用` redux-saga` 这个类库

- 点击创建 `Todo `的按钮, 发起一个 `type == addTodo` 的 `action`
- `saga` 拦截这个 `action`, 发起 `http` 请求, 如果请求成功, 则继续向 `reducer` 发一个 `type == addTodoSucc` 的 `action`, 提示创建成功, 反之则发送 `type == addTodoFail` 的`action` 即可

这就是 saga 的心智模型，它站在 action 到 reducer 的路上做拦截，把「一次用户操作」拆成「发起、成功、失败」三个 action。到这一步为止都还是标准 Redux 生态的玩法，问题是文件散得厉害，一个功能的 action 常量、创建函数、reducer、saga 分在四个目录里。

**图解二：Dva表示法**

 ![dva 表示法：把 store 和 saga 合并成一个 model 文件，并新增 subscriptions 收集外部来源的 action](https://s.poetries.top/gitee/20191001/47.png)

对着这张图看下面三条，dva 的全部创新就在这儿了。

> dva做了 3 件很重要的事情

- 把 `store `及 `saga` 统一为一个 `model` 的概念, 写在一个 js 文件里面
- 增加了一个 `Subscriptions`, 用于收集其他来源的 `action`, eg: 键盘操作
- `model` 写法很简约, 类似于 `DSL` 或者 `RoR`

回到我们要解决的问题。dva 没有发明任何新的数据流思想，它只是把 Redux 那套分散的文件按业务实体重新打了个包。理解了这一层，你在 dva 里踩的坑基本都能去 Redux 和 redux-saga 的文档里找到答案。

## 三、计数器例子

概念讲完，动手写一个最小可跑的例子。这个计数器会依次用上 state、reducer、effect 和 subscription，跟着敲一遍比看十遍文档管用。

```
$ dva new myapp
```

**目录结构介绍**

```
.
├── mock    // mock数据文件夹
├── node_modules // 第三方的依赖
├── public  // 存放公共public文件的文件夹
├── src  // 最重要的文件夹，编写代码都在这个文件夹下
│   ├── assets // 可以放图片等公共资源
│   ├── components // 就是react中的木偶组件
│   ├── models // dva最重要的文件夹，所有的数据交互及逻辑都写在这里
│   ├── routes // 就是react中的智能组件，不要被文件夹名字误导。
│   ├── services // 放请求借口方法的文件夹
│   ├── utils // 自己的工具方法可以放在这边
│   ├── index.css // 入口文件样式
│   ├── index.ejs // ejs模板引擎
│   ├── index.js // 入口文件
│   └── router.js // 项目的路由文件
├── .eslintrc // bower安装目录的配置
├── .editorconfig // 保证代码在不同编辑器可视化的工具
├── .gitignore // git上传时忽略的文件
├── .roadhogrc.js // 项目的配置文件，配置接口转发，css_module等都在这边。
├── .roadhogrc.mock.js // 项目的配置文件
└── package.json // 当前整一个项目的依赖
```

**首先是前端的页面，我们使用 class 形式来创建组件，原例子中是使用无状态来创建的。react 创建组件的各种方式，大家可以看[React创建组件的三种方式及其区别](http://www.cnblogs.com/wonyun/p/5930333.html)**

> 我们先修改`route/IndexPage.js`

```javascript
import React from 'react';
import { connect } from 'dva';
import styles from './IndexPage.css';

class IndexPage extends React.Component {
  render() {
    const { dispatch } = this.props;

    return (
      <div className={styles.normal}>
        <div className={styles.record}>Highest Record: 1</div>
        <div className={styles.current}>2</div>
        <div className={styles.button}>
          <button onClick={() => {}}>+</button>
        </div>
      </div>
    );
  }
}

export default connect()(IndexPage);
```

> 同时修改样式`routes/IndexPage.css`

```css
.normal {
  width: 200px;
  margin: 100px auto;
  padding: 20px;
  border: 1px solid #ccc;
  box-shadow: 0 0 20px #ccc;
}
.record {
  border-bottom: 1px solid #ccc;
  padding-bottom: 8px;
  color: #ccc;
}
.current {
  text-align: center;
  font-size: 40px;
  padding: 40px 0;
}
.button {
  text-align: center;
  button {
    width: 100px;
    height: 40px;
    background: #aaa;
    color: #fff;
  }
}
```

> 在 `model` 处理` state `，在页面里面输出 `model` 中的 `state`

- 首先我们在index.js中将`models/example.js`，即将model下一行的的注释打开

```javascript
import dva from 'dva';
import './index.css';

// 1. Initialize
const app = dva();

// 2. Plugins
// app.use({});

// 3. Model
app.model(require('./models/example')); // 打开注释

// 4. Router
app.router(require('./router'));

// 5. Start
app.start('#root');
```

> 接下来我们进入 `models/example.js`，将`namespace` 名字改为 `count`，`state `对象加上 `record` 与 `current` 属性。如下

```javascript
export default {
  namespace: 'count',
  state: {
    record: 0,
    current: 0,
  },
  ...
};
```

> 接着我们来到 `routes/indexpage.js` 页面，通过的 `mapStateToProps `引入相关的 `state`

```javascript
import React from 'react';
import { connect } from 'dva';
import styles from './IndexPage.css';

class IndexPage extends React.Component {
  render() {
    const { dispatch, count } = this.props;

    return (
      <div className={styles.normal}>
        <div className={styles.record}>
         {/* 将count的record输出 */}
         Highest Record: {count.record}
        </div>
        <div className={styles.current}>
         {count.current}
        </div>
        <div className={styles.button}>
          <button onClick={() => {} } >
                 +
          </button>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return { count: state.count };
} // 获取state

export default connect(mapStateToProps)(IndexPage);
```

跑起来页面上是两个 0，数据已经从 model 流到组件里了。接下来把交互接上。

> 通过 `+` 发送 `action`，通过 `reducer` 改变相应的 `state`

- 首先我们在 `models/example.js`，写相应的 `reducer`

```javascript
export default {
  ...
  reducers: {
    add1(state) {
      const newCurrent = state.current + 1;
      return { ...state,
        record: newCurrent > state.record ? newCurrent : state.record,
        current: newCurrent,
      };
    },
    minus(state) {
      return { ...state, current: state.current - 1 };
    },
  },
};
```

`add1` 这个 reducer 顺手做了一件事，它在加 1 的同时比较并更新了历史最高值 `record`。这种「一次修改牵动多个字段」的逻辑放 reducer 里刚刚好，它是纯计算，没有任何副作用。

> 在页面的模板 `routes/IndexPage.js` 中 `+` 号点击的时候，`dispatch `一个 `action`

```javascript
import React from 'react';
import { connect } from 'dva';
import styles from './IndexPage.css';

class IndexPage extends React.Component {
  render() {
    const { dispatch, count } = this.props;
    return (
      <div className={styles.normal}>
        <div className={styles.record}>Highest Record: {count.record}</div>
        <div className={styles.current}>{count.current}</div>
        <div className={styles.button}>
          <button
+            onClick={() => { dispatch({ type: 'count/add1' }); }}
          >+</button>
        </div>
      </div>
    );
  }
}
function mapStateToProps(state) {
  return { count: state.count };
}

export default connect(mapStateToProps)(IndexPage);
```

> 接下来我们来使用 `effect` 模拟一个数据接口请求，返回之后，通过 `yield put()` 改变相应的 `state`

- 首先我们替换相应的 `models/example.js` 的 `effect`

```javascript
effects: {
    *add(action, { call, put }) {
      yield call(delay, 1000);
      yield put({ type: 'minus' });
    },
},
```

这段要看清楚它到底干了什么：先 `call` 一个延时 1 秒的函数模拟网络请求，等回来之后 `put` 一个 `minus` 给 reducer。所以你 dispatch `count/add` 看到的现象是「一秒后数字减一」，它演示的是 effect 到 reducer 的接力，不是加法。effect 名字叫 add 只是沿用了官方示例，别被名字带跑。

> 这里的 `delay`，是我这边写的一个延时的函数，我们在 `utils` 里面编写一个 `utils.js` ，一般请求接口的函数都会写在 `servers` 文件夹中

```javascript
export function delay(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}
```

> 订阅订阅键盘事件，使用 `subscriptions`，当用户按住 `command+up` 时候触发添加数字的 `action`

- 在 `models/example.js` 中作如下修改

```javascript
+import key from 'keymaster';
...
app.model({
  namespace: 'count',
+ subscriptions: {
+   keyboardWatcher({ dispatch }) {
+     key('⌘+up, ctrl+up', () => { dispatch({type:'add1'}) });
+   },
+ },
});

```

- 在这里你需要安装 `keymaster` 这个依赖

```
npm install keymaster --save
```

- 现在你可以按住 `command+up` 就可以使 `current` 加1

这里原文的示例 dispatch 的是 `add`，也就是上面那个延时 1 秒再减 1 的 effect，跟「使 current 加 1」的描述对不上，我把它改成了直接派发 `add1` 这个 reducer。你要是想验证 effect，把它换回 `add` 再看现象就行。

顺着上面聊，这就是 subscription 的价值。键盘事件跟 React 组件树没有任何关系，但它照样能变成一个 action 进到同一条数据流里。websocket 推送、页面可见性变化、定时轮询，都可以用这个口子接进来，而不用在某个组件的 `componentDidMount` 里挂一堆全局监听。

## 四、Dva实践

计数器毕竟是玩具。这一节按真实中后台需求走一遍，一个用户管理页，从抽 model、拆组件、加 reducer 到接 effect 和 service，顺序跟实际开发一致。

### 4.1 抽离Model

> 抽离`Model`，根据设计页面需求，设计相应的`Model`

抽 model 有两种切法，代码注释里写得很清楚，一种从数据维度切，model 里只放服务端返回的数据；另一种从业务状态切，把弹窗开没开、当前操作的是哪条记录这类 UI 状态也一起放进来。

我倾向第二种。中后台页面的「编辑弹窗」这种状态几乎一定会被 effect 用到，比如提交成功之后要关弹窗、刷列表，如果 `modalVisible` 存在组件的 `this.state` 里，effect 就够不着它，你得绕一圈用回调传出去。下面代码里带 `+` 的几行就是从第一种改到第二种时加的。

```javascript
// models/users.js
// version1: 从数据维度抽取，更适用于无状态的数据
// version2: 从业务状态抽取，将数据与组件的业务状态统一抽离成一个model
// 新增部分为在数据维度基础上，改为从业务状态抽取而添加的代码
export default {
  namespace: 'users',
  state: {
    list: [],
    total: null,
+   loading: false, // 控制加载状态
+   current: null, // 当前分页信息
+   currentItem: {}, // 当前操作的用户对象
+   modalVisible: false, // 弹出窗的显示状态
+   modalType: 'create', // 弹出窗的类型（添加用户，编辑用户）
  },

    // 异步操作
    effects: {
        *query(){},
        *create(){},
        *'delete'(){},   // 因为delete是关键字，特殊处理
        *update(){},
    },

    // 替换状态树
    reducers: {
+       showLoading(){}, // 控制加载状态的 reducer
+       showModel(){}, // 控制 Model 显示状态的 reducer
+       hideModel(){},
        querySuccess(){},
        createSuccess(){},
        deleteSuccess(){},
        updateSuccess(){},
    }
}
```

### 4.2 设计组件

> 先设置容器组件的访问路径，再创建组件文件

组件分成容器组件和展示组件两类，这个划分不是 dva 发明的，是 Redux 社区早年的共识。一句话区分，容器组件知道数据从哪来，展示组件只认 props。

这么分的好处在于展示组件可以脱离整个数据流单独测试和复用，你把 UserList 搬到另一个项目里，它不需要知道 dva 的存在。

#### 4.2.1 容器组件

> 具有监听数据行为的组件，职责是绑定相关联的 model 数据，包含子组件；传入的数据来源于model

```javascript
import React, { Component } from 'react';
import PropTypes from 'prop-types';

// dva 的 connect 方法可以将组件和数据关联在一起
import { connect } from 'dva';

// 组件本身
const MyComponent = (props)=>{};

// propTypes属性，用于限制props的传入数据类型
MyComponent.propTypes = {};

// 声明模型传递函数，用于建立组件和数据的映射关系
// 实际表示 将ModelA这一个数据模型，绑定到当前的组件中，则在当前组件中，随时可以取到ModelA的最新值
// 可以绑定多个Model
function mapStateToProps({ModelA}) {
  return {ModelA};
}

// 关联 model
// 正式调用模型传递函数，完成模型绑定
export default connect(mapStateToProps)(MyComponent);
```

这里有个原文的写法我改掉了。原代码是 `import React, { Component, PropTypes } from 'react'`，这在 React 15.5 之后会拿到 undefined，React 16 里 `PropTypes` 已经从 react 包里移出去了，正确写法是单独装 `prop-types` 再 `import PropTypes from 'prop-types'`。这篇文章写于 2018 年，当时这个迁移刚发生不久，很多教程还是老写法。全文的几处我都统一改了。

再往后看，TypeScript 普及之后 `propTypes` 这套运行时校验用得越来越少，类型检查挪到了编译期。老项目里两者共存也没问题，只是别指望 `propTypes` 能在生产环境帮你兜底，它默认只在开发环境告警。

#### 4.2.2 展示组件

> 展示通过 `props` 传递到组件内部数据；传入的数据来源于容器组件向展示组件的`props`

```javascript
import React, { Component } from 'react';
import PropTypes from 'prop-types';

// 组件本身
// 所需要的数据通过 Container Component 通过 props 传递下来
const MyComponent = (props)=>{}
MyComponent.propTypes = {};

// 并不会监听数据
export default MyComponent;
```

区别就在最后一行，展示组件没有 `connect`。它拿不到 dispatch，也订阅不了 store，改数据只能通过父组件传下来的回调。这个限制是故意的。

#### 4.2.3 设置路由

先把路由挂上，页面能访问了再往里填内容，这样每一步改动都能立刻在浏览器里看到效果。

```javascript
// .src/router.js
import React from 'react';
import PropTypes from 'prop-types';
import { Router, Route } from 'dva/router';
import Users from './routes/Users';

export default function({ history }) {
  return (
    <Router history={history}>
      <Route path="/users" component={Users} />
    </Router>
  );
};
```

**容器组件雏形**

```javascript
// .src/routes/Users.jsx
import React from 'react';
import PropTypes from 'prop-types';

function Users() {
  return (
    <div>User Router Component</div>
  );
}

export default Users;
```

#### 4.2.4 设计容器组件

> 自顶向下的设计方法：先设计容器组件，再逐步细化内部的展示容器

自顶向下的意思是先把页面切成几块、想清楚每块要什么数据，再去实现每一块。反过来先写完一堆小组件再拼，很容易发现数据结构对不上，返工成本高。

组件的定义方式

```javascript
// 方法一： es6 的写法，当组件设计react生命周期时，可采用这种写法
// 具有生命周期的组件，可以在接收到传入数据变化时，自定义执行方法，有自己的行为模式
// 比如在组件生成后调用xx请求(componentDidMount)、可以自己决定要不要更新渲染(shouldComponentUpdate)等
class App extends React.Component({});

// 方法二： stateless 的写法，定义无状态组件
// 无状态组件，仅仅根据传入的数据更新，修改自己的渲染内容
const App = (props) => ({});
```

这两种写法的取舍在 2018 年是「要不要生命周期」，React 16.8 之后 Hooks 出来，函数组件也能有状态和副作用了，这个二选一就基本没了，新代码统一写函数组件加 Hooks 就行。原文的类组件写法我保留着，中后台老项目里它还是主流。

容器组件：

```javascript
// ./src/routes/Users.jsx
import React, { Component } from 'react';
import PropTypes from 'prop-types';

// 引入展示组件 （暂时都没实现）
import UserList from '../components/Users/UserList';
import UserSearch from '../components/Users/UserSearch';
import UserModal from '../components/Users/UserModal';

// 引入css样式表
import styles from './style.less'

function Users() {

  // 向userListProps中传入静态数据
  const userSearchProps = {};
  const userListProps = {
    total: 3,
    current: 1,
    loading: false,
    dataSource: [
      {
        name: '张三',
        age: 23,
        address: '成都',
      },
      {
        name: '李四',
        age: 24,
        address: '杭州',
      },
      {
        name: '王五',
        age: 25,
        address: '上海',
      },
    ],
  };
  const userModalProps = {};

  return (
    <div className={styles.normal}>
      {/* 用户筛选搜索框 */}
      <UserSearch {...userSearchProps} />
      {/* 用户信息展示列表 */}
      <UserList {...userListProps} />
      {/* 添加用户 & 修改用户弹出的浮层 */}
      <UserModal {...userModalProps} />
    </div>
  );
}

// 很关键的对外输出export；使外部可通过import引用使用此组件
export default Users;
```

先用写死的假数据把页面结构搭出来，这一步不接 model，纯看布局对不对。等结构定了再把数据源换成 model，改动量很小。

展示组件UserList

```javascript
// ./src/components/Users/UserList.jsx
import React, { Component } from 'react';
import PropTypes from 'prop-types';

// 采用antd的UI组件
import { Table, message, Popconfirm } from 'antd';

// 采用 stateless 的写法
const UserList = ({
    total,
    current,
    loading,
    dataSource,
}) => {
  const columns = [{
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    render: (text) => <a href="#">{text}</a>,
  }, {
    title: '年龄',
    dataIndex: 'age',
    key: 'age',
  }, {
    title: '住址',
    dataIndex: 'address',
    key: 'address',
  }, {
    title: '操作',
    key: 'operation',
    render: (text, record) => (
      <p>
        <a onClick={()=>{}}>编辑</a>

        <Popconfirm title="确定要删除吗？" onConfirm={()=>{}}>
          <a>删除</a>
        </Popconfirm>
      </p>
    ),
  }];

  // 定义分页对象
  const pagination = {
    total,
    current,
    pageSize: 10,
    onChange: ()=>{},
  };


  // 此处的Table标签使用了antd组件，传入的参数格式是由antd组件库本身决定的
  // 此外还需要在index.js中引入antd  import 'antd/dist/antd.css'
  return (
    <div>
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        rowKey={record => record.id}
        pagination={pagination}
      />
    </div>
  );
}

export default UserList;
```

`UserList` 这段值得留意的是 `columns` 的写法，antd 的 Table 把列定义抽成了配置数组，`render` 函数负责把一个字段渲染成任意 JSX。这套配置化的表格 API 一直沿用到现在的 antd v5，后来的 ProTable 也是在它上面加了一层封装。

### 4.3 添加Reducer

> 在整个应用中，只有`model`中的`reducer`函数可以直接修改自己所在`model`的`state`参数，其余都是非法操作；
并且必须使用`return {...state}`的形式进行修改

页面骨架有了，接下来把写死的数据挪进 model。这一步会分四小步走，实现 reducer、把组件接到 model、找个时机发 action、最后注册 model。

#### 4.3.1 第一步：实现reducer函数

```javascript
// models/users.js
// 使用静态数据返回，把userList中的静态数据移到此处
// querySuccess这个action的作用在于，修改了model的数据
export default {
  namespace: 'users',
  state: {},
  subscriptions: {},
  effects: {},
  reducers: {
    querySuccess(state){
        const mock = {
          total: 3,
          current: 1,
          loading: false,
          list: [
            {
              id: 1,
              name: '张三',
              age: 23,
              address: '成都',
            },
            {
              id: 2,
              name: '李四',
              age: 24,
              address: '杭州',
            },
            {
              id: 3,
              name: '王五',
              age: 25,
              address: '上海',
            },
          ]
        };
        // return 的内容是一个对象，涵盖原state中的所有属性，以实现「更新替换」的效果
        return {...state, ...mock, loading: false};
      }
  }
}
```

注意 `querySuccess` 这个命名，它是「查询成功」而不是「查询」，因为 reducer 只负责把已经拿到的数据写进 state。真正的查询动作在 effect 里，这一步先用静态数据把链路跑通。

#### 4.3.2 第二步：关联Model中的数据源

```javascript
// routes/Users.jsx

import React from 'react';
import PropTypes from 'prop-types';

// 最后用到了connect函数，需要在头部预先引入connect
import { connect } from 'dva';

function Users({ location, dispatch, users }) {

  const {
    loading, list, total, current,
    currentItem, modalVisible, modalType
    } = users;

  const userSearchProps={};

  // 使用传入的数据源，进行数据渲染
  const userListProps={
    dataSource: list,
    total,
    loading,
    current,
  };
  const userModalProps={};

  return (
    <div className={styles.normal}>
      {/* 用户筛选搜索框 */}
      <UserSearch {...userSearchProps} />
      {/* 用户信息展示列表 */}
      <UserList {...userListProps} />
      {/* 添加用户 & 修改用户弹出的浮层 */}
      <UserModal {...userModalProps} />
    </div>
  );
}

// 声明组件的props类型
Users.propTypes = {
  users: PropTypes.object,
};

// 指定订阅数据，并且关联到users中
function mapStateToProps({ users }) {
  return {users};
}

// 建立数据关联关系
export default connect(mapStateToProps)(Users);
```

对比一下 4.2.4 那版容器组件，页面结构一行没动，只是把假数据换成了从 `users` 这个 model 解构出来的字段。这就是前面坚持容器和展示分开的回报。

#### 4.3.3 第三步：通过发起Action，在组件中获取Model中的数据

```javascript
// models/users.js
// 在组件生成后发出action，示例：
componentDidMount() {
  this.props.dispatch({
    type: 'model/action',     // type对应action的名字
  });
}

// 在本次实践中，在访问/users/路由时，就是我们获取用户数据的时机
// 因此把dispatch移至subscription中
// subcription，订阅(或是监听)一个数据源，然后根据条件dispatch对应的action
// 数据源可以是当前的时间、服务器的 websocket 连接、keyboard 输入、geolocation 变化、history 路由变化等等
// 此处订阅的数据源就是路由信息，当路由为/users，则派发'querySuccess'这个effects方法
subscriptions: {
    setup({ dispatch, history }) {
      history.listen(location => {
        if (location.pathname === '/users') {
          dispatch({
            type: 'querySuccess',
            payload: {}
          });
        }
      });
    },
  },
```

这段代码里其实给了两个方案，在组件的 `componentDidMount` 里 dispatch，或者在 model 的 subscription 里监听路由。它选了后者。

那为什么不用 `componentDidMount` 呢？因为取数时机跟着路由走，比跟着组件挂载走更准确。同一个组件可能被多个路由复用，也可能因为父组件重渲被意外重挂，而「访问 `/users` 就该有用户列表」这个描述是稳定的。取数逻辑放进 model 之后，页面组件里一行取数代码都没有，纯粹接收 props 渲染。

这是我认为 dva 相比同期方案最舒服的一个设计。

#### 4.3.4 第四步： 在index.js中添加models

```javascript
// model必须在此完成注册，才能全局有效
// index.js
app.model(require('./models/users.js'));
```

这一行忘了写，页面上会安静地什么都没有，控制台也不一定报错，因为 `state.users` 压根不存在，解构出来全是 undefined。这个我踩过，排查了半天最后发现是 model 没注册。后来 umi 出了自动注册 model 的约定，就是为了消掉这个低级失误，具体规则在 [使用 umi 改进 dva 项目开发](https://feinterview.poetries.top/blog/umi-dva) 那篇里。

### 4.4 添加Effects

> `Effects`的作用在于处理异步函数，控制数据流程。
因为在真实场景中，数据都来自服务器，需要在发起异步请求获得返回值后再设置数据，更新`state`。
因此我们往往在`Effects`中调用`reducer`

到这一步才把静态数据换成真实请求。看下面 `*query` 的结构，它是 effect 的标准形态，先 put 一个 loading，再 call 接口，拿到数据再 put 给 reducer，三段式。

```javascript
export default {
  namespace: 'users',
  state: {},
  subscriptions: {},
  effects: {
    // 添加effects函数
    // call与put是dva的函数
    // call调用执行一个函数
    // put则是dispatch执行一个action
    // select用于访问其他model
    *query({ payload }, { select, call, put }) {
        yield put({ type: 'showLoading' });
        const { data } = yield call(query);
        if (data) {
          yield put({
            type: 'querySuccess',
            payload: {
              list: data.data,
              total: data.page.total,
              current: data.page.current
            }
          });
        }
      },
    },
  reducers: {}
}



// 添加请求处理   包含了一个ajax请求
// models/users.js
import request from '../utils/request';
import qs from 'qs';
async function query(params) {
  return request(`/api/users?${qs.stringify(params)}`);
}
```

上面把 `query` 函数直接写在 model 文件里了，能跑，但接口一多这个文件就乱了，而且同一个接口在别的 model 里还要再写一遍。

### 4.5 把请求处理分离到service中

> 用意在于分离(可复用的)ajax请求

```javascript
// services/users.js
import request from '../utils/request';
import qs from 'qs';
export async function query(params) {
  return request(`/api/users?${qs.stringify(params)}`);
}

// 在models中引用
// models/users.js
import {query} from '../services/users';
```

分层到这儿就完整了。组件负责渲染和派发，model 负责编排流程，service 负责跟后端对接口，`utils/request` 负责统一处理鉴权、报错和数据格式。每一层职责单一，出问题的时候你能很快定位到该看哪个文件。

一个建议：service 文件按 model 的粒度一一对应命名，`services/users.js` 配 `models/users.js`，找起来不用想。

## 五、使用dva框架和直接使用redux写法的区别

光说结构没有体感，同一个需求两种写法摆在一起看最直观。需求很简单，点一下按钮，请求 1 秒后把计数加 1，期间显示 loading。

### 5.1 使用 redux

原生 Redux 的写法要开四个文件，先是 action 常量加创建函数，异步那部分靠 redux-thunk 返回一个函数来做。

```javascript
// action.js

export const REQUEST_TODO = 'REQUEST_TODO';
export const RESPONSE_TODO = 'RESPONSE_TODO';

const request = count => ({type: REQUEST_TODO, payload: {loading: true, count}});

const response = count => ({type: RESPONSE_TODO, payload: {loading: false, count}});

export const fetch = count => {
  return (dispatch) => {
    dispatch(request(count));

    return new Promise(resolve => {
      setTimeout(() => {
        resolve(count + 1);
      }, 1000)
    }).then(data => {
      dispatch(response(data))
    })
  }
}
```

reducer 这边要写一个 switch，两个 case 加一个 default，漏了 default 直接把 state 弄丢。

```javascript
//reducer.js
import { REQUEST_TODO, RESPONSE_TODO } from './actions';

export default (state = {
  loading: false,
  count: 0
}, action) => {
  switch (action.type) {
    case REQUEST_TODO:
      return {...state, ...action.payload};
    case RESPONSE_TODO:
      return {...state, ...action.payload};
    default:
      return state;
  }
}
```

```
// app.js
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as actions from './actions';

const App = ({fetch, count, loading}) => {
  return (
    <div>
      {loading ? <div>loading...</div> : <div>{count}</div>}
      <button onClick={() => fetch(count)}>add</button>
    </div>
  )
}

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
```

入口文件还得自己建 store、挂中间件、套 Provider。

```javascript
//index.js
import { render } from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux'
import thunkMiddleware from 'redux-thunk';

import reducer from './app/reducer';
import App from './app/app';

const store = createStore(reducer, applyMiddleware(thunkMiddleware));

render(
  <Provider store={store}>
    <App/>
  </Provider>
  ,
  document.getElementById('app')
)
```

### 5.2 使用dva

同样的需求换成 dva，action 常量没了，switch 没了，thunk 没了，只剩一个 model 文件。

```javascript

// model.js
export default {
  namespace: 'demo',
  state: {
    loading: false,
    count: 0
  },
  reducers: {
    request(state, payload) {
      return {...state, ...payload};
    },
    response(state, payload) {
      return {...state, ...payload};
    }
  },
  effects: {
    *'fetch'(action, {put, call}) {
      yield put({type: 'request', loading: true});

      let count = yield call((count) => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(count + 1);
          }, 1000);
        });
      }, action.count);

      yield put({
        type: 'response',
        loading: false,
        count
      });
    }
  }
}
```

```javascript
//app.js

import React from 'react'
import { connect } from 'dva';

const App = ({fetch, count, loading}) => {
  return (
    <div>
      {loading ? <div>loading...</div> : <div>{count}</div>}
      <button onClick={() => fetch(count)}>add</button>
    </div>
  )
}

function mapStateToProps(state) {
  return state.demo;
}

function mapDispatchToProps(dispatch) {
  return {
    fetch(count){
      dispatch({type: 'demo/fetch', count});
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
```

```javascript
// index.js
import dva from 'dva';
import model from './model';
import App from './app';

const app = dva();

app.use({});

app.model(model);

app.router(() => <App />);

app.start();
```

- 使用 `redux` 需要拆分出`action`模块和`reducer`模块
- `dva`将`action`和`reducer`封装到`model`中，异步流程采用`Generator`处理

组件那一侧几乎没变，`connect` 的用法一模一样，区别只是 `mapDispatchToProps` 里派发的 type 带上了 namespace。

我一直觉得这个对比是理解 dva 最快的路径。它省掉的不是能力，是重复劳动。代价也很实在，你多了一个 generator 语法要学，多了一层 redux-saga 的调试链路，出错的时候堆栈会比 thunk 深不少。

顺便说一句现在的情况。Redux 官方后来推出了 Redux Toolkit，`createSlice` 干的事跟 dva 的 model 非常像，同样是把 action 和 reducer 写在一起、同样自动生成 action type，异步用 `createAsyncThunk`。所以「Redux 样板代码多」这个 dva 当年要解决的痛点，Redux 自己已经解决了。几个主流方案的横向对比可以看 [React 状态管理方案对比](https://feinterview.poetries.top/blog/react-state-management-comparison)。

## 六、使用axios统一处理

这一节是全篇最能直接抄走的部分。中后台项目的请求层要处理的事情高度雷同，超时、前缀、进度条、HTTP 状态码提示、业务错误码提示、401 跳登录，一次写好就能复用到下一个项目。

### 6.1 示例代码

先看完整版，后面几小节再拆开讲每一块在干嘛。原文这段代码里 `.then((response) =>` 后面直接跟了语句却没有花括号，箭头函数体写漏了，我补上了 `{`，否则这段是跑不起来的。

```javascript
// request.js
import axios from 'axios';
import NProgress from 'nprogress';
import { notification, message } from 'antd';
import { routerRedux } from 'dva/router';
import store from '../index';

/**
 * 一、功能：
 * 1. 统一拦截http错误请求码；
 * 2. 统一拦截业务错误代码；
 * 3. 统一设置请求前缀
 * |-- 每个 http 加前缀 baseURL = /api/v1，从配置文件中获取 apiPrefix
 * 4. 配置异步请求过渡状态：显示蓝色加载条表示正在请求中，避免给用户页面假死的不好体验。
 * |-- 使用 NProgress 工具库。
 *
 * 二、引包：
 * |-- axios：http 请求工具库
 * |-- NProgress：异步请求过度条，在浏览器主体部分顶部显示蓝色小条
 * |-- notification：Antd组件 > 处理错误响应码提示信息
 * |-- routerRedux：dva/router对象，用于路由跳转，错误响应码跳转相应页面
 * |-- store：dva中对象，使用里面的 dispatch 对象，用于触发路由跳转
 */

// 设置全局参数，如响应超市时间，请求前缀等。
axios.defaults.timeout = 5000
axios.defaults.baseURL = '/api/v1';
axios.defaults.withCredentials = true;

// 状态码错误信息
const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

// 添加一个请求拦截器，用于设置请求过渡状态
axios.interceptors.request.use((config) => {
  // 请求开始，蓝色过渡滚动条开始出现
  NProgress.start();
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 添加一个返回拦截器
axios.interceptors.response.use((response) => {
  // 请求结束，蓝色过渡滚动条消失
  NProgress.done();
  return response;
}, (error) => {
  // 请求结束，蓝色过渡滚动条消失
  // 即使出现异常，也要调用关闭方法，否则一直处于加载状态很奇怪
  NProgress.done();
  return Promise.reject(error);
});

export default function request (opt) {
  // 调用 axios api，统一拦截
  return axios(opt)
    .then((response) => {
      // >>>>>>>>>>>>>> 请求成功 <<<<<<<<<<<<<<
      console.log(`【${opt.method} ${opt.url}】请求成功，响应数据：%o`, response);

      // 打印业务错误提示
      if (response.data && response.data.code != '0000') {
        message.error(response.data.message);
      }

      return { ...response.data };
    })
    .catch((error) => {
      // >>>>>>>>>>>>>> 请求失败 <<<<<<<<<<<<<<
      // 请求配置发生的错误
      if (!error.response) {
        return console.log('Error', error.message);
      }

      // 响应时状态码处理
      const status = error.response.status;
      const errortext = codeMessage[status] || error.response.statusText;

      notification.error({
        message: `请求错误 ${status}`,
        description: errortext,
      });

      // 存在请求，但是服务器的返回一个状态码，它们都在2xx之外
      const { dispatch } = store;

      if (status === 401) {
        dispatch(routerRedux.push('/user/login'));
      } else if (status === 403) {
        dispatch(routerRedux.push('/exception/403'));
      } else if (status <= 504 && status >= 500) {
        dispatch(routerRedux.push('/exception/500'));
      } else if (status >= 404 && status < 422) {
        dispatch(routerRedux.push('/exception/404'));
      }

      // 开发时使用，上线时删除
      console.log(`【${opt.method} ${opt.url}】请求失败，响应数据：%o`, error.response);

      return { code: status, message: errortext };
    });
}
```

### 6.2 明确响应体

要写好拦截器，第一件事是跟后端把响应体的形状定死。这一步没谈拢，后面所有判断都是猜的。

> 以微信小程序为例，请求响应数据分为两部分：

- 网络请求是否成功；
- 业务场景值。即便网络请求成功了，业务处理上可能有时也会出错，比如校验不通过

我们在拦截响应时要分别对这两部分进行处理

```javascript
response = {
  status: 200,                // 网络请求状态。
  statusText: 'xxx',
  data: {
    code: '1001',             // 业务请求状态。这里 '0000' 表示业务没问题，其它都有问题
    message: 'yyy',
    data: {  },
  }
}
```

外层的 `status` 是 HTTP 层的，内层的 `code` 是业务层的。这两层必须分开处理，一个 200 的响应里业务上完全可能是失败的，比如「验证码错误」，这时候不该走 catch，但要给用户提示。很多人只判断 HTTP 状态码，结果就是用户点了提交没反应，也不知道哪儿错了。

### 6.3 依赖包分析

```javascript
import axios from 'axios';
import NProgress from 'nprogress';
import { notification, message } from 'antd';
import { routerRedux } from 'dva/router';
import store from '../index';
```

> `import store from '../index';`这是 `dva` 中导出的对象。即下面代码最终导出的 `app._store`，引入它是因为 `dispatch` 对象在里面，我们需要 dispatch 对象进行路由跳转

```javascript
// index.js
import dva from 'dva';
import { message } from 'antd';
import { createBrowserHistory as createHistory } from 'history';

// 1. Initialize
const app = dva({
  history: createHistory(),
});

// 2. Plugins
app.use(createLoading());

// 3. Model
app.model(require('./models/app/global').default);

// 4. Router
app.router(require('./router').default);

// 5. Start
app.start('#root');

export default app._store;
```

这个 `export default app._store` 的技巧值得单独说一句。请求层是普通模块，不是 React 组件，它拿不到 props 里的 dispatch，但 401 的时候又需要跳登录页，所以只能把 store 从入口导出来给它用。

这属于绕过框架的做法，能用但不优雅，隐患是循环依赖，`index.js` 引 `router`，`router` 引页面，页面引 service，service 又引回 `index.js`。真踩到了（表现通常是某个模块在初始化时是 undefined），可以改成让请求层抛一个特定错误、由 `onError` 统一处理跳转。

### 6.4 axios 全局配置

```javascript
// 设置全局参数，如响应超市时间，请求前缀等。
axios.defaults.timeout = 5000
axios.defaults.baseURL = '/api/v1';
axios.defaults.withCredentials = true;
```

三行配置各管一件事，`timeout` 防止请求永远挂着，`baseURL` 把接口前缀收到一处（换环境只改这一行），`withCredentials` 允许跨域请求带上 cookie。最后这个要跟后端对齐，服务端的 `Access-Control-Allow-Origin` 不能是 `*`，必须是具体域名，否则浏览器会直接拒绝。

> axios 可以设置很多全局配置，具体可参阅 https://segmentfault.com/a/1190000008470355

### 6.5 加载 NProgress 过渡组件

页面顶部那条蓝色进度条，成本极低但体验提升很明显，用户至少知道系统在干活而不是卡死了。

```javascript
// 添加一个请求拦截器，用于设置请求过渡状态
axios.interceptors.request.use((config) => {
  // 请求开始，蓝色过渡滚动条开始出现
  NProgress.start();
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 添加一个返回拦截器
axios.interceptors.response.use((response) => {
  // 请求结束，蓝色过渡滚动条消失
  NProgress.done();
  return response;
}, (error) => {
  // 请求结束，蓝色过渡滚动条消失
  // 即使出现异常，也要调用关闭方法，否则一直处于加载状态很奇怪
  NProgress.done();
  return Promise.reject(error);
});

```

> `NProgress` 的使用主要有两个方法，当调用 `NProgress.start();` 时在浏览器顶部就会出现蓝色小条，当调用 `NProgress.done();` 蓝色小条就会消失。我们分别在请求开始和接收到响应调用这两个方法

![NProgress 蓝色进度条在浏览器顶部随请求开始出现、请求结束消失的动态效果](https://upload-images.jianshu.io/upload_images/6693922-948c3efcfeeaf4fd.gif)

效果就是这张图里的样子。这里有个细节别漏，响应拦截器的失败分支里也要调 `NProgress.done()`，请求出错了进度条不收，页面顶上就永远挂着一条走不完的蓝线。上面代码里两个分支都写了。

并发请求下 NProgress 的计数是共享的，同时发三个请求、第一个先回来就会把进度条收掉。要求精确的话得自己维护一个计数器，请求数归零才 done。这块我只在简单页面上验证过，复杂场景建议自己再包一层。


### 6.6 网络请求成功处理

```javascript
.then((response) => {
      // >>>>>>>>>>>>>> 请求成功 <<<<<<<<<<<<<<
      console.log(`【${opt.method} ${opt.url}】请求成功，响应数据：%o`, response);

      // 打印业务错误提示
      if (response.data && response.data.code != '0000') {
        message.error(response.data.message);
      }

      return { ...response.data };
    })

```

> 网络请求状态码为 `200-300` 表示成功，此时还应该判断业务处理是否成功。这个根据具体项目具体规定，比如微信小程序有一套场景值。在实际项目中可以自行规定 `code = '0000'` 业务处理完全没问题，`code = '1111' `校验不通过，`code = '2222'` 数据库出错等等。

- 最后别忘了要返回具体对象 `{ ...response.data }`

返回 `{ ...response.data }` 而不是整个 `response`，是为了让上层的 service 和 model 不用关心 axios 的响应包装，effect 里 `yield call(query)` 拿到的直接就是业务数据。少一层解包，model 代码干净很多。

另外原代码里的 `response.data.code != '0000'` 用的是宽松相等，`0` 和 `'0000'` 这类值比较时容易出意外，建议统一成严格相等 `!==` 并保证后端返回的一定是字符串。

### 6.7 网络请求失败处理

```javascript
// 状态码错误信息
const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

// ...........

.catch((error) => {
      // >>>>>>>>>>>>>> 请求失败 <<<<<<<<<<<<<<
      // 请求配置发生的错误
      if (!error.response) {
        return console.log('Error', error.message);
      }

      // 响应时状态码处理
      const status = error.response.status;
      const errortext = codeMessage[status] || error.response.statusText;

      notification.error({
        message: `请求错误 ${status}`,
        description: errortext,
      });

      // 存在请求，但是服务器的返回一个状态码，它们都在2xx之外
      const { dispatch } = store;

      if (status === 401) {
        dispatch(routerRedux.push('/user/login'));
      } else if (status === 403) {
        dispatch(routerRedux.push('/exception/403'));
      } else if (status <= 504 && status >= 500) {
        dispatch(routerRedux.push('/exception/500'));
      } else if (status >= 404 && status < 422) {
        dispatch(routerRedux.push('/exception/404'));
      }

      // 开发时使用，上线时删除
      console.log(`【${opt.method} ${opt.url}】请求失败，响应数据：%o`, error.response);

      return { code: status, message: errortext };
    });

```

- 网络请求失败，首先需要根据 `status` 打印提示消息，告诉用户为什么请求失败。如响应码为 `401`，那么提示用户的文字就会是 用户没有权限（令牌、用户名、密码错误）
- 如果是 `401` 错误，表示用户没有权限访问或者用户名密码输入错误，应该跳转到登录页面：`dispatch(routerRedux.push('/user/login'));`

那几个跳转分支的判断顺序值得看一眼，`status >= 404 && status < 422` 这种区间写法是把一批不常见的状态码都归到 404 页面去了，能用但不够精确，实际项目里建议只对确定要处理的码做跳转，其余的统一弹提示就够了。

还有一点，`error.response` 不存在时代表请求根本没发出去或者没收到响应，比如断网、跨域被拦、超时。这种情况没有状态码可查，只能提示网络异常，上面代码里那个 `if (!error.response)` 分支就是干这个的，别漏。

## 七、2026 年再看 dva

上面这些写法在当年的 dva 项目上是成立的，这一节说说现在的情况，免得你照着这篇去做新项目的技术选型。

先说结论，dva 现在的活跃度不高了。它的两个核心卖点，一是把 Redux 的样板代码收进 model，二是把 redux-saga 的异步编排包装得更好用，这两件事后来都被别人做了。

Redux 官方推出 Redux Toolkit 之后，`createSlice` 把 action 和 reducer 写在一起、自动生成 action type、内置 Immer 支持直接改草稿状态，样板代码问题已经不是问题了，而且它是 Redux 官方推荐的默认写法。想更轻的话有 Zustand，几十行 API，没有 Provider 也没有 connect。原理层面的对比我在 [React 状态管理方案对比](https://feinterview.poetries.top/blog/react-state-management-comparison) 里写过，另一条路线 MobX 的用法和现状在 [MobX 核心概念解析与 React 协同最佳实践](https://feinterview.poetries.top/blog/mobx-react-best-practices) 那篇。

更大的变化是「服务端数据」这块从全局状态里被拆出去了。dva 的 model 里那些 `list`、`total`、`loading`、`current`，本质是服务端数据在客户端的一份缓存副本，而缓存、失效、重试、去重这些事 TanStack Query 这类库做得比手写 effect 好太多。现在比较常见的分层是，服务端数据交给 TanStack Query，纯客户端的 UI 状态交给 Zustand 或者 React 自带的 state，全局 store 一下子瘦了很多。

再说 redux-saga。generator 这套写法学习成本不低，调试的时候堆栈很深，而 `async/await` 在语言层面已经普及了。saga 真正不可替代的是复杂流程编排（竞态取消、防抖节流、任务并发控制），中后台的增删改查用不上这些。

那 dva 是不是完全不能碰了？也不是。存量项目继续跑没有任何问题，它依赖的是 Redux 和 redux-saga 这两个仍在维护的库，本身很稳定。要做的是别在老项目上再加新 model 的时候纠结，按现有约定写完保持一致就行，一致性比先进性重要。

要是从零开始，我的判断是这样：中后台项目用 umi 的话，直接用它当前版本推荐的数据流方案；不用 umi 的话，Redux Toolkit 或者 Zustand 加 TanStack Query。umi 各版本之间的约定和插件 API 变过好几轮，具体配置以官方文档为准，我在 [使用 umi 改进 dva 项目开发](https://feinterview.poetries.top/blog/umi-dva) 那篇里也标了同样的提醒。

最后提一句，这篇里出现的 `dva/router`、`routerRedux.push` 这些都是基于 react-router v3/v4 时代的 API。react-router 到 v6 之后编程式导航换成了 `useNavigate` 这样的 Hook，写法完全不同了。老代码你照着这篇能看懂，新代码别照抄。

## 总结

dva 的核心就一个 model 文件。namespace 决定它在全局 state 树上占哪个位置，state 是初始数据，reducers 是唯一能改 state 的地方且必须是纯函数，effects 用 generator 处理所有带副作用的流程，subscriptions 负责把路由、键盘、websocket 这些外部信号接进同一条数据流。

写的时候记住三条边界就不会乱：有副作用的进 effect，纯计算的进 reducer，跟组件生命周期无关的取数时机交给 subscription。请求层单独抽 `utils/request` 加 `services/*`，让 model 只关心流程编排，不关心 axios 怎么用。

至于要不要在新项目里用它，我的答案是分情况。存量 dva 项目继续维护完全没问题，它依赖的 Redux 和 redux-saga 都还在；新项目建议看 Redux Toolkit 或者 Zustand，服务端数据单独交给 TanStack Query。这篇里的 model 分层思路仍然有效，换个库照样用得上，那才是真正值得带走的东西。

## 参考

- [dva官方教程](https://github.com/dvajs/dva-docs/blob/master/v1/zh-cn/tutorial/01-%E6%A6%82%E8%A6%81.md)
- [官方文档](https://github.com/dvajs/dva/blob/master/README_zh-CN.md)
- [使用Dva的所有知识点](https://github.com/dvajs/dva-knowledgemap)
- [Dva-React 应用框架在蚂蚁金服的实践](http://slides.com/sorrycc/dva#/)
- [roadhog介绍](https://github.com/sorrycc/roadhog#%E9%85%8D%E7%BD%AE)
- [创建一个 dva 脚手架工程](https://my.oschina.net/dkvirus/blog/1057996)
- [dva 脚手架目录分析](https://my.oschina.net/dkvirus/blog/1058203)
- [12 步 30 分钟，完成用户管理的 CURD 应用 (react+dva+antd)](https://github.com/sorrycc/blog/issues/18)
- [dva router4.0 使用实践总结](https://www.jianshu.com/p/c5ec9ffa29be)
- [dva 2.0中如何使用代码进行路由跳转](https://www.jianshu.com/p/7de59752b8a8)
- [dva 配置 browserHistory 实践总结](https://www.jianshu.com/p/2e9e45e9a880)
- [dva-loading 实践用法](https://www.jianshu.com/p/61fe7a57fad4)
- [dva 升级2.0版本遇到的问题小结](https://www.jianshu.com/p/649e97ff4354)
- [dva 中进行页面复用实践总结](https://www.jianshu.com/p/e0a220906301)
- [Dva知识地图](https://dvajs.com/knowledgemap/#javascript-%E8%AF%AD%E8%A8%80)
- [dva-API文档](https://dvajs.com/api/)
- [Redux Toolkit 官方文档](https://redux-toolkit.js.org/)
- [redux-saga 官方文档](https://redux-saga.js.org/)
- [前端进阶之旅](https://interview.poetries.top)
