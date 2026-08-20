---
title: Zustand 极简 React 状态管理使用指南与实战技巧
date: 2025-01-14 14:40:12
description: 从 create 建 store 讲到 Selector 精准订阅、persist 持久化、devtools 调试和 immer 中间件，附模块化拆分方案与四个高频踩坑点。
tags:
  - React
  - 状态管理
  - Zustand
  - 前端性能优化
categories: Front-End
---

用 Context 做全局状态，最难受的一刻是打开 React DevTools 的 Highlight updates，改一个主题色，整棵组件树全在闪。换 Redux 又是另一种难受，加一个字段要动 action type、action creator、reducer 三个文件。Zustand 走的是第三条路，一个 `create()` 就是一个 store，不用 Provider，不用 reducer，组件里想订阅哪个字段就订阅哪个字段。这篇从建第一个 store 开始，把 Selector 精准订阅、持久化、DevTools、Immer 这几件事讲透，顺带说清楚哪几个写法看着没问题但会悄悄失效。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Zustand 解决的是 Context 和 Redux 各自的什么问题
- 用 `create()` 建 store 的基础写法，以及异步请求怎么放进去
- Selector 精准订阅的原理，以及返回对象为什么会让优化失效
- `persist` 中间件的基础用法和 `partialize`、`storage` 等高级配置
- 接 Redux DevTools 做时间旅行调试，以及生产环境怎么关掉
- 深层嵌套状态用 `immer` 中间件改写的收益和代价
- store 模块化拆分的目录结构和 slice 组合模式
- 四个高频踩坑点，包括 `getState()` 到底能不能用

## 一、为什么是 Zustand

先把两个老方案的问题说清楚，才知道 Zustand 在替谁擦屁股。

Context API 的问题在于它没有订阅粒度。Provider 的 value 一变，所有消费该 Context 的组件都会重新渲染，跟这个组件用没用到变化的那个字段完全无关。你可以拆成十几个 Context 来缓解，代价是 Provider 嵌套成一座金字塔。

Redux 的问题不在性能，在配置成本。一套 action type、action creator、reducer 写下来，中小项目的收益比很低。Redux Toolkit 之后好了很多，但心理门槛还在。

Zustand 由 React Three Fiber 团队做的，思路是「用最小的 API 拿到最大的效率」。它的核心能力有这么几条。

- 极简 API，一个 `create()` 建 store，没有额外配置
- 基于 Selector 的订阅机制，只订阅你要的那一片，避免多余渲染
- 不依赖 Context，没有 Provider 嵌套
- TypeScript 类型推导完整，IDE 提示到位
- 内置 `persist`、`devtools`、`immer` 等中间件
- store 就是闭包里的普通对象，初始化快、内存占用低

三大流派的位置关系大致是这样。

| 单向数据流 | 原子化 | Proxy |
| :--------- | :----- | :----- |
| redux      | Recoil | Mobx   |
| zustand    | jotai  | valtio |

实际选型时基本是在 `zustand`、`jotai`、`valtio` 之间挑，它们分别是各自流派前一代方案的优化版本。

单向数据流的优势是数据本身干净、负担轻。但数据结构一复杂，不可变更新的展开写法会长得离谱，通常要配 `immer.js` 才能兼顾可读性和性能。原子化和 Proxy 的目标一致，都在收集数据与 UI 的绑定关系，数据变了 UI 自动更新。区别在写法，原子化是先定义原子再用原子管数据，Proxy 是先定义一个大对象再劫持属性做绑定。性能上原子化略好一点，它少了劫持这一步，但数据一复杂，原子化的写法也会变得繁琐。

处理大型复杂列表时，三者的表现是这样。

| 库      | 初始化速度 | 更新速度    | 内存占用              | 开发复杂度 |
| :------ | :--------- | :---------- | :-------------------- | :--------- |
| Zustand | 极快       | 快          | 极低，原生对象        | 较高       |
| jotai   | 较慢       | 精准、快    | 最高，原子实例多      | 偏高       |
| valtio  | 中等偏慢   | 精准、快    | 偏高，Proxy 开销大    | 低         |

更新机制上的细节差异。

| 库          | 通知复杂度 | 渲染复杂度 | 原理                                                      |
| :---------- | :--------- | :--------- | :-------------------------------------------------------- |
| Zustand | O(N)   | O(1)   | 线性遍历订阅列表加 Selector 比对                          |
| Jotai   | O(1)   | O(1)   | 依赖图，原子 A 变了直接找到订阅 A 的那个组件               |
| Valtio  | O(1)   | O(1)   | Proxy 追踪，属性 A 变了直接通知访问过 A 的组件             |

