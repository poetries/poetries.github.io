---
title: bootstrap笔记总结
date: 2016-11-19 16:55:24
tags: bootstrap
categories: Front-End
---

> 原文出处 http://blog.poetries.top/2016/11/19/bootstrap-review

最近项目中用到`bootstrap` 很是健忘各种属性类名，频繁翻阅文档，在这里暂且记录一下笔记
<!--more-->
#### 一、 `bootstrap`简介
---

 - `Bootstrap`，来自 `Twitter`（全国最大的微博），是目前最受欢迎的前端框架。
 - `bootstrap`下载及演示 http://v3.bootcss.com
- 什么是`bootstrap`？
    - `Bootstrap `是基于 `HTML`、`CSS`、`JAVASCRIPT` 的开源框架，它简洁、直观、强悍、灵活，使得 `Web `开发更加快捷，
   - 用于开发响应式布局、移动设备优先的 `WEB `项目。
- 为什么使用 `Bootstrap`？
    - 跨设备
    - 跨浏览器（`chrome`，`IE9`以上，`Firefox`，`Safari`，`Opera`...）
    - 响应式布局
    - 具有实用性强的组件
    - 内置`jquery`插件
- `bootstrap`的结构
    - 主要分为三大核心模块：`css`、`js`、`font`

#### 二、`bootstrap`排版样式
---


- **标题**
  - 从 `h1` 到 `h6`

```html
	<h1>Bootstrap 排版</h1> //36px
	<h2>Bootstrap 排版</h2> //30px
	<h3>Bootstrap 排版</h3> //24px
	<h4>Bootstrap 排版</h4> //18px
	<h5>Bootstrap 排版</h5> //14px
	<h6>Bootstrap 排版</h6> //12px
	<h2>bootstrap课程</h2>
	<p class="lead">hello world</p>
```

- 内联文本元素
  - 添加标记，`<mark>`元素或`.mark` 类

```html
   <p>Bootstrap<mark>排版</mark></p>
   
   <!--各种加线条的文本-->
   <del>Bootstrap 排版</del>  //删除的文本
   <s>Bootstrap 排版</s>  //无用的文本
   <ins>Bootstrap 排版</ins>  //插入的文本
   <u>Bootstrap 排版</u>  //效果同上，下划线文本
   
   <!--各种强调的文本-->
   <small>Bootstrap 排版</small>  //标准字号的 85%
   <strong>Bootstrap 排版</strong>    //加粗 700
   <em>Bootstrap 排版</em>    //倾斜
   <p class="text-left">向左对齐文本</p>
   <p class="text-center">居中对齐文本</p>
   <p class="text-right">向右对齐文本</p>
   <p class="text-justify">对齐文本。该段落会根据屏幕的大小对超出屏幕的文字进行换行</p>
   <p class="text-nowrap">该段落不会根据屏幕的大小对超出屏幕的文字进行换行。</p>
   <p class="text-lowercase">BOOTSTROP</p>
   <p class="text-uppercase">bootstrap</p>
   <p class="text-capitalize">bootstrap</p> //单词首字母大写
 ```
 
- **缩略语**
   - `HTML `元素提供了用于缩写的标记，比如 `WWW` 或 `HTTP`。`Bootstrap` 定义 `<abbr>` 元素的样式为显示在文本底部的一条虚线边框
   - 当鼠标悬停在上面时会显示完整的文本（只要您为 ``<abbr>`` title 属性添加了文本）。为了得到一个更小字体的文本，
   - 请添加 `.initialism` 到 `<abbr>`
   
 ```html
   <abbr title="World Wide Web">WWW</abbr><br>
   <abbr title="Real Simple Syndication" class="initialism">RSS</abbr>
 ```
 
- **地址**
  - `address`默认为 `display:block`;，需要使用标签来为封闭的地址文本添加换行
  
```html
   <address>
     <strong>Twitter, Inc.</strong><br>
     795 Folsom Ave, Suite 600<br>
     San Francisco, CA 94107<br>
     <abbr title="Phone">P:</abbr> (123) 456-7890
   </address>
   <address>
     <strong>Full Name</strong><br>
     <a href="mailto:#">first.last@example.com</a>
   </address>
```

- **引用**
   - 默认样式引用，增加了左边线，设定了字体大小和内外边距
   `<blockquote> Bootstrap 框架 </blockquote>`
   - 反向
   `<blockquote class="blockquote-reverse "> Bootstrap 框架 </blockquote>`
   - 多种引用样式
   
```html
   <blockquote>
       <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante.</p>
       <footer class="text-right">Someone famous in <cite title="Source Title">Source Title</cite></footer>
   </blockquote>
 ```
 
- **列表**
   - 有序列表、无序列表、自定义列表
     - `.list-unstyled`
     - `.list-inline`
     - `.dl-horizontal `  应用于`<dl> `元素和` <dt>`元素中
   
- **代码**
   - `.pre-scrollable`  使 `<pre>` 元素可滚动 `scrollable`
   - 内联代码   `<code><section></code>`
   - 用户输入   `press <kbd>ctrl + ,</kbd>`
   - 标记变量   `<var>y</var> = <var>m</var><var>x</var> + <var>b</var>`
   - 程序输出   `<samp>This text is meant to be treated as sample output from a computer program.</samp>`
   - 代码块     `<pre><article>Please input...</article></pre>`


#### 三、表格、按钮、图片
---

- **表格**
   - 基本表格 `<table class="table">`
   - 条纹表格 `<table class="table table-striped">`
   - 边框表格  `<table class="table table-bordered">`
   - 悬停表格`<table class="table table-hover">`
   - 精简表格`<table class="table table-condensed">`
   - 状态表格`active`、`success`、`info`、`warning`、`danger`
   - 隐藏某一行`<tr class="sr-only">`
   - 响应式表格
      - 表格父元素设置响应式，小于 `768px` 出现边框
      `<div class="table-responsive">`

- **按钮**
    - 按钮标签
       - 转化成普通按钮
       - `<a href="###" class="btn btn-default">Link</a>`
       - `<button class="btn btn-default">Button</button>`
       - `<input type="button" class="btn btn-default" value="input">`
       - 注意：为了跨浏览器展现，尽量使用`button`
    - 按钮大小
       - `.btn-lg`	这会让按钮看起来比较大。
       - `.btn-sm`	这会让按钮看起来比较小。
       - `.btn-xs`	这会让按钮看起来特别小。
    - 预定义样式
       - `.btn-default`	默认/标准按钮
       - `.btn-primary`	首选项样式
       - `.btn-success`	成功样式
       - `.btn-info	`一般信息样式
       - `.btn-warning`	警告样式
       - `.btn-danger`	危险样式
       - `.btn-link`	链接样式
    - 块级按钮
       - `.btn-block`	块级按钮(拉伸至父元素100%的宽度)
    - 激活状态
       - `<button class="btn active">Button</button>`
    - 禁用状态
       - `<button class="btn active disabled">Button</button>`

- **图片**
    - `.img-rounded `   圆角 (`IE8` 不支持)
    - `.img-circle` 圆形 (`IE8` 不支持)
    - `.img-thumbnail`  缩略图功能
    - `.img-responsive`	图片响应式 (将很好地扩展到父元素)

#### 四、栅格系统、表单
---

