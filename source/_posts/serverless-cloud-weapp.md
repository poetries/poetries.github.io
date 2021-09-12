---
title: serverless及小程序云开发实践总结
date: 2021-09-12 18:24:08
tags: serverless
categories: Front-End
---


# 一、Serverless 架构详解

## 1.1 什么是serverless

![](http://img-repo.poetries.top/images/20210909143647.png)
![](http://img-repo.poetries.top/images/20210909105911.png)
![](http://img-repo.poetries.top/images/20210909174718.png)
![](http://img-repo.poetries.top/images/20210909174744.png)
![](http://img-repo.poetries.top/images/20210909174732.png)

我们使用函数的时候不用关心后端IP、域名，只需要调用函数，后端的服务是一个函数。serverless并不是没有服务器，只是服务器部署在云上面的，比我们去自己维护更方便多

- `Serverless`又名无服务器,所谓无服务器并非是说不需要依赖和依靠服务器等资源,而是开发者再也不用过多考虑服务器的问题,可以更专注在产品代码上。
- `Serverless`是一种软件系统架构的思想和方法，它不是软件框架、类库或者工具。它与传统架构的不同之处在于，完全由第三方管理，由事件触发，存在于无状态(`Stateless`)、 暂存(可能只存在于一次调用的过程中)计算容器内。构建无服务器应用程序意味着开发者可以专注在产品代码上，而无须管理和操作云端或本地的服务器或运行时(运行时通俗的讲 就是运行环境，比如 `nodejs `环境，`java` 环境，`php` 环境)。`Serverless` 真正做到了部署应用 无需涉及基础设施的建设，自动构建、部署和启动服务。

> - 第一种：`狭义 Serverless`（最常见）= `Serverless computing 架构` = `FaaS 架构` = `Trigger（事件驱动）+ FaaS（函数即服务）+ BaaS`（后端即服务，持久化或第三方服务）= `FaaS + BaaS`
> - 第二种：广义 `Serverless` = `服务端免运维` = `具备 Serverless 特性的云服务`

![](http://img-repo.poetries.top/images/20210909172246.png)

> - FAAS：函数及服务，通俗来说就是我们可以写一个函数，在该函数内执行业务逻辑，函数由fas平台运行
> - BAAS：后端及服务，通常指云服务，该云服务常指中间件服务，

FAAS+BAAS 构成了Serverless架构

![](http://img-repo.poetries.top/images/20210901173327.png)

整体架构十分简单明了, 用 FC 替代了 Web 服务器，但是换来的是免运维，弹性扩容，按需付费等一系列优点

> 目前，Serverless 的应用场景广泛，大部分传统业务均可以在 Serverless 云函数上完美支持

## 1.2 Serverless要解决什么？

> 问题：前端和后端分离后，彼此独立，这样就导致前端需要关注一些后端关注的问题，如下。

- 完整的后端应用上线流程
- 机器管理运维：扩缩容
- 降级、熔断、限流
- 域名、性能、监控

> 是不是触及了很多同学的知识盲区。作为一个前端，确实大多数人对于服务端的环境，部署基础设施等等东西并不了解。但是现在前端是独立的部署，前端必然面临这些东西。这就是serverless要解决的问题。

## 1.3  Serverless做什么事？

> 问题：是不是可以弄一个工具，我们只需要关心前端代码，服务器的东西工具自动帮我们做好。

这就是serverless做的事情。如下图，我们只需要关心业务代码，不需要关心服务器的基础设施。

![](http://img-repo.poetries.top/images/20210909175241.png)

## 1.4 Serverless和函数计算的区别

![](http://img-repo.poetries.top/images/20210909174858.png)

## 1.5 Serverless 的技术特点

**事件驱动**

- 云函数的运行，是由事件驱动起来的，在有事件到来时，云函数会启动运行
- Serverless 应用不会类似于原有的「监听 - 处理」类型的应用一直在线，而是按需启动
- 事件的定义可以很丰富，一次 http 请求，一个文件上传，一次数据库条目修改，一条消息发送，都可以定义为事件

![](http://img-repo.poetries.top/images/20210909215157.png)

**单事件处理**

- 云函数由事件触发，而触发启动的一个云函数实例，一次仅处理一个事件
- 无需在代码内考虑高并发高可靠性，代码可以专注于业务，开发更简单
- 通过云函数实例的高并发能力，实现业务高并发

![](http://img-repo.poetries.top/images/20210909215226.png)

**自动弹性伸缩**

- 由于云函数事件驱动及单事件处理的特性，云函数通过自动的伸缩来支持业务的高并发
- 针对业务的实际事件或请求数，云函数自动弹性合适的处理实例来承载实际业务量
- 在没有事件或请求时，无实例运行，不占用资源

![](http://img-repo.poetries.top/images/20210909215252.png)


**无状态开发**

- 云函数运行时根据业务弹性，可能伸缩到 0，无法在运行环境中保存状态数据
- 分布式应用开发中，均需要保持应用的无状态，以便于水平伸缩
- 可以利用外部服务、产品，例如数据库或缓存，实现状态数据的保存

![](http://img-repo.poetries.top/images/20210909215322.png)

## 1.6 传统服务器架构 VS Serverless架构

1. 传统的开发模式

![](http://img-repo.poetries.top/images/20210909180123.png)
![](http://img-repo.poetries.top/images/20210909175657.png)
![](http://img-repo.poetries.top/images/20210908093108.png)

2. 新型的`serverless`开发模式

![](http://img-repo.poetries.top/images/20210909180137.png)
![](http://img-repo.poetries.top/images/20210908093115.png)

正常来说，用户开发 Server 端服务，常常面临开发效率，运维成本高，机器资源弹性伸缩等痛点，而使用 Serverless 架构可以很好的解决上述问题。下面是传统架构和 Serverless 架构的对比：

![](http://img-repo.poetries.top/images/20210901173249.png)

云函数计算是一个事件驱动的全托管计算服务。通过函数计算，您无需管理服务器等基础设施，只需编写代码并上传。函数计算会为您准备好计算资源，以弹性、可靠的方式运行您的代码，并提供日志查询，性能监控，报警等功能。借助于函数计算，您可以快速构建任何类型的应用和服务，无需管理和运维。

## 1.7 使用serverless优缺点

**优势**

1. **无运维**：我们不需要购买服务器，直接可进行
2. **资源分配**: 在 `Serverless` 架构中，你不用关心应用运行的资源(比如服务配置、磁盘大小)只提供一份代码就行。
3. **计费方式**: 在` Serverless` 架构中，计费方式按实际使用量计费(比如函数调用次数、运 行时长)，不按传统的执行代码所需的资源计费(比如固定 `CPU`)。计费粒度也精确到了毫 秒级，而不是传统的小时级别。个别云厂商推出了每个月的免费额度，比如腾讯云提供了每 个月 40 万 GBs 的资源使用额度和 100 万次调用次数的免费额度。中小企业的网站访问量不 是特别大的话完全可以免费使用。

![](http://img-repo.poetries.top/images/20210908093139.png)

4. **弹性伸缩**:` Serverless` 架构的弹性伸缩更自动化、更精确，可以快速根据业务并发扩容更 多的实例，甚至允许缩容到零实例状态来实现零费用，对用户来说是完全无感知的。而传统 架构对服务器(虚拟机)进行扩容，虚拟机的启动速度也比较慢，需要几分钟甚至更久。

**不足**

当然了 ServerLess 是很诱人，但却不是万能的，有些场景还是不适合的。

- ServerLess 不仅仅是一门技术也是一种理念和微服务一样，很多老系统不能直接上 ServerLess，得相应的进行升级和拆解才能更好的适应 ServerLess，这是一个门槛。
- 同时 ServerLess 针对开发语言的可定制性和可开放性，ServerLess 会选择处于稳定版的语言且更新具有一定的滞后性，特别是 Node.JS 这样的版本更新帝，最新稳定版是10，但是提供的却是8。同时如果对语言有底层的修改而无法通过 Plugin 实现同样也无法适应相关场景。
- 不适合长时间的进行计算处理的场景，ServerLess 是产生计算后按时间计费的，适合那些触发类短时间计算的，如果有长时间进行计算的场景就不适合。

## 1.8 如何理解理解Serverless技术—FaaS和BaaS

> Serverless由开发者实现的服务端逻辑运行在无状态的计算容器中，它由事件触发， 完全被第三方管理，其业务层面的状态则被开发者使用的数据库和存储资源所记录。Serverless涵盖了很多技术，分为两类：FaaS和BaaS。

**FaaS（Function as a Service，函数即服务）**

- FaaS意在无须自行管理服务器系统或自己的服务器应用程序，即可直接运行后端代码。其中所指的服务器应用程序，是该技术与容器和PaaS（平台即服务）等其他现代化架构最大的差异。
- FaaS可以取代一些服务处理服务器（可能是物理计算机，但绝对需要运行某种应用程序），这样不仅不需要自行供应服务器，也不需要全时运行应用程序。
- FaaS产品不要求必须使用特定框架或库进行开发。在语言和环境方面，FaaS函数就是常规的应用程序。例如AWS Lambda的函数可以通过Javascript、Python以及任何JVM语言（Java、Clojure、Scala）等实现。然而Lambda函数也可以执行任何捆绑有所需部署构件的进程，因此可以使用任何语言，只要能编译为Unix进程即可。FaaS函数在架构方面确实存在一定的局限，尤其是在状态和执行时间方面。
- 迁往FaaS的过程中，唯一需要修改的代码是“主方法/启动”代码，其中可能需要删除顶级消息处理程序的相关代码（“消息监听器接口”的实现），但这可能只需要更改方法签名即可。在FaaS的世界中，代码的其余所有部分（例如向数据库执行写入的代码）无须任何变化。

> 相比传统系统，部署方法会有较大变化 – 将代码上传至FaaS供应商，其他事情均可由供应商完成。目前这种方式通常意味着需要上传代码的全新定义（例如上传zip或JAR文件），随后调用一个专有API发起更新过程。

FaaS中的函数可以通过供应商定义的事件类型触发。对于亚马逊AWS，此类触发事件可以包括S3（文件）更新、时间（计划任务），以及加入消息总线的消息（例如Kinesis）。通常你的函数需要通过参数指定自己需要绑定到的事件源。

大部分供应商还允许函数作为对传入Http请求的响应来触发，通常这类请求来自某种该类型的API网关（例如AWS API网关、Webtask）

**BaaS（Backend as a Service，后端即服务）**

> BaaS（Backend as a Service，后端即服务）是指我们不再编写或管理所有服务端组件，可以使用领域通用的远程组件（而不是进程内的库）来提供服务

## 1.9 Serverless计算如何工作？

![](http://img-repo.poetries.top/images/20210909175448.png)


> 同步调用的特性是，客户端期待服务端立即返回计算结果。请求到达函数计算时，会立即分配执行环境执行函数。

以 API 网关为例，API 网关同步触发函数计算，客户端会一直等待服务端的执行结果，如果执行过程中遇到错误， 函数计算会将错误直接返回，而不会对错误进行重试。这种情况下，需要客户端添加重试机制来做错误处理。

异步调用的特性是，客户端不急于立即知道函数结果，函数计算将请求丢入队列中即可返回成功，而不会等待到函数调用结束。

> 函数计算会逐渐消费队列中的请求，分配执行环境，执行函数。如果执行过程中遇到错误，函数计算会对错误的请求进行重试，对函数错误重试三次，系统错误会以指数退避方式无限重试，直至成功。

异步调用适用于数据的处理，比如 OSS 触发器触发函数处理音视频，日志触发器触发函数清洗日志，都是对延时不敏感，又需要尽可能保证任务执行成功的场景。如果用户需要了解失败的请求并对请求做自定义处理，可以使用 Destination 功能。函数计算是 Serverless 的，这不是说无服务器，而是开发者无需关心服务器，函数计算会为开发者分配实例执行函数。

## 2.0 FAAS 冷启动

FaaS 中的冷启动是指从调用函数开始到函数实例准备完成的整个过程。 冷启动我们关注的是启动时间，启动时间越短，我们对资源的利用率就越高。现在的云服务商，基于不同的语言特性，冷启动平均耗时基本在 100～700 毫秒之间。得益于 Google 的 JavaScript 引擎 Just In Time 特性，Node.js 在冷启动方面速度是最快的。

![](http://img-repo.poetries.top/images/20210909175826.png)

请求第一次访问时，云服务商就可以利用构建好的缓存镜像，直接跳过冷启动的下载函数代码步骤，从镜像启动容器，这个也叫预热冷启动。所以如果我们有些业务场景对响应时间比较敏感，我们就可以通过预热冷启动或预留实例策略，加速或绕过冷启动时间。

## 2.1 FAAS 分层

- 容器
- 运行时runtime
- 具体函数代码

![](http://img-repo.poetries.top/images/20210909175855.png)

云服务商负责的就是容器和 Runtime 的准备阶段了。而开发者自己负责的则是函数执行阶段。一旦容器 &Runtime 启动后，就会维持一段时间，这段时间内的这个函数实例就可以直接处理用户数据请求。当一段时间内没有用户请求事件发生（各个云服务商维持实例的时间和策略不同），则会销毁这个函数实例。

![](http://img-repo.poetries.top/images/20210909175920.png)

SFF（Serverless For Frontend）指前端数据请求过来，函数触发器触发我们的函数服务；我们的函数启动后，调用后端提供的元数据接口，并将返回的元数据加工成前端需要的数据格式；我们的 FaaS 函数完全就可以休息了。

## 2.2 后端应用 BaaS 化

回到我们的进程模型，用完即毁型是天然的 Stateless，因为它执行完就销毁，你无法单纯用它持久化存储任何值；常驻进程型则是天然的 Stateful，因为它的主进程不退出，主进程可以存储部分值。

BaaS 化的核心思想就是将后端应用转换成 NoOps 的数据接口，这样 FaaS 在 SFF 层就可以放开手脚，而不用再考虑冷启动时间了。

![](http://img-repo.poetries.top/images/20210909180012.png)

## 2.3 Serverless使用场景

![](http://img-repo.poetries.top/images/20210909175547.png)

**发送通知**

诸如 PUSH Notification、邮件通知接口、短信，这一类服务来说，他们都需要基础设施来搭建。并且，他们对实时性的要求相对没有那么高。即使在时间上晚来几秒钟，用户还是能接受的。在我们所见到的短信发送的例子里，一般都会假设用户能在 60 秒内收到短信。因此，在这种时间 1s 的误差，用户也不会恼火的。

**轻量级 API**

Serverless 特别适合于，轻量级快速变化地 API。其实，我一直没有想到一个合适的例子。在我的假想里，一个 AutoSuggest 的 API 可能就是这样的 API，但是这种 API 在有些时候，往往会伴随着相当复杂的业务。于是，便想举一个 Featrue Toggle 的例子，尽管有一些不合适。但是，可能是最有价值的部分。

**物联网**

当我们谈及物联网的时候，我们会讨论事件触发、传输协议、海量数据（数据存储、数据分析）。而有了 Serverless，那么再多的数据，处理起来也是相当容易的一件事。对于一个物联网应用的服务端来说，系统需要收集来自各个地方的数据，并创建一个个 pipeline 来处理、过滤、转换这些数据，并将数据存储到数据库中。对于硬件开发人员来说，对接不同的硬件，本身就是一种挑战。而直接使用诸如 AWS IoT 这样国，可以在某种程度上，帮助我们更好地开发出写服务端连接的应用。

**数据统计分析等**

数据统计本身只需要很少的计算量，但是生成图表，则可以定期生成。在接收数据的时候，我们不需要考虑任何延时带来的问题。50~200 ms 的延时，并不会对我们的系统造成什么影响。

## 2.4 serverless的厂家

* 链接地址
  * [亚马逊 AWS Lambda ](https://aws.amazon.com/cn/lambda/)
  * [谷歌 Google Cloud Functions]( https://cloud.google.com/functions)
  * [微软 Microsoft Azure]( https://www.azure.cn/)
  * [阿里云函数计算](https://www.aliyun.com/product/fc)
  * [腾讯云 云函数 SCF(Serverless Cloud Function)](https://cloud.tencent.com/product/scf )
  * [华为云 FunctionGraph](https://www.huaweicloud.com/product/functiongraph.html)

* 选择腾讯云的缘故
  * 微信小程序的云开发就是基于腾讯云，选择腾讯云更方便和小程序对接 
  * 腾讯云在 `serverless` 方面相比其他厂商支持更好一些 
  * 腾讯云的技术在线客服非常棒
  * 腾讯云和` serverless` 合作在腾讯云中集成了 `serverless Framework`用我们喜欢的框架开发 `serverless` 应用。也可以让我们快速部署老项目。
  * 价格更便宜


# 二、微信小程序云开发

## 2.1 小程序传统开发模式

前后台联调时间有时候更多，等项目上线需要考虑更多运维的问题，买域名买服务器等

![](http://img-repo.poetries.top/images/20210909110747.png)

## 2.2 云开发正在改变小程序的开发模式

**云开发是什么**

> 让开发者更专注于业务的开发，在云开发云函数中，我们可以很方便获取小程序用户openId、unionId一些鉴权信息，减轻后台开发量

简单的说，就是云开发是一套综合类服务的技术产品，通常开发一个完整的应用（小程序也好，Web、移动应用也好）都需要数据库、存储、CDN、后端函数、静态托管、用户登录等等，但是云开发将这些服务都集成到了一起，而且以一种全新的开发方式，让开发一个应用更加快速、方便、便宜且强大，引领未来技术开发的新趋势。

![](http://img-repo.poetries.top/images/20210909144650.png)

我们不需要区分那部分是前端那部分是后端，我们只需要调用函数一样去哪里这个流程就可以，云函数也可以在本地调式，调式云函数就像调式我们的代码一样的

**云开发优势**

- 快速上线
- 更加专注我们的业务
- 独立开发一个完整的小程序，云开发提供非常丰富的接口，我们通过这些接口很方便文件上传等操作
- 不需要考虑运维等问题，云开发是弹性扩容的
- 数据更安全

**小程序云开发提供哪些基础能力**

![](http://img-repo.poetries.top/images/20210909111446.png)

## 2.3 小程序云函数计费

**产品定价**

![](http://img-repo.poetries.top/images/20210908110237.png)

**支持地域**

![](http://img-repo.poetries.top/images/20210908110111.png)

**免费额度**

每个月的免费额度，会在每月开始时刻重置，不会进行累积

![](http://img-repo.poetries.top/images/20210908110147.png)

**配额限制说明**

![](http://img-repo.poetries.top/images/20210908110721.png)

## 2.4 小程序云开发项目的创建与配置

![](http://img-repo.poetries.top/images/20210830105322.png)

### 云开发项目初始化

找到云开发的环境ID，点击云开发控制台窗口里的设置图标，在环境变量的标签页找到环境名称和环境ID。

> 用户在开通云开发之后就创建了一个云开发环境，微信小程序可拥有最多两个环境，每个环境都对应一整套独立的云开发资源，包括数据库、云存储、云函数、静态托管等，各个环境是相互独立的。每个环境都有一个唯一的环境ID（环境名称不唯一）。

![](http://img-repo.poetries.top/images/20210830110227.png)
![](http://img-repo.poetries.top/images/20210830110241.png)

**指定开发者工具的云开发环境**

> 当云开发服务开通后，我们可以在小程序源代码cloudfunctions文件夹名看到你的环境名称。如果在cloudfunctions文件夹名显示的不是环境名称，而是“未指定环境”，可以鼠标右键该文件夹，可以看到弹窗的第一项为“当前环境”，有个小三角，在这里可以选择或切换已经建好的云开发环境。如果环境为空白，重启开发者工具，再来选择。

![](http://img-repo.poetries.top/images/20210830110613.png)

**指定小程序的云开发环境**

在开发者工具中打开源代码文件夹`miniprogram`里的app.js文件，找到如下代码：

```js
wx.cloud.init({
  // env 参数说明：
  //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
  //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
  //   如不填则使用默认环境（第一个创建的环境）
  // env: 'my-env-id',
  traceUser: true,
})
```

![](http://img-repo.poetries.top/images/20210830110805.png)

> 在 env: 'my-env-id'处改成你的环境ID，注意需要填入的是你的环境ID而不是环境名称哦，结果如下：

```js
// 因为云开发可以创建多个环境，比如微信小程序就可以创建两个免费的云开发环境，一个用于测试，一个用于正式发布。如果你没有在小程序端指定环境，会默认选择为你创建的第一个云开发环境。我们可以通过修改env的参数来切换小程序端用来调用的云开发环境。
wx.cloud.init({
  env: 'cloud1-2g12nyjfdh7f4caed9',

  // 云开发能力全局只需要初始化一次即可，这里的traceUser属性设置为true，会将用户访问记录到用户管理中，在云开发控制台的运营分析—用户访问里可以看到访问记录。
  traceUser: true,
})
```

### 小程序云开发资源的管理

**小程序云开发控制台**

![](http://img-repo.poetries.top/images/20210830111520.png)

**腾讯云云开发网页控制台**

> 我们还可以使用腾讯云云开发网页控制台来管理云开发资源，需要注意两点，一个是登录方式需要选择其他登录方式里的微信公众号，点击然后使用手机微信扫码，在微信上选择你要登录的小程序；二是要进入腾讯云后台之后切换选择云开发Cloudbase。

![](http://img-repo.poetries.top/images/20210830111557.png)
![](http://img-repo.poetries.top/images/20210830111607.png)
![](http://img-repo.poetries.top/images/20210830111625.png)

### 其他工具与方式

云开发资源还支持其他方式来调用

- CloudBase CLI：我们可以使用云开发提供的命令行工具 [CloudBase CLI](https://docs.cloudbase.net/cli/intro.html) 对云开发环境里面的资源进行批量管理，比如云函数批量下载更新；云存储里面的文件夹批量下载和上传等等；
- `Tencent CloudBase Toolkit`：Tencent CloudBase Toolkit是一款Visual Studio Code的云开发插件，使用这个插件可以更好地在本地进行云开发项目开发和代码调试，并且轻松将项目部署到云端；

![](http://img-repo.poetries.top/images/20210830111817.png)

### 部署并上传云函数

**云函数的根目录与云函数目录**

> cloudfuntions文件夹图标里有朵小云，表示这就是云函数根目录。展开cloudfunctions，我们可以看到里面有login、openapi、callback、echo等文件夹，这些就是云函数目录。而miniprogram文件夹则放置的是小程序的页面文件

cloudfunctions里放的是云函数，miniprogram放的是小程序的页面，这并不是一成不变的，也就是说你也可以修改这些文件夹的名称，这取决于项目配置文件`project.config.json`里的如下配置项：

```
"miniprogramRoot":  "miniprogram/",
"cloudfunctionRoot":  "cloudfunctions/",
```

但是你最好是让放小程序页面的文件夹以及放云函数的文件夹处于平级关系且都在项目的根目录下，便于管理。

**云函数部署与上传**

- 右键云函数目录，选择在终端中打开，输入`npm install`命令下载依赖文件；
- 然后再右键云函数目录，点击“创建并部署：所有文件”
- 在云开发控制台–云函数–云函数列表查看云函数是否部署成功。


## 2.5 小程序云函数场景

### 小程序云开发对比不同方式获取用户信息的应用场景

![](http://img-repo.poetries.top/images/20210909114318.png)
![](http://img-repo.poetries.top/images/20210909115128.png)
![](http://img-repo.poetries.top/images/20210909115658.png)

### 小程序码

![](http://img-repo.poetries.top/images/20210909115740.png)

### 图片上传

![](http://img-repo.poetries.top/images/20210905154352.png)
![](http://img-repo.poetries.top/images/20210905154454.png)


### 云函数路由优化tcb-router

```
npm i tcb-router
```

![](http://img-repo.poetries.top/images/20210909112822.png)
![](http://img-repo.poetries.top/images/20210909112915.png)
![](http://img-repo.poetries.top/images/20210909112943.png)

### 云函数超时时间

![](http://img-repo.poetries.top/images/20210905143347.png)


### 订阅消息

- 消息推送位置：服务通知
- 消息下发条件：用户自主订阅
- 消息卡片：查看详情可以跳转到小程序页面

**使用步骤**

1、在微信公众平台上获取消息模板的ID
2、获取下发的权限：


```
wx.requestSubscribeMessage({
    tmplIds: ['模板ID'],
    success(res) { 
      console.log(res)
    }
  })
```

> `subscribeNew`: 获取下发消息的权限，由用户自主选择订阅

```js
subscribeNew:function(){
   wx.requestSubscribeMessage({
     tmplIds: ['模板ID'],
     success(res) { 
       console.log(res)
     }
   })
}
```

![](http://img-repo.poetries.top/images/20210906134316.png)

![](http://img-repo.poetries.top/images/20210905171014.png)
![](http://img-repo.poetries.top/images/20210905171103.png)
![](http://img-repo.poetries.top/images/20210905171125.png)

![](http://img-repo.poetries.top/images/20210909113952.png)

![](http://img-repo.poetries.top/images/20210905171621.png)

3、调用接口下发订阅消息：`subscribeMessage.send`

这里是云调用订阅消息，首先要创建一个云函数

需要在config.json中配置`subscribeMessage.send`权限

config.json:

```
"permissions": {
  "openapi": [
    "openapi.subscribeMessage.send"
  ]
}
```


云函数编写

```js
// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  console.log(event,'sendMessage')
  // 订阅消息推送
  const res = await cloud.openapi.subscribeMessage.send({
    touser: wxContext.OPENID,
    page: `/pages/index/index`,
    lang: 'zh_CN',
    data: {
      name1: {
        value: event.user_name
      },
      thing7: {
        value: event.name
      },
      phone_number5: {
        value: event.phone
      },
      thing6: {
        value: event.xueli
      }
    },
    templateId: 'yXgBDeiRvjIZ98zOA1212CJeCXw8fj09Ir0sNT3ZXI7H0sw', // 模板id
  })
  return res
}
```

![](http://img-repo.poetries.top/images/20210909114130.png)

当用户订阅消息之后，就可以给用户下发消息了。

```
<view bindtap="sendNew">发送消息</view>
```

```js
sendNew:function(){
    wx.cloud.callFunction({
      // 要调用的云函数名称
      name: 'sendNew',
      // 传递给云函数的参数
      data: {
        openid: '',
        theme:"团建",
        address:"xx"
      },
      success: res => {
        console.log(res)
        // output: res.result === 3
      },
      fail: err => {
        console.log(err)
        // handle error
      },
    })
}
```

最后将云函数上传部署，使用手机测试，成功后，在微信的服务通知就会收到了订阅的消息

![](http://img-repo.poetries.top/images/20210906134517.png)


### 定时触发器

每天指定时间执行云函数

![](http://img-repo.poetries.top/images/20210905143230.png)
![](http://img-repo.poetries.top/images/20210905143302.png)

## 2.6 云数据库

**1. 云数据库获取100条数据突破**

![](http://img-repo.poetries.top/images/20210905142630.png)

**2. 分页查询数据库**

![](http://img-repo.poetries.top/images/20210905143553.png)

**3. 模糊查询**

![](http://img-repo.poetries.top/images/20210909113505.png)
![](http://img-repo.poetries.top/images/20210909113515.png)

**4. 数据权限管理**

![](http://img-repo.poetries.top/images/20210909113617.png)

**5. 云数据库中1对N关系的三种设计方式**

![](http://img-repo.poetries.top/images/20210905165740.png)
![](http://img-repo.poetries.top/images/20210905170014.png)
![](http://img-repo.poetries.top/images/20210905170132.png)

## 2.7 小程序云函数调试

### 控制台调试

![](http://img-repo.poetries.top/images/20210904213740.png)
![](http://img-repo.poetries.top/images/20210904214040.png)

### vscode本地调试

选择“云端函数”列表右侧的 ，向云端函数发送触发事件。

![](http://img-repo.poetries.top/images/20210908143618.png)

## 2.8 小程序云开发部署管理后台演示-触发云函数的运用

![](http://img-repo.poetries.top/images/20210909123158.png)

### 接口调用凭证access_token的缓存与更新

> https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/access-token/auth.getAccessToken.html

```js
const fs = require('fs')
const path = require('path')
const rp = require('request-promise')
const {APPID,SECRET} = require('./config')

const fileName = path.resolve(__dirname, './access_token.json')

/**
 * 每个接口调用都需要access_token
 */

const URL = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`

// ![](http://img-repo.poetries.top/images/20210905185325.png)
const updateAccessToken = async ()=>{
  const resStr = await rp(URL)
  const res = JSON.parse(resStr)
  if(res.access_token) {
    fs.writeFileSync(fileName,JSON.stringify({
      access_token: res.access_token,
      createTime: new Date()
    }))
  }else{
    await updateAccessToken()
  }
}

const getAccessToken = async ()=>{
  try {
    const res = fs.readFileSync(fileName, 'utf8')
    const obj = JSON.parse(res)
    const createTime = new Date(obj.createTime).getTime()
    const nowTime = new Date().getTime()
    if((nowTime - createTime) / 1000 / 60 / 60 >= 2) {
      // token过期
      await updateAccessToken()
      await getAccessToken()
    }
    return obj.access_token
  } catch (error) {
    await updateAccessToken()
    await getAccessToken()
  }
}

// setInterval(async () => {
//   await updateAccessToken()
  // 在2小时上减去5分钟 提前刷新token 平滑过渡
// }, (7200 - 300)*1000);

const getAccessToken2 = async ()=>{
  try {
    const resStr = await rp(URL)
    const res = JSON.parse(resStr)
  
    return res.access_token
  } catch (error) {
    return ''
  }
}

module.exports = getAccessToken2
```

### HTTP API 触发云函数

> https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-http-api/functions/invokeCloudFunction.html

```js
// utils/callCloudFn

const getAccessToken = require('./getAccessToken')
const rp = require('request-promise')

/**
 * 调用云函数方法
 * @param {d} ctx 
 * @param {*} fnName 
 * @param {*} params 
 * @returns 
 */
const callCloudFn = async (ctx, fnName, params) =>{
  const ACCESS_TOKEN = await getAccessToken()
  const options = {
    method: 'POST',
    uri: `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${ACCESS_TOKEN}&env=${ctx.env}&name=${fnName}`,
    body: {
      ...params
    },
    json: true
  }
  return await rp(options).then(res=>JSON.parse(res.resp_data).data)
}

module.exports = callCloudFn
```

```js
// utils/callCloudStorage

const getAccessToken = require('./getAccessToken')
const rp = require('request-promise')
const fs = require('fs')

/**
 * 获取文件下载链接 把fileId转化成http地址
 */
const callCloudStorage = {
  async download(ctx,fileList) {
    const ACCESS_TOKEN = await getAccessToken()
    const options = {
      method: 'POST',
      uri: `https://api.weixin.qq.com/tcb/batchdownloadfile?access_token=${ACCESS_TOKEN}`,
      body: {
        "file_list": fileList,
        "env": ctx.env
      },
      json: true
    }
    return await rp(options).then(res=>res)
  },
  // 上传图片
  async upload(ctx) {
    const ACCESS_TOKEN = await getAccessToken()
    const file = ctx.request.files.file

    // 上传到云存储指定文件夹blog
    const path = `day/${Date.now()}-${Math.random()}-${file.name}`
    const options = {
      method: 'POST',
      uri: `https://api.weixin.qq.com/tcb/uploadfile?access_token=${ACCESS_TOKEN}`,
      body: {
        "path": path,
        "env": ctx.env
      },
      json: true
    }
    const info = await rp(options).then(res=>res)

    console.log(info,'----upload info----')

    // 2 上传图片
    const params = {
      method: "POST",
      headers: {
        'content-type': "multipart/form-data"
      },
      uri: info.url,
      formData: {
        key: path,
        Signature: info.authorization,
        'x-cos-security-token': info.token,
        'x-cos-meta-fileid': info.cos_file_id,
        file: fs.createReadStream(file.path)
      },
      json: true
    }
    await rp(params)

    return info.file_id
  },
  // 删除云储存图片
  async delete(ctx, fileid_list) {
    const ACCESS_TOKEN = await getAccessToken()
    const file = ctx.query.file 
    // 上传到云存储指定文件夹blog
    const path = `blog/${Date.now()}-${Math.random()}-${file}`
    const options = {
      method: 'POST',
      uri: `https://api.weixin.qq.com/tcb/batchdeletefile?access_token=${ACCESS_TOKEN}`,
      body: {
        "fileid_list": fileid_list,
        "env": ctx.env
      },
      json: true
    }
    return await rp(options).then(res=>res)
  }
}

module.exports = callCloudStorage
```

```js
// 使用

router.get('/day/list', async (ctx, next) => {
  const data = await callCloudFn(ctx, 'day', {
    $url: 'list',
    pageSize: 30,
    pageNum: 0
  })

  // 文件下载链接 cloud=>http格式
  let fileList = []
  data.forEach(v=>{
    if(v.image.indexOf('cloud://') > -1) {
      fileList.push({
        fileid: v.image,
        max_age: 7200
      })
    }
  })
  
  if(fileList.length) {
    const downloadRes = await callCloudStorage.download(ctx,fileList)
    const downloadFileList = downloadRes.file_list || []
    
    downloadFileList.forEach(v=>{
      data.forEach(vv=>{
        if(v.fileid === vv.image) {
          // 获取云存储的http图片路径
          vv.image = v.download_url
        }
      })
    })
  }
  

  ctx.body = {
    data,
    code: 200
  }
})
```




# 三、不同厂商的serverless部署演示

## 3.1 腾讯serverless

### 1、Web 函数管理

**Web 函数运行原理如下图所示：**

![](http://img-repo.poetries.top/images/20210908112127.png)

用户发送的 HTTP 请求经过 API 网关后，网关侧将原生请求直接透传的同时，在请求头部添加了网关触发函数时需要的函数名、函数地域等内容，并一起传递到函数环境，触发后端函数执行。

函数环境内，通过内置的 Proxy 实现 Nginx 转发，并去除头部非产品规范的请求信息，将原生 HTTP 请求通过指定端口发送给用户的 Web Server 服务。

用户的 Web Server 配置好指定的监听端口9000和服务启动文件后部署到云端，通过该端口获取 HTTP 请求并进行处理。

**Web 函数请求限制**

- Web 函数只能通过 API 网关调用，不支持通过函数 API 接口触发。
- 在 Response headers 中有以下限制：
  - 所有 key 和 value 的大小不超过4KB。
  - body 的大小不超过6MB。
- 部署您的 Web 服务时，`必须监听指定的 9000 端口`，不可以监听内部回环地址 `127.0.0.1`。
- 目前 HTTP 请求 Header 里的 Connection 字段不支持自定义配置。

**启动文件作用**

> scf_bootstrap 为 Web Server 的启动文件，保证您的 Web 服务正常启动并监听请求。除此之外，您还可以根据需要在 scf_bootstrap 中自定义实现更多个性化操作：

- 设定运行时依赖库的路径及环境变量等。
- 加载自定义语言及版本依赖的库文件及扩展程序等，如仍有依赖文件需要实时拉取，可下载至 /tmp 目录。
- 解析函数文件，并执行函数调用前所需的全局操作或初始化程序（如开发工具包客户端 HTTP CLIENT 等初始化、数据库连接池创建等），便于调用阶段复用。
- 启动安全、监控等插件。

![](http://img-repo.poetries.top/images/20210908113308.png)

**使用前提**

- 需具有可执行权限，请确保您的 `scf_bootstrap` 文件具备777或755权限，否则会因为权限不足而无法执行。
- 能够在 SCF 系统环境（CentOS 7.6）中运行。
- 如果启动命令文件是 shell 脚本，第一行需有 `#!/bin/bash`。
- 启动命令必须为绝对路径 `/var/lang/${specific_lang}${version}/bin/${specific_lang}`，否则无法正常调用，详情请参见 [标准语言环境绝对路径](https://cloud.tencent.com/document/product/583/56126#1)。
- 建议使用监听地址为 `0.0.0.0`，不可以使用内部回环地址 `127.0.0.1`

**标准语言环境绝对路径**

![](http://img-repo.poetries.top/images/20210908113549.png)

**常见 Web Server 启动命令模版**

![](http://img-repo.poetries.top/images/20210908113613.png)

### 2、serverless fromework及控制台部署

> serverless文档 https://www.serverless.com/cn/framework/docs/

**1. 控制台部署**

部署koa2管理端接口

![](http://img-repo.poetries.top/images/20210907164116.png)
![](http://img-repo.poetries.top/images/20210907164233.png)
![](http://img-repo.poetries.top/images/20210907164300.png)
![](http://img-repo.poetries.top/images/20210907164312.png)

> 官方demo https://github.com/tencentyun/serverless-demo/blob/master/WebFunc-KoaDemo/src/app.js

仓库关联GitHub，提交git代码自动更新

![](http://img-repo.poetries.top/images/20210907171452.png)

**2. 命令行部署-Serverless Framework方式**

**云函数和serverless的区别**

- `Serverless Framework` 是` Serverless `公司推出的一个开源的` Serverless` 应用开发框架。
- `Serverless Framework`是由 `Serverless Framework Plugin` 和 `Serverless Framework Components` 组成。
- `Serverless Framework Plugin` 实际上是一个函数的管理工具，使用这个工具，可以很轻松的<font color="#f00">**部署函数、删除函数、触发函数、查看函数信息、查看函数日志、回滚函数、查看函数**</font> 数据等。简单的概括就是`serverless`其实就云函数的集合体，使用`serverless`后我们创建的云函数不需要手动去创建触发器等操作。
- 官方地址
  - [`serverless`官网地址](https://www.serverless.com/)
  - [`serverless`中文官网](https://www.serverless.com/cn)
  - [`github`地址](https://github.com/serverless/serverless)

**Serverless Framework应用场景**

> 什么场景下需要使用`serverless`，而不是使用云函数，其实在实际开发过程中，我们都是使用`serverless`而不去使用云函数，毕竟云函数的使用场景受限，或者说比较基础。打一个简单的比方，在写`js`操作`dom`的时候，你会选择用原生`js`还是会使用`jquery`一样的比喻。

- 基于云函数的命令行开发工具
  - 通过 `Serverless Framework`，开发者可以在命令行完成函数的开发、部署、调试。还可以结合前端服务、 API 网关、数据库等其它云上资源，实现全栈应用的快速部署。
- 传统应用框架的快速迁移
  - `Serverless Framework` 提供了一套通用的框架迁移方案，通过使用 `Serverless Framework `提供的框架组件(`Egg/Koa/Express` 等，<font color="#f00">[更多的框架支持可以参考](https://github.com/serverless)</font>)，原有应用仅需几行代码简单改造， 即可快速迁移到函数平台。同时支持命令行与控制台的开发方式。

> 使用`serverless`命令创建第一个应用

全局安装命令

```
npm install -g serverless 
serverless -v
```

创建项目

> 在电脑的一个空目录下运行命令

```
serverless
```

根据提示选择你要创建的模板

> 控制台输入 `serverless` 

选择对应的模板


![](http://img-repo.poetries.top/images/20210909134505.png)


部署上线

```
serverless deploy
```

![](http://img-repo.poetries.top/images/20210909135902.png)
![](http://img-repo.poetries.top/images/20210909134955.png)
![](http://img-repo.poetries.top/images/20210909135104.png)

**serverless.yml配置详情**

> > https://github.com/serverless-components/tencent-http/blob/master/docs/configure.md

部署上线后可以在这里查看你的项目

![](http://img-repo.poetries.top/images/20210907222947.png)

测试部署的项目

![](http://img-repo.poetries.top/images/20210907222956.png)

删除部署的项目

![](http://img-repo.poetries.top/images/20210909140209.png)


**3. 在vscode中配置插件来开发serverless**

在`vscode`上安装插件

![](http://img-repo.poetries.top/images/20210908093524.png)

在`vscode`安装后插件登录并且拉取应用

![](http://img-repo.poetries.top/images/20210908093544.png)

关于登录账号及密钥[查看地址](https://console.cloud.tencent.com/cam/capi)

远程拉取代码

![](http://img-repo.poetries.top/images/20210908093655.png)

下载后的代码如果想上传也可以直接上传的

![](http://img-repo.poetries.top/images/20210908093704.png)

**WebIDE创建云函数实践**

![](http://img-repo.poetries.top/images/20210908094739.png)
![](http://img-repo.poetries.top/images/20210908094748.png)

### 3、serverless部署前端项目

> 建议使用 Serverless Framework CLI，可快速部署本地云函数

- 使用命令生成`vue`项目文件
- 直接将代码推送到云端就可以
- 也许你会好奇，我们正常的`vue`项目部署都要先`npm run build`,然后将打包后的`dist`目录传到服务器上的`nginx`静态目录下，这样才能访问
- 注意前端的项目部署都是存储到`oss`中的
- 使用`serverless`默认生成的项目是`vue2`版本的，如果你要部署`vue3`的项目需要手动构建

```yml
# serverless.yml文件
component: website
name: vue-starter
app: vue-demo-70a4c710

inputs:
  src:
    src: ./src
    # 配置了这个hook每次发布的时候会先build
    hook: npm run build
    dist: ./dist
  bucketName: my-vue-starter
  protocol: https
```

**手动构建一个`vue3`的项目**

- [参考文档](https://github.com/serverless-components/tencent-website/)
- 使用脚手架创建一个`vue3`项目
- 初始化一个`serverless.yml`文件

```
serverless init website-starter --name example
```

> 将这个`serverless.yml`文件复制到`vue3`项目中

简单的修改下

```yaml
component: website
name: websiteDemo
app: vue3-demo-6cb9842a

inputs:
  src:
    src: ./src
    hook: npm run build
    dist: ./dist
  region: ap-guangzhou
  bucketName: my-website-starter
  protocol: https
```

> 部署上线 `serverless deploy`

**手动部署`react`项目**

> 手动创建一个`react`项目

```
npx create-react-app react-demo --template typescript
```

> 在`react`根目录下创建一个`serverless.yml`的文件

```yaml
component: website
# 这里修改下
name: react-starter
# 这里修改下
app: reactDemo

inputs:
  src:
    src: ./src
    hook: npm run build
    # 这里要根据你打包后的目录
    dist: ./build
  # 这个定义下
  bucketName: my-react-starter
  protocol: https
```

> 推送到云端 `serverless deploy`

**使用静态文件托管来部署前端项目**

- 先本地根据项目命令打包好
- 在云产品中选择静态文件托管

![](http://img-repo.poetries.top/images/20210908100907.png)

- 直接将上传你打包后的代码

![](http://img-repo.poetries.top/images/20210908100915.png)

### 4、在serverless中连接mysql

**数据库的准备**

> 使用`serverless`开发与我们自己使用云服务器服务器`ECS`不一样的，因为我们不能在`serverless`上安装软件(我们不能安装第三方的`mysql`、`docker`、`redis`)等软件，因此我们在使用`serverless`开发的时候，如果我们项目中使用到了比如:`mysql`、`redis`、`rabbitMQ`、`RocketMQ`类的我们就需要自行解决。下面介绍几种方式

1. 自己有一台备用的云服务器`ECS`，我们在上面安装了需要的软件，对外提供了`IP`或者域名，在安全组中开放了端口号以供我们在`serverless`中使用。<font color="#f00">其实如果你自己有云服务器`ECS`可能就不会考虑使用`serverless`来开发了</font>
2. 单独使用第三方付费或者按量收费的数据库，比如:
  * 阿里云的[云数据库RDS MySQL](https://www.aliyun.com/product/rds/mysql)
  * 腾讯云的数据库[云数据库](https://buy.cloud.tencent.com/cdb?)
3. 使用腾讯云官方自带的有免费额度的`NoSQL`数据库[参考文档](https://docs.cloudbase.net/database/data-type.html#date)，本训练营会介绍如何使用，但是在项目中不会使用。
4. 我在自己的服务器上使用`docker`搭建了一个`mysql8`版本的数据库，以供大家学习使用，自己根据自己的名字来在上面创建自己的数据库。<font color="#f00">大家自行保存地址，如果自己有服务器的，可以自己服务器上搭建，就不需要用我这个</font>


```
# ip地址
8.129.234.99
# 用户名
root
# 密码
123456
```

**在`serverless`中连接`mysql`**

本案例只是测试官方案例连接数据库，不涉及什么知识点，根据自身条件选择是否跳过

> 在函数服务中选择`mysql`数据库模板来创建数据库云函数应用。<font color="#f00">注意选择的语音和区域</font>

![](http://img-repo.poetries.top/images/20210908101905.png)

> 在自己的数据库中创建数据库及数据表

```mysql
-- 创建数据表sql
CREATE TABLE `account` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(100) NOT NULL COMMENT '密码',
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `deleted_at` timestamp(6) NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

```mysql
-- 插入几条数据sql
insert into account(username, password) values('admin', '123456');
insert into account(username, password) values('张三', '123456');
```

> 打开云函数的代码管理修改数据库的连接配置

![](http://img-repo.poetries.top/images/20210908101915.png)

> 进入代码编辑界面的函数代码编辑代码

```javascript
function wrapPromise(connection, sql) {
  return new Promise((res, rej) => {
    connection.query(sql, function(error, results, fields) {
      if (error) {
        rej(error)
      }
      res(results)
    })
  })
}
exports.main_handler = async (event, context, callback) => {
  const mysql = require('mysql');
  const connection = mysql.createConnection({
    host: '8.129.234.99', //  云数据库实例ip地址
    user: 'root', // 云数据库用户名，如root
    password: '123456', // 云数据库密码
    database: 'serverless_nest' //  数据库名称
  });

  connection.connect();
  // 你需要查询的sql文件
  const querySql = `SELECT * from account`
  // 查询结果
  let queryResult = await wrapPromise(connection, querySql)
  
  connection.end();

  return queryResult
}
```

> 修改完成后点击部署和测试

![](http://img-repo.poetries.top/images/20210908101926.png)

出现下面界面表示你已经在云函数中连接`mysql`成功了

![](http://img-repo.poetries.top/images/20210908101935.png)

> 如果你想在浏览器上测试访问，可以点击**触发管理**

![](http://img-repo.poetries.top/images/20210908101943.png)

### 5、云开发与serverless的区别

- `Serverless Framework` 是无服务器应用框架，提供将云函数` SCF`、`API` 网关、对象存储 `COS`、云数据库 `DB` 等资源组合的业务框架，开发者可以直接基于框架编写业务逻辑，而无需关注底层资源的配置和管理。
- 云开发（`Tencent CloudBase，TCB`）是腾讯云提供的云原生一体化开发环境和工具平台，为开发者提供高可用、自动弹性扩缩的后端云服务，包含计算、存储、托管等 `serverless` 化能力，可用于云端一体化开发多种端应用（小程序、公众号、`Web` 应用、`Flutter` 客户端等），帮助开发者统一构建和管理后端服务和云资源，避免了应用开发过程中繁琐的服务器搭建及运维，开发者可以专注于业务逻辑的实现，开发门槛更低，效率更高。
- **二者最大的区别是**：给开发者使用的平台支持不一样，云开发支持web端、QQ、微信小程序级静态网站托管等这些平台服务。

**使用云开发创建一个`nest`项目**

在产品中选择云开发产品

![](http://img-repo.poetries.top/images/20210908102916.png)

创建一个项目,注意点:这里要选择好区域，下次创建了项目，区域不一样，可能项目就看不到

![](http://img-repo.poetries.top/images/20210908102926.png)

使用模板创建

![](http://img-repo.poetries.top/images/20210908102935.png)

查看自己创建应用并且访问

![](http://img-repo.poetries.top/images/20210908102946.png)

**使用脚手架的方式创建**

全局安装脚手架包[官方地址](https://docs.cloudbase.net/cli/intro.html)

```
npm i -g @cloudbase/cli
```

测试安装是否成功

```
cloudbase -v
```

登录

```
cloudbase login
```

本地创建项目

```
tcb new <appName> [template] 
# 比如
tcb new nest-cloundbase nest-starter
```

选择自己已经创建的环境,如果没有就 创建新环境,这时候会打开浏览器

![](http://img-repo.poetries.top/images/20210908102958.png)

本地打开项目并且安装依赖包

```
npm run dev
```

部署到线上

```properties
npm run deploy
```

![](http://img-repo.poetries.top/images/20210908103013.png)

**在云开发中使用`NoSQL`**

在面板上创建一个`NoSQL`的数据库，[参考地址](https://docs.cloudbase.net/database/introduce.html)

![](http://img-repo.poetries.top/images/20210908103028.png)

在项目中安装连接数据库的`SDK`[参考文档](https://docs.cloudbase.net/api-reference/server/node-sdk/introduction.html)

```
npm install @cloudbase/node-sdk
```

初始化数据库连接[参考地址](https://docs.cloudbase.net/api-reference/server/node-sdk/initialization.html#init)

```js
import cloudbase from '@cloudbase/node-sdk';
  
// 注意以下几个参数是必填的,文档上说的是非必填
const app = cloudbase.init({
  secretId: 'xx',
  secretKey: 'yy',
  env: 'xx',
  // 根据你创建的区域来写,目前只有上海(ap-shanghai)、广州(ap-guangzhou)
  region: 'ap-shanghai'
})

// 1. 获取数据库引用
const db = app.database();
```

关于获取`secretId`、`secretKey`、`env`的地址

- `env`的获取地址

![](http://img-repo.poetries.top/images/20210908103040.png)

- `secretId` 和`secretKey`获取

![](http://img-repo.poetries.top/images/20210908103051.png)

- 点击`test`用户进入

![](http://img-repo.poetries.top/images/20210908103101.png)

根据文档，我们将插入一条数据(**同样先忽视类型检测**)

```typescript
async createAccount(data: any): Promise<any> {
  const res = await db.collection('account')
    .add({
      ...data,
    });
  return res;
}
```

**环境变量的配置**

本地开发环境变量的配置

* 安装依赖包

```
npm install dotenv
npm install @types/dotenv -D
```

> 在项目根目录下创建一个`.env`的文件用来存储一些敏感信息

```
PORT=7000

SECRET_ID = AKIDMfCxx2stVYNUx
SECRET_KEY = d3C7pxxxv1VqiMrBHS
ENV = serverlxxim00f1a872
REGION = ap-guangzhou
```

在应用中使用使用环境变量的值

```typescript
const app = cloudbase.init({
  secretId: process.env.SECRET_ID,
  secretKey: process.env.SECRET_KEY,
  env: process.env.ENV,
  // 根据你创建的区域来写,目前只有上海(ap-shanghai)、广州(ap-guangzhou)
  region: process.env.REGION
})
```

## 3.2 阿里云函数部署

![](http://img-repo.poetries.top/images/20210907200749.png)

## 3.3 vercel部署

> 国外挺好用的一个serverless免费平台

![](http://img-repo.poetries.top/images/20210909140036.png)
![](http://img-repo.poetries.top/images/20210909140058.png)

