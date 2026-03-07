---
title: Redux之action、store、reducer分析（六）
date: 2017-11-19 10:16:24
tags: 
 - JavaScript
 - react
categories: Front-End
---

> redux的核心概念就是store、action、reducer，从调用关系来看如下所示

```javascript
store.dispatch(action) --> reducer(state, action) --> final state
```

```javascript
// reducer方法, 传入的参数有两个
// state: 当前的state
// action: 当前触发的行为, {type: 'xx'}
// 返回值: 新的state
var reducer = function(state, action){
    switch (action.type) {
        case 'add_todo':
            return state.concat(action.text);
        default:
            return state;
    }
};

// 创建store, 传入两个参数
// 参数1: reducer 用来修改state
// 参数2(可选): [], 默认的state值,如果不传, 则为undefined
var store = redux.createStore(reducer, []);

// 通过 store.getState() 可以获取当前store的状态(state)
// 默认的值是 createStore 传入的第二个参数
console.log('state is: ' + store.getState());  // state is:

// 通过 store.dispatch(action) 来达到修改 state 的目的
// 注意: 在redux里,唯一能够修改state的方法,就是通过 store.dispatch(action)
store.dispatch({type: 'add_todo', text: '读书'});
// 打印出修改后的state
console.log('state is: ' + store.getState());  // state is: 读书

store.dispatch({type: 'add_todo', text: '写作'});
console.log('state is: ' + store.getState());  // state is: 读书,写作
```

一、store、reducer、action关联
---

**store**

- `store`在这里代表的是数据模型，内部维护了一个`state`变量
- `store`有两个核心方法，分别是`getState`、`dispatch`。前者用来获取`store`的状态（`state`），后者用来修改`store`的状态

```javascript
// 创建store, 传入两个参数
// 参数1: reducer 用来修改state
// 参数2(可选): [], 默认的state值,如果不传, 则为undefined
var store = redux.createStore(reducer, []);

// 通过 store.getState() 可以获取当前store的状态(state)
// 默认的值是 createStore 传入的第二个参数
console.log('state is: ' + store.getState());  // state is:

// 通过 store.dispatch(action) 来达到修改 state 的目的
// 注意: 在redux里,唯一能够修改state的方法,就是通过 store.dispatch(action)
store.dispatch({type: 'add_todo', text: '读书'});
```

**action**


- 对行为（如用户行为）的抽象，在`redux`里是一个普通的`js`对象
- `action`必须有一个`type`字段来标识这个行为的类型

```javascript
{type:'add_todo', text:'读书'}
{type:'add_todo', text:'写作'}
{type:'add_todo', text:'睡觉', time:'晚上'}
```

**reducer**

- 一个普通的函数，用来修改`store`的状态。传入两个参数 `state`、`action`
- 其中，`state`为当前的状态（可通过`store.getState()`获得），而`action`为当前触发的行为（通过`store.dispatch(action)`调用触发）
- `reducer(state, action)` 返回的值，就是`store`最新的`state`值

```javascript
// reducer方法, 传入的参数有两个
// state: 当前的state
// action: 当前触发的行为, {type: 'xx'}
// 返回值: 新的state
var reducer = function(state, action){
    switch (action.type) {
        case 'add_todo':
            return state.concat(action.text);
        default:
            return state;
    }
};
```

二、关于actionCreator
---

```
actionCreator(args) => action
```

```javascript
var addTodo = function(text){
    return {
        type: 'add_todo',
        text: text
    };
};

addTodo('睡觉');  // 返回：{type: 'add_todo', text: '睡觉'}
```



