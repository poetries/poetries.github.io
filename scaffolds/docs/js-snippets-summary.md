---
title: javascript常用积累
date: 2017-01-14 08:20:43
tags: 
   - JavaScript
   - Snippet
categories: Front-End
---

#### 一、JS动画与动作不一致解决:  
---

```javascript
if(!$( "#handle").is(":animated")){
	//判断元素是否处于动画状态
}
```
<!--more-->

#### 二、停止事件冒泡
---

```javascript
event.stopPropagation();
- 禁止JS报错
	window.onerror = function(){
		return true ; 
}

try {
/*try to do*/
} catch(e){
/*do this if try error */
}
```

#### 三、查看JS对象属性
---

```javascript
	var res = '' ; 
var obj = eval( obj );
	for( var p in eval( obj ) ){
		var prop = p + ':' + obj[p] + '\n' ; 
		res += prop ; 
	}
	alert( res );
```

#### 四、页面刷新时禁用提交按钮
---

```javascript
	window.onbeforeunload = function(){
		$(':submit').attr('disabled',true);
	}
```
**注意**：`Opera` 浏览器不支持，其他浏览器避免在同一页面中使用 `"javascrpt:"` 等伪协议

#### 五、获取事件
---

```javascript
var getEvent = function(){
	var ieEvent = window.event ; 
	var ffEvent = arguments.callee.caller.arguments[0] ; 
	//arguments.callee						当前执行函数
	//arguments.callee.caller				当前执行函数的调用者
	//arguments.callee.caller.arguments[0]	当前函数调用者的第一个参数
	var e = ieEvent || ffEvent ; 
	return e ;
}
```

- 获取鼠标距离浏览器顶部 左侧的实际距离 兼容IE

```javascript
function getXY(ev){
	var ev = ev || window.event;
	var xx  = 0;
	var yy = 0;
	if(ev.pageX){ //iE9+
		xx = ev.pageX;
		yy = ev.pageY;
	}else{ 
		//IE678 clientX,clientY + scroll
		var scrollTop = document.documentElement.scrollTop || 
				   document.body.scrollTop;//IE9+
		var scrollLeft = document.documentElement.scrollLeft || 
					document.body.scrollLeft;//IE9+     
		xx = ev.clientX + scrollLeft;
		yy = ev.clientY + scrollTop;
	}
	return {
		x:xx,
		y:yy
	};

	}
```


#### 六、获取键盘码
---

```javascript
var getKCode = function(){
		var ieEvent = window.event ; 
		var ffEvent = arguments.callee.caller.arguments[0] ; 
		var e = ieEvent || ffEvent ; 
		var kCode = e.keyCode || e.which ;
		return kCode ;
	}
```

#### 七、 鼠标滑入/滑出样式切换
---

```javascript
$("div").on("mouseover mouseout", function(){
    $(this).toggleClass("over");
 });
```

#### 八、点击鼠标,显示/隐藏切换
---

```javascript
$("#panel h5.head").toggle(function(){
	$(this).toggleClass("highlight");
	$(this).next().toggle();
},function(){
	$(this).toggleClass("highlight");
	$(this).next().toggle();
});
```

#### 九、JS 调试
---

```javascript
console.log() ;			//打印变量
console.dir() ; 		//打印对象
console.dirxml() ; 		//打印节点
console.trace() ; 		//打印函数调用轨迹
window.document.title = str;  
```

####  十、为子元素集合绑定事件
---

```javascript
$("div").delegate("button","click",function(){
	$("p").slideToggle();
});
```

#### 十一、自定义`IE`浏览器渲染方式(解决`IE10`下`JS`或插件失效):
---

如果安装了`Chrome`内核，则使用`Chrome`内核来渲染页面`[chrome=1]`，如果未安装，则使用最高版本的IE内核进行渲染`[IE=edge]:`

```html
<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" /> 
```

#### 十二、注册事件
---

```javascript
// 标准浏览器
form1.addEventListener('submit', function(e){
    e.preventDefault();		//阻止浏览器默认动作
	e.stopPropagation();		//阻止事件流产生
});
```

```javascript
// IE8及更早版本IE浏览器
form1.attachEvent('submit', function(){
	event.cancelBubble = true; //阻止浏览器默认动作--IE8及更早版本IE浏览器
	event.returnValue = false; //阻止事件流产生--IE8及更早版本IE浏览器
}
```