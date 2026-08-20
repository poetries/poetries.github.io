---
title: 前端异常监控平台之Sentry落地
description: Sentry 从私有化部署到前端接入的完整落地记录，含 onpremise 一键部署踩坑、Vue2/Vue3 Vite/React umi 三套 SDK 接入、sourceMap 上传配置、面包屑与 Performance 面板，以及 setUser、rrweb 录屏、报警规则等进阶用法。
date: 2022-07-27 20:40:43
tags:
  - 前端监控
  - Sentry
  - Docker
categories: Front-End
---

线上出问题的时候，最难受的不是修不好，是不知道出了什么问题。用户截了张白屏的图发过来，你问他点了什么、什么浏览器、什么时候发生的，他说不清楚。你本地怎么点都复现不了。

Sentry 解决的就是这件事。它把线上抛出的每一个异常连同发生时的上下文一起收集回来，报错堆栈、用户操作路径、浏览器版本、当时的路由，全都有。配上 sourceMap 之后，压缩过的 `a.b.c is not a function` 能还原到你源码的具体某一行。

这篇是我把 Sentry 从零落到项目里的完整记录。包括自己在服务器上私有化部署整套服务，以及 Vue2、Vue3 加 Vite、React 加 umi 三套项目分别怎么接入、sourceMap 怎么传。踩过的坑我都标出来了，尤其是 sourceMap 那部分，配错一个字符就前功尽弃。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Sentry 的架构长什么样，为什么它比自己写个 `window.onerror` 上报强
- 官方 SaaS 和私有化部署怎么选，各自的代价是什么
- 用 `onpremise` 一键脚本部署整套 Sentry 的完整流程和前置条件
- Vue2 项目接入 `@sentry/vue`，以及 `tracesSampleRate` 该设多少
- sourceMap 上传的两条路，以及 `urlPrefix` 为什么是最容易配错的那一项
- sourceMap 传完之后必须从生产产物里删掉，三种删法
- Vue3 加 Vite 和 React 加 umi 两套配置的差异
- `setUser`、错误边界、rrweb 录屏回放、报警规则这几个进阶能力

## 一、先搞清楚 Sentry 是什么

> `Sentry` 是一套开源的实时的异常收集、追踪、监控系统。这套解决方案由对应各种语言的 SDK 和一套庞大的数据后台服务组成，通过 Sentry SDK 的配置，还可以上报错误关联的版本信息、发布环境。同时 Sentry SDK 会自动捕捉异常发生前的相关操作，便于后续异常追踪。异常数据上报到数据服务之后，会通过过滤、关键信息提取、归纳展示在数据后台的 Web 界面中

> - Github: https://github.com/getsentry/sentry
> - 文档 https://docs.sentry.io/

这段介绍里最值得展开的是「自动捕捉异常发生前的相关操作」。

很多团队做异常监控的第一版都是自己在入口挂个 `window.onerror` 加 `unhandledrejection`，把错误信息 POST 到自家接口。这套东西能跑，但你拿到的只有一条错误消息和一个堆栈，然后就没了。用户在报错前点了哪几个按钮、发了哪几个请求、路由从哪跳到哪，全是空白。

Sentry 的 SDK 会在后台记录这些行为，叫做面包屑（Breadcrumbs）。异常发生的那一刻，它把最近的一串操作记录和错误一起打包上报。你在后台看到的不是一个孤立的错误，而是一条完整的时间线。这是自研方案很难补齐的部分。

我一直觉得，前端监控这件事真正的门槛不在采集，在于把采集到的东西组织成能定位问题的形态。Sentry 值钱的地方在后面这一半。

**支持如下语言**

