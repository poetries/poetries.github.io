---
title: 彻底弄懂 JavaScript 执行机制，Event Loop 宏任务与微任务
date: 2019-09-22 10:20:54
description: 从单线程和同步异步讲到宏任务微任务的完整执行顺序，包含 setTimeout 的真实延迟、process.nextTick 与微任务的优先级、queueMicrotask，以及浏览器和 Node 事件循环的实际差异。
tags:
  - JavaScript
  - Event Loop
  - 异步编程
  - 面试题
categories: Front-End
---

面试里被问「下面这段代码输出什么」，一堆 `setTimeout` 套 `Promise` 套 `process.nextTick`，能背出答案的人不少，能讲清楚为什么的人少很多。而真到了排查线上问题的时候，靠的恰恰是后者：为什么这个 loading 明明 `setState` 了却晚了一帧才消失，为什么这个 `setTimeout(fn, 0)` 在某台机器上要等半秒。

这篇把 JavaScript 的执行机制从头捋一遍，从单线程为什么必须有事件循环讲到宏任务微任务的实际排队规则，再到浏览器和 Node 之间那些容易踩的差异。文中的关键结论我都在 Node 22.23.1 上跑过。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 单线程为什么需要事件循环，同步任务和异步任务分别去了哪
- `setTimeout` 的延迟为什么经常对不上，4 毫秒下限到底怎么回事
- 宏任务和微任务的划分，以及 `process.nextTick` 其实不是微任务这件事
- 一道经典面试题的完整推演，以及在 Node 22 上的实测结果
- 浏览器和 Node 的事件循环差异，`setImmediate` 该怎么理解
- 微任务和页面渲染的关系，为什么 `requestAnimationFrame` 不能用来做延时

`javascript` 是一门单线程语言。在 `HTML5` 中提出了 `Web Worker`，但 `javascript` 是单线程这一核心仍未改变。所以一切 `javascript` 版的「多线程」都是用单线程模拟出来的。

## 一、javascript 事件循环

既然 js 是单线程，那就像只有一个窗口的银行，客户需要排队一个一个办理业务，同理 js 任务也要一个一个顺序执行。如果一个任务耗时过长，那么后一个任务也必须等着。

那么问题来了。假如我们想浏览新闻，但是新闻包含的超清图片加载很慢，难道我们的网页要一直卡着直到图片完全显示出来？

聪明的程序员把任务分为了两类：

- 同步任务
- 异步任务

当我们打开网站时，网页的渲染过程就是一大堆同步任务，比如页面骨架和页面元素的渲染。而像加载图片音乐之类占用资源大耗时久的任务，就是异步任务。关于这部分有严格的文字定义，但本文的目的是用最小的学习成本彻底弄懂执行机制，所以我们用导图来说明：

