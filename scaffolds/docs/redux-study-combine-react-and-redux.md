---
title: Redux之react结合redux实战篇（十）
date: 2017-11-19 18:40:24
tags: 
 - JavaScript
 - react
categories: Front-End
---

> 以`TODO`为例分析，实际开发中并不是那么简单，下面的原型只是开发中的一个原型，这个简单的例子，有助于掌握数据处理传递的原则。

一、定义constants
---

> 这一步不是必须的

```javascript
/**
 * 常量统一保存，便于管理
 */
export const ADD_TODO = 'ADD_TODO';
export const TOGGLE_TODO = 'TOGGLE_TODO';
export const SET_VISIBILITY = 'SET_VISIBILITY';

//controll todo wheher show or hide
export const SHOW_ALL = 'SHOW_ALL';
export const SHOW_ACTIVE = 'SHOW_ACTIVE';
export const SHOW_COMPLETED = 'SHOW_COMPLETED';
```

二、定义actionCreator
---


```javascript
/**
 * 定义action creator
 */

import * as actionType from '../constant/index';

let nextTodo = 0;

export const addTodo = (text)=>({
  type:actionType.ADD_TODO,
  id:nextTodo++,
  text
})

export const toggleTodo = (id)=>({
  type:actionType.TOGGLE_TODO,
  id
})

export const setVisibilityFilter = (filter)=>{
  return {
    type:actionType.SET_VISIBILITY,
    filter
  }
}
```

三、定义reducer
---

**拆分reducer**

- `SetVisibility.js`

```javascript
/**
 * 处理TODO可见与不可见的reducer
 */
import * as actionType from '../constant/index';

// 初始状态是自己设置的 后面的状态会转化
// 接收当前状态(设置默认的过滤SHOW_ALL，如设置某些选项卡的active一样)，和action返回新的state
export const visibilityFilter = (state='SHOW_ALL',action)=>{
  switch(action.type) {
    case actionType.SET_VISIBILITY:
      return action.filter;
    default:
      return state;
  }
}
```

- `addTodo.js`

```javascript
/**
 * 定义处理action的reducers
 */
import * as actionType from '../constant/index';

//传入当前的状态空数、action
export const todos = (state = [],action)=>{
  switch(action.type){ // 匹配用户触发的actionType
    case actionType.ADD_TODO:
    // 合并上一次的状态和当前的状态 返回todos数组
      return [
        ...state,//把数组展开合并
        {
          id:action.id,
          text:action.text,
          completed:false//用户控制TODO是否处于点击完成的状态 默认false 没点击
        }
      ]
      // TODO列表来回切换 遍历add_todo返回的数组 通过completed来判断
    case actionType.TOGGLE_TODO:
      return state.map(todo=>(todo.id===action.id)?{...todo,completed:!todo.completed}:todo)
    default:
      return state;//匹配不到返回state
  }
}
```

**合并reducer**

```javascript
/**
 * 合并reducers
 */

import { combineReducers } from 'redux'
import {todos} from './addTodo';
import {visibilityFilter} from './SetVisibility';

export default combineReducers({
  todos, //这些键其实就是被拆分的状态，后面在容器组件中需要通过connect链接
  visibilityFilter
});
```


四、定义store
---

```javascript
import { applyMiddleware, createStore } from 'redux';
import reducer from '../reducers/index';
import logger from 'redux-logger';

// 创建store 用来存储状态
export const store = createStore(
  reducer,
  applyMiddleware(logger) //处理日志中间件
)
```

五、结合react-redux
---

> 这里忽略展示组件，完成源码看文章结尾

- 首先我们在`container`组件中处理好之前分解合并的那些`reducer`的键，然后在通过`connect`链接，传递给展示组件的属性使用

**容器组件处理**

> react-todos/src/container/FilterLink.js

```javascript
// 处理数组过滤

import { connect } from 'react-redux';
import Link from '../components/Link';
import { setVisibilityFilter } from '../actions/index';

// 这里的ownProps指的是 FilterLink
// 这里的state其实就是之前分解的todos，visibilityFilter
const mapStateToProps = (state, ownProps) => {
  return {
    active:ownProps.filter === state.visibilityFilter
  }
}

/**
 如果mapDispatchToProps是一个函数，会得到dispatch和ownProps（容器组件的props对象）两个参数。
 */
const mapDispatchToProps = (dispatch, ownProps) => ({
// 这里处理对应的事件，传递给展示组件的属性
  onClick: () => {
      dispatch(setVisibilityFilter(ownProps.filter))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Link);
```

- 分析
  - 这里通过`connect`组件把之前`reducer`处理的那些状态链接
  
```javascript

export default combineReducers({
  todos, //这些键其实就是被拆分的状态，后面在容器组件中需要通过connect链接
  visibilityFilter
});

```

> react-todos/src/container/VisibilityTodoList.js

```javascript
/**
 * 处理可见于不可见组件的逻辑
 */
import {connect} from 'react-redux';
import TodoList from '../components/TodoList';
import {toggleTodo} from '../actions/index';
import * as actionType from '../constant/index';
console.log(toggleTodo)

// todos是返回的数组，filter是过滤的选项如SHOW_ALL SHOW_ACTIVE.
const getVisibilityTodos = (todos,filter)=>{
  switch(filter) {
    case actionType.SHOW_ALL:
      return todos;
    case actionType.SHOW_ACTIVE:
      return todos.filter(t => !t.completed);
    case actionType.SHOW_COMPLETED:
      return todos.filter(t => t.completed);
    default:
      throw new Error('未知的'+filter);
  }
}

// 把状态转化为展示组件的属性转递过去
/**
 *
 * @param {*} state 也就是
 * export default CombineReducers({
  Todos,
  SetVisibility
  *});
 * @param {*} ownProps 返回的容器组件本身的参数 如<Filter name="poetries">此时的ownProps就是name了
 */

const mapStateToProps = (state) => {
  return {
    todos: getVisibilityTodos(state.todos,state.visibilityFilter),
    count:state.todos.length
  }
}

/**
 * 如果mapDispatchToProps是一个对象，它的每个键名也是对应 UI 组件的同名参数，键值应该是一个函数，会被当作 Action creator ，返回的 Action 会由 Redux 自动发出
 */
const mapDispatchToProps = {
    onTodoClick: toggleTodo
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TodoList)

```

> react-todos/src/container/addTodos.js

```javascript
/**
 * Addtodo的处逻辑
 */
import React, { Component } from 'react';
import {addTodo} from '../actions/index';
import AddTask from '../components/addTodo';
import {connect} from 'react-redux';

const mapStateToProps = (state, ownProps) => ({
  
})

const mapDispatchToProps = {
  addTodo:addTodo
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddTask);

```

> 到此分析完毕，展示组件就不分析了，展示组件本身是没有数据的，需要container处理传递


**完整的源码**

> https://github.com/poetries/react-todos
