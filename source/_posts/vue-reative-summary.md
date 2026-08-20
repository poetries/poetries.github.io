---
title: Vue响应式原理模拟 手写一个迷你版Vue
description: 从 Object.defineProperty 和 Proxy 讲起，理清发布订阅与观察者模式的区别，再动手实现 Vue、Observer、Compiler、Dep、Watcher 五个类，把数据变化到视图更新这条链路完整跑通。
date: 2021-03-28 18:40:12
tags:
  - Vue
  - 响应式原理
  - 源码
categories: Front-End
---

面试里问「Vue 的响应式原理是什么」，多数人能背出 `Object.defineProperty` 劫持 getter/setter 这句话。再往下追一层，「那 getter 里到底收集了什么」「Dep 和 Watcher 谁持有谁」「视图为什么会自己更新」，能答清楚的就少了。这些细节光看文章记不住，得自己敲一遍。这篇就是把 Vue 2 的响应式链路拆成五个类手写一遍，从最底层的数据劫持开始，一路搭到指令编译和视图更新，中间穿插 Vue 3 换成 Proxy 之后到底改善了什么。代码不长，跑通之后你对「数据变了页面为什么会动」会有一个能站得住的解释。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 数据响应式、双向绑定、数据驱动这三个词各自指什么
- Vue 2 的 `Object.defineProperty` 方案，以及它绕不过去的四个局限
- Vue 3 的 `Proxy` 方案补上了哪些能力，代价是什么
- 发布订阅模式和观察者模式的真实区别，不是同一个东西
- 手写 Vue、Observer、Compiler、Dep、Watcher 五个类，把整条链路跑通
- 这套模拟实现和真实 Vue 之间还差什么

## 一、数据驱动到底在说什么

数据响应式、双向绑定、数据驱动，这三个词经常被混着用，但它们说的不是一件事。

数据响应式说的是，数据模型仅仅是普通的 JavaScript 对象，而当我们修改数据时，视图会进行更新，避免了繁琐的 DOM 操作，提高开发效率。这是单向的，数据到视图。

双向绑定说的是，数据改变视图改变，视图改变数据也随之改变。我们可以使用 `v-model` 在表单元素上创建双向数据绑定。它是在响应式的基础上，反向再加了一条从 DOM 事件到数据的通路。

数据驱动是 Vue 最独特的特性之一。开发过程中仅需要关注数据本身，不需要关心数据是如何渲染到视图的。

顺序上，响应式是地基，双向绑定是它的一个应用，数据驱动是使用者的体感。后面手写的时候你会看到，双向绑定无非就是在 `v-model` 的更新函数里多绑了一个 `input` 事件监听而已。

## 二、数据响应式的核心原理

### Vue 2.x 的 Object.defineProperty

