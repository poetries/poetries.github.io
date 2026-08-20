---
title: 初识Vue与环境搭建 数据驱动与脚手架入门（一）
description: Vue 入门第一篇，讲清 MVVM 里 Model 与 View 的双向绑定关系、数据驱动与组件化两个核心思想、Object.defineProperty 的作用，以及用 vue-cli 搭起第一个项目的完整步骤。
date: 2018-08-26 13:12:32
tags:
  - Vue
  - MVVM
  - 环境搭建
categories: Front-End
---

刚上手 Vue 那阵子，我最不适应的一点是不知道手该往哪放。写惯了 jQuery，脑子里第一反应永远是「先拿到这个节点，再改它的 class」，而 Vue 反复在教你另一句话，「改数据，别碰节点」。这两句听着差不多，实际是两套完全不同的干活方式。这篇是 Vue 系列的第一篇，把入门阶段真正需要先想明白的几件事捋一遍，包括 MVVM 到底替你省掉了什么、数据驱动为什么能甩掉 DOM 操作、双向绑定底下靠什么支撑，最后用 vue-cli 把工程跑起来。读完你手上会有一个能运行的项目，脑子里也会有后面十几篇的地图。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- MVVM 里 Model、View、ViewModel 各自管什么，Vue 又砍掉了哪一层
- 数据驱动和组件化这两个核心思想，落到代码上分别长什么样
- 用 `Object.defineProperty` 手写一个最小可用的双向绑定，看懂 Vue 2 响应式的起点
- 模板语法、class 与 style 绑定、条件渲染、事件、组件的整体地图
- 用 vue-cli 搭起第一个工程，`webpack-simple` 和 `webpack` 两套模板差在哪
- 这套 2018 年的写法，在 Vue 3 里对应成什么

## 一、Vue 是个什么样的框架

先说结论，Vue 是一个 MVVM 风格的框架，Model 和 View 之间是双向联动的，它没有控制器这一层。

这里得先修一处很多人会念错的地方。MVVM 的三个字母是 Model、View、ViewModel，Model 是数据模型，不是模块（Module）。原文那句「Module 和 view 是双向绑定的」应该是 Model 和 View，这个我按官方说法改过来了。

那 ViewModel 在哪？它就是你 `new` 出来的那个 Vue 实例。往下它盯着 Model 里的数据，数据一变就去更新视图；往上它给 View 挂好事件，用户输入了就把值写回 Model。两个方向的胶水代码都被框架吞掉了，你写业务时能看见的只剩 Model 和 View。

传统 MVC 里的 Controller 干的是什么？大部分时候就是「监听视图事件 → 取值 → 校验 → 写回模型 → 再手动刷新视图」这一串搬运工作。ViewModel 把这串搬运自动化之后，Controller 这层就没什么可写的了，于是被拿掉了。所以 MVVM 的特征不是多了一层，而是少了一层。

顺着上面聊，Vue 官方对自己的定位有个说法我一直觉得挺准，Vue 核心库本身只关注视图层，它是渐进式的。你可以只引一个 script 标签给某个老页面加点交互，也可以把路由、状态管理、构建工具全套配齐做单页应用。所以「Vue 本身不是一个框架，Vue 加上周边生态才构成一个灵活的、渐进式的框架」这句话是站得住的。这一点在选型时很有用，不是所有项目都得一上来就上全家桶。