Zustand 的通知是 O(N)，看着不如另外两个，但它换来的是极低的内存开销。这个取舍在万级数据场景下反而是优势。想看四个方案更完整的横向对比，可以翻这篇 [React 状态管理库选型指南](https://feinterview.poetries.top/blog/react-state-management-comparison)。

## 二、建第一个 store

### 基础写法

导入 `create`，把状态和操作方法一起写在返回的对象里。

```typescript
import { create } from 'zustand'

interface TabItem {
  id: string
  title: string
}

interface TabState {
  tabs: TabItem[]
  currentTabId: string
  addTab: (tab: TabItem) => void
  removeTab: (id: string) => void
  setCurrentTab: (id: string) => void
}

export const useTabStore = create<TabState>((set) => ({
  tabs: [],
  currentTabId: '',
  addTab: (tab) => set((state) => ({
    tabs: [...state.tabs, tab]
  })),
  removeTab: (id) => set((state) => ({
    tabs: state.tabs.filter((t) => t.id !== id),
    currentTabId: state.currentTabId === id ? '' : state.currentTabId
  })),
  setCurrentTab: (id) => set({ currentTabId: id })
}))
```

这里有个 Zustand 和 Redux 很不一样的点。`set` 传对象时是浅合并，不是替换。上面 `setCurrentTab` 只写了 `currentTabId`，`tabs` 会原样保留，不需要你手动展开。想要整体替换，得传第二个参数 `true`。

组件里直接调这个 hook 就行。

```tsx
import { useTabStore } from './store/tabStore'

export default function TabView() {
  const { tabs, currentTabId, addTab, setCurrentTab } = useTabStore()

  return (
    <div>
      <button onClick={() => addTab({ id: 'settings', title: '设置' })}>
        新增 Tab
      </button>
      <div style={{ display: 'flex', gap: 8 }}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            style={{
              padding: 4,
              borderBottom: tab.id === currentTabId ? '2px solid blue' : 'none',
              cursor: 'pointer'
            }}
          >
            {tab.title}
          </div>
        ))}
      </div>
    </div>
  )
}
```

到这里 store 就能用了，任何组件里引进来就能读能改，不需要在外层套任何东西。

不过上面这个写法有个隐患，`useTabStore()` 不传参数等于订阅整个 store，store 里任何字段变了这个组件都会重渲。小组件无所谓，稍微大一点就得改成 Selector 写法，第三节会详细说。

### 异步操作怎么放

Zustand 没有为异步单独设计 API，因为不需要。action 就是普通函数，里面爱写什么写什么。

```typescript
import { create } from 'zustand'

interface Todo {
  id: number
  title: string
  completed: boolean
}

interface TodoState {
  todos: Todo[]
  error: string | null
  isLoading: boolean
  fetchTodos: () => Promise<void>
  toggleTodo: (id: number) => void
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  error: null,
  isLoading: false,
  fetchTodos: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('https://jsonplaceholder.typicode.com/todos')
      const data = await res.json()
      set({ todos: data.slice(0, 10), isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  }))
}))
```

这段代码能跑，但我得说句实话，这种把接口数据往 store 里塞的写法，做到后面 store 会长满 `xxxLoading`、`xxxError` 这样的伴生字段。真正的服务端状态还是交给 TanStack Query 这类专门方案更合适，Zustand 留着管纯客户端状态。

## 三、Selector 精准订阅

### 先看问题长什么样

假设 store 里同时放了用户信息和主题设置。

```typescript
import { create } from 'zustand'

const useAppStore = create((set) => ({
  user: {
    name: '张三',
    age: 25,
    isLogin: true
  },
  theme: 'light',
  setTheme: (newTheme: string) => set({ theme: newTheme }),
  setUserAge: (age: number) => set((state) => ({
    user: { ...state.user, age }
  }))
}))
```

两个组件都用解构的方式取值。

```tsx
// 反面教材，订阅了整个 store
function UserName() {
  const { user } = useAppStore()
  console.log('UserName 渲染了')
  return <div>用户名 {user.name}</div>
}

function ThemeDisplay() {
  const { theme } = useAppStore()
  console.log('ThemeDisplay 渲染了')
  return <div>当前主题 {theme}</div>
}
```

调 `setUserAge(26)`，控制台里两条日志都会打出来。`ThemeDisplay` 明明只用到 `theme`，跟 `user.age` 没有半点关系。

那为什么解构不管用呢？因为解构发生在函数返回之后。`useAppStore()` 已经把整个 state 对象返回出来了，订阅关系在那一刻就建立完了，你在外面怎么解构都改变不了它订阅的是整个 store 这个事实。

### 传 Selector 才是正确姿势

把要读的字段用函数指定出来。

```tsx
function UserName() {
  const userName = useAppStore((state) => state.user.name)
  console.log('UserName 渲染了')
  return <div>用户名 {userName}</div>
}

function ThemeDisplay() {
  const theme = useAppStore((state) => state.theme)
  console.log('ThemeDisplay 渲染了')
  return <div>当前主题 {theme}</div>
}
```

改完之后，`setUserAge(26)` 只会让 `UserName` 重渲，`setTheme('dark')` 只会让 `ThemeDisplay` 重渲。

原理不复杂。每次 store 变化时 Zustand 会重跑你的 selector，拿新返回值和上次的做 `Object.is` 比较，不一样才通知组件更新。所以订阅的粒度取决于你的 selector 返回了什么，跟嵌套多深没关系，`state.a.b.c.d` 也能精准订阅。

### 要读多个字段怎么办

这是最容易翻车的地方。很自然会想到一次返回一个对象。

```tsx
// 每次渲染都返回新对象，Object.is 永远为 false，等于没优化
const { name, age } = useAppStore((state) => ({
  name: state.user.name,
  age: state.user.age
}))
```

`Object.is` 比的是引用，selector 每次都造一个新对象，比较结果永远是「变了」，组件每次 store 更新都会重渲，比不写 selector 还糟糕，因为还多跑了一遍函数。

Zustand 5 的解法是 `useShallow`，它在外面包一层浅比较。

```tsx
import { useShallow } from 'zustand/react/shallow'

const { name, age } = useAppStore(
  useShallow((state) => ({
    name: state.user.name,
    age: state.user.age
  }))
)
```

另一个更简单的办法是拆成多个调用，每个只取一个原始值。

```tsx
const name = useAppStore((state) => state.user.name)
const age = useAppStore((state) => state.user.age)
```

多写一行，但完全不用担心引用比较的问题。字段少的时候我更倾向这种写法。

顺着上面聊，Zustand 4 里可以给 hook 传第二个参数当自定义比较函数，Zustand 5 把这个参数移除了。老项目升级时如果依赖这个行为，需要改用 `useShallow`，或者从 `zustand/traditional` 导入 `createWithEqualityFn` 保留旧行为。

### 派生状态

计算属性有两个放法，看它属不属于 store 的领域知识。

```typescript
// 放法一，算完直接存进 store
interface StoreState {
  items: number[]
  total: number
  addItem: (item: number) => void
}

const useStore = create<StoreState>((set) => ({
  items: [],
  total: 0,
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
    total: state.total + item
  }))
}))

// 放法二，在组件里现算
function TotalDisplay() {
  const items = useStore((state) => state.items)
  const total = items.reduce((sum, item) => sum + item, 0)
  return <div>总和 {total}</div>
}
```

放法一的风险是 `total` 和 `items` 可能不同步，任何一个漏改的地方都会让它们对不上。放法二每次渲染都要重算，列表大了有成本。我的判断标准是，计算成本低就在组件里算，成本高或者多个组件都要用就存进 store，但要保证只有一个入口能改 `items`。

## 四、持久化

### 基础用法

`persist` 中间件把 store 包一层，剩下的它自己搞定。

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
  token: string
  userInfo: any
  setToken: (token: string) => void
  setUserInfo: (info: any) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: '',
      userInfo: null,
      setToken: (token) => set({ token }),
      setUserInfo: (userInfo) => set({ userInfo }),
      logout: () => set({ token: '', userInfo: null })
    }),
    {
      name: 'user-storage' // localStorage 里的 key
    }
  )
)
```

注意 `create<UserState>()` 后面那对空括号，用中间件时这个柯里化写法是必须的，不然 TypeScript 推不出类型。刷新页面后状态会自动从 localStorage 恢复。

### 常用配置

真实项目里基本都要调这几项。

```typescript
import { persist, createJSONStorage } from 'zustand/middleware'

