---
title: React 新特性详解，memo、lazy、Suspense 与 Hooks
date: 2019-09-02 17:20:12
description: React 16 那一批新特性的完整梳理，包含 React.memo 的比较函数语义、React.lazy 做代码分割的边界、Suspense 解决异步副作用的思路，以及这些能力在今天的落地状态。
tags:
   - React
   - memo|suspense|lazy
   - Hooks
   - 代码分割
categories: Front-End
---

有个显示时间的组件每秒 setState 一次，里面套着的子组件明明什么都没变，控制台里 `I am rendering` 还是一秒打一次。这类问题在 React 16 之前只能把子组件改写成 class 再继承 `PureComponent`，一个纯展示的函数组件被迫升级成类，代码一下子胖了一圈。

`React.memo` 就是来解决这个的。这篇把 React 16 那一批新特性串起来讲一遍，重点在 memo、lazy、Suspense 三个，把它们各自解决什么问题、边界在哪、以及今天在 React 19 上是什么状态说清楚。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- React 16 带来了哪些结构性变化，各自解决什么问题
- `React.memo` 怎么用，第二个比较函数的返回值语义为什么容易搞反
- `React.lazy` 做代码分割的完整链路，以及模块必须默认导出这个硬要求
- `Suspense` 当年的设想是什么，今天真正落地成了什么
- Hooks 在这套演进里处于什么位置
- 这些 API 在 React 19 上还有哪些变化

react 16 给我们带来的一系列重要变化：

- `render`/纯组件能够 `return` 任何数据结构，以及 `createPortal` API
- 新的 `context api`，尝试代替一部分 `redux` 的职责
- `babel` 的 `<>` 操作符，方便用户返回数组
- 异步渲染/时间切片(time slicing)，成倍提高性能
- `componentDidCatch`，错误边界，框架层面上提高用户 `debug` 的能力
- 未来的 `Suspense`，优雅处理异步副作用
- 未来的 `hooks`

这份清单是当年写的，现在回头看，除了「时间切片」那条的描述偏乐观（它最后落地成了 React 18 的并发渲染，收益取决于场景，不是无脑提速），其余几条基本都兑现了。`createPortal` 成了 Modal、Tooltip 这类组件的标准做法；`React.createContext` 确实吃掉了一部分轻量全局状态的场景；错误边界现在还多了一个 `static getDerivedStateFromError` 配套。

下面挑三个最常被问到的展开。

## 一、memo

`React v16.6.0` 出了一些新的包装函数(wrapped functions)，其中一种是用于函数组件的、相当于 `PureComponent` / `shouldComponentUpdate` 形式的 `React.memo()`。

`React.memo()` 是一个高阶函数，它与 `React.PureComponent` 类似，但作用对象是函数组件而不是类。

先看问题本身。现在有一个显示时间的组件，每一秒都会重新渲染一次，对于 `Child` 组件我们肯定不希望也跟着渲染：

```js
import React  from 'react';

export default class extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            date : new Date()
        }
    }

    componentDidMount(){
        setInterval(()=>{
            this.setState({
                date:new Date()
            })
        },1000)
    }

    render(){
        return (
            <div>
                <Child seconds={1}/>
                <div>{this.state.date.toString()}</div>
            </div>
        )
    }
}
```

React 的默认行为是父组件重渲染，整棵子树跟着重渲染，不管子组件的 props 有没有变。所以这里 `Child` 每秒都会被调用一次，哪怕 `seconds` 一直是 `1`。

在 16.6 之前，唯一的办法是把它写成类：

```js
class Child extends React.PureComponent {
    render(){
        console.log('I am rendering');
        return (
            <div>I am update every {this.props.seconds} seconds</div>
        )
    }
}
```

`React.memo()` 让我们不必为了跳过渲染而放弃函数组件：

```js
function Child({seconds}){
    console.log('I am rendering');
    return (
        <div>I am update every {seconds} seconds</div>
    )
};
export default React.memo(Child)
```

### 1.1 第二个参数的语义

`React.memo()` 可接受 2 个参数，第一个是函数组件，第二个用于对比 props 控制是否刷新：

```js
import React from "react";

function Child({seconds}){
    console.log('I am rendering');
    return (
        <div>I am update every {seconds} seconds</div>
    )
};

function areEqual(prevProps, nextProps) {
    if(prevProps.seconds===nextProps.seconds){
        return true
    }else {
        return false
    }

}
export default React.memo(Child,areEqual)
```

这里有个坑要注意。原文说这个参数「与 `shouldComponentUpdate()` 功能类似」，功能上确实是一回事，但**返回值的语义是反的**：`areEqual` 返回 `true` 表示两次 props 相等、跳过渲染，而 `shouldComponentUpdate` 返回 `true` 表示需要更新、执行渲染。

