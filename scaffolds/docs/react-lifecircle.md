---
title: React16.3新的生命周期详解
date: 2018-11-18 23:30:12
tags: 
  - React
  - 生命周期
categories: Front-End
---

## 一、React v16.0前的生命周期

![](https://poetries1.gitee.io/img-repo/2019/10/417.png)

### 1.1 第一个是组件初始化(initialization)阶段

> 也就是以下代码中类的构造方法( `constructor()` ),Test类继承了react `Component`这个基类，也就继承这个`react`的基类，才能有`render()`,生命周期等方法可以使用，这也说明为什么函数组件不能使用这些方法的原因

`super(props)`用来调用基类的构造方法( `constructor()` ), 也将父组件的props注入给子组件，功子组件读取(组件中`props`只读不可变，`state`可变)而`constructor()`用来做一些组件的初始化工作，如定义`this.state`的初始内容

```js
import React, { Component } from 'react';

class Test extends Component {
  constructor(props) {
    super(props);
  }
}
```

### 1.2 第二个是组件的挂载(Mounting)阶段

**此阶段分为componentWillReceiveProps，shouldComponentUpdate，componentWillUpdate，render，componentDidUpdate**

#### 1.2.1 componentWillMount

> 在组件挂载到DOM前调用，且只会被调用一次，在这边调用`this.setState`不会引起组件重新渲染，也可以把写在这边的内容提前到`constructor()`中，所以项目中很少用

#### 1.2.2 render

> 根据组件的`props`和`state`（无两者的重传递和重赋值，论值是否有变化，都可以引起组件重新`render`） ，`return` 一个`React`元素（描述组件，即`UI`），不负责组件实际渲染工作，之后由`React`自身根据此元素去渲染出页面`DOM`。`render`是纯函数（`Pure function`：函数的返回结果只依赖于它的参数；函数执行过程里面没有副作用），不能在里面执行`this.setState`，会有改变组件状态的副作用

#### 1.2.3 componentDidMount

> 组件挂载到`DOM`后调用，且只会被调用一次

### 1.3 第三个是组件的更新(update)阶段

> `setState`引起的`state`更新或父组件重新`render`引起的`props`更新，更新后的`state`和`props`相对之前无论是否有变化，都将引起子组件的重新`render`

#### 1.3.1 造成组件更新有两类（三种）情况

**1. 父组件重新render**

> 父组件重新`render`引起子组件重新`render`的情况有两种

- a. 直接使用,每当父组件重新`render`导致的重传`props`，子组件将直接跟着重新渲染，无论`props`是否有变化。可通过`shouldComponentUpdate`方法优化

```js
class Child extends Component {
   shouldComponentUpdate(nextProps){ // 应该使用这个方法，否则无论props是否有变化都将会导致组件跟着重新渲染
        if(nextProps.someThings === this.props.someThings){
          return false
        }
    }
    render() {
        return <div>{this.props.someThings}</div>
    }
}
```

- b.在`componentWillReceiveProps`方法中，将`props`转换成自己的`state`

```jsx
class Child extends Component {
    constructor(props) {
        super(props);
        this.state = {
            someThings: props.someThings
        };
    }
    componentWillReceiveProps(nextProps) { // 父组件重传props时就会调用这个方法
        this.setState({someThings: nextProps.someThings});
    }
    render() {
        return <div>{this.state.someThings}</div>
    }
}

```

> 在该函数(`componentWillReceiveProps`)中调用 `this.setState()` 将不会引起第二次渲染

是因为`componentWillReceiveProps`中判断`props`是否变化了，若变化了，`this.setState`将引起`state`变化，从而引起`render`，此时就没必要再做第二次因重传`props`引起的`render`了，不然重复做一样的渲染了

**2. 组件本身调用setState，无论state有没有变化。可通过shouldComponentUpdate方法优化**

```jsx
class Child extends Component {
   constructor(props) {
        super(props);
        this.state = {
          someThings:1
        }
   }
   shouldComponentUpdate(nextStates){ // 应该使用这个方法，否则无论state是否有变化都将会导致组件重新渲染
        if(nextStates.someThings === this.state.someThings){
          return false
        }
    }

   handleClick = () => { // 虽然调用了setState ，但state并无变化
        const preSomeThings = this.state.someThings
         this.setState({
            someThings: preSomeThings
         })
   }

    render() {
        return <div onClick = {this.handleClick}>{this.state.someThings}</div>
    }
}
```

#### 1.3.2 componentWillReceiveProps(nextProps)

> 此方法只调用于`props`引起的组件更新过程中，参数`nextProps`是父组件传给当前组件的新`props`。但父组件`render`方法的调用不能保证重传给当前组件的`props`是有变化的，所以在此方法中根据`nextProps`和`this.props`来查明重传的`props`是否改变，以及如果改变了要执行啥，比如根据新的`props`调用`this.setState`出发当前组件的重新`render`

#### 1.3.3 shouldComponentUpdate(nextProps, nextState)

> 此方法通过比较`nextProps`，`nextState`及当前组件的`this.props`，`this.state`，返回`true`时当前组件将继续执行更新过程，返回`false`则当前组件更新停止，以此可用来减少组件的不必要渲染，优化组件性能。

ps：这边也可以看出，就算`componentWillReceiveProps()`中执行了`this.setState`，更新了`state`，但在`render`前（如`shouldComponentUpdate`，`componentWillUpdate`），`this.state`依然指向更新前的`state`，不然`nextState`及当前组件的`this.state`的对比就一直是`true`了

#### 1.3.4 componentWillUpdate(nextProps, nextState)

> 此方法在调用`render`方法前执行，在这边可执行一些组件更新发生前的工作，一般较少用

#### 1.3.5 componentDidUpdate(prevProps, prevState)

> 此方法在组件更新后被调用，可以操作组件更新的`DOM`，`prevProps`和`prevState`这两个参数指的是组件更新前的`props`和`state`

### 1.4 卸载阶段

> 此阶段只有一个生命周期方法：`componentWillUnmount`

此方法在组件被卸载前调用，可以在这里执行一些清理工作，比如清楚组件中使用的定时器，清除`componentDidMount`中手动创建的`DOM`元素等，以避免引起内存泄漏

## 二、React v16.4 的生命周期

**React v16.4 的生命周期图**

![](https://poetries1.gitee.io/img-repo/2019/10/418.png)

### 2.1 变更缘由

> 原来（`React v16.0`前）的生命周期在`React v16`推出的`Fiber`之后就不合适了，因为如果要开启`async rendering`，在`render`函数之前的所有函数，都有可能被执行多次

**原来（React v16.0前）的生命周期有哪些是在render前执行的呢？**

- `componentWillMount`
- `componentWillReceiveProps`
- `shouldComponentUpdate`
- `componentWillUpdate`

> 如果开发者开了`async rendering`，而且又在以上这些`render`前执行的生命周期方法做`AJAX`请求的话，那`AJAX`将被无谓地多次调用。而且在`componentWillMount`里发起`AJAX`，不管多快得到结果也赶不上首次`render`，而且`componentWillMount`在服务器端渲染也会被调用到

- 所以除了`shouldComponentUpdate`，其他在`render`函数之前的所有函数（`componentWillMount`，`componentWillReceiveProps`，`componentWillUpdate`）都被`getDerivedStateFromProps`替代
- 也就是用一个静态函数`getDerivedStateFromProps`来取代被`deprecate`的几个生命周期函数，就是强制开发者在`render`之前只做无副作用的操作，而且能做的操作局限在根据`props`和`state`决定新的`state`

> React v16.0刚推出的时候，是增加了一个`componentDidCatch`生命周期函数，这只是一个增量式修改，完全不影响原有生命周期函数；但是，到了`React v16.3`，大改动来了，引入了两个新的生命周期函数

### 2.2 引入了两个新的生命周期函数

#### 2.2.1 getDerivedStateFromProps

> `getDerivedStateFromProps`本来（React v16.3中）是只在创建和更新（由父组件引发部分），也就是不是不由父组件引发，那么`getDerivedStateFromProps`也不会被调用，如自身`setState`引发或者`forceUpdate`引发

**React v16.3 的生命周期图**

![](https://poetries1.gitee.io/img-repo/2019/10/419.png)

> 这样的话理解起来有点乱，在`React v16.4`中改正了这一点，让`getDerivedStateFromProps`无论是`Mounting`还是`Updating`，也无论是因为什么引起的`Updating`，全部都会被调用，具体可看`React v16.4 `的生命周期图

**React v16.4后的getDerivedStateFromProps**

> `static getDerivedStateFromProps(props, state)` 在组件创建时和更新时的render方法之前调用，它应该返回一个对象来更新状态，或者返回`null`来不更新任何内容

#### 2.2.2 getSnapshotBeforeUpdate

> `getSnapshotBeforeUpdate()` 被调用于`render`之后，可以读取但无法使用DOM的时候。它使您的组件可以在可能更改之前从DOM捕获一些信息（例如滚动位置）。此生命周期返回的任何值都将作为参数传递给`componentDidUpdate（）`

官网给的例子

```js
class ScrollingList extends React.Component {
  constructor(props) {
    super(props);
    this.listRef = React.createRef();
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    //我们是否要添加新的 items 到列表?
    // 捕捉滚动位置，以便我们可以稍后调整滚动.
    if (prevProps.list.length < this.props.list.length) {
      const list = this.listRef.current;
      return list.scrollHeight - list.scrollTop;
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    //如果我们有snapshot值, 我们已经添加了 新的items.
    // 调整滚动以至于这些新的items 不会将旧items推出视图。
    // (这边的snapshot是 getSnapshotBeforeUpdate方法的返回值)
    if (snapshot !== null) {
      const list = this.listRef.current;
      list.scrollTop = list.scrollHeight - snapshot;
    }
  }

  render() {
    return (
      <div ref={this.listRef}>{/* ...contents... */}</div>
    );
  }
}
```

## 三、参考

- [React v16.3之后的组件生命周期函数](https://zhuanlan.zhihu.com/p/38030418)
