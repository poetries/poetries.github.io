---
title: JavaScript继承的几种方式
date: 2017-10-18 19:46:43
tags: 
   - JavaScript
   - 继承
categories: Front-End
---

> JavaScript继承本质和原型链有关

- 原型、实例、构造函数、原型链之间的关系

![](https://poetries1.gitee.io/img-repo/2019/10/321.png)

## 一、借助构造函数实现继承

- 缺点：实例无法访问父类原型上的属性

```javascript
function Parent1 () {
    this.name = 'parent1';
}
Parent1.prototype.say = function () {

};
function Child1 () {
    Parent1.call(this);
    this.type = 'child1';
}
// Parent1原型上的say没法拿到
console.log(new Child1(), new Child1().say());
```

## 二、借助原型链实现继承

- 缺点：子类和父类公用一个原型,最后导致子类的多个实例都是一样的，无法隔离

```javascript
function Parent2 () {
    this.name = 'parent2';
    this.play = [1, 2, 3];
}
function Child2 () {
    this.type = 'child2';
}
Child2.prototype = new Parent2();

var s1 = new Child2();
var s2 = new Child2();
s1.play.push(4);
console.log(s1.play, s2.play); // [1, 2, 3, 4] [1, 2, 3,4] 结果是一样的，说明两个实例无法隔离
```

## 三、组合继承方式

- 此方法解决了上面的实例相同的问题，但是父类的构造函数执行了多次

```javascript
function Parent3 () {
    this.name = 'parent3';
    this.play = [1, 2, 3];
}
function Child3 () {
    Parent3.call(this);
    this.type = 'child3';
}
Child3.prototype = new Parent3(); // 把Parent3的实例指向Child3的原型
var s3 = new Child3();
var s4 = new Child3();
s3.play.push(4);
console.log(s3.play, s4.play); // [1, 2, 3, 4] [1, 2, 3]
```
 
 - 优化组合继承1：此方法解决了父类的构造函数执行了多次问题，但是无法判断实例是由子类创建的，还是父类创建的

```javascript
function Parent4 () {
    this.name = 'parent4';
    this.play = [1, 2, 3];
}
function Child4 () {
    Parent4.call(this);
    this.type = 'child4';
}
Child4.prototype = Parent4.prototype; // Child4和Parent4公用一个原型了
var s5 = new Child4();
var s6 = new Child4();
console.log(s5, s6);

console.log(s5 instanceof Child4, s5 instanceof Parent4); // 都是返回true
console.log(s5.constructor); // 这里返回的构造函数是Parent4，而不是Child4，问题所在
``` 


- 优化组合继承2：完美解决方案

```javascript
function Parent5 () {
    this.name = 'parent5';
    this.play = [1, 2, 3];
}
function Child5 () {
    Parent5.call(this);
    this.type = 'child5';
}
Child5.prototype = Object.create(Parent5.prototype);
Child5.prototype.constructor = Child5;	 //重新修改了Child5的构造函数为Child5
```
 
 

      
