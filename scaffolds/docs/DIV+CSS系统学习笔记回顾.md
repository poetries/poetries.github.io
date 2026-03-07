---
title: DIV+CSS系统学习笔记回顾
date: 2016-09-06 18:24:08
tags: 
  - CSS
  - XHTML
categories: Front-End
---


### 第一部分 HTML

---
#### 第一章 职业规划和前景
---

- **职业方向规划定位：**

  - `web`前端开发工程师
  - `web`网站架构师
  - 自己创业
  - 转岗管理或其他
<!--more-->
- **`web`前端开发的前景展望：**

  - 未来`IT`行业企业需求最多的人才
  - 结合最新的`html5`抢占移动端的市场
  - 自己创业做老板
  - 随着互联网的普及`web`开发成为企业的宠儿和核心

-  **`web`职业发展目标：**

  - 第一、梳理知识架构
    - 负责内容的`HTML`
    - 负责外观的`css`（层叠样式表）
    - 负责行为的`js`
    - `ps`切图

  - 第二、分解目标（起步阶段、提升阶段、成型阶段）

    - 起步阶段：
        - 基本知识的掌握
        - 常用工具的掌握
        - 沟通技巧的掌握（围绕客户的需求）
        - 良好的开发习惯（加注释、对齐方式）

    - 提升阶段：
        - 熟悉掌握`HTML`基本标签和属性
        - 熟练掌握`css`的基本语法和使用
        - 浏览器兼容和w3c标准的掌握
        - 结合`html`+`css`+`js`开始系统项目的开发

    - 成型阶段：
        - 精通`DIV`+`CCS`布局
        - 精通`css`样式表控制`html`标签
        - 熟悉运用`js`制作动态网站的效果
        - 能独立开发完成网站

---

#### 第二章 html基本结构
---

- 认识HTML：

    - `html`不是一种编程语言，是一种标志语言
    - 标记语言是由一套标识标签组成的
    - `html`使用标签来描述网页

- `html`结构：

```
<html>
    <head></head>
    <body></body>
</html>
```

- 不成对出现的标签
`<br>` `<hr>`  `<meta>` `<img>`  `<input..>`  `<option..>`  `<link>`


- **HTML 基本标签的讲解：**

    - `<html>` `<head>` `<body>`标签
    - `<h1>`----`<h6> `仅仅用于标题文本，不要为了产生粗体文本使用它们
    - `<p>`标签  段落标签
    - `<strong><b>`标签

    - 都会让文字产生加粗效果
      - `<strong>`用于强调文本，强度更深，表示重要文本--->用于`SEO`优化
      - `<b>`只是视觉加粗效果--->单纯为了产生加粗

 - `<em>` `<i>`标签
    - `em`用于强调文本
    - `i`只是视觉斜体效果
    - `<strong>`比`<em>`强调更强
 - 特殊符号：
    - `&nbsp`; ---->空格
    - `&gt`; --->大于号
    - `&lt`；--->小于号
    - `&quot`；--->引号
    - `&copy`;-->版权号
---

#### 第三章 html基本标签

---
- `HTMl`基本标签：
    - `span`标签
        - 对被用来组合文档中的行内元素
        - 注意：span没有固定的格式表现，当对它应用样式时，才会产生视觉上的变化
    - `<pre>`标签
        - 文字的格式按源码的排版来显示，我们称之为预处理格式
    -  `<a>`标签--->他有一个必不可少的属性 href 
        - `target`属性：
        - `_self`(在原来页面打开) 
        - ` _blank`（新窗口打开）
        - `_top`（打开时忽略所有的框架） 
        -  `_parent`（在父窗口中打开）

    - 创建锚点和锚链接
    
        - 锚点也是一种超链接，是页面内进行跳转的超链接
             - 第一步：创建锚点 `<a name="锚点名称"></a>`
             - 第二步：使用创建好的锚点名称 `<a href="#锚点名称">内容</a>`
    - `marquee`标签
        - 可以创建一个内容滚动效果

```
<marquee direction="down" loop="4" onmouseover=this.stop() onmouseout=this.start()></marquee>
```
- `direction` 表示滚动方向，取值有（left,right,up,down,默认left）
- `loop `表示滚动循环的次数，默认为无限循环

```
onmouseover=this.stop()  onmouseover=this.start()  scrollamout="1"(滚动速度)
```

- 表示当鼠标移上区域的时候停止滚动，鼠标移开继续滚动

---

#### 第四章 img图片标签与路径
---

- 图片标签与路径：

    - 常见图片格式 `jpg` `png` `gif`
    - `Gif`     （只支持全透明）
    - `Jpeg` /`jpg`	 
    - `Png` 半/全透明都支持

- 图片标签写法 ：
  - `<img src="" alt="" width="" height="" />`

- 图片四要素：
    - `src=""`        图片路径
    - `alt="" `       图片含义
    - ` width="" `     图片宽度 和图片大小保持一致
    - ` height=""`     图片高度 和图片大小保持一致
    - `title=""`

- 路径知识：

  - 相对路径、绝对路径：
      - 相对路径：(Relative Path) 相对于该文件的路径；
      - 绝对路径：(Absolute Path) 从磁盘出发的路径； 

  - `<img src="" …… align="" />` `align`属性--设置图片与后面文字的位置关系
值--`top`、`bottom`、`middle`、`absmiddle`、`left`、`right`

- 在静态页面中：

    - `/`开头表示根目录；
    
    - `./`表示当前目录；（斜画线前面一个点）
    
    - `../`上级目录；（斜画线前面两个点）
    
    - 直接用文件名不带/也表示同一目录

  - 这些都是相对于当前文件的位置来说的，如果用绝对路径的话就是写全了。

---

#### 第五章 三种列表的讲解
---

- 三种列表的知识讲解：
    - `<ul>`无序列表
         - 无序列表是一个没有顺序项目的列表，此列表项默认粗体圆点进行标识

```
<ul>
   <li></li>
   <li></li>
   <li></li>
</ul>
```
- <ol>有序列表
    - 有序列表也是一列项目，只是列表项目使用的是数字进行标记。 有序列表始于 `<ol>` 标签。每个列表项始于 `<li> `标签。
    
```
<ol>
   <li>内容一</li>
   <li>内容二</li>
   <li>内容三</li>
</ol>
```
- 列表符号

  - 无序列表-列表符号:

    - `type="circle"`  空心圆 `type=“disc” ` 实心圆  默认值 `type="square" ` 方块符

  - 有序列表-列表符号
    - `type="A"`    A B C D
    - `type="a"`    a b c d
    - `type="1"`    1 2 3 4  默认值type="I"    I II III type="i"	 i ii iii

  - 列表嵌套

  - 无序列表-嵌套

```
<ul>
 <li>柚子
  <ul>
   <li>沙田柚</li>
   <li>蜜柚</li>
  </ul>
 </li>
 <li>荔枝</li>
 <li>苹果</li></ul>
```

   - 有序列表-嵌套

```
<ol>
 <li>茶
  <ul>
   <li>红茶</li>
   <li>绿茶</li>
  </ul>
 </li>
 <li>果汁</li>
 <li>牛奶</li></ol>
```
- 定义列表
  - 定义列表不仅仅是一列项目，而是项目及其注释的组合。定义列表以 `<dl>` 标签开始。每个定义列表项以 `<dt> `开始。每个自定义列表项的定义以 `<dd>` 开始。

```
<dl>  
     <dt>pc网页制作</dt>  
     <dd>学习DIV+CSS JS JQ 项目实战</dd>  
     <dt>手机网页制作</dt>  
     <dd>手机网页制作实战</dd>
</dl>
```

  - `dd`是对`dt`的解释

    - `< dl>< /dl>`用来创建一个普通的列表,
    - `< dt>< /dt>`用来创建列表中的上层项目，
    - `< dd>< /dd>`用来创建列表中最下层项目，
    - `< dt>< /dt>`和`< dd>< /dd>`都必须放在`< dl>< /dl>`标志对之间。

