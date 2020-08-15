---
title: 前端面试之MVVM浅析
date: 2018-10-21 00:10:02
tags: 
   - 面试
   - MVVM
categories: Front-End
---

![](https://poetries1.gitee.io/img-repo/2019/10/89.png)

## 一、说一下使用 jquery 和使用框架的区别

### 1.1  jQuery 实现 todo-list

![](https://poetries1.gitee.io/img-repo/2019/10/90.png)

### 1.2 vue 实现 todo-list

![](https://poetries1.gitee.io/img-repo/2019/10/91.png)


### 1.3 jQuery 和框架的区别

- 数据和视图的分离，解耦（开放封闭原则）
- 以数据驱动视图，只关心数据变化，DOM 操作被封装

## 二、说一下对 MVVM 的理解

### 2.1 MVC

- `M - Model` 数据
- `V - View` 视图、界面
- `C - Controller` 控制器、逻辑处理

![](https://poetries1.gitee.io/img-repo/2019/10/92.png)
![](https://poetries1.gitee.io/img-repo/2019/10/93.png)


### 2.2 MVVM

- `Model` - 模型、数据
- `View` - 视图、模板（视图和模型是分离的）
- `ViewModel` - 连接 `Model` 和 `View `

![](https://poetries1.gitee.io/img-repo/2019/10/94.png)


### 2.3 关于 ViewModel

- `MVVM` 不算是一种创新
- 但其中的 `ViewModel` 确实一种创新
- 真正结合前端场景应用的创建

![](https://poetries1.gitee.io/img-repo/2019/10/95.png)
![](https://poetries1.gitee.io/img-repo/2019/10/96.png)

### 2.4 MVVM 框架的三大要素

- 响应式：`vue `如何监听到 `data` 的每个属性变化？
- 模板引擎：`vue` 的模板如何被解析，指令如何处理？
- 渲染：`vue` 的模板如何被渲染成 `html` ？以及渲染过程

## 三、vue 中如何实现响应式

### 3.1 什么是响应式

- 修改 data 属性之后，vue 立刻监听到
- data 属性被代理到 vm 上

![](https://poetries1.gitee.io/img-repo/2019/10/97.png)

### 3.2 Object.defineProperty

![](https://poetries1.gitee.io/img-repo/2019/10/98.png)


### 3.3 模拟实现


![](https://poetries1.gitee.io/img-repo/2019/10/99.png)

![](https://poetries1.gitee.io/img-repo/2019/10/100.png)

## 四、vue 中如何解析模板

### 4.1 模板是什么

- 本质：字符串
- 有逻辑，如 `v-if` `v-for` 等
- 与 `html` 格式很像，但有很大区别
- 最终还要转换为 `html` 来显示

**模板最终必须转换成 JS 代码，因为**

- 有逻辑（`v-if` `v-for`），必须用 `JS `才能实现
- 转换为 `html` 渲染页面，必须用 `JS` 才能实现
- 因此，模板最重要转换成一个 `JS` 函数（`render` 函数）


![](https://poetries1.gitee.io/img-repo/2019/10/101.png)


### 4.2 render 函数

- 模板中所有信息都包含在了 `render` 函数中
- `this` 即` vm`
- `price` 即 `this.price` 即 `vm.price`，即 `data` 中的 `price`
- `_c` 即 `this._c` 即 `vm._c`

![](https://poetries1.gitee.io/img-repo/2019/10/102.png)

![](https://poetries1.gitee.io/img-repo/2019/10/103.png)

![](https://poetries1.gitee.io/img-repo/2019/10/104.png)

### 4.3 render 函数与 vdom

- `vm._c` 其实就相当于 `snabbdom `中的 `h` 函数
- `render` 函数执行之后，返回的是 `vnode`

![](https://poetries1.gitee.io/img-repo/2019/10/105.png)

![](https://poetries1.gitee.io/img-repo/2019/10/106.png)


- `updateComponent `中实现了 `vdom` 的 `patch`
- 页面首次渲染执行 `updateComponent`
- `data` 中每次修改属性，执行` updateComponent`

## 五、vue 的整个实现流程

- 第一步：解析模板成 render 函数
- 第二步：响应式开始监听
- 第三步：首次渲染，显示页面，且绑定依赖
- 第四步：`data` 属性变化，触发 `rerender`

![](https://poetries1.gitee.io/img-repo/2019/10/107.png)

### 5.1 第一步：解析模板成 render 函数


![](https://poetries1.gitee.io/img-repo/2019/10/108.png)

![](https://poetries1.gitee.io/img-repo/2019/10/109.png)

![](https://poetries1.gitee.io/img-repo/2019/10/110.png)

![](https://poetries1.gitee.io/img-repo/2019/10/111.png)

- 模板中的所有信息都被 `render `函数包含
- 模板中用到的 `data` 中的属性，都变成了 `JS` 变量
- 模板中的` v-model`  `v-for`  `v-on` 都变成了 `JS` 逻辑
- `render` 函数返回 `vnode`

### 5.2 第二步：响应式开始监听

- `Object.defineProperty`
- 将 `data` 的属性代理到 `vm `上

![](https://poetries1.gitee.io/img-repo/2019/10/112.png)

### 5.3 第三步：首次渲染，显示页面，且绑定依赖

- 初次渲染，执行 `updateComponent`，执行 `vm._render()`
- 执行 `render` 函数，会访问到 `vm.list vm.title`
- 会被响应式的 `get` 方法监听到
- 执行 `updateComponent` ，会走到 `vdom` 的 `patch` 方法
- `patch` 将 `vnode `渲染成 `DOM` ，初次渲染完成

![](https://poetries1.gitee.io/img-repo/2019/10/113.png)
![](https://poetries1.gitee.io/img-repo/2019/10/114.png)

**为何要监听 get ，直接监听 set 不行吗？**

- `data` 中有很多属性，有些被用到，有些可能不被用到
- 被用到的会走到 `get` ，不被用到的不会走到 `get`
- 未走到 `get` 中的属性，`set `的时候我们也无需关心
- 避免不必要的重复渲染

![](https://poetries1.gitee.io/img-repo/2019/10/115.png)

### 5.4 第四步：data 属性变化

![](https://poetries1.gitee.io/img-repo/2019/10/116.png)
![](https://poetries1.gitee.io/img-repo/2019/10/117.png)

- 修改属性，被响应式的 `set` 监听到
- `set `中执行 `updateComponent`
- updateComponent 重新执行 `vm._render()`
- 生成的 `vnode` 和 `prevVnode` ，通过 `patch `进行对比
- 渲染到 `html` 中


![](https://poetries1.gitee.io/img-repo/2019/10/118.png)