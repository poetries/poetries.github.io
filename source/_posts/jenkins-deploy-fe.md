---
title: Jenkins 自动部署前端项目 从装机到 git 提交自动构建
date: 2020-01-15 20:10:43
description: 手把手搭一套 Jenkins 前端自动部署流水线，涵盖 RPM 安装、端口与防火墙、插件与 Node 环境配置、构建任务创建，以及 git hooks 触发自动构建。
tags:
   - Jenkins
   - CI
   - 自动部署
categories: CI
---

我们组最早发前端包的流程是这样的：本地 `npm run build`，把 `dist` 压成 zip，用 FTP 传到测试机，解压覆盖，通知测试。一天发三四次，中间只要有一次忘了切分支或者忘了拉最新代码，测试那边就会拿到一个诡异的版本，然后开始互相确认「你发的是哪个 commit」。Jenkins 解决的就是这一段，把编译、打包、上传、重启全部固化成一个任务，谁点谁都是同一套流程，最后再挂上 git hooks，连点都不用点。这篇按真实搭建顺序走一遍，从装机一直到提交代码自动触发构建，中间每一屏配置在做什么、做完该看到什么，我都标出来。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 传统部署流程卡在哪，Jenkins 到底替谁省了事
- 用 RPM 方式安装 Jenkins，改端口、开防火墙、拿初始密码
- 装 Publish Over SSH 和 NodeJS 两个关键插件，并配好 git 和 node 的全局路径
- 一步步创建前端构建任务，从源码管理配到构建后的 SSH 发布
- 配置 git hooks，让每次 push 自动触发构建
- 常见的坑和一份自查清单

## 一、传统部署卡在哪

先看老流程。传统的网站部署，在运维的日常工作里大致是这么一条链路：需求分析、原型设计、开发代码、提交测试、内网部署、确认上线、备份数据、外网更新、最终测试，如果发现外网部署的代码有异常，还得及时回滚。

