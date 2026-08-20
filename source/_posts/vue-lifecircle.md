---
title: Vue 生命周期八个钩子完整拆解（五）
description: 用一段可运行的代码把 Vue 2 的八个生命周期钩子逐个跑一遍，讲清每个阶段 el、data、message 各是什么状态，以及 el、template、render 的优先级和 Vue 3 的钩子改名。
date: 2018-08-26 17:21:32
tags:
  - Vue
  - 生命周期
  - 前端基础
categories: Front-End
---

面试问「Vue 的生命周期有哪些」，背出八个钩子的名字不难。难的是下一个问题：请求应该发在 `created` 还是 `mounted`，为什么？这时候光背名字就不够了，得知道每个钩子跑的那一刻，实例上到底有什么、没有什么。这篇的做法是往八个钩子里各塞一段 `console.log`，把 `$el`、`$data`、`message` 三个东西在每个阶段的值都打出来，对着输出一段段解释。看完你不光能说清顺序，还能自己判断某段代码该往哪个钩子里放。

> 每个 Vue 实例在被创建之前都要经过一系列的初始化过程，这个过程就是 Vue 的生命周期。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 八个钩子的完整顺序，以及每个阶段实例上有什么
- `beforeCreate` 和 `created` 之间到底发生了什么
- 为什么没有 `el` 选项时生命周期会停在 `created`
- `render`、`template`、`outer HTML` 三者的优先级
- 数据更新时 `beforeUpdate` 和 `updated` 的触发时机
- 销毁阶段该清理什么，不清理会怎样
- 请求、DOM 操作、定时器分别该放在哪个钩子里
- Vue 3 的钩子改名和组合式 API 的写法

## 一、生命周期钩子函数

Vue 2 常用的八个钩子按执行顺序是这样的：

- `beforeCreate`
- `created`
- `beforeMount`
- `mounted`
- `beforeUpdate`
- `updated`
- `beforeDestroy`
- `destroyed`

除了这八个，Vue 2 还有 `activated` / `deactivated`（配合 `keep-alive` 用）和 `errorCaptured`（捕获子孙组件错误），日常用得少但真到场景里没有替代品。

下面这段代码把八个钩子全填上了，每个钩子里打印 `$el`、`$data`、`message` 三个值。直接扔进浏览器跑一遍，控制台的输出比任何图都直观：

```javascript
var vm = new Vue({
    el: '#app',
    data: {
      message: 'Vue的生命周期'
    },
    beforeCreate: function() {
      console.group('------beforeCreate创建前状态------');
      console.log("%c%s", "color:red" , "el     : " + this.$el); //undefined
      console.log("%c%s", "color:red","data   : " + this.$data); //undefined 
      console.log("%c%s", "color:red","message: " + this.message) 
    },
    created: function() {
      console.group('------created创建完毕状态------');
      console.log("%c%s", "color:red","el     : " + this.$el); //undefined
      console.log("%c%s", "color:red","data   : " + this.$data); //已被初始化 
      console.log("%c%s", "color:red","message: " + this.message); //已被初始化
    },
    beforeMount: function() {
      console.group('------beforeMount挂载前状态------');
      console.log("%c%s", "color:red","el     : " + (this.$el)); //已被初始化
      console.log(this.$el);
      console.log("%c%s", "color:red","data   : " + this.$data); //已被初始化  
      console.log("%c%s", "color:red","message: " + this.message); //已被初始化  
    },
    mounted: function() {
      console.group('------mounted 挂载结束状态------');
      console.log("%c%s", "color:red","el     : " + this.$el); //已被初始化
      console.log(this.$el);    
      console.log("%c%s", "color:red","data   : " + this.$data); //已被初始化
      console.log("%c%s", "color:red","message: " + this.message); //已被初始化 
    }
  })
```

更新和销毁那四个钩子的写法完全一样，只是打印的分组名不同：

```javascript
var vm = new Vue({
    // ...上面的选项省略
    beforeUpdate: function () {
      console.group('beforeUpdate 更新前状态===============》');
      console.log("%c%s", "color:red","el     : " + this.$el);
      console.log(this.$el);   
      console.log("%c%s", "color:red","data   : " + this.$data); 
      console.log("%c%s", "color:red","message: " + this.message); 
    },
    updated: function () {
      console.group('updated 更新完成状态===============》');
      console.log("%c%s", "color:red","el     : " + this.$el);
      console.log(this.$el); 
      console.log("%c%s", "color:red","data   : " + this.$data); 
      console.log("%c%s", "color:red","message: " + this.message); 
    },
    beforeDestroy: function () {
      console.group('beforeDestroy 销毁前状态===============》');
      console.log("%c%s", "color:red","el     : " + this.$el);
      console.log(this.$el);    
      console.log("%c%s", "color:red","data   : " + this.$data); 
      console.log("%c%s", "color:red","message: " + this.message); 
    },
    destroyed: function () {
      console.group('destroyed 销毁完成状态===============》');
      console.log("%c%s", "color:red","el     : " + this.$el);
      console.log(this.$el);  
      console.log("%c%s", "color:red","data   : " + this.$data); 
      console.log("%c%s", "color:red","message: " + this.message)
    }
  })
```

