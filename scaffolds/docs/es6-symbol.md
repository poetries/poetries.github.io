---
title: ES6系列之Symbol
date: 2018-12-21 15:00:21
tags: 
  - ES6
  - Javascript
categories: Front-End
---

## 一、简介

> `ES6`新加入了一种原始数据类型`Symbol`，表示独一无二的值，这是`js`的第七种数据类型，前六种是：`Undefined`、`Null`、布尔值（`Boolean`）、字符串（`String`）、数值（`Number`）、对象（`Object`）

- 对象的属性名现在可以有两种类型，一种是原来就有的字符串，另一种就是新增的`Symbol`类型。凡是属性名属于`Symbol`类型，就都是独一无二的，可以保证不会与其他属性名产生冲突

### 1.1 定义

```
Symbol([description])
```

> 参数 `description` 是一个可选参数，是一个字符串，可以用于调试，但不能访问`Symbol` 自身

```js
var sym1 = Symbol();
var sym2 = Symbol('foo');
var sym3 = Symbol('foo');
```

### 1.2 值唯一性

> 每一个 `Symbol() `返回的值都是唯一的。一个`Symbol` 值能作为对象属性的标识符，这是改数据类型仅有的目的

```js
Symbol("yuan") === Symbol("yuan"); // false 
```

### 1.3 不可以使用 new 操作符

```js
var sym = new Symbol(); // TypeError报错
```

### 1.4 结合 Object() 函数

> 结合 `Object()` 函数，创建一个 `Symbol` 包装器对象

```js
var sym = Symbol();
typeof sym;  // "symbol“”
var symobj = Object(sym);
typeof symobj; // "object"
```

### 1.5 全局共享 Symbol

> 使用`Symbol.for()` 方法会根据给定的键 `key`，来从运行时的 `symbol` 注册表中找到对应的 `symbol`，如果找到了，则返回它，否则，新建一个与该键关联的 `symbol`，并放入全局 `symbol` 注册表中

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

## 二、静态属性

### 2.1 length 属性

```js
// Symbol 的长度属性值为0.
Symbol.length // 0
```


### 2.2 迭代 Symbols

> `Symbol.iterator` 该方法为每一个对象定义了默认的迭代器。该迭代器可以被 `for.. of` 循环使用。

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

> `Symbols` 与 `for... in` 迭代

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

### 2.3 Symbol的正则表达式

> 用于标识对象是否具有正则表达式的行为。`Symbol.match`:对象是否具有指定的匹配的正则表达式

```js
"/bar/".startsWith(/bar/); 
// Throws TypeError, 因为 /bar/ 是一个正则表达式
// 且 Symbol.match 没有修改。
```

> 如果你将 `Symbol.match` 置为 `false`，使用 `match` 属性的表达式检查会认为该象不是正则表达式对象。`startsWith` 和 `endsWith` 方法将不会抛出 `TypeError`

```js
var re = /foo/;
re[Symbol.match] = false;

"/foo/".startsWith(re); // true
"/baz/".endsWith(re);   // false
```

**Symbol.replace**

> 这个属性指定了当一个字符串替换所匹配字符串时所调用的方法。`String.prototype.replace()` 方法会调用此方法。

**Symbol.search**

> 指定了一个搜索方法，这个方法接受用户输入的正则表达式，返回该正则表达式在字符串中匹配到的下标，这个方法由以下的方法来调用 `String.prototype.search()`

**Symbol.split**

> 指向 一个正则表达式的索引处分割字符串的方法。 这个方法通过`String.prototype.split()` 调用

### 2.4 其他属性

**Symbol.hasInstance**

> 一个确定一个构造器对象识别的对象是否为它的实例的方法

**Symbol.toStringTag**

> 用于对象的默认描述的字符串值。使用`Object.prototype.toString().`

## 三、静态方法

### 3.1 Symbol.for(key)

> 根据给定的键 `key`， 从运行时的 `symbol` 注册表中找到对应的 `symbol`，如果找到了，则返回它，否则，新建一个与该键关联的 `symbol`，并放入全局 `symbol` 注册表

- 这里的参数`key`，是一个字符串，作为 `symbol` 注册表中与某 `symbol` 关联的键
- 和 `Symbol()` 不同的是，用`Symbol.for()` 方法创建的 `symbol` 会被放入一个全局 symbol 注册表中
- `Symbol.for()` 并不是每次都会创建一个新的 symbol，它会首先检查给定的 `key` 是否已经在注册表中了，如果是，则会直接返回上次存储的那个。否则，会再新建一个

```js
Symbol.for("foo"); // 创建一个 symbol 并放入 symbol 注册表中，键为 "foo"
Symbol.for("foo"); // 从 symbol 注册表中读取键为"foo"的 symbol

Symbol.for("bar") === Symbol.for("bar"); // true，证明了上面说的
Symbol("bar") === Symbol("bar"); // false，Symbol() 函数每次都会返回新的一个 symbol

var sym = Symbol.for("mario");
sym.toString(); 
// "Symbol(mario)"，mario 既是该 symbol 在 symbol 注册表中的键名，又是该 symbol 自身的描述字符串
```

### 3.2 Symbol.keyFor(sym)

- 该方法用来获取 `symbol` 注册表中与某个 `symbol` 关联的键。
- 参数 `sym` 是指存储在 `symbol` 注册表中的某个 `symbol`

```js
// 创建一个 symbol 并放入 Symbol 注册表，key 为 "foo"
var globalSym = Symbol.for("foo"); 
Symbol.keyFor(globalSym); // "foo"

// 创建一个 symbol，但不放入 symbol 注册表中
var localSym = Symbol(); 
Symbol.keyFor(localSym); // undefined，所以是找不到 key 的
```

## 四、遍历

> `Symbol`定义的属性不会出现在下面循环中

- `for in`:可获取原型属性，不可获取不可枚举属性
- `for of`:不可遍历对象，可遍历数组
- `Object.keys`：原型属性和不可枚举属性都不能获取
- `Object.getOwnPropertyByNames`：不可获取原型属性，可获取不可枚举属性
- `JSON.stringify`：原型属性和不可枚举属性都不能获取
- `Reflect.ownKeys`：可获取不可枚举和`Symbol`，不可获取原型

```js
var p = {w:2};
var obj = Object.create(p);
obj.a = 1;
Object.defineProperty(obj,"b",{
    value:123
})
var a = Symbol('a');
var b = Symbol('b');

obj[a] = 'Hello';
obj[b] = 'World';

Reflect.ownKeys(obj);// [Symbol(a), Symbol(b)]
```

> 或者使用`Object.getOwnPropertySymbols(obj)`遍历
