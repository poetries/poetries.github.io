---
title: 使用Next搭建React SSR工程架构之基础篇(二)
date: 2018-11-18 12:20:32
tags: 
   - React
   - SSR
categories: Front-End
---

## 一、Next.js是什么

> `Next.js`是一个基于`React`的一个服务端渲染简约框架。它使用`React`语法，可以很好的实现代码的模块化，有利于代码的开发和维护

### 1.1 Next.js带来了很多好的特性

- 默认服务端渲染模式，以文件系统为基础的客户端路由
- 代码自动分隔使页面加载更快
- 以页面为基础的简洁的客户端路由
- 以`webpack`的热替换为基础的开发环境
- 使用`React`的`JSX`和`ES6`的`module`，模块化和维护更方便
- 可以运行在`Express`和其他`Node.js`的`HTTP` 服务器上
- 可以定制化专属的`babel`和`webpack`配置

## 二、构建一个基本的Next项目

### 2.1 创建项目

```js
// 在本地创建一个项目跟目录
$ mkdir hello-next 

// 切换到项目根目录
$ cd hello-next

// 用npm初始化项目
$ npm init -y

// 将react和next安装到本地依赖
$ npm install --save react react-dom next

// 创建文件夹 pages
$ mkdir pages
```

> 创建完文件夹之后，打开`hello-next`文件下的`package.json`文件，在 `scripts `下添加一个`script`，如下

```js
{
  "scripts": {
    "dev": "next"
  }
}
```

```
$ npm run dev
```

### 2.2 创建页面

> `Next.js`是从服务器生成页面，再返回给前端展示。`Next.js`默认从 `pages` 目录下取页面进行渲染返回给前端展示，并默认取 `pages/index.js` 作为系统的首页进行展示。注意，`pages` 是默认存放页面的目录，路由的根路径也是`pages`目录

- 在 `pages/index.js` 中创建一个`React`函数式组件

```jsx
const Index = () => (
  <div>
    <p>Hello Next.js</p>
  </div>
)

export default Index
```

> `Next.js`默认使用`Webpack`构建项目，`webpack`的热部署功能一样能提升开发效率。创建完 `pages/index.js` 后，再访问 `http://localhost:3000` 即可看到设置好的页面

- 在 `pages` 目录下创建文件 `pages/about.js`

```js
export default () => (
  <div>
    <p>This is the about page</p>
  </div>
)
```

> 创建完之后，可以通过 `http://localhost:3000/about` 访问该页面。至此，所有的页面的路由都是通过后端服务器来控制的，要想实现客户端路由，需要借助`Next.js`的`Link API`。

**Link API**

> 从 `next/link`中可以引用到 `Link` 组件。在`pages/index.js`文件中引用`Link`，修改如

```jsx
// This is the Link API
import Link from 'next/link'

const Index = () => (
  <div>
    <Link href="/about">
      <a>About Page</a>
    </Link>
    <p>Hello Next.js</p>
  </div>
)

export default Index
```

1. `Link`组件是通过`location.history`的浏览器API保存历史路由，所以，你可以通过浏览器左上角的前进和后退按钮来切换历史路由。而在开发过程中，你不需要再单独写客户端路由的配置
2. `Link`组件是`React`的高阶组件的实现，不能对它进行样式的设置，它只是起到路由的跳转功能，但是它的复用性强，只要包含一个能触发`onClick`事件的组件即可

### 2.3 组件复用

> `Next.js`是以多页面为中心，只要将页面文件放在`pages`目录下，就可以在浏览器上以文件名为路由名来访问到

- 组件的设置跟React一样，通过`export`导出，通过`import`导入。一般，只要不想让用户通过页面直接访问的组件，都不放在`pages`目录下。对除了`pages`目录，组件放在哪个目录下没有要求，开发者可以自定义设置

> 下面再 `components` 目录下，创建一个公用组件 `Header`，用于各个文件的头部导航，通过导航可以在页面见切换

```jsx
import Link from 'next/link'

const linkStyle = {
  marginRight: 15
}

const Header = () => (
  <div>
    <Link href="/">
      <a style={linkStyle}>Home</a>
    </Link>
    <Link href="/about">
      <a style={linkStyle}>About</a>
    </Link>
  </div>
)

export default Header
```

