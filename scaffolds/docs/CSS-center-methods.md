---
title: 居中解决方案荟萃
date: 2016-11-12 17:55:24
tags: 
    - CSS
    - 居中
categories: Front-End
---



### 水平居中方案
---

#### 方案一：`text-align +  inline-block`
---

```html
<div id="parent1">
	<div class="child">水平居中</div>
</div>
```

```css
#parent1{
	text-align: center;
	background:#ddd;
	margin-bottom:20px;
}
#parent1 .child{
	display: inline-block;
	background:#666;
	color:#fff;
}


```
<!--more-->

#### 方案二：`margin：0 auto`
---

```html
<div id="parent2">
	<div class="child">水平居中</div>
</div>
```

```css
#parent2{
	text-align: center;
	background:#ddd;
	margin-bottom:20px;
}
#parent2 .child{
	display: table;
	margin: 0 auto;
	background:#666;
	color:#fff;
}


```

#### 方案三：`absolute+transform)`
---

```html
<div id="parent3">
	<div class="child">水平居中</div>
</div>
```

```css
#parent3{
	position: relative;
	background:#ddd;
	margin-bottom:20px;
}
#parent3 .child{
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	background:#666;
	color:#fff;
}


```
#### 方案四：`justify-content`
---

```html
<div id="parent4">
	<div class="child">水平居中</div>
</div>
```

```css
#parent4{
	display: flex;
	justify-content: center;
	background:#ddd;
	margin-bottom:20px;
}
#parent4 .child{
	margin:0 auto;
	background:#666;
	color:#fff;
}

```

### 垂直居中方案
---

#### 方案一： 利用 line-height 实现垂直居中
---

- 这种方法适用于单行文本垂直居中,如果文本内容太长，出现了换行，换行后的内容会溢出

```html
<div id="example1">
    单行文字垂直居中
</div>
```

```css
#example1 {
    height: 100px;
    line-height: 100px;
    background: #161616;
    color: #fff;
    width: 200px;
}
```

#### 方案二 利用 display: table 实现垂直居中
---

```html
<div id="example2">
    <div class="inner">块区域垂直居中</div>
</div>
```
```css
#example2 {
    height: 100px;
    background: #161616;
    color: #fff;
    width: 400px;
    overflow: hidden;
    display: table;
			margin-bottom:20px;
}
#example2 .inner{
    display: table-cell;
    vertical-align: middle;
    height: 50px;
    background:#999;
}
```

#### 方案三 margin 填充 这种方法需要知道内外容器的大小
---

```html
<div id="example3">
    <div class="inner">块区域垂直居中</div>
</div>
```

```css
#example3 {
    height: 100px;
    background: #161616;
    color: #fff;
    width: 400px;
    overflow: hidden;
			margin-bottom:20px;
}
#example3 .inner{
    margin-left: auto;
    margin-right: auto;
    margin-top: calc((100px - 50px)/2);
    height: 50px;
    background:#999;
}
```

#### 方案四：经典 absolute 布局上下文垂直居中
---

```html
<div id="example4">
    <div class="inner">块区域垂直居中</div>
</div>
```

```css
#example4 {
    width: 400px;
    height: 100px;
    background: #161616;
    color: #fff;
    position: relative;
		margin-bottom:20px;
}
#example4 .inner{
    height: 50px;
    width: 200px;
    position: absolute;
    left: 50%;
    top: 50%;
    margin-top: -25px;
    margin-left: -100px;
    background:#999;
}
```
#### 方案五：absolute+transform
---

```html
<div id="example5">
    <div class="inner">块区域垂直居中</div>
</div>
```

```css
#example5 {
    width: 400px;
    height: 100px;
    background: #161616;
    color: #fff;
    position: relative;
	margin-bottom:20px;
}
#example5 .inner{
    position: absolute;
    left: 50%;
    top: 50%;
    background: #999;
    transform: translateX(-50%) translateY(-50%);
}
```

#### 方案六 利用margin：auto 居中
---

```html
<div id="expample6">
    <div class="inner">Content here</div>
</div>
```

```css
#expample6 {
    width: 400px;
    height: 100px;
    background: #eee;
    position: relative;
		margin-bottom:20px;
}

#expample6 .inner {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    margin: auto;
    height: 50px;
    width: 70%;
    background: #aaa;
    color:#222;
}

```


#### 方案七 利用 Flex布局 居中
---

```html
<div id="expample7">
    <div class="inner">Content here</div>
</div>
```

```css
#expample7 {
    width: 400px;
    height: 100px;
    background: #eee;
    display: flex;
    justify-content: center;
    align-items: center;
}

#expample7 .inner {
    height: 50px;
    width: 70%;
    background: #aaa;
    color:#222;
}
```

