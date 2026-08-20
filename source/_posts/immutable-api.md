---
title: 梳理Immutable常用API 从fromJS到merge的完整清单
description: 把 Immutable.js 里真正会用到的 API 按「进出、读、改、找、切、算」六类归拢，每个方法配可跑的例子和边界说明，顺带说清 merge 和 mergeDeep 的区别。
date: 2018-02-04 16:10:24
tags: 
 - Immutable
 - react
 - 不可变数据
categories: Front-End
---

在 React 项目里用 Immutable.js，最容易卡住的不是概念，是 API 太多记不住。官方文档一屏几十个方法，`get` / `getIn`、`set` / `setIn`、`merge` / `mergeDeep` / `mergeIn` / `mergeDeepIn` 排在一起，看完只记得住一个 `fromJS`。这篇把日常真正会用到的方法按「数据怎么进出、怎么读、怎么改、怎么找、怎么切、怎么算」六类归拢了一遍，每个方法都配一个能直接跑的例子，容易踩的边界也标出来。当速查表用就行，不用背。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `fromJS` 和 `toJS` 这两个出入口，以及自定义转换的 reviver 怎么写
- 为什么比较两个 Immutable 对象要用 `is` 而不是 `===`
- `List` 和 `Map` 的创建、类型判断、取长度
- 读数据的 `get` / `getIn` / `has` / `includes` / `first` / `last`
- 改数据的 `set` / `setIn` / `update` / `deleteIn` / `clear`，以及 `List` 的增删方法
- `merge` 家族六个方法，浅合并和深合并到底差在哪
- 序列算法：`map` / `filter` / `sort` / `groupBy` 这些和原生数组的差别
- 查找、切子集、聚合计算这三类方法的完整清单
- 2018 年之后这个库的现状，以及现在更常见的替代方案

## 一、先说清楚这些 API 的共同点

在翻方法清单之前，有一条规则必须先立住：**Immutable 的所有「修改」方法都不改原对象，它们返回一个新对象**。

```javascript
const map1 = Immutable.Map({ a: 1 });
const map2 = map1.set('a', 2);

console.log(map1.get('a')); // 1，原对象没动
console.log(map2.get('a')); // 2
```

这条规则贯穿下面每一个方法。`push`、`pop`、`sort`、`reverse` 这些在原生数组里会改原数组的方法，在 Immutable 里全都是返回新对象。所以写的时候千万别丢掉返回值，`list.push(5)` 这一行单独写等于什么都没干。这个坑我踩过，排查了半天发现是漏了赋值。

