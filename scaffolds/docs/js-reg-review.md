---
title: 正则回顾总结
date: 2018-04-10 10:09:43
tags: 
  - JavaScript
  - 正则表达式
categories: Front-End
---

## 一、简介


### 1.1 正则表达式的web常见场合

- 邮箱验证
- 用户名验证
- 替换字符串某一部分
- 信息采集 用来分析有效的代码段



### 1.2 字符串应用正则

 * `string.match(reg) `正则查找字符串 
 * `string.search(reg)` 正则查找位置
 * `string.replace(reg,'newstr')`正则替换
 * `string.split（reg）`正则拆分
 
### 1.3 正则表达式3句话

#### 1.3.1 要找什么字符？（5中方法）

- 字面值 比如：`hi`就是找`hi`
- 字符的集合`[abcd] `匹配`abdc`任意一个
- 用范围来表示字符`[0-9] [a-z][A-Z]`
- 字符簇 就是系统为常用的字符集合创建的一个简写
  - 例如：`\d` 表示`[0-9] ` `\w`代表`[0-9a-zA-Z_]`  `\s`代表`[\t\v\f\r\n]`（空白符）
- 补集的形式来表示字符集合
  - 例如：`[0-9]` 补集 `[^0-9]`
  - 对于字符簇只需把字母大写即可表示补集 `\d` -->`\D`（非数字）  `\w`-->`\W` （代表`a-z0-9A-Z`之外的东西） `\s` -->`\S`(代表非空白字符)
- 点代表 任意字符 (不包括换行符)

#### 1.3.2 从哪里找,找到哪？

- `\b `单词边界  `\bhi `从单词边界开始匹配`hi`
- `\B` 单词的非边界 把单词的中间某一部分取出来  把中间含有hi的单词取出来 即`hi`不能再两端
- `^` 从字符串的起始位置开始匹配
- `$ `匹配到字符串的额结束位置

#### 1.3.3 找多少

 * `*`表示匹配`0-`无穷` == `等价`(0,)`
 * `+`表示匹配`1-`无穷 `==`等价`(1,)`
 * `?`表示`[0,1] ==` 等价`(0,1)`
 * `a(n)`: 字符a准确出`现n`次
 * `a(n,)`:字符`a`至少出现`n`次
 * `a(n,m):n`到`m`次

### 1.3 贪婪模式

 * 个数修饰符默认是贪婪模式 尽量多找
 * 是指在上面的个数修饰符后面加`?`，则为非贪婪模式，尽量少的找

**模式**：
 
* 以匹配为例默认情况 match找到一次就结束 能否告诉匹配过程 一直找 在全文范围内一直找
* `g` 表示全局模式 global  找所有的  而不是就找一行就结束
* `i` ignore 忽略大小写
* `s` 单行模式（把整篇文章看成一行）js不支持单行模式
* `m` 多行模式

## 二、语法


### 2.1 基本元字符

- `.` ： 匹配除了换行符之外的任何单个字符
- `\` ： 在非特殊字符之前的反斜杠表示下一个字符是特殊的
- `| `： 逻辑或操作符
- `[]` ：定义一个字符集合，匹配字符集合中的一个字符，在字符集合里面像 `.`，\这些字符都表示其本身
- `[^]`：对上面一个集合取非
- `- `：定义一个区间，例如`[A-Z]`，其首尾字符在 `ASCII` 字符集里面

### 2.2 数量元字符

- `{m,n}` ：匹配前面一个字符至少 `m` 次至多 `n` 次重复，还有`{m}`表示匹配 `m` 次，`{m,}`表示至少 `m` 次
- `+` ： 匹配前面一个表达式一次或者多次，相当于`{1,}`，记忆方式追加`(+)`，起码得有一次
- `*` ： 匹配前面一个表达式零次或者多次，相当于`{0,}`，记忆方式乘法`(*)`，可以一次都没有
- `?` ： 单独使用匹配前面一个表达式零次或者一次，相当于 `{0,1}`

### 2.3 位置元字符

- `^` ： 单独使用匹配表达式的开始
- `\$ `： 匹配表达式的结束
- `\b`：匹配单词边界
- `\B`：匹配非单词边界
- `(?=p)`：匹配 `p` 前面的位置
- `(?!p)`：匹配不是 `p` 前面的位置

### 2.4 特殊元字符

- `\d`：`[0-9]`，表示一位数字，记忆方式 digit
- `\D`：`[^0-9]`，表示一位非数字
- `\s`：`[\t\v\n\r\f]`，表示空白符，包括空格，水平制表符（\t），垂直制表符（\v），换行符（\n），回车符（\r），换页符（\f），记忆方式 space character
- `\S`：`[^\t\v\n\r\f]`，表示非空白符
- `\w`：`[0-9a-zA-Z]`，表示数字大小写字母和下划线，记忆方式 word
- `\W`：`[^0-9a-zA-Z]`，表示非单词字符

### 2.5 标志字符

- `g` : 全局搜索 记忆方式global
- `i` ：不区分大小写 记忆方式 ignore
- `m` ：多行搜索


## 三、match，test，exec，search的返回值


### 3.1 match的用法

**在不加全局“g”的情况下**

```javascript
var str="wo shi zhong guo ren";

