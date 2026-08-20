---
title: React setState 原理分析，批量更新与状态队列的完整链路
date: 2018-12-21 00:00:24
description: 从 setState 为什么读不到最新值讲到状态队列合并、isBatchingUpdates 开关和事务机制，并补上 React 18 自动批处理带来的行为变化，把批量更新这条链路一次讲透。
tags:
  - React
  - Javascript
  - setState
  - 批量更新
categories: Front-End
---

`this.setState({ count: 1 })` 写完，下一行 `console.log(this.state.count)` 打出来还是 0。这大概是每个人学 React 都会撞一次的墙。更让人迷糊的是，把同样两行代码挪进 `setTimeout` 里，它又「正常」了，打出来就是 1。

同一个 API，位置一换行为就变，这背后不是玄学，是一个叫批量更新的机制在起作用，而开关的开合时机跟 React 能不能感知到当前的执行栈直接相关。这篇把这条链路从头捋一遍：状态队列是怎么合并的、`isBatchingUpdates` 这个开关谁来开谁来关、事务机制在里面扮演什么角色。文末还要补一条很重要的时效性说明，因为这套规则在 React 18 之后变了。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- setState 为什么读不到最新值，「异步」这个说法准确在哪不准确在哪
- 状态队列的合并规则，以及直接改 `this.state` 为什么会丢状态
- `isBatchingUpdates` 开关由谁打开、由谁关闭
- 事务（Transaction）机制和 setState 表现差异的对应关系
- 在 `shouldComponentUpdate` 里调 setState 为什么会把浏览器打崩
- React 18 自动批处理之后，这套规则改了哪一半、留了哪一半

## 一、setState 的「异步」到底指什么

我们都知道，React 通过 `this.state` 来访问 state，通过 `this.setState()` 方法来更新 state。当 `this.setState()` 方法被调用的时候，React 会重新调用 `render` 方法来重新渲染 UI。

首先，如果直接在 `setState` 后面获取 state 的值是获取不到的。在 React 内部机制能检测到的地方，`setState` 就是异步的；在 React 检测不到的地方，例如 `setInterval`、`setTimeout`，`setState` 就是同步更新的。

