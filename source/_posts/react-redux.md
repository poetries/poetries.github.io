---
title: 手写一个迷你版 Redux，从 createStore 到中间件
date: 2018-07-23 09:20:24
description: 用一百行代码实现迷你版 Redux，逐行拆解 createStore、dispatch、subscribe、compose、applyMiddleware 和 bindActionCreators 的实现，并说清楚这些设计在 Redux Toolkit 时代还剩下什么价值。
tags:
 - JavaScript
 - react
 - Redux
 - 源码实现
categories: Front-End
---

面试里被问「Redux 的原理是什么」，背几句「单一数据源、状态只读、纯函数修改」其实过不了关，因为面试官下一句多半是「那你说说 `applyMiddleware` 是怎么把一串中间件串起来的」。我第一次被问到这儿的时候卡住了，回去把 Redux 的核心文件翻了一遍才发现，去掉类型检查和报错信息，真正干活的代码不到一百行。

这篇就把这一百行自己写一遍。从 `createStore` 的三件套开始，一路写到 `compose`、`applyMiddleware` 和 `bindActionCreators`，最后手搓一个 thunk 中间件。读完你应该能不看文档把 store 的骨架默出来。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `createStore` 里 `getState` / `dispatch` / `subscribe` 三个方法各自在扛什么
- 为什么 `createStore` 一定要在返回之前先 dispatch 一次 `@@INIT`
- `compose` 那行 `reduce` 到底把函数嵌成了什么形状
- `applyMiddleware` 怎么用一层层洋葱包住原始的 `dispatch`
- `bindActionCreators` 解决的是哪个具体的重复劳动
- 手写一个 thunk 中间件，顺带看懂中间件的三层柯里化签名
- 这套手写代码在 Redux Toolkit 成为官方推荐之后还剩什么价值

## 一、先把 store 的形状定下来

Redux 对外只暴露一个东西，就是 store。store 上有三个方法，`getState` 读当前状态，`dispatch` 派发一个 action 触发状态更新，`subscribe` 注册一个回调，状态变了就通知你。

先说结论，Redux 的核心不是什么复杂算法，就是一个「函数 + 数组」。函数是 `reducer`，负责根据旧 state 和 action 算出新 state；数组是监听器列表，负责在算完之后挨个通知。

下面这段是最小可用的 `createStore`。它做的事情只有一件，把 state 关进闭包，只允许通过 `dispatch` 去动它：

```javascript
export const createStore = (reducer, preloadedState, enhancer) => {
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState
    preloadedState = undefined
  }
  if (enhancer) {
    return enhancer(createStore)(reducer, preloadedState)
  }

  let currentState = preloadedState
  let currentListeners = []

  const getState = () => currentState

  const subscribe = (listener) => {
    currentListeners.push(listener)
    // 返回取消订阅的函数，组件卸载时必须调它
    return () => {
      const index = currentListeners.indexOf(listener)
      if (index >= 0) currentListeners.splice(index, 1)
    }
  }

  const dispatch = (action) => {
    currentState = reducer(currentState, action)
    currentListeners.forEach(listener => listener())
    return action
  }

  dispatch({ type: '@@INIT' })
  return { getState, subscribe, dispatch }
}
```

这里有两处我在原来那版代码上改动过，得说明一下。

第一处是 `currentState` 的初始值。老写法里直接写死成 `let currentState = {}`，跑起来是能跑，但它把「还没初始化」和「空对象」混成了一件事。真实的 Redux 是把第三个位置留给 `preloadedState`，初始值为 `undefined`，这样第一次 `dispatch({type: '@@INIT'})` 的时候，reducer 拿到的 `state` 是 `undefined`，才会走 `state = 初始值` 那个默认参数分支。写成 `{}` 的话默认参数不生效，reducer 里的初始 state 就被吞掉了。这个坑我是在写 `combineReducers` 的时候才踩出来的。

第二处是 `subscribe` 的返回值。老写法只往数组里 push，没给你退出的路。组件里订阅完不取消，卸载之后监听器还挂在数组上，每次 dispatch 都会往一个已经不存在的组件里 setState。这就是最经典的一类内存泄漏。

### 1.1 那个 `@@INIT` 是干什么的

`dispatch({ type: '@@INIT' })` 这行看起来像凑数的，其实它是整个初始化流程的开关。

reducer 的标准写法是 `(state = 初始值, action) => {...}`，里面用 `switch` 匹配不到任何 case 时返回 `state` 原样。`createStore` 返回之前先派发一个没人认识的 action，所有 reducer 都会走到 `default` 分支，把自己的默认参数返回出来。这一轮跑完，`currentState` 就被填成了完整的初始状态树。

