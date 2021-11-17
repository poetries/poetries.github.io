---
title: Jenkins部署微前端方案实践总结
date: 2021-11-17 10:35:08
tags: 微前端
categories: Front-End
---


# 持续集成

集成工具 jenkins 的基本介绍和自动化部署微前端项目的几个简单方案

## 一、Jenkins 基础介绍

Jenkins 是国际上流行的免费开源软件项目,是基于 Java 开发持续集成工具,用于监控持续重复的工作,旨在提供一个开放的易用的软件平台,使软件的持续集成自动化,大大节约人力和时效。

Jenkins 功能包括：

- 持续的软件版本发布/测试项目。
- 监控外部调用执行的工作。

### 1. 系统管理

安装好的 jenkins 可以在系统管理进行配置系统信息等

- 系统设置

  - 执行者数量：系统可同时并发执行任务的数量，系统默认 2 个，原则上不超过服务器 CPU 核数，否则容易出现 CPU 利用率过载导致服务挂掉。
  - Jenkins URL：Jenkins 访问地址，可以修改地址的端口号，和修改服务器配置文件的端口号效果一致

- 凭据配置

  - 凭据可以用来存储需要密文保护的数据库密码、Gitlab 密码信息、Docker 私有仓库密码等，以便 Jenkins 可以和这些第三方的应用进行交互，需要安装 Credentials Binding 插件，用户才可管理凭据

- 凭据管理

  - 凭据管理包含凭据的管理和凭据所在域的管理，系统默认会创建全局域，用户可以在两个管理表格的存储下添加域，在用户选择的域下添加凭据或者进入域详情添加凭据。为了最大程度地提高安全性，在 Jenkins 中配置的凭据以加密形式存储在主 Jenkins 实例上（由 Jenkins 实例 ID 加密），用户需要使用配置的唯一标识 ID 进行处理。
  - 可以添加的凭证有 5 种：
    1. 用户名和密码
    2. SSH 密钥（SSH 公私钥对）
    3. 加密文件
    4. 令牌（例如 API 令牌、GitHub 个人访问令牌）
    5. 证书
  - 添加凭据：
    1. 种类
    2. 范围 （全局、系统）
    3. 凭据
    4. ID (此字段是可选的。如果未指定其值，Jenkins 将为凭证 ID 分配一个全局唯一 ID（GUID）值。请记住，一旦设置了凭证 ID，就无法再更改它)
    5. 凭证描述。

- 插件管理

  Jenkins 提供了两种不同的方法来在主服务器上安装插件：

  - 在管理平台界面中使用插件管理器

    通过“系统管理” >“插件管理”视图，Jenkins 环境的管理员可以使用该视图。在“ 可选插件 ”选项卡下，可以搜索用户需要的插件，搜索到需要的插件后勾选插件列表的选中框，之后点击左下角的下载并且重启后安装，等待插件下载完成后服务自动重启，重新进入系统即安装成功。

  - 使用 Jenkins CLI install-plugin 命令

    管理员还可以使用 Jenkins CLI，它提供了安装插件的命令。用于管理 Jenkins 环境的脚本或配置管理代码可能需要安装插件，而无需在 Web UI 中直接进行用户交互。Jenkins CLI 允许命令行用户或自动化工具下载插件及其依赖项

- 管理用户

  Jenkins 默认使用自带数据库模式存储用户，jenkins 默认创建 admin 账号，默认密码位于 `/var/lib/jenkins/secrets/initialAdminPassword`，登录之后可在管理用户修改用户默认密码

### 2. 新建视图

视图功能主要用于管理不同项目之间的任务，每个项目创建一个视图并在视图下管理整个项目的模块。

- 列表视图（显示简单列表。新建或编辑视图的时候可以选择将当前已有的任务添加到该视图，也可以在该视图下新建任务）
- 我的视图（该视图自动显示当前用户有权限访问的任务）

### 3. 任务

- 新建任务
  - 任务名称
  - 任务模板：jenkins 提供的任务模板，一般新安装的 jenkins 只会有一个“构建一个自由风格的软件项目”模板，而如果需要其他的任务模板需要用户下载对应的插件，不同的任务模板会有不同的构建流程
  - 复制：可选项，用户可以输入已有的任务名称选择其中之一复制一个新的任务，选择了复制的任务后就无法自定义任务模板，以复制的项目的任务模板为主
- 任务详情
  - 状态
  - 修改记录：每次构建获取的代码变更记录，即记录每次构建的 git 仓库提交记录
  - 工作空间：任务的工作空间的项目文件目录
  - 立即构建：执行构建部署任务，使用不同的插件执行构建过程会有差异
  - 配置：配置整个任务构建和部署过程的需要干什么
  - 删除工程
  - 重命名

## 二、任务配置

任务配置主要将自动化构建部署从项目的获取到部署成功的一个过程需要做的工作做分解配置。

