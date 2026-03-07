---
title: Set与Map
date: 2017-09-17 14:33:00
tags: 
  - JavaScript
  - ES6
categories: Front-End
---

Map
---

- Map是一组键值对的结构，具有极快的查找速度
- 用Map实现，只需要一个“名字”-“成绩”的对照表，直接根据名字查找成绩，无论这个表有多大，查找速度都不会变慢。用JavaScript写一个Map如下：

```javascript
var m = new Map([['Michael', 95], ['Bob', 75], ['Tracy', 85]]);
m.get('Michael'); // 95
```

- 初始化Map需要一个二维数组，或者直接初始化一个空Map。Map具有以下方法

```javascript
var m = new Map(); // 空Map
m.set('Adam', 67); // 添加新的key-value
m.set('Bob', 59);
m.has('Adam'); // 是否存在key 'Adam': true
m.get('Adam'); // 67
m.delete('Adam'); // 删除key 'Adam'
m.get('Adam'); // undefined
```

- 由于一个key只能对应一个value，所以，多次对一个key放入value，后面的值会把前面的值冲掉

```javascript
var m = new Map();
m.set('Adam', 67);
m.set('Adam', 88);
m.get('Adam'); // 88
```

Set
---

> Set和Map类似，也是一组key的集合，但不存储value。由于key不能重复，所以，在Set中，没有重复的key

- 要创建一个Set，需要提供一个Array作为输入，或者直接创建一个空Set

```javascript
var s1 = new Set(); // 空Set
var s2 = new Set([1, 2, 3]); // 含1, 2, 3
```

- 重复元素在Set中自动被过滤

```javascript
var s = new Set([1, 2, 3, 3, '3']);
s; // Set {1, 2, 3, "3"}
```

- 通过add(key)方法可以添加元素到Set中，可以重复添加，但不会有效果

```javascript
>>> s.add(4)
>>> s
{1, 2, 3, 4}
>>> s.add(4)
>>> s
{1, 2, 3, 4}
```

- 通过delete(key)方法可以删除元素

```javascript
var s = new Set([1, 2, 3]);
s; // Set {1, 2, 3}
s.delete(3);
s; // Set {1, 2}
```

小结
---

- Map和Set是ES6标准新增的数据类型，请根据浏览器的支持情况决定是否要使用