```
<dl>
    <dt>中国城市</dt>
    <dd>北京 </dd>
    <dd>上海 </dd>
    <dd>广州 </dd>
    <dt>美国城市</dt>
    <dd>华盛顿 </dd>
    <dd>芝加哥 </dd>
    <dd>纽约 </dd>
</dl>
```

- `dl`是d`efinition list`的缩写
- `dt`是`definition title`的缩写
- `dd`是d`efinition description`的缩写


- `list-style`属性具有三个属性分量：
- `list-style-position` ：设置列表项图标的位置，位于文本内或者文本外
- `list-style-type`： 设置列表项图标的类型
- `list-style-image `：使用图像设置列表项图标

---

#### 第六章 表单元素(上)
---

- 表单标签:

  - `<form>`表单标签

    - `<form>`表单是一个包含表单元素的区域，包括起来的都是表单的内容
```
<form>
 <input type="text"/>
</form>
```

- HTML标签 - `Action`和确认按钮： 
    - 当用户单击确认按钮时，表单的内容会被传送到另一个文件。表单的动作属性定义了目的文件的文件名。由动作属性定义的这个文件通常会对接收到的输入数据进行相关的处理。
    
```
<form action="html.do" method="get">    
        username:  <input type="text" name="user" />   
        <input type="submit" value="提  交" />
</form>
```


- `HTML`标签 - 隐藏域隐藏标签：

- 隐藏域在页面中对于用户是不可见的，在表单中插入隐藏域的目的在于收集或发送信息，以利于被处理表单的程序所使用。浏览者单击发送按钮发送表单的时候，隐藏域的信息也被一起发送到服务器

```
<form>        
     <input type="hidden" name="hid" value="value">
</form>
```

- `<input>`标签的掌握

    - 常用`type`类型：

        - `<input type="" name="" value="" />`
        - `type="text" `       单行文本输入框
        - `type="password"`	密码（`maxlength=""`）
        - `type="radio"  `     单项选择（`checked="checked"`） 
        - `type="checkbox" `   多项选择  
        - `type="button"  `	按钮
        - `type="submit"`	提交 ` type="image" `图片提交
        - `type="file"`	上传文件
        - `type="reset"	`重置
        - `type="hidden"`	隐藏

- 关于表单中的设置默认值：
```      
<input type="text" name="" value="今天心情不错" />
<input type="radio" name="" value="" checked="checked">
<input type="checkbox" name="" value="" checked="checked">
```
```
<select name="" >
 <option  value=""></option>
 <option  value="" selected="selected"></option>
<select>
```
- `textarea`没有默认值

- `<label>`标签的使用

  - `<label></label>`
    - `label` 元素不会向用户呈现任何特殊效果。
    - 不过，它为鼠标用户改进了可用性。
    - 如果您在 `label` 元素内点击文本，就会触发此控件。
    - 就是说，当用户选择该标签时，浏览器就会自动将焦点转到和标签相关的表单控件上。

  - `<label>` 标签的` for` 属性应当与相关元素的 `id `属性相同。

  - 例子：（重要---注册表单--用户体验--必做）
``` 
<p>单向选择</p>
<label for="male">男：</label><input type="radio" name="sex" id="male"/>
<label for="nv">女：</label><input type="radio" name="sex"checked="check"/>
```

---

#### 第七章 表单和表格(下)
---

- 表单和表格标签：
    - `<textarea>`文本域标签
    - `<textarea>`标签：
    - `<textarea></textarea>`是文本域标签，可以在其中插入一段文字内容，它有两个常用属性`rows`和`cols`
- 注意：
    - `rows`表示这个文本域有多少行
    - `cols`表示这个文本域有多少列

- 除了这两个属性它还有`readonly`（只读，文本域的内容无法改变，相当于协议）和`title`（鼠标放上提示）

- `<select>`标签的掌握

  - 注：当提交表单时，浏览器会提交选定的项目，或者收集用逗号分隔的多个选项，将其合成一个单独的参数列表，并且在将 `<select>` 表单数据提交给服务器时包括 `name `属性
```
<form>      
    <select name=""  id="">
         <option value="1">1月</option>  
          <option value="2">2月</option>      
</select>
</form>
```
- 常用到的属性：`disabled=“disabled”  name="sel"  size="2"`



- `<table>`表格标签
- ` <table>`表格标签：`<table>`是表格标签，可以用它定义一个表格。
```
<table border="1">
    <tr>
    <td>姓名</td>
    <td>性别</td>
    </tr>
</table>
```

- 注意：`<table>`的`border`属性不能少


- `<tr>` `<td>`标签的使用

    - `<tr>`行标签：

        - `<tr>`可以定义表格中的一行，一个<`tr></tr>`表示一行。
        
```
<table border="1">
<tr>
 <td>姓名</td>
 <td>性别</td>
</tr>

<tr>
 <td>姓名</td>
 <td>性别</td>
</tr>
</table>
```

- `<td>`单元格标签:

    - `<td>`可以定义表格中的一个单元格，`<td></td>`表示一个单元格。
```
<table border="1">
<tr>
<td >姓名</td>
<td>性别</td>
<td>爱好</td>
</tr>
</table>
```
  - `border-collapse` 属性设置是否将表格边框折叠为单一边框：
  - `border-collapse:collapse`;
  - `colspan`左右合并
  - `rowspan`上下合并

**第一部分总结**：

- 非可视化标签：`head`  `meta`  `style`  `scrpit.`..
- 可视化标签：`img`  `div` `span` `a` `ul` `li`...
- 只有可视化标签，才能用`css`改变它
- 单标签：`meta`  `link`  `base`  `img`  `input` `br` `hr`
- 双标签：`html` `head` `body`  `div`  `a`  `p`  `span` ..`ul` `li` `ol` ` dl` ....

- **常用可视化标签**

	- ** `div`** 
		- 一般用它来布局
	- **a**  超链接标签
		- `href`*属性：设置跳转的网页地址
		- `target`属性：设置跳转的目标
		- 结论：凡事页面可以点击跳转或者表单提交的文字，都用`a`标签
	- **`img`**
		- `src`*属性用来设置图片的url数据
		- `alt`提供给搜索引擎搜索的
		- `width`
		- `height`
		- 结论 ：显示图片
	- **ul li**
		- 列表
		- 结论：只要将来设计页面中有固定样式的列表，就用ul和li
	- **`table` `caption` `tr` `td (th)`**
		- 慢慢已经被淘汰了 被ul li代替
		- 如果是合并竖排的就是合并行（`rowspan`）
		- 如果是合并横排的就是合并列（`colspan`）

---
**HTML部分导图总结**

