---
title: Vue API 盲点解析 performance errorHandler nextTick 与 watch
description: 拆解四个容易被忽略的 Vue API，config.performance 做组件耗时追踪、errorHandler 兜住框架吞掉的异常、nextTick 等的到底是什么、watch 的 deep 与 immediate 各自的代价，并附 Vue 3 对应写法。
date: 2019-06-02 00:40:12
tags:
  - Vue
  - Vue API
  - 前端性能
categories: Front-End
---

接手一个跑了两年的 Vue 项目，最常遇到的两件事：一是页面进去要等一秒多，但不知道慢在哪个组件；二是某个操作偶尔白屏，控制台干干净净，`window.onerror` 里什么都没有。这两个问题都不是写业务代码能解决的，得靠 Vue 全局配置上那几个平时没人翻的 API。这篇把 `config.performance`、`config.errorHandler`、`nextTick`、`watch` 的 `deep` 和 `immediate` 这四个盲点逐个讲透，讲用法，也讲它们背后是怎么实现的、什么时候会失效。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 用 `config.performance` 把每个组件的渲染耗时打到浏览器时间线上
- 为什么 `window.onerror` 抓不到 Vue 里的报错，`errorHandler` 又能覆盖到哪一层
- `nextTick` 到底在等什么，它的降级实现链和 `MutationObserver` 的关系
- `watch` 的 `deep` 和 `immediate` 怎么用，以及它们各自的代价
- 这四个 API 在 Vue 3 里对应的写法

## 一、用 performance 开启性能追踪

`performance` 是 Vue 全局配置里的一项，用来做组件级别的渲染耗时追踪。在入口文件里加上这段就开了：

```js
if (process.env.NODE_ENV !== 'production') {
    Vue.config.performance = true;
}
```

这个 API 是 2.2.0 新增的，只在开发模式并且浏览器支持 `performance.mark` 时生效。生产包里它是被直接编译掉的，所以不用担心线上开销，也别指望在生产环境靠它测数据。

开起来之后，浏览器时间线上就能看到每个组件在 init、compile、render、patch 各阶段花了多少毫秒。哪个组件的 `patch` 特别长，优化的靶子就有了。

原文这里推荐的是 Vue Performance Devtool 这个 Chrome 插件。它现在已经很久没更新了，我自己更习惯直接开 Chrome DevTools 的 Performance 面板录一段，Vue 打的这些标记会落在 Timings（有的版本叫 User Timing）轨道上，一目了然，也不用额外装东西。这条我只在 Chrome 上试过，Firefox 的面板叫法不太一样。

那 Vue 是怎么做到的？它用的就是浏览器原生的 `window.performance`，核心是两个方法：

- `performance.mark` 用于创建标记
- `performance.measure` 用于记录两个标记之间的时间间隔

```js
performance.mark('start'); // 创建 start 标记
performance.mark('end'); // 创建 end 标记

performance.measure('output', 'start', 'end'); // 计算两者时间间隔

performance.getEntriesByName('output'); // 获取标记，返回值是一个数组，包含了间隔时间数据
```

Vue 干的事情就是在每个组件的关键节点上按这个套路打点，标记名带上组件名，所以你在时间线上看到的是 `<UserList> render` 这种可读的条目，而不是一堆数字。

知道原理之后，这套打点你自己也能用。接口请求前后、一段复杂计算的首尾、一个大列表渲染完成的时刻，全都可以 mark 一下再 measure。比 `console.time` 强的地方在于，这些数据会进浏览器的性能时间线，能和网络、脚本执行、绘制放在同一张图上对齐着看。

除了上面这两个方法，原文还提到可以用 `performance.timing` 计算页面各个阶段的加载情况。这条现在要打个补丁：`performance.timing` 在规范里已经被标记为废弃，虽然浏览器还留着，但新代码建议改用 `performance.getEntriesByType('navigation')[0]` 拿到的 `PerformanceNavigationTiming` 对象，字段名基本能对上，而且时间基准更干净。

Vue 3 里这个开关搬到了应用实例上，写成 `app.config.performance = true`，语义和生效条件没变，还是只在开发模式起作用。

