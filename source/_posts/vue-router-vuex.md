---
title: Vue Router与Vuex原理解析及手写实现
description: 从插件机制讲起，逐段拆解手写 vue-router 与 vuex 的实现，讲清响应式 current、install 混入挂载、借鸡生蛋的 state，以及 mutation 为什么必须同步。
date: 2021-03-13 15:12:12
tags:
  - Vue
  - vue-router
  - Vuex
  - 源码
categories: Front-End
---

面试里问「说说 vue-router 的原理」，很多人会答监听 `hashchange`。这个答案不能算错，但只答到了一半。真正让页面在 URL 变化时重新渲染的，不是那个事件监听，而是一个被做成响应式的变量。

Vuex 也一样。「集中式状态管理」这句定义谁都会背，但为什么 `mutation` 必须是同步的、`state` 的响应式是怎么来的、`commit` 和 `dispatch` 的区别到底在哪，这些才是能拉开差距的地方。

这篇把 vue-router 和 vuex 各手写一遍，代码不长，每一段都拆开讲清楚它在解决什么问题。两个库的实现思路其实高度一致，看完一个再看另一个会顺很多。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- vue-router 接入的四个步骤分别做了什么
- Vue 的插件机制，`Vue.use` 背后发生了什么
- hash 模式和 history 模式监听的事件不同，部署要求也不同
- 手写 vue-router：install 混入、响应式 current、两个全局组件
- 精简版实现和真实的 vue-router 差在哪些地方
- Vuex 的四个核心概念以及各自的定位
- 手写 vuex：借 Vue 实例实现响应式 state
- `commit` 与 `dispatch` 的实现差异，以及 mutation 为什么必须同步

## 一、vue-router 的接入四步

Vue Router 是 Vue.js 官方的路由管理器。它和 Vue.js 的核心深度集成，让构建单页面应用变得容易很多。

安装用 `vue add router`，接入分成四个步骤。

**第一步，注册插件。**

```js
import Router from 'vue-router'
Vue.use(Router)
```

**第二步，创建 Router 实例，在 router.js 里。**

```js
export default new Router({...})
```

**第三步，在根组件上挂载这个实例，在 main.js 里。**

```js
import router from './router'

new Vue({
    router,
}).$mount("#app");
```

**第四步，在 App.vue 里添加路由视图。**

```html
<router-view></router-view>
```

导航用 `router-link`：

```html
<router-link to="/">Home</router-link>
<router-link to="/about">About</router-link>
```

这四步看着是流程，其实每一步都对应实现里的一块逻辑。第一步触发 `install`，第二步构造实例并开始监听 URL，第三步通过混入把实例挂到每个组件上，第四步用两个全局组件消费前面的成果。

把这个对应关系记住，后面看实现会轻松很多。

## 二、Vue.use 到底做了什么

`Vue.use` 的逻辑非常简单，它接收一个插件对象，调用这个对象上的 `install` 方法，并把 Vue 构造函数作为第一个参数传进去。同一个插件重复 `use` 只会执行一次。

为什么要把 Vue 传进去，而不是让插件自己 `import Vue`？

因为插件如果自己 import，打包时 Vue 会被打进插件的产物里，用户的项目里就有两份 Vue 代码，两套响应式系统互不相认，出的 bug 极其诡异。把构造函数当参数传进来，插件就可以声明 Vue 为 `peerDependencies`，永远用宿主项目那一份。

这个设计在几乎所有 Vue 生态的库里都能看到，理解它比记住 `Vue.use` 的用法重要得多。

## 三、hash 模式和 history 模式

vue-router 支持两种模式，实现方式和部署要求都不一样。

| 维度 | hash 模式 | history 模式 |
|------|----------|-------------|
| URL 形态 | `example.com/#/about` | `example.com/about` |
| 监听事件 | `hashchange` | `popstate` |
| 跳转 API | 改 `location.hash` | `history.pushState` |
| 是否发请求 | 不会，`#` 后的内容不发给服务器 | 直接访问会真的请求这个路径 |
| 服务器配置 | 不需要 | 必须配置回退 |

