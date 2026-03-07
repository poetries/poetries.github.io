---
title: Jenkins自动部署前端项目
date: 2020-01-15 20:10:43
tags: 
   - Jenkins
   - CI
categories: CI
---

## 一、前言

### 1.1 传统网站部署的流程

> 传统的网站部署，大家在运维过程中，网站部署是运维的工作之一，网站部署的流程大致分为：需求分析—原型设计—开发代码—提交测试—内网部署—确认上线—备份数据—外网更新-最终测试，如果发现外网部署的代码有异常，需要及时回滚。（如下图所示）

![](https://poetries1.gitee.io/img-repo/2020/01/1.png)

### 1.2 目前主流网站部署的流程

> 目前主流网站部署方法，通过Jenkins工具平台实现全自动部署+测试，是一个可扩展的持续集成引擎，是一个开源软件项目，旨在提供一个开放易用的软件平台，使软件的持续集成变成可能。Jenkins非常易于安装和配置，简单易用

**简单来说方便如下人员：**

- 开发人员：写好代码，不需要自己进行源码编译、打包等工作，直接将代码分支存放在SVN、GIT仓库即可。
- 运维人员：减轻人工干预的错误率，同时解放运维人员繁杂的上传代码、手动备份、更新。
- 测试人员：可以通过`jenkins`进行简单的代码及网站测试。

![](https://poetries1.gitee.io/img-repo/2020/01/2.png)

### 1.3 Jenkins持续集成简介

- 持续集成(Continuous Integration)是一种软件开发实践，对于提高软件开发效率并保障软件开发质量提供了理论基础。Jenkins 是一个开源软件项目，旨在提供一个开放易用的软件平台，使持续集成变成可能。本文正是从持续集成的基本概念入手，通过具体实例，介绍了如何基于 Jenkins 快速搭建持续集成环境
- Jenkins是一个可扩展的持续集成引擎，是一个开源软件项目，旨在提供一个开放易用的软件平台，使软件的持续集成变成可能。Jenkins非常易于安装和配置，简单易用

### 1.4 持续集成意义

- 持续集成中的任何一个环节都是自动完成的，无需太多的人工干预，有利于减少重复过程以节省时间、费用和工作量
- 持续集成保障了每个时间点上团队成员提交的代码是能成功集成的。换言之，任何时间点都能第一时间发现软件的集成问题，使任意时间发布可部署的软件成为了可能
- 持续集成还能利于软件本身的发展趋势，这点在需求不明确或是频繁性变更的情景中尤其重要，持续集成的质量能帮助团队进行有效决策，同时建立团队对开发产品的信心

### 1.5 持续集成组件

- 一个自动构建过程，包括自动编译、分发、部署和测试；
- 一个代码存储库，即需要版本控制软件来保障代码的可维护性，同时作为构建过程的素材库，例如SVN、GIT代码库；
- 一个jenkins持续集成服务器(123.57.11.203服务器就是一个配置简单和使用方便的持续集成服务器)

## 二、环境搭建

### 2.1 Jenkins安装部署

- 地址http://mirrors.jenkins-ci.org/下载适合的Jenkins版本

> 由于`Jenkins`属于一个`JAVA` 代码，需要java容器才能运行jenkins，所以需要安装JDK+Tomcat

**这里我们以RPM方式部署jenkins**

> 下载对应的`RPM`包 https://pkg.jenkins.io/redhat-stable/

```
rpm -ih jenkins-2.7.4-1.1.noarch.rpm
```

**jenkins 常用命令**

```
service jenkins start/stop/restart

chkconfig jenkins on
```

**jenkins的目录结构**

```
/usr/lib/jenkins/jenkins.war     #WAR包 

/etc/sysconfig/jenkins       　　 #配置文件

/var/lib/jenkins/        　　　　   #默认的JENKINS_HOME目录

/var/log/jenkins/jenkins.log      #Jenkins日志文件
```

**启动jenkins**

```
service jenkins start
```

**修改jenkins端口**


```
vim /etc/sysconfig/jenkins

JENKINS_PORT="8888"
```

**防火墙开启8888端口**

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

再次启动jenkins：

```
[root@localhost modules]# service jenkins start
```

> 打开地址 127.0.0.1:8888

![](https://poetries1.gitee.io/img-repo/2020/01/3.png)

出现此提示说明，启动成功！因为是第一次安装，所以得输入默认密码，默认密码在红框标注的位置。

查看默认密码将密码粘贴到文本框中：

```
[root@localhost secrets]# cat /var/lib/jenkins/secrets/initialAdminPassword

97c675381d524414ba11e61c4f4b7ef0
```

**安装插件**

![](https://poetries1.gitee.io/img-repo/2020/01/4.png)

![](https://poetries1.gitee.io/img-repo/2020/01/5.png)


### 2.2 基础环境配置

#### 2.2.1 插件安装

![](https://poetries1.gitee.io/img-repo/2020/01/6.png)

> 安装Publish Over SSH用于执行构建后的操作

![](https://poetries1.gitee.io/img-repo/2020/01/7.png)

> 安装nodejs环境

![](https://poetries1.gitee.io/img-repo/2020/01/8.png)

#### 2.2.2 配置信息

**配置git命令**

> whereis git

![](https://poetries1.gitee.io/img-repo/2020/01/9.png)

**配置node信息**

![](https://poetries1.gitee.io/img-repo/2020/01/10.png)

**配置git账户及ssh用户信息**

![](https://poetries1.gitee.io/img-repo/2020/01/11.png)
![](https://poetries1.gitee.io/img-repo/2020/01/12.png)
![](https://poetries1.gitee.io/img-repo/2020/01/13.png)

### 2.3 创建项目

![](https://poetries1.gitee.io/img-repo/2020/01/14.png)
![](https://poetries1.gitee.io/img-repo/2020/01/15.png)
![](https://poetries1.gitee.io/img-repo/2020/01/16.png)
![](https://poetries1.gitee.io/img-repo/2020/01/17.png)
![](https://poetries1.gitee.io/img-repo/2020/01/18.png)
![](https://poetries1.gitee.io/img-repo/2020/01/19.png)
![](https://poetries1.gitee.io/img-repo/2020/01/20.png)

### 2.4 git提交自动触发构建

> 根据下面填写地址，以`bitbucket git`仓库配置为例子

![](https://poetries1.gitee.io/img-repo/2020/01/17.png)
![](https://poetries1.gitee.io/img-repo/2020/01/21.png)
![](https://poetries1.gitee.io/img-repo/2020/01/22.png)

> 这样提交git代码触发`git hooks`操作去请求 `http://192.168.1.43:8991/job/test/build?token=cxk`启动`jenkins`任务，以达成自动部署任务
