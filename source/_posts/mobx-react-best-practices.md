---
title: MobX 核心概念解析与 React 协同最佳实践，以及 2026 年的替代选择
date: 2024-11-26 12:40:12
description: 拆解 MobX 的 observable、computed、action、observer、autorun、reaction、flow 七个核心 API，配完整计数器案例和 Store 组织实践，并说清楚在 React 18/19 与 RSC 时代 MobX 的现状和什么时候该换方案。
tags:
- React
- MobX
- 状态管理
- 前端工程化
- Redux
categories: Front-End
---

接手过一个用 Redux 写的后台系统，一个订单详情页要改三个字段，我得在 `actionTypes.js`、`actions/order.js`、`reducers/order.js` 三个文件之间来回跳，写完还要回组件里补 `mapStateToProps`。四十多行样板代码，换来的实际逻辑就是 `state.detail = payload`。那阵子我特别理解为什么会有人转向 MobX。

这篇把 MobX 的核心 API 逐个拆一遍，配一个能跑的计数器和一套 Store 组织方式。文章原本是 2024 年写的，这次补了一节 2026 年的现状：MobX 在 React 18 并发渲染和 React Server Components 下会遇到什么，以及什么情况下我会建议换成别的方案。老代码怎么写的我照原样留着，新的判断另起一节说，两边不混。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- MobX 想解决 Redux 的哪几个具体痛点，以及它付出了什么代价
- `observable`、`computed`、`action` 三块基石的职责边界
- `observer` 是怎么让组件跟着数据自动重渲的
- `autorun`、`reaction`、`flow` 各自的适用场景和常见误用
- 一个完整可跑的计数器示例，把上面所有概念串起来
- Store 组织、严格模式配置、异步处理的工程化做法
- React 18 并发渲染和 RSC 之下 MobX 的现状，以及 2026 年的替代选择

## 一、MobX 想解决什么

### 1.1 Redux 的三个痛点

在 MobX 出现之前，React 项目的状态管理默认就是 Redux。它采用单一数据源，所有状态存在一个只读的 store 里，只能通过 action 和 reducer 更新。逻辑清晰，但用久了有三个地方磨人。

第一个是状态冗余更新。Redux 的状态是不可变的，每次更新都要创建新的状态对象，结果是与 store 连接的 UI 组件都会重新渲染，即使它们只依赖状态里的一小块数据。你可以用 `PureRenderMixin` 或者 `reselect` 做缓存优化，但这是额外的开发成本，而且优化对不对得靠自己盯。

第二个是样板代码。写 action types、action creators、reducers，一个再简单的功能也得把这套模板走一遍。

第三个是学习曲线。要理解 Redux 的数据流，得先搞明白 action、reducer、middleware 这几层怎么串，对新人不太友好。

### 1.2 MobX 的三块基石

MobX 走的是完全不同的路子。它用 JavaScript 的代理（Proxy）机制自动追踪状态的读写，谁读了哪个字段它记着，那个字段变了就通知谁。这套模式叫响应式编程。

拆开看是三件事。可观察的状态（Observable State），把普通 JS 对象转成可观察对象，任何修改都能被追踪。自动推导（Computed Values），根据现有状态算出衍生值，和 Excel 的公式一个意思，改了 A1 单元格，依赖它的公式自动重算。响应式副作用（Reactions），状态变化时自动执行副作用，比如更新 UI、打日志、发请求。

第三件里最重要的那个 reaction，就是 React 组件本身。

### 1.3 和 Redux 摆在一起看

| 特性 | MobX | Redux |
|------|------|-------|
| 数据结构 | 多 `store`，支持普通对象 | 单一 `store`，不可变数据 |
| 更新方式 | 直接修改，可选严格模式 | 只能通过 `action` 和 `reducer` |
| 依赖追踪 | 自动追踪，按需更新 | 手动订阅，可能过度渲染 |
| 代码量 | 简洁，样板代码少 | 较多模板代码 |
| 学习成本 | 较低 | 较高 |
| 调试工具 | 友好的时间旅行调试 | 强大的 DevTools |

