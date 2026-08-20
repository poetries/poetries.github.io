---
title: ES6系列之Generator函数的暂停与自动执行
description: 从 function*、yield、next 三个关键字讲起，拆开 Generator 函数分段执行的机制、yield* 的委托规则、next 传参的双向通信，以及自动执行器 run 是怎么把异步流程跑起来的。
date: 2018-12-21 16:20:31
tags:
  - ES6
  - Javascript
  - Generator
  - 异步编程
categories: Front-End
---

第一次看到 `function*` 这个写法的人，多半会卡在同一个地方，就是「函数怎么可能停在中间」。普通函数一旦调用就一路跑到 `return`，中途谁也拦不住。Generator 打破的正是这条规则，它把一个函数切成好几段，每段之间由外部决定什么时候继续。

理解了这件事，后面很多东西才能串起来。`async/await` 为什么被叫做语法糖，`co` 模块在做什么，Redux-Saga 那套 `yield put()` 的写法凭什么能测试，源头都在这里。这篇把 `function*`、`yield`、`next` 三个关键字的配合关系拆开讲，重点放在「谁在控制执行权」这条主线上，最后落到一个能自动跑异步流程的执行器上。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `function*`、`yield`、`next` 三者到底各自负责什么
- 一次 `next()` 调用在引擎里走过的完整路径
- `yield` 表达式的返回值从哪里来，`next(data)` 传参的意义
- `yield*` 委托的真实语义，以及它等价于哪段 `for...of`
- 用 Generator 把异步写成同步样子的三类典型场景
- 手写一个 `run` 自动执行器，理解 `async/await` 的原型
- 在任意对象上部署 Iterator 接口

## 一、什么是 Generator 函数

### 1.1 三个关键字

学习 `Generator` 语法，你需要先了解 `function*`、`yield`、`next` 三个基本概念。

`function*` 用来声明一个函数是生成器函数，它比普通的函数声明多了一个 `*`。`*` 的位置比较随意，可以挨着 `function` 关键字，也可以挨着函数名，两种写法引擎都认。团队里统一一种就行，我个人习惯 `function* name()` 这种，视觉上 `*` 跟 `function` 绑在一起，更像是在修饰「这是一种特殊的函数」。

`yield` 是产出的意思，这个关键字只能出现在生成器函数体内。生成器中也可以一个 `yield` 都没有，那样它就是一个调一次 `next()` 直接结束的生成器。函数遇到 `yield` 的时候会暂停，并把 `yield` 后面的表达式结果抛出去。

`next` 的作用是把代码的控制权交还给生成器函数。

这三个凑在一起，就构成了一套很朴素的协作关系：生成器函数负责标记「哪里可以停」，外部代码负责决定「什么时候继续」。

```js
// 声明生成器函数
function* generator() {
    // A
    yield 'foo'
    // B
}
// 获取生成器对象
let g = generator();
// 第一个 next()，首次启动生成器
g.next(); // {value: "foo", done: false}
// 唤醒被 yield 暂停的状态
g.next();
// {value: undefined, done: true}
```

这里有个细节很多人第一次会漏掉：`generator()` 这一行**并不执行函数体**，注释 A 处的代码此时一行都没跑。它只是返回了一个生成器对象。真正启动执行的是第一次 `next()`。

### 1.2 一次调用走了哪几步

拿一个更完整的例子来跟踪执行流程。

```js
// 分析一个简单例子
function* helloGenerator() {
   yield "hello";
   yield "generator";
   return;
}

var h = helloGenerator();

console.log(h.next()); // { value: 'hello', done: false }
console.log(h.next()); // { value: 'generator', done: false }
console.log(h.next()); // { value: undefined, done: true }
```

拆开看是这样的：

- 创建了 `h` 对象，它是指向 `helloGenerator` 执行状态的一个句柄
- 第一次调用 `next()`，执行到 `yield "hello"`，暂缓执行，并返回了 `"hello"`
- 第二次调用 `next()`，从上次暂停的地方继续，执行到 `yield "generator"`，暂缓执行，并返回了 `"generator"`
- 第三次调用 `next()`，直接执行 `return`，并返回 `done: true`，表明结束

原文这里第三次的输出写成了 `{ value: 'undefined', done: true }`，带引号。实际返回的是原始值 `undefined`，不是字符串 `"undefined"`，上面我已经改过来了。这种细节在面试手写输出结果的时候会被抓住。

经过上面的分析，`yield` 实际就是暂缓执行的标示，每执行一次 `next()`，相当于指针移动到下一个 `yield` 位置。

