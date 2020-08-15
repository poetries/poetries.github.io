---
title: JavaScript原型链回顾
date: 2018-12-22 12:13:53
tags: 
  - JavaScript
  - 原型链
categories: Front-End
---


## 一、JS内置对象

> 所谓的内置对象 指的是：`JavaScript`本身就自己有的对象 可以直接拿来就用。例如`Array` `String` 等等。`JavaScript`一共有12内置对象

**函数类型(10个)**

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

> 函数类型 有 `__proto__`和 `prototype` 属性

**对象类型(2个)**

- `Math`
- `JSON`

> 对象类型只有`__proto__`属性

![image.png](https://upload-images.jianshu.io/upload_images/1480597-9b6c5ca4a84f967c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## 二、JS原型链

### 2.1 概述

![image.png](https://upload-images.jianshu.io/upload_images/1480597-86427eafb257f868.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


- 每个函数都有 `prototype` 属性，除了 `Function.prototype.bind()`，该属性指向原型。
- 每个对象都有 `__proto__` 属性，指向了创建该对象的构造函数的原型。其实这个属性指向了 `[[prototype]]`，但是 `[[prototype]]` 是内部属性，我们并不能访问到，所以使用 `__proto__` 来访问
- 对象可以通过 __proto__ 来寻找不属于该对象的属性，`__proto__` 将对象连接起来组成了原型链

> 打开浏览器的控制面板，随便输入一个`JS`内置的构造器函数，比如`Array`，控制台输出的是一个名为`Array`的函数体，这好像并没有什么稀奇的，但是，当你接着输入`Array.prototype`，控制面板输出了一堆我们经常用到的`Array`构造器的方法，把目光转移到最下方，有一个叫`__proto__`的属性，好奇的点开。列表列出的不是`Object`构造器的方法么，里边有我们非常熟悉的`hasOwnProperty`还有`toString`等方法。如果`Array`是构造器，那么控制面板输出的`Array.prototype`的所有属性中`constructor`又是什么构造器？点开看看，之后就像身处德罗斯特效应中一样，`__proto__`和`constructor`，还有`Array`构造器中常用的方法名不断的出现，一层套一层，一层层展开，没有尽头

![](https://poetries1.gitee.io/img-repo/2019/10/343.png)

> 拿`Array`举例，`Array.prototype`中有一个`constructor`属性，这个属性的值就是`Array`构造器自己

```
Array.prototype.constructor === Array //true
```

### 2.2 prototype

> 这是一个显式原型属性，只有函数才拥有该属性。基本上所有函数都有这个属性，但是也有一个例外

```js
let fun = Function.prototype.bind()
```

> 如果你以上述方法创建一个函数，那么可以发现这个函数是不具有 `prototype` 属性的

#### 2.2.1 prototype 如何产生的

> 当我们声明一个函数时，这个属性就被自动创建了

```
function Foo() {}
```

> 并且这个属性的值是一个对象（也就是原型），只有一个属性 `constructor`

- `constructor` 对应着构造函数，也就是 `Foo`

#### 2.2.2 constructor

> `constructor `是一个公有且不可枚举的属性。一旦我们改变了函数的 `prototype` ，那么新对象就没有这个属性了（当然可以通过原型链取到 `constructor`）

那么你肯定也有一个疑问，这个属性到底有什么用呢？其实这个属性可以说是一个历史遗留问题，在大部分情况下是没用的，在我的理解里，我认为他有两个作用：

- 让实例对象知道是什么函数构造了它
- 如果想给某些类库中的构造函数增加一些自定义的方法，就可以通过 `xx.constructor.method` 来扩展



### 2.3 `__proto__`

> 这是每个对象都有的隐式原型属性，指向了创建该对象的构造函数的原型。其实这个属性指向了 `[[prototype]]`，但是 `[[prototype]]` 是内部属性，我们并不能访问到，所以使用 `__proto__` 来访问

- 因为在 `JS` 中是没有类的概念的，为了实现类似继承的方式，通过 `__proto__` 将对象和原型联系起来组成原型链，得以让对象可以访问到不属于自己的属性

#### 2.3.1 实例对象的 `_proto_` 如何产生的

> 当我们使用 `new` 操作符时，生成的实例对象拥有了 `__proto__`属性

```js
function Foo() {}
// 这个函数是 Function 的实例对象
// function 就是一个语法糖
// 内部调用了 new Function(...)
```

> 所以可以说，在 `new` 的过程中，新对象被添加了 `__proto__` 并且链接到构造函数的原型上

#### 2.3.2 new 的过程

- 新生成了一个对象
- 链接到原型
- 绑定 `this`
- 返回新对象

> 在调用 `new` 的过程中会发生以上四件事情，我们也可以试着来自己实现一个 `new`

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

- 对于实例对象来说，都是通过 `new` 产生的，无论是 `function Foo()` 还是 `let a = { b : 1 }`
- 对于创建一个对象来说，更推荐使用字面量的方式创建对象。因为你使用 `new Object() `的方式创建对象需要通过作用域链一层层找到 `Object`，但是你使用字面量的方式就没这个问题。

```js
// function 就是个语法糖
// 内部等同于 new Function()
let a = { b: 1 }
// 这个字面量内部也是使用了 new Object()
```



![image.png](https://upload-images.jianshu.io/upload_images/1480597-e4a91031a78eb153.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> 这里`Array` 内置对象 且是函数类型。所以`Array`有`__proto__`属性 指向的是函数类型 `(function（）{})`。所以当我们在输出`Array.__proto__.proto__`;就会返回对象类型`(Object{})`.但是再向上就`null`。因为`Object`就是父类了。所有的继承自`Object`。

- `JS`内置构造器其中之一的`Array`原本就是一个函数，而这个函数就是`Function`的`prototype`，所以`Function.prototype`有的方法，`JS`内置构造器都有，比如`call()`、`apply()`、`bind()`等（其实我们自定义的函数也是继承自`Function.prototype`，所以我们自己也可以定义构造器）。而`Function.prototype`的进化链指针又指向了`Object.prototype`

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
- 对象的 `__proto__` 指向原型， `__proto__ `将对象和原型连接起来组成了原型链

**关于原型有3个相关的概**念:

- 函数对象的`prototype`属性, 可以称之为显式原型属性(简称: 显式原型)
- 实例对象的`__proto__`属性, 可以称之为隐式原型属性(简称: 隐式原型)
- 原型对象: 也就是`prototype`属性和`_proto__`属性指向的对象

![](https://github.com/mqyqingfeng/Blog/raw/master/Images/prototype5.png)

> 图中由相互关联的原型组成的链状结构就是原型链，也就是蓝色的这条线


## 三、JSON和Math

> `JS`内置的构造器函数都可以使用`new`关键字实例化一个对象，我们称实例化后的这个对象就是某某构造器的一个实例

![](https://poetries1.gitee.io/img-repo/2019/10/344.png)

> 我们试试`JSON` 和`Math` 能不能实例化对象

![](https://poetries1.gitee.io/img-repo/2019/10/345.png)

> `JSON`和`Math`不是构造器函数，他们是普通的对象。只有构造器函数才能使用`new `关键字实例化一个对象，而`JSON`和`Math`已经是对象了，所以我们可以不用实例化直接使用`JSON`和`Math`中的属性和方法

- 所以`JSON`和`Math`不属于`10`个构造器函数，但他们`12`个共同属于`Javascript`的内置对象

## 四、更多参考

- [JavaScript深入之从原型到原型链](https://github.com/mqyqingfeng/Blog/issues/2)

