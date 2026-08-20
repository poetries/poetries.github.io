---
title: 微信云托管入门与实践
description: 微信云托管从入门到落地的完整实践，含模板部署、Nestjs 自定义部署、CLI 工具、VSCode 本地 docker 调试与实时开发、Live Coding 配置，以及云调用免鉴权访问微信开放接口和小程序云函数的完整代码。
date: 2022-06-19 12:30:41
tags:
  - 部署
  - 云托管
  - 小程序
  - Docker
categories: Front-End
---

给小程序做后端，最烦的从来不是写业务，是那一堆跟业务无关的事。买服务器、配 nginx、申请 HTTPS 证书、写进程守护、处理 `access_token` 的获取和续期、做接口鉴权。真正写代码的时间可能只占三分之一。

微信云托管想解决的就是这段。你给它一个 Dockerfile，它负责构建、部署、扩缩容、日志、域名和 HTTPS。更关键的是，跑在上面的服务能直接免鉴权调微信开放接口，`access_token` 由平台推到容器里，你从文件读一下就能用，不用自己维护有效期，也不用把密钥带在身上。

这篇是我把一个 koa 服务从本地调试跑到云托管上线的完整记录。包括模板部署、自定义部署、CLI 工具、VSCode 里的本地 docker 调试和实时开发，以及云调用怎么用来访问内容安全接口、调小程序云函数、生成小程序码。中间标出了几个真的卡住过我的地方，比如调试容器端口对不上、`X-WX-SERVICE` 填错、云调用白名单前缀怎么写。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 微信云托管和微信云开发的定位差别，什么项目该选哪个
- 容器时区差 8 小时的成因和 Dockerfile 里的修法
- 模板一键部署，以及小程序端 `wx.cloud.callContainer` 怎么调
- 自定义部署 Nestjs 的完整流程，构建日志怎么看
- CLI 工具的密钥怎么生成，能做哪些事
- VSCode 插件本地起容器调试，两个端口分别是干嘛的
- 微信开发者工具 Attach 到本地容器，在模拟器里调真实链路
- Live Coding 实时开发，改代码不用重建容器
- 云调用的原理，`access_token` 挂载在容器哪个路径
- 用云调用访问文字安全检测、小程序云函数、获取小程序码三个实例

## 一、微信云托管是什么

### 定位和能力

- 微信云托管 是微信团队提供的以云原生为基础的，免运维、高可用服务上云解决方案，无需服务器，1分钟即可部署小程序/公众号服务端。
- 微信云托管支持目前绝大多数语言/框架项目，开发者可以从服务器平滑迁移；并且微信云托管的自动运维和扩缩容特性，无需开发者关心服务的可用性，专注于业务，极大节省人力和服务资源成本。
- 同时，微信云托管还集成持续交付部署，DevOps自动化，安全鉴权等众多能力，致力于帮助没有深层运维经验的业务开发者和研发团队，用最低的成本，打造出稳定性高，安全性强的后端服务。
- 最重要的，微信云托管与微信生态深度融合，具有免鉴权，云调用，消息推送，微信支付等众多微信优势特性，开发者可以非常轻松和高效的完成互通，并且在安全、可靠性方面有微信团队的专业保障。

这四条里，我认为真正拉开差距的是最后一条。前面三条本质是运维托管，别的云厂商也能提供；「与微信生态深度融合」这件事只有微信自己能做，具体落到免鉴权的云调用上，后面第六节会专门展开。

