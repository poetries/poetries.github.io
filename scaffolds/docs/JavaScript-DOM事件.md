---
title: JavaScript-DOM事件
date: 2016-07-27 11:40:43
tags: JavaScript
categories: Front-End
---

- DOM 事件就是指 当页面上发生某一件事的时候激发某一个函数 相当监听/触发设备
 <!--more-->
**比如：**
- 元素被单击时 `onclick`
- 元素失去焦点时	`onblur`
- 表单被提交时，用`onsubmit`

- **DOM事件如何声明？**

  - 直接在元素标签中声明 `<input type='button' onclick="">`
  - 以事件属性附上一个函数变量：例如` inputobj.onclick = 一个函数;`
 
  
- **主要的DOM事件：（可以归为3类）**
 ---

  - 页面上的变化引起的 比如 失去焦点 关闭页面
  - 鼠标变化引起的 比如 鼠标单击 鼠标经过
  - 键盘事件
 
  其中`onsubmit`比较特殊 ：
 
  在`<form onsubmit='return 函数名'> `这样函数`return false `时 才能阻拦表单的提交行为 
 
- **鼠标事件：**
---
    -	`onclick` 当单击时
    -	`onmouseOver` 当经过时
    -	`onMouseDown` 当鼠标按下时
    -	`onMouserUp` 当鼠标抬起时
    -	`onMouseMove` 当鼠标移动时
 

-  **键盘事件：**
---
 	-	`onchange `当内容被改变时[重要]
 	-	`onSelect` 当内容被选中时
 	-	`onkeydown `当键盘按下时
 	-	`onkeyup` 当键盘抬起时
 	-	`onSubmit `当表单提交时[重要]
 	-	`onReset `当表单重置时
 
  - **页面事件：**
---
  	-	`onblur` 当失去焦点时
  	-	`onfocus `当获得焦点时
  	-	`onload` 当页面加载时
  	-	`onunload` 当页面关闭时

- **onblur失去焦点**

```html
<form action="">
	<p>Email:<input type="text" name="email" value="" onblur="t1();"></p>
	<p>姓名:<input type="text" name="username" onfocus="t2();"></p>
</form>
```

```javascript
//失去焦点
function t1(){
    var con = document.getElementsByName('email')[0].value;
    if(con == ''){
        document.getElementsByName('email')[0].value = prompt('请输入邮件地址：');
    }
}

//获得焦点
function t2(){
    var con = document.getElementsByName('username')[0];
    con.style.border = '2px solid red';
}
  ```
  
- **onload**

```html
<body onload="t1();" onunload="t2();"><!--  onload写在页面的开始位置 -->
	
</body>
<form action="">
	<p>Email:<input type="text" name="email" value="" ></p>
	<p>姓名:<input type="text" name="username"></p>
</form>
```

```javascript
function t1(){
    var con = document.getElementsByName('email')[0].value='请填写您的email';

}

function t2(){
    alert("您真的要关闭吗");
}
```
    
- **onmouserover**

```html
<a href="#" onmouseover="t3();"  onmouseout="t4();">百度</a>
<p id="baidu">
    百度详细介绍
    <img src="./images/logo.png">
</p>

<p>
<select name="xueli" onchange="t5();">
    <option value="">请选择学历</option>
    <option value="大学" >大学</option>
    <option value="中学">中学</option>
    <option value="初中">初中</option>  
    <option value="小学">小学</option>  
</select></p>

<form action="" onsubmit="return t6();"> <!-- onsubmit 和return false结合才能阻止提交  地址栏没变化说明阻拦 -->
    <p>Email:<input type="text" name="email" value="" ></p>
    <p>姓名:<input type="text" name="username"></p>
    <p><input type="submit" value="提交 "></p>
</form>
```

```css
<style type="text/css">
    #img{
        display: none;
    }
</style>
 ```
    
```javascript
function t1(){
 	alert('来了');
 	
 }

 function t2(){
 	alert('走了');
 }

 function t3(){
 	var bd = document.getElementById('baidu');
 	bd.style.display = 'block';
 }
 function t4(){
 	 var bd = document.getElementById('baidu');
 	bd.style.display = 'none';
 }

 function t5(){
 	var sel = document.getElementsByTagName('select')[0];
 	// alert(sel.value);
 	if(sel.value == ''){
 		alert('至少选择一个');
 	}
 }

 function t6(){
 	 var con = document.getElementsByName('email')[0].value;
 	if(con == ''){
 			document.getElementsByName('email')[0].value = prompt('请输入邮件地址：');
 			return false;//和67行结合才能阻拦提交
 		}
 }
 ```
 
