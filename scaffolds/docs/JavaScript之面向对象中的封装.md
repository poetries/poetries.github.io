---
title: JavaScript之面向对象中的封装
date: 2016-07-27 11:40:43
tags: JavaScript
categories: Front-End
---

- 对象的属性外界是可读可写 如何来达到封装的额目的？
  - 答：可通过闭包+局部变量来完成
 <!--more-->
 
- 在构造函数内部声明局部变量 和普通方法 
- 因为作用域的关系 只有构造函数内的方法 
- 才能访问局部变量 而方法对于外界是开放的 
- 因此可以通过方法来访问 原本外界访问不到的局部变量  达到函数封装的目的

```javascript
function Girl(name,age){
	var love = '小明';//love 是局部变量 准确说不属于对象 属于这个函数的额激活对象 函数调用时必将产生一个激活对象 love在激活对象身上   激活对象有作用域的关系 有办法访问  加一个函数提供外界访问
	this.name = name;
	this.age = age;
	this.say = function () {
		return love;
	};

	this.movelove = function (){
		love = '小轩'; //35
	}

} 

var g = new Girl('yinghong',22);

console.log(g);
console.log(g.say());//小明
console.log(g.movelove());//undefined  因为35行没有返回
console.log(g.say());//小轩



function fn(){
	function t(){
		//var age = 22;//声明age变量 在t的激活对象上
		age = 22;//赋值操作 t的激活对象上找age属性 ，找不到 找fn的激活对象....再找到 最终找到window.age = 22;
				//不加var就是操作window全局属性
	
	}
		t();
}
console.log(fn());//undefined
```
