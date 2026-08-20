---
title: jQuery基础之Event（五）
date: 2016-08-07 22:10:08
tags: jQuery
categories: Front-End
---

- 什么是`Event`？
<!--more-->
- Event属性：
	- `type`：获取事件类型名称
	- `target`:发生事件的节点
	- `keyCode`：只针对于`keypress`事件，获取键盘键数字 按下回车，13 

	- `pageX`:光标对于页面原点的水平坐标 
	- `pageY`：光标对于页面原点的垂直坐标 

	-  **浏览器**

	- `clientX`：光标对于浏览器窗口的水平坐标 
	- `clientY`：光标对于浏览器窗口的垂直坐标
	
	-  **电脑屏幕**

	- `screenX`：光标对于电脑屏幕的水平坐标    
	- `screenY`：光标对于电脑屏幕的水平坐标 

- `stopPropagation()`：阻止冒泡
	- 从里到外
	- 嵌套关系
	- 相同事件
	- 其中的某一父类没有相同事件时,继续向上查找

- `bind()`;绑定
	- 为匹配元素绑定处理方法

	- 需要给一个元素添加多个事件 ，事件执行一样时候
   - `one()`：只执行一次         


- 绑定特定事件类型方法：
	
  - `blur()` 

  - `focus()` 

  - `mousedown()`

  - `resize()` 

  - `change()` 

  - `keydown()` 

  - `mousemove()` 

  - `scroll()`

  - `click()` 

  - `keypress()`

  - `mouseout()` 

  - `select()` 

  - `dblclick()` 

  - `keyup()` 

  - `mouseover()` 

  - `submit()`

  - `error()` 

  - `load()` 

  - `mouseup()` 

  - `unload()`

	
