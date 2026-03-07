---
title: ES6系列之Generator
date: 2018-12-21 16:20:31
tags: 
  - ES6
  - Javascript
categories: Front-End
---

## 一、什么是Generator 函数

### 1.1 语法

> 学习 `Generator` 语法，你需要了解`function*` 、`yield`、`next`三个基本概念。

- `function*` 用来声明一个函数是生成器函数，它比普通的函数声明多了一个`*`,`*`的位置比较随意可以挨着 `function` 关键字，也可以挨着函数名
- `yield` 产出的意思，这个关键字只能出现在生成器函数体内，但是生成器中也可以没有` yield` 关键字，函数遇到 `yield` 的时候会暂停，并把 `yield` 后面的表达式结果抛出去
- `next`作用是将代码的控制权交还给生成器函数

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


### 1.2 过程分析

```js
// 分析一个简单例子
function* helloGenerator() {
   yield "hello";
   yield "generator";
   return;
}

var h = helloGenerator();

console.log(h.next());//{ value: 'hello', done: false }
console.log(h.next());//{ value: 'generator', done: false }
console.log(h.next());//{ value: 'undefined', done: true }
```

- 创建了`h`对象，指向`helloGenerator`的句柄
- 第一次调用`next()`，执行到`"yield hello"`，暂缓执行,并返回了`"hello"`
- 第二次调用`next()`，继续上一次的执行，执行到`"yield generator"`,暂缓执行，并返回了`"generator"`。
- 第三次调用`next()`,直接执行`return`，并返回`done:true`，表明结束

> 经过上面的分析，`yield`实际就是暂缓执行的标示，每执行一次`next()`，相当于指针移动到下一个`yield`位置

![](https://poetries1.gitee.io/img-repo/2019/10/54.png)

**总结一下**，`Generator`函数是`ES6`提供的一种异步编程解决方案。通过`yield`标识位和`next()`方法调用，实现函数的分段执行

### 1.3 yield 表达式

> `yield`是`Generator`函数的暂缓执行的标识，对于`yield`只能配合`Generator`函数使用，在普通的函数中使用会报错


`Generator`函数中还有一种`yield*`这个表达方式

```js
function* foo(){
   	yield "a";
   	yield "b";
   }
   function* gen(x,y){
   	  yield 1;
   	  yield 2;
   	  yield* foo();
   	  yield 3;
   }
   var g = gen();
   console.log(g.next());//{value: 1, done: false}
   console.log(g.next());//{value: 2, done: false}
   console.log(g.next());//{value: "a", done: true}
   console.log(g.next());//{value: "b", done: true}
   console.log(g.next());//{value: "3", done: true
}
```

> 当执行`yield*`时，实际是遍历后面的`Generator`函数，等价于下面的写法：

```js

function* foo(){
   	yield "a";
   	yield "b";
}
function* gen(x,y){
    yield 1;
    yield 2;
    
    for(var value of foo()){
      yield value;
    }
    
    yield 3;
}
```

**注意**：`yield` 后面只能适配`Generator`函数

## 二、Generator应用场景


### 2.1 异步操作的同步化表达

> `Generator`函数的暂停执行的效果，意味着可以把异步操作写在`yield`表达式里面，等到调用`next`方法时再往后执行。这实际上等同于不需要写回调函数了，因为异步操作的后续操作可以放在`yield`表达式下面，反正要等到调用`next`方法时再执行。所以，`Generator`函数的一个重要实际意义就是用来处理异步操作，改写回调函数

```js
function* loadUI() {
  showLoadingScreen();
  yield loadUIDataAsynchronously();
  hideLoadingScreen();
}
var loader = loadUI();
// 加载UI
loader.next()

// 卸载UI
loader.next()
```

> 上面代码中，第一次调用`loadUI`函数时，该函数不会执行，仅返回一个遍历器。下一次对该遍历器调用`next`方法，则会显示`Loading`界面，并且异步加载数据。等到数据加载完成，再一次使用next方法，则会隐藏`Loading`界面。可以看到，这种写法的好处是所有`Loading`界面的逻辑，都被封装在一个函数，按部就班非常清晰

- 通过`Generator`函数部署`Ajax`操作，可以用同步的方式表达。

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

### 2.2 控制流管理

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

> 使用 `Generator` 函数可以这样写

```js
function * getData () {
    var res1 = yield getDataAsync('/page/1?param=123')
    console.log(res1)
    var res2 = yield getDataAsync(`/page/2?param=${res1.data}`)
    console.log(res2)
    var res3 = yield getDataAsync(`/page/2?param=${res2.data}`)
    console.log(res3))
}
```

> 然后我们这样逐步执行

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

> 上面的代码，我们逐步调用遍历器的 `next() `方法，由于每一个 `next()` 方法返回值的 `value` 属性为一个 `Promise` 对象，所以我们为其添加 `then `方法， 在 `then` 方法里面接着运行 `next` 方法挪移遍历器指针，直到 `Generator` 函数运行完成，实际上，这个过程我们不必手动完成，可以封装成一个简单的执行器

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

> `run `方法用来自动运行异步的 `Generator` 函数，其实就是一个递归的过程调用的过程。这样我们就不必手动执行 `Generator` 函数了。 有了 `run` 方法，我们只需要这样运行 `getData` 方法

```
run(getData)
```

> 这样，我们就可以把异步操作封装到 `Generator` 函数内部，使用 `run `方法作为 `Generator` 函数的自执行器，来处理异步。其实我们不难发现， `async/await` 方法相比于 `Generator` 处理异步的方式，有很多相似的地方，只不过 async/await 在语义化方面更加明显，同时 `async/await` 不需要我们手写执行器，其内部已经帮我们封装好了，这就是为什么说 `async/await `是 `Generator `函数处理异步的语法糖了


### 2.3 部署 Iterator 接口

> 利用 `Generator` 函数，可以在任意对象上部署 `Iterator` 接口。

```js
function* iterEntries(obj) {
  let keys = Object.keys(obj);
  for (let i=0; i < keys.length; i++) {
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

> 上述代码中，`myObj`是一个普通对象，通过`iterEntries`函数，就有了 `Iterator` 接口。也就是说，可以在任意对象上部署`next`方法

```js
// 下面是一个对数组部署 Iterator 接口的例子，尽管数组原生具有这个接口

function* makeSimpleGenerator(array){
  var nextIndex = 0;

  while(nextIndex < array.length){
    yield array[nextIndex++];
  }
}

var gen = makeSimpleGenerator(['yo', 'ya']);

gen.next().value // 'yo'
gen.next().value // 'ya'
gen.next().done  // true
```

## 三、更多参考

- [ryf教程-generator](http://es6.ruanyifeng.com/#docs/generator)



