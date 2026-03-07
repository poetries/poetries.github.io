---
title: JavaScript启示录阅读笔录
date: 2017-10-24 10:30:13
tags: 
 - JavaScript
 - 读书笔记
categories: Front-End
---

## 第一章 JavaScript对象

### 1.1 创建对象
---

```javascript
//创建copy对象
var copy = new Object();

//为对象的各种属性赋值
copy.living = true;
copy.age = 33;
copy.gender = 'male';


// logs Object {living = true, age = 33, gender = 'male'}
console.log(cody); 
```

- 最重要的是要记住：对象只是属性的容器，每个属性都有一个名称和一个值

### 1.2 JavaScript构造函数构建并返回对象实例
---

- 构造函数的作用是创建多个共享特定特性和行为的对象。
- 构造函数主要是用于生成对象的模具，这些对象具有默认属性和属性方法

```javascript
//Pserson是一个构造函数 使用new关键字进行实例化
  var Person = function(living,age,gender){
        //this表示即将创建的新对象
        
        this.living = living;
        this.age = age;
        this.gender = gender;
        this.getGender = function(){
            return this.gender;
        }
        
    //实例化Person对象 
    var copy = new Person(true,22,'male');
    
    console.log(copy.constructor);//输入Person函数
  }

```

### 1.3 JavaScript原生内置对象构造函数
---

- `JavaScript`包含九个原生对象构造函数，`JavaScript`使用这些对象来构建`JavaScript`语言

- `Number()`
- `String()`
- `Boolean()`
- `Object()`
- `Array()`
- `Function()`
- `Date()`
- `RegExp()`
- `Error()`

- 使用`new`关键字实例化每个原生构造函数

```javascript
var number = new Number(22);
var string = new String("male");
var boolean = new Boolean(false);
var obj = new Object();
var arr = new Array("foo","dfa");
var func = new Function("x","y","return x*y");
var date = new Date();
var reg = new RegExp('\bt[a-z]+\b');
var error = new Error("Crap");
```

## 第二章 对象与属性
---

### 2.1 封装复杂对象
---

- `Object()`、`Array()`、 `Function()`对象可以包含其他复杂对象

```javascript
//使用对象封装，创建对象链
var obj1 = {
    obj1_1: {
        obj1_1_1: {}
    },
     obj1_2: {
        obj1_2_1: {}
    },
};

```

```javascript
//使用数组封装 创建多维数组链

var myArr = [ [ [] ] ];
```

```javascript
//使用function封装

var myFunc = function(){

    va myfunc = function(){
        var myfunc = function(){
            
        }
    }
}
```

### 2.2 用点表示法或中括号表示法获取/设置/更新对象属性
---

```javascript
// creating cody Object() object
var cody = new Object();

// setting properties
cody['living'] = true;
cody['age'] = 33; 
cody['gender'] = 'male';
cody['getGender'] = function() {return cody.gender;};

// getting properties
console.log(
    cody['living'], 
    cody['age'], 
    cody['gender'], 
    cody['getGender']() // just slap the function invocation on the end!
); // logs 'true 33 male male'

// updating properties, very similar to setting
cody['living'] = false;
cody['age'] = 99; 
cody['gender'] = 'female';
cody['getGender'] = function() {return 'Gender = ' + cody.gender;};
```

### 2.3 删除对象属性
---

```javascript
var foo = {bar:"bar"};
delete foo.bar;

console.log("bar" in foo);
```

### 2.4 使用hasOwnProperty验证对象属性是否来自原型链
---

```javascript
var obj = {foo:"value"};
console.log(obj.hasOwnProperty("foo"));//true
```

### 2.5 使用in操作符来检查一个对象是否包含给定属性
---

```javascript
var myObject = {foo: 'value'};
console.log('foo' in myObject); // logs true
```

### 2.6 使用for in循环枚举对象属性
---

```javascript
var copy = {
    age:23,
    gender:'male'
};

for(var key in copy){//key表示每个属性的名称
    if(copy.hasOwnproperty(key)){ //避免来自原型链的属性
        console.log(key);
    }
}
```

## 第三章 Object

### 3.1 Object对象概要
---

```javascript
var copy = {};
for (key in copy){
    if(copy.hasOwnproperty(key)){
        console.log(key);
    }
}
```


### 3.2 Object对象实例属性和方法
---

- 实例属性 
  - `constructor`
- 实例方法
  - `hasOwnProperty()`
  - `isPrototypeOf()`
  - `propertyIsEnumerable()`
  - `toLocaleString()`
  - `toString()`
  - `valueOf()`
 


## 第四章 Function

### 4.1 Function对象属性和方法
---

- 属性 `prototype`

### 4.2 function对象实例属性和方法
---

- 实例属性
  - `arguments`
  - `constructor`
  - `length`
 
- 实例方法
  - `apply()`
  - `call()`
  - `toString()`
 
### 4.3 `this`和`arguments`适用于所有函数
---

- 在所有函数的作用域、函数体内，`this`和`arguments`值都是可用的

- `arguments`对象是一种类数组对象，它包含所有传递给函数的参数

```javascript
var add = function(){

    return arguments[0] + arguments[1];
};

console.log(add(4,4));//8

```

