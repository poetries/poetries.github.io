---
title: 重新认识Koa2，洋葱模型与ctx到底是怎么实现的
description: 从 Koa2 的中间件洋葱模型讲到 koa-compose 的十几行源码，说清 ctx 的属性委托机制、与 Express 中间件模型的本质差异，并覆盖路由、模板引擎、Cookie、Session 等常用配套模块。
date: 2019-03-09 19:30:10
tags: 
   - Node
   - Koa
   - 洋葱模型
categories: Back-end
---

第一次看 Koa 的中间件，我卡在了一个很基础的问题上：为什么 `await next()` 后面的代码，会在所有后续中间件都跑完之后才执行？Express 里 `next()` 后面的代码明明是立刻就跑的。当时我以为这是 Koa 加了什么魔法，后来把 `koa-compose` 的源码翻出来看了一遍，发现它总共就十几行，没有任何魔法，就是一个 Promise 链的递归拼接。

这篇是我重新梳理 Koa2 的笔记。上半部分是原理，把洋葱模型的 compose 实现和 `ctx` 的委托机制讲透；下半部分是配套的路由、模板引擎、Cookie、Session 这些日常要用的模块。原理搞清楚之后，那些模块的行为就都能推出来了。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Koa 为什么会出现，它到底解决了 callback 时代的什么痛点
- 洋葱模型的执行顺序，以及 `koa-compose` 那十几行代码怎么实现的
- `ctx` 上那一堆属性是从哪来的，delegates 委托是怎么回事
- Koa 中间件和 Express 中间件的本质差异，为什么错误处理差那么多
- koa-router 的路由、get 传值、动态路由
- 应用级、路由级、错误处理、第三方四类中间件的写法
- ejs 和 art-template 两个模板引擎的接入
- Cookie、Session 的使用与两者的取舍
- 路由模块化拆分的做法

## 一、Koa 出现是为了解决什么

Node.js 是一个异步的世界，早期官方 API 支持的都是 callback 形式的异步编程模型，这会带来几个很实际的问题。

一个是 callback 嵌套。查数据库拿到用户，再查订单，再查商品，三层下来代码就往右缩进出屏幕了，错误处理还得在每一层各写一遍 `if (err)`。

另一个更隐蔽，异步函数中有可能同步调用 callback 返回数据，带来执行时机的不一致性。同一个函数，有缓存时同步回调，没缓存时异步回调，调用方写出来的代码在两种路径下行为不同，这种 bug 特别难查。

为了解决这些问题，Koa 出现了。

Koa 是由 Express 原班人马打造的，定位是一个更小、更富有表现力、更健壮的 Web 框架。使用 Koa 编写 Web 应用，可以免除重复繁琐的回调函数嵌套，并极大地提升错误处理的效率。Koa 不在内核方法中绑定任何中间件，它仅仅提供了一个轻量优雅的函数库，使得编写 Web 应用变得得心应手。开发思路和 Express 差不多，最大的特点就是可以避免异步嵌套。

我自己的感受是，Koa 的核心库小到可以一个下午读完，这在框架里是很少见的。它把路由、body 解析、静态文件这些全都扔给社区，自己只留下中间件机制和 `ctx` 这两样东西。要吐槽的话就是什么都得自己装，但用久了会觉得这个取舍是对的。

## 二、环境搭建

### 2.1 Node 版本要求

开发 Koa2 之前，Node.js 是有要求的，它要求 Node.js 版本高于 v7.6。因为 Node.js 7.6 版本开始完整支持 `async/await`，Koa2 的中间件写法整个建立在 async 函数之上，版本低了直接跑不起来。

这条限制在 2019 年还是要提一句的，现在基本可以忽略了，主流的 Node 18、Node 20、Node 22 都早已原生支持。另外 Koa 后来也发布了新的大版本，最低 Node 版本要求和一部分细节有调整，具体以官方文档为准。

### 2.2 安装 Koa

安装 Koa 框架和安装其他模块是一样的。

```
npm install --save koa / cnpm install --save koa
```

