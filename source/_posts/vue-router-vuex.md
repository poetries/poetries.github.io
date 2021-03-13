---
title: Vue Router、Vuex原理实践
date: 2021-03-13 15:12:12
tags: Vue
categories: Front-End
---

##  vue-router

> Vue Router 是 Vue.js 官方的路由管理器。它和 Vue.js 的核心深度集成，让构建单⻚面应用变得易如反 掌。

安装: vue add router 核心步骤:

1. 步骤一:使用vue-router插件，router.js

```js
 import Router from 'vue-router' 
 Vue.use(Router)
```

2. 步骤二:创建Router实例，router.js

```js
export default new Router({...})
```

3. 步骤三:在根组件上添加该实例，main.js

```js
import router from './router'

new Vue({
    router,
}).$mount("#app");
```

4. 步骤四:添加路由视图，`App.vue`

```
<router-view></router-view>
```

导航

```js
 <router-link to="/">Home</router-link> 
 <router-link to="/about">About</router-link>
```

### vue-router源码实现

- 作为一个插件存在:实现`VueRouter`类和`install`方法 
- 实现两个全局组件:`router-view`用于显示匹配组件内容，`router-link`用于跳转 
- 监控`url`变化:监听`hashchange`或`popstate`事件 
- 响应最新`url`:创建一个响应式的属性`current`，当它改变时获取对应组件并显示

创建kvue-router.js

```js
// 我们的插件：
// 1.实现一个Router类并挂载期实例
// 2.实现两个全局组件router-link和router-view
let Vue;

class VueRouter {
  // 核心任务：
  // 1.监听url变化
  constructor(options) {
    this.$options = options;

    // 缓存path和route映射关系
    // 这样找组件更快
    this.routeMap = {}
    this.$options.routes.forEach(route => {
      this.routeMap[route.path] = route
    })

    // 数据响应式
    // 定义一个响应式的current，则如果他变了，那么使用它的组件会rerender
    Vue.util.defineReactive(this, 'current', '')

    // 请确保onHashChange中this指向当前实例
    window.addEventListener('hashchange', this.onHashChange.bind(this))
    window.addEventListener('load', this.onHashChange.bind(this))
  }

  onHashChange() {
    // console.log(window.location.hash);
    this.current = window.location.hash.slice(1) || '/'
  }
}

// 插件需要实现install方法
// 接收一个参数，Vue构造函数，主要用于数据响应式
VueRouter.install = function (_Vue) {
  // 保存Vue构造函数在VueRouter中使用
  Vue = _Vue

  // 任务1：使用混入来做router挂载这件事情
  Vue.mixin({
    beforeCreate() {
      // 只有根实例才有router选项
      if (this.$options.router) {
        Vue.prototype.$router = this.$options.router
      }

    }
  })

  // 任务2：实现两个全局组件
  // router-link: 生成一个a标签，在url后面添加#
  // <a href="#/about">aaaa</a>
  // <router-link to="/about">aaa</router-link>
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
      // 使用jsx
      // return <a href={'#'+this.to}>{this.$slots.default}</a>
    }
  })
  Vue.component('router-view', {
    render(h) {
      // 根据current获取组件并render
      // current怎么获取?
      // console.log('render',this.$router.current);
      // 获取要渲染的组件
      let component = null
      const { routeMap, current } = this.$router
      if (routeMap[current]) {
        component = routeMap[current].component
      }
      return h(component)
    }
  })
}

export default VueRouter
```

## Vuex

> Vuex 集中式存储管理应用的所有组件的状态，并以相应的规则保证状态以可预测的方式发生变化

### 整合**vuex**

```js
vue add vuex
```

核心概念

- state 状态、数据 
- mutations 更改状态的函数 
- actions 异步操作
- store 包含以上概念的容器

1. 状态 **- state**

state保存应用状态

```js
 
export default new Vuex.Store({ state: { counter:0 },})
```

2. 状态变更 **- mutations**

mutations用于修改状态，store.js

```js
export default new Vuex.Store({
    mutations:
    {
      add(state) {
        state.counter++
      }
    }
  })
```

3. 派生状态 **- getters**

从state派生出新状态，类似计算属性

```js
export default new Vuex.Store({
    getters:
    {
      doubleCounter(state) { // 计算剩余数量 return state.counter * 2;
      }
    }
  })
```

4. 动作 **- actions**

加业务逻辑，类似于controller

```js
export default new Vuex.Store({
    actions:
    {
      add({
        commit
      }) {
        setTimeout(() = >{}
      }
    })
```

测试代码:

```js
 
<p @click="$store.commit('add')">counter: {{$store.state.counter}}</p>
<p @click="$store.dispatch('add')">async counter: {{$store.state.counter}}</p>
<p>double:{{$store.getters.doubleCounter}}</p>
```

### **vuex**原理解析

- 实现一个插件:声明Store类，挂载$store 
- Store具体实现:
  - 创建响应式的state，保存mutations、actions和getters 
  - 实现commit根据用户传入type执行对应mutation 
  - 实现dispatch根据用户传入type执行对应action，同时传递上下文 
  - 实现getters，按照getters定义对state做派生

```js
// 目标1：实现Store类，管理state（响应式的），commit方法和dispatch方法
// 目标2：封装一个插件，使用更容易使用
let Vue;

class Store {
  constructor(options) {
    // 定义响应式的state
    // this.$store.state.xx
    // 借鸡生蛋
    this._vm = new Vue({
      data: {
        $$state: options.state
      }
    })
    
    this._mutations = options.mutations
    this._actions = options.actions

    // 绑定this指向
    this.commit = this.commit.bind(this)
    this.dispatch = this.dispatch.bind(this)
  }

  // 只读
  get state() {
    return this._vm._data.$$state
  }

  set state(val) {
    console.error('不能直接赋值呀，请换别的方式！！天王盖地虎！！');
    
  }
  
  // 实现commit方法，可以修改state
  commit(type, payload) {
    // 拿出mutations中的处理函数执行它
    const entry = this._mutations[type]
    if (!entry) {
      console.error('未知mutaion类型');
      return
    }

    entry(this.state, payload)
  }

  dispatch(type, payload) {
    const entry = this._actions[type]

    if (!entry) {
      console.error('未知action类型');
      return
    }

    // 上下文可以传递当前store实例进去即可
    entry(this, payload)
  }
}

function install(_Vue){
  Vue = _Vue

  // 混入store实例
  Vue.mixin({
    beforeCreate() {
      if (this.$options.store) {
        Vue.prototype.$store = this.$options.store
      }
    }
  })
}

// { Store, install }相当于Vuex
// 它必须实现install方法
export default { Store, install }
```

