---
title: JavaScript原生数组及高阶函数
date: 2017-11-07 18:55:24
tags: 
   - JavaScript
   - 高阶函数
categories: Front-End
---

一、map
---

> `map()` 方法创建一个新数组，其结果是该数组中的每个元素都调用一个提供的函数后返回的结果

- `callback` 函数会被自动传入三个参数：数组元素，元素索引，原数组本身

```javascript
let list = [1, 2, 3, 4, 5];
let other = list.map((d, i) => {
    return d * 2;
});
console.log(other);
// print: [2, 4, 6, 8, 10]
```


二、filter
---

**语法**

```javascript
var new_array = arr.filter(callback[, thisArg])
```

> `filter()` 方法创建一个新数组, 其包含通过所提供函数实现的测试的所有元素


**参数**

- `callback` 返回`true`表示保留该元素（通过测试），`false`则不保留
  - 用来测试数组的每个元素的函数。调用时使用参数 `(element, index, array)`。
  - 返回true表示保留该元素（通过测试），`false`则不保留

```javascript
function isBigEnough(value) {
  return value >= 10;
}

var filtered = [12, 5, 8, 130, 44].filter(isBigEnough);

// filtered is [12, 130, 44]
```

三、some
---

> 返回一个`boolean`，判断是否有元素符合`func`条件，如果有一个元素符合`func`条件，则循环会终止
- `some() `方法测试数组中的某些元素是否通过由提供的函数实现的测试

```javascript
const isBiggerThan10 = (element, index, array) => {
  return element > 10;
}

[2, 5, 8, 1, 4].some(isBiggerThan10);  
// false

[12, 5, 8, 1, 4].some(isBiggerThan10); 
// true
```

四、every
---

> 返回一个`boolean`，判断每个元素是否符合`func`条件，有一个元素不满足`func`条件，则循环终止，返回`false`

- `every` 方法为数组中的每个元素执行一次 `callback` 函数，直到它找到一个使 `callback` 返回 `false`（表示可转换为布尔值 `false` 的值）的元素。如果发现了一个这样的元素，`every` 方法将会立即返回 `false`。否则，`callback` 为每一个元素返回 `true`，`every` 就会返回 `true`

```javascript
function isBigEnough(element, index, array) {
  return (element >= 10);
}
var passed = [12, 5, 8, 130, 44].every(isBigEnough);
// passed is false
passed = [12, 54, 18, 130, 44].every(isBigEnough);
// passed is true
```

五、reduce和reduceRight
---

> `.reduce`从左到右而`.reduceRight`从右到左循环遍历数组，每次调用接收目前为止的部分结果和当前遍历的值

- `reduce()` 方法对累加器和数组中的每个元素（从左到右）应用一个函数，将其减少为单个值

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



六、sort
---

> `Array.prototype.sort(fn(a,b))`需要一个包含两个测试参数的回调函数，并且要产生一下三种返回值之一

- 如果`a`在`b`前，则返回值小于零
- 如果`a`和`b是等价的，则返回值等于零
- 如果`a`在`b`后，则返回值大于零

```javascript
[9,80,3,10,5,6].sort()
// <- [10, 3, 5, 6, 80, 9]

[9,80,3,10,5,6].sort(function (a, b) {
    return a - b
})
// <- [3, 5, 6, 9, 10, 80]
```




七、forEach
---

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

八、for in
---

> `for-in`循环实际是为循环”enumerable“对象而设计的，`for in`也可以循环数组，但是不推荐这样使用，`for–in`是用来循环带有字符串`key`的对象的方法

```javascript
var obj = {a:1, b:2, c:3};
for (var prop in obj) {
  console.log("obj." + prop + " = " + obj[prop]);
}
// print:  "obj.a = 1" "obj.b = 2" "obj.c = 3"
```

九、for of
---

> `for of`为`ES6`提供，具有`iterator`接口，就可以用`for of`循环遍历它的成员

- `for of`循环可以使用的范围包括数组、`Set`和`Map`结构、某些类似数组的对象（比如`arguments`对象、`DOM NodeList`对象）、后文的`Generator`对象，以及字符串

**entries**

> `entries()` 返回一个遍历器对象，用来遍历[键名, 键值]组成的数组。对于数组，键名就是索引值；对于`Set`，键名与键值相同。`Map`结构的`iterator`接口，默认就是调用`entries`方法

**keys**
- `keys()` 返回一个遍历器对象，用来遍历所有的键名。


**values**
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
