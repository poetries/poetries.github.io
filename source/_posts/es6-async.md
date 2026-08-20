---
title: ES6系列之async await的用法与实现原理
description: async 函数为什么被称为 Generator 的语法糖，await 的四种错误处理写法怎么选，多个请求什么时候该并发，以及内部执行器 spawn 是如何把生成器自动跑完的。
date: 2018-12-21 16:50:43
tags:
  - JavaScript
  - ES6
  - async
  - 异步编程
categories: Front-End
---

`async/await` 大概是 ES2017 里最没有学习门槛的特性，看一眼就会用。但真正上手写业务，坑集中在两个地方：一个是错误处理，一个 `try...catch` 到底该包多大范围，包小了漏，包大了整个函数糊成一团；另一个是并发，三个互不相干的请求被顺手写成三行 `await`，页面白屏时间直接翻三倍。

这篇把 `async` 的语法规则捋一遍，重点讲清楚 `await` 遇到 reject 时的四种处理方式各自适用什么场景，以及什么时候该把 `await` 换成 `Promise.all`。最后拆开它的实现原理，看看引擎内部那个自动执行器长什么样。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `async` 函数相对 Generator 改进的四个点
- `async` 函数的五种书写形式
- 返回值与状态变化的规则，什么时候 `then` 才会触发
- `await` 后面跟非 Promise、跟 thenable 对象时的行为
- 四种错误处理写法的取舍
- 继发与并发的判断标准，以及 `forEach` 里 `await` 为什么不行
- 实现原理：`spawn` 执行器逐行拆解

## 一、含义

`async` 函数是什么？一句话，它就是 `Generator` 函数的语法糖。

先看一个用 `Generator` 依次读取两个文件的例子：

```js
// 有一个 Generator 函数，依次读取两个文件
const fs = require('fs');

const readFile = function (fileName) {
  return new Promise(function (resolve, reject) {
    fs.readFile(fileName, function(error, data) {
      if (error) return reject(error);
      resolve(data);
    });
  });
};

const gen = function* () {
  const f1 = yield readFile('/etc/fstab');
  const f2 = yield readFile('/etc/shells');
  console.log(f1.toString());
  console.log(f2.toString());
};
```

上面代码的函数 `gen` 可以写成 `async` 函数，就是下面这样：

```js
const asyncReadFile = async function () {
  const f1 = await readFile('/etc/fstab');
  const f2 = await readFile('/etc/shells');
  console.log(f1.toString());
  console.log(f2.toString());
};
```

`async` 函数就是将 `Generator` 函数的星号（`*`）替换成 `async`，将 `yield` 替换成 `await`，仅此而已。

两段代码放在一起看，形状几乎没变。但可用性上差了一大截，具体体现在四点。

**第一，内置执行器。** `Generator` 函数的执行必须靠执行器，所以才有了 `co` 模块，而 `async` 函数自带执行器。也就是说，`async` 函数的执行与普通函数一模一样，只要一行：

```js
asyncReadFile();
```