从数据流的覆盖范围看，Redux 管的是 `STORE -> VIEW -> ACTION` 一整圈，MobX 更关注 `STORE -> VIEW` 这一段。action 在 MobX 里是可选的，你完全可以直接改状态。方便归方便，代价是状态的修改入口不统一，出了问题不好回溯改的是谁。

### 1.4 优点和缺点

优点有三条。

第一是基于运行时的数据订阅。MobX 的数据依赖始终保持最小，而且是运行时自动追踪的。用 Redux 的时候你可能一不小心就多订阅或者少订阅了数据，多了性能差，少了不更新，都得靠 `PureRenderMixin` 和 `reselect` 给 selector 做缓存来补。

第二是可以用面向对象的方式组织领域模型。能抽出清晰 domain model 的场景下，OOP 组织起来是真的顺手。MobX 支持用引用的方式引用数据，很容易形成模型图（model graph），一个订单能直接拿到它的用户对象，而不是拿一个 userId 再去别的 slice 里查。

第三是改数据自然。MobX 基于原生的 JS 对象、数组和 Class 实现，改数据没有额外语法成本，不用每次都返回一个新对象，直接操作就行。

缺点也有三条。

第一是最佳实践和社区积累相对少。MobX 出现得晚，你遇到的问题可能社区还没人遇到过，而且它没有很好的扩展和插件机制。

第二是随意修改 store 的风险。Redux 里唯一能改数据的地方是 reducer，这保证了应用的可预测性；MobX 可以在任何地方改数据触发更新，用起来会有点不踏实。这个问题后来是有解的，MobX 从 2.2 版本开始加入了 action 支持，开启 strict mode 之后只有 action 能改数据，修改入口就收敛回来了。

第三是逻辑层的限制。如果更新逻辑没法很好地封装进 domain class，用 Redux 会更合适。另外 MobX 缺少类似 `redux-saga` 那样的库，复杂的业务流程编排不知道放哪合适。

## 二、核心 API 逐个拆

### 2.1 observable

`observable` 负责把普通属性变成可观察属性。被标记的属性暴露给观察者，值一变，所有依赖它的地方都会收到通知。可观察的值可以是基本类型、引用类型、普通对象、类实例、数组和 Map。

现在推荐的入口是 `makeAutoObservable`，在构造函数里调一次，它会自动推断每个成员该是什么：

```javascript
import { makeAutoObservable } from 'mobx'

class Counter {
  // 基本类型
  count = 0
  name = '计数器'

  // 引用类型
  user = {
    name: '张三',
    age: 25
  }

  // 数组
  items = []

  constructor() {
    // makeAutoObservable 会自动推断类型并添加相应的装饰器
    makeAutoObservable(this)
  }

  increment() {
    this.count++
  }

  decrement() {
    this.count--
  }

  setName(name) {
    this.name = name
  }
}

const counter = new Counter()
```

推断规则很直白，普通属性变成 `observable`，getter 变成 `computed`，普通方法变成 `action`，generator 方法变成 `flow`。

老项目里更常见的是装饰器写法，需要配 babel 才能用：

```javascript
// 使用装饰器写法
import { observable, computed, action } from 'mobx'

class Counter {
  @observable count = 0
  @observable title = 'this is about page'
  @observable num = 0

  // computed - 计算值
  @computed get getUserInfo() {
    return `我是computed经过计算的getter, current num: ${this.num}`
  }

  // action - 动作
  @action.bound add() {
    this.num++
  }

  @action.bound reduce() {
    this.num--
  }
}
```

这套写法在 MobX 4/5 时代是主流，现在仍然支持，但从 MobX 6 开始它不再是默认路径。原因是装饰器提案长期没定稿，MobX 6 把 `makeObservable` / `makeAutoObservable` 提为主入口，装饰器降级成可选语法糖，而且用装饰器时仍然要在构造函数里调一次 `makeObservable(this)`。新写的代码建议直接用 `makeAutoObservable`，能省掉整套 babel 装饰器配置。

