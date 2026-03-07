---
title: JavaScript对象
date: 2016-07-27 11:40:43
tags: JavaScript
categories: Front-End
---

### 创建对象
---
<!--more-->
- 对象的概念：
    - 对象和数组的本质一样 都是组织一堆数据
    - 只不过 对象的下表不为数字而且无序
    - 每个编号-->内容
    - 属性-->值
 
-  对象和数组的本质一样 都是组织一堆数据

-  只不过 对象的下表不为数字而且无序
 
-  **创建对象：**（不仅给值 还给属性）
  
 - 创建对象和数组的[]不一样 
 - 和创建对象用{}
 - 和创建数组直接放置的值不一样 创建对象时值前面还要加上属性
 - 创建语法:`{属性1:值1,属性2:值2}`
 
 
- 对象单元值的引用：（两种方法）

  - `Obj.属性`
  - `Obj['属性']`

```javascript
var stu = {name:'小明',age:22,number:007,score:99};
// alert(stu);

//这种方法不推荐
//alert(stu['name']);// name需要加上单引号 不然就和变量一样了

//推荐用法
alert(stu.score);

```

### 对象的遍历
---

- **遍历对象：**
   - 因为对象的属性和数组的下标不一样  
   - 数组的下表从0开始并且有规律的递增  因此可以用for循环遍历
 
  - 对象的属性 没有规律的
  -  for in结构来遍历
   ```
      For(per in Obj){
        ......
      }
     ```
 
注意：在`for in `结构中循环得到的属性取值时不能用`Obj.属性`的方式  `只能用中括号`
 
- 对象和数组本质一个键值对

```javascript
var stu = {name:'小明',age:22,number:007,score:99};

//注意：在for in 结构中循环得到的属性取值时不能用Obj.属性的方式  只能用obj[属性]

	for(var i in stu){//把stu里面的所有属性依次赋给i遍历输出
		document.write(stu[i]+'<br>');//stu['i'] 不能这样写   stu['name'] 必须加上单引号 否则系统理解为name是变量  name是属性 是一个字符
	}

```

### 对象的单元删除
---

- 对象的单元删除:对象单元的删除delete obj.属性

```javascript
var stu = {name:'小明',age:22,number:007,score:99};

	for(var i in stu){
		document.write(stu[i]+'<br>');
	}
	document.write('<hr>');
	delete stu.score;

		for(var i in stu){
		document.write(stu[i]+'<br>');
	}
```

### 对象的方法
---

- 在js中 函数本身就是变量 而在数组和对象中存储的就是‘变量’
-  对象的某个属性的值--没有可能是一个哈函数？也是可以的
-  对象的某个属性对象的值可以是函数，如果是函数时，这个属性叫做方法
 
- 如果对象的某个方法（属性），需要调用自身的某个属性值，可以在函数中用一个关键词this来代替自己这个对象
 
 - `this`-->指向当前正在调用这个方法的对象（对象自身）

```javascript
//写法1
var stu = {name:'张三',age:20,talk:function (){alert('哈哈哈');}};
// alert(stu.talk);
stu.talk();//调用这个函数
```
   
```javascript
//写法2

var zhang = {name:'张三',age:20,talk:null};
var lisi = {name:'李四',age:22,talk:null};

function t(pname){
	alert('你好'+pname);
}

zhang.talk = t;
zhang.talk(zhang.name);

lisi.talk = t;
lisi.talk(lisi.name);
```

```javascript
//写法3  推荐

var zhang = {name:'张三',age:20,talk:null};
var lisi = {name:'李四',age:22,talk:null};


function t(){
	alert('你好'+this.name);//this指向当前正在调用这个方法的对象
}

zhang.talk = t;
zhang.talk();

lisi.talk = t;
lisi.talk();

```

### JavaScript内置对象:
---

- 在js中 所有的变量 都可以被js引擎包装秤对象来处理
 
-  比如：`str='abd'  `字符串本身没有`length `属性
 
- 但是你去调用`str.length` 在调用一瞬间` js`引擎会把它包装成一下 当做对象来处理 并且给这个赋了一些方法
 
