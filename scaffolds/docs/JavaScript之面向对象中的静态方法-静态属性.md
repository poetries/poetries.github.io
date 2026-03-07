---
title: JavaScript之面向对象中的静态方法-静态属性
date: 2016-07-27 11:40:43
tags: JavaScript
categories: Front-End
---

- 面向对象中的静态方法-静态属性：没有new对象 也能引用静态方法属性
<!--more-->

```javascript
function Bird(){
	this.wing = 2;
	this.fly = function(){
		alert('飞');
	}

	
}

// var maque = new Bird();//我们可以调用麻雀的属性和方法
```

思考：可不可以不创建麻雀对象 直接调用Bird的相关方法

- 函数是什么？是变量 是什么类型的变量？是一个对象类型的变量
- js里面有几样东西不通过构造器构造出来
- 原生数据类型有几种：`null ` `undefined ` ` true` ` false`  `字符型`('hello') 数值型(12) 这五种不用构造器
- 对象 函数 数组 都是通过构造器构造出来的（自然是对象）


- 既然是对象 就能给对象加静态属性

```javascript
Bird.ke = 'niaoke';
Bird.jiao = function(){alert('叽叽喳喳')};

Bird.jiao();//没有new对象 也能引用静态方法属性
```

从豆浆机-->制造的流程看 豆浆机充当的是构造函数的角色，如果单独看豆浆机本身 豆浆机也是一部机器 一个对象 也有属性和方法 那么 豆浆机作为对象的属性和方法 就相当于类的静态属性、静态方法
