---
title: React性能优化总结，从render机制到memo的落地实践
date: 2018-11-18 20:31:43
description: React 性能优化的完整思路，讲清 render 与虚拟 DOM 对比的真实开销、shouldComponentUpdate 的判断边界、拖慢 diff 的常见写法，以及从 Perf 到 DevTools Profiler 的检测方法。
tags: 
  - React
  - 性能优化
  - shouldComponentUpdate
  - 虚拟DOM
  - React Profiler
categories: Front-End
---

一个后台列表页，点一下筛选条件，整页卡半秒。打开 DevTools 一看，JS 执行占了大头，而页面上真正变的只有表格那一块。这种情况我见过不止一次，原因几乎都一样：React 默认把根节点往下的所有组件的 `render` 都跑了一遍，只是最后 diff 发现大部分没变，白跑。

这篇把 React 性能优化的链路拆开讲。先弄明白 render 在做什么、浪费产生在哪一步，再讲 `shouldComponentUpdate` 这个闸门怎么开合，顺带把那些悄悄加重 diff 负担的写法列一遍，最后是检测工具。读完你至少能定位到「是哪个组件在白跑」，而不是凭感觉四处加优化。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 初始化渲染和更新渲染的区别，浪费到底浪费在哪
- 更新阶段的生命周期各自能做什么
- `shouldComponentUpdate` 的职责边界和浅比较的坑
- 哪些写法会让 diff 变慢
- 从 `React.addons.Perf` 到 DevTools Profiler 的检测方法
- 函数组件时代的 `memo` / `useMemo` / `useCallback`

## 一、重新认识 render

`react` 的组件渲染分为初始化渲染和更新渲染，这两种情况下 render 的行为不一样，优化空间也完全不同。

先看初始化。在初始化渲染的时候会调用根组件下的所有组件的 `render` 方法进行渲染，下图里绿色表示已渲染的组件。