console.log(str.match(/o/));

// 返回的结果是：["o", index: 1, input: "wo shi zhong guo ren"]；
```

**在加全局“g”的情况下**

```javascript
var str="wo shi zhong guo ren";

console.log(str.match(/o/g));

返回的结果是：["o", "o", "o"]；
```

### 3.2 exec的用法


```javascript
var str="wo shi zhong guo ren";

var re=/o/;

console.log(re.exec(str));

// 返回的结果是：["o", index: 1, input: "wo shi zhong guo ren"]；
// exec返回的和match不加全局“g”’一样
```

### 3.3 test的用法


```javascript
var str="wo shi zhong guo ren";

var re=/o/;

console.log(re.test(str));

// 返回的结果是：true（如果找不到返回的则是false）
　　　　
```

### 3.4 search的用法


- 关于search用法其实很简单，它和indexOf是一样的，就是找到index，而且是从前往后数的。

```javascript
var str="wo shi zhong guo ren";
var re=/o/;

console.log(str.search(re));

返回的结果是：1；
```

## 四、应用

### 4.1 例1

> 在线演示 https://codepen.io/poetries/pen/xWMRxR

```html
<html>
<head>
	<meta charset="UTF-8">
	<title>正则-例子1</title>
	<style type="text/css">
		textarea{
			width: 400px;
			height: 200px; 
		}
	</style>
</head>
<body>
	<textarea id='cont'></textarea>
	<p><input type="button" value="匹配hi" onclick="t1();"></p>
	<p><input type="button" value="正匹配单词hi" onclick="t2();"></p>
	<p><input type="button" value="匹配hi开头的单词但不是hi" onclick="t3();"></p>
	
	<script type="text/javascript">
            function t1(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /hi/;//仅仅是看字符串中有没有hi
            	alert(reg.test(cv));//满足 返回true  不满足 返回false
            }
            function t2(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /\bhi\b/;//正则测试单词hi
            	alert(reg.test(cv));//满足 返回true  不满足 返回false
            }
            function t3(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /\bhi\b/;//正则测试hi开头的单词但不是hi
            	alert(reg.test(cv));//满足 返回true  不满足 返回false
            } 
    </script>
</body>
</html>
```

### 4.2 例2-要找什么字符串

> 在线演示 https://codepen.io/poetries/pen/oqmYNw

```html
<html>
<head>
	<meta charset="UTF-8">
	<title>要找什么字符</title>

    <style type="text/css">
    	textarea{
    	width: 400px;
    	height: 200px; 
    	}
    </style>
</head>
<body>
	<textarea id='cont'></textarea>
	<p><input type="button" value="找不好的数字" onclick="t1();"></p>
	<p><input type="button" value="有没有数字" onclick="t2();"></p>
	<p><input type="button" value="有没有大写字母" onclick="t3();"></p>
	<p><input type="button" value="是否全为数字" onclick="t4();"></p>
	
	<script type="text/javascript">
            function t1(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /[347]/;// 匹配347任意一个字符的集合[abcd] 匹配abdc任意一个
            	alert(reg.test(cv));
            }
            function t2(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	//var reg = /[0123456789]/;
            	//var reg = /[0-9]/;// 匹配有没有数字
            	var reg = /\d/;// \d 表示[0-9]
            	alert(reg.test(cv));
            }
            function t3(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /[A-Z]/;// 匹配有没有数字
            	alert(reg.test(cv));
            }
            function t4(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /[^0-9]/;// 匹配非数字 0-9之外的字符  对于网上发布手机号之类的很有用 比如1300 把00换成OO 就没法认出
            	if(reg.test(cv)){
            		alert('有非数字存在');
            	}else{
            		alert('全是数字');
            	}
            }
	</script>