![同步任务与异步任务的执行流程示意图](https://s.poetries.top/gitee/20190922/event-loop-1.png)

- 同步和异步任务分别进入不同的执行「场所」，同步的进入主线程，异步的进入 `Event Table` 并注册函数
- 当指定的事情完成时，`Event Table` 会将这个函数移入 `Event Queue`
- 主线程内的任务执行完毕为空，会去 `Event Queue` 读取对应的函数，进入主线程执行
- 上述过程会不断重复，也就是常说的 `Event Loop`(事件循环)

我们不禁要问了，那怎么知道主线程执行栈为空啊？

原文这里的说法是 js 引擎存在 `monitoring process` 进程持续检查执行栈。这个描述是一种便于理解的比喻，规范里并没有这么一个进程。真实情况是事件循环本身就是一个循环体，跑完一个任务就回到循环开头看队列里还有没有下一个，没有就阻塞等待。同样地，`Event Table` 和 `Event Queue` 也是这篇文章为了讲清楚而起的名字，HTML 规范里对应的术语是任务队列（task queue）和微任务队列（microtask queue）。

这套模型讲执行顺序是够用的，只是别把它当成规范原文去背，面试官追问的时候容易露怯。

```js
let data = [];
$.ajax({
    url:www.javascript.com,
    data:data,
    success:() => {
        console.log('发送成功!');
    }
})
console.log('代码执行结束');
```

上面是一段简易的 ajax 请求代码：

- `ajax` 进入 `Event Table`，注册回调函数 success
- 执行 `console.log('代码执行结束')`
- `ajax` 事件完成，回调函数 `success` 进入 `Event Queue`
- 主线程从 `Event Queue` 读取回调函数 `success` 并执行

还有一点值得点破。发起网络请求、计时、读文件这些事，并不是 JavaScript 线程自己在做，是宿主环境（浏览器或 Node）用另外的线程在做。JavaScript 只有一个执行线程，但浏览器不是单线程的。所以「单线程」限制的是你写的代码同一时刻只有一行在跑，不限制底下的 I/O 并发。

## 二、setTimeout 和 setInterval

### 2.1 setTimeout

大名鼎鼎的 `setTimeout` 无需再多言，大家对它的第一印象就是异步可以延时执行，我们经常这么实现延时 3 秒执行：

```js
setTimeout(() => {
    console.log('延时3秒');
},3000)
```

渐渐地 `setTimeout` 用的地方多了，问题也出现了。有时候明明写的延时 3 秒，实际却 5、6 秒才执行函数，这又咋回事啊？

```js
setTimeout(() => {
    task();
},3000)
console.log('执行console');
```

根据前面我们的结论，`setTimeout` 是异步的，应该先执行 `console.log` 这个同步任务，所以我们的结论是：

```
//执行console
//task()
```

去验证一下，结果正确。然后我们修改一下前面的代码：

```
setTimeout(() => {
    task()
},3000)

sleep(10000000)
```

乍一看其实差不多，但我们把这段代码在 chrome 执行一下，却发现控制台执行 `task()` 需要的时间远远超过 3 秒。说好的延时三秒，为啥现在需要这么长时间啊？

这时候我们需要重新理解 setTimeout 的定义。先说上述代码是怎么执行的：

- `task()` 进入 `Event Table` 并注册，计时开始
- 执行 `sleep` 函数，很慢，非常慢，计时仍在继续
- 3 秒到了，计时事件 `timeout` 完成，`task()` 进入 `Event Queue`，但是 `sleep` 也太慢了吧，还没执行完，只好等着
- `sleep` 终于执行完了，`task()` 终于从 `Event Queue` 进入了主线程执行

上述的流程走完，我们知道 `setTimeout` 这个函数，是经过指定时间后，把要执行的任务（本例中为 `task()`）加入到 `Event Queue` 中。又因为是单线程任务要一个一个执行，如果前面的任务需要的时间太久，那么只能等着，导致真正的延迟时间远远大于 3 秒。

所以 `setTimeout` 的第二个参数是「最少等这么久」，不是「正好等这么久」。

我们还经常遇到 `setTimeout(fn, 0)` 这样的代码，0 秒后执行又是什么意思呢？是不是可以立即执行呢？

答案是不会的。`setTimeout(fn, 0)` 的含义是，指定某个任务在主线程最早可得的空闲时间执行，意思就是不用再等多少秒了，只要主线程执行栈内的同步任务全部执行完成、栈为空就马上执行。举例说明：

```js
//代码1
console.log('先执行这里');
setTimeout(() => {
    console.log('执行啦')
},0);
```

```js
//代码2
console.log('先执行这里');
setTimeout(() => {
    console.log('执行啦')
},3000);
```

代码 1 的输出结果是：

```
//先执行这里
//执行啦
```

代码 2 的输出结果是：

```
//先执行这里
// ... 3s later
// 执行啦
```

关于 `setTimeout` 要补充的是，即便主线程为空，0 毫秒实际上也是达不到的，根据 HTML 的标准最低是 `4` 毫秒。

这条得说得更准确一点。HTML 规范里的规则是：定时器有一个嵌套层级计数，当嵌套层级超过 5 层、并且传入的时间小于 4 毫秒时，才会被钳制到 4 毫秒。也就是说第一次调用 `setTimeout(fn, 0)` 并不会被钳到 4ms，是在定时器回调里再套定时器、连续套超过五层之后才会触发。所以那些用 `setTimeout` 递归做轮询的代码，跑着跑着间隔会自己变长。

还有一条实际影响更大的：页面切到后台标签页时，浏览器会把 `setTimeout` 的最小间隔限制到 1 秒甚至更长，用来省电。所以靠 `setInterval` 累加计时器做倒计时，用户切走再切回来一定会对不上，正确做法是每次都用 `Date.now()` 重新算差值。这个我踩过，本地测一点问题没有，用户反馈说倒计时慢了好几分钟。

### 2.2 setInterval

上面说完了 `setTimeout`，当然不能错过它的孪生兄弟 `setInterval`。他俩差不多，只不过后者是循环执行。对于执行顺序来说，`setInterval` 会每隔指定的时间将注册的函数置入 Event Queue，如果前面的任务耗时太久，那么同样需要等待。

唯一需要注意的一点是，对于 `setInterval(fn, ms)` 来说，我们已经知道不是每过 `ms` 毫秒会执行一次 `fn`，而是每过 `ms` 毫秒会有 `fn` 进入 `Event Queue`。一旦 `setInterval` 的回调函数 fn 执行时间超过了延迟时间 ms，那么就完全看不出来有时间间隔了。这句话请读者仔细品味。

补一句实践上的结论：需要周期执行又不希望任务堆积的场景，用 `setTimeout` 递归代替 `setInterval`。

```js
function poll() {
  doSomething()
  timer = setTimeout(poll, 1000)   // 上一次干完了才排下一次
}
```

这样能保证两次执行之间至少隔 1 秒，而不是「每 1 秒往队列里塞一个」。另外定时器忘了清是内存泄漏的常见来源，组件销毁的时候记得 `clearTimeout` / `clearInterval`，相关排查手段我写在 [JavaScript 内存泄漏排查](https://feinterview.poetries.top/blog/js-memory-leak) 那篇里。

## 三、Promise 与 process.nextTick(callback)

传统的定时器我们已经研究过了，接着我们探究 `Promise` 与 `process.nextTick(callback)` 的表现。

`process.nextTick(callback)` 类似 `node.js` 版的「`setTimeout`」，在事件循环的下一次循环中调用 callback 回调函数。

除了广义的同步任务和异步任务，我们对任务有更精细的定义：

- `macro-task`(宏任务)：包括整体代码 `script`，`setTimeout`，`setInterval`
- `micro-task`(微任务)：`Promise`，`process.nextTick`

不同类型的任务会进入对应的 `Event Queue`，比如 `setTimeout` 和 `setInterval` 会进入相同的 `Event Queue`。

事件循环的顺序决定 js 代码的执行顺序。进入整体代码（宏任务）后开始第一次循环，接着执行所有的微任务，然后再次从宏任务开始，找到其中一个任务队列执行完毕，再执行所有的微任务。听起来有点绕，我们用一段代码说明：

```js
setTimeout(function() {
    console.log('setTimeout');
})

new Promise(function(resolve) {
    console.log('promise');
}).then(function() {
    console.log('then');
})

console.log('console');
```

- 这段代码作为宏任务，进入主线程
- 先遇到 `setTimeout`，那么将其回调函数注册后分发到宏任务 `Event Queue`（注册过程与上同，下文不再描述）
- 接下来遇到了 `Promise`，`new Promise` 立即执行，`then` 函数分发到微任务 `Event Queue`
- 遇到 `console.log()`，立即执行
- 整体代码 `script` 作为第一个宏任务执行结束，看看有哪些微任务？我们发现了 `then` 在微任务 `Event Queue` 里面，执行
- 第一轮事件循环结束了，我们开始第二轮循环，当然要从宏任务 `Event Queue` 开始。我们发现了宏任务 `Event Queue` 中 `setTimeout` 对应的回调函数，立即执行
- 结束

这里插一句，`new Promise` 的执行器函数是**同步执行**的，所以 `promise` 这一行的输出在 `console` 之前。很多人会误以为 `new Promise` 整个都是异步的，实际上异步的只有 `.then` 里的回调。

事件循环、宏任务、微任务的关系如图所示：

![宏任务与微任务在事件循环中的关系图](https://s.poetries.top/gitee/20190922/event-loop-2.png)

### 3.1 关于任务分类，有三处要修正

原文那个分类是当年的通行说法，讲题够用，但有几处经不起追问。

**`process.nextTick` 不是微任务。** 它在 Node 里是一条独立的队列，优先级**高于** Promise 的微任务队列。每次同步代码跑完或者事件循环的每个阶段结束时，Node 会先把 `nextTick` 队列清空，然后才处理 Promise 微任务。这就是下面那道题里 `6` 排在 `8` 前面的原因，不是因为它们同队列先来后到，而是因为分属两条队列且 nextTick 优先。

**微任务不止 Promise。** `queueMicrotask()` 是标准 API，专门用来往微任务队列里塞回调，浏览器和 Node 都支持。另外 `MutationObserver` 的回调也是微任务，Vue 2 早期就是拿它做 `nextTick` 降级方案的。想手动排一个微任务，直接用 `queueMicrotask` 比 `Promise.resolve().then()` 语义清楚：

```js
queueMicrotask(() => {
  console.log('这行在当前同步代码跑完后立刻执行，早于任何 setTimeout')
})
```

**宏任务也不止定时器。** I/O 回调、`MessageChannel`、Node 的 `setImmediate`、以及 UI 事件回调都算任务。规范里其实有多个任务队列，浏览器可以按来源决定先取哪个，所以「一轮只执行一个宏任务」这个说法是简化过的。

### 3.2 微任务可以饿死主线程

有个反直觉的点。微任务队列不是「清空当前这一批」，是**一直清到空为止**，包括执行过程中新产生的微任务。所以下面这段会让页面彻底卡死：

```js
function loop() {
  Promise.resolve().then(loop)
}
loop()
```

每执行一个微任务又产生一个新的，队列永远不空，事件循环出不去，渲染和用户交互全部停摆。而同样的写法换成 `setTimeout` 递归就没事，因为每个宏任务之间事件循环有机会喘口气。

先说结论，**微任务适合做「同步代码结束后马上要做的收尾」，不适合做递归调度**。

## 四、一道经典题的完整推演

我们来分析一段较复杂的代码，看看你是否真的掌握了 js 的执行机制：

```js
console.log('1');

setTimeout(function() {
    console.log('2');
    process.nextTick(function() {
        console.log('3');
    })
    new Promise(function(resolve) {
        console.log('4');
        resolve();
    }).then(function() {
        console.log('5')
    })
})
process.nextTick(function() {
    console.log('6');
})
new Promise(function(resolve) {
    console.log('7');
    resolve();
}).then(function() {
    console.log('8')
})

setTimeout(function() {
    console.log('9');
    process.nextTick(function() {
        console.log('10');
    })
    new Promise(function(resolve) {
        console.log('11');
        resolve();
    }).then(function() {
        console.log('12')
    })
})
```

**第一轮事件循环流程分析如下**

- 整体 `script` 作为第一个宏任务进入主线程，遇到 `console.log`，输出 `1`
- 遇到 `setTimeout`，其回调函数被分发到宏任务 `Event Queue` 中，我们暂且记为 `setTimeout1`
- 遇到 `process.nextTick()`，其回调函数被分发到 nextTick 队列中，我们记为 `process1`
- 遇到 `Promise`，`new Promise` 直接执行，输出 `7`。`then` 被分发到微任务 `Event Queue` 中，我们记为 `then1`
- 又遇到了 `setTimeout`，其回调函数被分发到宏任务 `Event Queue` 中，我们记为 `setTimeout2`

|宏任务Event Queue|	微任务Event Queue|
|---|---|
|`setTimeout1`	|`process1`|
|`setTimeout2`	|`then1`|

- 上表是第一轮事件循环宏任务结束时各 `Event Queue` 的情况，此时已经输出了 `1` 和 `7`
- 我们发现了 `process1` 和 `then1` 两个待执行的回调
- 执行 `process1`，输出 `6`
- 执行 `then1`，输出 `8`

注意这一步 `6` 在 `8` 前面的真正原因是 nextTick 队列优先级高于 Promise 微任务队列，不是它先注册所以先执行。这两个回调根本不在同一条队列里，上表为了对齐原文放在了同一列，实际是两条独立的队列。

好了，第一轮事件循环正式结束，这一轮的结果是输出 `1，7，6，8`。那么第二轮事件循环从 `setTimeout1` 宏任务开始：

- 首先输出 `2`。接下来遇到了 `process.nextTick()`，同样将其分发到 nextTick 队列中，记为 `process2`。`new Promise` 立即执行输出 `4`，then 也分发到微任务 `Event Queue` 中，记为 `then2`

|宏任务Event Queue|	微任务Event Queue|
|---|---|
|`setTimeout2`|	`process2`|
||`then2`|

- 第二轮事件循环宏任务结束，我们发现有 `process2` 和 `then2` 两个回调可以执行
- 输出 `3`
- 输出 `5`
- 第二轮事件循环结束，第二轮输出 `2，4，3，5`
- 第三轮事件循环开始，此时只剩 `setTimeout2` 了，执行
- 直接输出 `9`
- 将 `process.nextTick()` 分发到 nextTick 队列中，记为 `process3`
- 直接执行 `new Promise`，输出 `11`
- 将 `then` 分发到微任务 `Event Queue` 中，记为 `then3`

|宏任务Event Queue|	微任务Event Queue|
|---|---|
||`process3`|
||`then3`|

- 第三轮事件循环宏任务执行结束，执行 `process3` 和 `then3`
- 输出 `10`
- 输出 `12`
- 第三轮事件循环结束，第三轮输出 `9，11，10，12`

整段代码共进行了三次事件循环，完整的输出为 `1，7，6，8，2，4，3，5，9，11，10，12`。

我把这段代码在 Node 22.23.1 上原样跑了一遍，输出确实是 `1,7,6,8,2,4,3,5,9,11,10,12`，和上面的推演完全一致。

### 4.1 这个答案在老版本 Node 上是不一样的

这里有个历史包袱值得知道。Node 10 及更早的版本里，同一个 timers 阶段中的多个到期定时器会被**连续执行完**，然后才统一清空微任务队列。所以同样这段代码，在 Node 10 上的输出是 `1,7,6,8,2,4,9,11,3,10,5,12`，`2` 和 `9` 是连着的。

Node 11 起对齐了浏览器的行为，改成每执行完一个宏任务就把微任务队列清空一次。今天的 Node 版本都是新行为，但如果你在老文章里看到不一样的答案，多半就是这个原因，不是别人写错了。

原文末尾那句「node 环境下的事件监听依赖 libuv 与前端环境不完全相同，输出顺序可能会有误差」，说的就是这件事。

## 五、浏览器和 Node 的事件循环差异

上面这道题混用了浏览器和 Node 的 API，实际写代码时要分清楚。

**浏览器这边模型很简单。** 取一个任务执行，执行完把微任务队列清空，然后判断要不要渲染，如此循环。所以微任务永远在下一次渲染之前跑完，这也是 `Promise.then` 里改 DOM 不会额外多一帧的原因。

**Node 这边分了六个阶段。** timers（`setTimeout` / `setInterval`）、pending callbacks、idle/prepare、poll（I/O）、check（`setImmediate`）、close callbacks。事件循环按顺序走过这些阶段，每个阶段有自己的回调队列。Node 11 之后，每执行完一个回调就会清空 nextTick 队列和微任务队列。

由此带来两个常被问的点。

`setTimeout(fn, 0)` 和 `setImmediate(fn)` 谁先？在主模块里写这两行，结果是**不确定的**，取决于进程启动到进入事件循环花了多久，跑十次可能两种顺序都出现。但在 I/O 回调内部写，`setImmediate` 一定先，因为 poll 阶段结束后紧接着就是 check 阶段，而 timers 阶段要等下一轮。

`process.nextTick` 和 `setImmediate` 这两个名字是反的。按字面意思，`nextTick` 该是下一轮，`setImmediate` 该是立刻，实际正好相反：`nextTick` 是当前操作结束后马上执行，`setImmediate` 是等到 check 阶段。Node 官方文档里也承认这是历史遗留的命名问题。我一开始也被这两个名字绕进去过。

浏览器里没有 `setImmediate`（只有旧版 IE 有过），也没有 `process.nextTick`，要排微任务就用 `queueMicrotask`。

## 六、微任务和渲染时机

再往前一步，讲讲这套机制对页面表现的影响。

浏览器的一帧里大致是这样的顺序：执行一个宏任务，清空微任务队列，然后如果到了渲染时机就执行 `requestAnimationFrame` 回调、计算样式和布局、绘制。所以有三条实用结论。

在 `Promise.then` 里改 DOM，和在同步代码里改，视觉上没有区别，因为它们都在同一次渲染之前完成。

`requestAnimationFrame` 不是定时器，别拿它做延时。它的回调在下一次绘制前执行，页面在后台标签页时会完全暂停。它适合做动画的每帧计算，不适合做业务逻辑的延后执行。

一个长任务（比如同步跑几百毫秒的计算）会把渲染和交互全卡住，因为事件循环走不到渲染那一步。拆长任务的常见手法是用 `setTimeout` 或者 `MessageChannel` 把工作切成小块，让出主线程；React 18 的并发渲染底层做的也是类似的事。

顺带一提，异步遍历里那些 `await` 的排队行为，和这里讲的微任务是同一套机制，我在 [await 在 forEach 中不生效](https://feinterview.poetries.top/blog/await-foreach) 那篇里从另一个角度讲过。

## 总结

**js 的异步**

JavaScript 是单线程的，不管是什么新框架新语法糖实现的所谓异步，最终都要落到这一条执行线程上排队。牢牢把握住单线程这点非常重要。但要区分清楚，单线程限制的是你写的代码，不限制宿主环境，网络请求和计时是浏览器或 Node 用别的线程在做。

**事件循环 Event Loop**

事件循环是 js 实现异步的方法，也是 js 的执行机制。同步任务走执行栈，异步任务的回调排进任务队列，栈空了就从队列里取下一个。

**宏任务和微任务**

每执行完一个宏任务，微任务队列会被清到空为止，包括执行过程中新产生的微任务，所以微任务递归会把页面卡死。`process.nextTick` 严格来说不是微任务，它在 Node 里是一条优先级更高的独立队列，这是那道经典题里 `6` 排在 `8` 前面的真正原因。要手动排微任务，用标准的 `queueMicrotask`。

**setTimeout 的三个坑**

第二个参数是最少延迟不是精确延迟；嵌套超过五层且时间小于 4ms 会被钳到 4ms；后台标签页里最小间隔会被限制到 1 秒以上，所以倒计时要用 `Date.now()` 算差值而不是累加。周期任务用 `setTimeout` 递归代替 `setInterval`，避免回调堆积。

**执行和运行的区别**

JavaScript 在不同的宿主环境下执行方式是不同的，浏览器一套，Node 一套，Node 还分六个阶段。而运行大多指解析引擎那一层，是统一的。同一段代码在浏览器和 Node 上输出不一致，多半是宿主环境差异，Node 11 前后的定时器行为变化就是个典型例子。

## 参考

- [Event loops - HTML Standard](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- [Timers - HTML Standard](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers)
- [The Node.js Event Loop, Timers, and process.nextTick()](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)
- [queueMicrotask - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/queueMicrotask)
- [In depth - Microtasks and the JavaScript runtime environment - MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth)
- [前端进阶之旅](https://interview.poetries.top)
