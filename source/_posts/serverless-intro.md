---
title: serverless简介及应用
date: 2021-04-16 15:24:08
tags: serverless
categories: Front-End
---


## 什么是Serverless

> Serverless 能解决什么问题？理清 Serverless 要解决的问题其实很简单，我们可以从字面上把它拆开来看。Server 这里指服务端，它是 Serverless 解决问题的边界；而 less 我们可以理解为较少关心，它是 Serverless 解决问题的目的。组合在一起就是“较少关心服务端”

- 第一种：`狭义 Serverless`（最常见）= `Serverless computing 架构` = `FaaS 架构` = `Trigger（事件驱动）+ FaaS（函数即服务）+ BaaS`（后端即服务，持久化或第三方服务）= `FaaS + BaaS`
- 第二种：广义 `Serverless` = `服务端免运维` = `具备 Serverless 特性的云服务`

![](http://img-repo.poetries.top/images/20210416155216.png)

## 编写你的第一个 Serverless 应用

![](http://img-repo.poetries.top/images/20210418151945.png)

- FaaS 平台都支持 Node.js、Python 、Java 等编程语言；
- FaaS 平台都支持 HTTP 和定时触发器（这两个触发器最常用）。此外各厂商的 FaaS 支持与自己云产品相关的触发器，函数计算支持阿里云表格存储等触发器；
- FaaS 的计费都差不多，且每个月都提供一定的免费额度。其中 GB-s 是指函数每秒消耗的内存大小，比如1G-s 的含义就是函数以 1G 内存执行 1 秒钟。超出免费额度后，费用基本都是 0.0133元/万次，0.00003167元/GB-s。所以，用 FaaS 整体费用非常便宜，对一个小应用来说，几乎是免费的。

**以阿里云函数为例**

```js
// logic.js
exports.sayHello = function (name) {
  return `Hello, ${name}!`;
}
```

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

> 把业务逻辑拆分到入口函数之外

### 触发器及事件对象

1. HTTP 触发器

> 在众多 FaaS 平台中，函数计算直接提供了 HTTP 触发器，HTTP 触发器通过发送 HTTP 请求来触发函数执行，一般都会支持 POST、GET、PUT、HEAD 等方法。所以你可以用 HTTP 触发器来构建 Restful 接口或 Web 系统。

![](http://img-repo.poetries.top/images/20210418152334.png)

HTTP 触发器会根据 HTTP 请求和请求参数生成事件，然后以参数形式传递给函数。那么 HTTP 触发器的入口函数参数中的 request 和 response 参数具体有哪些属性呢？

其实， request 和 response 参数本质上与 Express.js 框架的 request 和 response 类似

2. API 网关触发器

API 网关触发器与 HTTP 触发器类似，它主要用于构建 Web 系统。本质是利用 API 网关接收 HTTP 请求，然后再产生事件，将事件传递给 FaaS。FaaS 将函数执行完毕后将函数返回值传递给 API 网关，API 网关再将返回值包装为 HTTP 响应返回给用户。

![](http://img-repo.poetries.top/images/20210418152415.png)

3. 定时触发器

> 定时触发器就是定时执行函数，它经常用来做一些周期任务，比如每天定时查询天气并给自己发送通知、每小时定时处理分析日志等等。

![](http://img-repo.poetries.top/images/20210418152436.png)

### 日志输出

无论你用什么编写语言开发 Serverless 应用，你都要在合适的时候输出合适的日志信息，方便调试应用、排查问题。在 Serverless 中，日志输出和传统应用的日志输出没有太大区别，只是日志的存储和查询方式变了。

以函数计算为例，如果你在控制台创建函数，则函数计算默认会使用日志服务来为你存储日志。在 “日志查询” 标签下可以查看函数调用日志。日志服务是一个日志采集、分析产品，所以如果你要实现业务监控，则可以将日志输出到日志服务，然后在日志服务中对日志进行分析，并设置报警项。

![](http://img-repo.poetries.top/images/20210418152600.png)

## Serverless 应用是怎么运行的

> Serverless 应用本质上是由一个个 FaaS 函数组成的，Serverless 应用的每一次运行，其实是单个或多个函数的运行，所以 `Serverelss 的运行原理，本质上就是函数的运行原理`

**FaaS 是怎么运行的**

![](http://img-repo.poetries.top/images/20210416155334.png)

![](http://img-repo.poetries.top/images/20210416155401.png)

### 函数调用链路：事件驱动函数执行

> 对于 FaaS 函数来说，一方面可以通过事件来触发执行，另一方面也可以直接调用 API 来执行。FaaS 平台都提供了执行函数的 API

![](http://img-repo.poetries.top/images/20210418151354.png)

### 函数生命周期：冷启动与热启动

> FaaS 中的冷启动是指从调用函数开始到函数实例准备完成的整个过程。冷启动我们关注的是启动时间，启动时间越短，我们对资源的利用率就越高。现在的云服务商，基于不同的语言特性，冷启动平均耗时基本在 `100～700 毫秒`之间。得益于 Google 的 JavaScript 引擎 Just In Time 特性，Node.js 在冷启动方面速度是最快的。

![](http://img-repo.poetries.top/images/20210416155824.png)

> 注意，FaaS 服务从 0 开始，启动并执行完一个函数，只需要 100 毫秒。这也是为什么 FaaS 敢缩容到 0 的主要原因。通常我们打开一个网页有个关键指标，响应时间在 1 秒以内，都算优秀。这么一对比，100 毫秒的启动时间，对于网页的秒开率影响真的极小

> 在 FaaS 平台中，函数默认是不运行的，也不会分配任何资源。甚至 FaaS 中都不会保存函数代码。只有当 FaaS 接收到触发器的事件后，才会启动并运行函数。整个函数的运行过程可以分为四个阶段

![](http://img-repo.poetries.top/images/20210418151433.png)

- 下载代码： FaaS 平台本身不会存储代码，而是将代码放在对象存储中，需要执行函数的时候，再从对象存储中将函数代码下载下来并解压，因此 FaaS 平台一般都会对代码包的大小进行限制，通常代码包不能超过 50MB。
- 启动容器： 代码下载完成后，FaaS 会根据函数的配置，启动对应容器，FaaS 使用容器进行资源隔离。
- 初始化运行环境： 分析代码依赖、执行用户初始化逻辑、初始化入口函数之外的代码等。
- 运行代码： 调用入口函数执行代码。

> 当函数第一次执行时，会经过完整的四个步骤，前三个过程统称为“冷启动”，最后一步称为 “热启动”。

整个冷启动流程耗时可能达到百毫秒级别。函数运行完毕后，运行环境会保留一段时间，可能 2 ~ 5 分钟，这和具体云厂商有关。如果这段时间内函数需要再次执行，则 FaaS 平台就会使用上一次的运行环境，这就是“执行上下文重用”，函数的这个启动过程也叫“热启动”。“热启动” 的耗时就完全是启动函数的耗时了。当一段时间内没有请求时，函数运行环境就会被释放，直到下一次事件到来，再重新从冷启动开始初始化。

下面是一个函数的请求示意图，其中 “请求1” “请求3” 是冷启动，“请求2” 是热启动

![](http://img-repo.poetries.top/images/20210418151527.png)

> 函数执行完毕后销毁运行环境，虽然对首次函数执行的性能有损耗，但极大提高了资源利用效率，只有需要执行代码的时候才初始化环境、消耗硬件资源。并且如果你的应用请求量比较大，则大部分时候函数的执行可能都是热启动

### FaaS 是怎么分层的


![](https://files.mdnice.com/user/6541/5d7d3769-4fc0-4036-bd1b-91e9a650c2c3.png)

> 你的 FaaS 实例执行时，就如上图所示，至少是 3 层结构：容器、运行时 Runtime、具体函数代码。

容器你可以理解为操作系统 OS。代码要运行，总需要和硬件打交道，容器就是模拟出内核和硬件信息，让你的代码和 Runtime 可以在里面运行。容器的信息包括内存大小、OS 版本、CPU 信息、环境变量等等。目前的 FaaS 实现方案中，容器方案可能是 Docker 容器、VM 虚拟机，甚至 Sandbox 沙盒环境。运行时 Runtime，就是你的函数执行时的上下文 context。Runtime 的信息包括代码运行的语言和版本，例如 Node.js v10，Python3.6；可调用对象，例如 aliyun SDK；系统信息，例如环境变量等等。

> - 这样分层有什么好处呢？容器层适用性更广，云服务商可以预热大量的容器实例，将物理服务器的计算资源碎片化。Runtime 的实例适用性较低，可以少量预热；容器和 Runtime 固定后，下载你的代码就可以执行了。通过分层，我们可以做到资源统筹优化，这样就能让你的代码快速低成本地被执行。
> - 理解了分层，我们再回想一下 FaaS 分层对应冷启动的过程，其实你就不难理解云服务商负责的就是容器和 Runtime 的准备阶段了。而开发者自己负责的则是函数执行阶段。一旦容器 &Runtime 启动后，就会维持一段时间，这段时间内的这个函数实例就可以直接处理用户数据请求。当一段时间内没有用户请求事件发生（各个云服务商维持实例的时间和策略不同），则会销毁这个函数实例。

![](http://img-repo.poetries.top/images/20210416160251.png)

- 纯 FaaS 应用调用链路由函数触发器、函数服务和函数代码三部分组成，它们分别替代了传统服务端运维的负载均衡 & 反向代理，服务器 & 应用运行环境，应用代码部署
- 对比传统应用托管 PaaS 平台，FaaS 应用最大的不同就是，FaaS 应用可以缩容到 0，在事件到来时极速启动，Node.js 的函数甚至可以做到 100ms 启动并执行。
- FaaS 在设计上牺牲了用户的可控性和应用场景，来简化代码模型，并且通过分层结构进一步提升资源的利用率，这也是为什么 FaaS 冷启动时间能这么短的主要原因。关于 FaaS 的 3 层结构，你可以这么想象：容器层就像是 Windows 操作系统；Runtime 就像是 Windows 里面的播放器暴风影音；你的代码就像是放在 U 盘里的电影

### 总结

- 组成 Serverless 应用的函数是事件驱动的，但你也可以直接同 API 调用函数；
- 函数可以同步调用或异步调用，定时触发器函数是异步调用的，异步调用函数建议主动记录并处理异步调用结果；
- 函数的启动过程分为下载代码、启动容器、启动运行环境、执行代码四个步骤，前三个步骤称为冷启动，最后一个步骤称为热启动

## 如何提高应用开发调试和部署效率

### 应用管理

> Serverless 应用是由函数组成的，所以应用的管理主要就是函数的管理。各个 FaaS 平台其实也考虑到了这一点，比如函数计算的 “服务”功能或 Lambda 的 “应用” 功能。你可以把一个应用的函数都创建在同一个 “服务” 下，一个 “服务” 即代表一个应用。

![](http://img-repo.poetries.top/images/20210418152848.png)

> 那么如何去描述 “服务” 和 “函数” 的关系呢？因为二者是静态的，不会在代码运行时改变，所以你可以用 YAML 或 JSON 配置文件来表示（我推荐 YAML，因为它可以编写注释，可读性更好）。在创建函数时，你还要指定函数的入口、编程语言、触发器等信息。所以 YAML 文件的内容可能是这样的：

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

### 应用开发

有了应用配置文件之后，开发者就可以开始开发代码了。为了进一步简化用户操作，你甚至可以提供一些代码模板，然后提供 init 命令让开发者基于模板一键生成一个 Serverless 应用。例如

```
$ serverless init --template hello-world
|-- hello.js
|-- serverless.yaml
```

```bash
# serverless.yaml
service: myservice
functions:
  hello:
    handler: hello.main
    events:
        - http
```

## serverless应用

### 阿里云函数计算

> https://fc.console.aliyun.com/fc/overview

选择一个模板，体验一下

![](https://files.mdnice.com/user/6541/d63653ac-0a1d-4dfa-9a2a-879f23aa803e.png)

> 云函数使用指南 https://help.aliyun.com/product/50980.html

### 腾讯云函数

![](http://img-repo.poetries.top/images/20210416161014.png)

> 云函数使用指南 https://cloud.tencent.com/document/product/876/41762

### 使用vercel部署你的应用-推荐

vercel是用过的最好用的网站托管服务，我们可以在上面部署api、静态页面等。可以和GitHub深度绑定，推送代码，vercel会帮我们检测自动部署

**新建项目**

![](http://img-repo.poetries.top/images/20210416161535.png)

导入GitHub的某一个项目部署

![](http://img-repo.poetries.top/images/20210416161621.png)

![](http://img-repo.poetries.top/images/20210416161653.png)

![](http://img-repo.poetries.top/images/20210416161728.png)

![](http://img-repo.poetries.top/images/20210416161748.png)

> 部署完成后，可以在控制面板看到，vercel每次部署都动态帮我生成一个地址，可以直接访问你的应用

![](http://img-repo.poetries.top/images/20210416161906.png)

**绑定GitHub应用**

![](http://img-repo.poetries.top/images/20210416162735.png)

> 每次提交代码到GitHub，vercel都会自动帮我们构建发布

![](http://img-repo.poetries.top/images/20210416162612.png)


**绑定域名**

我们可以绑定自己的自定义域名

![](http://img-repo.poetries.top/images/20210416162045.png)

> 我们还可以使用vercel部署node小型应用，非常的方便。更多参考文档 https://vercel.com/docs