我一开始也是照着 `shouldComponentUpdate` 的直觉写的，结果写出来的组件一次都不更新，盯着看了半天才反应过来是把布尔值写反了。判断方法很简单，看函数名，它叫 `areEqual` 而不是 `shouldUpdate`。

### 1.2 memo 的默认比较是浅比较

不传第二个参数时，`React.memo` 对 props 做的是浅比较，也就是逐个 key 用 `Object.is` 比。那结果就是下面这种写法，memo 完全不生效：

```jsx
<Child config={{ size: 'large' }} onClick={() => doSomething()} />
```

对象字面量和箭头函数每次渲染都是新引用，浅比较必然不等。想让 memo 真正起作用，父组件那边得配合 `useMemo` 稳住对象、`useCallback` 稳住函数。

所以 memo 不是加上就有效的开关，它是一条需要父子两端配合的约定。

这也是为什么我不建议无脑给所有组件套 memo。比较本身有成本，一个渲染开销很小的叶子组件，套上 memo 之后大概率是负优化，还多了一层心智负担。我的判断标准是：这个组件的渲染成本明显（长列表项、图表、富文本），并且它的 props 在父组件频繁更新时确实是稳定的，两个条件同时成立才加。

顺带提一句，React 团队在推进 React Compiler，目标就是自动完成这类记忆化，落地之后手写 memo 的必要性会下降。具体的版本节奏和适用范围建议直接看官方文档，我这边只在 demo 项目里试过，没在生产上跑过。

## 二、lazy

`React.lazy` 用于做 `Code-Splitting`，代码拆分。类似于按需加载，渲染的时候才加载代码：

```js
import React, {lazy} from 'react';
const OtherComponent = lazy(() => import('./OtherComponent'));

function MyComponent() {
  return (
    <div>
      <OtherComponent />
    </div>
  );
}
```

`lazy(() => import('./OtherComponent'))` 使用 `es6` 的 `import()` 返回一个 promise，类似于：

```js
lazy(() => new Promise(resolve =>
  setTimeout(() =>
    resolve(
      // 模拟ES Module
      {
        // 模拟export default
        default: function render() {
          return <div>Other Component</div>
        }
      }
    ),
    3000
  )
));
```

这段模拟代码其实把 `React.lazy` 的契约写得很清楚了：它要的是一个返回 Promise 的函数，Promise resolve 出来的对象必须有 `default` 字段。

所以有个硬要求，被 lazy 加载的模块必须有默认导出。只用具名导出的模块直接 lazy 会拿到 `undefined`，报的错还挺不直观。绕法是包一层：

```js
const OtherComponent = lazy(() =>
  import('./components').then(module => ({ default: module.OtherComponent }))
);
```

还有一点要说在前面，`import()` 的路径不能是完全动态拼出来的字符串。打包器需要在构建期静态分析出可能的模块，才能切出对应的 chunk。`import('./pages/' + name)` 这种写法在 webpack 下会把整个 `pages` 目录都打进去，在 Vite 下则需要走 `import.meta.glob`。这个我踩过，页面越加越多之后发现「按需加载」的 chunk 里塞满了根本没用到的路由。

### 2.1 lazy 需要 Suspense 兜底

组件还没加载完的这段时间，页面上得有个东西顶着，这就要引出 `Suspense`：

```js
const OtherComponent = React.lazy(() => import('./OtherComponent'));

function MyComponent() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <OtherComponent />
      </Suspense>
    </div>
  );
}
```

- 在我们的业务场景中，`OtherComponent` 可以代表多个条件渲染组件，我们全部加载完成才取消 `loading`
- 只要 `promise` 没执行到 `resolve`，`suspense` 都会返回 `fallback` 中的 `loading`
- 代码简洁，`loading` 可提升至祖先组件，易聚合，相当优雅地解决了条件渲染

`fallback` 的粒度值得琢磨一下。放在整个页面外层，用户看到的是整页 loading，体验最差但代码最简单；放在每个懒加载块外层，页面骨架先出来、内容逐块补齐，体验最好但要处理布局跳动。我一般的做法是按视觉分区放，`fallback` 用和真实内容等高的骨架屏，避免内容加载完之后页面往下窜。

网络失败的情况 `Suspense` 是不管的，`import()` 的 Promise reject 之后需要错误边界来接。所以完整的写法通常是 `ErrorBoundary` 包 `Suspense` 包 `lazy` 组件，三层。部署了新版本导致旧 chunk 404 是线上最常见的触发场景，错误边界里做一次 `location.reload()` 是很多团队的兜底方案。

## 三、suspense

`Suspense` 主要解决的就是网络 `IO` 问题。网络 `IO` 问题其实就是我们现在用 `Redux+saga` 等等一系列库来解决的「副作用」问题。

