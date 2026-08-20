---
title: React Hooks 详解，useState useEffect useContext 与 useReducer
date: 2019-09-01 16:30:40
description: 从组件类的痛点讲起，逐个拆解 useState、useContext、useReducer、useEffect 四个核心 Hook 的用法、依赖数组语义、清理函数和竞态处理，并对照今天 React 19 上的实际情况。
tags:
   - React
   - Hooks
   - useEffect
   - 函数组件
categories: Front-End
---

一个只有「点我」两个字的按钮，用 class 写要多少行？构造函数、`super()`、初始化 state、绑定 this、定义方法、render 返回，一共六段，实际有效逻辑只有一行。这还只是一个按钮，真实项目里一个页面组件动辄七八个生命周期方法，同一件事的逻辑被拆在 `componentDidMount` 和 `componentWillUnmount` 两头。

Hooks 就是来把这套东西拆掉的。这篇按原文的顺序过一遍四个核心 Hook，每个都补上当年没讲的边界条件，最后单开一节说明 2019 到今天 React 19 之间这套 API 发生了什么变化。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 组件类到底重在哪，Hooks 想解决的是什么问题
- `useState` 的函数式更新、惰性初始化，以及它和 class 里 `setState` 不合并这个差异
- `useContext` 共享状态的写法，和它带来的重渲染代价
- `useReducer` 什么时候比 `useState` 划算，它和 Redux 的界限在哪
- `useEffect` 的依赖数组语义、清理函数、以及请求竞态怎么处理
- Hooks 的两条硬规则，以及 React 18/19 上的新变化

## 一、组件类的缺点

`React` 的核心是组件。`v16.8` 版本之前，组件的标准写法是类（class）。下面是一个简单的组件类：

```js

import React, { Component } from "react";

export default class Button extends Component {
  constructor() {
    super();
    this.state = { buttonText: "Click me, please" };
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() {
    this.setState(() => {
      return { buttonText: "Thanks, been clicked!" };
    });
  }
  render() {
    const { buttonText } = this.state;
    return <button onClick={this.handleClick}>{buttonText}</button>;
  }
}
```

这个组件类仅仅是一个按钮，但可以看到，它的代码已经很「重」了。真实的 React App 由多个类按照层级一层层构成，复杂度成倍增长。再加入 Redux，就变得更复杂。

代码量只是表面。真正难受的是两件事。

一是 `this` 的指向问题。`handleClick` 必须在构造函数里 bind，或者写成 class 属性配合箭头函数，忘了就是运行时报 `Cannot read property 'setState' of undefined`。二是逻辑复用没有好办法，高阶组件和 render props 都能做，但代价是组件树里多出一堆没有实际渲染意义的包装层，React DevTools 里翻五层才找到自己的组件。

还有一个更隐蔽的问题。同一件事的代码会被生命周期强行拆开：订阅写在 `componentDidMount`，退订写在 `componentWillUnmount`，中间隔着几百行；而不相干的事情反而被塞在同一个方法里。逻辑按「时机」组织，而不是按「关注点」组织。

## 二、Hook 的含义

- `React Hooks` 的意思是，组件尽量写成纯函数，如果需要外部功能和副作用，就用钩子把外部代码「钩」进来。`React Hooks` 就是那些钩子
- 你需要什么功能，就使用什么钩子。`React` 默认提供了一些常用钩子，你也可以封装自己的钩子
- 所有的钩子都是为函数引入外部功能，所以 `React` 约定，钩子一律使用 use 前缀命名，便于识别。你要使用 `xxx` 功能，钩子就命名为 `usexxx`

React 默认提供的四个最常用的钩子：

- `useState()`
- `useContext()`
- `useReducer()`
- `useEffect()`

`use` 前缀不只是命名习惯，它是 ESLint 规则赖以工作的信号。`eslint-plugin-react-hooks` 靠函数名是不是 `use` 开头来判断这是不是一个 Hook，进而检查调用位置合不合法。名字写成 `getUserState` 而不是 `useUserState`，规则就管不到它了。

