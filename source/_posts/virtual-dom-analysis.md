---
title: 虚拟DOM原理分析 Snabbdom源码与diff算法拆解
description: 从一个普通 JS 对象讲起，拆开 Snabbdom 的 h、init、patch、patchVnode 与 updateChildren，把双端比较的四种命中情况和 key 的作用讲透，顺带说清 Vue 2 的虚拟 DOM 到底做了什么。
date: 2021-03-29 08:35:32
tags:
  - Vue
  - 虚拟DOM
  - Snabbdom
  - diff算法
categories: Front-End
---

面试被问「虚拟 DOM 为什么快」，很多人会条件反射地答「因为操作 JS 对象比操作 DOM 快」。这个答案经不起追问。真要比单次操作，直接改一次 `textContent` 显然比走一整套 diff 流程省事。虚拟 DOM 真正解决的不是快慢，是在「状态变了」和「DOM 该怎么改」这两件事之间插了一层，让你只描述结果，不用手写变更过程。这篇把 Vue 2 底层用的 Snabbdom 从头拆一遍，h 函数怎么造 VNode，patch 怎么打补丁，diff 的双端比较到底比了哪四种情况，key 在其中起什么作用。读完你对「`v-for` 为什么别拿 index 当 key」会有一个能自己推导出来的解释。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 虚拟 DOM 是什么，用一个 JS 对象描述 DOM 到底描述了哪几个字段
- 为什么要有虚拟 DOM，它解决的是性能问题还是别的问题
- Snabbdom 上手，从建项目到用模块处理属性、样式、事件
- h 函数的重载怎么实现，VNode 的六个字段各管什么
- init 为什么写成高阶函数，patch 的完整分支走向
- createElm 和 patchVnode 的执行顺序，钩子函数在哪几个点被触发
- updateChildren 的双端比较，四种命中情况加两种收尾情况
- 这套算法反过来对写业务代码有什么约束，比如 key 该怎么选

## 一、虚拟 DOM 到底是什么

虚拟 DOM 就是用普通的 JavaScript 对象来描述真实 DOM。因为它不是真的 DOM 对象，所以叫 Virtual DOM。

那为什么非得拿一个普通对象去描述？先看看真实的 DOM 对象身上挂了多少东西。随便捞一个元素，把它的属性名全打印出来：

```js
let element = document.querySelector('#app') 
let s = ''
for (var key in element) {
  s += key + ',' 
}
console.log(s)

// 打印结果 align,title,lang,translate,dir,hidden,accessKey,draggable,spellcheck,aut ocapitalize,contentEditable,isContentEditable,inputMode,offsetParent,off setTop,offsetLeft,offsetWidth,offsetHeight,style,innerText,outerText,onc opy,oncut,onpaste,onabort,onblur,oncancel,oncanplay,oncanplaythrough,onc hange,onclick,onclose,oncontextmenu,oncuechange,ondblclick,ondrag,ondrag end,ondragenter,ondragleave,ondragover,ondragstart,ondrop,ondurationchan ge,onemptied,onended,onerror,onfocus,oninput,oninvalid,onkeydown,onkeypr ess,onkeyup,onload,onloadeddata,onloadedmetadata,onloadstart,onmousedown ,onmouseenter,onmouseleave,onmousemove,onmouseout,onmouseover,onmouseup, onmousewheel,onpause,onplay,onplaying,onprogress,onratechange,onreset,on resize,onscroll,onseeked,onseeking,onselect,onstalled,onsubmit,onsuspend ,ontimeupdate,ontoggle,onvolumechange,onwaiting,onwheel,onauxclick,ongot pointercapture,onlostpointercapture,onpointerdown,onpointermove,onpointe rup,onpointercancel,onpointerover,onpointerout,onpointerenter,onpointerl eave,onselectstart,onselectionchange,onanimationend,onanimationiteration ,onanimationstart,ontransitionend,dataset,nonce,autofocus,tabIndex,click ,focus,blur,enterKeyHint,onformdata,onpointerrawupdate,attachInternals,n amespaceURI,prefix,localName,tagName,id,className,classList,slot,part,at tributes,shadowRoot,assignedSlot,innerHTML,outerHTML,scrollTop,scrollLef t,scrollWidth,scrollHeight,clientTop,clientLeft,clientWidth,clientHeight ,attributeStyleMap,onbeforecopy,onbeforecut,onbeforepaste,onsearch,eleme ntTiming,previousElementSibling,nextElementSibling,children,firstElement Child,lastElementChild,childElementCount,onfullscreenchange,onfullscreen error,onwebkitfullscreenchange,onwebkitfullscreenerror,setPointerCapture ,releasePointerCapture,hasPointerCapture,hasAttributes,getAttributeNames ,getAttribute,getAttributeNS,setAttribute,setAttributeNS,removeAttribute ,removeAttributeNS,hasAttribute,hasAttributeNS,toggleAttribute,getAttrib uteNode,getAttributeNodeNS,setAttributeNode,setAttributeNodeNS,removeAtt ributeNode,closest,matches,webkitMatchesSelector,attachShadow,getElement sByTagName,getElementsByTagNameNS,getElementsByClassName,insertAdjacentE lement,insertAdjacentText,insertAdjacentHTML,requestPointerLock,getClien tRects,getBoundingClientRect,scrollIntoView,scroll,scrollTo,scrollBy,scr ollIntoViewIfNeeded,animate,computedStyleMap,before,after,replaceWith,re move,prepend,append,querySelector,querySelectorAll,requestFullscreen,web kitRequestFullScreen,webkitRequestFullscreen,createShadowRoot,getDestina tionInsertionPoints,ELEMENT_NODE,ATTRIBUTE_NODE,TEXT_NODE,CDATA_SECTION_ NODE,ENTITY_REFERENCE_NODE,ENTITY_NODE,PROCESSING_INSTRUCTION_NODE,COMME NT_NODE,DOCUMENT_NODE,DOCUMENT_TYPE_NODE,DOCUMENT_FRAGMENT_NODE,NOTATION _NODE,DOCUMENT_POSITION_DISCONNECTED,DOCUMENT_POSITION_PRECEDING,DOCUMEN T_POSITION_FOLLOWING,DOCUMENT_POSITION_CONTAINS,DOCUMENT_POSITION_CONTAI NED_BY,DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC,nodeType,nodeName,baseU RI,isConnected,ownerDocument,parentNode,parentElement,childNodes,firstCh ild,lastChild,previousSibling,nextSibling,nodeValue,textContent,hasChild Nodes,getRootNode,normalize,cloneNode,isEqualNode,isSameNode,compareDocu mentPosition,contains,lookupPrefix,lookupNamespaceURI,isDefaultNamespace ,insertBefore,appendChild,replaceChild,removeChild,addEventListener,remo veEventListener,dispatchEvent
```

