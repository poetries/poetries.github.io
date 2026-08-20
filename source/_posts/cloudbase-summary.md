---
title: 云开发CloudBase实践总结从CLI到Framework一键部署
description: 腾讯云开发 CloudBase 的完整实践笔记，覆盖 CLI 脚手架、云函数配置与触发器、静态网站托管、六种登录鉴权方式、CloudBase Framework 一体化部署插件、VS Code Toolkit、CMS 内容管理与 NoSQL 数据库接入。
date: 2022-06-25 14:40:12
tags:
  - 部署
  - 云开发
  - Serverless
  - CloudBase
categories: Front-End
---

做一个小工具站，后端只有六七个接口，结果卡住我最久的不是接口逻辑，是买机器、配 nginx、申请证书、写 PM2 守护、再折腾一遍 CI。真正写业务的时间可能只占三分之一，剩下三分之二全耗在跟业务无关的事情上。

腾讯云开发（CloudBase）想解决的就是这一段。它把云函数、云数据库、静态网站托管、登录鉴权这几样东西打包成一个环境，你只管写代码，剩下的构建、部署、扩缩容、HTTPS 都交给它。一条 `tcb framework deploy` 就能把一个前后端都在里面的项目推上去。

这篇是我把 CloudBase 从 CLI 装起、一路用到 Framework 一键部署、CMS 和 VS Code 插件的完整记录。内容偏长，是按「查手册」的思路组织的，你可以直接跳到你要用的那一节。中间标了几个真的卡住过我的地方，比如环境区域选错导致项目找不到、Node SDK 那几个「非必填」参数其实必填、CMS 本地开发的跨域。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 云开发和 Serverless Framework 到底差在哪，什么项目该选哪个
- 控制台建环境，以及区域选错之后为什么项目会「消失」
- CLI 脚手架从安装、登录到 `tcb new` 建项目的全流程
- 环境管理，安全域名和登录方式怎么用命令行配
- `cloudbaserc.json` 的每一个配置项，以及动态变量和多环境切换
- 云函数的部署、触发器、Cron 表达式、日志和版本
- 静态网站托管的全量部署、增量删除和文件列表
- 六种登录鉴权方式的开通流程和完整代码，匿名、未登录、邮箱、微信、自定义、用户名密码、短信
- CloudBase Framework 的插件体系，website / function / node / container / database / auth / mp 七个插件
- 用 Framework 部署 Egg、Koa、React、Vue、Hexo 五种项目的实际配置
- 在云函数里连 NoSQL 数据库，`secretId` 和 `secretKey` 从哪拿
- VS Code Toolkit 插件的本地开发与调试
- CloudBase CMS 的控制台安装、源码二次开发、微应用接入和 RESTful API 鉴权

先说一句时效性。这篇写于 2022 年，这几年云开发控制台改版过不止一次，截图里的入口位置、按钮文案跟你现在看到的界面可能对不上。命令行和 SDK 这部分变动小得多，基本还能照着跑；控制台操作以你实际看到的界面为准，别死抠截图。

## 一、关于云开发介绍

刚接触的时候我一直分不清云开发和 Serverless Framework，觉得两个都是「不用管服务器」的东西。后来实际用下来才发现，它俩解决问题的层次不一样。

**云开发与serverless的区别**

- `Serverless Framework` 是无服务器应用框架，提供将云函数` SCF`、`API` 网关、对象存储 `COS`、云数据库 `DB` 等资源组合的业务框架，开发者可以直接基于框架编写业务逻辑，而无需关注底层资源的配置和管理。
- 云开发（`Tencent CloudBase，TCB`）是腾讯云提供的云原生一体化开发环境和工具平台，为开发者提供高可用、自动弹性扩缩的后端云服务，包含计算、存储、托管等 `serverless` 化能力，可用于云端一体化开发多种端应用（小程序、公众号、`Web` 应用、`Flutter` 客户端等），帮助开发者统一构建和管理后端服务和云资源，避免了应用开发过程中繁琐的服务器搭建及运维，开发者可以专注于业务逻辑的实现，开发门槛更低，效率更高。
- **二者最大的区别是**：给开发者使用的平台支持不一样，云开发支持web端、QQ、微信小程序级静态网站托管等这些平台服务。

我自己的理解是这样：Serverless Framework 更像一个「资源编排器」，它帮你把腾讯云上散落的 SCF、API 网关、COS 拼起来，你还是在跟一个个云产品打交道。云开发是把这些产品重新打包成一个叫「环境」的东西，环境里天生就有数据库、存储、云函数、静态托管和一套用户体系，多端 SDK 也是现成的。

所以选型的判断标准不是「哪个更 Serverless」，而是你的应用要跑在哪。要接小程序、公众号、H5 这些微信生态的端，云开发的多端 SDK 和登录鉴权能省掉大量胶水代码；要做的是一个纯粹的后端服务、需要精细控制每一个云资源，Serverless Framework 的自由度更高。

