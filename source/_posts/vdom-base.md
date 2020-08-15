---
title: 虚拟DOM（一）
date: 2018-10-20 22:12:12
tags: 
   - JavaScript
   - 虚拟DOM
categories: Front-End
---

## 一、什么是 vdom

- 用 `JS` 模拟 `DOM` 结构
- `DOM` 变化的对比，放在 `JS` 层来做
- 提高重绘性能


## 二、设计一个需求场景

![](https://poetries1.gitee.io/img-repo/2019/10/587.png)

**用jQuery实现**

![](https://poetries1.gitee.io/img-repo/2019/10/588.png)
![](https://poetries1.gitee.io/img-repo/2019/10/589.png)
![](https://poetries1.gitee.io/img-repo/2019/10/590.png)

**遇到的问题**

- DOM 操作是“昂贵”的，js 运行效率高
- 尽量减少 DOM 操作，而不是“推倒重来”
- 项目越复杂，影响就越严重
- vdom 即可解决这个问题

![](https://poetries1.gitee.io/img-repo/2019/10/591.png)

## 三、vdom 的如何应用，核心 API 是什么

**什么是 vdom**

![](https://poetries1.gitee.io/img-repo/2019/10/592.png)

**介绍 snabbdom**

![](https://poetries1.gitee.io/img-repo/2019/10/593.png)
![](https://poetries1.gitee.io/img-repo/2019/10/594.png)

**介绍 snabbdom - h 函数**

![](https://poetries1.gitee.io/img-repo/2019/10/595.png)

**介绍 snabbdom - patch 函数**

![](https://poetries1.gitee.io/img-repo/2019/10/596.png)

**重做jQuery的demo**

- 使用 `data `生成 `vnode`
- 第一次渲染，将 `vnode` 渲染到 `#container `中
- 并将 `vnode` 缓存下来
- 修改 `data` 之后，用新 `data` 生成 `newVnode`
- 将 `vnode` 和 `newVnode` 对比

![](https://poetries1.gitee.io/img-repo/2019/10/597.png)

**核心 API**

- `h(‘<标签名>’, {…属性…}, […子元素…])`
- ` h(‘<标签名>’, {…属性…}, ‘….’)`
- `patch(container, vnode) `
- `patch(vnode, newVnode) `

## 四、介绍一下 diff 算法

### 4.1 vdom 为何使用 diff 算法

- DOM 操作是“昂贵”的，因此尽量减少 DOM 操作
- 找出本次 DOM 必须更新的节点来更新，其他的不更新
- 这个“找出”的过程，就需要 diff 算法

![](https://poetries1.gitee.io/img-repo/2019/10/598.png)

**patch(container, vnode)**

![](https://poetries1.gitee.io/img-repo/2019/10/599.png)
![](https://poetries1.gitee.io/img-repo/2019/10/600.png)

**演示过程**

![](https://poetries1.gitee.io/img-repo/2019/10/601.png)
![](https://poetries1.gitee.io/img-repo/2019/10/602.png)
![](https://poetries1.gitee.io/img-repo/2019/10/603.png)
![](https://poetries1.gitee.io/img-repo/2019/10/604.png)

### 4.2 diff 实现过程

- `patch(container, vnode)` 和 `patch(vnode, newVnode)`
- `createElment`
- `updateChildren`
