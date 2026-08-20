---
title: JavaScript原型链回顾与new的实现原理
description: 从 JS 内置对象讲起，理清 prototype 与 __proto__ 的分工、constructor 的作用、new 操作符做了哪四件事，并手写一个 new，顺带说清 JSON 和 Math 为什么不能实例化。
date: 2018-12-22 12:13:53
tags:
  - JavaScript
  - 原型链
  - new
categories: Front-End
---

面试问原型链，很多人能背出「每个对象都有 `__proto__`，指向构造函数的 `prototype`」，但再追问一句「那 `Function.__proto__` 指向谁」就卡住了。我一开始也是这样，图看过好几遍，一到具体的某条线上就理不清方向。

后来发现问题出在把 `prototype` 和 `__proto__` 当成一回事了。这两个属性长得像，挂的对象不一样，指的方向也不一样。这篇从内置对象开始把这两条线分开走一遍，再顺着 `new` 的过程看这些连接是什么时候建立起来的。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- JS 内置对象里，哪些是函数哪些只是普通对象
- `prototype` 是谁的属性，什么时候被创建
- `constructor` 到底有什么用，它为什么算历史遗留
- `__proto__` 和 `[[Prototype]]` 的关系
- `new` 操作符做了哪四件事，手写一个 `new`
- 原型链的终点在哪里
- `JSON` 和 `Math` 为什么不能 `new`

## 一、JS内置对象

所谓的内置对象指的是，JavaScript 本身就自己有的对象，可以直接拿来就用，例如 `Array`、`String` 等等。按老的教材分法，JavaScript 一共有 12 个内置对象。

函数类型有 10 个：

- `String`
- `Number`
- `Boolean`
- `Array`
- `Function`
- `Date`
- `RegExp`
- `Error`
- `Object`
- `Event`

函数类型有 `__proto__` 和 `prototype` 属性。

对象类型有 2 个：

- `Math`
- `JSON`

对象类型只有 `__proto__` 属性。

