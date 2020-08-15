---
title: JavaScript深浅拷贝
date: 2018-12-21 18:08:43
tags: 
  - JavaScript
  - 深浅拷贝
categories: Front-End
---


## 一、前言

> 在`js`中，变量的类型可以大致分成两种：基本数据类型和引用数据类型，其中基本数据类型指的是简单的数据段，包括：

- `undefined`
- `Null`
- `Boolean`
- `Number`
- `String`(字符串在一些其他语言中是被当做对象使用的，属于引用类型，但在`js`里是基本类型)

> 而引用类型的值指的是可能包含多个值的对象。本质上，是因为基本数据类型保存在栈内存,而引用类型保存在堆内存中。为什么要分两种保存方式呢？ 根本原因在于保存在栈内存的必须是大小固定的数据，引用类型的大小不固定，只能保存在堆内存中，但是我们可以把它的地址写在占内存中以供我们访问

```js
var a = 1;//定义了一个number类型
var obj1 = {//定义了一个objr类型
    name:'obj'
};
```

> 在执行这段代码后，内存空间里是这样的

![](https://poetries1.gitee.io/img-repo/2019/10/314.png)

> 因为这种保存方式的存在，所以我们在操作变量的时候，如果是基本数据类型，则按值访问，操作的就是变量保存的值；如果是引用类型的值，我们只是通过保存在变量中的引用类型的地址类操作实际对象。从而也引出了所谓的深浅复制问题



## 二、浅拷贝

**方法一**

```js
// 假设有两个对象

var objA = {
  a: 'aa',
  b: 'bb'
};
var objB = {};
```

```js
// 现在想把对象A的值复制给B，由于对象A的两个值都是原始类型，用浅复制即可

function copy(sub, sup) {
  for (var key in sup) {
    sub[key] = sup[key];
  }
}
copy(objB, objA);
```

**方法二**

```
Object.assign() (兼容性不好)
```

**方法三**

```
_.clone()
```

**方法四**

> 数组中`concat`和`slice`方法

**方法五**

> ES6展开运算

```js
var arr = [{name:'poetries',age:22}]

var target = [...arr]
```

## 三、深拷贝

> 简单来说深复制就是当遇到值是对象类型的时候就再运行一遍复制

**方法一 JSON.parse(JSON.stringify(obj))**

> 简单粗暴又有点`dirty`，但是能满足日常需求，只能处理`json`能理解的数据格式，当然不包括函数了，性能也没有特别好


**方法二 lodash —— _.cloneDeep()**

> 很好地兼容了ES6的新引用类型，而且处理了环型对象的情况

**方法三 jQuery —— $.clone() / $.extend()**

> 源码适合初学者学习，比较好理解

**方法四 自己实现一个**

```js
function deepCopy (obj) {
    var result;

    //引用类型分数组和对象分别递归
    if (Object.prototype.toString.call(obj) == '[object Array]') {
      result = []
      for (i = 0; i < obj.length; i++) {
        result[i] = deepCopy(obj[i])
      }
    } else if (Object.prototype.toString.call(obj) == '[object Object]') {
      result = {}
      for (var attr in obj) {
        result[attr] = deepCopy(obj[attr])
      }
    }
    //值类型直接返回
    else {
      return obj
    }
    return result
}
```

