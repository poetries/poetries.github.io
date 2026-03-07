---
title: JavaScript数组、字符串、对象常用方法
date: 2018-02-23 15:10:12
tags: 
  - JavaScript
  - API
categories: Front-End
---

## 一、String对象

### 1.1 slice

- `stringObject.slice(start, end)`

```javascript
var a = 'Hello world!';
var b = a.slice(2);
var c = a.slice(-4, -2);
// a: 'Hello world!'
// b: 'llo world!'
// c: 'rl'，参数可为负
```

### 1.2 substr

- `stringObject.substr(start, length)`

```javascript
var a = 'Hello world!';
var b = a.substr(0, 4);
var c = a.substr(-5, 2);
// a: 'Hello world!'
// b: 'Hell'
// c: 'or'，参数可为负
```

### 1.3 substring

- `stringObject.substring(start, stop)`

```javascript
var a = 'Hello world!';
var b = a.substring(0, 4);
var c = a.substring(3, 2);
var d = a.substring(0, -1);
// a: 'Hello world!'
// b: 'Hell'
// c: 'l'，start比stop小，交换这两个参数
// d: ''，参数为负，返回空字符串
```

> `slice`、`substr`、`substring`都是字符串的切割方法，三者之间有细微的区别，根据不同的使用场景可以灵活使用。三种方法都是生成新的字符串，而不是修改原`string`

## 二、Array对象

### 2.1 concat

- 参数可以为具体的值，也可以为数组对象，可以任意多个。不改变现有的数组，返回被连接数组的一个副本。

```javascript
var a = [1, 2, 3];
var b = a.concat(4, 5);
var c = a.concat([4, 5]);
// a: [1, 2, 3]
// b: [1, 2, 3, 4, 5]
// c: [1, 2, 3, 4, 5]
```

### 2.2 pop

- 删除 `arrayObject` 的最后一个元素，把数组长度减 `1`，并且返回它删除的元素的值。如果数组已经为空，则 pop() 不改变数组，并返回 `undefined` 值。该方法会改变原数组

```javascript
var a = [1, 2, 3];
var b = a.pop();
// a: [1, 2]，修改了原数组
// b: 3，返回删除元素的值
```

### 2.3 push

- 参数顺序添加到 `arrayObject` 的尾部，直接修改`arrayObject`

```javascript
var a = [1, 2, 3];
var b = a.push(4, 5);
// a: [1, 2, 3, 4, 5]，修改了原数组
// b: 5，返回修改后的数组的长度
```

### 2.4 shift

- 把数组的第一个元素从其中删除，并返回第一个元素的值。如果数组是空的，那么 `shift()` 方法将不进行任何操作，返回`undefined`值。该方法会改变原数组。类比`pop`方法

```javascript
var a = [1, 2, 3];
var b = a.shift();
// a: [2, 3]，修改了原数组
// b: 1，返回删除元素的值
```

### 2.5 unshift

- 向数组的开头添加一个或更多元素，并返回新的长度。该方法的第一个参数将成为数组的新元素 `0`，如果还有第二个参数，它将成为新的元素 `1`，以此类推

```javascript
var a = [1, 2, 3];
var b = a.unshift(4, 5);
// a: [ 4, 5, 1, 2, 3 ]，修改了原数组
// b: 5，返回修改后的数组的长度
```

### 2.6 slice

- 返回一个新的数组，包含从 `start` 到 `end` （不包括该元素）的 `arrayObject` 中的元素。该方法不会修改原数组

```javascript
var a = [1, 2, 3, 4, 5];
var b = a.slice(2);
// a: [1, 2, 3, 4, 5]，不修改原数组
// b: [3, 4, 5]，返回新数组

var c = [1, 2, 3, 4, 5];
var d = c.slice(2, -1);
// c: [1, 2, 3, 4, 5]，不修改原数组
// d: [3, 4]，返回新数组
```

### 2.7 splice

- 可删除从 `index` 处开始的零个或多个元素，并且用参数列表中声明的一个或多个值来替换那些被删除的元素。如果从 `arrayObject` 中删除了元素，则返回的是含有被删除的元素的数组。

```javascript
var a = [1, 2, 3, 4, 5];
var b = a.splice(1, 1);
// a: [1, 3, 4, 5]，修改了原数组
// b: [2]，返回新数组

var c = [1, 2, 3, 4, 5];
var d = c.splice(-1, 1);
// c: [1, 2, 3, 4]，修改了原数组
// d: [5]，返回新数组

var e = [1, 2, 3, 4, 5];
var f = e.splice(1, 1, 6, 7);
// e: [ 1, 6, 7, 3, 4, 5 ]，修改了原数组
// f: [2]，返回新数组

var g = [1, 2, 3, 4, 5];
var h = g.splice(1, 0, 8);
// g: [ 1, 8, 2, 3, 4, 5 ]，修改了原数组
// h: []，没有删除值，返回空数组
```

### 2.8 sort

- 无参数时，将按字母顺序对数组中的元素进行排序。参数为比较函数时，如果要交换`prev`和`next`的值，返回大于`0`的值

```javascript
var a = [1, 10, 8, 6, 9];
var b = a.sort(function (prev, next) {
  return prev - next;
});
// a: [1, 6, 8, 9, 10]，修改了原数组
// b: [1, 6, 8, 9, 10]，返回修改后的数组
```

### 2.9 reverse

- 用于颠倒数组中元素的顺序。会改变原数组

```javascript
var a = [1, 2, 3];
var b = a.reverse();
// a: [3, 2, 1]，修改了原数组
// b: [3, 2, 1]，返回修改后的数组
```

### 2.10 map