![React 初始化渲染时整棵组件树都会执行 render](https://s.poetries.top/gitee/2019/10/420.png)

这一层是没有问题的。页面上什么都还没有，每个组件都得跑一次 render 才能产出内容，这部分开销是必需的，没有优化余地。

真正的问题出在更新。假设我们要更新某个子组件，就是下图里那个绿色组件，从根组件传递下来应用在它上面的数据发生了改变。

![更新时只有一个子组件的数据发生了变化](https://s.poetries.top/gitee/2019/10/421.png)

这张图要看清楚的是变化的范围：数据从根组件流下来，但只有最底下那一个组件真的用到了变化后的值。其它分支的组件，props 和 state 都没动。

那我们的理想状态是什么？只调用关键路径上组件的 render。

![理想状态下只有关键路径上的组件重新 render](https://s.poetries.top/gitee/2019/10/422.png)

这条「关键路径」指的是从根组件到目标组件之间的那一条链，加上目标组件自己。旁边的兄弟分支应该原地不动。

但是 `react` 的默认做法是调用所有组件的 `render`，再对生成的虚拟 `DOM` 进行对比，如不变则不进行更新。这样的 `render` 和虚拟 `DOM` 的对比明显是在浪费，下图里黄色表示被浪费掉的 `render` 和虚拟 `DOM` 对比。

![黄色部分是被浪费掉的 render 和虚拟 DOM 对比](https://s.poetries.top/gitee/2019/10/423.png)

黄色越多，说明白跑的组件越多。这里容易记混的一点是，黄色部分并不会产生真实 DOM 操作，React 最后 diff 出来没变化就不会碰 DOM。被浪费的是 JS 执行时间和临时对象的内存分配，不是重排重绘。所以你在 Performance 面板里看到的是一根长长的 Scripting 条，而不是 Rendering 变红。

**Tips**

- 拆分组件是有利于复用和组件优化的
- 生成虚拟 `DOM` 并进行比对发生在 `render()` 后，而不是 `render()` 前

第二条我建议单独记一下，面试问得很多。顺序是：`shouldComponentUpdate` 返回 true → 执行 `render()` → 拿到新的 vnode → 和旧 vnode 做 diff → 决定要不要动真实 DOM。所以 `shouldComponentUpdate` 拦得住的是 render 和 diff 两步，它是整条链上最早的那道闸门，这也是它值钱的原因。

## 二、更新阶段的生命周期

想在合适的时机做拦截，先得知道更新阶段一共有哪几个口子可以下手。

- `componentWillReceiveProps(object nextProps)`：当挂载的组件接收到新的 `props` 时被调用。此方法应该被用于比较 `this.props` 和 `nextProps` 以用于使用 `this.setState()` 执行状态转换。组件内部数据有变化用 `state`，但是在更新阶段又要在 `props` 改变的时候改变 `state`，那就写在这个生命周期里面
- `shouldComponentUpdate(object nextProps, object nextState)`：返回 `boolean`，当组件决定任何改变是否要更新到 `DOM` 时被调用。作为一个优化实现，比较 `this.props` 和 `nextProps`、`this.state` 和 `nextState`，如果 `React` 应该跳过更新，返回 `false`
- `componentWillUpdate(object nextProps, object nextState)`：在更新发生前被立即调用。你不能在此调用 `this.setState()`
- `componentDidUpdate(object prevProps, object prevState)`：在更新发生后被立即调用，可以在 `DOM` 更新完之后做一些收尾的工作

**Tips**

- `React` 的优化是基于 `shouldComponentUpdate` 的，该生命周期默认返回 `true`，所以一旦 `prop` 或 `state` 有任何变化，都会引起重新 `render`

这里补一句现在的情况。`componentWillReceiveProps` 和 `componentWillUpdate` 在 React 16.3 之后被标记为不安全，官方加了 `UNSAFE_` 前缀，原因是并发渲染下这几个「will」钩子可能被调用多次或者调用了却没有真的提交，写在里面的副作用会重复执行。替代方案是用静态方法 `getDerivedStateFromProps` 做 props 到 state 的派生，用 `getSnapshotBeforeUpdate` 在 DOM 变更前抓快照（比如记住滚动位置）。

`shouldComponentUpdate` 和 `componentDidUpdate` 这两个没有被废弃，今天照样能用。所以上面这套优化思路本身没过时，只是承载它的 API 换了两个。

## 三、shouldComponentUpdate

`react` 在每个组件生命周期更新的时候都会调用一个 `shouldComponentUpdate(nextProps, nextState)` 函数。它的职责就是返回 `true` 或 `false`，`true` 表示需要更新，`false` 表示不需要，默认返回为 `true`，即便你没有显式地定义 `shouldComponentUpdate` 函数。上面那些黄色的浪费，根源就在这个默认值上。

那直接给每个组件都加上一个浅比较的 `shouldComponentUpdate` 不就行了？

我一开始也是这么想的，后来发现这么干经常不生效，甚至会更慢。原因有两个。一是比较本身也要钱，如果你的 props 是个层级很深的大对象，做深比较的成本可能比重新 render 一次还高。二是浅比较对引用类型完全无效，父组件每次 render 都新建一个对象或者数组传下来，浅比较看到的永远是两个不同的引用，闸门等于没装。

`React.PureComponent` 就是官方版本的浅比较 `shouldComponentUpdate`，同样吃这个亏。它只帮你比一层，剩下的要靠你自己在数据结构上配合。

**带坑的写法**

- `{...this.props}`。不要滥用，请只传递 `component` 需要的 `props`，传得太多，或者层次传得太深，都会加重 `shouldComponentUpdate` 里面的数据比较负担，因此也请慎用 spread attributes（`<Component {...props} />`）
- `::this.handleChange()`。请将方法的 `bind` 一律置于 `constructor`
- 复杂的页面不要在一个组件里面写完
- 请尽量使用 `const element`
- `map` 里面添加 `key`，并且 `key` 不要使用 `index`（可变的）
- 尽量少用 `setTimeout` 或不可控的 `refs`、`DOM` 操作
- 数据尽可能简单明了，扁平化

这几条挨个说一下为什么。

spread attributes 的问题在于它把父组件所有的 props 一股脑摊给了子组件，子组件做浅比较时要遍历的键就变多了，而且父组件任何一个不相干的字段变了都会连累子组件更新。传参数就老老实实一个个写出来，多敲几个字换来的是可预测的更新范围。

`bind` 这条是引用相等的经典案例。写成 `onClick={this.handleChange.bind(this)}` 或者 `onClick={() => this.handleChange()}`，每次 render 都会生成一个新函数，传给子组件后浅比较必挂。把 `this.handleChange = this.handleChange.bind(this)` 放进 `constructor`，整个组件生命周期内这个引用就是稳定的。函数组件里对应的做法是 `useCallback`。

`key` 用 `index` 的坑是在列表中间插入或删除时暴露的。index 会随着位置变化而变化，React 按 key 匹配新旧节点，结果是把「插入一项」误判成「后面每一项的内容都变了」，diff 出一堆本不该有的更新，如果列表项里有输入框，光标和已输入内容还会串位。用数据自身的稳定 id 做 key 才对。

扁平化这条是给浅比较服务的。数据嵌套越浅，浅比较的判断就越准，也越不容易出现「明明改了却没重渲染」的诡异情况。

## 四、性能检测工具

**React.addons.Perf**

`react` 官方提供一个插件 `React.addons.Perf` 可以帮助我们分析组件的性能，以确定是否需要优化。

`react16` 以前需要在项目中配置，`react16` 以后请看这篇文章，直接打开控制台的 `perf` 选项测试 https://reactjs.org/docs/optimizing-performance.html#profiling-components-with-the-chrome-performance-tab

**react16 之前配置**

安装 `react` 性能检测工具 `npm i react-addons-perf --save`，然后在 `./app/index.js` 中：

```javascript
// 性能测试
import Perf from 'react-addons-perf'
if (__DEV__) {
    window.Perf = Perf
}
```

这段代码做的事很简单，把 Perf 挂到 `window` 上，方便你在控制台直接调，同时用 `__DEV__` 兜住，保证不会打进生产包。

打开 `console` 面板，先输入 `Perf.start()` 执行一些组件操作，引起数据变动、组件更新，然后输入 `Perf.stop()`。建议一次只执行一个操作，好进行分析。

再输入 `Perf.printInclusive` 查看所有涉及到的组件 `render`，如下图（官方图片）。

![Perf.printInclusive 列出本次操作中所有执行过 render 的组件](https://s.poetries.top/gitee/2019/10/424.png)

这张表看的是「谁跑了、跑了多久」，Inclusive 意思是包含子组件的耗时，所以越靠近根节点的组件数字越大，别被它吓到，要看的是同层之间的横向对比。

或者输入 `Perf.printWasted()` 查看下不需要的的浪费组件 `render`。

![Perf.printWasted 直接列出白跑的组件](https://s.poetries.top/gitee/2019/10/425.png)

`printWasted` 才是这套工具最值钱的地方，它直接告诉你哪些组件 render 完 diff 结果毫无变化，也就是第一节图里的那些黄色块。优化就从这张表最上面几行开始动手。

优化前：

![优化前 Perf 统计出大量浪费的 render](https://s.poetries.top/gitee/2019/10/426.png)

优化后：

![加上 shouldComponentUpdate 之后浪费的 render 明显减少](https://s.poetries.top/gitee/2019/10/427.png)

两张图对着看，重点不是总耗时那个数字，是浪费清单变短了。这说明闸门装对了地方。

`react-addons-perf` 在 React 16 里已经被移除，今天要做同样的事，装 React DevTools 用它的 Profiler 面板。录一段交互之后，火焰图会按 commit 展示每个组件这次渲染花了多久，灰色的表示本次没有渲染。它还有一个「Highlight updates when components render」的开关，打开之后页面上每次重渲染的组件会闪一圈边框，用来肉眼抓「不该动却动了」的区域特别快，比看数字直观。

浏览器侧的火焰图和渲染链路怎么读，我在 [前端页面性能优化实战](https://feinterview.poetries.top/blog/fe-youhua) 里单独讲过，两边配着看能把「JS 慢」和「渲染慢」分清楚。

## 五、函数组件时代，这套结论还成立吗

上面所有内容都是围绕 class 组件写的，现在项目基本都是函数组件加 Hooks，对应关系需要换一下。

`shouldComponentUpdate` 在函数组件里没有直接等价物，替代品是 `React.memo`。把组件包一层 `memo`，React 会对 props 做浅比较，props 没变就跳过这次渲染，行为跟 `PureComponent` 一致，也可以传第二个参数自定义比较函数。

配套的两个 Hook 解决的是「引用每次都变」这个老问题。`useCallback` 缓存函数引用，对应上面那条把 `bind` 放进 `constructor`；`useMemo` 缓存计算结果或者对象引用，对应「不要每次 render 都新建对象往下传」。这两个本身也有开销，给一个渲染很轻的组件套一堆 memo，收益可能是负的。

我自己的判断标准是：先用 Profiler 找出真的在白跑而且耗时明显的组件，再针对性地包，不做无差别覆盖。

再往后，React 19 这一代官方在推 React Compiler，思路是在编译期自动分析依赖并插入记忆化，理论上能省掉大部分手写的 `memo` / `useMemo` / `useCallback`。这块我只在小 demo 里试过，还没在真实项目里长期跑，具体行为和适配范围以官方文档为准。React 19 的整体变化可以看 [React 19 新特性](https://feinterview.poetries.top/blog/react-19-new-features)。

需要强调的是，工具再自动，第一节讲的那个原理也不会变：React 的更新是自上而下重跑 render 再 diff，优化的核心永远是让不该跑的组件不跑。理解这一点，换什么 API 都能自己推出来该怎么做。

## 总结

React 性能优化的落点其实只有一个，减少无意义的 render 和 diff。初始化渲染跑满整棵树是应该的，更新渲染跑满整棵树就是浪费，那些白跑的组件不会产生 DOM 操作，但会实实在在吃掉 JS 执行时间。

拦截点是 `shouldComponentUpdate`，它在 `render` 之前，能同时省掉 render 和 diff 两步。`PureComponent` 和 `React.memo` 是它的浅比较版本，好不好使取决于你传下去的 props 引用稳不稳定，所以 `bind` 放 constructor、别滥用 spread、数据结构扁平化这些写法不是洁癖，是让浅比较真的生效的前提。

`key` 别用 index 这条要单独记，它带来的不只是性能问题，还会让受控输入框串内容。

检测工具从 `React.addons.Perf` 换成了 React DevTools Profiler，`printWasted` 那个思路依然适用，先找白跑最多的组件，再决定包不包 memo。至于 React Compiler，方向是让编译器接管这件事，但原理该懂还得懂。

## 参考

- [React 官方文档 - Optimizing Performance](https://reactjs.org/docs/optimizing-performance.html#profiling-components-with-the-chrome-performance-tab)
- [React 官方文档 - shouldComponentUpdate](https://react.dev/reference/react/Component#shouldcomponentupdate)
- [React 官方文档 - memo](https://react.dev/reference/react/memo)
- [React 官方文档 - useCallback](https://react.dev/reference/react/useCallback)
- [React 官方博客 - Update on Async Rendering](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html)
- [前端进阶之旅](https://interview.poetries.top)