## 三、useState()：状态钩子

`useState()` 用于为函数组件引入状态（`state`）。纯函数不能有状态，所以把状态放在钩子里面。

用户点击按钮会导致按钮的文字改变，文字取决于用户是否点击，这就是状态。使用 `useState()` 重写如下：

```js
import React, { useState } from "react";

export default function  Button()  {
  const  [buttonText, setButtonText] =  useState("Click me,   please");

  function handleClick()  {
    return setButtonText("Thanks, been clicked!");
  }

  return  <button  onClick={handleClick}>{buttonText}</button>;
}
```

对比一下上面的 class 版本，构造函数没了，bind 没了，`this` 没了，六段变成了三行。

`useState()` 这个函数接受状态的初始值作为参数，上例的初始值为按钮的文字。该函数返回一个数组，第一个成员是一个变量（上例是 `buttonText`），指向状态的当前值。第二个成员是一个函数，用来更新状态，约定是 set 前缀加上状态的变量名（上例是 `setButtonText`）。

### 3.1 三个当年没讲清楚的点

第一个是**状态不合并**。class 里的 `this.setState({ a: 1 })` 会和已有 state 做浅合并，`b` 字段还在。`useState` 的 setter 是整体替换，你写 `setUser({ name: 'x' })`，原来的 `age` 就没了。想保留得自己展开：

```js
setUser(prev => ({ ...prev, name: 'x' }))
```

第二个是**函数式更新**。setter 接受一个函数，参数是上一次的状态值。连续更新同一个状态时必须用这个形式：

```js
// 这样写只会加 1，两次拿到的 count 是同一个快照
setCount(count + 1)
setCount(count + 1)

// 这样写才是加 2
setCount(c => c + 1)
setCount(c => c + 1)
```

原因是 `count` 是这次渲染闭包里的一个常量，在这次渲染的整个生命周期内它都不会变。这就是所谓的闭包陷阱，在 `setTimeout`、事件监听、异步回调里表现得最明显，因为它们捕获的可能是好几次渲染之前的值。

第三个是**惰性初始化**。`useState(expensiveCalc())` 里的 `expensiveCalc()` 每次渲染都会被执行，只是返回值从第二次起被丢掉了。要避免这个浪费，把它包成函数传进去：

```js
const [data, setData] = useState(() => expensiveCalc())
```

这三条里，第二条踩的人最多。

## 四、useContext()：共享状态钩子

如果需要在组件之间共享状态，可以使用 `useContext()`。现在有两个组件 `Navbar` 和 `Messages`，我们希望它们之间共享状态：

```html
<div className="App">
  <Navbar/>
  <Messages/>
</div>
```

第一步是使用 `React Context API`，在组件外部建立一个 `Context`：

```js
const AppContext = React.createContext({});
```

组件封装代码如下：

```html
<AppContext.Provider value={{
  username: 'superawesome'
}}>
  <div className="App">
    <Navbar/>
    <Messages/>
  </div>
</AppContext.Provider>
```

`AppContext.Provider` 提供了一个 `Context` 对象，这个对象可以被子组件共享。

Navbar 组件的代码如下：

```js
const Navbar = () => {
  const { username } = useContext(AppContext);
  return (
    <div className="navbar">
      <p>AwesomeSite</p>
      <p>{username}</p>
    </div>
  );
}
```

`useContext()` 钩子函数用来引入 `Context` 对象，从中获取 `username` 属性。

Message 组件的代码也类似：

```js
const Messages = () => {
  const { username } = useContext(AppContext)

  return (
    <div className="messages">
      <h1>Messages</h1>
      <p>1 message for {username}</p>
      <p className="message">useContext is awesome!</p>
    </div>
  )
}
```

上面这段代码有个隐患，`value` 写的是对象字面量。Provider 所在的组件每次重渲染，这个对象都是新引用，所有消费这个 Context 的组件都会跟着重渲染，哪怕 `username` 一个字都没变。

正确的做法是把 value 用 `useMemo` 稳住：

