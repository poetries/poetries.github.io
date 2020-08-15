---
title: React性能优化总结
date: 2018-11-18 20:31:43
tags: 
  - React
  - 性能优化
categories: Front-End
---

## 一、重新认识render

> `react`的组件渲染分为初始化渲染和更新渲染

- 在初始化渲染的时候会调用根组件下的所有组件的`render`方法进行渲染，如下图（绿色表示已渲染，这一层是没有问题的）

![](https://poetries1.gitee.io/img-repo/2019/10/420.png)

但是当我们要更新某个子组件的时候，如下图的绿色组件（从根组件传递下来应用在绿色组件上的数据发生改变）

![](https://poetries1.gitee.io/img-repo/2019/10/421.png)

我们的理想状态是只调用关键路径上组件的render

![](https://poetries1.gitee.io/img-repo/2019/10/422.png)

但是`react`的默认做法是调用所有组件的`render`，再对生成的虚拟`DOM`进行对比，如不变则不进行更新。这样的`render`和虚拟`DOM`的 对比 明显是在浪费，如下图（黄色表示浪费的`render`和虚拟`DOM`对比）


![](https://poetries1.gitee.io/img-repo/2019/10/423.png)

**Tips**

- 拆分组件是有利于复用和组件优化的
- 生成虚拟`DOM`并进行比对发生在`render()`后，而不是`render()`前

## 二、更新阶段的生命周期

- `componentWillReceiveProps(object nextProps)` ：当挂载的组件接收到新的`props`时被调用。此方法应该被用于比较`this.props` 和 `nextProps`以用于使用`this.setState()`执行状态转换。（组件内部数据有变化，使用`state`，但是在更新阶段又要在`props`改变的时候改变`state`，则在这个生命周期里面）
- `shouldComponentUpdate(object nextProps, object nextState)` ： -`boolean` 当组件决定任何改变是否要更新到`DOM`时被调用。作为一个 优化 实现比较`this.props` 和 `nextProps` 、`this.state` 和 `nextState` ，如果`React`应该跳过更新，返回`false`
- `componentWillUpdate(object nextProps, object nextState`) ：在更新发生前被立即调用。你不能在此调用 `this.setState()`
- `componentDidUpdate(object prevProps, object prevState`) ： 在更新发生后被立即调用。（可以在`DOM`更新完之后，做一些收尾的工作）

**Tips**

- `React`的优化是基于 `shouldComponentUpdate` 的，该生命周期默认返回`true`，所以一旦`prop`或`state`有任何变化，都会引起重新`render`

## 三、shouldComponentUpdate

> `react`在每个组件生命周期更新的时候都会调用一个`shouldComponentUpdate(nextProps, nextState)`函数。它的职责就是返回`true`或`false`，true表示需要更新，`false`表示不需要，默认返回为`true`，即便你没有显示地定义 `shouldComponentUpdate` 函数。这就不难解释上面发生的资源浪费了

**带坑的写法**

- `{...this.props}` (不要滥用，请只传递`component`需要的`props`，传得太多，或者层次传得太深，都会加重`shouldComponentUpdate`里面的数据比较负担，因此，也请慎用`spread attributes（<Component {...props} />）)`
- `::this.handleChange()。(请将方法的bind一律置于constructor)`
- 复杂的页面不要在一个组件里面写完
- 请尽量使用`const element`
- `map`里面添加`key`，并且`key`不要使用`index`（可变的)
- 尽量少用`setTimeOut`或不可控的`refs`、`DOM`操作
- 数据尽可能简单明了，扁平化

## 四、性能检测工具

**React.addons.Perf**

> `react`官方提供一个插件 `React.addons.Perf` 可以帮助我们分析组件的性能，以确定是否需要优化

`react16`以前需要在项目中配置，`react16`以后请看这篇文章，直接打开控制台的`perf`选项测试 https://reactjs.org/docs/optimizing-performance.html#profiling-components-with-the-chrome-performance-tab

**react16之前配置**

- 安装 `react` 性能检测工具 `npm i react-addons-perf --save`，然后在`./app/index.js`中

```javascript
// 性能测试
import Perf from 'react-addons-perf'
if (__DEV__) {
    window.Perf = Perf
}
```

- 打开`console`面板，先输入 `Perf.start()` 执行一些组件操作，引起数据变动，组件更新，然后输入 `Perf.stop()` 。（建议一次只执行一个操作，好进行分析）
- 再输入 `Perf.printInclusive` 查看所有涉及到的组件`render`，如下图（官方图片）

![](https://poetries1.gitee.io/img-repo/2019/10/424.png)


> 或者输入`Perf.printWasted()`查看下不需要的的浪费组件`render`

![](https://poetries1.gitee.io/img-repo/2019/10/425.png)


优化前

![](https://poetries1.gitee.io/img-repo/2019/10/426.png)

优化后

![](https://poetries1.gitee.io/img-repo/2019/10/427.png)


## 五、参考文章

- [react官方的性能优化optimizing-performance](https://reactjs.org/docs/optimizing-performance.html#profiling-components-with-the-chrome-performance-tab)


