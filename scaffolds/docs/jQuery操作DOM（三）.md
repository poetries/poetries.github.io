---
title:  jQuery操作DOM（三）
date: 2016-08-07 21:10:08
tags: jQuery
categories: Front-End
---

### 操作DOM
<!--more-->
- 什么是`DOM`：`Document Object Model`缩写，文档对象模型
- 理解页面的树形结构
- 什么是节点：是`DOM`结构中最小单元，包括元素、属性、文本、文档等。
	

### 创建节点

- 创建元素

语法：

```javascript
document.createElement(name);

var div = document.createElement("div");
document.body.appendChild(div);
```
`$(html)`：根据传递的标记字符串，创建`DOM`对象

- 创建文本
		
```javascript
var div = document.createElement("div");
var txt = document.createTextNode("DOM");
div.appendChild(txt);
document.body.appendChild(div);

var $div = = $("<div>DOM</div>");
$(body).append($div);
```
		
- 设置属性
	- 语法：`setAttrbute(name,value)`
		
```javascript
var div = document.createElement("div");
var txt = document.createTextNode("DOM");
div.appendChild(txt);
document.body.appendChild(div);
div.setAttribute("title","盒子");

var $div = = $("<div title='盒子'>DOM</div>");
$(body).append($div);
```
		
### 插入内容

- 内部插入
	- 向元素最后面插入节点：
		- `append():`向每个匹配的元素内部追加内容
		
		- `appendTo():`把所有匹配的元素追加到指定元素集合中，`$("A").append("B") 等效 $("B").appendTo("A")`
		
	- 向元素最前面插入节点：
		- `prepend（）`：把每个匹配的元素内部前置内容
		- `prependTo（）`：把所有匹配的元素前置到另一个指定的元素集合中,`$("A").prepend("B")` 等效` $("B").prependTo("A")`

- 外部插入
    - `after():`在每个匹配的元素之后插入内容

    - `before()`：在每个匹配想元素之前插入内容

    - ` insertAfter()：`将所有匹配的元素插入到另一个指定的元素集合后面，`$A.insert($B) `等效 `$B.insertAfter($A)`;

    - `insertBefore()`：将所有匹配的元素插入到另一个指定的元素集合前面 `$A.before($B)` 等效 `$B.insertBefore($A);`


### 删除内容

- 移除
	- `remove():`从`DOM`中删除所有匹配元素

- 清空
	- `empty()`:删除匹配的元素集合中所有子节点内容

### 克隆内容：创建指定节点副本

- `clone()`
- **注意**：若`clone（true）`则是包括克隆元素的属性，事件等

### 替换内容

- `replaceWith()`:将所有匹配的元素替换成指定的元素
- `replaceAll()`:用匹配的元素替换掉指定元素

- **注意**：两者效果一致，只是语法不同 `$A.replaceAll($B)` 等效于 `$B.replaceWhith($A)`;