---
- [HTML5标签集合](http://www.html5star.com/manual/html5label-meaning/)

![](http://upload-images.jianshu.io/upload_images/1480597-1950ccf50810a92b.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![](http://upload-images.jianshu.io/upload_images/1480597-3d15eb9c7be0cb65.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![](http://upload-images.jianshu.io/upload_images/1480597-4b0073fd050ba4f3.jpeg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

---

### 第二部分 CSS

---

#### 第八章 css基础知识
---
- `css`基础知识：
  - `css`样式表的定义
  - `css`：（Cascading Style Sheets）层叠样式表；
- 分类及位置：内部样式`-head`区域`style`标签里面
     - 外部样式-`link`调用
     - 内联样式-标签元素里面
- `css`内的注释：/`*`注释内容`*`/
- `css`样式表的语法
   - `CSS`规则由两个主要的部分构成：要添加样式的盒子名或者标签名、和要添加的样式。

   - 盒子名或者标签名{属性:值;}

   - **CSS中几种颜色的表示方法**
      - **用颜色名表示**
        - 有17个预先确定的颜色，它们是
           - `aqua`, `black`, `blue`, `fuchsia`, `gray`, `green`, `lime`, `maroon`, `navy`, 
　　`olive`, `orange,` `purple`, `red`, `silver`, `teal`, `white`, and `yellow`

    - **用十六进制的颜色值表示(红、绿、蓝)**
      - `#FF0000`或者`#F00 ` 

    - **用rgb(r,g,b)函数表示**
      - 如：`rgb(255,255,0)`

    - **用hsl(Hue,Saturation,Lightness)函数表示（色调、饱和度、亮度)**

      - 如：`hsl(120,100%,100%)`,色调0代表红色，`120`代表绿色，`240`代表 
蓝色 

     - **用`rgba(r,g,b,a)`函数表示 **
       - 其中`a`表示的是改颜色的透明度，取值范围是`0~1`，其中`0`代表完全透明

    - **用hsla(Hue,Saturation,Lightness,alpha)函数表示**
      - 色调、饱和度、亮度、透明度 
  - 例子

```html
   <div style="position:absolute;top:0px">
		<div style="background-color:gray;">background-color:gray</div>
		<div style="background-color:#F00;">background-color:#F00</div>
		<div style="background-color:#ffff00;">background-color:#ffff00</div>
		<div style="background-color:rgb(255,0,255);">background-color:rgb(255,0,255)</div>
		<div style="background-color:hsl(120,80%,50%);">background-color:hsl(120,80%,50%)</div>
		<div style="background-color:rgba(255,0,255,0.5);">background-color:rgba(255,0,255,0.5)</div>
		<div style="background-color:hsla(120,80%,50%,0.5);">background-color:hsla(120,80%,50%,0.5)</div>
	</div>
```

![](http://upload-images.jianshu.io/upload_images/1480597-39e61a813f637282.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


- 内部样式表
    - 当单个页面需要设置样式时，就应该使用内部样式表。
    - 使用 `<style></style>`标签在文档`<head></head>`里面定义内部样式表

```
<head>
 <style type="text/css" >
  p{color:red;}
 </style>
</head>
```

- 从外部引入到样式分为两种：（注意写在`head`标签里面）  
- 当样式需要应用于很多页面时，就需要用到外部样式表，首先需要创建一个`css`文件，然后引用到我们的页面中。

- `Link`样式表式：  `<link rel=”stylesheet” type=”text/css” href=”my.css”(href表示路径)>  `

- `Html`式：  `<style type="text/css">@import url("css.css");></style> ` 


- 内联样式表（优先级高）

    - 写在标签里面的样式

    - 如：`<p style="color:red;"></p>`

- 表示给`p`标签里面的文字颜色设置为红色

- 区别：外链样式与导入样式

    - `link`标签是属于`xhtml`范畴，而`@import`则是`css2.1`中特有的。`link`标签除了可以加载`CSS`外，还可以做很多其它的事情，比如定义`RSS`，定义`rel`连接属性等，`@import`就只能加载`CSS`了。 
    
    - 加载的顺序的区别，`link`加载的`css`时，是一种并行(没有尝试是否是这样)加载`CSS`方式，而`@impor`则在整个页面加载完成后才加载。
    
    - 兼容性的区别，因`@import``CSS2.1`才特有的，所以对于不兼容`CSS2.1`的浏览器来说，无效。
    
    - 在样式控制上(比如动态改变网页的布局时,使用`javascript`操作`DOM`)的区别，此时`@import`就无能为力了。

---

- **样式的优先级补充**
  - 相同权值情况下，`CSS`样式的优先级总结来说，就是——就近原则（离被设置元素越近优先级别越高）：
    - `内联样式表（标签内部）` > `嵌入样式表（当前文件中）`> `外部样式表（外部文件中）`
- 权值不同时，浏览器是根据权值来判断使用哪种`css`样式的，哪种样式权值高就使用哪种样式

- 层叠优先级是:
 -  `浏览器缺省`< `外部样式表` < `内部样式表` < `内联样式`
- 其中样式表又有:`类选择器` < `类派生选择器 `<` ID选择器` < `ID派生选择器`
- 派生选择器以前叫上下文选择器，所以完整的层叠优先级是:
 - `浏览器缺省` <` 外部样式表` < `外部样式表类选择器` < `外部样式表类派生选择器 `< `外部样式表ID选择器` < `外部样式表ID派生选择器 `< `内部样式表` < `内部样式表类选择器` < `内部样式表类派生选择器` < `内部样式表ID选择器` < `内部样式表ID派生选择器` < `内联样式`...共`12`个优先级

- 另外，如果同一个元素在没有其他样式的作用影响下，其`Class`定义了多个并以空格分开，其优先级顺序为：
  - 一个元素同时应用多个`class`，后定义的优先（即近者优先），加上`!important`者最优先！

---

####  第九章 css选择器(上)

- `css`选择器：
   - `class`类选择器可以重复利用    
   - `id`选择器唯一
- 标签选择器
    - 什么是选择器：css选择器就是要改变样式的对象
- 选择器`{属性:值;属性:值;}`

- 标签选择器：页面中所有的标签都是一个选择器  `p{color:red;}`

- `ID`选择器
    - 选择`id`命名的元素 以 `#` 开头   `#p1{color:#0f0;}`

- 类选择器
    - `class`选择器，选择`clas`命名的元素 以`.`开头  `.first{color:#00f;}`
- `css`代码写完后上线前要经过压缩处理 
- 本地和服务器分两个`css`版本（备份）
- 压缩后注释都清除，空间体积减少

- 群组选择器
    - 选择多个元素,以逗号隔开 `#main,.first,span,a,h1{color:red;}`
- 包含选择器
    - 选择某元素的后代元素，也称后代选择器，父类与子类间以空格隔开`p`   
        - `span{color:red;}`
- 属性选择器

    - 选择包含某一属性的元素
    - `a[title]{color:red;}`  选择包含`title`的`a`标签
    - `a[title][href]{color:red;}` 选择包含`title`和`href`的`a`标签

- `> ` `+` 选择器子类选择器：只选择子元素（只选择儿子）（相当于包含元素）
    - `p > span{color:red;}`
- 相邻兄弟选择器：只选择后面的相邻兄弟元素
    - `p + span{color:red;}`

---
 
####  第十章 css选择器(下)
---
-  `<a>`伪类选择器
   - `a:link {color:#FF0000;}`	/* 未访问的链接 */ （只用于a标签）
   - `a:visited {color:#00FF00;}`	/* 已访问的链接 */ （只用于a标签）
   - `a:hover {color:#FF00FF;}	`/* 鼠标移动到链接上
   - `*/`（可和其他标签结合一起用）
   - `a:active {color:#0000FF;}`	/* 选定的链接 */
   - **注意**
     - 伪类选择器的排序很重要，`a:link` `a:visited` ` a:hover ` `a:active`，记作`lvha`
- 输入伪类选择器（针对表单）
     - `input:focus{color:red;} `      /* 键盘输入焦点 */

- 其他伪类选择器

  - `p:first-child{color:red;}`     /`* 第一个p *`/
  - `:before` 在元素之前添加内容。
  - `:after` 在元素之后添加内容。

- `css`优先规则
    - 内联样式表-> `ID` 选择器—> `Class` 类选择器->标签选择器

---

####  第十一章 背景属性
---
- 背景属性：
  - 背景的添加 ：

  - 背景颜色的添加:
    - `background:red;`
    - `backgronnd-color:red;`

  - 背景图片的添加：
    - `background:url(“images/1.jpg”);`
    - `backgronnd-image:url(“images/1.jpg”);`
  - 背景的平铺
  - 什么是平铺？平铺就是图片是否重复出现
    - 不平铺：`background-repeat:no-repeat;`
    - 水平方向平铺：`background-repeat:repeat-x;`
    - 垂直方向平铺：`background-repeat:repeat-y;`
    - 完全平铺：默认为完全平铺
  - 背景图片的定位
    - 背景图片的定位就是可以设置显示背景图片的位置，通过属性`background-position`来实现
    - `background-position`的取值可为英文单词或者数值和百分值。
    - `background-positon`的英文单词取值
    - `top left `                   
    - `top  center  `                   
    - `top  right`
    - `center left  `            
    - `center  center `                   
    - `center right`
    - `bottom left  `           
    - `bottom  center `    
    - `ottom right`
  - `background-positon`的数值取值     
    - `background-position:x  y;`  
  - `positon`的百分值取值     
    - `background-position:x%  y%; ` 
  - 背景图片的大小
    - 背景图片的大小可以通过属性`background-size`来设置`background-size`的取值可为数值和百分值。

  - `background-size`的数值取值     
    - `background-size:x  y;`  
  - `background-size`的数值取值     
    - `background-size:x%  y%;`

  - 背景图片的滚动
    - 背景图片是否随着内容的滚动而滚动由`background-attachment`设置

    - `background-attachment:fixed; `  固定，不随内容的滚动而滚动	
    - `background-attachment:scroll; ` 滚动，随内容的滚动而滚动

---

#### 第十二章 文字文本属性
---

- `css`文字文本属性：

  - **文字属性**

    - `color:red;`	文字颜色
    - `font-size:12px`;	文字大小
    - `font-weight:“bold”`	文字粗细(`bold/normal`)
    - `font-family:“宋体”`	文字字体
    - `font-variant:small-caps `小写字母以大写字母显示


  - **文本属性**

    - `text-align:center;`   文本对齐(`right`/`left`/`center`)
    - `line-height:10px; ` 行间距(可通过它实现文本的垂直居中)
    - `text-indent:20px;`  首行缩进
    - `text-decoration:none; ` 
       - 文本线(`none`/`underline`/`overline`/`line-through`)
    - `letter-spacing`:   字间距
---

####  第十三章 盒子模型
---
- **盒子模型**
    - 盒子模型就是一个有高度和宽度的矩形区域
    - 所有`html`标签都是盒子模型
    - `div`标签自定义盒子模型
- 所有的标签都是盒子模型
  - `class`和`id`的主要差别是：`class`用于元素组（类似的元素，或者可以理解为某一类元素），而`id`用于标识单独的唯一的元素。

- **盒子模型的组成**
    - 盒子模型组成部分：
        - 自身内容：` width`、h`eight` 宽高
        - 内边距：   `padding`
        - 盒子边框： `border` 边框线
        - 与其他盒子距离：  `margin `外边距
        - 内容+内边距+边框+外边距=面积
- `border` 边框
    - 常见写法  `border:1px solid #f00;`

- 单独属性：
 - `border-width`:
 - `border-style:` 
     - `dotted ` 点状虚线
     - `dashed`（虚线）
     - `solid`（实线）
     - `double`（双实线）
 - `border-color` (颜色)
- `padding` 内边距
    - 值：`像素`/`厘米`等长度单位、百分比

        - ` padding:10px;  `	                  上下左右
        - `padding:10px 10px; `                 上下  左右
        - `padding:10px 10px 10px; `         上 左右 下
        - `padding:10px 10px 10px 10px; ` 上 右 下 左（设置4个点-->顺时针方向）

- 单独属性：
     - `padding-top:`
     - `padding-right:`
     - `padding-bottom:`
     - ` padding-left:`

- 当设置内边距的时候会把盒子撑大，为了保持盒子原来的大小，应该高度和宽度进行减小，根据`width`和`height`减小

- margin 外边距

    - 值：与`padding`相同

    - 单独属性：与`padding`相同

- 外边距合并：两个盒子同时设置了外边距，会进行一个外边距合并

---
**补充盒子模型内容**

---

- **标准盒子模型**

 - 盒子模型是`css`中一个重要的概念，理解了盒子模型才能更好的排版。其实盒子模型有两种，分别是 `ie `盒子模型和标准 `w3c` 盒子模型。他们对盒子模型的解释各不相同，先来看看我们熟知的标准盒子模型

![](http://upload-images.jianshu.io/upload_images/1480597-320bad065d62c499.JPG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 从上图可以看到标准 `w3c` 盒子模型的范围包括 `margin`、`border`、`padding`、`content`，并且 `content `部分不包含其他部分

- ** IE盒子模型**

![](http://upload-images.jianshu.io/upload_images/1480597-693242e2f03506f8.JPG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 从上图可以看到 `ie `盒子模型的范围也包括 `margin`、`border`、`padding`、`content`
- 和标准 `w3c` 盒子模型不同的是：`ie` 盒子模型的 `content` 部分包含了 `border `和 `padding`

- `IE`盒子模型`width` = `padding`+`border`+`内容`
- 标准盒子模型 = 内容的宽度（不包含`border`+`padding`）

- 例：
 - 一个盒子的   ` margin `为 20px，`border` 为 1px，`padding `为 10px，`content` 的宽为 200px、高为 50px，假如用标准 `w3c` 盒子模型解释，那么这个盒子需要占据的位置为：宽 `20*2+1*2+10*2+200=262px`、高 `20*2+1*2*10*2+50=112px`，盒子的实际大小为：宽 `1*2+10*2+200=222px`、高 `1*2+10*2+50=72px`；假如用ie 盒子模型，那么这个盒子需要占据的位置为：宽 `20*2+200=240px`、高 `20*2+50=70px`，盒子的实际大小为：宽 `200px`、高 `50px`

- 那应该选择哪中盒子模型呢？当然是“标准 `w3c` 盒子模型”了。怎么样才算是选择了“标准 `w3c `盒子模型”呢？很简单，就是在网页的顶部加上 `doctype` 声明。
- 假如不加` doctype` 声明，那么各个浏览器会根据自己的行为去理解网页，即 `ie `浏览器会采用 `ie` 盒子模型去解释你的盒子，而 `ff `会采用标准` w3c` 盒子模型解释你的盒子，所以网页在不同的浏览器中就显示的不一样了。
- 反之，假如加上了 `doctype` 声明，那么所有浏览器都会采用标准 `w3c `盒子模型去解释你的盒子，网页就能在各个浏览器中显示一致了。

---

- 用 `jquery` 做的例子来证实一下

```
<html>
<head>
<title>你用的盒子模型是？</title>
<script language="javascript" src="jquery.min.js"></script>
<script language="javascript">
var sbox = $.boxmodel ? "标准w3c":"ie";
document.write("您的页面目前支持："+sbox+"盒子模型");
</script>
</head>
<body>
</body>
</html>
```

- 　上面的代码没有加上 `doctype` 声明，在 `ie` 浏览器中显示  `ie`盒子模型，在 ff 浏览器中显示“标准`w3c` 盒子模型”。

```
<!doctype html public "-//w3c//dtd xhtml 1.0 transitional//en" "http://www.w3.org/tr/xhtml1/dtd/xhtml1-transitional.dtd">
<html>
<head>
<title>你用的盒子模型是标准w3c盒子模型</title>
<script language="javascript" src="jquery.min.js"></script>
<script language="javascript">
var sbox = $.boxmodel ? "标准w3c":"ie";
document.write("您的页面目前支持："+sbox+"盒子模型");
</script>
</head>
<body>
</body>
</html>
```

- 　代码2 与代码1 唯一的不同的就是顶部加了 `doctype `声明。在所有浏览器中都显示“标准 `w3c `盒子模型”


-  所以为了让网页能兼容各个浏览器，让我们用标准 `w3c` 盒子模型

- 扩展
  - [学会使用box-sizing布局](http://www.jianshu.com/p/e2eb0d8c9de6)

---

####  第十四章 块元素、行元素与溢出
---

- 基本概念
    - 块级元素：默认情况下独占一行的元素，可控制宽高、上下边距；
    - 行内元素：默认情况下一行可以摆放多个的元素，不可控制宽高和上下边距
- 行块转换
    - `display:none`;  不显示
    - `display:block`; 变成块级元素
    - `display:inline`; 变成行级元素
    - `display:inline-block`; 以块级元素样式展示，以行级元素样式排列

- 溢出
    - `overflow:hidden`;   溢出隐藏
    - `overflow:scroll`;   内容会被修剪，浏览器会显示滚动条
    - `overflow:auto`;   如果内容被修剪，则产生滚动条

- 文本不换行：`white-space:nowrap`;
- 长单词换行：`word-wrap:break-word`;


- 行内元素和快级元素小结

 - 一、**块级元素**：block element

   - 每个块级元素默认占一行高度，一行内添加一个块级元素后无法一般无法添加其他元素（`float`浮动后除外）。两个块级元素连续编辑时，会在页面自动换行显示。块级元素一般可嵌套块级元素或行内元素；
   - 块级元素一般作为容器出现，用来组织结构，但并不全是如此。有些块级元素，如只能包含块级元素。

   - `DIV` 是最常用的块级元素，元素样式的`display:block`都是块级元素。它们总是以一个块的形式表现出来，并且跟同级的兄弟块依次竖直排列，左右撑满。

 - 二、**行内元素**：inline element

   - 也叫内联元素、内嵌元素等；行内元素一般都是基于语义级(semantic)的基本元素，只能容纳文本或其他内联元素，常见内联元素 “a”。比如 `SPAN `元素，`IFRAME`元素和元素样式的`display : inline`的都是行内元素。例如文字这类元素，各个字母 之间横向排列，到最右端自动折行。

 - 三、**block（块）元素的特点:**

   - ①、总是在新行上开始；
   - ②、高度，行高以及外边距和内边距都可控制；
   - ③、宽度缺省是它的容器的100%，除非设定一个宽度。
   - ④、它可以容纳内联元素和其他块元素

 - 四、**inline元素的特点**

   - ①、和其他元素都在一行上；
   - ②、高，行高及外边距和内边距不可改变；
   - ③、宽度就是它的文字或图片的宽度，不可改变
   - ④、内联元素只能容纳文本或者其他内联元素

 - **对行内元素，需要注意如下**:
   - 设置宽度`width` 无效。 设置高度`height `无效，可以通过`line-height`来设置。 设置`margin`
   - 只有左右`margin`有效，上下无效。
   - 设置`padding`只有左右`padding`有效，上下则无效。注意元素范围是增大了，但是对元素周围的内容是没影响的。

 - 五、**常见的块状元素**
   - `address` – 地址
   - `blockquote` – 块引用
   - `center` – 举中对齐块
   - `dir` – 目录列表
   - `div` – 常用块级容易，也是`CSS layout`的主要标签
   - `dl` – 定义列表
   - `fieldset` – `form`控制组
   - `form` – 交互表单
   - `h1` – 大标题
   - `h2` – 副标题
   - `h3` – 3级标题
   - `h4` – 4级标题
   - `h5` – 5级标题
   - `h6` – 6级标题
   - `hr` – 水平分隔线
   - `isindex` – `input prompt`
   - `menu` – 菜单列表
   - `noframes` – `frames`可选内容，（对于不支持frame的浏览器显示此区块内容
   - `noscript` – 可选脚本内容（对于不支持`script`的浏览器显示此内容）
   - `ol` – 有序表单
   - `p` – 段落
   - `pre` – 格式化文本
   - `table` – 表格
   - `ul` – 无序列表

 - 六、**常见的内联元素**

   - `a` – 锚点
   - `abbr` – 缩写
   - `acronym` – 首字
   - `b` – 粗体(不推荐)
   - `bdo` – `bidi override`
   - `big` – 大字体
   - `br` – 换行
   - `cite` – 引用
   - `code` – 计算机代码(在引用源码的时候需要)
   - `dfn` – 定义字段
   - `em` – 强调
   - `font` – 字体设定(不推荐)
   - `i` – 斜体
   - `img` – 图片
   - `input` – 输入框
   - `kbd` – 定义键盘文本
   - `label` – 表格标签
   - `q` – 短引用
   - `s` – 中划线(不推荐)
   - `samp` – 定义范例计算机代码
   - `select` – 项目选择
   - `small` – 小字体文本
   - `span` – 常用内联容器，定义文本内区块
   - `strike` – 中划线
   - `strong` – 粗体强调
   - `sub` – 下标
   - `sup` – 上标
   - `textarea` – 多行文本输入框
   - `tt` – 电传文本
   - `u` – 下划线

 - 七，**可变元素**

   - 可变元素为根据上下文语境决定该元素为块元素或者内联元素。
   - `applet` - `java applet`
   - `button` - 按钮
   - `del `- 删除文本
   - `iframe` - `inline frame`
   - `ins` - 插入的文本
   - `map` - 图片区块(`map`)
   - `object` - `object`对象
   - `script` - 客户端脚本
 
 - 八、**行内元素与块级元素有什么不同**
   - 区别一：
     - 块级：块级元素会独占一行，默认情况下宽度自动填满其父元素宽度
     - 行内：行内元素不会独占一行，相邻的行内元素会排在同一行。其宽度随内容的变化而变化。

   - 区别二：
     - 块级：块级元素可以设置宽高
     - 行内：行内元素不可以设置宽高

   - 区别三：
     - 块级：块级元素可以设置`margin`，`padding`
     - 行内：行内元素水平方向的`margin-left;` `margin-right;`

    - `padding-left;` `padding-right`;可以生效。但是竖直方向的`margin-bottom`; `margin-top`; `padding-top`; `padding-bottom`;却不能生效。
 
    - 区别四：

     - 块级：`display:block`;
     - 行内：`display:inline`;

  - 替换元素有如下：（和`img`一样的设置方法）
   - `<img>`、`<input>`、`<textarea>`、`<select>`
   - `<object>`都是替换元素，这些元素都没有实际的内容
- 可以通过修改`display`属性来切换块级元素和行内元素

---

#### 第十五章 定位
---

- `static`静态定位（不对它的位置进行改变，在哪里就在那里）
  -  默认值。没有定位，元素出现在正常的流中（忽略 `top`,` bottom,`  `left, right` 或者 `z-index` 声明）。

- `fixed`固定定位（参照物--浏览器窗口）---做 弹窗广告用到
  - 生成固定定位的元素，相对于浏览器窗口进行定位。 元素的位置通过 `"left"`, `"top"`, `"right" `以及 `"bottom" `属性进行规定。 

- `relative`（相对定位 ）（参照物以他本身）
  - 生成相对定位的元素，相对于其正常位置进行定位。

- `absolute`（绝对定位）(除了`static`都可以，找到参照物-->与它最近的已经有定位的父元素进行定位)
 - 生成绝对定位的元素，相对于 `static` 定位以外的第一个父元素进行定位。
 - 元素的位置通过 "`left"`, `"top"`, `"right"` 以及 `"bottom"` 属性进行规定

- z-index
    - `z-index` 属性设置元素的堆叠顺序。拥有更高堆叠顺序的元素总是会处于堆叠顺序较低的元素的前面。
    - 定位的基本思想: 它允许你定义元素框相对于其正常位置应该出现的位置，或者相对于父元素、另一个元素甚至浏览器窗口本身的位置。

- 一切皆为框
    - 块级元素: `div`、`h1`或`p`元素 即：显示为一块内容称之为 “块框“ ;
    - 行内元素: `span`,`strong`,`a`等元素 即：内容显示在行中称 "行内框";
    - 使用display属性改变成框的类型 即：`display:block`; 让行内元素设置为块级元素，`display:none;` 没有框

- 相对定位：
    - 如果对一个元素进行相对定位，它将出现在它所在的位置上。 
    - 通过设置垂直或水平位置，让这个元素“相对于”它的起点进行移动
    - `.adv_relative {  position: relative;  left: 30px;  top: 20px; }`

- 绝对定位：
    - 元素的位置相对于最近的已定位祖先元素，如果元素没有已定位 的祖先元素，它的位置相对于最初的包含块。 `.adv_absolute {  position: absolute;  left: 30px;  top: 20px; }`

---

![](http://upload-images.jianshu.io/upload_images/1480597-f72c1c8486445df1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
![](http://upload-images.jianshu.io/upload_images/1480597-7ab9cda0bbd7e62f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

---

#### 第十六章 框架
---

- `frameset`框架：
    - `<frameset> ` ----  用来定义一个框架；双标签
    不能和  `<body>`  一起使用
- `rows`、`cols`属性
    - `rows ` 定义行表示框架有多少行（取值 `px `/` % `/ `*` ）
    - `cols`   定义列表示框架有多少列（取值` px `/ `% `/ `*` ）

- frame子框架
  - <`frame`>  ----  表示框架中的某一个部分；单标签，要跟结束标志
    - `src` 显示的网页的路径
    - `name` 框架名
    - `frameborder`  边框线（取值 0 / 1）

 - <`noframes`>属性

 - <`noframes`> 提供不支持框架的浏览器显示`body`的内容；双标签

```
<frameset>
     <frame  src=“”  />
     <frame  src=“” />
     <frame  src=“” />
     <noframes>
      <body>内容</body>
     </noframes>
</frameset>
```

- `<iframe>`内联框架
    - `iframe `元素会创建包含另外一个文档的内联框架（即行内框架）
    - 允许和 `body` 一起使用
    - `width` 宽（取值 px / %）
    - `height` 高（取值 px / %）
    - `name` 框架名
    - `frameborder ` 边框线（取值 0 / 1）
    - `src` 显示的网页的路径

---

#### 第十七章 css高级属性
---
- `opacity`透明属性
 - `opacity`
   - 对于`IE6/7/`，使用`filter:alpha(opacity:值;`)  值为`0-100`
   - 对于`Webkit`，`Opera`，`Firefox`，`IE9+`，使用`opacity`:值; 值为`0-1`
   - 对于早期火狐，使用`-moz-opacity`:值; 值为`0-1`
   - 所以写透明属性时，一般写法是

```
 {	
    opacity:0.5;
   filter:alpha(opacity：50);/*0-100*/
   -moz-opacity:0.5;	/*取值0-1*/-->针对早起版本的火狐兼容问题的解决
}
```

- `border-radius`圆角边框属性

    - 向 `div` 元素添加圆角边框
        - `border-radius:10px`;

- `box-shadow`阴影属性

    - `box-shadow `属性向框添加阴影效果,后面跟4个参数。
    
    - `box-shadow:0px   0px   10px   #000;`

- `<embed>`属性

    - 是`HTML5`中新增的标签,媒体嵌入插件标签，可以通过`<embed>`插入音频或视频
    
    - `<embed src=“media/music.mp3” />`
    
    - 格式`.mid ` `.wav` `.mp3`等

---

- **CSS部分导图总结**

---
![](http://upload-images.jianshu.io/upload_images/1480597-4b55b5085a7d0c56.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

---
- [原文件下载地址](https://yunpan.cn/cM9va2bHD4wwu)   访问密码 342a

---

![](http://upload-images.jianshu.io/upload_images/1480597-a893d4023c39c78a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

---
- `css`常见简写

![css简写速查](http://upload-images.jianshu.io/upload_images/1480597-cbce5ef927ab2589.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


---


### 第三部分 附录

---

#### 附录一 DIV命名规范

---

- 企业`DIV`使用频率高的命名方法

- **网页内容类**
  - 标题: `title`
    - 摘要: `summary`
    - 箭头： `arrow`
    - 商标： `label`
    - 网站标志： `logo`
    - 转角/圆角：` corner`
    - 横幅广告： `banner`
    - 子菜单： `subMenu`
    - 搜索： `search`
    - 搜索框： `searchBox`
    - 登录： `login`
    - 登录条：`loginbar`
    - 工具条： `toolbar`
    - 下拉： `drop`
    - 标签页： `tab`
    - 当前的： `current`
    - 列表： `list`
    - 滚动： `scroll`
    - 服务： `service`
    - 提示信息： `msg`
    - 热点：`hot`
    - 新闻： `news`
    - 小技巧： `tips`
    - 下载： `download`
    - 栏目标题： `title`
    - 热点： `hot`
    - 加入：` joinus`
    - 注册： `regsiter`
    - 指南： `guide`
    - 友情链接： `friendlink`
    - 状态： `status`
    - 版权： `copyright`
    - 按钮： `btn`
    - 合作伙伴： `partner`
    - 投票： `vote`
    - 左右中：`left`  `right`  `center`
    
    --- 
  - 注释的写法: `/* Footer */ ` 内容区`/* End Footer */`
    
-  **id的命名:**
    
    - 页面结构
    
        - 容器: `container`
        - 页头：`header`
        - 内容：`content`/`container`
        - 页面主体：`main`
        - 页尾：`footer`
        - 导航：`nav`
        - 侧栏：`sidebar`
        - 栏目：`column`
        - 页面外围控制整体布局宽度：`wrapper`
        - 左右中：`left` `right` `center`
        
    ---
    - 导航
    
        - 导航：`nav`
        - 主导航：`mainbav`
        - 子导航：`subnav`
        - 顶导航：`topnav`
        - 边导航：`sidebar`
        - 左导航：`leftsidebar`
        - 右导航：`rightsidebar`
        - 菜单：`menu`
        - 子菜单：`submenu`
        - 标题: `title`
        - 摘要: `summary`
    
    ---
    - 功能
    
        - 标志：`logo`
        - 广告：`banner`
        - 登陆：`login`
        - 登录条：`loginbar`
        - 注册：`regsiter`
        - 搜索：`search`
        - 功能区：`shop`
        - 标题：`title`
        - 加入：`joinus`
        - 状态：`status`
        - 按钮：`btn`
        - 滚动：`scroll`
        - 标签页：`tab`
        - 文章列表：`list`
        - 提示信息：`msg`
        - 当前的:` current`
        - 小技巧：`tips`
        - 图标: `icon`
        - 注释：`note`
        - 指南：`guild`
        - 服务：`service`
        - 热点：`hot`
        - 新闻：`news`
        - 下载：`download`
        - 投票：`vote`
        - 合作伙伴：`partner`
        - 友情链接：`link`
        - 版权：`copyright`
        
    ---
    
   - **`class`的命名:**
    
    - 颜色:使用颜色的名称或者16进制代码,如
    
        - `.red { color: red; }`
        - `.f60 { color: #f60; }`
        - `.ff8600 { color: #ff8600; }`
    
    - 字体大小,直接使用"font+字体大小"作为名称,如
    
        - `.font12px { font-size: 12px; }`
        - `.font9px {font-size: 9pt; }`
    
    - 对齐样式,使用对齐目标的英文名称,如
    
        - `.left { float:left; }`
        - `.bottom { float:bottom; }`
    
    - 标题栏样式,使用"类别+功能"的方式命名,如
    
        - ` .barnews { }`
        - `.barproduct { }`
    
    ---
    - **注意事项::**
    
        - 一律小写;
        - 尽量用英文;
        - 不加中杠和下划线;
        - 尽量不缩写，除非一看就明白的单词.
    
    ---
- **推荐的 `CSS` 书写顺序：**
    
    - 显示属性
    
        - `display`
        - `list-style`
        - `position`
        - `float`
        - `clear`
    
    - 自身属性
    
        - ` width`
        - `height`
        - `margin`
        - `padding`
        - `border`
        - `background`
    
    - 文本属性
    
        - `color`
        - ` font`
        - `text-decoration`
        - `text-align`
        - `vertical-align`
        - `white-space`
        - `other text`
        - `content `    

---

#### 附录二 CSS精灵

---

- **CSS精灵原理以及应用**
  - `CSS`雪碧的基本原理是把你的网站上用到的一些图片整合到一张单独的图片中，从而减少你的网站的HTTP请求数量。
    - 该图片使用`CSS`   `background和background-position`属性渲染，这也就意味着你的标签变得更加复杂了，图片是在`CSS`中定义，而非`<img>`标签。
- **一个简单的例子**：
    - 一张图片作出一个按钮的三个状态
    - 一个链接用`CSS`做成按钮的样式，我们可以使用同一张图片，完成按钮的三个状态，`a:link`，`a:hover`，`a:active` `<a class="button" href="#">链接</a>`
    - 加入右侧的图片为：`200px 65px`的三个按钮图拼合而成的图片`button.png`，从上到下一次为按钮的普通、鼠标滑过、鼠标点击的状态。则可以使用`CSS`进行定义。
    
```
    a {
        display:block; 
        width:200px; 
        height:65px; 
        line-height:65px; /*定义状态*/
        text-indent:-2015px; /*隐藏文字*/
        background-image:url(button.png); /*定义背景图片*/
        background-position:0 0;
        /*定义链接的普通状态，此时图像显示的是顶上的部分*/
    }
    
    a:hover {
        background-position:0 -66px;
        /*定义链接的滑过状态，此时显示的为中间部分，向下取负值*/
    }
    a:active {
        background-position:0 -132px;                      
        /*定 义链接的普通状态，此时显示的是底部的部分，向下取负值*/
    }
```
    
- 更多的`CSS`雪碧，图片更复杂，背景定位更精确。可能会用到大量的数值
    - 如：`background:url(nav.png) -180px 24pxno-repeat`; 来达到更精确的定位
- **优点：**
    - 减少加载网页图片时对服务器的请求次数
    - 可以合并多数背景图片和小图标，方便在任何位置使用，这样不同位置的请求只需要调用一个图片，从而减少对服务器的请求次数，降低服务器压力，同时提高了页面的加载速度，节约服务器的流量。
    - 提高页面的加载速度
    - `sprite `技术的其中一个好处是图片的加载时间(在有许多 `sprite` 时，单张图片的加载时间)。由所需图片拼成的一张 `GIF`图片的尺寸会明显小于所有图片拼合前的大小。单张的 `GIF`只有相关的一个色表，而单独分割的每一张 `GIF` 都有自己的一个色表，这就增加了总体的大小。因此，单独的一张 `JPEG` 或者 `PNG` `sprite` 在大小上非常可能比把一张图分成多张得来的图片总尺寸小。
    - 减少鼠标滑过的一些`bug`
    - `IE6`不会主动预加载鼠标滑过即`a:hover`中的背景图片，所以，如果使用多张图片，鼠标滑过会出现闪白的现象。使用`CSS`雪碧，由于一张图片即可，所以不会出现这种现象。
- **不足：**
    - `CSS`雪碧的最大问题是内存使用
    - 影响浏览器的缩放功能
    - 拼图维护比较麻烦
    - 使`CSS`的编写变得困难
    - `CSS` 雪碧调用的图片不能被打印
    - 错误得使用 `Sprites` 影响可访问性

#### 附录三 一些tips解决方案
---

##### 页面优化实践
---

- 从下面的几个方面可以进行页面的优化：

  - 减少请求数
  - 图片合并
  - `CSS `文件合并
  - 减少内联样式
  - 避免在 `CSS `中使用 `import`
  - 减少文件大小
  - 选择适合的图片格式
  - 图片压缩
  - `CSS` 值缩写（`Shorthand Property`)
  - 文件压缩
  - 页面性能
  - 调整文件加载顺序
  - 减少标签数量
  - 调整选择器长度
  - 尽量使用` CSS` 制作显示表现
  - 增强代码可读性与可维护性
  - 规范化
  - 语义化
  - 模块化

##### 写DIV+CSS 的一些常识
---

- 不要使用过小的图片做背景平铺
  - 这就是为何很多人都不用 `1px` 的原因，这才知晓。宽高 `1px` 的图片平铺出一个宽高 `200px` 的区域，需要 `200200=40, 000` 次，占用资源

- 无边框
  - 推荐的写法是 `border:none`;，哈哈，我一直在用这个。 `border:0;` 只是定义边框宽度为零，但边框样式、颜色还是会被浏览器解析，占用资源

- 慎用 通配符
   - 所谓通配符，就是将` CSS` 中的所有标签均初始化，不管用的不用的，过时的先进的，一视同仁，这样，大大的占用资源。要有选择的初始化标签。

- `CSS `的十六进制颜色代码缩写
   - 习惯了缩写及小写，这才知道，原来不是推荐的写法，为的是减少解析所占用的资源。但同时会增加文件体积。孰优孰劣，有待仔细考证。

-  样式放头上，脚本放脚下。不内嵌，只外链

-  坚决不用 `CSS `表达式

- 使用 引用样式表，而不是通过` @import` 导入。

-  一般来说，`PNG `比 `GIF` 要小，小得多。再者，`GIF` 中有多少颜色是被浪费的，很值得优化。

- 千万不要在 `HTML `中缩放图片，一者不好看，二者占资源。

- 正文字体最好用偶数
   - `12px`、`14px`、`16px`，效果非常好。特例，`15px`。

- `block`、`ul`、`ol `等上下留出至少一倍行距，左侧至少两倍行距，右侧随意。

- 段落之间，至少要有一倍行距

- 强行指定某些元素的 `line-height`，正文 `1.6 `倍于文字大小，标题`1.3 `倍。

- 中文标点用全角
   - 英文夹杂在中文中，左右空格，半角。

- 中文字体的粗体和斜体，远离较好

##### 常用代码片段
---
- 雅虎工程师提供的`CSS`初始化示例代码【仅供参考】
   - 可以在`html`头文件中直接引用，从而避免浏览器的不兼容带来的错误。

```css
body,
div,
dl,
dt,
dd,
ul,
ol,
li,
h1,
h2,
h3,
h4,
h5,
h6,
pre,
code,
form,
fieldset,
legend,
input,
button,
textarea,
p,
blockquote,
th,
td { 
    margin:0; padding:0; 
}
body {
    background:#fff; 
    color:#555; 
    font-size:14px; 
    font-family: Verdana, Arial, Helvetica, sans-serif; 
}
td,
th,
caption { 
    font-size:14px;
}
h1, 
h2, 
h3, 
h4, 
h5, 
h6 { 
    font-weight:normal; 
    font-size:100%; 
}

address, 
caption,
cite, 
code, 
dfn, 
em, 
strong,
th, 
var { 
    font-style:normal; 
    font-weight:normal;
}
a { 
    color:#555; 
    text-decoration:none; 
}
a:hover { 
    text-decoration:underline; 
}
img {
    border:none;
}
ol,ul,li { 
    list-style:none; 
}
input, 
textarea, 
select, 
button { 
    font:14px Verdana,Helvetica,Arial,sans-serif; 
}
table { 
    border-collapse:collapse; 
}
html {
    overflow-y: scroll;
} 
.clearfix:after {
    content: "."; 
    display: block; 
    height:0; 
    clear:both; 
    visibility: hidden;
}
.clearfix { 
    *zoom:1; 
}
```


- `mobile meta `标签

```html
<meta name=”viewport” content=”width=320,target-densitydpi=dpi_value,initial-scale=1, user-scalable=no”/>
```

- 表格不被撑开

```css
table-layout: fixed; word-break: break-all;;border-collapse: collapse
```

- 不设宽高居中

```html
<div id=”abc” style=”display:table;text-align:center;width:100%;height:100%;”>
      <span style=”background:#f00; display:table-cell; vertical-align:middle;”>
            <input type=”button” value=”item1″ />
      </span>
</div>
```

- 透明度的兼容代码

```css
filter:alpha(opacity=50); /*1-100*/
-moz-opacity:0.5; /*0-1.0*/
-khtml-opacity:0.5; /*0-1.0*/
opacity:0.5; /*0-1.0*/
```
- 文字溢出点点省略

```css
white-space:nowrap;
text-overflow:ellipsis;
overflow:hidden;
```

- 清除浮动的几种方法
  - 方法一：`投机取巧法` -- 不推荐
   - 直接一个放到当作最后一个子标签放到父标签那儿，此方法屡试不爽，兼容性强

 - 方法二：`overflow + zoom`方法  --不推荐
     `.fix{overflow:hidden; zoom:1;}`
   - 此方法优点在于代码简洁，涵盖所有浏览器

 - 方法三：`after + zoom`方法 -推荐--此方法可以说是综合起来最好的方法了
   - `clearfix`只应用在包含浮动子元素的父级元素上

```css
.fix{zoom:1;}
.fix:after{
     display:block; 
     content:'clear'; 
     clear:both;
     line-height:0; 
     visibility:hidden;
}
```

- 更多代码片段详情
   - [实用的60个CSS代码片段](http://www.jianshu.com/p/e878122a92a3)

##### 一些总结
---

- 自动继承属性：

  - `color`
  - `font`
  - `text-align`
  - `list-style`
...

- 非继承属性：
  - ` background`
  - `border`
  - `position`
...

- 具有破坏性的元素：

  - `float`
  - `display:none;`
  - `position:absoblute/fixed/sticky;`

- 具有包裹性的元素：

  - `display:inline-block/table-cell`

  - `position:absolute/fixed/sticky`

  - `overflow:hidden/scroll`

- 消除图片底部间隙的方法

  - 图片块状化-无基线对齐
  `img{display:block;}`

  - 图片底线对齐
  `img{vertical-align:bottom;}`

  - 行高足够小 - 基线位置上移
 `.box{line-height:0;}`

##### 一些概念
---

- BFC
   - BFC全称`”Block Formatting Context”` 中文为“块级格式化上下文”

  - 记住这么一句话：`BFC`元素特性表现原则就是，内部子元素再怎么翻江倒海，翻云覆雨都不会影响外部的元素

  - `BFC`就是页面上的一个隔离的独立容器，容器里面的子元素不会影响到外面的元素。反之也如此

 - 扩展阅读
    - [CSS中的BFC](https://github.com/dwqs/blog/issues/22)
- 优雅降级(`graceful degradation`)
  - 一开始就构建完整的功能，然后再针对低版本浏览器进行兼容
- 渐进增强 `progressive enhancement`：
  - 是在浏览器开启`JavaScript`功能后，如果浏览器版本不支持某些  `JavaScript`  能力，我们解决这种问题的方式
- 平稳退化
  - 是在浏览器没有`JavaScript`功能，或没有开启`JavaScript`功能情况下，我们解决这种问题的方式；

##### 方案荟萃扩展阅读
---

- **关于布局**
 - [垂直居中](http://www.qianduan.net/css-to-achieve-the-vertical-center-of-the-five-kinds-of-methods/)
 - [css完全居中](http://codepen.io/shshaw/full/gEiDt)
 - [居中之美](http://www.w3cplus.com/collective-5.html)
 - [网页中的底部foot定位](http://www.zhihu.com/question/35290742#answer-20340542)
 - [页面高度100%](http://www.webhek.com/css-100-percent-height)
 - [textarea高度自适应](https://github.com/phoetry/textareaAutoHeight)
 - [多行溢出省略](http://dotdotdot.frebsite.nl/)
 - [Retina屏1px线](http://jinlong.github.io/2015/05/24/css-retina-hairlines/)
 - [Flexbugs](https://github.com/philipwalton/flexbugs)

- **其他**
 - [IF IE ENDIF条件判断之IE10](http://www.stepday.com/topic/?690)
 - [Chrome 翻译插件](http://www.zhihu.com/question/20158063)
 - [网页retina优化](http://blog.netsh.org/posts/website-retina_1779.netsh.html)
 - [常用meta](http://segmentfault.com/a/1190000002407912)
 - [树状菜单](http://www.cnblogs.com/mq0036/p/3531848.html)
 - [em vs rem](http://www.w3ctrain.com/2015/07/24/comprehensive-guide-when-to-use-em-vs-rem/)
 - [css vs js](https://github.com/classicemi/blog/issues/3#issuecomment-113861251)
 - [css解决方案（w3cplus）](http://www.w3cplus.com/solution/index/index.html)
 - [Textures生成纹理](http://riccardoscalco.github.io/textures/)
 - [CSSgram](http://una.im/CSSgram/)
 - [Csscss（检查重复声明等）](http://zmoazeni.github.io/csscss/)


#### 附录四 部分工具资源
---

- [学会使用Emmet插件快速编码](http://blog.poetries.top/2016/03/14/Emmet%EF%BC%9AHTML-CSS%E4%BB%A3%E7%A0%81%E5%BF%AB%E9%80%9F%E7%BC%96%E5%86%99%E7%A5%9E%E5%99%A8/)
- [Emmet常用快捷键](http://blog.poetries.top/2016/09/09/Emmet%E5%B8%B8%E7%94%A8%E5%BF%AB%E6%8D%B7%E9%94%AE/#more)
- [Sublime专题](https://github.com/poetries/mywiki/blob/master/bookmark/sublime-text.md)
- [Sublime常用插件总结](https://github.com/poetries/mywiki/blob/master/bookmark/Sublime%E5%B8%B8%E7%94%A8%E6%8F%92%E4%BB%B6%E6%80%BB%E7%BB%93.md)
- [Front-End -Develop -Tools](https://github.com/poetries/mywiki/blob/master/bookmark/Front-End%20-Develop%20-Tools.md)
- [ToolsBox-自己整理的一份工具列表](https://github.com/poetries/mywiki/blob/master/bookmark/Tools.md)

#### 附录五 编码规范
---

- [编码规范](https://github.com/poetries/mywiki/blob/master/bookmark/%E5%BC%80%E5%8F%91%E8%A7%84%E8%8C%83.md)
- [前端规范](http://front-end-standards.com/)
- [web develop standard](https://github.com/poetries/mywiki/wiki/web-develop-standard)
- [Web 前端开发规范文档](http://codecloud.net/5622.html)
- [前端开发规范手册](http://zhibimo.com/read/Ashu/front-end-style-guide/index.html)

#### 附录六 进阶学习
---

- [DOM编程之API学习](http://www.jianshu.com/p/1e638b7da640)
- [JavaScript基础学习](http://www.jianshu.com/p/1f2314552e23)

#### 附录七 其他资源
---

- [Github上前端学习资源汇总](https://github.com/poetries/mywiki)
- [WEB 前端开发学习笔记](https://github.com/poetries/mywiki/tree/master/front-end)
- [前端开发工具箱](https://github.com/poetries/mywiki/wiki/%E6%94%B6%E9%9B%86%E5%A5%BD%E7%94%A8%E7%9A%84%E5%B7%A5%E5%85%B7)
- [148个资源让你成为CSS专家](https://segmentfault.com/a/1190000006689923)
- [学习CSS布局-经典必看](http://zh.learnlayout.com/)

#### 附录八 常见问题
---

- 前端指路
 - [写给前端面试者（w3cplus）](http://www.w3cplus.com/css/write-to-front-end-developer-interview.html)
 - [如何成为一名卓越的前端工程师（勾三股四博客）](http://jiongks.name/blog/how-to-become-a-great-front-end-engineer/)
 - [什么是全栈工程师](http://www.epubit.com.cn/article/144)
 - [如何跟上前端开发的最新前沿](https://uptodate.frontendrescue.org/zh/)
 - [浏览器的工作原理](http://blog.jobbole.com/12749/)
 - [移动前端开发和 Web 前端开发的区别](http://www.zhihu.com/question/20269059#answer-19718763)
 - [大型网站CSS编写与维护](http://segmentfault.com/q/1010000003723038?utm_source=weekly&utm_medium=email&utm_campaign=email_weekly)
 - [CSS核心技术关键字](http://segmentfault.com/q/1010000003059724)

- 性能/规范/实践

 - [如何阅读W3c规范(王晓轩)](http://www.chinaw3c.org/how-to-read-spec-wxx.html)
 - [如何阅读W3c规范(高博)](http://www.chinaw3c.org/how-to-read-spec-gb.html)
 - [雅虎web性能优化军规](https://developer.yahoo.com/performance/rules.html)
 - [权威前端性能指南](http://browserdiet.com/zh/)
 - [高性能css](http://www.html-js.com/article/Front-end-home-best-practice-in-front-of-the-web-high-performance-CSS)

- 一些问答社区

 - [quora](https://www.quora.com/)
 - [stackoverflow](http://stackoverflow.com/)
 - [知乎](http://www.zhihu.com/)
 - [前端乱炖问答区](http://www.html-js.com/qa)
 - [segmentfault问答区](http://segmentfault.com/questions/newest)

#### 其他
---

- [本文Mardown原文件-欢迎转载](https://github.com/poetries/poetries.github.io/blob/dev/source/_posts/DIV+CSS%E7%B3%BB%E7%BB%9F%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0%E5%9B%9E%E9%A1%BE.md)
