---
title: React 状态管理库选型指南 四个主流方案横向对比
date: 2025-09-21 14:40:12
description: 从写法、状态隔离、渲染精度、内存开销四个维度横向对比 Zustand、Jotai、Valtio 和 Redux，给出不同数据规模和交互复杂度下的选型建议。
tags:
  - React
  - 状态管理
  - Zustand
  - Redux
  - 前端性能优化
categories: Front-End
---

选状态管理库这件事，最容易走偏的地方是拿「谁的 API 更短」当唯一标准。API 短确实爽，可等到列表里塞进两万条数据、或者同一个编辑器组件在页面上开了六个实例，短 API 带来的那点便利很快就被别的问题淹掉了。Zustand、Jotai、Valtio、Redux 这四个方案的差别，真正体现在状态怎么隔离、渲染怎么收敛、内存怎么占这三件事上。这篇按这几个维度把它们横过来比一遍，最后给几条按场景落地的判断标准。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 选型之前要先想清楚的四个核心需求
- 单向数据流、原子化、Proxy 代理这三种设计范式的取舍
- 四个库在定义、读取、更新上的写法差异
- 状态隔离和多实例支持的实现路径各有什么代价
- 大型列表下的初始化速度、更新机制和内存占用
- 按数据规模和交互复杂度给出的场景化选型建议
- 服务端状态为什么不该塞进这些库里

## 一、选型之前先想清楚四件事

在打开任何一个库的文档之前，先把需求摊开。下面这四条是我判断一个状态管理方案够不够用的基本盘。

### 全局状态共享

最基础的一条，任意两个组件之间能通过状态库互相通信，不用把 props 一层层往下传。

这一关所有方案都过得去。Context API 是 React 内置的；Redux 走 Flux 单向数据流；Zustand 属于轻量 Hook 流派；Recoil 和 Jotai 是原子化；Mobx 和 Valtio 走响应式；dva 则是 Redux 的封装增强。功能上都能做到，差别在后面三条。

### 状态隔离与模块化

项目一大，全局状态怎么分区就变成了大问题。好的方案要在共享的前提下把不同业务模块的状态隔开，不然改一个页面的 store 结构，另一个页面莫名其妙就挂了。

各家的路子不太一样。Redux 靠拆 reducer 再 `combineReducers`；Zustand 推荐一个页面一个 store 文件，物理层面就是分开的；Recoil 用 atom 的 key 保证全局唯一；Jotai 支持给每个页面套独立的 Provider；Mobx 是每个模块建 Store 实例再挂到 RootStore 上；Valtio 则给每个模块建独立的 proxy。

我自己的感受是，物理隔离比逻辑隔离靠谱。Zustand 那种一个文件一个 store 的做法看着最土，但新人接手时最不容易搞错，因为它不需要你脑子里维护一张全局的 key 表。

### 避免无效渲染

这条是性能优化的重点，也是四个方案拉开差距的地方。

Context API 在这方面表现最差。它几乎没法避免冗余渲染，Provider 的 value 一变，所有消费该 Context 的组件全部重渲，跟你实际用了哪个字段没关系。很多项目的卡顿源头就在这。

Redux 和 Zustand 都能通过 Selector 模式做到精准更新，但需要开发者自己写好 selector，写成 `useStore(s => ({ a: s.a }))` 这种每次返回新对象的形式，优化就白做了。Mobx 和 Valtio 在响应式追踪上表现更好，能做到属性级的细粒度更新，上万条数据也扛得住。Jotai 靠原子化按需收集依赖，避免了初始化时一次性建立全量依赖关系的开销。

### 多实例支持

除了全局单例，有时候只需要一小撮组件共享状态，而且这组组件在页面上会同时存在好几份。多页签编辑器、可拖拽的看板卡片都是这类。

Context API、Redux、Recoil、Jotai、Mobx、Valtio 都原生支持多实例。Zustand 是个例外，它默认就是单例，要做多实例得结合 Context，把 store 实例存在 `useRef` 里再往下传。这个组合是大厂面试里的常见考点，值得自己动手写一遍。

## 二、三种设计范式

四个库背后其实只有三种思路。

| 设计范式 | 代表方案 |
|----------|----------|
| 单向数据流 | Redux、Zustand |
| 原子化 | Recoil、Jotai |
| Proxy 代理 | Mobx、Valtio |

单向数据流的好处是数据流向清晰、可预测性强，出了问题顺着 dispatch 往回找就行。代价是数据结构一复杂，不可变更新的写法立刻变得又长又容易错，通常得配 Immer 才能兼顾可读性和性能。

原子化和 Proxy 代理的目标是一致的，都在建立数据和 UI 的绑定关系，数据一变 UI 自动更新。区别在于绑定的方向。原子化要你先把数据拆成一个个原子，再用原子去组织状态；Proxy 是先给你一个完整的大对象，靠劫持属性访问来建立绑定。

从性能上看原子化略占优势，因为它省掉了劫持这一步。但数据一复杂，原子化的写法就开始繁琐，光是把嵌套结构拆成原子网络就够喝一壶的。

