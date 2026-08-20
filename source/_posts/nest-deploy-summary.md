---
title: docker-compose/微信云托管/serverless之部署Nestjs项目
description: 同一个 Nestjs 项目分别用云服务器 docker-compose、微信云托管流水线和腾讯云 serverless 三种方式部署，含 docker 环境安装、MySQL/Redis 编排、Dockerfile 写法、scf_bootstrap 配置和代码包 500M 超限的处理。
date: 2022-06-17 22:40:24
tags:
  - 部署
  - Nest
  - Docker
categories: Front-End
---

同一个 Nestjs 服务，我先后用三种方式部署过。最早是买台云服务器自己装 docker，用 `docker-compose` 把 MySQL、Redis 和 Node 服务编排在一起；后来做小程序后端，改成微信云托管，推代码就自动走流水线；再后来有个访问量很低的接口服务，直接扔到腾讯云 serverless 上，不跑就不花钱。

这三条路的取舍点完全不一样。自建服务器最灵活但要自己管运维，云托管省心但绑死微信生态，serverless 便宜但有代码包体积和冷启动的硬约束。

这篇把三种方式从头到尾各走一遍，中间穿插当时卡住我的地方。看完你应该能判断自己的项目该走哪条，以及每条路上会踩到什么。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- CentOS 上装 docker 和 docker-compose 的完整命令，以及镜像源为什么必须配
- 用一份 `docker-compose.yml` 同时拉起 MySQL、Redis 和 Nest 服务
- `depends_on` 为什么保证不了「数据库就绪再启动服务」，`restart` 才是兜底
- Nestjs 项目的 Dockerfile 该怎么写，时区那几行为什么不能省
- 微信云托管的流水线部署流程，以及容器内改代码为什么无效
- 腾讯云 serverless 部署 Nest 的两种方式，模板和自定义
- `scf_bootstrap` 是什么，为什么要 `chmod 777`
- 云函数代码包 500M 上限怎么处理

## 一、云服务器上用 docker-compose 部署

先说最传统的那条路。买台云服务器，自己装 docker，用 compose 把几个服务编排起来。这条路的好处是所有东西都在你手上，想装什么装什么；代价是从装 docker 开始的每一步都得自己来。

### 装 docker 环境

第一步装依赖工具包。`yum-utils` 提供了 `yum-config-manager` 命令，后面加镜像源要用；`device-mapper-persistent-data` 和 `lvm2` 是 docker 存储驱动需要的。

```
yum install yum-utils device-mapper-persistent-data lvm2 -y
```

