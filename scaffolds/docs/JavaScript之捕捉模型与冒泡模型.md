---
title: JavaScript之捕捉模型与冒泡模型
date: 2016-07-27 11:40:43
tags: JavaScript
categories: Front-End
---

- 在`w3c`模型中 `addEventListener`支持第3个参数来声明事件的模型为冒泡还是捕捉，如果声明为`false`，则为冒泡方式
<!--more-->
```javascript
window.onload = function (){//ev激发的过程自动为函数传一个参数  鼠标的一系列动作包装成对象自动传给函数
	document.getElementById('par').addEventListener ('click',function (ev){alert(ev.pageX)},true);
	document.getElementById('son').addEventListener ('click',function (){alert('son')});
	

}
```

- 捕捉模型与冒泡模型在IE下测试

```javascript
window.onload = function (){//对于IE 当事件发生的瞬间 事件对象赋值给window.event属性
	document.getElementById('par').attachEvent ('onclick',function (ev){alert(window.event)});//IE下不支持第三个参数 true  
	document.getElementById('son').attachEvent ('onclick',function (){alert('son')});
	

}
```
