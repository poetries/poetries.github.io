---
title: pm2 ecosystem部署Node应用与pm2-logrotate日志切割实战
description: 用 ecosystem.config.js 管理 PM2 进程配置，cluster 模式多实例部署 Node/Next.js 应用，并通过 pm2-logrotate 做日志自动切割与保留，避免日志文件撑爆服务器磁盘，附完整 Dockerfile 写法。
date: 2025-11-12 14:40:12
tags:
- Docker
- PM2
- Node.js
- 部署
categories: Front-End
---

服务器磁盘告警，登上去 `df -h` 一看根分区 100%，服务已经因为写不进文件挂了。一层层 `du -sh` 找过去，最后定位到应用目录下的 `app-error.log`，单个文件几个 G。这个文件从部署那天起就没被清理过，一直在往后追加。

这篇把 PM2 的两件事写清楚。一件是用 `ecosystem.config.js` 管理进程配置，替代那种在命令行敲一长串 `pm2 start` 参数的做法；另一件是用 `pm2-logrotate` 做日志切割，让日志按大小和时间自动滚动、自动淘汰旧文件。最后把这一整套塞进 Dockerfile，Next.js standalone 产物加 PM2 cluster 模式，容器起来就是多实例带日志管理的状态。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 为什么要用 ecosystem 配置文件，而不是在命令行传参数
- `ecosystem.config.js` 每个字段的作用与取值建议
- cluster 模式下实例数怎么定，日志文件为什么会带编号
- 日志撑爆磁盘的真正原因，以及 `pm2 flush` 为什么只能救急
- pm2-logrotate 的安装、参数含义与推荐配置
- 把 PM2 塞进 Docker 镜像的完整 Dockerfile 与注意事项
- `pm2-runtime` 和 `pm2 start` 的区别，为什么容器里必须用前者
- 部署后怎么验证日志确实在按规则切割

## 一、先说为什么要用 ecosystem 文件

很多人第一次用 PM2 都是这么启动的。

```bash
pm2 start server.js --name my-app -i 2 --output ./logs/out.log --error ./logs/err.log
```

能跑，但有几个问题。参数写在命令行里，没进版本控制，换台机器部署得靠翻历史命令；实例数、日志路径这些东西改一次就要把整条命令重敲一遍；团队里两个人敲的参数不一样，线上跑的配置和你以为的不是一回事。

ecosystem 文件解决的就是这个。它是一份普通的 JS 模块，跟着代码一起进仓库，谁部署都是同一份配置。

```js
// 在nodejs/nextjs项目根目录创建 ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'my-app-name',
      script: './server.js', // 服务启动脚本
      watch: false, // 禁用文件监视，提高性能
      instances: 2, // 指定要启动的实例数量 // 0 和 max 同义
      exec_mode: 'cluster', // 启用集群模式，指定要启动的实例数量
      // 启用文件日志记录
      output: './logs/app-out.log', // 标准输出日志文件
      error: './logs/app-error.log', // 错误日志文件
      // log: './logs/combined.log',        // 合并日志文件（可选）
      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: false, // 为每个实例单独日志
      time: true, // 在日志中添加时间戳
      env: {}
    }
  ]
}
```

启动就是一行。

```bash
pm2-runtime ecosystem.config.js
```

`apps` 是数组，一个文件里可以描述多个应用。做微服务或者一台机器上跑好几个 Node 服务的时候，一份 ecosystem 就能把它们全管起来，`pm2 start ecosystem.config.js --only my-app-name` 还能单独启其中一个。

## 二、ecosystem 每个字段在做什么

上面那份配置看着简单，几个字段背后的行为差别不小，逐个说一下。

`script` 指向启动入口。Next.js 用 standalone 输出模式的时候，构建产物里会生成一个 `server.js`，路径就是它。这一点后面 Dockerfile 那节还会再提，因为 `COPY --from=builder /app/.next/standalone ./` 之后 `server.js` 正好落在工作目录根下，和这里的 `./server.js` 对得上。

