---
title: 本地构建部署easy-mock服务完整流程
description: 从 Redis、MongoDB 环境搭建到 yarn build 加 PM2 守护，完整记录在本地部署 easy-mock 服务的每一步，包含常见报错排查和线上项目迁移方案。
date: 2019-10-01 11:40:43
tags:
  - Mock
  - Easy Mock
  - Node
categories: Front-End
---

后端接口还没写完，前端页面已经等着联调了，这时候大家的做法基本一致：找个 Mock 服务把接口先造出来。Easy Mock 之所以流行，是因为它把「定义接口」这件事做成了在浏览器里填表单，不用写代码也不用起本地服务，团队里任何一个人都能上手改。

问题出在稳定性上。`https://easy-mock.com` 这个官方公共服务经常访问不了，赶上联调阶段服务挂掉，整个前端组的活都得停下来等。既然它是开源的，那就搬到自己机器上跑，接口数据握在自己手里，顺便还快了不少。

这篇把本地部署 Easy Mock 的完整流程记一遍，重点在 Redis 和 MongoDB 这两个前置依赖上，它们是整个过程里最容易卡住的地方。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Easy Mock 的依赖组成，为什么它同时需要 MongoDB 和 Redis
- macOS 下 Redis 的安装、编译和后台运行配置
- `redis-cli` 连不上的典型原因和排查顺序
- MongoDB 的安装与服务启动，以及 Homebrew 上的写法变化
- 从 clone 到 `yarn build` 再到 PM2 守护的完整部署链路
- 把线上 Easy Mock 项目迁移到本地实例的办法
- Easy Mock 这个方案现在还值不值得用，有哪些替代品

## 一、先搞清楚这套服务由什么组成

Easy Mock 是一个 Node 服务，它自己不存数据，数据落在两个地方。

MongoDB 存的是持久化内容，你建的项目、接口定义、Mock 规则都在里面。Redis 存的是缓存和会话，接口响应结果、登录态这些短期数据走它。所以这两个都得先跑起来，Easy Mock 才有地方读写。

按官方给的要求，环境版本是这样：

- Node `>= v8.9`
- MongoDB `>= v3.4`
- Redis `>= v4.0`

整个部署顺序拆开就是五步：

1. 装好 Node、MongoDB、Redis
2. clone Easy Mock 源码，按需改配置文件
3. 先直接启动一次，确认能跑通，能跑就 `Ctrl + C` 停掉
4. 启动 MongoDB 和 Redis 服务
5. `yarn build` 打包，然后用 PM2 守护 `app.js`

这个顺序不能乱。第 3 步单独跑一次很关键，它能把「代码本身有问题」和「依赖服务没起来」这两类错误分开，后面排查会省很多时间。

有人可能会问，起一个 Mock 服务而已，为什么要拖上两个数据库？其实是因为 Easy Mock 不只是「返回假数据」，它还要管项目、成员、接口版本、协作权限这些东西，这些必须落盘。Redis 那一份则是为了扛住高频的接口请求，联调阶段一个页面刷新可能就是几十个请求打过来，每次都去查 MongoDB 不划算。

顺带说一句配置文件。源码里的配置放在 `config/` 目录下，`default.json` 是默认值，正式跑用同目录下的 `production.json` 覆盖，需要改的主要是 MongoDB 的连接串、Redis 的地址端口，以及对外暴露的端口。默认值都是指向本地的，如果你的数据库就在同一台机器上，这一步基本不用动。

## 二、MongoDB 和 Redis 环境搭建

### 2.1 安装 Redis

Redis 官方安装教程在 http://www.runoob.com/redis/redis-install.html ，源码包从 https://redis.io/ 下载。

macOS 下我是手动编译装的。先把下载解压后的目录挪到 `/usr/local` 下，命令行也能完成，Windows 下建议就用图形界面操作。我自己在 mac 上直接敲命令时报了找不到目录的错，于是改成手动移动。

访达里跳转目录的快捷键是 `command + shift + G`，输入路径回车。

