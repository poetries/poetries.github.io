---
title: Vue 事件处理与事件修饰符详解（六）
description: 讲清 Vue 里事件传参、$event 拿原生事件对象的写法，以及 stop、prevent、capture、self、once、passive 六个事件修饰符和按键修饰符的用法与顺序陷阱。
date: 2018-08-27 00:10:32
tags:
  - Vue
  - 事件处理
  - 事件修饰符
categories: Front-End
---

绑事件这件事，用 jQuery 的时候是 `$('#btn').on('click', fn)`，逻辑和 DOM 是分开的，改一处得两边找。Vue 把事件绑定挪回了模板上，`@click="fn"` 一眼就能看出这个按钮点了会走哪个方法。但挪回来之后冒出几个新问题：传了参数就拿不到事件对象了，阻止冒泡该写在方法里还是模板上，修饰符串起来写顺序有没有讲究。这篇把这些一个个说清楚，顺便把原文里少列的那个修饰符补上。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 事件绑定的两种写法，带括号和不带括号的区别
- 传参之后怎么用 `$event` 拿回原生事件对象
- 六个事件修饰符各自解决什么问题，为什么顺序会影响结果
- `.passive` 这个容易被漏掉的修饰符，它和滚动性能的关系
- 按键修饰符、系统修饰键和 `.exact` 的用法
- 组件上绑原生事件为什么要加 `.native`
- Vue 3 里事件这块变了什么

## 一、方法传参

最基础的一种，`@` 是 `v-on:` 的缩写，绑定的方法从 `methods` 里取：

```html
<div id="test">
    <button @click="sayHi('你好')">说你好</button>
    <button @click="sayHi('我被点击了')">说我被点击了</button>
</div>
<script type="text/javascript">
    var myVue = new Vue({
        el: '#test',
        methods: {      // 这里使用 methods
            sayHi: function (message) {
                alert(message)
            }
        }
    })
</script>
```

这里有个规则要先立住：模板里写的 `sayHi('你好')` 不是「立即调用」，Vue 编译的时候会把它包成一个函数，点击时才执行。所以别担心页面一渲染 alert 就弹出来。

反过来，如果你写 `@click="sayHi()"` 但 `sayHi` 返回的是另一个函数，那也不会自动继续调用。想传参又想复用逻辑，老老实实用箭头函数或者在方法内部判断。

不带括号和带括号，Vue 的处理是两条路。不带括号时，Vue 把方法本身作为事件监听器，原生事件对象会作为第一个参数传进去。带括号时，Vue 生成一个内联的包装函数，你传什么它就收什么，事件对象没地方进来。

## 二、访问原生 DOM 事件对象

传了参数还想要事件对象，用 `$event` 这个特殊变量：

```html
<button @click="changeColor('你好',$event)">点击我</button>
<div style="height: 100px;width: 100px;background-color: red;" @mouseover="over('鼠标从我上面滑过',$event)">
    鼠标从我上面滑过试试
</div>

<script type="text/javascript">
    var myVue = new Vue({
        el: '#test',
        methods: {      // 这里使用 methods
            changeColor: function (message, event) {
                alert(message + event);    // 弹出 你好[object MouseEvent]
            },
            over: function (message, event) {
                alert(message + event);   // 弹出 鼠标从我上面滑过[object MouseEvent]
            }
        }
    })
</script>
```

`$event` 只在模板里有效，是 Vue 提供的编译期变量，方法内部是没有这个东西的。参数位置随便放，写 `sayHi($event, '你好')` 也行，只要方法签名对得上。

拿到事件对象之后能做的事和原生一模一样，`event.target` 拿触发元素，`event.currentTarget` 拿绑定元素，`event.clientX` 拿坐标。这里顺带提醒一句，`target` 和 `currentTarget` 在有子元素的情况下不是一回事，点在按钮里的 `span` 上，`target` 是那个 `span`，`currentTarget` 才是按钮。这个坑跟 Vue 无关，是原生事件模型自带的，但在 Vue 里因为绑定写得太顺手，反而更容易踩。

## 三、事件修饰符

原文写的是「事件修饰符有基本的 6 种」，但下面只列了 5 个。漏掉的那个是 `.passive`，Vue 2.3 才加进来的，下面一并补上。

### 3.1 .stop 阻止事件冒泡

```html
<a v-on:click.stop="doThis"></a>
```

等价于在方法里调用 `event.stopPropagation()`。

### 3.2 .prevent 阻止默认事件