const useStore = create<UserState>()(
  persist(
    (set) => ({
      // 状态定义
    }),
    {
      name: 'my-app-storage',
      storage: createJSONStorage(() => sessionStorage), // 换成 sessionStorage
      partialize: (state) => ({
        // 只存这两个字段，其它的不落盘
        token: state.token,
        theme: state.theme
      }),
      version: 1,
      migrate: (persisted, version) => {
        // 结构变了之后，把老数据迁到新格式
        return persisted as UserState
      },
      onRehydrateStorage: () => (state) => {
        console.log('hydration finished', state)
      }
    }
  )
)
```

`partialize` 是最该用起来的一个。默认行为是整个 state 全存，包括那些临时的 loading 标志位，刷新之后一个卡在 `true` 的 `isLoading` 能让你排查半天。

`version` 加 `migrate` 这一对解决的是另一个问题。用户浏览器里存着上个版本的数据结构，你这版把字段名改了，不做迁移的话 store 恢复出来就是一堆 undefined。这里有个坑要注意，改了 state 结构就要记得把 `version` 加一，不然 `migrate` 根本不会被调用。

SSR 场景还要多想一层。服务端没有 localStorage，`persist` 恢复发生在客户端挂载之后，中间会有一帧服务端渲染结果和客户端不一致，容易触发 hydration 报错。常见做法是用 `useStore.persist.hasHydrated()` 或者 `onFinishHydration` 判断一下，恢复完再渲染依赖持久化数据的部分。

## 五、接上 Redux DevTools

`devtools` 中间件让 Zustand 复用 Redux 的调试面板。

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useCounterStore = create(
  devtools(
    (set) => ({
      count: 0,
      increase: () => set((state) => ({ count: state.count + 1 }), false, 'increase'),
      decrease: () => set((state) => ({ count: state.count - 1 }), false, 'decrease')
    }),
    { name: 'counter-store' }
  )
)
```