上面的代码调用了 `asyncReadFile` 函数，然后它就会自动执行，输出最后结果。这完全不像 `Generator` 函数，需要手动调用 `next` 方法，或者引入 `co` 模块，才能真正跑到底。Generator 那套手动推进的写法和自动执行器的实现，在 [ES6系列之 Generator 函数的暂停与自动执行](https://feinterview.poetries.top/blog/es6-generator) 里有完整的推导过程。

**第二，更好的语义。** `async` 和 `await` 比起星号和 `yield`，语义清楚太多。`async` 表示函数里有异步操作，`await` 表示紧跟在后面的表达式需要等待结果。`yield` 是「产出」，这个词跟异步没有半点关系，它只是被借用了而已。

**第三，更广的适用性。** `co` 模块约定 `yield` 命令后面只能是 `Thunk` 函数或 `Promise` 对象，而 `async` 函数的 `await` 命令后面，可以是 `Promise` 对象，也可以是原始类型的值（数值、字符串和布尔值，但这时等同于同步操作）。

**第四，返回值是 Promise。** `async` 函数的返回值是 `Promise` 对象，这比 `Generator` 函数的返回值是 `Iterator` 对象方便多了。你可以用 `then` 方法指定下一步的操作，也可以在另一个 `async` 函数里继续 `await` 它。

进一步说，`async` 函数完全可以看作多个异步操作包装成的一个 `Promise` 对象，而 `await` 命令就是内部 `then` 命令的语法糖。

## 二、基本用法

`async` 函数返回一个 `Promise` 对象，可以使用 `then` 方法添加回调函数。当函数执行的时候，一旦遇到 `await` 就会先返回，等到异步操作完成，再接着执行函数体内后面的语句。

![async 函数执行流程，遇到 await 让出主线程，异步完成后恢复执行](https://s.poetries.top/gitee/2019/10/53.png)

「先返回」这三个字很关键。`async` 函数**不会阻塞调用它的代码**，它在第一个 `await` 处就把控制权还给了调用方，剩下的部分排在微任务里。所以下面这个函数虽然内部要等两次网络请求，调用方拿到 Promise 是同步的、立刻的。

```js
// 调用该函数时，会立即返回一个 Promise 对象
async function getStockPriceByName(name) {
  const symbol = await getStockSymbol(name);
  const stockPrice = await getStockPrice(symbol);
  return stockPrice;
}

getStockPriceByName('goog').then(function (result) {
  console.log(result);
});
```

`async` 函数有多种使用形式，声明、表达式、对象方法、类方法、箭头函数都支持：

```js
// 函数声明
async function foo() {}

// 函数表达式
const foo = async function () {};

// 对象的方法
let obj = { async foo() {} };
obj.foo().then(...)

// Class 的方法
class Storage {
  constructor() {
    this.cachePromise = caches.open('avatars');
  }

  async getAvatar(name) {
    const cache = await this.cachePromise;
    return cache.match(`/avatars/${name}.jpg`);
  }
}

const storage = new Storage();
storage.getAvatar('jake').then(…);

// 箭头函数
const foo = async () => {};
```

这里有个坑要注意，构造函数 `constructor` 不能是 `async` 的，因为 `new` 必须同步返回实例。上面那个 `Storage` 类的写法是标准解法：构造函数里存一个 Promise，真正需要的时候再 `await` 它。

## 三、语法

`async` 函数的语法规则总体上比较简单，难点是错误处理机制。

### 3.1 返回 Promise 对象

`async` 函数返回一个 `Promise` 对象，函数内部 `return` 语句返回的值，会成为 `then` 方法回调函数的参数。

```js
// 函数 f 内部 return 命令返回的值，会被 then 方法回调函数接收到
async function f() {
  return 'hello world';
}

f().then(v => console.log(v))
// "hello world"
```

`async` 函数内部抛出错误，会导致返回的 `Promise` 对象变为 `reject` 状态，抛出的错误对象会被 `catch` 方法回调函数接收到。

```js
async function f() {
  throw new Error('出错了');
}

f().then(
  v => console.log(v),
  e => console.log(e)
)
// Error: 出错了
```

这条规则有个很实用的推论：`async` 函数把同步抛错和异步 reject 统一成了同一种东西。普通函数里 `throw` 出来的异常要用 `try...catch` 接，Promise 的 reject 要用 `.catch()` 接，两套机制。加上 `async` 之后，两者都变成了返回 Promise 的 reject，外面一个 `catch` 全接住。

### 3.2 Promise 对象的状态变化

`async` 函数返回的 `Promise` 对象，必须等到内部所有 `await` 命令后面的 `Promise` 对象执行完，才会发生状态改变，除非中途遇到 `return` 语句或者抛出错误。也就是说，只有 `async` 函数内部的异步操作执行完，才会执行 `then` 方法指定的回调函数。

```js
async function getTitle(url) {
  let response = await fetch(url);
  let html = await response.text();
  return html.match(/<title>([\s\S]+)<\/title>/i)[1];
}
getTitle('https://tc39.github.io/ecma262/').then(console.log)
// "ECMAScript 2017 Language Specification"
```

### 3.3 await 命令

正常情况下，`await` 命令后面是一个 `Promise` 对象，返回该对象的结果。如果不是 `Promise` 对象，就直接返回对应的值。

```js
async function f() {
  // 等同于
  // return 123;
  return await 123;
}

f().then(v => console.log(v))
// 123
```

这两种写法结果一样，但过程不完全一样。`await 123` 会先把 `123` 包成一个已完成的 Promise，然后让出一次微任务队列，所以它比直接 `return 123` 多排一轮微任务。业务代码里感知不到，做那种「输出顺序」的面试题时就要算清楚了。

另一种情况是，`await` 命令后面是一个 `thenable` 对象（即定义了 `then` 方法的对象），那么 `await` 会将其等同于 `Promise` 对象。这一条让 `await` 可以直接消费 jQuery 的 `deferred`、axios 的返回值这类「长得像 Promise」的东西，不用手动转换。

`await` 命令后面的 `Promise` 对象如果变为 `reject` 状态，则 `reject` 的参数会被 `catch` 方法的回调函数接收到。

```js
async function f() {
  await Promise.reject('出错了');
}

f()
.then(v => console.log(v))
.catch(e => console.log(e))
// 出错了
```

上面代码中 `await` 语句前面没有 `return`，但是 `reject` 的参数依然传入了 `catch` 方法的回调函数。这里如果在 `await` 前面加上 `return`，效果是一样的。

要注意的是，任何一个 `await` 语句后面的 `Promise` 对象变为 `reject` 状态，整个 `async` 函数都会中断执行。

```js
async function f() {
  await Promise.reject('出错了');
  await Promise.resolve('hello world'); // 不会执行
}
```

有时我们希望即使前一个异步操作失败，也不要中断后面的异步操作。这时可以将第一个 `await` 放在 `try...catch` 结构里面，这样不管这个异步操作是否成功，第二个 `await` 都会执行。

```js
async function f() {
  try {
    await Promise.reject('出错了');
  } catch(e) {
  }
  return await Promise.resolve('hello world');
}

f()
.then(v => console.log(v))
// hello world
```

另一种方法是在 `await` 后面的 `Promise` 对象上再跟一个 `catch` 方法，处理前面可能出现的错误。

```js
async function f() {
  await Promise.reject('出错了')
    .catch(e => console.log(e));
  return await Promise.resolve('hello world');
}

f()
.then(v => console.log(v))
// 出错了
// hello world
```

这两种写法的差别在于**兜底的范围**。`try...catch` 是块级的，包住的所有 `await` 共用一个错误出口；`.catch()` 挂在单个 Promise 上，只处理这一个操作的失败，可以就地给一个降级值。我自己的习惯是，能给出合理默认值的用 `.catch()` 就地兜住，要中断流程的走 `try...catch`。

### 3.4 错误处理

如果 `await` 后面的异步操作出错，那么等同于 `async` 函数返回的 `Promise` 对象被 `reject`。

```js
async function f() {
  await new Promise(function (resolve, reject) {
    throw new Error('出错了');
  });
}

f()
.then(v => console.log(v))
.catch(e => console.log(e))
// Error：出错了
```

防止出错的方法，也是将其放在 `try...catch` 代码块之中：

```js
async function f() {
  try {
    await new Promise(function (resolve, reject) {
      throw new Error('出错了');
    });
  } catch(e) {
  }
  return await 'hello world';
}
```

原文这里写的是 `return await('hello world')`，看起来像在调用一个叫 `await` 的函数。虽然引擎解析后行为一样，但可读性很差，也容易让人误以为 `await` 是个函数，上面改成了 `return await 'hello world'`。

如果有多个 `await` 命令，可以统一放在 `try...catch` 结构中：

```js
async function main() {
  try {
    const val1 = await firstStep();
    const val2 = await secondStep(val1);
    const val3 = await thirdStep(val1, val2);

    console.log('Final: ', val3);
  }
  catch (err) {
    console.error(err);
  }
}
```

这是最常见的组织方式。三步是强依赖关系，任何一步挂了后面都没法继续，统一在外层兜住反而最清晰。

还有第四种写法，社区里常见的 `to` 工具函数，把 Promise 的结果转成 Go 风格的 `[err, data]` 元组：

```js
function to(promise) {
  return promise.then(data => [null, data]).catch(err => [err, undefined]);
}

async function main() {
  const [err, user] = await to(fetchUser());
  if (err) return handleError(err);
  // 继续用 user
}
```

好处是不用嵌套 `try...catch`，每一步的错误就地判断，逻辑是平的。坏处是每一行都得写一次 `if (err)`，样板代码不少。团队里选哪种都行，别混着用就好。

### 3.5 三个使用注意点

**第一点**，`await` 命令后面的 Promise 对象运行结果可能是 `rejected`，所以最好把 `await` 命令放在 `try...catch` 代码块中。

```js
async function myFunction() {
  try {
    await somethingThatReturnsAPromise();
  } catch (err) {
    console.log(err);
  }
}

// 另一种写法
async function myFunction() {
  await somethingThatReturnsAPromise()
  .catch(function (err) {
    console.log(err);
  });
}
```

**第二点**，多个 `await` 命令后面的异步操作，如果不存在继发关系，最好让它们同时触发。

```js
// getFoo 和 getBar 是两个独立的异步操作（即互不依赖），被写成了继发关系
// 这样比较耗时，因为只有 getFoo 完成以后才会执行 getBar

let foo = await getFoo();
let bar = await getBar();
```

这是我在 review 里见得最多的一类问题。两个接口各 300ms，串起来就是 600ms，改成并发只要 300ms。页面上有五六个这样的接口，首屏差距就很明显了。

```js
// 两种写法，getFoo 和 getBar 都是同时触发，这样就会缩短程序的执行时间

// 写法一
let [foo, bar] = await Promise.all([getFoo(), getBar()]);

// 写法二
let fooPromise = getFoo();
let barPromise = getBar();
let foo = await fooPromise;
let bar = await barPromise;
```

判断标准很简单：后一个请求的参数里，有没有用到前一个请求的返回值。用到了就是继发，只能串行；没用到就是并发，该并就并。

这两种写法有个差别要留意。写法一在任何一个失败时整体就 reject 了，剩下那个的结果直接丢掉；写法二两个 Promise 都已经发出去了，如果 `fooPromise` 先 reject 而你没处理 `barPromise`，Node 里可能报 unhandled rejection 警告。请求数多、又允许部分失败的场景，`Promise.allSettled` 比 `all` 更合适，几个组合 API 的取舍我单独整理在 [Promise.all、race、allSettled、any 怎么选](https://feinterview.poetries.top/blog/es6-promise-promiseAll) 这篇里。

**第三点**，`await` 命令只能用在 `async` 函数之中，如果用在普通函数里就会报错。

```js
async function dbFuc(db) {
  let docs = [{}, {}, {}];

  // 报错
  docs.forEach(function (doc) {
    await db.post(doc);
  });
}
```

这个坑非常隐蔽。外层 `dbFuc` 确实是 `async` 的，但 `await` 实际待的地方是 `forEach` 传进去的那个普通回调函数，它跟 `async` 没关系。

顺带说一下，就算你把回调改成 `async function(doc) {...}`，语法不报错了，行为也不对。`forEach` 不会等待回调返回的 Promise，三次 `db.post` 会同时发出去，外层函数不等它们就往下走了。要顺序执行得用 `for...of`：

```js
async function dbFuc(db) {
  let docs = [{}, {}, {}];
  for (const doc of docs) {
    await db.post(doc);   // 一个一个来
  }
}

// 如果不需要顺序，就并发
async function dbFuc2(db) {
  let docs = [{}, {}, {}];
  await Promise.all(docs.map(doc => db.post(doc)));
}
```

另外从 ES2022 起，ES 模块的顶层可以直接写 `await`，不必再套一层 `async` 立即执行函数。这个特性叫 top-level await，只在 ESM 里生效，CommonJS 用不了，具体的构建工具支持情况建议以 MDN 和你用的打包器文档为准。

## 四、async 函数的实现原理

`async` 函数的实现原理，就是将 `Generator` 函数和自动执行器包装在一个函数里。

```js
async function fn(args) {
  // ...
}

// 等同于

function fn(args) {
  return spawn(function* () {
    // ...
  });
}
```

所有的 `async` 函数都可以写成上面的第二种形式，其中的 `spawn` 函数就是自动执行器。

```js
// spawn 函数的实现，基本就是前文自动执行器的翻版

function spawn(genF) {
  return new Promise(function(resolve, reject) {
    const gen = genF();
    function step(nextF) {
      let next;
      try {
        next = nextF();
      } catch(e) {
        return reject(e);
      }
      if(next.done) {
        return resolve(next.value);
      }
      Promise.resolve(next.value).then(function(v) {
        step(function() { return gen.next(v); });
      }, function(e) {
        step(function() { return gen.throw(e); });
      });
    }
    step(function() { return gen.next(undefined); });
  });
}
```

这段代码值得逐行对照着看，前面讲的每条规则都能在里面找到对应。

最外层 `return new Promise(...)`，这就是「`async` 函数返回 Promise」的来源。

`try { next = nextF() } catch(e) { return reject(e) }`，函数体里同步抛出的错误在这里被捕获并转成 reject，对应 3.1 那条「内部 `throw` 导致返回的 Promise 变 reject」。

`if (next.done) return resolve(next.value)`，生成器跑完了，用 `return` 的值兑现最外层 Promise，对应「`return` 的值成为 `then` 的参数」。

`Promise.resolve(next.value)` 这一句解释了为什么 `await` 后面可以跟非 Promise 的值和 thenable 对象。不管你 `await` 的是什么，都先过一遍 `Promise.resolve`，原始值被包装，thenable 被吸收。

最后是成功和失败两条回调。成功时 `gen.next(v)` 把结果送回函数体，让 `await` 表达式「返回」这个值；失败时 `gen.throw(e)` 在 `await` 那一行的位置抛出异常，所以函数体里的 `try...catch` 才能接住它。这就是 3.3 和 3.4 全部行为的底层机制。

真实引擎当然不是这么实现的，V8 里 `async` 函数走的是专门的字节码和 async function object，不需要真的建一个生成器，并且做过微任务轮次的优化。但从行为等价的角度，`spawn` 这段足够解释你在业务里遇到的所有现象了。

## 总结

`async/await` 的一切行为都能从「Generator 函数 + 自动执行器」这个模型里推出来。函数返回 Promise，是因为执行器最外层包了一个 `new Promise`；`await` 能等 thenable，是因为执行器对每个产出值都做了 `Promise.resolve`；reject 会中断函数，是因为执行器调的是 `gen.throw`，异常从 `await` 那一行原地抛出。

日常写代码，真正需要动脑子的是两件事。

一是错误处理选哪种。要中断整段流程的用 `try...catch` 包住，能给降级值的就地 `.catch()` 兜住，喜欢平铺逻辑的用 `[err, data]` 元组，团队内统一一种。

二是该串还是该并。判断标准只有一条，后一个请求的参数里有没有用到前一个的结果。没用到就别写成两行 `await`，那是白白把耗时加起来。循环里更要小心，`forEach` 里的 `await` 根本不生效，要顺序执行用 `for...of`，要并发用 `map` 加 `Promise.all`。

## 参考

- [MDN async function](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/async_function)
- [MDN await](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/await)
- [ryf教程-async 函数](https://es6.ruanyifeng.com/#docs/async)
- [V8 博客 Faster async functions and promises](https://v8.dev/blog/fast-async)
- [前端进阶之旅](https://interview.poetries.top)