![Sentry 支持的语言与框架 SDK 列表](https://s.poetries.top/uploads/2022/07/bb6538297dd29493.png)

这张图看一眼就行，重点是 Sentry 不只是前端工具。同一套后台可以同时接前端 JS、Node 服务、Python、Java、移动端，错误按项目区分。前后端在同一个平台看错误，联调时对时间线会方便很多。

**sentry功能架构**

![Sentry 的功能架构图](https://s.poetries.top/uploads/2022/07/ea60de5188aaa2a1.png)

功能层面从左到右是采集、处理、存储、展示、告警这几块。你在前端只需要关心最左边那一段，SDK 负责采集和上报，剩下的都是服务端的事。

**sentry核心架构**

![Sentry 的核心服务架构图](https://s.poetries.top/uploads/2022/07/31d57c95765101aa.png)

这张图才是私有化部署要看的。图里那些 relay、kafka、ClickHouse、Postgres 就是后面部署时会拉起来的一堆容器。先看一眼有个印象，等下 `docker-compose ps` 打出来二十多个服务的时候就不会懵。

## 二、用官方 SaaS 还是自己部署

### 官方 Sentry 服务

> sentry是开源的，如果我们愿意付费的话，sentry给我们提供了方便。省去了自己搭建和维护 Python 服务的麻烦事

登录官网 https://sentry.io 注册账号后接入sdk即可使用

![sentry.io 官网注册后的控制台](https://s.poetries.top/uploads/2022/07/5db080cc6f487560.png)

注册完直接创建项目、拿 DSN、接 SDK，五分钟能跑通。官方有免费额度，个人项目和小团队试水完全够用。

那什么时候需要自己部署？我的判断标准就两条。一是数据不能出境，很多公司的合规要求卡这一条，那就只能自建。二是量大到免费额度撑不住，而付费又不划算。

除此之外我会优先选 SaaS。自建的隐性成本比想象中高很多，下面就知道了。

### Sentry 私有化部署

> Sentry 的管理后台是基于 `Python Django` 开发的。这个管理后台由背后的 Postgres 数据库（管理后台默认的数据库）、`ClickHouse`（存数据特征的数据库）、relay、kafka、redis 等一些基础服务或由 Sentry 官方维护的总共 23 个服务支撑运行。可见的是，如果独立的部署和维护这 23 个服务将是异常复杂和困难的。幸运的是，官方提供了基于 docker 镜像的一键部署实现 [getsentry/onpremise](https://github.com/getsentry/self-hosted)

23 个服务这个数字要认真对待。它意味着这台机器以后就是专门跑 Sentry 的，别指望顺便再跑点别的。

sentry 本身是基于 Django 开发的，而且也依赖到其他的如 Postgresql、 Redis 等组件，所以一般有两种途径进行安装：通过 Docker 或用 Python 搭建

Python 那条路我劝你别走，依赖版本对齐能耗掉一整天。老老实实用 Docker。

**前置环境**

> 需要安装对应版本，否则安装会报错

- `Docker 19.03.6+`
- `Docker-Compose 1.28.0+`
- `4 CPU Cores`
- `8 GB RAM`
- `20 GB Free Disk Space`

这四行是硬门槛，尤其是内存那条。8G 是**最低**要求不是推荐值，我拿 4G 的机器试过，`install.sh` 能跑完，但启动之后 ClickHouse 和 kafka 会互相抢内存，容器不断被 OOM kill 再重启，后台页面点两下就 502。别省这个钱。

磁盘 20G 也只是起步，Sentry 会持续写事件数据，跑一段时间之后要么加盘要么配数据保留策略。

## 三、私有化部署的完整流程

### 安装 docker 环境

安装工具包

```
yum install yum-utils device-mapper-persistent-data lvm2 -y
```

![yum 安装 docker 依赖工具包](https://s.poetries.top/uploads/2022/06/e0f4f8f2621b11c0.png)

`yum-utils` 提供了下一步要用的 `yum-config-manager` 命令，另外两个是存储驱动的依赖。这一步基本不会出问题。

设置阿里镜像源

```
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

![添加阿里云 docker-ce 软件源](https://s.poetries.top/uploads/2022/06/0b017f9a76914c6e.png)

执行完会在 `/etc/yum.repos.d/` 下生成一个 `docker-ce.repo`。这里换的是**下载 docker 程序**的源，跟下一节的镜像加速不是一回事。

安装docker

```
yum install docker-ce docker-ce-cli containerd.io -y
```

装完检查一下版本，`docker --version` 输出必须满足前面说的 19.03.6 以上。CentOS 自带源里的 `docker` 包版本很老，这也是为什么要先换阿里源再装。

启动docker

```bash
systemctl start docker

# 设为开机启动
systemctl enable docker
```

`enable` 那行别漏，服务器重启之后 Sentry 全套服务要能自己起来。

### 镜像加速这一步不能跳

**docker 镜像加速（重要）**

> 在后续部署的过程中，需要拉取大量镜像，官方源拉取较慢，可以修改 docker 镜像源

原文标了「重要」两个字，我再加重一下。Sentry 这套要拉二十多个镜像，总体积好几个 G。不配加速的话，`install.sh` 很可能在拉镜像那一步卡到超时然后失败，而失败之后重跑又要从头再来一遍。这是整个部署流程里最耗时间也最容易崩的一环。

登录阿里云官网，打开 [阿里云容器镜像服务](https://cr.console.aliyun.com)。点击左侧菜单最下面的 `镜像加速器` ，选择 `Centos`

![阿里云容器镜像服务的镜像加速器页面](https://s.poetries.top/uploads/2022/07/48ed424be7911056.png)

这个页面会给你一个专属的加速地址，形如 `https://xxxxxxxx.mirror.aliyuncs.com`，每个账号不一样。别抄别人博客里的地址，那些多半已经失效了。

```
vi /etc/docker/daemon.json
```

```json
{
  "registry-mirrors": ["https://l6of9ya6.mirror.aliyuncs.com"]
}
```

把里面那串换成你自己的。这个文件如果原来不存在，直接新建就行；如果已经有内容，注意保持 JSON 合法，多一个逗号 docker 就起不来了。

然后重启docker即可

```bash
# 重新加载配置
systemctl daemon-reload

# 重启docker
systemctl restart docker
```

改完一定要验证。`docker info` 的输出末尾有一段 `Registry Mirrors`，你配的地址出现在那里才算生效。这个我踩过，改完没验证直接跑安装脚本，等了四十分钟发现镜像一个都没下下来，回头才看到 JSON 格式写错了 docker 压根没加载。

### 安装 docker-compose

**安装docker-compose**

```bash
# 使用国内源安装
sudo curl -L "https://get.daocloud.io/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```

注意这里下的是 1.29.2，前置条件要求 1.28.0 以上，这个版本是满足的。

**设置docker-compose执行权限**

```
chmod +x /usr/local/bin/docker-compose
```

**创建软链**

```
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```

**测试是否安装成功：**

```
$ docker-compose --version

docker-compose version 1.29.2, build 5becea4c
```

这里要提醒一下，原文这段输出贴的是 `1.22.0`，跟上面下载的 1.29.2 对不上，应该是从别的笔记里复制过来忘了改。真跑出 1.22.0 的话说明你系统里还有个旧版本抢在 `PATH` 前面，得先把它清掉，因为 1.22.0 不满足 Sentry 的前置要求，`install.sh` 会在环境检查那一步直接拒绝。

### 一键部署

```
git clone https://github.com/getsentry/onpremise
```

这个仓库名后来改成了 `self-hosted`，GitHub 会自动重定向，所以上面这条命令现在还能用，但新拉的话建议直接用 `git clone https://github.com/getsentry/self-hosted`。另外强烈建议 `git checkout` 到一个明确的版本 tag 再装，直接用主干代码容易碰上尚未稳定的改动。

> 在 `onpremise` 的根路径下有一个 `install.sh` 文件，只需要执行此脚本即可完成快速部署，脚本运行的过程中，大致会经历以下步骤：

- 环境检查
- 生成服务配置
- `docker volume` 数据卷创建（可理解为 `docker` 运行的应用的数据存储路径的创建）
- 拉取和升级基础镜像
- 构建镜像
- 服务初始化
- 设置管理员账号（如果跳过此步，可手动创建）

这七步里，卡人的是第四步拉镜像和第六步服务初始化。前者靠镜像加速，后者靠内存。

```bash
cd onpremise

# 直接运行 ./install.sh 将 Sentry 及其依赖都通过 docker 安装
./install.sh
```

后续一步一步安装下来

![install.sh 执行过程中的输出](https://s.poetries.top/uploads/2022/07/ec9447e63222462a.png)

这个脚本一跑就是几十分钟，中间不要中断。建议挂在 `screen` 或者 `tmux` 里跑，SSH 断了脚本还在，不然网络一抖整个过程白费。

设置管理员账号（如果跳过此步，可手动创建）

![安装过程中提示创建管理员账号](https://s.poetries.top/uploads/2022/07/c960c51703ae0a14.png)

这一步会让你输邮箱和密码，输入密码时终端不回显，看着像卡住了其实是正常的，直接敲完回车。这个账号就是后面登录后台的超级管理员，记牢。

跳过了也不要紧，后面可以用 `docker-compose run --rm web createuser` 补建。

### 启动并访问

在执行结束后，会提示创建完毕，运行 `docker-compose up -d` 启动服务

![安装完成的提示信息](https://s.poetries.top/uploads/2022/07/751ff76231406eec.png)

看到这个提示才算装完。注意 `install.sh` 只是把镜像和配置准备好了，服务并没有启动，还得手动拉起来。

```
docker-compose up -d
```

![docker-compose up -d 启动全部 Sentry 服务](https://s.poetries.top/uploads/2022/07/5fe231a45329b6bf.png)

这一屏会刷出二十多行 `Creating`，对应的就是前面架构图里那些服务。启动也需要时间，`up -d` 命令返回不代表服务可用了，ClickHouse 和 kafka 初始化要好几分钟。

查看服务运行状态`docker-compose ps`

![docker-compose ps 查看所有服务状态](https://s.poetries.top/uploads/2022/07/d00aa7e4b2070d77.png)

这一步是最有用的排查手段。所有服务都应该是 `Up`，如果有 `Exit` 或者反复 `Restarting` 的，用 `docker-compose logs <服务名>` 去看具体原因。

按我的经验，最常挂的是 `clickhouse` 和 `kafka`，原因基本都是内存不够。`free -h` 看一眼可用内存，如果剩不到 1G，那就是它了。

### 访问后台

> 所有服务都启动成功后,就可以访问`sentry`后台了,后台默认运行在服务器的`9000`端口,这里的`账户密码就是安装时让你设置`的那个

![Sentry 后台登录页](https://s.poetries.top/uploads/2022/07/e714d0cdfa38438d.png)

访问 `http://服务器IP:9000`。打不开的先查两件事，一是安全组有没有放行 9000 端口，二是 `docker-compose ps` 里的 web 服务是不是真的起来了。

顺带说一句，9000 是个很常用的端口，跟前面那篇里 Nest 服务的端口撞了。同一台机器上跑多个东西的时候要留意，Sentry 的端口可以在 `docker-compose.yml` 里改。

![Sentry 后台首页的项目列表](https://s.poetries.top/uploads/2022/07/26405ca96fbdf205.png)

登进来就是这个样子，左侧是导航，中间是 Issues 列表，现在还是空的。接下来要做的是创建一个项目拿到 DSN，然后去前端接 SDK。

### 设置语言和时区

点击头像`User settings - Account Details`的相应菜单设置，刷新后生效

![账号设置里的语言和时区选项](https://s.poetries.top/uploads/2022/07/d86d96288fe1ea13.png)

时区这一项建议第一时间就改。默认是 UTC，跟用户反馈的时间对不上，排查问题时你会不停地在脑子里做加减 8 小时的换算，特别容易出错。改完刷新页面才生效，别以为没改上。

界面这块补一句时效性说明。Sentry 的后台从 2022 年到现在改版过好几次，导航结构、设置页的层级、创建项目的引导流程都跟图里不完全一样了。整体的概念模型没变，还是「组织 > 团队 > 项目」这三层，DSN 依然在项目设置的 Client Keys 里，按这个逻辑找就行。

## 四、Vue2 项目接入 Sentry

服务端有了，接下来把前端接上去。

### 创建一个vue项目

```bash
npm i @vue/cli -g

# 初始化vue2项目
vue create vue2-sentry
```

### 接入sentry

![Sentry 后台的 Vue SDK 接入引导页](https://s.poetries.top/uploads/2022/07/c4137ad12fdccfbd.png)

在后台创建项目时选 Vue，它会直接给你一段带 DSN 的初始化代码，照抄就行。这个引导页是最省事的入口，比翻文档快。

```bash
# Using npm
npm install --save @sentry/vue @sentry/tracing
```

这里装了两个包。`@sentry/vue` 是 Vue 适配的 SDK，`@sentry/tracing` 提供性能追踪能力。补一句现在的情况，后来的 SDK 大版本里 `@sentry/tracing` 已经并入主包了，新项目只装 `@sentry/vue` 就够，初始化的 API 写法也跟下面这段不一样。这篇写的是 2022 年那个版本的写法，接的时候以你装的版本对应的官方文档为准。

```js
// src/main.js
import Vue from "vue";
import Router from "vue-router";
import * as Sentry from "@sentry/vue";
import { Integrations } from "@sentry/tracing";

Vue.use(Router);

const router = new Router({
  // ...
});

Sentry.init({
  Vue,
  dsn: "http://xdsdfafda21212@119.75.24.41:9000/2",
  integrations: [
    new Integrations.BrowserTracing({
      routingInstrumentation: Sentry.vueRouterInstrumentation(router),
      tracingOrigins: ["localhost", "my-site-url.com", /^\//],
    }),
  ],
  // 不同的环境上报到不同的 environment 分类
  // environment: process.env.ENVIRONMENT,
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  //  高访问量应用可以控制上报百分比
  tracesSampleRate: 1.0,
  release: process.env.SENTRY_VERSION || '0.0.1', // 版本号，每次都npm run build上传都修改版本号
});

// ...

new Vue({
  router,
  render: h => h(App),
}).$mount("#app");
```

这段配置里有四个字段要单独讲，配错任何一个后面都会出问题。

`dsn` 是数据上报地址，格式是 `协议://公钥@主机:端口/项目ID`。私有化部署的话主机就是你服务器的 IP，末尾那个数字是项目在 Sentry 里的自增 ID。这个字段可以直接暴露在前端代码里，它只有写入权限，不用当密钥保护。

`routingInstrumentation` 把 vue-router 接了进来，作用是让 Sentry 知道路由跳转，页面切换会被记成一次 transaction，面包屑里也能看到用户从哪个页面跳到了哪个页面。不接这个，性能面板里就只有一次首屏加载，看不到后续导航。

`tracesSampleRate: 1.0` 是性能数据的采样率，1.0 表示 100% 上报。这个值在生产环境要往下调。注意它只影响性能追踪（transaction），不影响错误上报，错误默认是全量的，别搞混了担心漏报。日活几万的应用我一般设到 0.1 左右，采多了后台存不下，而且性能数据本来就是看趋势的，抽样不影响判断。

`release` 是这篇里最容易被忽视但最关键的一个字段。它是版本标识，Sentry 靠它把「上报的错误」和「上传的 sourceMap」关联起来。下一节配 sourceMap 上传时还有一个 `release` 参数，**这两个值必须完全一致**，差一个字符就匹配不上，你传了 sourceMap 也还原不出源码。我第一次配的时候就是这里对不上，排查了一下午才发现。

我们手动抛出异常，在控制台可见捕获了错误

![Sentry 后台 Issues 列表中捕获到的错误](https://s.poetries.top/uploads/2022/07/893f765fac6d2520.png)

![错误详情页的堆栈信息](https://s.poetries.top/uploads/2022/07/695199f400f7e40d.png)

第一张是 Issues 列表，能看到刚抛的错误进来了。Sentry 会把相同的错误自动聚合成一条 issue，右边显示发生次数和影响用户数，不会被同一个错误刷屏。

第二张是详情页。开发环境下堆栈是可读的，因为代码没压缩。但生产环境的代码经过压缩混淆，这里显示的会是 `chunk-vendors.a1b2c3.js:1:20345` 这种东西，完全没法定位。

所以就有了下一节。

## 五、上传 sourceMap 到 Sentry

为了方便查看具体的报错内容，我们需要上传`sourceMap`到`sentry`平台。一般有两种方式 `sentry-cli`和 `sentry-webpack-plugin`方式，这里为了方便采用`webpack`方式

- `source-map` 是一个文件，可以让已编译过的代码可以映射出原始源;
- `source-map` 就是一个信息文件，里面储存着位置信息。也就是说，转换后的代码的每一个位置，所对应的转换前的位置。

两种方式的区别在于时机。`sentry-cli` 是独立的命令行工具，构建完之后单独跑一条命令上传，适合放进 CI 流水线；`sentry-webpack-plugin` 挂在构建流程里，`npm run build` 跑完自动就传了。个人项目用插件方便，团队项目我更推荐 CLI，因为构建和上传解耦，构建失败时不会传上去半截产物。

**webpack方式上传**

```bash
npm i @sentry/webpack-plugin -D
```

修改`vue.config.js`配置文件

```js
// vue.config.js

const SentryCliPlugin = require('@sentry/webpack-plugin')

module.exports = {
  // 打包生成sourcemap，打包完上传到sentry之后在删除，不要把sourcemao传到生产环境
  productionSourceMap: process.env.NODE_ENV !== 'development',
  configureWebpack: config=> {
    if (process.env.NODE_ENV !== 'development') {
      config.plugins.push(
        new SentryCliPlugin({
          include: './dist/js', // 只上传js
          ignore: ['node_modules', 'webpack.config.js'],
          ignoreFile: '.sentrycliignore',
          release: process.env.SENTRY_VERSION || '0.0.1', // 版本号，每次都npm run build上传都修改版本号 对应main.js中设置的Sentry.init版本号
          cleanArtifacts: true, // Remove all the artifacts in the release before the upload.
          urlPrefix: '~/js', // 线上对应的url资源的相对路径 注意修改这里，否则上传sourcemap还原错误信息有问题
          // urlPrefix： 关于这个，是要看你线上项目的资源地址，比如
          // 怎么看资源地址呢， 例如谷歌浏览器， F12控制台， 或者去Application里面找到对应资源打开
        }),
      )
    }
  },
}
```

`productionSourceMap` 必须打开，不然构建产物里压根没有 `.map` 文件，插件也就没东西可传。

`include: './dist/js'` 限定只扫这个目录。范围写太大会把一堆无关文件也传上去，上传慢而且占存储。Vue CLI 默认把 JS 产物放在 `dist/js`，用了自定义输出目录的要相应调整。

`release` 前面说过了，跟 `main.js` 里 `Sentry.init` 的那个值必须一模一样。我的做法是抽成一个变量放在单独文件里，两边都 require 它，从根上杜绝写岔。

`cleanArtifacts: true` 是上传前先清掉这个 release 下已有的产物。不加这个的话，反复构建同一个版本号会在服务端堆一堆重复文件，还可能因为新旧文件混在一起导致映射错乱。

然后是 `urlPrefix`，这是整段配置里最容易配错的一项。

它的作用是告诉 Sentry「这些 sourceMap 对应的线上资源，URL 长什么样」。Sentry 收到一个错误堆栈，里面记录的是出错文件的完整 URL，它要拿这个 URL 去匹配你上传的产物名。`~` 代表域名，`~/js` 就是说这些文件线上访问路径是 `https://你的域名/js/xxx.js`。

怎么确认该填什么？打开线上页面，F12 到 Network 面板，看一眼 JS 文件的实际请求路径，域名后面那段就是。如果你的资源部署在 CDN 的子目录下，比如 `https://cdn.xxx.com/app/static/js/main.js`，那 `urlPrefix` 就得写 `~/app/static/js`。填错的表现很迷惑：sourceMap 明明传上去了，后台也能看到文件列表，但错误堆栈还是压缩后的样子。这个坑我踩得最惨，因为没有任何报错提示你配错了。

顺带说一下 `ignoreFile: '.sentrycliignore'`，它指向一个类似 `.gitignore` 的文件，可以更细粒度地排除不想上传的产物。项目根目录得真有这个文件，没有的话这一项可以直接删掉。

获取`TOKEN`

![Sentry 设置页面的 Auth Tokens 入口](https://s.poetries.top/uploads/2022/07/d2cf43bc99c8125d.png)

![新建 Auth Token 的权限勾选页面](https://s.poetries.top/uploads/2022/07/f427cd23cd15f067.png)

![创建完成后显示的 token 字符串](https://s.poetries.top/uploads/2022/07/1db9fed291b04c9c.png)

这三张图是创建 token 的完整流程。第二张那一步要注意权限勾选，`project:write` 是上传产物必需的，漏勾的话上传会报 403，而错误信息不会明确告诉你是权限问题。

第三张里的 token 只会完整显示这一次，关掉页面就看不到了，当场复制走。这个 token 跟 DSN 不一样，它有写权限，**绝对不能提交进代码仓库**，走环境变量或者 CI 的 secret。

获取`org`

![组织设置页面查看组织名称 slug](https://s.poetries.top/uploads/2022/07/8962b2ec56f2cc19.png)

`org` 要的是组织的 slug 而不是显示名称。两者经常不一样，显示名是「我的团队」，slug 可能是 `my-team`。填错了上传会报找不到组织。看浏览器地址栏最直观，URL 里 `/organizations/` 后面那段就是。

在项目根目录创建`.sentryclirc`

- `url`：sentry部署的地址，默认是`https://sentry.io/`
- `org`：控制台查看组织名称
- `project`：项目名称
- `token`：生成token需要勾选`project:write`项目写入权限

```bash
# .sentryclirc

[auth]
token=填入控制台创建的TOKEN

[defaults]
url=https://sentry.io/
org=sentry
project=vue
```

这是个 INI 格式的配置文件，注释用 `#`，等号两边不要加空格。

私有化部署的话，`url` 那行必须改成你自己的地址，比如 `http://119.75.24.41:9000/`，保留默认值的话 CLI 会去官方 SaaS 上找你的组织，当然找不到。这一条漏改也是高频问题。

还有，`.sentryclirc` 里有 token，记得加进 `.gitignore`。

执行项目打包命令，即可把js下的`sourcemap`相关文件上传到`sentry`

```
npm run build
```

上传后的`sourcemap`在这里可以看到

![Sentry 后台 Releases 里的产物文件列表](https://s.poetries.top/uploads/2022/07/fc614a806ae0c774.png)

构建完之后第一件事是来这个页面确认。路径是 Releases 里点进对应版本号，看 Artifacts 列表。文件名带 `~/js/` 前缀、`.js` 和 `.js.map` 成对出现，才算传对了。

这一步是整个 sourceMap 流程的验收点。列表是空的说明 token 或者 org 有问题；有文件但前缀不对，说明 `urlPrefix` 填错了。在这里发现问题比等到线上报错时才发现要省事得多。

正确上传过 `source-map` 的项目，可以看到很清晰的报错位置

> 进入本地打包的dist，`http-server -p 6002` 启动一个模拟正式环境部署的服务访问看看效果

![还原后可以看到源码行号的错误堆栈](https://s.poetries.top/uploads/2022/07/c28db99ceb1e7001.png)

这才是我们要的效果，堆栈直接指到源文件的某一行，还带上下文代码。

用 `http-server` 起本地服务这个验证方式很实用。直接在生产环境验证的话，改一次配置就要发一次版，成本太高。本地起个静态服务模拟线上产物，改配置重构建重传，几分钟一轮。

还可以通过 `面包屑` 功能查看，报错前发生了什么操作

![错误详情页的 Breadcrumbs 操作时间线](https://s.poetries.top/uploads/2022/07/1d6f7cba82780187.png)

这就是开头说的面包屑。图里能看到用户点了什么、发了哪些 XHR 请求、路由怎么跳的，按时间倒序排。定位那种「特定操作路径才触发」的偶现 bug，这个功能价值极大。

**记得别把sourcemap文件传到生产环境，又大又不安全** 删除`sourcemap`, 基于vue2演示的三种方式

这句提醒必须重视。sourceMap 里包含完整源码，传到生产环境等于把代码公开了，任何人打开 DevTools 都能看到你的业务逻辑。而且 `.map` 文件通常比 JS 本体还大，白白占带宽。

```js
// 方式1
"scripts": {
  "build": "vue-cli-service build && rimraf ./dist/js/*.map"
}

// 方式2 单独生成map
// vue.config.js
chainWebpack(config) {
     config.output.sourceMapFilename('sourceMap/[name].[chunkhash].map.js')
     config.plugin('sentry').use(SentryCliPlugin, [{
        include: './dist/sourceMap', // 只上传sourceMap目录
        ignore: ['node_modules'],
        configFile: 'sentry.properties',
        release: process.env.SENTRY_VERSION || '0.0.1', // 版本号，每次都npm run build上传都修改版本号
        cleanArtifacts: true, // 先清理再上传
    }])
}

// 方式3 webpack插件清理
$ npm i webpack-delete-sourcemaps-plugin -D
// vue.config.js
const { DeleteSourceMapsPlugin } = require('webpack-delete-sourcemaps-plugin')

configureWebpack(config) {
    config.plugins.push(
        new DeleteSourceMapsPlugin(), // 清理sourcemap
    )
}
```

这三种方式的差别值得说一下，因为原文这段代码有两处会让人直接跑不通。

方式 1 最直白，构建完用 `rimraf` 把 `.map` 文件删掉。要保证 `&&` 前面的上传已经完成，`@sentry/webpack-plugin` 是在 webpack 编译流程里同步传的，所以这个顺序是安全的。

方式 2 的思路是把 sourceMap 单独输出到另一个目录，这样正式产物目录里天然没有 `.map`，不用删。这里要注意，原文这段用的 `config.output.sourceMapFilename()` 和 `config.plugin().use()` 都是 webpack-chain 的链式 API，只能写在 `chainWebpack` 里，写在 `configureWebpack` 里会直接报错，上面这份我已经改成 `chainWebpack` 了。

方式 3 用现成的插件在构建结束时删。原文写的是 `config.plugin.push(...)`，少了个 s，正确的是 `config.plugins.push(...)`，`configureWebpack` 拿到的是原始配置对象，插件数组的字段名是 `plugins`。

我自己用方式 1，理由是它最容易看懂，出问题一眼就知道是哪一步没执行。

## 六、Performance 面板看什么

![Sentry 的 Performance 性能面板](https://s.poetries.top/uploads/2022/07/d02c70b8bed7be49.png)

> `Sentry.init()` 中，`new Integrations.BrowserTracing()` 的功能是将浏览器页面加载和导航检测作为事物，并捕获请求，指标和错误。

- `TPM`: 每分钟事务数
- `FCP`：首次内容绘制（浏览器第第一次开始渲染 dom 的时间点）
- `LCP`：最大内容渲染，代表 `viewpoint` 中最大页面元素的加载时间
- `FID`：用户首次输入延迟，可以衡量用户首次与网站交互的时间
- `CLS`：累计布局偏移，一个元素初始时和消失前的数据
- `TTFB`：首字节时间，测量用户浏览器接收页面的第一个字节的时间（可以判断缓慢来自网络请求还是页面加载问题）
- `USER`：`uv` 数字
- `USER MISERY`: 对响应时间难以忍受的用户指标，由 `sentry` 计算出来，阈值可以动态修改

这几个指标里 LCP、FID、CLS 就是 Google 那套 Core Web Vitals，直接影响搜索排名，也是最值得先看的三个。

我平时的看法顺序是这样。先看 TTFB，它高说明问题在服务端或者网络，前端再优化也没用；TTFB 正常但 LCP 高，那就是资源加载或者渲染的问题，去查首屏那张大图或者那个大 chunk；CLS 高基本都是图片没写宽高、或者广告位、字体加载导致的布局跳动，改起来最快见效。

`USER MISERY` 这个指标挺有意思，它不是纯技术指标而是体验指标，统计的是响应慢到让用户不耐烦的比例。阈值可以在项目设置里调。真正推动优化排期的时候，这个数字比 P95 耗时更容易说服人。

FID 这里补一句，Web Vitals 这套指标后来有过调整，业界主推的交互指标有了新的替代项。这块我没有在最新版本的 Sentry 面板上逐项核对过，看到面板里有你不认识的指标名很正常，查一下官方文档就行。

## 七、Vue3 加 Vite 的配置差异

框架换了，Sentry 的接入思路不变，变的是构建工具那一层。

### 创建vue3项目

```bash
yarn create vite
```

### 安装sentry依赖

```
npm i @sentry/vue @sentry/tracing
```

依赖跟 Vue2 一样，`@sentry/vue` 内部会判断 Vue 版本走不同的适配逻辑，不用装别的包。

### 初始化sentry

> `src/main.js`中修改

```js
import { createApp } from "vue";
import { createRouter } from "vue-router";
import * as Sentry from "@sentry/vue";
import { Integrations } from "@sentry/tracing";

const app = createApp({
  // ...
});
const router = createRouter({
  // ...
});

Sentry.init({
  app,
  dsn: "http://xdfada1212@12.715.204.41:9000/2",
  integrations: [
    new Integrations.BrowserTracing({
      routingInstrumentation: Sentry.vueRouterInstrumentation(router),
      tracingOrigins: ["localhost", "my-site-url.com", /^\//],
    }),
  ],
  // 不同的环境上报到不同的 environment 分类
//   environment: process.env.ENVIRONMENT,
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
    //  高访问量应用可以控制上报百分比
  tracesSampleRate: 1.0,
  release: process.env.SENTRY_VERSION || '0.0.1', // 版本号，每次都npm run build上传都修改版本号
});

app.use(router);
app.mount("#app");
```

跟 Vue2 那段对比着看，唯一的实质差异是第一个参数从 `Vue`（构造函数）变成了 `app`（应用实例）。这是 Vue3 的应用实例模型带来的，`Sentry.init` 里传 `app` 之后，SDK 才能挂上 Vue3 的错误处理钩子。

其余字段的含义完全一致，`release` 依然要跟下面上传配置里的对上。

### sourcemap上传

> 修改`vite.config.js`配置

安装`npm i vite-plugin-sentry -D`插件

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import viteSentry from 'vite-plugin-sentry'

const sentryConfig = {
  configFile: './.sentryclirc',
  release: process.env.SENTRY_VERSION || '0.0.1', // 版本号，每次都npm run build上传都修改版本号
  deploy: {
   env: 'production',
  },
  skipEnvironmentCheck: true, // 可以跳过环境检查
  sourceMaps: {
   include: ['./dist/assets'],
   ignore: ['node_modules'],
   urlPrefix: '~/assets', // 注意这里设置正确，否则sourcemap上传不正确
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    process.env.NODE_ENV === 'production' ? viteSentry(sentryConfig) : null,
  ],
  build: {
    sourcemap: process.env.NODE_ENV === 'production',
  },
})
```

Vite 和 webpack 这里的差别主要在目录约定。Vite 默认把构建产物放在 `dist/assets` 下，JS、CSS、图片全在一起，所以 `include` 和 `urlPrefix` 都是 `assets` 而不是 webpack 那边的 `js`。这两项配错的后果跟前面一样，传上去了但对不上。

`build.sourcemap` 这一项等价于 Vue CLI 的 `productionSourceMap`，不开就没有 map 文件。这里用 `process.env.NODE_ENV === 'production'` 做条件，开发环境不生成，构建快一点。

`skipEnvironmentCheck: true` 是跳过插件自带的环境判断。加它的场景是你的 CI 里 `NODE_ENV` 不是标准的 `production`，插件会以为不该上传而跳过。

`plugins` 数组里那个三元表达式返回 `null`，Vite 会自动过滤掉数组里的假值，这个写法是安全的。

> 此时当执行`vite build`时，`viteSentry`这个插件会将构建的`sourcemap`文件上传到s`entry`对应的项目`release`之下。当次版本新捕获到错误时就可以还原出错误行，以及详细的错误信息。

![vite 构建时上传 sourcemap 的日志输出](https://s.poetries.top/uploads/2022/07/605e5eb69a429340.png)

构建日志里会打出上传的文件列表，这是最快的确认方式。看不到这段输出就说明插件根本没执行，回去检查 `NODE_ENV` 和插件的条件判断。

## 八、React 项目接入

> 使用umi项目接入演示

### 创建一个umi项目

```bash
mkdir umi-sentry && cd  umi-sentry

yarn create umi
```

![yarn create umi 的交互式选项](https://s.poetries.top/uploads/2022/07/b7e76f88d489b17f.png)

选模板的交互界面，随便选个 app 类型就行，这里只是拿来演示接入。

```bash
# Using npm
npm install --save @sentry/react @sentry/tracing
```

React 用 `@sentry/react`，它额外提供了错误边界组件和 Profiler 这些 React 特有的能力。

### 接入sentry

初始化sentry

```js
// pages/index.ts

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: "https://xdfa@o1334810.ingest.sentry.io/121",
  integrations: [new BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  release: '0.0.1',
  tracesSampleRate: 1.0,
});
```

跟 Vue 那两段对比，React 这边没有传应用实例，因为 React 的错误捕获是靠全局钩子加错误边界组件，不需要在初始化时挂到实例上。

这段代码放在 `pages/index.ts` 只是为了演示。真项目里应该放在应用最早执行的地方，umi 的话是 `src/app.ts` 里，Sentry 要在其他代码之前初始化，不然初始化之前抛的错就漏了。

注意这里的 DSN 是 `o1334810.ingest.sentry.io`，是官方 SaaS 的地址。用私有化部署的话换成你自己的。

手动抛出异常查看是否能正确上报到sentry

![React 项目抛出的异常在 Sentry 后台被捕获](https://s.poetries.top/uploads/2022/07/1742ca6bb482613a.png)

跟 Vue 那边一样，先确认错误能进来，再去折腾 sourceMap。顺序反了的话出问题你分不清是上报没通还是映射没对上。

### sourcemap上传

#### 根目录创建配置文件 .sentryclirc

```ini
[auth]
token=TOKEN控制台获取，TOKEN需要勾选project:write写入权限

[defaults]
url=https://sentry.io/
org=组织名称，控制台获取
project=react
```

这里要提醒一处。原文这段配置里用了 `//` 写行内注释，但 `.sentryclirc` 是 INI 格式，`//` 后面的内容会被当成值的一部分，`url` 就变成了一个带注释文本的非法地址。INI 的注释符是 `#` 或者 `;`，而且要独占一行。上面这份我已经把行内注释去掉了。

#### sourcemap配置上传

```
npm i @sentry/webpack-plugin -D
```

```js
// .umirc.ts 修改

const SentryPlugin = require('@sentry/webpack-plugin');

export default {
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval', // 开启sourcemap
  chainWebpack(config, { webpack }){
    if (process.env.NODE_ENV === 'production'){//当为prod时候才进行sourcemap的上传，如果不判断，在项目运行的打包也会上传
      config.plugin("sentry").use(SentryPlugin, [{
        ignore: ['node_modules'],
        include: './dist', //上传dist文件的js
        configFile: './.sentryclirc', //配置文件地址，这个一定要有，踩坑在这里，忘了写导致一直无法实现上传sourcemap
        release:'1.0.1', //版本号，自己定义的变量，整个版本号在项目里面一定要对应
        deleteAfterCompile: true,
        urlPrefix: '~/' // js的代码路径前缀
       }])
    }
  },
};
```

这段和 Vue CLI 那份的差别在于 umi 用的是 `chainWebpack`，所以是 `config.plugin().use()` 的链式写法。

`devtool` 这一项对应前面的 `productionSourceMap`，生产环境设成 `'source-map'` 才会生成完整的独立 map 文件。别用 `'eval-source-map'` 之类的，那些把 map 内联进 JS 里，插件拿不到独立文件。

`configFile` 这里原文写的是 `'./sentryclirc'`，少了开头的点，跟实际文件名 `.sentryclirc` 对不上。原文自己也在注释里说「踩坑在这里」，上面这份已经改成 `'./.sentryclirc'`。这种一个字符的差异最难查，因为找不到配置文件时 CLI 往往是静默跳过而不是报错。

`deleteAfterCompile: true` 是上传完自动删掉本地的 map 文件，正好解决前面说的「别把 sourceMap 发到生产」的问题，比 Vue 那节的三种手动删法都省事。

`release: '1.0.1'` 这里写死了，而 `Sentry.init` 里写的是 `'0.0.1'`，**这两个对不上**。原文注释里特意说了「整个版本号在项目里面一定要对应」，但代码本身就没对上。真用的时候记得统一，最好像我前面说的那样抽成共享变量。

```bash
# 执行打包上传sourcemap
npm run build

# 进入dist文件，启动http-server 本地服务模拟线上效果
```

![umi 构建过程中上传 sourcemap 的输出](https://s.poetries.top/uploads/2022/07/3dce162037de39ac.png)

修改代码抛出异常，查看控制台sourcemap解析的效果

![React 项目还原后的错误堆栈](https://s.poetries.top/uploads/2022/07/3cd50955a8f30718.png)

能看到源码行号就说明整条链路通了。到这里三套框架的接入就都跑完了。

**注意：npm run build之后，不要把sourcemap上传到生产环境，记得删除**

## 九、几个值得开的进阶能力

基础链路跑通之后，下面这几个功能能让排查效率再上一个台阶。

### 识别用户

> 在上传的 issues 里面，我们可以借助 setUser 方法，设置读取存在本地的用户信息。（此信息需要持久化存储，否则刷新会消失）

```js
// app/main.js
Sentry.setUser({
  id: 'dfar12e31', // userId cookie.get('userId')
  email: 'test@qq.com', // cookie.get('email')
  username: 'poetry', // cookie.get('username')
})
Vue.prototype.$Sentry = Sentry
```

![Issues 详情里显示的用户信息](https://s.poetries.top/uploads/2022/07/5406d9288512bbf5.png)

这个功能的价值在于把「有 37 个用户受影响」变成「张三、李四这几个用户受影响」。客服转过来一个投诉，你可以直接按用户 ID 搜到他遇到的所有错误，不用在几百条 issue 里翻。

调用时机要注意，`setUser` 应该在用户登录成功之后调，登出时用 `Sentry.setUser(null)` 清掉。原文括号里那句「需要持久化存储，否则刷新会消失」说的就是这个，SDK 不会帮你记住，页面一刷新 scope 就重置了，所以要在应用初始化时从 cookie 或者 localStorage 里读回来重新设一次。

另外这里有个合规问题要提醒，email 和 username 属于个人信息，上报到第三方 SaaS 之前先确认公司的隐私政策允许。私有化部署就没这个顾虑，这也是选自建的理由之一。

`Vue.prototype.$Sentry = Sentry` 是把 Sentry 挂到 Vue 原型上，组件里可以直接 `this.$Sentry.captureException(err)` 主动上报。这个在 `try/catch` 里很有用，被 catch 住的错误不会自动上报，得手动送。

### 错误边界

- 定义错误边界，当组件报错的时候，可以上报相关信息
- 使用 `Sentry.ErrorBoundary`。加了错误边界，可以把错误定位到组件上面。

这是 React 侧特有的能力。React 的错误边界机制本身只保证「组件树的某一部分崩了不至于整页白屏」，`Sentry.ErrorBoundary` 在这个基础上把崩掉的组件信息一起上报，你能看到是哪个组件出的问题，而不只是一段堆栈。

用法是把它当普通组件包在外面。

```jsx
<Sentry.ErrorBoundary fallback={<p>这块内容加载失败了</p>}>
  <YourComponent />
</Sentry.ErrorBoundary>
```

包的粒度是个取舍。整个 App 包一层，白屏能兜住但定位不精确；每个业务模块各包一层，定位精确而且局部降级不影响其他区域，代价是代码里多了不少嵌套。我一般在路由级别和几个重点业务区块包，不会包到每个组件。

### rrweb 录屏回放

```
npm i @sentry/rrweb rrweb -S
```

```js
import SentryRRWeb from '@sentry/rrweb';

// app/main.js
Sentry.init({
    Vue,
    dsn: "xxx",
    integrations: [
      new Integrations.BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracingOrigins: ["localhost", "my-site-url.com", /^\//],
      }),
      new SentryRRWeb({
        checkoutEveryNms: 10 * 1000, // 每10秒重新制作快照
        checkoutEveryNth: 200, // 每 200 个 event 重新制作快照
        maskAllInputs: false, // 将所有输入内容记录为 *
      }),
    ],
    // 不同的环境上报到不同的 environment 分类
    environment: process.env.ENVIRONMENT,
    //  高访问量应用可以控制上报百分比
    tracesSampleRate: 1.0,
    release: process.env.SENTRY_VERSION || '0.0.1', // 版本号，每次都npm run build上传都修改版本号
    logErrors: true
});
```

顺便说一下，原文这段里 `tracingOrigins` 的正则写成了 `/^//`，这在 JS 里是无效的，斜杠必须转义。前面 Vue2 那段写的 `/^\//` 才是对的，上面已经统一。这种错误 copy 过去会直接导致语法错误，构建都过不了。

在报错后，可以录屏播放错误发生的情况

![Sentry 中回放用户操作录像](https://s.poetries.top/uploads/2022/07/d7231e857e234509.png)

rrweb 的原理不是真的录视频，而是记录 DOM 的变更事件，回放时在页面上重建。所以数据量比视频小得多，但也意味着 canvas、video 这类内容回放不出来。

三个参数说一下。`checkoutEveryNms` 和 `checkoutEveryNth` 是全量快照的间隔，rrweb 平时只记增量变更，隔一段时间打一个完整快照，回放时从最近的快照往后放，不用从头重建。间隔越短数据量越大，回放定位越快。

`maskAllInputs` 这一项默认建议开成 `true`，也就是把所有输入框内容打码。原文设成 `false` 是为了演示方便，但线上千万别这么配，用户在表单里输的密码、手机号、身份证会被原样记录上报，这是实打实的数据泄漏。真要看某个输入框的内容，rrweb 支持按 class 单独放开。

说实话录屏这个功能我在生产上用得不多，一是数据量确实大，二是隐私顾虑，我更常用的还是面包屑。但遇到那种怎么都复现不了的诡异 bug，能看一遍用户实际操作，价值就出来了。

### 手动设置报警

- 设置报警规则，当我们某些情况，如 `issues`，`performance` 超过我们设置的阈值，会触发 `alert`。
- 我们可以通过提醒等功能来帮助我们即时发现问题。

![Sentry 的 Alerts 报警规则配置页](https://s.poetries.top/uploads/2022/07/4bd87c7949fd6a74.png)

监控平台不配报警等于没配。没人会每天主动打开后台看有没有新错误，只有报警推到群里才会有人管。

规则怎么定我的建议是从严到宽反着来。刚上线时先配一条最粗的，比如「出现新的未见过的错误就通知」，跑一周看看噪音有多大。然后按噪音来源逐条收紧，把那些已知的、不影响功能的错误加进忽略列表。一上来就配十条精细规则的结果通常是群里被刷屏，然后所有人都把通知静音了。

阈值这块，「5 分钟内同一错误超过 N 次」这种基于频率的规则比「出现即报」实用得多，能自动过滤掉个别用户环境导致的偶发问题。

关于前端监控体系的整体设计，采集哪些指标、怎么和后端链路打通，我之前写过一篇 [前端监控系统](https://feinterview.poetries.top/blog/fe-monitor-sys) 可以配合看，那篇讲的是自研思路，跟这篇的现成方案正好互补。

## 总结

Sentry 落地这件事，真正花时间的是部署和 sourceMap，SDK 接入反而是最简单的一步。

私有化部署的门槛是 8G 内存和镜像加速这两条，前者不满足服务起不来，后者不满足脚本跑不完。装之前先把 `docker info` 里的 `Registry Mirrors` 确认了，能省你一整个下午。`install.sh` 挂在 tmux 里跑，别让 SSH 断线毁掉四十分钟。

sourceMap 那部分，我的经验是三个字段决定成败。`release` 两边必须完全一致，代码里和上传配置里；`urlPrefix` 要对着 Network 面板里的真实资源路径填；`configFile` 路径别写漏点。这三项配错都不会给你明确报错，只是默默失效，所以每次改完一定去 Releases 的 Artifacts 列表里眼看确认一遍。

传完之后一定要删掉生产环境的 map 文件，`deleteAfterCompile` 或者构建脚本里接一条 `rimraf`，选哪个都行，别忘了就好。

至于开哪些功能，我的默认组合是面包屑加 `setUser` 加报警规则，这三个投入产出比最高。录屏按需开，开的话 `maskAllInputs` 必须是 `true`。性能采样率生产环境往 0.1 调，错误上报保持全量。

## 参考

- [Sentry 官方文档](https://docs.sentry.io/)
- [Sentry Self-Hosted 部署仓库](https://github.com/getsentry/self-hosted)
- [Sentry Vue SDK 文档](https://docs.sentry.io/platforms/javascript/guides/vue/)
- [Sentry React SDK 文档](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Source Maps 配置指南](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [sentry-webpack-plugin 仓库](https://github.com/getsentry/sentry-webpack-plugin)
- [vite-plugin-sentry 仓库](https://github.com/ikenfin/vite-plugin-sentry)
- [rrweb 仓库](https://github.com/rrweb-io/rrweb)
- [Web Vitals 指标说明](https://web.dev/articles/vitals)
- [前端进阶之旅](https://interview.poetries.top)