`set` 的第三个参数是 action 名称。不传的话面板里全是 `anonymous`，一长串下来根本分不清是哪个操作触发的。加上名字之后，state 快照、调用记录、时间旅行回退这些能力才真的好用。

生产环境记得关掉。

```typescript
const store = create(
  devtools(
    (set) => ({ /* ... */ }),
    {
      enabled: process.env.NODE_ENV === 'development',
      name: 'my-app'
    }
  )
)
```

多个 store 同时开 devtools 时，建议再加上 `store` 选项给每个 store 一个标识，否则它们会在同一个面板里混在一起。

## 六、Immer 处理深层嵌套

### 问题场景

状态嵌套一深，不可变更新的展开写法就开始难看了。

```typescript
interface DeepState {
  nested: {
    object: {
      count: number
    }
  }
}

const useStore = create<DeepState>((set) => ({
  nested: { object: { count: 0 } },
  increment: () => set((state) => ({
    nested: {
      ...state.nested,
      object: {
        ...state.nested.object,
        count: state.nested.object.count + 1
      }
    }
  }))
}))
```

才三层就已经这样了。真实项目里五六层的结构不罕见，漏一个展开符就变成引用共享，改了 A 的数据 B 跟着变，这类 bug 特别难查。

### 换成 immer

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface DeepState {
  nested: {
    object: {
      count: number
    }
  }
  increment: () => void
}

const useStore = create<DeepState>()(
  immer((set) => ({
    nested: { object: { count: 0 } },
    increment: () => set((state) => {
      state.nested.object.count++
    })
  }))
)
```

一行搞定。immer 内部用 Proxy 记录你在 draft 上做了哪些修改，最后生成一份新对象，没改到的部分会复用原来的引用。

代价也要说清楚。immer 会给访问到的对象加一层 Proxy 包装，高频更新的大对象上这层开销不能忽略。另外 store 里如果存了类实例，immer 默认不会处理它，需要给类打上 `[immerable] = true` 标记，不然改动可能丢失。我的建议是按 store 决定用不用，嵌套深的 store 上 immer，扁平的就别加，没必要为了统一而统一。

## 七、模块化拆分

### 目录结构

中大型项目按业务域拆文件，一个域一个 store。

```
stores/
├── userStore.ts      // 用户认证状态
├── cartStore.ts      // 购物车状态
├── uiStore.ts        // 主题、侧边栏这类 UI 状态
└── settingsStore.ts  // 用户设置
```

每个文件自己管自己的状态和操作。

```typescript
// stores/userStore.ts
interface UserState {
  isAuthenticated: boolean
  user: User | null
  login: (credentials: Credentials) => Promise<void>
  logout: () => void
}

