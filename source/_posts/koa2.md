---
title: nodejs系列之Koa2 洋葱模型与中间件实战
description: 从三行代码起服务讲到 Koa2 的 Context、路由、洋葱模型中间件、错误兜底与表单文件上传，逐段解释每个 API 在解决什么问题，并补上这些写法在今天的替代方案。
date: 2018-12-23 19:10:43
tags: 
  - Node
  - Koa2
  - 中间件
categories: Back-End
---

第一次从 Express 切到 Koa 的时候，我卡在了一个很蠢的地方：中间件里写了 `next()`，后面的代码却在响应发出去之后才执行，日志里的耗时统计全是 0 毫秒。排查了一下午才反应过来，Koa 的 `next()` 返回的是 Promise，得 `await` 它，否则你拿到的只是「我把执行权交出去了」这一瞬间，而不是「下游全部跑完了」。

这篇把 Koa2 从起服务到中间件、错误处理、表单文件上传整条线过一遍。重点放在洋葱模型上，因为那是 Koa 和 Express 真正分道扬镳的地方，也是面试里最爱问的一块。每段代码前后都会说清楚它在解决什么问题，而不是只贴一个能跑的片段。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 用三行代码起一个 Koa 服务，以及脚手架 `koa-generator` 怎么用
- `Context` 到底包了什么，`ctx.request` 和 `ctx.response` 的分工
- 返回类型怎么协商，网页模板怎么用流的方式吐出去
- 原生路由的写法，以及 `koa-route` / `koa-static` / 重定向
- 洋葱模型的执行顺序，为什么 `next()` 前面是「进」后面是「出」
- 异步中间件必须 `async` 的原因，漏了 `await` 会发生什么
- 用最外层中间件做统一错误兜底，配合 `app.on('error')` 收底
- Cookie、表单、文件上传这些 Web App 的常规能力
- 这些 2018 年的写法在今天该换成什么

## 一、三行代码起一个 HTTP 服务

Koa 是 Express 原班团队做的第二代 Web 框架，特点是核心极小。Express 把路由、静态资源、模板全塞进了框架本体，Koa 把这些全砍了，只留下一个中间件引擎和一个上下文对象，剩下的自己按需装。

起服务确实只要三行。

```javascript
const Koa = require('koa');
const app = new Koa();

app.listen(3000);
```

跑起来之后打开浏览器访问 `http://127.0.0.1:3000`，页面上是 `Not Found`。这不是报错，是因为我们一个中间件都没注册，Koa 找不到任何人给这次请求写响应体，就按默认逻辑返回了 404。

这个默认行为其实挺说明问题的：Koa 本身什么都不做，所有能力都来自你注册进去的中间件。

真要开一个新项目，手写目录结构挺费劲，官方有脚手架。

```bash
npm install koa-generator -g
```

装完之后创建项目，`koa2 -e hello-koa2`，其中 `-e` 表示用 `ejs` 模板语法，不写这个参数默认是 `jade`（也就是后来改名的 pug）。

