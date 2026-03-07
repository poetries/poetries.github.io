---
title: ECMAScript6回顾
date: 2017-10-21 20:20:43
tags: 
   - JavaScript
   - ES6
categories: Front-End
---

> - 整理于互联网，整理最常用的部分，完善中....
> - 参考资料: http://es6.ruanyifeng.com


## 第一部分：扩展

### 1.1、let和const

- `const`声明一个只读的常量。一旦声明，常量的值就不能改变
- `let`不允许在相同作用域内，重复声明同一个变量
- `for`循环的计数器，就很合适使用`let`命令
- 不存在变量提升
- 会创建块级作用域


### 1.2、变量的解构赋值

**数组解构赋值应用场景**

- 变量交换

```javascript
[a,b] = [b,a]
````

- 选择性接收某些变量

```javascript
function fn() {
    return [1,2,3,4,5]
}

[a,,,b] = fn();
// a = 1,b = 4
```

- 不确定返回数组长度，只关心第一个

```javascript
[a,...b] = [1,2,3,4,5]
```

**对象解构赋值场景**


- 服务端返回的`json`解构应用

```javascript
let metaData = {
    title: "hah",
    test: [
        {
            title:"poetries",
            desc: "test_data"
        }
    ]
}

let {title:esTitle,test:[{title:cnTitle,desc:cnDesc}]} = metaData;
```


### 1.3、字符串扩展

- 模板字符串是增强版的字符串，用反引号（`）标识。它可以当作普通字符串使用，也可以用来定义多行字符串.

```javascript
// 普通字符串
`In JavaScript '\n' is a line-feed.`

// 多行字符串
`In JavaScript this is
 not legal.`

console.log(`string text line 1
string text line 2`);

// 字符串中嵌入变量
let name = "Bob", time = "today";
`Hello ${name}, how are you ${time}?`
```


### 1.4、数值扩展

**Number.isFinite(), Number.isNaN()**

- `Number.isFinite()`用来检查一个数值是否为有限的

```
Number.isFinite(15); // true
Number.isFinite(0.8); // true
Number.isFinite(NaN); // false
Number.isFinite(Infinity); // false
Number.isFinite(-Infinity); // false
Number.isFinite('foo'); // false
Number.isFinite('15'); // false
Number.isFinite(true); // false
```

- `Number.isNaN()`用来检查一个值是否为`NaN`

```
Number.isNaN(NaN) // true
Number.isNaN(15) // false
Number.isNaN('15') // false
Number.isNaN(true) // false
Number.isNaN(9/NaN) // true
Number.isNaN('true'/0) // true
Number.isNaN('true'/'true') // true
```

**Number.parseInt(), Number.parseFloat()**

- `ES6 `将全局方法`parseInt()`和`parseFloat()`，移植到`Number`对象上面，行为完全保持不变

### 1.5、数组扩展

**扩展运算符**

- 扩展运算符是三个点（`...`）。它好比 `rest` 参数的逆运算，将一个数组转为用逗号分隔的参数序列

```javawscript
console.log(...[1, 2, 3])
// 1 2 3

console.log(1, ...[2, 3, 4], 5)
// 1 2 3 4 5

[...document.querySelectorAll('div')]
// [<div>, <div>, <div>]
```

- 扩展运算符取代`apply`方法的一个实际的例子

```javascript
// ES5 的写法
Math.max.apply(null, [14, 3, 77])

// ES6 的写法
Math.max(...[14, 3, 77])

// 等同于
Math.max(14, 3, 77);
```

**Array.from()**

- `Array.from`方法用于将两类对象转为真正的数组：类似数组的对象（`array-like object`）和可遍历（`iterable`）的对象（包括ES6新增的数据结构`Set`和`Map`）

```javascript
let arrayLike = {
    '0': 'a',
    '1': 'b',
    '2': 'c',
    length: 3
};

// ES5的写法
var arr1 = [].slice.call(arrayLike); // ['a', 'b', 'c']

// ES6的写法
let arr2 = Array.from(arrayLike); // ['a', 'b', 'c']
```

- 实际应用中，常见的类似数组的对象是`DOM`操作返回的`NodeList`集合，以及函数内部的`arguments`对象。`Array.from`都可以将它们转为真正的数组。

> `querySelectorAll`方法返回的是一个类似数组的对象，可以将这个对象转为真正的数组，再使用`forEach`方法

```javascript
// NodeList对象
let ps = document.querySelectorAll('p');
Array.from(ps).forEach(function (p) {
  console.log(p);
});

// arguments对象
function foo() {
  var args = Array.from(arguments);
  // ...
}
```

