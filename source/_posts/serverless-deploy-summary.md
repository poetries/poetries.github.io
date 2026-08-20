---
title: Serverless 部署前后端项目实践，腾讯云 SCF 全流程笔记
description: 从 Serverless 架构概念讲到腾讯云 SCF 实操，完整记录 Egg、Nest.js、Koa、Vue、React、VuePress 项目的部署流程，覆盖 HTTP 组件、Layer 分层、COS 图片上传、VPC 私有网络与域名 HTTPS 配置。
date: 2022-06-18 10:10:24
tags:
  - 部署
  - serverless
  - 腾讯云
  - Node.js
categories: Front-End
---

一个只有几十个日活的小后台，为了它长期挂着一台 2 核 4G 的云主机，每月几十块钱雷打不动，还得自己管 nginx、管 pm2、管证书续期。这个账我算了很久都觉得不划算。后来把这类项目陆续搬到了腾讯云 Serverless 上，代码几乎没改，成本降到了免费额度以内，运维那部分直接消失了。

这篇是我把 Egg、Nest.js、Koa 三种 Node 后端框架，以及 Vue、React、VuePress 三种静态站点搬上腾讯云 SCF 的完整过程记录。从概念、脚手架安装，一直到 `serverless.yml` 每个字段怎么填、Layer 怎么拆、COS 图片上传怎么配、域名和 HTTPS 怎么绑，中间踩过的坑和控制台截图都留着。看完你应该能自己独立把一个项目部署上去。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Serverless 到底是什么，它和传统 ServerFul 架构、和「云函数」的区别在哪
- serverless 脚手架安装，以及 WebIDE、VS Code 插件两条开发路径
- 用 Serverless Framework 的 HTTP 组件部署 Egg、Nest.js、Koa 项目的完整配置
- 用 Layer 分层把 `node_modules` 拆出去，让 `sls deploy` 快起来
- 用 website 组件部署 Vue、React、VuePress 静态站
- 云函数里连 MySQL 和 MongoDB，VPC 私有网络该怎么配
- COS 对象存储介绍，以及 Express 在 Serverless 里实现图片上传
- 自定义域名、HTTPS 证书，以及配额超限时的绕过办法

## 一、Serverless 架构介绍与安装

先把概念捋清楚，不然后面看 `serverless.yml` 里那些字段会一头雾水。

`Serverless` 又名无服务器。所谓无服务器并非是说不需要依赖和依靠服务器等资源，而是开发者再也不用过多考虑服务器的问题，可以更专注在产品代码上。

它是一种软件系统架构的思想和方法，不是软件框架、类库或者工具。它与传统架构的不同之处在于，完全由第三方管理，由事件触发，存在于无状态（`Stateless`）、暂存（可能只存在于一次调用的过程中）计算容器内。构建无服务器应用程序，指的是开发者可以专注在产品代码上，而无须管理和操作云端或本地的服务器或运行时（运行时通俗的讲就是运行环境，比如 `nodejs` 环境、`java` 环境、`php` 环境）。`Serverless` 真正做到了部署应用无需涉及基础设施的建设，自动构建、部署和启动服务。

一句话概括就是，**Serverless 是构建和运行软件时不需要关心服务器的一种架构思想**。

虚拟主机已经是快被淘汰掉的上一代产物了。云计算涌现出很多改变传统 IT 架构和运维方式的新技术，比如虚拟机、容器、微服务，无论这些技术应用在哪些场景，降低成本、提升效率是云服务永恒的主题。Serverless 的出现，把降低成本和提升效率这两件事同时往前推了一大步。它真正做到了 `弹性伸缩`、`高并发`、`按需收费`、`备份容灾`、`日志监控` 等能力开箱即用。

我自己的感受是，Serverless 最爽的不是省钱，而是「没有服务器可以坏」。以前半夜收到磁盘写满的告警，现在这类告警根本不存在。

### 1.1 传统的开发模式与 Serverless 开发模式对比

先看两张图的对比，能直观感受到差别在哪。下面这张是传统模式，从买机器、装环境、配 nginx 到发布，链路里每一环都要你自己负责。

