---
title: 浅谈闭包
date: 2017-03-22 14:24:08
tags: 
   - JavaScript
   - 闭包
categories: Front-End
---

> 闭包的形成跟变量的作用域以及变量的生存周期密切相关

## 一、变量的作用域,是指变量的有效范围

- 当在函数中声明一个变量的时候,如果该变量前面没有带上关键字 `var`,这个变量就会成为全局变量 ,这当然是一种很容易造成命名冲突的做法。
另外一种情况是用 `var` 关键字在函数中声明变量,这时候的变量即是局部变量,只有在该函数内部才能访问到这个变量,在函数外面是访问不到的。

例：变量的搜索是从内到外而非从外到 内的

```javascript
var a=1;
var func1 = function(){ 
    var b=2;
    var func2 = function(){ 
        var c=3;
        console.log ( b ); // 输出:2 
        console.log ( a );// 输出:1
    }
    func2();
    console.log(c);//输出:Uncaught ReferenceError: c is not defined
}; 
func1();
```

## 二、变量的生存周期

- 对于全局变量来说,全局变量的生存周期当然是的永久,除非我们主动销毁这个全局变量。
- 而对于在函数内用` var `关键字声明的局部变量来说,当退出函数时,这些局部变量即失去了 它们的价值,它们都会随着函数的调用的结束而销毁

例一：

```javascript
var func = function(){ 
    var a=1;
    return function(){ 
        a++;
        console.log(a);
    } 
};
var f=func();
f();// 输出:2 
f();// 输出:3
f();// 输出:4
f();// 输出:5
```
- 跟我们之前的结论相反,上面的例子在当退出函数后,局部变量` a` 并没有消失,而是似乎一直在某个地方 存活着。这是因为当执行 `var f = func();`时,`f` 返回了一个名函数的引用,它可以问到` func()` 被调用时产生的环境,而局部变量 `a` 一直处在这个环境里。既然外局部变量所在的环境还能被外 界访问,这个局部变量就有了不被销毁的理由。在这里生了一个闭包结构,局部变量的声明看起来被延续了。

例二，假设页面上有 5 个 div 节点,我们通过循环来给每个 div绑定 onclick 事件,按照索引顺序,点击第 1 个 div 时弹出 0,点击第 2 个 div 时出 1,以此类

```javascript
var nodes = document.getElementsByTagName( 'div' );
for(var i=0,len=nodes.length;i&lt;len;i++){ 
    nodes[ i ].onclick = function(){
        alert(i); 
    }
};
```

- 测试这段代码会发现,无论点击哪个 div,最后弹出的结果都是 5
- 这是因为 `div` 节点的 `onclick` 事件是被异步触发的,当事件被触发的时候,`for`循环早已结束,此时 i 的值已经是 `5`,
- 所以在 `div `的 `onclick` 事件函数中顺着作用域链从内到外查找变量 i 时,查找到的值总是 `5`。
- 解决方法是在闭包的帮助下,每次循环的` i` 值都封闭起来。当在事件函数中顺着作用域链从内到外查找变量 `i `时,会先找到被封闭在闭包环境中的` i,`如果有` 5 `个`div`,这里的` i `分别 是 `0,1,2,3,4`

```javascript
for(var i=0,len=nodes.length;i&lt;len;i++){ 
    (function( i ){
        nodes[ i ].onclick = function(){ 
            console.log(i);
        } 
    })(i)
};
```

## 三、闭包的作用

### 1、封装变量—-闭包可以帮助一些不需要暴露在全局的变量封装成“私有变量”

- 例一，计算乘积

```javascript
var mult = function(){ 
    var a=1;
    for(var i=0,l=arguments.length;i&lt;l;i++){ 
        a = a * arguments[i];
    }
    return a; 
};
```
### 2、延续局部变量的寿命

## 四、闭包与内存泄漏

```javascript
function a() {
    var i = 0;

    function b() {
        console.log(++i);
    }
    return b;
}
var c = a();
c();
```

- 首先有一个封闭的函数`a`（即自定义的一个`function a()`方法），该函数内部的变量`b`（局部变量/局部方法）外部无法直接调用；但如果把这个函数赋值给一个全部变量`c`时，
- 全局变量c就获取到了函数局部变量b的值，从而使局部变量`b`的值得到了保存，即延长了一个局部变量`b`的生命周期，除非主动销毁这个全局变量`c`。
此时，我们也就制造出来了一个“闭包”。简单说“闭包是指有权限访问另一个函数作用域的变量的函数”。
- 在这个过程中，因为局部变量b的声明周期延长，使得`Javascript`的垃圾回收机制不会收回函数`a`所占用的资源,因为函数a的局部变量`b`的执行需要依赖函数a中的变量。