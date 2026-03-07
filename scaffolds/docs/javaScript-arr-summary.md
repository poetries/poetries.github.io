---
title: JavaScript数组方法总结篇
date: 2018-08-18 18:40:43
tags: JavaScript
categories: Front-End
---

### 一、数组预览图

![数组方法](https://upload-images.jianshu.io/upload_images/1480597-3067afe2cc23ff1f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

### 二、会改变原数组的方法

#### 2.1 push() 

- 方法在数组的尾部添加一个或多个元素，并返回数组的长度

> 参数: item1, item2, ..., itemX ,要添加到数组末尾的元素

```javascript
let arr = [1,2,3];

let length = arr.push('末尾1','末尾2'); // 返回数组长度

console.log(arr,length)

// [1, 2, 3, "末尾1", "末尾2"] 5
```

> 返回值： 数组的长度

#### 2.2  pop()

- 方法删除数组的最后一个元素，减小数组长度并返回它删除的值

```javascript
//组合使用push()和pop()能够用JavaScript数组实现先进后出的栈

let stack = [];

stack.push(1,2) // 返回长度2，这时stack的值是[1,2]

stack.pop() // 返回删除的值2，这时stack的值是[1]
```

> 返回值： 从数组中删除的元素(当数组为空时返回undefined)。

#### 2.3 unshift()

> 方法在数组的头部添加一个或多个元素，并将已存在的元素移动到更高索引的位置来获得足够的空间，最后返回数组新的长度

```javascript
let arr = [3,4,5];

let length = arr.unshift(1,2); // 返回长度是5

console.log(arr, length)

//[1, 2, 3, 4, 5] 5
```

> 返回值： 返回数组新的长度

#### 2.4  shift()

> 方法删除数组的第一个元素并将其返回，然后把所有随后的元素下移一个位置来填补数组头部的空缺，返回值是删除的元素

```javascript
let arr = [1,2,3];

let item = arr.shift(); // 返回删除的值1

console.log(arr, item)

// [2, 3] 1
```

> 返回值： 从数组中删除的元素; 如果数组为空则返回undefined

#### 2.5 splice() 

> 方法是在数组中插入或删除元素的通用方法

```javascript
// start不超过数组长度(以下操作是连续的)
let arr = [1,2,3,4,5];

arr.splice(2) // arr是[1,2]，返回值是[3,4,5]

arr.splice(1,1) // arr是[1]，返回值是[2]

arr.splice(0,3) // arr是[]，返回值是[1],因为此时数组从第0位开始不够3位，所以是删除从0开始到最后的所有元素。

// start大于数组长度(以下操作是连续的)

let arr = [1,2,3,4,5];

arr.splice(5) // arr是[1,2,3,4,5]，返回值是[]

arr.splice(5,3,6) // arr是[1,2,3,4,5,6]，返回值是[]


arr.splice(5,3,7) // arr是[1,2,3,4,5,7] 返回值是[6]


// start是负数(以下操作是连续的)

let arr = [1,2,3,4,5];

arr.splice(-3,2); // arr是[1,2,5], 返回值是[3,4]
arr.splice(-4); // arr是[],返回值是[1,2,5]

// 插入数组时，是插入数组本身，而不是数组元素

let arr = [1,4,5];

arr.splice(1,0,[2,3]) // arr是[1,[2,3],4,5]，返回值是[]
```

#### 2.6 sort()

> `sort()` 方法将数组中的元素排序并返回排序后的数组

```javascript
var stringArray = ["Blue", "Humpback", "Beluga"];
var numberArray = [40, 1, 5, 200];

function compareNumbers(a, b){
    return a - b;
}


console.log('stringArray:' + stringArray.join());

console.log('Sorted:' + stringArray.sort());

console.log('numberArray:' + numberArray.join());

// 没有使用比较函数时，数字并不会按照我们设想的那样排序

console.log('Sorted without a compare function:'+ numberArray.sort());

console.log('Sorted with compareNumbers:'+ numberArray.sort(compareNumbers));


//打印如下
// stringArray: Blue,Humpback,Beluga
// Sorted: Beluga,Blue,Humpback
// numberArray: 40,1,5,200
// Sorted without a compare function: 1,200,40,5
// Sorted with compareNumbers: 1,5,40,200
```

> 返回值： 返回排序后的数组。原数组已经被排序后的数组代替

#### 2.7  reverse() 

> 方法将数组中的元素颠倒顺序，返回逆序的数组

```javascript
let arr = [1,2,3];

arr.reverse() // arr是[3,2,1]，返回值是[3,2,1]
```

> 返回值： 返回顺序颠倒后的数组。原数组已经被排序后的数组代替

#### 2.8 fill() 

> 方法用一个固定值填充一个数组中从起始索引到终止索引内的全部元素

```
arr.fill(value[, start[, end]])
```

- `value` 用来填充数组元素的值。
- `start` (可选) 起始索引，默认值为0。
- `end` (可选) 终止索引，默认值为 this.length。
- 如果 start 是个负数, 则开始索引会被自动计算成为 `length+start`, 其中 length 是 this 对象的 `length `属性值. 如果 end 是个负数, 则结束索引会被自动计算成为 `length+end`

> 返回值： 修改后的数组

```javascript
[1, 2, 3].fill(4); // [4, 4, 4]

[1, 2, 3].fill(4, 1); // [1, 4, 4]

[1, 2, 3].fill(4, 1, 2); // [1, 4, 3]

[1, 2, 3].fill(4, 1, 1); // [1, 2, 3]

[1, 2, 3].fill(4, 3, 3); // [1, 2, 3]

[1, 2, 3].fill(4, -3, -2); // [4, 2, 3]

[1, 2, 3].fill(4, NaN, NaN); // [1, 2, 3]

[1, 2, 3].fill(4, 3, 5); // [1, 2, 3]

Array(3).fill(4); // [4, 4, 4]

//fill 方法故意被设计成通用方法, 该方法不要求 this 是数组对象。

[].fill.call({ length: 3 }, 4); // {0: 4, 1: 4, 2: 4, length: 3}
```

### 三、不改变原数组的方法

#### 3.1 slice() 

> 方法返回一个从开始到结束（不包括结束）选择的数组的一部分浅拷贝到一个新数组对象。且原始数组不会被修改

- 返回值： 一个含有提取元素的新数组

```javascript
let arr = [1,2,3,4,5];

let arr1 = arr.slice(1,3); // arr是[1,2,3,4,5]， arr1是[2,3]

let arr2 = arr.slice(-2,-1); // arr是[1,2,3,4,5], arr2是[4]

// 开始位置在结束位置后面，得到的数组是空

let arr3 = arr.slice(-2, -3); // arr是[1,2,3,4,5], arr3是[]

let arr4 = arr.slice(2, 1); // arr是[1,2,3,4,5], arr4是[]


//如果元素是个对象引用 （不是实际的对象），slice 会拷贝这个对象引用到新的数组里。两个对象引用都引用了同一个对象。如果被引用的对象发生改变，则新的和原来的数组中的这个元素也会发生改变。


let arr = [{name: 'xiaoming'}];

let arr1 = arr.slice(); // arr是[{name: xiaoming}]，arr1是[{name: 'xiaoming'}]

arr1[0].name = 'xiaogang'; // arr是[{name: 'xiaogang'}]，arr1是[{name: 'xiaogang'}]


// 对于字符串、数字及布尔值来说（不是 String、Number 或者 Boolean 对象），slice 会拷贝这些值到新的数组里。在别的数组里修改这些字符串或数字或是布尔值，将不会影响另一个数组。

let arr = [1,2,3];

let arr1 = arr.slice(); // arr是[1,2,3]，arr1是[1,2,3]

arr1[1] = "two"; // arr是[1,2,3]，arr1是[1,"tow",3]

// 当然，如果向两个数组任一中添加了新元素（简单或者引用类型），则另一个不会受到影响
```

#### 3.2  join() 

> 方法将数组（或一个类数组对象）中所有元素都转化为字符串并连接在一起，返回最后生成的字符串

- 返回值： 一个所有数组元素连接的字符串。如果 arr.length 为0，则返回空字符串

```javascript
let num = [1,2,3];

let str1 = num.join(); // 1,2,3

let str2 = num.join(', ') // 1, 2, 3

let str3 = num.join('') // 123

//所有的数组元素被转换成字符串，再用一个分隔符将这些字符串连接起来。如果元素是undefined 或者null， 则会转化成空字符串。

let num = [1,null,3];
let str1 = num.join(); // 1,,3

//如果数组中的元素是数组，会将里面的数组也调用join()
let num = [[1,2],3];

let str1 = num.join('-'); // 1,2-3

// 如果数组中的元素是对象，对象会被转为[object Object]字符串

let num = [{num: 1},2,3];

let str1 = num.join('-'); // [object Object]-2-3
```

```javascript
// 扁平化简单的二维数组
const arr = [11, [22, 33], [44, 55], 66];
const flatArr = arr.join().split(','); // ["11", "22", "33", "44", "55", "66"]
```

#### 3.3 toString() 

> 方法将数组的每个元素转化为字符串(如有必要将调用元素的`toString()`方法)并且输出用逗号分割的字符串列表。返回一个字符串表示数组中的元素

```javascript
[1,2,3].toString(); // 1,2,3

[1,[2,'c']].toString(); //1,2,c

// 以上与不使用任何参数调用join()方法返回的字符串是一样的。

// 以下的这个例子要跟下面的toLocaleString对照看

[{a:1},1,new Date()].toString() //"[object Object],1,Sat Jul 07 2018 18:43:45 GMT+0800 (中国标准时间)"
```

> 注意： 当数组和字符串操作的时候，js 会调用这个方法将数组自动转换成字符串

```
[1,2,3]+'abc' //1,2,3abc
```

> 返回值： 返回一个字符串表示数组中的元素

```javascript
// 扁平化简单的二维数组
const arr = [11, [22, 33], [44, 55], 66];

const flatArr = arr.toString().split(','); // ["11", "22", "33", "44", "55", "66"]
```

#### 3.4  toLocaleString() 

> 数组中的元素将使用各自的 toLocaleString 方法转成字符串，这些字符串将使用一个特定语言环境的字符串（例如一个逗号 ","）隔开

```javascript
//数组中的元素将会使用各自的 toLocaleString 方法：

// Object: Object.prototype.toLocaleString()

// Number: Number.prototype.toLocaleString()

// Date: Date.prototype.toLocaleString()

let prices = ['￥7', 500, 8123, 12];

// 不带参数

prices.toLocaleString(); // "￥7,500,8,123,12"

//带参数

prices.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' }); // "￥7,500,8,123,12"

//MDN上的举例中说是 "￥7,￥500,￥8,123,￥12"，在浏览器和Node中验证了返回的都是 "￥7,500,8,123,12" 啊！

// 以下的这个例子要跟上面的toString对照看

[{a:1},1,new Date()].toLocaleString() //"[object Object],1,2018/7/7 下午6:45:00"
```

> 返回值： 表示数组元素的字符串

#### 3.5  concat() 

> 它的元素包括调用concat()的原始数组的元素和concat()的每个参数，但是要注意，concat()不会递归扁平化数组的数组，concat()也不会修改调用的数组

```javascript
[1,2,3].concat([4,5,6],[7,8,9]) // [1, 2, 3, 4, 5, 6, 7, 8, 9]

['a','b','c'].concat(1,[2,3],[[4,5]]) // ["a", "b", "c", 1, 2, 3, [4,5]]


// concat方法不会改变this或任何作为参数提供的数组，而是返回一个浅拷贝,所以原始数组和新数组都引用相同的对象。 如果引用的对象被修改，新数组和原始数组都会变。


let obj = {a: 1};

let arr1 = [2,obj];

let arr2 = [1].concat(arr1);

console.log(arr1,arr2) //[2,{a:1}],[1,2,{a:1}]

//记录下上面的打印结果之后修改obj

obj.a = 2;
console.log(arr1,arr2) ////[2,{a:2}],[1,2,{a:2}]


// 说了是浅拷贝，而且原数组也不改变，那我们就可以用它来实现数组的浅拷贝功能

let num1 = [1,2,3];


//第一种

let num2 = num1.concat();

//第二种

let num2 = [].concat(num1);
num2[0] = 'a';

console.log(num1,num2); // [1, 2, 3] ["a", 2, 3]
```

#### 3.6 isArray() 

> 用于确定传递的值是否是一个 Array


```javascript
// 下面的函数调用都返回 true

Array.isArray([]);

Array.isArray([1]);

Array.isArray(new Array());

// 这里注意：Array.prototype 也是一个数组,一个属性值不是索引的数组。[constructor: ƒ, concat: ƒ, find: ƒ, findIndex: ƒ, pop: ƒ, …]

Array.isArray(Array.prototype);

// 下面的函数调用都返回 false


Array.isArray();

Array.isArray({});

Array.isArray(null);

Array.isArray(undefined);

Array.isArray(17);

Array.isArray('Array');

Array.isArray(true);

Array.isArray(false);

Array.isArray({ __proto__: Array.prototype });
```

### 四、数组遍历、映射、过滤、检测、简化等方法

#### 4.1 forEach() 

> 方法从头到尾遍历数组，为每个元素调用指定的函数

- `callback` 为数组中每个元素执行的函数，该函数接收三个参数

```javascript
// 1、 空元素不遍历,undefined和null是会遍历的。

let numberArr = [1,2,,3];

numberArr.forEach(function (value,index,array) {
    console.log(value,index,array)
})



//打印信息如下，可见空元素是不会遍历的
//1 0 [1, 2, empty, 3]
//2 1 [1, 2, empty, 3]
//3 3 [1, 2, empty, 3]

let nullArr = [1,2,null,3];

nullArr.forEach(function (value,index,array) {
    console.log(value,index,array)
})


//打印信息如下，null是会遍历的
//1 0 (4) [1, 2, null, 3]
//2 1 (4) [1, 2, null, 3]
//null 2 (4) [1, 2, null, 3]
//3 3 (4) [1, 2, null, 3]
//2、已删除的项不会被遍历到。如果已访问的元素在迭代时被删除了,之后的元素将被跳过


let numberArr = [1,2,3];
numberArr.forEach(function (value,index,array) {
    if(index === 0) {

    delete numberArr[2]; //删除第三项
    //或者numberArr.pop()
}

console.log(value,index,array)
})



//打印信息如下：
// 1 0 (3) [1, 2, empty]
// 2 1 (3) [1, 2, empty]
let numberArr1 = [1,2,3,4];
numberArr1.forEach(function (value,index,array) {

if(index === 1) {
    numberArr1.shift() //遍历到第二项的时候，删除第一项
}

console.log(value,index,array)
})



// 打印信息如下,遍历到第二项的时候，删除第一项，会跳过第三项
// 1 0 (4) [1, 2, 3, 4]
// 2 1 (3) [2, 3, 4]
// 4 2 (3) [2, 3, 4]
// 3、forEach 遍历的范围在第一次调用 callback 前就会确定。调用forEach 后添加到数组中的项不会被 callback 访问到。如果已经存在的值被改变，则传递给 callback 的值是 forEach 遍历到他们那一刻的值。


let arr = [1,2,3];
arr.forEach(function (value,index,array) {

    if(index === 0) {
        arr.push('新增的不会被遍历到')
        arr[2] = 4;
}

console.log(value,index,array)
})



// 1 0 (4) [1, 2, 4, "新增的不会被遍历到"]
// 2 1 (4) [1, 2, 4, "新增的不会被遍历到"]
// 4 2 (4) [1, 2, 4, "新增的不会被遍历到"]
// 4、使用thisArg参数 和 箭头函数使用thisArg

let arr = [1,2,3];
let obj = {arr: 'thisArg'}

arr.forEach(function () {
    console.log(this.arr)
},obj)


// 打印三次 'thisArg'
let arr = [1,2,3];
let obj = {arr: 'thisArg'}
arr.forEach(() => {
    console.log(this.arr)
},obj)

// 打印三次 undefined

// 5、forEach无法中途退出循环，只能用return退出本次回调，进行下一次回调

let arr = [1,2,3];

let result = arr.forEach((value) => {
    if(value == 2) {
        return value;
    }
    console.log(value)

})


console.log(result) // undefined ，即使中间return vlaue，也还是undefined


//打印value的值如下，说明return 并不能终止循环
// 1
// 3
```

#### 4.2 map() 

> 方法创建一个新数组，其结果是该数组中的每个元素都调用一个callback函数后返回的结果

- 返回值： 一个新数组，每个元素都是回调函数的结果
- 不要用 `map` 代替 `forEach`,`map` 会创建一个新的数组，占用内存。如果你不用 `map` 的返回值，那你就应当使用 `forEach`

#### 4.3 filter() 

- 方法返回的数组元素是调用的数组的一个子集。传入的函数时用来逻辑判定的，该函数返回 true 或 false,如果返回值为true或能转化为true的值，那么传递给判断函数的元素就是这个子集的成员，它将被添加倒一个作为返回值的数组中
- 返回值： 一个新的通过测试的元素的集合的数组，如果没有通过测试则返回空数组

#### 4.4 every() 

> 方法测试数组的所有元素是否都通过了指定函数的测试。当且仅当针对数组中的所有元素调用判定函数都返回true，它才返回true。

- 空数组上调用every方法，返回 true，因为空数组没有元素，所以空数组中所有元素都符合给定的条件
- 返回值： 一个布尔值，当所有的元素都符合条件才返回true，否则返回false

```javascript
let arr = [12,34,5,23,44];
let num = 0;
let result = arr.every(function (element, index, array) {

    num++;
    return element > 10;
})

console.log(result,num) // 打印 false 3

// 可见发现5这个小于10的元素后，遍历立即终止，num为3

let arr = [12,34,,23,44];
let num = 0;
let result = arr.every(function (element, index, array) {

num++;

return element > 10;
})

console.log(result,num) // 打印 true 4

// 不会遍历没有赋值的索引位置，所以num为4

let result = [].every(function (element, index, array) {

return element > 10;
})

console.log(result) // 打印 true
```

#### 4.5 some() 

> 方法测试数组中的某些元素是否通过由提供的函数实现的测试。当数组中至少有一个元素调用判定函数返回true，它就返回true，当且仅当数组中的所有元素调用判定函数都返回false，它才返回false

- 空数组调用some，返回false
- 返回值： 只要数组中的任意一个元素在回调函数中返回的是真值，就返回true，否则为false

```javascript
// 一个简单的例子说明
function isBiggerThan10(element, index, array) {
    console.log(index)
    return element > 10;
}


[2, 5, 8, 1, 4].some(isBiggerThan10); // 返回值是false，打印的index是0,1,2,3,4

[12, 5, 8, 1, 4].some(isBiggerThan10); // 返回值是true，打印的index是0，找到符合元素之后立即返回


// 实现一个跟includes方法类似的功能
let arr = [1,2,3];

function include(value) {

return arr.some((element) => {
    return element === value
})
}



include(2) // true
include(4) // false

let result = [].some(function (element, index, array) {

return element > 10;

})

console.log(result) // 打印 false
```

#### 4.6 reduce() 和 reduceRight() 

> 这两个方法使用指定的函数将数组元素进行组合，生成单个值。这在函数式编程中是常见的操作，也可以称为“注入”和“折叠”。reduceRight() 和 reduce() 工作原理是一样的，不同的是reduceRight() 按照数组索引从高到低（从右到左）处理数组，而不是从低到高

- 如果数组为空且没有提供initialValue，会抛出TypeError 。如果数组仅有一个元素（无论位置如何）并且没有提供initialValue， 或者有提供initialValue但是数组为空，那么此唯一值将被返回并且callback不会被执行
- 返回值： 函数累计处理的结果

```javascript
let arr = [1,2,3,4,5];

let sum = arr.reduce((x,y) => x + y,0);

console.log(sum) // 15

// 看一下initialValue传和不传的区别

let arr = [1,2,3,4,5];

arr.reduce(function (accumulator,currentValue,currentIndex,arr) {

    console.log(currentIndex)
    
    return accumulator + currentValue;
})



// 1,2,3,4,5 没传入initialValue，索引是从1开始

arr.reduce(function (accumulator,currentValue,currentIndex,arr) {

    console.log(currentIndex)
    
    return accumulator + currentValue;
},10)



// 0,1,2,3,4,5 传入initialValue，索引从0开始
// 应用到二维数组展开
let arr = [[0, 1], [2, 3], [4, 5]].reduce(
    (a, b) => a.concat(b)
);

console.log(arr)
// [0, 1, 2, 3, 4, 5]
```

#### 4.7  indexof() 

> 方法返回在数组中可以找到一个给定元素的第一个索引，如果不存在，则返回-1

- 注意： `indexOf` 使用严格相等（即 `===`）比较 `searchElement` 和数组中的元素。而且`indexOf()`不能识别 `NaN`
- 返回值： 首个被找到的元素在数组中的索引位置; 若没有找到则返回 -1

```javascript
let array = [2, 5, 9];
array.indexOf(2) // 0

array.indexOf(7) // -1
array.indexOf(9, 2) // 2

array.indexOf(9, 3) // -1

array.indexOf(2, -1) // -1

array.indexOf(2, -3) // 0

array.indexOf(2, -4) // 0

let array1 = [1,2,NaN];

array1.indexOf(NaN) // -1
```

#### 4.8 includes() 

> 方法用来判断一个数组是否包含一个指定的值，根据情况，如果包含则返回 true，否则返回false。 ES7新增

- 返回值： 一个布尔值，根据情况，如果包含则返回 true，否则返回false

```javascript
[1, 2, 3].includes(2); // true
[1, 2, 3].includes(4); // false
[1, 2, 3].includes(3, 3); // false
[1, 2, 3].includes(3, -1); // true
[1, 2, 3].includes(3, -4); // true
[1, 2, NaN].includes(NaN); // true
```

#### 4.9 find() 和 findIndex() 

> find 方法返回数组中满足提供的测试函数的第一个元素的值。否则返回 undefined。findIndex 方法返回数组中满足提供的测试函数的第一个元素的索引。否则返回-1

- `find` 方法，当某个元素通过 callback 的测试时，返回数组中的一个值，否则返回 undefined。
- `findIndex`方法，返回数组中满足提供的测试函数的第一个元素的索引。否则返回-1

```javascript
// find
let a = [1, 4, -5, 10].find((n) => n < 0); // 返回元素-5

let b = [1, 4, -5, 10,NaN].find((n) => Object.is(NaN, n)); // 返回元素NaN

// findIndex
let a = [1, 4, -5, 10].findIndex((n) => n < 0); // 返回索引2
let b = [1, 4, -5, 10,NaN].findIndex((n) => isNaN(n)); // 返回索引4

// 稀疏数组
let a =[1,,3,4];

let index = 0;
a.find((n) => {
    
    console.log(index++) //0,1,2 第二次是empty也会调用一次，而且返回为true，立即退出
    
    return n === 3;
})
```

#### 4.10 其他

- `keys() `方法返回一个新的Array迭代器，它包含数组中每个索引的键
- `values()` 方法返回一个新的Array迭代器，它包含数组中每个索引的值
- `entries() `方法返回一个新的Array迭代器，该对象包含数组中每个索引的键/值对
