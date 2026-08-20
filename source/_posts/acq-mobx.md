---
title: 初识 MobX，从核心 API 到计数器实战
description: MobX 入门梳理，讲清 observable、computed、action、observer、autorun、reaction、flow 七个核心 API 的职责边界，配一个能跑的计数器示例，并对比 Redux 说明各自适合什么场景。
date: 2018-08-31 16:25:24
tags: 
 - JavaScript
 - MobX
 - 状态管理
categories: Front-End
---

那阵子团队里 Redux 写得有点疲。加一个「购物车商品数量」这么小的功能，要动 `actionTypes.js`、`actions/cart.js`、`reducers/cart.js` 三个文件，再回组件里补 `mapStateToProps`，实际干活的逻辑就是 `state.count += 1`。后来看到 MobX 的示例，一个 `@observable count = 0` 加一个 `@observer`，页面就跟着变了，当时的第一反应是这也太省事了，第二反应是它凭什么能做到。

这篇是我把 MobX 摸一遍之后的笔记。从它和 Redux 的差别聊起，逐个拆七个核心 API，最后串一个完整的计数器。文章写于 2018 年，用的是当时主流的装饰器写法，我把原样保留了，另外补了几段说明现在 MobX 6 之后该怎么写，两边不混着看。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- MobX 的整体流程，以及它和 Redux 在数据流上的根本差别
- MobX 的优点和缺点各在哪，什么场景下用它更划算
- `observable` / `computed` / `action` 三块基石的职责边界
- `observer` 怎么让 React 组件自动跟着数据重渲
- `autorun`、`reaction`、`flow` 分别解决什么问题，怎么选
- 一个完整可跑的计数器示例，把上面的概念全串起来
- 装饰器写法在 MobX 6 之后的变化，以及现在的推荐入口

## 一、认识 MobX

### 1.1 先看看 MobX 里有什么

理解一个库最直接的办法是把它打印出来看看导出了哪些东西。

```javascript
import * as mobx from 'mobx'
console.log(mobx)
```

