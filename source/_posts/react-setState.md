---
title: React之setState原理分析
date: 2018-12-21 00:00:24
tags: 
  - React
  - Javascript
categories: Front-End
---

## 一、setState异步更新

- 我们都知道，`React`通过`this.state`来访问`state`，通过`this.setState()`方法来更新`state`。当`this.setState()`方法被调用的时候，`React`会重新调用`render`方法来重新渲染`UI`
- 首先如果直接在`setState`后面获取`state`的值是获取不到的。在`React`内部机制能检测到的地方， `setState`就是异步的；`在React`检测不到的地方，例如`setInterval`,`setTimeout`，`setState`就是同步更新的

![](https://poetries1.gitee.io/img-repo/2019/10/431.png)

> 因为`setState`是可以接受两个参数的，一个`state`，一个回调函数。因此我们可以在回调函数里面获取值

![](https://poetries1.gitee.io/img-repo/2019/10/432.png)

- `setState`方法通过一个队列机制实现`state`更新，当执行`setState`的时候，会将需要更新的`state`合并之后放入状态队列，而不会立即更新`this.state`
- 如果我们不使用`setState`而是使用`this.state.key`来修改，将不会触发组件的`re-render`。
- 如果将`this.state`赋值给一个新的对象引用，那么其他不在对象上的`state`将不会被放入状态队列中，当下次调用`setState`并对状态队列进行合并时，直接造成了`state`丢失

### 1.1 setState批量更新的过程

> 在`react`生命周期和合成事件执行前后都有相应的钩子，分别是`pre`钩子和`post`钩子，`pre`钩子会调用`batchedUpdate`方法将`isBatchingUpdates`变量置为`true`，开启批量更新，而`post`钩子会将`isBatchingUpdates`置为`false`

![](https://poetries1.gitee.io/img-repo/2019/10/433.png)

- `isBatchingUpdates`变量置为`true`，则会走批量更新分支，`setState`的更新会被存入队列中，待同步代码执行完后，再执行队列中的`state`更新。 `isBatchingUpdates `为 `true`，则把当前组件（即调用了 `setState `的组件）放入 `dirtyComponents` 数组中；否则 `batchUpdate` 所有队列中的更新
- 而在原生事件和异步操作中，不会执行`pre`钩子，或者生命周期的中的异步操作之前执行了`pre`钩子，但是`pos`钩子也在异步操作之前执行完了，`isBatchingUpdates`必定为`false`，也就不会进行批量更新

![](https://poetries1.gitee.io/img-repo/2019/10/434.png)

> `enqueueUpdate`包含了`React`避免重复`render`的逻辑。`mountComponent`和`updateComponent`方法在执行的最开始，会调用到`batchedUpdates`进行批处理更新，此时会将`isBatchingUpdates`设置为`true`，也就是将状态标记为现在正处于更新阶段了。 `isBatchingUpdates `为 `true`，则把当前组件（即调用了 `setState` 的组件）放入` dirtyComponents` 数组中；否则 `batchUpdate` 所有队列中的更新


### 1.2 为什么直接修改this.state无效

- 要知道`setState`本质是通过一个队列机制实现`state`更新的。 执行`setState`时，会将需要更新的state合并后放入状态队列，而不会立刻更新`state`，队列机制可以批量更新`state`。
- 如果不通过`setState`而直接修改`this.state`，那么这个`state`不会放入状态队列中，下次调用`setState`时对状态队列进行合并时，会忽略之前直接被修改的`state`，这样我们就无法合并了，而且实际也没有把你想要的`state`更新上去

### 1.3 什么是批量更新 Batch Update

> 在一些`mv*`框架中，，就是将一段时间内对`model`的修改批量更新到`view`的机制。比如那前端比较火的`React`、`vue`（`nextTick`机制,视图的更新以及实现）

### 1.4 setState之后发生的事情

- `setState`操作并不保证是同步的，也可以认为是异步的
- `React`在`setState`之后，会经对`state`进行`diff`，判断是否有改变，然后去`diff dom`决定是否要更新`UI`。如果这一系列过程立刻发生在每一个`setState`之后，就可能会有性能问题
- 在短时间内频繁`setState`。`React`会将`state`的改变压入栈中，在合适的时机，批量更新`state`和视图，达到提高性能的效果


### 1.5 如何知道state已经被更新

> 传入回调函数

```js
setState({
    index: 1
}}, function(){
    console.log(this.state.index);
})
```

> 在钩子函数中体现

```js
componentDidUpdate(){
    console.log(this.state.index);
}
```

## 二、setState循环调用风险

- 当调用`setState`时，实际上会执行`enqueueSetState`方法，并对`partialState`以及`_pending-StateQueue`更新队列进行合并操作，最终通过`enqueueUpdate`执行`state`更新 
- 而`performUpdateIfNecessary`方法会获`取_pendingElement`,`_pendingStateQueue`，`_pending-ForceUpdate`，并调用`receiveComponent`和`updateComponent`方法进行组件更新 
- 如果在`shouldComponentUpdate`或者`componentWillUpdate`方法中调用`setState`，此时`this._pending-StateQueue != null`，就会造成循环调用，使得浏览器内存占满后崩溃

## 三、事务


- 事务就是将需要执行的方法使用`wrapper`封装起来，再通过事务提供的`perform`方法执行，先执行`wrapper`中的`initialize`方法，执行完`perform`之后，在执行所有的`close`方法，一组`initialize`及`close`方法称为一个`wrapper`。 
- 那么事务和`setState`方法的不同表现有什么关系，首先我们把`4`次`setStat`e简单归类，前两次属于一类，因为它们在同一调用栈中执行，`setTimeout`中的两次`setState`属于另一类
- 在`setState`调用之前，已经处在`batchedUpdates`执行的事务中了。那么这次`batchedUpdates`方法是谁调用的呢，原来是`ReactMount.js`中的`_renderNewRootComponent`方法。也就是说，整个将`React`组件渲染到`DOM`中的过程就是处于一个大的事务中。而在`componentDidMount`中调用`setState`时，`batchingStrategy`的`isBatchingUpdates`已经被设为了`true`，所以两次`setState`的结果没有立即生效
- 再反观`setTimeout`中的两次`setState`，因为没有前置的`batchedUpdates`调用，所以导致了新的`state`马上生效


## 四、总结

- 通过`setState`去更新`this.state`，不要直接操作`this.state`，请把它当成不可变的
- 调用`setState`更新`this.state`不是马上生效的，它是异步的，所以不要天真以为执行完`setState`后`this.state`就是最新的值了
- 多个顺序执行的`setState`不是同步地一个一个执行滴，会一个一个加入队列，然后最后一起执行，即批处理