这一坨输出还只是 Chrome 里一个 `div` 的属性名列表，几百个。如果每次状态变化都要在这样一个庞然大物上做增删改查，还要考虑各家浏览器的行为差异，代码很快就会变成一团乱麻。

所以换个思路，我不描述「怎么改」，我描述「现在应该长什么样」。用一个对象就够了：

```js
{
  sel: "div",
  data: {},
  children: undefined,
  text: "Hello Virtual DOM",
  elm: undefined,
  key: undefined
}
```

六个字段，一个不多。`sel` 是选择器，`data` 装属性样式事件，`children` 和 `text` 互斥（一个节点要么有子节点要么有文本），`elm` 指向它对应的真实 DOM，`key` 用来做同一层节点的身份标识。一棵这样的对象树，就是一份 DOM 的快照。

## 二、为什么要有虚拟 DOM

先说结论，虚拟 DOM 解决的核心问题是**状态跟踪**，性能只是它顺带换来的东西。

顺着历史看一遍就清楚了。最早我们手动操作 DOM，麻烦不说，还得处理浏览器兼容，jQuery 把这层抹平了一部分，但项目一复杂，「哪个状态变了要改哪几个节点」这件事依然全靠人脑记，DOM 操作的复杂度随着页面复杂度一起涨。

再往后各种 MVVM 框架出现，把视图和状态的同步问题接管了。模板引擎也简化了视图的书写，但模板引擎有个致命短板，它不知道这次和上次相比哪里变了，只能整个重新渲染一遍。页面一大，整块重渲的代价就上来了，输入框失焦、滚动位置丢失这些副作用还得另外补。

虚拟 DOM 补的就是这一块。状态改变时不立即碰真实 DOM，先建一棵新的虚拟树描述「现在应该是什么样」，然后交给内部的 diff 去算出和上一棵树的差异，最后只把差异落到真实 DOM 上。它替你维护了上一次的状态，也替你算出了最小变更。

所以真正的收益不是「JS 对象比 DOM 快」，而是**你写的是声明式代码，跑的是增量更新**。开发体验和运行效率同时拿到了一部分，代价是多了一层 diff 的计算开销。页面结构越复杂、单次变更越局部，这笔买卖越划算；反过来如果每次都是整页数据全换，diff 就是纯开销。

还有一个常被忽略的好处。既然中间隔了一层描述，那这层描述往下渲染成什么就不一定是浏览器 DOM 了。同一棵虚拟树，可以：

- 维护视图和状态的关系，跟踪上一次状态
- 在复杂视图下把整块重渲降级成增量更新
- 渲染到服务端字符串做 SSR（Nuxt.js / Next.js）
- 渲染到原生控件（Weex / React Native）
- 渲染到小程序的自定义组件（mpvue / uni-app）