所以这个 action 的 `type` 必须是业务代码绝对不会用到的字符串。Redux 源码里用的是 `'@@redux/INIT' + 随机字符串`，加随机后缀就是为了防止有人真的写了个叫 `@@redux/INIT` 的 action type。

一行 dispatch 换来整棵状态树的初始化，这个设计我觉得挺漂亮。

## 二、compose，把函数嵌套变成一行 reduce

在写 `applyMiddleware` 之前，得先搞定 `compose`。它要解决的问题很直白，把 `[fn1, fn2, fn3]` 变成 `fn1(fn2(fn3(...args)))`。

```javascript
// fn1(fn2(fn3())) 把函数嵌套依次调用
export function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }
  if (funcs.length === 1) {
    return funcs[0]
  }
  return funcs.reduce((ret, item) => (...args) => ret(item(...args)))
}
```

原来那版这里有个 typo，两个判断分支里写的是 `funs` 而不是 `funcs`，直接跑会抛 `funs is not defined`。这次改对了。

关键在最后那行 `reduce`。它没给初始值，所以第一轮的 `ret` 就是 `funcs[0]`，`item` 是 `funcs[1]`，返回 `(...args) => fn1(fn2(...args))`。第二轮这个新函数又变成 `ret`，`item` 是 `funcs[2]`，套成 `(...args) => fn1(fn2(fn3(...args)))`。

顺着上面聊，注意执行顺序和数组顺序是反的。数组里排最后的 `fn3` 最先被调用，它的返回值交给 `fn2`，再交给 `fn1`。这个顺序在下一节的中间件里会直接决定「谁先看到 action」，别搞反了。

## 三、applyMiddleware，洋葱是怎么裹起来的

中间件要干的事是「在 action 到达 reducer 之前插一脚」。日志中间件想打印，thunk 中间件想把函数类型的 action 拦下来执行掉，saga 中间件想把 action 转发给 generator。

它们共用同一个签名，三层柯里化：

```javascript
const middleware = ({ getState, dispatch }) => next => action => {
  // 这里可以做任何事，然后决定要不要调 next(action)
  return next(action)
}
```

第一层拿到 store 的精简 API，第二层拿到「下一个中间件的 dispatch」，第三层才是真正的 action。为什么非要拆成三层？因为这三样东西是在三个不同时机才能拿到的。store 在 `applyMiddleware` 执行时就有了，`next` 要等所有中间件排好队才知道是谁，`action` 得等运行时用户真的 dispatch 了才有。

有了 `compose`，串联本身只有一行：

```javascript
export function applyMiddleware(...middlewares) {
  return createStore => (...args) => {
    const store = createStore(...args)
    let dispatch = store.dispatch

    const midApi = {
      getState: store.getState,
      // 这里必须用函数包一层，不能直接写 dispatch
      dispatch: (...args) => dispatch(...args)
    }

    const middlewaresChain = middlewares.map(middleware => middleware(midApi))
    dispatch = compose(...middlewaresChain)(store.dispatch)

    return {
      ...store,
      dispatch
    }
  }
}
```

老版本这段有三处写坏了，我一并修了：`export applyMiddleWare(...)` 少了 `function` 关键字；`return createStore=>...args=>` 里的剩余参数没加括号，正确写法是 `(...args) =>`；函数体最后少一个右花括号，整段是编译不过的。

`midApi.dispatch` 那行是这段代码里最容易被抄错的地方。它写成 `(...args) => dispatch(...args)` 而不是直接 `dispatch`，是因为此刻的 `dispatch` 还是原始的 `store.dispatch`，下一行才会被重新赋值成包装后的版本。用箭头函数包一层，取值就推迟到了真正调用的时候，中间件里调 `dispatch` 才能走完整条链路而不是绕过所有中间件。

这个坑我踩过。当时在中间件里想「重新派发一个 action 让别的中间件也处理一遍」，结果发现日志中间件一条都没打，排查了半天才定位到是取值时机的问题。

### 3.1 enhancer 是怎么接上的

回到第一节的 `createStore`，开头那几行 `if (enhancer) return enhancer(createStore)(reducer, preloadedState)` 现在就说得通了。

`applyMiddleware(...)` 的返回值正好是 `createStore => (...args) => store` 这个形状，把它当 enhancer 传进 `createStore`，`createStore` 就把自己交出去，让 enhancer 拿去重新组装。组装完返回的还是一个 store，只不过 `dispatch` 被换成了带中间件的版本。

所以 Redux 的中间件机制严格来说不是 `createStore` 的功能，是 enhancer 的一个应用。`applyMiddleware` 只是官方提供的、最常用的那个 enhancer。

## 四、bindActionCreators，省掉满屏的 dispatch

这个 API 存在感很低，但它解决的重复劳动很实在。