`watch: false` 是生产环境必须的。开着 watch，PM2 会监听文件变化自动重启，本地开发方便，线上就是灾难，一次误操作 `touch` 了某个文件，整个服务重启。而且监听本身在文件多的项目里会持续占 CPU。

`instances` 和 `exec_mode` 是一对。`exec_mode: 'cluster'` 让 PM2 用 Node 的 cluster 模块起多个进程，共享同一个端口，请求由主进程分发。`instances: 2` 就是起两个。写 `0` 或者 `'max'` 表示按 CPU 核心数来，写 `-1` 表示核心数减一，留一个核给系统。

那实例数到底该写几。我的经验是先看容器分到多少 CPU。如果是 Docker 里跑并且限了 `--cpus=1`，起再多实例也没用，反而每个进程都要单独占一份内存，Next.js 一个实例常驻内存两三百兆，起四个就快 1G 了。写死 `2` 而不是 `max`，很大程度上就是为了防止容器里 `os.cpus()` 读到的是宿主机核心数，一下起了十几个进程把内存打满。

这个坑我踩过，宿主机 16 核，容器限了 1 核，`instances: 'max'` 直接起了 16 个进程，OOM 被 kill 掉，PM2 又自动拉起来，反复循环。

`output` 和 `error` 分别是标准输出和错误输出的落盘路径。PM2 的配置 schema 里这两个是 `out_file` 和 `error_file` 的别名，两种写法都认，看老项目配置的时候别被这两组名字搞混。注释掉的 `log` 字段是合并日志，开了它 out 和 error 会写到同一个文件里，排查时序问题方便，但 error 会被淹没在正常日志里，我一般不开。

`merge_logs: false` 这条决定了日志文件名长什么样。cluster 模式下每个实例都在写日志，如果合并成一个文件，多进程同时追加会出现内容交错。设成 `false` 之后 PM2 会给每个实例的日志文件加上实例编号，也就是后面会看到的 `app-out-1.log` 和 `app-out-2.log`。排查问题时能直接定位是哪个实例出的错，这个设计是真的舒服。

`time: true` 和 `log_date_format` 是一对。前者开启时间戳前缀，后者定义格式。`'YYYY-MM-DD HH:mm Z'` 里的 `Z` 是时区偏移，服务器和容器时区不一致的时候，这个字段能救你一命，不然你看到的日志时间和用户反馈的时间对不上，白排查半天。

`env: {}` 是注入给进程的环境变量。空对象表示不额外注入，走容器或者宿主机的环境。真要用的话可以写成 `env: { NODE_ENV: 'production', PORT: 3000 }`，另外 PM2 还支持 `env_production` 这种带后缀的写法，配合 `--env production` 切换。

## 三、日志为什么会把磁盘撑爆

回到开头那个磁盘满的问题。

PM2 默认的日志行为是纯追加，写满了不会停，也不会自己删。只要进程一直在跑，日志文件就一直在长。Next.js 这类应用每个请求可能都会打几行日志，一天几十万请求，几个 G 是很正常的量。

更麻烦的是这个增长完全没有反馈。磁盘从 60% 涨到 90% 的过程中没有任何人会注意到，直到写不进去，服务开始报 `ENOSPC`，才有人上去看。

有人会说手动清一下不就行了。

```bash
$ pm2 flush
[PM2] Flushing /root/.pm2/pm2.log
[PM2] Flushing:
[PM2] /root/.pm2/logs/pm2-logrotate-out.log
[PM2] /root/.pm2/logs/pm2-logrotate-error.log
[PM2] Flushing:
[PM2] /app/logs/app-out-1.log
[PM2] /app/logs/app-error-1.log
[PM2] Flushing:
[PM2] /app/logs/app-out-2.log
[PM2] /app/logs/app-error-2.log
[PM2] Logs flushed
```

`pm2 flush` 会把所有日志文件清空。它确实能立刻腾出空间，但这是救急手段，不是方案。一是它清得太干净，出问题时你想回看昨天的日志已经没了；二是它得有人记得去执行，靠人记事情就等于没有保障。

