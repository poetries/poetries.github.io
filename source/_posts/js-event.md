---
title: JavaScript事件机制冒泡捕获与事件委托
description: 讲清事件流的捕获、目标、冒泡三个阶段，addEventListener 第三个参数的两种形态，preventDefault 与 stopPropagation 的真实区别，以及事件委托的原理和动态列表里的踩坑点。
date: 2018-12-21 22:40:21
tags:
  - JavaScript
  - 事件机制
  - 事件委托
categories: Front-End
---

写一个带删除按钮的表格，每行的删除按钮绑了 `click`，整行也绑了「点击查看详情」。测试反馈点删除的时候详情弹窗也跟着弹出来了。这时候第一反应是加个 `stopPropagation`，加完确实好了，但过两天又发现另一个问题，页面上「点击空白处关闭下拉菜单」的全局监听在这一行上失效了。

这类问题的根子都在事件流上。你不知道事件是怎么传的，就只能靠试，试出来的方案往往会在别的地方冒出新问题。这篇把捕获、目标、冒泡三个阶段讲清楚，再把 `preventDefault` 和 `stopPropagation` 这两个经常被混用的方法分开。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 事件流的三个阶段，以及事件为什么要先往下走再往上走
- 用一段最小示例验证冒泡顺序
- 事件对象上真正常用的那几个属性
- `preventDefault`、`stopPropagation`、`stopImmediatePropagation` 的差别
- `addEventListener` 第三个参数的两种形态
- 事件委托的原理和它省下的到底是什么
- 动态列表里做事件委托最容易踩的两个坑

## 一、事件流的三个阶段

事件流是一个事件沿着特定数据结构传播的过程。冒泡和捕获是事件流在 DOM 中两种不同的传播方法。

事件流有三个阶段：

- 事件捕获阶段
- 处于目标阶段
- 事件冒泡阶段

事件捕获（event capturing）通俗的理解就是，当鼠标点击或者触发 DOM 事件时，浏览器会从根节点开始由外到内进行事件传播。也就是说点击了子元素，如果父元素通过事件捕获方式注册了对应的事件的话，会先触发父元素绑定的事件。

事件冒泡（dubbed bubbling）与事件捕获恰恰相反，事件冒泡顺序是由内到外进行事件传播，直到根节点。

无论是事件捕获还是事件冒泡，它们都有一个共同的行为，就是事件传播。

