---
title: JavaScript词法分析和作用域闭包
date: 2016-07-27 00:50:43
tags: JavaScript
categories: Front-End
---

- 在函数运行时 会进词法分析（预编译）
- 预编译做了哪些工作
  - 分析参数
  - 分析变量声明(分析带var的变量声明)
  - 分析函数声明 
<!--more-->
- 如何分析变量声明？
  - 答：对于var声明的变量 以`var str = ‘local’`为例，分为 分析过程 和执行过程 先分析后执行
 先分析`var str `即仅仅声明了一个str变量 `str`变量此时没有赋值 值是`undefined` 然后在进行执行过程

```javascript
/*var age = 22;
var num = 99;

 function t(){
 	var num = 88;
 	var str = 'hello';

 	function a(){

 		var  str = 'world';
 		alert(str);//world
 		alert(num);//88
 		alert(age);//22
 	}
 	a();


 }

 t();
 
```
 
 ```javascript

/*var str = 'global';

function t(){
	alert(str);//undefined
	var str = 'local';//local
	alert(str);

	//词法分析
	var str;

	//执行语句
	alert(str)
	str = 'local'
	alert(str)


}

t();

```


- **活动对象、激活对象 Active Object**

- AO上有哪些属性：
-  对于函数的AO属性来自三个方面
   - 参数
   - 局部变量声明
   - 函数声明

- 在函数调用瞬间 `AO`这样形成
- 首先分析参数 把分析的的参数形成`AO`属性 如果传来实参 则把实参赋给相应的属性
- 其次分析var声明 以`var str= hello`为例 把str声明为AO的属性 值为`undefined  `
- 如果var声明的变量名与形参名称一致 不产生影响 因为`AO`的str已经存在
- 最后分析函数声明，` function函数名(){}`//有函数名

- 函数的变量有其作用域，引用某变量时，在某个范围内查询该变量，这个范围又在哪里？在AO上找 在函数调用的瞬间  会产生一个AO 这个AO对象的属性 即存储着该函数所能引用的到的变量


```javascript
var str = 'global';

function t(age){
	alert(age);//99
	var age = 12;
	alert(age);//12

}
t();
```

对上面的结果进行分析：

AO：{age:undefined} //词法分析得到
AO：{age:99} //实参赋值 AO.age属性
AO:{age:12}  //修改AO.age的值


```javascript
function f(age,hei){
	var age;
	alert(age);
	function age(){
		alert('he');
	}
}
```

- 分析过程：
  + AO:{}
  + AO:{age:undefined,hei:undefined}
  + AO:{age:32,hei,undefined}
  + 分析完形参 紧接着分析var age  不产生影响 因为AO的age已经存在
  + AO:{age:function(){aler..},hei:undefined}
  + 执行
  + alert(age)---》AO.age---》函数



- 函数就是变量 函数声明就是变量声明

- 函数声明：假设函数名fn 函数声明会把函数赋值为AO.fn属性的值 

- **函数声明与函数表达式的区别**
- 表达式必有一个返回值 （即 匿名函数赋给了一个变量 此时 就是普通的赋值过程）
- 函数表达式返回返回 并把函数作为值 赋给变量
- 函数声明的优先级高 例如
` function fn(){} 则会把AO.fn = function fn(){}`
 
- **函数表达式**

```javascript
 function fn1(){
 	alert(age);

 	var age = function(){
 		alert('hahh');
 	}
 	alert(age);
 }
 fn1(32);

 //结果： 32 function
 
 //函数声明
 function fn1(){
 	alert(age);

 	function age(){
 		alert('hahh');
 	}
 	alert(age);
 }
 fn1(32);

 //结果： function function
 
```

- **闭包**
   - a.程序永远是先定义后执行
   - b.执行永远从上到下
   - c.函数定义的话在堆（只是一个地址而已）
   - d.函数调用的时候，就会有自己的堆和栈（`闭包`）

- **闭包 作用域**
---

   + 记住：先定义`var`  `function`  在从上往下执行
   + 定义在自己的栈里面 执行在自己的堆里面
   + 运行在运行的环境中
   + 函数每调用前  只是一个地址
   + 只要调用一次函数就会动态开辟一块内存 创建一个封闭的空间 在自己的封闭的空间的栈中定义`var `在执行
   + 函数执行完 里面的东西全部销毁

```javascript
//alert(x);//9:执行弹出x,结果x没定义,错误.
alert(i);//9:执行弹出i,然而i之前已经定义,只不过没地址,因此是undefiend
var i = 10;//1:var i;    10:把常量池中10的地址赋给栈中的i
var j = "你好";//2:var j;   11:把常量池中 你好 的地址复给栈中的j
var k = z = null;//3:var k,z;  12:把堆中null的地址赋值给z和k
var m = function(){//4:var m;   5:function匿名函数  13:把匿名函数在堆中的地址赋给栈中的m
    alert(2);
}
var b = document.body;//6:var b;    14:把堆中document.body对象的地址赋给栈中的b
var f = true;//7:var f; 15:把常量池中true的地址赋给栈中的变量f
function m(){//8:function m;
    alert(1);
}

```


```javascript
function m(){
    c = 50;//在局部变量中找不到定义的c 沿着作用域链找到了全局变量的c
    alert('哈哈哈');
    //var c;
}

var c = 150; // 函数m()还未执行到 还没被销毁 此时全局c的值c=50
m();
var c = 20;//到这里一步 m()已经执行完了 函数已经销毁了  这里的c还是20
alert(c);//20

```
```javascript
function m(){
    c = 50;//在局部变量中找不到定义的c 沿着作用域链找到了全局变量的c
    alert('哈哈哈');
    function inner(){
        c = 30;
        alert('嘻嘻');
    }
    inner();//c在函数内部找不到定义 所以沿着作用域链找到了全局的c
}

var c = 20;//到这里一步 m()还没执行 函数没被销毁  这里的c是30
m();

alert(c);//30

```