![setState 调用后立即读取 state 拿到的仍是旧值](https://s.poetries.top/gitee/2019/10/431.png)

这里的「异步」其实是个有点误导的词。`setState` 内部没有用到任何异步 API，没有 Promise，没有定时器，它自始至终都是同步执行的函数调用。真正发生的事情是：`setState` 只把这次要改的内容塞进一个队列，然后就返回了，真正的合并和渲染被推迟到当前这一批同步代码跑完之后。

所以更准确的说法是「延迟合并」，而不是「异步」。

因为 `setState` 是可以接受两个参数的，一个 state，一个回调函数，所以我们可以在回调函数里面拿到更新后的值。

![在 setState 的第二个参数回调里读取到更新后的 state](https://s.poetries.top/gitee/2019/10/432.png)

把这个机制展开说：`setState` 方法通过一个队列机制实现 state 更新，当执行 `setState` 的时候，会将需要更新的 state 合并之后放入状态队列，而不会立即更新 `this.state`。

由此还能推出两条实用结论。

如果我们不使用 `setState` 而是使用 `this.state.key` 来直接修改，将不会触发组件的 re-render。

如果将 `this.state` 赋值给一个新的对象引用，那么其他不在这个对象上的 state 将不会被放入状态队列中，当下次调用 `setState` 并对状态队列进行合并时，直接造成了 state 丢失。

第二条我踩过。当时想「批量重置一堆字段」，图省事写了个 `this.state = { ...defaults }`，结果表现是有几个字段时好时坏，排查了一下午才发现是这行。

### 1.1 setState 批量更新的过程

在 React 生命周期和合成事件执行前后都有相应的钩子，分别是 `pre` 钩子和 `post` 钩子。`pre` 钩子会调用 `batchedUpdate` 方法将 `isBatchingUpdates` 变量置为 `true`，开启批量更新；而 `post` 钩子会将 `isBatchingUpdates` 置为 `false`。

![isBatchingUpdates 开关控制 setState 走批量分支还是立即更新分支](https://s.poetries.top/gitee/2019/10/434.png)

链路是这样跑的。`isBatchingUpdates` 变量置为 `true`，则会走批量更新分支，`setState` 的更新会被存入队列中，待同步代码执行完后，再执行队列中的 state 更新。`isBatchingUpdates` 为 `true`，则把当前组件（即调用了 `setState` 的组件）放入 `dirtyComponents` 数组中；否则 `batchUpdate` 所有队列中的更新。

而在原生事件和异步操作中，不会执行 `pre` 钩子；或者生命周期中的异步操作之前执行了 `pre` 钩子，但是 `post` 钩子也在异步操作之前执行完了，`isBatchingUpdates` 必定为 `false`，也就不会进行批量更新。

`enqueueUpdate` 包含了 React 避免重复 render 的逻辑。`mountComponent` 和 `updateComponent` 方法在执行的最开始，会调用到 `batchedUpdates` 进行批处理更新，此时会将 `isBatchingUpdates` 设置为 `true`，也就是将状态标记为现在正处于更新阶段了。

把这段话翻译成一句人话：React 只有在「知道自己正在执行」的时候才会攒批。

合成事件的回调是 React 自己调起来的，它在调用前后加了钩子，所以它知道；生命周期钩子也是 React 自己调的，它也知道。但 `setTimeout` 的回调是浏览器直接调起来的，`addEventListener` 绑的原生事件回调也是浏览器直接调起来的，这两种情况 React 完全在状态之外，`isBatchingUpdates` 停在 `false` 上，每次 `setState` 就只能立刻走一遍更新流程。

### 1.2 为什么直接修改 this.state 无效

要知道 `setState` 是通过一个队列机制实现 state 更新的。执行 `setState` 时，会将需要更新的 state 合并后放入状态队列，而不会立刻更新 state，队列机制可以批量更新 state。

如果不通过 `setState` 而直接修改 `this.state`，那么这个 state 不会放入状态队列中。下次调用 `setState` 对状态队列进行合并时，会忽略之前直接被修改的 state，这样我们就无法合并了，而且实际也没有把你想要的 state 更新上去。

这里再补一个更隐蔽的坑。直接改 `this.state` 不只是「不触发渲染」这么简单，它还会让 `shouldComponentUpdate` 里的新旧对比失效。因为你改的就是那个对象本身，`nextState` 和 `this.state` 指向同一个引用，你写的 `nextState.list !== this.state.list` 永远是 `false`，组件从此再也不更新。

把 state 当成不可变数据，这条纪律不是洁癖，是这套机制的前提条件。

### 1.3 什么是批量更新 Batch Update

在一些 mv* 框架中，批量更新就是将一段时间内对 model 的修改批量更新到 view 的机制，比如前端比较火的 React、Vue（`nextTick` 机制，视图的更新以及实现）。

Vue 的 `nextTick` 是靠微任务实现的，把这一轮同步代码里所有的数据变更攒到微任务里一次性 flush；React 16 这套是靠事务的 `pre`/`post` 钩子划出一段执行区间，区间内攒批、区间结束 flush。手段不同，要解决的问题是一模一样的：不要让一次交互引发 N 次渲染。

### 1.4 setState 之后发生的事情

`setState` 操作并不保证是同步的，也可以认为是异步的。

React 在 `setState` 之后，会对 state 进行 diff 判断是否有改变，然后去 diff DOM 决定是否要更新 UI。如果这一系列过程立刻发生在每一个 `setState` 之后，就可能会有性能问题。

在短时间内频繁 `setState` 时，React 会将 state 的改变压入队列中，在合适的时机批量更新 state 和视图，达到提高性能的效果。

举个具体的场景就懂了。一次点击里你连着改了 loading、list、total 三个 state，如果不攒批，就是三次完整的 render 加三次 DOM diff；攒批之后是一次。这个收益在列表页上非常直观。

### 1.5 如何知道 state 已经被更新

传入回调函数：

```js
this.setState({
    index: 1
}, function () {
    console.log(this.state.index);
});
```

或者在钩子函数中体现：

```js
componentDidUpdate() {
    console.log(this.state.index);
}
```

两者的区别在于触发时机和触发范围。`setState` 的第二个参数只在这一次 `setState` 完成后调一次，适合做「这次改完之后要干的事」；`componentDidUpdate` 是这个组件任何一次更新后都会调，包括父组件重传 props 引起的更新，所以在里面直接 `setState` 一定要加条件判断，不然就是死循环。

## 二、setState 的循环调用风险

当调用 `setState` 时，实际上会执行 `enqueueSetState` 方法，并对 `partialState` 以及 `_pendingStateQueue` 更新队列进行合并操作，最终通过 `enqueueUpdate` 执行 state 更新。

而 `performUpdateIfNecessary` 方法会获取 `_pendingElement`、`_pendingStateQueue`、`_pendingForceUpdate`，并调用 `receiveComponent` 和 `updateComponent` 方法进行组件更新。

如果在 `shouldComponentUpdate` 或者 `componentWillUpdate` 方法中调用 `setState`，此时 `this._pendingStateQueue != null`，就会造成循环调用，使得浏览器内存占满后崩溃。

这个死循环长什么样，顺着推一遍就清楚了：`setState` 触发更新流程，更新流程走到 `shouldComponentUpdate`，你在里面又 `setState`，队列又变成非空，更新流程再走一遍，再进 `shouldComponentUpdate`。中间没有任何一个环节能让它停下来，浏览器 Tab 直接白屏。

所以有条纪律要记牢：`render` 之前的钩子里一律不要写 `setState`。

`componentDidUpdate` 里可以写，但必须带条件，比如 `if (prevProps.id !== this.props.id)`。这个条件保证了它最终会收敛。这条纪律和 Fiber 架构对 render 阶段「必须是纯函数」的要求其实是同一件事的两种说法，具体推导可以看 [React Fiber 架构原理](https://feinterview.poetries.top/blog/react-fiber)。

## 三、事务机制

事务就是将需要执行的方法使用 wrapper 封装起来，再通过事务提供的 `perform` 方法执行。先执行 wrapper 中的 `initialize` 方法，执行完 `perform` 之后，再执行所有的 `close` 方法，一组 `initialize` 及 `close` 方法称为一个 wrapper。

那么事务和 `setState` 方法的不同表现有什么关系？

首先我们把四次 `setState` 简单归类，前两次属于一类，因为它们在同一调用栈中执行；`setTimeout` 中的两次 `setState` 属于另一类。

在 `componentDidMount` 里的 `setState` 调用之前，代码已经处在 `batchedUpdates` 执行的事务中了。那么这次 `batchedUpdates` 方法是谁调用的呢？原来是 `ReactMount.js` 中的 `_renderNewRootComponent` 方法。也就是说，整个将 React 组件渲染到 DOM 中的过程就是处于一个大的事务中。而在 `componentDidMount` 中调用 `setState` 时，`batchingStrategy` 的 `isBatchingUpdates` 已经被设为了 `true`，所以两次 `setState` 的结果没有立即生效。

再反观 `setTimeout` 中的两次 `setState`，因为没有前置的 `batchedUpdates` 调用，所以导致了新的 state 马上生效。

事务这个抽象在 React 15、16 的源码里用得非常多，除了批量更新，还有 DOM 操作前后的选区恢复、事件系统的状态保存，都是靠它。你可以把它理解成 AOP 里的环绕通知：在一段代码前后各插一段固定的动作，而中间那段代码本身不需要知道自己被包起来了。

`setState` 表现的差异，说到底就是「你的代码有没有落在这个 wrapper 里面」。落在里面就攒批，落在外面就立刻执行。

## 四、React 18 之后这套规则变了

上面讲的全部是 React 16 时代的行为，这篇写于 2018 年，那时候这么理解没问题。但这套规则从 React 18 开始改了一半，如果你现在还按老规则去答面试题，是会答错的。

React 18 引入了自动批处理（Automatic Batching）。只要你用 `ReactDOM.createRoot` 创建应用，那么无论 `setState` 是写在 React 合成事件里、原生事件监听里、`setTimeout` 里，还是 `fetch().then()` 里，多次更新都会被合并成一次渲染。

所以原文里那句「在 `setInterval`、`setTimeout` 里 `setState` 就是同步更新的」，在 React 18 的 `createRoot` 模式下已经不成立了。

需要说清楚的是，改的是「哪些场景会攒批」，没改的是「攒批之后你还是读不到最新的 `this.state`」。后面这条永远成立，因为它是延迟合并这个设计本身决定的，跟批处理的覆盖范围无关。

那反过来，如果我就是需要某一次更新立刻同步刷到 DOM 上怎么办？React 提供了 `flushSync`，把 `setState` 包进去就能强制退出批处理。这个 API 的典型用途是「改完 state 立刻要读 DOM 的真实尺寸」，比如改完列表内容马上要算滚动位置。用它的代价是这次更新拿不到批处理的性能收益，别当常规写法用。

还有一层变化是写法本身。类组件的 `this.setState` 在函数组件里对应的是 `useState` 的 setter，它同样遵守上面所有批处理规则，同样读不到最新值，而且它没有第二个回调参数，想在更新后做事得靠 `useEffect`。这套对照关系我在 [React Hooks 详解](https://feinterview.poetries.top/blog/react-hooks) 里写过。至于 React 18 这批变化的全貌，包括 `createRoot` 迁移和严格模式的二次挂载，可以看 [React 18 新特性与升级指南](https://feinterview.poetries.top/blog/react-18-new-features)。

有一点我得如实说：`flushSync` 在嵌套调用和 `Suspense` 边界内的具体行为，我只在 demo 里试过几种情况，没在复杂生产场景验证过，边界情况以官方文档为准。

## 总结

通过 `setState` 去更新 `this.state`，不要直接操作 `this.state`，请把它当成不可变的。这不只是风格问题，直接改会让状态队列合并时丢数据，也会让 `shouldComponentUpdate` 的引用对比彻底失效。

调用 `setState` 更新 `this.state` 不是马上生效的，所以不要以为执行完 `setState` 后 `this.state` 就是最新的值了。要拿更新后的值，用第二个回调参数，或者去 `componentDidUpdate` 里读。

多个顺序执行的 `setState` 不是一个一个同步执行的，它们会一个一个加入队列，最后一起执行，也就是批处理。这个机制的开关是 `isBatchingUpdates`，由事务的 `pre`/`post` 钩子控制，React 只在自己能感知到执行栈的区间里开着它。

最后把时效性这条再强调一遍：React 16 的规律是「合成事件和生命周期里攒批，原生事件和定时器里不攒批」；React 18 用 `createRoot` 之后，所有场景都攒批。「读不到最新值」这条两个版本都成立，别把它和批处理范围混为一谈。

## 参考

- [Automatic batching for fewer renders in React 18](https://github.com/reactwg/react-18/discussions/21)
- [React v18.0 发布公告](https://react.dev/blog/2022/03/29/react-v18)
- [flushSync - React 官方文档](https://react.dev/reference/react-dom/flushSync)
- [Queueing a Series of State Updates - React 官方文档](https://react.dev/learn/queueing-a-series-of-state-updates)
- [前端进阶之旅](https://interview.poetries.top)
