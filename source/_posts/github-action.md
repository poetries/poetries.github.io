---
title: Github Action 部署应用实战 工作流配置与四种上线方式
date: 2020-08-09 22:21:08
description: 从 workflow 语法拆到实战配置，用 Github Action 把前端项目自动发布到阿里云 OSS、GitHub Pages、云服务器和腾讯云静态托管，附一份上线前 checklist。
tags:
   - 部署
   - Github action
   - CI/CD
categories: Front-End
---

每次改完文档站，我都得本地跑一遍 `npm run build`，再把 `dist` 目录手动传到服务器，传完还要进控制台刷一次缓存。一次两次还好，一天来五六回就烦了，而且总有那么一回会忘了先构建，直接把上一版的文件传了上去。GitHub Actions 能把这段重复劳动整个接走，你只管 push，拉代码、装依赖、打包、上传、刷缓存都在云端跑完。这篇把我这阵子用 Actions 做部署的几种配置整理成一篇，从 workflow 文件的字段读法开始，一直写到四个不同目标环境的可复制配置，最后留一份上线前的自查清单。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- GitHub Actions 的执行模型，workflow、job、step、action 四个概念分别对应什么
- workflow 文件的核心字段，`name`、`on`、`needs`、`runs-on`、`steps` 怎么读怎么写
- 发布到阿里云 OSS，顺带把静态资源的长缓存也设上
- 跨仓库发布到 GitHub Pages，公钥私钥分别放在哪个仓库
- 用 rsync 推到自己的云服务器，SSH 密钥对怎么配才不会连不上
- 发布到腾讯云静态网站托管
- 上线前的 checklist，以及这些老版本号今天该怎么处理

## 一、先把 GitHub Actions 的执行模型讲清楚

持续集成本身不是什么新东西，它就是一串固定动作：抓取代码、装依赖、跑测试、登录远程服务器、把产物发到第三方服务。GitHub 把这一串里的每一个动作单拎出来，称为 `actions`。

真正让它跟传统 CI 拉开差距的是复用方式。你需要某个动作，不用自己写脚本，直接引用别人写好的 action 就行，整个持续集成过程就变成了一堆 actions 的组合。

这个设计是真的舒服。

