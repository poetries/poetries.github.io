---
title: pm2 ecosystem部署应用以及日志管理pm2-logrotate
date: 2025-11-12 14:40:12
tags: 
- Docker
categories: Front-End
---

> 本文记录了使用ecosystem部署应用，并且处理因PM2日志文件过大导致服务器磁盘空间耗尽的问题解决过程。通过安装并配置pm2-logrotate插件实现了日志文件的自动化管理，确保了服务器的稳定运行。

## ecosystem配置

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

一级部署应用

```bash
pm2-runtime ecosystem.config.js
```

## pm2日志管理logrotate

永久解决日志文件过大，使用日志管理用的插件 `pm2-logrotate`

**安装插件pm2-logrotate**

```
pm2 install pm2-logrotate
```

查看日志配置

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

**pm2-logrotate具体参数配置**

| 配置项         | 简介                                                         |
| :------------- | :----------------------------------------------------------- |
| Compress       | 是否通过gzip压缩日志                                         |
| max_size       | 单个日志文件的大小，比如上图中设置为1K（这个其实太小了，实际文件大小并不会严格分为1K） |
| retain         | 保留的日志文件个数，比如设置为10,那么在日志文件达到10个后会将最早的日志文件删除掉 |
| dateFormat     | 日志文件名中的日期格式，默认是YYYY-MM-DD_HH-mm-ss，注意是设置的日志名+这个格式，如设置的日志名为abc.log，那就会生成abc_YYYY-MM-DD_HH-mm-ss.log名字的日志文件 |
| rotateModule   | 把pm2本身的日志也进行分割                                    |
| workerInterval | 设置启动几个工作进程监控日志尺寸，最小为1                    |
| rotateInterval | 设置强制分割，默认值是0 0 * * *，意思是每天晚上0点分割，这个足够了个人觉得 |

**设置pm2-logrotat**

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

> 如果想后面直接看配置，也可以通过指令`pm2 conf pm2-logrotate`来查看详细的配置

## 结合Dockerfile部署Nextjs

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

部署后查看日志形式以指定的方式分割存储，再也不用担心日志文件过大导致磁盘空间不足

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

可以输入`pm2 flush`删除日志

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