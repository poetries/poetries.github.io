---
title: React之Redux原理
date: 2018-12-20 18:30:24
tags: 
  - React
  - Javascript
categories: Front-End
---

## 一、Redux设计理念

> `Redux`是将整个应用状态存储到一个地方上称为`store,`里面保存着一个状态树`store tree`,组件可以派发(`dispatch`)行为(`action`)给`store`,而不是直接通知其他组件，组件内部通过订阅`store`中的状态`state`来刷新自己的视图

![](https://poetries1.gitee.io/img-repo/2019/10/428.png)

### 1.1 Redux三大原则

**唯一数据源**

> 整个应用的`state`都被存储到一个状态树里面，并且这个状态树，只存在于唯一的`store`中

**保持只读状态**

> `state`是只读的，唯一改变`state`的方法就是触发`action`，`action`是一个用于描述以发生时间的普通对象


**数据改变只能通过纯函数来执行**

> 使用纯函数来执行修改，为了描述`action`如何改变`state`的，你需要编写`reducers`

## 二、实现一个迷你版的redux

> http://blog.poetries.top/2018/07/23/react-redux/

## 三、redux源码分析

> http://blog.poetries.top/2017/11/19/redux-study-source-code-analysis/
