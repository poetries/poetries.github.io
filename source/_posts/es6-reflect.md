---
title: ES6系列之Reflect的设计意图与API全览
description: Reflect 把散落在 Object 上的语言内部方法收拢成一套函数式 API，讲清楚它的四条设计理由、13 个方法的用法，以及为什么写 Proxy handler 时必须配合 Reflect 和 receiver 参数。
date: 2018-12-21 11:10:31
tags:
  - ES6
  - Javascript
  - Reflect
  - 元编程
categories: Front-End
---

第一次看 Vue 3 的响应式源码，很多人会卡在同一个地方：`get` trap 里明明写 `return target[key]` 就够了，为什么源码非要写成 `Reflect.get(target, key, receiver)`？多传一个参数到底有什么用？

这个问题的答案，正好就是 Reflect 存在的全部理由。它不是给 `Object` 换了个马甲，而是给「对象上的基础操作」提供了一套和 Proxy trap 严格一一对应的函数入口，让你在拦截之后能把默认行为原样补回去，还不丢失 `this` 指向。这篇把 Reflect 的四条设计理由讲清楚，逐个过一遍它的 API，重点落在 `receiver` 参数上。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Reflect 出现的四条设计理由，每条解决什么实际问题
- 报错改返回布尔值，对代码结构的影响
- 操作符变函数带来的可组合性
- `Reflect.set` 的 `receiver` 参数为什么会触发 `defineProperty` 拦截
- 13 个 Reflect 方法逐个过一遍，附对应的旧写法
- 什么时候该用 Reflect，什么时候 Object 就够了

## 一、简介

### 1.1 什么是 Reflect

Reflect 是为操作对象而提供的一套新 `API`。

它有两个和别的内置对象不一样的地方，值得先说清楚。第一，`Reflect` 不是构造函数，不能 `new`，它就是一个普通对象，上面挂了 13 个静态方法。第二，它的每一个方法都和 Proxy 的 trap 一一对应，名字和参数完全对得上。这个「一一对应」不是巧合，是设计出来的。

### 1.2 为什么要设计 Reflect

**第一，将 `Object` 对象的属于语言内部的方法放到 `Reflect` 对象上。**

`Object` 这个构造函数身上现在挂了一堆东西，有些是给日常业务用的（`Object.assign`、`Object.keys`），有些其实是语言内部的元操作（`Object.defineProperty`、`Object.getOwnPropertyDescriptor`）。这两类东西混在一起，职责很不清楚。Reflect 的第一个作用就是给后一类找个归宿，以后新增的语言内部方法只往 `Reflect` 上加，`Object` 保持干净。

**第二，将用老 `Object` 方法报错的情况，改为返回 `false`。**

```js
// 旧写法
try {
  Object.defineProperty(target, property, attributes);
  // success
} catch (e) {
  // failure
}
```

```js
// 新写法
if (Reflect.defineProperty(target, property, attributes)) {
  // success
} else {
  // failure
}
```

这个改动看着小，实际影响不小。`try...catch` 是为「异常」准备的控制流，而「这个属性不可配置所以定义失败」根本算不上异常，它是一个很正常的、可预期的结果。用布尔返回值表达可预期的失败，用异常表达真正的意外，代码读起来清楚多了。

**第三，让 `Object` 操作变成函数行为。**

```js
// 旧写法
'name' in Object // true
```

```js
// 新写法
Reflect.has(Object, 'name') // true
```

`in`、`delete` 这些是操作符，不是函数，没法传给别的函数当参数，也没法放进数组里遍历。变成函数之后就能组合了：

```js
const keys = ['a', 'b', 'c'];
const missing = keys.filter(k => !Reflect.has(obj, k));
// 用操作符写不出这么直白的一行
```

**第四，`Reflect` 与 `Proxy` 是相辅相成的，在 `Proxy` 上有的方法，在 `Reflect` 上就一定有。**

```js
let target = {}
let handler = {
  set(target, proName, proValue, receiver){
    // 确认对象的属性赋值成功
    let isSuccess = Reflect.set(target, proName, proValue, receiver)
    if(isSuccess){
      console.log("成功")
    }
    return isSuccess
  }
}
let proxy = new Proxy(target, handler)
```

这条是四条里最重要的。你拦截了一个操作，做完自己的事情之后，总得把默认行为执行掉，不然代理对象就废了。而「默认行为」是什么？就是 `Reflect` 上同名的那个方法。参数列表和 trap 完全一致，返回值也刚好是 trap 要求的类型，抄过去就能用。

