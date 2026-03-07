---
title: nodejs系列之express
date: 2018-12-23 23:02:10
tags: 
  - Node
  - Express
categories: Back-End
---


一、概述
---

> 官网 http://expressjs.com/zh-cn/

>` Express`是目前最流行的基于Node.js的Web开发框架，可以快速地搭建一个完整功能的网站

**环境搭建**

> http://www.expressjs.com.cn/starter/generator.html

> 通过应用生成器工具 `express-generator `可以快速创建一个应用的骨架

```
$ npm install express-generator -g
```


二、运行原理
---

**底层：http模块**

> Express框架建立在node.js内置的http模块上。http模块生成服务器的原始代码如下

```javascript
var http = require("http");

var app = http.createServer(function(request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end("Hello world!");
});

app.listen(3000, "localhost");
```

> Express框架的核心是对http模块的再包装。上面的代码用Express改写如下

```javascript
var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('Hello world!');
});

app.listen(3000);
```

> Express框架等于在http模块之上，加了一个中间层


**什么是中间件**

> - 简单说，中间件（middleware）就是处理HTTP请求的函数。它最大的特点就是，一个中间件处理完，再传递给下一个中间件。App实例在运行过程中，会调用一系列的中间件
> - 每个中间件可以从App实例，接收三个参数，依次为request对象（代表HTTP请求）、response对象（代表HTTP回应），next回调函数（代表下一个中间件）。每个中间件都可以对HTTP请求（request对象）进行加工，并且决定是否调用next方法，将request对象再传给下一个中间件。

- 一个不进行任何操作、只传递`request`对象的中间件，就是下面这样


```javascript
function uselessMiddleware(req, res, next) {
  next();
}
```

- 上面代码的next就是下一个中间件。如果它带有参数，则代表抛出一个错误，参数为错误文本
- 抛出错误以后，后面的中间件将不再执行，直到发现一个错误处理函数为止


```javascript
function uselessMiddleware(req, res, next) {
  next('出错了！');
}
```

三、use方法
---

> use是express注册中间件的方法，它返回一个函数。下面是一个连续调用两个中间件的例子

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

> 上面代码使用app.use方法，注册了两个中间件。收到HTTP请求后，先调用第一个中间件，在控制台输出一行信息，然后通过next方法，将执行权传给第二个中间件，输出HTTP回应。由于第二个中间件没有调用next方法，所以request对象就不再向后传递了



- use方法内部可以对访问路径进行判断，据此就能实现简单的路由，根据不同的请求网址，返回不同的网页内容

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

> 上面代码通过`request.url`属性，判断请求的网址，从而返回不同的内容。注意，`app.use`方法一共登记了三个中间件，只要请求路径匹配，就不会将执行权交给下一个中间件。因此，最后一个中间件会返回`404`错误，即前面的中间件都没匹配请求路径，找不到所要请求的资源


- 除了在回调函数内部判断请求的网址，`use`方法也允许将请求网址写在第一个参数。这代表，只有请求路径匹配这个参数，后面的中间件才会生效。无疑，这样写更加清晰和方便



```javascript
// 只对根目录的请求，调用某个中间件
app.use('/path', someMiddleware);
```

- 因此，上面的代码可以写成下面的样子

```
ar express = require("express");
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

四、Express的方法
---

**all方法和HTTP动词方法**

> 针对不同的请求，Express提供了use方法的一些别名。比如，上面代码也可以用别名的形式来写

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

> - 上面代码的all方法表示，所有请求都必须通过该中间件，参数中的“*”表示对所有路径有效。get方法则是只有GET动词的HTTP请求通过该中间件，它的第一个参数是请求的路径。由于get方法的回调函数没有调用next方法，所以只要有一个中间件被调用了，后面的中间件就不会再被调用了
> - 除了get方法以外，Express还提供post、put、delete方法，即HTTP动词都是Express的方法

- 除了get方法以外，Express还提供post、put、delete方法，即HTTP动词都是Express的方法
- 这些方法的第一个参数，都是请求的路径。除了绝对匹配以外，Express允许模式匹配

```javascript
app.get("/hello/:who", function(req, res) {
  res.end("Hello, " + req.params.who + ".");
});
```

五、set方法
---

> set方法用于指定变量的值

- 使用set方法，为系统变量“views”和“view engine”指定值
```javascript
app.set("views", __dirname + "/views");