**Array.of()**

- `Array.of`方法用于将一组值，转换为数组
- `Array.of`基本上可以用来替代`Array()`或`new Array()`

```javascript
Array.of(3, 11, 8) // [3,11,8]
Array.of(3) // [3]
Array.of(3).length // 1
```

**数组实例的 find() 和 findIndex()**

> 数组实例的`find`方法，用于找出第一个符合条件的数组成员。它的参数是一个回调函数，所有数组成员依次执行该回调函数，直到找出第一个返回值为`true`的成员，然后返回该成员。如果没有符合条件的成员，则返回`undefined`

```javascript
[1, 4, -5, 10].find((n) => n < 0)
// -5
```

> 数组实例的`findIndex`方法的用法与`find`方法非常类似，返回第一个符合条件的数组成员的位置，如果所有成员都不符合条件，则返回`-1`

```javascript
[1, 5, 10, 15].findIndex(function(value, index, arr) {
  return value > 9;
}) // 2
```

**数组实例的fill()**

- `fill`方法使用给定值，填充一个数组
- `fill`方法用于空数组的初始化非常方便。数组中已有的元素，会被全部抹去
- `fill`方法还可以接受第二个和第三个参数，用于指定填充的起始位置和结束位置

```javascript
['a', 'b', 'c'].fill(7)
// [7, 7, 7]

new Array(3).fill(7)
// [7, 7, 7]

// 接受第二个和第三个参数
['a', 'b', 'c'].fill(7, 1, 2)
// ['a', 7, 'c']
```

**数组实例的 entries()，keys() 和 values()**

- `ES6` 提供三个新的方法——`entries()`，`keys()`和`values()`——用于遍历数组
- `keys()`是对键名的遍历、`values()`是对键值的遍历，`entries()`是对键值对的遍历

```javascript
for (let index of ['a', 'b'].keys()) {
  console.log(index);
}
// 0
// 1

for (let elem of ['a', 'b'].values()) {
  console.log(elem);
}
// 'a'
// 'b'

for (let [index, elem] of ['a', 'b'].entries()) {
  console.log(index, elem);
}
// 0 "a"
// 1 "b"
```

**数组实例的 includes()**

- `Array.prototype.includes`方法返回一个布尔值，表示某个数组是否包含给定的值，与字符串的`includes`方法类似

```javascript
[1, 2, 3].includes(2)     // true
[1, 2, 3].includes(4)     // false
[1, 2, NaN].includes(NaN) // true
```


### 1.6、对象扩展


**属性的简洁表示法**

```javascript
function f(x, y) {
  return {x, y};
}

// 等同于

function f(x, y) {
  return {x: x, y: y};
}
```
- 除了属性简写，方法也可以简写

```javascript
const o = {
  method() {
    return "Hello!";
  }
};

// 等同于

const o = {
  method: function() {
    return "Hello!";
  }
};
```

```javascript
module.exports = { getItem, setItem, clear };
// 等同于
module.exports = {
  getItem: getItem,
  setItem: setItem,
  clear: clear
};
```

**属性名表达式**

- `JavaScript` 定义对象的属性，有两种方法

```javascript
// 方法一
obj.foo = true;

// 方法二
obj['a' + 'bc'] = 123;
```
- `ES6 `允许字面量定义对象时，用方法二（表达式）作为对象的属性名，即把表达式放在方括号内

```javascript
let propKey = 'foo';

let obj = {
  [propKey]: true,
  ['a' + 'bc']: 123
};
```

- 表达式还可以用于定义方法名

```javascript
let obj = {
  ['h' + 'ello']() {
    return 'hi';
  }
};

obj.hello() // hi
```

**Object.is()**

- `Object.is` 它用来比较两个值是否严格相等，与严格比较运算符（`===`）的行为基本一致

```javascript
Object.is('foo', 'foo')
// true
Object.is({}, {})
// false
```

- 不同之处只有两个：一是`+0`不等于`-0`，二是`NaN`等于自身

```javascript
+0 === -0 //true
NaN === NaN // false

Object.is(+0, -0) // false
Object.is(NaN, NaN) // true
```

**Object.assign()**

- `Object.assign`方法用于对象的合并，将源对象的所有可枚举属性，复制到目标对象

```javascript
const target = { a: 1 };

const source1 = { b: 2 };
const source2 = { c: 3 };

Object.assign(target, source1, source2);
target // {a:1, b:2, c:3}
```

**属性的遍历**

`ES6` 一共有`5`种方法可以遍历对象的属性

- `for...in`
  - `for...in`循环遍历对象自身的和继承的可枚举属性（不含 `Symbol` 属性）
  
