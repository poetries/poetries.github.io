---
title: CSS块级元素和行内元素
date: 2016-03-16 16:24:08
tags: CSS
categories: Front-End
---


`HTML`中的元素可分为两种类型：块级元素和行级元素。这些元素的类型是通过文档类型定义（DTD）来指明。块级元素：显示在一块内，会自动换行，元素会从上到下垂直排列，各自占一行，如`p`,`ul`,`form`,`div`等标签元素。行内元素：元素在一行内水平排列，高度由元素的内容决定，`height`属性不起作用，如span,input等元素。

<!--more-->
### 一、块级元素：block element
---

每个块级元素默认占一行高度，一行内添加一个块级元素后无法一般无法添加其他元素（`float`浮动后除外）。两个块级元素连续编辑时，会在页面自动换行显示。块级元素一般可嵌套块级元素或行内元素；
块级元素一般作为容器出现，用来组织结构，但并不全是如此。有些块级元素，如只能包含块级元素。

DIV 是最常用的块级元素，元素样式的`display:block`都是块级元素。它们总是以一个块的形式表现出来，并且跟同级的兄弟块依次竖直排列，左右撑满。

### 二、行内元素：inline element
---

也叫内联元素、内嵌元素等；行内元素一般都是基于语义级(`semantic`)的基本元素，只能容纳文本或其他内联元素，常见内联元素 “a”。比如 SPAN 元素，IFRAME元素和元素样式的display : inline的都是行内元素。例如文字这类元素，各个字母 之间横向排列，到最右端自动折行。

### 三、block（块）元素的特点:
---

①、总是在新行上开始；
②、高度，行高以及外边距和内边距都可控制；
③、宽度缺省是它的容器的100%，除非设定一个宽度。
④、它可以容纳内联元素和其他块元素

### 四、inline元素的特点
---

①、和其他元素都在一行上；
②、高，行高及外边距和内边距不可改变；
③、宽度就是它的文字或图片的宽度，不可改变
④、内联元素只能容纳文本或者其他内联元素

对行内元素，需要注意如下:

> 设置宽度width 无效。 设置高度`height` 无效，可以通过`line-height`来设置。 设置margin
> 只有左右`margin`有效，上下无效。
> 设置`padding`只有左右padding有效，上下则无效。注意元素范围是增大了，但是对元素周围的内容是没影响的。

### 五、常见的块状元素
---

> address – 地址
blockquote – 块引用
center – 举中对齐块
dir – 目录列表
div – 常用块级容易，也是CSS layout的主要标签
dl – 定义列表
fieldset – form控制组
form – 交互表单
h1 – 大标题
h2 – 副标题
h3 – 3级标题
h4 – 4级标题
h5 – 5级标题
h6 – 6级标题
hr – 水平分隔线
isindex – input prompt
menu – 菜单列表
noframes – frames可选内容，（对于不支持frame的浏览器显示此区块内容
noscript – 可选脚本内容（对于不支持script的浏览器显示此内容）
ol – 有序表单
p – 段落
pre – 格式化文本
table – 表格
ul – 无序列表

### 六、常见的内联元素
---

> a – 锚点
abbr – 缩写
acronym – 首字
b – 粗体(不推荐)
bdo – bidi override
big – 大字体
br – 换行
cite – 引用
code – 计算机代码(在引用源码的时候需要)
dfn – 定义字段
em – 强调
font – 字体设定(不推荐)
i – 斜体
img – 图片
input – 输入框
kbd – 定义键盘文本
label – 表格标签
q – 短引用
s – 中划线(不推荐)
samp – 定义范例计算机代码
select – 项目选择
small – 小字体文本
span – 常用内联容器，定义文本内区块
strike – 中划线
strong – 粗体强调
sub – 下标
sup – 上标
textarea – 多行文本输入框
tt – 电传文本
u – 下划线

### 七，可变元素
---

可变元素为根据上下文语境决定该元素为块元素或者内联元素。

 - applet - java applet
 - button - 按钮
 - del - 删除文本
 - iframe - inline frame
 - ins - 插入的文本
 - map - 图片区块(map)
 - object - object对象
 - script - 客户端脚本
 
### 八、行内元素与块级元素有什么不同
---

 - 区别一：

  - 块级：块级元素会独占一行，默认情况下宽度自动填满其父元素宽度

  - 行内：行内元素不会独占一行，相邻的行内元素会排在同一行。其宽度随内容的变化而变化。

 - 区别二：

  - 块级：块级元素可以设置宽高

  - 行内：行内元素不可以设置宽高

 - 区别三：

  - 块级：块级元素可以设置`margin`，`padding`

  - 行内：行内元素水平方向的`margin-left`; `margin-right`;

 padding-left; padding-right;可以生效。但是竖直方向的`margin-bottom;` ` margin-top`; `padding-top`; `padding-bottom;`却不能生效。
 

 - 区别四：

  - 块级：`display:block;`

  - 行内：`display:inline;`
  


可以通过修改`display`属性来切换块级元素和行内元素

