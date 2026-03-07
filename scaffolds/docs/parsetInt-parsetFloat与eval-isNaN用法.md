---
title: parsetInt-parsetFloat与eval-isNaN用法
date: 2016-07-27 00:50:43
tags: JavaScript
categories: Front-End
---

### parsetInt与parseFloat

- parsetInt   把字符串的前缀部分分析成整型数字 如果首字不是数字 分析出非数字 NaN
- 对于parseInt如果碰到前缀有小数点的 舍弃小数点后面的部分
<!--more-->	
- parsetFloat  把字符串的前缀部分分析成整型浮点型

```javascript
	
var age = '12';
	age = parseInt(age);//parsetint 分析字符串里面 有没有整型值 把字符串转换成整型  
	age +=14;//这里需要注意 +号碰到字符换 会连接字符换
	alert(age); //26 
```
    
```javascript
var age = '12.5435abvds';
	age = parseInt(age);
	age +=1;
	alert(age); // 13 */
```
```javascript
	var age = '12afa12';
	age = parseInt(age);
	age +=1;
	alert(age);//13
```
```javascript
 	var age = 'hellworld234';
 	age = parseInt(age);
 	alert(age);//没有值  因为：  把字符串的前缀部分分析成整型数字 如果首字不是数字 分析出非数字 NaN*/
```

```javascript
 	var age = '12.5435abvds';
	age = parseFloat(age);
	age +=1;
	alert(age);//13.5435
  ```
    
---
    
 ### isNaN与eval
    
  - `NaN`-一个特殊变量 代表非数字(`not is a number`)

-  `isNaN()`用来判断某个变量为 非数字正无穷大 负无穷大  `isNan()`返回一个布尔值

- `isNaN()`只是用来判断`parseInt` ` parseFloat`的返回值

-  提示：在数学里 `1/0 ` -->没有意义 无穷大

- ` isFinity()`用于判断一个数值是否有限 对于`1/0  -1/0`这样的结果判断为`false `因为它们为正负无穷大


```javascript
		var age = '45fafd123';
		age = parseInt(age);

		if(isNaN(age)){
			alert('是非数字');
		}else{
			alert('你的年龄是'+age);
		}

```

```javascript
	var age = 1/0;
		alert(age);//Infinity(正无穷大)

		var age = -1/0;
		alert(age);//-Infinity*/
```

```javascript

		//isfinity  
		
		var age = 1/0;
		if (isFinite(age)) {
			alert('你的年龄是有有限的'+age);
		}else{
			alert('你不可能这么大');
		}

		var age = -1/0;
		if (isFinite(age)) {
			alert('你的年龄是有有限的'+age);
		}else{
			alert('你不可能这么大');
		}
```

#### `eval:`直接执行一段`js`代码

比如两台 计算机做通信 `A-B `有可能发`xml json` 数据等  也有可能发送`js`代码
    
```javascript
var t = 3;
	t +=3;
	eval('t+=3');//直接执行一段js代码

	alert(t);
	eval("alert('快点')");
  ```
    
