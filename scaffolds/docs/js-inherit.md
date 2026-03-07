---
title: JS继承的几种方法总结
date: 2016-12-13 14:55:24
tags: 
  - JavaScript
  - 继承
categories: Front-End
---


- 由于js不像java那样是真正面向对象的语言，js是基于对象的，它没有类的概念
- 所以，要想实现继承，可以用js的原型prototype机制或者用apply和call方法去实现。在面向对象的语言中，我们使用类来创建一个自定义对象。然而js中所有事物都是对象，那么用什么办法来创建自定义对象呢？
- 这就需要用到js的原型：我们可以简单的把prototype看做是一个模版，新创建的自定义对象都是这个模版（prototype）的一个拷贝 （实际上不是拷贝而是链接，只不过这种链接是不可见，新实例化的对象内部有一个看不见的__Proto__指针，指向原型对象）。

<!--more-->

### 1、继承第一种方式：对象冒充
---

``` bash
blogfunction Parent(username){
    this.username = username;
    this.hello = function(){
      console.log('hello ' + this.username);
    }
  }
Parent.prototype.sayMorning = function(){
	console.log('good morning ' + this.username);
}
  function Child(username,password){
    //通过以下3行实现将Parent的属性和方法追加到Child中，从而实现继承
    //第一步：this.method是作为一个临时的属性，并且指向Parent所指向的对象，
    //第二步：执行this.method方法，即执行Parent所指向的对象函数
    //第三步：销毁this.method属性，即此时Child就已经拥有了Parent的所有属性和方法
    this.method = Parent;
    this.method(username);//最关键的一行
    delete this.method;

     this.password = password;
    this.world = function(){
      console.log(this.password);
    }
  }

  var parent = new Parent("zhangsan");
  var child = new Child("lisi","123456");
  parent.hello();
  parent.sayMorning();
  child.hello();
  child.world();
```

### 2、继承第二种方式：call()方法方式
---

``` bash
function Parent(username){
    this.username = username;
    this.hello = function(){
      console.log(this.username);
    }
  }

Parent.prototype.sayMorning = function(){
		console.log('good morning ' + this.username);
	}

  function Child(username,password){
    Parent.call(this,username);

    this.password = password;
    this.world = function(){
      console.log(this.password);
    }
  }


  var parent = new Parent("zhangsan");
  var child = new Child("lisi","123456");
  parent.hello();
  parent.sayMorning();
  child.hello();
  child.world();
// child.sayMorning();  通过prototype 添加的方法和属性，不能用来继承
```

### 3、继承的第三种方式：apply()方法方式
---

``` bash
function Parent(username){
    this.username = username;
    this.hello = function(){
      console.log(this.username);
    }
  }

	Parent.prototype.sayMorning = function(){
		console.log('good morning ' + this.username);
	}

  function Child(username,password){
    Parent.apply(this,new Array(username));

    this.password = password;
    this.world = function(){
      console.log(this.password);
    }
  }
var parent = new Parent("zhangsan");
  var child = new Child("lisi","123456");
  parent.hello();
  parent.sayMorning();
  child.hello();
  child.world();
// child.sayMorning(); 通过prototype 添加的方法和属性，不能用来继承
```

### 4、继承的第四种方式：原型链方式，即子类通过prototype将所有在父类中通过prototype追加的属性和方法都追加到Child，从而实现了继承
---

``` bash
function Person(){
  }
  Person.prototype.hello = "hello";
  Person.prototype.sayHello = function(){
    console.log(this.hello);
  }

  function Child(){
  }
  Child.prototype = new Person();//这行的作用是：将Parent中将所有通过prototype追加的属性和方法都追加到Child，从而实现了继承
  Child.prototype.world = "world";
  Child.prototype.sayWorld = function(){
    console.log(this.world);
  }

  var c = new Child();
  c.sayHello();
  c.sayWorld();
通过prototype 添加的方法和属性，不能用来继承
```

### 5、继承的第五种方式：混合方式, 混合了call或者apply方式、原型链方式
---

``` bash
function Parent(hello){
    this.hello = hello;
  }
  Parent.prototype.sayHello = function(){
    console.log(this.hello);
  }

  function Child(hello,world){
    Parent.call(this,hello);//将父类的属性继承过来
    this.world = world;//新增一些属性
  }

  Child.prototype = new Parent();//将父类的方法继承过来

  Child.prototype.sayWorld = function(){//新增一些方法
    console.log(this.world);
  }

  var c = new Child("zhangsan","lisi");
  c.sayHello();
  c.sayWorld();
可以继承通过prototype 添加的方法和属性
```