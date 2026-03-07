---
title: JavaScript作用域分析总结
date: 2017-01-10 12:50:43
tags: 
   - JavaScript
   - 作用域
categories: Front-End
---

> 原文链接 http://blog.poetries.top/2017/01/10/js-scope

#### 一、JS解析顺序和作用域：

- 解析顺序：
   - 定义（先找`var`  `function`）  
   - 执行 ( 在逐步执行 )
   - 注意:如果函数名和`var`定义的变量相同，`var`会被函数覆盖
- 作用域：
   - 每个`script`是一个作用域
   - 每个函数`{}`是一个作用域
   - 程序每执行到一个作用域，都是按照解析顺序解析代码；
   - 作用域链:从内往外找要找函数内的变量；

<!--more-->
#### 二、案例分析
---

- **分析前请记住这段话**
  - 解析顺序：
     -  定义（先找`var`  `function`）
     - 执行 ( 在逐步执行 )
     - 注意:如果函数名和`var`定义的变量相同，`var`会被函数覆盖

- 举例1

```javascript
alert( a );
var a = 10;
alert( a );
function a(){alert(20)};
alert( a );
var a = 30;
alert( a );
function a(){alert(40)};
alert( a );
// 函数块 10 10 30 30
```

>分析
   - 1:找定义 function a(){alert(40)};
   - 2:执行 alert( a ) //函数块
             a = 10;
             alert( a ); // 10
             alert( a ); // 10
             a = 30;
             alert( a ); // 30
             alert( a ); // 30


- 举例2

```javascript
a();
var a = function(){alert( 1 );}
a();
function a(){alert(2);}
a();
var a = function(){alert(3);}
a();
//2 1 1 3
```

> 分析
   - 1:找定义
         function a(){alert(2);}
   -  2:执行
          a(); //2
          a = function(){alert( 1 );}
          a(); //1
          a(); //1
          a = function b(){alert(3);};
          a();//3

- 举例3

```javascript
 var a = 0;
  function fn(){
           alert( a );
           var a = 1;
           alert( a );
    }
 alert(a);
fn();
```

> 分析
- 1:找定义
	  var a
	  function fn(){}
- 2:执行
	  a = 0;
	  fn(); ===> 1:找定义
			     2:执行 alert(a); //undefined
					  a = 1;
					  alert(a); //1



- 举例4

```javascript
fn()();
var a = 0;
function fn(){
	alert( a );
	var a = 3;
	function c(){
		alert( a );
	}
	return c;
};
```

> 分析
- 1:找定义
	  var a
	  function fn
- 2:执行
	  fn() ===> 1:找定义 function c
		        2:执行  alert(a); //undefined
					  a = 3
					  return function c
	  fn()() ==>1:找定义 function c
			  2:alert(a);//undefined 3
	  a = 0;


- 举例5

```javascript
var a = 5;
function fn(){
	var a = 10;
	alert(a);
	function b(){
		a++;
		alert(a);
	};
	return b;
};
var c = fn();
c();
fn()();
c();
```

> 分析
- 1:找定义 var a
	  function fn
	  var c
- 2:执行  a = 5;
	  c = fn(); === > 1:找定义 var a
                           function b
                      2:执行  a = 10;
                           alert(a);  //10
                           return function b(){};
	  c();=========>  1:找定义
                      2:执行 a++; //11
                           alert(a);//11
                           fn()(); //10 11
	  c() ========>   1:找定义
                      2:执行 a++;//11+1;
                           alert(a); //12

- 举例6

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

- 举例7

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

- 举例8

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

#### 三、闭包
---

##### 3.1 概念
---

- 其实是函数嵌套函数
- 每个函数都是一个独立的作用域
- 每个都有自己的生命周期
- 延长局部变量的生命周期

##### 3.2 例子
---

```html
 <ul id="list">
        <li>01</li>
        <li>02</li>
        <li>03</li>
        <li>04</li>
</ul>
```
```javascript
 var liDoms = document.getElementById("list").getElementsByTagName("li");
        for(var i=0;i<liDoms.length;i++){
            (function(a){
                liDoms[a].onclick = function(){
                    alert(a);
                }
            })(i)
        }
```

```javascript
//函数也是一种数据类型 它和 number string boolean object 特殊在可以打括号去执行它

        //函数中的循环
        function test(){
            var arr = [],i;
            for(i=0;i<3;i++){
                // arr[i] = (function fn(a){
                //     return a;
                // })(i);

                arr[i] = fn(i);
            }
            return arr;
        }


        function fn(a){
            return a;
        }

        var c = test();
        //alert(c);
        for(var i=0;i<c.length;i++){
            var value = c[i];
            alert(value);
        }
```

