---
title: Serverless 入门实战 从运行原理到四个落地案例
description: 从 FaaS 与 BaaS 的边界讲清 Serverless 到底省掉了什么，梳理触发器、冷启动和函数分层原理，并用阿里云函数计算完整跑通登录注册、Restful API、音视频处理、React 服务端渲染四个案例。
date: 2021-04-16 15:24:08
tags:
  - serverless
  - FaaS
  - Node.js
categories: Front-End
---

一个只有几十人在用的内部工具，每天的调用量撑死几百次，却要为它单独挂一台常驻云主机，还得管系统升级、证书续期、磁盘日志清理。机器九成时间在空转，运维那摊活儿一样都没少。这类场景就是 Serverless 最典型的入口，把常驻服务拆成按需执行的函数，没请求的时候不占资源，自然也就没有账单和值班。

这篇是我把 Serverless 从概念到落地重新梳理一遍的笔记。前半部分讲清它到底解决什么问题、函数是怎么被拉起来的、冷启动为什么能压到百毫秒，后半部分是四个可以照着敲的完整案例，代码和部署命令都在。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Serverless 的两种定义，以及 FaaS 和 BaaS 各自负责哪一块
- 写第一个函数，触发器、事件对象和日志分别该怎么处理
- 函数的调用链路、冷启动与热启动、以及 FaaS 的三层结构
- 用一份 YAML 描述整个应用，把开发调试部署的效率提上去
- 阿里云函数计算、腾讯云函数、Vercel 三种上手方式的差别
- 四个完整案例，登录注册、Restful 内容管理 API、音视频处理、React 服务端渲染

先说一句时效性的话。这篇写于 2021 年 4 月，各家云厂商的控制台界面、免费额度和计费单价这几年都调整过好几轮。文里的截图和数字保留当时的样子，方便你对照着理解流程，真要动手掏钱之前请以官方文档和控制台的最新页面为准。

## 一、什么是 Serverless

理清 Serverless 要解决的问题其实很简单，把这个词从字面上拆开看就够了。Server 指服务端，它划定了 Serverless 解决问题的边界；less 可以理解成较少关心，这是它的目的。两个词组合在一起，就是「较少关心服务端」。

注意是较少关心，不是没有服务器。你的代码最后还是跑在实实在在的机器上，只不过这台机器的采购、扩容、打补丁、装监控，全都从你的工作清单里挪走了。这一点很关键，很多人第一次听到 Serverless 会以为是某种新的运行时黑科技，其实它更像是一次责任边界的重新划分。

顺着这个思路，Serverless 在业界一般有两种口径：

- 第一种：`狭义 Serverless`（最常见）= `Serverless computing 架构` = `FaaS 架构` = `Trigger（事件驱动）+ FaaS（函数即服务）+ BaaS`（后端即服务，持久化或第三方服务）= `FaaS + BaaS`
- 第二种：广义 `Serverless` = `服务端免运维` = `具备 Serverless 特性的云服务`

狭义那条是我们平时写代码时打交道最多的，也是这篇的主线。广义那条更像一种标准，比如对象存储 OSS、CDN、云数据库这些你从来不用管机器的产品，都算具备 Serverless 特性的云服务。BaaS 里的那些第三方服务，说的就是它们。

