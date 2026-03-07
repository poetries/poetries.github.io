---
title: MVC、MVP、MVVM之间的关系
date: 2016-12-13 14:35:24
tags: MVC
categories: Front-End
---

## 一、MVC
---


### 什么是MVC
---

- MVC是一种模式，它将应用分为3个部分：数据（模型）、表现层（视图）、用户交互层（控制器）
- 一个事件的处理大概是这样
  - 用户和应用产生交互
  - 控制器的事件处理器被触发
  - 控制器从模型中请求数据，并将其交给视图
  - 视图将数据呈现给用户

<!--more-->
  
### 模型（数据保存）
---

- 模型用来存放用户的所有数据对象。比如有一个user模型，用来存放用户列表、他们的属性以及所有和模型有关的逻辑
- 模型不必知晓视图和控制器的细节，模型只需包含数据以及直接和这些数据相关的逻辑

### 视图（用户界面）
---

- 视图是呈现给用户的，用户与之产生交互。在JavaScript应用中，视图大都是由HTML、css、JavaScript模板组成的

### 控制器（业务逻辑）
---

- 控制器是模型和视图之间的纽带。控制器从视图获得事件和输入，对它们进行进行处理，并相应的更新视图。
- 当页面加载时，控制器会给视图添加事件监听，比如监听表单提交或按钮点击。然后当用户和你的应用产生交互时，控制器中的事件触发器就开始工作了



### 总结一下：
---

- `Controller` 监听 `Model` 变化，`Model` 一变，`Controller` 就会去更新` View`。
- `Controller` 监听用户交互，用户点了提交或修改按钮，Controller 就要去更新 Model

- `View` 传送指令到 `Controller`
- `Controller` 完成业务逻辑后，要求 `Model` 改变状态
- `Model` 将新的数据发送到 `View`，用户得到反馈

各部分之间的通信方式

![](http://image.beekka.com/blog/2015/bg2015020105.png)

## 互动模式
---

- 接受用户指令时，MVC 可以分成两种方式。一种是通过 View 接受指令，传递给 Controller

![](http://image.beekka.com/blog/2015/bg2015020106.png)

- 另一种是直接通过controller接受指令

![](http://image.beekka.com/blog/2015/bg2015020107.png)


## 二、MVP
---

- ` MVP` 模式将 `Controller 改名为 `Presenter`，同时改变了通信方向

![](http://image.beekka.com/blog/2015/bg2015020109.png)

- 各部分之间的通信，都是双向的。
- `View` 与` Model` 不发生联系，都通过 `Presenter` 传递。
- `View` 非常薄，不部署任何业务逻辑，称为"被动视图"（Passive View），即没有任何主动性，而 Presenter非常厚，所有逻辑都部署在那里

## 三、MVVM
---

- `MVVM` 模式将 `Presenter` 改名为 `ViewModel`，基本上与 `MVP` 模式完全一致
- 唯一的区别是，它采用双向绑定（data-binding）：`View`的变动，自动反映在 `ViewModel`，反之亦然

![](http://image.beekka.com/blog/2015/bg2015020110.png)