不是说 Proxy 不行，而是它把复杂度藏起来了。藏起来的复杂度在调试的时候会以另一种形式还给你，比如你在 console 里打出一个 Proxy 对象，看到的和实际存的可能不是一回事。

## 三、写法上到底差多少

光说设计理念太虚，直接看同一个计数器四种写法。

```js
// Zustand，最短
import { create } from 'zustand'
const useStore = create(set => ({
  count: 0,
  inc: () => set(s => ({ count: s.count + 1 }))
}))
// 使用
const { count, inc } = useStore()

// Jotai，原子化
import { atom, useAtom } from 'jotai'
const countAtom = atom(0)
const doubleAtom = atom(get => get(countAtom) * 2) // 派生原子
// 使用
const [count, setCount] = useAtom(countAtom)

// Valtio，响应式代理
import { proxy, useSnapshot } from 'valtio'
const state = proxy({ count: 0 })
// 使用
const snap = useSnapshot(state)
state.count++ // 直接改，不用 setter

// Redux，样板代码最多
const INCREMENT = 'INCREMENT'
const counterReducer = (state = { count: 0 }, action) => {
  switch (action.type) {
    case INCREMENT: return { count: state.count + 1 }
    default: return state
  }
}
// 使用
const dispatch = useDispatch()
const count = useSelector(state => state.counter.count)
```

这里要补一句，Redux 那段手写 action type 加 switch 的写法是老式风格，现在官方推荐的是 Redux Toolkit 的 `createSlice`，action creator 和 reducer 一起生成，内部集成了 Immer，样板代码能砍掉七成。上面保留原始写法是为了让你看清 Redux 的数据流模型长什么样，真要在新项目里用 Redux，直接上 RTK。

把四个维度拉成表格更直观。

| 特性 | Zustand | Jotai | Valtio | Redux |
|------|---------|-------|--------|-------|
| 定义方式 | `create()` 创建 | `atom()` 原子 | `proxy()` 代理 | `createStore()` |
| 读取状态 | `useStore()` | `useAtom()` | `useSnapshot()` | `useSelector()` |
| 更新状态 | `set()` | `setAtom()` | 直接赋值 | `dispatch()` |
| 代码量 | 少 | 中 | 最少 | 多 |
| 样板代码 | 无 | 无 | 无 | 需要 action / reducer |

状态隔离的实现路径也各有各的味道。

| 方案 | 隔离方式 | 适用场景 |
|------|----------|----------|
| Zustand | 每个模块独立文件 | 按页面或功能拆，最推荐 |
| Jotai | atom key + Provider | 需要运行时动态创建 |
| Valtio | proxy 实例 | 多实例编辑器 |
| Redux | reducer 拆分 + combineReducers | 大型项目 |

精准更新这块的差别，直接决定了你要不要手写优化代码。

| 方案 | 精准更新方式 | 复杂度 |
|------|--------------|--------|
| Zustand | Selector 选择 | 需要手动写 |
| Jotai | 原子订阅 | 自动 |
| Valtio | Proxy 追踪 | 自动 |
| Redux | useSelector | 需要手动写 |

```js
// Zustand，得自己写 selector
const count = useStore(s => s.count) // 只订阅 count

// Jotai，天然精准
const [count] = useAtom(countAtom) // 只订阅这一个原子

// Valtio，访问即订阅
const snap = useSnapshot(state) // 渲染时读了哪个属性就订阅哪个
```

Valtio 这个「读了才订阅」的设计确实省事，但它也意味着订阅关系是在渲染过程中动态建立的。如果你在条件分支里读属性，不同渲染路径下订阅的属性集合是不一样的，排查渲染问题时得多想一层。

## 四、大型列表下的真实差距

前面聊的都是写法。到了数据量上来的时候，差距就换了一副面孔。

| 方案 | 初始化速度 | 更新性能 | 内存占用 | 开发复杂度 |
|------|------------|----------|----------|------------|
| Zustand | 极快 | 快 | 极低，原生对象 | 较高 |
| Jotai | 较慢 | 精准、快 | 最高，原子实例多 | 偏高 |
| Valtio | 中等偏慢 | 精准、快 | 偏高，Proxy 开销 | 低 |

### 更新机制

Zustand 的通知复杂度是 O(N)。它维护一个订阅者列表，状态变化时线性遍历这个列表，逐个跑 selector 拿新值再和旧值比对，值变了才触发对应组件更新。数据量大、订阅者多的时候，这一遍遍历是有成本的。好处是它用的全是原生 JavaScript 对象，没有任何包装层。

Jotai 靠依赖图做到了 O(1) 的通知。某个原子变了，直接沿着依赖图定位到订阅它的组件，中间不需要遍历。代价在初始化，如果你用 `splitAtom` 把一个长数组拆成一堆原子，那么创建这些原子对象的开销会实实在在压在首屏上。