```html
<form v-on:submit.prevent="onSubmit"></form>
```

等价于 `event.preventDefault()`。表单提交、`a` 标签跳转这两个场景用得最多。

### 3.3 .capture 使用事件捕获模式

```html
<div v-on:click.capture="doThis">...</div>
```

原生事件有捕获和冒泡两个阶段，默认监听的是冒泡阶段（从内向外）。加了 `.capture` 就改成捕获阶段（从外向内），父元素会比子元素先收到事件。原文这里把「事件捕获」写成了「时间捕获」，是个笔误。

### 3.4 .self 只在元素自身触发时回调

```html
<div v-on:click.self="doThat">...</div>
```

它和 `.stop` 经常被搞混。`.stop` 是「我收到了，但不往上传」，`.self` 是「只有点的正好是我本人才算，点在子元素上冒泡过来的我不管」。做遮罩层点击关闭弹窗最合适的就是 `.self`，点遮罩关闭，点弹窗内容区不关闭，一个修饰符解决，不用在方法里判断 `event.target === event.currentTarget`。

### 3.5 .once 事件只触发一次

```html
<a v-on:click.once="doThis"></a>
```

触发一次之后 Vue 会自动把监听器移除。防止表单重复提交的场景可以用，但要注意它是彻底移除，不是禁用一段时间，需要「点一次冷却三秒」这种逻辑还是得自己写节流。

### 3.6 .passive 承诺不阻止默认行为

```html
<div v-on:scroll.passive="onScroll">...</div>
```

这个修饰符对应原生的 `{ passive: true }` 监听选项，它告诉浏览器「这个监听器里绝对不会调用 `preventDefault()`」。为什么要专门告诉浏览器一声？因为浏览器在触发滚动、触摸这类事件时，如果不知道监听器会不会阻止默认行为，就得先把监听器跑完再决定滚不滚，这一等就可能掉帧。加上 `.passive` 之后浏览器可以直接滚，不必等。

移动端的 `touchmove`、长列表的 `scroll` 加上它对流畅度提升是实打实的。但有一条硬约束：`.passive` 和 `.prevent` 不能一起用，它俩说的是相反的事，一起写 Vue 会警告，而且 `.prevent` 会被忽略。

### 3.7 顺序为什么重要

使用修饰符时，顺序很重要，相应的代码会以同样的顺序产生。用 `@click.prevent.self` 会阻止所有的点击，而 `@click.self.prevent` 只会阻止元素上的点击。

理解方式是把修饰符当成一层层包裹在真正处理函数外面的中间件，从左到右依次执行。`.prevent.self` 是先无条件执行 `preventDefault()`，再判断是不是自身触发；`.self.prevent` 是先判断，判断通过了才执行 `preventDefault()`。所以前者对冒泡上来的子元素点击也生效，后者不生效。

我一开始也是随手写的，直到有次遮罩层里的链接怎么都点不动，排查了一下午才发现是修饰符顺序写反了，把子元素的默认行为一起给拦了。

## 四、按键修饰符

监听键盘事件时，经常需要判断按的是哪个键。不用修饰符的原始写法长这样：

```html
<div id="app">
    <input type="text" v-on:keydown="ke"/>
</div>
<script>
var app = new Vue({
        el:"#app",
        data:{
            msg:"事件处理",
            counter:0
        },
        methods:{
            ke:function(e){
                if(e.keyCode == 13){
                    this.msg = e.target.value;
                    e.target.value = "";
                }
            }
        }
});
</script>
```

方法里判断 `keyCode == 13` 能跑，但可读性很差，谁记得住 13 是回车、27 是 Esc。Vue 允许为 `v-on` 在监听键盘事件时添加按键修饰符，直接写名字：

- `enter`（回车）
- `tab`（Tab 切换）
- `delete`（捕获「删除」和「退格」两个键）
- `esc`（Esc 键）
- `space`（空格键）
- `up`（上方向键）
- `down`（下方向键）
- `left`（左方向键）
- `right`（右方向键）

上面那段代码用修饰符改写，方法体能砍掉一半：

```html
<input type="text" @keydown.enter="ke">
```

原文把 `space` 注成了「退档键」，应该是空格键，这里改过来了。

对于没被 Vue 内置的按键，可以通过全局的 `config.keyCodes` 对象自定义按键修饰符别名：

```javascript
Vue.config.keyCodes.f1 = 112
```