```javascript
var myObject1 = {
    name: 'myObject1',
    myMethod: function(){console.log(this.name);}
};

myObject1.myMethod(); // logs 'myObject1'

var myObject2 = function(){console.log(this);}; 

myObject2(); // logs Window
```

### 4.4 函数实例的length属性和arguments.length
---

- `argument`对象有一个独特的`length`属性，它给出的是在调用时发送给函数的参数数量

```javascript
var myObject1 = {
    name: 'myObject1',
    myMethod: function(){console.log(this.name);}
};

myObject1.myMethod(); // logs 'myObject1'

var myObject2 = function(){console.log(this);}; 

myObject2(); // logs Window

```

- 通过`Function()`实例的`length`属性，实际上可以获得函数所需要的参数总数量

```javascript
var myFunction = function(z, s, d, e, r, m, q) {
    return myFunction.length;
};

console.log(myFunction()); //logs 7

```

### 4.5 定义函数语句、表达式、构造函数
---

```javascript
//函数构造函数
var addConstructor = new Function("x","y","return x + y");

//函数语句
function  addStatement(x,y){
    return x + y;
}

//函数表达式
var addExp = function(){
    return x + y;
}
```

### 4.6 调用函数（函数、方法、构造函数、call、apply）
---

- 使用四种不同场景或模式调用函数
   - 作为函数
   - 作为方法
   - 作为构造函数
   - 使用`call`、`apply`
   

```javascript
// function pattern
var myFunction = function(){return 'foo'};
console.log(myFunction()); // log 'foo'

// method pattern
var myObject = {myFunction: function(){return 'bar';}}
console.log(myObject.myFunction()); // log 'bar'

// constructor pattern
var Cody = function(){
    this.living = true;
    this.age = 33;
    this.gender = 'male';
    this.getGender = function() {return this.gender;};
}
var cody = new Cody(); // invoke via Cody constructor
console.log(cody); // logs cody object and properties

// apply() and call() pattern
var greet = {
    runGreet: function(){
        console.log(this.name,arguments[0],arguments[1]);
    }
}

var cody = {name:'cody'};
var lisa = {name:'lisa'};

//invoke the runGreet function as if it were inside of the cody object
greet.runGreet.call(cody,'foo','bar'); //logs cody

//invoke the runGreet function as if it were inside of the lisa object
greet.runGreet.apply(lisa, ['foo','bar']); //logs lisa

/* Notice the difference between call() and apply() in how parameters are sent to the function being invoked */
```

## 第六章 this关键字
---

### 6.1 this概要及this如何引用
---

```javascript
var cody = {
    living : true,
    age : 23,
    gender : 'male',
    getGender : function() {return cody.gender;}
};

console.log(cody.getGender()); // logs 'male'
```

- 使用`this`来重写`copy`对象

```javascript
var cody = {
    living: true, 
    age: 23, 
    gender: 'male', 
    getGender: function() {return this.gender;}
};

console.log(cody.getGender()); // logs 'male'
```

- `this`，只要记住，总的来说，`this`是在函数内部使用，用来引用包含函数的对象，而不是函数本身【使用`call`、`apply`、`new`情况例外】

### 6.2 如何确定this值
---

- `this`值会被传递给所有函数，其值基于在运行时调用函数的上下文

### 6.3 在嵌套函数中用this关键字引用head对象
---

```javascript
var myObject = {
    func1: function() {
        console.log(this); // logs myObject
        var func2 = function() {
            console.log(this) // logs window, and will do so from this point on
            var func3 = function() {
                console.log(this); // logs window, as it’s the head object
            }();
        }();
    }  
}

myObject.func1();
```

- 总结：当`this`值的宿主函数被封装在另一个函数的内部或在另一个函数的上下文中被调用时，`this`值永远是对`window`对象的引用

### 6.4 充分利用作用域链研究嵌套函数问题
---

- 可以简单在父函数中使用作用域链来保留对`this`的引用，以便`this`值不丢失

```javascript
var myObject = {
    myProperty: 'I can see the light', 
    myMethod : function(){
        var that = this; // myMethod 作用域内，保存this引用（也就是myObject）
        var helperFunction = function() { // 字函数
            
            console.log(that.myProperty); // logs 'I can see the light'
            console.log(this); // logs window object, if we don't use "that"
        }();
    }
}

myObject.myMethod(); // 调用 myMethod
```

### 6.5 使用call()、apply()控制this值
---

- `this`值通常取决于调用函数的上下文，但我们可以使用`apply`、`call`重写`this`值

```javascript
var myObject = {};

var myFunction = function(param1, param2) {
    // 调用函数的时候，通过call，将this指向myObject
    this.foo = param1;
    this.bar = param2;
    console.log(this) // logs Object {foo = 'foo', bar = 'bar'}
};

myFunction.call(myObject, 'foo', 'bar'); // invoke function, set this value to myObject

console.log(myObject) // logs Object {foo = 'foo', bar = 'bar'}
```

```javascript
var myObject = {};

var myFunction = function(param1, param2) {
    // 调用函数的时候，通过apply()，将this指向myObject
    this.foo = param1;
    this.bar = param2;
    console.log(this) // logs Object {foo = 'foo', bar = 'bar'}
};

myFunction.apply(myObject, ['foo', 'bar']); // invoke function, set this value

console.log(myObject) // logs Object {foo = 'foo', bar = 'bar'}
```