`--save` 参数表示自动修改 `package.json` 文件，自动添加依赖项。这个参数在 npm 5 之后已经是默认行为了，写不写都会写进依赖，老教程里带着它是历史原因。

装完之后一个最小的 Koa 应用长这样。

![Koa 最简单的启动示例](https://s.poetries.top/gitee/2019/10/494.png)

`new Koa()` 拿到 app 实例，`app.use()` 注册中间件，`app.listen()` 起服务。整个框架对外暴露的核心 API 基本就这三个，剩下的都是围绕 `ctx` 展开的。

## 三、洋葱模型到底是怎么跑起来的

这一节是全文的重点，前面都是铺垫。

### 3.1 先看现象

Koa 的中间件执行顺序被称为洋葱圈模型，先由外向内一层层进去，到最里面之后再由内向外一层层出来。

![Koa 洋葱模型的执行流程动图](https://s.poetries.top/gitee/2019/10/498.gif)

用代码表达就是这样。

```js
app.use(async (ctx, next) => {
  console.log('1 进入')
  await next()
  console.log('1 出来')
})

app.use(async (ctx, next) => {
  console.log('2 进入')
  await next()
  console.log('2 出来')
})

app.use(async (ctx, next) => {
  console.log('3 处理')
  ctx.body = 'hello'
})
```

打印顺序是 `1 进入 → 2 进入 → 3 处理 → 2 出来 → 1 出来`。

![Koa 中间件洋葱圈模型示意](https://s.poetries.top/gitee/2019/10/503.png)

这个顺序的价值在哪？做耗时统计的时候，你在最外层中间件的 `await next()` 前后各打一个时间戳，中间的差值就是后面所有中间件加起来的总耗时，一行不用改业务代码。响应头统一处理、错误统一捕获、日志统一记录，全都靠这个「出来」的阶段。

### 3.2 我一开始的错误理解

我最早以为 Koa 是把中间件收集起来，先正着跑一遍再倒着跑一遍，跑了两轮。

这个理解是错的。中间件函数一共只被调用一次，「进去」和「出来」是同一次函数调用的前半段和后半段，中间被 `await next()` 切开了。`await` 会让当前函数在这一行挂起，把执行权交给下游，等下游返回的 Promise 完成后再从这一行继续往下走。

所以洋葱模型不是框架设计出来的什么特殊调度，它就是 async 函数天然的行为。Koa 做的事情只有一件：把这些函数按正确的方式串起来。

### 3.3 koa-compose 的实现

串起来这件事由 `koa-compose` 完成，核心是这么一段。

```js
function compose (middleware) {
  return function (context, next) {
    let index = -1
    return dispatch(0)

    function dispatch (i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      let fn = middleware[i]
      if (i === middleware.length) fn = next
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)))
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
```

一行行拆开看。

`dispatch(i)` 负责执行第 `i` 个中间件。关键在倒数第三行，传给中间件的第二个参数是 `dispatch.bind(null, i + 1)`，也就是说你在中间件里调用的那个 `next`，其实就是「执行下一个中间件」这个动作本身。你不调它，链条就断在这里，后面的中间件一个都不会执行。

`Promise.resolve(fn(...))` 这一层包装是为了兼容。中间件可以是 async 函数（返回 Promise），也可以是普通函数（返回 undefined 或别的值），包一层之后统一都是 Promise，`await next()` 才能一直成立。

`index` 那两行是防重复调用的守卫。同一个中间件里写两次 `await next()`，第二次进来时 `i <= index` 成立，直接 reject 一个明确的错误。没有这个守卫的话，重复调用会导致下游中间件被执行两遍，响应写两次，问题现场特别混乱。

`try/catch` 包住同步执行阶段，把同步抛出的异常也转成 rejected Promise。这样不管中间件是同步抛错还是异步 reject，对上游来说都是一个 rejected Promise，可以用同一个 `try/catch` 接住。

回到最开始那个问题：为什么 `await next()` 后面的代码会在下游全部跑完之后才执行？因为 `next()` 返回的是 `dispatch(i + 1)` 的返回值，而 `dispatch(i + 1)` 返回的是下游中间件那个 async 函数的 Promise，这个 Promise 要等到下游函数体整个执行完（包括它内部的 `await next()`）才 resolve。一层套一层，最终形成一条完整的 Promise 链。

没有魔法，就是 Promise 的递归组合。

### 3.4 错误处理为什么变简单了

理解了上面这条 Promise 链，就能明白 Koa 的错误处理为什么好用。

只要在最外层放一个中间件，用 `try/catch` 包住 `await next()`，整条链上任何一层抛出的错误都会被它接到。

```js
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.status = err.status || 500
    ctx.body = { message: err.message }
    ctx.app.emit('error', err, ctx)
  }
})
```

这在 callback 时代是做不到的。回调里抛出的异常不在调用方的调用栈上，外层 `try/catch` 根本抓不住，只能每层各写一遍 `if (err) return next(err)`。

## 四、ctx 上那一堆属性是从哪来的

用 Koa 的时候你会写 `ctx.body`、`ctx.query`、`ctx.status`、`ctx.path`，但 Koa 的源码里 `context.js` 这个文件其实没定义这些属性。它们是委托来的。

Koa 把请求和响应分别封装成 `ctx.request` 和 `ctx.response` 两个对象，真正的属性定义在 `request.js` 和 `response.js` 里。然后用 `delegates` 这个小模块，把这两个对象上的属性和方法「代理」到 `ctx` 上。

大致是这个意思。

```js
const delegate = require('delegates')
const proto = module.exports = { /* ... */ }

delegate(proto, 'response')
  .method('redirect')
  .access('status')
  .access('body')
  .getter('headerSent')

delegate(proto, 'request')
  .access('query')
  .access('path')
  .getter('href')
  .getter('ip')
```

`access` 生成一对 getter 和 setter，`getter` 只生成读，`method` 代理方法调用。所以你写 `ctx.body = 'hello'`，实际执行的是 `ctx.response.body = 'hello'`；你读 `ctx.query`，实际读的是 `ctx.request.query`。

这个设计有两个好处。一是用起来短，不用每次都写 `ctx.request.query`。二是职责还是分开的，请求和响应的实现代码各在各的文件里，没有揉成一坨。

这里有个坑我踩过：`ctx.body` 和 `ctx.request.body` 是两个完全不同的东西。前者是你要返回给客户端的响应体，后者是客户端 POST 上来的请求体（而且要装了 `koa-bodyparser` 才有）。名字太像，写错了表现是「接口返回了一个空对象」，得盯着看好一会儿才发现少了 `request` 三个字。

## 五、和 Express 中间件模型的差异

这两个框架的中间件长得有点像，但底子完全不同。

先说签名。Express 的中间件是 `(req, res, next)`，三个参数分开；Koa 是 `(ctx, next)`，请求和响应都挂在 `ctx` 上。这只是表面差异。

真正的差异在 `next` 的语义。

Express 的 `next` 是一个回调，调用它表示「我处理完了，交给下一个」，它没有返回值，也不代表下游的完成。所以 Express 里 `next()` 后面的代码是立刻执行的，那时候下游中间件可能才刚开始跑异步操作。想在响应发出前做点什么，得去 hook `res.end`，或者用 `on-finished` 这类库监听响应结束事件。

Koa 的 `next` 返回一个 Promise，代表「下游全部执行完毕」。`await next()` 之后的代码天然处在响应即将发出的那个时刻，这就是洋葱模型后半段的来源。

第二个差异是错误处理。Express 4 里 async 中间件抛出的错误不会被框架自动捕获，你得自己 `.catch(next)` 或者用 `try/catch` 包起来手动调 `next(err)`，漏掉一个地方就是一个静默失败或者进程崩溃。Koa 因为整条链是 Promise，最外层一个 `try/catch` 就全包了。这是我从 Express 换到 Koa 之后感受最明显的一点。Express 后来的大版本对 async 错误处理有改进，具体以官方文档为准。

第三个差异是响应的写入时机。Express 里你调 `res.send()` 就直接把响应发出去了，发出去就改不了了。Koa 是给 `ctx.body` 赋值，这只是记录下来，真正的写出发生在所有中间件都跑完之后，由框架统一完成。所以在 Koa 里，上游中间件可以在 `await next()` 之后再去修改 `ctx.body`，比如统一包一层 `{ code, data }` 的响应结构。

不是说 Express 的模型不行，它出现得更早，那个年代 Promise 还没普及，回调是唯一的选择。只是既然现在写的是 async/await，Koa 的模型确实更顺。

## 六、Koa 路由

### 6.1 引入 koa-router

路由（Routing）是由一个 URI（或者叫路径）和一个特定的 HTTP 方法（GET、POST 等）组成的，涉及到应用如何响应客户端对某个网站节点的访问。通俗的讲，路由就是根据不同的 URL 地址，加载不同的页面实现不同的功能。

Koa 中的路由和 Express 有所不同。在 Express 中直接引入 Express 就可以配置路由，但是在 Koa 中我们需要安装对应的 `koa-router` 路由模块来实现。

```
npm install --save koa-router
```

![koa-router 基本用法](https://s.poetries.top/gitee/2019/10/495.png)

补一句现状：`koa-router` 这个包后来维护变慢，社区实际用得更多的是 `@koa/router`，API 基本一致。新项目选哪个，看一眼两个包的最近发布时间再定，以官方仓库说明为准。

### 6.2 GET 传值

在 koa2 中 GET 传值通过 `request` 接收，接收的方法有两种，`query` 和 `querystring`。

- `query` 返回的是格式化好的参数对象
- `querystring` 返回的是请求字符串

![query 与 querystring 的返回差异](https://s.poetries.top/gitee/2019/10/496.png)

日常用 `ctx.query` 就够了，拿到的是对象可以直接取字段。`querystring` 的场景比较少，一般是你要把整串参数原样透传给下游服务，或者要参与签名计算，这时候不能被解析和重排。

有个细节要注意，`ctx.query` 的值全是字符串。`?page=1` 拿到的是 `'1'` 不是 `1`，直接拿去做数值比较会出问题，该 `Number()` 就 `Number()`。

### 6.3 动态路由

![Koa 动态路由的写法](https://s.poetries.top/gitee/2019/10/497.png)

动态路由用 `:` 声明占位段，比如 `/user/:id`，取值走 `ctx.params.id`。它和 `ctx.query` 的区别是，params 来自路径本身，query 来自问号后面。

路由的匹配顺序是按注册顺序来的，先注册先匹配。所以 `/user/:id` 如果注册在 `/user/new` 前面，访问 `/user/new` 会命中动态路由，`id` 拿到字符串 `'new'`。把具体路径注册在动态路径前面能避开这个问题。

## 七、四类中间件的写法

### 7.1 什么是中间件

通俗的讲，中间件就是匹配路由之前或者匹配路由完成后做的一系列操作，我们就可以把它叫做中间件。

在 Express 中，中间件（Middleware）是一个函数，它可以访问请求对象（request object (req)）、响应对象（response object (res)），和 web 应用中处理请求响应循环流程中的中间件，一般被命名为 next 的变量。在 Koa 中，中间件和 Express 有点类似，差异前面第五节已经讲过了。

中间件的功能包括：

- 执行任何代码
- 修改请求和响应对象
- 终结请求响应循环
- 调用堆栈中的下一个中间件

如果你的 get、post 回调函数中没有 `next` 参数，那么匹配上第一个路由之后就不会往下匹配了。想往下匹配的话，需要写 `next()`。

### 7.2 应用级中间件

![Koa 应用级中间件示例](https://s.poetries.top/gitee/2019/10/499.png)

应用级中间件通过 `app.use()` 注册，对所有请求生效。日志记录、耗时统计、统一错误处理、CORS 头，这些都放在这一层。

注册顺序就是执行顺序，这一点很关键。错误处理中间件必须放在最前面，因为它要靠 `await next()` 把后面所有中间件的异常都接住。放在后面的话，前面那些中间件的错误它就管不到了。

### 7.3 路由中间件

![Koa 路由中间件示例](https://s.poetries.top/gitee/2019/10/500.png)

路由中间件挂在具体的路由上，只对匹配到的那条路径生效。权限校验最适合放这一层，比如 `/admin` 下面的所有接口挂一个鉴权中间件，其它路径不受影响。

### 7.4 错误处理中间件

![Koa 错误处理中间件示例](https://s.poetries.top/gitee/2019/10/501.png)

除了用 `try/catch` 包住 `await next()` 这种写法，Koa 还提供了 `app.on('error', ...)` 这个兜底。前者能拿到 `ctx`，可以决定返回给客户端什么内容；后者更适合做上报和记日志，它连中间件都跑不起来的那种底层错误也能接到。两个配合着用比较稳。

### 7.5 第三方中间件

![Koa 常用第三方中间件](https://s.poetries.top/gitee/2019/10/502.png)

Koa 内核不带任何中间件，body 解析、静态文件、模板渲染、session 全部靠社区包，下面几节说的就是这些。这个设计的代价是初始配置多，好处是你清楚地知道每一个环节由谁负责，出问题知道去哪查。

## 八、模板引擎

### 8.1 koa-views 加 ejs

安装两个包。

- 安装 koa-views：`npm install --save koa-views`
- 安装 ejs：`npm install ejs --save`

引入 koa-views 配置中间件。

```js
const views = require('koa-views');

app.use(views('views', { map: { html: 'ejs' } }));
```

第一个参数是模板目录，`map` 把 `.html` 后缀映射到 ejs 引擎，这样模板文件可以直接叫 `index.html`，编辑器的语法高亮也认。

在路由里渲染。

```js
router.get('/add', async (ctx) => { 
    let title = 'hello koa2'
    await ctx.render('index', { title })
})
```

原文这里的 `ctx.render(index',{ title })` 少了一个开头的单引号，是个 typo，我改过来了。另外 `ctx.render` 前面的 `await` 不能省，它是异步的，省掉的话中间件会在渲染完成前就返回，客户端拿到空响应。

ejs 常用语法列一下。

引入模板：

```
<%- include header.ejs %>
```

绑定数据（会做 HTML 转义）：

```
<%=h%>
```

绑定 HTML 数据（不转义）：

```
<%-h%>
```

这两个的区别是安全边界。`<%= %>` 会把 `<` `>` 这些字符转义掉，用户输入的内容必须走它，否则就是一个 XSS 漏洞。`<%- %>` 原样输出，只能用在你自己完全可控的内容上。这个我见过实际出事的例子，评论内容用了 `<%- %>` 直接就被注入了。

判断语句：

```html
<% if(true){ %>
    <div>true</div>
<%} else{ %>
    <div>false</div>
<%} %>
```

循环数据：

```html
<%for(var i=0;i<list.length;i++) { %>
    <li><%=list[i] %></li>
<%}%>
```

### 8.2 art-template

适用于 Koa 的模板引擎选择非常多，比如 jade、ejs、nunjucks、art-template 等。

art-template 是一个简约、超快的模板引擎。它采用作用域预声明的技术来优化模板渲染速度，从而获得接近 JavaScript 极限的运行性能，并且同时支持 NodeJS 和浏览器。art-template 支持 ejs 的语法，也可以用自己的类似 angular 数据绑定的语法。中文文档在 http://aui.github.io/art-template/zh-cn/docs

![模板引擎性能对比数据](https://s.poetries.top/gitee/2019/10/504.png)

![模板引擎性能对比数据（续）](https://s.poetries.top/gitee/2019/10/505.png)

这两张对比图要辩证地看。渲染性能在真实业务里很少是瓶颈，一次数据库查询几十毫秒，模板渲染的差异往往在微秒级别，选型时优先看语法顺不顺手、社区活不活跃，性能排在后面。当然如果你的场景是服务端渲染大量列表页，那这个差异就值得关注了。

接入方式。

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

`debug` 那行要留意，开发时打开能看到详细的模板报错，生产环境必须关掉，因为 debug 模式下模板不走缓存，每次请求都重新编译，性能差很多。这里用 `process.env.NODE_ENV` 判断是对的写法。

art-template 的模板语法参考 http://aui.github.io/art-template/zh-cn/docs/syntax.html

## 九、POST 数据与静态资源

### 9.1 原生方式获取 POST 数据

不用任何中间件的话，得自己监听原生请求流。

```js
function parsePostData(ctx) {
    return new Promise((resolve, reject) => {
        try {
            let postdata = "";
            ctx.req.on('data', (data) => {
                postdata += data
            })
            ctx.req.on("end", function () {
                resolve(postdata)
            })
        } catch (error) {
            reject(error)
        }
    })
}
```

原文这段的括号是不配对的，我按原意补齐了。这里的 `ctx.req` 是 Node 原生的请求对象，不是 `ctx.request`（Koa 封装过的那个），别搞混。

这段代码在真实项目里还差不少东西：拿到的是原始字符串，还得根据 `Content-Type` 自己判断是 JSON 还是表单去解析；没有做体积限制，客户端传一个超大 body 上来内存就爆了；中文字符如果正好在两个 chunk 的边界上被切开，字符串拼接会出现乱码，正确做法是先收集 Buffer 最后统一 `toString`。

所以实际开发直接用现成的中间件就好，这段代码的价值是理解底层在发生什么。

### 9.2 koa-bodyparser

```
npm install --save koa-bodyparser
```

```js
var Koa = require('koa');
var bodyParser = require('koa-bodyparser');

var app = new Koa();

app.use(bodyParser());
app.use(async ctx => {
    ctx.body = ctx.request.body;
})
```

用 `ctx.request.body` 取 POST 提交的数据。再强调一次，是 `ctx.request.body`，不是 `ctx.body`。

`bodyParser()` 必须注册在需要读 body 的路由之前，因为它要靠洋葱模型的「进去」阶段把流读完并解析好，后面的中间件才拿得到。注册顺序反了的话，`ctx.request.body` 是 undefined，而且不报错，静默的。

### 9.3 koa-static

```
npm install --save koa-static
```

```js
const static = require('koa-static');

app.use(static(
    path.join(__dirname, 'public')
))
```

静态资源中间件的位置也有讲究。放得太靠后，每个静态文件请求都要先穿过前面所有中间件（包括鉴权、日志、body 解析），白白消耗。一般放在错误处理之后、业务路由之前。

顺带说一句，生产环境的静态资源交给 Nginx 处理比交给 Node 更合适，Node 这边只处理动态请求。这块可以看我另一篇 [Nginx 极简教程](https://feinterview.poetries.top/blog/review-nginx)，里面静态站点和反向代理的配置能直接用。

`static` 这个变量名其实不太好，虽然 `static` 在非严格模式下不是保留字，但它是 ES 的关键字之一，换成 `serve` 或者 `koaStatic` 更稳妥。

## 十、Cookie 与 Session

### 10.1 Koa 中使用 Cookie

设置值：

```js
ctx.cookies.set(name, value, [options])
```

通过 `options` 设置这个 cookie 的行为。

![ctx.cookies.set 的 options 参数说明](https://s.poetries.top/gitee/2019/10/506.png)

`options` 里最该关注的是 `httpOnly` 和 `maxAge`。`httpOnly` 默认为 true，开着的时候 JS 读不到这个 cookie，能挡掉一部分 XSS 窃取会话的攻击。存放会话标识的 cookie 一定要保持 httpOnly。跨站点的场景还要看 `sameSite`，现代浏览器对它的默认值做过收紧，具体行为以浏览器文档为准。

获取值：

```js
ctx.cookies.get('name');
```

### 10.2 设置中文 Cookie

cookie 的值只能是 ASCII，直接塞中文会报错。老办法是转 base64。

```js
console.log(new Buffer('hello, world!').toString('base64'));
// 转换成 base64 字符串: aGVsbG8sIHdvcmxkIQ==

console.log(new Buffer('aGVsbG8sIHdvcmxkIQ==', 'base64').toString());
// 还原 base64 字符串: hello, world!
```

这是 2019 年的写法。`new Buffer()` 现在已经被废弃了，会打安全警告，现在的做法是用 `Buffer.from()`。

```js
console.log(Buffer.from('hello, world!').toString('base64'))
console.log(Buffer.from('aGVsbG8sIHdvcmxkIQ==', 'base64').toString())
```

废弃的原因是 `new Buffer(number)` 会分配一块未初始化的内存，里面可能残留着之前的敏感数据，而 `Buffer.from` 和 `Buffer.alloc` 把这两种语义分开了，不会误用。

另外要说清楚，base64 是编码不是加密，谁都能解回来，只是为了让中文能塞进 cookie 而已，别拿它存密码。

### 10.3 Session

session 是另一种记录客户状态的机制。不同的是 cookie 保存在客户端浏览器中，而 session 保存在服务器上。

工作流程是这样：当浏览器访问服务器并发送第一次请求时，服务器端会创建一个 session 对象，生成一个类似于 key、value 的键值对，然后将 key（放进 cookie）返回到浏览器端，浏览器下次再访问时携带这个 key，服务端就能找到对应的 session（value）。客户的信息都保存在 session 中。

安装 koa-session：

```
npm install koa-session --save
```

引入：

```
const session = require('koa-session');
```

原文这两步的小标题写的是「安装 express-session」「引入 express-session」，包名写串了，Koa 用的是 `koa-session`，这里已经改正。

配置：

```js
app.keys = ['some secret hurr'];
const CONFIG = {
    key: 'koa:sess', // cookie key (default is koa:sess)
    maxAge: 86400000, // cookie 的过期时间 maxAge in ms (default is 1 days)
    overwrite: true, // 是否可以 overwrite (默认 default true)
    httpOnly: true, // cookie 是否只有服务器端可以访问 httpOnly or not (default true)
    signed: true, // 签名默认 true
    rolling: false, // 在每次请求时强行设置cookie，这将重置cookie过期时间(默认:false)
    renew: false, // (boolean) renew session when session is nearly expired
}
app.use(session(CONFIG, app));
```

`app.keys` 是签名用的密钥，配合 `signed: true` 给 cookie 加签名，防止客户端篡改。这个值绝对不能像示例里这样硬编码在代码中提交到仓库，应该走环境变量。数组形式是为了支持密钥轮换，新密钥放第一个用于签名，旧的留在后面还能验签，这样换密钥不会把所有用户踢下线。

`rolling` 和 `renew` 的区别容易混。`rolling` 是每次请求都重设 cookie，用户只要在活动就不会过期；`renew` 是快过期时才续，请求少一些。做后台管理系统我一般开 `rolling`。

使用：

```js
// 设置值 
ctx.session.username = "张三";

// 获取值 
ctx.session.username
```

要注意 `koa-session` 默认是把 session 数据整个加密后存在 cookie 里的，不是存在服务端内存。这和上面那套「服务端存 value」的描述不完全一样，想真正存服务端得配 `store`（Redis 之类）。多实例部署时这一点尤其重要，存内存的话用户请求打到另一个实例上 session 就丢了。

### 10.4 Cookie 和 Session 的取舍

- cookie 数据存放在客户的浏览器上，session 数据放在服务器上
- cookie 不是很安全，别人可以分析存放在本地的 cookie 并进行 cookie 欺骗，考虑到安全应当使用 session
- session 会在一定时间内保存在服务器上，当访问增多会比较占用服务器性能，考虑到减轻服务器性能方面，应当使用 cookie
- 单个 cookie 保存的数据不能超过 4K，很多浏览器都限制一个站点最多保存 20 个 cookie

这几条是当年的通用说法，方向上没问题。补充一点现在的实践：前后端分离之后，越来越多的项目直接用 JWT 这类无状态 token 替代 session，好处是服务端不用存，天然适合多实例；代价是没法立刻让某个 token 失效，得靠短过期时间加刷新机制来弥补。选哪个看你的业务对「立刻踢人下线」这个能力的需求有多强。

## 十一、连接 MongoDB

Koa 操作 MongoDB 走官方的 Node 驱动，文档在 http://mongodb.github.io/node-mongodb-native/

实际项目里更常见的是用 mongoose 这类 ODM，它多提供了 Schema 校验和模型抽象。MongoDB 本身的操作和概念我另外写过一篇 [MongoDB 拾遗](https://feinterview.poetries.top/blog/mongodb-review-1)，环境搭建、常用查询语句那部分可以配合看。

## 十二、应用生成器与路由模块化

### 12.1 koa 应用生成器

通过 Koa 脚手架生成工具可以快速创建一个基于 koa2 的应用骨架。

全局安装：

```
npm install koa-generator -g
```

创建项目、安装依赖、启动：

```
koa koa_demo

cd koa_demo

npm install

npm start
```

生成器给的目录结构是个不错的起点，但它生成的代码风格偏老（比如还在用 `var`），拿来学习结构可以，正式项目建议按自己的规范重新组织。

### 12.2 路由模块化

所有路由堆在 `app.js` 里，文件很快就会失控。拆分的做法是这样。

在目录下面新建一个文件夹 `routes`，在 `routes` 里面配置对应的子页面，比如新建 `routes/index.js`。

![routes 子路由模块的写法](https://s.poetries.top/gitee/2019/10/507.png)

然后在主应用中加载子路由模块。

![主应用中挂载子路由模块](https://s.poetries.top/gitee/2019/10/508.png)

这里的关键是 `router.routes()` 返回的其实就是一个中间件函数，所以子路由可以像普通中间件一样被组合。父路由用 `router.use('/user', userRouter.routes())` 挂载，路径前缀会自动拼上，子路由文件里只写相对路径就行。

回到洋葱模型那条主线，路由中间件说到底和应用级中间件是一样的东西，只是它内部多了一层路径匹配的判断，匹配不上就直接 `await next()` 放行。理解了 compose 之后，这些看起来花哨的组合方式其实都是同一套机制。

## 总结

Koa 值得记住的就两件事，剩下的都是查文档。

第一件是 compose。中间件不是被调用两次，是一次调用被 `await next()` 切成了前后两半，`next` 就是 `dispatch(i+1)` 这个函数本身，整条链是一个递归拼起来的 Promise。想明白这个，洋葱模型的执行顺序、错误为什么能被最外层一把接住、`ctx.body` 为什么可以在 `await next()` 之后再改，全都是推得出来的。

第二件是 `ctx` 的委托。`ctx` 上没有真实的属性定义，它们通过 delegates 代理到 `ctx.request` 和 `ctx.response` 上。这解释了为什么 `ctx.body` 和 `ctx.request.body` 是两个完全不同的东西，也是新手最容易掉的坑。

和 Express 比，差异的根源在 `next` 的语义：Express 的 `next` 是回调，不代表下游完成；Koa 的 `next` 返回 Promise，代表下游全部完成。所有行为差异都是从这一条派生出来的。

配套模块方面，中间件的注册顺序是错误处理放最前、静态资源和 bodyparser 放中间、业务路由放最后，这个顺序错了会出各种静默失败的怪问题，比我想象中常见。

## 参考

- [Koa 官方网站](https://koajs.com/)
- [Koa GitHub 仓库](https://github.com/koajs/koa)
- [koa-compose 源码](https://github.com/koajs/compose)
- [@koa/router 文档](https://github.com/koajs/router)
- [Express 中间件文档](https://expressjs.com/zh-cn/guide/using-middleware.html)
- [art-template 中文文档](http://aui.github.io/art-template/zh-cn/docs/)
- [Node.js Buffer 文档](https://nodejs.org/api/buffer.html)
- [前端进阶之旅](https://interview.poetries.top)
