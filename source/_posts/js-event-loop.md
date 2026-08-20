---
title: JavaScript运行机制Event Loop浏览器与Node差异
description: 从单线程和任务队列讲起，梳理宏任务与微任务的执行顺序，重点对比浏览器事件循环与 Node 六阶段循环的差别，并给出页面卡死、定时器不准这类问题的实战排查路径。
date: 2018-12-21 23:20:54
tags:
  - JavaScript
  - Event Loop
  - Node.js
categories: Front-End
---

同一段代码，在浏览器里跑输出 `timer1, promise1, timer2, promise2`，搬到 Node 里跑却可能变成 `timer1, timer2, promise1, promise2`。第一次遇到这个的时候我以为是自己看错了，反复跑了几次发现结果确实会变。

事件循环这个概念大部分人都能背两句，但一到「为什么这两个环境下不一样」「为什么我的页面点了没反应但也没报错」这类具体问题上就卡住了。这篇把浏览器和 Node 两套循环并排放在一起讲，重点在它们的差别，以及这些差别在实际排查中怎么用得上。

想看更完整的规范级拆解和面试题串讲，可以配合 [JavaScript事件循环机制](https://feinterview.poetries.top/blog/JavaScript-event-loop) 一起读，这篇侧重双环境对比和排查手法。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- JS 为什么是单线程，Web Worker 有没有改变这一点
- 任务队列、执行栈、回调函数三者的关系
- 宏任务和微任务的准确分类（以及原文里过时的那几项）
- 浏览器一轮事件循环的完整顺序，渲染插在哪
- Node 六个阶段各自在干什么
- 两个环境下同一段代码为什么会输出不同顺序
- `process.nextTick` 和微任务的优先级差别
- 页面卡死、定时器不准这类问题怎么排查

## 一、JavaScript是单线程

JavaScript 语言的一大特点就是单线程，也就是说，同一个时间只能做一件事。

假定 JavaScript 同时有两个线程，一个线程在某个 DOM 节点上添加内容，另一个线程删除了这个节点，这时浏览器应该以哪个线程为准？为了避免这种复杂性，从一诞生 JavaScript 就是单线程，这已经成了这门语言的核心特征，将来也不会改变。

为了利用多核 CPU 的计算能力，HTML5 提出 Web Worker 标准，允许 JavaScript 脚本创建多个线程，但是子线程完全受主线程控制，且不得操作 DOM。所以这个标准并没有改变 JavaScript 单线程的本质特征。

这里要分清一件事。单线程说的是「执行 JS 代码的线程只有一个」，不是「浏览器只有一个线程」。渲染、网络请求、定时器计时这些都跑在别的线程上，它们干完活之后把回调塞进队列，等 JS 主线程有空了再来取。这是后面所有内容的前提。

## 二、任务队列

单线程就意味着，所有任务需要排队，前一个任务结束才会执行后一个任务。如果前一个任务耗时很长，后一个任务就不得不一直等着。

如果排队是因为计算量大 CPU 忙不过来，倒也算了。但是很多时候 CPU 是闲着的，因为 IO 设备很慢（比如 Ajax 操作从网络读取数据），不得不等着结果出来再往下执行。这种干等着实在太浪费。

所有任务可以分成两种，一种是同步任务（synchronous），另一种是异步任务（asynchronous）。

同步任务指的是，在主线程上排队执行的任务，只有前一个任务执行完毕，才能执行后一个任务。异步任务指的是，不进入主线程、而进入任务队列（task queue）的任务，只有任务队列通知主线程某个异步任务可以执行了，该任务才会进入主线程执行。

异步执行的运行机制可以拆成四步：

- 所有同步任务都在主线程上执行，形成一个执行栈
- 主线程之外还存在一个任务队列（task queue）。只要异步任务有了运行结果，就在任务队列之中放置一个事件
- 一旦执行栈中的所有同步任务执行完毕，系统就会读取任务队列，看看里面有哪些事件。那些对应的异步任务于是结束等待状态，进入执行栈开始执行
- 主线程不断重复上面的第三步

![主线程执行栈与任务队列的关系示意图](https://s.poetries.top/gitee/2019/10/316.png)

只要主线程空了，就会去读取任务队列，这就是 JavaScript 的运行机制。这个过程会不断重复。

## 三、事件和回调函数

任务队列是一个事件的队列（也可以理解成消息的队列）。IO 设备完成一项任务，就在任务队列中添加一个事件，表示相关的异步任务可以进入执行栈了。主线程读取任务队列，就是读取里面有哪些事件。

任务队列中的事件除了 IO 设备的事件以外，还包括一些用户产生的事件（比如鼠标点击、页面滚动等等）。只要指定过回调函数，这些事件发生时就会进入任务队列，等待主线程读取。

所谓回调函数（callback），就是那些会被主线程挂起来的代码。异步任务必须指定回调函数，当主线程开始执行异步任务，就是执行对应的回调函数。

任务队列是一个先进先出的数据结构，排在前面的事件优先被主线程读取。主线程的读取过程基本上是自动的，只要执行栈一清空，任务队列上第一位的事件就自动进入主线程。但是由于存在定时器功能，主线程首先要检查一下执行时间，某些事件只有到了规定的时间才能返回主线程。

## 四、JS中的event loop

### 4.1 原理分析

主线程从任务队列中读取事件，这个过程是循环不断的，所以整个的这种运行机制又称为 Event Loop（事件循环）。

![事件循环示意图，堆与栈调用外部 API 向任务队列投递事件](https://s.poetries.top/gitee/2019/10/317.png)

上图中，主线程运行的时候产生堆（heap）和栈（stack），栈中的代码调用各种外部 API，它们在任务队列中加入各种事件（click、load、done）。只要栈中的代码执行完毕，主线程就会去读取任务队列，依次执行那些事件所对应的回调函数。

JS 在执行的过程中会产生执行环境，这些执行环境会被顺序地加入到执行栈中。如果遇到异步的代码，会被挂起并加入到 Task（有多种 task）队列中。一旦执行栈为空，Event Loop 就会从 Task 队列中拿出需要执行的代码并放入执行栈中执行。

所以 JS 里所谓的异步，最后还是要回到这条单线程上排队执行，只是排队的时机被推迟了而已。

```js
console.log('script start');

setTimeout(function() {
  console.log('setTimeout');
}, 0);

console.log('script end');
```

不同的任务源会被分配到不同的 Task 队列中，任务源可以分为微任务（microtask）和宏任务（macrotask）。在 ES6 规范中，microtask 称为 jobs，macrotask 称为 task。

```js
console.log('script start');

setTimeout(function() {
  console.log('setTimeout');
}, 0);

new Promise((resolve) => {
    console.log('Promise')
    resolve()
}).then(function() {
  console.log('promise1');
}).then(function() {
  console.log('promise2');
});

console.log('script end');
// script start => Promise => script end => promise1 => promise2 => setTimeout
```

以上代码虽然 `setTimeout` 写在 `Promise` 之前，但是因为 `Promise` 属于微任务而 `setTimeout` 属于宏任务，微任务在本轮循环末尾就被清空，宏任务要等下一轮。

有一处容易被漏掉，`new Promise` 里传的那个执行器函数是同步执行的，所以 `Promise` 这行会跟着 `script start` 一起先打出来，只有 `.then` 里的回调才是微任务。

### 4.2 微任务

- `process.nextTick`（Node 专属）
- `promise` 的 `then` / `catch` / `finally`
- `queueMicrotask`
- `MutationObserver`

原文这里列了 `Object.observe`。那个 API 早就被从规范里撤掉了，各家浏览器也都移除了实现，现在写它只会报未定义，我把它换成了 `queueMicrotask`。

`queueMicrotask` 是标准化之后专门用来手动往微任务队列里塞回调的入口。在它之前大家用 `Promise.resolve().then(fn)` 凑合，那个写法会多创建一个 Promise 对象，而且回调里抛错会被 Promise 吞成 rejection，用 `queueMicrotask` 抛出来的错误则会正常走到全局错误处理。

`process.nextTick` 严格说也不属于标准的微任务队列，它在 Node 里有一条独立的队列，优先级比 Promise 的微任务还要高，后面会单独说。

### 4.3 宏任务

- `script`
- `setTimeout`
- `setInterval`
- `setImmediate`（只有 Node 和老 IE 有，其他浏览器没有）
- `I/O`
- `UI rendering`

宏任务中包括了 `script`，浏览器会先执行一个宏任务，接下来有异步代码的话就先执行微任务。

### 4.4 一轮完整的事件循环

浏览器里一轮循环的顺序是这样的：

- 执行同步代码，这属于宏任务
- 执行栈为空，查询是否有微任务需要执行
- 执行所有微任务
- 必要的话渲染 UI
- 然后开始下一轮 Event loop，执行宏任务中的异步代码

「执行所有微任务」这几个字要抠一下。微任务队列是要被彻底清空的，包括在执行微任务过程中新产生的微任务，也要在本轮一起处理掉。这就带来一个后果，如果你在微任务里递归地生成新微任务，这个循环永远不会结束，浏览器会彻底冻死，连页面都不会重绘。

而同样的死循环换成宏任务（比如 `setTimeout` 里再 `setTimeout`），页面还是能响应的，因为每两个宏任务之间浏览器有机会插入渲染。这个差别在排查「页面完全没反应」的问题时非常有用。

通过上述的 Event loop 顺序可知，如果宏任务中的异步代码有大量的计算并且需要操作 DOM 的话，为了更快的界面响应，我们可以把操作 DOM 放入微任务中。

## 五、Node 中的 Event loop

Node.js 也是单线程的 Event Loop，但是它的运行机制不同于浏览器环境。Node 的 Event loop 分为 6 个阶段，它们会按照顺序反复运行。

![Node.js 事件循环六个阶段的流转示意图](https://s.poetries.top/gitee/2019/10/318.png)

### 5.1 Node.js的运行机制

- V8 引擎解析 JavaScript 脚本
- 解析后的代码调用 Node API
- `libuv` 库负责 Node API 的执行。它将不同的任务分配给不同的线程，形成一个 Event Loop（事件循环），以异步的方式将任务的执行结果返回给 V8 引擎
- V8 引擎再将结果返回给用户

除了 `setTimeout` 和 `setInterval` 这两个方法，Node.js 还提供了另外两个与任务队列有关的方法，`process.nextTick` 和 `setImmediate`。它们可以帮助我们加深对任务队列的理解。

这里最关键的差别就出来了。浏览器只有一条宏任务队列（不同任务源有各自的队列，但取的时候一次取一个），而 Node 有六个阶段，每个阶段有自己的回调队列。所以在 Node 里问「这个回调什么时候执行」，得先问「它属于哪个阶段」。

### 5.2 各个阶段

```
┌───────────────────────┐
┌─>│        timers         │
│  └──────────┬────────────┘
│  ┌──────────┴────────────┐
│  │     I/O callbacks     │
│  └──────────┬────────────┘
│  ┌──────────┴────────────┐
│  │     idle, prepare     │
│  └──────────┬────────────┘      ┌───────────────┐
│  ┌──────────┴────────────┐      │   incoming:   │
│  │         poll          │<──connections───     │
│  └──────────┬────────────┘      │   data, etc.  │
│  ┌──────────┴────────────┐      └───────────────┘
│  │        check          │
│  └──────────┬────────────┘
│  ┌──────────┴────────────┐
└──┤    close callbacks    │
   └───────────────────────┘
```

#### 5.2.1 timer

`timers` 阶段会执行 `setTimeout` 和 `setInterval`。

一个 timer 指定的时间并不是准确时间，而是在达到这个时间后尽快执行回调，可能会因为系统正在执行别的事务而延迟。下限的时间有一个范围 `[1, 2147483647]`，如果设定的时间不在这个范围，将被设置为 1。

注意最后这条，`setTimeout(fn, 0)` 在 Node 里实际被当成 1 毫秒处理。浏览器那边规则不同，是嵌套层级超过 5 层之后钳制到最少 4 毫秒。所以任何指望 `setTimeout(fn, 0)` 精确执行的代码都是不可靠的。

#### 5.2.2 I/O

I/O 阶段会执行除了 `close` 事件、定时器和 `setImmediate` 的回调。这里主要处理的是上一轮循环中有少量没执行完的 I/O 回调，比如某些系统错误的回调。

#### 5.2.3 idle, prepare

`idle`、`prepare` 阶段是 Node 内部实现使用的，业务代码碰不到。

#### 5.2.4 poll

`poll` 阶段很重要，这一阶段中系统会做两件事情：

- 执行到点的定时器
- 执行 poll 队列中的事件

并且当 poll 中没有定时器的情况下，会发生以下两件事情：

- 如果 poll 队列不为空，会遍历回调队列并同步执行，直到队列为空或者达到系统限制
- 如果 poll 队列为空，会有两件事发生
  - 如果有 `setImmediate` 需要执行，poll 阶段会停止并且进入到 check 阶段执行 `setImmediate`
  - 如果没有 `setImmediate` 需要执行，会等待回调被加入到队列中并立即执行回调
- 如果有别的定时器需要被执行，会回到 timer 阶段执行回调

poll 是整个循环里唯一会「停下来等」的阶段，绝大部分时间 Node 进程都阻塞在这儿等 I/O。理解这一点之后，`setImmediate` 为什么能插队就好解释了，它就是专门用来打断这个等待、让循环继续往下走的。

#### 5.2.5 check

check 阶段执行 `setImmediate`。

#### 5.2.6 close callbacks

close callbacks 阶段执行 close 事件，比如 socket 关闭时的 `'close'` 回调。

### 5.3 setTimeout 和 setImmediate 谁先

在 Node 中，有些情况下的定时器执行顺序是随机的。

```js
setTimeout(() => {
    console.log('setTimeout');
}, 0);
setImmediate(() => {
    console.log('setImmediate');
})
// 这里可能会输出 setTimeout，setImmediate
// 可能也会相反的输出，这取决于性能
// 因为可能进入 event loop 用了不到 1 毫秒，这时候会执行 setImmediate
// 否则会执行 setTimeout
```

这是 Node 里最经典的一道题。原因在于进程启动到进入 timers 阶段这段准备时间是不确定的，如果这段时间超过 1 毫秒，那个 0 毫秒（实际是 1 毫秒）的定时器已经到点了，timers 阶段直接执行它；如果没超过，timers 阶段发现还没到点就跳过，一路走到 check 阶段先执行 `setImmediate`。机器负载、当时在跑什么，都会影响结果。

当然在这种情况下，执行顺序是确定的：

```js
var fs = require('fs')

fs.readFile(__filename, () => {
    setTimeout(() => {
        console.log('timeout');
    }, 0);
    setImmediate(() => {
        console.log('immediate');
    });
});
// 因为 readFile 的回调在 poll 中执行
// 发现有 setImmediate ，所以会立即跳到 check 阶段执行回调
// 再去 timer 阶段执行 setTimeout
// 所以以上输出一定是 setImmediate，setTimeout
```

差别在于起点不同。放在 I/O 回调里，代码执行的位置已经明确是 poll 阶段，往后走就是 check，所以 `setImmediate` 一定先。这也是判断这类题的通用方法，先定位「当前代码跑在哪个阶段」，再看目标阶段在它前面还是后面。

### 5.4 微任务在 Node 里什么时候执行

上面介绍的都是 macrotask 的执行情况，microtask 会在以上每个阶段完成后立即执行。

```js
setTimeout(()=>{
    console.log('timer1')

    Promise.resolve().then(function() {
        console.log('promise1')
    })
}, 0)

setTimeout(()=>{
    console.log('timer2')

    Promise.resolve().then(function() {
        console.log('promise2')
    })
}, 0)

// 以上代码在浏览器和 node 中打印情况是不同的
// 浏览器中一定打印 timer1, promise1, timer2, promise2
// node 中可能打印 timer1, timer2, promise1, promise2
// 也可能打印 timer1, promise1, timer2, promise2
```

这段注释是原文写于 2018 年时的情况，现在得补一句。早期的 Node 在 timers 阶段是把该阶段所有到点的定时器回调全跑完，才去清空微任务队列，所以会出现 `timer1, timer2, promise1, promise2` 这种输出。

后来 Node 调整了这个行为，改成每执行完一个宏任务回调就立刻清空微任务队列，和浏览器对齐。在现在的 Node 上跑这段，输出稳定是 `timer1, promise1, timer2, promise2`。

这个变更是我认为最值得知道的一处版本差异。很多面试题库里还在拿旧行为出题，你按旧答案答，面试官自己去跑一遍反而对不上。稳妥的答法是把两种行为和变更原因都说出来。

Node 中的 `process.nextTick` 会先于其他 microtask 执行。

```js
setTimeout(() => {
  console.log("timer1");

  Promise.resolve().then(function() {
    console.log("promise1");
  });
}, 0);

process.nextTick(() => {
  console.log("nextTick");
});
// nextTick, timer1, promise1
```

`nextTick` 有自己独立的队列，而且这条队列会在切换到 Promise 微任务队列之前被完全清空。所以在 `nextTick` 回调里递归调 `nextTick`，会把整个事件循环饿死，连 I/O 都进不去。Node 官方文档自己都建议大多数情况下用 `setImmediate` 代替它。

## 六、这些知识在排查时怎么用

讲了这么多顺序，真正的价值在于遇到问题时知道往哪儿看。分享几个我实际用得上的判断。

### 6.1 页面卡住不动，先看是哪种卡

打开 Performance 面板录一段。如果看到一条超长的黄色 Task 条（超过 50 毫秒的会被标成 Long Task，带红色三角），那就是同步代码占着主线程，去看那一条的火焰图找具体函数。

如果连 Performance 都录不出来、整个标签页失去响应，大概率是微任务死循环，或者一个纯同步的 `while`。这两种情况下渲染根本没机会插进来。区分办法很简单，宏任务死循环页面还能重绘（虽然很卡），微任务死循环是彻底黑掉。

### 6.2 定时器不准，先确认是不是被排队了

`setTimeout(fn, 1000)` 实际 3 秒才执行，不是定时器坏了，是它到点的时候主线程还忙着。定时器只负责「到时间把回调放进队列」，什么时候被取出来执行取决于主线程什么时候空。

要做精确的时间控制，别用累加 `setTimeout` 的方式，每次都重新用 `Date.now()` 校准。要做动画，直接用 `requestAnimationFrame`，它和渲染时机绑定。

### 6.3 UI 更新滞后一帧

在同一轮循环里改了 DOM 又立刻读取布局属性（`offsetHeight` 这类），会触发强制同步布局。而如果你期望「改完立刻看到」，实际上要等到本轮微任务清空、浏览器进入渲染步骤之后才会真正画出来。

需要在渲染前的最后一刻做事，用 `requestAnimationFrame`；需要在渲染完成后做事，用 `requestAnimationFrame` 里再套一层 `setTimeout`，或者用 `requestIdleCallback`。

### 6.4 Node 服务响应变慢

先确认是不是 CPU 密集操作占住了主线程。`JSON.parse` 一个几十兆的字符串、同步的 `crypto` 计算、正则回溯，这些都会让整个事件循环停摆，表现是所有请求一起变慢而不是某个接口慢。

排查手段是监控事件循环延迟。起一个固定间隔的定时器，记录实际触发间隔和预期间隔的差值，这个差值持续偏大就说明循环被堵住了。Node 也内置了 `perf_hooks` 里的 `monitorEventLoopDelay` 来做这件事。

说实话我在 Node 这边的经验不如浏览器多，上面这些主要是在几个中小服务上验证过，超大规模场景下的表现我没跑过。

## 总结

事件循环这件事，浏览器和 Node 的相同点是「同步代码跑完、清空微任务、再取下一个宏任务」这个骨架，不同点在于宏任务是怎么组织的。浏览器是一条队列取一个，Node 是六个阶段轮着来，每个阶段有自己的队列。

判断 Node 里两个回调谁先执行，通用方法是先定位当前代码处在哪个阶段，再看目标阶段在它前面还是后面。裸写的 `setTimeout` 和 `setImmediate` 顺序不确定，放进 I/O 回调里就确定了，原因就在这儿。

有两处过时的说法要更新。`Object.observe` 已经被移除，现在手动创建微任务用 `queueMicrotask`；Node 早期在 timers 阶段是跑完所有定时器再清微任务，现在已经改成每个回调后就清一次，和浏览器一致了。

`process.nextTick` 的优先级高于所有 Promise 微任务，而且它自己的队列会被完全清空才轮到别人。这是个很容易把事件循环饿死的 API，能用 `setImmediate` 就别用它。

最后说排查。微任务死循环会让页面彻底冻住，宏任务死循环只是很卡；定时器不准八成是主线程忙不是定时器坏；Node 服务整体变慢先怀疑事件循环被 CPU 密集操作堵了。知道这几条，比背下宏微任务分类表有用得多。

## 参考

- [JavaScript 运行机制详解：再谈Event Loop 阮一峰](http://www.ruanyifeng.com/blog/2014/10/event-loop.html)
- [Node.js 官方文档 Event Loop, Timers, and process.nextTick()](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)
- [HTML Standard 事件循环处理模型](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model)
- [MDN queueMicrotask](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/queueMicrotask)
- [MDN 微任务指南](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide)
- [前端进阶之旅](https://interview.poetries.top)