- **栅格系统**
  - 响应式网格系统随着屏幕或视口（`viewport`）尺寸的增加，系统会自动分为最多`12`列。
  - 工作原理
      - 行必须放置在`.container`(固定宽度)或者`.container-fluid(100%宽度)`  `class`内，获得适当的对齐`(alignment)`和内边距`(padding)`
      - 内容放置在列中，唯有列可以是行的直接子元素
      - 预定义的网格类，比如 `.row` 和 `.col-lg-4`，可用于快速创建网格布局
      - 列通过内边距`（padding）`来创建列内容之间的间隙
  - 媒体查询
     - 超小设备（手机，小于 `768px`） 
     - 没有任何媒体查询相关的代码，因为这在 Bootstrap 中是默认的（还记得 `Bootstrap` 是移动设备优先的吗？）
     - 小型设备（平板电脑，大于等于`768px`）`@media (min-width: @screen-sm-min) and (max-width: @screen-sm-max) { ... }`
     - 中型设备（台式电脑，大于等于`992px`）`@media (min-width: @screen-md-min) and (max-width: @screen-md-max) { ... }`
     - 大型设备（大台式电脑，大于等于`1200px`）`@media (min-width: @screen-lg-min) { ... }`
  - 栅格参数
     - 超小屏幕 手机 (`<768px`)	
	 - 小屏幕 平板 (`≥768px`)	
	 - 中等屏幕 桌面显示器 (`≥992px`)	
	 - 大屏幕 大桌面显示器 (`≥1200px`)
     - 栅格系统行为	 
	   - 总是水平排列	
	   - 开始是堆叠在一起的，当大于这些阈值时将变为水平排列C
     - `.container ` 最大宽度	`None `（自动）`750px`  `970px`  `1170px`
     - 类前缀 `.col-xs-	 `  `.col-sm-`	 `.col-md-`	  `.col-lg-`
     - 列（`column`）数	`12`
     - 最大列（`column`）宽	自动 `~62px` `~81px`	`~97px`
     - 间隙宽度	 `30px` （每列左右均有 `15px`）

  - 四种屏幕分类全部激活
 ```html
   <div class="container">
        <div class="row">
            <div class="col-lg-3 col-md-4 col-sm-6 col-xs-12 a">4</div>
            <div class="col-lg-3 col-md-4 col-sm-6 col-xs-12 a">4</div>
            <div class="col-lg-3 col-md-4 col-sm-6 col-xs-12 a">4</div>
            ....
        </div>
   </div>
 ```

- 可以设置列偏移，让中间保持空隙
```html
   <div class="container">
        <div class="row">
            <div class="col-md-8">1-8</div>
            <div class="col-md-3 col-md-offset-1">10-12</div>
        </div>
   </div>
```

- 可以嵌套，嵌满也是 12 列
```html
   <div class="container">
        <div class="row">
            <div class="col-md-9">
                <div class="col-md-8">1-8</div>
                <div class="col-md-4">9-12</div>
            </div>
            <div class="col-md-3"> 10-12 </div>
        </div>
   </div>
```
- 可以把两个列交换位置，`push` 向右移动（推），`pull` 向左移动（拉）
```html
   <div class="container">
        <div class="row">
            <div class="col-md-8 col-md-push-4">8</div>
            <div class="col-md-4 col-md-pull-8">4</div>
        </div>
   </div>
```

- **表单**
  - 垂直或基本表单
  - 内联表单
    - 让表单左对齐浮动，并表现为 `inline-block `内联块结构`<form class="form-inline">`
      注：当小于 `768px`，会恢复独占样式
  - 水平表单
    - 让表单内的元素保持水平排列
  - 表单组合
    - 前后增加片段
```html
<div class="input-group">
	 <div class="input-group-addon">￥</div>
	 <input type="text" class="form-control">
	 <div class="input-group-addon">.00</div>
</div>
```
- 输入框、文本域
   - 原生的` HTML5 `的` input `类型的支持
   - 包括：
      - `text`
      - `password`
      - `datetime`
      - `datetime-local`
      - `date`
      - `month`
      - `time`
      - `week`
      - `number`
      - `email`
      - `url`
      - `search`
      - `tel `
      - `color`
   - `<input type="text" class="form-control" placeholder="文本输入">`
   - `<textarea class="form-control" rows="3"></textarea>`
  - 复选框（`Checkbox`）和单选框（`Radio`）
```html
<div class="checkbox">
 <label><input type="checkbox" value="">选项 1</label>
</div>
<div class="radio">
 <label>
	<input type="radio" name="optionsRadios" id="optionsRadios1"
	   value="option1" checked> 选项 1
 </label>
</div>
```
- 内联的复选框和单选框
```html
<label class="checkbox-inline">
 <input type="checkbox" id="inlineCheckbox1" value="option1"> 选项 1
</label>
<label class="radio-inline">
 <input type="radio" id="optionsRadiosinline" value="option1"> 选项 1
</label>
```

- 选择框    `multiple `多行显示
```html
<select class="form-control" multiple>
	 <option>1</option>
	 <option>2</option>
	 <option>3</option>
	 <option>4</option>
	 <option>5</option>
</select>
```

- 静态控件   `.form-control-static`
- 表单控件状态
   - 输入框焦点
   - 当输入框 `input` 接收到` :focus` 时，输入框的轮廓会被移除，同时应用 `box-shadow`。
   - 禁用的输入框 `input`
   - 如果您想要禁用一个输入框 `input`，只需要简单地添加 `disabled` 属性，这不仅会禁用输入框，还会改变输入框的样式以及当鼠标的指针悬停在元素上时鼠标指针的样式。
   - 禁用的字段集 `fieldset`
   - 对 `<fieldset>` 添加 `disabled` 属性来禁用` <fieldset>` 内的所有控件。
   - 校验状态
      - `.has-warning`、`.has-error` 或 `.has-success` 类到这些控件的父元素即可。
   - 任何包含在此元素之内的 `.control-label`、`.form-control` 和 `.help-block` 元素都将接受这些校验状态的样式。
- 表单帮助文本
```html
<form role="form">
	 <input class="form-control" type="text" placeholder="">
	 <span class="help-block">一个较长的帮助文本块，超过一行，需要扩展到下一行。本实例中的帮助文本总共有两行。</span>
</form>
```

- 控件尺寸
   - `.input-lg`和`col-lg-*`来设置表单的高度和宽度
```html
<div class="form-group">
  <input class="form-control input-lg" type="text" placeholder="input-lg">
</div>
<div class="row">
  <div class="col-lg-2">
	 <input type="text" class="form-control" placeholder="col-lg-2">
  </div>
  <div class="col-lg-3">
	 <input type="text" class="form-control" placeholder="col-lg-3">
  </div>
  <div class="col-lg-4">
	 <input type="text" class="form-control" placeholder="col-lg-4">
  </div>
</div>
```

#### 五、辅助类、响应式工具、菜单、图标
---

#### 辅助类
---

- **文本**

```html
      <p class="text-muted">本行内容是减弱的</p>
      <p class="text-primary">本行内容带有一个 primary class</p>
      <p class="text-success">本行内容带有一个 success class</p>
      <p class="text-info">本行内容带有一个 info class</p>
      <p class="text-warning">本行内容带有一个 warning class</p>
      <p class="text-danger">本行内容带有一个 danger class</p>
```

- **背景**

```html
<p class="bg-primary">bootstrap课程</p>
<p class="bg-success">bootstrap课程</p>
<p class="bg-info">bootstrap课程</p>
<p class="bg-warning">bootstrap课程</p>
<p class="bg-danger">bootstrap课程</p>
```

- 关闭按钮   `close`

```html
<button class="close">×</button>
```

- 下拉式菜单  `caret`

```html
<span class="caret"></span>
```

- 浮动 `pull-left`   `pull-right`

```html
<div class="pull-left">向左快速浮动</div>
<div class="pull-right">向右快速浮动</div>
```

- 清除浮动   `clearfix`

```html
<div class="clearfix"  style="background: #D8D8D8;border: 1px solid #000;padding: 10px;">
	 <div class="pull-left" style="background:#58D3F7;">向左快速浮动</div>
	 <div class="pull-right" style="background: #DA81F5;">向右快速浮动</div>
</div>
```

- 块级内容居中 `center-block`

```html
<div class="row">
 <div class="center-block" style="width:200px;background-color:#ccc;">
	这是 center-block
 </div>
</div>
```

