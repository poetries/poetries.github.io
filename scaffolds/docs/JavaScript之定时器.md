---
title: JavaScript之定时器
date: 2016-07-27 11:40:43
tags: JavaScript
categories: Front-End
---

- window定时器

   - `setIntval`(表达式,毫秒)
  - `clearIntval`(定时器对象)
  - `setTimeout`(表达式,毫秒)
  - `clearTimeout`(定时器对象)
 <!--more-->
 
- `setTimeout`(表达式,毫秒)：是指经过指定时间后执行事件一次
 
- 清除定时器：
 
- 在创建定时器的时候 把创建的结果赋给一个定时器变量 比如：`var clock = windows.setTimeout() `再用`cleraTimeout(clock);`

```javascript
//定一段时间后执行某一个函数

	function t(){
		 
		window.location.href = 'http:///www.baidu.com';
	}

	window.setTimeout('t()',10*1000);//setTimeout只是执行一次

	//用setTimeout来实现每隔5秒执行某一个一次  放到函数里面可以做到

```

`setTimeout`实现每隔几秒执行一下

```javascript
	function t(){
		 
		// window.location.href = 'http:///www.baidu.com';


	window.setTimeout('t()',2*1000);
	}

	t();

```

`setIntval`每隔指定时间执行一次事件

- 碰到每隔几秒执行一次事件的 推荐用setInterval

```javascript

	function t(){
		alert('2秒到');
	}

	var clock = window.setInterval('t()',2000);//clock命名为了后面消除定时器用到 这个变量是指向定时器

	function t1(){
		clearInterval(clock);
	}
    ```

