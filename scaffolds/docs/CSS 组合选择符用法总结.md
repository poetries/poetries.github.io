---
title: CSS 组合选择符用法总结
date: 2016-09-04 16:50:32
tags: CSS
categories: Front-End
---

### 组合选择符基本介绍
---
<!--more-->
- 组合选择符说明了两个选择器直接的关系
- `CSS`组合选择符包括各种简单选择符的组合方式
- 在 `CSS3` 中包含了四种组合方式
    - 后代选取器(以空格分隔)
    - 子元素选择器(以大于号分隔）
    - 相邻兄弟选择器（以加号分隔）
    - 普通兄弟选择器（以破折号分隔）



### 后代选取器
---

- 后代选取器匹配所有值得元素的后代元素
    
- 实例：
    
```html
<div>
  <p>我是通过后代选择器选择的元素</p>
  <h1>002</h1>
  <p>我是通过后代选择器选择的元素</p>
</div>	
```

```css
div p{
    background:red;
}
```

效果：

![](http://7xq6al.com1.z0.glb.clouddn.com/%E5%90%8E%E4%BB%A3%E9%80%89%E6%8B%A9%E5%99%A8.png)


### 子元素选择器
---

- 如果您不希望选择任意的后代元素，而是希望缩小范围，只选择某个元素的子元素，请使用子元素选择器

- `html`代码的文档树结构如图

![](http://7xq6al.com1.z0.glb.clouddn.com/div.png)

```html
<div class="mainDiv">
    我是主DIV
    <div class="son">儿子
        <div class="sunzi">孙子</div>
    </div>
</div>
```

```css
.mainDiv{
	background:yellow;
	width:100px;
	height:100px;
}
.sunzi{
	background:red;
	width:40px;
	height:40px;
}
.mainDiv > div{background:green;}
```

![](http://7xq6al.com1.z0.glb.clouddn.com/%E5%AD%90%E4%BB%A3.png)

- 然后我们去掉子代选择器，添加一个后代选择器

```css
.mainDiv div{
            background-color: red;
        }
```

效果

![](http://7xq6al.com1.z0.glb.clouddn.com/%E5%90%8E%E4%BB%A31.png)


- 经过上面的结果展示，我们能得到结论:子代选择器~ 和后代选择（空格）的区别：
    - 子代选择器：只对应用对象的直接相应子节点有效。如实例代码中的儿子`div`
    - 后代选择器：对应用对象内的所有相应子节点都有效。如实例中的儿子`div`和孙子`div`



### 相邻兄弟选择器
---

- 相邻兄弟选择器可选择紧接在另一元素后的元素，且二者有相同父元素
- 以下实例选取了所有位于 `<div>` 元素后的第一个 `<p>` 元素
    
```html
<div>
	<p>001</p>
	<h1>002</h1>
	<p>003</p>
</div>	
<p>我是通过相邻兄弟选择器选择的元素</p>

```

```css
div + p{background:red;}
```

效果：

![](http://7xq6al.com1.z0.glb.clouddn.com/%E7%9B%B8%E9%82%BB%E5%85%84%E5%BC%9F%E9%80%89%E6%8B%A9%E5%99%A8.png)


### 普通相邻兄弟选择器
---

- 普通兄弟选择器选取所有指定元素的相邻兄弟元素
  
```html
<div>
  <p>001</p>
  <h1>002</h1>
  <p>003</p>
</div>	
<p>我是普通相邻兄弟选择器~选择的</p>
<p>我是普通相邻兄弟选择器~选择的</p>
<p>我是普通相邻兄弟选择器~选择的</p>
```

```css
div ~ p{background:red;}
```

效果

![](http://7xq6al.com1.z0.glb.clouddn.com/%E6%99%AE%E9%80%9A%E7%9B%B8%E9%82%BB%E5%85%84%E5%BC%9F%E9%80%89%E6%8B%A9%E5%99%A8.png)
