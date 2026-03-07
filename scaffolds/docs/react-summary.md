---
title: react知识点回顾
date: 2017-11-07 19:55:24
tags: 
 - JavaScript
 - react
categories: Front-End
---

> 来源于互联网

## 一、npm的配置


> 切换淘宝镜像源

```javascript
npm config set registry https://registry.npm.taobao.org

npm config get registry

npm install -g cnpm --registry=https://registry.npm.taobao.org
```

> 使用npm安装react

```javascript
cnpm install react react-dom --save
```


## 二、开发环境配置


> 这里使用`create-react-app`初始化项目


```javascript
npm install create-react-app -g
```

> 安装完成之后就可以在命令行使用 `create-react-app` 了，首先选择一个合适的目录，然后只需要简单地输入

```javascript
create-react-app yourfilename
```

## 三、认识JSX


### 3.1 JSX 简介

> `JSX` 其是一个语法扩展，它既不是单纯的字符串，也不是` HTML`，虽然长得和 `HTML` 很像甚至基本上看起来一样。但事实上它是 `React` 内部实现的一种，允许我们直接在 `JS` 里书写 `UI` 的方式

### 3.2 JSX 属性

> `JSX` 的标签同样可以拥有自己的属性

```javascript
const title = <h1 id="main">React Learning</h1>
```

```javascript
// 注意是 className 而不是 class
const title = <h1 className="main">React Learning</h1>
```

### 3.3 JSX 嵌套

> `JSX` 的标签也可以像 `HTML` 一样相互嵌套，一般有嵌套解构的 `JSX` 元素外面，我们习惯于为它加上一个小括号


```javascript
const title = (
    <div>
        <h1 className="main">React Learning</h1>
        <p>Let's learn JSX</p>
    </div>
)
```

> 需要注意的是，`JSX` 在嵌套时，最外层有且只能有一个标签，否则就会出错

```javascript
// 这是一个错误示例
const title = (            
    <h1 className="main">React Learning</h1>
    <p>Let's learn JSX</p>
)
```

### 3.4 JSX表达式

> 在 `JSX` 元素中，我们同样可以使用 `JavaScript` 表达式，在 `JSX` 当中的表达式需要用一个大括号括起来

```javascript
function sayhi(name) {
  return 'Hi,' + name
}

const title = (
    <div>
        <h1 className="main">React Learning</h1>
        <p>Let's learn JSX. <span>{sayhi('you')}</span></p>
    </div>
)
```

## 四、组件类型


### 4.1 函数定义与类定义组件


> 第一种函数定义组件，非常简单啦，我们只需要定义一个接收`props`传值，返回`React`元素的方法即可

```javascript
function Title(props) {
  return <h1>Hello, {props.name}</h1>
}
```

```javascript
// 甚至使用ES6的箭头函数简写之后可以变成这样
const Title = props => <h1>Hello, {props.name}</h1>
```

> 第二种是类定义组件，也就是使用`ES6`中新引入的类的概念来定义`React`组件

- 组件在定义好之后，可以通过`JSX`描述的方式被引用，组件之间也可以相互嵌套和组合

```javascript
class Title extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>
  }
}
```

### 4.2 展示与容器组件


```javascript
// 展示组件

class CommentList extends React.Component {
  constructor(props) {
    super(props)
  }

  renderComment({body, author}) {
    return <li>{body}—{author}</li>
  }
  
  render() { 
    return <ul> {this.props.comments.map(this.renderComment)} </ul>
  } 
  
}
```

```javascript
// 容器组件
class CommentListContainer extends React.Component {
  constructor() {
    super()
    this.state = { comments: [] }
  }
  
  componentDidMount() {
    $.ajax({
      url: "/my-comments.json",
      dataType: 'json',
      success: function(comments) {
        this.setState({comments: comments})
      }.bind(this)
    })
  }
  
  render() {
    return <CommentList comments={this.state.comments} />
  }
}
```

**展示组件**

- 主要负责组件内容如何展示
- 从`props`接收父组件传递来的数据
- 大多数情况可以通过函数定义组件声明

**容器组件**

- 主要关注组件数据如何交互
- 拥有自身的`state`，从服务器获取数据，或与`redux`等其他数据处理模块协作
- 需要通过类定义组件声明，并包含生命周期函数和其他附加方法

**那么这样写具体有什么好处呢？**

- 解耦了界面和数据的逻辑
- 更好的可复用性，比如同一个回复列表展示组件可以套用不同数据源的容器组件
- 利于团队协作，一个人负责界面结构，一个人负责数据交互

### 4.3 有状态与无状态组件


**有状态组件**

> 这个组件能够获取储存改变应用或组件本身的状态数据，在`React`当中也就是`state`，一些比较明显的特征是我们可以在这样的组件当中看到对`this.state`的初始化，或`this.setState`方法的调用

**无状态组件**

> 这样的组件一般只接收来自其他组件的数据。一般这样的组件中只能看到对`this.props`的调用

```javascript
// 有状态组件
class StatefulLink extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      active: false
    }
  }
  handleClick() {
    this.setState({
      active: !this.state.active
    })
  }
  render() {
    return <a 
          style={{ color: this.state.active ? 'red' : 'black' }}
          onClick={this.handleClick.bind(this)}
         >
           Stateful Link
         </a>
  }
}
```

```javascript
// 无状态组件
class StatelessLink extends React.Component {
  constructor(props) {
    super(props)
  }
  handleClick() {
    this.props.handleClick(this.props.router)
  }
  render() {
    const active = this.props.activeRouter === this.props.router
    return (
        <li>
            <a 
              style={{ color: active ? 'red' : 'black' }}
              onClick={this.handleClick.bind(this)}
             >
                Stateless Link
            </a>
    </li>
    )
  }
}
```


> 在`React`的实际开发当中，我们编写的组件大部分都是无状态组件。毕竟`React`的主要作用是编写用户界面。再加上`ES6`的新特性，绝大多数的无状态组件都可以通过箭头函数简写成类似下面这样

```javascript
const SimpleButton = props => <button>{props.text}</button>
```

### 4.4 受控与非受控组件


**受控组件**

> 比如说设置了`value`的`<input>` 是一个受控组件。对于受控的`<input>`，渲染出来的`html`元素始终保持着`value`属性的值，如以下代码