在 `pages/index.js` 中引入`Header`

```jsx
import Header from '../components/Header'

export default () => (
  <div>
    <Header />
    <p>Hello Next.js</p>
  </div>
)
```

> 进一步封装`Header`组件，创建一个自动包含`Header`和`Content`的组件 `components/MyLayout.js`

```jsx
import Header from './Header'

const layoutStyle = {
  margin: 20,
  padding: 20,
  border: '1px solid #DDD'
}

const Layout = (props) => (
  <div style={layoutStyle}>
    <Header />
    {props.children}
  </div>
)

export default Layout
```

### 2.4 创建动态页面

> 使用`Next.js`创建动态页面，与使用`React`或`Vue`创建一个`SPA`页面大体相同，唯一的区别就是页面的渲染主体不同，前者是`Nodejs`服务器获取到后端数据渲染完页面后再返回给前端展示，后者是前端先获取页面主体架构，再通过`ajax`的方式请求后端的数据，在前端渲染展示

以一个简易的博客页面为例，创建博客列表页，修改 `pages/index.js`


```jsx
import Layout from '../components/MyLayout.js'

import Link from 'next/link'

const PostLink = (props) => (
  <li>
    <Link href={`/post?title=${props.title}`}>
      <a>{props.title}</a>
    </Link>
  </li>
)

export default () => (
  <Layout>
    <h1>My Blog</h1>
    <ul>
      <PostLink title="Hello Next.js"/>
      <PostLink title="Learn Next.js is awesome"/>
      <PostLink title="Deploy apps with Zeit"/>
    </ul>
  </Layout>
)
```

> 有了列表页，需要再写一个博客的详情页，从上面的代码中也可看到，我们需要创建一个 `pages/post.js` 文件

```jsx
import Layout from '../components/MyLayout.js'

export default (props) => (
  <Layout>
    <h1>{props.url.query.title}</h1>
    <p>This is the blog post content.</p>
  </Layout>
)
```

### 2.5 用路由遮盖（Route Masking）的干净的URL

> `Next.js`上提供了一个独特的特性：路由遮盖（Route Masking）。它可以使得在浏览器上显示的是路由`A`，而`App`内部真正的路由是`B`。这个特性可以让我们来设置一些比较简洁的路由显示在页面，而系统背后是使用一个带参数的路由。比如上面的例子中，地址栏中显示的是 `http://localhost:3000/post?title=Hello%20Next.js` ，这个地址含有一个`title`参数，看着很不整洁。下面我们就用`Next.js`来改造路由，使用路由遮盖来创建一个更加简洁的路由地址。比如我们将该地址改造成 `http://localhost:3000/p/hello-nextjs`

首先我们要修改 `pages/index.js` 下的`PostLink`组件，会使用到 `next/link` 组件的 `as` 属性，并给组件添加一个属性 `id`

```jsx
import Layout from '../components/MyLayout.js'

import Link from 'next/link'

const PostLink = (props) => (
  <li>
    <Link as={`/p/${props.id}`} 
      href={`/post?title=${props.title}`}>
      <a>{props.title}</a>
    </Link>
  </li>
)

export default () => (
  <Layout>
    <h1>My Blog</h1>
    <ul>
      <PostLink id="hello-nextjs" 
        title="Hello Next.js"/>
      <PostLink id="learn-nextjs" 
        title="Learn Next.js is awesome"/>
      <PostLink id="deploy-nextjs" 
        title="Deploy apps with Zeit"/>
    </ul>
  </Layout>
)
```

1. 当在 `Link` 组件上使用 `as` 属性时，浏览器上显示的是 `as` 属性的值，走的是客户端路由，而服务器真正映射的是 `href` 属性的值，走的是服务端路由
2. 这样就会有一个问题，如果在前端路由间切换不会有问题，可以正常显示，但是在页面 `http://localhost:3000/p/hello-nextjs` 时刷新页面，会显示 `404`页面。这是因为路由遮盖默认只在客户端路由中有效，要想在服务端也支持路由遮盖，需要在服务端单独设置路由解析的方法

### 2.6 服务端支持路由遮盖

