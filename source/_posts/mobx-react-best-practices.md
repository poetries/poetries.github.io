---
title: MobX核心概念解析，与React协同构建响应式应用的最佳实践
date: 2024-11-26 12:40:12
description: 深度解读MobX响应式状态管理库的核心概念，详细对比Redux与MobX的差异，全面介绍observable、computed、action、observer等API用法，通过计数器案例和最佳实践帮助开发者快速上手。
tags:
- React
- MobX
- 状态管理
- 前端工程化
- Redux
categories: Front-End
---

在前端应用开发中，状态管理一直是核心议题。随着应用复杂度不断攀升，如何高效、可维护地管理应用状态成为开发者必须面对的挑战。`MobX` 作为一款响应式状态管理库，以其简洁的API和优秀的性能表现赢得了众多开发者的青睐。本文将带你深入了解 `MobX` 的核心概念，并通过实际案例展示如何与 `React` 协同构建响应式应用。

## 一、为什么选择MobX

### 1.1 传统状态管理的痛点

在 `MobX` 出现之前，开发者通常使用 `Redux` 来管理应用状态。`Redux` 采用单一数据源模式，所有状态存储在一个只读的 `store` 中，只能通过 `action` 和 `reducer` 来更新状态。这种方式虽然逻辑清晰，但在实际应用中存在一些痛点：

**状态冗余更新问题**：由于 `Redux` 的状态是不可变的，每次更新都需要创建新的状态对象。这导致与 `store` 连接的 `UI` 组件都会重新渲染，即使它们只依赖状态中的部分数据。虽然可以使用 `PureRenderMixin` 或 `reselect` 来优化，但增加了额外的开发成本。

**样板代码繁多**：使用 `Redux` 需要编写大量的 `action types`、`action creators`、`reducers`，即使是一个简单的功能也需要完整的模板代码。

**学习曲线陡峭**：理解 `Redux` 的数据流需要掌握 `action`、`reducer`、`middleware` 等概念，对新手不太友好。

### 1.2 MobX的核心理念

`MobX` 采用了完全不同的设计理念：利用 `JavaScript` 的代理（Proxy）机制，自动追踪状态的变化并更新依赖它的组件。这种方式被称为**响应式编程**。

`MobX` 的核心理念可以概括为三点：

1. **可观察的状态（Observable State）**：将普通的 `JavaScript` 对象转换为可观察的对象，任何对状态的修改都能被追踪。

2. **自动推导（Computed Values）**：根据现有状态自动计算衍生值，类似 Excel 的公式功能。

3. **响应式副作用（Reactions）**：当状态变化时自动执行副作用操作，如更新 `UI`、打印日志、发起网络请求等。

### 1.3 MobX与Redux对比

| 特性 | MobX | Redux |
|------|------|-------|
| 数据结构 | 多 `store`，支持普通对象 | 单一 `store`，不可变数据 |
| 更新方式 | 直接修改，可选严格模式 | 只能通过 `action` 和 `reducer` |
| 依赖追踪 | 自动追踪，按需更新 | 手动订阅，可能过度渲染 |
| 代码量 | 简洁，样板代码少 | 较多模板代码 |
| 学习成本 | 较低 | 较高 |
| 调试工具 | 友好的时间旅行调试 | 强大的 DevTools |

从数据流角度看，`Redux` 管理的是 `STORE -> VIEW -> ACTION` 的完整闭环，而 `MobX` 更关注 `STORE -> VIEW` 的部分。`action` 在 `MobX` 中是可选的，你可以直接修改状态，但这也带来了一个潜在问题：状态的修改入口不统一。

### 1.4 MobX的优缺点分析

**优点**

第一点是基于运行时的数据订阅。`MobX` 的数据依赖始终保持最小，而且是基于运行时自动追踪的。相比之下，使用 `Redux` 时可能一不小心就多订阅或者少订阅了数据，导致性能问题。因此在使用 `Redux` 时，我们需要借助 `PureRenderMixin` 以及 `reselect` 对 `selector` 做缓存优化。

第二点是通过面向对象的方式组织领域模型。`OOP` 的方式在某些场景下会比较方便，尤其是容易抽取 `domain model` 的时候。由于 `MobX` 支持引用方式引用数据，可以非常容易形成模型图（model graph），这有助于更好地理解应用结构。

第三点是修改数据方便自然。`MobX` 基于原生的 `JavaScript` 对象、数组和 `Class` 实现，修改数据不需要额外语法成本，也不需要始终返回一个新的数据，而是直接操作数据。

