
---
title: javascript 下常用的字符串操作
date: 2016-08-02 17:35:08
tags: 
	- JavaScript
	- Snippet
categories: Front-End
---


#### **`charAt()`** 返回在指定位置的字符。
<!--more-->
```javascript
var str = "abac_dfra_wa";
console.log(str.charAt(3)); //输出 c
```
#### **`charCodeAt()`** 返回在指定的位置的字符的 Unicode 编码。

```javascript
var str = "abac_dfra_wa";
console.log(str.charCodeAt(3)); //输出99
```

#### **`fromCharCode()`** 从字符编码创建一个字符串

```javascript
console.log(String.fromCharCode(72,69,76,76,79)); //输出HELLO
```

#### **`concat()`** 连接字符串

```javascript
var str = "abac_dfra_wa";
console.log(str.concat('_000')); //输出abac_dfra_wa_000
```

#### **`indexOf()`** 检索字符串

```javascript
var str = "abac_dfra_wa"; 
console.log(str.indexOf('ac')); //输出2
```

#### **`lastIndexOf()`** 从后向前搜索字符串。

```javascript
var str = "abac_dfra_wa";
console.log(str.lastIndexOf('ac')); //输出2
```

#### **`match()`** 找到一个或多个正则表达式的匹配

```javascript
var str="1 plus 2 equal 3"
console.log(str.match('plus')); // plus
console.log(str.match('st'));   // null
console.log(str.match(/\d+/g))  // [ '1', '2', '3' ]
```

#### **`replace()`** 替换与正则表达式匹配的子串

```javascript
var str="Hello WoRlD!"
console.log(str.replace(/WoRlD/, "World"));     // Hello World!

var str="Hello WoRlD! "
str += str;
console.log(str.replace(/WoRlD/g, "World")); //替换所有, 输出：Hello World! Hello World! 

var str = "javascript Tutorial ";
console.log(str.replace(/javascript/i, "JavaScript")); //确保匹配字符串大写字符的正确

var name = "Doe, John";
console.log(name.replace(/(\w+)\s*, \s*(\w+)/, "$2 $1")); //将把 "Doe, John" 转换为 "John Doe" 的形式
```

#### **`search()`**  检索与正则表达式相匹配的值(大小写敏感)，未找到输出-1。

```javascript
var str="Hello World!"
console.log(str.search(/World/)); //输出6

var str="Hello World!"
console.log(str.search(/world/i)); //忽略大小写的检索，输出6
```

#### **`slice()`** 提取字符串的片断，并在新的字符串中返回被提取的部分

```javascript
var str="Hello happy world!"
console.log(str.slice(6)); //输出happy world!
console.log(str.slice(6, 11)); //输出happy
```

#### **`split()`** 把字符串分割为字符串数组

```javascript
"|a|b|c".split("|") ////将返回["", "a", "b", "c"]

"How are you doing today?".split(" ",3) //返回 How,are,you

"hello".split("")	//可返回 ["h", "e", "l", "l", "o"]

```