> 上面说到，服务器默认不支持路由遮盖，要让服务器支持它，需要单独对路由进行设置。下面以 `Express` （你也可以使用Koa等其他Nodejs的Web服务器框架）创建后端服务器讲解如何设置服务器来支持路由遮盖

```
$ npm install --save express
```

在项目目录下创建 `server.js` ，添加内容如下


```js
const express = require('express')
const next = require('next')
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = express()

  server.get('/p/:id', (req, res) => {
    const actualPage = '/post'
    const queryParams = { 
        title: req.params.id 
    } 
    app.render(req, res, actualPage, queryParams)
  })

  server.get('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(3000, (err) => {
    if (err) throw err
    console.log('> Ready on http://localhost:3000')
  })
}).catch((ex) => {
  console.error(ex.stack)
  process.exit(1)
})
```

并更新 `package.json` 文件中的 `scripts `：

```js
{
  "scripts": {
    "dev": "node server.js"
  }
}
```

> 这时候，服务器已经可以支持路由遮盖了，在显示遮盖路由的页面，刷新页面也可以正常显示内容。具体的实现是在服务器中对 `/p/*` 开头的路由进行重写，然后重定向到 `/post` 开头的路由上，最后将内容返回给前端。具体代码是这一段：

```js
server.get('/p/:id', (req, res) => {
  const actualPage = '/post'
  const queryParams = { 
      title: req.params.id 
  } 
  app.render(req, res, actualPage, queryParams)
})
```

### 2.7 请求接口，获取数据

> `Next.js` 在 `React `的基础上为组件添加了一个新的特性： `getInitialProps `（有点像是`getInitialState`），它用于获取并处理组件的属性，返回组件的默认属性。我们可以在改方法中请求数据，获取页面需要的数据并渲染返回给前端页面

引入一个支持在客户端和服务器端发送 `fetch` 请求的插件 `isomorphic-unfetch`，当然你也可以使用 `axios` 等其他工具

```
$ npm install --save isomorphic-unfetch
```

然后修改 `pages/index.js` 里的内容，换成下面这样：

```jsx
import Layout from '../components/MyLayout.js'
import Link from 'next/link'
import fetch from 'isomorphic-unfetch'

const Index = (props) => (
  <Layout>
    <h1>Batman TV Shows</h1>
    <ul>
      {props.shows.map(({show}) => (
        <li key={show.id}>
          <Link as={`/p/${show.id}`} 
            href={`/post?id=${show.id}`}>
            <a>{show.name}</a>
          </Link>
        </li>
      ))}
    </ul>
  </Layout>
)

Index.getInitialProps = async function() {
  const res = await fetch('https://api.tvmaze.com/search/shows?q=batman')
  const data = await res.json()

  console.log(`Show data fetched. Count: ${data.length}`)

  return {
    shows: data
  }
}

export default Index
```

> 上述代码中，在 `getInitialProps` 中使用了 `async` 和 `await` 来处理异步请求，并将取到的数据当做一个属性赋给页面，页面拿到这个属性的值后会用于页面的初始化渲染

### 2.8 样式化组件

> `Next.js` 提供了一个 `css-in-js` 的特性，它允许你在组件内部写一些样式，你只需要在组件内使用 `<style jsx>` 标签来写 `css` 即可。举个例子，比如我们在 `pages/index.js `里添加样式

```jsx
import Layout from '../components/MyLayout.js'

import Link from 'next/link'

function getPosts () {
  return [
    { 
      id: 'hello-nextjs', 
      title: 'Hello Next.js'
    },
    { 
      id: 'learn-nextjs', 
      title: 'Learn Next.js is awesome'
    },
    { 
      id: 'deploy-nextjs', 
      title: 'Deploy apps with ZEIT'
    }
  ]
}

export default () => (
  <Layout>
    <h1>My Blog</h1>
    <ul>
      {getPosts().map((post) => (
        <li key={post.id}>
          <Link as={`/p/${post.id}`} 
            href={`/post?title=${post.title}`}>
            <a>{post.title}</a>
          </Link>
        </li>
      ))}
    </ul>
    <style jsx>{`
      h1, a {
        font-family: "Arial";
      }
      ul {
        padding: 0;
      }
      li {
        list-style: none;
        margin: 5px 0;
      }
      a {
        text-decoration: none;
        color: blue;
      }
      a:hover {
        opacity: 0.6;
      }
    `}</style>
  </Layout>
)
```