`@action.bound` 里的 `.bound` 是把方法绑到实例上，这样你可以直接 `onClick={counter.add}` 而不用 `() => counter.add()`。`makeAutoObservable` 默认不做这个绑定，需要的话得显式写 `{ add: action.bound }`。

### 2.2 computed

计算值是根据现有状态或其它计算值衍生出来的值。它自带缓存，基础值没变的话，重复读取直接返回缓存，不会引起虚拟 DOM 的重新渲染。

```javascript
import { makeAutoObservable, computed } from 'mobx'

class OrderStore {
  items = []
  taxRate = 0.1

  constructor() {
    makeAutoObservable(this, {
      // 显式声明 computed 属性
      subtotal: computed,
      tax: computed,
      total: computed
    })
  }

  get subtotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  get tax() {
    return this.subtotal * this.taxRate
  }

  get total() {
    return this.subtotal + this.tax
  }

  addItem(item) {
    this.items.push(item)
  }
}
```

注意 `total` 依赖 `tax`，`tax` 依赖 `subtotal`，MobX 会自己把这条依赖链排好，`items` 一变，三个值按顺序失效重算。这条链你不用手写任何订阅代码。

有个坑要注意。computed 的缓存只在它被某个 reaction 观察时才生效，如果你在组件外面直接读一个没人观察的 computed，MobX 会每次都重新计算。这在写单元测试或者在事件回调里直接读 store 时容易踩到，表现是「明明加了 computed 却没变快」。

computed 还支持 setter 做逆向推导：

```javascript
class Foo {
  @observable length = 2

  @computed get squared() {
    return this.length * this.length
  }

  set squared(value) {
    // 这是一个自动的动作，不需要注解
    // 设置 squared 时，自动推导出 length
    this.length = Math.sqrt(value)
  }
}
```

这个特性用得不多，但在做「双向绑定的换算单元」时挺好使，比如摄氏度和华氏度两个输入框互相推导。

### 2.3 action

只有在 action 里才能修改 state。这条规则默认是不强制的，要靠严格模式打开：

```javascript
import { configure, makeAutoObservable, runInAction } from 'mobx'

// 开启严格模式 - 只有 action 可以修改状态
configure({ enforceActions: 'always' })

class Counter {
  count = 0

  constructor() {
    makeAutoObservable(this)
  }

  increment() {
    this.count++
  }

  decrement() {
    this.count--
  }

  async fetchData() {
    // 在异步操作中使用 runInAction
    const data = await fetch('/api/data').then(r => r.json())
    runInAction(() => {
      this.data = data
    })
  }
}
```

`runInAction` 是给异步流程准备的。为什么异步里非得包一层？因为 action 的边界是同步函数体，`await` 之后的代码已经跑在另一个微任务里了，MobX 追踪不到，严格模式下会直接报错。

```javascript
import { runInAction } from 'mobx'

async function fetchUser() {
  const user = await api.getUser()

  // 所有的状态更新都放在 runInAction 中
  runInAction(() => {
    this.user = user
    this.loading = false
    this.error = null
  })
}
```

包在一起还有个额外好处，三个字段的修改会被合并成一次通知，组件只重渲一次，而不是三次。

### 2.4 observer

`observer` 是 `mobx-react` 提供的高阶组件，把 React 组件变成响应式组件。组件 render 里读到的任何 observable 变了，组件就自动重渲。

```javascript
import React from 'react'
import { observer } from 'mobx-react'
import { makeAutoObservable } from 'mobx'

class Counter {
  count = 0

  constructor() {
    makeAutoObservable(this)
  }

  increment() {
    this.count++
  }

  decrement() {
    this.count--
  }
}

const counter = new Counter()

// 使用 observer 包裹组件
@observer
class CounterView extends React.Component {
  render() {
    return (
      <div>
        <p>计数: {counter.count}</p>
        <button onClick={() => counter.increment()}>+</button>
        <button onClick={() => counter.decrement()}>-</button>
      </div>
    )
  }
}

// 或者使用 hook 写法 (mobx-react-lite)
const CounterView2 = observer(() => {
  return (
    <div>
      <p>计数: {counter.count}</p>
      <button onClick={() => counter.increment()}>+</button>
      <button onClick={() => counter.decrement()}>-</button>
    </div>
  )
})
```

