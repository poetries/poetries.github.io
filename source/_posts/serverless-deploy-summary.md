---
title: serverless部署前后端项目实践
date: 2022-06-18 10:10:24
tags: 
  - 部署
  - serverless
categories: Front-End
---


# 一、serverless架构介绍及安装serverless

* `Serverless`又名无服务器,所谓无服务器并非是说不需要依赖和依靠服务器等资源,而是开发者再也不用过多考虑服务器的问题,可以更专注在产品代码上。
* `Serverless`是一种软件系统架构的思想和方法，它不是软件框架、类库或者工具。它与传统架构的不同之处在于，完全由第三方管理，由事件触发，存在于无状态(`Stateless`)、 暂存(可能只存在于一次调用的过程中)计算容器内。构建无服务器应用程序意味着开发者可以专注在产品代码上，而无须管理和操作云端或本地的服务器或运行时(运行时通俗的讲 就是运行环境，比如 `nodejs `环境，`java` 环境，`php` 环境)。`Serverless` 真正做到了部署应用 无需涉及基础设施的建设，自动构建、部署和启动服务。

**通俗的讲：Serverless 是构建和运行软件时不需要关心服务器的一种架构思想**

虚拟主机已经是快被淘汰掉的上一代产物了。云计算涌现出很多改变传统 IT 架构和运维方 式的新技术，比如虚拟机、容器、微服务，无论这些技术应用在哪些场景，降低成本、提升 效率是云服务永恒的主题。**Serverless 的出现真正的解决了降低成本、提升效率的问题**。它真正做到了`弹性伸缩`、`高并发`、`按需收费`、`备份容灾`、日`志监控`等。

## 1.1 传统的开发模式与serverless开发模式对比

传统的开发模式

