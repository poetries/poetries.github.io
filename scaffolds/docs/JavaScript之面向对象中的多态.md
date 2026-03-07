---
title: JavaScript之面向对象中的多态
date: 2016-07-27 11:40:43
tags: JavaScript
categories: Front-End
---

- 多态:同一个父类继承出来的子类各有各的形态
<!--more-->

```javascript
function Cat(){
	this.eat = '肉';
}

function Tiger(){
	this.color = '黑黄相间';
}

function Cheetah(){
	this.color = '报文';
}

function Lion(){
	this.color = '土黄色';
}

Tiger.prototype =  Cheetah.prototype = Lion.prototype = new Cat();//共享一个祖先 Cat

var T = new Tiger();
var C = new Cheetah();
var L = new Lion();

console.log(T.color);
console.log(C.color);
console.log(L.color);


console.log(T.eat);
console.log(C.eat);
console.log(L.eat);

```
