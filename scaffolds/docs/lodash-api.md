---
title: lodash常用API
date: 2018-12-06 10:08:24
tags: 
    - JavaScript
    - lodash
categories: Front-End
---

> 中文文档 https://www.lodashjs.com/docs/4.17.5.html

### _.chunk

> 将数组进行切分

- 这个函数把数组按照一定的长度分开，返回新的数组。（片段化数组）

```javascript
const arr = [1,2,3,4,5,6,7,8,9];
_.chunk(arr,2);
// =>[[1,2],[3,4],[5,6],[7,8],[9]]
```

### compact

> 去除假值。（将所有的空值，0，NaN过滤掉）

```javascript
_.compact(['1','2',' ',0])
// => ['1','2']
```

### uniq

> 数组去重。（将数组中的对象去重，只能是数组去重，不能是对象去重。）


```javascript
_.uniq([1,1,3])
// => [1,3]
```

### _.reject

> 根据条件去除某个元素

```javascript
var foo = [
    {id: 0, name: "aaa", age: 33},
    {id: 1, name: "bbb", age: 25}
]
var bar = _.reject(foo, ['id', 0])

//bar = [{id: 1, name: "bbb", age: 25}]
```


### shuffle  

> 无序化

```javascript
_.shuffle([1,2,3,4]);// 无序化
```


### _.pick

> 根据key来筛选数组

```javascript
var foo = {id: 0, name: "aaa", age: 33}
var bar = _.pick(foo, ['name', 'age'])
//bar = {name: "aaa", age: 33}
```

### _.keys

> 返回object中的所有key

```javascript
var foo = {id: 0, name: "aaa", age: 33}
var bar = _.keys(foo)
//bar = ['id', 'name', 'age']
```

### _.cloneDeep

> 深度拷贝

### _.forEach

**常规数组遍历**

```js
agent.forEach(function (n,key) {
    agent[key].agent_id = agent[key].agent_name;
    return agent;
})
```

**使用lodash来遍历**

```js
_.forEach(agent,function(n,key) {

    agent[key].agent_id= agent[key].agent_name

})
```

> 这是一个常见的`forEach`的数组遍历，使用了`lodash`过后，`_.forEach()`这是一个值，而不是一个函数。就可以直接

```js
const arr = _.forEach();
```

这时候`arr`就是新的数组`agent`

### _.merge 参数合并

> 递归的将源对象和继承的可枚举字符串监控属性合并到目标对象中。源对象从左到右引用，后续来源将覆盖以前来源的属性分配。

```js
var object = {
  'a': [{ 'b': 2 }, { 'd': 4 }]
};
 
var other = {
  'a': [{ 'c': 3 }, { 'e': 5 }]
};
 
_.merge(object, other);
// => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }

```

> 在实际开发中，前端在接口的请求可以`merge`一下之前的`query`和现在改变的查询的值，再去请求后端接口的数据


### _.random

```js
console.log(_.random(10, 20)); // 获取随机数
_.random(15, 20, true); // 随机浮点
_.sample(["lisong", "heyan"], 1);// 随机获取数组中的某一项,attr2:随机获取的个数
```

### _.find查找数组

```js
var foo = [
    {id: 0, name: "aaa", age: 33},
    {id: 1, name: "bbb", age: 25}
]
var bar = _.find(foo, ['id', 0])
//bar = {id: 0, name: "aaa", age: 33}

```

> 注意一下如果没找到的话，会返回`undefined`，要处理一下

### _.keyBy

> 以某个属性为键，将数组转为对象

```js
var foo = var foo = [
    {id: 0, name: "aaa", age: 33},
    {id: 1, name: "bbb", age: 25}
]
var bar = _.keyBy(foo, 'name')
//bar = {
//    aaa: {id: 0, name: "aaa", age: 33},
//    bbb: {id: 1, name: "bbb", age: 25}
//}
```

### _.filter

> 根据条件过滤出符合条件的元素，返回新数组

```js
var foo = var foo = [
    {id: 0, name: "aaa", age: 33},
    {id: 1, name: "bbb", age: 25}
]
var bar = _.filter(foo, ['name', "aaa"])
//bar = {
//    aaa: {id: 0, name: "aaa", age: 33}
//}
```

### _.map

> 从集合中挑出一个`key`，将其值作为数组返回

```js
var foo = var foo = [
    {id: 0, name: "aaa", age: 33},
    {id: 1, name: "bbb", age: 25}
]
var bar = _.map(foo, 'name')
//bar = ["aaa", "bbb"]
```

### _.max/_.min/_.sum

> 数组中最大值、最小值、数组求和

```js
var foo = [1, 2, 3, 4]
var bar = _.max(foo)
//bar = 4
bar = _.min(foo)
//bar = 1
bar = _.sum(foo)
//bar = 10
```

### _.pad/_.padStart/_.padEnd

> 在两端、开头、末尾补齐字符

```js
var foo = "helloworld"
var bar = _.pad(foo, 14, '-')
//bar = --helloworld--
bar = _.padStart(foo, 14, '-')
//bar = ----helloworld
bar = _.padEnd(foo, 14, '-')
//bar = helloworld----
```

### 选出json数组中id最大的一项

```js
var foo = [
    {id: 0, name: "aaa", age: 33},
    {id: 1, name: "bbb", age: 25}
]
var bar = _.find(foo, ['id', _.max(_.map(foo, 'id'))])
// bar = {id: 1, name: "bbb", age: 25}
// ps:也可以用maxBy某个key来代替
```

### 更新json数组中某一项的值

```js
var foo = [
    {id: 0, name: "aaa", age: 33},
    {id: 1, name: "bbb", age: 25}
]
let list = _.keyBy(foo, 'id')
list[0].name = "ccc"
var bar = _.map(list)
// bar = [
//    {id: 0, name: "ccc", age: 33},
//    {id: 1, name: "bbb", age: 25}
//]
```

### 扁平化数组 _.flatten

```js
var arr = [1,2,[3,4,[5],6]]
var a8 = _.flatten(arr)  //[ 1, 2, 3, 4, [ 5 ], 6 ]
var a9 = _.flattenDeep(arr)  //[ 1, 2, 3, 4, 5, 6 ]
var a10 = _.flattenDepth(arr,2)  //[ 1, 2, 3, 4, 5, 6 ]
```

### 数组去重

```js
var arr2 = [12,14,11,12,12,1,14,16,17,22,2,11,12]
var a11 = Array.from(new Set(arr2))
var a12 = [...new Set(arr2)]
var a13 = _.uniq(arr2)  //[ 12, 14, 11, 1, 16, 17, 22, 2 ]
var arrObj = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 },{ 'x': 2, 'y': 1 }, { 'x': 1, 'y': 2 }];
var a14 = _.uniqWith(arrObj, _.isEqual)  //[ { x: 1, y: 2 }, { x: 2, y: 1 } ]
```