它的原理，用一句话说就是用 `mobx.autorun` 包住了组件的 render 函数，render 里读了什么就订阅什么，订阅的东西变了就强制刷新组件。函数组件版本（`mobx-react-lite`）后来在实现上换掉了这套，改成建一个 `Reaction` 再配合 React 18 的 `useSyncExternalStore` 对外暴露快照，目的是在并发渲染下避免撕裂。心智模型没变，「读了才订阅」这条依然成立。

这条规则反过来也成立，没读到就不订阅。所以下面这种写法会失效：

```javascript
// 失效：props 在 observer 外面就被解构了，读取发生在父组件
const Bad = observer(({ count }) => <span>{count}</span>)

// 正确：在 observer 内部读 store 的属性
const Good = observer(({ store }) => <span>{store.count}</span>)
```

我一开始也是这么想的，以为 `observer` 是给组件装了个全局监听器，实际上它监听的只有本次 render 期间真正被读过的那几个字段。想通这一点，很多「为什么不更新」的问题就自己解释了。

### 2.5 autorun

`autorun` 在 observable 的值初始化或者改变时自动运行：

```javascript
import { autorun, makeAutoObservable } from 'mobx'

class Person {
  name = ''
  age = 0

  constructor() {
    makeAutoObservable(this)
  }
}

const person = new Person()

// 当 name 或 age 变化时，自动执行回调
autorun(() => {
  console.log(`姓名: ${person.name}, 年龄: ${person.age}`)
})

person.name = '张三' // 输出: 姓名: 张三, 年龄: 0
person.age = 25     // 输出: 姓名: 张三, 年龄: 25
```

选择标准很清楚。想响应式地产出一个能被其它 observer 使用的值，用 `computed`；不想产出新值、只想产生一个效果（打日志、发请求、写 localStorage），用 `autorun`。

`autorun` 返回一个 disposer 函数，用完记得调它清理，尤其是在组件里创建的时候。忘了清理就是一个持续订阅的内存泄漏。

### 2.6 reaction

`reaction` 和 computed 很像，但它不产出新值，而是产生副作用，比如打印到控制台、发网络请求、增量更新 React 组件树以修补 DOM。它在响应式编程和命令式编程之间搭了座桥。

```javascript
import { reaction, makeAutoObservable } from 'mobx'

class DataStore {
  data = null
  loading = false

  constructor() {
    makeAutoObservable(this)
  }

  async fetchData() {
    this.loading = true
    const response = await fetch('/api/data')
    const data = await response.json()

    reaction(
      // data 变化时执行的函数
      () => this.data,
      // 副作用逻辑
      (data, prevData) => {
        if (data && !prevData) {
          console.log('数据加载完成:', data)
        }
      }
    )

    this.data = data
    this.loading = false
  }
}
```

`reaction` 接两个函数，第一个是数据追踪函数，第二个是副作用函数。和 `autorun` 的区别在于它不会在初始化时立即执行，只有追踪的数据真的变了才跑。

这段代码里藏着一个真实的坑，我把它留在这儿是因为它太典型了：`reaction` 写在 `fetchData` 内部，意味着每调一次 `fetchData` 就新建一个 reaction，而且从来没人清理。调十次就有十个 reaction 在监听同一个 `data`，日志打十遍，组件一直不卸载的话它们会一直堆着。正确的位置是在 `constructor` 里注册一次，把返回的 disposer 存起来，在 store 销毁时调用。

### 2.7 flow

`flow()` 接收 generator 函数，用 `yield` 代替 `await`，异步代码会自动被 action 包装：

```javascript
import { makeAutoObservable, flow } from 'mobx'

class GitHubStore {
  githubProjects = []
  state = 'pending' // 'pending' / 'done' / 'error'

  constructor() {
    makeAutoObservable(this, {
      fetchProjects: flow
    })
  }

  // 使用 flow 处理异步操作
  *fetchProjects() {
    this.githubProjects = []
    this.state = 'pending'

    try {
      const projects = yield fetch('/api/projects').then(r => r.json())
      const filteredProjects = this.preprocess(projects)

      // 异步代码自动会被 action 包装
      this.state = 'done'
      this.githubProjects = filteredProjects
    } catch (error) {
      this.state = 'error'
    }
  }

  preprocess(projects) {
    return projects.filter(p => p.isPublic)
  }
}
```

