---
title: ES6系列之Symbol的唯一性与内置符号
description: Symbol 为什么能保证属性名不冲突，Symbol.for 的全局注册表和普通 Symbol 差在哪，以及 Symbol.iterator、Symbol.toStringTag 这类内置符号是如何被语言当作协议钩子来用的。
date: 2018-12-21 15:00:21
tags:
  - ES6
  - Javascript
  - Symbol
  - 数据类型
categories: Front-End
---

给别人的对象上挂一个属性，这件事听着简单，做起来其实一直有风险。你写一个日志库，想在用户传进来的对象上标记一个 `__logged__`，怎么保证用户自己没用过这个名字？加下划线、加前缀、加随机数，都是概率游戏，赌的是不撞车。

Symbol 就是来终结这个赌局的。它生成的值天生独一无二，拿它当属性名，谁也覆盖不了谁。更有意思的是，语言自己也在用这套机制，`for...of` 能遍历什么、`instanceof` 怎么判断、`Object.prototype.toString` 输出什么标签，背后全是几个内置 Symbol 在做钩子。这篇把 Symbol 的基本行为和这套「协议钩子」的设计一起讲清楚。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Symbol 作为原始类型的定位，以及它和 BigInt 的先后关系
- 唯一性怎么体现，为什么不能用 `new`
- `Symbol.for` 的全局注册表和普通 Symbol 的区别
- 内置符号（well-known symbols）是怎么当协议钩子用的
- Symbol 属性在各种遍历方式下的可见性对照
- 什么场景真的该用 Symbol，什么场景是过度设计

## 一、简介

`ES6` 新加入了一种原始数据类型 `Symbol`，表示独一无二的值。在 ES6 那个时间点，它是 JS 的第七种数据类型，前六种是 `Undefined`、`Null`、布尔值（`Boolean`）、字符串（`String`）、数值（`Number`）、对象（`Object`）。

这里补一句时效性说明。原文写于 2018 年，那会儿说「第七种」是准确的。后来 ES2020 又加了 `BigInt`，所以现在的完整清单是七种原始类型（`Undefined`、`Null`、`Boolean`、`String`、`Number`、`Symbol`、`BigInt`）加上 `Object`。数数的说法变了，Symbol 本身的行为没变。

对象的属性名现在可以有两种类型，一种是原来就有的字符串，另一种就是新增的 `Symbol` 类型。凡是属性名属于 `Symbol` 类型，就都是独一无二的，可以保证不会与其他属性名产生冲突。

### 1.1 定义

```
Symbol([description])
```

参数 `description` 是一个可选参数，是一个字符串，可以用于调试，但不能通过它访问到 `Symbol` 自身。

```js
var sym1 = Symbol();
var sym2 = Symbol('foo');
var sym3 = Symbol('foo');
```

`description` 纯粹是给人看的。你在 DevTools 里看到 `Symbol(userId)`，能一眼知道这是干嘛的，仅此而已，代码逻辑一点都碰不到它。ES2019 之后可以用 `sym.description` 直接读回这个字符串，比 `sym.toString().slice(7, -1)` 那种土办法干净不少。

### 1.2 值唯一性

每一个 `Symbol()` 返回的值都是唯一的。一个 `Symbol` 值能作为对象属性的标识符，这是该数据类型仅有的目的。

```js
Symbol("yuan") === Symbol("yuan"); // false
```

原文这里写的是「这是改数据类型仅有的目的」，「改」应为「该」，顺手改了。

两个描述一模一样的 Symbol 依然不相等，这就是唯一性的全部含义。回到开头那个日志库的问题，现在解法很干净：

```js
// logger.js
const LOGGED = Symbol('logged');

export function markLogged(obj) {
  obj[LOGGED] = true;
}
export function isLogged(obj) {
  return obj[LOGGED] === true;
}
```

`LOGGED` 这个值只有你的模块持有，用户就算自己也写了 `Symbol('logged')`，那也是另一个值，两边井水不犯河水。

### 1.3 不可以使用 new 操作符

```js
var sym = new Symbol(); // TypeError 报错
```

原因很直白，Symbol 是原始类型，不是对象。`new` 的语义是造一个对象出来，跟原始类型天然冲突。`Number`、`String`、`Boolean` 之所以能 `new`（虽然没人这么写），是历史包袱，Symbol 是新加的，标准直接把这条路封了。

### 1.4 结合 Object() 函数

结合 `Object()` 函数，可以创建一个 `Symbol` 包装器对象。

```js
var sym = Symbol();
typeof sym;  // "symbol"
var symobj = Object(sym);
typeof symobj; // "object"
```

