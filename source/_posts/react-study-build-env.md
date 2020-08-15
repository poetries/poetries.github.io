---
title: React之环境的搭建（一）
date: 2017-11-19 10:10:24
tags: 
 - JavaScript
 - react
categories: Front-End
---

一、什么是react
---

- react是由Facebook开发的一个JavaScript库，而不是一个框架。当时Facebook需要解决一个问题，开发（或者说是构建）一个数据不断变化的大型应用。而数据变化会带来两个很严重的问题

二、react的特点
---

- 简单：学习简单，代码简单
- 声明式（编程）：自动`DOM`操作

> `React`的核心是组件，组件的设计目的是提升代码的复用率、降低测试难度和代码复杂度。

- 提高代码复用率：组件将数据与逻辑封装
- 降低测试难度：组件高内聚低耦合，很容易对单个组件进行测试
- 降低代码复杂度：使用`JSX`语法，更直观的在js文件中看`HTML`代码，提高可读性
	
三、react的开发环境的配置
---

> 如果是要直接在`HTML`上编辑，需要下载`react.js`与`react-dom.js`。如果要使用JSX语法，则需要使用转换`JSX`语法的插件。这里使用`brower.js`。在线地址：https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.23/browser.min.js

- `react.js`：`react`的核心库
- `react-dom.js`：提供操作`DOM`相关的功能
- `brower,js`：将使用的`JSX`语法转换成`JavaScript`语法

> 注意：三者引用顺序必须是`react`、`react-dom`、`brower`

四、React、ReactDOM中有什么
---

![](https://poetries1.gitee.io/img-repo/2019/10/449.png)
![](https://poetries1.gitee.io/img-repo/2019/10/450.png)


五、yeoman环境
---

> `yeoman`前端脚手架工具

```javascript
cnpm i -g yeoman
```

- http://yeoman.io/

> https://github.com/react-webpack-generators/generator-react-webpack#readme
```javascript
# Make sure both is installed globally
npm install -g yo
npm install -g generator-react-webpack

# Create a new directory, and `cd` into it:
mkdir my-new-project && cd my-new-project

# Run the generator
yo react-webpack
```

```javascript
# Start for development
npm start # or
npm run serve

# Start the dev-server with the dist version
npm run serve:dist

# Just build the dist version and copy static files
npm run dist

# Run unit tests
npm test

# Auto-run unit tests on file changes
npm run test:watch

# Lint all files in src (also automatically done AFTER tests are run)
npm run lint

# Clean up the dist directory
npm run clean

# Just copy the static assets
npm run copy
```

六、React脚手架搭建
---

```javascript
npm i create-react-app

create-react-app your-app-name && cd your-app-name

npm install 

npm start
```
