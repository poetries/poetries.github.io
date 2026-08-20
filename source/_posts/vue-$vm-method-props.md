---
title: Vue 实例属性与实例方法完全指南（十三）
description: 梳理 Vue 实例上带 $ 前缀的属性与方法，$el、$refs、$data、$options、$watch、$nextTick 各自的用途和边界，标注哪些是 Vue 1.x 遗留、哪些在 Vue 3 里已经移除。
date: 2018-08-28 16:04:43
tags:
  - Vue
  - Vue 实例
  - nextTick
categories: Front-End
---

写 Vue 的人早晚会遇到这两个场景。一个是在 `created` 钩子里写 `this.$refs.chart.init()`，控制台直接报 `Cannot read property 'init' of undefined`；另一个是刚把 `this.list` 赋了新值，下一行马上去读 `this.$el.querySelectorAll('li').length`，拿到的还是旧的条数。这两个问题看着不搭边，根子却是同一个，就是你不知道 Vue 实例上那一堆带 `$` 的东西各自在什么时刻才可用。这篇把实例属性和实例方法按「组件树、DOM、数据、事件」四类过一遍，说清每个的用途、可用时机和踩坑点，顺带把 2018 年那会儿文档里还留着的一批 Vue 1.x 遗留 API 挑出来单独标注。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `$` 前缀到底是干什么用的，为什么 Vue 要把它和 data 分开
- 组件树相关的 `$parent`、`$root`、`$children`、`$refs`，以及为什么不建议用前三个
- `$el` 和 `$data`、`$options` 分别在什么时候可用
- 事件方法 `$on`、`$once`、`$emit`、`$off`，以及已经消失的 `$dispatch` 和 `$broadcast`
- `$watch` 的返回值和两个关键配置项
- `$nextTick` 解决的到底是什么问题，什么时候必须用
- 这些 API 在 Vue 3 里的存亡情况

## 一、$ 前缀是一条边界线