- `Object.keys(obj)`
  - `Object.keys`返回一个数组，包括对象自身的（不含继承的）所有可枚举属性（不含 `Symbol` 属性）的键名

- `Object.getOwnPropertyNames(obj)`
  - `Object.getOwnPropertyNames`返回一个数组，包含对象自身的所有属性（不含 `Symbol` 属性，但是包括不可枚举属性）的键名

- `Object.getOwnPropertySymbols(obj)`
  - `Object.getOwnPropertySymbols`返回一个数组，包含对象自身的所有 `Symbol` 属性的键名

- `Reflect.ownKeys(obj)`
  - `Reflect.ownKeys`返回一个数组，包含对象自身的所有键名，不管键名是 `Symbol` 或字符串，也不管是否可枚举


### 1.7、函数扩展

**函数参数的默认值**

- `ES6` 允许为函数的参数设置默认值，即直接写在参数定义的后面

```javascript
function log(x, y = 'World') {
  console.log(x, y);
}

log('Hello') // Hello World
log('Hello', 'China') // Hello China
log('Hello', '') // Hello
```

**与解构赋值默认值结合使用**

- 参数默认值可以与解构赋值的默认值，结合起来使用

```javascript
function foo({x, y = 5}) {
  console.log(x, y);
}

foo({}) // undefined 5
foo({x: 1}) // 1 5
foo({x: 1, y: 2}) // 1 2
```

**rest 参数**

- `ES6` 引入 `rest` 参数（形式为`...`变量名），用于获取函数的多余参数，这样就不需要使用`arguments`对象了。`rest` 参数搭配的变量是一个数组，该变量将多余的参数放入数组中

```javascript
function add(...values) {
  let sum = 0;

  for (var val of values) {
    sum += val;
  }

  return sum;
}

add(2, 5, 3) // 10
```

**箭头函数**

```javascript
var f = v => v

//箭头函数等同于
var f = function(v) {
  return v;
};
```

```javascript
var f = () => 5;
// 等同于
var f = function () { return 5 };

var sum = (num1, num2) => num1 + num2;
// 等同于
var sum = function(num1, num2) {
  return num1 + num2;
};
```


**绑定 this**

- 箭头函数可以绑定this对象，大大减少了显式绑定this对象的写法（`call`、`apply`、`bind`）


## 第二部分：新增

### 2.1、Symbol

- `ES6 `引入了一种新的原始数据类型`Symbol`，表示独一无二的值
- 凡是属性名属于 `Symbol` 类型，就都是独一无二的，可以保证不会与其他属性名产生冲突

### 2.2、Proxy

> 对要保护的对象套一层，不被外界所访问。`Proxy` 可以理解成，在目标对象之前架设一层“拦截”，外界对该对象的访问，都必须先通过这层拦截，因此提供了一种机制，可以对外界的访问进行过滤和改写

```javascript
let obj={
    time:'2017-03-11',
    name:'net',
    _r:123
  };

  let monitor=new Proxy(obj,{
    // 拦截对象属性的读取
    get(target,key){
      return target[key].replace('2017','2018')
    },
    // 拦截对象设置属性
    set(target,key,value){
      if(key==='name'){
        return target[key]=value;
      }else{
        return target[key];
      }
    },
    // 拦截key in object操作
    has(target,key){
      if(key==='name'){
        return target[key]
      }else{
        return false;
      }
    },
    // 拦截delete
    deleteProperty(target,key){
      if(key.indexOf('_')>-1){
        delete target[key];
        return true;
      }else{
        return target[key]
      }
    },
    // 拦截Object.keys,Object.getOwnPropertySymbols,Object.getOwnPropertyNames
    ownKeys(target){
      return Object.keys(target).filter(item=>item!='time')
    }
  });

  console.log('get',monitor.time);

  monitor.time='2018';
  monitor.name='poetries';
  console.log('set',monitor.time,monitor);

  console.log('has','name' in monitor,'time' in monitor);

  // delete monitor.time;
  // console.log('delete',monitor);
  //
  // delete monitor._r;
  // console.log('delete',monitor);
  console.log('ownKeys',Object.keys(monitor));
```
### 2.3、Reflect

> `Reflect`对象与`Proxy`对象一样，也是` ES6` 为了操作对象而提供的新 `API`

```javascript
let obj={
time:'2017-03-11',
name:'net',
_r:123
};

console.log('Reflect get',Reflect.get(obj,'time'));
Reflect.set(obj,'name','poetries');
console.log(obj);
console.log('has',Reflect.has(obj,'name'));
```

### 2.4、Set和Map

**Set**