### 1. General

这一步主要是在执行构建前对 jenkins 配置进行了简单的设置

- 描述

- 丢弃旧的构建

  - 策略：默认 Log Rotation
    - 保持构建的天数：将保存此天数的构建记录，为空保存所有
    - 保持构建的最大个数：保存最近该个数的构建，为空保存所有

- 参数化构建过程

  Extended Choice Parameter 插件，该插件可以使用多选框，利用该插件可以指定需要打包的应用，而不需要打包所有项目，减少打包时间

  - Name：构建过程使用的参数名
  - Description：参数描述
  - Basic Parameter Types
    - Parameter Type：`Check Boxes` （值使用的类型）
    - Number of Visible Items：`8` checkbox 参数值个数（项目子包和主包个数）
    - Delimiter：`,` 各个值的分割符号
    - Choose Source for Value：`main,subs/appletuser,subs/college,subs/follow,subs/project,subs/questions,subs/statistics,subs/system` 参数值（主包和子包相对项目路径
    - Choose Source for Default Value：`main,subs/appletuser,subs/college,subs/follow,subs/project,subs/questions,subs/statistics,subs/system` 参数默认选中的值（主包和子包相对项目路径

  布尔值参数，true/false 值的参数，当前应用于构建过程中判断是否需要构建 npm install

  - 名称：构建过程使用的参数名
  - 默认值：默认是否勾选
  - 描述：参数描述

### 2. 源码管理

- Git plugin

  GIT 仓库管理插件，用于同步 git 库，通过该插件 jenkins 任务可以在构建过程中获取配置好的 git 远程仓库代码，任务执行时代码会被拉取到`/var/lib/jenkins/workspace/{任务名称}`目录下

  - Repository URL 代码仓库地址
  - Credentials 服务器连接代码仓库的凭据，可在系统管理添加后选择，也可以在右边的添加按钮新增凭据，新增方式和系统管理的凭据新增一样
  - Branches to build 指定任务需要拉取的分支，允许配置多个分支
  - 源码库浏览器 指定 git 仓库类型，默认自动

### 3. 构建

- 执行 shell

  开始执行构建任务之前源码管理插件已经将代码从远程库中获取，执行 shell 任务主要通过获取参数化构建时设置的参数去对整个项目中的各个应用进行打包并将打包完成的部署文件统一放在根目录的发布文件夹`publish`，执行详细代码如下：

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

### 4. 构建后操作

- Send build artifacts over SSH，使用该插件需要在`系统管理->插件管理`中安装，该插件主要功能为将构建好的部署包按照一定规则发送到部署服务器，并且在这之后可在部署服务器执行一定的 shell 操作。安装插件后还需要在`系统管理->系统配置->Publish over SSH`添加 SSH Services。

  - Name：选择部署服务器，所选服务器就是系统配置中所添加，构建时就会连接该服务器

  - Transfers

    - Source files：构建服务器中部署文件的相对地址`publish/**`
    - Remove prefix：文件发送后在部署服务器的路径和 Source files 一致，可以根据需求删除该地址前面某一段，当前为空
    - Remote directory：部署服务器的部署目录`/home/jenkinsC`
    - Exec command：文件发送完成之后在这里可以对部署服务器进行操作，这里的 shell 操作作用于部署服务器，由于微前端的部署特殊性，所以这里需要对发送过来的文件进行转移操作，具体如下：

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

## 三、构建

按照上一步的配置规则执行自动化构建和部署

### 1. 构建前

路径：工程->Build With Parameters->开始构建

点击开始构建前需要配置构建所需的参数，构建过程中在左下角的构建历史可以查看构建进度条。

- mutiParams：选中对应的应用，构建过程中就会只构建有勾选的应用
- isRunInstall：应用是否需要执行 npm install，当前构建被选中的应用都会按照这个规则执行，为了减少构建过程所消耗的时间

### 2. 构建后

在左侧的构建历史可以查看构建记录的状态，并且每个构建记录还能通过构建编号左侧的小球颜色判断状态，一般有三个状态分别分为 SUCCESS（蓝色）、UNSTABLE（黄色）、FAILURE（红色），点击对应构建记录可查看详细信息

状态描述：

- SUCCESS：构建部署成功
- UNSTABLE：构建成功，但是部署过程出错
- FAILURE：构建过程就已经出错

构建记录：

- 状态集：执行构建用户、当前构建记录的 git 分支以及提交记录
- 变更记录：当前构建记录 git 提交记录详细信息
- 控制台输出：构建部署执行过程命令执行的记录（可以在这里查看构建失败原因以及调试构建过程的问题）
- 编辑编译信息：设置当前构建记录的名称和备注
- 删除构建
- 参数：显示构建部署过程中自定义参数

## 四、 Jenkins部署微前端多个包完整配置

### 需要安装的插件

