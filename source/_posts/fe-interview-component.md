---
title: 前端面试之组件化，JSX与vdom和setState全流程拆解
date: 2018-10-21 00:20:32
description: 前端面试组件化专题，图解组件封装与复用的三要素、JSX 编译成 createElement 的全过程、JSX 与虚拟 DOM 的衔接、setState 异步批量的原因，以及 React 和 Vue 的取舍。
tags: 
   - 面试
   - 组件化
   - React
   - JSX
   - 虚拟DOM
categories: Front-End
---

组件化这个题在面试里出现的频率很高，但答得好的人不多。大部分人会背「组件就是把视图和逻辑封装起来复用」，再往下问一句「那 JSX 最后变成了什么」「setState 为什么是异步的」，就开始卡壳。这两个问题恰恰是组件化真正的落点，前面那句话谁都会说。

这篇按面试官追问的顺序来。先说组件封装了哪三样东西、复用靠什么传递，再把 JSX 从源码到 `createElement` 再到 vnode 这条链走一遍，接着讲 setState 为什么必须攒着批量执行，最后对比 React 和 Vue 在模板和组件化上的路线差别。图是配套的思维导图和代码截图，每张图前后我都补了要看什么。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 组件封装的三要素与复用的方式
- JSX 语法能写什么，浏览器为什么不认识它
- JSX 如何被编译成 `React.createElement` 调用
- `React.createElement` 和 snabbdom 的 `h` 函数是什么关系
- 自定义组件在 vdom 里是怎么被解析的
- `setState` 为什么是异步的，整个更新流程走了哪几步
- React 和 Vue 在模板、组件化上的路线差异