</body>
</html>
```

### 4.3 例3-从哪里开始匹配

> 在线演示 https://codepen.io/poetries/pen/jzdVOo

```html
<html>
<head>
	<meta charset="UTF-8">
	<title>74-从哪里开始匹配</title>
	<style type="text/css">
		textarea{
			width: 400px;
			height: 200px;
			
		}
	</style>
</head>
<body>
	<textarea id='cont'></textarea>
	<p><input type="button" value="匹配hi" onclick="t1();"></p>
	<p><input type="button" value="匹配hi开头及hi开头的单词" onclick="t2();"></p>
	<p><input type="button" value="匹配hi开头的单词但不是hi" onclick="t3();"></p>
	<p><input type="button" value="匹配进行时的单词" onclick="t4();"></p>
	<p><input type="button" value="匹配un前缀的反义词" onclick="t5();"></p>
	<p><input type="button" value="匹配单词中间的hi部分" onclick="t6();"></p>
	<p><input type="button" value="匹配输入的名字是不是lisi" onclick="t7();"></p>
	
	
	<script type="text/javascript">
            function t1(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /hi/;//仅仅是看字符串中有没有hi
            	alert(reg.test(cv));//满足 返回true  不满足 返回false
            }
            function t2(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	//var reg = /\bhi.+/;// 错误1 匹配hi开头的单词
            	////var reg = /\bhi\w+/;// 错误2
            	var reg = /\bhi\w*/; 
            	alert(reg.exec(cv));//exec返回一个对象  没找到返回none
            }
            function t3(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /\bhi/;//正则测试hi开头的单词但不是hi
            	alert(reg.exec(cv));//exec返回一个对象  没找到返回none
            } 
            function t4(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /\b[\w]+ing\b/;//*表示匹配0-无穷  +表示匹配1-无穷
            	alert(reg.exec(cv));
            } 
            function t5(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /\bun[\w]+\b/;//匹配un前缀的反义词
            	alert(reg.exec(cv));
            }
            function t6(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /\Bhi\B/;//匹配单词中间的hi部分
            	alert(reg.exec(cv));
            }
            function t7(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /^lisi$/;//匹配输入的名字是不是lisi
            	alert(reg.exec(cv));
            }
	</script>
</body>
</html>
```

### 4.4 例4 正则应用字符串

> 在线演示 https://codepen.io/poetries/pen/dmaOPz

```html
<html>
<head>
	<meta charset="UTF-8">
	<title>正则应用字符串</title>
	<style type="text/css">
		textarea{
			width: 400px;
			height: 200px; 
		}
	</style>

</head>
<body>
	<textarea id='cont'></textarea>
	<p><input type="button" value="查找中间含有hi的单词" onclick="t1();"></p>
	<p><input type="button" value="查找所有中间含有hi的单词" onclick="t2();"></p>
	<p><input type="button" value="查找所有中间含有hi的单词，不区分大小写" onclick="t3();"></p>
	<p><input type="button" value="替换JavaScript标签" onclick="t4();"></p>
	<p><input type="button" value="把连接换成空连接" onclick="t5();"></p>
	<p><input type="button" value="把每一行的结尾的数字换成#" onclick="t6();"></p>
	<p><input type="button" value="替换goods中多余的O" onclick="t7();"></p>

    <script type="text/javascript">
            function t1(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /\Bhi\B/;//查找中间含有hi的单词
            	alert(cv.match(reg));
            }
            function t2(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /\Bhi\B/g;//查找所有中间含有hi的单词
            	alert(cv.match(reg));
            }
            function t3(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /\Bhi\B/gi;//查找所有中间含有hi的单词  g是全局 i ignore 忽略大小写
            	alert(cv.match(reg));
            }
            function t4(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var  reg = /<script.*<\/script>/;//替换JavaScript标签
            	alert(cv.replace(reg,'哈哈哈'));
            }
            function t5(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	  /*
                        . 代表任意,但不包括换行
                        可以用一对反义词来匹配所有. \d\D等
                        不能跨行（贪婪模式）
                  */
                 
            	var reg = /<a[\s]+[\d\D]*<\/a>/; //正则替换链接
                    alert(cv.replace(reg,'<a href="#">文字</a>')); 
            }
            function t6(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var  reg = /\d+$/gm;//把每一行的结尾的数字换成#   m 多行模式
            	alert(cv.replace(reg,'#'));
            }
            function t7(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var  reg = /go{3,}?ds/;//替换goods中多余的O
            	alert(cv.replace(reg,'goods'));
            }
	</script>