- 显示、隐藏  `show` `hide`

```html
<div class="row" style="padding: 91px 100px 19px 50px;">
 <div class="show" style="width:300px;background-color:#ccc;">
	这是 show class
 </div>
 <div class="hidden" style="width:200px;background-color:#ccc;">
	这是 hide class
 </div>
</div>
```

- 屏幕阅读器和键盘导航  `.sr-only` 来把元素对所有设备隐藏，除了屏幕阅读器    `.sr-only-focusable`

```html
<div class="row" style="padding: 91px 100px 19px 50px;">
 <form class="form-inline" role="form">
	 <div class="form-group">
		<label class="sr-only" for="email">Email 地址</label>
		<input type="email" class="form-control" placeholder="Enter email">
	 </div>
	 <div class="form-group">
		<label class="sr-only" for="pass">密码</label>
		<input type="password" class="form-control" placeholder="Password">
	 </div>
 </form>
</div>
<a class="sr-only sr-only-focusable" href="#content">Skip to main content</a>
```

**响应式工具**

- `visible-xs` `visible-sm`  `visible-md`  `visible-lg`
- `hidden-xs`   `hidden-sm`   `hidden-md`   `hidden-lg`
- 以超小屏幕（`xs`）为例，可用的 `.visible-*-*` 类是：`visible-xs-block`、`visible-xs-inline` 和 `visible-xs-inline-block`
- `visible-print-block`    `visible-print-inline`    `visible-print-inline-block`  浏览器隐藏   打印机可见
      `hidden-print`  浏览器可见   打印机隐藏 `visible-print`

```html
   <div class="container" style="padding: 40px;">
      <div class="row">
         <div class="col-xs-6 col-sm-3" style="background-color: #dedef8;border:1px solid #000;">
            <span class="hidden-xs">特别小型</span>
            <span class="visible-xs">✔ 在特别小型设备上可见</span>
         </div>
         <div class="col-xs-6 col-sm-3" style="background-color: #dedef8;border:1px solid #000;">
            <span class="hidden-sm">小型</span>
            <span class="visible-sm">✔ 在小型设备上可见</span>
         </div>
         <div class="col-xs-6 col-sm-3" style="background-color: #dedef8;border:1px solid #000;">
            <span class="hidden-md">中型</span>
            <span class="visible-md">✔ 在中型设备上可见</span>
         </div>
         <div class="col-xs-6 col-sm-3" style="background-color: #dedef8;border:1px solid #000;">
            <span class="hidden-lg">大型</span>
            <span class="visible-lg">✔ 在大型设备上可见</span>
         </div>
      </div>
   </div>
```

- **字体图标**
   - 用法：`<span class="glyphicon glyphicon-search"></span>`

- 下拉菜单
  - 基本的下拉菜单

```html
  <div class="dropdown">
	 <button class="btn btn-default dropdown-toggle" data-toggle="dropdown">Dropdown <span class="caret"></span></button>
	 <ul class="dropdown-menu">
		<li><a href="">Html</a></li>
		<li><a href="">Javascript</a></li>
		<li><a href="">jQuery</a></li>
		<li><a href="">html5+css3</a></li>
	 </ul>
  </div>
```

- 对齐 `dropdown-menu-right`


```html
  <ul class="dropdown-menu">
	 ...
	 <li class="dropdown-header">Dropdown header</li>
	 ...
  </ul>
```

- 分隔线

```html
  <ul class="dropdown-menu">
	 ...
	 <li class="divider"></li>
	 ...
  </ul>
```

- 禁用的菜单项

```html
<ul class="dropdown-menu" aria-labelledby="dropdownMenu4">
	 <li><a href="#">Regular link</a></li>
	 <li class="disabled"><a href="#">Disabled link</a></li>
	 <li><a href="#">Another link</a></li>
</ul>
```

- 让菜单默认显示 `<div class="dropdown open">`


#### 六、按钮、输入框组件
---

#### 按钮组件
---

- **基本的按钮组**

```html
  <div class="btn-group">
	  <button class="btn btn-default">left</button>
	  <button class="btn btn-default">middle</button>
	  <button class="btn btn-default">right</button>
  </div>
```

- **按钮工具栏**

```html
  <div class="btn-toolbar">
	  <div class="btn-group">
		  <button class="btn btn-default">left</button>
		  <button class="btn btn-default">middle</button>
		  <button class="btn btn-default">right</button>
	  </div>
	  <div class="btn-group">
		  <button class="btn btn-default">left</button>
		  <button class="btn btn-default">middle</button>
		  <button class="btn btn-default">right</button>
	  </div>
	  <div class="btn-group">
		  <button class="btn btn-default">更多</button>
	  </div>
  </div>
```

- **按钮的大小**

```html
  <div class="btn-group btn-group-lg">
	  <button class="btn btn-default">left</button>
	  <button class="btn btn-default">middle</button>
	  <button class="btn btn-default">right</button>
  </div>
  <div class="btn-group btn-group-sm">
	  <button class="btn btn-default">left</button>
	  <button class="btn btn-default">middle</button>
	  <button class="btn btn-default">right</button>
  </div>
  <div class="btn-group btn-group-xs">
	  <button class="btn btn-default">left</button>
	  <button class="btn btn-default">middle</button>
	  <button class="btn btn-default">right</button>
  </div>
```

- **嵌套**

```html
  <div class="btn-group">
	  <button class="btn btn-default">left</button>
	  <button class="btn btn-default">middle</button>
	  <div class="btn-group">
		  <button class="btn btn-default dropdown-toggle" data-toggle="dropdown">按钮 <span class="caret"></span></button>
		  <ul class="dropdown-menu">
			  <li><a href="">1</a></li>
			  <li><a href="">2</a></li>
			  <li><a href="">3</a></li>
		  </ul>
	  </div>
  </div>
```

- **垂直的按钮组**

```html
  <div class="btn-group-vertical">
	  <button class="btn btn-default">left</button>
	  <button class="btn btn-default">middle</button>
	  <div class="btn-group">
		  <button class="btn btn-default dropdown-toggle" data-toggle="dropdown">按钮 <span class="caret"></span></button>
		  <ul class="dropdown-menu">
			  <li><a href="">1</a></li>
			  <li><a href="">2</a></li>
			  <li><a href="">3</a></li>
		  </ul>
	  </div>
  </div>
```

- **两端对齐排列的按钮组**

```html
  <div class="btn-group btn-group-justified">
	  <div class="btn-group">
		  <button class="btn btn-default">left</button>
	  </div>
	  <div class="btn-group">
		  <button class="btn btn-default">middle</button>
	  </div>
	  <div class="btn-group">
		  <button class="btn btn-default">right</button>
	  </div>
  </div>
  <div class="btn-group btn-group-justified">
	  <!--<div class="btn-group">-->    为了浏览器兼容问题使用btn-group包裹
		  <a href="" class="btn btn-default">left</a>
	  <!--</div>-->
	  <!--<div class="btn-group">-->
		  <a href="" class="btn btn-default">middle</a>
	  <!--</div>-->
	  <!--<div class="btn-group">-->
		  <a href="" class="btn btn-default">right</a>
	  <!--</div>-->
  </div>
```


- **按钮式下拉菜单**

- 单按钮下拉菜单   `btn-default`  `btn-success`  `btn-primary`   `btn-info`   `btn-danger`   `btn-warning`

```html
 <div class="btn-group">
	 <button class="btn btn-default dropdown-toggle" data-toggle="dropdown">Default <span class="caret"></span></button>
	 <ul class="dropdown-menu">
		 <li><a href="">html</a></li>
		 <li><a href="">javascript</a></li>
		 <li><a href="">jQuery</a></li>
	 </ul>
 </div>
```

- **分裂式按钮下拉菜单**