**缺点**

第一点是缺少最佳实践和社区积累。`MobX` 相对较新，遇到的问题可能社区都没有遇到过。并且，`MobX` 并没有很好的扩展和插件机制。

第二点是随意修改 `store` 的风险。我们都知道 `Redux` 里唯一可以改数据的地方是 `reducer`，这样可以保证应用的安全稳定；而 `MobX` 可以随意修改数据，触发更新，给人一种不安全的感觉。不过最新的 `MobX 2.2` 版本加入了 `action` 支持，并且开启 `strict mode` 之后，就只有 `action` 可以对数据进行修改，限制数据的修改入口，可以解决这个问题。

第三点是逻辑层的限制。如果更新逻辑不能很好地封装在 `domain class` 里，用 `Redux` 会更合适。另外，`MobX` 缺少类似 `redux-saga` 的库，业务逻辑的整合不知道放哪合适。

## 二、核心API详解

### 2.1 observable - 定义可观察状态

`@observable` 装饰器用于将 `JavaScript` 对象属性转换为可观察的属性。被装饰的属性会暴露出来供观察者使用，当属性值发生变化时，所有依赖该属性的地方都会收到通知。

`Observable` 值可以是 `JavaScript` 基本数据类型、引用类型、普通对象、类实例、数组和映射。

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

如果使用装饰器模式，需要配置 `babel` 支持：

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

### 2.2 computed - 计算属性

计算值（`Computed Values`）是可以根据现有的状态或其它计算值衍生出的值。用于获取由基础 `state` 衍生出来的值，如果基础值没有变，获取衍生值时就会走缓存，这样就不会引起虚拟 DOM 的重新渲染。

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

计算属性还支持 setter，用于实现逆向推导：

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

### 2.3 action - 修改状态

只有 在 `actions` 中，才可以修改 `MobX` 中 `state` 的值。通过引入 `MobX` 定义的严格模式，可以强制使用 `action` 来修改状态，保证状态修改的可追溯性。

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

`runInAction` 是一个实用的工具函数，用于在异步操作中批量更新状态：

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

### 2.4 observer - 响应式组件

`observer` 是由 `mobx-react` 包提供的高阶组件，用于将 `React` 组件转换为响应式组件。在组件的 `render` 函数中使用的任何 `observable` 发生变化时，组件都会自动重新渲染。

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

`observer` 的原理是用 `mobx.autorun` 包装了组件的 `render` 函数，确保任何组件渲染中使用的数据变化时都可以强制刷新组件。

### 2.5 autorun - 自动运行

当可观察对象中保存的值发生变化时，可以在 `mobx.autorun` 中被观察到。`autorun` 在 `observable` 的值初始化或改变时自动运行。

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

如果你想响应式地产生一个可以被其它 `observer` 使用的值，请使用 `@computed`；如果你不想产生新值，而想要达到一个效果（如打印日志、发起网络请求），请使用 `autorun`。

### 2.6 reaction - 响应式副作用

`Reactions` 和计算值很像，但它不是产生一个新的值，而是会产生一些副作用，比如打印到控制台、网络请求、递增地更新 `React` 组件树以修补 `DOM` 等。简而言之，`reactions` 在响应式编程和命令式编程之间建立沟通的桥梁。

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

`reaction` 接收两个函数参数：第一个是数据追踪函数，第二个是副作用函数。与 `autorun` 不同的是，`reaction` 不会在初始化时立即执行，只会在追踪的数据发生变化时才执行。

### 2.7 flow - 异步流程管理

`flow()` 接收 `generator` 函数作为输入，配合 `yield` 关键字可以优雅地处理异步操作。在 `flow` 中，使用 `yield` 代替 `await`，异步代码会自动被 `action` 包装。

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

使用 `flow` 的好处是：代码看起来像同步代码一样直观，但实际上是异步执行的；同时自动处理了状态更新，无需手动包装 `runInAction`。

## 三、计数器完整示例

下面是一个完整的计数器示例，展示了如何将 `MobX` 与 `React` 结合使用：

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

