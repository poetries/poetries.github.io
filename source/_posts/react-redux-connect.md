---
title: React Redux 之 connect 高阶组件原理与源码拆解
description: 拆解 react-redux 的 connect 高阶组件，讲清 mapStateToProps、mapDispatchToProps、mergeProps 各自的职责和调用时机，配合 Provider 的 context 传递、store 订阅与浅比较的源码骨架，以及 hooks 时代它的现状。
date: 2018-12-20 17:50:24
tags: 
  - React
  - Javascript
  - Redux
  - react-redux
categories: Front-End
---

第一次用 `react-redux` 的时候我有个很实在的疑惑：组件里明明没写任何订阅代码，只是在导出的时候套了一层 `connect(mapStateToProps)(MyComp)`，为什么 store 一变它就重渲了？后来项目里出了个更奇怪的问题，某个组件死活不更新，reducer 里打印能看到新 state，组件的 props 就是老的。排查了一下午，最后发现是 `mapStateToProps` 返回的引用没变。

那次之后我把 `connect` 的实现翻了一遍，才算真正理解它在干什么。这篇就把这层壳拆开：`connect` 的四个参数各管什么，`Provider` 为什么必须存在，订阅和更新的链路是怎么走的，以及为什么「返回同一个引用」会让组件不更新。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `connect` 的四个参数 `mapStateToProps` / `mapDispatchToProps` / `mergeProps` / `options` 各自的职责
- `mapStateToProps` 的两个形参，以及它什么时候会被重新调用
- `mapDispatchToProps` 的函数形式和对象简写，各自适合什么场景
- `Provider` 通过 context 往下传 store 的这条链路
- `connect` 源码骨架：两层高阶函数、订阅、浅比较、卸载清理
- 为什么「不更新」的问题九成出在引用相等上
- hooks 时代 `useSelector` / `useDispatch` 取代它之后，这套原理还剩下什么价值

## 一、connect 到底在做什么

一句话说，`connect` 负责把 `React` 组件和 `Redux store` 连起来。

它的完整签名长这样：

```js
connect([mapStateToProps], [mapDispatchToProps], [mergeProps], [options])
```

四个参数全是可选的。前两个最常用，一个负责「读」，一个负责「写」。第三个 `mergeProps` 决定读到的、写出的、组件自己的三部分 props 怎么合并，第四个 `options` 调优化行为。

注意 `connect(...)` 的返回值不是组件，而是一个函数。你得再调用一次，把真正的组件传进去，才拿到最终那个被包裹的组件：

```js
// 第一步：传配置，拿到一个「组件生产函数」
const enhancer = connect(mapStateToProps, mapDispatchToProps)

// 第二步：传组件，拿到被包裹后的组件
const ConnectedComp = enhancer(MyComp)

// 平时都是连起来写
export default connect(mapStateToProps, mapDispatchToProps)(MyComp)
```

这个两层调用的结构就是高阶组件的典型写法。分成两层的好处是配置可以复用，同一份 `mapStateToProps` 能套给多个组件，也方便和别的 HOC 组合。

被包裹出来的这个组件，`react-redux` 内部叫 `Connect`。它自己不渲染任何 UI，只干四件事：从上层拿到 store，算出要传下去的 props，订阅 store 的变化，在合适的时机决定要不要重渲。你的业务组件被它包在里面，对这一切毫无感知，收到的就是一堆普通 props。

这种「容器组件负责取数据、展示组件只管渲染」的拆法，就是当年很流行的 container / presentational 分层。

## 二、mapStateToProps 负责读

### 2.1 从 state 里挑出组件要的那部分

这个函数允许我们把 store 中的数据作为 props 绑定到组件上：

```js
const mapStateToProps = (state) => {
  return {
    count: state.count
  }
}
```

第一个参数就是 `Redux` 的 `state`，我们从中摘出了 `count` 属性。

这里有个原则要强调：你不必把 `state` 原封不动地传进组件，而应该根据 `state` 里的数据，动态算出组件需要的那个最小属性集。这不是洁癖，是性能问题。传得越多，组件被无关变化牵连重渲的概率就越大。

举个具体的，一个订单列表页只需要列表和加载状态，那就别把整个 `state.order` 塞进去：

```js
// 不推荐：把整个 slice 摊进来，slice 里任何字段变了都会重新计算
const mapStateToProps = (state) => ({
  order: state.order
})

// 推荐：只挑要用的
const mapStateToProps = (state) => ({
  list: state.order.list,
  loading: state.order.loading
})
```

### 2.2 第二个参数 ownProps

`mapStateToProps` 还能接第二个参数 `ownProps`，指的是组件自己身上的 props，也就是父组件传给 `ConnectedComp` 的那些。