![](https://s.poetries.work/uploads/2022/06/f328901c0adb56de.png)

新型的serverless开发模式

![](https://s.poetries.work/uploads/2022/06/bcc852ef2bc8fbd7.png)

Serverless 正在改变未来软件开发的模式和流程

![](https://s.poetries.work/uploads/2022/07/44fa5d83bc09c564.png)

## 1.2 Serverless 和 ServerFul 架构的区别

### 传统的 ServerFul 架构模式

ServerFul 架构就是 n 台 Server 通过 网络通信 的 方式 协作在一起，也可以说 ServerFul 架构是基于 Server 和 网络通信（分布式计算） 的 软件实现架构 ， Server 可 以是 虚拟机 物理机 ，以及基于硬件实现的云的云服务器

![](https://s.poetries.work/uploads/2022/07/a6ac5a7905e6f81c.png)

### Serverless 架构模式

Serverless 的核心特点就是实现自动弹性伸缩和按量付费

![](https://s.poetries.work/uploads/2022/07/3d5b8a8b53bd5315.png)

## 1.3 使用serverless的优势

- **资源分配**: 在 `Serverless` 架构中，你不用关心应用运行的资源(比如服务配置、磁盘大小)只提供一份代码就行。
- **计费方式**: 在` Serverless` 架构中，计费方式按实际使用量计费(比如函数调用次数、运 行时长)，不按传统的执行代码所需的资源计费(比如固定 `CPU`)。计费粒度也精确到了毫 秒级，而不是传统的小时级别。个别云厂商推出了每个月的免费额度，比如腾讯云提供了每 个月 40 万 GBs 的资源使用额度和 100 万次调用次数的免费额度。中小企业的网站访问量不 是特别大的话完全可以免费使用。

![](https://s.poetries.work/uploads/2022/06/4f400ccd6d34b420.png)

- **弹性伸缩**:` Serverless` 架构的弹性伸缩更自动化、更精确，可以快速根据业务并发扩容更 多的实例，甚至允许缩容到零实例状态来实现零费用，对用户来说是完全无感知的。而传统 架构对服务器(虚拟机)进行扩容，虚拟机的启动速度也比较慢，需要几分钟甚至更久。

## 1.4 Serverless 组成

- **广义的 Serverless** 更多是指一种技术理念：Serverless 是构建和运行软件时不需要关心服务 器的一种架构思想。刚开始学 Serverless 你可以把它理解为虚拟主机的升级版本
- **狭义的 Serverless** 是指现阶段主流的技术实现：狭义的 Serverless 是 `FaaS`和 `BaaS` 组成

![](https://s.poetries.work/uploads/2022/07/e445b52f9d9a9958.png)

## 1.5 Serverless 开发流程

![](https://s.poetries.work/uploads/2022/07/1aa3208070a48915.png)

## 1.6 为什么要学 Serverless

先看看招聘信息

![](https://s.poetries.work/uploads/2022/07/c50918e799e3068b.png)

看看最近 2 年 Github 的 start 数量和周下载量

![](https://s.poetries.work/uploads/2022/07/9784d6ed1170f473.png)

![](https://s.poetries.work/uploads/2022/07/c7c5fe6b663fbe4f.png)

![](https://s.poetries.work/uploads/2022/07/750e45e4a038a162.png)

目前已经使用了 serverless 的大公司

![](https://s.poetries.work/uploads/2022/07/d0ace73fab7e28ba.png)

## 1.7 Serverless 的能力

### 计算能力

- 资源按需分配，无需申请资原
- Mwm：租户级别强镜离 Docker：进程级别隔离
- Mwm+Docker 轻量级资源毫秒级启动
- 实时扩容，阶梯缩容
- 按需收费

### 系统运维能力

- 性能保障：整个链路耗时毫秒级内,并支持 VPC 内网访问
- 安全保障
  - 资源对用户不可见,安全由腾讯云提供专业的保障
  - 提供进程级和用户级安全隔离
  - 访问控制管理
- 自动性护缩容
  - 根据 CPU 内容网络 IO 自动扩容底层资源
  - 根据请求数自动扩缩容函数实例，业务高峰期扩容，满足业务高并发需求，业务低 峰期缩容，释放资源，降低成本
- 自愈能力：每一次请求都是一个健康的实例

> Serverless 中云函数被第一次调用会执行冷启动，Serverless 中云函数被多次连续调用会 执行热启动

![](https://s.poetries.work/uploads/2022/07/527e0cfb402fa738.png)

- **冷启动** 是指你在服务器中新开辟一块空间供一个函数实例运行，这个过程有点像你把这 个函数放到虚拟机里去运行，每次运行前都要先启动虚拟机加载这个函数，以前冷启动非常 耗时，但是目前云厂商已经能做到毫秒级别的冷启动，这个过程我们也不需要关心，但是需 要注意的是使用 Seesion 的时候可能会导致 Session 丢失，所以我们的 Seesion 建议保存到数 据库。
- **热启动** 则是说如果一个云函数被持续触发，那我就先不释放这个云函数实例，下次请求 仍然由之前已经创建了的云函数实例来运行，就好比我们打开虚拟机运行完这个函数之后没 有关闭虚拟机，而是让它待机，等待下一次被重新触发调用运行，这样做的好处就是省去了 给虚拟机「开机」的一个耗时环节，缺点是要一直维持这个虚拟机的激活状态，系统开销会 大一些。

### 业务运维能力

- 工具建设：vscode 插件、WebIDE、Command Line、云 api、Sdk
- 版本管理、操作管理等
- 故障排查
- 监控报警
- 容灾处理

## 1.8 serverless厂家

* [亚马逊 AWS Lambda ](https://aws.amazon.com/cn/lambda/)
* [谷歌 Google Cloud Functions]( https://cloud.google.com/functions)
* [微软 Microsoft Azure]( https://www.azure.cn/)
* [阿里云函数计算](https://www.aliyun.com/product/fc)
* [腾讯云 云函数 SCF(Serverless Cloud Function)](https://cloud.tencent.com/product/scf )
* [华为云 FunctionGraph](https://www.huaweicloud.com/product/functiongraph.html)

## 1.9 云函数和serverless的区别

> 通过前面的介绍，我们认识到了云函数和`serverless`，但是可能会有一个很迷惑云函数和`serverless`到底有什么区别，他们之间有什么联系，为什么我在创建云函数的时候选择模板方式创建最后创建的是`serverless`，而不是云函数呢。下面我们将解答云函数和`serverless`的区别

- `Serverless Framework` 是` Serverless `公司推出的一个开源的` Serverless` 应用开发框架
- `Serverless Framework`是由 `Serverless Framework Plugin` 和 `Serverless Framework Components` 组成
- `Serverless Framework Plugin` 实际上是一个函数的管理工具，使用这个工具，可以很轻松的 **部署函数、删除函数、触发函数、查看函数信息、查看函数日志、回滚函数、查看函数** 数据等。简单的概括就是`serverless`其实就**云函数的集合体**，使用`serverless`后我们创建的云函数不需要手动去创建触发器等操作

**官方地址**

* [serverless官网地址](https://www.serverless.com/)
* [serverless中文官网](https://cn.serverless.com)
* [github地址](https://github.com/serverless/serverless)



## 1.20 创建serverless的方式

- 在腾讯`serverless`控制面板上创建，然后在`vscode`中使用插件的方式下载到本地（**注意: ** 编辑器上要选择和创建`serverless`地区相同，才能看到项目，否则是看不到项目代码的）
- 使用客户端`serverless cli`命令方式创建，个人也更推荐使用这种方式创建，修改代码，然后部署到后台腾讯云服务上


# 二、serverless 脚手架安装、WebIDE中创建、vscode中配置

## 2.1 脚手架安装-三分钟部署一个项目

```bash
npm i serverless -g

serverless -v
```

查看支持的框架部署

```bash
sls registry

# 或者输入sls
sls
```

![](https://s.poetries.work/uploads/2022/06/bb939fc00c99aa5a.png)

```bash
# 例如初始化egg项目

serverless init eggjs-starter(可以替换成sls registry已有的模板) --name egg-example
```

部署 

```bash
sls deploy
```

## 2.2 在vscode中配置插件来开发serverless

通过该 VS Code 插件，您可以

- 拉取云端的云函数列表，并触发云函数
- 在本地快速创建云函数项目
- 使用模拟的 COS、CMQ、CKafka、API 网关等触发器事件来触发函数运行
- 上传函数代码到云端，更新函数配置
- 在云端运行、调试函数代码

**界面上创建应用**

![](https://s.poetries.work/uploads/2022/06/18c3d872701f1cfc.png)

- 在`vscode`上安装插件

![](https://s.poetries.work/uploads/2022/06/0b0cf6ae03f9277b.png)

- 在`vscode`安装后插件登录并且拉取应用

> 密钥地址 https://console.cloud.tencent.com/cam/capi 填入appID、secretID、secretKey即可拉取云函数到本地

![](https://s.poetries.work/uploads/2022/07/66d614b9bba52dbf.png)

- 切换地域查看函数

![](https://s.poetries.work/uploads/2022/07/d5010c1e04560057.png)


- 点击云函数，可以查看函数基本配置信息

![](https://s.poetries.work/uploads/2022/07/9e081856b313fc45.png)

- 下载函数代码到本地调试，点击下载图标选择要保存的路径

![](https://s.poetries.work/uploads/2022/07/a7b44ad3928be60f.png)

- 本地修改完代码后，上传函数代码到云端

![](https://s.poetries.work/uploads/2022/07/9e2f3c3bc5832035.png)
![](https://s.poetries.work/uploads/2022/07/f497c782f6070744.png)

- 本地调试云函数

![](https://s.poetries.work/uploads/2022/07/99f7dc28e086be60.png)

## 2.3 WebIDE创建云函数实践

**创建一个云函数**

![](https://s.poetries.work/uploads/2022/06/dd99f3d6323b8e15.png)

**给云函数创建触发器来访问**

![](https://s.poetries.work/uploads/2022/06/894bd8fb7cee9aa8.png)

创建了触发器后，就可以通过触发器里面的访问路径来访问云函数

![](https://s.poetries.work/uploads/2022/06/6ea1e2875196d30e.png)
![](https://s.poetries.work/uploads/2022/06/535aa49e41c50789.png)

> 我们可以在控制台修改代码，然后重新部署云函数，或者开启自动安装依赖等

![](https://s.poetries.work/uploads/2022/07/e5f68c50a4296d47.png)

# 三、Serverless Framework部署项目实战

## 3.1 Serverless Framework简介及应用场景

- Serverless Framework 是 Serverless 公司推出的一个开源的 Serverless 应用开发框架
- Serverless Framework 是 由 Serverless Framework Plugin 和 Serverless Framework Components 组成
- Serverless Framework Plugin 实际上是一个函数的管理工具，使用这个工具，可以很轻 松的部署函数、删除函数、触发函数、查看函数信息、查看函数日志、回滚函数、查看函数 数据等

> Serverless Framework Components 可以看作是一个组件集，这里面包括了很多的 Components，有基础的 Components，例如 cos、scf、apigateway 等，也有一些拓展的 Components，例如在 cos 上拓展出来的 website，可以直接部署静态网站等，还有一些框 架级的，例如 Koa，Express等

- Serverless Framework 官网：https://www.serverless.com/ 
- Serverless Framework 中文网站：https://www.serverless.com/cn 
- Github 地址：https://github.com/serverless/serverless

### Serverless Framework 应用场景

> 上面既然介绍了云函数和`serverless`的区别，现在我们介绍下什么场景下需要使用`serverless`，而不是使用云函数，其实在实际开发过程中，我们都是使用`serverless`而不去使用云函数，毕竟云函数的使用场景受限，或者说比较基础。打一个简单的比方，在写`js`操作`dom`的时候，你会选择用原生`js`还是会使用`jquery`一样的比喻

**基于云函数的命令行开发工具**

> 通过 `Serverless Framework`，开发者可以在命令行完成函数的开发、部署、调试。还可以结合前端服务、 API 网关、数据库等其它云上资源，实现全栈应用的快速部署。

**传统应用框架的快速迁移**

> `Serverless Framework` 提供了一套通用的框架迁移方案，通过使用 `Serverless Framework `提供的框架组件(`Egg/Koa/Express` 等，[更多的框架支持可以参考](https://github.com/serverless))，原有应用仅需几行代码简单改造， 即可快速迁移到函数平台。同时支持命令行与控制台的开发方式。

### Serverless Framework 支持的平台

> https://github.com/serverless/serverless/tree/master/docs/providers

![](https://s.poetries.work/uploads/2022/07/228c4a131acdb03c.png)

## 3.2 Serverless Components 支持组件列表

### 基础组件

- [@serverless/tencent-postgresql](https://github.com/serverless-components/tencent-postgresql/tree/master) - 腾讯云 PG DB Serverless 数据库组件
- [@serverless/tencent-apigateway](https://github.com/serverless-components/tencent-apigateway) - 腾讯云 API 网关组件
- [@serverless/tencent-cos](https://github.com/serverless-components/tencent-cos) - 腾讯云对象存储组件
- [@serverless/tencent-scf](https://github.com/serverless-components/tencent-scf/tree/master) - 腾讯云云函数组件
- [@serverless/tencent-cdn](https://github.com/serverless-components/tencent-cdn) - 腾讯云 CDN 组件
- [@serverless/tencent-vpc](https://github.com/serverless-components/tencent-vpc/tree/master) - 腾讯云 VPC 私有网络组件

### 高阶组件

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

## 3.3 sls部署egg项目

> egg 框架中默认已经配置好了静态资源，我们可以直接访问。要注意的是 serverless 服务器 上面只有根目录的 tmp 目录有写入权限，所以需要配置 egg 日志存储的目录。默认创建好 项目以后有如下配置。

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

### 控制台创建部署-模板部署

1. 登录控制台 https://console.cloud.tencent.com/sls
2. 单击新建应用，选择Web 应用>Egg 框架，如下图所示：

![](https://s.poetries.work/uploads/2022/06/fbf0b03c839cd73e.png)

3. 单击“下一步”，完成基础配置选择。

![](https://s.poetries.work/uploads/2022/06/58b123659a00b194.png)

4. 上传方式，选择示例代码直接部署，单击完成，即可开始应用的部署。
5. 部署完成后，您可在应用详情页面，查看示例应用的基本信息，并通过 API 网关生成的访问路径 URL 进行访问，查看您部署的 Egg 项目。

![](https://s.poetries.work/uploads/2022/06/c4c3e330b1a6af68.png)

### 控制台创建部署-自定义部署(推荐)

> 如果除了代码部署外，您还需要更多能力或资源创建，如自动创建层托管依赖、一键实现静态资源分离、支持代码仓库直接拉取等，可以通过应用控制台，完成 Web 应用的创建工作

**初始化项目**

```
mkdir egg-example && cd egg-example
npm init egg --type=simple
npm i
```

**部署上云**

> 接下来执行以下步骤，对本地已创建完成的项目进行简单修改，使其可以通过 Web Function 快速部署，对于 Egg 框架，具体改造说明如下：

- 修改监听地址与端口为 `0.0.0.0:9000`。
- 修改写入路径，serverless 环境下只有 `/tmp` 目录可读写。
- 新增 `scf_bootstrap` 启动文件。

**1. (可选)配置 scf_bootstrap 启动文件**

您也可以在控制台完成该模块配置。

![](https://s.poetries.work/uploads/2022/06/85b3d73ea922f0ea.png)

> 在项目根目录下新建 `scf_bootstrap` 启动文件，在该文件添加如下内容（用于配置环境变量和启动服务，此处仅为示例，具体操作请以您实际业务场景来调整）：

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

> 新建完成后，还需执行以下命令修改文件可执行权限，默认需要 777 或 755 权限才可正常启动。示例如下：

```
chmod 777 scf_bootstrap
```

**2. 控制台上传**

> 您可以在控制台完成启动文件 scf_bootstrap 内容配置，配置完成后，控制台将为您自动生成 启动文件，和项目代码一起打包部署

启动文件以项目内文件为准，如果您的项目里已经包含 `scf_bootstrap` 文件，将不会覆盖该内容。

![](https://s.poetries.work/uploads/2022/06/a96ce1c3799f5951.png)
![](https://s.poetries.work/uploads/2022/06/ce48d9dd73af824f.png)
![](https://s.poetries.work/uploads/2022/06/9a0e3dfa25a6ed3d.png)

![](https://s.poetries.work/uploads/2022/06/e9dd1225bf0d37cd.png)

查看函数，修改代码查看日志等

![](https://s.poetries.work/uploads/2022/06/ca238c35541dd8df.png)

**高级配置管理**

> 您可在“高级配置”里进行更多应用管理操作，如创建层、绑定自定义域名、配置环境变量等。

![](https://s.poetries.work/uploads/2022/06/4ab13bbb74bcdf89.png)


### HTTP 组件方式部署(推荐)

> 目前推荐使用 web 函数，也就是 `HTTP 组件`，现在所有的serverless web 应用都是基于 `component: http` 组件的。

> 通过 `Serverless Framework` 的 `HTTP 组件`，完成 Web 应用的本地部署

**前提条件**

> 已开通服务并完成 [Serverless Framework 的 权限配置](https://cloud.tencent.com/document/product/1154/43006)


```bash
# 初始化egg项目

serverless init eggjs-starter(可以替换成sls registry已有的模板) --name egg-example
```

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

> 全部配置详细查看  https://github.com/serverless-components/tencent-http/blob/master/docs/configure.md

**部署**

> 创建完成后，在根目录下执行 `sls deploy` 进行部署，组件会根据选择的框架类型，自动生成 `scf_bootstrap` 启动文件进行部署

![](https://s.poetries.work/uploads/2022/06/8e11d14d715ba443.png)

我们也可以在项目跟目录自己创建启动文件`scf_bootstrap` ，然后`chmod 777 scf_bootstrap`

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

> 注意：由于启动文件逻辑与用户业务逻辑强关联，默认生成的启动文件可能导致框架无法正常启动，建议您根据实际业务需求，手动配置启动文件，[详情参考各框架的部署指引文档](https://cloud.tencent.com/document/product/1154/59447)。

![](https://s.poetries.work/uploads/2022/06/9d3580eef444d80f.png)

> 如果部署过程遇到问题不好排除，如以下问题：

![](https://s.poetries.work/uploads/2022/06/6d5fd5ba537850dd.png)

来到控制台创建项目

![](https://s.poetries.work/uploads/2022/06/1ac3905f67789812.png)
![](https://s.poetries.work/uploads/2022/06/715ea0e1c4d12298.png)
![](https://s.poetries.work/uploads/2022/06/a3921110151f0ba3.png)
![](https://s.poetries.work/uploads/2022/06/f91266106e6e1d78.png)
![](https://s.poetries.work/uploads/2022/06/2117adef0814c390.png)

**在控制台安装依赖包**

> 我们在`sls deploy`忽略了`node_modules`，因此需要在控制台安装依赖

![](https://s.poetries.work/uploads/2022/06/d47f6e73f93d5055.png)

访问应用

![](https://s.poetries.work/uploads/2022/06/9ad37b26fbab516d.png)

到控制台查看

![](https://s.poetries.work/uploads/2022/06/14c5cc6d18060612.png)
![](https://s.poetries.work/uploads/2022/06/369867cf3dc9a1e1.png)
![](https://s.poetries.work/uploads/2022/06/3cdd7bf1c596d876.png)

删除应用

```
sls remove
```

![](https://s.poetries.work/uploads/2022/06/9db881d3d57a0c59.png)

### 使用Layer 来减小项目文件大小

随着项目复杂度的增加，`deploy` 上传会变慢。所以，让我们再优化一下，在项目根目录创建 `layer/serverless.yml`


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

创建后可见层对应信息

![](https://s.poetries.work/uploads/2022/06/7e5abeb49a56f460.png)

我们也可以在控制台新建层绑定到对应的函数即可

![](https://s.poetries.work/uploads/2022/06/d10f5ea7b0cac331.png)

控制台上传层有大小限制

![](https://s.poetries.work/uploads/2022/06/683f6152002db3a9.png)

文件夹支持250M

![](https://s.poetries.work/uploads/2022/06/6495e575646c3035.png)

![](https://s.poetries.work/uploads/2022/06/740312afd66bc342.png)


**修改以上项目下的serverless.yml加入层配置**

回到项目根目录，调整一下根目录的 `serverless.yml`

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

通过配置层layer，代码和`node_modules`分离，`sls deploy`更快

> 接着执行命令 `sls deploy --target=./layer`部署层，然后再次部署`sls deploy`看看速度应该更快了

![](https://s.poetries.work/uploads/2022/06/f5d5c8b90fdf942c.png)
![](https://s.poetries.work/uploads/2022/06/6683161cf18fc51c.png)
![](https://s.poetries.work/uploads/2022/06/88d1098b222f184b.png)
![](https://s.poetries.work/uploads/2022/06/b5b0c69b6962434d.png)

每次`node_modules`改变都需要 

- 执行 `sls deploy --target=./layer` 部署层， 更新 `node_modules` 层
- 执行 `sls deploy` 重新部署

**layer 的加载与访问**

> layer 会在函数运行时，将内容解压到 `/opt` 目录下，如果存在多个 `layer`，那么会按时间循序进行解压。如果需要访问 `layer` 内的文件，可以直接通过 `/opt/xxx` 访问。如果是访问 `node_module` 则可以直接 `import`，因为 `scf` 的 `NODE_PATH` 环境变量默认已包含 `/opt/node_modules` 路径。


### 使用serverless fromwork的高阶egg组件方式部署(不推荐)

> 目前推荐使用 web 函数，也就是 `HTTP 组件`，现在所有的serverless web 应用都是基于 `component: http` 组件的。


1. 在项目根目录下创建 `serverless.yml`文件

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

2. 将代码推送到云端

```
sls deploy # sls deploy --debug可以查看日志
```

3. 扫描登录部署会在项目下创建一个`.env`的`serverless`的登录信息

![](https://s.poetries.work/uploads/2022/06/4bb68977c923970f.png)

4. 部署成功，打开地址访问，此时会报错，我们没有把node_modules一起上传

![](https://s.poetries.work/uploads/2022/06/b6d50b9d2070559c.png)
![](https://s.poetries.work/uploads/2022/06/fecba16d7e2071eb.png)

浏览器打开提示缺少模块

![](https://s.poetries.work/uploads/2022/06/08a0618ffe147378.png)

我们在控制台上点击

![](https://s.poetries.work/uploads/2022/06/e6454fd010815c3f.png)
![](https://s.poetries.work/uploads/2022/06/50bcc5c01f3af862.png)

打开自动安装依赖后重新部署即可看到`node_modules`，这时再次访问浏览器地址

![](https://s.poetries.work/uploads/2022/06/fd6229e7d654a470.png)
![](https://s.poetries.work/uploads/2022/06/53fa2c373a8a69cd.png)



## 3.4 sls部署nestjs项目

### 模板部署 -- 部署 Nest.js 示例代码

1. 登录 [Serverless 应用控制台](https://console.cloud.tencent.com/sls)。
2. 单击新建应用，选择Web 应用>Nest.js 框架，如下图所示：

![](https://s.poetries.work/uploads/2022/06/c05fcae4ea2a8593.png)

3. 单击“下一步”，完成基础配置选择

![](https://s.poetries.work/uploads/2022/06/c23d3219be7ab860.png)

- 上传方式，选择示例代码直接部署，单击完成，即可开始应用的部署。
- 部署完成后，您可在应用详情页面，查看示例应用的基本信息，并通过 API 网关生成的访问路径 URL 进行访问，查看您部署的 Nest.js 项目

![](https://s.poetries.work/uploads/2022/06/60f6e95248310f40.png)

### 自定义模板部署nest(推荐)

**初始化您的 Nest.js 项目**

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

接下来执行以下步骤，对已初始化的项目进行简单修改，使其可以通过 Web Function 快速部署，此处项目改造通常分为以下两步：

- 新增 `scf_bootstrap` 启动文件。
- 修改监听地址与端口为 `0.0.0.0:9000`。

1. 修改启动文件`main.ts`，监听端口改为`9000`:

![](https://s.poetries.work/uploads/2022/06/12736ad9dda9b911.png)

2. 在项目根目录下新建 `scf_bootstrap` 启动文件，在该文件添加如下内容（用于启动服务）：

您也可以在控制台完成该模块配置。

![](https://s.poetries.work/uploads/2022/06/9a96d63935762fc3.png)

```bash
# scf_bootstrap
#!/bin/bash

SERVERLESS=1 /var/lang/node12/bin/node ./dist/main.js
```

新建完成后，还需执行以下命令修改文件可执行权限，默认需要 777 或 755 权限才可正常启动。示例如下：

```
chmod 777 scf_bootstrap
```

本地配置完成后，执行启动文件，确保您的服务可以本地正常启动，接下来，登录 Serverless 应用控制台，选择Web 应用>Nest.js 框架，上传方式可以选择本地上传或代码仓库拉取


> 注意：启动文件以项目内文件为准，如果您的项目里已经包含 scf_bootstrap 文件，将不会覆盖该内容。


![](https://s.poetries.work/uploads/2022/06/c1fe93fe050d5f5c.png)


### 使用http组件(推荐)

> 目前推荐使用 web 函数，也就是 `HTTP 组件`，现在所有的serverless web 应用都是基于 `component: http` 组件的。


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
    framework: nestjs # #选择框架，此处以 egg 为例 
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

在项目根目录下新建 `scf_bootstrap` 启动文件，在该文件添加如下内容（用于启动服务）：


```bash
#!/bin/bash

SERVERLESS=1 /var/lang/node12/bin/node ./dist/main.js
```

忽略`node_modules`文件上传

```yml
# serverless.yml
exclude: # 被排除的文件或目录
  - .env
  - node_modules/**
```

执行 `sls deploy` （`sls deploy --debug` 查看部署日志）

![](https://s.poetries.work/uploads/2022/06/15d73875b2f56fd4.png)
![](https://s.poetries.work/uploads/2022/06/903af650eb01b169.png)
![](https://s.poetries.work/uploads/2022/06/a47a05e9bd8eb7c9.png)

**查看部署信息**

```
sls info
```

![](https://s.poetries.work/uploads/2022/06/68b296819ee39d4f.png)

**实时开发并上传**

> 每次改动文件，都实时部署

```
sls dev
```

**删除部署项目**

```
sls remove
```

![](https://s.poetries.work/uploads/2022/06/1c33faad7da0be9c.png)

### 使用Layer 来减小项目文件大小

随着项目复杂度的增加，`deploy` 上传会变慢。所以，让我们再优化一下，在项目根目录创建 `layer/serverless.yml`


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

**修改以上项目下的serverless.yml加入层配置**

回到项目根目录，调整一下根目录的 `serverless.yml`下的`layers`

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

通过配置层layer，代码和`node_modules`分离，`sls deploy`更快

> 接着执行命令 `sls deploy --target=./layer`部署层，然后再次部署`sls deploy`看看速度应该更快了

![](https://s.poetries.work/uploads/2022/06/b1a9175c8c6d1404.png)

每次`node_modules`改变都需要 

- 执行 `sls deploy --target=./layer` 先部署层， 更新 `node_modules` 层
- 执行 `sls deploy` 重新部署

**layer 的加载与访问**

> layer 会在函数运行时，将内容解压到 `/opt` 目录下，如果存在多个 `layer`，那么会按时间循序进行解压。如果需要访问 `layer` 内的文件，可以直接通过 `/opt/xxx` 访问。如果是访问 `node_module` 则可以直接 `import`，因为 `scf` 的 `NODE_PATH` 环境变量默认已包含 `/opt/node_modules` 路径。

### 使用serverless framework的高阶nestjs组件部署(不推荐)

> 目前推荐使用 web 函数，也就是 `HTTP 组件`，现在所有的serverless web 应用都是基于 `component: http` 组件的。

**初始化项目**

```
npm i -g @nestjs/cli
nest new nest-app
```

在根目录下，执行以下命令在本地直接启动服务。

```
cd nest-app && npm run start
```

**编写项目根目录下serverless.yml文件**

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

## 3.5 sls部署koa项目

### 控制台部署

1. 登录 [Serverless 应用控制台](https://console.cloud.tencent.com/sls)。
2. 单击新建应用，选择Web 应用>Koa 框架，如下图所示：

![](https://s.poetries.work/uploads/2022/06/6382481121ebc584.png)

3. 单击“下一步”，完成基础配置选择。
4. 上传方式，选择示例代码直接部署，单击完成，即可开始应用的部署。
5. 部署完成后，您可在应用详情页面，查看示例应用的基本信息，并通过 API 网关生成的访问路径 URL 进行访问，查看您部署的 Koa 项目

![](https://s.poetries.work/uploads/2022/06/6ab832e2d0343c64.png)

### 自定义模板部署

全局安装 `koa-generator` 脚手架.

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


**部署上云**

接下来执行以下步骤，对已初始化的项目进行简单修改，使其可以通过 Web Function 快速部署，此处项目改造通常分为以下两步：

- 修改监听地址与端口为 `0.0.0.0:9000`。

**具体步骤如下：**

在 Koa 示例项目中，修改监听端口到 `9000`

![](https://s.poetries.work/uploads/2022/06/6be48886a199d8df.png)
![](https://s.poetries.work/uploads/2022/06/dd5fd8c12cb5d46a.png)
![](https://s.poetries.work/uploads/2022/06/f4edaeba5e1bd1f2.png)
![](https://s.poetries.work/uploads/2022/06/92152ad6865809d8.png)

### 使用HTTP组件部署

**编写serverless.yml**

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

> scf_bootstrap

```bash
#!/bin/bash
/var/lang/node12/bin/node bin/www # 修改入口为bin/www，并且修改bin/www下端口为9000
```

**部署**

```
sls deploy
```

![](https://s.poetries.work/uploads/2022/06/74ac915db74d3dd6.png)
![](https://s.poetries.work/uploads/2022/06/34fceabfeb33c9e9.png)
![](https://s.poetries.work/uploads/2022/06/4dcbaf2dbb72cef4.png)

**查看部署信息**

```
sls info
```

![](https://s.poetries.work/uploads/2022/06/80ed7651618d4bd1.png)

**移除**

```
sls remove
```

# 四、部署静态网站

- 全部配置 https://github.com/serverless-components/tencent-website/blob/master/docs/configure.md
- 部署文档 https://cloud.tencent.com/document/product/1154/39276

> 部署的静态资源会存储到COS中

## 4.1 sls部署vue项目

**初始化项目**

```
vue init webpack vue-demo
```

**编写serverless.yml**

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
  autoSetupAcl: true # 自动配置 bucket 访问权限为 ”公有读私有写“
  autoSetupPolicy: false # 自动配置 bucket 的 Policy 权限为 ”所有用户资源可读“
  # env: # 配置前端环境变量
  #   API_URL: https://api.com
  # hosts:
  #   - host: test.com # 自定义域名
  #     async: false # 是否同步等待 CDN 配置。配置为 false 时，参数 autoRefresh 自动刷新才会生效，如果关联多域名时，为防止超时建议配置为 true。
  #     autoRefresh: true #开启自动 CDN 刷新，用于快速更新和同步加速域名中展示的站点内容
```

执行部署

```
sls deploy
```

> 如果希望查看更多部署过程的信息，可以通过`sls deploy --debug` 命令查看部署过程中的实时日志信息

![](https://s.poetries.work/uploads/2022/06/22914c1b39955760.png)
![](https://s.poetries.work/uploads/2022/06/84f4b895e0ef3e1a.png)

**开发调试**

> 部署了静态网站应用后，可以通过开发调试能力对该项目进行二次开发，从而开发一个生产应用。在本地修改和更新代码后，不需要每次都运行 `serverless deploy` 命令来反复部署。您可以直接通过 `serverless dev` 命令对本地代码的改动进行检测和自动上传。

- 可以通过在 `serverless.yml` 文件所在的目录下运行 `serverless dev` 命令开启开发调试能力。
- `serverless dev` 同时支持实时输出云端日志，每次部署完毕后，对项目进行访问，即可在命令行中实时输出调用日志，便于查看业务情况和排障。

**查看状态**

在`serverless.yml`文件所在的目录下，通过如下命令查看部署状态：

```
serverless info
```

**移除**

在`serverless.yml`文件所在的目录下，通过以下命令移除部署的静态网站 `Website` 服务。移除后该组件会对应删除云上部署时所创建的所有相关资源。

```
$ serverless remove
```

> 和部署类似，支持通过 `sls remove --debug` 命令查看移除过程中的实时日志信息

## 4.2 sls部署react项目

**初始化项目**

```
npm i create-umi -g
create-umi react-demo
```

**编写serverless.yml**

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
  autoSetupAcl: true # 自动配置 bucket 访问权限为 ”公有读私有写“
  autoSetupPolicy: false # 自动配置 bucket 的 Policy 权限为 ”所有用户资源可读“
  # env: # 配置前端环境变量
  #   API_URL: https://api.com
  # hosts:
  #   - host: test.com # 自定义域名
  #     async: false # 是否同步等待 CDN 配置。配置为 false 时，参数 autoRefresh 自动刷新才会生效，如果关联多域名时，为防止超时建议配置为 true。
  #     autoRefresh: true #开启自动 CDN 刷新，用于快速更新和同步加速域名中展示的站点内容
```

![](https://s.poetries.work/uploads/2022/06/8614efb6787a455f.png)
![](https://s.poetries.work/uploads/2022/06/4048c87e395ebe98.png)
![](https://s.poetries.work/uploads/2022/06/6aa33661c29780c8.png)


实时监控项目部署

```
sls dev
```

![](https://s.poetries.work/uploads/2022/06/a226acca0bb48bed.png)

## 4.3 sls部署vuepress项目

![](https://s.poetries.work/uploads/2022/06/3e7f22a3df08fa4b.png)

**编写serverless.yml配置**

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
  autoSetupAcl: true # 自动配置 bucket 访问权限为 ”公有读私有写“
  autoSetupPolicy: false # 自动配置 bucket 的 Policy 权限为 ”所有用户资源可读“
  # hosts:
  #   - host: test.com # 自定义域名
  #     async: false # 是否同步等待 CDN 配置。配置为 false 时，参数 autoRefresh 自动刷新才会生效，如果关联多域名时，为防止超时建议配置为 true。
  #     autoRefresh: true #开启自动 CDN 刷新，用于快速更新和同步加速域名中展示的站点内容
```

**执行部署**

```
sls deploy
```

![](https://s.poetries.work/uploads/2022/06/f150204a59359b6d.png)

**移除**

```
sls remove
```

# 五、综合实战

## 5.1 Serverless中使用Node操作Mysql、Mongodb数据库、以及配置VPC私有网络

### 云函数接入数据库

> 参考：https://cloud.tencent.com/document/product/583/51935

**注意**：配置私有网络的服务器需要在同一个地区

![](https://s.poetries.work/uploads/2022/07/1063776f916665ad.png)

### Nodejs Serverless 中操作 Mysql

- 准备工作：首先需要购买云数据库、或者自己在服务器上面搭建一个数据库
- 云函数操作 Mysql

**购买云数据库mysql**

![](https://s.poetries.work/uploads/2022/07/a32767996808f68f.png)

![](https://s.poetries.work/uploads/2022/07/ca2c192149944c02.png)

![](https://s.poetries.work/uploads/2022/07/fb6f3d7a624a73f6.png)

**新建mysql云函数**

![](https://s.poetries.work/uploads/2022/07/968044649cbdbfee.png)

- 选择和mysql同一个地域，程序之间通过VPC网络连接

![](https://s.poetries.work/uploads/2022/07/e7285b3cba07f7bf.png)

- 选择私有网络，和mysql所在网络一致

![](https://s.poetries.work/uploads/2022/07/c31cd4d7d163bb89.png)
![](https://s.poetries.work/uploads/2022/07/1d3382cca02d0f05.png)

如果没有需要新建私有网络，需要和msyql实例同一个地区，选择了新建的私有网络，mysql实例那边网络需要修改一致

![](https://s.poetries.work/uploads/2022/07/e848fe3eabb20b49.png)
![](https://s.poetries.work/uploads/2022/07/e5dfce33f28ac2f0.png)

- 登录mysql数据库增加测试数据

![](https://s.poetries.work/uploads/2022/07/765e9fdf679b9661.png)

新建test数据库

![](https://s.poetries.work/uploads/2022/07/794bc6fe87c43f55.png)

创建user表

![](https://s.poetries.work/uploads/2022/07/bc6c668125921773.png)

- 修改云函数代码，保存部署即可

![](https://s.poetries.work/uploads/2022/07/0ec0d7030a1a171a.png)

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

重新部署

![](https://s.poetries.work/uploads/2022/07/be2ad63b73cd90cb.png)

- 创建API网关触发器，在浏览器中访问

![](https://s.poetries.work/uploads/2022/07/4d25248bad953017.png)

![](https://s.poetries.work/uploads/2022/07/280e12f1381ad19b.png)

浏览器中访问查看效果

![](https://s.poetries.work/uploads/2022/07/3bf2e7588ef4db51.png)

### Nodejs Serverless 中操作 Mongodb

- 准备工作：首先需要购买云数据库、或者自己在服务器上面搭建一个数据库
- 云函数操作 Mongodb

**购买MongoDB数据库**

![](https://s.poetries.work/uploads/2022/07/88f6da606016085b.png)
![](https://s.poetries.work/uploads/2022/07/81895e9b9ae7dac9.png)

**创建云函数**

![](https://s.poetries.work/uploads/2022/07/ada2715770b68f92.png)

- 选择地区

![](https://s.poetries.work/uploads/2022/07/cdc6c87499019a46.png)

- 选择私有网络，和mongodb所在网络一致

![](https://s.poetries.work/uploads/2022/07/cfdd4a0e3e82ee18.png)

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

创建触发器

![](https://s.poetries.work/uploads/2022/07/1da43f40efc683d6.png)

![](https://s.poetries.work/uploads/2022/07/5a8d14fb5d7417c0.png)


## 5.2 Serverless BaaS 对象云存储Cos介绍、Node操作Cos、实现图片上传到Cos中

### 对象云存储 Cos 介绍

狭义的 Serverless 是指现阶段主流的技术实现：狭义的 Serverless 是 `FaaS` 和 `BaaS` 组成

![](https://s.poetries.work/uploads/2022/07/396be7b44eb9dd81.png)

> 对象存储（Cloud Object Storage，COS）是一种存储海量文件的分布式存储服务，具有高扩 展性、低成本、可靠安全等优点。通过控制台、API、SDK 和工具等多样化方式，用户可简 单、快速地接入 COS，进行多格式文件的上传、下载和管理，实现海量数据存储和管理。

![](https://s.poetries.work/uploads/2022/07/0fc384f78966e294.png)

### Nodejs 操作 Cos

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

### Express 在 Serverless 中实现图片上传到 Cos 中

安装模块 multer https://github.com/expressjs/multer

```bash
npm install --save multer
```

配置 form 表单

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

> 配置内存存储引擎 (`MemoryStorage`)，内存存储引擎将文件存储在内存中的 `Buffer` 对象，它没有任何选项

```js
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })
```

接收文件上传文件到云存储

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

**上传文件需要注意**

> https://github.com/serverless-components/tencent-koa/blob/master/docs/upload.md

![](https://s.poetries.work/uploads/2022/07/d959441445eecfb5.png)

修改`serverless.yml`

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

**完整serverless.yml**

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

部署，然后在webIDE开启自动安装依赖 

```bash
sls deploy
```

## 5.3 Serverless、Cos中配置域名访问以及Serverless中配置https访问

### Serverless 中配置域名访问

找到云函数对应的 api 网关

![](https://s.poetries.work/uploads/2022/07/7c53c0ead5e166f7.png)

编辑 api 网关 点击域名管理

![](https://s.poetries.work/uploads/2022/07/fa2e097f55e8460b.png)

新建域名

![](https://s.poetries.work/uploads/2022/07/9f4acfb1d41d15ec.png)

![](https://s.poetries.work/uploads/2022/07/cbc5cd59595597bc.png)

解析域名

![](https://s.poetries.work/uploads/2022/07/c2dc26b03c9b36be.png)

### Serverless 中配置 https 访问

HTTPS（全称：Hyper Text Transfer Protocol over Secure Socket Layer），是以安全为目标的 HTTP 通道，简单讲是 HTTP 的安全版。 

HTTPS 是在 HTTP 的基础上添加了安全层，从原来的明文传输变成密文传输，当然加密与解 密是需要一些时间代价与开销的，不完全统计有 10 倍的差异。

> 在当下的网络环境下可以忽 略不计，已经成为一种必然趋势。 目前微信小程序请求 Api 必须用 https、Ios 请求 api 接口必须用 https

**https 证书类型**

- 域名型 https 证书（DVSSL）：信任等级一般，只需验证网站的真实性便可颁发证书保护网站
- 企业型 https 证书（OVSSL）：信任等级强，须要验证企业的身份，审核严格，安全性更高
- 增强型 https 证书（EVSSL）：信任等级最高，一般用于银行证券等金融机构，审核严格，安全性最高， 同时可以激活绿色网址栏

**创建证书**

![](https://s.poetries.work/uploads/2022/07/c0bd93006ea724cd.png)

选择证书

![](https://s.poetries.work/uploads/2022/07/c7ecd5414acc9881.png)

### Cos 中配置域名

配置域名

![](https://s.poetries.work/uploads/2022/07/565fff50504ea193.png)

域名解析

![](https://s.poetries.work/uploads/2022/07/08646a66aeb4c8fb.png)


# 六、QA

## scf_bootstrap启动文件与sls.js启动文件区别

![](https://s.poetries.work/uploads/2022/06/c70fc14a6975b58d.png)

- `scf_bootstrap` 文件是针对 `web` 函数的，
- `sls.js` 入口文件是针对事件函数，主要是 `serverless` 封装了一些开源框架，改造的入口文件。

## 关于serverless.yml写法问题，是更推荐HTTP组件方式吗

![](https://s.poetries.work/uploads/2022/06/bf28a299163edd25.png)
![](https://s.poetries.work/uploads/2022/06/73dd2079f12bc9e2.png)
![](https://s.poetries.work/uploads/2022/06/2fd1b2033733a2f9.png)

> 目前推荐使用 web 函数，也就是 `HTTP 组件`，现在所有的serverless web 应用都是基于 `component: http` 组件的。

## 关于配额问题如何处理

云函数 scf 针对每个用户帐号，均有一定的配额限制：

![](https://s.poetries.work/uploads/2022/06/a75c8ba81b1830ac.png)

> 其中需要重点关注的就是单个函数代码体积 `500mb` 的上限。在实际操作中，云函数虽然提供了 `500mb`。但也存在着一个 `deploy` 解压上限。

**关于绕过配额问题：**

- 如果超的不多，那么使用 `npm install --production` 就能解决问题
- 如果超的太多，那就通过挂载 `cfs` 文件系统来进行规避（[参考文章](https://zhuanlan.zhihu.com/p/218803108?utm_source=wechat_session)）


# 七、官方文档

- [serverless官方应用中心文档](https://cloud.tencent.com/document/product/1154/59447)
- [serverless帮助文档](https://cn.serverless.com/framework/docs)
- [Serverless Components Github主页](https://github.com/serverless-components)
- [serverless-components/tencent-framework-components](https://github.com/serverless-components/tencent-framework-components)
- [serverless-components/tencent-nestjs](https://github.com/serverless-components/tencent-nestjs)
- [serverless-components/tencent-egg](https://github.com/serverless-components/tencent-egg)
- [serverless-components/tencent-http](https://github.com/serverless-components/tencent-http)
- [serverless 官方bug提交](https://github.com/serverless/serverless-tencent/issues)
- [serverless 官方社区文档](https://github.com/serverless/serverless-tencent/discussions)