MVVM 本身的原理如果你想再挖深一层，我在 [实现数据的双向绑定mvvm-剖析Vue的原理](https://feinterview.poetries.top/blog/vue-mvvm) 里手写过一遍。

## 二、两个核心思想

### 2.1 数据驱动

数据驱动的意思是，页面长什么样由数据决定，你只需要维护数据。

举个具体的对比。要把一个列表里的第三项标红，jQuery 的写法是 `$('.item').eq(2).addClass('red')`，你操作的是节点。Vue 的写法是把数组里第三个对象的 `isRed` 改成 `true`，模板里那句 class 绑定会自己生效，你操作的是数据。

区别在哪？在于状态的唯一来源。jQuery 那套写法里，「第三项是红的」这个事实只存在于 DOM 上，你想知道当前哪几项是红的，只能反过来去查 DOM。项目一大，同一块 DOM 被五六处代码改过，谁改的、改成什么样，全靠翻代码。数据驱动把这个事实收回到 JS 对象里，DOM 变成纯粹的投影。

我自己的感受是，这一层转变比学十个指令都重要。上手前两周写出来的 Vue 代码里如果还大量出现 `document.getElementById`，那多半是姿势没换过来。

### 2.2 组件化

任意复杂的界面都能被切成一棵组件树。头部是一个组件，侧边栏是一个组件，列表里的每一行又是一个组件。切开之后好处是复用、独立调试、多人并行开发，以及出问题时能快速定位到某一小块。

组件切开就要通信。Vue 里的基本约定是消息单向流动，父组件通过 `props` 把数据传给子组件，子组件不允许直接改父组件的变量，要往上传数据就调 `$emit('父组件里监听的事件名', payload)` 抛一个事件出去。父组件的变量变了之后，会自动流向子组件。

这条规矩看着有点绕，为什么不让子组件直接改？因为一旦允许，一个数据就有了多个修改入口，出了 bug 你不知道是哪个组件动的。单向流保证了「谁拥有数据，谁负责修改」。组件之间还有插槽（Slot）这条通道，传的不是数据而是结构，这个后面第九篇会细讲。

## 三、双向绑定底下是什么

`Object.defineProperty` 在 Vue 2 的双向绑定里是绝对的主角。

它能做的事是给一个对象的某个属性装上 getter 和 setter，之后任何一次读写都会先经过你的函数。读的时候记下「谁在依赖我」，写的时候通知这些依赖去更新，响应式就是这么来的。

下面这段是原文给的最小演示，一个输入框，一个用来回显的 span，中间靠一个普通对象连起来：

```html
<input type="text" id="userName">
<span id="uName"></span>
```

```javascript
// 简单封装一下选择器，避免和 jQuery 的 $ 混淆
var $ = function (selector) {
  return document.querySelector(selector)
}

var obj = {}
var _userName = ''

Object.defineProperty(obj, 'userName', {
  get: function () {
    return _userName
  },
  set: function (val) {
    _userName = val
    $('#uName').innerHTML = val
    $('#userName').value = val
  }
})

$('#userName').addEventListener('keyup', function (event) {
  obj.userName = event.target.value
})
```

原文这段有几处笔误得说明一下。`object.defineProerty` 写错了两个地方，对象名首字母要大写，方法名是 `defineProperty` 不是 `defineProerty`；`get` 是空的，没有返回值，读 `obj.userName` 永远拿到 `undefined`；另外原文混用了 jQuery 的 `$(...).on()` 和原生的 `.innerHTML`，jQuery 对象上没有 `innerHTML` 和 `value` 这两个属性，这么写跑不通。上面统一改成了原生 API，逻辑和原意没变。

这段代码在解决什么？它把「输入框内容变化」和「span 内容变化」这两件事，都挂到了 `obj.userName` 这一个属性上。View 到 Model 的方向靠 `keyup` 事件，Model 到 View 的方向靠 setter，两条腿凑齐就是双向绑定。Vue 做的事情本质上就是把这套流程自动化，帮你递归遍历 `data` 里的每个属性，加上依赖收集和批量更新的调度。

这里有个坑要注意。`Object.defineProperty` 只能拦截已经存在的属性，你给 `data` 里的对象后加一个新字段，或者用下标直接改数组元素，Vue 2 都监听不到，得走 `Vue.set` 或者 `this.$set`。这个限制是 Vue 2 响应式一个绕不开的短板，Vue 3 换成 `Proxy` 之后才彻底解决，因为 `Proxy` 拦的是整个对象的操作而不是单个属性。这一块的完整推导我写在 [Object.defineProperty详解与Vue2响应式原理](https://feinterview.poetries.top/blog/Object.defineProperty) 里。

## 四、模板语法的整体地图

这一节是提纲式的，每个点后面都有单独一篇展开，先建立索引就行。

### 4.1 插值与常用指令

- 文本插值，用双大括号包住变量名，最常用
- `v-html` 按 HTML 解析并写进 `innerHTML`
- `v-text` 直接替换元素的 `textContent`
- `v-bind:id` 绑定属性，可以缩写成 `:id`
- 模板里能写单个表达式，比如三元 `ok ? 'yes' : 'no'`
- `v-if` 这类条件指令
- 过滤器，写法是 `message | capitalize`，属性上则是 `:id="rawId | formatId"`

原文过滤器那行写的是 `rawld|formatld`，是把大写字母 I 认成了小写 l 的 OCR 式笔误，正确拼写是 `rawId` 和 `formatId`。

`v-html` 这里要多说一句，它会把字符串当 HTML 执行，用户输入的内容绝对不能直接丢进去，否则就是现成的 XSS 入口。

### 4.2 class 与 style 绑定

对象语法写成 `:class="{ active: isActive, 'text-danger': hasError }"`，键是类名，值是布尔。带连字符的类名要加引号。

数组语法则是把一组变量列出来：

```html
<div v-bind:class="[activeClass, errorClass]"></div>

<script>
    new Vue({
        data: {
            activeClass: "active",
            errorClass: 'text-danger'
        }
    })
</script>
```

style 的对象语法是 `:style="{ color: activeColor, fontSize: fontSize + 'px' }"`，注意 CSS 属性名要写成驼峰。第三篇会把这块的全部写法排一遍。

### 4.3 条件渲染

`v-if` 为假时元素根本不会被创建，`v-else` 和 `v-else-if` 跟它配套。`v-show` 是另一套逻辑，元素始终在 DOM 里，只是切 `display` 的值。频繁切换用 `v-show`，条件基本不变用 `v-if`。

原文把 `v-cloak` 也列在条件渲染里，严格说它不算条件渲染。它的作用是配合 `[v-cloak] { display: none }` 这条 CSS，在 Vue 编译完成前把还没渲染的模板藏起来，避免用户在网速慢的时候看到一闪而过的原始插值语法。

### 4.4 事件处理

绑定写 `v-on:click="method"`，缩写是 `@click="method"`。

修饰符是 Vue 事件系统里最省事的设计，`.stop` 阻止冒泡，`.prevent` 阻止默认行为，`.self` 只在事件源是元素自身时触发，`.once` 只触发一次。按键修饰符有 `.enter`、`.tab`、`.delete`（同时捕获删除键和退格键）、`.space`、`.left`、`.right` 等等。

原文按键那行把 `left` 拼成了 `letf`，这里改过来了。

### 4.5 组件

全局组件用 `Vue.component` 注册，任何地方都能用；局部组件写在某个组件的 `components` 选项里，只在当前作用域可见。日常业务基本都用局部注册，全局注册留给基础组件，注册多了会让打包体积白涨。

父子通信、插槽这两块前面提过，这里不重复。

## 五、环境搭建

原文给的是 vue-cli 2 的用法：

```shell
npm install -g vue-cli

vue init webpack-simple demo

# 初始化完整的webpack项目
vue init webpack demo2
```

两个模板的差别值得说清楚。`webpack-simple` 顾名思义是精简版，只有一份 webpack 配置，跑起来快，适合写 demo 和验证想法。`webpack` 是完整版，带 dev 和 prod 两套配置、ESLint、单元测试、e2e 测试的脚手架，适合真项目起步。

生成之后配置文件主要看两个地方，构建相关的公共配置和路径、端口、代理这类项目级配置。原文写的是 `webpack.base.js` 和 `config/index.js`，在 vue-cli 2 的 webpack 模板里，前者的真实路径是 `build/webpack.base.conf.js`，后者是 `config/index.js`，其余文件多是围绕这两个转的辅助脚本。

要改开发端口和后端代理，动的就是 `config/index.js` 里的 `dev.port` 和 `dev.proxyTable`。这两个是新项目最先会碰到的配置项。

## 六、这套写法在 Vue 3 里的对应

这篇写于 2018 年，讲的是 Vue 2。Vue 2 官方已经停止维护，新项目请直接从 Vue 3 起步。老项目的写法和思路依然成立，所以上面的内容原样保留，这里单独列一下差异。

响应式底层从 `Object.defineProperty` 换成了 `Proxy`，新增属性和数组下标赋值都能被侦测到，`Vue.set` 也就没有存在必要了。

应用创建方式变了，`new Vue({ el: '#app' })` 换成 `createApp(App).mount('#app')`，全局 API 也从挂在 `Vue` 构造函数上改成挂在返回的 app 实例上。

写组件的主流方式变成了组合式 API 加 `<script setup>`，`data`、`methods`、`computed` 这些选项被 `ref`、`reactive`、`computed` 这些函数替代。选项式 API 在 Vue 3 里依然完整支持，不存在必须改写的强制要求。

过滤器在 Vue 3 里被移除了，官方建议改用计算属性或者普通方法调用。上面 4.1 提到的管道写法在 Vue 3 项目里会直接报错。

脚手架也换了。`vue-cli` 这个包名对应的是 2.x 时代，后来是 `@vue/cli`，现在官方推荐的是基于 Vite 的 `create-vue`，命令是 `npm create vue@latest`。具体选项以官方文档为准，版本更新比较快。

## 总结

回到开头那句「改数据，别碰节点」。这篇绕了一圈，讲的其实都是它的支撑，MVVM 砍掉 Controller 是为了它，`Object.defineProperty` 装 getter 和 setter 是为了它，组件化配合单向数据流也是为了它。

几个可以直接带走的点：

- MVVM 的 M 是 Model 不是 Module，ViewModel 就是那个 Vue 实例，它替你写掉了两个方向的同步代码
- Vue 2 的响应式只能拦截已存在的属性，新增字段要用 `Vue.set`，Vue 3 换 `Proxy` 后这个限制消失
- `v-if` 是销毁重建，`v-show` 是切 `display`，切换频繁选后者
- `v-html` 不接受任何未经处理的用户输入
- vue-cli 2 的 `webpack-simple` 适合 demo，`webpack` 模板适合真项目；今天新起项目直接用 `create-vue`

下一篇 [vue中的数据绑定（二）](https://feinterview.poetries.top/blog/vue-data-bind) 会把这篇里一笔带过的各种绑定语法逐个写全，包括插值、属性、类名、样式、条件、事件、按键和 `v-model` 的三个修饰符。

## 参考

- [Vue 3 官方文档 - 简介](https://cn.vuejs.org/guide/introduction.html)
- [Vue 3 官方文档 - 快速上手](https://cn.vuejs.org/guide/quick-start.html)
- [Vue 2 官方文档（已停止维护）](https://v2.cn.vuejs.org/)
- [Vue 3 迁移指南](https://v3-migration.vuejs.org/)
- [MDN - Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
- [Vue CLI 官方文档](https://cli.vuejs.org/zh/)
- [create-vue - GitHub](https://github.com/vuejs/create-vue)
- [前端进阶之旅](https://interview.poetries.top)
