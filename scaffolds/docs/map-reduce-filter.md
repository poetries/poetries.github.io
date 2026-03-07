---
title: 高阶函数map reduce filter
date: 2017-09-17 17:33:00
tags: 
  - JavaScript
  - 高阶函数
categories: Front-End
---

> 整理于互联网

## map
---

- 由于`map()`方法定义在`JavaScript`的`Array`中，我们调用`Array`的`map()`方法，传入我们自己的函数，就得到了一个新的`Array`作为结果

```javascript
function pow(x) {
    return x * x;
}

var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
arr.map(pow); // [1, 4, 9, 16, 25, 36, 49, 64, 81]
```
- `map()`传入的参数是`pow`，即函数对象本身
- `map()`作为高阶函数，事实上它把运算规则抽象了，因此，我们不但可以计算简单的`f(x)=x2`，还可以计算任意复杂的函数，比如，把`Array`的所有数字转为字符串

```javascript
var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
arr.map(String); // ['1', '2', '3', '4', '5', '6', '7', '8', '9']
```

## reduce
---

> 再看`reduce`的用法。`Array`的`reduce()`把一个函数作用在这个`Array`的`[x1, x2, x3...]`上，这个函数必须接收两个参数，`reduce()`把结果继续和序列的下一个元素做累积计算，其效果就是：


```javascript
[x1, x2, x3, x4].reduce(f) = f(f(f(x1, x2), x3), x4)
```


- 比方说对一个`Array`求和，就可以用`reduce`实现

```javascript
var arr = [1, 3, 5, 7, 9];
arr.reduce(function (x, y) {
    return x + y;
}); // 25
```


- 要把`[1, 3, 5, 7, 9]`变换成整数`13579`，`reduce()`也能派上用场


```javascript
var arr = [1, 3, 5, 7, 9];
arr.reduce(function (x, y) {
    return x * 10 + y;
}); // 13579
```

## filter
---

- `filter`也是一个常用的操作，它用于把`Array`的某些元素过滤掉，然后返回剩下的元素

> 和`map()`类似，`Array`的`filter()`也接收一个函数。和`map()`不同的是，`filter()`把传入的函数依次作用于每个元素，然后根据返回值是`true`还是`false`决定保留还是丢弃该元素

- 例如，在一个`Array`中，删掉偶数，只保留奇数，可以这么写：

```javascript
var arr = [1, 2, 4, 5, 6, 9, 10, 15];
var r = arr.filter(function (x) {
    return x % 2 !== 0;
});
r; // [1, 5, 9, 15]
```

- 把一个`Array`中的空字符串删掉，可以这么写：

```javascript
var arr = ['A', '', 'B', null, undefined, 'C', '  '];
var r = arr.filter(function (s) {
    return s && s.trim(); // 注意：IE9以下的版本没有trim()方法
});
r; // ['A', 'B', 'C']
```

- 可见用`filter()`这个高阶函数，关键在于正确实现一个“筛选”函数


**回调函数**


> `filter()`接收的回调函数，其实可以有多个参数。通常我们仅使用第一个参数，表示`Array`的某个元素。回调函数还可以接收另外两个参数，表示元素的位置和数组本身：


```javascript
var arr = ['A', 'B', 'C'];
var r = arr.filter(function (element, index, self) {
    console.log(element); // 依次打印'A', 'B', 'C'
    console.log(index); // 依次打印0, 1, 2
    console.log(self); // self就是变量arr
    return true;
});
```

 - 利用`filter`，可以巧妙地去除`Array`的重复元素

```javascript
var r;
var arr = ['apple', 'strawberry', 'banana', 'pear', 'apple', 'orange', 'orange', 'strawberry'];
r = arr.filter(function (element, index, self) {
    return self.indexOf(element) === index;
});
```

- 去除重复元素依靠的是`indexOf`总是返回第一个元素的位置，后续的重复元素位置与`indexOf`返回的位置不相等，因此被`filter`滤掉了

- 用`filter()`筛选出素数

```javascript
arr.filter(function t(element,index,self){
    for(var i=2;i<element;i++){
        if(element%i === 0)
            break;
    }
    if(element === i)
        return true;
    else return false;
});
```

## sort
---

> 排序也是在程序中经常用到的算法。无论使用冒泡排序还是快速排序，排序的核心是比较两个元素的大小。如果是数字，我们可以直接比较，但如果是字符串或者两个对象呢？直接比较数学上的大小是没有意义的，因此，比较的过程必须通过函数抽象出来。通常规定，对于两个元素x和y，如果认为x < y，则返回-1，如果认为x == y，则返回0，如果认为x > y，则返回1，这样，排序算法就不用关心具体的比较过程，而是根据比较结果直接排序


- `JavaScript`的`Array`的`sort()`方法就是用于排序的，但是排序结果可能让你大吃一惊：

```javascript
// 看上去正常的结果:
['Google', 'Apple', 'Microsoft'].sort(); // ['Apple', 'Google', 'Microsoft'];

// apple排在了最后:
['Google', 'apple', 'Microsoft'].sort(); // ['Google', 'Microsoft", 'apple']

// 无法理解的结果:
[10, 20, 1, 2].sort(); // [1, 10, 2, 20]
```



- `Array`的`sort()`方法默认把所有元素先转换为`String`再排序，结果`'10'`排在了`'2'`的前面，因为字符`'1'`比字符`'2'`的`ASCII`码小
- 如果不知道`sort()`方法的默认排序规则，直接对数字排序，绝对栽进坑里！
- 幸运的是，`sort()`方法也是一个高阶函数，它还可以接收一个比较函数来实现自定义的排序
- 要按数字大小排序，我们可以这么写

```javascript
var arr = [10, 20, 1, 2];
arr.sort(function (x, y) {
    if (x < y) {
        return -1;
    }
    if (x > y) {
        return 1;
    }
    return 0;
}); // [1, 2, 10, 20]
```

- 如果要倒序排序，我们可以把大的数放前面：

```javascript
var arr = [10, 20, 1, 2];
arr.sort(function (x, y) {
    if (x < y) {
        return 1;
    }
    if (x > y) {
        return -1;
    }
    return 0;
}); // [20, 10, 2, 1]
```

- 默认情况下，对字符串排序，是按照`ASCII`的大小比较的，现在，我们提出排序应该忽略大小写，按照字母序排序。要实现这个算法，不必对现有代码大加改动，只要我们能定义出忽略大小写的比较算法就可以：

```javascript
var arr = ['Google', 'apple', 'Microsoft'];
arr.sort(function (s1, s2) {
    x1 = s1.toUpperCase();
    x2 = s2.toUpperCase();
    if (x1 < x2) {
        return -1;
    }
    if (x1 > x2) {
        return 1;
    }
    return 0;
}); // ['apple', 'Google', 'Microsoft']
```

- 忽略大小写来比较两个字符串，实际上就是先把字符串都变成大写（或者都变成小写），再比较

**最后友情提示，`sort()`方法会直接对`Array`进行修改，它返回的结果仍是当前`Array`**

```javascript
var a1 = ['B', 'A', 'C'];
var a2 = a1.sort();
a1; // ['A', 'B', 'C']
a2; // ['A', 'B', 'C']
a1 === a2; // true, a1和a2是同一对象
```