![JS 内置对象分类示意图，函数类型与对象类型的属性差别](https://upload-images.jianshu.io/upload_images/1480597-9b6c5ca4a84f967c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

这个「12 个」的说法是当年教材里的分法，拿来入门够用，但别当成规范。ECMAScript 现在的内置对象远不止这些，`Map`、`Set`、`Promise`、`Symbol`、`Proxy`、`Reflect`、`WeakMap` 都是。而且列表里的 `Event` 严格说不属于 ECMAScript，它是浏览器提供的宿主对象，在 Node 里就没有这个全局变量。

真正要记住的不是数字，而是那条分界线，能不能被 `new` 调用。能的是构造函数，身上有 `prototype`；不能的就是个普通对象，只有 `__proto__`。

## 二、JS原型链

### 2.1 概述

![prototype 与 __proto__ 组成原型链的整体关系图](https://upload-images.jianshu.io/upload_images/1480597-86427eafb257f868.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

三条基本规则先摆在这儿：

- 每个函数都有 `prototype` 属性，该属性指向原型
- 每个对象都有 `__proto__` 属性，指向了创建该对象的构造函数的原型。其实这个属性指向了 `[[Prototype]]`，但是 `[[Prototype]]` 是内部属性，我们并不能访问到，所以使用 `__proto__` 来访问
- 对象可以通过 `__proto__` 来寻找不属于该对象的属性，`__proto__` 将对象连接起来组成了原型链

打开浏览器的控制面板，随便输入一个 JS 内置的构造器函数，比如 `Array`，控制台输出的是一个名为 `Array` 的函数体，这好像并没有什么稀奇的。但是当你接着输入 `Array.prototype`，控制面板输出了一堆我们经常用到的 `Array` 构造器的方法。把目光转移到最下方，有一个叫 `__proto__` 的属性，好奇的点开，列表列出的不是 `Object` 构造器的方法么，里边有我们非常熟悉的 `hasOwnProperty` 还有 `toString` 等方法。

如果 `Array` 是构造器，那么控制面板输出的 `Array.prototype` 的所有属性中 `constructor` 又是什么构造器？点开看看，之后就像身处德罗斯特效应中一样，`__proto__` 和 `constructor`，还有 `Array` 构造器中常用的方法名不断地出现，一层套一层，一层层展开，没有尽头。

![控制台展开 Array.prototype 时层层嵌套的 __proto__ 与 constructor](https://s.poetries.top/gitee/2019/10/343.png)

拿 `Array` 举例，`Array.prototype` 中有一个 `constructor` 属性，这个属性的值就是 `Array` 构造器自己。

```
Array.prototype.constructor === Array //true
```

看起来没有尽头，其实是有的。展开的过程之所以像无限循环，是因为原型对象上的 `constructor` 指回构造函数，构造函数又能点出 `prototype`，两者互相引用形成了一个环。DevTools 只是老实地把这个环一层层渲染出来而已，真正的原型链本身是有终点的，后面会讲到。

### 2.2 prototype

这是一个显式原型属性，只有函数才拥有该属性。基本上所有函数都有这个属性，但是也有例外。

```js
let fun = Function.prototype.bind()
```

如果你以上述方法创建一个函数，那么可以发现这个函数是不具有 `prototype` 属性的。

原文只提了 `bind` 这一种例外，其实没有 `prototype` 的函数还有几类，顺手补全：

- `bind` 返回的绑定函数
- 箭头函数，所以箭头函数不能用 `new` 调用
- 对象字面量里的方法简写 `{ foo() {} }`
- `Math.max` 这类内置的非构造函数

它们的共同点是「设计上就不打算被 `new`」。没有 `prototype`，`new` 出来的实例就没有原型可以挂，语言干脆直接禁止这么用。

#### 2.2.1 prototype 如何产生的

当我们声明一个函数时，这个属性就被自动创建了。

```
function Foo() {}
```

并且这个属性的值是一个对象（也就是原型），只有一个属性 `constructor`，`constructor` 对应着构造函数，也就是 `Foo`。

#### 2.2.2 constructor

`constructor` 是一个公有且不可枚举的属性。一旦我们改变了函数的 `prototype`，那么新对象就没有这个属性了（当然可以通过原型链取到 `constructor`）。

那么你肯定也有一个疑问，这个属性到底有什么用呢？它可以说是一个历史遗留问题，在大部分情况下是没用的。按我的理解它有两个作用：

- 让实例对象知道是什么函数构造了它
- 如果想给某些类库中的构造函数增加一些自定义的方法，就可以通过 `xx.constructor.method` 来扩展

这里有个坑要注意。老式的继承写法会直接覆盖 `prototype`：

```js
function Child() {}
Child.prototype = new Parent(); // constructor 丢了
Child.prototype.constructor = Child; // 手动补回来
```

不补这一行的话，`new Child().constructor` 会顺着原型链找到 `Parent`，判断类型的代码就会拿到错的结果。所以老代码里经常能看到这么一行看起来莫名其妙的赋值。

顺带说一句，`constructor` 之所以是不可枚举的，靠的就是属性描述符里的 `enumerable: false`。这也是为什么 `for...in` 遍历实例时不会把它列出来。

### 2.3 `__proto__`

这是每个对象都有的隐式原型属性，指向了创建该对象的构造函数的原型。其实这个属性指向了 `[[Prototype]]`，但是 `[[Prototype]]` 是内部属性，我们并不能访问到，所以使用 `__proto__` 来访问。

因为在 JS 中是没有类的概念的（`class` 是语法糖），为了实现类似继承的方式，通过 `__proto__` 将对象和原型联系起来组成原型链，得以让对象可以访问到不属于自己的属性。

有一点要说明，`__proto__` 本身是浏览器厂商各自实现之后才被写进规范附录的遗留特性，规范推荐的标准写法是 `Object.getPrototypeOf(obj)` 和 `Object.setPrototypeOf(obj, proto)`。日常调试用 `__proto__` 方便，写进代码库建议用标准 API。另外 `Object.setPrototypeOf` 性能很差，会让引擎放弃已有的内联缓存优化，能在创建时用 `Object.create` 定好就别后面改。

#### 2.3.1 实例对象的 `__proto__` 如何产生的

当我们使用 `new` 操作符时，生成的实例对象拥有了 `__proto__` 属性。

```js
function Foo() {}
// 这个函数是 Function 的实例对象
// function 就是一个语法糖
// 内部调用了 new Function(...)
```

所以可以说，在 `new` 的过程中，新对象被添加了 `__proto__` 并且链接到构造函数的原型上。

有一个例外要记住，`Object.create(null)` 创建出来的对象没有原型，它的 `__proto__` 是 `undefined`。用它当纯粹的字典结构很合适，因为不用担心 `hasOwnProperty`、`toString` 这些名字跟你的键撞车。

#### 2.3.2 new 的过程

调用 `new` 的过程中会发生四件事情：

- 新生成了一个对象
- 链接到原型
- 绑定 `this`
- 返回新对象

我们也可以试着来自己实现一个 `new`：

```js
function create() {
    // 创建一个空的对象
    let obj = new Object()
    // 获得构造函数
    let Con = [].shift.call(arguments)
    // 链接到原型
	obj.__proto__ = Con.prototype
    // 绑定 this，执行构造函数
    let result = Con.apply(obj, arguments)
    // 确保 new 出来的是个对象
    return typeof result === 'object' ? result : obj
}
```

这版能说明思路，但最后那行判断有个漏洞。`typeof null` 的结果也是 `'object'`，所以构造函数里显式 `return null` 的话，这个实现会把 `null` 返回出去，而真正的 `new` 在这种情况下返回的是新建的那个对象。另外构造函数返回一个函数时，`new` 也是以返回值为准的。修正后的判断应该是这样：

```js
function create(Con, ...args) {
  // 用标准 API 建对象并链接原型，比赋值 __proto__ 更规范
  const obj = Object.create(Con.prototype)
  const result = Con.apply(obj, args)
  // 只有返回值是对象或函数时才采用它，null 要排除掉
  const isObj = result !== null && (typeof result === 'object' || typeof result === 'function')
  return isObj ? result : obj
}
```

对于实例对象来说，都是通过 `new` 产生的，无论是 `function Foo()` 还是 `let a = { b : 1 }`。

对于创建一个对象来说，更推荐使用字面量的方式创建对象。因为你使用 `new Object()` 的方式创建对象需要通过作用域链一层层找到 `Object`，但是你使用字面量的方式就没这个问题。

```js
// function 就是个语法糖
// 内部等同于 new Function()
let a = { b: 1 }
// 这个字面量内部也是使用了 new Object()
```

![Array 的 __proto__ 指向 Function.prototype，再往上是 Object.prototype，终点是 null](https://upload-images.jianshu.io/upload_images/1480597-e4a91031a78eb153.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

这里 `Array` 是内置对象且是函数类型，所以 `Array` 有 `__proto__` 属性，指向的是函数类型的原型。当我们输出 `Array.__proto__.__proto__` 时，就会返回对象类型的原型，但是再向上就是 `null` 了，因为 `Object.prototype` 是这条链的顶端，所有对象最终都继承自它。

原文这里写成了 `Array.__proto__.proto__`，少了两个下划线，是个笔误，正确写法是 `Array.__proto__.__proto__`。

用代码验证一下这条链更直观：

```js
Array.__proto__ === Function.prototype        // true
Function.prototype.__proto__ === Object.prototype // true
Object.prototype.__proto__ === null           // true
```

JS 内置构造器其中之一的 `Array` 原本就是一个函数，而所有函数的 `__proto__` 都指向 `Function.prototype`，所以 `Function.prototype` 上有的方法，JS 内置构造器都有，比如 `call()`、`apply()`、`bind()` 等。我们自定义的函数也一样继承自 `Function.prototype`，所以我们自己也可以定义构造器。而 `Function.prototype` 的原型指针又指向了 `Object.prototype`。

原文这段把「`Array` 这个函数就是 `Function` 的 `prototype`」写混了，准确的说法是 `Array.__proto__ === Function.prototype`，`Array` 本身不是 `Function.prototype`。

```js
// 数组实例的__proto__指向构造器的原型

[].__proto__ === Array.prototype 
```

### 2.4 总结

- `Object` 是所有对象的爸爸，所有对象都可以通过 `__proto__` 找到它
- `Function` 是所有函数的爸爸，所有函数都可以通过 `__proto__` 找到它
- `Function.prototype` 和 `Object.prototype` 是两个特殊的对象，他们由引擎来创建
- 除了以上两个特殊对象，其他对象都是通过构造器 `new` 出来的
- 函数的 `prototype` 是一个对象，也就是原型
- 对象的 `__proto__` 指向原型，`__proto__` 将对象和原型连接起来组成了原型链

关于原型有 3 个相关的概念：

- 函数对象的 `prototype` 属性，可以称之为显式原型属性（简称显式原型）
- 实例对象的 `__proto__` 属性，可以称之为隐式原型属性（简称隐式原型）
- 原型对象，也就是 `prototype` 属性和 `__proto__` 属性指向的对象

![原型链关系全图，蓝色线条即为原型链](https://github.com/mqyqingfeng/Blog/raw/master/Images/prototype5.png)

图中由相互关联的原型组成的链状结构就是原型链，也就是蓝色的这条线。

看这张图的时候有两条最绕的线值得单独盯一下。一条是 `Function.__proto__ === Function.prototype`，`Function` 自己是自己的实例，这是引擎为了让规则自洽做的特殊处理。另一条是 `Object.__proto__ === Function.prototype`，因为 `Object` 本身也是个函数。

顺带提一句，正因为原型是靠引用连接的，深拷贝默认不会保留这条链。`structuredClone` 拷完 class 实例会变成普通对象，就是这个原因，具体在 [JavaScript深浅拷贝原理与手写实现](https://feinterview.poetries.top/blog/js-deep-copy) 里讲过。

## 三、JSON和Math

JS 内置的构造器函数都可以使用 `new` 关键字实例化一个对象，我们称实例化后的这个对象就是某某构造器的一个实例。

![使用 new 实例化内置构造器函数的控制台输出](https://s.poetries.top/gitee/2019/10/344.png)

我们试试 `JSON` 和 `Math` 能不能实例化对象。

![对 JSON 和 Math 使用 new 时控制台抛出的类型错误](https://s.poetries.top/gitee/2019/10/345.png)

`JSON` 和 `Math` 不是构造器函数，他们是普通的对象。只有构造器函数才能使用 `new` 关键字实例化一个对象，而 `JSON` 和 `Math` 已经是对象了，所以我们可以不用实例化，直接使用 `JSON` 和 `Math` 中的属性和方法。

所以 `JSON` 和 `Math` 不属于那 10 个构造器函数，但他们 12 个共同属于 JavaScript 的内置对象。

为什么设计成这样？因为这两个东西压根没有实例状态。`Math.PI`、`Math.max` 全都是静态数据和纯函数，造一百个 `Math` 实例出来没有任何意义。同类的还有后来加的 `Reflect`，也是一个纯粹的静态方法容器。

判断某个东西能不能 `new`，最直接的办法是看 `typeof`。`typeof Math` 是 `'object'`，`typeof Array` 是 `'function'`，只有后者才有可能被 `new` 调用。当然前面说过，是 `function` 也不一定能 `new`，箭头函数就不行。

## 总结

`prototype` 和 `__proto__` 的分工是这块的入口。`prototype` 只挂在函数上，是「我 `new` 出来的实例应该长什么样」的模板；`__proto__` 挂在每个对象上，是「我实际继承自谁」的指针。两者通过 `new` 建立连接，`obj.__proto__ === Con.prototype`。

原型链的终点是 `Object.prototype.__proto__ === null`。查找一个属性时引擎顺着 `__proto__` 一路往上走，走到 `null` 还没找到就返回 `undefined`。链越长查找越慢，这也是不建议随便加深继承层次的原因。

手写 `new` 的四步里，最容易写错的是最后那步返回值判断。`typeof null === 'object'` 这个历史遗留 bug 会让简化版实现在构造函数返回 `null` 时给出错误结果，正确的判断要把 `null` 排除掉，同时把函数也算进「对象」。

`constructor` 大部分时候用不上，但改写 `prototype` 之后一定要手动补回来，否则实例的类型判断会指向错误的构造函数。

最后，`__proto__` 是遗留写法，代码里请用 `Object.getPrototypeOf`；创建对象时想指定原型，用 `Object.create` 而不是事后 `setPrototypeOf`，后者会让引擎的优化全部失效。

## 参考

- [JavaScript深入之从原型到原型链](https://github.com/mqyqingfeng/Blog/issues/2)
- [MDN 继承与原型链](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
- [MDN Object.create](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
- [MDN Object.getPrototypeOf](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/getPrototypeOf)
- [MDN new 运算符](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/new)
- [前端进阶之旅](https://interview.poetries.top)
