---
title: Jenkins 部署微前端实践总结，从构建到上线全链路
date: 2021-11-17 10:35:08
description: 微前端主子应用怎么在一条 Jenkins 流水线上按需构建、分目录部署。含参数化构建配置、构建与构建后 shell 全文、阿里云 OSS + CDN 方案，以及一份上线前 checklist。
tags:
- 微前端
- Jenkins
- 持续集成
- CI/CD
- 部署
- 阿里云OSS
categories: Front-End
---

微前端把一个仓库拆成一个主应用加七八个子应用之后，本地开发是舒服了，发布这件事却变得很尴尬。全量构建一次要十几分钟，可这次上线明明只改了一个子应用。手动打包再 `scp` 上去也不是办法，子应用要放进主应用目录下的固定子目录，主应用发布时还不能把这些子目录删掉。

这篇把我用 Jenkins 跑微前端流水线的整套配置写下来，包括按需构建哪几个包、构建产物怎么归拢、构建后 shell 怎么在部署机上做「主应用覆盖但保留子目录」这个动作，最后再补一条阿里云 OSS 加 CDN 的路子和一份上线前 checklist。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 微前端从提交代码到用户看到页面，整条链路都发生了什么
- Jenkins 的系统管理、凭据、插件、视图、任务这几个概念怎么对上
- 参数化构建怎么配，才能做到「只构建勾选的那几个包」
- 构建 shell 和构建后 shell 的完整代码，以及每一段在防什么坑
- 主应用发布时怎么不误删子应用目录
- 换成阿里云 OSS 加 CDN 部署要配哪几步，`index.html` 的缓存怎么设
- 一份可以直接抄的上线前 checklist

## 一、先把整条链路画出来

配置界面点来点去很容易迷路，动手之前先把链路捋一遍，后面每一个配置项落在哪一步就清楚了：

```
   开发提交代码
        │
        ▼
┌───────────────────────────────────────────┐
│  Jenkins 构建机                            │
│                                           │
│  ① General                                │
│     参数化：mutiParams（勾哪几个包）       │
│              isRunInstall（要不要装依赖）  │
│  ② 源码管理  Git plugin 拉代码             │
│     → /var/lib/jenkins/workspace/{任务名}  │
│  ③ 构建  执行 shell                        │
│     for 勾选的包: npm install → npm build  │
│     产物统一搬到 publish/{子目录}          │
└──────────────────┬────────────────────────┘
                   │ ④ Send build artifacts over SSH
                   │    publish/** → 部署机
                   ▼
┌───────────────────────────────────────────┐
│  部署机                                    │
│  ⑤ Exec command（构建后 shell）            │
│     main  → 铺到部署根目录（保留子目录）    │
│     subs/* → 各自覆盖到同名子目录          │
│     最后删掉 publish 临时目录              │
└──────────────────┬────────────────────────┘
                   │
                   ▼
        Nginx 指向部署根目录 / 或 OSS + CDN
                   │
                   ▼
              用户访问页面
```

整条链路的难点只有一处，就是第 ⑤ 步。主应用的产物要铺在部署根目录下，子应用的产物在同一个根目录下各占一个子目录，那主应用重新发布时，怎么在清掉旧文件的同时不把子应用目录一起删了。后面第四节的 shell 就是在解决这件事。

