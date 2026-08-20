---
title: 虚拟DOM（一）从jQuery的痛点到snabbdom核心API
description: 用一个后台表格的真实需求，讲清虚拟DOM是什么、为什么需要它、节点结构长什么样，以及 snabbdom 的 h 与 patch 两个核心 API 怎么用。
date: 2018-10-20 22:12:12
tags: 
   - JavaScript
   - 虚拟DOM
   - snabbdom
categories: Front-End
---

一个后台的表格页，数据变一次就把整块 HTML 重新拼一遍，`$('#container').html(newHtml)` 一把梭。功能确实是对的，但用户会发现输入框焦点没了、滚动条弹回顶部、之前展开的那一行又收了回去。行数一多，点一下按钮还会有肉眼可见的卡顿。这篇从这个具体场景出发，先把手动操作 DOM 会踩到的坑摆出来，再说虚拟 DOM 拿什么来接这一块，最后把 snabbdom 的 `h` 和 `patch` 两个核心 API 过一遍。读完你至少能自己判断出，什么时候用得上虚拟 DOM，什么时候它其实是纯开销。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 虚拟 DOM 是什么，为什么要拿一个普通 JS 对象去描述真实 DOM
- 用 jQuery 手写同一个需求会遇到哪些问题，问题出在哪一步
- 虚拟 DOM 到底解决的是性能问题还是别的问题
- snabbdom 是什么，为什么拿它当入门读物
- `h()` 怎么造节点，`patch()` 怎么打补丁，两个 API 的四种调用形态
- 用虚拟 DOM 重做前面那个 demo，数据流变成了什么样
- diff 算法为什么必须存在，它在 patch 的哪一步被调用
- 2018 年之后这套东西又变成了什么样

## 一、先看一个具体的需求场景

空谈虚拟 DOM 没意思，先把需求摆出来。下面这个场景很典型，一份数据渲染成一张表格，点一下按钮数据换一批，表格跟着重新渲染。

