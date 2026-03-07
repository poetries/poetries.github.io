---
title: Redux之浅析中间件（八）
date: 2017-11-19 16:30:26
tags: 
 - JavaScript
 - react
categories: Front-End
---

一、前言
---

- 在`redux`里，`middleware`是发送`action`和`action`到达`reducer`之间的第三方扩展，也就是中间层。也可以这样说，`middleware`是架在`action`和`store`之间的一座桥梁
- 在`redux`里，`action`仅仅是携带了数据的普通`js`对象


> `Reducer` 拆分可以使组件获取其最小属性(`state`)，而不需要整个`Store`。中间件则可以在` Action Creator` 返回最终可供 `dispatch` 调用的 `action` 之前处理各种事情，如异步`API`调用、日志记录等，是扩展 `Redux` 功能的一种推荐方式

- `Redux` 提供了 `applyMiddleware(...middlewares)` 来将中间件应用到 `createStore`。`applyMiddleware` 会返回一个函数，该函数接收原来的 `creatStore` 作为参数，返回一个应用了 `middlewares` 的增强后的 `creatStore`

```javascript
export default function applyMiddleware(...middlewares) {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    //接收createStore参数
    var store = createStore(reducer, preloadedState, enhancer)
    var dispatch = store.dispatch
    var chain = []

    //传递给中间件的参数
    var middlewareAPI = {
      getState: store.getState,
      dispatch: (action) => dispatch(action)
    }

    //注册中间件调用链
    chain = middlewares.map(middleware => middleware(middlewareAPI))
    dispatch = compose(...chain)(store.dispatch)

    //返回经middlewares增强后的createStore
    return {
      ...store,
      dispatch
    }
  }
}
```

> 未应用中间价之前，创建 `store` 的方式如下

```javascript
import {createStore} from 'redux';
import reducers from './reducers/index';

export let store = createStore(reducers);
```

> 应用中间价之后，创建 `store `的方式如下

```javascript
import {createStore，applyMiddleware} from 'redux';
import reducers from './reducers/index';

let createStoreWithMiddleware = applyMiddleware(...middleware)(createStore);
export let store = createStoreWithMiddleware(reducers);
```


二、为什么要引入middleware
---

- `action creator`返回的值是这个`action`类型的对象。然后通过`store.dispatch()`进行分发

```javascript
action ---> dispatcher ---> reducers
```

> 如果遇到异步情况，比如点击一个按钮，希望2秒之后更新视图，显示消息“Hi”。我们可能这么写`ActionCreator`

```javascript
var asyncSayActionCreator = function (message) {
    setTimeout(function () {
        return {
            type: 'SAY',
            message
        }
    }, 2000)
}
```

> 这会报错，因为这个`asyncSayActionCreator`返回的不是一个`action`，而是一个`function`。这个返回值无法被`reducer`识别

- 也就是说，正常来说，`action`返回的是一个对象，而不是一个函数。如果返回函数，会出现错误
- 　而异步操作呢，需要`action`的返回值是一个函数。那么咋办呢，所以需要引入中间件`middleware`,它在中间起到了桥梁的作用，让`action`的返回值可以是一个函数，从而传到`reducer`那里。也就是说，中间件是用在`action`发起之后，`reducer`接收到之前的这个时间段
- 也可以这么说，`Middleware` 主要是负责改变`Store`中的`dispatch`方法，从而能处理不同类型的 `action` 输入，得到最终的 `Javascript Plain Object` 形式的 `action` 对象

> 因此，上面那个`ActionCreator`就可以改写为这样：因为`action`的返回值是一个函数

```javascript
var asyncSayActionCreator = function (message) {
    return function (dispatch) {
        setTimeout(function () {
            dispatch({
                type: 'SAY',
                message
            })
        }, 2000)
    }
}
```

![](https://poetries1.gitee.io/img-repo/2019/10/466.png)

- 上图表达的是 `redux` 中一个简单的同步数据流动的场景，点击` button` 后，在回调中 `dispatch` 一个 `action`，`reducer` 收到` action` 后，更新 `state` 并通知 `view` 重新渲染

![](https://poetries1.gitee.io/img-repo/2019/10/467.png)

- 上面这张图展示了应用` middleware` 后 `redux` 处理事件的逻辑，每一个 `middleware` 处理一个相对独立的业务需求，通过串联不同的 `middleware`，实现变化多样的的功能。那么问题来了：
  - `middleware` 怎么写？
  - `redux `是如何让 `middlewares` 串联并跑起来的？


三、中间件是如何工作的
---

> `Middleware`的中间件有很多，不过我的这个案例只引用了其中的一个，那就是`redux-thunk`

- `redux-thunk`源码如下

```javascript
export default function thunkMiddleware({ dispatch, getState }) {
  return next => action =>
    typeof action === 'function' ?
      action(dispatch, getState) :
      next(action);
}
```

> 意思是如果`action`是一个函数，执行这个`action`函数，如果不是函数，执行`next`函数


四、自定义中间件
---

> 中间件的签名如下

```javascript
({ getState, dispatch }) => next => action
```

> 根据`applyMiddleware` 源码，每个中间件接收 `getState & dispatch `作为参数，并返回一个函数，该函数会被传入下一个中间件的 dispatch 方法，并返回一个接收 `action` 的新函数

- 应用多个中间件时，中间件调用链中任何一个缺少 `next(action)` 的调用，都会导致` action` 执行失败


```javascript
function callTraceMiddleware ({dispatch,getState}){
    return next=> action =>{
        console.trace();
        return next(action);
    }
}
```

- 然后在调用中间件部分添加中间件

```javascript
const createStoreWithMiddleware = applyMiddleware(
  thunkMiddleware,
  loggerMiddleware,
  callTraceMiddleware
)(createStore);
```

> `redux`的`middleware`是对`action`进行扩展处理，这样丰富了应用需求
