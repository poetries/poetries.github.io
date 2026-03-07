---
title: forever and pm2部署nodejs项目
date: 2017-05-09 22:50:08
tags: 
   - Node
   - 部署
categories: Back-end
---

## 一、forever

> `forever`则可以在`cmd`或`ssh`连接断开时,让项目一直运行,而且可以在项目崩溃时自动重启

- 安装 `npm install -g forever`
- `forever`的帮助手册  `forever --help`
- 使用`forever`启动项目 `forever start app.js`
- 使用`forever`停止项目 `forever stop app.js`
- 列出所有通过`forever`管理的项目 `forever list`
- 监视项目中的文件,当文件有变动时重启项目 `forever -w start app.js`


## 二、pm2

> 部署参考 http://blog.poetries.top/2018/11/18/react-ssr-next-deploy/


- 安装pm2 `npm install -g pm2`
- 运行` pm2 start app.js`
- 查看运行状态 `pm2 list`
- 追踪资源运行情况 `pm2 monit`
- 查看日志 `pm2 logs`
- 重启应用 `pm2 restart appId`
- 停止应用  `pm2 stop app.js`
- 开启`api`访问 `pm2 web`
 
**预定义运行配置文件**
> 我们可以预定义一个配置文件，然后制定运行这个配置文件，比如我们定义一个文件`process.json`，内容如下

```
{
  "apps": [
    {
      "name": "ANodeBlog",
      "script": "bin/www",
      "watch": "../",
      "log_date_format": "YYYY-MM-DD HH:mm Z"
    }
  ]
}
```
-  然后`pm2 start process.json`

**pm2与forever对比**

|Feature|	Forever	|PM2|
|----|----|----|
|Keep Alive	|✔|	✔|
|Coffeescript|✔|	|
|Log aggregation	||	✔|
|API	|	|✔|
|Terminal monitoring	||	✔|
|Clustering	||	✔|
|JSON configuration| |		✔|