![微信云托管的产品能力概览](https://s.poetries.top/uploads/2022/06/1399e820bc230d5c.png)

这张图是官方的能力概览，容器托管、存储、微信生态、监控告警这几块的划分能建立个整体印象。看不清细节没关系，下面每一块后面都会实际用到。

### 架构特点

> 微信云托管以容器服务为核心，提供方便易用的存储体系、微信生态、安全鉴权等服务能力；搭配简单易懂的操作面板，集成资源监控，资源告警，流水线等自动化功能，是一站式的后端云服务。

微信云托管使用目前主流的容器平台Docker以及容器编排技术Kubernetes（简称K8S），来管理你的项目

![微信云托管基于 Docker 和 Kubernetes 的架构图](https://s.poetries.top/uploads/2022/06/9a112314718e46da.png)

「底层是 Docker 加 K8S」这句话对使用者来说有几个实际含义，值得展开。

第一，你的部署单位是镜像，构建规则写在 Dockerfile 里，所以本地能用 `docker build` 跑起来的东西，基本原样就能上云托管。迁移成本极低，这是它相对云函数最大的优势。

第二，实例是可以被随时销毁重建的。K8S 按负载扩缩容，流量下来了实例会被回收。所以你的服务必须是无状态的，本地文件系统里写的东西随时会没，session 不能存在内存里。

第三，多实例之间不共享内存。定时任务这类逻辑要小心，三个实例各跑一份定时器，任务就被执行了三次。

### 几个常见问题

#### 云托管的作用是什么？

> 代替服务器部署小程序/公众号后端。

#### 微信云托管和微信云开发的区别是什么，如何选择？

- 微信云开发和微信云托管都是微信联合腾讯云打造的微信云服务生态的组成部分，都提供了免服务器免运维的能力，开发者可以根据自己的业务特点进行选择。
- 微信云开发以云函数提供计算能力，围绕 Node.js 技术栈，适合前端开发者简单快捷实现后端功能，或全栈开发者一体化开发； 微信云托管以容器提供计算能力，支持任意后端语言和框架，适合前后端分离项目的后端开发、传统模式后端项目迁移，对团队协作和企业级应用场景更友好

这两个我都用过一段时间，说说我自己的判断标准。

一个人做小程序、后端逻辑不复杂、只要增删改查加几个业务函数，云开发更快。它连数据库和存储都一起给你了，前端页面里直接 `wx.cloud.callFunction` 就能调，中间一层网络都不用管。

有独立后端、用了 Nest 或者 Egg 这种框架、有中间件和依赖注入这一套、或者压根不是 Node 而是 Java Go，那就是云托管。另外一个信号是团队规模，云函数那种一个函数一个目录的组织方式，人一多就乱了，而云托管本质是跑一个正常的后端服务，工程实践跟平常没区别。

我自己现在的项目是混着用的，主服务在云托管，一些边角逻辑还留在云开发的云函数里，后面第六节会演示云托管怎么反过来调云函数。关于云开发那一套的用法我单独写过 [CloudBase 云开发总结](https://feinterview.poetries.top/blog/cloudbase-summary)，需要的话可以对照看。

#### 微信云托管和云开发中的云托管有何区别？

- 微信云托管和之前云托管的区别除了品牌升级外，还做了独立的控制台。旧的云托管只是云开发的一个模块，只有单纯的容器引擎能力，升级为微信云托管后脱离云开发，成为完整的后端项目托管解决方案。 从代码管理到CI/CD流水线部署发布，提供全链路、低成本、企业级的云原生解决方案，功能更强大、体验更友好
- 云开发中的云托管能力已停止功能更新，仅支持存量业务继续运行。建议原云开发中的云托管的用户尽快将项目迁移到微信云托管。

#### 微信云托管可以用于APP/网站/其他平台小程序吗？

> 必须先有微信小程序/公众号才可以开通微信云托管，但部署在微信云托管上的服务可以通过公网访问，因此可以被APP/网站/其他平台小程序的前端调用，只是无法享受 callcontainer 内部链路带来的安全防DDoS/请求加速等优势。

#### 微信云托管的环境可以在微信开发者工具的云开发控制台中看到吗？

> 微信云托管和微信云开发是两套独立体系，微信云托管的环境只能在微信云托管控制台看到，在微信开发者工具的云开发控制台中不能看到

#### 腾讯云和微信云托管有关系吗？

> 微信云托管是整合了腾讯云底层资源和微信生态链路的综合解决方案。原云开发中的云托管独立出来，升级为微信云托管，补充数据库、ci/cd、灰度发布等更多完整后端功能和企业级devops能力。

#### 云托管的时间为什么差 8 个小时？

这个问题几乎每个人都会碰到，单独说清楚。

容器系统时间默认为 UTC 协调世界时间 （Universal Time Coordinated），与本地所属时区 CST （上海时间）相差 8 个小时：

根因在基础镜像。`node`、`centos` 这些官方镜像为了通用性都用 UTC，容器里跑 `new Date()` 拿到的就是 UTC 时间。写进数据库的 `createTime` 全是早 8 小时的，日志时间戳跟用户反馈的时间对不上，排查问题时特别折磨人。

在构建基础镜像或在基础镜像的基础上制作自定义镜像时，在 `Dockerfile` 中创建时区文件即可解决单一容器内时区不一致问题，且后续使用该镜像时，将不再受时区问题困扰。

1. 打开 `Dockerfile` 文件。
2. 写入以下内容，配置时区文件

```
FROM centos as centos  COPY --from=centos  /usr/share/zoneinfo/Asia/Shanghai /etc/localtime RUN echo "Asia/Shanghai" > /etc/timezone
```

这段是官方文档里的写法，三条指令被挤在一行里了，实际写进 Dockerfile 要分行。原理是从一个带完整时区数据库的镜像里把上海时区文件复制到 `/etc/localtime`，再写一份 `/etc/timezone` 告诉系统当前时区是哪个。

Debian 系的基础镜像（比如 `node:14`）更常见的写法是这样，后面本地调试那节的 Dockerfile 用的就是它。

```dockerfile
ENV TZ=Asia/Shanghai \
    DEBIAN_FRONTEND=noninteractive
RUN ln -fs /usr/share/zoneinfo/${TZ} /etc/localtime \
    && echo ${TZ} > /etc/timezone \
    && dpkg-reconfigure --frontend noninteractive tzdata
```

`DEBIAN_FRONTEND=noninteractive` 不能省，`dpkg-reconfigure` 默认会弹一个选时区的交互菜单，构建过程没人按回车就一直卡着。

3. 重新构建容器镜像，使用新的镜像重新部署。或直接上传含新的 Dockerfile 的代码包重新部署

顺便说一句，改时区只解决了容器内部的显示问题。如果你的数据库是另一个服务，它自己也有时区设置，两边不一致同样会错。稳妥的做法是数据库统一存 UTC 时间戳，展示层再按用户所在时区转换，不过那是另一个话题了。

## 二、把服务部署上去

### 模板部署

先走模板，好处是不用准备任何代码就能把整条链路跑通，确认账号、环境、调用方式都没问题。

> 访问 https://cloud.weixin.qq.com/cloudrun/onekey

![云托管一键部署页面的模板列表](https://s.poetries.top/uploads/2022/06/faabdedf644f3e4e.png)

这个页面列的是各语言的模板，Node、Java、Go、PHP 都有。选跟你技术栈匹配的那个，选错了后面改起来还不如重来。

![选择要部署的小程序和环境](https://s.poetries.top/uploads/2022/06/938ddd4770eac635.png)

这一步要绑定小程序。云托管必须依附于一个已有的小程序或公众号，没有的话得先去注册一个，这是硬前提。绑定之后会创建一个环境，环境 ID 形如 `prod-xxxxxxx`，后面小程序端调用要用，记下来。

![模板部署的构建进度](https://s.poetries.top/uploads/2022/06/ea9d4e50eebbc2c7.png)

点确认之后平台开始构建。这里跑的就是模板自带的 Dockerfile，第一次构建要拉基础镜像，慢一点正常。

![部署完成后的服务详情页](https://s.poetries.top/uploads/2022/06/7fc8863ea615b727.png)

看到服务状态是运行中，并且给出了访问地址，就算部署成功了。这个地址是公网可访问的 HTTPS 地址，浏览器直接打开能看到模板的默认页面。

先在浏览器里访问一遍确认服务活着，再去小程序里调。这个顺序能帮你把「服务挂了」和「小程序调用姿势不对」两类问题分开。

**小程序/公众号中调用**

```js
// 在小程序 app.js中初始化云托管
onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'xxx', // 填入云托管环境ID
      })
    }
}

```

```js
// 在小程序中调用云托管服务
wx.cloud.callContainer({
  "config": {
    "env": "prod-xx" // 填入云托管环境ID
  },
  "path": "/api/count", // 云托管服务请求路径
  "header": {
    "X-WX-SERVICE": "express-4bnl" // 云托管服务名称
  },
  "method": "POST",
  "data": {
    "action": "inc" // 发起请求传入的参数
  }
})
```

这两段代码是小程序端接入的全部内容，看着简单，但有几个点第一次用一定会卡住。

`wx.cloud.init` 里的 `env` 和 `callContainer` 里 `config.env` 是两回事，前者是云开发环境，后者是云托管环境。这两套体系互相独立，环境 ID 不通用。如果你只用云托管不用云开发，`init` 里的 `env` 留空就行，别把云托管的 ID 填进去。

`X-WX-SERVICE` 这个请求头填的是**服务名**，不是环境 ID，也不是小程序 appid。填错的表现是请求直接失败并且报错信息比较含糊，我第一次就是把服务名和环境 ID 弄反了，查了半天。服务名在云托管控制台的服务列表里能看到，就是你新建服务时填的那个。

`callContainer` 走的是微信的内部链路，不经过公网。好处有两个，一是有微信侧的 DDoS 防护和链路加速，二是请求到达你的容器时，header 里会自动带上 `x-wx-openid` 这类身份信息，服务端不用做登录态校验就知道是谁在请求。这是云托管相对普通服务器最实在的一个便利。

### 自定义部署 Nestjs

模板跑通之后，换成自己的项目。

**初始化您的 Nest.js 项目**

```bash
npm i -g @nestjs/cli
nest new nest-app
```

在根目录下，执行以下命令在本地直接启动服务。

```
cd nest-app && npm run start
```

打开浏览器访问 http://localhost:3000，即可在本地完成 Nest.js 示例项目的访问。

本地能跑起来是上云的前提，别跳过这一步。云托管的构建日志虽然能看，但排查体验远不如本地，能在本地暴露的问题就别留到线上。

**新建服务**

![云托管控制台新建服务的入口](https://s.poetries.top/uploads/2022/06/d867bed19eb7d9ed.png)

这一步填的服务名，就是上面 `X-WX-SERVICE` 要用的值。建议起个跟仓库名一致的，好对应。

![配置服务的代码来源和版本信息](https://s.poetries.top/uploads/2022/06/a94985c89c5a77d0.png)

这一屏要配的是代码来源和 Dockerfile 路径。代码来源可以是本地上传的压缩包，也可以关联 Git 仓库做持续部署。Dockerfile 路径默认是根目录，你的项目要是把它放在别处得改。

还有几个容易漏的配置项在这一屏或者服务设置里：容器端口要跟你代码里 `listen` 的端口一致，Nest 默认 3000；环境变量在这里注入，数据库密码这类东西一律走这儿，不要写死在代码里；扩缩容的最小实例数如果设成 0，没有请求时实例会被回收，下次请求有冷启动，接受不了的话设成 1。

点击发布后，云托管会执行`Dockerfile`构建流水线，到日志可以查看构建进度

![流水线构建过程的实时日志](https://s.poetries.top/uploads/2022/06/28c702aebeea51f1.png)

这个日志就是 `docker build` 的输出，一层一层往下走。构建失败的话直接在这里定位是哪条指令挂的，最常见的是 `npm install` 拉包超时。

![构建完成后的版本列表](https://s.poetries.top/uploads/2022/06/e381ee973e6b0128.png)

每次发布是一个新版本，旧版本会保留。这个能力是自建服务器上要自己搭才有的，出问题可以把流量切回上一个版本，几秒钟就能回滚。灰度发布也是在这个列表上操作，给新版本分一部分流量，观察没问题再全量。

**微信云托管部署成功后，可以在实例列表，点击进入容器看到代码**，这里里面的内容不能修改，在容器启动后会覆盖

![实例列表中点击进入容器终端](https://s.poetries.top/uploads/2022/06/f29ea9c2ac74fac7.png)
![容器内部的项目文件结构](https://s.poetries.top/uploads/2022/06/a4a8d047a18b8846.png)

这两张图是进容器看文件。原文那句提醒特别重要，我展开说一下原因。

容器是无状态的，实例随时可能被回收重建。你在里面改了文件、装了个包，只对当前这个实例有效，实例一重建就全没了。而且扩容出来的新实例是从镜像创建的，压根没有你的改动，于是同一个服务的不同实例行为不一致，这种问题极难排查。

所以进容器只有一个正当用途，看现场。查日志、看进程、确认某个文件到底有没有被 COPY 进来。要改东西，改代码重新发布。

**调试接口**

![云托管控制台自带的接口调试面板](https://s.poetries.top/uploads/2022/06/71e72ba06d6335db.png)

控制台自带一个调试入口，能模拟小程序侧发起请求。比用 Postman 打公网地址强的地方在于，它会带上微信链路的 header，你能顺便验证 `x-wx-openid` 有没有正常传进来。

> [详细示例](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/quickstart/custom/node.html)

同一个 Nest 项目在自建服务器、云托管、serverless 三种方式下的部署差异，我在 [docker-compose/微信云托管/serverless 之部署 Nestjs 项目](https://feinterview.poetries.top/blog/nest-deploy-summary) 里做过横向对比，想看取舍的可以翻那篇。

## 三、CLI 工具

控制台点点点适合第一次上手，但要把部署接进 CI 就得靠命令行。

```
npm install -g @wxcloud/cli

wxcloud -h
```

**获取 CLI 密钥**

CLI工具的登录采用了密钥形式，在使用前需要前往[微信云托管控制台 - 设置 -CLI 密钥](https://cloud.weixin.qq.com/cloudrun/settings/other)生成，生成时需要账号管理员扫码，可以新建多个密钥，用于在不同地方使用。

「可以新建多个密钥」这一句建议照做。给 CI 一把、本地一把、同事各一把，某台机器出问题只吊销对应那一把就行，不用全员重配。密钥生成后只完整显示一次，当场存进 CI 的 secret 里。

传入微信 APPID 和CLI密钥，操作登录

```
wxcloud login [OPTIONS]
```

交互式执行的话它会依次问你要 appid 和密钥。放进 CI 脚本要走非交互模式，用 `--appid` 和 `--privateKey` 参数直接传，从环境变量里读值，别硬编码进 yml。

**查看登录账号下所有的环境列表**

```
wxcloud env:list [OPTIONS]
```

登录之后第一条建议跑的就是这个，能列出环境说明鉴权通了。列不出来基本是 appid 和密钥不匹配。

**查看指定环境下的所有服务列表**

```
wxcloud service:list [OPTIONS]
```

![wxcloud service:list 输出的服务列表](https://s.poetries.top/uploads/2022/06/32865ab6963c425e.png)

输出是一张表格，服务名、状态、版本这些都有。用这条命令在 CI 里做部署后的健康检查很方便，比调 HTTP 接口更直接。

除了这两条查询命令，CLI 还能部署服务、看日志、管配置。真正接 CI 的时候，核心就是「构建镜像加推送加部署」这几步，把它们串成一条流水线，push 代码自动上线。这套思路跟用 GitHub Actions 部署 Docker 镜像是一样的，我在 [基于 GitHub Actions 构建 Docker 镜像部署到腾讯云私有仓库](https://feinterview.poetries.top/blog/github-actions-tencent-docker-registry) 里写过完整的流水线配置，可以对照着改。

## 四、本地调试

部署跑通之后，接下来这一节我觉得是整篇里最有价值的部分。

云托管的服务和普通后端最大的差别是那些微信 header，`x-wx-openid` 这类信息只有走微信链路才有。如果本地调试拿不到这些，你就只能靠部署到线上再验证，一次循环好几分钟，效率极低。

微信提供的 VSCode 插件解决的就是这件事。它在本地起容器，同时起一个代理，让本地容器也能拿到模拟的微信信息，甚至能让微信开发者工具直接连到你本地的容器上。改一行代码几秒钟就能验证。

### 本地 docker 调试

- 安装[docker](https://docs.docker.com/get-docker/)
- 安装[微信开发者工具最新版](https://developers.weixin.qq.com/miniprogram/dev/devtools/stable.html)
- 安装vscode [Docker拓展](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)
- 在 VSCode 拓展栏搜索 weixin-cloudbase 然后安装

这四样缺一不可。特别提醒 Docker Desktop 必须是在运行状态，插件是通过本地 docker 守护进程干活的，docker 没起来插件面板会一片空白，而它不会明确告诉你原因。

**以koa作为后端演示**

全局安装 `koa-generator` 脚手架.

```
npm install -g koa-generator
```

创建项目

```
# 使用ejs引擎
koa2 -e wxcloud-debug-koa
```

```
cd wxcloud-debug-koa // 进入项目根目录
npm install // 安装项目依赖
```

- 修改`bin/www`中的端口为`9000`
- 修改`routes/index`中代码为

```js
router.get('/', async (ctx, next) => {
  ctx.body = {
    message: '请求头',
    header: ctx.header
  }
})
```

这个路由故意把整个 `ctx.header` 原样返回，是为了后面验证微信信息有没有注入进来。请求进来之后直接看返回的 header 里有没有 `x-wx-openid`，比在服务端打日志再去翻日志快得多。调试云托管的时候我一般都会留这么一个探针接口。

打开浏览器访问 http://localhost:9000，即可在本地完成 `koa` 示例项目的访问。

端口选 9000 不是随便定的，后面容器配置和端口映射都会用到这个值，改了别处也要跟着改。

**编写dockerfile**

```dockerfile
FROM daocloud.io/library/node:14.7.0

# 设置时区
ENV TZ=Asia/Shanghai \
    DEBIAN_FRONTEND=noninteractive
RUN ln -fs /usr/share/zoneinfo/${TZ} /etc/localtime && echo ${TZ} > /etc/timezone && dpkg-reconfigure --frontend noninteractive tzdata && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app

# 指定工作目录
WORKDIR /app

# 复制当前代码到/app工作目录
COPY . ./

# npm 源，选用国内镜像源以提高下载速度
RUN npm config set registry https://registry.npm.taobao.org/

# npm 安装依赖
RUN npm install

# 启动服务
CMD node app.js

EXPOSE 9000
```

> 如只在 VSCode 中同时编辑调试一个服务，`可直接打开服务代码目录作为根目录`（暂不支持 VSCode Workspace 工作区），保证根目录下有 `Dockerfile` 文件，插件面板中会显示该服务的名字

这一句里有两个硬条件。一是不能用 VSCode 的多根工作区，得直接打开服务目录；二是根目录必须有 Dockerfile，插件是靠它识别「这是一个云托管服务」的。

![VSCode 左侧 Docker 面板中识别出的服务](https://s.poetries.top/uploads/2022/06/66fece8795fb4d24.png)
![插件面板展开后显示的服务与容器节点](https://s.poetries.top/uploads/2022/06/ac09af2107358e03.png)

面板里能看到服务名就说明识别成功了。看不到的话按上面两个条件挨个排查，多数是打开的目录层级不对。

> 调试过程中因需要获取微信信息，会使用云托管 CLI Key，因此需在 VSCode 插件配置填入小程序 appid 和 cli key，点击插件面板的 ⚙ 图标打开配置：

![点击齿轮图标打开插件配置](https://s.poetries.top/uploads/2022/06/ce3c104e40011d61.png)

![在配置项里填入 appid 和 CLI 密钥](https://s.poetries.top/uploads/2022/06/9ae3be753faf6d15.png)

这里要的 CLI key 就是第三节生成的那个。填这个的原因是插件要代你去微信服务端换取模拟的用户信息，没有凭证换不到，那两个端口里带微信信息的那个就废了。

密钥填进 VSCode 配置之后会落在本地配置文件里，如果你的项目配置是提交进仓库的，注意别把它一起提交上去。

**构建镜像，启动容器**

右键服务名，选择 start，将构建镜像并启动容器

![右键服务名选择 start 启动容器](https://s.poetries.top/uploads/2022/06/fcd6a583112c5092.png)

这一下会触发本地的 `docker build`，用的就是你项目根目录那个 Dockerfile，跟云托管线上构建走的是同一份，所以本地验证过的镜像上云基本不会翻车。

可以看到构建过程

![VSCode 终端里输出的镜像构建过程](https://s.poetries.top/uploads/2022/06/edf9e52ecc8be079.png)

构建日志会在 VSCode 的终端里打出来，一层层的 `Step x/y`。第一次构建要拉基础镜像会慢，之后有层缓存就快了。

启动容器需要相应的容器配置信息（`.cloudbase/container/debug.json`），如果没有会提示创建，配置文件字段和含义如下：

![debug.json 的字段说明](https://s.poetries.top/uploads/2022/06/f012165c8689c0d7.png)

这个文件是本地调试专用的容器配置，插件会自动生成一份默认的，但默认值不一定对得上你的项目。

> 其中需特别注意端口号 `containerPort`、`Dockerfile` 路径 `dockerfilePath`、自定义环境变量 `envParams`

这三项里 `containerPort` 是最容易出问题的。它得跟你代码里实际监听的端口一致，默认值往往是 80 或者 3000，而我们的 koa 服务改成了 9000。对不上的表现是容器起来了但访问超时，因为插件在往一个没人监听的端口转发。

`envParams` 也提一句，本地调试要连数据库或者用到密钥的话都从这里注入，跟线上在控制台配环境变量是对应关系，两边保持字段名一致，代码里就不用写分支判断了。

此时出现异常，我们修改`.cloudbase/container/debug.json`中的`containerPort`为koa服务中定义的9000端口，重新构建即可

![启动失败时的报错提示](https://s.poetries.top/uploads/2022/06/45bf31849d1ea025.png)
![把 containerPort 改成 9000 后重新构建](https://s.poetries.top/uploads/2022/06/170ccb5736623b06.png)

这两张图就是上面说的端口对不上的现场和修法。改完 `debug.json` 要重新 start 一次，配置不会热生效。

容器构建和启动成功后，在插件面板状态 icon 会相应更新：

![插件面板中容器变为运行状态](https://s.poetries.top/uploads/2022/06/119ccbcb1b5bda86.png)

图标变成运行中的样子就对了。这个状态是插件轮询 docker 拿的，偶尔会有几秒延迟，别看到没变就急着重启。

也可以通过`docker ps`查看已启动的服务

![docker ps 命令输出的容器列表](https://s.poetries.top/uploads/2022/06/bffee56613a1852b.png)

用 `docker ps` 交叉验证一下更踏实。这里能看到容器名和端口映射，容器名的格式是 `wxcloud_` 加服务名，端口那一列会看到 27081 和 27082 这两个映射，下面马上会用到。

我们在云托管后台可以看到此时默认启动了一个调试服务，我们不要去修改它

![云托管控制台中自动创建的调试服务](https://s.poetries.top/uploads/2022/06/b9628146f2936d6d.png)

这个是插件在你的云托管环境里自动创建的，用来做微信信息的代理转发。看到多了个不认识的服务别慌，也别去删它或者改配置，删了本地调试的微信链路就断了。

> 此时可以请求容器了，在插件面板旁会展示两个端口号，通过第一个端口访问容器会带有微信相关信息（header 中包含 appid 等），通过第二个端口访问容器不会带有微信相关信息而是直接请求到容器内部，右键服务选择 Open in browser (via WX server) 和 Open in browser (no WX auth) 可以在浏览器中打开，分别对应这两种情况，也可以写代码或通过 POSTMAN 等工具请求

![插件面板中显示的两个调试端口](https://s.poetries.top/uploads/2022/06/08a189b22f22d644.png)

两个端口这个设计是本地调试的核心，值得说清楚。

27081 是直连端口，请求直接打到容器，不经过任何中转。27082 是微信端口，请求会先绕一圈微信的代理服务，回来时 header 里就带上了模拟的 `x-wx-openid`、`x-wx-appid` 这些字段。

那什么时候用哪个？调纯业务逻辑用 27081，快、稳、Postman 直接打。要验证跟微信身份相关的逻辑，比如「根据 openid 查用户」，就必须走 27082，不然你的代码永远拿不到 openid，只能自己造假数据，造出来的和真实的不一定一致。

**请求不经过微信服务器返回**：http://127.0.0.1:27081/

> 不带微信信息的端口，直接访问即可，适合在浏览器调试

![直连端口返回的 header 内容](https://s.poetries.top/uploads/2022/06/219c2a545a680211.png)

看返回的 header，都是常规的 `host`、`user-agent` 这些，没有任何 `x-wx-` 开头的字段。

**请求经过微信服务器返回**：http://127.0.0.1:27082/

> 微信端口，请求时会模拟微信用户信息的 Header，如 x-wx-openid，适合微信开发者工具中使用

![微信端口返回的 header 中包含 x-wx-openid](https://s.poetries.top/uploads/2022/06/61300f5e0ee71be1.png)

对比着看这张图，多出来的那几个 `x-wx-` 字段就是微信注入的。前面那个把 `ctx.header` 原样返回的探针路由，作用就在这里，一眼就能看出链路对不对。

**在微信开发者工具中，可以选择连接到 VSCode 启动的容器，从而在小程序模拟器中访问本地云托管容器**

> 此能力需要使用微信开发者工具 v1.05.2202242 及以上版本，并更新 VSCode 插件到 v1.0.12 以上。

这是本地调试里我最喜欢的一个能力。它让小程序模拟器里的 `wx.cloud.callContainer` 直接打到你本机的容器上，前后端可以同时改、同时看效果，不用部署。

版本要求那两个数字是 2022 年的，现在的版本早就超过了，正常更新到最新版就行。

**创建一个小程序测试项目**

![微信开发者工具中创建测试小程序项目](https://s.poetries.top/uploads/2022/06/0682d26a6cb9733d.png)

新建一个空白小程序项目就够了，只是拿来发请求。注意 appid 要用真实的，不能选测试号，因为云托管必须绑定真实小程序。

> 在 微信开发者工具 的 `Docker` 面板中，找到 「`Running Containers`」，右击容器名称，选择 `Attach Weixin Devtools`，即可在小程序代码中，使用 `wx.cloud.callContainer` 访问容器。

![在开发者工具中 Attach 到本地容器](https://s.poetries.top/uploads/2022/06/24939ce50c3f697d.png)

Attach 之后，开发者工具会把这个小程序的 `callContainer` 请求重定向到本地容器。这个状态是有粘性的，忘了 detach 直接去调线上服务，你会发现改了线上代码怎么都不生效，实际请求还打在本机。

需要退出再次`Detach Weixin Devtools`

![断开与本地容器的连接](https://s.poetries.top/uploads/2022/06/c7e521ee38851161.png)

调完记得断开。这一步很容易忘，我建议养成习惯，每次调试结束顺手 detach。

> 调用时，需要注意 `Header` 中的 `X-WX-SERVICE` 需要与容器名保持一致

这句是本节的最后一个坑。本地容器名是 `wxcloud_` 加服务名的形式，但 `X-WX-SERVICE` 里要填的是**服务名**部分，也就是你 VSCode 里打开的那个目录名，不带 `wxcloud_` 前缀。填错了请求转发不到，报错也不明显。

修改小程序`app.js`代码

```js
// app.js
App({
  onLaunch: async function () {
    await wx.cloud.init({
      // env: "其他云开发环境，也可以不填"    // 此处 init 的环境 ID 和微信云托管没有作用关系，没用就留空
    });
    const res = await wx.cloud.callContainer({
      config: {
        env: "prod-xx", // 微信云托管环境ID，不能为空，替换自己的
      },
      path: '/',
      method: 'GET',
      header: {
        'X-WX-SERVICE': 'wxcloud-debug-koa', // 替换成本地要调试的容器名称
      }
    });
    console.log(res); // 在控制台里查看打印
  }
})
```

![小程序控制台打印出的容器返回结果](https://s.poetries.top/uploads/2022/06/3c82a5b4cd77cb7e.png)

控制台里能看到 `res.data` 里就是 koa 返回的那个 header 对象，里面有 `x-wx-openid`。到这一步，小程序端到本地容器的完整链路就通了。

代码里那句注释值得注意：`wx.cloud.init` 的 `env` 跟微信云托管没有作用关系，没用就留空。前面提过这个，这里是原文自己也标出来了，说明确实是高频误区。

**查看请求日志**

![VSCode 插件面板中查看容器日志](https://s.poetries.top/uploads/2022/06/e789dfef49932c98.png)

插件面板里直接能看日志，这是最方便的方式，实时滚动。

或者通过`docker logs`查看

![docker logs 命令输出的容器日志](https://s.poetries.top/uploads/2022/06/9e869917426b77ad.png)

命令行看日志的好处是能配合 `grep`、`tail -f` 这些工具，日志量大的时候比在面板里翻实用。用法是 `docker logs -f 容器名`。

**进入终端**

> 如果需要进入到容器内部终端调试定位问题，可以右键服务名选择 Attach Shell 进入容器内终端

![Attach Shell 进入容器内部终端](https://s.poetries.top/uploads/2022/06/333fccccae7df026.png)

进容器主要用来确认两件事：文件到底有没有 COPY 进去、环境变量到底注入了没有。`ls` 和 `env` 两条命令能解决大部分「本地明明是对的」类问题。

注意这是本地调试容器，随便折腾没关系，跟线上那个「不要改」的规则不冲突。

### Live Coding 实时开发

前面那套流程有个不舒服的地方，改一行代码就要重新构建镜像加重启容器，几十秒起步。Live Coding 就是来解决这个的。

> 通过微信云托管 VSCode 插件，可以实现实时开发，即代码变动时，不需要重新构建和启动容器，即可查看变动后的效果。

**选择 Live Coding**

![右键容器选择 Live Coding](https://s.poetries.top/uploads/2022/06/34196636c57afd14.png)

> 右键点击需要调试的容器，选择 `Live Coding`，将自动生成 `Dockerfile.development` 和 `docker-compose.yml` 2 个文件并启动容器。

它的原理是把你的代码目录挂载进容器，再用 nodemon 这类工具监听文件变化自动重启进程。代码不在镜像里而在挂载卷里，所以改了立刻生效。

如果生成失败，我们需要自行配置

![自动生成配置文件失败的提示](https://s.poetries.top/uploads/2022/06/312e14d5e6ca8287.png)

自动生成是靠插件解析你的 Dockerfile 推断出来的，项目结构不标准的时候容易推断失败。下面两份文件就是手写版本，照着改就行。

**开发模式的 docker-compose.yml**

```yml
# 开发模式的 docker-compose.yml
# 实时开发将使用项目目录下的 docker-compose.yml 将当前目录映射到容器中。
# 大多数情况下，插件将根据项目的 Dockerfile 自动生成本文件，不需要手动编写。
version: '3'
services:
  app:
    build:
      context: . # 构建上下文
      dockerfile: Dockerfile.development
    volumes:
      - .:/app # 需要映射的目录（即代码目录）
      - /app/node_modules # 映射 node_modules 目录，如果有构建产物与代码目录同级，需要单独映射避免无法运行
    ports:
      - 27081:9000 # 监听端口，主机端口：容器端口 修改为koa服务端口
    container_name: wxcloud_wxcloud-debug-koa # 容器名称
    labels: # 容器标签，一般不需改动
      - wxPort=27082
      - hostPort=27081
      - wxcloud=wxcloud-debug-koa
      - role=container
    environment:
      # 使用本地调试 MySQL 时，需要填入如下环境变量，并启动 MySQL 代理服务
      - MYSQL_USERNAME=
      - MYSQL_PASSWORD=
      - MYSQL_ADDRESS=
networks:
  default:
    external:
      name: wxcb0 # 容器网络打通，一般不需改动
```

这份 compose 里有三处要盯住。

`volumes` 的第一条 `.:/app` 是把当前目录整个挂进容器，这就是实时生效的来源。第二条 `/app/node_modules` 是个匿名卷，作用是**保护容器里的 node_modules 不被宿主机的覆盖掉**。你本机装的依赖可能是 macOS 平台的二进制，直接盖进 Linux 容器里会跑不起来，加这一行之后容器用自己那份。注释里说的「如果有构建产物与代码目录同级，需要单独映射」也是同一个道理，`dist` 这类目录要照着加一条。

`labels` 那几个标签是给插件用的，`wxPort` 和 `hostPort` 对应前面说的 27082 和 27081 两个端口，插件靠它们识别这是哪个服务的调试容器。一般不用改。

`networks` 里的 `wxcb0` 是插件创建的外部网络，业务容器和微信代理容器挂在同一个网络下才能互通。这个名字写死就行。

修改端口 9000

```
ports:
  - 27081:9000 # 监听端口，主机端口：容器端口 修改为koa服务端口
```

冒号右边那个 9000 才是要改的，它是容器内服务监听的端口。左边的 27081 是插件约定的主机端口，别动。这里又是端口对不上的老问题，自动生成的默认值通常是 80，跟 koa 的 9000 对不上，容器起来了但访问不通。

**实时开发使用项目目录下的 Dockerfile.development**

```yml
# Dockerfile.development

# 实时开发使用项目目录下的 Dockerfile.development 作为开发期间的容器的 Dockerfile
# 大多数情况下，插件将根据项目的 Dockerfile 自动生成本文件，不需要手动编写。
# 开发模式的 Dockerfile 与正式模式的 Dockerfile 的区别在于：
# 单阶段构建
# 将编译命令转换为启动命令，如 Spring Boot 模板的 mvn package 会转换为 spring-boot:run
# 拉取实时开发的工具套件，安装到 /usr/bin 下
# 通过实时开发工具套件启动用户程序，在代码发生更改时，自动重启进程。

# Auto-generated by weixin cloudbase vscode extension
FROM ccr.ccs.tencentyun.com/weixincloud/wxcloud-livecoding-toolkit:latest AS toolkit
FROM node:lts-slim
COPY --from=toolkit nodemon /usr/bin/nodemon
# 设置时区
RUN ln -fs /usr/share/zoneinfo/${TZ} /etc/localtime && echo ${TZ} > /etc/timezone && dpkg-reconfigure --frontend noninteractive tzdata && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
# --only=production 只安装生产环境的依赖
RUN npm install --only=production && npm install pm2 -g
COPY . ./

# 修改nest启动入口 node bin/www
CMD [ "nodemon", "-x", "node bin/www", "-w", "/app", "-e", "java, js, mjs, json, ts, cs, py, go" ]
```

这份开发用的 Dockerfile 跟正式版有三个差别，注释里写得挺清楚，我补充解释一下为什么。

单阶段构建是因为不需要精简体积，开发镜像大一点无所谓，少一个阶段构建更快。

「把编译命令转换为启动命令」这条针对的是需要编译的语言，Java 那边 `mvn package` 换成 `spring-boot:run`。Node 项目要注意的是，用 TypeScript 的话（比如 Nest），`CMD` 里得启动 `ts-node` 或者带上 watch 编译，不能直接跑 `dist/main.js`，因为改了 `.ts` 源码 `dist` 不会自动更新。

最后那行 `nodemon -x "node bin/www" -w /app -e ...`，`-x` 是要执行的命令，`-w` 是监听目录，`-e` 是监听哪些扩展名。这个扩展名列表里如果没有你项目用的类型，改了文件不会重启，这也是一个容易困惑的点。

> 修改koa启动入口 `node bin/www`

![修改 Dockerfile.development 中的启动命令](https://s.poetries.top/uploads/2022/06/8a10761b7b5e317a.png)

模板里默认写的是 `node bin/www`，koa-generator 生成的项目入口正好是这个路径，Nest 项目的话要改成对应的入口文件。改错了容器起来就退出，日志里会有 `Cannot find module` 的报错。

**启动实时服务**

![Live Coding 容器启动成功](https://s.poetries.top/uploads/2022/06/27e38dab008bc840.png)

> 修改本地代码，不用重启容器即可查看效果

验证方式很简单，改一下路由返回的内容，保存，直接刷新浏览器。日志里能看到 nodemon 打出的 restarting 提示，一两秒的事。要是刷新了没变化，回去检查 `-e` 那个扩展名列表和 volumes 挂载路径。

我自己的用法是，日常改业务逻辑一直挂着 Live Coding，改了 Dockerfile 或者装了新依赖才切回正常模式重建一次镜像。

### 本地调试中使用「开放接口服务」

到这儿本地调试还差最后一块，云调用。业务代码里如果要调微信开放接口，本地是没有 `access_token` 的，这一节解决的就是这个。

- 在 VSCode 拓展栏搜索 `weixin-cloudbase` 然后安装
- 完成配置后，在左侧 `Docker` 面板内，右击 `Proxy nodes for VPC access` 中的 `api.weixin.qq.com`，点击启动（`Start`）
- 右击用户容器，点击启动（`Start`），容器内即可访问本地云调用

填入环境ID

![在插件配置中填入云托管环境 ID](https://s.poetries.top/uploads/2022/06/fb7e7d5bb09d2714.png)

这里的环境 ID 就是云托管控制台里那个 `prod-xxxxxxx`。填它是因为代理服务要开在你的云托管环境里，插件得知道开在哪。

启动`api.weixin.qq.com`服务

![启动 api.weixin.qq.com 代理节点](https://s.poetries.top/uploads/2022/06/00ae0c2d76672797.png)

启动之后，本地会多一个伪装成 `api.weixin.qq.com` 的容器，业务容器往这个域名发的请求会被它接住，转发到云端的代理，再由云端带着真实凭证去调微信接口。

启动自己的业务服务，在业务服务运行过程中，启动 vpc 中的 `api.weixin.qq.com` 服务

顺序上原文提了一句「在业务服务运行过程中」启动代理。我的经验是先起代理再起业务容器更稳，因为两者要在同一个 docker 网络里，业务容器先起来的话可能解析不到代理。真遇到调不通，把两个都停掉，按代理、业务的顺序重来一遍。

> 插件将会在你的云托管环境中开启一个代理服务，用于和本地 `api.weixin.qq.com` 服务，同时和业务服务共享同一个网络，就实现了本地的「开放接口服务」，需要注意，本地调试中只是模拟了业务服务的所处环境，不是真实的线上部署情况。

最后那句提醒别忽略。本地调试是模拟环境，跟线上不完全一样，尤其是网络策略和接口白名单。本地通了不代表线上一定通，正式发布前还是要在线上环境跑一遍。

## 五、云调用

> - [云调用](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/weixin/token.html)
> - [服务端接口](https://developers.weixin.qq.com/miniprogram/dev/api-backend/)

云调用是具有「免鉴权调用微信开放服务接口」特性的能力，是云开发/云托管中微信生态的一部分。

在云调用出现之前，微信开放服务接口的正常调用，需要开发者使用密钥信息获取`access_token`，并自己维护 `token` 的有效期和安全。而获取`access_token`，涉及到密钥交互请求，容易暴漏密钥导致被盗用，对开发者和微信服务都有消极的影响。

云调用主要打造免鉴权，也就是免密钥，全程不暴漏任何信息，开发者无需维护`access_token`，那对于接口请求的合法性判定，完全由与微信同链路的微信云托管参与实施。

### 配置云调用权限

前往[控制台 - 云调用 - 云调用权限配置](https://cloud.weixin.qq.com/cloudrun/openapi)，按照自己的业务需要配置接口。

比如你要在服务中调用文字安全检测接口

此接口的调用地址如下：`https://api.weixin.qq.com/wxa/msg_sec_check?access_token=ACCESS_TOKEN`

在配置时，只需要 `api.weixin.qq.com` 之后，`?`参数之前的部分，所以应该在配置输入框里填写如下

```
/wxa/msg_sec_check
```

这个填法规则要记牢，我见过不少人填错。不要带域名，不要带 `https://`，不要带问号后面的查询参数，就是中间那一段路径。填成 `https://api.weixin.qq.com/wxa/msg_sec_check` 是通不过的。

![云调用权限配置里添加接口白名单](https://s.poetries.top/uploads/2022/06/0fe1195da2601738.png)

配好之后列表里能看到这条路径。白名单是「按接口逐个放开」的机制，你调了没配的接口会被拒，报错信息不一定明确指向权限问题，所以每加一个新接口记得回来配一次。

这个设计其实挺合理的，等于给服务的对外调用能力做了最小权限约束，服务被攻破了攻击者也只能调你放开的那几个接口。

> 在云托管服务中，微信后台周期性的将开放接口所必须要的 `access_token`，推送到服务的容器实例中。在使用时只需要从容器本地读取令牌，就可以包装请求去调用了：

> `access_token` 推送的时间间隔为 `10` 分钟，令牌的有效期为 `30` 分钟； 挂载路径为：`/.tencentcloudbase/wx/cloudbase_access_token`； 在同一个环境中所有的容器实例，推送的 `access_token` 相同

这两个时间数字放在一起看就明白设计意图了。推送间隔 10 分钟、有效期 30 分钟，中间留了 20 分钟的重叠窗口。也就是说即使有一两次推送失败，手里的令牌也还没过期，容错空间足够。

由此推出一个实践上的注意点：**每次调用前从文件读一次，不要把 token 读到内存里长期缓存**。文件是被周期性覆盖的，你缓存在变量里的那份到点就失效了，表现是服务跑一段时间之后接口开始报 40001。读文件的开销可以忽略，别为这点性能省事。

> 接口调用凭证 https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/access-token/auth.getAccessToken.html

**查看容器内access_token**

![进入容器查看 access_token 挂载目录](https://s.poetries.top/uploads/2022/06/0ada5a6c6b6248c9.png)
![cat 出来的 access_token 内容](https://s.poetries.top/uploads/2022/06/b336245a70f0df92.png)

这两张图是进容器 `cat` 那个文件。这一步在排查云调用问题时很有用，能直接确认令牌到底有没有被推进来。文件不存在或者是空的，说明服务和微信侧的推送链路有问题，跟你的业务代码无关，先去查环境配置。

如果需要获取容器内的`access_token`调试接口，需要在接口中填入`cloudbase_access_token=容器内的access_token`

```js
// https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/weixin/token.html
const fs = require('fs')
const request = require('request')
// 容器内的access_token
const token = fs.readFileSync('/.tencentcloudbase/wx/cloudbase_access_token', 'utf-8')

return new Promise((resolve, reject) => {
  request({
    method: 'POST',
    // 可本地调试用cloudbase_access_token
    url: `https://api.weixin.qq.com/wxa/msg_sec_check?cloudbase_access_token=${token}`,
    body: JSON.stringify({
      openid: '用户的openid', // 可以从请求的 header 中直接获取 req.headers['x-wx-openid']
      version: 2,
      scene: 2,
      content: '安全检测文本'
    })
  },function (error, response) {
    console.log('接口返回内容', response.body)
    resolve(JSON.parse(response.body))
  })
})
```

这段是本地调试用的写法，理解它有助于看懂下一节的区别。本地没有令牌推送，所以要手动把从容器里 `cat` 出来的 token 拼进 URL 的 `cloudbase_access_token` 参数里。注意这个参数名跟常规的 `access_token` 不一样，是云托管专用的。

上线之后这个参数就不用填了，下一节会看到。

### 实例一，文字安全检测接口

```
npm i request request-promise -S
```

补一句现在的做法。`request` 这个包早就停止维护了，2022 年用它还行，现在新项目建议直接用 Node 内置的 `fetch`（Node 18 以上原生支持），或者 `axios`、`undici` 这些。下面的代码保留原样，改造起来不难，把 `rp({...})` 换成对应的调用方式就行。

[服务端接口地址](https://developers.weixin.qq.com/miniprogram/dev/framework/security.msgSecCheck-v1.html#HTTPS%20%E8%B0%83%E7%94%A8)

内容安全检测这个接口对小程序来说不是可选项。任何有用户输入并展示给他人的场景，比如评论、昵称、发帖，都要过一遍检测，这是审核硬性要求，不做会被驳回。

在代码`routes/home`中添加

```js
router.get('/msg_sec_check', async (ctx, next) => {
  let ACCESS_TOKEN = ''
  let data = await rp({
    method: 'POST',
    // 在云托管容器环境中，可以拿到access_token，而且免鉴权、这里不需要填写
    // https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/weixin/open.html
    // 这里填http协议、在云托管中不需要填access_token、需要在云托管-云调用中填写接口白名单前缀、开启侧边栏proxy代理后可以免输入本地调试
    uri: `http://api.weixin.qq.com/wxa/msg_sec_check`,
    body: {
      openid: ctx.header['x-wx-openid'],  // 用户的openid 可以从请求的 header 中直接获取 req.headers['x-wx-openid']
      version: 2,
      scene: 2,
      content: '安全检测文本'
    },
    json: true
  }).catch(error=>{
    ctx.body = {
      code: -1,
      message: error
    }
    throw error
  })
  ctx.body = {
    data,
    code: 200
  }
})
```

这段代码有三处值得注意，它们是云调用和普通接口调用的核心差别。

第一，`uri` 用的是 `http` 而不是 `https`。云托管的代理是在容器内部拦截这个域名的请求，走的是内网明文，加密由代理那一层负责。写成 `https` 反而会走公网直连，代理拦不住，token 也就注入不进去。

第二，URL 里没有任何 `access_token` 参数。`ACCESS_TOKEN` 那个变量声明了但是空的、也没用上，这正是「免鉴权」的样子。平台在转发时会把凭证补上去。

第三，`openid` 从 `ctx.header['x-wx-openid']` 取。这个字段是微信链路自动注入的，前面本地调试那节验证过。用它做用户身份是可靠的，比前端传上来的用户 ID 可信得多，前端传的东西永远要当成不可信输入。

在云托管权限控制台添加接口权限

![在云调用权限里添加 msg_sec_check 白名单](https://s.poetries.top/uploads/2022/06/4ebb3911f85d34fa.png)

这就是前面说的白名单，填 `/wxa/msg_sec_check`。漏了这一步，代码写得再对也调不通。

开启 `api.poetries.top` 本地调试服务

![启动本地调试的接口代理服务](https://s.poetries.top/uploads/2022/06/528449d25dd3fe4b.png)

这一步就是上一节说的 `api.weixin.qq.com` 代理。本地调试必须先起它，否则容器里发往 `api.weixin.qq.com` 的请求会真的走公网出去，然后因为没带凭证被拒。

通过微信服务器模拟小程序请求

![通过 27082 微信端口发起请求](https://s.poetries.top/uploads/2022/06/2599830982d2a3f9.png)
![文字安全检测接口返回的检测结果](https://s.poetries.top/uploads/2022/06/d0513c38eda2f996.png)

第一张是发起请求，走的是 27082 那个带微信信息的端口。第二张是返回结果，`errcode` 为 0 表示内容合规。

这里要提醒一下返回值的判断方式。这个接口是靠 `errcode` 区分结果的，不要只判断 HTTP 状态码，内容违规时 HTTP 也是 200，只是 `errcode` 不同。另外 v2 版本的接口返回结构和 v1 不一样，代码里 `version: 2` 指定了版本，解析时要按对应版本的文档来。

也可以在小程序中访问

![小程序端调用文字检测接口的返回](https://s.poetries.top/uploads/2022/06/b662201bc3f48b26.png)

最后从小程序端走一遍完整链路，小程序到云托管容器到微信开放接口，这条路通了才算真的验证完。

### 实例二，调用小程序云函数

[接口地址](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-http-api/functions/invokeCloudFunction.html)

这个场景挺实用的。很多项目是从云开发起步的，业务逻辑都在云函数里，后来主服务迁到了云托管，总不能把云函数全部重写一遍。云调用允许云托管的服务反过来调云开发的云函数，两套体系就能共存了。

在代码`routes/home`中添加

```js
// 云托管内调用云函数
router.get('/call-fn-banner', async (ctx, next) => {
  const ACCESS_TOKEN = ''
  const weappEnvId = 'poetry-prod-6gj3fpxa137552a6' // 小程序云开发envId
  const data = await rp({
    method: 'POST',
    // 在云托管容器环境中，可以拿到access_token，而且免鉴权、这里不需要填写
    // https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/weixin/open.html
    // 这里填http协议、在云托管中不需要填access_token、需要在云托管-云调用中填写接口白名单前缀、开启侧边栏proxy代理后可以免输入本地调试
    uri: `http://api.weixin.qq.com/tcb/invokecloudfunction?env=${weappEnvId}&name=banner`,
    body: {
      $url: 'queryBanner',
      ...ctx.request.query
    },
    json: true
  }).then(async res=>{
    console.log('callCloudFn res', res)
    if(res && res.errcode === 40001) {
      throw error
    }
    let data = res.resp_data ? JSON.parse(res.resp_data) : {}

    return data
  }).catch(error=>{
    ctx.body = {
      code: error.errcode,
      message: error.errmsg
    }
    throw error
  })

  ctx.body = data
})
```

这段比上一个例子复杂，拆开看几个点。

`weappEnvId` 是**云开发**的环境 ID，不是云托管的。这两套环境 ID 长得很像，都是 `xxx-prod-` 加一串随机字符，非常容易搞混。填错的表现是接口返回找不到环境。

URL 里 `?env=` 和 `&name=` 两个参数，前者指定云开发环境，后者是云函数名，这里调的是 `banner` 这个函数。

`body` 里的 `$url: 'queryBanner'` 是给 `tcb-router` 用的。云函数里如果用了路由库，一个云函数可以承载多个子路由，`$url` 就是路由标识。没用路由库的话这个字段不需要。

错误处理这块要注意 `errcode === 40001`。这个错误码的含义是 `access_token` 无效，在云调用场景下出现它，多半是白名单没配、或者环境 ID 填错，而不是真的令牌过期，别顺着令牌的方向去查。

`res.resp_data` 是云函数返回值的**字符串形式**，所以要 `JSON.parse` 一下。这个包装是 HTTP 调用云函数接口的规范，跟小程序端 `wx.cloud.callFunction` 直接拿到对象不一样，第一次用容易在这里卡住。

小程序云函数banner代码

![云开发控制台中的 banner 云函数](https://s.poetries.top/uploads/2022/06/cabf11a53af60f09.png)

这是被调用的那个云函数，在云开发控制台里能看到它的代码和调用记录。下面是它的完整实现。

```js
// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'poetry-prod-xx' // 环境ID
})

const TcbRouter = require('tcb-router')

const db = cloud.database()
const bannersCollection = db.collection('banners') // banners集合

// 云函数入口函数
exports.main = async (event, context) => {
  const app = new TcbRouter({event})

   // banner列表
   app.router('queryBanner', async (ctx,next)=>{
     const {pageSize = 20, pageNum = 1, orderBy, sort} = event
     try {
        let data = await bannersCollection.skip(Number((pageNum - 1)*pageSize)).limit(Number(pageSize)).orderBy(orderBy || 'createTime', sort || 'desc').get().then(res=>res.data)
        let {total} = await bannersCollection.count()
        ctx.body = {
          message: '查询成功',
          code: 200,
          data: {
            list: data,
            total,
            pageSize,
            pageNum
          }
        }
     } catch (error) {
        ctx.body = { message: error, code: -1 }
      }
  })

  return app.serve()
}
```

这个云函数里 `TcbRouter` 的用法值得看一眼。`app.router('queryBanner', ...)` 注册了一个子路由，对应前面 `$url` 传的值。用它的好处是不用为每个查询都建一个云函数，云函数数量有配额，多了也不好管理。

分页那段 `skip(Number((pageNum - 1) * pageSize)).limit(Number(pageSize))` 是标准写法，两处 `Number()` 转换不能省，因为参数是从外部传进来的字符串。`orderBy(orderBy || 'createTime', sort || 'desc')` 给了默认值，调用方不传也能工作，这个习惯挺好的。

在云托管权限控制台添加接口权限

![在云调用权限里添加 invokecloudfunction 白名单](https://s.poetries.top/uploads/2022/06/4015858c85719a6a.png)

这次要配的路径是 `/tcb/invokecloudfunction`。每个新接口都要单独配一遍，前面配过的 `msg_sec_check` 对这个不生效。

开启 `api.poetries.top` 本地调试服务

![启动本地调试的接口代理服务](https://s.poetries.top/uploads/2022/06/528449d25dd3fe4b.png)

跟上一个例子一样，本地调试要先起代理。这张图重复出现是因为每个例子的验证流程都要走这一步。

通过微信服务器模拟小程序请求

![通过微信端口发起调用云函数的请求](https://s.poetries.top/uploads/2022/06/2599830982d2a3f9.png)
![云函数返回的 banner 列表数据](https://s.poetries.top/uploads/2022/06/7629d70d78672b4e.png)

第二张图里能看到 banner 列表和 total，说明云函数被成功调用、数据库查询也正常。这条链路比上一个例子长，容器到微信开放接口到云开发再到云函数和数据库，任何一环出问题都会失败。所以出错时建议倒着排查，先在云开发控制台直接测云函数，确认它自己是好的，再往前查。

也可以在小程序中访问

![小程序端拿到 banner 数据](https://s.poetries.top/uploads/2022/06/0b93736939cab19a.png)

### 实例三，获取小程序码

[接口地址](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/qr-code/wxacode.get.html#HTTPS%20%E8%B0%83%E7%94%A8)

第三个例子跟前两个有个关键区别，它返回的是**二进制图片数据**而不是 JSON。这一点会带来额外的处理，下面代码里正好有个坑。

在代码`routes/home`中添加

```js
// 云托管内获取小程序码
router.get('/getweappCode', async (ctx, next) => {
  let ACCESS_TOKEN = ''
  let buffer = await rp({
    method: 'POST',
    // 在云托管容器环境中，可以拿到access_token，而且免鉴权、这里不需要填写
    // https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/weixin/open.html
    // 这里填http协议、在云托管中不需要填access_token、需要在云托管-云调用中填写接口白名单前缀、开启侧边栏proxy代理后可以免输入本地调试
    uri: `http://api.weixin.qq.com/wxa/getwxacode`,
    body: {
      path: '/pages/article/index'
    },
    json: true
  }).catch(error=>{
    ctx.body = {
      code: -1,
      message: error
    }
    throw error
  })
  ctx.body = {
    data: buffer,
    code: 200
  }
})
```

这段代码里有个问题得指出来。`json: true` 这个选项会让 `request-promise` 把响应体按 JSON 解析，但 `getwxacode` 返回的是 PNG 图片的二进制流，按 JSON 解析会直接得到乱码或者抛错。正确的做法是设 `encoding: null` 拿到原始 Buffer，然后转成 base64 返回，或者直接把 Buffer 写回响应体并设好 `Content-Type`。

```js
let buffer = await rp({
  method: 'POST',
  uri: `http://api.weixin.qq.com/wxa/getwxacode`,
  body: JSON.stringify({ path: '/pages/article/index' }),
  encoding: null   // 关键：拿原始二进制，不要按 JSON 解析
})
ctx.type = 'image/png'
ctx.body = buffer
```

还有个容易忽略的点，这个接口出错时返回的**又是 JSON** 而不是图片。所以拿到 Buffer 之后要判断一下开头几个字节，如果是 `{` 说明是错误响应，得解析出来看 `errcode`。不判断的话前端会拿到一张打不开的图片，而你在服务端日志里什么都看不到。

另外提一句 `getwxacode` 和 `getwxacodeunlimit` 的区别。前者生成的码总数有上限（几万个量级），适合固定页面；后者数量不限但只能带一个 `scene` 参数。做分享海报这种每个用户一张码的场景，要用后者。

在云托管权限控制台添加接口权限

![在云调用权限里添加 getwxacode 白名单](https://s.poetries.top/uploads/2022/06/f3bd515a0476f6bc.png)

第三次配白名单，路径是 `/wxa/getwxacode`。三个例子三条白名单，这个规律应该很清楚了。

开启 `api.poetries.top` 本地调试服务

![启动本地调试的接口代理服务](https://s.poetries.top/uploads/2022/06/528449d25dd3fe4b.png)

老规矩，本地调试先起代理。

通过微信服务器模拟小程序请求

![通过微信端口请求获取小程序码](https://s.poetries.top/uploads/2022/06/2599830982d2a3f9.png)

也可以在小程序中访问

![小程序端展示出生成的小程序码](https://s.poetries.top/uploads/2022/06/426afbcda167a0d1.png)

能看到图渲染出来，说明二进制的传递链路是通的。小程序端展示的话，接口返回 base64 字符串，`image` 组件的 `src` 直接给 `data:image/png;base64,` 加内容就能显示。

关于界面的时效性说明放在这里。微信云托管控制台从 2022 年到现在改版过几次，云调用权限配置、CLI 密钥、环境管理这些入口的位置都跟图里不完全一样了，VSCode 插件的面板布局也调整过。但核心概念一个都没变：白名单按路径配、令牌挂在 `/.tencentcloudbase/wx/cloudbase_access_token`、调用用 `http` 协议且不带 token、两个调试端口分别对应带不带微信信息。按这些逻辑找，具体位置以你打开时的实际界面为准。

## 总结

微信云托管这套东西，我用下来的感受是它把「后端服务」和「微信生态」之间那段最烦的胶水代码给消掉了。

部署这块没什么好说的，给它一个 Dockerfile 就行，本地 `docker build` 能过基本就能上云。要留意的是三件事：服务必须无状态，实例随时会被重建；容器时区默认 UTC，Dockerfile 里要改；进容器改文件没有意义，改代码重新发布。

`callContainer` 那几个字段最容易配错，`X-WX-SERVICE` 填服务名、`config.env` 填云托管环境 ID、`wx.cloud.init` 里的 `env` 是云开发的没用就留空。这三个我第一次全填错过。

本地调试是这套工具链里最值的部分。27081 直连、27082 带微信信息，调纯逻辑用前者，验证 openid 相关的用后者。`debug.json` 里 `containerPort` 一定要跟代码里监听的端口对上，这是我踩过最多次的坑。Live Coding 挂上之后改代码秒生效，日常开发一直开着就行。

云调用的心智模型很简单：路径进白名单、URL 用 `http`、不带 token、`openid` 从 header 取。三个实例都是这个套路，接口换一下而已。唯一的例外是返回二进制的接口，别忘了 `encoding: null`。

至于该不该选云托管，我的判断是：后端是独立工程、用了正经框架、或者根本不是 Node，选云托管；只是几个增删改查函数、一个人做，云开发更快。两者也不是互斥的，第六节那个例子就是云托管调云开发的云函数，老代码可以慢慢迁。

## 参考

- [微信云托管开发者文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/basic/intro.html)
- [CLI工具](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/cli/)
- [本地调试](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/debug/)
- [云调用与 access_token](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/weixin/token.html)
- [wx.cloud.callContainer API](https://developers.weixin.qq.com/miniprogram/dev/api/cloud/container/Cloud.callContainer.html)
- [小程序服务端接口文档](https://developers.weixin.qq.com/miniprogram/dev/api-backend/)
- [云托管官方GitHub](https://github.com/WeixinCloud)
- [tencent云开发知识库首页](https://cloudbase.vip/kw/)
- [微信学堂快速上手微信云托管](https://developers.weixin.qq.com/community/business/course/00068c2c0106c0667f5b01d015b80d)
- [微信云托管学习路径](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/quickstart/plan/real.html)
- [前端进阶之旅](https://interview.poetries.top)
