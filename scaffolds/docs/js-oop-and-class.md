---
title: OOP之类与对象
date: 2016-12-13 14:55:24
tags: 
   - JavaScript
   - 面向对象
categories: Front-End
---

#### 对象
---

##### 对象的含义 

- 所谓对象，就是一种无序的数据集合，由若干个“键值对”（`key-value`）构成
<!--more-->
##### 对象的创建

- 使用`new`运算符创建`Object`

```javascript
var p = new Object();
p.name = "Tony";    
```

- 使用对象字面量的形式

```javascript
//对象字面量形式
var p ={
    name: "tony",
    work: function(){
        console.log("working....");
    },
    _age: 18,
    get age(){
        return this._age;
    },
    set age(val){
        if( val <0 || val > 150){
            throw new Error("invalid value");
        }else{
            this._age = val;
        }
    }
}
console.log(p.name);
```

##### 对象的基本操作

- 成员属性的添加

```javascript
// Object.defineProperty()方法
Object.defineProperty(p, "age",{value: 18, writable: false});
//Object.defineProperties()方法 添加多个属性
Object.defineProperties(p, {
    salary:{
        value: 1000,
        writable: false
    },
    gender:{
        value: true
    }
});
```

- 成员的遍历

    - 使用 `for..in`语句
    - `Object.keys()`方法 返回一个包含对象键名的字符串数组

```javascript
var o ={};
o.name = "jack";
o.age = 20;
for(var i in o){
    console.log(o[i]);
} // jack, 20
Object.keys(o); // ["name", "age"]
```

- 检查对象是否有某个属性

    - `in` 操作符
    - `Object.hasOwnProperty()`方法

```javascript
var o = {name: "mariya"}
"name" in o; // true
o.hasOwnProperty("name"); // true
```

- 得到对象的属性特性描述 `Object.getOwnPropertyDescriptor(obj,property)`

```javascript
Object.getOwnPropertyDescriptor(o, "name");
//Object {
//    value: "mariya", writable: true, enumerable: true, configurable: true
}
```

- 删除属性
  - `delete`运算符,但有些对象的属性是删除不了的
  
```javascript
delete o.name; //true
o.name;  // undefined 
```

##### Constructor属性

- `constructor`始终指向创建当前对象的构造函数

```javascript
    var arr = [];
    console.log(arr.constructor === Array); // true
    var Foo = function() {};
    console.log(Foo.constructor === Function); // true
    // 由构造函数实例化一个obj对象
    var obj = new Foo();
    console.log(obj.constructor === Foo); // true
    console.log(obj.constructor.constructor === Function); // true
```

- 每个函数都有一个默认的属性`prototype`，而这个`prototype`的`constructor`默认指向这个函数

#### 类的创建
---

- 虽然`js`是门基于对象的语言，但是没有类这一概念的，虽然保留了`class`的关键字，但在`ES6`之前是无法使用的。所以，可以用构造函数模拟类的创建，也就是伪类。

- 所谓"构造函数"，其实就是一个普通函数，但是内部使用了`this`变量。对构造函数使用`new`运算符，就能生成实例，并且`this`变量会绑定在实例对象上
- 每一个构造函数都有一个`prototype`属性，指向另一个对象。这个对象的所有属性和方法，都会被构造函数的实例继承

```javascript
//构造函数模式
function Person(age, name){ //Class
    this.age = age;
    this.name = name;
}
//将公共的属性或方法放在prototype属性上
Person.prototype.headCount = 1;
//创建实例对象
var p = new Person(19, 'johnsom');
var p1 = new Person(20, 'allen');
```

#### this
---

- `this`表示当前对象，如果在全局作用范围内使用`this`，则指代当前页面对象`window`； 如果在函数中使用`this`，则`this`指代什么是根据运行时此函数在什么对象上被调用。 我们还可以使用`apply`和`call`两个全局方法来改变函数中`this`的具体指向

##### 全局代码中的this

```javascript
console.log(this === window); //true 全局范围内使用this指向window对象
```

##### 普通的函数调用

```javascript
function f(){
this.name = "tony"; // this在运行时指向window对象,在严格模式下则是undefined
}
```

##### 在对象中使用

```javascript
var o = {
    name: "tony",
    print: function(){
        console.log(this.name);  //this指向对象o，但是可以改变其指向
    }
};
```

##### 作为构造函数

```javascript
new F(); // 函数内部的this指向新创建的对象。
```

##### 多层嵌套的内部函数

```javascript
var name = "global";
var person = {
    name : "person",
    hello : function(sth){
        var sayhello = function(sth) {
            console.log(this.name + " says " + sth);
        };
        sayhello(sth);
    }
}
person.hello("hello world");//global says hello world
```

- 在内部函数中，`this`没有按预想的绑定到外层函数对象上，而是绑定到了全局对象。这里普遍被认为是`JavaScript`语言的设计错误，因为没有人想让内部函数中的`this`指向全局对象。一般的处理方式是将`this`作为变量保存下来，一般约定为`that`或者`self`：

```javascript
var name = "global";
var person = {
    name : "person",
    hello : function(sth){
        var that = this;
        var sayhello = function(sth) {
            console.log(that.name + " says " + sth);
        };
        sayhello(sth);
    }
}
person.hello("hello world");//person says hello world
```

##### 事件中的this

```javascript
var ele = document.getElementById("id");
ele.addEventListener('click',function(){
    console.log(this);  //this指向dom元素
});
```

#####  使用apply和call改变this的指向

- `apply`和`call`类似，只是后面的参数是通过一个数组传入，而不是分开传入。两者都是将某个函数绑定到某个具体对象上使用，自然此时的`this`会被显式的设置为第一个参数。两者的方法定义：

```javascript
call( thisArg [，arg1，arg2，… ] );  // 参数列表，arg1，arg2，...
apply(thisArg [，argArray] );     // 参数数组，argArray
```
```javascript
var name = 'global';
var o = {
    name: 'job',
    getName: function(){
        console.log(this.name);
    }
};
o.getName(); // job

//用call或apply改变函数中this的指向
o.getName.call(this); // global
```

- **简单的总结：**

    - 当函数作为对象的方法调用时，`this`指向该对象。
    - 构造函数中的`this`指向新创建的对象
    - 嵌套函数中的`this`不会继承上层函数的`this`，如果需要，可以用一个变量保存上层函数的`this`

##### bind（）

- 该方法创建一个新函数，称为绑定函数，绑定函数会以创建它时传入`bind`方法的第一个参数作为`this`，传入`bind`方法的第二个以及以后的参数加上绑定函数运行时本身的参数按照顺序作为原函数的参数来调用原函数.

```javascript
$("#ele").click(person.hello.bind(person));
//相应元素被点击时，输出person says hello world
```