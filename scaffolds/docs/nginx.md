---
title: Nginx基础配置篇
date: 2017-05-08 22:35:08
tags: Nginx
categories: Back-end
---

> Nginx 配置文件在线生成: https://nginxconfig.io/

### Nginx的启动、停止与重启

- 建立软连接`Nginx`到`/usr/bin`目录下 `ln -s /usr/sbin/nginx /usr/bin`

#### 启动

- 启动代码格式：`nginx`安装目录地址 `-c nginx`配置文件地址

```
[root@LinuxServer sbin]# /usr/local/nginx/sbin/nginx -c /usr/local/nginx/conf/nginx.conf
```
#### 停止

>  nginx的停止有三种方式

**从容停止**

- 查看进程号 `ps -ef|grep nginx`

![](http://images2015.cnblogs.com/blog/848552/201601/848552-20160102182744854-1291053517.png)



- 杀死进程 kill -QUIT 2072

![](http://images2015.cnblogs.com/blog/848552/201601/848552-20160102182652354-960281274.png)

**快速停止**

- 查看进程号 `ps -ef|grep nginx`

![](http://images2015.cnblogs.com/blog/848552/201601/848552-20160102183103651-1859453208.png)

- 杀死进程 `kill -TERM 2132`  `kill -INT 2132`

![](http://images2015.cnblogs.com/blog/848552/201601/848552-20160102183340010-2024212451.png)

- 强制停止 `pkill -9 nginx`

**重启**

> 验证`nginx`配置文件是否正确

- 方法一：进入`nginx`安装目录`sbin`下，输入命令`./nginx -t`
看到如下显示`nginx.conf syntax is ok nginx.conf test is successful`说明配置文件正确

![](http://images2015.cnblogs.com/blog/848552/201601/848552-20160102184633432-1268782338.png)

- 方法二：在启动命令`-c`前加`-t`

![](http://images2015.cnblogs.com/blog/848552/201601/848552-20160102185023385-456612180.png)

**重启Nginx服务**

- 方法一：进入`nginx`可执行目录`sbin`下，输入命令`./nginx -s reload `即可

![](http://images2015.cnblogs.com/blog/848552/201601/848552-20160102185521057-1341380905.png)

- 方法二：查找当前`nginx`进程号，然后输入命令：`kill -HUP` 进程号 实现重启`nginx`服务

![](http://images2015.cnblogs.com/blog/848552/201601/848552-20160102185838167-234856506.png)


### Nginx基础配置

- 在`Nginx`目录下的`vhost或conf.d`目录下新建一个配置文件（如`poetries-80.conf`）
- 把server的内容配置进去
- 在`Nginx.conf`中的`http`下`include`配置文件
- 检测配置文件是否出错 `切换到/etc/nginx下 nginx -t`
- 重新加载配置文件 `nginx -c /usr/local/etc/nginx/nginx.conf`
- 在重启`Nginx`  `nginx -s reload`

```javascript
user  root;  //Nginx需要有有一个用户
worker_processes  2; // Nginx进程数 最大1024
pid        conf/nginx.pid; 
worker_rlimit_nofile 2048;
events {
    use epoll;
    worker_connections  2048;
}

http {
 

	server {
       listen       80;
       server_name  119.29.145.252;
	   
       location / {
           root   /usr/local/nginx/html;
           index  index.html index.htm;
        }
   }
   server {
       listen       3001;
       server_name  119.29.145.252;
	   
       location / {
           root   /usr/local/nginx/book;
           index  index.html index.htm;
        }
   }
   server {
       listen       9000;
       server_name  119.29.145.252;
	   
       location / {
           root   /usr/local/nginx/vue;
           index  index.html index.htm;
        }
   }

}

```


### 一些错误

```javascript
nginx: [error] invalid PID number “” in “/usr/local/var/run/nginx/nginx.pid”
```
- 解决办法：`nginx -c /usr/local/etc/nginx/nginx.conf`
- `nginx -s reload`

**权限问题导致Nginx 403 Forbidden错误的解决方法**

- 在`nginx.conf`头部加入一行 `user  root;`
- 重启`nginx`再访问，就可以正常访问了