![Vue 实例属性总览](https://s.poetries.top/gitee/2019/10/613.png)

Vue 实例暴露了一批有用的属性和方法，它们都带 `$` 前缀，为的是和你自己写在 `data` 里的数据属性区分开。

这个设计不是为了好看。Vue 2 在初始化的时候会把 `data` 里的每个 key 代理到实例上，所以你写 `this.message` 实际访问的是 `this._data.message`。如果框架自己的属性不加前缀，你在 `data` 里定义一个叫 `el` 或者 `options` 的字段，就会直接把框架的东西盖掉。加了 `$` 之后，两套命名空间互不打扰。

顺着这个说一句，Vue 保留的还不止 `$`，下划线 `_` 开头的也是内部占用的，`_data`、`_uid`、`_watchers` 这些你能在实例上打印出来，但不要去动。真在 `data` 里写了 `_foo`，Vue 会拒绝代理它，你在模板里写 `_foo` 是取不到值的，得写 `$data._foo`。这一条很多人不知道，写下划线前缀的临时变量时会突然发现模板渲染不出来。

## 二、组件树上的四个属性

这一组用来在组件之间横向或纵向跳转。

- `$parent`：访问组件实例的父实例
- `$root`：访问当前组件树的根实例
- `$children`：访问当前组件实例的直接子组件实例
- `$refs`：访问模板里打了 `ref` 标记的子组件或 DOM 元素

先说结论，这四个里面只有 `$refs` 值得日常使用，另外三个能不用就不用。

`$parent` 和 `$root` 的问题在于把组件和它所处的位置绑死了。一个按钮组件里写了 `this.$parent.submit()`，那这个按钮就只能放在有 `submit` 方法的那个父组件里，换个地方就崩。组件之间要通信，往下用 props、往上用 `$emit`，跨层级的走状态管理，这条边界最好不要越。

`$children` 更麻烦一点，它返回的数组顺序不保证和你模板里的书写顺序一致，而且不包含通过 `v-if` 暂时没渲染的那些。想按顺序拿第几个子组件，写 `this.$children[0]` 迟早会翻车。

`$refs` 是这里面最实用的。有一点必须记住，`$refs` 只在组件渲染完成之后才被填充，而且它不是响应式的。

这就回到开头那个 `created` 里报 undefined 的问题。`created` 触发时组件的 render 函数还没跑，DOM 和子组件实例都不存在，`this.$refs` 是个空对象。要拿 ref，最早只能在 `mounted` 里。关于每个生命周期钩子分别在什么时候触发、里面能干什么，我在 [Vue 生命周期](https://feinterview.poetries.top/blog/vue-lifecircle) 那篇里按顺序拆过一遍。

顺带提一句 `v-ref`。2018 年不少中文教程还写着「用 `v-ref` 指令标记子组件」，那是 Vue 1.x 的写法，Vue 2 已经把它降级成普通的 `ref` 特性了，写 `ref="chart"` 就行，不带 `v-`。

## 三、DOM 访问

- `$el`：当前组件实例挂载的根 DOM 元素
- `$els`：Vue 1.x 里用来访问 `v-el` 标记的 DOM 元素

`$el` 是最直观的一个，拿到它就等于拿到了这个组件在页面上的那个根节点：

```html
<div id="app2">
    {{ message }}
</div>
<script>
    var vm2 = new Vue({
        el: "#app2",
        data: {
            message: "I am message."
        }
    });
    console.log(vm2.$el);          // vm2.$el 就是原生 js 里的 document.getElementById("app2")
    vm2.$el.style.color = "red";   // 变成红色
</script>
```

这段在演示的事情很简单，用 `$el` 直接拿到根元素然后改样式。能跑通，但真要在业务里这么写，得想清楚一件事，你手动改的这些 DOM 属性，在下一次 Vue 重新渲染这个节点时是有可能被覆盖掉的。所以 `$el` 的合理用途是那些 Vue 管不到的东西，比如量一下元素宽高、给它挂个第三方图表库、调 `scrollIntoView`。改样式和改内容还是交给 `:style`、`:class` 和模板。

上面列表里的 `$els` 要单独说一下。它和 `v-el` 指令一样，都是 Vue 1.x 的产物，Vue 2 里已经没有了。Vue 2 把 `v-el` 和 `v-ref` 合并成了统一的 `ref`，普通元素上的 `ref` 拿到的是 DOM 节点，组件上的 `ref` 拿到的是组件实例。原文这份清单是从早期资料抄下来的，这里保留原始条目，但要明确一句，`$els` 在 Vue 2 及之后的版本里不存在，别照着写。

## 四、数据访问

- `$data`：组件实例观察的数据对象
- `$options`：组件实例化时的初始化选项对象

`$data` 就是你写的那个 `data` 对象本身。用 `new Vue()` 并且传了一个外部对象进去时，`vm.$data === data` 是成立的，Vue 直接在原对象上做响应式改造，不会复制一份。这点在调试时挺有用，你在控制台改外部那个 `data` 对象，视图一样会更新。

`$options` 存的是初始化选项的合并结果，包括 `el`、`data`、`methods`，也包括你自己塞进去的自定义选项。有个常用小技巧是重置表单，`Object.assign(this.$data, this.$options.data())` 可以把组件数据一把还原成初始值，不用一个个字段手写。注意组件里的 `data` 是函数，所以要加括号调用；根实例上如果 `data` 传的是对象，这招就不适用。

## 五、DOM 操作方法

原始资料里列了这么几个：

- `$appendTo(elementOrSelector, callback)`：将 `el` 所指的 DOM 元素插入目标元素
- `$before(elementOrSelector, callback)`：将 `el` 所指的 DOM 元素或片段插入目标元素之前
- `$after(elementOrSelector, callback)`：将 `el` 所指的 DOM 元素或片段插入目标元素之后
- `$remove(callback)`：将 `el` 所指的 DOM 元素或片段从 DOM 中删除
- `$nextTick(callback)`：在下一次 DOM 更新循环后执行指定的回调函数

这里有个坑要注意。前四个全是 Vue 1.x 的实例方法，Vue 2 重写渲染层引入虚拟 DOM 之后就把它们去掉了，只有 `$nextTick` 活了下来。原因不难理解，虚拟 DOM 的前提是「真实 DOM 的结构由 render 结果推导出来」，你在外面手动 append、remove，下一次 patch 就对不上了。

Vue 2 里想达到同样效果，思路是换成声明式的。要挂到别的容器里就自己 `document.querySelector('#target').appendChild(vm.$el)` 之后调 `$mount()`；要卸载就调 `vm.$destroy()` 再手动移除 `vm.$el`。这些写法我只在弹窗、全局 toast 这类需要脱离父容器的组件里用过，普通业务组件没必要。

## 六、事件方法

这一组是 Vue 2 里实例通信的基础设施。

**监听**

- `$on(event, callback)`：监听实例的自定义事件
- `$once(event, callback)`：同上，但只触发一次

**触发**

- `$emit(event, args)`：在当前实例上触发事件
- `$dispatch(event, args)`：派发事件，先在当前实例触发，再沿父链一层层向上，对应的监听函数返回 `false` 就停止
- `$broadcast(event, args)`：广播事件，遍历当前实例的 `$children` 向下传播，对应的监听函数返回 `false` 就停止

同样得先纠一处。`$dispatch` 和 `$broadcast` 也是 Vue 1.x 的东西，Vue 2 把它们移除了，官方迁移指南给的替代方案就是集中式的状态管理或者一个独立的事件中心。这两个 API 被砍掉的理由写得很直白，基于组件树的事件冒泡和广播会让数据流向变得难以追踪，组件结构一调整，事件就断了。

留在 Vue 2 里能用的是 `$on`、`$once`、`$emit`、`$off` 这四个：

```html
<div id="ap2">
    <p>{{ num }}</p>
    <button @click="increase1"> add </button>
</div>
<button onclick="reduce2()"> reduce2 </button> <button onclick="offReduce()"> off reduce </button>
<script>
    var ap2 = new Vue({
        el: "#ap2",
        data: {
            num: 5
        },
        methods: {
            increase1: function () {
                this.num++;
            }
        }
    });
    // $on 定义事件，$once 定义只触发一次的事件
    ap2.$on("reduce", function (diff) {
        ap2.num -= diff;
    });

    // $emit 触发事件
    function reduce2() {
        ap2.$emit("reduce", 2);
    }

    // $off 解除事件，解除后定义的 reduce 事件将不再执行
    function offReduce() {
        ap2.$off("reduce");
    }
</script>
```

这段代码在演示一件事，Vue 实例本身就是一个事件中心，你可以在外部往它身上挂监听器，再从任意地方触发。页面上两个原生 button 故意写在 `#ap2` 外面，就是为了说明触发方和 Vue 的模板没有关系。

正是这个特性催生了当年最流行的跨组件通信方案，也就是事件总线。做法是 `var bus = new Vue()`，然后一个组件 `bus.$on` 订阅，另一个组件 `bus.$emit` 发布，绕开了组件树的层级限制。

用它的话有一个必须记住的动作，组件销毁前要 `$off` 掉自己注册的监听。`$on` 挂上去的回调是存在 bus 实例上的，组件销毁了它不会自动清理，回调里持有的 `this` 就一直被引用着，页面来回切几次内存就上去了，而且事件会被重复触发 N 次。这个我踩过，表现是同一个弹窗连着弹了三遍，排查了一下午才想到是路由切换时监听没解绑。正确写法是在 `beforeDestroy` 里精确解绑，`bus.$off('eventName', handler)` 传上原来那个函数引用，只写事件名会把别的组件挂的监听一起干掉。

`$off` 的三种调用形态值得记一下。不传参数是移除所有监听器，只传事件名是移除该事件的所有监听器，事件名加回调才是精确移除一个。

关于组件之间到底该用哪种通信方式，props 向下、`$emit` 向上、事件总线跨层，我在 [Vue 组件](https://feinterview.poetries.top/blog/vue-component) 那篇里做过对比。

## 七、$watch

`$watch` 是 `watch` 选项的命令式版本，用在「监听条件本身是动态的」场景。

```javascript
var data = { a: 1 }
var vm = new Vue({
  el: '#example',
  data: data
})

vm.$data === data // -> true
vm.$el === document.getElementById('example') // -> true

// $watch 是一个实例方法
var unwatch = vm.$watch('a', function (newVal, oldVal) {
  // 这个回调将在 vm.a 改变后调用
})
```

比起写在选项里的 `watch`，实例方法版本多了两个好处。一个是可以在运行时决定监听什么，比如根据接口返回的字段名动态建监听；另一个是它有返回值，返回的是一个取消监听的函数，调一下就停止观察。选项式的 `watch` 是跟着组件生命周期走的，组件销毁才停，中途想停没有官方入口。

两个配置项要知道。`deep: true` 会递归遍历对象的每一层去建立依赖，能监听到深层属性的变化，代价是对象越大开销越高，大数组上开 `deep` 是很典型的性能陷阱。`immediate: true` 让回调在建立监听时立刻执行一次，省掉「在 created 里先手动调一次、再写个 watch」的重复代码。

还有一条边界，Vue 2 的响应式基于 `Object.defineProperty`，对象新增和删除属性、数组按下标赋值都监听不到，得走 `Vue.set` 和 `Vue.delete`。这不是 `$watch` 的问题，是整个响应式系统的限制，具体机制在 [Vue 数据绑定](https://feinterview.poetries.top/blog/vue-data-bind) 里有展开。

## 八、$nextTick 到底在解决什么

把回调延迟到下次 DOM 更新循环之后执行。在修改数据之后立即使用它，然后等待 DOM 更新。它跟全局方法 `Vue.nextTick` 一样，不同的是回调里的 `this` 自动绑定到调用它的实例上。

```html
<div id="app"></div>
<button onclick="vm.$destroy()">销毁实例 $destroy</button>
<button onclick="vm.$forceUpdate()">强制重渲染 $forceUpdate</button>
<button onclick="edit()">更新 $nextTick(fn)</button>
<script>
    var Header = Vue.extend({
        template: `<p>{{ message }}</p>`,
        data: function () {
            return {
                message: "I am message"
            }
        },
        updated: function () {
            console.log("updated 更新之后");
        },
        destroyed: function () {
            console.log("destroy 销毁之后");
        }
    });
    var vm = new Header().$mount("#app");

    function edit() {
        vm.message = "new message";     // 更新数据
        vm.$nextTick(function () {      // 更新完成后调用
            console.log("更新完后，我被调用");
        })
    }
</script>
```

顺带修一处，原文这段代码块的 script 标签没有闭合，直接复制会跑不起来，上面补上了。

现在说为什么需要它。Vue 更新 DOM 不是同步的。你连着改十次 `this.count`，Vue 不会渲染十次，它把这些变化推进一个队列里去重，等当前这一轮 JavaScript 执行完再统一 patch 一次。这套批量策略是性能的关键，代价就是你赋值完那一行，DOM 还停在旧状态。

所以「改完数据立刻读 DOM」这件事天生是错的。

放在 `$nextTick` 回调里执行的，应该是那些会读写 DOM 的代码。什么时候必须用，大致这么几类：

- 在 `created` 钩子里要操作 DOM 的，一定要放进 `$nextTick` 回调。`created` 执行时 DOM 还没有渲染，这时候操作等于什么都没做。与之对应的是 `mounted`，那个钩子触发时挂载和渲染都完成了，直接操作没问题
- 数据变化之后要做的某个操作，依赖的是「随数据改变而改变的那部分 DOM 结构」，这个操作要放进 `$nextTick` 回调。典型场景是 `v-if` 打开一个弹窗后立刻给里面的输入框调 `focus()`，或者列表加了一条之后滚到底部
- 用了第三方库需要在 DOM 就绪后重新计算尺寸的，比如图表 resize、富文本编辑器初始化

实现层面简单提一句。`nextTick` 内部会挑一个异步任务把回调排到当前同步代码之后，Vue 2.5 以后优先走微任务（`Promise.then`），环境不支持时才降级到宏任务，具体的降级顺序以官方源码为准。所以 `$nextTick` 的回调比 `setTimeout(fn, 0)` 更早执行，这在两者混用时会影响顺序。

Vue 2.1 以后，`$nextTick` 不传回调会返回一个 Promise，可以直接 `await this.$nextTick()`，比嵌套回调好读。

## 九、这些 API 在 Vue 3 里还剩多少

Vue 2 已经在 2023 年底停止官方维护，新项目基本都在 Vue 3 上。这一节把上面提到的 API 对一遍现状，方便你迁移老代码时心里有数。

| API | Vue 3 状态 | 替代写法 |
|-----|-----------|---------|
| `$el` / `$refs` | 保留 | 组合式 API 里用 `ref()` 拿元素更常见 |
| `$data` / `$options` | 保留 | 选项式 API 下可用 |
| `$watch` / `$nextTick` / `$forceUpdate` | 保留 | 也可从 `vue` 直接引入 `watch`、`nextTick` |
| `$emit` | 保留 | 组件上建议配合 `emits` 选项声明 |
| `$on` / `$off` / `$once` | 已移除 | 官方推荐外部库，例如 mitt |
| `$children` | 已移除 | 用 `ref` 拿具体子组件 |
| `$destroy` | 已移除 | 根实例用 `app.unmount()` |
| `Vue.extend` | 已移除 | 用 `defineComponent` |

变化最大的是事件总线那套。`$on`、`$off`、`$once` 在 Vue 3 里被彻底删掉了，`new Vue()` 这个用法本身也不存在了，所以「造一个空实例当 bus」在 Vue 3 里连第一步都走不通。官方迁移指南给的方案是用第三方的事件发射器库，社区用得最多的是 mitt，API 也是 `on` / `off` / `emit`，迁移时改个引入基本就能跑。

另一个常见的迁移点是全局挂载。Vue 2 里往 `Vue.prototype` 上挂东西，比如 `Vue.prototype.$http = axios`，Vue 3 改成了 `app.config.globalProperties.$http = axios`。写法不同，效果一致，都是让所有组件实例上能直接访问。

`$refs` 在 Vue 3 的单文件组件里还多了一层限制。用 `script setup` 写的组件默认是封闭的，父组件通过 `ref` 拿到实例后访问不到内部的方法和数据，需要子组件用 `defineExpose` 显式暴露。这个改动我一开始也没适应，父组件调子组件方法一直报 undefined，查了半天才发现是这个原因。

## 总结

回到开头那两个问题。`created` 里 `this.$refs` 是空的，因为渲染还没发生；改完数据立刻读 DOM 拿到旧值，因为 Vue 的更新是批量异步的。两个答案指向同一件事，Vue 实例上的属性和方法都有明确的可用时机，脱离生命周期去谈某个 `$xx` 能不能用没有意义。

日常真正高频的其实只有四个，`$refs` 拿元素和子组件，`$emit` 往上抛事件，`$nextTick` 等渲染完成，`$watch` 做动态监听。剩下的 `$parent`、`$root`、`$children` 属于「能用但会让组件失去独立性」的那一类，遇到非用不可的场景，先想想是不是组件划分出了问题。

最后是这份清单的时效性。`$appendTo`、`$before`、`$after`、`$remove`、`$els`、`$dispatch`、`$broadcast` 这七个是 Vue 1.x 遗留，Vue 2 里就已经没有了；`$on`、`$off`、`$once`、`$children`、`$destroy` 在 Vue 2 里能用，Vue 3 里被移除。照着老教程写代码之前，先确认一下版本。

## 参考

- [Vue 2 官方文档 - 实例方法](https://v2.cn.vuejs.org/v2/api/#实例方法-数据)
- [Vue 3 官方文档 - 实例方法](https://cn.vuejs.org/api/component-instance.html)
- [Vue 3 迁移指南 - 事件 API](https://v3-migration.vuejs.org/breaking-changes/events-api.html)
- [Vue 3 迁移指南 - 全局 API](https://v3-migration.vuejs.org/breaking-changes/global-api.html)
- [mitt - 轻量事件发射器](https://github.com/developit/mitt)
- [前端进阶之旅](https://interview.poetries.top)
