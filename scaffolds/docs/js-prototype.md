---
title: OOP之原型与原型链
date: 2016-12-13 14:55:24
tags: 
   - JavaScript
   - 原型链
categories: Front-End
---

#### prototype原型对象
---

- 每个函数都有一个默认的`prototype`属性，其实际上还是一个对象，如果被用在继承中，姑且叫做原型对象
- 在构造函数中的`prototype`中定义的属性和方法，会被创建的对象所继承下来。举个栗子：
<!--more-->
```javascript
function F(){}
F.prototype.work = function(){
    console.log('F is working..');
};
var f = new F();
f.work(); // F is working..
```
- 当你创建函数时，`JS`会为这个函数自动添加 `prototype` 属性，值是空对象。而一旦你把这个函数当作构造函数（ `constructor` ）调用（即通过 `new `关键字调用），那么`JS`就会帮你创建该构造函数的实例，实例继承构造函数 `prototype` 的所有属性和方法（实例通过设置自己的` __proto__` 指向构造函数的 `prototype` 来实现这种继承）

#### 神秘的__proto__
---

- `JS`的对象中都包含了一个`__proto__`属性，其指向的是创建该对象时的构造函数的原型对象`prototype`

![](https://segmentfault.com/img/bVzPrk)

- 从上面的输出结果看出，`f.__proto__`指向了其构造函数`F`的`prototype`，而`F.prototype`本身也是一个对象，其内部也有`__proto__`属性，其指向的是`Object.prototype`,直到最后`Object.prototype`指向`null`，这条原型链才结束
- 因此，`__proto__`这个神秘的属性才是原型链形成的真正原因

#### 原型链
---

- 由于原型对象本身也是对象，根据上边的定义，它也有自己的原型，而它自己的原型对象又可以有自己的原型，这样就组成了一条链，这个就是原型链，`JavaScritp`引擎在访问对象的属性时，如果在对象本身中没有找到，则会去原型链中查找，如果找到，直接返回值，如果整个链都遍历且没有找到属性，则返回`undefined`。原型链一般实现为一个链表，这样就可以按照一定的顺序来查找

![](https://segmentfault.com/img/bVcXNb)

- 从上图看出：

    - `Object.prototype`是顶级对象，所有对象都继承自它。
    - `Function `继承 `Function `本身， `Function.prototype` 继承 `Object.prototype `
    - `Function.prototype` 和 `Function.__proto__` 都指向 `Function.prototype`
    - `Object.prototype.__proto__ === null` ，说明原型链到 `Object.prototype`终止