![传统网站部署流程，从需求分析到最终测试的完整链路](https://s.poetries.top/gitee/2020/01/1.png)

这张图上每一个方框，只要涉及「人手动做」，就是一个出错点。备份漏了、外网更新只更了一半、回滚的时候找不到上一版包在哪，这些事情不是能力问题，是流程里没有兜底。

目前主流的做法是把中间这几段交给 Jenkins。它是一个可扩展的持续集成引擎，开源项目，目标是提供一个开放易用的软件平台，让软件的持续集成变成可能，安装配置都不复杂。

对不同角色来说，省下来的事情是不一样的：

- **开发人员**：写好代码，不需要自己做源码编译、打包，直接把代码分支推到 SVN 或者 Git 仓库就行
- **运维人员**：不用再人工上传代码、手动备份、手动更新，人工干预少了，出错率自然下来
- **测试人员**：可以通过 Jenkins 自己触发一次构建，做简单的代码及网站测试，不用每次都去找开发要包

![引入 Jenkins 之后的自动化部署流程](https://s.poetries.top/gitee/2020/01/2.png)

对比一下两张图，差别不在步骤变少了，而在于哪些步骤由机器执行。

### 1.1 持续集成到底带来什么

持续集成（Continuous Integration）是一种软件开发实践，它给「提高开发效率并保障开发质量」提供了理论基础。往实处说，好处有三条。

第一，持续集成里的每个环节都是自动完成的，不需要太多人工干预，重复过程少了，时间、费用和工作量都跟着降。

第二，它保障了每个时间点上团队成员提交的代码是能成功集成的。反过来讲，任何时间点都能第一时间发现集成问题，让「任意时刻都能发布一个可部署的版本」变成现实。

第三点稍微虚一些但很关键：持续集成有利于看清软件本身的发展趋势。在需求不明确或者频繁变更的项目里尤其重要，集成质量的数据能帮团队做决策，也能建立团队对产品的信心。

### 1.2 需要准备的三样东西

搭一套持续集成环境，最少要凑齐三个组件：

- 一个自动构建过程，包括自动编译、分发、部署和测试
- 一个代码存储库，需要版本控制软件来保障代码可维护，同时它也是构建过程的素材库，比如 SVN、Git
- 一台 Jenkins 持续集成服务器，配置简单使用方便的那种就够，前端项目对机器要求不高

回到我们要解决的问题，下面就按这三样东西的顺序往下配。

## 二、安装 Jenkins 与初始化

### 2.1 装包

去 `http://mirrors.jenkins-ci.org/` 挑一个合适的 Jenkins 版本。这里我们用 RPM 方式部署，对应的包在 `https://pkg.jenkins.io/redhat-stable/` 下载：

```
rpm -ih jenkins-2.7.4-1.1.noarch.rpm
```

Jenkins 本身是 Java 写的，所以机器上必须有 JDK 才能跑起来。这里要澄清一点：网上很多老教程会写「需要 JDK + Tomcat」，那说的是把 `jenkins.war` 丢进 servlet 容器里跑的方式。用 RPM 装的话，包里已经带了内嵌的 servlet 容器，装个 JDK 就够了，不用另外装 Tomcat。

装完之后这几条命令基本够用：

```
service jenkins start/stop/restart

chkconfig jenkins on
```

`chkconfig jenkins on` 是设开机自启。这条别漏，服务器重启一次 Jenkins 没起来，你可能过两天才发现构建任务全停了。

RPM 装完之后，文件会散落在这几个位置，出问题的时候要靠它们定位：

```
/usr/lib/jenkins/jenkins.war     #WAR包 

/etc/sysconfig/jenkins       　　 #配置文件

/var/lib/jenkins/        　　　　   #默认的JENKINS_HOME目录

/var/log/jenkins/jenkins.log      #Jenkins日志文件
```

`JENKINS_HOME` 这个目录要记牢，所有任务配置、插件、构建历史都在里面。迁移 Jenkins 的时候整个目录打包搬走就行，这也是最省事的备份方式。

### 2.2 启动并改端口

先启动：

```
service jenkins start
```

Jenkins 默认占 8080，前端服务器上 8080 十有八九已经被别的东西占了，所以我一般会先改掉：

```
vim /etc/sysconfig/jenkins

JENKINS_PORT="8888"
```

改完还要放行防火墙，否则本机 `curl` 得通，外面死活打不开：

```
[root@localhost modules]# vim /etc/sysconfig/iptables
# Firewall configuration written by system-config-firewall
# Manual customization of this file is not recommended.
*filter
:INPUT ACCEPT [0:0]
:FORWARD ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]
-A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
-A INPUT -p icmp -j ACCEPT
-A INPUT -i lo -j ACCEPT
-A INPUT -m state --state NEW -m tcp -p tcp --dport 22 -j ACCEPT
-A INPUT -m state --state NEW -m tcp -p tcp --dport 80 -j ACCEPT
-A INPUT -m state --state NEW -m tcp -p tcp --dport 8080 -j ACCEPT

-A INPUT -m state --state NEW -m tcp -p tcp --dport 8888 -j ACCEPT # here

-A INPUT -j REJECT --reject-with icmp-host-prohibited
-A FORWARD -j REJECT --reject-with icmp-host-prohibited
COMMIT
```

上面这份是 iptables 的写法。如果你的机器是 CentOS 7 且用的是默认的 firewalld，那改这个文件不会生效，得用 `firewall-cmd --zone=public --add-port=8888/tcp --permanent` 再 `firewall-cmd --reload`。另外机器在云上的话，云厂商的安全组也是一道，三道里漏配任何一道结果都一样，页面打不开。

这个我踩过，安全组忘了开，对着 iptables 排查了一下午。

改完端口重启服务：

```
[root@localhost modules]# service jenkins start
```

### 2.3 解锁并拿初始密码

浏览器打开 `127.0.0.1:8888`。这一步是在确认 Jenkins 进程真的起来了，并且端口通了。

![Jenkins 首次启动的解锁页面，提示输入管理员初始密码](https://s.poetries.top/gitee/2020/01/3.png)

看到这个页面就说明启动成功了。因为是第一次安装，需要输入管理员初始密码，密码文件的路径就写在页面红框标注的位置。

回终端把它 `cat` 出来，粘贴到文本框里：

```
[root@localhost secrets]# cat /var/lib/jenkins/secrets/initialAdminPassword

97c675381d524414ba11e61c4f4b7ef0
```

那串 32 位十六进制就是初始密码，每台机器都不一样，别照抄这里的。要是提示文件不存在，说明 Jenkins 其实没起来，你看到的可能是缓存页，回去看 `/var/log/jenkins/jenkins.log`。

### 2.4 安装推荐插件

解锁之后 Jenkins 会问你要装哪些插件。这一步在做的是把常用插件一次性拉下来，选左边的推荐安装就行，不确定要什么的时候不要手动挑，装少了后面配置项直接不出现，很难反应过来是插件没装。

![Jenkins 初始化界面选择插件安装方式](https://s.poetries.top/gitee/2020/01/4.png)

点下去之后进入下载进度页，这一屏纯等待。

![插件批量下载安装的进度页面](https://s.poetries.top/gitee/2020/01/5.png)

做完这一步你应该能进到创建管理员账号的引导，然后就是 Jenkins 的主界面了。如果有个别插件飘红失败，多半是网络问题，先跳过，后面在插件管理里单独重试即可，不影响继续往下走。

## 三、配置基础环境

前端项目跟 Java 项目不一样，要额外准备两样东西：一个能把产物发到目标服务器的通道，一个能跑 `npm install` 的 Node 环境。这一节就干这两件事。

### 3.1 装两个关键插件

进 `系统管理 → 插件管理`，切到可选插件页签，用右上角搜索框找插件。

![Jenkins 插件管理页面，可以搜索并安装可选插件](https://s.poetries.top/gitee/2020/01/6.png)

第一个要装的是 **Publish Over SSH**，它负责构建完成之后把产物通过 SSH 传到目标服务器，并在远端执行命令。前端部署的最后一公里全靠它。

![搜索并安装 Publish Over SSH 插件](https://s.poetries.top/gitee/2020/01/7.png)

第二个是 **NodeJS**，装了它之后 Jenkins 才能在构建环境里注入 Node 和 npm，`npm run build` 才有得跑。

![搜索并安装 NodeJS 插件](https://s.poetries.top/gitee/2020/01/8.png)

两个插件装完记得勾「安装完成后重启」，不重启的话新的配置项不一定出现在页面上。做完这一步的验收标准很简单：去 `系统管理 → 全局工具配置` 里，能看到 NodeJS 这一栏；去 `系统管理 → 系统配置` 里，能看到 Publish over SSH 这一栏。

### 3.2 配 git 路径

Jenkins 拉代码要调用系统里的 `git`，但它不一定能从默认 PATH 里找到，所以要把绝对路径填进去。先在服务器上查一下：

```
whereis git
```

把查出来的可执行文件路径（通常是 `/usr/bin/git`）填到全局工具配置的 Git 那一栏。

![在全局工具配置里填写 git 可执行文件的绝对路径](https://s.poetries.top/gitee/2020/01/9.png)

填完保存。这一步没做对的话，后面建任务时源码管理那里会直接报找不到 git 命令，报错信息还挺明显，看到了回来补就行。

### 3.3 配 node 版本

同一页往下翻到 NodeJS 这一栏，新增一个 Node 安装项，给它起个名字（这个名字后面在任务里要选），选自动安装并挑一个版本，或者填服务器上已装 Node 的路径。

![配置 NodeJS 环境，指定名称和版本](https://s.poetries.top/gitee/2020/01/10.png)

我建议这里的版本跟本地开发用的大版本对齐。Node 大版本跨了之后，node-sass 这类带二进制依赖的包很容易在 CI 上编译失败，本地却一切正常，排查起来特别费劲。

### 3.4 配 git 账户和 SSH 凭据

接下来要让 Jenkins 有权限拉代码、有权限登录目标服务器，这两件事都是配凭据。

第一屏是全局的 Git 用户信息，也就是 Jenkins 以什么身份去操作 git。

![配置全局 Git 用户名和邮箱](https://s.poetries.top/gitee/2020/01/11.png)

第二屏是添加凭据。拉私有仓库有两种方式，用户名密码或者 SSH 私钥，用私钥更稳，密码改了就得回来改配置。

![在凭据管理里新增拉取代码用的账号或 SSH 私钥](https://s.poetries.top/gitee/2020/01/12.png)

第三屏是 Publish over SSH 的服务器信息，填目标服务器的地址、登录用户、远程目录，以及认证方式。

![配置 Publish over SSH 的目标服务器地址与认证信息](https://s.poetries.top/gitee/2020/01/13.png)

这一屏底部有个 `Test Configuration` 按钮，一定要点。点完显示 Success 才算配对了，显示 Auth fail 基本就是私钥内容贴少了头尾行，或者目标机器的 `authorized_keys` 没追加上。别跳过这个测试直接去建任务，不然你会在构建的最后一步才发现连不上，而前面的编译打包已经白跑了几分钟。

## 四、创建前端构建任务

环境备齐了，开始建任务。前端项目用自由风格（Freestyle）的项目就够，不需要上 Pipeline。

第一屏，新建任务，填任务名并选择项目类型。任务名后面会出现在构建 URL 里，所以用英文，别用中文和空格。

![新建任务，输入任务名称并选择自由风格的软件项目](https://s.poetries.top/gitee/2020/01/14.png)

第二屏，源码管理。选 Git，填仓库地址，选上一节配好的凭据，指定要构建的分支。

![源码管理配置，填写 Git 仓库地址、凭据和分支](https://s.poetries.top/gitee/2020/01/15.png)

填完这一屏就能验证配置对不对：如果地址或凭据有问题，输入框下面会直接飘红报错，不用等到构建。这是整个流程里反馈最快的一处，用好它。

第三屏，构建触发器。先不急着配自动触发，手动点着跑通了再说，自动触发放到第五节单独讲。

![构建触发器配置页面](https://s.poetries.top/gitee/2020/01/16.png)

第四屏，构建环境。把前面配好的 NodeJS 勾上并选中对应的版本名称，这样构建脚本里才有 `node` 和 `npm`。

![构建环境里勾选 NodeJS 并选择版本](https://s.poetries.top/gitee/2020/01/17.png)

第五屏，构建步骤。增加一个「执行 shell」，把本地那套命令原样搬进去，通常就是装依赖加打包这两句。

![增加执行 shell 的构建步骤，填入 npm install 和 npm run build](https://s.poetries.top/gitee/2020/01/18.png)

这里提醒一句，shell 脚本默认是遇错继续往下跑的，`npm install` 挂了 `npm run build` 还会执行，最后可能拿一个空目录去发布。在脚本第一行加 `set -e`，一步失败立刻中断，构建标红，这比拿到一个假的绿灯强多了。

第六屏，构建后操作。选 `Send build artifacts over SSH`，指定要传的产物路径和远端目录，需要的话再填一段远程执行的命令，比如解压、软链切换、重启 nginx。

![构建后操作选择 Send build artifacts over SSH 并配置产物路径](https://s.poetries.top/gitee/2020/01/19.png)

产物路径填的是相对于工作空间的相对路径，比如 `dist/**`，写成绝对路径反而不行，这一点跟直觉相反，很多人第一次都会卡在这。

第七屏，保存后回到任务页，点「立即构建」。

![保存任务后在任务页面点击立即构建](https://s.poetries.top/gitee/2020/01/20.png)

做完这一步该看到什么？左下角构建历史里出现一条记录，点进去看 Console Output，能完整看到拉代码、`npm install`、`npm run build`、SSH 传输这四段日志，最后一行是 `Finished: SUCCESS`。看到这行，手动部署这条路就算通了。

## 五、让 git 提交自动触发构建

手动点还是麻烦，最后一步是让代码一推上去就自动构建。原理是 Jenkins 暴露一个带 token 的构建 URL，git 仓库那边配一个 webhook 去请求它。

先回到任务配置的构建触发器那一屏，勾上「触发远程构建」，并设置一个身份验证令牌，例子里用的是 `cxk`。

![构建触发器里勾选触发远程构建并设置 token](https://s.poetries.top/gitee/2020/01/17.png)

勾完之后 Jenkins 会在下方直接把可用的 URL 拼给你看，形如 `JENKINS_URL/job/任务名/build?token=令牌`。

然后按下面两屏去 git 仓库里配 webhook，这里以 bitbucket 的 git 仓库为例。第一屏是找到仓库设置里的 webhook 或者 hooks 入口。

![在 bitbucket 仓库设置里找到 webhook 配置入口](https://s.poetries.top/gitee/2020/01/21.png)

第二屏是把上面那条构建 URL 填进去，并选择在 push 事件时触发。

![填写 Jenkins 的远程构建 URL 并选择 push 事件触发](https://s.poetries.top/gitee/2020/01/22.png)

这样一来，提交 git 代码就会触发 `git hooks` 去请求 `http://192.168.1.43:8991/job/test/build?token=cxk`，从而启动 Jenkins 任务，自动部署就串起来了。

这条 URL 里有两个东西必须换成你自己的。IP 和端口要填你 Jenkins 实际监听的地址，注意前面改端口那节用的是 8888，而这条示例 URL 里是 8991，它们来自不同环境，别混着抄。`token` 换成你自己设的那个，这个值等于一把钥匙，谁拿到谁就能触发你的构建，别用 `cxk` 这种一猜就中的。

还有个前提容易忘：git 服务器要能访问到 Jenkins 的地址。内网 IP 的 Jenkins 配到外网的 GitHub 上是打不通的，webhook 会一直显示投递失败。这种情况要么把 Jenkins 暴露到公网，要么反过来用 Jenkins 定时轮询仓库。

## 六、自查清单

这套流程我踩下来，反复出问题的就那么几处，列成清单方便对照：

- [ ] `chkconfig jenkins on` 设了开机自启
- [ ] 改完 `JENKINS_PORT` 重启了服务，并且 iptables/firewalld/云安全组三处都放行了
- [ ] 全局工具配置里填了 git 的绝对路径，NodeJS 版本跟本地开发大版本一致
- [ ] Publish over SSH 的 `Test Configuration` 点过并且返回 Success
- [ ] 构建 shell 第一行加了 `set -e`，避免装依赖失败还继续打包
- [ ] 构建后操作里的产物路径用的是相对工作空间的相对路径
- [ ] 远程构建 token 不是弱值，且 git 服务器网络上能访问到 Jenkins
- [ ] `JENKINS_HOME`（默认 `/var/lib/jenkins/`）纳入了定期备份

说实话，Jenkins 的配置项散得有点开，同一件事的开关可能分布在系统配置、全局工具配置、任务配置三个地方，第一次配的时候来回找页面的时间比真正配置的时间还长。配通之后倒是很稳，我那台跑了大半年没怎么管过。

## 总结

整套流程拆开就是四段：装 Jenkins 并把端口和防火墙理顺，装 Publish Over SSH 和 NodeJS 两个插件并配好 git 与 node 的全局路径，建一个自由风格任务把「拉代码、装依赖、打包、SSH 发布」串起来，最后用带 token 的远程构建 URL 加 git webhook 完成自动触发。

最容易卡住的三处：端口通不通要查 iptables/firewalld/安全组三道；SSH 凭据一定要用 `Test Configuration` 提前验证，别等构建最后一步才发现连不上；构建后操作的产物路径是相对路径不是绝对路径。

Jenkins 的优势是完全自己掌控，机器在你手上，构建时长没有配额限制，缺点是这台机器你得自己养着。如果项目托管在 GitHub 上，其实可以直接用云端的 CI，省掉整个第二节，可以对比着看我写的 [Github Action 部署应用实战](https://feinterview.poetries.top/blog/github-action) 和 [Travis CI 实践](https://feinterview.poetries.top/blog/travis-ci)，选型的时候心里有个数。产物发到服务器之后的 nginx 配置，可以参考 [Nginx 配置总结](https://feinterview.poetries.top/blog/nginx-config)。

## 参考

- [Jenkins 官方文档](https://www.jenkins.io/doc/)
- [Jenkins RPM 稳定版下载](https://pkg.jenkins.io/redhat-stable/)
- [Publish Over SSH 插件](https://plugins.jenkins.io/publish-over-ssh/)
- [NodeJS 插件](https://plugins.jenkins.io/nodejs/)
- [前端进阶之旅](https://interview.poetries.top)