确保对象的属性能正确赋值，广义上讲，即确保对象的原生行为能够正常进行，这就是 `Reflect` 的作用。

不用 Reflect 行不行？简单场景确实可以写 `target[key] = value`，但有两个问题。一是它没有返回值，你没法告诉 trap 赋值到底成没成功，而严格模式下 `set` trap 必须返回 `true`，你只能硬编码一个 `return true`，撒谎。二是丢了 `receiver`，原型链上的 getter/setter 里 `this` 会指错，这个下面 2.3 节展开。

## 二、Reflect 的 API

这 13 个方法和 `Proxy` 的 trap 一一对应，名字都能对上，学一遍等于学两个东西。

### 2.1 Reflect.get(target, property, receiver)

查找并返回 `target` 对象的 `property` 属性。

```js
let obj = {
  name: "poetries",
}
let result = Reflect.get(obj, "name")
console.log(result) // poetries
```

第三个参数 `receiver` 在有 getter 的时候才会显出作用：

```js
let obj = {
  // 属性 yu 部署了 getter 读取函数
  get yu(){
    // this 返回的是 Reflect.get 的 receiver 参数对象
    return this.name + this.age
  }
}

let receiver = {
  name: "shen",
  age: "18",
}

let result = Reflect.get(obj, "yu", receiver)
console.log(result) // shen18
```

`yu` 这个 getter 定义在 `obj` 上，但执行的时候 `this` 被换成了 `receiver`，所以拿到的是 `shen` 和 `18`，而不是 `obj` 上的（`obj` 上压根没有 `name` 和 `age`，不传 receiver 的话结果是 `undefinedundefined`）。

一句话概括：**`receiver` 决定了 getter/setter 执行时 `this` 指向谁。**

注意：如果 `Reflect.get()` 的第一个参数不是对象，会抛 `TypeError`。

### 2.2 Reflect.set(target, propName, propValue, receiver)

设置 `target` 对象的 `propName` 属性为 `propValue`，返回一个布尔值表示是否成功。

```js
let obj = {
  name: "poetries"
}

let result = Reflect.set(obj, "name", "静观流叶")
console.log(result) // true
console.log(obj.name) // 静观流叶
```

### 2.3 Reflect.set 与 Proxy.set 的配合

`Reflect.set` 与 `Proxy` 的 `set` 联合使用，并且传入 `receiver`，会额外触发一次定义属性的操作。

```js
let obj = {
  name: "chen"
}

let handler = {
  set(target, key, value, receiver){
    console.log("Proxy 拦截赋值操作")
    // Reflect 完成赋值操作
    return Reflect.set(target, key, value, receiver)
  },
  defineProperty(target, key, attribute){
    console.log("Proxy 拦截定义属性操作")
    // Reflect 完成定义属性操作
    return Reflect.defineProperty(target, key, attribute)
  }
}

let proxy = new Proxy(obj, handler)
proxy.name = "ya"
// Proxy 拦截赋值操作
// Proxy 拦截定义属性操作
```

原文这两个 trap 都没有 `return`，严格模式下会直接抛错，上面补上了。

那为什么 `Reflect.set()` 传入 receiver 参数，就会触发定义属性的操作？

原文的解释是「因为 `Proxy.set()` 中的 `receiver` 是 `Proxy` 的实例，即 `obj`」，这句有个事实错误，`receiver` 是 proxy 对象本身，不是 `obj`，两者是不同的对象。

正确的链路是这样的。`set` trap 收到的第四个参数 `receiver` 就是那个 proxy 对象。你把它原样传给 `Reflect.set`，`Reflect.set` 的规则是「把属性赋到 receiver 身上」，而 receiver 是 proxy，于是这次赋值又走了一遍代理。赋值到底怎么落地？内部会调 `[[DefineOwnProperty]]`，也就是触发 `defineProperty` trap。所以你看到了两条日志。

这个行为不是 bug，但确实容易写出无限递归。如果你在 `defineProperty` trap 里又往 receiver 上写，那就转不出来了。上面这段之所以安全，是因为 `Reflect.defineProperty` 的第一个参数是 `target` 而不是 proxy，落到了原对象上，链条终止。