history 模式那个「必须配置回退」是踩坑重灾区。前端跳转走的是 `pushState`，压根没发请求所以一切正常；但用户在 `/about` 上按一下刷新，浏览器会老老实实向服务器要这个路径，服务器上没有这个文件，直接 404。

解决办法是让服务器在找不到文件时统一返回 `index.html`。Nginx 上就是那行 `try_files $uri $uri/ /index.html;`，具体可以看 [Nginx try_files 指令详解](https://feinterview.poetries.top/blog/nginx-try-files)。

下面的手写实现走的是 hash 模式，因为它不需要任何服务端配合，本地打开就能跑。

## 四、手写 vue-router

先把要做的事列清楚：

- 作为一个插件存在，实现 `VueRouter` 类和 `install` 方法
- 实现两个全局组件，`router-view` 用于显示匹配的组件内容，`router-link` 用于跳转
- 监控 URL 变化，监听 `hashchange` 或 `popstate` 事件
- 响应最新 URL，创建一个响应式的属性 `current`，当它改变时获取对应组件并显示

第四条是整个实现的胜负手，下面会重点讲。

### 4.1 VueRouter 类

创建 `kvue-router.js`，先写类本身。

```js
// 我们的插件：
// 1. 实现一个 Router 类并挂载其实例
// 2. 实现两个全局组件 router-link 和 router-view
let Vue;

class VueRouter {
  constructor(options) {
    this.$options = options;

    // 缓存 path 和 route 的映射关系，这样找组件更快
    this.routeMap = {}
    this.$options.routes.forEach(route => {
      this.routeMap[route.path] = route
    })

    // 数据响应式
    // 定义一个响应式的 current，它变了，使用它的组件会 rerender
    Vue.util.defineReactive(this, 'current', '')

    // 请确保 onHashChange 中 this 指向当前实例
    window.addEventListener('hashchange', this.onHashChange.bind(this))
    window.addEventListener('load', this.onHashChange.bind(this))
  }

  onHashChange() {
    this.current = window.location.hash.slice(1) || '/'
  }
}
```

这段里有三处值得单独说。

`routeMap` 是一个空间换时间的优化。路由表是一个数组，每次匹配都遍历一遍，路由多了就是线性开销。转成以 path 为 key 的对象之后，匹配变成一次哈希查找。真实的 vue-router 因为要支持动态路由和嵌套路由，做的是路径解析加正则匹配，比这复杂得多，但缓存映射这个思路是一样的。

`Vue.util.defineReactive` 是整个实现的核心。它把 `current` 变成一个带 getter/setter 的响应式属性。`router-view` 的 render 函数里读了 `current`，就完成了依赖收集；`onHashChange` 里给 `current` 赋值，setter 触发通知，`router-view` 自动重新渲染。

没有这一行，你监听到 `hashchange` 之后只能手动去操作 DOM，那就不是 Vue 的玩法了。顺带提一句，`Vue.util` 属于内部 API，官方文档里没有承诺稳定，教学用没问题，生产代码里别依赖它。

第三处是 `bind(this)`。事件回调里的 `this` 默认指向触发事件的对象（这里是 `window`），不绑定的话 `this.current` 会直接报错。同时监听 `load` 是为了处理首次进入页面的情况，此时不会触发 `hashchange`，需要主动初始化一次。

### 4.2 install 方法与混入挂载

```js
// 插件需要实现 install 方法
// 接收 Vue 构造函数，主要用于数据响应式
VueRouter.install = function (_Vue) {
  // 保存 Vue 构造函数，供 VueRouter 内部使用
  Vue = _Vue

  // 任务 1：使用混入来做 router 挂载这件事
  Vue.mixin({
    beforeCreate() {
      // 只有根实例才有 router 选项
      if (this.$options.router) {
        Vue.prototype.$router = this.$options.router
      }
    }
  })
}
```

这里为什么要用 `mixin` 而不是直接赋值？

因为 `install` 执行的时候，用户还没有创建 router 实例，拿不到它。`Vue.mixin` 注册的 `beforeCreate` 会在每个组件初始化时执行，等根实例创建的那一刻，`this.$options.router` 才真正存在。用 `beforeCreate` 而不是 `created`，是为了保证在任何组件用到 `$router` 之前就挂好。

判断 `this.$options.router` 是为了只在根实例上执行一次，子组件的 `$options` 上没有这个字段。挂到 `Vue.prototype` 上之后，所有组件实例都能通过原型链访问到 `this.$router`。

### 4.3 两个全局组件

```js
  // router-link: 生成一个 a 标签，在 url 后面添加 #
  // <router-link to="/about">aaa</router-link> 渲染成 <a href="#/about">aaa</a>
  Vue.component('router-link', {
    props: {
      to: {
        type: String,
        required: true
      },
    },
    render(h) {
      // h(tag, props, children)
      return h('a',
        { attrs: { href: '#' + this.to } },
        this.$slots.default
      )
    }
  })

  Vue.component('router-view', {
    render(h) {
      // 根据 current 获取组件并 render
      let component = null
      const { routeMap, current } = this.$router
      if (routeMap[current]) {
        component = routeMap[current].component
      }
      return h(component)
    }
  })
```

最后别忘了导出：

```js
export default VueRouter
```

`router-link` 就是一个 `a` 标签加上 `#` 前缀，点击后浏览器改变 hash，触发 `hashchange`，链路闭上了。用 render 函数而不是模板，是因为这是一个库，不能假设用户的构建环境带了模板编译器。

`router-view` 那句 `const { routeMap, current } = this.$router` 是关键。解构这个动作读取了 `current`，这次读取发生在 render 函数执行期间，于是 `router-view` 的渲染 Watcher 被 `current` 的 dep 收集了进去。后面 `current` 一变，这个组件就重新渲染。

整条链路串起来是这样：点击 link 改 hash，触发 hashchange 回调，回调给 current 赋值，setter 通知 router-view 的 Watcher，router-view 重新 render，从 routeMap 里取出新组件挂上去。

### 4.4 这个精简版还差什么

这一百行左右的实现能跑通基本流程，但离生产可用还差不少：

- 只支持一级路由，没有嵌套路由和 `children`
- 不支持动态路由 `/user/:id`，因为用的是精确匹配而不是路径解析
- 没有导航守卫，`beforeEach`、`beforeEnter`、`beforeRouteLeave` 全都没有
- 没有 `$route` 对象，拿不到 `params`、`query`、`meta`
- 没有编程式导航 `push`、`replace`、`go`
- 只有 hash 模式，没有 history 模式

真实的 vue-router 里，路径匹配用的是 `path-to-regexp` 把 `/user/:id` 编译成正则并提取参数名，导航守卫是一条由多个钩子串成的队列，靠一个递归的 `runQueue` 依次执行。感兴趣可以顺着这条线去读源码，有了上面的骨架再看会清晰很多。更完整的 vue-router 用法整理可以看 [Vue Router 使用总结](https://feinterview.poetries.top/blog/vue-router)。

## 五、Vuex 的核心概念

Vuex 集中式存储管理应用的所有组件的状态，并以相应的规则保证状态以可预测的方式发生变化。

安装用 `vue add vuex`。核心概念有四个：

- `state` 状态、数据
- `mutations` 更改状态的函数
- `actions` 异步操作
- `store` 包含以上概念的容器

再加上一个从 state 派生的 `getters`，一共是五块。

**状态 state**，保存应用状态。

```js
export default new Vuex.Store({
  state: {
    counter: 0
  },
})
```

**状态变更 mutations**，用于修改状态。

```js
export default new Vuex.Store({
  mutations: {
    add(state) {
      state.counter++
    }
  }
})
```

**派生状态 getters**，从 state 派生出新状态，类似计算属性。

```js
export default new Vuex.Store({
  getters: {
    // 计算翻倍后的数量
    doubleCounter(state) {
      return state.counter * 2
    }
  }
})
```

**动作 actions**，加业务逻辑，类似于 controller。

```js
export default new Vuex.Store({
  actions: {
    add({ commit }) {
      setTimeout(() => {
        commit('add')
      }, 1000)
    }
  }
})
```

测试代码：

```html
<p @click="$store.commit('add')">counter: {{$store.state.counter}}</p>
<p @click="$store.dispatch('add')">async counter: {{$store.state.counter}}</p>
<p>double: {{$store.getters.doubleCounter}}</p>
```

这里插一句，原文里 getters 和 actions 两段示例的括号是错的，`return` 被写进了注释、箭头函数写成了 `= >`，直接复制会报语法错误。上面这两段是改正后的版本。

## 六、手写 vuex

要做的事和 router 高度相似：

- 实现一个插件，声明 `Store` 类，挂载 `$store`
- 创建响应式的 state，保存 mutations、actions 和 getters
- 实现 `commit`，根据用户传入的 type 执行对应 mutation
- 实现 `dispatch`，根据用户传入的 type 执行对应 action，同时传递上下文
- 实现 getters，按照 getters 定义对 state 做派生

### 6.1 借鸡生蛋的响应式 state

```js
// 目标 1：实现 Store 类，管理响应式的 state、commit 方法和 dispatch 方法
// 目标 2：封装成插件，使用更方便
let Vue;

class Store {
  constructor(options) {
    // 定义响应式的 state，借鸡生蛋
    this._vm = new Vue({
      data: {
        $$state: options.state
      }
    })

    this._mutations = options.mutations
    this._actions = options.actions

    // 绑定 this 指向
    this.commit = this.commit.bind(this)
    this.dispatch = this.dispatch.bind(this)
  }
}
```

`_vm` 那几行是整段代码里最巧妙的地方。

Vuex 自己并不实现响应式，它直接 `new` 了一个 Vue 实例，把用户的 state 塞进这个实例的 `data` 里。Vue 在初始化 `data` 时会自动把它变成响应式的，Vuex 白捡了一整套依赖收集和派发更新的机制。这就是注释里说的「借鸡生蛋」。

属性名用 `$$state` 也有讲究。Vue 在做代理时会跳过以 `$` 或 `_` 开头的属性，不把它们代理到实例本身上，所以外部没法通过 `this._vm.$$state` 直接拿到，必须走下面定义的 `state` 访问器。

`commit` 和 `dispatch` 的 `bind` 是为了支持解构写法。action 里写 `add({ commit })` 把 commit 解构出来单独调用时，如果不提前绑好 this，函数体里的 `this._mutations` 就会是 undefined。

### 6.2 state 的只读保护与 commit、dispatch

```js
  // 只读
  get state() {
    return this._vm._data.$$state
  }

  set state(val) {
    console.error('不能直接赋值呀，请换别的方式！！')
  }

  // 实现 commit 方法，可以修改 state
  commit(type, payload) {
    // 拿出 mutations 中的处理函数执行它
    const entry = this._mutations[type]
    if (!entry) {
      console.error('未知 mutation 类型')
      return
    }
    entry(this.state, payload)
  }

  dispatch(type, payload) {
    const entry = this._actions[type]
    if (!entry) {
      console.error('未知 action 类型')
      return
    }
    // 上下文传当前 store 实例进去即可
    entry(this, payload)
  }
```

`get state` 和 `set state` 这一对访问器实现了「只读」的约束。你写 `this.$store.state = {}` 不会真的替换掉 state，只会在控制台看到一条报错。真实的 Vuex 在严格模式下走得更远，它用 `$watch` 深度监听 state，一旦发现不是通过 mutation 改的就直接抛异常。

`commit` 和 `dispatch` 的实现几乎一模一样，唯一的区别在传给回调的第一个参数上。`commit` 传的是 `this.state`，所以 mutation 里第一个参数就是 state；`dispatch` 传的是 `this`，也就是整个 store 实例，所以 action 里可以解构出 `commit`、`dispatch`、`state`。

这一行代码的差别，就是这两个概念在使用体验上的全部差别。

### 6.3 install 与为什么 mutation 必须同步

```js
function install(_Vue) {
  Vue = _Vue

  // 混入 store 实例
  Vue.mixin({
    beforeCreate() {
      if (this.$options.store) {
        Vue.prototype.$store = this.$options.store
      }
    }
  })
}

// { Store, install } 相当于 Vuex，它必须实现 install 方法
export default { Store, install }
```

这段和 router 的 install 是一个套路，不再重复。

回到那个高频面试题，mutation 为什么必须同步？

看上面 `commit` 的实现就明白了，它是同步调用 `entry(this.state, payload)` 的。如果你在 mutation 里写了 `setTimeout` 再改 state，那么 `commit` 这个函数返回的时候 state 还没变。

对代码本身没什么影响，真正受影响的是 devtools。Vuex devtools 的工作方式是在每次 commit 前后各记录一次 state 快照，用来做时间旅行调试。mutation 里塞了异步代码，devtools 记下的「变更后快照」拿到的是旧值，整个调试记录就对不上了，你会看到一条 mutation 记录显示 state 完全没变。

所以这不是技术限制，是为了让状态变更可追踪而立的规矩。异步的部分统一放到 action 里，action 里再 commit 一个同步的 mutation，这样每一次 state 变更都精确对应一条 devtools 记录。

更多 Vuex 的实际用法可以看 [Vuex 使用总结](https://feinterview.poetries.top/blog/vue-vuex)。

## 七、这两个库现在长什么样

上面这套写法对应的是 Vue 2 时代的 vue-router 3 和 vuex 3。Vue 3 出来之后变化不小。

vue-router 4 用 `createRouter` 加 `createWebHistory` 或 `createWebHashHistory` 替代了 `new VueRouter({ mode })`，模式从配置项变成了独立的工厂函数，好处是没用到的那部分代码可以被 tree-shaking 掉。组合式 API 里用 `useRouter` 和 `useRoute` 取代 `this.$router`。

Vuex 4 主要是适配 Vue 3，API 基本没变。但官方现在推荐的是 Pinia，它去掉了 mutations 这一层，只保留 state、getters、actions，action 里可以直接改 state。少了一层转发之后 TypeScript 的类型推导顺畅很多，这也是 Pinia 最主要的动机。

不是说 Vuex 不行，而是 mutation 那一层的收益在 devtools 能力增强之后被摊薄了。老项目继续用 Vuex 完全没问题，新项目从 Pinia 起步会省事一些。原理上它们仍然是同一套东西，响应式的容器加上受控的修改入口。

## 总结

vue-router 和 vuex 的实现骨架是同一个。都通过 `install` 加 `Vue.mixin` 在 `beforeCreate` 时把实例挂到 `Vue.prototype` 上，都依赖 Vue 自身的响应式系统来驱动更新。

vue-router 的核心是那个响应式的 `current`。`router-view` 在 render 时读它完成依赖收集，`hashchange` 回调改它触发重新渲染，中间不需要任何手动的 DOM 操作。理解了这一点，「vue-router 靠 hashchange 实现」这个答案就可以升级成完整的链路描述了。

vuex 的核心是那个借来的 Vue 实例。它没有自己实现响应式，而是 `new Vue({ data: { $$state } })` 白捡了一套。`commit` 和 `dispatch` 的区别只有一行，前者给回调传 state，后者传整个 store。

mutation 必须同步这条规矩不是技术限制，是为了让 devtools 的前后快照能一一对应，保住时间旅行调试的能力。

## 参考

- [Vue Router 官方文档](https://router.vuejs.org/zh/)
- [Vuex 官方文档](https://vuex.vuejs.org/zh/)
- [Vue 2 官方文档 插件](https://v2.cn.vuejs.org/v2/guide/plugins.html)
- [Pinia 官方文档](https://pinia.vuejs.org/zh/)
- [MDN History API](https://developer.mozilla.org/zh-CN/docs/Web/API/History_API)
- [前端进阶之旅](https://interview.poetries.top)