好处是代码读起来跟同步一样，同时不用手写 `runInAction`。还有个不太被提到的优点是 `flow` 返回的 promise 带 `cancel()` 方法，能取消进行中的请求流程，做搜索联想这类会连续触发的场景很有用。

代价是 generator 语法对团队新人有一点门槛，TypeScript 下的类型推断也不如 async 函数舒服。项目里我一般的做法是简单的异步用 `async` 加 `runInAction`，需要取消能力的用 `flow`。

## 三、计数器完整示例

把上面的概念串成一个能跑的例子：

```javascript
import React, { Component } from 'react'
import { render } from 'react-dom'
import { makeAutoObservable, runInAction } from 'mobx'
import { observer } from 'mobx-react'

// 第一步：定义数据 Store
class CounterStore {
  number = 0
  loading = false

  constructor() {
    makeAutoObservable(this)
  }

  // action - 增加
  increment() {
    this.number++
  }

  // action - 减少
  decrement() {
    this.number--
  }

  // action - 重置
  reset() {
    this.number = 0
  }

  // computed - 获取描述信息
  get description() {
    return `当前计数: ${this.number}`
  }

  // computed - 判断是否为偶数
  get isEven() {
    return this.number % 2 === 0
  }

  // 异步 action
  async incrementAsync() {
    this.loading = true
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 1000))

    runInAction(() => {
      this.number++
      this.loading = false
    })
  }
}

// 创建 store 实例
const counterStore = new CounterStore()
```

Store 这部分五个概念全用上了。`number` 和 `loading` 是 observable；`description` 和 `isEven` 是 computed，基于 `number` 自动推导；`increment` / `decrement` / `reset` 是 action；`incrementAsync` 演示了异步里怎么用 `runInAction` 收口。

视图部分只做一件事，把 store 的字段读出来渲染，加上 `observer` 就自动跟着变：

```javascript
// 第二步：创建响应式组件
@observer
class CounterView extends Component {
  render() {
    const { number, loading, description, isEven } = counterStore

    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>MobX 计数器示例</h2>

        <div style={{ fontSize: '48px', margin: '20px 0' }}>
          {number}
        </div>

        <p>{description}</p>
        <p>{isEven ? '偶数' : '奇数'}</p>

        {loading && <p>加载中...</p>}

        <div style={{ marginTop: '20px' }}>
          <button onClick={() => counterStore.decrement()}>- 减少</button>
          <button onClick={() => counterStore.reset()} style={{ margin: '0 10px' }}>重置</button>
          <button onClick={() => counterStore.increment()}>+ 增加</button>
          <button
            onClick={() => counterStore.incrementAsync()}
            disabled={loading}
            style={{ marginLeft: '10px' }}
          >
            异步增加
          </button>
        </div>
      </div>
    )
  }
}

// 第三步：渲染应用
const App = () => <CounterView />

render(<App />, document.getElementById('root'))
```

