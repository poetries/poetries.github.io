---
title: JS 中的 call、apply、bind 方法
date: 2016-12-13 14:55:24
tags: JavaScript
categories: Front-End
---

- `call()`、`apply()`、`bind()`都是函数对象的一个方法，它们的作用都是改变函数的调用对象。它的使用极大的简化了代码的调用

#### 一、方法定义

- **call方法**
- 语法
    
```
fun.call(thisArg[, arg1[, arg2[, ...]]])
```
- `thisArg`：`fun`函数运行时指定的`this`值，可能的值为：
    - 不传，或者传`null`，`undefined`， `this`指向`window`对象
    - 传递另一个函数的函数名`fun2`，`this`指向函数fun2的引用
    值为原始值(数字，字符串，布尔值),this会指向该原始值的自动包装对象，如 String、Number、Boolean
    - 传递一个对象，函数中的`this`指向这个对象
    
<!--more-->

- **apply方法**
- 语法：`apply([thisObj[,argArray]])`
  - 定义：应用某一对象的一个方法，用另一个对象替换当前对象。   
  - 说明：`apply`的第一个参数`thisObj`和`call`方法的一样，第二个参数`argArray`为一个传参数组`thisObj`如果未传，那么 `Global `对象被用作 `thisObj`

- **bind方法**

    - 在`ECMAScript5`中扩展了叫`bind`的方法（`IE6,7,8`不支持）
    
    - 语法：`bind([thisObj[,arg1[, arg2[, [,.argN]]]]])`
    
    - 定义：应用某一对象的一个方法，用另一个对象替换当前对象。
    
    - 说明：`bind`的`thisObj`参数也和`call`方法一样，`thisObj`如果未传，那么 `Global `对象被用作 `thisObj`。arg1 … argN可传可不传。如果不传，可以在调用的时候再传。如果传了，调用的时候则可以不传，调用的时候如果你还是传了，则不生效

```
var person = {
    name:"tsrot",
    age:24,
    sayHello:function(age){
        console.log(this.name);
        console.log(age);
    }
    };
var son = {
 name:"xieliqun"
 };
var boundFunc = person.sayHello.bind(son);
boundFunc(25); 
```

```
var boundFunc = person.sayHello.bind(son,25);
boundFunc(); 
```

```
var boundFunc = person.sayHello.bind(son,25);
boundFunc(30); 
```

#### 二、call、apply、bind的区别

- `call`的`arg`传参需一个一个传，`apply`则直接传一个数组

```
function hello(name,age){
 console.log(name);
  console.log(age);
  }
hello.call(this,"tsrot",24);
hello.apply(this,["tsrot",24]);
```
- `call`和`apply`直接执行函数，而`bind`需要再一次调用

```
var obj = {
    x: 81,
    };
var foo = {
    getX: function() {
        return this.x;
    }
    }
console.log(foo.getX.bind(obj)());  
console.log(foo.getX.call(obj));    
console.log(foo.getX.apply(obj));   
```

#### 三、运用场景

- 实现继承

```
function Animal(name) {
  this.name = name;
  this.showName = function () {
    console.log(this.name);
  }
  }
function Cat(name) {
  Animal.call(this, name); 
  }
var cat = new Cat('Black Cat');
cat.showName(); 
```

- 数组追加

```
var array1 = [1 , 2 , 3, 5];
var array2 = ["xie" , "li" , "qun" , "tsrot"];
Array.prototype.push.apply(array1, array2);
console.log(array1);
```

- 获取数组中的最大值和最小值

```
var num = [1,3,5,7,2,-10,11];
var maxNum = Math.max.apply(Math, num);
var minNum = Math.min.apply(Math, num);
console.log(maxNum); 
console.log(minNum); 
```

- 将伪数组转化为数组

```
var fakeArr = {0:'a',1:'b',length:2};
var arr1 = Array.prototype.slice.call(fakeArr);
console.log(arr1[0]); 
var arr2 = [].slice.call(fakeArr);
console.log(arr2[0]); 
arr1.push("c");
console.log(arr1); 
```

- 保存this变量

```
var foo = {
    bar : 1,
    eventBind: function(){
        var _this = this ;
        $('.someClass').on('click',function(event) {
            console.log(_this.bar);     
        });
    }
    }
var foo = {
    bar : 1,
    eventBind: function(){
        $('.someClass').on('click',function(event) {
            console.log(this.bar);      
        }.bind(this));
    }
    }
```