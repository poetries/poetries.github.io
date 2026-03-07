---
title: 学会使用box-sizingCSS布局
date: 2016-09-04 17:20:08
tags: CSS
categories: Front-End
---

### 盒子模型
<!--more-->
- 关于`CSS`重要的一个概念就是CSS盒子模型。它控制着页面这些元素的高度和宽度。盒子模型多少会让人产生一些困惑，尤其当涉及到高度和宽度计算的时候。真正盒子的宽度(在页面呈现出来的宽度)和高度，需要加上一些其它的属性，例如：
  - `padding` + `border` + `width `= 盒子的宽度
  - `padding `+ `border` + `height` = 盒子的高度
- 这看起来并不是那么直观，那么我们看一个图：

![](http://7xq6al.com1.z0.glb.clouddn.com/hezi.png)

- 这意味着，如果我们设置一个宽度为`200px`，而实际呈现的盒子的宽度可能会大于`200px`(除非没有左右边框和左右补白)。这可能看起来比较怪，`CSS`设置的宽度仅仅是内容区的宽度，而非盒子的宽度。同样，高度类似

- 这导致的直接结果是当我们希望页面呈现的盒子的宽度是200px的时候，我们需要减去它的左右边框和左右补白，然后设置为对应的CSS宽度。例如上图，我们设置希望盒子宽度为`200px`，则需要先减去左右补白各`20px`，左右边框各`1px`，然后设置对应的`CSS`宽度`158px`。


- 幸运的是，我们有更好的方法达到我们想要的目的


---

### box-sizing

- 语法：`box-sizing:`  `content-box` | `border-box` | `inherit`;

- 与上面不同的是，当你设置`box-sizing:border-box`以后，这就能达到你想要的目的。例如，上面我们想要一个宽度为`200px`的盒子，那么我们直接设置宽度为`200px`。是不是看起来清晰多了。当再设置它的左右边框和左右补白后，它的内容区会自动调整。这可能更直接和一目了然。`CSS`代码如下：

```css
div {
    box-sizing: border-box;
    width: 200px;
    padding: 20px;
    border: 1px solid #DDD;
}
 ```

![](http://7xq6al.com1.z0.glb.clouddn.com/hez2.png)

- 实际上，这更被设计者和开发者推崇

-  一些开发人员觉得`box-sizing`使用起来十分方便,所以他们主张通过通用选择器将这个属性应用于每个元素

- 但这样的观点未免有些偏激,而且还会导致不必要的困难,所以更好的方法是只在实际需要时才使用这个属性

```css
*{
     margin:0;
      padding:0;
     box-sizing:border-box;
}
```

- 写上 `box-sizing: border-box`; ，设置`padding `值 也不用担心没有减小宽度值而变形

---

### box-sizing其它的值

- `content-box` 
  - 描述：在宽度和高度之外绘制元素的内边距和边框。

![](http://7xq6al.com1.z0.glb.clouddn.com/box-size-1.jpg)

- `border-box`
  - 描述：为元素指定的任何内边距和边框都将在已设定的宽度和高度内进行绘制

![](http://7xq6al.com1.z0.glb.clouddn.com/box-size-2.jpg)

- `inherit`
  - 描述：继承 父元素 `box-sizing `属性的值 

---

### 浏览器兼容性

- `IE8`及以上版本支持该属性，`Firefox` 需要加上浏览器厂商前缀`-moz-，`对于低版本的`IOS`和`Android`浏览器也需要加上`-webkit-`。实际上，很多`reset.css`或者`normal.css`里都包含如下`CSS`语句，也是比较赞成的用法：

```css
*, *:before, *:after {
　　-moz-box-sizing: border-box;
　　-webkit-box-sizing: border-box;
　　box-sizing: border-box;
　　}
```

### box-sizing 布局三栏目案例

```css
div{
		height:700px;
		float:left;
}
div.left{
		width:25%;
		background:red;
}
div.cent{
		width:50%;
		box-sizing:border-box;/*可以改变元素以使其宽度包含填充*/
				/* 现在整个元素,包括填充在内,占页面总宽度的50%,所以元素的组合宽度为100%,这全程它们很好地适应于它们的容器.*/
		background:yellow;
		padding:0 20px;/*加了这个会使盒子内容溢出 但是box-sizing很好的自适应了*/
}
div.right{
       width:25%;
        background:blue;
}
```
```html
<div class="left"></div>
<div class="cent"></div>
<div class="right"></div>
```
- 效果

![](http://7xq6al.com1.z0.glb.clouddn.com/hh2.png)

![](http://7xq6al.com1.z0.glb.clouddn.com/hh1.png)
