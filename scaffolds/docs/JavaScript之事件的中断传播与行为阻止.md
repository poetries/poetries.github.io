---
title: JavaScript之事件的中断传播与行为阻止
date: 2016-07-27 11:50:43
tags: JavaScript
categories: Front-End
---

- 如何中断事件的传播？
   -  `stopPropagation() `    `w3c `取消冒泡
   -  `cancleBubble = true`     `IE`取消冒泡
 <!--more-->
- 取消事件默认效果：
  
  - `returnValue = false`  `IE` 取消事件效果
  - `defaultPrevent() `  `w3c`取消事件效果

---

```html
	<div id='aa'>
		<div id='bb'>
			<div id ='cc'></div>
		</div>
	</div>
 ```
 ```css
 		#aa{
			width: 600px;
			height: 600px;
			background: gray;
		}
		#bb{
			width: 400px;
			height: 400px;
			background: green;
		}
		#cc{
			width: 200px;
			height: 200px;
			background: red;
		}
 ```
 - 捕捉写法停止传播 从最顶层开始往下

```javascript
document.getElementById('aa').addEventListener('click',function (ev){alert('aa');ev.stopPropagation();},true);// 结果捕捉到aa 加true 由冒泡变为捕捉 从上到下
	document.getElementById('bb').addEventListener('click',function (){alert('bb')},true);
	document.getElementById('cc').addEventListener('click',function (){alert('cc')},true);
```

- 冒泡写法停止传播  从下往上

```javascript
document.getElementById('aa').addEventListener('click',function (){alert('aa');});//加true 由冒泡变为捕捉 从上到下
	document.getElementById('bb').addEventListener('click',function (){alert('bb')});
	document.getElementById('cc').addEventListener('click',
	function (ev){
	alert('cc');
	ev.stopPropagation();
	// ev.cancleBubble = true;//IE下 取消冒泡方法
	}); //结果是冒出cc 停止传播
}
```

---

- 取消事件效果

  - returnValue = false //IE 取消事件效果
  - preventDefault()  //w3c取消事件效果

```javascript
	document.getElementsByTagName('a')[0].onclick = function (ev){
		alert('点击');
		//达到事件结束的效果 但是函数还是往下运行
		//
		ev.preventDefault();
		alert('已经拦截');

	}
   ```
