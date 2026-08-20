---
title: Nginx极简教程，反向代理负载均衡与跨域常用配置
description: Nginx 常用场景配置实战，覆盖 http/https 反向代理、upstream 负载均衡、一个域名挂多个 webapp、静态站点与 SPA history 路由、文件服务器和 CORS 跨域，逐条解释配置项含义与常见踩坑点。
date: 2019-03-10 10:35:08
tags: 
  - Nginx
  - 反向代理
  - 运维
categories: Back-end
---

前端项目打包完扔到服务器上，接下来就是绕不开的 Nginx。配反向代理、配 HTTPS、配跨域、配 SPA 的 history 路由，这几件事几乎每个项目都要做一遍。但网上的配置片段大多是复制来复制去的，注释还停留在好几年前，照抄下来能跑，出了问题就完全不知道该动哪一行。

这篇把我平时用得最多的几套 Nginx 配置整理出来，每个配置块都说清楚它在解决什么问题、哪些参数是关键、哪些是可以不管的。原文里有几处写错的地方（拼错的 header 名、永远匹配不上的跨域判断、注释和实际行为相反的 SSL 配置）我也一并改正并说明了原因。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 反向代理和正向代理到底反在哪
- Nginx 常用命令，以及 `-t` 为什么每次改配置都该敲一遍
- 一份完整的 http 反向代理配置，逐段解释每一项
- 负载均衡的 upstream 配置与几种分发策略
- 一个域名挂多个 webapp，以及 `proxy_pass` 结尾那个斜杠的坑
- https 反向代理需要额外配什么
- 静态站点配置，以及 SPA 刷新 404 的正确解法
- 用 autoindex 快速搭一个文件服务器
- CORS 跨域配置，以及原文那段配置为什么不生效

## 一、概述

### 1.1 什么是 Nginx

Nginx（engine x）是一款轻量级的 Web 服务器、反向代理服务器及电子邮件（IMAP/POP3）代理服务器。