最后这行 `render(<App />, ...)` 是 React 17 及以前的写法，React 18 之后要换成 `createRoot`，不换的话应用会跑在 legacy 模式下，自动批处理和并发能力都不生效。具体改法我在 [React 18 新特性与升级指南](https://feinterview.poetries.top/blog/react-18-new-features) 里写过。

这里还有个细节值得停一下：`const { number, loading, description, isEven } = counterStore` 这行解构是在 `render` 内部做的，所以读取发生在 observer 的追踪范围里，订阅能建立起来。要是把解构挪到组件外面，比如在模块顶层写一次，订阅就断了，页面永远不更新。

## 四、工程化落地的几条实践

### 4.1 Store 的组织方式

实际项目按功能模块拆 Store，再用一个 RootStore 串起来：

```javascript
// stores/RootStore.js
import { createContext, useContext } from 'react'
import { makeAutoObservable } from 'mobx'

class RootStore {
  constructor() {
    makeAutoObservable(this)
  }

  // 用户模块
  userStore = new UserStore(this)

  // 商品模块
  productStore = new ProductStore(this)

  // 订单模块
  orderStore = new OrderStore(this)
}

// 创建根 store 实例
const rootStore = new RootStore()

// 创建 Context
const StoreContext = createContext(rootStore)

// 自定义 Hook
export const useStore = () => {
  return useContext(StoreContext)
}

// 分别导出子 store
export const useUserStore = () => useStore().userStore
export const useProductStore = () => useStore().productStore
export const useOrderStore = () => useStore().orderStore
```

子 store 的构造函数里接一个 `rootStore` 引用，这样 `orderStore` 需要当前用户时可以直接 `this.rootStore.userStore.current`，不用把数据来回搬。这是 MobX 相比 Redux 切片模式最舒服的地方之一，模型之间可以互相持有引用。

要注意的是这里的 `rootStore` 是模块级单例。纯客户端渲染没问题，一旦上了 SSR 就必须改成每个请求新建一个实例，否则 A 用户的数据会串到 B 用户的响应里。这个坑在下一节还会提到。

### 4.2 严格模式配置

```javascript
import { configure } from 'mobx'

// 配置 MobX 严格模式
configure({
  // 'always' - 强制所有状态修改都在 action 中
  // 'observed' - 只对观察中的状态强制此规则
  // false - 关闭严格模式（默认）
  enforceActions: 'always',

  computedRequiresReaction: false,
  reactionRequiresObservable: true,
  isolateGlobalState: false
})
```

这四项的含义按官方文档对一下比较稳妥，网上流传的注释有不少是错的。`enforceActions` 控制的是「必须在 action 里改状态」；`computedRequiresReaction` 为 true 时，在反应式上下文之外读 computed 会告警，用来发现前面提到的「缓存没生效」问题；`reactionRequiresObservable` 为 true 时，创建了却没有任何 observable 依赖的 reaction 会告警，能抓出写错的追踪函数；`isolateGlobalState` 跟调试无关，它解决的是页面里同时存在多份 MobX 实例（比如库自带了一份）时全局状态互相干扰的问题。

新项目我一般只开 `enforceActions: 'always'`，开发环境再打开另外两个告警，生产环境关掉。

### 4.3 组件中的使用方式

```javascript
import React from 'react'
import { useStore } from '../stores/RootStore'
import { observer } from 'mobx-react'

// 方式一：使用 observer HOC（类组件）
@observer
class UserProfile extends React.Component {
  render() {
    const { user, loading } = this.props.userStore

    if (loading) return <div>加载中...</div>

    return (
      <div>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
      </div>
    )
  }
}

// 方式二：使用 observer 包函数组件 (mobx-react-lite)
const UserProfile2 = observer(() => {
  const { userStore } = useStore()
  const { user, loading } = userStore

  if (loading) return <div>加载中...</div>

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  )
})
```

方式一这里我改了一处。网上很多示例（包括这篇文章的早期版本）会在类组件的 `render` 里直接调 `useStore()`，那是不合法的，Hook 不能在类组件里用，跑起来会报 invalid hook call。类组件要拿 store 只有两条路，从 props 传进去，或者用 `mobx-react` 的 `inject`（现在不推荐了）。新代码建议一律用函数组件加方式二。

### 4.4 异步操作

两种写法都可以，看你需不需要取消能力：

```javascript
import { flow, runInAction, makeAutoObservable } from 'mobx'

class ApiStore {
  data = null
  error = null

  constructor() {
    makeAutoObservable(this, {
      fetchData: flow
    })
  }

  // 方式一：使用 flow
  *fetchData() {
    this.error = null

    try {
      const response = yield fetch('/api/data')
      const data = yield response.json()

      // flow 会自动包装异步代码到 action 中
      this.data = data
    } catch (error) {
      this.error = error.message
    }
  }

  // 方式二：使用 runInAction
  async fetchData2() {
    this.error = null

    try {
      const response = await fetch('/api/data')
      const data = await response.json()

      // 手动包装到 runInAction
      runInAction(() => {
        this.data = data
      })
    } catch (error) {
      runInAction(() => {
        this.error = error.message
      })
    }
  }
}
```

方式二有个容易漏的地方，`catch` 分支里的状态修改同样要包 `runInAction`，因为它也在 `await` 之后。上面这段是写全了的，实际项目里漏掉 catch 分支的情况我见过不少，表现是平时没事、一报错就抛 MobX 的严格模式异常。

### 4.5 性能相关

第一条是只订阅需要的状态，别在组件里顺手把整个 store 摊开：

```javascript
// 不推荐：把整个 store 拿进来，容易连带读到不相关的字段
const { userStore } = useStore()
const { user } = userStore

// 推荐：只取需要的属性
const user = useUserStore().user
```

第二条是列表优化。原文这里给过一段用 `shallow` 配 `observer` 的示例，我这次把它拿掉了，因为那个写法是错的：`mobx` 并没有导出可以这样用的 `shallow`，`observer` 的第二个参数也只支持 `forwardRef` 这类选项，传别的不会生效。

MobX 里列表优化的正确做法是拆组件。把每个 `Item` 单独包一层 `observer`，父组件只订阅 `store.items` 这个数组本身（长度和顺序），单个 item 的字段变化只会触发对应的子组件重渲：

```javascript
const Item = observer(({ item }) => <li>{item.name}</li>)

const ItemList = observer(({ store }) => (
  <ul>
    {store.items.map(item => (
      <Item key={item.id} item={item} />
    ))}
  </ul>
))
```

这是 MobX 相比 Redux 明显省心的地方，粒度天然就在字段级别，不需要额外写 selector 和比较函数。

第三条是读写分离，把只读的展示组件和触发修改的交互组件拆开，避免一个大组件同时订阅一堆不相关的字段。

## 五、2026 年再看 MobX

上面这些是 MobX 本身的用法，写法到今天依然成立。但技术选型这件事得看环境，React 这几年变化不小，这一节说说现在的情况。

### 5.1 MobX 6 之后的写法变化

前面提过一次，这里集中说。MobX 6 把装饰器从默认路径挪成了可选项，主入口变成 `makeObservable` 和 `makeAutoObservable`，同时默认启用 Proxy 实现（不再需要 `observable.map` 这类绕过 defineProperty 限制的写法）。

文章第一节里那句「MobX 从 2.2 版本开始加入 action 支持」是当年的说法，对应到现在，严格模式的配置项已经统一到 `configure({ enforceActions })`，行为和描述是一致的，只是版本号早就翻篇了。老教程里的 `@observable` / `@action` 写法你还能跑，只是要多配一套 babel 装饰器插件。

### 5.2 React 18 并发渲染下的适配

React 18 的并发渲染引入了撕裂问题，任何在 React 之外维护状态的库都得处理。MobX 的应对方式是让 `mobx-react-lite` 的 `observer` 改走 `useSyncExternalStore`，官方在 3.x 的后期版本里完成了这个切换，具体版本号建议查 changelog 确认。

对使用者的影响就一条：升 React 18 的时候，把 `mobx`、`mobx-react` / `mobx-react-lite` 一起升到匹配的版本，别只升 React。并发渲染和 `useSyncExternalStore` 的来龙去脉在 [React 18 并发机制深度解析](https://feinterview.poetries.top/blog/react-18-concurrency) 里讲过。

### 5.3 RSC 和 App Router 是真的不合

这是我认为现在最值得说清楚的一点。

React Server Components 的模型是，服务端组件的输出要能序列化后传到客户端。MobX 的 store 是 class 实例，带方法、带 Proxy、带内部的 `$mobx` 元数据，这些东西没法序列化，也就没法跨越 server 和 client 的边界。结果是 MobX 只能整个活在客户端组件里，所有用到它的组件都得挂 `'use client'`。

再叠上前面说的模块级单例问题。Next.js App Router 的服务端是长驻进程，模块作用域跨请求共享，一个 `export const rootStore = new RootStore()` 就足够让 A 用户的数据串到 B 用户那里。要绕开就得写一套「服务端每请求新建、客户端复用单例」的初始化逻辑，能做，但很啰嗦。

所以我的判断是：新起的 Next.js App Router 项目不要选 MobX。不是说 MobX 不行，而是它的设计前提（可变的、长生命周期的、带方法的领域对象）和 RSC 的设计前提（可序列化、无状态、按请求隔离）本来就是拧着的，硬凑只会两头都别扭。

至于 React Compiler，它的优化建立在组件是纯函数、数据流可静态分析的假设上，MobX 这种运行时代理追踪的模式跟它是两套思路。这块我没在生产项目上验证过，具体兼容性以官方说明为准，不敢下结论。

### 5.4 现在会选什么

如果今天从零开始，我的默认选择大致是这样。

客户端全局状态优先 Zustand，API 面很小，本身就是基于 `useSyncExternalStore` 建的，SSR 和 RSC 场景下的用法官方文档写得很清楚。细节可以看 [Zustand 状态管理实践](https://feinterview.poetries.top/blog/zustand-react-state-management)。

服务端数据不要放进全局 store，交给 TanStack Query 或者框架自带的取数能力，缓存、失效、重试这些它比你手写得好。把「服务端数据」和「客户端 UI 状态」分开，是这几年状态管理最大的一个认知变化。

想要接近 MobX 那种「直接改对象就自动更新」的心智，可以看 Valtio，它同样基于 Proxy，体积比 MobX 小很多，也支持并发渲染。原子化拆分的话是 Jotai。团队大、需要强约定的项目，Redux Toolkit 依然是稳妥选择，它早就不是当年那个要写三个文件的 Redux 了。

这几个方案的横向对比我单独写过一篇 [React 状态管理方案对比](https://feinterview.poetries.top/blog/react-state-management-comparison)，这里不展开。

### 5.5 什么情况下 MobX 仍然合适

反过来说，有几类项目 MobX 依然是很好的选择。

领域模型复杂、对象之间引用关系密集的应用，比如在线设计工具、可视化编辑器、复杂表单引擎，用 OOP 组织领域对象加自动依赖追踪，比手写 selector 舒服太多。纯客户端渲染的后台系统和 Electron 应用，没有 RSC 那套约束，MobX 的优势能完整发挥。还有就是已经有大量 MobX 代码的存量项目，它现在依然在维护，没有非迁不可的理由。

技术选型这事看的是匹配度，不是新旧。

## 总结

MobX 的核心其实就一句话：把状态标成可观察的，把派生值标成 computed，把修改收进 action，然后让组件通过 `observer` 自动订阅它读到的字段。围绕这四个概念，`autorun` 负责无返回值的副作用，`reaction` 负责有条件触发的副作用，`flow` 负责可取消的异步流程。

工程化上有三条我认为最值得守住的。Store 按业务模块拆，用 RootStore 串引用；严格模式开 `enforceActions: 'always'`，把修改入口收敛回来；列表优化靠拆子组件加 `observer`，而不是找什么比较函数。

至于要不要在新项目用它，我的结论是分场景。纯客户端、领域模型重的应用，MobX 依然好用；Next.js App Router 这类 RSC 项目，它和框架的设计前提是冲突的，建议换 Zustand 或者 Jotai，服务端数据另外交给 TanStack Query。存量的 MobX 项目不用急着迁，把 `mobx-react` 升到支持 `useSyncExternalStore` 的版本，React 18/19 上跑得挺稳。

## 参考

- [MobX 官方文档](https://mobx.js.org/)
- [MobX React 集成](https://mobx-react.js.org/)
- [MobX 6 迁移指南](https://mobx.js.org/migrating-from-4-or-5.html)
- [Redux FAQ - When should I use Redux](https://redux.js.org/faq/general#when-should-i-use-redux)
- [useSyncExternalStore - React 官方文档](https://react.dev/reference/react/useSyncExternalStore)
- [Zustand 官方文档](https://zustand.docs.pmnd.rs/)
- [前端进阶之旅](https://interview.poetries.top)
