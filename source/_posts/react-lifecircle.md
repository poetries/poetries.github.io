---
title: React 16.3 新生命周期详解与旧钩子废弃原因
date: 2018-11-18 23:30:12
description: 从 React 16.0 之前的完整生命周期讲到 16.3、16.4 的调整，拆清楚 componentWillMount 这几个钩子为什么被废弃，getDerivedStateFromProps 和 getSnapshotBeforeUpdate 各自该怎么用。
tags:
  - React
  - 生命周期
  - getDerivedStateFromProps
  - React 原理
categories: Front-End
---

接手一个老项目，`yarn start` 之后控制台刷一屏黄字，说 `componentWillReceiveProps` 已经改名成 `UNSAFE_componentWillReceiveProps`。当时最直接的反应是把名字改一下把警告压下去，改完发现还是有地方在报，而且顺着报错点进去看，那段逻辑是「拿到新 props 就发一次请求」。这个写法在 React 15 时代到处都是，凭什么现在就成了 unsafe 的？

这篇就是顺着这个问题往下挖的记录。先把 React 16.0 之前那套完整的生命周期讲一遍，再讲 Fiber 之后为什么必须动刀，最后把 `getDerivedStateFromProps` 和 `getSnapshotBeforeUpdate` 这两个新钩子的适用边界说清楚。读完你应该能回答一个面试里很常见的问题：为什么 `shouldComponentUpdate` 活下来了，它旁边那三个却没有。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- React 16.0 之前完整的四个阶段和每个钩子的职责
- 造成组件更新的两类三种情况，以及各自怎么优化
- Fiber 的可中断渲染为什么会让 render 之前的钩子变得危险
- React 16.3 和 16.4 的 `getDerivedStateFromProps` 有什么不一样
- `getSnapshotBeforeUpdate` 解决的是哪一类问题
- 派生 state 这件事本身的坑，以及官方推荐的替代写法
- 这套 API 到今天（React 19 时代）的现状

## 一、React v16.0 前的生命周期

先看这张全景图，后面所有讨论都会回到它上面。