```js
const value = useMemo(() => ({ username }), [username])
```

还有一个绕不过去的限制。Context 的更新粒度是整个 value 对象，你没法做到「只订阅 value 里的某个字段」。一个大 Context 里塞了用户信息、主题、语言三样东西，改语言会让读用户信息的组件也重渲染。所以实践中的做法是**按变更频率拆分多个 Context**，而不是塞进一个大对象。

这也是 Zustand、Jotai 这类库存在的理由之一，它们在订阅粒度上比 Context 细得多。

## 五、useReducer()：action 钩子

- React 本身不提供状态管理功能，通常需要使用外部库。这方面最常用的库是 Redux
- Redux 的核心概念是，组件发出 `action` 与状态管理器通信。状态管理器收到 `action` 以后，使用 `Reducer` 函数算出新的状态，`Reducer` 函数的形式是 `(state, action) => newState`
- `useReducer()` 钩子用来引入 `Reducer` 功能

```js
const [state, dispatch] = useReducer(reducer, initialState);
```

上面是 `useReducer()` 的基本用法，它接受 `Reducer` 函数和状态的初始值作为参数，返回一个数组。数组的第一个成员是状态的当前值，第二个成员是发送 `action` 的 `dispatch` 函数。

下面是一个计数器的例子。用于计算状态的 Reducer 函数如下：

```js
const myReducer = (state, action) => {
  switch(action.type)  {
    case('countUp'):
      return  {
        ...state,
        count: state.count + 1
      }
    default:
      return  state;
  }
}
```

```js
function App() {
  const [state, dispatch] = useReducer(myReducer, { count:   0 });
  return  (
    <div className="App">
      <button onClick={() => dispatch({ type: 'countUp' })}>
        +1
      </button>
      <p>Count: {state.count}</p>
    </div>
  );
}
```

由于 Hooks 可以提供共享状态和 Reducer 函数，所以它在这些方面可以取代 Redux。但是它没法提供中间件（middleware）和时间旅行（time travel），如果你需要这两个功能，还是要用 Redux。

### 5.1 什么时候该从 useState 换成 useReducer

这个判断我自己有三条经验。

一是多个状态字段之间有联动关系。比如一个请求组件有 `loading`、`data`、`error` 三个 state，它们的合法组合其实只有三种，用三个 `useState` 很容易写出「loading 是 true 但 error 也有值」这种不可能状态。reducer 把状态迁移集中在一处，就堵住了这类问题。

二是更新逻辑本身复杂，同一个动作要改好几个字段。散在各个事件处理函数里改三次 setState，不如发一个 action 让 reducer 一次算完。

三是需要把更新逻辑单独测试。reducer 是纯函数，输入 state 和 action，输出新 state，不依赖 React，写单测最省事。

还有一个实际好处，`dispatch` 的引用是稳定的，跨渲染不变。把它传给深层子组件不会破坏子组件的 memo，也不用套 `useCallback`。

原文那句「可以取代 Redux」要加个限定。`useReducer` 是组件级的，状态还是活在这个组件里，跨组件共享仍然要靠 Context 往下传，而 Context 传状态就会遇到上一节说的重渲染问题。所以 `useReducer` + Context 这套组合适合中小规模的局部状态，全局状态到了一定复杂度还是得上专门的库。

## 六、useEffect()：副作用钩子

`useEffect()` 用来引入具有副作用的操作，最常见的就是向服务器请求数据。以前放在 `componentDidMount` 里面的代码，现在可以放在 `useEffect()`。

`useEffect()` 的用法如下：

```js
useEffect(()  =>  {
  // Async Action
}, [dependencies])
```

`useEffect()` 接受两个参数。第一个参数是一个函数，异步操作的代码放在里面。第二个参数是一个数组，用于给出 Effect 的依赖项，只要这个数组发生变化，`useEffect()` 就会执行。第二个参数可以省略，这时每次组件渲染时，就会执行 `useEffect()`。