```html
 <div class="btn-group">
	 <button class="btn btn-default">Default</button>
	 <button class="btn btn-default dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button>
	 <ul class="dropdown-menu">
		 <li><a href="">html</a></li>
		 <li><a href="">javascript</a></li>
		 <li><a href="">jQuery</a></li>
	 </ul>
 </div>
```

- **按钮下拉菜单的大小   `btn-lg`   `btn-sm`   `btn-xs`**

```html
 <div class="btn-group">
	 <button class="btn btn-default btn-lg dropdown-toggle" data-toggle="dropdown">Default <span class="caret"></span></button>
	 <ul class="dropdown-menu">
		 <li><a href="">html</a></li>
		 <li><a href="">javascript</a></li>
		 <li><a href="">jQuery</a></li>
	 </ul>
 </div>
```

- **向上弹出式菜单    `dropup`**

```html
 <div class="btn-group dropup">
	 <button class="btn btn-default btn-lg dropdown-toggle" data-toggle="dropdown">Default <span class="caret"></span></button>
	 <ul class="dropdown-menu">
		 <li><a href="">html</a></li>
		 <li><a href="">javascript</a></li>
		 <li><a href="">jQuery</a></li>
	 </ul>
 </div>
```

- **输入框**

- 基本的输入框组

```html
<form action="">
  <div class="input-group">
	  <span class="input-group-addon">@</span>
	  <input type="text" class="form-control"/>
  </div>
  <div class="input-group">
	  <input type="text" class="form-control"/>
	  <span class="input-group-addon">.00</span>
  </div>
  <div class="input-group">
	  <span class="input-group-addon">$</span>
	  <input type="text" class="form-control"/>
	  <span class="input-group-addon">.00</span>
  </div>
</form>
```

- 输入框组的大小    `input-group-lg`  `input-group-xs`  `input-group-sm`

```html
  <form action="">
	  <div class="input-group input-group-lg">
		  <span class="input-group-addon">@</span>
		  <input type="text" class="form-control"/>
	  </div>
  </form>
```

- **复选框和单选框插件**

```html
  <form action="">
	  <div class="row">
		   <div class="col-md-6">
			   <div class="input-group">
				   <span class="input-group-addon">
					   <input type="checkbox"/>
				   </span>
				   <input type="text" class="form-control"/>
			   </div>
		   </div>
	  </div>
  </form>
```

- **按钮插件   `input-group-btn`**

```html
  <form action="">
	  <div class="row">
		  <div class="col-md-6">
			  <div class="input-group">
				  <span class="input-group-btn">
					  <button class="btn btn-default">Go</button>
				  </span>
				  <input class="form-control" type="text"/>
			  </div>
		  </div>
	  </div>
  </form>
```

- **按钮式下拉菜单**

```html
  <form action="">
	  <div class="row">
		  <div class="col-md-6">
			  <div class="input-group">
				  <div class="input-group-btn">
					  <button class="btn btn-default dropdown-toggle" data-toggle="dropdown">dropdown<span class="caret"></span></button>
					  <ul class="dropdown-menu">
						  <li><a href="">资讯</a></li>
						  <li><a href="">新闻</a></li>
						  <li><a href="">关于</a></li>
					  </ul>
				  </div>
				  <input class="form-control" type="text"/>
			  </div>
		  </div>
	  </div>
  </form>
```

- **分裂式按钮下拉菜单**

```html
<form action="">
  <div class="row">
	  <div class="col-md-6">
		  <div class="input-group">
			  <div class="input-group-btn">
				  <button class="btn btn-default">dropdown</button>
				  <button class="btn btn-default dropdown-toggle" data-toggle="dropdown">
					  <span class="caret"></span>
				  </button>
				  <ul class="dropdown-menu">
					  <li><a href="">资讯</a></li>
					  <li><a href="">新闻</a></li>
					  <li><a href="">关于</a></li>
				  </ul>
			  </div>
			  <input class="form-control" type="text"/>
		  </div>
	  </div>
  </div>
</form>
```

#### 七、导航、导航条、面包屑导航组件
---

**导航（标签） `nav`**


- 标签页   `nav-tabs`

```html
  <ul class="nav nav-tabs">
	  <li class="active"><a href="">Home</a></li>
	  <li><a href="">Project</a></li>
	  <li><a href="">Message</a></li>
  </ul>
```

- 胶囊式标签页 `nav-pills`

```html
  <ul class="nav nav-pills">
	  <li class="active"><a href="">Home</a></li>
	  <li><a href="">Project</a></li>
	  <li><a href="">Message</a></li>
  </ul>
```

- 垂直的胶囊式标签页  `nav-stacked`

```html
  <ul class="nav nav-pills nav-stacked">
	  <li class="active"><a href="">Home</a></li>
	  <li><a href="">Project</a></li>
	  <li><a href="">Message</a></li>
  </ul>
```

- 两端对齐的标签页 `nav-justified`

```html
  <ul class="nav nav-pills nav-justified">
	  <li class="active"><a href="">Home</a></li>
	  <li><a href="">Project</a></li>
	  <li><a href="">Message</a></li>
  </ul>
```

- 禁用链接  ` disabled`

```html
  <ul class="nav nav-tabs">
	  <li class="active"><a href="">Home</a></li>
	  <li class="disabled"><a href="">Project</a></li>
	  <li><a href="">Message</a></li>
  </ul>
```

- 带有下拉菜单的标签

```html
  <ul class="nav nav-tabs">
	  <li class="active"><a href="">Home</a></li>
	  <li><a href="">Project</a></li>
	  <li class="dropdown">
		  <a href="" class="dropdown-toggle" data-toggle="dropdown">Message <span class="caret"></span></a>
		  <ul class="dropdown-menu">
			  <li><a href="">关于</a></li>
			  <li><a href="">资讯</a></li>
			  <li><a href="">通讯</a></li>
		  </ul>
	  </li>
  </ul>
```

- 带下拉菜单的胶囊式标签

```html
  <ul class="nav nav-pills">
	  <li class="active"><a href="">Home</a></li>
	  <li><a href="">Project</a></li>
	  <li class="dropdown">
		  <a href="" class="dropdown-toggle" data-toggle="dropdown">Message <span class="caret"></span></a>
		  <ul class="dropdown-menu">
			  <li><a href="">关于</a></li>
			  <li><a href="">资讯</a></li>
			  <li><a href="">通讯</a></li>
		  </ul>
	  </li>
  </ul>
```

**导航条 `navbar`    `<nav>`标签中添加 `class` `.navbar`、`.navbar-default`**

- 默认的导航栏

```html
  <nav class="navbar navbar-default">
	  <div class="navbar-header">
		  <a class="navbar-brand" href="">poetries blog</a>
	  </div>
	  <ul class="nav navbar-nav">
		  <li class="active"><a href="">Home</a></li>
		  <li><a href="">Project</a></li>
		  <li class="dropdown">
			  <a href="" class="dropdown-toggle" data-toggle="dropdown">Message <span class="caret"></span></a>
			  <ul class="dropdown-menu">
				  <li><a href="">关于</a></li>
				  <li><a href="">资讯</a></li>
				  <li><a href="">通讯</a></li>
			  </ul>
		  </li>
	  </ul>
  </nav>
```

- 响应式的导航栏

```html
  <nav class="navbar navbar-default">
	  <div class="navbar-header">
		  <button class="navbar-toggle" data-toggle="collapse" data-target="#navbar-collapse">
			  <span class="icon-bar"></span>
			  <span class="icon-bar"></span>
			  <span class="icon-bar"></span>
		  </button>
		  <a class="navbar-brand" href="">教育</a>
	  </div>
	  <div class="collapse navbar-collapse" id="navbar-collapse">
		  <ul class="nav navbar-nav">
			  <li class="active"><a href="">Home</a></li>
			  <li><a href="">Project</a></li>
			  <li class="dropdown">
				  <a href="" class="dropdown-toggle" data-toggle="dropdown">Message <span class="caret"></span></a>
				  <ul class="dropdown-menu">
					  <li><a href="">关于</a></li>
					  <li><a href="">资讯</a></li>
					  <li><a href="">通讯</a></li>
				  </ul>
			  </li>
		  </ul>
	  </div>
  </nav>
```

