---
title: Javascript数组详解
date: 2016-12-13 14:55:24
tags: 
   - JavaScript
   - 数组
categories: Front-End
---

#### 数组的定义
---

- 数组是按序号排列的一组值，每个值的位置都有编号（从`0`开始）。数组本质上是一种特殊的对象。它的键名是按（`0，1，2...`）排列的一组数字
<!--more-->

##### 创建数组：
---

```javascript
var arr = new Array(values);
var arr = [vaules];
```

##### 判断比是否是个数组
---

- `Array.isArray(arr)`

- `arr instanceof Array`


##### 增加数组元素
---

- `push()`方法 在数组的末尾增加一个或多个元素，并返回数组的新长度。
- `unshift()`方法 在数组的开头增加一个或多个元素，并返回数组的新长度。
- `length` 属性

```javascript
var arr = [1, 2, 3]
arr.push(4)
arr  // 1, 2, 3, 4
arr.unshift(6)
arr  // 6, 1, 2, 3, 4
arr[arr.length] = 7  // 与push()方法类似
arr  // 6, 1, 2, 3, 4, 7
```

##### 删除数组中的元素
---

- `delete` 运算符，可以删除数组中的某个元素，但这不会改变`length`属性的值.
- `pop()` 方法 删除数组的最后一个元素，并返回这个元素
- `shift()` 方法 删除数组的第一个元素，并返回这个元素

```javascript
var arr = [1,2,3];
delete arr[0];
arr   // [undefined,2,3]
arr.length  // 3
var last = arr.pop()
var first = arr.shift()
last // 3
first // undefined
arr //2
```

#### 类数组对象
---

- 在`js`中，有些对象被叫做“类数组对象`”（array-like object）`，因为这些对象看起来很像数组，可以使用`length`属性，但是无法使用数组的方法。 
- 典型的类数组对象是函数的`arguments`对象，以及大多数`DOM`元素集，还有字符串

```javascript
// arguments对象
function args() {return arguments; }
var arraylike = args('a','b')
arrayLike[0]  // 'a'
arrayLike.length // 2
arrayLike instanceof Array // false
Array.isArray(arrayLike)  // false

// DOM元素集
var elts = document.getElementsByTagName('p');
elts.length  // 3
eles instanceof Array  // false

//字符串
'abc'[1]  // 'b'
'abc'.length  // 3
'abc' instanceof Array  // false
```

#### 数组的遍历
---


##### for...in 循环
---

```javascript
var a =[1, 2, 3];
a.other = 'other';
for (var i in arr){
    console.log( arr[i]);
}
// 1, 2, 3, other
```

- 从上面的输出结果可以看出，利用`for..in`循环会将动态添加的非数字键的值遍历出来，因此需要使用的时候需要注意

##### for 循环和 while 循环
---

```javascript
var a = [1, 2, 3];

// for循环
for(var i = 0; i < a.length; i++) {
  console.log(a[i]);
}

// while循环
var i = 0;
while (i < a.length) {
  console.log(a[i]);
  i++;
}

var l = a.length;
while (l--) {
  console.log(a[l]);
}
```

##### forEach()方法
---

```javascript
//array.forEach(callback[, thisArg])
//callback 在数组的每一项上执行的函数，接受三个参数：item: 数组当前项的值，index: 当前项的索引，arr:数组本身。
var arr = [1, 2, 3]
arr.forEach(function(item, index, arr){
    console.log(item, index);
});
//1 0
//2 1
//3 2
```

#### 数组常用的方法
---

![](https://segmentfault.com/img/bVzkqq)

##### join() 将数值转换为字符串
---

```javascript
var arr = [1, 2, 3];
arr.join(); // "1,2,3"
arr.join("_"); // "1_2_3"
```

##### reverse() 将数组逆序
---

```javascript
// 原数组会被修改
var arr = [1, 2, 3];
arr.reverse(); // [3, 2, 1]
arr; // [3, 2, 1]
```

##### sort() 数组排序
---

- 默认情况下是升序排列的，底层是调用了每个数组项的 `toString()` 方法，然后比较得到字符串，即使每个数组项的数值是数字，比较的也是字符串

```javascript
// 原数组会被修改
var arr = [1, 12, 213, 1432, 'a'];
arr.sort(); // [1, 12, 1432, 213, "a"]
arr.sort(function(a, b){
    return b-a; //按倒序排列数组
});
```

##### slice() 返回部分数组
---

- `slice`用于复制数组，复制完后旧数组不变，返回得到的新数组是旧数组的子集
- 第一个参数begin是开始复制的位置，需要注意的是，可以设负数。设负数表示从尾往前数几个位置开始复制

```javascript
//原数组不会被修改
var arr = [1, 2, 3, 4, 5];
arr.slice(); //[1, 2, 3, 4, 5]
arr.slice(1,3); // [2, 3]
arr.slice(1, -1); // [2, 3, 4]
arr; // [1, 2, 3, 4, 5]
```

##### splice() 数组拼接
---

```javascript
//原数组会被修改
var arr = [1, 2, 3, 4, 5];
//从第三个数组元素删除
arr.splice(2); // returns [3, 4, 5] 
arr; // [1, 2]
//从第三个数组元素删除，删除两个元素
arr.splice(2, 2) // returns [3, 4]
arr; // [1, 2, 5]
//将'a','b'替换到数组的第二个元素
arr.splice(1, 1, 'a', 'b')
```

##### isArray() 判断是否是数组
---

```javascript
var arr = [];
var a = "not array";
Array.isArray(arr); // true
Array.isArray(a); // false
```

##### indexOf() lastIndexOf() 数组检索 
---

- 两者都用于返回项目的索引值。区别是`indexOf`从头开始找，`lastIndexOf`从尾开始找。如果查找失败，无匹配，返回`-1`

```javascript
var arr = ['a', 'b', 'c', 'd', 'e'];
arr.indexOf('c');  // 2 找到返回数组下标
arr.indexOf('c', 3); // -1 指定从3号位开始查找
arr.indexOf('f'); // -1 没找到该元素
arr.lastIndexOf('c'); // 2
arr.lastIndexOf('c',2); // 2
arr.lastIndexOf('f'); // -1 没找到该元素
```


