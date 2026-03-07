---
title: JavaScript之IE,火狐兼容事件对象
date: 2016-07-27 11:40:43
tags: JavaScript
categories: Front-End
---

```javascript
document.getElementById('par').addEventListener ('click',function (ev){

		ev = ev||window.event;// 在IE下ev为null window.event为真 || &&在php和js中不同  在js中 第一个真 就返回 否则返回第二个

		alert(ev.screenX+ev.screenY)}
		);
	document.getElementById('son').addEventListener ('click',function (){alert('son')});
```
<!--more-->
- 在js方法和属性没区别 方法和函数都是变量

```javascript
var par = document.getElementById('par');
	if (par.attachEvent){

		par.attachEvent('onclick',function (ev){

		ev = ev||window.event;// 在IE下ev为null window.event为真 || &&在php和js中不同  在js中 第一个真 就返回 否则返回第二个

		alert(ev.screenX+'--'+ev.screenY)}
		);
	}else{

		par.addEventListener('click',function (ev){

		ev = ev||window.event;// 在IE下ev为null window.event为真 || &&在php和js中不同  在js中 第一个真 就返回 否则返回第二个

		alert(ev.screenX+'--'+ev.screenY)}
		);
 ```
 
 - 下面方法更加简洁

```javascript
//document.getElementById('son').addEventListener ('click',function (){alert('son')});
	var par = document.getElementById('par');

		var prefix = '';
		if (par.attachEvent){//如果是IE
			par.addEventListener = par.attachEvent;
			prefix = 'on'; //讨论IE 火狐的onclick  click
		}

	par.addEventListener('click',function (ev){//火狐下

	ev = ev||window.event;

	alert(ev.screenX+'--'+ev.screenY)}
	);
```