![React v16.0 之前的完整生命周期流程图](https://s.poetries.top/gitee/2019/10/417.png)

整张图分成四段，初始化、挂载、更新、卸载。挂载和卸载各走一次，更新这一段会反复走。

### 1.1 第一个是组件初始化(initialization)阶段

也就是以下代码中类的构造方法（`constructor()`）。`Test` 类继承了 react 的 `Component` 这个基类，正因为继承了这个基类，才能有 `render()`、生命周期等方法可以使用，这也说明了为什么函数组件不能使用这些方法。

`super(props)` 用来调用基类的构造方法，也将父组件的 props 注入给子组件供子组件读取（组件中 `props` 只读不可变，`state` 可变），而 `constructor()` 用来做一些组件的初始化工作，比如定义 `this.state` 的初始内容。

```js
import React, { Component } from 'react';

class Test extends Component {
  constructor(props) {
    super(props);
  }
}
```

这段代码本身没干什么活，但它是理解后面一切的起点。构造函数是整个组件生命里唯一一次「什么都还没有」的时刻，DOM 没有，props 的后续变化也还没发生。所以凡是「只需要算一次的初始值」，放这里最省事。

顺带说一句，如果构造函数里只有 `super(props)` 这一行，那这个 `constructor` 可以整个删掉，ES6 class 会自动生成。ESLint 的 `no-useless-constructor` 规则就管这个。

### 1.2 第二个是组件的挂载(Mounting)阶段

这个阶段依次经过 `componentWillMount`、`render`、`componentDidMount` 三步。

#### 1.2.1 componentWillMount

在组件挂载到 DOM 前调用，且只会被调用一次。在这里调用 `this.setState` 不会引起组件重新渲染，也可以把写在这里的内容提前到 `constructor()` 中，所以项目中很少用。

这条「可以提前到 constructor」的结论很关键，它其实已经暗示了这个钩子存在的必要性不强，后面 React 团队砍掉它的底气也在这里。

#### 1.2.2 render

根据组件的 `props` 和 `state`（无两者的重传递和重赋值，无论值是否有变化，都可以引起组件重新 `render`），`return` 一个 React 元素（描述组件，即 UI），不负责组件实际渲染工作，之后由 React 自身根据此元素去渲染出页面 DOM。

`render` 是纯函数（Pure function，函数的返回结果只依赖于它的参数，函数执行过程里面没有副作用），不能在里面执行 `this.setState`，会有改变组件状态的副作用。

这里的「纯」不是一句道德倡议，是硬约束。你在 `render` 里写一次埋点上报，Fiber 时代这段代码可能被跑两遍，埋点数就翻倍了。

#### 1.2.3 componentDidMount

组件挂载到 DOM 后调用，且只会被调用一次。

这是发请求、加事件监听、初始化第三方图表实例的标准位置。原因很简单，走到这一步真实 DOM 已经在页面上了，`this.refs` 和 `ref` 都能拿到节点。

### 1.3 第三个是组件的更新(update)阶段

`setState` 引起的 `state` 更新，或父组件重新 `render` 引起的 `props` 更新，更新后的 `state` 和 `props` 相对之前无论是否有变化，都将引起子组件的重新 `render`。

那句「无论是否有变化」是很多性能问题的源头，下面拆开讲。

#### 1.3.1 造成组件更新有两类（三种）情况

**1. 父组件重新 render**

父组件重新 `render` 引起子组件重新 `render` 的情况有两种。

a. 直接使用，每当父组件重新 `render` 导致的重传 `props`，子组件将直接跟着重新渲染，无论 `props` 是否有变化。可通过 `shouldComponentUpdate` 方法优化。

```js
class Child extends Component {
   shouldComponentUpdate(nextProps){ // 应该使用这个方法，否则无论props是否有变化都将会导致组件跟着重新渲染
        if(nextProps.someThings === this.props.someThings){
          return false
        }
    }
    render() {
        return <div>{this.props.someThings}</div>
    }
}
```

这段代码在解决的是「父组件动一下，子树全体陪跑」的问题。要注意这个示例只在相等时 `return false`，不相等时函数走到底返回 `undefined`，React 会当成真值继续渲染，行为上是对的，但更严谨的写法是显式 `return true`。生产代码里这类隐式返回很容易在后面加分支时出错。

b. 在 `componentWillReceiveProps` 方法中，将 `props` 转换成自己的 `state`。

```jsx
class Child extends Component {
    constructor(props) {
        super(props);
        this.state = {
            someThings: props.someThings
        };
    }
    componentWillReceiveProps(nextProps) { // 父组件重传props时就会调用这个方法
        this.setState({someThings: nextProps.someThings});
    }
    render() {
        return <div>{this.state.someThings}</div>
    }
}
```

在该函数（`componentWillReceiveProps`）中调用 `this.setState()` 将不会引起第二次渲染。

原因是 `componentWillReceiveProps` 中判断 `props` 是否变化了，若变化了，`this.setState` 将引起 `state` 变化，从而引起 `render`，此时就没必要再做第二次因重传 `props` 引起的 `render` 了，不然重复做一样的渲染了。

这个写法有个正式名字叫「派生 state」，它是整篇文章里最值得警惕的一处，第四节会专门算这笔账。

**2. 组件本身调用 setState，无论 state 有没有变化。可通过 shouldComponentUpdate 方法优化**

```jsx
class Child extends Component {
   constructor(props) {
        super(props);
        this.state = {
          someThings:1
        }
   }
   shouldComponentUpdate(nextProps, nextState){ // 应该使用这个方法，否则无论state是否有变化都将会导致组件重新渲染
        if(nextState.someThings === this.state.someThings){
          return false
        }
        return true
    }

   handleClick = () => { // 虽然调用了setState ，但state并无变化
        const preSomeThings = this.state.someThings
         this.setState({
            someThings: preSomeThings
         })
   }

    render() {
        return <div onClick = {this.handleClick}>{this.state.someThings}</div>
    }
}
```

这里我改了原文一处签名。`shouldComponentUpdate` 的形参顺序固定是 `(nextProps, nextState)`，原文写成了 `shouldComponentUpdate(nextStates)`，那样第一个参数拿到的其实是 props，比较永远为 false，`return false` 分支根本进不去。这是个很典型的坑，把它当反面教材记住就行。

关于 `setState` 本身的批量合并、异步表现和更新队列，我在 [React setState 原理剖析](https://feinterview.poetries.top/blog/react-setState) 里单独拆过，这里不重复。

#### 1.3.2 componentWillReceiveProps(nextProps)

此方法只调用于 `props` 引起的组件更新过程中，参数 `nextProps` 是父组件传给当前组件的新 `props`。但父组件 `render` 方法的调用不能保证重传给当前组件的 `props` 是有变化的，所以在此方法中要根据 `nextProps` 和 `this.props` 来查明重传的 `props` 是否改变，以及如果改变了要执行什么，比如根据新的 `props` 调用 `this.setState` 触发当前组件的重新 `render`。

#### 1.3.3 shouldComponentUpdate(nextProps, nextState)

此方法通过比较 `nextProps`、`nextState` 及当前组件的 `this.props`、`this.state`，返回 `true` 时当前组件将继续执行更新过程，返回 `false` 则当前组件更新停止，以此可用来减少组件的不必要渲染，优化组件性能。

这边也可以看出，就算 `componentWillReceiveProps()` 中执行了 `this.setState` 更新了 `state`，但在 `render` 前（如 `shouldComponentUpdate`、`componentWillUpdate`），`this.state` 依然指向更新前的 `state`，不然 `nextState` 及当前组件的 `this.state` 的对比就一直是 `true` 了。

#### 1.3.4 componentWillUpdate(nextProps, nextState)

此方法在调用 `render` 方法前执行，在这里可执行一些组件更新发生前的工作，一般较少用。

#### 1.3.5 componentDidUpdate(prevProps, prevState)

此方法在组件更新后被调用，可以操作组件更新的 DOM，`prevProps` 和 `prevState` 这两个参数指的是组件更新前的 `props` 和 `state`。

这里有个坑要注意，在 `componentDidUpdate` 里无条件调用 `setState` 会直接死循环，因为 `setState` 又会触发一次更新，更新完又进 `componentDidUpdate`。必须先做一次 `prevProps.x !== this.props.x` 之类的判断再决定要不要更新。

### 1.4 卸载阶段

此阶段只有一个生命周期方法，`componentWillUnmount`。

此方法在组件被卸载前调用，可以在这里执行一些清理工作，比如清除组件中使用的定时器，清除 `componentDidMount` 中手动创建的 DOM 元素等，以避免引起内存泄漏。

清理这件事被漏掉的概率比想象中高。最常见的是组件里发了一个请求，请求还没回来组件就被卸载了，回调里的 `setState` 打在一个已卸载的实例上。老版本 React 会给你一个 memory leak 警告，新版本把这个警告去掉了，但泄漏的定时器和事件监听依然是泄漏。

## 二、React v16.4 的生命周期

先看新版全景图，和第一节那张对照着看差异最明显。

![React v16.4 的生命周期流程图](https://s.poetries.top/gitee/2019/10/418.png)

### 2.1 变更缘由

原来（React v16.0 前）的生命周期在 React v16 推出的 Fiber 之后就不合适了，因为如果要开启 async rendering，在 `render` 函数之前的所有函数，都有可能被执行多次。

原来（React v16.0 前）的生命周期有哪些是在 render 前执行的呢？

- `componentWillMount`
- `componentWillReceiveProps`
- `shouldComponentUpdate`
- `componentWillUpdate`

如果开发者开了 async rendering，而且又在以上这些 render 前执行的生命周期方法里做 AJAX 请求的话，那 AJAX 将被无谓地多次调用。而且在 `componentWillMount` 里发起 AJAX，不管多快得到结果也赶不上首次 render，而且 `componentWillMount` 在服务器端渲染也会被调用到。

这里值得多说两句，因为它是整件事的根。Fiber 把渲染拆成了 render 和 commit 两个阶段，render 阶段是可以被更高优先级任务打断的，打断之后这一轮的工作可能被整个丢弃，之后从头再来一次。丢弃重来意味着 render 之前的那几个钩子会被跑第二遍、第三遍。这套可中断渲染的机制我在 [React 18 并发机制深度解析](https://feinterview.poetries.top/blog/react-18-concurrency) 里从 Fiber 链表遍历讲到时间切片，想看细节可以跳过去。

回到这块。副作用被执行多次为什么这么要命？请求重复发只是浪费流量，真正难查的是那种「在 `componentWillMount` 里改了一个模块级变量」的代码，跑两遍结果就不对了，而且不稳定复现。

所以除了 `shouldComponentUpdate`，其他在 `render` 函数之前的所有函数（`componentWillMount`、`componentWillReceiveProps`、`componentWillUpdate`）都被 `getDerivedStateFromProps` 替代。

也就是用一个静态函数 `getDerivedStateFromProps` 来取代被 deprecate 的几个生命周期函数，就是强制开发者在 `render` 之前只做无副作用的操作，而且能做的操作局限在根据 `props` 和 `state` 决定新的 `state`。

那 `shouldComponentUpdate` 凭什么留下来？因为它天生就被设计成纯函数，输入是 `nextProps` 和 `nextState`，输出是一个布尔值，不改任何东西。跑一遍和跑三遍结果一样，这就是安全的。这条判据可以直接用来回答面试题。

`getDerivedStateFromProps` 被写成 `static` 也是同一个思路。静态方法里拿不到 `this`，你想在里面 `this.setState` 或者读实例上的字段都做不到，React 用语言层面的限制把「写出有副作用的代码」这条路给堵死了。

React v16.0 刚推出的时候，是增加了一个 `componentDidCatch` 生命周期函数，这只是一个增量式修改，完全不影响原有生命周期函数。但是到了 React v16.3，大改动来了，引入了两个新的生命周期函数。

### 2.2 引入了两个新的生命周期函数

#### 2.2.1 getDerivedStateFromProps

`getDerivedStateFromProps` 本来（React v16.3 中）是只在创建和更新（由父组件引发的部分）时调用，也就是说如果不是由父组件引发的更新，那么 `getDerivedStateFromProps` 也不会被调用，比如自身 `setState` 引发或者 `forceUpdate` 引发。

对比一下 16.3 这张图，注意 Updating 那一列的入口条件。

![React v16.3 的生命周期流程图](https://s.poetries.top/gitee/2019/10/419.png)

这样的话理解起来有点乱，在 React v16.4 中改正了这一点，让 `getDerivedStateFromProps` 无论是 Mounting 还是 Updating，也无论是因为什么引起的 Updating，全部都会被调用，具体可看上面 React v16.4 的生命周期图。

我一开始也觉得 16.4 这个改动是在给自己找麻烦，「明明只有 props 变了才需要派生 state」。后来想明白了，16.3 那套规则要求 React 内部区分「这次更新是谁触发的」，而在 Fiber 的批处理里，一次更新完全可能同时来自父组件重渲染和自身 `setState`，这个「谁触发的」根本没法给出唯一答案。与其定义一个模糊的规则，不如统一成「每次 render 前都调」，行为可预测得多。

代价是你必须自己在函数里判断值到底变没变。

React v16.4 后的 `getDerivedStateFromProps`：

`static getDerivedStateFromProps(props, state)` 在组件创建时和更新时的 render 方法之前调用，它应该返回一个对象来更新状态，或者返回 `null` 来不更新任何内容。

#### 2.2.2 getSnapshotBeforeUpdate

`getSnapshotBeforeUpdate()` 被调用于 `render` 之后，可以读取但无法使用 DOM 的时候。它使你的组件可以在可能更改之前从 DOM 捕获一些信息（例如滚动位置）。此生命周期返回的任何值都将作为参数传递给 `componentDidUpdate()`。

官网给的例子：

```js
class ScrollingList extends React.Component {
  constructor(props) {
    super(props);
    this.listRef = React.createRef();
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    //我们是否要添加新的 items 到列表?
    // 捕捉滚动位置，以便我们可以稍后调整滚动.
    if (prevProps.list.length < this.props.list.length) {
      const list = this.listRef.current;
      return list.scrollHeight - list.scrollTop;
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    //如果我们有snapshot值, 我们已经添加了 新的items.
    // 调整滚动以至于这些新的items 不会将旧items推出视图。
    // (这边的snapshot是 getSnapshotBeforeUpdate方法的返回值)
    if (snapshot !== null) {
      const list = this.listRef.current;
      list.scrollTop = list.scrollHeight - snapshot;
    }
  }

  render() {
    return (
      <div ref={this.listRef}>{/* ...contents... */}</div>
    );
  }
}
```

这个例子在解决一个很具体的场景：聊天窗口往顶部插历史消息，插完之后如果不管，浏览器会把你正在看的那条消息往下挤出视野。要修正它，你需要一个「DOM 已经算好了新内容、但还没画到屏幕上」的时机去读旧的 `scrollHeight`。

`componentWillUpdate` 以前干的就是这个活，但它在 render 之前，那时候 React 还没开始改 DOM，读到的值在异步渲染下可能已经过期了。`getSnapshotBeforeUpdate` 被放在 commit 阶段的开头，render 已经跑完、DOM 变更即将提交，这个位置读出来的值一定是准的，而且 commit 阶段不可中断，保证只跑一次。

所以这两个新钩子的分工其实很清楚。`getDerivedStateFromProps` 管「渲染之前需要根据 props 算点东西」，被限制成纯函数；`getSnapshotBeforeUpdate` 管「DOM 提交之前需要抢救一点旧信息」，放在不可中断的阶段里。原来那三个 `componentWill*` 干的事，被拆进了这两个更安全的位置。

## 三、派生 state 这件事本身就有坑

第一节里 1.3.1 的 b 写法（把 props 拷进 state）现在换成 `getDerivedStateFromProps` 之后，坑一点没少，只是换了个位置。

最典型的是这样：

```jsx
static getDerivedStateFromProps(props, state) {
  return {
    email: props.email
  };
}
```

看着人畜无害，实际后果是用户在输入框里改的内容会被冲掉。因为 16.4 之后每次 render 前都会调这个函数，你自己 `setState` 改了 `email`，下一次渲染立刻又被 `props.email` 覆盖回去。

正确的写法要自己记住上一次的 props，只在真的变化时才同步：

```jsx
static getDerivedStateFromProps(props, state) {
  if (props.email !== state.prevEmail) {
    return {
      email: props.email,
      prevEmail: props.email
    };
  }
  return null;
}
```

多存一个 `prevEmail` 看着有点笨，但这是官方博客里给的标准解法，因为静态方法拿不到 `this.props`，比较基准只能自己存在 state 里。

不过更值得问一句的是：这个 state 真的需要派生吗？

官方给的判断标准是，只有当组件需要「记住」某个随时间变化的值，且这个值不能单纯由当前 props 算出来时，才需要派生。如果只是想根据 props 算个展示值，直接在 `render` 里算就行了，算得贵就用记忆化包一层。如果只是想在 props 变化时重置内部状态，给组件加一个 `key`，让 React 直接销毁重建，比写派生 state 干净得多。

我自己的感受是，绝大部分 `getDerivedStateFromProps` 的使用都可以用 `key` 或者「直接在 render 里算」替掉，剩下真正需要它的场景一年碰不上几次。

## 四、这套 API 到今天还成立吗

这篇写于 2018 年，那会儿 React 刚到 16.4，上面所有内容在类组件里到今天依然是成立的。但有几件事变了，得补一下。

关于旧钩子的现状，React 16.9 给 `componentWillMount`、`componentWillReceiveProps`、`componentWillUpdate` 加了 `UNSAFE_` 前缀的别名，同时让不带前缀的旧写法在控制台打废弃警告。React 官方也提供了 codemod 脚本 `rename-unsafe-lifecycles` 做批量重命名。至于这三个钩子在最新版本里是否已经彻底移除，我没有在最新版上逐个验证过，以官方文档为准。

关于写法本身。今天写 React，类组件已经不是默认选择了，函数组件加 Hooks 才是。生命周期的思维模型也跟着换了，不再是「挂载做什么、更新做什么、卸载做什么」，而是「这段副作用依赖哪些值，值变了就重新同步一次」。`componentDidMount` 加 `componentDidUpdate` 加 `componentWillUnmount` 三个钩子干的事，在 `useEffect` 里是一个函数加一个依赖数组加一个清理函数。Hooks 这一套的用法和坑我写在 [React Hooks 详解](https://feinterview.poetries.top/blog/react-hooks) 里。

但类组件的生命周期还是得懂。一方面老项目里到处都是，另一方面 `getSnapshotBeforeUpdate` 和错误边界（`componentDidCatch`、`getDerivedStateFromError`）在函数组件里至今没有完全对等的 Hook 实现，真要写错误边界还是得落回类组件。这块请以官方文档的最新说明为准。

## 总结

回过头看，React 16.3 这次改动的逻辑链条其实很短。Fiber 让 render 阶段变得可中断可重来，可重来就意味着 render 之前的代码会被执行多次，执行多次就要求这些代码必须没有副作用。

于是 React 做了三件事。把有副作用风险的 `componentWillMount`、`componentWillReceiveProps`、`componentWillUpdate` 标记为不安全；用一个 `static` 的 `getDerivedStateFromProps` 顶上，用静态方法在语法层面禁止你碰 `this`；给「必须在 DOM 提交前读一次真实 DOM」这个刚需单独开了 `getSnapshotBeforeUpdate`，放在不可中断的 commit 阶段。

留下 `shouldComponentUpdate` 的理由也是同一条：它本来就是纯的。

一句话记忆点：render 前的钩子必须纯，因为它可能被跑很多次；commit 阶段的钩子可以有副作用，因为它保证只跑一次。

## 参考

- [React v16.3.0 版本发布说明](https://legacy.reactjs.org/blog/2018/03/29/react-v-16-3.html)
- [You Probably Don't Need Derived State](https://legacy.reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html)
- [Update on Async Rendering](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html)
- [React.Component 生命周期 API 参考](https://legacy.reactjs.org/docs/react-component.html)
- [React v16.3 之后的组件生命周期函数](https://zhuanlan.zhihu.com/p/38030418)
- [前端进阶之旅](https://interview.poetries.top)
