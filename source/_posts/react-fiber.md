---
title: React之Fiber
date: 2018-11-20 12:50:40
tags: 
   - React
   - Fiber
categories: Front-End
---

## 一、React Fiber是什么

> `React Fiber`是对核心算法的一次重新实现。`React Fiber`把更新过程碎片化，把一个耗时长的任务分成很多小片，每一个小片的运行时间很短，虽然总时间依然很长，但是在每个小片执行完之后，都给其他任务一个执行的机会，这样唯一的线程就不会被独占，其他任务依然有运行的机会

1. 在`React Fiber`中，一次更新过程会分成多个分片完成，所以完全有可能一个更新任务还没有完成，就被另一个更高优先级的更新过程打断，这时候，优先级高的更新任务会优先处理完，而低优先级更新任务所做的工作则会完全作废，然后等待机会重头再来
2. 因为一个更新过程可能被打断，所以`React Fiber`一个更新过程被分为两个阶段(`Phase`)：第一个阶段`Reconciliation Phase`和第二阶段`Commit Phase`
3. 在第一阶段`Reconciliation Phase`，`React Fiber`会找出需要更新哪些`DOM`，这个阶段是可以被打断的；但是到了第二阶段`Commit Phase`，那就一鼓作气把`DOM`更新完，绝不会被打断
4. 这两个阶段大部分工作都是`React Fiber`做，和我们相关的也就是生命周期函数

> `React Fiber`改变了之前`react`的组件渲染机制，新的架构使原来同步渲染的组件现在可以异步化，可中途中断渲染，执行更高优先级的任务。释放浏览器主线程

**关键特性**

- 增量渲染（把渲染任务拆分成块，匀到多帧）
- 更新时能够暂停，终止，复用渲染任务
- 给不同类型的更新赋予优先级
- 并发方面新的基础能力

> 增量渲染用来解决掉帧的问题，渲染任务拆分之后，每次只做一小段，做完一段就把时间控制权交还给主线程，而不像之前长时间占用

## 二、组件的渲染顺序

> 假如有A,B,C,D组件，层级结构为：

![](https://poetries1.gitee.io/img-repo/2019/10/414.png)

我们知道组件的生命周期为：

**挂载阶段**：

- `constructor()`
- `componentWillMount()`
- `render()`
- `componentDidMount()`

**更新阶段为**：

- `componentWillReceiveProps()`
- `shouldComponentUpdate()`
- `componentWillUpdate()`
- `render()`
- `componentDidUpdate`

> 那么在挂载阶段，`A,B,C,D`的生命周期渲染顺序是如何的呢？

那么在挂载阶段，A,B,C,D的生命周期渲染顺序是如何的呢？


![](https://poetries1.gitee.io/img-repo/2019/10/415.png)

> 以`render()`函数为分界线。从顶层组件开始，一直往下，直至最底层子组件。然后再往上

组件`update`阶段同理

前面是`react16`以前的组建渲染方式。这就存在一个问题


> 如果这是一个很大，层级很深的组件，`react`渲染它需要几十甚至几百毫秒，在这期间，`react`会一直占用浏览器主线程，任何其他的操作（包括用户的点击，鼠标移动等操作）都无法执行

**Fiber架构就是为了解决这个问题**

> 看一下fiber架构 组建的渲染顺序

![](https://poetries1.gitee.io/img-repo/2019/10/416.png)

> 加入`fiber`的`react`将组件更新分为两个时期

**这两个时期以render为分界**

- `render`前的生命周期为`phase1`,
- `render`后的生命周期为`phase2`

> - `phase1`的生命周期是可以被打断的，每隔一段时间它会跳出当前渲染进程，去确定是否有其他更重要的任务。此过程，`React `在 `workingProgressTree` （并不是真实的`virtualDomTree`）上复用 `current` 上的 `Fiber` 数据结构来一步地（通过`requestIdleCallback`）来构建新的 tree，标记处需要更新的节点，放入队列中
> - `phase2`的生命周期是不可被打断的，`React` 将其所有的变更一次性更新到`DOM`上

**这里最重要的是phase1这是时期所做的事。因此我们需要具体了解phase1的机制**

- 如果不被打断，那么`phase1`执行完会直接进入`render`函数，构建真实的`virtualDomTree`
- 如果组件再`phase1`过程中被打断，即当前组件只渲染到一半（也许是在`willMount`,也许是`willUpdate`~反正是在render之前的生命周期），那么`react`会怎么干呢？ `react`会放弃当前组件所有干到一半的事情，去做更高优先级更重要的任务（当然，也可能是用户鼠标移动，或者其他react监听之外的任务），当所有高优先级任务执行完之后，`react`通过`callback`回到之前渲染到一半的组件，从头开始渲染。（看起来放弃已经渲染完的生命周期，会有点不合理，反而会增加渲染时长，但是`react`确实是这么干的）

**所有phase1的生命周期函数都可能被执行多次，因为可能会被打断重来**

> 这样的话，就和`react16`版本之前有很大区别了，因为可能会被执行多次，那么我们最好就得保证`phase1`的生命周期每一次执行的结果都是一样的，否则就会有问题，因此，最好都是纯函数

- 如果高优先级的任务一直存在，那么低优先级的任务则永远无法进行，组件永远无法继续渲染。这个问题facebook目前好像还没解决
- 所以，facebook在`react16`增加`fiber`结构，其实并不是为了减少组件的渲染时间，事实上也并不会减少，最重要的是现在可以使得一些更高优先级的任务，如用户的操作能够优先执行，提高用户的体验，至少用户不会感觉到卡顿

## 三、参考

- [程墨Morgan知乎React Fiber是什么](https://zhuanlan.zhihu.com/p/26027085)