没有它的时候，组件里到处是 `dispatch(addTodo(text))`、`dispatch(removeTodo(id))`，每个调用点都要手动带上 `dispatch`。`bindActionCreators` 把 action creator 和 `dispatch` 提前绑一次，组件里直接调 `addTodo(text)` 就行，`dispatch` 的存在被藏起来了。

单个的绑定就一行：

```javascript
function bindActionCreator(creator, dispatch) {
  return (...args) => dispatch(creator(...args))
}
```

批量版本就是遍历对象的每个 key，逐个绑上去。原文用注释留了一版 `forEach` 写法，也留了一版 `reduce` 写法，两种都能跑，我把它们都保留在这儿，顺手修了几个 typo（形参 `didpatch` 拼错了，`forEach` 那版里 `let creator = creator[v]` 应该是 `creators[v]`，自己引用自己会直接抛 TDZ 错误）：

```javascript
function bindActionCreators(creators, dispatch) {
  // 写法一：命令式，好读
  // let bound = {}
  // Object.keys(creators).forEach(v => {
  //   let creator = creators[v]
  //   bound[v] = bindActionCreator(creator, dispatch)
  // })
  // return bound

  // 写法二：reduce 版，少一个中间变量
  return Object.keys(creators).reduce((ret, item) => {
    ret[item] = bindActionCreator(creators[item], dispatch)
    return ret
  }, {})
}
```

两种写法性能上没差别，选哪个看团队习惯。我自己的感受是 `forEach` 那版新人读起来更快，`reduce` 那版更紧凑但要在脑子里跑一遍累加器。

