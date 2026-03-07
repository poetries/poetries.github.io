---
title: docker结合pm2部署node项目
date: 2018-11-26 10:31:12
tags: 
   - Docker
   - 部署
categories: Back-end
---

## 一、下载node镜像

```bash
docker pull node
```

下载完后`docker images`查看一下，稍后用到


## 二、创建Dockerfile

```bash
FROM node
RUN mkdir -p /home/Service
WORKDIR /home/Service    # Bundle app source
COPY . /home/Service
RUN npm install
EXPOSE 8888
CMD npm start   
 ## 如果想运行多条指令可以这样：
## CMD git pull && npm install && npm start
```

### 2.1 FROM

```
FROM node
```

> `FROM`是构建镜像的基础源镜像，`node` 这个是镜像的名称，也就是我们一开始从国内服务器上拉下来的那个`Image`。如果本地没有`Docker` 会自己`pull`镜像

### 2.2 RUN

后面跟的是在这个新容器中执行的命令

```bash
#在容器中创建一个目录
RUN mkdir -p /home/Service
```

### 2.3 WORKDIR

容器的工作目录

```bash
#将容器的工作目录定位到 /home/Service中
WORKDIR /home/Service
```

### 2.4 COPY

将本地的东西拷贝到容器的指定目录下

```bash
#把本机当前目录下的所有文件拷贝到Image的/home/Service文件夹下
COPY . /home/Service  
RUN npm install
```

### 2.5 EXPOSE

将容器内的某个端口导出给主机，用于我们访问

```
EXPOSE 8888
```

### 2.6 CMD

- 首先：每个`Dockerfile`中只能写一个`CMD`，写多了，后面的会覆盖前面的。
- 然后：`CMD`后面跟的命令是每次容器启动的时候执行的命令。
- 最后：命令格式可以是数组格式，也可是直接命令行方式，多条命令的时候用 "`&&`"链接。

```
CMD [ "npm", "start" ]
```

## 三、构建Image

> 在你`Dockerfile`文件所在的目录下运行下面的命令来构建一个`Image`

```
docker build -t mynodeapp .
```

> 点就是指当前目录下的`Dockerfile`

构建完后查看一下我们的镜像

 ![](https://poetries1.gitee.io/img-repo/20191001/42.png)

**运行镜像**

```
docker run -d -p 8880:8888 mynodeapp
```

- `-d` :表明容器会在后台运行，
- `-p` :表示端口映射，把本机的`8880`端口映射到`container`的`8888`端口，这样外网就能通过本机的`8880`端口访问我们的`web`了。
- 后面的`mynodeapp`是我们镜像的名字

> 通过`docker ps` 查看我们刚运行的`Container`的`ID`

我们先通过`curl` 看能不能访问我们的`web`。


```
curl -i localhost:8880
```

如果返回相应的HTTP信息，表示成功

## 四、结合pm2部署

> 部署参考 http://blog.poetries.top/2018/11/18/react-ssr-next-deploy/


> 使用命令` pm2 start app.js` 之后, `pm2` 默认在后台运行, 如果使用了`Docker`后,容器运行并立即退出,需要手动给“`pm2`”指定参数 `--no-daemon`

```bash
# 在Dockerfile中：

--no-daemon // run pm2 daemon in the foreground if it doesn't exist already

CMD pm2 start app.js --no-daemon // 设置启动方式

#  或者 使用   pm2-docker
CMD pm2-docker start app.js
```