![yum 安装 docker 依赖工具包的输出](https://s.poetries.top/uploads/2022/06/e0f4f8f2621b11c0.png)

看到一堆 `Installed` 或者 `already installed` 就算过了。这一步基本不会出问题，真出问题一般是 yum 源本身有问题，先 `yum makecache` 一下。

接着换软件源。docker 官方源在国内拉取很慢，换成阿里的镜像。

```
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

![添加阿里云 docker-ce 软件源](https://s.poetries.top/uploads/2022/06/0b017f9a76914c6e.png)

命令执行完会在 `/etc/yum.repos.d/` 下多一个 `docker-ce.repo` 文件。这里配的是**软件源**，管的是 docker 这个程序本身的下载速度，跟后面配的镜像加速是两回事，别搞混了。

然后装 docker 本体。

```
yum install docker-ce docker-ce-cli containerd.io -y
```

这三个包分别是 docker 守护进程、命令行客户端和容器运行时。装完还没跑起来，要手动启动。

```
systemctl start docker

# 设为开机启动
systemctl enable docker
```

`systemctl enable` 那行别省。服务器重启之后 docker 不自动起来，你的服务就全没了，这种事发生在半夜运维重启机器的时候特别难受。

### 配镜像加速

这一步管的是拉镜像的速度。

```
vi /etc/docker/daemon.json
```

```json
{
  "registry-mirrors": ["https://register.docker-cn.com/"]
}
```

后续拉取镜像直接从 https://hub.docker.com 网站拉取速度更快

**重启docker**

```
systemctl restart docker
```

这里有个坑要注意。`register.docker-cn.com` 这个官方中国区镜像早就停了，现在填它是无效的，`docker pull` 该慢还是慢，而且不会报错，让人以为配好了。现在能用的加速地址变动比较频繁，我的做法是去阿里云容器镜像服务控制台，它会给你一个专属的加速地址，填那个最稳。配完之后用 `docker info` 看一眼，输出里的 `Registry Mirrors` 那一段能确认有没有生效。

### 先拉个 MySQL 试试

环境装完先验证一下，别等到编排整套服务的时候才发现 docker 有问题。

```
docker pull daocloud.io/library/mysql:8.0.20
```

![docker pull 拉取 mysql 8.0.20 镜像](https://s.poetries.top/uploads/2022/06/dad88a1878a7a12f.png)

一层一层的 `Pull complete` 就是 docker 的分层镜像在下载。这里用的是 daocloud 的镜像仓库地址，好处是不用配加速也能拉，坏处是它不一定同步了最新的 tag。

**运行mysql镜像**

```
docker run -d -p 3307:3306 --name mysql -e MYSQL_ROOT_PASSWORD=123456(设置登录密码) be0dbf01a0f3(镜像ID)
```

![docker run 启动 mysql 容器](https://s.poetries.top/uploads/2022/06/fb606d9823c4f0ff.png)

命令里那两个括号是注释说明，实际敲的时候要去掉。`-p 3307:3306` 是宿主机 3307 映射到容器 3306，这里故意错开是因为服务器上可能已经装了 MySQL 占着 3306。`-e MYSQL_ROOT_PASSWORD` 是 MySQL 官方镜像约定的环境变量，不传这个容器起不来。

跑完 `docker ps` 能看到容器在 `Up` 状态就对了。如果是 `Exited`，用 `docker logs mysql` 看原因，八成是密码环境变量没传或者端口被占。

**进入mysql容器内部**

![进入 mysql 容器执行 mysql 命令行](https://s.poetries.top/uploads/2022/06/3a9f7618e1baf34f.png)

进容器用 `docker exec -it mysql bash`，然后 `mysql -uroot -p` 输密码。能进到 `mysql>` 提示符就说明整条链路都通了。

> 至此mysql镜像搭建成功，下面我们使用`docker-compose`来管理docker容器，不在单独一个个安装MySQL、redis、nginx

### 装 docker-compose

一个个 `docker run` 的问题在于，参数记不住、顺序要靠人保证、容器之间怎么互相访问还得单独配网络。compose 把这些都写进一个 yml 文件里。

```
# 使用国内源安装
curl -L https://get.daocloud.io/docker/compose/releases/download/1.22.0/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose
```

`uname -s` 和 `uname -m` 会被展开成系统名和架构，比如 `Linux` 和 `x86_64`，拼出来正好是对应平台的二进制文件名。

**设置docker-compose执行权限**

```
chmod +x /usr/local/bin/docker-compose
```

下下来的是个二进制文件，默认没有执行权限，不加这一步敲命令会报 `Permission denied`。

**创建软链**

```
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```

有些系统的 `PATH` 里没有 `/usr/local/bin`，软链到 `/usr/bin` 保证哪个用户都能直接敲。

**测试是否安装成功：**

```
$ docker-compose --version

docker-compose version 1.22.0, build f46880fe
```

能打出版本号就装好了。这里补一句时效性的话，`docker-compose` 独立二进制这个形态属于 v1，后来 docker 把它做成了插件，命令变成 `docker compose`（中间是空格）。新装的机器上两种都可能有，行为基本一致但配置文件的兼容性有细微差别。这篇里的写法是 v1 的。

### 编排文件怎么写

这份 yml 是整节的核心，一次拉起三个服务。

```yml
version: '3.0'

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
      - ./deploy/redis/conf/redis.conf:/usr/local/etc/redis/redis.conf # 把redis的配置文件挂载到宿主机
      - ./deploy/redis/logs:/logs # 用来存放日志
    environment:
      - TZ=Asia/Shanghai # 解决容器 时区的问题
    networks:
      - my-server
```

Redis 这一段有两个地方值得单独说。

`volumes` 里的三条挂载，第一条是数据目录。容器被删除时里面的文件会一起消失，Redis 开了 `appendonly` 做持久化，如果不把 `/data` 挂出来，重新部署一次数据就没了。这是最容易踩的坑，本地测的时候感觉不到，因为你不会频繁删容器。

第二条挂的是配置文件。Redis 官方镜像里确实不带 `redis.conf`，`command` 里指定了配置文件路径的话，宿主机上对应位置必须真有这个文件，否则容器启动就报错退出。嫌麻烦的话用注释掉的那种写法，不要配置文件，直接命令行传参数。

`TZ=Asia/Shanghai` 这个环境变量解决的是容器内时区。不配的话容器是 UTC 时间，Redis 的 key 过期时间、日志时间戳全都跟你想的差 8 小时。

接着是 MySQL 那段。

```yml
  mysql:
    container_name: mysql
    image: daocloud.io/library/mysql:8.0.20 # 使用官方镜像
    ports:
      - 3307:3306 # 本机端口:容器端口
    restart: on-failure
    environment:
      - MYSQL_ROOT_PASSWORD=123456 # root用户密码
    volumes:
      - ./deploy/mysql/db:/var/lib/mysql # 用来存放了数据库表文件
      - ./deploy/mysql/conf/my.cnf:/etc/my.cnf # 存放自定义的配置文件
      # 我们在启动MySQL容器时自动创建我们需要的数据库和表
      # mysql官方镜像中提供了容器启动时自动docker-entrypoint-initdb.d下的脚本的功能
      - ./deploy/mysql/init:/docker-entrypoint-initdb.d/ # 存放初始化的脚本
    networks:
      - my-server
```

`/docker-entrypoint-initdb.d/` 这个挂载点是 MySQL 官方镜像的一个约定，容器**首次**初始化数据目录时会自动执行这个目录下的 `.sql` 和 `.sh` 文件。建库建表的语句放这儿，新环境部署就不用手动导 SQL 了。

注意「首次」这两个字。只要 `/var/lib/mysql` 里已经有数据，这些脚本就会被跳过。所以你改了初始化脚本再重启容器是不生效的，得把挂载出来的 `./deploy/mysql/db` 目录清掉才行。这个我排查过挺久，一直以为是脚本语法有问题。

最后是 Nest 服务本身。

```yml
  server: # nest服务
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
# 如nest连接mysql和redis，可以通过容器名来互相通信
networks:
  my-server:
```

这一段里有两个点特别关键。

先说网桥。三个服务都挂在 `my-server` 这个自定义网络下，效果是它们之间可以**用服务名当主机名互相访问**。Nest 里连数据库的 host 就填 `mysql`，连 Redis 填 `redis`，不用填 IP，也不用填 `127.0.0.1`。这一点新手最容易错，在容器里填 `localhost` 指的是容器自己，连不上隔壁容器的数据库。

再说 `depends_on` 和 `restart` 的关系。注释里那句「主要是存在 mysql 还没有启动完成就启动了 node 服务」说到了点子上，但需要补充完整。`depends_on` 只保证**启动顺序**，它等的是容器进入运行状态，不是等 MySQL 真正可以接受连接。MySQL 容器起来之后还要初始化好几秒甚至几十秒，这段时间里 Nest 已经在尝试连接了，连不上就崩。

`restart: on-failure` 就是拿来兜这个的。Nest 崩了，docker 把它重启，再试一次，直到 MySQL 准备好为止。听起来有点糙，但确实是最省事的做法。想做得干净点可以在容器启动脚本里加个等待循环，或者用 healthcheck 配合 `depends_on` 的 condition 写法，那是 compose 文件格式 2.1 以上才支持的。

### Nestjs 的 Dockerfile

```dockerfile
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

时区那两行，`DEBIAN_FRONTEND=noninteractive` 是为了让 `dpkg-reconfigure` 不弹交互式菜单，不加这个构建会卡在选时区的界面上出不来。`rm -rf /var/lib/apt/lists/*` 是清缓存减小镜像体积，属于顺手做的优化。

`COPY . ./` 这一行把整个项目目录复制进去，简单但不高效。更好的写法是先 `COPY package*.json ./`，`npm install` 之后再 `COPY . ./`，这样只要依赖没变，`npm install` 那一层就能命中 docker 的层缓存，改一行业务代码不用重装依赖。原文这么写构建每次都要重新装一遍依赖，项目大了会很慢。

被注释掉的 taobao 源那行提一句，`registry.npm.taobao.org` 这个域名已经废弃了，现在是 `registry.npmmirror.com`。要开的话改成新地址。

`EXPOSE 9000` 只是声明，真正让端口能被外部访问的是 compose 里的 `ports` 映射。两个都要有，但作用不同，`EXPOSE` 更像是给读 Dockerfile 的人看的文档。

关于 Nest 项目本身的分层和模块组织，我在 [Nestjs 学习总结](https://feinterview.poetries.top/blog/nest-summary) 那篇里写得比较细，这里就不展开了。

### 改代码适配容器环境

![修改数据库连接配置的主机名](https://s.poetries.top/uploads/2022/06/2827b63a2e6f0f0d.png)
![修改 Redis 连接配置的主机名](https://s.poetries.top/uploads/2022/06/1c61fcd0896b6cf7.png)

这两张图改的是同一件事，把连接配置里的 host 从 `localhost` 改成容器名。上一节说过，同一个网桥下用服务名互访，MySQL 填 `mysql`，Redis 填 `redis`。

改完之后本地就跑不起来了，因为你本机上没有叫 `mysql` 的主机。所以正经做法是把这些配置抽成环境变量，本地一套值容器里一套值，别硬编码。

### 开放端口和启动

> 开放端口9000、6380、3307

这一步是在云服务器厂商的控制台上做的，安全组要放行这三个端口，光在服务器里开是不够的。很多人卡在「容器明明起来了但外网访问不了」，十有八九是安全组没放。

生产环境其实不建议把 3307 和 6380 暴露到公网，数据库和缓存只给容器内部访问就够了，compose 里连 `ports` 都可以不写，只挂同一个网桥。要远程连数据库的话走 SSH 隧道更安全。

> `docker-compose -h` 查看命令

- `docker-compose up` 启动服务，控制台可见日志
- `docker-compose up -d` 后台启动服务
- `docker-compose build --no-cache` 重新构建镜像不使用缓存(最后`docker-compose up -d`启动)
- 停止服务 `docker-compose down`
- 下载镜像过程 `docker-compose pull`
- 重启服务 `docker-compose restart`

这几条里最容易用错的是 `restart` 和 `up -d` 的区别。`restart` 只是重启现有容器，不会重新构建镜像，你改了代码敲 `restart` 是没用的。改了代码要走 `docker-compose up -d --build`，或者先 `build` 再 `up`。

`down` 会把容器和网络都删掉，加 `-v` 还会删数据卷，这条要小心，别在生产上手快。

后台启动服务 `docker-compose up -d`

![docker-compose up -d 启动全部服务](https://s.poetries.top/uploads/2022/06/c25e29446892db10.png)
![docker-compose ps 查看服务运行状态](https://s.poetries.top/uploads/2022/06/256b13bf9feaaf58.png)

第一张是启动过程，能看到 compose 按依赖顺序依次创建网络、创建容器。第二张是状态列表，三个服务都是 `Up` 就对了。

如果 server 那一行反复在 `Restarting`，就是前面说的 MySQL 还没就绪导致的连接失败在循环重试，等一会儿再看。等超过一分钟还在重启，用 `docker-compose logs server` 看具体报什么错。

**测试**

![接口返回正常数据](https://s.poetries.top/uploads/2022/06/9cdd8f0acb5d3dcb.png)
![数据库中的记录](https://s.poetries.top/uploads/2022/06/3dc4c4f36e6312e1.png)
![Redis 中的缓存数据](https://s.poetries.top/uploads/2022/06/5f5872e59b2223d1.png)

这三张图是一条完整的验证链路。先请求接口拿到数据，再进 MySQL 确认数据真的落库了，最后看 Redis 确认缓存也写进去了。

这个顺序建议照着走一遍。只看接口返回 200 是不够的，很多时候接口返回正常但缓存根本没连上，代码里 catch 住了异常静默降级，等到流量上来才发现每次都在打数据库。

## 二、微信云托管部署

> 云托管流水线部署更方便

第一条路走完你会发现，真正花时间的不是写代码，是装环境、配安全组、调 compose。如果你的服务本来就是给小程序或者公众号用的，微信云托管能把这些全省掉。

### 复用已有的 Redis 和 MySQL

这里我们上面部署使用的自建服务器上docker搭建的redis服务作为演示

![云托管中配置外部 Redis 连接](https://s.poetries.top/uploads/2022/06/c74e6e89043a20d6.png)

这里我们上面部署使用的自建服务器上docker搭建的mysql服务作为演示

![云托管中配置外部 MySQL 连接](https://s.poetries.top/uploads/2022/06/1e17df55d9c3634f.png)

这两张图是把上一节自建的那套数据库直接拿来用。这么做只是为了演示方便，正经项目不建议这样，云托管的容器访问外网数据库要走公网，延迟高而且数据库得暴露公网端口。云托管本身提供了 MySQL 服务，用它的话是内网直连，又快又不用开公网。

### 改代码

![修改数据库连接地址为公网 IP](https://s.poetries.top/uploads/2022/06/39bc4b170e313188.png)
![修改 Redis 连接地址为公网 IP](https://s.poetries.top/uploads/2022/06/a9b9c54861994788.png)

这两处改的是连接地址，从容器名换回服务器的公网 IP 和映射出来的端口。跟上一节的改动方向正好相反，原因就是现在数据库和服务不在同一个网络里了。

再强调一遍，这类配置一定要走环境变量。云托管的控制台里可以配环境变量，容器启动时注入，代码里读 `process.env` 就行，不要为了切环境去改代码再提交一次。

然后上传代码到github，通过云托管流水线构建

### 新建服务

![云托管控制台新建服务](https://s.poetries.top/uploads/2022/06/d867bed19eb7d9ed.png)

新建服务的时候要填服务名，这个名字后面小程序调用时的 `X-WX-SERVICE` 请求头要用到，得对上，随手起完记下来。

![配置服务的构建来源和版本信息](https://s.poetries.top/uploads/2022/06/a94985c89c5a77d0.png)

这一步选代码来源和 Dockerfile 路径。云托管的构建逻辑跟自建服务器一样，也是读你仓库里的 Dockerfile，所以上一节写的那份可以直接用，不用改。这也是云托管相对云函数的一个优势，迁移成本低，本地能用 docker 跑起来的东西基本就能上云托管。

点击发布后，云托管会执行Dockerfile构建流水线，到日志可以查看构建进度

![流水线构建过程的实时日志](https://s.poetries.top/uploads/2022/06/28c702aebeea51f1.png)
![构建完成后的版本列表](https://s.poetries.top/uploads/2022/06/e381ee973e6b0128.png)

第一张能看到构建日志在滚，就是 `docker build` 的输出。构建失败的话这里能直接看到是哪一层挂的，最常见的是 `npm install` 拉包超时，重试一次往往就好了。

第二张是版本列表。云托管的每次发布是一个新版本，旧版本还留着，出问题可以把流量切回去，这个能力在自建服务器上要自己搭才有。

**微信云托管部署成功后，可以在实例列表，点击进入容器看到代码**，这里里面的内容不能修改，在容器启动后会覆盖

![实例列表中进入容器](https://s.poetries.top/uploads/2022/06/f29ea9c2ac74fac7.png)
![容器内的项目文件结构](https://s.poetries.top/uploads/2022/06/a4a8d047a18b8846.png)

这两张图是进容器看文件。原文那句提醒很重要，我再解释一下为什么。

容器是无状态的，你在里面改了文件，只对当前这个实例有效。云托管会根据负载自动扩缩容，新拉起的实例是从镜像重新创建的，你改的东西不在镜像里，自然就没了。而且实例被回收重建的时候，改动同样消失。

所以进容器只有一个正当用途，看日志和排查现场。要改东西，改代码重新发布。

### 调试接口

![云托管控制台的接口调试面板](https://s.poetries.top/uploads/2022/06/c4c5c0161d3a9b2b.png)
![接口调试返回的结果](https://s.poetries.top/uploads/2022/06/71e72ba06d6335db.png)

云托管自带一个调试入口，能模拟小程序侧的请求打到你的服务上，请求头里会带上 `x-wx-openid` 这类微信信息。这一点比用 Postman 直接打公网地址有用，因为你能顺便验证微信链路的鉴权信息有没有正常传进来。

测试redis

![验证 Redis 读写是否正常](https://s.poetries.top/uploads/2022/06/e6aed26d47dea7f0.png)
![Redis 中查询到写入的数据](https://s.poetries.top/uploads/2022/06/08a1d6894d2178ab.png)

跟第一节一样的验证思路，接口通了之后回数据库确认数据真的写进去了。这里要特别验证一下，因为云托管连的是公网上的 Redis，网络路径比容器内互访长得多，超时和断连的概率高不少。

云托管这套东西的完整能力，包括本地 docker 调试、云调用免鉴权、CLI 工具这些，我单独写过一篇 [微信云托管入门与实践](https://feinterview.poetries.top/blog/wxcloud-intro)，想深入用的话看那篇。

顺带说一下界面的时效性。云托管控制台从 2022 年到现在改过好几版，新建服务的表单项、版本管理的位置、调试面板的入口都跟图里不完全一致了。操作的逻辑顺序没变，按「建服务、连代码源、发布、看日志、调接口」这个流程走，具体位置以实际界面为准。

## 三、腾讯云 serverless 部署

第三条路是云函数。它跟前两种最大的区别是没有常驻进程，请求来了才拉起实例，没请求就归零。适合访问量低、对首次响应延迟不敏感的服务。

需要注意，云函数的代码包不能超过500M

![云函数代码包体积限制说明](https://s.poetries.top/uploads/2022/06/41b9fcbf9242921f.png)

这个限制先放在最前面说，因为它是最容易让人半路卡住的地方。Node 项目的 `node_modules` 体积上去很快，一个中等规模的 Nest 项目装完依赖轻松几百兆。后面第四小节会说怎么处理。

### 模板部署

先走最简单的，用官方模板确认环境没问题。

1. 登录 [Serverless 应用控制台](https://console.cloud.tencent.com/sls)。
2. 单击新建应用，选择Web 应用>Nest.js 框架，如下图所示：

![在 Serverless 控制台选择 Nest.js 框架模板](https://s.poetries.top/uploads/2022/06/c05fcae4ea2a8593.png)

这里选的是「Web 应用」这个类型，不是普通的「函数」。两者的区别在于 Web 应用背后是 Web Function，它允许你直接跑一个监听端口的 HTTP 服务，而不用把代码改成云函数那种 `handler(event, context)` 的签名。这就是为什么 Nest 项目几乎不用改就能上。

3. 单击「下一步」，完成基础配置选择

![填写应用名称、地域和运行环境等基础配置](https://s.poetries.top/uploads/2022/06/c23d3219be7ab860.png)

这一步要选地域和运行时版本。运行时版本这里选的 Node 版本要跟你项目实际用的对上，下一节 `scf_bootstrap` 里写死的 node 路径就是跟这个版本绑定的，选错了启动脚本会找不到 node。

- 上传方式，选择示例代码直接部署，单击完成，即可开始应用的部署。
- 部署完成后，您可在应用详情页面，查看示例应用的基本信息，并通过 API 网关生成的访问路径 URL 进行访问，查看您部署的 Nest.js 项目

![部署完成后 API 网关生成的访问地址](https://s.poetries.top/uploads/2022/06/60f6e95248310f40.png)

这个 URL 是 API 网关自动生成的，形如一串随机字符加上腾讯云的域名。能打开就说明模板部署成功了。第一次访问会明显慢一点，那就是冷启动，刷新几次会快下来，闲置一段时间后又会变慢。

### 自定义部署自己的 Nest 项目

模板跑通了，换成自己的代码。

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

这两条改动的原因值得说清楚。

端口改 9000 是因为 Web Function 约定就监听这个端口，平台的流量转发写死了往 9000 打，你监听 3000 它找不到，表现是请求超时。

地址改 `0.0.0.0` 是因为 Nest 默认可能只绑 localhost，只绑本地回环的话，平台从容器外部转发进来的请求根本到不了你的进程。这个坑跟前面 Docker 那节里 `HOSTNAME` 的问题是同一类，容器化部署里反复出现。

1. 修改启动文件`main.ts`，监听端口改为`9000`:

![main.ts 中修改监听端口和地址](https://s.poetries.top/uploads/2022/06/12736ad9dda9b911.png)

图里改的就是 `app.listen()` 那一行。完整写法是 `await app.listen(9000, '0.0.0.0')`，第二个参数别漏。

2. 在项目根目录下新建 `scf_bootstrap` 启动文件，在该文件添加如下内容（用于启动服务）：

您也可以在控制台完成该模块配置。

![在控制台配置启动命令](https://s.poetries.top/uploads/2022/06/9a96d63935762fc3.png)

控制台里也能填启动命令，效果跟放文件是一样的。我更倾向放文件，因为它跟着代码进版本控制，换个人部署不会漏。

```bash
# scf_bootstrap
#!/bin/bash

SERVERLESS=1 /var/lang/node12/bin/node ./dist/main.js
```

这个脚本干的事就是启动编译后的 Nest 服务。

`/var/lang/node12/bin/node` 是运行时环境里 node 二进制的绝对路径，`node12` 对应的是 Node 12 运行时。这里跟上一步选的运行时版本必须对上，你在控制台选了 Node 16 却写 `node12`，启动直接失败。不确定路径的话可以先写成 `node ./dist/main.js` 试试，或者进控制台的在线编辑器里查一下。

`SERVERLESS=1` 是个环境变量标记，代码里可以据此判断当前跑在 serverless 环境，做一些差异化处理，比如跳过某些只在长驻进程里有意义的初始化。

`./dist/main.js` 这个路径要注意，跟你的 `tsconfig` 输出配置有关。Nest 默认编译产物在 `dist/main.js`，但如果 `rootDir` 设置不同，可能是 `dist/src/main.js`，写错了同样起不来。上传前本地 `npm run build` 一下，看清楚文件到底在哪。

新建完成后，还需执行以下命令修改文件可执行权限，默认需要 777 或 755 权限才可正常启动。示例如下：

```
chmod 777 scf_bootstrap
```

这一步经常被忽略，忘了改权限的报错信息不太直观，一般是启动超时而不是明确说权限不对。

顺带提醒，权限位是跟着文件走的，你在 Windows 上开发的话 Git 可能不会保留这个权限，push 上去再拉下来权限就没了。可以用 `git update-index --chmod=+x scf_bootstrap` 把可执行位提交进 Git。

本地配置完成后，执行启动文件，确保您的服务可以本地正常启动，接下来，登录 Serverless 应用控制台，选择Web 应用>Nest.js 框架，上传方式可以选择本地上传或代码仓库拉取

> 注意：启动文件以项目内文件为准，如果您的项目里已经包含 scf_bootstrap 文件，将不会覆盖该内容。

![选择本地上传或代码仓库拉取](https://s.poetries.top/uploads/2022/06/c1fe93fe050d5f5c.png)

两种上传方式各有适用场景。本地上传适合快速验证，缺点是每次改都要重新打包上传。代码仓库拉取能做到推代码自动部署，正经项目走这个。

想把这条链路做得更自动化的话，用 CI 构建好产物再推上去是更常见的做法，我在 [基于 GitHub Actions 构建 Docker 镜像部署到腾讯云私有仓库](https://feinterview.poetries.top/blog/github-actions-tencent-docker-registry) 里写过一套类似的流水线，思路可以借鉴。

### 代码包 500M 超限怎么办

> 单个函数代码体积 500mb 的上限。在实际操作中，云函数虽然提供了 500mb

![上传时提示代码包超出体积限制](https://s.poetries.top/uploads/2022/06/d74ceea7780a3f9d.png)

原文这句话没说完，我把意思补齐。云函数标称的代码包上限是 500MB，但这是解压后的总体积，上传时的压缩包还有单独的限制，实际能用的空间比标称值紧。Nest 项目一旦装了 TypeORM、GraphQL 这类大依赖，很容易顶到。

**关于绕过配额问题：**

如果超的不多，那么使用 `npm install --production` 就能解决问题

`--production` 的作用是跳过 `devDependencies`。TypeScript、各种 `@types` 包、ESLint、Jest 这些只在开发和构建时用得着，运行时完全不需要。Nest 项目里这部分往往占了一半以上的体积，砍掉之后经常就够了。

前提是你得先在本地或者 CI 里把 `npm run build` 跑完，把 `dist` 目录一起打包上传，因为线上没有 TypeScript 编译器了。

超得比较多的话还有几个方向。把不常用的大依赖换成更轻的替代品；用打包工具把代码和依赖 bundle 成单文件，能砍掉大量 `node_modules` 里的冗余文件；或者把静态资源、字体、图片这类东西挪到对象存储上，不要跟代码打在一起。

再超不下去，那就说明这个服务的形态本身不适合云函数，回头考虑云托管或者容器。别硬凑。

## 总结

三种方式的取舍其实挺清晰的。

自建服务器加 docker-compose 最灵活，什么依赖都能装，成本是固定的服务器费用加上全部运维工作。适合服务比较重、依赖复杂、需要长期常驻的场景。这条路上最容易翻车的三处是：同一网桥下要用服务名互访、数据卷一定要挂出来、`depends_on` 保证不了数据库就绪所以要靠 `restart` 兜底。

微信云托管适合小程序和公众号的后端。它读你的 Dockerfile，所以从自建迁过去几乎零改造，还白送了版本管理、自动扩缩容和微信链路的免鉴权能力。要记住容器是无状态的，进容器改文件没有意义。

serverless 最省钱，不跑不花钱，但约束也最硬。端口必须 9000，地址必须 `0.0.0.0`，`scf_bootstrap` 要有执行权限，运行时版本要跟脚本里的 node 路径对上，代码包不能超 500M。冷启动这件事没法完全消除，对首次响应敏感的接口不要放这儿。

我自己现在的默认选择是：给小程序做后端就云托管，纯内部工具或者低频接口用 serverless，业务复杂、要连一堆中间件的还是老老实实自建。没有哪个方案是全面更优的，看约束条件挑。

## 参考

- [Docker 官方安装文档](https://docs.docker.com/engine/install/centos/)
- [Docker Compose 文件格式参考](https://docs.docker.com/reference/compose-file/)
- [MySQL 官方镜像说明](https://hub.docker.com/_/mysql)
- [Redis 官方镜像说明](https://hub.docker.com/_/redis)
- [Nestjs 官方文档](https://docs.nestjs.com/)
- [微信云托管开发者文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/basic/intro.html)
- [腾讯云 Web 函数部署 Nest.js](https://cloud.tencent.com/document/product/1154/59341)
- [腾讯云函数配额限制](https://cloud.tencent.com/document/product/583/11637)
- [前端进阶之旅](https://interview.poetries.top)