## 二、用 errorHandler 兜住框架吞掉的异常

浏览器里捕获异常，大家最熟的是 `try...catch` 和 `window.onerror`，这是原生 JavaScript 给的两条路。但在 Vue 2 项目里，你照着老经验挂一个 `window.onerror`，会发现组件里的报错一条都收不到。

原因是 Vue 自己在渲染和生命周期调用的外面包了一层 `try...catch`。它把错误接住了，走自己的错误处理流程，所以异常根本没冒泡到 window 上。想拿到这些信息，得用 `errorHandler`：

```js
Vue.config.errorHandler = function (err, vm, info) {
    let { 
        message, // 异常信息
        name, // 异常名称
        stack  // 异常堆栈信息
    } = err;

    // vm 为抛出异常的 Vue 实例
    // info 为 Vue 特定的错误信息，比如错误所在的生命周期钩子
}
```

三个参数里最有价值的其实是 `info`。它会告诉你错误发生在哪个钩子，比如 `mounted hook` 或者 `render`。做异常上报的时候把它一起带上，定位效率完全不一样。

`errorHandler` 的覆盖范围是随版本一点点扩的，这块很多人没注意到：2.2.0 起它开始捕获组件生命周期钩子里的错误，2.4.0 起支持捕获自定义事件处理函数内部的错误，2.6.0 起 `v-on` DOM 监听器里抛出的错误也会走到这里。所以你要是在一个 2.3 的老项目上验证「为什么自定义事件里的报错收不到」，别怀疑自己写错了，是版本不够。

```html
<template>
    <my-component @eventFn="doSomething"></my-component>
</template>

<script>
export default {
    methods: {
        doSomething() {
            console.log(a); // a is not defined
        }
    }
}
</script>
```

上面这段就是 2.4.0 之后才能被 `errorHandler` 接住的典型场景。

这里有个坑要注意：`errorHandler` 管不到异步回调。`setTimeout` 里抛的错、`Promise` 链上没接 `catch` 的 reject，都跑到了 Vue 的调用栈之外，它接不到。真要做全量的前端异常监控，`errorHandler` 只是其中一块，还得配上 `window.onerror` 和 `window.addEventListener('unhandledrejection')`，三者各管一片。

另一个我自己踩过的问题是，`errorHandler` 里如果自己又抛了错，会形成套娃。上报函数里做了个 `JSON.stringify` 循环引用的对象，直接把这个兜底逻辑本身炸了，然后就是满屏刷不完的报错。所以这个函数体内部最好整个包一层 `try...catch`，并且保留一句 `console.error(err)`，不然开发环境下所有错误都被你静悄悄吃掉了，调试体验会变得非常差。

组件级别的兜底还有 `errorCaptured` 这个钩子（2.5.0 新增），写在组件上，能拦住后代组件抛上来的错误，返回 `false` 可以阻止它继续往上冒。做局部降级 UI 的时候很好用，某个卡片崩了就渲染一个「加载失败」占位，不至于整页白屏。

Vue 3 里对应的是 `app.config.errorHandler(err, instance, info)` 和组合式 API 的 `onErrorCaptured`，思路一模一样，只是第二个参数从 `vm` 换成了组件实例，`info` 的字符串格式也做了调整。

## 三、nextTick 到底在等什么

先看一段一定会报错的代码：

```html
<template>
    <ul ref="box">
        <li v-for="(item, index) in arr" :key="index"></li>
    </ul>
</template>

<script>
export default {
    data() {
        return {
            arr: []
        }
    },
    mounted() {
    	this.getData();
    },
    methods: {
        getData() {
            this.arr = [1, 2, 3];
            this.$refs.box.getElementsByTagName('li')[0].innerHTML = 'hello';
        }
    }
}
</script>
```

赋值完立刻去取 `li`，取到的是 `undefined`，再往上读 `innerHTML` 就抛错。第一直觉的解释是「数据还没赋上」，但你打个断点会发现 `this.arr` 明明已经是 `[1, 2, 3]` 了。

