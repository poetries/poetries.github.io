---
title: 原生JS与jQuery操作DOM对比
date: 2017-01-14 11:30:43
tags: 
   - JavaScript
   - DOM
categories: Front-End
---

### 一、创建元素节点
---

#### 1.1 原生`JS`创建元素节点
---

```javascript
document.createElement("p");
```

#### 1.2 `jQuery`创建元素节点
---
<!--more-->

```javascript
$('<p></p>');`
```

### 二、创建并添加文本节点
---

#### 2.1 原生JS创建文本节点
---

```javascript
`document.createTextNode("Text Content");
```

- 通常创建文本节点和创建元素节点配合使用，比如：

```javascript
var textEl = document.createTextNode("Hello World.");
var pEl = document.createElement("p");
pEl.appendChild(textEl);
```

#### 2.2 `jQuery`创建并添加文本节点：
---

```javascript
var $p = $('<p>Hello World.</p>');
```

### 三、复制节点
---

#### 3.1 原生`JS`复制节点: 
---

```javascript
var newEl = pEl.cloneNode(true);  `
```
- `true`和`false`的区别：
   - `true` ：克隆整个`'<p>Hello World.</p>'`节点
   - `false`：只克隆`'<p></p>'` ，不克隆文本`Hello World.'`


#### 3.2 `jQuery`复制节点
---

```javascript
$newEl = $('#pEl').clone(true);
```

- 注意：克隆节点要避免`ID重复

### 四、 插入节点
---

#### 4.1 原生JS向子节点列表的末尾添加新的子节点
---

```javascript
El.appendChild(newNode);
```

- 原生JS在节点的已有子节点之前插入一个新的子节点：

```javascript
El.insertBefore(newNode, targetNode);
```

#### 4.2 在jQuery中，插入节点的方法比原生JS多的多
---

- 在匹配元素子节点列表结尾添加内容

```javascript
$('#El').append('<p>Hello World.</p>');		     
```

- 把匹配元素添加到目标元素子节点列表结尾

```javascript
$('<p>Hello World.</p>').appendTo('#El');     	 
```
- 在匹配元素子节点列表开头添加内容

```javascript
$('#El').prepend('<p>Hello World.</p>');		 
```

- 把匹配元素添加到目标元素子节点列表开头

```javascript
$('<p>Hello World.</p>').prependTo('#El');     
```

- 在匹配元素之前添加目标内容

```javascript
$('#El').before('<p>Hello World.</p>');		     
```

-  把匹配元素添加到目标元素之前

```javascript
$('<p>Hello World.</p>').insertBefore('#El'); 	 
```

- 在匹配元素之后添加目标内容

```javascript
$('#El').after('<p>Hello World.</p>');		      
```

-  把匹配元素添加到目标元素之后

```javascript
$('<p>Hello World.</p>').insertAfter('#El');	  	 
```

### 五、删除节点
---

#### 5.1 原生JS删除节点
---

```javascript
El.parentNode.removeChild(El);
```

#### 5.2 jQuery删除节点
---

```javascript
$('#El').remove();
```

### 六、替换节点
---

#### 6.1 原生JS替换节点
---

```javascript
El.repalceChild(newNode, oldNode);
```

- 注意：`oldNode`必须是`parentEl`真实存在的一个子节点

#### 6.2 jQuery替换节点
---

```javascript
$('p').replaceWith('<p>Hello World.</p>');
```

### 七、设置属性/获取属性
---

#### 7.1 原生JS设置属性/获取属性
---

```javascript
imgEl.setAttribute("title", "logo");
imgEl.getAttribute("title");
checkboxEl.checked = true;
checkboxEl.checked;
```


#### 7.2 jQuery设置属性/获取属性:
---

```javascript
$("#logo").attr({"title": "logo"});
$("#logo").attr("title");
$("#checkbox").prop({"checked": true});
$("#checkbox").prop("checked");
```