---
title: React新特性（memo、lazy、suspense、hooks）
date: 2019-09-02 17:20:12
tags: 
   - React
   - memo|suspense|lazy
categories: Front-End
---



**react 16给我们带来的一些列重要变化**

- `render`/纯组件能够`return`任何数据结构，以及`CreatePortal Api`
- 新的`context api`，尝试代替一部分`redux`的职责
- `babel`的`<>`操作符，方便用户返回数组
- 异步渲染/时间切片(time slicing)，成倍提高性能
- `componentDidCatch`，错误边界，框架层面上提高用户`debug`的能力
- 未来的`Suspense`，优雅处理异步副作用
- 未来的`hooks` 


## 一、memo

> `React v16.6.0`出了一些新的包装函数(wrapped functions)，一种用于函数组件`PureComponent` / `shouldComponentUpdate`形式的`React.memo()`

- `React.memo()`是一个高阶函数，它与 `React.PureComponent`类似，但是一个函数组件而非一个类

> 现在有一个显示时间的组件,每一秒都会重新渲染一次，对于`Child`组件我们肯定不希望也跟着渲染，所有需要用到`PureComponent`

```js
import React  from 'react';

export default class extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            date : new Date()
        }
    }

    componentDidMount(){
        setInterval(()=>{
            this.setState({
                date:new Date()
            })
        },1000)
    }

    render(){
        return (
            <div>
                <Child seconds={1}/>
                <div>{this.state.date.toString()}</div>
            </div>
        )
    }
}
```

**PureComponent**

```js
class Child extends React.PureComponent {
    render(){
        console.log('I am rendering');
        return (
            <div>I am update every {this.props.seconds} seconds</div>
        )
    }
}
```

**现在新出了一个React.memo()可以满足创建纯函数而不是一个类的需求**

```js
function Child({seconds}){
    console.log('I am rendering');
    return (
        <div>I am update every {seconds} seconds</div>
    )
};
export default React.memo(Child)
```

> `React.memo()`可接受2个参数，第一个参数为纯函数的组件，第二个参数用于对比`prop`s控制是否刷新，与`shouldComponentUpdate()`功能类似

```js
import React from "react";

function Child({seconds}){
    console.log('I am rendering');
    return (
        <div>I am update every {seconds} seconds</div>
    )
};

function areEqual(prevProps, nextProps) {
    if(prevProps.seconds===nextProps.seconds){
        return true
    }else {
        return false
    }

}
export default React.memo(Child,areEqual)
```


## 二、lazy

> `React.lazy` 用于做`Code-Splitting`，代码拆分。类似于按需加载，渲染的时候才加载代码

```js
import React, {lazy} from 'react';
const OtherComponent = lazy(() => import('./OtherComponent'));

function MyComponent() {
  return (
    <div>
      <OtherComponent />
    </div>
  );
}
```

> `lazy(() => import('./OtherComponent'))`使用`es6`的`import()`返回一个`promise`，类似于：

```js
lazy(() => new Promise(resolve =>
  setTimeout(() =>
    resolve(
      // 模拟ES Module
      {
        // 模拟export default 
        default: function render() {
          return <div>Other Component</div>
        }
      }
    ),
    3000
  )
));
```

**React.lazy的提出是一种更优雅的条件渲染解决方案**

> 这里我们引出`suspense`

当我们组件未渲染完成，需要`loading`时，可以这么写

```js
const OtherComponent = React.lazy(() => import('./OtherComponent'));

function MyComponent() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <OtherComponent />
      </Suspense>
    </div>
  );
}
```

- 在我们的业务场景中，`OtherComponent`可以代表多个条件渲染组件，我们全部加载完成才取消`loding`。
- 只要`promise`没执行到`resolve`，`suspense`都会返回`fallback`中的`loading`。
- 代码简洁，`loading`可提升至祖先组件，易聚合。相当优雅的解决了条件渲染。

## 三、suspense

> `Suspense`主要解决的就是网络`IO`问题。网络`IO`问题其实就是我们现在用`Redux+saga`等等一系列乱七八糟的库来解决的「副作用」问题。

> 调用`render`函数->发现有异步请求->悬停，等待异步请求结果->再渲染展示数据

- 引入新的`api`，可以使得任何`state`更新暂停，直到条件满足时，再渲染（像`async/await`）
- 在网速非常快的时候，可设置，整个数据到达`Dom`，更新完毕以后再渲染
- 在网速非常慢的时候，可设置，精确到单个组件的等待、以及更新，然后再渲染
- 会给我们提供 `high-level` (createFetcher)和 `low-level`(Placeholder, Loading)的 API，可以供给业务代码和一些小组件的书写。

> [更多详情](http://blog.poetries.top/2019/08/10/react-good-practice/#%E4%B9%9D%E3%80%81React-%E7%9A%84%E6%9C%AA%E6%9D%A5%EF%BC%882%EF%BC%89%EF%BC%9ASuspense-%E5%B8%A6%E6%9D%A5%E7%9A%84%E5%BC%82%E6%AD%A5%E6%93%8D%E4%BD%9C%E9%9D%A9%E5%91%BD)

## 四、hooks

> `Hooks` 的目的，简而言之就是让开发者不需要再用 class 来实现组件

> `hooks`常用`api`有：`useState`、`useEffect`、`useContext`、`useReducer`、`useRef`等

- [参考1 ](http://blog.poetries.top/2019/08/10/react-good-practice/#%E5%8D%81%E3%80%81%E5%87%BD%E6%95%B0%E5%8C%96%E7%9A%84-Hooks)
- [更多详情]( http://blog.poetries.top/2019/09/01/react-hooks)
