---
title: 浅析 redux-saga 中间件及用法，对比 redux-thunk
description: 从 redux 的副作用处理讲起，拆 redux-thunk 十几行源码和它的局限，再逐个说清 redux-saga 的 take、call、put、select、fork、takeEvery 等 Effect，配登录登出完整案例和选型建议。
date: 2018-08-29 19:20:20
tags: 
 - Redux
 - 中间件
 - redux-saga
 - 异步处理
categories: Front-End
---

项目里第一次出现「点两下登录按钮发了两个请求」这种问题的时候，我用 redux-thunk 的写法是在 action 里加一个 `loading` 标记位挡住。挡是挡住了，但接着又来了「切页面时要取消上一个未完成的请求」「登录成功后自动拉一次列表，拉列表失败不影响登录状态」这类需求，标记位越加越多，一个 action 文件里塞满了 `if (loading) return`。

那时候才意识到 thunk 解决的只是「redux 能不能接受异步」，没解决「异步流程怎么编排」。redux-saga 补的正是后面这块。这篇从 redux 为什么需要中间件讲起，拆 thunk 那十几行源码，再把 saga 的几个核心 Effect 逐个过一遍，最后配两个完整案例。文章写于 2018 年，末尾我另外补了一节现在的选型判断。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- redux 的数据流为什么装不下副作用，中间件插在哪个位置
- redux-thunk 的完整源码，以及它为什么只有十几行
- thunk 的局限：action 形式不统一、异步逻辑分散
- redux-saga 的 watch / worker 工作模式和它的四个优点
- `take`、`call`、`put`、`select`、`fork`、`takeEvery`、`takeLatest` 逐个拆
- 阻塞调用和非阻塞调用的差别，以及它导致的真实体验问题
- 一个登录登出加列表加载的完整案例，和一套工程化目录结构
- thunk 和 saga 到今天该怎么选

## 一、redux-thunk

### 1.1 redux 的副作用处理

先看 redux 原本的数据流长什么样：

```
UI—————>action（plain）—————>reducer——————>state——————>UI
```

