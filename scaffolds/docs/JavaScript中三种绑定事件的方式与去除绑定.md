---
title: JavaScript中三种绑定事件的方式与去除绑定
date: 2016-07-27 11:40:43
tags: JavaScript
categories: Front-End
---


- 绑定事件的第1种办法：
  - 函数写在结构层里面
  - 非常不好，使页面很混乱，行为与结构得不到分离
<!--more-->    
```html
<input type="button" onclick="func();">
```

---

- 绑定事件的第2种办法
  - 好处：行为与结构开始分离
  - 缺点：
 
    - 第二种绑定方式中 
    - 只能给一个时间绑定一个处理函数 
    - 即.`onclick = fn1`;.`onclick = fn2`  最终的效果是`onclick = fn2`

```html
<select name="xueli" >
	<option value="">请选择学历</option>
	<option value="大学" >大学</option>
	<option value="中学">中学</option>
	<option value="初中">初中</option>	
	<option value="小学">小学</option>	
</select>

<form action="">
	<p>Email:<input type="text" name="email">
	  姓名：<input type="text" name="ming" >

	 </p>
</form>
```

```javascript

document.getElementsByTagName('select')[0].onclick= function (){
 	 alert('嘻嘻');

 }

document.getElementsByName('email')[0].onblur=function (){
	alert('哈哈哈');

}
```

```javascript
window.onload = function(){
		var d = document.getElementById('school');
		function fn1(){
			alert('hello');
		}
		function fn2(){
			alert('world');
		}

		d.onclick = fn1;//赋值操作 最终显示fn2
		d.onclick = fn2;
}

```

---

- 绑定事件的第3种办法

```javascript
//错误写法1
window.onload = function(){
		var d = document.getElementById('school');
		function fn1(){//this此时指向window
			this.style.background = 'blue';
		}
		function fn2(){//this此时指向window
			this.style.background = 'red';
		}
		//写一个匿名函数
		//最终的出现错误
		d.onclick = function (){
			fn1();
			fn2();
			//fn1 fn2是属性window的 实际上是这样 window.fn1() window.fn2()
			
			
		}

}
```

 下面这种写法没有问题 但是给DOM树额外增加了两个变量
```javascript

window.onload = function(){
		var d = document.getElementById('school');
		d.fn1 = function (){//fn1是d的属性 最终this此时指向DOM对象
			this.style.background = 'blue';
		}
		d.fn2 = function (){//this此时指向DOM对象
			this.style.background = 'red';
		}
		
		//匿名函数 调用上面两个函数
		d.onclick = function (){
			this.fn1();
			this.fn2();

		}

}
```

不在使用`onclick`

```javascript
window.onload = function(){
		var d = document.getElementById('school');
		//达到了一次绑定两个函数
		d.addEventListener('click',function () {alert('blue');this.style.background ='blue'});
		d.addEventListener('click',function () {alert('red');this.style.background ='red'});
		

}


```

去除绑定 不能用匿名函数 匿名函数 当时产生 当时消失

```javascript
var fn1 = function () {alert('blue');this.style.background ='blue'};
var fn2 = function () {alert('red');this.style.background ='red'};

		
function adde(){
			var d = document.getElementById('school');

			d.addEventListener('click',fn1);
			d.addEventListener('click',fn2);

		}

function reme(){
	var d = document.getElementById('school');

	//d.removeEventListener('click',fn1);//只剩fn1
	d.removeEventListener('click',fn2);
}

```

- **在IE下第三种绑定事件的方法**

```html
<div id="school">
		
	</div>
	<input type="button" value="加事件" onclick="adde();">
	<input type="button" value="减事件" onclick="reme();">
```

```javascript
var fn1 = function () {alert('blue');this.style.background ='blue'};
var fn2 = function () {alert('red');this.style.background ='red'};

		
function adde(){
			var d = document.getElementById('school');

			// IE6,7是后绑定的事件先发生
			d.attachEvent('onclick',fn1);
			d.attachEvent('onclick',fn2); //fn2先发生

		}

function reme(){
	var d = document.getElementById('school');

	//d.deltachEvent('click',fn1);//只剩fn1
	d.deltachEvent('click',fn2);
}

```

    