![Nginx 架构与工作模式示意](https://s.poetries.top/gitee/2019/10/512.png)

它出名的地方在于用很小的内存开销扛住很高的并发。原因是它用的是事件驱动加异步非阻塞的模型，一个 worker 进程可以同时处理成千上万个连接，而不是传统那种一个连接一个线程的做法。这也是为什么静态资源交给 Nginx 处理比交给 Node 或者 Java 应用要划算得多。

### 1.2 什么是反向代理

反向代理（Reverse Proxy）方式是指以代理服务器来接受 internet 上的连接请求，然后将请求转发给内部网络上的服务器，并将从服务器上得到的结果返回给 internet 上请求连接的客户端，此时代理服务器对外就表现为一个反向代理服务器。

这个定义读起来有点绕，我一直觉得用「代理谁」来记最清楚。

正向代理是代理客户端。你翻墙用的那种代理，服务端不知道真实的你是谁，只知道请求是从代理服务器来的。客户端是知情的，是它主动配了代理。

反向代理是代理服务端。客户端以为自己在跟 `www.helloworld.com` 说话，实际上背后可能是三台机器在轮流回应。客户端完全不知情，它眼里只有那一个入口。

所以反向代理的价值就出来了：隐藏真实的后端拓扑、在入口处统一做 SSL 终止和日志、可以随时增减后端机器而不影响外部、静态资源在这一层就直接返回不用打到应用服务器。

## 二、常用命令

Nginx 的使用比较简单，就是几条命令。

```
nginx -s stop       快速关闭Nginx，可能不保存相关信息，并迅速终止web服务。
nginx -s quit       平稳关闭Nginx，保存相关信息，有安排的结束web服务。
nginx -s reload     因改变了Nginx相关配置，需要重新加载配置而重载。
nginx -s reopen     重新打开日志文件。
nginx -c filename   为 Nginx 指定一个配置文件，来代替缺省的。
nginx -t            不运行，而仅仅测试配置文件。nginx 将检查配置文件的语法的正确性，并尝试打开配置文件中所引用到的文件。
nginx -v            显示 nginx 的版本。
nginx -V            显示 nginx 的版本，编译器版本和配置参数。
```

这里面真正天天用的就三条，说一下它们的区别。

`nginx -t` 是每次改完配置必须敲的。它只做语法检查不重启服务，配置写错了它会告诉你错在第几行。跳过这一步直接 `reload`，如果配置有语法错误，Nginx 会拒绝加载新配置，虽然老配置还在跑不至于挂，但你以为改生效了实际没有，这种情况排查起来最费时间。

`stop` 和 `quit` 的区别在于对现有连接的处理。`stop` 是立刻终止，正在传输的请求会被掐断；`quit` 会等当前请求处理完再退出。线上操作一律用 `quit`。

`reload` 是热加载，它会用新配置起一批新的 worker 进程，老的 worker 处理完手上的请求后自然退出，整个过程对用户无感。日常改配置用它就够了，基本不需要重启服务。

`reopen` 用在日志切割之后。你把 `access.log` 改名归档了，Nginx 手里还攥着原来那个文件句柄，会继续往改了名的文件里写，敲一下 `reopen` 它才会重新打开新文件。用 `logrotate` 做日志切割的时候，切完必须配这一步。

如果不想每次都敲命令，可以在 Nginx 安装目录下新添一个启动批处理文件 `startup.bat`，双击即可运行。

```
@echo off
rem 如果启动前已经启动nginx并记录下pid文件，会kill指定进程
nginx.exe -s stop

rem 测试配置文件语法正确性
nginx.exe -t -c conf/nginx.conf

rem 显示版本信息
nginx.exe -v

rem 按照指定配置去启动nginx
nginx.exe -c conf/nginx.conf
```

如果是运行在 Linux 下，写一个 shell 脚本，大同小异。不过 Linux 上现在更常见的做法是交给 systemd 管理，`systemctl reload nginx` 这类命令由发行版的包维护者配好，不用自己写脚本。

## 三、http 反向代理配置

先实现一个小目标：不考虑复杂的配置，仅仅是完成一个 http 反向代理。

`conf/nginx.conf` 是 Nginx 的默认配置文件，你也可以使用 `nginx -c` 指定你的配置文件。

先看全局和 events 这两段。

```nginx
#运行用户
#user somebody;

#启动进程,通常设置成和cpu的数量相等
worker_processes  1;

#全局错误日志
error_log  D:/Tools/nginx-1.10.1/logs/error.log;
error_log  D:/Tools/nginx-1.10.1/logs/notice.log  notice;
error_log  D:/Tools/nginx-1.10.1/logs/info.log  info;

#PID文件，记录当前启动的nginx的进程ID
pid        D:/Tools/nginx-1.10.1/logs/nginx.pid;

#工作模式及连接数上限
events {
    worker_connections 1024;    #单个后台worker process进程的最大并发链接数
}
```

`worker_processes` 现在一般直接写 `auto`，Nginx 会自己按 CPU 核心数来定，比写死数字省心。注意在容器里跑的时候，它读到的可能是宿主机的核心数，如果给容器限了 CPU，这里最好按限额写死。

`worker_connections` 乘以 `worker_processes` 就是这台机器的理论最大连接数。1024 这个值在真实业务下偏小，压力上来会看到 `worker_connections are not enough` 这个错。但光改这个不够，还得同时把系统的文件描述符上限（`ulimit -n`）提上去，不然改了也白改。这个我踩过，只改了 Nginx 配置没改系统限制，压测时连接数怎么都上不去。

`error_log` 写了三行不同级别，实际是最后一条生效。Nginx 的 `error_log` 在同一个层级下只有最后一次声明有效，前面两条是被覆盖掉的。想同时记多个级别，得写在不同的 server 块里。

接着是 http 段的通用配置。

```nginx
http {
    #设定mime类型(邮件支持类型),类型由mime.types文件定义
    include       D:/Tools/nginx-1.10.1/conf/mime.types;
    default_type  application/octet-stream;

    #设定日志
    log_format  main  '[$remote_addr] - [$remote_user] [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log    D:/Tools/nginx-1.10.1/logs/access.log main;
    rewrite_log     on;

    #sendfile 指令指定 nginx 是否调用 sendfile 函数（zero copy 方式）来输出文件，对于普通应用，
    #必须设为 on,如果用来进行下载等应用磁盘IO重负载应用，可设置为 off，以平衡磁盘与网络I/O处理速度，降低系统的uptime.
    sendfile        on;
    #tcp_nopush     on;

    #连接超时时间
    keepalive_timeout  120;
    tcp_nodelay        on;

    #gzip压缩开关
    #gzip  on;
```

`include mime.types` 这行别删。它负责根据文件后缀设置正确的 `Content-Type`，删了之后所有文件都按 `default_type` 也就是 `application/octet-stream` 返回，浏览器会把 CSS 和 JS 当成二进制文件下载而不是执行。「样式全丢了但资源请求是 200」这种诡异现象，十有八九是 MIME 类型的问题。

`log_format` 里的 `$http_x_forwarded_for` 很关键。经过反向代理之后，后端看到的 `$remote_addr` 是 Nginx 自己的 IP，真实客户端 IP 藏在这个头里。做访问统计和风控的时候取错了字段，你会发现所有请求都来自同一个 IP。

`sendfile on` 让内核直接把文件从磁盘送到网卡，不经过用户态，省掉两次内存拷贝。传静态文件时收益明显。

`gzip on` 这行被注释掉了，实际用的时候强烈建议打开。文本类资源（HTML、CSS、JS、JSON）压缩后一般能小到原来的三分之一以下，对首屏加载的影响比大多数前端优化手段都大。后面静态站点那节会给出完整的 gzip 配置。

最后是 upstream 和 server。

```nginx
    #设定实际的服务器列表
    upstream zp_server1{
        server 127.0.0.1:8089;
    }

    #HTTP服务器
    server {
        #监听80端口，80端口是知名端口号，用于HTTP协议
        listen       80;

        #定义使用www.xx.com访问
        server_name  www.helloworld.com;

        #首页
        index index.html;

        #指向webapp的目录
        root /var/www/helloworld;

        #编码格式
        charset utf-8;

        #代理配置参数
        proxy_connect_timeout 180;
        proxy_send_timeout 180;
        proxy_read_timeout 180;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;

        #反向代理的路径（和upstream绑定），location 后面设置映射的路径
        location / {
            proxy_pass http://zp_server1;
        }

        #静态文件，nginx自己处理
        location ~ ^/(images|javascript|js|css|flash|media|static)/ {
            root /var/www/helloworld/views;
            #过期30天，静态文件不怎么更新，过期可以设大一点，如果频繁更新，则可以设置得小一点。
            expires 30d;
        }

        #设定查看Nginx状态的地址
        location /NginxStatus {
            stub_status           on;
            access_log            on;
            auth_basic            "NginxStatus";
            auth_basic_user_file  conf/htpasswd;
        }

        #禁止访问 .htxxx 文件
        location ~ /\.ht {
            deny all;
        }

        #错误处理页面（可选择性配置）
        #error_page   404              /404.html;
        #error_page   500 502 503 504  /50x.html;
        #location = /50x.html {
        #    root   html;
        #}
    }
}
```

这段里我改了三处，说明一下原因。

第一处，原文的 `index index.html` 少了结尾的分号，Nginx 的配置指令必须以分号结尾，少了会直接语法报错起不来。

第二处，原文的 `proxy_set_header X-Forwarder-For $remote_addr;` 里 header 名拼错了，少了个 `d`，正确的是 `X-Forwarded-For`。这个错误很阴险，Nginx 完全不会报错，它会老老实实把这个不存在的头发给后端，然后后端读 `X-Forwarded-For` 读到空值。日志里客户端 IP 一片空白，你还以为是后端代码的问题。

顺带说，这里更常见的写法是 `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`。区别在于后者会把已有的 `X-Forwarded-For` 内容保留并追加，多层代理串起来的时候整条链路的 IP 都在。用 `$remote_addr` 的话会把上游传来的值覆盖掉。

第三处，原文的 `root` 指向了一个 Windows 的反斜杠路径 `D:\01_Workspace\...`。Nginx 的配置文件里路径要用正斜杠，反斜杠在 Nginx 的配置解析里是转义字符，Windows 下也应该写成 `D:/01_Workspace/...`。为了通用我换成了 Linux 风格的示例路径。

剩下几个配置块的作用。

`location ~ ^/(images|javascript|js|css|flash|media|static)/` 这一条把静态资源拦下来由 Nginx 直接读磁盘返回，不再转发给后端。这是反向代理最直接的收益之一，静态请求根本不会打扰应用服务器。`expires 30d` 给这些资源设置浏览器缓存，前提是你的构建产物文件名带 hash，否则用户会缓存住旧版本一个月。

`location /NginxStatus` 开的是 Nginx 自带的状态页，能看到当前活跃连接数、总请求数这些指标，配合 `auth_basic` 加了个基本认证防止被外部访问。做监控的时候这个端点是数据来源。

`location ~ /\.ht` 是禁止访问 `.htaccess` 这类隐藏配置文件。同样的思路可以扩展到禁止访问 `.git` 目录，这个更值得配，线上把整个 `.git` 暴露出去等于把源码送人。

配好之后验证一下。

1. 启动 webapp，注意启动绑定的端口要和 Nginx 中的 upstream 设置的端口保持一致
2. 更改 host：在 `C:\Windows\System32\drivers\etc` 目录下的 host 文件中添加一条 DNS 记录 `127.0.0.1 www.helloworld.com`
3. 启动前文中 `startup.bat` 的命令
4. 在浏览器中访问 `www.helloworld.com`，不出意外，已经可以访问了

## 四、负载均衡配置

上一个例子中代理仅仅指向一个服务器。但网站在实际运营过程中，多半都是有多台服务器运行着同样的 app，这时需要使用负载均衡来分流。Nginx 也可以实现简单的负载均衡功能。

假设这样一个应用场景：将应用部署在 `192.168.1.11:80`、`192.168.1.12:80`、`192.168.1.13:80` 三台 linux 环境的服务器上。网站域名叫 `www.helloworld.com`，公网 IP 为 `192.168.1.11`。在公网 IP 所在的服务器上部署 Nginx，对所有请求做负载均衡处理。

```nginx
http {
     #设定mime类型,类型由mime.type文件定义
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    #设定日志格式
    access_log    /var/log/nginx/access.log;

    #设定负载均衡的服务器列表
    upstream load_balance_server {
        #weigth参数表示权值，权值越高被分配到的几率越大
        server 192.168.1.11:80   weight=5;
        server 192.168.1.12:80   weight=1;
        server 192.168.1.13:80   weight=6;
    }

   #HTTP服务器
   server {
        #侦听80端口
        listen       80;

        #定义使用www.xx.com访问
        server_name  www.helloworld.com;

        #对所有请求进行负载均衡请求
        location / {
            root        /root;                 #定义服务器的默认网站根目录位置
            index       index.html index.htm;  #定义首页索引文件的名称
            proxy_pass  http://load_balance_server ;#请求转向load_balance_server 定义的服务器列表

            #以下是一些反向代理的配置(可选择性配置)
            #proxy_redirect off;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            #后端的Web服务器可以通过X-Forwarded-For获取用户真实IP
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_connect_timeout 90;          #nginx跟后端服务器连接超时时间(代理连接超时)
            proxy_send_timeout 90;             #后端服务器数据回传时间(代理发送超时)
            proxy_read_timeout 90;             #连接成功后，后端服务器响应时间(代理接收超时)
            proxy_buffer_size 4k;              #设置代理服务器（nginx）保存用户头信息的缓冲区大小
            proxy_buffers 4 32k;               #proxy_buffers缓冲区，网页平均在32k以下的话，这样设置
            proxy_busy_buffers_size 64k;       #高负荷下缓冲大小（proxy_buffers*2）
            proxy_temp_file_write_size 64k;    #设定缓存文件夹大小，大于这个值，将从upstream服务器传

            client_max_body_size 10m;          #允许客户端请求的最大单文件字节数
            client_body_buffer_size 128k;      #缓冲区代理缓冲用户端请求的最大字节数
        }
    }
}
```

`weight` 是加权轮询，权重高的分到的请求多。机器配置不一样的时候按性能给权重，这是最常用的策略。

除了默认的轮询，upstream 还支持另外两种常见方式。`ip_hash` 按客户端 IP 做哈希，同一个 IP 永远打到同一台机器，session 存在应用本地内存时必须用它，不然用户请求换台机器就掉登录。`least_conn` 是把请求给当前连接数最少的那台，适合请求处理时间差异很大的场景。

这里有几个参数踩坑率特别高，单独说说。

`client_max_body_size` 默认只有 1M。文件上传接口报 `413 Request Entity Too Large` 基本都是它，而且请求根本没到后端，你在应用日志里什么都看不到。做上传功能的时候记得先把这个值提上去。

`proxy_read_timeout` 决定后端多久没返回数据 Nginx 就断开。报表导出、大文件处理这类慢接口很容易撞上默认的 60 秒，表现是浏览器收到 504 Gateway Timeout。这里设成 90 秒，真有更慢的接口就继续往上调，但更好的做法是把慢操作改成异步任务。

`proxy_buffers` 那几个是响应缓冲区。响应体超过缓冲区大小时，Nginx 会先写到临时文件再转发，磁盘 IO 就上来了。返回大 JSON 的接口多的话，把 `proxy_buffers` 调大一点比让它频繁落盘划算。

`proxy_redirect off` 被注释掉了，实际场景里有时候需要它。后端返回 302 时 Location 头里可能带着内网地址和端口，直接透传给浏览器会跳到一个访问不到的地址上，这时候要用 `proxy_redirect` 把地址改写回外部域名。

## 五、一个域名挂多个 webapp

当一个网站功能越来越丰富时，往往需要将一些功能相对独立的模块剥离出来独立维护。这样的话通常会有多个 webapp。

举个例子：假如 `www.helloworld.com` 站点有好几个 webapp，finance（金融）、product（产品）、admin（用户中心）。访问这些应用的方式通过上下文（context）来进行区分。

```
www.helloworld.com/finance/

www.helloworld.com/product/

www.helloworld.com/admin/
```

http 的默认端口号是 80，如果在一台服务器上同时启动这 3 个 webapp 应用都用 80 端口肯定是不成的，所以这三个应用需要分别绑定不同的端口号。那么问题来了，用户在实际访问 `www.helloworld.com` 站点时，访问不同 webapp 总不会还带着对应的端口号去访问吧。所以你再次需要用到反向代理来做处理。

```nginx
http {
    #此处省略一些基本配置

    upstream product_server{
        server www.helloworld.com:8081;
    }

    upstream admin_server{
        server www.helloworld.com:8082;
    }

    upstream finance_server{
        server www.helloworld.com:8083;
    }

    server {
        #此处省略一些基本配置
        #默认指向product的server
        location / {
            proxy_pass http://product_server;
        }

        location /product/{
            proxy_pass http://product_server;
        }

        location /admin/ {
            proxy_pass http://admin_server;
        }

        location /finance/ {
            proxy_pass http://finance_server;
        }
    }
}
```

这段配置里藏着 Nginx 最经典的一个坑，值得单独讲透：`proxy_pass` 后面带不带结尾的斜杠，转发出去的路径完全不同。

上面 `location /admin/ { proxy_pass http://admin_server; }` 这种写法，`proxy_pass` 后面没有 URI 部分（`http://admin_server` 只是个 upstream 名字），Nginx 会把原始请求路径原样拼上去。用户访问 `/admin/list`，后端收到的就是 `/admin/list`。

如果改成 `proxy_pass http://admin_server/;`（结尾多一个斜杠），Nginx 会把 location 匹配到的那部分前缀去掉再拼。用户访问 `/admin/list`，后端收到的是 `/list`。

这两种行为对应两种后端。如果后端应用自己就是挂在 `/admin` 这个 context path 下的，用第一种；如果后端应用根路径就是自己的根，只是被 Nginx 挂到了 `/admin` 下面，用第二种。

搞反了会怎样？表现是 404，而且 Nginx 日志显示 200 转发成功（它确实转发了），后端日志显示 404。两边的日志各说各话，第一次遇到会懵挺久。我的排查方法是在后端加一行打印实际收到的 path，一看就知道多了还是少了前缀。

另外这里有个可以优化的地方，三个 upstream 都指向 `www.helloworld.com` 的不同端口，也就是同一台机器。这种情况下用 `127.0.0.1:8081` 这种本地地址更好，省掉一次 DNS 解析，也不用绕一圈公网。

## 六、https 反向代理配置

一些对安全性要求比较高的站点可能会使用 HTTPS（一种使用 ssl 通信标准的安全 HTTP 协议）。

这里不科普 HTTP 协议和 SSL 标准，但是使用 Nginx 配置 https 需要知道几点：

- HTTPS 的固定端口号是 443，不同于 HTTP 的 80 端口
- SSL 标准需要引入安全证书，所以在 `nginx.conf` 中你需要指定证书和它对应的 key

其他和 http 反向代理基本一样，只是在 server 部分配置有些不同。

```nginx
 #HTTPS服务器
  server {
      #监听443端口。443为知名端口号，主要用于HTTPS协议
      listen       443 ssl;

      #定义使用www.xx.com访问
      server_name  www.helloworld.com;

      #ssl证书文件位置(常见证书文件格式为：crt/pem)
      ssl_certificate      cert.pem;
      #ssl证书key位置
      ssl_certificate_key  cert.key;

      #ssl配置参数（选择性配置）
      ssl_session_cache    shared:SSL:1m;
      ssl_session_timeout  5m;
      #加密套件，这里的写法是排除不安全的 aNULL 和 MD5
      ssl_ciphers  HIGH:!aNULL:!MD5;
      ssl_prefer_server_ciphers  on;

      location / {
          root   /root;
          index  index.html index.htm;
      }
  }
```

原文这里把 `ssl_ciphers HIGH:!aNULL:!MD5;` 注释成了「数字签名，此处使用 MD5」，意思正好说反了。`!` 在这个语法里是排除的意思，这一行表达的是「只用高强度套件，并且排除掉 aNULL 和 MD5」。MD5 早就不安全了，配置的本意是禁用它而不是启用它。

关于证书配置，有两个特别容易出问题的点。

一是证书链不完整。`ssl_certificate` 这个文件里要放的是你的证书加上中间证书，拼成一条完整的链。只放自己那张证书的话，Chrome 可能因为本地缓存了中间证书而正常显示，但手机浏览器和一些 API 客户端会直接报证书不受信任。这个问题的典型症状就是「电脑上好好的手机上打不开」。

二是 HTTP 到 HTTPS 的跳转。配好 443 之后 80 端口通常要加一个跳转 server。

```nginx
server {
    listen 80;
    server_name www.helloworld.com;
    return 301 https://$host$request_uri;
}
```

用 `return 301` 而不是 `rewrite`，因为 `return` 不需要走正则匹配，性能更好也更明确。

`ssl_session_cache` 是会话复用，开着能让重复访问的客户端跳过完整的 TLS 握手，对 HTTPS 站点的性能影响不小。`shared:SSL:1m` 大约能缓存四千个会话，站点流量大的话这个值要往上调。

再补一句时效性：TLS 协议这些年变化很快，1.0 和 1.1 已经被主流浏览器弃用，现在应该只开 1.2 和 1.3（用 `ssl_protocols` 指定）。加密套件的推荐列表也在持续更新，具体配什么以官方文档和 Mozilla 的 SSL 配置生成器为准，别照抄几年前的配置。

## 七、静态站点与 SPA 路由

有时候我们需要配置静态站点（即 html 文件和一堆静态资源）。举例来说，如果所有的静态资源都放在了 `/app/dist` 目录下，我们只需要在 `nginx.conf` 中指定首页以及这个站点的 host 即可。

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    gzip on;
    gzip_types text/plain application/x-javascript text/css application/xml text/javascript application/javascript image/jpeg image/gif image/png;
    gzip_vary on;

    server {
        listen       80;
        server_name  static.zp.cn;

        location / {
            root /app/dist;
            index index.html;
            try_files $uri $uri/ /index.html;
        }
    }
}
```

然后添加 HOST `127.0.0.1 static.zp.cn`，此时在本地浏览器访问 `static.zp.cn` 就可以访问静态站点了。

这段配置我加了一行 `try_files`，因为原文那里的注释写的是「转发任何请求到 index.html」，但只有 `root` 和 `index` 两行是做不到这件事的。

这就是所有做 SPA 的人都会遇到的那个问题：首页能打开，点进详情页也正常，但在详情页按 F5 刷新就 404。

为什么会这样？因为 Vue Router 和 React Router 的 history 模式是靠浏览器的 History API 改地址栏的，整个过程没有发起请求。但你按刷新的时候，浏览器会老老实实拿着 `/detail/123` 这个路径去请求服务器，而服务器上 `/app/dist` 目录里根本没有 `detail/123` 这个文件，于是返回 404。

`try_files $uri $uri/ /index.html;` 这一行的意思是：先找有没有叫这个名字的文件，没有就找有没有这个目录，还没有就统统返回 `index.html`。前端拿到 `index.html` 之后，路由库读地址栏渲染出对应的页面，刷新就正常了。

`try_files` 的用法细节挺多的，参数顺序、最后一个参数的特殊语义、和 `location` 的配合方式都有讲究。我另外写过一篇专门讲这个的 [Nginx try_files 用法详解](https://feinterview.poetries.top/blog/nginx-try-files)，遇到刷新 404 或者需要做多级回退的场景可以看那篇。

gzip 那几行也说一下。`gzip_types` 里列的是需要压缩的 MIME 类型，注意 `text/html` 不用写，Nginx 默认就压。`application/x-javascript` 是老的 JS MIME 类型，现在标准是 `application/javascript`，两个都留着是为了兼容老浏览器。图片那几种（jpeg、gif、png）其实不该放进来，它们本身已经是压缩格式了，再 gzip 一遍几乎没有收益反而浪费 CPU，这一条建议删掉。

`gzip_vary on` 会加上 `Vary: Accept-Encoding` 响应头，告诉 CDN 和中间缓存要按压缩方式分别缓存，不加的话可能出现给不支持 gzip 的客户端返回了压缩内容的情况。

还可以补一个 `gzip_min_length 1k;`，小文件压缩后可能比原文件还大，设个下限比较合理。

## 八、搭建文件服务器

有时候团队需要归档一些数据或资料，那么文件服务器必不可少。使用 Nginx 可以非常快速便捷的搭建一个简易的文件服务。

Nginx 中的配置要点：

- 将 `autoindex` 开启可以显示目录，默认不开启
- 将 `autoindex_exact_size` 开启可以显示文件的大小
- 将 `autoindex_localtime` 开启可以显示文件的修改时间
- `root` 用来设置开放为文件服务的根路径
- `charset` 设置为 `charset utf-8,gbk;`，可以避免中文乱码问题（windows 服务器下设置后依然乱码，本人暂时没有找到解决方法）

一个最简化的配置如下。

```nginx
autoindex on;# 显示目录
autoindex_exact_size on;# 显示文件大小
autoindex_localtime on;# 显示文件时间