![虚拟 DOM 作为中间层，可以分别渲染到浏览器 DOM、服务端字符串、原生应用和小程序](https://blog.poetries.top/img/static/images/20210328112610.png)

跨端能跑通，靠的就是这层抽象。虚拟树本身不认识 `document`，认识 `document` 的是渲染器那部分。

### 有哪些现成的虚拟 DOM 库

真要挑一个来读源码，我推荐 Snabbdom：

- [Snabbdom](https://github.com/snabbdom/snabbdom)
  - Vue 2.x 内部使用的虚拟 DOM 就是改造过的 Snabbdom
  - 通过模块可扩展，核心极小
  - 源码用 TypeScript 写，类型定义本身就是文档
  - 公认最快的虚拟 DOM 实现之一
- [virtual-dom](https://github.com/Matt-Esch/virtual-dom)

选 Snabbdom 的理由很实在，核心代码算上注释也就几百行，一晚上能读完，而且读完就等于读懂了 Vue 2 渲染层的一半。响应式那一半我在 [Vue响应式原理模拟 手写一个迷你版Vue](https://feinterview.poetries.top/blog/vue-reative-summary) 里拆过，两篇合起来正好是 Vue 2 的完整链路：数据变化触发渲染 Watcher，渲染 Watcher 产出新的虚拟树，虚拟树交给 patch 落地。

## 三、Snabbdom 上手

### 建项目

读源码之前先跑起来。Snabbdom 用的是 ES Module 写法，需要一个打包器，原文用的是 parcel，零配置，最省事：

```bash
# 创建项目目录
mkdir snabbdom-demo
# 进入项目目录
cd snabbdom-demo
# 创建 package.json
yarn init -y
# 本地安装 parcel
yarn add parcel-bundler
```

配置 `package.json` 的 `scripts`，一条起开发服务，一条出生产包：

```json
"scripts": {
  "dev": "parcel index.html --open",
  "build": "parcel build index.html"
}
```

然后建一个最简单的目录结构，一个 `index.html` 挂个 `#app`，一个入口 js：

![snabbdom-demo 项目的目录结构，index.html 与 src 入口文件](https://blog.poetries.top/img/static/images/20210328123653.png)

装库：

```bash
yarn add snabbdom
```

导入的写法是这样：

```js
import { init, h, thunk } from 'snabbdom'
```

Snabbdom 的核心只提供最基本的功能，当年那个版本对外只导出三个东西：

- `init()` 是一个高阶函数，返回 `patch()`
- `h()` 返回虚拟节点 VNode，这个函数你在用 Vue 的时候见过
- `thunk()` 是一种优化策略，处理不可变数据时可以用它跳过不必要的重算

`h()` 眼熟吧，Vue 2 的入口就长这样：

```js
new Vue({
  router,
  store,
  render: h => h(App) 
}).$mount('#app')
```

这里有个坑要注意，导入时不能写 `import snabbdom from 'snabbdom'`。原因在源码末尾：它用的是具名 `export` 导出 API，没有 `export default`，所以默认导入拿到的是 `undefined`。

![snabbdom 源码末尾使用具名 export 导出 API，没有 export default](https://blog.poetries.top/img/static/images/20210328124133.png)

顺带说一句版本的事。上面这套导入路径是 Snabbdom 早期版本（Vue 2 内联的那一版）的形态，后来的版本对导出结构做过调整，模块也改成了从主入口具名导出。你要是照着最新版跑，导入路径以官方 README 为准，本文保留原始写法是为了和 Vue 2 里的实现对得上。

### 先跑几个例子找感觉

**例子1**

```js
import { h, init } from 'snabbdom'

// 1. hello world
// 参数：数组，模块
// 返回值：patch函数，作用对比两个vnode的差异更新到真实DOM
let patch = init([])
// 第一个参数：标签+选择器
// 第二个参数：如果是字符串的话就是标签中的内容
let vnode = h('div#container.cls', { 
  hook: {
    init (vnode) {
      console.log(vnode.elm)
    },
    create (emptyVnode, vnode) {
      console.log(vnode.elm)
    }
  }
}, 'Hello World')

let app = document.querySelector('#app')
// 第一个参数：可以是DOM元素，内部会把DOM元素转换成VNode
// 第二个参数：VNode
// 返回值：VNde
let oldVnode = patch(app, vnode)

// 假设的时刻
vnode = h('div', 'Hello Snabbdom')

patch(oldVnode, vnode)
```

有三个点值得停一下。第一次 `patch(app, vnode)` 传的第一个参数是真实 DOM 元素，Snabbdom 内部会先把它包成一个空的 VNode，这样后面就能统一按 VNode 处理。`patch` 的返回值是新的 VNode，它必须被接住，因为下一次 patch 要拿它当旧节点。还有 `hook` 里的 `init` 和 `create`，这是用户级钩子，创建 DOM 的过程中会被调用，打个 `console.log(vnode.elm)` 就能看到真实节点是什么时候挂上去的。

**例子2**

```js
// 2. div中放置子元素 h1,p
import { h, init } from 'snabbdom'

let patch = init([])

let vnode = h('div#container', [
  h('h1', 'Hello Snabbdom'),
  h('p', '这是一个p标签')
])

let app = document.querySelector('#app')

let oldVnode = patch(app, vnode)

setTimeout(() => {
  vnode = h('div#container', [
    h('h1', 'Hello World'),
    h('p', 'Hello P')
  ])
  patch(oldVnode, vnode)

  // 清空页面元素 -- 错误
  // patch(oldVnode, null)
  patch(oldVnode, h('!'))
}, 2000);
```

这个例子里藏着一个新手必踩的坑。想清空页面，第一直觉是 `patch(oldVnode, null)`，跑起来会报错。为什么不行？因为 patch 内部一路都在读 `vnode.sel`、`vnode.data`、`vnode.children`，传 `null` 进去直接就崩了。正确做法是 `patch(oldVnode, h('!'))`，`!` 这个选择器在 Snabbdom 里代表注释节点，用一个空注释把原来的内容顶掉，DOM 上留下一个 `<!---->` 占位。Vue 里 `v-if` 为假时留下的那个注释节点，用的就是同一套逻辑。

**例子3 debug-patchVnode**

下面这三个例子建议真的打断点跑一遍，比读十遍源码管用。这个是最简单的一条路径，新旧节点的 `sel` 都是 `div`、都没有 key，判定为同一节点，走进 `patchVnode`，只有 `text` 不同，于是直接改 `textContent`：

```js
import { h, init } from 'snabbdom'

let patch = init([])

// 首次渲染
let vnode = h('div', 'Hello World')
let app = document.querySelector('#app')
let oldVnode = patch(app, vnode)

// patchVnode 的执行过程
vnode = h('div', 'Hello Snabbdom')
patch(oldVnode, vnode)
```

**例子4 debug-updateChildren**

这个例子把「视频」和「微博」换了个位置，三个 `li` 都没写 key。你猜 Snabbdom 会怎么改？它不会去移动节点，因为没有 key 的情况下同位置的 `li` 全都判定为同一节点，最后结果是第二个和第三个 `li` 的文本各被改写了一次：

```js
import { h, init } from 'snabbdom'

let patch = init([])

// 首次渲染
let vnode = h('ul', [
  h('li', '首页'),
  h('li', '视频'),
  h('li', '微博')
])
let app = document.querySelector('#app')
let oldVnode = patch(app, vnode)

// updateChildren 的执行过程
vnode = h('ul', [
  h('li', '首页'),
  h('li', '微博'),
  h('li', '视频')
])
patch(oldVnode, vnode)
```

**例子5 debug-updateChildren-key**

同样的顺序调整，这次每个 `li` 带上了 key。行为完全变了，Snabbdom 认出 `b` 和 `c` 只是换了位置，走的是 `insertBefore` 移动真实节点，一次文本改写都没有：

```js
import { h, init } from 'snabbdom'

let patch = init([])

// 首次渲染
let vnode = h('ul', [
  h('li', { key: 'a' }, '首页'),
  h('li', { key: 'b' }, '视频'),
  h('li', { key: 'c' }, '微博')
])
let app = document.querySelector('#app')
let oldVnode = patch(app, vnode)

// updateChildren 的执行过程
vnode = h('ul', [
  h('li', { key: 'a' }, '首页'),
  h('li', { key: 'c' }, '微博'),
  h('li', { key: 'b' }, '视频')
])
patch(oldVnode, vnode)
```

### 模块，Snabbdom 保持小巧的关键

跑完上面五个例子你可能已经发现了，核心库压根不处理元素的属性、样式和事件。这不是遗漏，是刻意的设计。核心只负责「建节点、比差异、落 DOM」这条主线，其它一切通过模块往里插。

官方提供了 6 个模块，各管一类 DOM 特性：

| 模块 | 职责 | 要点 |
|------|------|------|
| `attributes` | 用 `setAttribute()` 设置属性 | 会处理布尔类型属性（如 `disabled`） |
| `props` | 用 `element[attr] = value` 设置属性 | 不处理布尔类型属性 |
| `class` | 切换类样式 | 注意它做的是「切换」，初始类名一般写在 `sel` 选择器里 |
| `dataset` | 设置 `data-*` 自定义属性 | 对应 `element.dataset` |
| `eventlisteners` | 注册和移除事件 | 通过 `on` 字段传入 |
| `style` | 设置行内样式，支持动画 | 额外提供 `delayed` / `remove` / `destroy` 三种时机 |

`attributes` 和 `props` 这对经常有人搞混。区别在于一个走 HTML 特性，一个走 DOM 属性。以 `input` 的值为例，`setAttribute('value', x)` 改的是初始值，`el.value = x` 改的是当前值，两者在用户输入过之后会不一致。Vue 模板里那些 `:value`、`:checked` 最终落到哪一边，判断依据也是同一套。

模块使用分三步：

1. 导入需要的模块
2. 在 `init()` 中注册模块
3. 用 `h()` 创建 VNode 时把第二个参数写成对象，模块需要的数据放在对应字段里，其它参数往后移

```js
import { init, h } from 'snabbdom'
// 1. 导入模块
import style from 'snabbdom/modules/style'
import eventlisteners from 'snabbdom/modules/eventlisteners'
// 2. 注册模块
let patch = init([
  style,
  eventlisteners
])
// 3. 使用 h() 函数的第二个参数传入模块需要的数据（对象）
let vnode = h('div', {
  style: {
    backgroundColor: 'red'
  },
  on: {
    click: eventHandler
  }
}, [
  h('h1', 'Hello Snabbdom'),
  h('p', '这是p标签')
])

function eventHandler () {
  console.log('点击我了')
}

let app = document.querySelector('#app')

let oldVnode = patch(app, vnode)


vnode = h('div', 'hello')
patch(oldVnode, vnode)
```

最后那两行值得留意。新的 vnode 只有文本没有 children，也没有 `style` 和 `on` 字段，patch 之后原来的 `h1`、`p` 会被整体移除，绑上去的 click 事件也会被 `eventlisteners` 模块在 `update` 钩子里清掉。模块不只负责「加」，也负责「减」，这是它必须挂在 patch 生命周期里而不是随便写个工具函数的原因。

需要说明的是，模块的导入路径在后续版本里改过，新版从主入口具名导出。上面这份写法对应的是 Vue 2 内联的那个时期，读源码时按你手上的版本对照 README 就行。

## 四、源码主线，从 h 到 patch

### 整条链路只有四步

- 用 `h()` 创建 JavaScript 对象（VNode）描述真实 DOM
- `init()` 注册模块，产出 `patch()`
- `patch()` 比较新旧两个 VNode
- 把变化的内容更新到真实 DOM 树上

源码地址在 https://github.com/snabbdom/snabbdom ，src 目录长这样：

![Snabbdom 源码 src 目录结构，包含 h.ts、vnode.ts、init 与 modules 目录](https://blog.poetries.top/img/static/images/20210328125857.png)

文件不多，核心就是 `h.ts`、`vnode.ts` 和 init 所在的那个文件，剩下的是各个模块和工具函数。下面按调用顺序一个个看。

### h 函数

`h()` 最早见于 hyperscript，那个库用 JavaScript 创建超文本。Snabbdom 借了这个名字，但做的事不是创建超文本，而是创建 VNode。

先聊聊它的重载。所谓重载就是参数个数或类型不同的同名函数，JavaScript 里没有这个概念，写两个同名函数后一个会覆盖前一个：

```js
function add (a, b) { 
  console.log(a + b)
}
function add (a, b, c) {
  console.log(a + b + c) 
}
add(1, 2)
add(1, 2, 3)
```

上面这段跑出来两次都是三个数的版本在生效，`add(1, 2)` 会打印 `NaN`。TypeScript 有重载的语法，但那只是给类型系统看的声明，运行时依然是一个函数体，靠手动判断参数来分流。

Snabbdom 的 `h()` 就是这么干的。源码位置 `src/h.ts`：

```js
// h函数的重载
export function h (sel: string): VNode
export function h (sel: string, data: VNodeData | null): VNode
export function h (sel: string, children: VNodeChildren): VNode
export function h (sel: string, data: VNodeData | null, children: VNodeChildren): VNode
export function h (sel: any, b?: any, c?: any): VNode {
  let data: VNodeData = {}
  let children: any
  let text: any
  let i: number
  // 处理参数，实现重载的机制
  if (c !== undefined) {
    // 处理三个参数的情况
    // sel、data、children/text
    if (b !== null) {
      data = b
    }
    if (is.array(c)) {
      children = c
      // 如果 c 是字符串或者数字
    } else if (is.primitive(c)) {
      text = c
    } else if (c && c.sel) {
      children = [c]
    }
  } else if (b !== undefined && b !== null) {
    // 处理两个参数的情况
    if (is.array(b)) {
      children = b
      // 如果 b 是字符串或者数字
    } else if (is.primitive(b)) {
      text = b
      // 如果 b 是 VNode
    } else if (b && b.sel) {
      children = [b]
    } else { data = b }
  }
  if (children !== undefined) {
    // 处理 children 中的原始值(string/number)
    for (i = 0; i < children.length; ++i) {
      // 如果 child 是 string/number，创建文本节点
      if (is.primitive(children[i])) children[i] = vnode(undefined, undefined, undefined, children[i], undefined)
    }
  }
  if (
    sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
    (sel.length === 3 || sel[3] === '.' || sel[3] === '#')
  ) {
    // 如果是 svg，添加命名空间
    addNS(data, children, sel)
  }
  // 返回 VNode
  return vnode(sel, data, children, text, undefined)
};

// 导出模块
export default h;
```

前面那四行 `export function h (...)` 全是 TypeScript 的重载签名，没有函数体，真正干活的是最后那个 `h (sel: any, b?: any, c?: any)`。函数体里做的事情很朴素，先看有没有第三个参数，有就说明是 `(sel, data, children/text)` 的形态；没有第三个参数就看第二个参数是数组、是原始值、还是 VNode、还是普通对象，分别落到 `children`、`text`、`children`、`data` 上。

中间那段 `is.primitive(children[i])` 的处理容易被跳过，但它挺关键。`h('ul', ['a', 'b'])` 这种写法里，数组元素是字符串而不是 VNode，这里会把它们包成只有 `text` 的文本 VNode。统一成 VNode 之后，后面的 diff 就不用再区分「这一项是节点还是字符串」了。

结尾那段 `sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g'` 是在识别 SVG 标签。SVG 元素必须用 `createElementNS` 带命名空间创建，用 `createElement` 造出来的 `<svg>` 是渲染不出图形的。所以 `h` 在这里给 data 打上 `ns` 标记，一路传到创建 DOM 的那步。逐个字符比较而不是用 `startsWith`，是为了省掉字符串方法的开销，这种写法在热路径上很常见。

### VNode

一个 VNode 就是一个虚拟节点，用来描述一个 DOM 元素。如果这个 VNode 有 `children`，那它连同子孙就构成了一棵虚拟 DOM 树。

源码位置 `src/vnode.ts`：

```js
export interface VNodeData {
  props?: Props
  attrs?: Attrs
  class?: Classes
  style?: VNodeStyle
  dataset?: Dataset
  on?: On
  hero?: Hero
  attachData?: AttachData
  hook?: Hooks
  key?: Key
  ns?: string // for SVGs
  fn?: () => VNode // for thunks
  args?: any[] // for thunks
  is?: string // for custom elements v1
  [key: string]: any // for any other 3rd party module
}

export interface VNode {
  // 选择器
  sel: string | undefined
  // 节点数据:属性/样式/事件等
  data: VNodeData | undefined
  // 子节点，和 text 只能互斥
  children: Array<VNode | string> | undefined
  // 记录 vnode 对应的真实 DOM
  elm: Node | undefined
  // 节点中的内容，和 children 只能互斥
  text: string | undefined
  // 优化用
  key: Key | undefined
}

export function vnode (sel: string | undefined,
  data: any | undefined,
  children: Array<VNode | string> | undefined,
  text: string | undefined,
  elm: Element | Text | undefined): VNode {
  const key = data === undefined ? undefined : data.key
  return { sel, data, children, text, elm, key }
}
```

`vnode()` 这个工厂函数本身没什么内容，值得看的是那六个字段的分工。`sel` 和 `key` 是身份证，diff 判断「这两个节点是不是同一个」只看这两项。`data` 是给模块用的数据袋，你在 `h()` 第二个参数里写的 `style`、`on`、`attrs` 全在这儿。`children` 和 `text` 互斥，一个节点不能既有子节点又有文本。`elm` 是虚拟世界和真实世界之间的那根绳子，patch 的时候要靠它找到该改哪个真实节点。

`VNodeData` 接口最后那行 `[key: string]: any` 是留给第三方模块的口子，你自己写个模块塞个新字段进去，类型检查也不会拦你。

### patch 的整体走向

`patch(oldVnode, newVnode)` 做的事就是打补丁：把新节点中变化的内容渲染到真实 DOM，最后返回新节点，作为下一次处理时的旧节点。

它的判断顺序是这样的：

- 先对比新旧 VNode 是不是同一个节点，判断依据只有两项，`key` 和 `sel` 相同
- 如果不是同一个节点，不做任何比较，直接照新节点建一棵新 DOM 插进去，再把旧的删掉
- 如果是同一个节点，看新 VNode 有没有 `text`，有并且和旧的不同，直接更新文本内容
- 如果新 VNode 有 `children`，就得判断子节点有没有变化，这个判断过程用的就是 diff 算法
- diff 只做同层级比较，不跨层

![patch 的判断流程图，先判断是否同一节点，再分别走重建与 patchVnode 两条路径](https://blog.poetries.top/img/static/images/20210329091820.png)

第二条要单独强调一下。很多人以为 diff 会努力复用，其实不会。只要 `sel` 或 `key` 有一个对不上，整棵子树直接丢弃重建，一点都不心疼。这是拿「可能多建几个节点」换「不用做跨层匹配」，因为跨层匹配的代价高得离谱，下面讲 `updateChildren` 的时候会算这笔账。

### init

`init(modules, domApi)` 返回的是 `patch()` 函数，这是个典型的高阶函数。

为什么非要绕这一层？因为 `patch()` 在外部会被调用很多次，每次调用都依赖 `modules`、`domApi`、`cbs` 这几个东西。用高阶函数在 `init()` 内部形成闭包，返回的 `patch()` 就能一直访问到这些变量，不用每次重新组装。你也可以理解成一次性的依赖注入，注入完之后拿到的是一个已经配置好的 patch。

`init()` 在返回 `patch()` 之前干了一件正事：把所有模块里的钩子函数按类型收集到 `cbs` 对象里。源码位置 `src/init.ts`：

```js
export function init (modules: Array<Partial<Module>>, domApi?: DOMAPI) {
  let i: number
  let j: number
  const cbs: ModuleHooks = {
    create: [],
    update: [],
    remove: [],
    destroy: [],
    pre: [],
    post: []
  }

  const api: DOMAPI = domApi !== undefined ? domApi : htmlDomApi

  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = []
    for (j = 0; j < modules.length; ++j) {
      const hook = modules[j][hooks[i]]
      if (hook !== undefined) {
        (cbs[hooks[i]] as any[]).push(hook)
      }
    }
  }
  ...

  return function patch (oldVnode: VNode | Element, vnode: VNode): VNode {
    let i: number, elm: Node, parent: Node
    const insertedVnodeQueue: VNodeQueue = []
    for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]()

    if (!isVnode(oldVnode)) {
      oldVnode = emptyNodeAt(oldVnode)
    }

    if (sameVnode(oldVnode, vnode)) {
      patchVnode(oldVnode, vnode, insertedVnodeQueue)
    } else {
      elm = oldVnode.elm!
      parent = api.parentNode(elm) as Node

      createElm(vnode, insertedVnodeQueue)

      if (parent !== null) {
        api.insertBefore(parent, vnode.elm!, api.nextSibling(elm))
        removeVnodes(parent, [oldVnode], 0, 0)
      }
    }

    for (i = 0; i < insertedVnodeQueue.length; ++i) {
      insertedVnodeQueue[i].data!.hook!.insert!(insertedVnodeQueue[i])
    }
    for (i = 0; i < cbs.post.length; ++i) cbs.post[i]()
    return vnode
  }
}
```

那个双重 for 循环就是在做钩子收集。外层遍历六种钩子类型（`create`、`update`、`remove`、`destroy`、`pre`、`post`），内层遍历你注册的每个模块，把模块上同名的钩子函数塞进 `cbs[类型]` 数组。收集完之后，patch 里要触发某类钩子只需要遍历一个扁平数组，不用每次再去各个模块上取。

`domApi` 这个参数也有意思。默认用的是 `htmlDomApi`，一套针对浏览器 DOM 的操作封装。但它是可替换的，你传一套面向别的宿主环境的实现进去，Snabbdom 就能把虚拟树渲染到别的地方去。前面说的跨端渲染，落到代码上就是这个口子。

### patch

`patch` 的职责很明确：传入新旧 VNode，对比差异，把差异渲染到 DOM，然后返回新的 VNode 作为下一次 `patch()` 的 `oldVnode`。

完整的执行过程是这样的：

- 首先执行模块中的 `pre` 钩子函数
- 判断 `oldVnode` 是不是一个 VNode。首次渲染时传进来的是真实 DOM 元素，这时用 `emptyNodeAt()` 把它包成一个空的 VNode，后面就能统一处理
- 如果 `oldVnode` 和 `vnode` 是同一节点（`key` 和 `sel` 都相同），调用 `patchVnode()` 找差异并更新 DOM
- 如果不是同一节点，走重建流程：先拿到旧节点对应的真实 DOM 和它的父节点，调用 `createElm()` 把新 vnode 转换成真实 DOM 并记到 `vnode.elm`，把新建的 DOM 插到旧节点后面，再移除旧节点
- 遍历 `insertedVnodeQueue`，执行用户设置的 `insert` 钩子函数
- 最后执行模块的 `post` 钩子函数

源码位置 `src/snabbdom.ts`：

```js
return function patch (oldVnode: VNode | Element, vnode: VNode): VNode {
  let i: number, elm: Node, parent: Node
  // 保存新插入节点的队列，为了触发钩子函数
  const insertedVnodeQueue: VNodeQueue = []
  // 执行模块的 pre 钩子函数
  for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]()

  // 如果 oldVnode 不是 VNode，创建 VNode 并设置 elm
  if (!isVnode(oldVnode)) {
    // 把 DOM 元素转换成空的 VNode
    oldVnode = emptyNodeAt(oldVnode)
  }
  // 如果新旧节点是相同节点(key 和 sel 相同)
  if (sameVnode(oldVnode, vnode)) {
    // 找节点的差异并更新 DOM
    patchVnode(oldVnode, vnode, insertedVnodeQueue)
  } else {
    // 如果新旧节点不同，vnode 创建对应的 DOM
    // 获取当前的 DOM 元素
    elm = oldVnode.elm!
    parent = api.parentNode(elm) as Node
    // 触发 init/create 钩子函数,创建 DOM
    createElm(vnode, insertedVnodeQueue)

    if (parent !== null) {
      // 如果父节点不为空，把 vnode 对应的 DOM 插入到文档中
      api.insertBefore(parent, vnode.elm!, api.nextSibling(elm))
      // 移除老节点
      removeVnodes(parent, [oldVnode], 0, 0)
    }
  }
  // 执行用户设置的 insert 钩子函数 
  for (i = 0; i < insertedVnodeQueue.length; ++i) {
    insertedVnodeQueue[i].data!.hook!.insert!(insertedVnodeQueue[i])
  }
  // 执行模块的 post 钩子函数
  for (i = 0; i < cbs.post.length; ++i) cbs.post[i]()
  // 返回 vnode
  return vnode
}
```

有个细节我第一次看的时候没绕明白：新建的 DOM 是用 `insertBefore(parent, vnode.elm, api.nextSibling(elm))` 插进去的，也就是插到旧节点的下一个兄弟之前，等价于插到旧节点后面。为什么不先删旧的再插新的？因为先删就丢了位置信息，`nextSibling` 会拿不到。先插后删，位置才准。

还有 `insertedVnodeQueue` 这个队列。用户设置的 `insert` 钩子不是在创建节点时立刻触发的，而是攒到最后统一执行。原因很实际，`insert` 钩子的语义是「节点已经进入文档了」，创建那一刻它还挂在游离的父节点上，读 `offsetHeight` 之类的布局信息全是 0。等整棵树都插完再触发，拿到的才是有效值。

### createElm

`createElm(vnode, insertedVnodeQueue)` 负责把一个 VNode 变成真实 DOM 元素并返回它。

执行过程按选择器分三条路：

- 首先触发用户设置的 `init` 钩子函数
- 如果选择器是 `!`，创建注释节点（前面例子 2 里用 `h('!')` 清空页面，就是走的这条）
- 如果选择器为空，创建文本节点
- 如果选择器不为空
  - 解析选择器，把 `#` 后面的部分设成 `id`，`.` 后面的部分设成 `class`
  - 执行模块的 `create` 钩子函数，属性、样式、事件在这一步被挂上去
  - 如果 vnode 有 `children`，递归创建每个子 vnode 的 DOM 并追加到当前元素上
  - 如果 vnode 的 `text` 是 string 或 number，创建文本节点追加进去
  - 执行用户设置的 `create` 钩子函数
  - 如果用户设置了 `insert` 钩子，把这个 vnode 推进队列，留到 patch 结束时统一触发

```js
function createElm (vnode: VNode, insertedVnodeQueue: VNodeQueue): Node {
  let i: any
  let data = vnode.data
  if (data !== undefined) {
    // 执行用户设置的 init 钩子函数
    const init = data.hook?.init
    if (isDef(init)) {
      init(vnode)
      data = vnode.data
    }
  }
  const children = vnode.children
  const sel = vnode.sel
  if (sel === '!') {
    // 如果选择器是!，创建评论节点
    if (isUndef(vnode.text)) {
      vnode.text = ''
    }
    vnode.elm = api.createComment(vnode.text!)
  } else if (sel !== undefined) {
    // Parse selector
    // 如果选择器不为空
    // 解析选择器
    // Parse selector
    const hashIdx = sel.indexOf('#')
    const dotIdx = sel.indexOf('.', hashIdx)
    const hash = hashIdx > 0 ? hashIdx : sel.length
    const dot = dotIdx > 0 ? dotIdx : sel.length
    const tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel
    const elm = vnode.elm = isDef(data) && isDef(i = data.ns)
      ? api.createElementNS(i, tag, data)
      : api.createElement(tag, data)
    if (hash < dot) elm.setAttribute('id', sel.slice(hash + 1, dot))
    if (dotIdx > 0) elm.setAttribute('class', sel.slice(dot + 1).replace(/\./g, ' '))
    // 执行模块的 create 钩子函数
    for (i = 0; i < cbs.create.length; ++i) cbs.create[i](emptyNode, vnode)
    // 如果 vnode 中有子节点，创建子 vnode 对应的 DOM 元素并追加到 DOM 树上
    if (is.array(children)) {
      for (i = 0; i < children.length; ++i) {
        const ch = children[i]
        if (ch != null) {
          api.appendChild(elm, createElm(ch as VNode, insertedVnodeQueue))
        }
      }
    } else if (is.primitive(vnode.text)) {
      // 如果 vnode 的 text 值是 string/number，创建文本节点并追加到 DOM 树
      api.appendChild(elm, api.createTextNode(vnode.text))
    }
    const hook = vnode.data!.hook
    if (isDef(hook)) {
      // 执行用户传入的钩子 create
      hook.create?.(emptyNode, vnode)
      if (hook.insert) {
        // 把 vnode 添加到队列中，为后续执行 insert 钩子做准备
        insertedVnodeQueue.push(vnode)
      }
    }
  } else {
    // 如果选择器为空，创建文本节点
    vnode.elm = api.createTextNode(vnode.text!)
  }
  // 返回新创建的 DOM
  return vnode.elm
}
```

解析选择器那几行是纯字符串切分，`h('div#container.cls')` 会被拆成标签 `div`、id `container`、class `cls`。注意 class 那一行做了 `replace(/\./g, ' ')`，所以 `div.a.b` 能正确变成两个类名。

`createElm` 是递归的，子节点的创建也走同一个函数，整棵子树建完才 return。所以首次渲染是一次深度优先的构建，模块的 `create` 钩子会在每个元素上各触发一次。

### patchVnode

`patchVnode(oldVnode, vnode, insertedVnodeQueue)` 处理的是「已确认是同一个节点」之后的事：对比两者差异，把差异渲染到 DOM。

执行过程：

- 首先执行用户设置的 `prepatch` 钩子函数
- 把 `oldVnode.elm` 直接赋给 `vnode.elm`，真实 DOM 引用就这么传递下去了，新 vnode 不用重新查找节点
- 如果新旧 vnode 是同一个对象引用，直接返回，什么都不用做
- 执行 `update` 钩子函数
  - 先执行模块的 `update` 钩子函数，属性、样式、事件的增量更新在这一步完成
  - 再执行用户设置的 `update` 钩子函数
- 如果 `vnode.text` 未定义
    - 如果 `oldVnode.children` 和 `vnode.children` 都有值
      - 调用 `updateChildren()`
      - 使用 `diff` 算法对比子节点，更新子节点
    - 如果 `vnode.children` 有值， `oldVnode.children` 无值
      - 清空 `DOM` 元素
      - 调用 `addVnodes()` ，批量添加子节点
    - 如果 `oldVnode.children` 有值， `vnode.children` 无值
      - 调用 `removeVnodes()` ，批量移除子节点
    - 如果 `oldVnode.text` 有值
      - 清空 `DOM` 元素的内容
  - 如果设置了 `vnode.text` 并且和 `oldVnode.text` 不相等
    - 如果老节点有子节点，全部移除
    - 设置 DOM 元素的 `textContent` 为 `vnode.text`
  - 最后执行用户设置的 `postpatch` 钩子函数

```js
function patchVnode (oldVnode: VNode, vnode: VNode, insertedVnodeQueue: VNodeQueue) {
  const hook = vnode.data?.hook
  // 首先执行用户设置的 prepatch 钩子函数
  hook?.prepatch?.(oldVnode, vnode)
  const elm = vnode.elm = oldVnode.elm!
  const oldCh = oldVnode.children as VNode[]
  const ch = vnode.children as VNode[]
  // 如果新老 vnode 相同返回
  if (oldVnode === vnode) return
  if (vnode.data !== undefined) {
    // 执行模块的 update 钩子函数
    for (let i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode)
    // 执行用户设置的 update 钩子函数
    vnode.data.hook?.update?.(oldVnode, vnode)
  }
  // 如果 vnode.text 未定义
  if (isUndef(vnode.text)) {
    // 如果新老节点都有 children
    if (isDef(oldCh) && isDef(ch)) {
      // 使用 diff 算法对比子节点，更新子节点
      if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue)
    } else if (isDef(ch)) {
      // 如果新节点有 children，老节点没有 children
      // 如果老节点有text，清空dom 元素的内容
      if (isDef(oldVnode.text)) api.setTextContent(elm, '')
      // 批量添加子节点
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue)
    } else if (isDef(oldCh)) {
      // 如果老节点有children，新节点没有children
      // 批量移除子节点
      removeVnodes(elm, oldCh, 0, oldCh.length - 1)
    } else if (isDef(oldVnode.text)) {
      // 如果老节点有 text，清空 DOM 元素
      api.setTextContent(elm, '')
    }
  } else if (oldVnode.text !== vnode.text) {
    // 走到这里说明设置了 vnode.text，并且和老的文本不一样
    if (isDef(oldCh)) {
      // 如果老节点有 children，移除
      removeVnodes(elm, oldCh, 0, oldCh.length - 1)
    }
    // 设置 DOM 元素的 textContent 为 vnode.text
    api.setTextContent(elm, vnode.text!)
  }
  // 最后执行用户设置的 postpatch 钩子函数
  hook?.postpatch?.(oldVnode, vnode)
}
```

## 五、updateChildren，diff 算法的核心

终于到最硬的一块了。`updateChildren` 干的事只有一句话：对比新旧节点的 `children`，把差异落到 DOM。但它是整个虚拟 DOM 里最值得琢磨的一段代码。

### 先算一笔账，为什么只比同层

要对比两棵树的差异，最直觉的做法是拿第一棵树的每个节点，依次和第二棵树的每个节点比一遍，再算出最小编辑距离。这个通用树 diff 的复杂度是 `O(n^3)`，一千个节点就是十亿次操作，页面还没渲染完人已经走了。

那怎么办？做一个假设。在真实的 DOM 操作里，我们极少会把一个父节点移动成某个子节点，跨层级的节点搬家几乎不发生。既然如此，跨层比较的那部分收益可以直接放弃。

于是只找同级别的子节点依次比较，然后再找下一级别的节点比较，复杂度降到 `O(n)`。

![diff 只做同层比较，同色框表示同一层级的节点在各自层内两两对应](https://blog.poetries.top/img/static/images/20210329092027.png)

代价是什么？如果你真的把一个节点从第二层挪到了第三层，diff 不会认出这是「移动」，它会在旧位置删掉、在新位置重建。这是用一个不常见场景的性能，换所有常见场景的性能，很划算的交易。

### 双端比较，四种命中情况

同级别节点比较的时候，Snabbdom 给新老两个数组的开始和结尾各设一个标记索引，一共四个，遍历过程中往中间收拢。

每一轮循环，先按顺序试这四种组合：

- `oldStartVnode / newStartVnode`（旧开始节点 / 新开始节点）
- `oldEndVnode / newEndVnode`（旧结束节点 / 新结束节点）
- `oldStartVnode / newEndVnode`（旧开始节点 / 新结束节点）
- `oldEndVnode / newStartVnode`（旧结束节点 / 新开始节点）

![双端比较的四种组合示意，新老数组各有开始与结束两个索引](https://blog.poetries.top/img/static/images/20210329092301.png)

为什么是这四种而不是全排列？因为它们覆盖了实际业务里最高频的几种变化：列表尾部追加、列表头部插入、整体反转、以及首尾互换。命中任何一种，这一轮就能只做一次 `patchVnode` 加最多一次 DOM 移动。

**第一种和第二种，头对头、尾对尾**

如果 `oldStartVnode` 和 `newStartVnode` 是 `sameVnode`（`key` 和 `sel` 相同）：

- 调用 `patchVnode()` 对比和更新这两个节点
- 把旧开始和新开始索引一起往后移动，`oldStartIdx++` / `newStartIdx++`

![旧开始节点与新开始节点匹配，patchVnode 之后两个开始索引同时右移](https://blog.poetries.top/img/static/images/20210329092430.png)

尾对尾同理，`oldEndIdx--` / `newEndIdx--`。这两种情况都不需要移动 DOM，因为节点的相对位置本来就没变。列表末尾加一条数据走的就是这条路径，前面 n 个全部头对头命中，最后剩一个新节点走收尾逻辑插进去。

**第三种，旧开始对新结束**

`oldStartVnode` 和 `newEndVnode` 相同，说明原来排在最前面的节点跑到最后去了：

- 调用 `patchVnode()` 对比和更新节点
- 把 `oldStartVnode` 对应的真实 DOM 元素移动到右边，具体是插到 `oldEndVnode` 对应 DOM 的下一个兄弟之前
- 更新索引，`oldStartIdx++` / `newEndIdx--`

![旧开始节点与新结束节点匹配，对应的真实 DOM 被移动到右侧](https://blog.poetries.top/img/static/images/20210329092820.png)

**第四种，旧结束对新开始**

`oldEndVnode` 和 `newStartVnode` 相同，说明原来在最后的节点跑到最前面了：

- 调用 `patchVnode()` 对比和更新节点
- 把 `oldEndVnode` 对应的真实 DOM 元素移动到左边，插到 `oldStartVnode` 对应 DOM 之前
- 更新索引，`oldEndIdx--` / `newStartIdx++`

![旧结束节点与新开始节点匹配，对应的真实 DOM 被移动到左侧](https://blog.poetries.top/img/static/images/20210329093025.png)

这两种交叉命中是双端比较最漂亮的地方。数组整体反转的场景，靠它们能在一轮轮循环里全部消化掉，一次都不用去查找。

### 四种都不命中怎么办

那就只能老老实实查找了：

- 遍历老节点数组，用 `newStartVnode` 的 `key` 去找有没有 key 相同的老节点
- 如果没找到，说明 `newStartVnode` 是全新的节点，创建对应的 DOM 元素插到 `oldStartVnode` 对应 DOM 之前，然后 `newStartIdx++`
- 如果找到了
  - 再判断新节点和找到的老节点的 `sel` 选择器是否相同
  - 如果不相同，说明这个位置的节点被换成了别的标签，重新创建 DOM 插进去
  - 如果相同，调用 `patchVnode()` 更新，然后把 `elmToMove` 对应的 DOM 元素移动到左边，并把老数组里那一项置为 `undefined`，防止后面重复处理

![四种情况都不命中时，用 key 建立索引表在老节点数组中查找并移动](https://blog.poetries.top/img/static/images/20210329093137.png)

这里就是 key 的价值所在。**没有 key 的时候这条查找路径根本走不通，diff 只能退化成按位置逐个比较**。回到前面例子 4 和例子 5 的差别：不带 key，「视频」和「微博」换位置变成了两次文本改写；带了 key，变成一次节点移动。前者看着好像也没慢多少，但如果 `li` 里面是个带内部状态的组件，或者是个用户正在输入的 `input`，按位置复用就会把状态串到错误的行上去。

这也是「别拿数组 index 当 key」的完整理由。index 是位置，不是身份。往列表头部插一条数据，所有元素的 index 全变了，key 跟着变，diff 判定为「每一项都不是同一个节点」，等于全部重建，还不如不写 key。真要写就写数据本身的稳定 id。

### 循环怎么结束

循环的终止条件是 `oldStartIdx > oldEndIdx` 或者 `newStartIdx > newEndIdx`，也就是任何一个数组先被遍历完。跳出循环之后还得收尾。

如果老节点数组先遍历完（`oldStartIdx > oldEndIdx`），说明新节点有剩余，把 `newStartIdx` 到 `newEndIdx` 之间剩下的节点批量创建并插入：

![老节点先遍历完，新数组剩余的节点被批量插入到右侧](https://blog.poetries.top/img/static/images/20210329093302.png)

如果新节点数组先遍历完（`newStartIdx > newEndIdx`），说明老节点有剩余，把 `oldStartIdx` 到 `oldEndIdx` 之间剩下的节点批量删除：

![新节点先遍历完，老数组剩余的节点被批量删除](https://blog.poetries.top/img/static/images/20210329093414.png)

批量删除那一步要留意，中间可能有被置为 `undefined` 的空位（前面查找命中时留下的），`removeVnodes` 里会跳过它们。

## 六、这套算法反过来约束了什么

读源码不是为了背流程，是为了知道自己写的代码会触发哪条路径。几条我认为最实用的：

**key 必须稳定且唯一，别用 index，别用随机数。** 用 `Math.random()` 当 key 是我见过最离谱的写法，每次渲染 key 都变，等于每次都全量重建，比不写 key 还糟。

**同一个位置尽量别换标签名。** `sel` 变了就是整棵子树重建，子组件会重新走一遍完整的创建流程。条件渲染里 `v-if` / `v-else` 两个分支如果结构相近，Vue 默认会尝试复用，你不想复用才需要手动加不同的 key。

**列表操作优先用「在两端增删」的形态。** 双端比较对首尾变化最友好，中间大规模乱序会退化成查找加移动。这不是说中间不能改，是说如果有选择的话，数据结构上尽量让变化集中在两端。

**长列表该虚拟滚动还是得虚拟滚动。** diff 是 `O(n)`，n 是节点数。一万条数据的列表，哪怕只改一条，diff 也要走一万次比较。这时候该做的是减少 n，而不是指望 diff 变快。

还有一点得说清楚，Vue 3 的 diff 和这套已经不完全一样了。Vue 3 编译期会给模板打上 patchFlag，标记出哪些节点是动态的、动态在哪个属性上，运行时可以直接跳过静态节点。带 key 的列表也换成了「先做双端预处理，中间部分求最长递增子序列」的算法，移动次数更少。原理层面双端比较依然是理解的基础，但真读 Vue 3 源码时别拿这篇的结论直接套。

## 总结

把这一圈拆下来，能直接带走的结论有这些：

- 虚拟 DOM 是用普通 JS 对象描述真实 DOM，核心字段就六个，`sel` 和 `key` 是身份，`data` 装模块数据，`children` 和 `text` 互斥，`elm` 连接虚拟与真实
- 它解决的是状态跟踪问题，性能是顺带的收益。真正划算的场景是「结构复杂 + 单次变更局部」
- 中间隔了一层描述，所以同一棵虚拟树能渲染到浏览器、服务端、原生控件和小程序
- Snabbdom 核心只做建节点、比差异、落 DOM，属性样式事件全靠六个模块插进来，`init` 用高阶函数把模块和 domApi 闭包进 `patch`
- `patch` 的第一个判断是「是不是同一节点」，只看 `key` 和 `sel`，不同就整棵子树重建，绝不尝试复用
- `patchVnode` 处理同一节点内部的差异，`updateChildren` 处理子节点列表的差异
- diff 只做同层比较，把 `O(n^3)` 压到 `O(n)`，代价是放弃识别跨层移动
- 双端比较先试四种组合（头头、尾尾、旧头新尾、旧尾新头），都不中才用 key 去老数组里查找
- key 的全部意义就在最后那条查找路径上。用 index 当 key 等于没有身份信息，diff 退化成按位置复用

我的建议是把例子 4 和例子 5 都打上断点跑一遍，看着 `oldStartIdx` 和 `newStartIdx` 一步步往中间收，比看十张图都直观。这块跟 Vue 2 的响应式是配套的，数据怎么变成一次重新渲染，我在 [Vue响应式原理模拟 手写一个迷你版Vue](https://feinterview.poetries.top/blog/vue-reative-summary) 和 [Vue响应式原理从defineProperty到Proxy](https://feinterview.poetries.top/blog/vue-reative) 这两篇里拆过，串起来看链路就完整了。

## 参考

- [Snabbdom - GitHub](https://github.com/snabbdom/snabbdom)
- [virtual-dom - GitHub](https://github.com/Matt-Esch/virtual-dom)
- [Vue 3 官方文档 - 渲染机制](https://cn.vuejs.org/guide/extras/rendering-mechanism.html)
- [Vue 2 官方文档 - key](https://cn.vuejs.org/v2/api/#key)
- [MDN - Node.insertBefore](https://developer.mozilla.org/zh-CN/docs/Web/API/Node/insertBefore)
- [MDN - Document.createElementNS](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/createElementNS)
- [vuejs/core - GitHub](https://github.com/vuejs/core)
- [前端进阶之旅](https://interview.poetries.top)
