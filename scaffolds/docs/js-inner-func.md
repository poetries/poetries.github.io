---
title: JS常用的内置函数整理
date: 2016-12-13 14:50:24
tags: JavaScript
categories: Front-End
---

### String字符串对象
- `length` 属性 长度
- `concat(String)` 连接两个或更多个字符
- `indexOf(string)` 返回出现字符的位置
- `substr(num1,[num2])`截取字符串
- `toLowerCase()`转成小写
- `toUpperCase()`转成大写
- `replace(str1,str2)` 字符串替换

<!--more-->

### Date日期
- `getYear()`返回年份（`2`位或`4`为）
- `getFullYear()`返回年份(`4`位)
- `getMonth()`返回月份`0-11`
- `getDate()`返回日期`1-31`
- `getDay()`返回星期数`0-6`
- `getHours()`返回小时数`0-23`
- `getMinutes()`返回分钟数`0-59`
- `getSeconds()`返回秒数`0-59`
- `getMilliseconds()返回毫秒数`0-999`

### Math数学对象
- `cell(数值)`大于或等于该数的最小整数
- `floor(数值)`小于或等于该数的最大整数
- `min(数值1，数值2)`返回最小值
- `max(数值1，数值2)`返回最大值
- `pow(数值1，数值2)`返回数值1的数值2的次方
- `random()`返回随机数`0--1`
- `round(数值)`四舍五入
- `sqrt(数值)`开平方根

### 数组对象

- `concat()`返回一个由两个数组合并组成的新数组
- `join()`返回一个由数组中的所有元素连接在一起的`String`对象
- `pop()`删除数组中的最后一个元素并返回该值
- `push()`向数组中添加新元素 返回新长度
- `shift()`删除数组中的第一个元素并返回该值
- `unshift `返回一个数组，在该数组头部插入指定的元素
- `sort()`返回一个元素被排序了的`Array`对象
- `reverse()`返回一个元素反序的`Array`对象
- `splice(index.num,foo...) `返回数组的一个片段 --剪切
- `slice(start,end)`复制 [start,end) 负数的时候 lenght+start/end

    