---
title: Node基础篇回顾 从HTTP模块到Express与MongoDB
description: 一份 Node.js 基础复习笔记，串起 http/url/fs 模块、CommonJS 模块化、npm 包管理、Express 路由与中间件、Cookie Session、MongoDB 增删改查与索引优化。
date: 2019-03-09 17:40:43
tags: 
   - JavaScript
   - Node
   - Express
   - MongoDB
categories: Back-end
---

前端做久了总会碰到这么一天，后端说接口下周才能给，你想自己起个服务把假数据顶上；或者要写个脚本批量重命名两千张切图；再或者面试官冷不丁问一句「你说说 Node 的非阻塞 I/O 到底非阻塞在哪」。这三件事考的其实是同一块知识，就是 Node 的那几个基础模块和它背后的运行模型。

这篇是我当年过 Node 基础时留下的复习笔记，后来又整理了一遍。它不讲花哨的架构，只把 `http`、`url`、`fs`、CommonJS、npm、Express、MongoDB 这几块从头串一遍，代码都能直接跑。读完你至少能自己起一个带路由、带模板、带数据库读写的完整服务，也能把 Cookie 和 Session 的区别讲明白。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Node 是什么，它凭什么能扛住高并发，以及它真正适合的场景
- 用 `http` + `url` 模块手写一个能识别路径的服务器，配 `supervisor` 做热重启
- CommonJS 模块化规范，`exports` 和 `module.exports` 的区别
- npm 与 `package.json`，`dependencies` 和 `devDependencies` 怎么分
- `fs` 模块的文件读写、目录操作、流与管道
- 非阻塞 I/O、事件驱动、回调与 `events` 模块
- Express 的安装、路由、EJS 模板、静态托管与五类中间件
- Cookie、Session 的用法、加密与持久化落库
- MongoDB 从安装到增删改查，再到索引和 `explain` 调优

<!--more-->

## 一、Node.js 是什么

### 1.1 简介

先把最容易被绕晕的一点说清楚。Node 不是一门语言，也不是一个框架，它是一个 JavaScript 的运行环境。你平时写的 `js` 文件双击打不开，拖进浏览器才有效果，那是因为解释执行它的引擎长在浏览器里。Node 干的事情就是把那个引擎单独拎出来，放到操作系统上，再给它配一套操作文件、网络、进程的能力。

- `nodejs`是一个`JavaScript`运行环境。它让 `JavaScript` 可以开发后端程序，实现几乎其他后端语言实现的所有功能
- `Nodejs` 是基于 `V8` 引擎，`V8` 是 `Google` 发布的开源 `JavaScript` 引擎，本身就是用于 `Chrome` 浏览器 的 `JS` 解释部分， `V8` 搬到了服务器上，用于做服务器的软件
- 短短几年的时间，Node 取得了巨大的成功。在企业界，Node 的应用也越来越广泛，2016 年 nodeJS 官方的调查报告。2016 年全球有 350 万开发者使用 nodeJS,相比去年保持了 100%的增长率。像 Yahoo、 Microsoft 这样的大公司，有好多应用已经迁移到 Node 了。国内的阿里巴巴、网易、腾讯、新浪、百度等 公司的很多线上产品也纷纷改用 Node 开发，并取得了很好的效果。据统计很多 A 轮、 B 轮的创业公司更 喜欢使用 NodeJs 开发。

> https://nodejs.org/static/documents/2016-survey-report.pdf

这份 2016 年的调查报告是我写这篇笔记时手头能引到的官方数据，现在看数字已经很旧了，社区规模比那会儿大得多。不过它反映的趋势没变，Node 从一个「前端玩具」变成了公司里正经的服务端选项。

有件事得提一句。V8 本身只负责把 JavaScript 代码跑起来，它不带任何 I/O 能力，读文件、开端口这些活是 Node 通过 libuv 这一层补上的。所以准确说，Node 等于 V8 加 libuv 加一堆内置模块。搞清楚这个分层，后面聊非阻塞 I/O 的时候你就知道那个「异步」是谁提供的了。

### 1.2 NodeJs 的优势

**1. NodeJs 语法完全是 js 语法，只要你懂 JS 基础就可以学会 Nodejs 后端开发**

> Node 打破了过去 JavaScript 只能在浏览器中运行的局面。前后端编程环境统一，可以大大降低开发成本

**2. NodeJs 超强的高并发能力**

- `Node.js` 的首要目标是提供一种简单的、用于创建高性能服务器及可在该服务器中运行的各种应用程 序的开发工具
- 首先让我们来看一下现在的服务器端语言中存在着什么问题。
在 `Java`、`PHP` 或者`.net` 等服务器端语言中，会为每一个客户端连接创建一个新的线程。而每个线程需要耗费大约 `2MB` 内存
理论上，一个 `8GB` 内存的服务器可以同时连接的最大用户数为 `4000` 个左右
。要让 `Web` 应用程序支持更多的用户，就 需要增加服务器的数量，而 `Web` 应用程序的硬件成本当然就上升了
- `Node.js` 不为每个客户连接创建一个新的线程，而仅仅使用一个线程。当有用户连接了，就触发一个 内部事件，通过非阻塞 `I/O`、事件驱动机制，让 `Node.js` 程序宏观上也是并行的。使用 `Node.js`，一个 `8GB` 内存的服务器，可以同时处理超过 `4 万`用户的连接

**3. 实现高性能服务器**

- 严格地说，`Node.js` 是一个用于开发各种 Web 服务器的开发工具。在 `Node.js` 服务器中，运行的是高性能 `V8 JavaScript` 脚本语言，该语言是一种可以运行在服务器端的 `JavaScript` 脚本语言
- 那么，什么是 `V8 JavaScript` 脚本语言呢?该语言是一种被 `V8 JavaScript` 引擎所解析并执行的脚本语言。`V8 JavaScript` 引擎是由 `Google` 公司使用 C++语言开发的一种高性能 `JavaScript` 引擎，该引擎并不局限于在浏览 器中运行。`Node.js` 将其转用在了服务器中，并且为其提供了许多附加的具有各种不同用途的 `API`。例如， 在一个服务器中，经常需要处理各种二进制数据。在 `JavaScript` 脚本语言中，只具有非常有限的对二进制数 据的处理能力，而 `Node.js` 所提供的 `Buffer` 类则提供了丰富的对二进制数据的处理能力
- 另外，在 `V8 JavaScript`引擎内部使用一种全新的编译技术，靠它开发者编写的高端的 `JavaScript` 脚本代码与开发者编写的低端的C语言具有非常相近的执行效率，这也是`Node.js`服务器可以提供的一个重要特性

**4. 开发周期短、开发成本低、学习成本低。**

- `Node.js` 自身哲学，是花最小的硬件成本，追求更高的并发，更高的处理性能。
- 特点:`Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient.`

上面这几段是当年很流行的说法，我得给它加个边界。「一个线程扛 4 万连接」成立的前提是这些连接大部分时间在等 I/O，比如等数据库、等下游接口、等文件读完。这种场景下 Node 的单线程根本没闲着，它在事件循环里来回切。

但反过来，只要你在请求处理里写了一段 CPU 密集的计算，比如同步的大数组排序、图片处理、复杂的加解密，那唯一的那条主线程就被你占死了，后面排队的所有请求全部卡住。

这是 Node 最经典的翻车姿势，而且线上不好复现。

