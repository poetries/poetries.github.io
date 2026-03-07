---
title: React之Immutable学习记录（十二）
date: 2017-11-20 20:10:24
tags: 
 - Immutable
 - react
categories: Front-End
---


> 整理于互联网

## 一、前言


> 从问题说起：熟悉 `React` 组件生命周期的话都知道：调用 `setState` 方法总是会触发 `render` 方法从而进行 `vdom re-render` 相关逻辑，哪怕实际上你没有更改到 `Component.state `

```javascript
this.state = {count: 0}
this.setState({count: 0});// 组件 state 并未被改变，但仍会触发 render 方法 
```

- 为了避免这种性能上的浪费，`React` 提供了一个 `shouldComponentUpdate` 来控制触发 `vdom re-render` 逻辑的条件。于是 `PureRenderMixin` 作为一种优化技巧被使用。它仅仅是浅比较对象，深层次的数据结构根本不管用


**js中的Immutable Data**

> 在`javascript`中我们可以通过`deep clone`来模拟`Immutable Data`，就是每次对数据进行操作，新对数据进行`deep clone`出一个新数据

- deep clone
- 当然你或许意识到了，这样非常的慢

```javascript
'use strict';  
var cloneDeep = require('lodash.clonedeep');

var data = {  
    id: 'data',
    author: {
        name: 'mdemo',
        github: 'https://github.com/demohi'
    }
};

var data1 = cloneDeep(data);

console.log('equal:', data1===data); //false

data1.id = 'data1';  
data1.author.name = 'demohi';

console.log(data.id);// data  
console.log(data1.id);// data1

console.log(data.author.name);//mdemo  
console.log(data1.author.name);//demohi  
```


> 这时候 immutableJS 就派得上用场了

```javascript
var map1 = Immutable.fromJS({a:1, b:1, c:{b:{c:{d:{e:7}}}}});
var map2 = Immutable.fromJS({a:1, b:1, c:{b:{c:{d:{e:7}}}}});
Immutable.is(map1, map2);  // true
```

- 遍历对象不再用`for-in`，可以这样:

```javascript
Immutable.fromJS({a:1, b:2, c:3}).map(function(value, key) { /* do some thing */});
```


## 二、什么是 Immutable Data


- `Immutable Data` 就是一旦创建，就不能再被更改的数据。对 `Immutable` 对象的任何修改或添加删除操作都会返回一个新的 `Immutable` 对象
- `Immutable` 实现的原理是 `Persistent Data Structure`（持久化数据结构），也就是使用旧数据创建新数据时，要保证旧数据同时可用且不变
- 同时为了避免 `deepCopy` 把所有节点都复制一遍带来的性能损耗，`Immutable` 使用了 `Structural Sharing····`（结构共享），即如果对象树中一个节点发生变化，只修改这个节点和受它影响的父节点，其它节点则进行共享。


> 打印`immutableJS`看看有什么东西