> `Set`和`Map`类似，也是一组`key`的集合，但不存储`value`。由于`key`不能重复，所以，在`Set`中，没有重复的`key`

- 要创建一个`Set`，需要提供一个`Array`作为输入，或者直接创建一个空`Set`

```
var s1 = new Set(); // 空Set
var s2 = new Set([1, 2, 3]); // 含1, 2, 3
```

- 重复元素在`Set`中自动被过滤

```
var s = new Set([1, 2, 3, 3, '3']);
s; // Set {1, 2, 3, "3"}
```

- 通过`add(key)`方法可以添加元素到`Set`中，可以重复添加，但不会有效果

```
>>> s.add(4)
>>> s
{1, 2, 3, 4}
>>> s.add(4)
>>> s
{1, 2, 3, 4}
```

- 通过`delete(key)`方法可以删除元素

```
var s = new Set([1, 2, 3]);
s; // Set {1, 2, 3}
s.delete(3);
s; // Set {1, 2}
```

**Map**


- `Map`是一组键值对的结构，具有极快的查找速度
- 用`Map`实现，只需要一个“名字”-“成绩”的对照表，直接根据名字查找成绩，无论这个表有多大，查找速度都不会变慢。用`JavaScript`写一个`Map`如下：

```
var m = new Map([['Michael', 95], ['Bob', 75], ['Tracy', 85]]);
m.get('Michael'); // 95
```

- 初始化`Map`需要一个二维数组，或者直接初始化一个空`Map`。`Map`具有以下方法

```
var m = new Map(); // 空Map
m.set('Adam', 67); // 添加新的key-value
m.set('Bob', 59);
m.has('Adam'); // 是否存在key 'Adam': true
m.get('Adam'); // 67
m.delete('Adam'); // 删除key 'Adam'
m.get('Adam'); // undefined
```

- 由于一个`key`只能对应一个`value`，所以，多次对一个`key`放入`value`，后面的值会把前面的值冲掉

```
var m = new Map();
m.set('Adam', 67);
m.set('Adam', 88);
m.get('Adam'); // 88
```


### 2.5、Promise

> `Promise` 是异步编程的一种解决方案，比传统的解决方案——回调函数和事件——更合理和更强大

- `Promise`对象代表一个异步操作，有三种状态
  - `pending`（进行中）
  - `fulfilled`（已成功）
  - `rejected`（已失败）

**基本用法**

```javascript
var promise = new Promise(function(resolve, reject) {
  // ... some code

  if (/* 异步操作成功 */){
    resolve(value);
  } else {
    reject(error);
  }
});
```

- `Promise`实例生成以后，可以用`then`方法分别指定`resolved`状态和`rejected`状态的回调函数

```javascript
promise.then(function(value) {
  // success
}, function(error) {
  // failure
});
```



### 2.6、Generator

> `generator`（生成器）是`ES6`标准引入的新的数据类型。一个`generator`看上去像一个函数，但可以返回多次

### 2.7、Class

```javascript
{
  // 基本定义和生成实例
  class Parent{
    constructor(name='poetries'){
      this.name=name;
    }
  }
  let v_parent=new Parent('v');
  console.log('构造函数和实例',v_parent);
}

{
  // 继承
  class Parent{
    constructor(name='poetries'){
      this.name=name;
    }
  }

  class Child extends Parent{

  }

  console.log('继承',new Child());
}

{
  // 继承传递参数
  class Parent{
    constructor(name='poetries'){
      this.name=name;
    }
  }

  class Child extends Parent{
    constructor(name='child'){
      super(name);
      this.type='child';
    }
  }

  console.log('继承传递参数',new Child('hello'));
}

{
  // getter,setter
  class Parent{
    constructor(name='poetries'){
      this.name=name;
    }

    get longName(){
      return 'mk'+this.name
    }

    set longName(value){
      this.name=value;
    }
  }

  let v=new Parent();
  console.log('getter',v.longName);
  v.longName='hello';
  console.log('setter',v.longName);
}

{
  // 静态方法
  class Parent{
    constructor(name='poetries'){
      this.name=name;
    }

    static tell(){
      console.log('tell');
    }
  }

  Parent.tell();

}

{
  // 静态属性
  class Parent{
    constructor(name='poetries'){
      this.name=name;
    }

    static tell(){
      console.log('tell');
    }
  }

  Parent.type='test';

  console.log('静态属性',Parent.type);


}

```
### 2.8、Module

```javascript
let A=123;
let test=function(){
  console.log('test');
}
class Hello{
  test(){
    console.log('class');
  }
}

export default {
  A,
  test,
  Hello
}
```
