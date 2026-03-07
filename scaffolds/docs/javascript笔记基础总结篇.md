---
title: javascript笔记总结篇
date: 2016-09-24 10:33:00
tags: JavaScript
categories: Front-End
---

> 转载请声明出处 [博客原文](http://blog.poetries.top/2016/09/24/javascript%E7%AC%94%E8%AE%B0%E5%9F%BA%E7%A1%80%E6%80%BB%E7%BB%93%E7%AF%87/#more)

随手翻阅以前的学习笔记，顺便整理一下放在这里，方便自己复习，也希望你有也有帮助吧

### 第一课时 入门基础
---

#### **知识点**：
---
- 操作系统就是个应用程序
- 只要是应用程序都要占用物理内存
- 浏览器本身也是一个应用程序
- 浏览器本身只懂得解析`HTML`
- 调用浏览器这个应用程序的一个功能绘制
<!--more-->
#### 1、javascript介绍
---

- `JavaScript`操作`DOM`的本质是=获取+触发+改变

- 目的：就是用来操作内存中的`DOM`节点
  - 修改`DOM`节点的属性
  - 过`javascript`语法组织逻辑代码操作DOM
  - `BOM(window)`它包含了`DOM`
  - `DOM(document)`
  - `script`脚本推荐放在最下边好处：防止因网络问题，页面加载时间长，出现空白；即便网络问题，浏览器也把`DOM`加载渲染完成，等待从服务端下载完`js`脚本，出现效果
  - `css`不放在最下面原因通俗地讲：好比先穿好衣服在出去，浏览器先把`css`样式准备好，在加载结构层，使得页面有样子；如果放在下面，因为页面是从上往下加载，没有`css`，就剩下裸露的标签，很难看，使得用户体验不好

#### 2、基于对象的内存管理
---
- `javascript`就是来操作这些对象
   - 通过逻辑组织对象之间的关系和行为
   - 如何操作这些对象？通过变量引用

#### 3、变量
---

- 变量本质是一个空盒子，里面记录了一个内存地址，使能找到内存中的对象，保存了指向具体的实在的东西的地址
- 变量存在栈中，对象存在堆中
- 变量的意义：方便我们去操作对象
- 变量的几种引用方式
  - 指针（`C`语言中叫法）
  - 引用（`Java`）
  - 变量
- 例如：
	- `var b = document.body ` 含义：把`body`这个对象在内存中的地址放到b变量里面，变量`b`（`b`是内存地址的别名）本身也存在内存中，以后的操作是针对`body`这个地址


- 变量命名规范
  + 由字母(`a-zA-Z`)数字(`0-9`)下划线(`_`)以及美元符号(`$`)
  + 不能由数字开头
  + 命名尽量用英文并且具有一定的含义
  + 如果有多个英文单词,后面单词的首字母大写
  + 不能使用关键字
  + 首字母不要大写，大写是有特殊含义的

#### DOM在内存中的一些图示
---

![DOM Tree](http://upload-images.jianshu.io/upload_images/1480597-1a17ccd9b4577254.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![DOM内存图](http://upload-images.jianshu.io/upload_images/1480597-3a4d0eba77f1a163.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![DOM内存图](http://upload-images.jianshu.io/upload_images/1480597-80fe8bcddfbca269.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![DOM内存图](http://upload-images.jianshu.io/upload_images/1480597-ce659f11e978cd3b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
  
  
  ### 第二课时 
  ---
  
#### 回顾上节：

- 1、`javascript`介绍

- 2、基于对象的内存管理

- `javascript`就是来操作这些对象
    - 通过逻辑组织对象之间的关系和行为
    - 如何操作这些对象？通过变量引用
- 3、变量

#### **知识点**：
---

#### 1、`window`作用域
---

- 只要在`script`标签中定义的变量，默认就在`window`的作用域之下
- 默认就是`window`这个对象里面写代码

#### 2、数据类型
---

##### 如何判断js中的数据类型：
---

- `typeof`、`instanceof`、 `constructor`、 `prototype`方法比较

-  如何判断`js`中的类型呢，先举几个例子：

```javascript
var a = "iamstring.";
var b = 222;
var c= [1,2,3];
var d = new Date();
var e = function(){alert(111);};
var f = function(){this.name="22";};
 ```
 
###### **最常见的判断方法**：`typeof`
---

```javascript
alert(typeof a)   ------------> string
alert(typeof b)   ------------> number
alert(typeof c)   ------------> object
alert(typeof d)   ------------> object
alert(typeof e)   ------------> function
alert(typeof f)   ------------> function
```

- 其中`typeof`返回的类型都是字符串形式，需注意，例如：

```javascript
alert(typeof a == "string") -------------> true
alert(typeof a == String) ---------------> false
```

- 另外`typeof `可以判断`function`的类型；在判断除`Object`类型的对象时比较方便。
 
###### **判断已知对象类型的方法**：` instanceof`
---

```javascript
alert(c instanceof Array) ---------------> true
alert(d instanceof Date) 
alert(f instanceof Function) ------------> true
alert(f instanceof function) ------------> false
```

- **注意**：`instanceof `后面一定要是对象类型，并且大小写不能错，该方法适合一些条件选择或分支。
 
###### **根据对象的`constructor`判断**：` constructor`
---

```javascript
alert(c.constructor === Array) ----------> true
alert(d.constructor === Date) -----------> true
alert(e.constructor === Function) -------> true
```

- **注意**： `constructor` 在类继承时会出错

- 例子：

```javascript
      function A(){};
      function B(){};
      A.prototype = new B(); //A继承自B
      var aObj = new A();
      alert(aobj.constructor === B) -----------> true;
      alert(aobj.constructor === A) -----------> false;
```

- 而`instanceof`方法不会出现该问题，对象直接继承和间接继承的都会报`true`：

```javascript
      alert(aobj instanceof B) ----------------> true;
      alert(aobj instanceof B) ----------------> true;
```

- 言归正传，解决`construtor`的问题通常是让对象的`constructor`手动指向自己：

```javascript
      aobj.constructor = A; //将自己的类赋值给对象的constructor属性
      alert(aobj.constructor === A) -----------> true;
      alert(aobj.constructor === B) -----------> false; //基类不会报true了;
 ```
 
###### **通用但很繁琐的方法**： `prototype`
---

```javascript
alert(Object.prototype.toString.call(a) === ‘[object String]’) -------> true;
alert(Object.prototype.toString.call(b) === ‘[object Number]’) -------> true;
alert(Object.prototype.toString.call(c) === ‘[object Array]’) -------> true;
alert(Object.prototype.toString.call(d) === ‘[object Date]’) -------> true;
alert(Object.prototype.toString.call(e) === ‘[object Function]’) -------> true;
alert(Object.prototype.toString.call(f) === ‘[object Function]’) -------> true;
```

- 大小写不能写错，比较麻烦，但胜在通用。
- 通常情况下用`typeof `判断就可以了，遇到预知`Object`类型的情况可以选用`instanceof`或`constructor`方法

#### Javascript的数据类型有六种（ES6新增了第七种`Symbol`）
---

- 数值（`number`）：整数和小数（比如1和3.14）
- 字符串（`string`）：字符组成的文本（比如"Hello World"）
- 布尔值（`boolean`）：true（真）和false（假）两个特定值
- `undefined`：表示 未定义 或不存在，即此处目前没有任何值
- ` null`：表示空缺，即此处应该有一个值，但目前为空
-  对象（`object`）：各种值组成的集合
- 通常，我们将数值、字符串、布尔值称为原始类型（`primitive type`）的值，即它们是最基本的数据类型，不能再细分了。而将对象称为合成类型（`complex type`）的值，因为一个对象往往是多个原始类型的值的合成，可以看作是一个存放各种值的容器。至于`undefined`和`null`，一般将它们看成两个特殊值


#### 内存中一共分为几种对象：
---

 - 变量
 - `DOM`对象
 - 常量
 - 自定义对象


#### 数据类型转换
---

##### **转换函数**
---

- `toString()` 转换为字符串，在JavaScript中所有数据类型都可以转换为`string`类型

```javascript
        var n1 = 12;
        var n2 = true;
        var a = [1, 2, 3];
        var o = {};
        function f(){}
        n1.toString(); //"12"
        n2.toString(); //"true"
        a.toString(); //"1,2,3"
        o.toString(); //"[object Object]"
        f.toString(); //"function f(){}"
 ```

- `parseInt() `解析出一个`string`或者`number`类型的整数部分，如果没有可以转换的部分，则返回`NaN`（`not a number`）

 ```javascript
        var n1 = "12";
        var n2 = "23hello";
        var n3 = "hello";
        parseInt(n1); //12
        parseInt(n2); //23
        parseInt(n3); //NaN
 ```
 - `parseFloat() `解析出一个`string`的浮点数部分，如果没有可以转换的部分，则返回`NaN`（`not a number`）

 ```javascript
        var n1 = "1.2.3";
        var n2 = "1.2hello"
        var n3 = "hello"
        parseFloat(n1); //1.2
        parseFloat(n2); //1.2
        parseFloat(n3); //NaN 
```

##### **强制类型转换**
---

- `Boolean(value)`- 把给定的值转换成`Boolean`型

```javascript
        Boolean(123); //true
        Boolean(""); //false
        Boolean([]); //true
        Boolean({}); //true
        Boolean(null); //false
        Boolean(undefined); //false
 ```

- `Number(value)`-把给定的值转换成数字（可以是整数或浮点数）

```javascript
        Number("123"); //123
        Number("123h"); //NaN
        Number(true); //1
        Number(false); //0
        Number(undefined); //NaN
        Number(null); //0
        Number([]); //0
        Number({}); //NaN
 ```

- `String(value)`- 把给定的值转换成字符串

 ```javascript
        String(123); //"123"
        String([1,2]); //"1,2"
        String(undefined) //"undefined"
        String(null) //"null"
        String({}) //"[object Object]"
```

##### **隐式转换**
---

- 数字＋字符串：数字转换为字符串 `console.log(12+"12")`; //1212
- 数字＋布尔值：`true`转换为`1`，`false`转换为`0`  `console.log(12+true)`; //13
- 字符串＋布尔值：布尔值转换为true或false `console.log("hello"+true)`; //`hellotrue`
- 布尔值＋布尔值 `console.log(true+true)`; //2

##### **null和undefined**
---

- `undefined` 表示一种未知状态，声明了但没有初始化的变量，变量的值时一个未知状态。访问不存在的属性或对象`window.xxx`）方法没有明确返回值时，返回值是一个`undefined.`当对未声明的变量应用`typeof`运算符时，显示为`undefined`。
- `null`表示尚未存在的对象,`null`是一个有特殊意义的值。可以为变量赋值为`null`，此时变量的值为“已知状态”(不是`undefined`)，即`null`。（用来初始化变量，清除变量内容，释放内存）

```javascript
 undefined==null   //结果为true,但含义不同。
 undefined===null //false,两者类型不一致，前者为“undefined”，后者为“object”
```
#### 3、javascript脚本执行顺序
---

- 第一步定义： 分为`var`定义 和函数定义`function`
- 第二步执行： 其他所有
- 先从上往下定义完所有的后，再从上往下执行 除了`var`  `function`定义外的 其他都是执行 如：赋值 函数调用
- 在栈里面找到的，就不去堆里面找，因为栈空间小，就近原则【总之：先在栈里面找，找不到再去堆里面找】在栈里面开辟，就能找到堆里面的地址 如：`var b = function(){}`


#### 总结一下`==`运算的规则：(隐式转换)
---

- `JS`中的值有两种类型：原始类型(`Primitive`)、对象类型(`Object`)。

- 原始类型包括：`Undefined`、`Null`、`Boolean`、`Number`和`String`等五种。

- `Undefined`类型和`Null`类型的都只有一个值，即`undefined`和`null`；`Boolean`类型有两个值：`true`和`false`；`Number`类型的值有很多很多；`String`类型的值理论上有无数个。

- 所有对象都有`valueOf()`和`toString()`方法，它们继承自`Object`，当然也可能被子类重写

- `undefined == null`，结果是`true`。且它俩与所有其他值比较的结果都是`false`。

- `String == Boolean`，需要两个操作数同时转为`Number`。

- `String/Boolean == Number`，需要`String/Boolean`转为`Number`。

- `Object == Primitive`，需要`Object`转为`Primitive`(具体通过`valueOf`和`toString`方法)

### 第三课时
---

#### 上节回顾：

-  1、`window`作用域
  - 只要在`script`标签中定义的变量，默认就在`window`的作用域之下
  - 默认就是`window`这个对象里面写代码

- 2、数据类型
  - `number`:数字
  - `string`:字符类型，必须用引号引起来
  - `boolean`:布尔类型  `true` `false`
  -  `null`:变量引用了一块堆中一个空的空间
  - `object`:引用对象类型（存在于堆里面）
  - `array`:数组类型
  - `function`:函数数据类型

- **对象数据类型：** `object`,`array`,`function`

-  3、`javascript`脚本执行顺序
  - 定义 `var` `function`
  - 执行 其他所有

#### **知识点：**
---

#### **1、运算符**
---

- 算术运算符(`+`,`-`,`*`,`/`,`%`,`++`,`--`)
    - 如果引用所指的地方是`null`的话，那么在运算中就会自动变成`0`
    - `%`运算符 如：`4%5`取模 模是`4`  `7%5`取模 模是`7-5=2`

- 字符串和数字相加的情况：
    + 左右都是数字：数字相加
    + 左右有一个字符串：字符串拼接
    + 左右边有一个`null`:`null`看做`0`
    + 左右边有一个`undefined`：结果是`NAN`（`not is number`）

- 赋值运算符(`=`,`-=`,`+=`,`*=`,`/=`,`%=`)

- 比较运算符(`==`,`===`,`!=`,`>`,`<`,`>=`,`<=`)
    - 先执行表达式计算再赋值
    - `==`和`!=`在比较之前首先让双方的值做隐士类型转换，`===`不转换

- 逻辑运算符(`||`,`&&`,`!`)
    - `||` 在js中和PHP中是不一样的 js中返回逻辑或的左边或右边的一个结果 PHP返回`||`或出来以后的结果即：`true` `false`
    - 特殊性（注意）---一定要记住（这个特性和其他编程语言不一样）：在`js`里返回不是布尔值
    - `||` 短路运算 第一个条件为真 后面不执行
    - `&&`把表达式最后一个值返回（注意这里）
    
##### **条件运符(`表达式1?表达式2:表达式3`)三元运算符**
---

 - `表达式1?表达式2:表达式3 ` 表达式1为真 返回表达式2 否则返回表达式3
 - 三元运算符 可以多层次嵌套使用

#### **2、在js中 有四种被认为是`非`**：
---

 - `undefined`
 - `null`
 - `false`
 - `0`

- 例子：`var age = prompt("温馨提示：","请输入您的年龄")||0`
- 当点击取消的时候，如果出现`undefined` `null`  `fasle`  `0` 表示非的逻辑 那么`||`就会过滤，取右边的值`0`

### 第四课时
---

#### **上节回顾：**
---

-  1、运算符

  - 算术运算符(`+`,`-`,`*`,`/`,`%`,`++`,`--`)
  - 如果`+`号左边和右边有一边是字符串类型的数据的话，这个时候就变成字符串拼接
  - `var str = "你好"+123;`//你好123
  - `var count = 2;`
  - `var str1 = "你叫了我第"-count+"次";`//你叫了我第2次
  - 如果引用所指的地方是`null`的话，那么在运算中就会自动变成0

-  2、赋值运算符**(`=`,`-=`,`+=`,`*=`,`/=`,`%=`)

- 3、 比较运算符(`==,===,!=,>,<,>=,<=`)
    - 先执行表达式计算再赋值
    - `==`和`!=`在比较之前首先让双方的值做隐士类型转换，`===`不转换
-  4、逻辑运算符(`||,&&,!`)
-  5、条件运算符(`1>2?3:4`)

#### **知识点：**
---

##### **1、`console.log`调试程序**
---

- 开发中大量使用这个 而不用`alert`

##### **2、条件结构**
---

- `if`

######  `javascript`中`if`语句优化写法

 - 使用常见的三元操作符

```javascript
if (foo) bar(); else baz(); ==> foo?bar():baz();
if (!foo) bar(); else baz(); ==> foo?baz():bar();
if (foo) return bar(); else return baz(); ==> return foo?bar():baz();
```
- 使用`and(&&)`和`or(||)`运算符

```javascript
if (foo) bar(); ==> foo&&bar();
if (!foo) bar(); ==> foo||bar();
```
- `if...else`
- `if...else if...else`
- 当通过判断返回某个值的时候，优先使用三元表达式
- 当通过判断执行`N`段逻辑代码的时候，只能用条件结构

### 第五课时
---

#### **上节回顾：**
---

- 1、`console.log`调试程序
- 2、条件结构
    `if`
    `if...else`
    `if...else if...else`
    - 当通过判断返回某个值的时候，优先使用三元表达式
    - 当通过判断执行`N`段逻辑代码的时候，只能用条件结构

#### **知识点：**
---

##### **1、`switch`**
---
- `switch case break default` 条件   判断 退出  默认

   - a.只要匹配上一个`case`，那么它下面的所有的`case`都会执行包括`default`
   - b.`break`的意思跳出当前结构

##### **2、`for`**
---

 - 循环有三个要素
   - a.循环变量
   - b.判断（循环体）
   - c.改变循环变量
   - d.`continue`的意思结束本次循环进入下次循环
 -  `continue` 结束本次循环，继续下一次循环  当前这次循环不做 直接做下面的
 -  `break` 结束后面的循环不做了
 
### 第六课时
---

#### **上节回顾：**
---

1、`switch`
- `switch case break default` 条件   判断 退出  默认
    - a.只要匹配上一个`case`，那么它下面的所有的`case`都会执行包括`default`
    - b.`break`的意思跳出当前结构

2、`for`
- 循环有三个要素
    - a.循环变量
    - b.判断条件（循环体）
    - c.改变循环变量
    - d.`continue`的意思结束本次循环进入下次循环

---

#### **知识点：**
---

#### 1、`while/do...while` 没有谁好谁坏 只有适应场景不同
---
- 比如：先吃饭 在买单 `do..while` 用户体验高 有风险  扫雷游戏也是先体验 在问是否退出 提高体验
- 比如：先买单 在吃饭 `while` 用户体验不高
- 一般情况下面，如果条件判断是`数字的`比较`==<>`，`for`循环优先.
- 如果是`非数值相关的`比较循环，`while`优先

#### 2、代码内存解析
---

#####  **闭包**
---
   - a.程序永远是先定义后执行
   - b.执行永远从上到下
   - c.函数定义的话在堆（只是一个地址而已）
   - d.函数调用的时候，就会有自己的堆和栈（`闭包`）

##### **闭包 作用域**
---
+ 记住：先定义`var`  `function`  在从上往下执行
+ 定义定义在自己的栈里面 执行在自己的堆里面
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

#### 4、object对象
---

#### 5、面向对象的程序设计
---
- a.`function`构造器
- b.`prototype`原型
- c.`foreach`
- c.作用域
- d.继承

#### 一些内存图示
---

![闭包示例1](http://upload-images.jianshu.io/upload_images/1480597-d7b1dc1194558ac0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![闭包示例2](http://upload-images.jianshu.io/upload_images/1480597-32121bca4ab77dba.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![闭包1](http://upload-images.jianshu.io/upload_images/1480597-f8c6735fdc8d7ee0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![闭包2](http://upload-images.jianshu.io/upload_images/1480597-54d5b8e92e0266af.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![闭包3](http://upload-images.jianshu.io/upload_images/1480597-0d7c71a08e5c3dd5.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

---

#### 原型链的几张图解
---

![原型链图解](http://upload-images.jianshu.io/upload_images/1480597-f6fab5bf39d4927a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![js原型链演示00-new Object](http://upload-images.jianshu.io/upload_images/1480597-960b48ae2a258f3a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![js原型链演示01-函数Foo声明](http://upload-images.jianshu.io/upload_images/1480597-46a363299f4cb52d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![js原型链演示-对象继承模式-01-浅拷贝](http://upload-images.jianshu.io/upload_images/1480597-5c2c02e45b6a34bd.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![js原型链演示02-new Foo()](http://upload-images.jianshu.io/upload_images/1480597-21688edeab3bb10d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![js原型链演示02-1-new 原理](http://upload-images.jianshu.io/upload_images/1480597-fc562b41d866cae5.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![js原型链演示03-Foo.prototype](http://upload-images.jianshu.io/upload_images/1480597-f53b3e2d9833f545.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![js原型链演示-对象继承模式-03-基于对象的原型继承](http://upload-images.jianshu.io/upload_images/1480597-ccbf4ddf8ea86e17.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![js原型链演示05-继承函数示例](http://upload-images.jianshu.io/upload_images/1480597-724c8ddd463e8497.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![js原型链演示06-继承prototype模式](http://upload-images.jianshu.io/upload_images/1480597-b006171464fb7c9a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![js原型链演示07-继承prototype模式改进](http://upload-images.jianshu.io/upload_images/1480597-57f3858765368446.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![js原型链演示08-继承prototype直接继承](http://upload-images.jianshu.io/upload_images/1480597-fc1f9e36ede219f8.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![js原型链演示08-继承prototype空对象中介](http://upload-images.jianshu.io/upload_images/1480597-55110b7283224dde.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![js原型链演示09-继承prototype空对象中介封装expend](http://upload-images.jianshu.io/upload_images/1480597-a45122592360a214.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![js原型链演示10-构造器拷贝继承](http://upload-images.jianshu.io/upload_images/1480597-b832f7372de9dc35.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 扩展阅读
   - [Javascript的原型链图详解](https://zhuanlan.zhihu.com/p/22189387)

### 第七课时
---
#### **上节回顾：**
---

+ 1.`switch`
+ 2.`while/do...while`
 + 一般情况下面，如果条件判断是数字的比较`==<>`，`for`循环优先.
 + 如果是非数值相关的比较循环，`while`优先

+ 3.`function`函数
+ 4.代码内存解析
    + **闭包**
        * a.程序永远是先定义后执行
        * b.执行永远从上之下
        * c.函数定义的话在堆（只是一个地址而已）
        * d.函数调用的时候，就会有自己的堆和栈（闭包）

#### **知识点：**
---

#### **1、object对象**
---

+ `new`关键字代表的是新开辟一块内存空间
+ 没有被引用的内存空间，会在适当的时候被销毁

    + 两句代码含义等同

        * `var person = new Object()`;
        * `var person = {};`

+ 访问对象的属性除了用 对象引用`.属性` `key`以外，还可以使用对象引用`[属性key]`

##### new 原理详细解析
---

* 无论什么时候，只要创建一个新函数，就会根据一组特定的规则为该函数创建一个`prototype`属性，这个属性指向函数的原型对象。
* 在默认情况下，所有原型对象都会自动获得一个`constructor`（构造函数）属性，这个属性包含一个指向`prototype`属性所在函数的指针（就是指向新创建的函数）。
* 通过这个构造函数（原型对象的构造函数），可以继续为原型对象添加其他属性和方法。
* 当调用构造函数创建一个新实例后，该实例的内部将包含一个指针（内部属性），指向构造函数的原型对象。`ECMA-262`第5版管这个指针叫 `[[Prototype]] `。脚本中没有标准的方式访问` [[Prototype]]`，但`Firefox`、`Safari`和`Chrome`在每个对象上都支持一个属性`__proto__`；而在其他实现中，这个属性对脚本是完全不可见的。不过，要明确的真正重要的一点就是，这个连接存在于实例和构造函数的原型对象之间，而不是存在于实例和构造函数之间

##### new创建对象的步骤
---

-  创建一个新的对象
- 将构造函数的作用域赋给新对象
- 执行构造函数的代码，为这个新对象添加属性
- 返回新对象

```javascript
function Person(name, age) {
    this.name = name;
    this.age = age;
    this.say = function () {
        console.log(this.name);
    };
}

function createPerson(P) {
    // 创建一个新对象
    var o = new Object();
    // 获取传递给Person函数的参数
    var args = Array.prototype.slice.call(arguments, 1);
    // 新对象的__proto__属性指向Person的原型对象
    o.__proto__ = P.prototype;
    // Person的原型对象的constructor指向Person
    P.prototype.constructor = P;
    // 把Person构造函数的作用域赋给新对象
    // 给这个新对象添加属性（name,age,say）
    P.apply(o, args);
    // 返回这个新对象
    return o;
}

var p = createPerson(Person, 'wang', 35);
```

#### **2、面向对象的程序设计**
---
+ **`function`构造器**

  + **共同点:**
    + 动态创建一块内存空间，闭包
  + **不同点:**
    + 函数调用是没有办法拿到空间的地址的，而且这块地址是一块临时地址，执行完函数之后，就会销毁
    + `new`开辟内存空间，把这块空间的地址返回，这块空间就有可能长期的被引用
+ **`prototype`原型**
    + 通过原型使通过同样一个构造器所`new（创建）`出来的对象具有相同的属性和行为
    + `prototype`本质就是一个对象
+ `foreach`
+ `this` 指代当前创建的这块内存 `this.name=name` 指代当前内存中的这个`name`属性 接收外界传过来的值
+ `继承`

##### 多种构造函数
---

###### **传统的创建对象**
---

```javascript

var person = new Object();

person.name = “lancer”;

person.age = 24;

person.job = “UI”;

person.sayName = function(){

alert(this.name);

}

person.sayName();
```

###### **工厂模式**
---

```javascript

function createPerson(name,age,job){

var o = new Object();

o.name = name;

o.age = age;

o.job = job;

o.sayName = function(){

alert(o.name);

}

return o;

}

var person1 = createPerson(“lancer”,24,”UI”);

person1.sayName();
```

###### **构造函数**
---

```javascript

function Person(name,age,job){

this.name = name;

this.age = age;

this.job =job;

this.sayName = function(){

alert(this.name)

}

}

var person1 = createPerson(“lancer”,24,”UI”);

person1.sayName();

```

###### **原型模式**
---

```javascript

function Person(){

}

Person.prototype.name =”lancer”;

Person.prototype.age =24;

Person.prototype.job = “UI”;

Person.prototype.sayName = function(){

alert(this.name)

}

var person1 = new Person();

person1.sayName();

var person2 = new Person();

person2.name =”lara”

person2.sayName();
```

###### **简单原型模式**
---

```javascript

function Person(){

}

Person.prototype = {

name : “lancer”,

age : 24,

job : “UI”,

sayName : function(){

alert(this.name)

}

};

var person1 = new Person();

person1.sayName();

```

###### **构造函数和原型模式**
---

```javascript

function Person(name,age,job){

this.name = name;

this.age = age;

this.job =job;

}

Person.prototype = {

constructor :Person,

sayName : function(){

alert(this.name)

}

};

var person1 = new Person(“lancer”,”24″,”UI”);

person1.sayName();
```

###### **动态原型模式**
---

```javascript

function Person(name,age,job){

this.name = name;

this.age = age;

this.job =job;

}

if(typeof this.sayName !=”function”){

Person.prototype = {

constructor :Person,

sayName : function(){

alert(this.name)

}

};

}

var person1 = new Person(“lancer”,”24″,”UI”);

person1.sayName();
```

###### **稳妥构造函数**
---

```javascript

var Person = function(name,age,job){

var O = new Object();

O.sayName = function(){

alert(name);

};

return O

}

var person1 = Person(“lancer”,24,”UI”);

person1.sayName();

```

#### **其他：**
---

- 函数调用后一定有返回值，没有返回值就是`undefined`

####  一些内存图示
---

![](https://github.com/poetries/TZ-Front-End-Note/raw/master/JS-Basic-star/images/DOM7.png)

### 第八课时
---

#### **上节回顾：**
---

#### **1.object对象**
---
- `new`关键字代表的是新开辟一块内存空间
- 没有被引用的内存空间，会在适当的时候被销毁
    - 两句代码含义等同
    - `var person = new Object();`
    - `var person = {};`
    - 访问对象的属性除了用 对象引用属性`key`以外，还可以使用对象引用`[属性key]`

#### **2.面向对象的程序设计**
---
- a.`function`构造器
    - 共同点:
        - 动态创建一块内存空间，闭包
    - 不同点：
        - 函数调用是没有办法拿到空间的地址的，而且这块地址是一块临时地址，执行完函数之后，就会销毁
        - `new`开辟内存空间，把这块空间的地址返回，这块空间就有可能长期的被引用
- b.`prototype`原型
    - 通过原型使通过同样一个构造器所`new`（创建）出来的对象具有相同的属性和行为
    - `prototype`本质就是一个对象
- c.`foreach`
- c.`this`
- d.继承

#### **知识点：**
---

#### **1.prototype内存解析**
---

- `prototype`是原型，是一块所有对应构造器创建的对象都共享的内存空间
- 在面向对象设计程序的时候，属性应该是对应的空间的，而功能应该是`prototype`公共空间的

#### **2.通过prototype扩展功能**
---

- 所有的构造器都是继承于`Object`构造器的，因此只要`Object`的原型里有的功能，所有的对象都有

```javascript
//多个对象的构造 以及 多个对象之间如何建立联系
function Student(name,age,sex){
    this.name = name;
    this.age = age;
    this.sex = sex;

}
function Bingqilin(name){
    this.name = name;
}
function Game(name){
    this.name = name;
}
function Hour(time){
    this.time = time;
}
Student.prototype = {

    eat:function(b){
        alert(this.name+"喜欢吃"+b.name);
    },
    mess:function(){
        alert(this.name+"的信息："+this.age+','+this.sex);
    },
    sleep:function(h){
        alert(this.name+"每天睡,"+h.time+'小时');
    },
    work:function(h){
        alert(this.name+"每天工作,"+h.time+'小时');
    },
    like:function(g){
        alert(this.name+"喜欢打,"+g.name);
    }

}
var s = new Student("小明",22,"男");

var b = new Bingqilin("黑色的冰淇淋");
s.eat(b);//小明喜欢吃黑色的冰淇淋

var g = new Game("英雄联盟");
s.like(g);//把对象的地址发送给like的参数即可访问构造函数Game的name属性

var h = new Hour(10);
s.sleep(h);
s.work(h);
```
#### **一些内存图示**
---

![](https://github.com/poetries/TZ-Front-End-Note/raw/master/JS-Basic-star/images/DOM8.png)

![](https://github.com/poetries/TZ-Front-End-Note/raw/master/JS-Basic-star/images/DOM9.png)


### 第九课时
---

#### **回顾：**
---

##### **1、prototype内存解析**
---

- `prototype`是原型，是一块所有对应构造器创建的对象都共享的内存空间
- 在面向对象设计程序的时候，属性应该是对应的空间的，而功能应该是`prototype`公共空间的

##### **2、通过prototype扩展功能**
---
- 所有的构造器都是继承于`Object`构造器的，因此只要`Object`的原型里有的功能，所有的对象都有
- 构造器在定义的时候 就默认创建了一个空的原型

##### **3、封装**
---
- 1：找对象  小头爸爸  大头儿子  饭
- 2：抽象（类，构造器）
- 3：创建对象并且建立关系（操作对象）

- 面向对象例子

```javascript
//小头爸爸牵着大头儿子的手去吃饭，吃完饭之后，

//小头爸爸背着大头儿子回家，回家后儿子学习，老爸工作，工作学习完后

//儿子看动画片

//围裙妈妈带儿子睡觉

//张三和张四

//分析对象 小头爸爸 大头儿子 饭 以及功能

//设计构造器（类）

//创建对象以及他们之间的关联

 function Person(name,age){

 this.name = name;

 this.age = age;

 }

function Rice(name){

 this.name = name;

}

//Person.prototype.getHand = function(){//这样子写也可以 但还是用默认生成的那块空的内存对象 往里面添加属性 方法

 //不浪费内存

//}

//在prototype中定义的每个对象都有这些功能

Person.prototype = {//这样子写 抛弃了默认生成的那块空的内存对象 重新创建了一块新的内存对象 记住：原型的本质是对象

 //多个功能写在一起

 getHand:function(person){//牵手

 alert(this.name+"在牵着"+person.name+"的手....");

 },

 eat:function(rice){

 alert(this.name+"在吃"+rice.name);

 },

 //需求 18岁以上才能背人

 /* //写法一 不推荐 这个满足18岁的功能是自己强加的 不是客户需求的

 carry:function(person){//这里设计不合理 让老爸有这个功能 儿子没有这个功能

 if(this.age>=18){

 alert(this.name+'背着'+person.name);

 }else{

 alert(this.name+",还未满18岁，背不起");

 }

 },*/

 backhome:function(){

 alert(this.name+"回家");

 },

 study:function(){

 alert(this.name+"正在学习");

 },

 watchTV:function(jm){

 alert(this.name+"正在看"+jm+'...');

 }

};

var p1 = new Person("老爸",20);

var p2 = new Person("儿子",15);

//p1.getHand(p2);

//p1.eat(new Rice("蛋炒饭"));

//p2.eat(new Rice("猪脚饭"));

//p1.carry(p2);//老爸背儿子

//p2.carry(p1);//让儿子背老爸 输出结果：儿子,还未满18岁，背不起

//p1.backhome();

//写法二 不推荐 100对关系 代码写很多遍

/*

//让老爸单独有背的这个功能 儿子没有这个功能

p1.carry = function(person){

 alert(this.name+'背着'+person.name);

}

p1.carry(p2);

*/

//-------通过继承解决这个 让老爸单独有背的这个功能 儿子没有这个功能 可以应对多功能 多需求

//功能函数

Object.prototype.extends = function(func,actions){//让所有的子孙 构造器都有这个功能

 for(var prop in func.prototype){//传进一个func构造器 迭代构造器中的功能 把构造器中的功能全都映射过来 复制一份

 this.prototype[prop] = func.prototype[prop];//迭代原型中的所有的功能到 当前里面去

 }

 for(var prop in actions){

 this.prototype[prop] = actions[prop];

 }

};

function Father(name){

 this.name = name;

}

Father.extends(Person,{

 carry:function(person){

 alert(this.name+'背着'+person.name);

 },

 work:function(){

 alert(this.name+"正在工作");

 }

});

//扩展

//设计程序有个原则：不修改只增加

function Children(name){

 this.name = name;

}

Children.extends(Person);

function Mother(name){

 this.name = name;

}

Mother.extends(Person,{

 scoop:function(person){

 //判断必须是children的对象才能执行这个功能

 //if(){

 alert(this.name+"唱着摇篮曲哄"+person.name+"睡觉");

 //}

 }

});

/*

Father.prototype.carry= function(person){//创建这个原型的想法是：原来Person有的功能 我都需要有 并在这些基础上加一个功能 carry

 //如何建立Father基础Person的功能？写一个继承的小工具来操作

 alert(this.name+'背着'+person.name);

};

Father.prototype.work = function(){

 alert(this.name+"正在工作");

}

*/

var p1 = new Father("老爸");

var p2 = new Children("儿子");

p1.carry(p2);//只有老爸有carry这个功能

//p2.carry(p1);//error 儿子没有carry这个功能

p2.study();//儿子在学习

p1.work();//老爸在工作

p1.watchTV('看足球');

p2.watchTV('蜡笔小新');

var p3 = new Mother('围裙妈妈');

p3.scoop(p2);
```

#### **知识点：**
---

- 1.继承
- 2.面向对象程序设计案例（猜拳）

#### **一些内存图示**
---

![](http://upload-images.jianshu.io/upload_images/1480597-9d8603509767ea7a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![](http://upload-images.jianshu.io/upload_images/1480597-44bd5c0bf459b4d3.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![](http://upload-images.jianshu.io/upload_images/1480597-17266c52ca52c896.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![](http://upload-images.jianshu.io/upload_images/1480597-1bf8c506d61084c2.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


### 第十课时
---

#### **上节回顾：**
---

#### **1.继承**
---

- 本质就是从一个`prototype`对象中把它的功能都`copy`到另一个`prototype`对象
- 继承为什么要循环

#### **2.call apply方法的使用**
---

- `func.call（obj）`：调用`func`的时候，以`obj`这个对象的作用域去调用
- 改变函数在调用的时候里面闭包的作用域
- `call(obj,arg1,arg2,arg3)`;`call`第一个参数传对象，可以是`null`。参数以逗号分开进行传值，参数可以是任何类型。
`apply(obj,[arg1,arg2,arg3])`;`apply`第一个参数传对象，参数可以是数组或者`arguments `对象

#### **知识点：**
---

#### API application program interface
---

- 第一：遇到问题
- 第二：查资料或者学习  -> 解决问题
- 第三：记住有这个功能
- 第四：查资料（百度）

#### 常用API
---
- 1.`String`
- 2.`Array`
- 3.`Math Math.random();`
- 4.`Date`

##### 日期型函数`Date`
---


![Date 对象方法](http://upload-images.jianshu.io/upload_images/1480597-4c5426128f64acff.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- **声明**

```javascript
var myDate = new Date(); //系统当前时间

var myDate = new Date(yyyy, mm, dd, hh, mm, ss);

var myDate = new Date(yyyy, mm, dd);

var myDate = new Date(“monthName dd, yyyy hh:mm:ss”);

var myDate = new Date(“monthName dd, yyyy”);

var myDate = new Date(epochMilliseconds);
```

- **获取时间的某部份**

```javascript
var myDate = new Date();

myDate.getYear(); //获取当前年份(2位)

myDate.getFullYear(); //获取完整的年份(4位,1970-????)

myDate.getMonth(); //获取当前月份(0-11,0代表1月)

myDate.getDate(); //获取当前日(1-31)

myDate.getDay(); //获取当前星期X(0-6,0代表星期天)

myDate.getTime(); //获取当前时间(从1970.1.1开始的毫秒数) 时间戳！！

myDate.getHours(); //获取当前小时数(0-23)

myDate.getMinutes(); //获取当前分钟数(0-59)

myDate.getSeconds(); //获取当前秒数(0-59)

myDate.getMilliseconds(); //获取当前毫秒数(0-999)

myDate.toLocaleDateString(); //获取当前日期

myDate.toLocaleTimeString(); //获取当前时间

myDate.toLocaleString( ); //获取日期与时间
```
- **计算之前或未来的时间**

```javascript
var myDate = new Date();

myDate.setDate(myDate.getDate() + 10); //当前时间加10天//类似的方法都基本相同,以set开头,具体参考第2点
```

- **计算两个日期的偏移量**

```javascript
var i = daysBetween(beginDate,endDate); //返回天数

var i = beginDate.getTimezoneOffset(endDate); //返回分钟数
```
- **检查有效日期**

```javascript
//checkDate() 只允许”mm-dd-yyyy”或”mm/dd/yyyy”两种格式的日期
if( checkDate(“2006-01-01”) ){ }

//正则表达式(自己写的检查 yyyy-mm-dd, yy-mm-dd, yyyy/mm/dd, yy/mm/dd 四种)

var r = /^(\d{2}|\d{4})[\/-]\d{1,2}[\/-]\d{1,2}$/;if( r.test( myString ) ){ }
```

#####  字符串String型函数API
---


![js下常用的字符串方法](http://upload-images.jianshu.io/upload_images/1480597-588f28213506abe1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- **声明**

```javascript
var myString = new String(“Every good boy does fine.”);

var myString = “Every good boy does fine.”;
```

- **字符串连接**

```javascript
var myString = “Every ” + “good boy ” + “does fine.”;

var myString = “Every “; myString += “good boy does fine.”;
```

- **截取字符串**

```javascript
//截取第 6 位开始的字符

var myString = “Every good boy does fine.”;

var section = myString.substring(6); //结果: “good boy does fine.”

//截取第 0 位开始至第 10 位为止的字符

var myString = “Every good boy does fine.”;

var section = myString.substring(0,10); //结果: “Every good”

//截取从第 11 位到倒数第 6 位为止的字符

var myString = “Every good boy does fine.”;

var section = myString.slice(11,-6); //结果: “boy does”

//从第 6 位开始截取长度为 4 的字符

var myString = “Every good boy does fine.”;

var section = myString.substr(6,4); //结果: “good”
```

- **转换大小写**

```javascript
var myString = “Hello”;

var lcString = myString.toLowerCase(); //结果: “hello”

var ucString = myString.toUpperCase(); //结果: “HELLO”
```

- **字符串比较**

```javascript
var aString = “Hello!”;

var bString = new String(“Hello!”);

if( aString == “Hello!” ){ } //结果: true

if( aString == bString ){ } //结果: true

if( aString === bString ){ } //结果: false (两个对象不同,尽管它们的值相同)
```

- **检索字符串**

```javascript
var myString = “hello everybody.”;

// 如果检索不到会返回-1,检索到的话返回在该串中的起始位置

if( myString.indexOf(“every”) > -1 ){ } //结果: true
```

- **查找替换字符串**

```javascript
var myString = “I is your father.”;

var result = myString.replace(“is”,”am”); //结果: “I am your father.”
```

- **特殊字符**

  - `\b` : 后退符 
  - `\t` : 水平制表符
  - `\n` : 换行符 
  - `\v` : 垂直制表符
  - `\f` : 分页符 
  - `\r` : 回车符
  - `\”` : 双引号 
  - `\’` : 单引号
  - `\\ 反斜杆`


- **将字符转换成`Unicode`编码**

```javascript
var myString = “hello”;

var code = myString.charCodeAt(3); //返回”l”的Unicode编码(整型)

var char = String.fromCharCode(66); //返回Unicode为66的字符
```

- **将字符串转换成URL编码**

```javascript
var myString = “hello all”;

var code = encodeURI(myString); //结果: “hello%20all”

var str = decodeURI(code); //结果: “hello all”

//相应的还有: encodeURIComponent() decodeURIComponent()
```
- 扩展阅读
    - [JavaScript下常用的字符串](http://blog.poetries.top/2016/08/02/javascript%20%E4%B8%8B%E5%B8%B8%E7%94%A8%E7%9A%84%E5%AD%97%E7%AC%A6%E4%B8%B2%E6%93%8D%E4%BD%9C/)

##### Math对象型
---

- `Math.abs(num)` : 返回`num`的绝对值

- `Math.acos(num)` : 返回`num`的反余弦值

- `Math.asin(num)` : 返回`num`的反正弦值

- `Math.atan(num)` : 返回`num`的反正切值

- `Math.atan2(y,x)` : 返回`y`除以`x`的商的反正切值

- `Math.ceil(num)` : 返回大于`num`的最小整数

- `Math.cos(num)` : 返回`num`的余弦值

- `Math.exp(x)` : 返回以自然数为底,x次幂的数

- `Math.floor(num)` : 返回小于`num`的最大整数

- `Math.log(num)` : 返回`num`的自然对数

- `Math.max(num1,num2)` : 返回`num1`和`num2`中较大的一个

- `Math.min(num1,num2)` : 返回`num1`和`num2`中较小的一个

- `Math.pow(x,y)` : 返回`x`的`y`次方的值

- `Math.random()` : 返回`0`到`1`之间的一个随机数

- `Math.round(num)` : 返回`num`四舍五入后的值

- `Math.sin(num)` : 返回`num`的正弦值

- `Math.sqrt(num)` : 返回`num`的平方根

- `Math.tan(num)` : 返回`num`的正切值

- `Math.E` : 自然数(`2.718281828459045`)

- `Math.LN2` : `2`的自然对数(`0.6931471805599453`)

- `Math.LN10` : `10`的自然对数(`2.302585092994046`)

- `Math.LOG2E` : `log 2` 为底的自然数(`1.4426950408889634`)

- `Math.LOG10E` : `log 10` 为底的自然数(`0.4342944819032518`)

- `Math.PI` : `π(3.141592653589793)`

- `Math.SQRT1_2` : `1/2`的平方根(`0.7071067811865476`)

- `Math.SQRT2` : `2`的平方根(`1.4142135623730951`)

##### Number型 常用的数字函数
---


- **声明**

```javascript
var i = 1;

var i = new Number(1);
```

- **字符串与数字间的转换**

```javascript
var i = 1;

var str = i.toString(); //结果: “1”

var str = new String(i); //结果: “1”

i = parseInt(str); //结果: 1

i = parseFloat(str); //结果: 1.0

//注意: parseInt,parseFloat会把一个类似于”32G”的字符串,强制转换成32
```

- **判断是否为有效的数字**

```javascript
var i = 123; var str = “string”;

if( typeof i == “number” ){ } //true

//某些方法(如:parseInt,parseFloat)会返回一个特殊的值NaN(Not a Number)

//请注意第2点中的[注意],此方法不完全适合判断一个字符串是否是数字型!!

i = parseInt(str);

if( isNaN(i) ){ }
```

- **数字型比较**

```javascript
//此知识与[字符串比较]相同

- **小数转整数**

var f = 1.5;

var i = Math.round(f); //结果:2 (四舍五入)

var i = Math.ceil(f); //结果:2 (返回大于f的最小整数)

var i = Math.floor(f); //结果:1 (返回小于f的最大整数)
```

- **格式化显示数字**

```javascript
var i = 3.14159;

//格式化为两位小数的浮点数

var str = i.toFixed(2); //结果: “3.14”

//格式化为五位数字的浮点数(从左到右五位数字,不够补零)

var str = i.toPrecision(5); //结果: “3.1415”
```

- **X进制数字的转换**

```javascript

var i = parseInt(“0x1f”,16);

var i = parseInt(i,10);

var i = parseInt(“11010011”,2);
```

- **随机数**

```javascript
//返回0-1之间的任意小数

var rnd = Math.random();

//返回0-n之间的任意整数(不包括n)

var rnd = Math.floor(Math.random() * n)
```

##### 5.`Regex`
---

```javascript
//在这个最大的对象的原型上加一个extends方法 使得下面所有的原型 都有这个方法
 //这个原型的作用是通过迭代 复制传进来的构造器的所有的原型的方法

 Object.prototype.extends = function(parent){
     //console.log(parent.prototype);

    for(var prop in parent.prototype){
        //console.log(prop);//eat extends
        this.prototype[prop] = parent.prototype[prop];//复制传进来的构造器的所有的原型的方法给当前正在调用这个方法的对象
    }
 }

 function Person(name){
    this.name = name;
 }
 Person.prototype = {
    eat:function(){
        alert(this.name+"在吃饭");
    }
 };

 function Father(name){
    this.name = name;
 }

 Father.extends(Person);//extends方法是最大的对象Object加的方法 所有的子孙 构造器都有这个方法

 var f = new Father("小头爸爸");
 f.eat();
```

#### **一些图示**
---

![](http://upload-images.jianshu.io/upload_images/1480597-6828aabba7d2948e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![](http://upload-images.jianshu.io/upload_images/1480597-f4f9ade4c089cabd.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 正则表达式扩展阅读
  - [正则表达式30分钟入门教程](http://deerchao.net/tutorials/regex/regex.htm)
 - [梳理常用的正则表达式](http://blog.poetries.top/2016/07/09/%E6%A2%B3%E7%90%86%E5%B8%B8%E7%94%A8%E7%9A%84%E6%AD%A3%E5%88%99%E8%A1%A8%E8%BE%BE%E5%BC%8F/)

### 第十一课时
---

#### **上节回顾：**
---

- 1.`String`
- 2.`Math`  `Math.random()`

#### **知识点：**
---

- 1.`Date` 日期类
-  2.`Array`
-  3.`Regex`
  - a.`[]`一个字符的范围
  - b.有顺序要求的
  - c.`\w==[a-zA-Z0-9_]`  `\d==[0-9]`
  - d.`{count}`设置匹配数量比如`\w{5}`
  - e.`//`的正则表达式匹配局部，`/^$/`的正则表达式是匹配全部
  - f.`()`的作用就是为了分组匹配


- 简单封装一个对象案例

```javascript
String.prototype.isEmail = function(){

  email = this;
  if (email.indexOf("@")!=-1&&email.indexOf(".")!=-1)
  {
    if(email.indexOf("@")<email.lastIndexOf("@")){
      alert("邮箱不合法");
    }else{
      alert("邮箱合法");
    }
  }

}
var email = "jingguanliuye@gmail.com";
email.isEmail();
```

```javascript
//===============================日历练习(方法简洁 高效)======================================

//var year = parseInt(prompt("请输入日历年份："));
//var month = parseInt(prompt("请输入日历月份："))-1;

Date.prototype.printCalendar = function(){

var year = this.getFullYear(),month = this.getMonth();
var date = new Date(year,month,1);

//alert(date.toLocaleString());
document.write("<div class='date'>"+year+"年"+(month+1)+"月</div>");
document.write("日 一 二 三 四 五 六<br />");

var day = date.getDay();
for(var i=0;i<day;i++){
  document.write('  ');
}

var count = new Date(year,month+1,0).getDate();//这里的0返回一个月的最后一天
for(var i=1;i<=count;i++){
  document.write(i+'  ');
  if((i+day)%7==0){
    document.write('<br/>');
  }
}
}
new Date(2012,2).printCalendar();
```

### 第十二课时
---

#### **上节回顾：**
---

- 1.`Date` 期类
- 2.`Array`
- 3.`Regex`
     -  a.`[]`一个字符的范围
     -  b.有顺序要求的
     -  c.`\w==[a-zA-Z0-9_]`  `\d==[0-9]`
     -  d.`{count}`设置匹配数量比如`\w{5}`，`{c1,c2}`
     -  e.`//`的正则表达式匹配局部，`/^$/`的正则表达式是匹配全部
     -  f.`()`的作用就是为了分组匹配


#### **新知识点：**
---
- 1.`Regex`
     - g.`+`代表的是`1-N`个，`*`代表的是`0-N`个
     - h.`?`代表该字符要不没有要不就有一个
     - i.`.`代表的是任意字符
     - j. `\转义符`
- 2.`BOM`
   
### 第十三课时
---
 
####  **上节回顾：**
---

- 1.Regex
     - a.`[]`一个字符的范围
     - b.有顺序要求的
     - c.`\w==[a-zA-Z0-9_]`  `\d==[0-9]`
     - d.`{count}`设置匹配数量比如`\w{5}`，`{c1,c2}`
     - e.`//`的正则表达式匹配局部，`/^$/`的正则表达式是匹配全部
     - f.`()`的作用就是为了分组匹配
     - g.+代表的是`1-N`个，`*`代表的是`0-N`个
     - h.`?`代表该字符要不没有要不就有一个
     - i.`.`代表的是任意字符
     - j.`\转义符`

#### **新知识：**
---

- `window` 是`Window`构造器造出来的一个对象 `alert(window instanceof Window)`
- `document` 是`Document`构造器造出来的一个对象
- 任何对象在我们的内存中他都是由某个构造器创建出来的 也就是说 有构造器一定有对应的原型prototype
- 例如：`div`是由`HTMLDivElement` 这个构造器创建的一个实例 `div = new HTMLDivElement()`  `span = new HTMLSpanElement()`
- 查看某个对象对应的构造器：`console.log();`
-  整个浏览器的实现就是一个面向对象的编程思想 一切皆是对象

#### 1.BOM 浏览器对象模型
---

![BOM](http://upload-images.jianshu.io/upload_images/1480597-8b133694198ad13f.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- a.`screen` 指的不是浏览器的宽度，指的是整个电脑屏幕的分辨率
     - 可以拿到屏幕可用分辨率
- b.`navigator`
     - 可以通过`userAgent`判断当前浏览器信息
- c.`location`
   - `URL`：统一资源定位符 `Union Resource Location`
   - 可以通过`href`属性重定向（改变）页面的URL，进行页面跳转
- d.`history`
     - `go`方法能够让我们进行历史回退或者前进
- e.`frames`
     - 获得当前窗体的子页面（`iframe`）

- f.`document`
     -  `DOM`模型的核心对象

#### 2.`DOM` 文档对象模型
---

- **`document`**
     + **功能**
        + `getElementById`   `$('#aaa')`
        + `getElementByTagName`  `$('div')`
        + `getElementsByClassName`  `$('.aaa')`
        + `getElementsByName`  只用在表单元素中

- **`document` `object`**

     - **属性：**
        + `className`，`style`
        + `id`
        + `name`,`value`(表单元素)
        + `href`,`src`...(对应的元素)
        + `innerHTML`
        + `children`
        + `parentNode`
     + **功能方法：**
         + `setAttribute/getAttribute`
         + `appendChild`


### 第十四课时
---

#### **上节回顾：**
---

- 1.BOM 浏览器对象模型
 - a.`screen` 指的不是浏览器的宽度，指的是整个电脑屏幕的分辨率
    - 可以拿到屏幕可用分辨率
 - b.`navigator`
    - 可以通过`userAgent`判断当前浏览器信息
 - c.`location`
      - `URL`：统一资源定位符 `Union Resource Location`
      - 可以通过`href`属性重定向（改变）页面的URL，进行页面跳转
 - d.`history`
    - `go`方法能够让我们进行历史回退或者前进
 - e.`frames`
            获得当前窗体的子页面（`iframe`）
 - f.`document`
    - `DOM`模型的核心对象
- 所有的`DOM`对象都是在堆内存创建的 都是有一个构造器生成的
- 查看对象的构造器器方法：
  - step1：查看标签的对象以及构造器`var body = document.body;console.log(body.toString())`
  - step2：查看对象是否是这个构造器创建出来的 `console.log(body instanceof HTMLBodyElement)`

#### **新知识点：**
---

#### 1.DOM 文档对象模型
---

##### **document**
---

- 功能
     - `getElementById`：通过传入的ID，返回标识了这个ID的唯一对象的内存地址
     - `getElementsByTagName`:通过传入的标签名字，返回所有该标签对象（`HTMLCollection`）
     - `getElementsByClassName`:通过类的名字，返回所有该类的元素对象（`HTMLCollection`）
     - `createElement`:想要创建出来的元素能够绘制在页面中，那么它必须在DOM树中
   - **总结** `document`对象是DOM原型的核心对象，它是内存DOM树的根，所以它提供了很多功能让我们快速的找到DOM树中的某些DOM节点（对象）

##### **`element`**
---

 - 功能方法：（自定义属性非常灵活好用）
   - `setAttribute/getAttribute` //getAttribute获取标签的属性 --用来操作标签的属性
   - `setAttribute`设置标签的属性
   - `appendChild`:添加子元素

 - 属性：

   - `id`
   - `className`，`style`
   - `name`,`value`(只有表单元素有 其他是没有的)
   - `href`,`src`...(对应的元素)
   - `innerHTML/innerText`  `innerText`返回文本信息
   - `children`://子元素集合
   - `parentNode`//父元素

- 总结：元素的功能属性直接可以通过元素对象`点`出来，除此意外的`自定义属性`，请通过`get/setAtribute`去操作


#### **DOM 操作：**
---

- 图片切换的相册效果
- `tab`切换效果
- 表单验证
- 特效就是`DOM`操作的具体应用 `DOM`操作就是用`js`来写`HTML`代码
- 节点/元素/标签：
   - 三种常用的节点类型：
     - 元素节点
     - 属性节点
     - 文本节点

#### **操作DOM对象：**
---

- 修改：--找到这个节点
- 删除：--找到这个节点
- 添加：--先造出一个节点 然后插入 插入到哪里？找节点来定位
- 这些都离不开节点的查找

#### **节点的查找：（最重要）**
---

 - 1、`document.getElementById`---根据`id`查找节点 [返回的是节点本身]
 - 2、`document.getElementsByTagName`--根据标签名字来查找[返回的是数组]`document.getElementsByTagName[i]`
 - 3、`document.getElemenstByName`--根据`name`属性来查找节点（一般用在表单中）[返回的是数组]`document.getElemenstByName[i]`

- **注意：**早期浏览器都认为`name`只出现在表单中 

- 因此`document.getElemenstByName`只对表单中的元素发挥作用 后来部分浏览器把`Name`属性扩展到一般的元素 如：`div` 但是IE浏览器还是只能对表单使用`byName `因此处于兼容性 我们只能对表单使用` byName`

#### `DOM`中查找节点的思路：（由大到小 个别情况 由子到父）
---

- 由大到小：（通过下面的来定位）

 - 1、`document.getElementById`---根据id查找节点 [返回的是节点本身]
 - 2、`document.getElementsByTagName`--根据标签名字来查找[返回的是数组]`document.getElementsByTagName[i]`
 - 3、`document.getElemenstByName`--根据`name`属性来查找节点（一般用在表单中）[返回的是数组]`document.getElemenstByName[i]`
- 如果还没有查到自己想要的节点，还可以继续根据上面已经找到的节点再次定位来查找
- 怎么继续定位？
  - 答：`childNodes/child`

#### **继续查找：**

- 1、查找子元素 `children[index]/childNodes`
- 2、查找父元素 `node.parentNode` -->获取父元素
- 3、查找兄弟元素 `nextSibling` `previousSibling`
- 4、`nextSibling` `previousSibling` `firstChild` `lastChild `这四个属性容易受到`空白文本`的影响 `建议不用`

```javascript
//============给Object原型加一个方法 消除文本节点对DOM操作的影响 例如：nextSibling` `previousSibling` `firstChild` `lastChild （受到换行 和文本节点影响）

Object.prototype.next = function(){
  //NodeType == 3 text的代号
  //NodeType == 1 tag的代号
  if(this.nextSibling){//判断下一个兄弟节点是否存在
  switch(this.nextSibling.nodeType){
    case 1:
      return this.nextSibling;
    case 3:
      return this.nextSibling.nextSibling;
  }
}else{
  return null;
}
console.log(div1.next().next().innerText);
```

- 5、对于查到的某个元素里面的子元素非常多 这时候还可利用`getElementsByTagname`进一步筛选
       
- **注意** 对于元素对象和`document`对象相比 元素对象只能利用`getElementsByTagName`函数 其他两个不能用


- 节点查找也是通过由大到小来定位：找到大的元素进一步细化 完全可以找到页面上任意一个元素控制他

- 子元素 不好找 就找他的父元素

- 要过滤空白文本节点，用`children`取他的文本节点

#### **DOM与节点的关系：**
---

 - **node:**
    - `childNodes[]`
    - `parentNode`
    - `firstChild`
    - `getElementsByTagName('元素标签')`
    - `lastchild`
    - `nextSibling`
    - `previousSibling`
    - `children[index]` `children` 不是`w3c`标准 但是各大浏览器兼容性很好

- 通过给原型添加方法在元素后面创建标签

- **启示**：在项目中，很多很多地方都需要一个方法但是系统没提供，这时可以通过原型扩展

```javascript
//var p = document.createElement('p');
//p.innerHTML = "this is a p";
//var child = document.getElementsByTagName('div');

//给Div的HTMLDivElement构造器原型加一个创建元素的方法 要所有的元素都有这个方法 改成 Object
HTMLDivElement.prototype.createElement = function(tagName){
  var child = document.createElement(tagName);
  this.appendChild(child);
  return child;
}
var child = document.getElementsByTagName('div')[2].createElement("p");
child.innerHTML = 'pppppp';

```

##### **DOM属性小结**
---

- `Attributes`	存储节点的属性列表(只读)

- `childNodes`	存储节点的子节点列表(只读)

- `dataType`	返回此节点的数据类型

- `Definition`	以`DTD`或`XML`模式给出的节点的定义(只读)

- `Doctype`	指定文档类型节点(只读)

- `documentElement`	返回文档的根元素(可读写)

- `firstChild`	返回当前节点的第一个子节点(只读)

- `Implementation`	返回`XMLDOMImplementation`对象

- `lastChild`	返回当前节点最后一个子节点(只读)

- `nextSibling`	返回当前节点的下一个兄弟节点(只读)

- `nodeName`	返回节点的名字(只读)

- `nodeType`	返回节点的类型(只读)

- `nodeTypedValue`存储节点值(可读写)

- `nodeValue`	返回节点的文本(可读写)

- `ownerDocument`	返回包含此节点的根文档(只读)

- `parentNode	`返回父节点(只读)

- `Parsed`	返回此节点及其子节点是否已经被解析(只读)

- `Prefix`	返回名称空间前缀(只读)

- `preserveWhiteSpace`	指定是否保留空白(可读写)

- `previousSibling`	返回此节点的前一个兄弟节点(只读)

- `Text`	返回此节点及其后代的文本内容(可读写)

- `url	`返回最近载入的XML文档的`URL`(只读)

- `Xml`	返回节点及其后代的`XML`表示(只读)

##### DOM方法小结
---

  - `cloneNode`	返回当前节点的拷贝
  - `createAttribute`	创建新的属性

- **节点操作`DOMDocument`属性和方法**

  - `createCDATASection`	创建包括给定数据的`CDATA`段

  - `createComment`	创建一个注释节点

  - `createDocumentFragment`	创建`DocumentFragment`对象

  - `createElement_x_x`	创建一个元素节点

  - `createEntityReference`	创建`EntityReference`对象

  - `createNode`	创建给定类型,名字和命名空间的节点

  - `createPorcessingInstruction`	创建操作指令节点

  - `createTextNode`	创建包括给定数据的文本节点

  - `getElementsByTagName	`返回指定名字的元素集合

  - `hasChildNodes`	返回当前节点是否有子节点

  - `insertBefore	`在指定节点前插入子节点

  - `Load	`导入指定位置的XML文档

  - `loadXML`	导入指定字符串的XML文档

  - `removeChild`	从子结点列表中删除指定的子节点

  - `replaceChild	`从子节点列表中替换指定的子节点

  - `Save	把`XML`文件存到指定节点

  - `selectNodes`	对节点进行指定的匹配,并返回匹配节点列表

  - `selectSingleNode`	对节点进行指定的匹配,并返回第一个匹配节点

  - `transformNode`	使用指定的样式表对节点及其后代进行转换

  - `transformNodeToObject`	使用指定的样式表将节点及其后代转换为对象

  - `document.documentElement	`返回文档的根节点

  - `document.activeElement`	返回当前文档中被击活的标签节点

  - `event.fromElement`	返回鼠标移出的源节点

  - `event.toElement	`返回鼠标移入的源节点

  - `event.srcElement`	返回激活事件的源节点

  - `node.parentNode,node.parentElement`	返回父节点

  - `node.childNodes`	返回子节点集合（包含文本节点及标签节点）

  - `node.children`	返回子标签节点集合

  - `node.textNodes`	返回子文本节点集合

  - `node.firstChild	`返回第一个子节点

  - `node.lastChild`	返回最后一个子节点

  - `node.nextSibling	`返回同属下一个节点

  - `node.previousSibling`	返回同属上一个节点

  - `node.a(oNode)`	追加子节点：

  - `node.applyElment(oNode,sWhere)`

  - `sWhere`有两个值：`outside` / i`nside`	应用标签节点
 
  - `node.insertBefore()`

  - `node.insertAdjacentElement()`

  - `node.replaceAdjacentText()`

- **插入节点**

  - `node.remove()`
  - `node.removeChild()`
  - `node.removeNode()`

- **删除节点**

  - `node.replaceChild()`
  - `node.replaceNode()`
  - `node.swapNode()`

- **替换节点**

  - `node.cloneNode(bAll)	`返回复制复制节点引用
  - `node.contains()`	是否有子节点
  - `node.hasChildNodes()	`是否有子节点


- 扩展阅读
  - [DOM编程之API总结篇](http://www.jianshu.com/p/1e638b7da640)

### 第十五课时
---

#### **上节回顾：**
---

#### 1.DOM 文档对象模型
---

##### document
- 功能
    - `getElementById`：通过传入的ID，返回标识了这个ID的唯一对象的内存地址
    - `getElementsByTagName`:通过传入的标签名字，返回所有该标签对象（`HTMLCollection`）
    - `getElementsByClassName`:通过类的名字，返回所有该类的元素对象（`HTMLCollection`）
    - `createElement`:想要创建出来的元素能够绘制在页面中，那么它必须在DOM树中
   - 总结： `document`对象是DOM原型的核心对象，它是内存DOM树的根，所以它提供了很多功能让我们快速的找到DOM树中的某些DOM节点（对象）
- `element`
    - 功能方法：（自定义属性非常灵活好用）
      - `setAttribute/getAttribute` //getAttribute获取标签的属性 --用来操作标签的属性
      - `setAttribute`设置标签的属性
      - `appendChild`:添加子元素
    - 属性：
      - `id`
      - `className`，`style`
      - `name`,`value`(只有表单元素有 其他是没有的)
      - `href`,`src`...(对应的元素)
      - `innerHTML/innerText`  innerText返回文本信息
      - `children`://子元素集合
      - `parentNode`//父元素
   - 总结：元素的功能属性直接可以通过元素对象`点`出来，除此意外的`自定义属性`，请通过`get/setAtribute`去操作

#### **新知识点：**
---

#### 1.**事件（事故）基础**
---

- 白话含义：就是当一个事物遇到某个事情的时候，要做的事情
	- （事件源）
	- （事件监听名称）
	- （事件处理程序）

#### 2.常用事件
---

 - `onclick:`当事件源被点击的时候调用处理程序
 - `onmouseover:`鼠标进入事件
 - `onmouseout:`鼠标移出事件
 - `onmousedown:`鼠标按下去的时候
 - `onmouseup:`鼠标抬起来的时候
 - `onscroll:`当事件源滚动条滚动的时候
 - `onkeydown:`当键盘按下的时候
 - `onkeypress:`当键盘按下去的时候
 - `onkeyup:`当键盘弹上来的时候
 - `onfocus:`当事件源获得光标
 - `onblur:`当事件源失去光标
 - `onchange:`当事件源`blur`的时候内容改变了的话

#### **浏览器事件注意事项：**
---

- 1.以后我们不要把事件写在标签上,而使用`js`方式操作
- 2.js方式操作的话：
    + 非`IE`浏览器第一个对象就会传入`event`事件源对象
    + IE浏览器第一个对象就不会传入`event`事件源对象（`event = event||window.event`;）
    + 非`IE`浏览器的事件源属性是`target`属性（`event.target = event.target||event.srcElement`;）
    + `IE`浏6览器的事件源属性是`srcElement`属性
- 3.事件冒泡机制


### 总结
---

- 以上是一些很基础的理论，笔记经验终究是别人的，看完了还是会忘记的，要转化成自己的东西，还要靠你不断实践。


![学编程最佳实践](http://upload-images.jianshu.io/upload_images/1480597-7848f738f43affba.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- `JavaScript`读书路线

![JavaScript读书路线--from phodal](https://github.com/phodal/developer/raw/master/images/js.gif)



### js一些资料推荐
---

- 视频
    - [Javascript第一季初级视频教程【李炎恢老师】](http://edu.51cto.com/course/course_id-166-page-1.html)
    - [JavaScript视频教程 | 智能社](http://www.zhinengshe.com/video.html)
- 了解`web`开发知识体系
  - [Growth - 陪你成为顶尖开发者](https://github.com/phodal/growth)
  - [GitHub上收集整理的前端资源](https://github.com/poetries/mywiki)

- 常用组件
  - [js常用组件整理](https://github.com/poetries/mywiki/blob/master/bookmark/%E5%B8%B8%E7%94%A8%E7%BB%84%E4%BB%B6.md)
- 扩展阅读
  - [廖雪峰JavaScript基础教程](http://www.liaoxuefeng.com/wiki/001434446689867b27157e896e74d51a89c25cc8b43bdb3000)
 - [JavaScript 闯关记](https://github.com/stone0090/javascript-lessons)
 - [深入理解JavaScript系列 - 汤姆大叔](http://www.cnblogs.com/TomXu/archive/2011/12/15/2288411.html)
 - [JavaScript秘密花园](http://bonsaiden.github.io/JavaScript-Garden/zh/)

### 附录一份大神总结的关于js的导图
---

![DOM基本操作](http://upload-images.jianshu.io/upload_images/1480597-3a584567c41f737d.gif?imageMogr2/auto-orient/strip)

![javascript函数基础](http://upload-images.jianshu.io/upload_images/1480597-7de04acbf81543fc.gif?imageMogr2/auto-orient/strip)

![JavaScript数据类型](http://upload-images.jianshu.io/upload_images/1480597-5737bc8360e9e8d3.gif?imageMogr2/auto-orient/strip)

![window对象](http://upload-images.jianshu.io/upload_images/1480597-44d4ba1c8f6d48a6.gif?imageMogr2/auto-orient/strip)

![javascript变量](http://upload-images.jianshu.io/upload_images/1480597-05b7f79120cc6150.gif?imageMogr2/auto-orient/strip)

![JavaScript字符串函数](http://upload-images.jianshu.io/upload_images/1480597-1b25cf62140a30fb.gif?imageMogr2/auto-orient/strip)

![JavaScript正则表达式](http://upload-images.jianshu.io/upload_images/1480597-30e2e0981d225fd4.gif?imageMogr2/auto-orient/strip)

![JavaScript流程控制](http://upload-images.jianshu.io/upload_images/1480597-8bdb24d940eceeea.gif?imageMogr2/auto-orient/strip)

![JavaScript运算符](http://upload-images.jianshu.io/upload_images/1480597-caa897f33ef0e47d.gif?imageMogr2/auto-orient/strip)

![JavaScript数组](http://upload-images.jianshu.io/upload_images/1480597-eb23ab7b14608e83.gif?imageMogr2/auto-orient/strip)

- [本文mardown原文件--欢迎转载](https://github.com/poetries/poetries.github.io/blob/dev/source/_posts/javascript%E7%AC%94%E8%AE%B0%E5%9F%BA%E7%A1%80%E6%80%BB%E7%BB%93%E7%AF%87.md)
