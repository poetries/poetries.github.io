---
title: Redux之源码分析（九）
date: 2017-11-19 17:35:24
tags: 
 - JavaScript
 - react
categories: Front-End
---

一、index.js
---

> https://github.com/reactjs/redux/blob/master/src/index.js

- 暴露了几个核心`API`

```javascript
import createStore from './createStore';
import combineReducers from './utils/combineReducers';
import bindActionCreators from './utils/bindActionCreators';
import applyMiddleware from './utils/applyMiddleware';
import compose from './utils/compose';

export {
  createStore,
  combineReducers,
  bindActionCreators,
  applyMiddleware,
  compose
};
```

二、createStore.js
---

> https://github.com/reactjs/redux/blob/master/src/createStore.js

- `redux.createStore(reducer, initialState)` 传入了`reducer`、`initialState`，并返回一个`store`对象
- `store`对象对外暴露了`dispatch`、`getStat`e、`subscribe`方法
- `store`对象通过`getState()` 获取内部状态
- `initialState`为 `store` 的初始状态，如果不传则为undefined
- `store`对象通过`reducer`来修改内部状态
- `store`对象创建的时候，内部会主动调用`dispatch({ type: ActionTypes.INIT })`;来对内部状态进行初始化。通过断点或者日志打印就可以看到，`store`对象创建的同时，`reducer`就会被调用进行初始化

```javascript
import isPlainObject from './utils/isPlainObject';

/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */
// 初始化的时候(redux.createStore(reducer, initialState)时),传的action.type 就是这货啦
export var ActionTypes = {
  INIT: '@@redux/INIT'
};

/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 *
 * @param {any} [initialState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 */
export default function createStore(reducer, initialState) {
  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.');
  }

  var currentReducer = reducer;
  var currentState = initialState;
  var listeners = [];
  var isDispatching = false;

  /**
   * Reads the state tree managed by the store.
   *
   * @returns {any} The current state tree of your application.
   */
  // 这个方法没什么好讲的,返回当前的state
  function getState() {
    return currentState;
  }

  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * @param {Function} listener A callback to be invoked on every dispatch.
   * @returns {Function} A function to remove this change listener.
   */
  // 很常见的监听函数添加方式,当store.dispatch 的时候被调用
  // store.subscribe(listener) 返回一个方法(unscribe),可以用来取消监听
  function subscribe(listener) {
    listeners.push(listener);
    var isSubscribed = true;

    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      isSubscribed = false;
      var index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  }

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */
  // 以下情况会报错
  // 1. 传入的action不是一个对象
  // 2. 传入的action是个对象,但是action.type 是undefined
  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error(
        'Actions must be plain objects. ' +
        'Use custom middleware for async actions.'
      );
    }

    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
        'Have you misspelled a constant?'
      );
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }

    try {
      isDispatching = true;
      // 就是这一句啦, 将 currentState 设置为 reducer(currentState, action) 返回的值
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    // 如果有监听函数,就顺序调用
    listeners.slice().forEach(listener => listener());

    // 最后,返回传入的action
    return action;
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */
  function replaceReducer(nextReducer) {
    currentReducer = nextReducer;
    dispatch({ type: ActionTypes.INIT });
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  //
  // redux.createStore(reducer, initialState) 的时候, 内部会 自己调用 dispatch({ type: ActionTypes.INIT });
  // 来完成state的初始化
  dispatch({ type: ActionTypes.INIT });

  // 返回的就是这个东东了,只有四个方法
  return {
    dispatch,
    subscribe,
    getState,
    replaceReducer
  };
}
```

三、combineReducers.js
---

> https://github.com/reactjs/redux/blob/master/src/combineReducers.js

- `redux.combineReducers(reducerMap)` 的作用在于合并多个`reducer`函数，并返回一个新的`reducer`函数。因此可以看到，`combineReducers` 返回了一个函数，并且该函数的参数同样是`state`、`reducer`

- 最终 `store.getState() `返回的`state`，大概会是这么个样子`{todos: xx, filter: xx}`。简单的说，`state`被拆分成了两份，`TodoReducer`的返回值赋值给了`state.todos`，`FilterReducer`的返回值赋值给了`state.filter`