> 有返回值，返回一个新的数组，每个元素为调用`func`的结果


```javascript
let list = [1, 2, 3, 4, 5];
let other = list.map((d, i) => {
    return d * 2;
});
console.log(other);
// print: [2, 4, 6, 8, 10]
```

### 2.11 forEach

- 数组的每个元素执行一次提供的函数。一般来说不修改原数组，但也可以通过处理函数修改原数组。该方法很灵活，可类比`for...of`
- 没有返回值，只针对每个元素调用`func`。
- 优点：代码简介。
- 缺点：无法使用`break`，`return`等终止循环

> - `value` 当前操作的数组元素
> - 当前操作元素的数组索引
> - `array` 当前数组的引用


```javascript
let list = [1, 2, 3, 4, 5];
list.forEach((d, i) => {
    this.push(d * 2);
});
console.log(other);
// print: [2, 4, 6, 8, 10]
```

### 2.12 find

- 返回数组中**第一个满足测试条件**（返回`true`）的元素。如果不存在这样的元素，返回`undefined`。`findIndex`类似，只不过返回的是第一个满足测试条件的元素的`index`

```javascript
var a = [1, 2, 3];
var b = a.find((curVal) => curVal === 1);
var c = a.find((curVal) => curVal === 4);
// a: [1, 2, 3]，不修改原数组
// b: 1
// c: undefined
```

### 2.13 filter

- 返回数组中**所有满足测试条件**（返回`true`）的元素组成的数组。如果不存在这样的元素，返回`[]`

```javascript
var a = [1, 2, 3];
var b = a.filter((curVal) => curVal > 1);
var c = a.filter((curVal) => curVal > 3);
// a: [1, 2, 3]，不修改原数组
// b: [2, 3]
// c: []
```

### 2.14 reduce和reduceRight


> `.reduce`从左到右而`.reduceRight`从右到左循环遍历数组，每次调用接收目前为止的部分结果和当前遍历的值

- 两种方法都有如下典型用法：`.reduce(callback(previousValue, currentValue, index, array), initialValue)`。
- `previousValue`是最后被调用的回调函数的返回值，`initialValue`是开始时`previousValue`被初始化的值。`currentValue`
- 是当前被遍历的元素值，`index`是当前元素在数组中的索引值。`array`是对调用`.reduce`数组的简单引用

```javascript
Array.prototype.sum = function () {
    return this.reduce(function (partial, value) {
        return partial + value
    }, 0)
};

[3,4,5,6,10].sum()
// <- 28
```

> 可以使用`.reduce`作为对象的字符串生成器

```javascript
function concat (input) {
    return input.reduce(function (partial, value) {
        if (partial) {
            partial += ', '
        }
        return partial + value
    }, '')
}

concat([
    { name: 'George' },
    { name: 'Sam' },
    { name: 'Pear' }
])
// <- 'George, Sam, Pear'
```

### 2.15 some


> 返回一个`boolean`，判断是否有元素符合`func`条件，如果有一个元素符合`func`条件，则循环会终止

```javascript
let list = [1, 2, 3, 4, 5];
list.some((d, i) => {
    console.log(d, i);
    return d > 3;
});
// print: 1,0 2,1 3,2 4,3
// return false
```



### 2.16 every

> 返回一个`boolean`，判断每个元素是否符合`func`条件，有一个元素不满足`func`条件，则循环终止，返回`false`

```javascript
let list = [1, 2, 3, 4, 5];
list.every((d, i) => {
    console.log(d, i);
    return d < 3;
});
// print: 1,0 2,1 3,2
// return false
```

## 三、Object

### 3.1 for in


> `for-in`循环实际是为循环”enumerable“对象而设计的，`for in`也可以循环数组，但是不推荐这样使用，`for–in`是用来循环带有字符串`key`的对象的方法

```javascript
var obj = {a:1, b:2, c:3};
for (var prop in obj) {
  console.log("obj." + prop + " = " + obj[prop]);
}
// print:  "obj.a = 1" "obj.b = 2" "obj.c = 3"
```

### 3.2 for of


> `for of`为`ES6`提供，具有`iterator`接口，就可以用`for of`循环遍历它的成员

- `for of`循环可以使用的范围包括数组、`Set`和`Map`结构、某些类似数组的对象（比如`arguments`对象、`DOM NodeList`对象）、后文的`Generator`对象，以及字符串

#### 3.2.1 entries

> `entries()` 返回一个遍历器对象，用来遍历[键名, 键值]组成的数组。对于数组，键名就是索引值；对于`Set`，键名与键值相同。`Map`结构的`iterator`接口，默认就是调用`entries`方法

#### 3.2.2 keys

- `keys()` 返回一个遍历器对象，用来遍历所有的键名。


#### 3.2.3 values

- `values() `返回一个遍历器对象，用来遍历所有的键值。 

> 这三个方法调用后生成的遍历器对象，所遍历的都是计算生成的数据结构

```javascript
// 遍历数组
let list = [1, 2, 3, 4, 5];
for (let e of list) {
    console.log(e);
}
// print: 1 2 3 4 5

// 遍历对象
obj = {a:1, b:2, c:3};
for (let key of Object.keys(obj)) {
  console.log(key, obj[key]);
}
// print:  a 1 b 2 c 3
//说明：对于普通的对象，for...in循环可以遍历键名，for...of循环会报错。
//一种解决方法是，使用Object.keys方法将对象的键名生成一个数组，然后遍历这个数组。

// entries
let arr = ['a', 'b', 'c'];
for (let pair of arr.entries()) {
  console.log(pair);
}
// [0, 'a']
// [1, 'b']
// [2, 'c']
```