- [Vue 2.x深入响应式原理](https://cn.vuejs.org/v2/guide/reactivity.html)
- [MDN - Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
- 浏览器兼容 IE8 以上(不兼容 IE8)

先用最小的代码把「劫持」这件事演示出来。下面这段模拟了 Vue 实例代理 data 的过程，读 `vm.msg` 走 getter，写 `vm.msg` 走 setter，在 setter 里顺手改一下 DOM：

```js
// 模拟 Vue 中的 data 选项 
let data = {
    msg: 'hello'
}
// 模拟 Vue 的实例 
let vm = {}
// 数据劫持:当访问或者设置 vm 中的成员的时候，做一些干预操作
Object.defineProperty(vm, 'msg', {
  // 可枚举(可遍历)
  enumerable: true,
  // 可配置(可以使用 delete 删除，可以通过 defineProperty 重新定义) 
  configurable: true,
  // 当获取值的时候执行 
  get () {
    console.log('get: ', data.msg)
    return data.msg 
  },
  // 当设置值的时候执行 
  set (newValue) {
    console.log('set: ', newValue) 
    if (newValue === data.msg) {
      return
    }
    data.msg = newValue
    // 数据更改，更新 DOM 的值 
    document.querySelector('#app').textContent = data.msg
  } 
})

// 测试
vm.msg = 'Hello World' 
console.log(vm.msg)
```

跑一下就会发现，`vm.msg = 'Hello World'` 这一句普通的赋值，顺带把页面也改了。响应式的全部魔法，起点就是这里。

那问题来了，如果有一个对象中多个属性需要转换 getter/setter 如何处理？答案是遍历。`Object.keys(data).forEach(...)` 挨个定义一遍，遇到属性值还是对象就递归下去。这也是 Vue 2 方案最尴尬的地方之一。

### defineProperty 绕不过去的四个局限

先说结论，Vue 2 里那些「为什么我改了数据页面不动」的经典问题，根子都在这个 API 的能力边界上。

第一，它劫持的是属性，不是对象。所以必须在初始化的时候把 data 递归遍历一遍，对象层级越深、字段越多，初始化开销越大，而且这些开销不管你用不用得上都得先付。

第二，新增和删除属性感知不到。`data.user.age = 18` 这个 `age` 如果初始化时不存在，它就没被 `defineProperty` 处理过，页面不会更新。Vue 2 只能额外提供 `Vue.set` 和 `Vue.delete` 这一对补丁 API。

第三，数组的索引赋值和 `length` 修改也拦不住。`arr[0] = 1` 和 `arr.length = 0` 都不会触发更新。Vue 2 的做法是把数组的原型换掉，重写 `push`、`pop`、`shift`、`unshift`、`splice`、`sort`、`reverse` 这七个会改变原数组的方法，在里面手动触发通知。所以你用这七个方法改数组是响应式的，用下标不是。

第四，Map、Set 这类新的集合类型完全没辙。

这四条不是实现得不好，是 `Object.defineProperty` 的设计本来就只面向单个属性。要根治，得换一个能代理「整个对象」的东西。

### Vue 3.x 的 Proxy

- [MDN - Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- 直接监听对象，而非属性
- `ES 6` 中新增，`IE` 不支持，性能由浏览器优化

同样的功能用 Proxy 写是这样：

```js
// 模拟 Vue 中的 data 选项 
let data = {
  msg: 'hello',
  count: 0 
}
// 模拟 Vue 实例
let vm = new Proxy(data, {
  // 当访问 vm 的成员会执行
  get (target, key) {
    console.log('get, key: ', key, target[key])
    return target[key]
  },
  // 当设置 vm 的成员会执行
  set (target, key, newValue) {
    console.log('set, key: ', key, newValue)
    if (target[key] === newValue) {
      return
    }
    target[key] = newValue
    document.querySelector('#app').textContent = target[key]
  }
})

// 测试
vm.msg = 'Hello World'
console.log(vm.msg)
```

代码量差不多，但能力天差地别。注意 `get` 和 `set` 的第二个参数是 `key`，也就是说这一套拦截器能处理这个对象上的任意属性，包括初始化时不存在的。数组索引、`length`、`delete` 操作、`in` 判断，Proxy 都有对应的拦截钩子，一共十三种。

Vue 3 还在这基础上做了一件很划算的事：惰性代理。`reactive` 只代理最外层，某个嵌套对象只有在被真正访问到的时候才会被包成 Proxy。初始化不再需要深度遍历，大对象的启动成本一下就降下来了。

代价只有一个，Proxy 是 ES6 特性且无法被 polyfill，所以 Vue 3 不支持 IE11。这也是 Vue 3 敢直接换掉底座的原因，当时 IE 已经可以放弃了。

顺便提一句实现细节的差异。Vue 3 的依赖不再挂在每个属性的闭包里，而是用一个全局的 `WeakMap` 做三层映射，从 target 找到它的属性表，再从属性名找到对应的依赖集合。用 `WeakMap` 是为了不阻止对象被垃圾回收。这套结构在 Vue 3 的后续版本里还被优化过几轮，具体实现以官方仓库为准。

另外，Vue 3 里 `setter` 必须返回 `true`，否则严格模式下会抛 `TypeError`。上面这段模拟代码为了突出主线省掉了这一点，真写业务代码时别照抄。

## 三、发布订阅模式和观察者模式

手写之前得先把这两个模式分清楚，因为后面 Dep 和 Watcher 的关系正是观察者模式，而 Vue 的自定义事件是发布订阅。很多文章把它们当成同一个，其实不是。

### 发布订阅模式

发布订阅模式有三个角色：

- 订阅者
- 发布者
- 信号中心

我们假定存在一个「信号中心」，某个任务执行完成，就向信号中心「发布」（publish）一个信号，其他任务可以向信号中心「订阅」（subscribe）这个信号，从而知道什么时候自己可以开始执行。这就叫做发布订阅模式。

Vue 的自定义事件就是这个模式：

```js
let vm = new Vue()
vm.$on('dataChange', () => { console.log('dataChange')})
vm.$on('dataChange', () => { 
  console.log('dataChange1')
}) 
vm.$emit('dataChange')
```

兄弟组件通信过程也是同一套东西，中间那个 `eventHub` 就是信号中心：

```js
// eventBus.js
// 事件中心
let eventHub = new Vue()

// ComponentA.vue
// 发布者
addTodo: function () {
  // 发布消息(事件)
  eventHub.$emit('add-todo', { text: this.newTodoText }) 
  this.newTodoText = ''
}
// ComponentB.vue
// 订阅者
created: function () {
  // 订阅消息(事件)
  eventHub.$on('add-todo', this.addTodo)
}
```

把这个信号中心自己实现一遍，也就三十行。核心是一个 `{ 事件名: [回调数组] }` 的字典：

```js
class EventEmitter {
  constructor(){
    // { eventType: [ handler1, handler2 ] }
    this.subs = {}
  }
  // 订阅通知
  $on(eventType, fn) {
    this.subs[eventType] = this.subs[eventType] || []
    this.subs[eventType].push(fn)
  }
  // 发布通知
  $emit(eventType) {
    if(this.subs[eventType]) {
      this.subs[eventType].forEach(v=>v())
    }
  }
}

// 测试
var bus = new EventEmitter()

// 注册事件
bus.$on('click', function () {
  console.log('click')
})

bus.$on('click', function () {
  console.log('click1')
})

// 触发事件 
bus.$emit('click')
```

要提一句，Vue 3 已经把实例上的 `$on` / `$off` / `$emit` 这套 API 移除了，事件总线的写法需要换成 `mitt` 这类第三方库，或者就用上面这个手写版本。

### 观察者模式

观察者模式里只有两个角色，没有中间人：

- 观察者（订阅者）就是 `Watcher`
  - `update()`：当事件发生时，具体要做的事情
- 目标（发布者）就是 `Dep`
  - `subs` 数组：存储所有的观察者
  - `addSub()`：添加观察者
  - `notify()`：当事件发生，调用所有观察者的 `update()` 方法
- 没有事件中心

```js
// 目标(发布者) 
// Dependency
class Dep {
  constructor () {
    // 存储所有的观察者
    this.subs = []
  }
  // 添加观察者
  addSub (sub) {
    if (sub && sub.update) {
      this.subs.push(sub)
    }
  }
  // 通知所有观察者
  notify () {
    this.subs.forEach(sub => sub.update())
  }
}

// 观察者(订阅者)
class Watcher {
  update () {
    console.log('update')
  }
}

// 测试
let dep = new Dep()
let watcher = new Watcher()
dep.addSub(watcher) 
dep.notify()
```

### 两者的区别

观察者模式是由具体目标调度的。事件触发时 `Dep` 直接去调用观察者的方法，所以观察者模式的订阅者与发布者之间是存在依赖的，`Dep` 手里握着 `Watcher` 的引用。

发布订阅模式由统一的调度中心调用，因此发布者和订阅者不需要知道对方的存在，两边都只认识那个信号中心。

![观察者模式与发布订阅模式的结构对比图，前者目标直接持有观察者，后者通过事件中心解耦](https://blog.poetries.top/img/static/images/20210328214834.png)

耦合度不同带来的取舍也不同。观察者模式耦合更紧但链路短、可追踪；发布订阅完全解耦但事件满天飞，出问题不好查。Vue 内部用观察者模式做响应式，是因为 Dep 和 Watcher 本来就是一体设计的，没必要再加一层中间人。

## 四、动手实现一个迷你Vue

### 整体分析

先看要做成什么样。目标是支持一个最小的 Vue 使用形态，能声明 data，能解析双大括号插值和 `v-text`、`v-model` 指令，数据变了视图跟着变，输入框输入了数据也跟着变。

![迷你版 Vue 的整体结构图，Vue 类关联 Observer 与 Compiler，Dep 与 Watcher 建立依赖关系](https://blog.poetries.top/img/static/images/20210328214931.png)

五个类各管一摊：

- `Vue`：把 `data` 中的成员注入到 `Vue` 实例，并且把 `data` 中的成员转成 `getter/setter`
- `Observer`：能够对数据对象的所有属性进行监听，如有变动可拿到最新值并通知 `Dep`
- `Compiler`：解析每个元素中的指令和插值表达式，并替换成相应的数据
- `Dep`：添加观察者（`watcher`），当数据变化通知所有观察者
- `Watcher`：数据变化更新视图

### Vue

功能：

- 负责接收初始化的参数(选项)
- 负责把 `data` 中的属性注入到 `Vue` 实例，转换成 `getter/setter`
- 负责调用 `observer` 监听 `data` 中所有属性的变化
- 负责调用 `compiler` 解析指令/插值表达式

结构：

![Vue 类的结构图，包含 $options、$data、$el 属性和 _proxyData 方法](https://blog.poetries.top/img/static/images/20210328215207.png)

```js
class Vue {
  constructor (options) {
    // 1. 保存选项的数据
    this.$options = options || {}
    this.$data = options.data || {}

    const el = options.el
    this.$el = typeof options.el === 'string' ? document.querySelector(el) : el

    // 2. 负责把 data 注入到 Vue 实例
    this._proxyData(this.$data)
    // 3. 负责调用 Observer 实现数据劫持
    // 4. 负责调用 Compiler 解析指令/插值表达式等
  }
  _proxyData (data) {
    // 遍历 data 的所有属性
    Object.keys(data).forEach(key => {
      Object.defineProperty(this, key, {
        get () {
          return data[key]
        },
        set (newValue) {
          if (data[key] === newValue) {
            return
          }
          data[key] = newValue
        }
      })
    })
  }
}
```

`_proxyData` 这一步做的事情很具体：让你能写 `this.msg` 而不是 `this.$data.msg`。它只是把 `$data` 上的属性代理到实例上，真正的响应式还没开始，那是下一个类的活。这里的 getter/setter 用了 `Object.defineProperty` 的第三个参数对象，`get` 和 `set` 都是方法简写形式，注意别用箭头函数，会拿不到正确的 `this`。

### Observer

功能：

- 负责把 `data` 选项中的属性转换成响应式数据
- `data` 中的某个属性也是对象，把该属性转换成响应式数据
- 数据变化发送通知

结构：

![Observer 类的结构图，walk 遍历属性，defineReactive 定义响应式成员](https://blog.poetries.top/img/static/images/20210328215538.png)

```js
// 负责数据劫持
// 把 $data 中的成员转换成 getter/setter
class Observer {
  constructor (data) {
    this.walk(data)
  }
  // 1. 判断数据是否是对象，如果不是对象返回
  // 2. 如果是对象，遍历对象的所有属性，设置为 getter/setter
  walk (data) {
    if (!data || typeof data !== 'object') {
      return
    }
    // 遍历 data 的所有成员
    Object.keys(data).forEach(key => {
      this.defineReactive(data, key, data[key])
    })
  }
  // 定义响应式成员
  defineReactive (data, key, val) {
    const that = this
    // 如果 val 是对象，继续设置它下面的成员为响应式数据
    this.walk(val)
    Object.defineProperty(data, key, {
      configurable: true,
      enumerable: true,
      get () {
        return val
      },
      set (newValue) {
        if (newValue === val) {
          return
        }
        // 如果 newValue 是对象，设置 newValue 的成员为响应式
        that.walk(newValue)
        val = newValue
      }
    })
  }
}
```

这段有三处细节值得停一下。

`defineReactive` 把 `val` 作为参数传进来，而不是在 getter 里写 `data[key]`。为什么？因为 getter 里读 `data[key]` 会再次触发这个 getter，直接栈溢出。把值捞进函数参数当闭包变量存着，读写都操作这个闭包变量，就绕开了递归。

`const that = this` 是为了在 setter 里还能调到 Observer 实例的 `walk`。setter 是普通函数，`this` 指向的是被代理的那个 data 对象，不是 Observer。

setter 里那句 `that.walk(newValue)` 处理的是「给属性赋了一个新对象」的情况。新对象是从外面来的，身上没有任何劫持，得重新走一遍。这也解释了 Vue 2 为什么对深层对象的赋值有性能顾虑。

### Compiler

功能：

- 负责编译模板，解析指令/插值表达式
- 负责页面的首次渲染
- 当数据变化后重新渲染视图

结构：

![Compiler 类的结构图，包含 compile、compileElement、compileText 等方法](https://blog.poetries.top/img/static/images/20210328215943.png)

**1. compile()**

入口方法，遍历所有子节点，分文本节点和元素节点两条路处理，有子节点就递归下去：

```js
// 负责解析指令/插值表达式
class Compiler {
  constructor (vm) {
    this.vm = vm
    this.el = vm.$el
    // 编译模板
    this.compile(this.el)
  }
  // 编译模板
  // 处理文本节点和元素节点
  compile (el) {
    const nodes = el.childNodes
    Array.from(nodes).forEach(node => {
      // 判断是文本节点还是元素节点
      if (this.isTextNode(node)) {
        this.compileText(node)
      } else if (this.isElementNode(node)) {
        this.compileElement(node)
      }

      if (node.childNodes && node.childNodes.length) {
        // 如果当前节点中还有子节点，递归编译
        this.compile(node)
      }
    })
  }
  // 判断是否是文本节点
  isTextNode (node) {
    return node.nodeType === 3
  }
  // 判断是否是属性节点
  isElementNode (node) {
    return node.nodeType === 1
  }
  // 判断是否是以 v- 开头的指令
  isDirective (attrName) {
    return attrName.startsWith('v-')
  }
  // 编译文本节点
  compileText (node) { }
  // 编译属性节点 
  compileElement (node) { }
}
```

`childNodes` 返回的是一个动态的 NodeList，所以先 `Array.from` 转成静态数组再遍历，避免遍历过程中节点变动带来的意外。

**2. compileText()**

负责编译插值表达式。用正则把双大括号里的属性名抠出来，去实例上取值，再替换回文本：

```js
// 编译文本节点
compileText (node) {
  const reg = /\{\{(.+)\}\}/
  // 获取文本节点的内容
  const value = node.textContent
  if (reg.test(value)) {
    // 插值表达式中的值就是我们要的属性名称
    const key = RegExp.$1.trim()
    // 把插值表达式替换成具体的值
    node.textContent = value.replace(reg, this.vm[key])
  }
}
```

这里有个坑要注意：`(.+)` 是贪婪匹配，一个文本节点里如果写了两个插值，正则会从第一个左括号一路吃到最后一个右括号，抠出来的 key 就全乱了。改成非贪婪的 `(.+?)` 并配合 `g` 标志循环替换才严谨。真实的 Vue 编译器当然不是靠正则硬啃，它有完整的模板解析器会先把模板转成 AST，这个我在 [虚拟DOM原理分析](https://feinterview.poetries.top/blog/virtual-dom-analysis) 里聊过一部分。这份模拟实现保留正则写法，是因为它足够短，能让主线不被解析器细节淹没。

**3. compileElement()**

负责编译元素的指令，处理 `v-text` 和 `v-model` 的首次渲染：

```js
// 编译属性节点
compileElement (node) {
  // 遍历元素节点中的所有属性，找到指令
  Array.from(node.attributes).forEach(attr => {
    // 获取元素属性的名称
    let attrName = attr.name
    // 判断当前的属性名称是否是指令
    if (this.isDirective(attrName)) {
      // attrName 的形式 v-text v-model
      // 截取属性的名称，获取 text model
      attrName = attrName.substr(2)
      // 获取属性的名称，属性的名称就是我们数据对象的属性 v-text="name"，获取的是name
      const key = attr.value
      // 处理不同的指令
      this.update(node, key, attrName)
    }
  })
}
// 负责更新 DOM
// 创建 Watcher
update (node, key, dir) {
  // node 节点，key 数据的属性名称，dir 指令的后半部分
  const updaterFn = this[dir + 'Updater']
  updaterFn && updaterFn(node, this.vm[key])
}
// v-text 指令的更新方法
textUpdater (node, value) {
  node.textContent = value
}
// v-model 指令的更新方法
modelUpdater (node, value) {
  node.value = value
}
```

`this[dir + 'Updater']` 这个写法挺聪明，把指令名映射成方法名，加新指令只要多写一个 `xxxUpdater` 方法，`update` 一行都不用改。

但这里埋了个 bug：`updaterFn(node, this.vm[key])` 是直接调用，函数里的 `this` 会丢。后面创建 Watcher 时要用到 `this.vm`，所以必须改成 `updaterFn.call(this, ...)`，下面就会看到修正版。

### Dep（Dependency）

![Dep 在响应式流程中的位置示意图，getter 收集依赖 setter 通知更新](https://blog.poetries.top/img/static/images/20210328220733.png)

功能：

- 收集依赖，添加观察者（`watcher`）
- 通知所有观察者

结构：

![Dep 类的结构图，subs 数组存储观察者，addSub 添加，notify 通知](https://blog.poetries.top/img/static/images/20210328220757.png)

```js
class Dep {
  constructor () {
    // 存储所有的观察者
    this.subs = []
  }
  // 添加观察者 
  addSub (sub) {
    if (sub && sub.update) {
      this.subs.push(sub)
    } 
  }
  // 通知所有观察者 
  notify () {
    this.subs.forEach(sub => sub.update()) 
  }
}
```

Dep 要接进 `defineReactive` 里才有意义。每个响应式属性对应一个 Dep 实例，它活在闭包里，getter 时收集，setter 时通知：

```js
// defineReactive 中
// 创建 dep 对象收集依赖
const dep = new Dep()


// getter 中
// get 的过程中收集依赖
Dep.target && dep.addSub(Dep.target)

// setter 中
// 当数据变化之后，发送通知
dep.notify()
```

`Dep.target` 是整套设计里最巧的一处，也是最容易看晕的一处。

问题是这样的：getter 被触发的时候，它只知道「有人在读我」，但不知道读的人是谁。JavaScript 没有办法在函数里反查调用者。那怎么把「当前正在求值的那个 Watcher」传进 getter 里？答案是用一个全局变量当传声筒。Watcher 在读数据之前，先把自己挂到 `Dep.target` 上，读完立刻清掉。这样 getter 执行的那一瞬间，`Dep.target` 里躺着的一定就是它。

真实的 Vue 2 源码里这个变量配了一个栈，`pushTarget` 和 `popTarget` 成对使用。因为组件是嵌套渲染的，父组件渲染到一半会去渲染子组件，子组件渲染完必须把 `Dep.target` 还原成父组件的 Watcher，一个变量存不下这种嵌套关系。这份模拟实现里直接置 null，是简化写法。

### Watcher

![Watcher 在响应式流程中的位置示意图，实例化时把自己注册进 Dep](https://blog.poetries.top/img/static/images/20210328221004.png)

功能：

- 当数据变化触发依赖，`dep` 通知所有的 `Watcher` 实例更新视图
- 自身实例化的时候往 `dep` 对象中添加自己

结构：

![Watcher 类的结构图，构造函数接收 vm、key、cb，update 方法对比新旧值](https://blog.poetries.top/img/static/images/20210328221037.png)

```js
class Watcher {
  constructor (vm, key, cb) {
    this.vm = vm
    // data 中的属性名称
    this.key = key
    // 当数据变化的时候，调用 cb 更新视图
    this.cb = cb
    // 在 Dep 的静态属性上记录当前 watcher 对象，当访问数据的时候把 watcher 添加到dep 的 subs 中
    Dep.target = this
    // 触发一次 getter，让 dep 为当前 key 记录 watcher
    this.oldValue = vm[key]
    // 清空 target
    Dep.target = null
  }
  update () {
    const newValue = this.vm[this.key]
    if (this.oldValue === newValue) {
      return
    }
    this.cb(newValue)
  }
}
```

构造函数里那句 `this.oldValue = vm[key]` 是整段代码的关键，它看着像是在存旧值，实际的目的是主动触发一次 getter。因为只有触发 getter，`dep.addSub(Dep.target)` 才会执行，这个 Watcher 才能被收进对应属性的依赖列表里。存旧值只是顺带。

再看 `update`，它做了一次新旧值对比，相等就直接返回。这一步省掉了大量无意义的 DOM 操作，把同一个值重复赋十次也只会渲染一次。

在 `compiler.js` 中为每一个指令和插值表达式创建 `watcher` 对象，监视数据的变化：

```js
// 因为在 textUpdater 等中要使用 this
updaterFn && updaterFn.call(this, node, this.vm[key], key)

// v-text 指令的更新方法
textUpdater (node, value, key) {
  node.textContent = value
  // 每一个指令中创建一个 watcher，观察数据的变化
  new Watcher(this.vm, key, value => {
    node.textContent = value
  })
}
```

这里就是前面说的 `.call(this, ...)` 修正。Watcher 的第三个参数是个回调闭包，它捕获了当前这个 `node`，所以数据一变，改的就是这个具体的 DOM 节点，不需要重新查找。

### 视图变化更新数据

到这里数据到视图的通路已经通了，双向绑定还差反方向那一半。做法就是在 `v-model` 的更新方法里额外监听一次 `input` 事件：

```js
// v-model 指令的更新方法
modelUpdater (node, value, key) {
  node.value = value
  // 每一个指令中创建一个 watcher，观察数据的变化
  new Watcher(this.vm, key, value => {
    node.value = value
  })
  // 监听视图的变化
  node.addEventListener('input', () => {
    this.vm[key] = node.value
  })
}
```

原文这段少了 `new Watcher(...)` 的右括号，上面补上了。这个方法里两条通路是对称的：Watcher 负责数据到视图，事件监听负责视图到数据。`v-model` 的全部秘密就这么多。

## 五、整体回顾

通过下图回顾整体流程：

![Vue 响应式原理整体流程图，从 new Vue 到 Observer、Compiler、Dep、Watcher 的完整链路](https://blog.poetries.top/img/static/images/20210328221437.png)

- Vue
  - 记录传入的选项，设置 `$data/$el`
  - 把 `data` 的成员注入到 `Vue` 实例
  - 负责调用 `Observer` 实现数据响应式处理(数据劫持)
  - 负责调用 `Compiler` 编译指令/插值表达式等
- `Observer`
  - 数据劫持
    - 负责把 `data` 中的成员转换成 `getter/setter`
    - 负责把多层属性转换成 `getter/setter`
    - 如果给属性赋值为新对象，把新对象的成员设置为 `getter/setter`
  - 添加 `Dep` 和 `Watcher` 的依赖关系
  - 数据变化发送通知
- `Compiler`
  - 负责编译模板，解析指令/插值表达式
  - 负责页面的首次渲染过程
  - 当数据变化后重新渲染
- `Dep`
  - 收集依赖，添加订阅者（`watcher`）
  - 通知所有订阅者
- `Watcher`
  - 自身实例化的时候往 `dep` 对象中添加自己
  - 当数据变化 `dep` 通知所有的 `Watcher` 实例更新视图

一句话串起来：Observer 在 getter 里把 Watcher 收进 Dep，在 setter 里让 Dep 挨个通知 Watcher，Watcher 拿到通知去改自己那个 DOM 节点。

### 这套模拟和真实 Vue 还差什么

得说清楚，上面这份实现是为了讲原理，离能用还差好几层。

差的第一层是异步更新队列。真实的 Vue 里 setter 触发的不是立即渲染，而是把 Watcher 推进一个去重的队列，等本轮同步代码跑完在微任务里统一刷新。所以连着改十次数据只会渲染一次，`this.$nextTick` 拿到的就是这次刷新之后的 DOM。上面的模拟是同步改 DOM，改一次渲染一次。

差的第二层是虚拟 DOM 和 diff。这份实现里每个指令绑一个 Watcher，粒度细到属性级别，数据一多 Watcher 数量会爆炸。Vue 2 的实际做法是一个组件一个渲染 Watcher，数据变了先生成新的虚拟 DOM 树，再和旧树 diff 出最小的真实 DOM 操作。粒度粗了，但内存省得多。

差的第三层是 Vue 3 的重构。Vue 3 用 Proxy 换掉了 `Object.defineProperty`，用 `effect` 换掉了 Watcher 类，依赖收集从对象闭包搬进了全局 WeakMap。而且响应式这块被单独拆成了 `@vue/reactivity` 包，可以脱离 Vue 单独使用。`ref`、`reactive`、`computed`、`watch` 这些组合式 API 就是这层能力的对外出口，用法我写在 [Vue3之Composition API详解](https://feinterview.poetries.top/blog/vue3-composition-api) 里了。

## 总结

把这一圈过下来，几个能直接带走的结论：

- 响应式的起点是数据劫持，Vue 2 用 `Object.defineProperty` 劫持属性，Vue 3 用 `Proxy` 代理整个对象
- Vue 2 那些「改了不更新」的坑，新增属性、删除属性、数组下标赋值、修改 length，全都源于 `defineProperty` 只能作用于已存在的单个属性
- Proxy 一次解决这四类问题，还顺带支持了惰性代理和 Map/Set，代价是放弃 IE
- 发布订阅有信号中心、双方解耦，观察者模式没有中间人、目标直接持有观察者；Vue 的自定义事件是前者，Dep 和 Watcher 是后者
- `Dep.target` 是把「谁在读数据」传进 getter 的唯一手段，真实源码里它是一个栈，因为组件渲染是嵌套的
- Watcher 构造函数里读一次 `vm[key]`，目的是触发 getter 完成依赖收集，不是为了存旧值
- 双向绑定不神秘，就是在 `v-model` 的更新方法里多加一个 `input` 事件监听

我的建议是把这五个类照着敲一遍再跑通，比读十篇源码解析都有用。至少下次面试被追问「getter 里到底收集了什么」的时候，你脑子里浮现的会是自己写过的那几行代码。响应式这块如果还想再看一个角度的讲法，可以对照我之前那篇 [vue响应式原理](https://feinterview.poetries.top/blog/vue-reative)。

## 参考

- [Vue 3 官方文档 - 深入响应式系统](https://cn.vuejs.org/guide/extras/reactivity-in-depth.html)
- [Vue 2 官方文档 - 深入响应式原理](https://cn.vuejs.org/v2/guide/reactivity.html)
- [MDN - Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
- [MDN - Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [MDN - Reflect](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect)
- [vuejs/core - GitHub](https://github.com/vuejs/core)
- [前端进阶之旅](https://interview.poetries.top)
