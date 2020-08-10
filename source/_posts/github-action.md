---
title: Github Action部署应用实践总结
date: 2020-08-09 22:21:08
tags: 
   - 部署
   - Github action
categories: Front-End
---


## 一、GitHub Actions介绍

- 持续集成由很多操作组成，比如抓取代码、运行测试、登录远程服务器，发布到第三方服务等等。`GitHub` 把这些操作就称为 `actions`。
- 如果你需要某个 `action`，不必自己写复杂的脚本，直接引用他人写好的 action 即可，整个持续集成过程，就变成了一个 actions 的组合。这就是 GitHub Actions 最特别的地方

> GitHub 做了一个[官方市场](https://github.com/marketplace?type=actions)，可以搜索到他人提交的 actions。另外，还有一个 [awesome actions](https://github.com/sdras/awesome-actions) 的仓库，也可以找到不少 `action`

![](https://www.wangbase.com/blogimg/asset/201909/bg2019091105.jpg)

- 上面说了，每个 `action` 就是一个独立脚本，因此可以做成代码仓库，使用`userName/repoName`的语法引用 `action`。比如，`actions/setup-node`就表示`github.com/actions/setup-node`这个仓库，它代表一个 `action`，作用是安装 Node.js。事实上，GitHub 官方的 `actions` 都放在 `github.com/actions` 里面。

> 既然 `actions` 是代码仓库，当然就有版本的概念，用户可以引用某个具体版本的 action。下面都是合法的 action 引用，用的就是 Git 的指针概念

```bash
actions/setup-node@74bc508 # 指向一个 commit
actions/setup-node@v1.0    # 指向一个标签
actions/setup-node@master  # 指向一个分支
```

### 1.1 概念

> GitHub Actions 有一些自己的术语。

- `workflow` （工作流程）：持续集成一次运行的过程，就是一个 `workflow`。
- `job` （任务）：一个 `workflow` 由一个或多个 `jobs` 构成，含义是一次持续集成的运行，可以完成多个任务。
- `step`（步骤）：每个 `job` 由多个 `step` 构成，一步步完成。
- `action` （动作）：每个 `step` 可以依次执行一个或多个命令（`action`）

### 1.2 workflow 文件

> `GitHub Actions` 的配置文件叫做 `workflow` 文件，存放在代码仓库的 `.github/workflows` 目录。

- `workflow` 文件采用 `YAML` 格式，文件名可以任意取，但是后缀名统一为`.yml`，比如`foo.yml`。一个库可以有多个 `workflow` 文件。GitHub 只要发现`.github/workflows`目录里面有`.yml`文件，就会自动运行该文件。
- `workflow` 文件的配置字段非常多，详见[官方文档](https://help.github.com/en/articles/workflow-syntax-for-github-actions)。下面是一些基本字段。

**1. name**

- `name`字段是 `workflow` 的名称。如果省略该字段，默认为当前 `workflow` 的文件名。

```
name: GitHub Actions Demo
```

**2. on**

> `on`字段指定触发 `workflow` 的条件，通常是某些事件。

```
on: push
```

上面代码指定，`push`事件触发 `workflow`。

> `on`字段也可以是事件的数组。

```
on: [push, pull_request]
```

- 上面代码指定，`push`事件或`pull_request`事件都可以触发 `workflow`。
- 完整的事件列表，请查看[官方文档](https://help.github.com/en/articles/events-that-trigger-workflows)。除了代码库事件，GitHub Actions 也支持外部事件触发，或者定时运行

**3. `on.<push|pull_request>.<tags|branches>`**

指定触发事件时，可以限定分支或标签。

```
on:
  push:
    branches:    
      - master
```

> 上面代码指定，只有`master`分支发生`push`事件时，才会触发 `workflow`

**4. `jobs.<job_id>.name`**

- `workflow` 文件的主体是`jobs`字段，表示要执行的一项或多项任务。
- `jobs`字段里面，需要写出每一项任务的`job_id`，具体名称自定义。`job_id`里面的`name`字段是任务的说明。

```
jobs:
  my_first_job:
    name: My first job
  my_second_job:
    name: My second job
```

上面代码的jobs字段包含两项任务，`job_id`分别是`my_first_job`和`my_second_job`。

**5. `jobs.<job_id>.needs`**

> `needs`字段指定当前任务的依赖关系，即运行顺序。

```
jobs:
  job1:
  job2:
    needs: job1
  job3:
    needs: [job1, job2]
```

> 上面代码中，`job1`必须先于`job2`完成，而`job3`等待`job1`和`job2`的完成才能运行。因此，这个 workflow 的运行顺序依次为：`job1`、`job2`、`job3`

**6. `jobs.<job_id>.runs-on`**

> `runs-on`字段指定运行所需要的虚拟机环境。它是必填字段。目前可用的虚拟机如下。

```
ubuntu-latest，ubuntu-18.04或ubuntu-16.04
windows-latest，windows-2019或windows-2016
macOS-latest或macOS-10.14
```

**7. jobs.<job_id>.steps**

> `steps`字段指定每个 `Job` 的运行步骤，可以包含一个或多个步骤。每个步骤都可以指定以下三个字段。

- `jobs.<job_id>.steps.name`：步骤名称。
- `jobs.<job_id>.steps.run`：该步骤运行的命令或者 `action`。
- `jobs.<job_id>.steps.env`：该步骤所需的环境变量。

下面是一个完整的 workflow 文件的范例。

```bash
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

上面代码中，`steps`字段只包括一个步骤。该步骤先注入四个环境变量，然后执行一条 `Bash` 命令

## 二、部署实践

### 2.1 发布到阿里云oss

```bash
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

### 2.2 发布到github pages

> 从当前仓库发布到其他仓库的github pages

```bash
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

### 2.3 发布到阿里云服务器

> `rsync deployments` 需要使用远程主机的 `rsync`。远程主机安装 `rsync [centos]`

```bash
# rpm -qa|grep rsync   #检查是否安装过rsync，whereis rsync也可以
# yum install rsync       #如果未安装，使用yum安装rsync
```

**本地生成密钥对**

> 生成新的`Key`：（引号内的内容替换为你自己的邮箱）

- 直接回车，不要修改默认路劲
- 设置一个密码短语，在每次远程操作之前会要求输入密码短语！闲麻烦可以直接回车，不设置

```
ssh-keygen -t rsa -C "your_email@youremail.com"
```

**将公钥放入远程部署机 authorized_keys 文件中**

```bash
# 打开本机 .ssh 文件夹，用文本编辑器打开 id_rsa.pub 文件，复制内容到剪贴板。进入远程主机
vi /root/.ssh/authorized_keys
```

> 远程主机将用户的公钥，保存在登录后的用户主目录的`$HOME/.ssh/authorized_keys`文件中。公钥就是一段字符串，只要把它追加在`authorized_keys`文件的末尾就行了

> 将公钥 `id_rsa.pub` 内容追加到 `authorized_keys` 末尾

**centos 7 重启远程主机的ssh服务**

```
systemctl restart sshd
```

- 项目目录下新建 `.github/workflows/ci.yml`
- `ci.yml` 只要求后缀为 `yml`，名称无限制
- 在 github 项目的设置页面添加自定义密钥供 `actions` 配置文件引用
- 新建键值例如 `MY_V2_SERVER_PRIVATE_KEY` （在仓库`settings/ssh`中新建存放私钥）
- 将本机私钥文件 `id_isa` 重的内容全部复制到键值中

> 在 `actions` 中引用格式为 `${{ secrets.MY_V2_SERVER_PRIVATE_KEY }}`

```bash
on:
  push:
    branches: [ master ]

env:
  AZURE_WEBAPP_NAME: fe-interview    # set this to your application's name
  AZURE_WEBAPP_PACKAGE_PATH: '.'      # set this to the path to your web app project, defaults to the repository root
  NODE_VERSION: '10.x'                # set this to the node version to use
  # 阿里云轻应用配置
  MY_V2_SERVER_PRIVATE_KEY: ${{ secrets.MY_V2_SERVER_PRIVATE_KEY }} # 服务器私钥
  MY_V2_USER: ${{ secrets.MY_V2_USER }} # 服务器用户 如root
  MY_V2_IP: ${{ secrets.MY_V2_IP }} # 服务器ip

deploy-aliyun:
   name: 发布到阿里云服务器
   runs-on: ubuntu-latest
   steps:
   - uses: actions/checkout@v2
   - name: install
   run: npm install 
   - name: Build
   run:  npm run build:fe
   - name: rsync deployments
   uses: meetbitu/rsync-deployments@cc9f383f3399baa56527dcfd97cfee6a2da58f18
   env:
      DEPLOY_KEY: ${{ secrets.MY_V2_SERVER_PRIVATE_KEY }}
   with:
      USER_AND_HOST: ${{env.MY_V2_USER}}@${{env.MY_V2_IP}}
      DEST: /home/data/dist
      SRC: .vuepress/dist/*
      RSYNC_OPTIONS: -avz --delete
```

### 2.4 发布到腾讯云静态网站托管

- `TENGXUN_OSS_SECRET_ID`、`TENGXUN_OSS_SECRET_KEY`需要在仓库下新建，在腾讯云后台创建私钥对
- `TENGXUN_OSS_ENV_ID` 环境`id`，[参考这里获取](https://docs.cloudbase.net/hosting/)

```bash
on:
  push:
    branches: [ master ]

env:
  AZURE_WEBAPP_NAME: fe-interview    # set this to your application's name
  AZURE_WEBAPP_PACKAGE_PATH: '.'      # set this to the path to your web app project, defaults to the repository root
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

## 参考

- [GitHub Actions 入门教程](http://www.ruanyifeng.com/blog/2019/09/getting-started-with-github-actions.html)