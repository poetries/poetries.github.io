---
title: Promise.all、race、allSettled、any 四个组合方法怎么选
description: 从 Promise.all 的短路失败讲到 race 的赛跑语义，再补上 allSettled 和 any 两个后来标准化的方法，给出四个组合 API 在真实业务场景下的选型判断标准。
date: 2018-12-05 10:50:20
tags:
  - Promise
  - ES6
  - JavaScript
  - 异步编程
categories: Front-End
---

一个页面上要同时拉用户信息、权限列表、消息未读数三个接口，全部回来才能渲染。这时候大部分人会条件反射地写 `Promise.all`。等到线上跑了两周，消息未读数那个接口偶发超时，整个页面直接白屏，才发现 `all` 有一条你可能没细想过的规则：只要有一个失败，剩下的结果全都拿不到。

`Promise` 提供的这几个组合方法，长得都差不多，都是「一堆 Promise 进去，一个 Promise 出来」，区别全在于「什么时候算完成」和「失败了怎么办」这两条规则上。选错了不会报错，只会在某个边界情况下静悄悄地表现得不符合预期。这篇把 `all`、`race`、`allSettled`、`any` 四个方法的规则摆到一起对比，给一个能直接照着用的选型标准。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `Promise.all` 的结果顺序为什么和请求完成顺序无关
- 短路失败带来的三个真实问题，以及绕开的办法
- `Promise.race` 的赛跑语义，用它做超时控制的完整写法
- `Promise.allSettled` 和 `Promise.any` 各自补上了哪块空白
- 四个方法的对照表和选型判断标准

## 一、Promise.all

`Promise.all` 可以将多个 `Promise` 实例包装成一个新的 `Promise` 实例。成功和失败的返回值是不同的：成功的时候返回的是一个结果数组，失败的时候返回的是最先被 `reject` 的那个失败状态的值。

```js
let p1 = new Promise((resolve, reject) => {
  resolve('成功了')
})

let p2 = new Promise((resolve, reject) => {
  resolve('success')
})

let p3 = Promise.reject('失败')

Promise.all([p1, p2]).then((result) => {
  console.log(result)               // ['成功了', 'success']
}).catch((error) => {
  console.log(error)
})

Promise.all([p1, p3, p2]).then((result) => {
  console.log(result)
}).catch((error) => {
  console.log(error)      // 失败了，打出 '失败'
})
```

原文这里写的是 `Promse.reject`，少了一个字母 `i`，直接就是 `Promse is not defined`，上面已经改正。

`Promise.all` 在处理多个异步操作时非常有用，比如说一个页面上需要等两个或多个 `ajax` 的数据回来以后才正常显示，在此之前只显示 `loading` 图标。

### 1.1 结果顺序和完成顺序无关

这是 `all` 最值得单独拿出来说的一条规则。

`Promise.all` 里的任务列表 `[asyncTask(1), asyncTask(2), asyncTask(3)]`，我们是按照顺序发起的。但根据结果来说，它们是异步的，互相之间并不阻塞，每个任务完成时机是不确定的。尽管如此，所有任务结束之后，它们的结果仍然是**按传入顺序**映射到结果数组里的，和数组下标一一对应。

这带来了一个很大的好处：在前端开发请求数据的过程中，偶尔会遇到发送多个请求并根据请求顺序获取和使用数据的场景，使用 `Promise.all` 可以直接解决这个问题，不用自己维护一个「第几个请求回来了」的计数器。

```js
const ids = [2, 3, 5, 7, 11];
const users = await Promise.all(ids.map(id => fetchUser(id)));
// users[0] 一定是 id=2 的那个人，哪怕它最后一个回来
```

要是没有这条规则，你就得给每个请求带上 id，回来之后再自己排一遍序。这个设计是真的舒服。

### 1.2 短路失败的三个代价

回到开头那个白屏的问题。`Promise.all` 的失败规则是「有一个 reject，整体立刻 reject」，这一条会带来三个连锁反应。

**第一，成功的结果全丢了。** 三个接口两个成功一个失败，`catch` 里只能拿到失败那个的原因，另外两个已经拿回来的数据你一点都摸不到。页面本来可以只降级一小块，结果只能整个白掉。

**第二，剩下的请求不会被取消。** `all` 只是不再等它们了，请求本身该发还是发，该跑还是跑。Promise 天生就没有取消机制，想真的中断得配合 `AbortController`。

**第三，未处理的 rejection 可能报警告。** 如果后面还有别的 Promise 也失败了，而 `all` 返回的那个 Promise 已经 settle 了，这些迟到的失败就没人接。浏览器会触发 `unhandledrejection`，Node 里更严格，某些版本会直接让进程退出。