那到底该不该传 `receiver`？我的判断是：涉及原型链继承和 getter/setter 的场景必须传，否则 `this` 会指错，Vue 3 的 `reactive` 就是这么做的；纯粹给自己对象读写、没有继承关系的简单场景，不传也不会出问题。Proxy 那边完整的 trap 清单和实战用法我写在 [ES6系列之 Proxy 的拦截机制与实战场景](https://feinterview.poetries.top/blog/es6-proxy) 里，两篇是配套的。

### 2.4 Reflect.has(obj, name)

对应 `in` 操作符，也对应 Proxy 的 `has` trap。

```js
var obj = {
  name: "poetries",
};
```

```js
// 旧写法
'name' in obj // true
```

```js
// 新写法
Reflect.has(obj, 'name') // true
```

注意 `has` 会沿着原型链查找，和 `in` 的行为一致。只想查自身属性得用 `Object.prototype.hasOwnProperty.call(obj, 'name')` 或者更现代的 `Object.hasOwn(obj, 'name')`。

### 2.5 Reflect.deleteProperty(obj, name)

删除对象的属性，返回布尔值表示是否删除成功。

```js
// 旧写法
delete obj.name;
```

```js
// 新写法
Reflect.deleteProperty(obj, 'name');
```

`delete` 操作符也返回布尔值，这一对差别不大，主要价值是「能当函数用」。

### 2.6 Reflect.construct(target, args)

```js
function Person(name) {
  this.name = name;
}
```

```js
// 旧 new 写法
let person = new Person('poetries')
```

```js
// 新写法：Reflect.construct 的写法
let person = Reflect.construct(Person, ['poetries']);
```

参数用数组传，这一点在参数个数不确定的时候很实用。以前想动态传参给构造函数，得写 `new (Function.prototype.bind.apply(Person, [null, ...args]))()` 这种鬼东西，现在一行搞定。

`Reflect.construct` 还有个可选的第三个参数 `newTarget`，用来指定新对象的原型来自哪个构造函数。实现继承和自定义元素的时候会用到，日常业务基本碰不到。

### 2.7 Reflect.getPrototypeOf(obj)

用于读取对象的原型，对应 `Object.getPrototypeOf(obj)`。

差别在于参数不是对象时的行为：`Object.getPrototypeOf` 会先把参数转成对象，`Reflect.getPrototypeOf` 直接抛 `TypeError`。Reflect 这一系列方法普遍更严格，不做隐式转换。

### 2.8 Reflect.setPrototypeOf(obj, newProto)

设置目标对象的原型，对应 `Object.setPrototypeOf(obj, newProto)` 方法，返回布尔值。

这个方法能用但不建议用。运行时改原型会让 V8 的隐藏类优化失效，那个对象后续的所有属性访问都会变慢。要改原型关系，用 `Object.create` 在创建时就定好。

### 2.9 Reflect.apply(func, thisArg, args)

以指定的 `this` 和参数数组调用一个函数。

```js
let array = [1, 2, 3, 4, 5, 6]
```

```js
// 旧写法
let small = Math.min.apply(Math, array) // 1
let big = Math.max.apply(Math, array) // 6
let type = Object.prototype.toString.call(small) // "[object Number]"
```

```js
// 新写法
const small = Reflect.apply(Math.min, Math, array)
const big = Reflect.apply(Math.max, Math, array)
// 第二个参数是被借用方法执行时的 this，这里要判断 small 的类型就把它传进去
const type = Reflect.apply(Object.prototype.toString, small, [])
```

`Reflect.apply` 真正的价值在于「不怕被改」。`fn.apply(...)` 依赖 `fn` 身上那个继承来的 `apply` 方法，万一目标对象自己定义了一个同名的 `apply` 属性，或者原型被人动过手脚，这行代码就废了。`Reflect.apply` 走的是引擎内部的调用逻辑，谁都改不了它。写通用库的时候这一点很关键。

### 2.10 Reflect.defineProperty(target, propertyKey, attributes)

```js
function MyDate() {
  // ...
}
```

```js
// 旧写法
Object.defineProperty(MyDate, 'now', {
  value: () => Date.now()
});
```

```js
// 新写法
Reflect.defineProperty(MyDate, 'now', {
  value: () => Date.now()
});
```

与 Proxy 的 `defineProperty` trap 配合使用：

```js
let proxy = new Proxy({}, {
  defineProperty(target, prop, descriptor) {
    console.log(descriptor);
    return Reflect.defineProperty(target, prop, descriptor);
  }
});

proxy.name = 'chen';
// {value: "chen", writable: true, enumerable: true, configurable: true}
proxy.name // "chen"
```

原文这段有两处笔误：`proxy .name= 'chen'` 中间多了空格，以及最后一行写成了 `p.name`，变量 `p` 根本不存在。都已改正。

这里有个细节容易被忽略：只写了 `defineProperty` trap 没写 `set` trap，直接给 `proxy.name` 赋值一样能拦到。原因是赋值操作在没有 `set` trap 时会走默认逻辑，默认逻辑内部会调用 `[[DefineOwnProperty]]`，于是落到了 `defineProperty` trap 上。这也从另一个角度印证了 2.3 节讲的那条链路。

### 2.11 Reflect.getOwnPropertyDescriptor(target, propertyKey)

基本等同于 `Object.getOwnPropertyDescriptor`，用于得到指定属性的描述对象。

```js
const obj = { a: 1 };
Reflect.getOwnPropertyDescriptor(obj, 'a');
// {value: 1, writable: true, enumerable: true, configurable: true}
```

区别还是那条：第一个参数不是对象时，`Object` 版本返回 `undefined`，`Reflect` 版本抛 `TypeError`。

### 2.12 Reflect.isExtensible(target)

对应 `Object.isExtensible`，返回一个布尔值，表示当前对象是否可扩展（能不能加新属性）。

### 2.13 Reflect.preventExtensions(target)

对应 `Object.preventExtensions` 方法，用于让一个对象变为不可扩展。它返回一个布尔值，表示是否操作成功。

### 2.14 Reflect.ownKeys(target)

用于返回对象的所有自身属性键，包括字符串键和 Symbol 键。

```js
const s = Symbol('s');
const obj = { a: 1, [s]: 2 };
Reflect.ownKeys(obj); // ['a', Symbol(s)]
```

它相当于 `Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj))`，是唯一一个能一次性拿全所有自身键的方法，不可枚举的也能拿到。返回顺序是固定的：整数键升序排前面，然后是字符串键按定义顺序，最后是 Symbol 键。Symbol 键在各种遍历方式下的可见性我在 [ES6系列之 Symbol 的唯一性与内置符号](https://feinterview.poetries.top/blog/es6-symbol) 里做过一张对照表。

## 三、什么时候用 Reflect

过完 API 再回头看，Reflect 大致有三个场景是真的该用。

**写 Proxy handler 的时候，无脑用。** 这是 Reflect 最核心的用途。每个 trap 里做完自己的逻辑，最后一行 `return Reflect.同名方法(...arguments)`，参数原样透传，行为和默认一致，返回值类型也对。不用 Reflect 就得自己拼默认行为，容易漏掉边界。

**需要把操作当值传递的时候。** `filter(k => Reflect.has(obj, k))` 这类写法，用操作符表达不出来。

**写通用库、不信任输入对象的时候。** `Reflect.apply` 不受目标对象上同名属性的干扰，`Reflect.getPrototypeOf` 不做隐式转换直接报错，这些「更严格、更不可篡改」的特性在库代码里有价值。

除此之外，业务代码里 `Object.keys`、`obj.a = 1`、`'a' in obj` 这些老写法完全够用，没必要为了新而新，硬换成 Reflect 反而降低可读性。装饰器那边曾经流行的 `Reflect.metadata` 其实不属于 Reflect 标准，它来自 `reflect-metadata` 这个第三方库和一个独立提案，这一点在 [ES6系列之装饰器的原理与实战用法](https://feinterview.poetries.top/blog/es6-decorator) 里有说明，别搞混了。

## 总结

Reflect 的定位是「语言内部操作的函数化入口」。四条设计理由里，前三条（收拢内部方法、报错改返回值、操作符变函数）是顺带的收益，第四条和 Proxy 配套才是它真正的存在意义。

用起来抓住两个点。一是每个 Reflect 方法都和一个 Proxy trap 严格对应，参数一致返回值一致，写 handler 时把 `arguments` 原样转发过去就是默认行为。二是 `receiver` 参数决定了 getter/setter 里 `this` 指向谁，涉及原型链和访问器属性时必须正确传递，否则响应式框架会在继承场景下丢掉依赖收集。

`Reflect.set` 传 receiver 会额外触发 `defineProperty` trap，这不是 bug，是赋值操作内部会走 `[[DefineOwnProperty]]` 的必然结果。知道这条链路，就不会被两条日志吓到，也能避免写出无限递归。

业务代码里不用刻意改成 Reflect 风格。它是给元编程准备的工具，日常读写对象老写法更直观。

## 参考

- [MDN Reflect](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect)
- [MDN Reflect.set](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/set)
- [MDN Reflect.ownKeys](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/ownKeys)
- [ryf教程-Reflect](https://es6.ruanyifeng.com/#docs/reflect)
- [前端进阶之旅](https://interview.poetries.top)