// 第二步：创建响应式组件
@observer
class CounterView extends Component {
  render() {
    const { number, loading, description, isEven } = counterStore

    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>MobX 计数器示例</h2>

        {/* 显示计数 */}
        <div style={{ fontSize: '48px', margin: '20px 0' }}>
          {number}
        </div>

        {/* computed 属性 */}
        <p>{description}</p>
        <p>{isEven ? '✅ 偶数' : '❌ 奇数'}</p>

        {/* 加载状态 */}
        {loading && <p>加载中...</p>}

        {/* 操作按钮 */}
        <div style={{ marginTop: '20px' }}>
          <button onClick={() => counterStore.decrement()}>
            - 减少
          </button>

          <button onClick={() => counterStore.reset()} style={{ margin: '0 10px' }}>
            重置
          </button>

          <button onClick={() => counterStore.increment()}>
            + 增加
          </button>

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

这个示例完整展示了 `MobX` 的核心概念：

1. **makeAutoObservable** - 自动将所有属性和方法转换为对应的 `observable`、`computed` 或 `action`
2. **observable** - `number` 和 `loading` 属性是可观察的
3. **computed** - `description` 和 `isEven` 是计算属性，基于 `number` 自动推导
4. **action** - `increment`、`decrement`、`reset` 是修改状态的方法
5. **observer** - `CounterView` 组件订阅了 `store` 的变化，自动重新渲染

## 四、最佳实践

### 4.1 Store 的组织方式

在实际项目中，推荐按照功能模块来组织 `Store`：

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

### 4.2 严格模式配置

为了保证状态修改的可追踪性，建议开启严格模式：

```javascript
import { configure } from 'mobx'

// 配置 MobX 严格模式
configure({
  // 'always' - 强制所有状态修改都在 action 中
  // 'observed' - 只对观察中的状态强制此规则
  // false - 关闭严格模式（默认）
  enforceActions: 'always',

  // 禁用修改未观察的状态时的警告
  computedRequiresReaction: false,

  // 禁止在严格模式下外部修改状态
  reactionRequiresObservable: true,

  // 调试时抛出异常
  isolateGlobalState: false
})
```

### 4.3 组件中的使用方式

推荐使用自定义 Hook 的方式在组件中使用 `Store`：

```javascript
import React from 'react'
import { useStore } from '../stores/RootStore'
import { observer } from 'mobx-react'

// 方式一：使用 observer HOC
@observer
class UserProfile extends React.Component {
  render() {
    const { userStore } = useStore()
    const { user, loading } = userStore

    if (loading) return <div>加载中...</div>

    return (
      <div>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
      </div>
    )
  }
}

// 方式二：使用 observer hook (mobx-react-lite)
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

### 4.4 异步操作最佳实践

对于异步操作，推荐使用 `flow` 或 `runInAction`：

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

  // 方式一：使用 flow (推荐)
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

### 4.5 性能优化技巧

**只订阅需要的状态**：避免在组件中访问不必要的 `store` 属性，这会导致不必要的重新渲染。

```javascript
// 不推荐：访问整个 store
const { userStore } = useStore()
const { user } = userStore

// 推荐：只访问需要的属性
const user = useUserStore().user
```

**使用 shallow 优化数组比较**：对于大型数组，可以使用 `shallow` 优化比较：

```javascript
import { observer } from 'mobx-react'
import { shallow } from 'mobx'

const ItemList = observer(({ store }) => (
  <ul>
    {store.items.map(item => (
      <Item key={item.id} item={item} />
    ))}
  </ul>
), {
  // 使用 shallow 优化深比较
  forwardRef: true
})
```

**分离读写操作**：将读和写操作分离到不同的组件中，避免不必要的数据订阅。

## 五、总结

`MobX` 作为一款响应式状态管理库，以其简洁的 API 和优秀的性能表现，为前端状态管理提供了一种新的选择。通过本文的学习，你应该已经掌握了以下内容：

1. **核心概念**：理解 `observable`、`computed`、`action`、`observer` 等核心 API 的作用和使用场景。

2. **与Redux对比**：了解 `MobX` 与 `Redux` 的区别，根据项目需求选择合适的状态管理方案。

3. **最佳实践**：掌握 `Store` 组织、严格模式配置、异步操作处理等最佳实践。

4. **性能优化**：了解如何避免不必要的渲染，优化应用性能。

总的来说，如果你需要快速开发、喜欢简洁的代码风格、或者应用状态逻辑适合用面向对象的方式组织，`MobX` 是一个值得考虑的选择。建议在中小型项目中使用，能够充分发挥其优势；对于超大型项目，可以根据团队熟悉度和具体场景进行权衡。

---

*参考资料：*
- [MobX 官方文档](https://mobx.js.org/)
- [MobX React 集成](https://mobx-react.js.org/)
- [Redux vs MobX](https://redux.js.org/faq/general#when-should-i-use-redux)