```javascript
function TodoReducer(state, action) {}
function FilterReducer(state, action) {}

var finalReducers = redux.combineReducers({
    todos: TodoReducer,
    filter: FilterReducer
});
```

- `combineReducers(reducerMap)` 传入一个对象，并返回一个全新的`reducer`。调用方式跟跟普通的`reducer`一样，也是传入`state`、`action`
- 通过`combineReducers`，对 `store` 的状态`state`进行拆分
- `reducerMap的key`，就是 `state` 的`key`，而 调用对应的`reducer`返回的值，则是这个`key`对应的值。如上面的例子，`state.todos == TodoReducer(state, action)`
- `redux.createStore(finalReducers, initialState)` 调用时，同样会对 `state `进行初始化。这个初始化跟通过普通的`reducer`进行初始化没多大区别。举例来说，如果 `initialState.todos = undefined`，那么 `TodoReducer(state, action) `初始传入的`state`就是`undefined`；如果`initialState.todos = []`，那么 `TodoReducer(state, action) `初始传入的`state`就是`[]`
- `store.dispatch(action)`，`finalReducers` 里面，会遍历整个`reducerMap`，依次调用每个`reducer`，并将每个`reducer`返回的子`state`赋给`state`对应的`key`。

```javascript
import { ActionTypes } from '../createStore';
import isPlainObject from '../utils/isPlainObject';
import mapValues from '../utils/mapValues';
import pick from '../utils/pick';

/* eslint-disable no-console */

function getUndefinedStateErrorMessage(key, action) {
  var actionType = action && action.type;
  var actionName = actionType && `"${actionType.toString()}"` || 'an action';

  return (
    `Reducer "${key}" returned undefined handling ${actionName}. ` +
    `To ignore an action, you must explicitly return the previous state.`
  );
}

function getUnexpectedStateKeyWarningMessage(inputState, outputState, action) {
  var reducerKeys = Object.keys(outputState);
  var argumentName = action && action.type === ActionTypes.INIT ?
    'initialState argument passed to createStore' :
    'previous state received by the reducer';

  if (reducerKeys.length === 0) {
    return (
      'Store does not have a valid reducer. Make sure the argument passed ' +
      'to combineReducers is an object whose values are reducers.'
    );
  }

  if (!isPlainObject(inputState)) {
    return (
      `The ${argumentName} has unexpected type of "` +
      ({}).toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] +
      `". Expected argument to be an object with the following ` +
      `keys: "${reducerKeys.join('", "')}"`
    );
  }

  var unexpectedKeys = Object.keys(inputState).filter(
    key => reducerKeys.indexOf(key) < 0
  );

  if (unexpectedKeys.length > 0) {
    return (
      `Unexpected ${unexpectedKeys.length > 1 ? 'keys' : 'key'} ` +
      `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
      `Expected to find one of the known reducer keys instead: ` +
      `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`
    );
  }
}

// 对reducer做合法性检测
// store = Redux.createStore(reducer, initialState) -->
// currentState = initialState
// currentState = currentReducer(currentState, action);
//
// 从调用关系,调用时机来看, store.getState() 的初始值(currentState)
// 为 currentReducer(initialState, { type: ActionTypes.INIT })
//
// 1. 在初始化阶段,reducer 传入的 state 值是 undefined,此时,需要返回初始state,且初始state不能为undefined
// 2. 当传入不认识的 actionType 时, reducer(state, {type}) 返回的不能是undefined
// 3. redux/ 这个 namespace 下的action 不应该做处理,直接返回 currentState 就行 (谁运气这么差会去用这种actionType...)
function assertReducerSanity(reducers) {
  Object.keys(reducers).forEach(key => {
    var reducer = reducers[key];
    var initialState = reducer(undefined, { type: ActionTypes.INIT });

    if (typeof initialState === 'undefined') {
      throw new Error(
        `Reducer "${key}" returned undefined during initialization. ` +
        `If the state passed to the reducer is undefined, you must ` +
        `explicitly return the initial state. The initial state may ` +
        `not be undefined.`
      );
    }

    var type = '@@redux/PROBE_UNKNOWN_ACTION_' + Math.random().toString(36).substring(7).split('').join('.');
    if (typeof reducer(undefined, { type }) === 'undefined') {
      throw new Error(
        `Reducer "${key}" returned undefined when probed with a random type. ` +
        `Don't try to handle ${ActionTypes.INIT} or other actions in "redux/*" ` +
        `namespace. They are considered private. Instead, you must return the ` +
        `current state for any unknown actions, unless it is undefined, ` +
        `in which case you must return the initial state, regardless of the ` +
        `action type. The initial state may not be undefined.`
      );
    }
  });
}