server {
    charset      utf-8,gbk; # windows 服务器下设置后，依然乱码，暂时无解
    listen       9050 default_server;
    listen       [::]:9050 default_server;
    server_name  _;
    root         /share/fs;
}
```

`autoindex_exact_size` 这个名字有点反直觉。开启时显示的是精确字节数（比如 `1048576`），关闭时显示的才是人类友好的 `1M`。想要好读的大小，反而应该把它设成 `off`。

`listen [::]:9050` 那行是 IPv6 的监听，服务器没开 IPv6 的话这行会导致启动失败，报 `Address family not supported`，用不上就删掉。

`server_name _;` 里的下划线是个惯用写法，表示「匹配所有没有被其他 server 块认领的域名」，配合 `default_server` 做兜底。

关于那个 Windows 下中文乱码的问题，我这边没在 Windows 服务器上验证过，但从原理上讲，`autoindex` 生成的目录页里文件名是按文件系统的编码原样输出的，Windows 的中文文件名在 NTFS 上是 UTF-16，Nginx 读出来的字节和你声明的 charset 对不上就会乱码。Linux 服务器上文件名本身就是 UTF-8，声明 `charset utf-8` 就正常了。

最后提醒一句安全问题。这种文件服务器等于把一整个目录公开了，一定要加访问控制，最简单的是配 `auth_basic` 上一层账号密码，或者用 `allow`/`deny` 限定 IP 段。直接裸奔在公网上，搜索引擎能把你的目录索引爬走。

## 九、跨域解决方案

web 领域开发中经常采用前后端分离模式。这种模式下，前端和后端分别是独立的 web 应用程序，例如后端是 Java 程序，前端是 React 或 Vue 应用。各自独立的 web app 在互相访问时势必存在跨域问题。

解决跨域一般有两种思路。

一是 CORS，在后端服务器设置 HTTP 响应头，把你需要允许访问的域名加入 `Access-Control-Allow-Origin` 中。二是 jsonp，把后端根据请求构造 json 数据并返回，前端用 jsonp 跨域。

jsonp 现在基本可以忘掉了，它只支持 GET、没法带自定义头、错误处理很别扭，纯粹是 CORS 普及之前的权宜之计。

Nginx 根据第一种思路也提供了一种解决方案。举例：`www.helloworld.com` 网站是由一个前端 app、一个后端 app 组成的。前端端口号为 9000，后端端口号为 8080。前端和后端如果使用 http 进行交互时，请求会被拒绝，因为存在跨域问题。

原文给的配置是在 `enable-cors.conf` 里这样写的。

```nginx
# allow origin list
set $ACAO '*';

