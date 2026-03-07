---
title: React之connect组件
date: 2018-12-20 17:50:24
tags: 
  - React
  - Javascript
categories: Front-End
---


## 一、connect用法

> 作用：连接`React`组件与 `Redux store`

```js
connect([mapStateToProps], [mapDispatchToProps], [mergeProps],[options])
```

```js
// 这个函数允许我们将 store 中的数据作为 props 绑定到组件上
const mapStateToProps = (state) => {
  return {
    count: state.count
  }
}
```

- 这个函数的第一个参数就是 `Redux` 的 `store`，我们从中摘取了 `count` 属性。你不必将 `state` 中的数据原封不动地传入组件，可以根据 `state` 中的数据，动态地输出组件需要的（最小）属性
- 函数的第二个参数 `ownProps`，是组件自己的 `props`

> 当 `state` 变化，或者 `ownProps` 变化的时候，`mapStateToProps` 都会被调用，计算出一个新的 `stateProps`，（在与 `ownProps merge` 后）更新给组件

```js
mapDispatchToProps(dispatch, ownProps): dispatchProps
```

> `connect` 的第二个参数是 `mapDispatchToProps`，它的功能是，将 `action` 作为 `props `绑定到组件上，也会成为 `MyComp` 的 `props`

## 二、原理解析

> 首先`connect`之所以会成功，是因为`Provider`组件

- 在原应用组件上包裹一层，使原来整个应用成为`Provider`的子组件
- 接收`Redux`的`store`作为`props`，通过`context`对象传递给子孙组件上的`connect`

**connect做了些什么**

> 它真正连接 `Redux` 和 `React`，它包在我们的容器组件的外一层，它接收上面 `Provider `提供的 `store` 里面的 `state `和 `dispatch`，传给一个构造函数，返回一个对象，以属性形式传给我们的容器组件

## 三、源码

> `connect`是一个高阶函数，首先传入`mapStateToProps`、`mapDispatchToProps`，然后返回一个生产`Component`的函数(`wrapWithConnect`)，然后再将真正的`Component`作为参数传入`wrapWithConnect`，这样就生产出一个经过包裹的`Connect`组件，该组件具有如下特点

- 通过`props.store`获取祖先`Component`的`store props`包括`stateProps`、`dispatchProps`、`parentProps`,合并在一起得到`nextState`，作为`props`传给真正的`Component`
- `componentDidMount`时，添加事件`this.store.subscribe(this.handleChange)`，实现页面交互
- `shouldComponentUpdate`时判断是否有避免进行渲染，提升页面性能，并得到`nextState`
- `componentWillUnmount`时移除注册的事件`this.handleChange`

```js
// 主要逻辑

export default function connect(mapStateToProps, mapDispatchToProps, mergeProps, options = {}) {
  return function wrapWithConnect(WrappedComponent) {
    class Connect extends Component {
      constructor(props, context) {
        // 从祖先Component处获得store
        this.store = props.store || context.store
        this.stateProps = computeStateProps(this.store, props)
        this.dispatchProps = computeDispatchProps(this.store, props)
        this.state = { storeState: null }
        // 对stateProps、dispatchProps、parentProps进行合并
        this.updateState()
      }
      shouldComponentUpdate(nextProps, nextState) {
        // 进行判断，当数据发生改变时，Component重新渲染
        if (propsChanged || mapStateProducedChange || dispatchPropsChanged) {
          this.updateState(nextProps)
            return true
          }
        }
        componentDidMount() {
          // 改变Component的state
          this.store.subscribe(() = {
            this.setState({
              storeState: this.store.getState()
            })
          })
        }
        render() {
          // 生成包裹组件Connect
          return (
            <WrappedComponent {...this.nextState} />
          )
        }
      }
      Connect.contextTypes = {
        store: storeShape
      }
      return Connect;
    }
}
```