app.set("view engine", "jade");
```

六、response对象
---

**（1）response.redirect方法**


> response.redirect方法允许网址的重定向

```javascript
response.redirect("/hello/anime");
response.redirect("http://www.example.com");
response.redirect(301, "http://www.example.com"); 
```

**（2）response.sendFile方法**

> response.sendFile方法用于发送文件

```javascript
response.sendFile("/path/to/anime.mp4");
```

**（3）response.render方法**

> response.render方法用于渲染网页模板。

```
//  使用render方法，将message变量传入index模板，渲染成HTML网页
app.get("/", function(request, response) {
  response.render("index", { message: "Hello World" });
});
```


七、requst对象
---

**（1）request.ip**

> request.ip属性用于获得HTTP请求的IP地址

**（2）request.files**

> request.files用于获取上传的文件

八、搭建HTTPs服务器
---


> 使用Express搭建HTTPs加密服务器，也很简单

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


九、静态网页模板
---

> - 在项目目录之中，建立一个子目录views，用于存放网页模板
> - 假定这个项目有三个路径：根路径（/）、自我介绍（/about）和文章（/article）。那么，app.js可以这样写

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


十、动态网页模板
---

**安装模板引擎**

> Express支持多种模板引擎，这里采用Handlebars模板引擎的服务器端版本hbs模板引擎

```javascript
npm install hbs --save-dev
```

- 安装模板引擎之后，就要改写app.js

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

> 上面代码改用render方法，对网页模板进行渲染。render方法的参数就是模板的文件名，默认放在子目录views之中，后缀名已经在前面指定为html，这里可以省略。所以，res.render(‘index’) 就是指，把子目录views下面的index.html文件，交给模板引擎hbs渲染


十一、新建数据脚本
---

> - 渲染是指将数据代入模板的过程。实际运用中，数据都是保存在数据库之中的，这里为了简化问题，假定数据保存在一个脚本文件中
> - 在项目目录中，新建一个文件blog.js，用于存放数据。blog.js的写法符合CommonJS规范，使得它可以被require语句加载

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

十二、新建网页模板
---

> 接着，新建模板文件`index.html`


```javascript
<!-- views/index.html文件 -->

<h1>文章列表</h1>
 
{{#each entries}}
   <p>
      <a href="/article/{{id}}">{{title}}</a><br/>
      Published: {{published}}
   </p>
{{/each}}
```

```javascript
<!-- views/about.html文件 -->

<h1>自我介绍</h1>
 
<p>正文</p>
```

```javascript
<!-- views/article.html文件 -->

<h1>{{blog.title}}</h1>
Published: {{blog.published}}
 
<p/>
 
{{blog.body}}
```

> 可以看到，上面三个模板文件都只有网页主体。因为网页布局是共享的，所以布局的部分可以单独新建一个文件`layout.html`


```javascript
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


十三、渲染模板
---

> 最后，改写app.js文件

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

- 上面代码中的render方法，现在加入了第二个参数，表示模板变量绑定的数据


十四、指定静态文件目录
---

> 模板文件默认存放在views子目录。这时，如果要在网页中加载静态文件（比如样式表、图片等），就需要另外指定一个存放静态文件的目录

```javascript
app.use(express.static('public'));
```

> 上面代码在文件app.js之中，指定静态文件存放的目录是public。于是，当浏览器发出非HTML文件请求时，服务器端就到public目录寻找这个文件。比如，浏览器发出如下的样式表请求：

```javascript
<link href="/bootstrap/css/bootstrap.css" rel="stylesheet">
```

- 服务器端就到`public/bootstrap/css/`目录中寻找`bootstrap.css`文件

十五、Express.Router用法
---

> 从`Express 4.0`开始，路由器功能成了一个单独的组件`Express.Router`。它好像小型的`express`应用程序一样，有自己的`use`、`get`、`param`和`route`方法

**基本用法**

> 首先，Express.Router是一个构造函数，调用后返回一个路由器实例。然后，使用该实例的HTTP动词方法，为不同的访问路径，指定回调函数；最后，挂载到某个路径。


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

> - 上面代码先定义了两个访问路径，然后将它们挂载到根目录
> - 这种路由器可以自由挂载的做法，为程序带来了更大的灵活性，既可以定义多个路由器实例，也可以为将同一个路由器实例挂载到多个路径。

十六、router.route方法
---

> router实例对象的route方法，可以接受访问路径作为参数

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

十七、router中间件
---

> use方法为router对象指定中间件，即在数据正式发给用户之前，对数据进行处理。下面就是一个中间件的例子

```javascript
router.use(function(req, res, next) {
	console.log(req.method, req.url);
	next();	
});
```

- 上面代码中，回调函数的next参数，表示接受其他中间件的调用。函数体中的next()，表示将数据传递给下一个中间件
- 注意，中间件的放置顺序很重要，等同于执行顺序。而且，中间件必须放在HTTP动词方法之前，否则不会执行

十八、对路径参数的处理
---

> router对象的param方法用于路径参数的处理，可以

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

> 上面代码中，get方法为访问路径指定了name参数，param方法则是对name参数进行处理。注意，param方法必须放在HTTP动词方法之前

十九、app.route
---

> - 假定app是Express的实例对象，Express 4.0为该对象提供了一个route属性。app.route实际上是express.Router()的缩写形式，直接挂载到根路径
> - 因此，对同一个路径指定get和post方法的回调函数，可以写成链式形式

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

二十、上传文件
---

- 首先，在网页插入上传文件的表单

```javascript
<form action="/pictures/upload" method="POST" enctype="multipart/form-data">
  Select an image to upload:
  <input type="file" name="image">
  <input type="submit" value="Upload Image">
</form>
```

> 然后，服务器脚本建立指向/upload目录的路由。这时可以安装multer模块，它提供了上传文件的许多功能

```javascript
var express = require('express');
var router = express.Router();
var multer = require('multer');

var uploading = multer({
  dest: __dirname + '../public/uploads/',
  // 设定限制，每次最多上传1个文件，文件大小不超过1MB
  limits: {fileSize: 1000000, files:1},
})

router.post('/upload', uploading, function(req, res) {

})

module.exports = router
```
