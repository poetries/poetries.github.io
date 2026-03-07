---
title: 梳理Immutable常用API
date: 2018-02-04 16:10:24
tags: 
 - Immutable
 - react
categories: Front-End
---

## 一、fromJS

- 作用：是最最常用的将原生JS数据转换为`ImmutableJS`数据的转换方法,默认将原生`JS`的`Array`转为`List`，`Object`转为`Map`


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

## 二、toJS

- 作用：将一个`Immutable`数据转换为`JS`类型的数据
- 用法：`value.toJS()`


## 三、is

- 作用：对两个对象进行比较
- 用法：`is(map1,map2)`

```javascript
import { Map, is } from 'immutable'
const map1 = Map({ a: 1, b: 1, c: 1 })
const map2 = Map({ a: 1, b: 1, c: 1 })

map1 === map2   //false

Object.is(map1, map2) // false

is(map1, map2) //  true 只检测值是否相等
```

## 四、List 和 Map


### 4.1 创建

- `List` 有序索引密集的集合，和`JS`中的`Array`很像 
- `Map` 无序索引集，类似`JavaScript`中的`Object`

### 4.2 判断

- `List.isList()` 和 `Map.isMap()` 判断一个数据结构是不是`List/Map`类型

### 4.3 长度

#### 4.3.1 `size` 获取`List/Map`的长度**

```javascript
// list
console.log(List([1,2,3,4]).size);// 4
console.log(List.of(1, 2, 3, 4).size);// 4

// map
console.log(Map({key: "value2", key1: "value1"}).size);// 2
console.log(Map.of({x:1}, 2, [3], 4).size);// 2
```

#### 4.3.2 count()

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


### 4.4 数据读取

#### 4.4.1 `get() 、 getIn()` 

> 获取数据结构中的数据

#### 4.4.2 `has() 、 hasIn()` 

> 判断是否存在某一个`key`

```javascript
Immutable.fromJS([1,2,3,{a:4,b:5}]).has('0'); //true
Immutable.fromJS([1,2,3,{a:4,b:5}]).has('0'); //true
Immutable.fromJS([1,2,3,{a:4,b:5}]).hasIn([3,'b']) //true
```

#### 4.4.3 `includes()`

> 判断是否存在某一个`value`

```javascript
Immutable.fromJS([1,2,3,{a:4,b:5}]).includes(2); //true
Immutable.fromJS([1,2,3,{a:4,b:5}]).includes('2'); //false 不包含字符2
Immutable.fromJS([1,2,3,{a:4,b:5}]).includes(5); //false 
Immutable.fromJS([1,2,3,{a:4,b:5}]).includes({a:4,b:5}) //false
Immutable.fromJS([1,2,3,{a:4,b:5}]).includes(Immutable.fromJS({a:4,b:5})) //true
```

#### 4.4.4 `first() 、 last()` 

> 用来获取第一个元素或者最后一个元素，若没有则返回`undefined`

```javascript
Immutable.fromJS([1,2,3,{a:4,b:5}]).first()//1
Immutable.fromJS([1,2,3,{a:4,b:5}]).last()//{a:4,b:5}

Immutable.fromJS({a:1,b:2,c:{d:3,e:4}}).first() //1
Immutable.fromJS({a:1,b:2,c:{d:3,e:4}}).first() //{d:3,e:4}
```

### 4.5 数据修改

#### 4.5.1 `set()` 

> 设置第一层`key`、`index`的值

```javascript
/ Map
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


#### 4.5.2 `setIn()` 

> 设置深层结构中某属性的值

```javascript
// Map
console.log(Immutable.fromJS([1, 2, 3, {a: 45, b: 64}]).setIn(['3', 'a'], 1000).toJS());//[1, 2, 3, {a: 1000, b: 64}]

// List
console.log(Immutable.fromJS([1, 2, 3, {a: 45, b: 64}]).setIn(['3', 'a'], 1000).toJS());//[1, 2, 3, {a: 1000, b: 64}]
```

#### 4.5.3 `deleteIn()` 

> 用来删除深层数据，用法参考`setIn`

#### 4.5.4 `更新 update()` 

> 对对象中的某个属性进行更新，可对原数据进行相关操作

```javascript
////List
const list = List([ 'a', 'b', 'c' ])
const result = list.update(2, val => val.toUpperCase())