/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one. One handy way to obtain
 * it is to use ES6 `import * as reducers` syntax. The reducers may never return
 * undefined for any action. Instead, they should return their initial state
 * if the state passed to them was undefined, and the current state for any
 * unrecognized action.
 *
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 */

export default function combineReducers(reducers) {
  // 返回一个对象, key => value 且value是function(其实就是过滤掉非function)
  var finalReducers = pick(reducers, (val) => typeof val === 'function');
  var sanityError;

  try {
    // 对所有的子reducer 做一些合法性断言,如果没有出错再继续下面的处理
    // 合法性断言的内容,见API注释
    assertReducerSanity(finalReducers);
  } catch (e) {
    sanityError = e;
  }

  // 所有的 key: value,将value置成了undefined,费解...
  // 总而言之, 初始state 就是 类似 {hello: undefined, world: undefined} 的东东
  // TODO 确认这里的逻辑
  var defaultState = mapValues(finalReducers, () => undefined);

  return function combination(state = defaultState, action) {
    if (sanityError) {
      throw sanityError;
    }

    var hasChanged = false;
    // 这段代码,简单的说,就是循环一遍 finalState[key] = fn(reducer, key)
    var finalState = mapValues(finalReducers, (reducer, key) => {
      var previousStateForKey = state[key];
      var nextStateForKey = reducer(previousStateForKey, action);
      if (typeof nextStateForKey === 'undefined') {
        // 其他一个reducer返回的是undefined,于是挂啦...抛出错误
        var errorMessage = getUndefinedStateErrorMessage(key, action);
        throw new Error(errorMessage);
      }
      // 这段代码有些费解,从redux的设计理念上来讲,除了不认识的action type,其他情况都应该返回全新的state
      // 也就是说
      // 1. action type 认识,返回新的state,于是这里 hasChanged 为 true
      // 2. action type 不认识,返回原来的state,于是这里 hasChanged 为 false
      // 3. 不管action type 是否认识, 在原来的state上修改,但是返回的是修改后的state(没有返回拷贝),那么,hasChanged还是为false
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
      return nextStateForKey;
    });

    // 开发环境中(于是记得在生产环境去掉)
    // 后面再研究这段代码,毕竟不是主线路...
    if (process.env.NODE_ENV !== 'production') {
      var warningMessage = getUnexpectedStateKeyWarningMessage(state, finalState, action);
      if (warningMessage) {
        console.error(warningMessage);
      }
    }

    return hasChanged ? finalState : state;
  };
}
```


四、bindActionCreator.js
---

> https://github.com/reactjs/redux/blob/master/src/bindActionCreators.js

- 先看个简单例子可能方便理解一些

```javascript
var addTodo = function(text){
    return {
        type: 'add_todo',
        text: text
    };
};

var addTodos = function(){
    return {
        type: 'add_todos',
        items: Array.prototype.slice.call(arguments, 0)
    };
};

var reducer = function(state, action){
    switch (action.type) {
        case 'add_todo':
            return state.concat(action.text);
        case 'add_todos':
            return state.concat(action.items);
        default:
            return state;
    }
};


var store = redux.createStore(reducer, []);
// 注意,关键代码在这里
var actions = redux.bindActionCreators({
    addTodo: addTodo,
    addTodos: addTodos
}, store.dispatch);

console.log('state is: ' + store.getState());

store.dispatch({type: 'add_todo', text: '读书'});
store.dispatch({type: 'add_todos', items: ['阅读', '睡觉']});
console.log('state is: ' + store.getState());  // state is: 读书,阅读,睡觉

actions.addTodo('看电影');
console.log('state is: ' + store.getState());  // state is: 读书,阅读,睡觉,看电影

actions.addTodos(['刷牙', '洗澡']);
console.log('state is: ' + store.getState());  // state is: 读书,阅读,睡觉,看电影,刷牙,洗澡
```

- 直接看代码

```javascript
import mapValues from '../utils/mapValues';