它的用处是根据组件自身的属性去 state 里做筛选：

```js
// <UserCard userId="42" /> 这样用的时候
const mapStateToProps = (state, ownProps) => ({
  user: state.users.byId[ownProps.userId]
})
```

这里有个坑要注意。一旦你声明了第二个形参，`mapStateToProps` 的调用时机就变了：不光 state 变化时会调，`ownProps` 变化时也会调一次。如果你写的是 `(state) => ({...})`，`react-redux` 检测到函数只有一个形参，就会跳过 `ownProps` 变化触发的那次重算。这个行为是靠 `Function.length` 判断的，所以别为了「统一风格」给用不到的地方硬加第二个参数。

state 变化或者 `ownProps` 变化的时候，`mapStateToProps` 都会被调用，算出一个新的 `stateProps`，和 `ownProps` 合并之后更新给组件。

### 2.3 引用相等这个大坑

回到开头那个「组件死活不更新」的问题。

`connect` 判断要不要重渲，用的是浅比较：拿新算出的 `stateProps` 和上一次的逐个字段比引用。所以下面这种写法会出事：

```js
// 有坑：每次调用都产生一个新数组，浅比较永远认为「变了」
const mapStateToProps = (state) => ({
  activeList: state.list.filter(item => item.active)
})
```

`filter` 每次都返回新数组，引用必然不同，结果是 store 里任何无关的字段变化都会导致这个组件重渲。反过来，如果你在 reducer 里直接 `state.list.push(item)` 然后 `return state`，引用没变，`connect` 就认为什么都没发生，组件不更新。

我当年踩的正是后面这个。reducer 里改了数组又把原对象返回出去，`console.log` 打印的确实是新数据，因为打印的就是那个被改过的对象，但引用从头到尾是同一个。

