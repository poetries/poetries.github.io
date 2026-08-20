---
title: Nginx学习篇，从编译安装到配置文件结构入门
description: Nginx 入门系统梳理，从 yum 依赖、编译安装、开机自启到 master/worker 进程模型、nginx.conf 的上下文层级、常用变量与正则，把配置文件为什么长这样讲清楚。
date: 2018-02-25 15:12:08
tags:
  - Nginx
  - 服务器
  - 运维
categories: Back-end
---

> Nginx 配置文件在线生成: https://nginxconfig.io/

第一次打开 `nginx.conf`，看到 `main`、`events`、`http`、`server`、`location` 一层套一层的大括号，多数人的反应是先去搜一段能用的配置贴进去。能跑起来，但下次要改哪一行、为什么某个指令写在这层就报错、`reload` 到底做了什么，全都是黑箱。

这篇是我把 Nginx 从头装一遍、再把配置文件结构拆开看的记录。重点不在于给你多少段能直接抄的配置，而是把「为什么是这个结构」讲明白，包括编译参数怎么选、master 和 worker 各自在干什么、上下文继承的规则是什么、那一堆 `$` 开头的变量分别从哪来。看懂这些，后面遇到任何一段陌生配置，你都能读懂它在做什么。

至于反向代理、负载均衡、HTTPS、跨域这些具体场景怎么配，本篇会给出配置和基本说明，展开的实战细节放在了 [工作中常用的 Nginx 配置总结回顾](https://feinterview.poetries.top/blog/nginx-config) 那篇里，两篇配合着看。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 编译安装 Nginx 的完整流程，以及 `./configure` 那些参数到底在决定什么
- 开机自启动的两种做法，systemd 和 rc.local 各自适用什么场景
- 启动、重载、平滑退出这几条运维命令的区别
- master 和 worker 的分工，以及 `reload` 为什么能不断连接
- `nginx.conf` 的上下文层级，哪些指令只能写在哪一层
- 常用正则、内置变量和单位符号速查
- 反向代理、负载均衡、性能优化和常见场景配置的入门版本

先说一句，下面的安装步骤是 2018 年在 CentOS 上做的记录，命令和路径都保留原样。今天如果只是想快点用起来，直接 `yum install nginx` 或者 `apt install nginx` 就够了，发行版的包已经把常用模块编译进去了。但编译安装这一遍还是建议走一次，因为它逼着你去看每个 `--with-` 参数是什么意思，这个理解后面查问题时反复用得上。

`Nginx` 是一款面向性能设计的 `HTTP` 服务器，能反向代理 `HTTP`，`HTTPS` 和邮件相关(`SMTP`，`POP3`，`IMAP`)的协议链接。并且提供了负载均衡以及 `HTTP` 缓存。它的设计充分使用异步事件模型，削减上下文调度的开销，提高服务器并发能力。采用了模块化设计，提供了丰富的第三方模块。

所以关于 `Nginx` 有这些标签：「异步」「事件」「模块化」「高性能」「高并发」「反向代理」「负载均衡」。

这几个词里最核心的是「事件驱动」。传统的 Apache prefork 模式是一个连接一个进程，一万个并发连接就要一万个进程，内存直接爆掉。Nginx 用的是 epoll 这类 I/O 多路复用，一个 worker 进程在一个循环里轮询所有连接，谁有数据就处理谁，几万个连接也只占几个进程的内存。这个差别就是为什么同样一台机器，Nginx 扛并发的能力能高出一个数量级。

代价是编程模型受限，worker 里不能有阻塞操作，一个慢的磁盘读会卡住整个 worker 上的所有连接。这也是为什么后面 `sendfile`、`aio`、`open_file_cache` 这些围绕 I/O 的优化项那么重要。

## 一、安装

### 1.1 安装依赖

> `prce`(重定向支持)和`openssl`(`https`支持，如果不需要`https`可以不安装)

```bash
yum install -y pcre-devel 
yum -y install gcc make gcc-c++ wget
yum -y install openssl openssl-devel 
```

`CentOS 6.5` 我安装的时候是选择的「基本服务器」，默认这两个包都没安装全，所以这两个都运行安装即可。

这三行 `yum` 装的东西各有各的用处，值得说清楚，因为漏装哪个，`./configure` 报的错都不一样。

`pcre-devel` 提供正则引擎，Nginx 的 `location ~` 正则匹配和整个 `rewrite` 模块都靠它。不装的话 `./configure` 会直接停下来说找不到 PCRE。`openssl-devel` 是 HTTPS 的前提，不装就没法编译 `http_ssl_module`，那你这台 Nginx 永远只能跑 80 端口。`gcc`、`make`、`gcc-c++` 是编译工具链，最小化安装的系统上通常都没有。

注意包名带 `-devel` 后缀的是开发库，包含头文件，编译时必需；只装不带后缀的运行库是不够的。这个细节在 Debian 系上对应的是 `-dev` 后缀，包名叫 `libpcre3-dev` 和 `libssl-dev`。

### 1.2 下载

[nginx的所有版本在这里](http://nginx.org/download/)

```bash
wget http://nginx.org/download/nginx-1.13.3.tar.gz
wget http://nginx.org/download/nginx-1.13.7.tar.gz

# 如果没有安装wget
# 下载已编译版本
$ yum install wget

# 解压压缩包
tar zxf nginx-1.13.3.tar.gz
```

版本选择上有个规矩要知道。Nginx 的版本号第二位是偶数表示稳定版（stable），奇数是主线版（mainline）。这里下的 1.13 就是主线版，新功能先进这里；生产环境按惯例用 stable 分支。不过 Nginx 官方自己是推荐用 mainline 的，理由是它其实很稳，而且能更早拿到 bug 修复。我的做法是自己的服务器用 stable，图省心。

上面这段同时下了 1.13.3 和 1.13.7 两个版本，实际用的时候挑一个就行。
### 1.3 编译安装

然后进入目录编译安装，[configure参数说明](#configure参数说明)

```bash
cd nginx-1.11.5
./configure


....
Configuration summary
  + using system PCRE library
  + OpenSSL library is not used
  + using system zlib library

  nginx path prefix: "/usr/local/nginx"
  nginx binary file: "/usr/local/nginx/sbin/nginx"
  nginx modules path: "/usr/local/nginx/modules"
  nginx configuration prefix: "/usr/local/nginx/conf"
  nginx configuration file: "/usr/local/nginx/conf/nginx.conf"
  nginx pid file: "/usr/local/nginx/logs/nginx.pid"
  nginx error log file: "/usr/local/nginx/logs/error.log"
  nginx http access log file: "/usr/local/nginx/logs/access.log"
  nginx http client request body temporary files: "client_body_temp"
  nginx http proxy temporary files: "proxy_temp"
  nginx http fastcgi temporary files: "fastcgi_temp"
  nginx http uwsgi temporary files: "uwsgi_temp"
  nginx http scgi temporary files: "scgi_temp"
```

> 安装报错误的话比如：`C compiler cc is not found`，这个就是缺少编译环境，安装一下就可以了 `yum -y install gcc make gcc-c++ openssl-devel`

如果没有`error`信息，就可以执行下边的安装了：

```bash
make
make install
```

这里有个坑要注意，上面的 `./configure` 输出里写着 `OpenSSL library is not used`，意思是这次编译没带 SSL 模块。也就是说这样装出来的 Nginx 配 `listen 443 ssl` 会直接报错说不认识这个参数。想要 HTTPS，`./configure` 后面必须显式加上 `--with-http_ssl_module`。

这就是编译安装最容易翻车的地方：`./configure` 不带参数跑一遍确实能装上，但装出来的是个功能最小集。我第一次装完发现 HTTPS 配不了，还以为是证书的问题，排查了半天才反应过来是模块没编进去。

那份 `Configuration summary` 输出一定要逐行看完，它把安装路径、配置文件位置、日志位置全列出来了，后面找文件全靠它。特别是 `nginx configuration file` 那一行，这就是你要改的 `nginx.conf` 的绝对路径。

还有一点，`make install` 之后源码目录别删。以后要加模块得回到这个目录重新 `./configure` 再 `make`，删了就得重新下载重新配一遍参数。
### 1.4 nginx测试

- 运行下面命令会出现两个结果，一般情况`nginx`会安装在`/usr/local/nginx`目录中

```bash
cd /usr/local/nginx/sbin/
./nginx -t

# nginx: the configuration file /usr/local/nginx/conf/nginx.conf syntax is ok
# nginx: configuration file /usr/local/nginx/conf/nginx.conf test is successful
```

`nginx -t` 这条命令请养成肌肉记忆，每次改完配置都敲一遍再 reload。它只做语法检查不动服务，配置写错了会告诉你具体第几行有问题。

跳过这一步的后果是这样的：直接 `nginx -s reload`，如果新配置有语法错误，Nginx 会拒绝加载并保持旧配置继续跑。服务没挂，但你以为改生效了其实没有，改动跟着下一次重启才会暴露出来，那时候现场早就变了。这类问题排查起来特别费时间。

`-t` 还会尝试打开配置里引用到的所有文件，证书路径写错、include 的文件不存在，它一并能查出来。
### 1.5 设置全局nginx命令

```bash
vi ~/.bash_profile
```

将下面内容添加到 `~/.bash_profile` 文件中

```bash
PATH=$PATH:$HOME/bin:/usr/local/nginx/sbin/
export PATH
```

运行命令 **`source ~/.bash_profile`** 让配置立即生效。你就可以全局运行 `nginx` 命令了。

这一步纯粹是为了少敲路径，但它顺带解决了一个实际问题：编译安装的 Nginx 不在系统 `PATH` 里，而很多脚本和文档默认你能直接敲 `nginx`。不配这个，写自动化脚本时到处都要写全路径。

如果这台机器有多个用户都要操作 Nginx，写到 `/etc/profile.d/` 下建个 `.sh` 文件比改单个用户的 `.bash_profile` 更合适。

## 二、开机自启动

服务器重启之后 Nginx 不会自己起来，这件事一定要在上线前解决掉，不然某次机房断电恢复后你的站点就一直是 502。下面两种做法，systemd 是现在的标准答案，`rc.local` 是老系统的兜底方案。

**开机自启动方法一**

- 编辑 **`vi /lib/systemd/system/nginx.service`** 文件，没有创建一个 **`touch nginx.service`** - 然后将如下内容根据具体情况进行修改后，添加到`nginx.service`文件中：

```bash
[Unit]
Description=nginx
After=network.target remote-fs.target nss-lookup.target

[Service]

Type=forking
PIDFile=/var/run/nginx.pid
ExecStartPre=/usr/local/nginx/sbin/nginx -t -c /usr/local/nginx/conf/nginx.conf
ExecStart=/usr/local/nginx/sbin/nginx -c /usr/local/nginx/conf/nginx.conf
ExecReload=/bin/kill -s HUP $MAINPID
ExecStop=/bin/kill -s QUIT $MAINPID
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

这份 unit 文件里有几行值得单独说。

`Type=forking` 对应 Nginx 的默认行为，它启动后会 fork 出 master 进程然后前台进程退出，systemd 得知道这一点才不会误判成启动失败。配套的 `PIDFile` 让 systemd 知道该盯哪个进程，这两行要一起对。这里 `PIDFile=/var/run/nginx.pid` 和编译时的默认路径 `/usr/local/nginx/logs/nginx.pid` 不一致，实际用的时候要么改 unit 文件，要么在 `nginx.conf` 里用 `pid` 指令指到同一个位置，否则 systemd 会认为服务没起来。

`ExecStartPre` 那行是在启动前先跑一遍 `nginx -t`，配置有错就不启动，避免带着坏配置重启导致服务彻底起不来。这个设计很值得抄。

`ExecReload=/bin/kill -s HUP $MAINPID` 就是平滑重载的底层实现，`nginx -s reload` 干的也是同一件事，给 master 发 HUP 信号。`ExecStop` 用的 `QUIT` 信号是优雅退出，等现有请求处理完再关，不用 `TERM` 是因为那个会直接掐断连接。

```
[Unit]:服务的说明  
Description:描述服务  
After:描述服务类别  
[Service]服务运行参数的设置  
Type=forking是后台运行的形式  
ExecStart为服务的具体运行命令  
ExecReload为重启命令  
ExecStop为停止命令  
PrivateTmp=True表示给服务分配独立的临时空间  
注意：[Service]的启动、重启、停止命令全部要求使用绝对路径  
[Install]运行级别下服务安装的相关设置，可设置为多用户，即系统运行级别为3  
```

保存退出。

设置开机启动，使配置生效：

```bash
systemctl enable nginx.service
# 输出下面内容表示成功了
Created symlink from /etc/systemd/system/multi-user.target.wants/nginx.service to /usr/lib/systemd/system/nginx.service.
```

**开机自启动方法二**

```bash
vi /etc/rc.local

# 在 rc.local 文件中，添加下面这条命令
/usr/local/nginx/sbin/nginx start
```

- 如果开机后发现自启动脚本没有执行，你要去确认一下`rc.local`这个文件的访问权限是否是可执行的，因为`rc.local`默认是不可执行的。修改`rc.local`访问权限，增加可执行权限：

```bash
chmod +x /etc/rc.d/rc.local
```

这两种方式的取舍很清楚。systemd 能自动拉起崩溃的进程、能统一看日志、能管理依赖顺序，只要系统是 CentOS 7 以上就该用它。`rc.local` 只是开机时执行一遍命令，进程挂了没人管，属于兜底方案。

另外 `rc.local` 那行写的是 `nginx start`，Nginx 本身没有 `start` 子命令，直接敲二进制路径就是启动，多余的参数会被当成错误。真要写进 `rc.local`，去掉后面的 `start`。

## 三、运维

装完之后日常打交道的就是这么几条命令，它们的区别看着细微，线上操作时选错了后果差别很大。

### 3.1 服务管理

```bash
# 启动
/usr/local/nginx/sbin/nginx

# 重启
/usr/local/nginx/sbin/nginx -s reload

# 关闭进程
/usr/local/nginx/sbin/nginx -s stop

# 平滑关闭nginx
/usr/local/nginx/sbin/nginx -s quit

# 查看nginx的安装状态，
/usr/local/nginx/sbin/nginx -V 
```

`-s reload` 和真正的重启完全不是一回事。它是给 master 发信号，master 用新配置起一批新 worker，老 worker 处理完手上的请求后自己退出，全程没有一个连接被掐断。所以改配置用 reload 就够了，几乎不需要 restart。

`stop` 和 `quit` 的区别在于对现有连接的处理。`stop` 是立刻终止，正在传输的请求直接断；`quit` 会等当前请求处理完再退出。线上操作一律用 `quit`，这个没有例外。

`nginx -V`（大写 V）输出的信息量比想象中大得多，它会打印出编译时的所有 `configure arguments`。想知道这台机器上的 Nginx 到底带了哪些模块，看这一行就够了，比翻文档快。配置报 `unknown directive` 的时候，第一件事就是敲 `nginx -V` 确认模块在不在。小写的 `-v` 只显示版本号。
**关闭防火墙，或者添加防火墙规则就可以测试了**

```bash
service iptables stop
```

或者编辑配置文件：

```bash
vi /etc/sysconfig/iptables
```

添加这样一条开放80端口的规则后保存：

```bash
-A INPUT -m state --state NEW -m tcp -p tcp --dport 80 -j ACCEPT
```

重启服务即可:

```bash
service iptables restart
# 命令进行查看目前nat
iptables -t nat -L
```

这段防火墙操作是很多人装完 Nginx 第一个卡住的地方。本机 `curl 127.0.0.1` 一切正常，外网就是打不开，八成是防火墙没放行 80 端口。判断方法很简单，在服务器上 `curl localhost` 通、从别的机器 `telnet 服务器IP 80` 不通，那就是网络层拦的。

生产环境别用 `service iptables stop` 图省事，加一条放行规则才是对的做法。云服务器还有一层安全组要配，阿里云、腾讯云的控制台上单独设置，这一层我见过不少人漏掉，在机器上怎么查都查不出问题。
### 3.2 重启服务防火墙报错解决


```bash
service iptables restart
# Redirecting to /bin/systemctl restart  iptables.service
# Failed to restart iptables.service: Unit iptables.service failed to load: No such file or directory.
```

- 在`CentOS 7`或`RHEL 7`或`Fedora`中防火墙由 **`firewalld`** 来管理，当然你可以还原传统的管理方式。或则使用新的命令进行管理。
假如采用传统请执行一下命令

```bash
# 传统命令
systemctl stop firewalld
systemctl mask firewalld
```

```bash
# 安装命令
yum install iptables-services

systemctl enable iptables 
service iptables restart
```

这个报错的原因是 CentOS 7 换了防火墙前端，默认装的是 `firewalld` 而不是 `iptables-services`，所以 `service iptables restart` 找不到对应的 unit。上面给的是还原成传统 iptables 的做法。

如果不想折腾，直接用 firewalld 的命令更简单：`firewall-cmd --permanent --add-service=http` 加上 `firewall-cmd --reload` 就放行了 80 端口。两套工具底层都是 netfilter，选一套用到底，别混着来，混用的结果是规则互相覆盖，排查时怀疑人生。

## 四、nginx卸载

装错了或者要换版本的时候会用到。这里要特别注意编译安装和包管理安装的卸载方式完全不同，用错了会留一堆残留。

- 如果通过`yum`安装，使用下面命令安装。

```bash
yum remove nginx
```

- 编译安装，删除`/usr/local/nginx`目录即可
- 如果配置了自启动脚本，也需要删除。

删目录之前记得先把服务停掉，`nginx -s quit`，不然进程还在跑、文件没了，后面想停都停不掉，只能 `kill`。

还有一处容易漏，前面往 `~/.bash_profile` 里加的 PATH 也要一并清掉，不然下次敲 `nginx` 会提示找不到命令，还以为是新装的有问题。同理，`/lib/systemd/system/nginx.service` 这个文件删完要跑一次 `systemctl daemon-reload`。

## 五、参数说明

下面这张表是 `./configure` 支持的全部参数，量很大，不用背。真正要理解的是它们分成的三类。

第一类是 `--prefix`、`--sbin-path`、`--conf-path` 这些路径参数，决定装到哪、配置文件在哪。用发行版包安装时这些路径是包维护者定好的，自己编译就得自己规划。我的建议是保持默认，除非有特殊要求，路径改得五花八门以后自己都找不到。

第二类是 `--with-xxx_module`，打开默认不编译的模块。最常用的三个是 `--with-http_ssl_module`（HTTPS）、`--with-http_stub_status_module`（状态监控）、`--with-http_v2_module`（HTTP/2，这个参数比本文成文的时间晚，表里没有）。装之前先想清楚要用哪些，漏了就得重新编译。

第三类是 `--without-xxx_module`，关掉默认会编译的模块。除非是在做嵌入式那种对体积极度敏感的场景，否则不用碰，关掉的模块以后想用还得重编。

表里 `--add-module=PATH` 单独说一句，第三方模块靠它加入，比如 Brotli 压缩、`nginx_upstream_check_module` 主动健康检查，都是这个路子。较新的版本还支持 `--add-dynamic-module` 编译成动态模块，用 `load_module` 按需加载，不用整个重编，这条路更省事。

| 参数 | 说明 |
| ---- | ---- |
| --prefix=`<path>` | Nginx安装路径。如果没有指定，默认为 /usr/local/nginx。 |
| --sbin-path=`<path>` | Nginx可执行文件安装路径。只能安装时指定，如果没有指定，默认为`<prefix>`/sbin/nginx。 |
| --conf-path=`<path>` | 在没有给定-c选项下默认的nginx.conf的路径。如果没有指定，默认为`<prefix>`/conf/nginx.conf。 |
| --pid-path=`<path>` | 在nginx.conf中没有指定pid指令的情况下，默认的nginx.pid的路径。如果没有指定，默认为 `<prefix>`/logs/nginx.pid。 |
| --lock-path=`<path>` | nginx.lock文件的路径。 |
| --error-log-path=`<path>` | 在nginx.conf中没有指定error_log指令的情况下，默认的错误日志的路径。如果没有指定，默认为 `<prefix>`/- logs/error.log。 |
| --http-log-path=`<path>` | 在nginx.conf中没有指定access_log指令的情况下，默认的访问日志的路径。如果没有指定，默认为 `<prefix>`/- logs/access.log。 |
| --user=`<user>` | 在nginx.conf中没有指定user指令的情况下，默认的nginx使用的用户。如果没有指定，默认为 nobody。 |
| --group=`<group>` | 在nginx.conf中没有指定user指令的情况下，默认的nginx使用的组。如果没有指定，默认为 nobody。 |
| --builddir=DIR | 指定编译的目录 |
| --with-rtsig_module | 启用 rtsig 模块 |
| --with-select_module --without-select_module | 允许或不允许开启SELECT模式，如果 configure 没有找到更合适的模式，比如：kqueue(sun os),epoll (linux kenel 2.6+), rtsig(- 实时信号)或者/dev/poll(一种类似select的模式，底层实现与SELECT基本相 同，都是采用轮训方法) SELECT模式将是默认安装模式|
| --with-poll_module --without-poll_module | Whether or not to enable the poll module. This module is enabled by, default if a more suitable method such as kqueue, epoll, rtsig or /dev/poll is not discovered by configure. |
| --with-http_ssl_module | Enable ngx_http_ssl_module. Enables SSL support and the ability to handle HTTPS requests. Requires OpenSSL. On Debian, this is libssl-dev. 开启HTTP SSL模块，使NGINX可以支持HTTPS请求。这个模块需要已经安装了OPENSSL，在DEBIAN上是libssl  |
| --with-http_realip_module | 启用 ngx_http_realip_module |
| --with-http_addition_module | 启用 ngx_http_addition_module |
| --with-http_sub_module | 启用 ngx_http_sub_module |
| --with-http_dav_module | 启用 ngx_http_dav_module |
| --with-http_flv_module | 启用 ngx_http_flv_module |
| --with-http_stub_status_module | 启用 "server status" 页 |
| --without-http_charset_module | 禁用 ngx_http_charset_module |
| --without-http_gzip_module | 禁用 ngx_http_gzip_module. 如果启用，需要 zlib 。 |
| --without-http_ssi_module | 禁用 ngx_http_ssi_module |
| --without-http_userid_module | 禁用 ngx_http_userid_module |
| --without-http_access_module | 禁用 ngx_http_access_module |
| --without-http_auth_basic_module | 禁用 ngx_http_auth_basic_module |
| --without-http_autoindex_module | 禁用 ngx_http_autoindex_module |
| --without-http_geo_module | 禁用 ngx_http_geo_module |
| --without-http_map_module | 禁用 ngx_http_map_module |
| --without-http_referer_module | 禁用 ngx_http_referer_module |
| --without-http_rewrite_module | 禁用 ngx_http_rewrite_module. 如果启用需要 PCRE 。 |
| --without-http_proxy_module | 禁用 ngx_http_proxy_module |
| --without-http_fastcgi_module | 禁用 ngx_http_fastcgi_module |
| --without-http_memcached_module | 禁用 ngx_http_memcached_module |
| --without-http_limit_zone_module | 禁用 ngx_http_limit_zone_module |
| --without-http_empty_gif_module | 禁用 ngx_http_empty_gif_module |
| --without-http_browser_module | 禁用 ngx_http_browser_module |
| --without-http_upstream_ip_hash_module | 禁用 ngx_http_upstream_ip_hash_module |
| --with-http_perl_module | 启用 ngx_http_perl_module |
| --with-perl_modules_path=PATH | 指定 perl 模块的路径 |
| --with-perl=PATH | 指定 perl 执行文件的路径 |
| --http-log-path=PATH | Set path to the http access log |
| --http-client-body-temp-path=PATH | Set path to the http client request body temporary files |
| --http-proxy-temp-path=PATH | Set path to the http proxy temporary files |
| --http-fastcgi-temp-path=PATH | Set path to the http fastcgi temporary files |
| --without-http | 禁用 HTTP server |
| --with-mail | 启用 IMAP4/POP3/SMTP 代理模块 |
| --with-mail_ssl_module | 启用 ngx_mail_ssl_module |
| --with-cc=PATH | 指定 C 编译器的路径 |
| --with-cpp=PATH | 指定 C 预处理器的路径 |
| --with-cc-opt=OPTIONS | Additional parameters which will be added to the variable CFLAGS. With the use of the system library PCRE in FreeBSD, it is necessary to indicate --with-cc-opt="-I /usr/local/include". If we are using select() and it is necessary to increase the number of file descriptors, then this also can be assigned here: --with-cc-opt="-D FD_SETSIZE=2048". |
| --with-ld-opt=OPTIONS | Additional parameters passed to the linker. With the use of the system library PCRE in - FreeBSD, it is necessary to indicate --with-ld-opt="-L /usr/local/lib". |
| --with-cpu-opt=CPU | 为特定的 CPU 编译，有效的值包括：pentium, pentiumpro, pentium3, pentium4, athlon, opteron, amd64, sparc32, sparc64, ppc64 |
| --without-pcre | 禁止 PCRE 库的使用。同时也会禁止 HTTP rewrite 模块。在 "location" 配置指令中的正则表达式也需要 PCRE 。 |
| --with-pcre=DIR | 指定 PCRE 库的源代码的路径。 |
| --with-pcre-opt=OPTIONS | Set additional options for PCRE building. |
| --with-md5=DIR | Set path to md5 library sources. |
| --with-md5-opt=OPTIONS | Set additional options for md5 building. |
| --with-md5-asm | Use md5 assembler sources. |
| --with-sha1=DIR | Set path to sha1 library sources. |
| --with-sha1-opt=OPTIONS | Set additional options for sha1 building. |
| --with-sha1-asm | Use sha1 assembler sources. |
| --with-zlib=DIR | Set path to zlib library sources. |
| --with-zlib-opt=OPTIONS | Set additional options for zlib building. |
| --with-zlib-asm=CPU | Use zlib assembler sources optimized for specified CPU, valid values are: pentium, pentiumpro |
| --with-openssl=DIR | Set path to OpenSSL library sources |
| --with-openssl-opt=OPTIONS | Set additional options for OpenSSL building |
| --with-debug | 启用调试日志 |
| --add-module=PATH | Add in a third-party module found in directory PATH |


## 六、配置

装完之后所有事情都发生在配置文件里。这一节是整篇的核心，我按「先搞懂结构、再认识指令、最后看具体场景」的顺序展开。

在讲配置文件之前，先补一块很多教程会跳过、但影响你对所有配置的理解的东西：Nginx 的进程模型。

启动之后 `ps` 一看，你会发现有两类进程。一个是 master，若干个是 worker。master 以 root 身份运行，它不处理任何请求，只做三件事：读配置文件、绑定 80 和 443 这类需要特权的端口、管理 worker 的生死。worker 降权到普通用户（默认 nobody 或者 nginx）运行，真正干活的是它们。

这个划分带来两个直接结果。第一，安全边界清晰，worker 被攻破也拿不到 root 权限。第二，`reload` 可以做到不断连接，因为 master 收到 HUP 信号后会用新配置起一批新 worker，同时告诉老 worker「别接新请求了，把手上的处理完就退出」，两批 worker 有一段时间是并存的。

所以你在配置里写的东西，本质上分两类：写给 master 看的（进程数、用户、pid 路径、监听端口），和写给 worker 看的（怎么处理每一个请求）。这也解释了为什么 `worker_processes` 只能写在最外层，而 `root`、`proxy_pass` 只能写在 `location` 里，它们的生效时机根本不同。

回到配置文件本身。

- 在`Centos` 默认配置文件在 **`/usr/local/nginx-1.5.1/conf/nginx.conf`** 我们要在这里配置一些文件。`nginx.conf`是主配置文件，由若干个部分组成，每个大括号`{}`表示一个部分。每一行指令都由分号结束`;`，标志着一行的结束。

「每一行指令都由分号结束」这句听着像废话，但漏分号是新手最常见的报错来源，而且 Nginx 的报错信息通常指向下一行，不熟悉的话会盯着没问题的那行看半天。养成写完就 `nginx -t` 的习惯，这类问题两秒钟解决。

### 6.1 常用正则

Nginx 用的是 PCRE 正则，语法和 JavaScript、PHP 里的基本一致，下面这张表是最常用的几个。用到正则的地方主要是 `location ~`、`rewrite` 和 `map`。

有一点要提醒，正则匹配是有开销的，而且 `location` 里的正则是按配置文件里的书写顺序逐条尝试的。规则一多、又都写成正则，每个请求都要跑一遍这个列表。能用前缀匹配解决的就别写正则，这是最容易拿到的性能优化之一。

| 正则 | 说明 | 正则 | 说明 |
| ---- | ---- | ---- | ---- | 
| `. ` | 匹配除换行符以外的任意字符 | `$ ` | 匹配字符串的结束 |
| `? ` | 重复0次或1次 | `{n} ` | 重复n次 |
| `+ ` | 重复1次或更多次 | `{n,} ` | 重复n次或更多次 |
| `*` | 重复0次或更多次 | `[c] ` | 匹配单个字符c |
| `\d ` |匹配数字 | `[a-z]` | 匹配a-z小写字母的任意一个 |
| `^ ` | 匹配字符串的开始 | - | - |

### 6.2 全局变量

这些 `$` 开头的变量是配置文件里的「输入」，日志格式、`proxy_set_header`、`rewrite` 的目标全靠它们拼出来。表里最容易搞混的是几组长得像的，我单独拎出来说。

`$host` 和 `$http_host` 不一样。`$http_host` 是原样的请求头，带端口号；`$host` 经过了处理，去掉端口、转成小写，请求头里没有 Host 时会退回到 `server_name`。做反向代理传 Host 头，一般用 `$host` 更稳。

`$uri` 和 `$request_uri` 也不一样。`$request_uri` 是客户端发来的原始路径，带查询参数、没解码；`$uri` 是 Nginx 内部处理后的路径，不带参数，而且会随着 `rewrite` 改变。做重定向拼接完整地址用 `$request_uri`，做路径判断用 `$uri`。这个搞混的表现是重定向之后参数全丢了。

`$document_uri` 和 `$uri` 完全等价，是同一个东西的两个名字，看到哪个都别慌。

| 变量 | 说明 | 变量 | 说明 |
| ---- | ---- | ---- | ---- | 
| `$args` | 这个变量等于请求行中的参数，同`$query_string` | `$remote_port` | 客户端的端口。 |
| `$content_length` | 请求头中的`Content-length`字段。 | `$remote_user` | 已经经过`Auth Basic Module`验证的用户名。 |
| `$content_type` | 请求头中的`Content-Type`字段。 | `$request_filename` | 当前请求的文件路径，由`root`或`alias`指令与`URI`请求生成。 |
| `$document_root` | 当前请求在`root`指令中指定的值。 | `$scheme` | `HTTP`方法（如`http`，`https`）。 |
| `$host` | 请求主机头字段，否则为服务器名称。 | `$server_protocol` | 请求使用的协议，通常是`HTTP/1.0`或`HTTP/1.1`。 |
| `$http_user_agent` | 客户端`agent`信息 | `$server_addr` | 服务器地址，在完成一次系统调用后可以确定这个值。 |
| `$http_cookie` | 客户端`cookie`信息 | `$server_name` | 服务器名称。 |
| `$limit_rate` | 这个变量可以限制连接速率。 | `$server_port` | 请求到达服务器的端口号。 |
| `$request_method` | 客户端请求的动作，通常为`GET`或`POST`。 | `$request_uri` | 包含请求参数的原始`URI`，不包含主机名，如：`/foo/bar.php?arg=baz`。 |
| `$remote_addr` | 客户端的IP地址。 | `$uri` | 不带请求参数的当前`URI`，`$uri`不包含主机名，如`/foo/bar.html`。 |
| `$document_uri` | 与`$uri`相同。 | - | - |

例如请求：`http://localhost:3000/test1/test2/test.php`

```
$host：localhost  
$server_port：3000  
$request_uri：/test1/test2/test.php  
$document_uri：/test1/test2/test.php  
$document_root：/var/www/html  
$request_filename：/var/www/html/test1/test2/test.php  
```

这个例子很值得对着看一遍，它把「URL 里的路径」和「磁盘上的路径」两件事的对应关系摆出来了。`$document_root` 是 `root` 指令的值，`$request_filename` 是 `root` 加上 `$uri` 拼出来的最终文件路径。404 排查时打印这两个变量，一眼就能看出是拼错了还是文件真的不在。

顺手提一个调试技巧，把这些变量加进 `add_header` 临时输出到响应头里，比反复看日志快得多，调完记得删掉。

### 6.3 符号参考

| 符号 | 说明 | 符号 | 说明 | 符号 | 说明 |
| ---- | ---- | ---- | ---- | ---- | ---- |
| `k`,`K` | 千字节 | `m`,`M` | 兆字节 | `ms` | 毫秒 |
| `s` | 秒 | `m` | 分钟 | `h` |  小时 |
| `d` | 日 | `w` | 周 | `M` |  一个月, `30`天 |

- 例如，"8k"，"1m" 代表字节数计量。  
- 例如，"1h 30m"，"1y 6M"。代表 "1小时 30分"，"1年零6个月"。 

这张单位表里有个坑，小写 `m` 是分钟，大写 `M` 是月份，而在表示大小的时候小写 `m` 又是兆字节。写 `keepalive_timeout 65m` 和 `keepalive_timeout 65M` 差了三万多倍。写超时值我一律用 `s` 显式标出秒，不用默认单位，能省掉很多误会。

### 6.4 配置文件

这一小节是整篇里我认为最该看懂的部分。配置文件的层级结构搞清楚了，剩下的都是查文档的事。

- `nginx` 的配置系统由一个主配置文件和其他一些辅助的配置文件构成。这些配置文件均是纯文本文件，全部位于 `nginx` 安装目录下的 `conf` 目录下。
- 指令由 `nginx` 的各个模块提供，不同的模块会提供不同的指令来实现配置。
指令除了 `Key-Value` 的形式，还有作用域指令。
- `nginx.conf` 中的配置信息，根据其逻辑上的意义，对它们进行了分类，也就是分成了多个作用域，或者称之为配置指令上下文。不同的作用域含有一个或者多个配置项。

上下文（context）这个概念说白点就是作用域。每个指令都规定了自己能出现在哪几层，写错层 `nginx -t` 会直接报 `directive is not allowed here`。

层级关系是这样的：最外层是 `main`，里面并列放着 `events`、`http`、`stream`、`mail`；`http` 里面放若干个 `server`，每个 `server` 里面放若干个 `location`，`location` 还能嵌套 `location`。

指令有继承性，外层写的东西内层能用到，内层写了同名的就覆盖外层。这条规则有个非常经典的例外，`add_header` 不是覆盖单条而是整组失效，内层只要出现任意一条 `add_header`，外层所有的 `add_header` 全部作废。安全响应头莫名其妙消失，多半就是这个原因。

下面这些上下文指令是用的比较多的：

| `Directive` |  `Description` | `Contains Directive` |
| ---- | ---- | ---- |
| `main`  |  `nginx` 在运行时与具体业务功能（比如 `http` 服务或者 `email `服务代理）无关的一些参数，比如工作进程数，运行的身份等。 | `user`, `worker_processes`, `error_log`, `events`, `http`, `mail` |
| `http`  |  与提供 `http` 服务相关的一些配置参数。例如：是否使用 `keepalive `啊，是否使用` gzip` 进行压缩等。 |  `server` |
| `server` | `http` 服务上支持若干虚拟主机。每个虚拟主机一个对应的 `server` 配置项，配置项里面包含该虚拟主机相关的配置。在提供 `mail` 服务的代理时，也可以建立若干 `server.` 每个 `server` 通过监听的地址来区分。| `listen`, `server_name`,` access_log`, `location`, `protocol`, `proxy`, `smtp_auth`, `xclient` |
| `location`  |  `http` 服务中，某些特定的 `URL` 对应的一系列配置项。  | `index`, `root` |
| `mail` | 实现` email `相关的 `SMTP/IMAP/POP3` 代理时，共享的一些配置项（因为可能实现多个代理，工作在多个监听地址上）。 | `server`,` http`, `imap_capabilities` |
| `include` | 以便增强配置文件的可读性，使得部分配置文件可以重新使用。 | - |
| `valid_referers` | 用来校验`Http`请求头`Referer`是否有效。 | - |
| `try_files` | 用在`server`部分，不过最常见的还是用在`location`部分，它会按照给定的参数顺序进行尝试，第一个被匹配到的将会被使用。 | - |
| `if` | 当在`location`块中使用`if`指令，在某些情况下它并不按照预期运行，一般来说避免使用`if`指令。 | - |


表里的 `if` 那一行提醒得很到位，Nginx 官方 wiki 有篇文章标题就叫「If Is Evil」。原因是 `if` 属于 rewrite 模块，只在特定阶段执行，块里能安全使用的指令其实只有 `return` 和 `rewrite`，写别的可能静默失效。要做条件判断，优先用 `map` 指令，它在配置解析期就展开成查表，没有这些副作用。

`try_files` 那一行是前端同学最该记住的一条，单页应用刷新 404 的标准解法就靠它，具体写法和它的几种坑我在 [Nginx try_files 指令详解](https://feinterview.poetries.top/blog/nginx-try-files) 里单独写过。

- 例如我们再 **`nginx.conf`** 里面引用两个配置 `vhost/example.com.conf `和 `vhost/gitlab.com.conf` 它们都被放在一个我自己新建的目录 `vhost `下面。`nginx.conf` 配置如下：

```nginx
worker_processes  1;
events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    #log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
    #                  '$status $body_bytes_sent "$http_referer" '
    #                  '"$http_user_agent" "$http_x_forwarded_for"';

    #access_log  logs/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    #keepalive_timeout  0;
    keepalive_timeout  65;

    #gzip  on;
    server {
        listen       80;
        server_name  localhost;
        location / {
            root   html;
            index  index.html index.htm;
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
    include  vhost/example.com.conf;
    include  vhost/gitlab.com.conf;
}
```


这份主配置文件是个很好的模板，几乎就是官方默认配置的样子。我按从外到内的顺序过一遍。

`worker_processes 1;` 在 main 上下文，决定起几个 worker。今天推荐写 `auto`，让它自己读 CPU 核心数。容器里跑要注意，`auto` 读到的是宿主机核心数而不是容器配额，给了 2 核却起 32 个 worker 反而更慢，这种情况要按配额写死。

`events` 块管连接怎么收，里面最重要的就是 `worker_connections`。总连接数是 `worker_processes` 乘以 `worker_connections`，但做反向代理时一个用户请求要占两个连接（进来一个、转发出去一个），实际能撑的并发请求数要再除以 2。

`http` 块里的 `include mime.types;` 是把文件后缀和 `Content-Type` 的对应表引进来，少了它浏览器会把 CSS 当纯文本处理，页面样式全丢。`default_type application/octet-stream;` 是兜底，没匹配上的类型一律当二进制流，浏览器会触发下载。

最后两行 `include vhost/*.conf` 是这份配置最值得学的地方。把每个站点拆成独立文件，主配置只留全局设置，加站点就是加一个文件，出问题也好定位。站点一多，这个习惯能省掉大量翻文件的时间。

- 简单的配置: `example.com.conf`

```nginx
server {
    #侦听的80端口
    listen       80;
    server_name  baidu.com app.baidu.com; # 这里指定域名
    index        index.html index.htm;    # 这里指定默认入口页面
    root /home/www/app.baidu.com;         # 这里指定目录
}
```

这份最小站点配置只有四行，但它是所有静态站点的骨架。`listen 80` 收哪个端口，`server_name` 认哪些域名（可以写多个，空格分隔），`index` 是访问目录时找哪个默认文件，`root` 是文件放在哪。

有一点新手常搞错：`root` 指的是网站根目录在磁盘上的位置，访问 `/a/b.html` 会去找 `/home/www/app.baidu.com/a/b.html`。它和 `alias` 的区别是「拼接」和「替换」，`alias` 会把 location 匹配到的那段路径整个换掉，后面 10.10 小节有对比例子。

### 6.5 内置预定义变量

- `Nginx`提供了许多预定义的变量，也可以通过使用`set`来设置变量。你可以在`if`中使用预定义变量，也可以将它们传递给代理服务器。以下是一些常见的预定义变量，[更多详见](http://nginx.org/en/docs/varindex.html)

| 变量名称  |  值 |
| ----  | ---- |
| `$args_name` | 在请求中的`name`参数 |
| `$args`  `    | 所有请求参数 |
| `$query_string`   | `$args`的别名 |
| `$content_length` | 请求头`Content-Length`的值 |
| `$content_type `  | 请求头`Content-Type`的值 |
| `$host` |  如果当前有`Host`，则为请求头`Host`的值；如果没有这个头，那么该值等于匹配该请求的`server_name`的值 |
| `$remote_addr ` |  客户端的`IP`地址 |
| `$request  `    |  完整的请求，从客户端收到，包括`Http`请求方法、`URI`、`Http`协议、头、请求体 |
| `$request_uri ` |  完整请求的`URI`，从客户端来的请求，包括参数 |
| `$scheme` | 当前请求的协议 |
| `$uri   ` | 当前请求的标准化`URI` |

这张表和前面 6.2 的全局变量有重叠，都是同一套变量的不同整理方式，官方的完整索引在表格上方那个链接里。真正需要记住的其实就四五个，`$host`、`$uri`、`$request_uri`、`$remote_addr`、`$scheme`，其余的用到再查。

### 6.6 反向代理

从这里开始进入具体场景。下面几节我给的是入门版本的配置和必要说明，每种场景在生产环境还有一堆细节要处理，那部分我整理在 [工作中常用的 Nginx 配置总结回顾](https://feinterview.poetries.top/blog/nginx-config) 里，需要落地的时候对着那篇看。

- 反向代理是一个`Web`服务器，它接受客户端的连接请求，然后将请求转发给上游服务器，并将从服务器得到的结果返回给连接的客户端。下面简单的反向代理的例子：

```nginx
server {  
  listen       80;                                                        
  server_name  localhost;                                              
  client_max_body_size 1024M;  # 允许客户端请求的最大单文件字节数

  location / {
    proxy_pass                         http://localhost:8080;
    proxy_set_header Host              $host:$server_port;
    proxy_set_header X-Forwarded-For   $remote_addr; # HTTP的请求端真实的IP
    proxy_set_header X-Forwarded-Proto $scheme;      # 为了正确地识别实际用户发出的协议是 http 还是 https
  }
}
```

这段最小反向代理配置里，除了 `proxy_pass` 之外的三行 `proxy_set_header` 都不是可选的。

`Host` 不传的话，后端收到的 Host 是 `localhost:8080`，很多框架会用它生成绝对链接和重定向地址，结果就是用户被跳到 `localhost` 上去。`X-Forwarded-For` 不传，后端日志里所有请求的来源 IP 都变成代理机的地址，风控和限流全部失效。`X-Forwarded-Proto` 不传，跑在 HTTP 上的后端不知道外面套了 HTTPS，生成的链接会是 `http://` 开头，浏览器直接报混合内容警告。

这里 `X-Forwarded-For` 用的是 `$remote_addr`，只记录直接上一跳。如果前面还有 CDN 或者别的代理，应该用 `$proxy_add_x_forwarded_for`，它会在已有的链路后面追加，保留完整路径。

`client_max_body_size 1024M` 这个值给得很大，实际项目里我不建议全局开这么大，只在真正需要上传大文件的 location 里单独放宽。这个参数默认只有 1MB，上传功能报 413 十有八九是它。

- 复杂的配置: `gitlab.com.conf`。

```nginx
server {
    #侦听的80端口
    listen       80;
    server_name  git.example.cn;
    location / {
        proxy_pass   http://localhost:3000;
        #以下是一些反向代理的配置可删除
        proxy_redirect             off;
        #后端的Web服务器可以通过X-Forwarded-For获取用户真实IP
        proxy_set_header           Host $host;
        client_max_body_size       10m; #允许客户端请求的最大单文件字节数
        client_body_buffer_size    128k; #缓冲区代理缓冲用户端请求的最大字节数
        proxy_connect_timeout      300; #nginx跟后端服务器连接超时时间(代理连接超时)
        proxy_send_timeout         300; #后端服务器数据回传时间(代理发送超时)
        proxy_read_timeout         300; #连接成功后，后端服务器响应时间(代理接收超时)
        proxy_buffer_size          4k; #设置代理服务器（nginx）保存用户头信息的缓冲区大小
        proxy_buffers              4 32k; #proxy_buffers缓冲区，网页平均在32k以下的话，这样设置
        proxy_busy_buffers_size    64k; #高负荷下缓冲大小（proxy_buffers*2）
    }
}
```

这份复杂版本多出来的都是缓冲区和超时参数，它们平时没存在感，出问题时才想起来。

三个超时管的是三个不同阶段：`proxy_connect_timeout` 是跟后端建立 TCP 连接，超了报 502；`proxy_send_timeout` 是往后端发请求；`proxy_read_timeout` 是等后端返回数据，超了报 504。这里都配成 300 秒偏长了，建连超时给 5 秒足够，后端活着的话建连是毫秒级的事，配 300 秒只会让故障时的请求全堆着不释放。

`proxy_buffer_size` 存的是响应头，`proxy_buffers` 存响应体。响应头超过 `proxy_buffer_size` 会直接报 502，这个坑很隐蔽：接口本身没问题，只是某个用户的 Cookie 特别大或者后端塞了个很长的自定义头，就触发了。遇到「大部分用户正常、个别用户 502」，先怀疑这里。

缓冲区不够用时 Nginx 会把响应写到磁盘临时文件，`proxy_temp_file_write_size` 控制这个行为。做流式响应或者 SSE 推送的时候要反过来，用 `proxy_buffering off;` 把缓冲整个关掉，否则 Nginx 会攒够一批才发给客户端，实时性就没了。

- 代理到上游服务器的配置中，最重要的是`proxy_pass`指令。以下是代理模块中的一些常用指令：

| 指令 | 说明 |
| ---- | ---- |
| `proxy_connect_timeout`  | `Nginx`从接受请求至连接到上游服务器的最长等待时间 |
| `proxy_send_timeout`  | 后端服务器数据回传时间(代理发送超时) |
| `proxy_read_timeout`  | 连接成功后，后端服务器响应时间(代理接收超时) |
| `proxy_cookie_domain` | 替代从上游服务器来的`Set-Cookie`头的`domain`属性 |
| `proxy_cookie_path`   | 替代从上游服务器来的`Set-Cookie`头的`path`属性 |
| `proxy_buffer_size`   | 设置代理服务器（`nginx`）保存用户头信息的缓冲区大小 |
| `proxy_buffers  `     | `proxy_buffers`缓冲区，网页平均在多少k以下 |
| `proxy_set_header`    | 重写发送到上游服务器头的内容，也可以通过将某个头部的值设置为空字符串，而不发送某个头部的方法实现 |
| `proxy_ignore_headers` | 这个指令禁止处理来自代理服务器的应答。 | 
| `proxy_intercept_errors` | 使`nginx`阻止`HTTP`应答代码为`400`或者更高的应答。 | 

### 6.7 负载均衡

一台机器扛不住就加机器，`upstream` 就是干这个的。它本身不转发，只负责定义「有哪些后端、按什么规则挑一台」。

- `upstream`指令启用一个新的配置区段，在该区段定义一组上游服务器。这些服务器可能被设置不同的权重，也可能出于对服务器进行维护，标记为`down`。

```nginx
upstream gitlab {
    ip_hash;
    # upstream的负载均衡，weight是权重，可以根据机器配置定义权重。weigth参数表示权值，权值越高被分配到的几率越大。
    server 192.168.122.11:8081 ;
    server 127.0.0.1:82 weight=3;
    server 127.0.0.1:83 weight=3 down;
    server 127.0.0.1:84 weight=3 max_fails=3 fail_timeout=20s;
    server 127.0.0.1:85 weight=4;
    keepalive 32;
}
server {
    #侦听的80端口
    listen       80;
    server_name  git.example.cn;
    location / {
        proxy_pass   http://gitlab;    #在这里设置一个代理，和upstream的名字一样
        #以下是一些反向代理的配置可删除
        proxy_redirect             off;
        #后端的Web服务器可以通过X-Forwarded-For获取用户真实IP
        proxy_set_header           Host $host;
        proxy_set_header           X-Real-IP $remote_addr;
        proxy_set_header           X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size       10m;  #允许客户端请求的最大单文件字节数
        client_body_buffer_size    128k; #缓冲区代理缓冲用户端请求的最大字节数
        proxy_connect_timeout      300;  #nginx跟后端服务器连接超时时间(代理连接超时)
        proxy_send_timeout         300;  #后端服务器数据回传时间(代理发送超时)
        proxy_read_timeout         300;  #连接成功后，后端服务器响应时间(代理接收超时)
        proxy_buffer_size          4k; #设置代理服务器（nginx）保存用户头信息的缓冲区大小
        proxy_buffers              4 32k;# 缓冲区，网页平均在32k以下的话，这样设置
        proxy_busy_buffers_size    64k; #高负荷下缓冲大小（proxy_buffers*2）
        proxy_temp_file_write_size 64k; #设定缓存文件夹大小，大于这个值，将从upstream服务器传
    }
}
```

原文这段 upstream 里有两处写错的地方我改掉了：`server 127.0.0.1:84 weight=3; max_fails=3 fail_timeout=20s;` 中间多了个分号，一条 server 指令被拆成了两句，Nginx 会直接报语法错；`server 127.0.0.1:85 weight=4;;` 结尾是两个分号。这两处照抄过去服务是起不来的。

同一个 server 指令里的参数用空格分隔，一条指令只在末尾写一个分号，这是 Nginx 配置的基本语法。

- 每个请求按时间顺序逐一分配到不同的后端服务器，如果后端服务器`down`掉，能自动剔除。

**负载均衡：**

- `upstream`模块能够使用3种负载均衡算法：轮询、IP哈希、最少连接数。

**轮询：** 

- 默认情况下使用轮询算法，不需要配置指令来激活它，它是基于在队列中谁是下一个的原理确保访问均匀地分布到每个上游服务器；  

**IP哈希：** 

- 通过`ip_hash`指令来激活，Nginx通过IPv4地址的前3个字节或者整个IPv6地址作为哈希键来实现，同一个IP地址总是能被映射到同一个上游服务器；  

**最少连接数：** 

- 通过`least_conn`指令来激活，该算法通过选择一个活跃数最少的上游服务器进行连接。如果上游服务器处理能力不同，可以通过给`server`配置`weight`权重来说明，该算法将考虑到不同服务器的加权最少连接数。

这三种怎么选，我的判断标准是这样。

后端无状态、每个请求耗时差不多，用默认的轮询，最简单也最均匀。请求耗时差异大（比如混着列表查询和报表导出），用 `least_conn`，因为轮询会不管三七二十一继续给已经积压的机器派活。后端把 session 存在本机内存里、又暂时改不了，才用 `ip_hash` 兜着。

`ip_hash` 的两个硬伤要知道：运营商 NAT 会让一大片用户共用出口 IP，全压到同一台机器上；加减机器会让哈希结果大面积变化，一次扩容就能让多数用户掉登录。所以它是权宜之计，长期方案还是把 session 挪到 Redis，让后端变成无状态的。

#### 6.7.1 RR

**简单配置** 

> 这里我配置了2台服务器，当然实际上是一台，只是端口不一样而已，而8081的服务器是不存在的，也就是说访问不到，但是我们访问 `http://localhost` 的时候，也不会有问题，会默认跳转到`http://localhost:8080`具体是因为Nginx会自动判断服务器的状态，如果服务器处于不能访问（服务器挂了），就不会跳转到这台服务器，所以也避免了一台服务器挂了影响使用的情况，由于Nginx默认是RR策略，所以我们不需要其他更多的设置

```nginx
upstream test {
    server localhost:8080;
    server localhost:8081;
}
server {
    listen       81;
    server_name  localhost;
    client_max_body_size 1024M;
 
    location / {
        proxy_pass http://test;
        proxy_set_header Host $host:$server_port;
    }
}
```

**负载均衡的核心代码为** 

```nginx
upstream test {
    server localhost:8080;
    server localhost:8081;
}
```

上面那段描述里有个说法需要澄清一下。「Nginx 会自动判断服务器的状态，服务器挂了就不跳转到这台」这句话方向是对的，但机制不是主动探测。开源版 Nginx 用的是被动检查，得先有真实请求打过去失败了，才会把这台标记为不可用，标记时长由 `fail_timeout` 决定。主动健康检查的 `health_check` 指令是商业版 Nginx Plus 才有的。

所以实际表现是：8081 挂掉之后，仍然会有少量请求先撞上去失败一次，Nginx 摘掉它之后剩下的请求才全部走 8080。默认的 `max_fails=1` 意味着一次失败就摘，生产上一般配成 `max_fails=3 fail_timeout=30s`，避免一次网络抖动就把整台机器踢出去。

#### 6.7.2 权重

- 指定轮询几率，`weight`和访问比率成正比，用于后端服务器性能不均的情况。 例如

```nginx
upstream test {
    server localhost:8080 weight=9;
    server localhost:8081 weight=1;
}
```

- 那么10次一般只会有`1`次会访问到`8081`，而有`9`次会访问到`8080`

权重最实用的场景是灰度发布。新版本先上一台，权重给 1，老版本几台权重给 9，先放一小部分流量过去观察，没问题再逐步调权重。比一次性全量切安全得多，出问题回滚也只是改个数字加 reload。

另一个场景是机器配置不一样，8 核的给 4，4 核的给 2，按处理能力分配流量。

#### 6.7.3 ip_hash

> 上面的2种方式都有一个问题，那就是下一个请求来的时候请求可能分发到另外一个服务器，当我们的程序不是无状态的时候（采用了`session`保存数据），这时候就有一个很大的很问题了，比如把登录信息保存到了`session`中，那么跳转到另外一台服务器的时候就需要重新登录了，所以很多时候我们需要一个客户只访问一个服务器，那么就需要用`iphash`了，`iphash`的每个请求按访问`ip`的`hash`结果分配，这样每个访客固定访问一个后端服务器，可以解决`session`的问题。

```nginx
upstream test {
    ip_hash;
    server localhost:8080;
    server localhost:8081;
}
```

#### 6.7.4 fair

- 这是个第三方模块，按后端服务器的响应时间来分配请求，响应时间短的优先分配。

```nginx
upstream backend {
    fair;
    server localhost:8080;
    server localhost:8081;
}
```

#### 6.7.5 url_hash

> 这是个第三方模块，按访问`url`的`hash`结果来分配请求，使每个`url`定向到同一个后端服务器，后端服务器为缓存时比较有效。 在`upstream`中加入`hash`语句，`server`语句中不能写入`weight`等其他的参数，`hash_method`是使用的`hash`算法

```nginx
upstream backend {
    hash $request_uri;
    hash_method crc32;
    server localhost:8080;
    server localhost:8081;
}
```

这里要补充一点，`fair` 和 `url_hash` 都标注了是第三方模块，得重新编译才能用。但 Nginx 官方后来内置了一个功能相近的 `hash` 指令，写法是 `hash $request_uri consistent;`，不用装任何东西。加上 `consistent` 参数启用一致性哈希，加减机器时只有约 1/N 的键会重新分配，而普通哈希会几乎全变。后端是缓存服务器时，这个差别就是「缓存整体失效」和「小部分回源」的差别。

所以今天要按 URL 分流，优先用内置的 `hash`，不用去折腾 `url_hash` 那个第三方模块。

- 以上`5`种负载均衡各自适用不同情况下使用，所以可以根据实际情况选择使用哪种策略模式，不过`fair`和`url_hash`需要安装第三方模块才能使用

**server指令可选参数：**

- `weight`：设置一个服务器的访问权重，数值越高，收到的请求也越多；
- `fail_timeout`：在这个指定的时间内服务器必须提供响应，如果在这个时间内没有收到响应，那么服务器将会被标记为`down`状态；
- `max_fails`：设置在`fail_timeout`时间之内尝试对一个服务器连接的最大次数，如果超过这个次数，那么服务器将会被标记为`down`;
- `down`：标记一个服务器不再接受任何请求；
- `backup`：一旦其他服务器宕机，那么有该标记的机器将会接收请求。

**keepalive指令：**

- `Nginx`服务器将会为每一个`worker`进行保持同上游服务器的连接。

`keepalive` 这条我要多说两句，因为它单独写是不生效的。默认 Nginx 到后端用的是 HTTP/1.0 短连接，每个请求都要重新握手，高并发下会产生大量 TIME_WAIT 把本地端口耗光。配了 `keepalive 32;` 之后，还必须在对应的 location 里补上 `proxy_http_version 1.1;` 和 `proxy_set_header Connection "";` 这两行，缺一行就静默失效，`nginx -t` 也不会提醒你。后面 9.5 小节给的那段配置才是完整的写法。

### 6.8 屏蔽ip

被人扫描、被恶意刷接口的时候，最快的止血手段就是按 IP 拦掉。

- 在`nginx`的配置文件`nginx.conf`中加入如下配置，可以放到`http`, `server`, `location`, `limit_except`语句块，需要注意相对路径，本例当中`nginx.conf`，`blocksip.conf`在同一个目录中。

```nginx
include blockip.conf;
```

- 在`blockip.conf`里面输入内容，如：

```nginx
deny 165.91.122.67;

deny IP;   # 屏蔽单个ip访问
allow IP;  # 允许单个ip访问
deny all;  # 屏蔽所有ip访问
allow all; # 允许所有ip访问
deny 123.0.0.0/8   # 屏蔽整个段即从123.0.0.1到123.255.255.254访问的命令
deny 124.45.0.0/16 # 屏蔽IP段即从123.45.0.1到123.45.255.254访问的命令
deny 123.45.6.0/24 # 屏蔽IP段即从123.45.6.1到123.45.6.254访问的命令

# 如果你想实现这样的应用，除了几个IP外，其他全部拒绝
allow 1.1.1.1; 
allow 1.1.1.2;
deny all; 
```

这里最值得学的是把黑名单单独拆成 `blockip.conf` 再 `include` 进来这个做法。规则和主配置分开，加 IP 只改一个文件，也方便用脚本自动追加。

规则的判定是从上往下、命中即停，所以「除了几个 IP 外全部拒绝」必须把 `allow` 写在 `deny all` 前面，顺序反了就全拦死。

这里有个坑要注意，Nginx 前面挂了 CDN 或者云厂商负载均衡的话，`deny` 看到的是回源节点 IP，不是真实用户 IP，这套规则完全失效。要按真实 IP 判断得先配 `realip` 模块，用 `set_real_ip_from` 声明可信代理网段，让 Nginx 从 `X-Forwarded-For` 里取真实地址。

另外那行 `deny 124.45.0.0/16 # 屏蔽IP段即从123.45.0.1到123.45.255.254` 注释里的网段和指令里的对不上，一个是 124 一个是 123，看的时候别被带偏，以指令为准。

## 七、第三方模块安装方法

```
./configure --prefix=/你的安装目录  --add-module=/第三方模块目录
```

这条命令有个前提很多人不知道：加模块要重新跑一遍完整的 `./configure`，而且必须把之前所有的参数都带上，漏掉哪个那个模块就没了。所以每次编译完，把 `nginx -V` 的输出存一份，下次加模块时在后面追加 `--add-module` 就行。

跑完 `configure` 和 `make` 之后不要 `make install`，那会覆盖配置文件。正确做法是备份旧的二进制，再把新编出来的 `objs/nginx` 拷过去，具体步骤在后面 10.5 小节的 SSL 部分有完整命令。

较新的版本支持 `--add-dynamic-module`，编译成 `.so` 之后在配置里用 `load_module` 加载，不用替换主程序，这条路比静态编译省心得多。

## 八、重定向

域名换了、路径调整了、老链接不能断，这些都归重定向管。

- `permanent` 永久性重定向。请求日志中的状态码为301
- `redirect` 临时重定向。请求日志中的状态码为302

### 8.1 重定向整个网站

```nginx
server {
    server_name old-site.com;
    return 301 $scheme://new-site.com$request_uri;
}
```

原文这里 `server_name old-site.com` 结尾漏了分号，我补上了。

这段配置有两个细节值得学。用 `$scheme` 而不是写死 `http`，能保证 HTTPS 进来的请求跳转后还是 HTTPS；带上 `$request_uri` 才能把原来的路径和参数一起带过去，不然所有旧链接都跳到新站首页，SEO 权重全丢。

用 `return` 而不是 `rewrite` 也是有讲究的，`return` 不跑正则，开销更小，意图也更明确。能用 `return` 表达的重定向就别写 `rewrite`。

### 8.2 重定向单页

```nginx
server {
    location = /oldpage.html {
        return 301 http://example.org/newpage.html;
    }
}
```

### 8.3 重定向整个子路径

```nginx
location /old-site {
    rewrite ^/old-site/(.*) http://example.org/new-site/$1 permanent;
}
```

301 和 302 的选择这里要专门说一下，因为选错了后果不对称。

301 会被浏览器长期缓存，而且很难清掉，用户那边一旦缓存了，你改回来他也看不到。302 每次都会重新问服务器。所以域名迁移这种确定不会再变的用 301，任何还可能调整的场景先用 302，稳定了再换成 301。

我见过有人在测试环境配了 301，改完之后本机怎么都跳到旧地址，最后只能开无痕窗口才能验证，这个坑挺常见的。

## 九、性能

下面这几组配置是性价比最高的优化项，加起来不到二十行，但对首屏时间和服务器负载的影响很直接。

### 9.1 内容缓存

- 允许浏览器基本上永久地缓存静态内容。 `Nginx`将为您设置`Expires`和`Cache-Control`头信息。

```nginx
location /static {
    root /data;
    expires max;
}
```

- 如果要求浏览器永远不会缓存响应（例如用于跟踪请求），请使用`-1`。

```nginx
location = /empty.gif {
    empty_gif;
    expires -1;
}
```

`expires max` 的实际效果是把 `Expires` 设到 2037 年，配合 `Cache-Control: max-age=315360000`，等于告诉浏览器这个文件永远不会变。

这条只能用在文件名带哈希的静态资源上，比如 `app.a1b2c3.js` 这种。构建工具改了内容就会改文件名，所以缓存永不过期是安全的。要是用在 `app.js` 这种固定名字的文件上，你发了新版本用户也拿不到，只能让他们清缓存，这个事故我见过不止一次。

HTML 文件恰恰相反，必须配 `expires -1` 或者 `Cache-Control: no-cache`，因为它是资源清单的入口，缓存住了整个更新链条就断了。

### 9.2 Gzip压缩

```nginx
gzip  on;
gzip_buffers 16 8k;
gzip_comp_level 6;
gzip_http_version 1.1;
gzip_min_length 256;
gzip_proxied any;
gzip_vary on;
gzip_types
    text/xml application/xml application/atom+xml application/rss+xml application/xhtml+xml image/svg+xml
    text/javascript application/javascript application/x-javascript
    text/x-json application/json application/x-web-app-manifest+json
    text/css text/plain text/x-component
    font/opentype application/x-font-ttf application/vnd.ms-fontobject
    image/x-icon;
gzip_disable  "msie6";
```

这份 gzip 配置基本可以直接抄，说几个关键点。

`gzip_comp_level 6` 是性价比拐点，往上压缩率提升很小但 CPU 消耗接近翻倍。`gzip_min_length 256` 是必须配的，小文件压完可能比原文件还大，默认值 20 字节等于什么都压。`gzip_types` 里千万别加 `text/html`，Nginx 强制对它启用，再写一遍会直接报错。图片和视频也别加，JPEG、MP4 本身已经压过了，再压只有 CPU 开销。

`gzip_vary on` 影响的是缓存正确性，开了之后响应带 `Vary: Accept-Encoding`，CDN 才知道要按客户端支不支持压缩分别缓存两份。`gzip_disable "msie6"` 这条今天可以删了，IE6 早就不在支持范围内，留着每个请求都要跑一次 UA 正则。

补一句今天的做法，gzip 之外还有 Brotli，同样内容通常比 gzip 再小 15% 到 20%，主流浏览器都支持。Nginx 官方版本没内置，需要装 Google 维护的 `ngx_brotli` 模块。我自己的站是构建时预先生成 `.br` 和 `.gz` 两份，运行时直接发文件，连压缩的 CPU 都省了。

### 9.3 打开文件缓存

```nginx
open_file_cache max=1000 inactive=20s;
open_file_cache_valid 30s;
open_file_cache_min_uses 2;
open_file_cache_errors on;
```

这组 `open_file_cache` 缓存的是文件描述符和元信息（大小、修改时间），不是文件内容。静态文件多的站点，它能省掉大量重复的 `open` 和 `stat` 系统调用。

`open_file_cache_valid 30s` 意味着最多有 30 秒的延迟才能发现文件变了，发布静态资源之后短时间内可能还是旧的。文件名带哈希的话没影响，直接覆盖同名文件的部署方式就要注意这一点。

`open_file_cache_errors on` 会把「文件不存在」这个结果也缓存起来，好处是被扫描时不用反复查磁盘，坏处是新加的文件要等缓存过期才能访问到。

### 9.4 SSL缓存

```nginx
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

TLS 握手是 HTTPS 里最贵的一步，涉及非对称运算和多次往返。会话缓存让复访的客户端跳过完整握手，直接复用之前协商好的参数。

关键是必须用 `shared` 而不是 `builtin`，`builtin` 是每个 worker 各存一份，客户端下次连到另一个 worker 上照样要重新握手，等于白配。`shared:SSL:10m` 里的 10MB 大约能存四万个会话，中小站点绰绰有余。

### 9.5 上游Keepalive

```nginx
upstream backend {
    server 127.0.0.1:8080;
    keepalive 32;
}
server {
    ...
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

这段就是前面 6.7 提过的完整写法，三行缺一不可。`keepalive 32;` 定义每个 worker 保留的空闲长连接数，`proxy_http_version 1.1;` 把协议升到 1.1（1.0 不支持长连接），`proxy_set_header Connection "";` 把客户端可能传过来的 `Connection: close` 清掉，避免它干扰。

少任何一行，长连接就静默失效，配了跟没配一样。这个我踩过，当时以为参数没生效反复调数值，最后抓包才发现每次请求都在重新建连。

### 9.6 监控

- 使用`ngxtop`实时解析`nginx`访问日志，并且将处理结果输出到终端，功能类似于系统命令`top`。所有示例都读取`nginx`配置文件的访问日志位置和格式。如果要指定访问日志文件和/或日志格式，请使用-f和-a选项。
- 注意：在`nginx`配置中`/usr/local/nginx/conf/nginx.conf`日志文件必须是绝对路径。

```bash
# 安装 ngxtop
pip install ngxtop

# 实时状态
ngxtop
# 状态为404的前10个请求的路径：
ngxtop top request_path --filter 'status == 404'

# 发送总字节数最多的前10个请求
ngxtop --order-by 'avg(bytes_sent) * count'

# 排名前十位的IP，例如，谁攻击你最多
ngxtop --group-by remote_addr

# 打印具有4xx或5xx状态的请求，以及status和http referer
ngxtop -i 'status >= 400' print request status http_referer

# 由200个请求路径响应发送的平均正文字节以'foo'开始：
ngxtop avg bytes_sent --filter 'status == 200 and request_path.startswith("foo")'

# 使用 common 日志格式从远程机器分析apache访问日志
ssh remote tail -f /var/log/apache2/access.log | ngxtop -f common
```

`ngxtop` 这个工具的定位很清楚，临时看一眼当前流量情况，不需要搭任何东西。想知道谁在刷你的接口、哪个路径 404 最多，敲一条命令就有答案，比 `tail -f` 加肉眼扫快多了。

它的局限也很明显，只能看当下，没有历史数据，机器一多就不好使了。规模上来之后还是得把日志送进 ELK 或者 Loki，配合 `log_format` 输出 JSON，前面提到的 `$request_time`、`$upstream_addr`、`$upstream_response_time` 这几个字段才是排查线上问题的主力。

这个工具是 Python 写的、多年没更新了，新环境上装未必顺利。今天类似需求也可以看看 GoAccess，同样是终端里实时分析访问日志，还能导出 HTML 报表。

## 十、常见使用场景

下面这一批是照着实际需求整理的配置片段，跨域、带 www 跳转、代理转发、HTTPS、防盗链都在这儿。每一段我都补了它在解决什么问题、有哪些坑。这部分的更完整版本在 [工作中常用的 Nginx 配置总结回顾](https://feinterview.poetries.top/blog/nginx-config) 那篇，需要直接落地的话看那边。

### 10.1 跨域问题

- 在工作中，有时候会遇到一些接口不支持跨域，这时候可以简单的添加`add_headers`来支持`cors`跨域。配置如下：

```nginx
server {
  listen 80;
  server_name api.xxx.com;
    
  add_header 'Access-Control-Allow-Origin' '*';
  add_header 'Access-Control-Allow-Credentials' 'true';
  add_header 'Access-Control-Allow-Methods' 'GET,POST,HEAD';

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host  $http_host;    
  } 
}
```

这段跨域配置有三个地方要提醒。

第一，`add_header` 后面建议加 `always`。不加的话这些头只在 2xx 和 3xx 响应上出现，接口一旦报 4xx 或 5xx，CORS 头就没了，浏览器直接报跨域错误，真正的错误信息你在控制台里完全看不到。调接口时遇到「接口明明返回了 500 却显示跨域」，多半就是这个原因。

第二，`Access-Control-Allow-Origin: *` 和 `Access-Control-Allow-Credentials: true` 不能同时用。浏览器规范明确规定，允许携带凭证时 Origin 不能是通配符，必须回显具体的域名。这两行一起写，带 Cookie 的请求会被浏览器直接拒掉。正确做法是用 `map` 或者 `if` 匹配可信域名列表，把 `$http_origin` 原样回显。

第三，`Access-Control-Allow-Methods` 里漏了 `OPTIONS`。复杂请求（带自定义头或者 `Content-Type: application/json`）会先发一个 OPTIONS 预检，预检不通过后面的正式请求根本发不出去。完整的做法是单独处理 OPTIONS 请求并直接返回 204。

- 上面更改头信息，还有一种，使用 [rewrite](http://nginx.org/en/docs/http/ngx_http_rewrite_module.html) 指令重定向URI来解决跨域问题。

```nginx
upstream test {
  server 127.0.0.1:8080;
  server localhost:8081;
}
server {
  listen 80;
  server_name api.xxx.com;
  location / { 
    root  html;                   #去请求../html文件夹里的文件
    index  index.html index.htm;  #首页响应地址
  }
  # 用于拦截请求，匹配任何以 /api/开头的地址，
  # 匹配符合以后，停止往下搜索正则。
  location ^~/api/{ 
    # 代表重写拦截进来的请求，并且只能对域名后边的除去传递的参数外的字符串起作用，
    # 例如www.a.com/proxy/api/msg?meth=1&par=2重写，只对/proxy/api/msg重写。
    # rewrite后面的参数是一个简单的正则 ^/api/(.*)$，
    # $1代表正则中的第一个()，$2代表第二个()的值，以此类推。
    rewrite ^/api/(.*)$ /$1 break;
    
    # 把请求代理到其他主机 
    # 其中 http://www.b.com/ 写法和 http://www.b.com写法的区别如下
    # 如果你的请求地址是他 http://server/html/test.jsp
    # 配置一： http://www.b.com/ 后面有斜杠
    #         将反向代理成 http://www.b.com/html/test.jsp 访问
    # 配置二： http://www.b.com 后面没有斜杠
    #         将反向代理成 http://www.b.com/test.jsp 访问
    proxy_pass http://test;

    # 如果 proxy_pass  URL 是 http://a.xx.com/platform/ 这种情况
    # proxy_cookie_path应该设置成 /platform/ / (注意两个斜杠之间有空格)。
    proxy_cookie_path /platfrom/ /;

    # http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass_header
    # 设置 Cookie 头通过
    proxy_pass_header Set-Cookie;
  } 
}
```

这段配置解决的是另一类跨域思路：不让浏览器发生跨域，而是让接口和页面看起来在同一个域下。前端请求 `/api/xxx`，Nginx 拦下来转发到真正的后端，浏览器眼里从头到尾都是同源请求，CORS 那套完全用不上。

我个人更推荐这种做法，尤其是生产环境。CORS 要处理预检、要处理凭证、要维护白名单，而同源代理什么都不用管。

配置里两处细节值得记。`location ^~/api/` 用了 `^~` 前缀，含义是「这条前缀匹配上了就别再去试正则了」，能避免被后面的正则 location 抢走。`rewrite ^/api/(.*)$ /$1 break;` 是把路径里的 `/api` 前缀剥掉再转发，因为后端服务通常不带这层前缀。

注释里那段对比讲的是 `proxy_pass` 结尾斜杠的区别，这是 Nginx 配置里排名第一的坑。规则一句话：`proxy_pass` 后面带了路径部分（哪怕只是一个斜杠），location 匹配到的那段就被替换掉；一点路径都没带，就原样拼上去。这里因为 `proxy_pass http://test;` 指向的是 upstream 名字、没带路径，所以走的是拼接逻辑，前面的 `rewrite ... break` 才是真正改路径的那一步。

另外那行 `proxy_cookie_path /platfrom/ /;` 里 `platfrom` 是 `platform` 的拼写错误，注释里写的是正确拼写。这属于原文的笔误，我保留了原样以便对照，实际用的时候按你自己的路径写。

### 10.2 跳转到带www的域上面

```nginx
server {
    listen 80;
    # 配置正常的带www的域名
    server_name www.wangchujiang.com;
    root /home/www/wabg/download;
    location / {
        try_files $uri $uri/ /index.html =404;
    }
}
server {
    # 这个要放到下面，
    # 将不带www的 wangchujiang.com 永久性重定向到  https://www.wangchujiang.com
    server_name wangchujiang.com;
    rewrite ^(.*) https://www.wangchujiang.com$1 permanent;
}
```

带 www 和不带 www 在搜索引擎眼里是两个站，同样的内容分散在两个域名下会稀释权重，所以必须固定一个主域名、另一个 301 过去。选哪个当主域没有标准答案，定了之后全站统一就行。

这里用 `rewrite ... permanent` 是可以的，但更推荐 `return 301 https://www.wangchujiang.com$request_uri;`，不跑正则、开销更小、意图更直白。

`try_files $uri $uri/ /index.html =404;` 这行是单页应用的标准配置，先找同名文件，再找同名目录，都没有就返回 `index.html` 交给前端路由。它的写法有几个容易搞错的地方，我在 [Nginx try_files 指令详解](https://feinterview.poetries.top/blog/nginx-try-files) 里专门写过。

### 10.3 代理转发

```nginx
upstream server-api{
    # api 代理服务地址
    server 127.0.0.1:3110;    
}
upstream server-resource{
    # 静态资源 代理服务地址
    server 127.0.0.1:3120;
}
server {
    listen       3111;
    server_name  localhost;      # 这里指定域名
    root /home/www/server-statics;
    # 匹配 api 路由的反向代理到API服务
    location ^~/api/ {
        rewrite ^/(.*)$ /$1 break;
        proxy_pass http://server-api;
    }
    # 假设这里验证码也在API服务中
    location ^~/captcha {
        rewrite ^/(.*)$ /$1 break;
        proxy_pass http://server-api;
    }
    # 假设你的图片资源全部在另外一个服务上面
    location ^~/img/ {
        rewrite ^/(.*)$ /$1 break;
        proxy_pass http://server-resource;
    }
    # 路由在前端，后端没有真实路由，在路由不存在的 404状态的页面返回 /index.html
    # 这个方式使用场景，你在写React或者Vue项目的时候，没有真实路由
    location / {
        try_files $uri $uri/ /index.html =404;
        #                               ^ 空格很重要
    }
}
```

这份配置是前后端分离项目的典型形态，很值得整段收藏。它把一个域名下的流量按路径拆给了三个去处：`/api/` 和 `/captcha` 给接口服务，`/img/` 给静态资源服务，剩下的全部交给前端路由。

这样做的好处是浏览器眼里只有一个域名，没有跨域、没有预检、Cookie 也不用配 domain。前端本地开发时用 Vite 或者 webpack 的 devServer proxy 模拟同一套路径规则，本地和线上行为就一致了。

注意最后那行注释「空格很重要」说的是 `try_files $uri $uri/ /index.html =404;` 里 `/index.html` 和 `=404` 之间必须有空格，写成 `/index.html=404` 会被当成一个字符串处理。这种错误 `nginx -t` 未必报，但行为是错的。

### 10.4 代理转发连接替换

```nginx
location ^~/api/upload {
    rewrite ^/(.*)$ /wfs/v1/upload break;
    proxy_pass http://wfs-api;
}
```

这一段看着简单，用处却很具体：前端调的是 `/api/upload`，后端真实路径是 `/wfs/v1/upload`，两边对不上又都不想改，就在 Nginx 这层直接改写掉。

接手老项目、对接第三方接口时经常遇到这种情况。比在代码里到处硬编码路径干净得多，路径变了只改一行配置。

### 10.5 ssl配置

HTTPS 现在是标配，浏览器对 HTTP 页面标红警告，Service Worker、地理位置、剪贴板这些 API 全都要求安全上下文。

- 超文本传输安全协议（缩写：HTTPS，英语：Hypertext Transfer Protocol Secure）是超文本传输协议和SSL/TLS的组合，用以提供加密通讯及对网络服务器身份的鉴定。HTTPS连接经常被用于万维网上的交易支付和企业信息系统中敏感信息的传输。HTTPS不应与在RFC 2660中定义的安全超文本传输协议（S-HTTP）相混。HTTPS 目前已经是所有注重隐私和安全的网站的首选，随着技术的不断发展，HTTPS 网站已不再是大型网站的专利，所有普通的个人站长和博客均可以自己动手搭建一个安全的加密的网站。


- 创建`SSL`证书，如果你购买的证书，就可以直接下载

```bash
sudo mkdir /etc/nginx/ssl
# 创建了有效期100年，加密强度为RSA2048的SSL密钥key和X509证书文件。
sudo openssl req -x509 -nodes -days 36500 -newkey rsa:2048 -keyout /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt
# 上面命令，会有下面需要填写内容
Country Name (2 letter code) [AU]:US
State or Province Name (full name) [Some-State]:New York
Locality Name (eg, city) []:New York City
Organization Name (eg, company) [Internet Widgits Pty Ltd]:Bouncy Castles, Inc.
Organizational Unit Name (eg, section) []:Ministry of Water Slides
Common Name (e.g. server FQDN or YOUR name) []:your_domain.com
Email Address []:admin@your_domain.com
```

这条 `openssl req -x509` 命令生成的是自签名证书，浏览器打开会报「不安全」的警告，因为没有任何受信任的 CA 给它背书。它只适合本地开发和内网测试。

对外的站点用 Let's Encrypt 就行，免费、自动续期，装个 certbot 一条命令搞定，`certbot --nginx` 甚至能自动改好 Nginx 配置。这个方案 2018 年就已经成熟了，今天更是没有理由再花钱买 DV 证书。

命令里 `-days 36500` 是一百年有效期，这个只对自签证书有意义。公网 CA 签发的证书有效期一直在缩短，目前主流是 90 天到 13 个月，所以自动续期几乎是必须的，别指望手动去换。

填写信息时唯一要认真填的是 `Common Name`，它必须和你的域名完全一致，填错了浏览器会报域名不匹配。

- 创建自签证书

```bash
首先，创建证书和私钥的目录
# mkdir -p /etc/nginx/cert
# cd /etc/nginx/cert
创建服务器私钥，命令会让你输入一个口令：
# openssl genrsa -des3 -out nginx.key 2048
创建签名请求的证书（CSR）：
# openssl req -new -key nginx.key -out nginx.csr
在加载SSL支持的Nginx并使用上述私钥时除去必须的口令：
# cp nginx.key nginx.key.org
# openssl rsa -in nginx.key.org -out nginx.key
最后标记证书使用上述私钥和CSR：
# openssl x509 -req -days 365 -in nginx.csr -signkey nginx.key -out nginx.crt
```

这套 `openssl genrsa` 加 `req -new` 加 `x509 -req` 的三步走是更传统的签发流程，中间会生成一个 CSR（证书签名请求）文件。跟 CA 买证书时提交的就是这个 CSR。

中间那两行 `cp nginx.key nginx.key.org` 和 `openssl rsa -in nginx.key.org -out nginx.key` 是在去掉私钥的口令。这一步不能省，因为带口令的私钥每次启动 Nginx 都要人工输入密码，服务器重启就起不来了。这个坑很多人踩过：本地测试好好的，一配开机自启动就发现服务起不来，日志里等着输密码。

查看目前nginx编译选项

```
sbin/nginx -V
```

输出下面内容

```
nginx version: nginx/1.7.8
built by gcc 4.4.7 20120313 (Red Hat 4.4.7-4) (GCC)
TLS SNI support enabled
configure arguments: --prefix=/usr/local/nginx-1.7.8 --with-http_ssl_module --with-http_spdy_module --with-http_stub_status_module --with-pcre
```

这行 `configure arguments` 就是前面反复提到的那把钥匙。配置报 `unknown directive`，八成是对应模块没编进去，敲一次 `nginx -V` 比翻半小时文档管用。

顺带说一句，输出里的 `--with-http_spdy_module` 现在已经不存在了。SPDY 是 HTTP/2 标准化之前的过渡协议，Nginx 早就把它移除，换成了 `--with-http_v2_module`。看到老文章里的 `spdy` 参数直接换成 v2 就行。

如果依赖的模块不存在，可以进入安装目录，输入下面命令重新编译安装。

```bash
./configure --prefix=/usr/local/nginx --with-http_stub_status_module --with-http_ssl_module
```

运行完成之后还需要`make` (不用make install)

```bash
# 备份nginx的二进制文件
cp -rf /usr/local/nginx/sbin/nginx   /usr/local/nginx/sbin/nginx.bak
# 覆盖nginx的二进制文件
cp -rf objs/nginx   /usr/local/nginx/sbin/
```

这套「只 make 不 make install，手动替换二进制」的操作就是 Nginx 的平滑升级流程，加模块和升版本都用它。关键点是 `make install` 会连配置文件一起覆盖，把你辛苦调好的 `nginx.conf` 冲掉，所以绝对不能跑。

备份那一步千万别省。新二进制要是有问题，把 `nginx.bak` 拷回去就能立刻回滚，这是最便宜的保险。

替换完之后需要重启服务生效。Nginx 还支持一种更漂亮的做法，给 master 发 `USR2` 信号让它启动新版本的进程，新老两套并存，确认没问题再发 `WINCH` 和 `QUIT` 让老的退出，全程不断一个连接。这套流程官方文档有详细说明，正式环境升级值得照着做一遍。

HTTPS server

```nginx
server {
    listen       443 ssl;
    server_name  localhost;

    ssl_certificate /etc/nginx/ssl/nginx.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx.key;
    # 禁止在header中出现服务器版本，防止黑客利用版本漏洞攻击
    server_tokens off;
    # 设置ssl/tls会话缓存的类型和大小。如果设置了这个参数一般是shared，buildin可能会参数内存碎片，默认是none，和off差不多，停用缓存。如shared:SSL:10m表示我所有的nginx工作进程共享ssl会话缓存，官网介绍说1M可以存放约4000个sessions。 
    ssl_session_cache    shared:SSL:1m; 

    # 客户端可以重用会话缓存中ssl参数的过期时间，内网系统默认5分钟太短了，可以设成30m即30分钟甚至4h。
    ssl_session_timeout  5m; 

    # 选择加密套件，不同的浏览器所支持的套件（和顺序）可能会不同。
    # 这里指定的是OpenSSL库能够识别的写法，你可以通过 openssl -v cipher 'RC4:HIGH:!aNULL:!MD5'（后面是你所指定的套件加密算法） 来看所支持算法。
    ssl_ciphers  HIGH:!aNULL:!MD5;

    # 设置协商加密算法时，优先使用我们服务端的加密套件，而不是客户端浏览器的加密套件。
    ssl_prefer_server_ciphers  on;

    location / {
        root   html;
        index  index.html index.htm;
    }
}
```

这份 HTTPS server 配置的注释写得挺细，我补几个今天要调整的地方。

`ssl_session_cache shared:SSL:1m` 里的 1MB 偏小了，官方给的换算是 1MB 存约 4000 个会话，稍有流量就不够用，建议至少 10MB。`ssl_session_timeout 5m` 也偏短，注释里说的内网系统调到 30 分钟是合理的。

`ssl_ciphers HIGH:!aNULL:!MD5;` 这一串在今天不够用。它没有排除掉一些已经不安全的套件，也没有优先选择支持前向保密的 ECDHE。这里我不打算给一串具体的推荐值，因为套件列表随着新漏洞披露一直在变，抄一份两年前的下来大概率已经过时。正确做法是去 Mozilla SSL Configuration Generator，选你的 Nginx 版本和 OpenSSL 版本，它会生成当前时点的推荐配置。

这份配置里没有出现 `ssl_protocols`，用的是默认值。今天必须显式写出来，只留 TLSv1.2 和 TLSv1.3，把 TLSv1 和 TLSv1.1 关掉，这两个版本已经被各大浏览器停止支持，合规检查也过不了。

还有一个老配置里常见的 `ssl on;` 指令，这里没写是对的。它已经废弃并被移除，正确写法就是这段里的 `listen 443 ssl`。

### 10.6 强制将http重定向到https

```nginx
server {
    listen       80;
    server_name  example.com;
    rewrite ^ https://$http_host$request_uri? permanent;    # 强制将http重定向到https
    # 在错误页面和 Server 响应头字段中启用或禁用 nginx 版本号。 防止黑客利用版本漏洞攻击
    server_tokens off;
}
```

这里用 `rewrite ^ https://$http_host$request_uri? permanent;` 是可以工作的，但更简洁的写法是 `return 301 https://$host$request_uri;`。两个区别：`return` 不跑正则更省开销，用 `$host` 而不是 `$http_host` 能避免请求头缺失或者带端口时出问题。末尾那个 `?` 是防止原有查询串被重复追加，用 `$request_uri` 时其实不需要。

补一条今天该加的：跳转到 HTTPS 之后，建议在 443 的 server 块里加上 HSTS 头 `add_header Strict-Transport-Security "max-age=31536000" always;`，让浏览器以后直接用 HTTPS 访问，连第一次的明文跳转都省掉。这个头一旦生效很难撤回，上线前确认整站都能走 HTTPS 再开。

### 10.7 两个虚拟主机

一台机器挂多个站点，靠的就是 `server_name` 区分。

- 纯静态`-html` 支持

```nginx
http {
    server {
        listen          80;
        server_name     www.domain1.com;
        access_log      logs/domain1.access.log main;
        location / {
            index index.html;
            root  /var/www/domain1.com/htdocs;
        }
    }
    server {
        listen          80;
        server_name     www.domain2.com;
        access_log      logs/domain2.access.log main;
        location / {
            index index.html;
            root  /var/www/domain2.com/htdocs;
        }
    }
}
```

这两个 server 块监听同一个 80 端口，靠 `server_name` 决定请求归谁。浏览器发请求时会在 Host 头里带上域名，Nginx 读这个头来匹配。

所以本地测试多虚拟主机不用改端口，改 hosts 文件把两个域名都指到同一个 IP 就行。这也解释了为什么用 IP 直接访问会命中「默认」的那个 server，因为 Host 头里是 IP，匹配不上任何 `server_name`。

### 10.8 虚拟主机标准配置

```nginx
http {
  server {
    listen          80 default;
    server_name     _ *;
    access_log      logs/default.access.log main;
    location / {
       index index.html;
       root  /var/www/default/htdocs;
    }
  }
}
```

`listen 80 default` 这个参数指定了默认虚拟主机，域名匹配不上时就交给它。不显式指定的话，同端口第一个 server 块自动当默认。

`server_name _ *;` 这种写法是想匹配任意域名，其中 `_` 是个约定俗成的无效域名占位符。不过既然已经有 `default` 参数了，`server_name` 写什么其实不重要。

生产环境我建议把默认站点配成直接 `return 444`，也就是不返回任何东西直接关连接。拿 IP 扫描你服务器的请求全都落在这儿，444 连响应头都不发，比返回一个正经页面省资源，也不给对方任何信息。

### 10.9 防盗链

```nginx
location ~* \.(gif|jpg|png|swf|flv)$ {
   root html;
   valid_referers none blocked *.nginxcn.com;
   if ($invalid_referer) {
     rewrite ^/ http://www.nginx.cn;
     #return 404;
   }
}
```

原文这段有两行漏了分号（`root html` 和 `rewrite ^/ www.nginx.cn`），照抄过去 `nginx -t` 直接报错，我补上了。`rewrite` 的目标也补成了带协议的完整地址，不然会被当成相对路径处理。

防盗链的原理是检查 `Referer` 请求头，不是自己站点发起的请求就拒掉。`valid_referers` 里的 `none` 表示放行没有 Referer 的请求，这条要想清楚再开：用户直接在地址栏敲图片地址、从收藏夹打开都属于这种，放行体验更好，但伪造一个空 Referer 太容易了。

说到今天的情况，Referer 防盗链的可靠性比 2018 年低了不少。浏览器默认的 `Referrer-Policy` 收紧成了 `strict-origin-when-cross-origin`，跨站请求只发送域名不带路径，跨协议降级时干脆不发。所以会有越来越多的合法请求落进 `none` 这一类。真正要保护的资源，现在更常见的做法是签名 URL，给链接加上时间戳和 HMAC，过期即失效，Nginx 靠 `secure_link` 模块就能做。

### 10.10虚拟目录配置

alias指定的目录是准确的，root是指定目录的上级目录，并且该上级目录要含有location指定名称的同名目录。

```nginx
location /img/ {
    alias /var/www/image/;
}
# 访问/img/目录里面的文件时，ningx会自动去/var/www/image/目录找文件
location /img/ {
    root /var/www/image;
}
# 访问/img/目录下的文件时，nginx会去/var/www/image/img/目录下找文件。]
```

这两段对比是理解 `root` 和 `alias` 差别的最好例子，记住「拼接」和「替换」这两个词就不会错。`root` 是把 location 匹配到的路径原样接在后面，`alias` 是把匹配到的那段整个换掉。

还有一条硬规矩，`alias` 的路径末尾斜杠必须和 `location` 的末尾斜杠保持一致。`location /img/` 配 `alias /var/www/image/` 是对的，配 `alias /var/www/image` 就会拼出 `/var/www/imagefoo.png`。这个错误 `nginx -t` 检查不出来，语法完全合法，只有访问时才 404。

### 10.11 防盗图配置

```nginx
location ~ \/public\/(css|js|img)\/.*\.(js|css|gif|jpg|jpeg|png|bmp|swf) {
    valid_referers none blocked *.jslite.io;
    if ($invalid_referer) {
        rewrite ^/  http://wangchujiang.com/piratesp.png;
    }
}
```

这段比上面那个防盗链多了一层意思，它不是拒绝访问，而是把盗链的请求重定向到一张「请勿盗图」的图片上。对方站点上会显示你换过去的那张图，效果比直接 403 显示裂图更有意思，也算是一种温和的提示。

### 10.12 屏蔽.git等文件

```nginx
location ~ (.git|.gitattributes|.gitignore|.svn) {
    deny all;
}
```

这条是安全基线里必须有的一项。前端项目部署时如果整个目录直接扔上服务器，`.git` 目录会一起带上去，而 `.git` 里有完整的提交历史和源码。攻击者只要访问 `/.git/config` 确认存在，就能用现成工具把整个仓库拉下来，包括你可能不小心提交过的密钥和数据库密码。

这个漏洞在实际扫描中命中率非常高，主要因为发布流程里用 `scp -r` 或者 `rsync` 不加排除规则的团队不在少数。除了在 Nginx 这层拦掉，更根本的做法是构建产物和源码目录分开，只把 `dist` 传上去。

顺带一提，`.env`、`.svn`、`composer.json`、`package.json` 这些也建议一并加进屏蔽列表。

### 域名路径加不加需要都能正常访问

```bash
http://wangchujiang.com/api/index.php?a=1&name=wcj
                                  ^ 有后缀

http://wangchujiang.com/api/index?a=1&name=wcj
                                 ^ 没有后缀
```

- `nginx rewrite`规则如下：

```nginx
rewrite ^/(.*)/$ /index.php?/$1 permanent;
if (!-d $request_filename){
        set $rule_1 1$rule_1;
}
if (!-f $request_filename){
        set $rule_1 2$rule_1;
}
if ($rule_1 = "21"){
        rewrite ^/ /index.php last;
}
```

这套 `if` 加 `set` 拼标志位的写法，是早年在 Nginx 里模拟「同时满足多个条件」的经典技巧，因为 Nginx 的 `if` 不支持 `&&`。两个 `if` 各自往变量前面拼一个数字，最后判断拼出来的是不是 `21`，等价于「既不是目录也不是文件」。

思路挺巧，但今天完全不用这么写。`try_files $uri $uri/ /index.php?$query_string;` 一行就能表达同样的意思，而且没有 `if` 的那些副作用。前面 6.4 提过官方那篇「If Is Evil」，说的就是这类写法的风险。

留着这段是因为你在维护老项目时大概率会遇到，看到 `set $rule_1` 这种变量名就知道是这个套路，改成 `try_files` 即可。

## 十一、错误问题

```bash
The plain HTTP request was sent to HTTPS port
```

- 解决办法，`fastcgi_param HTTPS $https if_not_empty` 添加这条规则，

```nginx
server {
    listen 443 ssl; # 注意这条规则
    server_name  my.domain.com;
    
    fastcgi_param HTTPS $https if_not_empty;
    fastcgi_param HTTPS on;

    ssl_certificate /etc/ssl/certs/your.pem;
    ssl_certificate_key /etc/ssl/private/your.key;

    location / {
        # Your config here...
    }
}
```

这个报错的场景是这样：某个 server 块配了 `listen 443 ssl`，但客户端用 `http://` 加 443 端口去访问，Nginx 收到的是明文请求却按 TLS 解析，就返回这个错误。用 `curl http://domain:443` 能稳定复现。

除了原文给的 `fastcgi_param` 方案，更常见的两种情况和解法值得一并说清楚。

一种是配置里 `listen 443;` 漏了 `ssl` 参数，Nginx 把 TLS 流量当明文解析，浏览器直接报错。补上 `ssl` 就好。另一种是同一个 server 块既 `listen 80` 又 `listen 443 ssl`，80 端口进来的明文请求被当成 TLS 处理。正确做法是拆成两个 server 块，80 那个只做 `return 301` 跳转。

原文给的 `fastcgi_param HTTPS $https if_not_empty;` 解决的是另一层问题，让后端 PHP 知道当前是 HTTPS 请求，避免它生成 `http://` 开头的绝对链接。注意下面紧跟的 `fastcgi_param HTTPS on;` 会把上一行的条件判断覆盖掉，两行同时写是矛盾的，实际用的时候留一行就够。

## 十二、精品文章参考

- [负载均衡原理的解析](https://my.oschina.net/u/3341316/blog/877206)
- [Nginx泛域名解析，实现多个二级域名 ](http://blog.githuber.cn/posts/73)
- [深入 NGINX: 我们如何设计性能和扩展](https://www.nginx.com/blog/inside-nginx-how-we-designed-for-performance-scale/)
- [Inside NGINX: How We Designed for Performance & Scale](https://www.nginx.com/blog/inside-nginx-how-we-designed-for-performance-scale/)
- [Nginx开发从入门到精通](http://tengine.taobao.org/book/index.html)
- [Nginx的优化与防盗链](http://os.51cto.com/art/201703/535326.htm#topx)
- [实战开发一个Nginx扩展 (Nginx Module)](https://segmentfault.com/a/1190000009769143)
- [Nginx+Keepalived(双机热备)搭建高可用负载均衡环境(HA)](https://my.oschina.net/xshuai/blog/917097)
- [Nginx 平滑升级](http://www.huxd.org/articles/2017/07/24/1500890692329.html)
- [Nginx 的 ngx_http_mirror_module 模块分析，可以做版本发布前的预先验证，进行流量放大后的压测等等](https://mp.weixin.qq.com/s?__biz=MzIxNzg5ODE0OA==&mid=2247483708&idx=1&sn=90b0b1dccd9c337922a0588245277666&chksm=97f38cf7a08405e1928e0b46d923d630e529e7db8ac7ca2a91310a075986f8bcb2cee5b4953d#rd)