官方那张生命周期图把整条链路画得很完整，后面每一节讲的都是这张图上的一小段：

![Vue 实例生命周期完整流程图](https://s.poetries.top/gitee/2019/10/627.png)

## 二、beforeCreate 和 created 之间

先看这一段的输出。`beforeCreate` 里 `el` 和 `data` 都是 `undefined`，`message` 也拿不到；到了 `created`，`data` 已经初始化好了，`message` 有值了，但 `el` 还是 `undefined`。

这中间 Vue 干的事情是初始化事件系统和进行数据的观测。所谓数据观测，就是把 `data` 里的每个属性用 `Object.defineProperty` 改造成带 getter/setter 的响应式属性，之后改这些属性视图才会跟着变。这个改造过程的细节，我在 [实现数据的双向绑定 mvvm](https://feinterview.poetries.top/blog/vue-mvvm) 里从零写过一遍。

所以在 `created` 这一刻，数据是活的，DOM 还没有。

这条结论直接决定了一个高频问题的答案：请求放哪儿？放 `created` 就够了。数据已经能读能写，请求发出去、回来赋值给 `data`，视图渲染时自然带上数据，比放 `mounted` 早一步，能少一次「先渲染空白再渲染数据」的抖动。

反过来，任何需要操作真实 DOM 的代码（获取元素宽高、初始化第三方图表库、绑原生事件）都不能放在 `created` 里，因为这时候 `$el` 是 `undefined`。

## 三、created 到 beforeMount

这一段是整个生命周期里分支最多的地方：

![created 到 beforeMount 之间的判断分支](https://s.poetries.top/gitee/2019/10/628.png)

Vue 首先会判断实例上有没有 `el` 选项。有就继续向下编译；没有 `el` 选项，编译就停在这里，生命周期也跟着停住，直到你手动在这个实例上调用 `vm.$mount(el)`。

把上面那段代码里的 `el: '#app',` 注释掉再跑，可以看到控制台输出到 `created` 就没了：

![注释掉 el 选项后生命周期停在 created](https://s.poetries.top/gitee/2019/10/629.png)

如果后面继续调用 `vm.$mount(el)`，代码就会接着往下执行。这里的 `el` 参数就是要挂载的 DOM 节点。

```javascript
vm.$mount('#app')
```

这个设计在实际项目里是有用的。异步场景下你可能希望实例先创建、数据先备好，等某个条件满足了再挂到页面上，`$mount` 就是那个开关。

### 3.1 template 选项对生命周期的影响

过了 `el` 这一关，Vue 接着判断有没有 `template` 选项：

- 有 `template` 参数选项，就把它作为模板编译成 `render` 函数
- 没有 `template` 选项，就把外部 HTML（也就是 `el` 指向的那个元素本身的 HTML）作为模板编译
- 所以 `template` 中的模板优先级要高于 `outer HTML`

改一下代码验证。在 HTML 结构里写一串内容，同时在 Vue 对象里也给一个 `template`：

```html
<div id="app">
  <!--html 中修改的-->
  <h1>{{message + '这是在outer HTML中的'}}</h1>
</div>
```

```javascript
var vm = new Vue({
  el: '#app',
  // 在 vue 配置项中修改的
  template: "<h1>{{message +'这是在template中的'}}</h1>",
  data: {
    message: 'Vue的生命周期'
  }
})
```

页面输出的是 `Vue的生命周期这是在template中的`。把 `template` 选项注释掉再跑，输出变成 `Vue的生命周期这是在outer HTML中的`。原文这段示例的实例代码少了收尾的括号，直接复制会报语法错误，这里补上了。

顺便说一句，`el` 的判断为什么要排在 `template` 前面？因为 Vue 需要先通过 `el` 找到对应的 outer template，`el` 都没有的话，「外部 HTML」这个兜底选项根本无从谈起。

除了 `template`，Vue 实例里还可以直接写 `render` 函数，它以 `createElement` 作为参数，返回虚拟节点，而且可以直接嵌入 JSX：

```javascript
new Vue({
    el: '#app',
    render: function(createElement) {
        return createElement('h1', 'this is createElement')
    }
})
```

**三者的优先级是 `render` 函数选项 > `template` 选项 > `outer HTML`。**

这个顺序背后的逻辑很朴素，越接近最终产物的优先级越高。`render` 已经是编译完的结果，`template` 是待编译的字符串，`outer HTML` 是最后的兜底。用 `vue-cli` 或 Vite 构建的项目里，单文件组件的 `template` 块在构建阶段就被编译成了 `render` 函数，所以运行时走的其实一直是第一条路。

## 四、beforeMount 到 mounted

![beforeMount 到 mounted 之间给实例添加 $el](https://s.poetries.top/gitee/2019/10/630.png)

这一段 Vue 做的事情是给实例对象添加 `$el` 成员，并且替换掉挂载的 DOM 元素。对照前面 `console` 的输出，`beforeMount` 之前 `el` 一直是 `undefined`，从 `beforeMount` 开始它才有值。

但要注意，`beforeMount` 拿到的 `$el` 是还没渲染数据的那份：

![mounted 前后 DOM 内容的变化](https://s.poetries.top/gitee/2019/10/631.png)

在 `mounted` 之前，`h1` 里还是插值占位的原始模板，因为此时它还没有挂载到页面上，只是 JavaScript 里的虚拟 DOM 形式。`mounted` 之后可以看到 `h1` 里的内容变成了真实数据。

所以需要真实 DOM 的代码放在 `mounted` 里。这里有个我踩过的坑：`mounted` 只保证当前组件的 DOM 挂好了，不保证所有子组件都挂好了。如果你在父组件的 `mounted` 里去测一个由子组件异步渲染出来的元素的高度，很可能拿到 0。官方给的办法是套一层 `this.$nextTick`，把逻辑推到下一次 DOM 更新循环之后再执行。

## 五、beforeUpdate 到 updated

![数据变化触发 beforeUpdate 和 updated](https://s.poetries.top/gitee/2019/10/632.png)

当 Vue 发现 `data` 中的数据发生了改变，会触发对应组件的重新渲染，先后调用 `beforeUpdate` 和 `updated` 钩子函数。在控制台里输入：

```javascript
vm.message = '触发组件更新'
```

可以看到组件更新被触发了：

![控制台修改数据后触发组件更新](https://s.poetries.top/gitee/2019/10/633.png)

这两个钩子的差别在于 DOM 的状态。`beforeUpdate` 触发时数据已经是新的，DOM 还是旧的；`updated` 触发时 DOM 已经和数据同步了。

`updated` 里有个必须避开的雷：不要在里面修改响应式数据。改了会再次触发更新，更新完再进 `updated`，直接死循环把页面卡死。这个我踩过一次，页面直接白屏，浏览器标签页 CPU 拉满。要在数据变化后做联动，用 `watch` 或者计算属性，那才是干这件事的地方。相关用法在 [Vue 计算属性与数据监听](https://feinterview.poetries.top/blog/vue-computed-watch) 里有展开。

还有一点，改了 `data` 不一定会触发 `updated`。如果这个属性没有被任何模板用到，它变了页面也不需要重渲染，`updated` 自然不会跑。

## 六、beforeDestroy 到 destroyed

![beforeDestroy 和 destroyed 之间的销毁流程](https://s.poetries.top/gitee/2019/10/634.png)

`beforeDestroy` 钩子函数在实例销毁之前调用。在这一步，实例仍然完全可用，`data`、`methods`、DOM 都还在。

`destroyed` 钩子函数在 Vue 实例销毁后调用。调用后，Vue 实例指示的所有东西都会解除绑定，所有的事件监听器会被移除，所有的子实例也会被销毁。

需要留意的是「Vue 会自动清理什么」这条边界。Vue 负责清理的是它自己建立的那些东西：模板里用 `@click` 绑的事件、组件内部的 watcher、子组件实例。它管不到的是你手动创建的资源，比如 `setInterval` 起的定时器、`window.addEventListener` 加的监听、第三方图表实例、WebSocket 连接。这些必须自己在 `beforeDestroy` 里清掉。

不清会怎样？定时器还在跑，闭包里引用着已经销毁的组件实例，垃圾回收带不走，来回切几次路由内存就上去了。SPA 里的内存泄漏十有八九是这个原因。定时器清理的两种写法，我在 [Vue 项目中的痛点](https://feinterview.poetries.top/blog/vue-project-dev-question) 那篇里写了具体代码。

放 `beforeDestroy` 而不是 `destroyed`，是因为前者实例还完整可用，能正常访问 `this` 上的东西。

## 七、把八个钩子按用途归个类

绕了一圈，回到最实用的问题：手上这段代码该放哪个钩子？

| 要做的事 | 放哪 | 原因 |
|---------|------|------|
| 发接口请求 | `created` | 数据层已就绪，比 `mounted` 早，能减少白屏 |
| 初始化第三方 DOM 库（图表、编辑器、地图） | `mounted` | 这时候 `$el` 才有值 |
| 获取元素尺寸、位置 | `mounted` + `$nextTick` | 子组件可能还没渲染完 |
| 依赖数据变化的联动逻辑 | `watch` / `computed` | 不要放 `updated`，会死循环 |
| 清定时器、解绑原生监听、销毁第三方实例 | `beforeDestroy` | 实例还完整可用 |
| 路由离开前的拦截 | 路由守卫 | 生命周期钩子管不到导航 |

这张表基本覆盖了我日常写业务遇到的全部场景。

## 八、Vue 3 里生命周期变了什么

Vue 2 已经停止官方维护了，新项目基本都在 Vue 3 上。生命周期这块的变化有三处，迁移老项目时会碰到。

第一处是改名。`beforeDestroy` 改成了 `beforeUnmount`，`destroyed` 改成了 `unmounted`。语义上更准确，销毁这个词容易让人以为实例被回收了，实际上做的是卸载。其余六个钩子名字没变。

第二处是组合式 API 的写法。在 `setup` 里钩子要用 `on` 开头的函数形式注册，比如 `onMounted`、`onUpdated`、`onBeforeUnmount`。写法是这样：

```javascript
import { onMounted, onBeforeUnmount } from 'vue'

export default {
  setup() {
    let timer = null
    onMounted(() => {
      timer = setInterval(() => console.log('tick'), 1000)
    })
    onBeforeUnmount(() => {
      clearInterval(timer)
    })
  }
}
```

这个设计我一直觉得比选项式舒服的地方在于，建立和清理写在了一起。选项式 API 里定时器在 `mounted` 创建、在 `beforeDestroy` 清理，两段代码隔着几十行，改一处忘一处太常见了。组合式 API 把它们收进同一个函数里，还能进一步抽成可复用的组合函数。

第三处是 `beforeCreate` 和 `created` 在组合式 API 里没有对应的 `on` 函数。因为 `setup` 本身的执行时机就在这两个钩子之间，需要在那个阶段跑的代码直接写在 `setup` 里就行。用 `script setup` 语法糖时更直接，整个块的顶层代码就是这个位置。

另外 Vue 3 还补了两个仅在开发模式下生效的调试钩子，用来追踪某次重渲染是被哪个依赖触发的，排查「为什么这个组件又渲染了一遍」时很好用。完整清单以官方文档为准。

## 总结

把这一路串起来看，Vue 的生命周期其实是三个阶段：先把数据变成响应式的（`beforeCreate` 到 `created`），再把模板变成真实 DOM（`beforeMount` 到 `mounted`），之后进入「数据变则重渲染」的循环（`beforeUpdate` 到 `updated`），最后拆掉（`beforeDestroy` 到 `destroyed`）。

几条能直接用的判断：

数据相关的往前放，DOM 相关的往后放。`created` 里有数据没 DOM，`mounted` 里两者都有。

`el`、`template`、`render` 三者的优先级是 `render` > `template` > `outer HTML`，没有 `el` 时生命周期会停在 `created`，得靠 `$mount` 手动推进。

`updated` 里别改响应式数据，`beforeDestroy` 里该清的一样别落。这两条踩过一次就再也不会忘。

迁到 Vue 3 的话，先把 `beforeDestroy` / `destroyed` 这两个名字改掉，剩下的六个钩子名字是一样的。

## 参考

- [Vue 3 官方文档 - 生命周期](https://cn.vuejs.org/guide/essentials/lifecycle.html)
- [Vue 3 官方文档 - 生命周期选项](https://cn.vuejs.org/api/options-lifecycle.html)
- [Vue 3 官方文档 - 组合式 API 生命周期钩子](https://cn.vuejs.org/api/composition-api-lifecycle.html)
- [Vue 2 官方文档存档](https://v2.cn.vuejs.org/)
- [Vue 3 迁移指南](https://v3-migration.vuejs.org/)
- [前端进阶之旅](https://interview.poetries.top)