![](https://poetries1.gitee.io/img-repo/2019/10/470.png)

- 此时如果想要更新用户的值。需要使用`onChange`事件

![](https://poetries1.gitee.io/img-repo/2019/10/471.png)

**非受控组件**

> 即没有设置`value`或者设置为`null`的是一个非受控组件，对于非受控的`input`组件，用户的输入会直接反映在页面上

![](https://poetries1.gitee.io/img-repo/2019/10/472.png)

- 上面的代码渲染出一个空值的输入框，用户的输入立即会反映在元素上
- 和受控组件一样，使用`onChange`事件来监听值的变化，如果想要给组件设置一个非空的初始值。可以使用`defaultValue`属
- 通常情况下，`React`当中所有的表单控件都需要是受控组件

### 4.5 组合与继承


- `React`当中的组件是通过嵌套或组合的方式实现组件代码复用的
- 通过`props`传值和组合使用组件几乎可以满足所有场景下的需求。这样也更符合组件化的理念，就好像使用互相嵌套的`DOM`元素一样使用`React`的组件，并不需要引入继承的概念



> 继承的写法并不符合`React`的理念。在`React`当中`props`其实是非常强大的，`props`几乎可以传入任何东西，变量、函数、甚至是组件本身


```javascript
function SplitPane(props) {
  return (
    <div className="SplitPane">
      <div className="SplitPane-left">
        {props.left}
      </div>
      <div className="SplitPane-right">
        {props.right}
      </div>
    </div>
  )
}

function App() {
  return (
    <SplitPane
      left={
        <Contacts />
      }
      right={
        <Chat />
      } />
  )
}
```

> React官方也希望我们通过组合的方式来使用组件，如果你想实现一些非界面类型函数的复用，可以单独写在其他的模块当中在引入组件进行使用


## 五、组件数据
---

### 5.1 props

- 传入变量
- 传入函数
- 传入组件
- `props.children`

> - 在形式上，`props`之于`JSX`就相当于`attributes`之于`HTML`。从写法上来看呢，我们为组件传入`props`就可以像为`HTML`标签添加属性一样
> - 在概念上，props对于组件就相当于JS中参数之于函数。我们可以抽象出这样一个函数来解释

- `props` 几乎可以传递所有的内容，包括变量、函数、甚至是组件本身

**props是只读的**

- 在`React`中，`props`都是自上向下传递，从父组件传入子组件
- 并且`props`是只读的，我们不能在组件中直接修改`props`的内容
- 也即是说组件只能根据传入的`props`渲染界面，而不能在其内部对`props`进行修改

**props类型检查**

> 正是因为`props`的强大，什么类型的内容都可以传递，所以在开发过程中，为了避免错误类型的内容传入，我们可以为`props`添加类型检查


**props默认值**

> 由于`props`是只读的，我们不能直接为`props`赋值。`React`专门准备了一个方法定义`props`的默认值

```javascript
import React from 'react'
import PropTypes from 'prop-types'

const Title = props => <h1>{props.title}</h1>

Title.defaultProps = {
  title: 'Wait for parent to pass props.'
}

Title.propTypes = {
  title: PropTypes.string.isRequired
}
```

### 5.2 state

- 初始化
- `setState`方法
- 向下传递数据

> - 在`React`中`state`也是我们进行数据交互的地方，又或者叫做`state management`状态管理。
> - 一个应用需要进行数据交互，比如同服务器之间的交互，同用户输入进行交互。话反过来，从`API`获取数据，处理用户输入也就是我们需要用到`state`的时候

- 在新版本的`React`当中，我们通过类定义组件来声明一个有状态组件，之后在它的构造方法中初始化组件的`state`，我们可以先赋予它默认值。
- 之后就可以在组件中通过`this.state`来访问它，既然是`state`那么肯定涉及到数据的改变，因此我们还需额外定义一个负责处理`state`变化的函数，这样的函数中一般都会包含`this.setState`这个方法
- 和之前的`props`一样，初始化`state`之后，如果我们想改变它，是不可以直接对其赋值的，直接修改`state`的值没有任何意义，因为这样的操作脱离了`React`运行的逻辑，不会触发组件的重新渲染。所以需要`this.setState`这个方法，在改变`state`的同时，触发`React`内部的一系列函数，最后在页面上重新渲染出组件

```javascript
class Counter extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      counter: 0
    }
  }
  
  addOne() {
    this.setState((prevState) =>({
      counter: prevState.counter + 1
    }))
  }
  
  render() {
    return (
      <div>
        <p>{ this.state.counter }</p>
        <button
          onClick={() => this.addOne()}>
          Increment
        </button>
      </div>
    )
  }
}
```

六、组件生命周期
---

### 6.1 React是如何渲染组件的

> - 在新版本的`React`当中，`React`的底层被重写了。`React`换上了一个新的引擎，这个引擎叫做`React Fiber.React Fiber` 作用的也即是`React`最核心的功能，它将`React`应用界面更新的过程分为了两个主要的部分：

- 调度过程
- 执行过程

> 在调度过程中，有4个生命周期函数会被触发

- `componentWillMount`
- `componentWillReceiveProps`
- `shouldComponentUpdate`
- `componentWillUpdate`

> 在执行过程中，有3个生命周期函数会被触发：

- `componentDidMount`
- `componentDidUpdate`
- `componentWillUnmount`

### 6.2 React组件生命周期方法

> `React`为了方便我们更好地控制自己的应用，提供了许多预置的生命周期方法。这些固定的生命周期方法分别会在组件的挂载流程、更新流程、卸载流程中触发

- `componentWillMount` 开始插入真实DOM
- `componentDidMount` 插入真实`DOM`完成
- `componentWillUpdate` 开始重新渲染
- `componentDidUpdate` 重新渲染完成
- `componentWillUnmount `已移出真实 `DOM`
- `componentWillReceiveProps` 已加载组件收到新的参数时调用
- `shouldComponentUpdate `组件判断是否重新渲染时调用


![](https://poetries1.gitee.io/img-repo/2019/10/473.png)
![](https://poetries1.gitee.io/img-repo/2019/10/474.png)


**componentDidMount**

> 在此方法中可进行

- 与其他 `JavaScript` 框架集成，如初始化 `jQuery` 插件；
- 使用 `setTimeout`/`setInterval` 设置定时器；
- 通过 `Ajax`/`Fetch` 获取数据；
- 绑定 `DOM` 事件


### 6.3 总结

- React组件渲染包含三个流程：挂载流程、更新流程、卸载流程
- 各个生命周期函数会在特定的时刻触发并适用于不同的使用场景
- 通过使用生命周期函数我们可以对应用进行更精准的控制
- 如果你需要发起网络请求，将其安排在合适的生命周期函数中是值得推荐的做法
- 了解掌握`React`组件渲染的流程和原理对我们更深入掌握`React`非常有帮助


## 七、表单及事件处理


### 7.1 表单

> 受控与非受控组件就是专门适用于React当中的表单元素的

- 只要是有表单出现的地方，就会有用户输入，就会有表单事件触发，就会涉及的数据处理
- 在我们用`React`开发应用时，为了更好地管理应用中的数据，响应用户的输入，编写组件的时候呢，我们就会运用到受控组件与非受控组件这两个概念。


### 7.2 表单元素


> 我们在组件中声明表单元素时，一般都要为表单元素传入应用状态中的值，可以通过`state`也可以通过`props`传递，之后需要为其绑定相关事件，例如表单提交，输入改变等。在相关事件触发的处理函数中，我们需要根据表单元素中用户的输入，对应用数据进行相应的操作和改变

```javascript
class ControlledInput extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      value: ""
    }
  }

  handleChange(event) {
    this.setState({
      value: event.target.value
      })
  }

  render() {
    return <input 
              type="text" 
              value={this.state.value} 
              onChange={() => this.handleChange()} 
            />
  }
}
```

> 受控组件的输入数据是一直和我们的应用状态绑定的，事件处理函数中一定要有关`state`的更新操作，这样表单组件才能及时正确响应用户的输入


**textarea**

```html
<!--HTML-->
<textarea>
  Hello there, this is some text in a text area
</textarea>

<!--jsx-->
<textarea value={this.state.value} onChange={this.handleChange} />
```

**select**

```html
<!--HTML-->
<select>
  <option value="grapefruit">Grapefruit</option>
  <option value="lime">Lime</option>
  <option selected value="coconut">Coconut</option>
  <option value="mango">Mango</option>
</select>

<!--jsx-->
<select value={this.state.value} onChange={this.handleChange}>
    <option value="grapefruit">Grapefruit</option>
    <option value="lime">Lime</option>
    <option value="coconut">Coconut</option>
    <option value="mango">Mango</option>
</select>
```


### 7.3 事件

```html
<!--HTML-->
<button onclick="activateLasers()">
  Activate Lasers
</button>

<!--jsx-->
<button onClick={activateLasers}>
  Activate Lasers
</button>
```

## 八、redux-router

![](https://poetries1.gitee.io/img-repo/2019/10/475.png)

### 8.1、基本用法


> 使用时，路由器`Router`就是`React`的一个组件

```javascript
import { Router } from 'react-router';
render(<Router/>, document.getElementById('app'));
```

> `Router`组件本身只是一个容器，真正的路由要通过`Route`组件定义


```javascript
import { Router, Route, hashHistory } from 'react-router';

render((
  <Router history={hashHistory}>
    <Route path="/" component={App}/>
  </Router>
), document.getElementById('app'));
```

> 上面代码中，用户访问根路由`/`，组件APP就会加载到`document.getElementById('app')`

- `Router`组件有一个参数`history`，它的值`hashHistory`表示，路由的切换由`URL`的`hash`变化决定，即`URL`的`#`部分发生变化
- `Route`组件定义了`URL`路径与组件的对应关系。你可以同时使用多个`Route`组件

```javascript
<Router history={hashHistory}>
  <Route path="/" component={App}/>
  <Route path="/repos" component={Repos}/>
  <Route path="/about" component={About}/>
</Router>
```

> 上面代码中，用户访问`/repos`（比如`http://localhost:8080/#/repos`）时，加载`Repos`组件；访问`/about（http://localhost:8080/#/about）`时，加载`About`组件


### 8.2、嵌套路由


> `Route`组件还可以嵌套

```javascript
<Router history={hashHistory}>
  <Route path="/" component={App}>
    <Route path="/repos" component={Repos}/>
    <Route path="/about" component={About}/>
  </Route>
</Router>
```

> 上面代码中，用户访问`/repos`时，会先加载`App`组件，然后在它的内部再加载`Repos`组件

```javascript
<App>
  <Repos/>
</App>
```

- `App`组件要写成下面的样子

```javascript
export default React.createClass({
  render() {
    return <div>
      {this.props.children}
    </div>
  }
})
```

> `App`组件的`this.props.children`属性就是子组件


### 8.3、 path 属性


> `Route`组件的`path`属性指定路由的匹配规则。这个属性是可以省略的，这样的话，不管路径是否匹配，总是会加载指定组件

- `Route`组件的`path`属性指定路由的匹配规则。这个属性是可以省略的，这样的话，不管路径是否匹配，总是会加载指定组件

```javascript
<Route path="inbox" component={Inbox}>
   <Route path="messages/:id" component={Message} />
</Route>
```

> 当用户访问`/inbox/messages/:id`时，会加载下面的组件

```javascript
<Inbox>
  <Message/>
</Inbox>
```

> 如果省略外层`Route`的`path`参数，写成下面的样子

```javascript
<Route component={Inbox}>
  <Route path="inbox/messages/:id" component={Message} />
</Route>
```
> 现在用户访问`/inbox/messages/:id`时，组件加载还是原来的样子

```javascript
<Inbox>
  <Message/>
</Inbox>
```

### 8.4、通配符


> `path`属性可以使用通配符

```javascript
<Route path="/hello/:name">
// 匹配 /hello/michael
// 匹配 /hello/ryan

<Route path="/hello(/:name)">
// 匹配 /hello
// 匹配 /hello/michael
// 匹配 /hello/ryan

<Route path="/files/*.*">
// 匹配 /files/hello.jpg
// 匹配 /files/hello.html

<Route path="/files/*">
// 匹配 /files/ 
// 匹配 /files/a
// 匹配 /files/a/b

<Route path="/**/*.jpg">
// 匹配 /files/hello.jpg
// 匹配 /files/path/to/file.jpg
```

**通配符的规则如下**


- **:paramName**

> `:paramName`匹配`URL`的一个部分，直到遇到下一个`/`、`?`、`#`为止。这个路径参数可以通过`this.props.params.paramName`取出

- **()**

> `()`表示`URL`的这个部分是可选的

- 匹配任意字符，直到模式里面的下一个字符为止。匹配方式是非贪婪模式
- 匹配任意字符，直到下一个`/`、`?`、`#`为止。匹配方式是贪婪模式

> `path`属性也可以使用相对路径（不以`/`开头），匹配时就会相对于父组件的路径。嵌套路由如果想摆脱这个规则，可以使用绝对路由

- 此外，`URL`的查询字符串`/foo?bar=baz`，可以用`this.props.location.query.bar`获取

### 8.5、IndexRoute 组件


```javascript
<Router>
  <Route path="/" component={App}>
    <Route path="accounts" component={Accounts}/>
    <Route path="statements" component={Statements}/>
  </Route>
</Router>
```

> - 上面代码中，访问根路径`/`，不会加载任何子组件。也就是说，`App`组件的`this.props.children`，这时是`undefined`
> - 因此，通常会采用{`this.props.children` || `<Home/>}`这样的写法。这时，Home明明是`Accounts`和`Statements`的同级组件，却没有写在`Route`中
> - IndexRoute就是解决这个问题，显式指定Home是根路由的子组件，即指定默认情况下加载的子组件。你可以把`IndexRoute`想象成某个路径的`index.html`

```javascript
<Router>
  <Route path="/" component={App}>
    <IndexRoute component={Home}/>
    <Route path="accounts" component={Accounts}/>
    <Route path="statements" component={Statements}/>
  </Route>
</Router>
```

> 现在，用户访问`/`的时候，加载的组件结构如下


```javascript
<App>
  <Home/>
</App>
```

- **注意**，`IndexRoute`组件没有路径参数`path`


### 8.6、Redirect 组件


> `<Redirect>`组件用于路由的跳转，即用户访问一个路由，会自动跳转到另一个路由

```javascript
<Route path="inbox" component={Inbox}>
  {/* 从 /inbox/messages/:id 跳转到 /messages/:id */}
  ＜Redirect from="messages/:id" to="/messages/:id" />
</Route>
```

> 现在访问`/inbox/messages/5`，会自动跳转到`/messages/5`

### 8.7、IndexRedirect 组件

> `IndexRedirect`组件用于访问根路由的时候，将用户重定向到某个子组件

```javascript
<Route path="/" component={App}>
  ＜IndexRedirect to="/welcome" />
  <Route path="welcome" component={Welcome} />
  <Route path="about" component={About} />
</Route>
```

> 用户访问根路径时，将自动重定向到子组件`welcome`


### 8.8、Link


> `Link`组件用于取代`<a>`元素，生成一个链接，允许用户点击后跳转到另一个路由。它基本上就是`<a>`元素的`React` 版本，可以接收`Router`的状态

```javascript
render() {
  return <div>
    <ul role="nav">
      <li><Link to="/about">About</Link></li>
      <li><Link to="/repos">Repos</Link></li>
    </ul>
  </div>
}
```

> 如果希望当前的路由与其他路由有不同样式，这时可以使用`Link`组件的`activeStyle`属性

```javascript
<Link to="/about" activeStyle={{color: 'red'}}>About</Link>
<Link to="/repos" activeStyle={{color: 'red'}}>Repos</Link>
```

- 在`Router`组件之外，导航到路由页面，可以使用浏览器的`History API`，像下面这样写

```javascript
import { browserHistory } from 'react-router';
browserHistory.push('/some/path');
```

### 8.9、IndexLink


> 如果链接到根路由`/`，不要使用`Link`组件，而要使用`IndexLink`组件

- 是因为对于根路由来说，`activeStyle`和`activeClassName`会失效，或者说总是生效，因为`/`会匹配任何子路由。而`IndexLink`组件会使用路径的精确匹配


```javascript
<IndexLink to="/" activeClassName="active">
  Home
</IndexLink>
```

> 上面代码中，根路由只会在精确匹配时，才具有`activeClassName`


### 8.10、histroy 属性

> `Router`组件的`history`属性，用来监听浏览器地址栏的变化，并将`URL`解析成一个地址对象，供 `React Router` 匹配

- `history`属性，一共可以设置三种值。
  - `browserHistory`
  - `hashHistory`
  - `createMemoryHistory`
  
> 如果设为`hashHistory`，路由将通过`URL`的hash部分`（#）`切换，`URL`的形式类似`example.com/#/some/path`

```javascript
import { hashHistory } from 'react-router'

render(
  <Router history={hashHistory} routes={routes} />,
  document.getElementById('app')
)
```

> 如果设为`browserHistory`，浏览器的路由就不再通过`Hash`完成了，而显示正常的路径`example.com/some/path`，背后调用的是浏览器的`History API`

```javascript
import { browserHistory } from 'react-router'

render(
  <Router history={browserHistory} routes={routes} />,
  document.getElementById('app')
)
```

> 但是，这种情况需要对服务器改造。否则用户直接向服务器请求某个子路由，会显示网页找不到的`404`错误。


### 8.11、表单处理


> `Link`组件用于正常的用户点击跳转，但是有时还需要表单跳转、点击按钮跳转等操作

```javascript
<form onSubmit={this.handleSubmit}>
  <input type="text" placeholder="userName"/>
  <input type="text" placeholder="repo"/>
  <button type="submit">Go</button>
</form>
```

**第一种方法是使用browserHistory.push**

```javascript
import { browserHistory } from 'react-router'

// ...
  handleSubmit(event) {
    event.preventDefault()
    const userName = event.target.elements[0].value
    const repo = event.target.elements[1].value
    const path = `/repos/${userName}/${repo}`
    browserHistory.push(path)
  },
  ```
  
**第二种方法是使用context对象**
 
```
export default React.createClass({

  // ask for `router` from context
  contextTypes: {
    router: React.PropTypes.object
  },

  handleSubmit(event) {
    // ...
    this.context.router.push(path)
  },
})
```

### 8.12、路由的钩子

> 每个路由都有`Enter`和`Leave`钩子，用户进入或离开该路由时触发

- 上面的代码中，如果用户离开`/messages/:id`，进入`/about`时，会依次触发以下的钩子
  - `/messages/:id`的`onLeave`
  - `/inbox`的`onLeave`
  - `/about`的`onEnter`


  
## 九、redux

### 9.1 Redux 的适用场景

- 某个组件的状态，需要共享
- 某个状态需要在任何地方都可以拿到
- 一个组件需要改变全局状态
- 一个组件需要改变另一个组件的状态

**Redux设计思想**

> `Redux` 的设计思想很简单，就两句话

- `Web` 应用是一个状态机，视图与状态是一一对应的
- 所有的状态，保存在一个对象里面

### 9.2 基本概念和 API

**Store**

- `Store` 提供了三个方法
  - `store.getState()`
  - `store.dispatch()`
  - `store.subscribe()`
  
```javascript
import { createStore } from 'redux';
let { subscribe, dispatch, getState } = createStore(reducer);
```

> `Store `就是保存数据的地方，你可以把它看成一个容器。整个应用只能有一个 `Store`

- `Redux` 提供`createStore`这个函数，用来生成 `Store`

```javascript
import { createStore } from 'redux';
const store = createStore(reducer); // 返回新生成的 Store 对象
```

**State**

> `Store`对象包含所有数据。如果想得到某个时点的数据，就要对 `Store` 生成快照。这种时点的数据集合，就叫做 `State`

- 当前时刻的 `State`，可以通过`store.getState()`拿到

```javascript
import { createStore } from 'redux';
const store = createStore(reducer);

const state = store.getState();
```
> `Redux` 规定， 一个 `State` 对应一个 `View`。只要 `State` 相同，`View` 就相同。你知道 `State`，就知道 `View` 是什么样，反之亦然

**Action**

> `State` 的变化，会导致 `View` 的变化。但是，用户接触不到 `State`，只能接触到 `View`。所以，`State` 的变化必须是 `View` 导致的。`Action` 就是 `View` 发出的通知，表示 `State` 应该要发生变化了

- `Action` 是一个对象。其中的`type`属性是必须的，表示 `Action` 的名称。其他属性可以自由设置

```javascript
const action = {
  type: 'ADD_TODO',
  payload: 'Learn Redux'
}
```
- 上面代码中，`Action` 的名称是`ADD_TODO`，它携带的信息是字符串`Learn Redux`
- 可以这样理解，`Action` 描述当前发生的事情。改变 `State` 的唯一办法，就是使用 `Action`。它会运送数据到 `Store`

> `action`有两个作用，一个是定义我们的应用可以进行的动作或操作的类型，另一个是传递改变应用状态的数据。在`Redux`的约定中，`action`只有`type`属性是必须包含的，其他的数据如何定义全在于你想要如何使用，当然如果你希望你定义的`action`能够规范一些的话，也可以遵从Flux Standard Action的标准

```javascript
{
  // action 类型
  type: 'INCREMENT',
  // payload 中返回我们要传递的数据，用来修改应用 state
  payload: {
    num: 1  
  },
  // payload 数据未获取成功时返回 true
  error: false,
  // 一些不必要在 payload 中传递的其他数据
  meta: {
    success: true
  }
}
```

**Action Creator**

> `View` 要发送多少种消息，就会有多少种 `Action`。如果都手写，会很麻烦。可以定义一个函数来生成 `Action`，这个函数就叫 `Action Creator`

```javascript
const ADD_TODO = '添加 TODO';

function addTodo(text) {
  return {
    type: ADD_TODO,
    text
  }
}

const action = addTodo('Learn Redux');
```

> 上面代码中，`addTodo`函数就是一个 `Action Creator`

**store.dispatch()**

> `store.dispatch()`是 `View` 发出 `Action` 的唯一方法

```javascript
import { createStore } from 'redux';
const store = createStore(fn);

store.dispatch({
  type: 'ADD_TODO',
  payload: 'Learn Redux'
});
```

> 上面代码中，`store.dispatch`接受一个 `Action` 对象作为参数，将它发送出去

- 结合 `Action Creator`，这段代码可以改写如下

```javascript
store.dispatch(addTodo('Learn Redux'));
```

**Reducer**

> `Store` 收到 `Action` 以后，必须给出一个新的 `State`，这样 `View` 才会发生变化。这种 `State` 的计算过程就叫做 `Reducer`

```javascript
const reducer = function (state, action) {
  // ...
  return new_state;
};
```

- 整个应用的初始状态，可以作为 `State` 的默认值。下面是一个实际的例子

```javascript
const defaultState = 0;
const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case 'ADD':
      return state + action.payload;
    default: 
      return state;
  }
};

const state = reducer(1, {
  type: 'ADD',
  payload: 2
});
```
> 上面代码中，`reducer`函数收到名为`ADD`的 `Action` 以后，就返回一个新的 `State`，作为加法的计算结果。其他运算的逻辑（比如减法），也可以根据 `Action` 的不同来实现

- 实际应用中，`Reducer` 函数不用像上面这样手动调用，`store.dispatch`方法会触发 `Reducer` 的自动执行
- 为此，`Store` 需要知道 `Reducer` 函数，做法就是在生成 `Store` 的时候，将 `Reducer` 传入`createStore`方法

```
import { createStore } from 'redux';
const store = createStore(reducer);
```

- 上面代码中，`createStore`接受 `Reducer` 作为参数，生成一个新的 `Store`。以后每当`store.dispatch`发送过来一个新的 `Action`，就会自动调用 `Reducer`，得到新的 `State`
- 为什么这个函数叫做 `Reducer `呢？因为它可以作为数组的`reduce`方法的参数

**纯函数**

- `Reducer` 函数最重要的特征是，它是一个纯函数。也就是说，只要是同样的输入，必定得到同样的输出
- 纯函数是函数式编程的概念，必须遵守以下一些约束
  - 不得改写参数
  - 不能调用系统 `I/O` 的`API`
  - 不能调用`Date.now()`或者`Math.random()`等不纯的方法，因为每次会得到不一样的结果
  
> 由于 `Reducer` 是纯函数，就可以保证同样的`State`，必定得到同样的 `View`。但也正因为这一点，`Reducer` 函数里面不能改变 `State`，必须返回一个全新的对象，请参考下面的写法

```javascript
// State 是一个对象
function reducer(state, action) {
  return Object.assign({}, state, { thingToChange });
  // 或者
  return { ...state, ...newState };
}

// State 是一个数组
function reducer(state, action) {
  return [...state, newItem];
}
```

> 最好把 `State` 对象设成只读。你没法改变它，要得到新的 `State`，唯一办法就是生成一个新对象。这样的好处是，任何时候，与某个 `View` 对应的 `State` 总是一个不变的对象


**store.subscribe()**

> `Store` 允许使用`store.subscribe`方法设置监听函数，一旦 `State` 发生变化，就自动执行这个函数

```javascript
import { createStore } from 'redux';
const store = createStore(reducer);

store.subscribe(listener);
```

> 显然，只要把 `View` 的更新函数（对于 `React` 项目，就是组件的`render`方法或`setState`方法）放入`listen`，就会实现 `View` 的自动渲染

- `store.subscribe`方法返回一个函数，调用这个函数就可以解除监听

```javascript
let unsubscribe = store.subscribe(() =>
  console.log(store.getState())
);

unsubscribe();
```

### 9.3 Reducer 的拆分

> `Reducer` 函数负责生成 `State`。由于整个应用只有一个 `State` 对象，包含所有数据，对于大型应用来说，这个 State 必然十分庞大，导致 `Reducer` 函数也十分庞大


```javascript
const chatReducer = (state = defaultState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case ADD_CHAT:
      return Object.assign({}, state, {
        chatLog: state.chatLog.concat(payload)
      });
    case CHANGE_STATUS:
      return Object.assign({}, state, {
        statusMessage: payload
      });
    case CHANGE_USERNAME:
      return Object.assign({}, state, {
        userName: payload
      });
    default: return state;
  }
};
```

```javascript
const chatReducer = (state = defaultState, action = {}) => {
  return {
    chatLog: chatLog(state.chatLog, action),
    statusMessage: statusMessage(state.statusMessage, action),
    userName: userName(state.userName, action)
  }
};
```
- 上面代码中，`Reducer` 函数被拆成了三个小函数，每一个负责生成对应的属
- 这样一拆，`Reducer` 就易读易写多了。而且，这种拆分与 `React` 应用的结构相吻合:一个 `React` 根组件由很多子组件构成。这就是说，子组件与子 `Reducer` 完全可以对应

> `Redux` 提供了一个`combineReducers`方法，用于 `Reducer` 的拆分。你只要定义各个子 `Reducer` 函数，然后用这个方法，将它们合成一个大的 `Reducer`


```javascript
import { combineReducers } from 'redux';

const chatReducer = combineReducers({
  chatLog,
  statusMessage,
  userName
})

export default todoApp;
```

> 这种写法有一个前提，就是 State 的属性名必须与子 Reducer 同名。如果不同名，就要采用下面的写法

```javascript
function reducer(state = {}, action) {
  return {
    a: doSomethingWithA(state.a, action),
    b: processB(state.b, action),
    c: c(state.c, action)
  }
}
```

> 总之，`combineReducers()`做的就是产生一个整体的 Reducer 函数。该函数根据 `State` 的 `key` 去执行相应的子 `Reducer`，并将返回结果合并成一个大的 `State` 对象

- 你可以把所有子 `Reducer` 放在一个文件里面，然后统一引入

```javascript
import { combineReducers } from 'redux'
import * as reducers from './reducers'

const reducer = combineReducers(reducers)
```

### 9.4 工作流程


![](https://poetries1.gitee.io/img-repo/2019/10/478.png)
![](https://poetries1.gitee.io/img-repo/2019/10/479.png)
![](https://poetries1.gitee.io/img-repo/2019/10/480.png)
![](https://poetries1.gitee.io/img-repo/2019/10/481.png)
![](https://poetries1.gitee.io/img-repo/2019/10/482.png)


- 首先，用户发出 `Action`

```javascript
store.dispatch(action);
```

- 然后，`Store` 自动调用 `Reducer`，并且传入两个参数：当前 `State` 和收到的 `Action`。 `Reducer` 会返回新的 `State`

```javascript
let nextState = todoApp(previousState, action);
```

- `State` 一旦有变化，`Store` 就会调用监听函数

```javascript
// 设置监听函数
store.subscribe(listener);
```

- `listener`可以通过`store.getState()`得到当前状态。如果使用的是 `React`，这时可以触发重新渲染 `View`

```javascript
function listerner() {
  let newState = store.getState();
  component.setState(newState);   
}
```
### 9.5 实例：计数器


```javascript
const Counter = ({ value, onIncrement, onDecrement }) => (
  <div>
  <h1>{value}</h1>
  <button onClick={onIncrement}>+</button>
  <button onClick={onDecrement}>-</button>
  </div>
);

const reducer = (state = 0, action) => {
  switch (action.type) {
    case 'INCREMENT': return state + 1;
    case 'DECREMENT': return state - 1;
    default: return state;
  }
};

const store = createStore(reducer);

const render = () => {
  ReactDOM.render(
    <Counter
      value={store.getState()}
      onIncrement={() => store.dispatch({type: 'INCREMENT'})}
      onDecrement={() => store.dispatch({type: 'DECREMENT'})}
    />,
    document.getElementById('root')
  );
};

render();
store.subscribe(render);
```

## 十、中间件与异步操作

> `Redux` 的基本做法：用户发出 `Action`，`Reducer` 函数算出新的 `State`，`View` 重新渲染

- 一个关键问题没有解决：异步操作怎么办？`Action` 发出以后，`Reducer` 立即算出 `State`，这叫做同步；`Action` 发出以后，过一段时间再执行 `Reducer`，这就是异步

- 怎么才能 `Reducer` 在异步操作结束后自动执行呢？这就要用到新的工具：中间件（`middleware`）

![](https://poetries1.gitee.io/img-repo/2019/10/477.png)


### 10.1 中间件的概念

> 中间件就是一个函数，对`store.dispatch`方法进行了改造，在发出 `Action` 和执行 `Reducer` 这两步之间，添加了其他功能。

### 10.2 中间件的用法

> 常用的中间件都有现成的，只要引用别人写好的模块即可。比如日志中间件，就有现成的`redux-logger`模块

```javascript
import { applyMiddleware, createStore } from 'redux';
import createLogger from 'redux-logger';
const logger = createLogger();

const store = createStore(
  reducer,
  applyMiddleware(logger)
);
```

> 上面代码中，`redux-logger`提供一个生成器`createLogger`，可以生成日志中间件`logger`。然后，将它放在applyMiddleware方法之中，传入`createStore`方法，就完成了`store.dispatch()`的功能增强

**这里有两点需要注意**

- （1）`createStore`方法可以接受整个应用的初始状态作为参数，那样的话，`applyMiddleware`就是第三个参数了

```javascript
const store = createStore(
  reducer,
  initial_state,
  applyMiddleware(logger)
);
```

- （2）中间件的次序有讲究

```javascript
const store = createStore(
  reducer,
  applyMiddleware(thunk, promise, logger)
);
```

> 上面代码中，`applyMiddleware`方法的三个参数，就是三个中间件。有的中间件有次序要求，使用前要查一下文档。比如，`logger`就一定要放在最后，否则输出结果会不正确

### 10.3、applyMiddlewares()


> `applyMiddlewares`这个方法。它是 `Redux` 的原生方法，作用是将所有中间件组成一个数组，依次执行


### 10.4 异步操作的基本思路


> 理解了中间件以后，就可以处理异步操作了

- 同步操作只要发出一种 `Action` 即可，异步操作的差别是它要发出三种 `Action`
  - 操作发起时的 `Action`
  - 操作成功时的 `Action`
  - 操作失败时的 `Action`
  
> 以向服务器取出数据为例，三种 `Action` 可以有两种不同的写法

```javascript
// 写法一：名称相同，参数不同
{ type: 'FETCH_POSTS' }
{ type: 'FETCH_POSTS', status: 'error', error: 'Oops' }
{ type: 'FETCH_POSTS', status: 'success', response: { ... } }

// 写法二：名称不同
{ type: 'FETCH_POSTS_REQUEST' }
{ type: 'FETCH_POSTS_FAILURE', error: 'Oops' }
{ type: 'FETCH_POSTS_SUCCESS', response: { ... } }
```

> 除了 `Action `种类不同，异步操作的 `State` 也要进行改造，反映不同的操作状态。下面是 `State` 的一个例子

```javascript
let state = {
  // ... 
  isFetching: true,
  didInvalidate: true,
  lastUpdated: 'xxxxxxx'
};
```

> 上面代码中，`State` 的属性`isFetching`表示是否在抓取数据。`didInvalidate`表示数据是否过时，`lastUpdated`表示上一次更新时间

> 现在，整个异步操作的思路就很清楚了

- 操作开始时，送出一个 `Action`，触发 `State` 更新为"正在操作"状态，`View` 重新渲染
- 操作结束后，再送出一个 `Action`，触发 `State` 更新为"操作结束"状态，`View` 再一次重新渲染

### 10.5 redux-thunk 中间件

> 异步操作至少要送出两个 `Action`：用户触发第一个 `Action`，这个跟同步操作一样，没有问题；如何才能在操作结束时，系统自动送出第二个 `Action` 呢

- 奥妙就在 `Action Creator` 之中

```javascript
class AsyncApp extends Component {
  componentDidMount() {
    const { dispatch, selectedPost } = this.props
    dispatch(fetchPosts(selectedPost))
  }

// ...
```

> 上面代码是一个异步组件的例子。加载成功后（`componentDidMount`方法），它送出了（`dispatch`方法）一个 `Action`，向服务器要求数据 `fetchPosts(selectedSubreddit)`。这里的`fetchPosts`就是 `Action Creator`

- 下面就是`fetchPosts`的代码，关键之处就在里面

![](https://poetries1.gitee.io/img-repo/2019/10/476.png)

```javascript
const fetchPosts = postTitle => (dispatch, getState) => {
  dispatch(requestPosts(postTitle));
  return fetch(`/some/API/${postTitle}.json`)
    .then(response => response.json())
    .then(json => dispatch(receivePosts(postTitle, json)));
  };
};

// 使用方法一
store.dispatch(fetchPosts('reactjs'));
// 使用方法二
store.dispatch(fetchPosts('reactjs')).then(() =>
  console.log(store.getState())
);
```

> 上面代码中，`fetchPosts`是一个`Action Creator`（动作生成器），返回一个函数。这个函数执行后，先发出一个`Action（requestPosts(postTitle)`），然后进行异步操作。拿到结果后，先将结果转成 `JSON` 格式，然后再发出一个 `Action（ receivePosts(postTitle, json)`）


**上面代码中，有几个地方需要注意**

- `fetchPosts`返回了一个函数，而普通的 `Action Creator` 默认返回一个对象
- 返回的函数的参数是`dispatch`和`getState`这两个 `Redux `方法，普通的` Action Creator `的参数是 `Action` 的内容
- 在返回的函数之中，先发出一个 `Action（requestPosts(postTitle)）`，表示操作开始
- 异步操作结束之后，再发出一个 `Action（receivePosts(postTitle, json)）`，表示操作结束

> 这样的处理，就解决了自动发送第二个 `Action` 的问题。但是，又带来了一个新的问题，`Action` 是由`store.dispatch`方法发送的。而`store.dispatch`方法正常情况下，参数只能是对象，不能是函数

- 这时，就要使用中间件`redux-thunk`

```javascript
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from './reducers';

// Note: this API requires redux@>=3.1.0
const store = createStore(
  reducer,
  applyMiddleware(thunk)
);
```

- 上面代码使用`redux-thunk`中间件，改造`store.dispatch`，使得后者可以接受函数作为参数

**因此，异步操作的第一种解决方案就是，写出一个返回函数的 `Action Creator`，然后使用`redux-thunk`中间件改造`store.dispatch`**

### 10.6、redux-promise 中间件
---


> 既然 `Action Creator` 可以返回函数，当然也可以返回其他值。另一种异步操作的解决方案，就是让 `Action Creator` 返回一个 `Promise` 对象

- 这就需要使用`redux-promise`中间件

```javascript
import { createStore, applyMiddleware } from 'redux';
import promiseMiddleware from 'redux-promise';
import reducer from './reducers';

const store = createStore(
  reducer,
  applyMiddleware(promiseMiddleware)
); 
```

> 这个中间件使得`store.dispatch`方法可以接受 `Promise` 对象作为参数。这时，`Action Creator` 有两种写法


- 写法一，返回值是一个 `Promise` 对象

```javascript
const fetchPosts = 
  (dispatch, postTitle) => new Promise(function (resolve, reject) {
     dispatch(requestPosts(postTitle));
     return fetch(`/some/API/${postTitle}.json`)
       .then(response => {
         type: 'FETCH_POSTS',
         payload: response.json()
       });
});
```

- 写法二，`Action` 对象的`payload`属性是一个 `Promise` 对象。这需要从`redux-actions`模块引入`createAction`方法，并且写法也要变成下面这样

```javascript
import { createAction } from 'redux-actions';

class AsyncApp extends Component {
  componentDidMount() {
    const { dispatch, selectedPost } = this.props
    // 发出同步 Action
    dispatch(requestPosts(selectedPost));
    // 发出异步 Action
    dispatch(createAction(
      'FETCH_POSTS', 
      fetch(`/some/API/${postTitle}.json`)
        .then(response => response.json())
    ));
  }
```

- 上面代码中，第二个`dispatch`方法发出的是异步 `Action`，只有等到操作结束，这个 `Action` 才会实际发出
- 注意，`createAction`的第二个参数必须是一个 `Promise` 对象


## 十一、react-redux

> - 为了方便使用，`Redux` 的作者封装了一个 `React `专用的库 `React-Redux`
> - 这个库是可以选用的。实际项目中，你应该权衡一下，是直接使用 `Redux`，还是使用 `React-Redux`。后者虽然提供了便利，但是需要掌握额外的 `API`，并且要遵守它的组件拆分规范

### 11.1 UI 组件

> `React-Redux` 将所有组件分成两大类：`UI` 组件（`presentational component`）和容器组件（`container component`）

**UI 组件有以下几个特征**

- 只负责 `UI` 的呈现，不带有任何业务逻辑
- 没有状态（即不使用`this.state`这个变量）
- 所有数据都由参数（`this.props`）提供
- 不使用任何 `Redux` 的 `API`

```javascript
// 例子
const Title =
  value => <h1>{value}</h1>;
```

> 因为不含有状态，`UI` 组件又称为"纯组件"，即它纯函数一样，纯粹由参数决定它的值

### 11.2、容器组件

- 负责管理数据和业务逻辑，不负责 `UI` 的呈现
- 带有内部状态
- 使用 `Redux` 的 `API`

**`UI` 组件负责 `UI` 的呈现，容器组件负责管理数据和逻辑**

> 如果一个组件既有 `UI` 又有业务逻辑，那怎么办？回答是，将它拆分成下面的结构：外面是一个容器组件，里面包了一个`UI` 组件。前者负责与外部的通信，将数据传给后者，由后者渲染出视图

- `React-Redux` 规定，所有的 `UI` 组件都由用户提供，容器组件则是由 `React-Redux` 自动生成。也就是说，用户负责视觉层，状态管理则是全部交给它

### 11.3、connect()


> `React-Redux` 提供`connect`方法，用于从 `UI` 组件生成容器组件。`connect`的意思，就是将这两种组件连起来。

```javascript
import { connect } from 'react-redux'
const VisibleTodoList = connect()(TodoList);
```

- 上面代码中，`TodoList`是 `UI` 组件，`VisibleTodoList`就是由 `React-Redux` 通过`connect`方法自动生成的容器组件

> 但是，因为没有定义业务逻辑，上面这个容器组件毫无意义，只是 `UI` 组件的一个单纯的包装层。为了定义业务逻辑，需要给出下面两方面的信息。

- （1）输入逻辑：外部的数据（即`state`对象）如何转换为 `UI` 组件的参数
- （2）输出逻辑：用户发出的动作如何变为 `Action` 对象，从 `UI` 组件传出去

> 因此，`connect`方法的完整 `API` 如下

```javascript
import { connect } from 'react-redux'

const VisibleTodoList = connect(
  mapStateToProps,
  mapDispatchToProps
)(TodoList)
```

> 上面代码中，`connect`方法接受两个参数`：mapStateToProps`和`mapDispatchToProps`。它们定义了 `UI` 组件的业务逻辑。前者负责输入逻辑，即将`state`映射到 `UI` 组件的参数（`props`），后者负责输出逻辑，即将用户对 `UI` 组件的操作映射成 `Action`

### 11.4、mapStateToProps()

> `mapStateToProps`是一个函数。它的作用就是像它的名字那样，建立一个从（外部的）`state`对象到（`UI` 组件的）`props`对象的映射关系

- 作为函数，`mapStateToProps`执行后应该返回一个对象，里面的每一个键值对就是一个映射

```javascript
const mapStateToProps = (state) => {
  return {
    todos: getVisibleTodos(state.todos, state.visibilityFilter)
  }
}
```

- 上面代码中，`mapStateToProps`是一个函数，它接受`state`作为参数，返回一个对象
- 这个对象有一个`todos`属性，代表 `UI` 组件的同名参数，后面的`getVisibleTodos`也是一个函数，可以从`state`算出 `todos` 的值

> 下面就是`getVisibleTodos`的一个例子，用来算出`todos`

```javascript
const getVisibleTodos = (todos, filter) => {
  switch (filter) {
    case 'SHOW_ALL':
      return todos
    case 'SHOW_COMPLETED':
      return todos.filter(t => t.completed)
    case 'SHOW_ACTIVE':
      return todos.filter(t => !t.completed)
    default:
      throw new Error('Unknown filter: ' + filter)
  }
}
```

- `mapStateToProps`会订阅 `Store`，每当`state`更新的时候，就会自动执行，重新计算 `UI` 组件的参数，从而触发 `UI` 组件的重新渲染
- `mapStateToProps`的第一个参数总是`state`对象，还可以使用第二个参数，代表容器组件的`props`对象

```javascript
// 容器组件的代码
//    <FilterLink filter="SHOW_ALL">
//      All
//    </FilterLink>

const mapStateToProps = (state, ownProps) => {
  return {
    active: ownProps.filter === state.visibilityFilter
  }
}
```

> 使用`ownProps`作为参数后，如果容器组件的参数发生变化，也会引发 `UI` 组件重新渲染


- `connect`方法可以省略`mapStateToProps`参数，那样的话，`UI` 组件就不会订阅`Store`，就是说 `Store` 的更新不会引起 `UI` 组件的更新

### 11.5、mapDispatchToProps()


> `mapDispatchToProps`是`connect`函数的第二个参数，用来建立 `UI` 组件的参数到`store.dispatch`方法的映射

- 也就是说，它定义了哪些用户的操作应该当作 `Action`，传给 `Store`。它可以是一个函数，也可以是一个对象
- 如果`mapDispatchToProps`是一个函数，会得到`dispatch`和`ownProps`（容器组件的`props`对象）两个参数

```javascript
const mapDispatchToProps = (
  dispatch,
  ownProps
) => {
  return {
    onClick: () => {
      dispatch({
        type: 'SET_VISIBILITY_FILTER',
        filter: ownProps.filter
      });
    }
  };
}
```

- 从上面代码可以看到，`mapDispatchToProps`作为函数，应该返回一个对象，该对象的每个键值对都是一个映射，定义了 `UI` 组件的参数怎样发出 `Action`
- 如果`mapDispatchToProps`是一个对象，它的每个键名也是对应 `UI` 组件的同名参数，键值应该是一个函数，会被当作 `Action creator` ，返回的 `Action` 会由 `Redux` 自动发出。举例来说，上面的`mapDispatchToProps`写成对象就是下面这样

```javascript
const mapDispatchToProps = {
  onClick: (filter) => {
    type: 'SET_VISIBILITY_FILTER',
    filter: filter
  };
}
```

### 11.6、<Provider> 组件


> `connect`方法生成容器组件以后，需要让容器组件拿到`state`对象，才能生成 `UI` 组件的参数

> 一种解决方法是将`state`对象作为参数，传入容器组件。但是，这样做比较麻烦，尤其是容器组件可能在很深的层级，一级级将`state`传下去就很麻烦。

- `React-Redux` 提供`Provider`组件，可以让容器组件拿到`state`

```javascript
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import todoApp from './reducers'
import App from './components/App'

let store = createStore(todoApp);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
```

- 上面代码中，`Provider`在根组件外面包了一层，这样一来，`App`的所有子组件就默认都可以拿到`state`
- 它的原理是`React`组件的`context`属性

### 11.7、实例：计数器


> 我们来看一个实例。下面是一个计数器组件，它是一个纯的 `UI` 组件

```javascript
class Counter extends Component {
  render() {
    const { value, onIncreaseClick } = this.props
    return (
      <div>
        <span>{value}</span>
        <button onClick={onIncreaseClick}>Increase</button>
      </div>
    )
  }
}
```

> 这个 `UI` 组件有两个参数：`value`和`onIncreaseClick`。前者需要从`state`计算得到，后者需要向外发出 `Action`

- 接着，定义`value`到`state`的映射，以及`onIncreaseClick`到`dispatch`的映射

```javascript
function mapStateToProps(state) {
  return {
    value: state.count
  }
}

function mapDispatchToProps(dispatch) {
  return {
    onIncreaseClick: () => dispatch(increaseAction)
  }
}

// Action Creator
const increaseAction = { type: 'increase' }
```

> 然后，使用`connect`方法生成容器组件

```
const App = connect(
  mapStateToProps,
  mapDispatchToProps
)(Counter)
```

> 然后，定义这个组件的 `Reducer`

```javascript
// Reducer
function counter(state = { count: 0 }, action) {
  const count = state.count
  switch (action.type) {
    case 'increase':
      return { count: count + 1 }
    default:
      return state
  }
}
```

> 最后，生成`store`对象，并使用`Provider`在根组件外面包一层

```javascript
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import { createStore } from 'redux'
import { Provider, connect } from 'react-redux'

// React component
class Counter extends Component {
  render() {
    const { value, onIncreaseClick } = this.props
    return (
      <div>
        <span>{value}</span>
        <button onClick={onIncreaseClick}>Increase</button>
      </div>
    )
  }
}

Counter.propTypes = {
  value: PropTypes.number.isRequired,
  onIncreaseClick: PropTypes.func.isRequired
}

// Action
const increaseAction = { type: 'increase' }

// Reducer
function counter(state = { count: 0 }, action) {
  const count = state.count
  switch (action.type) {
    case 'increase':
      return { count: count + 1 }
    default:
      return state
  }
}

// Store
const store = createStore(counter)

// Map Redux state to component props
function mapStateToProps(state) {
  return {
    value: state.count
  }
}

// Map Redux actions to component props
function mapDispatchToProps(dispatch) {
  return {
    onIncreaseClick: () => dispatch(increaseAction)
  }
}

// Connected Component
const App = connect(
  mapStateToProps,
  mapDispatchToProps
)(Counter)

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
```


## 十二、思维导图总结

![](https://poetries1.gitee.io/img-repo/2019/10/483.png)