![Serverless 的两种定义与 FaaS BaaS 组成关系图](https://blog.poetries.top/img/static/images/20210416155216.png)

这张图把两条口径的关系画在了一起。你可以这么记：FaaS 负责放你的业务代码，BaaS 负责放你的状态，Trigger 负责把外面的事件送进来。三者凑齐，才是一个能跑的 Serverless 应用，光有 FaaS 是写不出完整业务的。

那什么时候值得上 Serverless？我自己的判断标准很粗暴，看两件事：请求量是不是明显有波峰波谷，以及这段逻辑能不能做成无状态。定时任务、图片视频处理、Webhook 回调、活动页接口、小程序后端，这几类基本都能对上。反过来，需要长连接、需要常驻内存缓存、单次执行动辄几十分钟的活儿，Serverless 目前并不划算。

## 二、编写你的第一个 Serverless 应用

各家 FaaS 平台的产品名不一样，AWS 叫 Lambda，阿里云叫函数计算，腾讯云叫云函数，但你真正要写的东西高度一致。挑平台之前先看下面这张横向对比，能省掉不少纠结。

![主流 FaaS 平台在语言、触发器和计费上的横向对比](https://blog.poetries.top/img/static/images/20210418151945.png)

图里的信息可以归成三条：

- FaaS 平台都支持 Node.js、Python 、Java 等编程语言；
- FaaS 平台都支持 HTTP 和定时触发器（这两个触发器最常用）。此外各厂商的 FaaS 支持与自己云产品相关的触发器，函数计算支持阿里云表格存储等触发器；
- FaaS 的计费都差不多，且每个月都提供一定的免费额度。其中 GB-s 是指函数每秒消耗的内存大小，比如1G-s 的含义就是函数以 1G 内存执行 1 秒钟。超出免费额度后，费用基本都是 0.0133元/万次，0.00003167元/GB-s。所以，用 FaaS 整体费用非常便宜，对一个小应用来说，几乎是免费的。

上面这两个单价是 2021 年当时的公开报价，写在这里是想让你对量级有个感觉，一万次调用一分多钱。这几年各家的计费模型陆续加了预留实例、按 CPU 计量等新维度，免费额度也调整过，实际花多少钱请以你所在区域的官方定价页为准。不过量级结论到现在还成立，个人项目和内部工具跑在 FaaS 上，基本就是免费。

选语言这块有个小建议。如果你的函数是给 HTTP 请求兜底的，也就是用户会在页面上等结果，优先选 Node.js，冷启动最快，后面讲生命周期时会说原因。如果是离线跑批、数据处理，语言就随意了。

**以阿里云函数为例**

```js
// logic.js
exports.sayHello = function (name) {
  return `Hello, ${name}!`;
}
```

这个文件里只有纯业务逻辑，一个 `name` 进去，一句问候出来，跟运行在哪儿完全无关。它在本地能用 Jest 直接测，也能原样搬到 Express 应用里。

```js
// index.js
const logic = require('./logic');
exports.handler = (request, response, context) => {
  // 从 request 中获取
  const { name } = request.queries;

  // 处理业务逻辑
  const message = logic.sayHello(name)

  // 设置 HTTP 响应
  response.setStatusCode(200);
  response.setHeader("Content-Type", "application/json");
  response.send(JSON.stringify({ message })); 
}
```

这段是入口函数，它只干三件事：从 `request` 里取参数、调 `logic.js` 拿结果、把结果按 HTTP 的格式写回 `response`。业务逻辑一行都没有。

把业务逻辑拆分到入口函数之外，这是写 FaaS 函数的第一条纪律。理由很实在，`handler` 的签名是平台定的，阿里云是 `(request, response, context)`，AWS 是 `(event, context, callback)`，你把逻辑写在里面，就等于把业务代码焊死在了某一家云上。逻辑在外面，换平台时只需要重写那十几行胶水代码。

### 触发器及事件对象

函数自己不会跑，得有东西把它叫醒，这个东西就是触发器。触发器决定了三件事：谁能叫醒这个函数、事件长什么样、以及函数的返回值最后去哪儿。下面三种是日常用得最多的。

1. HTTP 触发器

在众多 FaaS 平台中，函数计算直接提供了 HTTP 触发器，HTTP 触发器通过发送 HTTP 请求来触发函数执行，一般都会支持 POST、GET、PUT、HEAD 等方法。所以你可以用 HTTP 触发器来构建 Restful 接口或 Web 系统。

![HTTP 触发器把 HTTP 请求转成事件并调用函数的流程](https://blog.poetries.top/img/static/images/20210418152334.png)

HTTP 触发器会根据 HTTP 请求和请求参数生成事件，然后以参数形式传递给函数。那么 HTTP 触发器的入口函数参数中的 request 和 response 参数具体有哪些属性呢？

其实 request 和 response 参数跟 Express.js 框架里那两个对象很像，`request.queries` 取查询串，`request.headers` 取请求头，`response.setStatusCode()`、`response.setHeader()`、`response.send()` 写响应。所以上手几乎没有学习成本，后面案例里用 `@webserverless/fc-express` 直接把它们转成 Express 的 `req` 和 `res`，也正是因为这层相似。

2. API 网关触发器

API 网关触发器与 HTTP 触发器类似，它主要用于构建 Web 系统。区别在于中间多了一层 API 网关来接收 HTTP 请求，然后再产生事件，将事件传递给 FaaS。FaaS 将函数执行完毕后将函数返回值传递给 API 网关，API 网关再将返回值包装为 HTTP 响应返回给用户。

![API 网关触发器接收请求并转发给 FaaS 的调用链路](https://blog.poetries.top/img/static/images/20210418152415.png)

多这一层网关值不值？看你要不要那些附加能力。参数校验、路径参数、IP 黑白名单、限流、鉴权、自定义域名和证书，这些网关都能做，函数里就不用写了。后面第六节那个内容管理系统就是走 API 网关的，因为它有 `/article/detail/[article_id]` 这种带路径参数的路由，用 HTTP 触发器自己解析会很啰嗦。反过来，如果只是一个孤零零的回调接口，HTTP 触发器更省事，也少一份网关的钱。

3. 定时触发器

定时触发器就是定时执行函数，它经常用来做一些周期任务，比如每天定时查询天气并给自己发送通知、每小时定时处理分析日志等等。

![定时触发器按 Cron 表达式周期性调用函数](https://blog.poetries.top/img/static/images/20210418152436.png)

定时触发器是我认为最容易被低估的一个。以前想跑个定时任务，要么开台机器写 crontab，要么在业务服务里塞个 node-schedule，前者浪费机器，后者一旦服务多实例部署就会重复执行。定时触发器这两个坑都没有，配置一个 Cron 表达式就完事，平台保证同一时刻只触发一次。

这里有个坑要注意，定时触发器是异步调用的，函数抛错了外面没人接。所以定时函数里一定要自己 try/catch 并把失败结果记下来，否则任务默默失败你根本不知道。

### 日志输出

无论你用什么编程语言开发 Serverless 应用，都要在合适的时候输出合适的日志信息，方便调试应用、排查问题。在 Serverless 中，日志输出和传统应用的日志输出没有太大区别，只是日志的存储和查询方式变了。

变在哪儿？传统应用你可以 ssh 上机器 `tail -f` 看日志文件，函数没有这个机会。函数实例执行完就可能被销毁，本地磁盘上的东西跟着一起没，所以日志必须实时打到外部的日志服务里。这也是为什么很多人第一次写函数会觉得「怎么调试这么难」，其实是习惯还停在有机器可登的年代。

以函数计算为例，如果你在控制台创建函数，则函数计算默认会使用日志服务来为你存储日志。在「日志查询」标签下可以查看函数调用日志。日志服务是一个日志采集、分析产品，所以如果你要实现业务监控，则可以将日志输出到日志服务，然后在日志服务中对日志进行分析，并设置报警项。

![函数计算控制台的日志查询标签页](https://blog.poetries.top/img/static/images/20210418152600.png)

实践中我习惯在每个函数入口打一行结构化日志，把 `requestId`、入参摘要、耗时都记上。函数是分散的，出问题时没有一条完整的调用栈可看，`requestId` 就是你把几个函数的日志串起来的唯一线索。

## 三、Serverless 应用是怎么运行的

Serverless 应用是由一个个 FaaS 函数组成的，每一次运行其实就是单个或多个函数的运行。所以搞懂 `Serverless 的运行原理，等于搞懂函数的运行原理`。

这一节可能是全篇最值得花时间的部分。你不理解函数怎么被拉起来，就没法解释线上那些「为什么第一次请求特别慢」「为什么全局变量有时候还在有时候没了」的怪现象。

**FaaS 是怎么运行的**

![FaaS 平台接收事件并调度函数实例的整体流程](https://blog.poetries.top/img/static/images/20210416155334.png)

![FaaS 与传统服务端架构的职责对比](https://blog.poetries.top/img/static/images/20210416155401.png)

上面两张图放在一起看更清楚。第一张是 FaaS 内部的调度流程，第二张是把 FaaS 和传统服务端的职责摆在一起对照，你会发现负载均衡、进程守护、扩缩容这些原来要你操心的环节，在 FaaS 这一侧全被平台吃掉了。

### 函数调用链路：事件驱动函数执行

对于 FaaS 函数来说，一方面可以通过事件来触发执行，另一方面也可以直接调用 API 来执行。FaaS 平台都提供了执行函数的 API。

![函数的两条调用链路，事件触发与 API 直接调用](https://blog.poetries.top/img/static/images/20210418151354.png)

图里这两条链路对应两种典型用法。事件触发是常态，HTTP 请求、OSS 上传、定时器都走这条。API 直接调用则更多出现在服务之间的编排里，比如你有个主函数，跑到一半要把重活儿甩给另一个内存配置更大的函数去做。

这里还要分清同步调用和异步调用。同步调用会一直等着函数返回结果，HTTP 触发器就是同步的；异步调用是把事件丢进队列就返回，定时触发器和 OSS 触发器默认都是异步的。异步的那部分，函数执行成功还是失败，调用方是不知道的，必须自己在函数里落日志或者配置异步调用的目标队列，否则任务丢了都没人告诉你。

### 函数生命周期：冷启动与热启动

FaaS 中的冷启动是指从调用函数开始到函数实例准备完成的整个过程。冷启动我们关注的是启动时间，启动时间越短，我们对资源的利用率就越高。现在的云服务商，基于不同的语言特性，冷启动平均耗时基本在 `100～700 毫秒`之间。得益于 Google 的 JavaScript 引擎 Just In Time 特性，Node.js 在冷启动方面速度是最快的。

![不同语言运行时的冷启动耗时对比](https://blog.poetries.top/img/static/images/20210416155824.png)

这张图解释了前面那句「HTTP 场景优先选 Node.js」。Java 那类需要起 JVM、扫描类路径的运行时，冷启动天然要慢一大截，用户在页面上是等得到的。

注意，FaaS 服务从 0 开始，启动并执行完一个 Node.js 函数，只需要 100 毫秒左右。这也是为什么 FaaS 敢缩容到 0 的主要原因。通常我们打开一个网页有个关键指标，响应时间在 1 秒以内都算优秀。这么一对比，100 毫秒的启动时间，对于网页的秒开率影响真的极小。

那这 100 毫秒里到底发生了什么？

在 FaaS 平台中，函数默认是不运行的，也不会分配任何资源，甚至 FaaS 中都不会保存函数代码。只有当 FaaS 接收到触发器的事件后，才会启动并运行函数。整个函数的运行过程可以分为四个阶段。

![函数运行的四个阶段，下载代码、启动容器、初始化运行环境、执行代码](https://blog.poetries.top/img/static/images/20210418151433.png)

- 下载代码： FaaS 平台本身不会存储代码，而是将代码放在对象存储中，需要执行函数的时候，再从对象存储中将函数代码下载下来并解压，因此 FaaS 平台一般都会对代码包的大小进行限制，通常代码包不能超过 50MB。
- 启动容器： 代码下载完成后，FaaS 会根据函数的配置，启动对应容器，FaaS 使用容器进行资源隔离。
- 初始化运行环境： 分析代码依赖、执行用户初始化逻辑、初始化入口函数之外的代码等。
- 运行代码： 调用入口函数执行代码。

当函数第一次执行时，会经过完整的四个步骤，前三个过程统称为「冷启动」，最后一步称为「热启动」。

第一条里那个 50MB 的限制值得单独说一句，它直接决定了你的依赖能带多少。`node_modules` 里塞几个大包很容易就顶到上限，所以后面音视频那个案例才要用 ncc 把代码打成单文件，把 FFmpeg 这种大依赖单独处理。这个数字各家和各时期不完全一样，动手前查一下当前区域的配额说明。

整个冷启动流程耗时可能达到百毫秒级别。函数运行完毕后，运行环境会保留一段时间，可能 2 ~ 5 分钟，这和具体云厂商有关。如果这段时间内函数需要再次执行，则 FaaS 平台就会使用上一次的运行环境，这就是「执行上下文重用」，函数的这个启动过程也叫「热启动」。热启动的耗时就完全是执行函数本身的耗时了。当一段时间内没有请求时，函数运行环境就会被释放，直到下一次事件到来，再重新从冷启动开始初始化。

执行上下文重用这件事，是把双刃剑。好的一面是你可以把数据库连接、SDK 客户端这类初始化开销大的东西写在入口函数外面，热启动时直接复用，省下几十毫秒。坏的一面是，写在函数外面的变量会跨请求残留，你要是图省事在那儿缓存了当前用户的信息，下一个用户的请求撞进同一个实例，就直接串号了。这个我踩过，现象非常玄学，本地怎么都复现不出来。

一句话记住就行：函数外面只放无状态的东西。

下面是一个函数的请求示意图，其中「请求1」「请求3」是冷启动，「请求2」是热启动。

![函数请求时序图，冷启动与热启动的分布](https://blog.poetries.top/img/static/images/20210418151527.png)

函数执行完毕后销毁运行环境，虽然对首次函数执行的性能有损耗，但极大提高了资源利用效率，只有需要执行代码的时候才初始化环境、消耗硬件资源。并且如果你的应用请求量比较大，那大部分时候函数的执行可能都是热启动。

反过来讲，最难受的恰恰是那种不温不火的应用，每隔几分钟来一个请求，每次都刚好赶上实例被回收，于是次次冷启动。真遇到这种情况，业界的常规解法是配一个定时触发器每隔几分钟打一次心跳把实例焐热，或者直接买平台的预留实例。前者省钱但不保证，后者稳但就失去了缩容到 0 的成本优势，自己权衡。

### FaaS 是怎么分层的

冷启动那四步为什么能压到百毫秒，光看流程图还不够，得再往下看一层结构。

![FaaS 实例的三层结构，容器、Runtime、函数代码](https://files.mdnice.com/user/6541/5d7d3769-4fc0-4036-bd1b-91e9a650c2c3.png)

你的 FaaS 实例执行时，就如上图所示，至少是 3 层结构：容器、运行时 Runtime、具体函数代码。

容器你可以理解为操作系统 OS。代码要运行，总需要和硬件打交道，容器就是模拟出内核和硬件信息，让你的代码和 Runtime 可以在里面运行。容器的信息包括内存大小、OS 版本、CPU 信息、环境变量等等。目前的 FaaS 实现方案中，容器方案可能是 Docker 容器、VM 虚拟机，甚至 Sandbox 沙盒环境。运行时 Runtime，就是你的函数执行时的上下文 context。Runtime 的信息包括代码运行的语言和版本，例如 Node.js v10，Python3.6；可调用对象，例如 aliyun SDK；系统信息，例如环境变量等等。

这样分层有什么好处呢？容器层适用性更广，云服务商可以预热大量的容器实例，将物理服务器的计算资源碎片化。Runtime 的实例适用性较低，可以少量预热；容器和 Runtime 固定后，下载你的代码就可以执行了。通过分层，云厂商可以做到资源统筹优化，这样就能让你的代码快速低成本地被执行。

理解了分层，我们再回想一下这三层分别对应冷启动的哪一步，你就不难看出云服务商负责的就是容器和 Runtime 的准备阶段，而开发者自己负责的则是函数执行阶段。一旦容器和 Runtime 启动后，就会维持一段时间，这段时间内的这个函数实例就可以直接处理用户数据请求。当一段时间内没有用户请求事件发生（各个云服务商维持实例的时间和策略不同），则会销毁这个函数实例。

![纯 FaaS 应用与传统服务端运维环节的对应关系](https://blog.poetries.top/img/static/images/20210416160251.png)

这张图把这一节的结论收在了一起：

- 纯 FaaS 应用调用链路由函数触发器、函数服务和函数代码三部分组成，它们分别替代了传统服务端运维的负载均衡 & 反向代理，服务器 & 应用运行环境，应用代码部署
- 对比传统应用托管 PaaS 平台，FaaS 应用最大的不同就是，FaaS 应用可以缩容到 0，在事件到来时极速启动，Node.js 的函数甚至可以做到 100ms 启动并执行。
- FaaS 在设计上牺牲了用户的可控性和应用场景，来简化代码模型，并且通过分层结构进一步提升资源的利用率，这也是为什么 FaaS 冷启动时间能这么短的主要原因。关于 FaaS 的 3 层结构，你可以这么想象：容器层就像是 Windows 操作系统；Runtime 就像是 Windows 里面的播放器暴风影音；你的代码就像是放在 U 盘里的电影

最后那个比喻我觉得挺贴切。播放器和系统云厂商可以提前装好一堆，你只要把 U 盘插上去就能放，快就快在这儿。

### 这一节的三个要点

- 组成 Serverless 应用的函数是事件驱动的，但你也可以直接用 API 调用函数；
- 函数可以同步调用或异步调用，定时触发器函数是异步调用的，异步调用函数建议主动记录并处理异步调用结果；
- 函数的启动过程分为下载代码、启动容器、启动运行环境、执行代码四个步骤，前三个步骤称为冷启动，最后一个步骤称为热启动

## 四、如何提高应用开发调试和部署效率

前面都是在控制台点点点，玩玩可以，真做项目撑不住。一个应用十几个函数，每个都去网页上改代码、配触发器，改完还没法进版本库，出了事连回滚都没得回。这一节说的就是怎么把这套东西落回到代码仓库里。

### 应用管理

Serverless 应用是由函数组成的，所以应用的管理主要就是函数的管理。各个 FaaS 平台其实也考虑到了这一点，比如函数计算的「服务」功能或 Lambda 的「应用」功能。你可以把一个应用的函数都创建在同一个「服务」下，一个「服务」即代表一个应用。

![函数计算控制台里服务与函数的层级关系](https://blog.poetries.top/img/static/images/20210418152848.png)

服务这一层不只是个文件夹。日志配置、RAM 角色、VPC 网络这些东西都是挂在服务上的，服务下面的所有函数共享同一套。所以划分服务的时候，除了按应用分，也要顺带考虑权限边界，权限差别大的函数别硬塞进同一个服务。

那么如何去描述服务和函数的关系呢？因为二者是静态的，不会在代码运行时改变，所以你可以用 YAML 或 JSON 配置文件来表示（我推荐 YAML，因为它可以编写注释，可读性更好）。在创建函数时，你还要指定函数的入口、编程语言、触发器等信息。所以 YAML 文件的内容可能是这样的：

```bash
# serverless.yaml
# 应用名称
service: myservice
# 函数列表
functions:
    # 函数1
  hello:
    handler: hello.main # 函数入口
    runtime: nodejs12
    events: # 函数触发器，一个函数可能有多个触发器
        - http
        - timer
  # 函数2
  goodbye:
    handler: goodbye.main
    runtime: nodejs12
    events:
        - http
```

这份文件读下来其实很直白，`service` 是应用名，`functions` 下面每一项是一个函数，`handler` 指向代码入口，`events` 列出这个函数挂了哪些触发器。一个函数挂多个触发器是常事，比如上面的 `hello` 既能被 HTTP 请求打到，也会被定时器周期性叫醒。

把这份 YAML 提交进 Git，你就拿回了两样在控制台上永远拿不到的东西，代码评审和版本回滚。这也是我强烈建议一开始就别在控制台改代码的原因，控制台适合用来看日志和临时验证，不适合当生产环境的编辑器。

### 应用开发

有了应用配置文件之后，开发者就可以开始开发代码了。为了进一步简化用户操作，平台方还会提供一些代码模板，配上 init 命令让开发者基于模板一键生成一个 Serverless 应用。例如

```
$ serverless init --template hello-world
|-- hello.js
|-- serverless.yaml
```

生成出来的骨架非常干净，一个业务文件加一份配置：

```bash
# serverless.yaml
service: myservice
functions:
  hello:
    handler: hello.main
    events:
        - http
```

至于本地调试，各家都有对应的 CLI，阿里云是 Funcraft（`fun`），AWS 是 SAM CLI，Serverless Framework 则是跨云的那一套。它们的思路一致，用 Docker 在本地模拟一个跟线上尽量接近的运行时，让你不用每改一行就 deploy 一次。这块能省的时间非常可观，值得在项目一开始就配好。

## 五、几种上手 Serverless 的方式

概念讲完了，接下来看看实际动手时有哪些入口。国内两家云的函数计算适合做正经后端，Vercel 更适合前端同学快速把项目挂上去，三种我都用过，各有各的舒服。

### 阿里云函数计算

> https://fc.console.aliyun.com/fc/overview

控制台里直接选一个模板，就能跑起来一个能访问的函数，几分钟的事。

![阿里云函数计算控制台的模板选择页面](https://files.mdnice.com/user/6541/d63653ac-0a1d-4dfa-9a2a-879f23aa803e.png)

> 云函数使用指南 https://help.aliyun.com/product/50980.html

后面第六节的四个案例全部基于函数计算，因为它的 HTTP 触发器、API 网关、表格存储这套组合在国内是最顺的，文档也全。

### 腾讯云函数

![腾讯云云函数控制台的函数列表页](https://blog.poetries.top/img/static/images/20210416161014.png)

> 云函数使用指南 https://cloud.tencent.com/document/product/876/41762

腾讯云这边的路子差不多，如果你的项目本来就跑在腾讯云生态里，尤其是做微信小程序，用它更顺，因为可以直接跟云开发打通。小程序那条线我在另一篇里单独写过，可以对照着看 [微信小程序 Serverless 云开发实践](https://feinterview.poetries.top/blog/serverless-cloud-weapp)。

### 使用 vercel 部署你的应用（推荐）

Vercel 是我用过最省事的网站托管服务，可以在上面部署 API、静态页面等。它和 GitHub 深度绑定，推送代码之后 Vercel 会自动检测并部署。

严格来说 Vercel 属于前面说的广义 Serverless，你不需要写 `handler`，直接扔一个 Next.js 或者纯静态项目上去就行，它的 Serverless Functions 藏在 `api/` 目录后面。对前端同学来说，这是心理门槛最低的一条路。

**新建项目**

![Vercel 新建项目入口](https://blog.poetries.top/img/static/images/20210416161535.png)

导入 GitHub 上的某一个项目进行部署。

![在 Vercel 中导入 GitHub 仓库](https://blog.poetries.top/img/static/images/20210416161621.png)

![选择要导入的 GitHub 项目](https://blog.poetries.top/img/static/images/20210416161653.png)

![配置项目的构建命令与输出目录](https://blog.poetries.top/img/static/images/20210416161728.png)

![Vercel 部署进行中的构建日志](https://blog.poetries.top/img/static/images/20210416161748.png)

这几步基本是一路下一步，唯一需要留意的是构建命令和输出目录那一屏。Vercel 对主流框架有预设，识别不出来的项目才需要你手动填 `build` 命令和产物目录。

部署完成后，可以在控制面板看到，Vercel 每次部署都会动态生成一个地址，可以直接访问你的应用。

![Vercel 控制面板中每次部署生成的独立预览地址](https://blog.poetries.top/img/static/images/20210416161906.png)

每次部署一个独立地址这个设计是真的舒服。你可以把这个预览链接直接甩给同事看效果，不用抢测试环境，也不怕覆盖别人的东西。

**绑定 GitHub 应用**

![在 Vercel 中授权并绑定 GitHub 应用](https://blog.poetries.top/img/static/images/20210416162735.png)

绑定之后，每次提交代码到 GitHub，Vercel 都会自动帮我们构建发布。

![提交代码后 Vercel 自动触发的构建记录](https://blog.poetries.top/img/static/images/20210416162612.png)

**绑定域名**

我们可以绑定自己的自定义域名。

![Vercel 的自定义域名绑定界面](https://blog.poetries.top/img/static/images/20210416162045.png)

绑定域名这一步会自动签发证书，HTTPS 不用你操心。有个现实问题得提一句，Vercel 的默认域名和部分节点在国内访问不太稳定，做面向国内用户的正式项目还是建议走国内云厂商，Vercel 更适合放个人项目、文档站和演示环境。

> 我们还可以使用 Vercel 部署 Node 小型应用，非常方便。更多参考文档 https://vercel.com/docs

另外提醒一句，上面这些控制台截图都是 2021 年的界面，阿里云、腾讯云和 Vercel 这几年都改过版，按钮位置和文案跟现在对不上很正常。流程本身没变，照着理解步骤就行。


## 六、场景案例

下面四个案例是这篇的重头戏，从简单到复杂依次是登录注册、Restful 内容管理 API、音视频处理、React 服务端渲染。它们覆盖了 Serverless 最常见的几类活儿，也依次暴露了几个绕不开的问题：无状态怎么做登录、多函数怎么组织、二进制依赖怎么带上去、SSR 怎么部署。

代码都基于阿里云函数计算，但换成腾讯云或 Lambda，改动主要集中在 `handler` 签名和 YAML 描述文件上，业务逻辑那部分可以直接搬。

### 1 使用 Serverless 实现登录注册功能

登录注册看着简单，放到 Serverless 里第一个问题就来了：函数是无状态的，实例随时会被销毁，Session 往哪儿放？先把两种主流方案摆清楚，再动手写。

#### 1.1 身份认证的技术方案

**Cookie-Session**

Cookie-Session 方式是早期最常用的身份认证方式，直到现在很多 Web 网站依然使用这种方式。其认证流程是

- 用户在浏览器中输入账号密码登录；
- 服务端验证通过后，将用户信息保存在 Session 中并生成一个 Session ID；
- 然后服务端将 Session ID 放在 HTTP 响应头的 cookie 字段中；
- 浏览器收到 HTTP 响应后，将 cookie 保存在浏览器中，cookie 内容就是之前登录时生成的 Session ID；
- 用户再访问网站时，浏览器请求头就会自动带上 cookie 信息；
- 服务端接收到请求后，从 cookie 获取到 Session ID，然后根据 Session ID 解析出用户信息。

![Cookie-Session 早期方案的认证流程图](https://blog.poetries.top/img/static/images/20210418165707.png)

**这种方案存在两个主要问题：**

- 服务端的 Session ID 是直接存储在内存中的，在分布式系统中无法共享登录状态；
- cookie 是浏览器的功能，手机 App 等客户端并不支持 cookie，所以该方案不适用于非浏览器的应用。

第一个问题也是 Cookie-Session 方案应用于 Serverless 架构的主要问题。Serverless 应用是无状态的，内存中的数据用完即销毁，多个请求之间没法共享 Session。上一节讲执行上下文重用的时候我提过一句「函数外面只放无状态的东西」，Session 就是最典型的反面教材，你把它放在函数外的变量里，热启动时看着好像能用，实例一销毁全部丢失，表现出来就是用户莫名其妙被踢下线。

解决该问题也比较容易，用一个共享存储来保存 Session 信息，最常见的就是 Redis，因为 Redis 是内存数据库，读写速度很快。

于是 Cookie-Session 的身份认证方案就发生了变化：

![引入 Redis 共享存储后的 Cookie-Session 认证流程](https://blog.poetries.top/img/static/images/20210418165751.png)

与早期方案不同，用户登录时，该方案会把用户信息保存在 Redis 中，而不是内存中，然后服务端依然会将 Session ID 返回给浏览器，浏览器将其保存在 cookie 中。而之后非登录的请求，浏览器依然会将包含 Session ID 的 cookie 放在请求头中发送给服务端，服务端拿到 Session ID 后，从 Redis 中查询出用户信息。这样就可以解决分布式、无状态的系统中用户登录状态共享的问题。

代价也很明显，你得额外买一个 Redis，而且每次鉴权都多一次网络往返。对一个跑在 FaaS 上、目标就是低成本的小应用来说，为了存 Session 单独挂个 Redis 实例，成本结构一下就变味了。

不过这个方案依旧无法解决非浏览器场景的身份认证问题，所以 JWT 方案诞生了。

**JWT**

JWT 是 JSON Web Token 的简称，其原理是：

- 服务端认证通过后，根据用户信息生成一个 token 返回给客户端；
- 客户端将 token 存储在 cookie 或 localStorage 中；
- 之后客户端每次请求都需要带上 token，通常是将 token 放在 HTTP 请求头的 Authorization 字段中；
- 服务端接收到 token 后，验证 token 的合法性，并从 token 中解析出用户信息。

![JWT 认证流程，服务端签发 token 客户端携带 token](https://blog.poetries.top/img/static/images/20210418165833.png)

对比一下就明白 JWT 为什么和 Serverless 这么搭。Cookie-Session 是「服务端记着你是谁」，JWT 是「你自己带着凭证来，服务端每次验一下签名」。后者服务端完全不需要存储，函数实例随便销毁重建都不影响，这正是 FaaS 想要的。

token 是个比较长的字符串，格式为 `Header.Payload.Signature`，由`.`分隔为三部分。下面是一个实际的 token 示例：

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJqYWNrIiwiaWF0IjoxNjEwODg1MTcxfQ.KIduc-undaZ0z-Bt4wjGZIK5fMlx1auVHl_G1DvGDCw
```

可能有同学会担忧，token 是根据用户信息生成的，这样会不会泄露用户信息呢？这里必须澄清一个很常见的误解：JWT 默认是签名，不是加密。Header 和 Payload 只是做了 Base64URL 编码，任何人拿到 token，粘到 [jwt.io](https://jwt.io) 上或者随手 `atob` 一下，都能看到里面的明文内容。签名保证的是这段内容没被篡改，不是保证别人看不见。

所以规矩就一条，Payload 里只放非敏感的标识信息，比如用户 ID、用户名、角色，绝对不要放手机号、身份证、密码这类东西。后面那段登录代码里有个 `user.password = '******'` 的处理，就是在做这件事，把密码抹掉再签发。真需要内容不可见，得用 JWE 那一套，那是另一个话题了。

另外记得给 token 设过期时间。`jwt.sign()` 的第三个参数可以传 `{ expiresIn: '2h' }`，不设的话签出来的 token 永久有效，一旦泄露就再也收不回来。

基于 JWT，客户端可以使用自己特有的存储来保存 token，不依赖 cookie，所以 JWT 可以适用于任意客户端。并且使用 JWT 进行身份认证，服务端就不用存储用户信息了，这样服务端就是无状态的。因此 JWT 这种身份认证方案，也非常适合 Serverless 应用。

接下来就基于 JWT，从 0 到 1 实现一个登录注册应用。

#### 1.2 从 0 到 1 实现一个登录注册应用

**应用初始化**

首先安装 `express`、`body-parser` 和 `@webserverless/fc-express` 等依赖：

```
$ npm i express body-parser @webserverless/fc-express -S
```

`@webserverless/fc-express` 的作用是把函数计算的 HTTP 或 API 网关触发器参数转换成 Express.js 框架的参数，这样你就可以很方便地在函数计算里用 Express.js 了。

为什么要绕这一道？因为一个函数只有一个 `handler` 入口，而登录注册至少要三四个路由。你可以选择每个路由拆一个函数，也可以像这里一样，把整个 Express 应用塞进一个函数里，让 Express 自己做路由分发。前者更符合 FaaS 的理念，粒度细、按需伸缩；后者上手快、能直接复用现成的 Express 中间件生态。这个案例走后者，下一个案例走前者，你可以对照着体会差别。

然后我们初始化一个 template.yaml 模板，该模板定义了 auth-app 这个函数，函数触发器为 HTTP 触发器，支持 GET 和 POST 请求：

```
ROSTemplateFormatVersion: '2015-09-01'
Transform: 'Aliyun::Serverless-2018-04-03'
Resources:
  serverless:
    Type: 'Aliyun::Serverless::Service'
    Properties:
      Description: 'Serverless Authorization App'
    auth-app:
      Type: 'Aliyun::Serverless::Function'
      Properties:
        Handler: index.handler
        Runtime: nodejs12
        CodeUri: './'
        Timeout: 10
      Events:
        httpTrigger:
          Type: HTTP
          Properties:
            AuthType: ANONYMOUS
            Methods: ['POST', 'GET']
```

配置里有两个值得留意的点。`AuthType: ANONYMOUS` 表示这个 HTTP 触发器不做平台层的签名鉴权，谁都能直接访问，鉴权完全交给我们自己的 JWT 逻辑，做公开 API 时就得这么配。`Timeout: 10` 是函数的最长执行时间，单位秒，超时会被平台强行掐断，登录注册这种轻量接口 10 秒绰绰有余，后面音视频那个案例就得调到 600。

接下来在 index.js 中编写初始化代码，如下所示：

```js 
const proxy = require('@webserverless/fc-express')
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));

// 定义 / 路由，返回 Hello Serverless!
app.get('/', (req, res) => {
    res.json({
        success: true,
        data: 'Hello Serverless!',
    });
});


const server = new proxy.Server(app);
module.exports.handler = function (req, res, context) {
    // 使用 @webserverless/fc-express 来将函数计算的请求转发给 Express.js 应用
    // @webserverless/fc-express 可以将函数参数转换为 Express.js 的路由参数
    server.httpProxy(req, res, context);
};
```

**这段代码主要实现两个功能：**

- 定义了 `/`  路由，该路由返回了 `Hello Serverless!` 字符串，我们之后可以用它来测试代码是否正常运行；
- 使用 `@webserverless/fc-express` 将函数计算的请求转发给 Express.js 应用，它会把函数参数转换成 Express.js 的路由参数。

注意 `const server = new proxy.Server(app)` 这一行的位置，它在入口函数外面。这就是前面说的执行上下文重用的正确用法，Express 应用的初始化只在冷启动时做一次，后续热启动的请求直接复用同一个 `server` 实例，省掉了重复建路由表的开销。

然后通过 `fun deploy` 部署应用：

```bash
# 部署应用
$ fun deploy -y
Waiting for service serverless to be deployed...
        Waiting for function auth-app to be deployed...
                Waiting for packaging function auth-app code...
                The function auth-app has been packaged. A total of 419 files were compressed and the final size was 724.49 KB
                Waiting for HTTP trigger httpTrigger to be deployed...
                triggerName: httpTrigger
                methods: [ 'POST', 'GET' ]
                url: https://1457216987974698.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/serverless/auth-app/
                trigger httpTrigger deploy success
        function auth-app deploy success
service serverless deploy success
$ curl https://1457216987974698.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/serverless/auth-app/
{"success":true,"data":"Hello Serverless!"}
```

部署日志里那行 `url: https://1457216987974698.cn-shanghai.fc.aliyuncs.com/...` 就是函数计算分配的测试 Endpoint，格式是`域名/版本/proxy/服务名/函数名/`。拿到它就可以用 curl 验证应用有没有正常跑起来：

```
$ curl https://1457216987974698.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/serverless/auth-app/
{"success":true,"data":"Hello Serverless!"}
```

这个默认域名是有调用频次限制的，只适合联调，正式对外要在控制台绑自定义域名。

#### 1.3 实现注册功能

注册的逻辑很直白，先拿到用户输入的用户名和密码，判断用户是否已存在，不存在就写进数据库。

这里我们使用的数据库是表格存储。可能你用得比较多的是 MySQL，之所以选表格存储，是因为它可以直接通过 Restful API 读写，并且弹性可扩展，更适合 Serverless 应用。

这个选型理由值得展开一句。MySQL 这类关系型数据库是长连接模型，客户端要维护连接池，而函数实例是随起随灭的，成百上千个实例同时冷启动，每个都去建连接，很容易把数据库的最大连接数打满。表格存储走 HTTP 请求，一次调用一个请求，天然没有连接池的问题。这是 Serverless 场景选数据库时最需要考虑的一点，不是性能，是连接模型。

使用表格存储时，你要先创建一个表格存储实例，然后创建一个 user 表。这里也提供了一个创建 user 表的脚本：[create-table](https://github.com/nodejh/serverless-class/tree/master/15/create-table)。

接下来继续编写代码。由于要使用表格存储，所以首先需要安装 tablestore 依赖，然后在 index.js 中初始化表格存储 client：

```bash
# 安装 tablestore 依赖
# tablestore 封装了表格存储的 API
$ npm i tablestore -S
```

```js
// index.js
// ...
const TableStore = require('tablestore');

// 初始化 TableStore client
const client = new TableStore.Client({
  accessKeyId: '<your access key>',
  accessKeySecret: 'your access secret',
  endpoint: 'https://serverless-app.cn-shanghai.ots.aliyuncs.com',
  instancename: 'serverless-app',
});
```

这里的 `accessKeyId` 和 `accessKeySecret` 是硬编码的，教学代码这么写图省事，真项目里千万别这么干。正确做法是在函数的环境变量里配，或者更进一步，给函数绑一个 RAM 角色，用 `context.credentials` 拿临时凭证，后面音视频那个案例用的就是这种方式。代码里出现长期密钥，一旦仓库泄露就是事故。

client 同样建在入口函数外面，理由和前面的 Express 实例一样，让它跨请求复用。

现在我们就可以定义一个路由来处理用户的注册请求了。代码如下所示，先根据 name 从表格存储中查询用户信息，如果用户已存在就直接返回，不存在则将用户信息写入表格存储。

```js 
// 定义 /register 路由，处理注册请求
app.post('/register', async (req, res) => {
  // 从请求体中获取用户信息
  const name = req.body.name;
  const password = req.body.password;
  const age = req.body.age;
  // 判断用户是否已经存在
  const { row } = await client.getRow({
    tableName: "user",
    primaryKey: [{
      name
    }]
  });
  if (row.primaryKey) {
    // 如果用户已存在，则直接返回
    return res.json({
      success: false,
      message: '用户已存在'
    });
  }
  // 创建用户，将用户信息写入到表格存储中
  await client.putRow({
    tableName: "user",
    condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_NOT_EXIST, null),
    primaryKey: [{
      name
    }],
    attributeColumns: [{
      password
    }, {
      age
    }]
  });
  // 返回创建成功
  return res.send({
    success: true,
  });
});
```

这段代码里 `putRow` 的 `condition` 值得说一句。`RowExistenceExpectation.EXPECT_NOT_EXIST` 是表格存储的行存在性条件，意思是「只有这行不存在时才写入」。它跟前面那次 `getRow` 检查是两道锁，因为 `getRow` 和 `putRow` 之间存在时间差，两个并发的注册请求可能同时通过了检查，最后靠这个条件在服务端把重复写入挡掉。多实例并发是 Serverless 的常态，这种地方不能只靠应用层判断。

至此注册功能就完成了，你可以将代码部署到函数计算上，像下面这样通过 curl 命令来模拟用户请求，验证功能是否正常：

```bash 
$ curl https://1457216987974698.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/serverless/auth-app/register \
-d "name=jack&password=123456&age=18" \
-X POST
{"success":true}

$ curl https://1457216987974698.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/serverless/auth-app/register \
-d "name=jack&password=123456&age=18" \
-X POST
{"success":false,"message":"用户已存在"}
```

连续执行两次，第二次返回「用户已存在」，说明查重逻辑生效了。

还有一点这份教学代码没做，但真上线必须做：密码是明文存进数据库的。生产环境应该用 `bcrypt` 之类的库加盐哈希后再存，比对时用 `bcrypt.compare()`。这段代码为了突出 Serverless 的主线省略了，你照抄的时候记得补上。

注册功能完成后，就可以继续实现登录功能了。

#### 1.4 实现登录功能

登录就是验证用户输入的用户名密码是否正确。

先根据用户输入的 name 从表格存储中查询出用户信息，然后比对用户密码与数据库中的密码是否一致，一致则登录成功，否则失败。登录成功后，还需要根据用户信息生成一个 token 返回给用户。具体怎么实现呢？

前面提到，Serverless 中最通用的身份认证方案是 JWT，所以首先需要安装 Node.js 中的 JWT 依赖包 jsonwebtoken：

```
$ npm install jsonwebtoken -S
```

然后在代码中引入 jsonwebtoken，并定义 SECRET。SECRET 是用来签发和校验 token 的密钥，非常重要，绝不能泄露。同样，示例里写成常量是为了看着方便，真项目请放环境变量或者密钥管理服务。

接下来在代码中定义 `/login` 路由来处理用户请求。这段代码先验证用户密码是否正确，密码正确后再用 `jwt.sign()` 方法根据用户信息生成 token，最后把 token 返回给客户端。客户端需要把 token 保存下来，之后每次请求都带上它进行身份认证。

```js 
// index.js
// ...
const jwt = require('jsonwebtoken')
// 设置密钥，非常重要，不能泄露
const SECRET = 'token_secret_xd2dasf19df='
// ...
// 定义 /login 路由，用来实现登录功能
app.post('/login', async (req, res) => {
  // 从请求体中获取用户名和密码
  const name = req.body.name;
  const password = req.body.password;
  // 根据用户名查询用户信息
  const {
    row
  } = await client.getRow({
    tableName: 'user',
    primaryKey: [{
      name
    }]
  })
  // 如果查询结果为空，则直接返回用户不存在
  if (!row.primaryKey) {
    return res.json({
      success: false,
      message: '用户不存在'
    })
  }
  // 从查询结果中构造用户信息
  const user = {
    name
  };
  row.attributes.forEach(item => user[item.columnName] = item.columnValue);
  // 判断密码是否正确
  if (password !== user.password) {
    return res.json({
      success: false,
      message: '密码错误'
    })
  }
  user.password = '******';
  /**
   * 生成 token
   * jwt.sign() 接受两个参数，一个是传入的对象，一个是自定义的密钥
   */
  const token = jwt.sign(user, SECRET)
  return res.json({
    success: true,
    data: { token }
  })
});
```

留意 `user.password = '******'` 那一行，签发前先把密码字段抹掉。前面说过 JWT 的 Payload 是明文可读的，这一步不做，你的用户密码就跟着 token 满世界跑了。

代码编写完成后，部署到函数计算并进行测试，如下所示：

```bash
curl https://1457216987974698.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/serverless/auth-app/login \
-d "name=jack&password=123456" \ 
-X POST
{"success":true,"data":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiamFjayIsImFnZSI6IjE4IiwicGFzc3dvcmQiOiIqKioqKioiLCJpYXQiOjE2MTA5MDY5MTJ9.qzNZarWbpDUA8-SO6nLd4ffEUR1IVOWKGXiocHV7MkU"}}

# 使用错误的密码登录
$ curl https://1457216987974698.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/serverless/auth-app/login \
-d "name=jack&password=1234561" \
-X POST
{"success":false,"message":"密码错误"}
```

密码错的时候返回「密码错误」，密码对的时候拿到一长串 token。你可以把这串 token 复制到 jwt.io 上解一下，会看到 payload 里正是 `{"name":"jack","age":"18","password":"******","iat":...}`，密码已经是星号了。

那么问题来了，对于需要登录后才能访问的接口，应该怎么根据 token 验证用户身份呢？

#### 1.5 验证用户身份

登录成功后，客户端需要把 token 保存下来，之后的每个请求都带上它。通常会把 token 放在 HTTP 请求头中，格式是：

```
Authorization: Bearer token
```

这时假设我们要实现一个新的接口，获取当前登录用户信息，该接口也只能登录后才能使用。那么代码实现就是下面这样：

```js 
// 定义 /user 路由，获取当前登录的用户信息
app.get('/user', (req, res) => {
  // 从 HTTP 请求头中获取 token 信息
  const token = req
    .headers
    .authorization
    .split(' ')
    .pop();
  try {
    // 验证 token 并解析出用户信息
    const user = jwt.verify(token, SECRET);
    return res.json({
      success: true,
      data: user
    })
  } catch (error) {
    return res.json({
      success: false,
      data: '身份认证失败'
    })
  }
});
```

这段代码定义了 `/user` 路由，先从请求头拿到 token，再用 `jwt.verify()` 校验签名并解出用户信息。如果 token 被改过、过期了或者压根不是我们签发的，`verify` 会直接抛异常，走到 catch 里返回身份认证失败。

这里有个坑要注意，`req.headers.authorization.split(' ').pop()` 这一串没有做空值判断。客户端要是根本没带 Authorization 头，`authorization` 就是 `undefined`，`.split()` 直接抛 TypeError，整个函数 500。真实项目里应该先判断请求头存不存在，再往下解析。另外这段逻辑显然应该抽成 Express 中间件，用 `app.use()` 统一挂上去，而不是在每个需要鉴权的路由里复制一遍，下一个案例里就会看到抽出来的写法。

同样，我们可以将代码部署到函数计算并进行测试：

```js 
curl https://1457216987974698.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/serverless/auth-app/user \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiamFjayIsImFnZSI6IjE4IiwicGFzc3dvcmQiOiIqKioqKioiLCJpYXQiOjE2MTA5MDY5MTJ9.qzNZarWbpDUA8-SO6nLd4ffEUR1IVOWKGXiocHV7MkU"
{"success":true,"data":{"name":"jack","age":"18","password":"******","iat":1610905944}}

# 使用错误的 token 进行身份认证
$ curl https://1457216987974698.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/serverless/auth-app/user -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiamFjayIsImFnZSI6IjE4IiwicGFzc3dvcmQiOiIqKioqKioiLCJpYXQiOjE2MTA5MDY5MTJ9.qzNZarWbpDUA8-SO6nLd4ffEUR1IVOWKGXiocHV7Mk"
{"success":false,"data":"身份认证失败"}
```

注意第二条命令里的 token 末尾少了两个字符，签名对不上，直接被拒。这就是 JWT 防篡改的效果，你改动 payload 里任何一个字节，签名都会失配。

到此为止，一个 Serverless 架构的登录注册功能就完成了，我们也基于 JWT 实现了 Serverless 中的身份认证。

**强调这样几点：**

- Cookie-Session 的身份认证方式，是在服务端存储 Session 信息，客户端（浏览器）通过 cookie 存储 Session ID；
- JWT 的身份认证方式，是在服务端根据用户信息生成 token，客户端保存 token；
- Cookie-Session 的认证方案通常是有状态的，对于分布式、无状态的应用，需要将 Session 保存在共享存储中；
- JWT 的认证方式通常是无状态的，所以比较适合 Serverless 应用。

补一条原文没提但实际会咬人的：JWT 没法主动撤销。用户点了退出、管理员把账号封了，那串已经签发出去的 token 在过期之前照样有效。想解决就得引入黑名单（又回到需要共享存储了），或者把有效期设短一点配上 refresh token。无状态的代价就在这儿，选型时心里要有数。

### 2 基于 Serverless 构建弹性可扩展的 Restful API

API 是使用 Serverless 最常见，也是最适合的场景之一。和 Serverful 架构的 API 相比，用 Serverless 开发 API 好处很多：

- 不用购买、管理服务器等基础设施，不用关心服务器的运维，节省人力成本；
- 基于 Serverless 的 API，具备自动弹性伸缩的能力，能根据请求流量弹性扩缩容，让你不再担心流量波峰、波谷；
- 基于 Serverless 的 API 按实际资源使用量来付费，节省财务成本。

好处摆在这儿，很多人跃跃欲试，一动手却卡在几个共性问题上：架构怎么设计、代码怎么组织、十几个函数怎么统一管理。这一节就以一个内容管理系统为例，把这几个问题一次性走一遍。

跟上一个案例最大的区别是，这次不再把整个 Express 应用塞进一个函数，而是一个接口一个函数，用 API 网关做统一入口。这才是 FaaS 更原生的组织方式。

首先，我们需要对内容管理系统进行架构设计。

#### 2.1 内容管理系统的架构设计

在进行架构设计前，你要明确系统的需求。对于一个内容管理系统，最核心的功能（也是这一讲要实现的功能），主要有这样几个：

- 用户注册；
- 用户登录；
- 发布文章；
- 修改文章；
- 删除文章；
- 查询文章。

这 6 个功能分别对应了我们要实现的 Restful API。为了方便统一管理 API，在 Serverless 架构中通常会用到 API 网关，通过 API 网关触发函数执行，并且基于 API 网关还能实现参数控制、超时时间、IP 黑名单、流量控制等高级功能。

对于文章管理相关的 Restful API，用户发布文章前需要先登录。前面已经讲过在 Serverless 中可以用 JWT 进行身份认证，这个管理系统的登录注册也沿用那一套。

在传统的 Serverful 架构中，通常会用 MySQL 等关系型数据库存储数据，但关系型数据库要在代码中维护连接状态及连接池，且一般不能自动扩容，并不适合 Serverless 应用。所以在 Serverless 架构中，通常选用表格存储这类 Serverless NoSQL 数据库来存储数据。

基于 JWT 的身份认证方案、数据存储方案，我们可以画出 Serverless 的内容管理系统架构图：

![Serverless 内容管理系统架构图，API 网关加函数加表格存储](https://blog.poetries.top/img/static/images/20210418171452.png)

- 图中主要表达的意思是，通过 API 网关承接用户请求并驱动函数执行。每个函数分别实现一个具体功能，并通过 JWT 实现身份认证，最后表格存储作为数据库。
- 其中，数据库中存储的数据主要是用户数据和文章数据。假设用户有 username（用户名） 和 password（密码） 两个属性；文章有 `article_id`（文章 ID）、`username`（创建者）、`title`（文章标题）、`content`（文章内容）、`create_date`（创建时间）、`update_date`（更新时间）这几个属性

![用户表与文章表的字段设计](https://blog.poetries.top/img/static/images/20210418171543.png)

这张表结构图里没有外键、没有关联，就两张扁平的表，这不是偷懒。表格存储是宽表模型，本来就不支持 JOIN，数据关系得靠应用层自己维护。习惯了写 SQL 的同学刚转过来会有点不适应，但换个角度想，接口拆得足够细的话，一个函数往往也只碰一张表。

接下来，你可以在表格存储中创建对应的数据表（可以在表格存储控制台点，也可以直接跑下面这段代码）：


```js
// index.js
const TableStore = require("tablestore");
// 初始化 TableStore client
const client = new TableStore.Client({
  accessKeyId: '<your access key>',
  accessKeySecret: '<your access secret>',
  endpoint: "https://serverless-app.cn-shanghai.ots.aliyuncs.com",
  instancename: "serverless-cms",
});
/**
 * 创建 user 表
 *
 * 参考文档： https://help.aliyun.com/document_detail/100594.html
 */
async function createUserTable() {
  const table = {
    tableMeta: {
      tableName: "user",
      primaryKey: [
        {
          name: "username", // 用户名
          type: TableStore.PrimaryKeyType.STRING,
        },
      ],
      definedColumn: [
        {
          name: "password", // 密码
          type: TableStore.DefinedColumnType.DCT_STRING,
        },
      ],
    },
    // 为数据表配置预留读吞吐量或预留写吞吐量。0 表示不预留吞吐量，完全按量付费
    reservedThroughput: {
      capacityUnit: {
        read: 0,
        write: 0,
      },
    },
    tableOptions: {
      // 数据的过期时间，单位为秒，-1表示永不过期
      timeToLive: -1,
      // 保存的最大版本数，1 表示每列上最多保存一个版本即保存最新的版本
      maxVersions: 1,
    },
  };
  await client.createTable(table);
}
/**
 * 创建文章表
 */
async function createArticleTable() {
  const table = {
    tableMeta: {
      tableName: "article",
      primaryKey: [
        {
          name: "article_id", // 文章 ID，唯一字符串
          type: TableStore.PrimaryKeyType.STRING,
        },
      ],
      definedColumn: [
        {
          name: "title",
          type: TableStore.DefinedColumnType.DCT_STRING,
        },
        {
          name: "username",
          type: TableStore.DefinedColumnType.DCT_STRING,
        },
        {
          name: "content",
          type: TableStore.DefinedColumnType.DCT_STRING,
        },
        {
          name: "create_date",
          type: TableStore.DefinedColumnType.DCT_STRING,
        },
        {
          name: "update_date",
          type: TableStore.DefinedColumnType.DCT_STRING,
        },
      ],
    },
    // 为数据表配置预留读吞吐量或预留写吞吐量。0 表示不预留吞吐量，完全按量付费
    reservedThroughput: {
      capacityUnit: {
        read: 0,
        write: 0,
      },
    },
    tableOptions: {
      // 数据的过期时间，单位为秒，-1表示永不过期
      timeToLive: -1,
      // 保存的最大版本数，1 表示每列上最多保存一个版本即保存最新的版本
      maxVersions: 1,
    },
  };
  await client.createTable(table);
}
(async function () {
    await createUserTable();
  await createArticleTable();
})();
```

这段代码创建了 user 和 article 两张表，其中 user 表的主键是 username，article 表的主键是 article_id，主键的作用是方便查询。除了主键，还定义了几个列。其实对于表格存储，默认也可以不创建列，它是宽表，除主键外数据列可以随意扩展。

配置里的 `reservedThroughput` 设成 0 是个重要的选择，代表不预留读写吞吐量，完全按量付费。这跟 Serverless 的成本模型是一致的，没请求就不花钱。要是预留了吞吐量，哪怕一整天零调用，这部分费用照收，那就跟包月买服务器没区别了。

`timeToLive: -1` 表示数据永不过期，`maxVersions: 1` 表示每列只保留最新一个版本。表格存储天然支持多版本，做审计或者回溯的时候可以把这个值调大，但存储费用也会跟着涨。

在完成了数据库表的创建后，我们就可以开始进行系统实现了。

#### 2.2 内容管理系统的实现

完整代码放在下面这个仓库里，可以拉下来对照着看。

```
$ git clone https://github.com/poetries/serverless-class
$ cd 15/cms
```

整个代码目录结构如下：

```
.
├── package.json
├── src
│   ├── config
│   │   └── index.js
│   ├── db
│   │   └── client.js
│   ├── function
│   │   ├── article
│   │   │   ├── create.js
│   │   │   ├── delete.js
│   │   │   ├── detail.js
│   │   │   └── update.js
│   │   └── user
│   │       ├── login.js
│   │       └── register.js
│   └── middleware
│       └── auth.js
└── template.yml
```

其中，所有业务代码都放在 src 目录中：

- `config/index.js` 是配置文件，里面包含身份凭证等配置信息；
- `db/client.js` 对表格存储的增删改查操作进行了封装，方便在函数中使用（将数据库的操作封装还有一个好处是，如果你之后想要迁移到其他数据库，只要修改 db/client.js 中的逻辑，不用修改业务代码）；
- `middleware` 目录中是一些中间件，比如 `auth.js`，用于身份认证；
- `function` 目录中就是所有函数，登录、注册、创建文章等，每个功能分别对应一个函数；
- `template.yml` 是应用配置文件，包括函数和 API 网关的配置。

这个目录结构值得多看两眼。函数拆细之后最怕的就是代码重复，同一段数据库封装在六个函数里各抄一遍，改一次要改六处。这里的解法是把公共部分（`db`、`middleware`、`config`）抽在 `function` 目录外面，函数只负责组装。这个套路在下一个案例里还会再用一次，只是那边因为要打包成单文件，处理方式更复杂一点。

根据前面梳理的系统功能，我们需要实现以下几个 API：

| 功能 | 请求方法与路径 |
| -------- | -------------------------------- |
| 用户注册 | POST /user/register |
| 用户登录 | POST /user/login |
| 发布文章 | POST /article/create |
| 查询文章 | GET /article/detail/[article_id] |
| 更新文章 | PUT /article/update/[article_id] |
| 删除文章 | DELETE /article/delete/[article_id] |

每个 API 对应一个具体的函数，每个函数也都有一个与之对应的 API 网关触发器。由于这些函数属于同一个应用，所以我们可以通过一个 template.yml 来定义所有函数，同时把 API 网关触发器也一并定义进去，这样部署函数时就会自动创建 API 网关。

内容管理系统的 `template.yaml` 格式如下：

```bash
ROSTemplateFormatVersion: '2015-09-01'
Transform: 'Aliyun::Serverless-2018-04-03'
Resources:
  # 函数服务，该服务中的函数都是内容管理系统的函数
  serverless-cms:
    Type: 'Aliyun::Serverless::Service'
    Properties:
      Description: 'Serverless 内容管理系统'
    # 函数名称
    [functionName]:
      Type: 'Aliyun::Serverless::Function'
      Properties:
        # 函数路径
        Handler: <functionPath>.handler
        Runtime: nodejs12
        CodeUri: './'
  # API 网关分组，分组中的所有 API 都是内容管理系统的 API
  ServerlessCMSGroup: 
    Type: 'Aliyun::Serverless::Api'
    Properties:
      StageName: RELEASE
      DefinitionBody:
        <Path>: # 请求的 path
          post: # 请求的 method
            x-aliyun-apigateway-api-name: user_register # API 名称
            x-aliyun-apigateway-fc: # 当请求该 API 时，要触发的函数，
              arn: acs:fc:::services/${serverless-cms.Arn}/functions/${<functionName>.Arn}/
              timeout: 3000
```

template.yml 主要分为两部分，函数定义和 API 网关定义，每个函数都有一个与之对应的 API 网关。我们用 serverless-cms 服务来表示内容管理系统这个应用，服务内的所有函数都是内容管理系统的函数。同理，ServerlessCMSGroup 这个 API 网关分组中的所有 API 都是内容管理系统的 API。

`arn` 那一行是把网关和函数接起来的关键，`${serverless-cms.Arn}` 这种写法是模板的引用语法，部署时会被替换成真实的资源标识，不用你手动去控制台抄 ID。`timeout: 3000` 是网关等待函数返回的超时时间，单位毫秒，注意它和函数自己的 `Timeout` 是两码事，网关先超时的话，函数还在后台跑，但调用方已经拿到 504 了。这两个值要配套着调。

完整的 `template.yml` 配置如下：

```bash
ROSTemplateFormatVersion: '2015-09-01'
Transform: 'Aliyun::Serverless-2018-04-03'
Resources:
  # 函数服务
  serverless-cms:
    Type: 'Aliyun::Serverless::Service'
    Properties:
      Description: 'Serverless 内容管理系统'
    user-register:
      Type: 'Aliyun::Serverless::Function'
      Properties:
        Handler: src/function/user/register.handler
        Runtime: nodejs12
        CodeUri: './'
    user-login:
      Type: 'Aliyun::Serverless::Function'
      Properties:
        Handler: src/function/user/login.handler
        Runtime: nodejs12
        CodeUri: './'
    article-create:
      Type: 'Aliyun::Serverless::Function'
      Properties:
        Handler: src/function/article/create.handler
        Runtime: nodejs12
        CodeUri: './'
    article-detail:
      Type: 'Aliyun::Serverless::Function'
      Properties:
        Handler: src/function/article/detail.handler
        Runtime: nodejs12
        CodeUri: './'
    article-update:
      Type: 'Aliyun::Serverless::Function'
      Properties:
        Handler: src/function/article/update.handler
        Runtime: nodejs12
        CodeUri: './'
    article-delete:
      Type: 'Aliyun::Serverless::Function'
      Properties:
        Handler: src/function/article/delete.handler
        Runtime: nodejs12
        CodeUri: './'
  # API 网关分组
  ServerlessCMSGroup: 
    Type: 'Aliyun::Serverless::Api'
    Properties:
      StageName: RELEASE
      DefinitionBody:
        '/user/register': # 请求的 path
          post: # 请求的 method
            x-aliyun-apigateway-api-name: user_register # API 名称
            x-aliyun-apigateway-fc: # 当请求该 API 时，要触发的函数，
              arn: acs:fc:::services/${serverless-cms.Arn}/functions/${user-register.Arn}/
              timeout: 3000
        '/user/login':
          post:
            x-aliyun-apigateway-api-name: user_login
            x-aliyun-apigateway-fc:
              arn: acs:fc:::services/${serverless-cms.Arn}/functions/${user-login.Arn}/
              timeout: 3000
        '/article/create':
          post:
            x-aliyun-apigateway-api-name: article_create
            x-aliyun-apigateway-fc:
              arn: acs:fc:::services/${serverless-cms.Arn}/functions/${article-create.Arn}/
              timeout: 3000
        '/article/detail/[article_id]':
          GET:
            x-aliyun-apigateway-api-name: article_detail
            x-aliyun-apigateway-request-parameters:
              - apiParameterName: 'article_id'
                location: 'Path'
                parameterType: 'String'
                required: 'REQUIRED'
            x-aliyun-apigateway-fc:
              arn: acs:fc:::services/${serverless-cms.Arn}/functions/${article-detail.Arn}/
              timeout: 3000
        '/article/update/[article_id]':
          PUT:
            x-aliyun-apigateway-api-name: article_update
            x-aliyun-apigateway-request-parameters:
              - apiParameterName: 'article_id'
                location: 'Path'
                parameterType: 'String'
                required: 'REQUIRED'
            x-aliyun-apigateway-fc:
              arn: acs:fc:::services/${serverless-cms.Arn}/functions/${article-update.Arn}/
              timeout: 3000
        '/article/delete/[article_id]':
          DELETE:
            x-aliyun-apigateway-api-name: article_delete
            x-aliyun-apigateway-request-parameters:
              - apiParameterName: 'article_id'
                location: 'Path'
                parameterType: 'String'
                required: 'REQUIRED'
            x-aliyun-apigateway-fc:
              arn: acs:fc:::services/${serverless-cms.Arn}/functions/${article-delete.Arn}/
              timeout: 3000
```

在这份配置中，有两个地方特别容易写错。

一是函数的 Handler 配置。Handler 可以写函数路径，比如 `src/function/user/register.handler` 表示 `src/function/user/` 目录中 `register.js` 文件里的 `handler` 方法。最后那个点分隔的是文件和方法名，不是路径的一部分，第一次写很容易多打一个斜杠。

二是 API 网关配置中的 `/article/detail/[article_id]` 这种带参数的 Path，必须用 `x-aliyun-apigateway-request-parameters` 显式声明 Path 参数。漏了这一段，网关不会报错，但函数里 `event.pathParameters` 拿到的是空的，排查起来相当费劲，因为看日志一切正常，就是取不到值。

我上面还顺手改了一处原配置的笔误，`/article/delete/[article_id]` 那条的 `x-aliyun-apigateway-api-name` 原本写成了 `article_update`，和更新接口重名。API 名称在同一个分组内要唯一，重名会导致部署时覆盖或失败，这里改成了 `article_delete`。

接下来，我们就来实现内容管理系统的各个 API，也就是 template.yml 中定义的各个函数。

#### 2.3 用户注册

用户注册接口定义如下。

- 请求方法：POST
- Path：`/user/register`
- Body 参数：username 用户名、password 密码

整体代码很简单，在入口函数 handler 中，通过 event 得到 API 网关传递过来的 HTTP 请求 body 数据，然后从中得到 username、password，再将用户信息写入数据库。

```js
// src/function/user/register
const client = require("../../db/client");
/**
 * 用户注册
 * @param {string} username 用户名
 * @param {string} password 密码
 */
async function register(username, password) {
  await client.createRow("user", { username }, { password });
}
module.exports.handler = function (event, context, callback) {
  // 从 event 中获取 API 网关传递 HTTP 请求 body 数据
  const body = JSON.parse(JSON.parse(event.toString()).body);
  const { username, password } = body;
  register(username, password)
    .then(() => callback(null, { success: true }))
    .catch((error) =>
      callback(error, { success: false, message: "用户注册失败" })
    );
};
```

`JSON.parse(JSON.parse(event.toString()).body)` 这一串看着别扭，但它确实是 API 网关触发器的正常形态。`event` 是 Buffer，先 `toString()` 转字符串，第一次 parse 拿到网关包装的整个请求对象（里面有 headers、queryParameters、pathParameters、body），第二次 parse 才是真正的业务 body。这跟 HTTP 触发器直接给你 `request.body` 完全不同，第一次从 HTTP 触发器切到 API 网关的人基本都会在这里卡一下。

对比一下上一个案例里的 Express 写法，你会更清楚代价在哪儿：函数拆细了，弹性和职责是清爽了，但每个函数都得自己解一遍 event、自己拼一遍响应。所以实际项目里，这层解析一般也会抽进 `middleware`。

代码完成后，就可以将应用部署到函数计算：

```bash
# 部署应用
$ fun deploy
Waiting for service serverless-cms to be deployed...
...
service serverless-cms deploy success
Waiting for api gateway ServerlessCMSGroup to be deployed...
...
api gateway ServerlessCMSGroup deploy success
```

部署过程中，如果看到函数服务 serverless-cms  和 API 网关 ServerlessCMSGroup 都成功部署了，就说明应用部署完成。部署完成后，API 网关会提供一个用来测试的 API Endpoint，当然你也可以绑定自定义域名。

我们可以通过 curl 测试一下：

```
$ curl http://a88f7e84f71749958100997b77b3e2f6-cn-beijing.alicloudapi.com/user/register \
-X POST \
-d "username=Jack&password=123456"
{"success":true}
```

返回 `{"success": true}` ，说明用户注册成功。这时在表格存储控制台也可以看到刚注册的用户。

![表格存储控制台中新注册用户的数据行](https://blog.poetries.top/img/static/images/20210418172230.png)

这一步的排查价值挺高。接口返回成功但数据没落库的情况不算少见，八成是函数的 RAM 角色没给表格存储的写权限。养成部署完去控制台看一眼数据的习惯，能省不少时间。

#### 2.4 用户登录

完成用户注册函数开发后，就可以接着开发登录。用户登录的接口定义如下。

- 请求方法：POST。
- Path：/user/login
- Body 参数：username 用户名、password 密码。

登录的逻辑就是判断用户输入的密码是否正确，正确就生成一个 token 返回给调用方。代码实现如下：

```js
// src/function/user/login
const assert = require("assert");
const jwt = require('jsonwebtoken');
const { jwt_secret } = require("../../config");
const client = require("../../db/client");
/**
 * 用户登录
 * @param {string} username 用户名
 * @param {string} password 密码
 */
async function login(username, password) {
  const user = await client.getRow("user", { username });
  assert(user && user.password === password);
  const token = jwt.sign({ username: user.username }, jwt_secret);
  return token;
}
module.exports.handler = function (event, context, callback) {
  const body = JSON.parse(JSON.parse(event.toString()).body);
  const { username, password } = body;
  login(username, password)
    .then((token) => callback(null, { success: true, data: { token } }))
    .catch((error) =>
      callback(error, { success: false, message: "用户登录失败" })
    );
};
```

这段代码用 `assert` 来做密码校验，断言失败直接抛异常，被外面的 `.catch()` 接住，统一返回「用户登录失败」。这么写有个好处，不管是用户不存在还是密码错误，对外的报错信息都一样，攻击者没法通过错误文案枚举出哪些用户名是存在的。上一个案例里区分了「用户不存在」和「密码错误」，从安全角度看反而不如这里。

另外注意 `jwt.sign({ username: user.username }, jwt_secret)` 只把 username 塞进了 payload，密码压根没进去，比上一个案例先赋值星号再签发要干净。

将其部署到函数计算后，我们也可以使用 curl 命令进行测试：

```
$ curl http://a88f7e84f71749958100997b77b3e2f6-cn-beijing.alicloudapi.com/user/login \
-X POST \
-d "username=Jack&password=123456"
{"success":true,"data":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkphY2siLCJpYXQiOjE2MTE0OTI2ODF9.c56Xm4RBLYl5yVtR_Vk0IZOL0yijofcyE-P7vjKf4nA"}}
```

#### 2.5 身份认证

在完成了注册登录接口后，我们再来看一下内容管理系统中，身份认证应该怎么实现。

前面那个案例里，鉴权逻辑是散在路由里的，我也吐槽过应该抽成 Express 中间件。到了纯函数的场景，没有 Express 帮你串中间件了，但思路可以照搬，实现一个 auth.js 专门做身份认证，每个需要鉴权的函数在开头调一下。代码如下：

```js
// src/middleware/auth.js
const jwt = require("jsonwebtoken");
const { jwt_secret } = require("../config/index");
/**
 * 身份认证
 * @param {object} event API 网关的 event 对象
 * @return {object} 认证通过后返回 user 信息；认证失败则返回 false
 */
const auth = function (event) {
  try {
    const data = JSON.parse(event.toString());
    if (data.headers && data.headers.Authorization) {
      const token = JSON.parse(event.toString())
        .headers.Authorization.split(" ")
        .pop();
      const user = jwt.verify(token, jwt_secret);
      return user;
    }
    return false;
  } catch (error) {
    return false;
  }
};
module.exports = auth;
```

原理很简单，从 API 网关的 event 对象中取出 token，验证一下是否合法。认证通过就返回 user 信息，失败返回 false。跟上一个案例相比，这里补上了 `data.headers && data.headers.Authorization` 的判空，外面还套了 try/catch，请求头没带 token 也不会把函数搞崩。

有个细节容易踩：`data.headers.Authorization` 这个 key 是大小写敏感的。HTTP 头本身不区分大小写，但 API 网关塞进 event 时用的是什么大小写就是什么，客户端发 `authorization` 小写的话这里就取不到。稳妥的做法是把 headers 的 key 全部转成小写再取。

这样在需要身份认证的函数中，你只要引入 auth.js 并传入 event 对象就可以了。下面是一个简单的示例：

```js
const auth = require('./middleware/auth');
module.exports.handler = function (event, context, callback) {
  // 使用 auth 进行身份认证
  const user = auth(event);
  if (!user) {
    // 若认证失败则直接返回
    return callback('身份认证失败!')
  }
  // 通过身份认证后的业务逻辑
  // ...
  callback(null);
};
```

除了登录注册，其他接口都需要身份认证，所以接下来我们就通过实现「发布文章」函数来实际用一下 auth.js。

顺带说一句，鉴权其实还有一个位置可以放，就是 API 网关本身。阿里云 API 网关支持配置授权方式，甚至可以挂一个专门的鉴权函数（Custom Authorizer），验过之后再放行到业务函数。这么做的好处是无效请求根本不会触发业务函数，省了那部分调用费用，也让业务代码更干净。代价是配置复杂一些，本地调试没那么直接。小项目用代码里的 auth.js 就够了，接口一多就该考虑往网关挪。

#### 2.6 发布文章

发布文章的接口定义如下。

- 请求方法：POST。
- Path：/article/create
- Headers 参数: Authorization token。
- Body 参数：title、content。

由于登录后才能发布文章，所以要先通过登录接口获取 token，然后调用 /article/create 接口时，再把 token 放在 HTTP Headers 里。发布文章的代码实现如下：

```js
// src/function/article/auth
const uuid = require("uuid");
const auth = require("../../middleware/auth");
const client = require("../../db/client");
/**
 * 创建文章
 * @param {string} username 用户名
 * @param {string} title 文章标题
 * @param {string} content 文章内容
 */
async function createArticle(username, title, content) {
  const article_id = uuid.v4();
  const now = new Date().toLocaleString();
  await client.createRow(
    "article",
    {
      article_id,
    },
    {
      username,
      title,
      content,
      create_date: now,
      update_date: now,
    }
  );
  return article_id;
}
module.exports.handler = function (event, context, callback) {
  // 身份认证
  const user = auth(event);
  if (!user) {
    // 若认证失败则直接返回
    return callback("身份认证失败");
  }
  // 从 user 中获取 username
  const { username } = user;
  const body = JSON.parse(JSON.parse(event.toString()).body);
  const { title, content } = body;
  createArticle(username, title, content)
    .then((article_id) =>
      callback(null, {
        success: true,
        data: { article_id },
      })
    )
    .catch((error) =>
      callback(error, {
        success: false,
        message: "创建文章失败",
      })
    );
};
```

整个函数的骨架是固定的三段：先用 auth.js 鉴权，认证通过后从 user 里取 username，再从请求体里取标题和内容，最后写库。后面几个函数你会发现结构一模一样，这就是函数拆细之后的样子，每个都短得一眼能看完。

文章 ID 用 `uuid.v4()` 生成，而不是数据库自增。这也是无状态带来的约束，表格存储没有自增主键，多个函数实例并发写入也没法协调序号，UUID 是最省事的选择。代价是主键无序，写入时容易分散到不同分区，量大之后要考虑加时间前缀之类的优化。

`create_date` 用的是 `new Date().toLocaleString()`，这里其实有个隐患。函数实例的时区取决于运行环境，通常是 UTC，生成出来的字符串跟你本地看到的对不上，后面查询结果里那个 `"1/24/2021, 2:05:46 PM"` 就是这么来的。真项目建议直接存时间戳或者 ISO 字符串，展示层再做格式化。

接下来我们依旧可以把函数部署上去，用 curl 测试：

```
$ curl http://a88f7e84f71749958100997b77b3e2f6-cn-beijing.alicloudapi.com/article/create \
-X POST \
-d "title=这是文章标题&content=内容内容内容......" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkphY2siLCJpYXQiOjE2MTE0OTI2ODF9.c56Xm4RBLYl5yVtR_Vk0IZOL0yijofcyE-P7vjKf4nA"
{"success":true,"data":{"article_id":"d4b9bad8-a0ed-499d-b3c6-c57f16eaa193"}}
```

测试时要把 token 放在 HTTP 请求头的 Authorization 里。文章发布成功后，你就可以在表格存储中看到对应的数据了。

![表格存储中新创建的文章数据行](https://blog.poetries.top/img/static/images/20210418172448.png)

上面 `handler` 里我把 `article_id` 透传了出来（原代码 `.then()` 里没接住 `createArticle` 的返回值，导致响应体和 curl 示例里的 `{"success":true,"data":{"article_id":"..."}}` 对不上）。前端拿不到新建资源的 ID，创建完就没法跳详情页，这种小疏漏在拆细的函数里特别容易漏掉。

#### 2.7 查询文章

发布文章的接口开发完成后，我们继续开发一个查询文章的接口，把刚才创建的文章读出来。查询文章接口定义如下。

- 请求方法：GET。
- Path：`/article/detail/[article_id]`
- Headers 参数: Authorization token。

在查询文章接口中，我们需要在 Path 中定义文章 ID 参数，即 article_id。这样在函数代码里，就可以从 event 对象的 pathParameters 中拿到 article_id，再根据它查询文章详情。完整代码如下：

```js
const uuid = require("uuid");
const auth = require("../../middleware/auth");
const client = require("../../db/client");
/**
 * 获取文章详情
 * @param {string} title 文章 ID
 */
async function getArticle(article_id) {
  const res = await client.getRow(
    "article",
    {
      article_id,
    },
  );
  return res;
}
module.exports.handler = function (event, context, callback) {
  // 身份认证
  const user = auth(event);
  if (!user) {
    // 若认证失败则直接返回
    return callback("身份认证失败");
  }
  
  // 从 event 对象中获取文章 ID
  const article_id = JSON.parse(event.toString()).pathParameters['article_id'];
  getArticle(article_id)
    .then((detail) =>
      callback(null, {
        success: true,
        data: detail
      })
    )
    .catch((error) =>
      callback(error, {
        success: false,
        message: "查询文章失败",
      })
    );
};
```

这里的错误文案原本也是「创建文章失败」，一看就是从上一个函数复制过来忘了改，这次顺手改成了「查询文章失败」。文案复制粘贴不改，线上排查日志时非常误导人。另外这个文件顶部 `require("uuid")` 其实用不上，查询不需要生成 ID，删掉能让 ncc 打出来的包小一点。

开发完成后，我们可以将其部署到函数计算，再用 curl 命令进行测试：

```bash
$ curl http://a88f7e84f71749958100997b77b3e2f6-cn-beijing.alicloudapi.com/article/detail/d4b9bad8-a0ed-499d-b3c6-c57f16eaa193 \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkphY2siLCJpYXQiOjE2MTE0OTI2ODF9.c56Xm4RBLYl5yVtR_Vk0IZOL0yijofcyE-P7vjKf4nA"
{"success":true,"data":{"article_id":"d4b9bad8-a0ed-499d-b3c6-c57f16eaa193","content":"内容内容内容......","create_date":"1/24/2021, 2:05:46 PM","title":"这是文章标题","update_date":"1/24/2021, 2:05:46 PM","username":"Jack"}}
```

如上所示，查询文章的接口按照预期返回了文章详情。

这个接口有个设计问题值得想一下：查文章详情真的需要登录吗？内容管理系统的后台可能需要，面向读者的博客肯定不需要。如果这个接口要对外公开，把 `auth(event)` 那几行去掉就行，网关那边也可以顺手配上缓存，读多写少的接口用 CDN 加网关缓存挡一层，函数调用次数能降一大截，账单也跟着降。

#### 2.8 更新文章

更新文章的 API Path 参数和查询文章一样，都需要在 Path 中定义 article_id，body 参数则与创建文章相同。请求 method 是 PUT，因为在 Restful API 规范里，POST 通常表示创建，PUT 表示更新。

更新文章的接口定义如下。

- 请求方法：PUT。
- Path：/article/update/[article_id]
- Headers 参数: Authorization token。
- Body 参数：title、content。

更新文章的逻辑就是根据 article_id 去更新一行数据。代码如下：

```js
const auth = require("../../middleware/auth");
const client = require("../../db/client");
/**
 * 更新文章
 * @param {string} article_id 待更新的文章 ID
 * @param {string} title 文章标题
 * @param {string} content 文章内容
 */
async function updateArticle(article_id, title, content) {
  const now = new Date().toLocaleString();
  await client.updateRow(
    "article",
    {
      article_id,
    },
    {
      title,
      content,
      update_date: now,
    }
  );
}
module.exports.handler = function (event, context, callback) {
  // 身份认证
  const user = auth(event);
  if (!user) {
    // 若认证失败则直接返回
    return callback("身份认证失败");
  }
  const eventObject = JSON.parse(event.toString())
  // 从 event 对象的 pathParameters 中获取 Path 参数
  const article_id = eventObject.pathParameters['article_id'];
  const body = JSON.parse(eventObject.body);
  // 从 event 对象的 body 中获取请求体参数
  const { title, content } = body;
  updateArticle(article_id, title, content)
    .then(() =>
      callback(null, {
        success: true,
      })
    )
    .catch((error) =>
      callback(error, {
        success: false,
        message: "更新文章失败",
      })
    );
};
```

这段代码有个明显的越权漏洞，认证是做了，但没做鉴权。任何一个登录用户都能改别人的文章，因为代码只验了 token 有效，没验 `user.username` 跟这篇文章的 `username` 是不是同一个人。正确做法是先 `getRow` 把文章查出来，比对 `article.username === user.username`，不一致直接返回 403。删除接口同理。教学代码为了简洁省了这一步，你抄的时候一定要补上，这类问题在真实系统里是要出事的。

开发并部署完成后，使用 curl 命令进行测试：

```
$ curl http://a88f7e84f71749958100997b77b3e2f6-cn-beijing.alicloudapi.com/article/update/d4b9bad8-a0ed-499d-b3c6-c57f16eaa193 \
-X PUT \
-d "title=这是文章标题&content=更新的内容......" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkphY2siLCJpYXQiOjE2MTE0OTI2ODF9.c56Xm4RBLYl5yVtR_Vk0IZOL0yijofcyE-P7vjKf4nA"
{"success":true}
```

返回 `{"success":true}` 则说明更新成功。


#### 2.9 删除文章

最后是删除文章的 API。它同样需要在 Path 中定义 article_id 参数，HTTP method 用 DELETE。具体接口定义如下。

- 请求方法：DELETE。
- Path：/article/delete/[article_id]
- Headers 参数: Authorization token。

删除文章很简单，根据 article_id 删掉一行数据就行，代码如下：

```js
const uuid = require("uuid");
const auth = require("../../middleware/auth");
const client = require("../../db/client");
/**
 * 删除文章
 * @param {string} title 文章 ID
 */
async function deleteArticle(article_id) {
  const res = await client.deleteRow(
    "article",
    {
      article_id,
    },
  );
  return res;
}
module.exports.handler = function (event, context, callback) {
  // 身份认证
  const user = auth(event);
  if (!user) {
    // 若认证失败则直接返回
    return callback("身份认证失败");
  }
  
  // 从 event 对象中获取文章 ID
  const article_id = JSON.parse(event.toString()).pathParameters['article_id'];
  deleteArticle(article_id)
    .then(() =>
      callback(null, {
        success: true,
      })
    )
    .catch((error) =>
      callback(error, {
        success: false,
        message: "删除文章失败",
      })
    );
};
```

同样我们可以通过 curl 命令进行测试：

```
curl http://a88f7e84f71749958100997b77b3e2f6-cn-beijing.alicloudapi.com/article/delete/d4b9bad8-a0ed-499d-b3c6-c57f16eaa193 \
-X DELETE \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkphY2siLCJpYXQiOjE2MTE0OTI2ODF9.c56Xm4RBLYl5yVtR_Vk0IZOL0yijofcyE-P7vjKf4nA"
{"success":true}
```

删除成功后，再去表格存储中就找不到这行记录了。至此，内容管理系统的 Restful API 就开发完毕了。

顺便提一句，这里做的是硬删除，数据直接没了。内容类系统一般会做软删除，加一个 `deleted` 字段标记，查询时过滤掉，这样误删还有得救。

#### 2.10 这个案例的三点经验

基于 Serverless 开发 Restful API，整个代码非常简单，每个函数只负责一个独立的业务，职责单一、逻辑清晰。这个案例我想强调这样几个重点：

- 基于 Serverless 开发 API 时，建议使用 API 网关进行 API 的管理；
- 对于数据库等第三方服务，建议对其基本操作进行封装，这样更方便进行扩展；
- Serverless 函数需要保持简单、独立、单一职责。

再加一条我自己的感受。函数拆细之后，最大的隐性成本不是代码，是运维视角的碎片化。六个接口就是六个函数、六份日志、六条监控曲线，出问题时你得挨个翻。所以从第一天起就把 `requestId` 打全、把日志投到同一个日志库、给服务级别配好告警，这些事早做比晚做省力得多。

### 3 基于 Serverless 开发高可用音视频处理系统

前两个案例都是 Web 接口，属于 IO 密集型。这个案例换个方向，看看 CPU 密集型的活儿在 Serverless 上怎么干。

音视频处理非常消耗计算资源，以往处理视频就要采购一批高性能服务器，财务成本和维护成本都很高。而且这类任务的负载曲线通常极不均匀，可能一整天没活儿，晚上一口气来两千个转码任务。传统方案要么按峰值买机器（大部分时间闲置），要么按均值买（高峰扛不住），怎么选都难受。这恰恰是 Serverless 最能打的地方。

接下来先看传统的音视频处理方案，再看基于 Serverless 的做法，对比着理解会更清楚。

#### 3.1 传统音视频处理方案

信息传播的媒介一直在演变，从文字到图片再到视频，各种短视频、直播甚至 AR、VR 产品层出不穷。在这些产品的背后，离不开音视频处理技术。

得益于云计算的发展，有些云厂商推出了对应的视频解决方案，所以现在搭一个视频处理程序并不难（下图就是一个典型的视频处理方案）：

![传统视频处理方案，OSS 加转码服务加 CDN](https://blog.poetries.top/img/static/images/20210418173047.png)

在该方案中，我们用 OSS 来存储海量的视频内容，视频上传后用视频转码服务将不同来源的视频进行转码，以适配各种终端，然后利用 CDN 提升客户端访问视频的速度。

不过，虽然用了视频转码服务，但我们还是要购买大量的服务器，搭建自己的视频处理系统，对视频进行更高级的自定义处理，比如视频转码后将元数据存入数据库、生成视频前几秒的 GIF 图片用来做视频的封面，以及各种格式的音视频转换等。

除此之外，当我们已经在服务器上部署了一套视频处理系统后，可能还会遇到一些问题。比如，如何应对大量并发任务？能否让这个系统有更高的弹性和可用性？这些问题其实超出了视频处理本身的范围，我们的需求只是进行视频处理，但不得不面临繁重的运维工作。并且我们可能为了应对周期大量处理任务或瞬时流量，不得不购买大量的服务器，成本大幅增加，在服务器的闲置期间还造成了不必要的资源浪费。而且我们也无法 100% 利用机器的性能，这也是一种资源浪费。

而 Serverless 就能解决这些问题，基于 Serverless 你可以很轻松实现一个弹性、可扩展、低成本、免运维、高可用的音视频处理系统。

#### 3.2 基于 Serverless 的音视频处理系统

- 从基础设施的角度来看，基于 Serverless 的音视频解决方案，主要是替换了传统方案中的计算资源，也就是替换了服务器。
- 此外，基于 Serverless 平台提供的丰富触发器，还能简化编程模型。比如以往需要用户把视频上传到 OSS 后，再通过接口主动通知服务器进行处理，而在 Serverless 架构中可以给函数配一个 OSS 触发器，只要有文件被上传到 OSS，就自动触发函数执行，业务逻辑一下就少了一大截。

第二条是这个案例里最值得学的东西。以前那套「上传完记得调个接口通知我」的设计，中间任何一环出问题，任务就丢了，还得配对账补偿。改成 OSS 触发器之后，事件由存储层直接产生，上传成功和触发处理变成了一件事，这类不一致就从架构上消失了。

下图就是基于 Serverless 的视频处理系统解决方案：

![基于 Serverless 的视频处理架构，OSS 触发器驱动函数转码](https://blog.poetries.top/img/static/images/20210418173248.png)

用户把视频上传到 OSS 后，触发函数计算中的视频转码函数执行，该函数对视频进行转码，将元数据存入数据库，再把转码后的视频保存回 OSS。

这里有个坑要注意，如果转码后的文件也写回同一个 bucket 的同一个目录，就会再次触发这个函数，然后无限循环，账单可以刷得很好看。正确做法是给触发器配上前缀过滤，输入文件放 `input/`，输出文件放 `output/`，触发器只监听 `input/`。这个坑几乎是所有人用 OSS 触发器时都会撞一次的。

接下来我们就实现一个基于 Serverless 的音视频处理系统，系统主要有以下几个功能：

- 获取视频时长；
- 获取视频元数据；
- 截取视频 GIF 图；
- 为视频添加水印；
- 对视频进行转码。

为了方便你实践，我为你提供了一份示例代码，你可以通过 git 下载查看：

```
$ git clone https://github.com/poetries/serverless-class
$ cd 18/serverless-video
```

代码结构如下：

```
.
├── functions
│   ├── common
│   │   └── utils.js
│   ├── get_duration
│   │   └── index.js
│   └── get_meta
│       └── index.js
├── build.js
├── ffmpeg
├── ffprobe
├── package.json
└── template.yml
```

其中 functions 中是函数源代码，`common/utils.js` 是一些公共方法，get_duration、get_meta 等目录分别对应每个具体功能，`build.js` 是构建函数的脚本。代码里用 FFmpeg 做视频处理，它是一款功能强大、用途广泛的开源软件，很多视频网站都在用，比如 YouTube、Bilibili。ffmpeg 和 ffprobe 是 FFmpeg 的两个命令行工具，我们会把它们作为依赖部署到函数计算上，这样在函数里就能调这两个命令处理视频。

注意 `ffmpeg` 和 `ffprobe` 是直接躺在仓库根目录的，它们不是 npm 包，是两个几十兆的可执行文件。这就引出了这个案例真正的难点，FaaS 上怎么带二进制依赖，以及怎么在代码包大小限制内塞下它们。这两个问题在 3.4 节会详细说。

由于这几个函数的逻辑基本类似，下面主要讲「获取视频时长」这一个，看懂它其他的就都好理解了。

#### 3.3 获取视频时长函数的实现

首先是获取视频时长的实现，也就是 get_duration 函数。我们可以通过 ffprobe 来获取视频时长，命令如下：

```
$ ffprobe -v quiet -show_entries format=duration -print_format json -i video.mp4
{
    "format": {
        "duration": "170.859000"
    }
}
```

其中 `-v quiet` 是关掉冗余日志，`-show_entries format=duration` 只输出时长这一项，`-print_format json` 指定以 JSON 格式输出结果，`-i` 指定文件位置，可以是本地文件也可以是远程文件。这几个参数配在一起，输出就是一小段能直接 `JSON.parse` 的字符串，不用再写正则去抠。

所以获取视频时长的函数逻辑就是：下载 OSS 中的文件到本地，运行 ffprobe 命令得到视频时长，最后把结果返回。

为了让代码尽可能复用，`common/utils.js` 里实现了一些公共方法，代码大致如下：

```js
// common/utils.js
// ...
/**
 * 运行 Linux 命令
 * @param {string} command 待运行的命令
 */
async function exec(command) {
  console.log(command)
  return new Promise((resolve, reject) => {
    child_process.exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(err)
        return reject(err);
      }
      if (stderr) {
        console.error(stderr)
        return reject(stderr);
      }
      console.log(stdout)
      return resolve(stdout);
    });
  });
}
/**
 * 获取 OSS Client
 * @param {object} context 函数上下文
 */
function getOssClient(context) {
  // 获取函数计算的临时访问凭证
  const accessKeyId = context.credentials.accessKeyId;
  const accessKeySecret = context.credentials.accessKeySecret;
  const securityToken = context.credentials.securityToken;
  // 初始化 OSS 客户端
  const client = oss({
    accessKeyId,
    accessKeySecret,
    stsToken: securityToken,
    bucket: OSS_BUCKET_NAME,
    region: OSS_REGION,
  });
  return client;
}
module.exports = {
  exec,
  getOssClient,
  OSS_VIDEO_NAME,
};
```

`common/utils.js` 主要就两个方法，`exec` 和 `getOssClient`，分别用来执行 Linux 系统命令和获取 OSS 客户端。

`exec` 是把 `child_process.exec` 包成 Promise，没什么特别的，但有一处要留意：它把 `stderr` 有内容就当作失败 reject 了。FFmpeg 这类工具习惯把进度、编码信息都往 stderr 打，并不代表出错，所以拿这段代码跑真正的转码命令时很可能会莫名其妙 reject。真用起来建议改成只看 `err` 和退出码，`stderr` 只记日志。这个我踩过，排查了一下午才反应过来是 FFmpeg 的输出习惯问题，不是命令本身有毛病。

`getOssClient` 那段则示范了前面说的正确姿势，凭证从 `context.credentials` 拿，那是函数计算根据你给服务配的 RAM 角色临时签发的，会自动轮换，比硬编码 AccessKey 安全得多。第一个案例里那种写死密钥的写法，看完这里就可以忘掉了。

这样我们在 `functions/get_duration/index.js` 中就可以直接引入并使用了：

```js
// functions/get_duration/index.js
const { exec, getOssClient, OSS_VIDEO_NAME } = require("../common/utils");
/**
 * 获取视频元信息
 * @param {object} client OSS client
 */
async function getDuration(client) {
  const filePath = "/tmp/video.mp4";
  await client.get(OSS_VIDEO_NAME, filePath);
  const command = `./ffprobe -v quiet -show_entries format=duration -print_format json -i ${filePath}`;
  const res = await exec(command);
  return res;
}

module.exports.handler = function (event, context, callback) {
  // 获取 OSS 客户端
  const client = getOssClient(context);
  getDuration(client)
    .then((res) => {
      console.log("视频时长: \n", res);
      callback(null, res);
    })
    .catch((err) => callback(err));
};
```

`handler` 里先通过 `getOssClient(context)` 拿到 OSS 客户端，再调 `getDuration` 执行业务逻辑。

在 `getDuration` 中，先把视频下载到临时目录 `/tmp/video.mp4`。这里必须说清楚一件事：函数运行环境里只有 `/tmp` 是可写的，代码所在目录是只读的，你想往当前目录写个文件会直接报 EROFS。所以凡是要落盘的中间产物，路径一律指向 `/tmp`。而且 `/tmp` 的容量也有配额（通常 512MB 量级，各平台不同），处理大视频前得先掂量一下，必要时用流式处理或者分片。

还有一点前面讲执行上下文重用时提过，`/tmp` 里的文件在同一个实例的多次调用之间是残留的。所以要么用完删掉，要么给文件名加上随机后缀，不然第二次调用可能直接读到上一次的老视频，得出一个完全正确但完全不对的时长。

然后通过 `exec` 执行拼好的 ffprobe 命令，把结果返回。这样获取视频时长的功能就开发完成了。

获取视频元数据、截 GIF、加水印这些函数，实现跟它高度相似，区别只在 `command` 那一行拼的命令不同。具体实现参考示例代码即可，这里不再赘述。

由于该系统包含多个函数，且函数不仅依赖了 ffmpeg，还依赖了公共的 `common/utils.js`，很多人就犯难了，这些函数应该怎么部署呢？

#### 3.4 音视频处理系统的部署

部署这一步是这个案例真正的重点，前面所有 Web 案例都没碰到过这些问题。

第一件事是把 ffmpeg 和 ffprobe 传上去。听起来简单，直接放进函数代码目录一起上传就行。

不过这里需要注意，由于 ffmpeg 和 ffprobe 是可执行文件，最终要当命令来调用，所以上传到 FaaS 平台之前必须先给它们可执行权限。

再提醒一句，你放上去的这两个二进制必须是 Linux x86_64 版本。在 Mac 上 `brew install ffmpeg` 装出来的是 Darwin 版本，直接扔上去会报 Exec format error，这个报错信息不太直观，容易让人往权限方向猜。

你可以通过 `ls -l` 来查看文件的权限：

```
$ ls -l
-rwxr-xr-x    1 root  staff  39000328  2  9 20:59 ffmpeg
-rwxr-xr-x    1 root  staff  38906056  2  9 21:00 ffprobe
```

`-rwxr-xr-x` 这一串分为四部分：

- 第 0 位 `-` 表示文件类型；
- 第 1-3 位 `rwx` 表示文件所有者的权限；
- 第 4-6 位 `r-x` 是同组用户的权限；
- 第 7-9 位 `r-x` 表示其他用户的权限。

其中 r 表示读权限，w 表示写权限，x 表示执行权限。从上面的输出可以看出，这两个文件对所有用户都有可执行权限。

如果你的这两个文件没有执行权限，则需要通过下面的命令添加权限：

```
$ chmod +x ffmpeg
$ chmod +x ffprobe
```

这样在 FaaS 平台上，Node.js 才能执行这两个命令。有个细节要留意，权限位是随打包过程带上去的，如果你的 CI 流程里用了某些会丢失文件权限的打包方式（比如某些 zip 工具的默认参数），本地看着好好的，传上去就没执行权限了。所以 `chmod +x` 最好放在构建脚本里跑，而不是只在本地手动执行一次。

解决了可执行文件的权限问题后，还有一个问题是函数自身的权限。

由于函数需要读写 OSS，所以要给函数设置一个 RAM 角色，并为该角色添加管理 OSS 的权限。前面 `getOssClient` 里那句 `context.credentials`，取到的就是这个角色签发的临时凭证，角色没配或者权限不够，代码看着没问题但调用 OSS 会直接返回 AccessDenied。

在示例代码中，template.yml 的 `Role` 字段设置了函数的角色 `acs:ram::1457216987974698:role/aliyunfclogexecutionrole`，文件内容如下所示：

```
ROSTemplateFormatVersion: '2015-09-01'
Transform: 'Aliyun::Serverless-2018-04-03'
Resources:
  serverless-video:
    Type: 'Aliyun::Serverless::Service'
    Properties:
      Role: acs:ram::1457216987974698:role/aliyunfclogexecutionrole
      Description: '基于 Serverless 开发高可用音视频处理系统'
    get_duration:
      Type: 'Aliyun::Serverless::Function'
      Properties:
        Handler: index.handler
        Runtime: nodejs12
        Timeout: 600
        MemorySize: 256
        CodeUri: ./.serverless/get_duration
    get_meta:
      Type: 'Aliyun::Serverless::Function'
      Properties:
        Handler: index.handler
        Runtime: nodejs12
        Timeout: 600
        MemorySize: 256
        CodeUri: ./.serverless/get_meta

      ......
```

这份配置里 `Timeout: 600` 和 `MemorySize: 256` 是按视频处理的特点调过的。转码是重活儿，默认那几秒的超时根本不够用，而内存在函数计算里是和 CPU 配额绑定的，调大内存等于调大 CPU，处理速度会明显变快。有意思的是，内存翻倍单价也翻倍，但执行时间可能缩短一半以上，算下来总费用反而更低。这块值得实测几组数据再定。

细心的你可能发现了，在该 YAML 配置中，函数的 CodeUri 不是 `./functions/get_duration`，而是 `./.serverless/get_duration`，这是为什么呢？

这是因为函数代码需要先构建一次，`./.serverless/get_duration` 对应的是构建后的产物。之所以要构建，是为了解决 `common/utils.js` 代码共用的问题。

如果不构建，直接部署 `functions/get_duration` 里的代码，函数执行时就会报错 `Cannot find module '../common/utils'`。因为 `common/utils.js` 不在入口函数目录中，压根没被打包上去。

这个报错第一次见很容易懵。本地跑得好好的，传上去就找不到模块，原因是 FaaS 上传的是入口函数所在的那个目录，`../` 跳出去的东西不在包里。

要解决这个问题，就得把函数及其依赖的所有代码构建成单个文件，这样部署时只有一个文件，不涉及目录和相对路径的问题了。顺带还有个好处，打包成单文件之后体积小很多，前面提过代码包有 50MB 上限，而 ffmpeg 一个就三十多兆，能省则省。

我们可以使用 ncc 这个工具对函数进行构建，使用方法如下：

```
$ ncc build ./functions/get_duration/index.js -o ./.serverless/get_duration/ -e ali-oss
```

这条命令会把 `functions/get_duration/index.js` 以及它依赖的 `exec`、`getOssClient` 等方法一起编译，合并成一个文件输出到 `./.serverless/get_duration/` 目录中。

这里还要注意 `-e ali-oss` 这个参数，含义是构建时排除 ali-oss 依赖，不把它编译进最终的 `index.js`。因为函数计算的 Node.js 运行时内置了 ali-oss 模块，构建产物里就不用再带一份了。

这个参数背后是个通用套路：凡是运行时已经内置的模块，都应该在打包时排除掉。省下来的不只是包体积，还有冷启动时解压和加载的时间。反过来说，这也让代码跟平台绑得更紧了，换一家云，内置模块列表不一样，这里就得跟着改。

除了对代码进行构建，还需要把 ffmpeg 和 ffprobe 复制到对应的函数目录中。这些步骤都写进了 `build.js`，内容如下：

```js
// build.js
const { exec } = require("./functions/common/utils");

async function build() {
  // 清空编译目录
  await exec("rm -rf .serverless/*");
  // 编译 get_duration 函数
  await exec("mkdir -p ./.serverless/get_duration");
  await exec(`ncc build ./functions/get_duration/index.js -o ./.serverless/get_duration/ -e ali-oss`);
  await exec("cp ./ffprobe ./.serverless/get_duration/ffprobe");
  // 编译 get_meta 函数
  await exec("mkdir -p ./.serverless/get_meta");
  await exec(`ncc build ./functions/get_meta/index.js -o ./.serverless/get_meta/ -e ali-oss`);
  await exec("cp ./ffprobe ./.serverless/get_meta/ffprobe");
 
  //...
}
build();
```

这个脚本干的事很朴素，清空产物目录、给每个函数跑一遍 ncc、把 ffprobe 复制进去。注意每个函数目录都独立复制了一份 ffprobe，也就是说有几个函数就上传几份三十多兆的二进制。函数一多这就很浪费了，更好的做法是用平台的层（Layer）功能，把 FFmpeg 做成一个公共层挂给所有函数共享，代码包里就不用带它了。当年写这套代码时国内 FaaS 的层能力还不完善，现在各家基本都支持了，新项目建议直接用层。

然后在 package.json 中添加两个命令：

- `build` 构建函数
- `deploy` 构建并部署

例如你开发完成后需要部署，就可以直接运行：


```
$ npm run deploy
> serverless-video@1.0.0 deploy
> npm run build && fun deploy
> serverless-video@1.0.0 build
> node build.js
rm -rf .serverless/*
mkdir -p ./.serverless/get_duration
ncc build ./functions/get_duration/index.js -o ./.serverless/get_duration/ -e ali-oss

using template: template.yml
Waiting for service serverless-video to be deployed...
    Waiting for function get_duration to be deployed...
        Waiting for packaging function get_duration code...
        The function get_duration has been packaged. A total of 2 files were compressed and the final size was 15.2 MB
    function get_duration deploy success
......
service serverless-video deploy success
```

部署成功后，我们就可以对函数进行测试了，可以直接在控制台上运行函数，也可以通过fun invoke执行函数：

```
$ fun invoke get_duration
{
    "format": {
        "duration": "170.859000"
    }
}
```

部署日志里那行「A total of 2 files were compressed and the final size was 15.2 MB」值得看一眼，两个文件就是构建产物 `index.js` 和 `ffprobe`，前面那一堆构建操作最后就浓缩成了这个包。养成看这行的习惯，包体积异常变大往往意味着某个该排除的依赖被打进去了。

**强调下面几点：**

- Serverless 除了适合 Web 接口、服务端渲染等场景，还适合 CPU 密集型的任务；
- 基于 Serverless 开发的音视频处理系统，本身就具备弹性、可扩展、低成本、免运维、高可用的能力；
- 对于需要通过代码执行的命令行工具等依赖，部署到 FaaS 平台之前需要为其设置可执行权限；若函数需要调用其他云产品的接口，还要为函数授予相应权限；
- 对于添加水印、视频转码等消耗资源的操作，需要为函数设置较大的内存和超时时间。

最后补一句边界。函数的超时时间是有上限的，各平台不同，量级在十几分钟到一小时之间。真碰上一个几小时的长视频转码，单个函数是扛不住的，得先切片、并行转码、再合并，或者干脆用云厂商现成的转码服务。Serverless 适合把大任务切成小任务并行跑，不适合硬扛一个跑不完的大任务，这条线心里要有。

### 4 使用 React.js 开发 Serverless 服务端渲染应用

对前端工程师来说，Serverless 最大的应用场景之一就是开发服务端渲染（SSR）应用。传统的服务端渲染应用要由前端工程师负责服务器的运维，而这恰恰是很多前端同学不擅长的部分，用 Serverless 来做正好把这块负担卸掉。

这也是四个案例里跟前端日常最贴近的一个，下面先讲架构，再讲实现。

### 5 基于 Serverless 的服务端渲染架构

现在的主流前端框架是 React.js、Vue.js 等，基于这些框架开发的都是单页应用，渲染方式是客户端渲染。代码开发完成后构建出一个或多个 JS 资源，页面加载时先拉这些 JS，再执行 JS 渲染页面。这套模式极大提升了前端开发效率，但也带来了两个新问题。

- **不利于 SEO**，页面源码不再是 HTML，而是渲染 HTML 的 JavaScript，搜索引擎爬虫难以解析其中的内容；
- **初始化性能差**，单页应用的 JS 文件体积通常比较大、加载耗时长，用户先看到的是一段白屏。

为了解决这些问题，很多框架和开发者开始转向服务端渲染，页面加载时由服务端先生成 HTML 返回给浏览器，浏览器直接渲染。在传统的服务端渲染架构中，通常需要前端同学用 Node.js 实现一个服务端渲染应用，应用内每个请求的 path 对应一个路由，由该路由负责渲染对应的 HTML 文档：

![传统服务端渲染架构，Node.js 应用内路由分发](https://blog.poetries.top/img/static/images/20210418174418.png)

传统服务端渲染架构

对前端工程师来说，要实现一个服务端渲染应用，通常面临着一些问题：

- 部署服务端渲染应用需要购买服务器，并配置服务器环境，要对服务器进行运维；
- 需要关注业务量，考虑有没有高并发场景、服务器有没有扩容机制；
- 需要实现负载均衡、流量控制等复杂后端能力等。

这些全是服务端的活儿，很多前端同学都不擅长，好在有了 Serverless。

用 Serverless 做服务端渲染，就是把以往的每个路由拆成一个个函数，在 FaaS 上部署对应的函数，用户请求的 path 对应的就是各自独立的函数。这样一来运维操作全转移到了 FaaS 平台，前端同学开发服务端渲染应用，再也不用关心服务端程序的运维部署。而且 FaaS 上的函数天然具有弹性伸缩能力，流量波峰波谷也不用操心了。

![基于 Serverless 的服务端渲染架构，每个路由对应一个函数](https://blog.poetries.top/img/static/images/20210418174139.png)

基于 Serverless 的服务端渲染架构

如图所示，FaaS 函数接收请求后直接执行代码渲染出 HTML 并返回给浏览器。这是最基本的架构，能满足大部分场景，但要追求极致性能，通常还要加缓存。

![进阶版 Serverless 服务端渲染架构，CDN 与数据库双层缓存](https://blog.poetries.top/img/static/images/20210418174151.png)

进阶版基于 Serverless 的服务端渲染架构

最外层用 CDN 做缓存，能直接减少函数执行次数，也就顺带避开了函数冷启动带来的性能损耗。如果 CDN 里没有 SSR HTML 的缓存，请求继续交给网关处理，网关再去触发函数执行。

函数会先判断缓存数据库中有没有 SSR HTML 的缓存，有就直接返回，没有再渲染一份出来。基于数据库的缓存可以省掉渲染 HTML 的时间，页面加载性能自然更好。

这里想多说两句。SSR 是所有 Serverless 场景里对冷启动最敏感的一类，因为用户就在浏览器前面等着白屏结束。前面讲过冷启动大概一百到七百毫秒，加上 React 渲染本身的耗时，赶上冷启动的那个倒霉用户体感是明显的。所以这两层缓存不是锦上添花，是这套架构能不能上生产的关键。CDN 挡掉的是重复请求，数据库缓存挡掉的是重复渲染，实在还不够，就再叠一个定时预热或者预留实例。

讲了这么多，具体怎么基于 Serverless 实现一个服务端渲染应用呢？

#### 5.1 实现一个 Serverless 的服务端渲染应用

前面第 2 个案例实现了内容管理系统的 Restful API，但没有前端界面。这一节的目标就是给它补上界面，用 Serverless 做服务端渲染（效果如下图）。

![Serverless 服务端渲染内容管理系统的页面效果演示](https://s0.lgstatic.com/i/image/M00/94/3B/Ciqc1GAXxoiANTROADtU9yybMQY209.gif)

该应用主要包含两个页面：

- 首页，展示文章列表；
- 详情页，展示文章详情。

为了方便你进行实践，我为你提供了一份示例代码，你可以直接下载并使用：

```
# 下载代码

$ git clone https://github.com/poetries/serverless-class

# 进入服务端渲染应用目录

$ cd 16/serverless-ssr-cms
```

代码结构如下：

```
.
├── config.js
├── f.yml
├── package-lock.json
├── package.json
├── src
│   ├── api.ts
│   ├── config
│   │   └── config.default.ts
│   ├── configuration.ts
│   ├── index.ts
│   ├── interface
│   │   ├── detail.ts
│   │   └── index.ts
│   ├── mock
│   │   ├── detail.ts
│   │   └── index.ts
│   ├── render.ts
│   └── service
│       ├── detail.ts
│       └── index.ts
├── tsconfig.json
├── tsconfig.lint.json
└── web
    ├── @types
    │   └── global.d.ts
    ├── common.less
    ├── components
    │   ├── layout
    │   │   ├── index.less
    │   │   └── index.tsx
    │   └── title
    │       ├── index.less
    │       └── index.tsx
    ├── interface
    │   ├── detail-index.ts
    │   ├── index.ts
    │   └── page-index.ts
    ├── pages
    │   ├── detail
    │   │   ├── fetch.ts
    │   │   ├── index.less
    │   │   └── render$id.tsx
    │   └── index
    │       ├── fetch.ts
    │       ├── index.less
    │       └── render.tsx
    └── tsconfig.json
```

文件很多，不过不用担心，你只需重点关注 web/pages/ 和 src/service 两个目录：

- web/ 目录中主要是前端页面的代码， web/pages/ 中的文件分别对应着我们要实现的 index（首页）和 detail（详情页）两个页面，这两个页面会使用到 components 目录中的公共组件；
- src/ 目录中主要是后端代码，src/service 目录中的 index.ts  和 detail.ts 则定义了两个页面分别需要用到的接口，为了简单起见，接口数据用的是 src/mock/ 目录里的 mock 数据。

这套目录约定来自 midway-faas 的 SSR 方案，`web/pages/` 下的每个目录自动对应一个路由，最终会被打包成 FaaS 上的一个函数。这就是前面架构图里说的「每个路由拆成一个函数」在代码层面的样子，你不用自己写路由表，目录结构就是路由表。

一个人同时负责前端页面和后端接口时，我习惯先把接口做出来再写页面，这样调试的时候数据是确定的，出了问题能一眼看出是哪一层的事。下面就按这个顺序走。

#### 5.2 首页接口的实现

其源码在 src/service/index.ts 文件中，代码如下：

```ts
// src/service/index.ts
import { provide } from '@midwayjs/faas'
import { IApiService } from '../interface'
import mock from '../mock'
@provide('ApiService')
export class ApiService implements IApiService {
  async index (): Promise<any> {
    return await Promise.resolve(mock)
  }
}
```

这段代码实现了一个 ApiService 类以及 index 方法，该方法会返回首页的文章列表。`@provide('ApiService')` 是依赖注入的装饰器，把这个类注册进容器，后面在渲染上下文 ctx 里就能直接拿到实例，不用手动 new。数据结构如下：

```json
{
    "data":[
        {
            "id":"3f8a198c-60a2-11eb-8932-9b95cd7afc2d",
            "title":"开篇词：Serverless 大热，程序员面临的新机遇与挑战",
            "content":"可能你会认为 Serverless 是最近两年兴起的技术......",
            "date":"2020-12-23"
        },
        {
            "id":"5158b100-5fee-11eb-9afa-9b5f85523067",
            "title":"基础入门：编写你的第一个 Serverless 应用",
            "content":"学习一门新技术，除了了解其基础概念，更重要的是把理论转化为实践...",
            "date":"2020-12-29"
        }
    ]
}
```

服务端渲染时，通过 ctx 拿到 ApiService 实例，调它的方法取文章列表。同一个 ApiService 也会被 `src/api.ts` 调用，后者直接对外暴露 HTTP 接口。

同一份 service 供两条路径复用，这个设计挺关键。服务端渲染首屏走进程内调用，客户端后续交互走 HTTP 接口，逻辑只写一遍，不会出现两边行为不一致的情况。这在传统的前后端分离项目里是做不到的，前端只能通过 HTTP 拿数据。

#### 5.3 首页页面的实现

有了接口后，我们就可以继续实现首页的前端页面了。首页页面的代码在 web/pages/ 目录中，该目录下有三个文件：

- fetch.ts，获取首页数据；
- render.tsx 首页页面 UI 组件代码；
- index.less 样式代码。

首先来看一下 fetch.ts：

```ts
// web/pages/index/fetch.ts
import { IFaaSContext } from 'ssr-types'
import { IndexData } from '@/interface'
interface IApiService {
  index: () => Promise<IndexData>
}
export default async (ctx: IFaaSContext<{
  apiService?: IApiService
}>) => {
  const data = __isBrowser__ ? await (await window.fetch('/api/index')).json() : await ctx.apiService?.index()
  return {
    indexData: data
  }
}
```

这段代码的核心就是 `__isBrowser__` 那个三元表达式。在浏览器里就用 `window.fetch` 请求 `/api/index` 接口拿数据，在服务端渲染时就直接调 `ctx.apiService.index()`。拿到数据后存进 `state.indexData`，UI 组件里就能用了。

`__isBrowser__` 是构建时注入的全局常量，打包器会在两份产物里分别把它替换成 `true` 和 `false`，再靠 tree shaking 把用不到的那个分支整段删掉。所以服务端的产物里不会残留 `window.fetch`，浏览器的产物里也不会打包进 apiService。这是同构代码的标准做法，不理解这一点，很容易写出「服务端报 window is not defined」的经典错误。

首页的 UI 组件 render.tsx 代码如下：

```tsx
// web/pages/index/render.tsx
import React, { useContext } from "react";
import { SProps, IContext } from "ssr-types";
import Navbar from "@/components/navbar";
import Header from "@/components/header";
import Item from "@/components/item";
import { IData } from "@/interface";
import styles from "./index.less";
export default (props: SProps) => {
  const { state } = useContext<IContext<IData>>(window.STORE_CONTEXT);
  return (
    <div>
      <Navbar {...props} isHomePage={true}></Navbar>
      <Header></Header>
      <div className={styles.container}>
        {state?.indexData?.data.map((item) => (
          <Item
            {...props}
            id={item.id}
            key={item.id}
            title={item.title}
            content={item.content}
            date={item.date}
          ></Item>
        ))}
      </div>
    </div>
  );
};
```

在 UI 组件中，通过 `useContext` 拿到刚才由 fetch.ts 存进 state 的数据，再用这些数据渲染 UI。组件本身跟普通的 React 组件没有任何区别，这也是同构方案最舒服的地方，你写的还是那套熟悉的 React。UI 组件主要由三部分组成。

- Navbar：导航条。
- Header：页面标题。
- Item：每篇文章的简介。

`state?.indexData?.data.map(...)` 里那两个可选链不是随手加的。服务端渲染时数据一定有，但客户端 hydrate 或者路由切换的瞬间可能还没到，少一个问号就是一次线上白屏。

![Serverless SSR 内容管理系统的首页效果](https://blog.poetries.top/img/static/images/20210418174309.png)

#### 5.4 详情页接口的实现

完成了首页后，就可以实现详情页了。详情页与首页整体类似，区别在于它需要传参数查询某一条数据。

详情页接口在 src/service/detail.ts 中，代码如下所示：

```ts
// src/service/detail.ts
import { provide } from '@midwayjs/faas'
import { IApiDetailService } from '../interface/detail'
import mock from '../mock/detail'
@provide('ApiDetailService')
export class ApiDetailService implements IApiDetailService {
  async index (id): Promise<any> {
    return await Promise.resolve(mock.data[id])
  }
}
```

这段代码实现了一个 ApiDetailService 类以及 index 方法，入参 id 就是文章 ID，根据它从 mock 数据中查出文章详情。真实项目里把 `mock.data[id]` 换成第 2 个案例里的 `client.getRow` 就行，两个案例正好能接起来。

文章详情数据如下：

```json
{
    "title":"Serverless 大热，程序员面临的新机遇与挑战",
    "wordCount":2540,
    "readingTime":10,
    "date":"2020-12-23 12:00:00",
    "content":"可能你会认为 Serverless 是最近两年兴起的技术，实际上，Serverless 概念从 2012 年就提出来了，随后 AWS 在 2014 年推出了第一款 Serverless 产品 Lambda，开启了 Serverless 元年... "
}
```

#### 5.5 详情页页面的实现

和首页一样，详情页也包含数据请求、UI 组件和样式代码三个文件。

数据请求文件的命名和首页一样，都是 fetch.ts。不同的是详情页要先拿到文章 ID，浏览器场景从 URL 里取，服务端渲染场景从上下文里取，再根据 ID 查详情。代码如下：

```ts
import { RouteComponentProps } from "react-router";
export default async (ctx) => {
  let data;
  if (__isBrowser__) {
    const id = (ctx as RouteComponentProps<{ id: string }>).match.params.id;
    data = await (await window.fetch(`/api/detail/${id}`)).json()
  } else {
    const id = /detail\/(.*)(\?|\/)?/.exec(ctx.req.path)[1];
    data = await ctx.apiDeatilservice.index(id);
  }
  return {
    detailData: data,
  };
};
```

两条分支拿 ID 的方式差别挺大。浏览器这边有 react-router，直接从 `match.params.id` 取；服务端这边没有路由库，只能拿正则去 `ctx.req.path` 里抠。`/detail\/(.*)(\?|\/)?/` 这个正则写得比较宽松，`(.*)` 是贪婪匹配，URL 后面带 query 参数时容易连着一起抓进来。真项目里建议用框架提供的路径参数，或者把正则收紧成 `/detail\/([^/?]+)/`。

详情页的 UI 组件文件名是 `render$id.tsx`，`$id` 表示该组件带一个 id 参数，这样访问 `/detail/xxx` 这个路由时（xxx 是变量），就会匹配到 `web/pages/detail/render$id.tsx` 这个页面。文件名即路由，跟 Next.js 的 `[id].tsx` 是同一个思路，只是符号不同。

`render$id.tsx` 详细代码如下：

```tsx
import React, { useContext } from "react";
import { IContext, SProps } from "ssr-types";
import { Data } from "@/interface";
import Navbar from "@/components/navbar";
import Content from "@/components/content";
import Title from "@/components/title";
import Tip from "@/components/tip";
import styles from "./index.less";
export default (props: SProps) => {
  const { state } = useContext<IContext<Data>>(window.STORE_CONTEXT);
  return (
    <div>
      <Navbar {...props}></Navbar>
      <div className={styles.container}>
        <Title>{state?.detailData?.title}</Title>
        <Tip
          date={state?.detailData?.date}
          wordCount={state?.detailData?.wordCount}
          readingTime={state?.detailData?.readingTime}
        />
        <Content>{state?.detailData?.content}</Content>
      </div>
    </div>
  );
};
```

详情页的 UI 组件由四部分组成。

- Navbar：导航条。
- Title：文章标题。
- Tip：文章发布时间、字数等提示。
- Content：文章内容。

![Serverless SSR 内容管理系统的文章详情页效果](https://blog.poetries.top/img/static/images/20210418174323.png)

#### 5.6 应用部署

代码开发完成后，你可以通过下面的命令在本地启动应用：

```bash
$ npm start
...
[HPM] Proxy created: /asset-manifest  -> http://127.0.0.1:8000
 Server is listening on http://localhost:3000
```

应用启动后打开浏览器访问 [http://localhost:3000](http://localhost:3000/) 就能看到效果。日志里那行 `[HPM] Proxy created` 说明本地起了代理，把前端资源请求转到 webpack 的 dev server 上，这样改代码能热更新，跟平时开发 React 的体验一致。

在本地开发测试完成后，接下来把它部署到函数计算，运行 `npm run deploy` 即可：

```bash
$ npm run deploy
...
service  serverless-ssr-cms deploy success
......
The assigned temporary domain is http://41506101-1457216987974698.test.functioncompute.com，expired at 2021-02-04 00:35:01, limited by 1000 per day.
......
Deploy success
```

`npm run deploy` 其实是构建代码和部署应用两个步骤，而这两步都跑在本机。这就埋了个隐患，团队里每个人的本地环境不完全一样，Node 版本、依赖版本、甚至操作系统都可能有差异，构建产物跟着不同，最后线上跑的到底是哪一份谁也说不清。**更好的实践是把构建和部署收到持续集成流程里，用统一的环境产出唯一的构建产物。**

这一点在音视频那个案例里更要命，那边还涉及二进制文件的权限位，本机打包和 CI 打包出来的东西可能完全不同。

应用部署成功后会自动创建一个测试域名，例如 [http://41506101-1457216987974698.test.functioncompute.com](http://41506101-1457216987974698.test.functioncompute.com/)，打开它就能看到最终效果。注意日志里写了 `expired at 2021-02-04` 和 `limited by 1000 per day`，这个临时域名有有效期，每天调用次数也有上限，只能用来验收，正式对外必须绑自定义域名。

讲到这儿，基于 Serverless 的服务端渲染应用就开发完成了。

#### 5.7 SSR 案例的几点结论

基于 Serverless 做服务端渲染，整体实现并不复杂。它最大的价值是把服务器的运维和扩容这两件事从前端同学的工作清单里划掉了，剩下的还是写 React。有了服务端渲染之后，我也建议你顺手把持续集成流程补齐，整条研发链路打通，构建发布的风险会小很多。

当然，要达到页面的极致体验，还有不少工作要做，比如：

- 将静态资源部署到 CDN，提升资源加载速度；
- 针对页面进行缓存，减少函数冷启动对性能的影响；
- 对服务端异常进行降级处理等等。

不过这些事不管用不用 Serverless 都得做，不算 Serverless 带来的额外负担。这个案例我想强调以下几点：

- 基于 Serverless 的服务端渲染应用，可以让我们不用关心服务器的运维，应用也天然具有弹性；
- 基于 Serverless 开发服务端渲染应用，建议你完善业务的持续集成流程；
- 要达到页面的极致性能，还需要考虑将静态资源部署到 CDN、对页面进行缓存等技术；
- 对于服务端渲染应用，建议你完善业务的服务降级能力，进一步提高稳定性。

最后那条降级值得展开一句。SSR 函数一旦挂了，用户看到的是整页 500，比客户端渲染的局部报错严重得多。所以稳妥的做法是给渲染逻辑套一层兜底，服务端渲染失败就退回去吐一个只带挂载点的 HTML 骨架，让浏览器接着做客户端渲染。用户顶多多等一会儿，总比看到一片白强。

## 总结

回头看这一整篇，Serverless 真正卖给你的东西其实只有一件，把服务器的存在感降到零，让你只对业务代码负责。前面拆的每一块，都是围着这一件事转的。

这几条是我认为最该带走的：

- **函数外面只放无状态的东西**。执行上下文会跨请求复用，把数据库连接、SDK 客户端放外面能省下冷启动开销；把 Session、用户信息放外面就等着串号。这条踩过一次就再也不会忘。
- **选数据库先看连接模型，再看性能**。函数实例可以瞬间起几百个，关系型数据库的连接池会被打爆，表格存储这类走 HTTP 的 Serverless NoSQL 才是配套的选择。
- **鉴权用 JWT，但要清楚它的边界**。Payload 是明文可读的，只放非敏感标识；签发出去的 token 撤不回来，有效期要短，敏感操作再配黑名单。
- **二进制依赖和公共代码得靠构建解决**。ncc 打成单文件绕开相对路径问题，运行时内置的模块用 `-e` 排除掉，能上层（Layer）就上层，代码包越小冷启动越快。
- **SSR 场景务必配缓存**。CDN 挡重复请求，缓存库挡重复渲染，再加降级兜底，这三层不是优化项，是能不能上生产的门槛。

最后说句实在的。这几年 Serverless 没有像 2021 年很多人预测的那样吃掉一切，反而是找到了自己的位置：定时任务、事件处理、流量波动大的接口、个人项目和内部工具，这几类用它非常香；长连接、有状态服务、需要精细控制运行时的场景，还是老老实实用容器。工具就是工具，用在对的地方才划算。

文中的价格、控制台截图和运行时版本都是 2021 年 4 月的状态，各家平台这几年都调整过。原理和踩坑那部分我认为到现在依然成立，具体数字请以官方文档为准。

## 参考

- [阿里云函数计算产品文档](https://help.aliyun.com/product/50980.html)
- [腾讯云云函数产品文档](https://cloud.tencent.com/document/product/876/41762)
- [Vercel 官方文档](https://vercel.com/docs)
- [JWT 官方站点与调试工具](https://jwt.io)
- [FFmpeg 官方文档](https://ffmpeg.org/documentation.html)
- [ncc 打包工具仓库](https://github.com/vercel/ncc)
- [微信小程序 Serverless 云开发实践](https://feinterview.poetries.top/blog/serverless-cloud-weapp)
- [前端进阶之旅](https://interview.poetries.top)
