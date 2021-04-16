---
title: serverless简介及应用
date: 2021-04-16 15:24:08
tags: serverless
categories: Front-End
---


## 什么是serverless

> Serverless 能解决什么问题？理清 Serverless 要解决的问题其实很简单，我们可以从字面上把它拆开来看。Server 这里指服务端，它是 Serverless 解决问题的边界；而 less 我们可以理解为较少关心，它是 Serverless 解决问题的目的。组合在一起就是“较少关心服务端”

- 第一种：`狭义 Serverless`（最常见）= `Serverless computing 架构` = `FaaS 架构` = `Trigger（事件驱动）+ FaaS（函数即服务）+ BaaS`（后端即服务，持久化或第三方服务）= `FaaS + BaaS`
- 第二种：广义 `Serverless` = `服务端免运维` = `具备 Serverless 特性的云服务`

![](http://img-repo.poetries.top/images/20210416155216.png)

## FaaS 是怎么运行的

![](http://img-repo.poetries.top/images/20210416155334.png)

![](http://img-repo.poetries.top/images/20210416155401.png)

## FaaS 为什么可以极速启动

FaaS 中的冷启动是指从调用函数开始到函数实例准备完成的整个过程。冷启动我们关注的是启动时间，启动时间越短，我们对资源的利用率就越高。现在的云服务商，基于不同的语言特性，冷启动平均耗时基本在 `100～700 毫秒`之间。得益于 Google 的 JavaScript 引擎 Just In Time 特性，Node.js 在冷启动方面速度是最快的。

![](http://img-repo.poetries.top/images/20210416155824.png)

> 注意，FaaS 服务从 0 开始，启动并执行完一个函数，只需要 100 毫秒。这也是为什么 FaaS 敢缩容到 0 的主要原因。通常我们打开一个网页有个关键指标，响应时间在 1 秒以内，都算优秀。这么一对比，100 毫秒的启动时间，对于网页的秒开率影响真的极小

## FaaS 是怎么分层的


![](https://files.mdnice.com/user/6541/5d7d3769-4fc0-4036-bd1b-91e9a650c2c3.png)

> 你的 FaaS 实例执行时，就如上图所示，至少是 3 层结构：容器、运行时 Runtime、具体函数代码。

容器你可以理解为操作系统 OS。代码要运行，总需要和硬件打交道，容器就是模拟出内核和硬件信息，让你的代码和 Runtime 可以在里面运行。容器的信息包括内存大小、OS 版本、CPU 信息、环境变量等等。目前的 FaaS 实现方案中，容器方案可能是 Docker 容器、VM 虚拟机，甚至 Sandbox 沙盒环境。运行时 Runtime，就是你的函数执行时的上下文 context。Runtime 的信息包括代码运行的语言和版本，例如 Node.js v10，Python3.6；可调用对象，例如 aliyun SDK；系统信息，例如环境变量等等。

> - 这样分层有什么好处呢？容器层适用性更广，云服务商可以预热大量的容器实例，将物理服务器的计算资源碎片化。Runtime 的实例适用性较低，可以少量预热；容器和 Runtime 固定后，下载你的代码就可以执行了。通过分层，我们可以做到资源统筹优化，这样就能让你的代码快速低成本地被执行。
> - 理解了分层，我们再回想一下 FaaS 分层对应冷启动的过程，其实你就不难理解云服务商负责的就是容器和 Runtime 的准备阶段了。而开发者自己负责的则是函数执行阶段。一旦容器 &Runtime 启动后，就会维持一段时间，这段时间内的这个函数实例就可以直接处理用户数据请求。当一段时间内没有用户请求事件发生（各个云服务商维持实例的时间和策略不同），则会销毁这个函数实例。

![](http://img-repo.poetries.top/images/20210416160251.png)

- 纯 FaaS 应用调用链路由函数触发器、函数服务和函数代码三部分组成，它们分别替代了传统服务端运维的负载均衡 & 反向代理，服务器 & 应用运行环境，应用代码部署
- 对比传统应用托管 PaaS 平台，FaaS 应用最大的不同就是，FaaS 应用可以缩容到 0，在事件到来时极速启动，Node.js 的函数甚至可以做到 100ms 启动并执行。
- FaaS 在设计上牺牲了用户的可控性和应用场景，来简化代码模型，并且通过分层结构进一步提升资源的利用率，这也是为什么 FaaS 冷启动时间能这么短的主要原因。关于 FaaS 的 3 层结构，你可以这么想象：容器层就像是 Windows 操作系统；Runtime 就像是 Windows 里面的播放器暴风影音；你的代码就像是放在 U 盘里的电影

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