真正要做的是让日志自己滚动。

## 四、用 pm2-logrotate 做自动切割

PM2 有个官方模块叫 `pm2-logrotate`，专门干这件事。它会起一个常驻的工作进程，定时检查日志文件大小，超过阈值就把当前文件改名归档、重新开一个空文件写，同时按保留数量删掉最老的归档。

安装是一行命令。

```
pm2 install pm2-logrotate
```

注意这里是 `pm2 install` 不是 `npm install`。PM2 的模块系统和 npm 包不是一回事，装完之后模块本体在 `~/.pm2/module_conf.json` 有一份配置记录，`pm2 list` 里也能看到它作为一个进程在跑。

装完先看看默认配置。

```bash
$ pm2 conf pm2-logrotate

Module: pm2-logrotate
$ pm2 set pm2-logrotate:max_size 10M
$ pm2 set pm2-logrotate:retain 50
$ pm2 set pm2-logrotate:compress false
$ pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
$ pm2 set pm2-logrotate:workerInterval 1
$ pm2 set pm2-logrotate:rotateInterval 0 0 * * *
$ pm2 set pm2-logrotate:rotateModule true
Module: module-db-v2
$ pm2 set module-db-v2:pm2-logrotate [object Object]
```

`pm2 conf` 的输出很贴心，它直接把每一项打印成可以复制执行的 `pm2 set` 命令，想改哪项就复制哪行改个值。

各参数的含义整理一下。

| 配置项         | 简介                                                         |
| :------------- | :----------------------------------------------------------- |
| Compress       | 是否通过gzip压缩日志                                         |
| max_size       | 单个日志文件的大小，比如上图中设置为1K（这个其实太小了，实际文件大小并不会严格分为1K） |
| retain         | 保留的日志文件个数，比如设置为10,那么在日志文件达到10个后会将最早的日志文件删除掉 |
| dateFormat     | 日志文件名中的日期格式，默认是YYYY-MM-DD_HH-mm-ss，注意是设置的日志名+这个格式，如设置的日志名为abc.log，那就会生成abc_YYYY-MM-DD_HH-mm-ss.log名字的日志文件 |
| rotateModule   | 把pm2本身的日志也进行分割                                    |
| workerInterval | 设置启动几个工作进程监控日志尺寸，最小为1                    |
| rotateInterval | 设置强制分割，默认值是0 0 * * *，意思是每天晚上0点分割，这个足够了个人觉得 |

有两个参数容易理解错，单独说一下。

`max_size` 不是精确阈值。工作进程是按 `workerInterval` 的间隔去检查文件大小的，检查的那一刻发现超了才动手，所以两次检查之间写进去的内容都算在这个文件里。设 10M 实际切出来 10.3M 是正常的，别为这零点几兆去调参数。

`workerInterval` 的单位是秒，值是检查间隔而不是进程数量。设成 `1` 表示每秒检查一次，日志量大的服务建议就用 1，反应快一点。这个字段名确实容易让人以为是 worker 的个数。

`rotateInterval` 用的是 cron 表达式，`0 0 * * *` 是每天零点。它和 `max_size` 是并行生效的，任何一个条件满足都会触发切割。所以即使一天写不满 10M，零点也会切一次，按天归档在排查问题时很方便，你知道某天的日志一定在某个文件里。

我实际用的配置是这样。

```bash
# 设置单个文件的大小
pm2 set pm2-logrotate:max_size 10M
# 保留的日志文件个数，比如设置为10,那么在日志文件达到10个后会将最早的日志文件删除掉
pm2 set pm2-logrotate:retain 50
# dateFormat	日志文件名中的日期格式，默认是YYYY-MM-DD_HH-mm-ss，注意是设置的日志名+这个格式，如设置的日志名为abc.log，那就会生成abc_YYYY-MM-DD_HH-mm-ss.log名字的日志文件
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
# 是否通过gzip压缩日志
pm2 set pm2-logrotate:compress true
# workerInterval 设置启动几个工作进程监控日志尺寸，最小为1
pm2 set pm2-logrotate:workerInterval 1
# rotateInterval	设置强制分割，默认值是0 0 * * *，意思是每天晚上0点分割，这个足够了个人觉得
pm2 set pm2-logrotate:rotateInterval 0 0 * * *
```