配好之后模板里就能写 `@keyup.f1="handler"`。

### 4.1 系统修饰键和 .exact

Vue 2.1 之后还有一组系统修饰键，用来监听组合键：`.ctrl`、`.alt`、`.shift`、`.meta`（在 Mac 上是 Command 键，在 Windows 上是 Win 键）。

```html
<!-- Ctrl + Enter 发送，聊天框的标配 -->
<textarea @keyup.ctrl.enter="send"></textarea>
```

这里有个坑要注意。`@keyup.ctrl` 的含义是「松开某个键的时候 Ctrl 处于按下状态」，所以按住 Ctrl 再按 Alt 也会触发，因为 Ctrl 确实按着。想要严格匹配，Vue 2.5 加了 `.exact` 修饰符：

```html
<!-- 有且只有 Ctrl 被按下的时候才触发 -->
<button @click.ctrl.exact="onCtrlClick">A</button>
<!-- 没有任何系统修饰键被按下的时候才触发 -->
<button @click.exact="onClick">A</button>
```

另外还有三个鼠标按键修饰符 `.left`、`.right`、`.middle`，限定只有特定的鼠标键触发时才回调，做右键菜单的时候用得上。

## 五、组件上的事件和 .native

上面讲的都是绑在原生元素上的。绑到自定义组件上时，`@click="handler"` 监听的是组件用 `$emit('click')` 抛出的自定义事件，不是这个组件根元素上的原生点击。两者名字一样但完全不是一条链路，这是新手最容易懵的地方。

Vue 2 的解法是加 `.native` 修饰符：

```html
<my-component v-on:click.native="doTheThing"></my-component>
```

加了之后事件会绑到组件的根元素上，走原生那条路。组件之间通过 `$emit` 通信的完整机制，我在 [Vue 组件](https://feinterview.poetries.top/blog/vue-component) 那篇里从 props 和 events 两个方向都拆过。

## 六、Vue 3 里事件这块的变化

老代码迁到 Vue 3，事件这块要动三处。

`.native` 修饰符被移除了。Vue 3 引入了 `emits` 选项，组件显式声明自己会抛出哪些事件；没有被声明的监听器会自动落到组件根元素上，也就是原来 `.native` 的效果。所以大部分情况下把 `.native` 直接删掉就行，但组件如果声明了同名的自定义事件，行为会不一样，迁移时得逐个确认。

按键修饰符里的数字形式没了。`@keyup.13` 这种写法和 `Vue.config.keyCodes` 全局配置在 Vue 3 里都被移除，统一用按键名，比如 `@keyup.enter`、`@keyup.page-down`。名字取自原生事件的 `key` 属性，转成短横线形式。

`v-on` 的对象语法（不带参数直接绑一个事件名到处理函数的映射）依然支持，但不再支持修饰符。

除此之外，`.stop`、`.prevent`、`.self`、`.once`、`.capture`、`.passive`、`.exact` 这些都原样保留，六个基本修饰符一个没少。

## 总结

Vue 的事件系统看着是给模板加了点糖，实际解决的是两类问题。

一类是把事件对象和业务参数的传递理顺了。不带括号自动收事件对象，带括号用 `$event` 显式取，两种写法覆盖全部场景。

另一类是把「DOM 事件细节」从方法体里挪了出来。阻止冒泡、阻止默认行为、限定触发条件、监听特定按键，这些和业务无关的判断全部收进修饰符，方法只留纯粹的业务逻辑。这个设计是真的舒服，写多了之后回头看 jQuery 那种方法体开头三行 `event.xxx()` 的写法会觉得很吵。

几个容易翻车的点值得单独记：修饰符顺序从左到右依次生效，`.prevent.self` 和 `.self.prevent` 不等价；`.passive` 和 `.prevent` 互斥；`.self` 适合遮罩层，`.stop` 适合阻断冒泡链，别混用；组件上绑原生事件 Vue 2 要 `.native`，Vue 3 已经不需要了。

## 参考

- [Vue 3 官方文档 - 事件处理](https://cn.vuejs.org/guide/essentials/event-handling.html)
- [Vue 3 官方文档 - 组件事件](https://cn.vuejs.org/guide/components/events.html)
- [Vue 3 迁移指南 - 按键修饰符](https://v3-migration.vuejs.org/breaking-changes/keycode-modifiers.html)
- [MDN - EventTarget.addEventListener 的 passive 选项](https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener)
- [前端进阶之旅](https://interview.poetries.top)