</body>
</html>
```

### 4.5 例5-预查

> 在线演示 https://codepen.io/poetries/pen/MVLbwW

```html
<html>
<head>
	<meta charset="UTF-8">
	<title>预查</title>

	<style type="text/css">
		textarea{
			width: 400px;
			height: 200px; 
		}
	</style>

</head>
<body>
	<textarea id='cont'></textarea>
	<p><input type="button" value="匹配进行时的单词" onclick="t1();"></p>
	<p><input type="button" value="匹配进行时的单词的词根部分,正向预查" onclick="t2();"></p>
	<p><input type="button" value="查找winxp,负向预查" onclick="t3();"></p>
	<p><input type="button" value="找出un*系列单词的词根" onclick="t4();"></p>

	<script type="text/javascript">
            function t1(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /\b[\w]+ing\b/;
            	alert(cv.match(reg));
            } 
            function t2(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /\b[\w]+(?=ing)/g;//匹配进行时的单词的词根部分  不要ing结尾  预查不消耗字符
            	alert(cv.match(reg));
            } 
            function t3(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /\bwin(?!95)/g;//win98 win97 win95 win32 winxp win2003要求把win95过滤
            	alert(cv.match(reg));
            } 
            function t4(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	//var reg = /\w+(?<=un)/g;//找出un*系列单词的词根  js不支持向前正向预查
            	alert(cv.match(reg));
            } 
 
	</script>
</body>
</html>
```

### 4.6 例6-反向引用

> 在线演示 https://codepen.io/poetries/pen/LdqbVL

```html
<html>
<head>
	<meta charset="UTF-8">
	<title>反向引用</title>

	<style type="text/css">
		textarea{
			width: 400px;
			height: 200px; 
		}
	</style>

</head>
<body>
	<textarea id='cont'></textarea>
	<p><input type="button" value="把连接换成空连接，保留文字" onclick="t1();"></p>

	<script type="text/javascript">
            function t1(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /<a[\s]+[^>]+>([^<>]+)<\/a>/; //链接表达式  这个一部分是子表达式 ([^<>]+)
                    // alert(reg.exec(cv)); 
                    
                alert(cv.replace(reg,'<a href="#"">$1</a>'));
            }
	</script>
</body>
</html>
```

### 4.7 例7-正则练习

> 在线演示 https://codepen.io/poetries/pen/dmaOYV

```html
<html>
<head>
	<meta charset="UTF-8">
	<title>正则练习</title>
	<style type="text/css">
		textarea{
			width: 400px;
			height: 200px; 
		}
	</style>