///Map
const aMap = Map({ key: 'value' })
const newMap = aMap.update('key', value => value + value)
```

#### 4.5.5 ` clear()` 

> 清除所有数据
 
```javascript
Map({ key: 'value' }).clear()  //Map
List([ 1, 2, 3, 4 ]).clear()   // List
```

### 4.6 List中的删除与插入

#### 4.6.1 数组方法

> `List`对应的数据结构是`js`中的数组，所以数组的一些方法在`Immutable`中也是通用的，比如`push`，`pop`,`shift`，`unshift`，`insert`

- `push()`：在`List`末尾插入一个元素
- `pop()`: 在`List`末尾删除一个元素
- `unshift`: 在`List`首部插入一个元素
- `shift`: 在`List`首部删除一个元素
- `insert`：在`List`的`index`处插入元素
  
```javascript
List([ 0, 1, 2, 3, 4 ]).insert(6, 5) //List [ 0, 1, 2, 3, 4, 5 ]
List([ 1, 2, 3, 4 ]).push(5) // List [ 1, 2, 3, 4, 5 ]
List([ 1, 2, 3, 4 ]).pop() // List[ 1, 2, 3 ]
List([ 2, 3, 4]).unshift(1) // List [ 1, 2, 3, 4 ]
List([ 0, 1, 2, 3, 4 ]).shift() // List [ 1, 2, 3, 4 ]
```

### 4.7 关于merge

- `merge` 浅合并，新数据与旧数据对比，旧数据中不存在的属性直接添加，旧数据中已存在的属性用新数据中的覆盖
- `mergrWith` 自定义浅合并，可自行设置某些属性的值
- `mergeIn` 对深层数据进行浅合并
- `mergeDeep` 深合并，新旧数据中同时存在的的属性为新旧数据合并之后的数据
- `mergeDeepIn`  对深层数据进行深合并
- `mergrDeepWith`  自定义深合并，可自行设置某些属性的值

> 这里用一段示例彻底搞懂`merge`，此示例为`Map`结构，`List`与`Map`原理相同

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

### 4.8 序列算法

#### 4.8.1 `concat()` 

> 对象的拼接，用法与`js`数组中的`concat()`相同，返回一个新的对象

```javascript
const List = list1.concat(list2)
```

#### 4.8.2 `map()` 

> 遍历整个对象，对`Map/List`元素进行操作，返回一个新的对象

```javascript
Map({a:1,b:2}).map(val=>10*val)
//Map{a:10,b:20}
```

#### 4.8.3 mapKey() 

> `Map`特有的`mapKey()` 遍历整个对象，对`Map`元素的`key`进行操作，返回一个新的对象

```javascript
Map({a:1,b:2}).mapKey(val=>val+'l')
//Map{al:10,bl:20}
```

#### 4.8.4 mapEntries 

> `Map特有的mapEntries()`  遍历整个对象，对`Map`元素的`key`和`value`同时进行操作，返回一个新的对象。`Map`的`map()`也可实现此功能

```javascript
Map({a:1,b:2}).map((key,val)=>{
  return [key+'l',val*10]
})
//Map{al:10,bl:20}
```

#### 4.8.5 filter

> - `过滤 filter` 返回一个新的对象，包括所有满足过滤条件的元素
> - 还有一个`filterNot()`方法，与此方法正好相反

```javascript
Map({a:1,b:2}).filter((key,val)=>{
  return val == 2
})
//Map{b:2}
```

#### 4.8.6 reverse

> 作用：将数据的结构进行反转

```javascript
Immutable.fromJS([1, 2, 3, 4, 5]).reverse(); // List [5,4,3,2,1]
Immutable.fromJS({a:1,b:{c:2,d:3},e:4}).recerse();
//Map {e:4,b:{c:2,d:3},a:1}
```

#### 4.8.7 sort & sortBy

> `排序 sort & sortBy` 作用：对数据结构进行排序

```javascript
///List
Immutable.fromJS([4,3,5,2,6,1]).sort()
// List [1,2,3,4,5,6]
Immutable.fromJS([4,3,5,2,6,1]).sort((a,b)=>{
  if (a < b) { return -1; }
  if (a > b) { return 1; }
  if (a === b) { return 0; }
})
// List [1,2,3,4,5,6]
Immutable.fromJS([{a:3},{a:2},{a:4},{a:1}]).sortBy((val,index,obj)=>{
  return val.get('a')
},(a,b)=>{
  if (a < b) { return -1; }
  if (a > b) { return 1; }
  if (a === b) { return 0; }
})
//List  [ {a:3}, {a:2}, {a:4}, {a:1} ]

