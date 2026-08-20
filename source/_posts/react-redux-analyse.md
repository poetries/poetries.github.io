---
title: Redux 原理与三大原则，从设计理念到单向数据流
date: 2018-12-20 18:30:24
description: 拆解 Redux 的设计理念和三大原则，讲清楚单一数据源、状态只读、纯函数修改各自在解决什么问题，以及 store、action、reducer、middleware 的职责边界和 Redux Toolkit 时代的变化。
tags:
  - React
  - Javascript
  - Redux
  - 状态管理
categories: Front-End
---

带过一个中型后台项目，登录用户信息同时被顶栏、侧边菜单、表格里的操作列用到。最开始是父组件持有，往下一层层传 props；后来菜单被抽成独立路由，传不动了，改成挂在一个全局对象上，谁要谁读。跑了两个月，出现了一个谁都解释不了的 bug：用户切换角色之后，顶栏更新了，菜单没更新。查到最后发现有三个地方在改那个全局对象，谁最后写的谁说了算。

Redux 要解决的就是这类问题。它不是让状态管理变简单，恰恰相反，它是主动给状态修改加约束，用「难改一点」换「出了问题能查」。这篇不讲 API，只讲它为什么长这样，以及三大原则每一条在挡什么。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Redux 的核心设计理念，以及它和「全局对象」的根本区别
- 三大原则逐条拆：单一数据源、状态只读、纯函数修改各自在防什么
- 单向数据流跑一圈，`dispatch` 之后到底发生了什么
- store、action、reducer 各自的职责边界，越界了会怎样
- 中间件被插在这条流水线的哪个位置，为什么是那个位置
- 什么项目适合上 Redux，什么项目上了反而更乱
- Redux Toolkit 之后，这三条原则有没有变

## 一、Redux 的设计理念

一句话概括：Redux 把整个应用的状态存到一个地方，这个地方叫 store，里面保存着一棵状态树（store tree）。组件不直接通知其它组件，而是派发（dispatch）一个行为（action）给 store，组件内部通过订阅 store 里的 state 来刷新自己的视图。