> 在上述代码中，我们没有直接使用` <style>` 标签来书写样式代码，而是写在一个模板字符串`（{``}）`里面。`Next.js` 使用 `babel`插件来解析 `styled-jsx` ，它支持样式命名空间，未来还将支持变量赋值。

**需要注意的是**：`styled-jsx` 的样式不会应用到子组件，如果想要该样式适用于子组件，可以在` styled-jsx` 标签添加属性 `global：<style jsx global>。`

### 2.9 怎么部署一个next.js项目

> `Next.js` 项目的部署，需要一个 `Node.js`的服务器，可以选择 `Express`, `Koa `或其他 `Nodejs` 的Web服务器。本文中以 `Express` 为例来部署 `Next` 项目。

服务器的入口文件就使用上文中提到的 `server.js`，在 `server.js` 里添加了针对部署环境的选择，代码如下

```
const dev = process.env.NODE_ENV !== 'production'
```

> 为了区分部署环境，我们需要在 `package.json` 中修改 `script` 属性如下

```js
"scripts": {
  "build": "next build",
  "start": "NODE_ENV=production node server.js -",
  "dev": "NODE_ENV=dev node server.js"
}
```

> 其中，`build` 命令是用于打包项目，`start` 命令是用于生产环境部署，dev 命令是用于本地开发。

执行如下命令即可将` Next`项目 部署到服务器

```
$ npm run build
$ npm run start
```

### 2.10 完整代码示例

> https://github.com/poetries/react-next

## 三、更多须知

### 3.1 创建 `/static` 文件夹，存放静态资源

> 静态资源文件夹文件会映射到 `/static/` 路由下，直接通过 `http://localhost:3000/static/test.png` 访问

### 3.2 使用内置组件 `<head>` 定制每个页面的 `head` 部分

```jsx
import Head from 'next/head'; // 引入内置组件

export default () => (
   <div>
      <Head>
         <title>index page</title>
         <meta name="viewport" content="initial-scale=1.0, width=device-width"/>
      </Head>
      <div>this is index page</div>
   </div>
);
```

### 3.3 使用内置组件 `<Link>` 进行路由跳转

```jsx
import Link from 'next/link';

export default () => (
   <div>
      <p>this is home index page</p>
      <Link href="/about">
         <a> to about page</a>
      </Link>
   </div>
);
```

**更多 Link 使用方式**

```jsx
import React, {Component} from 'react';
import Link from 'next/link';

export default class About extends Component {
   constructor(props) {
      super(props);
   }
   render() {
      // href 值可以是一个对象
      const href = {
         pathname: '/home',
         query: {name: 'test'}
      };

      return (
        <div>
           <p>this is about page </p>
           <img src="/static/test.png" alt="test"/>
           {/* replace 覆盖历史跳转 */}
           <Link href={href} replace>
            <a>click to home index page</a>
           </Link>
        </div> 
      );
   }
}
```

### 3.4 使用内置 `router` 方法，手动触发路由跳转

> `next/router` 提供一套方法和属性，帮助确认当前页面路由参数，和手动触发路由跳转

```js
import router from 'next/router';
/*
    router.pathname  ==> /home
    router.query ==> {}
    router.route - 当前路由
    asPath - 显示在浏览器地址栏的实际的路由
    push(url, as=url) - 跳转页面的方法
    replace(url, as=url) - 跳转页面
*/
```

> 更好的方式使用路由 – `router` 的 `withRouter` 方法

```jsx
import Link from 'next/link';
import {withRouter} from 'next/router';

const Home = (props) => {
    // 这里的 props 会得到 {router, url} 两个属性
    // router: {push: ƒ, replace: ƒ, reload: ƒ, back: ƒ, prefetch: ƒ, …}
    // url: {query: {…}, pathname: "/home", asPath: "/home?name=test", back: ƒ, push: ƒ, …}
   console.log(props);
   return (
      <div>
         <p>this is home index page </p>
         {/* <Link href="/about">
            <a> to about page</a>
         </Link> */}
      </div>
   );
}

export default withRouter(Home);
```