![在访达中用 command+shift+G 跳转到 /usr/local 目录](https://s.poetries.top/gitee/20191001/1.png)

放好之后进到 Redis 源码目录，执行编译安装：

```bash
sudo make install
```

这一步会把 `redis-server`、`redis-cli` 这些可执行文件装到系统路径里。如果报编译错误，多半是缺 Xcode 命令行工具，先跑一次 `xcode-select --install`。

装完第一反应是执行 `redis-cli` 试试，结果连不上。

![执行 redis-cli 提示连接失败](https://s.poetries.top/gitee/20191001/2.png)

这个报错第一次遇到会有点懵，命令明明装好了。原因是 `redis-cli` 是客户端，它要连的是服务端，而服务端根本还没起来。Redis 装完不会自动运行，这一点和很多人预期的不一样。

想让它开机就在后台待命，改一下默认配置文件：

```bash
vi /usr/local/etc/redis.conf
```

找到 `daemonize no` 这一行，改成 `daemonize yes`。

![修改 redis.conf 中的 daemonize 配置为 yes](https://s.poetries.top/gitee/20191001/3.png)

`daemonize yes` 的作用是让 `redis-server` 以守护进程方式在后台跑，不占着当前终端。改成 `no` 的话，你一关终端窗口服务就没了，这也是很多人第二天回来发现 Mock 服务全挂的原因。

改完启动服务端，再开客户端。

![Redis 服务端启动成功后的输出](https://s.poetries.top/gitee/20191001/4.png)

这时候再执行 `redis-cli`，就能正常进到交互命令行了。想确认服务是不是真的活着，进去敲一个 `ping`，回一个 `PONG` 就说明通了。

对 Easy Mock 来说，这里只需要保证服务端在跑，客户端只是我们验证用的。

### 2.2 安装 MongoDB

MongoDB 的安装教程可以参考 https://www.cnblogs.com/weixuqin/p/7258000.html 。

macOS 上当时的写法是：

```bash
brew install mongodb
```

装完要把服务启起来，MongoDB 和 Redis 一样，装好不等于在跑：

```bash
brew services start mongodb
```

这时候在浏览器里访问 `127.0.0.1:27017`，能看到一段提示文字就说明服务端正常了。27017 是 MongoDB 的默认端口。

这里补一句现在的情况。MongoDB 后来把开源协议换成了 SSPL，Homebrew 官方仓库随之移除了 `mongodb` 这个 formula，现在要先加 MongoDB 自己维护的 tap 再装：

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

原文里那两条命令在新版 Homebrew 上会直接报找不到 formula，照抄会卡在第一步。服务名也从 `mongodb` 变成了 `mongodb-community`，`brew services list` 里看到的名字要对上。

## 三、总体部署流程

前置依赖备齐，正式部署就很直了。先把源码拉下来：

```bash
git clone https://github.com/easy-mock/easy-mock.git
```

进目录装依赖并打包：

```bash
yarn install

# 打包部署需要的文件
yarn build
```

`yarn build` 做的是前端静态资源的构建，产物会被 Node 服务直接托管，跳过这一步启动之后打开页面会是空白的。

**1、启动 Redis 服务**

![Redis 服务已在后台运行](https://s.poetries.top/gitee/20191001/4.png)

**2、启动 MongoDB 服务**

```bash
brew services start mongodb
```

**3、执行 build 打包文件**

上一步已经跑过 `yarn build` 的话这里可以跳过，改了源码就重新跑一次。

**4、用 PM2 守护进程**

直接 `node app.js` 也能跑起来，但终端一关服务就没了，崩溃了也不会自己拉起来。PM2 解决的就是这两件事，它会守着进程，异常退出时自动重启，还能配开机自启。

![用 PM2 启动 app.js](https://s.poetries.top/gitee/20191001/5.png)

![PM2 进程列表显示服务运行中](https://s.poetries.top/gitee/20191001/6.png)

PM2 的列表里 `status` 是 `online` 才算正常。如果看到它在反复 `restart`，说明进程一直在崩，用 `pm2 logs` 把日志翻出来看，十有八九是 MongoDB 或者 Redis 没连上。

一切正常的话，打开 http://127.0.0.1:7300/ 就能看到界面了，7300 是 Easy Mock 的默认端口。

![浏览器打开 127.0.0.1:7300 看到 Easy Mock 界面](https://s.poetries.top/gitee/20191001/7.png)

到这一步整条链路就通了。建接口、填 Mock 规则、把生成的地址给前端，用法和官方站完全一样，区别只是数据存在自己机器上。

如果想让同组的人也能访问，把服务部署到内网一台常开的机器上，比部署在每个人自己的笔记本上省事得多，接口定义也能共享。

还有几件事值得顺手做掉。PM2 可以用 `pm2 startup` 加 `pm2 save` 配开机自启，机器重启之后服务自己回来，不用有人手动去点。MongoDB 和 Redis 用 `brew services` 启动的话本身就带自启，Linux 上则是 systemd 那一套。这三样只要有一样没配，机房断一次电就得全手动拉一遍。

日志也别忘了。PM2 默认把 stdout 和 stderr 都写进 `~/.pm2/logs/` 下，时间一长会涨得很大，装个 `pm2-logrotate` 模块做切割，或者定期清一下。这个我一开始没管，后来磁盘报警才想起来。

最后是数据备份。所有接口定义都在 MongoDB 里，定期 `mongodump` 一份存到别的地方，成本很低。自建服务最怕的就是「东西都在一台机器上，机器没了什么都没了」，一次导出能省掉整个团队重录接口的时间。

## 四、Easy Mock 线上项目迁移

已经在官方站上建了一堆项目，重新录一遍显然不现实。官方提供了迁移工具，仓库地址在 https://github.com/easy-mock/migrate2local ，它的作用是把线上项目的数据导出并灌进本地实例。

前提是官方站还能访问得到，你才导得出数据。所以如果你手上还有历史项目，趁早导一份留底。这块我没有亲自跑过完整迁移，只是当时确认过工具存在，具体参数以仓库 README 为准。

## 五、这个方案现在还适合用吗

顺着上面聊，这篇写的时候 Easy Mock 还是国内团队的主流选择，现在情况变了不少。

官方的公共服务长期处于不可用状态，仓库本身也很久没有实质性更新了。自建仍然可行，上面这套流程照样能跑通，但你要接受两件事：依赖的 Node、MongoDB、Redis 版本都比较老，在新系统上装环境会有额外的摩擦；遇到问题基本查不到近期的讨论，只能自己啃源码。

如果是新项目重新选型，现在常见的几条路是这样的：

| 方案 | 适合的场景 | 需要注意的 |
|------|-----------|-----------|
| Mock.js 本地拦截 | 纯前端自己造数据，改起来最快 | Mock 逻辑混在业务代码里，上线前要摘干净 |
| MSW | 拦在 Service Worker 层，浏览器和测试环境都能复用 | 需要理解 Service Worker 的注册和作用域 |
| Apifox / Apihug 这类平台 | 接口文档和 Mock 数据同源，团队协作友好 | 数据托管在第三方，内网项目要评估合规 |
| json-server | 起一个本地 REST 服务，几分钟就能跑 | 只适合简单增删改查，复杂规则不好写 |

我自己的感受是，Mock 这件事最大的成本从来不是搭服务，是接口定义和后端真实实现对不上。所以现在更倾向于选那种「接口文档即 Mock 数据源」的方案，文档一改 Mock 跟着变，比单独维护一套 Mock 规则靠谱。

不是说自建 Easy Mock 不行，如果你的团队已经在用、数据也都在里面，把它搬到内网继续跑完全没问题，上面这套流程就是干这个的。

## 总结

整个部署过程真正的难点不在 Easy Mock 本身，而在两个依赖服务上。Redis 装完不会自动跑，`redis-cli` 连不上八成是服务端没起来，把 `daemonize` 改成 `yes` 能省掉每次手动启动的麻烦。MongoDB 同理，装完要 `brew services start` 才算真的在跑，而且 Homebrew 上的 formula 名字已经换成了 `mongodb-community`。

部署顺序建议照着来：先单独启动一次确认代码没问题，再起依赖服务，最后 `yarn build` 加 PM2 守护。分段验证能把问题范围压得很小。

服务起来之后打开 http://127.0.0.1:7300/ 是最直接的成功判据，页面白屏就回去看 `yarn build` 有没有跑，进程反复重启就 `pm2 logs` 看连接错误。

最后一句实话：如果不是为了接管存量项目，现在开新坑我不会再选 Easy Mock，Mock.js 自建或者带 Mock 能力的接口平台都更省心。

## 参考

- [Easy Mock 源码仓库](https://github.com/easy-mock/easy-mock)
- [Easy Mock 线上项目迁移工具](https://github.com/easy-mock/migrate2local)
- [Redis 官方下载](https://redis.io/)
- [MongoDB 官方安装文档](https://www.mongodb.com/docs/manual/administration/install-community/)
- [PM2 官方文档](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [前端进阶之旅](https://interview.poetries.top)