`bindActionCreators` 真正的用武之地在 `connect` 的第二个参数上，你传一个对象给 `mapDispatchToProps`，react-redux 内部就是用它把整个对象绑一遍。这块的细节在 [React connect 高阶组件原理与性能优化](https://feinterview.poetries.top/blog/react-redux-connect) 里单独展开了。

## 五、把 store 送进 React

Redux 本身跟 React 没关系，它就是个状态容器。要在 React 里用，得有人负责把 store 往下传。这个人是 `Provider`。

原理是老版本的 context API，父组件声明 `childContextTypes` 并实现 `getChildContext`，子孙组件声明 `contextTypes` 就能取到：

```javascript
import PropTypes from 'prop-types'

class Provider extends Component {
  static childContextTypes = {
    store: PropTypes.object
  }
  constructor(props, context) {
    super(props, context)
    this.store = props.store
  }
  getChildContext() {
    // 把传进来的 store 放进 context，子孙组件都能取到
    return { store: this.store }
  }
  render() {
    return this.props.children
  }
}
```

原文这里把 `PropTypes.object` 写成了 `Protypes.object`，跑起来会报 `Protypes is not defined`，改过来了。

接下来是 `connect`。它要做两件事：接收一个组件，把 state 里需要的那部分塞进它的 props；数据变了的时候通知它重渲。

```javascript
const connect = (mapStateToProps = state => state, mapDispatchToProps = {}) => (WrappedComponent) => {
  return class ConnectComponent extends React.Component {
    static contextTypes = {
      store: PropTypes.object
    }
    constructor(props, context) {
      super(props, context)
      this.state = { props: {} }
    }
    componentDidMount() {
      const { store } = this.context
      // 订阅 store，任何 dispatch 之后都重算一次 props
      this.unsubscribe = store.subscribe(() => this.update())
      this.update()
    }
    componentWillUnmount() {
      this.unsubscribe && this.unsubscribe()
    }
    update() {
      const { store } = this.context
      const stateProps = mapStateToProps(store.getState())
      const dispatchProps = bindActionCreators(mapDispatchToProps, store.dispatch)
      this.setState({
        props: {
          ...this.state.props,
          ...stateProps,
          ...dispatchProps
        }
      })
    }
    render() {
      return <WrappedComponent {...this.state.props} />
    }
  }
}
```

这段原文的问题比较多，逐个说清楚。`PropTypes.obejct` 拼错了。`constructor(props){ super(props, context){...} }` 这个写法直接是语法错误，`super` 后面不能跟花括号，而且 `context` 根本没进参数列表。`update` 里用的是 `mapDispatchProps`，而形参叫 `mapDispatchToProps`，变量名对不上。最后 `<wrapperComponent />` 首字母小写，JSX 会把它当成一个叫 `wrapperComponent` 的原生 DOM 标签渲染出去，页面上什么都不会有，这是新手写高阶组件最常见的一个坑。我还补了 `componentWillUnmount` 里的退订。

这个迷你版 `connect` 和真实的 react-redux 差得还很远，最明显的是它没做任何浅比较，store 里任何一个不相干的字段变了都会触发 `setState`。真实实现里靠 `shouldComponentUpdate` 挡掉了绝大部分无效渲染。

## 六、自己造一个 thunk 中间件

有了前面的签名，写中间件就是填空题。thunk 要做的事只有一句：如果 action 是个函数，就不往下传了，直接把 `dispatch` 和 `getState` 喂给它执行。

```javascript
const thunk = ({ dispatch, getState }) => next => action => {
  if (typeof action === 'function') {
    return action(dispatch, getState)
  }
  if (Array.isArray(action)) {
    return action.forEach(v => dispatch(v))
  }
  // 不认识的类型，原样往下传
  return next(action)
}
```

原文这里 `if(Array.isArray(action){` 少了一个右括号，补上了。数组那个分支是官方 thunk 没有的，属于自己加的糖，派发一个 action 数组就依次全派发掉。加不加看项目，我个人不太喜欢，因为它让 action 的类型又多了一种，日志和调试工具都要跟着适配。

`return next(action)` 这行是中间件的礼貌所在。你不处理的东西要原样传给下一环，链条才不会断。忘了写 `return` 也不算致命，但派发的返回值就丢了，遇到需要 `dispatch(...).then(...)` 的场景会直接报错。

Redux 官方那份 thunk 只比这个多一个 `extraArgument`，逻辑一模一样。异步流程更复杂的场景一般会换成 saga，这块可以看 [redux-saga 中间件原理与用法](https://feinterview.poetries.top/blog/redux-saga-and-redux-thunk)。

## 七、这些代码今天还有用吗

得说清楚，这篇写于 2018 年，上面所有代码对应的是 Redux 3/4 的实现思路。到今天为止，核心机制没变过，但外面的一层已经完全换了。

Redux 官方现在推荐的入口是 Redux Toolkit。`createStore` 在 Redux 4.2 之后被标记为 deprecated，官方文档明确建议改用 `configureStore`，它默认帮你装好 thunk 中间件和 DevTools 增强器，不用再手写 `applyMiddleware(thunk)` 加 `composeEnhancers` 那一串。手写 `actionTypes` 常量 + `switch` reducer 的模式也被 `createSlice` 取代了，它内置 Immer，reducer 里可以直接写 `state.count += 1` 而不用返回新对象。

`connect` 这层也一样。react-redux 从 7.1 开始提供 `useSelector` 和 `useDispatch`，函数组件里直接调 hook 就行，`mapStateToProps` / `mapDispatchToProps` 那套 API 现在主要出现在存量代码里。`connect` 本身还在维护，没有被移除，老项目不用急着改。

那这一百行代码今天还值不值得写一遍？我觉得值。Redux Toolkit 只是把这些机制包起来了，没有换掉它们。`configureStore` 底下还是 `createStore` 加 enhancer，`createSlice` 生成的还是标准的 reducer 和 action creator，中间件的三层柯里化签名一个字都没改。你写自定义中间件、排查「为什么某个 action 没进 reducer」这类问题的时候，用到的还是这一套。

倒过来说，如果你是新起项目，别照着这篇的写法去搭。这篇是用来理解机制的，不是拿来抄的脚手架。至于 Redux 和 Zustand、Jotai 这些方案怎么选，我在 [React 状态管理方案对比](https://feinterview.poetries.top/blog/react-state-management-comparison) 里单独比过。

## 总结

迷你版 Redux 的全部秘密，就是把 state 关进闭包，只留 `dispatch` 一个入口去改，改完遍历监听器数组挨个通知。`@@INIT` 负责把初始状态树填出来，`compose` 负责把中间件数组折叠成嵌套调用，`applyMiddleware` 负责把折叠好的链条接到原始 `dispatch` 上，`bindActionCreators` 负责把 `dispatch` 从调用点藏起来。

写这一版的时候修掉了原稿里七八处编译不过的地方，其中三处出在同一类问题上：剩余参数少了括号、变量名前后不一致、JSX 组件首字母小写。手写源码这种文章最怕的就是代码看着像那么回事但根本跑不起来，这次都在本地过了一遍语法。

至于 Redux Toolkit，它没有让这篇过时，只是把这一百行藏到了更深的地方。真到了要写自定义中间件或者排查 dispatch 链路的时候，你还是得回来看它。

## 参考

- [Redux 官方文档 - Store](https://redux.js.org/api/store)
- [Redux 官方文档 - applyMiddleware](https://redux.js.org/api/applymiddleware)
- [Redux 官方文档 - Middleware 编写指南](https://redux.js.org/understanding/history-and-design/middleware)
- [Redux Toolkit configureStore](https://redux-toolkit.js.org/api/configureStore)
- [react-redux Hooks API](https://react-redux.js.org/api/hooks)
- [前端进阶之旅](https://interview.poetries.top)
