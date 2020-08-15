---
title: JavaScript运行机制Event Loop
date: 2018-12-21 23:20:54
tags: 
  - JavaScript
  - Event Loop
categories: Front-End
---

## 一、JavaScript是单线程

- `JavaScript`语言的一大特点就是单线程，也就是说，同一个时间只能做一件事
- 假定`JavaScript`同时有两个线程，一个线程在某个`DOM`节点上添加内容，另一个线程删除了这个节点，这时浏览器应该以哪个线程为准？
- 所以，为了避免复杂性，从一诞生，`JavaScript`就是单线程，这已经成了这门语言的核心特征，将来也不会改变
- 为了利用多核`CPU`的计算能力，`HTML5`提出`Web Worker`标准，允许`JavaScript`脚本创建多个线程，但是子线程完全受主线程控制，且不得操作`DOM`。所以，这个新标准并没有改变`JavaScript`单线程的本质。

## 二、任务队列

- 单线程就意味着，所有任务需要排队，前一个任务结束，才会执行后一个任务。如果前一个任务耗时很长，后一个任务就不得不一直等着
- 如果排队是因为计算量大，CPU忙不过来，倒也算了，但是很多时候CPU是闲着的，因为IO设备（输入输出设备）很慢（比如Ajax操作从网络读取数据），不得不等着结果出来，再往下执行

> 所有任务可以分成两种，一种是同步任务（synchronous），另一种是异步任务（asynchronous）

- 同步任务指的是，在主线程上排队执行的任务，只有前一个任务执行完毕，才能执行后一个任务
- 异步任务指的是，不进入主线程、而进入"任务队列"（`task queue`）的任务，只有"任务队列"通知主线程，某个异步任务可以执行了，该任务才会进入主线程执行

**异步执行的运行机制**

- 所有同步任务都在主线程上执行，形成一个执行栈
- 主线程之外，还存在一个"任务队列"（`task queue`）。只要异步任务有了运行结果，就在"任务队列"之中放置一个事件
- 一旦"执行栈"中的所有同步任务执行完毕，系统就会读取"任务队列"，看看里面有哪些事件。那些对应的异步任务，于是结束等待状态，进入执行栈，开始执行
- 主线程不断重复上面的第三步

主线程和任务队列的示意图