这两个坑其实是同一条规则的两面：Redux 靠引用变化判断状态变化。前者的解法是用 `reselect` 这类库给派生数据做缓存，后者的解法是老老实实返回新对象。关于状态只读和纯函数修改这两条为什么必须守住，我在 [Redux 原理与三大原则](https://feinterview.poetries.top/blog/react-redux-analyse) 里单独展开过。

## 三、mapDispatchToProps 负责写

`connect` 的第二个参数是 `mapDispatchToProps`，它的功能是把 `action` 作为 props 绑定到组件上，同样会成为被包裹组件的 props。

```js
mapDispatchToProps(dispatch, ownProps): dispatchProps
```

### 3.1 函数形式

写成函数时，第一个参数是 `dispatch`，你自己决定往下传什么：

```js
const mapDispatchToProps = (dispatch) => ({
  increase: () => dispatch({ type: 'INCREMENT' }),
  setName: (name) => dispatch({ type: 'SET_NAME', payload: name })
})
```

组件里就可以直接 `this.props.increase()`，完全不用知道 `dispatch` 的存在。这是 `connect` 设计里我觉得最舒服的一点，展示组件对 Redux 零依赖，单独拿去测试或者换状态管理方案都不用改。

同样支持 `ownProps` 作为第二个参数，行为和 `mapStateToProps` 一致，形参写了才会在 props 变化时重算。

### 3.2 对象简写

如果你的 action creator 本来就返回 action 对象，可以直接传一个对象，`react-redux` 会自动用 `bindActionCreators` 包一层：

```js
import { increase, setName } from './actions'

export default connect(mapStateToProps, { increase, setName })(MyComp)
```

日常我几乎只用这个写法，短、不容易写错。函数形式留给需要在 dispatch 前后做点别的事情的场景，比如合并多个 action、或者根据 `ownProps` 决定 dispatch 什么。

还有个细节：如果你完全不传第二个参数，`connect` 会把 `dispatch` 本身作为 prop 传给组件。所以有些老代码里能看到组件里直接 `this.props.dispatch({ type: 'XXX' })`，那不是魔法，就是这个默认行为。

## 四、mergeProps 和 options

这两个参数用得少，但知道它们存在有好处。

`mergeProps(stateProps, dispatchProps, ownProps)` 决定最终传给组件的 props 长什么样。不传的话默认就是 `{ ...ownProps, ...stateProps, ...dispatchProps }`。需要自定义的典型场景是让 dispatch 函数能拿到 state：

```js
const mergeProps = (stateProps, dispatchProps, ownProps) => ({
  ...ownProps,
  ...stateProps,
  ...dispatchProps,
  // 提交时自动带上当前表单里的值
  submit: () => dispatchProps.submitForm(stateProps.formValues)
})
```

`options` 里比较有用的是 `areStatePropsEqual` 这类比较函数，可以把默认的浅比较换成自定义逻辑。不到有明确性能问题的时候不建议动它，自定义比较函数本身也有开销，而且写错了就是「该更新的不更新」，比多渲染几次难查得多。

## 五、Provider 是这一切的前提

`connect` 之所以能拿到 store，是因为外面还有一层 `Provider`。

它做的事就两件：在原应用组件上包裹一层，让整个应用成为 `Provider` 的子组件；接收 `Redux` 的 `store` 作为 props，通过 `context` 对象传递给子孙组件上的 `connect`。

```jsx
import { Provider } from 'react-redux'

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
```

为什么非得走 context？因为 store 要给任意深度的组件用，一层层往下传 props 显然不现实。context 就是 React 官方给的跨层级传值通道，`Provider` 在顶上放一份，`Connect` 在任意位置取一份。

顺着上面聊，`connect` 真正连接 `Redux` 和 `React` 的动作就发生在这儿：它包在容器组件外面一层，接收 `Provider` 提供的 `store` 里的 `state` 和 `dispatch`，交给前面那几个 map 函数处理，返回一个对象，以属性形式传给容器组件。

这也解释了一个常见报错。忘了套 `Provider` 就用 `connect`，控制台会告诉你找不到 store，因为 context 里压根没有。

## 六、connect 源码骨架

`connect` 是一个高阶函数。先传入 `mapStateToProps`、`mapDispatchToProps`，返回一个生产 `Component` 的函数（`wrapWithConnect`），再把真正的 `Component` 作为参数传进去，就生产出一个包裹后的 `Connect` 组件。

这个组件有四个特点：

- 通过 `props.store` 或者祖先组件的 context 获取 store，把 `stateProps`、`dispatchProps`、`parentProps` 合并成 `nextState`，作为 props 传给真正的 `Component`
- `componentDidMount` 时调用 `this.store.subscribe(this.handleChange)` 注册监听，实现页面交互
- `shouldComponentUpdate` 时判断能否跳过渲染，提升页面性能，并算出新的 `nextState`
- `componentWillUnmount` 时移除注册的监听，避免内存泄漏

主要逻辑简化之后是这样：

```js
export default function connect(mapStateToProps, mapDispatchToProps, mergeProps, options = {}) {
  return function wrapWithConnect(WrappedComponent) {
    class Connect extends Component {
      constructor(props, context) {
        super(props, context)
        // 从祖先 Component 处获得 store
        this.store = props.store || context.store
        this.stateProps = computeStateProps(this.store, props)
        this.dispatchProps = computeDispatchProps(this.store, props)
        this.state = { storeState: null }
        // 对 stateProps、dispatchProps、parentProps 进行合并
        this.updateState()
      }

      componentDidMount() {
        // 订阅 store，变化时改变 Connect 自身的 state 以触发重渲
        this.unsubscribe = this.store.subscribe(this.handleChange)
      }

      componentWillUnmount() {
        // 组件卸载时取消订阅
        this.unsubscribe && this.unsubscribe()
      }

      handleChange = () => {
        this.setState({ storeState: this.store.getState() })
      }

      shouldComponentUpdate(nextProps, nextState) {
        // 浅比较，只有真正变化时才让 Component 重新渲染
        if (propsChanged || mapStateProducedChange || dispatchPropsChanged) {
          this.updateState(nextProps)
          return true
        }
        return false
      }

      render() {
        return <WrappedComponent {...this.nextState} />
      }
    }

    Connect.contextTypes = { store: storeShape }
    return Connect
  }
}
```

这段是从原文那版整理来的，我顺手修了三处问题：原来 `constructor` 里漏了 `super(props, context)`，React 类组件不调这句直接就报错；`this.store.subscribe(() = {` 少了一个 `>`，是个 typo；另外原版只说了「`componentWillUnmount` 时移除事件」，代码里却没写，订阅之后不取消就是标准的内存泄漏，这里补上了 `unsubscribe`。

### 6.1 更新链路走一遍

把上面这段串起来看，一次 dispatch 之后发生的事是这样的：

Step 1，reducer 算出新的 state，store 通知所有订阅者。

Step 2，`Connect` 的 `handleChange` 被调用，`setState({ storeState })`。注意它存的这个字段本身没人用，纯粹是为了触发一次 React 的更新流程。

Step 3，`shouldComponentUpdate` 里重新跑 `mapStateToProps`，把结果和上次浅比较。

Step 4，有变化就返回 `true`，`render` 把新的 `nextState` 摊给业务组件；没变化返回 `false`，业务组件的 `render` 根本不会执行。

第三步和第四步就是 `connect` 性能优化的全部秘密。它不是让更新变快，是让大多数更新根本不发生。

### 6.2 关于这份源码的时效性

这里得说清楚一件事，上面这个骨架对应的是 `react-redux` 早期版本，用的是 `contextTypes` 这套 legacy context API。React 16.3 之后官方推出了新的 Context API，`react-redux` 从 v6 开始改用它；v7 又调整为在 `Connect` 内部用 `useContext` 加自己的订阅机制；到了 v8 则接入了 React 18 的 `useSyncExternalStore` 来解决并发渲染下的撕裂问题。

具体到某个版本的实现细节，建议直接看仓库源码，我这里不敢照着记忆写。但心智模型这些年是稳的：从 context 拿 store、订阅、算 props、浅比较、决定要不要重渲，这五步一直没变。

## 七、hooks 时代这套东西还剩什么

先说结论：新写的代码基本不用 `connect` 了。

`react-redux` v7.1 引入 hooks 之后，官方文档推荐的默认写法变成了 `useSelector` 和 `useDispatch`：

```jsx
import { useSelector, useDispatch } from 'react-redux'

function Counter() {
  const count = useSelector(state => state.count)
  const dispatch = useDispatch()

  return (
    <button onClick={() => dispatch({ type: 'INCREMENT' })}>
      {count}
    </button>
  )
}
```

对比一下就知道为什么它赢了。`connect` 要写两个 map 函数、要多一层组件嵌套、TypeScript 下的类型推导写起来相当啰嗦；hooks 版本一行一个，读什么写什么直接摆在组件里。

不是说 `connect` 不行，它现在仍然是被维护的 API，老项目照用不误，类组件也只能用它。但如果你在起新项目，没有理由再选它。

有意思的是那个引用相等的坑并没有消失，只是换了个位置。`useSelector` 默认也用引用相等（`===`）判断要不要重渲，所以下面这种写法照样每次都触发更新：

```jsx
// 有坑：每次返回新对象
const { list, loading } = useSelector(state => ({
  list: state.order.list,
  loading: state.order.loading
}))

// 解法一：拆成两次 useSelector
const list = useSelector(state => state.order.list)
const loading = useSelector(state => state.order.loading)

// 解法二：传 shallowEqual 作为第二个参数
import { shallowEqual } from 'react-redux'
const { list, loading } = useSelector(state => ({ ... }), shallowEqual)
```

你看，理解 `connect` 的意义就在这儿。它是把「订阅 + 派生 + 浅比较」这三件事显式写出来的版本，搞懂了它，`useSelector` 的行为你不用查文档也能猜到。

另外 Redux 官方现在推荐的是 Redux Toolkit，`createSlice` 一把梭，手写 action types 和 switch reducer 那套模板已经不是推荐做法了。至于 Redux 本身在今天还该不该选，以及和 Zustand、Jotai、MobX 这些方案怎么比，我另外写过一篇 [React 状态管理方案对比](https://feinterview.poetries.top/blog/react-state-management-comparison)。想从更底层理解 store 和 dispatch 是怎么实现的，可以看 [手写一个迷你版 Redux](https://feinterview.poetries.top/blog/react-redux)。

## 总结

`connect` 的四个参数分工很清楚：`mapStateToProps` 负责从 store 挑出组件要的最小数据集，`mapDispatchToProps` 负责把 action 包成能直接调的函数，`mergeProps` 决定三份 props 怎么合并，`options` 用来微调比较行为。前两个函数都支持 `ownProps` 作为第二形参，但形参写了才会在 props 变化时重算，这是靠 `Function.length` 判断的。

`Provider` 把 store 放进 context，`Connect` 从 context 取出来，订阅变化，每次通知就重跑 `mapStateToProps` 做一次浅比较，比出差异才让业务组件重渲。所有「组件不更新」和「组件疯狂重渲」的问题，最后都能归到浅比较和引用相等这一条规则上。

新项目直接用 `useSelector` / `useDispatch` 加 Redux Toolkit，`connect` 留给类组件和存量代码。但它的实现思路值得看一遍，因为 hooks 版本只是把同一套逻辑换了个入口，坑一个没少。

## 参考

- [React Redux connect 官方文档](https://react-redux.js.org/api/connect)
- [React Redux Hooks 官方文档](https://react-redux.js.org/api/hooks)
- [React Redux Provider 官方文档](https://react-redux.js.org/api/provider)
- [Redux Toolkit 官方文档](https://redux-toolkit.js.org/)
- [React Context 官方文档](https://react.dev/reference/react/createContext)
- [前端进阶之旅](https://interview.poetries.top)
