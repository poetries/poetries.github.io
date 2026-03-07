---
title: moment时间处理相关小结
date: 2018-12-06 11:08:24
tags: 
    - JavaScript
    - moment
categories: Front-End
---

## 一、基础用法

**取当天时间，以YYYY年MM月DD日形式显示**

```js
var now=moment().format("YYYY年MM月DD日");
```

**任意时间戳格式化，以`YYYY-MM-DD HH:mm:ss`形式显示**

```js
 var t1=moment(1411641720000).format('YYYY-MM-DD HH:mm:ss');
 ```
 
**获取前一天日期，格式以`YYYY-MM-DD`形式显示**
 
 ```js
 var t11=moment().day(0).format('YYYY-MM-DD');
 ```
 
**获取本周五日期，格式以`YYYY-MM-DD`形式显示**
 
 ```js
 var t12=moment().weekday(5).format('YYYY-MM-DD');
 ```
 
**获取上周五日期，格式以`YYYY-MM-DD`形式显示**
 
 ```js
 var t13=moment().weekday(-3).format('YYYY-MM-DD');
 ```
 
**获取当前年份、月份、日期**
 
```js
var t14=moment().year()
var t15=moment().month()//此处月份从0开始，当前月要+1
var t16=moment().date();
```

**获取上个月今天的日期，格式以YYYY-MM-DD显示**

```js
var t18=moment().subtract(1, 'months').format('YYYY-MM-DD');
```

**获取上个月日期，格式以YYYY-MM显示**

```js
var t19=moment().subtract(1, 'months').format('YYYY-MM')
```

**获取前一天日期，格式以YYYY-MM-DD显示**

```js
var t20 = moment().subtract(1, 'days').format('YYYY-MM-DD');
```

**获取两个小时之后的时间**

```js
var t22=moment().add(2,'hours').format('YYYY-MM-DD HH:mm:ss');
```

**获取五天前的日期**

- 例如:今天`2018-7-23`，获取到的时间是`2018-7-18`

```js
var t23=moment().subtract(5, 'days').format('YYYY-MM-DD');
```

## 二、更多示例

```js
'use strict'
let moment = require('moment');
//获取当前时间
var now = moment().toDate();
console.log(now)
 
//格式化当前时间
now = moment().format('YYYY-MM-DD');
console.log(now);
 
//其它几种格式化方法
now = moment().format('L') // 10/22/2016 
console.log(now);
 
now = moment().format('LL') // October 22, 2016
console.log(now);
 
//格式化当前时间
now = moment().format('YYYY-MM-DD:HH:MM:SS');
console.log(now);
 
//获取这个月初时间
let startMonth = moment().startOf('month').toDate();
console.log(startMonth);
 
//获取今天开始的时间
let dayOfStart = moment().startOf('day').toDate();
console.log(dayOfStart);
 
//获取今天结束的时间
let dayOfEnd = moment().endOf('day').toDate();
console.log(dayOfEnd);
 
 
//获取＋n小时
let lateHour = moment().add(2,'hour').toDate();
console.log(lateHour);
 
//获取＋n小时
console.log('//获取-n小时')
let beforeHour = moment().subtract(2,'hour').toDate();
console.log(beforeHour);
 
 
//获取＋n天
let lateDay = moment().add(+5,'day').toDate();
console.log(lateDay);
 
//获取-n天
let beforeDay = moment().add(-5,'day').toDate();
console.log(beforeDay);
//也可以表示为
beforeDay = moment().subtract(5,'day').toDate();
console.log(beforeDay);
 
console.log('//获取＋n月')
let lateMonth = moment().add(2,'month').toDate();
console.log(lateHour);
 
//获取＋n月
let beforeMonth = moment().subtract(2,'month').toDate();
console.log(lateHour);
 
 
 
//获取星期
let week = moment().format('dddd');
console.log(week);
 
//获取到现在的年限 如果不满一年显示出具体几个月
let years = moment('2020-12-31').fromNow();
console.log(years);
```
 

## 三、综合

```js
import moment from 'moment'

DATE_TODAY: moment().format('YYYY-MM-DD'),//今天
DATE_YESTERDAY: moment().subtract(1, 'days').format('YYYY-MM-DD'), // 昨天
DATE_1_WEEK_BEFORE: moment().subtract(1, 'weeks').format('YYYY-MM-DD'),// 一周前
DATE_2_WEEKS_BEFORE: moment().subtract(2, 'weeks').format('YYYY-MM-DD'),// 两周前
DATE_3_WEEKS_BEFORE: moment().subtract(3, 'weeks').format('YYYY-MM-DD'),// 
DATE_1_MONTH_BEFORE: moment().subtract(1, 'months').format('YYYY-MM-DD'),
DATE_2_MONTH_BEFORE: moment().subtract(2, 'months').format('YYYY-MM-DD'),
DATE_3_MONTHS_BEFORE: moment().subtract(3, 'months').format('YYYY-MM-DD'),
DATE_1_YEAR_BEFORE: moment().subtract(1, 'years').format('YYYY-MM-DD'),

DATE_3_MONTHS_AFTER: moment().add(3, 'months').format('YYYY-MM-DD'),
DATE_1_YEAR_AFTER: moment().add(1, 'year').format('YYYY-MM-DD'),

DATE_FIRST_DAY_OF_MONTH: moment().startOf('month').format('YYYY-MM-DD'),
DATE_LAST_DAY_OF_MONTH: moment().endOf('month').format('YYYY-MM-DD'),

DATE_7_DAYS_BEFORE: moment().subtract(7, 'days').format('YYYY-MM-DD'),
DATE_30_DAYS_BEFORE: moment().subtract(30, 'days').format('YYYY-MM-DD'),
DATE_90_DAYS_BEFORE: moment().subtract(90, 'days').format('YYYY-MM-DD'),
DATE_100_DAYS_BEFORE: moment().subtract(100, 'days').format('YYYY-MM-DD'),
```

```js
// 最近一个小时时间戳
new Date(moment().add(1, 'h').format('YYYY-MM-DD hh:mm:ss')).getTime()

// 格式化时间戳为日期 2018-12-06:12:21
moment(时间戳 * 1000).format('YY-MM-DD:HH:mm:ss')

// 计算时间当前时间和最近一小时时间差 差分钟
const oneHourBefore = new Date(moment().add(1, 'h').format('YYYY-MM-DD hh:mm:ss')).getTime()
const currTime = Date.now()
const minute = moment(currTime).diff(oneHourBefore), 'minute')
```

## 四、其他

```js
/** 
 * [getTimeList description] 生成时间列表 
 * @param  {[type]} hours [description] 小时 
 * @param  {[type]} step  [description] 分段 
 * @return {[type]}       [description] 时间段列表 
 */  
function getTimeList(hours, step){  
    var minutes = 60  
    var timeArr = []  
    hours = hours  
    step = step   
  
    for(var i = 0; i < hours; i++){  
        var str = ''  
        if(i < 10) {  
            str = 0 + '' + i  
        } else {  
            str = '' + i  
        }  
  
        for(var j = 0; j < minutes; j++) {  
            if(j % step == 0){  
                var s = j < 10 ? ':' + 0 + '' + j : ':' +  j;  
                s = str + s  
                timeArr.push(s)  
            }  
        }  
    }  
  
    return timeArr;  
  
}  
getTimeList(12, 15)  
```


## 五、更多参考

- [Moment.js常见用法总结](https://www.jianshu.com/p/9c10543420de)