-  对于字符串 布尔值 数值类型 数组 `null `这些变量 虽然没有属性 但是在调用的前一瞬间 js会为他们包装一些属性和方法
 
- 还有一些内置对象，是通过`new `得来的 比如：日期时间对象 先`new` 在调用方法和属性
 
 - `Math`对象  和字符串一样 不用`new `也能直接其方法
 

- **字符串对象的属性和方法：**
 
  - `length `属性： 长度

  -  ` concat`方法：连接两个或者更多个字符串

  -  ` indexOf（String）`返回出现字符串的位置  找不到就返回-1

  -   `substr(num1,[num2])`//截取字符串  num2截取的宽度

  -   `toUpperCase() `转换成大写

  -  ` toLowerCase()`转换成小写

  -  ` replace(oldstr1,newstr2) `//字符串替换

```javascript
var str = 'helloworld';//这是一个字符串变量
 // alert(str.length);
 
 alert(str.concat('中国'));//concat方法：连接两个或者更多个字符串

 alert(str.indexOf('o'));//4 

 alert(str.substr(str.indexOf('o')));//substr截取字符串 一般从开始位置截取 
 									//如有特殊：需要指定截取位置 indexOf（String）返回出现字符串的位置  从当前位置开始截取
 									
 alert(str.toUpperCase());
 alert(str.replace('hello','连英'));// replace(oldstr1,newstr2) 字符串替换
 ```
 
 #### 日期时间对象
 ---

 - 日期时间对象 必须通过new 来得到
 - 早数组可以`new Array()`
 - 造日期时间对象 `new Date();`
 
 - `getYear()`  返回年份（2位或4位）
 - ` getFullYear()` 返回年份（4位）
 - `getMonth() `返回月份（0-11）
 - `getDate()` 返回日期 1-31
 - `getDay()`  返回星期数  0-6
 - `getHours()  `返回小时数0-23
 - `getMinutes()  `返回分钟数 0-59
 - `getSeconds()  `返回秒数  0-59
 - `getMilliseconds()` 返回毫秒数0-999

```javascript
var time = new Date();
alert(time.getYear());//116
alert(time.getFullYear());//2016
alert(time.getMonth());//5
alert(time.getDate());//5
alert(time.getDay());// 星期天 0
alert(time.getHours());//1
alert(time.getSeconds());//17
alert(time.getMinutes());//20
alert(time.getMilliseconds());
```
    
```javascript
//页面上动态时钟
function t(){

    //把年月日 拼接起来
    var time = new Date();
    var year = time.getFullYear();
    var month = time.getMonth();
    var day = time.getDate();
    var hour = time.getHours();
    var minute = time.getMinutes();
    var second = time.getSeconds();

    document.getElementById('clock').value = (year+" "+month+" "+day+" "+hour+":"+minute+":"+second);
    }
    // document.getElementById('clock').value = t();  //error
    var clock = setInterval('t()',1000);
```

#### Math对象
---

-  `Math`对象  和字符串一样 不用`new `也能直接其方法
 
  - `ceil(数值) `大于或等于该数的最小整数
  - `floor(数值)` 小于或等于该数的最大整数
  - `min(数值1,数值2)` 返回最小值
  -  `max()`返回最大值
  - ` pow(num1,num2)`//返回num1的那么次方
  -  `random() `返回随机数  0--1
  - ` round(数值)  `四舍五入 
  -  `sqrt(数值)  `开平方根

```javascript
for (var i = 0; i < 20; i++) {
document.write(5+Math.random()*5+'<br>');//5-10之间的随机
}

alert(Math.round(3.6658));//4
alert(Math.sqrt(2));//1.4
```

```javascript
//输入任意两个数字 返回两个数之间的随机数的整数 
function rd(big,small){
    return Math.ceil(Math.random()*(big-small))+small;

}
for(var i = 0; i < 30; i++) {
    document.write(rd(big,small)+'<br>');
}
//javascript中prompt方法可以让用户输入一个文本，从而作为返回值 prompt返回的是字符串类型
//需要用到parseInt 转成数字型  比如：输入12  实际返回的是'12'
//alert(typeof(window.prompt()));//string

```
