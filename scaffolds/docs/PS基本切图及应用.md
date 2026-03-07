---
title: PS基本切图及应用
date: 2016-08-08 15:30:43
tags: PS
categories: Designed
---

之前一直用别人切好的页面，心中很是惭愧，为不在麻烦于他人，还是重新打开很久没用过得PS，学习了一下如何切页面，顺便整理一下近期学到的PS切图的基本方法。

美工一般只提供设计稿，那么问题来了，我们如何把设计稿切成自己想要的图片呢，今天我们来简单学习一下如何切图：
<!--more-->
切图我们一般只切两种类型的图片，JPG图片和icon图表。重点还是在icon上。 

#### PS环境配置

- ps中用到的快捷键：
  - 放大：`z`
  - 缩小：`Ctrl+alt+空格+鼠标点击`
  - 切片：`c`
  - 移动：`v`
  - 拖动：`空格+鼠标拖动`'
  - 撤销：`Ctrl+z ctrl+alt+z`
  - 保存：`Ctrl+shift+Alt+s`
- 配置工作环境：

![](http://7xq6al.com1.z0.glb.clouddn.com/ps1.png)

---

#### 基本图片的切法

![](http://7xq6al.com1.z0.glb.clouddn.com/ps2.png)

![](http://7xq6al.com1.z0.glb.clouddn.com/ps3.png)

![](http://7xq6al.com1.z0.glb.clouddn.com/ps4.png)

![](http://7xq6al.com1.z0.glb.clouddn.com/ps5.png)

#### icon图标切法


![](http://7xq6al.com1.z0.glb.clouddn.com/ps6.png)

![](http://7xq6al.com1.z0.glb.clouddn.com/ps7.png)

![](http://7xq6al.com1.z0.glb.clouddn.com/ps8.png)

![](http://7xq6al.com1.z0.glb.clouddn.com/ps9.png)

![](http://7xq6al.com1.z0.glb.clouddn.com/ps10.png)

![](http://7xq6al.com1.z0.glb.clouddn.com/ps11.png)

![](http://7xq6al.com1.z0.glb.clouddn.com/ps12.png)

---

#### 图片在网页中的定位

```css
			*{
				margin:0;
				padding:0;
			}
			html,body{
				width:100%;
				height:100%;
			}
			.tb{background-image:url("icon.png");background-repeat:no-repeat;display:block;}
			.icon{
				width:28px;
				height:28px;
				background-position:-28px 0px;
			}
			.icon1{
				width:38px;
				height:38px;
				background-position:-39px -27px;
			}
 ```
 
 ```html
 <span class="icon tb"></span>	
<span class="icon1 tb"></span>
```

---


这里介两种图片的定位方法

- 方法一：通过浏览器的插件定位图片的具体位置

![](http://7xq6al.com1.z0.glb.clouddn.com/ps13.png)

- 方法二：在ps原稿中测量图片的位置

![](http://7xq6al.com1.z0.glb.clouddn.com/ps14.png)


（完）