真正的原因是 Vue 的 DOM 更新是异步的。数据变了之后，Vue 不会立刻去改 DOM，而是把这个 watcher 推进一个队列，去重，然后在当前同步代码跑完之后统一 flush。这么设计是为了合并同一轮里的多次修改，你连着改十个字段，DOM 只重排一次。响应式这套依赖收集和队列调度的完整链路，我在 [Vue响应式原理总结](https://feinterview.poetries.top/blog/vue-reative-summary) 里单独梳理过。

回到这块。既然更新排在队列后面，那我们把读 DOM 的操作也排到队列后面就行了，这就是 `nextTick`：

```js
this.$nextTick(() => {
    this.$refs.box.getElementsByTagName('li')[0].innerHTML = 'hello';
})
```

`$nextTick` 不传回调时会返回一个 Promise，所以也可以用 `async/await` 写平：

```js
methods: {
    async getData() {
        this.arr = [1, 2, 3];
        
        await this.$nextTick();
        
        this.$refs.box.getElementsByTagName('li')[0].innerHTML = 'hello';
    }
}
```

那 Vue 是靠什么实现这个「下一个 tick」的？源码里它并不是写死一种，而是按环境支持度做能力探测，依次降级：

- `Promise.then` 微任务
- `MutationObserver` 监听 DOM 变化触发回调
- `setImmediate`（只有 IE 和 Node 有）
- `setTimeout(fn, 0)` 宏任务兜底

前后两种大家都熟，都能把回调推到当前同步代码之后。中间那个 `MutationObserver` 是 HTML5 的特性，用一句话讲就是：创建一个观察者对象盯住某个 DOM 节点，它的 DOM 树一发生变化就执行你给的回调。Vue 用它的时候其实是取巧，创建一个游离的文本节点，改一下它的内容来触发回调，借的是这个回调跑在微任务队列里这一点。

```js
// 传入回调函数进行实例化
var observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        console.log(mutation.type);
    })
});

// 选择目标节点
var target = document.querySelector('#box');
 
// 配置观察选项
var config = { 
    attributes: true, // 是否观察属性的变动
    childList: true, // 是否观察子节点的变动（指新增，删除或者更改）
    characterData: true // 是否观察节点内容或节点文本的变动
};
 
// 传入目标节点和观察选项
observer.observe(target, config);
 
// 停止观察
observer.disconnect();
```

这段代码本身也很有用，跟 Vue 无关的场景里，比如你要监听第三方脚本往页面里插了什么节点，`MutationObserver` 是唯一靠谱的手段。记得用完调 `disconnect()`，不然节点被移除了观察者还挂着。

`nextTick` 有个边界很容易误解：它保证的只是 Vue 自己这一轮的 DOM 更新做完了，不保证别的。图片没加载完、`transition` 动画没跑完、子组件里还有一个 `setTimeout` 在等着渲染，这些它都管不着。我遇到过一次父组件在 `nextTick` 里取子组件 `$refs` 还是拿不到，排查了一下午，最后发现是子组件外面套了 `v-if` 且条件由一个异步接口决定，那压根就不是同一轮更新。这种情况老老实实用事件或者 `watch` 去等状态，别指望 `nextTick`。

Vue 3 里 `nextTick` 变成了可以从 `vue` 里按需导入的独立函数，`import { nextTick } from 'vue'`，选项式 API 下 `this.$nextTick` 也还在。调度器实现细节改了不少，但对使用者来说语义没变。

## 四、watch 的 deep 和 immediate

大部分人用 `watch` 只写一个 `handler` 函数就完事了，其实它还有两个配置项：

- `deep` 设为 `true` 用于监听对象内部值的变化
- `immediate` 设为 `true` 会立即以表达式的当前值触发一次回调

```html
<template>
    <button @click="obj.a = 2">修改</button>
</template>
<script>
export default {
    data() {
        return {
            obj: {
                a: 1,
            }
        }
    },
    watch: {
        obj: {
            handler: function(newVal, oldVal) {
                console.log(newVal); 
            },
            deep: true,
            immediate: true
        }
    }
}
</script>
```

不加 `deep: true` 的话，改 `obj.a` 是不会触发回调的，因为默认只监听 `obj` 这个引用本身有没有被换掉。加上 `immediate: true` 之后，组件初始化时会立刻拿当前的 `obj` 跑一遍 handler，省掉了在 `created` 里再手动调一次的重复代码。

`deep` 好用，但它不是免费的。它的实现是把整个对象递归遍历一遍，把每个嵌套属性的 getter 都触发一次以完成依赖收集。对象层级深、字段多的时候这个开销是实打实的，一个几百项的列表数据挂个 `deep` 监听，每次变更都要重新遍历。

能精确到具体字段就别偷懒用 `deep`。

Vue 支持字符串路径的写法，直接写 `'obj.a'` 当键名就能只监听那一个属性，比 `deep` 精确得多，也快得多。

`deep` 还有个坑：回调里的 `newVal` 和 `oldVal` 是同一个对象引用。因为改的是对象内部的属性，引用没变，Vue 也没做深拷贝，所以你想在回调里对比「改之前是什么」是拿不到的。真需要对比就自己在监听之前存一份快照，或者干脆把要比较的字段单独拎出来监听。

至于 `immediate`，它最常见的用途是「初始化和后续变更共用一套逻辑」，比如根据路由参数拉数据。不过这种场景下我一般会先问一句：是不是用 `computed` 更合适？只要这个 watch 的最终目的是根据别的数据算出一个新值赋给某个字段，那它就该是 `computed`。`watch` 该留给那些真正的副作用，发请求、操作 DOM、写缓存这类。

Vue 3 的 `watch` 在这两个选项之外还多了 `flush`，用来控制回调是在组件更新前还是更新后执行。默认是 `'pre'`（更新前），想在回调里读到最新的 DOM 就设成 `'post'`，这个比 Vue 2 里在 handler 内部再套一层 `$nextTick` 干净多了。组合式 API 下 `watch` 和 `watchEffect` 的区别、依赖收集的时机，我在 [Vue3之Composition API详解](https://feinterview.poetries.top/blog/vue3-composition-api) 里展开讲过，这里不重复。

## 总结

回到开头那两个问题。页面慢不知道慢在哪，开 `Vue.config.performance` 然后用 Chrome 的 Performance 面板看 Timings 轨道，组件级耗时直接可见；偶发白屏控制台没输出，是因为异常被框架接走了，挂上 `Vue.config.errorHandler` 才能拿到，并且要记得它管不到异步回调，得和 `window.onerror`、`unhandledrejection` 组合使用。

`nextTick` 的关键认知是 Vue 的 DOM 更新本来就是异步批处理的，它只是让你的代码排到这一轮更新之后，仅此而已，别指望它等图片、等动画、等另一个异步分支。`watch` 的 `deep` 是递归遍历换来的便利，能用字符串路径精确监听就别开它；`immediate` 好用，但先想想该不该是 `computed`。

这四个 API 在 Vue 3 里都还在，位置和签名有微调：`performance` 和 `errorHandler` 挂到了 `app.config` 上，`nextTick` 可以单独导入，`watch` 多了 `flush` 选项。原文写于 Vue 2 时代，Vue 2 官方维护已经停止，新项目直接按 Vue 3 文档来，老项目上面这些结论仍然成立。具体参数以你所用版本的官方文档为准。

## 参考

- [Vue 2 官方文档 - 全局配置](https://v2.cn.vuejs.org/v2/api/#全局配置)
- [Vue 3 官方文档 - 应用配置 app.config](https://cn.vuejs.org/api/application.html)
- [Vue 3 官方文档 - nextTick](https://cn.vuejs.org/api/general.html#nexttick)
- [Vue 3 官方文档 - watch](https://cn.vuejs.org/api/reactivity-core.html#watch)
- [MDN - MutationObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver)
- [MDN - Performance.mark](https://developer.mozilla.org/zh-CN/docs/Web/API/Performance/mark)
- [MDN - PerformanceNavigationTiming](https://developer.mozilla.org/zh-CN/docs/Web/API/PerformanceNavigationTiming)
- [前端进阶之旅](https://interview.poetries.top)