![](https://poetries1.gitee.io/img-repo/2019/10/462.png)

**一个说明不可变的例子**

```javascript
// 原生对象
let a1 = {
    b: 1,
    c: {
        c1: 123
    }
};

let b1 = a1;
b1.b = 2;

console.log(a1.b, b1.b); // 2, 2
console.log(a1 === b1); // true
console.log(a1.c === b1.c); // true

// immutable.js 的Map
let a2 = Immutable.fromJS({
    b: 1,
    c: {
        c1: 123
    }
});

let b2 = a2.set('b', 2);

// 对 Immutable 对象的任何修改或添加删除操作都会返回一个新的 Immutable 对象
console.log(a2.get('b'), b2.get('b')); // 1, 2  对象 a2 的 b 值并没有变成2。
console.log(a2 === b2); //  false

//如果对象树中一个节点发生变化，只修改这个节点和受它影响的父节点，其它节点则进行共享。
console.log(a2.get('c') === b2.get('c')); //true
```


## 三、为什么要在React.js中使用Immutable


> - 它是一个完全独立的库，无论基于什么框架都可以用它。意义在于它弥补了`Javascript` 没有不可变数据结构的问题
> - 由于是不可变的，可以放心的对对象进行任意操作。在`React`开发中，频繁操作state对象或是`store`，配合`immutableJS`快、安全、方便

- 熟悉`React.js`的都应该知道，`React.js`是一个`UI = f(states)`的框架，为了解决更新的问题，`React.js`使用了`virtual dom`，`virtual dom`通过`diff`修改`dom`，来实现高效的`dom`更新。
- 但是有一个问题。当`state`更新时，如果数据没变，你也会去做`virtual dom`的`diff`，这就产生了浪费。这种情况其实很常见

> - 当然你可能会说，你可以使用`PureRenderMixin`来解决呀，`PureRenderMixin`是个好东西，我们可以用它来解决一部分的上述问题
> - 但`PureRenderMixin`只是简单的浅比较，不使用于多层比较。那怎么办？自己去做复杂比较的话，性能又会非常差

- 方案就是使用`immutable.js`可以解决这个问题。因为每一次`state`更新只要有数据改变，那么`PureRenderMixin`可以立刻判断出数据改变，可以大大提升性能


**Immutable 优点**


- **Immutable 降低了 Mutable 带来的复杂度**

> 可变（`Mutable`）数据耦合了 `Time `和 `Value` 的概念，造成了数据很难被回溯

- **节省内存**

> `Immutable.js` 使用了 `Structure Sharing` 会尽量复用内存，甚至以前使用的对象也可以再次被复用。没有被引用的对象会被垃圾回收

```javascript
import { Map} from 'immutable';
let a = Map({
  select: 'users',
  filter: Map({ name: 'Cam' })
})
let b = a.set('select', 'people');

a === b; // false
a.get('filter') === b.get('filter'); // true
```

- **Undo/Redo，Copy/Paste，甚至时间旅行这些功能做起来小菜一碟**

> 因为每次数据都是不一样的，只要把这些数据放到一个数组里储存起来，想回退到哪里就拿出对应数据即可，很容易开发出撤销重做这种功能。


- **并发安全**

> 传统的并发非常难做，因为要处理各种数据不一致问题，因此『聪明人』发明了各种锁来解决。但使用了 `Immutable` 之后，数据天生是不可变的，并发锁就不需要了。


- **拥抱函数式编程**

> `Immutable` 本身就是函数式编程中的概念，纯函数式编程比面向对象更适用于前端开发。因为只要输入一致，输出必然一致，这样开发的组件更易于调试和组装。


**Immutable 缺点**

- 需要学习新的 API
- 增加了资源文件大小
- 容易与原生对象混淆


## 四、Immutable 的几种数据类型


- `List`: 有序索引集，类似`JavaScript`中的`Array`。
- `Map`: 无序索引集，类似`JavaScript`中的`Object`。
- `OrderedMap`: 有序的`Map`，根据数据的`set()`进行排序。
- `Set`: 没有重复值的集合。
- `OrderedSet`: 有序的`Set`，根据数据的`add`进行排序。
- `Stack`: 有序集合，支持使用`unshift（）`和`shift（）`添加和删除。
- `Range()`: 返回一个`Seq.Indexed`类型的集合，这个方法有三个参数，`start`表示开始值，默认值为`0`，`end`表示结束值，默认为无穷大，`step`代表每次增大的数值，默认为`1`.如果`start = end`,则返回空集合。
- `Repeat()`: 返回一个`vSeq.Indexe`类型的集合，这个方法有两个参数，`value`代表需要重复的值，`times`代表要重复的次数，默认为无穷大。
- `Record`: 一个用于生成`Record`实例的类。类似于`JavaScript`的`Object`，但是只接收特定字符串为`key`，具有默认值。
- `Seq`: 序列，但是可能不能由具体的数据结构支持。
- `Collection`: 是构建所有数据结构的基类，不可以直接构建

> 上面那么多常用的也就是 `List`和`Map`


## 五、几个重要的API


**1、fromJS()**

- `fromJS()` 是最最最常用的将原生`JS`数据转换为`ImmutableJS`数据的转换方法。使用方式类似于 `JSON.parse()`，接收两个参数：`json` 数据和 `reviver `函数
- 在不传递`reviver`函数的情况下，默认将原生`JS`的`Array`转为`List`，`Object`转为`Map`

```javascript
// 常见
const t1 = Immutable.fromJS({a: {b: [10, 20, 30]}, c: 40});
console.log(t1);

// 不常用
const t2 = Immutable.fromJS({a: {b: [10, 20, 30]}, c: 40}, function(key, value) {
    // 定制转换方式，下这种就是将Array转换为List，Object转换为Map
    const isIndexed = Immutable.Iterable.isIndexed(value);
    return isIndexed ? value.toList() : value.toOrderedMap();
    // true, "b", {b: [10, 20, 30]}
    // false, "a", {a: {b: [10, 20, 30]}, c: 40}
    // false, "", {"": {a: {b: [10, 20, 30]}, c: 40}}
});
console.log(t2);
```

**2、is()**

> 先来看官网的一段话: `immutable`数据应该被当作值而不是对象，值是表示该事件在特定时刻的状态。这个原则对理解不可变数据的适当使用是最重要的。为了将`Immutable.js`数据视为值，就必须使用`Immutable.is()`函数或`.equals()`方法来确定值相等，而不是确定对象引用标识的 `===` 操作符

- 所以`is()`就是用来对两个`immutable`对象进行值比较的。使用方式类似于 `Object.is(obj1, obj2)`，接收两个参数

```javascript
const map1 = Immutable.Map({a:1, b:1, c:1});
const map2 = Immutable.Map({a:1, b:1, c:1});

// 两个不同的对象
console.log(map1 === map2); // false
// 进行值比较
console.log(Immutable.is(map1, map2)); // true

// 不仅仅只能比较ImmutableJS的类型的数据
console.log(Immutable.is(undefined, undefined)); // true
console.log(Immutable.is(null, undefined)); // false
console.log(Immutable.is(null, null)); // true
console.log(Immutable.is(NaN, NaN)); // true

// 区别于 Object.is
console.log(Object.is(0, -0) ,Immutable.is(-0, 0)); // false , true
```

**3、Map**

> `Map` 数据类型，对应原生 `Object` 数组。最最常用的 数据结构之一，循环时无序(`orderedMap`有序)，对象的 `key` 可以是任意值。具体看下面的例子

```javascript
console.log(Map().set(List.of(1), 'list-of-one').get(List.of(1)));
console.log(Map().set(NaN, 'NaN').get(NaN));
console.log(Map().set(undefined, 'undefined').get(undefined));
console.log(Map().set(null, 'null').get(null));
```

- **简单介绍 OrderedMap**

> `OrderedMap` 是 `Map` 的变体，它除了具有 `Map` 的特性外，还具有顺序性，当开发者遍历 `OrderedMap` 的实例时，遍历顺序为该实例中元素的声明、添加顺序。`OrderedMap`比非有序`Map`更昂贵，并且可能消耗更多的内存。如果真要求遍历有序，请使用`List`

**4、List**

> `List` 数据类型，对应原生 `Array `数组。和原生数组，最大区别不存在'空位'。`[, , , , ]`

```javascript
console.log(List([,,,,]).toJS());// [undefined, undefined, undefined, undefined]
```


## 六、API

> 我们主要介绍`Map `和 `List`


### 创建

**1、通过构造函数 Map()**

> 构造函数不常用，一般都是通过`Immutable.fromJS()`将一个`JS`原生对象转换为一个`Immutable`对象

**2、Map()**

```javascript
/*
 Map<K, V>(): Map<K, V>
 Map<K, V>(iter: Iterable.Keyed<K, V>): Map<K, V>
 Map<K, V>(iter: Iterable<any, Array<any>>): Map<K, V>
 Map<K, V>(obj: Array<Array<any>>): Map<K, V>
 Map<V>(obj: {[key: string]: V}): Map<string, V>
 Map<K, V>(iterator: Iterator<Array<any>>): Map<K, V>
 Map<K, V>(iterable: Object): Map<K, V>
 */

console.log(Map().toJS()); // {}
console.log(Map({key: "value"}).toJS()); // {key: "value"}
```

> 同Key覆盖问题

```javascript
//最后的{key: value2} 覆盖了前面的 {key: value}
console.log(Map([["key", "value"], ["key", "value2"], ["key1", "value1"]]).toJS());// {key: "value2", key1: "value1"}
```

**3、List()**

```javascript
/*
 List<T>(): List<T>
 List<T>(iter: Iterable.Indexed<T>): List<T>
 List<T>(iter: Iterable.Set<T>): List<T>
 List<K, V>(iter: Iterable.Keyed<K, V>): List<any>
 List<T>(array: Array<T>): List<T>
 List<T>(iterator: Iterator<T>): List<T>
 List<T>(iterable: Object): List<T>
 */

console.log(List().toJS()); // []
console.log(List([1,2,3,4,{a:123}]).toJS()); // [ 1, 2, 3, 4, {a: 123}]
```

**4、另一种方式**

**Map.of()**

```javascript
console.log(Map.of('key1','value1','key2','value2','key3','value3').toJS()); // {key1: "value1", key2: "value2", key3: "value3"}
```

**List.of()**

```javascript
console.log(List.of({x:1}, 2, [3], 4).toJS()); // [{x:1}, 2, [3], 4]
```


### 判断是否是一个Map或者List

**1、Map判断**

- 判断是否是一个`Map` , 对原生`Object`不生效

```javascript
console.log(Map.isMap({})); // false
console.log(Map.isMap(Map({}))); // true
```

**2、List判断**

> 判断是否是一个`List` , 对原生`Array`不生效

```javascript
console.log(List.isList([])); // false
console.log(List.isList(List([]))); // true
```



### 获取大小

**1、size**

```javascript
// list
console.log(List([1,2,3,4]).size);// 4
console.log(List.of(1, 2, 3, 4).size);// 4

// map
console.log(Map({key: "value2", key1: "value1"}).size);// 2
console.log(Map.of({x:1}, 2, [3], 4).size);// 2
```

**count()**

```javascript
// map
console.log(Immutable.fromJS({key: "value2", key1: "value1"}).count());// 4
// 可以定制条件，来确定大小
console.log(Immutable.fromJS({key: 1, key1: 34}).count((value, key, obj) => {
    return value > 3;
}));// 1 value大于3的有两个

// list
console.log(Immutable.fromJS([1, 2, 5, 6]).count());// 4
// 可以制定条件，来确定 大小
console.log(Immutable.fromJS([1, 2, 5, 6]).count((value, index, array) => {
    return value > 3;
}));// 2 大于3的有两个
```

**countBy()**

> `countBy()`和`count()`的区别就是它的返回值是一个对象。

```javascript
// Map
console.log(Immutable.fromJS({key: 1, key1: 34}).countBy((value, key, obj) => {
    return value > 3;
}).toJS());// {false: 1, true: 1}

// list
console.log(Immutable.fromJS([1, 2, 5, 6]).countBy((value, index, array) => {
    return value > 3;
}).toJS());// {false: 2, true: 2}
```

### 添加元素

**1、Set**

```javascript
// Map
// 将 key 位置的元素替换为 value
const $obj1 = Map({a: {a1: 34}, b: 2, c: 3, d: 444});
console.log($obj1.set('a', 0).toJS()); // {a: 0, b: 2, c: 3, d: 444}
console.log($obj1.set('e', 99).toJS());  // {a: 1, b: 2, c: 3, d: 444, e: 99}

// List
// 将 index 位置的元素替换为 value，即使索引越界也是安全的, 空位 undefined
const $arr1 = List([1, 2, 3]);
console.log($arr1.set(-1, 0).toJS()); // [1, 2, 0]  注意-1 等效于 $arr1.set($arr1.size + -1, 0)
console.log($arr1.set(4, 0).toJS());  // [ 1, 2, 3, undefined, 0 ]  空位置为了undefined
```

**2、setIn**

```javascript
// Map
console.log(Immutable.fromJS([1, 2, 3, {a: 45, b: 64}]).setIn(['3', 'a'], 1000).toJS());//[1, 2, 3, {a: 1000, b: 64}]

// List
console.log(Immutable.fromJS([1, 2, 3, {a: 45, b: 64}]).setIn(['3', 'a'], 1000).toJS());//[1, 2, 3, {a: 1000, b: 64}]
```

### List 特有的添加元素

**1、插入元素**

```javascript
// insert(index: number, value: T)
// 向 index 位置插入 value
console.log(Immutable.fromJS([1, 2, 3]).insert(1, 1.5).toJS()); // [ 1, 1.5, 2, 3 ]
```

**2、设置size**

- 默认值`undefined`

```javascript
console.log(List([]).setSize(2).toJS()); // [undefined, undefined]
```

**3、pop、push、shift、unshift**

> `List`数据类型也拥有`pop`、`push`、`shift`、`unshift`这四种操作方法，和原生`Array`的四种方法使用方式一致，但唯一区别就是返回新的`List`，并且不改变原来的数组本身，而原生则是会改变元素本身

```javascript
// ImmutableJS：返回新的List，并且不改变元素本身
const $test = List([1, 2, 3, 4]);
console.log($test.pop().toJS(), $test.toJS()); // [1, 2, 3] [1, 2, 3, 4]
// 原生：返回被改变的值，改变元素本身
const test = [1, 2, 3, 4];
console.log(test.pop(), test); // 4 [1, 2, 3]
```

**4、花样插入**

```javascript
// interpose
// 插入xxx之间
console.log(Immutable.fromJS([1, 2, 5, 6]).interpose(5555).toJS()); // [1, 5555, 2, 5555, 5, 5555, 6]

// interleave
// 被操作的两个数组，每个的第一项、第二项、第三项... 组成新的数组。
console.log(Immutable.fromJS([1, 2, 5, 6]).interleave(Immutable.fromJS([555, 666])).toJS()); // [1, 555, 2, 666]

// zip
// 被操作的两个数组，抽离第一项和第二项组成新的子数组，放入到一个大数组中，形成二维数组。
console.log(Immutable.fromJS([1, 2, 5, 6]).zip(Immutable.fromJS([555, 666]).toJS())); // [ [1, 555], [2, 666]]

// 自定义插入规则。
// zipWith
console.log(Immutable.fromJS([1, 2, 5, 6]).zipWith((a, b) => {
    return a + b;
}, Immutable.fromJS([555, 666]).toJS())); // [ 556, 668]
```

### 删除元素

**1、delete(key)**

```javascript
// List
// delete(index: number)
// 删除 index 位置的元素
console.log(Immutable.fromJS([1, 2, 3]).delete(1).toJS(), $arr1.toJS());// [ 1, 3 ] [ 1, 2, 3]
console.log(Immutable.fromJS([1, 2, 3]).delete(77).toJS(), $arr1.toJS(), '超过范围不会强制报错');// [ 1, 2, 3] [ 1, 2, 3] 超过范围不会强制报错

// Map
console.log(Immutable.fromJS({a: {a1: 34}, b: 2, c: 3, d: 444}).delete('c').toJS(), $obj1.toJS());// {a: 1, b: 2, d: 444}  {a: 1, b: 2, c: 3, d: 444}
console.log(Immutable.fromJS({a: {a1: 34}, b: 2, c: 3, d: 444}).delete('asdfasfd').toJS(), $obj1.toJS());// {a: 1, b: 2, c: 3, d: 444} {a: 1, b: 2, c: 3, d: 444}
```

**2、deleteIn**

> 和 `setIn `使用方式一致

**3、清空元素 lear()**

```javascript
// List
console.log(Immutable.fromJS([1, 2, 3]).clear().toJS());// []

// Map
console.log(Immutable.fromJS({a: {a1: 34}, b: 2, c: 3, d: 444}).clear().toJS());// {}
```

### 修改元素

> 修改某一个元素

**1、set setIn**

> 上面已经介绍过

**2、update**

> update(key: K, notSetValue: V, updater: (value: V) => V): Map<K, V>

```javascript
// List
const $arr1 = Immutable.fromJS([1, 2, 3]);
console.log($arr1.update('2', (value)=> {
    return value * 2;
}).toJS(), $arr1.toJS());// [1, 2, 6] [1, 2, 3]

console.log($arr1.update('6', 1, (value)=> {
    return value * 2;
}).toJS(), $arr1.toJS());// [1, 2, 3, undefined, undefined, undefined, 2] [1, 2, 3]

console.log($arr1.update('6', 0, (value)=> { // 默认值必须大于0 感觉有BUG，所以还是不要用了。
    return value * 2;
}).toJS(), $arr1.toJS());// [1, 2, 3] [1, 2, 3]

// Map
const $obj1 = Immutable.fromJS({a: {a1: 34}, b: 2, c: 3, d: 444});
console.log($obj1.update('a', (value)=> {
    return value * 2;
}).toJS(), $obj1.toJS());// {a: 2, b: 2, c: 3, d: 444} {a: 1, b: 2, c: 3, d: 444}

console.log($obj1.update('e', 1, (value)=> {
    return value * 2;
}).toJS(), $obj1.toJS());//   {a: 1, b: 2, c: 3, d: 444, e: 2} {a: 1, b: 2, c: 3, d: 444}

console.log($obj1.update('e', 0, (value)=> { // 默认值入手是number必须大于0 感觉有BUG，所以还是不要用了。
    return value * 2;
}).toJS(), $obj1.toJS());//  {a: 1, b: 2, c: 6, d: 444} {a: 1, b: 2, c: 3, d: 444}
```

**3、updateIn**

> 使用方式和setIn一样。

### 获取某个元素值

**1、get getIn**

- 使用方式：`get(key: number, notSetValue?: T)`

```javascript
// List
const $test = Immutable.fromJS([1111111, 22222, {a: 888123}]);
console.log($test.get(0)); // 1111111

// 只有数组可以用 number 类型 的key
console.log(Immutable.fromJS({1: 'abc'}).get(1), Immutable.fromJS({1: 'abc'}).get('1'));// undefined "abc" | 只有数组可以用 number 类型 的key

// notSetValue 默认值，了解
console.log($test.get(11, 'no have value')); // no have value

// getIn
console.log($test.getIn(['2', 'a'], 'child no have value')); // 888123
console.log($test.getIn(['2', 'b'], 'child no have value')); // child no have value

// Map
const $test = Immutable.fromJS({a: {a1: 222}, b: 2, c: 3, d: 444});
console.log($test.get('a')); // 1111111

// notSetValue 默认值，了解
console.log($test.get('v', 'no have value')); // no have value

// getIn
console.log($test.getIn(['a', 'a1'], 'child no have value')); // 222
console.log($test.getIn(['d', 'b1'], 'child no have value')); // child no have value
```

**2、获取头、尾元素**

```javascript
// List
const $arr1 = Immutable.fromJS([1, 2, 3]);
console.log($arr1.first());// 1
console.log($arr1.last());// 3

// Map
Immutable.fromJS({a: {a1: 34}, b: 2, c: 3, d: 444});
console.log($obj1.first());// {a1: 34}
console.log($obj1.last());// 444
```

### 查找某个元素

**1、find() findLast()**

> `find()`、`findLast() `返回 `value`

```javascript
// List
console.log(Immutable.fromJS([1, 2, 56, {a: {b: 111}}]).find((value, index, array) => {
    return index === 3;
}).toJS());// {a: {b: 111}}

// Map
console.log(Immutable.fromJS({a: {a1: 222}, b: 2, c: 3, d: 444}).find((value, key, obj) => {
    return value === 3;
}));// 3
```

**2、findKey() findLastKey()**

> `findKey()`、`findLastKey()` 返回 `key`

```javascript
// List
console.log(Immutable.fromJS([1, 2, 3, {a: {b: 111}}]).findKey((value, index, array) => {
    return index === 3;
}));// 3

// Map
console.log(Immutable.fromJS({a: {a1: 222}, b: 2, c: 3, d: 444}).findKey((value, key, obj) => {
    return value === 3;
}));// c
```

**3、findEntry() findLastEntry()**

> `findEntry()`、`findLastEntry()` 返回 `key:value`

```javascript
// List
console.log(Immutable.fromJS([1, 2, 3, {a: {b: 111}}]).findEntry((value, index, array) => {
    return index === 3;
}));// [3, Map]

// Map
console.log(Immutable.fromJS({a: {a1: 222}, b: 2, c: 3, d: 444}).findEntry((value, key, obj) => {
    return Immutable.is(value, Immutable.fromJS({a1: 222}));
}));// ["a", Map]
```

**4、keyOf() lastKeyOf()**

> `keyOf()`、`lastKeyOf()` 根据 `value` 返回` key`。

```javascript
/ List
console.log(Immutable.fromJS([1, 2, 3, {a: {b: 111}}]).keyOf(Immutable.fromJS({a: {b: 111}}))); // 3
console.log(Immutable.fromJS([1, 2, 3, {a: {b: 111}}]).keyOf(2)); // 1

// Map
console.log(Immutable.fromJS({a: {a1: 222}, b: 2, c: 3, d: 444}).keyOf(Immutable.fromJS({a1: 222}))); // a
console.log(Immutable.fromJS({a: {a1: 222}, b: 2, c: 3, d: 444}).keyOf(2)); // b
```

### List 特有查找某个元素

**1、indexOf() lastIndexOf()**

```javascript
// 找不到 返回 -1
console.log(Immutable.fromJS([1, 2, 3, {a: {b: 111}}]).indexOf(Immutable.fromJS({a: {b: 111}}))); // 3
```

**2、findIndex() findLastIndex()**

```javascript
console.log(Immutable.fromJS([1, 2, 3, {a: {b: 111}}]).findIndex((value, index, array) => {
    return value/3 === 1;
})); // 2
```

### 查找最大、最小元素

> `max()`、`maxBy()`默认比较规则为`>`，`min()`、`minBy()`默认比较规则为`>`

**1、max()**

```javascript
// List
console.log(Immutable.fromJS([1, 2, 301, 88]).max()); // 301

// 自定义比较规则
console.log(Immutable.fromJS([1, 2, 301, 88]).max((valueA, valueB) => {
    return valueA > valueB;
})); // 301

// Map
console.log(Immutable.fromJS({a: 8888, b: 2, c: 3, d: 444}).max()); // 8888

// 自定义比较规则
console.log(Immutable.fromJS({a: 8888, b: 2, c: 3, d: 444}).max((valueA, valueB) => {
    return valueA > valueB;
})); // 8888
```

**2、maxBy()**

```javascript
// List
// 自定义比较的元素
console.log(Immutable.fromJS([{a: 2}, {a: 1}, {a: 2301}, {a: 222}]).maxBy((value, index, array) => {
    return value.get('a');
}).toJS());// {a: 2301}

// 自定义比较的元素，和比较规则
console.log(Immutable.fromJS([{a: 2}, {a: 1}, {a: 2301}, {a: 222}]).maxBy((value, index, array) => {
    return value.get('a');
}, (valueA, valueB) => {
    return valueA > valueB;
}).toJS());// {a: 2301}

// Map
// 自定义比较的元素
console.log(Immutable.fromJS({a: {a1: 222}, b: {a1: 11}, c: {a1: 33}, d: {a1: 54654}}).maxBy((value, key, obj) => {
    return value.get('a1');
}).toJS());//  {a1: 54654}

// 自定义比较的元素，和比较规则
console.log(Immutable.fromJS({a: {a1: 222}, b: {a1: 11}, c: {a1: 33}, d: {a1: 54654}}).maxBy((value, key, obj) => {
    return value.get('a1');
}, (valueA, valueB) => {
    return valueA > valueB;
}).toJS());// {a1: 54654}
```

**3、min()**

- 同`max()`

**4、minBy()**

- 同`maxBy()`

**5、keys() values() entries()**

> 获取`ES6 Iterable` 迭代器

```javascript
// List
const $test = List([11, 22, 33, 44]);

const keys = $test.keys();
for (let i of keys) {
    console.log(i);
}

const values = $test.values();
for (let i of values) {
    console.log(i);
}

const entries = $test.entries();
for (let i of entries) {
    console.log(i);
}
// Map
const $test = Immutable.fromJS({a: {a1: 222}, b: 2, c: 3, d: 444});

const keys = $test.keys();
for (let i of keys) {
    console.log(i); // a b c d
}

const values = $test.values();
for (let i of values) {
    console.log(i); // {a1: 222} 2 3 444
}

const entries = $test.entries();
for (let i of entries) {
    console.log(i);// ["a", Map] ["b", 2] ["c", 3] ["d", 444]
}
```

### 截取

**1、slice()**

> 和原生`Array slice()`用法一致

```javascript
// List
console.log(Immutable.fromJS([1, 2, 3]).slice(0).toJS());// [1, 2, 3]

// Map
console.log(Immutable.fromJS({a: {a1: 34}, b: 2, c: 3, d: 444}).slice(0).toJS());// {a: Object, b: 2, c: 3, d: 444}
console.log(Immutable.fromJS({a: {a1: 34}, b: 2, c: 3, d: 444}).slice(1).toJS());// {b: 2, c: 3, d: 444}
```

**2、rest() butLast()**

```javascript
/ List
// rest() 返回删除第一个元素后的 List
console.log(Immutable.fromJS([1, {a: 1}, 3, 4, 5, 6]).rest().rest().toJS()); // [{a: 1}, 3, 4, 5, 6]
// butLast() 返回删除最后一个元素后的 List
console.log(Immutable.fromJS([1, {a: 1}, 3, 4, 5, 6]).butLast().toJS()); // [1, {a: 1}, 3, 4, 5]

// Map
// rest() 返回删除第一个元素后的 Map
console.log(Immutable.fromJS({a: {a1: 222}, b: 2, c: 3, d: 444}).rest().rest().toJS()); // {c: 3, d: 444}
// butLast() 返回删除最后一个元素后的 Map
console.log(Immutable.fromJS({a: {a1: 222}, b: 2, c: 3, d: 444}).butLast().toJS()); // {a: {a1: 222}, b: 2, c: 3}
```

**3、skip() skipLast() skipWhile() skipUntil()**

```javascript
// List

// skip(number)
// 从头按照条件抛出number个元素，对剩余元素进行截取
// 参数 数量
console.log(Immutable.fromJS([1, {a: 1}, 3, 4, 5, 6]).skip(2).toJS()); // [3, 4, 5, 6]

// skipLast(number)
// 从尾部按照条件抛出number个元素，对剩余元素进行截取
// 参数 数量
console.log(Immutable.fromJS([1, {a: 1}, 3, 4, 5, 6]).skipLast(2).toJS()); // [1, {a: 1}, 3, 4]

// skipWhile()
// 从头开始循环，抛出满足 return 条件===true 的元素。
console.log(Immutable.fromJS([111, 33 , 22, 44, 55, 66]).skipWhile((value, index, array) => {
    return value > 31;
}).toJS()); // [22, 44, 55, 66]

// skipUntil()
// 从头开始循环，抛出满足 return 条件===false 的元素。
console.log(Immutable.fromJS([32, 33 , 40, 44, 55, 66]).skipWhile((value, index, array) => {
    return value < 39;// 抛出直到小于39的元素。
}).toJS()); // [40, 44, 55, 66]

// Map
// skip(number)
// 从头开始循环，抛出满足 return 条件===true 的元素。
// 参数 数量
console.log(Immutable.fromJS({a: {a1: 222}, b: 2, c: 3, d: 444}).skip(2).toJS()); // {c: 3, d: 444}

// skipLast(number)
// 从尾部按照条件抛出number个元素，对剩余元素进行截取
// 参数 数量
console.log(Immutable.fromJS({a: {a1: 222}, b: 2, c: 3, d: 444}).skipLast(2).toJS()); // {a: {a1: 222}, b: 2}

// skipWhile()
// 从头开始循环，抛出满足 return 条件===true 的元素。
console.log(Immutable.fromJS({a: 1, b: 2, c: 3, d: 444}).skipWhile((value, key, obj) => {
    return value === 1;
}).toJS()); // {b: 2, c: 3, d: 444}

// skipUntil()
// 从头开始循环，抛出满足 return 条件===false 的元素。
console.log(Immutable.fromJS({a: 5, b: 2, c: 3, d: 444}).skipWhile((value, key, obj) => {
    return value < 39;// 抛出直到小于39的元素。
}).toJS()); // {d: 444}
```

**4、take() takeLast() takeWhile() takeUntil()**

```javascript
// List
// take(number)
// 从头获取几个复合条件的元素
// 参数 数量
console.log(Immutable.fromJS([1, {a: 1}, 3, 4, 5, 6]).take(2).toJS()); // [1, {a: 1}]

// takeLast(number)
// 从尾部获取几个复合条件的元素
// 参数 数量
console.log(Immutable.fromJS([1, {a: 1}, 3, 4, 5, 6]).takeLast(2).toJS()); // [5, 6]

// takeWhile()
// 从头开始循环，获取满足 return 条件===true 的元素。
console.log(Immutable.fromJS([111, 33 , 22, 44, 55, 66]).takeWhile((value, index, array) => {
    return value > 31;
}).toJS()); //[111, 33]

// takeUntil()
// 从头开始循环，获取满足 return 条件===false 的元素。
console.log(Immutable.fromJS([32, 33 , 40, 44, 55, 66]).takeUntil((value, index, array) => {
    return value > 41;
}).toJS()); //[32, 33 , 40]

// Map
// take(number)
// 从头获取几个复合条件的元素
// 参数 数量
console.log(Immutable.fromJS({a: 5, b: 2, c: 3, d: 444}).take(2).toJS()); // {a: 5, b: 2}

// takeLast(number)
// 从尾部获取几个复合条件的元素
// 参数 数量
console.log(Immutable.fromJS({a: 5, b: 2, c: 3, d: 444}).takeLast(2).toJS()); // {c: 3, d: 444}

// takeWhile()
// 从头开始循环，获取满足 return 条件===true 的元素。
console.log(Immutable.fromJS({a: 5, b: 2, c: 3, d: 444}).takeWhile((value, key, obj) => {
    return value > 2;
}).toJS()); //{a: 5}

// takeUntil()
// 从头开始循环，获取满足 return 条件===false 的元素。
console.log(Immutable.fromJS({a: 5, b: 2, c: 3, d: 444}).takeUntil((value, key, obj) => {
    return value > 39;
}).toJS()); //{a: 5, b: 2, c: 3}
```

### 循环遍历

**1、map() filter() every() some() forEach() reduce() reduceRight()**

```javascript
// List
//1. map()
console.log(Immutable.fromJS([1, 2, 3, 4, 5]).map((value, index, array)=>{
    return value * 2;
}).toJS()); // [2, 4, 6, 8, 10]

//2. filter()
console.log(Immutable.fromJS([1, 2, 3, 4, 5]).filter((value, index, array)=>{
    return value % 2 === 0;
}).toJS()); // [2, 4]
// filterNot() ...这个没有什么卵用

//3. every()
console.log(Immutable.fromJS([1, 2, 3, 4, 5]).every((value, index, array)=>{
    return value > 2;
})); // false

//4. some()
console.log(Immutable.fromJS([1, 2, 3, 4, 5]).some((value, index, array)=>{
    return value > 2;
})); // true

//5. forEach() 返回迭代的条目数（包括返回false的最后一个迭代）
// 与Array 的 forEach不同，如果sideEffect的任何调用返回false，迭代将停止。 返回迭代的条目数（包括返回false的最后一个迭代）。
console.log(Immutable.fromJS([1, 2, 3, 4, 5, {a: 123}]).forEach((value, index, array)=>{
    console.log(value, index, array.toJS(), 'forEach');
    return value < 5;
})); // 5

//6. reduce()
// 同原生用法
//7. reduceRight()
// 同原生用法

// Map
//1. map()
console.log(Immutable.fromJS({a: 5, b: 2, c: 3, d: 444}).map((value, key, obj)=>{
    return value * 2;
}).toJS()); // {a: 10, b: 4, c: 6, d: 888}

//2. filter()
console.log(Immutable.fromJS({a: 5, b: 2, c: 3, d: 444}).filter((value, key, obj)=>{
    return value % 2 === 0;
}).toJS()); // {b: 2, d: 444}
// filterNot() ...这个没有什么卵用

//3. every()
console.log(Immutable.fromJS({a: 5, b: 2, c: 3, d: 444}).every((value, key, obj)=>{
    return value > 2;
})); // false

//4. some()
console.log(Immutable.fromJS({a: 5, b: 2, c: 3, d: 444}).some((value, key, obj)=>{
    return value > 2;
})); // true

//5. forEach() 返回迭代的条目数（包括返回false的最后一个迭代）
// 与Array 的 forEach不同，如果sideEffect的任何调用返回false，迭代将停止。 返回迭代的条目数（包括返回false的最后一个迭代）。
console.log(Immutable.fromJS({a: 5, b: 2, c: 3, d: 444}).forEach((value, key, obj)=>{
    return value < 444;
})); // 4

//6. reduce()
// 同原List用法
//7. reduceRight()
// 同List用法
```

### Map 特有 mapKeys() mapEntries()

> 对`Map`元素进行处理，返回处理后的对象

```javascript
//mapKeys() 返回对象
console.log(Immutable.fromJS({a: 5, b: 2, c: 3, d: 444}).mapKeys((key)=>{
    return key + 'hhh';
}).toJS());
// {ahhh: 5, bhhh: 2, chhh: 3, dhhh: 444}

//mapEntries() 返回对象
console.log(Immutable.fromJS({a: 5, b: 2, c: 3, d: 444}).mapEntries(([key, value])=>{
    return [key + 'aaa', value+'hhhh'];
}).toJS());//   {aaaa: "5hhhh", baaa: "2hhhh", caaa: "3hhhh", daaa: "444hhhh"}
```


### merge

**merge() mergeDeep() mergeWith() mergeDeepWith()**

```javascript
// List
const $test = Immutable.fromJS([1, 2, 3, 7, {a: {b: 55, c: 66}}]);
const $test1 = Immutable.fromJS([1, 2, 3, 6, {a: {b: 333, d: 67}}]);

// 浅merge
console.log($test.merge($test1).toJS(), $test.toJS());
// $test1 -> $test [1, 2, 3, 6, {b: 333, d: 67}] [1, 2, 3, 7, {a: {b: 55, c: 66}}]
// 深merge
console.log($test.mergeDeep($test1).toJS(), $test.toJS());
// $test1 -> $test [1, 2, 3, 6, {b: 333, c: 66, d: 67}] [1, 2, 3, 7, {a: {b: 55, c: 66}}]

// 浅merge自定义merge规则
console.log($test.mergeWith((prev, next)=> {
    // 自定义转换
    return prev;
}, $test1).toJS(), $test1.toJS());
// 深merge自定义merge规则
console.log($test.mergeDeepWith((prev, next)=> {
    // 自定义转换
    return prev;
}, $test1).toJS(), $test1.toJS());

// Map
const $test = Immutable.fromJS({a: {a1: 222, a3: 456}, b: 2, c: 3, d: 444});
const $test1 = Immutable.fromJS({a: {a1: 222, a2: 234}, b: 2, c: 3, d: 444});

// 浅merge
console.log($test.merge($test1).toJS(), $test.toJS());
// $test1 -> $test {a: {a1: 222, a2: 234}, b: 2, c: 3, d: 444} {a: {a1: 222, a3: 456}, b: 2, c: 3, d: 444}
// 深merge
console.log($test.mergeDeep($test1).toJS(), $test.toJS());
// $test1 -> $test {a: {a1: 222, a2: 234, a3: 456}, b: 2, c: 3, d: 444} {a: {a1: 222, a3: 456}, b: 2, c: 3, d: 444}

// 浅merge自定义merge规则
console.log($test.mergeWith((prev, next)=> {
    // 自定义转换
    return prev;
}, $test1).toJS(), $test1.toJS());
// 深merge自定义merge规则
console.log($test.mergeDeepWith((prev, next)=> {
    // 自定义转换
    return prev;
}, $test1).toJS(), $test1.toJS());
```


### jonin() 转换为字符串

> 使用方式和原生`Array`的`join()`一样


```javascript
// List
console.log(Immutable.fromJS([1, 2, 3, {a: 123, b: 321}]).join()); // 1,2,3,Map { "a": 123, "b": 321 }
// Map
console.log(Immutable.fromJS({b: 2, a: {a1: 222, a3: 456}, c: 3, d: 444}).join()); // 2,Map { "a1": 222, "a3": 456 },3,444
```

### isEmpty() 判空

```javascript
// 判断空List
console.log(Immutable.fromJS([]).isEmpty()); // true
// 判断Map是否为空 比原生方便
console.log(Immutable.fromJS({}).isEmpty()); // true
```

### has() hasIn() 检查是否有某个key

```javascript
// List
console.log(Immutable.fromJS([1, 2, 3, {a: 123, b: 321}]).has('0')); // true
console.log(Immutable.fromJS([1, 2, 3, {a: 123, b: 321}]).hasIn([3, 'b'])); // true

// Map
console.log(Immutable.fromJS({b: 2, a: {a1: 222, a3: 456}, c: 3, d: 444}).has('a')); // true
console.log(Immutable.fromJS({b: 2, a: {a1: 222, a3: 456}, c: 3, d: 444}).hasIn(['a', 'a3'])); // true
```

### includes() 是否包含某些元素

> `includes()`、`contains() `这俩等效

```javascript
// List
// 对象是否包含某个元素，对Immutable元素使用Immutable.is 进行比较
console.log(Immutable.fromJS([6, 5, 4, 3, 2, 1, 89]).includes('89'));// 数组没有字符89，所以返回 false
console.log(Immutable.fromJS([6, 5, 4, 3, 2, 1, '89']).contains('89'));// true
console.log(Immutable.fromJS([6, 5, 4, 3, 2, 1, Immutable.fromJS([6, 5, 4])]).contains(Immutable.fromJS([6, 5, 4])));// true

// Map
// 对象是否包含某个元素，对Immutable元素使用Immutable.is 进行比较
console.log(Immutable.fromJS({b: 2, a: {a1: 222, a3: 456}, c: 3, d: 89}).includes('89'));// 数组没有字符89，所以返回 false
console.log(Immutable.fromJS({b: 2, a: {a1: 222, a3: 456}, c: 3, d: '89'}).contains('89'));// true
console.log(Immutable.fromJS({b: 2, a: {a1: 222, a3: 456}, c: 3, d: Immutable.fromJS([6, 5, 4])}).contains(Immutable.fromJS([6, 5, 4])));// true
```

### isSubset() 子集判断

```javascript
// List
// isSubset()
console.log(Immutable.fromJS([6, 5, 1, [6, 5, 4]]).isSubset(Immutable.fromJS([[6, 5, 4], 6, 5, 4, 3, 2, 1, '89'])));// true
// isSuperset 就是 isSubset 参数掉个个儿
console.log(Immutable.fromJS([[6, 5, 4], 6, 5, 4, 3, 2, 1, '89']).isSuperset(Immutable.fromJS([6, 5, 1, [6, 5, 4]])));// true

// Map
// isSubset()
console.log(Immutable.fromJS({b: 2, a: {a1: 222, a3: 456}}).isSubset(Immutable.fromJS({b: 2, a: {a1: 222, a3: 456}, c: 3, d: 5})));// true
// isSuperset 就是 isSubset 参数掉个个儿
console.log(Immutable.fromJS({b: 2, a: {a1: 222, a3: 456}, c: 3, d: 5}).isSuperset(Immutable.fromJS({b: 2, a: {a1: 222, a3: 456}})));// true
```


### reverse() 反转

```javascript
// List
console.log(Immutable.fromJS([1, 2, 3, 4, 5, 6]).reverse().toJS());
// [6, 5, 4, 3, 2, 1]
// Map
console.log(Immutable.fromJS({b: 2, a: {a1: 222, a3: 456}, c: 3, d: 5}).reverse().toJS());
// {d: 5, c: 3, a: {a1: 222, a3: 456}, b: 2}
```

### 排序

> `sort()`和`sortBy()`

```javascript
// List
// sort(comparator?: (valueA: V, valueB: V) => number): Iterable<K, V>
console.log(Immutable.fromJS([6, 5, 4, 3, 2, 1]).sort().toJS());
// 传入比较函数
console.log(Immutable.fromJS([1, 2, 3, 4, 5, 6]).sort((a, b) => {
    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }
    if (a === b) {
        return 0;
    }
}).toJS());
// sortBy
/*
    sortBy<C>(
    comparatorValueMapper: (value: T, key: number, iter: Iterable<number, T>) => C,
    comparator?: (valueA: C, valueB: C) => number
    ): Iterable<number, T>
    */
console.log(Immutable.fromJS([{a: 1, b: {c: 22}}, {a: 2, b: {c: 22}}, {a: 1, b: {c: 22}},
    {a: 3, b: {c: 22}}, {a: 10, b: {c: 22}}, {a: 9, b: {c: 22}}]).sortBy((value, index, array)=> {
    return value.get('a')
},(a, b) => {
    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }
    if (a === b) {
        return 0;
    }
}).toJS());

// Map
console.log(Immutable.fromJS({b: 2, a: 88, c: 3, d: 5}).sort().toJS());// {b: 2, c: 3, d: 5, a: 88}
// 传入比较函数
console.log(Immutable.fromJS({b: 2, a: 88, c: 3, d: 5}).sort((a, b) => {
    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }
    if (a === b) {
        return 0;
    }
}).toJS());// {b: 2, c: 3, d: 5, a: 88}
// sortBy
/*
sortBy<C>(
comparatorValueMapper: (value: T, key: number, iter: Iterable<number, T>) => C,
comparator?: (valueA: C, valueB: C) => number
): Iterable<number, T>
*/
console.log(Immutable.fromJS({b: {a: 2}, a: {a: 88}, c: {a: 3}, d: {a: 5}}).sortBy((value, key, obj)=> {
    return value.get('a')
},(a, b) => {
    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }
    if (a === b) {
        return 0;
    }
}).toJS());// {b: {a: 2}, c: {a: 3}, d: {a: 5}, a: {a: 88}}
```


### flatten() 平铺

> 参数默认情况下，`false` 深度平铺，`true` 浅度平铺1层


```javascript
// List
console.log(Immutable.fromJS([1, 2, 3, 4, [1, 11, 111, 12344], {a: 1234, b: {bb: [777, 888]}}, 5, 6]).flatten().toJS());
// [1, 2, 3, 4, 1, 11, 111, 12344, 1234, 777, 888, 5, 6]
console.log(Immutable.fromJS([1, 2, 3, 4, [1, 11, 111, 12344], {a: 1234, b: {bb: [777, 888]}}, 5, 6]).flatten(true).toJS());
// [1, 2, 3, 4, 1, 11, 111, 12344, 1234, Object, 5, 6]

// Map
console.log(Immutable.fromJS({b: 2, a: {a1: {a5: 333}, a3: [1,2,3]}, c: 3, d: 5}).flatten().toJS());
// {0: 1, 1: 2, 2: 3, b: 2, a5: 333, c: 3, d: 5}
console.log(Immutable.fromJS({b: 2, a: {a1: {a5: 333}, a3: [1,2,3]}, c: 3, d: 5}).flatten(true).toJS());
// {b: 2, a1: Object, a3: Array[3], c: 3, d: 5}
```

### groupBy() 分组

> 返回值是`OrderedMap`

```javascript
// List
console.log(Immutable.fromJS([{v: 0, a: 111}, {v: 1, a: {b: [1, 2, 3]}}, {v: 1, a: 333}, {v: 0, a: {b: [1, 2, 3]}}, {v: 1, a: 333}]).groupBy((value) => {
    return value.get('a')
}).toJS());
// OrderedMap {111: Array[1], 333: Array[2], Map { "b": List [ 1, 2, 3 ] }: Array[2]}

// Map
console.log(Immutable.fromJS({b: {a5: 333}, a: {a5: 333}, c: {a5: 334}, d: {a5: 334}}).groupBy((value) => {
    return value.get('a5')
}).toJS());
// OrderedMap  {333: {b: {a5: 333}, a: {a5: 333}}, 334: {c: {a5: 334}, d: {a5: 334}}}
```

### flip() Map 特有翻转

```javascript
console.log(Immutable.fromJS({b: 'b1', a: 'a1', c: 'c1', d: 'd1'}).flip().toJS()); // {b1: "b", a1: "a", c1: "c", d1: "d"}
```

### 连接 concat()

```javascript
// List
const $test1 = Immutable.fromJS([1, 2, 3, 4, 5, 6]);
const $test2 = Immutable.fromJS([111, 222, 333, 444, 555, 666]);
console.log($test1.concat($test2).toJS()); //[1, 2, 3, 4, 5, 6, 111, 222, 333, 444, 555, 666]
console.log($test1.toJS(), $test2.toJS()); //[1, 2, 3, 4, 5, 6] [111, 222, 333, 444, 555, 666]

// Map
const $test1 = Immutable.fromJS({b: 2, a: {a1: {a5: 333}, a3: [1,2,3]}, c: 3, d: 5});
const $test2 = Immutable.fromJS({b1: 22, b: 34});
console.log($test1.concat($test2).toJS()); //{b: 34, a: Object, c: 3, d: 5, b1: 22} 属性 b 被覆盖
console.log($test1.toJS(), $test2.toJS()); //{b: 2, a: {a1: {a5: 333}, c: 3, d: 5} b1: 22, b: 34}
```

### 类型转换

**1、转换为原生类型**

```javascript
// List
// 浅层
// toArray
console.log(Immutable.fromJS([1, 2, 3, 4, 5, 6, {a: {b: [1234, 22]}}]).toArray());// [1, 2, 3, 4, 5, 6, Map]
console.log(Immutable.fromJS([1, 2, 3, 4, 5, 6, [1234, 22]]).toArray());// [1, 2, 3, 4, 5, 6, List]
// toObject
console.log(Immutable.fromJS([1, 2, 3, 4, 5, 6, {a: {b: [1234, 22]}}]).toObject());// {0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: Map}
console.log(Immutable.fromJS([1, 2, 3, 4, 5, 6, [1234, 22]]).toObject());// {0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: List}
//深层
// 就是一直在用的 toJS(); 不到万不得已，尽量不用。

// Map
// 浅层
// toArray
console.log(Immutable.fromJS({b: 2, a: {a1: {a5: 333}, a3: [1,2,3]}, c: 3, d: 5}).toArray());// [2, Map, 3, 5]
console.log(Immutable.fromJS({b: 2, a: [1, 2, 2], c: 3, d: 5}).toArray());// [2, List, 3, 5]
// toObject
console.log(Immutable.fromJS({b: 2, a: {a1: {a5: 333}, a3: [1,2,3]}, c: 3, d: 5}).toObject());// {b: 2, a: Map, c: 3, d: 5}
console.log(Immutable.fromJS({b: 2, a: [1, 2, 2]}).toObject());// {b: 2, a: List}
//深层
// 就是一直在用的 toJS(); 不到万不得已，尽量不用。
```

**2、转换为其他ImmutableJS数据类型**

```javascript
// toMap()
// toOrderedMap()
// toSet()
// toOrderedSet()
// toList()
// toStack()
```

## 七、和React Redux 架构的结合

> 利用 `immutable.js` 不可变的特性，可以极大的优化`React render`的冗余执行。`React` 官方提供的`PureRenderMixin`是浅比较


**1、immutable-pure-render-decorator**

> 专门针对`immutable`的`PureRenderMixin`，用来装饰`React`组件

```javascript
import {React} from 'base';

import pureRenderDecorator from '../../../widgets/libs/immutable-pure-render-decorator';

@pureRenderDecorator
export default class PartA extends React.Component {
    constructor(props) {
        super(props);
        // 舍弃React.addons.PureRenderMixin
        // this.shouldComponentUpdate = React.addons.PureRenderMixin.shouldComponentUpdate.bind(this);
    }

    render() {
        console.log('组件PartA，render执行了');
        const data = this.props.data;
        return (
            <section>
                <div>
                    <p>我是组件PartA</p>
                    <p>{data.toJSON ? JSON.stringify(data.toJSON()) : data}</p>
                </div>
            </section>
        )
    }
}
```

**2、优化shouldComponentUpdate()**

> 我们都知道官方提供的`React.addons.PureRenderMixin`提供的`shouldComponentUpdate()`，只能进行浅比较，对于引用类型`Object`、`Array`比较无力，而如果使用`Immutable`的`Map`和`List`替换`Object`、`Array`，则可以使用`Immutable.is()`来比较两个引用类型，从而补充了`React.addons.PureRenderMixin`的漏洞。

**3、高阶组件封装**

> 对于使用`immutable.js`的项目，在应用公共组件的时候，由于公共组件的内部实现一定是原`生`JS`数据，所以我们只能传递原生`JS`数据到公共组件，但是如果转换成了原生`JS`数据，就又会出现"`React.addons.PureRenderMixin`提供的`shouldComponentUpdate()`是浅比较"问题，对此可以使用下面的高阶组件进行封装

```javascript
import {React} from 'base';
// 通过Immutable.is 封装过的 shouldComponentUpdate
import {shouldComponentUpdate} from '../immutable-pure-render-decorator';

export default ComposedComponent => {
    return class extends React.Component {
        constructor(props) {
            super(props);
            this.shouldComponentUpdate = shouldComponentUpdate.bind(this);
        }
        render() {
            const props = this.props.toJS ? this.props.toJS() : this.props;
            return <ComposedComponent {...this.props} {...props} />;
        }
    }
};
```

**3、Demo**

```javascript
import {React} from 'base';
import { connect } from 'react-redux';
import highComponent from '../../../../widgets/libs/utils/highComponent';
import actions from '../../actions';

// 公共组件
import Dialog from '@alife/dialog';

// import Immutable from 'immutable';
function mapStateToProps(state) {
    return {
        open: state.getIn(['dialog', 'open']),
        title: state.getIn(['dialog', 'title'])
    }
}

function mapDispatchToProps(dispatch) {
    return {
        onPrimaryTouchTap: ()=> {
            dispatch(actions.toggleDialog(false));
        },
        onSecondaryTouchTap: ()=> {
            dispatch(actions.toggleDialog(false));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(highComponent(Dialog))//通过高阶组件封装
```


## 八、思维导图总结API


- https://www.processon.com/view/link/5a12c0ede4b0d53d979b33da


## 九、更多参考

- facebook.github.io/immutable-js/docs/