export const useUserStore = create<UserState>((set) => ({
  isAuthenticated: false,
  user: null,
  login: async (credentials) => {
    const user = await authService.login(credentials)
    set({ isAuthenticated: true, user })
  },
  logout: () => set({ isAuthenticated: false, user: null })
}))
```

这么拆的好处是职责单一、追踪方便，单个 store 不会长到几百行，新人也容易看懂状态从哪来到哪去。代码分割也顺手，某个页面才用的 store 可以跟着页面一起懒加载。

### 需要跨域组合时用 slice 模式

如果两个域的状态确实要放在一个 store 里，可以用 slice 拆函数再拼起来。

```typescript
import { create, StateCreator } from 'zustand'

const createUserSlice: StateCreator<UserSlice & CartSlice, [], [], UserSlice> = (set) => ({
  user: null,
  setUser: (user) => set({ user })
})

const createCartSlice: StateCreator<UserSlice & CartSlice, [], [], CartSlice> = (set, get) => ({
  items: [],
  checkout: () => {
    // slice 之间可以通过 get() 互相访问
    const user = get().user
    // ...
  }
})

export const useBoundStore = create<UserSlice & CartSlice>()((...a) => ({
  ...createUserSlice(...a),
  ...createCartSlice(...a)
}))
```

我自己的感受是，slice 模式在需要 slice 之间互相读数据时才划算。纯粹为了「看起来更规整」而把独立的 store 合并起来，反而失去了物理隔离的好处。

## 八、四个高频踩坑点

### getState() 到底能不能用

先说结论，能用，但要看在哪用。

在组件外面用完全没问题，这是官方推荐的做法。比如 axios 拦截器里要取 token，工具函数里要判断登录态，这些地方本来就没有 React 上下文，`useUserStore.getState().token` 是标准写法。

不能用的地方是组件渲染过程中。

```typescript
// 有问题，这里读到的值不会订阅更新
function MyComponent() {
  const count = useStore.getState().count // 值变了组件不会重渲
  return <div>{count}</div>
}

// 正确
function MyComponent() {
  const count = useStore((state) => state.count)
  return <div>{count}</div>
}
```

`getState()` 只是同步读一次当前值，它不建立任何订阅关系。放在渲染里，界面就会停在第一次读到的那个值上。放在事件回调里没问题，因为那时候是即时读取，而且能拿到最新值，不会像闭包捕获的 state 那样读到旧值。

### 持久化的数据必须能序列化

用了 `persist` 就要保证 state 能过 `JSON.stringify`。函数、类实例、`Map`、`Set`、循环引用的对象都会出问题，函数直接丢失，`Map` 会变成空对象。

action 函数本身是安全的，因为 `persist` 存的是状态而不是方法，恢复时方法从新建的 store 里来。但如果你在 state 里存了回调函数当配置项，那就要用 `partialize` 把它排除掉。

### Selector 里别造新对象

前面第三节说过原理，这里再强调一次，它是实践中最常见的性能问题来源。

```typescript
// 反面教材
const user = useStore((state) => ({ name: state.name }))

// 正确，直接返回原始值
const name = useStore((state) => state.name)
```

同理，`useStore((state) => state.list.filter(...))` 这种返回新数组的写法也一样会失效，需要配 `useShallow`，或者干脆把过滤逻辑挪到组件里做。

### 中间件别叠太厚

中间件是能嵌套的，比如 `devtools(persist(immer(...)))`。但每叠一层就多一层函数包装和类型推导，叠到三四层之后 TypeScript 报错信息会变得完全读不懂。

顺序也有讲究，`devtools` 一般放最外层，这样它能记录到经过其它中间件处理之后的最终状态。只加真正需要的中间件，别一开始就把全套配齐。

## 总结

Zustand 值得记住的东西其实不多。`create()` 建 store，`set` 是浅合并，组件里永远传 Selector 而不是解构，多字段用 `useShallow`。这四条掌握了，日常开发的九成场景都覆盖了。

中间件按需加。`persist` 记得配 `partialize` 和 `version`，`devtools` 记得给 action 起名字并在生产环境关掉，`immer` 只给嵌套深的 store 用。

至于要不要用 Zustand 替换现有方案，我的看法是，中小型项目它可以完全顶替 Redux，开发体验的差距很明显。大型项目里它更适合作为客户端领域状态的轻量选择，接口数据交给 TanStack Query 这类服务端状态方案，两边分工比塞在一个 store 里清爽得多。

## 参考

- [Zustand 官方文档](https://zustand.docs.pmnd.rs/)
- [Zustand GitHub 仓库](https://github.com/pmndrs/zustand)
- [zustand persist 中间件文档](https://zustand.docs.pmnd.rs/integrations/persisting-store-data)
- [Immer 官方文档](https://immerjs.github.io/immer/)
- [前端进阶之旅](https://interview.poetries.top)
