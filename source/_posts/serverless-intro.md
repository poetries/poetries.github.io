---
title: serverless简介及应用
date: 2021-04-16 15:24:08
tags: serverless
categories: Front-End
---


## 一、什么是Serverless

> Serverless 能解决什么问题？理清 Serverless 要解决的问题其实很简单，我们可以从字面上把它拆开来看。Server 这里指服务端，它是 Serverless 解决问题的边界；而 less 我们可以理解为较少关心，它是 Serverless 解决问题的目的。组合在一起就是“较少关心服务端”

- 第一种：`狭义 Serverless`（最常见）= `Serverless computing 架构` = `FaaS 架构` = `Trigger（事件驱动）+ FaaS（函数即服务）+ BaaS`（后端即服务，持久化或第三方服务）= `FaaS + BaaS`
- 第二种：广义 `Serverless` = `服务端免运维` = `具备 Serverless 特性的云服务`

![](http://img-repo.poetries.top/images/20210416155216.png)

## 二、编写你的第一个 Serverless 应用

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

## 三、Serverless 应用是怎么运行的

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

## 四、如何提高应用开发调试和部署效率

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


## 五、serverless应用


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


## 六、场景案例

### 1 使用 Serverless 实现登录注册功能

#### 1.1 身份认证的技术方案

**Cookie-Session**

> Cookie-Session 方式是早期最常用的身份认证方式，直到现在很多 Web 网站依然使用这种方式。其认证流程是

- 用户在浏览器中输入账号密码登录；
- 服务端验证通过后，将用户信息保存在 Session 中并生成一个 Session ID；
- 然后服务端将 Session ID 放在 HTTP 响应头的 cookie 字段中；
- 浏览器收到 HTTP 响应后，将 cookie 保存在浏览器中，cookie 内容就是之前登录时生成的 Session ID；
- 用户再访问网站时，浏览器请求头就会自动带上 cookie 信息；
- 服务端接收到请求后，从 cookie 获取到 Session ID，然后根据 Session ID 解析出用户信息。

![](http://img-repo.poetries.top/images/20210418165707.png)

**这种方案存在两个主要问题：**

- 服务端的 Session ID 是直接存储在内存中的，在分布式系统中无法共享登录状态；
- cookie 是浏览器的功能，手机 App 等客户端并不支持 cookie，所以该方案不适用于非浏览器的应用。

第一个问题也是 Cookie-Session 方案应用于 Serverless 架构的主要问题，因为 Serverless 应用是无状态的，内存中的数据用完即销毁，多个请求间无法共享 Session。解决该问题也比较容易， 就是用一个共享存储来保存 Session 信息，最常见的就是 Redis，因为 Redis 是一个内存数据库，读写速度很快。

> 于是 Cookie-Session 的身份认证方案就发生了变化：

![](http://img-repo.poetries.top/images/20210418165751.png)

> 与早期方案不同，用户登录时，该方案会把用户信息保存在 Redis 中，而不是内存中，然后服务端依然会将 Session ID 返回给浏览器，浏览器将其保存在 cookie 中。而之后非登录的请求，浏览器依然会将包含 Session ID 的 cookie 放在请求头中发送给服务端，服务端拿到 Session ID 后，从 Redis 中查询出用户信息。这样就可以解决分布式、无状态的系统中用户登录状态共享问题。

不过这个方案依旧无法解决非浏览器场景的身份认证问题，所以 JWT 方案诞生了。

**JWT**

> JWT 是（JSON Web Token）的简称，其原理是：

- 服务端认证通过后，根据用户信息生成一个 token 返回给客户端；
- 客户端将 token 存储在 cookie 或 localStorage 中；
- 之后客户端每次请求都需要带上 token，通常是将 token 放在 HTTP 请求头的 Authorization 字段中；
- 服务端接收到 token 后，验证 token 的合法性，并从 token 中解析出用户信息。

![](http://img-repo.poetries.top/images/20210418165833.png)

> token 是个比较长字符串，格式为 `Header.Payload.Signature`，由`.`分隔为三部分。下面是一个实际的 token 示例：

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJqYWNrIiwiaWF0IjoxNjEwODg1MTcxfQ.KIduc-undaZ0z-Bt4wjGZIK5fMlx1auVHl_G1DvGDCw
```

可能有同学会担忧： token 是根据用户信息生成的，这样会不会泄露用户信息呢？其实不用担心，因为生成 token 的加密算法是不可逆的，并且 token 也可以设置过期时间，所以 token 字符串本身不会泄露用户信息。

> 基于 JWT ，客户端可以使用自己特有的存储来保存 token，不依赖 cookie，所以 JWT 可以适用于任意客户端。并且使用 JWT 进行身份认证，服务端就不用存储用户信息了，这样服务端就是无状态的。因此 JWT 这种身份认证方案，也非常适合 Serverless 应用。

接下来，就基于 JWT ，带你从 0 到 1实现一个登录注册应用

#### 1.2 从 0 到 1 实现一个登录注册应用

**应用初始化**

> 首先安装 `express`、`body-parser` 和 `@webserverless/fc-express` 等依赖：

```
$ npm i express body-parser @webserverless/fc-express -S
```

> @webserverless/fc-express 的作用是将函数计算的 HTTP 或 API 网关触发器参数转换为 Express.js 框架的参数，这样你就可以很方便在函数计算中使用 Express.js 了

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
- 使用 `@webserverless/fc-express` 将函数计算的请求转发给 `Express.js` 应用`@webserverless/fc-express 可以将函数参数转换为 `Express.js` 的路由参数。


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

> 部署成功后，我们就可以获取到函数计算提供的测试 HTTP Endpoint，然后就可以通过 curl 命令进行测试应用是否正常运行：

```
$ curl https://1457216987974698.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/serverless/auth-app/
{"success":true,"data":"Hello Serverless!"}
```

#### 1.3 实现注册功能

> 注册的逻辑是：先获取用户输入的用户名和密码，然后判断用户是否存在，如果不存在就将其存入表格存储数据库

这里我们使用的数据库是表格存储。 可能你使用的比较多的是 MySQL，之所以选用表格存储而不是 MySQL，是因为表格存储可以直接通过 Restful API 进行读写，并且弹性可扩展，更适合 Serverless 应用。使用表格存储时，你要先创建一个表格存储实例，然后创建一个 user 表。为了方便，我也给你提供了一个创建 user 表的脚本：[create-table](https://github.com/nodejh/serverless-class/tree/master/15/create-table)。

> 接下来继续编写代码。由于要使用表格存储，所以首先需要安装 tablestore 依赖，然后在 index.js 中初始化表格存储 client：

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

> 现在我们就可以定义一个路由来处理用户的注册请求了。代码如下所示，首先我们根据 name 从表格存储中查询用户信息，如果用户已存在，则直接返回；如果用户不存在，则将用户信息写入表格存储。

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

> 至此注册功能就完成了，你可以将代码部署到函数计算上，像下面这样通过 curl 命令来模拟用户请求，验证功能是否正常：

```bash 
$ curl https://1457216987974698.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/serverless/auth/login \
-d "name=jack&password=123456&age=18" \
-X POST
{"success":true}

$ curl https://1457216987974698.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/serverless/auth/login \
-d "name=jack&password=123456&age=18" \
-X POST
{"success":false,"message":"用户已存在"}
```

注册功能完成后，就可以继续实现登录功能了。

#### 1.4 实现登录功能

登录就是验证用户输入的用户名密码是否正确。

> 首先根据用户输入的 name 从表格存储中查询出用户信息，然后对比用户密码与数据库中的用户密码是否一致，如果一致，则登录成功；否则登录失败。登录成功后，还需要根据用户信息生成一个 token 返回给用户。具体怎么实现呢？

前面我们提到，Serverless 中最通用的身份认证方案是 JWT，所以我们首先需要安装 Node.js 中的 JWT 依赖包 jsonwebtoken：

```
$ npm install jsonwebtoken -S
```

> 然后在代码中引入 jsonwebtoken ，并定义 SECRET。SECRET 是用来加密和解密 token 的密钥，非常重要，且不能泄露。

> 接下来在代码中定义 `/login` 路由来处理用户请求。这段代码中，我们首先验证了用户密码是否正确，密码正确后，再使用 `jwt.sign()` 方法，根据用户信息生成了 token，最后将 token 返回给客户端，客户端需要将 token 保存下来。之后客户端每次请求，都需要带上 token 进行身份认证。

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

> 那么问题来了：对于需要登录后才能访问的接口，应该怎么根据 token 验证用户身份呢？别急，我们继续下面的学习。

#### 1.5 验证用户身份

> 前面提到，登录成功后，客户端需要将 token 保存下来，然后在接下来的请求中，都需要带上 token。通常会将 token 放在 HTTP 请求头中，格式通常为：

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

> 首先我们定义了 /user 路由，然后通过请求头拿到 token 信息，最后使用 `jwt.verify()` 对 token 进行解密，并从中得到用户信息，如果用户传入的 token 无法解析，则说明用户身份异常。

同样，我们可以将代码部署到函数计算并进行测试：

```js 
curl https://1457216987974698.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/serverless/auth-app/user \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiamFjayIsImFnZSI6IjE4IiwicGFzc3dvcmQiOiIqKioqKioiLCJpYXQiOjE2MTA5MDY5MTJ9.qzNZarWbpDUA8-SO6nLd4ffEUR1IVOWKGXiocHV7MkU"
{"success":true,"data":{"name":"jack","age":"18","password":"******","iat":1610905944}}

# 使用错误的 token 进行身份认证
$ curl https://1457216987974698.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/serverless/auth-app/user -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiamFjayIsImFnZSI6IjE4IiwicGFzc3dvcmQiOiIqKioqKioiLCJpYXQiOjE2MTA5MDY5MTJ9.qzNZarWbpDUA8-SO6nLd4ffEUR1IVOWKGXiocHV7Mk"
{"success":false,"data":"身份认证失败"}
```

> 到此为止，一个 Serverless 架构的登录注册功能就完成了，我们也基于 JWT 实现了 Serverless 中的身份认证。


**强调这样几点：**

- Cookie-Session 的身份认证方式，是在服务端存储 Session 信息，客户端（浏览器）通过 cookie 存储 Session ID；
- JWT 的身份认证方式，是在服务端根据用户信息生成 token，客户端保存 token；
- Cookie-Session 的认证方案通常是有状态的，对于分布式、无状态的应用，需要将 Session 保存在共享存储中；
- JWT 的认证方式通常是无状态的，所以比较适合 Serverless 应用。

### 2 基于 Serveless 构建弹性可扩展的 Restful API

> API 是使用 Serverless 最常见，也是最适合的场景之一。和 Serverful 架构的  API 相比，用 Serverless 开发 API 好处很多：

- 不用购买、管理服务器等基础设施，不用关心服务器的运维，节省人力成本；
- 基于 Serverless 的 API，具备自动弹性伸缩的能力，能根据请求流量弹性扩缩容，让你不再担心流量波峰、波谷；
- 基于 Serverless 的 API 按实际资源使用量来付费，节省财务成本。

> 因为好处很多，很多开发者跃跃欲试，但在实践过程中却遇到了很多问题，比如怎么设计最优的架构？怎么组织代码？怎么管理多个函数？所以今天我就以开发一个内容管理系统为例，带你学习怎么基于 Serverless 去开发一个 Restful API，解决上述共性问题。

首先，我们需要对内容管理系统进行架构设计。

#### 2.1 内容管理系统的架构设计

在进行架构设计前，你要明确系统的需求。对于一个内容管理系统，最核心的功能（也是这一讲要实现的功能），主要有这样几个：

- 用户注册；
- 用户登录；
- 发布文章；
- 修改文章；
- 删除文章；
- 查询文章。

> 这 6 个功能分别对应了我们要实现的 Restful API。为了方便统一管理 API，在 Serverless 架构中我们通常会用到 API 网关，通过 API 网关触发函数执行，并且基于  API 网关我们还可以实现参数控制、超时时间、IP 黑名单、流量控制等高级功能。

对于文章管理相关的 Restful API，用户发布文章前需要先登录，你已经知道在 Serverless 中可以用 JWT 进行身份认证，咱们的管理系统中的登录注册功能也将沿用上一讲的内容。

> 在传统的 Serverful 架构中，通常会用 MySQL 等关系型数据库存储数据，但因为关系型数据库要在代码中维护连接状态及连接池，且一般不能自动扩容，并不适合 Serverless 应用，所以在 Serverless 架构中，通常选用表格存储等 Serverless NoSQL 数据来存储数据。

基于 JWT 的身份认证方案、数据存储方案，我们可以画出 Serverless 的内容管理系统架构图：

![](http://img-repo.poetries.top/images/20210418171452.png)

- 图中主要表达的意思是： 通过 API 网关承接用户请求，并驱动函数执行。每个函数分别实现一个具体功能，并通过 JWT 实现身份认证，最后表格存储作为数据库。
- 其中，数据库中存储的数据主要是用户数据和文章数据。假设用户有 username（用户名） 和 password（密码） 两个属性；文章有 `article_id`（文章 ID）、`username`（创建者）、`title`（文章标题）、`content`（文章内容）、`create_date`（创建时间）、`update_date`（更新时间）这几个属性

![](http://img-repo.poetries.top/images/20210418171543.png)

接下来，你可以在表格存储中创建对应的数据表（你可以在表格存储控制台创建，也可以直接用我提供的这段代码进行创建）：


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

> 这段代码主要创建了 user 和 article 两张表，其中 user 表的主键是 username，article 表的主键是 article_id，主键的作用是方便查询。除了主键，我还定义了几个列。其实对于表格存储，默认也可以不创建列，表格存储是宽表，除主键外，数据列可以随意扩展

在完成了数据库表的创建后，我们就可以开始进行系统实现了。

#### 2.2 内容管理系统的实现

为了方便你学习，为你提供了完整代码（代码地址），你可以参考着学习。

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
- `functions` 目录中就是所有函数，登录、注册、创建文章等，每个功能分别对应一个函数；
- `template.yaml` 是应用配置文件，包括函数和 API 网关的配置。

根据前面梳理的系统功能，我们需要实现以下几个 API：

| 用户注册 | POST /user/register              |
| -------- | -------------------------------- |
| 用户登录 | POST /user/login                 |
| 发布文章 | POST /article/create             |
| 查询文章 | GET /article/detail/[article_id] |
| 更新文章 | POST /article/update             |
| 删除文章 | PUT /article/delete/[article_id] |


> 每个 API 对应一个具体的函数，每个函数也都有一个与之对应的 API 网关触发器。由于这些函数属于同一个应用，所以我们可以通过一个 template.yaml 来定义所有函数。同时也可以在 template.yaml 中定义函数的 API 网关触发器，这样部署函数时，就会自动创建 API 网关。

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
  # API 网关分组，分钟中的所有 API 都是内容管理系统的 API
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

**template.yaml  主要分为两部分**： 函数定义和 API 网关定义，每个函数都有一个与之对应的 API 网关。我们用 serverless-cms 服务来表示内容管理系统这个应用，服务内的所有函数都是内容管理系统的函数。同理，ServerlessCMSGroup 这个 API 网关分组中的所有 API 都是内容管理系统的 API。

完整的 `template.yaml `配置如下：

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
            x-aliyun-apigateway-api-name: article_update
            x-aliyun-apigateway-request-parameters:
              - apiParameterName: 'article_id'
                location: 'Path'
                parameterType: 'String'
                required: 'REQUIRED'
            x-aliyun-apigateway-fc:
              arn: acs:fc:::services/${serverless-cms.Arn}/functions/${article-delete.Arn}/
              timeout: 3000
```

在这份配置中，需要注意两个地方：

函数的 Handler 配置，Handler 可以写函数路径，比如`src/function/user/register.handler`表示`src/function/user/目录中的 register.js 文件中的 handler 方法`；

API 网关配置中的`/article/detail/[article_id]Path`，这种带参数的 PATH，必须使用`x-aliyun-apigateway-request-parameters`指定 Path 参数。

接下来，我们就来实现内容管理系统的各个 API，也就是 template.yaml 中定义的各个函数。

#### 2.3 用户注册

用户注册接口定义如下。

请求方法：POST。

```
Path：/user/register
```

> Body参数：username 用户名、password 密码。

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

![](http://img-repo.poetries.top/images/20210418172230.png)

#### 2.4 用户登录

完成用户注册函数开发后，就可以接着开发登录。用户登录的接口定义如下。

- 请求方法：POST。
- Path：/user/login
- Body 参数：username 用户名、password 密码。

> 登录的逻辑就是根据用户输入的密码是否正确，如果正确就生成一个 token 返回给调用方。代码实现如下：

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

将其部署到函数计算后，我们也可以使用 curl 命令进行测试：

```
$ curl http://a88f7e84f71749958100997b77b3e2f6-cn-beijing.alicloudapi.com/user/login \
-X POST \
-d "username=Jack&password=123456"
{"success":true,"data":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkphY2siLCJpYXQiOjE2MTE0OTI2ODF9.c56Xm4RBLYl5yVtR_Vk0IZOL0yijofcyE-P7vjKf4nA"}}
```

#### 2.5 身份认证

在完成了注册登录接口后，我们再来看一下内容管理系统中，身份认证应该怎么实现。

在之前，我们实现了一个 Express.js 框架的身份认证中间件，用来拦截所有请求，身份认证通过后才能进执行后面的代码逻辑。在内容管理系统中，你也可以参考 Express.js 的思想，实现一个 auth.js 专门用于身份认证，代码如下：

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

- 其原理很简单，就是从 API 网关的 event 对象中获取 token，然后验证 token 是否正常。如果认证通过，就返回 user 信息，失败就返回 false。
- 这样在需要身份认证的函数中，你只引入 auth.js 并传入 event 对象就可以了。下面是一个简单的示例：

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

> 除了登录注册，其他接口都需要身份认证，所以接下来我们就通过实现“发布文章”函数来实际使用 auth.js。

#### 2.6 发布文章

发布文章的接口定义如下。

- 请求方法：POST。
- Path：/article/create
- Headers 参数: Authorization token。
- Body 参数：title、content。

> 由于登录后才能发布文章，所以要先通过登录接口获取 token，然后调用 /article/create 接口时，再将 token 放在 HTTP Headers 参数中。发布文章的代码实现如下：

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
    .then(() =>
      callback(null, {
        success: true,
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

首先是使用 auth.js 进行身份认证，认证通过后就可以从 user 中获取 username。然后再从请求体中获取文章标题和文章内容数据，将其存入数据库。

接下来我们依旧可以将函数部署和使用 curl 进行测试：

```
$ curl http://a88f7e84f71749958100997b77b3e2f6-cn-beijing.alicloudapi.com/article/create \
-X POST \
-d "title=这是文章标题&content=内容内容内容......" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkphY2siLCJpYXQiOjE2MTE0OTI2ODF9.c56Xm4RBLYl5yVtR_Vk0IZOL0yijofcyE-P7vjKf4nA"
{"success":true,"data":{"article_id":"d4b9bad8-a0ed-499d-b3c6-c57f16eaa193"}}
```

在测试时，我们需要将 token 放在 HTTP 请求头的 Authorization 属性中。文章发布成功后，你就可以在表格存储中看到对应的数据了。

![](http://img-repo.poetries.top/images/20210418172448.png)

#### 2.7 查询文章

> 发布文章的接口开发完成后，我们继续开发一个查询文章的接口，这样就可以查询出刚才创建的文章。查询文章接口定义如下。

- 请求方法：GET。
- `Path：/article/detail/[article_id]`
- Headers 参数: Authorization token。

> 在查询文章接口中，我们需要在 Path 中定义文章 ID 参数，即 article_id。这样在函数代码中，你就可以通过 event 对象的 pathParameters 中获取 article_id 参数，然后根据 article_id 来查询文章详情了。完整代码如下：

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
        message: "创建文章失败",
      })
    );
};
```

开发完成后，我们可以将其部署到函数计算，再用 curl 命令进行测试：

```bash
$ curl http://a88f7e84f71749958100997b77b3e2f6-cn-beijing.alicloudapi.com/article/detail/d4b9bad8-a0ed-499d-b3c6-c57f16eaa193 \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkphY2siLCJpYXQiOjE2MTE0OTI2ODF9.c56Xm4RBLYl5yVtR_Vk0IZOL0yijofcyE-P7vjKf4nA"
{"success":true,"data":{"article_id":"d4b9bad8-a0ed-499d-b3c6-c57f16eaa193","content":"内容内容内容......","create_date":"1/24/2021, 2:05:46 PM","title":"这是文章标题","update_date":"1/24/2021, 2:05:46 PM","username":"Jack"}}
```

如上所示，查询文章的接口按照预期返回了文章详情。

#### 2.8 更新文章

> 更新文章的 API Path 参数和查询文章一样，都需要 Path 中定义 article_id。而其 body 参数则与创建文章相同。此外，更新文章的请求 method 是 PUT，因为在 Restful API 规范中，我们通常使用 POST 来表示创建， 使用 PUT 来表示更新。

更新文章的接口定义如下。

请求方法：PUT。

- Path：/article/update/[article_id]
- Headers 参数: Authorization token。
- Body 参数：title、content。

更新文章的逻辑就是根据  article_id 去更新一行数据。代码如下：

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

> 最后就还是一个删除文章的 API 了。删除文章的 API 也需要在 Path 中定义 article_id 参数，并且其 HTTP method 是 DELETE。具体接口定义如下。

- 请求方法：DELETE。
- Path：/article/delete/[article_id]
- Headers 参数: Authorization token，
- 删除文章很简单，就是根据 article_id 删除一行数据，代码如下：

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

#### 2.10 总结

> 可以看到，基于 Serverless 开发 Restful API 的整个代码非常简单，每个函数只负责一个独立的业务，职责单一、逻辑清晰。关于这一讲，我想强调这样几个重点：

- 基于 Serverless 开发 API 时，建议你使用 API 网关进行 API 的管理；
- 对于数据库等第三方服务，建议对其基本操作进行封装，这样更方便进行扩展；
- Serverless 函数需要保持简单、独立、单一职责。

### 3 基于 Serverless 开发高可用音视频处理系统

Serverless 的应用场景非常广泛，它还可以用于大数据计算、物联网应用、音视频处理等。为了让你了解到更多的 Serverless 的应用场景，我准备了今天的内容。

音视频处理是一个 CPU 密集型的操作，非常消耗计算资源，以往我们处理视频就要采购大量的高性能服务器，财务成本和维护成本都很高。有了 Serverless 后，就不用再关心计算资源不足的问题，也不用担心服务器的维护，并且还能降低成本。

接下来，我先带你了解传统的音视频处理方案，然后在此基础上再带你学习并实践基于 Serverless 的音视频处理系统，这样你理解得会更加深入。


#### 3.1 传统音视频处理方案

近几年，计算机技术和通信技术日新月异，信息传播的媒介也在不断演变，从文字到图片再到视频，各种短视频、直播甚至 AR、VR 等产品百花齐放。在这些产品的背后，离不开音视频处理技术。

得益于云计算的发展，有些云厂商推出了对应的视频解决方案，因此你现在要搭建一个视频处理程序是很容易的（下图就是一个典型的视频处理方案）：

![](http://img-repo.poetries.top/images/20210418173047.png)

在该方案中，我们用 OSS 来存储海量的视频内容，视频上传后用视频转码服务将不同来源的视频进行转码，以适配各种终端，然后利用 CDN 提升客户端访问视频的速度。

不过，虽然用了视频转码服务，但我们还是要购买大量的服务器，搭建自己的视频处理系统，对视频进行更高级的自定义处理，比如视频转码后将元数据存入数据库、生成视频前几秒的 GIF 图片用来做视频的封面，以及各种格式的音视频转换等。

除此之外，当我们已经在服务器上部署了一套视频处理系统后，可能还会遇到一些问题。比如，如何应对大量并发任务？能否让这个系统有更高的弹性和可用性？这些问题其实超出了视频处理本身的范围，我们的需求只是进行视频处理，但不得不面临繁重的运维工作。并且我们可能为了应对周期大量处理任务或瞬时流量，不得不购买大量的服务器，成本大幅增加，在服务器的闲置期间还造成了不必要的资源浪费。而且我们也无法 100% 利用机器的性能，这也是一种资源浪费。

而 Serverless 就能解决这些问题，基于 Serverless 你可以很轻松实现一个弹性、可扩展、低成本、免运维、高可用的音视频处理系统。

#### 3.2 基于 Serverless 的音视频处理系统

- 从基础设施的角度来看，基于 Serverless 的音视频解决方案，主要是替换了传统方案中的计算资源，也就是替换了服务器。
- 此外，我们基于 Serverless 平台提供的丰富的触发器，也能简化编程模型。比如以往我们需要用户将视频上传到 OSS 后，再通过接口主动通知服务器进行视频处理，但在 Serverless 架构中，我们可以为函数设置 OSS 触发器，这样只要有文件被上传到 OSS 中，就可以触发函数执行，进而简化了业务逻辑。

下图就是基于 Serverless 的视频处理系统解决方案：

![](http://img-repo.poetries.top/images/20210418173248.png)

用户将视频上传后 OSS 后，触发函数计算中的视频转码函数执行，该函数对视频进行转码后，将元数据存入数据库，然后将转码后的视频再保存到 OSS 中。

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

> 其中 functions 中是函数源代码，common/utils.js是一些公共方法，get_duration、get_meta等目录则分别对应的每个具体的功能。build.js是用来构建函数的脚本。在代码中，我们会使用 FFmpeg 进行视频处理，FFmpeg 是一款功能强大、用途广泛的开源软件，很多视频网站都在用它，比如 Youtube、Bilibili。ffmpeg 和 ffprobe 是 FFmpeg 的两个命令行工具，我们会将其作为依赖部署到 FaaS 平台（函数计算）上，这样在函数中就可以使用这两个命令来处理视频了。

接下来就让我们学习具体如何实现。

由于这几个函数的逻辑基本类似，所以我主要针对“获取视频时长”函数进行讲解，学会了这个函数的实现就很容易理解其他函数了。另外，由于该视频处理系统用到了公共方法及依赖，所以我还会为你介绍如何部署这些函数。

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

> 其中-print_format json是指以 JSON 格式输出结果，-i是指定文件位置，可以是本地文件，也可以是网络上的远程文件。

所以获取视频时长的函数逻辑就是： 下载 OSS 中的文件到本地，然后运行 ffprobe 命令得到视频时长，最后返回视频时长。

为了让代码尽可能复用，所以我在`common/utils.js`中实现了一些公共方法，代码大致如下：

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

> common/utils.js的代码主要就包含两个方法：exec和getOssClient，分别用来执行 Linux 系统命令和获取 OSS 客户端。

这样我们在functions/get_duration/index.js中就可以直接引入并使用了：

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

首先注意第 20 行，我们通过 getOssClient 获取到 OSS 客户端，然后调用 getDuration 函数执行业务逻辑，也就是获取视频时长。

在 getDuration 中，我们先下载视频到临时目录/tmp/video.mp4中，临时目录是可以读写的，当前代码目录只能写不能读。然后在第 13 行，通过 exec 执行了获取视频时长的命令，最后将得到的结果返回。

这样获取视频时长的功能就开发完成了。

获取视频元数据等其他函数与获取视频时长的实现是非常类似的，不同之处主要在于执行的命令，也就是第 12 行的command变量。具体实现可以参考我的示例代码，这里就不赘述。

由于该系统包含多个函数，且函数不仅依赖了 ffmpeg ，还依赖了公共的`common/utils.js`，所以很多同学就犯难了，这些函数应该怎么部署呢？

#### 3.4 音视频处理系统的部署

我们需要将 ffmpeg 或 ffprobe 上传。看起来比较简单，我们直接将其放在函数代码目录并上传就可以了。

不过这里需要注意的是， 由于 ffmpeg 和 ffprobe 是可执行文件，最终我们需要用到这两个命令，所以在上传到 FaaS 平台之前，需要为其赋予可执行权限。

你可以通过ls -l来查看文件的权限：

```
$ ls -l
-rwxr-xr-x    1 root  staff  39000328  2  9 20:59 ffmpeg
-rwxr-xr-x    1 root  staff  38906056  2  9 21:00 ffprobe
```

-rwxr-xr-x分为四部分：

- 第 0 位-表示文件类型；
- 第 1-3 位rwx表示文件所有者的权限；
- 第 4-6 位r-x是同组用户的权限；
- 第 7-9r-x位表示其他用户的权限。

> r 表示读权限，w 表示写权限，x 表示执行权限。从文件权限可以看出，针对所有用户这两个文件都有可执行权限。

如果你的这两个文件没有执行权限，则需要通过下面的命令添加权限：

```
$ chmod +x ffmpeg
$ chmod +x ffprobe
```

- 这样在 FaaS 平台上，Node.js 才可以执行这两个命令。
- 解决了可执行文件的权限问题后，还有一个问题是函数的权限。

由于函数需要读写 OSS，所以我们需要为函数设置角色，并为该角色添加管理 OSS 的权限。如果你不清楚如何授权，可以复习一下 “10｜访问控制：如何授权访问其他云服务？”的内容。

> 在我提供的示例代码中，我在 template.yaml 的第 7 行设置了函数的角色acs:ram::1457216987974698:role/aliyunfclogexecutionrole，文件内容如下所示：

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

细心的你可能发现了，在该 YAML 配置中，函数的 CodeUri 不是./functions/get_durtion，而是./.serverless/get_meta，这是为什么呢？

这主要是因为我们需要对函数代码进行构建，./.serverless/get_duration对应的是构建后的代码。之所以需要构建，是为了解决common/utils.js代码共用的问题。

如果不对代码进行构建，直接部署functions/get_duration中的代码，函数执行时就会报错：Cannot find module '../common/utils，因为common/utils.js不在入口函数目录中，没有部署到 FaaS 上。

要解决这个问题，就需要对代码进行构建，将函数及依赖的所有代码构建为单个文件，这样部署时就只需要部署一个文件，不涉及目录和依赖的问题了。

我们可以使用 ncc 这个工具对函数进行构建，使用方法如下：

```
$ ncc build ./functions/get_duration/index.js -o ./.serverless/get_duration/ -e ali-oss
```

该命令就会将`functions/get_duration/index.js`进行构建，最终会将`index.js`以及缩依赖的 exec、getOSSClient 等方法进行编译，最终合并为一个文件并输出到`./.serverless/get_duration/`目录中。

**这里还需要注意的是**`-e ali-oss`这个参数，含义是构建时，排除 ali-oss 这个依赖，也就是不将其编译到最终的`index.js`文件中。这是因为函数计算的 Node.js 运行时内置了 ali-oss 模块，所以我们的构建产物就不需要包含 ali-oss 的代码了。

处理对代码进行构建，我们还需要将 ffmpeg 和 ffprobe 复制到对应的函数目录中。最终我将这些步骤编写到了`build.js`中，内容如下：

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

然后我在 package.json 中添加了两个命令：

- build构建函数
- deploy构建并部署

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

**强调下面几点：**

- Serverless 除了适合 Web 接口、服务端渲染等场景，还适合 CPU 密集型的任务；
- 基于 Serverless 开发的音视频处理系统，本身就具备弹性、可扩展、低成本、免运维、高可用的能力；
- 对于需要通过代码执行的命令行工具等依赖，部署到 FaaS 平台之前需要为其设置可执行权限；若函数依需要调用其他云产品的接口，需要为函数授予相应权限；
- 对于添加水印、视频转码等消耗资源的操作，需要为函数设置较大的内存和超时时间。

### 4 使用 React.js 开发 Serverless 服务端渲染应用

对前端工程师来说，Serverless 最大的应用场景之一就是开发服务端渲染（SSR）应用。因为传统的服务端渲染应用要由前端工程师负责服务器的运维，但往往前端工程师并不擅长这一点，基于 Serverless 开发服务端渲染应用的话，就可以减轻这个负担。希望你学完今天的内容之后，能够学会如何去使用 Serverless 开发一个服务端渲染应用。

### 5 基于 Serverless 的服务端渲染架构

> 现在的主流前端框架是 React.js、Vue.js 等，基于这些框架开发的都是单页应用，其渲染方式都是客户端渲染：代码开发完成后，构建出一个或多个 JS 资源，页面渲染时加载这些 JS 资源，然后再执行 JS 渲染页面。虽然这些框架可以极大提升前端开发效率，但也带来了一些新的问题。

- **不利于 SEO：** 页面源码不再是HTML，而是渲染 HTML 的 JavaScript，这就导致搜索引擎爬虫难以解析其中的内容；
- **初始化性能差：** 通常单元应用的 JS 文件体积都比较大、加载耗时比较长，导致页面白屏。

为了解决这些问题，很多框架和开发者就开始尝试服务端渲染的方式：页面加载时，由服务端先生成 HTML 返回给浏览器，浏览器直接渲染 HTML。在传统的服务端渲染架构中，通常需要前端同学使用 Node.js 去实现一个服务端的渲染应用。在应用内，每个请求的 path 对应着服务端的每个路由，由该路由实现对应 path 的 HTML 文档渲染：

![](http://img-repo.poetries.top/images/20210418174418.png)

传统服务端渲染架构

对前端工程师来说，要实现一个服务端渲染应用，通常面临着一些问题：

- 部署服务端渲染应用需要购买服务器，并配置服务器环境，要对服务器进行运维；
- 需要关注业务量，考虑有没有高并发场景、服务器有没有扩容机制；
- 需要实现负载均衡、流量控制等复杂后端能力等。

开篇我也提到，而且是服务端的工作，很多前端同学都不擅长，好在有了 Serverless。

用 Serverless 做服务端渲染，就是将以往的每个路由，都拆分为一个个函数，再在 FaaS 上部署对应的函数，这样用户请求的 path，对应的就是每个单独的函数。通过这种方式，就将运维操作转移到了 FaaS 平台，前端同学开发服务端渲染应用，就再也不用关心服务端程序的运维部署了。并且在 FaaS 平台中运行的函数，天然具有弹性伸缩的能力，你也不用担心流量波峰波谷了。

![](http://img-repo.poetries.top/images/20210418174139.png)

基于 Serverless 的服务选渲染架构

如图所示，FaaS 函数接收请求后直接执行代码渲染出 HTML 并返回给浏览器，这是最基本的架构，虽然它可以满足大部分场景，但要追求极致的性能，你通常要加入缓存。

![](http://img-repo.poetries.top/images/20210418174151.png)

进阶版基于 Serverless 的服务端渲染架构

首先我们会使用 CDN 做缓存，基于 CDN 的缓存可以减少函数执行次数，进而避免函数冷启动带来的性能损耗。如果 CDN 中没有 SSR HTML 页面的缓存，则继续由网关处理请求，网关再去触发函数执行。

函数首先会判读缓存数据库中是否有 SSR HTML 的缓存，如果有直接返回；如果没有再渲染出 HTML 并返回。基于数据库的缓存，可以减少函数渲染 HTML 的时间，从而页面加载提升性能。

讲了这么多，具体怎么基于 Serverless 实现一个服务端渲染应用呢？

#### 5.1 实现一个 Serverless 的服务端渲染应用

我们实现了一个内容管理系统的 Restful API，但没有前端界面，所以今天我们的目标就基于 Serverless 实现一个内容管理系统的前端界面（如图所示）。

![ssr.gif](https://s0.lgstatic.com/i/image/M00/94/3B/Ciqc1GAXxoiANTROADtU9yybMQY209.gif)

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
- src/ 目录中主要是后端代码，src/service 目录中的 index.ts  和 detail.ts 则定义了两个页面分别需要用到的接口，为了简单起见，接口数据我使用了 src/mock/ 目录中的 mock 数据。

当我一个人又负责前端页面也负责后端接口的开发时，通常习惯先实现接口，再开发前端页面，这样方便调试。接下来就让我们看一下具体是怎么实现的。

#### 5.2 首页接口的实现

其源码在 src/service/index.ts 文件中，代码如下：

复制代码

```
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

这段代码实现了一个 ApiService 类以及 index 方法，该方法会返回首页的文章列表。数据结构如下：

复制代码

```
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

在进行服务端渲染时，你可以通过 ctx 获取到 ApiService 实例，进而调用其中的方法，获取文章列表数据。此外，ApiService 也会被 src/api.ts 调用，src/api.ts 则直接对外提供了 HTTP 接口。

#### 5.3 首页页面的实现

有了接口后，我们就可以继续实现首页的前端页面了。首页页面的代码在 web/pages/ 目录中，该目录下有三个文件：

- fetch.ts，获取首页数据；
- render.tsx 首页页面 UI 组件代码；
- index.less 样式代码。

首先来看一下 fetch.ts：

复制代码

```
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

**这段代码的逻辑比较简单，核心点在第 10 行**，如果是浏览器，就用浏览器自带的 fetch 方法请求`/api/index`接口获取数据；如果不是浏览器，即服务端渲染，可以直接调用 apiService 中的 index 方法。获取到数据后，将其存入 state.indexData 中，这样在 UI 组件中就可以使用了。
首页的 UI 组件 render.tsx 代码如下：

复制代码

```
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

在 UI 组件中，我们可以通过 useContext 获取刚才由 fetch.ts 存入 state 的数据，然后利用数据渲染 UI。UI 组件主要由三部分组成。

- Navbar：导航条。
- Header：页面标题。
- Item：每篇文章的简介。

![](http://img-repo.poetries.top/images/20210418174309.png)

#### 5.4 详情页接口的实现

完成了首页后，就可以实现详情页了。详情页与首页整体类似，区别就在于详情页需要传入参数查询某条数据。

详情页接口在 src/service/detail.ts 中 ，代码如下所示：

复制代码

```
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

在这段代码中，我们实现了一个 ApiDetailService 类以及 index 方法，index 方法的如参 id 即文章 ID，然后根据文章 ID 从 mock 数据中查询文章详情。

文章详情数据如下：

复制代码

```
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

数据请求代码文件的命名和首页一样，都是 fetch.ts。与首页不同的是，详情页我们需要从上下文（服务端渲染场景）或 URL 中（浏览器场景）获取到文章 ID，然后根据文章 ID 获取文章详情数据。代码如下：

复制代码

```
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

详情页的 UI 组件名称为`render$id.tsx`的文件，`$id`表示该组件的参数是 id，这样访问 /detail/ 这个路由（id 是变量）时，就会匹配到 web/pages/detail/render$id.tsx 这个页面了。


`render$id.tsx`详细代码如下：

复制代码

```
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

![](http://img-repo.poetries.top/images/20210418174323.png)

#### 5.6 应用部署

代码开发完成后，你可以通过下面的命令在本地启动应用：

复制代码

```
$ npm start

...

[HPM] Proxy created: /asset-manifest  -> http://127.0.0.1:8000

 Server is listening on http://localhost:3000
```

应用启动后就可以打开浏览器输入 [http://localhost:3000](http://localhost:3000/) 查看效果了。
在本地开发测试完成后，接下来就需要将其部署到函数计算。你可以运行 npm run deploy 命令进部署：

复制代码

```
$ npm run deploy

...

service  serverless-ssr-cms deploy success

......

The assigned temporary domain is http://41506101-1457216987974698.test.functioncompute.com，expired at 2021-02-04 00:35:01, limited by 1000 per day.

......

Deploy success
```

`npm run deploy`其实是执行了构建代码和部署应用两个步骤，这两个步骤都是在本机执行的。但这就存在一个隐藏风险，如果团队同学本地开发环境不同，就可能导致构建产物不同，进而导致部署到线上的代码存在风险。**所以更好的实践是：实现一个业务的持续集成流程，统一构建部署。**

应用部署成功后，会自动创建一个测试的域名，例如[http://41506101-1457216987974698.test.functioncompute.com](http://41506101-1457216987974698.test.functioncompute.com/)，我们可以打开该域名查看最终效果。

讲到这儿，基于 Serverless 的服务端渲染应用就开发完成了。

#### 5.7 总结

总的来说，基于 Serverless 的服务端渲染应用实现也比较简单。如果你想要追求更好的用户体验，我也建议你对核心业务做服务端渲染的优化。基于 Serverless 的服务端渲染，可以让我们不用再像以前一样担心服务器的运维和扩容，大大提高了生产力。同时有了服务端渲染后，我也建议你完善业务的持续集成流程，将整个研发链路打通，降低代码构建发布的风险，提升从开发到测试再到部署的效率。

当然，要达到页面的极致体验，我们还需要做很多工作，比如：

- 将静态资源部署到 CDN，提升资源加载速度；
- 针对页面进行缓存，减少函数冷启动对性能的影响；
- 对服务端异常进行降级处理等等。

但不管我们用不用 Serverless，都需要做这些工作。关于这一讲，我想要强调以下几点：

- 基于 Serverless 的服务端渲染应用，可以让我们不用关心服务器的运维，应用也天然具有弹性；
- 基于 Serverless 开发服务端渲染应用，建议你完善业务的持续集成流程；
- 要达到页面的极致性能，还需要考虑将静态资源部署到 CDN、对页面进行缓存等技术；
- 对于服务端渲染应用，建议你完善业务的服务降级能力，进一步提高稳定性。