![Redux 单向数据流示意图，展示组件派发 action 到 store 再回到视图的过程](https://s.poetries.top/gitee/2019/10/428.png)

图里最关键的是那个方向。数据只能顺着一个圈走，组件到 action，action 到 store，store 回到组件。中间不允许抄近路。

那它跟「挂一个全局对象大家共用」区别在哪？开头那个 bug 就是答案。全局对象允许任何代码在任何时刻直接赋值，出了问题你没法知道是谁改的、什么时候改的、改之前是什么值。Redux 把所有修改收窄到 `dispatch` 这一个入口，每一次修改都是一个有名有姓的 action 对象，前一刻的 state 和后一刻的 state 都能完整拿到。

这就是为什么 Redux DevTools 能做时间旅行。不是因为它有什么黑魔法，是因为整个模型里每一步都被记录下来了。

## 二、三大原则

官方把 Redux 的约束浓缩成三条。这三条不是并列的，是层层递进的，前一条不成立后一条就没意义。

### 2.1 唯一数据源

整个应用的 state 被存储到一棵状态树里面，并且这棵状态树只存在于唯一的 store 中。

这条最容易被误解成「所有数据都得放 Redux」。不是这个意思。它说的是，凡是你决定交给 Redux 管的状态，就只能有一份，不能一份在 store、一份在组件的 `this.state` 里各存各的。

为什么这条重要？因为状态一旦有两份副本，就必然有同步问题。开头那个菜单不更新的 bug，根子就在于用户信息实际存了两份，顶栏读的是 A，菜单读的是 B。单一数据源把「同步」这件事从代码里彻底删掉了，因为压根不存在第二份。

顺带一提，单一 store 不代表单个大对象平铺。实际项目里状态树是分层的，`combineReducers` 会把各个模块的 reducer 拼成一棵树，`state.user`、`state.order`、`state.settings` 各管一块，只是它们最终挂在同一个根上。

### 2.2 保持只读状态

state 是只读的，唯一改变 state 的方法就是触发 action，action 是一个用于描述已发生事件的普通对象。

注意「已发生事件」这个措辞，它不是随便写的。action 描述的是「发生了什么」，不是「要做什么」。这两者的区别在实践中很明显：`{ type: 'USER_LOGGED_IN', payload: user }` 是前者，`{ type: 'SET_USER', payload: user }` 是后者。前者告诉你业务上发生了一件事，后者只告诉你有人要改一个字段。

我一直觉得这条是三条里最容易走样的。项目跑久了，action 会慢慢退化成一堆 `SET_XXX`，type 全是字段名，reducer 变成一个巨大的赋值器。这时候 Redux 的追溯能力还在，但你看着一串 `SET_LOADING`、`SET_DATA`、`SET_ERROR` 的日志，还是不知道用户当时做了什么。

只读还有一层技术含义。state 对象本身不能被就地修改，reducer 必须返回新对象。为什么？因为 react-redux 的性能优化靠的是引用比较，你改了原对象再返回它，前后两次 `===` 相等，组件不会重渲。这个坑在数组上尤其常见，`state.list.push(item)` 之后返回 `state`，页面纹丝不动。

### 2.3 数据改变只能通过纯函数来执行

使用纯函数来执行修改，为了描述 action 如何改变 state，你需要编写 reducer。

reducer 的签名是 `(previousState, action) => newState`。纯函数的要求是两条：同样的输入必然得到同样的输出；执行过程中不产生任何副作用。

具体到 reducer 里，就是这些事一件都不能干：发网络请求、读 `Date.now()` 或 `Math.random()`、修改传入的 `state` 参数、调用非纯的函数、往 localStorage 里写东西。

那为什么非得纯？因为前面说的时间旅行调试要求「拿同一串 action 重放能得到同一串 state」。reducer 里只要出现一次 `Date.now()`，重放的结果就跟原始的对不上了，整个调试能力就垮了。测试也是同理，纯函数的单测就是「给一组输入断言输出」，不用 mock 任何东西。

这三条串起来看：单一数据源保证只有一份真相，只读保证修改必须走 action，纯函数保证同一串 action 一定能重现同一份真相。缺一条，可预测性就不成立。

## 三、单向数据流跑一圈

把 `dispatch` 之后发生的事按顺序摊开。

用户点了按钮，事件处理函数调用 `store.dispatch({ type: 'ADD_TODO', payload: '写博客' })`。store 拿到这个 action，把当前的 `state` 和 action 一起交给根 reducer。根 reducer 内部把 action 分发给每一个子 reducer，每个子 reducer 用 `switch` 判断这个 type 跟自己有没有关系，有关系就算出新的分支状态返回，没关系就把原样的 `state` 返回。

所有子 reducer 跑完，`combineReducers` 检查每个分支的引用有没有变，只要有一个变了就组装成一个新的根对象，全都没变就把旧的根对象原样返回。这个细节很多人没注意到，它是「无关的 dispatch 不会导致全局重渲」的基础。

新 state 落定之后，store 遍历监听器数组，挨个调用。react-redux 在这里挂了自己的回调，回调里重新执行 `mapStateToProps`，把新结果和上一次的结果做浅比较，有差异才更新组件的 props，触发重渲。

一次 dispatch 就是这么一条直线，没有分叉，没有回头。

正因为这条流水线是同步的、无分叉的，Redux 才敢说自己可预测。而这也直接引出了下一个问题：异步的东西往哪放？

## 四、store、action、reducer 的职责边界

这三个概念职责分得很干净，但实际项目里最容易糊在一起。

store 是容器，它只管存和通知，不管业务。它对外只有 `getState`、`dispatch`、`subscribe` 三个方法，加一个 `replaceReducer` 做热更新。store 本身没有任何业务逻辑，它不知道你的应用是干什么的。

action 是消息，它只描述事实，不做判断。常见的越界是在 action creator 里写 `if` 分支决定要派发哪个 type，轻度使用没问题，写多了就会发现业务逻辑一半在 action 一半在 reducer，改需求要两边找。

reducer 是计算，它只根据输入算输出，不碰外部世界。常见的越界是在 reducer 里顺手调一下接口，或者往 localStorage 写一份缓存。这两件事都该交给中间件。

具体的实现细节，包括 `createStore` 怎么把 state 关进闭包、`dispatch` 之后怎么遍历监听器，我在 [手写一个迷你版 Redux](https://feinterview.poetries.top/blog/react-redux) 里逐行写过一遍，想看代码可以翻那篇。

## 五、中间件插在哪一层

上面说了 reducer 必须纯，那发请求这类脏活谁来干？答案是中间件。

中间件的位置是在 `dispatch` 被调用之后、action 到达 reducer 之前。这个位置选得很讲究：它在 action 之后，所以能看到完整的 action 对象；它在 reducer 之前，所以能决定这个 action 到底要不要往下传，甚至可以拦下来换成另一个 action 再传。

redux-thunk 的做法是允许 action 是一个函数。中间件检测到函数就直接执行它，把 `dispatch` 和 `getState` 喂进去，异步跑完再手动 dispatch 一个普通对象的 action。redux-saga 的做法不一样，它让 action 保持普通对象，副作用全部搬进 generator 里，中间件负责监听和调度。

不管哪种方案，最终落到 reducer 手上的一定是一个普通对象的 action，reducer 的纯净性没有被破坏。这就是中间件这一层存在的全部意义。

## 六、什么时候不该用 Redux

这条得说在前面，因为 2018 年前后有一阵子风气是「React 项目默认上 Redux」，结果一堆本来两个 `useState` 就能搞定的页面被拆成了三个文件。

Redux 官方文档自己给的判断标准挺实在：当你发现有大量状态需要在多个不相关的组件之间共享，或者状态更新的逻辑复杂到你已经开始搞不清楚是谁改的，这时候 Redux 才划算。

反过来，几种情况我建议别上。表单里的输入值这类只有当前组件用的状态，放 `useState` 就好。服务端返回的列表数据，这类状态的难点在缓存、失效、重试，交给 TanStack Query 这样的取数库比塞进 store 合适得多。还有就是团队规模小、页面少的项目，Redux 那套约束带来的收益覆盖不了写模板代码的成本。

不是说 Redux 不行，而是它的价值建立在「项目大到需要约束」这个前提上。前提不成立，约束就只剩成本。选型的横向对比我在 [React 状态管理方案对比](https://feinterview.poetries.top/blog/react-state-management-comparison) 里写过。

## 七、Redux Toolkit 之后，这三条原则变了吗

这篇写于 2018 年，那会儿写 Redux 的标准姿势是三个文件起步：`actionTypes.js` 存常量，`actions.js` 写 action creator，`reducers.js` 写 `switch`。这套写法今天已经不是官方推荐了。

Redux 官方现在把 Redux Toolkit 作为默认入口。`createSlice` 一个函数就同时生成 action type、action creator 和 reducer，`configureStore` 默认装好 thunk 中间件和 DevTools。`createStore` 从 Redux 4.2 起被标记为 deprecated，文档建议改用 `configureStore`。

看起来变化很大，但三大原则一条都没动。

单一数据源还在，`configureStore` 建的还是一个 store。只读还在，只是 `createSlice` 内置了 Immer，你在 reducer 里写 `state.list.push(item)` 看着像就地修改，Immer 底下会基于草稿对象生成一个新对象返回，最终交出去的还是新引用。纯函数也还在，`createSlice` 的 case reducer 依然不能发请求。

Immer 这个设计我觉得很聪明。它没有放松约束，只是把「必须手写展开运算符」这个体力活自动化了。原来一段五层嵌套的不可变更新要写十几行展开，现在一行赋值就完事，出错的概率降了一大截。

另一个变化在读取侧。`connect` 加 `mapStateToProps` 的写法被 `useSelector` / `useDispatch` 取代了，react-redux 从 7.1 开始提供这组 hook。`connect` 没有被移除，存量代码可以继续跑，具体差异我在 [React connect 高阶组件原理与性能优化](https://feinterview.poetries.top/blog/react-redux-connect) 里展开了。

说实话我到现在还会习惯性写 `switch` reducer，`createSlice` 用了一阵子才顺手。但换过来之后，一个模块的代码量确实少了一多半。

## 总结

Redux 的设计理念不复杂：把状态收到一处，把修改收到一个入口，把计算限制成纯函数。三大原则是这三件事的规范表述，单一数据源解决「有几份真相」，只读解决「谁能改」，纯函数解决「能不能重放」。

职责边界记住三句话就够了。store 只存不管业务，action 只描述事实不做判断，reducer 只算不碰外部世界。副作用统一交给中间件，它插在 dispatch 和 reducer 之间，这个位置保证了它既能看到 action，又不会污染 reducer。

Redux Toolkit 换掉的是写法，不是原则。`createSlice` 里那行看着像就地修改的 `state.push`，底下还是 Immer 在帮你生成新对象。理解了这三条原则，无论用哪一代 API 都不会写歪。

## 参考

- [Redux 官方文档 - 三大原则](https://redux.js.org/understanding/thinking-in-redux/three-principles)
- [Redux 官方文档 - Reducers](https://redux.js.org/tutorials/fundamentals/part-3-state-actions-reducers)
- [Redux FAQ - When should I use Redux](https://redux.js.org/faq/general#when-should-i-use-redux)
- [Redux Toolkit createSlice](https://redux-toolkit.js.org/api/createSlice)
- [Immer 官方文档](https://immerjs.github.io/immer/)
- [前端进阶之旅](https://interview.poetries.top)