- 导航栏中的表单

```html
  <form action="" class="navbar-form navbar-right">
	  <div class="form-group">
		  <input class="form-control" type="text" placeholder="Search"/>
	  </div>
	  <button class="btn btn-default">Search</button>
  </form>
```

- 导航栏中的按钮   ` navbar-btn`

```html
<button class="btn btn-default navbar-btn">Submit</button>
```

- 导航栏中的文本    `navbar-text`

```html
<p class="navbar-text">Signed in as Thomas</p>
```

- 固定到顶部、底部   `navbar-fixed-top`    `navbar-fixed-bottom`

```html
  <nav class="navbar navbar-default navbar-fixed-top">
	  <div class="navbar-header">
		  <a class="navbar-brand" href="">教育</a>
	  </div>
	  <ul class="nav navbar-nav">
		  <li class="active"><a href="">Home</a></li>
		  <li><a href="">Project</a></li>
		  <li class="dropdown">
			  <a href="" class="dropdown-toggle" data-toggle="dropdown">Message <span class="caret"></span></a>
			  <ul class="dropdown-menu">
				  <li><a href="">关于</a></li>
				  <li><a href="">资讯</a></li>
				  <li><a href="">通讯</a></li>
			  </ul>
		  </li>
	  </ul>
  </nav>
```

- 静态的顶部 `navbar-static-top`

- 倒置的导航栏  带有黑色背景白色文本的倒置的导航栏    `navbar-inverse`

- 面包屑导航

```html
<ul class="breadcrumb">
   <li><a href="">首页</a></li>
   <li><a href="">列表</a></li>
   <li class="active">详情</li>
</ul>
```

#### 八、分页、标签、徽章、巨幕、页头、缩略图、警告框组件
---

**分页**


- 默认的分页

```html
  <ul class="pagination">
	  <li><a href="">«</a></li>
	  <li><a href="">1</a></li>
	  <li><a href="">2</a></li>
	  <li><a href="">3</a></li>
	  <li><a href="">»</a></li>
  </ul>
```

- 禁用和激活状态

```html
<ul class="pagination">
  <li class="disabled"><a href="">«</a></li>
  <li class="active"><a href="">1</a></li>
  <li><a href="">2</a></li>
  <li><a href="">3</a></li>
  <li><a href="">»</a></li>
</ul>
```

- 分页的尺寸  `pagination-lg`    `pagination-sm`

- 翻页（`Pager`）

```html
  <ul class="pager">
	  <li><a href="">previous</a></li>
	  <li><a href="">next</a></li>
  </ul>
```

- 对齐的链接

```html
  <ul class="pager">
	  <li class="previous"><a href="">← previous</a></li>
	  <li class="next"><a href="">next →</a></li>
  </ul>
```

- 可选的禁用状态

```html
  <ul class="pager">
	  <li class="previous disabled"><a href="">← previous</a></li>
	  <li class="next"><a href="">next →</a></li>
  </ul>
```


**标签**


```html
<span class="label label-default">Default</span>
<span class="label label-primary">Primary</span>
<span class="label label-success">Success</span>
<span class="label label-info">Info</span>
<span class="label label-warning">Warning</span>
<span class="label label-danger">Danger</span>
```


- 徽章`badge`

```html
   <a href="">Messages <span class="badge">20</span></a>
   <button class="btn btn-default">Messages <span class="badge">20</span></button>
```

- 巨幕 `jumbotron`

```html
   <div class="jumbotron">
       <div class="container">
           <h1>hello world!!!</h1>
           <p>This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured
               content or information.</p>
           <p><a class="btn btn-primary" href="">Learn more</a></p>
       </div>
   </div>
```

- 页头 `page-header`

```html
   <div class="page-header">
	   <h1>Example page header
		   <small>Subtext for header</small>
	   </h1>
   </div>
```

**缩略图**


- 默认样式

```html
<div class="col-md-3 col-sm-6">
   <a class="thumbnail" href="">
	   <img src="images/kittens.jpg" alt=""/>
   </a>
</div>
```

- 自定义内容

```html
<div class="col-md-3 col-sm-6">
   <div class="thumbnail">
	   <img src="images/kittens.jpg" alt=""/>
	   <div class="caption">  <!--text-center-->
		   <h3>缩略图标签</h3>
		   <p>一些示例文本。一些示例文本。</p>
		   <p>
			   <a href="#" class="btn btn-primary" role="button">按钮</a>
			   <a href="#" class="btn btn-default" role="button">按钮 </a>
		   </p>
	   </div>
   </div>
</div>
```

**警告框**


- 基本默认样式

```html
  <div class="alert alert-success">成功！很好地完成了提交。</div>
  <div class="alert alert-info">信息！请注意这个信息。</div>
  <div class="alert alert-warning">警告！请不要提交。</div>
  <div class="alert alert-danger">错误！请进行一些更改。</div>
```

- 可关闭的警告框` <button type="button" class="close" data-dismiss="alert">×</button>`

- 警告中的链接

```html
  <div class="alert alert-success">
	  <a href="#" class="alert-link">成功！很好地完成了提交。</a>
  </div>
```

#### 九、进度条、媒体对象、列表组、面板、响应式插入组件
---

**进度条**


- 默认的进度条

```html
  <div class="progress">
	  <div class="progress-bar" style="width:45%;">45%</div>
  </div>
```

- 情景变化的进度条

```html
  <div class="progress">
	  <div class="progress-bar progress-bar-info" style="width:60%;">60%</div>
  </div>
  <div class="progress">
	  <div class="progress-bar progress-bar-success" style="width:25%;">25%</div>
  </div>
  <div class="progress">
	  <div class="progress-bar progress-bar-danger" style="width:45%;">45%</div>
  </div>
  <div class="progress">
	  <div class="progress-bar progress-bar-warning" style="width:45%;">45%</div>
  </div>
```

- 条纹的进度条 `progress-striped`

```html
  <div class="progress progress-striped">
	  <div class="progress-bar" style="width:45%;">45%</div>
  </div>
```

- 动画的进度条`active`

```html
  <div class="progress progress-striped active">
	  <div class="progress-bar" style="width:45%;">45%</div>
  </div>
```

- 堆叠的进度条

```html
  <div class="progress">
	  <div class="progress-bar progress-bar-warning" style="width:45%;">45%</div>
	  <div class="progress-bar progress-bar-success" style="width:25%;">25%</div>
  </div>
```

**媒体对象**

```html
<div class="media">
   <a href="" class="pull-left"><img class="media-object" src="images/kittens.jpg" alt="" width="95"/></a>
   <div class="media-body">
	   <h4 class="media-heading">媒体标题</h4>
	   这是一些示例文本。这是一些示例文本。
	   这是一些示例文本。这是一些示例文本。
	   这是一些示例文本。这是一些示例文本。
	   这是一些示例文本。这是一些示例文本。
	   这是一些示例文本。这是一些示例文本。
   </div>
</div>
```

**列表组**


- 向列表组添加国徽

```html
  <ul class="list-group">
	  <li class="list-group-item"><a href="">免费域名注册 <span class="badge pull-right">20</span></a></li>
	  <li class="list-group-item"><a href="">免费 Window 空间托管</a></li>
	  <li class="list-group-item"><a href="">每年更新成本</a></li>
  </ul>
```

- 向列表组添加链接

```html
  <div class="list-group">
	  <a href="" class="list-group-item active">免费域名注册</a>
	  <a href="" class="list-group-item">免费 Window 空间托管</a>
	  <a href="" class="list-group-item">每年更新成本</a>
  </div>
```