`retain 50` 配 `max_size 10M`，最坏情况下单个日志类型占 500M。乘以 out 和 error 两种、再乘以实例数，两个实例大概是 2G 的上限。定这个数之前先算一下，别配完发现上限比磁盘还大。

`compress` 我开成了 `true`。gzip 之后文本日志一般能压到十分之一以下，代价是想看历史日志得先解压。磁盘紧张就开，磁盘富裕、需要频繁 `grep` 历史日志就关。

> 如果想后面直接看配置，也可以通过指令`pm2 conf pm2-logrotate`来查看详细的配置

## 五、把这一套塞进 Dockerfile

上面都是在裸机上的操作。放到容器里还有几个额外的问题要处理，最主要的是 `pm2 install` 和 `pm2 set` 这些命令是在构建阶段执行的，配置得能持久化到镜像层里。

先看完整的 Dockerfile，是一份 Next.js standalone 加 PM2 的多阶段构建。第一段是依赖安装阶段。

```bash
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Install build dependencies for native modules including USB support
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    linux-headers \
    eudev-dev \
    libusb-dev

# 设置时区为北京时间
RUN apk add --no-cache tzdata && \
cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
echo "Asia/Shanghai" > /etc/timezone

RUN yarn config set registry https://registry.npmjs.org/

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi
```

`libc6-compat` 是 Alpine 上跑 Node 原生模块的常见依赖，Alpine 用的是 musl libc，很多预编译的二进制是按 glibc 编的，装这个包做兼容。后面那一串 `python3` `make` `g++` 是给需要现场编译的原生模块用的，`eudev-dev` 和 `libusb-dev` 则是这个项目里用到 USB 设备才装的，你的项目大概率不需要，删掉能让镜像小一大截。

时区那三行很关键。Node 官方镜像默认是 UTC，容器里打出来的日志时间比北京时间早 8 小时。前面 ecosystem 里配了 `log_date_format`，如果时区不改，格式再好看时间也是错的。

只 COPY 两个 lock 文件再装依赖，是为了利用 Docker 的层缓存。业务代码改了但依赖没变的时候，这一层直接命中缓存，构建能快好几分钟。

第二段是构建阶段。

```bash
# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules/
COPY . .

# Add memory limit and disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max-old-space-size=4096"

RUN \
  if [ -f yarn.lock ]; then yarn build:feinterview-poetries-top; \
  elif [ -f package-lock.json ]; then npm run build:feinterview-poetries-top; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build:feinterview-poetries-top; \
  else echo "Lockfile not found." && exit 1; \
  fi
```

`--max-old-space-size=4096` 这条不是可选项。Next.js 构建大项目时 V8 默认堆上限很容易被打爆，报出来的错是 `JavaScript heap out of memory`，CI 上尤其常见。把上限提到 4G 基本能覆盖大多数场景，但前提是构建机器真有那么多内存，否则会变成被系统 OOM killer 干掉。

第三段是运行阶段，也是 PM2 登场的地方。

```bash
# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_PUBLIC_NAMESPACE=prod \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME="0.0.0.0"

COPY --from=builder /app/public ./public

RUN mkdir .next

# 复制构建产物
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# 拷贝pm2部署文件
COPY ecosystem.config.js ./
```

`HOSTNAME="0.0.0.0"` 少不得。Next.js standalone 的 server 默认可能只监听 localhost，容器内监听 127.0.0.1 的话，宿主机的端口映射根本转发不进去，表现是端口映射看着正常但访问就是超时。

standalone 产物只包含运行时真正用到的依赖，体积比整个 `node_modules` 小非常多，但 `public` 和 `.next/static` 不在里面，得单独 COPY。漏掉 static 那一行的话，页面能打开但样式和 JS 全 404。

