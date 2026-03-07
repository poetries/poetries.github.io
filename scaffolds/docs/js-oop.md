---
title: OOP之面向对象
date: 2016-12-13 14:55:24
tags: 
   - JavaScript
   - 面向对象
categories: Front-End
---

>一般面向对象包含：继承，封装，多态，抽象

#### 对象形式的继承
---

##### 浅拷贝
---
<!--more-->

```javascript
var Person = {
    name: 'allin',
    age: 18,
    address: {
        home: 'home',
        office: 'office',
    }
    sclools: ['x','z'],
};

var programer = {
    language: 'js',
};

function extend(p, c){
    var c = c || {};
    for( var prop in p){
        c[prop] = p[prop];
    }
}
extend(Person, programer);
programer.name;  // allin
programer.address.home;  // home
programer.address.home = 'house';  //house
Person.address.home;  // house
```

- 从上面的结果看出，浅拷贝的缺陷在于修改了子对象中引用类型的值，会影响到父对象中的值，因为在浅拷贝中对引用类型的拷贝只是拷贝了地址，指向了内存中同一个副本

##### 深拷贝
---

```javascript
function extendDeeply(p, c){
    var c = c || {};
    for (var prop in p){
        if(typeof p[prop] === "object"){
            c[prop] = (p[prop].constructor === Array)?[]:{};
            extendDeeply(p[prop], c[prop]);
        }else{
            c[prop] = p[prop];
        }
    }
}
```
- 利用递归进行深拷贝，这样子对象的修改就不会影响到父对象

```javascript
extendDeeply(Person, programer);
programer.address.home = 'allin';
Person.address.home; // home
```

##### 利用call和apply继承
---

```javascript
function Parent(){
    this.name = "abc";
    this.address = {home: "home"};
}
function Child(){
    Parent.call(this);
    this.language = "js"; 
}
```

##### ES5中的Object.create()

```javascript
var p = { name : 'allin'};
var obj = Object.create(o);
obj.name; // allin
```

- `Object.create()`作为`new`操作符的替代方案是`ES5`之后才出来的。我们也可以自己模拟该方法：

```javascript
//模拟Object.create()方法
function myCreate(o){
    function F(){};
    F.prototype = o;
    o = new F();
    return o;
}
var p = { name : 'allin'};
var obj = myCreate(o);
obj.name; // allin
```

- 目前，各大浏览器的最新版本（包括`IE9`）都部署了这个方法。如果遇到老式浏览器，可以用下面的代码自行部署

```javascript
　if (!Object.create) {
　　　　Object.create = function (o) {
　　　　　　 function F() {}
　　　　　　F.prototype = o;
　　　　　　return new F();
　　　　};
　　}
```

#### 类的继承
---

##### Object.create()
---

```javascript
function Person(name, age){}
Person.prototype.headCount = 1;
Person.prototype.eat = function(){
    console.log('eating...');
}
function Programmer(name, age, title){}

Programmer.prototype = Object.create(Person.prototype); //建立继承关系
Programmer.prototype.constructor = Programmer;  // 修改constructor的指向
```

##### 调用父类方法
---

```javascript
function Person(name, age){
    this.name = name;
    this.age = age;
}
Person.prototype.headCount = 1;
Person.prototype.eat = function(){
    console.log('eating...');
}

function Programmer(name, age, title){
    Person.apply(this, arguments); // 调用父类的构造器
}


Programmer.prototype = Object.create(Person.prototype);
Programmer.prototype.constructor = Programmer;

Programmer.prototype.language = "js";
Programmer.prototype.work = function(){
    console.log('i am working code in '+ this.language);
    Person.prototype.eat.apply(this, arguments); // 调用父类上的方法
}
```

#### 封装
---

##### 命名空间
---

- `js`是没有命名空间的，因此可以用对象模拟

```javascript
var app = {};  // 命名空间app
//模块1
app.module1 = {
    name: 'allin',
    f: function(){
        console.log('hi robot');
    }
};
app.module1.name; // "allin"
app.module1.f();  // hi robot
```

##### 静态成员
---

```javascript
function Person(name){
    var age = 100;
    this.name = name;
}
//静态成员
Person.walk = function(){
    console.log('static');
};
Person.walk();  // static
```

##### 私有与公有
---

```javascript
function Person(id){
    // 私有属性与方法
    var name = 'allin';
    var work = function(){
        console.log(this.id);
    };
    //公有属性与方法
    this.id = id;
    this.say = function(){
        console.log('say hello');
        work.call(this);
    };
};
var p1 = new Person(123);
p1.name; // undefined
p1.id;  // 123
p1.say();  // say hello 123
```

##### 模块化
---

```javascript
var moduleA;
moduleA = function() {
    var prop = 1;

    function func() {}

    return {
        func: func,
        prop: prop
    };
}(); // 立即执行匿名函数
```

#### 多态
---

##### 模拟方法重载
---

- `arguments`属性可以取得函数调用的实参个数，可以利用这一点模拟方法的重载

```javascript
function demo(a, b ){
    console.log(demo.length); // 得到形参个数
    console.log(arguments.length); //得到实参个数
    console.log(arguments[0]);  // 第一个实参 4
    console.log(arguments[1]);  // 第二个实参 5
}

demo(4, 5, 6);
```

```javascript
//实现可变长度实参的相加
function add(){
    var total = 0;
    for( var i = arguments.length - 1; i >= 0; i--){
        total += arguments[i];
    }
    return total;
}

console.log(add(1));  // 1
console.log(add(1, 2, 3));  // 7


// 参数不同的情况
function fontSize(){
    var ele = document.getElementById('js');
    if(arguments.length == 0){
        return ele.style.fontSize;
    }else{
        ele.style.fontSize = arguments[0];
    }
}
fontSize(18);
console.log(fontSize());

// 类型不同的情况
function setting(){
    var ele = document.getElementById('js');
    if(typeof arguments[0] === "object"){
        for(var p in arguments[0]){
            ele.style[p] = arguments[0][p];
        }
    }else{
        ele.style.fontSize = arguments[0];
        ele.style.backgroundColor = arguments[1];
    }
}
setting(18, 'red');
setting({fontSize:20, backgroundColor: 'green'});
```

##### 方法重写
---

```javascript
function F(){}
var f = new F();
F.prototype.run = function(){
    console.log('F');
}
f.run(); // F

f.run = function(){
    console.log('fff');
}
f.run();  // fff
```

#### 抽象类
---

- 在构造器中 `throw new Error('')`; 抛异常。这样防止这个类被直接调用

```javascript
function DetectorBase() {
    throw new Error('Abstract class can not be invoked directly!');
}

DetectorBase.prototype.detect = function() {
    console.log('Detection starting...');
};
DetectorBase.prototype.stop = function() {
    console.log('Detection stopped.');
};
DetectorBase.prototype.init = function() {
    throw new Error('Error');
};

// var d = new DetectorBase();
// Uncaught Error: Abstract class can not be invoked directly!

function LinkDetector() {}
LinkDetector.prototype = Object.create(DetectorBase.prototype);
LinkDetector.prototype.constructor = LinkDetector;

var l = new LinkDetector();
console.log(l); //LinkDetector {}__proto__: LinkDetector
l.detect(); //Detection starting...
l.init(); //Uncaught Error: Error
```