GitHub 为此做了一个[官方市场](https://github.com/marketplace?type=actions)，能搜到别人提交的 actions。另外还有一个 [awesome actions](https://github.com/sdras/awesome-actions) 仓库，也能捞到不少现成的。


既然每个 action 就是一个独立脚本，那它当然可以做成一个代码仓库。引用的时候用 `userName/repoName` 语法，比如 `actions/setup-node` 指的就是 `github.com/actions/setup-node` 这个仓库，它的作用是安装 Node.js。GitHub 官方维护的 actions 都放在 `github.com/actions` 下面。

是代码仓库就有版本概念，所以你可以精确引用某一个版本，用的是 Git 的指针语义：

```bash
actions/setup-node@74bc508 # 指向一个 commit
actions/setup-node@v1.0    # 指向一个标签
actions/setup-node@master  # 指向一个分支
```

这里有个坑要注意，指向分支（比如 `@master`）意味着对方一改你就跟着变，出问题的时候你连是哪次变更引起的都查不到。生产用的 workflow 建议锁大版本标签，安全要求高的直接锁 commit sha。

### 1.1 四个术语的层级关系

GitHub Actions 有一套自己的说法，四个词是层层嵌套的：

| 术语 | 含义 | 关系 |
|------|------|------|
| workflow（工作流程） | 持续集成一次运行的完整过程 | 最外层，一个 `.yml` 文件就是一个 workflow |
| job（任务） | 一次运行里可以完成的多个任务之一 | 一个 workflow 由一个或多个 job 构成 |
| step（步骤） | 任务内部的一步 | 一个 job 由多个 step 串行构成 |
| action（动作） | 每个 step 执行的具体命令 | 一个 step 可以依次执行一个或多个 action |

要记的关键点只有一条：**同一个 workflow 里的多个 job 默认是并行跑的，而同一个 job 里的多个 step 是严格串行的**。所以「装依赖、打包、上传」这种有先后依赖的动作必须写在同一个 job 里，写成三个 job 会同时启动，第二个 job 根本看不到第一个 job 装好的 `node_modules`。

### 1.2 整条链路长什么样

把上面这些串起来，一次自动部署的完整链路是这样：

```
本地 git push
      │
      ▼
GitHub 仓库（master 分支）
      │  触发 push 事件
      ▼
.github/workflows/*.yml   ← GitHub 自动发现目录下的 yml 并执行
      │
      ▼
┌──────────────── workflow ────────────────┐
│  runs-on: ubuntu-latest（一台干净的虚拟机）│
│                                          │
│  job: build                              │
│   ├─ step1  actions/checkout   拉代码     │
│   ├─ step2  npm install        装依赖     │
│   ├─ step3  npm run build      打包       │
│   └─ step4  第三方 action       上传/部署  │
└──────────────────────────────────────────┘
      │
      ▼
目标环境：阿里云 OSS / GitHub Pages / 自有服务器 / 腾讯云静态托管
```

有一点特别值得先说清楚，每次运行拿到的都是一台全新的虚拟机，跑完就销毁。所以本地能跑不代表 CI 能跑，凡是你在本机全局装过的东西（`ossutil`、某个 CLI、某个字体），CI 上都得在 step 里重新装一遍。我第一次配的时候就是栽在这个上，本地好好的，CI 上一片红。

## 二、workflow 文件的字段拆解

GitHub Actions 的配置文件叫 workflow 文件，固定放在仓库的 `.github/workflows` 目录下。

文件采用 YAML 格式，文件名随便取，后缀统一为 `.yml`，比如 `foo.yml`。一个仓库可以有多个 workflow 文件，GitHub 只要发现 `.github/workflows` 目录里有 `.yml` 就会自动运行。字段非常多，详见[官方文档](https://help.github.com/en/articles/workflow-syntax-for-github-actions)，下面挑常用的几个说。

### 2.1 name

`name` 字段是 workflow 的名称，显示在仓库 Actions 页签的列表里。省略的话默认取当前 workflow 的文件名。

```yaml
name: GitHub Actions Demo
```

小建议，如果你一个仓库配了三四个 workflow，这个 name 一定要写，而且写得能一眼区分。全靠文件名认的话，Actions 列表里全是 `ci.yml`，排查起来很难受。

### 2.2 on

`on` 字段指定触发 workflow 的条件，通常是某些事件。

```yaml
on: push
```

上面这行的意思是 `push` 事件触发 workflow。它也可以写成事件数组：

```yaml
on: [push, pull_request]
```

这样 `push` 或 `pull_request` 任意一个都能触发。完整的事件列表见[官方文档](https://help.github.com/en/articles/events-that-trigger-workflows)，除了代码库事件，GitHub Actions 还支持外部事件触发和定时运行。

### 2.3 限定分支和标签

只写 `on: push` 的问题是任何分支的推送都会触发一次构建，你在 feature 分支上推十次，就白跑十次部署。指定事件的同时限定分支就能解决：

```yaml
on:
  push:
    branches:
      - master
```

这样只有 `master` 分支发生 `push` 事件时才会触发 workflow。部署类的 workflow 我基本都会加这一段。

### 2.4 jobs 与 job 之间的依赖

workflow 文件的主体是 `jobs` 字段，表示要执行的一项或多项任务。`jobs` 里面需要写出每一项任务的 `job_id`，具体名称自定义，`job_id` 里面的 `name` 字段是这项任务的说明文字。

```yaml
jobs:
  my_first_job:
    name: My first job
  my_second_job:
    name: My second job
```

上面的 `jobs` 字段包含两项任务，`job_id` 分别是 `my_first_job` 和 `my_second_job`。

前面提过 job 默认并行，那要串起来怎么办？用 `needs` 声明依赖关系：

```yaml
jobs:
  job1:
  job2:
    needs: job1
  job3:
    needs: [job1, job2]
```

上面这段里 `job1` 必须先于 `job2` 完成，而 `job3` 要等 `job1` 和 `job2` 都完成才能运行，所以整个 workflow 的运行顺序是 `job1`、`job2`、`job3`。

「构建镜像」和「登录服务器部署」这种典型的两段式流程，就是靠 `needs` 把部署 job 挂在构建 job 后面的。少了这一句，部署 job 会在镜像还没推上去的时候就开始拉，然后失败。

### 2.5 runs-on

`runs-on` 指定运行所需要的虚拟机环境，是必填字段。当时可用的虚拟机是这些：

```
ubuntu-latest，ubuntu-18.04或ubuntu-16.04
windows-latest，windows-2019或windows-2016
macOS-latest或macOS-10.14
```

这几个带具体版本号的镜像后来陆续退役过，我不在这里写死替换成哪一版，因为写死了过阵子又会过期。实际配的时候直接用 `ubuntu-latest` / `windows-latest` / `macos-latest` 这类滚动标签最省事，GitHub 会自动指向当前维护中的镜像。只有当你的构建对系统库版本敏感（比如依赖某个特定的 glibc 或者 Xcode），才需要去官方 runner 镜像文档里查当前支持的固定版本再钉住。

### 2.6 steps

`steps` 字段指定每个 job 的运行步骤，可以包含一个或多个步骤。每个步骤可以指定这三个字段：

- `jobs.<job_id>.steps.name`：步骤名称
- `jobs.<job_id>.steps.run`：该步骤运行的命令或者 action
- `jobs.<job_id>.steps.env`：该步骤所需的环境变量

下面是一个完整的 workflow 文件范例：

```yaml
name: Greeting from Mona
on: push

jobs:
  my-job:
    name: My Job
    runs-on: ubuntu-latest
    steps:
    - name: Print a greeting
      env:
        MY_VAR: Hi there! My name is
        FIRST_NAME: Mona
        MIDDLE_NAME: The
        LAST_NAME: Octocat
      run: |
        echo $MY_VAR $FIRST_NAME $MIDDLE_NAME $LAST_NAME.
```

`steps` 字段只包括一个步骤，这个步骤先注入四个环境变量，然后执行一条 Bash 命令。`run` 后面跟 `|` 表示这是一段多行脚本，多行命令都写在这个块里。

### 2.7 关于文中的版本号

下面几节的配置里会出现 `actions/checkout@v2`、`peaceiris/actions-gh-pages@v2.5.1` 这类版本号，那是当时能用的写法，我原样保留。这些常用 action 后来都发过更新的大版本，主体语法基本兼容，但底层 Node 运行时和一部分默认行为（比如 checkout 拉取的深度、缓存策略）有过调整。

所以你照抄之前，先去对应 action 仓库的 releases 页面看一眼当前推荐的大版本，把 `@v2` 换成它标注的那个。我这里不写具体数字，写了也是很快就旧。

## 三、发布到阿里云 OSS

第一种场景最简单，产物是一堆静态文件，直接扔进对象存储。

关键点在于 `ossutil` 这个命令行工具 CI 上没有，得先用 `manyuanrong/setup-ossutil` 这个 action 装上并完成鉴权，后面两步才能直接调 `ossutil` 命令：

```yaml
name: deploy to aliyun oss

on: [push]

env:
  NODE_VERSION: '10.x'                # set this to the node version to use

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2 # 拉取代码
    - name: install
      run: npm install
    - name: Build
      run:  npm run build
    - uses: manyuanrong/setup-ossutil@master
      with:
        # endpoint 可以去oss控制台上查看
        endpoint: "oss-cn-guangzhou.aliyuncs.com"
        # 使用我们之前配置在secrets里面的accesskeys来配置ossutil
        access-key-id: ${{ secrets.ALIYUN_ACCESS_KEY_ID }}
        access-key-secret: ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}
    - name: 复制文件到阿里云OSS
      run: ossutil cp -rf .vuepress/dist oss://fe-web/
    - name: 设置永久缓存
      run: ossutil set-meta oss://fe-web/assets cache-control:"max-age=31536000" --update -rf
```

最后那步单独说一下。`ossutil set-meta` 把 `assets` 目录下的资源缓存时间设成一年，是因为构建工具给这些文件名都打了内容哈希，文件内容一变文件名就变，浏览器不会拿到过期的旧文件。而入口的 HTML 千万不要设长缓存，否则用户浏览器一直命中旧 HTML，里面引用的还是老哈希文件名，你发的新版本等于没发。

这条规则可以简化成一句话：带哈希的资源设长缓存，不带哈希的入口文件不缓存或短缓存。

`endpoint` 要填你 bucket 所在地域的那个，控制台的 bucket 概览页里能直接复制。填错地域会报连不上，但错误信息不怎么明显，我当时对着日志看了半天才发现是杭州和广州写反了。

两个 access key 走 `secrets` 注入，不要硬编码在 yml 里。仓库是公开的话，key 一旦提交上去就等于公开了，改回来也没用，得直接去阿里云控制台吊销重建。

## 四、跨仓库发布到 GitHub Pages

这一种稍微绕一点，源码在 A 仓库，构建产物要发到 B 仓库的 `gh-pages` 分支。用的是 `peaceiris/actions-gh-pages`：

```yaml
on:
  push:
    branches: [ master ]

env:
  AZURE_WEBAPP_NAME: fe-interview    # set this to your application's name
  AZURE_WEBAPP_PACKAGE_PATH: '.'      # set this to the path to your web app project, defaults to the repository root
  NODE_VERSION: '10.x'                # set this to the node version to use

jobs:
  deploy-github-pages:
    name: 发布到github Pages
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2 # 拉取代码 默认master分支
    - name: install
      run: npm install
    - name: Build
      run:  npm run build
    - name: deploy github pages
      uses: peaceiris/actions-gh-pages@v2.5.1
      env:
        ACTIONS_DEPLOY_KEY: ${{ secrets.ACTIONS_DEPLOY_KEY }} # 公钥 存放在FE-Interview-Questions下，即要发布到其他仓库下
        EXTERNAL_REPOSITORY: poetries/FE-Interview-Questions # 发布到其他仓库
        PUBLISH_BRANCH: gh-pages # 发布到github pages分支
        PUBLISH_DIR: .vuepress/dist # 打包后的目录文件
```

先提一句，`env` 里那两个 `AZURE_` 开头的变量是从官方模板里抄下来的残留，跟这套部署一点关系都没有，你抄的时候直接删掉，留着只会让下一个看配置的人困惑。

真正容易搞混的是密钥对该怎么放。跨仓库发布要生成一对 SSH 密钥，然后：

- **公钥**放在目标仓库（也就是要被写入的 `FE-Interview-Questions`）的 `Settings → Deploy keys`，并勾上写权限
- **私钥**放在源仓库的 `Settings → Secrets`，命名为 `ACTIONS_DEPLOY_KEY`，workflow 里通过 secrets 引用

方向搞反了会怎样？构建全绿，最后一步推送时报权限不足。我一开始也是这么想的，觉得反正是一对，放哪边都行，结果调了一轮才反应过来公钥是给「被写的一方」用来认人的。

如果只是发到同一个仓库的 `gh-pages` 分支，就不用折腾密钥了，直接用仓库自带的 `GITHUB_TOKEN` 就行，权限范围也更小。

## 五、用 rsync 发布到自己的云服务器

产物要放到自己的服务器上，我用的是 rsync。它只传有差异的文件，比每次全量 scp 快很多，尤其是文档站这种几千个小文件的场景。

### 5.1 远程主机先装 rsync

`rsync deployments` 这个 action 依赖远程主机上有 `rsync`。CentOS 下先确认一下：

```bash
# rpm -qa|grep rsync   #检查是否安装过rsync，whereis rsync也可以
# yum install rsync       #如果未安装，使用yum安装rsync
```

这一步很容易漏。GitHub 这边的 runner 有 rsync 不代表你的服务器有，两边都得有才能同步。

### 5.2 本地生成密钥对

生成新的 Key，引号内的内容替换为你自己的邮箱：

```bash
ssh-keygen -t rsa -C "your_email@youremail.com"
```

两个提示要注意。第一个问保存路径，直接回车，不要改默认路径。第二个问密码短语（passphrase），设了以后每次远程操作都会要求输入，嫌麻烦可以直接回车不设。

这里有个跟 CI 有关的判断：**给 CI 用的这把私钥不要设密码短语**。自动化流程里没人替你敲这个密码，设了之后 action 会卡在等待输入然后超时。要安全就换个思路，给 CI 单独生成一把只有部署权限的密钥，别拿你平时登录用的那把。

### 5.3 把公钥放进远程主机

远程主机把用户的公钥保存在登录后用户主目录的 `$HOME/.ssh/authorized_keys` 文件里。公钥就是一段字符串，追加到这个文件末尾就行：

```bash
# 打开本机 .ssh 文件夹，用文本编辑器打开 id_rsa.pub 文件，复制内容到剪贴板。进入远程主机
vi /root/.ssh/authorized_keys
```

注意是**追加**到末尾，不是覆盖。这个文件里可能已经有你或者同事的其他公钥，直接覆盖掉的话别人就登不上了。另外这段字符串必须是完整一行，中间被编辑器折行会导致认证失败，这个我踩过，粘贴完记得检查一下有没有断行。

CentOS 7 改完重启 sshd：

```bash
systemctl restart sshd
```

### 5.4 在仓库里配好私钥

接下来是 GitHub 这一侧：

- 项目目录下新建 `.github/workflows/ci.yml`，只要求后缀是 `yml`，名称没有限制
- 打开仓库的 `Settings → Secrets`（新版界面在 `Settings → Secrets and variables → Actions`），新建一条 secret
- 名字取 `MY_V2_SERVER_PRIVATE_KEY`，值是本机私钥文件 `id_rsa` 的全部内容

复制私钥的时候要连 `-----BEGIN OPENSSH PRIVATE KEY-----` 和 `-----END ...-----` 这两行头尾一起复制，末尾的换行也要保留，少一行就解析不出来。

在 workflow 里的引用格式写成 `secrets.` 加上你起的名字，外面套一层 `${ }` 的表达式语法，具体写法看下面这段配置。

### 5.5 完整配置

```yaml
on:
  push:
    branches: [ master ]

env:
  NODE_VERSION: '10.x'                # set this to the node version to use
  # 阿里云轻应用配置
  MY_V2_SERVER_PRIVATE_KEY: ${{ secrets.MY_V2_SERVER_PRIVATE_KEY }} # 服务器私钥
  MY_V2_USER: ${{ secrets.MY_V2_USER }} # 服务器用户 如root
  MY_V2_IP: ${{ secrets.MY_V2_IP }} # 服务器ip

jobs:
  deploy-aliyun:
    name: 发布到阿里云服务器
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: install
      run: npm install
    - name: Build
      run: npm run build:fe
    - name: rsync deployments
      uses: meetbitu/rsync-deployments@cc9f383f3399baa56527dcfd97cfee6a2da58f18
      env:
        DEPLOY_KEY: ${{ secrets.MY_V2_SERVER_PRIVATE_KEY }}
      with:
        USER_AND_HOST: ${{ env.MY_V2_USER }}@${{ env.MY_V2_IP }}
        DEST: /home/data/dist
        SRC: .vuepress/dist/*
        RSYNC_OPTIONS: -avz --delete
```

原文这段配置漏了外层的 `jobs:`，并且 `run` 的缩进和 `- name` 平齐了，那样 YAML 是解析不出来的，这里一并改对了。YAML 对缩进极其敏感，`run` 必须比它所属的 `- name` 那一行多缩进两格。

`RSYNC_OPTIONS` 里的 `-avz` 分别是归档模式、显示过程、传输压缩。`--delete` 会把目标目录里源端没有的文件删掉，好处是不会残留上个版本的僵尸文件，坏处是你要是把 `DEST` 写成了 `/home/data` 这种上层目录，它会把里面别的东西一起删了。写这个参数之前一定把 `DEST` 再看一遍。

那个 action 引用的是一长串 commit sha 而不是标签，这正是前面说的锁版本做法，对涉及私钥的 action 来说这么钉住是合理的。

## 六、发布到腾讯云静态网站托管

最后一种走的是腾讯云 CloudBase 的静态托管，官方提供了现成的 action，配置最短：

```yaml
on:
  push:
    branches: [ master ]

env:
  NODE_VERSION: '10.x'                # set this to the node version to use

jobs:
  deploy-tengxunoss:
    name: 发布到腾讯云oss
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: install
      run: npm install
    - name: Build
      run:  npm run build:tengxun:fe
    - name: Deploy static to Tencent CloudBase
      uses: TencentCloudBase/cloudbase-action@v1
      with:
        # 云开发的访问密钥 secretId 和 secretKey
        secretId: ${{ secrets.TENGXUN_OSS_SECRET_ID }}
        secretKey: ${{ secrets.TENGXUN_OSS_SECRET_KEY }}
        # 云开发的环境id
        envId: ${{ secrets.TENGXUN_OSS_ENV_ID }}
        # Github 项目静态文件的路径
        staticSrcPath: build
```

三个 secret 要先在仓库里建好：`TENGXUN_OSS_SECRET_ID` 和 `TENGXUN_OSS_SECRET_KEY` 在腾讯云后台的访问密钥页面创建密钥对拿到，`TENGXUN_OSS_ENV_ID` 是云开发的环境 id，[参考这里获取](https://docs.cloudbase.net/hosting/)。

`staticSrcPath` 填的是构建产物目录，跟你 `npm run build` 输出到哪就得填哪。这里写的是 `build`，如果你的项目输出到 `dist` 或者 `.vuepress/dist`，记得同步改掉，不然会传空目录上去然后一脸茫然地刷新页面。

顺着上面聊，这四种方式其实是一个模式的四种收尾：前面的 checkout、install、build 完全一样，差别只在最后一步用哪个 action 把产物送出去。你要是也在做多端发布，完全可以把它们写成同一个 workflow 里的四个 job，共用触发条件，各发各的。

## 七、上线前 checklist

这份清单是我配完这几套之后攒下来的，每次新加 workflow 会照着过一遍：

- [ ] 所有密钥、密码、access key 都走 `secrets` 注入，yml 里没有任何明文
- [ ] `on.push.branches` 限定了分支，不会因为推 feature 分支就触发一次生产部署
- [ ] 有先后依赖的 job 之间写了 `needs`，没有依赖关系的才让它并行
- [ ] 构建产物目录（`PUBLISH_DIR` / `staticSrcPath` / `SRC`）和本地 `npm run build` 的实际输出一致
- [ ] 部署目标路径（`DEST`）确认过一遍，尤其是配了 `--delete` 的 rsync
- [ ] CI 上会用到的命令行工具都在 step 里显式安装过，没有依赖本机全局环境
- [ ] 给 CI 用的 SSH 私钥没有设密码短语，且是单独生成的部署专用密钥
- [ ] 引用的第三方 action 锁了版本标签或 commit sha，没有裸写 `@master`
- [ ] 入口 HTML 没有被设成长缓存，只有带哈希的静态资源设了
- [ ] 第一次跑之前，先在一个测试分支或者测试 bucket 上完整走一遍，别拿生产环境当调试台

最后一条最重要。CI 配置这东西没法本地完整模拟，只能推上去跑，而失败的那次往往已经把线上文件覆盖掉了。

## 总结

GitHub Actions 好用的地方在于它把 CI 拆成了可复用的零件，你不需要写完整的部署脚本，只需要挑选并串联现成的 action。四种部署方式的差异只在最后一步，前面的 checkout、install、build 是完全一样的模板。

真正会绊住人的是这几处：job 默认并行所以有依赖必须写 `needs`；虚拟机每次全新所以工具得在 step 里装；跨仓库发布的公钥放目标仓库、私钥放源仓库；rsync 的 `--delete` 配上写错的 `DEST` 会删掉不该删的东西。这四点占了我调试时间的大半。

文中的版本号是 2020 年的写法，我保留了原样。你实际用的时候按照第 2.7 节说的，去 action 仓库看一眼当前推荐的大版本再填。至于用 Docker 镜像做发布的更完整流水线，可以接着看这篇 [基于 GitHub Actions 构建 Docker 镜像部署到腾讯云私有仓库](https://feinterview.poetries.top/blog/github-actions-tencent-docker-registry)，思路是一样的，只是产物从静态文件换成了镜像。想对比自建 CI 的成本，可以翻我之前写的 [Jenkins 自动部署前端项目](https://feinterview.poetries.top/blog/jenkins-deploy-fe) 和 [Travis CI 实践](https://feinterview.poetries.top/blog/travis-ci)。

## 参考

- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [Workflow syntax for GitHub Actions](https://help.github.com/en/articles/workflow-syntax-for-github-actions)
- [Events that trigger workflows](https://help.github.com/en/articles/events-that-trigger-workflows)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [awesome-actions](https://github.com/sdras/awesome-actions)
- [GitHub Actions 入门教程 · 阮一峰](http://www.ruanyifeng.com/blog/2019/09/getting-started-with-github-actions.html)
- [腾讯云 CloudBase 静态网站托管文档](https://docs.cloudbase.net/hosting/)
- [前端进阶之旅](https://interview.poetries.top)
