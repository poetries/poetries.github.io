---
title: JavaScript&&PHP常用函数对比
date: 2016-11-12 16:08:24
tags: 
    - JavaScript
    - PHP
categories: Front-End
---

#### 字符函数
---

||JavaScript|php|
|---|---|---|
|获取字符串长度|	`字符串.length`	|`strlen( 字符串 )`;|
|截取字符串|	`字符串.substr( 起始位 [,长度] )`;|	substr( 字符串, 起始位 [,长度] );|
|字符串定位（子字符串 在字符串 中出现的位置）|	字符串.indexOf( 子字符串  );<br>字符串.lastIndexOf( 子字符串 );	|strpos( 字符串, 子字符串 );<br>strrpos( 字符串, 子字符串 );|
|拆分为数组	|字符串.split( 分割符 );	|explode( 分隔符, 字符串 );|
|转化为大写	|字符串.toLowerCase();	|strtoupper( 字符串 );|
|转化为小写|	字符串.toUpperCase();	|strtolower( 字符串 );|
<!--more-->
### 数组函数
---

||JavaScript|php|
|---|---|---|
|获取数组长度	|数组.length;	|count( 数组 ) 或  sizeof( 数组 );|
|连接为字符串	|数组.join( 连接符 );|	implode( 连接符, 数组 );|
|头部压入|	数组.unshift( 元素1, 元素2… );|	array_unshift( 数组, 元素1, 元素2… );|
|头部弹出	|数组.shift();|	array_shift( 数组 );|
|尾部压入	|数组.push( 元素1, 元素2… ) ;|	array_push( 数组 , 元素1, 元素2… );|
|尾部弹出	|数组.pop();	|array_pop( 数组 );|

### 时间函数
---

||JavaScript  月日时分秒均无前导零|php  以下月日时分秒均含前导零|
|---|---|---|
|获取年份|	new Date().getFullYear();	|date( 'Y' );|
|获取月份|	new Date().getMonth(); //0~11	|date( 'm' );  //01~12|
|获取几号|	new Date().getDate();	|date( 'd' );|
|获取星期|	new Date().getDay();  //0~6	|date( 'N' );  //1~7|
|获取小时|	new Date().getHours();|	date( 'H' );|
|获取分钟|	new Date().getMinutes();	|date( 'i' );|
|获取秒|	new Date().getSeconds();|	date( 's' );|
|获取时间戳	|new Date().getTime()/1000;|	time();|

### 数学函数
---

||JavaScript  |php |
|---|---|---|
|舍一取整|	Math.floor( 变量 ) ;|	floor( 变量 );|
|进一取整|	Math.ceil( 变量 ) ;|	ceil( 变量 );|
|随机数|	Math.random(); //0~1|	mt_rand( 起始, 终止 );|
|幂运算|	Math.pow( 底数, 指数 );|	pow( 底数, 指数 );|
|开平方|	Math.sqrt( 变量 );|	sqrt( 变量 );	|