function bindActionCreator(actionCreator, dispatch) {
  return (...args) => dispatch(actionCreator(...args));
}

/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call so they
 * may be invoked directly. This is just a convenience method, as you can call
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
 *
 * For convenience, you can also pass a single function as the first argument,
 * and get a function in return.
 *
 * @param {Function|Object} actionCreators An object whose values are action
 * creator functions. One handy way to obtain it is to use ES6 `import * as`
 * syntax. You may also pass a single function.
 *
 * @param {Function} dispatch The `dispatch` function available on your Redux
 * store.
 *
 * @returns {Function|Object} The object mimicking the original object, but with
 * every action creator wrapped into the `dispatch` call. If you passed a
 * function as `actionCreators`, the return value will also be a single
 * function.
 */
// 假设 actionCreators === {addTodo: addTodo, removeTodo: removeTodo}
// 简单的来说 bindActionCreators(actionCreators, dispatch)
// 最后返回的是:
// {
//   addTodo: function(text){
//      dispatch( actionCreators.addTodo(text) );
//   },
//   removeTodo: function(text){
//      dispatch( actionCreators.removeTodo(text) );
//   }
// }
//
//  或者说 actionCreators === addTodo (addTodo 为 actionCreator)
//  最后返回的是
//  function() {
//     dispatch(actionCreators());
//  }
export default function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch);
  }

  if (typeof actionCreators !== 'object' || actionCreators === null || actionCreators === undefined) {  // eslint-disable-line no-eq-null
    throw new Error(
      `bindActionCreators expected an object or a function, instead received ${actionCreators === null ? 'null' : typeof actionCreators}. ` +
      `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    );
  }

  return mapValues(actionCreators, actionCreator =>
    bindActionCreator(actionCreator, dispatch)
  );
}
```

五、applyMiddleware.js
---

> https://github.com/reactjs/redux/blob/master/src/applyMiddleware.js

- 中间件应该是`redux`源码里面最绕的一部分

**例子：redux-thunk**

```javascript
export default function thunkMiddleware({ dispatch, getState }) {
  return next => action =>
    typeof action === 'function' ?
      action(dispatch, getState) :
      next(action);
}
```

```javascript

//es5
function thunkMiddleware(store) {
  var dispatch = store.dispatch;
  var getState = store.getState;

  return function (next) {
    return function (action) {
      return typeof action === 'function' ? action(dispatch, getState) : next(action);
    };
  };
}
```

**自定义中间件：logger**

- 先看`logger`的实现

```javascript
function middleware(store){
    return function(next){
        return function(action){
            return next(action);
        }
    }
}
```

> 基本看出中间件声明的模版来了，就是下面这个样子。下面结合`applyMiddleware`的调用，来说明`store`、`next`、`action` 几个参数。

```javascript
function logger(store){
    return function(next){
        return function(action){
            console.log('logger: dispatching ' + action.type);
            var result = next(action);
            console.log('logger: next state ' + result);
            return result;
        }
    }
}
```

**applyMiddleware调用例子**

- `applyMiddleware` 的调用方式为 `applyMiddleware(...middlewares)(react.createStore)`。其实这里直接先创建 `store`，然后`applyMiddleware(...middlewares)(store)` 也很容易实现相同的效果，不过作者是故意这样设计的，为了避免在同一个store上多次应用同一个`middlerware`
- 中间件顶层的`store`参数，并不是常规的`store`，虽然它也有 `getState`、`dispatch` 两个方法

```javascript
// 上面的store参数，其实就是这个对象
// 其中，store 为内部的store，我们在外面 storeWithMiddleWare.dipatch的时候，内部实现是转成 store.dispatch
// 此外，可以看到 middlewareAPI.dispatch 方法，是最终封装后的dispatch（千万注意，如果在中间件内部 调用 store.dispatch，可能导致死循环 ）
var middlewareAPI = {
  getState: store.getState,
  // 最后面, dispatch 被覆盖, 变成包装后的 dispatch 方法
  dispatch: (action) => dispatch(action)
};
```

- 第二层的next函数，其实是一个“dispatch”方法
- storeWithMiddleWare.dispatch(action) 的时候，会顺序进入各个中间件（按照定义时的顺序）。从当前的例子来看，大约如下，其实就是柯里化啦

```javascript
storeWithMiddleWare.dispatch(action) --> logger(store)(next)(action) --> timer(store)(next)(action) --> store.dispatch(action)
```

**完整的示例代码**

```javascript
function reducer(state, action){
    if(typeof state==='undefined') state = [];

    switch(action.type){
        case 'add_todo':
            return state.concat(action.text);
        default: 
            return state;
    }
}

function addTodo(text){
    return {
        type: 'add_todo',
        text: text
    };
}

// 这里的 store，并不是 redux.createStore(reducer, initialState) 出来的 store
// 而是 {getState: store.getState, dispatch: function() { store.dispatch(action); }}
// 
function logger(store){    
    //     
    return function(next){
        return function(action){
            console.log('logger: dispatching ' + action.type);
            var result = next(action);
            console.log('logger: next state ' + result);
            return result;
        }
    }
}

function timer(store){
    return function(next){
        return function(action){
            console.log('timer: dispatching ' + action.type);
            var result = next(action);
            console.log('timer: next state ' + result);
            return result;
        }
    }
}

var createStoreWidthMiddleware = redux.applyMiddleware(
    logger, 
    timer
    )(redux.createStore);

var storeWithMiddleWare = createStoreWidthMiddleware(reducer);
storeWithMiddleWare.subscribe(function(){
    console.log('subscribe: state is : ' + storeWithMiddleWare.getState());
});
console.log( storeWithMiddleWare.dispatch(addTodo('reading')) );
```

**源码解析**


```javascript
import compose from './compose';

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */
/*
  从调用方法 applyMiddleware(...middlewares)(Redux.createStore) 可以看出
  next 参数实际上是 Redux.createStore. 而 Redux.createStore 的调用方式为 Redux.createStore(reducer, initialState)
  所以 applyMiddleware(...middlewares)
  1. 参数: Redux.createStore
  2. 返回值:一个function, 跟 Redux.createStore 接受的参数一样

 */
export default function applyMiddleware(...middlewares) {
  return (next) => (reducer, initialState) => {
    // 内部先创建一个store (相当于直接调用 Redux.createStore(reducer, initialState))
    var store = next(reducer, initialState);
    // 保存最初始的store.dispatch
    var dispatch = store.dispatch;
    var chain = [];

    var middlewareAPI = {
      getState: store.getState,
      // 最后面, dispatch 被覆盖, 变成包装后的 dispatch 方法
      dispatch: (action) => dispatch(action)
    };
    // 返回一个数组
    // 贴个例子在这里做参考,redux-thunk
    // function thunkMiddleware(store) {
    //  var dispatch = store.dispatch;
    //  var getState = store.getState;
    //
    //  这里的next其实就是dispatch
    //  return function (next) {
    //    return function (action) {
    //      return typeof action === 'function' ? action(dispatch, getState) : next(action);
    //    };
    //  };
    //}
    /*
      chain 是个数组, 参考上面的 middlleware (redux-thunk),可以看到,chain的每个元素为如下形式的function
      并且, 传入的 store.getState 为原始的 store.getState,而 dispatch则是包装后的 dispatch(不是原始的store.dispatch)
      似乎是为了确保, 在每个middleware里调用 dispatch(action), 最终都是 用原始的 store.dispatch(action)
      避免 store.dispatch 被覆盖, 导致middleware 顺序调用的过程中, store.dispatch的值变化 --> store.dispatch 返回的值可能会有不同
      违背 redux 的设计理念

      这里的 next 则为 原始的 store.dispatch (见下面 compose(...chain)(store.dispatch) )
      function (next) {
        return function (action) {

        }
      }
     */
    chain = middlewares.map(middleware => middleware(middlewareAPI));

    // compose(...chain)(store.dispatch) 返回了一个function
    // 伪代码如下,
    // function (action) {
    //   middleware(store)(store.dispatch);
    // }
    dispatch = compose(...chain)(store.dispatch);  // 从右到左, middleware1( middleware2( middleware3(dispatch) ) )

    // 于是,最终调用 applyMiddleware(...middlewares)(Redux.createStore)
    // 返回的 store, getState,subscribe 方法都是原始的那个 store.getState, store.subscribe
    // 至于dispatch是封装过的
    return {
      ...store,
      dispatch
    };
  };
}
```