另一件事是性能。你可能担心每次都造新对象会不会很贵，其实不会，Immutable 内部用的是结构共享，没变的那部分子树是直接复用引用的。这块的原理我在 [Immutable之回顾](https://feinterview.poetries.top/blog/immutable-review) 那篇里展开讲了，这篇专注在 API 上。

## 二、fromJS

作用：是最最常用的将原生 JS 数据转换为 `ImmutableJS` 数据的转换方法，默认将原生 `JS` 的 `Array` 转为 `List`，`Object` 转为 `Map`。

它是深转换，嵌套多少层就转多少层：

```javascript
Immutable.fromJS({
  a: {
    b: [1, 2, 3],
    c: 40
  }
});
// 得到
Map {
  "a": Map {
    "b": List [1, 2, 3],
    "c": 40
  }
}

// 常见
const t1 = Immutable.fromJS({a: {b: [10, 20, 30]}, c: 40});
console.log(t1);
```

第二个参数是一个自定义转换函数（reviver），用得不多，但知道有这么个口子有好处。它会自底向上被调用一遍，让你决定每一层转成什么结构：

```javascript
// 不常用
const t2 = Immutable.fromJS({a: {b: [10, 20, 30]}, c: 40}, function(key, value) {
    // 定制转换方式，下这种就是将Array转换为List，Object转换为OrderedMap
    const isIndexed = Immutable.Iterable.isIndexed(value);
    return isIndexed ? value.toList() : value.toOrderedMap();
    // true, "b", {b: [10, 20, 30]}
    // false, "a", {a: {b: [10, 20, 30]}, c: 40}
    // false, "", {"": {a: {b: [10, 20, 30]}, c: 40}}
});
console.log(t2);
```

注释里那三行是调用顺序，从最内层的 `b` 开始，一层层往外，最后一次的 key 是空字符串，代表根节点。这里默认把对象转成了 `OrderedMap` 而不是 `Map`，区别是前者保留插入顺序，遍历时顺序是确定的。

这里有个版本上的坑要注意，`Immutable.Iterable` 是 3.x 的写法。后来的版本把 `Iterable` 改名成了 `Collection`，判断函数也提到了顶层。跑不通的话看一眼你装的是哪个大版本，以官方文档为准，我这里保留 3.x 的原始写法。

`fromJS` 的代价是遍历整棵结构，数据量大的时候别在渲染里反复调用。

## 三、toJS

作用：将一个 `Immutable` 数据转换为 `JS` 类型的数据。用法：`value.toJS()`。

它和 `fromJS` 一样是深转换，整棵结构都会被还原成原生对象和数组。

正因为是深转换，`toJS()` 是个开销不小的操作，而且每次调用都返回全新的对象。所以在 React 里千万别在 `render` 里直接写 `this.props.data.toJS()`，每次渲染都会得到一个新引用，`PureComponent` 的浅比较必然判定为「变了」，你用 Immutable 换来的那点优化全被抵消掉。要取值就一路用 `get` / `getIn`，只在真正要交给第三方库的时候才转。

顺带提一句，如果只想转一层，用 `toObject()` 或 `toArray()`，它们不会递归。

## 四、is

作用：对两个对象进行比较。用法：`is(map1, map2)`。

```javascript
import { Map, is } from 'immutable'
const map1 = Map({ a: 1, b: 1, c: 1 })
const map2 = Map({ a: 1, b: 1, c: 1 })

map1 === map2   //false

Object.is(map1, map2) // false

is(map1, map2) //  true 只检测值是否相等
```

为什么 `===` 是 `false`？因为两次 `Map()` 造出来的是两个不同的对象，引用当然不同。`is` 做的是值比较，它先试引用相等，不等就调用两边的 `equals` 方法，Immutable 结构的 `equals` 会递归比较内容。

那既然有 `is`，为什么大家还是说用了 Immutable 就能用 `===` 做优化？因为在正常的数据流里，你只会通过 `set` / `merge` 这些方法产生新对象，没改动的部分引用会被原样复用。同一份数据没动过，拿到的就是同一个引用，`===` 直接为 `true`。`is` 是给「两个来源不同但内容可能相同」的对象准备的兜底。

这套判断和普通 JS 对象的深拷贝、深比较是两条路子，如果你还在手写深拷贝来做状态隔离，可以对比着看 [JS深拷贝的几种实现](https://feinterview.poetries.top/blog/js-deep-copy)。

## 五、List 和 Map

### 5.1 创建

- `List` 有序索引密集的集合，和 `JS` 中的 `Array` 很像 
- `Map` 无序索引集，类似 `JavaScript` 中的 `Object`

「无序」这个词要理解准确。`Map` 不保证遍历顺序和你插入的顺序一致，如果业务上依赖顺序，用 `OrderedMap`。同理 `List` 之外还有 `Set` 和 `OrderedSet`，需要去重时用得上。

### 5.2 判断

`List.isList()` 和 `Map.isMap()` 判断一个数据结构是不是 `List/Map` 类型。

这两个方法在写通用工具函数时很有用，比如你要写一个「递归遍历任意 Immutable 结构」的函数，就得靠它们分流。

### 5.3 长度

#### 5.3.1 `size` 获取 `List/Map` 的长度

`size` 是属性不是方法，别写成 `size()`：

```javascript
// list
console.log(List([1,2,3,4]).size);// 4
console.log(List.of(1, 2, 3, 4).size);// 4

// map
console.log(Map({key: "value2", key1: "value1"}).size);// 2
console.log(Map.of({x:1}, 2, [3], 4).size);// 2
```

`List([1,2,3,4])` 和 `List.of(1,2,3,4)` 的区别和原生 `Array` 的那对一样，前者接一个可迭代对象，后者接零散参数。`Map.of` 接的是键值交替的参数列表，所以 `Map.of({x:1}, 2, [3], 4)` 是两组键值对，size 为 2。

#### 5.3.2 count()

`count()` 是方法，不传参数时和 `size` 等价。它的价值在于可以传一个判断函数，只统计满足条件的元素：

```javascript
// map
console.log(Immutable.fromJS({key: "value2", key1: "value1"}).count());// 2
// 可以定制条件，来确定大小
console.log(Immutable.fromJS({key: 1, key1: 34}).count((value, key, obj) => {
    return value > 3;
}));// 1 只有 34 大于 3

// list
console.log(Immutable.fromJS([1, 2, 5, 6]).count());// 4
// 可以指定条件，来确定大小
console.log(Immutable.fromJS([1, 2, 5, 6]).count((value, index, array) => {
    return value > 3;
}));// 2 大于3的有两个
```

先说结论，能用 `size` 就用 `size`，它是缓存好的，读起来是常数时间；`count()` 带条件时要遍历一遍。

### 5.4 数据读取

#### 5.4.1 `get()` 和 `getIn()` 

获取数据结构中的数据。`get` 取一层，`getIn` 接一个路径数组取深层，路径中间断了会返回 `undefined` 而不是报错，这点比原生对象取值省心得多。

`getIn(['a', 'b', 'c'], defaultValue)` 还能传第二个参数当兜底值，取不到就返回它。

#### 5.4.2 `has()` 和 `hasIn()` 

判断是否存在某一个 `key`：

```javascript
Immutable.fromJS([1,2,3,{a:4,b:5}]).has('0'); //true
Immutable.fromJS([1,2,3,{a:4,b:5}]).has(0); //true 字符串下标会被转成数字索引
Immutable.fromJS([1,2,3,{a:4,b:5}]).hasIn([3,'b']) //true
```

`List` 上的 `has` 判断的是下标存不存在，不是值。这里 `'0'` 和 `0` 都返回 `true`，因为内部会把能转成合法索引的字符串转成数字。

#### 5.4.3 `includes()`

判断是否存在某一个 `value`：

```javascript
Immutable.fromJS([1,2,3,{a:4,b:5}]).includes(2); //true
Immutable.fromJS([1,2,3,{a:4,b:5}]).includes('2'); //false 不包含字符2
Immutable.fromJS([1,2,3,{a:4,b:5}]).includes(5); //false 
Immutable.fromJS([1,2,3,{a:4,b:5}]).includes({a:4,b:5}) //false
Immutable.fromJS([1,2,3,{a:4,b:5}]).includes(Immutable.fromJS({a:4,b:5})) //true
```

最后两行是这个方法最容易踩的地方。传一个原生对象进去永远是 `false`，因为 `includes` 内部用的是 `is` 比较，而原生对象和 Immutable Map 不可能相等。要判断嵌套结构存不存在，得先把参数也 `fromJS` 一遍。第三行的 `5` 返回 `false` 也是同理，`5` 是嵌套在子 Map 里的值，`includes` 只看直接子元素。

#### 5.4.4 `first()` 和 `last()` 

用来获取第一个元素或者最后一个元素，若没有则返回 `undefined`：

```javascript
Immutable.fromJS([1,2,3,{a:4,b:5}]).first()//1
Immutable.fromJS([1,2,3,{a:4,b:5}]).last()//Map {a:4,b:5}

Immutable.fromJS({a:1,b:2,c:{d:3,e:4}}).first() //1
Immutable.fromJS({a:1,b:2,c:{d:3,e:4}}).last() //Map {d:3,e:4}
```

注意 `last()` 拿到的是一个 Map 而不是原生对象，想看原始形态还得 `.toJS()`。在 `Map` 上用 `first` / `last` 要小心，前面说过它不保证顺序。

### 5.5 数据修改

#### 5.5.1 `set()` 

设置第一层 `key`、`index` 的值：

```javascript
// Map
// 将 key 位置的元素替换为 value
const $obj1 = Map({a: {a1: 34}, b: 2, c: 3, d: 444});
console.log($obj1.set('a', 0).toJS()); // {a: 0, b: 2, c: 3, d: 444}
console.log($obj1.set('e', 99).toJS());  // {a: {a1: 34}, b: 2, c: 3, d: 444, e: 99}

// List
// 将 index 位置的元素替换为 value，即使索引越界也是安全的, 空位 undefined
const $arr1 = List([1, 2, 3]);
console.log($arr1.set(-1, 0).toJS()); // [1, 2, 0]  注意-1 等效于 $arr1.set($arr1.size + -1, 0)
console.log($arr1.set(4, 0).toJS());  // [ 1, 2, 3, undefined, 0 ]  空位置为undefined
```

两个行为要记住。负索引是从尾部数的，`set(-1, x)` 改的是最后一个元素。越界不报错，会自动补 `undefined` 把中间填上，`List` 的长度直接跟着涨到 5。这个和原生数组的稀疏行为不一样，原生数组是真的留空洞，这里是实打实的 `undefined` 元素。

另外提醒一句，`Map({a: {a1: 34}})` 这样直接用 `Map()` 构造，里面那层 `{a1: 34}` 还是原生对象，没有被转换。要整棵转得用 `fromJS`。

#### 5.5.2 `setIn()` 

设置深层结构中某属性的值：

```javascript
// Map
console.log(Immutable.fromJS({a: {b: {c: 1}}}).setIn(['a', 'b', 'c'], 100).toJS());//{a: {b: {c: 100}}}

// List
console.log(Immutable.fromJS([1, 2, 3, {a: 45, b: 64}]).setIn(['3', 'a'], 1000).toJS());//[1, 2, 3, {a: 1000, b: 64}]
```

路径数组里既可以放 Map 的 key，也可以放 List 的下标，混着写没问题。上面 List 那行用的是字符串 `'3'`，一样能命中，原因和 `has('0')` 相同。

`setIn` 的返回值只有路径上那几个节点是新建的，路径之外的兄弟节点全部复用原引用。这也是为什么改一个深层字段不会导致整棵树的引用都变化。

#### 5.5.3 `deleteIn()` 

用来删除深层数据，用法参考 `setIn`。对应的浅层方法是 `delete()`（旧版本里叫 `remove()`，两个名字都能用）。

#### 5.5.4 更新 `update()` 

对对象中的某个属性进行更新，可对原数据进行相关操作：

```javascript
////List
const list = List([ 'a', 'b', 'c' ])
const result = list.update(2, val => val.toUpperCase())

///Map
const aMap = Map({ key: 'value' })
const newMap = aMap.update('key', value => value + value)
```

`update` 和 `set` 的区别在于它接的是函数，能拿到旧值。要写「数量加一」这种依赖旧值的更新，`update` 比 `get` 完再 `set` 回去干净得多。深层版本是 `updateIn`。

#### 5.5.5 `clear()` 

清除所有数据，返回一个空的同类型结构：
 
```javascript
Map({ key: 'value' }).clear()  //Map
List([ 1, 2, 3, 4 ]).clear()   // List
```

### 5.6 List中的删除与插入

#### 5.6.1 数组方法

`List` 对应的数据结构是 `js` 中的数组，所以数组的一些方法在 `Immutable` 中也是通用的，比如 `push`，`pop`，`shift`，`unshift`，`insert`。

- `push()`：在 `List` 末尾插入一个元素
- `pop()`: 在 `List` 末尾删除一个元素
- `unshift`: 在 `List` 首部插入一个元素
- `shift`: 在 `List` 首部删除一个元素
- `insert`：在 `List` 的 `index` 处插入元素
  
```javascript
List([ 0, 1, 2, 3, 4 ]).insert(6, 5) //List [ 0, 1, 2, 3, 4, 5 ]
List([ 1, 2, 3, 4 ]).push(5) // List [ 1, 2, 3, 4, 5 ]
List([ 1, 2, 3, 4 ]).pop() // List[ 1, 2, 3 ]
List([ 2, 3, 4]).unshift(1) // List [ 1, 2, 3, 4 ]
List([ 0, 1, 2, 3, 4 ]).shift() // List [ 1, 2, 3, 4 ]
```

名字虽然一样，行为差别很大。原生的 `pop()` 返回的是被弹出的那个元素，这里的 `pop()` 返回的是删掉末位之后的新 `List`。想同时拿到被删的元素，得先 `last()` 再 `pop()`。第一行的 `insert(6, 5)` 也值得留意，下标 6 已经越界了，它没有报错，而是直接追加到了末尾。

`push` 在 `List` 上是很便宜的操作，得益于底层的 Trie 结构，只需要新建从根到尾部的那一条路径。反过来往头部 `unshift` 就要贵一些，因为所有元素的索引都得挪。数据量大又频繁在头部插入的话，考虑换个结构或者反着存。

### 5.7 关于merge

merge 这一族有六个方法，名字长得像，但规则其实只有两组正交的维度：深还是浅、在第一层还是在深层路径上。

- `merge` 浅合并，新数据与旧数据对比，旧数据中不存在的属性直接添加，旧数据中已存在的属性用新数据中的覆盖
- `mergeWith` 自定义浅合并，可自行设置某些属性的值
- `mergeIn` 对深层数据进行浅合并
- `mergeDeep` 深合并，新旧数据中同时存在的的属性为新旧数据合并之后的数据
- `mergeDeepIn` 对深层数据进行深合并
- `mergeDeepWith` 自定义深合并，可自行设置某些属性的值

这里用一段示例彻底搞懂 `merge`，此示例为 `Map` 结构，`List` 与 `Map` 原理相同：

```javascript
const Map1 = Immutable.fromJS({a:111,b:222,c:{d:333,e:444}});
 const Map2 = Immutable.fromJS({a:111,b:222,c:{e:444,f:555}});

 const Map3 = Map1.merge(Map2);
  //Map {a:111,b:222,c:{e:444,f:555}}
 const Map4 = Map1.mergeDeep(Map2);
  //Map {a:111,b:222,c:{d:333,e:444,f:555}}
 const Map5 = Map1.mergeWith((oldData,newData,key)=>{
      if(key === 'a'){
        return 666;
      }else{
        return newData
      }
    },Map2);
  //Map {a:666,b:222,c:{e:444,f:555}}
```

盯着 `c` 这个字段看就明白了。`merge` 只在第一层做合并，看到两边都有 `c`，直接拿新的整个替换掉旧的，旧的 `d:333` 就没了。`mergeDeep` 会继续往下走一层，发现 `d` 只有旧的有、`f` 只有新的有，两个都保留。

这个差异在 Redux 的 reducer 里非常容易踩坑。你以为只是往 `state.c` 里加一个字段，用了 `merge`，结果把 `c` 里原有的字段全冲没了。判断标准很简单：只要要合并的值本身是个嵌套结构，就用 `mergeDeep`。

`mergeWith` 的回调签名是 `(oldValue, newValue, key)`，返回什么就用什么。上面那段里 key 为 `a` 时硬返回 666，其余情况返回新值，所以结果里 `a` 变成了 666。要实现「数字相加而不是覆盖」这类合并策略，靠的就是它。

带 `In` 后缀的两个是路径版本，`mergeIn(['a', 'b'], obj)` 等价于先 `getIn(['a','b'])` 再 `merge` 再 `setIn` 回去，只是写起来短。

### 5.8 序列算法

这一组方法和原生数组的同名方法用法几乎一致，区别是全部返回新的 Immutable 对象，而且在 `Map` 上也能用。

#### 5.8.1 `concat()` 

对象的拼接，用法与 `js` 数组中的 `concat()` 相同，返回一个新的对象：

```javascript
const newList = list1.concat(list2)
```

#### 5.8.2 `map()` 

遍历整个对象，对 `Map/List` 元素进行操作，返回一个新的对象。回调签名是 `(value, key, iter)`，`List` 上第二个参数是下标，`Map` 上是 key：

```javascript
Map({a:1,b:2}).map(val=>10*val)
//Map {a:10,b:20}
```

`Map` 上的 `map` 只作用于 value，key 保持不变，这点和下面的 `mapKeys` 正好互补。

#### 5.8.3 `mapKeys()` 

`Map` 特有的 `mapKeys()` 遍历整个对象，对 `Map` 元素的 `key` 进行操作，返回一个新的对象，value 不动：

```javascript
Map({a:1,b:2}).mapKeys(key => key + 'l')
//Map {al:1, bl:2}
```

#### 5.8.4 `mapEntries()` 

`Map` 特有的 `mapEntries()` 遍历整个对象，对 `Map` 元素的 `key` 和 `value` 同时进行操作，返回一个新的对象。回调拿到的是一个 `[key, value]` 数组，返回的也必须是一个 `[key, value]` 数组：

```javascript
Map({a:1,b:2}).mapEntries(([key, val]) => [key + 'l', val * 10])
//Map {al:10, bl:20}
```

要同时改 key 和 value 就用它，只改一头的话 `map` 或 `mapKeys` 更直白。

#### 5.8.5 filter

- `过滤 filter` 返回一个新的对象，包括所有满足过滤条件的元素
- 还有一个 `filterNot()` 方法，与此方法正好相反

```javascript
Map({a:1,b:2}).filter((value, key) => value === 2)
//Map {b:2}
```

回调的第一个参数是 value，第二个才是 key，顺序别记反了，这是从 `forEach` 那套约定继承下来的。`filterNot` 在条件写起来是「排除某几项」的时候更好读，省一层取反。

#### 5.8.6 reverse

作用：将数据的结构进行反转。

```javascript
Immutable.fromJS([1, 2, 3, 4, 5]).reverse(); // List [5,4,3,2,1]
Immutable.fromJS({a:1,b:{c:2,d:3},e:4}).reverse();
//Map {e:4,b:{c:2,d:3},a:1}
```

在 `Map` 上反转的是遍历顺序，实际意义不大，因为 `Map` 本来就不保证顺序。真要靠顺序，前面说过用 `OrderedMap`。

#### 5.8.7 sort & sortBy

`排序 sort & sortBy` 作用：对数据结构进行排序。`sort` 直接比较元素，`sortBy` 先用一个函数取出用来比较的字段。

```javascript
///List
Immutable.fromJS([4,3,5,2,6,1]).sort()
// List [1,2,3,4,5,6]
Immutable.fromJS([4,3,5,2,6,1]).sort((a,b)=>{
  if (a < b) { return -1; }
  if (a > b) { return 1; }
  return 0;
})
// List [1,2,3,4,5,6]
Immutable.fromJS([{a:3},{a:2},{a:4},{a:1}]).sortBy((val,index,obj)=>{
  return val.get('a')
})
// List [ {a:1}, {a:2}, {a:3}, {a:4} ]
```

`sortBy` 的第一个参数是取值函数，第二个参数才是可选的比较函数。不传比较函数时用默认的大小比较，绝大多数情况够用了。注意取值函数里拿到的 `val` 是 Immutable 对象，所以得写 `val.get('a')` 而不是 `val.a`。

`Map` 上同样能排：

```javascript
Immutable.fromJS( {b:1, a: 3, c: 2, d:5} ).sort()
//Map {b: 1, c: 2, a: 3, d: 5}
Immutable.fromJS( {b:1, a: 3, c: 2, d:5} ).sortBy((value, key, obj)=> {
  return value
})
//Map {b: 1, c: 2, a: 3, d: 5}
```

`Map` 排的是 value，排完的结果遍历时才有顺序意义。

#### 5.8.8 groupBy

`分组 groupBy` 作用：对数据进行分组，返回一个 `Map`，key 是分组依据，value 是落在这一组里的元素集合。

```javascript
const listOfMaps = List([
  Map({ v: 0 }),
  Map({ v: 1 }),
  Map({ v: 1 }),
  Map({ v: 0 }),
  Map({ v: 2 })
])
const groupsOfMaps = listOfMaps.groupBy(x => x.get('v'))
// Map {
//   0: List [ Map{ "v": 0 }, Map { "v": 0 } ],
//   1: List [ Map{ "v": 1 }, Map { "v": 1 } ],
//   2: List [ Map{ "v": 2 } ],
// }
```

原生 JS 里做这件事得自己写 `reduce`，这里一行就够。做列表按状态分栏、按日期分组这类需求很顺手。

### 5.9 查找数据

这一组全是「找位置」和「找值」，成对出现，前缀 `last` 的从后往前找。

#### 5.9.1 `indexOf` 和 `lastIndexOf` 

`Map` 不存在此方法。和 `js` 数组中的方法相同，查找第一个或者最后一个 `value` 的 `index` 值，找不到则返回 `-1`：

```javascript
Immutable.fromJS([1,2,3,4]).indexOf(3) //2
Immutable.fromJS([1,2,3,4]).lastIndexOf(3) //2
```

#### 5.9.2 `findIndex()` 和 `findLastIndex()` 

`Map` 不存在此方法，查找满足要求的元素的 `index` 值：

```javascript
Immutable.fromJS([1,2,3,4]).findIndex((value,index,array)=>{
  return value%2 === 0;
})   // 1
Immutable.fromJS([1,2,3,4]).findLastIndex((value,index,array)=>{
  return value%2 === 0;
})  // 3
```

#### 5.9.3 `find()` 和 `findLast()`  

查找满足条件的元素的 `value` 值：

```javascript
Immutable.fromJS([1,2,3,4]).find((value,index,array)=>{
  return value%2 === 0;
})  // 2

Immutable.fromJS([1,2,3,4]).findLast((value,index,array)=>{
  return value%2 === 0;
})  // 4
```

#### 5.9.4 `findKey()` 和 `findLastKey()`

查找满足条件的元素的 `key` 值。在 `List` 上 key 就是下标，所以结果和 `findIndex` 一样；它真正的用武之地在 `Map` 上：

```javascript
Immutable.fromJS([1,2,3,4]).findKey((value,index,array)=>{
  return value%2 === 0;
})  // 1

Immutable.fromJS([1,2,3,4]).findLastKey((value,index,array)=>{
  return value%2 === 0;
})  // 3
```

#### 5.9.5 `findEntry()` 和 `findLastEntry()`

查找满足条件的元素的键值对 `key:value`，返回的是一个 `[key, value]` 数组：

```javascript
Immutable.fromJS([1,2,3,4]).findEntry((value,index,array)=>{
  return value%2 === 0;
})  // [1,2]

Immutable.fromJS([1,2,3,4]).findLastEntry((value,index,array)=>{
  return value%2 === 0;
})  // [3,4]
```

要同时用到位置和值的时候用它，省得再取一次。

#### 5.9.6 `keyOf()` 和 `lastKeyOf()`

查找某一个 `value` 对应的 `key` 值：

```javascript
Immutable.fromJS([1,2,3,4]).keyOf(2) //1
Immutable.fromJS([1,2,3,4]).lastKeyOf(2) //1
```

和 `indexOf` 的区别是它在 `Map` 上也能用，返回的是 key 而不是下标。

#### 5.9.7 `max()` 和 `maxBy()`

查找最大值。`maxBy` 的参数是取值函数，规则和 `sortBy` 一致：

```javascript
Immutable.fromJS([1, 2, 3, 4]).max() //4

Immutable.fromJS([{a:1},{a:2},{a:3},{a:4}]).maxBy((value,index,array)=>{
  return value.get('a')
})  //Map {a:4}
```

#### 5.9.8 `min()` 和 `minBy()`

查找最小值，用法对称：

```javascript
Immutable.fromJS([1, 2, 3, 4]).min() //1

Immutable.fromJS([{a:1},{a:2},{a:3},{a:4}]).minBy((value,index,array)=>{
  return value.get('a')
})  //Map {a:1}
```

### 5.10 创建子集

这一组都是「切一段出来」，返回的仍然是 Immutable 结构，原对象不动。

#### 5.10.1 `slice()`  

和原生 `js` 中数组的 `slice` 一样，包含两个参数，`start` 和 `end`，`start` 代表开始截取的位置，`end` 代表结束的位置，不包括第 `end` 的元素。若不传 `end`，则截到末尾；若 `end` 为负数，则从尾部倒数；若只传一个负数，则返回最后那几个元素。

```javascript
Immutable.fromJS([1, 2, 3, 4]).slice(0); //[1,2,3,4]
Immutable.fromJS([1, 2, 3, 4]).slice(0,2); //[1,2]
Immutable.fromJS([1, 2, 3, 4]).slice(-2); //[3,4]
Immutable.fromJS([1, 2, 3, 4]).slice(0,-2); //[1,2]
```

#### 5.10.2 `rest()` 

返回除第一个元素之外的所有元素：

```javascript
Immutable.fromJS([1, 2, 3, 4]).rest()//[2,3,4]
```

#### 5.10.3 `butLast()` 

返回除最后一个元素之外的所有元素：

```javascript
Immutable.fromJS([1, 2, 3, 4]).butLast()//[1,2,3]
```

#### 5.10.4 `skip()`

有一个参数 `n`，返回截掉前 `n` 个元素之后剩下的所有元素：

```javascript
Immutable.fromJS([1, 2, 3, 4]).skip(1)//[2,3,4]
```

#### 5.10.5 `skipLast()`

有一个参数 `n`，返回截掉最后 n 个元素之后剩下的所有元素：

```javascript
Immutable.fromJS([1, 2, 3, 4]).skipLast(1)//[1,2,3]
```

#### 5.10.6 `skipWhile()`

从头开始跳过元素，直到判断函数第一次返回 `false`，从这里开始的所有元素都保留：

```javascript
Immutable.fromJS([1, 2, 3, 4]).skipWhile((value, index, list) => {
  return value > 2;
})// List [1,2,3,4]
```

这个例子的结果容易看错。第一个元素 1 就不满足 `> 2`，判断函数立刻返回 `false`，一个都没跳过，所以原样返回。配套还有一个 `skipUntil()`，条件正好相反，跳到第一次返回 `true` 为止。

#### 5.10.7 `take()`

有一个参数 n，返回前 n 个元素：

```javascript
Immutable.fromJS([1, 2, 3, 4]).take(2)//[1,2]
```

#### 5.10.8 `takeLast()`

有一个参数 n，返回最后 n 个元素：

```javascript
Immutable.fromJS([1, 2, 3, 4]).takeLast(2)//[3,4]
```

#### 5.10.9 `takeWhile()`

从头开始收集元素，直到判断函数第一次返回 `false` 为止：

```javascript
Immutable.fromJS([1, 2, 3, 4]).takeWhile((value, index, list) => {
  return value > 2;
})// List []
```

同样地，第一个元素就不满足条件，一个都没收进来，结果是空 `List`。对应的还有 `takeUntil()`。

### 5.11 处理数据

最后这一组是聚合和判断，把一个集合算成一个值。

#### 5.11.1 `reduce()`

和 `js` 中数组中的 `reduce` 相同，按索引升序的顺序处理元素：

```javascript
Immutable.fromJS([1,2,3,4]).reduce((pre,next,index,arr)=>{
  console.log(pre+next)
  return pre+next; 
})
// 3 6 10
```

没传初始值时，第一个元素直接当初始值，所以只跑了三次。空集合上不传初始值会抛错，这点和原生一致。

#### 5.11.2 `reduceRight()` 

和 `js` 中数组中的 `reduce` 相同，按索引降序的顺序处理元素：

```javascript
Immutable.fromJS([1,2,3,4]).reduceRight((pre,next,index,arr)=>{
  console.log(pre+next)
  return pre+next; 
})
// 7 9 10
```

#### 5.11.3 `every()`

作用：判断整个对象中所有的元素是不是都满足某一个条件，都满足返回 `true`，反之返回 `false`：

```javascript
Immutable.fromJS([1,2,3,4]).every((value,index,arr)=>{
  return value > 2
}) // false
```

#### 5.11.4 `some()`

判断整个对象中所有的元素是不是存在满足某一个条件的元素，若存在返回 `true`，反之返回 `false`：

```javascript
Immutable.fromJS([1,2,3,4]).some((value,index,arr)=>{
  return value > 2
}) // true
```

`every` 和 `some` 都是短路的，一旦能确定结果就不再往下遍历。

#### 5.11.5 `join()` 

作用：同 `js` 中数组的 `join` 方法，把集合转换为字符串：

```javascript
Immutable.fromJS([1,2,3,4]).join(',') //1,2,3,4
```

#### 5.11.6 `isEmpty()`

作用：判断是否为空：

```javascript
Immutable.fromJS([]).isEmpty(); // true
Immutable.fromJS({}).isEmpty(); // true
```

比写 `.size === 0` 语义清楚一点，遇到惰性序列时也更安全。

#### 5.11.7 `countBy()`

与 `count` 不同的是，`countBy` 返回一个对象，key 是分类依据，value 是这一类的数量：

```javascript
const list = Immutable.fromJS([1,2,3,4]);
const map = Immutable.fromJS({a:1,b:2,c:3,d:4});

list.countBy((value,index,list) => {
  return value > 2;
}) //Map {false: 2, true: 2}

map.countBy((value,key,map) => {
  return value > 2;
}) //Map {false: 2, true: 2}
```

它和 `groupBy` 的关系是：`groupBy` 给你分好组的元素，`countBy` 只给你每组的个数。做统计图表的数据预处理时经常用到。

## 六、这篇写于 2018 年，现在还该用 Immutable.js 吗

这套 API 本身没有过时，逻辑依然成立。但生态的确变了，得说清楚。

Immutable.js 官方的维护活跃度这几年一直很低，issue 和 PR 堆积明显。它最大的问题从来不是不好用，而是「侵入性太强」：一旦引入，整个项目的数据都得转成 `Map` 和 `List`，取值全部改成 `get` / `getIn`，TypeScript 的类型推导也没那么顺，和第三方库交互还要来回 `toJS`。团队里只要有一个人忘了转换，就会出现原生对象和 Immutable 对象混在一起的诡异 bug。

现在更常见的选择是 Immer。它基于 Proxy，写法是你照着可变的方式改一个草稿对象，它在背后帮你产出不可变的新对象：

```javascript
import produce from 'immer'

const nextState = produce(state, draft => {
  draft.list.push(4)
  draft.user.name = 'poetry'
})
```

上面这段里 `state` 一点没被改动，`nextState` 是新的，没动过的子树依然共享引用。好处很直接，数据还是普通的 JS 对象和数组，取值就是 `state.user.name`，类型推导天然可用，也不用担心忘了 `toJS`。

Redux Toolkit 已经把 Immer 内置了，所以在 `createSlice` 的 reducer 里你可以直接写 `state.value += 1`，它并不是真的在改 state。这一点很多人第一次看到会以为是文档写错了。

那还有必要学 Immutable.js 吗？我的看法是有。一是老项目还在跑，二是它的 API 设计是理解「不可变数据到底怎么用」的最好教材，Immer 只是把这层包装得更自然了，底下的结构共享思路是一样的。至于状态管理层面该怎么选，我在 [React状态管理方案对比](https://feinterview.poetries.top/blog/react-state-management-comparison) 里有更完整的比较。

## 总结

把这份清单收一收，能记住的几条：

- 所有「修改」方法都返回新对象，原对象不动，漏掉赋值是最常见的低级错误
- `fromJS` / `toJS` 都是深转换，别在 `render` 里反复调用 `toJS()`，会把浅比较的优化全抵消掉
- `is()` 做值比较，日常靠的还是引用比较，因为没变的部分引用会被复用
- `get` / `set` 是一层，带 `In` 后缀的接路径数组走深层，路径断了返回 `undefined` 而不是报错
- `merge` 只合第一层，嵌套结构会被整个替换；要保留旧字段就用 `mergeDeep`，这是踩坑重灾区
- `includes` 内部用 `is` 比较，传原生对象进去永远是 `false`
- `List` 的 `pop` / `shift` 返回的是新集合而不是被删的元素，和原生数组不一样
- `set` 越界不报错，会用 `undefined` 把中间补齐，长度直接涨上去
- `skipWhile` / `takeWhile` 判断的是「第一次返回 false 的位置」，第一个元素就不满足的话结果会很反直觉
- 新项目更推荐 Immer，写法自然、类型友好，Redux Toolkit 已经内置

## 参考

- [Immutable.js 官方文档](https://immutable-js.com/docs/latest@main/)
- [Immutable.js - GitHub](https://github.com/immutable-js/immutable-js)
- [Immer 官方文档](https://immerjs.github.io/immer/)
- [Redux Toolkit - Writing Reducers with Immer](https://redux-toolkit.js.org/usage/immer-reducers)
- [React 官方文档 - Updating Objects in State](https://react.dev/learn/updating-objects-in-state)
- [前端进阶之旅](https://interview.poetries.top)