![传统开发模式的部署链路](https://s.poetries.top/uploads/2022/06/f328901c0adb56de.png)

图里每一个方框都是你要维护的东西，少一个环节服务就起不来。

再看 Serverless 的开发模式，中间那一大段基础设施被云厂商吃掉了，你的交付物退化成「一份代码 + 一份配置」。

![Serverless 开发模式的部署链路](https://s.poetries.top/uploads/2022/06/bcc852ef2bc8fbd7.png)

从流程视角再看一次，Serverless 改变的是整个软件交付的节奏，不只是省了几台机器。

![Serverless 对软件开发流程的改变](https://s.poetries.top/uploads/2022/07/44fa5d83bc09c564.png)

### 1.2 Serverless 和 ServerFul 架构的区别

#### 传统的 ServerFul 架构模式

ServerFul 架构就是 n 台 Server 通过网络通信的方式协作在一起。也可以说，ServerFul 架构是基于 Server 和网络通信（分布式计算）的软件实现架构，这里的 Server 可以是虚拟机、物理机，以及基于硬件实现的云服务器。

下面这张图画的就是这种结构，注意每个节点都需要你自己扩容和容灾。

![ServerFul 架构示意图](https://s.poetries.top/uploads/2022/07/a6ac5a7905e6f81c.png)

看图的时候留意一点，节点之间的连线越多，你要维护的运维复杂度就越高。

#### Serverless 架构模式

Serverless 的核心特点就是实现自动弹性伸缩和按量付费。同样一张架构图，画出来会干净很多。

![Serverless 架构示意图](https://s.poetries.top/uploads/2022/07/3d5b8a8b53bd5315.png)

这张图里你能看到的只剩函数和触发器，机器那一层被完全抹掉了。

### 1.3 使用 Serverless 的优势

优势主要落在三件事上，资源分配、计费方式和弹性伸缩。

- **资源分配**：在 `Serverless` 架构中，你不用关心应用运行的资源（比如服务配置、磁盘大小），只提供一份代码就行。
- **计费方式**：在 `Serverless` 架构中，计费方式按实际使用量计费（比如函数调用次数、运行时长），不按传统的执行代码所需的资源计费（比如固定 `CPU`）。计费精确到了毫秒级，而不是传统的小时级别。个别云厂商推出了每个月的免费额度，比如腾讯云当时提供了每个月 40 万 GBs 的资源使用额度和 100 万次调用次数的免费额度。中小企业的网站访问量不是特别大的话完全可以免费使用。

下面这张是当时控制台里的计费说明截图，可以对照着看单价构成。

![腾讯云 SCF 计费方式说明](https://s.poetries.top/uploads/2022/06/4f400ccd6d34b420.png)

这里补一句时效性的话，这篇写于 2022 年，文中所有额度和价格都是当时的行情。这几年各家的免费额度、计费单位和控制台界面都调整过好几轮，具体数字请以你打开控制台时看到的官方计费页为准，我不敢拿旧数字给你打包票。

- **弹性伸缩**：`Serverless` 架构的弹性伸缩更自动化、更精确，可以快速根据业务并发扩容更多的实例，甚至允许缩容到零实例状态来实现零费用，对用户来说是完全无感知的。而传统架构对服务器（虚拟机）进行扩容，虚拟机的启动速度也比较慢，需要几分钟甚至更久。

缩容到零这一条是最容易被低估的。一个内部工具站半夜没人访问，实例数就是 0，账单也是 0。

### 1.4 Serverless 的组成

这个词在不同语境下指的东西不一样，分开看会清楚很多。

- **广义的 Serverless** 更多是指一种技术理念，Serverless 是构建和运行软件时不需要关心服务器的一种架构思想。刚开始学 Serverless，你可以把它理解为虚拟主机的升级版本。
- **狭义的 Serverless** 是指现阶段主流的技术实现，由 `FaaS` 和 `BaaS` 两部分组成。

FaaS 就是云函数那一层，BaaS 是对象存储、数据库这些托管后端服务。下面这张图把两者的边界画得比较清楚。

![FaaS 与 BaaS 的组成关系](https://s.poetries.top/uploads/2022/07/e445b52f9d9a9958.png)

记住这个划分，第五章讲 COS 和数据库的时候还会用到它。

### 1.5 Serverless 开发流程

开发流程和传统模式最大的差别在于，没有「上线部署」这个独立环节，`sls deploy` 就是全部。

![Serverless 开发流程图](https://s.poetries.top/uploads/2022/07/1aa3208070a48915.png)

图里从写代码到线上可访问只有几步，后面第三章会把每一步落到具体命令上。

### 1.6 为什么要学 Serverless

先看看当时的招聘信息，能感受到岗位需求已经开始把它写进 JD 了。

![招聘信息中出现的 Serverless 要求](https://s.poetries.top/uploads/2022/07/c50918e799e3068b.png)

再看当时 GitHub 的 star 数量和 npm 周下载量走势，这几张是 2022 年抓的数据。

![Serverless 相关仓库的 star 增长](https://s.poetries.top/uploads/2022/07/9c63657e6a3dadb2.png)

![serverless 包的 npm 周下载量](https://s.poetries.top/uploads/2022/07/c7c5fe6b663fbe4f.png)

![Serverless 生态的关注度趋势](https://s.poetries.top/uploads/2022/07/750e45e4a038a162.png)

同样提醒一下，这几张趋势图是 2022 年的截面，现在的数字肯定不一样了，看趋势就好，别把绝对值当结论。

下面是当时已经在用 Serverless 的大公司名单。

![已采用 Serverless 的公司列表](https://s.poetries.top/uploads/2022/07/d0ace73fab7e28ba.png)

### 1.7 Serverless 的能力

厂商宣传的能力可以拆成计算、系统运维、业务运维三块来看。

#### 计算能力

- 资源按需分配，无需申请资源
- MicroVM 做租户级别强隔离，Docker 做进程级别隔离
- MicroVM + Docker 的轻量级资源可以做到毫秒级启动
- 实时扩容，阶梯缩容
- 按需收费

#### 系统运维能力

- 性能保障，整个链路耗时在毫秒级内，并支持 VPC 内网访问
- 安全保障
  - 资源对用户不可见，安全由云厂商提供专业的保障
  - 提供进程级和用户级安全隔离
  - 访问控制管理
- 自动扩缩容
  - 根据 CPU、内存、网络 IO 自动扩容底层资源
  - 根据请求数自动扩缩容函数实例，业务高峰期扩容满足高并发需求，业务低峰期缩容释放资源、降低成本
- 自愈能力，每一次请求都是一个健康的实例

这里必须单独拎出来讲一个概念，冷启动和热启动。这是 Serverless 和常驻进程最大的行为差异，也是最容易在线上咬你一口的地方。

> Serverless 中云函数被第一次调用会执行冷启动，云函数被多次连续调用会执行热启动。

![云函数冷启动与热启动示意](https://s.poetries.top/uploads/2022/07/527e0cfb402fa738.png)

看这张图的时候重点看时间轴，冷启动那一条多出来的就是实例初始化的开销。

- **冷启动**是指在服务器中新开辟一块空间供一个函数实例运行。这个过程有点像你把函数放到虚拟机里跑，每次运行前都要先启动虚拟机加载这个函数。以前冷启动非常耗时，目前云厂商已经能做到毫秒级别，这个过程我们不需要关心。但要注意的是，使用 Session 的时候可能会导致 Session 丢失，所以 Session 建议保存到数据库或者 Redis 里。
- **热启动**则是说，如果一个云函数被持续触发，云端就先不释放这个实例，下次请求仍然由之前已经创建的实例来运行。就好比虚拟机运行完函数之后没有关机，而是待机等待下一次调用。好处是省掉了「开机」这个耗时环节，代价是要一直维持激活状态，系统开销会大一些。

这个我踩过。第一版代码里我把登录态放在内存里，本地跑得好好的，上云之后随机掉登录。排查了一下午才反应过来是实例被回收了，内存里那份 Session 根本不保证还在。所以在 Serverless 里，任何进程内状态都要当成随时会消失来设计。

#### 业务运维能力

- 工具建设，包括 VS Code 插件、WebIDE、命令行、云 API、SDK
- 版本管理、操作管理等
- 故障排查
- 监控报警
- 容灾处理

### 1.8 主流 Serverless 厂商

国内外能选的厂商不少，各家的函数模型大同小异，差别主要在生态、区域和计费细节上。本文全程用腾讯云演示，因为它的 Serverless Framework 中文生态最完整，但思路在别家也通用。

* [亚马逊 AWS Lambda ](https://aws.amazon.com/cn/lambda/)
* [谷歌 Google Cloud Functions]( https://cloud.google.com/functions)
* [微软 Microsoft Azure]( https://www.azure.cn/)
* [阿里云函数计算](https://www.aliyun.com/product/fc)
* [腾讯云 云函数 SCF(Serverless Cloud Function)](https://cloud.tencent.com/product/scf )
* [华为云 FunctionGraph](https://www.huaweicloud.com/product/functiongraph.html)

### 1.9 云函数和 Serverless 的区别

这是刚上手时最容易卡住的一个点。我一开始也是这么想的，以为云函数就是 Serverless 的另一个叫法。等到在控制台选「模板方式创建」，结果建出来的东西叫 Serverless 应用而不是云函数，才发现两者不是一回事。

> 通过前面的介绍，我们认识到了云函数和 `serverless`，但可能会困惑它们到底有什么区别、有什么联系，为什么在创建云函数的时候选择模板方式创建，最后创建出来的是 `serverless` 应用，而不是一个云函数呢。下面就来解答这个问题。

- `Serverless Framework` 是 Serverless 公司推出的一个开源的 Serverless 应用开发框架
- `Serverless Framework` 由 `Serverless Framework Plugin` 和 `Serverless Framework Components` 两部分组成
- `Serverless Framework Plugin` 实际上是一个函数的管理工具，用它可以很轻松地部署函数、删除函数、触发函数、查看函数信息、查看函数日志、回滚函数、查看函数数据等

简单概括就是，**Serverless 是云函数的集合体加上一整套编排能力**。用了 Serverless Framework 之后，我们创建的云函数不需要手动去建触发器、配网关，这些都由组件帮你一次性拉起来。

打个不太严谨的比方，云函数相当于原生 DOM API，Serverless Framework 相当于 jQuery。前者能用，但每个细节都要你自己写；后者把常见的编排组合封装好了。

**官方地址**

* [serverless官网地址](https://www.serverless.com/)
* [serverless中文官网](https://cn.serverless.com)
* [github地址](https://github.com/serverless/serverless)

如果你对 Serverless 的概念还想再补一补，我之前单独写过一篇入门的，可以配合着看这篇 [Serverless 入门介绍](https://feinterview.poetries.top/blog/serverless-intro)。

### 1.10 创建 Serverless 应用的两种方式

- 在腾讯云 `serverless` 控制面板上创建，然后在 `vscode` 中使用插件的方式下载到本地。**注意**，编辑器上要选择和创建 `serverless` 时相同的地区，才能看到项目，否则是看不到项目代码的
- 使用客户端 `serverless cli` 命令方式创建，我个人更推荐这种，本地修改代码然后部署到腾讯云上，整个流程可以进版本库、可以接 CI

后面第三章开始，我全部走第二条路。原因很简单，控制台里改代码没法 code review，也没法回滚。

## 二、脚手架安装、WebIDE 创建与 VS Code 配置

这一章解决的是「环境怎么搭」。三种入口，命令行、VS Code 插件、WebIDE，各有各的场景，建议都过一遍再挑顺手的。

### 2.1 脚手架安装，三分钟部署一个项目

先全局装 CLI，装完用 `-v` 确认版本，能打出版本号说明装好了。

```bash
npm i serverless -g

serverless -v
```

装好之后先别急着 init，看看官方 registry 里有哪些现成模板，省得自己从零写 `serverless.yml`。

```bash
sls registry

# 或者输入sls
sls
```

执行完你会看到一份可用组件和模板的清单，长这样。

![sls registry 输出的模板列表](https://s.poetries.top/uploads/2022/06/bb939fc00c99aa5a.png)

这张图里的模板名就是下一条命令的参数来源，挑一个抄下来。

```bash
# 例如初始化egg项目

serverless init eggjs-starter(可以替换成sls registry已有的模板) --name egg-example
```

初始化完成后，进到目录直接部署，第一次会让你微信扫码授权。

```bash
sls deploy
```

命令跑完终端会打印出一个 API 网关地址，浏览器打开能看到页面就算通了。这就是所谓的三分钟部署。

### 2.2 在 VS Code 中配置插件来开发 Serverless

如果你已经在控制台上建好了应用，想拉到本地改，那 VS Code 插件是最省事的路子。通过该插件，你可以

- 拉取云端的云函数列表，并触发云函数
- 在本地快速创建云函数项目
- 使用模拟的 COS、CMQ、CKafka、API 网关等触发器事件来触发函数运行
- 上传函数代码到云端，更新函数配置
- 在云端运行、调试函数代码

**先在控制台界面上创建应用**，这一步是为了让插件那边有东西可拉。

![在腾讯云控制台界面创建 Serverless 应用](https://s.poetries.top/uploads/2022/06/18c3d872701f1cfc.png)

创建完记住你选的地域，后面插件里要对上，选错地域列表就是空的。

接着在 `vscode` 上安装插件，搜索腾讯云 Serverless 即可。

![在 VS Code 扩展市场安装腾讯云 Serverless 插件](https://s.poetries.top/uploads/2022/06/0b0cf6ae03f9277b.png)

装好后左侧活动栏会多出一个云图标，点进去是登录入口。

安装后需要登录才能拉取应用。密钥去 API 密钥管理页拿。

> 密钥地址 https://console.cloud.tencent.com/cam/capi ，填入 appID、secretID、secretKey 即可拉取云函数到本地。

![在插件中填入腾讯云密钥登录](https://s.poetries.top/uploads/2022/07/66d614b9bba52dbf.png)

填完点确定，函数列表就出来了。这里有个坑要注意，密钥是账号级别的，别提交到仓库里。

如果列表是空的，先切换地域，函数是按地域隔离的。

![在插件中切换地域查看函数列表](https://s.poetries.top/uploads/2022/07/d5010c1e04560057.png)

切到你创建应用时选的那个地域，函数就会出现。

点击某个云函数，可以查看函数的基本配置信息，内存、超时时间这些都在这里。

![查看云函数的基本配置信息](https://s.poetries.top/uploads/2022/07/9e081856b313fc45.png)

确认一下运行时和超时时间，这两项是后面最常调的。

要在本地改代码，先把函数代码下载下来。点击下载图标，选择要保存的路径。

![下载云函数代码到本地](https://s.poetries.top/uploads/2022/07/a7b44ad3928be60f.png)

下载完本地会多出一个和函数同名的目录，直接用 VS Code 打开改就行。

本地修改完代码后，再把代码上传回云端。

![上传本地函数代码到云端](https://s.poetries.top/uploads/2022/07/9e2f3c3bc5832035.png)
![上传完成后的提示](https://s.poetries.top/uploads/2022/07/f497c782f6070744.png)

上传成功后云端代码立刻生效，不需要额外点部署。

插件还能直接在本地调试云函数，模拟触发器事件跑一遍。

![在 VS Code 中本地调试云函数](https://s.poetries.top/uploads/2022/07/99f7dc28e086be60.png)

调试面板里能看到函数的返回值和 console 输出，排查逻辑问题比看云端日志快得多。

### 2.3 WebIDE 创建云函数实践

WebIDE 是纯浏览器里的开发方式，适合临时改一行代码、或者本地环境不方便的时候用。

**先创建一个云函数**，选运行时和模板。

![在控制台创建云函数](https://s.poetries.top/uploads/2022/06/dd99f3d6323b8e15.png)

创建完你会发现它还没法从外网访问，因为还差一个触发器。

**给云函数创建触发器来访问**，最常用的是 API 网关触发器。

![为云函数创建 API 网关触发器](https://s.poetries.top/uploads/2022/06/894bd8fb7cee9aa8.png)

创建了触发器后，就可以通过触发器里面的访问路径来访问云函数。

![触发器生成的访问路径](https://s.poetries.top/uploads/2022/06/6ea1e2875196d30e.png)
![浏览器访问云函数的返回结果](https://s.poetries.top/uploads/2022/06/535aa49e41c50789.png)

能看到 JSON 返回就说明整条链路通了，函数、网关、触发器三者绑定成功。

> 我们可以在控制台修改代码，然后重新部署云函数，或者开启自动安装依赖等。

![在 WebIDE 中修改代码并重新部署](https://s.poetries.top/uploads/2022/07/e5f68c50a4296d47.png)

「开启自动安装依赖」这个开关后面会反复用到，因为我们部署时通常会排除 `node_modules`，靠云端自己装。

## 三、用 Serverless Framework 部署后端项目实战

这一章是全文最长的一段，也是最有用的一段。Egg、Nest.js、Koa 三个框架，每个都给出控制台部署、自定义部署、HTTP 组件部署三条路径，最后再讲怎么用 Layer 把包体积压下来。

### 3.1 Serverless Framework 简介及应用场景

- Serverless Framework 是 Serverless 公司推出的一个开源的 Serverless 应用开发框架
- 它由 Serverless Framework Plugin 和 Serverless Framework Components 两部分组成
- Serverless Framework Plugin 实际上是一个函数的管理工具，用它可以很轻松地部署函数、删除函数、触发函数、查看函数信息、查看函数日志、回滚函数、查看函数数据等

> Serverless Framework Components 可以看作是一个组件集，这里面包括了很多 Components。有基础的，例如 cos、scf、apigateway 等；也有一些拓展的，例如在 cos 上拓展出来的 website，可以直接部署静态网站；还有一些框架级的，例如 Koa、Express 等。

组件这个概念很关键。你后面写的每一份 `serverless.yml`，第一行 `component:` 填的就是这里说的组件名，它决定了这份配置的字段结构长什么样。填 `http` 和填 `egg`，下面能写的字段是完全不同的两套。

- Serverless Framework 官网：https://www.serverless.com/
- Serverless Framework 中文网站：https://www.serverless.com/cn
- Github 地址：https://github.com/serverless/serverless

#### Serverless Framework 应用场景

前面既然分清了云函数和 Serverless 的区别，那什么场景下该用 Serverless Framework，而不是裸写云函数？

我的经验是，除了写一个几十行的小工具函数，其余情况都直接上 Serverless Framework。云函数的使用场景受限，或者说比较基础，触发器、网关、层这些都得手动串。还是那个比喻，写 `js` 操作 `dom` 的时候，你会选原生 `js` 还是选个库？

**基于云函数的命令行开发工具**

> 通过 `Serverless Framework`，开发者可以在命令行完成函数的开发、部署、调试。还可以结合前端服务、API 网关、数据库等其它云上资源，实现全栈应用的快速部署。

**传统应用框架的快速迁移**

> `Serverless Framework` 提供了一套通用的框架迁移方案，通过使用它提供的框架组件（`Egg/Koa/Express` 等，[更多的框架支持可以参考](https://github.com/serverless)），原有应用仅需几行代码简单改造，即可快速迁移到函数平台。同时支持命令行与控制台的开发方式。

第二条是我最看重的。存量项目要上云，改动量基本就是「换个监听端口 + 加一个启动文件」，业务代码一行不用动。

#### Serverless Framework 支持的平台

它不是腾讯云专属的，AWS、Azure、Google Cloud 都在支持列表里。

> https://github.com/serverless/serverless/tree/master/docs/providers

![Serverless Framework 支持的云平台列表](https://s.poetries.top/uploads/2022/07/228c4a131acdb03c.png)

也就是说 `serverless.yml` 这套心智模型换个云厂商还能继续用，只是组件名和字段会变。

### 3.2 Serverless Components 支持的组件列表

这份清单建议收藏，写 `serverless.yml` 时第一步就是从这里挑组件。组件分基础和高阶两类，基础组件对应一个具体云资源，高阶组件对应一整套编排。

#### 基础组件

- [@serverless/tencent-postgresql](https://github.com/serverless-components/tencent-postgresql/tree/master) - 腾讯云 PG DB Serverless 数据库组件
- [@serverless/tencent-apigateway](https://github.com/serverless-components/tencent-apigateway) - 腾讯云 API 网关组件
- [@serverless/tencent-cos](https://github.com/serverless-components/tencent-cos) - 腾讯云对象存储组件
- [@serverless/tencent-scf](https://github.com/serverless-components/tencent-scf/tree/master) - 腾讯云云函数组件
- [@serverless/tencent-cdn](https://github.com/serverless-components/tencent-cdn) - 腾讯云 CDN 组件
- [@serverless/tencent-vpc](https://github.com/serverless-components/tencent-vpc/tree/master) - 腾讯云 VPC 私有网络组件

这几个组件平时很少单独用，更多是被高阶组件在底层调用。真正需要单独部署它们的场景，是你想复用一个已有的网关服务，或者单独管理一个 VPC。

#### 高阶组件

高阶组件是按框架划分的，一个组件对应一种技术栈的完整部署方案。

- [@serverless/tencent-nextjs](https://github.com/serverless-components/tencent-nextjs/tree/master) - 快速部署基于 Next.js 框架到腾讯云函数的组件
- [@serverless/tencent-nuxtjs](https://github.com/serverless-components/tencent-nuxtjs/tree/master) - 快速部署基于 Nuxt.js 框架到腾讯云函数的组件
- [@serverless/tencent-express](https://github.com/serverless-components/tencent-express/tree/master) - 快速部署基于 Express.js 的后端服务到腾讯云函数的组件
- [@serverless/tencent-egg](https://github.com/serverless-components/tencent-egg/tree/master) - 快速部署基于 Egg.js 的后端服务到腾讯云函数的组件
- [@serverless/tencent-koa](https://github.com/serverless-components/tencent-koa/tree/master) - 快速部署基于 Koa.js 的后端服务到腾讯云函数的组件
- [@serverless/tencent-flask](https://github.com/serverless-components/tencent-flask) - 腾讯云 Python Flask RESTful API 组件
- [@serverless/tencent-django](https://github.com/serverless-tencent/tencent-django/tree/master) - 腾讯云 Python Django RESTful API 组件
- [@serverless/tencent-laravel](https://github.com/serverless-components/tencent-laravel) - 腾讯云 PHP Laravel RESTful API 组件
- [@serverless/tencent-thinkphp](https://github.com/serverless-components/tencent-thinkphp) - 腾讯云 ThinkPHP RESTful API 组件
- [@serverless/tencent-website](https://github.com/serverless-components/tencent-website/tree/master) - 快速部署静态网站到腾讯云的组件

这里要提醒一句，上面这份组件清单是 2022 年的状态。这几年官方对组件做过收敛，有些框架级组件不再主推，统一往 `http` 组件（Web 函数）上迁。所以下面每种框架我都会把 HTTP 组件的写法标成推荐，高阶框架组件的写法保留但标注不推荐。

### 3.3 用 sls 部署 Egg 项目

Egg 是这几个框架里改造成本最高的一个，因为它默认会往用户目录写日志，而 Serverless 环境里那个目录是只读的。先把这件事解决掉。

> Egg 框架中默认已经配置好了静态资源，我们可以直接访问。要注意的是，Serverless 的运行环境里只有根目录下的 `/tmp` 目录有写入权限，所以需要配置 Egg 日志存储的目录。默认创建好项目以后有如下配置。

```js
// config/config.default.js

module.exports = (appInfo) => {
  //
  return {
    ...,
    rundir: '/tmp',
    logger: {
      dir: '/tmp'
    },
  }
}

```

`rundir` 和 `logger.dir` 这两项必须指到 `/tmp`，否则函数启动阶段就会因为写日志失败而挂掉，日志里只会给你一个很难懂的 EACCES。这是 Egg 上云的第一个坑。

#### 控制台创建部署，模板部署

最快的验证方式是先用官方模板跑一遍，确认账号权限没问题，再回头折腾自己的项目。

1. 登录控制台 https://console.cloud.tencent.com/sls
2. 单击新建应用，选择 Web 应用 > Egg 框架，如下图所示

![在控制台新建应用并选择 Egg 框架](https://s.poetries.top/uploads/2022/06/fbf0b03c839cd73e.png)

选完框架不要急着下一步，先确认右上角的地域，后面数据库、层都要和它保持一致。

3. 单击「下一步」，完成基础配置选择。

![Egg 应用的基础配置页](https://s.poetries.top/uploads/2022/06/58b123659a00b194.png)

这一页主要填应用名、环境和运行时版本，保持默认也能跑通。

4. 上传方式，选择示例代码直接部署，单击完成，即可开始应用的部署。
5. 部署完成后，可在应用详情页面查看示例应用的基本信息，并通过 API 网关生成的访问路径 URL 进行访问，查看你部署的 Egg 项目。

![部署完成后的应用详情页与访问地址](https://s.poetries.top/uploads/2022/06/c4c3e330b1a6af68.png)

页面里那个 `service-xxx.gz.apigw.tencentcs.com` 开头的地址就是你的线上入口，能打开就说明账号权限和网关都是通的。

#### 控制台创建部署，自定义部署（推荐）

模板部署只能跑官方示例，真实项目要用自定义部署。

> 如果除了代码部署外，你还需要更多能力或资源创建，如自动创建层托管依赖、一键实现静态资源分离、支持代码仓库直接拉取等，可以通过应用控制台完成 Web 应用的创建工作。

**初始化项目**

```
mkdir egg-example && cd egg-example
npm init egg --type=simple
npm i
```

**部署上云**

> 接下来执行以下步骤，对本地已创建完成的项目进行简单修改，使其可以通过 Web Function 快速部署。对于 Egg 框架，具体改造说明如下。

- 修改监听地址与端口为 `0.0.0.0:9000`
- 修改写入路径，Serverless 环境下只有 `/tmp` 目录可读写
- 新增 `scf_bootstrap` 启动文件

这三条是 Web 函数的硬性约定。端口必须是 9000，监听地址必须是 `0.0.0.0` 而不是 `127.0.0.1`，因为容器外部要能连进来。这两个值写错，部署会成功，但访问一定 502。

**1. （可选）配置 scf_bootstrap 启动文件**

这一步也可以在控制台完成，界面上有个专门的启动文件编辑框。

![控制台里的 scf_bootstrap 启动文件配置入口](https://s.poetries.top/uploads/2022/06/85b3d73ea922f0ea.png)

我更建议把它作为项目文件提交进仓库，因为控制台改的东西没有版本记录。

> 在项目根目录下新建 `scf_bootstrap` 启动文件，在该文件添加如下内容（用于配置环境变量和启动服务，此处仅为示例，具体操作请以你实际业务场景来调整）。

```js
#!/var/lang/node12/bin/node

'use strict';

/**
 * docker 中 node 路径：/var/lang/node12/bin/node
 * 由于 serverless 函数只有 /tmp 读写权限，所以在启动时需要修改两个环境变量
 * NODE_LOG_DIR 是为了改写 egg-scripts 默认 node 写入路径（~/logs）-> /tmp
 * EGG_APP_CONFIG 是为了修改 egg 应有的默认当前目录 -> /tmp
 */

process.env.EGG_SERVER_ENV = 'prod';
process.env.NODE_ENV = 'production';
process.env.NODE_LOG_DIR = '/tmp';
process.env.EGG_APP_CONFIG = '{"rundir":"/tmp","logger":{"dir":"/tmp"}}';

const { Application } = require('egg');

// 如果通过层部署 node_modules 就需要修改 eggPath
Object.defineProperty(Application.prototype, Symbol.for('egg#eggPath'), {
  value: '/opt',
});

const app = new Application({
  mode: 'single',
  env: 'prod',
});

app.listen(9000, '0.0.0.0', () => {
  console.log('Server start on http://0.0.0.0:9000');
});
```

这段脚本里最容易被忽略的是 `EGG_APP_CONFIG` 那一行。它用一段 JSON 在运行期覆盖 Egg 的默认目录配置，作用和前面 `config.default.js` 里改 `rundir` 是一样的，属于双保险。`Object.defineProperty` 改 `eggPath` 那一段只有在用 Layer 部署 `node_modules` 时才需要，普通部署可以先注释掉。

> 新建完成后，还需执行以下命令修改文件可执行权限，默认需要 777 或 755 权限才可正常启动。示例如下。

```
chmod 777 scf_bootstrap
```

这一步千万别跳。我第一次部署 Egg 就是忘了 `chmod`，云端日志只提示进程退出，看不出任何权限相关的字眼，白白排查了半小时。

**2. 控制台上传**

> 你可以在控制台完成启动文件 scf_bootstrap 内容配置，配置完成后，控制台将自动生成启动文件，和项目代码一起打包部署。

启动文件以项目内文件为准，如果你的项目里已经包含 `scf_bootstrap` 文件，将不会覆盖该内容。

下面这几张是上传过程的连续截图，从选择上传方式一直到部署完成。

![选择本地上传项目代码](https://s.poetries.top/uploads/2022/06/a96ce1c3799f5951.png)
![填写启动文件与环境配置](https://s.poetries.top/uploads/2022/06/ce48d9dd73af824f.png)
![确认部署配置](https://s.poetries.top/uploads/2022/06/9a0e3dfa25a6ed3d.png)

![部署进行中的状态](https://s.poetries.top/uploads/2022/06/e9dd1225bf0d37cd.png)

部署过程一般在一分钟内结束，状态变绿就可以去点访问链接了。

部署完成后可以进函数页面，改代码、看日志都在这里。

![在函数详情页查看代码与日志](https://s.poetries.top/uploads/2022/06/ca238c35541dd8df.png)

日志页是排查 502 的第一现场，进程启动失败的原因基本都会打在这里。

**高级配置管理**

> 你可在「高级配置」里进行更多应用管理操作，如创建层、绑定自定义域名、配置环境变量等。

![应用的高级配置面板](https://s.poetries.top/uploads/2022/06/4ab13bbb74bcdf89.png)

层和自定义域名这两块后面会单独展开讲，先记住入口在这。

#### HTTP 组件方式部署（推荐）

前面那些都是控制台操作，真正值得你花时间掌握的是这一节。所有能进版本库、能接 CI 的部署方式，都从这份 `serverless.yml` 开始。

> 目前推荐使用 Web 函数，也就是 `HTTP 组件`，现在所有的 Serverless Web 应用都是基于 `component: http` 组件的。

> 通过 `Serverless Framework` 的 `HTTP 组件`，完成 Web 应用的本地部署。

**前提条件**

> 已开通服务并完成 [Serverless Framework 的 权限配置](https://cloud.tencent.com/document/product/1154/43006)

先用脚手架拉一个 Egg 项目出来，模板名从前面 `sls registry` 的清单里挑。

```bash
# 初始化egg项目

serverless init eggjs-starter(可以替换成sls registry已有的模板) --name egg-example
```

初始化完目录里会自带一份 `serverless.yml`，我们把它替换成下面这份完整配置。每个字段我都加了注释，重点看 `src.exclude`、`faas.framework` 和 `apigw` 三块。

```yml
# 编写完善配置文件 serverless.yml
# https://github.com/serverless-components/tencent-http/blob/master/docs/configure.md
app: egg-example-fa63d20e9 # 应用名称
component: http # http组件
name: egg-demo # 实例名称
inputs:
  region: ap-guangzhou # 云函数所在区域
  src: # 部署当前目录下的文件代码，并打包成zip上传到bucket上
    src: ./ # 当前目录
    exclude: # 被排除的文件或目录
      - .env
      - 'node_modules/**' # 忽略node_modules，在控制台WEBIDE开启安装依赖
  # src: # 在指定存储桶bucket中已经存在了object代码，直接部署
  #   bucket: bucket01 # bucket name，当前会默认在bucket name后增加 appid 后缀, 本例中为 bucket01-appid
  #   object: cos.zip  # bucket key 指定存储桶内的文件
  faas: # 函数配置相关
    runtime: Nodejs12.16 # 运行时
    # 支持的框架查看 https://cloud.tencent.com/document/product/1154/59447#framework
    framework: egg # #选择框架，此处以 egg 为例
    name: ${name} # 云函数名称，通过变量形式获取name的值
    timeout: 60 # 超时时间，单位秒
    memorySize: 512 # 内存大小，默认 512 MB
    # layers:
    #   - name: layerName #  layer名称
    #     version: 1 #  版本
    environments: #  配置环境变量，同时也可以直接在 scf 控制台配置
        - key: NODE_ENV
          value: production
    # vpc: # 私有网络配置
    #   vpcId: 'vpc-xxx' # 私有网络的Id
    #   subnetId: 'subnet-xxx' # 子网ID
    # tags:
    #   - key: tagKey
    #     value: tagValue
  apigw: # http 组件会默认帮忙创建一个 API 网关服务
    isDisabled: false # 是否禁用自动创建 API 网关功能
    # id: service-xx # api网关服务ID，不填则自动新建网关
    name: serverless # api网关服务名称
    api: # 创建的 API 相关配置
      cors: true #  允许跨域
      timeout: 30 # API 超时时间
      name: apiName # API 名称
      qualifier: $DEFAULT # API 关联的版本
    protocols:
      - http
      - https
    environment: test
    # tags:
    #   - key: tagKey
    #     value: tagValue
    # customDomains: # 自定义域名绑定
    #   - domain: abc.com # 待绑定的自定义的域名
    #     certId: abcdefg # 待绑定自定义域名的证书唯一 ID
    #     # 如要设置自定义路径映射，(customMap = true isDefaultMapping = false)必须两者同时出现 其余情况都是默认路径
    #     customMap: true
    #     isDefaultMapping: false
    #     # 自定义路径映射的路径。使用自定义映射时，可一次仅映射一个 path 到一个环境，也可映射多个 path 到多个环境。并且一旦使用自定义映射，原本的默认映射规则不再生效，只有自定义映射路径生效。
    #     pathMap:
    #       - path: /
    #         environment: release
    #     protocols: # 绑定自定义域名的协议类型，默认与服务的前端协议一致。
    #       - http # 支持http协议
    #       - https # 支持https协议
    # app: #  应用授权配置
    #   id: app-xxx
    #   name: app_demo
    #   description: app description
```

这份配置里有几个点值得单独说。

`src.exclude` 里排除 `node_modules/**` 是为了让上传包小一点，代价是云端得自己装依赖，所以要去 WebIDE 打开「自动安装依赖」开关，这个后面会演示。`faas.framework: egg` 是关键，组件靠它决定生成什么样的默认启动文件。`apigw.isDisabled: false` 表示让组件顺手帮你建一个 API 网关服务，如果你已经有网关了，就填 `id` 复用。

`memorySize` 默认 512 MB，`timeout` 默认 60 秒。这两个值直接影响计费，内存开大了单价按 GBs 线性涨，别无脑拉到 3072。

> 全部配置详细查看  https://github.com/serverless-components/tencent-http/blob/master/docs/configure.md

**部署**

> 创建完成后，在根目录下执行 `sls deploy` 进行部署，组件会根据选择的框架类型，自动生成 `scf_bootstrap` 启动文件进行部署。

![sls deploy 的部署输出](https://s.poetries.top/uploads/2022/06/8e11d14d715ba443.png)

终端最后会打印出 `region`、`apigw.url` 这些信息，那个 url 就是访问入口。

我们也可以在项目根目录自己创建启动文件 `scf_bootstrap`，然后 `chmod 777 scf_bootstrap`。自己写的好处是启动逻辑完全可控，组件自动生成的那份未必符合你的项目结构。

```js
// scf_bootstrap
#!/var/lang/node12/bin/node

/**
 * docker 中 node 路径：/var/lang/node12/bin/node
 * 由于 serverless 函数只有 /tmp 读写权限，所以在启动时需要修改两个环境变量
 * NODE_LOG_DIR 是为了改写 egg-scripts 默认 node 写入路径（~/logs）-> /tmp
 * EGG_APP_CONFIG 是为了修改 egg 应有的默认当前目录 -> /tmp
 */

process.env.EGG_SERVER_ENV = 'prod';
process.env.NODE_ENV = 'production';
process.env.NODE_LOG_DIR = '/tmp';
process.env.EGG_APP_CONFIG = '{"rundir":"/tmp","logger":{"dir":"/tmp"}}';

const { Application } = require('egg');

// 如果通过层部署 node_modules 就需要修改 eggPath
Object.defineProperty(Application.prototype, Symbol.for('egg#eggPath'), {
  value: '/opt',
});

const app = new Application({
  mode: 'single',
  env: 'prod',
});

app.listen(9000, '0.0.0.0', () => {
  console.log('Server start on http://0.0.0.0:9000');
});
```

```bash
# 微信扫码即可
# 微信扫码授权部署有过期时间，如果想要持久授权，请参考账号配置(https://cloud.tencent.com/document/product/1154/45874#account)
# 当前默认支持 CLI 扫描二维码登录，如您希望配置持久的环境变量/密钥信息，也可以本地创建 .env 文件：
# 在 .env 文件中配置腾讯云的 SecretId 和 SecretKey 信息并保存。
# API密钥管理 https://console.cloud.tencent.com/cam/capi
# .env
#TENCENT_SECRET_ID=123
#TENCENT_SECRET_KEY=123

sls deploy
```

上面那段 `.env` 的注释是给持久化授权用的。扫码登录有有效期，过期了 CI 里就跑不动，所以真要接流水线，还是老老实实配 `TENCENT_SECRET_ID` 和 `TENCENT_SECRET_KEY`，并且用 CI 的加密变量注入，别提交到仓库。

> 注意：由于启动文件逻辑与用户业务逻辑强关联，默认生成的启动文件可能导致框架无法正常启动，建议你根据实际业务需求手动配置启动文件，[详情参考各框架的部署指引文档](https://cloud.tencent.com/document/product/1154/59447)。

![部署成功后的终端输出](https://s.poetries.top/uploads/2022/06/9d3580eef444d80f.png)

正常情况你会看到一串资源创建成功的日志，最后给出访问地址。

但也有不正常的时候。如果部署过程遇到问题不好排查，比如下面这种报错。

![部署失败时的报错信息](https://s.poetries.top/uploads/2022/06/6d5fd5ba537850dd.png)

这类报错的信息量很少，光看终端很难定位。我的做法是绕一下，先到控制台把应用建出来，让控制台帮你把网关、角色、权限这些前置资源都创建好，再回头用 CLI 部署，成功率会高很多。

下面几张是在控制台创建项目的完整过程。

![控制台新建应用入口](https://s.poetries.top/uploads/2022/06/1ac3905f67789812.png)
![选择应用类型与框架](https://s.poetries.top/uploads/2022/06/715ea0e1c4d12298.png)
![填写应用基础信息](https://s.poetries.top/uploads/2022/06/a3921110151f0ba3.png)
![上传代码包](https://s.poetries.top/uploads/2022/06/f91266106e6e1d78.png)
![应用创建完成](https://s.poetries.top/uploads/2022/06/2117adef0814c390.png)

走完这一遍，云端该有的资源都齐了，后续 `sls deploy` 就只是更新代码。

**在控制台安装依赖包**

> 我们在 `sls deploy` 时忽略了 `node_modules`，因此需要在控制台安装依赖。

![在 WebIDE 中开启自动安装依赖](https://s.poetries.top/uploads/2022/06/d47f6e73f93d5055.png)

开关打开后重新部署，云端会在函数目录里执行一次安装。这里有个坑要注意，云端装依赖用的是它自己的 registry 和 Node 版本，本地能装上不代表云端能装上，带原生编译的包（比如老版本 `node-sass`）大概率会失败，这种情况只能改用 Layer 把本地装好的 `node_modules` 传上去。

依赖装好之后访问应用。

![浏览器访问部署好的 Egg 应用](https://s.poetries.top/uploads/2022/06/9ad37b26fbab516d.png)

能看到 Egg 的默认页面就成功了。

再回控制台看看这次部署产生了哪些资源。

![应用详情中的资源列表](https://s.poetries.top/uploads/2022/06/14c5cc6d18060612.png)
![对应的云函数信息](https://s.poetries.top/uploads/2022/06/369867cf3dc9a1e1.png)
![对应的 API 网关服务](https://s.poetries.top/uploads/2022/06/3cdd7bf1c596d876.png)

一次 `sls deploy` 背后其实创建了云函数、API 网关服务、网关 API 三样东西，这也是为什么删除要用 `sls remove` 而不是去控制台一个个删。

删除应用。

```
sls remove
```

![sls remove 的执行结果](https://s.poetries.top/uploads/2022/06/9db881d3d57a0c59.png)

`sls remove` 会把这次部署创建的所有云资源一起回收，包括网关。手动删函数会留下孤儿网关，日积月累很难清。

#### 用 Layer 来减小项目文件大小

回到我们要解决的问题，`node_modules` 太大导致部署慢。Layer 就是干这个的。

随着项目复杂度的增加，`deploy` 上传会变慢。所以我们再优化一下，在项目根目录创建 `layer/serverless.yml`。


```yml
# layer/serverless.yml
# https://cloud.tencent.com/document/product/1154/51133
# https://github.com/serverless-components/tencent-layer/blob/master/docs/configure.md

#应用组织信息（可选）
app: egg-demo
stage: dev

#组件信息
component: layer
name: egg-demo-layer # 层名称 必须

# 组件参数配置，根据每个组件，实现具体的资源信息配置
inputs:
 name: ${name} # 名称跟上面一致即可
 region: ap-guangzhou # 地区 必须
 src: ../node_modules #需要上传的目标文件路径 必须
  # src: # 代码路径。与 object 不能同时存在。
  #   src: ./node_modules
  #   targetDir: /node_modules
  #   exclude:   # 被排除的文件或目录 不包含的文件或路径, 遵守 glob 语法
  #     - .env
  #     - node_modules
  # src:
  # bucket 名称。如果配置了 src，表示部署 src 的代码并压缩成 zip 后上传到 bucket-appid 对应的存储桶中；如果配置了 object，表示获取 bucket-appid 对应存储桶中 object 对应的代码进行部署。
  #   bucket: layers
  #   object: sls-layer-test-1584524206.zip # 部署的代码在存储桶中的路径。
  #   exclude:   # 被排除的文件或目录
  #     - .env
  #     - node_modules
 runtimes: # 层支持的运行环境
   - Nodejs12.16
 description: layer description # 否 描述
```

这份配置的核心就一行，`src: ../node_modules`，把上一级目录的依赖包单独打成一个层。`runtimes` 要和函数的运行时对上，否则层挂上去也不生效。

写完执行 `sls deploy --target=./layer`，创建后可见层的对应信息。

![创建成功的层信息](https://s.poetries.top/uploads/2022/06/7e5abeb49a56f460.png)

注意这里的 `version` 字段，层每次部署都会产生一个新版本号，函数绑定的是具体版本而不是「最新」。

我们也可以在控制台新建层，然后绑定到对应的函数。

![在控制台新建层](https://s.poetries.top/uploads/2022/06/d10f5ea7b0cac331.png)

手动建层适合一次性的场景，长期维护还是走 yml 更稳。

控制台上传层是有大小限制的，这一点比较容易撞墙。

![控制台上传层的大小限制提示](https://s.poetries.top/uploads/2022/06/683f6152002db3a9.png)

单个 zip 包的限制比较小，超了就得换成从 COS 存储桶部署。

文件夹形式支持到 250M。

![层支持的文件夹上传上限](https://s.poetries.top/uploads/2022/06/6495e575646c3035.png)

![层上传完成后的列表](https://s.poetries.top/uploads/2022/06/740312afd66bc342.png)

一个中等规模的 Node 项目，`node_modules` 装完两三百兆很常见，所以真要上层，先跑一遍 `npm install --production` 把 devDependencies 剔掉。

**修改以上项目下的 serverless.yml 加入层配置**

层建好了还差最后一步，把它挂到函数上。回到项目根目录，调整一下根目录的 `serverless.yml`。

```yml
# 编写完善配置文件 serverless.yml
# https://github.com/serverless-components/tencent-http/blob/master/docs/configure.md
app: egg-example-fa63d20e9 # 应用名称
component: http # http组件
name: egg-demo # 实例名称
inputs:
  region: ap-guangzhou # 云函数所在区域
  src: # 部署当前目录下的文件代码，并打包成zip上传到bucket上
    src: ./ # 当前目录
    exclude: # 被排除的文件或目录
      - .env
      - "node_modules/**" # deploy 时排除 node_modules [需要注意] 使用layer的node_modules
  faas: # 函数配置相关
    runtime: Nodejs12.16 # 运行时
    # 支持的框架查看 https://cloud.tencent.com/document/product/1154/59447#framework
    framework: egg # #选择框架，此处以 egg 为例
    name: ${name} # 云函数名称，通过变量形式获取name的值
    timeout: 60 # 超时时间，单位秒
    memorySize: 512 # 内存大小，默认 512 MB
    # 加入层配置 引用格式请参考 变量引用说明 https://github.com/AprilJC/Serverless-Framework-Docs/blob/main/docs/%E5%87%BD%E6%95%B0%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91/%E6%9E%84%E5%BB%BA%E5%BA%94%E7%94%A8.md#%E5%8F%98%E9%87%8F%E5%BC%95%E7%94%A8%E8%AF%B4%E6%98%8E
    layers:
      - name: ${output:${stage}:${app}:${name}-layer.name} # 配置对应的 layer
        version: ${output:${stage}:${app}:${name}-layer.version} # 配置对应的 layer 版本
    environments: #  配置环境变量，同时也可以直接在 scf 控制台配置
        - key: NODE_ENV
          value: production
    tags: # 标签
      - key: tagKey
        value: tagValue
  apigw: # http 组件会默认帮忙创建一个 API 网关服务
    isDisabled: false # 是否禁用自动创建 API 网关功能
    # id: service-xxx # api网关服务ID，不填则自动新建网关
    name: serverless # api网关服务名称
    api: # 创建的 API 相关配置
      cors: true #  允许跨域
      timeout: 30 # API 超时时间
      name: apiName # API 名称
      qualifier: $DEFAULT # API 关联的版本
    protocols:
      - http
      - https
    environment: test
```

排除`node_modules`

```yml
exclude: # 被排除的文件或目录
    - .env
    - node_modules/** # deploy 时排除 node_modules [需要注意] 使用layer的node_modules
```

配置层

> 引用格式请参考 变量引用说明 https://github.com/AprilJC/Serverless-Framework-Docs/blob/main/docs/%E5%87%BD%E6%95%B0%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91/%E6%9E%84%E5%BB%BA%E5%BA%94%E7%94%A8.md#%E5%8F%98%E9%87%8F%E5%BC%95%E7%94%A8%E8%AF%B4%E6%98%8E

```yml
layers:
    - name: ${output:${stage}:${app}:${name}-layer.name} # 配置对应的 layer
    version: ${output:${stage}:${app}:${name}-layer.version} # 配置对应的 layer 版本
```

这里的 `${output:${stage}:${app}:${name}-layer.name}` 是 Serverless Framework 的跨实例变量引用语法，意思是「去同一个 app、同一个 stage 下，那个叫 `xxx-layer` 的实例的输出里，取 name 字段」。所以层和函数必须写同一个 `app` 和 `stage`，写错了变量解析不出来，部署时会报找不到实例。

通过配置层 layer，代码和 `node_modules` 分离，`sls deploy` 会明显更快。

> 接着执行命令 `sls deploy --target=./layer` 部署层，然后再次部署 `sls deploy`，速度应该更快了。

![部署层的执行过程](https://s.poetries.top/uploads/2022/06/f5d5c8b90fdf942c.png)
![层部署完成的输出](https://s.poetries.top/uploads/2022/06/6683161cf18fc51c.png)
![挂载层之后重新部署函数](https://s.poetries.top/uploads/2022/06/88d1098b222f184b.png)
![函数详情中已绑定的层](https://s.poetries.top/uploads/2022/06/b5b0c69b6962434d.png)

对照最后一张图确认函数的「层管理」里确实有你那个层，没有的话说明变量引用没生效。

每次 `node_modules` 改变都需要走两步

- 执行 `sls deploy --target=./layer` 部署层，更新 `node_modules` 层
- 执行 `sls deploy` 重新部署函数

顺序不能反。层版本变了但函数没重新部署，函数还绑在旧版本上，你会发现新装的包死活找不到。

**layer 的加载与访问**

> layer 会在函数运行时将内容解压到 `/opt` 目录下。如果存在多个 `layer`，那么会按时间顺序进行解压。如果需要访问 `layer` 内的文件，可以直接通过 `/opt/xxx` 访问。如果是访问 `node_modules`，则可以直接 `require`，因为 `scf` 的 `NODE_PATH` 环境变量默认已包含 `/opt/node_modules` 路径。

这也解释了前面 `scf_bootstrap` 里那句 `eggPath` 指到 `/opt` 的写法，Egg 要从层里找到自己的框架目录。

#### 使用 Serverless Framework 的高阶 Egg 组件部署（不推荐）

这一节留作参考。它是早期的部署方式，现在官方已经不主推了，放在这里是因为存量项目里还能见到这种写法，你接手老项目时得看得懂。

> 目前推荐使用 Web 函数，也就是 `HTTP 组件`，现在所有的 Serverless Web 应用都是基于 `component: http` 组件的。

1. 在项目根目录下创建 `serverless.yml` 文件

```
npm i serverless -g
```

```yml
# https://github.com/serverless-components/tencent-egg/blob/master/docs/configure.md

# serverless.yml

component: egg # (必选) 组件名称，在该实例中为egg
name: egg-demo # 必选) 组件实例名称.
# org: orgDemo # (可选) 用于记录组织信息，默认值为您的腾讯云账户 appid，必须为字符串
app: egg-demo # (可选) 用于记录组织信息. 默认与name相同，必须为字符串
stage: dev # (可选) 用于区分环境信息，默认值是 dev

inputs:
  region: ap-guangzhou # 云函数所在区域
  functionName: egg-demo # 云函数名称
  # serviceName: egg-demo # api网关服务名称
  runtime: Nodejs12.16 # 运行环境
  # serviceId: service-np1uloxw # api网关服务ID
  # entryFile: sls.js # 自定义 server 的入口文件名，默认为 sls.js，如果不想修改文件名为 sls.js 可以自定义
  # src: ./ # 第一种为string时，会打包src对应目录下的代码上传到默认cos上。
  src:  # 第二种，部署src下的文件代码，并打包成zip上传到bucket上
    src: ./  # 本地需要打包的文件目录
    # bucket: bucket01 # bucket name，当前会默认在bucket name后增加 appid 后缀, 本例中为 bucket01-appid
    exclude:   # 被排除的文件或目录
      - .env
      - "node_modules/**"
  # src: # 第三种，在指定存储桶bucket中已经存在了object代码，直接部署
  #   bucket: bucket01 # bucket name，当前会默认在bucket name后增加 appid 后缀, 本例中为 bucket01-appid
  #   object: cos.zip  # bucket key 指定存储桶内的文件
  # layers:
  #   - name: ${output:${stage}:${app}:egg-demo-layer.name} # 配置对应的 layer
  #     version: ${output:${stage}:${app}:egg-demo-layer.version} # 配置对应的 layer 版本
  functionConf: # 函数配置相关
    timeout: 60 # 超时时间，单位秒
    eip: false # 是否固定出口IP
    memorySize: 512 # 内存大小，单位MB
    environment: #  环境变量
      variables: #  环境变量数组
        NODE_ENV: production
    # vpcConfig: # 私有网络配置
      # vpcId: '' # 私有网络的Id
      # subnetId: '' # 子网ID
  apigatewayConf: #  api网关配置
    isDisabled: false # 是否禁用自动创建 API 网关功能
    enableCORS: true #  允许跨域
    # customDomains: # 自定义域名绑定
    #   - domain: abc.com # 待绑定的自定义的域名
    #     certificateId: abcdefg # 待绑定自定义域名的证书唯一 ID
    #     # 如要设置自定义路径映射，请设置为 false
    #     isDefaultMapping: false
    #     # 自定义路径映射的路径。使用自定义映射时，可一次仅映射一个 path 到一个环境，也可映射多个 path 到多个环境。并且一旦使用自定义映射，原本的默认映射规则不再生效，只有自定义映射路径生效。
    #     pathMappingSet:
    #       - path: /
    #         environment: release
    #     protocols: # 绑定自定义域名的协议类型，默认与服务的前端协议一致。
    #       - http # 支持http协议
    #       - https # 支持https协议
    protocols:
      - http
      - https
    environment: release # 网关环境
    serviceTimeout: 60 # 网关超时
    # usagePlan: #  用户使用计划
    #   usagePlanId: 1111
    #   usagePlanName: slscmp
    #   usagePlanDesc: sls create
    #   maxRequestNum: 1000
    # auth: #  密钥
    #   secretName: secret
    #   secretIds:
    #     - xxx
```

和 HTTP 组件那份配置对比着看，你会发现字段名整个换了一套。`functionConf` 对应 `faas`，`apigatewayConf` 对应 `apigw`，`enableCORS` 对应 `api.cors`。语义一样，命名不一样，所以两种写法不能混着抄，这也是我不推荐新项目用它的原因。

2. 将代码推送到云端

```
sls deploy # sls deploy --debug可以查看日志
```

部署卡住或者报错时，`--debug` 几乎是唯一有用的排查手段，它会把每一步调了哪个云 API 都打出来。

3. 扫描登录后，会在项目下创建一个 `.env` 文件保存 `serverless` 的登录信息

![部署时生成的 .env 登录信息文件](https://s.poetries.top/uploads/2022/06/4bb68977c923970f.png)

这个文件记得加进 `.gitignore`，里面是账号凭证。

4. 部署成功，打开地址访问，此时会报错，因为我们没有把 `node_modules` 一起上传

![部署成功的输出信息](https://s.poetries.top/uploads/2022/06/b6d50b9d2070559c.png)
![函数在控制台的状态](https://s.poetries.top/uploads/2022/06/fecba16d7e2071eb.png)

浏览器打开会提示缺少模块。

![浏览器提示 Cannot find module](https://s.poetries.top/uploads/2022/06/08a0618ffe147378.png)

这个 `Cannot find module` 是最常见的首次部署报错，原因就一个，云端没有依赖。

解决办法是在控制台打开自动安装依赖。

![进入函数的部署配置页](https://s.poetries.top/uploads/2022/06/e6454fd010815c3f.png)
![勾选自动安装依赖](https://s.poetries.top/uploads/2022/06/50bcc5c01f3af862.png)

打开自动安装依赖后重新部署，就能在云端目录里看到 `node_modules` 了。这时再次访问浏览器地址。

![云端目录中已生成 node_modules](https://s.poetries.top/uploads/2022/06/fd6229e7d654a470.png)
![页面正常返回](https://s.poetries.top/uploads/2022/06/53fa2c373a8a69cd.png)

页面正常了。这条排查路径记下来，后面 Nest 和 Koa 遇到同样的报错，处理方式一模一样。

### 3.4 用 sls 部署 Nest.js 项目

Nest.js 比 Egg 简单，因为它默认不往磁盘写东西，改造量只有「改端口 + 写启动文件」两件事。

#### 模板部署，部署 Nest.js 示例代码

和 Egg 一样，先用官方模板跑通一遍，确认账号和地域没问题。

1. 登录 [Serverless 应用控制台](https://console.cloud.tencent.com/sls)。
2. 单击新建应用，选择 Web 应用 > Nest.js 框架，如下图所示

![在控制台选择 Nest.js 框架模板](https://s.poetries.top/uploads/2022/06/c05fcae4ea2a8593.png)

框架列表里能直接看到 Nest.js，说明官方对它是有内置适配的。

3. 单击「下一步」，完成基础配置选择

![Nest.js 应用的基础配置](https://s.poetries.top/uploads/2022/06/c23d3219be7ab860.png)

这一页和 Egg 那边完全一致，改个应用名就行。

- 上传方式，选择示例代码直接部署，单击完成，即可开始应用的部署。
- 部署完成后，可在应用详情页面查看示例应用的基本信息，并通过 API 网关生成的访问路径 URL 进行访问，查看你部署的 Nest.js 项目。

![Nest.js 示例项目部署完成](https://s.poetries.top/uploads/2022/06/60f6e95248310f40.png)

看到 Hello World 就说明通了，接下来换成自己的项目。

#### 自定义模板部署 Nest（推荐）

**初始化你的 Nest.js 项目**

```
npm i -g @nestjs/cli
nest new nest-app
```

在根目录下，执行以下命令在本地直接启动服务。

```
cd nest-app && npm run start
```

打开浏览器访问 http://localhost:3000，即可在本地完成 Nest.js 示例项目的访问。

**部署上云**

接下来执行以下步骤，对已初始化的项目进行简单修改，使其可以通过 Web Function 快速部署。此处项目改造通常分为以下两步。

- 新增 `scf_bootstrap` 启动文件
- 修改监听地址与端口为 `0.0.0.0:9000`

1. 修改启动文件 `main.ts`，监听端口改为 `9000`

![在 main.ts 中把监听端口改为 9000](https://s.poetries.top/uploads/2022/06/12736ad9dda9b911.png)

Nest 默认的 `app.listen(3000)` 要改成 `app.listen(9000, '0.0.0.0')`。只改端口不改地址的话，本地测没问题，上云必挂，因为容器网络进不来 `127.0.0.1`。

2. 在项目根目录下新建 `scf_bootstrap` 启动文件，添加如下内容用于启动服务

你也可以在控制台完成该模块配置。

![控制台里的启动文件配置](https://s.poetries.top/uploads/2022/06/9a96d63935762fc3.png)

Nest 的启动文件比 Egg 简单得多，一行 node 命令就够了。

```bash
# scf_bootstrap
#!/bin/bash

SERVERLESS=1 /var/lang/node12/bin/node ./dist/main.js
```

这里的 `./dist/main.js` 说明 Nest 部署的是编译产物，不是 TypeScript 源码。所以上传前一定要先 `npm run build`，或者在 `serverless.yml` 里用 `hook` 字段让组件帮你构建，后面 Layer 那一节的配置里就是这么写的。

新建完成后，还需执行以下命令修改文件可执行权限，默认需要 777 或 755 权限才可正常启动。示例如下。

```
chmod 777 scf_bootstrap
```

本地配置完成后，执行启动文件，确保你的服务可以本地正常启动。接下来登录 Serverless 应用控制台，选择 Web 应用 > Nest.js 框架，上传方式可以选择本地上传或代码仓库拉取。

> 注意：启动文件以项目内文件为准，如果你的项目里已经包含 scf_bootstrap 文件，将不会覆盖该内容。

![选择本地上传或代码仓库拉取](https://s.poetries.top/uploads/2022/06/c1fe93fe050d5f5c.png)

代码仓库拉取这个选项挺实用的，能直接连 GitHub 或 Coding，省掉本地打包上传这一步。

#### 使用 HTTP 组件（推荐）

Nest 用 HTTP 组件的配置和 Egg 那份高度相似，差别只在 `framework` 的值和启动文件内容上。

> 目前推荐使用 Web 函数，也就是 `HTTP 组件`，现在所有的 Serverless Web 应用都是基于 `component: http` 组件的。

> 详情查看：https://github.com/serverless-components/tencent-http

```yml
# 编写完善配置文件 serverless.yml
# https://github.com/serverless-components/tencent-http/blob/master/docs/configure.md
app: nest-app # 应用名称
component: http # http组件
name: nest-demo # 实例名称
inputs:
  region: ap-guangzhou # 云函数所在区域
  src: # 部署当前目录下的文件代码，并打包成zip上传到bucket上
    src: ./ # 当前目录
    exclude: # 被排除的文件或目录
      - .env
      - 'node_modules/**' # 忽略node_modules，在控制台安装
  # src: # 在指定存储桶bucket中已经存在了object代码，直接部署
  #   bucket: bucket01 # bucket name，当前会默认在bucket name后增加 appid 后缀, 本例中为 bucket01-appid
  #   object: cos.zip  # bucket key 指定存储桶内的文件
  faas: # 函数配置相关
    runtime: Nodejs12.16 # 运行时
    # 支持的框架查看 https://cloud.tencent.com/document/product/1154/59447#framework
    framework: nestjs # 选择框架，此处以 nestjs 为例
    name: ${name} # 云函数名称，通过变量形式获取name的值
    timeout: 60 # 超时时间，单位秒
    memorySize: 512 # 内存大小，默认 512 MB
    # layers:
    #   - name: layerName #  layer名称
    #     version: 1 #  版本
    environments: #  配置环境变量，同时也可以直接在 scf 控制台配置
        - key: NODE_ENV
          value: production
    # vpc: # 私有网络配置
    #   vpcId: 'vpc-xxx' # 私有网络的Id
    #   subnetId: 'subnet-xxx' # 子网ID
    # tags:
    #   - key: tagKey
    #     value: tagValue
  apigw: # http 组件会默认帮忙创建一个 API 网关服务
    isDisabled: false # 是否禁用自动创建 API 网关功能
    # id: service-xx # api网关服务ID，不填则自动新建网关
    name: serverless # api网关服务名称
    api: # 创建的 API 相关配置
      cors: true #  允许跨域
      timeout: 30 # API 超时时间
      name: apiName # API 名称
      qualifier: $DEFAULT # API 关联的版本
    protocols:
      - http
      - https
    environment: test
    # tags:
    #   - key: tagKey
    #     value: tagValue
    # customDomains: # 自定义域名绑定
    #   - domain: abc.com # 待绑定的自定义的域名
    #     certId: abcdefg # 待绑定自定义域名的证书唯一 ID
    #     # 如要设置自定义路径映射，(customMap = true isDefaultMapping = false)必须两者同时出现 其余情况都是默认路径
    #     customMap: true
    #     isDefaultMapping: false
    #     # 自定义路径映射的路径。使用自定义映射时，可一次仅映射一个 path 到一个环境，也可映射多个 path 到多个环境。并且一旦使用自定义映射，原本的默认映射规则不再生效，只有自定义映射路径生效。
    #     pathMap:
    #       - path: /
    #         environment: release
    #     protocols: # 绑定自定义域名的协议类型，默认与服务的前端协议一致。
    #       - http # 支持http协议
    #       - https # 支持https协议
    # app: #  应用授权配置
    #   id: app-xxx
    #   name: app_demo
    #   description: app description
```

配置写好后，在项目根目录下新建 `scf_bootstrap` 启动文件，添加如下内容用于启动服务。

```bash
#!/bin/bash

SERVERLESS=1 /var/lang/node12/bin/node ./dist/main.js
```

前面那个 `SERVERLESS=1` 是个环境变量标记，方便你在业务代码里区分「跑在云上」还是「跑在本地」，比如决定要不要连本地 mock 服务。

忽略 `node_modules` 文件上传。

```yml
# serverless.yml
exclude: # 被排除的文件或目录
  - .env
  - node_modules/**
```

注意这里写的是 `node_modules/**` 带两个星号，只写 `node_modules` 在某些版本下匹配不到子目录，包还是会被打进去。

执行 `sls deploy` 部署，加 `--debug` 可以看到详细日志。

![Nest 项目的部署过程](https://s.poetries.top/uploads/2022/06/15d73875b2f56fd4.png)
![部署完成后的资源信息](https://s.poetries.top/uploads/2022/06/903af650eb01b169.png)
![浏览器访问 Nest 应用](https://s.poetries.top/uploads/2022/06/a47a05e9bd8eb7c9.png)

跑通之后建议顺手把访问地址存下来，后面绑定自定义域名时要用。

**查看部署信息**

```
sls info
```

这个命令不会触发任何变更，只读当前实例的状态，包含函数名、网关 ID、访问地址。

![sls info 输出的部署信息](https://s.poetries.top/uploads/2022/06/68b296819ee39d4f.png)

**实时开发并上传**

> 每次改动文件，都实时部署。

```
sls dev
```

`sls dev` 除了自动上传，还会把云端日志实时打到终端，调试期比来回刷控制台高效太多。不过它是真的往线上推代码，别在生产实例上开。

**删除部署项目**

```
sls remove
```

![sls remove 删除 Nest 应用](https://s.poetries.top/uploads/2022/06/1c33faad7da0be9c.png)

#### 用 Layer 来减小项目文件大小

思路和 Egg 那节完全一样，只是名字换成 nestjs。随着项目复杂度的增加，`deploy` 上传会变慢，所以我们再优化一下，在项目根目录创建 `layer/serverless.yml`。


```yml
# layer/serverless.yml
# https://cloud.tencent.com/document/product/1154/51133
# https://github.com/serverless-components/tencent-layer/blob/master/docs/configure.md

app: nestjs-demo
stage: dev
component: layer # 组件
name: nestjs-demo-layer # 层名称 必须

# 组件参数配置，根据每个组件，实现具体的资源信息配置
inputs:
  name: nestjs-demo-layer
  region: ap-guangzhou
  src:
    src: ../node_modules
    targetDir: /node_modules
  runtimes: # 层支持的运行环境
    - Nodejs12.16
  description: layer description # 否 描述
```

这里比 Egg 那份多了个 `targetDir: /node_modules`，作用是指定解压后在 `/opt` 下的路径。不写的话包会散在 `/opt` 根目录，`NODE_PATH` 就找不到了。

**修改以上项目下的 serverless.yml 加入层配置**

回到项目根目录，调整一下根目录 `serverless.yml` 下的 `layers`。这份配置里还多了一个 `hook: npm run build`，它会在上传之前先跑构建，正好解决前面说的「Nest 要传 dist 产物」的问题。

```yml
# 编写完善配置文件 serverless.yml
# https://github.com/serverless-components/tencent-http/blob/master/docs/configure.md
app: nestjs-demo # 应用名称
stage: dev
component: http # http组件
name: http-nestjs # 实例名称

inputs:
  src: # 部署当前目录下的文件代码，并打包成zip上传到bucket上
    dist: ./ # build后的包
    hook: npm run build # 先构建在上传
    exclude: # 排除的文件
      - .env
      - node_modules/** # deploy 时排除 node_modules [需要注意] 使用layer的node_modules
    src: ./ # 当前目录
  faas: # 函数配置相关
    runtime: Nodejs12.16 # 运行时
    framework: nestjs # #选择框架，此处以 nestjs 为例
    name: '${name}' # 云函数名称，通过变量形式获取name的值
    eip: false
    timeout: 60 # 超时时间，单位秒
    memorySize: 512 # 内存大小，默认 512 MB
    tags: []
    environments: []
    layers: # 配置对应的 layer
      - name: ${output:${stage}:${app}:nestjs-demo-layer.name} # 配置对应的 layer
        version: ${output:${stage}:${app}:nestjs-demo-layer.version} # 配置对应的 layer 版本
  apigw:
    protocols:
      - http
      - https
    timeout: 60
    environment: release
    customDomains: []
  region: ap-guangzhou # 云函数所在区域
  isAutoCiDeploy: false
```

排除`node_modules`

```yml
exclude: # 被排除的文件或目录
    - .env
    - node_modules/** # deploy 时排除 node_modules [需要注意] 使用layer的node_modules
```

配置层

> 引用格式请参考 变量引用说明 https://github.com/AprilJC/Serverless-Framework-Docs/blob/main/docs/%E5%87%BD%E6%95%B0%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91/%E6%9E%84%E5%BB%BA%E5%BA%94%E7%94%A8.md#%E5%8F%98%E9%87%8F%E5%BC%95%E7%94%A8%E8%AF%B4%E6%98%8E

```yml
layers: # 配置对应的 layer
  - name: ${output:${stage}:${app}:nestjs-demo-layer.name} # 配置对应的 layer
    version: ${output:${stage}:${app}:nestjs-demo-layer.version} # 配置对应的 layer 版本
```

通过配置层 layer，代码和 `node_modules` 分离，`sls deploy` 会更快。

> 接着执行命令 `sls deploy --target=./layer` 部署层，然后再次部署 `sls deploy`，速度应该更快了。

![Nest 项目挂载层后的部署结果](https://s.poetries.top/uploads/2022/06/b1a9175c8c6d1404.png)

对比一下加层前后的上传耗时，差距主要体现在打包和上传阶段。

每次 `node_modules` 改变都需要

- 执行 `sls deploy --target=./layer` 先部署层，更新 `node_modules` 层
- 执行 `sls deploy` 重新部署

**layer 的加载与访问**

> layer 会在函数运行时将内容解压到 `/opt` 目录下。如果存在多个 `layer`，那么会按时间顺序进行解压。如果需要访问 `layer` 内的文件，可以直接通过 `/opt/xxx` 访问。如果是访问 `node_modules`，则可以直接 `require`，因为 `scf` 的 `NODE_PATH` 环境变量默认已包含 `/opt/node_modules` 路径。

#### 使用 Serverless Framework 的高阶 nestjs 组件部署（不推荐）

同样是留作参考的老写法，字段结构和前面 Egg 的高阶组件一脉相承。

> 目前推荐使用 Web 函数，也就是 `HTTP 组件`，现在所有的 Serverless Web 应用都是基于 `component: http` 组件的。

**初始化项目**

```
npm i -g @nestjs/cli
nest new nest-app
```

在根目录下，执行以下命令在本地直接启动服务。

```
cd nest-app && npm run start
```

**编写项目根目录下的 serverless.yml 文件**

注意这份配置里 `exclude` 把 `node_modules/**` 那行注释掉了，也就是依赖会一起上传。高阶组件的默认行为和 HTTP 组件不一样，这是两种写法混用时最容易出错的地方。

**全部配置详情**

> https://github.com/serverless-components/tencent-nestjs/blob/master/docs/configure.md


```yml
# serverless.yml
component: nestjs # (必选) 组件名称，在该实例中为nestjs
name: nest-demo # 必选) 组件实例名称.
# org: orgDemo # (可选) 用于记录组织信息，默认值为您的腾讯云账户 appid，必须为字符串
app: app-nest-demo # (可选) 用于记录组织信息. 默认与name相同，必须为字符串
stage: dev # (可选) 用于区分环境信息，默认值是 dev

inputs:
  region: ap-guangzhou # 云函数所在区域
  functionName: nest-demo # 云函数名称
  serviceName: nest-demo # api网关服务名称
  runtime: Nodejs12.16 # 运行环境
  # serviceId: service-jfdasew2112 # api网关服务ID 不填默认创建
  # entryFile: sls.js # 自定义 server 的入口文件名，默认为 sls.js，如果不想修改文件名为 sls.js 可以自定义
  # src: ./ # 第一种为string时，会打包src对应目录下的代码上传到默认cos上。
  src:  # 第二种，部署src下的文件代码，并打包成zip上传到bucket上
    src: ./  # 本地需要打包的文件目录
    # bucket: bucket01 # bucket name，当前会默认在bucket name后增加 appid 后缀, 本例中为 bucket01-appid
    exclude:   # 被排除的文件或目录
      - .env
      #- "node_modules/**"
  # src: # 第三种，在指定存储桶bucket中已经存在了object代码，直接部署
  #   bucket: bucket01 # bucket name，当前会默认在bucket name后增加 appid 后缀, 本例中为 bucket01-appid
  #   object: cos.zip  # bucket key 指定存储桶内的文件
  # layers:
    #   - name: ${output:${stage}:${app}:${name}-layer.name} # 配置对应的 layer
    #     version: ${output:${stage}:${app}:${name}-layer.version} # 配置对应的 layer 版本
  functionConf: # 函数配置相关
    timeout: 60 # 超时时间，单位秒
    eip: false # 是否固定出口IP
    memorySize: 512 # 内存大小，单位MB
    environment: #  环境变量
      variables: #  环境变量数组
        NODE_ENV: production
    # vpcConfig: # 私有网络配置
      # vpcId: '' # 私有网络的Id
      # subnetId: '' # 子网ID
  apigatewayConf: #  api网关配置
    isDisabled: false # 是否禁用自动创建 API 网关功能
    enableCORS: true #  允许跨域
    # customDomains: # 自定义域名绑定
    #   - domain: abc.com # 待绑定的自定义的域名
    #     certificateId: abcdefg # 待绑定自定义域名的证书唯一 ID
    #     # 如要设置自定义路径映射，请设置为 false
    #     isDefaultMapping: false
    #     # 自定义路径映射的路径。使用自定义映射时，可一次仅映射一个 path 到一个环境，也可映射多个 path 到多个环境。并且一旦使用自定义映射，原本的默认映射规则不再生效，只有自定义映射路径生效。
    #     pathMappingSet:
    #       - path: /
    #         environment: release
    #     protocols: # 绑定自定义域名的协议类型，默认与服务的前端协议一致。
    #       - http # 支持http协议
    #       - https # 支持https协议
    protocols:
      - http
      - https
    environment: test # 网关环境
    serviceTimeout: 60 # 网关超时
    # usagePlan: #  用户使用计划
    #   usagePlanId: 1111
    #   usagePlanName: slscmp
    #   usagePlanDesc: sls create
    #   maxRequestNum: 1000
    # auth: #  密钥
    #   secretName: secret
    #   secretIds:
    #     - xxx
```

### 3.5 用 sls 部署 Koa 项目

Koa 是三个框架里改造最轻的，因为 `koa-generator` 生成的项目本来就把启动逻辑收在 `bin/www` 里，改个端口就完事。

#### 控制台部署

1. 登录 [Serverless 应用控制台](https://console.cloud.tencent.com/sls)。
2. 单击新建应用，选择 Web 应用 > Koa 框架，如下图所示

![在控制台选择 Koa 框架模板](https://s.poetries.top/uploads/2022/06/6382481121ebc584.png)

3. 单击「下一步」，完成基础配置选择。
4. 上传方式，选择示例代码直接部署，单击完成，即可开始应用的部署。
5. 部署完成后，可在应用详情页面查看示例应用的基本信息，并通过 API 网关生成的访问路径 URL 进行访问，查看你部署的 Koa 项目。

![Koa 示例项目部署完成后的访问效果](https://s.poetries.top/uploads/2022/06/6ab832e2d0343c64.png)

到这里三个框架的模板部署流程你应该已经很熟了，套路完全一致。

#### 自定义模板部署

先全局安装 `koa-generator` 脚手架。

```
npm install -g koa-generator
```

创建项目

```
# 使用ejs引擎
koa2 -e koa-demo
```

```
cd koa-demo // 进入项目根目录
npm install // 安装项目依赖
```

```
npm start
```

本地能跑通再上云，这个顺序别倒过来，不然出了问题你分不清是代码的锅还是云的锅。

**部署上云**

接下来执行以下步骤，对已初始化的项目进行简单修改，使其可以通过 Web Function 快速部署。Koa 的改造只有一步。

- 修改监听地址与端口为 `0.0.0.0:9000`

**具体步骤如下**

在 Koa 示例项目中，把 `bin/www` 里的监听端口改到 `9000`。

![打开 bin/www 找到监听配置](https://s.poetries.top/uploads/2022/06/6be48886a199d8df.png)
![把端口改为 9000](https://s.poetries.top/uploads/2022/06/dd5fd8c12cb5d46a.png)
![本地重新启动确认端口生效](https://s.poetries.top/uploads/2022/06/f4edaeba5e1bd1f2.png)
![浏览器访问本地 9000 端口](https://s.poetries.top/uploads/2022/06/92152ad6865809d8.png)

本地用 9000 端口能打开页面，就说明改对了，接下来直接上云。

#### 使用 HTTP 组件部署

**编写 serverless.yml**

Koa 这份配置比前面两份更短，因为没有 Layer、也没有构建 hook，可以当成 HTTP 组件的最小可用模板来记。

```yml
# 文档 https://github.com/serverless-components/tencent-http/blob/master/docs/configure.md
# https://cloud.tencent.com/document/product/1154/59447
# org: '1258157827'
app: koa-demo
stage: dev
component: http # http组件
name: koa-demo
inputs:
  src:
    src: ./
    exclude: # 排除文件，在控制台WEBIDE开启自动安装依赖
      - .env
      - node_modules
  region: ap-guangzhou
  isAutoCiDeploy: false
  faas:
    runtime: Nodejs12.16
    eip: false
    timeout: 30
    memorySize: 512
    tags: []
    framework: koa # koa框架
    environments: []
    # layers:
    #   - name: '${output:${stage}:${app}:koa-demo-layer.name}'
    #     version: '${output:${stage}:${app}:koa-demo-layer.version}'
  apigw:
    timeout: 60
    protocols:
      - http
      - https
    environment: release
    customDomains: []
```

**项目根目录新增 scf_bootstrap 启动文件**

```bash
touch scf_bootstrap

# 还需执行以下命令修改文件可执行权限，默认需要 777 或 755 权限才可正常启动
chmod 777 scf_bootstrap
```

启动文件的内容如下。

```bash
#!/bin/bash
/var/lang/node12/bin/node bin/www # 修改入口为bin/www，并且修改bin/www下端口为9000
```

Koa 的入口是 `bin/www` 而不是 `app.js`，这一点和 Express 一样，别照着 Nest 那份写成 `dist/main.js`。

**部署**

```
sls deploy
```

![Koa 项目的部署过程](https://s.poetries.top/uploads/2022/06/74ac915db74d3dd6.png)
![部署完成后的资源清单](https://s.poetries.top/uploads/2022/06/34fceabfeb33c9e9.png)
![浏览器访问 Koa 应用](https://s.poetries.top/uploads/2022/06/4dcbaf2dbb72cef4.png)

这里 `exclude` 里排除了 `node_modules`，所以第一次访问八成还是 `Cannot find module`，去 WebIDE 打开自动安装依赖再刷新就好。

**查看部署信息**

```
sls info
```

![Koa 应用的 sls info 输出](https://s.poetries.top/uploads/2022/06/80ed7651618d4bd1.png)

**移除**

```
sls remove
```

后端三件套到此结束。回过头看，不管哪个框架，要做的其实就三件事，端口改 9000、写一个 `scf_bootstrap`、在 `serverless.yml` 里把 `framework` 填对。剩下的都是细节。

## 四、部署静态网站

后端讲完，前端静态站反而更简单。静态站不走云函数，走的是 `website` 组件，底层是 COS 加 CDN。

- 全部配置 https://github.com/serverless-components/tencent-website/blob/master/docs/configure.md
- 部署文档 https://cloud.tencent.com/document/product/1154/39276

> 部署的静态资源会存储到 COS 中。

这一章要做的其实就是「把 dist 目录传到对象存储并开启静态网站托管」，只不过 `sls` 把建桶、设权限、传文件、配 CDN 这几步合并成了一条命令。

### 4.1 用 sls 部署 Vue 项目

**初始化项目**

```
vue init webpack vue-demo
```

这条是 Vue CLI 2 的老命令，2022 年写这篇时手边正好是个老项目。新项目现在用 `npm create vue@latest` 或者 `npm create vite@latest`，产物目录同样是 `dist`，下面的配置照抄即可。

**编写 serverless.yml**

```yml
# https://github.com/serverless-components/tencent-website/blob/master/docs/configure.md
# https://cloud.tencent.com/document/product/1154/39276
component: website # (必填) 引用 component 的名称，当前用到的是 tencent-website 组件
name: vue-demo # (必填) 该 website 组件创建的实例名称

app: vue-demo # (可选) 该 website 应用名称
stage: dev # (可选) 用于区分环境信息，默认值是 dev

inputs:
  src:
    # 部署项目的目录路径
    src: ./
    dist: ./dist # build 完成后输出目录，如果配置 hook， 此参数必填
    index: index.html # 网站主页入口文件
    error: 404.html # 网站错误入口文件
    hook: npm run build #  构建命令,在代码上传之前执行
    # websitePath: ./
  region: ap-guangzhou
  bucketName: vue-test-demo # OSS存储桶名称
  protocol: https
  replace: false # 是否覆盖式部署
  ignoreHtmlExt: false # 是否是否忽略 html 扩展名，默认 false
  disableErrorStatus: false # 是否禁用错误码，默认 false
  autoSetupAcl: true # 自动配置 bucket 访问权限为 公有读私有写
  autoSetupPolicy: false # 自动配置 bucket 的 Policy 权限为 所有用户资源可读
  # env: # 配置前端环境变量
  #   API_URL: https://api.com
  # hosts:
  #   - host: test.com # 自定义域名
  #     async: false # 是否同步等待 CDN 配置。配置为 false 时，参数 autoRefresh 自动刷新才会生效，如果关联多域名时，为防止超时建议配置为 true。
  #     autoRefresh: true #开启自动 CDN 刷新，用于快速更新和同步加速域名中展示的站点内容
```

这份配置里有四个字段值得留意。

`hook: npm run build` 会在上传前自动执行构建，配了它 `dist` 就必须填。`bucketName` 是 COS 存储桶名，全局唯一，如果部署时报桶名冲突，换个带随机后缀的名字就行。`autoSetupAcl: true` 会自动把桶权限设成公有读私有写，这是静态站能被访问的前提。`error: 404.html` 是错误页，如果你的项目是 history 模式的单页应用，通常要把它也指到 `index.html`，否则刷新子路由会 404。

最后这条我踩过。Vue Router 用 history 模式部署上去，首页正常，刷新任何子路由全是 404，原因就是对象存储只按路径找文件，没有前端路由的概念。

执行部署。

```
sls deploy
```

> 如果希望查看更多部署过程的信息，可以通过 `sls deploy --debug` 命令查看部署过程中的实时日志信息。

![Vue 项目的部署过程](https://s.poetries.top/uploads/2022/06/22914c1b39955760.png)
![部署完成后的静态站访问地址](https://s.poetries.top/uploads/2022/06/84f4b895e0ef3e1a.png)

终端输出里的那个 `https://vue-test-demo-xxx.cos-website.ap-guangzhou.myqcloud.com` 就是访问地址，打开能看到页面就成了。

**开发调试**

> 部署了静态网站应用后，可以通过开发调试能力对该项目进行二次开发，从而开发一个生产应用。在本地修改和更新代码后，不需要每次都运行 `serverless deploy` 命令来反复部署。你可以直接通过 `serverless dev` 命令对本地代码的改动进行检测和自动上传。

- 可以通过在 `serverless.yml` 文件所在的目录下运行 `serverless dev` 命令开启开发调试能力。
- `serverless dev` 同时支持实时输出云端日志，每次部署完毕后，对项目进行访问，即可在命令行中实时输出调用日志，便于查看业务情况和排障。

**查看状态**

在 `serverless.yml` 文件所在的目录下，通过如下命令查看部署状态。

```
serverless info
```

**移除**

在 `serverless.yml` 文件所在的目录下，通过以下命令移除部署的静态网站 `Website` 服务。移除后该组件会对应删除云上部署时所创建的所有相关资源。

```
$ serverless remove
```

这里要小心，`remove` 会把整个存储桶连同里面的文件一起删掉。如果你往那个桶里放过别的东西，先备份。

> 和部署类似，支持通过 `sls remove --debug` 命令查看移除过程中的实时日志信息。

### 4.2 用 sls 部署 React 项目

React 这边和 Vue 没有本质区别，换个脚手架、换个 `bucketName` 就行。

**初始化项目**

```
npm i create-umi -g
create-umi react-demo
```

用的是 umi 脚手架，它的产物目录默认也是 `dist`。如果你用 Create React App 或者 Vite，产物目录分别是 `build` 和 `dist`，记得把下面配置里的 `dist` 字段改对。

**编写 serverless.yml**

```yml
# https://github.com/serverless-components/tencent-website/blob/master/docs/configure.md
# https://cloud.tencent.com/document/product/1154/39276
component: website # (必填) 引用 component 的名称，当前用到的是 tencent-website 组件
name: react-demo # (必填) 该 website 组件创建的实例名称

app: react-demo # (可选) 该 website 应用名称
stage: dev # (可选) 用于区分环境信息，默认值是 dev

inputs:
  src:
    # 执行目录路径
    src: ./
    dist: ./dist # 部署目录路劲
    index: index.html # 网站主页入口文件
    error: 404.html # 网站错误入口文件
    hook: npm run build #  构建命令,在代码上传之前执行
  region: ap-guangzhou
  bucketName: react-test-demo # OSS存储桶名称
  protocol: https
  replace: false # 是否覆盖式部署
  ignoreHtmlExt: false # 是否是否忽略 html 扩展名，默认 false
  disableErrorStatus: false # 是否禁用错误码，默认 false
  autoSetupAcl: true # 自动配置 bucket 访问权限为 公有读私有写
  autoSetupPolicy: false # 自动配置 bucket 的 Policy 权限为 所有用户资源可读
  # env: # 配置前端环境变量
  #   API_URL: https://api.com
  # hosts:
  #   - host: test.com # 自定义域名
  #     async: false # 是否同步等待 CDN 配置。配置为 false 时，参数 autoRefresh 自动刷新才会生效，如果关联多域名时，为防止超时建议配置为 true。
  #     autoRefresh: true #开启自动 CDN 刷新，用于快速更新和同步加速域名中展示的站点内容
```

配置写好后执行 `sls deploy`，下面是完整过程。

![React 项目执行构建与上传](https://s.poetries.top/uploads/2022/06/8614efb6787a455f.png)
![部署完成后的输出信息](https://s.poetries.top/uploads/2022/06/4048c87e395ebe98.png)
![浏览器访问部署好的 React 站点](https://s.poetries.top/uploads/2022/06/6aa33661c29780c8.png)

注意看第一张图，`hook` 配置的 `npm run build` 是在上传之前跑的。如果构建失败，整个部署会中断，不会把上一次的产物传上去，这个行为其实挺安全的。

实时监控项目部署。

```
sls dev
```

![sls dev 监听本地改动并自动上传](https://s.poetries.top/uploads/2022/06/a226acca0bb48bed.png)

改一行代码存盘，终端里就能看到它自动重新构建并上传，适合调样式的时候用。

### 4.3 用 sls 部署 VuePress 项目

文档站也是静态站，配置几乎一样，唯一的差别在源目录和产物目录的路径上。

![VuePress 项目的目录结构](https://s.poetries.top/uploads/2022/06/3e7f22a3df08fa4b.png)

VuePress 的产物在 `.vuepress/dist`，源码在 `.vuepress`，所以 `src` 和 `dist` 两个字段都要跟着改。

**编写 serverless.yml 配置**

```yml
# https://github.com/serverless-components/tencent-website/blob/master/docs/configure.md
# https://cloud.tencent.com/document/product/1154/39276
component: website # (必填) 引用 component 的名称，当前用到的是 tencent-website 组件
name: vuepress-demo # (必填) 该 website 组件创建的实例名称

app: vuepress-demo # (可选) 该 website 应用名称
stage: dev # (可选) 用于区分环境信息，默认值是 dev

inputs:
  src:
    src: .vuepress # (必填) .vuepress源文件夹路径
    dist: .vuepress/dist # 部署目录路径
    index: index.html # 网站主页入口文件
    error: 404.html # 网站错误入口文件
    hook: npm run build #  构建命令,在代码上传之前执行
  region: ap-guangzhou
  bucketName: vuepress-test-demo # OSS存储桶名称
  protocol: https
  replace: false # 是否覆盖式部署
  ignoreHtmlExt: false # 是否是否忽略 html 扩展名，默认 false
  disableErrorStatus: false # 是否禁用错误码，默认 false
  autoSetupAcl: true # 自动配置 bucket 访问权限为 公有读私有写
  autoSetupPolicy: false # 自动配置 bucket 的 Policy 权限为 所有用户资源可读
  # hosts:
  #   - host: test.com # 自定义域名
  #     async: false # 是否同步等待 CDN 配置。配置为 false 时，参数 autoRefresh 自动刷新才会生效，如果关联多域名时，为防止超时建议配置为 true。
  #     autoRefresh: true #开启自动 CDN 刷新，用于快速更新和同步加速域名中展示的站点内容
```

**执行部署**

```
sls deploy
```

![VuePress 站点部署完成](https://s.poetries.top/uploads/2022/06/f150204a59359b6d.png)

文档站上线之后，如果打算长期用，记得给它绑个自定义域名并开 CDN，默认那个 `cos-website` 域名又长又不好记，第 5.3 节会讲怎么绑。

**移除**

```
sls remove
```

## 五、综合实战

前面都是「把代码跑起来」，这一章开始处理真实业务会碰到的东西，连数据库、传文件、绑域名。

### 5.1 在 Serverless 中操作 MySQL、MongoDB 与配置 VPC 私有网络

云函数默认是没有内网的，它要连你的云数据库，必须走 VPC 私有网络。这一节的所有坑几乎都出在网络配置上。

#### 云函数接入数据库

> 参考：https://cloud.tencent.com/document/product/583/51935

**注意**，配置私有网络的服务器需要在同一个地区。

![云函数通过 VPC 接入数据库的网络结构](https://s.poetries.top/uploads/2022/07/1063776f916665ad.png)

这张图值得多看两眼。云函数和数据库必须落在同一个地域、同一个 VPC、同一个子网里，三者缺一不可。地域选错了，后面怎么配都连不上，而且报错只会是很干巴的连接超时。

#### 在 Node Serverless 中操作 MySQL

- 准备工作，先购买云数据库，或者自己在服务器上搭一个
- 然后用云函数操作 MySQL

**购买云数据库 MySQL**

![选择云数据库 MySQL 的规格](https://s.poetries.top/uploads/2022/07/a32767996808f68f.png)

![确认地域与可用区](https://s.poetries.top/uploads/2022/07/ca2c192149944c02.png)

![实例创建完成后的信息](https://s.poetries.top/uploads/2022/07/fb6f3d7a624a73f6.png)

买的时候把地域记下来，这个值会贯穿后面每一步。实例信息页里的那个内网 IP 就是待会代码里要填的 `host`。

**新建 MySQL 云函数**

![新建云函数并选择 Node 运行时](https://s.poetries.top/uploads/2022/07/968044649cbdbfee.png)

- 选择和 MySQL 同一个地域，两者之间通过 VPC 网络连接

![云函数的地域选择](https://s.poetries.top/uploads/2022/07/e7285b3cba07f7bf.png)

地域下拉框选错的话，后面私有网络那一栏根本列不出你的 VPC。

- 选择私有网络，和 MySQL 所在网络一致

![在函数配置中开启私有网络](https://s.poetries.top/uploads/2022/07/c31cd4d7d163bb89.png)
![选择与数据库相同的 VPC 与子网](https://s.poetries.top/uploads/2022/07/1d3382cca02d0f05.png)

VPC 和子网两个下拉框都要和数据库对上，只对上 VPC 不对子网也可能连不通。

如果没有现成的私有网络就新建一个，同样需要和 MySQL 实例在同一个地区。选择了新建的私有网络之后，MySQL 实例那边的网络也要改成一致。

![新建私有网络](https://s.poetries.top/uploads/2022/07/e848fe3eabb20b49.png)
![把 MySQL 实例的网络切换到同一个 VPC](https://s.poetries.top/uploads/2022/07/e5dfce33f28ac2f0.png)

数据库切换网络这一步会让内网 IP 变化，切完记得回去抄新的 IP，别拿旧的填代码。

- 登录 MySQL 数据库增加测试数据

![通过控制台登录数据库](https://s.poetries.top/uploads/2022/07/765e9fdf679b9661.png)

新建 test 数据库。

![创建 test 数据库](https://s.poetries.top/uploads/2022/07/794bc6fe87c43f55.png)

创建 user 表。

![创建 user 表并插入测试数据](https://s.poetries.top/uploads/2022/07/bc6c668125921773.png)

表里随便塞两行数据，等下函数返回结果时好确认到底连没连上。

- 修改云函数代码，保存部署即可

![在 WebIDE 中编辑云函数代码](https://s.poetries.top/uploads/2022/07/0ec0d7030a1a171a.png)

代码如下，它做的事就是建连接、查一次 `user` 表、关连接、把结果返回给网关。

```js
/**************************************************
Node8.9-Mysql
Reference: mysql api---https://www.npmjs.com/package/mysql
Reference: How to access database---https://cloud.tencent.com/document/product/236/3130
Reference: How to connect api gateway with scf---https://cloud.tencent.com/document/product/628/11983
***************************************************/

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
    host: '167.16.0.17', // The ip address of cloud database instance, 云数据库实例ip地址
    user: 'root', // The name of cloud database, for example, root, 云数据库用户名，如root
    password: 'xx', // Password of cloud database, 云数据库密码
    database: 'test', // Name of the cloud database, 数据库名称
    port: "3306"
  });

  connection.connect();

  const querySql = `SELECT * from user`

  let queryResult = await wrapPromise(connection, querySql)

  connection.end();

  return queryResult
}

```

这段代码有两个地方按今天的标准是要改的。一是 `wrapPromise` 里 `rej(error)` 之后没有 `return`，出错时后面的 `res(results)` 还会执行一次，虽然 Promise 只认第一次状态变更不会出 bug，但读起来容易误会，规范写法应该加 `return`。二是 `host`、`password` 这些直接写在代码里，正式项目请改成从函数的环境变量里读，控制台的「环境变量」配置项就是干这个的。

还有一点和 Serverless 模型强相关。这里每次调用都 `createConnection` 再 `end`，在常驻服务里是很浪费的写法，但在云函数里反而是对的，因为实例随时可能被回收，长连接池活不过一次回收。真要复用连接，得把 client 提到 handler 外面，靠热启动来共享，同时接受偶尔重连的成本。

改完代码重新部署。

![保存并重新部署云函数](https://s.poetries.top/uploads/2022/07/be2ad63b73cd90cb.png)

部署成功后函数还是没法从外网访问，还差触发器。

- 创建 API 网关触发器，然后在浏览器中访问

![为函数创建 API 网关触发器](https://s.poetries.top/uploads/2022/07/4d25248bad953017.png)

![触发器创建完成后的访问路径](https://s.poetries.top/uploads/2022/07/280e12f1381ad19b.png)

复制那条路径到浏览器里打开。

![浏览器中返回的数据库查询结果](https://s.poetries.top/uploads/2022/07/3bf2e7588ef4db51.png)

能看到刚才插进去的那两行数据，说明云函数已经通过 VPC 连上了内网数据库。如果这里超时，八成还是地域或子网没对齐，回去检查那三个「同一个」。

#### 在 Node Serverless 中操作 MongoDB

MongoDB 的流程和 MySQL 一模一样，只是连接串写法不同。

- 准备工作，先购买云数据库，或者自己在服务器上搭一个
- 然后用云函数操作 MongoDB

**购买 MongoDB 数据库**

![选择云数据库 MongoDB 的规格](https://s.poetries.top/uploads/2022/07/88f6da606016085b.png)
![MongoDB 实例创建完成](https://s.poetries.top/uploads/2022/07/81895e9b9ae7dac9.png)

创建时设置的用户名密码要记牢，后面拼连接串要用，忘了只能重置。

**创建云函数**

![新建操作 MongoDB 的云函数](https://s.poetries.top/uploads/2022/07/ada2715770b68f92.png)

- 选择地区，还是那句话，和数据库保持一致

![选择与 MongoDB 相同的地域](https://s.poetries.top/uploads/2022/07/cdc6c87499019a46.png)

- 选择私有网络，和 MongoDB 所在网络一致

![函数的私有网络配置](https://s.poetries.top/uploads/2022/07/cfdd4a0e3e82ee18.png)

配完网络再写代码，顺序反过来的话你会以为是代码问题，白排查一轮。

- 修改云函数代码

```js
const {promisify} = require('util')
const mongodb = require('mongodb')

var mongoClient = mongodb.MongoClient,
    assert = require('assert');

const connect = promisify(mongodb.connect)

// URL combination
// var url = 'mongodb://mason_mongodb:mason12345@10.10.11.19:27017/admin';

var url="mongodb://mongouser:password@10.0.0.13:27017,10.0.0.8:27017,10.0.0.11:27017/admin?authSource=admin&replicaSet=cmgo-e23piswf_0"

exports.main_handler = async (event, context, callback) => {
    console.log('start main handler')
    const MongoClient = require("mongodb").MongoClient;
    const mc = await MongoClient.connect(url,{useNewUrlParser: true})
    const db = mc.db('testdb')
    const collection = db.collection('demoCol')
    await collection.insertOne({a:1,something:'你好 serverless'})
    const as = await collection.find().toArray()
    console.log(as)

    mc.close()

    return as
}
```

这段代码里 `url` 那一长串是副本集连接串，`replicaSet=cmgo-xxx_0` 这部分是实例专属的，一定要从控制台复制，手拼基本拼不对。顶上 `promisify(mongodb.connect)` 和 `assert` 那两行其实没用上，属于示例里的历史残留，实际只用了 handler 里的 `MongoClient.connect`，你抄的时候可以删掉。

另外 `useNewUrlParser: true` 是 MongoDB Node 驱动 3.x 时代的写法，用来切换新的连接串解析器。4.x 之后新解析器成了默认值，这个参数会被忽略，写不写都行。如果你现在用的是新版驱动，直接去掉更干净。

代码写完之后创建触发器。

![为 MongoDB 云函数创建触发器](https://s.poetries.top/uploads/2022/07/1da43f40efc683d6.png)

![访问后返回插入的文档](https://s.poetries.top/uploads/2022/07/5a8d14fb5d7417c0.png)

返回里能看到那条带「你好 serverless」的文档，就说明写入和查询都通了。

### 5.2 对象存储 COS 介绍，用 Node 操作 COS 并实现图片上传

#### 对象云存储 COS 介绍

回到前面 1.4 节留下的那个划分。狭义的 Serverless 由 `FaaS` 和 `BaaS` 两部分组成，前面几章讲的全是 FaaS，这一节讲的 COS 就是典型的 BaaS。

![FaaS 与 BaaS 的分工](https://s.poetries.top/uploads/2022/07/396be7b44eb9dd81.png)

为什么云函数一定要配一个对象存储？因为函数的文件系统是临时的，只有 `/tmp` 能写，而且实例一回收就没了。任何需要持久保存的文件，都得往 COS 这类外部存储里放。

> 对象存储（Cloud Object Storage，COS）是一种存储海量文件的分布式存储服务，具有高扩展性、低成本、可靠安全等优点。通过控制台、API、SDK 和工具等多样化方式，用户可简单、快速地接入 COS，进行多格式文件的上传、下载和管理，实现海量数据存储和管理。

![COS 的产品能力示意](https://s.poetries.top/uploads/2022/07/0fc384f78966e294.png)

顺带一提，第四章部署静态网站用的也是 COS，只不过那时候是 `website` 组件在背后替你操作它。

#### 用 Node 操作 COS

先装官方 SDK。

> 参考官方文档：https://cloud.tencent.com/document/product/436/8629

```bash
cnpm i cos-nodejs-sdk-v5 --save
```

```js
const COS = require('cos-nodejs-sdk-v5');
const fs=require("fs");

//配置cos的sdk  https://console.cloud.tencent.com/cam/capi
var cos = new COS({
    SecretId: 'xx',
    SecretKey: 'xx'
});

//上传本地图片到对象云存储里面
cos.putObject({
    Bucket: 'express-demo-1251179943', /* 必须存储桶名称 */
    Region: 'ap-guangzhou',    /* 必须 区域*/
    Key: 'a.png',              /* 必须   目录/文件的名称  */
    StorageClass: 'STANDARD',
    Body: fs.createReadStream('./a.png'), // 上传文件对象
    onProgress: function(progressData) {
      console.log(JSON.stringify(progressData));
    }
}, function(err, data) {
    console.log(err || data);
});
```

`putObject` 的四个必填项是 `Bucket`、`Region`、`Key`、`Body`。`Key` 就是文件在桶里的完整路径，写成 `test/a.png` 它就会落在 `test` 目录下，COS 里的目录其实是伪目录，靠 key 的斜杠分层。`Body` 这里传的是可读流，小文件也可以直接传 Buffer，下面 Express 那段用的就是 Buffer。

密钥这块再强调一遍，`SecretId` 和 `SecretKey` 千万别硬编码进仓库。这两把钥匙是账号级权限，泄露了对方能操作你名下所有资源。正确做法是走函数的环境变量，或者用临时密钥（STS）。

#### Express 在 Serverless 中实现图片上传到 COS

这是本章最完整的一个例子，把前面的东西串起来了。文件从浏览器传到云函数，云函数再转存到 COS。

安装模块 multer https://github.com/expressjs/multer

```bash
npm install --save multer
```

先配置 form 表单，注意 `enctype` 必须是 `multipart/form-data`。

```html
<!-- views/index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Serverless Component - Express.js</title>
    <link rel="stylesheet" href="/css/basic.css">
  </head>
  <body>
    <form action="/doUpload" method="post" enctype="multipart/form-data">
      用户名：<input type="text" name="username" />
      <br>
      <br>
      头 像 : <input type="file" name="face" />
      <br>
      <br>
      <input type="submit" value="提交">
    </form>
  </body>
</html>
```

接下来是这个方案最关键的一处设计选择。

> 配置内存存储引擎（`MemoryStorage`），内存存储引擎将文件存储在内存中的 `Buffer` 对象，它没有任何选项。

```js
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })
```

为什么这里必须用 `memoryStorage` 而不是默认的磁盘存储？因为 multer 默认会把上传的文件写到系统临时目录，而云函数里只有 `/tmp` 可写，默认路径大概率直接抛 EACCES。用内存存储就绕开了磁盘，拿到 Buffer 直接转手给 COS，反正文件也不需要在本地留。

代价是大文件会吃内存。函数内存默认 512 MB，传个几百兆的视频就爆了，这种场景应该改用前端直传 COS 加临时密钥的方案，别让函数当中转。

接下来接收文件并上传到云存储。

```js
// app.js
const express = require('express');
const path = require('path');
const ejs = require("ejs");
var bodyParser = require('body-parser')
var multer = require('multer');
var tools = require('./services/tools.js');

const app = express();

//配置上传
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

// 配置中间件
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

//配置模板引擎
app.engine("html", ejs.__express)
app.set("view engine", "html")

//会对指定类型进行 Base64 编码
app.binaryTypes = ['*/*'];

//静态web服务
app.use(express.static("public"));
// Routes
app.get(`/`, (req, res) => {
  res.render("index", {
    title: "你好serverless"
  })
});

//注意：https://github.com/serverless-components/tencent-koa/blob/master/docs/upload.md
app.post(`/doUpload`, upload.single("face"), async (req, res) => {
  console.log(req.body);
  console.log(req.file);

  //上传本地图片到对象云存储里面   注意异步
  let result = await tools.uploadCos(req.file.originalname, req.file.buffer)

  res.send({
    body: req.body,
    result: result
  });
});


// Error handler
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(500).send('Internal Serverless Error');
});

module.exports = app;
```

这份 `app.js` 里有一行很不起眼但很致命的配置，`app.binaryTypes = ['*/*']`。它告诉 Serverless 的适配层，哪些 Content-Type 要按二进制处理并做 Base64 编码。不加这行，图片经过 API 网关时会被当成文本，传到 COS 里的文件打开是花的。

`upload.single("face")` 里的 `face` 必须和表单里 `<input type="file" name="face" />` 的 name 完全一致，写错了 `req.file` 就是 undefined。

再看具体的上传封装。

```js
// services/tools.js
const COS = require('cos-nodejs-sdk-v5');

module.exports={
  uploadCos(filename,source){
    let cos = new COS({
      SecretId: 'xx',
      SecretKey: 'xx'
    });
    return new Promise((reslove, reject) => {
      cos.putObject({
        Bucket: 'test-xx', /* 必须 */
        Region: 'ap-beijing',    /* 必须 */
        Key: 'test/' + filename,              /* 必须 test为目录名称 */
        StorageClass: 'STANDARD',
        Body: source, // 上传文件对象
        onProgress: function (progressData) {
          console.log(JSON.stringify(progressData));
        }
      }, function (err, data) {
          if(err){
              reject(err);
          }else{
              reslove(data);
          }

      });
    })
  }
}
```

这里的 `reslove` 是原文里的拼写笔误，正确拼法是 `resolve`。它只是个形参名，代码能跑，但抄进项目里会很别扭，建议改过来。另外每次调用都 `new COS()` 也有优化空间，可以提到模块顶层复用。

**上传文件需要注意**

> https://github.com/serverless-components/tencent-koa/blob/master/docs/upload.md

![官方文档中关于上传的说明](https://s.poetries.top/uploads/2022/07/d959441445eecfb5.png)

这份文档里讲的就是 Base64 编码那件事，是我当时排查图片损坏时找到的关键线索。

回到配置。修改 `serverless.yml`，在网关配置里打开 Base64 编码。

```yml
app: appDemo
stage: dev
component: koa
name: koaDemo

inputs:
  # 省略...
  apigatewayConf:
    isBase64Encoded: true # 需要加上，否则上传图片到cos预览有问题
    # 省略...
  # 省略...
```

`isBase64Encoded: true` 就是解决图片预览花屏的那把钥匙，和代码里的 `app.binaryTypes` 是一对，两边都要配上才生效。这个坑我排查了挺久，一直以为是 COS 的问题，最后才发现是网关在中间把二进制流按文本转了一道。

**完整的 serverless.yml**

```yml
app: expressdemo
component: express
name: expressDemo
inputs:
  runtime: Nodejs10.15
  region: ap-guangzhou
  src:
    src: ./
    exclude:
      - .env
      - .git
      - node_modules
  apigatewayConf:
    enableCORS: false
    isBase64Encoded: true # 需要加上，否则上传图片到cos预览有问题
    protocols:
      - http
      - https
    environment: release
```

这份完整配置用的是 `component: express`，属于高阶框架组件的写法，所以字段名是 `apigatewayConf` 而不是 `apigw`。如果你改用 HTTP 组件，对应的字段是 `apigw.api.isBase64Encoded`，别照抄错层级。

写完部署，然后记得去 WebIDE 开启自动安装依赖。

```bash
sls deploy
```

### 5.3 配置自定义域名与 HTTPS 访问

部署完你会拿到一个 `service-xxx.gz.apigw.tencentcs.com` 这样的地址。能用，但没法给别人看。这一节把它换成自己的域名。

#### Serverless 中配置域名访问

自定义域名不是在函数上配的，是在它背后那个 API 网关上配的。先找到云函数对应的 API 网关。

![从函数详情找到对应的 API 网关服务](https://s.poetries.top/uploads/2022/07/7c53c0ead5e166f7.png)

一个网关服务下面可能挂着多个 API，别点错服务。

编辑 API 网关，点击域名管理。

![API 网关的域名管理入口](https://s.poetries.top/uploads/2022/07/fa2e097f55e8460b.png)

新建域名，把你要绑的域名填进去。

![新建自定义域名](https://s.poetries.top/uploads/2022/07/9f4acfb1d41d15ec.png)

![填写域名与路径映射](https://s.poetries.top/uploads/2022/07/cbc5cd59595597bc.png)

这里可以顺手配路径映射，把 `release` 环境映射到根路径，这样访问地址里就不用带 `/release` 后缀了。

填完还没结束，得回到域名服务商那里做解析，加一条 CNAME 指向网关给你的默认域名。

![在 DNS 服务商处添加 CNAME 解析](https://s.poetries.top/uploads/2022/07/c2dc26b03c9b36be.png)

解析生效一般几分钟，`dig` 一下能看到 CNAME 指过去就算好了。国内域名还要注意备案，没备案的域名绑不上。

#### Serverless 中配置 HTTPS 访问

HTTPS（全称 Hyper Text Transfer Protocol over Secure Socket Layer）是以安全为目标的 HTTP 通道，简单讲就是 HTTP 的安全版。

它在 HTTP 的基础上添加了安全层，从原来的明文传输变成密文传输。加密与解密当然是要付出时间代价与开销的，不完全统计有 10 倍的差异。

> 以现在的网络环境和硬件性能来说这点开销可以忽略不计，全站 HTTPS 已经是默认选项。目前微信小程序请求 API 必须用 HTTPS，iOS 请求 API 接口也必须用 HTTPS。

**HTTPS 证书类型**

- 域名型 HTTPS 证书（DVSSL），信任等级一般，只需验证网站的真实性便可颁发证书保护网站
- 企业型 HTTPS 证书（OVSSL），信任等级强，需要验证企业的身份，审核严格，安全性更高
- 增强型 HTTPS 证书（EVSSL），信任等级最高，一般用于银行证券等金融机构，审核严格，安全性最高，同时可以激活绿色网址栏

个人项目和内部工具用免费的 DV 证书完全够用，申请几分钟就下来了。

**创建证书**

![在 SSL 证书控制台申请证书](https://s.poetries.top/uploads/2022/07/c0bd93006ea724cd.png)

申请时会让你做域名验证，走 DNS 验证最省事，加一条 TXT 记录就行。

证书签发之后回到网关的域名配置里选择证书。

![在网关域名配置中选择已签发的证书](https://s.poetries.top/uploads/2022/07/c7ecd5414acc9881.png)

选完保存，协议勾上 HTTPS，浏览器地址栏的小锁就出来了。这里有个坑，证书是有有效期的，免费 DV 证书通常一年，到期前记得续，网关不会自动帮你换。

#### COS 中配置域名

静态网站那边同理，自定义域名是配在存储桶上的。

![在 COS 存储桶配置自定义源站域名](https://s.poetries.top/uploads/2022/07/565fff50504ea193.png)

配的时候可以顺便开启 CDN 加速，静态资源走 CDN 比直接回源快很多。

同样需要做域名解析。

![为 COS 自定义域名添加解析记录](https://s.poetries.top/uploads/2022/07/08646a66aeb4c8fb.png)

到这里，一个完整的前后端 Serverless 部署链路就闭合了。前端静态资源在 COS 加 CDN，后端接口在云函数加 API 网关，两边各自绑自己的域名，中间用 CORS 或者同域路径映射打通。

## 六、常见问题答疑

这几个是我自己当时反复搜过的问题，集中放在这里。

### scf_bootstrap 启动文件与 sls.js 启动文件的区别

刚上手时这两个文件很容易搞混，明明都是入口，为什么有两套。

![web 函数与事件函数的对比](https://s.poetries.top/uploads/2022/06/c70fc14a6975b58d.png)

- `scf_bootstrap` 文件是针对 **Web 函数**的，云端起一个真实的 HTTP 服务，你的框架照常监听端口
- `sls.js` 入口文件是针对**事件函数**的，主要是 `serverless` 封装了一些开源框架之后改造出来的入口文件，请求会被转成 event 对象喂给 handler

判断依据很简单，看 `serverless.yml` 里的 `component`。填 `http` 就是 Web 函数，用 `scf_bootstrap`；填 `egg`、`koa`、`express` 这类框架组件就是事件函数，用 `sls.js`。

### serverless.yml 到底该用哪种写法，是更推荐 HTTP 组件吗

是的，而且官方在文档和社区里都给过明确说法。

![官方关于组件选型的说明](https://s.poetries.top/uploads/2022/06/bf28a299163edd25.png)
![社区里对 HTTP 组件的推荐](https://s.poetries.top/uploads/2022/06/73dd2079f12bc9e2.png)
![框架组件与 HTTP 组件的差异说明](https://s.poetries.top/uploads/2022/06/2fd1b2033733a2f9.png)

> 目前推荐使用 Web 函数，也就是 `HTTP 组件`，现在所有的 Serverless Web 应用都是基于 `component: http` 组件的。

我自己的理解是，Web 函数的心智负担更小。它跑的就是一个普通的 HTTP 服务，本地怎么跑云上就怎么跑，不需要理解 event、context 那一套映射关系，出问题也更容易复现。

### 配额超限了怎么办

云函数 SCF 针对每个用户帐号都有一定的配额限制。

![SCF 的各项配额限制](https://s.poetries.top/uploads/2022/06/a75c8ba81b1830ac.png)

> 其中需要重点关注的就是单个函数代码体积 500 MB 的上限。在实际操作中，云函数虽然提供了 500 MB，但也存在着一个 deploy 解压上限。

**关于绕过配额问题**

- 如果超的不多，那么使用 `npm install --production` 就能解决问题
- 如果超的太多，那就通过挂载 `cfs` 文件系统来进行规避（[参考文章](https://zhuanlan.zhihu.com/p/218803108?utm_source=wechat_session)）

除了这两条，前面讲的 Layer 也是一条路。把稳定不变的依赖沉到层里，函数本体只留业务代码，体积能压下来一大截。

同样提醒一句，上面这些配额数字是 2022 年的，各家云厂商的配额和限制会随版本调整，实际以你控制台里的配额说明为准。

## 七、官方文档速查

- [serverless官方应用中心文档](https://cloud.tencent.com/document/product/1154/59447)
- [serverless帮助文档](https://cn.serverless.com/framework/docs)
- [Serverless Components Github主页](https://github.com/serverless-components)
- [serverless-components/tencent-framework-components](https://github.com/serverless-components/tencent-framework-components)
- [serverless-components/tencent-nestjs](https://github.com/serverless-components/tencent-nestjs)
- [serverless-components/tencent-egg](https://github.com/serverless-components/tencent-egg)
- [serverless-components/tencent-http](https://github.com/serverless-components/tencent-http)
- [serverless 官方bug提交](https://github.com/serverless/serverless-tencent/issues)
- [serverless 官方社区文档](https://github.com/serverless/serverless-tencent/discussions)

如果你更关心小程序和轻量全栈那条线，腾讯云还有一套 CloudBase，思路和这里讲的 Serverless 一脉相承但更偏一体化，我另外整理过一份 [CloudBase 云开发实践总结](https://feinterview.poetries.top/blog/cloudbase-summary) 可以接着看。

## 总结

把这一整篇压缩成几句能带走的话。

后端框架上云，不管 Egg、Nest.js 还是 Koa，要做的都是同三件事，监听地址改成 `0.0.0.0:9000`、写一个 `chmod 777` 过的 `scf_bootstrap`、在 `serverless.yml` 里把 `component: http` 和 `framework` 填对。这三件事做完，剩下的报错基本都是依赖没装或者权限没给。

组件选型上，新项目直接用 HTTP 组件，别碰 `component: egg` 这类高阶框架组件。两套字段名完全不同，混着抄是新手最常见的翻车点。

部署慢就上 Layer。把 `node_modules` 拆成独立的层，代码和依赖分开发布，配合 `${output:...}` 变量引用绑定版本。注意顺序，先 `sls deploy --target=./layer` 再 `sls deploy`，反了函数还绑在旧层上。

数据库那块，地域、VPC、子网这三个「同一个」是硬条件，任何一个对不上都是超时，而且报错完全不提示原因。

上传图片如果发现在 COS 里打开是花的，去检查两个地方，代码里的 `app.binaryTypes` 和网关配置里的 `isBase64Encoded`，缺一不可。

最后说句实在的，这套东西最适合的场景是中小流量的后台、工具站、活动页、文档站。真到了高并发长连接的业务，冷启动和实例回收带来的那些约束会变得很难受，那时候还是老老实实用容器。

## 参考

- [腾讯云 Serverless 应用中心文档](https://cloud.tencent.com/document/product/1154/59447)
- [Serverless Framework 中文文档](https://cn.serverless.com/framework/docs)
- [tencent-http 组件配置文档](https://github.com/serverless-components/tencent-http/blob/master/docs/configure.md)
- [腾讯云层（Layer）管理文档](https://cloud.tencent.com/document/product/1154/51133)
- [云函数接入数据库说明](https://cloud.tencent.com/document/product/583/51935)
- [对象存储 COS Node.js SDK 文档](https://cloud.tencent.com/document/product/436/8629)
- [multer 官方仓库](https://github.com/expressjs/multer)
- [前端进阶之旅](https://interview.poetries.top)
