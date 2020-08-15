---
title: 重新认识Koa2
date: 2019-03-09 19:30:10
tags: 
   - Node
   - Koa
categories: Back-end
---


# 一、Koa框架介绍以及Koa环境搭建

## 1.1 Koa 框架介绍

> `Node.js` 是一个异步的世界，官方 `API` 支持的都是 `callback` 形式的异步编程模型，这 会带来许多问题，例如:

1. `callback` 嵌套问题 
2. 异步函数中可能同步调用 callback 返回 数据，带来不一致性。为了解决以上问题 `Koa` 出现了

**Koa -- 基于 Node.js 平台的下一代 web 开发框架**

> `koa` 是由 `Express` 原班人马打造的，致力于成为一个更小、更富有表现力、更健壮的 Web 框架。 使用 `koa` 编写 `web` 应用，可以免除重复繁琐的回调函数嵌套， 并极大地提 升错误处理的效率。`koa` 不在内核方法中绑定任何中间件， 它仅仅提供了一个轻量优雅的 函数库，使得编写 Web 应用变得得心应手。开发思路和 express 差不多，最大的特点就是 可以避免异步嵌套

## 1.2 Koa2.x 框架的安装使用

**1. 安装 Node.js 8.x 以上的版本**

> 开发 `Koa2` 之前，`Node.js` 是有要求的，它要求 `Node.js` 版本高于 `V7.6`。因为 `node.js 7.6` 版本 开始完全支持 `async/await`，所以才能完全你支持我们的 Koa2`

**2. 安装 Koa**

> 安装 `Koa` 框架和我们以前安装其他模块是一样的

```
npm install --save koa / cnpm install --save koa
```

> `--save` 参数，表示自动修改 `package.json` 文件，自动添加依赖项

**简单使用**

![](https://poetries1.gitee.io/img-repo/2019/10/494.png)

# 二、koa 路由 get传值、动态路由


## 2.1 Koa 路由

- 路由(`Routing`)是由一个 `URI`(或者叫路径)和一个特定的 `HTTP` 方法(`GET`、`POST `等)
组成的，涉及到应用如何响应客户端对某个网站节点的访问
- 通俗的讲:路由就是根据不同的 `URL` 地址，加载不同的页面实现不同的功能
- `Koa` 中的路由和 `Express` 有所不同，在 `Express` 中直接引入 `Express` 就可以配置路由，但是在 `Koa` 中我们需要安装对应的 `koa-router` 路由模块来实现

```
npm install --save koa-router
```

![](https://poetries1.gitee.io/img-repo/2019/10/495.png)

## 2.2 Koa 路由 get 传值

> 在 `koa2` 中 `GET` 传值通过 `request` 接收，但是接收的方法有两种:`query` 和 `querystring`

- `query`:返回的是格式化好的参数对象。 
- `querystring`:返回的是请求字符串

![](https://poetries1.gitee.io/img-repo/2019/10/496.png)


## 2.3 Koa 动态路由

![](https://poetries1.gitee.io/img-repo/2019/10/497.png)


# 三、koa 中间件及执行流程

## 3.1 koa中间件的洋葱图执行流程

![](https://poetries1.gitee.io/img-repo/2019/10/498.gif)



## 3.2 koa 中间件

### 3.2.1 什么是 Koa 的中间件

- 通俗的讲:中间件就是匹配路由之前或者匹配路由完成做的一系列的操作，我们就可以
把它叫做中间件
- 在`express`中间件(`Middleware`)是一个函数，它可以访问请求对象(request object (req)), 响应对象(`response object (res)`), 和 `web` 应用中处理请求-响应循环流程中的中间件，一 般被命名为 next 的变量。在 `Koa` 中中间件和 `express` 有点类似。

**中间件的功能包括**

- 执行任何代码
- 修改请求和响应对象
- 终结请求-响应循环
- 调用堆栈中的下一个中间件

> 如果我的 `get`、`post` 回调函数中，没有 `next` 参数，那么就匹配上第一个路由，就不会往下匹 配了。如果想往下匹配的话，那么需要写 `next()`

### 3.2.2 Koa 应用可使用如下几种中间件

**1. 应用级中间件**

![](https://poetries1.gitee.io/img-repo/2019/10/499.png)

**2. 路由中间件**

![](https://poetries1.gitee.io/img-repo/2019/10/500.png)

**3. 错误处理中间件**

![](https://poetries1.gitee.io/img-repo/2019/10/501.png)


**4. 第三方中间件**

![](https://poetries1.gitee.io/img-repo/2019/10/502.png)

### 3.2.3 Koa 中间件的执行顺序

> `Koa` 的中间件和 `Express` 不同，`Koa` 选择了洋葱圈模型

![](https://poetries1.gitee.io/img-repo/2019/10/503.png)


# 四、koa ejs模板引擎使用 以及ejs配置全局数据

**1. 安装 koa-views 和 ejs**

- 安装 `koa-views npm install --save koa-views / cnpm install --save koa-views`
- 安装 `ejs npm install ejs --save / cnpm install ejs --save`

**2. 引入 koa-views 配置中间件**

```js
const views = require('koa-views');