![组件化知识点思维导图总览](https://s.poetries.top/gitee/2019/10/56.png)

上面这张图是全篇的骨架，先扫一眼有个印象，四条主线分别是组件化理解、JSX、vdom、setState。看完全文回头再看一遍，能帮你把知识点串起来。

## 一、说一下对组件化的理解

### 1.1 组件的封装

组件封装的是三样东西：

- 视图
- 数据
- 变化逻辑

![组件封装视图、数据和变化逻辑](https://s.poetries.top/gitee/2019/10/57.png)

这张图里要注意的是三者的边界。视图是它长什么样，数据是它显示什么，变化逻辑是数据变了之后视图怎么跟着变。三样打包在一起对外只暴露一个标签，调用方不需要知道里面怎么实现的，这才叫封装。

很多人写了半天组件，其实只封了视图那一层，数据和变化逻辑还散在外面靠全局状态串着，那种组件换个页面就用不了。

### 1.2 组件的复用

复用靠两件事：

- `props` 传递
- 复用

![通过 props 向组件传递数据实现复用](https://s.poetries.top/gitee/2019/10/58.png)

这张图看的是数据流向，父组件把差异化的部分通过 `props` 塞进来，组件自己不写死任何具体内容。

![同一个组件传入不同 props 渲染出不同实例](https://s.poetries.top/gitee/2019/10/59.png)

同一份代码传不同的 props 就是不同的实例，这是复用能成立的原因。这里有个坑要注意，props 应该是只读的，组件内部直接改传进来的 props 会让数据流向变得不可预测，需要变化的部分应该提升到父组件或者转成组件自己的 state。

## 二、JSX 本质是什么

### 2.1 JSX 语法

JSX 能写这些东西：

- `html` 形式
- 引入 `JS` 变量和表达式
- 循环
- `style` 和 `className`
- 事件

这里就有个问题了。JSX 语法根本无法被浏览器所解析，那么它如何在浏览器运行？

![JSX 语法示例，包含变量、循环、事件和样式](https://s.poetries.top/gitee/2019/10/60.png)

对着这张图看，重点是 JSX 里那些花括号包起来的部分，它们不是模板字符串的占位符，而是真实的 JS 表达式，所以循环可以直接用 `map`，条件可以直接用三元。这也是 JSX 和 Vue 模板最大的不同，Vue 的 `v-for` `v-if` 是框架定义的指令，JSX 里那些就是原生 JS。

### 2.2 JSX 解析

- `JSX` 其实是语法糖
- 开发环境会将 `JSX` 编译成 `JS` 代码
- `JSX` 的写法大大降低了学习成本和编码工作量
- 同时，`JSX` 也会增加 `debug` 成本

![JSX 编译前后的代码对照](https://s.poetries.top/gitee/2019/10/61.png)

这张图是全篇最关键的一张，左边你写的 JSX，右边编译产物。每一个标签都变成了一次 `React.createElement(type, props, ...children)` 调用，嵌套的标签就是嵌套的函数调用。

![嵌套结构的 JSX 编译成嵌套的 createElement 调用](https://s.poetries.top/gitee/2019/10/62.png)

顺着上面看，嵌套关系在编译后是靠函数调用的参数位置表达的，子元素作为第三个及之后的参数传进去。所以 JSX 里写了多少层标签，编译后就是多少层函数嵌套。

![JSX 中的表达式和属性在编译后的对应位置](https://s.poetries.top/gitee/2019/10/63.png)

这张要看清楚属性去哪了：标签上的属性汇成第二个参数那个对象，`className` 对应 DOM 的 `class`，事件名保持驼峰。所谓「增加 debug 成本」说的就是这个，你在浏览器里看到的报错栈是编译后的调用，跟你写的 JSX 对不上，这也是 source map 在 React 项目里必须配好的原因。

### 2.3 JSX 独立的标准

- `JSX` 是 `React` 引入的，但不是 `React` 独有的
- `React` 已经将它作为一个独立标准开放，其他项目也可用
- `React.createElement` 是可以自定义修改的
- 说明：本身功能已经完备；和其他标准监控和扩展性没问题

「`createElement` 可以自定义修改」这条今天依然成立，Vue 3、Preact、Solid 都能用 JSX，编译目标换成各自的创建函数就行，babel 里配一个 pragma 的事。

这里补一个时效性的变化。React 17 之后引入了新的 JSX 转换（automatic runtime），编译产物不再是 `React.createElement`，而是从 `react/jsx-runtime` 里引入的 `jsx` 函数。带来的直接好处是写 JSX 的文件不用再手动引入 React 了。原理没变，还是「标签编译成函数调用」，只是被调用的那个函数换了名字和来源。上面这几张图对应的是老的 classic 转换，理解流程用它更直观。

## 三、JSX 和 vdom 的关系

### 3.1 为何需要 vdom

- `vdom` 是 `React` 初次推广开来的，结合 `JSX`
- `JSX` 就是模板，最终要渲染成 `html`
- 初次渲染 + 修改 `state` 后的 `re-render`
- 正好符合 `vdom` 的应用场景

关键在最后两条。如果页面渲染一次就不动了，vdom 完全是多余的开销，直接拼字符串塞进 `innerHTML` 更快。vdom 值钱的地方是 re-render，它能在两棵 JS 对象树之间比出差异，只把变化的部分落到真实 DOM 上，避免整块重建带来的重排和状态丢失。

### 3.2 React.createElement 和 h

![React.createElement 与 snabbdom 的 h 函数对照](https://s.poetries.top/gitee/2019/10/64.png)

这张图把两个函数放在一起对比，看签名就明白了，两者接收的参数结构几乎一样，返回的都是一个描述节点的普通 JS 对象。所以 `React.createElement` 干的事和 snabbdom 的 `h` 是一回事：把标签、属性、子节点打包成 vnode。

记牢这条链就够了：JSX → `createElement` → vnode → patch → 真实 DOM。

### 3.3 何时 patch

- 初次渲染 `ReactDOM.render(<App/>, container)`，会触发 `patch(container, vnode)`
- `re-render` 也就是 `setState`，会触发 `patch(vnode, newVnode)`

两次 patch 的参数不一样，这个区别要记住。初次渲染时没有旧的 vnode，第一个参数是真实的容器节点，做的是「挂载」；后续更新时两边都是 vnode，做的是「对比」。

### 3.4 自定义组件的解析

![vdom 中原生标签与自定义组件的区别](https://s.poetries.top/gitee/2019/10/65.png)

看这张图的时候，把标签分成两类：

- `'div'` 直接渲染 `<div>` 即可，`vdom` 可以做到
- `Input` 和 `List` 是自定义组件（`class`），`vdom` 默认不认识
- 因此 `Input` 和 `List` 定义的时候必须声明 `render` 函数
- 根据 `props` 初始化实例，然后执行实例的 `render` 函数
- `render` 函数返回的还是 `vnode` 对象

![自定义组件执行 render 后返回 vnode 继续展开](https://s.poetries.top/gitee/2019/10/66.png)

这张图讲的是展开过程。遇到自定义组件，vdom 会先造实例、跑 `render`，拿到返回的 vnode 再接着往下看，如果里面还有自定义组件就继续递归，直到整棵树上只剩原生标签为止。

容易记混的地方在这：`createElement('div', ...)` 的第一个参数是字符串，`createElement(List, ...)` 的第一个参数是那个类或者函数本身。React 就是靠首字母大小写来区分这两种情况的，这也是为什么自定义组件名必须大写开头，小写开头会被当成原生标签直接扔给 DOM。

## 四、说一下 React setState 的过程

### 4.1 setState 的异步

![setState 之后立刻读取 state 拿到的还是旧值](https://s.poetries.top/gitee/2019/10/67.png)

这张图演示的是那个经典现象：调完 `setState` 紧接着 `console.log(this.state.xxx)`，打印出来的还是改之前的值。很多人第一次遇到会以为 setState 没生效，其实是还没提交。

**setState 为何需要异步？**

- 可能会一次执行多次 `setState`
- 你无法规定、限制用户如何使用 `setState`
- 没必要每次 `setState` 都重新渲染，考虑性能
- 即便是每次重新渲染，用户也看不到中间的效果
- 只看到最后的结果即可

![多次 setState 被合并成一次更新](https://s.poetries.top/gitee/2019/10/68.png)

这张图的重点是「合并」两个字。一个事件处理函数里连着调三次 `setState`，React 把它们攒进队列，等这一轮事件处理结束再一起算出最终状态，只渲染一次。

这里有个坑我踩过：因为是合并的，连着写 `this.setState({ count: this.state.count + 1 })` 三次，结果只加了 1，因为三次读到的 `this.state.count` 都是同一个旧值。要基于上一次结果累加，得用函数形式 `this.setState(prev => ({ count: prev.count + 1 }))`，React 会把队列里的更新按顺序传入。

时效性补充一句。原文写作时，这套批量合并只在 React 自己的合成事件和生命周期里生效，写在 `setTimeout`、原生事件监听、Promise 回调里的 `setState` 会立刻同步执行、逐次渲染。React 18 引入自动批处理之后，这些场景也被纳入批量范围了。所以「setState 是同步还是异步」这个面试题，答案要看版本，稳妥的说法是：它从来不是真正的异步，只是被放进了队列延后提交，React 18 之后延后的覆盖面更广了。

### 4.2 vue 修改属性也是异步

效果、原因和 `setState` 一样。Vue 里改完 `data` 立刻读 DOM 拿到的是旧内容，要等 `nextTick`。两个框架都选了这条路，说明这不是某个实现的怪癖，是「数据驱动视图」这套模型下的必然选择。

### 4.3 setState 的过程

- 每个组件实例，都有 `renderComponent` 方法
- 执行 `renderComponent` 会重新执行实例的 `render`
- `render` 函数返回 `newVnode`，然后拿到 `preVnode`
- 执行 `patch(preVnode, newVnode)`

回到我们要解决的问题，这四步正好接上了第三节那条链。setState 触发的不是「更新 DOM」，是「重跑 render 拿新 vnode，再和旧的比」。真正的 DOM 操作只发生在 patch 比出差异之后。

这也是 React 性能优化的下手点，怎么让不该重跑 render 的组件不跑，我在 [React 性能优化总结](https://feinterview.poetries.top/blog/react-performance-optimization) 里展开讲过。

## 五、React vs vue

### 5.1 两者的本质区别

- vue 是 MVVM 框架，由 MVC 发展而来
- React 是前端组件化框架，由后端组件化发展而来
- 但这并不妨碍他们两者都能实现相同的功能

出身不同导致的是默认姿势不同，不是能力上限不同。MVVM 那条线的来龙去脉，可以看 [前端面试之 MVVM 浅析](https://feinterview.poetries.top/blog/fe-interview-mvvm)。

### 5.2 看模板和组件化的区别

- `vue` 使用模板（最初由 `angular` 提出）
- `React` 使用 `JSX`
- 模板语法上，我更加倾向于 `JSX`
- 模板分离上，我更加倾向于 `vue`

这两句看着矛盾，其实说的是两件事。语法上 JSX 就是 JS，不用另学一套指令；分离上 Vue 的单文件组件把模板、脚本、样式切得干干净净，看一眼就知道结构在哪。

**模板的区别**

模板应该和 JS 逻辑分离。

![Vue 单文件组件中模板与逻辑的分离方式](https://s.poetries.top/gitee/2019/10/69.png)

这张图看的是 Vue 的做法，template、script、style 三块并列，界限清楚。

![React 中 JSX 与逻辑写在一起](https://s.poetries.top/gitee/2019/10/70.png)

这张是 React 的做法，结构直接写在 `render` 里，和逻辑混在同一个函数中。

![模板与逻辑分离程度的对比](https://s.poetries.top/gitee/2019/10/71.png)

三张图连起来看，差别其实是「物理分离」和「逻辑内聚」的取舍。Vue 把三块在文件层面分开，读起来清爽；React 把结构和逻辑放在一起，重构时不用两头对照。我自己的感受是，组件小的时候 React 这种写法更顺手，组件一大 Vue 的分块优势就出来了。

### 5.3 组件化区别

- `React` 本身就是组件化，没有组件化就不是 `React`
- `vue` 也支持组件化，不过是在 `MVVM` 上的扩展
- 对于组件化，我更加倾向于 `React`，做的彻底而清晰

### 5.4 两者共同点

- 都支持组件化
- 都是数据驱动视图

这两条才是重点。面试问 React 和 Vue 的区别，如果只答语法差异会显得很浅，答到「都是数据驱动视图，都用 vdom 做更新，区别在于响应式的实现方式和模板的组织方式」才算说到点上。

再补一句现在的情况：Vue 3 也完整支持 JSX 和函数式的组合写法，React 这边有 Hooks 之后 class 组件基本退场，两边的写法比 2018 年那会儿更接近了。选型时纠结语法的意义在下降，更多要看团队熟悉度和生态。

## 总结

组件化封装的是视图、数据和变化逻辑三样，复用靠 `props` 把差异部分传进来，组件内部不写死具体内容，props 保持只读。

JSX 是语法糖，编译后每个标签变成一次 `createElement` 调用，返回的是描述节点的普通对象 vnode，跟 snabbdom 的 `h` 是一回事。React 17 之后编译目标换成了 `react/jsx-runtime` 里的 `jsx` 函数，原理不变。整条链是 JSX → createElement → vnode → patch → 真实 DOM。

自定义组件在 vdom 里要先造实例、跑 `render`，把返回的 vnode 继续展开，直到只剩原生标签。React 靠首字母大小写区分原生标签和自定义组件，组件名必须大写。

`setState` 被放进队列延后提交，是为了把一次交互里的多次更新合并成一次渲染。要基于旧值累加必须用函数形式。React 18 的自动批处理把 `setTimeout`、Promise 这些场景也纳入了批量范围。

React 和 Vue 的差别在出身和组织方式，共同点是数据驱动视图和 vdom 更新，这才是面试要答的核心。

## 参考

- [React 官方文档 - 在 JSX 中通过大括号使用 JavaScript](https://react.dev/learn/javascript-in-jsx-with-curly-braces)
- [React 官方文档 - createElement](https://react.dev/reference/react/createElement)
- [React 官方博客 - Introducing the New JSX Transform](https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)
- [React 官方文档 - Automatic batching for fewer renders in React 18](https://github.com/reactwg/react-18/discussions/21)
- [snabbdom](https://github.com/snabbdom/snabbdom)
- [Vue 官方文档 - 渲染函数 & JSX](https://cn.vuejs.org/guide/extras/render-function.html)
- [前端进阶之旅](https://interview.poetries.top)
