---
title: React之React Router 4（十一）
date: 2017-11-20 00:06:10
tags: 
 - Router
 - react
categories: Front-End
---


一、React-router V4版本修改内容及一些坑
---


**1、所有组件更改为从react-router-dom导入**

```javascript
//v2
import {Router,Route,hashHistory} from 'react-router';

// 4.xx写法
//v4
import {Route,BrowserRouter as Router, Switch} from 'react-router-dom';

// 如果搭配redux，你还需要使用react-router-redux
```

**2、将所有<Router>替换为<BrowserRouter>**


```javascript
//v2
 <Router history={hashHistory}>
  <Route path="/" component={PCIndex}></Route>
  <Route path="/details/:uniqueky" component={PCNewsDetails}></Route>
  <Route path="/usercenter" component={PCUserCenter}></Route>
 </Router>
```

> 现在需要更改为`BrowserRouter`

- 这里的代码不仅仅是将`Router`替换为`BrowserRouter`,而且还把所有的`Route`中用`Switch`包裹起来.

```javascript
//v4
<BrowserRouter>
  <Switch>
   <Route exact path="/" component={MobileIndex}></Route>
   <Route path="/details/:uniqueky" component={MobileNewsDetails}></Route>
   <Route path="/usercenter" component={MobileUserCenter}></Route>
  </Switch>
 </BrowserRouter>
```

**3、<BrowserRouter>只能有一个子节点**

> `<BroserRouter>`只能有一个子节点,所以官网建议的是使用`<Switch>`进行包裹

```javascript
// v3
<Route path='/' component={App}>
 <IndexRoute component={Home} />
 <Route path='about' component={About} />
 <Route path='contact' component={Contact} />
</Route>
```

```javascript
// v4
const App = () => (
 <Switch>
  <Route exact path='/' component={Home} />
  <Route path='/about' component={About} />
  <Route path='/contact' component={Contact} />
 </Switch>
)
```

**4、最坑的地方:在当前目录下的文件路径不再使用`./`, 而是直接用`/.`**

> 在进行文件引用的时候 ,`./src/js`的写法需要更改文'`/src/js`', 这是更改之后最坑的地方


二、安装
---

> `react-router-dom`暴露出`react-router`中暴露的对象与方法，因此你只需要安装并引用`react-router-dom`即可

```javascript
npm install --save react-router-dom
```

三、路由器(Router)
---

> 在你开始项目前，你需要决定你使用的路由器的类型。对于网页项目，存在`<BrowserRouter>`与`<HashRouter>`两种组件。当存在服务器来管理动态请求时，需要使用`<BrowserRouter>`组件，而`<HashRouter>`被用于静态网站。通常，我们更倾向选择`<BrowserRouter>`，但如果你的网站仅用来呈现静态文件，那么`<HashRouter>`将会是一个好选择

四、历史(History)
---

> 每个路由器都会创建一个`history`对象并用其保持追踪当前location[注1]并且在有变化时对网站进行重新渲染。这个`history`对象保证了`React Router`提供的其他组件的可用性，所以其他组件必须在`router`内部渲染。一个`React Router`组件如果向父级上追溯却找不到`router`组件，那么这个组件将无法正常工作

五、渲染<Router>
---

> 路由器组件无法接受两个及以上的子元素。基于这种限制的存在，创建一个`<App>`组件来渲染应用其余部分是一个有效的方法

```javascript
import { BrowserRouter } from 'react-router-dom'
ReactDOM.render((
  <BrowserRouter>
    <App />
  </BrowserRouter>
), document.getElementById('root'))
```

六、`<App>`
---

> 应用通过`<App>`组件定义。简化一下，我们将应用拆分成两个部分。`<Header>`组件包含网站的导航链接。`<Main>`组件则呈现其余内容

```javascript
const App = () => (
  <div>
    <Header />
    <Main />
  </div>
)
```

七、路由(Route)
---

> `<Route>`组件是`React Router`中主要的结构单元。在任意位置只要匹配了`URL`的路径名(`pathname`)你就可以创建`<Route>`元素进行渲染

**1、路径(Path)**

> `<Route>`接受一个数为`string`类型的`path`，该值路由匹配的路径名的类型。例如：`<Route path='/roster'/>`会匹配以`/roster`开头的路径名。在当前`path`参数与当前`location`的路径相匹配时，路由就会开始渲染`React`元素。若不匹配，路由不会进行任何操作


