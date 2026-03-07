---
title:  jQuery概述（一）
date: 2016-08-07 19:35:08
tags: jQuery
categories: Front-End
---


- `jQuery`是什么:
	- 是一个`javascript`代码仓库，我们称之为`javascript`框架。
	- 是一个快速的简洁的`javascript`框架，可以简化查询`DOM`对象、处理事件、制作动画、处理`Ajax`交互过程。
	<!--more-->
- `jQuery`可以帮我们做什么(有什么优势)、
	- 体积小，使用灵巧(只需引入一个`js`文件)
	- 方便的选择页面元素(模仿`CSS`选择器更精确、灵活)
	- 动态更改页面样式/页面内容(操作`DOM`，动态添加、移除样式)
	- 控制响应事件(动态添加响应事件)
	- 提供基本网页特效(提供已封装的网页特效方法)
	- 快速实现通信(`ajax`)
	- 易扩展、插件丰富

- `javascript`用来干什么的：
	- 操作`DOM`对象
	- 动态操作样式`css`
	- 数据访问
	- 控制响应事件等

- 讲解`$(function(){})`
	- `$`是`jQuery`别名。如`$()`也可`jQuery()`这样写,相当于页面初始化函数，当页面加载完毕，会执行`jQuery()`。
	- 希望在做所有事情之前，`JQuery`操作`DOM`文档。必须确保在`DOM`载入完毕后开始执行，应该用`ready`事件做处理`HTML`文档的开始。
	- `$(document).ready(function(){})`
        - 类似于`js`的`window.onload`事件函数，但是`ready`事件要先于`onload`事件执行。
        - `window.onload = function(){}`
        - 为方便开发，`jQuery`简化这样的方法，直接用`$()`表示

	- `JQuery`的`ready`事件不等于`Js`的`load` ：
		- 执行时机不同：`load`需要等外部图片和视频等全部加载才执行。`ready`是`DOM`绘制完毕后执行，先与外部文件。
		- 用法不同：`load`只可写一次，`ready`可以多次。

- `$()`和`document`是相等的吗

```javascript
	<div id="a" class="aa"></div>
	<div id="b" class="aa"></div>
	<div id="c" class="aa"></div>
	alert(document.getElementById("id") == $("#aa"));//返回结果为false
	alert(document.getElementById("id") == $("#aa").get(0));//返回true
```

	
- 样式选择器`$(".className")`
  - `$(".aa").css("color","green")`
  - `id`选择器 `$("#a").css("background-color","#ff0066")`
  - 标签选择器 `$("p").css("color","#cc3366")`
  - 组选择器 `$("#b ul li").size();`

- `jQuery`有哪些功能(`API`)：
	- a.选择器 
	- b.过滤器 
	- c.事件 
	- d.效果 
	- e.`ajax`

- 简单的`JQuery`选择器：
	- `JQuery`基本选择器（`ID`选择器，标签选择器，类选择器，通配选择器和组选择器5种）
       - `ID`选择器：`document.getElementById(id)与$("#id")`对比(改变文字大小)---`id`唯一，返回单个元素
	   - 标签选择器：`document.getElementsByTagName(tagName)`与`$("tagname")`对比---多个标签，返回数组
	   - 类选择器:`$(".className")`--多个`classname`（改变背景图片）
	   - 通配选择器：`document.getElementsByTagName("*")`与`$("*")`对比---指范围内的所有标签元素
	   - 组选择器：`$("seletor1,seletor2,seletor3")`----无数量限制，用逗号分割。
---

### 附录：

- 简易jQuery内存图

![](https://raw.githubusercontent.com/poetries/TZ-Front-End-Note/master/jQuery-star/images/1.png)

---

- jQuery学习大纲

![](https://raw.githubusercontent.com/poetries/TZ-Front-End-Note/master/jQuery-star/images/jQuery%20%E7%B3%BB%E7%BB%9F%E6%95%99%E5%AD%A6%E8%AF%BE%E7%A8%8B.png)