//Map

Immutable.fromJS( {b:1, a: 3, c: 2, d:5} ).sort()
//Map {b: 1, c: 2, a: 3, d: 5}
Immutable.fromJS( {b:1, a: 3, c: 2, d:5} ).sort((a,b)=>{
  if (a < b) { return -1; }
  if (a > b) { return 1; }
  if (a === b) { return 0; }
})
//Map {b: 1, c: 2, a: 3, d: 5}
Immutable.fromJS( {b:1, a: 3, c: 2, d:5} ).sortBy((value, key, obj)=> {
  return value
})
//Map {b: 1, c: 2, a: 3, d: 5}
```

#### 4.8.8 groupBy

> `分组 groupBy`  作用：对数据进行分组

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

### 4.9 查找数据

#### 4.9.1 indexOf lastIndexOf 

> Map不存在此方法 和`js`数组中的方法相同，查找第一个或者最后一个`value`的`index`值，找不到则返回`-1`

```javascript
Immutable.fromJS([1,2,3,4]).indexof(3) //2
Immutable.fromJS([1,2,3,4]).lastIndexof(3) //2
```

#### 4.9.2 `findIndex() 、 findLastIndex()` 

> `Map`不存在此方法,查找满足要求的元素的`index`值

```javascript
Immutable.fromJS([1,2,3,4]).findIndex((value,index,array)=>{
  return value%2 === 0;
})   // 1
Immutable.fromJS([1,2,3,4]).findLastIndex((value,index,array)=>{
  return index%2 === 0;
})  // 3
```

#### 4.9.3 `find() 、 findLast()`  

> 查找满足条件的元素的`value`值

```javascript
Immutable.fromJS([1,2,3,4]).find((value,index,array)=>{
  return value%2 === 0;
})  // 2

Immutable.fromJS([1,2,3,4]).findLast((value,index,array)=>{
  return value%2 === 0;
})  // 4
```

#### 4.9.4 `findKey() 、 findLastKey()`

> 查找满足条件的元素的`key`值

```javascript
Immutable.fromJS([1,2,3,4]).findKey((value,index,array)=>{
  return value%2 === 0;
})  // 1

Immutable.fromJS([1,2,3,4]).findLastKey((value,index,array)=>{
  return value%2 === 0;
})  // 3
```

#### 4.9.5 `findEntry() 、 findLastEntry()`

> 查找满足条件的元素的键值对 `key:value`

```javascript
Immutable.fromJS([1,2,3,4]).findEntry((value,index,array)=>{
  return value%2 === 0;
})  // [1,2]

Immutable.fromJS([1,2,3,4]).findLastEntry((value,index,array)=>{
  return value%2 === 0;
})  // [3,4]
```

#### 4.9.6 `keyOf() lastKeyOf()`

> 查找某一个`value`对应的`key`值

```javascript
Immutable.fromJS([1,2,3,4]).keyOf(2) //1
Immutable.fromJS([1,2,3,4]).lastKeyOf(2) //1
```

#### 4.9.7 `max() 、 maxBy()`

> 查找最大值

```javascript
Immutable.fromJS([1, 2, 3, 4]).max() //4

Immutable.fromJS([{a;1},{a:2},{a: 3},{a:4}]).maxBy((value,index,array)=>{
  return value.get('a')
})  //{a:4}
```

#### 4.9.8 `min() 、 minBy()`

> 查找最小值

```javascript
Immutable.fromJS([1, 2, 3, 4]).min() //1