![需求场景示意，一份数据渲染成表格并支持点击后整体更新](https://s.poetries.top/gitee/2019/10/587.png)

这张图里要留意的是「数据」和「视图」的关系。数据是一个数组，视图是一张表格，两者之间要保持同步。你写的每一行 DOM 操作，其实都是在手工维护这个同步关系。

**用jQuery实现**

先按最直觉的方式来，把数据拼成 HTML 字符串，整块塞进容器：

![用 jQuery 实现该需求的代码（一），拼接表格 HTML 字符串](https://s.poetries.top/gitee/2019/10/588.png)
![用 jQuery 实现该需求的代码（二），把拼好的 HTML 整块渲染进容器](https://s.poetries.top/gitee/2019/10/589.png)
![用 jQuery 实现该需求的代码（三），点击按钮修改数据后重新渲染](https://s.poetries.top/gitee/2019/10/590.png)

这三段代码合起来就是「拼字符串 + `html()` 覆盖」的完整套路。它的问题不在写法丑，而在于每次更新都是推倒重来。数据里明明只改了一个单元格，DOM 上却是整张表被删掉又重建了一遍。上面三张图里的 `render` 函数，你改一个字段调它，改十个字段也调它，代价完全一样。

**遇到的问题**

- DOM 操作是「昂贵」的，js 运行效率高
- 尽量减少 DOM 操作，而不是「推倒重来」
- 项目越复杂，影响就越严重
- vdom 即可解决这个问题

第一条要展开讲一下，不然容易变成一句口号。DOM 贵在哪？贵在它不是一个普通的 JS 对象。你给一个元素设了 `innerHTML`，浏览器要重新解析 HTML、重建这一段的 DOM 树、把样式规则重新匹配上去、重新算布局、再重新绘制。这一整条流水线跑一次的成本，比在内存里改几百个对象属性高得多。

第二条是关键。既然贵，那就少调用。少调用的前提是你得知道「这次到底哪里变了」，而拼字符串这个写法从根上就丢掉了这个信息，它只知道结果，不知道差异。

![虚拟 DOM 通过在 JS 层做对比来减少真实 DOM 操作](https://s.poetries.top/gitee/2019/10/591.png)

这张图给出的思路就是把「找差异」这件事挪到 JS 层来做。JS 层跑一万次对象比较也就是毫秒级，换来的是真实 DOM 上少做几百次操作，这笔账在页面结构复杂的时候非常划算。反过来，如果你的页面就三个节点，整块重渲反而更省事，diff 那点开销纯属白花。这个边界要记住，别把虚拟 DOM 当成万能加速器。

## 二、什么是 vdom

回到定义本身：

- 用 `JS` 模拟 `DOM` 结构
- `DOM` 变化的对比，放在 `JS` 层来做
- 提高重绘性能

![用 JS 对象模拟 DOM 结构的示意](https://s.poetries.top/gitee/2019/10/592.png)

图里那个对象结构值得盯一会儿。它其实就三类信息：标签名、属性、子节点。一个 `<div id="app"><p>hello</p></div>`，落成对象大概长这样：

```js
{
  tag: 'div',
  props: { id: 'app' },
  children: [
    { tag: 'p', props: {}, children: ['hello'] }
  ]
}
```

真实的 DOM 对象上挂了几百个属性和方法，`offsetTop`、`getBoundingClientRect`、几十个 `on*` 事件回调全在上面。你要在这样一个庞然大物上做「新旧对比」，光是决定比哪些字段就够头疼的。而上面这个对象只有三个字段，比起来轻松得多。

先说结论，虚拟 DOM 真正给你的不是速度，是**一个可以随便比较、随便存快照的数据结构**。速度是从这个能力里派生出来的。

## 三、vdom 如何应用，核心 API 是什么

自己从零写一个虚拟 DOM 当然可以，但先读一个成熟实现更划算。

**介绍 snabbdom**

![snabbdom 简介，一个体积极小的虚拟 DOM 库](https://s.poetries.top/gitee/2019/10/593.png)
![snabbdom 的模块化设计，核心之外的能力靠模块扩展](https://s.poetries.top/gitee/2019/10/594.png)

选 snabbdom 的理由很实在。它核心代码算上注释也就几百行，一晚上能读完；Vue 2.x 内部用的虚拟 DOM 就是改造过的 snabbdom，读懂它等于读懂了 Vue 2 渲染层的一半。第二张图说的模块化设计是它保持小巧的关键，核心只管「建节点、比差异、落 DOM」这条主线，属性、样式、事件这些全靠模块往里插。

**介绍 snabbdom - h 函数**

![snabbdom 的 h 函数用法，创建虚拟节点](https://s.poetries.top/gitee/2019/10/595.png)

`h` 这个名字来自 hyperscript，最早那个库是用 JavaScript 写超文本的。snabbdom 借了名字，但它做的事是创建 VNode，不是创建 HTML。这个函数你在 Vue 里见过，`new Vue({ render: h => h(App) })` 里那个 `h` 就是它。

这里有个坑要注意，`h` 的第二个参数是有歧义的。你传对象它当属性，传数组它当子节点，传字符串它当文本。所以 `h('div', ['hello'])` 和 `h('div', 'hello')` 都能跑，但走的是两条不同的分支。库内部靠判断参数类型来分流，这在 JavaScript 里叫模拟重载。

**介绍 snabbdom - patch 函数**

![snabbdom 的 patch 函数用法，把虚拟节点渲染或更新到真实 DOM](https://s.poetries.top/gitee/2019/10/596.png)

`patch` 是另一半。它接两个参数，第一个是「旧的」，第二个是「新的」，职责是把两者的差异落到真实 DOM 上，然后把新的那个返回出来，留给下一次调用当旧的。

第一次调用的时候没有旧 VNode，这时传的是真实 DOM 元素，库内部会先把它包成一个空的 VNode，后面就能统一按 VNode 处理了。这个小设计挺舒服的，省掉了一个「首次渲染」的特殊分支。

**重做jQuery的demo**

有了这两个 API，前面那个表格就可以换一种写法：

- 使用 `data `生成 `vnode`
- 第一次渲染，将 `vnode` 渲染到 `#container `中
- 并将 `vnode` 缓存下来
- 修改 `data` 之后，用新 `data` 生成 `newVnode`
- 将 `vnode` 和 `newVnode` 对比

![用虚拟 DOM 重做 jQuery demo 的数据流，data 生成 vnode 后再 patch](https://s.poetries.top/gitee/2019/10/597.png)

顺着这张图看，整个流程里你写的代码只剩两件事：把 data 变成 vnode，把新旧 vnode 交给 patch。「哪个单元格要改」这个问题你不用回答了，diff 会替你回答。

第三步那个「缓存下来」是新手最容易漏的一步。`patch` 的返回值必须被接住，因为下一次 patch 要拿它当旧节点。漏了这一步，第二次 patch 传进去的还是第一次那个 vnode，`elm` 引用会对不上，页面就更新不动了。

**核心 API**

- `h('<标签名>', {...属性...}, [...子元素...])`
- `h('<标签名>', {...属性...}, '....')`
- `patch(container, vnode)`
- `patch(vnode, newVnode)`

四行看着像两个函数，实际是四种调用形态。`h` 的两种区别在第三个参数是数组还是字符串，对应「有子节点」和「有文本」两种情况，这两者是互斥的，一个节点不可能既有子节点又有自己的文本。`patch` 的两种区别在第一个参数是真实 DOM 还是 VNode，对应首次渲染和后续更新。

## 四、介绍一下 diff 算法

### 4.1 vdom 为何使用 diff 算法

- DOM 操作是「昂贵」的，因此尽量减少 DOM 操作
- 找出本次 DOM 必须更新的节点来更新，其他的不更新
- 这个「找出」的过程，就需要 diff 算法

![diff 算法在虚拟 DOM 更新流程中的位置](https://s.poetries.top/gitee/2019/10/598.png)

那为什么不干脆把两棵树完整比一遍，求一个最精确的最小编辑距离呢？我一开始也是这么想的。问题在复杂度上，通用的树 diff 是 `O(n^3)`，一千个节点就是十亿次操作，页面还没渲染完人已经走了。

所以实际实现都做了一个妥协：只比较同一层级的节点，不做跨层匹配。理由是真实业务里几乎没人会把一个节点从第二层挪到第三层，放弃这部分识别能力，复杂度就降到了 `O(n)`。代价是万一你真这么干了，diff 会把它当成「旧位置删掉、新位置新建」来处理。

**patch(container, vnode)**

![patch(container, vnode) 首次渲染的执行流程（一）](https://s.poetries.top/gitee/2019/10/599.png)
![patch(container, vnode) 首次渲染的执行流程（二）](https://s.poetries.top/gitee/2019/10/600.png)

这两张图讲的是首次渲染这条路径。它没有 diff，因为压根没有旧节点可比。要做的就是递归地把 vnode 树翻译成真实 DOM 树，然后一次性挂到容器上。注意这个递归是深度优先的，子树全部建完才把自己 append 上去，所以整个构建过程只碰一次真实文档。

**演示过程**

下面四张图是逐步演示，建议对着自己写的 demo 打断点跟一遍，比读十遍源码管用。

![diff 演示过程第一步，新旧两棵虚拟树的初始状态](https://s.poetries.top/gitee/2019/10/601.png)
![diff 演示过程第二步，逐层对比同级节点](https://s.poetries.top/gitee/2019/10/602.png)
![diff 演示过程第三步，标记出发生变化的节点](https://s.poetries.top/gitee/2019/10/603.png)
![diff 演示过程第四步，把差异应用到真实 DOM 上](https://s.poetries.top/gitee/2019/10/604.png)

跟这四步的时候，重点看两件事。一是判定「这两个节点是不是同一个」的依据，只看标签名和 key，标签名一变整棵子树直接重建，一点都不心疼。二是变化被记录下来之后并没有立刻改 DOM，而是攒成一个补丁集合，最后统一应用。攒起来这一步很重要，它保证了一次数据更新只触发一轮真实 DOM 操作。

### 4.2 diff 实现过程

真正要读的就三个函数：

- `patch(container, vnode)` 和 `patch(vnode, newVnode)`
- `createElment`
- `updateChildren`

`patch` 是入口，负责判断走首次渲染还是走更新。`createElment` 负责把一个 VNode 变成真实 DOM，递归创建子节点。`updateChildren` 是最硬的一块，处理的是「新旧两个子节点数组怎么对上号」，双端比较、key 的作用全在这个函数里。

这三个函数的细节我放在下一篇讲，[虚拟DOM（二）](https://feinterview.poetries.top/blog/vdom-improve) 里会把 diff 的四种变化类型和 patch 的应用过程拆开写。如果你想直接看一份完整的源码级拆解，我在 [虚拟DOM原理分析 Snabbdom源码与diff算法拆解](https://feinterview.poetries.top/blog/virtual-dom-analysis) 里把 snabbdom 的 `h`、`init`、`patch`、`patchVnode`、`updateChildren` 全走了一遍，双端比较的四种命中情况在那篇里有图。

## 五、这篇写于 2018 年，后来变了什么

上面这套分析在原理层面到今天依然成立，但生态确实往前走了几步，有必要补几句。

React 从 16 开始引入了 Fiber 架构，把原来那种一口气递归完的 diff 改成了可中断的链表遍历。改动的动机不是让 diff 变快，是让它可以被打断，高优先级的更新（比如用户输入）能插队。所以「diff 是同步跑完的」这个前提在新版 React 上不再成立。这块我在 [React Fiber](https://feinterview.poetries.top/blog/react-fiber) 那篇里写过，感兴趣可以接着看。

Vue 3 的 diff 也做了改造。带 key 的列表在双端预处理之后，中间那段乱序部分改用最长递增子序列来求最少移动次数，比一轮轮双端比较更省 DOM 操作。另外它在编译期就给节点打了标记，静态节点运行时可以直接跳过，压根不参与 diff。

还有一派干脆认为不需要虚拟 DOM。Svelte 和 Solid 这类方案把工作量挪到编译期，编译时就知道哪个变量对应哪个 DOM 节点，运行时直接精确更新那一处，中间不需要造一棵树再比一遍。这个思路和上面「在 JS 层做对比」是两条路，各有各的适用面，不是说虚拟 DOM 不行了，而是它多出来的那层内存和计算，在某些场景下确实可以省掉。

我自己的感受是，这些新东西并不影响你先把虚拟 DOM 理解透。上面这几种优化，改的都是「怎么比更快」，没改「为什么要比」。

## 总结

这一篇能带走的东西：

- 手动操作 DOM 的问题不在写起来累，在于你丢掉了「这次到底哪里变了」这个信息，只能推倒重来
- 虚拟 DOM 就是用普通 JS 对象描述 DOM 结构，核心是标签名、属性、子节点三类信息
- 它换来的是一个可以随便比较、随便存快照的数据结构，性能是从这个能力里派生出来的
- 页面结构越复杂、单次变更越局部，虚拟 DOM 越划算；节点很少的时候它就是纯开销
- snabbdom 的核心 API 只有两个，`h()` 造节点，`patch()` 打补丁，各有两种调用形态
- `patch` 的返回值必须接住，它是下一次 patch 的旧节点
- diff 只做同层比较，把 `O(n^3)` 压到 `O(n)`，代价是放弃识别跨层移动
- 真正要读的三个函数是 `patch`、`createElment`、`updateChildren`

下一篇接着讲 diff 的四种变化类型和 patch 怎么落到真实 DOM 上。

## 参考

- [Snabbdom - GitHub](https://github.com/snabbdom/snabbdom)
- [Vue 3 官方文档 - 渲染机制](https://cn.vuejs.org/guide/extras/rendering-mechanism.html)
- [React 官方文档 - Reconciliation](https://legacy.reactjs.org/docs/reconciliation.html)
- [MDN - Document.createElement](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/createElement)
- [Svelte 官网](https://svelte.dev/)
- [前端进阶之旅](https://interview.poetries.top)