现在的做法是把这类活丢给 `worker_threads` 或者单独的进程池，别在主线程里干。关于线上 Node 服务怎么部署、怎么用多进程把 CPU 核心吃满，我另外写过一篇 [PM2 + Docker 部署 Node 应用](https://feinterview.poetries.top/blog/pm2-docker-node-deploy)，这里就不展开了。

### 1.3 NodeJs 适合做什么

> 在短短几年多的时间里，`Node` 变得非常热门，使用者也非常多。这些使用者对于 `Node` 的各自倚重点也各部相同，经过整理,主要有下几类

**1. 前后端编程语言环境统一**

> 这类重点的代表是雅虎。雅虎开放了 `Cocktail` 框架，利用 自己深厚的前端沉淀，将 `YUI3` 这个前端框架的能力借助 `Node` 延伸到服务器端，使得使用 者摆脱了日常工作中一边写 `JavaScript` 一边写 `PHP` 所带来的上下文交换负担

**2. Node 带来的高性能 I/O 用于实时应用**

> `Voxer` 将 `Node` 应用在实时语音上。国内腾讯的 朋友网将 Node 应用在长连接中，以提供实时功能，花瓣网、蘑菇街等公司通过 `socket.io` 实 现实时通知的功能。

**3. 并行 I/O 使得使用者可以更高效地利用分布式环境**

> 阿里巴巴 eBay 是这方面的典型。 阿里巴巴的 NodeFox 和 eBay 的 ql.io 都是借用 Node 并行 I/O 的能力，更高效地使用已有的 数据

**4. 并行 I/O 有效利用稳定接口提升 Web 渲染能力**

> 雪球财经和 LinkedIn 的移动版网站均 是这种案例，摒弃同步等待式的顺序请求，大胆采用并行 I/O，加速数据的获取进而提升 Web 的渲染速度

**5. 云计算平台提供 Node 支持**

> 微软将 Node 引入 Azure 的开发中，阿里云、百度均纷纷 在云服务器上提供 Node 应用托管服务，Joyent 更是云计算中提供 Node 支持的代表。这类 平台看重 JavaScript 带来的开发上的优势，以及低资源占用、高性能的特点

**6. 游戏开发领域**

> 游戏领域对实时和并发有很高的要求，网易开源了 pomelo 实时框架， 可以应用在游戏和高实时应用中

**7. 工具类应用**

> 过去依赖 `java` 或其他语言构建的前端工具类应用，纷纷被一些前端工程 师用 `Node` 重写，用前端熟悉的语言为前端构建熟悉的工具

顺着上面聊，第七条是绝大多数前端最先用上 Node 的地方。webpack、Vite、ESLint、Prettier，你每天敲的 `npm run dev` 背后跑的都是 Node 进程。所以哪怕你不打算写服务端，把这些基础模块摸清楚，调构建工具的时候也会顺手很多。

## 二、HTTP 模块、URL 模块与 supervisor

> 用 `Node.js` 时，我们不仅仅在实现一个应用，同时还实现了整个 `HTTP` 服务器

这句话是理解 Node 服务端的关键。写 PHP 的时候你要装 Apache，写 Java 的时候你要部署 Tomcat，业务代码是跑在别人的容器里的。Node 不一样，端口监听、请求解析、响应写回，全是你自己代码里的几行。灵活是灵活了，代价是那些 Web 服务器帮你干的脏活，现在得你自己想。

### 2.1 创建一个简单的程序

先跑起来一个最小的 HTTP 服务，感受一下 Node 里「应用即服务器」是什么意思。

```js
var http = require('http');

http.createServer(function(request, response) {
    // 发送 HTTP 头部
    // HTTP 状态值: 200 : OK
    // 设置 HTTP 头部，状态码是 200，文件类型是 html，字符集是 utf8
    response.writeHead(200, { "Content-Type": "text/html;charset=UTF-8" });
    // 发送响应数据
    response.end("哈哈哈哈，我买了一个 iPhone" + (1 + 2 + 3) + "s");
}).listen(8888);
// 终端打印如下信息
console.log('Server running at http://127.0.0.1:8888/');
```

存成 `server.js`，`node server.js` 跑起来，浏览器打开 `http://127.0.0.1:8888/` 就能看到那句话。`(1 + 2 + 3)` 会被真的算成 `6`，说明返回给浏览器的内容是服务端现算出来的，不是一段静态文本。

这里有个坑要注意，`charset=UTF-8` 这段不能省。少了它，中文在部分浏览器里会变成一串问号，这个我踩过，排查了半天才发现是响应头的事，跟代码逻辑一点关系没有。

> 你会发现，我们本地写一个 `js`，打死都不能直接拖入浏览器运行，但是有了 `node`，我 们任何一个 `js` 文件，都可以通过 `node` 来运行。也就是说，`node` 就是一个 `js` 的执行环境

### 2.2 HTTP 模块、URL 模块

> `Node.js` 中，将很多的功能，划分为了一个个 `module`(模块)。 `Node.js` 中的很多功能都 是通过模块实现

Node 把能力切成了一个个模块，`http` 管网络，`fs` 管文件，`path` 管路径拼接，`url` 管地址解析。要用哪个就 `require` 哪个，不用的一行代码都不加载。这套设计让 Node 的启动很轻，也是它区别于那些「一启动就把整个框架装载进内存」的运行时的地方。

现在写新代码，引内置模块推荐加 `node:` 前缀，也就是 `require('node:http')` 或者 `import http from 'node:http'`。这样写的好处是明确告诉运行时「我要的是内置模块，不是 node_modules 里某个同名包」，能避开一类很难查的依赖污染问题。老写法 `require('http')` 依然有效，两种都能跑，具体从哪个版本开始支持以官方文档为准。

#### 2.2.1 HTTP 模块的使用

这段代码把服务器的两个核心对象暴露了出来，`req` 装着浏览器发过来的一切，`res` 是你写回去的通道。

```js
//引用模块
var http = require("http");
//创建一个服务器，回调函数表示接收到请求之后做的事情
var server = http.createServer(function(req, res) { //req 参数表示请求，res 表示响应
    console.log("服务器接收到了请求" + req.url);
    res.end(); // End 方法使 Web 服务器停止处理脚本并返回当前结果
});
//监听端口
server.listen(3000, "127.0.0.1");
```

跑起来之后你在浏览器刷一次页面，终端可能会打两行日志，一行是你访问的路径，另一行是 `/favicon.ico`。浏览器会自动帮你要图标，这不是 bug。很多人第一次写 Node 服务都被这个搞懵过。

`res.end()` 必须调，不调的话响应一直不结束，浏览器就转圈到超时。这是新手第二个高频坑。

**设置一个响应头**

响应头要在写任何响应体之前设置，顺序反了会直接抛错。

```js
res.writeHead(200,{"Content-Type":"text/html;charset=UTF8"});
```

下面这张图是终端里收到请求后打出的日志，可以看到每次访问都会触发一次回调。

![Node 终端打印出接收到的请求 URL](https://s.poetries.top/gitee/2019/10/356.png)


- 我们现在来看一下 `req` 里面能够使用的东西
- 最关键的就是 `req.url` 属性，表示用户的请求 `URL` 地址。所有的路由设计，都是通过 `req.url` 来实现的。
- 我们比较关心的不是拿到 `URL`，而是识别这个 `URL`
- 识别 `URL`，用到了下面的 `URL` 模块

回到我们要解决的问题。拿到 `req.url` 只是一个字符串，比如 `/news?id=2&type=hot`。你要判断用户想访问哪个页面、带了什么参数，就得把这串东西拆开。手写字符串分割能做，但边界情况太多，Node 自带了 `url` 模块专门干这个。

#### 2.2.2 URL 模块的使用

- `url.parse()`  解析`URL `
- `url.format(urlObject)` 是上面 `url.parse()` 操作的逆向操作
- `url.resolve(from, to)` 添加或者替换地址

**1. url.parse()**

`url.parse()` 把一个地址字符串拆成结构化对象，协议、主机、端口、路径、查询串各归各位。第二个参数传 `true` 的时候，`query` 会从字符串进一步解析成对象，这是取 GET 参数最常用的姿势。

![url.parse 解析后的对象结构](https://s.poetries.top/gitee/2019/10/357.png)

下面这张是传了第二个参数之后的效果，注意 `query` 字段的类型变了。

![url.parse 第二个参数为 true 时 query 被解析成对象](https://s.poetries.top/gitee/2019/10/358.png)

这里补一句现状。`url.parse()` 这个 API 现在已经被官方标记为遗留状态，推荐改用 WHATWG 标准的 `new URL()` 构造函数，配合 `searchParams` 取参数，行为跟浏览器里完全一致。

```js
const myUrl = new URL('http://127.0.0.1:3000/news?id=2&type=hot');

console.log(myUrl.pathname);                 // /news
console.log(myUrl.searchParams.get('id'));   // '2'
```

老代码里的 `url.parse()` 目前还能跑，但新写的东西建议直接上 `new URL()`。两者对某些畸形 URL 的容错行为不一样，混用容易出怪问题。

**2. url.format()**

`url.format()` 是 `parse` 的反向操作，把一个对象重新拼回地址字符串。做重定向或者拼接下游请求地址的时候用得上，好处是不用自己拼 `?` 和 `&`，少一类拼错的机会。

![url.format 把对象还原成 URL 字符串](https://s.poetries.top/gitee/2019/10/359.png)


**3. url.resolve()**

`url.resolve(from, to)` 解决的是相对路径拼接。比如当前页是 `/a/b/index.html`，页面里有个 `../c.png`，最终该请求哪个地址，这个函数帮你算。爬虫和静态资源处理里挺常用。

![url.resolve 拼接相对地址的结果](https://s.poetries.top/gitee/2019/10/360.png)

### 2.3 Nodejs 自启动工具 supervisor

写了两个服务你就会烦一件事，改一行代码就得 `Ctrl+C` 再 `node app.js` 重来一遍。前端有热更新，服务端这边也得有。

> `supervisor` 会不停的 `watch` 你应用下面的所有文件，发现有文件被修改，就重新载入程序文件这样就实现了部署，修改了程序文件后马上就能看到变更后的结果。麻麻再也不用担心我的重启 `nodejs` 了

**首先安装 supervisor**

``` 
npm install -g supervisor
```

**使用 supervisor 代替 node 命令启动应用**

装完之后把启动命令里的 `node` 换成 `supervisor` 就行，其余不用动。

![用 supervisor 启动应用后自动监听文件变化](https://s.poetries.top/gitee/2019/10/361.png)

`supervisor` 是当年的选择，现在社区更常用 `nodemon`，用法几乎一样，社区活跃度高不少。再往后走，新版 Node 自带了 `--watch` 参数，直接 `node --watch app.js` 就有热重启，一个依赖都不用装。

具体从哪个版本开始 `--watch` 转正的以官方文档为准，我自己是在项目里试过能用，但没在所有 LTS 版本上一一验证。

要注意这几个都只解决开发期的重启，生产环境的进程守护是另一回事，那是 PM2 或者容器编排的活，别搞混了。

## 三、CommonJS 与 Node 的模块化

### 3.1 什么是 CommonJs

> `JavaScript` 是一个强大面向对象语言，它有很多快速高效的解释器。然而， `JavaScript` 标准定义的 `API` 是为了构建基于浏览器的应用程序，并没有制定一个用于更广泛的应用程序的标准库。`CommonJS` 规范要做的就是填上这块空白，让 `JavaScript` 能撑起真正的应用开发，而不只是停留在小脚本程序的阶段。用 `CommonJS API` 编写出的应用，不仅可以利用 `JavaScript` 开发客户端应用，而且还可以编写以下应 用 

- 服务器端 `JavaScript` 应用程序。(`nodejs`)
- 命令行工具
- 桌面图形界面应用程序

> `CommonJS` 就是模块化的标准，`nodejs` 就是 `CommonJS`(模块化)的实现

这里要分清两件事。CommonJS 是一份规范，是纸面上的约定；Node 是这份规范的一个实现。就像 ES 规范和 V8 的关系一样。这个区分在面试里被问到的频率不低。

### 3.2 Nodejs 中的模块化

> `Node` 应用由模块组成，采用 `CommonJS` 模块规范

#### 3.2.1 在 Node 中，模块分为两类

- 一类是 `Node` 提供的模块,称为核心模块;另一类是用户编写的模块，称为文件模块

> - 核心模块部分在 `Node` 源代码的编译过程中，编译进了二进制执行文件。在 `Node` 进程启动时，部分核心模块就被直接加载进内存中，所以这部分核心模块引入时，文件定位和 编译执行这两个步骤可以省略掉，并且在路径分析中优先判断，所以它的加载速度是最快的。 如:`HTTP` 模块 、`URL` 模块、`Fs` 模块都是 `nodejs` 内置的核心模块，可以直接引入使用
> - 文件模块则是在运行时动态加载，需要完整的路径分析、文件定位、编译执行过程、速度相比核心模块稍微慢一些，但是用的非常多。这些模块需要我们自己定义。接下来我 们看一下 `nodejs` 中的自定义模块。

这两类模块的加载路径规则不一样，这直接决定了你怎么写 `require`。核心模块和 `node_modules` 里的包直接写名字，自己的文件必须写成 `./tools` 或者 `../lib/tools` 这种带相对路径的形式。少写那个 `./`，Node 会跑去 `node_modules` 里找一个叫 `tools` 的包，然后报一个 `Cannot find module` 让你摸不着头脑。

#### 3.2.2 CommonJS(Nodejs)中自定义模块的规定

1. 我们可以把公共的功能抽离成为一个单独的 `js` 文件作为一个模块，默认情况下面这 个模块里面的方法或者属性，外面是没法访问的。如果要让外部可以访问模块里面的方法或 者属性，就必须在模块里面通过 `exports` 或者 `module.exports` 暴露属性或者方法
2. 在需要使用这些模块的文件中，通过 `require` 的方式引入这个模块。这个时候就可以 使用模块里面暴露的属性和方法

默认不暴露这一点很重要。每个文件天然就是一个独立作用域，你在里面写的 `var a = 1` 不会污染到别的文件。浏览器端在 ES Module 普及之前得靠 IIFE 手动造这个隔离，Node 从第一天起就是免费的。

下图是模块导出与引入的关系示意，左边定义，右边通过 `require` 拿到导出的对象。

![CommonJS 模块导出与 require 引入的对应关系](https://s.poetries.top/gitee/2019/10/362.png)

`exports` 和 `module.exports` 的区别，是这一节最值得单独拎出来讲的坑。

真正被 `require` 拿走的永远是 `module.exports`。`exports` 只是 Node 在模块加载时帮你创建的一个快捷引用，初始时它指向同一个对象。所以往 `exports` 上挂属性有效，但你要是直接给 `exports` 整个赋值，引用就断了，外面什么都拿不到。

```js
// 有效，往同一个对象上加属性
exports.add = function (x, y) { return x + y; };

// 无效，只是把局部变量 exports 指向了新对象
exports = { add: function (x, y) { return x + y; } };

// 想整体导出，必须写 module.exports
module.exports = { add: function (x, y) { return x + y; } };
```

我一开始也是这么想的，觉得两个名字既然指向同一个东西那随便用哪个都行，结果导出一个类的时候直接翻车。记住一句话就够，加属性两个都行，整体替换只能用 `module.exports`。

#### 3.2.3 定义使用模块

下面是一个完整的例子，把工具函数抽成 `tools.js`，再在入口文件里引进来用。

```js
// 定义一个 tools.js 的模块 //模块定义
var tools = {
    sayHello: function() {
        return 'hello NodeJS';
    },
    add: function(x, y) {
        return x + y;
    }
};
// 模块接口的暴露
// module.exports = tools;
exports.sayHello = tools.sayHello;
exports.add = tools.add;

```

引入的时候路径不写 `.js` 后缀也可以，Node 会自动补。

```js
var http = require('http');
// 引入自定义的 tools.js 模块
var tools = require('./tools');

tools.sayHello(); //使用模块
```

上面这套是 CommonJS 的写法，`require` 加 `module.exports`，Node 里跑了很多年。现在 ES Module 在 Node 里已经是一等公民了，`import` / `export` 可以直接用，开启方式是在 `package.json` 里写 `"type": "module"`，或者把文件后缀改成 `.mjs`。

```js
// tools.mjs
export function sayHello() {
  return 'hello NodeJS';
}

// app.mjs
import { sayHello } from './tools.mjs';
sayHello();
```

两者最大的差别在加载时机上。`require` 是运行时同步加载，你可以写在 `if` 里做条件引入；`import` 是静态的，必须写在顶层，好处是打包工具能做 tree shaking。另外 ESM 里没有 `__dirname` 和 `__filename`，得用 `import.meta.url` 换算，这个在迁移老项目时会卡一下。

原文这些 CommonJS 代码现在依然能跑，不用急着改。真要迁移的时候再说，混用两套模块系统比单纯用老的更容易出事。

## 四、NPM 第三方模块与 package.json

### 4.1 包与 NPM

#### 4.1.1 包

模块解决的是「一个文件怎么复用」，包解决的是「一堆文件怎么打包分发」。这是两个层次的事。

> `Nodejs` 中除了它自己提供的核心模块外，我们可以自定义模块，也可以使用 第三方的模块。`Nodejs` 中第三方模块由包组成，可以通过包来对一组具有相互依 赖关系的模块进行统一管理

下图是一个标准包的目录结构，可以对照着看看你 `node_modules` 里随便一个包，大体都长这样。

![符合 CommonJS 规范的包目录结构](https://s.poetries.top/gitee/2019/10/363.png)

**完全符合 CommonJs 规范的包目录一般包含如下这些文件**

- `package.json` :包描述文件
- `bin` :用于存放可执行二进制文件的目录
- `lib` :用于存放 `JavaScript` 代码的目录
- `doc` :用于存放文档的目录

这里面 `package.json` 是唯一必须有的，其它几个目录都是惯例而非强制。你现在去翻现代的包，会发现 `lib` 经常被换成 `dist` 或者 `src`，多了 `types` 目录放 TypeScript 类型声明，还多了 `exports` 字段控制哪些路径能被外部引用。

> 在 `NodeJs` 中通过 `NPM` 命令来下载第三方的模块(包)


#### 4.1.2 NPM 介绍

- npm 是世界上最大的开放源代码的生态系统。我们可以通过 npm 下载各种各样的包，
这些源代码(包)我们可以在 https://www.npmjs.com 找到

> `npm` 是随同 `NodeJS` 一起安装的包管理工具，能解决 `NodeJS` 代码部署上的很多问题，常见的使用场景有 以下几种

- 允许用户从 `NPM` 服务器下载别人编写的第三方包到本地使用
- 允许用户从 `NPM` 服务器下载并安装别人编写的命令行程序(工具)到本地使用
- 允许用户将自己编写的包或命令行程序上传到 `NPM` 服务器供别人使用

**NPM 命令详解**

- `npm -v` 查看 `npm` 版本
- `npm install` 使用 `npm` 命令安装模块
- `npm uninstall moduleName` 卸载模块
- `npm list` 查看当前目录下已安装的 `node` 包
- `npm info jquery` 查看 `jquery` 的版本
- 指定版本安装 `npm install jquery@1.8.0`

再补几个当年没写、现在天天用的。`npm ci` 严格按 `package-lock.json` 装，CI 里应该用这个而不是 `npm install`，因为它不会偷偷改动锁文件。`npx some-cli` 可以不全局安装直接跑一个包里的命令行工具。`npm outdated` 列出哪些依赖有新版本可升。

### 4.2 package.json

> `package.json` 定义了这个项目所需要的各种模块,以及项目的配置信息(比如名称、
版本、许可证等元数据)

**1. 创建 package.json**

`npm init` 会一路问你项目名、版本、入口文件，加上 `-y` 就全用默认值直接生成。

```
npm init
npm init --yes
```

**2. 安装模块并把模块写入 package.json(依赖)**

- `npm install babel-cli --save-dev`
- `npm install 模块 --save`

补一句现状，从 npm 5 开始 `--save` 已经是默认行为了，直接 `npm install express` 就会写进 `dependencies`，那个参数可以省。但 `--save-dev`（简写 `-D`）还是得手动加，不然会装错位置。

**3. dependencies 与 devDependencies 之间的区别**

- 使用 `npm install node_module --save` 自动更新 `dependencies` 字段值;
- 使用 `npm install node_module --save-dev` 自动更新 `devDependencies` 字段值
- `dependencies` 配置当前程序所依赖的其他包，运行时也需要
- `devDependencies` 配置当前程序开发阶段所依赖的其他包，只在本地开发和构建时用得上

这个区分不是形式主义。跑 `npm install --production` 或者在 Docker 里构建生产镜像的时候，`devDependencies` 是不会被安装的。你要是把 `express` 误放进 `devDependencies`，本地跑得好好的，一上服务器就 `Cannot find module 'express'`。

判断标准很简单，问自己一句「线上那个进程跑起来之后还需不需要它」。需要就是 `dependencies`，只在打包、测试、lint 阶段用就是 `devDependencies`。

```
"dependencies": {
    "ejs": "^2.3.4",
    "express": "^4.13.3",
    "formidable": "^1.0.17"

}
```

版本号前面那个符号决定了 `npm install` 时到底会装到哪个版本，这是很多「同一份代码换台机器就跑不起来」的根源。

- `^`表示第一位版本号不变，后面两位取最新的 
- `~`表示前两位不变，最后一个取最新 
- `*`表示全部取最新

`^2.3.4` 会匹配到 `2.x.x` 里的最新版，`~2.3.4` 只会匹配到 `2.3.x` 的最新版。生产项目老老实实提交 `package-lock.json`，让锁文件来钉死实际装的版本，光靠这几个符号是锁不住的。

至于 `*`，我的建议是永远别用。上游一发大版本你的项目就炸，而且炸在什么时候完全不受控。

### 4.3 安装淘宝镜像

- http://www.npmjs.org npm 包官网
- https://npm.taobao.org/ 淘宝 npm 镜像官网


> 淘宝 `NPM` 镜像是一个完整 `npmjs.org` 镜像，你可以用此代替官方版本(只读)，同步频 率目前为 10 分钟 一次以保证尽量与官方服务同步

我们可以使用我们定制的 `cnpm` (`gzip` 压缩支持) 命令行工具代替默认的 `npm`:


```
npm install -g cnpm --registry=https://registry.npm.taobao.org
```

这块要更新一下。淘宝镜像的域名后来从 `registry.npm.taobao.org` 迁到了 `registry.npmmirror.com`，老域名的证书早就过期了，还照着上面这条命令敲大概率会报 `CERT_HAS_EXPIRED`。

另外我现在更倾向于直接改 registry 而不是装 `cnpm`。多一个命令行工具就多一套依赖解析逻辑，`cnpm` 生成的 `node_modules` 结构和 `npm` 不完全一样，混着用容易出玄学问题。

```
npm config set registry https://registry.npmmirror.com
```

想临时用一次就加参数，`npm install --registry=https://registry.npmmirror.com`，不改全局配置。

## 五、fs 模块与文件操作

`fs` 是前端最容易用上的一个 Node 模块。写构建脚本、批量改文件名、生成路由表、读配置，全靠它。这一节把常用 API 过一遍。

先说一个贯穿全节的规律。`fs` 里几乎每个方法都有三种形态，回调版 `fs.readFile`、同步版 `fs.readFileSync`、Promise 版 `fs.promises.readFile`。下面原文用的都是回调版，这是 2019 年的主流写法。

现在写脚本我基本只用 Promise 版，`const fs = require('node:fs/promises')`，然后配 `async/await`，不用再套回调。同步版只在启动阶段读配置这种一次性场景用，别放在请求处理里，它会把整条主线程堵死。

### 5.1 fs.stat 检测是文件还是目录

遍历目录的时候你拿到的只是一串名字，得靠 `fs.stat` 判断每一项到底是文件还是文件夹。

```js
const fs = require('fs')

fs.stat('hello.js', (error, stats) => {
    if (error) {
        console.log(error)
    } else {
        console.log(stats)

        console.log(`文件: ${stats.isFile()}`)

        console.log(`目录: ${stats.isDirectory()}`)
    }
})
```

`stats` 里除了这两个判断，还有 `size`（字节数）、`mtime`（最后修改时间）这些字段。做增量构建的时候，比对 `mtime` 就能知道哪些文件需要重新处理，我自己写文档构建脚本就是这么干的。

### 5.2 fs.mkdir 创建目录

```js
const fs = require('fs') 

fs.mkdir('logs', (error) => {
    if (error) {
        console.log(error)
    } else {
        console.log('成功创建目录:logs')
    }
})
```

这个 API 有个默认行为要留意，父目录不存在的话它会直接报 `ENOENT`，不会帮你一层层建。想一次建出 `a/b/c` 这种多级路径，得传 `{ recursive: true }`，加上这个参数目录已存在也不会报错，写脚本时省掉一堆判断。

### 5.3 fs.writeFile 创建写入文件

`writeFile` 是覆盖写，文件不存在就新建，存在就把原内容整个冲掉。

```js
fs.writeFile('logs/hello.log', '您好 ~ \n', (error) => {
    if (error) {
        console.log(error)
    } else {
        console.log('成功写入文件')
    }
})
```

### 5.4 fs.appendFile 追加文件

想在原内容后面接着写就用 `appendFile`，写日志基本都用这个。它和 `writeFile` 的差别只在于打开文件时的 flag，一个是 `w` 一个是 `a`。

```js
fs.appendFile('logs/hello.log', 'hello ~ \n', (error) => {
    if (error) {
        console.log(error)
    } else {
        console.log('成功写入文件')
    }
})
```

### 5.5 fs.readFile 读取文件

```js
const fs = require('fs') 

fs.readFile('logs/hello.log', 'utf8', (error, data) => {
    if (error) {
        console.log(error)
    } else {
        console.log(data)
    }
})
```

第二个参数 `'utf8'` 千万别忘。不传编码的话 `data` 拿到的是 `Buffer` 对象，`console.log` 出来是一串十六进制，很多人第一次读文件都在这里愣住过。传了编码它才会帮你解码成字符串。

反过来说，读图片、读压缩包这类二进制文件时就不能传编码，你要的正是那个原始 `Buffer`。

### 5.6 fs.readdir 读取目录

`readdir` 拿到的是一个字符串数组，只有名字，不带路径，也不告诉你哪个是文件夹。要完整信息就得配合上面的 `fs.stat` 逐个判断，或者传 `{ withFileTypes: true }` 直接拿到带类型的对象数组。

```js
const fs = require('fs') 

fs.readdir('logs', (error, files) => {
    if (error) {
        console.log(error)
    } else {
        console.log(files)
    }
})
```

### 5.7 fs.rename 重命名

`rename` 既能改名也能移动文件，因为在文件系统看来这是同一件事，改的都是路径。批量整理设计稿切图的时候我常用它配合 `readdir` 写个十几行的脚本，比手动拖快太多。

```js
const fs = require('fs') 

fs.rename('js/hello.log', 'js/greeting.log', (error) => {
    if (error) {
        console.log(error)
    } else {
        console.log('重命名成功')
    }
})
```

跨磁盘分区移动会失败，这个在 Windows 上比较容易碰到，真要跨盘就得读出来再写过去。

### 5.8 fs.rmdir 删除目录

```js
fs.rmdir('logs', (error) => {
    if (error) {
        console.log(error)
    } else {
        console.log('成功的删除了目录:logs')
    }
})
```

`rmdir` 只能删空目录，里面有东西就报 `ENOTEMPTY`。想连内容一起删，现在推荐用 `fs.rm` 加 `{ recursive: true, force: true }`，`fs.rmdir` 的 `recursive` 选项已经被废弃了。

这个操作没有回收站，路径写错就是真没了。我的习惯是先 `console.log` 出要删的路径列表确认一遍，再把删除那行的注释放开。

### 5.9 fs.unlink 删除文件

删单个文件用 `unlink`，名字有点反直觉，它来自 Unix 系统调用的命名。

```js
fs.unlink(`logs/${file}`, (error) => {
    if (error) {
        console.log(error)
    } else {
        console.log(`成功的删除了文件: ${file}`)
    }
})
```

拼路径这里其实该用 `path.join('logs', file)`，手动拼 `/` 在 Windows 上会有分隔符问题，跨平台脚本一定要走 `path` 模块。

### 5.10 fs.createReadStream 从文件流中读取数据

前面那些 API 有个共同的问题，`readFile` 会把整个文件一次性读进内存。文件几 KB 无所谓，要是一个 2GB 的日志，进程内存直接爆掉。

流的思路是把文件切成一小块一小块（chunk）依次处理，内存里任何时刻只留一小段。

```js
const fs = require('fs') 

var fileReadStream = fs.createReadStream('data.json') 
let count = 0;
var str = '';

fileReadStream.on('data', (chunk) => {
    console.log(`${++count}接收到: ${chunk.length}`);
    str += chunk
}) 

fileReadStream.on('end', () => {
    console.log('--- 结束 ---');
    console.log(count);
    console.log(str);
}) 

fileReadStream.on('error', (error) => {
    console.log(error)
})
```

`data` 事件每来一块触发一次，`end` 是全部读完，`error` 千万要监听。流上没挂 `error` 处理器时抛出的错误会变成未捕获异常，直接把整个 Node 进程干掉。

不过这个例子里 `str += chunk` 又把所有内容拼回了一个大字符串，等于白流了。真正的流式处理应该是每拿到一块就处理掉一块，比如逐行统计、边读边转码。这个我踩过，当时还纳闷为什么用了流内存照样涨。

### 5.11 fs.createWriteStream 写入文件

有可读流自然有可写流，大量数据分批写出的时候用它。

```js
var fs = require("fs");
var data = '我是从数据库获取的数据，我要保存起来';
// 创建一个可以写入的流，写入到文件 output.txt 中
var writerStream = fs.createWriteStream('output.txt'); // 使用 utf8 编码写入数据

writerStream.write(data, 'UTF8'); // 标记文件末尾
writerStream.end();
// 处理流事件 --> finish 事件
writerStream.on('finish',
function() {
    /*finish - 所有数据已被写入到底层系统时触发。*/
    console.log("写入完 成。");
});
writerStream.on('error',
function(err) {
    console.log(err.stack);
});
console.log("程序执行完毕");
```

注意最后那行 `console.log` 会先于 `finish` 事件打印出来。写入是异步的，代码往下执行不等它完成，这一点很能体现 Node 的非阻塞特性，第七节会专门聊。

### 5.12 管道流

有了可读流和可写流，最顺手的用法就是把它们接起来。

> 管道提供了一个输出流到输入流的机制。通常我们用于从一个流中获取数据并将数据传递到另外一个流中。

下面这张图是管道的直观示意，左边的桶通过管子把水灌到右边的桶里。

![可读流通过 pipe 管道连接到可写流的示意图](https://s.poetries.top/gitee/2019/10/364.png)

> 如上面的图片所示，我们把文件比作装水的桶，而水就是文件里的内容 ，我们用一根管子(pipe )连接两个桶使得水从一个桶流入另一个桶，这样就慢慢的实现了大文件的复制过程。

以下实例我们通过读取一个文件内容并将内容写入到另外一个文件中

```js
var fs = require("fs");
// 创建一个可读流
var readerStream = fs.createReadStream('input.txt'); // 创建一个可写流
var writerStream = fs.createWriteStream('output.txt');

// 管道读写操作
// 读取 input.txt 文件内容，并将内容写入到 output.txt 文件中 
readerStream.pipe(writerStream);
console.log("程序执行完毕");
```

`pipe` 除了省代码，还悄悄帮你做了一件重要的事，背压控制。如果读得快写得慢，比如从本地硬盘读、往网络上传，`pipe` 会自动让可读流暂停，等下游消化完再继续。手写 `on('data')` 加 `write()` 是没有这个机制的，数据会在内存里越堆越多。

`pipe` 的短板是错误处理，管道中任何一环出错都不会自动清理其它流，容易造成文件句柄泄漏。现在更推荐 `stream.pipeline`，它会统一处理错误和清理。

```js
const { pipeline } = require('node:stream/promises');
const fs = require('node:fs');

await pipeline(
  fs.createReadStream('input.txt'),
  fs.createWriteStream('output.txt')
);
```

流用不好确实容易漏内存，这类问题的排查思路我在 [JS 内存泄漏排查](https://feinterview.poetries.top/blog/js-memory-leak) 那篇里写过，Node 侧的思路和浏览器是通的。

## 六、动手创建一个 Web 服务器

> 利用HTTP模块 URl模块 PATH模块 FS 模块创建一个 WEB 服务器

前面五节的东西到这里可以拼起来了。`http` 负责收请求发响应，`url` 负责解析路径拿参数，`path` 负责拼文件路径，`fs` 负责把磁盘上的 HTML、CSS、图片读出来。四个模块凑一起，就是一个能用的静态服务器。

**1. Node.js 创建的第一个应用**

> 引入 http 模块

```js
var http = require("http");
```

**2. 创建服务器**

> 接下来我们使用 `http.createServer()` 方法创建服务器，并使用 `listen` 方法绑定 `8888` 端口。 函数通过 `request`, `response` 参数来接收和响应数据

```js
//1.引入 http 模块
var http=require('http');

//2.用 http 模块创建服务
http.createServer(function(req, res) {
    // 发送 HTTP 头部
    // HTTP 状态值: 200 : OK
    //设置 HTTP 头部，状态码是 200，文件类型是 html，字符集是 utf-8
    res.writeHead(200, {
        "Content-Type": "text/html;charset='utf-8'"
    });
    res.write('你好 nodejs');
    res.write('我是第一个 nodejs 程序');
    res.end();
    /*结束响应*/
}).listen(8001);
```

`res.write` 可以调多次，内容会一段段拼起来，最后 `res.end()` 收尾。这个特性配合流式渲染很有用，服务端可以先把 `<head>` 吐给浏览器让它去加载 CSS，数据查完了再吐 `<body>`，首屏能快不少。React 的 SSR 流式渲染底层就是这个思路。

**3. WEB 服务器介绍**

> Web 服务器一般指网站服务器，是指驻留于因特网上某种类型计算机的程序，可以向浏览 器等 Web 客户端提供文档，也可以放置网站文件，让全世界浏览;可以放置数据文件，让 全世界下载。目前最主流的三个 Web 服务器是 Apache Nginx IIS。

实际项目里很少让 Node 直接对外裸奔。常规做法是前面挡一层 Nginx，由它处理 HTTPS 证书、静态资源、gzip 压缩和负载均衡，Node 只管动态逻辑。各干各擅长的，Node 在静态文件吞吐上确实打不过 Nginx。

## 七、非阻塞 I/O、异步与事件驱动

这一节是 Node 的地基。前面用到的所有回调，背后都是同一套机制在支撑。

### 7.1 Nodejs的单线程 非阻塞I/O事件驱动

- 在 Java、PHP 或者.net 等服务器端语言中，会为每一个客户端连接创建一个新的线程。 而每个线程需要耗费大约 2MB 内存。也就是说，理论上，一个 8GB 内存的服务器可以同时 连接的最大用户数为 4000 个左右。要让 Web 应用程序支持更多的用户，就需要增加服务器 的数量，而 Web 应用程序的硬件成本当然就上升了
- Node.js 不为每个客户连接创建一个新的线程，而仅仅使用一个线程。当有用户连接了， 就触发一个内部事件，通过非阻塞 I/O、事件驱动机制，让 Node.js 程序宏观上也是并行的。 使用 Node.js，一个 8GB 内存的服务器，可以同时处理超过 4 万用户的连接。

那为什么一条线程反而能扛更多连接呢？

关键在于「等待」这件事怎么处理。传统模型里，一个线程发起数据库查询之后就原地阻塞，什么也干不了，纯粹在浪费那 2MB 内存和调度开销。Node 的做法是发起 I/O 之后立刻把控制权交回去，接着处理下一个请求，等操作系统通知「数据好了」，再回头执行那个回调。

所以「单线程」这个说法其实不够准确。跑你 JavaScript 代码的确实只有一条主线程，但底下 libuv 维护着一个线程池，文件读写、DNS 解析这些活是丢给线程池干的，网络 I/O 则直接用操作系统的 epoll、kqueue 这类事件通知机制。你写的是单线程代码，享受的是多线程的并行 I/O。

回到实际影响。这套模型省掉了线程创建销毁和上下文切换的开销，但代价前面提过，主线程一旦被 CPU 密集任务占住，所有请求一起完蛋。

### 7.2 Nodejs 回调处理异步

理解了上面的模型，下面这段「错误写法」为什么错就很清楚了。

```js
//错误的写法:
function getData(){ 
    //模拟请求数据 
    var result='';
    setTimeout(function(){ 
        result='这是请求到的数据'
    },200);
    
    return result; 
}
console.log(getData());/*异步导致请求不到数据*/
```

`return result` 这行在 `setTimeout` 的回调还没排上队之前就执行完了，拿到的是那个空字符串。异步操作的结果不可能通过同步 `return` 拿到，这是硬约束。

正确的做法是把「拿到结果之后要干什么」也交出去，让异步操作完成时自己来调用。

```js
//正确的处理异步:
function getData(callback) { //模拟请求数据
    var result = '';
    setTimeout(function() {
        result = '这是请求到的数据';
        callback(result);
    },
    200);
}
getData(function(data) {
    console.log(data);
})
```

回调能解决问题，但嵌套三四层之后代码就成了往右倒的金字塔，错误处理还得每层都写一遍，这就是当年被吐槽烂了的回调地狱。

现在 Promise 和 `async/await` 已经完全接管了这块。同样的逻辑写出来是这样：

```js
function getData() {
  return new Promise((resolve) => {
    setTimeout(() => resolve('这是请求到的数据'), 200);
  });
}

async function main() {
  const data = await getData();
  console.log(data);
}
```

Node 还提供了 `util.promisify`，能把老式的回调风格函数直接转成返回 Promise 的版本，改造遗留代码时很省事。另外像 `AbortController` 这种取消机制现在也能配合 `fetch`、`fs` 使用，超时和取消不用再自己造轮子了。

顺带一提，Node 现在内置了全局 `fetch`，服务端发 HTTP 请求不必再装 `request` 或 `axios`。具体从哪个版本开始默认可用以官方文档为准。

### 7.3 Nodejs events 模块处理异步

回调适合「一次性拿结果」，但有些场景是「同一件事会反复发生」，比如前面流的 `data` 事件。这时候用事件模型更合适。

> `Node.js` 有多个内置的事件，我们可以通过引入 `events` 模块，并通过实例化 `EventEmitter` 类来绑定和监听事件。


```js
// 引入 events 模块
var events = require('events');
var eventEmitter = new events.EventEmitter(); /*实例化事件对象*/

eventEmitter.on('toparent', function() {
    console.log('接收到了广播事件');
})

setTimeout(function() {
    console.log('广播');
    eventEmitter.emit('toparent'); /*发送广播*/ 
}, 1000)
```

`on` 注册监听，`emit` 触发，这套发布订阅的模式在 Node 里到处都是。`http.Server`、各种 `Stream`、`process` 本身都继承自 `EventEmitter`，你前面写的 `server.on`、`readStream.on('data')` 全是它。

这里有个坑要注意，同一个事件挂超过 10 个监听器时 Node 会打一条内存泄漏警告。多数情况下这条警告是对的，是你在循环里重复 `on` 却没 `off`。真需要挂很多就调 `setMaxListeners`，但先确认不是自己写漏了。

## 八、静态文件托管、路由、GET POST 与 EJS 模板

原生模块能干活，但要自己拼路由、自己拼 HTML，写两天就想找个框架。这一节先把原生的做法过一遍，知道框架帮你省了哪些事，第十四节再上 Express。

### 8.1 路由

> 路由指的就是针对不同请求的 URL，处理不同的业务逻辑。

说穿了就是一堆 `if/else` 判断 `req.url`，然后走不同分支。下图是路由分发的基本形态。

![根据请求 URL 分发到不同处理逻辑的路由示意](https://s.poetries.top/gitee/2019/10/365.png)

原生写法的麻烦在于，路径一多这堆判断就没法维护了，动态路径比如 `/user/123` 还得自己写正则去匹配和提取。框架的路由系统解决的正是这个问题。

### 8.2 初识 EJS 模块引擎

在服务端拼 HTML 字符串是件很痛苦的事，引号套引号，数据一多就乱。模板引擎干的活是把 HTML 结构和数据分开，你写一份带占位符的模板，运行时把数据填进去。

> 我们学的 EJS 是后台模板，可以把我们数据库和文件读取的数据显示到 Html 页面上面。它 是一个第三方模块，需要通过 npm 安装

```
npm install ejs --save
```

> Nodejs 中使用:

```js
ejs.renderFile(filename, data, options, function(err, str){
// str => Rendered HTML string
});
```

**EJS 常用标签**

- `<%%>`流程控制标签
- `<%=%>`输出标签(原文输出HTML标签)
- `<%-%>`输出标签(HTML会被浏览器解析)

这两个输出标签的区别关系到安全，得掰扯清楚。`<%= %>` 会把内容里的 `<`、`>`、`&` 转义成实体，浏览器把它当纯文本显示；`<%- %>` 原样吐出，浏览器会当成 HTML 解析。

所以凡是用户能输入的内容一律用 `<%= %>`。用 `<%- %>` 渲染用户输入等于给自己开了个 XSS 后门，别人在评论里塞一段 `<script>` 就能在所有访客浏览器里执行。只有你完全确定来源可信的富文本片段才用 `<%- %>`。

下面这个例子把变量填进属性里，注意属性值也要用转义输出。

```html
<a href="<%= url %>"><img src="<%= imageURL %>" alt=""></a><ul>
```

```html
<html>
 <head></head>
 <body>
  <ul>
    &lt;% for(var i = 0 ; i &lt; news.length ; i++){ %&gt; 
   <li>&lt;%= news[i] %&gt;</li> &lt;% } %&gt; 
  </ul>
 </body>
</html>
```

### 8.3 Get、Post

- 超文本传输协议(HTTP)的设计目的是保证客户端机器与服务器之间的通信
- 在客户端和服务器之间进行请求-响应时，两种最常被用到的方法是:GET 和 POST
  - GET - 从指定的资源请求数据。(一般用于获取数据)
  - POST - 向指定的资源提交要被处理的数据。(一般用于提交数据)

两者在服务端的取值方式完全不同，原因在于数据放的位置不一样。GET 的参数拼在 URL 里，请求头一到就全拿到了；POST 的数据在请求体里，是跟着 TCP 流一块块过来的，得等收完才能解析。
  
**获取 GET 传值:**

`url.parse` 第二个参数传 `true`，`query` 就是解析好的对象，直接取属性即可。

```js
var urlinfo = url.parse(req.url, true); 
console.log(urlinfo.query);
```

原文这里写成了 `urlinfo.query()`，`query` 是个对象不是函数，加括号会直接报 `is not a function`，这里改过来了。

**获取 POST 传值:**

POST 得自己监听 `data` 事件把数据块拼起来，`end` 事件里才是完整内容。这段代码是理解 Express 里 `body-parser` 中间件在干什么的关键。

```js
var postData = ''; 

// 数据块接收中
req.on('data',
function(postDataChunk) {
    postData += postDataChunk;
});
// 数据接收完毕，执行回调函数
req.on('end',
function() {
    try {
        postData = JSON.parse(postData);
    } catch(e) {}
    req.query = postData;
    console.log(querystring.parse(postData));
});
```

这段代码在生产环境有个安全隐患，`postData += postDataChunk` 没有任何长度限制。别人往你接口丢一个几百 MB 的请求体，内存就被撑爆了。真实项目里一定要设上限，超过就直接 `req.destroy()` 断掉连接。`body-parser` 的 `limit` 选项干的就是这件事，默认 100kb。

## 九、MongoDB 介绍、安装与使用

前面把数据都写在内存变量里，进程一重启就没了。要持久化就得上数据库。这套笔记选的是 MongoDB，对前端友好在于它存的就是类 JSON 的结构，不用先设计表结构再写一堆 DDL。

### 9.1 数据库和文件的主要区别

- 数据库有数据库表、行和列的概念，让我们存储操作数据更方便
- 数据库提供了非常方便的接口，可以让 `nodejs`、`php` `java` `.net` 很方便的实现增加修改删除功能

### 9.2 NoSql 介绍

#### 9.2.1 NoSQL 介绍

- 由于互联网的迅速发展，云计算与 Web2.0。这样大量的交互给数据库提出了更高的性能要
求，传统的数据库(本文泛指 SQL 数据库)，即关系数据库虽然具备良好的事物管理，
但在 处理大量数据 的应用 时很难 在性能 上满足 设计要 求。NoSQL 就是主要为了解决当下大量高并发高要求的数据 库应用 需求，关系数 据库 具有严 格的参 照性，一致性 ，可用 性，原子性 ，隔离 性等特 点
- 因此会产生一些例如表连接等操作，这样会大大降低系统的性能。而在当前很多应用场景下对性能的要求 远远强 于传统 数据库 关注的 点，`NoSQL`就是为了解决大规模数据与多样数 据种类 等问题，尤其是其中大数据的相关问题。 
- `NoSQL`(`NoSQL = Not Only SQL` )，意即「不仅仅是 SQL」，它指的是非关系型的数据库，是以 `key-value`
形式存储，和传统的关系型数据库不一样，不一定遵循传统数据库的一些基本要求，比如说遵循SQL 标准ACID 属性、表结构等等。`NoSQL` 最早被提出是在 20 世纪 80 年代，在当时更多是强调的是与关系数据库区 别对待 ，最近这些年被提及的更多是强调协助解决大数据等相关问题。`NoSQL` 在大数据时代有自己的意义

这段是当年的行业背景介绍，得加个注脚。「NoSQL 不支持事务」这个说法在今天已经不成立了，MongoDB 从 4.0 起支持多文档事务，4.2 起支持分布式事务。选型时如果只凭「NoSQL 没事务」就排除它，依据已经过时了。

反过来也一样，PostgreSQL 早就有了成熟的 JSONB 类型，关系型数据库存文档也很顺手。两边这些年一直在互相靠拢，非黑即白的对比意义不大了。
 
#### 9.2.2 NoSQL 应用情况介绍

> 国内的互联网蓬勃发展，不仅涌现出 BAT(百度，阿里巴巴，腾讯)之类的巨头，也带动了整个互联 网行业的发展，大量的创业型公司如春笋般的涌出，在国家层面也提出了「互联网+」和「万众创业」的口 号。更多传统的行业也开始拥抱互联网。但是无论是做所谓的生态平台还是 传统业务的转型，涉及到的业务是多种多样的。这个时候企业架构师对于应用系统的核心，也就是数据库管理，不仅有传统的 SQL 选项也有了 NoSQL 这种适合特定场景需求的选项

**NoSQL 数据库在以下的这几种情况下比较适用**

- 数据模型比较简单
- 需要灵活性更强的 IT 系统
- 对数据库性能要求较高
- 不需要高度的数据一致性
- 对于给定 key，比较容易映射复杂值的环境

**NoSQL 发展现状**

- 国外: Google 的 BigTable 和 Amazon 的 Dynamo 使用的就是 NoSQL 型数据库。
- 国内:百度、阿里、腾讯、新浪微博、视觉中国、优酷运营数据分析、飞信空间、豆瓣社区等

### 9.3 什么时候建议使用 NoSql

- 对数据库高并发读写的需求
- 对海量数据的高效率存储和访问的需求
- 对数据库的高可扩展性和高可用性的需求

我自己的判断标准更简单一点。数据结构还在频繁变、字段今天加明天删的阶段，用 MongoDB 会舒服很多，不用每次改字段都写迁移脚本。等业务定型了、关联查询开始变多、对一致性要求变高，关系型数据库的优势才显出来。

不是说 MongoDB 不行，而是它擅长的是结构灵活和横向扩展，你拿它当 MySQL 用、动不动就跨集合关联，那是在用它最弱的地方。

### 9.4 NoSql 和传统数据库简单对比

概念上有个对照关系要先记住，不然看文档容易懵。

- 非结构型数据库。没有行、列的概念。用 JSON 来存储数据。
- 集合就相当于「表」，文档就相当于「行」。

下图把两边的术语对应关系列了出来，database 对 database，collection 对 table，document 对 row。

![MongoDB 与关系型数据库的概念对照表](https://s.poetries.top/gitee/2019/10/366.png)

对前端来说这套模型很亲切，你从数据库里查出来的一条文档，长得几乎就是接口要返回的那个 JSON。

### 9.5 NoSql 种类

NoSQL 不是一种数据库，是一大类。按数据模型分大致有键值、文档、列族、图这几种，各自解决的问题差别很大。

![NoSQL 数据库按数据模型分类的常见类型](https://s.poetries.top/gitee/2019/10/367.png)

平时最常打交道的是键值型的 Redis 和文档型的 MongoDB。Redis 主要拿来做缓存和会话存储，MongoDB 做主库。这两个在 Node 项目里搭配出现的频率特别高。

### 9.6 MongoDb 介绍

> MongoDB 是一个介于关系数据库和非关系数据库之间的产品，是非关系数据库当中功能最丰富，最像 关系数据库的。他支持的数据结构非常松散，是类似 json 的 bson 格式，因此可以存储比较复杂的数据类 型。Mongo 最大的特点是他支持的查询语言非常强大，其语法有点类似于面向对象的查询语言，几乎可以 实现类似关系数据库单表查询的绝大部分功能，而且还支持对数据建立索引。它的特点是高 性能 、易部署 、 易使用 ，存储数据非常 方便 

### 9.7 MongoDb 安装

- 官网:https://www.mongodb.com/
- 手册:https://docs.mongodb.org/manual/

**1. 双击 MongoDB 软件下一步下一步安装**

安装包一路点下去就行，没有需要特别配置的选项。

![MongoDB Windows 安装向导界面](https://s.poetries.top/gitee/2019/10/368.png)

**2. 安装完成配置环境变量 C:\Program Files\MongoDB\Server\3.0\bin 加入到系统的path 环境变量中**

配环境变量是为了在任意目录下都能敲 `mongo` 和 `mongod`，不然每次都得写完整路径。
 
**3. 打开 cmd 输入 :mongo命令看看是否成功。如果出来下图说明 mongodb配置成功。**

![命令行输入 mongo 后成功进入交互 shell](https://s.poetries.top/gitee/2019/10/369.png)

上面这套是 Windows 手动安装的流程，图里的路径是 3.0 版本。现在装 MongoDB 我基本不这么干了，本地开发直接一条 `docker run` 起个容器，用完删掉，不污染系统环境，也不用管版本冲突。要长期用就上官方的 Atlas 免费实例，连环境变量都不用配。

新版本还有个变化，交互式 shell 从 `mongo` 换成了 `mongosh`，语法基本兼容，下面的命令绝大多数照抄就能跑。

### 9.8 使用 MongoDb

1. 新建一个存放数据库的文件夹，注意:不能有中文和空格，建议不要放在 C 盘
2. 启动 MongoDb 服务

MongoDB 是标准的客户端服务端结构，`mongod` 是常驻的服务进程（结尾那个 d 是 daemon），`mongo` 是连上去敲命令的客户端。两个必须分开跑，这是新手最容易搞混的地方。

> 服务端:`mongod` 开启数据库服务 `mongod --dbpath C:\mongodb`

**开启 MongoDb 服务命令:**

![执行 mongod --dbpath 启动数据库服务的终端输出](https://s.poetries.top/gitee/2019/10/370.png)

- `--dbpath` 就是选择数据库文档所在的文件夹
- 也就是说，`mongoDB` 中，真的有物理文件，对应一个个数据库。U 盘可以拷走。
- 注意:一定要保持，开机这个 CMD 不能动了，不能关，不能 `ctrl+c`。 一旦这个 `cmd` 有问题了，数据库就自动关闭了

那个「窗口不能关」的限制是因为进程跑在前台。正式环境肯定不能这么搞，得注册成系统服务，或者交给 Docker、systemd 这类东西托管，机器重启也能自己拉起来。

3. 客户端输入 `mongo` 命令连接服务端

服务起来之后，另开一个终端窗口连上去。

> 客户端:`mongo` 使用数据库

![新开终端执行 mongo 连接本地数据库](https://s.poetries.top/gitee/2019/10/371.png)


> 客户端:`mongo` 使用数据库 `ip` 地址:端口号

连远程实例就在后面跟上地址和端口，默认端口是 27017。

![mongo 指定 IP 和端口连接远程数据库](https://s.poetries.top/gitee/2019/10/372.png)

顺带说个安全问题。MongoDB 早期版本默认不开认证也不限制绑定地址，很多人图省事直接把 27017 暴露到公网，结果数据被人清空还留下勒索信息。这类事故在几年前是批量发生的。开发机随意，只要是能被外网访问的实例，一定要开认证并且只绑内网地址。

## 十、MongoDB 数据库与集合的增删改查

上一节把服务跑起来了，这一节全是在 shell 里敲命令。这些命令值得花时间过一遍，哪怕以后用 Mongoose 这类 ODM，出问题时还是得回到 shell 里查数据。

### 10.1 数据库使用

>  开启 `mongodb` 服务:要管理数据库，必须先开启服务，开启服务使用 `mongod --dbpath c:\mongodb`

![启动 mongod 服务进程等待连接](https://s.poetries.top/gitee/2019/10/373.png)


> 管理 `mongodb` 数据库:`mongo` (一定要在新的 `cmd` 中输入)

![在新终端窗口中用 mongo 客户端连接](https://s.poetries.top/gitee/2019/10/374.png)


> 查看所有数据库列 表

```
show dbs
```

这里有个反直觉的点，`show dbs` 只会列出已经有数据的库。空库是不显示的，下面马上会解释为什么。

### 10.2 创建数据库

![use 命令切换或创建数据库](https://s.poetries.top/gitee/2019/10/375.png)

**使用数据库、创建 数据库**

`use` 这个命令有点特别，库存在就切过去，不存在就在内存里标记一下，但磁盘上什么都不会建。

```
use student
```

- 如果真的想把这个数据库创建成功，那么必须插入一个数据
- 数据库中不能直接插入数据，只能往集合(collections)中插入数据。不需要专门创建集合，只需要写点语法插入数据就会创建集合:

```
db.student.insert({"name":"xiaoming"});
```

- db.student 系统发现 student 是一个陌生的集合名字，所以就自动创建了集合

这就是前面说 `show dbs` 看不到空库的原因。MongoDB 是懒创建的，库和集合都要等到第一条数据落地才真正生成。

这个特性有个副作用得留神，集合名打错了不会报错，它会默默帮你新建一个。我见过因为写成 `db.users` 而不是 `db.user`，查了半天发现数据一直进的是另一个集合。

**显示当前的数据集合(mysql 中叫表)**

```
show collections
```

**删除数据库，删除当前所在的数据库**

```
db.dropDatabase();
```

这条命令删的是你当前 `use` 的那个库，没有二次确认，也没有回滚。执行前先敲一下 `db` 确认当前在哪个库上，这个习惯能救命。

**删除集合，删除指定的集合删除表**

> 删除集合 

```
db.COLLECTION_NAME.drop()

db.user.drop()
```

### 10.3 插入(增加)数据

> 插入数据，随着数据的插入，数据库创建成功了，集合也创建成功了。

```
db.表名.insert({"name":"zhangsan"});

student 集合名称(表)
```

插进去之后你查出来会发现多了个 `_id` 字段，那是 MongoDB 自动生成的主键，类型是 `ObjectId`。它由时间戳、机器标识、进程号和计数器拼成，所以天然带着创建时间，按 `_id` 排序基本等于按插入顺序排序。

补一句版本变化，`insert` 现在已经不推荐用了，官方建议按场景选 `insertOne` 或 `insertMany`，语义更明确，返回值也更规范。下面第十二、十三节的 Node 驱动代码用的就是 `insertOne`。

### 10.4 查找数据

查询是用得最多的操作，下面这二十条基本覆盖了日常需求。原文贴心地给出了对应的 SQL 写法，从关系型数据库转过来的话对照着看很快。

**1. 查询所有记 录**

```
db.userInfo.find();
```

> 相当于:`select* from userInfo;`

**2. 查询去掉后 的当前聚集集合中的某列的重复数据**

```
db.userInfo.distinct("name");
```

- 会过滤掉 `name` 中的相同数据
- 相当于:`select distict name from userInfo;`

**3. 查询 age = 22 的记录**

```
db.userInfo.find({"age": 22});
```

> 相当于: `select * from userInfo where age = 22;`

下面四条是比较运算，MongoDB 用 `$gt`、`$lt`、`$gte`、`$lte` 这几个操作符表达大于小于，写法是把操作符包在一个对象里当值传。这套语法一开始看着别扭，习惯了会发现它比 SQL 的字符串拼接更适合程序化组装查询条件。

**4. 查询 age > 22 的记录**

```
db.userInfo.find({age: {$gt: 22}});
```

> 相当于:`select * from userInfo where age >22;`

**5. 查询 age < 22 的记录**

```
db.userInfo.find({age: {$lt: 22}});
```

> 相当于:`select * from userInfo where age <22;`

**6. 查询 age >= 25 的记录**

```
db.userInfo.find({age: {$gte: 25}});
```

> 相当于:`select * from userInfo where age >= 25;`

**7. 查询 age <= 25 的记录**

```
db.userInfo.find({age: {$lte: 25}});
```

**8. 查询 age >= 23 并且 age <= 26**

```
db.userInfo.find({age: {$gte: 23, $lte: 26}});
```

**9. 查询name中包含 mongo的数据,模糊查询用于搜索**

模糊查询直接写 JavaScript 正则，这是 MongoDB 比 SQL 的 `LIKE` 好用的地方，正则的表达能力强太多。

```
db.userInfo.find({name: /mongo/});
```

```
//相当于%%
select * from userInfo where name like '%mongo%';
```

**10. 查询 name 中以 mongo 开头的**

```
db.userInfo.find({name: /^mongo/});
```

> `select * from userInfo where name like 'mongo%';`

这两条看着差不多，性能差别却很大。以 `^` 开头锚定的正则可以走索引，而 `/mongo/` 这种不锚定的只能全集合扫描。数据量上来之后，前者毫秒级，后者可能要几秒。这个我踩过，当时搜索接口越用越慢，查了一圈才发现是正则没锚定。

需要真正的全文搜索就别硬用正则了，MongoDB 有文本索引，再不够就上 Elasticsearch。

**11. 查询指定列 name、age 数据**

```
db.userInfo.find({}, {name: 1, age: 1});
```

> 相当于:`select name, age from userInfo;`

> 当然 `name` 也可以用 `true` 或 `false`,当用 `true` 的情况下和 `name:1` 效果一样，如果用 `false` 就 是排除 `name`，显示 `name` 以外的列信息

`find` 的第二个参数叫投影（projection），作用是只把需要的字段捞回来。别小看它，文档里要是存了大段富文本或者 base64 图片，不做投影每次查询都把这些一起拖过网络，接口能慢好几倍。

要注意包含和排除不能混着写，`{name: 1, age: 0}` 会直接报错，唯一的例外是 `_id`，它可以在包含模式下单独设成 0。

**12. 查询指定列 name、age 数据, age > 25**

```
db.userInfo.find({age: {$gt: 25}}, {name: 1, age: 1});
```

> 相当于:`select name, age from userInfo where age >25;`

**13. 按照年龄排序 1 升序 -1 降序**

- 升序:`db.userInfo.find().sort({age: 1});`
- 降序:`db.userInfo.find().sort({age: -1});`

**14. 查询 name = zhangsan, age = 22 的数据**

同一个对象里写多个字段，默认就是 AND 关系，不用额外的操作符。

```
db.userInfo.find({name: 'zhangsan', age: 22});
```

> 相当于:`select * from userInfo where name = 'zhangsan' and age = '22';`

接下来这三条是分页三件套，前端做列表页天天要用。

**15. 查询前 5 条数据**

```
db.userInfo.find().limit(5 );
```

> 相当于:`selecttop 5 * from userInfo;`

**16. 查询 10 条以后的数据**

```
db.userInfo.find().skip(10);
```

```
// 相当于:
select * from userInfo where id not in ( 
    selecttop 10 * from userInfo
);
```

**17. 查询在 5-10 之间的数据**

```
db.userInfo.find().limit (10).skip(5);
```

> 可用于分页，`limit` 是 `pageSize`，`skip` 是第几页`*pageSize`

`skip` 加 `limit` 是最直白的分页方案，但它有个性能陷阱。`skip(100000)` 并不是直接跳到第十万条，数据库还是得老老实实数过去，页码越大越慢。

数据量大的列表更推荐游标分页，也就是记住上一页最后一条的 `_id`，下一页查 `{_id: {$gt: lastId}}`。这样每页耗时是恒定的，代价是没法直接跳到第 N 页。做无限滚动的话正好合适。

**18. or与 查询**

多个条件取并集用 `$or`，值是一个数组，数组里每一项都是一个独立的查询条件。

```
db.userInfo.find({$or: [{age: 22}, {age: 25}]});
```

> 相当于:`select * from userInfo where age = 22 or age = 25;`

**19. findOne 查询第一条数据**

```
db.userInfo.findOne( );
```

> 相当于:`selecttop 1 * from userInfo;`

```
db.userInfo.find().limit(1 );
```

**20. 查询某 个结果集的记录条数 统计数量**

```
db.userInfo.find({age: {$gte: 25}}).count();
```

> 相当于:`select count(*) from userInfo where age >= 20;`

> 如果要返回限制之后的记录数量，要使用 `count(true)`或者 `count`(非 `0`)

```
db.users.find().skip(10).limit(5).count(true);
```

### 10.5 修改数据

> 修改里面还有查询条件。你要改谁，要告诉 `mongo`

更新语句由两部分组成，前面是找谁，后面是改什么。这两部分分开写是 MongoDB 的设计，比 SQL 那种 `UPDATE ... SET ... WHERE ...` 的顺序更直观一点。

**查找名字叫做小明的，把年龄更改为 16 岁**

```
db.student.update({"name":"小明"},{$set:{"age":16}});
```

**查找数学成绩是 70，把年龄更改为 33 岁:**

嵌套字段用点号访问，`score.shuxue` 就是 `score` 对象里的 `shuxue` 字段。这是文档型数据库的便利，换成关系型数据库你得先设计一张成绩表再做关联。

```
db.student.update({"score.shuxue":70},{$set:{"age":33}});
```

**更改所有匹配项目**

`update` 默认只改匹配到的第一条，这是最容易踩的坑。要批量改必须显式传 `{multi: true}`。

```
db.student.update({"sex":"男"},{$set:{"age":33}},{multi: true});
```

**完整替换，不出现$set 关键字了: 注意**

漏写 `$set` 的后果很严重，这不是「更新几个字段」，而是拿新文档把整条记录整个换掉。下面这条执行完，小明原来的 `score`、`sex` 之类的字段全没了，只剩 `name` 和 `age`。

```
db.student.update({"name":"小明"},{"name":"大明","age":16});
```

我的建议是养成肌肉记忆，写更新语句先把 `$set` 敲出来再填内容。

`$inc` 是在原值基础上加减，做计数器、库存扣减这类操作必须用它。直接读出来加一再写回去会有并发问题，两个请求同时读到同一个值，最后只加了一次。`$inc` 是原子的，不存在这个问题。

> `db.users.update({name: 'Lisi'}, {$inc: {age: 50}}, false, true);` 相当于:`update users set age = age + 50 where name = 'Lisi';`

> `db.users.update({name: 'Lisi'}, {$inc: {age: 50}, $set: {name: 'hoho'}}, false, true);` 相当于: `update users set age = age + 50, name = 'hoho' where name = 'Lisi';`

后面那两个布尔参数分别是 `upsert` 和 `multi`。`upsert` 传 true 的话，没匹配到就插入一条新的。位置参数容易记混，新代码建议直接用 `updateOne` / `updateMany`，把选项写成对象，可读性好很多。

### 10.6 删除数据

删除和更新一样，条件写在第一个参数里。

```
db.collectionsNames.remove( { "borough": "Manhattan" } )

db.users.remove({age: 132});

db.restaurants.remove( { "borough": "Queens" }, { justOne: true } )
```

注意 `remove` 的默认行为和 `update` 恰好相反，它默认删掉所有匹配项，只想删一条得加 `{justOne: true}`。

更要命的是 `db.users.remove({})`，空条件匹配所有文档，整个集合就清空了。这条命令和 `DROP TABLE` 的杀伤力是一样的，在生产库上敲之前务必看清楚括号里有没有东西。新版本推荐用 `deleteOne` 和 `deleteMany`，名字自带提醒作用。

## 十一、MongoDB 索引与 explain 查询分析

数据量小的时候怎么查都快，几十万条以后就是另一回事了。索引是让查询从「全表扫描」变成「直接定位」的关键，`explain` 则是判断索引到底有没有生效的工具。

### 11.1 索引基础

> 索引是对数据库表中一列或多列的值进行排序的一种结构，可以让我们查询数据库变得 更快。MongoDB 的索引几乎与传统的关系型数据库一模一样，这其中也包括一些基本的查 询优化技巧。

索引的原理跟书的目录是一回事。没有目录你得一页页翻，有目录直接跳到那一页。代价是这份目录本身要占空间，而且每次改内容都得同步更新目录，所以写入会变慢。索引不是越多越好，是按查询需求建。

**下面是创建索引的 命令**

```
db.user.ensureIndex( {"username":1})
```

`ensureIndex` 是老版本的写法，现在统一叫 `createIndex`，功能一样。老代码里看到 `ensureIndex` 知道是同一回事就行。

**获取当前集合的索 引**

排查慢查询的第一步就是敲这条，先看看到底有哪些索引。

```
db.user.getIndexes()
```

**删除索引的命令是**

```
db.user.dropIndex( {"username":1})
```

- 在 MongoDB 中，我们同样可以创建复合索引，如:
- 数字 `1` 表示 `username` 键的索引按升序存储，`-1` 表示 `age` 键的索引按照降序方式存储

```
db.user.ensureIndex({"username":1, "age":-1})
```

> 该索引被创建后，基于 username 和 age 的查询将会用到该索引，或者是基于 username 的查询也会用到该索引，但是只是基于 age 的查询将不会用到该复合索引。因此可以说，如果想用到复合索引，必须在查询条件中包含复合索引中的前 N个索引列。然而如果查询条件中的键值顺序和复合索引中的创建顺序不一致的话，MongoDB 可以智能的帮助我们调整该顺序，以便使复合索引可以为查询所用。如:

这段讲的是最左前缀原则，MySQL 的复合索引也是一样的规矩，值得记牢。

有两件事容易混淆，这里分开说。查询条件里字段的书写顺序不重要，优化器会自己调整；但索引定义时的字段顺序非常重要，它决定了这个索引能覆盖哪些查询。建复合索引之前先把高频查询列出来，按「等值查询的字段在前、范围查询的字段在后」来排，这是通用经验。

```
db.user.find({"age": 30, "username": "stephen"})
```

> 对于上面示例中的查询条件，MongoDB 在检索之前将会动态的调整查询条件文档的顺 序，以使该查询可以用到刚刚创建的复合索引。


> 对于上面创建的索引，MongoDB 都会根据索引的 keyname 和索引方向为新创建的索引自动分配一个索引名，下面的命令可以在创建索引时为其指定索引名，如:


```
db.user.ensureIndex( {"username":1},{"name":"userindex"})
```

> 随着集合的增长，需要针对查询中大量的排序做索引。如果没有对索引的键调用 `sort`， `MongoDB` 需要将所有数据提取到内存并排序。因此在做无索引排序时，如果数据量过大以 致无法在内存中进行排序，此时 `MongoDB` 将会报错

### 11.2 唯一索引

唯一索引除了加速查询，还兼职做数据约束。用户名、手机号、邮箱这类不能重复的字段，靠应用层「先查一下有没有再插入」是防不住并发的，两个请求同时通过检查就双双写进去了。把约束下沉到数据库这一层才是可靠的做法。

> 在缺省情况下创建的索引均不是唯一索引。下面的示例将创建唯一索引，如

```
db.user.ensureIndex( {"useri d":1},{"uniq ue":true})
```

> 如果再次插入 userid 重复的文档时，MongoDB 将报错，以提示插入重复键，如:

```
db.user.insert({"userid":5}) 
db.user.insert({"userid":5})

// E11000 duplicate key error index: user.user.$userid_1 dup key: { : 5.0 }
```

> 如果插入的文档中不包含 userid 键，那么该文档中该键的值为 null，如果多次插入类似 的文档，MongoDB 将会报出同样的错误，如:

这条规则值得单独记一下。缺失字段被当成 `null` 参与唯一性判断，所以「允许为空但填了就必须唯一」这种需求会直接卡住。解决办法是建稀疏索引或者部分索引，让没有该字段的文档不进索引。这个坑我第一次给可选的手机号加唯一索引时撞上过，第二个没填手机号的用户就注册不进来了。

```
db.user.insert({"userid1":5}) 
db.user.insert({"userid1":5})

// E11000 duplicate key error index: user.user.$userid_1 dup key: { : null }
```

> 如果在创建唯一索引时已经存在了重复项，我们可以通过下面的命令帮助我们在创建唯 一索引时消除重复文档，仅保留发现的第一个文档，如:

**先删除刚刚创建的唯一索引**

```
db.user.dropIndex( {" userid" :1} )
```

**插入测试数据，以保证集合中有重复键存在。**

```
db.user.remove() 
db.user.insert({"userid":5})
db.user.insert({"userid":5})
```

**重新创建唯一索引**

```
db.user.ensureIndex({"userid":1},{"unique":true })
```

**我们同样可以创建 复合唯一索引，即保证复合键值唯一 即可。如:**

复合唯一索引约束的是组合，单个字段可以重复。比如「同一个用户对同一篇文章只能点赞一次」就适合用这个，而不是给用户 ID 单独加唯一约束。

```
db.user.ensureIndex( {"userid":1,"age":1},{"unique":true})
```

### 11.3 索引的一些参数

创建索引时可以传的选项不少，下图把常用的几个列了出来。

![MongoDB 创建索引时可用的参数选项列表](https://upload-images.jianshu.io/upload_images/1480597-450216a694af3946.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

这里面 `background` 最需要注意，因为它关系到线上会不会出事故。

> 如果在为已有数据的文档创建索引时，可以执行下面的命令，以使 MongoDB 在后台创 建索引，这样的创建时就不会阻塞其他操作。但是相比而言，以阻 塞方式创建索引，会使整 个创建过程效率更高，但是在创建时 MongoDB 将无法接收其他的操作

```
db.user.ensureIndex( {"username":1},{"background":true})
```

给一个千万级的集合建索引，前台模式可能锁住数据库好几分钟，这段时间所有读写全部挂起，业务直接不可用。线上补索引一律加 `background`。这个说法针对的是笔记里那个年代的版本，新版本对索引构建的并发控制做了改进，具体行为以官方文档为准。

### 11.4 使用 explain

索引建完了怎么确认它真的被用上了？靠猜是不行的，得用 `explain`。

> explain 是非常有用的工具，会帮助你获得查询方面诸多有用的信息。只要对游标调用 该方法，就可以得到查询细节。explain 会返回一个文档，而不是游标本身。如

![explain 返回的查询执行计划输出](https://s.poetries.top/gitee/2019/10/376.png)

> `explain` 会返回查询使用的索引情况，耗时和扫描文档数的统计信息

输出里最该先看的是 `stage` 字段。看到 `COLLSCAN` 说明在全集合扫描，索引没生效；看到 `IXSCAN` 才是走了索引。

### 11.5 explain executionStats 查询具体的执行 时间

```
db.tablename.find().explain( "executionStats" )
```

> 关注输出的如下数值:`explain.executionStats.executionTimeMillis`

除了耗时，还要对比 `totalDocsExamined` 和 `nReturned` 这两个数。前者是扫了多少条，后者是返回了多少条。理想情况这两个数应该接近，扫一万条只返回十条，说明索引选得不对，过滤条件没能有效收窄范围。

这个比值比单纯看耗时更靠谱，因为耗时会受缓存影响，同一条查询跑第二遍往往快得多，容易给你一个「已经优化好了」的错觉。

## 十二、Node 操作 MongoDB 3.x 的方法

前面都是在 shell 里敲命令，这一节回到 Node 代码。驱动从 2.x 升到 3.x 时有个破坏性改动经常把人绊倒，`MongoClient.connect` 的回调第二个参数从 `db` 变成了 `client`，得再调一次 `client.db(dbName)` 才能拿到数据库对象。照着 2.x 的老教程写会直接报错。

```js

//http://mongodb.github.io/node-mongodb-native/3.0/quick-start/quick-start/

/*
nodejs操作mongodb数据库

 1.安装mongodb、

    cnpm install mongodb --save


 2.引入mongodb下面的MongoClient
    var MongoClient = require('mongodb').MongoClient;


 3.定义数据库连接的地址 以及配置数据库
    qianfeng数据库的名称

    var url = 'mongodb://localhost:27017/';

    var dbName = 'shop'


 4.nodejs连接数据库


 MongoClient.connect(url,function(err,client){

        const db = client.db(dbName);  数据库db对象

 })

5.操作数据库
    


	 MongoClient.connect(url,function(err,client){

			const db = client.db(dbName);  数据库db对象


			MongoClient.connect(url,function(err,db){



				db.collection('user').insertOne({"name":"张三"},function(err,result){

					db.close() //关闭连接
				})

		     })

	 })
     

*/
var MongoClient = require('mongodb').MongoClient;


//定义连接数据库的地址

const  url = 'mongodb://localhost:27017/';
var dbName = 'shop'

//连接数据库
MongoClient.connect(url,(err,client)=>{

    if(err){
        console.log('数据连接失败');
        return false;
    }
    let db=client.db(dbName);   /*获取db对象*/

    db.collection("admin").insertOne({"name":"mongodb3.0","age":10},function(err){

        if(err){
            console.log('增加失败');
            return false;
        }
        console.log('增加成功');
        client.close();  /*关闭数据库*/
    })


})
```

这段代码能跑通，但有个地方在真实项目里是反模式的，就是每次操作完都 `client.close()`。

建立数据库连接是有成本的，要走 TCP 握手、认证这些流程。正确做法是应用启动时连一次，把 client 存起来复用，驱动内部本来就维护着连接池。每来一个请求连一次断一次，QPS 稍微上来数据库就被连接风暴打垮了。

现在写这类代码我会直接用 `async/await`，驱动早就支持返回 Promise 了，不用传回调。

```js
const { MongoClient } = require('mongodb');

const client = new MongoClient('mongodb://localhost:27017');
await client.connect();               // 启动时连一次

const db = client.db('shop');
await db.collection('admin').insertOne({ name: 'mongodb', age: 10 });
```

## 十三、用 Node 操作 MongoDB 增删改查

### 13.1 在 Nodejs 中使用 Mongodb

> 前面的课程我们讲了用命令操作 `MongoDB`，这里我们看下如何用 `nodejs` 来操作数据库

**需要引包**

```
npm install mongodb --save
```

原文这里写的是 `--save-dev`，这个位置放错了。数据库驱动是运行时必需的依赖，进了 `devDependencies` 之后生产环境不会安装，部署上去就是 `Cannot find module 'mongodb'`。这里改成 `--save`。

### 13.2 Nodejs 连接 MongoDb 数据库

下面这段把 Express 和 MongoDB 串了起来，请求进来连数据库、插一条数据、返回结果。

```js
var express = require("express"); //数据库引用

var MongoClient = require('mongodb').MongoClient;
var app = express();
//数据库连接的地址，最后的斜杠表示数据库名字
var shujukuURL = 'mongodb://localhost:27017/news';
app.get("/", function(req, res) { //连接数据库，这是一个异步的操作
    MongoClient.connect(shujukuURL,
    function(err, db) {
        res.writeHead(200, {
            "Content-Type": "text/html;charset=UTF8"
        });
        if (err) {
            res.send("数据库连接失败");
            return;
        }
        res.write("恭喜，数据库已经成功连接 \n");
        db.collection("user").insertOne({
            "name": "哈哈"
        },
        function(err, result) {
            if (err) {
                res.send("数据库写入失败");
                return;
            }
            res.write("恭喜，数据已经成功插入");
            res.end();
            //关闭数据库
            db.close();
        });
    });
});

app.listen(8020);
```

这段代码有个隐蔽的问题，连接失败那个分支里先 `writeHead` 又调 `res.send`，而 `send` 内部还会再设一次头，实际会报 `Cannot set headers after they are sent`。这类「响应发了两次」的错误在异步回调里特别常见，写的时候要保证每条路径只有一个出口。

### 13.3 Nodejs 查找 MongoDb 数据库集合

查询返回的是游标（cursor）而不是数组，得遍历才能拿到数据。这个设计是为了应对结果集很大的情况，游标可以边取边处理，不必一次性全塞进内存。

```js
MongoClient.connect(dbUrl,
function(err, db) {
    if (err) {
        /*数据库连接失败*/
        console.log('数据库连接失败');
        return;
    }
    var result = [];
    var userRel = db.collection('user').find();
    //res.send(userRel);
    userRel.each(function(err, doc) {
        if (err) {
            res.write("游标遍历错误");
            return;
        }
        if (doc != null) {
            result.push(doc);
        } else {
            console.log(result); //遍历完毕
            db.close();
            res.render("index", {
                "result": result
            });
        }
    });
})
```

游标遍历完的标志是 `doc` 为 `null`，所以数据收集和后续渲染都写在 `else` 分支里。这种写法比较绕，现在直接用 `await cursor.toArray()` 一行就够了，结果集不大的话没必要手动遍历。

### 13.4 Nodejs 给 MongoDb 增加数据

新增数据用 `insertOne`，注意这里的 `score` 是一个嵌套对象。文档型数据库可以直接把结构塞进去，不用像关系型那样再拆一张成绩表。

```js
MongoClient.connect(dbUrl,
function(err, db) {
    if (err) {
        return
    }
    db.collection('user').insertOne({
        "name": name,
        "age": age,
        "score": {
            "shuxue": shuxuechengji,
            "yuwen": yuwenchengji
        }
    },
    function(err, result) {
        if (err) {
            console.log('写入数据失败');
        }
        //关闭数据库
        db.close();
        //res.redirect('/add'); res.redirect('/' ); /*路由跳转*/ res.end(); ////res.location('/add')
    })
})
```

### 13.5 Nodejs 修改 MongoDb 数据

修改要靠 `_id` 定位，从前端传过来的 `id` 是字符串，必须用 `ObjectID(id)` 转换成 MongoDB 的 ID 类型才能匹配上。这一步漏了的话不会报错，只会静默地一条都改不到，排查起来很折磨。

```js
MongoClient.connect(dbUrl,
function(err, db) {
    if (err) {
        console.log('数据库连接错误');
        return;
    }
    db.collection('user').updateOne({
        "_id": ObjectID(id)
    },
    {
        "name": name,
        "age": age,
        "score": {
            "shuxue": shuxue,
            "yuwen": yuwen
        }
    },
    function(err, results) {
        console.log(results);
        db.close();
        res.redirect('/');
        /*路由跳转*/
        res.end('end');
    })
})
```

这段代码还有个问题得指出来。`updateOne` 的第二个参数没加 `$set`，按前面 10.5 讲过的规则，这属于整文档替换，`_id` 之外的字段会被完全覆盖。原文这里应该写成 `{$set: {...}}`。这就是为什么我建议写更新语句先敲 `$set`。

### 13.6 Nodejs 删除 MongoDb 数据

```js
MongoClient.connect(dbUrl,
function(err, db) {
    if (err) {
        throw new Error("数据库连接失败");
        return;
    }
    db.collection('user').deleteOne({
        "_id": ObjectID(id)
    },
    function(error, result) {
        if (error) {
            throw new Error('删除数据失败');
            return;
        }
        db.close();
        res.redirect('/');
        /*路由跳转*/
    })
})
```

在异步回调里 `throw` 是没用的，这个坑得单独说。回调是在事件循环的后续 tick 里执行的，那时候原来的调用栈早就没了，外层的 `try/catch` 根本接不住这个异常，它会一路冒泡成未捕获异常把进程干掉。

回调风格里正确的做法是把错误交给 Express 的 `next(err)`，或者直接 `res.status(500).send(...)`。换成 `async/await` 之后就可以正常用 `try/catch` 了，这也是我强烈建议新代码走 Promise 的原因之一。

到这里 Node 操作 MongoDB 的增删改查就齐了。实际项目里很少直接裸用驱动，多数会上 Mongoose 这类 ODM，它能给你 Schema 校验、类型转换、中间件钩子这些东西。不过底层原理还是上面这些，遇到怪问题时得能下探到这一层。

## 十四、Express 安装与使用

### 14.1 Express 简单介绍

- Express 是一个基于 Node.js 平台，快速、开放、极简的 web 开发框架
- Express 框架是后台的 Node 框架，所以和 jQuery、zepto、yui、bootstrap 都不一个东西。 Express 在后台的受欢迎的程度类似前端的 jQuery，就是企业的事实上的标准。

**Express 特点**

- `Express` 是一个基于 `Node.js` 平台的极简、灵活的 web 应用开发框架，它提供一
系列强大的特性，帮助你创建各种 `Web` 和移动设备应用
- 丰富的 HTTP 快捷方法和任意排列组合的 `Connect` 中间件，让你创建健壮、友好的 API 变得既快速又简单
- `Express` 不对 `Node.js` 已有的特性进行二次抽象，我们只是在它之上扩展了 Web应用所需的基本功能

最后这条是 Express 的设计哲学，也是它能活这么多年的原因。`req` 和 `res` 还是原生那两个对象，Express 只是往上挂了些便利方法，你随时可以绕过框架直接调原生 API。这跟那些把一切都包起来的重型框架是两个路子。

社区现在还有 Koa、Fastify、NestJS 这些选择。Koa 是 Express 原班人马做的，用 `async/await` 重写了中间件模型，洋葱圈式的执行顺序比 Express 的线性链更好理解，我另外写过一篇 [重新认识 Koa](https://feinterview.poetries.top/blog/relearn-koa) 专门讲这个。Fastify 主打性能，NestJS 提供了完整的分层架构。但入门先学 Express 依然合适，它的中间件模型是理解后面那几个的基础。

### 14.2 Express 安装使用

**安装:**

> 安装 Express 框架，就是使用 npm 的命令

```
npm install express --save
```

> `--save` 参数，表示自动修改 `package.json` 文件，自动添加依赖项

**简单使用**

三行代码起一个服务，跟第二节手写 `http` 那一版对比一下就知道框架省了多少事。

```js
//1.引入
var express = require('express');
var app = express();
//2.配置路由
app.get('/',
function(req, res) {
    res.send('Hello World!');
}); //3.监听端口

app.listen(3000,'127.0.0.1');
```

`res.send` 是 Express 加的便利方法，它会根据你传的东西自动设 `Content-Type`，传字符串就是 HTML，传对象就是 JSON，还顺手把 `end` 调了。原生写法里那几行 `writeHead` 全省了。

**完整 Demo**

多个路由就是多次调用 `app.get`，Express 会按注册顺序去匹配。

```js
var express = require('express');
/*引入 express*/
var app = express();
/*实例化express 赋值给app*/
//配置路由 匹配 URl 地址实现不同的功能
app.get('/',
function(req, res) {
    res.send('首页');
}) 

app.get('/search',
function(req, res) {
    res.send('搜索'); //?keyword=华为手机&enc=utf-8&suggest=1.his.0.0&wq
}) 

app.get('/login',
function(req, res) {
    res.send('登录');
}) 

app.get('/register',
function(req, res) {
    res.send('注册');
}) 

app.listen(3000, "127.0.0.1");
```


### 14.3 Express 框架中的路由

回想一下第八节那堆判断 `req.url` 的 `if/else`，Express 把它变成了声明式的注册。

> 路由(Routing)是由一个 URI(或者叫路径)和一个特定的 HTTP 方法(GET、POST 等) 组成的，涉及到应用如何响应客户端对某个网站节点的访问

路径和方法两个条件都得对上才会命中。同一个 `/user` 路径，GET 和 POST 可以挂完全不同的处理逻辑，这也是 RESTful 风格接口的基础。

**简单的路由配置**

> 当用 get 请求访问一个网址的时候，做什么事情

```js
app.get("网址",function(req,res){

});
```

> 当用 post 访问一个网址的时候，做什么事情:

```js
app.post("网址",function(req,res){

});
```

```js
// user 节点接受 PUT 请求

app.put('/user', function (req, res) {
    res.send('Got a PUT request at /user'); 
});
```

```js
// user 节点接受 DELETE 请求

app.delete('/user', function (req, res) {
    res.send('Got a DELETE request at /user'); 
});
```

**动态路由配置:**

路径里用冒号声明参数占位，匹配到的值从 `req.params` 里取。原文这行漏了路径字符串，补上之后是这样。

```js
app.get('/user/:id', function(req, res){ 
    var id = req.params["id"];
    res.send(id); 
});
```

访问 `/user/123` 时 `req.params.id` 就是字符串 `'123'`。注意永远是字符串，要当数字用记得转，直接拿去跟数据库里的数值字段比较是匹配不上的。

**路由的正则匹配:(了解)**

```js
app.get('/ab*cd', function(req, res) { 
    res.send('ab*cd');
});
```

通配符这类写法在 Express 各大版本之间有过调整，具体支持哪些模式以你实际用的版本文档为准。日常够用的是冒号参数，通配符路由容易匹配到意料之外的路径，除非确有需要，不然别用。

**路由里面获取 Get 传值**

查询字符串走 `req.query`，Express 已经帮你解析成对象了，不用再自己引 `url` 模块。

```js
// /news?id=2&sex=nan

app.get('/news', function(req, res) { 
    console.log(req.query);
});
```

这里也把原文漏掉的引号补上了，`'/news` 少了结尾的引号是跑不起来的。

顺手区分一下三个容易混的东西。`req.params` 是路径参数，`req.query` 是问号后面的查询串，`req.body` 是 POST 请求体，最后这个需要中间件才有。

### 14.4 Express 框架中 ejs 的安装使用

**Express 中 ejs 的安装:**

```
npm install ejs --save 
```

模板引擎在生产环境渲染页面时也要用，所以装进 `dependencies`，不要用 `--save-dev`。

**Express 中 ejs 的使用**

`app.set("view engine", "ejs")` 注册模板引擎之后，`res.render` 就能用了，第一个参数是模板名，第二个是要传进去的数据。

```js
var express = require("express");
var app = express();
app.set("view engine", "ejs");

app.get("/", function(req, res) {
    res.render("news", {
        "news": ["我是小新闻啊", "我也是啊", "哈哈哈哈"]
    });
});
app.listen(3000);
```

原文这段的括号位置错了，路由回调被提前闭合成 `function(req, res) {});`，导致 `res.render` 跑到了外面，`res` 是未定义的。这里按正确的嵌套关系改过来了。

**指定模板位置 ，默认模板位置在 views**

```
app.set('views', __dirname + '/views');
```

**Ejs 引入模板**

``` 
<%- include header.ejs %>
```

**Ejs 绑定数据**

```
<%=h%>
```

**Ejs 绑定 html 数据**

```
<%-h%>
```

**Ejs 模板判断语句**

```
<% if(true){ %> 
    <div>true</div>
    <%} 
  else{ %> 
    <div>false< /di v>
<%} %>
```

**Ejs 模板中循环数据**

```html
<%for(var i=0;i<list.length;i++) { %>
    <li><%=list[i] %></li>
<%}%>
```

上面这几个标签就是 EJS 的全部核心语法了，学习成本极低，因为循环和判断用的就是原生 JavaScript，不像有些模板引擎要另学一套 DSL。

**Ejs 后缀修改为 Html**

> 这是一个小技巧，看着`.ejs` 的后缀总觉得不爽，使用如下方法，可以将模板文件的后缀换成我们习惯的`.html`


1. 在 `app.js` 的头上定义 `ejs`:,代码如下:

```
var ejs = require('ejs');
```

2. 注册 html 模板引擎代码如下:


```js
app.engine('html',ejs.__express);
```

3. 将模板引擎换成 html代码如下:

```js
app.set('view engine', 'html');
```

4. 修改模板文件的后缀为 `.html`

改后缀的好处是编辑器能直接给你 HTML 的语法高亮和格式化。代价是别人接手时可能会误以为那是静态文件，团队里最好统一一下。


### 14.5 利用 Express.static 托管静态文件

CSS、图片、前端打包产物这些不需要走业务逻辑，直接按路径吐文件就行，`express.static` 干的就是这件事。

1. 如果你的静态资源存放在多个目录下面，你可以多次调用 `express.static` 中间件:

```js
app.use(express.static('public'));
```

> 现在，public 目录下面的文件就可以访问了

```
http://localhost:3000/images/kitten.jpg
http://localhost:3000/css/style.css 
http://localhost:3000/js/app.js
http://localhost:3000/images/bg.png h
ttp://localhost:3000/hello.html
```


注意 URL 里是不带 `public` 这一段的，`public` 只是磁盘上的目录名，对外不可见。这点经常让人困惑，明明文件在 `public/css/style.css`，访问路径却是 `/css/style.css`。

2. 如果你希望所有通过 `express.static` 访问的文件都存放在一个「虚拟(virtual)」目 录(即目录根本不存在)下面，可以通过为静态资源目录指定一个挂载路径的方式来实现，如下所示

```js
app.use('/static', express.static('public'));
```

> 现在，你就可以通过带有 「/static」 前缀的地址来访问 public 目录下 面的文件了

```
http://localhost:3000/static/images/kitten.jpg
http://localhost:3000/static/css/style.css http://localhost:3000/static/js/app.js http://localhost:3000/static/images/bg.png
http://localhost:3000/static/hello.html
```

加前缀这招在实际项目里挺有用的，能把静态资源和 API 路径分开，Nginx 那层做转发规则时会清爽很多。还有一点，`express.static` 支持传第二个参数配置缓存策略，带 hash 的构建产物可以设很长的 `maxAge`，直接省掉一堆重复请求。

### 14.6 Express 中间件

中间件是 Express 最核心的概念，把它想明白了，这个框架就没什么剩下的了。

- `Express` 是一个自身功能极简，完全是由路由和中间件构成一个的 web 开发框架，一个 `Express` 应用其实就是在依次调用各种中间件
- 中间件(`Middleware`) 是一个函数，它可以访问请求对象(request object (req)), 响 应对象(response object (res)), 和 web 应用中处理请求-响应循环流程中的中间件，一般 被命名为 next 的变量

**中间件的功能包括**

- 执行任何代码
- 修改请求和响应对象
- 终结请求-响应循环
- 调用堆栈中的下一个中间件

一个请求进来之后会顺着注册顺序在这条链上往下走，每个中间件要么把请求处理掉（发响应，链条结束），要么调 `next()` 传给下一个。日志、鉴权、限流、参数解析全是这么挂上去的，业务代码里就不用重复写这些了。

> 如果我的 `get`、`post` 回调函数中，没有 `next` 参数，那么就匹配上第一个路由，就不会往下匹 配了。如果想往下匹配的话，那么需要写 `next()`

忘记调 `next()` 是这里的头号坑。请求会卡在那个中间件里不动，浏览器一直转圈直到超时，而服务端一条错误日志都没有。碰到「接口没响应但也没报错」，先去查是不是哪条路径漏了 `next()`。

反过来，调了 `next()` 之后又接着发响应也会出问题，前面提过的 `Cannot set headers after they are sent` 就是这么来的。习惯写成 `return next()`，能避掉一半这类问题。

**Express 应用可使用如下几种中间件**

- 应用级中间件
- 路由级中间件
- 错误处理中间件
- 内置中间件
- 第三方中间件

1. 应用级中间件

用 `app.use()` 挂载，对所有请求生效，通常放日志、CORS 这类全局逻辑。注册位置很关键，写在路由后面的话前面的路由已经把请求处理完了，它根本轮不上。

![应用级中间件通过 app.use 注册的示例代码](https://s.poetries.top/gitee/2019/10/377.png)


2. 路由中间件

绑在 `express.Router()` 实例上，只对这个路由模块下的请求生效。项目大了之后按业务拆 Router，每块自己管自己的鉴权，比全局挂一堆判断清爽得多。

![路由级中间件绑定在 Router 实例上的示例](https://s.poetries.top/gitee/2019/10/378.png)


3. 错误处理中间件

这个最特殊，它的函数签名是四个参数 `(err, req, res, next)`。Express 靠参数个数来识别错误处理中间件，写成三个参数它就当普通中间件了，永远接不到错误。

![四参数形式的错误处理中间件写法](https://s.poetries.top/gitee/2019/10/379.png)

错误处理中间件必须注册在所有路由的最后面，不然错误还没产生它就已经被跳过了。有了它，业务代码里只要 `next(err)` 把错误抛出来，统一在这里记日志、返回友好提示，不用每个接口都写一遍 `try/catch`。

4. 内置中间件

Express 自带的那几个，`express.static` 是最常用的一个。早期版本内置中间件更多，后来大部分被拆成独立的包了，所以老教程里有些 `express.xxx` 现在得单独装。

![Express 内置中间件的使用说明](https://s.poetries.top/gitee/2019/10/380.png)

5. 第三方中间件

社区生态最丰富的部分，装个包 `app.use` 一下就能用。`body-parser` 解析请求体，`cookie-parser` 处理 Cookie，`morgan` 打访问日志，`helmet` 批量设置安全响应头。

![常用第三方中间件列表与安装方式](https://s.poetries.top/gitee/2019/10/381.png)
![第三方中间件在应用中的挂载示例](https://s.poetries.top/gitee/2019/10/382.png)

引第三方中间件的时候留个心眼，它们是有能力读写你所有请求数据的，选包之前看看维护状态和下载量。

### 14.7 获取 Get Post 请求的参数

- `GET` 请求的参数在 `URL` 中，在原生 `Node` 中，需要使用 `url` 模块来识别参数字符串。在`Express` 中，不需要使用 `url` 模块了。可以直接使用 `req.query` 对象
- `POST` 请求在 `express` 中不能直接获得，可以使用 `body-parser` 模块。使用后，将可以用`req.body`得到参数。但是如果表单中含有文件上传，那么还是需要使用 `formidable` 模块

**1. 安装**

```
npm install body-parser
```

**2. 使用 req.body 获取 post 过来的参数**

```js
var express = require('express') 
var bodyParser = require('body-parser') 
var app = express()

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}))

// parse application/json
app.use(bodyParser.json()) 

app.use(function(req, res) {
    res.setHeader('Content-Type', 'text/plain')
    res.write('you posted:\n')
    res.end(JSON.stringify(req.body, null, 2))
})
```

对照第八节手写的那段 `req.on('data')`，`body-parser` 干的就是同一件事，只是帮你处理好了编码、长度限制、`Content-Type` 判断这些细节。

补个现状，从 Express 4.16 起 `express.json()` 和 `express.urlencoded()` 已经内置了，不用再单独装 `body-parser`。新项目直接写 `app.use(express.json())` 就行。

## 十五、Express 中间件之 Cookie

HTTP 是无状态协议，服务器处理完一个请求就把你忘了。要实现登录态、购物车这些跨请求的东西，就得有个办法在请求之间传递身份信息。Cookie 是最早也最通用的方案。

### 15.1 Cookie 简介

下图是 Cookie 的基本工作流程，服务端通过响应头 `Set-Cookie` 下发，浏览器保存后在后续请求里自动带上。

![Cookie 在浏览器与服务器之间的传递流程](https://s.poetries.top/gitee/2019/10/383.png)

关键在于「自动带上」这四个字，你不用写任何代码，浏览器会对同域名的每个请求都附上 Cookie。方便是方便，后面会看到这个自动行为也正是 CSRF 攻击的前提。

### 15.2 Cookie 特点

- `cookie` 保存在浏览器本地
- 正常设置的 `cookie` 是不加密的，用户可以自由看到;
- 用户可以删除 `cookie`，或者禁用它
- `cookie` 可以被篡改
- `cookie` 可以用于攻击
- `cookie` 存储量很小。未来实际上要被 `localStorage` 替代，但是后者 `IE9` 兼容

最后这条得纠正一下，`localStorage` 并不能替代 Cookie，两者解决的是不同问题。`localStorage` 只在浏览器本地，不会自动跟随请求发到服务端，所以它做不了登录态那件事。真正在替代 Cookie 承担身份凭证的是 Token 方案（比如 JWT 放在 `Authorization` 头里），而那又是另一套权衡。

这几条特点里最要紧的是「可以被篡改」。任何时候都不要把 `isAdmin=true` 这种东西直接写进 Cookie，用户改一下就提权了。Cookie 里只能放一个无意义的标识符，真正的权限判断必须在服务端做。

### 15.3 Cookie 的使用

Express 里读 Cookie 需要 `cookie-parser` 中间件，写 Cookie 用 `res.cookie` 就行，那个是 Express 自带的。下面三张图是完整的使用流程。

![引入 cookie-parser 中间件并注册](https://s.poetries.top/gitee/2019/10/384.png)
![通过 res.cookie 设置 Cookie 的示例](https://s.poetries.top/gitee/2019/10/385.png)
![通过 req.cookies 读取 Cookie 的示例](https://s.poetries.top/gitee/2019/10/386.png)


**设置 cookie**

下面三行分别演示了控制有效期、限定作用域、用绝对时间设置过期这三种常见用法。

```js
res.cookie('rememberme', '1', { maxAge: 900000, httpOnly: true })

res.cookie('name', 'tobi', { domain: '.example.com', path: '/admin', secure: true });


res.cookie('rememberme', '1', { expires: new Date(Date.now() + 900000), httpOnly: true });
```

这几个选项里 `httpOnly` 值得单独说。加上它之后，前端 JavaScript 就读不到这个 Cookie 了，`document.cookie` 里看不见。这是防 XSS 窃取会话的基本手段，凡是身份相关的 Cookie 都该带上。

`secure: true` 表示只在 HTTPS 下发送，生产环境应该开。还有一个原文没提但现在很重要的 `sameSite`，它控制跨站请求要不要带 Cookie，是防 CSRF 的主要手段。现代浏览器对没有显式声明 `sameSite` 的 Cookie 有默认策略，跨站场景下的行为以各浏览器最新文档为准。

**获取 cookie**

```
req.cookies.name
```

**删除 cookie**

Cookie 没有真正的「删除」接口，做法都是把它设成一个已经过期的值，让浏览器自己清掉。

```
res.cookie('rememberme', '', { expires: new Date(0)});

res.cookie('username','zhangsan',{domain:'.ccc.com',maxAge:0,httpOnly:true});
```

这里有个容易忽略的点，删除时的 `domain` 和 `path` 必须和设置时完全一致，对不上的话浏览器会认为是两个不同的 Cookie，删不掉。退出登录没生效的问题多半出在这儿。

### 15.4 加密 Cookie

前面说过 Cookie 可以被用户随便改，签名机制就是用来发现这种篡改的。

**1. 配置中间件的时候需要传参**

给 `cookieParser` 传一个密钥，它会用这个密钥给 Cookie 值算签名。

```js
var cookieParser = require('cookie-parser');

app.use(cookieParser('123456'));
```

密钥别像这样硬编码在代码里，走环境变量。这串东西泄露了，签名机制就等于不存在。

**2. 设置 cookie 的时候配置 signed 属性**

```js
res.cookie('userinfo','hahaha',{domain:'.ccc.com',maxAge:900000,httpOnly:true,signed:true})
```

**3. signedCookies 调用设置的 cookie**

签名过的 Cookie 要从 `req.signedCookies` 里取，不在 `req.cookies` 里。值被改过的话这里拿到的是 `false`，你就知道有人动过手脚。

```js
console.log(req.signedCookies);
```

要分清签名和加密是两回事。签名只保证「没被改过」，内容本身还是明文，用户照样能看见。真要藏东西得自己加密，或者干脆别往 Cookie 里放敏感数据，这就引出了下一节的 Session。

## 十六、Express 中间件之 express-session

### 16.1 Session 简单介绍

> `session` 是另一种记录客户状态的机制，不同的是 `Cookie`保存在客户端浏览器中，而 `session` 保存在服
务器上

**Session 的用途**

- `session` 运行在服务器端，当客户端第一次访问服务器时，可以将客户的登录信息保存
- 当客户访问其他页面时，可以判断客户的登录状态，做出提示，相当于登录拦截
- `session` 可以和 `Redis`或者数据库等结合做持久化操作，当服务器挂掉时也不会导致某些客户信息(购物车)
丢失。


### 16.2 Session 的工作流程

> 当浏览器访问服务器并发送第一次请求时，服务器端会创建一个 session 对象，生成一个类似于 key,value 的键值对，然后将 key(cookie)返回到浏览器(客户)端，浏览器下次再访问时，携带 key(cookie)， 找到对应的 session(value)。 客户的信息都保存在 session 中

所以 Session 并没有取代 Cookie，它是建立在 Cookie 之上的。浏览器那边存的还是一个 Cookie，只不过里面只有一串没有意义的 session id，真正的数据留在服务端。用户改了那串 id 也没用，服务端查不到对应的 Session，直接当未登录处理。

这就是 Session 比纯 Cookie 安全的地方，也是它的代价，服务端得自己存这些数据。

### 16.3 express-session 的使用

**1. 安装 express-session**

```
npm install express-session --save
```

**2. 引入 express-session**

```
var session = require("express-session");
```

**3. 设置官方文档提供的中间件**

```js
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}))
```

`secret` 是给 session id 签名用的，同样要走环境变量。这个配置得放在所有路由之前，不然路由里拿不到 `req.session`。

**4. 使用**

挂上中间件之后，`req.session` 就是个普通对象，随便读写，框架会帮你在请求结束时保存。

- 设置值 `req.session.username = "张三";`
- 获取值 `req.session.username`

### 16.4 express-session 的常用参数

```js
app.use(session({
    secret: '12345',
    name: 'name',
    cookie: {
        maxAge: 60000
    },
    resave: false,
    saveUninitialized: true
}));
```

下面两张图把各个参数的含义列全了，`secret` 是签名密钥，`name` 是存 session id 的那个 Cookie 叫什么名字，`cookie.maxAge` 是有效期。

![express-session 参数说明第一部分](https://s.poetries.top/gitee/2019/10/387.png)
![express-session 参数说明第二部分](https://s.poetries.top/gitee/2019/10/388.png)

`resave` 和 `saveUninitialized` 这两个最容易配错，展开说一下。

`resave: true` 表示每次请求都重新写一遍存储，哪怕 Session 一点没变。这会给存储层带来大量无谓的写操作，多数场景应该设成 `false`。

`saveUninitialized: true` 表示新建的空 Session 也存下来。结果就是每个爬虫、每个只是路过首页的访客都会在你的存储里留一条记录，量大了很占空间，而且这在一些地区还涉及 Cookie 合规问题。一般也建议设 `false`，等到真的往 Session 里写了东西再落库。

原文示例里两个都开着，那是官方文档为了避免弃用警告给的保守默认值，实际项目按上面的思路调。

### 16.5 express-session 的常用方法

退出登录就是销毁 Session，`destroy` 会把服务端的记录删掉，之前那个 session id 就作废了。

```js
req.session.destroy(function(err) {
    /*销毁 session*/
}) 

req.session.username = '张三';   //设置 session
req.session.username;            //获取 session

req.session.cookie.maxAge = 0;   //重新设置 cookie 的过期时间
```

原文这段几行代码和注释挤在一行里，读起来容易误解，这里拆开了，语义没变。

### 16.6 负载均衡配置 Session，把 Session 保存到数据库 里面

这一节解决的是一个真实的线上问题，值得多说两句。

`express-session` 默认把数据存在 Node 进程的内存里。单进程跑没问题，一旦你用 PM2 开了多进程，或者部署了多台机器做负载均衡，麻烦就来了。用户登录的请求打到 A 进程，Session 存在 A 的内存里；下一个请求被分到 B 进程，B 完全不认识这个 session id，用户就被踢回登录页了。

表现出来就是「时不时掉登录」，而且没有规律，特别难查。

进程一重启内存也就清空了，所有人的登录态全丢，这个在发版时尤其明显。

解决办法就是把 Session 挪到进程外面，存到 Redis 或者 MongoDB 里，所有进程共享同一份。

1. 需要安装`express-session` 和 `connect-mongo`模块 

2. 引入模块

```js
var session = require("express-session");

const MongoStore = require('connect-mongo')(session);
```

3. 配置中间件

```js
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    rolling:true,
    cookie:{
        maxAge:100000
    },
    store: new MongoStore({
        url: 'mongodb://127.0.0.1:27017/student',
        touchAfter: 24 * 3600 // time period in seconds
    })
}))
```

配置里那个 `touchAfter` 是个不错的优化。用户每次请求都会「碰」一下 Session 刷新过期时间，如果每次都写库，数据库压力不小。设成 `24 * 3600` 之后，24 小时内的重复请求不会真的写库，只有确实需要更新时才落盘。

`rolling: true` 的意思是每次响应都重置 Cookie 的过期时间，也就是「只要你在用就不会掉线」，不用的话到点就退。做后台管理系统一般会开这个。

`connect-mongo` 的 API 在不同大版本之间变过，上面 `require('connect-mongo')(session)` 这种调用形式是老版本的写法，新版本改成了 `MongoStore.create({...})`。装之前先看一眼你那个版本的 README，别照抄。

生产环境我更倾向用 Redis 存 Session，配 `connect-redis`。Session 本来就是有时效的临时数据，Redis 的内存读写和自动过期机制天生就是干这个的，MongoDB 更适合放需要长期留存的业务数据。

### 16.7 Cookie 和 Session 区别

这是面试高频题，把上面两节串起来就是答案。

1. `cookie` 数据存放在客户的浏览器上，`session` 数据放在服务器上
2. `cookie` 不是很安全，别人可以分析存放在本地的 `COOKIE` 并进行 `COOKIE` 欺骗 考虑到安全应当使用 `session`
3. `session` 会在一定时间内保存在服务器上。当访问增多，会比较占用你服务器的性能 考虑到减轻服务器性能方面，应当使用 `COOKIE`
4. 单个 `cookie` 保存的数据不能超过 `4K`，很多浏览器都限制一个站点最多保存 `20` 个 `cookie`

我一般会再补一句，两者不是二选一的关系，Session 的实现本来就依赖 Cookie 传 id。真正要权衡的是「状态放在哪」，放服务端就是 Session，需要共享存储；放客户端就是 Token 那一套，服务端无状态好扩展，代价是没法即时吊销，得靠短有效期加刷新机制去补。

用户量不大、需要随时踢人下线的后台系统，Session 更省心。要做多端、要对外开放 API 的，Token 更合适。

## 总结

这一篇从 Node 是什么开始，把 `http`、`url`、`fs` 这些内置模块、CommonJS 模块化、npm 依赖管理、Express 的路由与中间件、Cookie 与 Session、MongoDB 的增删改查和索引调优整个走了一遍。内容偏基础，但这些正是往上走的地基。

有几个点我认为比其它内容更值得记牢。

单线程加非阻塞 I/O 决定了 Node 的能力边界，它擅长 I/O 密集，怕 CPU 密集，任何一段同步计算都可能拖垮整个服务。`exports` 和 `module.exports` 的区别、`update` 漏写 `$set` 会整文档替换、`remove({})` 会清空集合，这几个坑造成的后果都不轻，值得单独记一下。中间件忘了调 `next()` 会让请求静默挂起，出现「接口不响应也不报错」时先往这个方向查。多进程部署下 Session 必须落到共享存储，不然就是随机掉登录。

时代变化的部分也说清楚了。ESM 已经是一等公民，`fs/promises`、内置 `fetch`、`node:` 前缀、`AbortController` 都是现在的常规写法，`url.parse` 让位给 `new URL()`，`body-parser` 被 Express 内置。但原文那些 CommonJS 写法和回调风格不是废弃品，你去翻任何一个跑了五年以上的 Node 项目，看到的还是这些，看得懂才有得改。

这份笔记年头不短了，具体 API 的行为和版本支持情况请以官方文档为准，我只能保证思路方向是对的。

## 参考

- [Node.js 官方文档](https://nodejs.org/docs/latest/api/)
- [Express 官方文档](https://expressjs.com/)
- [MongoDB 官方手册](https://www.mongodb.com/docs/manual/)
- [MongoDB Node.js 驱动文档](https://www.mongodb.com/docs/drivers/node/current/)
- [EJS 官方文档](https://ejs.co/)
- [express-session 文档](https://github.com/expressjs/session)
- [MDN HTTP Cookie 指南](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Cookies)
- [前端进阶之旅](https://interview.poetries.top)
