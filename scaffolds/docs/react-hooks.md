---
title: React之Hooks
date: 2019-09-01 16:30:40
tags: 
   - React
   - Hooks
categories: Front-End
---

## 一、组件类的缺点

> `React` 的核心是组件。`v16.8`版本之前，组件的标准写法是类（class）。下面是一个简单的组件类

```js

import React, { Component } from "react";

export default class Button extends Component {
  constructor() {
    super();
    this.state = { buttonText: "Click me, please" };
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() {
    this.setState(() => {
      return { buttonText: "Thanks, been clicked!" };
    });
  }
  render() {
    const { buttonText } = this.state;
    return <button onClick={this.handleClick}>{buttonText}</button>;
  }
}
```

这个组件类仅仅是一个按钮，但可以看到，它的代码已经很"重"了。真实的 React App 由多个类按照层级，一层层构成，复杂度成倍增长。再加入 Redux，就变得更复杂

## 二、Hook 的含义

- `React Hooks` 的意思是，组件尽量写成纯函数，如果需要外部功能和副作用，就用钩子把外部代码"钩"进来。 `React Hooks` 就是那些钩子。
- 你需要什么功能，就使用什么钩子。`React` 默认提供了一些常用钩子，你也可以封装自己的钩子。
- 所有的钩子都是为函数引入外部功能，所以 `React` 约定，钩子一律使用use前缀命名，便于识别。你要使用 `xxx` 功能，钩子就命名为 `usexxx`


**React 默认提供的四个最常用的钩子**

- `useState()`
- `useContext()`
- `useReducer()`
- `useEffect()`

## 三、useState()：状态钩子

> `useState()`用于为函数组件引入状态（`state`）。纯函数不能有状态，所以把状态放在钩子里面。

用户点击按钮，会导致按钮的文字改变，文字取决于用户是否点击，这就是状态。使用`useState()`重写如下

```js
import React, { useState } from "react";

export default function  Button()  {
  const  [buttonText, setButtonText] =  useState("Click me,   please");

  function handleClick()  {
    return setButtonText("Thanks, been clicked!");
  }

  return  <button  onClick={handleClick}>{buttonText}</button>;
}
```

上面代码中，Button 组件是一个函数，内部使用useState()钩子引入状态。

> `useState()`这个函数接受状态的初始值，作为参数，上例的初始值为按钮的文字。该函数返回一个数组，数组的第一个成员是一个变量（上例是`buttonText`），指向状态的当前值。第二个成员是一个函数，用来更新状态，约定是set前缀加上状态的变量名（上例是`setButtonText`）

## 四、useContext()：共享状态钩子

- 如果需要在组件之间共享状态，可以使用·useContext()·。
- 现在有两个组件 ·Navbar ·和 ·Messages·，我们希望它们之间共享状态

```html
<div className="App">
  <Navbar/>
  <Messages/>
</div>
```

> 第一步就是使用 `React Context API`，在组件外部建立一个 `Context`。

```js
const AppContext = React.createContext({});
```

组件封装代码如下。

```html
<AppContext.Provider value={{
  username: 'superawesome'
}}>
  <div className="App">
    <Navbar/>
    <Messages/>
  </div>
</AppContext.Provider>
```

> 上面代码中，`AppContext.Provider`提供了一个 `Context` 对象，这个对象可以被子组件共享。

Navbar 组件的代码如下。

```js
const Navbar = () => {
  const { username } = useContext(AppContext);
  return (
    <div className="navbar">
      <p>AwesomeSite</p>
      <p>{username}</p>
    </div>
  );
}
```

> 上面代码中，`useContext()`钩子函数用来引入` Context` 对象，从中获取`username`属性。

Message 组件的代码也类似。

```js
const Messages = () => {
  const { username } = useContext(AppContext)

  return (
    <div className="messages">
      <h1>Messages</h1>
      <p>1 message for {username}</p>
      <p className="message">useContext is awesome!</p>
    </div>
  )
}
```

## 五、useReducer()：action 钩子

- React 本身不提供状态管理功能，通常需要使用外部库。这方面最常用的库是 Redux。
- Redux 的核心概念是，组件发出 `action` 与状态管理器通信。状态管理器收到 `action `以后，使用 `Reducer` 函数算出新的状态，`Reducer` 函数的形式是`(state, action) => newState`。
- `useReducers()`钩子用来引入 `Reducer` 功能。

```js
const [state, dispatch] = useReducer(reducer, initialState);
```

> 上面是`useReducer()`的基本用法，它接受` Reducer` 函数和状态的初始值作为参数，返回一个数组。数组的第一个成员是状态的当前值，第二个成员是发送 `action` 的`dispatch`函数。

下面是一个计数器的例子。用于计算状态的 Reducer 函数如下。

```js
const myReducer = (state, action) => {
  switch(action.type)  {
    case('countUp'):
      return  {
        ...state,
        count: state.count + 1
      }
    default:
      return  state;
  }
}
```

```js
function App() {
  const [state, dispatch] = useReducer(myReducer, { count:   0 });
  return  (
    <div className="App">
      <button onClick={() => dispatch({ type: 'countUp' })}>
        +1
      </button>
      <p>Count: {state.count}</p>
    </div>
  );
}
```

> 由于 Hooks 可以提供共享状态和 Reducer 函数，所以它在这些方面可以取代 Redux。但是，它没法提供中间件（middleware）和时间旅行（time travel），如果你需要这两个功能，还是要用 Redux

## 六、useEffect()：副作用钩子

> `useEffect()`用来引入具有副作用的操作，最常见的就是向服务器请求数据。以前，放在`componentDidMount`里面的代码，现在可以放在`useEffect()`。

`useEffect()`的用法如下。

```js
useEffect(()  =>  {
  // Async Action
}, [dependencies])
```

> 上面用法中，`useEffect()`接受两个参数。第一个参数是一个函数，异步操作的代码放在里面。第二个参数是一个数组，用于给出 Effect 的依赖项，只要这个数组发生变化，`useEffect()`就会执行。第二个参数可以省略，这时每次组件渲染时，就会执行`useEffect()`。

```js
const Person = ({ personId }) => {
  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState({});

  useEffect(() => {
    setLoading(true); 
    fetch(`https://swapi.co/api/people/${personId}/`)
      .then(response => response.json())
      .then(data => {
        setPerson(data);
        setLoading(false);
      });
  }, [personId])

  if (loading === true) {
    return <p>Loading ...</p>
  }

  return <div>
    <p>You're viewing: {person.name}</p>
    <p>Height: {person.height}</p>
    <p>Mass: {person.mass}</p>
  </div>
}
```

> 上面代码中，每当组件参数`personId`发生变化，`useEffect()`就会执行。组件第一次渲染时，`useEffect()`也会执行