![koa-generator 脚手架创建项目后的目录结构](https://s.poetries.top/gitee/2019/10/346.png)

生成出来的骨架里已经把 `koa-router`、`koa-static`、模板引擎、日志中间件都装好接上了，`npm start` 之后同样访问 `http://127.0.0.1:3000` 就能看到欢迎页。拿它当学习用的沙盒很合适，真做项目的话我一般还是自己从空目录搭，因为脚手架带的依赖版本往往落后好几个大版本。

## 二、Context 对象，一次对话的全部上下文

Koa 给每次请求都造一个 `Context` 对象，习惯上叫 `ctx`。它把这一次 HTTP 请求和这一次 HTTP 响应打包在一起，你改它，用户就能看到变化。

最常用的就是 `ctx.response.body`，它是发送给用户的内容。

```javascript
const Koa = require("koa");
const app = new Koa();

app.use(ctx => { //处理请求的中间件
    ctx.response.body = "hello world";
}).listen(3000);
```

`app.use` 用来注册中间件，传进去的这个函数就是中间件本体。这里它做的事只有一件，给 `ctx.response.body` 赋值。

`ctx.response` 代表 HTTP Response，`ctx.request` 代表 HTTP Request，这两个是 Koa 自己封装的对象，不是 Node 原生的那两个。原生的挂在 `ctx.req` 和 `ctx.res` 上，需要直接操作底层流的时候才用得着。这个命名区别很多人第一次都会搞混，短的是原生，长的是 Koa 封装的。

另外 Koa 在 `ctx` 上做了一堆代理，`ctx.body` 等价于 `ctx.response.body`，`ctx.status` 等价于 `ctx.response.status`，`ctx.path` 等价于 `ctx.request.path`。写业务的时候用短的，读别人代码时知道它们是一回事就行。

### 2.1 返回类型的协商

Koa 默认的返回类型是 `text/plain`。想返回别的，可以先用 `ctx.request.accepts` 看看客户端能接受什么（依据是请求头里的 `Accept` 字段），再用 `ctx.response.type` 指定。

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

这里有个坑要注意：`accepts` 的判断顺序是你写的 `if` 顺序，不是客户端偏好的权重顺序。浏览器发过来的 `Accept` 一般长这样 `text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`，因为末尾有 `*/*`，上面这段代码里第一个分支 `xml` 就会命中，浏览器直接收到一坨 XML。真要按权重挑，得写成 `ctx.accepts('html', 'json', 'xml')`，把候选一次性传进去让 Koa 自己算。

顺带说一句，如果 `body` 赋的是一个普通对象，Koa 会自动把 `type` 设成 `application/json` 并序列化，上面那个 `ctx.response.type = 'json'` 其实可以省。

### 2.2 网页模板用流的方式返回

实际项目里返回给用户的页面通常是模板文件。可以让 Koa 读文件再吐出去。

```javascript
const Koa = require("koa");
const app = new Koa();
const fs = require('fs');

app.use(ctx => {
    ctx.response.type = 'html';
    ctx.response.body = fs.createReadStream('./demos/template.html');
}).listen(3000);
```

注意这里 `body` 赋的是一个可读流，不是字符串。Koa 支持给 `body` 赋字符串、Buffer、Stream、对象和 `null` 这几种类型，赋流的好处是不用把整个文件读进内存，大文件下载场景基本都这么写。

代价是流的错误处理要额外操心。文件不存在时，`createReadStream` 不会立刻抛错，错误是在流开始读的时候异步冒出来的，这时候响应头可能已经发出去了，你没法再改状态码。生产环境更稳的做法是先 `fs.promises.access` 判断一下，或者干脆交给 `koa-static` 这类成熟中间件。

## 三、路由怎么写

网站总不止一个页面。最土的办法是自己判断 `ctx.request.path`。

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

这段能跑，但路由一多就变成一长串 `if...else`，而且没法处理 `/user/:id` 这种带参数的路径，也区分不了 GET 和 POST。

### 3.1 koa-route 模块

把路由这件事交给专门的模块。

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

`route.get(path, fn)` 返回的还是一个普通中间件，路径不匹配时它就调 `next()` 放行，匹配时才执行你的处理函数。理解了这一点你就明白，Koa 里根本没有「路由系统」这个概念，路由只是一种特殊的中间件。

`koa-route` 现在基本没人维护了，实际项目里用的是 `@koa/router`，它支持路由前缀、嵌套路由、`router.param` 这些能力，写法是先 `new Router()` 再 `app.use(router.routes())`。功能多了不少，但底层原理和上面这段是一样的。

### 3.2 静态资源

图片、字体、样式表一个个写路由不现实，`koa-static` 把这部分包了。

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

它做的事是拿请求路径去指定目录下找文件，找到就返回并带上 `Content-Type` 和缓存头，找不到就 `next()` 交给后面的中间件。所以静态资源中间件通常放在整个中间件链的靠前位置，让静态文件请求尽早短路，不用往下走一堆业务逻辑。

生产环境我一般不让 Node 扛静态资源，交给 Nginx 更划算，Node 进程省下来的这部分 CPU 可以多处理点业务请求。

### 3.3 重定向

用户登录之后跳回登录前的页面，这类场景用 `ctx.response.redirect()`，它发的是 302。

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

`redirect` 之后那行 `body` 赋值不是多余的，它是给不支持自动跳转的客户端准备的兜底内容。想改成 301 永久重定向的话，在 `redirect` 之后补一句 `ctx.status = 301` 就行，Koa 允许你覆盖它默认设的状态码。

## 四、中间件与洋葱模型

前面铺垫了这么多，现在到 Koa 最核心的设计。

中间件处在 HTTP Request 和 HTTP Response 中间，用来实现某种中间功能，`app.use()` 用来加载它。Koa 的所有功能都是通过中间件实现的，前面例子里的 `main` 也是中间件。每个中间件默认接受两个参数，第一个是 `Context`，第二个是 `next` 函数，只要调用 `next`，就把执行权转交给下一个中间件。

多个中间件会形成一个栈结构（middle stack），以「先进后出」（first-in-last-out）的顺序执行：

- 最外层的中间件首先执行
- 调用 `next` 函数，把执行权交给下一个中间件
- 最内层的中间件最后执行
- 执行结束后，把执行权交回上一层的中间件
- 最外层的中间件收回执行权之后，执行 `next` 函数后面的代码

写成代码看得更清楚。

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

输出是这样：

```javascript
>> one
>> two
>> three
<< three
<< two
<< one
```

一进一出，像一层层剥洋葱，所以叫洋葱模型。如果中间件内部没有调用 `next` 函数，执行权就不会往下传，后面的中间件全部不执行，这个特性常被用来做权限拦截。

### 4.1 和 Express 的分工，差别到底在哪

Express 也有中间件，也有 `next()`，为什么大家说洋葱模型是 Koa 的特色？

Express 的 `next()` 是纯粹的「调用下一个」，它不返回任何有意义的值。你在 `next()` 后面写的代码会在下游的同步部分跑完后立刻执行，但下游只要有异步操作，你就等不到它。想做「请求前记时间、响应后算耗时」这种事，Express 里得去 hook `res.on('finish')` 事件，绕一圈。

Koa 的 `next()` 返回的是一个 Promise，代表「下游所有中间件全部执行完毕」。所以 `await next()` 之后的代码，是真的在整条链路走完之后才跑的。耗时统计写起来就是这么直白的六行：

```javascript
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});
```

这个设计是真的舒服。回到开头我踩的那个坑，如果这里把 `await` 漏了，`next()` 立刻返回一个 pending 的 Promise，`Date.now() - start` 算出来就是 0，日志里全是 `0ms`，看着像是服务快得离谱。

Express 的路由和中间件写法我在 [nodejs系列之Express](https://feinterview.poetries.top/blog/express) 那篇里单独写过，两篇可以对着看，Express 那边的重点是路由分层和中间件的错误参数约定，这边的重点是洋葱模型和 async 中间件。想再往下挖一层，看 `koa-compose` 是怎么用递归把中间件数组串成一条 Promise 链的，可以看 [重新认识Koa](https://feinterview.poetries.top/blog/relearn-koa) 那篇的源码部分，这里就不重复了。

### 4.2 异步中间件必须写成 async 函数

有异步操作（比如读数据库、读文件）的时候，中间件必须写成 `async` 函数。

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

`fs.readFile` 是异步操作，必须写成 `await fs.readFile()`，外层函数也就必须是 `async`。原因不复杂：Koa 在你的中间件返回之后就认为这一环结束了，可以往回收了。如果你不 `await`，函数早早返回一个 undefined，Koa 就开始往上回溯并把当前的 `ctx.body`（此时还是空的）发出去，等你的文件读完，响应早就发完了。

代码里的 `fs.promised` 是个第三方包，2018 年那会儿 Node 原生还没有 Promise 版的 fs。现在直接用内置的就行：

```javascript
const fs = require('fs/promises');
// 或者 const { readFile } = require('node:fs/promises');
```

原始写法保留在上面是为了让你看老项目代码时不至于懵，但新代码没有理由再装那个包。

### 4.3 中间件的合成

`koa-compose` 模块可以把多个中间件合成一个。

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

`compose` 不是什么额外功能，Koa 内部本来就是用它把 `app.use` 注册的中间件数组串起来的。手动调用它的场景，一般是你要发布一个由好几个中间件组成的功能包，希望使用方一次 `app.use` 就装上，而不是让人家按顺序 use 四五次、还得记住顺序不能错。

## 五、错误处理

代码跑出错要给用户一个交代，HTTP 约定这时返回 500。

### 5.1 ctx.throw 与状态码

Koa 提供了 `ctx.throw()` 方法，`ctx.throw(500)` 就是抛出 500 错误。

```javascript
const Koa = require('koa');
const app = new Koa();

const main = ctx => {
  ctx.throw(500);
};

app.use(main);
app.listen(3000);
```

`ctx.throw` 抛的不是普通 Error，它内部用 `http-errors` 造了一个带 `status` 属性的错误对象，还会按状态码自动填一句标准的错误描述。第二个参数可以自己写消息，`ctx.throw(400, '.name required')` 就是常见的参数校验写法。

这里有个安全相关的细节：4xx 的错误消息会原样返回给客户端，5xx 的消息则会被 Koa 换成通用的 `Internal Server Error`，防止把内部堆栈信息泄露出去。所以你在 500 错误里写的详细描述用户是看不到的，得去日志里找。

如果只是想改状态码而不抛异常，直接设 `ctx.response.status` 就行。

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

设成 404 的效果和 `ctx.throw(404)` 相当，区别是这种写法不会中断当前函数的后续执行。

### 5.2 用最外层中间件统一兜底

为每个中间件都写 `try...catch` 太麻烦。洋葱模型在这里派上了用场，让最外层的中间件负责所有中间件的错误处理。

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

这段代码能成立，全靠 `await next()`。因为 `next()` 返回的 Promise 会把下游任意深度、任意异步位置抛出的错误一路冒泡上来，一个 `try...catch` 就能全接住。Express 里做不到这一点，异步回调里抛的错根本进不了 `try...catch`，得手动 `next(err)` 传出去。

`handler` 必须是第一个 `app.use` 的中间件。注册顺序就是洋葱的层次，它在最外层，才能包住里面所有人。这个顺序写错了，兜底就只对它后面注册的中间件生效。

### 5.3 监听 error 事件收底

运行过程中一旦出错，Koa 会触发一个 `error` 事件，监听它也能处理错误。

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

访问 `http://127.0.0.1:3000`，命令行窗口里会看到 `server error xxx`。

它和 5.2 的 `try...catch` 不是二选一，而是配合用。`try...catch` 负责给用户返回一个体面的响应，`app.on('error')` 负责把错误记到日志、发到监控平台。有一点要留意，如果你在 `handler` 里 catch 住了错误并且没有重新抛出，`error` 事件就不会触发了，想两边都要的话，在 catch 块里手动调一下 `ctx.app.emit('error', err, ctx)`。

## 六、Web App 的常用能力

### 6.1 Cookies

`ctx.cookies` 用来读写 Cookie。

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

访问 `http://127.0.0.1:3000` 会看到 `1 views`，刷新一次变成 `2 views`，每刷新一次计数加一。

`cookies.set` 的第三个参数可以传选项，`httpOnly` 默认是 `true`（JS 读不到，防 XSS 窃取），生产环境记得再加上 `secure: true` 和 `sameSite: 'lax'`。另外 Koa 的签名 Cookie 需要先给 `app.keys` 赋值，不设 keys 直接用 `signed: true` 会直接报错。

### 6.2 表单

表单就是 POST 方法发送到服务器的键值对。`koa-body` 模块可以从 POST 请求的数据体里提取键值对。

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

打开另一个命令行窗口验证一下。

```bash
$ curl -X POST --data "name=Jack" 127.0.0.1:3000
{"name":"Jack"}

$ curl -X POST --data "name" 127.0.0.1:3000
.name required
```

发送合法键值对时会被正确解析，数据不对就收到错误提示。

`koa-body` 的注册顺序同样重要，它必须在读 `ctx.request.body` 的中间件之前 use，因为解析请求体是个异步动作，得先让它把流读完并挂到 `ctx.request.body` 上。Koa 本体不解析请求体，`ctx.request.body` 这个属性完全是这个中间件加上去的，没装它的话你拿到的永远是 `undefined`。

### 6.3 文件上传

`koa-body` 还能处理文件上传，把 `multipart` 打开就行。

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

打开另一个命令行窗口上传一个文件，注意 `/path/to/file` 要换成真实路径。

```bash
$ curl --form upload=@/path/to/file http://127.0.0.1:3000
["/tmp/file"]
```

这段代码有两个地方值得多说一句。

一是文件的落点。`koa-body` 拿到上传的文件后会先写到系统临时目录，`file.path` 指的就是那个临时文件，上面的代码再把它复制到 `os.tmpdir()` 下。真做业务的话这一步应该是移到你的存储目录或者直接传对象存储，临时目录随时可能被系统清理。

二是 `reader.pipe(writer)` 是异步的，代码没有等它完成就把 `filePaths` 返回了。响应发出去的那一刻文件可能还没写完，做后续处理（比如立刻读这个文件算 MD5）就会踩空。要么用 `stream/promises` 里的 `pipeline` 配 `await`，要么直接 `fs.promises.rename`。

还有一点：`koa-body` 后来的版本把文件挪到了 `ctx.request.files`，不再放在 `ctx.request.body.files` 里，你照抄上面这段可能拿到空对象。具体在哪个版本改的、当前版本的字段名叫什么，以官方文档为准，装完先 `console.log(ctx.request)` 打一眼最保险。

## 七、这些写法在今天还成立吗

这篇写于 2018 年，核心概念（Context、洋葱模型、async 中间件、错误兜底）到今天一个字都没变，可以放心用。变的是周边生态和一些默认值，挑几条影响比较大的说一下。

`koa-route` 已经很久没动静了，新项目直接上 `@koa/router`。`koa-body` 也有过 API 调整，最明显的就是上面提到的文件字段位置。`fs.promised` 这个包彻底不需要了，Node 内置的 `fs/promises` 就是它的替代品。

Koa 本身后来发过新的大版本，主要变化在于对 Node 版本的最低要求提高了，以及把一些早就打了废弃标记的 API 真正删掉。具体删了哪些、最低支持到哪个 Node 版本，以官方仓库的 README 和 CHANGELOG 为准，我没有在生产项目上完整验证过新大版本，不敢在这里写死。

生态上更大的变化是选型层面的。做纯 API 服务的话现在有 Fastify、NestJS 这些更完整的方案，Koa 那种「什么都得自己装」的自由度在小项目里是优点，在多人协作的中大型项目里反而容易变成每个人一套写法。不是说 Koa 不行，而是它更适合你明确知道自己要什么的场景，比如写一个网关、一个 BFF 层，或者就是想把中间件机制彻底搞懂。

## 总结

Koa 值得记住的东西不多，但每一条都要吃透。

`ctx` 是一次请求的全部上下文，长写法（`ctx.request` / `ctx.response`）是 Koa 的封装，短写法（`ctx.body` / `ctx.status`）是代理，`ctx.req` / `ctx.res` 才是 Node 原生对象。

洋葱模型的关键不是「先进后出」这四个字，而是 `next()` 返回 Promise 这个设计。正因为它返回 Promise，`await next()` 之后的代码才能拿到下游完整执行完的时刻，耗时统计、统一错误捕获、响应体二次加工这几件事才能用一个中间件搞定。漏写 `await` 是新手最常见的 bug，症状是耗时永远为 0、错误捕获不到、响应提前发出。

错误处理用两层：最外层中间件 `try { await next() } catch` 负责给用户返回体面的响应，`app.on('error')` 负责落日志和上报，catch 之后想让两边都生效就手动 `emit` 一次。

至于路由、静态资源、请求体解析这些，Koa 一概不管，全靠中间件。这既是它轻的原因，也是你选型时要提前想清楚的成本。

## 参考

- [Koa 官方文档](https://koajs.com/)
- [Koa 中文文档](https://koa.bootcss.com/)
- [koa-compose 源码仓库](https://github.com/koajs/compose)
- [@koa/router 仓库](https://github.com/koajs/router)
- [koa-body 仓库](https://github.com/koajs/koa-body)
- [阮一峰 Koa 框架教程](http://www.ruanyifeng.com/blog/2017/08/koa.html)
- [Node.js fs/promises 官方文档](https://nodejs.org/api/fs.html#promises-api)
- [前端进阶之旅](https://interview.poetries.top)
