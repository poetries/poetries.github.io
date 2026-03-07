---
title: JavaScript语言基础之流程控制(五)
date: 2016-07-26 23:50:43
tags: JavaScript
categories: Front-End
---

- 条件结构
    `if`
    `if...else`
    `if...else if...else`
<!--more-->
    - 当通过判断返回某个值的时候，优先使用三元表达式
    - 当通过判断执行N段逻辑代码的时候，只能用条件结构


- `switch`

    `switch case break default` 条件   判断 退出  默认

   - a.只要匹配上一个`case`，那么它下面的所有的`case`都会执行包括`default`
   - b.break的意思跳出当前结构
<!--more-->
-  `for`

   - 循环有三个要素

     - a.循环变量
     - b.判断（循环体）
     - c.改变循环变量
     - d.continue的意思结束本次循环进入下次循环


   -  `continue` 结束本次循环，继续下一次循环  当前这次循环不做 直接做下面的
   -  `break` 结束后面的循环不做了

---

- `while/do...while `没有谁好谁坏 只有适应场景不同

  - 比如：先吃饭 在买单 `do..while` 用户体验高 有风险  扫雷游戏也是先体验 在问是否退出 提高体验
  - 比如：先买单 在吃饭 `while` 用户体验不高

  - 一般情况下面，如果条件判断是`数字的`比较`==<>`，`for`循环优先.
  - 如果是`非数值相关的`比较循环，`while`优先


---

### 附录：思维导图总结

![](http://7xq6al.com1.z0.glb.clouddn.com/JavaScript%20%E6%B5%81%E7%A8%8B%E6%8E%A7%E5%88%B6.gif)
