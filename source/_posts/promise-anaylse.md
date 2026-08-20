---
title: 浅析Promise原理与手写实现
description: 从状态机和 then 注册机制讲起，分七步递进手写一个符合 Promises/A+ 规范的 Promise，讲清延时机制、链式衔接、错误冒泡和 resolutionProcedure 每一行在解决什么问题。
date: 2018-12-20 16:30:43
tags:
  - Promise
  - Javascript
  - 手写实现
  - 源码分析
categories: Front-End
---

手写 Promise 大概是前端面试里出现频率最高的一道代码题。多数人能背出「三种状态、状态不可逆、then 返回新 Promise」，但真拿笔写，写到第三步就卡住了，卡的地方几乎都一样：`then` 里返回一个 Promise 时，外层那个 Promise 怎么知道该等它。

这道题的价值不在于背，而在于每一步都是被一个具体问题逼出来的。为什么要用 `setTimeout` 包一层？因为同步 `resolve` 会跑在 `then` 注册之前。为什么要引入状态？因为异步完成之后再注册的回调也得能执行。为什么 `resolve` 里要检查参数有没有 `then` 方法？因为链式调用要靠它衔接。这篇按这个顺序，从一个十行的雏形一路加到完整实现，每加一段都先说清楚它在解决什么。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Promise 的三种状态和 A+ 规范里最关键的几条约束
- 十行代码的极简雏形：`then` 注册 + `resolve` 触发
- 为什么必须加延时机制，`setTimeout` 和微任务的差别
- 状态机解决了什么，为什么状态只能转一次
- 链式 Promise 的衔接机制，bridge promise 是什么
- 失败处理与错误冒泡是怎么自然实现出来的
- `resolutionProcedure` 逐段对照 A+ 规范条款
- 观察者模式视角下的 Promise

## 一、先把要实现的行为定下来

动手写之前得先明确目标行为。这一节把原生 Promise 的用法过一遍，后面每实现一步都能对回来验证。

### 1.1 基本用法

```js
new Promise(function(resolve, reject) {
    //待处理的异步逻辑
    //处理结束后，调用resolve或reject方法
})
```

新建一个 `promise` 很简单，只需要 `new` 一个 `promise` 对象即可。`Promise` 是一个构造函数，它接受一个函数作为参数，并且会返回 `promise` 对象，这就给链式调用提供了基础。

`Promise` 函数的使命，就是构建出它的实例，并且负责帮我们管理这些实例。而这些实例有以下三种状态：

- `pending`：初始状态，未履行也未拒绝
- `fulfilled`：操作成功完成
- `rejected`：操作失败

原文这里把 `pending` 写成了「位履行或拒绝」，是个错别字，应为「未履行」。

`pending` 状态的 `Promise` 对象可能以 `fulfilled` 状态返回了一个值，也可能被某种理由（异常信息）拒绝（`reject`）了。当其中任一种情况出现时，`Promise` 对象的 `then` 方法绑定的处理方法（handlers）就会被调用。`then` 方法分别指定了成功和失败两个回调函数。

