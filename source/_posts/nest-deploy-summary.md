---
title: docker-compose/微信云托管/serverless之部署Nestjs项目
date: 2022-06-17 22:40:24
tags: 
  - 部署
  - Nest
categories: Front-End
---

## 一、云服务器docker-compose部署

### 安装docker环境

#### 安装工具包

```
yum install yum-utils device-mapper-persistent-data lvm2 -y
```

![](https://s.poetries.work/uploads/2022/06/e0f4f8f2621b11c0.png)

#### 设置阿里镜像源

```
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

![](https://s.poetries.work/uploads/2022/06/0b017f9a76914c6e.png)

#### 安装docker

```
yum install docker-ce docker-ce-cli containerd.io -y
```

#### 启动docker

```
systemctl start docker

# 设为开机启动
systemctl enable docker
```

#### 设置docker镜像源

```
vi /etc/docker/daemon.json
```

```json
{
  "registry-mirrors": [
    "https://register.docker-cn.com/"
  ],
}
```

后续拉取镜像直接从 https://hub.docker.com 网站拉取速度更快

**重启docker**

```
systemctl restart docker
```

#### 安装mysql镜像测试

```
docker pull daocloud.io/library/mysql:8.0.20
```

![](https://s.poetries.work/uploads/2022/06/dad88a1878a7a12f.png)

**运行mysql镜像**

```
docker run -d -p 3307:3306 --name mysql -e MYSQL_ROOT_PASSWORD=123456(设置登录密码) be0dbf01a0f3(镜像ID)
```

![](https://s.poetries.work/uploads/2022/06/fb606d9823c4f0ff.png)

**进入mysql容器内部**

![](https://s.poetries.work/uploads/2022/06/3a9f7618e1baf34f.png)

> 至此mysql镜像搭建成功，下面我们使用`docker-compose`来管理docker容器，不在单独一个个安装MySQL、redis、nginx


### 安装docker-compose

```
# 使用国内源安装
curl -L https://get.daocloud.io/docker/compose/releases/download/1.22.0/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose
```

**设置docker-compose执行权限**

```
chmod +x /usr/local/bin/docker-compose
```

**创建软链**

```
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```

**测试是否安装成功：**

```
$ docker-compose --version

docker-compose version 1.22.0, build f46880fe
```

### 编写docker-compose

```yml
version: "3.0"

services: 
    # docker容器启动的redis默认是没有redis.conf的配置文件，所以用docker启动redis之前，需要先去官网下载redis.conf的配置文件
    redis: # 服务名称
        container_name: redis # 容器名称
        image: daocloud.io/library/redis:6.0.3-alpine3.11 # 使用官方镜像
        # 配置redis.conf方式启动
        command: redis-server /usr/local/etc/redis/redis.conf --requirepass 123456 --appendonly yes # 设置redis登录密码 123456、--appendonly yes：这个命令是用于开启redis数据持久化
        # 无需配置文件方式启动
        # command: redis-server --requirepass 123456 --appendonly yes # 设置redis登录密码 123456
        ports:
            - 6380:6379 # 本机端口:容器端口
        restart: on-failure # 自动重启
        volumes:
            - ./deploy/redis/db:/data # 把持久化数据挂载到宿主机
            - ./deploy/redis/conf/redis.conf:/usr/local/etc/redis/redis.conf  # 把redis的配置文件挂载到宿主机
            - ./deploy/redis/logs:/logs # 用来存放日志
        environment:
            - TZ=Asia/Shanghai  # 解决容器 时区的问题
        networks:
            - my-server

    mysql:
        container_name: mysql
        image: daocloud.io/library/mysql:8.0.20 # 使用官方镜像
        ports: 
            - 3307:3306 # 本机端口:容器端口
        restart: on-failure
        environment: 
            - MYSQL_ROOT_PASSWORD=993412 # root用户密码
        volumes:
            - ./deploy/mysql/db:/var/lib/mysql # 用来存放了数据库表文件
            - ./deploy/mysql/conf/my.cnf:/etc/my.cnf # 存放自定义的配置文件
            # 我们在启动MySQL容器时自动创建我们需要的数据库和表
            # mysql官方镜像中提供了容器启动时自动docker-entrypoint-initdb.d下的脚本的功能
            - ./deploy/mysql/init:/docker-entrypoint-initdb.d/ # 存放初始化的脚本
        networks: 
            - my-server

    server: # egg服务
        container_name: server
        build: # 根据Dockerfile构建镜像
            context: .
            dockerfile: Dockerfile
        ports: 
            - 9000:9000
        restart: on-failure # 设置自动重启，这一步必须设置，主要是存在mysql还没有启动完成就启动了node服务
        networks: 
            - my-server
        depends_on: # node服务依赖于mysql和redis
            - redis
            - mysql

# 声明一下网桥  my-server。
# 重要：将所有服务都挂载在同一网桥即可通过容器名来互相通信了
# 如egg连接mysql和redis，可以通过容器名来互相通信
networks:
    my-server:
```

### nestjs/Dockerfile

```yml
FROM daocloud.io/library/node:14.7.0

# 设置时区
ENV TZ=Asia/Shanghai \
    DEBIAN_FRONTEND=noninteractive
RUN ln -fs /usr/share/zoneinfo/${TZ} /etc/localtime && echo ${TZ} > /etc/timezone && dpkg-reconfigure --frontend noninteractive tzdata && rm -rf /var/lib/apt/lists/*

# 创建工作目录
RUN mkdir -p /app

# 指定工作目录
WORKDIR /app

# 复制当前代码到/app工作目录
COPY . ./

# npm 源，选用国内镜像源以提高下载速度
# RUN npm config set registry https://registry.npm.taobao.org/

# npm 安装依赖
RUN npm install 
# 打包
RUN npm run build

# 启动服务
# "start:prod": "cross-env NODE_ENV=production node ./dist/src/main.js",
CMD npm run start:prod

EXPOSE 9000
```

### 修改代码

![](https://s.poetries.work/uploads/2022/06/2827b63a2e6f0f0d.png)
![](https://s.poetries.work/uploads/2022/06/1c61fcd0896b6cf7.png)

### 开放云服务器端口

> 开放端口9000、6380、3307

### 启动项目


> `docker-compose -h` 查看命令

- `docker-compose up` 启动服务，控制台可见日志
- `docker-compose up -d` 后台启动服务
- `docker-compose build --no-cache` 重新构建镜像不使用缓存(最后`docker-compose up -d`启动)
- 停止服务 `docker-compose down`
- 下载镜像过程 `docker-compose pull`
- 重启服务 `docker-compose restart`

后台启动服务 `docker-compose up -d`


![](https://s.poetries.work/uploads/2022/06/c25e29446892db10.png)
![](https://s.poetries.work/uploads/2022/06/256b13bf9feaaf58.png)

**测试**

![](https://s.poetries.work/uploads/2022/06/9cdd8f0acb5d3dcb.png)
![](https://s.poetries.work/uploads/2022/06/3dc4c4f36e6312e1.png)
![](https://s.poetries.work/uploads/2022/06/5f5872e59b2223d1.png)

## 二、微信云托管部署

> 云托管流水线部署更方便

### redis服务

这里我们上面部署使用的自建服务器上docker搭建的redis服务作为演示

![](https://s.poetries.work/uploads/2022/06/c74e6e89043a20d6.png)

### mysql服务

这里我们上面部署使用的自建服务器上docker搭建的mysql服务作为演示

![](https://s.poetries.work/uploads/2022/06/1e17df55d9c3634f.png)


### 修改代码

![](https://s.poetries.work/uploads/2022/06/39bc4b170e313188.png)
![](https://s.poetries.work/uploads/2022/06/a9b9c54861994788.png)

然后上传代码到github，通过云托管流水线构建

### 新建服务

![](https://s.poetries.work/uploads/2022/06/d867bed19eb7d9ed.png)

![](https://s.poetries.work/uploads/2022/06/a94985c89c5a77d0.png)

点击发布后，云托管会执行Dockerfile构建流水线，到日志可以查看构建进度

![](https://s.poetries.work/uploads/2022/06/28c702aebeea51f1.png)
![](https://s.poetries.work/uploads/2022/06/e381ee973e6b0128.png)

**微信云托管部署成功后，可以在实例列表，点击进入容器看到代码**，这里里面的内容不能修改，在容器启动后会覆盖

![](https://s.poetries.work/uploads/2022/06/f29ea9c2ac74fac7.png)
![](https://s.poetries.work/uploads/2022/06/a4a8d047a18b8846.png)

### 调试接口

![](https://s.poetries.work/uploads/2022/06/c4c5c0161d3a9b2b.png)
![](https://s.poetries.work/uploads/2022/06/71e72ba06d6335db.png)

测试redis

![](https://s.poetries.work/uploads/2022/06/e6aed26d47dea7f0.png)
![](https://s.poetries.work/uploads/2022/06/08a1d6894d2178ab.png)

## 三、腾讯云serverless部署

需要注意，云函数的代码包不能超过500M

![](https://s.poetries.work/uploads/2022/06/41b9fcbf9242921f.png)

### 模板部署 -- 部署 Nest.js 示例代码

1. 登录 [Serverless 应用控制台](https://console.cloud.tencent.com/sls)。
2. 单击新建应用，选择Web 应用>Nest.js 框架，如下图所示：

![](https://s.poetries.work/uploads/2022/06/c05fcae4ea2a8593.png)

3. 单击“下一步”，完成基础配置选择

![](https://s.poetries.work/uploads/2022/06/c23d3219be7ab860.png)

- 上传方式，选择示例代码直接部署，单击完成，即可开始应用的部署。
- 部署完成后，您可在应用详情页面，查看示例应用的基本信息，并通过 API 网关生成的访问路径 URL 进行访问，查看您部署的 Nest.js 项目

![](https://s.poetries.work/uploads/2022/06/60f6e95248310f40.png)

### 自定义部署nest

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


> 单个函数代码体积 500mb 的上限。在实际操作中，云函数虽然提供了 500mb

![](https://s.poetries.work/uploads/2022/06/d74ceea7780a3f9d.png)

**关于绕过配额问题：**

如果超的不多，那么使用 `npm install --production` 就能解决问题