- 向列表组添加自定义内容

```html
  <ul class="list-group">
	 <li class="list-group-item">Cras justo odio</li>
	 <li class="list-group-item">Dapibus ac facilisis in</li>
	 <li class="list-group-item">Morbi leo risus</li>
	 <li class="list-group-item">Porta ac consectetur ac</li>
	 <li class="list-group-item">Vestibulum at eros</li>
  </ul>
```

**面板**


- 面板标题

```html
      <div class="panel-heading">标题</div>
```

- 面板脚注

```html
      <div class="panel-footer text-right">by zichen</div>
```

- 面板主题

```html
  <div class="panel panel-primary">...</div>
  <div class="panel panel-success">...</div>
  <div class="panel panel-info">...</div>
  <div class="panel panel-warning">...</div>
  <div class="panel panel-danger">...</div>
```

- 带表格的面板

```html
  <div class="panel panel-default">
	  <div class="panel-heading">Panel heading</div>
	  <table class="table">
		  <tr>
			  <td>学号</td>
			  <td>姓名</td>
			  <td>年龄</td>
		  </tr>
	  </table>
  </div>
```

- 带列表组的面板

```html
  <div class="panel panel-danger">
	  <div class="panel-heading">标题</div>
	  <div class="panel-body">面板内容显示区域</div>
	  <ul class="list-group">
		  <li class="list-group-item">免费域名注册</li>
		  <li class="list-group-item">免费 Window 空间托管</li>
		  <li class="list-group-item">图像的数量</li>
		  <li class="list-group-item">24*7 支持</li>
		  <li class="list-group-item">每年更新成本</li>
	  </ul>
	  <div class="panel-footer text-right">by zichen</div>
  </div>
```

**响应式嵌入组件**


- 根据被嵌入内容的外部容器的宽度，自动创建一个固定的比例，从而让浏览器自动确定 内容的尺寸，能够在各种设备上缩放
   这些规则可以直接用于`<iframe>`、`<embed>`、`<video>`和`<object>`元素。
- `16:9` 响应式

```html
   <div class="embed-responsive embed-responsive-16by9">
        <embed width="100%" height="100%" src="https://www.youtube.com/embed/zpOULjyy-n8?rel=0"></embed>
   </div>
```

- `4:3` 响应式

```html
<div class="embed-responsive embed-responsive-4by3">
	<embed width="100%" height="100%" src="https://www.youtube.com/embed/zpOULjyy-n8?rel=0"></embed>
</div>
<div class="embed-responsive embed-responsive-16by9">
	<iframe class="embed-responsive-item" src="https://www.youtube.com/embed/zpOULjyy-n8?rel=0"></iframe>
</div>
<div class="embed-responsive embed-responsive-4by3">
	<iframe class="embed-responsive-item" src="https://www.youtube.com/embed/zpOULjyy-n8?rel=0"></iframe>
</div>
```

**`well`**


- 基本的`well`

```html
<div class="well">您好，我在大的 Well 中！</div>
```

- 尺寸大小 `well-lg`   `well-sm`

```html
  <div class="well well-lg">您好，我在大的 Well 中！</div>
  <div class="well well-sm">您好，我在小的 Well 中！</div>
```


#### 十、弹出框、警告框、标签页和工具提示插件插件
---

**弹出框**

- 弹出框点击一个元素，弹出一个包含标题和内容的容器

```html
//基本用法
<button class="btn btn-lg btn-danger" type="button" data-toggle="popover" title="弹出框" data-content="这是一个弹出框插件">
	点击弹出/隐藏弹出框
</button>
```

- `JavaScript` 初始化  `$('button').popover();`

- `Popover` 插件中的属性：
   - `data-animation`   默认 `true`，在 `popover` 上应用一个 `CSS` `fade` 动画。 如果设置 `false`，则不应用。
   - `data-html`        默认 `false`，不允许提示内容格式为 `html`。如果设置 为 `true`，则可以设置 `html` 格式的提示内容
   - `data-placement`   默认值 `top`，还有 `bottom`、`left`、`right` 和 `auto`。 如果`auto`会自行调整合适的位置，如果是`auto` `left` 则会尽量在左边显示，但左边不行就靠右边。
   - `data-selector `   默认 `false`，可以选择绑定指定的选择器。
   - `data-original-title` 默认空字符串，弹出框的标题。优先级比 `title` 低
   - `title  `          默认字空符串，弹出框的标题。
   - `data-trigger`     默认值 `click`，表示怎么触发 `popover`，其他值为： `hover`、`focus`、`manual`。多个值用空格隔开，manual 手动不能和其他同时设置。
   - `data-delay`       默认值 `0`，延迟触发 `popover(毫秒)`，如果传数字则， 表示 `show`/`hide` 的毫秒数，如果传对象，结构为： {show:500,hide:100}
   - `data-container`   默认值 `false`，将 `popover` 附加到特定的元素上。比 如组合按钮组提示，容器不够，可以附加 `body` 上。` container : 'body'`
   - `data-template `   更改提示框的 `HTML` 提示语的模版，默认值为：

```html
<div class="popover">
	<div class="arrow"></div>
	<h3 class="popover-title"></h3>
	<div class="popover-content"></div>
</div>
```
- `data-content`    默认值为空，弹出框的内容。
- `data-viewport`    设置外围容器的边际，具体代码看示例。

```javascript
   $('button').popover({
		trigger:"click",
		placement:"right",
		viewport : {
			selector : '#view'
		}
   });
```

- `Popover` 插件中的方法：
  - 显示 `$('button').popover('show');`
  - 隐藏 `$('button').popover('hide');`
  - 反转显示和隐藏 `$('button').popover('toggle');`
  - 隐藏并销毁 `$('button').popover('destroy');`

- `Popover` 插件中的事件：
  - `show.bs.popover` 在调用 `show` 方法时触发
  - `shown.bs.popover` 在显示整个弹窗时时触发
  - `hide.bs.popover` 在调用 `hide` 方法时触发
  - `hidden.bs.popover` 在完全关闭整个弹出时触发

```javascript
   $('button').on('show.bs.tab', function () {
        alert('调用 show 方法时触发！');
   });
```

**警告框**


- 警告框即为点击小时的信息框

```html
//基本实例
<div class="alert alert-warning">
	<button class="close" type="button" data-dismiss="alert">
		<span>×</span>
	</button>
	<p>警告：您的浏览器不支持！</p>
</div>
```

- 添加淡入淡出效果   `<div class="alert alert-warning fade in">`

- 如果用 `JavaScript`，可以代替 `data-dismiss="alert"`
- `Alert` 插件中的方法：

```javascript
   $('.close').on('click', function () {
        $('#alert').alert('close');
   })
```

- `Alert` 插件中的事件：
   - `close.bs.alert`   当 `close` 方法被调用后立即触发
   - `closed.bs.alert`  当警告框被完全关闭后立即触发

```javascript
   $('#alert').on('close.bs.alert', function () {
        alert('当 close 方法被触发时调用！');
   });
```

**标签页**


- 标签页也就是通常所说的选项卡功能

```html
   //基本用法
   <ul class="nav nav-tabs">
        <li class="active"><a href="#html5" data-toggle="tab">HTML5</a></li>
        <li><a href="#bootstrap" data-toggle="tab">Bootstrap</a></li>
        <li><a href="#jquery" data-toggle="tab">jQuery</a></li>
        <li><a href="#extjs" data-toggle="tab">ExtJS</a></li>
   </ul>
   <div class="tab-content" style="padding: 10px;">
        <div class="tab-pane active" id="html5">...</div>
        <div class="tab-pane" id="bootstrap">...</div>
        <div class="tab-pane" id="jquery">...</div>
        <div class="tab-pane" id="extjs">...</div>
   </div>
```