app.use(views('views', { map: {html: 'ejs' }}));
```

**3. Koa 中使用 ejs**

```js
router.get('/add',async (ctx)=>{ 
    let title = 'hello koa2' 
    
    await ctx.render(index',{ title })
})
```


**4. Ejs 引入模板**

```
<%- include header.ejs %>
```

**5. Ejs 绑定数据**

```
<%=h%>
```

**6. Ejs 绑定 html 数据**

```
<%-h%>
```

**7. Ejs 模板判断语句**

```html
<% if(true){ %>
    <div>true</div>
<%} else{ %>
    <div>false</div>
<%} %>
```

**8. Ejs 模板中循环数据**

```html
<%for(var i=0;i<list.length;i++) { %>
    <li><%=list[i] %></li>
<%}%>
```

# 五、koa post 提交数据 koa-bodyparser 中间件的使用

## 5.1 原生 Nodejs 获取 post 提交数据

```js
function parsePostData(ctx){
    return new Promise((resolve,reject)=>{
        try{
            let postdata="";
            ctx.req.on('data',(data)=>{
                postdata += data
            })
            ctx.req.on("end",function(){
                resolve(postdata);
            })
        }catch(error){
            reject(error);
        }
      }
    });
}
```

## 5.2 Koa 中 koa-bodyparser 中间件的使用

**1. 安装 koa-bodyparser**

```
npm install --save koa-bodyparser
```

**2. 安装 引入配置中间件**

```js
var Koa = require('koa');
var bodyParser = require('koa-bodyparser');

var app = new Koa();

app.use(bodyParser());
app.use(async ctx => {
    ctx.body = ctx.request.body;
})
```

**3. 使用**

```js
ctx.request.body // 获取 post 提交的数据
```

# 六、koa-static静态资源中间件

**1. 安装 koa-static**

```
npm install --save koa-static
```

**2. 引入配置中间件**

```js
const static = require('koa-static');

app.use(static(
    path.join( __dirname, 'public')
))
```

# 七、koa art-template高性能模板引擎的使用

## 7.1 常见模板引擎的性能对比

> 适用于 `koa` 的模板引擎选择非常多，比如 `jade`、`ejs`、`nunjucks`、`art-template` 等

- `art-template` 是一个简约、超快的模板引擎
- 它采用作用域预声明的技术来优化模板渲染速度，从而获得接近 JavaScript 极限的运行 性能，并且同时支持 NodeJS 和浏览器。
- `art-template` 支持 `ejs` 的语法，也可以用自己的类似 `angular` 数据绑定的语法
- 中文文档: http://aui.github.io/art-template/zh-cn/docs


![](https://poetries1.gitee.io/img-repo/2019/10/504.png)

![](https://poetries1.gitee.io/img-repo/2019/10/505.png)


## 7.2 在 Koa 中使用 art-template 模板引擎

```
 npm install --save art-template 
 npm install --save koa-art-template
```

```js
const Koa = require('koa');
const render = require('koa-art-template');

const app = new Koa();

