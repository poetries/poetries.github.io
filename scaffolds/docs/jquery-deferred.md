---
title: jQuery的deferred对象详解
date: 2018-10-20 21:50:43
tags: 
   - Deferred
   - jQuery
categories: Front-End
---


> 转载于互联网

一、什么是deferred对象？
---

- 开发网站的过程中，我们经常遇到某些耗时很长的javascript操作。其中，既有异步的操作（比如ajax读取服务器数据），也有同步的操作（比如遍历一个大型数组），它们都不是立即能得到结果的。

- 通常的做法是，为它们指定回调函数（callback）。即事先规定，一旦它们运行结束，应该调用哪些函数。

- 但是，在回调函数方面，`jQuery`的功能非常弱。为了改变这一点，jQuery开发团队就设计了`deferred`对象。

- 简单说，`deferred`对象就是`jQuery`的回调函数解决方案。在英语中，`defer`的意思是"延迟"，所以`deferred`对象的含义就是"延迟"到未来某个点再执行。

- 它解决了如何处理耗时操作的问题，对那些操作提供了更好的控制，以及统一的编程接口。它的主要功能，可以归结为四点

二、ajax操作的链式写法
---

> 首先，回顾一下jQuery的ajax操作的传统写法：

```javascript
$.ajax({

　　　　url: "test.html",

　　　　success: function(){
　　　　　　alert("哈哈，成功了！");
　　　　},

　　　　error:function(){
　　　　　　alert("出错啦！");
　　　　}

　});
```

- 在上面的代码中，`$.ajax()`接受一个对象参数，这个对象包含两个方法：`success`方法指定操作成功后的回调函数，`error`方法指定操作失败后的回调函数。

- `$.ajax()`操作完成后，如果使用的是低于`1.5.0`版本的`jQuery`，返回的是`XHR`对象，你没法进行链式操作；如果高于`1.5.0`版本，返回的是`deferre`d对象，可以进行链式操作。

- 现在，新的写法是这样的：

```javascript
$.ajax("test.html")

　　.done(function(){ alert("哈哈，成功了！"); })

　　.fail(function(){ alert("出错啦！"); });
```

> 可以看到，done()相当于success方法，fail()相当于error方法。采用链式写法以后，代码的可读性大大提高

三、指定同一操作的多个回调函数
---

- `deferred`对象的一大好处，就是它允许你自由添加多个回调函数。

- 还是以上面的代码为例，如果ajax操作成功后，除了原来的回调函数，我还想再运行一个回调函数，怎么办？

- 很简单，直接把它加在后面就行了。

```javascript
　　$.ajax("test.html")

　　.done(function(){ alert("哈哈，成功了！");} )

　　.fail(function(){ alert("出错啦！"); } )

　　.done(function(){ alert("第二个回调函数！");} );
```


- 回调函数可以添加任意多个，它们按照添加顺序执行

四、为多个操作指定回调函数
---

- `deferred`对象的另一大好处，就是它允许你为多个事件指定一个回调函数，这是传统写法做不到的。

- 请看下面的代码，它用到了一个新的方法`$.when()`：

```javascript
$.when($.ajax("test1.html"), $.ajax("test2.html"))

　　.done(function(){ alert("哈哈，成功了！"); })

　　.fail(function(){ alert("出错啦！"); });
```

> 这段代码的意思是，先执行两个操作$.ajax("test1.html")和$.ajax("test2.html")，如果都成功了，就运行done()指定的回调函数；如果有一个失败或都失败了，就执行fail()指定的回调函数

五、普通操作的回调函数接口（上）
---

- `deferred`对象的最大优点，就是它把这一套回调函数接口，从ajax操作扩展到了所有操作。也就是说，任何一个操作----不管是ajax操作还是本地操作，也不管是异步操作还是同步操作----都可以使用`deferred`对象的各种方法，指定回调函数。

- 我们来看一个具体的例子。假定有一个很耗时的操作`wait`：

```javascript
var wait = function(){

　　　　var tasks = function(){

　　　　　　alert("执行完毕！");

　　　　};

　　　　setTimeout(tasks,5000);

　　};
```

- 我们为它指定回调函数，应该怎么做呢？

- 很自然的，你会想到，可以使用$.when()：

```javascript
$.when(wait())

　　.done(function(){ alert("哈哈，成功了！"); })

　　.fail(function(){ alert("出错啦！"); });
```


- 但是，这样写的话，done()方法会立即执行，起不到回调函数的作用。原因在于$.when()的参数只能是deferred对象，所以必须对wait()进行改写：

```javascript
　var dtd = $.Deferred(); // 新建一个deferred对象

　　var wait = function(dtd){

　　　　var tasks = function(){

　　　　　　alert("执行完毕！");

　　　　　　dtd.resolve(); // 改变deferred对象的执行状态

　　　　};

　　　　setTimeout(tasks,5000);

　　　　return dtd;

　　};
```

- 现在，`wait()`函数返回的是`deferred`对象，这就可以加上链式操作了。

```javascript
$.when(wait(dtd))

　　.done(function(){ alert("哈哈，成功了！"); })

　　.fail(function(){ alert("出错啦！"); });
```

- `wait()`函数运行完，就会自动运行`done()`方法指定的回调函数。

六、deferred.resolve()方法和deferred.reject()方法
---

> jQuery规定，deferred对象有三种执行状态----未完成，已完成和已失败。如果执行状态是"已完成"（resolved）,deferred对象立刻调用done()方法指定的回调函数；如果执行状态是"已失败"，调用fail()方法指定的回调函数；如果执行状态是"未完成"，则继续等待，或者调用progress()方法指定的回调函数（jQuery1.7版本添加）

```javascript
var dtd = $.Deferred(); // 新建一个Deferred对象

　　var wait = function(dtd){

　　　　var tasks = function(){

　　　　　　alert("执行完毕！");

　　　　　　dtd.reject(); // 改变Deferred对象的执行状态

　　　　};

　　　　setTimeout(tasks,5000);

　　　　return dtd;

　　};

　　$.when(wait(dtd))

　　.done(function(){ alert("哈哈，成功了！"); })

　　.fail(function(){ alert("出错啦！"); });
```

七、小结：deferred对象的方法
---

- （1） `$.Deferred()` 生成一个`deferred`对象。

- （2） `deferred.done()` 指定操作成功时的回调函数

- （3） `deferred.fail()` 指定操作失败时的回调函数

- （4） `deferred.promise()` 
> 没有参数时，返回一个新的`deferred`对象，该对象的运行状态无法被改变；接受参数时，作用为在参数对象上部署`deferred`接口。

- （5） `deferred.resolve()` 

> 手动改变`deferred`对象的运行状态为"已完成"，从而立即触发done()方法。

- （6）`deferred.reject()` 

> 这个方法与`deferred.resolve()`正好相反，调用后将`deferred`对象的运行状态变为"已失败"，从而立即触发`fail()`方法。

- （7） `$.when()` 为多个操作指定回调函数。

> 除了这些方法以外，`deferred`对象还有二个重要方法，上面的教程中没有涉及到。

- （8）`deferred.then()`

**有时为了省事，可以把done()和fail()合在一起写，这就是then()方法**

```
　$.when($.ajax( "/main.php" ))

　　.then(successFunc, failureFunc );
```

> 如果`then()`有两个参数，那么第一个参数是`done()`方法的回调函数，第二个参数是`fail()`方法的回调方法。如果`then()`只有一个参数，那么等同于`done()`