- 可以设置淡入淡出效果 fade，而 in 表示首选的内容默认显示

```html
<div class="tab-pane fade in active" id="html5">
```

- 也可以换成胶囊式

```html
   <ul class="nav nav-pills">
```
- `data-target`    使用 `data-target` 绑定或不绑定效果都是一样的

- `Tab` 插件中的方法：

```javascript
   $('#nav a').on('click', function (e) {
        e.preventDefault();
        $(this).tab('show');
   });
```

- `Tab` 插件中的事件：
   - `show.bs.tab`      在调用 `tab` 方法时触发
   - `shown.bs.tab`     在显示整个标签时触发

```javascript
   $('#nav a').on('show.bs.tab', function () {
        alert('调用 tab 时触发！');
   });
```

**工具提示**

- 工具提示就是通过鼠标移动选定在特定的元素上时，显示相关的提示语

```html
   //基本实例
   <a href="#" data-toggle="tooltip" title="超文本标识符">HTML5</a>
```

- `JavaScript` 初始化 ` $('#section').tooltip();`

- `data-animation`   默认 `true`，在 `tooltip` 上应用一个 `CSS fade` 动画。 如果设置 `false`，则不应用。
- `data-html `       默认 `false`，不允许提示内容格式为 `html`。如果设置 为 `true`，则可以设置 `html` 格式的提示内容。
- `data-placement`   默认值 `top`，还有 `bottom`、`left`、`right` 和 `auto`。 如果`auto`会自行调整合适的位置，如果是`auto` `left` 则会尽量在左边显示，但左边不行就靠右边。
- `data-selector`    默认 `false`，可以选择绑定指定的选择器。 `rel="tooltip"`
- `data-original-title` 默认空字符串，提示语的内容。优先级比 title 低
- `title `           默认字空符串，提示语的内容。
- `data-trigger`     默认值 `hover` `foucs`，表示怎么触发 `tooltip`，其 他值为：`click`、`manual`。多个值用空格隔开，`manual` 手动不能和其他同时设置。
- `data-delay`       默认值 `0`，延迟触发 `tooltip(毫秒)`，如果传数字则， 表示 `show`/`hide` 的毫秒数，如果传对象，结构为：`{   show:500,hide:100   }`
- `data-containe`r   默认值 `false`，将` tooltip` 附加到特定的元素上。比 如组合按钮组提示，容器不够，可以附加 `body` 上。` container : 'body'`
- `data-template`    更改提示框的 `HTML` 提示语的模版，默认值为：

```html
<div class='tooltip'>
	<div class='tooltip-arrow'></div>
	<div class='tooltip-inner'></div>
</div>

<a href="#" rel="tooltip"
	data-toggle="tooltip"
	title="超文本标识符"
	data-animation="false"
	data-html="true"
	data-placement="auto"
	data-selector="a[rel=tooltip]"
	data-trigger="click"
	data-delay="500"
	data-template="<b>123</b>" >HTML5
</a>
```

```javascript
$('#selector a').tooltip({
	delay : {
		show : 500,
		hide : 100,
	},
});
```

- `Tooltip`插件中的方法：
  - 显示   `$('#section a').tooltip('show');`
  - 隐藏              `$('#section a').tooltip('hide');`
  - 反转显示和隐藏    `$('#section a').tooltip('toggle');`
  - 隐藏并销毁        `$('#section a').tooltip('destroy');`

- `Tooltip`插件中的事件：
  - `show.bs.tooltip`  在 `show` 方法调用时立即触发
  - `shown.bs.tooltip` 在提示框完全显示给用户之后触发
  - `hide.bs.tooltip`  在 `hide` 方法调用时立即触发
  - `hidden.bs.tooltip` 在提示框完全隐藏之后触发

```javascript
   $('#select a').on('show.bs.tooltip', function () {
        alert('调用 show 时触发！');
   });

   //data-selector
   $("#selector").tooltip({
        selector:"a[rel='tooltip']"
   });
```

- `data-container`

```html
   <div class="btn-group">
       <button class="btn btn-default" title="超文本标记符">left</button>
       <button class="btn btn-default" title="超文本标记符">middle</button>
       <button class="btn btn-default" title="超文本标记符">right</button>
   </div>
```

```javascript
   $("button").tooltip({
       delay:{
           show:500,
           hide:100
       },
       container:"body"
   });
```

#### 十一、下拉菜单、滚动监听、按钮和折叠插件
---

**下拉菜单插件**


```html
   <div class="dropdown">
       <button class="btn btn-primary" data-toggle="dropdown"> 下拉菜单 <span class="caret"></span> </button>
       <ul class="dropdown-menu">
           <li><a href="#">首页</a></li>
           <li><a href="#">产品</a></li>
           <li><a href="#">资讯</a></li>
           <li><a href="#">关于</a></li>
       </ul>
   </div>
```

- 如果按钮在容器外部，可以通过 `data-target` 进行绑定

```html
   <button class="btn btn-primary" id="btn" data-toggle="dropdown" data-target="#dropdown">
```

- `Dropdown`插件的方法：，但仍然需要 `data-*`
   - `$('#btn').dropdown();`
   - `$('#btn').dropdown('toggle');`

- `Dropdown`插件的事件：
   - `show.bs.dropdown `    在 `show` 方法调用时立即触发。
   - `shown.bs.dropdown `   在下拉菜单完全显示出来，并且等 `CSS` 动画完成之后 触发。
   - `hide.bs.dropdown`     在 `hide` 方法调用时，但还未关闭隐藏时触发。
   - `hidden.bs.dropdown`   在下拉菜单完全隐藏之后，并且等 `CSS` 动画完成之后 触发。

```javascript
   $('#dropdown').on('show.bs.dropdown', function () {
        alert('在调用 show 方法时立即触发！');
   });
```

**滚动监听插件**


- `data-offset`  默认值为 `10`，固定弄内容距滚动容器 `10` 像素以内， 就高亮显示所对应的菜单
- `data-spy `    设置 `scroll`，将设置滚动容器监听
- `data-target`  设置`#nav`，绑定指定监听的菜单

- `scroll`插件的方法：

```javascript
   $("#scroll").scrollspy({
        //offset: 0,
        target: "#nav"
   });
```

- `activate.bs.scrollspy`    每当一个新条目被激活后都将由滚动监听插件触 发此事件。
- 事件绑定在导航上

```javascript
   $('#nav').on('activate.bs.scrollspy', function () {
        alert('新条目被激活后触发此事件！');
   });
```

- 滚动监听还有一个更新容器 `DOM` 的方法
   - `refresh`  更新容器 `DOM` 的方法
   
```javascript
   function removeSec(e) {
       $(e).parents('.sec').remove();
       $('#content').scrollspy('refresh');
   }
```

**按钮插件**


- 单个切换

```html
   <button class="btn btn-primary" data-toggle="button" autocomplete="off">单个切换</button>
```

- 注：在 `Firefox` 多次页面加载时，按钮可能保持表单的禁用或选择状态。解决方案是： 添加` autocomplete="off"。`

- 单选按钮

```html
<div class="btn-group" data-toggle="buttons">
   <label for="" class="btn btn-primary active">
		<input type="radio" name="sex" autocomplete="off" checked> 男
   </label>
   <label for="" class="btn btn-primary">
		<input type="radio" name="sex" autocomplete="off"> 女
   </label>
</div>

```

- 复选按钮

```html
<div class="btn-group" data-toggle="buttons">
   <label for="" class="btn btn-primary active">
		<input type="checkbox" name="fa" autocomplete="off" checked> 音乐
   </label>
   <label for="" class="btn btn-primary">
		<input type="checkbox" name="fa" autocomplete="off"> 体育
   </label>
   <label for="" class="btn btn-primary">
		<input type="checkbox" name="fa" autocomplete="off"> 美术
   </label>
   <label for="" class="btn btn-primary">
		<input type="checkbox" name="fa" autocomplete="off"> 电脑
   </label>
</div>
```