![事件流示意图，事件从根节点向下捕获到目标元素，再从目标元素向上冒泡回根节点](https://s.poetries.top/gitee/2019/10/319.png)

为什么要设计成先往下再往上这么绕的一圈？这是历史遗留。当年 Netscape 只做捕获，IE 只做冒泡，W3C 制定标准的时候两边都不能得罪，就把两套都保留了下来，规定先捕获再冒泡。所以今天一次点击实际上要走完一整趟往返。

这一圈的实际价值在于，外层元素有两次机会介入。捕获阶段是在目标响应之前，适合做拦截（比如一个全局遮罩要抢在任何按钮之前吞掉点击）；冒泡阶段是在目标响应之后，适合做汇总（比如事件委托）。绝大多数业务代码用的是冒泡这一段。

## 二、捕获和冒泡怎么验证

```html
<div id="div1">
  <div id="div2"></div>
</div>

<script>
    let div1 = document.getElementById('div1');
    let div2 = document.getElementById('div2');
    
    div1.onclick = function(){
        alert('1')
    }
    
    div2.onclick = function(){
        alert('2');
    }

</script>
```

当点击 `div2` 时，会弹出两个弹出框。在 ie8/9/10、chrome 浏览器，会先弹出 2 再弹出 1，这就是事件冒泡，事件从最底层的节点向上冒泡传播。事件捕获则跟事件冒泡相反。

原文这段代码写的是 `div1.onClick`，那是跑不起来的，DOM0 级的事件属性名必须全小写，写成 `onClick` 只是给元素挂了一个普通属性，浏览器根本不认。这个坑很隐蔽，因为 React 里的 `onClick` 是驼峰的，从 JSX 切回原生 DOM 的时候特别容易顺手写错。上面的代码我已经改成了 `onclick`。

W3C 的标准是先捕获再冒泡，`addEventListener` 的第三个参数决定把事件注册在捕获（`true`）还是冒泡（`false`）。

想直观看一遍完整流程，可以在两层元素上各绑一次捕获一次冒泡，打印 `event.eventPhase`。这个值是 1 表示捕获阶段，2 表示处于目标阶段，3 表示冒泡阶段。有一点很多人可能没注意到，目标元素自身注册的监听不管你传 `true` 还是 `false`，都在目标阶段触发，`eventPhase` 都是 2，执行顺序按注册先后来。

## 三、事件对象

![事件对象常用属性一览](https://s.poetries.top/gitee/2019/10/320.png)

图里列的属性不少，日常真正高频的就那么几个，单独说一下。

`target` 是真正触发事件的那个最深层元素，`currentTarget` 是当前正在执行的监听所绑定的元素。在事件委托里这两个几乎永远不相等，`target` 是你点的那个 `li`，`currentTarget` 是绑了监听的那个 `ul`。回调函数里的 `this` 等于 `currentTarget`（箭头函数除外）。

`type` 是事件类型字符串，多个事件共用一个处理函数时靠它分流。`clientX`/`clientY` 是相对视口的坐标，`pageX`/`pageY` 是相对整个文档的坐标，页面滚动过之后这两组值就不一样了，做拖拽和定位弹层时选错会导致偏移。

`isTrusted` 用来区分事件是用户真实操作触发的还是脚本 `dispatchEvent` 派发的，做防刷校验时会用到。

## 四、事件流阻止

在一些情况下需要阻止事件流的传播，阻止默认动作的发生。

- `event.preventDefault()` 取消事件对象的默认动作
- `event.stopPropagation()` / `event.cancelBubble = true` 阻止事件继续传播

原文这里把 `preventDefault` 写成了「取消默认动作以及继续传播」，这是错的，得纠正一下。`preventDefault` 只管默认行为，事件该往上冒还是照冒。这两件事完全正交，想同时做到就得两个都调。

### 4.1 preventDefault 与 stopPropagation 的区别

`preventDefault` 告诉浏览器不用执行与事件相关联的默认动作，比如表单提交、链接跳转、右键弹出菜单、复选框勾选。它不影响传播。

`stopPropagation` 是停止事件继续传播。注意它挡的不只是冒泡，捕获阶段调用它，事件就到不了目标元素了。

事件的阻止在不同浏览器有不同处理。在 IE 下使用 `event.returnValue = false`，在非 IE 下则使用 `event.preventDefault()` 进行阻止。原文说 `stopPropagation` 对 IE9 以下的浏览器无效，准确说是 IE8 及更早版本不支持这个方法，得用 `event.cancelBubble = true` 代替。这套兼容代码今天基本可以删掉了，但 `cancelBubble` 这个属性名被 DOM 规范当作遗留特性保留了下来，你在老代码里还会见到。

### 4.2 还有一个 stopImmediatePropagation

同一个元素上可以注册多个同类型的监听。`stopPropagation` 只能拦住事件往其他元素传，同元素上后注册的那些监听照样会执行。要连它们一起拦掉，得用 `stopImmediatePropagation`。

```js
node.addEventListener('click',(event) =>{
	event.stopImmediatePropagation()
	console.log('冒泡')
},false);
// 点击 node 只会执行上面的函数，该函数不会执行
node.addEventListener('click',(event) => {
	console.log('捕获 ')
},true)
```

回到开头那个表格的例子。删除按钮上加 `stopPropagation` 之所以会连累全局的「点击空白关闭下拉」，就是因为它把事件在半路截断了，挂在 `document` 上的监听根本收不到。更稳的做法是不截断传播，而是在行点击的处理函数里判断 `event.target.closest('.delete-btn')`，命中就直接 return。

我的经验是，`stopPropagation` 属于那种「用一次爽，用多了整个页面的事件行为没人说得清」的 API。能用条件判断解决的，尽量别截断事件流。

## 五、事件注册

通常我们使用 `addEventListener` 注册事件。该函数的第三个参数可以是布尔值，也可以是对象。对于布尔值 `useCapture` 参数来说，该参数默认值为 `false`，它决定了注册的事件是捕获事件还是冒泡事件。

传对象的形式支持更多配置，这几个都很实用：

| 配置项 | 作用 |
|--------|------|
| `capture` | 等价于原来的布尔参数，是否在捕获阶段触发 |
| `once` | 只触发一次，触发后自动移除监听 |
| `passive` | 承诺回调里不会调 `preventDefault`，浏览器就不必等 JS 执行完再滚动 |
| `signal` | 传入 `AbortSignal`，调 `abort()` 即可批量移除监听 |

`passive: true` 在移动端滚动性能上效果很直接。因为浏览器无法预知你会不会在 `touchmove` 里调 `preventDefault`，默认必须先跑完 JS 才敢滚动，一旦回调慢就是明显的卡顿。加上这个承诺之后滚动和 JS 可以并行。现在的 Chrome 对 `document` 和 `window` 上的 `touchstart`/`touchmove`/`wheel` 已经默认按 passive 处理了。

`signal` 是我用下来最省心的一个。以前组件卸载要一个个 `removeEventListener`，而且必须保存函数引用才能移除，漏一个就是泄漏。现在建一个 `AbortController`，所有监听都带上同一个 `signal`，卸载时调一次 `abort()` 全部干净。

一般来说我们只希望事件只触发在目标上，这时候可以使用 `stopPropagation` 来阻止事件的进一步传播。

顺带提一句，剪贴板的 `copy`、`paste` 这类事件同样遵守这套传播规则，所以也能做委托。具体用法在 [JavaScript复制粘贴与剪贴板操作详解](https://feinterview.poetries.top/blog/js-copy) 里有例子。

## 六、事件委托

在 JS 中性能优化的其中一个主要思想是减少 DOM 操作。

假设有 100 个 `li`，每个 `li` 有相同的点击事件。如果为每个 `li` 都添加事件，则会造成 DOM 访问次数过多，引起浏览器重绘与重排的次数过多，性能则会降低。使用事件委托则可以解决这样的问题。

### 6.1 原理

实现事件委托是利用了事件的冒泡原理。当我们为最外层的节点添加点击事件，那么里面的 `ul`、`li`、`a` 的点击事件都会冒泡到最外层节点上，委托它代为执行事件。

```html
<ul id="ul">
    <li>1</li>
    <li>2</li>
    <li>3</li>
</ul>
```

```js
window.onload = function(){
    var ulEle = document.getElementById('ul');
    ulEle.onclick = function(ev){
        //兼容IE
        ev = ev || window.event;
        var target = ev.target || ev.srcElement;
        
        if(target.nodeName.toLowerCase() == 'li'){
            alert( target.innerHTML);
        }
        
    }
}
```

原文这段里拿到的变量叫 `ulEle`，下一行却写成了 `ul.onclick`。它能跑起来是因为浏览器会把带 id 的元素自动挂到 `window` 上，`ul` 这个全局变量恰好也指向同一个元素。这属于误打误撞，换个 id 名或者开了严格模式就出问题，上面的代码我改成了 `ulEle.onclick`。

`ev.srcElement` 是 IE 的私有属性，`window.event` 也是 IE 的全局事件对象，这两处兼容代码今天可以删了。

### 6.2 委托真正省下的是什么

很多人以为事件委托省的是「注册监听的开销」。注册一百个监听器确实有成本，但现代浏览器扛这点量毫无压力，这不是重点。

真正的收益有两块。一是内存，每个监听器都持有一个函数引用和它的闭包，一千行的表格就是一千份；二是动态节点，列表通过接口刷新之后，原来那些 `li` 全被换掉了，绑在它们身上的监听跟着消失，你得在每次渲染后重新绑一遍。委托在父节点上就不存在这个问题，新插进来的元素天生就被覆盖到。

顺着上面聊，那些「绑了但元素已经被移除」的监听如果处理不当，是内存泄漏的常见来源，可以看 [JS内存泄漏与垃圾回收机制完全梳理](https://feinterview.poetries.top/blog/js-memory-leak) 里那一节。

### 6.3 两个必踩的坑

第一个坑是 `target` 命中判断太天真。上面的示例用 `target.nodeName === 'li'` 判断，但如果 `li` 里面还嵌了 `<span>` 或者图标，用户点在图标上时 `target` 就是那个 `span`，判断直接失败。正确的写法是往上找最近的匹配祖先：

```js
ulEle.addEventListener('click', (ev) => {
  const li = ev.target.closest('li');
  // 还要确认找到的 li 确实在当前容器内，避免匹配到容器外面去
  if (!li || !ulEle.contains(li)) return;
  console.log(li.textContent);
});
```

`closest` 会从 `target` 自己开始一路往上匹配选择器，比手写循环干净。那句 `ulEle.contains(li)` 别省，`closest` 是可以一直找到 `document` 的，不加这层校验就可能匹配到容器外的元素上。

第二个坑是有些事件不冒泡，做不了委托。`focus`、`blur`、`mouseenter`、`mouseleave` 都不冒泡。前两个有冒泡版本的替代品 `focusin`、`focusout`，后两个可以用 `mouseover`、`mouseout` 加自己判断 `relatedTarget` 来模拟，但要小心它们在子元素之间移动时也会触发。

## 总结

事件机制这块，先把「一次点击要走完捕获、目标、冒泡三段」这个模型立起来，后面的一切都是它的推论。外层元素有两次介入机会，捕获阶段抢在目标之前，冒泡阶段跟在目标之后。

`preventDefault` 和 `stopPropagation` 是两件互不相干的事，一个管默认行为，一个管传播路径。原文把它们混在一起写了，这是最容易被面试官抓住的点。同元素上的多个监听要一起拦，还需要 `stopImmediatePropagation`。

`addEventListener` 的第三个参数早就不只是那个布尔值了。`once` 省掉手动移除，`passive` 换来移动端滚动流畅，`signal` 配合 `AbortController` 能一次性清掉一组监听，这三个在实际项目里的价值比记住捕获冒泡顺序大得多。

事件委托的收益不在于少注册几个监听，而在于动态节点天然被覆盖，以及少持有一大堆闭包。实现的时候记得用 `closest` 加 `contains` 做命中判断，别直接比 `nodeName`。

至于 `stopPropagation`，能不用就不用。截断事件流的代价是页面上所有依赖全局监听的功能都可能在这个分支上悄悄失效，而且这种问题排查起来毫无线索。

## 参考

- [MDN 事件介绍](https://developer.mozilla.org/zh-CN/docs/Learn/JavaScript/Building_blocks/Events)
- [MDN EventTarget.addEventListener](https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener)
- [MDN Event.stopPropagation](https://developer.mozilla.org/zh-CN/docs/Web/API/Event/stopPropagation)
- [MDN Element.closest](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/closest)
- [DOM Standard 事件派发算法](https://dom.spec.whatwg.org/#dispatching-events)
- [前端进阶之旅](https://interview.poetries.top)