Valtio 通过 Proxy 追踪同样做到 O(1)。属性变了直接通知访问过该属性的组件。它的开销分摊在两处，一是 proxy 包装，二是 `useSnapshot` 每次产生的快照对象。

### 内存这块差得最狠

Zustand 是内存利用率的天花板。它的 store 就是闭包里的一个普通对象，存一万条数据，占的内存基本等于这一万条原始 JSON 的大小，额外开销只有一个订阅列表。内存受限或者数据量特别大的场景，这一条几乎可以直接定选型。

Jotai 在超长列表下是内存重灾区。为了实现精准更新，`splitAtom` 会给数组里每个元素建一个 Atom 对象，再配上 WeakMap 维护的原子状态映射，内存占用是线性往上爆的。数据量一大，浏览器频繁 GC，掉帧就来了。

Valtio 的问题在 Proxy 本身。嵌套对象和数组都会被转成 Proxy 实例，`useSnapshot` 每次渲染还会生成快照。它用了结构共享来复用没变的部分，所以不是全量拷贝，但渲染瞬间的临时对象还是免不了。千级数据量下完全可以接受，万级就要掂量了。

这里得说句实话，上面这些性能结论是按各库的实现原理推出来的量级判断，不是精确基准。具体到你的项目，数据结构长什么样、更新频率多高、组件树多深，都会让结果偏移。真要做决策，拿自己的真实数据跑一遍 React DevTools Profiler 比看任何对比表都靠谱。

## 五、按场景选，别按喜好选

### 万级数据量

在线表格、大型看板、轨迹回放这类场景，数据点动辄上万，Zustand 基本是唯一解。这个规模下内存和初始化速度是生死线，给每个数据点建 Proxy 或者 Atom 的开销根本承受不起。你需要的就是最原始的 JS 对象，加上自己手写的、控制得住的订阅逻辑。

Selector 写起来烦，但这个烦是值得付的价钱。

### 中等规模但交互极复杂

多列配置面板、逻辑绕来绕去的购物车，数据量在千级，但交互路径特别多。这种情况 Valtio 更合适。内存比 Zustand 高一些，但自动追踪能省下大量 selector 代码，改需求的时候不用每加一个字段就去补一处订阅。

### 动态增减频繁

多页签编辑器、可以随时新建和关闭的任务卡片，Jotai 的优势在这里最明显。它的生命周期管理是独一份的，组件卸载之后对应的 Atom 状态会被自动回收，不会像单例 store 那样越攒越多。动态列表场景下，它能帮你维持内存的「新鲜度」。

### 数据结构简单的普通项目

如果没有特别复杂的数据结构，选哪个都行，这时候更多是编码偏好的问题。

追求极致轻量、省内存省 CPU，选 Zustand；追求逻辑严密、原子可组合按需销毁，选 Jotai；追求写得爽、自动优化代码最少，选 Valtio。想深入了解 Zustand 的 Selector、持久化和中间件用法，可以看这篇 [Zustand 使用指南与实战技巧](https://feinterview.poetries.top/blog/zustand-react-state-management)。

## 六、别把服务端数据塞进来

这一节是我觉得最容易被忽略的一点。

上面四个库管的都是客户端状态，它们的共同假设是「状态由你自己修改、修改之后立刻生效」。但接口返回的数据不满足这个假设。接口数据存在服务端，可能被别人改掉，你手上的那份随时可能过期，还得处理加载中、失败重试、后台静默刷新这些事。

很多项目的 store 会慢慢变成一个巨大的接口数据缓存池，里面塞满了 `userList`、`userListLoading`、`userListError` 这种三件套。这不是状态管理库的问题，是用错了工具。这类需求应该交给专门管服务端状态的方案，具体做法可以参考 [TanStack Query 核心价值与实战技巧](https://feinterview.poetries.top/blog/tanstack-query-guide)。

客户端状态用 Zustand 或者 Jotai，服务端状态用 TanStack Query，两边各管各的，store 会瘦一大圈。

## 总结

回到最开始那个问题，怎么选。

数据量是第一道分水岭。万级以上，Zustand，没得商量，内存和初始化速度决定生死。千级以内、交互复杂度高，Valtio 的自动追踪能省下最多代码。需要频繁创建销毁独立状态单元，Jotai 的生命周期管理是别人给不了的。Redux 现在的定位更像是「团队规模大、需要强约束和完整调试链路」时的选择，而且要用就用 Redux Toolkit，别再手写 action type。

第二道分水岭是你愿不愿意手写 selector。愿意，Zustand 的性能上限最高；不愿意，Valtio 和 Jotai 的自动追踪更省心。

最后提醒一句，把接口数据从这些库里摘出去。这一步带来的收益，往往比在四个库之间纠结要大得多。

## 参考

- [Zustand 官方文档](https://zustand.docs.pmnd.rs/)
- [Jotai 官方文档](https://jotai.org/)
- [Valtio 官方文档](https://valtio.dev/)
- [Redux Toolkit 官方文档](https://redux-toolkit.js.org/)
- [React 官方文档 useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- [前端进阶之旅](https://interview.poetries.top)