Immutable.fromJS([{a;1},{a:2},{a: 3},{a:4}]).minBy((value,index,array)=>{
  return value.get('a')
})  //{a:1}
```

### 4.10 创建子集

#### 4.10.1 `slice()`  

> 和原生`js`中数组的`slice`数组一样，包含两个参数，`start`和`end`，`start`代表开始截取的位置，`end`代表结束的位置，不包括第`end`的元素。若不包括`end`，则返回整个对象，若`end`为负数，则返回（`start`，`length-end`）对应的数据。若`start`只有一个并且为负数，则返回最后的`end`个元素

```javascript
Immutable.fromJS([1, 2, 3, 4]).slice(0); //[1,2,3,4]
Immutable.fromJS([1, 2, 3, 4]).slice(0,2); //[1,2]
Immutable.fromJS([1, 2, 3, 4]).slice(-2); //[3,4]
Immutable.fromJS([1, 2, 3, 4]).slice(0,-2); //[1,2]
```

#### 4.10.2 `rest()` 

> 返回除第一个元素之外的所有元素

```javascript
Immutable.fromJS([1, 2, 3, 4]).rest()//[2,3,4]
```

#### 4.10.3`butLast()` 

> 返回除最后一个元素之外的所有元素

```javascript
Immutable.fromJS([1, 2, 3, 4]).rest()//[1,2,3]
```

#### 4.10.4 `skip()`

> 有一个参数`n`, 返回截掉前`n`个元素之后剩下的所有元素

```javascript
Immutable.fromJS([1, 2, 3, 4]).skip(1)//[2,3,4]
```

#### 4.10.5 `skipLast()`

> 有一个参数`n`, 返回截掉最后n个元素之后剩下的所有元素

```javascript
Immutable.fromJS([1, 2, 3, 4]).skip(1)//[1,2,3]
```

#### 4.10.6 `skipWhile()`

> 返回从第一次返回`false`之后的所有元素

```javascript
Immutable.fromJS([1, 2, 3, 4]).skipWhile(list.skipWhile((value,index,list)=>{
  return value > 2;
}))// [1,2,3,4]
skipUntil()
```

#### 4.10.7 `take()`

> 有一个参数n, 返回前n个元素

```javascript
Immutable.fromJS([1, 2, 3, 4]).take(2)//[1,2]
```

#### 4.10.8 `takeLast() `

> 有一个参数n, 返回最后n个元素

```javascript
Immutable.fromJS([1, 2, 3, 4]).takeLast(2)//[3,4]
```

#### 4.10.9 `takeWhile()`

> 返回从第一次返回`false`之前的所有元素

```javascript
Immutable.fromJS([1, 2, 3, 4]).skipWhile(list.takeWhile((value,index,list)=>{
  return value > 2;
}))// []
takeUntil()
```

### 4.11 处理数据


#### 4.11.1 `reduce()`

> 和`js`中数组中的`reduce`相同,按索引升序的顺序处理元素

```javascript
Immutable.fromJS([1,2,3,4]).reduce((pre,next,index,arr)=>{
  console.log(pre+next)
  return pre+next; 
})
// 3 6 10
```

#### 4.11.2 `reduceRight()` 

> 和`js`中数组中的`reduce`相同,按索引降序的顺序处理元素

```javascript
Immutable.fromJS([1,2,3,4]).reduceRight((pre,next,index,arr)=>{
  console.log(pre+next)
  return pre+next; 
})
// 7 9 10
```

#### 4.11.3 `every()`

> 作用：判断整个对象总中所有的元素是不是都满足某一个条件，都满足返回`true，反之返回false

```javascript
Immutable.fromJS([1,2,3,4]).every((value,index,arr)=>{
  return value > 2
}) // false
```

#### 4.11.4 `some()`

> 判断整个对象总中所有的元素是不是存在满足某一个条件的元素，若存在返回true，反之返回false

```javascript
Immutable.fromJS([1,2,3,4]).some((value,index,arr)=>{
  return value > 2
}) // true
```

#### 4.11.5 `join()` 

> 作用：同`js`中数组的`join`方法。把转换为字符串


```javascript
Immutable.fromJS([1,2,3,4]).join(',') //1,2,3,4
```

#### 4.11.6 `isEmpty()`

> 作用：判断是否为空

```javascript
Immutable.fromJS([]).isEmpty(); // true
Immutable.fromJS({}).isEmpty(); // true
count()
```

#### 4.11.7 `countBy()`

> 与`count`不同的是，`countBy`返回一个对象

```javascript
const list = Immutable.fromJS([1,2,3,4]);
const map = Immutable.fromJS({a:1,b:2,c:3,d:4});

list.countBy((value,index,list)=>{
  return value > 2;
} //{false: 2, true: 2}

map.countBy((value,index,list)=>{
  return value > 2;
} //{false: 2, true: 2}
```