- `Extended Choice Parameter` 插件，该插件可以使用多选框 ![](http://img-repo.poetries.top/images/20211117095347.png)

- Git plugin 

  - GIT 仓库管理插件，用于同步 git 库，通过该插件 jenkins 任务可以在构建过程中获取配置好的 git 远程仓库代码，任务执行时代码会被拉取到`/var/lib/jenkins/workspace/{任务名称}`目录下

- Send build artifacts over SSH，使用该插件需要在`系统管理->插件管理`中安装，该插件主要功能为将构建好的部署包按照一定规则发送到部署服务器，并且在这之后可在部署服务器执行一定的 shell 操作。安装插件后还需要在`系统管理->系统配置->Publish over SSH`添加 SSH Services。

  ![](http://img-repo.poetries.top/images/20211117095208.png)

  

  在`系统管理->系统配置->Publish over SSH`添加![](http://img-repo.poetries.top/images/20211117095542.png)

  ### Jenkins完整配置搭建

  **效果演示**

  ![](http://img-repo.poetries.top/images/20211117092944.png)
  ![](http://img-repo.poetries.top/images/20211117093241.png)

  **配置流程**

  ![](http://img-repo.poetries.top/images/20211117085757.png)

  ![](http://img-repo.poetries.top/images/20211117090018.png)
  ![](http://img-repo.poetries.top/images/20211117091728.png)
  ![](http://img-repo.poetries.top/images/20211117091930.png)
  ![](http://img-repo.poetries.top/images/20211117092045.png)

  构建的shell代码

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
        theninsta
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

  ![](http://img-repo.poetries.top/images/20211117092331.png)

  构建后操作shell代码

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

  > 最后配置一下Nginx指向`/home/docker/nginx/html/web-test`部署目录即可访问

## 五、使用阿里云OSS部署微前端项目

  介绍阿里云对象存储部署步骤。

  ### 一、创建 Bucket 存储桶

  ### 1. 进入对象存储 OSS 服务

  https://oss.console.aliyun.com/

  ### 2. 创建 Bucket 存储桶

  - Bucket 名称：xxx
  - 地域：华南 1（深圳）
  - 版本控制：不开通
  - 读写权限：公共读
  - 其他保持默认

  ### 二、添加 CDN 域名

  ### 1. 进入 CDN 服务

  https://cdn.console.aliyun.com/

  ### 2. 添加 CDN 域名

  路径：CDN > 域名管理 > 添加域名

  - 加速域名：xxx.test.com
  - 资源分组：会员商城
  - 新增源站信息
    - 源站信息：OSS 域名
    - 域名：xxx.oss-cn-shenzhen.aliyuncs.com
    - 其他保持默认
  - 其他保持默认

  ### 3. HTTPS 配置

  路径：CDN > 域名管理 > 找到域名

  路径：CDN > 域名管理 > 域名名称 > HTTPS 配置 > HTTPS 证书 > 修改配置

  - HTTPS 安全加速：开启
  - 证书来源：云盾（SSL）证书中心
  - 证书名称：test.com
  - 其他保持默认

  ### 4. 得到 CNAME 域名

  路径：CDN > 域名管理 > 找到域名

  - CNAME：xxx.test.com.w.kunlunpi.com

  ### 三、添加 CNAME 记录

  ### 1. 进入云解析 DNS 服务

  https://dns.console.aliyun.com/

  ### 2. 添加 CNAME 记录

  路径：云解析 DNS > 域名解析 > 找到域名

  路径：云解析 DNS > 域名解析 > 解析设置 > 添加记录

  - 记录类型：CNAME
  - 主机记录：xxx.test.com
  - 记录值：xxx.test.com.w.kunlunpi.com
  - 其他保持默认

  ### 四、设置存储桶

  ### 1. 缓存设置

  路径：对象存储 > Bucket 列表 > 找到存储桶

  路径：对象存储 > 存储桶名称 > 文件管理 > 找到 index.html 文件 > 更多 > 设置 HTTP 头

  - Cache-Control：no-cache（Object 允许被缓存在客户端或代理服务器的浏览器中，但每次访问时需要向 OSS 验证缓存是否可用。缓存可用时直接访问缓存，缓存不可用时重新向 OSS 请求。）
  - Cache-Control：no-store（不允许缓存 Object）
  - Expires：-1
  - 其他保持默认

  ### 2. 设置静态页面

  路径：对象存储 > 基础设置 > 静态页面

  - 默认首页：index.html
  - 子目录首页：未开通
  - 默认 404 页：index.html

  ### 1. 域名管理

  路径：对象存储 > 传输管理 > 域名管理 > 绑定域名

  - 域名：xxx.test.com
  - 其他保持默认

  ### 五、上传代码至存储桶

  ### 1. 下载 oss browser 工具

  https://help.aliyun.com/document_detail/209974.html

![](http://img-repo.poetries.top/images/20211117102935.png)
