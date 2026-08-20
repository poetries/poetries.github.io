---
title: await 在 forEach 中不生效的原因与四种替代写法
date: 2019-09-01 16:20:43
description: 从 forEach 忽略回调返回值这个根因讲起，对比 for...of、Promise.all、for await...of、reduce 四种异步遍历写法的执行顺序、并发度和错误处理差异，并给出并发控制的实现。
tags:
  - JavaScript
  - async/await
  - Promise
  - 异步编程
categories: Front-End
---

在 `forEach` 的回调里写了 `await`，代码看着一点问题没有，跑起来顺序全乱，`end` 还跑到了所有结果前面。更糟的是它不报错，本地数据量小的时候甚至看不出异常，等到线上批量处理几百条数据才发现结果对不上。

这篇把这件事从根上讲一遍：为什么 `forEach` 接不住 `await`，四种替代写法各自的执行顺序和并发度是什么，错误处理上有什么区别，以及数据量大的时候怎么控制并发不把下游打挂。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `forEach` 里的 `await` 为什么不生效，根因是什么
- `for...of`、`Promise.all`、`for await...of`、`reduce` 四种写法的执行顺序对比
- 串行和并发怎么选，并发度失控会带来什么后果
- 四种写法在错误处理上的差异，哪种会静默吞掉异常
- 怎么手写一个带并发上限的批处理
- 有哪些 lint 规则能在写代码的时候就拦住这类问题

## 一、场景

```js
function test() {
	let arr = [3, 2, 1]
	arr.forEach(async item => {
		const res = await fetch(item)
		console.log(res)
	})
	console.log('end')
}

function fetch(x) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(x)
		}, 500 * x)
	})
}

test()
```

期望的打印顺序是：

```
3
2
1
end
```

结果打印顺序居然是：

```
end
1
2
3
```

两处对不上。`end` 跑到了最前面，而三个结果的顺序按耗时从短到长排列，和数组里的顺序没关系。

**原因**

`forEach` 只支持同步代码，它并不会去处理异步的情况。

## 二、根因，forEach 把回调的返回值丢掉了

先说结论：`forEach` 不是「不支持 await」，是它压根不看回调返回了什么。

`async` 函数被调用时会立即返回一个 Promise，函数体执行到第一个 `await` 就挂起，把控制权交回去。所以上面那段代码的真实执行过程是这样：

`forEach` 依次调用三次回调，每次调用都拿到一个 pending 的 Promise，然后**直接扔掉**，接着调下一次。三次调完，`forEach` 返回 `undefined`，同步执行 `console.log('end')`。这时候三个 `setTimeout` 都已经在跑了，各自到点了才 resolve，所以 500ms 的先打、1500ms 的最后打。

规范里 `Array.prototype.forEach` 的定义就是一个纯粹的 for 循环加 `Call(callbackfn, ...)`，调用结果没有任何地方被使用。你可以理解成它长这样：

```js
Array.prototype.myForEach = function (cb, thisArg) {
  for (let i = 0; i < this.length; i++) {
    if (i in this) {
      cb.call(thisArg, this[i], i, this)  // 返回值丢弃
    }
  }
}
```

`map` 就不一样，它会把每次调用的返回值收集进新数组。这个差别正是下面第一种解法能成立的原因。

顺带说一句，这个坑不止 `forEach` 有。`filter`、`some`、`every`、`sort` 的回调传 `async` 函数一样出问题，而且更隐蔽：`filter(async x => ...)` 的回调永远返回一个 Promise 对象，Promise 对象恒为真值，所以过滤条件永远成立，一条都不会被过滤掉。这个我踩过，排查了半天才反应过来问题出在 `async` 上。

## 三、解决办法

### 3.1 第一种是使用 Promise.all 的方式

```js
async function test() {
	let arr = [3, 2, 1]
	await Promise.all(
		arr.map(async item => {
			const res = await fetch(item)
			console.log(res)
		})
	)
	console.log('end')
}
```

这样可以生效的原因是 `async` 函数肯定会返回一个 `Promise` 对象，调用 `map` 以后返回值就是一个存放了 `Promise` 的数组，把这个数组传入 `Promise.all` 就能等它们全部结束。

但这种方式并不能达成我们要的效果。它保证的是「`end` 一定在所有请求完成之后打印」，不保证三个结果之间的顺序。三个 `fetch` 是同时发出去的，谁先回来谁先打印，所以还是 1、2、3。

如果你要的是结果数组有序，那 `Promise.all` 反而是最合适的，因为它的 `resolve` 值严格按传入顺序排列，和完成先后无关：

```js
const results = await Promise.all(arr.map(item => fetch(item)))
// results 一定是 [3, 2, 1] 对应的结果，顺序不会乱
```

分清楚两件事：**执行是并发的，结果是有序的**。很多人把这两个混在一起想，才觉得 `Promise.all` 的行为反直觉。