# set single origin
if ($http_origin ~* (www.helloworld.com)$) {
  set $ACAO $http_origin;
}

if ($cors = "trueget") {
    add_header 'Access-Control-Allow-Origin' "$http_origin";
    add_header 'Access-Control-Allow-Credentials' 'true';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';
}

if ($request_method = 'OPTIONS') {
  set $cors "${cors}options";
}

if ($request_method = 'GET') {
  set $cors "${cors}get";
}

if ($request_method = 'POST') {
  set $cors "${cors}post";
}
```

这段配置我照原样保留了，但必须说清楚：它是跑不通的，照抄下去跨域问题解决不了。

问题有两处。一是 `$cors` 这个变量从头到尾没有被初始化成 `"true"`，判断 `$cors = "trueget"` 永远不成立，那个 `add_header` 块一次都不会执行。二是 nginx 的 `if` 是在 rewrite 阶段执行的，判断 `$cors` 的那个 `if` 写在给 `$cors` 赋值的那几个 `if` 前面，就算变量初始化了，执行到判断那一刻 `$cors` 也还是空的。

Nginx 社区有句流传很广的话叫 "if is evil"，说的就是 `if` 在 location 里的行为很反直觉，和你以为的执行顺序对不上。上面这段就是典型案例。

我自己现在会这么写，逻辑直白得多。

```nginx
location ~ ^/api/ {
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' $http_origin;
        add_header 'Access-Control-Allow-Credentials' 'true';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Content-Type,Authorization,X-Requested-With';
        add_header 'Access-Control-Max-Age' 86400;
        add_header 'Content-Length' 0;
        return 204;
    }

    add_header 'Access-Control-Allow-Origin' $http_origin always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;

    proxy_pass http://api_server;
}
```

几个关键点。

预检请求（OPTIONS）必须在 Nginx 这一层直接 `return 204` 拦掉，不要转发给后端。后端很可能没写 OPTIONS 的处理，转过去会返回 405，浏览器看到预检失败就直接把真实请求掐了。

`Access-Control-Max-Age` 让浏览器缓存预检结果，不加的话每个跨域请求前面都要多一次 OPTIONS 往返，接口一多延迟很明显。

`always` 这个参数要加。`add_header` 默认只在 2xx 和 3xx 响应上生效，后端返回 500 的时候响应头里就没有 CORS 头，浏览器把它报成跨域错误，你会以为是跨域配置有问题，实际上是接口报了 500。这个坑我排查过一次，绕了很远才发现真正的错误被跨域报错盖住了。

`Allow-Credentials` 设为 `true` 时，`Allow-Origin` 不能是 `*`，必须回显具体的 origin。这是 CORS 规范的硬性要求，两个一起配错的话浏览器会直接拒绝。

接下来在你的服务器中 include 跨域配置来引入。

```nginx
# ----------------------------------------------------
# 此文件为项目 nginx 配置片段
# 可以直接在 nginx config 中 include（推荐）
# 或者 copy 到现有 nginx 中，自行配置
# www.helloworld.com 域名需配合 dns hosts 进行配置
# 其中，api 开启了 cors，需配合本目录下另一份配置文件
# ----------------------------------------------------
upstream front_server{
  server www.helloworld.com:9000;
}
upstream api_server{
  server www.helloworld.com:8080;
}

