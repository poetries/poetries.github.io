---
title: 微信云托管入门与实践
date: 2022-06-19 12:30:41
tags: 
  - 部署
  - 云托管
categories: Front-End
---



## 基本简介

### 微信云托管是什么？

- 微信云托管 是微信团队提供的以云原生为基础的，免运维、高可用服务上云解决方案，无需服务器，1分钟即可部署小程序/公众号服务端。
- 微信云托管支持目前绝大多数语言/框架项目，开发者可以从服务器平滑迁移；并且微信云托管的自动运维和扩缩容特性，无需开发者关心服务的可用性，专注于业务，极大节省人力和服务资源成本。
- 同时，微信云托管还集成持续交付部署，DevOps自动化，安全鉴权等众多能力，致力于帮助没有深层运维经验的业务开发者和研发团队，用最低的成本，打造出稳定性高，安全性强的后端服务。
- 最重要的，微信云托管与微信生态深度融合，具有免鉴权，云调用，消息推送，微信支付等众多微信优势特性，开发者可以非常轻松和高效的完成互通，并且在安全、可靠性方面有微信团队的专业保障。

![](https://s.poetries.work/uploads/2022/06/1399e820bc230d5c.png)

### 架构特点

> 微信云托管以容器服务为核心，提供方便易用的存储体系、微信生态、安全鉴权等服务能力；搭配简单易懂的操作面板，集成资源监控，资源告警，流水线等自动化功能，是一站式的后端云服务。

微信云托管使用目前主流的容器平台Docker以及容器编排技术Kubernetes（简称K8S），来管理你的项目

![](https://s.poetries.work/uploads/2022/06/9a112314718e46da.png)

### 常见问题

### 云托管的作用是什么？

> 代替服务器部署小程序/公众号后端。

#### 微信云托管和微信云开发的区别是什么，如何选择？

- 微信云开发和微信云托管都是微信联合腾讯云打造的微信云服务生态的组成部分，都提供了免服务器免运维的能力，开发者可以根据自己的业务特点进行选择。
- 微信云开发以云函数提供计算能力，围绕 Node.js 技术栈，适合前端开发者简单快捷实现后端功能，或全栈开发者一体化开发； 微信云托管以容器提供计算能力，支持任意后端语言和框架，适合前后端分离项目的后端开发、传统模式后端项目迁移，对团队协作和企业级应用场景更友好

#### 微信云托管和云开发中的云托管有何区别？

- 微信云托管和之前云托管的区别除了品牌升级外，还做了独立的控制台。旧的云托管只是云开发的一个模块，只有单纯的容器引擎能力，升级为微信云托管后脱离云开发，成为完整的后端项目托管解决方案。 从代码管理到CI/CD流水线部署发布，提供全链路、低成本、企业级的云原生解决方案，功能更强大、体验更友好
- 云开发中的云托管能力已停止功能更新，仅支持存量业务继续运行。建议原云开发中的云托管的用户尽快将项目迁移到微信云托管。

#### 微信云托管可以用于APP/网站/其他平台小程序吗？

> 必须先有微信小程序/公众号才可以开通微信云托管，但部署在微信云托管上的服务可以通过公网访问，因此可以被APP/网站/其他平台小程序的前端调用，只是无法享受 callcontainer 内部链路带来的安全防DDoS/请求加速等优势。

#### 微信云托管的环境可以在微信开发者工具的云开发控制台中看到吗？

> 微信云托管和微信云开发是两套独立体系，微信云托管的环境只能在微信云托管控制台看到，在微信开发者工具的云开发控制台中不能看到

### 腾讯云和微信云托管有关系吗？云开发的云托管和微信云托管有什么区别？

> 微信云托管是整合了腾讯云底层资源和微信生态链路的综合解决方案。原云开发中的云托管独立出来，升级为微信云托管，补充数据库、ci/cd、灰度发布等更多完整后端功能和企业级devops能力。

### 云托管的时间相差8个小时？

容器系统时间默认为 UTC 协调世界时间 （Universal Time Coordinated），与本地所属时区 CST （上海时间）相差 8 个小时：

在构建基础镜像或在基础镜像的基础上制作自定义镜像时，在 `Dockerfile` 中创建时区文件即可解决单一容器内时区不一致问题，且后续使用该镜像时，将不再受时区问题困扰。

1. 打开 `Dockerfile` 文件。
2. 写入以下内容，配置时区文件

```
FROM centos as centos  COPY --from=centos  /usr/share/zoneinfo/Asia/Shanghai /etc/localtime RUN echo "Asia/Shanghai" > /etc/timezone
```

3. 重新构建容器镜像，使用新的镜像重新部署。或直接上传含新的 Dockerfile 的代码包重新部署

## 云托管部署

### 云托管模板部署

> 访问 https://cloud.weixin.qq.com/cloudrun/onekey

![](https://s.poetries.work/uploads/2022/06/faabdedf644f3e4e.png)
![](https://s.poetries.work/uploads/2022/06/938ddd4770eac635.png)
![](https://s.poetries.work/uploads/2022/06/ea9d4e50eebbc2c7.png)
![](https://s.poetries.work/uploads/2022/06/7fc8863ea615b727.png)

**小程序/公众号中调用**

```js
// 在小程序 app.js中初始化云托管
onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'xxx', // 填入云托管环境ID
      })
    }
}

```

```js
// 在小程序中调用云托管服务
wx.cloud.callContainer({
  "config": {
    "env": "prod-xx" // 填入云托管环境ID
  },
  "path": "/api/count", // 云托管服务请求路径
  "header": {
    "X-WX-SERVICE": "express-4bnl" // 云托管服务名称
  },
  "method": "POST",
  "data": {
    "action": "inc" // 发起请求传入的参数
  }
})
```

### 云托管自定义部署nestjs

**初始化您的 Nest.js 项目**

```js
npm i -g @nestjs/cli
nest new nest-app
```

在根目录下，执行以下命令在本地直接启动服务。

```
cd nest-app && npm run start
```

打开浏览器访问 http://localhost:3000，即可在本地完成 Nest.js 示例项目的访问。

**新建服务**

![](https://s.poetries.work/uploads/2022/06/d867bed19eb7d9ed.png)

![](https://s.poetries.work/uploads/2022/06/a94985c89c5a77d0.png)

点击发布后，云托管会执行`Dockerfile`构建流水线，到日志可以查看构建进度

![](https://s.poetries.work/uploads/2022/06/28c702aebeea51f1.png)
![](https://s.poetries.work/uploads/2022/06/e381ee973e6b0128.png)

**微信云托管部署成功后，可以在实例列表，点击进入容器看到代码**，这里里面的内容不能修改，在容器启动后会覆盖

![](https://s.poetries.work/uploads/2022/06/f29ea9c2ac74fac7.png)
![](https://s.poetries.work/uploads/2022/06/a4a8d047a18b8846.png)

**调试接口**

![](https://s.poetries.work/uploads/2022/06/71e72ba06d6335db.png)

> [详细示例](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/quickstart/custom/node.html)

## CLI工具使用

```
npm install -g @wxcloud/cli

wxcloud -h
```

**获取 CLI 密钥**

CLI工具的登录采用了密钥形式，在使用前需要前往[微信云托管控制台 - 设置 -CLI 密钥](https://cloud.weixin.qq.com/cloudrun/settings/other)生成，生成时需要账号管理员扫码，可以新建多个密钥，用于在不同地方使用。

传入微信 APPID 和CLI密钥，操作登录

```
wxcloud login [OPTIONS]
```

**查看登录账号下所有的环境列表**

```
wxcloud env:list [OPTIONS]
```

**查看指定环境下的所有服务列表**

```
wxcloud service:list [OPTIONS]
```

![](https://s.poetries.work/uploads/2022/06/32865ab6963c425e.png)

## 云托管本地调试

### 本地docker调试

- 安装[docker](https://docs.docker.com/get-docker/)
- 安装[微信开发者工具最新版](https://developers.weixin.qq.com/miniprogram/dev/devtools/stable.html)
- 安装vscode [Docker拓展](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)
- 在 VSCode 拓展栏搜索 weixin-cloudbase 然后安装

**以koa作为后端演示**

全局安装 `koa-generator` 脚手架.

```
npm install -g koa-generator
```

创建项目

```
# 使用ejs引擎
koa2 -e wxcloud-debug-koa
```

```
cd wxcloud-debug-koa // 进入项目根目录
npm install // 安装项目依赖
```

- 修改`www/bin`中的端口为`9000`
- 修改`routes/index`中代码为

```js
router.get('/', async (ctx, next) => {
  ctx.body = {
    message: '请求头',
    header: ctx.header
  }
})
```


打开浏览器访问 http://localhost:9000，即可在本地完成 `koa` 示例项目的访问。


**编写dockerfile**

```dockerfile
FROM daocloud.io/library/node:14.7.0

# 设置时区
ENV TZ=Asia/Shanghai \
    DEBIAN_FRONTEND=noninteractive
RUN ln -fs /usr/share/zoneinfo/${TZ} /etc/localtime && echo ${TZ} > /etc/timezone && dpkg-reconfigure --frontend noninteractive tzdata && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app

# 指定工作目录
WORKDIR /app

# 复制当前代码到/app工作目录
COPY . ./

# npm 源，选用国内镜像源以提高下载速度
RUN npm config set registry https://registry.npm.taobao.org/

# npm 安装依赖
RUN npm install 

# 启动服务
CMD node app.js

EXPOSE 9000
```

> 如只在 VSCode 中同时编辑调试一个服务，`可直接打开服务代码目录作为根目录`（暂不支持 VSCode Workspace 工作区），保证根目录下有 `Dockerfile` 文件，插件面板中会显示该服务的名字

![](https://s.poetries.work/uploads/2022/06/66fece8795fb4d24.png)
![](https://s.poetries.work/uploads/2022/06/ac09af2107358e03.png)

> 调试过程中因需要获取微信信息，会使用云托管 CLI Key，因此需在 VSCode 插件配置填入小程序 appid 和 cli key，点击插件面板的 ⚙ 图标打开配置：

![](https://s.poetries.work/uploads/2022/06/ce3c104e40011d61.png)

![](https://s.poetries.work/uploads/2022/06/9ae3be753faf6d15.png)

**构建镜像，启动容器**

右键服务名，选择 start，将构建镜像并启动容器

![](https://s.poetries.work/uploads/2022/06/fcd6a583112c5092.png)

可以看到构建过程

![](https://s.poetries.work/uploads/2022/06/edf9e52ecc8be079.png)

启动容器需要相应的容器配置信息（`.cloudbase/container/debug.json`），如果没有会提示创建，配置文件字段和含义如下：

![](https://s.poetries.work/uploads/2022/06/f012165c8689c0d7.png)

> 其中需特别注意端口号 `containerPort`、`Dockerfile` 路径 `dockerfilePath`、自定义环境变量 `envParams`

此时出现异常，我们修改`.cloudbase/container/debug.json`中的`containerPort`为koa服务中定义的9000端口，重新构建即可

![](https://s.poetries.work/uploads/2022/06/45bf31849d1ea025.png)
![](https://s.poetries.work/uploads/2022/06/170ccb5736623b06.png)

容器构建和启动成功后，在插件面板状态 icon 会相应更新：

![](https://s.poetries.work/uploads/2022/06/119ccbcb1b5bda86.png)

也可以通过`docker ps`查看已启动的服务

![](https://s.poetries.work/uploads/2022/06/bffee56613a1852b.png)

我们在云托管后台可以看到此时默认启动了一个调试服务，我们不要去修改它

![](https://s.poetries.work/uploads/2022/06/b9628146f2936d6d.png)

> 此时可以请求容器了，在插件面板旁会展示两个端口号，通过第一个端口访问容器会带有微信相关信息（header 中包含 appid 等），通过第二个端口访问容器不会带有微信相关信息而是直接请求到容器内部，右键服务选择 Open in browser (via WX server) 和 Open in browser (no WX auth) 可以在浏览器中打开，分别对应这两种情况，也可以写代码或通过 POSTMAN 等工具请求

![](https://s.poetries.work/uploads/2022/06/08a189b22f22d644.png)

**请求不经过微信服务器返回**：http://127.0.0.1:27081/

> 不带微信信息的端口，直接访问即可，适合在浏览器调试

![](https://s.poetries.work/uploads/2022/06/219c2a545a680211.png)

**请求经过微信服务器返回**：http://127.0.0.1:27082/

> 微信端口，请求时会模拟微信用户信息的 Header，如 x-wx-openid，适合微信开发者工具中使用

![](https://s.poetries.work/uploads/2022/06/61300f5e0ee71be1.png)

**在微信开发者工具中，可以选择连接到 VSCode 启动的容器，从而在小程序模拟器中访问本地云托管容器**

> 此能力需要使用微信开发者工具 v1.05.2202242 及以上版本，并更新 VSCode 插件到 v1.0.12 以上。


**创建一个小程序测试项目**

![](https://s.poetries.work/uploads/2022/06/0682d26a6cb9733d.png)

> 在 微信开发者工具 的 `Docker` 面板中，找到 「`Running Containers`」，右击容器名称，选择 `Attach Weixin Devtools`，即可在小程序代码中，使用 `wx.cloud.callContainer` 访问容器。

![](https://s.poetries.work/uploads/2022/06/24939ce50c3f697d.png)

需要退出再次`Detach Weixin Devtools`

![](https://s.poetries.work/uploads/2022/06/c7e521ee38851161.png)

> 调用时，需要注意 `Header` 中的 `X-WX-SERVICE` 需要与容器名保持一致

修改小程序`app.js`代码

```js
// app.js
App({
  onLaunch: async function () {
    await wx.cloud.init({
      // env: "其他云开发环境，也可以不填"    // 此处 init 的环境 ID 和微信云托管没有作用关系，没用就留空
    });
    const res = await wx.cloud.callContainer({
      config: {
        env: "prod-xx", // 微信云托管环境ID，不能为空，替换自己的
      },
      path: '/', 
      method: 'GET',
      header: {
        'X-WX-SERVICE': 'wxcloud-debug-koa', // 替换成本地要调试的容器名称
      }
    });
    console.log(res); // 在控制台里查看打印
  }
})
```

![](https://s.poetries.work/uploads/2022/06/3c82a5b4cd77cb7e.png)

**查看请求日志**

![](https://s.poetries.work/uploads/2022/06/e789dfef49932c98.png)

或者通过`docker logs`查看

![](https://s.poetries.work/uploads/2022/06/9e869917426b77ad.png)

**进入终端**

> 如果需要进入到容器内部终端调试定位问题，可以右键服务名选择 Attach Shell 进入容器内终端

![](https://s.poetries.work/uploads/2022/06/333fccccae7df026.png)

### 本地docker实时调试

> 通过微信云托管 VSCode 插件，可以实现实时开发，即代码变动时，不需要重新构建和启动容器，即可查看变动后的效果。

**选择 Live Coding**

![](https://s.poetries.work/uploads/2022/06/34196636c57afd14.png)

> 右键点击需要调试的容器，选择 `Live Coding`，将自动生成 `Dockerfile.development` 和 `docker-compose.yml` 2 个文件并启动容器。

如果生成失败，我们需要自行配置

![](https://s.poetries.work/uploads/2022/06/312e14d5e6ca8287.png)


**开发模式的 docker-compose.yml**

```yml
# 开发模式的 docker-compose.yml
# 实时开发将使用项目目录下的 docker-compose.yml 将当前目录映射到容器中。
# 大多数情况下，插件将根据项目的 Dockerfile 自动生成本文件，不需要手动编写。
version: '3'
services:
  app:
    build: 
      context: . # 构建上下文
      dockerfile: Dockerfile.development
    volumes:
      - .:/app # 需要映射的目录（即代码目录）
      - /app/node_modules # 映射 node_modules 目录，如果有构建产物与代码目录同级，需要单独映射避免无法运行
    ports:
      - 27081:9000 # 监听端口，主机端口：容器端口 修改为koa服务端口
    container_name: wxcloud_wxcloud-debug-koa # 容器名称
    labels: # 容器标签，一般不需改动
      - wxPort=27082
      - hostPort=27081
      - wxcloud=wxcloud-debug-koa
      - role=container
    environment:
      # 使用本地调试 MySQL 时，需要填入如下环境变量，并启动 MySQL 代理服务
      - MYSQL_USERNAME=
      - MYSQL_PASSWORD=
      - MYSQL_ADDRESS=
networks:
  default:
    external:
      name: wxcb0 # 容器网络打通，一般不需改动
```

修改端口 9000

```
ports:
  - 27081:9000 # 监听端口，主机端口：容器端口 修改为koa服务端口
```

**实时开发使用项目目录下的 Dockerfile.development**

```yml
# Dockerfile.development

# 实时开发使用项目目录下的 Dockerfile.development 作为开发期间的容器的 Dockerfile
# 大多数情况下，插件将根据项目的 Dockerfile 自动生成本文件，不需要手动编写。
# 开发模式的 Dockerfile 与正式模式的 Dockerfile 的区别在于：
# 单阶段构建
# 将编译命令转换为启动命令，如 Spring Boot 模板的 mvn package 会转换为 spring-boot:run
# 拉取实时开发的工具套件，安装到 /usr/bin 下
# 通过实时开发工具套件启动用户程序，在代码发生更改时，自动重启进程。

# Auto-generated by weixin cloudbase vscode extension
FROM ccr.ccs.tencentyun.com/weixincloud/wxcloud-livecoding-toolkit:latest AS toolkit
FROM node:lts-slim
COPY --from=toolkit nodemon /usr/bin/nodemon
# 设置时区
RUN ln -fs /usr/share/zoneinfo/${TZ} /etc/localtime && echo ${TZ} > /etc/timezone && dpkg-reconfigure --frontend noninteractive tzdata && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
# --only=production 只安装生产环境的依赖
RUN npm install --only=production && npm install pm2 -g
COPY . ./

# 修改nest启动入口 node bin/www
CMD [ "nodemon", "-x", "node bin/www", "-w", "/app", "-e", "java, js, mjs, json, ts, cs, py, go" ]
```

> 修改koa启动入口 `node www/bin`

![](https://s.poetries.work/uploads/2022/06/8a10761b7b5e317a.png)

**启动实时服务**

![](https://s.poetries.work/uploads/2022/06/27e38dab008bc840.png)

> 修改本地代码，不用重启容器即可查看效果

### 本地调试中使用「开放接口服务」

- 在 VSCode 拓展栏搜索 `weixin-cloudbase` 然后安装
- 完成配置后，在左侧 `Docker` 面板内，右击 `Proxy nodes for VPC access` 中的 `api.weixin.qq.com`，点击启动（`Start`）
- 右击用户容器，点击启动（`Start`），容器内即可访问本地云调用

填入环境ID

![](https://s.poetries.work/uploads/2022/06/fb7e7d5bb09d2714.png)

启动`api.weixin.qq.com`服务

![](https://s.poetries.work/uploads/2022/06/00ae0c2d76672797.png)

启动自己的业务服务，在业务服务运行过程中，启动 vpc 中的 `api.weixin.qq.com` 服务

> 插件将会在你的云托管环境中开启一个代理服务，用于和本地 `api.weixin.qq.com` 服务，同时和业务服务共享同一个网络，就实现了本地的「开放接口服务」，需要注意，本地调试中只是模拟了业务服务的所处环境，不是真实的线上部署情况。


## 云托管中使用云调用

> - [云调用](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/weixin/token.html)
> - [服务端接口](https://developers.weixin.qq.com/miniprogram/dev/api-backend/)

云调用是具有「免鉴权调用微信开放服务接口」特性的能力，是云开发/云托管中微信生态的一部分。

在云调用出现之前，微信开放服务接口的正常调用，需要开发者使用密钥信息获取`access_token`，并自己维护 `token` 的有效期和安全。而获取`access_token`，涉及到密钥交互请求，容易暴漏密钥导致被盗用，对开发者和微信服务都有消极的影响。

云调用主要打造免鉴权，也就是免密钥，全程不暴漏任何信息，开发者无需维护`access_token`，那对于接口请求的合法性判定，完全由与微信同链路的微信云托管参与实施。

### 配置云调用权限

前往[控制台 - 云调用 - 云调用权限配置](https://cloud.weixin.qq.com/cloudrun/openapi)，按照自己的业务需要配置接口。

比如你要在服务中调用文字安全检测接口

此接口的调用地址如下：`https://api.weixin.qq.com/wxa/msg_sec_check?access_token=ACCESS_TOKEN`

在配置时，只需要 `api.weixin.qq.com` 之后，`?`参数之前的部分，所以应该在配置输入框里填写如下

```
/wxa/msg_sec_check
```

![](https://s.poetries.work/uploads/2022/06/0fe1195da2601738.png)

> 在云托管服务中，微信后台周期性的将开放接口所必须要的 `access_token`，推送到服务的容器实例中。在使用时只需要从容器本地读取令牌，就可以包装请求去调用了：

> `access_token` 推送的时间间隔为 `10` 分钟，令牌的有效期为 `30` 分钟； 挂载路径为：`/.tencentcloudbase/wx/cloudbase_access_token`； 在同一个环境中所有的容器实例，推送的 `access_token` 相同

> 接口调用凭证 https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/access-token/auth.getAccessToken.html

**查看容器内access_token**

![](https://s.poetries.work/uploads/2022/06/0ada5a6c6b6248c9.png)
![](https://s.poetries.work/uploads/2022/06/b336245a70f0df92.png)

如果需要获取容器内的`access_token`调试接口，需要在接口中填入`cloudbase_access_token=容器内的access_token`

```js
// https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/weixin/token.html
const fs = require('fs')
const request = require('request')
// 容器内的access_token
const token = fs.readFileSync('/.tencentcloudbase/wx/cloudbase_access_token', 'utf-8')

return new Promise((resolve, reject) => {
  request({
    method: 'POST',
    // 可本地调试用cloudbase_access_token
    url: `https://api.weixin.qq.com/wxa/msg_sec_check?cloudbase_access_token=${token}`,
    body: JSON.stringify({
      openid: '用户的openid', // 可以从请求的 header 中直接获取 req.headers['x-wx-openid']
      version: 2,
      scene: 2,
      content: '安全检测文本'
    })
  },function (error, response) {
    console.log('接口返回内容', response.body)
    resolve(JSON.parse(response.body))
  })
})
```

### 云托管内调用服务端文字检测接口

```
npm i request request-promise -S
```

[服务端接口地址](https://developers.weixin.qq.com/miniprogram/dev/framework/security.msgSecCheck-v1.html#HTTPS%20%E8%B0%83%E7%94%A8)

在代码`routes/home`中添加

```js
router.get('/msg_sec_check', async (ctx, next) => {
  let ACCESS_TOKEN = ''
  let data = await rp({
    method: 'POST',
    // 在云托管容器环境中，可以拿到access_token，而且免鉴权、这里不需要填写
    // https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/weixin/open.html
    // 这里填http协议、在云托管中不需要填access_token、需要在云托管-云调用中填写接口白名单前缀、开启侧边栏proxy代理后可以免输入本地调试
    uri: `http://api.weixin.qq.com/wxa/msg_sec_check`,
    body: {
      openid: ctx.header['x-wx-openid'],  // 用户的openid 可以从请求的 header 中直接获取 req.headers['x-wx-openid']
      version: 2,
      scene: 2,
      content: '安全检测文本'
    },
    json: true
  }).catch(error=>{
    ctx.body = {
      code: -1,
      message: error
    }
    throw error
  })
  ctx.body = {
    data,
    code: 200
  }
})
```

在云托管权限控制台添加接口权限

![](https://s.poetries.work/uploads/2022/06/4ebb3911f85d34fa.png)

开启 `api.poetries.top` 本地调试服务

![](https://s.poetries.work/uploads/2022/06/528449d25dd3fe4b.png)

通过微信服务器模拟小程序请求

![](https://s.poetries.work/uploads/2022/06/2599830982d2a3f9.png)
![](https://s.poetries.work/uploads/2022/06/d0513c38eda2f996.png)

也可以在小程序中访问

![](https://s.poetries.work/uploads/2022/06/b662201bc3f48b26.png)


### 云托管内调用服务端云函数接口

[接口地址](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-http-api/functions/invokeCloudFunction.html)

在代码`routes/home`中添加

```js
// 云托管内调用云函数
router.get('/call-fn-banner', async (ctx, next) => {
  const ACCESS_TOKEN = ''
  const weappEnvId = 'poetry-prod-6gj3fpxa137552a6' // 小程序云开发envId
  const data = await rp({
    method: 'POST',
    // 在云托管容器环境中，可以拿到access_token，而且免鉴权、这里不需要填写
    // https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/weixin/open.html
    // 这里填http协议、在云托管中不需要填access_token、需要在云托管-云调用中填写接口白名单前缀、开启侧边栏proxy代理后可以免输入本地调试
    uri: `http://api.weixin.qq.com/tcb/invokecloudfunction?env=${weappEnvId}&name=banner`,
    body: {
      $url: 'queryBanner',
      ...ctx.request.query
    },
    json: true
  }).then(async res=>{
    console.log('callCloudFn res', res)
    if(res && res.errcode === 40001) {
      throw error
    }
    let data = res.resp_data ? JSON.parse(res.resp_data) : {}

    return data
  }).catch(error=>{
    ctx.body = {
      code: error.errcode,
      message: error.errmsg
    }
    throw error
  })

  ctx.body = data
})
```

小程序云函数banner代码

![](https://s.poetries.work/uploads/2022/06/cabf11a53af60f09.png)

```js
// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'poetry-prod-xx' // 环境ID
})

const TcbRouter = require('tcb-router')

const db = cloud.database()
const bannersCollection = db.collection('banners') // banners集合

// 云函数入口函数
exports.main = async (event, context) => {
  const app = new TcbRouter({event})

   // banner列表
   app.router('queryBanner', async (ctx,next)=>{
     const {pageSize = 20, pageNum = 1, orderBy, sort} = event
     try {
        let data = await bannersCollection.skip(Number((pageNum - 1)*pageSize)).limit(Number(pageSize)).orderBy(orderBy || 'createTime', sort || 'desc').get().then(res=>res.data)
        let {total} = await bannersCollection.count()
        ctx.body = {
          message: '查询成功',
          code: 200,
          data: {
            list: data,
            total,
            pageSize,
            pageNum
          }
        }
     } catch (error) {
        ctx.body = { message: error, code: -1 }
      }
  })

  return app.serve()
}
```

在云托管权限控制台添加接口权限

![](https://s.poetries.work/uploads/2022/06/4015858c85719a6a.png)

开启 `api.poetries.top` 本地调试服务

![](https://s.poetries.work/uploads/2022/06/528449d25dd3fe4b.png)

通过微信服务器模拟小程序请求

![](https://s.poetries.work/uploads/2022/06/2599830982d2a3f9.png)
![](https://s.poetries.work/uploads/2022/06/7629d70d78672b4e.png)

也可以在小程序中访问

![](https://s.poetries.work/uploads/2022/06/0b93736939cab19a.png)

### 云托管内调用服务端获取小程序码接口

[接口地址](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/qr-code/wxacode.get.html#HTTPS%20%E8%B0%83%E7%94%A8)

在代码`routes/home`中添加

```js
// 云托管内获取小程序码
router.get('/getweappCode', async (ctx, next) => {
  let ACCESS_TOKEN = ''
  let buffer = await rp({
    method: 'POST',
    // 在云托管容器环境中，可以拿到access_token，而且免鉴权、这里不需要填写
    // https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/weixin/open.html
    // 这里填http协议、在云托管中不需要填access_token、需要在云托管-云调用中填写接口白名单前缀、开启侧边栏proxy代理后可以免输入本地调试
    uri: `http://api.weixin.qq.com/wxa/getwxacode`,
    body: {
      path: '/pages/article/index'
    },
    json: true
  }).catch(error=>{
    ctx.body = {
      code: -1,
      message: error
    }
    throw error
  })
  ctx.body = {
    data: buffer,
    code: 200
  }
})
```

在云托管权限控制台添加接口权限

![](https://s.poetries.work/uploads/2022/06/f3bd515a0476f6bc.png)

开启 `api.poetries.top` 本地调试服务

![](https://s.poetries.work/uploads/2022/06/528449d25dd3fe4b.png)

通过微信服务器模拟小程序请求

![](https://s.poetries.work/uploads/2022/06/2599830982d2a3f9.png)

也可以在小程序中访问

![](https://s.poetries.work/uploads/2022/06/426afbcda167a0d1.png)



## 文档

- [微信云托管开发者文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/basic/intro.html)
- [CLI工具](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/cli/)
- [本地调试](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/debug/)
- [云托管官方GitHub](https://github.com/WeixinCloud)
- [tencent云开发知识库首页](https://cloudbase.vip/kw/)
- [微信学堂快速上手微信云托管](https://developers.weixin.qq.com/community/business/course/00068c2c0106c0667f5b01d015b80d)
- [微信云托管学习路径](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/quickstart/plan/real.html)
