---
title: nodejs系列之express中间件机制与路由用法详解
description: 从 http 模块出发讲清 Express 的中间件模型、use 与 HTTP 动词方法、Express.Router 路由拆分、模板引擎渲染与 multer 文件上传，并标注 Express 5 之后变化的写法。
date: 2018-12-23 23:02:10
tags: 
  - Node
  - Express
  - 中间件
categories: Back-End
---

接手过一个 Node 服务，路由文件八百多行，全塞在 `app.js` 里，改一个接口得先滚一遍屏幕找位置。翻代码的时候发现一个更要命的问题，有个鉴权中间件被写在了路由后面，实际上一次都没执行过，接口是裸奔的状态。这类问题的根子不在业务代码写得糙，而在于对 Express 的执行顺序没搞明白。

这篇把 Express 从最底下的 `http` 模块开始捋一遍，讲清楚中间件到底是什么、`use` 和 `get` 这些方法的执行顺序凭什么是那样、路由怎么用 `Express.Router` 拆出去，最后补一段 2018 年之后 Express 变过的写法。读完你应该能自己判断一个中间件该放在哪一行。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Express 相对原生 `http` 模块到底包了一层什么
- 中间件的定义、`next` 的两种用法与错误传递机制
- `use` 注册的中间件为什么严格按注册顺序执行
- `all` 与 HTTP 动词方法的区别，路径的模式匹配怎么写
- `response` 与 `request` 上最常用的那几个属性和方法
- 用 hbs 模板引擎从静态页面过渡到动态渲染的完整例子
- `Express.Router` 拆路由、`router.param` 处理路径参数、`app.route` 链式写法
- multer 处理文件上传的最小可用配置
- 这篇里哪些写法在 Express 4 / 5 上已经不成立了

## 一、Express 到底包了一层什么

