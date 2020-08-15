---
title: 图解前端性能优化
date: 2018-01-12 11:24:03
tags: 性能优化
categories: Front-End
---

## 一、css和js的装载与执行

### 1.1 HTML 页面加载渲染的过程

![](https://poetries1.gitee.io/img-repo/2019/10/119.png)

### 1.2 HTML渲染过程的一些特点

![](https://poetries1.gitee.io/img-repo/2019/10/120.png)


### 1.3 css 阻塞和 js 阻塞

#### 1.3.1 CSS阻塞

![](https://poetries1.gitee.io/img-repo/2019/10/121.png)

#### 1.3.2 JS阻塞

![](https://poetries1.gitee.io/img-repo/2019/10/122.png)

## 二、资源的压缩与合并

### 2.1 文件合并

![](https://poetries1.gitee.io/img-repo/2019/10/123.png)


### 2.2 css、js 及 HTML压缩

#### 2.2.1 CSS压缩

![](https://poetries1.gitee.io/img-repo/2019/10/124.png)

#### 2.2.2 JS压缩

![](https://poetries1.gitee.io/img-repo/2019/10/125.png)

#### 2.2.3 HTML压缩

![](https://poetries1.gitee.io/img-repo/2019/10/126.png)

### 2.3 http 清求的过程及潜在的性能优化点


![](https://poetries1.gitee.io/img-repo/2019/10/127.png)

![](https://poetries1.gitee.io/img-repo/2019/10/128.png)

## 三、图片相关的优化

### 3.1 不同格式图片常用的业务场景

![](https://poetries1.gitee.io/img-repo/2019/10/129.png)

### 3.2 图片压缩几种方法-雪碧图、Image inline

#### 3.2.1 使用矢量图

![](https://poetries1.gitee.io/img-repo/2019/10/130.png)

#### 3.2.2 在安卓下使用webp

![](https://poetries1.gitee.io/img-repo/2019/10/131.png)

## 四、 懒加载与预加载

### 4.1 懒加载原理

![](https://poetries1.gitee.io/img-repo/2019/10/132.png)


### 4.2 预加载原理

![](https://poetries1.gitee.io/img-repo/2019/10/133.png)

### 4.3 懒加载、预加载使用场景

![](https://poetries1.gitee.io/img-repo/2019/10/134.png)
![](https://poetries1.gitee.io/img-repo/2019/10/135.png)
![](https://poetries1.gitee.io/img-repo/2019/10/136.png)
![](https://poetries1.gitee.io/img-repo/2019/10/137.png)

### 4.4 预加载原生 js 和 PreloadJS 实现

![](https://poetries1.gitee.io/img-repo/2019/10/138.png)
![](https://poetries1.gitee.io/img-repo/2019/10/139.png)


## 五、缓存

![](https://poetries1.gitee.io/img-repo/2019/10/140.png)
![](https://poetries1.gitee.io/img-repo/2019/10/141.png)
![](https://poetries1.gitee.io/img-repo/2019/10/142.png)
![](https://poetries1.gitee.io/img-repo/2019/10/143.png)
![](https://poetries1.gitee.io/img-repo/2019/10/144.png)
![](https://poetries1.gitee.io/img-repo/2019/10/145.png)
![](https://poetries1.gitee.io/img-repo/2019/10/146.png)
![](https://poetries1.gitee.io/img-repo/2019/10/147.png)
![](https://poetries1.gitee.io/img-repo/2019/10/148.png)
![](https://poetries1.gitee.io/img-repo/2019/10/149.png)
![](https://poetries1.gitee.io/img-repo/2019/10/150.png)
![](https://poetries1.gitee.io/img-repo/2019/10/151.png)


## 六、重绘与回流

### 6.1 什么是重绘与回流

#### 6.1.1 重绘

![](https://poetries1.gitee.io/img-repo/2019/10/152.png)

#### 6.1.2 回流

![](https://poetries1.gitee.io/img-repo/2019/10/153.png)
![](https://poetries1.gitee.io/img-repo/2019/10/154.png)

### 6.2 避免重绘回流的两种方法

![](https://poetries1.gitee.io/img-repo/2019/10/155.png)
![](https://poetries1.gitee.io/img-repo/2019/10/156.png)
![](https://poetries1.gitee.io/img-repo/2019/10/157.png)
![](https://poetries1.gitee.io/img-repo/2019/10/158.png)

### 6.3 css 性能让 Javacript 变慢？

![](https://poetries1.gitee.io/img-repo/2019/10/159.png)


### 6.4 案例解析-重绘、回流及图层

![](https://poetries1.gitee.io/img-repo/2019/10/160.png)
![](https://poetries1.gitee.io/img-repo/2019/10/161.png)
![](https://poetries1.gitee.io/img-repo/2019/10/162.png)
![](https://poetries1.gitee.io/img-repo/2019/10/163.png)
![](https://poetries1.gitee.io/img-repo/2019/10/164.png)
![](https://poetries1.gitee.io/img-repo/2019/10/165.png)
![](https://poetries1.gitee.io/img-repo/2019/10/166.png)

### 6.5 实战优化点总结

![](https://poetries1.gitee.io/img-repo/2019/10/167.png)

## 七、浏览器存储

### 7.1 cookies

![](https://poetries1.gitee.io/img-repo/2019/10/168.png)
![](https://poetries1.gitee.io/img-repo/2019/10/169.png)
![](https://poetries1.gitee.io/img-repo/2019/10/170.png)
![](https://poetries1.gitee.io/img-repo/2019/10/171.png)
![](https://poetries1.gitee.io/img-repo/2019/10/172.png)
![](https://poetries1.gitee.io/img-repo/2019/10/173.png)
![](https://poetries1.gitee.io/img-repo/2019/10/174.png)

### 7.2 LocalStorage、SessionStorage

#### 7.2.1 LocalStorage

![](https://poetries1.gitee.io/img-repo/2019/10/175.png)

#### 7.2.2 SessionStorage

![](https://poetries1.gitee.io/img-repo/2019/10/176.png)

### 7.3 IndexedDB

![](https://poetries1.gitee.io/img-repo/2019/10/177.png)

### 7.4 案例解析

![](https://poetries1.gitee.io/img-repo/2019/10/178.png)
![](https://poetries1.gitee.io/img-repo/2019/10/179.png)
![](https://poetries1.gitee.io/img-repo/2019/10/180.png)

### 7.5 PWA与Service Workers

#### 7.5.1 PWA

![](https://poetries1.gitee.io/img-repo/2019/10/181.png)

#### 7.5.2 Service Workers

![](https://poetries1.gitee.io/img-repo/2019/10/182.png)
![](https://poetries1.gitee.io/img-repo/2019/10/183.png)
![](https://poetries1.gitee.io/img-repo/2019/10/184.png)


### 7.6 Service Workers-离线应用

![](https://poetries1.gitee.io/img-repo/2019/10/185.png)
![](https://poetries1.gitee.io/img-repo/2019/10/186.png)


## 八、移动H5前端性能优化指南

![](https://camo.githubusercontent.com/db045941b5adebe26eae1202b9286fe8c39e5fa2/687474703a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f3934383631342d313735326635633839393363633161302e6a7065673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430)
