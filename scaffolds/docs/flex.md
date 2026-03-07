---
title: 弹性布局总结
date: 2017-02-06 19:20:43
tags: 
   - 弹性布局
   - HTML5
categories: Front-End
---

> 可视化学习 http://cssreference.parryqiu.com/flexbox/

- **以下6个属性设置在容器上**
	- `flex-direction`
	- `flex-wrap`
	- `flex-flow`
	- `justify-content`
	- `align-items`
	- `align-content`
-  **属性详解**
	- `flex-direction: row` | `row-reverse` | `column` | `column-reverse`;
	- `flex-wrap: nowrap` | `wrap` | `wrap-reverse`;
	- `flex-flow`属性是`flex-direction`属性和`flex-wrap`属性的简写形式，默认值为`row nowrap`
	 -  `flex-flow: <flex-direction> || <flex-wrap>`;
	- `justify-content`属性定义了项目在主轴上的对齐方式。
	 - `justify-content: flex-start` | `flex-end` | `center` | `space-between` | `space-around`;
	- `align-items`属性定义项目在交叉轴上如何对齐。
	 - `align-items: flex-start` | `flex-end` | `center` | `baseline` | `stretch`;
	- `align-content`属性定义了多根轴线的对齐方式。如果项目只有一根轴线，该属性不起作用。
	 - `align-content: flex-start` | `flex-end` | `center` | `space-between` | `space-around` | `stretch`;

---

- **以下6个属性设置在项目上**
	- `order`
	- `flex-grow`
	- `flex-shrink`
	- `flex-basis`
	- `flex`
	- `align-self`

- **属性详解**
	- `order`属性定义项目的排列顺序。数值越小，排列越靠前，默认为`0`
	- `flex-grow`属性定义项目的放大比例，默认为`0`，即如果存在剩余空间，也不放大。
	- `flex-shrink`属性定义了项目的缩小比例，默认为`1`，即如果空间不足，该项目将缩小。
	- `flex-basis`属性定义了在分配多余空间之前，项目占据的主轴空间（main size）。浏览器根据这个属性，计算主轴是否有多余空间。它的默认值为`auto`，即项目的本来大小。
	- `flex`属性是`flex-grow`, `flex-shrink` 和 `flex-basis`的简写，默认值为`0 1 auto`。后两个属性可选。
	- `align-self`属性允许单个项目有与其他项目不一样的对齐方式，可覆盖`align-items`属性。默认值为`auto`，表示继承父元素的`align-items`属性，如果没有父元素，则等同于`stretch`。
	- `align-self: auto` | `flex-start` | `flex-end` | `center` | `baseline` | `stretch`;

---

- **图解flex布局**


![enter description here][1]


  [1]: http://7xq6al.com1.z0.glb.clouddn.com/0001.jpg