### 3.5 使用 `next-redux-wrapper` 插件辅助实现 `redux`

**1. 安装依赖**

```
sudo yarn add next-redux-wrapper redux react-redux redux-devtools-extension redux-thunk
```

**2. 创建 initializeStore.js 一个可以返回 store 实例的函数**

> 在这个文件中会完成装载中间件、绑定`reducer`、链接浏览器的`redux`调试工具等操作

```jsx
import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension'; 
import thunk from 'redux-thunk';
import reducer from '../modules/reducers';

const middleware = [thunk];
const initializeStore = initialState => {
   return createStore(
         reducer, 
         initialState, 
         composeWithDevTools(applyMiddleware(...middleware))
      );
};

export default initializeStore;
```

**3. 创建 reducer , action**

> 与普通 `react-redux` 项目创建 `reducer`, `action` 的方法一致，我把这部分代码都提取到一个名为 `modules`的文件夹中


```js
// /modules/reducers.js
import { combineReducers } from 'redux';
import about from './about/reducer';

// 合并到主reducer
const reducers = {
   about
};

// combineReducers() 函数用于将分离的 reducer 合并为一个 reducer 
export default combineReducers(reducers);
```

```js
// /modules/about/reudcer.js 
// /about 页面的 reducer
import {
   CHANGE_COUNT
} from '../types-constant';

const initialState = {
   count: 0
};

const typesCommands = {
   [CHANGE_COUNT](state, action) {
      return Object.assign({}, state, { count: action.msg });
   },
}

export default function home(state = initialState, action) {
   const actionResponse = typesCommands[action.type];

   return actionResponse ? actionResponse(state, action) : state;
}
```

```js
// /modules/about/actions.js
// /about 页面的 action
import {
   CHANGE_COUNT
} from '../types-constant';

export function changeCount(newCount) {
   return {
      type: CHANGE_COUNT,
      msg: newCount
   };
}
```

**4. 页面中使用**

> 需要用到 `next-redux-wrapper` 提供的 `withRedux` 高阶函数，以及 `react-redux` 提供的 `connect` 高阶函数

```jsx
import React, { Component } from 'react';
import withRedux from 'next-redux-wrapper';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import AboutCom from '../components/About/index';
import initializeStore from '../store/initializeStore';
import { changeCount } from '../modules/about/actions';

class About extends Component {
   constructor(props) {
      super(props);
   }
   render() {
      const { about: { count }, changeCount } = this.props;
      return <AboutCom count={count} changeCount={changeCount} />;
   }
}

const connectedPage = connect(
   state => ({ about: state.about }),
   dispatch => ({
      changeCount: bindActionCreators(changeCount, dispatch)
   })
)(About);

export default withRedux(initializeStore)(connectedPage);
```

### 3.6 处理styled-components样式

> 在`pages/_document.js`中处理

```jsx
import Document, { Head, Main, NextScript } from 'next/document'
import { ServerStyleSheet } from 'styled-components'

const pro = process.env.NODE_ENV === 'production'
const path = pro ? 'https://cdn.yesdat.com' : ''

export default class MyDocument extends Document {
  static getInitialProps({ renderPage }) {
    // 新建一个样式表
    const sheet = new ServerStyleSheet() 
    
    // 收集样式
    const page = renderPage(App => props => sheet.collectStyles(<App {...props} />))
    const styleTags = sheet.getStyleElement()

    const {
      html, head, errorHtml, chunks,
    } = renderPage()

    return {
      html, head, errorHtml, chunks,...page, styleTags
    }
  }
  render() {
    return (
      <html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no" />
          <meta name="theme-color" content="#000000" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-touch-fullscreen" content="yes" />
          <link rel="stylesheet" href={`${path}/static/styles/antd_mobile_min.css`} />
          <link rel="stylesheet" href={`${path}/static/styles/app_min.css?8`} />
          <link rel="stylesheet" href={`${path}/static/styles/nprogress.css`} />
          <link rel="stylesheet" href={`${path}/static/styles/index.css`} />
          {/* styled-components样式*/}
          <style>{this.props.styleTags}</style>
        </Head>
        <body>
          {this.props.customValue}
          <Main />
          <NextScript />
        </body>
      </html>
    )
  }
}
```

