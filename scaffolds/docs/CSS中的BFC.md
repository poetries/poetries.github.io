---
title: CSS中的BFC
date: 2016-09-07 18:20:08
tags: CSS
categories: Front-End
---

### BFC 是什么？

- `BFC` (`Block Formatting Contexts`) 即块级格式化上下文，从样式上看，它与普通的容器没有什么区别，但是从功能上，`BFC` 可以看作是隔离了的独立容器，容器里面的元素不会在布局上影响到外面的元素，并且 `BFC` 具有普通容器没有的一些特性，例如可以包含浮动元素，使到它可以包含浮动元素，从而防止出现高度塌陷的问题
<!--more-->
---

### 如何触发 BFC

- 触发 BFC 的条件
    - 浮动元素，`float` 除 `none` 以外的值
    - 绝对定位元素，`position`（`absolute`，`fixed`）
    - `display` 为以下其中之一的值 `inline-blocks`，`table-cells`，`table-captions`
    - `overflow` 除了 `visible` 以外的值（`hidden`，`auto`，`scroll`）
 
 - 在 `CSS3` 中，`BFC` 叫做` Flow Root`，并增加了一些触发条件：
    - `display` 的 `table-caption` 值
    - `position` 的 `fixed` 值，其实 `fixed` 是 `absolute` 的一个子类，因此在 `CSS2.1` 中使用这个值也会触发 `BFC` ，只是在` CSS3` 中更加明确了这一点

---

### BFC布局规则

- 内部的`Box`会在垂直方向，一个接一个地放置。
- `Box`垂直方向的距离由`margin`决定。属于同一个`BFC`的两个相邻`Box`的`margin`会发生重叠
- 每个元素的`margin box`的左边， 与包含块`border box`的左边相接触(对于从左往右的格式化，否则相反)。即使存在浮动也是如 此。
- `BFC`的区域不会与`float box`重叠。
- `BFC`就是页面上的一个隔离的独立容器，容器里面的子元素不会影响到外面的元素。反之也如此。
- 计算`BFC`的高度时，浮动元素也参与计算

---

### BFC的作用及原理

- **自适应两栏布局**

```css
 body {
        width: 300px;
        position: relative;
    }
    .aside {
        width: 100px;
        height: 150px;
        float: left;
        background: #f66;
    }
    .main {
        height: 200px;
        background: #fcc;
    }
```
```html
  <body>
        <div class="aside"></div>
        <div class="main"></div>
 </body>
```
![](http://p1.qhimg.com/d/inn/4055c62a/4dca44a927d4c1ffc30e3ae5f53a0b79.png)

- 根据BFC布局规则第3条：
    - 每个元素的`margin box`的左边， 与包含块`border box`的左边相接触(对于从左往右的格式化，否则相反)。即使存在浮动也是如此。
- 因此，虽然存在浮动的元素`aslide`，但`main`的左边依然会与包含块的左边相接触
- 根据`BFC`布局规则第四条：
  - `BFC`的区域不会与`float box`重叠

- 我们可以通过通过触发`main`生成`BFC`， 来实现自适应两栏布局

```css
.main {
    overflow: hidden;
}
```
- 当触发`main`生成`BFC`后，这个新的`BFC`不会与浮动的`aside`重叠。因此会根据包含块的宽度，和`aside`的宽度，自动变窄。效果如下：

![](http://p6.qhimg.com/t01077886a9706cb26b.png)

- **清除内部浮动**

```css
.par {
    border: 5px solid #fcc;
    width: 300px;
 }

.child {
    border: 5px solid #f66;
    width: 100px;
    height: 100px;
    float: left;
}
```
```html
<body>
    <div class="par">
        <div class="child"></div>
        <div class="child"></div>
    </div>
</body>
```

![](http://p1.qhimg.com/t016035b58195e7909a.png)

- 根据`BFC`布局规则第六条：
  - 计算`BFC`的高度时，浮动元素也参与计算
- 为达到清除内部浮动，我们可以触发`par`生成`BFC`，那么`par`在计算高度时，`par`内部的浮动元素`child`也会参与计算

```css
.par {
    overflow: hidden;
}
```
![](http://p2.qhimg.com/t016bbbe5236ef1ffd5.png)

- **防止垂直 margin 重叠**

```css
    p {
        color: #f55;
        background: #fcc;
        width: 200px;
        line-height: 100px;
        text-align: center;
        margin: 100px;
    }
```

```html
    <p>Haha</p>
    <p>Hehe</p>
 ```
 
 ![](http://p5.qhimg.com/t01b47b8b7d153c07cc.png)
 
 - 两个`p`之间的距离为`100px`，发送了`margin`重叠
 - 根据BFC布局规则第二条：
     - `Box`垂直方向的距离由`margin`决定。属于同一个`BFC`的两个相邻Box的`margin`会发生重叠
 - 我们可以在`p`外面包裹一层容器，并触发该容器生成一个`BFC`。那么两个`P`便不属于同一个`BFC`，就不会发生`margin`重叠了

```css
    .wrap {
        overflow: hidden;
    }
    p {
        color: #f55;
        background: #fcc;
        width: 200px;
        line-height: 100px;
        text-align: center;
        margin: 100px;
    }
```
```html
    <p>Haha</p>
    <div class="wrap">
        <p>Hehe</p>
    </div>
```

![](http://p3.qhimg.com/t0118d1d2badbb00521.png)

---

### 总结

- 其实以上的几个例子都体现了`BFC`布局规则第五条
   - `BFC`就是页面上的一个隔离的独立容器，容器里面的子元素不会影响到外面的元素。反之也如此
- 因为`BFC`内部的元素和外部的元素绝对不会互相影响，因此， 当`BFC`外部存在浮动时，它不应该影响`BFC`内部`Box`的布局，`BFC`会通过变窄，而不与浮动有重叠。同样的，当`BFC`内部有浮动时，为了不影响外部元素的布局，`BFC`计算高度时会包括浮动的高度。避免`margin`重叠也是这样的一个道理