render(app, {
    root: path.join(__dirname, 'view'),
    extname: '.art',
    debug: process.env.NODE_ENV !== 'production'
});
app.use(async function (ctx) {
    await ctx.render('user');
});
app.listen(8080);
```

## 7.3 art-template 模板引擎语法

> 参考:http://aui.github.io/art-template/zh-cn/docs/syntax.html

# 八、koa Cookie的使用

## 8.1 Koa Cookie 的使用

**1. Koa 中设置 Cookie 的值**

```js
ctx.cookies.set(name, value, [options])
```

> 通过 `options` 设置 `cookie name` 的 `value` 

![](https://poetries1.gitee.io/img-repo/2019/10/506.png)

**2. Koa 中获取 Cookie 的值**

```js
ctx.cookies.get('name');
```

## 8.2 Koa 中设置中文 Cookie

```js
console.log(new Buffer('hello, world!').toString('base64'));// 转换成 base64 字符 串:aGVsbG8sIHdvcmxkIQ==

console.log(new Buffer('aGVsbG8sIHdvcmxkIQ==', 'base64').toString());// 还原 base 64 字符串:hello, world!
```

# 九、koa Session 的使用

## 9.1 Session 简单介绍

> `session` 是另一种记录客户状态的机制，不同的是 `Cookie` 保存在客户端浏览器中，而 `session` 保存在服务器上

## 9.2 Session 的工作流程

> 当浏览器访问服务器并发送第一次请求时，服务器端会创建一个 `session` 对象，生 成一个类似于 `key`,`value` 的键值对， 然后将`key(cookie)`返回到浏览器(客户)端，浏览 器下次再访问时，携带 `key(cookie)`，找到对应的 `session(value)`。 客户的信息都保存 在 `session` 中

## 9.3 koa-session 的使用

**1. 安装 express-session**

```
npm install koa-session --save
```

**2. 引入 express-session**

```
const session = require('koa-session');
```

**3. 设置官方文档提供的中间件**

```js
app.keys = ['some secret hurr'];
const CONFIG = {
    key: 'koa:sess', //cookie key (default is koa:sess)
    maxAge: 86400000, // cookie 的过期时间 maxAge in ms (default is 1 days)
    overwrite: true, //是否可以 overwrite (默认 default true)
    httpOnly: true, //cookie 是否只有服务器端可以访问 httpOnly or not (default true)
    signed: true, //签名默认 true
    rolling:false, //在每次请求时强行设置cookie，这将重置cookie过期时间(默认:false)
    renew: false, //(boolean) renew session when session is nearly expired
}
app.use(session(CONFIG, app));
```

**4. 使用**

```js
//设置值 
ctx.session.username = "张三";

// 获取值 
ctx.session.username
```

## 9.4 Cookie 和 Session 区别

- `cookie` 数据存放在客户的浏览器上，`session` 数据放在服务器上
- `cookie` 不是很安全，别人可以分析存放在本地的 `COOKIE` 并进行 `COOKIE` 欺骗 考虑到安全应当使用 `session`
- `session`会在一定时间内保存在服务器上。当访问增多，会比较占用你服务器的性能 考虑到减轻服务器性能方面，应当使用 `COOKIE`
- 单个 `cookie` 保存的数据不能超过 `4K`，很多浏览器都限制一个站点最多保存 `20` 个 `cookie`

# 十、Koa 操作 Mongodb 数据库

> 官方文档:http://mongodb.github.io/node-mongodb-native/

# 十一、Koa 应用生成器以及 Koa 路由模 块化

## 11.1 koa 应用生成器

> 通过应用 `koa` 脚手架生成工具 可以快速创建一个基于 `koa2` 的应用的骨架

**1. 全局安装**

```
npm install koa-generator -g
```

**2. 创建项目**

```
koa koa_demo
```

**3. 安装依赖**

```
cd koa_demo

npm install
```

**4. 启动项目**

```
npm start
```

## 11.2 koa 搭建模块化路由/层级路由

1. 在目录下面新建一个文件夹 `routes`
2. 在 `routes` 里面配置对应的子页面
3. 比如在 `routes` 新建 `index.js`

![](https://poetries1.gitee.io/img-repo/2019/10/507.png)

4. 然后在主应用中加载子路由模块:

![](https://poetries1.gitee.io/img-repo/2019/10/508.png)