![打印 mobx 对象查看导出的 API 列表](https://s.poetries.top/gitee/20191001/8.png)

从这张图能看出来，MobX 的 API 面并不大，核心就是 `observable`、`computed`、`action`、`autorun`、`reaction`、`when`、`configure` 这些。真正需要理解的概念比 API 数量还少。

再看它的整个流程：

![MobX 的数据流转流程图，从 action 到 state 再到 computed 和 reaction](https://s.poetries.top/gitee/20191001/9.png)

这条链路是 MobX 的骨架。事件触发 action，action 修改 state，state 是 observable 的，它一变就会通知依赖它的 computed 重新计算，再通知 reaction 执行副作用，而 React 组件本身就是最重要的那个 reaction。

注意这里没有「派发到某个中心再分发下去」的环节。谁读了什么，MobX 在运行时就记着，改了就直接通知那几个人。这是它和 Redux 最大的结构性差别。

### 1.2 MobX 和 Redux 的比较

摆开来看有四条差别。

`Redux` 是单一数据源，而 `MobX` 往往是多个 `store`。`MobX` 可以根据应用的 `UI`、数据或业务逻辑来组织 `store`，具体怎么分需要你自己权衡。这个自由度是双刃剑，小项目很爽，大项目没有约定就容易乱。

`Redux store` 使用普通的 `JavaScript` 对象结构，`MobX` 则把常规 `JavaScript` 对象包裹起来，赋予 `observable` 的能力，通过隐式订阅自动跟踪 `observable` 的变化。`MobX` 是观察引用的，在跟踪函数中（比如 `computed value`、`reactions` 这些）任何被引用的 `observable` 属性都会被记录，一旦引用改变，`MobX` 就会作出反应。

这里有个坑要注意：不在跟踪函数中的属性不会被跟踪，在异步中访问的属性也不会被跟踪。很多「明明改了数据但组件不更新」的问题，根子都在这条上。

`Redux` 的 `state` 是只读的，只能通过把之前的 `state` 与触发的 `action` 结合产生新的 `state`，因此是纯净的（pure）。而 `MobX` 的 `state` 既可读又可写，`action` 是非必须的，可以直接赋值改变，因此是不纯净的（impure）。

`Redux` 需要你去规范化你的 `state`。`Immutable` 数据使得 `Reducer` 在更新时需要把状态树的祖先数据复制并更新，新的对象会导致与之 `connect` 的所有 `UI` 组件都重复渲染。所以 `Redux state` 不建议做深层嵌套，或者需要在组件里用 `shouldComponentUpdate` 优化。而 `MobX` 只自动更新你所关心的那部分，不必担心嵌套带来的重渲染问题。

用一句话概括覆盖范围：`redux` 管理的是 `STORE` -> `VIEW` -> `ACTION` 的整个闭合流程，而 `mobx` 只关心 `STORE` -> `VIEW` 这一段。

Redux 的三大原则和它为什么要主动给状态修改加约束，我在 [Redux 原理与三大原则](https://feinterview.poetries.top/blog/react-redux-analyse) 里单独写过，对照着看差别会更清楚。

### 1.3 优点

**基于运行时的数据订阅。** `mobx` 的数据依赖始终保持最小，而且是运行时自动追踪的。如果用 `redux`，可能一不小心就多订阅或者少订阅了数据，多了性能差，少了不更新。为了达到高性能，得借助 `PureRenderMixin` 以及 `reselect` 对 `selector` 做缓存，这是额外的心智负担。

**通过 OOP 的方式组织领域模型（domain model）。** `OOP` 的方式在某些场景下会比较方便，尤其是容易抽取 `domain model` 的时候。而且 `mobx` 支持用引用的方式引用数据，很容易形成模型图（model graph）。一个订单对象能直接拿到它的用户对象，而不是拿一个 `userId` 再去别的 slice 里查。

**修改数据方便自然。** `mobx` 是基于原生的 `JavaScript` 对象、数组和 `Class` 实现的，修改数据不需要额外语法成本，也不需要始终返回一个新的数据，直接操作就行。

### 1.4 缺点

**缺最佳实践和社区积累。** `mobx` 出现得比较晚，遇到的问题可能社区都没有遇到过。并且它没有很好的扩展和插件机制。

**可以随意修改 store。** `redux` 里唯一能改数据的地方是 reducer，这保证了应用的可预测性；而 `mobx` 可以在任何地方修改数据触发更新，给人一种不太安全的感觉。这个问题后来是有解的，`mobx 2.2` 加入了 `action` 的支持，开启 `strict mode` 之后就只有 `action` 可以对数据进行修改，修改入口重新收敛了。

**逻辑层的限制。** 如果更新逻辑不能很好地封装在 `domain class` 里，用 `redux` 会更合适。另外 `mobx` 缺少类似 `redux-saga` 的库，复杂业务流程的编排不知道放哪合适。

这条我自己的感受是最真实的。做一个多步骤的下单流程，Redux 那边有 saga 可以把流程写成一条线，MobX 这边你得自己找地方放。

## 二、核心 API

七个 API 的关系可以先看这张全景图：

![MobX 核心 API 的关系图，observable 与 computed、action、reaction 的关联](https://s.poetries.top/gitee/20191001/10.png)

读法是这样的：`observable` 是源头，`action` 是唯一推荐的修改入口，`computed` 是从源头派生出的值，`autorun` / `reaction` / `observer` 都属于副作用，负责在数据变化时做点什么。

### 2.1 observable

`Observable` 值可以是 JS 基本数据类型、引用类型、普通对象、类实例、数组和映射。被它修饰的 state 会暴露出来供观察者使用。

```javascript
// Observable 值可以是JS基本数据类型、引用类型、普通对象、类实例、数组和映射
@observable title = 'this is about page'
@observable num = 0

// 计算值(computed values)是可以根据现有的状态或其它计算值衍生出的值
@computed get getUserInfo(){
   return `我是computed经过计算的getter,current num:${this.num}`
}
// 注意：当你使用装饰器模式时，@action 中的 this 没有绑定在当前这个实例上，要通过 @action.bound 来绑定 使得 this 绑定在实例对象上
@action.bound add(){
    this.num ++
}
@action.bound reduce(){
    this.num --
}
```

这段把三个基石一次性演示完了，值得逐行看一下。`@observable` 标记的两个字段是数据源；`@computed` 修饰的 getter 是派生值，读它的时候才计算；`@action.bound` 里的 `.bound` 是把方法绑到实例上，这样你可以直接写 `onClick={store.add}` 而不用包一层箭头函数。

顺带说一句，这里的 `@observable num = 0` 是类属性写法，需要 babel 的装饰器插件加类属性插件才能编译，两个都得配，少一个就报语法错误。

### 2.2 observer

`observer` 可以用作包裹 `React` 组件的高阶组件。在组件的 `render` 函数中任何已使用的 `observable` 发生变化时，组件都会自动重新渲染。注意 `observer` 是由 `mobx-react` 包提供的，而不是 `mobx` 本身。

它的原理，用一句话说就是用 `mobx.autorun` 包装了组件的 `render` 函数，确保任何组件渲染中使用的数据变化时都能强制刷新组件。

那为什么有时候数据明明变了组件却没反应呢？

因为「已使用」这三个字是严格的。`observer` 建立的订阅只覆盖本次 `render` 期间真正被读取过的字段。在组件外面提前解构好再传进来，读取动作发生在 `observer` 的追踪范围之外，订阅就没建立起来。

```jsx
// 失效：props 已经在父组件里被读出来了，这里拿到的是一个死值
const Bad = observer(({ count }) => <span>{count}</span>)

// 正确：在 observer 内部读 store 上的属性
const Good = observer(({ store }) => <span>{store.count}</span>)
```

我一开始也以为 `observer` 是给组件装了个全局监听器，想通「读了才订阅」这一点之后，很多诡异问题就自己解释了。

### 2.3 computed

计算值（`computed values`）是可以根据现有的状态或其它计算值衍生出的值，用于获取由基础 `state` 衍生出来的值。如果基础值没有变，获取衍生值时就会走缓存，这样就不会引起虚拟 DOM 的重新渲染。

它有两个入口：`getter` 负责获得计算得到的新 state 并返回；`setter` 不能用来直接改变计算属性的值，但可以用来做「逆向」衍生。

通过 `@computed` 加 getter 函数来定义衍生值：

```javascript
class Foo {
    @observable length = 2;
    @computed get squared() {
        return this.length * this.length;
    }
    set squared(value) { // 这是一个自动的动作，不需要注解
        this.length = Math.sqrt(value);
    }
}
```

这个 setter 的用法看着有点绕，它的实际场景是「双向换算」。摄氏度和华氏度两个输入框，改哪一个另一个都要跟着变，用 computed 的 setter 写就很自然。

这里有个坑要注意：computed 的缓存只在它被某个 reaction 观察时才生效。如果你在组件外面直接读一个没人观察的 computed，MobX 每次都会重新计算。表现就是「明明加了 computed 却没变快」，在写单元测试或者在事件回调里直接读 store 的时候容易遇到。

### 2.4 action

只有在 `action` 中，才可以修改 MobX 中 state 的值。当你使用装饰器模式时，`@action` 中的 `this` 没有绑定在当前实例上，要通过 `@action.bound` 来绑定。

不过这条规则默认是不强制的，得靠严格模式打开：

```javascript
import {configure} from 'mobx';

configure({ enforceActions: 'always' }) // 开启严格模式
```

```javascript
@action.bound add(){
    this.num ++
}
@action.bound reduce(){
    this.num --
}
```

`enforceActions` 现在接收的是字符串：`'always'` 表示所有状态修改都必须在 action 里，`'observed'` 只对被观察的状态强制这条规则，`'never'` 是关闭。老代码里能看到 `enforceActions: true` 这种布尔写法，那是早期版本的形式，新版本请按字符串写。

新项目我一般直接开 `'always'`，把修改入口收死，不然 MobX「哪里都能改」的自由度用不了多久就会变成负担。

### 2.5 autorun

当可观察对象中保存的值发生变化时，可以在 `mobx.autorun` 中被观察到。`observable` 的值初始化或改变时，回调自动运行。

```javascript
import { autorun, observable } from 'mobx'

class Person {
  @observable name = ''
  @observable age = 0
}

const person = new Person()

autorun(() => {
  console.log(`姓名: ${person.name}, 年龄: ${person.age}`)
})

person.name = '张三' // 输出: 姓名: 张三, 年龄: 0
person.age = 25      // 输出: 姓名: 张三, 年龄: 25
```

选择标准很清楚。如果你想响应式地产生一个可以被其它 `observer` 使用的值，用 `@computed`；如果你不想产生新值，只想达到某个效果，用 `autorun`。效果指的是打印日志、发起网络请求、写 localStorage 这类命令式的副作用。

`autorun` 会返回一个 disposer 函数，用完记得调它清理。在组件里创建却忘了清理，就是一个持续订阅的内存泄漏，这个我踩过。

### 2.6 reaction

`Reactions` 和计算值很像，但它不是产生一个新的值，而是会产生一些副作用，比如打印到控制台、发网络请求、递增地更新 `React` 组件树以修补 DOM 等等。`reactions` 在响应式编程和命令式编程之间建立了沟通的桥梁。

```javascript
import { reaction } from 'mobx'

const disposer = reaction(
  // 第一个函数：追踪哪些数据
  () => store.keyword,
  // 第二个函数：数据变化后做什么
  (keyword, prevKeyword) => {
    console.log('关键词从', prevKeyword, '变成了', keyword)
  }
)
```

它和 `autorun` 的差别就一点：`autorun` 创建时会立刻执行一次，`reaction` 不会，只有追踪的数据真的变了才跑。想在初始化时也执行，可以传 `{ fireImmediately: true }`。

还有个位置问题值得提醒。`reaction` 一定要注册在只会执行一次的地方，比如 `constructor`。写在某个会被反复调用的方法里，调几次就有几个 reaction 在监听同一份数据，日志打好几遍，而且没人清理。

### 2.7 flow

用法是 `flow(function* (args) { })`，`flow()` 接收 `generator` 函数作为它唯一的输入。

```javascript
import { configure, flow, observable } from 'mobx';

// 不允许在动作外部修改状态
configure({ enforceActions: 'always' });

class Store {
    @observable githubProjects = [];
    @observable state = "pending"; // "pending" / "done" / "error"


    fetchProjects = flow(function* fetchProjects() { // <- 注意*号，这是生成器函数！
        this.githubProjects = [];
        this.state = "pending";
        try {
            const projects = yield fetchGithubProjectsSomehow(); // 用 yield 代替 await
            const filteredProjects = somePreprocessing(projects);

            // 异步代码自动会被 `action` 包装
            this.state = "done";
            this.githubProjects = filteredProjects;
        } catch (error) {
            this.state = "error";
        }
    })
}
```

为什么异步这块需要专门搞一个 `flow` 出来？因为 action 的边界是同步函数体。`await` 之后的代码已经跑在另一个微任务里了，不再处于 action 的作用范围内，严格模式下改状态会直接报错。你得手动用 `runInAction` 把每一段 `await` 之后的赋值包起来，写多了很烦。

`flow` 把这件事自动化了，`yield` 之后的赋值会自动被当成 action 处理。它还有个不太被提到的好处，返回的 promise 带 `cancel()` 方法，能取消进行中的流程，做搜索联想这种连续触发的场景很有用。

代价是 generator 语法对新人有门槛。我自己的做法是简单异步用 `async` 加 `runInAction`，需要取消能力的才上 `flow`。

## 三、计数器例子

把上面的概念串成一个能跑的完整例子：

```javascript
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react'; // 结合 react
import { observable, computed, action } from 'mobx';

// 定义数据 store
class Counter {
  @observable number = 0;

  @computed get msg() {
    return 'number:' + this.number;
  }

  // 用 action 改变数据，避免混乱
  @action.bound increment() {
    this.number++;
  }

  @action.bound decrement() {
    this.number--;
  }
}

const store = new Counter();
```

Store 这部分三个概念都用上了：`number` 是 observable 数据源，`msg` 是从它派生出来的 computed，两个 `@action.bound` 是仅有的两个修改入口。

视图部分只做一件事，把 store 里的字段读出来渲染，加上 `@observer` 就自动跟着变：

```javascript
// 把属性注入 react 组件
@observer
class App extends Component {
  handleInc = () => {
    store.increment();
  }

  handleDec = () => {
    store.decrement();
  }

  render() {
    return (
      <div>
        { store.msg } <br />
        <button onClick={this.handleInc}> + </button>
        <button onClick={this.handleDec}> - </button>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
```

原文这段代码我修了几处问题，说明一下免得你照抄踩坑。一是 `@action decrement: () => {}` 这种写法把方法定义和属性赋值混在了一起，语法上过不去，改成了和 `increment` 一致的方法形式。二是 `import` 里少了 `action` 和 `ReactDOM`，只导入 `observable, autorun, computed` 是跑不起来的，而 `autorun` 在这个例子里又用不上。三是 `handleInc` 原来是普通类方法，`onClick={this.handleInc}` 传过去之后 `this` 会丢，改成了类属性箭头函数。

`render` 里读的是 `store.msg` 这个 computed，`msg` 依赖 `store.number`，所以点击按钮改了 `number` 之后，链路是 action 改数据、computed 失效重算、`observer` 收到通知重渲。整条链没有一行订阅代码是你写的。

最后那句 `ReactDOM.render` 是 React 17 及以前的写法。React 18 之后要换成 `createRoot`，不换的话应用跑在 legacy 模式下，自动批处理和并发能力都不生效。

## 四、装饰器写法在今天的处境

上面全篇用的都是 `@observable` / `@action` 这套装饰器写法，这是 2018 年 MobX 4/5 时代的主流。这里得补一句现状，免得你照着配半天 babel 还是跑不通。

从 MobX 6 开始，装饰器不再是默认路径。原因是 JS 的装饰器提案长期没有定稿，各家实现互不兼容，MobX 索性把 `makeObservable` 和 `makeAutoObservable` 提为主入口，装饰器降级成可选的语法糖。而且就算你继续用装饰器，也仍然要在构造函数里调一次 `makeObservable(this)`，不然不生效。

现在推荐的写法是这样：

```javascript
import { makeAutoObservable } from 'mobx'

class Counter {
  number = 0

  constructor() {
    makeAutoObservable(this)
  }

  get msg() {
    return 'number:' + this.number
  }

  increment() {
    this.number++
  }

  decrement() {
    this.number--
  }
}
```

`makeAutoObservable` 的推断规则很直白：普通属性变成 `observable`，getter 变成 `computed`，普通方法变成 `action`，generator 方法变成 `flow`。整个类里一个装饰器都不用写，babel 配置也能省掉一整套。

不是说装饰器写法不行，存量项目照跑不误，只是新写的代码没必要再背那套配置负担。MobX 6 之后的完整用法、React 18 并发渲染下的适配，还有它在 RSC 时代的处境，我在 [MobX 核心概念解析与 React 协同最佳实践](https://feinterview.poetries.top/blog/mobx-react-best-practices) 里写得更细。至于今天从零起一个项目该选 MobX、Zustand 还是 Redux Toolkit，可以看 [React 状态管理方案对比](https://feinterview.poetries.top/blog/react-state-management-comparison)。

## 五、应用案例

一个可以直接跑起来的模板项目：https://github.com/poetries/react-mobx-template

建议的读法是先把 store 目录翻一遍，看清楚它怎么按业务模块拆 store，再看组件里 `observer` 挂在哪一层。MobX 项目的可维护性，八成取决于 store 拆得合不合理，而不是 API 用得熟不熟。

## 总结

MobX 的核心其实就四个概念：用 `observable` 标记数据源，用 `computed` 声明派生值，用 `action` 收口所有修改，用 `observer` 让组件自动订阅它读到的字段。剩下三个 API 是补充，`autorun` 管无条件的副作用，`reaction` 管有条件触发的副作用，`flow` 管可取消的异步流程。

它和 Redux 的差别不在语法糖多少，而在数据流的形状。Redux 是「所有变化走同一条管道，可回溯」，MobX 是「谁读了谁被通知，最小更新」。前者用约束换可预测性，后者用自由换开发效率。领域模型清晰、对象引用密集的应用（可视化编辑器、复杂表单）用 MobX 会很顺手；需要强流程约束和完整审计链路的场景，Redux 那套仍然更稳。

最后记住三条最容易踩的：`observer` 只订阅本次 render 里真正读过的字段；computed 的缓存要有人观察才生效；`autorun` 和 `reaction` 返回的 disposer 一定要清理。装饰器写法现在换成 `makeAutoObservable` 就好，心智模型完全没变。

## 参考

- [MobX 中文文档](https://cn.mobx.js.org/)
- [MobX 官方文档](https://mobx.js.org/)
- [MobX 6 迁移指南](https://mobx.js.org/migrating-from-4-or-5.html)
- [mobx-react 官方文档](https://mobx-react.js.org/)
- [react-mobx-template 示例项目](https://github.com/poetries/react-mobx-template)
- [前端进阶之旅](https://interview.poetries.top)
