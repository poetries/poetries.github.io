---
title: hasLayout知多少
date: 2016-09-07 19:20:08
tags: CSS
categories: Front-End
---

### 什么是haslayout


-  什么是`hasLayout`？`hasLayout`是`IE`特有的一个属性。很多的`ie`下的`css bug`都与其息息相关。在`ie`中，一个元素要么自己对自身的内容进行计算大小和组织，要么依赖于父元素来计算尺寸和组织内容。当一个元素的`hasLayout`属性值为`true`时，它负责对自己和可能的子孙元素进行尺寸计算和定位。虽然这意味着这个元素需要花更多的代价来维护自身和里面的内容，而不是依赖于祖先元素来完成这些工作
<!--more-->

### 默认拥有haslayout属性

- `<html>`, `<body>`
- `<table>`, `<tr>`, `<th>`,` <td>`
- `<img>`
- `<hr>`
- `<input>`, `<button>`, `<select>`, `<textarea>`, `<fieldset>`, `<legend>`
- `<iframe>`, `<embed>`, `<object>`, `<applet>`
- `<marquee>`


### 触发haslayout属性


- 很多情况下，我们把` hasLayout`的状态改成`true `就可以解决很大部分`ie`下显示的`bug`。 
`hasLayout`属性不能直接设定，你只能通过设定一些特定的`css`属性来触发并改变 `hasLayout `状态。下面列出可以触发`hasLayout`的一些`CSS`属性值
 - `display `
	- 启动`haslayout`的值:`inline-block` 
	- 取消`hasLayout`的值:其他值 

 - `width` / `height `
	- 启动`hasLayout`的值：除了`auto`以外的值
	- 取消`hasLayout`的值：`auto`
 	- ( 对 `IE6 `及更早版本来说很常用，该方法被称为霍莉破解(`Holly hack`)，即设定这个元素的高度为 `1%`  (`height:1%`;)。但是要注意，当这个元素的 `overflow` 属性被设置为 `visible` 时，这个方法就失效了。)

 - `position `
	- 启动hasLayout的值：absolute 
	- 取消hasLayout的值：static 

 - `float `
	- 启动`hasLayout`的值：`left`或`right `
	- 取消`hasLayout`的值：`none` 

 - `zoom `
	- 启动`hasLayout`的值：有值 
	- 取消`hasLayout`的值：`narmal`或者空值 
	- (又一个`ie`私有属性，不兼容标准。)

 - `ie7`还有一些额外的属性可以触发该属性（不完全列表）： 
	- `min-height:` (任何值) 
	- `max-height: `(任何值除了`none`) 
	- `min-width: `(任何值) 
	- `max-width:` (任何值除了`none`) 
	- `overflow: `(任何值除了`visible`) 
	- `overflow-x:` (任何值除了`visible`) 
	- `overflow-y:` (任何值除了`visible`)
	- `position: fixed `

### 发现及使用


- 因元素`hasLayout`而导致的问题其实一般都很容易发现：往往是内容出现错位甚至完全不可见，比如含浮动或者绝对定位子元素的容器高度会塌陷，在`ie6/ie7`下我们为其添加`zoom：1`属性就触发了`haslayout`，从而修复高度塌陷的问题;再比如，我们经常会碰到`ie6`和`ie7`同时出现的`bug`，这个时候可以考虑是否源于 `haslayout`，可以添加一些可以触发`haslayout`的属性来解决