原文这一行的注释末尾混进了两个全角弯引号字符，已经清理掉。这类字符在 markdown 双引擎渲染下容易出乱码，属于顺手要修的东西。

包装对象日常几乎用不上，知道 `typeof` 会从 `"symbol"` 变成 `"object"` 就行，免得类型判断的时候被绕进去。

### 1.5 全局共享 Symbol

使用 `Symbol.for()` 方法会根据给定的键 `key`，从运行时的 `symbol` 注册表中找到对应的 `symbol`。如果找到了就返回它，否则新建一个与该键关联的 `symbol`，并放入全局 `symbol` 注册表中。

这一条和 1.2 的唯一性看起来矛盾，其实是两套不同的用途，第三节会展开讲。

### 1.6 在对象中查找 Symbol 属性

```js
var obj = {};
var a = Symbol("a");
var b = Symbol.for("b");

obj[a] = "localSymbol";
obj[b] = "globalSymbol";

var objectSymbols = Object.getOwnPropertySymbols(obj);

console.log(objectSymbols)         // [Symbol(a), Symbol(b)]
```

注意 `Object.keys(obj)` 在这里会返回空数组。Symbol 属性不参与常规遍历，想拿到它们只有 `Object.getOwnPropertySymbols` 和 `Reflect.ownKeys` 两条路。这个特性有好有坏，第四节专门对照。

## 二、内置符号：语言自己开的钩子

这一节是 Symbol 里最有意思的部分。除了让你造独一无二的属性名，标准还预置了一批 Symbol，挂在 `Symbol` 对象上，用来让你改写语言层面的默认行为。它们有个专门的名字，叫 well-known symbols。

### 2.1 length 属性

```js
// Symbol 函数本身的 length 为 0
Symbol.length // 0
```

这个跟内置符号无关，只是 `Symbol` 这个函数对象的 `length`。函数的 `length` 表示形参个数，`description` 是可选参数不计入，所以是 0。

### 2.2 Symbol.iterator 与迭代协议

`Symbol.iterator` 为每一个对象定义了默认的迭代器。这个迭代器可以被 `for...of` 循环使用。

```js
// 自定义迭代器
var myIterator = {};
myIterator[Symbol.iterator] = function* () {
    yield 1;
    yield 2;
    yield 3;
};
[...myIterator] // [1, 2, 3]
```

一个普通对象本来是不能展开的，`[...{}]` 直接报 `object is not iterable`。挂上 `Symbol.iterator` 之后它就成了可迭代对象，`for...of`、展开运算符、解构赋值、`Array.from`、`Promise.all` 全都能吃它。

