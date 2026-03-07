---
title: JavaScript语言基础之Window属性(八)
date: 2016-07-27 00:05:43
tags: JavaScript
categories: Front-End
---

- **一些讨论**
<!--more-->
  - `window` 是`Window`构造器造出来的一个对象 `alert(window instanceof Window)`
  - `document` 是`Document`构造器造出来的一个对象

  - 任何对象在我们的内存中他都是由某个构造器创建出来的 也就是说 有构造器一定有对应的原型prototype
  - 例如：div是由HTMLDivElement 这个构造器创建的一个实例 `div = new HTMLDivElement()`  `span = new HTMLSpanElement()`

  - 查看某个对象对应的构造器：console.log();

  - 整个浏览器的实现就是一个面向对象的编程思想 一切皆是对象



- **BOM 浏览器对象模型**

     - a.`screen` 指的不是浏览器的宽度，指的是整个电脑屏幕的分辨率
          可以拿到屏幕可用分辨率

     - b.`navigator`
          可以通过`userAgent`判断当前浏览器信息

     - c.`location`

         - `URL`：统一资源定位符 `Union Resource Location`

         - 可以通过`href`属性重定向（改变）页面的URL，进行页面跳转

     - d.`history`
          go方法能够让我们进行历史回退或者前进

     - e.`frames`
          获得当前窗体的子页面（`iframe`）

     - f.`document`
          `DOM`模型的核心对象

- **`DOM` 文档对象模型**

  - document

   - 功能

       - `getElementById`：通过传入的ID，返回标识了这个ID的唯一对象的内存地址
       - `getElementsByTagName`:通过传入的标签名字，返回所有该标签对象（`HTMLCollection`）
       - `getElementsByClassName`:通过类的名字，返回所有该类的元素对象（`HTMLCollection`）
       - `createElement`:想要创建出来的元素能够绘制在页面中，那么它必须在DOM树中

   - **总结：** `document`对象是DOM原型的核心对象，它是内存DOM树的根，所以它提供了很多功能让我们快速的找到DOM树中的某些DOM节点（对象）

   - `element`

       - 功能方法：（自定义属性非常灵活好用）
         - `setAttribute/getAttribute` //getAttribute获取标签的属性 --用来操作标签的属性
         - `setAttribute`设置标签的属性
         - `appendChild`:添加子元素

       - 属性：

         - `id`
         - `className`，`style`
         - `name`,`value`(只有表单元素有 其他是没有的)
         - `href`,`src`...(对应的元素)
         - `innerHTML/innerText`  innerText返回文本信息
         - `children`://子元素集合
         - `parentNode`//父元素


   -  总结：元素的功能属性直接可以通过元素对象`点`出来，除此意外的`自定义属性`，请通过`get/setAtribute`去操作

---


### 附录：思维导图总结

![](http://7xq6al.com1.z0.glb.clouddn.com/js%E8%AF%AD%E8%A8%80%E5%9F%BA%E7%A1%80-window%E5%B1%9E%E6%80%A7.gif)
