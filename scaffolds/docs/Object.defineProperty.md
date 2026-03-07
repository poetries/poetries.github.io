---
title: Object.defineProperty详解
date: 2018-12-23 09:40:12
tags: 
  - JavaScript
  - Object.defineProperty 
categories: Front-End
---

> 来自网络

## 一、简介

**兼容性**

> 在`ie8`下只能在`DOM`对象上使用，尝试在原生的对象使用 `Object.defineProperty()`会报错。

定义对象可以使用构造函数或字面量的形式

```js
var obj = new Object;  //obj = {}
obj.name = "张三";  //添加描述
obj.say = function(){};  //添加行为
```

> 除了以上添加属性的方式，还可以使用`Object.defineProperty`定义新属性或修改原有的属性

## 二、Object.defineProperty()

### 2.1 定义

```js
Object.defineProperty(obj, prop, descriptor)
```

**参数说明**：

- `obj`：必需。目标对象 
- `prop`：必需。需定义或修改的属性的名字
- `descriptor`：必需。目标属性所拥有的特性

> 返回值：传入函数的对象。即第一个参数`obj`

- 针对属性，我们可以给这个属性设置一些特性，比如是否只读不可以写；是否可以被`for..in`或`Object.keys()`遍历。

**给对象的属性添加特性描述，目前提供两种形式：数据描述和存取器描述**

### 2.2 数据描述

> 当修改或定义对象的某个属性的时候，给这个属性添加一些特性

```js
var obj = {
    test:"hello"
}
//对象已有的属性添加特性描述
Object.defineProperty(obj,"test",{
    configurable:true | false,
    enumerable:true | false,
    value:任意类型的值,
    writable:true | false
});
//对象新添加的属性的特性描述
Object.defineProperty(obj,"newKey",{
    configurable:true | false,
    enumerable:true | false,
    value:任意类型的值,
    writable:true | false
});
```

> 数据描述中的属性都是可选的，来看一下设置每一个属性的作用

#### 2.2.1 value

> 属性对应的值,可以使任意类型的值，默认为`undefined`

```js
var obj = {}
//第一种情况：不设置value属性
Object.defineProperty(obj,"newKey",{

});
console.log( obj.newKey );  //undefined
------------------------------
//第二种情况：设置value属性
Object.defineProperty(obj,"newKey",{
    value:"hello"
});
console.log( obj.newKey );  //hello
```

#### 2.2.2 writable

> 属性的值是否可以被重写。设置为`true`可以被重写；设置为`false`，不能被重写。默认为`false`

```js
var obj = {}
//第一种情况：writable设置为false，不能重写。
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:false
});
//更改newKey的值
obj.newKey = "change value";
console.log( obj.newKey );  //hello

//第二种情况：writable设置为true，可以重写
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:true
});
//更改newKey的值
obj.newKey = "change value";
console.log( obj.newKey );  //change value
```

#### 2.2.3 enumerable

> 此属性是否可以被枚举（使用`for...in`或`Object.keys()`）。设置为`true`可以被枚举；设置为`false`，不能被枚举。默认为`false`

```js
var obj = {}
//第一种情况：enumerable设置为false，不能被枚举。
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:false,
    enumerable:false
});

//枚举对象的属性
for( var attr in obj ){
    console.log( attr );  
}
//第二种情况：enumerable设置为true，可以被枚举。
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:false,
    enumerable:true
});

//枚举对象的属性
for( var attr in obj ){
    console.log( attr );  //newKey
}
```

#### 2.2.4 configurable

> 是否可以删除目标属性或是否可以再次修改属性的特性（`writable`, `configurable`, `enumerable`）。设置为`true`可以被删除或可以重新设置特性；设置为`false`，不能被可以被删除或不可以重新设置特性。默认为`false`

**这个属性起到两个作用**

- 目标属性是否可以使用`delete`删除
- 目标属性是否可以再次设置特性

```js
//-----------------测试目标属性是否能被删除------------------------
var obj = {}
//第一种情况：configurable设置为false，不能被删除。
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:false,
    enumerable:false,
    configurable:false
});
//删除属性
delete obj.newKey;
console.log( obj.newKey ); //hello

//第二种情况：configurable设置为true，可以被删除。
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:false,
    enumerable:false,
    configurable:true
});
//删除属性
delete obj.newKey;
console.log( obj.newKey ); //undefined
```

```js
//-----------------测试是否可以再次修改特性------------------------
var obj = {}
//第一种情况：configurable设置为false，不能再次修改特性。
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:false,
    enumerable:false,
    configurable:false
});

//重新修改特性
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:true,
    enumerable:true,
    configurable:true
});
console.log( obj.newKey ); //报错：Uncaught TypeError: Cannot redefine property: newKey

//第二种情况：configurable设置为true，可以再次修改特性。
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:false,
    enumerable:false,
    configurable:true
});

//重新修改特性
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:true,
    enumerable:true,
    configurable:true
});
console.log( obj.newKey ); //hello
```

> 除了可以给新定义的属性设置特性，也可以给已有的属性设置特性

```js
//定义对象的时候添加的属性，是可删除、可重写、可枚举的。
var obj = {
    test:"hello"
}

//改写值
obj.test = 'change value';

console.log( obj.test ); //'change value'

Object.defineProperty(obj,"test",{
    writable:false
})


//再次改写值
obj.test = 'change value again';

console.log( obj.test ); //依然是：'change value'
```

> 提示：一旦使用`Object.defineProperty`给对象添加属性，那么如果不设置属性的特性，那么`configurable`、`enumerable`、`writable`这些值都为默认的`false`

```js
var obj = {};
//定义的新属性后，这个属性的特性中configurable，enumerable，writable都为默认的值false
//这就导致了neykey这个是不能重写、不能枚举、不能再次设置特性
//
Object.defineProperty(obj,'newKey',{

});

//设置值
obj.newKey = 'hello';
console.log(obj.newKey);  //undefined

//枚举
for( var attr in obj ){
    console.log(attr);
}
```

**设置的特性总结**

- `value`: 设置属性的值
- `writable`: 值是否可以重写。`true` | `false`
- `enumerable`: 目标属性是否可以被枚举。`true` | `false`
- `configurable`: 目标属性是否可以被删除或是否可以再次修改特性 `true` | `false`

### 2.3 存取器描述

#### 2.3.1 定义

> 当使用存取器描述属性的特性的时候，允许设置以下特性属性

```js
var obj = {};
Object.defineProperty(obj,"newKey",{
    get:function (){} | undefined,
    set:function (value){} | undefined
    configurable: true | false
    enumerable: true | false
});
```

> 注意：当使用了`getter`或`setter`方法，不允许使用`writable`和`value`这两个属性

#### 2.3.2 getter/setter

> 当设置或获取对象的某个属性的值的时候，可以提供`getter/setter`方法。

- `getter` 是一种获得属性值的方法
- `setter`是一种设置属性值的方法

> 在特性中使用`get/set`属性来定义对应的方法

```js
var obj = {};
var initValue = 'hello';
Object.defineProperty(obj,"newKey",{
    get:function (){
        //当获取值的时候触发的函数
        return initValue;    
    },
    set:function (value){
        //当设置值的时候触发的函数,设置的新值通过参数value拿到
        initValue = value;
    }
});
//获取值
console.log( obj.newKey );  //hello

//设置值
obj.newKey = 'change value';

console.log( obj.newKey ); //change value
```

> 注意：get或set不是必须成对出现，任写其一就可以。如果不设置方法，则`get`和`set`的默认值为`undefined`