![](https://poetries1.gitee.io/img-repo/2019/10/316.png)

> 只要主线程空了，就会去读取"任务队列"，这就是`JavaScript`的运行机制。这个过程会不断重复

## 三、事件和回调函数

- "任务队列"是一个事件的队列（也可以理解成消息的队列），IO设备完成一项任务，就在"任务队列"中添加一个事件，表示相关的异步任务可以进入"执行栈"了。主线程读取"任务队列"，就是读取里面有哪些事件。
- "任务队列"中的事件，除了IO设备的事件以外，还包括一些用户产生的事件（比如鼠标点击、页面滚动等等）。只要指定过回调函数，这些事件发生时就会进入"任务队列"，等待主线程读取。
- 所谓"回调函数"（callback），就是那些会被主线程挂起来的代码。异步任务必须指定回调函数，当主线程开始执行异步任务，就是执行对应的回调函数。
- "任务队列"是一个先进先出的数据结构，排在前面的事件，优先被主线程读取。主线程的读取过程基本上是自动的，只要执行栈一清空，"任务队列"上第一位的事件就自动进入主线程。但是，由于存在后文提到的"定时器"功能，主线程首先要检查一下执行时间，某些事件只有到了规定的时间，才能返回主线程。

## 四、JS中的event loop

### 4.1 原理分析

> 主线程从"任务队列"中读取事件，这个过程是循环不断的，所以整个的这种运行机制又称为Event Loop（事件循环）

![](https://poetries1.gitee.io/img-repo/2019/10/317.png)

> 上图中，主线程运行的时候，产生堆（heap）和栈（stack），栈中的代码调用各种外部API，它们在"任务队列"中加入各种事件（click，load，done）。只要栈中的代码执行完毕，主线程就会去读取"任务队列"，依次执行那些事件所对应的回调函数

- `JS` 在执行的过程中会产生执行环境，这些执行环境会被顺序的加入到执行栈中。如果遇到异步的代码，会被挂起并加入到 `Task`（有多种 `task`） 队列中。一旦执行栈为空，`Event Loop` 就会从 `Task` 队列中拿出需要执行的代码并放入执行栈中执行，所以本质上来说 JS 中的异步还是同步行为

```js
console.log('script start');

setTimeout(function() {
  console.log('setTimeout');
}, 0);

console.log('script end');
```

> 不同的任务源会被分配到不同的 `Task` 队列中，任务源可以分为 微任务（`microtask`） 和 宏任务（`macrotask`）。在 `ES6` 规范中，`microtask `称为 `jobs`，`macrotask` 称为 `task`

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

> 以上代码虽然 `setTimeout `写在 `Promise` 之前，但是因为 `Promise `属于微任务而 `setTimeout` 属于宏任务

### 4.2 微任务

- `process.nextTick`
- `promise`
- `Object.observe`
- `MutationObserver`

### 4.3 宏任务

- `script`
- `setTimeout`
- `setInterval`
- `setImmediate`
- `I/O`
- `UI rendering`

> 宏任务中包括了 `script` ，浏览器会先执行一个宏任务，接下来有异步代码的话就先执行微任务

### 4.4 正确的Event loop 顺序

- 执行同步代码，这属于宏任务
- 执行栈为空，查询是否有微任务需要执行
- 执行所有微任务
- 必要的话渲染 `UI`
- 然后开始下一轮 `Event loop`，执行宏任务中的异步代码

> 通过上述的 `Event loop` 顺序可知，如果宏任务中的异步代码有大量的计算并且需要操作 `DOM` 的话，为了更快的响应界面响应，我们可以把操作 `DOM` 放入微任务中

## 五、Node 中的 Event loop

- `Node.js`也是单线程的`Event Loop`，但是它的运行机制不同于浏览器环境
- `Node` 的 `Event loop` 分为`6`个阶段，它们会按照顺序反复运行

![](https://poetries1.gitee.io/img-repo/2019/10/318.png)

### 5.1 Node.js的运行机制

- `V8`引擎解析`JavaScript`脚本
- 解析后的代码，调用`Node API`
- `libuv`库负责`Node API`的执行。它将不同的任务分配给不同的线程，形成一个`Event Loop`（事件循环），以异步的方式将任务的执行结果返回给V8引擎
- `V8`引擎再将结果返回给用户

> 除了`setTimeout`和`setInterval`这两个方法，`Node.js`还提供了另外两个与"任务队列"有关的方法：`process.nextTick`和s`etImmediate`。它们可以帮助我们加深对"任务队列"的理解

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

- `timers` 阶段会执行 `setTimeout` 和 `setInterval`
- 一个 `timer` 指定的时间并不是准确时间，而是在达到这个时间后尽快执行回调，可能会因为系统正在执行别的事务而延迟
- 下限的时间有一个范围：`[1, 2147483647]` ，如果设定的时间不在这个范围，将被设置为`1`。

#### 5.2.2 I/O

> `I/O` 阶段会执行除了 `close` 事件，定时器和 `setImmediate` 的回调

#### 5.2.3 idle, prepare

> `idle`, `prepare` 阶段内部实现

#### 5.2.4 poll

> `poll` 阶段很重要，这一阶段中，系统会做两件事情

- 执行到点的定时器
- 执行 `poll` 队列中的事件

> 并且当 poll 中没有定时器的情况下，会发现以下两件事情

- 如果 `poll` 队列不为空，会遍历回调队列并同步执行，直到队列为空或者系统限制
- 如果 `poll` 队列为空，会有两件事发生
  - 如果有 `setImmediate` 需要执行，`poll` 阶段会停止并且进入到 `check` 阶段执行 `setImmediate`
  - 如果没有 `setImmediate` 需要执行，会等待回调被加入到队列中并立即执行回调
- 如果有别的定时器需要被执行，会回到 `timer` 阶段执行回调

#### 5.2.5 check

> `check` 阶段执行 `setImmediate`

#### 5.2.6 close callbacks

- `close callbacks` 阶段执行 `close` 事件
- 并且在 `Node` 中，有些情况下的定时器执行顺序是随机的

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

> 当然在这种情况下，执行顺序是相同的

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

> 上面介绍的都是` macrotask` 的执行情况，`microtask` 会在以上每个阶段完成后立即执行。

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

> `Node` 中的 `process.nextTick` 会先于其他 `microtask` 执行。

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

## 六、参考

- [JavaScript 运行机制详解：再谈Event Loop](http://www.ruanyifeng.com/blog/2014/10/event-loop.html)