绕开的办法有两个。老写法是给每个 Promise 自己挂一个 `catch`，把失败转成一个标记值，这样 `all` 眼里全是成功：

```js
const safe = p => p.then(
  value => ({ ok: true, value }),
  reason => ({ ok: false, reason })
);

const results = await Promise.all([a, b, c].map(safe));
// 每一项都能拿到，自己判断 ok
```

这套写法在 2018 年前后是标准操作，很多项目里都能翻到类似的工具函数。后来标准直接把它内置了，就是下面要讲的 `Promise.allSettled`。

### 1.3 参数不一定是数组

`Promise.all` 的参数不一定是数组，任何**可迭代对象**都行，Set、Map 的 `values()`、生成器都可以。数组里的成员也不一定非得是 Promise，非 Promise 的值会被 `Promise.resolve` 包一层，直接当成已完成处理。

```js
Promise.all([1, Promise.resolve(2), 'three'])
  .then(r => console.log(r)); // [1, 2, 'three']
```

这个特性在写通用工具函数时很好用，调用方传什么进来都不用管，一律扔给 `all`。

## 二、Promise.race

`Promise.race([p1, p2, p3])` 里面哪个结果来得快，就返回哪个结果，**不管这个结果本身是成功还是失败**。

后半句是重点。很多人以为 `race` 是「取最快成功的那个」，其实不是，它取的是最快 settle 的那个，失败也算数。

先看一个都成功的例子，返回结果为 3，因为第三个 `Promise` 的定时器最短：

```js
Promise.race([
  new Promise(function(resolve, reject) {
    setTimeout(() => resolve(1), 1000)
  }),
  new Promise(function(resolve, reject) {
    setTimeout(() => resolve(2), 100)
  }),
  new Promise(function(resolve, reject) {
    setTimeout(() => resolve(3), 10)
  })
]).then(value => {
  console.log(value) // 3
})
```

再看一个快的那个是失败的例子：

```js
let p1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('success')
  }, 1000)
})

let p2 = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject('failed')
  }, 500)
})

Promise.race([p1, p2]).then((result) => {
  console.log(result)
}).catch((error) => {
  console.log(error)  // 打印的是 'failed'
})
```

`p2` 在 500ms 时失败，`p1` 在 1000ms 时才成功。`race` 在 500ms 就已经 settle 成 rejected 了，后面 `p1` 的成功没人再关心。

### 2.1 用 race 做超时控制

`race` 最经典的用途就是给一个没有超时机制的操作加上超时。思路是让真实请求和一个定时炸弹赛跑，谁先到算谁的。

```js
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`请求超时 ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]);
}

// 用法
withTimeout(fetch('/api/user'), 3000)
  .then(res => res.json())
  .catch(err => console.log(err.message));
```

这里有个坑我踩过。上面这个 `timeout` 里的 `setTimeout` 不会因为比赛结束就自动清掉，请求 100ms 就回来了，那个 3000ms 的定时器还是会老老实实跑完再触发一次 `reject`，只是没人理它。单次调用无所谓，如果这个函数在列表里被调几百次，就会有几百个悬着的定时器占着内存。稳妥的写法是在 `finally` 里 `clearTimeout`：

```js
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`请求超时 ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
```

同样要提醒的是，超时了不等于请求被取消了，后端该收到的还是会收到。真要中断得用 `AbortController` 配合 `fetch` 的 `signal`。

顺带一提，如果 `race` 传进去的是空数组，返回的 Promise 会永远保持 pending，因为没有任何一个选手会冲线。这个行为不报错，只会让你的 `await` 卡在那里，排查起来相当费劲。

## 三、后来补上的两个方法

原文写于 2018 年，那时候标准里只有 `all` 和 `race`。后面 TC39 又补了两个方法，正好填上了前面提到的两块空白。这两个方法都是 2018 年之后才进入标准的，具体的规范版本以 TC39 提案仓库和 MDN 为准，我这里只讲行为。

### 3.1 Promise.allSettled

`allSettled` 等所有 Promise 都 settle（不管成功还是失败）才结束，而且**永远不会 reject**。结果是一个对象数组，每一项要么是 `{ status: 'fulfilled', value }`，要么是 `{ status: 'rejected', reason }`。

```js
const results = await Promise.allSettled([
  fetch('/api/user'),
  fetch('/api/permission'),
  fetch('/api/unread'),
]);

results.forEach((r, i) => {
  if (r.status === 'fulfilled') {
    render(i, r.value);
  } else {
    renderFallback(i, r.reason);
  }
});
```