如果你希望内部的 `fetch` 是顺序完成的，可以选择第二种方式。

### 3.2 另一种方法是使用 for...of

```js
async function test() {
	let arr = [3, 2, 1]
	for (const item of arr) {
		const res = await fetch(item)
		console.log(res)
	}
	console.log('end')
}
```

- 这种方式相比 `Promise.all` 要简洁得多，并且可以实现开头我想要的输出顺序
- 但这时候你是否又多了一个疑问？为啥 `for...of` 内部就能让 `await` 生效呢
- 因为 `for...of` 内部处理的机制和 `forEach` 不同，`forEach` 是直接调用回调函数，`for...of` 是通过迭代器的方式去遍历

```js
async function test() {
	let arr = [3, 2, 1]
	const iterator = arr[Symbol.iterator]()
	let res = iterator.next()
	while (!res.done) {
		const value = res.value
		const res1 = await fetch(value)
		console.log(res1)
		res = iterator.next()
	}
	console.log('end')
}
```

以上代码等价于 `for...of`，可以看成 `for...of` 是以上代码的语法糖。

关键在于 `await` 现在写在**当前这个 async 函数体内**，而不是写在另一个回调函数里。`await` 只能挂起它所在的那个 async 函数，`forEach` 的回调是一个独立的 async 函数，挂起的是回调自己，外层的 `forEach` 循环该转还是转。`for...of` 展开成 while 循环之后，`await` 挂起的是 `test` 本身，所以整个循环都停下来等。

这条规则同样适用于 `for` 和 `while`。用 `for...of` 只是因为它写起来最顺手，普通 `for (let i = 0; ...)` 里 `await` 一样能生效。

### 3.3 for await...of，用来处理异步迭代源

`for await...of` 是 ES2018 加的，它和 `for...of` 的区别在于会对每次迭代拿到的值做一次 `await`：

```js
async function test() {
  const arr = [3, 2, 1]
  for await (const res of arr.map(item => fetch(item))) {
    console.log(res)
  }
  console.log('end')
}
```

这段的输出是 3、2、1、end，有序。但要看清楚一个细节：`arr.map(...)` 在进入循环之前就把三个 Promise 全部创建好了，也就是**三个请求是同时发出去的**，`for await...of` 只是按顺序去取结果。它和 `for...of` + `await` 的行为不一样，后者是发完一个等一个再发下一个。

需要串行发请求就用 `for...of`，需要并发发但要按顺序消费结果就用 `for await...of`。

它真正不可替代的场景是异步迭代器，比如读 Node 的可读流、消费分页接口、处理 `ReadableStream`：

```js
// Node 里逐行读大文件，内存占用恒定
for await (const line of rl) {
  await handle(line)
}
```

这类源的数据是一批批到的，总量事先不知道，没法先 `map` 成数组再 `Promise.all`。

### 3.4 reduce 串起来的写法

还有一种写法，用 `reduce` 把 Promise 串成一条链：

```js
await arr.reduce(async (prev, item) => {
  await prev
  const res = await fetch(item)
  console.log(res)
}, Promise.resolve())
```

效果和 `for...of` 一样是串行的。我把它列出来主要是因为面试里会问，实际项目里我不建议用，因为 `await prev` 这一行漏掉就静默变成并发，而且出错时的调用栈比 `for...of` 难看得多。能用 `for...of` 就用 `for...of`。

## 四、并发度控制

上面两个极端各有各的问题。`for...of` 串行最安全，但一百条数据就是一百个来回，慢得没法接受；`Promise.all` 全并发最快，但一百条数据同时打过去，下游接口大概率给你限流或者直接 502。

实际项目里要的是中间态，比如「同时最多跑 5 个」。生产上我一般直接用 `p-limit` 这个包：

```js
import pLimit from 'p-limit'

const limit = pLimit(5)
const results = await Promise.all(
  arr.map(item => limit(() => fetch(item)))
)
```

不想引依赖的话，手写一个 worker pool 也就十几行。思路是开固定数量的「工人」，每个工人从共享游标取下一个任务，取完为止：

```js
async function mapWithLimit(list, limit, fn) {
  const results = new Array(list.length)
  let cursor = 0

  async function worker() {
    while (cursor < list.length) {
      const i = cursor++          // 取任务并占位
      results[i] = await fn(list[i], i)
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, list.length) },
    () => worker()
  )
  await Promise.all(workers)
  return results
}
```

用起来是这样：

```js
const results = await mapWithLimit(arr, 5, item => fetch(item))
```