server {
  listen       80;
  server_name  www.helloworld.com;

  location ~ ^/api/ {
    include enable-cors.conf;
    proxy_pass http://api_server;
    rewrite "^/api/(.*)$" /$1 break;
  }

  location ~ ^/ {
    proxy_pass http://front_server;
  }
}
```

`rewrite "^/api/(.*)$" /$1 break;` 这行是把 `/api` 前缀剥掉再转给后端，效果和前面讲的 `proxy_pass` 带斜杠类似。`break` 表示停止继续匹配 rewrite 规则，用当前结果去处理请求，不加的话会重新走一遍 location 匹配，容易绕成死循环。

最后说一句思路上的事。前端和后端如果能挂在同一个域名下（前端走 `/`，接口走 `/api`），由 Nginx 统一代理过去，那就根本不存在跨域，CORS 这一套全都省了。我自己更倾向这种做法，配置简单、少一次预检请求、Cookie 也不用处理 SameSite 的问题。CORS 是给「确实必须跨域」的场景准备的，不是默认方案。

## 总结

Nginx 的配置项非常多，但日常真正要理解的就那么几块。

反向代理这块，`proxy_set_header` 里的 `Host` 和 `X-Forwarded-For` 一定要配对，后端拿不到真实 IP 基本都是这里的问题，而且 `X-Forwarded-For` 拼错了 Nginx 一声不吭。多层代理用 `$proxy_add_x_forwarded_for` 而不是 `$remote_addr`。

`proxy_pass` 结尾那个斜杠决定了路径前缀是否被剥掉，配错的表现是 Nginx 日志显示转发成功、后端日志显示 404，两边对不上。这是最值得记住的一个细节。

静态资源这块，`include mime.types` 不能删，`gzip` 该开就开但别把图片放进 `gzip_types`。SPA 刷新 404 靠 `try_files $uri $uri/ /index.html` 解决，这一行几乎是每个前端项目的标配。

跨域这块，能同域就同域，实在要 CORS 的话记住三条：OPTIONS 预检在 Nginx 层 `return 204` 拦掉、`add_header` 要加 `always` 否则 5xx 响应上没有跨域头、`Allow-Credentials: true` 时 `Allow-Origin` 不能写 `*`。

还有一条习惯上的建议：改完配置先 `nginx -t`，再 `nginx -s reload`。这两条命令加起来两秒钟，能省掉「以为改生效了其实没有」带来的半小时排查。

## 参考

- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Nginx proxy_pass 指令说明](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass)
- [Nginx try_files 指令说明](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)
- [Nginx ngx_http_ssl_module 文档](https://nginx.org/en/docs/http/ngx_http_ssl_module.html)
- [Mozilla SSL 配置生成器](https://ssl-config.mozilla.org/)
- [MDN 跨源资源共享 CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [前端进阶之旅](https://interview.poetries.top)