如果你还不清楚主应用和子应用在运行时是怎么互相找到的，可以先看 [微前端实战总结，从 single-spa 到 qiankun 的原理拆解](https://feinterview.poetries.top/blog/micro-fe-summary)，那边讲的是原理，这篇只讲上线。还没定下来用哪套框架的话，[微前端落地方案对比，qiankun 无界 Module Federation 怎么选](https://feinterview.poetries.top/blog/micro-frontend-comparison) 里有一条可以照着走的选型路径。

顺便说一句，下面这套流水线其实和你用哪个微前端框架关系不大。不管是 qiankun 还是 icestark，产物都是一堆静态文件，差别只在目录怎么摆。

## 二、Jenkins 的几个概念先对齐

Jenkins 是基于 Java 开发的持续集成工具，免费开源，用于监控持续重复的工作，目标是把软件的持续集成自动化。功能上主要是两块，持续的软件版本发布和测试，以及监控外部调用执行的工作。

它的界面概念不多，但名字起得有点绕，先花几分钟对齐一下。

### 2.1 系统管理

**执行者数量**是系统可同时并发执行任务的数量，默认 2 个。这个值原则上不要超过服务器 CPU 核数，否则容易出现 CPU 过载把服务拖挂。微前端项目一次构建可能同时跑好几个 `npm run build`，本来就吃 CPU，这里我一般不往上调。

**Jenkins URL** 是 Jenkins 的访问地址，改这里的端口号和改服务器配置文件的端口号效果一致。

**凭据**用来存储需要密文保护的东西，数据库密码、GitLab 密码、Docker 私有仓库密码都放这儿，Jenkins 靠它和第三方应用交互。要安装 Credentials Binding 插件用户才能管理凭据。凭据管理包含凭据本身和凭据所在域的管理，系统默认会创建全局域，你也可以自己添加域再在域下加凭据。为了最大程度提高安全性，在 Jenkins 中配置的凭据以加密形式存储在主实例上，由 Jenkins 实例 ID 加密，使用时靠配置的唯一标识 ID 引用。

可以添加的凭据有五种：用户名和密码、SSH 密钥（SSH 公私钥对）、加密文件、令牌（例如 API 令牌、GitHub 个人访问令牌）、证书。添加时要填种类、范围（全局或系统）、凭据内容、ID、描述。

这里有个坑要注意，ID 字段是可选的，不填 Jenkins 会分配一个全局唯一的 GUID。但一旦设置了凭证 ID，之后就无法再更改。所以如果你打算在 Pipeline 脚本里按 ID 引用凭据，第一次就把名字起对。

**插件管理**有两条路。一条是在管理平台界面里用插件管理器，路径是「系统管理」→「插件管理」，在「可选插件」标签下搜索需要的插件，勾选后点左下角的下载并重启后安装，等下载完成服务自动重启，重新进入系统即安装成功。另一条是用 Jenkins CLI 的 `install-plugin` 命令，适合用脚本或者配置管理代码来装插件的场景，不需要在 Web UI 里做人工交互。

**用户管理**默认使用自带数据库模式存储用户，Jenkins 默认创建 admin 账号，初始密码在 `/var/lib/jenkins/secrets/initialAdminPassword`，登录之后可以在管理用户里改掉。第一次装完记得改，这个文件路径是公开的常识。

### 2.2 视图和任务

视图主要用来管理不同项目之间的任务，一般是每个项目建一个视图，在视图下管理整个项目的模块。常用的是列表视图（显示简单列表，新建或编辑视图时可以把已有任务加进来，也可以在该视图下新建任务）和我的视图（自动显示当前用户有权限访问的任务）。

新建任务时要填任务名称，选任务模板。新装的 Jenkins 一般只有一个「构建一个自由风格的软件项目」模板，其他模板要下对应的插件，不同模板的构建流程也不一样。还有个复制选项，输入已有任务名可以复制一份新任务，但选了复制就不能再自定义模板了，会以被复制项目的模板为准。

任务详情页里几个常用入口：状态、修改记录（每次构建获取的代码变更记录，也就是这次构建的 git 提交记录）、工作空间（任务的项目文件目录）、立即构建、配置（配置整个构建和部署过程要干什么）、删除工程、重命名。

概念就这些。下面进入正题，一步步配任务。

## 三、任务配置分四步走

任务配置就是把「从拉代码到部署成功」这个过程拆成几段分别配置。

### Step 1. General

这一步是执行构建前对 Jenkins 本身做的一些设置。

**丢弃旧的构建**默认策略是 Log Rotation，可以设保持构建的天数（保存此天数内的构建记录，为空则全保留）和保持构建的最大个数（保存最近这么多次构建，为空则全保留）。这两个建议一定要设，构建产物加上工作空间很吃磁盘，我见过因为没配这个把构建机磁盘塞满的。

**参数化构建过程**是微前端场景下最关键的一项，它就是「只构建我勾选的那几个包」的实现方式。

要装 `Extended Choice Parameter` 插件，它提供多选框类型的参数：

![Extended Choice Parameter 插件安装界面](https://blog.poetries.top/img/static/images/20211117095347.png)

配置项逐条对应关系是这样：

- Name：构建过程使用的参数名，后面 shell 里靠这个名字取值
- Description：参数描述
- Parameter Type：`Check Boxes`，也就是多选框
- Number of Visible Items：`8`，checkbox 参数值个数，等于项目子包和主包的总数
- Delimiter：`,`，各个值的分割符号
- Choose Source for Value：`main,subs/appletuser,subs/college,subs/follow,subs/project,subs/questions,subs/statistics,subs/system`，填的是主包和子包相对项目根目录的路径
- Choose Source for Default Value：同上，表示默认全选

这里的取值一定要写成相对项目根目录的路径，因为构建 shell 里会直接 `cd` 进去。写成应用名而不是路径的话，shell 里还得再做一次映射，没必要。

另外再加一个布尔值参数，用来判断这次构建要不要跑 `npm install`：

- 名称：`isRunInstall`
- 默认值：默认是否勾选
- 描述：参数描述

依赖没变的日常发版把它关掉，能省下好几分钟。这个开关是全局的，勾选的所有应用会按同一个规则执行。

### Step 2. 源码管理

用 Git plugin 同步代码仓库。任务执行时代码会被拉到 `/var/lib/jenkins/workspace/{任务名称}` 目录下，后面 shell 里的 `$WORKSPACE` 环境变量就是这个路径。

要填的东西不多：

- Repository URL：代码仓库地址
- Credentials：服务器连接代码仓库的凭据，可以在系统管理里加好后在这选，也可以点右边的添加按钮现加，新增方式和系统管理里一样
- Branches to build：指定任务需要拉取的分支，允许配多个
- 源码库浏览器：指定 git 仓库类型，默认自动

### Step 3. 构建

执行 shell 这一步，源码管理插件已经把代码拉下来了。这段 shell 要做的是按参数化构建时勾选的应用逐个打包，再把产物统一放到项目根目录的 `publish` 文件夹里。

```shell
#!/bin/bash
# 项目根目录地址（相对于工作空间）
project_path=""
# 将用户选择需要打包的应用拆分成数组
OLD_IFS="$IFS"
IFS=","
arr=($mutiParams)
IFS="$OLD_IFS"
# 清空上次打包的部署文件
rm -rf $WORKSPACE$project_path/publish


for i in ${arr[@]}
do
    # 进入对应的应用中执行打包过程，$WORKSPACE为系统环境变量，值为工作空间地址
    cd $WORKSPACE$project_path/$i
    rm -rf dist
    # 判断是否需要执行环境安装，当前设置为全局设置，所有需要打包的应用会执行相同的判断
    if [[ $isRunInstall == "true" ]]
    then
      npm install
    fi
    npm run build
    # 将子应用和主应用放在同一级，便于后续部署，因为很多微前端项目子应用都会放置在同一个文件夹下
    [[ $i == "main" ]] && subdir=$i || subdir=${i##*/}


    mkdir -p $WORKSPACE$project_path/publish/$subdir
    mv dist/* $WORKSPACE$project_path/publish/$subdir
done
```

拆开看几处关键的。

`OLD_IFS` 那三行是在临时改 shell 的分隔符。`mutiParams` 传进来是 `main,subs/college,subs/system` 这样一个逗号串，把 `IFS` 改成逗号再 `arr=($mutiParams)` 才能正确切成数组，切完立刻改回来，不然后面所有按空格分词的地方都会出问题。

开头的 `rm -rf publish` 是防上一次构建的残留。如果不清，这次只勾了两个包，上次那六个包的旧产物还留在 `publish` 里，会一起被推到部署机去覆盖线上，等于把老版本发上去了。这个坑很隐蔽，因为构建日志一切正常。

`${i##*/}` 是取路径最后一段，`subs/college` 会变成 `college`。主应用不走这个逻辑，直接保留 `main` 这个名字，因为它在部署机上的处理方式和子应用完全不同。

### Step 4. 构建后操作

用 Send build artifacts over SSH 插件，它把构建好的产物按规则发到部署服务器，发完还能在部署机上执行一段 shell。这个插件要在「系统管理」→「插件管理」里装，装完还要在「系统管理」→「系统配置」→「Publish over SSH」里添加 SSH Server。

![Publish over SSH 插件](https://blog.poetries.top/img/static/images/20211117095208.png)

在「系统管理」→「系统配置」→「Publish over SSH」里添加部署机信息：

![在系统配置中添加 SSH Server](https://blog.poetries.top/img/static/images/20211117095542.png)

回到任务配置里，Transfers 这几项的含义是：

- Name：选择部署服务器，就是刚才在系统配置里加的那台，构建时会连它
- Source files：构建服务器中部署文件的相对地址，填 `publish/**`
- Remove prefix：文件发送后在部署机上的路径默认和 Source files 一致，可以按需删掉前面某一段，这里留空
- Remote directory：部署服务器的部署目录，例如 `/home/jenkinsC`
- Exec command：文件发送完成之后在部署机上执行的 shell

Exec command 这段是整篇最核心的一块，它解决的就是第一节说的那个问题，主应用要覆盖根目录但不能删掉子应用目录：

```bash
#!/bin/bash


# 此处的packages后面多了个publish是打包之后的部署文件名，为了防止在部署主应用的时候被删掉
packages="main,subs/appletuser,subs/college,subs/follow,subs/project,subs/questions,subs/statistics,subs/system,publish"
# 部署目录
PUBLISH_PATH=/home/jenkinsC


# 依次循环部署构建好的应用
for package in `ls $PUBLISH_PATH/publish`
do
    # 判断当前是否为主应用，因为主包需要把主应用的所有文件直接部署在部署目录下，所以需要在过滤掉子应用和publish文件夹的情况下删除所有旧的主应用文件再进行部署
    if [[ $package == "main" ]]
    then
        for element in `ls $PUBLISH_PATH`
        do
          [[ $packages =~ $element ]] || rm -rf $PUBLISH_PATH/$element
        done
        mv $PUBLISH_PATH/publish/$package/* $PUBLISH_PATH
    else
        # 子应用部署方式直接先删除原有文件后部署
        rm -rf $PUBLISH_PATH/$package
        mkdir -p $PUBLISH_PATH/$package
        mv $PUBLISH_PATH/publish/$package/* $PUBLISH_PATH/$package
    fi
done
# 部署完成后需要删除部署文件，否则下次部署如果没有删掉会再次部署旧的文件
rm -rf $PUBLISH_PATH/publish
```

主应用那个分支的逻辑是这样：先遍历部署目录下的所有条目，凡是不在 `packages` 白名单里的一律删掉，然后把主应用产物铺进来。`packages` 里之所以要带上 `publish`，是因为这个临时目录此刻就躺在部署目录下，不加白名单的话循环第一轮就把它自己删了，后面全乱套。

`[[ $packages =~ $element ]]` 用的是正则匹配而不是精确匹配，这里有个隐患。如果部署目录下存在一个叫 `mainx` 的目录，`main` 能在 `packages` 里匹配上，`mainx` 也一样能匹配上（因为它包含 `main` 这个子串反过来说不成立，但如果白名单里有 `college`，那 `colleg` 这种名字就会被误判）。目录名规划得干净点就不会遇到，但心里要有数。

子应用那个分支简单得多，先删同名目录再重建，直接整体覆盖。

最后一行删掉 `publish` 也不能省。留着的话，下次部署时主应用分支那个白名单循环还得靠它，而遗留的旧文件会被再发布一次。

## 四、跑一次构建看看结果

配置完成之后就可以按规则执行自动化构建和部署了。

### 4.1 构建前

路径是「工程」→「Build With Parameters」→「开始构建」。

点开始构建前要先配这次构建的参数，构建过程中在左下角的构建历史可以看到进度条：

- `mutiParams`：勾选这次要构建的应用，没勾的不会构建
- `isRunInstall`：要不要执行 `npm install`，勾选的所有应用都按这个规则走，日常发版关掉能省不少时间

### 4.2 构建后

左侧构建历史里可以看每次构建的状态，每条记录前的小球颜色就是状态标识，一般三种：

- SUCCESS（蓝色）：构建部署成功
- UNSTABLE（黄色）：构建成功，但是部署过程出错
- FAILURE（红色）：构建过程就已经出错

黄色这个状态最容易被忽略。它意味着包打出来了但没送到部署机上，页面还是老版本，测试同学过来问「你发了吗」的时候你还以为发好了。所以构建历史别只看有没有红色。

点开对应构建记录能看到详细信息：状态集（执行构建的用户、这次构建的 git 分支和提交记录）、变更记录（git 提交记录详情）、控制台输出、编辑编译信息、删除构建、参数（这次构建的自定义参数取值）。

控制台输出是排查问题的第一入口。构建失败的原因、shell 每一步的实际执行情况，都在里面。

## 五、完整配置走一遍

上面是分步骤讲，这一节按实际操作顺序把整套配置串起来。

### 5.1 需要装的三个插件

- `Extended Choice Parameter`：提供多选框参数，实现按需构建
- `Git plugin`：GIT 仓库管理插件，用于同步 git 库，任务执行时把代码拉到 `/var/lib/jenkins/workspace/{任务名称}` 下
- `Send build artifacts over SSH`：把构建产物按规则发到部署机并在其上执行 shell，装完记得去「系统管理」→「系统配置」→「Publish over SSH」加 SSH Server

### 5.2 配好之后长什么样

构建入口页面，勾选要构建的包再点开始：

![参数化构建的勾选界面](https://blog.poetries.top/img/static/images/20211117092944.png)

构建历史和状态：

![构建历史与状态列表](https://blog.poetries.top/img/static/images/20211117093241.png)

### 5.3 配置流程截图

任务的 General 配置：

![任务 General 配置](https://blog.poetries.top/img/static/images/20211117085757.png)

参数化构建过程的几项具体填法：

![Extended Choice Parameter 参数配置](https://blog.poetries.top/img/static/images/20211117090018.png)
![布尔值参数配置](https://blog.poetries.top/img/static/images/20211117091728.png)
![源码管理 Git 配置](https://blog.poetries.top/img/static/images/20211117091930.png)
![构建步骤执行 shell 配置](https://blog.poetries.top/img/static/images/20211117092045.png)

### 5.4 构建的 shell 代码

这是我实际在用的版本，比第三节那份多了两件事，一是支持多环境（`nodeDev` 参数决定跑 test 还是 build），二是子应用目录名做了统一处理：

```shell
#!/bin/bash -ilex

echo $PATH

packages="main,subs/system,subs/teaLifeManage,subs/wechatManage"
project_path=""

OLD_IFS="$IFS"
IFS=","
arr=($mutiParams)
IFS="$OLD_IFS"

rm -rf $WORKSPACE$project_path/publish

for i in ${arr[@]}
do
	echo '打印i：' + $i 
    cd $WORKSPACE$project_path/$i
    rm -rf dist
    if [[ $isRunInstall == "true" ]]
    then
       npm install
    fi
    
    if [[ $i == "main" ]]
    then
      if [[ $nodeDev == "development" ]]
      then
      	npm run test
      else
      	npm run build $nodeDev
      fi
    else
      npm run build $nodeDev
    fi
    
    if [[ $i == "main" ]]
    then
    	newsubdir=$i
    else
    	subdir=${i%Manage*}
        newsubdir=${subdir##*/}
    fi
    
    
    mkdir -p $WORKSPACE$project_path/publish/${newsubdir,,}
    mv dist/* $WORKSPACE$project_path/publish/${newsubdir,,}
    
    echo '打印WORKSPACE：' + $WORKSPACE
    echo '打印newsubdir：' + $newsubdir
done
```

第一行的 `#!/bin/bash -ilex` 值得单独说一下。`-i` 是交互模式，会加载 `.bashrc`，这样才能拿到 nvm 装的 node；`-l` 加载 login shell 配置；`-e` 遇错立即退出；`-x` 打印每条执行的命令。`-x` 在排查构建问题时很有用，控制台里能看到每条命令的实际取值。`-e` 则保证某个子应用打包失败时整个构建直接红掉，而不是继续往下跑最后发一个残缺产物上去。

`${i%Manage*}` 是把路径里的 `Manage` 后缀砍掉，`subs/teaLifeManage` 变成 `subs/teaLife`，再用 `${subdir##*/}` 取最后一段得到 `teaLife`。`${newsubdir,,}` 是 bash 4 的语法，把变量转成全小写，最后落到 `publish/tealife`。这一串处理是为了让部署目录名统一小写，因为服务器路径大小写敏感，前端路由里写的是小写就得配上。

这里顺带提醒一句，往 Jenkins 的 shell 输入框里粘贴代码时很容易带进多余字符，比如把 `then` 粘成 `theninsta` 这种。表现是构建一开始就报语法错误，日志里那行看着又特别像正常的 `then`，很费眼睛。上面这份是核对过的版本。

配置界面里对应的位置：

![构建后操作 Exec command 配置](https://blog.poetries.top/img/static/images/20211117092331.png)

### 5.5 构建后操作的 shell 代码

```
#!/bin/bash -ilex
packages="main,subs/system,subs/teaLifeManage,subs/wechatManage,publish"
PUBLISH_PATH=/home/docker/nginx/html/web-test

for package in `ls $PUBLISH_PATH/publish`
do
    if [[ $package == "main" ]]
    then
        for element in `ls $PUBLISH_PATH`
        do
    	    [[ ${packages,,} =~ $element ]] || rm -rf $PUBLISH_PATH/$element
        done
        mv $PUBLISH_PATH/publish/$package/* $PUBLISH_PATH
    else
        rm -rf $PUBLISH_PATH/$package
        mkdir -p $PUBLISH_PATH/$package
        mv $PUBLISH_PATH/publish/$package/* $PUBLISH_PATH/$package
    fi
done
rm -rf $PUBLISH_PATH/publish
```

和第三节那版逻辑一致，区别是白名单比较时用了 `${packages,,}` 转小写，和构建 shell 里的 `${newsubdir,,}` 对上。两边的大小写处理必须一致，只改一边的话主应用发布时会把子应用目录当成不在白名单里的东西删掉，线上直接 404。

最后配一下 Nginx 指向 `/home/docker/nginx/html/web-test` 这个部署目录就能访问了。整套跑通之后，从勾选包到页面更新是这么一条线：

![Jenkins 微前端部署流程全貌](https://blog.poetries.top/img/static/images/20211117112123.png)

## 六、换一条路，阿里云 OSS 加 CDN

如果不想自己维护部署机和 Nginx，把静态资源丢到对象存储上是更省事的做法。下面是完整步骤。

### 6.1 创建 Bucket 存储桶

进入对象存储 OSS 服务 `https://oss.console.aliyun.com/`，创建 Bucket：

- Bucket 名称：xxx
- 地域：华南 1（深圳）
- 版本控制：不开通
- 读写权限：公共读
- 其他保持默认

读写权限选公共读，不要选公共读写。公共读写意味着任何人都能往你的桶里写文件，这个坑网上翻车案例不少。

### 6.2 添加 CDN 域名

进入 CDN 服务 `https://cdn.console.aliyun.com/`，路径是「CDN」→「域名管理」→「添加域名」：

- 加速域名：xxx.test.com
- 资源分组：会员商城
- 新增源站信息
  - 源站信息：OSS 域名
  - 域名：xxx.oss-cn-shenzhen.aliyuncs.com
  - 其他保持默认

然后配 HTTPS，路径是「CDN」→「域名管理」→「域名名称」→「HTTPS 配置」→「HTTPS 证书」→「修改配置」：

- HTTPS 安全加速：开启
- 证书来源：云盾（SSL）证书中心
- 证书名称：test.com
- 其他保持默认

配完在「CDN」→「域名管理」里能拿到 CNAME 域名，形如 `xxx.test.com.w.kunlunpi.com`。

### 6.3 添加 CNAME 记录

进入云解析 DNS 服务 `https://dns.console.aliyun.com/`，路径是「云解析 DNS」→「域名解析」→「解析设置」→「添加记录」：

- 记录类型：CNAME
- 主机记录：xxx.test.com
- 记录值：xxx.test.com.w.kunlunpi.com
- 其他保持默认

### 6.4 设置存储桶

这一步是整个 OSS 方案里最容易出事的地方，缓存配错了用户会一直看到老版本。

路径是「对象存储」→「Bucket 列表」→「找到存储桶」→「文件管理」→「找到 index.html 文件」→「更多」→「设置 HTTP 头」：

- Cache-Control：`no-cache`，表示 Object 允许被缓存在客户端或代理服务器的浏览器中，但每次访问时需要向 OSS 验证缓存是否可用，可用时直接用缓存，不可用时重新请求
- Expires：-1

如果你希望更保守一点，也可以用 `no-store`，它表示完全不允许缓存这个 Object。两者选一个就行，`no-cache` 走协商缓存能省流量，`no-store` 更彻底但每次都要完整下载。

要强调的是这个头只该给 `index.html` 设。带 hash 的 JS 和 CSS 产物应该走长缓存，`Cache-Control: max-age=31536000`，改了内容文件名就变了，不存在缓存不更新的问题。入口 HTML 不带 hash，所以只有它需要禁缓存。

接着设静态页面，路径是「对象存储」→「基础设置」→「静态页面」：

- 默认首页：index.html
- 子目录首页：未开通
- 默认 404 页：index.html

404 页填 `index.html` 是给前端 history 路由兜底的，用户直接访问 `/vue/detail/1` 这种深层路径时，OSS 找不到对应文件会返回这个页面，前端路由再接管渲染。

最后绑定域名，路径是「对象存储」→「传输管理」→「域名管理」→「绑定域名」，填 `xxx.test.com`，其他保持默认。

### 6.5 上传代码

下载 oss browser 工具，官方地址 `https://help.aliyun.com/document_detail/209974.html`，用它把 `publish` 目录下的产物按同样的目录结构传上去即可。

![oss browser 上传界面](https://blog.poetries.top/img/static/images/20211117102935.png)

手动上传适合验证阶段。稳定之后建议换成 `ossutil` 命令行，直接接到 Jenkins 的构建后步骤里，把第五节那段 SSH 传输换成 `ossutil cp -r publish/xxx oss://bucket/xxx --update` 就行，整条流水线一样跑得通。

## 七、上线前 checklist

这份是我自己每次发版前会过一遍的，微前端多包部署的坑基本都在里面。

**构建阶段**

- [ ] `mutiParams` 勾选的包和这次改动的包对得上，没有漏勾也没有多勾
- [ ] 依赖有变动时 `isRunInstall` 记得打开，没变动时关掉省时间
- [ ] 构建 shell 开头的 `rm -rf publish` 还在，避免上次的残留产物被一起发上去
- [ ] 子应用的 publicPath 是生产地址，不是 `localhost`
- [ ] 主应用注册子应用的 `entry` 或 url 清单指向生产域名

**部署阶段**

- [ ] 构建后 shell 的 `packages` 白名单包含所有子应用目录，并且带上 `publish`
- [ ] 构建 shell 和构建后 shell 的大小写处理一致（都用 `,,` 或都不用）
- [ ] `PUBLISH_PATH` 和 Nginx 的 root 指向同一个目录
- [ ] 部署完 `publish` 临时目录被清掉了

**验证阶段**

- [ ] 构建历史的小球是蓝色，不是黄色（黄色代表包打出来了但没送到部署机）
- [ ] 控制台输出里每个勾选的应用都有对应的 build 日志
- [ ] 主应用发布后，子应用目录还在，随便点一个子应用能正常加载
- [ ] 深层路由直接刷新不会 404（Nginx 的 `try_files` 或 OSS 的 404 页配好了）
- [ ] `index.html` 是 `no-cache`，带 hash 的静态资源是长缓存
- [ ] 用无痕窗口打开一次，确认不是本地缓存骗了你

最后一条看着很土，但真的救过我。改完一个子应用发上去，自己刷新看还是老页面，折腾半天最后发现是浏览器缓存。

## 总结

微前端的部署难点不在 Jenkins 本身，而在多包产物的归拢和覆盖策略。构建阶段用 `Extended Choice Parameter` 做参数化，把「构建哪几个包」交给发版的人决定，配上 `isRunInstall` 开关，日常发版能从十几分钟压到几分钟。产物统一搬到 `publish` 目录下，用 `${i##*/}` 取子应用目录名，主应用单独保留 `main` 这个名字。

部署阶段的核心是那段构建后 shell。主应用要铺到部署根目录，就得先按白名单删掉旧文件，白名单里必须带上 `publish` 自己，否则循环第一轮就把临时目录删了。子应用直接删同名目录再整体覆盖。两段 shell 的大小写处理必须一致，只改一边线上就 404。

跑构建时注意黄色的 UNSTABLE 状态，那是包打出来了但没送到部署机，最容易误判成发布成功。`#!/bin/bash -ilex` 里的 `-e` 保证失败即中断，`-x` 让控制台能看到每条命令的实际取值，排查问题全靠它。

换 OSS 加 CDN 的话，重点是 `index.html` 设 `no-cache`、带 hash 的资源走长缓存、404 页指回 `index.html` 给前端路由兜底。验证阶段一定要开无痕窗口，别被自己的浏览器缓存骗了。

## 参考

- [Jenkins 官方文档](https://www.jenkins.io/doc/)
- [Jenkins 插件管理](https://www.jenkins.io/doc/book/managing/plugins/)
- [Extended Choice Parameter 插件](https://plugins.jenkins.io/extended-choice-parameter/)
- [Publish Over SSH 插件](https://plugins.jenkins.io/publish-over-ssh/)
- [阿里云 OSS 静态网站托管](https://help.aliyun.com/zh/oss/user-guide/static-website-hosting)
- [阿里云 ossbrowser 工具](https://help.aliyun.com/document_detail/209974.html)
- [MDN - Cache-Control](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control)
- [前端进阶之旅](https://interview.poetries.top)