对照 1.2 节那个手写的 `safe` 包装函数，`allSettled` 做的就是同一件事，只不过是引擎内置的。开头那个白屏场景，换成 `allSettled` 之后，未读数接口挂了就只有那个角标不显示，用户信息和权限该渲染照样渲染。

判断标准很直接：**你关心的是「全部结果」还是「全部成功」**。要全部结果、允许部分失败，用 `allSettled`；缺一个就没法往下走，用 `all`。

### 3.2 Promise.any

`any` 是 `all` 在逻辑上的镜像。`all` 是「全成功才成功，一个失败就失败」，`any` 是「一个成功就成功，全失败才失败」。

```js
const fastest = await Promise.any([
  fetch('https://cdn-a.example.com/lib.js'),
  fetch('https://cdn-b.example.com/lib.js'),
  fetch('https://cdn-c.example.com/lib.js'),
]);
```

三个 CDN 谁先给出成功响应就用谁的，某个节点挂了不影响。这就是 `race` 做不到的地方，`race` 遇到最快的那个失败就直接失败了，`any` 会跳过失败继续等。

全部失败时，`any` 抛出的是一个 `AggregateError`，它的 `errors` 属性里装着所有失败原因：

```js
try {
  await Promise.any([Promise.reject('a'), Promise.reject('b')]);
} catch (e) {
  console.log(e instanceof AggregateError); // true
  console.log(e.errors);                    // ['a', 'b']
}
```

这个 `AggregateError` 是跟着 `any` 一起进标准的新错误类型，老环境里可能没有，用之前先确认目标浏览器和 Node 版本，以 MDN 的兼容性表为准。

## 四、四个方法对照与选型

把规则并排放在一起，差别就一目了然了。

| 方法 | 什么时候 fulfilled | 什么时候 rejected | 结果形态 |
|------|-------------------|------------------|----------|
| `all` | 全部成功 | 任意一个失败，立刻 | 结果数组，顺序同输入 |
| `race` | 最快 settle 的是成功 | 最快 settle 的是失败 | 单个值 |
| `allSettled` | 全部 settle，永远成功 | 不会 reject | 状态对象数组 |
| `any` | 任意一个成功，立刻 | 全部失败 | 单个值，失败时抛 AggregateError |

选的时候按这个顺序问自己：

需要全部结果吗？需要的话，缺一不可就用 `all`，允许部分失败就用 `allSettled`。

只需要一个结果吗？只要最快返回的、失败也认，用 `race`（典型场景是超时控制）；要最快成功的、失败就换下一个，用 `any`（典型场景是多源容灾）。

还有一类需求这四个都盖不住，就是**并发数限制**。一次要发一百个请求，全丢给 `Promise.all` 会瞬间打满浏览器的并发连接数，甚至被后端限流。这种得自己写一个并发池，或者用 `p-limit` 这类库，控制同时在飞的请求不超过 N 个。这块标准目前没有内置方案。

这些组合方法之所以能这么组合，前提是 Promise 本身有一套严格的状态机和 thenable 吸收规则。想知道 `all` 内部是怎么计数、`resolve` 传进去一个 Promise 时又发生了什么，可以看 [浅析 Promise 原理与手写实现](https://feinterview.poetries.top/blog/promise-anaylse)，那篇从零把这几个静态方法都写了一遍。日常业务里这些组合方法最常见的搭档是 `await`，用法和坑在 [ES6系列之 async/await 的用法与实现原理](https://feinterview.poetries.top/blog/es6-async) 里有展开。

## 总结

这四个方法的差别，全在「什么时候算完成」和「失败怎么处理」两条规则上。

`all` 是最常用也最容易用错的一个。它的结果按输入顺序排列，这一点很好用；但它短路失败，一个挂了全部作废，成功的结果一并丢掉，剩下的请求也不会取消。凡是「部分失败可以接受」的场景，都该换成 `allSettled`。

`race` 取的是最快 settle 的那个，成功失败都算。拿它做超时控制的时候记得清定时器，否则会留一堆悬着的 timer。传空数组会永远 pending，这个坑不报错但很难查。

`any` 是「最快成功」，专治多源容灾，全失败时抛的是 `AggregateError`。

超出这四个方法的需求主要是并发数限制，标准没提供，得自己写池子或者用现成的库。

## 参考

- [MDN Promise.all](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
- [MDN Promise.race](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)
- [MDN Promise.allSettled](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
- [MDN Promise.any](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/any)
- [MDN AbortController](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortController)
- [前端进阶之旅](https://interview.poetries.top)