![redux 原始数据流示意图，从 UI 到 action 到 reducer 再回到 UI](https://s.poetries.top/gitee/2019/10/484.png)

`redux` 是遵循函数式编程规则的。上述数据流中，`action` 是一个原始 js 对象（plain object），`reducer` 是一个纯函数。对于同步且没有副作用的操作，这条流水线足以管理数据、控制视图层更新。

问题出在「纯函数」这三个字上。发请求、读 localStorage、setTimeout 这些都是副作用，塞进 reducer 就破坏了纯度，reducer 一旦不纯，时间旅行调试和可预测性就全废了。

所以如果存在副作用函数，我们需要先处理副作用，然后生成原始的 js 对象。`redux` 的选择是在发出 `action` 到 `reducer` 处理函数之间插一层中间件来处理。

增加中间件之后的数据流大致如下：

```
UI——>action(side function)—>middleware—>action(plain)—>reducer—>state—>UI
```

![redux 加入中间件处理副作用后的数据流示意图](https://s.poetries.top/gitee/2019/10/485.png)

在有副作用的 `action` 和原始的 `action` 之间增加中间件处理，从图里能看出中间件的职责只有一个：把异步操作转换掉，生成原始的 action。这样 `reducer` 函数就能处理相应的 action，从而改变 `state`、更新 `UI`。

这个设计我觉得挺聪明的。它没有去改 reducer 的规则，而是在 action 到达 reducer 之前加了一道「提纯」工序，脏活全在中间件里干完，reducer 那边看到的永远是干净的普通对象。中间件机制本身是怎么用 `compose` 串起来的，我在 [手写一个迷你版 Redux](https://feinterview.poetries.top/blog/react-redux) 里逐行实现过。

### 1.2 redux-thunk 源码

在 redux 中，thunk 是 redux 作者给出的中间件，实现极为简单，十几行代码：

```javascript
function createThunkMiddleware(extraArgument) {
  return ({ dispatch, getState }) => next => action => {
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument);
    }

    return next(action);
  };
}

const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

export default thunk;
```

这几行代码做的事情很简单：判别 action 的类型，如果 action 是函数，就调用这个函数，调用的形式为

```
action(dispatch, getState, extraArgument);
```

传进去的实参是 `dispatch` 和 `getState`，所以我们定义 thunk 形式的 action 时，形参一般就写这两个。如果 action 不是函数，就 `next(action)` 原样往下传给下一个中间件，跟没装过一样。

值得多看一眼的是这行嵌套箭头函数：`({ dispatch, getState }) => next => action => {}`。这就是 redux 中间件的标准签名，三层柯里化，第一层拿 store 的能力，第二层拿链条上的下一环，第三层才是真正处理 action 的地方。所有 redux 中间件都长这个样子，看懂这一个就都看懂了。

`withExtraArgument` 是给依赖注入用的。比如你想在所有 thunk 里都能直接拿到 axios 实例，就 `applyMiddleware(thunk.withExtraArgument(api))`，之后每个 thunk 的第三个参数就是它，省得到处 import。

### 1.3 redux-thunk 的缺点

thunk 的缺点也很明显。它仅仅做了「执行这个函数」这一件事，并不在乎函数主体内是什么。thunk 使得 redux 可以接受函数作为 action，但函数内部可以写成什么样完全没有约束。

比如下面是一个获取商品列表的异步操作所对应的 action：

```javascript
export default ()=>(dispatch)=>{
    fetch('/api/goodList',{ //fecth返回的是一个promise
      method: 'get',
      dataType: 'json',
    }).then(function(json){
      var json=JSON.parse(json);
      if(json.msg==200){
        dispatch({type:'init',data:json.data});
      }
    },function(error){
      console.log(error);
    });
};
```

从这个具有副作用的 action 里能看出，函数内部相当复杂：fetch 的配置、状态码判断、JSON 解析、错误处理全挤在一起。如果每一个异步操作都要这么定义一个 action，维护成本会飞快上涨。

具体不易维护的地方有两处。一是 action 的形式不统一，同步的是对象，异步的是函数，处理它们的心智模型完全不同。二是异步操作太分散，散落在各个 action 文件里，你想知道这个项目一共发了多少种请求，只能靠全局搜索。

这里还有个更细的问题：这段代码基本没法做单元测试。要测它就得 mock 掉 `fetch`，而 `fetch` 是在函数内部直接调用的，你没有插手的余地。

## 二、redux-saga 简介

`redux-saga` 是一个 redux 中间件，它有四个特性：集中处理 redux 副作用问题；被实现为 generator；属于类 `redux-thunk` 的中间件；采用 watch / worker（监听到执行）的工作形式。

最后那条是它和 thunk 结构上最大的差别。thunk 是「你 dispatch 一个函数，我帮你执行」，saga 是「你正常 dispatch 普通对象，我在旁边一直盯着，看到感兴趣的就自己动手」。UI 那边根本不知道 saga 存在。

**redux-saga 的优点**

- 集中处理了所有的异步操作，异步接口部分一目了然
- `action` 是普通对象，这跟 redux 同步的 action 一模一样
- 通过 `Effect`，方便异步接口的测试
- 通过 worker 和 watcher 可以实现非阻塞异步调用，同时还能实现非阻塞调用下的事件监听
- 异步操作的流程是可以控制的，可以随时取消相应的异步操作

第三条我想多说两句，因为它是 saga 最被低估的价值。saga 里所有副作用都不是直接执行的，而是先 `yield` 一个描述对象出来，由中间件负责真正执行。测试的时候你只要检查「它 yield 出来的描述对象对不对」，完全不用 mock 网络层。这个设计是真的舒服。

**基本用法**

使用 `createSagaMiddleware` 方法创建 saga 的 Middleware，然后在创建 redux 的 store 时，用 `applyMiddleware` 函数把 saga Middleware 实例绑定到 store 上，最后调用 saga Middleware 的 `run` 函数来执行某个或者某些 saga。

在 saga 里，可以使用 `takeEvery` 或者 `takeLatest` 等 API 监听某个 action。当某个 action 触发后，saga 用 `call` 发起异步操作，操作完成后使用 `put` 函数触发新的 action，同步更新 state，从而完成整个 State 的更新。

## 三、redux-saga 使用案例

`redux-saga` 是受控执行的 generator。在 redux-saga 中 action 是原始的 js 对象，所有异步副作用操作都放在 saga 函数里面。这样既统一了 action 的形式，又让异步操作能被集中处理。

redux-saga 是通过 generator 实现的，如果运行环境不支持 generator，需要通过 `babel-polyfill` 转义。这一条在 2018 年还挺重要，那会儿要兼容的浏览器版本比现在低不少。

先从一个输出 `hello saga` 的最小例子开始。

**创建一个 helloSaga.js 文件**

```javascript
export function * helloSaga() {
  console.log('Hello Sagas!');
}
```

这个 generator 现在什么都没做，只是打印一句话，用来验证 saga 确实被中间件跑起来了。

**在 redux 中使用 redux-saga 中间件**

接下来在 `main.js` 里把中间件装上：

```javascript
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { helloSaga } from './sagas'
const sagaMiddleware=createSagaMiddleware();
const store = createStore(
 reducer,
 applyMiddleware(sagaMiddleware)
);
sagaMiddleware.run(helloSaga);
//会输出Hello, Sagas!
```

和调用 redux 的其他中间件一样，想使用 redux-saga 中间件，只要在 `applyMiddleware` 中传入一个 `createSagaMiddleware` 的实例。唯一不同的是需要额外调用 `run` 方法，generator 才会开始执行。

这个 `run` 是必须的，忘了它就是新手最常见的「saga 一点反应都没有」。原因是 saga 不像别的中间件那样被动等 action，它需要主动启动一个根 generator 来铺开所有监听。

## 四、redux-saga 使用细节

### 4.1 声明式的 Effect

redux-saga 提供了一系列 API，比如 `take`、`put`、`all`、`select` 等，这些 API 统称为 Effect。这些 Effect 执行后会返回一个描述对象，redux-saga 中间件根据这个描述对象去真正执行，执行完再恢复 generator 往下走。

关键点在于「描述」两个字。`call(fetch, url)` 这行代码并不发请求，它只是造了一个对象说「请帮我调用 fetch，参数是 url」。真正发请求的是中间件。

**redux-thunk 的大体过程**

`action1(side function)` -> `redux-thunk` 监听 -> 执行相应的有副作用的方法 -> `action2(plain object)`

![redux-thunk 处理副作用的流程示意图](https://s.poetries.top/gitee/2019/10/486.png)

转化后的 `action2` 是一个原始 js 对象形式的 action，然后执行 reducer 函数就会更新 store 中的 state。

**redux-saga 的大体过程**

`action1(plain object)` -> redux-saga 监听 -> 执行相应的 Effect 方法 -> 返回描述对象 -> 恢复执行异步和副作用函数 -> `action2(plain object)`

![redux-saga 通过 Effect 描述对象处理副作用的流程示意图](https://s.poetries.top/gitee/2019/10/487.png)

对比两张图能看出差别：redux-saga 监听到的是原始 js 对象 action，并且不会马上执行副作用操作，而是先通过 Effect 方法把它转化成一个描述对象，再拿这个描述对象作为标识，恢复执行副作用函数。

那多这一层描述对象到底图什么呢？

图的就是测试和可控。副作用不由你的代码直接触发，中间件就有机会在中间做取消、超时、竞态处理，测试时也可以只断言描述对象而不真的发请求。thunk 那边做不到这些，因为 `fetch` 已经在你的函数里被硬编码执行了。

### 4.2 Effect 提供的具体方法

下面介绍几个常用的 Effect，包括低阶 API（`take`、`call`、`apply`、`fork`、`put`、`select`）和高阶 API（`takeEvery`、`takeLatest`）。

```javascript
import { take, call, put, select, fork, takeEvery, takeLatest } from 'redux-saga/effects'
```

#### 4.2.1 take

`take` 用来监听 action，返回的是监听到的 action 对象。比如有这么一个 action：

```javascript
const loginAction = {
   type: 'login'
}
```

在 `UI Component` 中 dispatch 一个 action：

```javascript
dispatch(loginAction)
```

在 saga 中这样接：

```javascript
const action = yield take('login');
```

它能监听到 UI 传递到中间件的 action，`take` 方法的返回值就是 dispatch 的那个原始对象。一旦监听到 `login` 动作，返回的 action 为：

```javascript
{
  type: 'login'
}
```

这里有个特点要留意：`take` 是一次性的。它拿到一个 action 之后就往下走了，想持续监听得自己套一个 `while(true)`。后面案例里满屏的 `while(true)` 就是这么来的，不是写错了。

#### 4.2.2 call 和 apply

`call` 和 `apply` 与 js 中的 `call`、`apply` 相似，我们以 `call` 为例：

```
call(fn, ...args)
```

`call` 调用 `fn`，参数为 `args`，返回一个描述对象。这里传入的 `fn` 可以是普通函数，也可以是 generator。`call` 应用很广泛，redux-saga 里发异步请求基本都靠它：

```javascript
yield call(fetch, '/userInfo', username)
```

要记住的一点是 `call` 会阻塞。写在它后面的语句必须等它 resolve 之后才能执行，这个特性在 5.2 节会引出一个真实的体验问题。

#### 4.2.3 put

redux-saga 作为中间件，工作流是这样的：

```
UI——>action1————>redux-saga中间件————>action2————>reducer..
```

从工作流能看出，redux-saga 执行完副作用函数后必须发出 action，这个 action 被 reducer 监听到，才能达到更新 state 的目的。这里的 `put` 对应的就是 redux 中的 `dispatch`，流程图如下：

![put 发出 action 到 reducer 的工作流程图](https://s.poetries.top/gitee/2019/10/488.png)

redux-saga 执行副作用方法转化 action 时，`put` 这个 Effect 跟 redux 原始的 `dispatch` 相似，都能发出 action，且发出的 action 都会被 reducer 监听到。用法是：

```javascript
yield put({ type: 'login' })
```

差别在于 `put` 同样是声明式的，它返回描述对象，由中间件去 dispatch。所以在测试里你能直接断言「这个 saga 应该 put 出一个 type 为 login 的 action」。

#### 4.2.4 select

`put` 与 redux 中的 `dispatch` 相对应，同样地，如果我们想在中间件里获取 state，那就需要 `select`。`select` 对应的是 redux 中的 `getState`，用于获取 store 中的 state：

```javascript
const id = yield select(state => state.id);
```

用它的时候有个坑：`select` 拿到的是调用那一刻的快照。如果你在 `yield call(...)` 之前 select 了一个值，等请求回来再用它，中间这段时间 state 可能已经被别的 action 改过了。需要最新值就在用之前重新 select 一次。

#### 4.2.5 fork

`fork` 方法的效果类似 web worker 那种「另起一条线去跑」的感觉，它不会阻塞主线程，在非阻塞调用中十分有用。

需要说清楚的是它并不是真的开线程，JS 还是单线程的。`fork` 做的事是启动一个子任务然后立刻返回，不等它完成，后面的语句照常往下执行。所以它更准确的说法是「非阻塞地派生一个任务」。

和它配套的还有 `cancel`，可以主动取消一个 fork 出来的任务，这正是 thunk 完全做不到的那类能力。

#### 4.2.6 takeEvery 和 takeLatest

`takeEvery` 和 `takeLatest` 用于监听相应的动作并执行相应的方法，是构建在 `take` 和 `fork` 上面的高阶 API。比如要监听 `login` 动作，用 `takeEvery` 可以这么写：

```javascript
takeEvery('login', loginFunc)
```

`takeEvery` 监听到 `login` 动作就会执行 `loginFunc` 方法。它的特点是每一次触发都会派生一个新任务，多个同名 action 连着来，就会有多个 `loginFunc` 同时在跑。

`takeLatest` 的调用方式完全一样：

```javascript
takeLatest('login', loginFunc)
```

与 `takeEvery` 不同的是，`takeLatest` 只保留最近一次被触发的那个任务，前面还没跑完的会被自动取消。

原文这里把两个名字写反了（写成了「与 takeLatest 不同的是，takeLatest 会…」），这次顺手改对。这两个的区别在实际项目里很关键：搜索框联想、按钮防重复提交这类场景用 `takeLatest`，因为你只关心最后一次的结果；而埋点上报、消息推送这种每条都不能丢的，必须用 `takeEvery`。

选错的表现挺隐蔽的。用 `takeEvery` 做搜索联想，网络抖动的时候先发的请求后回来，输入框里显示的会是旧关键词的结果，用户看不出哪里不对，只觉得「搜出来的东西不对」。

## 五、案例分析一

接着我们来实现一个 redux-saga 样例：有一个登录页，登录成功后显示列表页，并且在列表页可以点击登出返回到登录页。

这个例子看着简单，但它把 saga 的几个关键点都覆盖到了，包括受控输入、请求、流程串联，以及最后那个阻塞与非阻塞的对比。

例子的最终展示效果如下：

![登录页与登录成功后列表页的最终展示效果](https://s.poetries.top/gitee/2019/10/489.png)

样例的功能流程图为：

![登录、拉列表、登出三条链路的功能流程图](https://s.poetries.top/gitee/2019/10/490.png)

对着流程图看代码会轻松很多。整条链路是 UI 发出大写的原始 action，saga 监听到之后执行副作用，再 put 出小写的 action 给 reducer。大写小写这个约定不是语法要求，是作者用来区分「UI 发出的意图」和「saga 处理完的结果」的一个习惯，实际项目里建议换成 `USER/LOGIN_REQUEST` 和 `USER/LOGIN_SUCCESS` 这种更明确的命名。

### 5.1 LoginPanel 登录页

**实时保存用户名和密码**

用户名输入框和密码框 onchange 时触发的函数为：

```javascript
changeUsername:(e)=>{
    dispatch({type:'CHANGE_USERNAME',value:e.target.value});
 },
changePassword:(e)=>{
  dispatch({type:'CHANGE_PASSWORD',value:e.target.value});
}
```

这两个函数最后会 dispatch 两个 action，`CHANGE_USERNAME` 和 `CHANGE_PASSWORD`。注意它们都是普通对象，UI 层完全不知道 saga 的存在。

接着在 `saga.js` 文件中监听这两个动作并执行副作用函数，最后 `put` 发出转化后的 action，交给 reducer 处理：

```javascript
function * watchUsername(){
  while(true){
    const action= yield take('CHANGE_USERNAME');
    yield put({type:'change_username',
    value:action.value});
  }
}
function * watchPassword(){
  while(true){
    const action=yield take('CHANGE_PASSWORD');
    yield put({type:'change_password',
    value:action.value});
  }
}
```

最后在 reducer 中接收到 redux-saga 的 `put` 方法传递过来的 action（`change_username` 和 `change_password`），然后更新 state。

这两个 watcher 里的 `while(true)` 就是前面说的，`take` 只取一次，想一直监听就得循环。看着像死循环，实际上 `yield take(...)` 会把 generator 挂起，直到对应的 action 来了才继续，不会占 CPU。

顺着上面聊，受控输入这个场景其实没必要走 saga 绕一圈，直接 reducer 处理就好。这里这么写纯粹是为了演示 `take` 加 `put` 的最小闭环。真项目里这么干，每敲一个字符都要过一遍 saga，属于给自己找麻烦。

**监听登录事件判断登录是否成功**

在 UI 中发出的登录事件为：

```javascript
toLoginIn:(username,password)=>{
  dispatch({type:'TO_LOGIN_IN',username,password});
}
```

登录事件的 action 是 `TO_LOGIN_IN`，对应的处理函数为：

```javascript
while(true){
    // 监听登入事件
    const action1 = yield take('TO_LOGIN_IN');

    const res = yield call(fetchSmart, '/login', {
      method: 'POST',
      body: JSON.stringify({
        username: action1.username,
        password: action1.password
      })
    });

    if (res) {
      yield put({ type: 'to_login_in' });
    }
}
```

原文这段代码括号是对不上的，而且 `put` 前面漏了 `yield`，这次一并改对了。漏掉 `yield` 是个很典型的错误，因为 `put(...)` 只返回描述对象，不 yield 出去中间件就收不到，表现是「代码看着执行了但 state 没变」，非常难查。

处理函数的逻辑是：先监听原始动作，提取出传递来的用户名和密码，然后发请求判断是否登录成功，如果登录成功有返回值，就 `put` 出 `to_login_in` 这个 action。

### 5.2 LoginSuccess 登录成功列表展示页

登录成功后的页面有两个功能：获取并展示列表信息，以及登出后返回登录页面。

**获取列表信息**

```javascript
import {delay} from 'redux-saga';

function * getList(){
  try {
   yield delay(3000);
   const res = yield call(fetchSmart,'/list',{
     method:'POST',
     body:JSON.stringify({})
   });
   yield put({type:'update_list',list:res.data.activityList});
 } catch(error) {
   yield put({type:'update_list_error', error});
 }
}
```

这段有两个细节值得停一下。

一是 `try / catch` 包住了整个流程。saga 里的错误处理就是普通的 try catch，这比 thunk 那种到处 `.catch()` 直观得多，因为 generator 让异步代码长得跟同步一样。

二是那个 `delay(3000)`。为了演示请求过程，我们在本地 mock，通过 redux-saga 的工具函数 `delay` 延迟若干秒。真实请求本来就存在延迟，用 `delay` 可以在本地模拟出这种场景。

补一句版本相关的：`delay` 在 redux-saga 早期版本从 `redux-saga` 主包导出，从 v1 开始它被移到了 `redux-saga/effects`，也就是 `import { delay } from 'redux-saga/effects'`。老代码升级到 v1 之后如果报找不到 `delay`，去改这行 import 就行。

**登出功能**

```javascript
const action2 = yield take('TO_LOGIN_OUT');
yield put({ type: 'to_login_out' });
```

与登入相似，登出功能从 UI 处接收 `TO_LOGIN_OUT`，然后转发 `to_login_out`。

**完整的实现登入登出和列表展示的代码**

```javascript
function * getList(){
  try {
   yield delay(3000);
   const res = yield call(fetchSmart,'/list',{
     method:'POST',
     body:JSON.stringify({})
   });
   yield put({type:'update_list',list:res.data.activityList});
 } catch(error) {
   yield put({type:'update_list_error', error});
 }
}

function * watchIsLogin(){
  while(true){
    //监听登入事件
    const action1=yield take('TO_LOGIN_IN');
    
    const res=yield call(fetchSmart,'/login',{
      method:'POST',
      body:JSON.stringify({
        username:action1.username,
        password:action1.password
      })
    });
    
    //根据返回的状态码判断登陆是否成功
    if(res.status===10000){
      yield put({type:'to_login_in'});
      //登陆成功后获取首页的活动列表
      yield call(getList);
    }
    
    //监听登出事件
    const action2=yield take('TO_LOGIN_OUT');
    yield put({type:'to_login_out'});
  }
}
```

这段把整条业务流程串成了一个 generator，读起来是一条直线：等登录、发请求、判断状态码、通知 reducer、拉列表、等登出。这就是 saga 最大的卖点，流程可以写成顺序代码，而不是散在几个回调里。

通过请求状态码判断登录是否成功，登录成功后用这行拉列表：

```javascript
yield call(getList)
```

**这里埋着一个真实的体验问题**：`call` 方法是会阻塞的。

具体表现有三点。在 `call` 调用结束之前，它后面的语句无法执行；如果 `call(getList)` 存在延迟，后面那句 `const action2 = yield take('TO_LOGIN_OUT')` 在 `call` 返回结果之前根本不会被执行；结果就是延迟期间用户点的登出操作会被完全忽略。

![call 阻塞期间点击登出无响应的效果演示](https://s.poetries.top/gitee/2019/10/491.png)

图里就是这个现象。列表还在转圈的三秒里，登出按钮点了没有任何反应，用户只会觉得页面卡死了。

**无阻塞调用**

把这行

```javascript
yield call(getList)
```

改成

```javascript
yield fork(getList)
```

`fork` 不会阻塞后续语句，`getList` 在后台跑，`take('TO_LOGIN_OUT')` 立刻就位。这时候在白屏期间点击登出，可以立刻响应并返回登录页面。

这个 `call` 换 `fork` 的一行改动，是我认为整篇文章里最有价值的一处。它说明 saga 不只是「让异步能写进 redux」，而是把「这一步该不该等」这种流程控制决策显式地交到了你手里。thunk 里想实现同样的效果，你得自己维护一堆状态标记，还不一定做得对。

选择标准也简单：后面的语句依赖这一步的结果，用 `call`；不依赖、可以并行跑的，用 `fork`。

## 六、案例分析二

上面那个例子是把 saga 写在一起讲逻辑，这一节看看真实项目里的目录结构怎么摆。

### 6.1 配置 saga 信息

先在 `src/store/configureStore.js` 里把中间件装好：

```javascript
import { createStore, applyMiddleware, compose } from 'redux'
// import {createLogger } from 'redux-logger'
import createHistory from 'history/createBrowserHistory'
import createSagaMiddleware from 'redux-saga';
import { routerMiddleware } from 'react-router-redux'
import rootSaga from '../sagas'
import rootReducer from '../reducers/'

export const history = createHistory()

const middleware = routerMiddleware(history)

//创建saga middleware
const sagaMiddleware = createSagaMiddleware();


const configureStore = preloadedState => {
	// 安装 Redux-DevTools Chrome 插件后可用 composeEnhancers()
	const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

	const store = createStore(
		rootReducer,
		preloadedState,
		composeEnhancers(
			applyMiddleware(sagaMiddleware,middleware)
		)
	)
	sagaMiddleware.run(rootSaga);
	if (module.hot) {
		// Enable Webpack hot module replacement for reducers
		module.hot.accept('../reducers', () => {
			const nextRootReducer = require('../reducers').default
			store.replaceReducer(nextRootReducer)
		})
	}

	return store
}


export default configureStore

```

### 6.2 配置reduce

```javascript
// src/reducers/index.js
import {combineReducers} from 'redux'
import {routerReducer as routing} from 'react-router-redux'

const rootReducer = combineReducers({
      routing,
      poetry 				: require('./poetry').default
})

export default rootReducer
```

```javascript
// src/reducers/poetry.js

import * as ActionTypes from '../actions'

export default (state = {
	fetching:false,
	error:false,
	errMsg:'',
	data:[]
},action) => {
	if(action.type === ActionTypes.FETCH_POETRY_REQUEST){
		return Object.assign({...state,fetching:true,errMsg:''})
	}else if(action.type === ActionTypes.FETCH_POETRY_SUCCESS){
		const data = action.payload.data
		return Object.assign({...state,fetching:false,data,errMsg:''})
	}else if(action.type === ActionTypes.FETCH_POETRY_FAILURE){
		return Object.assign({...state,fetching:false,error:true,errMsg:action.payload.errMsg})
	}
	return state
}
```

### 6.3 处理action

```javascript
// src/action/index.js

import { createAction } from 'redux-actions';

export const COMMON_FETCHING = 'COMMON_FETCHING'
export const COMMON_OVER = 'COMMON_OVER'
export const MSG_SHOW = 'MSG_SHOW'
export const MSG_INIT = 'MSG_INIT'
export const POP_LOGIN = 'POP_LOGIN'
export const initMsg = () => ({type : MSG_INIT})


// 相比用thunk多了一步 多了个action 来触发saga woker
export const FETCH_POETRY_REQUEST = 'FETCH_POETRY_REQUEST'
export const FETCH_POETRY_SUCCESS = 'FETCH_POETRY_SUCCESS'
export const FETCH_POETRY_FAILURE = 'FETCH_POETRY_FAILURE'
export const fetchPoetryRequest = createAction(FETCH_POETRY_REQUEST)
export const fetchPoetrySuccess = createAction(FETCH_POETRY_SUCCESS)
export const fetchPoetryFauilure= createAction(FETCH_POETRY_FAILURE)

```

### 6.4 处理sagas

```javascript

// src/sagas/index.js

import { all } from 'redux-saga/effects'

export default function* rootSaga() {
    yield all([
        ...require('./fetchPoetry').default
    ])
  }
```

```javascript

// src/fetchPoetry.js

import {put,take,call,fork,takeEvery,select} from 'redux-saga/effects'
import {delay} from 'redux-saga'
import  * as api  from '../api'
import * as actionTypes from '../actions/'

// saga worker 监听FETCH_POETRY_REQUEST动作触发执行相应操作
function* fetchPoetrySaga(){
    // yield delay(100)
    // ======== 写法一 ========= 
    // yield takeEvery(actionTypes.FETCH_POETRY_REQUEST,function*(action){
    //     // 调用this.props.fetchPoetryRequest({user:'poetries',age:23}) 传参进来这里
    //     // 也可以通过这样获取state中的参数 const state = yield select()
    //     const {user,age} = action
    //     try{
    //         const data =  yield call(api.get({
    //             url:'/mock/5b7fd63f719c7b7241f4e2fa/tangshi/tang-shi'
    //         }))
    //         yield put(actionTypes.fetchPoetrySuccess({data:data.data.data}))
    //     }catch(error){
    //         yield put(actionTypes.fetchPoetryFauilure({errMsg:error.message}))
    //     }
     
    // })
    // === 写法二====
  while(true){
      // 当dispatch({type:FETCH_POETRY_REQUEST})的时候被这里监听 执行对应的请求
    const {user,age} =  yield take(actionTypes.FETCH_POETRY_REQUEST)
    try{
         const data =  yield call(api.get({
             url:'/mock/5b7fd63f719c7b7241f4e2fa/tangshi/tang-shi'
         }))
          yield put(actionTypes.fetchPoetrySuccess({data:data.data.data}))
     }catch(error){
         yield put(actionTypes.fetchPoetryFauilure({errMsg:error.message}))
     }
  }

} 


// 导出所有的saga
export default  [
    fork(fetchPoetrySaga)
]
```

> 完整代码例子 https://github.com/poetries/redux-saga-template


## 七、总结

> `redux-saga`做为`redux`中间件的全部优点

- 统一`action`的形式，在`redux-saga`中，从`UI`中`dispatch`的`action`为原始对象
- 集中处理异步等存在副作用的逻辑
- 通过转化`effects`函数，可以方便进行单元测试
- 完善和严谨的流程控制，可以较为清晰的控制复杂的逻辑



