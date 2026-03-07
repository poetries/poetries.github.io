---
title: nodejs系列之Koa2
date: 2018-12-23 19:10:43
tags: 
  - Node
  - Koa2
categories: Back-End
---

> 来源互联网

一、基本用法
---

> Koa 就是一种简单好用的 Web 框架。它的特点是优雅、简洁、表达力强、自由度高


**1.1 架设 HTTP 服务**

> 只要三行代码，就可以用 `Koa` 架设一个 `HTTP` 服务。

```javascript
const Koa = require('koa');
const app = new Koa();

app.listen(3000);
```

> 打开浏览器，访问` http://127.0.0.1:3000` 。你会看到页面显示"Not Found"，表示没有发现任何内容。这是因为我们并没有告诉 `Koa` 应该显示什么内容


**通过脚手架构建服务**

```bash
npm install koa-generator -g
```

> 创建一个项目 `koa2 -e hello-koa2` `-e`表示`ejs`语法，不写则是`jade`语法

![](https://poetries1.gitee.io/img-repo/2019/10/346.png)

> 打开浏览器，访问` http://127.0.0.1:3000` 



**1.2 Context 对象**

> `Koa` 提供一个 `Context` 对象，表示一次对话的上下文（包括 `HTTP` 请求和 `HTTP` 回复）。通过加工这个对象，就可以控制返回给用户的内容


- `Context.response.body`属性就是发送给用户的内容

```javascript
const Koa = require("koa");
const app = new Koa();

app.use(ctx => { //处理请求的中间件
    ctx.response.body = "hello world";
}).listen(3000);
```

> 上面代码中，`main`函数用来设置`ctx.response.body`。然后，使用`app.use`方法加载`main`函数

- `ctx.response`代表 `HTTP Response`。同样地，`ctx.request`代表 `HTTP Request`


**1.3 HTTP Response 的类型**

> `Koa` 默认的返回类型是`text/plain`，如果想返回其他类型的内容，可以先用`ctx.request.accepts`判断一下，客户端希望接受什么数据（根据 `HTTP Request` 的Accept字段），然后使用`ctx.response.type`指定返回类型

```javascript
const Koa = require("koa");
const app = new Koa();

app.use(ctx => {
    if (ctx.request.accepts('xml')) {
        ctx.response.type = 'xml';
        ctx.response.body = '<data>Hello World</data>';
    } else if (ctx.request.accepts('json')) {
        ctx.response.type = 'json';
        ctx.response.body = { data: 'Hello World' };
    } else if (ctx.request.accepts('html')) {
        ctx.response.type = 'html';
        ctx.response.body = '<p>Hello World</p>';
    } else {
        ctx.response.type = 'text';
        ctx.response.body = 'Hello World';
    }
}).listen(3000);
```

**1.4 网页模板**

> 实际开发中，返回给用户的网页往往都写成模板文件。我们可以让 Koa 先读取模板文件，然后将这个模板返回给用户


```javascript
const Koa = require("koa");
const app = new Koa();
const fs = require('fs');

app.use(ctx => {
    ctx.response.type = 'html';
    ctx.response.body = fs.createReadStream('./demos/template.html');
}).listen(3000);
```

二、路由
---

> 网站一般都有多个页面。通过`ctx.request.path`可以获取用户请求的路径，由此实现简单的路由

```javascript
const Koa = require("koa");
const app = new Koa();
const fs = require('fs');

app.use(ctx => {
    if (ctx.request.path !== '/') {
        ctx.response.type = 'html';
        ctx.response.body = '<a href="/">Index Page1</a>';
    } else {
        ctx.response.body = 'Hello World';
    }
}).listen(3000);
```

**2.2 koa-route 模块**

> 原生路由用起来不太方便，我们可以使用封装好的`koa-route`模块


```javascript
const Koa = require("koa");
const app = new Koa();
const fs = require('fs');
const route = require('koa-route');

const main = route.get("/", ctx => {
    ctx.response.type = 'html';
    ctx.response.body = '<a href="/">Index Page1</a>';
})
const about = route.get("/about", ctx => {
    ctx.response.body = 'Hello World';
})

app.use(main);
app.use(about);
app.listen(3000);
```


**2.3 静态资源**

> 如果网站提供静态资源（图片、字体、样式表、脚本......），为它们一个个写路由就很麻烦，也没必要。`koa-static`模块封装了这部分的请求

```javascript
// 访问 http://localhost:3000/test.json
const Koa = require("koa");
const app = new Koa();

const path = require('path');
const serve = require('koa-static');

const main = serve(path.join(__dirname, "../public/"));

app.use(main);
app.listen(3000);
```

**2.4 重定向**
> 有些场合，服务器需要重定向（`redirect`）访问请求。比如，用户登陆以后，将他重定向到登陆前的页面。`ctx.response.redirect()`方法可以发出一个`302`跳转，将用户导向另一个路由

```javascript
const Koa = require("koa");
const app = new Koa();
const route = require("koa-route");

const redirect = route.get("/redirect", ctx => {
    ctx.response.redirect('/');
    ctx.response.body = '<a href="/">Index Page</a>';
})
const main = route.get("/", ctx => {
    ctx.response.body = "hello world";
});

app.use(main);
app.use(redirect);
app.listen(3000);
```

三、中间件
---
    

**3.1 Logger 功能**

> Koa 的最大特色，也是最重要的一个设计，就是中间件（middleware）。为了理解中间件，我们先看一下 Logger （打印日志）功能的实现


**3.2 中间件的概念**

> "中间件"（middleware），它处在 HTTP Request 和 HTTP Response 中间，用来实现某种中间功能。app.use()用来加载中间件


- 基本上，Koa 所有的功能都是通过中间件实现的，前面例子里面的main也是中间件
- 每个中间件默认接受两个参数，第一个参数是 Context 对象，第二个参数是next函数。只要调用next函数，就可以把执行权转交给下一个中间件

**3.3 中间件栈**

> 多个中间件会形成一个栈结构（`middle stack`），以"先进后出"（`first-in-last-out`）的顺序执行


- 最外层的中间件首先执行。
- 调用next函数，把执行权交给下一个中间件。
- ...
- 最内层的中间件最后执行。
- 执行结束后，把执行权交回上一层的中间件。
- ...
- 最外层的中间件收回执行权之后，执行next函数后面的代码


```javascript
const Koa = require('koa');
const app = new Koa();

const one = (ctx, next) => {
  console.log('>> one');
  next();
  console.log('<< one');
}

const two = (ctx, next) => {
  console.log('>> two');
  next();
  console.log('<< two');
}

const three = (ctx, next) => {
  console.log('>> three');
  next();
  console.log('<< three');
}

app.use(one);
app.use(two);
app.use(three);

app.listen(3000);
```

```javascript
>> one
>> two
>> three
<< three
<< two
<< one
```

> 如果中间件内部没有调用`next`函数，那么执行权就不会传递下去


**3.4 异步中间件**

> 如果有异步操作（比如读取数据库），中间件就必须写成 `async` 函数

```javascript
const fs = require('fs.promised');
const Koa = require('koa');
const app = new Koa();

const main = async function (ctx, next) {
  ctx.response.type = 'html';
  ctx.response.body = await fs.readFile('./demos/template.html', 'utf8');
};

app.use(main);
app.listen(3000);
```

> 上面代码中，`fs.readFile`是一个异步操作，必须写成`await fs.readFile()`，然后中间件必须写成 `async`函数。

**3.5 中间件的合成**

> `koa-compose`模块可以将多个中间件合成为一个

```javascript
const Koa = require('koa');
const compose = require('koa-compose');
const app = new Koa();

const logger = (ctx, next) => {
  console.log(`${Date.now()} ${ctx.request.method} ${ctx.request.url}`);
  next();
}

const main = ctx => {
  ctx.response.body = 'Hello World';
};

const middlewares = compose([logger, main]);

app.use(middlewares);
app.listen(3000);

```

四、错误处理
---

**4.1 500 错误**


> 如果代码运行过程中发生错误，我们需要把错误信息返回给用户。HTTP 协定约定这时要返回500状态码

- `Koa `提供了`ctx.throw()`方法，用来抛出错误，`ctx.throw(500)`就是抛出`500`错误

```javascript
const Koa = require('koa');
const app = new Koa();

const main = ctx => {
  ctx.throw(500);
};

app.use(main);
app.listen(3000);

```

**4.2 404错误**

> 如果将`ctx.response.status`设置成`404`，就相当于`ctx.throw(404)`，返回`404`错误

```javascript
const Koa = require('koa');
const app = new Koa();

const main = ctx => {
  ctx.response.status = 404;
  ctx.response.body = 'Page Not Found';
};

app.use(main);
app.listen(3000);

```

**4.3 处理错误的中间件**

> 为了方便处理错误，最好使用`try...catch`将其捕获。但是，为每个中间件都写`try...catch`太麻烦，我们可以让最外层的中间件，负责所有中间件的错误处理

```javascript
const Koa = require('koa');
const app = new Koa();

const handler = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.status = err.statusCode || err.status || 500;
    ctx.response.body = {
      message: err.message
    };
  }
};

const main = ctx => {
  ctx.throw(500);
};

app.use(handler);
app.use(main);
app.listen(3000);

```

**4.4 error 事件的监听**

> 运行过程中一旦出错，Koa 会触发一个error事件。监听这个事件，也可以处理错误

```javascript
const Koa = require('koa');
const app = new Koa();

const main = ctx => {
  ctx.throw(500);
};

app.on('error', (err, ctx) => {
  console.error('server error', err);
});

app.use(main);
app.listen(3000);

```

> 访问 http://127.0.0.1:3000 ，你会在命令行窗口看到"server error xxx"。

五、Web App 的功能
---


**5.1 Cookies**

> ctx.cookies用来读写 Cookie

> 访问 http://127.0.0.1:3000 ，你会看到1 views。刷新一次页面，就变成了2 views。再刷新，每次都会计数增加1


```javascript
const Koa = require('koa');
const app = new Koa();

const main = function(ctx) {
    const n = Number(ctx.cookies.get('view') || 0) + 1;
    ctx.cookies.set('view', n);
    ctx.response.body = n + ' views';
}

app.use(main);
app.listen(3000);
```

**5.2 表单**

> `Web `应用离不开处理表单。本质上，表单就是` POST` 方法发送到服务器的键值对。`koa-body`模块可以用来从 `POST` 请求的数据体里面提取键值对

```javascript
const Koa = require('koa');
const koaBody = require('koa-body');
const app = new Koa();

const main = async function(ctx) {
  const body = ctx.request.body;
  if (!body.name) ctx.throw(400, '.name required');
  ctx.body = { name: body.name };
};

app.use(koaBody());
app.use(main);
app.listen(3000);
```
- 打开另一个命令行窗口，运行下面的命令

```javascript
$ curl -X POST --data "name=Jack" 127.0.0.1:3000
{"name":"Jack"}

$ curl -X POST --data "name" 127.0.0.1:3000
name required
```
> 上面代码使用 POST 方法向服务器发送一个键值对，会被正确解析。如果发送的数据不正确，就会收到错误提示。

**2.3 文件上传**

> koa-body模块还可以用来处理文件上传

- 打开另一个命令行窗口，运行下面的命令，上传一个文件。注意，`/path/to/file`要更换为真实的文件路径

```javascript
$ curl --form upload=@/path/to/file http://127.0.0.1:3000
["/tmp/file"]
```


```javascript
const os = require('os');
const path = require('path');
const Koa = require('koa');
const fs = require('fs');
const koaBody = require('koa-body');

const app = new Koa();

const main = async function(ctx) {
  const tmpdir = os.tmpdir();
  const filePaths = [];
  const files = ctx.request.body.files || {};

  for (let key in files) {
    const file = files[key];
    const filePath = path.join(tmpdir, file.name);
    const reader = fs.createReadStream(file.path);
    const writer = fs.createWriteStream(filePath);
    reader.pipe(writer);
    filePaths.push(filePath);
  }

  ctx.body = filePaths;
};

app.use(koaBody({ multipart: true }));
app.use(main);
app.listen(3000);
```

