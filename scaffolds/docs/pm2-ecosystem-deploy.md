---
title: pm2用法之ecosystem部署nodejs项目
date: 2018-02-22 17:12:08
tags: 
   - Node
   - 部署
categories: Back-end
---


## 一、配置部署脚本文件

> 部署参考 http://blog.poetries.top/2018/11/18/react-ssr-next-deploy/

> 在项目根目录添加`pm2`的部署脚本文件 `ecosystem.json`

```javascript
{
    "apps": [
        "name": "movie", //对应Nginx上的配置
        "script": "app.js", //入口文件
        "env": {
            "COMON_VARIABLE": "true"
        },
        "env_production": {
            "NODE_ENV": "production"
        }
    ],
    "deploy": {
        "production": {
            "user": "poetries", //Nginx服务器上的username
            "host": ["120.120.14.21"], // 服务器地址
            "port": "3922",
            "ref": "origin/master", //从指定的分支拉取代码
            "repo": "git@github.com:poetries/poetries.github.io.git",
            "path": "/www/movie/production",//发布到服务器指定的目录下
            "ssh_options": "StrictHostKeyChecking=no",
            //构建在发布
            "post-deploy": "npm install --registry=https://registry.npm.taobao.org && grunt build && pm2 startOrRestart ecosystem.json --env production",
            "env": {
                "NODE_ENV": "production"
            }
        }
    }
}
```

## 二、配置Nginx的server

> 在`nginx`安装目录下的`vhost`中新建一个`xx-3000.conf`的配置文件

```javascript
upstream movie { // website项目的目录名称
    server 127.0.0.1:3000; // 服务器上的本地启动入口
}

// 配置server
server {
    listen 80;
    server_name movie.poetries.top; //指向的域名
    
    location / {
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forward-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_set_header X-Nginx-Proxy true;
        
        proxy_pass http://movie; // 对应上面的目录
        proxy_redirect off;
    }
    
    // 处理静态资源
    location ~* ^.+\.(jpg|jpeg|gif|png|ico|css|js|pdf|txt) {
        root /www/movie/public; //静态资源路径
    }
}
```

## 三、开启防火墙

> Ubuntu的设置

- 打开 `sudo vi /etc/iptables.up.rules`
- 生效 `sudo iptables-restore < /etc/iptables.up.rules`

```bash
# movie
-A INPUT -s 127.0.0.1 -p tcp --destination-port 3001 -m state ESTABLISHED -j ACCEPT

-A OUTPUT -s 127.0.0.1 -p tcp --destination-port 3001 -m state ESTABLISHED -j ACCEPT
```

## 四、部署命令

- `pm2 deploy ecosystem.json production setup` 初始化
- `pm2 deploy ecosystem.json production ` 部署

