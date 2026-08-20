---
title: jQuery动画基础（四）
date: 2016-08-07 21:10:08
tags: jQuery
categories: Front-End
---

**介绍`jQuery`动画**
- `JavaScript`语言本身不支持动画设计，必须通过改变`CSS来实现动画效果。
<!--more-->
### 显隐

- **显隐动画**

  - `show()`:显示
	- `show()`从上到下增加元素的高度，从左到右增加元素宽度，从0到1增加透明度，直至内容完全可见

  - `hide()`:隐藏
    - `hide()`通过改变元素的高度宽度和不透明度，直到这三个属性值到0
	
  - **参数**：
	- `show()`
	- `show(speed,callback)`
	
      - `speed:` 字符串或数字，表示动画将运行多久（`slow=0.6/normal=0.4/fast=0.2`）
      - `callback:` 动画完成时执行的方法

  - 显示和隐藏式一对密不可分的动画形式。

- **显隐切换**

  - `toggle()`:切换元素的可见状态

    - 原理：匹配元素的宽度、高度以及不透明度，同时进行动画，隐藏动画后将`display`设置为`none`

    - **参数：**
	  - `toggle(speed)`
	  - `toggle(speed,callback)`
	  - `toggle(boolean)`

		- `speed:` 字符串或数字，表示动画将运行多久（`slow=0.6/normal=0.4/fast=0.2`）
		- `easing：` 使用哪个缓冲函数来过渡的字符串(`linear/swing`)
		- `callback：` 动画完成时执行的方法
		- `boolean:true`为显示 `false`为隐藏

### 滑动

- **显隐滑动效果**
	- `slideDown():`滑动隐藏
	- `slidUp():`滑动显示
	
	- **参数:**
	  - `slideDown(speed,callback)`
	  - `slidUp(speed,callback)`

- **显隐切换滑动**
	- `slideToggle():`显隐滑动切换

	- **参数:**
	  - `slidUp(speed,callback)`

### 渐变：通过改变不透明度

- **淡入淡出**
	- `fadeIn()`
	- `fadeOut()`

	- **参数**
		- fadeIn(speed,callback)
		- fadeOut(speed,callback)

- **设置淡出透明效果**
	- `fadeTo()`⁭：以渐进的方式调整到指定透明度

	- **参数**：
	  - `fadeTo(speed,opacity,callback)`

- **渐变切换**:
	- 结合`fadeIn`和`fadeOut`
	- `fadeToggle()`

	- **参数:**
	  - `fadeOut(speed,callback)`

### 自定义：

- 自定义动画：`animate()`	

- 用`animate`模拟`show()`:
	- `show:` 表示由透明到不透明
	- `toggle:` 切换
	- `hide:`表示由显示到隐藏