</head>
<body>
<textarea id='cont'></textarea>
	<p><input type="button" value="1-找首尾相同的单词" onclick="t1();"></p>
	<p><input type="button" value="2-手机号第4位到第七位换成*" onclick="t2();"></p>
	<p><input type="button" value="3-统一空格" onclick="t3();"></p>
	<p><input type="button" value="4-把名字中的,去掉" onclick="t4();"></p>
	<p><input type="button" value="5-把aaabb换成ab" onclick="t5();"></p>

        <script type="text/javascript">
           function t1(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /\b([\w])[\w]*\1\b/g;// \1注意引用方式 [\w]任意一个 [\w]*任意多个 找首尾相同的单词
            	/**
            	 *  *如何引用子表达式所匹配的结果？
             *
             * 答： 在表达式内部 反向引用时 \n来匹配第N个子表达式的结果 子表达式当成变量来传递时，$N来匹配第N个子表达式的匹配结果
             * 
            	 */
            	alert(cv.match(reg));
            }
            function t2(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /(1(3|5|8|)\d)\d{4}(\d{4})/;//字表达式(3|5|8|)  (\d{4})  {4}代表任意4个  
            	// alert(cv.match(reg));//打印结果18878553070，188，3070
            	alert(cv.replace(reg,'$1****$3'));//188****4070
            }
            function t3(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /[ \t\u3000]+/g;//找空白符  第一个是半角的空格  \s包含所有空白符  \u3000表示 全角空格的16进制Unicode编码
            	alert(cv.replace(reg,','));//
            }
            function t4(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            var reg = /([\u4E00-\u9FA0]),([\u4E00-\u9FA0])/g;  // 找中文用Unicode编码表的中文范围
            	alert(cv.replace(reg,','));
            }
            function t5(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            var reg = //;  
            	alert(cv.replace(reg,','));
            }
	</script>
</body>
</html>
```

### 4.8 例8-常用正则

> 在线演示 https://codepen.io/poetries/pen/GxzNoG

```html
<html>
<head>
	<meta charset="UTF-8">
	<title>常用正则解答</title>
	<script type="text/javascript">
            function t1(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /(\w)\1+/g; //查找连续多个字符  把aaabbccdd换成abcd这个格式
            						/**\1 后向引用，表示表达式中，从左往右数，第一个左括号对应的括号内的内容。
            以此类推，\2表示第二个，\0表示整个表达式**/
            	alert(cv.replace(reg,'$1'));
            }
            function t2(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	//手机号正则：
            	//1开头
            	//358第二位
            	//后九位
            	var reg = /1[358]\d{9}/g; // 这种情况适合在一段文本中分析出手机号
            	alert(cv.match(reg));//分析手机号
            }
            function t3(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /^1[358]\d{9}$/g;
            	alert(reg.test(cv));// test 验证手机号
            }
            function t4(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /^\s+|\s+$/g; // | 并列 或者 去除两端空格
            	alert('--'+cv.replace(reg,'')+'--');
            }
            //借助正则限制在一个有限范围内 防止sql注入
            function t5(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /^[\w\u4E00-\u9FA0]{4,16}$/; // \u4E00-\u9FA0 中文对应的Unicode编码 验证由字母数字下划线中文组合的4-16位用户名 
            	alert(reg.test(cv));
            }
            function t6(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = /^[0-9a-zA-Z]\w*(\.[\w]+)*@[0-9a-zA-Z\-]+(\.[\w]+)+$/;
            	alert(reg.test(cv));
            }
            function t7(){
            	var cont = document.getElementById('cont');
            	var cv = cont.value;
            	var reg = //;
            	alert(cv.replace(reg,''));
            }
	</script>
</head>
<body>
	<textarea id='cont'></textarea>
	<p><input type="button" value="1-替换相同字符串" onclick="t1();"></p>
	<p><input type="button" value="2-分析出手机号" onclick="t2();"></p>
	<p><input type="button" value="3-验证手机号" onclick="t3();"></p>
	<p><input type="button" value="4-去除两端空格" onclick="t4();"></p>
	<p><input type="button" value="5-验证由字母数字下划线中文组合的4-16位用户名" onclick="t5();"></p>
	<p><input type="button" value="6-验证邮箱" onclick="t6();"></p>
	<p><input type="button" value="7-清空script代码" onclick="t7();"></p>

</body>
</html>
```

## 五、总结

![](http://7xq6al.com1.z0.glb.clouddn.com/JavaScript%20%E6%AD%A3%E5%88%99%E8%A1%A8%E8%BE%BE%E5%BC%8F.gif)


## 六、扩展阅读

- [梳理常用的正则表达式](http://blog.poetries.top/2016/07/09/%E6%A2%B3%E7%90%86%E5%B8%B8%E7%94%A8%E7%9A%84%E6%AD%A3%E5%88%99%E8%A1%A8%E8%BE%BE%E5%BC%8F/)
- [一些总结](http://blog.poetries.top/handbook/)