这里要把「发生变化」说准确一点：React 会用 `Object.is` 逐项比较这次渲染和上次渲染的依赖数组，只要有任意一项不同就重新执行。所以依赖里放对象字面量或者内联函数，等于每次都变，effect 每次都跑。

三种写法的区别值得单独记一下：

| 写法 | 执行时机 |
|------|----------|
| `useEffect(fn)` | 每次渲染后都执行 |
| `useEffect(fn, [])` | 只在挂载后执行一次 |
| `useEffect(fn, [a, b])` | 挂载后执行，之后 a 或 b 变化时执行 |

原文给的取数示例是这样：

```js
const Person = ({ personId }) => {
  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState({});

  useEffect(() => {
    setLoading(true);
    fetch(`https://swapi.co/api/people/${personId}/`)
      .then(response => response.json())
      .then(data => {
        setPerson(data);
        setLoading(false);
      });
  }, [personId])

  if (loading === true) {
    return <p>Loading ...</p>
  }

  return <div>
    <p>You're viewing: {person.name}</p>
    <p>Height: {person.height}</p>
    <p>Mass: {person.mass}</p>
  </div>
}
```

每当组件参数 `personId` 发生变化，`useEffect()` 就会执行，组件第一次渲染时也会执行。这段代码演示 `useEffect` 的用法是够的，但直接抄到项目里会有两个真实问题。

### 6.1 请求竞态

用户快速把 `personId` 从 1 切到 2，会发出两个请求。如果 1 的响应比 2 慢，最后 `setPerson` 的是 1 的数据，界面显示的却是 2 的 id。这个 bug 在本地开发时几乎复现不出来，因为接口太快了，上线之后弱网用户才会遇到。

清理函数就是为这个准备的。effect 返回的函数会在下一次 effect 执行前、以及组件卸载时被调用：

```js
useEffect(() => {
  let ignore = false
  setLoading(true)
  fetch(`/api/people/${personId}/`)
    .then(res => res.json())
    .then(data => {
      if (ignore) return
      setPerson(data)
      setLoading(false)
    })
  return () => { ignore = true }
}, [personId])
```

更彻底的做法是用 `AbortController` 把请求也真正取消掉，省下无用的网络开销：

```js
useEffect(() => {
  const controller = new AbortController()
  fetch(`/api/people/${personId}/`, { signal: controller.signal })
    .then(res => res.json())
    .then(setPerson)
    .catch(err => {
      if (err.name !== 'AbortError') throw err
    })
  return () => controller.abort()
}, [personId])
```

### 6.2 只订阅不清理

同类问题还有一批：`addEventListener` 不 `removeEventListener`、`setInterval` 不 `clearInterval`、WebSocket 连了不关。这些在开发时看不出来，但组件反复挂载卸载之后，监听器会一个个堆上去，最终表现为页面越用越卡。我把常见的几种泄漏场景和排查手段整理在 [JavaScript 内存泄漏排查](https://feinterview.poetries.top/blog/js-memory-leak) 那篇里。

判断标准很简单：effect 里做了任何「会持续存在」的事，就必须在返回的清理函数里撤销它。

## 七、Hooks 的两条规则

这两条不是建议，是硬性的。

**只能在函数组件或自定义 Hook 的顶层调用 Hook**，不能放在 `if`、`for`、嵌套函数里。因为 React 内部是靠调用顺序把 Hook 和状态对应起来的，某次渲染少调了一个，后面所有 Hook 的状态全部错位。

**只能在 React 函数里调用 Hook**，普通的工具函数、class 方法里都不行。

装一个 `eslint-plugin-react-hooks` 就能把这两条自动管住，同时它的 `exhaustive-deps` 规则还会检查依赖数组漏没漏项。我的建议是别去关这条规则，它报出来的绝大多数都是真问题，实在需要例外就单行加注释禁用并写清原因。

## 八、2019 到现在，这套 API 变了什么

这篇写于 Hooks 刚发布不久的 2019 年，React 那时是 16.8。到今天已经是 19，上面的写法一条都没被废弃，但周围多了不少东西，简单对照一下。

**严格模式会让 effect 执行两次。** React 18 起，开发环境的 `StrictMode` 会给每个组件模拟一轮卸载重挂，effect 的执行顺序变成「执行 -> 清理 -> 再执行」。很多人升级后第一反应是接口请求发了两次，然后去关 `StrictMode`。这个行为炸出来的基本都是真问题，也就是上面 6.1 和 6.2 讲的那两类，正确做法是把清理函数补齐。这部分我在 [React 18 新特性与升级指南](https://feinterview.poetries.top/blog/react-18-new-features) 里详细写过。

**多了几个专门用途的 Hook。** `useSyncExternalStore` 给状态库作者订阅外部数据源用，解决并发渲染下的数据撕裂；`useId` 生成服务端客户端一致的 ID，专治表单关联属性的 hydration 不匹配；`useTransition` 和 `useDeferredValue` 用来把不紧急的更新降级，避免输入框卡顿。这三个业务代码里 `useId` 和 `useTransition` 用得上，`useSyncExternalStore` 基本只有写库才会碰。

**React 19 又加了一批。** `use` 可以在渲染中直接读 Promise 和 Context，而且它是唯一允许写在条件分支里的；`useOptimistic` 做乐观更新；`useActionState` 配合 Actions 处理表单提交的 pending 和 error 状态。同时 `forwardRef` 不再必要，`ref` 可以当普通 prop 传。这些我单独写在 [React 19 新特性](https://feinterview.poetries.top/blog/react-19-new-features)。

**React Compiler 在推进中。** 它的目标是自动完成 `useMemo` / `useCallback` / `memo` 这类记忆化，让业务代码不用再手写。这块我只在 demo 里试过，没在生产项目上跑，具体的适用范围和限制建议直接看官方文档，别听二手结论。

原文里的写法全部还有效，上面这些是补充，不是替代。

## 总结

Hooks 解决的不是「代码少几行」，是「同一件事的逻辑能写在一起」。class 时代订阅和退订被生命周期强行分在两处，Hooks 让它们变成一个 effect 加一个返回的清理函数，中间隔零行。

四个核心 Hook 各有各的坑。`useState` 的 setter 不做浅合并，连续更新同一状态必须用函数式写法，昂贵的初始值要传函数进去；`useContext` 的 value 是对象字面量时每次渲染都是新引用，要用 `useMemo` 稳住，而且订阅粒度是整个 value，按变更频率拆多个 Context 比塞一个大对象强；`useReducer` 适合状态字段有联动、更新逻辑复杂、需要单独测试这三种情况，`dispatch` 引用稳定这点顺带解决了子组件 memo 失效的问题；`useEffect` 最容易出事的是没写清理函数，请求竞态和监听器泄漏这两类问题在本地几乎复现不出来，上线才暴露。

依赖数组是用 `Object.is` 逐项比的，别往里塞对象字面量和内联函数。`eslint-plugin-react-hooks` 能自动兜住调用位置和依赖遗漏这两类错误，别关它。

原文写于 2019 年，六年过去这些写法一条都没被废弃。变化的是周围：严格模式会让开发环境的 effect 执行两次，逼你把清理函数写全；React 18 和 19 又补了 `useSyncExternalStore`、`useId`、`useTransition`、`use`、`useOptimistic` 这一批各有专门用途的 Hook。基础的四个还是这四个。

## 参考

- [Hooks 索引 - React 官方文档](https://react.dev/reference/react/hooks)
- [Synchronizing with Effects - React 官方文档](https://react.dev/learn/synchronizing-with-effects)
- [You Might Not Need an Effect - React 官方文档](https://react.dev/learn/you-might-not-need-an-effect)
- [Rules of Hooks - React 官方文档](https://react.dev/reference/rules/rules-of-hooks)
- [useReducer - React 官方文档](https://react.dev/reference/react/useReducer)
- [React v19 发布公告](https://react.dev/blog/2024/12/05/react-19)
- [前端进阶之旅](https://interview.poetries.top)