![Promise 三种状态与 then 回调的触发关系示意图](https://mengera88.github.io/images/promises.png)

```js
var promise = new Promise(function(resolve, reject) {
  if (/* 异步操作成功 */){
    resolve(value);
  } else {
    reject(error);
  }
});
promise.then(function(value) {
  // 如果调用了resolve方法，执行此函数
}, function(value) {
  // 如果调用了reject方法，执行此函数
});
```

这段代码展示了 `promise` 对象运行的基本骨架，`new` 的时候把异步逻辑放进去，成功调 `resolve`，失败调 `reject`，外面用 `then` 接。

下面这个例子更接近真实用法，把一个基于回调的 `XMLHttpRequest` 包成 Promise：

```js
var getJSON = function(url) {
  var promise = new Promise(function(resolve, reject){
    var client = new XMLHttpRequest();
    client.open("GET", url);
    client.onreadystatechange = handler;
    client.responseType = "json";
    client.setRequestHeader("Accept", "application/json");
    client.send();
    function handler() {
      if (this.status === 200) { 
              resolve(this.response); 
          } else { 
              reject(new Error(this.statusText)); 
          }
    };
  });
  return promise;
};
getJSON("/posts.json").then(function(json) {
  console.log('Contents: ' + json);
}, function(error) {
  console.error('出错了', error);
});
```

这段值得多看两眼，因为它是 Promise 最原始的用途，把回调风格的 API 转成 Promise 风格。注意 `handler` 里成功走 `resolve`、失败走 `reject`，一次只会调一个。这也是「Promise 化」这个词的来源，Node 的 `util.promisify` 干的就是这件事。

`resolve` 方法和 `reject` 方法调用时都带有参数，它们的参数会被传递给回调函数。`reject` 方法的参数通常是 `Error` 对象的实例，而 `resolve` 方法的参数除了正常的值以外，还可能是另一个 `Promise` 实例，比如像下面这样：

```js
var p1 = new Promise(function(resolve, reject){
  // ... some code
});
var p2 = new Promise(function(resolve, reject){
  // ... some code
  resolve(p1);
})
```

上面代码中，`p1` 和 `p2` 都是 `Promise` 的实例，但是 `p2` 的 `resolve` 方法将 `p1` 作为参数，这时 `p1` 的状态就会传递给 `p2`。如果调用的时候 `p1` 的状态是 `pending`，那么 `p2` 的回调函数就会等待 `p1` 的状态改变；如果 `p1` 的状态已经是 `fulfilled` 或者 `rejected`，那么 `p2` 的回调函数将会立刻执行。

这一条先在这里记下，它是后面第二部分最难实现的一块。「`resolve` 一个 Promise 就等于把状态权交给它」这个行为，在规范里对应 `resolutionProcedure`，也是链式调用能成立的根本原因。

### 1.2 promise 捕获错误

`Promise.prototype.catch` 方法是 `Promise.prototype.then(null, rejection)` 的别名，用于指定发生错误时的回调函数。

这句「别名」很重要。`catch` 不是什么特殊机制，它就是 `then` 的第二个参数，只不过换了个位置写。理解这一点，第二部分实现 `catch` 就只是一行转发的事。

```js
getJSON("/visa.json").then(function(result) {
  // some code
}).catch(function(error) {
  // 处理前一个回调函数运行时发生的错误
  console.log('出错啦！', error);
});
```

`Promise` 对象的错误具有「冒泡」性质，会一直向后传递，直到被捕获为止。错误总是会被下一个 `catch` 语句捕获。

```js
getJSON("/visa.json").then(function(json) {
  return json.name;
}).then(function(name) {
  // proceed
}).catch(function(error) {
    //处理前面任一个then函数抛出的错误
});
```

冒泡这个特性看着像是额外设计的，实际上它是「`then` 没传失败回调时把错误原样往下传」的自然结果，第二部分的 2.7 节实现完你会发现它是白送的。

### 1.3 常用的 promise 方法

这一节把要实现的静态方法行为定下来。这几个组合方法在真实业务里怎么选、`allSettled` 和 `any` 又补上了什么，我单独整理在 [Promise.all、race、allSettled、any 四个组合方法怎么选](https://feinterview.poetries.top/blog/es6-promise-promiseAll) 这篇里，这里只讲实现所需要的规则。

**Promise.all 方法**

`Promise.all` 方法用于将多个 `Promise` 实例包装成一个新的 `Promise` 实例。

```js
var p = Promise.all([p1,p2,p3]);
```

上面代码中，`Promise.all` 方法接受一个数组作为参数，`p1`、`p2`、`p3` 都是 `Promise` 对象的实例。参数不一定是数组，但必须具有 `iterator` 接口。

`p` 的状态由 `p1`、`p2`、`p3` 决定，分成两种情况：

- 只有 `p1`、`p2`、`p3` 的状态都变成 `fulfilled`，`p` 的状态才会变成 `fulfilled`，此时三者的返回值组成一个数组传递给 `p` 的回调函数
- 只要 `p1`、`p2`、`p3` 之中有一个被 `rejected`，`p` 的状态就变成 `rejected`，此时第一个被 `reject` 的实例的返回值会传递给 `p` 的回调函数

自己实现 `all` 的时候，这两条规则对应两个要点。一是要维护一个计数器和一个结果数组，结果按**下标**存而不是按完成顺序 `push`，这样才能保证顺序和输入一致。二是失败要直接 `reject` 整个外层 Promise，而且因为状态只能转一次，后续失败会被自动忽略，不需要额外加锁。

```js
// 生成一个Promise对象的数组
var promises = [2, 3, 5, 7, 11, 13].map(function(id){
  return getJSON("/get/addr" + id + ".json");
});
Promise.all(promises).then(function(posts) {
  // ...  
}).catch(function(reason){
  // ...
});
```

**Promise.race 方法**

`Promise.race` 方法同样是将多个 `Promise` 实例包装成一个新的 `Promise` 实例。

```js
var p = Promise.race([p1,p2,p3]);
```

只要 `p1`、`p2`、`p3` 之中有一个实例率先改变状态，`p` 的状态就跟着改变。那个率先改变的 Promise 实例的返回值，就传递给 `p`。

`race` 的实现比 `all` 简单得多，遍历一遍，每个都挂上 `then(resolve, reject)` 就完事了。全靠「状态只能转一次」这条规则兜着，第一个 settle 的赢，后面的调用全部无效。这也是为什么状态机那一步必须做对，做对了后面很多东西就是免费的。

如果 `Promise.all` 和 `Promise.race` 的参数不是 `Promise` 实例，就会先调用下面讲到的 `Promise.resolve` 方法，将参数转为 `Promise` 实例再进一步处理。

**Promise.resolve**

有时需要将现有对象转为 `Promise` 对象，`Promise.resolve` 方法就起到这个作用。

```js
var jsPromise = Promise.resolve($.ajax('/whatever.json'));
```

上面代码将 `jQuery` 生成的 `deferred` 对象转为一个新的 `ES6` 的 `Promise` 对象。这一步能成，靠的就是 `deferred` 上有 `then` 方法，也就是它是个 thenable。

如果 `Promise.resolve` 方法的参数不是具有 `then` 方法的对象（又称 `thenable` 对象），则返回一个新的 `Promise` 对象，且它的状态为 `fulfilled`。

```js
var p = Promise.resolve('Hello');
p.then(function (s){
  console.log(s)
});
// Hello
```

上面代码生成一个新的 `Promise` 对象实例 `p`，它的状态为 `fulfilled`，所以回调函数会立即执行（准确说是在下一个微任务里执行），`Promise.resolve` 方法的参数就是回调函数的参数。

还有两条规则要记住：

- 如果 `Promise.resolve` 方法的参数是一个 `Promise` 对象的实例，则会被**原封不动地返回**，注意是同一个引用，不是包一层
- `Promise.reject(reason)` 方法也会返回一个新的 `Promise` 实例，该实例的状态为 `rejected`。参数 `reason` 会被传递给实例的回调函数

`resolve` 和 `reject` 这里有个不对称的地方，很多人没注意过。`Promise.resolve` 会展开 thenable 和 Promise，`Promise.reject` 不会，你 `Promise.reject(somePromise)` 得到的就是一个以那个 Promise 对象为失败原因的 rejected Promise，不会去等它。

```js
var p = Promise.reject('出错啦');
p.then(null, function (error){
  console.log(error)
});
// 出错了
```

### 1.4 上层语法糖：async/await 与 Generator

这两小节稍微偏离主线，但放在这里有意义：它们能说明「为什么值得花时间搞懂 Promise 内部」。上面这些 API 是 Promise 的对外接口，而 `async/await` 和 Generator 处理异步的能力，全都是搭在这套接口上的。

先看 `async/await` 的写法。

```js
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

```js
async function getData () {
    var res1 = await getDataAsync('/page/1?param=123')
    console.log(res1)
    var res2 = await getDataAsync(`/page/2?param=${res1.data}`)
    console.log(res2)
    var res3 = await getDataAsync(`/page/2?param=${res2.data}`)
    console.log(res3)
}
```

`async/await` 是基于 `Promise` 的，因为使用 `async` 修饰的方法最终返回一个 `Promise`。往下一层，`async/await` 可以看做是使用 `Generator` 函数处理异步的语法糖。

这里说的「基于 Promise」不是一句口号。`await` 后面的东西会先被 `Promise.resolve` 处理一遍，然后拿它的 `then` 来挂恢复逻辑，所以只要你的对象是个 thenable，`await` 就能等它。这条链路完整拆开在 [ES6系列之 async/await 的用法与实现原理](https://feinterview.poetries.top/blog/es6-async) 那篇，包括 `spawn` 执行器怎么逐行对应每一条语法规则。

下面看用 `Generator` 函数怎么处理同一件事。

首先异步函数依然是：

```js
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

> 使用 `Generator` 函数可以这样写

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

原文最后一行多写了一个右括号（`console.log(res3))`），是语法错误，已改正。

然后我们这样逐步执行：

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

我们逐步调用遍历器的 `next()` 方法，由于每一个 `next()` 方法返回值的 `value` 属性为一个 `Promise` 对象，所以我们为其添加 `then` 方法，在 `then` 方法里面接着运行 `next` 方法挪移遍历器指针，直到 `Generator` 函数运行完成。这个过程不必手动完成，可以封装成一个简单的执行器。

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

这样就可以把异步操作封装到 `Generator` 函数内部，使用 `run` 方法作为自执行器来处理异步。`async/await` 相比于 `Generator` 处理异步的方式有很多相似的地方，只不过 `async/await` 在语义化方面更加明显，同时不需要我们手写执行器，其内部已经封装好了。这就是为什么说 `async/await` 是 `Generator` 函数处理异步的语法糖。

Generator 的暂停恢复机制、`next` 传参的双向通信、以及这个 `run` 执行器还差哪些边界处理才算生产可用，都在 [ES6系列之 Generator 函数的暂停与自动执行](https://feinterview.poetries.top/blog/es6-generator) 里展开了。

好，热身结束。上面这些行为规则，接下来要一条一条自己实现出来。

## 二、Promise 实现原理剖析

### 2.1 Promise 标准

`Promise` 规范历史上有好几个版本，如 `Promise/A`、`Promise/B`、`Promise/D` 以及 `Promise/A` 的升级版 `Promise/A+`。`ES6` 中采用的是 `Promise/A+` 规范。

中文版规范：[Promises/A+ 规范（中文）](http://www.ituring.com.cn/article/66566)

**Promise 标准解读**

整份规范其实只有两页，核心约束就两条：

- 一个 `promise` 的当前状态只能是 `pending`、`fulfilled` 和 `rejected` 三种之一。状态改变只能是 `pending` 到 `fulfilled` 或者 `pending` 到 `rejected`，且**不可逆**
- `promise` 的 `then` 方法接收两个可选参数，表示该 promise 状态改变时的回调（`promise.then(onFulfilled, onRejected)`）。`then` 方法**返回一个新的 promise**，并且可以被同一个 promise 调用多次

这两条各自对应实现里的一大块。第一条对应状态机，也是 2.5 节要加的东西；第二条对应链式调用，是 2.6 节最难的部分。剩下的都是围绕这两条打补丁。

规范里还有一条容易被忽略但很关键：`onFulfilled` 和 `onRejected` **必须异步执行**，不能在 `resolve` 的同一个同步流程里直接调。这是 2.4 节要解决的问题。

### 2.2 要实现哪些东西

先把要写的方法列出来，心里有个谱。

**构造函数**

```js
function Promise(resolver) {}
```

**原型方法**

```js
Promise.prototype.then = function() {}
Promise.prototype.catch = function() {}
```

**静态方法**

```js
Promise.resolve = function() {}
Promise.reject = function() {}
Promise.all = function() {}
Promise.race = function() {}
```

构造函数负责状态和回调队列，原型方法负责注册回调，静态方法都是在构造函数之上的组合封装。接下来七步，一步解决一个问题。

### 2.3 第一步：极简雏形

```js
function Promise(fn) {
    var value = null,
        callbacks = [];  //callbacks为数组，因为可能同时有很多个回调
    this.then = function (onFulfilled) {
        callbacks.push(onFulfilled);
    };
    function resolve(value) {
        callbacks.forEach(function (callback) {
            callback(value);
        });
    }
    fn(resolve);
}
```

先说结论，这十行代码抓住了 Promise 最核心的那个骨架：**`then` 只负责存回调，`resolve` 负责取出来执行。** 后面加的所有东西都是在这个骨架上补边界。

大致的逻辑是这样的：

- 调用 `then` 方法，将想要在 `Promise` 异步操作成功时执行的回调放入 `callbacks` 队列，也就是注册回调函数。这里可以往观察者模式的方向想，`then` 是订阅，`resolve` 是发布
- 创建 `Promise` 实例时传入的函数会被赋予一个函数类型的参数，即 `resolve`，它接收一个参数 `value` 代表异步操作返回的结果。当异步操作执行成功后，用户会调用 `resolve` 方法，这时候真正执行的操作是把 `callbacks` 队列中的回调一一执行

原文这里把「异步操作」写成了「一步操作」，是个错别字，已改正。

```js
//例1
function getUserId() {
    return new Promise(function(resolve) {
        //异步请求
        http.get(url, function(results) {
            resolve(results.id)
        })
    })
}
getUserId().then(function(id) {
    //一些处理
})
```

```js
// 结合例子1分析

// fn 就是getUserId函数
function Promise(fn) {
    var value = null,
        callbacks = [];  //callbacks为数组，因为可能同时有很多个回调
    
    // 当用户调用getUserId().then的时候开始注册传进来的回调函数
    // onFulfilled就是例子中的function(id){}
    // 把then的回调函数收集起来 在resolve的时候调用
    this.then = function (onFulfilled) {
        callbacks.push(onFulfilled);
    };
    
    // value是fn函数执行后返回的值
    function resolve(value) {
        // callbacks是传给then的回调函数就是例子中的function(id){}
        // 遍历用户通过then传递进来的回调函数把resolve成功的结果返回给then调用即then(function(data){ console.log(data) }) 这里的data就是通过这里调用返回
        callbacks.forEach(function (callback) {
            callback(value);
        });
    }
    
    //执行fn函数即getUserId()并且传入函数参数resolve 当fn执行完成返回的值传递给resolve函数
    fn(resolve);
}
```

结合例 1 中的代码来看，首先 `new Promise` 时，传给 `promise` 的函数发送异步请求；接着调用 `promise` 对象的 `then` 方法，注册请求成功的回调函数；然后当异步请求成功时调用 `resolve(results.id)`，该方法执行 `then` 注册的回调数组。

这个雏形能跑通最简单的场景，但离可用还差得远。往下每一小节都是发现一个漏洞再补一个漏洞的过程。

第一个漏洞：`then` 方法应该能够链式调用，上面这个版本显然不行，`then` 什么都没返回。想让它支持链式调用，看起来很简单：

```js
this.then = function (onFulfilled) {
    callbacks.push(onFulfilled);
    return this;
};
```

加一行 `return this` 就可以支持下面这种写法：

```js
// 例2
getUserId().then(function (id) {
    // 一些处理
}).then(function (id) {
    // 一些处理
});
```

但要提前说清楚，`return this` 只是**看起来**能链式调用，它并不符合规范。规范要求 `then` 返回一个**新的** promise，而 `return this` 返回的是同一个。差别在于：返回同一个的话，两个 `then` 拿到的都是同样的 `value`，第一个 `then` 里 `return` 的东西传不下去，链条上的数据流就断了。真正的做法在 2.6 节。

### 2.4 第二步：加入延时机制

上述代码还存在一个问题：如果在 `then` 方法注册回调之前 `resolve` 函数就执行了，怎么办？比如 `promise` 内部的函数是同步函数。

```js
// 例3
function getUserId() {
    return new Promise(function (resolve) {
        resolve(9876);
    });
}
getUserId().then(function (id) {
    // 一些处理
});
```

这个场景下，`resolve(9876)` 是同步执行的，那一刻 `callbacks` 还是个空数组，`forEach` 一次都不循环。等到下一行 `.then(...)` 把回调 push 进去的时候，`resolve` 早跑完了，回调永远不会被执行。

`Promises/A+` 规范明确要求回调需要通过异步方式执行，用以保证一致可靠的执行顺序。因此我们要加入一些处理，保证在 `resolve` 真正触发回调之前，`then` 方法已经注册完所有的回调。改造 `resolve` 函数：

```js
function resolve(value) {
    setTimeout(function() {
        callbacks.forEach(function (callback) {
            callback(value);
        });
    }, 0)
}
```

思路很简单，通过 `setTimeout` 机制把 `resolve` 中执行回调的逻辑推到任务队列里去，这样当它真正跑起来时，同一个同步流程里的 `then` 早就注册完了。

这里必须补一句原文没说的重要差别。**原生 Promise 的回调走的是微任务（microtask），不是 `setTimeout` 这种宏任务。** 手写实现里用 `setTimeout` 是为了简单，行为上「延后执行」的效果达到了，但执行时机不一样：微任务在当前同步代码跑完后立刻清空，宏任务要等到本轮事件循环的下一个阶段。所以下面这段代码，原生 Promise 打印 `1 2 3`，用 `setTimeout` 版实现会打印 `1 3 2`：

```js
console.log(1);
Promise.resolve().then(() => console.log(2));
console.log(3);
```

想更贴近原生，浏览器里可以用 `MutationObserver` 或者 `queueMicrotask`，Node 里用 `process.nextTick`。`queueMicrotask` 是现在最直接的选择，一行替换掉 `setTimeout` 就行。面试里能主动提这一点，比写对代码本身更能说明你理解了。

补完延时之后，新的漏洞又冒出来了：如果 `Promise` 异步操作已经成功，那么在成功之前注册的回调都会执行，但在成功之后再调用 `then` 注册的回调就再也不会执行了。而原生 Promise 是允许你在 resolve 之后随时 `then` 的，照样能立刻拿到值。

### 2.5 第三步：加入状态

解法是加入状态机制，也就是大家熟知的 `pending`、`fulfilled`、`rejected`。有了状态，`then` 就能判断「现在是不是已经有结果了」，有结果就直接执行，没结果才排队。

`Promises/A+` 规范的 `2.1 Promise States` 明确规定，`pending` 可以转化为 `fulfilled` 或 `rejected` 并且只能转化一次。如果 `pending` 转化到 `fulfilled` 状态，那么就不能再转化到 `rejected`。并且 `fulfilled` 和 `rejected` 状态只能由 `pending` 转化而来，两者之间不能互相转换。

![Promise 状态转换图，pending 单向转向 fulfilled 或 rejected 且不可逆](https://mengera88.github.io/images/promiseState.png)

原文这里 `rejected` 被误拆成了 `r` 加 `ejected`，已修正。

「只能转一次」这条约束的价值在实现层面很实在。前面讲 `race` 的时候提过，第一个 settle 的赢，靠的就是它；`all` 里多个失败只报第一个，靠的也是它。你只要在 `resolve` 和 `reject` 的入口判断一次 `state === 'pending'`，所有这些行为就都对了，不需要在每个组合方法里单独加锁。

```js
//改进后的代码是这样的：

function Promise(fn) {
    var state = 'pending',
        value = null,
        callbacks = [];
    this.then = function (onFulfilled) {
        if (state === 'pending') {
            callbacks.push(onFulfilled);
            return this;
        }
        onFulfilled(value);
        return this;
    };
    function resolve(newValue) {
        value = newValue;
        state = 'fulfilled';
        setTimeout(function () {
            callbacks.forEach(function (callback) {
                callback(value);
            });
        }, 0);
    }
    fn(resolve);
}
```

思路是这样的：`resolve` 执行时会将状态设置为 `fulfilled` 并存下 `value`，在此之后调用 `then` 添加的新回调，因为状态已经不是 `pending`，会直接 `onFulfilled(value)` 立即执行。

这版还有个小瑕疵要提一下：`resolve` 里没判断当前状态，多调几次 `resolve` 会反复触发回调。完整版会在入口加上 `if (currentState === PENDING)` 这道闸。

### 2.6 第四步：链式 Promise

这是整道题最难的一步，也是大多数人卡住的地方。

如果用户在 `then` 函数里面返回的仍然是一个 `Promise`，该如何解决？比如下面的例 4：

```js
// 例4
getUserId()
    .then(getUserJobById)
    .then(function (job) {
        // 对job的处理
    });
function getUserJobById(id) {
    return new Promise(function (resolve) {
        http.get(baseUrl + id, function(job) {
            resolve(job);
        });
    });
}
```

这种场景用过 promise 的人都遇到过，这就是所谓的链式 `Promise`。

链式 `Promise` 是指在当前 promise 达到 `fulfilled` 状态后，即开始进行下一个 promise（后邻 promise）。那么我们如何衔接当前 promise 和后邻 promise 呢？这是整个实现的难点。

规范给的答案是：`then` 方法里 `return` 一个新的 promise，对应 `Promises/A+` 规范的 `2.2.7`。

我一开始想的是「把后面那个 promise 直接返回出去不就行了」，但这条路走不通。原因是 `then` 必须**立刻**返回一个 promise，而这时候 `onFulfilled` 还没执行（要等异步完成），你根本不知道用户会返回什么。所以只能先造一个空壳 promise 返回出去，等 `onFulfilled` 真的执行完拿到结果，再想办法把结果灌进这个空壳里。

这个空壳就是下面代码里的关键角色，原文管它叫 `bridge promise`，桥接 promise。

下面来看看这段暗藏玄机的 `then` 方法和 `resolve` 方法改造代码：

```js
function Promise(fn) {
    var state = 'pending',
        value = null,
        callbacks = [];
    this.then = function (onFulfilled) {
        return new Promise(function (resolve) {
            handle({
                onFulfilled: onFulfilled || null,
                resolve: resolve
            });
        });
    };
    function handle(callback) {
        if (state === 'pending') {
            callbacks.push(callback);
            return;
        }
        //如果then中没有传递任何东西
        if(!callback.onFulfilled) {
            callback.resolve(value);
            return;
        }
        var ret = callback.onFulfilled(value);
        callback.resolve(ret);
    }
    
    function resolve(newValue) {
        if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
            var then = newValue.then;
            if (typeof then === 'function') {
                then.call(newValue, resolve);
                return;
            }
        }
        state = 'fulfilled';
        value = newValue;
        setTimeout(function () {
            callbacks.forEach(function (callback) {
                handle(callback);
            });
        }, 0);
    }
    fn(resolve);
}
```

这段代码里最玄的是 `resolve` 开头那几行。它检查传进来的 `newValue` 是不是一个有 `then` 方法的东西，如果是，就把自己的 `resolve` 交给它去调（`then.call(newValue, resolve)`），然后**直接 return，不改自己的状态**。

这一步就是整个链式调用的枢纽。翻译成人话：既然你 resolve 给我的是另一个 promise，那我就不自作主张了，我把「兑现我」这个动作交到你手上，你什么时候好我什么时候好。这也正好实现了 1.1 节最后记下的那条行为，「resolve 一个 Promise 等于把状态权交给它」。

我们结合例 4 的代码分析下上面的代码逻辑，为了方便阅读，把例 4 的代码贴在这里：

```js
// 例4
getUserId()
    .then(getUserJobById)
    .then(function (job) {
        // 对job的处理
    });
function getUserJobById(id) {
    return new Promise(function (resolve) {
        http.get(baseUrl + id, function(job) {
            resolve(job);
        });
    });
}
```

整条链路走下来是这样的（原文这几行里 `Promise` 和 `getUserJobById` 被反引号切断，读起来别扭，我重排了一遍）：

- `then` 方法中创建并返回了新的 `Promise` 实例，这是串行 Promise 的基础，也是链式调用能成立的原因
- `handle` 方法是 promise 内部的方法。`then` 传入的形参 `onFulfilled`，以及创建新 `Promise` 实例时传入的 `resolve`，两个一起被 push 到当前 promise 的 `callbacks` 队列中。这一步是衔接当前 promise 和后邻 promise 的关键
- `getUserId` 生成的 promise（简称 A）异步操作成功，执行其内部的 `resolve`，传入的参数正是异步操作的结果 `id`
- 调用 `handle` 处理 `callbacks` 队列中的回调，也就是 `getUserJobById` 方法，它生成一个新的 promise（简称 B）
- 接着执行之前由 A 的 `then` 方法生成的那个桥接 promise（简称 A-bridge）的 `resolve`，传入参数是 B。这种情况下会把 A-bridge 的 `resolve` 塞进 B 的 `then` 里，然后直接返回
- 在 B 异步操作成功时，执行它 `callbacks` 中的回调，也就是 A-bridge 的 `resolve`
- 最后执行 A-bridge 后邻 promise 的 `callbacks` 中的回调，也就是最外层那个处理 `job` 的函数

绕不绕？确实绕，我第一次读也是画了张图才理清。抓住一句话就够了：**桥接 promise 的 `resolve` 会被寄存到用户返回的那个 promise 上，等它完成时再被回调。** 所有的绕都是为了实现这一句。

### 2.7 第五步：失败处理

在异步操作失败时，标记其状态为 `rejected`，并执行注册的失败回调。

```js
//例5
function getUserId() {
    return new Promise(function(resolve, reject) {
        //异步请求
        http.get(url, function(error, results) {
            if (error) {
                return reject(error);
            }
            resolve(results.id)
        })
    })
}
getUserId().then(function(id) {
    //一些处理
}, function(error) {
    console.log(error)
})
```

原文这段例子有两个 bug，都改了。一是 `new Promise(function(resolve) {...})` 只接了 `resolve`，函数体里却调用了 `reject`，直接 `ReferenceError`，形参得写全。二是 `reject(error)` 后面没有 `return`，出错的情况下还会继续往下执行 `resolve(results.id)`，而 `results` 是 undefined，第二个报错紧接着就来了（虽然状态锁会让 resolve 无效，但取属性那一步先炸了）。

有了之前处理 `fulfilled` 状态的经验，支持错误处理变得很容易，只需要在注册回调、处理状态变更这两处加入对称的逻辑：

```js
function Promise(fn) {
    var state = 'pending',
        value = null,
        callbacks = [];
    this.then = function (onFulfilled, onRejected) {
        return new Promise(function (resolve, reject) {
            handle({
                onFulfilled: onFulfilled || null,
                onRejected: onRejected || null,
                resolve: resolve,
                reject: reject
            });
        });
    };
    function handle(callback) {
        if (state === 'pending') {
            callbacks.push(callback);
            return;
        }
        var cb = state === 'fulfilled' ? callback.onFulfilled : callback.onRejected,
            ret;
        if (cb === null) {
            cb = state === 'fulfilled' ? callback.resolve : callback.reject;
            cb(value);
            return;
        }
        ret = cb(value);
        callback.resolve(ret);
    }
    function resolve(newValue) {
        if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
            var then = newValue.then;
            if (typeof then === 'function') {
                then.call(newValue, resolve, reject);
                return;
            }
        }
        state = 'fulfilled';
        value = newValue;
        execute();
    }
    function reject(reason) {
        state = 'rejected';
        value = reason;
        execute();
    }
    function execute() {
        setTimeout(function () {
            callbacks.forEach(function (callback) {
                handle(callback);
            });
        }, 0);
    }
    fn(resolve, reject);
}
```

上述代码增加了新的 `reject` 方法供异步操作失败时调用，同时抽出了 `resolve` 和 `reject` 共用的部分，形成 `execute` 方法。

`handle` 里那几行值得单独看。它先按当前状态挑出该用哪个回调（`fulfilled` 用 `onFulfilled`，`rejected` 用 `onRejected`），如果这个回调是 `null`（用户没传），就退化成直接调桥接 promise 的 `resolve` 或 `reject`，把值原样传下去。

回到开头 1.2 节提到的错误冒泡，它就是上面这段代码白送的特性。在 `handle` 中发现没有指定失败回调时，会直接把桥接 promise（`then` 函数返回的那个）设为 `rejected` 状态，于是链条上下一个有失败回调的地方就能接到。一组异步操作往往对应一个实际功能，失败处理方法通常是一致的，所以「中间不管，最后一个 catch 兜住」这种写法非常实用。

```js
//例6
getUserId()
    .then(getUserJobById)
    .then(function (job) {
        // 处理job
    }, function (error) {
        // getUserId或者getUerJobById时出现的错误
        console.log(error);
    });
```

### 2.8 第六步：异常处理

前面处理的是「异步操作失败」，还有一类是「回调函数自己执行出错」。比如你在 `then` 里写了 `JSON.parse(非法字符串)`，异步操作明明成功了，但回调炸了。

如果在执行成功回调、失败回调时代码出错怎么办？对于这类异常，可以使用 `try-catch` 捕获错误，并将桥接 promise 设为 `rejected` 状态。`handle` 方法改造如下：

```js
function handle(callback) {
    if (state === 'pending') {
        callbacks.push(callback);
        return;
    }
    var cb = state === 'fulfilled' ? callback.onFulfilled : callback.onRejected,
        ret;
    if (cb === null) {
        cb = state === 'fulfilled' ? callback.resolve : callback.reject;
        cb(value);
        return;
    }
    try {
        ret = cb(value);
        callback.resolve(ret);
    } catch (e) {
        callback.reject(e);
    } 
}
```

这一步让「同步 throw」和「异步 reject」在 Promise 体系里合流了，都变成下一个 promise 的 rejected 状态。你在业务里能用一个 `.catch()` 同时接住网络错误和数据解析错误，就是靠这段 `try...catch`。

顺着说一句，这也解释了为什么 `.catch()` 要挂在链条最末尾。它只能接到它**前面**那些环节的错误，挂在中间的话，后面环节出的错它管不着。

如果在异步操作中多次执行 `resolve` 或者 `reject`，会重复处理后续回调，这个通过内置一个标志位就能解决，也就是前面反复提到的状态判断。

### 2.9 完整实现

把前面六步合起来，再补上规范里那些边界条款，就是下面这版完整实现。它比前面的演进版本多了两块东西：`then` 里对 `onResolved`/`onRejected` 非函数时的透传处理，以及独立出来的 `resolutionProcedure` 函数（对应规范 2.3 那一整节）。

代码有点长，先看构造函数部分。

```js
// 三种状态
const PENDING = "pending";
const RESOLVED = "resolved";
const REJECTED = "rejected";
// promise 接收一个函数参数，该函数会立即执行
function MyPromise(fn) {
  let _this = this;
  _this.currentState = PENDING;
  _this.value = undefined;
  // 用于保存 then 中的回调，只有当 promise
  // 状态为 pending 时才会缓存，并且每个实例至多缓存一个
  _this.resolvedCallbacks = [];
  _this.rejectedCallbacks = [];

  _this.resolve = function (value) {
    if (value instanceof MyPromise) {
      // 如果 value 是个 Promise，递归执行
      return value.then(_this.resolve, _this.reject)
    }
    setTimeout(() => { // 异步执行，保证执行顺序
      if (_this.currentState === PENDING) {
        _this.currentState = RESOLVED;
        _this.value = value;
        _this.resolvedCallbacks.forEach(cb => cb());
      }
    })
  };

  _this.reject = function (reason) {
    setTimeout(() => { // 异步执行，保证执行顺序
      if (_this.currentState === PENDING) {
        _this.currentState = REJECTED;
        _this.value = reason;
        _this.rejectedCallbacks.forEach(cb => cb());
      }
    })
  }
  // 用于解决以下问题
  // new Promise(() => throw Error('error))
  try {
    fn(_this.resolve, _this.reject);
  } catch (e) {
    _this.reject(e);
  }
}
```

构造函数这段里，`resolve` 开头那个 `if (value instanceof MyPromise)` 就是 2.6 节讲的「把状态权交出去」，只不过这版写得更直白，直接 `value.then(_this.resolve, _this.reject)` 递归下去。最后那个 `try...catch` 包住 `fn` 的调用，处理的是 `new Promise(() => { throw new Error() })` 这种在执行器里同步抛错的情况。

接着是 `then` 方法。它按当前状态分成三个分支，逻辑是重复的，只是取的回调和处理时机不同。

```js
MyPromise.prototype.then = function (onResolved, onRejected) {
  var self = this;
  // 规范 2.2.7，then 必须返回一个新的 promise
  var promise2;
  // 规范 2.2.1，onResolved 和 onRejected 都为可选参数
  // 如果类型不是函数需要忽略，同时也实现了透传
  // Promise.resolve(4).then().then((value) => console.log(value))
  onResolved = typeof onResolved === 'function' ? onResolved : v => v;
  onRejected = typeof onRejected === 'function' ? onRejected : r => { throw r };

  if (self.currentState === RESOLVED) {
    return (promise2 = new MyPromise(function (resolve, reject) {
      // 规范 2.2.4，保证 onFulfilled，onRjected 异步执行
      // 所以用了 setTimeout 包裹下
      setTimeout(function () {
        try {
          var x = onResolved(self.value);
          resolutionProcedure(promise2, x, resolve, reject);
        } catch (reason) {
          reject(reason);
        }
      });
    }));
  }

  if (self.currentState === REJECTED) {
    return (promise2 = new MyPromise(function (resolve, reject) {
      setTimeout(function () {
        // 异步执行onRejected
        try {
          var x = onRejected(self.value);
          resolutionProcedure(promise2, x, resolve, reject);
        } catch (reason) {
          reject(reason);
        }
      });
    }));
  }

  if (self.currentState === PENDING) {
    return (promise2 = new MyPromise(function (resolve, reject) {
      self.resolvedCallbacks.push(function () {
        // 考虑到可能会有报错，所以使用 try/catch 包裹
        try {
          var x = onResolved(self.value);
          resolutionProcedure(promise2, x, resolve, reject);
        } catch (r) {
          reject(r);
        }
      });

      self.rejectedCallbacks.push(function () {
        try {
          var x = onRejected(self.value);
          resolutionProcedure(promise2, x, resolve, reject);
        } catch (r) {
          reject(r);
        }
      });
    }));
  }
};
```

这段有两处要说。

一是那两行默认回调，`v => v` 和 `r => { throw r }`。它们让 `then()` 不传参数时值能原样穿过去，也让错误能继续往下冒泡，就是 2.7 节讲的冒泡机制在完整版里的写法。原文这里写的是 `r => throw r`，但 `throw` 是语句不是表达式，不能直接当箭头函数的返回体，这行会直接语法报错，必须加大括号写成 `r => { throw r }`。原文的注释「规范 2.2.」也漏了条款号，补成了 2.2.1。

二是三个分支里都用 `setTimeout` 包了一层。已经 settle 的情况看着可以同步执行，但规范 2.2.4 要求 `onFulfilled` 和 `onRejected` 必须在执行栈只剩平台代码时才被调用，也就是必须异步。少了这层包裹，`Promise.resolve(1).then(...)` 会同步执行回调，跟原生行为不一致。

最后是 `resolutionProcedure`，也就是规范 2.3 那一整节。这个函数负责处理「`then` 的回调返回了什么」这个问题，是整份规范里条款最密的地方。

```js
// 规范 2.3
function resolutionProcedure(promise2, x, resolve, reject) {
  // 规范 2.3.1，x 不能和 promise2 相同，避免循环引用
  if (promise2 === x) {
    return reject(new TypeError("Error"));
  }
  // 规范 2.3.2
  // 如果 x 为 Promise，状态为 pending 需要继续等待否则执行
  if (x instanceof MyPromise) {
    if (x.currentState === PENDING) {
      x.then(function (value) {
        // 再次调用该函数是为了确认 x resolve 的
        // 参数是什么类型，如果是基本类型就再次 resolve
        // 把值传给下个 then
        resolutionProcedure(promise2, value, resolve, reject);
      }, reject);
    } else {
      x.then(resolve, reject);
    }
    return;
  }
  // 规范 2.3.3.3.3
  // reject 或者 resolve 其中一个执行过得话，忽略其他的
  let called = false;
  // 规范 2.3.3，判断 x 是否为对象或者函数
  if (x !== null && (typeof x === "object" || typeof x === "function")) {
    // 规范 2.3.3.2，如果不能取出 then，就 reject
    try {
      // 规范 2.3.3.1
      let then = x.then;
      // 如果 then 是函数，调用 x.then
      if (typeof then === "function") {
        // 规范 2.3.3.3
        then.call(
          x,
          y => {
            if (called) return;
            called = true;
            // 规范 2.3.3.3.1
            resolutionProcedure(promise2, y, resolve, reject);
          },
          e => {
            if (called) return;
            called = true;
            reject(e);
          }
        );
      } else {
        // 规范 2.3.3.4
        resolve(x);
      }
    } catch (e) {
      if (called) return;
      called = true;
      reject(e);
    }
  } else {
    // 规范 2.3.4，x 为基本类型
    resolve(x);
  }
}
```

这个函数按 `x` 的类型分了四条路，逐条对一下规范就很清楚了。

`promise2 === x` 直接 reject（2.3.1），防的是 `const p = promise.then(() => p)` 这种自己等自己的死循环。不加这条判断，程序会永久挂在 pending，既不报错也不继续，排查起来很痛苦。

`x instanceof MyPromise` 时把状态权交给它（2.3.2）。注意这里 pending 和已 settle 分了两个分支，pending 时递归调 `resolutionProcedure` 而不是直接 `resolve`，因为 `x` 兑现出来的值可能又是一个 promise 或 thenable，得继续往下剥。

`x` 是对象或函数时，取它的 `then`（2.3.3）。这一段是整个实现里最讲究的地方，`let then = x.then` 这个取值动作本身被包在 `try` 里，因为 `then` 可能是个会抛错的 getter；`called` 这个标志位（2.3.3.3.3）保证 `resolve` 和 `reject` 只有一个能生效一次，防的是恶意或者写错的 thenable 把两个回调都调了，或者调了好几次。

剩下的情况就是基本类型，直接 `resolve`（2.3.4）。

这段代码之所以看着啰嗦，是因为它要对付**别人写的 thenable**。你没法假设外部对象行为规范，所以每一步取值、每一次回调都得防一手。这也是为什么 `Promise.resolve(jQuery.ajax())` 能正常工作，jQuery 的 deferred 并不完全符合 A+ 规范，但只要有 `then`，这段代码就能把它吸收进来。

想验证自己写的实现对不对，社区有一套官方测试用例 `promises-aplus-tests`，装上跑一遍就知道哪条条款漏了。我自己跑过一次，第一版漏了两条，都在 `resolutionProcedure` 这块。

### 2.10 小结

这里一定要注意的点是：`promise` 里面的 `then` 函数仅仅是注册了后续需要执行的代码，真正的执行是在 `resolve` 方法里面完成的。理清了这层，再来分析源码会省力得多。

回顾下 `Promise` 的实现过程，它主要使用了设计模式中的观察者模式：

- 通过 `Promise.prototype.then` 和 `Promise.prototype.catch` 方法将观察者方法注册到被观察者 `Promise` 对象中，同时返回一个新的 `Promise` 对象，以便可以链式调用
- 被观察者管理内部 `pending`、`fulfilled` 和 `rejected` 的状态转变，同时通过构造函数中传递的 `resolve` 和 `reject` 方法主动触发状态转变、通知观察者

和标准观察者模式有两处不同，值得留意。一是 Promise 的状态只能变一次，所以「通知」也只有一次，不像 EventEmitter 可以反复触发。二是晚订阅也能收到通知，状态已经确定之后再 `then`，回调照样会执行，这是普通事件机制做不到的（错过就错过了）。

## 三、几个和标准实现的差距

上面这版能通过大部分规范测试，但离原生还有距离，有几处差别得说清楚，不然容易在面试里说错。

**任务类型不同。** 前面提过，原生 Promise 回调是微任务，这版用 `setTimeout` 是宏任务。输出顺序题上会体现出来，换成 `queueMicrotask` 能更接近。

**`RESOLVED` 这个命名不准。** 完整实现里用的常量名是 `RESOLVED`，但规范里这个状态叫 `fulfilled`。`resolved` 和 `fulfilled` 在规范语境下不是一回事，一个 promise 可以是 resolved（已决议，锁定到另一个 promise 上了）但仍然 pending。原文的代码沿用了 `RESOLVED`，行为上没问题，术语上不严谨，聊规范的时候要注意区分。

**缺少 `finally` 和静态方法。** `Promise.prototype.finally`、`Promise.all`、`race`、`allSettled`、`any` 都还没实现。这几个都是在 `then` 之上组合出来的，不难，`all` 靠计数器加下标存储，`race` 靠状态锁，具体行为规则在 [Promise.all、race、allSettled、any 四个组合方法怎么选](https://feinterview.poetries.top/blog/es6-promise-promiseAll) 那篇里都列了。

**没有 unhandled rejection 检测。** 原生环境下一个 rejected 的 promise 没人 catch，浏览器会触发 `unhandledrejection` 事件并在控制台打红字，Node 某些版本会直接让进程退出。手写版本没有这个机制，错误会静悄悄地消失。

**`Promise.resolve` 的短路优化。** 规范要求 `Promise.resolve(p)` 在 `p` 已经是 Promise 时原样返回同一个引用，手写版通常会包一层新的。

## 总结

手写 Promise 这道题的正确打开方式不是背代码，而是记住每一步在解决什么问题。

`then` 存回调、`resolve` 取回调执行，这是十行就能搭出来的骨架。同步 `resolve` 会跑在 `then` 注册之前，所以要加延时；异步完成之后再注册的回调也得能跑，所以要加状态；`then` 要能链式调用并且把值传下去，所以必须返回一个新的 promise 而不是 `return this`。

最难的那一步是链式衔接。`then` 必须立刻返回一个 promise，而那时候用户会返回什么还不知道，所以只能先造一个桥接 promise，等回调执行完，把桥接 promise 的 `resolve` 寄存到用户返回的那个 promise 上。这一句是全篇的核心。

`resolutionProcedure` 那一大坨判断，全都是为了安全地对付外部 thenable：自引用要检测、取 `then` 要防抛错、回调要防重复调用。正是这段代码让 Promise 能吸收 jQuery deferred 这类不完全规范的对象。

最后，两个概念别搞混：`then` 只是注册，执行在 `resolve` 里；原生用微任务，`setTimeout` 版是宏任务，输出顺序不一样。这两点在面试里比写对代码更能体现理解深度。

## 参考

- [Promises/A+ 规范原文](https://promisesaplus.com/)
- [Promises/A+ 规范（中文）](http://www.ituring.com.cn/article/66566)
- [promises-aplus-tests 官方测试套件](https://github.com/promises-aplus/promises-tests)
- [MDN Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [ruanyifeng-Promise 对象](http://es6.ruanyifeng.com/#docs/promise)
- [前端进阶之旅](https://interview.poetries.top)