官网在 [expressjs.com](http://expressjs.com/zh-cn/)，中文文档在 [expressjs.com.cn](http://www.expressjs.com.cn/starter/generator.html)。Express 是基于 Node.js 的 Web 开发框架，用它能比较快地搭出一个功能完整的网站。

想要一个现成的骨架，装应用生成器 `express-generator` 就行。

```
$ npm install express-generator -g
```

生成出来的目录结构是 `bin/www` 加 `app.js` 加 `routes/`，这套结构现在看有点老，但它把入口、应用配置、路由三块分开的思路是对的，后面第十节讲 Router 的时候你会看到一样的分法。

先说结论，Express 的核心就是对 Node 内置 `http` 模块的再包装。不用 Express 直接起一个服务，代码是这样。

```javascript
var http = require("http");

var app = http.createServer(function(request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end("Hello world!");
});

app.listen(3000, "localhost");
```

`createServer` 的回调只有一个，所有请求都从这一个函数进来。路径判断、参数解析、错误处理，全得你自己在这个函数里写 `if`。项目一大，这个函数就会变成前面说的那种八百行的怪物。

同样的功能用 Express 写是这样。

```javascript
var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('Hello world!');
});

app.listen(3000);
```

差别不在代码短了几行，而在于 Express 在 `http` 模块之上加了一个中间层。这个中间层干的事，就是把那个巨大的回调函数拆成一串可以排队执行的小函数。

## 二、中间件就是排队处理请求的函数

中间件（middleware）就是处理 HTTP 请求的函数。它最大的特点是，一个中间件处理完，再传递给下一个中间件。App 实例在运行过程中，会调用一系列的中间件。

每个中间件从 App 实例接收三个参数，依次是 `request` 对象（代表 HTTP 请求）、`response` 对象（代表 HTTP 回应）、`next` 回调函数（代表下一个中间件）。每个中间件都可以对 `request` 对象进行加工，并且决定是否调用 `next` 方法，把 `request` 对象再传给下一个中间件。

一个什么都不干、只负责往下传的中间件长这样。

```javascript
function uselessMiddleware(req, res, next) {
  next();
}
```

这里有个坑要注意，`next` 带不带参数是两件完全不同的事。不带参数就是正常往下走；带上参数就代表抛出一个错误，参数是错误文本。

```javascript
function uselessMiddleware(req, res, next) {
  next('出错了！');
}
```

抛出错误以后，后面的普通中间件全部跳过，Express 会一路找到第一个错误处理函数为止。错误处理函数的签名是四个参数 `(err, req, res, next)`，Express 靠形参个数来区分它和普通中间件，少写一个参数它就不认了。这个我踩过，错误中间件写成三个参数，结果错误一路穿透到默认处理器，返回一个带堆栈的 HTML 页面直接甩给了前端。

还有一件事不能忘，调用了 `next()` 之后如果又调用了 `res.send()`，或者反过来，就会撞上 `Cannot set headers after they are sent` 这个报错。一个请求的生命周期里，响应只能结束一次。

## 三、use 方法与最原始的路由

`use` 是 Express 注册中间件的方法，它返回一个函数。下面是连续调用两个中间件的例子。

```javascript
var express = require("express");
var http = require("http");

var app = express();

app.use(function(request, response, next) {
  console.log("In comes a " + request.method + " to " + request.url);
  next();
});

app.use(function(request, response) {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("Hello world!\n");
});

http.createServer(app).listen(1337);
```

收到 HTTP 请求后先调第一个中间件，在控制台输出一行信息，然后通过 `next` 把执行权交给第二个中间件，输出 HTTP 回应。第二个中间件没有调 `next`，`request` 对象就不再往后传了。

顺着上面聊，`use` 内部可以对访问路径做判断，靠这个就能实现最朴素的路由，根据不同的请求网址返回不同的内容。

```javascript
var express = require("express");
var http = require("http");

var app = express();

app.use(function(request, response, next) {
  if (request.url == "/") {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Welcome to the homepage!\n");
  } else {
    next();
  }
});

app.use(function(request, response, next) {
  if (request.url == "/about") {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Welcome to the about page!\n");
  } else {
    next();
  }
});

app.use(function(request, response) {
  response.writeHead(404, { "Content-Type": "text/plain" });
  response.end("404 error!\n");
});

http.createServer(app).listen(1337);
```

这段通过 `request.url` 判断请求的网址，从而返回不同的内容。`app.use` 一共登记了三个中间件，只要请求路径匹配上了，就不会把执行权交给下一个。所以最后一个中间件承担了兜底职责，前面都没匹配上，它就返回 404。

顺便说一句，原文这个例子的第二个中间件里只写了 `writeHead` 没写 `response.end`，请求会一直挂着直到超时。上面这版我把 `end` 补上了。这种漏掉 `end` 的 bug 在真实项目里很常见，表现是接口一直 pending，前端还以为是网络慢。

除了在回调函数内部判断请求的网址，`use` 也允许把请求网址写在第一个参数上。只有请求路径匹配这个参数，后面的中间件才会生效。这样写更清晰。

```javascript
// 只对根目录的请求，调用某个中间件
app.use('/path', someMiddleware);
```

于是上面那段可以改写成下面的样子。

```javascript
var express = require("express");
var http = require("http");

var app = express();

app.use("/home", function(request, response, next) {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("Welcome to the homepage!\n");
});

app.use("/about", function(request, response, next) {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("Welcome to the about page!\n");
});

app.use(function(request, response) {
  response.writeHead(404, { "Content-Type": "text/plain" });
  response.end("404 error!\n");
});

http.createServer(app).listen(1337)
```

原文这段的第一行是 `ar express = require("express")`，少了个 `v`，照抄会直接报语法错误，这里改对了。

有一点必须记牢，`use` 的路径参数是前缀匹配。写 `app.use('/home', fn)` 的话，`/home/detail` 也会命中。这和后面 `app.get('/home', fn)` 的精确匹配是两种行为，混着用很容易出现「为什么这个中间件在子路径上也跑了」的困惑。

## 四、all 方法和 HTTP 动词方法

针对不同的请求，Express 提供了 `use` 方法的一些别名。上面那段也可以用别名的形式来写。

```javascript
var express = require("express");
var http = require("http");
var app = express();

app.all("*", function(request, response, next) {
  response.writeHead(200, { "Content-Type": "text/plain" });
  next();
});

app.get("/", function(request, response) {
  response.end("Welcome to the homepage!");
});

app.get("/about", function(request, response) {
  response.end("Welcome to the about page!");
});

app.get("*", function(request, response) {
  response.end("404!");
});

http.createServer(app).listen(1337);
```

`all` 表示所有请求都必须通过这个中间件，参数里的 `*` 表示对所有路径有效。`get` 则只有 GET 动词的 HTTP 请求会通过，它的第一个参数是请求的路径。由于 `get` 的回调没有调用 `next`，所以只要有一个中间件被调用了，后面的就不会再被调用。

除了 `get`，Express 还提供 `post`、`put`、`delete` 方法，HTTP 动词基本都是 Express 的方法。这些方法的第一个参数都是请求的路径，除了绝对匹配以外，Express 还允许模式匹配。

```javascript
app.get("/hello/:who", function(req, res) {
  res.end("Hello, " + req.params.who + ".");
});
```

`:who` 是具名参数，匹配到的值会挂到 `req.params.who` 上。访问 `/hello/poetry` 拿到的就是 `poetry`。要注意这个值是原始字符串，没有做任何类型转换和转义，直接扔进数据库查询是有注入风险的，该校验还得校验。

这里补一条时效性的说明。上面那个 `app.get("*", ...)` 的写法在 Express 4 上没问题，但 Express 5 换了新的路径解析实现，裸的 `*` 通配符不再被接受，需要写成带名字的形式。具体语法以官方迁移文档为准，如果你在新项目里照抄这段发现启动就报路径解析错误，多半就是这个原因。

## 五、set 方法配置应用级变量

`set` 方法用于指定变量的值。比较常用的是给系统变量 `views` 和 `view engine` 赋值。

```javascript
app.set("views", __dirname + "/views");

app.set("view engine", "jade");
```

`views` 告诉 Express 去哪个目录找模板文件，`view engine` 指定默认的模板引擎。设了 `view engine` 之后，`res.render('index')` 就不用写后缀名了。

`set` 能设的不止这两个。生产环境里我一般还会加 `app.set('trust proxy', 1)`，因为服务通常挂在 Nginx 后面，不开这个的话 `req.ip` 拿到的永远是 `127.0.0.1`，日志里记的来源 IP 全是错的。

顺带说一下，上面那行 `jade` 是当年的写法。jade 因为商标问题改名叫 pug 了，新项目直接用 pug，API 基本一致。

## 六、response 对象常用的三个方法

`response.redirect` 允许网址的重定向。

```javascript
response.redirect("/hello/anime");
response.redirect("http://www.example.com");
response.redirect(301, "http://www.example.com"); 
```

不写状态码默认是 302 临时跳转，浏览器不会缓存。写 301 是永久跳转，浏览器会记住，下次直接跳过去不再问服务器。域名迁移这类场景才用 301，业务逻辑里的跳转一律用默认的 302，不然你改了跳转目标，老用户的浏览器还在往旧地址跑，清都清不掉。

`response.sendFile` 用于发送文件。

```javascript
response.sendFile("/path/to/anime.mp4");
```

这个方法要求传绝对路径，传相对路径会抛错，得配合 `path.join(__dirname, ...)` 用。

`response.render` 用于渲染网页模板。

```javascript
//  使用render方法，将message变量传入index模板，渲染成HTML网页
app.get("/", function(request, response) {
  response.render("index", { message: "Hello World" });
});
```

第一个参数是模板名，第二个参数是要注入模板的数据。这三个方法覆盖了绝大多数场景，剩下的 `res.json`、`res.status`、`res.set` 也是高频，`res.send` 会根据传入值的类型自动设 `Content-Type`，传对象就当 JSON 发。

## 七、request 对象上你会用到的东西

`request.ip` 用于获得 HTTP 请求的 IP 地址。前面说过，服务挂在反向代理后面时记得配 `trust proxy`，否则这个值没意义。

`request.files` 用于获取上传的文件。这个属性不是 Express 自带的，得先挂上传中间件才会有，第十一节讲 multer 的时候会用到。

除此之外你几乎一定会用到 `req.params`（路径参数）、`req.query`（查询字符串）、`req.body`（请求体，需要 body 解析中间件）这三个。这三个的来源完全不同，`req.query` 由 Express 自动解析，`req.body` 必须先注册解析中间件，很多人第一次拿到 `undefined` 就是漏了这一步。

## 八、搭建 HTTPS 服务器

用 Express 搭 HTTPS 加密服务器也很简单，本质是把 `app` 交给 `https.createServer`。

```javascript
var fs = require('fs');
var options = {
  key: fs.readFileSync('E:/ssl/myserver.key'),
  cert: fs.readFileSync('E:/ssl/myserver.crt'),
  passphrase: '1234'
};

var https = require('https');
var express = require('express');
var app = express();

app.get('/', function(req, res){
  res.send('Hello World Expressjs');
});

var server = https.createServer(options, app);
server.listen(8084);
console.log('Server is running on port 8084');
```

`options` 里的 `key` 和 `cert` 分别是私钥和证书，`passphrase` 是私钥的口令，没设口令就不用写这一项。

这块我想多说一句现在的做法。除非你在做本地调试或者内网服务，生产环境很少直接让 Node 进程去处理 TLS。更常见的做法是把证书配在 Nginx 上，Node 只监听本机的明文端口，由 Nginx 做 TLS 终止再转发过来。好处是证书续期、协议版本、加密套件这些事都收在一处管理，Node 应用不用为了换证书重启。

## 九、从静态页面到模板引擎

先看最简单的情况。在项目目录之中建一个子目录 `views`，用于存放网页模板。假定这个项目有三个路径，根路径（`/`）、自我介绍（`/about`）和文章（`/article`），`app.js` 可以这样写。

```javascript
// 向服务器发送信息的方法，从send变成了sendfile，后者专门用于发送文件
var express = require('express');
var app = express();
 
app.get('/', function(req, res) {
   res.sendfile('./views/index.html');
});
 
app.get('/about', function(req, res) {
   res.sendfile('./views/about.html');
});
 
app.get('/article', function(req, res) {
   res.sendfile('./views/article.html');
});
 
app.listen(3000);
```

这里的 `res.sendfile`（全小写）是老 API，Express 4 之后已经标记为废弃，现在应该写 `res.sendFile`（大写 F）并且传绝对路径。原文保留这个写法是当年的实际情况，你在新代码里照抄的话控制台会打一行 deprecation 警告。

静态 HTML 的问题很明显，页面里的数据是写死的。要让数据动起来就得上模板引擎。

Express 支持多种模板引擎，这里采用 Handlebars 模板引擎的服务器端版本 hbs。

```bash
npm install hbs --save-dev
```

装完之后改写 `app.js`。

```javascript
// app.js文件

var express = require('express');
var app = express();

// 加载hbs模块
var hbs = require('hbs');

// 指定模板文件的后缀名为html
app.set('view engine', 'html');

// 运行hbs模块
app.engine('html', hbs.__express);

app.get('/', function (req, res){
	res.render('index');
});

app.get('/about', function(req, res) {
	res.render('about');
});

app.get('/article', function(req, res) {
	res.render('article');
});
```

改用 `render` 方法对网页模板进行渲染。`render` 的参数就是模板的文件名，默认放在子目录 `views` 之中，后缀名已经在前面指定为 `html`，这里可以省略。所以 `res.render('index')` 就是指，把 `views` 下面的 `index.html` 文件交给模板引擎 hbs 渲染。

`app.engine('html', hbs.__express)` 这行是关键，它把 `.html` 后缀和 hbs 的渲染函数绑在一起。不写这行，Express 会去找一个叫 `html` 的模板引擎，然后报模块找不到。

### 9.1 准备数据

渲染是指把数据代入模板的过程。实际项目里数据都在数据库里，这里为了简化问题，假定数据保存在一个脚本文件中。新建一个 `blog.js` 存放数据，写法符合 CommonJS 规范，可以被 `require` 加载。

```javascript
// blog.js文件

var entries = [
	{"id":1, "title":"第一篇", "body":"正文", "published":"6/2/2013"},
	{"id":2, "title":"第二篇", "body":"正文", "published":"6/3/2013"},
	{"id":3, "title":"第三篇", "body":"正文", "published":"6/4/2013"},
	{"id":4, "title":"第四篇", "body":"正文", "published":"6/5/2013"},
	{"id":5, "title":"第五篇", "body":"正文", "published":"6/10/2013"},
	{"id":6, "title":"第六篇", "body":"正文", "published":"6/12/2013"}
];

exports.getBlogEntries = function (){
   return entries;
}
 
exports.getBlogEntry = function (id){
   for(var i=0; i < entries.length; i++){
      if(entries[i].id == id) return entries[i];
   }
}
```

这里的 `==` 是故意的，路径参数拿到的是字符串 `"1"`，数据里的 `id` 是数字 `1`，用 `===` 反而匹配不上。真要写严谨一点，应该在比较前做 `Number(id)` 转换，然后用 `===`。老代码里这种依赖隐式类型转换的地方特别多，读的时候留个心眼。

### 9.2 写模板文件

接着新建模板文件 `index.html`。

```html
<!-- views/index.html文件 -->

<h1>文章列表</h1>
 
{{#each entries}}
   <p>
      <a href="/article/{{id}}">{{title}}</a><br/>
      Published: {{published}}
   </p>
{{/each}}
```

```html
<!-- views/about.html文件 -->

<h1>自我介绍</h1>
 
<p>正文</p>
```

```html
<!-- views/article.html文件 -->

<h1>{{blog.title}}</h1>
Published: {{blog.published}}
 
<p/>
 
{{blog.body}}
```

原文这几段的代码围栏标的是 `javascript`，里面装的其实是 HTML，我改成了 `html`，高亮才对得上。

可以看到上面三个模板文件都只有网页主体。因为网页布局是共享的，所以布局的部分可以单独新建一个文件 `layout.html`。

```html
<!-- views/layout.html文件 -->

<html>
 
<head>
   <title>{{title}}</title>
</head>
 
<body>
 
	{{{body}}}
 
   <footer>
      <p>
         <a href="/">首页</a> - <a href="/about">自我介绍</a>
      </p>
   </footer>
    
</body>
</html>
```

注意布局文件里的 `body` 用了三层花括号。Handlebars 里两层花括号会做 HTML 转义，三层不转义。子模板渲染出来的是 HTML 片段，转义了就会在页面上看到一堆 `&lt;p&gt;`。反过来说，凡是插入用户输入的地方一定要用两层，这是最基本的 XSS 防线。

### 9.3 把数据接到模板上

最后改写 `app.js` 文件。

```javascript
// app.js文件

var express = require('express');
var app = express();
 
var hbs = require('hbs');

// 加载数据模块
var blogEngine = require('./blog');
 
app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(express.bodyParser());
 
app.get('/', function(req, res) {
   res.render('index',{title:"最近文章", entries:blogEngine.getBlogEntries()});
});
 
app.get('/about', function(req, res) {
   res.render('about', {title:"自我介绍"});
});
 
app.get('/article/:id', function(req, res) {
   var entry = blogEngine.getBlogEntry(req.params.id);
   res.render('article',{title:entry.title, blog:entry});
});
 
app.listen(3000);
```

`render` 方法现在加了第二个参数，表示模板变量绑定的数据。

这段里的 `express.bodyParser()` 要单独说一下。它属于 Express 3 时代的内置中间件，Express 4 把这些内置中间件全部剥离成了独立的包，`express.bodyParser` 从此不存在，照抄这行会直接抛 `most middleware is no longer bundled with Express` 的错误。Express 4.16 之后官方又把 body 解析加了回来，写法是 `app.use(express.json())` 和 `app.use(express.urlencoded({ extended: true }))`。这一段原文保留了当年的写法，你实际动手时按新写法来。

### 9.4 指定静态文件目录

模板文件默认存放在 `views` 子目录。这时如果要在网页中加载静态文件（样式表、图片等），就需要另外指定一个存放静态文件的目录。

```javascript
app.use(express.static('public'));
```

指定静态文件存放的目录是 `public`。于是当浏览器发出非 HTML 文件请求时，服务器端就到 `public` 目录寻找这个文件。比如浏览器发出如下的样式表请求。

```html
<link href="/bootstrap/css/bootstrap.css" rel="stylesheet">
```

服务器端就到 `public/bootstrap/css/` 目录中寻找 `bootstrap.css` 文件。

`express.static` 的注册位置很重要。它是个前缀匹配的中间件，放在鉴权中间件前面，静态资源就绕过了鉴权；放在最后，每个静态请求都要先过一遍前面所有中间件，白白浪费。我的习惯是放在日志中间件之后、鉴权之前。

## 十、用 Express.Router 把路由拆出去

从 Express 4.0 开始，路由器功能成了一个单独的组件 `Express.Router`。它像一个小型的 express 应用程序，有自己的 `use`、`get`、`param` 和 `route` 方法。

`Express.Router` 是一个构造函数，调用后返回一个路由器实例。用这个实例的 HTTP 动词方法为不同的访问路径指定回调函数，最后挂载到某个路径上。

```javascript
var router = express.Router();

router.get('/', function(req, res) {
  res.send('首页');
});

router.get('/about', function(req, res) {
  res.send('关于');
});

app.use('/', router);
```

上面先定义了两个访问路径，然后把它们挂载到根目录。这种路由器可以自由挂载的做法带来了很大的灵活性，既可以定义多个路由器实例，也可以把同一个路由器实例挂载到多个路径。

回到开头那个八百行 `app.js` 的问题，解法就在这。按业务域拆成 `routes/user.js`、`routes/order.js`，每个文件导出一个 router，`app.js` 里三行 `app.use('/user', userRouter)` 就挂完了。挂载前缀写在 `app.js` 里，路由文件内部只关心相对路径，将来整体改前缀只动一个地方。

### 10.1 router.route 方法

router 实例对象的 `route` 方法可以接受访问路径作为参数。

```javascript
var router = express.Router();

router.route('/api')
	.post(function(req, res) {
		// ...
	})
	.get(function(req, res) {
		Bear.find(function(err, bears) {
			if (err) res.send(err);
			res.json(bears);
		});
	});

app.use('/', router);
```

好处是同一个路径的不同动词写在一起，路径字符串只写一遍，改路径的时候不会漏改。

### 10.2 router 中间件

`use` 方法为 router 对象指定中间件，也就是在数据正式发给用户之前对数据进行处理。

```javascript
router.use(function(req, res, next) {
	console.log(req.method, req.url);
	next();	
});
```

回调函数的 `next` 参数表示接受其他中间件的调用，函数体中的 `next()` 表示将数据传递给下一个中间件。

中间件的放置顺序很重要，等同于执行顺序。而且中间件必须放在 HTTP 动词方法之前，否则不会执行。

这句话就是文章开头那个鉴权失效事故的答案。鉴权中间件写在了 `router.get('/list', ...)` 后面，请求匹配到 `/list` 就直接返回了，压根走不到后面那一行。这个问题在测试环境很难发现，因为接口能正常返回数据，看起来一切正常。

### 10.3 对路径参数的处理

router 对象的 `param` 方法用于路径参数的处理。

```javascript
router.param('name', function(req, res, next, name) {
	// 对name进行验证或其他处理……
	console.log(name);
	req.name = name;
	next();	
});

router.get('/hello/:name', function(req, res) {
	res.send('hello ' + req.name + '!');
});
```

`get` 方法为访问路径指定了 `name` 参数，`param` 方法则是对 `name` 参数进行处理。同样地，`param` 方法必须放在 HTTP 动词方法之前。

`param` 的典型用法是把「按 id 查实体」这类重复逻辑收在一处。比如 `router.param('id', ...)` 里直接查库拿到对象挂到 `req.entity` 上，查不到就 `next(new Error('not found'))`，后面所有带 `:id` 的路由都不用再写一遍查询和判空。这个设计是真的舒服。

### 10.4 app.route

假定 `app` 是 Express 的实例对象，Express 4.0 为该对象提供了一个 `route` 属性。`app.route` 实际上是 `express.Router()` 的缩写形式，直接挂载到根路径。因此对同一个路径指定 `get` 和 `post` 方法的回调函数，可以写成链式形式。

```javascript
app.route('/login')
	.get(function(req, res) {
		res.send('this is the login form');
	})
	.post(function(req, res) {
		console.log('processing');
		res.send('processing the login form!');
	});
```

小项目用 `app.route` 够了，路由多了还是拆成独立的 Router 文件更好维护。

## 十一、文件上传

在网页里插入上传文件的表单，关键是 `enctype` 必须是 `multipart/form-data`，不写这个浏览器只会把文件名当普通字段发过去。

```html
<form action="/pictures/upload" method="POST" enctype="multipart/form-data">
  Select an image to upload:
  <input type="file" name="image">
  <input type="submit" value="Upload Image">
</form>
```

服务器脚本建立指向 `/upload` 目录的路由。这时可以安装 multer 模块，它提供了上传文件的许多功能。

```javascript
var express = require('express');
var router = express.Router();
var multer = require('multer');

var uploading = multer({
  dest: __dirname + '../public/uploads/',
  // 设定限制，每次最多上传1个文件，文件大小不超过1MB
  limits: {fileSize: 1000000, files:1},
})

router.post('/upload', uploading.single('image'), function(req, res) {
  res.json({ file: req.file })
})

module.exports = router
```

原文这里是 `router.post('/upload', uploading, ...)`，直接把 multer 实例当中间件用。multer 实例本身不是中间件，得调 `.single(fieldName)`、`.array(fieldName, n)` 或者 `.fields([...])` 才会返回真正的中间件函数，我按 `.single('image')` 改了，字段名对应表单里 `<input type="file" name="image">` 的 `name`。

`limits` 那两个配置比看上去重要得多。不限制大小的话，任何人都能往你的磁盘上传一个几个 G 的文件，这是最省事的一种拒绝服务攻击。`dest` 只填目录，multer 会生成随机文件名，不会保留原始扩展名，需要的话得自己在回调里重命名。另外别信客户端传上来的 `mimetype`，那是可以伪造的，真要卡文件类型得读文件头。

## 十二、这篇里过时的写法，现在怎么写

这篇原文写于 2018 年，代码大量使用 `var` 和 `function` 回调。原始写法我都保留了，因为那是当年真实的样子，但你在新项目里应该按下面这几条来。

变量声明用 `const` 和 `let`，回调改成箭头函数。异步逻辑用 `async/await` 而不是回调嵌套，Express 4 的路由处理器不会自动捕获 async 函数抛出的错误，需要包一层 try-catch 或者用 `express-async-errors` 这类补丁。这一点在 Express 5 有改进，具体行为以官方文档为准。

`express.bodyParser()` 用 `express.json()` 和 `express.urlencoded()` 替代，`res.sendfile` 改成 `res.sendFile` 并传绝对路径，jade 改用 pug。路径通配符 `*` 在 Express 5 上语法有变化，迁移前先看官方的 Migrating to Express 5 文档。

Express 5 已经正式发布了。它做的主要是清理废弃 API、改进 Promise 支持和路径匹配这几件事，中间件模型本身没变，所以这篇讲的中间件顺序、`next` 机制、Router 拆分这些概念仍然成立。

如果你想对比另一种中间件模型，可以接着看这个系列的另一篇 [nodejs系列之Koa2](https://feinterview.poetries.top/blog/koa2)。Koa 用洋葱模型加 async 函数替代了 Express 这套线性传递，同一个中间件里可以在 `await next()` 前后各写一段逻辑，做耗时统计和统一错误处理会比 Express 干净很多。想再往下挖 Koa 内部是怎么把中间件串起来的，我另外写过一篇 [重新认识 Koa](https://feinterview.poetries.top/blog/relearn-koa) 讲源码实现。

## 总结

Express 值得记住的东西其实不多。

它就是 `http` 模块外面套的一层中间件调度器，请求进来按注册顺序过一遍函数队列，谁先结束响应谁说了算。理解了这一点，中间件放哪一行、为什么鉴权会失效、为什么静态资源绕过了权限，这些问题就都有答案了。

`use` 是前缀匹配，动词方法是精确匹配，这两者的差异是排查路由问题时第一个要检查的地方。错误处理中间件必须写四个参数，少一个 Express 就不认。`next()` 之后不要再动响应对象。

路由一旦超过两三百行就该拆 Router，按业务域一个文件一个 router，挂载前缀统一写在入口。`router.param` 能把重复的查库和判空收在一处，用好了能省掉大量样板代码。

至于那些过时的 API，遇到老项目照着第十二节对一遍就行，中间件模型本身这么多年没变过，这才是 Express 真正值钱的部分。

## 参考

- [Express 官方文档](https://expressjs.com/)
- [Express 中文文档](http://www.expressjs.com.cn/)
- [Express 中间件使用指南](https://expressjs.com/en/guide/using-middleware.html)
- [Express 路由文档](https://expressjs.com/en/guide/routing.html)
- [Migrating to Express 5](https://expressjs.com/en/guide/migrating-5.html)
- [multer 仓库](https://github.com/expressjs/multer)
- [前端进阶之旅](https://interview.poetries.top)
