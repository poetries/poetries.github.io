---
title: JavaScript之函数表达式&arguments详解
date: 2016-07-27 11:40:43
tags: JavaScript
categories: Front-End
---

- `This`与`arguments`
 <!--more-->
- 当一个函数运行的时候 函数内部能引用的变量有这么几种
 
- ` AO`
- ` arguments`
- ` this`
 

- 对于`arguments`和`this `函数都有自己的`arguments`和`this `且不进行链式查找
 
- **`arguments`是什么？**
  - 答：`arguments`是收到的实参的副本 在词法分析中 
  - 首先形参形成`AO`属性 值为`undefined `
  -  当实参传来时 再修改`AO`的相应属性  
  -  并把收到的实参收集起来放到一个`arguments`对象里面  `t(a,b,c){}`为例：调用 时  `t(1,2,3,4,5)`个参数  此时`AO`属性只有`a,b,c`三个属性 但是`arguments`有`1,2,3,4,5`所有的值
  
- 对于超出形参个数的实参可以通过argument来获得
  
 
  - `argument`的索引从`0 1 2..`递增 与实参一一对应  
  - `argument.length`属性代表实参个数
 
 - `arguments`一定不是数组，但是长得像数组的一个对象而已 虽然也有`length`属性 
 
- `arguments`每个函数都有 因此只会在内部找自身的`argument` 无法引用到外部的`arguments`


```javascript
function t(a,b,c){//参数实际来AO的属性 有几个形参 就形成几个AO属性   arguments就代表这个函数的额参数
	console.log(a);//1
	console.log(b);//2
	console.log(c);//3

	console.log(arguments[0]);//1
	console.log(arguments[1]);//2
	console.log(arguments[2]);//3

	a = 90;
	console.log(a);//90
	console.log(arguments[0]);//90  互为副本 arguments有一个好处 它接收的实际是你传过来的参数 arguments接收的是所有的实参
	console.log(arguments[0]);
	console.log(arguments[3]);//4
	console.log(arguments[4]);//5

}
t(1,2,3,4,5);
```

```javascript

//利用 argument的特点完成其他语言的函数重载
//求圆形面积 矩形面积 三角形面积

	function area(){
		if(arguments.length ==1){
			alert(3.14*arguments[0]*arguments[0]);
		}else if(arguments.length ==2){
			alert(arguments[0]*arguments[1]);
		}else if(arguments.length ==3){
			alert(arguments[0]+arguments[1]+arguments[2]);
		}else{
			return null;
		}
	}
area(10,20,30);
```


```javascript
function  t(){
	var age = 22;//age在链的AO上
	alert(arguments[0]);//1
	alert(arguments[1]);//2

	function d(){
		alert(arguments[0]);//a
		alert(arguments[1]);//undefined 此时这个argument不会找到上面的arguments[1]去  只有Ao才会按照链来查找 argument不会按照链查找

	}
	d('a');
}
t(1,2);
```
