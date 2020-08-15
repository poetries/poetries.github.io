---
title: 构建部署easy-mock服务
date: 2019-10-01 11:40:43
tags: Mock
categories: Front-End
---

> https://easy-mock.com 官网经常挂，影响了开发效率，在本地部署开发更高效

## 一、easy-mock部署步骤

- 安装 `node（>=v8.9`） & `MongoDB（>=v3.4） & Redis（>=v4.0）`
- 安装 `easy-mock`，更改配置文件
- 启动 `easy-mock`，测试项目是否可以正常启动，能的话就可以先 Ctrl + C了
- 启动 `MongoDB` 和 Redis`
- npm run build`，然后用 `PM2` 启动 `app.js`


## 二、MongoDB和Redis环境搭建

### 2.1 安装redis

> Redis安装教程：http://www.runoob.com/redis/redis-install.html

**Mac环境下安装Redis**

> 首先去官网下载redis https://redis.io/

**安装与编译**

- 先找到`usr/local`目录，也可以直接命令行完成，建议`windows`可以这样操作，自己`mac`系统直接命令行出现了错误，找不到改目录，于是手动移动安装目录。
- 主要分为两步，先是打开访达，`command+shift+G`跳转目录

![](https://poetries1.gitee.io/img-repo/20191001/1.png)

- 编译安装 `sudo make install`


**启动redis客户端**

> 执行`redis-cli`发现没有连接上

![](https://poetries1.gitee.io/img-repo/20191001/2.png)

> 修改默认配置文件 `$ vi /usr/local/etc/redis.conf`

- 在安装好`redis`扩展 尝试连接`redis`时，客户端打不开，原因是需要先开启服务端，这需要先配置
- 找到`redis.conf` 并修改 `daemonize no` 为 `daemonize yes` ，这样就可以默认启动就后台运行

![](https://poetries1.gitee.io/img-repo/20191001/3.png)

**开启客户端要确保服务端启动**

![](https://poetries1.gitee.io/img-repo/20191001/4.png)

> 再次执行 `redis-cli`启动客户端

**easy-mock环境配置，这里只需要启动服务端即可**

### 2.2 安装MongoDB

> MongoDB安装教程：https://www.cnblogs.com/weixuqin/p/7258000.html

**Mac上MongoDB安装：**

```
brew install mongodb
```

**MongoDB装完要启动服务**

```
brew services start mongodb
```

> 这时候浏览器中访问`127.0.0.1:27017`应该就已经有内容了

## 三、总体部署流程

> git clone https://github.com/easy-mock/easy-mock.git

```bash
yarn install

# 打包部署需要的文件
yarn build
```

**1、启动redis服务**

![](https://poetries1.gitee.io/img-repo/20191001/4.png)

**2、启动MongoDB服务**

```
brew services start mongodb
```

**3、npm run build**

> 执行build 打包文件

**4、pm2守护进程**

![](https://poetries1.gitee.io/img-repo/20191001/5.png)

![](https://poetries1.gitee.io/img-repo/20191001/6.png)

> 打开网址 http://127.0.0.1:7300/

![](https://poetries1.gitee.io/img-repo/20191001/7.png)

## 四、Easy Mock 线上项目迁移

> 参考 https://github.com/easy-mock/migrate2local?tdsourcetag=s_pctim_aiomsg