![Generator 函数执行流程，next 调用推动指针在 yield 之间移动](https://s.poetries.top/gitee/2019/10/54.png)

`Generator` 函数是 `ES6` 提供的一种异步编程解决方案。通过 `yield` 标识位和 `next()` 方法调用，实现函数的分段执行。

不过有一点要说清楚，Generator 本身跟异步没有任何关系。它只提供「暂停」和「恢复」这两个能力，是纯同步的语言特性。之所以能拿来处理异步，是因为有人在暂停的间隙里塞进了异步操作，等操作完成再调 `next()` 恢复。这个「有人」就是后面要讲的执行器。

### 1.3 yield 表达式与 yield\*

`yield` 是 `Generator` 函数暂缓执行的标识，只能配合 `Generator` 函数使用，在普通的函数中使用会报错。

`Generator` 函数中还有一种 `yield*` 表达方式。

```js
function* foo(){
   yield "a";
   yield "b";
}
function* gen(x, y){
   yield 1;
   yield 2;
   yield* foo();
   yield 3;
}
var g = gen();
console.log(g.next()); // {value: 1, done: false}
console.log(g.next()); // {value: 2, done: false}
console.log(g.next()); // {value: "a", done: false}
console.log(g.next()); // {value: "b", done: false}
console.log(g.next()); // {value: 3, done: false}
console.log(g.next()); // {value: undefined, done: true}
```

原文这段的输出注释写错了，把 `yield* foo()` 产出的三次都标成了 `done: true`。这是不对的。`done` 只有在生成器整个函数体执行完（走到 `return` 或者函数尾）之后才会变成 `true`。委托给 `foo` 的过程中外层 `gen` 显然还没结束，`done` 一直是 `false`。上面的输出我按实际行为重新标了一遍，最后补了一次拿到 `{value: undefined, done: true}` 的调用。

当执行 `yield*` 时，实际是遍历后面那个可迭代对象，等价于下面的写法：

```js
function* foo(){
   yield "a";
   yield "b";
}
function* gen(x, y){
    yield 1;
    yield 2;

    for (var value of foo()) {
      yield value;
    }

    yield 3;
}
```

这里再纠正原文一句话。原文写的是「`yield` 后面只能适配 `Generator` 函数」，这个说法两处都不准确。

`yield` 后面可以跟任何表达式，数字、字符串、Promise、函数调用都行，没有任何限制。有限制的是 `yield*`，它后面要跟一个**可迭代对象**，也就是实现了 `Symbol.iterator` 的东西。Generator 对象当然是可迭代的，但数组、字符串、Map、Set 同样可以：

```js
function* gen() {
  yield* [1, 2];      // 依次产出 1、2
  yield* 'ab';        // 依次产出 'a'、'b'
  yield* new Set([9]); // 产出 9
}
console.log([...gen()]); // [1, 2, 'a', 'b', 9]
```

`for...of` 那个等价写法还有个不完全等价的地方，`yield*` 会把被委托生成器的 `return` 值作为整个 `yield*` 表达式的值返回，`for...of` 循环拿不到这个值。这个差别平时用不上，但在写嵌套流程的时候会咬人。

### 1.4 next 传参：真正的双向通信

前面讲的都是数据从生成器里往外流。反过来也可以，`next(data)` 传进去的参数，会成为**上一个** `yield` 表达式的返回值。

```js
function* echo() {
  const a = yield 'first';
  console.log('收到', a);
  const b = yield 'second';
  console.log('收到', b);
}

const it = echo();
it.next();       // {value: 'first', done: false}，第一次 next 的参数会被丢掉
it.next('A');    // 打印「收到 A」，返回 {value: 'second', done: false}
it.next('B');    // 打印「收到 B」
```

第一次 `next()` 的参数是没有意义的，因为那时候还没有任何一个 `yield` 在等着接收值，函数体还没开始跑。我一开始也在这里绕过弯，写了个 `it.next(初始值)` 死活拿不到。

这个双向通道就是 Generator 能处理异步的关键。异步结果通过 `next(result)` 送回函数体内部，看起来就像是 `yield` 语句「返回」了异步的结果，同步写法的假象就是这么造出来的。

## 二、Generator 的应用场景

### 2.1 异步操作的同步化表达

`Generator` 函数暂停执行的效果，意味着可以把异步操作写在 `yield` 表达式里面，等到调用 `next` 方法时再往后执行。这实际上等同于不需要写回调函数了，因为异步操作的后续操作可以放在 `yield` 表达式下面，反正要等到调用 `next` 方法时再执行。所以 `Generator` 函数的一个重要实际意义就是用来处理异步操作，改写回调函数。

```js
function* loadUI() {
  showLoadingScreen();
  yield loadUIDataAsynchronously();
  hideLoadingScreen();
}
var loader = loadUI();
// 加载 UI
loader.next()

// 卸载 UI
loader.next()
```

上面代码中，第一次调用 `loadUI` 函数时，该函数不会执行，仅返回一个遍历器。下一次对该遍历器调用 `next` 方法，则会显示 `Loading` 界面，并且异步加载数据。等到数据加载完成，再一次使用 `next` 方法，则会隐藏 `Loading` 界面。

这种写法的好处是所有 `Loading` 界面的逻辑都被封装在一个函数里，按部就班非常清晰。以前写这类逻辑要在请求发起前 `show`、在成功回调里 `hide`、在失败回调里再 `hide` 一次，三处代码分散在不同的地方，漏一处就是 loading 转圈转到天荒地老。

通过 `Generator` 函数部署 `Ajax` 操作，也可以用同步的方式表达。

```js
function* main() {
  var result = yield request("http://some.url");
  var resp = JSON.parse(result);
  console.log(resp.value);
}

function request(url) {
  makeAjaxCall(url, function(response){
    it.next(response);
  });
}

var it = main();
it.next();
```

注意 `request` 里面直接引用了外部的 `it` 变量，这是个反面教材式的写法，耦合太紧，换个生成器就得改。它只是用来演示「异步回调里调 `next`」这个思路。真正可用的版本在下一节。

### 2.2 控制流管理

先准备一个返回 Promise 的异步函数，模拟一次 1 秒的请求。

```js
// 异步函数
function getDataAsync (url) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            var res = {
                url: url,
                data: Math.random()
            }
            resolve(res)
        }, 1000)
    })
}
```

三次请求有依赖关系，后一次要用前一次的结果。用 `Generator` 函数可以这样写：

```js
function * getData () {
    var res1 = yield getDataAsync('/page/1?param=123')
    console.log(res1)
    var res2 = yield getDataAsync(`/page/2?param=${res1.data}`)
    console.log(res2)
    var res3 = yield getDataAsync(`/page/2?param=${res2.data}`)
    console.log(res3)
}
```

原文这里最后一行是 `console.log(res3))`，多了个右括号，直接就是语法错误，我顺手改掉了。

写完函数还得有人推它往前走。手动的写法是这样：

```js
var g = getData()
g.next().value.then(res1 => {
    g.next(res1).value.then(res2 => {
        g.next(res2).value.then(() => {
            g.next()
        })
    })
})
```

我们逐步调用遍历器的 `next()` 方法，由于每一个 `next()` 方法返回值的 `value` 属性为一个 `Promise` 对象，所以我们为其添加 `then` 方法，在 `then` 方法里面接着运行 `next` 方法挪移遍历器指针，直到 `Generator` 函数运行完成。

看到这段你可能会想，绕了一圈，回调地狱不是又回来了吗。

确实是。但区别在于，这个地狱只需要写一次，而且它跟具体业务无关，完全可以封装成一个通用的执行器。

```js
function run (gen) {
    var g = gen()

    function next (data) {
        var res = g.next(data)
        if (res.done) return res.value
        res.value.then((data) => {
            next(data)
        })
    }
    next()
}
```

`run` 方法用来自动运行异步的 `Generator` 函数，其实就是一个递归调用的过程。有了 `run` 方法，我们只需要这样运行 `getData` 方法：

```js
run(getData)
```

这个 20 行不到的函数，就是 `co` 模块最核心的骨架。当然它简化了很多东西，比如没有处理 `yield` 后面不是 Promise 的情况，没有做错误捕获（`g.throw(err)` 那一路），返回值也不是 Promise 所以没法 `await`。生产级的 `co` 把这些边界都补上了，思路是完全一致的。

这样，我们就可以把异步操作封装到 `Generator` 函数内部，使用 `run` 方法作为 `Generator` 函数的自执行器来处理异步。

顺着这个思路往下想，`async/await` 相比于 `Generator` 处理异步的方式，有很多相似的地方，只不过 `async/await` 在语义化方面更加明显，同时 `async/await` 不需要我们手写执行器，其内部已经帮我们封装好了。这就是为什么说 `async/await` 是 `Generator` 函数处理异步的语法糖。关于 `async` 函数的完整语法、错误处理和它内部那个 `spawn` 执行器长什么样，可以看 [ES6系列之 async/await 的用法与实现原理](https://feinterview.poetries.top/blog/es6-async)。

另外，上面这些代码都依赖 `Promise` 作为 `yield` 的产出物。Promise 自身的状态机和链式调用是怎么实现的，我在 [浅析 Promise 原理与手写实现](https://feinterview.poetries.top/blog/promise-anaylse) 里从零写了一遍，两篇配合着看会更完整。

### 2.3 部署 Iterator 接口

利用 `Generator` 函数，可以在任意对象上部署 `Iterator` 接口。

```js
function* iterEntries(obj) {
  let keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    yield [key, obj[key]];
  }
}

let myObj = { foo: 3, bar: 7 };

for (let [key, value] of iterEntries(myObj)) {
  console.log(key, value);
}

// foo 3
// bar 7
```

上述代码中，`myObj` 是一个普通对象，通过 `iterEntries` 函数，就有了 `Iterator` 接口。也就是说，可以在任意对象上部署 `next` 方法。

严格说，上面这个写法是「借了一个生成器来遍历对象」，`myObj` 本身还是不可迭代的，你直接 `for...of (myObj)` 依然报错。想让对象自己变成可迭代的，得把生成器挂到它的 `Symbol.iterator` 上：

```js
myObj[Symbol.iterator] = function* () {
  for (const key of Object.keys(this)) {
    yield [key, this[key]];
  }
};

console.log([...myObj]); // [['foo', 3], ['bar', 7]]
```

这一步用到了 `Symbol.iterator` 这个内置 Symbol，它是 JS 里「可迭代协议」的约定键名。关于 Symbol 为什么要用一个独一无二的值来当协议键，可以看 [ES6系列之 Symbol 的唯一性与内置符号](https://feinterview.poetries.top/blog/es6-symbol)。

下面是一个对数组部署 `Iterator` 接口的例子，尽管数组原生就有这个接口：

```js
function* makeSimpleGenerator(array){
  var nextIndex = 0;

  while (nextIndex < array.length) {
    yield array[nextIndex++];
  }
}

var gen = makeSimpleGenerator(['yo', 'ya']);

gen.next().value // 'yo'
gen.next().value // 'ya'
gen.next().done  // true
```

这类写法真正的价值不在于替代数组遍历，而在于**惰性求值**。生成器只在你调 `next()` 的时候才算下一个值，所以完全可以描述一个无限序列而不撑爆内存：

```js
function* naturals() {
  let n = 0;
  while (true) yield n++;
}
const it = naturals();
it.next().value; // 0
it.next().value; // 1
// 想取多少取多少，不会卡死
```

换成数组你得先把一百万个数塞进内存，生成器只保留一个 `n`。处理大文件分片、分页流式读取这类场景，这个特性比同步化写法有用得多。

## 三、现在还该用 Generator 吗

原文写于 2018 年，那会儿 `async/await` 刚普及不久，Generator 还是很多人处理异步的主力方案。今天这个分工已经很清楚了。

处理异步流程，直接用 `async/await`，没有任何理由手写执行器。语法更短，错误处理走 `try...catch` 更自然，调试时调用栈也更完整。

但 Generator 并没有过时，它在两个地方仍然不可替代。一个是需要**外部控制执行节奏**的场景，比如 Redux-Saga 把副作用 `yield` 成一个描述对象再由中间件去执行，这样测试的时候可以完全不碰真实请求，只断言 `yield` 出来的对象长什么样。另一个是**惰性序列和自定义迭代**，上面那个无限自然数的例子，`async/await` 是做不到的。

顺带一提，还有 `async function*` 这种异步生成器，配合 `for await...of` 用来消费流式数据，比如逐块读取 fetch 的响应体。它在 ES2018 进入标准，属于 Generator 和 async 的合体，这块我只在 Node 的文件流场景验证过，浏览器端的兼容性建议以 MDN 为准。

## 总结

Generator 做的事情只有一件，就是把函数的执行权从「调用者一次性交出去」改成「分段交出去，随叫随到」。`function*` 声明这种能力，`yield` 标记暂停点，`next()` 决定什么时候继续。

搞清楚这条主线之后，几个容易混的点也就顺了。调用生成器函数不执行函数体，第一次 `next()` 才启动；`next(data)` 的参数是给上一个 `yield` 表达式当返回值的，第一次调用传参没意义；`done` 只在整个函数体跑完之后才是 `true`，`yield*` 委托期间它一直是 `false`。

拿它处理异步，本质是在暂停的间隙里塞异步操作，等结果回来再 `next(结果)` 恢复。这个「塞」的动作由执行器完成，二十来行的 `run` 就是 `co` 的骨架，也是 `async/await` 内部逻辑的雏形。

今天写业务代码，异步流程用 `async/await` 就够了。Generator 留给那些需要外部掌控节奏的场景，比如 Redux-Saga 的副作用管理，以及需要惰性求值的自定义迭代器。这两块是 `async/await` 顶不上的。

## 参考

- [MDN function\*](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/function*)
- [MDN 迭代器和生成器](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Iterators_and_generators)
- [ryf教程-generator](http://es6.ruanyifeng.com/#docs/generator)
- [co 模块](https://github.com/tj/co)
- [前端进阶之旅](https://interview.poetries.top)
