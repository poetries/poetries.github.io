---
title:  jQuery选择器及优化（二）
date: 2016-08-07 21:05:08
tags: jQuery
categories: Front-End
---

### 层级选择器:

通过`DOM`的嵌套关系匹配元素
<!--more-->
- jQuery层级选择器----包含选择器、子选择器、相邻选择器、兄弟选择器4种
	- 包含选择器：`$("a b")`在给定的祖先元素下匹配所有后代元素。(不受层级限制)
	- 子选择器：`$("parent > child")` 在给定的父元素下匹配所有子元素。
	- 相邻选择器：`$("prev + next")` 匹配所有紧接在`prev`元素后的`next`元素。
	- 兄弟选择器：`$("prev ~ siblings")` 匹配`prev`元素之后的所有`sibling`元素。


案例：

```javascript
<BODY>
	<!--包含选择器/子选择器/兄弟选择器/相邻选择器-->
	<div class="main">
		<span>1<img src="images/1.jpg"/></span>
		2<img src="images/1.jpg"/>
	</div>
		3<img src="images/1.jpg">
		4<img src="images/1.jpg">
	<div>
		5<img src="images/1.jpg">
	</div>

	<script type="text/javascript" src="js/jquery.js"></script>
	<script type="text/javascript">
		$(function(){
			//$(".main img").css("border","5px solid red");
			//$(".main > img").css("border","5px solid blue");
			//$(".main + img").css("border","5px solid blue");
			$(".main ~ img").css("border","5px solid blue");
		});
	</script>
 </BODY>
```

综合应用：

```html
<body>
	<h1>沁园春·雪</h1>
	<h2>毛泽东</h2>
	<div>
		<span><div>北国风光，千里冰封，万里雪飘。
			<div>望长城内外，惟余莽莽；大河上下，顿失滔滔。</div>
			<p>山舞银蛇，原驰蜡象，欲与天公试比高。</p>
			<p>须晴日，看红装素裹，分外妖娆。</p>
		</div></span>
			<p id="mp">江山如此多娇，引无数英雄竞折腰。</p>
	</div>
	<p class="c1">惜秦皇汉武，略输文采；唐宗宋祖，稍逊风骚。</p>
	<p class="c1">一代天骄，成吉思汗，只识弯弓射大雕。</p>
	<p>俱往矣，数风流人物，还看今朝。</p>
</body>

<!-- 
	1. 让id为mp的元素文字大小变成30px
	2. 让class名为.c1的元素背景为#CCFF99
	3. 将所有的div和p，统一显示间距
	4. 将所有的div增加 2像素 实线 红色
	5. 将div下的所有子div中文字变蓝色blue
	6. 将div中包含的div颜色变成#FF99FF
	7. 将div的所有兄弟标签p的字体颜色变成蓝色
	8. 将紧跟着div的p标签的边框设为2像素 实线 #009900 
-->

```

### 常用伪类选择器:

可以看作是一种特殊的类选择符

- 选择器		
	- `:first`	匹配找到的第1个元素
	- `:last`		匹配找到的最后一个元素
	- `:eq`		匹配一个给定索引值的元素
	- `:even	`	匹配所有索引值为偶数的元素
    - `:odd	`	匹配所有索引值为奇数的元素
    - `:gt(index)` 匹配所有大于给定索引值的元素
	- `:lt(index)`	匹配所有小于给定索引值的元素
	- `:not`		去除所有与给定选择器匹配的元素

### 特定位置选择器
- :`first/:last/:eq(index)`

例：

```html
<table>
	<tr><th>特定位置选择器</th><th>描述</th></tr>
	<tr><td>:first</td><td>匹配找到的第一个元素</td></tr>
	<tr><td>:last</td><td>匹配找到的最后一个元素</td></tr>
</table>
```

### 指定范围选择器

- `:even/:odd/:gt(index)/:lt(index)`

例：

```html
<table>
	<tr><th>指定范围选择器</th><th>描述</th></tr>
	<tr><td>:first</td><td>匹配找到的第一个元素</td></tr>
	<tr><td>:last</td><td>匹配找到的最后一个元素</td></tr>
	<tr><td>:even</td><td>匹配所有索引值为偶数的元素</td></tr>
	<tr><td>:odd</td><td>匹配所有索引值为奇数的元素</td></tr>
	<tr><td>:gt(index)</td><td>匹配所有索引大于给定索引值的元素</td></tr>
	<tr><td>:lt(index)</td><td>匹配所有索引小于给定索引值的元素</td></tr>
</table>
```

### 排除选择器

- `:not` 非

例：

```html
<table>
	<tr><th>排除选择器</th><th>描述</th></tr>
	<tr><td>:not</td><td>排除符合特定匹配规则的元素</td></tr>
</table>
```

---

### 选择器优化：

- 使用合适的选择器表达式可以提高性能、增强语义并简化逻辑。常用的选择器中，`ID`选择器速度最快，其次是类型选择器。
	- 多用`ID`选择器
	- 少直接使用`class`选择器
	- 多用父子关系，少用嵌套关系
	- 缓存`jQuery`对象

- **使用过滤器**

- `jQuery`提供了2种选择文档元素的方式：选择器和过滤器

	- 类过虑器：根据元素的类属性来进行过滤操作。
		- `hasClass(className)`：判断当前`jQuery`对象中的某个元素是否包含指定类名，包含返回`true`，不包含返回`false`
	- 下标过滤器：精确选出指定下标元素
		- `eq(index)`：获取第N个元素。`index`是整数值，下标从0开始
	- 表达式过滤器 
		- `filter(expr)/(fn)`：筛选出与指定表达式/函数匹配的元素集合。
		- 功能最强大的表达式过滤器，可接收函数参数，也可以是简单的选择器表达式
	- 映射 `map(callback)`：将一组元素转换成其他数组
	- 清洗 `not(expr)`：删除与指定表达式匹配的元素
	- 截取 `slice(start,end)`：选取一个匹配的子集

### 查找

- 向下查找后代元素 
	- `children():`取得所有元素的所有子元素集合（子元素）
	- `find():`搜索所有与指定表达式匹配的元素(所有后代元素中查找)
- 查找兄弟元素` siblings()`查找当前元素的兄弟