- 加载状态

```html
   <button id="myButton" type="button" data-loading-text="Loading..." class="btn btn-primary" autocomplete="off"> 加载状态 </button>

```

```javascript
   $('#myButton').on('click', function () {
        var btn = $(this).button('loading');
        setTimeout(function () {
            btn.button('reset');
        }, 1000);
   });
```

- `Button` 插件中的 `button` 方法中有三个参数：`toggle`、`reset`、`string`(比如 `loading`、 `complete`)。
- 可代替    `data-toggle="button"`

```javascript
   $('button').on('click', function () {
        $(this).button('toggle');
   });
```

**折叠插件**


- 基本实例

```html
   <button class="btn btn-primary" data-toggle="collapse" data-target="#content"> Bootstrap </button>
   <div class="collapse" id="content">
        <div class="well">
            Bootstrap 是 Twitter 推出的一个用于前端开发的开源工具包。它由 Twitter 的设计师 Mark Otto 和 Jacob Thornton 合作开发,是一个 CSS/HTML 框架。目 前,Bootstrap 最新版本为 3.0 。
        </div>
   </div>
```

- `Collapse`插件的方法：`hide`、`show`、`toggle`

```javascript
   $('button').on('click', function () {
        $('#collapseOne').collapse('toggle');
   });
```

- `Collapse`插件的事件：
  - `show.bs.collapse`     在 `show` 方法调用时立即触发
  - `shown.bs.collapse `   折叠区完全显示出来是触发
  - `hide.bs.collapse `    在 `hide` 方法调用时触发
  - `hidden.bs.collapse`   该事件在折叠区域完全隐藏之后触发
  

#### 十二、模态框、轮播插件
  ---
  
  **模态框插件**


- 模态框的弹窗组件需要三层 `div` 容器元素，分别为 `modal`(模态声明层)、 `dialog`(窗口声明层)、`content`(内容层)
- 在内容层里面，还有三层，分别为 `header`(头部)、`body`(主体)、`footer`(注脚)
- 模态框去掉 `show`，增加一个 `id`

```html
   <div class="modal" id="myModal">
   <!-- 点击触发模态框显示 -->
   <button class="btn btn-primary btn-lg" data-toggle="modal" data-target="#myModal"> 点击弹窗 </button>
   <!-- 弹窗的大小有三种，默认情况下是正常，还有 lg(大)和 sm(小) -->
   <div class="modal-dialog modal-lg">
   <div class="modal-dialog sm-lg">
   <!-- 可设置淡入淡出效果 -->
   <div class="modal fade" id="myModal">
```

- 所有的插件，都是基于 `JavaScript`/`jQuery` 的。
- 四个要素：用法、参数、方法和事件。

- **用法**
  - 可以通过 `data` 属性 `data-toggle`  `data-toggle="modal"`  `data-target="#myModal"`
  - `data-toggle` 表示触发类型
  - `data-target` 表示触发的节点
  - 如果不是使用`<button>`，而是`<a>`，其中 `data-target` 也可以使用 `href="#myModal"`取代
  - 建议使用 `data-target`。除了 `data-toggle` 和 `data-target` 两个声明 属性外，还有一些可以用选项

- **参数**
   - `data-backdrop`    布尔值或 `'static'`   默认值 `true`，表示背景存在黑灰透明 遮罩，且单击空白背景可关闭弹窗；
   - 如果为 `false`，表示背景不存在黑灰 透明遮罩，且点击空白背景不可关闭 弹窗；
   - 如果是字符串`'static'`，表示背景存 在黑灰透明遮罩，且点击空白不可关 闭弹窗。
   - `data-keyboard`   布尔值 `true`   如果是 `true`，按 `esc` 键会关闭窗口； 如果是 `false`，按 `esc` 键会不会关闭。
   - `data-show`   布尔值 `true`   如果是 `true`，初始化时，默认显示； 如果是 `false`，初始化时，默认隐藏。
   - `remote`   `url` 路径 空值   如果值不是以`#`号开头，则表示一个 `url` 地址，加载 `url` 内容到 `modal-content` 容器里，并只加载一 次。
   - 如果是`#`号，就是取代 `data-target` 的方法。
   - 在 `JavaScript` 直接设置
   - 通过 `jQuery` 方式声明

```javascript
   $('#myModal').modal({
        show : true,
        backdrop : false,
        keyboard : false,
        remote : 'index.html'
   });
```

- **方法**
  - `toggle .modal('toggle')`; 触发时，反转切换弹窗状态
  - `show .modal('show')`; 触发时，显示弹窗
  - `hide .modal('hide')`; 触发时，关闭弹窗
  - 点击显示弹窗
```javascript
$('#btn').on('click', function () {
	$('#myModal').modal('show');
});
$('#myModal').modal({
	   show : false,
});
```

**事件**


- `show.bs.modal`    在`show` 方法调用时立即触发。
- `shown.bs.modal`  在模态框完全显示出来，并且等 `CSS` 动画完成之后触 发。
- `hide.bs.modal`    在 `hide` 方法调用时，但还未关闭隐藏时触发。
- `hidden.bs.modal`  在模态框完全隐藏之后，并且等 `CSS` 动画完成之后触 发

```javascript
$('#myModal').on('show.bs.modal', function () {
	alert('在 show 方法调用时立即触发！');
});
$('#myModal').on('loaded.bs.modal', function () {
	alert('远程数据加载完毕后触发！');
});
```

**轮播图插件**


- `data` 属性解释：
  - `data-slide` 接受关键字 `prev` 或 `next`，用来改变幻灯片相对于当前位置的位置；
  - `data-slide-to` 来向轮播底部创建一个原始滑动索引，`data-slide-to="2"`将把滑 动块移动到一个特定的索引，索引从 0 开始计数。
  - `data-ride="carousel"`属性用户标记轮播在页面加载时开始动画播放。
  - `data-interval `   默认值 `5000`，幻灯片的等待时间(毫秒)。如果为 `false`，轮播将不会自动开始循环。
  - `data-pause`       默认鼠标停留在幻灯片区域(`hover`)即暂停轮播，鼠 标离开即启动轮播。
  - `data-wrap`        默认值 `true`，轮播是否持续循环。
  - 如果在 `JavaScript` 调用就直接使用键值对方法，并去掉 `data-`；

```javascript
   $('#myCarousel').carousel({  //设置自定义属性
        interval : 2000,//设置自动播放`/2` 秒
        pause : 'hover',//设置暂停按钮的事件
        wrap : false,   //只播一次
   });
```

- **方法：**
   - `cycle` 循环各帧(默认从左到右)
   - `pause` 停止轮播
   - `number` 轮播到指定的图片上(小标从 `0` 开始，类似数组)
   - `prev` 循环轮播到上一个项目
   - `next` 循环轮播到下一个项目

```javascript
   $('button').on('click', function () {//点击按钮执行
        $('#myCarousel').carousel('cycle'); //点击后，自动播放
   }
```

- **事件**

- `slide.bs.carousel` 当调用 `slide` 实例方式时立即触发该事件。
- `slid.bs.carousel` 当轮播完成一个幻灯片触发该事件

```javascript
$('#myCarousel').on('slide.bs.carousel', function () {
        alert('当调用 slide 实例方式时立即触发');
   });
$('#myCarousel').on('slid.bs.carousel', function () {
	alert('当轮播完成一个幻灯片触发');
});
```
- bootstrap笔记总结【复制到浏览器打开放大】
![bootstrap笔记总结](http://upload-images.jianshu.io/upload_images/1480597-0b43991d33718f5d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


#### 拓展阅读
---

- [bootstrap中文教程](http://v3.bootcss.com/)
- [bootstrap很方便的速查表-推荐](https://hackerthemes.com/bootstrap-cheatsheet/)