调用 `render` 函数 -> 发现有异步请求 -> 悬停，等待异步请求结果 -> 再渲染展示数据

- 引入新的 `api`，可以使得任何 `state` 更新暂停，直到条件满足时，再渲染（像 `async/await`）
- 在网速非常快的时候，可设置，整个数据到达 `Dom`，更新完毕以后再渲染
- 在网速非常慢的时候，可设置，精确到单个组件的等待、以及更新，然后再渲染
- 会给我们提供 `high-level` 和 `low-level` 的 API，可以供给业务代码和一些小组件的书写

这段是 2019 年写的，当时 `Suspense` 的数据获取能力还只是官方在会议上演示过的实验特性，`createFetcher`、`Placeholder` 这些名字后来都没有以原样落地。我保留原文的描述，是因为它把设计意图讲得很清楚：把「加载中」这件事从组件内部的 `if (loading) return <Spinner />` 提升成一种可以由父级统一编排的渲染状态。

### 3.1 这几年它实际落成了什么

真正兑现是分两步走的。

React 18 把 `Suspense` 带到了服务端，`renderToPipeableStream` 配合 `Suspense` 边界实现流式 SSR，页面可以先发外壳、数据好一块补一块，同时支持选择性 hydration。这部分我在 [React 18 新特性与升级指南](https://feinterview.poetries.top/blog/react-18-new-features) 里展开写过。

React 19 补上了另一半，`use` 这个 API 可以在渲染中直接读取 Promise，配合外层的 `Suspense` 就是原文设想的那种「组件里直接写取数、加载态交给父级」的写法。同时 Actions 和 `useActionState` 把表单提交的 pending 状态也纳入了同一套模型。具体用法我写在 [React 19 新特性](https://feinterview.poetries.top/blog/react-19-new-features) 里。

有一条要提醒。`use` 读的 Promise 必须来自有缓存的数据源，在组件里现场 `fetch` 出来的 Promise 每次渲染都是新的，会陷入死循环。实践中一般交给框架的取数层或者 React Query 这类库来托管缓存，而不是自己裸写。

从 2019 年那个设想到今天，中间隔了五年多，这个我一开始也没想到会拖这么久。

## 四、hooks

`Hooks` 的目的，简而言之就是让开发者不需要再用 class 来实现组件。

`hooks` 常用 `api` 有：`useState`、`useEffect`、`useContext`、`useReducer`、`useRef` 等。

把 Hooks 和上面三个特性放在一起看，会发现它们指向的是同一件事：让函数组件具备 class 组件的全部能力，然后把 class 这个包袱扔掉。`React.memo` 补齐了 `PureComponent`，`useState` / `useReducer` 补齐了 state，`useEffect` 补齐了生命周期，`useRef` 补齐了实例变量。到 React 19，函数组件甚至不再需要 `forwardRef`，`ref` 可以像普通 prop 一样传。

Hooks 的具体用法和每个 API 的边界，我单独写了一篇 [React 之 Hooks](https://feinterview.poetries.top/blog/react-hooks)，这里就不重复了。

## 总结

React 16 这一批特性，回头看是一条很清晰的主线：把函数组件补全，然后把异步和加载状态变成框架层面的能力。

`React.memo` 是给函数组件的跳过渲染开关，用之前要记住两件事，第二个参数叫 `areEqual`，返回 `true` 是跳过渲染，和 `shouldComponentUpdate` 反着来；默认的浅比较需要父组件用 `useMemo` / `useCallback` 配合才有意义，单独加一个 memo 大概率白加。

`React.lazy` 的契约是「返回 Promise 且 resolve 出带 default 的对象」，只有具名导出的模块要手动包一层。它必须配 `Suspense` 用，还得配错误边界处理 chunk 加载失败，线上发版之后旧 chunk 404 是最常见的触发场景。

`Suspense` 在 2019 年只是个设想，今天已经分两步落地了，React 18 给了流式 SSR 和选择性 hydration，React 19 给了 `use`。原文里 `createFetcher`、`Placeholder` 这些名字最终没有出现，我保留了原描述但标注了实际情况。

至于 Hooks，它是这条主线的终点，class 组件到今天还能跑，但新代码基本没有理由再写。

## 参考

- [memo - React 官方文档](https://react.dev/reference/react/memo)
- [lazy - React 官方文档](https://react.dev/reference/react/lazy)
- [Suspense - React 官方文档](https://react.dev/reference/react/Suspense)
- [use - React 官方文档](https://react.dev/reference/react/use)
- [createPortal - React 官方文档](https://react.dev/reference/react-dom/createPortal)
- [React v16.6.0 发布日志](https://github.com/facebook/react/blob/main/CHANGELOG.md)
- [前端进阶之旅](https://interview.poetries.top)