再看 PM2 这部分。

```bash
# 安装 PM2
RUN npm install -g pm2
RUN pm2 install pm2-logrotate

# 设置pm2-logrotate配置 后面直接看配置，也可以通过指令pm2 conf pm2-logrotate来查看详细的配置
# 单个日志文件的大小
RUN pm2 set pm2-logrotate:max_size 10M
# 保留的日志文件个数，比如设置为10,那么在日志文件达到10个后会将最早的日志文件删除掉
RUN pm2 set pm2-logrotate:retain 50
# dateFormat	日志文件名中的日期格式，默认是YYYY-MM-DD_HH-mm-ss，注意是设置的日志名+这个格式，如设置的日志名为abc.log，那就会生成abc_YYYY-MM-DD_HH-mm-ss.log名字的日志文件
# RUN pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
# 是否通过gzip压缩日志
# RUN pm2 set pm2-logrotate:compress true
# workerInterval 设置启动几个工作进程监控日志尺寸，最小为1
# RUN pm2 set pm2-logrotate:workerInterval 1
# rotateInterval	设置强制分割，默认值是0 0 * * *，意思是每天晚上0点分割，这个足够了个人觉得
# RUN pm2 set pm2-logrotate:rotateInterval 0 0 * * *

# 服务运行在3000端口
EXPOSE 3000

# pm2-runtime 是 PM2 的一个命令，专门用于在生产环境中运行应用程序
CMD ["pm2-runtime", "ecosystem.config.js"]
```

这里有个点值得说清楚。`pm2 install` 和 `pm2 set` 会把模块本体和配置写进 PM2 的家目录，也就是 `$HOME/.pm2` 下面。构建阶段执行这些命令时，这些文件被固化进了镜像层，容器启动后 `pm2-runtime` 读的还是同一份配置，所以配置能生效。前提是构建和运行用的是同一个用户，通常都是 root。如果你在 Dockerfile 里加了 `USER nextjs` 之类的非 root 用户切换，`$HOME` 变了，之前 root 下装的模块和配置就读不到了，这个坑要留意。

只有 `max_size` 和 `retain` 两行是打开的，其余都注释掉了，走默认值。默认的 `dateFormat` 和 `rotateInterval` 本来就够用，`compress` 默认关着，想开的话把注释去掉重新构建就行。

还有一件事原文没写但我建议加上，`./logs` 这个目录最好在构建时先创建出来。

```bash
RUN mkdir -p logs
```

不同 PM2 版本对日志目录不存在的处理不太一样，有的会自动建，有的直接报错写不进去。提前建一下不花什么成本。

## 六、pm2-runtime 和 pm2 start 的区别

`CMD ["pm2-runtime", "ecosystem.config.js"]` 这一行不能随便换成 `pm2 start`，这是容器里最容易犯的错。

`pm2 start` 是守护模式，它会在后台起一个 PM2 daemon，然后前台命令立刻退出。放到容器里，Docker 看到 PID 1 的进程退出了，就认为容器跑完了，直接把容器停掉，应用跟着一起没了。

`pm2-runtime` 是专门为容器设计的前台模式。它自己作为 PID 1 常驻，把子进程的日志转发到标准输出，还能正确处理 `SIGTERM` 信号做优雅退出。`docker stop` 的时候，PM2 会先通知每个实例关闭，等待现有请求处理完再退出，而不是被直接 kill。

顺带说一句，容器里再套一层 PM2 其实是有争议的。Kubernetes 那套编排本身就有多副本和重启策略，PM2 的进程守护职责会重复。我自己选择保留 PM2 的原因是单机 Docker 部署的场景下，cluster 模式能让一个容器吃满多核，比起为了多进程去起多个容器要简单。要是你已经在用 K8s，直接单进程加 HPA 可能更合适。