这就是「协议钩子」的意思。语言不关心你的对象是什么类，只看你有没有实现那个约定的 Symbol 键。用 Symbol 而不是字符串 `'iterator'` 来当这个键，就是为了避免和用户自己定义的属性撞名。这套用生成器来部署迭代接口的写法，我在 [ES6系列之 Generator 函数的暂停与自动执行](https://feinterview.poetries.top/blog/es6-generator) 里有更完整的展开。

`Symbol` 属性和 `for...in` 迭代：

```js
var obj = {};
obj[Symbol("a")] = "a";
obj[Symbol.for("b")] = "b";
obj["c"] = "c";
obj.d = "d";

for (var i in obj) {
   console.log(i);
}
// "c"
// "d"
```

两个 Symbol 键被完全跳过了。

### 2.3 正则相关的四个符号

这一组符号用于标识对象是否具有正则表达式的行为。`Symbol.match` 表示对象是否具有指定的匹配的正则表达式。

```js
"/bar/".startsWith(/bar/);
// Throws TypeError，因为 /bar/ 是一个正则表达式
// 且 Symbol.match 没有修改
```

`startsWith` 这类方法会先检查参数上有没有 `Symbol.match`，有就认为它是正则，直接抛 `TypeError`。这是标准刻意留的一道保险，防止你把正则当字符串误用。

如果你将 `Symbol.match` 置为 `false`，使用 `match` 属性的表达式检查会认为该对象不是正则表达式对象，`startsWith` 和 `endsWith` 方法将不会抛出 `TypeError`。

```js
var re = /foo/;
re[Symbol.match] = false;

"/foo/".startsWith(re); // true
"/baz/".endsWith(re);   // false
```

这两行的结果值得解释一下。关掉 `Symbol.match` 之后，`re` 被当成普通对象，参数会被转成字符串，`String(/foo/)` 就是 `"/foo/"`。所以第一行相当于 `"/foo/".startsWith("/foo/")`，为 `true`；第二行相当于 `"/baz/".endsWith("/foo/")`，为 `false`。

另外三个是 `Symbol.replace`、`Symbol.search`、`Symbol.split`，分别指定了 `String.prototype.replace()`、`String.prototype.search()`、`String.prototype.split()` 在遇到这个对象时调用的方法。改写它们你就能造出一个「行为像正则但不是正则」的东西，日常业务基本用不到，但看到某些库里有奇怪的字符串处理行为时，可以往这里查。

### 2.4 hasInstance 与 toStringTag

`Symbol.hasInstance` 是一个用来确定构造器对象识别的对象是否为它的实例的方法。它决定的其实就是 `instanceof` 怎么判。

```js
class Even {
  static [Symbol.hasInstance](num) {
    return Number(num) % 2 === 0;
  }
}
console.log(2 instanceof Even);  // true
console.log(3 instanceof Even);  // false
```

`Symbol.toStringTag` 用于对象的默认描述的字符串值，也就是 `Object.prototype.toString()` 输出的那个尾巴。

```js
class Collection {
  get [Symbol.toStringTag]() { return 'Collection'; }
}
Object.prototype.toString.call(new Collection()); // "[object Collection]"
```

很多人写类型判断工具函数会用 `Object.prototype.toString.call(x)`，它之所以能区分 `Map`、`Set`、`Promise`，靠的就是这些内置类都设置了自己的 `toStringTag`。

## 三、静态方法与全局注册表

### 3.1 Symbol.for(key)

`Symbol.for` 根据给定的键 `key`，从运行时的 `symbol` 注册表中找到对应的 `symbol`。如果找到了则返回它，否则新建一个与该键关联的 `symbol` 并放入全局 `symbol` 注册表。

- 这里的参数 `key` 是一个字符串，作为 `symbol` 注册表中与某 `symbol` 关联的键
- 和 `Symbol()` 不同的是，用 `Symbol.for()` 方法创建的 `symbol` 会被放入一个全局 symbol 注册表中
- `Symbol.for()` 并不是每次都会创建一个新的 symbol，它会首先检查给定的 `key` 是否已经在注册表中，如果在就直接返回上次存储的那个，否则再新建

```js
Symbol.for("foo"); // 创建一个 symbol 并放入 symbol 注册表中，键为 "foo"
Symbol.for("foo"); // 从 symbol 注册表中读取键为 "foo" 的 symbol

Symbol.for("bar") === Symbol.for("bar"); // true，证明了上面说的
Symbol("bar") === Symbol("bar"); // false，Symbol() 函数每次都会返回新的一个 symbol

var sym = Symbol.for("mario");
sym.toString();
// "Symbol(mario)"，mario 既是该 symbol 在注册表中的键名，又是该 symbol 自身的描述字符串
```

那问题来了，既然 Symbol 卖点就是唯一性，为什么还要提供一个能重复拿到同一个值的入口？

因为跨作用域的场景需要它。`Symbol()` 创建的值只在你能拿到那个变量的地方有用，一旦跨了 iframe、跨了 realm、或者两个互不知道对方存在的模块想约定同一个键，普通 Symbol 就传不过去了。全局注册表是按字符串 key 查的，任何地方 `Symbol.for('app.state')` 拿到的都是同一个值。

代价是，注册表是全局共享的，key 会撞。所以社区惯例是给 key 加命名空间前缀，比如 `Symbol.for('react.element')` 这种，React 内部就是这么标记元素类型的。

### 3.2 Symbol.keyFor(sym)

该方法用来获取 `symbol` 注册表中与某个 `symbol` 关联的键。参数 `sym` 是指存储在 `symbol` 注册表中的某个 `symbol`。

```js
// 创建一个 symbol 并放入 Symbol 注册表，key 为 "foo"
var globalSym = Symbol.for("foo");
Symbol.keyFor(globalSym); // "foo"

// 创建一个 symbol，但不放入 symbol 注册表中
var localSym = Symbol();
Symbol.keyFor(localSym); // undefined，所以是找不到 key 的
```

`keyFor` 只认注册表里的东西，这也是判断一个 Symbol 是不是全局 Symbol 最直接的办法。

## 四、遍历时的可见性

`Symbol` 定义的属性不会出现在下面这些遍历方式中：

- `for in`：可获取原型属性，不可获取不可枚举属性
- `for of`：不可遍历普通对象，可遍历数组等可迭代对象
- `Object.keys`：原型属性和不可枚举属性都不能获取
- `Object.getOwnPropertyNames`：不可获取原型属性，可获取不可枚举属性
- `JSON.stringify`：原型属性和不可枚举属性都不能获取
- `Reflect.ownKeys`：可获取不可枚举属性和 `Symbol`，不可获取原型属性

原文第四条写成了 `Object.getOwnPropertyByNames`，没有这个 API，正确的名字是 `Object.getOwnPropertyNames`，上面已经改正。

```js
var p = {w: 2};
var obj = Object.create(p);
obj.a = 1;
Object.defineProperty(obj, "b", {
    value: 123
})
var a = Symbol('a');
var b = Symbol('b');

obj[a] = 'Hello';
obj[b] = 'World';

Reflect.ownKeys(obj); // ["a", "b", Symbol(a), Symbol(b)]
```

原文这里的注释只写了两个 Symbol，实际 `Reflect.ownKeys` 会把字符串键一起返回，而且顺序是「整数键 → 字符串键 → Symbol 键」，所以完整结果是 `["a", "b", Symbol(a), Symbol(b)]`。上面已经改正。

或者使用 `Object.getOwnPropertySymbols(obj)` 只取 Symbol 键。

这里有个坑要注意。`JSON.stringify` 会完全丢掉 Symbol 键，所以任何需要序列化持久化的数据，都不能把关键信息放在 Symbol 属性上。我见过有人用 Symbol 存对象的 id，结果存 localStorage 再读回来，id 就没了。

反过来说，这个特性也可以当成优点用。有些内部状态你**就是不想**被序列化出去，挂在 Symbol 上正好，`JSON.stringify` 天然过滤掉。

还有一点要澄清，Symbol 属性不是私有属性。`Object.getOwnPropertySymbols` 和 `Reflect.ownKeys` 都能列出来，只要拿到对象就能反查。它提供的是「不会撞名」和「不会被误遍历」，不是访问控制。真要私有，现在有类的 `#` 私有字段，或者用 `Proxy` 做拦截，Proxy 那套写法我整理在 [ES6系列之 Proxy 的拦截机制与实战场景](https://feinterview.poetries.top/blog/es6-proxy) 里。

## 五、什么时候真的该用 Symbol

说实话，业务代码里直接写 Symbol 的机会不多。我自己总结下来，值得用的就三类场景。

第一类是**给别人的对象打标记**，也就是开头那个日志库的例子。你的模块要往外部对象上挂东西，用 Symbol 是唯一能保证不冲突的做法。

第二类是**实现语言协议**。想让自己的类支持 `for...of`，就实现 `Symbol.iterator`；想让 `Object.prototype.toString` 输出有意义的标签，就设 `Symbol.toStringTag`。这类用法不是选择题，是标准要求你这么写。

第三类是**枚举常量**。用 Symbol 当枚举值，天生不会和数字、字符串意外相等，误比较会直接暴露出来。不过代价是不能序列化、调试时看不到具体值，很多团队还是选字符串常量，也没什么问题。

反过来，有一类用法我觉得是过度设计，就是「用 Symbol 模拟私有属性」。它挡不住 `Object.getOwnPropertySymbols`，安全性是假的；同时又让代码变复杂、丢失可序列化性。现代 JS 有 `#privateField`，语法上真正私有，没必要用 Symbol 绕。

另外顺带提一句，如果你需要的是「给对象附加数据但不影响对象生命周期」，那该用的是 `WeakMap` 而不是 Symbol 属性。两者场景很像但机制完全不同，`WeakMap` 那套弱引用集合我整理在 [Set WeakSet Map WeakMap 梳理](https://feinterview.poetries.top/blog/es6-set-weakSet-map-weakMap) 这篇。

## 总结

Symbol 只做了一件事，提供一种「保证不重复」的值，然后允许它当属性名用。围绕这一件事，衍生出两条使用路径。

一条是你自己造 Symbol 来占坑，`Symbol()` 每次都返回新值，谁持有变量谁能访问，用来给外部对象打标记最合适。要跨作用域共享同一个值就走 `Symbol.for`，代价是 key 全局共享要加命名空间前缀。

另一条是用标准预置的内置符号去改写语言行为。`Symbol.iterator` 决定能不能 `for...of`，`Symbol.hasInstance` 决定 `instanceof` 怎么判，`Symbol.toStringTag` 决定类型标签。这套设计的巧妙之处在于，用一个不可能撞名的键当协议钩子，语言和用户代码互不干扰。

遍历这块记住一条就够了：Symbol 键只能通过 `Object.getOwnPropertySymbols` 和 `Reflect.ownKeys` 拿到，`Object.keys`、`for...in`、`JSON.stringify` 一律跳过。所以别把需要序列化的数据放在 Symbol 属性上，也别指望它能当私有属性用。

## 参考

- [MDN Symbol](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol)
- [MDN Symbol.for](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol/for)
- [MDN 迭代协议](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Iteration_protocols)
- [ryf教程-Symbol](https://es6.ruanyifeng.com/#docs/symbol)
- [前端进阶之旅](https://interview.poetries.top)