```javascript
<Route path='/roster'/>
// 当路径名为'/'时, path不匹配
// 当路径名为'/roster'或'/roster/2'时, path匹配
// 当你只想匹配'/roster'时，你需要使用"exact"参数
// 则路由仅匹配'/roster'而不会匹配'/roster/2'
<Route exact path='/roster'/>
```

- 注意：在匹配路由时，`React Router`只关注`location`的路径名。当`URL`如下时

```javascript
http://www.example.com/my-projects/one?extra=false
```

- `React Router`去匹配的只是`'/my-projects/one'`这一部分

**2、匹配路径**

> `path-to-regexp`包用来决定`route`元素的`path`参数与当前`location`是否匹配。它将路径字符串编译成正则表达式，并与当前`location`的路径名进行匹配比较

- 当路由地址匹配成功后，会创建一个含有以下属性的`match`对象：
  - `url` ：与当前`location`路径名所匹配部分
  - `path`：路由的地址
  - `isExact` ：`path` 是否等于 `pathname`
  - `params`：从`path-to-regexp`获取的路径中取出的值都被包含在这个对象中

使用[route tester](https://pshrmn.github.io/route-tester/#/)这款工具来对路由与URL进行检验

**3、创建你的路由**

> 可以在路由器(router)组件中的任意位置创建多个`<Route>`，但通常我们会把它们放在同一个位置。使用`<Switch>`组件来包裹一组`<Route>`。`<Switch>`会遍历自身的子元素（即路由）并对第一个匹配当前路径的元素进行渲染

- 我们希望匹配一下路径
  - `/`：主页
  - `/roster`： 团体列表
  - `/roster/:number`：运动员页面，使用运动员的编号作为标识
  - `/schedule`：团队的赛程表
  
为了在应用中能匹配路径，在创建`<Route>`元素时必须带有需要匹配的`path`作为参数

```javascript
<Switch>
  <Route exact path='/' component={Home}/>
  {/* both /roster and /roster/:number begin with /roster */}
  <Route path='/roster' component={Roster}/>
  <Route path='/schedule' component={Schedule}/>
</Switch>
```

**4、`<Route>`是如何渲染的？**

> 当一个路由的`path`匹配成功后，路由用来确定渲染结果的参数有三种。只需要提供其中一个即可

- `component` ： 一个`React`组件。当带有`component`参数的`route`匹配成功后，`route`会返回一个新的元素，其为`component`参数所对应的`React`组件（使用`React.createElement`创建）。
- `render` ： 一个返回`React element`的函数。当匹配成功后调用该函数。该过程与传入`component`参数类似，并且对于行级渲染与需要向元素传入额外参数的操作会更有用。
- `children` ： 一个返回`React element`的函数。与上述两个参数不同，无论`route`是否匹配当前`location`，其都会被渲染

```javascript
<Route path='/page' component={Page} />
const extraProps = { color: 'red' }
<Route path='/page' render={(props) => (
  <Page {...props} data={extraProps}/>
)}/>
<Route path='/page' children={(props) => (
  props.match
    ? <Page {...props}/>
    : <EmptyPage {...props}/>
)}/>
```

> 通常`component`参数与`render`参数被更经常地使用。`children`参数偶尔会被使用，它更常用在`path`无法匹配时呈现的'空'状态。在本例中并不会有额外的状态，所以我们将使用`<Route>`的`component`参数

- 通过`<Route>`渲染的元素会被传入一些参数。分别是`match`对象，当前`location`对象以及`history`对象（由`router`创建）

**5、`<Main>`**

> 现在我们清楚了根路由的结构，我们需要实际渲染我们的路由。对于这个应用，我们将会在`<Main>`组件中渲染`<Switch>`与`<Route>`，这一过程会将`route`匹配生成的`HTML`放在`<main>`节点中

```javascript
import { Switch, Route } from 'react-router-dom'
const Main = () => (
  <main>
    <Switch>
      <Route exact path='/' component={Home}/>
      <Route path='/roster' component={Roster}/>
      <Route path='/schedule' component={Schedule}/>
    </Switch>
  </main>
)
```

- **注意**：主页路由包含额外参数。该参数用来保证路由能准确匹配`path`

**6、嵌套路由**


```javascript
// v3
import React from "react";
import { render } from "react-dom";
import { Router, Route, IndexRoute, Link, browserHistory } from "react-router";

const PrimaryLayout = props =>
  <div className="primary-layout">
    <header>Our React Router 3 App</header>
    <ul>
      <li>
        <Link to="/">Home</Link>
      </li>
      <li>
        <Link to="/user">User</Link>
      </li>
    </ul>
    <main>
      {props.children}
    </main>
  </div>;

const HomePage = () => <h1>Home Page</h1>;
const UsersPage = () => <h1>User Page</h1>;

const App = () =>
  <Router history={browserHistory}>
    <Route path="/" component={PrimaryLayout}>
      <IndexRoute component={HomePage} />
      <Route path="/user" component={UsersPage} />
    </Route>
  </Router>;

render(<App />, document.getElementById("root"));
```

- **上面代码中有几个关键的点在 V4 中就不复存在了**
  - 集中式 `router`
  - 通过 `<Route>` 嵌套，实现` Layout` 和 `page` 嵌套
  - `Layout` 和 `page `组件 是作为 `router` 的一部分


```javascript
// v4
import React from "react";
import { render } from "react-dom";
import { BrowserRouter, Route, Link } from "react-router-dom";

const PrimaryLayout = () =>
  <div className="primary-layout">
    <header>Our React Router 4 App</header>
    <ul>
      <li>
        <Link to="/">Home</Link>
      </li>
      <li>
        <Link to="/User">User</Link>
      </li>
    </ul>
    <main>
      <Route path="/" exact component={HomePage} />
      <Route path="/user" component={UsersPage} />
    </main>
  </div>;

const HomePage = () => <h1>Home Page</h1>;
const UsersPage = () => <h1>User Page</h1>;

const App = () =>
  <BrowserRouter>
    <PrimaryLayout />
  </BrowserRouter>;

render(<App />, document.getElementById("root"));
```

> 首先，`V3` 中的 `router` 不在了，在 `V3` 中，我们是将整个庞大的` router` 直接丢给 `DOM`，而在 `V4` 中，除了 `BrowserRouter`， 我们丢给 `DOM` 的是我们的应用程序本身

- `V4 `中，我们不再使用 `{props.children}` 来嵌套组件了，替代的 `<Route>`，当 `route `匹配时，子组件会被渲染到 `<Route> `书写的地方



- 基本使用


![](https://poetries1.gitee.io/img-repo/2019/10/468.png)

> `react-router 4.0` 对于接受参数采用 `{ this.props.match.params.id }` 如下例子：`<Route path="list/:id"></Router> `、 ` <Link to="list/123456"></Link>`


- 一个完整的嵌套路由的例子

```javascript
// import { Router, Route, Link, Switch } from ‘react-router‘;
import {
  HashRouter,
  Route,
  Link,
  Switch
} from ‘react-router-dom‘;

class App extends Component {
  render() {
    return (
      <div>
        <h1>App</h1>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/inbox">Inbox</Link></li>
        </ul>
        {this.props.children}

      </div>
    );
  }
}

const About = () => (
  <div>
    <h3>About</h3>
  </div>
)

const Home = () => (
  <div>
    <h3>Home</h3>
  </div>
)

const Message = ({ match }) => (
  <div>
    <h3>new messages</h3>
    <h3>{match.params.id}</h3>
  </div>
)

const Inbox = ({ match }) => (
  <div>
    <h2>Topics</h2>
    <Route path={`${match.url}/messages/:id`} component={Message}/>

  </div>
) 

ReactDOM.render(
  (<HashRouter>
    <App>
        <Route exact path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/inbox" component={Inbox} />
    </App>
  </HashRouter>),
  document.getElementById(‘root‘)
);

```

- 嵌套布局


> 方式一

```javascript
const PrimaryLayout = props => {
  return (
    <div className="primary-layout">
      <PrimaryHeader />
      <main>
        <Switch>
          <Route path="/" exact component={HomePage} />
          <Route path="/user" exact component={BrowseUsersPage} />
          <Route path="/user/:userId" component={UserProfilePage} />
          <Route path="/products" exact component={BrowseProductsPage} />
          <Route path="/products/:productId" component={ProductProfilePage} />
          <Redirect to="/" />
        </Switch>
      </main>
    </div>
  );
};
```

- `userId` 通过 `props.match.params` 获取
- `props.match` 赋予给了 `<Route>` 中的任何组件。
- 除此之外，如果组件不通过` <Route>` 来渲染，要访问 `props.match`，可以使用 `withRouter() `高阶组件来实现


> 方式二

- 解决了第一种方式中的生命周期，重复渲染的问题

```javascript
const PrimaryLayout = props => {
  return (
    <div className="primary-layout">
      <PrimaryHeader />
      <main>
        <Switch>
          <Route path="/" exact component={HomePage} />
          <Route path="/user" component={UserSubLayout} />
          <Route path="/products" component={ProductSubLayout} />
          <Redirect to="/" />
        </Switch>
      </main>
    </div>
  );
};
```

- 我们用 `2 `个 `routes` 替换之前的 `4 `个` routes`
- 注意，这里我们没有再使用 `exact`，因为，我们希望 `/user` 可以匹配任何以 `/user` 开始的 `route`，`products` 同理

> 使用这种策略，子布局也开始承担起了渲染 `routes` 的责任，现在，`UserSubLayout` 长这样

```javascript
const UserSubLayout = () =>
  <div className="user-sub-layout">
    <aside>
      <UserNav />
    </aside>
    <div className="primary-content">
      <Switch>
        <Route path="/user" exact component={BrowseUsersPage} />
        <Route path="/user/:userId" component={UserProfilePage} />
      </Switch>
    </div>
  </div>;
```

- 但有一点值得注意的是，`routes` 需要识别它的完整路径才能匹配，为了减少我们的重复输入，我们可以使用 `props.match.path`来代替


```javascript
const UserSubLayout = props =>
  <div className="user-sub-layout">
    <aside>
      <UserNav />
    </aside>
    <div className="primary-content">
      <Switch>
        <Route path={props.match.path} exact component={BrowseUsersPage} />
        <Route
          path={`${props.match.path}/:userId`}
          component={UserProfilePage}
        />
      </Switch>
    </div>
  </div>;
```


**7、路径参数**

有时路径名中存在我们需要获取的参数。例如，在运动员界面，我们需要获取运动员的编号。我们可以向`route`的路径字符串中添加`path`参数

- 如`'/roster/:number'`中`:number`这种写法意味着`/roster/`后的路径名将会被获取并存在`match.params.number`中。例如，路径名`'/roster/6'`会获取到一个对象

```javascript
{ number: '6' } // 注获取的值是字符串类型的
```

- `<Player>`组件可以使用`props.match.params`对象来确定需要被渲染的运动员的数据

```javascript
// 返回运动员对象的API
import PlayerAPI from './PlayerAPI'
const Player = (props) => {
  const player = PlayerAPI.get(
    parseInt(props.match.params.number, 10)
  )
  if (!player) {
    return <div>Sorry, but the player was not found</div>
  }
  return (
    <div>
      <h1>{player.name} (#{player.number})</h1>
      <h2>{player.position}</h2>
    </div>
)
```

除了`<Player>`组件，我们的页面还包含`<FullRoster>`, `<Schedule>`以及 `<Home>`组件

```javascript
const FullRoster = () => (
  <div>
    <ul>
      {
        PlayerAPI.all().map(p => (
          <li key={p.number}>
            <Link to={`/roster/${p.number}`}>{p.name}</Link>
          </li>
        ))
      }
    </ul>
  </div>
)
const Schedule = () => (
  <div>
    <ul>
      <li>6/5 @ Evergreens</li>
      <li>6/8 vs Kickers</li>
      <li>6/14 @ United</li>
    </ul>
  </div>
)
const Home = () => (
  <div>
    <h1>Welcome to the Tornadoes Website!</h1>
  </div>
)
```

八、inclusive routing
---

> 当访问 `/user` 时，两个组价都会被渲染

```
const PrimaryLayout = () =>
  <div className="primary-layout">
    <header>
      Our React Router 4 App
      <Route path="/user" component={UsersMenu} />
    </header>
    <main>
      <Route path="/" exact component={HomePage} />
      <Route path="/user" component={UsersPage} />
    </main>
  </div>;
```


九、Exclusive Routing
---

> 如果你只想匹配一个 `route`，那么你也可以使用 `<Switch>` 来 `exclusive routing`

```javascript
const PrimaryLayout = () =>
  <div className="primary-layout">
    <PrimaryHeader />
    <main>
      <Switch>
        <Route path="/" exact component={HomePage} />
        <Route path="/user/add" component={UserAddPage} />
        <Route path="/user" component={UsersPage} />
        <Redirect to="/" />
      </Switch>
    </main>
  </div>;
```

- 在 `<Switch>` 中只有一个 `<Route>` 会被渲染，另外，我们还是要给 `HomePage `所在 `<Route> `添加 `exact`，否则，在访问 `/user` 或 `/user/add `的时候还是会匹配到 `/`，从而，只渲染 H`omePage`
- 我们将 `/user/add `放在 `/user` 前面是保证正确匹配的很有策略性的一步，因为，`/user/add `会同时匹配 `/user `和 `/user/add`
- 如果我们给每一个 `<Route> `都添加一个 `exact`，那就不用考虑上面的 策略 了，但不管怎样，现在至少知道了我们还有其它选择
- `<Redirect> `组件不用多说，执行浏览器重定向，但它在 `<Switch>` 中时，`<Redirect> `组件只会在 `routes` 匹配不成功的情况下渲染


十、Index Routes" 和 "Not Found"
---

> `V4` 中也没有 `<IndexRoute>`，但 `<Route exact> `可以实现相同的功能，或者 `<Switch> `和 `<Redirect>` 重定向到默认的有效路径，甚至一个找不到的页面

十一、Link
---

> 现在，我们应用需要在各个页面间切换。如果使用锚点元素（就是）实现，在每次点击时页面将被重新加载。`React Router`提供了`<Link>`组件用来避免这种状况的发生。当你点击`<Link>`时，`URL`会更新，组件会被重新渲染，但是页面不会重新加载

```javascript
import { Link } from 'react-router-dom'
const Header = () => (
  <header>
    <nav>
      <ul>
        <li><Link to='/'>Home</Link></li>
        <li><Link to='/roster'>Roster</Link></li>
        <li><Link to='/schedule'>Schedule</Link></li>
      </ul>
    </nav>
  </header>
)
```

- `<Link>`使用`'to'`参数来描述需要定位的页面。它的值即可是字符串也可是`location`对象（包含`pathname`，`search`，`hash`与`state`属性）。如果其值为字符床将会被转换为`location`对象。

```html
<Link to={{ pathname: '/roster/7' }}>Player #7</Link>
```


十二、Match
---

> 正如我们上面看到的那样，`props.match` 可以帮我们获取 `userId` 和 `routes`

- `match` 对象为我们提供了 `match.params`，`match.path`，和 `match.url` 等属性


**1、match.path vs match.url**

> 最开始，可能觉得这两者的区别并不明显，控制台经常出现相同的输出，比如，访问 /user


```javascript
const UserSubLayout = ({ match }) => {
  console.log(match.url)   // output: "/user"
  console.log(match.path)  // output: "/user"
  return (
    <div className="user-sub-layout">
      <aside>
        <UserNav />
      </aside>
      <div className="primary-content">
        <Switch>
          <Route path={match.path} exact component={BrowseUsersPage} />
          <Route path={`${match.path}/:userId`} component={UserProfilePage} />
        </Switch>
      </div>
    </div>
  )
}
```

- `match` 在组件的参数中被解构，意思就是我们可以使用 `match.path` 代替 `props.match.path`
- 虽然我们看不到什么明显的差异，但需要明白的是 `match.url` 是浏览器 `URL` 的一部分，`match.path` 是我们为 `router` 书写的路径


**2、如何选择**

- 如果我们是构建 route 路径，那么肯定使用 match.path

```javascript
const UserComments = ({ match }) =>
  <div>
    UserId: {match.params.userId}
  </div>;

const UserSettings = ({ match }) =>
  <div>
    UserId: {match.params.userId}
  </div>;

const UserProfilePage = ({ match }) =>
  <div>
    User Profile:
    <Route path={`${match.url}/comments`} component={UserComments} />
    <Route path={`${match.path}/settings`} component={UserSettings} />
  </div>;
```

> 然后，我们按下面方式来访问

```javascript
/user/5/comments
/user/5/settings
```

- 实践后，我们发现，访问 comments 返回 undefined，访问 settings 返回 5

**3、避免 Match 冲突**

```javascript
const UserSubLayou = ({ match }) =>
  <div className="user-sub-layout">
    <aside>
      <UserNav />
    </aside>
    <div className="primary-content">
      <Switch>
        <Route exact path={match.path} component={BrowseUsersPage} />
        <Route path={`${match.path}/add`} component={AddUserPage} />
        <Route path={`${match.path}/:userId/edit`} component={EditUserPage} />
        <Route path={`${match.path}/:userId`} component={UserProfilePage} />
      </Switch>
    </div>
  </div>;
  
```
> 我们使用 `${match.path}/:userId(\\d+) `作为 `UserProfilePage` 对应的 `path`，保证 `:userId` 是一个数字，可以避免与 `/users/add `的冲突，这样，将其所在的 `<Route>` 丢到最前面去也能正常访问 `add` 页面  
  

十三、Authorized Route
---

> 在应用程序中限制未登录的用户访问某些路由是非常常见的，还有对于授权和未授权的用户 UI 也可能大不一样，为了解决这样的需求，我们可以考虑为应用程序设置一个主入口

```javascript
class App extends React.Component {
  render() {
return (
      <Provider store={store}>
        <BrowserRouter>
          <Switch>
            <Route path="/auth" component={UnauthorizedLayout} />
            <AuthorizedRoute path="/app" component={PrimaryLayout} />
          </Switch>
        </BrowserRouter>
      </Provider>
    )
  }
}

```

> 现在，我们首先会去选择应用程序在哪个顶级布局中，比如，`/auth/login` 和 `/auth/forgot-password` 肯定在 `UnauthorizedLayout` 中，另外，当用户登陆时，我们将判断所有的路径都有一个 /app 前缀以确保是否登录。如果用户访问 `/app` 开头的页面但并没有登录，我们将会重定向到登录页面

十四、`<Link>`
---

> 和之前版本没太大区别，重点看下组件属性

- `to（string/object）`：要跳转的路径或地址；
- `replace（bool）`：为 `true` 时，点击链接后将使用新地址替换掉访问历史记录里面的原地址；为 `false` 时，点击链接后将在原有访问历史记录的基础上添加一个新的纪录。默认为` false`

```javascript
// Link组件示例

// to为string
<Link to="/about">关于</Link>

// to为obj
<Link to={{
  pathname: '/courses',
  search: '?sort=name',
  hash: '#the-hash',
  state: { fromDashboard: true }
}}/>

// replace 
<Link to="/courses" replace />

```

**`<NavLink>`**

> `<NavLink>`是`<Link>` 的一个特定版本, 会在匹配上当前 `URL` 的时候会给已经渲染的元素添加样式参数，组件属性

- `activeClassName（string）`：设置选中样式，默认值为` active`；
- `activeStyle（object）`：当元素被选中时, 为此元素添加样式；
- `exact（bool）`：为 `true` 时, 只有当地址完全匹配 `class` 和 `style` 才会应用；
- `strict（bool）`：为 `true` 时，在确定位置是否与当前 `URL` 匹配时，将考虑位置 - `pathname` 后的斜线；
- `isActive（func）`：判断链接是否激活的额外逻辑的功能


```javascript
// 用法

// activeClassName选中时样式为selected
<NavLink
  to="/faq"
  activeClassName="selected"
>FAQs</NavLink>

// 选中时样式为activeStyle的样式设置
<NavLink
  to="/faq"
  activeStyle={{
    fontWeight: 'bold',
    color: 'red'
   }}
>FAQs</NavLink>

// 当event id为奇数的时候，激活链接
const oddEvent = (match, location) => {
  if (!match) {
    return false
  }
  const eventID = parseInt(match.params.eventID)
  return !isNaN(eventID) && eventID % 2 === 1
}

<NavLink
  to="/events/123"
  isActive={oddEvent}
>Event 123</NavLink>
```


十五、`<Switch>`
---

> 该组件用来渲染匹配地址的第一个`<Route>`或者`<Redirect>`。那么它与使用一堆`route`又有什么区别呢

- `<Switch>`的独特之处是独它仅仅渲染一个路由。相反地，每一个包含匹配地址(`location`)的`<Route>`都会被渲染

```javascript
<Switch>
  <Route exact path="/" component={Home}/>
  <Route path="/about" component={About}/>
  <Route path="/:user" component={User}/>
  <Route component={NoMatch}/>
</Switch>
```

> 现在，如果我们处于`/about`，`<Switch>`将开始寻找匹配的`<Route>`。`<Route path="/about"/>` 将被匹配， `<Switch>`将停止寻找匹配并渲染`<About>`。同样，如果我们处于`/michael`，`<User>`将被渲染

十六、更多参考
---

- https://reacttraining.com/react-router/web/guides/philosophy