顺着上面聊，如果你的后端是一个完整的框架工程（Nest、Egg 这类），还有第三个选择是微信云托管，它直接跑容器。我在 [微信云托管入门与实践](https://feinterview.poetries.top/blog/wxcloud-intro) 里写过完整流程，跟这篇可以对照着看。

## 二、使用云开发创建一个nestjs项目

先从控制台走一遍最短路径，把环境建起来。后面所有的 CLI 操作都依赖这个环境 ID。

在产品中选择云开发产品

![腾讯云控制台产品列表中找到云开发 CloudBase 入口](https://s.poetries.top/uploads/2022/06/97bfb6a300ede8cb.png)

> 创建一个项目, 这里要选择好区域，下次创建了项目，区域不一样，可能项目就看不到

这个坑我踩得挺实在。云开发的环境是按地域隔离的，控制台顶部有个地域选择器，上海和广州是两套完全独立的列表。我第一次建在上海，第二天进来控制台默认切到了广州，列表空空如也，还以为环境被删了。后来发现只是地域没对上。

所以建环境之前先想清楚放哪个地域，记下来，后面 `cloudbaserc.json` 里的 `region` 字段填的就是它。上海地域可以不填，其他地域必填，这个规则后面第三节还会再提一次。

下面几张图是创建环境的完整流程，从选择计费方式、填环境名称，一直到环境创建完成后的概览页。

![云开发控制台点击新建环境的入口](https://s.poetries.top/uploads/2022/06/4a9fa09df00ae121.png)
![填写环境名称并选择计费方式的表单](https://s.poetries.top/uploads/2022/06/f91fc2a56fd7d19f.png)
![确认环境配置信息并提交创建](https://s.poetries.top/uploads/2022/06/111082e4a79965b8.png)
![环境正在初始化中的等待界面](https://s.poetries.top/uploads/2022/06/3cae71f70a9723d2.png)
![环境创建完成后的概览页，可以看到环境 ID 和各项资源用量](https://s.poetries.top/uploads/2022/06/4cccec9f4013b9aa.png)

最后那张概览页上的环境 ID 是你后面最常用的东西，形如 `xxx-9g9512mcxxxxxxx`，CLI、SDK、配置文件全都要它。建议直接复制出来存到笔记里。

关于计费方式还得多说一句：静态网站托管只有按量计费的环境能开通，预付费（包年包月）环境开不了。后面第九节的 CMS 也一样要求按量计费。要是你打算用这两个功能，建环境的时候就把计费方式选对，免得回头重建。



## 三、使用脚手架的方式创建

控制台点点点适合第一次摸清楚有哪些功能，日常开发还是得靠命令行。CloudBase CLI 能干的事情比控制台多，而且能写进脚本、进 CI，这一节把它的常用命令过一遍。

### 3.1 安装

全局安装脚手架包[官方地址](https://docs.cloudbase.net/cli-v1/quick-start)

```
npm i -g @cloudbase/cli
```

> 为了简化输入，cloudbase 命令可以简写成 tcb

本文后面全部用 `tcb` 这个短命令，你看到的 `cloudbase xxx` 和 `tcb xxx` 是同一个东西。

装完先验证一下，别等到部署失败了才回头查是不是没装上。

测试安装是否成功

```
tcb -v
```

查看命令

```
tcb -h
```

`tcb -h` 输出的那一大坨子命令值得扫一眼，`fn`、`env`、`hosting`、`framework` 这四个是后面用得最多的，分别管云函数、环境、静态托管和一键部署。

### 3.2 登录

CLI 要操作你账号下的资源，第一步得拿到授权。默认是交互式登录。

```
# CloudBase CLI 会自动打开云开发控制台获取授权，您需要点击同意授权按钮允许 CloudBase CLI 获取授权。如您没有登录，您需要登录后才能进行此操作。

tcb login
```

也可以使用下面的方式通过 API 秘钥直接登录，避免交互式输入

```
tcb login --apiKeyId xxx --apiKey xxx
```

这里有个坑要注意。`tcb login` 会拉起浏览器，在 CI 环境或者远程 SSH 的机器上根本没法完成，所以放到流水线里跑的时候必须用第二种密钥登录的方式。密钥在腾讯云访问管理的 API 密钥页面生成，别硬编码进仓库，走 CI 的 secret 变量注入。

### 3.3 创建项目

登录完就能建项目了。`tcb new` 会从官方模板拉一份骨架下来，省得自己从零搭。

本地创建项目

```bash
tcb new [options] [appName] [templateUri]
# 比如
tcb new nest-cloundbase nest-starter
```

> 云开发项目是和云开发环境资源关联的实体，云开发项目聚合了云函数、数据库、文件存储等服务，您可以在云开发项目中编写函数，存储文件，并通过 CloudBase 快速的操作您的云函数、文件存储、数据库等资源。

**云开发项目文件结构：**

```
.
├── .gitignore
├── functions // 云函数目录
│   └── node-app
│       └── index.js
└── cloudbaserc.json // 项目配置文件
```

这套目录结构的关键是 `cloudbaserc.json`。它是整个项目跟云端环境之间的唯一契约，CLI、VS Code 插件、云端一键部署读的都是它。第 3.5 节会把里面的每个字段拆开讲。

选择自己已经创建的环境,如果没有就 创建新环境,这时候会打开浏览器

![命令行提示选择关联的云开发环境](https://s.poetries.top/uploads/2022/06/6b018bec4591c9aa.png)

本地打开项目并且安装依赖包

```
npm install
npm run dev
```

部署到线上

```bash
# 调用 tcb framework deploy
npm run deploy
```

模板里的 `npm run deploy` 通常只是 `tcb framework deploy` 的一层封装，两者等价。部署过程中终端会滚出构建日志和资源创建日志，出错的话第一时间看这里，比去控制台翻要快。

![执行部署命令后终端输出的构建与上传过程](https://s.poetries.top/uploads/2022/06/c9016bdd4a84dac4.png)
![部署成功后终端打印出的访问地址和资源清单](https://s.poetries.top/uploads/2022/06/00b5a9d585e5f5ee.png)

部署完成后可以使用 `tcb fn list` 命令查看已经部署完成的函数列表

![tcb fn list 输出的云函数列表，含运行时和更新时间](https://s.poetries.top/uploads/2022/06/d83d3bfc9b7d025b.png)

到这一步，一个 Nest 项目就已经跑在云上了，中间没有碰过一次服务器。这个设计是真的舒服。

### 3.4 环境

环境是云开发里最顶层的隔离单位，一个环境就是一整套独立的数据库、存储、函数和用户体系。做多套环境（开发、测试、生产）本质就是建多个环境 ID，配置文件里换一下就行。

**查看所有环境**

```
tcb env list
```

![tcb env list 输出的环境列表，含环境 ID、别名和套餐](https://s.poetries.top/uploads/2022/06/417413944366f8e2.png)

这个命令是排查「项目怎么不见了」的第一步。列表里没有你要的环境，八成就是地域切错了，回控制台顶部把地域换过来再看。

**安全域名**

> 当您需要在网页应用中使用云开发的身份验证服务时，您需要将您的网站的域名（发起请求的页面的域名）加入安全域名名单中。安全域名是云开发服务认可的用户请求来源域名，所有来自非安全域名名单中的请求都不会被响应。

这个东西是本地开发阶段最容易忘的一步。你在 `localhost:8080` 上调 `@cloudbase/js-sdk`，请求直接被拒，控制台看到跨域报错，第一反应是代码写错了，其实只是域名没进白名单。本地开发记得把 `localhost` 也加进去。

使用下面的命令查看所有配置的安全域名

```
tcb env domain list
```

![tcb env domain list 输出的已配置安全域名清单](https://s.poetries.top/uploads/2022/06/efa5ad40c4f22218.png)

新增安全域名

```
# 添加一个域名
tcb env domain create www.xxx.com

# 添加多个域名
tcb env domain create www.domain1.com/www.domain2.com/www.domain3.com
```

多个域名用 `/` 分隔，这个分隔符挺反直觉的，不是逗号也不是空格，第一次写很容易搞错。

删除安全域名

```
tcb env domain delete
```

![tcb env domain delete 交互式勾选要删除的安全域名](https://s.poetries.top/uploads/2022/06/0f6c3726e168a64b.png)

删除是交互式的，命令敲下去之后会列出现有域名让你勾，不用记完整域名。

**登录方式**

> 当您需要使用云开发的身份验证服务时，您需要配置您想使用的登录方式。目前云开发支持自定义登录、微信公众平台、微信开放平台登录等多种登录方式。

```
# 您可以使用下面的命令列出环境配置的登录方式列表，查看环境配置的登录方式，以及相关的状态。

tcb env login list
```

![tcb env login list 输出的登录方式列表及启用状态](https://s.poetries.top/uploads/2022/06/0afa72546600b36a.png)

您可以使用下面的命令新建登录方式：

```
tcb env login create
```

> 您需要选择配置的平台，登录方式状态，以及对应的 AppId 和 AppSecret，登录方式请选择启用。在添加方式时不会校验 AppId 和 AppSecret 的有效性，只有在请求时，AppId 和 AppSecret 才会被校验，所以请确保您添加的 AppId 和 AppSecret 是有效的。

「添加时不校验，请求时才校验」这句话得留心。你把 AppSecret 敲错一个字符，命令行会告诉你创建成功，等到用户真去登录的时候才会失败，而且报错信息不一定指得清楚。配完最好立刻拿真实账号走一遍登录流程验证。

![tcb env login create 交互式选择登录平台并填写 AppId 和 AppSecret](https://s.poetries.top/uploads/2022/06/14072565a7df9cfc.png)

修改登录方式

> 您也可以使用 `tcb env login update` 修改已经配置的登录方式，如切换启用状态，修改 AppId 和 AppSecret。

![tcb env login update 修改已配置登录方式的交互界面](https://s.poetries.top/uploads/2022/06/4c5a0f883f8093dd.png)

各种登录方式在客户端具体怎么调，第四节会一个一个展开写代码，这里先把服务端的开关配好。

#### 动态变量

写死在配置文件里的环境 ID 和密钥，只要项目一多环境就是灾难。动态变量就是为了把这些值抽出去。

> 在 `cloudbaserc.json` 中声明 `"version": "2.0"` 即可启用新的特性，新版配置文件只支持 JSON 格式


```js
// 动态变量特性允许在 `cloudbaserc.json` 配置文件中使用动态变量，从环境变量或其他数据源获取动态的数据。使用 `{{}}` 包围的值定义为动态变量，可以引用数据源中的值。如下所示
{
  "version": "2.0",
  "envId": "envId",
  "functionRoot": "./functions",
  "functions": [
    {
      "name": "{{variable}}"
    }
  ]
}
```

上面这段配置里，函数名不再写死，而是从数据源里取。数据源是什么？就是下面要讲的 `.env` 文件。

#### 环境变量

CloudBase 支持使用 `.env` 类型文件作为主要数据源，使用不同的后缀区分不同的阶段、场景，如 `.env.development` 可以表示开发阶段的配置，`.env.production` 可以表示生产环境的配置

> 当指定 `--mode [mode]` 时，会再加载 `.env.[mode]` 文件，并按照如下的顺序合并覆盖同名变量：`.env.[mode] > .env.local > .env` 即 `.env.[mode]` 中的同名变量会覆盖 `.env.local` 和 `.env` 文件中的同名变量

> 当使用 `tcb framework deploy --mode test` 命令时，会自动加载 `.env`，`.env.local` 以及 `.env.test` 等三个文件中的环境变量合并使用。

这套覆盖顺序跟 Vite、Vue CLI 的约定基本一致，用过前端脚手架的话不用重新记。优先级从高到低是 `.env.[mode]`、`.env.local`、`.env`，越具体的越晚加载、越先生效。

我们建议你将秘钥等私密配置放在 `.env.local` 文件中，并将 `.env.local` 加入 `.gitignore` 配置中

如 `.env.local` 文件中存在以下变量

```
DB_HOST = localhost
DB_USER = root
DB_PASSWORD = s1mpl3
```

则可以在配置文件中使用

```js
{
  "version": "2.0",
  "envId": "xxx",
  "functionRoot": "./functions",
  "functions": [
    {
      "name": "test",
      "envVariables": {
        "PASSWORD": "{{env.DB_PASSWORD}}"
      }
    }
  ]
}
```




这里补一句安全上的提醒。`.env.local` 一旦漏进 git 历史，光删文件是没用的，得改密钥。我的习惯是建仓库的第一件事就把 `.env.local` 写进 `.gitignore`，而不是等有了密钥再补。

### 3.5 云函数操作

云函数是云开发里承载业务逻辑的地方，这一节篇幅最长，因为配置项确实多。建议先看完配置表，再看部署、触发器、日志这几块。

#### 函数配置cloudbaserc.json

`cloudbaserc.json` 是整个项目的中枢，下面这份带注释的完整配置基本覆盖了日常能用到的所有字段，可以当模板直接抄。

参考配置

```js
// https://docs.cloudbase.net/cli/functions/configs
// https://docs.cloudbase.net/cli-v1/functions/configs
{
  // version 表示当前配置文件的版本，目前支持的版本号有："2.0"。当 version 字段不存在时，默认当前配置文件为 "1.0" 版本。
  "version": "",
  // 关联环境 ID
  "envId": "dev-xxxx",
  "functionRoot": "./functions", // 云函数函数代码存放的文件夹路径，相对于根目录的路径。
  // region 指定了当前环境的地域信息，上海地域的环境可以不填，其他地域的环境则必须填写。
  "region": "",
  // 函数配置项组成的数组
  "functions": [
    {
      // functions 文件夹下函数文件夹的名称，即函数名
      "name": "app",
      // 超时时间，单位：秒 S
      "timeout": 5,
      // 环境变量
      "envVariables": {
        "key": "value"
      },
      // 私有网络配置，如果不使用私有网络，可不配置
      "vpc": {
        // vpc id
        "vpcId": "vpc-xxx",
        // 子网 id
        "subnetId": "subnet-xxx"
      },
      // 运行时，目前可选运行包含：Nodejs8.9, Nodejs10.15, Php7, Java8
      // 此参数可以省略，默认为 Nodejs10.15
      "runtime": "Nodejs10.15",
      // 是否云端安装依赖，仅支持 Node.js 项目
      "installDependency": true,
      // 函数触发器，说明见文档: https://cloud.tencent.com/document/product/876/32314
      "triggers": [
        {
          // name: 触发器的名字
          "name": "myTrigger",
          // type: 触发器类型，目前仅支持 timer （即定时触发器）
          "type": "timer",
          // config: 触发器配置，在定时触发器下，config 格式为 cron 表达式
          "config": "0 0 2 1 * * *"
        }
      ],
      // 函数处理入口，Node.js 和 PHP 项目可以省略，默认值为 index.main
      // 因 Java 的 handler 配置较为特殊，所以当运行时为 Java 时，handler 不能省略
      // 如：package.Class::mainHandler
      "handler": "index.main",
      // functions:invoke 本地触发云函数时的调用参数
      "params": {},
      // 部署/更新云函数时忽略的文件
      "ignore": [
        // 忽略 markdown 文件
        "*.md",
        // 忽略 node_modules 文件夹
        "node_modules",
        "node_modules/**/*"
      ]
    }
  ]
}
```

下面为目前所有支持的配置项

| 配置项            | 是否必填 | 类型                                                         | 描述                                                         |
| ----------------- | -------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| name              | 是       | String                                                       | 云函数名称，即为函数部署后的名称                             |
| params            | 否       | Object/JSONObject                                            | CIL 调用云函数时的函数入参                                   |
| triggers          | 否       | [`Array`](https://docs.cloudbase.net/cli-v1/functions/configs#cloudfunctiontrigger) | 触发器配置                                                   |
| handler           | 否       | String                                                       | 函数处理方法名称，名称格式支持「文件名称.函数名称」形式        |
| ignore            | 否       | `String/Array<String>`                                       | 部署/更新云函数代码时的忽略文件，支持 glob 匹配规则          |
| timeout           | 否       | Number                                                       | 函数超时时间（1 - 60S）                                      |
| envVariables      | 否       | Object                                                       | 包含环境变量的键值对对象                                     |
| vpc               | 否       | [VPC](https://docs.cloudbase.net/cli-v1/functions/configs#vpc) | 私有网络配置                                                 |
| runtime           | 否       | String                                                       | 运行时环境配置，可选值： `Nodejs8.9, Nodejs10.15 Php7, Java8` |
| memorySize        | 否       | Number                                                       | 函数内存，默认值为 256，可选 128、256、512、1024、2048       |
| installDependency | 否       | Boolean                                                      | 是否云端安装依赖，目前仅支持 Node.js                         |
| codeSecret        | 否       | String                                                       | 代码加密秘钥，格式为 36 位大小写字母、数字                   |

- **注：`runtime` 默认为 `Nodejs10.15`，使用 Node.js 运行时可不填，使用 Php 和 Java 则必填。**
- **启用代码加密后，将无法在小程序 IDE、腾讯云控制台中查看云函数的代码和信息**

这张表里有三个字段值得单独说说。

`timeout` 上限只有 60 秒，这是我最先撞到的墙。云函数不是拿来跑长任务的，导出报表、批量处理这类活儿要么拆成多次调用，要么改用云托管容器。默认值 5 秒对纯查询接口够用，稍微复杂一点的逻辑记得往上调。

`installDependency` 决定依赖是本地打包上传还是云端安装。开着它，`node_modules` 不用进包，上传快很多，而且能拿到跟运行时匹配的原生模块编译结果。关掉的话，你在 macOS 上编译的二进制依赖传到 Linux 上大概率跑不起来。

`ignore` 支持 glob，默认就该把 `node_modules` 和 `.git` 排掉。`fn deploy` 的包体上限是 50 MB，超了直接失败，多数超限都是这两个目录没排干净。

`runtime` 这里列的是 2022 年那会儿的可选值，`Nodejs10.15` 现在已经很老了，官方陆续上了更新的 Node 运行时。具体有哪些版本以你控制台的下拉框为准，我没在最新版本上逐个验证过。

**CloudFunctionTrigger**

| 名称   | 是否必填 | 类型   | 描述                                                  |
| ------ | -------- | ------ | ----------------------------------------------------- |
| name   | 是       | String | 触发器名称                                            |
| type   | 是       | String | 触发器类型，可选值：timer                             |
| config | 是       | String | 触发器配置，在定时触发器下，config 格式为 cron 表达式 |

**VPC**

| 名称     | 是否必填 | 类型   | 描述        |
| -------- | -------- | ------ | ----------- |
| vpcId    | 是       | String | VPC Id      |
| subnetId | 是       | String | VPC 子网 Id |

**更新函数运行时配置**

> 创建函数式，Cloudbase CLI 会为函数提供一些默认的配置，所以您不需要添加配置信息也可以直接部署函数。您也可以通过下面的命令修改函数的运行时配置

```
# 更新 app 函数的配置
tcb fn config update app

# 更新配置文件中所有函数的配置信息
tcb fn config update
```

目前支持修改的函数配置包含超时时间 `timeout`、环境变量 `envVariables`、运行时 `runtime`，vpc网络以及 `installDependency` 等选项。

CloudBase CLI 会从配置文件中读取函数的配置信息并更新，CloudBase CLI 会更新配置文件中存在的函数的所有配置，暂不支持指定更新单个配置选项。

最后一句是个容易被忽略的行为。它是「全量覆盖」而不是「增量更新」，配置文件里没写的字段会被重置回默认值。所以你在控制台手动调过的超时时间，跑一次 `fn config update` 就没了。要么全部配置都收进 `cloudbaserc.json` 以文件为准，要么就别混着改，两边同时维护迟早出事。

#### 部署

> `fn deploy` 命令部署函数的文件大小总计不能超过 `50 M`，否则可能会部署失败。

在一个包含 `cloudbaserc.json` 配置文件的项目下，您可以直接使用下面的命令部署云函数：

```
tcb fn deploy <functionName>
```

使用 `fn deploy` 时，`functionName` 选项是可以省略的，当 `functionName` 省略时，Cloudbase CLI 会部署配置文件中的全部函数：

```bash
# 部署配置文件中的全部函数
tcb fn deploy
```

全部参数

```
Usage: tcb fn deploy [options] [name]

部署云函数

Options:
  -e, --envId <envId>         环境 Id
  --code-secret <codeSecret>  传入此参数将保护代码，格式为 36 位大小写字母和数字
  --force                     如果存在同名函数，上传后覆盖同名函数
  --path <path>               自动创建HTTP 访问服务访问路径
  --all                       部署配置文件中的包含的全部云函数
  --dir <dir>                 指定云函数的文件夹路径
  -h, --help                  查看命令帮助信息
```

**默认选项**

Cloudbase CLI 为 Node.js 云函数提供了默认选项，您在部署 Node.js 云函数时可以不用指定云函数的配置，使用默认配置即可部署云函数。

云函数默认配置：

```json
{
  // 超时时间 5S
  "timeout": 5,
  // 运行时
  "runtime": "Nodejs10.15",
  // 自动安装依赖
  "installDependency": true,
  // 处理入口
  "handler": "index.main",
  // 忽略 node_modules 目录
  "ignore": ["node_modules", "node_modules/**/*", ".git"]
}
```

**deploy 命令做了啥**

`fn deploy` 会读取 `cloudbaserc.json` 文件中指定函数的配置，并完成以下几项工作

- 将函数打包成压缩文件，并上传函数代码。
- 部署函数配置，包括超时时间、网络配置等。
- 部署函数触发器。

记住这三件事，后面区分 `fn deploy` 和 `fn code update` 的时候会用上。前者是「代码 + 配置 + 触发器」三件套全推，后者只推代码。日常改业务逻辑用后者更快也更安全，不会误伤线上配置。

#### 管理云函数

函数一多，光靠控制台翻页面就很难受了，下面这几个命令基本能覆盖日常的增删查。

- 您可以使用下面的命令列出所有云函数，查看函数的基本信息：

```
tcb fn list
```

![tcb fn list 输出的函数列表，包含函数名、运行时、状态和更新时间](https://s.poetries.top/uploads/2022/06/7f14d68f7629334e.png)

- 指定返回条数和偏移量

> 默认情况下，`fn list` 命令只会列出前 `20` 个函数，如果您的函数较多，需要列出其他的函数，您可以通过下面的选项指定命令返回的数据长度以及数据的偏移量：

```
-l, --limit <limit>    返回数据长度，默认值为 20
-o, --offset <offset>  数据偏移量，默认值为 0
```

```
# 返回前 10 个函数的信息
tcb fn list -l 10
# 返回第 3 - 22 个函数的信息（包含 3 和 22）
tcb fn list -l 20 -o 2
```

- 下载云函数代码

```
tcb fn code download <functionName> [destPath]
```

默认情况下，函数代码会下载到 `functionRoot` 下，以函数名称作为存储文件夹，您可以指定函数存放的文件夹地址，函数的所有代码文件会直接下载到指定的文件夹中。

这个命令在接手别人的项目、或者本地代码丢了的时候很救命。注意它会覆盖同名目录，下载前先确认本地没有未提交的改动。

![tcb fn code download 执行过程中的下载进度输出](https://s.poetries.top/uploads/2022/06/d3b9aed0b63bb50b.png)
![下载完成后本地生成的云函数代码目录结构](https://s.poetries.top/uploads/2022/06/c4dc431bcd542129.png)

- 查看函数详情

```
# 查看 vue-echo 函数的详情
tcb fn detail vue-echo
```

![tcb fn detail 输出的单个函数详情，含内存、超时、环境变量等配置](https://s.poetries.top/uploads/2022/06/2437d329c6b5e767.png)

`fn detail` 打出来的是云端的真实配置，跟你本地 `cloudbaserc.json` 里写的不一定一致。怀疑「配置没生效」的时候，用它对一遍就清楚了。

- 删除函数

```
# 删除 app 函数
tcb fn delete app

# 删除配置文件中的所有的函数
tcb fn delete
```

- 复制函数

```
# 复制 app 函数为 app2 函数
tcb fn copy app app2
```

`fn copy` 我主要用来做灰度：把线上函数复制一份改个名，新逻辑先发到副本上验证，确认没问题再覆盖正式的那个。比直接改线上稳妥。

注意 `tcb fn delete` 不带函数名时会删掉配置文件里的**所有**函数，这个默认行为挺危险的，手快敲个回车就没了。生产环境上养成带函数名的习惯。

#### 触发器

写接口之外，另一类常见需求是定时任务，比如每天凌晨清理过期数据、每小时同步一次第三方数据。这时候就轮到触发器上场。

触发器是按照一定规则触发函数的模块的抽象，CloudBase 云函数目前仅支持定时触发器。

> 如果云函数需要定时/定期执行，即定时触发，您可以使用云函数定时触发器。已配置定时触发器的云函数，会在相应时间点被自动触发，函数的返回结果不会返回给调用方。

```js
{
  "version": "2.0",
  "envId": "xxx",
  "functions": [
    {
      // triggers 字段是触发器数组，目前仅支持一个触发器，即数组只能填写一个，不可添加多个
      "triggers": [
        {
          // name: 触发器的名字，规则见下方说明
          "name": "myTrigger",
          // type: 触发器类型，目前仅支持 timer （即定时触发器）
          "type": "timer",
          // config: 触发器配置，在定时触发器下，config 格式为 cron 表达式，规则见下方说明
          "config": "0 0 2 1 * * *"
        }
      ]
    }
  ]
}
```

**创建函数触发器**

```
# 创建 app 函数配置的触发器
tcb fn trigger create app
```

> Cloudbase CLI 会自动读取 `cloudbaserc.json` 文件中指定函数配置的定时触发器，并创建云函数触发器。如果配置文件中没有包含触发器配置，则会创建失败。

这里要跟上面代码块里的注释对齐一下：`triggers` 虽然写成数组，但一个函数目前只支持配置一个定时触发器，数组里塞多个是不生效的。一个触发器包含了以下 3 个主要信息：`name`, `type`, `config`

```js
{
  // name: 触发器的名字，规则见下方说明
  "name": "myTrigger",
  // type: 触发器类型，目前仅支持 timer （即定时触发器）
  "type": "timer",
  // config: 触发器配置，在定时触发器下，config 格式为 cron 表达式
  "config": "0 0 2 1 * * *"
}
```

当没有指定函数名时，Cloudbase CLI 会创建 `cloudbaserc.json` 文件包含的所有函数的所有触发器

**删除函数触发器**

```
# 删除 app 函数的名为 trigger 的触发器
tcb fn trigger delete app trigger
```

> 当没有指定函数名时，Cloudbase CLI 会删除 `cloudbaserc.json` 文件包含的所有函数的所有触发器。当只指定了函数名时，Cloudbase CLI 会删除指定函数的所有触发器，当同时指定了函数名称和触发器名称时，Cloudbase CLI 只会删除指定的触发器。

```bash
# 删除 cloudbaserc.json 文件中所有函数的所有触发器
tcb fn trigger delete

# 删除函数 app 的所有触发器
tcb fn trigger delete app

# 删除函数 app 的触发器 trigger
tcb fn trigger delete app trigger
```

**触发器规则**

- 定时触发器名称（name） ：最大支持 `60` 个字符，支持 `a-z`, `A-Z`, `0-9`, `-` 和 `_`。必须以字母开头，且一个函数下不支持同名的多个定时触发器。
- 定时触发器触发周期（config）：指定的函数触发时间。填写自定义标准的 Cron 表达式来决定何时触发函数。有关 Cron 表达式的更多信息，请参考以下内容。

这里最容易翻车的是 Cron 表达式的位数。云开发用的是**七位** Cron，比 Linux crontab 的五位多了「秒」和「年」两位。你把 crontab 里那句 `0 2 * * *` 直接抄过来，它不会报错，但触发时间完全不是你想的那个。

Cron 表达式有七个必需字段，按空格分隔。其中，每个字段都有相应的取值范围：

| 排序   | 字段 | 值                                                           | 通配符    |
| ------ | ---- | ------------------------------------------------------------ | --------- |
| 第一位 | 秒   | 0 - 59 的整数                                                | `, - * /` |
| 第二位 | 分钟 | 0 - 59 的整数                                                | `, - * /` |
| 第三位 | 小时 | 0 - 23 的整数                                                | `, - * /` |
| 第四位 | 日   | 1 - 31 的整数（需要考虑月的天数）                            | `, - * /` |
| 第五位 | 月   | 1 - 12 的整数或 JAN、FEB、MAR、APR、MAY、JUN、JUL、AUG、SEP、OCT、NOV 和 DEC | `, - * /` |
| 第六位 | 星期 | 0 - 6 的整数或 MON、TUE、WED、THU、FRI、SAT 和 SUN，其中 0 指周日，1 指星期一，以此类推 | `, - * /` |
| 第七位 | 年   | 1970 - 2099 的整数                                           | `, - * /` |


**通配符**

| 通配符        | 含义                                                         |
| ------------- | ------------------------------------------------------------ |
| `，`（逗号）  | 代表取用逗号隔开的字符的并集。例如：在「小时」字段中 1，2，3 表示 1 点、2 点和 3 点 |
| `-`（短横线） | 包含指定范围的所有值。例如：在「日」字段中，1 - 15 包含指定月份的 1 号到 15 号 |
| `*`（星号）   | 表示所有值。在「小时」字段中，`*` 表示每个小时                 |
| `/`（正斜杠） | 指定增量。在「分钟」字段中，输入 1/10 以指定从第一分钟开始的每隔十分钟重复。例如，第 11 分钟、第 21 分钟和第 31 分钟，以此类推 |

> !在 Cron 表达式中的「日」和「星期」字段同时指定值时，两者为「或」关系，即两者的条件均生效。

**下面列举一些 `Cron` 表达式和相关含义：**

- `*/5 * * * * * *` 表示每 5 秒触发一次
- `0 0 2 1 * * *` 表示在每月的 1 日的凌晨 2 点触发
- `0 15 10 * * MON-FRI *` 表示在周一到周五每天上午 10:15 触发
- `0 0 10,14,16 * * * *` 表示在每天上午 10 点，下午 2 点，下午 4 点触发
- `0 */30 9-17 * * * *` 表示在每天上午 9 点到下午 5 点内每半小时触发
- `0 0 12 * * WED *` 表示在每个星期三中午 12 点触发

对照着这几个例子数一下位数，七位就对了。还有一点，云函数的定时触发走的是服务端时区，别拿本机时间去推算触发时刻，配完之后看一次实际日志的时间戳最保险。

#### 代码更新

当您的函数代码发生改变时，您可以使用下面的命令更新您的云函数的代码：

```bash
# 更新 app 函数的代码
tcb fn code update app
```

> `fn code update` 命令和 `fn deploy` 命令的主要区别是：`fn code update` 命令只会更新函数的代码以及执行入口，不会修改函数的其他配置，而 `fn deploy` 命令则会修改函数的代码、配置以及触发器等。

#### 函数版本

您可以通过下面的命令查看函数版本：

```
tcb fn list-function-versions <name>
```

![tcb fn list-function-versions 输出的函数版本列表](https://s.poetries.top/uploads/2022/06/88eb3713574d7f1b.png)

版本这块的价值在于回滚。线上出问题的时候，能定位到是哪一次发布引入的，比对着 git 记录瞎猜要快。

#### 函数日志

函数跑在云上，`console.log` 打到哪儿去了？答案是云端日志，用下面的命令能直接在终端里看，不用切到控制台。

您可以通过下面的命令打印云函数的运行日志，使用此命令时必须指定函数的名称：

```
# 查看 vue-echo 函数的调用日志
tcb fn log vue-echo
```

![tcb fn log 输出的云函数调用日志，含耗时、内存占用和请求 ID](https://s.poetries.top/uploads/2022/06/8f3777524f8f6e77.png)

默认情况下，Cloudbase CLI 会打印最近的 20 条日志，您可以通过在命令后附加下面的可用选项指定返回日志的筛选条件：

```
-i, --reqId <reqId>  函数请求 Id
-o, --offset <offset>                        数据的偏移量，Offset + Limit不能大于10000
-l, --limit <limit>                          返回数据的长度，Offset + Limit不能大于10000
--order <order>                              以升序还是降序的方式对日志进行排序，可选值 desc 和 asc
--orderBy <orderBy>                          根据某个字段排序日志,支持以下字段：function_name,duration, mem_usage, start_time
--startTime <startTime>                      查询的具体日期，例如：2019-05-16 20:00:00，只能与endtime 相差一天之内
--endTime <endTime>                          查询的具体日期，例如：2019-05-16 20:59:59，只能与startTime 相差一天之内
-e, --error                                  只返回错误类型的日志
-s, --success                                只返回正确类型的日志
```

如：`tcb fn log app -l 2` 打印 `app` 函数的最新 2 条日志信息

这堆参数里我用得最多的是 `-e` 和 `--reqId`。线上报错的时候，先 `-e` 把错误日志筛出来，拿到 `reqId` 再用 `-i` 精确定位那一次调用的完整上下文。`--startTime` 和 `--endTime` 限制了只能相差一天以内，查更早的日志得分段查。

#### 部署示例

前面讲的都是单个命令，串起来跑一遍是这样的。

- 编写`cloudbaserc.json文件`

![编辑器中编写好的 cloudbaserc.json 配置文件内容](https://s.poetries.top/uploads/2022/06/705a1f9853edda3a.png)

```json
{
  "version": "2.0",
  "envId": "poetry-prod-xx",
  "functionRoot": "./cloudfunctions",
  "functions": [
    {
      "name": "vue-echo",
      "timeout": 5,
      "runtime": "Nodejs10.15",
      "installDependency": true
    }
  ]
}
```

注意 `functionRoot` 这里写的是 `./cloudfunctions`，函数名 `vue-echo` 必须跟这个目录下的文件夹名一模一样，否则 CLI 找不到代码。名字对不上是新手最常见的部署失败原因。

- 部署，执行以下命令，部署指定函数名称

```
tcb fn deploy vue-echo
```

![tcb fn deploy 部署单个函数时的打包与上传输出](https://s.poetries.top/uploads/2022/06/840a923b27e4ee59.png)

- 查看已部署的函数

```
tcb fn list
```

![部署完成后 tcb fn list 中出现的 vue-echo 函数](https://s.poetries.top/uploads/2022/06/7f14d68f7629334e.png)

一条命令，函数就上去了，这是云函数工作流最短的一条路。真正做项目的时候你会更常用第五节的 `framework deploy`，它把前端、函数、数据库一起推，不用一个个 `fn deploy`。

### 3.6 静态网站托管

> 云开发为开发者提供静态网页托管的能力，静态资源（HTML、CSS、JavaScript、字体等）的分发由对象存储 COS 和拥有多个边缘网点的 CDN 提供支持。您可在腾讯云控制台进行静态网站的部署，提供给您的用户访问。目前云开发静态网页托管能力仅在腾讯云云开发控制台支持，小程序 IDE 侧控制台暂不支持。

仅有付费方式为按量付费的环境可开通静态网页托管能力，预付费方式环境不可开通。

使用 CLI 操作静态网站服务前请先到[云开发控制台开通静态网站服务](https://console.cloud.tencent.com/tcb)。

**全量部署**

> 云开发 CLI 提供了直接部署网站文件的命令，在您需要部署的文件夹目录下，直接运行 `tcb hosting deploy` 命令即可将当前目前下所有的文件部署静态网站中。

```bash
# dist 构建目录
cd dist
# 部署全部文件
tcb hosting deploy -e envId
```

留意这里先 `cd dist` 再执行，因为 `hosting deploy` 部署的是**当前目录**。在项目根目录直接跑，会把 `node_modules`、`src` 一股脑传上去。

![tcb hosting deploy 上传 dist 目录文件到静态托管的过程](https://s.poetries.top/uploads/2022/06/cd6fa613aa0ba32c.png)

**您可以使用下面的命令展示静态网站的状态，访问域名等信息**

对应的命令是 `tcb hosting detail -e envId`，输出里包含默认域名，拿到就能直接在浏览器里打开验证。

![tcb hosting 状态输出，包含默认访问域名和服务状态](https://s.poetries.top/uploads/2022/06/08f8a4eed05f40c3.png)

默认给的是 `xxx.tcloudbaseapp.com` 这种域名，能直接用，但要绑自定义域名的话得去控制台配，还要备案。这块我只在默认域名上验证过。

**删除文件**

您可以使用下面的命令删除静态网站的存储空间中的文件或文件夹

```
# cloudPath 为文件或文件夹的相对根目录的路径，为 目录/文件名 的形式，如 index.js、static/css/index.js 等

tcb hosting delete cloudPath -e envId
```

**删除全部文件**

云端路径为空时，表示删除全部文件

```
tcb hosting delete -e envId
```

**查看文件列表**

您可以使用下面的命令部署展示静态网站存储空间中文件

```
tcb hosting list -e envId
```

![tcb hosting list 输出的静态托管文件列表](https://s.poetries.top/uploads/2022/06/68112e40d3a20d26.png)

关于「云端路径为空即删除全部」这个设计，说实话我第一次看到有点心慌。`tcb hosting delete -e envId` 少打一个参数就清空整站，而且没有二次确认。建议在脚本里永远显式写路径，别图省事。

静态托管这块还有个隐藏坑：CDN 有缓存。你部署完刷新页面看到的还是旧内容，别急着怀疑部署失败，先去控制台刷一下缓存，或者用带 hash 的文件名让浏览器自然失效。

## 四、云开发登录鉴权

> CloudBase 提供跨平台的登录鉴权功能，您可以基于此为自己的应用构建用户体系，包括但不限于：

- 为用户分配全局唯一的身份标识 uid；
- 储存和管理用户个人信息；
- 关联多种登录方式；
- 管理用户对数据、资源的访问权限；
- 用户行为的收集和分析。

> 同时，CloudBase 登录鉴权还是保护您的服务资源的重要手段，CloudBase 对用户端发来的每一个请求，都会进行身份和权限的检查，避免您的资源被恶意攻击者消耗或者盗用。

第二段那句「保护服务资源」比第一段更实在。你的云函数和数据库是按调用量计费的，没有鉴权就等于把计费入口暴露给全网，被人写脚本刷一晚上，账单很好看。所以哪怕你的应用不需要用户体系，也建议至少开个匿名登录把请求约束住。

### 4.1 登录鉴权

先看整体模型，后面的六种登录方式都是在这套模型上换了个入口而已。

![CloudBase 登录鉴权的整体流程示意图](https://s.poetries.top/uploads/2022/06/015d7200d6f0ed7b.png)

> 每个登录 CloudBase 的用户，都有一个对应的 CloudBase 账号，用户通过此账号访问调用 CloudBase 的数据与资源。

- 每个账号都有全局唯一的 UID，即账号 ID，作为用户的唯一身份标识
- 每个账号可以添加、修改用户信息
- 每个账号除了最初的登录方式之外，还可以关联其它登录方式

第三条是这套设计里最实用的一点。用户第一次进来可以匿名登录直接开始用，产生了数据之后再引导他绑手机号或微信，账号是同一个，数据不会丢。这个「先用后注册」的路径对转化率的帮助很大，后面 4.2 的匿名登录会具体讲怎么转正。

**登录状态的持久化**

您可以指定登录状态如何持久保留。默认为 `local`，相关选项包括

![登录状态持久化的三种可选值 local、session、none 及其说明](https://s.poetries.top/uploads/2022/06/aafc37032a793f1c.png)

例如，对于网页应用，最佳选择是 `local`，即在用户关闭浏览器之后仍保留该用户的会话。这样，用户不需要每次访问该网页时重复登录，避免给用户带来诸多不便体验。

反过来，在公共电脑上用的后台管理系统，用 `session` 更合适，关掉标签页登录态就没了。选哪个取决于你的场景对便利和安全的取舍，没有通用答案。

**访问令牌与刷新令牌**

用户登录 CloudBase 之后，会获得访问令牌（`Access Token`） 作为访问 `CloudBase` 的凭证，访问令牌默认具有两小时有效期。

登录时还会获得刷新令牌（Refresh Token），默认有效期 30 天，用于访问令牌过期后，获取新的访问令牌。

CloudBase 用户端 SDK 会自动维护令牌的刷新和有效期，开发者无需特别关注此流程。

> 匿名登录 的刷新令牌（`Refresh Token`）会在到期后自动续期，以实现长期的匿名登录状态。

双 token 这套机制本身没什么新鲜的，跟大多数 OAuth 实现一个路数。值得高兴的是 SDK 全给你封好了，续期、失效重试都不用管。我一开始还专门写了个拦截器处理 401 重试，后来发现纯属多余。

**获取当前登录的用户**

拿当前用户有两种姿势，回调式和属性式，用哪种取决于你什么时候需要这个值。



- 订阅登录状态变化的回调函数

> 获取当前用户，推荐在 `Auth` 对象上设置一个回调函数，每当用户登录状态转变时，会触发这个回调函数，并且获得当前的 `LoginState`：

```js
import cloudbase from "@cloudbase/js-sdk";

const app = cloudbase.init({
  env: "your-env-id"
});
const auth = app.auth();

// 设置一个观察者
auth.onLoginStateChanged((loginState) => {
  if (loginState) {
    // 此时用户已经登录
  } else {
    // 没有登录
  }
});
```

这个回调最适合放在应用初始化的地方，比如 React 的顶层 `useEffect` 里，或者 Vue 的 `App.vue` 挂载时。用户登录、登出、token 续期这些时刻它都会触发一次，把它跟你的全局状态绑一起就行。

- 直接获取当前用户

> 您还可以使用 `Auth.currentUser` 属性来获取当前登录的用户。如果用户未登录，则 `currentUser` 为 null

这种同步读法适合在点击事件里用，你确定此刻登录流程已经跑完了。要是在页面刚加载时读，很可能拿到 `null`，因为 SDK 还没从本地缓存里恢复登录态。这个我踩过，表现是刷新页面头像闪一下就没了。

```js
const user = auth.currentUser;

if (user) {
  // 此时用户已经登录
} else {
  // 没有登录
}
```

**获取用户个人资料**

> 您可以通过 `User` 对象的各个属性来获取用户的个人资料信息：

```js
const user = auth.currentUser;
let uid, nickName, gender, avatarUrl, location;

if (user) {
  // 云开发唯一用户 id
  uid = user.uid;

  // 昵称
  nickName = user.nickName;

  // 性别
  gender = user.gender;

  // 头像URL
  avatarUrl = user.avatarUrl;

  // 用户地理位置
  location = user.location;
}
```

**更新用户个人资料**

您可以使用 `User.update` 方法来更新用户的个人资料信息。例如：

```js
const user = auth.currentUser;

user
  .update({
    nickName: "Tony Stark",
    gender: "MALE",
    avatarUrl: "https://..."
  })
  .then(() => {
    // 更新用户资料成功
  });
```

`update` 接受的字段是固定那几个，昵称、性别、头像、地区。业务自己的字段（会员等级、积分之类）不要往这里塞，另开一个数据库集合用 `uid` 关联，扩展起来才不难受。

**刷新用户资料信息**

对于一个多端应用，用户可能在其中某个端上更新过自己的个人资料信息，此时其它端上可能需要刷新信息：

```js
const user = auth.currentUser;

// 刷新用户信息
user.refresh().then(() => {
  // 刷新后，获取到的用户信息即为最新的信息
  const { nickName, gender, avatarUrl } = user;
});
```


#### 账户关联

回到前面说的「先用后注册」。账户关联就是实现它的接口，把当前这个账号跟另一种登录方式绑上，绑完之后两种方式登进来都是同一个 uid，历史数据完整保留。

下面四种关联方式的套路是一致的：先用现有身份登录，再调对应的 `link` 方法。

**关联微信登录**

- 用户以任意一种登录方式（除微信登录）登录云开发
- 获取 Provider：

```js
const auth = app.auth();
const provider = auth.weixinAuthProvider({
  appid: "....",
  scope: "snsapi_base"
});
```

- 重定向到提供方的页面进行登录：

```js
auth.currentUser.linkWithRedirect(provider);
```

用户在微信的页面登录之后，会被重定向回您的页面。然后，可以在页面加载时通过调用 `Provider.getLinkRedirectResult()` 来获取关联结果：

```js
const provider = auth.weixinAuthProvider();

provider.getLinkRedirectResult().then((result) => {
  // 关联成功
});
```

**关联自定义登录**

- 用户以任意一种登录方式（除自定义登录）登录云开发；
- 使用 `User.linkWithTicket`，获取自定义登录 `Ticket` 后，关联自定义用户：

```js
const auth = app.auth();
const ticket = "......"; // 自定义登录 Ticket
auth.currentUser.linkWithTicket(ticket).then((result) => {
  // 关联成功
});
```

**关联邮箱密码登录**

- 用户以任意一种登录方式登录云开发
- 更新用户的密码：

```js
const auth = app.auth();
auth.currentUser.updatePassword(password).then(() => {
  // 设置密码成功
});
```

- 更新用户的邮箱，用户点击验证邮件之后，便关联成功：

```js
auth.currentUser.updateEmail(email).then(() => {
  // 发送验证邮件成功
});
```

**关联用户名密码登录**

- 用户以任意一种登录方式（除匿名登录）登录云开发：

```js
// 以邮箱登录为例
await app.auth().signInWithEmailAndPassword(email, password);
```

- 绑定登录的用户名：

```js
await app.auth().currentUser.updateUsername(username); // 绑定用户名
```

- 绑定成功后，便可以使用用户名密码登录：

```js
const loginState = await app.auth().signInWithUsernameAndPassword(username, password); // 用户名密码登录
```

这里有个跨方法的坑：用户名登录和邮箱登录共用同一个密码。也就是说 `updatePassword` 改了密码，两个入口都跟着变。做「修改密码」功能的时候记得在文案上说清楚，不然用户会以为只改了其中一个。

另外注意匿名登录不能直接关联用户名密码，得先关联到别的正式方式（邮箱、微信）之后才行。

#### 最佳实践

**避免重复登录**

> 执行登录流程之前，我们非常建议您先判断用户端是否已经登录 CloudBase，如已经登录，那么不需要执行登录流程，以避免无意义的重复登录。

```js
const auth = app.auth();

// 应用初始化时
if (auth.hasLoginState()) {
  // 此时已经登录
} else {
  // 此时未登录，执行您的登录流程
}
```

**登录状态的持久保留**

> 对于网页应用，最佳选择是 `local`，即在用户关闭浏览器之后仍保留该用户的会话。这样，用户不需要每次访问该网页时重复登录，避免给用户带来诸多不便体验

```js
const auth = app.auth({
  persistence: "local"
});
```

`hasLoginState()` 这个判断真的要加。我见过不少代码在每个页面的 `onMounted` 里无脑调一次登录，用户切几个页面就多几次网络请求，还可能触发风控。判断一下几乎不花成本。

### 4.2 登录方式

云开发支持的登录方式有六种，我按「接入成本从低到高」的顺序过一遍。共同点是：都要先去控制台把对应开关打开，再在客户端调 SDK，两步缺一不可。

#### 匿名登录

> 登录 腾讯云 CloudBase 控制台，在 [登录授权页面中](https://console.cloud.tencent.com/tcb/env/login)，将匿名登录一栏打开或关闭。

![云开发控制台登录授权页面中的匿名登录开关](https://s.poetries.top/uploads/2022/06/e95ddf99a0e2939c.png)

**添加安全域名（可选）**

Web 应用需要将域名添加到 CloudBase 控制台的[Web 安全域名](https://console.cloud.tencent.com/tcb/env/safety)列表中，否则将被识别为非法来源：

![云开发控制台的 Web 安全域名配置列表](https://s.poetries.top/uploads/2022/06/3404d8f9e5a8d4cf.png)

这张安全域名的截图后面还会出现两次，因为每一种登录方式都要过这一关。第一次配好之后就不用重复操作了。

开关打开、域名配好，客户端就三行代码的事。

```js
import cloudbase from '@cloudbase/js-sdk';

const app = cloudbase.init({
  env: 'xxxx-yyy';
});

const auth = app.auth();

async function login(){
  await auth.anonymousAuthProvider().signIn();
  // 匿名登录成功检测登录状态isAnonymous字段为true
  const loginState = await auth.getLoginState();
  console.log(loginState.isAnonymousAuth); // true
}

login();
```

顺手提一句，上面 `cloudbase.init` 那个参数对象里 `env` 后面跟了个分号，是原始笔记里的手误，实际写代码那个位置要用逗号，或者干脆省略。另外判断匿名状态读的字段是 `loginState.isAnonymousAuth`，注释里写的 `isAnonymous` 是简称，以代码里那个为准。

![浏览器控制台打印出匿名登录成功后的 loginState 对象](https://s.poetries.top/uploads/2022/06/b34c3d3acc92627a.png)

可以看到token缓存到了本地

![浏览器 Application 面板中 CloudBase 写入本地存储的 token 缓存](https://s.poetries.top/uploads/2022/06/501a1e7be7791960.png)

这就是 `persistence: 'local'` 的效果，token 落在本地存储里，刷新页面登录态还在。清掉浏览器数据它就没了，对应的匿名账号也就找不回来了。

> 每个 `CloudBase` 环境的匿名用户数量不超过 `1000` 万个

匿名用户在安全规则中的`auth.loginType`值为`ANONYMOUS`，配合安全规则可以限制匿名用户的 云数据库 和 云存储 的访问权限。比如下述代码展示的安全规则为：

- 云数据库匿名用户不可读写；
- 云存储所有用户可读，匿名用户不可写。

![安全规则中通过 auth.loginType 限制匿名用户读写权限的配置示例](https://s.poetries.top/uploads/2022/06/f49d51410d41a7e2.png)

安全规则这套东西值得单独花时间看官方文档。它是写在服务端的表达式，客户端绕不过去，比在前端做权限判断可靠得多。`auth.loginType` 就是用来区分「这个请求是哪种身份发起的」。

**转化为正式用户**

- 如果用户在匿名状态下产生了一些私有数据（例如游戏中获取了个人成就和装备），想将此匿名账号转化为正式账号长久持有。
- 针对这种需求，您可以 将匿名账号与任意一种登录方式关联，关联后，便可以永久使用该种登录方式登录 CloudBase，达成「匿名账号转正」的效果。详情请参考：账户关联。

**问题**

- 匿名登录与未登录有什么区别？

![匿名登录与未登录在身份标识、数据归属和安全规则上的差异对比](https://s.poetries.top/uploads/2022/06/d8b255edaee3b012.png)

这两个概念我一开始也搞混过。区别在于有没有 uid：匿名登录是有账号的，有唯一 uid，能存私有数据、能转正；未登录是彻底没身份，所有人共用一套权限，数据没法归属到人。要做「游客也能收藏」这种功能，得用匿名登录，不能用未登录。

- 匿名登录的用户达到上限后怎么办？

> CloudBase 限制每个环境的匿名用户数量不超过 1000 万个，如果达到上限可以在 CloudBase 控制台 的「用户管理」页面查看匿名用户的活跃情况，针对长期不登录的匿名用户可以考虑将其删除以释放空间。

- 匿名用户是否会过期？

> CloudBase 对匿名用户的有效期限策略是：每个设备同时只存在一个匿名用户，并且此用户永不过期。当然，如果用户手动清除了设备或浏览器的本地数据，那么匿名用户的数据便会被同步清除，再次调用 CloudBase 匿名登录 API 会产生一个新的匿名用户。


#### 未登录

接着上面那个对比往下说。未登录模式适合的是纯展示型的内容，比如官网的文章列表、公开的商品目录，这些数据谁看都一样，没必要给每个访客建账号。

> CloudBase 允许客户端在未登录的情况下调用 CloudBase 的资源，开发者可以配合安全规则限制未登录对资源的访问权限。

登录 云开发 CloudBase 控制台，在 [登录授权](https://console.cloud.tencent.com/tcb/env/login) 中，将未登录一栏打开或关闭。

![云开发控制台登录授权页面中的未登录开关](https://s.poetries.top/uploads/2022/06/46c9989ef1cea582.png)

**添加安全域名（可选）**

Web 应用需要将域名添加到 CloudBase 控制台的[Web 安全域名](https://console.cloud.tencent.com/tcb/env/safety)列表中，否则将被识别为非法来源：

![云开发控制台的 Web 安全域名配置列表](https://s.poetries.top/uploads/2022/06/3404d8f9e5a8d4cf.png)

**使用流程**

1. 设置自定义安全规则，放通未登录访问

您需要使用自定义安全规则，来放通未登录模式下的资源访问。

> 基于安全性的考虑，基础的四种权限设置下，均不允许未登录进行访问。

如，您可以这样设置云数据库的权限：

```
{
    "read": "doc._openid==auth.openid || auth == null"
}
```

在原始私有读 `doc._openid==auth.openid` 的基础上，允许了所有未登录用户进行读资源。详细可查看 [编写安全规则](https://docs.cloudbase.net/rule/rule-example)。

规则里的 `auth == null` 就是「未登录」的判定条件。注意这条规则只放开了 `read`，没给 `write`，这是应该的，未登录能写数据基本等于开放数据库给全网。

![云开发控制台中自定义安全规则的编辑界面](https://s.poetries.top/uploads/2022/06/4bf8025e0f47dce5.png)

2. 初始化 SDK 发起调用

```js
import cloudbase from '@cloudbase/js-sdk';

const app = cloudbase.init({
  env: 'xxxx-yyy';
});
```

SDK 初始化完成后可以正常发起云开发资源的调用。

注意这里没有任何 `signIn` 调用，`init` 完直接就能查数据。这是未登录模式跟其他五种最大的区别。

![未登录模式下直接发起数据库查询并成功返回数据](https://s.poetries.top/uploads/2022/06/c81cf50a598dd81f.png)

#### 邮箱登录

从这里开始就是真正的账号体系了。邮箱登录的好处是不用接第三方，坏处是要自己准备一个能发信的 SMTP 邮箱。

> 使用邮箱登录，您可以让您的用户使用自己的邮箱和密码注册、登录 CloudBase，并且还可以更新登录使用的邮箱和密码。

**开通邮箱登录**

1. 开启邮箱登录

进入 云开发 CloudBase 控制台，在 登录授权 设置页面中，开启邮箱登录:

![云开发控制台登录授权页面中开启邮箱登录](https://s.poetries.top/uploads/2022/06/bdff32d173347663.png)

2. 配置发件邮箱

> 填入您邮箱的 SMTP 账号信息

![配置 SMTP 发件邮箱的服务器地址、端口和账号密码](https://s.poetries.top/uploads/2022/06/d5760279a4e8d4b9.png)

SMTP 这一步最费时间。用 QQ 邮箱或者 163 的话，密码填的不是登录密码而是「授权码」，要先去邮箱设置里开 SMTP 服务再生成。填错的表现是注册接口成功但用户永远收不到邮件，很难排查，因为前端拿到的是成功响应。

3. 设置应用名称及自动跳转链接

打开右侧「应用配置」页面，设置您的应用名称和自动跳转链接。

- 您设置的应用名称将会出现在验证邮件的内容中；
- CloudBase 发送的邮件中会包含一个 URL，用户打开邮件中的 URL 后，会自动跳转到您设置的自动跳转链接。

![设置应用名称与邮件验证后的自动跳转链接](https://s.poetries.top/uploads/2022/06/75fe3a786ac2f19b.png)

跳转链接建议指向一个专门的「激活成功」页面，而不是首页。用户点完邮件里的链接落到首页上，根本不知道自己激活成功没有。

**登录流程**

1. 初始化 SDK

```js
import cloudbase from "@cloudbase/js-sdk";

const app = cloudbase.init({
  env: "your-env-id"
});
```

2. 使用邮箱注册账号

首先需要用户填入自己的邮箱和密码，然后调用 SDK 的注册接口：

```js
app
  .auth()
  .signUpWithEmailAndPassword(email, password)
  .then(() => {
    // 发送验证邮件成功
  });
```

调用注册接口之后，`CloudBase` 会使用您预先设置的邮箱，发送一封验证邮件到用户的邮箱。邮件中包含一个激活链接，用户在点击激活链接后，账号才会正式注册成功。

> 密码强度要求:密码长度不小于 8 位，不大于 32 位，需要包含字母和数字。

这个强度规则前端最好也校验一遍，别等服务端返回错误再提示。8 到 32 位、必须含字母和数字，用一个正则就够了。

![用户收到的 CloudBase 账号激活验证邮件](https://s.poetries.top/uploads/2022/06/8dfd1a122cf97ef9.png)

可以看到注册成功的账户

![云开发控制台用户管理列表中新注册的邮箱账户](https://s.poetries.top/uploads/2022/06/88c3a1a2a39dab05.png)

用户管理这个页面平时排查问题很有用，能看到每个账号的登录方式、创建时间和最近活跃。用户说「我注册了登不上」，先来这里看有没有这个账号、是不是没激活。

3. 使用邮箱+密码登录 CloudBase

```js
app
  .auth()
  .signInWithEmailAndPassword(email, password)
  .then((loginState) => {
    // 登录成功
  });
```

![邮箱密码登录成功后控制台打印的 loginState](https://s.poetries.top/uploads/2022/06/3dbf8e6a924809df.png)

要提醒的是，没点激活链接的账号调登录会失败。这个中间态挺容易被忽略，注册完记得在页面上明确告诉用户「去邮箱点一下链接」，否则他会以为注册失败又注册一次。

#### 微信授权登录

经微信授权的网页应用可以直接使用微信登录 CloudBase，包括两种授权类型：

- 微信公众平台（公众号网页）；
- 微信开放平台（普通网站应用及移动应用等）

**开通流程**

1. 开通平台账号

首先需要一个微信公众平台 / 开放平台的注册账号，如果没有，请前往 [微信公众平台](https://mp.weixin.qq.com/) 或 [微信开放平台申请](https://open.weixin.qq.com/)

然后在微信公众平台/开放平台的管理后台中，查看开发者 ID（AppId）和开发者密码（AppSecret）。

以微信公众平台为例，在「开发 - 基本配置」中有以下内容：

![微信公众平台开发基本配置页面中的 AppId 和 AppSecret](https://s.poetries.top/uploads/2022/06/d9590e7139fec14a.png)

> 开发者密码（AppSecret）是非常私密的信息，每次点击上图中的「重置」按钮都会获取一个新的 AppSecret。

重置这个动作是不可逆的，旧的立刻失效。线上正在跑的服务如果还在用旧 secret，重置的瞬间全部登录失败。手别抖。

2. 开启微信登录

![云开发控制台登录授权页面中启用微信登录](https://s.poetries.top/uploads/2022/06/c6f20fd79e5cf432.png)

点击启用按钮后在弹窗的对应位置填入 AppId 和 AppSecret。

3. 添加安全域名（可选）

Web 应用需要将域名添加到 CloudBase 控制台的[Web 安全域名](https://console.cloud.tencent.com/tcb/env/safety)列表中，否则将被识别为非法来源：

![云开发控制台的 Web 安全域名配置列表](https://s.poetries.top/uploads/2022/06/3404d8f9e5a8d4cf.png)

除了云开发这边的安全域名，微信公众平台那边还有一个「网页授权域名」要配，两个是不同的东西，都得配。少配一个的表现是跳转到微信授权页时报「redirect_uri 参数错误」。

**微信登录流程**

在使用微信登录 CloudBase 前，请先在控制台中 [启用微信登录](https://docs.cloudbase.net/authentication/method/wechat-login#%E5%BC%80%E9%80%9A%E6%B5%81%E7%A8%8B)。

1. 初始化 SDK

```js
import cloudbase from "@cloudbase/js-sdk";

const app = cloudbase.init({
  env: "your-env-id"
});
```

2. 使用 SDK 处理登录流程

创建 Provider：首先我们创建一个 Provider 实例，并且填入参数：

```js
const auth = app.auth();

const provider = auth.weixinAuthProvider({
  appid: "...",
  scope: "xxxx"
});
```

![创建微信 Provider 时 appid 与 scope 参数说明](https://s.poetries.top/uploads/2022/06/befa9164c6b90b3f.png)

`scope` 这个参数决定了你能拿到什么。`snsapi_base` 静默授权，用户无感知，但只能拿到 openid；`snsapi_userinfo` 会弹授权页，用户点同意之后能拿到昵称和头像。要显示用户头像就得用后者，只做身份识别用前者体验更好。

- 如果用户使用 `snsapi_userinfo` 或 `snsapi_login` 登录，并且是首次登录，那么 CloudBase 将会自动拉取、同步微信的用户基本信息。
- 如果用户不是首次登录，将不会有此行为。

使用 Provider 进行登录

> 首先调用 `Provider.signInWithRedirect()`，用户将会跳转到微信 OAuth 授权页面：

```
provider.signInWithRedirect();
```

在授权页面内，需要用户对登录行为进行授权，成功后，会返回至当前页面。

然后调用 `Provider.getRedirectResult()`，获取登录结果：

```js
provider.getRedirectResult().then((loginState) => {
  if (loginState) {
    // 登录成功！
  }
});
```

这个「跳走再跳回来」的模式，实现上有个细节要注意：`getRedirectResult()` 必须在页面加载时无条件调用一次，因为你分不清这次加载是用户正常访问还是从微信授权页跳回来的。它内部会检查 URL 上有没有 code 参数，没有就返回空，有就换取登录态。

还有就是页面状态会丢。用户点登录之前填了一半的表单，跳一圈回来全没了，需要自己用 sessionStorage 或者 URL 参数把状态带过去。

#### 自定义登录

前面几种都是用云开发自带的账号体系。要是你已经有一套用户系统（老项目迁移过来的那种），就该用自定义登录了。

> 开发者可以使用自定义登录，在自己的服务器或者云函数内，为用户签发带有自定义身份 ID 的自定义登录凭证 Ticket，随后用户端 SDK 便可以使用 Ticket 登录 CloudBase。

自定义登录一般用于下面几种场景：

- 开发者希望将自有的账号体系与云开发 CloudBase 账号进行一对一关联；
- 开发者希望自行接管鉴权流程。

自定义登录需要以下几个步骤：

- 获取 CloudBase 自定义登录私钥；
- 使用 CloudBase 服务端 SDK，通过私钥签发出 Ticket，并返回至用户端；
- 用户端 SDK 使用 Ticket 登录 CloudBase。

1. 获取自定义登录私钥

> 登录 CloudBase 控制台，在 [环境 -> 登录授权](https://console.cloud.tencent.com/tcb/env/login)下的自定义登录栏中，点击「私钥下载」或者「私钥复制」：

![云开发控制台登录授权页面下载自定义登录私钥](https://s.poetries.top/uploads/2022/06/0d8163e0ab3193ec.png)

> 私钥是一份携带有 JSON 数据的文件，请将下载或复制的私钥文件保存到您的服务器或者云函数中，假设路径为`/path/to/your/tcb_custom_login.json`。

- 私钥文件是证明管理员身份的重要凭证，请务必妥善保存，避免泄漏；
- 每次生成私钥文件都会使之前生成的私钥文件在 2 小时后失效。

这个私钥只能待在服务端，绝对不能打进前端包里。它等价于「可以给任何人签发身份」的权限，泄漏了整套账号体系就废了。另外那个 2 小时的宽限期设计得挺贴心，重新生成私钥不会立刻打断线上服务，你有两小时的窗口去完成替换。

2. 签发 Ticket

调用 CloudBase 服务端 SDK，在初始化时传入自定义登录私钥，随后便可以签发出 Ticket，并返回至用户端

```js
const cloudbase = require("@cloudbase/node-sdk");

// 1. 初始化 SDK
const app = cloudbase.init({
  env: "your-env-id",
  // 传入自定义登录私钥
  credentials: require("/path/to/your/tcb_custom_login.json")
});

// 2. 开发者自定义的用户唯一身份标识
const customUserId = "your-customUserId";

// 3. 创建ticket
const ticket = app.auth().createTicket(customUserId);

// 4. 将ticket返回至客户端
return ticket;
```

> 开发者也可以编写一个云函数用于生成 Ticket，并为其设置 HTTP 访问服务，随后用户端便可以通过 HTTP 请求的形式获取 Ticket，详细的方案请参阅 [使用 HTTP 访问云函数](https://docs.cloudbase.net/service/access-cloud-function)。

这段代码的关键是 `customUserId`，它是你自己系统里的用户 ID。签发出来的 ticket 相当于一句「我担保这个人是 xxx」，客户端拿着它换云开发的登录态，两套账号体系就这样对上了。

customUserId 必须满足以下需求：

- 4-32 位字符；
- 字符只能是大小写英文字母、数字、以及 `_-#@(){}[]:.,<>+#~` 中的字符。

注意长度下限是 4 位。老系统里用自增整数 ID 的话，前几个用户会因为 ID 太短直接卡住，得加个前缀补齐，比如 `user_1`。这种细节文档里就一行字，实际撞上了要排查半天。

3. 使用 Ticket 登录 CloudBase

> 用户端应用获取到 Ticket 之后，便可以调用客户端 SDK 提供的 `auth.signInWithTicket()` 登录 CloudBase：

```js
import cloudbase from '@cloudbase/js-sdk';

const app = cloudbase.init({
  env: 'your-env-id'
});

const auth = app.auth();

async function login(){
  const loginState = await auth.getLoginState();
  // 1. 建议登录前检查当前是否已经登录
  if(!loginState){
    // 2. 请求开发者自有服务接口获取ticket
    const ticket = await fetch('...');
    // 3. 登录 CloudBase
    await auth.customAuthProvider().signIn(ticket);
  }
}

login();
```

![使用 ticket 登录成功后返回的 loginState 信息](https://s.poetries.top/uploads/2022/06/bf6484c27c260614.png)

**自定义登录一定需要自己搭建用于创建 Ticket 的服务器吗？**

- 自定义登录必须有一个创建 Ticket 的服务，但是开发者并非一定要自己搭建服务器。
- 开发者还可以编写一个云函数来创建 Ticket，然后客户端使用 HTTP 请求调用这个云函数获取 Ticket，详细请参阅 [使用 HTTP 访问云函数](https://docs.cloudbase.net/service/access-cloud-function)


#### 用户名密码登录

- 使用用户名密码登录，您可以让您的用户绑定用户名，并使用用户名密码登录 CloudBase。您可以更改用户名和密码，还可以查询用户名是否绑定过。
- 如果用户名未被绑定过，需要先使用其他登录方式完成登录后，才可以绑定用户名。绑定成功后，可以使用用户名和密码完成登录。

第二条是关键限制：**用户名不能独立注册，只能在已登录状态下绑定**。所以你没法做一个纯用户名密码的注册页，必须先有邮箱或者微信之类的入口。这个设计我一开始挺不理解，后来想想是为了保证每个账号都有一个可找回的凭证，光有用户名密码，忘了就真找不回来了。

进入 云开发 CloudBase 控制台，在 登录授权 设置页面中，开启用户名密码登录:

![云开发控制台登录授权页面中开启用户名密码登录](https://s.poetries.top/uploads/2022/06/6d0258075bf46615.png)

**绑定用户名流程**

1. 初始化 SDK

```js
import cloudbase from "@cloudbase/js-sdk";

const app = cloudbase.init({
  env: "your-env-id"
});
```

2. 使用其他方式进行登录

绑定用户名之前，用户需要先使用其他方式进行登录，例如邮箱登录、微信公众号登录等，但不包括匿名登录

下面以邮箱登录为例：

```js
const auth = app.auth();
await auth.signInWithEmailAndPassword(email, password); // 邮箱登录
```

![先用邮箱方式登录成功，为后续绑定用户名做准备](https://s.poetries.top/uploads/2022/06/acd1fb389d6c9a6d.png)

3. 绑定用户名

绑定用户名时，可以检查在当前云开发环境下，此用户名是否存在。然后再调用绑定用户名的接口

```js
const auth = app.auth();
if (!(await auth.isUsernameRegistered(username))) {
  // 检查用户名是否绑定过
  await auth.currentUser.updateUsername(username); // 绑定用户名
}
```

**使用用户名+密码登录 CloudBase**

```js
const auth = app.auth();
const loginState = await auth.signInWithUsernameAndPassword(username, password); // 用户名密码登录
```

> 注意：用户名登录和邮箱登录的密码是相同的

`isUsernameRegistered` 这个预检查建议保留。直接调 `updateUsername` 撞名会抛错，抛错的体验肯定不如提前告诉用户「这个名字被占了」。

#### 短信验证码登录

国内产品用得最多的其实是这个。手机号即账号，用户教育成本最低。

> 使用短信验证码登录，您可以让用户使用自己的手机号，结合短信验证码或密码注册、登录 CloudBase，并且还可以更新或者解绑登录使用的手机号。

**开通短信验证码登录**

![云开发控制台登录授权页面中开启短信验证码登录](https://s.poetries.top/uploads/2022/06/e4eac02d22f679e0.png)

短信是要花钱的，而且有免费额度限制，超了按条计费。上线前记得在发送接口上加频率限制，同一个号码 60 秒内只能发一次，否则被人写脚本刷，账单和运营商投诉一起来。

**登录流程**

1. 初始化 SDK

```js
import cloudbase from "@cloudbase/js-sdk";

const app = cloudbase.init({
  env: "your-env-id"
});
```

2. 使用手机号注册账号

> 首先需要用户填入自己的手机号，然后调用 SDK 的发送短信验证码接口：

```js
app
  .auth()
  .sendPhoneCode(phoneNumber)
  .then(() => {
    // 发送短信验证码
  });
```

> 调用发送短信接口后，手机将会收到云开发的短信验证码。用户填入短信验证码，以及自定义密码后，调用注册账号接口

```js
app
  .auth()
  .signUpWithPhoneCode(phoneNumber, phoneCode, password)
  .then(() => {
    // 手机短信注册账号
  });
```

3. 使用手机号 + 密码 or 手机号 + 短信验证码登录 CloudBase

```js
app
  .auth()
  .signInWithPhoneCodeOrPassword({
    phoneNumber,
    phoneCode, // 非必填，验证码和密码至少二选一
    password // 非必填，验证码和密码至少二选一
  })
  .then((loginState) => {
    // 登录成功
  });
```

`signInWithPhoneCodeOrPassword` 这个接口把两种登录方式合并了，`phoneCode` 和 `password` 二选一。做 UI 的时候可以做成一个「验证码登录 / 密码登录」的切换，底层调同一个接口，省事。

六种登录方式过完了。实际项目里我的选法是：C 端产品用短信或微信，B 端后台用用户名密码或邮箱，已有账号体系的用自定义登录，需要「游客先玩」的叠一个匿名登录。

## 五、CloudBase Framework一体化部署（推荐方式）

前面第三节那套 `tcb fn deploy` 加 `tcb hosting deploy` 的组合，问题在于你得记住先部署什么后部署什么，前端构建、函数上传、数据库建集合是三条独立的命令。项目一复杂，部署脚本就变成一堆手工步骤。

Framework 就是来收拾这个局面的。你在 `cloudbaserc.json` 里声明「我有一个 Vue 前端、两个云函数、三个数据库集合」，剩下的交给 `tcb framework deploy` 一条命令。

> 文档地址 https://docs.cloudbase.net/framework/index

> CloudBase Framework 是云开发官方出品的云原生一体化部署工具，可以帮助开发者将静态网站、后端服务和小程序等应用，一键部署到云开发 Serverless 架构的云平台上，自动伸缩且无需关心运维，聚焦应用本身，无需关心底层配置和资源。

这一节是全文最值得看的部分。真上手做项目，你 90% 的时间都在跟它打交道。

### 5.1 云开发应用介绍

> 云开发应用可以理解为运行在云开发环境的应用，例如一个包含前后端、数据库等能力等服务，可以通过一键部署，直接部署在云开发环境中，使用云开发底层的各项 Serverless 资源，享受弹性免运维的优势。

![云开发应用的整体构成示意图，前端、后端服务与数据库都跑在云开发环境里](https://s.poetries.top/uploads/2022/06/40bd0c9ceadc339e.png)

一个云开发应用可以拆解为三个部分，包括代码、声明式配置和环境变量信息。

![云开发应用拆解为代码、声明式配置和环境变量三部分](https://s.poetries.top/uploads/2022/06/7215d3f021c80ef9.png)

这个三段式划分挺重要的。代码进 git，声明式配置也进 git，只有环境变量不进 git。这样同一份代码配同一份配置，换个 `.env` 就能部署到不同环境，这就是后面 5.2 里模式切换的基础。

**如何开发一个云开发应用**

![开发一个云开发应用的完整流程，从初始化到一键部署](https://s.poetries.top/uploads/2022/06/3731b6c2de7002eb.png)

流程图看着步骤不少，实际操作下来核心就两步：写好 `cloudbaserc.json`，然后 `tcb framework deploy`。

### 5.2 cloudbase framework配置文件

> 在使用 CloudBase Framework 之前，您需要需要创建一个 `cloudbaserc.json` 配置文件，`cloudbaserc.json` 文件是 CloudBase CLI 、CloudBase VSCode 插件和 CloudBase 应用的配置文件，配置文件会关系到云开发如何构建和部署您的应用。


默认情况下，使用 `cloudbase init` 初始化项目时，会生成 `cloudbaserc.json` 文件作为配置文件，您也可以使用 `--config-file` 指定其他文件作为配置文件，文件必须满足格式要求。

**CloudBase Framework 配置文件包含以下几类配置信息：**

![cloudbaserc.json 配置文件的四类配置信息结构图](https://s.poetries.top/uploads/2022/06/3e69b0ecfb4b5b1c.png)

下面按图上这四类逐个展开。

1. plugins：描述您的应用依赖哪些 CloudBase Framework 插件，以便根据配置来构建和部署您的应用，应用可以使用多个插件，具体插件配置方式参考下文。

> 目前支持的插件名称请参阅 https://github.com/Tencent/cloudbase-framework#目前支持的插件列表

示例

```js
{
  "framework": {
    "plugins": {
      "client": {
        // 使用的插件 npm 包名，例如 @cloudbase/framework-plugin-website支持指定插件版本，例如@cloudbase/framework-plugin-website@1.3.5
        "use": "@cloudbase/framework-plugin-website",
        // 插件入参配置，不同的插件，支持的入参不同，请查阅对应插件的 README 或者文档
        "inputs": {
          "buildCommand": "npm run build",
          "outputPath": "dist",
          "cloudPath": "/vue"
        }
      },
      "server": {
        "use": "@cloudbase/framework-plugin-function",
        "inputs": {
          "functionRootPath": "cloudfunctions",
          "functions": [{
            "name": "vue-echo"
          }]
        }
      }
    }
  }
}
```

这段配置里 `client` 和 `server` 是你自己起的名字，随便叫，真正决定行为的是 `use` 字段指向的插件包。一个应用挂多个插件，部署时它们按顺序跑，前端和函数一次搞定。

2. 生命周期

有些事情插件覆盖不到，比如 monorepo 项目要先 `lerna bootstrap`，部署完要调个云函数做数据初始化。钩子就是留给这些场景的。

> 配置在构建部署生命周期前后，需要执行的自定义动作

```js
{
  "framework": {
    "hooks": {
       // 前置钩子，在执行 Framework 完整的构建部署动作之前执行的钩子，可以执行一些命令行命令
      "preDeploy": {
        // 前置钩子的类型，目前仅支持 execCommand，表示执行命令行命令
        "type": "execCommand",
        "commands": [// 要执行的 command 命令列表
          "sudo npm install -g lerna",
          "lerna bootstrap"
        ]
      },
      //后置钩子，在执行 Framework 部署之后，在云端调用的钩子，可以调用一些云函数
      "postDeploy": {
        // 后置钩子钩子的类型，目前仅支持 callFunction 代表在云端执行云函数
        "type": "callFunction",
        "functions":[ // 要调用的云函数列表，支持数组，例如
          {
            "functionName": "echo", // 调用的云函数的函数名
            "params": { // 调用云函数的参数信息
              "foo": "bar"
            }
          }
        ]
      }
    }
  }
}
```

两个钩子的执行位置差别很大：`preDeploy` 在**本地**跑 shell 命令，`postDeploy` 在**云端**调云函数。前者能用你机器上的任何工具，后者只能调已经部署好的函数。搞混了会一脸懵，比如想在 `postDeploy` 里执行 `npm run xxx`，是跑不了的。

3. 应用依赖

这部分只在「别人通过控制台一键安装你的应用」时才用得上，自己部署自己的项目可以跳过。

> 在云端一键部署场景下，您需要完善应用依赖配置来声明应用依赖的扩展资源和环境变量参数

```js
  "framework": {
    // 描述项目通过控制台一键安装部署时依赖的其他资源信息、环境变量等业务参数。
    "requirement": {
        // 应用部署过程中用到的外部云上资源，包括 cfs、cynosdb、redis 等
      "addons": [
        {
          "type": "CynosDB",// 资源类型，目前支持 CFS 和 CynosDB
          "name": "wordpress",// 资源名称，只支持 a-z 0-9 和 -
          "envMap": {// 环境变量映射文件，会将云资源产生的 IP 、PORT 通过右侧定义的名称来映射为对应的环境变量名称，并注入环境变
            "IP": "WORDPRESS-IP",
            "PORT": "WORDPRESS-PORT",
            "USERNAME": "WORDPRESS-USERNAME",
            "PASSWORD": "WORDPRESS-PASSWORD"
          }
        }
      ],
      // 应用在构建时和运行时的环境变量配置声明，默认注入计算环境中(云函数、云应用)，也会在云端构建时作为构建部署的环境变量，可以在 cloudbaserc.json 中通过 {{env.ENV_NAME}}引用
      "environment": {
        "SECRET_TOKEN": {
            // 环境变量描述，会在输入时进行提示
          "description": "A secret key for verifying the integrity of signed cookies.",
          "required": true, //是否必填
          "default": "default_value",
          "validation": {// 校验规则配置
            "rule": {//校验规则信息
              "type": "RegExp",//校验规则类型，目前支持"RegExp" 代表正则类型
              "pattern": "[3-9]",//正则的 Pattern
              "flag": "g"//正则的 Flag
            },
            "errorMessage": "数值范围3-9"//校验失败时的错误信息
          }
        }
      }
    }
  }
}
```

4. 模板变量

`requirement` 里那个 `environment` 声明的变量，怎么在配置文件其他地方引用？靠的就是模板变量。

配置文件支持动态变量的特性。在 `cloudbaserc.json` 中声明 `"version": "2.0"` 即可启用。

> 动态变量特性允许在 `cloudbaserc.json` 配置文件中使用动态变量，从环境变量中获取动态的数据。被两层花括号包住的值会被当成动态变量，可以引用数据源中的值，写法参考下面第三步代码块里的 `envId` 字段。

原文这里的示例只写了一层花括号，是笔误，实际语法是两层，下面的完整示例可以对照着看。

- 第一步：在项目根目录下创建 `cloudbaserc.json` 和 `.env` 文件

```
.
├─cloudbaserc.json
├─.env
```

- 第二步：在 .env 文件内添加变量

```
ENV_ID=pro-123
DB_NAME=pro_user
```
- 第三步：在 `cloudbaserc.json` 文件内通过 `env` 注入模板变量

```js
{
  "version": "2.0",
  "envId": "{{env.ENV_ID}}",
  "framework": {
    "name": "node-capp",
    "plugins": {
      "node": {
        "use": "@cloudbase/framework-plugin-node",
        "inputs": {
          "name": "node-capp",
          "path": "/node-capp",
          "platform": "container",
          "containerOptions": {
            "envVariables": {
              "env": "{{env.ENV_ID}}",
              "db": "{{env.DB_NAME}}"
            }
          }
        }
      }
    }
  }
}
```

- 第四步：一键部署应用

```
tcb framework deploy
```

这样一来，环境 ID、数据库名这些跟环境相关的东西全部从 `.env` 里读，配置文件本身就变成了跟环境无关的模板，可以放心提交到仓库。

5. 模式切换

有了模板变量，多环境部署就是换一个 `.env` 文件的事。

假设你已经完成了以上模板变量的配置

- 第一步：在项目根目录额外添加 `.env.dev` 文件

```
.
├─cloudbaserc.json
├─.env
├─.env.dev
```

- 第二步：在 `.env.dev` 文件添加变量

```
ENV_ID=dev-123
DB_NAME=dev_user
```

- 第三步：部署应用时使用 --mode 指定模式

```
cloudbase framework deploy --mode dev
```

不加 `--mode` 就走 `.env`（生产），加 `--mode dev` 就叠上 `.env.dev`（开发）。我一般把生产环境的 ID 放在 `.env` 里，反而是这个默认值最容易误操作，稳妥点的做法是生产也显式写 `--mode prod`，让每一次部署都必须明确说清楚发到哪。

**完整示例**

下面这份是 CloudBase CMS 的真实配置文件，一个应用里同时挂了 website、function、node、database 四个插件，还带 `requirement` 声明。当作「集大成的参考」看就行，不用逐字理解。

```js
// https://docs.cloudbase.net/framework/config
{
  "version": "2.0",
  "envId": "{{env.ENV_ID}}",
  "$schema": "https://framework-1258016615.tcloudbaseapp.com/schema/latest.json",
  "framework": {
    "plugins": {
      "admin": {
        "use": "@cloudbase/framework-plugin-website",
        "inputs": {
          "outputPath": "./packages/admin/dist",
          "installCommand": "echo \"Skip Install\"",
          "buildCommand": "npm run build",
          "cloudPath": "{{env.deployPath}}"
        }
      },
      "init": {
        "use": "@cloudbase/framework-plugin-function",
        "inputs": {
          "functionRootPath": "./packages",
          "functions": [
            {
              "name": "cms-init",
              "timeout": 60,
              "envVariables": {
                "CMS_ADMIN_USER_NAME": "{{env.administratorName}}",
                "CMS_ADMIN_PASS_WORD": "{{env.administratorPassword}}",
                "CMS_OPERATOR_USER_NAME": "{{env.operatorName}}",
                "CMS_OPERATOR_PASS_WORD": "{{env.operatorPassword}}",
                "CMS_DEPLOY_PATH": "{{env.deployPath}}",
                "ACCESS_DOMAIN": "{{env.accessDomain}}"
              },
              "installDependency": true,
              "handler": "index.main"
            }
          ]
        }
      },
      "service": {
        "use": "@cloudbase/framework-plugin-node",
        "inputs": {
          "name": "tcb-ext-cms-service",
          "entry": "app.js",
          "projectPath": "./packages/service",
          "path": "/tcb-ext-cms-service",
          "functionOptions": {
            "timeout": 15,
            "envVariables": {
              "NODE_ENV": "production"
            }
          }
        }
      },
      "db": {
        "use": "@cloudbase/framework-plugin-database",
        "inputs": {
          "collections": [
            {
              "collectionName": "tcb-ext-cms-projects",
              "description": "CMS 系统项目数据（请不要手动修改）",
              "aclTag": "ADMINONLY"
            },
            {
              "collectionName": "tcb-ext-cms-schemas",
              "description": "CMS 系统内容模型数据（请不需要手动修改）",
              "aclTag": "ADMINONLY"
            },
            {
              "collectionName": "tcb-ext-cms-users",
              "description": "CMS 系统系统用户数据，存储 CMS 的用户信息，包括管理员账号信息，角色信息等（请不要手动修改）",
              "aclTag": "ADMINONLY"
            },
            {
              "collectionName": "tcb-ext-cms-webhooks",
              "description": "CMS 系统系统 webhook 集合，存储 CMS 系统的回调接口配置，CMS 系统数据的变更可以通过回调来进行同步 （请不要手动修改）",
              "aclTag": "ADMINONLY"
            },
            {
              "collectionName": "tcb-ext-cms-settings",
              "description": "CMS 系统系统配置集合，存储 CMS 系统的设置（请不要手动修改）",
              "aclTag": "ADMINONLY"
            },
            {
              "collectionName": "tcb-ext-cms-user-roles",
              "description": "CMS 系统系统用户角色配置集合，存储 CMS 系统的自定义用户角色信息（请不要手动修改）",
              "aclTag": "ADMINONLY"
            }
          ]
        }
      }
    },
    "requirement": {
      "addons": [],
      "environment": {
        "administratorName": {
          "description": "管理员账户名，账号名长度需要大于 4 位，支持字母和数字",
          "required": true,
          "default": "admin",
          "validation": {
            "rule": {
              "type": "RegExp",
              "pattern": "[^[a-zA-Z0-9]+[a-zA-Z0-9_-]?[a-zA-Z0-9]+$]",
              "flag": "g"
            },
            "errorMessage": "字母和数字的组合，不能为纯数字，长度范围是 1 ~ 32"
          }
        }
      }
    }
  }
}
```

读这份配置的时候，有几个点值得单独拎出来说。

`$schema` 那一行不是摆设，它指向官方维护的 JSON Schema，VS Code 会据此给你补全和校验。写 `cloudbaserc.json` 的时候能省掉大量翻文档的时间，字段名打错了编辑器直接标红。强烈建议每个项目都加上。

`installCommand` 被设成了 `echo "Skip Install"`，这是 monorepo 项目的常见写法。依赖已经在 `preDeploy` 钩子里用 lerna 统一装好了，插件这一层再装一遍纯属浪费时间。

`database` 插件里那六个集合都带了 `"aclTag": "ADMINONLY"`，也就是「仅管理端可读写」。CMS 的系统表当然不能让客户端直接访问，这个字段就是在声明式地配安全规则，比部署完再去控制台点一遍靠谱。

`requirement.environment` 里的 `validation` 用正则约束管理员账号名的格式。别人在控制台一键安装你的应用时，这段配置会渲染成一个带校验的输入框，`errorMessage` 就是校验失败时的提示文案。做模板应用给别人用的话，这块认真写能省掉很多支持工作。


### 5.3 插件

插件是 Framework 的核心。理解了插件，配置文件就不用死记了，无非是「我这个项目由哪几种东西组成，各挂一个插件」。

插件可以处理应用中的一些独立单元的构建、部署、开发、调试等流程。例如 website 插件可以处理静态网站等单元，node 插件可以处理 koa 、express 等 node 应用。

插件的配置写在 `cloudbaserc.json` 文件中，插件配置可以手动填写，也可以自动生成，具体字段参考各插件自己的文档。

**自动检测生成插件配置**

不知道该配哪个插件的时候，直接让它自己猜。

可以在项目目录下直接运行 `cloudbase` 命令进行自动检测生成插件配置文件并部署

```
cloudbase


✔ 是否使用云开发部署当前项目 <Projects/test/test-vue> ？ (Y/n) · true
✔ 选择关联环境 · webpage - [webpage:按量计费]
   ______ __                   __ ____
  / ____// /____   __  __ ____/ // __ ) ____ _ _____ ___
 / /    / // __ \ / / / // __  // __  |/ __ `// ___// _ \
/ /___ / // /_/ // /_/ // /_/ // /_/ // /_/ /(__  )/  __/
\_________\____/ \__,_/ \__,_//_____/ \__,_//____/ \___/       __
   / ____/_____ ____ _ ____ ___   ___  _      __ ____   _____ / /__
  / /_   / ___// __ `// __ `__ \ / _ \| | /| / // __ \ / ___// //_/
 / __/  / /   / /_/ // / / / / //  __/| |/ |/ // /_/ // /   / ,<
/_/    /_/    \__,_//_/ /_/ /_/ \___/ |__/|__/ \____//_/   /_/|_|


 CloudBase Framework  info     Version v1.2.10
 CloudBase Framework  info     Github: https://github.com/Tencent/cloudbase-framework

 CloudBase Framework  info     EnvId webpage
? 检测到当前项目包含 Vue.js 项目

  🔨 构建脚本 `npm run build`
  📦 本地静态文件目录 `dist`

  是否需要修改默认配置 No
? 请输入应用唯一标识(支持大小写字母数字及连字符, 同一账号下不能相同) test-vue
? 是否需要保存当前项目配置，保存配置之后下次不会再次询问 Yes
 CloudBase Framework  info     📦 install plugins
```

它检测到了 Vue.js 项目，自动推断出构建命令是 `npm run build`、产物目录是 `dist`，一路回车就完事了。对标准脚手架建出来的项目，这个自动检测的准确率相当高。

不过一旦你的项目结构非标准（比如产物输出到 `build` 而不是 `dist`，或者是 monorepo），自动检测就不灵了，还是得手写。

**手动填写插件配置**

```
{
  "framework": {
    "plugins": {
      "client": {
        "use": "@cloudbase/framework-plugin-website",
        "inputs": {
          "buildCommand": "npm run build",
          "outputPath": "dist",
          "cloudPath": "/vue"
        }
      },
      "server": {
        "use": "@cloudbase/framework-plugin-function",
        "inputs": {
          "functionRootPath": "cloudfunctions",
          "functions": [
            {
              "name": "vue-echo"
            }
          ]
        }
      }
    }
  }
}
```

**官方插件列表**

- [@cloudbase/framework-plugin-website 一键部署网站应用](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-website)
- [@cloudbase/framework-plugin-node 一键部署 Node 应用（支持底层部署为函数或者 云托管）](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-node)
- [@cloudbase/framework-plugin-nuxt 一键部署 Nuxt SSR 应用](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-nuxt)
- [@cloudbase/framework-plugin-function 一键部署函数资源](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-function)
- [@cloudbase/framework-plugin-container 一键部署云托管容器服务](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-container)
- [@cloudbase/framework-plugin-database 一键声明式部署云开发 NoSQL 云数据库](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-database)
- [@cloudbase/framework-plugin-deno 一键部署 Deno 应用](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-deno)
- [@cloudbase/framework-plugin-next 一键部署 Next SSR 应用](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-next)
- [@cloudbase/framework-plugin-mp 一键部署微信小程序应用](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-mp)
- [	@cloudbase/framework-plugin-auth 一键设置登录配置](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-auth)

这十个插件不用全记，日常能覆盖 90% 场景的就四个：`website`（前端）、`function`（云函数）、`node`（完整 Node 服务）、`database`（数据库集合）。下面按这个优先级依次讲。

> 常用插件介绍

#### 静态网站插件

> 云开发 CloudBase Framework 框架「Website」插件： 通过云开发 CloudBase Framework 框架将静态网站一键部署云开发环境，提供生产环境可用的 CDN 加速、自动弹性伸缩的高性能网站服务。可以搭配其他插件如 Node 插件、函数插件实现云端一体开发。

- 节约成本: 资源伸缩，弹性扩缩容，灵活计费，极大节约资源成本
- 极简配置：自动检测框架，无须配置，同时支持没有使用框架的纯静态项目
- 框架支持: 无缝支持原生和前端框架构建的项目
  - Vue
  - React
  - Next SPA
  - Nuxt SPA
  - VuePress


> 如果想全新开始一个项目，可以直接执行 init 来从模板开始一个网站项目

```
# 部署
cloudbase framework deploy
```

> cloudbase init 之后会创建云开发的配置文件 cloudbaserc.json，可在配置文件的 plugins 里修改和写入插件配置

website 插件的四个关键参数是 `buildCommand`、`outputPath`、`cloudPath` 和 `ignore`。前两个决定「怎么构建、产物在哪」，`cloudPath` 决定「部署到线上的哪个路径」。`cloudPath` 填 `/vue` 的话，访问地址就是 `你的域名/vue/`，不填默认根目录。多个前端应用共用一个环境的时候，靠这个字段区分。

```js
{
  "envId": "{{envId}}",
  "framework": {
    "plugins": {
      "client": {
        "use": "@cloudbase/framework-plugin-website",
        "inputs": {
          "installCommand": "npm install --prefer-offline --no-audit --progress=false",
          "buildCommand": "npm run build", // 构建命令，如npm run build，没有可不传
          "outputPath": "dist", // 网站静态文件的路径。
          "cloudPath": "/path", // 静态资源部署到云开发环境的路径，默认为根目录。
          "ignore": [".git", ".github", "node_modules", "cloudbaserc.js"] // 静态资源部署时忽略的文件路径，支持通配符
        }
      }
    }
  }
}
```

#### 云函数插件

前端有了，后端接口用云函数插件。它跟第三节讲的 `tcb fn deploy` 是同一套东西，区别是配置写在 `framework.plugins` 下面，能跟前端一起部署。

**功能特性**

- 节约成本: 资源伸缩，弹性扩缩容，灵活计费，极大节约资源成本
- 极简配置：自动检测框架，无须配置
- 语言支持:
  - Node.JS
  - PHP
  - Java

```js
{
  "envId": "{{envId}}",
  "framework": {
    "plugins": {
      "function": {
        "use": "@cloudbase/framework-plugin-function",
        "inputs": {
            // 函数根目录
          "functionRootPath": "./cloudfunctions",
          "publishIncludeList": "{{env.publishIncludeList}}",
          // 云函数默认配置, 配置格式和单个函数配置格式相同
          "functionDefaultConfig": {
            "timeout": 5,
            "envVariables": {
              "FOO": "bar"
            },
            "runtime": "Nodejs10.15",
            "memorySize": 128
          },
          // 函数配置数组，每个函数的配置格式要求如下：
          "functions": [
            {
                // 云函数名称，即为函数部署后的名称
              "name": "helloworld",
              "envVariables": {// 包含环境变量的键值对对象
                "ABC": "xyz"
              }
            }
          ],
          // 服务路径配置
          "servicePaths": {
            "helloworld": "/helloworld"
          }
        }
      }
    }
  }
}
```

这里两个字段值得留意。`functionDefaultConfig` 是所有函数的默认配置，单个函数里再写就覆盖它，函数一多能省掉大量重复。`servicePaths` 是给函数配 HTTP 访问路径的，配了之后云函数就能直接用 URL 调，不需要走 SDK，做 webhook 回调的时候必须用它。

#### 登录鉴权插件

第四节讲的那些登录开关，都可以用这个插件声明式地配掉，不用手动去控制台点。

> 云开发 CloudBase Framework 框架「登录配置」插件： 通过云开发 CloudBase Framework 框架一键设置环境下的登录配置。

- 支持未登录、匿名登录登录设置
- 后续会支持开放平台、公众号、账号密码等其他登录方式配置

能力上确实有限，2022 年那会儿只覆盖了未登录和匿名登录两种，微信、邮箱这些还是得手动配。这个「后续会支持」的说法是当时文档里的原话，现在支持到什么程度我没跟进验证过，以官方文档为准。

```js
// https://docs.cloudbase.net/framework/plugins/framework-plugin-auth
{
  "envId": "YOU_ENV_ID",
  "framework": {
    "plugins": {
      "auth": {
        "use": "@cloudbase/framework-plugin-auth",
        "inputs": {
          "configs": [
            {
              "platform": "NONLOGIN",
              "status": "ENABLE"
            }
          ]
        }
      }
    }
  }
}
```

#### 云数据库插件

数据库集合手动建也就点几下，但换个环境就得重来一遍，而且很容易漏。用插件声明出来，新环境部署一次就全有了。

> 云开发 CloudBase Framework 框架「Database」插件： 通过云开发 CloudBase Framework 框架一键配置云开发数据库集合、索引，使用高性能的 Serverless 化的 NoSQL 数据库服务。可以搭配其他插件如 Website 插件、Node 插件实现云端一体开发。

```js
// https://docs.cloudbase.net/framework/plugins/framework-plugin-database
{
  "envId": "{{envId}}",
  "framework": {
    "plugins": {
      "client": {
        "use": "@cloudbase/framework-plugin-database",
        "inputs": {
          "collections": [
            {
              "collectionName": "test-collection", //集合名称
              "description": "test", // 描述信息
            }
          ]
        }
      }
    }
  }
}
```

留意上面这段 JSON 里 `"description": "test",` 后面多了个尾逗号，标准 JSON 是不允许的。官方示例里的注释也是同理，`cloudbaserc.json` 实际支持带注释的 JSON5 风格写法，但你要是用 `JSON.parse` 自己读这个文件就会炸，写脚本处理它的时候注意一下。

#### 微信小程序插件

> 云开发 CloudBase Framework 框架「小程序」插件： 通过云开发 CloudBase Framework 框架一键部署微信小程序应用。

```js
// https://docs.cloudbase.net/framework/plugins/framework-plugin-mp
{
  "envId": "{{envId}}",
  "framework": {
    "plugins": {
      "client": {
        "use": "@cloudbase/framework-plugin-mp",
        "inputs": {
          "appid": "",//必填，小程序应用的 appid
          //选填，小程序应用的部署私钥内容，需要经过 base64 编码 可以使用 小程序部署密钥转换小工具 来转换为 Base64
          // https://framework-1258016615.tcloudbaseapp.com/mp-key-tool/
          "privateKeyPath": "",
          "localPath": "./",
          "ignores": ["node_modules/**/*"],
          "deployMode": "preview",
          "previewOptions": {
            "desc": "CloudBase Framework 一键预览",
            "setting": {
              "es6": true
            },
            "qrcodeOutputPath": "./qrcode.jpg",
            "pagePath": "pages/index/index"
          }
        }
      }
    }
  }
}
```

> 默认模板的 appid 和 privateKeyPath 为空，需要开发者填入

这个插件能把小程序代码上传到微信后台，`deployMode` 填 `preview` 生成预览二维码，填 `upload` 直接传成体验版。放进 CI 就是一套小程序的自动化发布。私钥要先在微信公众平台生成，再用官方那个转换工具转成 Base64，这一步文档里给了链接，就在上面代码块的注释里。

#### Node 插件

前面的 function 插件适合零散的接口函数。要是你的后端是一个完整的 Koa、Express 或者 Nest 工程，用 node 插件更合适。

它最有意思的地方是 `platform` 这个字段，同一份代码，填 `function` 就部署成云函数，填 `container` 就部署成云托管容器，改一个字符切换底层形态。

> 云开发 CloudBase Framework 框架「Node.js App」插件： 通过云开发 CloudBase Framework 框架将 Node 应用一键部署云开发环境，提供自动弹性伸缩的高性能 Node 应用服务，支持底层部署为函数或者 云托管，可以搭配其他插件如 Website 插件、函数插件实现云端一体开发。

**功能特性**

- 无须关心底层架构: 只需要开发业务服务，不用适配函数或者容器
- 节约成本: 资源伸缩，弹性扩缩容，灵活计费，极大节约资源成本
- 框架支持: 无缝支持原生和前端框架构建的项目
  - 原生 Node.js
  - Express
  - Koa

如果目前已有 Node 应用项目

```
cloudbase
```

如果想全新开始一个项目，可以直接执行 init 来从模板开始一个项目

```
cloudbase init
```

```js
// https://docs.cloudbase.net/framework/plugins/framework-plugin-node
{
  "envId": "{{envId}}",
  "framework": {
    "plugins": {
      "server": {
        "use": "@cloudbase/framework-plugin-node",
        "inputs": {
        // 默认app.js
        // Node 服务入口文件，相对于projectPath,需要导出 app 或者 server 的实例，同时也支持导出异步获取 app 的 tcbGetApp 方法，方法的返回值为 app 或者 server 的实例。
          "entry": "app.js",
          "path": "/nodeapp", // 必填，访问子路径，如 /node-app
          "name": "nodeapp", // 必填，服务名，如node-app
          "projectPath": "", // 选填，指定 Node 服务所在目录，相对于当前项目根目录
          "buildCommand": "", // 选填，指定构建命令，比如npm run build
          "platform": "", // 选填，底层使用平台，支持 container（ 云托管） 和 function （云函数）, 默认是 function
          "containerOptions": {// 选填，当 platform 选择 container 时，可以支持自定义更多高级设置，例如 CPU 内存等
            "cpu": 2,
            "mem": 2,
          },
          "functionOptions": {
                "timeout": 5,
                "envVariables": {
                    "TEST_ENV": 1
                },
                "vpc": {
                    "vpcId": "xxx",
                    "subnetId": "xxx"
                }
            }
        }
      }
    }
  }
}
```

- `entry`

默认 `app.js`

> Node 服务入口文件，相对于projectPath,需要导出 app 或者 server 的实例，同时也支持导出异步获取 app 的 tcbGetApp 方法，方法的返回值为 app 或者 server 的实例。

如 koa 服务的 `app.js`

```js
const Koa = require('koa');
const { router } = require('./routes/');

const app = new Koa();

app.use(router.routes());

module.exports = app;
```

Koa 这个最简单，导出实例就行，一行 `module.exports = app` 搞定。注意**不要**调 `app.listen()`，端口由平台接管，你自己 listen 反而会冲突。

Nest 稍微麻烦一点，因为它的实例是异步创建的，所以要用 `tcbGetApp` 这个约定的异步导出。

nest 服务的 `app.js`

```js
const express = require('express');
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { AppModule } = require('./dist/app.module');

const expressApp = express();
const adapter = new ExpressAdapter(expressApp);

exports.tcbGetApp = async () => {
  const app = await NestFactory.create(AppModule, adapter);
  await app.init();
  return expressApp;
};
```



Nest 这段代码的要点是：它没有用 Nest 自带的 HTTP 服务器，而是塞了一个 `ExpressAdapter` 进去，最后导出的是那个裸的 `expressApp`。这样 Nest 的依赖注入、装饰器全都还在，但对外表现成一个普通的 Express 应用，平台就能接管了。`require('./dist/app.module')` 说明它读的是编译产物，所以部署前得先 `nest build`，这一步可以写进 `buildCommand`。

#### 云托管容器插件

上面 node 插件的 `platform: "container"` 走的就是它。要是你的服务不是 Node（Go、Java、Dart 之类），或者有自定义的 Dockerfile 需求，直接用这个插件。

**功能特性**

- 节约成本: 资源伸缩，弹性扩缩容，灵活计费，极大节约资源成本
- 极简配置：自动检测框架，无须配置
- 语言支持和框架支持广泛
  - Node.JS
  - PHP
  - Java
  - Go
  - Dart
  - Deno


```js
// https://docs.cloudbase.net/framework/plugins/framework-plugin-container
{
  "envId": "{{envId}}",
  "framework": {
    "plugins": {
      "client": {
        "use": "@cloudbase/framework-plugin-container",
        "inputs": {
          "serviceName": "node-api", // 必填，服务名，字符串格式，如 node-api
          "servicePath": "/node-api",// 必填，服务路径配置, 字符串格式, 如 /node-api
          "localPath": "./" // 选填，本地代码文件夹相对于项目根目录的路径，默认值 ./
        }
      }
    }
  }
}
```

容器方案跟云函数最大的区别是没有冷启动、没有 60 秒超时，代价是常驻实例的费用。长连接、WebSocket、跑得久的任务，只能选容器。这块跟微信云托管的思路很像，我在 [微信云托管入门与实践](https://feinterview.poetries.top/blog/wxcloud-intro) 里写过更细的容器调试流程。

### 5.4 一键部署按钮制作

这个功能是给开源项目用的，在 README 上放一个按钮，别人点一下就能把你的项目部署到他自己的云开发环境里，有点像 Vercel 的 Deploy Button。前面 5.2 讲的 `requirement` 配置就是给它准备的，用户点按钮之后看到的那个参数表单，就是从 `environment` 声明渲染出来的。

> 参考 https://docs.cloudbase.net/framework/deploy-button

### 5.5 云开发部署应用演示

配置讲完了，下面用五个真实项目走一遍，Egg、Koa、React、Vue、Hexo 各一个。你可以对照着找跟自己项目最像的那个抄。

> 云开发部署模板参考：https://github.com/TencentCloudBase/cloudbase-templates

#### 云开发部署Egg

> node插件文档 https://docs.cloudbase.net/framework/plugins/framework-plugin-node

```
# 初始化egg项目
tcb new egg-demo
```

![tcb new 初始化 egg 项目后生成的目录结构](https://s.poetries.top/uploads/2022/06/627d5a83ca20f2ae.png)

**编写cloudbaserc.json**

```js
{
  "version": "2.0",
  "envId": "test-xx",
  "$schema": "https://framework-1258016615.tcloudbaseapp.com/schema/latest.json",
  "framework": {
    "name": "egg-starter",
    "plugins": {
      "node": {
        "use": "@cloudbase/framework-plugin-node",
        "inputs": {
          "entry": "app.js",
          "name": "egg-starter",
          "path": "/egg-starter"
        }
      }
    }
  },
  "functionRoot": "./functions",
  "functions": [],
  "region": "ap-guangzhou"
}
```

这份配置里 `region` 显式写了 `ap-guangzhou`。回到第二节说过的规则：上海地域可以省略，其他地域必填。填错的表现是部署时提示环境不存在，明明控制台里看得见，很容易往别的方向排查。

添加启动入口文件

Egg 跟 Nest 一样是异步启动的，所以也走 `tcbGetApp` 这条路，手动 `new Application` 并指定 `env: 'prod'`。

```js
'use strict';

const { Application } = require('egg');

exports.tcbGetApp = () => {
  return new Application({
    env: 'prod',
  });
};
```

部署

```
tcb framework deploy
```

![Egg 项目执行 framework deploy 时的构建输出](https://s.poetries.top/uploads/2022/06/2f3e27804bd7105b.png)
![Egg 项目部署完成后终端给出的访问地址](https://s.poetries.top/uploads/2022/06/c2500d4d92e0da5e.png)

拿到那个访问地址直接在浏览器打开，能看到 Egg 的默认页面就算成功了。

#### 云开发部署Koa

> node插件文档 https://docs.cloudbase.net/framework/plugins/framework-plugin-node

```
# 初始化koa项目
tcb new koa-demo
```

**编写cloudbaserc.json**

```js
{
  "version": "2.0",
  "envId": "test-xxx",
  "framework": {
    "name": "koa-starter",
    "plugins": {
      "node": {
        "use": "@cloudbase/framework-plugin-node",
        "inputs": {
          "name": "koa-starter",
          "path": "/koa-starter"
        }
      }
    }
  },
  "functionRoot": "./functions",
  "functions": [],
  "region": "ap-guangzhou"
}
```

对比一下会发现 Koa 的配置比 Egg 还少一个字段，没写 `entry`，因为默认就是 `app.js`。

> 修改`app.js`，导出 `module.exports = app`

部署

```
tcb framework deploy
```

![Koa 项目 framework deploy 的部署过程输出](https://s.poetries.top/uploads/2022/06/e287aea2c9821cc4.png)
![Koa 服务部署成功后的访问效果](https://s.poetries.top/uploads/2022/06/966fc0e7f631cba5.png)

#### 云开发部署React

前面两个是后端，接下来两个是纯前端，用的是 website 插件。

```
# 初始化react项目
tcb new react-demo
```

**编写cloudbaserc.json**

```js
{
  "version": "2.0",
  "envId": "test-xx",
  "$schema": "https://framework-1258016615.tcloudbaseapp.com/schema/latest.json",
  "functionRoot": "cloudfunctions", // 云函数目录
  "framework": {
    "name": "react-starter",
    "plugins": {
      "client": {
        // 插件文档 https://docs.cloudbase.net/framework/plugins/framework-plugin-website
        "use": "@cloudbase/framework-plugin-website",
        "inputs": {
          "buildCommand": "npm run build",
          "outputPath": "build",
          "cloudPath": "/react-starter", // 当前静态托管的 /react-starter 目录下
          "envVariables": {
            "REACT_APP_ENV_ID": "{{env.ENV_ID}}"
          }
        }
      },
      "server": {
        "use": "@cloudbase/framework-plugin-function",
        "inputs": {
          "functionRootPath": "cloudfunctions",
          "functions": [
            {
              "name": "helloworld",
              "timeout": 5,
              "envVariables": {},
              "runtime": "Nodejs10.15",
              "memory": 256,
              "aclRule": {
                "invoke": true
              }
            }
          ]
        }
      },
      "auth": {
        "use": "@cloudbase/framework-plugin-auth",
        "inputs": {
          "configs": [
            {
              "platform": "NONLOGIN",
              "status": "ENABLE"
            }
          ]
        }
      }
    }
  },
  "functions": [],
  "region": "ap-guangzhou"
}
```

这个 React 例子是全篇里最完整的一个，一次挂了三个插件：`client` 部署前端、`server` 部署云函数、`auth` 配登录方式。三件事一条命令做完，这就是 Framework 的价值所在。

有两个细节：`outputPath` 是 `build` 不是 `dist`，因为 CRA 的产物目录就叫 build；`envVariables` 里把环境 ID 注入成了 `REACT_APP_ENV_ID`，前端代码里通过 `process.env.REACT_APP_ENV_ID` 读，这样初始化 SDK 时就不用硬编码环境 ID 了。这个技巧挺实用的，Vue 项目对应的前缀是 `VUE_APP_`。

部署

```
tcb framework deploy
```

![React 项目 framework deploy 的构建与部署过程](https://s.poetries.top/uploads/2022/06/50d7e5c2d8654dff.png)
![React 应用部署到静态托管后的访问效果](https://s.poetries.top/uploads/2022/06/ad02ca3fac62bdec.png)

#### 云开发部署Vue

```
# 初始化vue项目
tcb new vue-demo
```

![tcb new 初始化 vue 项目的命令行输出](https://s.poetries.top/uploads/2022/06/4af41bcbd091b686.png)

**编写cloudbaserc.json**

```js
{
    "envId": "test-xx",
    "version": "2.0",
    "$schema": "https://framework-1258016615.tcloudbaseapp.com/schema/latest.json",
    "functionRoot": "./functions",
    "functions": [],
    "region": "ap-guangzhou", // 默认是ap-shanghai
    "framework": {
        "name": "vue-hello-world",
        "plugins": {
            "vue": {
                // 插件文档 https://docs.cloudbase.net/framework/plugins/framework-plugin-website
                "use": "@cloudbase/framework-plugin-website",
                "inputs": {
                    "buildCommand": "npm run build",
                    "outputPath": "dist"
                }
            }
        }
    }
}
```

Vue 这份最简洁，只有一个 website 插件，`outputPath` 回到默认的 `dist`。配置里那句注释「默认是ap-shanghai」说的就是 `region` 的缺省值。

部署

```
tcb framework deploy
```

![Vue 项目 framework deploy 的部署输出](https://s.poetries.top/uploads/2022/06/c34f69c797a05e2b.png)
![Vue 应用部署完成后的线上访问页面](https://s.poetries.top/uploads/2022/06/569a41e7e44d4911.png)

#### 部署hexo

最后一个是 Hexo 博客。它跟 Vue 唯一的区别是构建命令和产物目录，说明 website 插件对任何「能构建出一堆静态文件」的项目都通用，跟你用什么框架无关。

```
# 初始化hexo项目
tcb new hexo-demo
```

**编写cloudbaserc.json**

```js
{
    "envId": "poetry-xx",
    "version": "2.0",
    "$schema": "https://framework-1258016615.tcloudbaseapp.com/schema/latest.json",
    "functionRoot": "./functions",
    "functions": [],
    "region": "ap-guangzhou", // 默认是ap-shanghai
    "framework": {
        "name": "hexo-hello-world",
        "plugins": {
            "hexo": {
                // 插件文档 https://docs.cloudbase.net/framework/plugins/framework-plugin-website
                "use": "@cloudbase/framework-plugin-website",
                "inputs": {
                    "buildCommand": "npx hexo generate",
                    "outputPath": "./public"
                }
            }
        }
    }
}

```

部署

```
tcb framework deploy
```

![Hexo 项目 framework deploy 的构建与上传过程](https://s.poetries.top/uploads/2022/06/fb0f146a969d6506.png)
![Hexo 博客部署到云开发静态托管后的线上效果](https://s.poetries.top/uploads/2022/06/f09f236c850cdbc6.png)

个人博客用这套方案挺合适的，CDN 是现成的，HTTPS 也不用自己配。跟其他 Serverless 平台的对比，我在 [Serverless 部署实践总结](https://feinterview.poetries.top/blog/serverless-deploy-summary) 里聊过。

## 六、使用云开发部署web应用

上一节是从 `tcb new` 的模板开始的。实际情况更多是你已经有一个项目了，这一节讲怎么把现成的项目接进来。

结论先说：不用改代码，也不用先写 `cloudbaserc.json`，直接在项目根目录跑部署命令，Framework 会自动检测框架类型并生成配置。

### 6.1 部署hexo

**使用 hexo 命令行初始化一个项目**

```
npx hexo init hexo-hello-world
```

**部署项目**

```bash
# tcb env list 查看环境列表

# 部署
cloudbase framework deploy -e <your-env-id>
```

`-e` 显式指定环境 ID，省掉交互式选择那一步，这也是写进 CI 脚本时的标准做法。环境 ID 忘了就先 `tcb env list` 查一下，命令注释里已经提示了。

![已有 Hexo 项目直接执行部署命令的自动检测过程](https://s.poetries.top/uploads/2022/06/8a0f9b7b169f862a.png)
![Hexo 项目部署成功后的输出与访问地址](https://s.poetries.top/uploads/2022/06/2e99b96c91ea6bf4.png)

### 6.2 部署Vue

**初始化项目**

```
npx vue create vue-hello-world
```

**发布项目**

```
# tcb env list 查看环境列表

# 部署
tcb framework deploy -e <your-env-id>
```

![已有 Vue 项目一条命令完成部署的终端输出](https://s.poetries.top/uploads/2022/06/bc8ba28de42ff604.png)

两个例子都没写配置文件，一条命令直接上线。自动检测跑完之后会在项目里留下一份 `cloudbaserc.json`，你可以在它的基础上继续改，比从零手写省事。

## 七、在云开发中使用NoSQL数据库

服务和前端都跑起来了，还差数据。云开发自带的是文档型 NoSQL 数据库，用过 MongoDB 的话上手基本没有成本，集合对应表，文档对应行。

> 在面板上创建一个`NoSQL`的数据库，[参考地址](https://docs.cloudbase.net/database/introduce)

![云开发控制台数据库页面新建集合的界面](https://s.poetries.top/uploads/2022/06/fd5954cd15c3e0e9.png)

集合建好之后记得看一眼权限设置，默认是「仅创建者可读写」。做公开内容展示的话要改成「所有用户可读」，或者用前面讲的自定义安全规则。这个默认值挺保守的，但确实比默认全开放安全。

> 在项目中安装连接数据库的`SDK`[参考文档](https://docs.cloudbase.net/api-reference/server/node-sdk/introduction)

要分清两个 SDK：`@cloudbase/js-sdk` 是浏览器端用的，走登录鉴权和安全规则；`@cloudbase/node-sdk` 是服务端用的，拿密钥直连，绕过安全规则。这一节用的是后者。

```
npm install @cloudbase/node-sdk
```

> 初始化数据库连接[参考地址](https://docs.cloudbase.net/api-reference/server/node-sdk/initialization)

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

代码里那句注释是这一节最有价值的信息：**这几个参数文档上写的是非必填，实际必填**。我当时照着文档只传了 `env`，结果一直报鉴权失败，排查了一下午才发现是 `secretId` 和 `secretKey` 没给。

为什么文档说非必填？因为在云函数运行时里，这些凭证是平台自动注入到环境变量里的，SDK 会自己去读。但你在本地机器或者自己的服务器上跑，环境变量没有，就必须显式传。搞清楚这个区别，报错就不冤了。

`region` 也一样，跟你建环境时选的地域必须一致，这里又回到第二节那个地域的坑。

`env`的获取地址

![云开发控制台概览页中环境 ID 的位置](https://s.poetries.top/uploads/2022/06/45dad89cf73176e3.png)

`secretId` 和`secretKey`获取：https://console.cloud.tencent.com/cam/capi

![腾讯云访问管理 API 密钥页面，可以新建和查看 SecretId 与 SecretKey](https://s.poetries.top/uploads/2022/06/8cab74708230b661.png)

再啰嗦一句安全：这对密钥是账号级别的，权限极大，泄漏了别人能操作你腾讯云上的一堆资源。务必走环境变量注入，别写进代码，也别提交到仓库。真要用，建议在访问管理里建一个子账号，只给它云开发相关的权限，比直接用主账号密钥安全得多。

## 八、在VS Code中使用Toolkit管理云开发项目

前面全是命令行。要是你不想记那么多命令，官方还有个 VS Code 插件，日常的部署、下载、查看日志都能点着完成。

### 8.1 基本使用介绍

> Tencent CloudBase Toolkit 是腾讯云 - 云开发发布的 VS Code（Visual Studio Code）插件。该插件可以让您更好地在本地进行云开发项目开发和代码调试，并且轻松将项目部署到云端。

**通过 Tencent CloudBase Toolkit 插件，您可以：**

- 在本地快速创建云开发项目
- 从多种模板快速创建云函数
- 同步云端的云函数列表，并下载函数代码到本地
- 部署云函数到云端，并进行云端安装依赖
- 对云函数进行管理，如删除云函数、查看云函数详细信息
- 增量更新云函数文件
- 删除云端的云函数文件
- 部署静态托管文件到云端

同时，VS Code 插件也支持了云函数本地调试与云端调试，帮助你快速定位代码问题

这一条是它相对 CLI 的最大优势。云函数在本地打断点调试，比在代码里插 `console.log` 再部署上去看日志快太多了。

![VS Code 中 CloudBase Toolkit 插件的侧边栏面板总览](https://s.poetries.top/uploads/2022/06/b09bcd56a8afaba5.png)

**登录**

![在 VS Code 插件中点击登录，跳转浏览器完成云开发授权](https://s.poetries.top/uploads/2022/06/79fedf80af936261.png)
![授权完成后 VS Code 插件中显示已登录的账号信息](https://s.poetries.top/uploads/2022/06/d64d37ed50ab8a11.png)

登录跟 CLI 是同一套授权，命令行里 `tcb login` 过了，插件这边一般也能直接识别。

**创建新项目**

![VS Code 插件侧边栏中新建云开发项目的入口](https://s.poetries.top/uploads/2022/06/8398b4d1b46da096.png)

> **注意**：`CloudBase Toolkit` 插件依赖于 `cloudbaserc.json` 配置文件，`只有当前项目的根目录下存在 cloudbaserc.json 配置文件时`，才能使用 `CloudBase Toolkit` 插件进行相关操作。

如果您还没有云开发项目，可以使用初始化操作创建一个全新的云开发项目，CloudBase Toolkit 提供了部分模板项目供选择。

> `打开一个空的文件夹作为根目录`，点击侧边栏的云开发图标，点击下图示例中的条目

这个「必须有 `cloudbaserc.json` 才能用」的限制要记牢。插件的所有功能都建立在这个文件上，打开一个没有它的目录，侧边栏就是灰的，什么都点不了。

- 选择地区

![VS Code 插件中选择云开发环境所在地区](https://s.poetries.top/uploads/2022/06/6e62d9caf3ead536.png)

- 选择地区关联的环境ID

![VS Code 插件中选择该地区下的具体环境 ID](https://s.poetries.top/uploads/2022/06/c0077a6f7d345269.png)

又是地区。这里选的地区要跟环境实际所在的地区一致，选错了下一步的环境列表会是空的。

- 选择对应的模板

![VS Code 插件提供的云开发项目模板列表](https://s.poetries.top/uploads/2022/06/2fe16d3cb23b86fe.png)

- 项目创建成功

![项目创建完成的提示信息](https://s.poetries.top/uploads/2022/06/c274c86297e0037e.png)

- 项目目录结构

![创建出来的云开发项目在资源管理器中的目录结构](https://s.poetries.top/uploads/2022/06/d0ea2cb4f67df0a8.png)

> VS Code 插件会默认使用当前窗口打开文件夹的根目录下的 `cloudbaserc.json` 配置文件，如果你使用了 VS Code 工作区，则会使用工作区中的第一个项目文件夹根目录下的配置文件

关于 `cloudbaserc.json` [配置文件的详情可以参考这里 🔗](https://docs.cloudbase.net/cli-v1/config)

- 以上操作可以使用`tcb framework deploy`一键部署

```
# 函数和静态网站一起部署
tcb framework deploy
```

![在 VS Code 终端里执行 framework deploy 一次性部署函数和静态网站](https://s.poetries.top/uploads/2022/06/7841d0aab3b6def2.png)

插件和 CLI 用的是同一份配置，两边可以随便混着用。我自己的习惯是日常改代码用插件右键部署单个函数，整体发布还是回到终端跑 `framework deploy`。

### 8.2 云函数操作

> 对云函数进行`部署/删除/下载`代码等操作时，`必须选中云函数文件夹`，否则会因为无法解析到准确的函数名称，而导致操作失败。

右键选中函数文件夹，点击部署云函数即可。CloudBase Toolkit 支持同时选择多个云函数进行部署。

**CloudBase Toolkit 支持两种部署云函数的方式：**

- 部署云函数（上传全部文件）：即将函数目录下的所有文件上传，也包含 `node_modules` 目录
- 部署云函数（云端安装依赖）：只部署代码文件，会忽略 `node_modules` 目录，云函数会自动在线安装依赖

绝大多数情况选第二种。原因跟前面讲 `installDependency` 时一样：上传包小、速度快，而且原生依赖是在 Linux 环境编译的，不会有平台不兼容的问题。只有在依赖装不上（私有源、网络受限）的时候才用第一种。

![在 VS Code 中右键云函数文件夹选择部署方式](https://s.poetries.top/uploads/2022/06/7164c1d025fed2f2.png)
![插件执行云函数部署时的进度提示](https://s.poetries.top/uploads/2022/06/f6436c7624819c45.png)
![云函数部署成功后的提示信息](https://s.poetries.top/uploads/2022/06/27161771a757fa8c.png)

- 查看函数配置信息

![在插件中查看单个云函数的详细配置](https://s.poetries.top/uploads/2022/06/fd07b75bb7e5dfb9.png)

这个面板等价于命令行的 `tcb fn detail`，看云端实际生效的配置。

**下载函数代码**

使用下载函数代码功能，可以将云端函数代码下载到本地，进行操作时，需要选择云函数名称对应的目录。CloudBase Toolkit 支持同时选择多个云函数，下载云函数代码。

![在插件中选择云函数并下载云端代码到本地](https://s.poetries.top/uploads/2022/06/715c72c283832c56.png)

**增量更新**

CloudBase Toolkit 支持上传单个文件或文件夹到云函数中，而无需重新上传整个云函数

![在插件中右键单个文件执行增量更新到云函数](https://s.poetries.top/uploads/2022/06/b474aafabd470e8e.png)

这个功能在调试期特别香。改一行配置文件，右键传上去几秒钟就好了，不用等整个函数重新打包上传。不过要注意它只是覆盖文件，不会触发依赖重装，改了 `package.json` 还是得走完整部署。

### 8.3 静态网站

> CloudBase Toolkit 支持上传文件/文件夹到静态网站存储中，同时支持文件多选，既可以同时选择多个文件上传。

CloudBase Toolkit 提供了两种上传方法：

- 上传到静态托管：需要输入云端存放文件（夹）的文件夹路径，选中的文件（夹）将被上传到此路径下。
- 上传到静态托管（根目录）：选中的文件（夹）将被直接上传到根目录下

![在插件中右键文件夹上传到静态托管](https://s.poetries.top/uploads/2022/06/5fda60ae03e5f96c.png)

临时传个测试页面、补一张图，用这个比敲 `tcb hosting deploy` 顺手。正式发布还是走 Framework，免得手动上传漏文件。

## 九、cloudBase之CMS内容管理系统

> - 文档：https://docs.cloudbase.net/cms/intro
> - Github：https://github.com/TencentCloudBase/cloudbase-extension-cms

- CloudBase CMS 是云开发推出的，基于 Node.js 的 Headless 内容管理平台，提供了丰富的内容管理功能。CloudBase CMS 基于模型配置，动态生成内容管理界面，无须编写代码即可使用，快速管理云开发中的业务数据。支持字符串、数字、多媒体、图片、文件、富文本、Markdown、关联类型等数十种内容类型的可视化编辑。
- CloudBase CMS 已在腾讯云扩展应用、小程序开发者工具中上线，支持一键安装到已有的环境中，管理小程序 / Web 等多端产生的内容数据。
- 同时，CloudBase CMS 已经在 GitHub 开源，可以直接在 CloudBase CMS 上进行二次开发，满足业务的多样化需求。

> 使用 CMS 扩展时将在当前环境创建云函数、云数据库等资源

先说这东西解决什么问题。你做了个官网或者小程序，内容需要运营同学自己维护，总不能让他们改代码或者去数据库里改文档。CMS 就是那层管理后台，配好模型之后自动生成增删改查界面，运营直接用。

它不是黑盒，装完之后你在自己环境里看到的就是几个云函数加几个集合，全都能自己动。这一点比用第三方 SaaS 让人踏实。

工作原理

![CloudBase CMS 的工作原理架构图，管理界面、API 服务与云数据库的关系](https://s.poetries.top/uploads/2022/06/eb1db5b08062b46c.png)

### 9.1 控制台部署CMS

> 环境需要使用按量付费

又是按量付费这个前提，跟静态托管一样。预付费环境装不了，这是第二节建环境时就要考虑的事。

![云开发控制台扩展应用列表中的 CloudBase CMS](https://s.poetries.top/uploads/2022/06/f475b1efc04f182a.png)
![安装 CMS 扩展时填写管理员账号与部署路径的表单](https://s.poetries.top/uploads/2022/06/fa0e23cb97283134.png)

安装的时候要填管理员账号密码和部署路径，路径建议就用根目录 `/`，除非你这个环境里还有别的前端应用需要占用根路径。

安装完成可以看到已经部署好的云函数、静态资源、云数据库

![CMS 安装后自动创建的云函数列表](https://s.poetries.top/uploads/2022/06/0078ed499a50ee78.png)
![CMS 安装后部署到静态托管的管理界面资源](https://s.poetries.top/uploads/2022/06/ae2ae82d69b699f2.png)
![CMS 安装后自动创建的数据库集合](https://s.poetries.top/uploads/2022/06/eb3ef08b8ab0bc95.png)

这三张图基本就把 CMS 的构成讲清楚了：一个前端管理界面放在静态托管上，几个云函数提供 API 和鉴权，几个集合存配置和内容。前面 5.2 那份「完整示例」配置文件，就是这套东西的部署描述。

登录部署的CMS界面操作演示

![CloudBase CMS 管理后台的登录页面](https://s.poetries.top/uploads/2022/06/b00248881e212a34.png)
![登录后进入 CMS 的项目列表页](https://s.poetries.top/uploads/2022/06/1ff5d829ce888659.png)

进来之后第一件事是建项目，一个项目下面挂多个内容模型。模型就是你的数据结构，定义好字段类型，CMS 自动生成对应的表单和列表。

![在 CMS 中创建内容模型并配置字段类型](https://s.poetries.top/uploads/2022/06/a4850b81e9666030.png)
![内容模型配置完成后生成的字段列表](https://s.poetries.top/uploads/2022/06/5f57eee40dfb7381.png)
![根据模型自动生成的内容录入表单](https://s.poetries.top/uploads/2022/06/f298c715b04eaf35.png)
![CMS 中已录入内容的列表管理界面](https://s.poetries.top/uploads/2022/06/87fbb479196de69b.png)

整个过程不用写一行代码。字段类型支持得挺全，字符串、数字、图片、富文本、Markdown、关联类型都有，做个博客或者商品管理够用了。内容存在云数据库里，前端用 SDK 直接读，跟 CMS 没有耦合。

### 9.2 如有二次修改，我们可以使用源码方式部署

> - 源码部署方式 https://docs.cloudbase.net/cms/install/source
> - 二次开发 https://docs.cloudbase.net/cms/reference/dev

- 安装 `npm install -g @cloudbase/cli@latest`
- [开通云开发服务，并创建按量计费环境](https://console.cloud.tencent.com/tcb/env/index?from=cli&source=cloudbase-cms&action=CreateEnv)

一键安装的版本改不了界面。要加个自定义字段类型、改个 logo、接自己的鉴权，就得拉源码自己部署。这一小节的价值不只在 CMS 本身，它是一个「用 Framework 部署 monorepo 项目」的完整案例。

#### 项目结构

> 下面是基本的目录结构，采用了 Monorepo 的组织规范，并使用 lerna 进行管理

- `admin`： 前端管理界面
- `cms-api`：`RESTful API` 服务
- `cms-init`：CMS 部署初始化相关脚本
- `service`：后端服务，提供系统管理相关的服务

```
.
├── build
├── community
├── packages
│   ├── admin
│   │   ├── config
│   │   ├── dist
│   │   ├── public
│   │   ├── src
│   │   │   ├── assets
│   │   │   ├── common
│   │   │   ├── components
│   │   │   ├── layout
│   │   │   ├── locales
│   │   │   ├── models
│   │   │   ├── pages
│   │   │   ├── services
│   │   │   └── utils
│   │   └── typings
│   ├── cms-api
│   │   ├── dist
│   │   ├── src
│   │   │   ├── api
│   │   │   ├── common
│   │   │   ├── guards
│   │   │   ├── interceptors
│   │   │   ├── middlewares
│   │   │   ├── services
│   │   │   └── utils
│   │   └── typings
│   ├── cms-init
│   └── service
│       ├── dist
│       ├── src
│       │   ├── common
│       │   ├── config
│       │   ├── decorators
│       │   ├── guards
│       │   ├── interceptors
│       │   ├── middlewares
│       │   ├── modules
│       │   │   ├── auth
│       │   │   ├── file
│       │   │   ├── projects
│       │   │   ├── role
│       │   │   ├── setting
│       │   │   └── user
│       │   ├── services
│       │   └── utils
│       └── typings
└── scripts
```

四个包各司其职：`admin` 是 React 写的管理界面，`cms-api` 提供 RESTful 接口，`service` 是主后端，`cms-init` 负责部署时的初始化。对着这个结构再回头看 5.2 那份配置文件，`website` 插件对应 admin，`node` 插件对应 service，`function` 插件对应 cms-init，一一对上了。

#### 配置

> 复制项目根目录下的 `.env.example` 为 `.env.local`，并填写相关的配置

```bash
# 您的云开发环境 Id
TCB_ENVID=envId
# 管理员账户名，账号名长度需要大于 4 位，支持字母和数字
administratorName=admin
# 管理员账号密码，8~32位，密码支持字母、数字、字符、不能由纯字母或存数字组成
administratorPassword=123456
# CMS 控制台路径，如 /tcb-cms/，建议使用根路径 /
deployPath=/
# 云接入自定义域名（选填），如 tencent.com
accessDomain=
TENCENTCLOUD_REGION=ap-guangzhou # 环境ID所在的地区
```

这份 `.env.local` 里那个默认密码 `123456` 只是示例，真上线一定要换。注释里写着密码规则是 8 到 32 位、不能纯字母或纯数字，`123456` 其实连规则都不满足。

#### 安装依赖

在项目根目录下运行下面的命令：

```
npm install && npm run setup
```

> 如果你使用 `npm run setup` 命令出现异常，你可以分别到 `packages` 目录下的文件内，手动执行 `npm install` 命令。

`npm run setup` 内部跑的是 `lerna bootstrap`，负责给每个子包装依赖并做软链。这一步在网络不好的时候很容易挂，官方给的兜底办法就是手动进每个包装一遍，笨但有效。

在项目根目录下运行下面的命令，会将 `CloudBase CMS` 的管理控制台部署到静态网站，Node 服务部署到云函数中

```
npm run deploy
```

![CMS 源码方式部署时的构建与上传输出](https://s.poetries.top/uploads/2022/06/d937a67646160b02.png)
![CMS 部署完成后终端打印的访问地址](https://s.poetries.top/uploads/2022/06/39a38172b39daa80.png)

**控制台管理**

部署完之后回控制台看看，能直观地看到这套东西在云上长什么样。

- 我的应用

![云开发控制台应用列表中的 CMS 应用](https://s.poetries.top/uploads/2022/06/4f48480646204dd2.png)
![CMS 应用的详情页，展示关联的各项资源](https://s.poetries.top/uploads/2022/06/6742f2c96f05ad0e.png)

- 云托管服务

![CMS 在云托管中运行的 service 服务](https://s.poetries.top/uploads/2022/06/ac2eddfa13237bd9.png)

> `tcb-ext-cms-service`：该服务提供登录鉴权功能，用户在 CMS 管理界面通过通过用户名和密码来进行登录时，会通过 HTTP 来请求该函数；提供 API 接口功能，所有对内容的操作和管理都会经过此函数调用，内容操作会根据用户权限来进行数据库操作。

- 管理云函数

![CMS 相关的两个云函数 cms-init 和 cms-api](https://s.poetries.top/uploads/2022/06/107b9e3f346af8a5.png)

> - `tcb-ext-cms-init`：提供初始化应用功能，安装扩展后，会通过该函数来进行静态资源的部署和密码的生成和设置，修改账号密码或者部署路径等扩展参数都会再次执行该函数来进行更新
> - `tcb-ext-cms-api`：提供 `CMS RESTful API` 访问能力，所有 `RESTful API` 请求都会经过此函数调用

- 云存储，存放静态网站

![云存储中 CMS 上传的图片与文件](https://s.poetries.top/uploads/2022/06/eaad8e647a753095.png)

> 存储图片、文件等 CMS 系统上传的文件。

- 云数据库

![CMS 创建的六个数据库集合](https://s.poetries.top/uploads/2022/06/4b866be7e0bf7cfe.png)

- `tcb-ext-cms-projects` 集合：CMS 系统项目数据
- `tcb-ext-cms-schemas` 集合：CMS 系统内容配置数据，CMS 所有的系统内容类型配置、字段配置等信息都存储在该集合内
- `tcb-ext-cms-users` 集合：CMS 系统用户数据，存储 CMS 的用户信息，包括管理员和运营者的账号信息，包括角色信息等
- `tcb-ext-cms-webhooks` 集合： CMS 系统 webhook 集合，存储 CMS 系统的回调接口配置，CMS 系统数据的变更可以通过回调来进行同步。
- `tcb-ext-cms-user-roles` 集合：CMS 系统用户角色配置集合，存储 CMS 系统的自定义用户角色信息
- `tcb-ext-cms-settings` 集合：CMS 系统配置集合，存储 CMS 系统的设置

这六个集合全都是 `ADMINONLY` 权限，客户端 SDK 读不到，只有服务端能操作。你自己的业务数据不要往这几个集合里放，另开新的集合，免得跟系统数据混在一起，升级 CMS 的时候出事。

#### 安装失败

> 请查看环境下云函数 `tcb-ext-cms-init` 的执行日志，获取失败原因。CloudBase CMS 安装时需要使用 `tcb-ext-cms-init` 函数执行初始化的工作，当出现异常时，会导致安装失败。

这条排查思路适用于所有 Framework 应用：装不上就去看初始化函数的执行日志。控制台的云函数日志页面，或者命令行 `tcb fn log tcb-ext-cms-init`，报错原因一般写得挺清楚，比在终端输出里瞎猜强。

#### 本地开发

改界面总不能每次都部署上去看效果，得能本地跑起来。这部分配置比部署多一些，因为本地没有云端自动注入的那些变量。

1. 复制根目录下的 `.env.example` 为 `.env.local`，并根据文件中的内容进行配置

```bash
# 您的云开发环境 Id
ENV_ID=envId
# 管理员账户名，账号名长度需要大于 4 位，支持字母和数字
administratorName=admin
# 管理员账号密码，8~32位，密码支持字母、数字、字符、不能由纯字母或存数字组成
administratorPassword=123456
# CMS 控制台路径，如 /tcb-cms/，建议使用根路径 /
deployPath=/
# 云接入自定义域名（选填），如 tencent.com
accessDomain=
TENCENTCLOUD_REGION=ap-guangzhou # 环境ID所在的地区
```

注意根目录这份用的变量名是 `ENV_ID`，而前面部署那份用的是 `TCB_ENVID`，两个不一样。这种细微差别抄配置的时候特别容易搞错，最好每次都直接从对应的 `.env.example` 复制。

2. 复制 `packages/service/.env.example` 为 `packages/service/.env.local`，并根据文件中的内容进行配置

```bash
TCB_ENVID=test-xx # 环境ID
SECRETID=密钥ID # 密钥ID
SECRETKEY=密钥KEY # 密钥KEY
TENCENTCLOUD_REGION=ap-guangzhou # 环境ID所在的地区
```

3. 复制 `packages/admin/public/config.example.js` 为 `packages/admin/public/config.js`，并根据文件中的内容进行配置

```js
window.TcbCmsConfig = {
  // 可用区，默认上海，可选：ap-shanghai 或 ap-guangzhou
  region: "ap-guangzhou",
  // 路由方式：hash 或 browser
  history: "hash",
  // 环境 Id
  envId: "test-9g9512mccb349a321275b",
  // 禁用通知
  disableNotice: false,
  // 禁用帮助按钮
  disableHelpButton: false,
  // 云接入默认域名/自定义域名 + 云接入路径，不带 https 协议符
  // https://console.cloud.tencent.com/tcb/env/access
  // 环境id+API密钥中的appid（https://console.cloud.tencent.com/cam/capi）
  // API密钥中的appid：1258157827
  cloudAccessPath: 'test-9g9512mccb349a321275b-1258157827.service.tcloudbase.com/tcb-ext-cms-service',
};
```

这份前端配置里 `cloudAccessPath` 最容易填错。它的拼法是「环境 ID + 短横线 + APPID + `.service.tcloudbase.com` + 云接入路径」，三段信息来自三个不同的页面，注释里都给了链接。少一段或者顺序反了，本地就连不上后端。

4. 添加安全域名，否则本地开发会报跨域错误

![在云开发控制台安全域名中添加本地开发地址](https://s.poetries.top/uploads/2022/06/c9c7dc7c0ebba705.png)
![添加完成后的安全域名列表，包含 localhost](https://s.poetries.top/uploads/2022/06/c15711674e3c175d.png)

回到 3.4 节讲安全域名时说的那个坑，就是这里。本地开发地址（`localhost:8000`）不加进白名单，请求全被拒，浏览器控制台报的是跨域错误，很容易误以为是 CORS 头没配。我一开始也是这么想的，去翻 nginx 和后端中间件，找了半天才反应过来是云开发的白名单。

**安装依赖**

```
# 安装 lerna 依赖
npm install
# 安装 package 依赖
npm run setup
```

**初始部署**

通过部署动作，触发初始化操作

```
npm run deploy
```

**启动开发**

运行下面的命令，成功后，可以访问 `http://localhost:8000/` 打开 CMS 管理界面

```
cd packages/admin && npm run dev
cd packages/service && npm run dev
```

这两条命令要开两个终端分别跑，前一条起管理界面，后一条起后端服务。写在一行里是跑不起来的，第一条不会退出。

![本地开发模式下打开的 CMS 管理界面](https://s.poetries.top/uploads/2022/06/17ff255d213e43ac.png)

到这一步就能改代码看效果了。改完 `npm run deploy` 发上去，跟一键安装的版本互不影响。

#### 微应用开发

有时候你只是想在 CMS 里加一个自己的页面，比如一个数据看板、一个批量导入工具，没必要去改 CMS 源码。微应用就是为这个准备的：你独立写一个 Vue 或 React 应用，打包上传，CMS 把它嵌进菜单里。

**1. vue微应用接入**

> 接入文档 https://docs.cloudbase.net/cms/microapp/dev

```bash
# 新建 Vue 微应用项目
tcb new vue-app cms-microapp-vue
```

- 打包vue应用`npm run build`

![Vue 微应用执行构建命令后生成的产物](https://s.poetries.top/uploads/2022/06/065be64fc55c529a.png)

- 上传微应用

![CMS 后台中微应用管理的入口](https://s.poetries.top/uploads/2022/06/ea112b0d249492c2.png)

新建

![新建微应用时填写名称与标识](https://s.poetries.top/uploads/2022/06/8c672f52136b621a.png)

![上传微应用构建产物压缩包](https://s.poetries.top/uploads/2022/06/710cbc17f21b8d93.png)

> 上传成功后，可以在管理后台中查看

![上传成功后微应用列表中出现的新条目](https://s.poetries.top/uploads/2022/06/534042fe753270f5.png)

- 自定义菜单展示微应用

![在 CMS 中把微应用配置成自定义菜单项](https://s.poetries.top/uploads/2022/06/44a89633db979007.png)

- 设置后，在关联的项目中可见

![配置完成后微应用出现在项目左侧菜单中](https://s.poetries.top/uploads/2022/06/48a0980a8ea7075a.png)

整个流程走下来就三件事：打包、上传、配菜单。微应用跑在 iframe 里，跟 CMS 主体是隔离的，你用什么技术栈都行，但也意味着跟主应用之间传数据要靠 postMessage 或者共享登录态，这块我没有深入折腾过。

**2. react微应用接入**

> 接入文档 https://docs.cloudbase.net/cms/microapp/dev

```bash
# 新建 React 微应用项目
tcb new react-app cms-microapp-react
```

React 的接入方式跟 Vue 完全一样，只是模板换了个名字，后面的打包上传配菜单三步一模一样。

#### RESTful API 形式访问

CMS 里的内容，前端怎么读？两条路：用云开发 SDK 直连数据库，或者走 CMS 提供的 RESTful API。后者的好处是不依赖云开发 SDK，任何能发 HTTP 请求的端都能用，包括你的 Java 后端、Python 脚本。

> 文档 https://docs.cloudbase.net/cms/usage/restful/intro

**在系统设置中开启API访问**

![CMS 系统设置中开启 API 访问的开关](https://s.poetries.top/uploads/2022/06/359d527fd134c1a3.png)

![API 访问开启后的配置界面](https://s.poetries.top/uploads/2022/06/a066957524d06f9d.png)

**在项目设置中的 API 访问 Tab 设置允许通过 RESTful API 访问**

![项目设置中的 API 访问 Tab，逐个模型授权](https://s.poetries.top/uploads/2022/06/19a698c8050fa3eb.png)

这里是两级开关：系统级开一次，然后每个项目、每个内容模型还要单独授权。设计得比较谨慎，避免你开了 API 之后所有数据一股脑暴露出去。第一次配的时候容易只开了系统级就去调接口，然后一直 403。

然后复制访问连接，在postman中访问查看效果

![在 Postman 中请求 CMS 的 RESTful 接口并返回内容数据](https://s.poetries.top/uploads/2022/06/3fefbba31221042c.png)

**API鉴权访问**

上面那种是公开访问，任何人拿到地址都能读。生产环境显然不行，得加鉴权。

在系统设置中开启API鉴权访问，并创建token

![在 CMS 系统设置中开启 API 鉴权并创建 Token](https://s.poetries.top/uploads/2022/06/26f7c1f886045461.png)

提示需要接口授权才可以访问

![开启鉴权后未带 Token 的请求被拒绝](https://s.poetries.top/uploads/2022/06/33b9b9370a87a245.png)

在请求头加入创建好的token即可

> 当使用 API Token 调用 RESTful API 时，需要在 HTTP 请求 `Header` 中添加下面的配置

```
Authorization: Bearer API_TOKEN
```

`API_Token` 为在系统设置中生成的 `Token`，`Bearer` 为固有字段，两者通过空格连接。

标准的 Bearer Token 写法，跟大多数 API 网关一致。注意这个 token 是长期有效的，一旦泄漏别人就能一直读你的数据，所以它只能放在服务端。前端页面要读 CMS 内容，正确做法是走云开发 SDK 加安全规则，或者自己包一层接口，别把 token 打进前端包。

![在 Postman 请求头中加入 Bearer Token 后成功返回数据](https://s.poetries.top/uploads/2022/06/e083278e128641d0.png)

![带 Token 鉴权访问 CMS RESTful API 的完整响应结果](https://s.poetries.top/uploads/2022/06/2baff45a779d611a.png)

### 9.3 微信开发者工具部署

如果你的场景是小程序，不想开腾讯云控制台，在微信开发者工具里也能直接装 CMS。走的是小程序侧的云开发控制台，功能跟腾讯云那边基本一致。

> 参考 https://docs.cloudbase.net/cms/install/mp

![微信开发者工具云开发控制台中的扩展应用入口](https://s.poetries.top/uploads/2022/06/4ba6ed3a0a6541da.png)
![在微信开发者工具中安装 CloudBase CMS 扩展](https://s.poetries.top/uploads/2022/06/81875bb480c85e7d.png)

要注意小程序侧和腾讯云侧的控制台能力不完全对等，前面提过静态网页托管就只在腾讯云控制台支持。所以真要做完整的 Web 应用，还是回腾讯云那边操作更全。

## 十、云开发部署腾讯微搭低代码

最后提一嘴微搭。它是搭在云开发之上的低代码平台，拖拽出页面，数据源直接用云开发的数据库和云函数。

我自己没深入用过，只是知道它跟前面讲的东西是同一套底层，做后台管理、活动页这类结构化程度高的页面，比手写快不少。真要评估的话建议去看官方文档和实际 demo，我这里就不展开了，免得说错。

> 文档地址 https://docs.cloudbase.net/lowcode/introduce

控制台 https://console.cloud.tencent.com/lowcode/overview/index

## 总结

从头到尾跑一遍下来，这套东西能落地的核心其实就三件事。

第一件是环境。环境 ID 加地域是所有操作的前提，地域选错项目就「消失」，配置文件里 `region` 填错就部署失败。建环境的时候顺手把计费方式定好，静态托管和 CMS 都只支持按量付费，事后改就得重建。

第二件是 `cloudbaserc.json`。它是本地项目跟云端环境之间唯一的契约，CLI、VS Code 插件、云端一键部署读的都是它。写它的时候记得加 `$schema`，编辑器的补全和校验能省掉大量翻文档的时间。多环境靠 `.env` 加 `--mode` 切换，密钥进 `.env.local` 并且第一时间写进 `.gitignore`。

第三件是选对部署形态。零散接口用云函数插件，完整框架工程用 node 插件，非 Node 或者要长连接就上容器。云函数 60 秒超时和 50 MB 包体这两个硬限制，是决定「这个需求能不能用云函数做」的分水岭。

踩坑清单里最值得记住的几个：Node SDK 那几个「非必填」参数在本地环境其实必填；Cron 是七位不是五位；`fn config update` 是全量覆盖不是增量；安全域名不配好，本地开发会报成跨域错误让你查错方向。

至于要不要用云开发，我的判断是这样：一个人或者小团队做的项目，前后端都是自己写，接口不多，用它能省下的运维时间是实打实的。团队规模上来、要精细控制资源和成本、或者已经有成熟的 K8S 体系，那它的封装反而会成为束缚。工具没有好坏，看你现在缺的是什么。

## 参考

### 官方文档

- [云开发 CloudBase 云原生一体化应用开发平台，快速构建小程序、Web、移动应用](https://cloudbase.net/)
- [云开发 CloudBase文档](https://docs.cloudbase.net/database/introduce)
- [云开发 CloudBase官方文档](https://cloud.tencent.com/document/product/876)
- [CloudBase CLI](https://docs.cloudbase.net/cli-v1/quick-start)
- [CloudBase SDK](https://cloud.tencent.com/document/product/876/46332)
- [CloudBase 应用中心拥有各类热门应用，以及大量的生产级项目模板，案例模板，开发者可以自由选择，并将项目一键部署到云开发](https://www.cloudbase.net/marketplace.html)
- [云开发 Tencent CloudBase Github Action 可以将 Github 项目自动部署到云开发环境](https://github.com/TencentCloudBase/cloudbase-action)
- [cloudbase-framework-github](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-container)
- [Tencent CloudBase Github](https://github.com/TencentCloudBase)
- [cloudbaserc.json 配置文件](https://docs.cloudbase.net/cli-v1/config)
- [云开发 React UI 组件 是云开发官方维护的 UI 组件库，提供基于云开发封装的一系列能力，目前已支持统一登录能力](https://docs.cloudbase.net/cloudbase-ui/introduce)
- [云开发 Vue 插件是云开发官方维护的 Vue 插件，提供全局入口、Vue 逻辑组件等功能](https://docs.cloudbase.net/cloudbase-vue/introduce)
- [Cloudbase Server Node.js SDK 让您可以在服务端（如腾讯云云函数或 云主机 等）使用 Node.js 服务访问 TCB 的的服务，如云函数调用，文件上传下载，数据库集合文档操作等，方便快速搭建应用](https://docs.cloudbase.net/api-reference/server/node-sdk/introduction)
- [@cloudbase/js-sdk 让您可以在 Web 端（如 PC Web 页面、微信公众平台 H5 等）使用 JavaScript 访问 Cloudbase 服务和资源](https://docs.cloudbase.net/api-reference/webv2/initialization)
- [CloudBase CMS 是云开发推出的，基于 Node.js 的 Headless 内容管理平台，提供了丰富的内容管理功能](https://docs.cloudbase.net/cms/intro)
- [云开发 Webify：专为 Web 开发者打造的应用托管平台，极速开发、部署、上线](https://webify.cloudbase.net/)
- [云开发工程模板示例，可通过 CloudBaseFramework 一键创建和部署](https://github.com/TencentCloudBase/cloudbase-templates)
- [微信小程序密钥工具](https://framework-1258016615.tcloudbaseapp.com/mp-key-tool/)

### 社区提问

- 「腾讯云·云开发」相关：[腾讯兔小巢](https://support.qq.com/products/148793) （云开发能力相关的首选这里）
- 「微信·云开发」相关：[微信开放社区](https://developers.weixin.qq.com/community/minihome/mixflow/1286298401038155776) （微信相关的都在这里问）
- 「微信·云托管」相关：[微信开放社区](https://developers.weixin.qq.com/community/minihome/mixflow/1919566493118201863) （云托管相关的都在这里问）

### 相关阅读

- [微信云托管入门与实践](https://feinterview.poetries.top/blog/wxcloud-intro)
- [Serverless 部署实践总结](https://feinterview.poetries.top/blog/serverless-deploy-summary)
- [前端进阶之旅](https://interview.poetries.top)