`cursor++` 这一步是原子的，因为 JavaScript 单线程，两次 `await` 之间的同步代码不会被打断，所以不存在两个工人拿到同一个下标的情况。这个和事件循环的执行机制是同一件事，我在 [彻底弄懂 JavaScript 执行机制](https://feinterview.poetries.top/blog/JavaScript-event-loop) 那篇里讲过任务是怎么排队的。

并发数选多少没有标准答案。我的经验是先问下游接口的限流阈值，没有明确阈值就从 3 到 5 开始试，观察错误率和 P99 耗时，别一上来就开 50。

## 五、错误处理，四种写法差别最大的地方

这块比执行顺序更容易出事，因为错误处理的差异是静默的。

**`forEach` + async 是最糟的。** 回调抛出的错误变成一个 rejected Promise，而 `forEach` 把它丢掉了，没人 catch，直接触发 `unhandledRejection`。浏览器里表现为控制台一条 warning，Node 从 15 起默认会让进程崩溃。外层的 `try/catch` 完全接不住，因为错误是在 `forEach` 返回之后才发生的。

**`for...of` + `await` 最符合直觉。** 抛错就中断循环，向外冒泡，外层 `try/catch` 能接住，后面的任务不再执行。想让单条失败不影响整体，就在循环体里单独 try：

```js
for (const item of arr) {
  try {
    await fetch(item)
  } catch (e) {
    console.error('这条挂了，继续下一条', item, e)
  }
}
```

**`Promise.all` 是快速失败。** 任意一个 reject，整个 `Promise.all` 立刻 reject，只把第一个错误抛出来。这里有两个容易误解的地方。一是其余任务**不会被取消**，它们还在跑，只是结果没人要了。二是其余任务后来的 reject 不会触发 `unhandledRejection`，因为 `Promise.all` 内部已经给每个 Promise 都挂了处理函数。我在 Node 22 上验证过这一点，控制台确实是干净的。

想拿到全部结果、包括失败的那些，用 `Promise.allSettled`：

```js
const settled = await Promise.allSettled(arr.map(item => fetch(item)))
const ok = settled.filter(r => r.status === 'fulfilled').map(r => r.value)
const failed = settled.filter(r => r.status === 'rejected')
```

批量导入、批量推送这类场景基本都该用 `allSettled`，因为你需要的是「哪几条失败了」，而不是「第一条失败是什么」。

## 六、怎么选

| 写法 | 执行方式 | 结果顺序 | 出错行为 | 适合场景 |
|------|----------|----------|----------|----------|
| `forEach` + async | 并发，且不可等待 | 不可控 | 静默，触发 unhandledRejection | 别用 |
| `for...of` + await | 串行 | 有序 | 中断循环，可 catch | 有前后依赖、需要限速、逐条重试 |
| `map` + `Promise.all` | 全并发 | 有序 | 快速失败，其余继续跑 | 任务独立、数量可控、要全部成功 |
| `map` + `Promise.allSettled` | 全并发 | 有序 | 全部返回，逐条看状态 | 批量操作，允许部分失败 |
| `for await...of` | 取决于迭代源 | 有序 | 中断循环，可 catch | 流、分页、异步迭代器 |
| 并发池 | 受控并发 | 有序 | 按池实现而定 | 数据量大、下游有限流 |

有两条 lint 规则能在写代码的时候就把问题拦下来。TypeScript 项目开 `@typescript-eslint/no-misused-promises`，它会盯住「把返回 Promise 的函数传给期望返回 void 的参数」这种情况，`forEach(async ...)` 正好命中。另外 `no-await-in-loop` 会提示循环里的 `await` 可能是性能问题，这条要按场景判断，串行是刻意为之的时候直接禁用它就行。

## 总结

`forEach` 里的 `await` 不生效，根因不在 `await` 而在 `forEach`。它调用回调之后不看返回值，async 回调返回的那个 Promise 被直接丢掉了，循环该转还是转。`filter`、`some`、`every` 也有同样的问题，其中 `filter` 最坑，因为 Promise 恒为真值，条件永远成立。

替代写法按需求选。要串行、要前后依赖、要限速就用 `for...of` 加 `await`，`await` 挂起的是外层函数本身，循环才会真的停下来。要并发就用 `map` 加 `Promise.all`，记住它的执行是并发的但结果数组是有序的，这两件事别混。允许部分失败就换 `Promise.allSettled`。数据源是流或者分页接口，总量事先不知道，那就得用 `for await...of`。

错误处理上差别最大。`forEach` 的异常没人接，会变成 unhandledRejection，Node 15 起默认让进程退出；`for...of` 直接中断循环并向外冒泡；`Promise.all` 快速失败但其余任务还在跑，只是结果没人要，而且不会额外报 unhandledRejection。

数据量一大就别在串行和全并发之间二选一，加个并发池。用 `p-limit` 或者自己写十几行的 worker pool 都行，并发数从 3 到 5 起步，看着错误率和 P99 调。

## 参考

- [Array.prototype.forEach - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
- [for await...of - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/for-await...of)
- [Promise.all - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
- [Promise.allSettled - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
- [no-misused-promises - typescript-eslint](https://typescript-eslint.io/rules/no-misused-promises/)
- [p-limit](https://github.com/sindresorhus/p-limit)
- [前端进阶之旅](https://interview.poetries.top)
