---
title: pm2使用小结
date: 2018-11-19 15:12:08
tags: 
   - 部署
   - pm2
categories: Back-end
---

## 一、PM2的主要特性

- 内建负载均衡（使用`Node cluster` 集群模块）
- 后台运行
- `0`秒停机重载，我理解大概意思是维护升级的时候不需要停机
- 具有`Ubuntu`和`CentOS` 的启动脚本
- 停止不稳定的进程（避免无限循环）
- 控制台检测
- 提供 `HTTP API`
- 远程控制和实时的接口`API` ( `Nodejs` 模块,允许和`PM2`进程管理器交互 )

## 二、基本用法

- `$ npm install -g pm2` 命令行全局安装`pm2`
- `$ pm2 start app.js` 启动`app`项目
- `$ pm2 list` 列出由`pm2`管理的所有进程信息，还会显示一个进程会被启动多少次，因为没处理的异常

![](https://poetries1.gitee.io/img-repo/2019/10/395.png)

- `pm2 describe id` 查看启动程序的详细信息

![](https://poetries1.gitee.io/img-repo/2019/10/396.png)

- `$ pm2 monit` 监视每个`node`进程的`CPU`和内存的使用情况

![](https://poetries1.gitee.io/img-repo/2019/10/397.png)

- `$ pm2 logs` 显示所有进程日志

![](https://poetries1.gitee.io/img-repo/2019/10/398.png)

- 强大API： `pm2 web`

> 你想要监控所有被`PM2`管理的进程,而且同时还想监控运行这些进程的机器的状态

![](https://poetries1.gitee.io/img-repo/2019/10/399.png)

> 启动程序的时候顺便在浏览器访问：`http://localhost:9615`。部署的服务器的信息和程序的信息都显示出来了

**常用命令总结**

- `$ pm2 stop all` 停止所有进程
- `$ pm2 restart all` 重启所有进程
- `$ pm2 reload all` `0`秒停机重载进程 (用于 `NETWORKED` 进程)
- `$ pm2 stop`  停止指定的进程
- `$ pm2 restart`  重启指定的进程
- `$ pm2 startup` 产生 `init` 脚本 保持进程活着
- `$ pm2 delete`  杀死指定的进程
- `$ pm2 delete all` 杀死全部进程

**运行进程的不同方式**

- `$ pm2 start app.js -i max` 根据有效`CPU`数目启动最大进程数目
- `$ pm2 start app.js -i 3` 启动`3`个进程
- `$ pm2 start app.js -x `用`fork`模式启动 `app.js` 而不是使用 `cluster`
- `$ pm2 start app.js -x -- -a 23` 用fork模式启动 `app.js` 并且传递参数 (`-a 23`)
- `$ pm2 start app.js --name serverone` 启动一个进程并把它命名为 `serverone`
- `$ pm2 stop serverone` 停止 `serverone `进程
- `$ pm2 start app.json `启动进程, 在 `app.json`里设置选项
- `$ pm2 start app.js -i max -- -a 23` 在`--`之后给 `app.js` 传递参数
- `$ pm2 start app.js -i max -e err.log -o out.log `启动 并 生成一个配置文件


> 推荐使用`pm2 start npm --watch --name <taskname> -- run start`

![](https://poetries1.gitee.io/img-repo/2019/10/400.png)

## 三、配置pm2启动文件

> 部署参考 http://blog.poetries.top/2018/11/18/react-ssr-next-deploy/

> 在项目根目录添加一个processes.json： 内容如下

```js
// apps:json结构，apps是一个数组，每一个数组成员就是对应一个pm2中运行的应用
{
  "apps": [
    {
      "name": "goods",// 启动任务名
      "cwd": "/srv/node-app/current",// 应用程序所在的目录
      "script": "server.js", // 启动入口(应用程序的脚本路径)
      "log_date_format": "YYYY-MM-DD HH:mm Z", //日志格式化和monent一致
      "error_file": "/var/log/node-app/node-app.stderr.log",//自定义应用程序的错误日志文件
      "out_file": "log/node-app.stdout.log", // 日志输出路径 
      "pid_file": "pids/node-geo-api.pid",//自定义应用程序的pid文件
      "instances": 6, 
      //最小运行时间，这里设置的是60s即如果应用程序在60s内退出，pm2会认为程序异常退出，此时触发重启max_restarts设置数量
      "min_uptime": "200s",
      //设置应用程序异常退出重启的次数，默认15次（从0开始计数）
      "max_restarts": 10,
      "max_memory_restart": "1M",
      // 定时启动，解决重启能解决的问题
      "cron_restart": "1 0 * * *",
      // 是否启用监控模式，默认是false。如果设置成true，当应用程序变动时，pm2会自动重载。这里也可以设置你要监控的文件
      "watch": false,
      "merge_logs": true, // 合并多个任务日志
      // 应用程序的脚本类型，这里使用的shell，默认是nodejs
      "exec_interpreter": "node",
      // 应用程序启动模式，这里设置的是cluster_mode（集群），默认是fork
      "exec_mode": "fork",
      // 启用/禁用应用程序崩溃或退出时自动重启
      "autorestart": false,
      // 启用/禁用vizion特性(版本控制)
      "vizion": false
    }
  ]
}
```


> 可以通过`pm2 start processes.json`来启动。也可以把命令写在`package.json`里

`npm run pm2`

```js
"scripts": {
  "pm2":"pm2 start processes.json"
}
```

## 四、Pm2部署

> 在项目根目录添加`pm2`的部署脚本文件 `ecosystem.json`

```js
{
  "apps": [
      {
        "name": "goodsapp", //pm2运行的应用名称
        "script": "server.js",//服务启动入口
        "env":{
            "COMON_VARIABLE": "true"
        },
        "env_production": {
            "NODE_ENV": "production", //env
            "HOST": "localhost"
        }
      }
  ],
  "deploy": {
      // 应用名称，可以自定义，最后这样使用 pm2 deploy ecosystem.json goodsapp
      "goodsapp": {
          "user": "user_00",// 服务器用户名
          "host": ['192.68.1.201'],//服务器ip地址 可写多个
          "port": "9999",//服务器端口
          "ref": "origin/master",//从指定分支拉取代码
          "repo": "http://p.yesdat.com/diffusion/49/goodsh.git",
          "path": "/data/poetry/testDir/prev-goods.yesdat.com", //上传本地目录到服务器
          "ssh_options": "StrictHostKeyChecking=no",
          "post-deploy": "npm install --registry=https://registry.npm.taobao.org && npm install && pm2 startOrRestart ecosystem.json --env production",//部署脚本
          "env": {
              "NODE_ENV": "production"
          }
      }
  }
}
```

**启动**

- `pm2 deploy ecosystem.json goodsapp setup` 初始化
- `pm2 deploy ecosystem.json goodsapp` 部署

## 参考

- [PM2官方文档](http://pm2.keymetrics.io/docs/usage/quick-start/#installation)