关于整条部署链路怎么串起来，我之前写过一篇用 GitHub Actions 构建镜像推到私有仓库再自动部署的文章，可以配合看 [基于 GitHub Actions 构建 Docker 镜像部署到腾讯云私有仓库](https://feinterview.poetries.top/blog/github-actions-tencent-docker-registry)。

## 七、部署后怎么验证

镜像跑起来之后进容器看一眼日志目录，切割生效的话会是这样。

```bash
/app/logs # ls -lh
total 240K   
-rw-r--r--    1 root     root        2.8K Mar  1 01:53 app-error-1.log
-rw-r--r--    1 root     root       41.5K Feb 28 00:00 app-error-1__2026-02-28_00-00-00.log
-rw-r--r--    1 root     root       48.2K Mar  1 00:00 app-error-1__2026-03-01_00-00-00.log
-rw-r--r--    1 root     root      113.3K Mar  1 00:43 app-error-2.log
-rw-r--r--    1 root     root        1.3K Mar  1 02:37 app-out-1.log
-rw-r--r--    1 root     root        1.4K Feb 28 00:00 app-out-1__2026-02-28_00-00-00.log
-rw-r--r--    1 root     root        2.5K Mar  1 00:00 app-out-1__2026-03-01_00-00-00.log
-rw-r--r--    1 root     root        4.4K Mar  1 02:37 app-out-2.log
```

这个输出信息量很大，逐条对照一下就知道前面的配置有没有生效。

文件名里的 `-1` 和 `-2` 是实例编号，说明 `merge_logs: false` 和 `instances: 2` 生效了，两个实例在写各自的日志。带 `__2026-02-28_00-00-00` 后缀的是归档文件，时间戳全是 `00-00-00`，说明触发切割的是 `rotateInterval` 的每天零点，而不是 `max_size`，也就是这个服务一天的日志量还没到 10M。不带时间戳的是当前正在写入的文件。

`app-error-2.log` 有 113K 而 `app-error-1.log` 只有 2.8K，两个实例的错误量差这么多，这种情况值得点进去看看，一般是某个实例上有个特定的请求在反复报错。

再补两个容器场景下的注意事项。容器内的日志文件在容器被删除时会一起消失，所以 `/app/logs` 建议挂一个 volume 出来，`-v /www/logs/my-app:/app/logs`，这样重新部署也能回看历史日志。另外 Docker 自己的 json-file 日志驱动也会无限增长，`pm2-runtime` 把日志转发到标准输出之后 Docker 会再记一份，记得在启动参数里限制一下。

```bash
docker run -d \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  -v /www/logs/my-app:/app/logs \
  -p 3000:3000 --name my-app my-app:latest
```

日志这件事管住了容器内的 PM2 却漏了 Docker 这一层，磁盘照样会满，这个我也是吃过亏才补上的。

## 总结

PM2 这套东西真正需要想清楚的只有两件事。

配置要进版本控制，ecosystem 文件的价值不在于少敲几个参数，而在于线上跑的配置和仓库里写的是同一份，任何人在任何机器上部署结果都一致。日志要有自动淘汰机制，`pm2 flush` 是救火，`pm2-logrotate` 才是消防系统，装完设两个参数就能一劳永逸。

容器场景下额外记住三条。`CMD` 必须用 `pm2-runtime` 而不是 `pm2 start`，否则容器起来就退出。`instances` 不要写 `max`，容器读到的核心数可能是宿主机的。日志目录挂 volume，同时用 `--log-opt` 限制住 Docker 自己那一层。

至于 `max_size` 和 `retain` 具体填多少，先拿磁盘容量除以日志类型数和实例数算个上限，再往下留一半余量，比抄别人的配置靠谱。

## 参考

- [PM2 Ecosystem File 配置文档](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- [PM2 Cluster Mode 说明](https://pm2.keymetrics.io/docs/usage/cluster-mode/)
- [pm2-logrotate 模块仓库](https://github.com/keymetrics/pm2-logrotate)
- [PM2 Docker 集成指南](https://pm2.keymetrics.io/docs/usage/docker-pm2-nodejs/)
- [Next.js standalone 输出模式](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [前端进阶之旅](https://interview.poetries.top)
