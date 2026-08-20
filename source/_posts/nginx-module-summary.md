---
title: Nginx中常用的模块整理与选型清单
description: 按能力维度梳理 Nginx 常用模块，access、auth_basic、stub_status、log、gzip、ssl、rewrite、referer、proxy、fastcgi、upstream、stream 各自能干什么、什么时候该用、参数怎么调，附踩坑与选型建议。
date: 2018-11-27 10:40:24
tags:
  - Nginx
  - 模块
  - 运维
categories: Back-end
---

> Nginx 配置文件在线生成: https://nginxconfig.io/

Nginx 让人头疼的地方不在于指令难，而在于指令太多，而且不告诉你它属于哪个模块。你想做个限速，查到 `limit_rate`；想做个健康检查，查到 `health_check`，兴冲冲配上去 reload，报 `unknown directive`。原因是它压根不在你编译进来的模块里，或者干脆是商业版才有的。

这篇把 Nginx 里我实际用过的模块按能力分门别类过一遍，每个模块回答三个问题，它能干什么、什么场景下你会需要它、参数里哪几个是真正要调的。清单里的配置片段全部保留原样，我在每段前后补上了它在解决什么问题，以及自己踩过的坑。写于 2018 年，涉及 SSL、HTTP/2 这类会过时的部分，我把当年的写法留着，另起小段说明现在的情况。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 进程与事件层的性能参数，`worker_processes` 到底该写几
- `ngx_http_core_module` 里那批高频指令，从 `listen` 到 `limit_except`
- 访问控制、用户认证、状态查看这三个「运维刚需」模块
- 日志、压缩、SSL 三个和线上表现直接相关的模块怎么调
- `rewrite` 和 `referer` 的常见用法与陷阱
- 反向代理模块的缓存体系，`proxy_cache_path` 那一长串参数分别管什么
- `upstream` 的调度算法选型，以及哪些参数只在商业版生效
- `stream` 模块做四层代理，什么时候它比 HAProxy 更合适
- 配套的内核参数调优，以及这批参数在今天还成不成立

先说明一点，下面这些模块里，标准发行版默认编译进来的只是一部分。`stub_status`、`ssl`、`stream` 这几个都需要在 `./configure` 阶段显式打开。装完之后敲一句 `nginx -V`，把输出里的 `configure arguments` 看一遍，你手上这个二进制有什么能力，那一行说得清清楚楚。这一步能省掉大量「配了没生效」的排查时间。

## 一、性能相关配置

这一组指令都写在配置文件的最外层，也就是 main 上下文，它们决定 Nginx 起几个干活的进程、每个进程能扛多少连接。调错了的表现不是报错，而是压测时怎么都上不去。

```
worker_processes number | auto;
```

> `worker`进程的数量；通常应该为当前主机的`cpu`的物理核心数。多于`8`个的话建议写`8`，超过`8`个性能不会提升，稳定性降低

原文这句「多于 8 个建议写 8」是当年多数机器只有四核八核的经验值，现在服务器动辄三四十核，直接写 `auto` 让 Nginx 自己读 CPU 核心数就行。有一个场景要留神，在容器里跑的时候 `auto` 读到的是宿主机的核心数，而不是你给容器限的那点配额。给容器限了 2 核却起了 32 个 worker，进程之间抢 CPU 反而更慢。这种情况下就得按配额写死。

```bash
worker_cpu_affinity auto [cpumask] #将work进程绑定在固定cpu上提高缓存命中率 
# 例：
worker_cpu_affinity 0001 0010 0100 1000;
worker_cpu_affinity 0101 1010;
```

`worker_cpu_affinity` 是把每个 worker 钉死在指定的 CPU 核心上，减少进程在核心之间来回迁移带来的缓存失效。掩码是二进制位，`0001` 表示第一个核，`0010` 表示第二个核，一行写几组就是几个 worker 各自绑一个核。这个参数只在 Nginx 是这台机器上的主力进程时才划算，机器上还跑着数据库或者别的服务，绑核反而会让调度器没法腾挪。日常我基本不动它。

```bash
worker_priority number
# 指定worker进程的nice值，设定worker进程优先级： [-20,20]
```

这里原文写的取值区间不准，Linux 的 nice 值范围是 `-20` 到 `19`，越小优先级越高。想让 Nginx 在混部机器上抢到更多 CPU，可以往负值调，但改之前先确认这台机器上没有比它更重要的服务。

```bash
worker_rlimit_nofile number
worker # 进程所能够打开的文件数量上限,默认较小，生产中需要调大如65535。系统资源通过配置修改/etc/security/limits.conf 例：root soft nofile 65535，或命令修改ulimit -n，修改后需重启服务或系统生效。
```

这个参数是我认为整组里最容易被忽略、也最容易背锅的一个。Nginx 每接一个连接就要占一个文件描述符，反向代理场景下还要再占一个连回后端的。系统默认的 `ulimit -n` 通常是 1024，你把 `worker_connections` 配成 10240 是没用的，连接数到一千出头就开始报 `too many open files`。

改这个参数得两头一起改，配置里的 `worker_rlimit_nofile` 和系统的 `/etc/security/limits.conf` 缺一不可。

## 二、事件驱动events相关的配置

`events` 块管的是「怎么收连接」。它只有三四个指令，但每一个都直接决定并发上限。

- 每个`worker`进程所能够打开的最大并发连接数数量，如`10240`
- 总最大并发数： `worker_processes * worker_connections`

```bash
worker_connections number
```

这里的算法要注意，`worker_processes * worker_connections` 算出来的是「连接数」不是「并发请求数」。做反向代理的时候，一个客户端请求要占两个连接（客户端来的一个，转发到后端的一个），所以能撑的实际并发请求数要再除以 2。这个换算我一开始也是漏掉的，按 10240 去估容量，实测只有一半。

- 指明并发连接请求的处理方法,默认自动选择最优方法不用调整

```bash
use method
# 如：use epoll;
```

`use` 这个指令基本不用手动写。Linux 上 Nginx 会自动选 `epoll`，FreeBSD 上选 `kqueue`，都是当前平台最优的那个。手写它唯一的用处是排查问题时确认它到底选了谁，`nginx -V` 和启动日志里都能看到。

- `on`指由各个`worker`轮流处理新请求
- `Off`指每个新请求的到达都会通知(唤醒)所有的`worker`进程，但只有一个进程可获得连接，造成「惊群」，影响性能，默认`on`

```bash
# 处理新的连接请求的方法
accept_mutex on | off # 互斥；
```

`accept_mutex` 是历史遗留问题的解法。早年内核没有解决惊群，多个 worker 同时被唤醒去抢一个连接，抢不到的白白唤醒一次，CPU 就浪费在这上面。加个互斥锁让 worker 轮流去 accept，惊群没了，但代价是新连接进来要等锁，高并发下反而增加延迟。

现在的情况反过来了。较新的 Nginx 版本里 `accept_mutex` 默认是 `off`，因为内核层面已经有 `EPOLLEXCLUSIVE` 和 `SO_REUSEPORT` 来处理惊群，比应用层加锁高效得多。真正推荐的做法是在 `listen` 上加 `reuseport`，让内核直接把连接分发到各个 worker，连锁都不用。原文写的默认值 `on` 是老版本的行为，具体默认值随版本变过，改之前对着你手上那个版本的官方文档确认一下。

## 三、http核心模块相关配置ngx_http_core_module

`ngx_http_core_module` 是唯一一个不用编译开关、不用额外声明就一定在的模块。你在 `nginx.conf` 里写的 `server`、`location`、`root`、`listen`，全部由它提供。所以它不像别的模块那样有一个明确的「功能边界」，它更像是 Nginx 的语法本身。

这一节的指令数量最多，我按用途分成了几块，实际配置时会反复回来查的也就是下面这十来个。

### 3.1web服务模板

一个虚拟主机的最小骨架就三行，监听哪个端口、认哪个域名、文件在哪。

```bash
server { ... }
# 配置一个虚拟主机
server {
    listen address[:PORT]|PORT;
    server_name SERVER_NAME; # 指令指向不同的主机名
    root /PATH/TO/DOCUMENT_ROOT;
} 
```

这个骨架有个容易忽略的点，`root` 写在 `server` 层还是 `location` 层结果不一样。写在 `server` 层是所有 `location` 的默认值，写在某个 `location` 里就只对那一段生效并且覆盖外层。混着写的时候，找不到文件的 404 往往就出在这儿。

### 3.2套接字相关配置

`listen` 决定这个 server 块从哪个地址、哪个端口收请求，后面那一串可选参数平时用到的不多，但每一个都是在特定场景下救过命的。

```bash
listen address[:port] [default_server] [ssl] [http2 | spdy] [backlog=number] [rcvbuf=size] [sndbuf=size]
```
- `default_server` 设定为默认虚拟主机
- `ssl` 限制仅能够通过`ssl`连接提供服务
- `backlog=number` 超过并发连接数后，新请求进入后援队列的长度
- `rcvbuf=size` 接收缓冲区大小
- `sndbuf=size` 发送缓冲区大小

`default_server` 管的是「域名对不上时给谁」。有人拿 IP 直接访问你的服务器，或者把自己的域名解析到你的 IP 上，这类请求匹配不到任何 `server_name`，Nginx 就交给 `default_server`。不显式指定的话，同端口第一个 `server` 块自动当默认。生产环境我一般会专门写一个只返回 444 的默认块，把这类野请求直接掐掉。

`backlog` 是内核层面的等待队列长度，短时间涌进来大量新连接、worker 一时来不及 accept 的时候，多出来的连接排在这个队列里。队列满了内核就直接丢，客户端表现为连接超时而不是 502。这个值同时受 `net.core.somaxconn` 限制，只调 Nginx 不调内核是没用的，这一点和后面那份 sysctl 调优是配套的。

`spdy` 现在已经不用看了，它是 HTTP/2 标准化之前的过渡协议，早就从 Nginx 里移除。至于 `listen 443 ssl http2` 这个写法，新版本改成了独立的 `http2 on;` 指令，老写法一段时间内还兼容但会有 deprecated 提醒。你手上是哪种，以 `nginx -V` 的版本号对着官方文档看，别照抄博客。

### 3.3 server_name

- 支持*通配任意长度的任意字符

```
server_name *.magedu.com www.magedu.*
```

- 支持`~`起始的字符做正则表达式模式匹配，性能原因慎用

```
server_name ~^www\d+\.magedu\.com$   #\d 表示 [0-9]
```

**匹配优先级机制从高到低：**

- 首先是字符串精确匹配 如： `www.magedu.com`
- 左侧`*`通配符 如： `*.magedu.com`
- 右侧`*`通配符 如： `www.magedu.*`
- 正则表达式 如： `~^.*\.magedu\.com$`
- `default_server`

这个优先级顺序值得单独记一下，因为它和 `location` 的匹配规则完全不是一套逻辑，很多人会混着记然后记岔。`server_name` 是「谁更精确谁赢」，和写在配置文件里的先后顺序无关；正则排在通配符后面，意味着你写了一条 `~^.*\.magedu\.com$` 也抢不过一条 `*.magedu.com`。

正则形式的 `server_name` 我建议能不用就不用。它对每个请求都要跑一遍正则，量大的时候是实打实的开销，而且出问题时排查起来比通配符麻烦得多。`location` 那套匹配规则更绕一些，我在 [Nginx location 匹配规则](https://feinterview.poetries.top/blog/nginx-location-match-rules) 里单独拆过。

### 3.4 延迟发送选项


```
tcp_nodelay on | off;
tcp_nopush  on | off;
```

- 在`keep alived`模式下的连接是否启用`TCP_NODELAY`选项。
- `tcp_nopush`必须在`sendfile`为`on`时才有效，当为`off`时，延迟发送，合并多个请求后再发送
- 默认`On`时，不延迟发送
- 可用于： `http`, `server`, `location`

这两个选项管的是同一件事的两头，要不要攒一攒再发。`tcp_nodelay on` 关掉 Nagle 算法，小包立刻发出去，延迟低但包多；`tcp_nopush on` 反过来，等攒满一个 MSS 再发，吞吐高但首字节会慢一点点。

看起来矛盾，实际上 Nginx 里这两个常常一起开。原因是 Nginx 做了配合，发响应体的时候用 `tcp_nopush` 把头和body攒到一起发出去，发到最后一个包的时候自动切回 `tcp_nodelay` 立刻推出去，两头的好处都占了。默认配置里两个都是 `on`，绝大多数场景不用动。

### 3.5 sendfile

```bash
sendfile on | off;
```

> 是否启用`sendfile`功能，在内核中封装报文直接发送。如用来进行下载等应用磁盘IO重负载应用可设置为`off`，以平衡磁盘与网络IO处理速度降低系统负载，如图片显示不正常把这个改为`off`。默认`Off`

`sendfile` 是零拷贝，文件数据从磁盘到网卡全程在内核里走，不用先读到 Nginx 的用户态内存再写回内核。静态资源服务开这个能省掉大量内存拷贝，收益很直接。

原文提到「如图片显示不正常把这个改为 off」，这条经验值得说清楚来龙去脉。历史上有过一类问题，共享目录（比如 NFS、虚拟机的共享文件夹）配合 `sendfile` 会读到脏数据，表现就是图片花掉或者截断。本地磁盘不会有这个问题。所以判断标准不是「图片坏了就关 sendfile」，而是「文件是不是放在网络文件系统上」。

### 3.6 隐藏版本信息

> 是否在响应报文的`Server`首部显示`nginx`版本

```bash
server_tokens on | off | build | string
```

这一条属于安全基线里最便宜的一项。默认响应头会带上 `Server: nginx/1.14.0`，扫描器拿到精确版本号就能直接对着 CVE 列表打。关掉之后只剩 `Server: nginx`，虽然挡不住有心人，但能过滤掉绝大部分无脑扫描。

把 `Server` 头彻底删掉需要 `headers_more` 这类第三方模块，标准版做不到，`server_tokens off` 已经是原生能做到的极限了。

### 3.7 location匹配

```bash
location [ = | ~ | ~* | ^~ ] uri { ... }
location @name { ... }
```

> 在一个`server`中`location`配置段可存在多个，用于实现从`uri`到文件系统的路径映射； `ngnix`会根据用户请求的`URI`来检查定义的所有`location`，并找出一个最佳匹配，而后应用其配置 

```bash
server {...
    server_name www.magedu.com;
    location /images/ {
        root /data/imgs/;
        }
}
http://www.magedu.com/images/logo.jpg
--> /data/imgs/images/logo.jpg 
```

- `=`：对`URI`做精确匹配； 
- `^~`：对`URI`的最左边部分做匹配检查，不区分字符大小写
- `~`：对`URI`做正则表达式模式匹配，区分字符大小写
- `~*`：对`URI`做正则表达式模式匹配，不区分字符大小写
不带符号：匹配起始于此`uri`的所有的`uri`
匹配优先级从高到低：
- `=`, `^~`, `~`/`~*`, 不带符号

这里有个坑要注意，原文那行优先级里的波浪号是全角的 `～`，正确写法是半角 `~`，写成全角 Nginx 直接报语法错误。这类字符我在别人给的配置里遇到过好几次，多半是从网页复制粘贴带进来的，`nginx -t` 会告诉你第几行有问题，但它不会告诉你是「这个符号长得像但不是」。

另外 `^~` 那条描述也要澄清一下。它做的是前缀匹配，`^~` 这个符号的含义是「一旦这条前缀匹配上了，就别再去试正则了」，而不是「不区分大小写的前缀匹配」。前缀匹配本身是否区分大小写取决于操作系统的文件系统，Nginx 这一层的比较是区分的。

匹配顺序完整说一遍是这样：先找 `=` 精确匹配，命中就结束；再把所有前缀匹配（含 `^~` 和不带符号的）里最长的那条记下来，如果它带 `^~` 就直接用；否则按配置文件里出现的先后顺序试正则，第一条命中的赢；正则全都不中，才回过头用刚才记下的最长前缀。

**路径别名alias path**

示例：

```bash
# http://www.magedu.com/bbs/index.php

location /bbs/ {
    alias /web/forum/;
} # --> /web/forum/index.php
location /bbs/ {
    root /web/forum/;
}     # --> /web/forum/bbs/index.php    
```

原文这两行注释里写的是 `index.html`，但上面请求的是 `index.php`，前后对不上，我按实际行为改成了 `index.php`。

**注意**：

> `location`中使用`root`指令和`alias`指令的意义不同    

- `root`，相当于追加在`root`目录后面  
- `alias`，相当于对`location`中的`url`进行替换

`root` 和 `alias` 的区别是 Nginx 新手 404 的头号来源，记住「拼接」和「替换」这两个词基本就不会错了。`root` 是把 location 匹配到的那段路径原样接在后面，`alias` 是把匹配到的那段路径整个换掉。

还有一条实践上的硬规矩，`alias` 的路径末尾斜杠必须和 `location` 的末尾斜杠保持一致。`location /bbs/` 配 `alias /web/forum/` 是对的，配 `alias /web/forum` 就会拼出 `/web/forumindex.php`。这个错误 `nginx -t` 检查不出来，因为语法完全合法，只有访问的时候才 404，然后你对着 error.log 里的路径盯半天。

再补一句，`alias` 不能用在带正则的 `location` 里而不做捕获组引用，这种组合官方文档明确不推荐。真要按正则拆路径，用 `root` 加 `rewrite` 更稳。

### 3.8 错误页面显示

```
error_page code ... [=[response]] uri;
```

**模块：**

```
ngx_http_core_module
```

- 定义错误页， 以指定的响应状态码进行响应
- 可用位置： `http`, `server`, `location`, `if in location`

```bash
error_page 404 /404.html
error_page 404 =200 /404.html  #防止404页面被劫持
```

第二行那个 `=200` 是把响应状态码改写成 200 再返回错误页。原文注释写「防止 404 页面被劫持」，说的是早年一些运营商会拦截 404 响应插广告，把状态码改成 200 就绕过去了。

这个技巧现在要慎用。全站 HTTPS 之后运营商没法在中间插东西，劫持的前提已经不成立了；反过来，把 404 伪装成 200 会让搜索引擎把大量不存在的 URL 当成正常页面收录，SEO 上是纯亏。做单页应用的时候尤其容易踩，很多人为了让前端路由生效就写 `error_page 404 =200 /index.html`，正确做法是用 `try_files` 兜底，具体写法我在 [Nginx try_files 指令详解](https://feinterview.poetries.top/blog/nginx-try-files) 里展开过。

### 3.9 长连接相关配置

```
keepalive_timeout timeout [header_timeout];
```

- 设定保持连接超时时长， `0`表示禁止长连接， 默认为`75s`

```
keepalive_requests number;
```

- 在一次长连接上所允许请求的资源的最大数量，默认为`100`

```
keepalive_disable none | browser ...
```

- 对哪种浏览器禁用长连接

```
send_timeout time;
```

- 向客户端发送响应报文的超时时长，此处是指两次写操作之间的间隔时长，而非
整个响应过程的传输时长

`send_timeout` 这条描述里的区别很关键。它算的是两次成功写操作之间的间隔，不是整个响应传输花了多久。所以一个 2GB 的文件下载十分钟不会超时，只要数据一直在往外流；但客户端要是卡住不收了，超过这个时长 Nginx 就断开。用它当「下载超时」来配的人不少，其实配错了对象。

`keepalive_timeout` 的默认 75 秒对移动端来说偏长。移动网络下客户端经常静默断开，服务端还傻等着，连接就白占着。做纯 API 网关我一般压到 30 秒以内，配合 `keepalive_requests` 一起看。顺带说一句，`keepalive_requests` 默认 100 在今天算很小了，一个稍微复杂点的页面就能发出上百个请求，到了 100 就重新握手一次，新版本已经把默认值调大了。

### 3.10 请求报文缓存

```
client_body_buffer_size size;
```

> 用于接收每个客户端请求报文的body部分的缓冲区大小；默认为`16k`；超出此大小时，其将被暂存到磁盘上的由`client_body_temp_path`指令所定义的位置

```
client_body_temp_path path [level1 [level2 [level3]]];
```

> 设定用于存储客户端请求报文的`body`部分的临时存储路径及子目录结构和数量 
目录名为`16`进制的数字；

```
client_body_temp_path /var/tmp/client_body 1 2 2
```

- `1`级目录占1位`16`进制，即`2^4=16个目录 `0-f`
- `2`级目录占2位`16`进制，即`2^8=256`个目录 `00-ff`
- `3`级目录占2位`16`进制， 即`2^8=256`个目录 `00--ff` 

为什么要分这么多级目录？因为传统文件系统在单个目录下放几十万个文件时，查找性能会掉得很难看。拆成三级之后每层最多几百个条目，`ls` 也不会卡住。同样的目录分级思路后面 `proxy_cache_path` 的 `levels` 参数还会再出现一次，它俩解决的是同一个问题。

顺带提一下，POST 一个大文件时如果 body 超了 `client_body_buffer_size`，Nginx 会落到磁盘临时文件。这个行为在容器里跑要留神，临时目录默认在容器的可写层，大量上传会把镜像层撑爆，最好挂个卷出去。

### 3.11 对客户端进行限制相关配置

```
limit_rate rate;
```

> 限制响应给客户端的传输速率，单位是`bytes/second` 默认`0`表示无限制

```
limit_except method ... { ... }
```
> 仅用于`location`限制客户端使用除了指定的请求方法之外的其它方法 
`method:GET`, `HEAD`, `POST`, `PUT`, `DELETE`，`MKCOL`, `COPY`, `MOVE`, `OPTIONS`, `PROPFIND`,
`PROPPATCH`, `LOCK`, `UNLOCK`, `PATCH`

```bash
# 例：
limit_except GET {
    allow 192.168.1.0/24;
    deny all;
} 
```

> 除了`GET`和`HEAD` 之外其它方法仅允许`192.168.1.0/24`网段主机使用

`limit_except` 的语义是反的，写 `limit_except GET` 表示「限制除 GET 之外的所有方法」，块里的 `allow`/`deny` 作用在被限制的那些方法上。我第一次用的时候理解反了，配完发现 GET 也被拦了，排查了一下才明白它连 `HEAD` 也一并放行（因为 HEAD 被当作 GET 的一部分）。

这个指令适合做一件很具体的事，把一个对外只读的接口锁成真正只读，写操作只许内网发起。比 `if ($request_method = POST)` 那种写法稳，因为 `if` 在 Nginx 里的行为有一堆边界情况，能不用就不用。

`limit_rate` 限的是单个连接的速率，不是单个用户的。客户端开十个连接下载，实际带宽就是十倍。真要按用户限速得配合 `limit_conn` 一起用，把并发连接数也压住。

## 四、访问控制模块ngx_http_access_module

按 IP 放行或者拦截，这是最基础的一道门。管理后台、`/status` 这类监控端点、内网才能访问的接口，都靠它。它的规则简单到没有歧义，也正因为简单，出错的地方几乎只有一个，顺序。

> 实现基于`ip`的访问控制功能

```bash
allow address | CIDR | unix: | all;
deny address | CIDR | unix: | all;
http, server, location, limit_except
```

> 自上而下检查，一旦匹配，将生效，条件严格的置前

```bash
#示例：

location / {
    deny 192.168.1.1;
    allow 192.168.1.0/24;
    allow 10.1.0.0/16;
    allow 2001:0db8::/32;
    deny all;
}
```

原文这里写的是 `allow 10.1.1.0/16`，掩码 16 位对应的网段应该是 `10.1.0.0/16`，主机位不能有值，我改成了正确写法。

这几行的执行顺序是从上往下，命中一条就停。所以第一行单独拒掉 `192.168.1.1` 必须写在第二行放行整个 `/24` 网段的前面，调个个儿这台机器就进来了。规则一多就容易乱，我的习惯是把最具体的放最上面，最后一行永远是 `deny all` 兜底。

这里有个坑要注意，Nginx 前面挂了 CDN 或者云厂商的负载均衡时，`allow`/`deny` 看到的是 CDN 回源节点的 IP，不是真实用户 IP，这套规则就完全失效了。要按真实 IP 判断得先配 `ngx_http_realip_module`，用 `set_real_ip_from` 声明可信的代理网段，让 Nginx 从 `X-Forwarded-For` 里取真实地址。这个模块标准版自带但需要编译时打开，`nginx -V` 里搜 `realip` 确认。

## 五、用户认证模块ngx_http_auth_basic_module

IP 白名单挡不住的场景，比如你自己在外面出差要连管理后台，就得上账号密码。HTTP Basic Auth 是最省事的一档，不用改应用代码，Nginx 这一层就拦下来了。

> 实现基于用户的访问控制，使用`basic`机制进行用户认证

```bash
auth_basic string | off;
auth_basic_user_file file;
location /admin/ {
    auth_basic "Admin Area";
    auth_basic_user_file /etc/nginx/.ngxpasswd;
}
```

`auth_basic` 后面那个字符串会显示在浏览器弹出的登录框标题上，随便写但别写敏感信息。设成 `off` 可以在子 location 里取消继承来的认证，做「整站要密码但某个路径公开」时用得上。

**用户口令：**

- 明文文本：格式`name:password:comment`
- 加密文本：由`htpasswd`命令实现 `httpd-tools`所提供
- `htpasswd` [`-c`第一次创建时使用] [`-D`删除用户] `passwdfile`   `username`

`htpasswd -c` 那个 `-c` 是 create，只有第一次建文件时能用，第二次再带上它会把整个文件覆盖掉，之前建的用户全没了。这个我踩过，加第二个用户的时候顺手复制了上一条命令，结果第一个账号直接消失。

还有一条必须说的：Basic Auth 把用户名密码做 Base64 编码放在请求头里，Base64 不是加密，抓包就能还原成明文。所以它只能配合 HTTPS 用，纯 HTTP 下开 Basic Auth 等于把密码明着发出去。它适合保护运维端点，不适合当业务的登录体系。

## 六、状态查看模块ngx_http_stub_status_module

想知道 Nginx 现在扛着多少连接、处理了多少请求，靠这个模块。它输出的信息很少，就七个数字，但排查「是不是打满了」的时候，这七个数字比什么都直接。

> 用于输出nginx的基本状态信息

- `Active connections`:当前状态，活动状态的连接数
- `accepts`：统计总值，已经接受的客户端请求的总数
- `handled`：统计总值，已经处理完成的客户端请求的总数
- `requests`：统计总值，客户端发来的总的请求数
- `Reading`：当前状态，正在读取客户端请求报文首部的连接的连接数
- `Writing`：当前状态，正在向客户端发送响应报文过程中的连接数
- `Waiting`：当前状态，正在等待客户端发出请求的空闲连接数 

```bash
# 示例：

location /status {
    stub_status;
    allow 172.16.0.0/16;
    deny all;
}
```

这几个字段里最有诊断价值的是 `accepts` 和 `handled` 的差值。正常情况下这两个数应该几乎相等，一旦 `handled` 明显小于 `accepts`，说明有连接被接下来又丢掉了，通常就是撞到了 `worker_connections` 上限或者文件描述符不够。这是判断「要不要扩容」最快的一个信号。

`Waiting` 数很大不用慌，那是开着 keepalive 但当前没有请求的空闲连接，属于正常状态。`Reading` 长期高才要查，那意味着大量请求头收不全，可能是慢速攻击。

这个模块默认不编译，`./configure` 时要带 `--with-http_stub_status_module`。装的时候顺手加上，不然真出问题时你连个观测口都没有。配置里那两行 `allow`/`deny` 千万别省，状态页暴露到公网等于把容量信息送人。

## 七、日志记录模块ngx_http_log_module

日志这块很多人是不配的，用默认的 `combined` 格式凑合。真到线上出问题要查「这个 502 是哪台后端返回的、耗时多少」，默认格式一个字段都给不了你。所以这个模块值得花十分钟配好，收益是长期的。

```
log_format name string
```

- `string`可以使用`nginx`核心模块及其它模块内嵌的变量

```
access_log path [format [buffer=size] [gzip[=level]] [flush=time] [if=condition]];
access_log off;
```

- 访问日志文件路径，格式及相关的缓冲的配置

```
buffer=size
flush=time 
```

```bash
# 示例
log_format compression '$remote_addr-$remote_user [$time_local] '
                         '"$request" $status $bytes_sent '
                         '"$http_referer" "$http_user_agent" "$gzip_ratio"';
access_log /spool/logs/nginx-access.log compression buffer=32k; 

# json格式日志示例
log_format json '{"@timestamp":"$time_iso8601",'
                                 '"client_ip":"$remote_addr",'
                                 '"size":$body_bytes_sent,'
                                 '"responsetime":$request_time,'
                                 '"upstreamtime":"$upstream_response_time",'
                                 '"upstreamhost":"$upstream_addr",'
                                 '"http_host":"$host",'
                                 '"method":"$request_method",'
                                 '"request_uri":"$request_uri",'
                                 '"xff":"$http_x_forwarded_for",'
                                 '"referrer":"$http_referer",'
                                 '"agent":"$http_user_agent",'
                                 '"status":"$status"}';
```

这份 JSON 格式我一直在用，它比 `combined` 强的地方全在那几个额外字段上。`$request_time` 是 Nginx 从收到请求第一个字节到发完响应最后一个字节的总耗时，`$upstream_response_time` 是后端花的时间，两个一减就知道慢在网络还是慢在应用。`$upstream_addr` 告诉你这个请求打到了哪台后端，负载均衡出问题时全靠它定位。`$http_x_forwarded_for` 留着追真实客户端。

写成 JSON 是为了直接喂给 ELK 或者 Loki，不用再写 grok 正则去拆。有一个细节要注意，`$body_bytes_sent` 和 `$request_time` 这两个我没加引号，因为它们是数字，加了引号进 ES 之后会被识别成字符串，后面想做聚合统计就得重建索引。

```
open_log_file_cache max=N [inactive=time] [min_uses=N] [valid=time];
```

- `open_log_file_cache off`; 缓存各日志文件相关的元数据信息
- `max`：缓存的最大文件描述符数量
- `min_uses`：在`inactive`指定的时长内访问大于等于此值方可被当作活动项
- `inactive`：非活动时长
- `valid`：验正缓存中各缓存项是否为活动项的时间间隔

```bash
# 例: 
open_log_file_cache max=1000 inactive=20s  valid=1m;
```

这个指令解决的是「按变量分文件写日志」的性能问题。如果你的 `access_log` 路径里带了变量，比如按域名或者按天分目录，Nginx 每写一条日志都要重新打开一次文件，系统调用开销很可观。缓存住文件描述符之后这笔开销就没了。路径是写死的场景用不上它，因为文件描述符本来就一直开着。

`buffer=32k` 那个参数也是同类优化，日志先攒在内存里，满了或者到了 `flush` 时间再落盘。代价是机器突然掉电会丢最后那一小段日志，对访问日志来说完全可以接受。

## 八、压缩相关选项ngx_http_gzip_module

传输压缩是前端能感知最明显的一项服务端优化。一个 500KB 的 JS bundle 开了 gzip 之后通常能压到 150KB 上下，首屏时间的改善是肉眼可见的。这一组参数里真正要动的只有四五个。

- `gzip on | off`;  #启用或禁用`gzip`压缩
- `gzip_comp_level level`;  #压缩比由低到高： `1` 到 `9 ` 默认： `1`
- `gzip_disable regex` ...;  #匹配到客户端浏览器不执行压缩
- `gzip_min_length length`;  #启用压缩功能的响应报文大小阈值 
- `gzip_http_version 1.0 | 1.1`; #设定启用压缩功能时，协议的最小版本 默认：`1.1`
- `gzip_buffers number size`;
支持实现压缩功能时缓冲区数量及每个缓存区的大小
默认： `32 4k` 或 `16 8k`
- `gzip_types mime-type` ...;
指明仅对哪些类型的资源执行压缩操作；即压缩过滤器
默认包含有`text/html`，不用显示指定，否则出错
- `gzip_vary on | off;`
如果启用压缩，是否在响应报文首部插入 `Vary: Accept-Encoding`
- `gzip_proxied off` | `expired` | `no-cache` | `no-store `|
`private` | `no_last_modified` | `no_etag `| `auth` | `any` ...;

> `nginx`对于代理服务器请求的响应报文，在何种条件下启用压缩功能

- `off`：对被代理的请求不启用压缩
- `expired`,`no-cache`, `no-store`， `private`：对代理服务器请求的响应报文首部`Cache-Control`值任何一个，启用压缩功能

```bash
# 示例：
gzip on;
gzip_comp_level 6;
gzip_http_version 1.1;
gzip_vary on;
gzip_min_length 1024;
gzip_buffers 16 8k;
gzip_proxied any;
gzip_disable "MSIE[1-6]\.(?!.*SV1)";
gzip_types text/xml text/plain text/css application/javascript application/xml application/json;
```

这份配置基本可以直接抄，我逐条说下为什么是这些值。

`gzip_comp_level 6` 是性价比拐点。1 到 9 里，从 6 往上压缩率提升很小，CPU 消耗却接近翻倍。我实测过一个 300KB 的 JS，level 6 和 level 9 的差距不到 3%，但耗时差了一倍多。

`gzip_min_length 1024` 是必须配的。小于 1KB 的文件压完可能比原文件还大，因为 gzip 有固定的头部开销，再加上一次压缩的 CPU 时间，纯亏。默认值是 20 字节，等于什么都压，一定要改。

`gzip_types` 里千万别加 `text/html`，Nginx 强制对它启用压缩，你再写一遍会直接报错。同样也别加图片和视频类型，JPEG、PNG、MP4 本身已经是压缩格式，再压一次只有 CPU 开销没有体积收益。

`gzip_vary on` 影响的是缓存正确性。开了之后响应带 `Vary: Accept-Encoding`，CDN 和中间代理才知道要按客户端支不支持压缩分别缓存两份。不开这条，可能出现「不支持 gzip 的客户端拿到了压缩版本」的乱码问题。

`gzip_proxied any` 是给反向代理场景用的，不配的话，来自上游代理的请求默认不压缩，你会发现直连有压缩、走 CDN 就没有。

`gzip_disable "MSIE[1-6]"` 这条现在可以删了。IE6 早就不在支持范围内，留着它每个请求都要跑一次 User-Agent 正则，纯浪费。

说到今天的做法，gzip 之外还有 Brotli。同样的内容 Brotli 通常比 gzip 再小 15% 到 20%，主流浏览器都支持了。Nginx 官方版本没有内置 Brotli，要装 Google 维护的 `ngx_brotli` 模块，或者用 OpenResty 这类已经打包好的发行版。两个可以共存，客户端带什么 `Accept-Encoding` 就给什么。我自己的站点是静态资源构建时预先生成 `.br` 和 `.gz` 两份，运行时直接发文件，连压缩的 CPU 都省了。

## 九、https模块ngx_http_ssl_module模块：

HTTPS 现在不是可选项。浏览器对 HTTP 页面标红警告，Service Worker、地理位置、剪贴板这些 API 全都要求安全上下文。这个模块的参数不多，但每一个都直接关系到安全评级。

- `ssl on | off`; 为指定虚拟机启用`HTTPS protocol`， 建议用`listen`指令代替
- `ssl_certificate file`; 当前虚拟主机使用PEM格式的证书文件
- `ssl_certificate_key file`; 当前虚拟主机上与其证书匹配的私钥文件
- `ssl_protocols [SSLv2] [SSLv3] [TLSv1] [TLSv1.1] [TLSv1.2]`; 支持`ssl`协议版本，默认为后三个
- `ssl_session_cache off | none | [builtin[:size]]
[shared:name:size]`;
  - `builtin[:size]`：使用`OpenSSL`内建缓存，为每`worker`进程私有
  - `[shared:name:size]`：在各`worker`之间使用一个共享的缓存 
- `ssl_session_timeout time`;
  - 客户端连接可以复用`ssl session cache`中缓存的`ssl`参数的有效时长，默认`5m`

```bash
# 示例：
server {
    listen 443 ssl;
    server_name www.magedu.com;
    root /vhosts/ssl/htdocs;
    ssl on;
    ssl_certificate /etc/nginx/ssl/nginx.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx.key;
    ssl_session_cache shared:sslcache:20m;
    ssl_session_timeout 10m;
}
```

先说这段配置里最值得关注的一行，`ssl_session_cache shared:sslcache:20m`。TLS 握手是 HTTPS 里最贵的一步，涉及非对称加密运算和多次往返。会话缓存让复访的客户端跳过完整握手，直接复用之前协商好的密钥。20MB 大概能存四五万个会话，对中小站点绰绰有余。关键是必须用 `shared` 而不是 `builtin`，`builtin` 是每个 worker 各存一份，客户端下次连到另一个 worker 上照样要重新握手，等于白配。

再说这段配置里过时的部分，一共两处。

第一处是 `ssl on;`。这条指令已经废弃并在新版本中移除了，正确写法就是这段配置里已经有的 `listen 443 ssl`。两种写法同时出现在一个 server 块里，是当年从老配置改过来时留下的历史包袱。今天新写配置，只写 `listen 443 ssl`，`ssl on` 一行都不要有。

第二处是协议版本。原文列出的 `ssl_protocols` 里包含 SSLv2、SSLv3、TLSv1、TLSv1.1，这些今天全都不能开。SSLv2 和 SSLv3 有已知的可利用漏洞，TLS 1.0 和 1.1 已被各大浏览器停止支持，PCI DSS 之类的合规要求也明确禁止。现在的基线是只开 TLSv1.2 和 TLSv1.3。

至于加密套件 `ssl_ciphers` 具体写哪一串，我的建议是别抄博客，包括别抄这篇。套件的推荐列表随着新漏洞披露一直在变，抄一份两年前的下来大概率已经不合适了。去 Mozilla SSL Configuration Generator 上选你的 Nginx 版本和 OpenSSL 版本，它会生成当前时点的推荐配置，这是最省心也最可靠的做法。

顺带说一句 HTTP/2 和 HTTP/3。HTTP/2 需要编译时带 `--with-http_v2_module`，开启后多路复用能显著改善并发请求多的页面。HTTP/3 基于 QUIC，Nginx 在较新的版本里提供了支持，但需要特定的 OpenSSL 分支，部署门槛比 HTTP/2 高不少。还有一个当年很火的 `http2_push` 服务端推送，Chrome 已经移除了对它的支持，现在不用再考虑，要预加载资源就用 `<link rel="preload">` 配合 `103 Early Hints`。

## 十、重定向模块ngx_http_rewrite_module

`rewrite` 是 Nginx 里威力最大也最容易写出事的模块。域名跳转、URL 美化、老链接迁移、A/B 分流，都在它手上。它的麻烦在于有一套自己的执行阶段和循环机制，不了解的话很容易写出无限重定向。

1. **rewrite regex replacement [flag]**

> 将用户请求的`URI`基于`regex`所描述的模式进行检查，匹配到时将其替换为`replacement`指定的新的`URI`。注意：如果在同一级配置块中存在多个`rewrite`规则，那么会自下而下逐个检查；被某条件规则替换完成后，会重新一轮的替换检查

- 隐含有循环机制,但不超过`10`次；如果超过，提示`500`响应码，`[flag]`所表示的标志位用于控制此循环机制
- 如果`replacement`是以`http://`或`https://`开头，则替换结果会直接以重向返回给客户端 `[flag]`：
- `last`：重写完成后停止对当前`URI`在当前`location`中后续的其它重写操作，而后对新的URI启动新一轮重写检查；提前重启新一轮循环
- `break`：重写完成后停止对当前`URI`在当前`location`中后续的其它重写操作，而后直接跳转至重写规则配置块之后的其它配置；结束循环，建议在`location`中使用
- `redirect`：临时重定向，重写完成后以临时重定向方式直接返回重写后生成的新URI给客户端，由客户端重新发起请求；不能以`http://`或`https://`开头，使用相对路径，状态码： `302`
- `permanent`:重写完成后以永久重定向方式直接返回重写后生成的新URI给客户端，由客户端重新发起请求，状态码：`301`

```bash
# 例：
rewrite ^/zz/(.*\.html)$  /zhengzhou/$1 break;
rewrite ^/zz/(.*\.html)$  https://www.dianping.com/zhengzhou/$1 permanent;
```

原文第二行的域名写成了 `www.dianping`，少了顶级域，我补全了。

这四个 flag 的区别是这个模块里最需要搞清楚的东西。`last` 和 `break` 都停止当前 location 里后续的 rewrite，区别在于下一步去哪：`last` 会拿新 URI 重新走一遍 location 匹配，`break` 是直接在当前 location 里继续往下执行。

判断用哪个有个简单标准。如果重写后的路径需要被另一个 location 处理（比如重写成 `/api/` 然后交给代理），用 `last`；如果重写只是为了改文件路径、还在当前 location 里读文件，用 `break`。用错的典型症状是 `last` 写在了应该 `break` 的地方，然后新 URI 又匹配回同一个 location，转十次之后报 500。

`redirect` 和 `permanent` 是真的让浏览器再发一次请求，区别只是 302 和 301。这里有个实践上的教训：301 会被浏览器长期缓存，而且很难清掉。域名迁移这种确定不会改的用 301，任何还可能变的场景都先用 302，等稳定了再换。我见过有人测试环境配了 301，改完之后本机怎么都跳到旧地址，最后只能开无痕窗口验证。

原文提到「`redirect` 不能以 `http://` 或 `https://` 开头」，这个说法容易引起误解。实际规则是，如果 replacement 以 `http://`、`https://` 或 `$scheme` 开头，Nginx 会直接返回重定向而不管你写没写 flag，此时默认用 302；想要 301 就显式写 `permanent`。所以带完整 URL 时写 `redirect` 是多余的，不是不允许。

2. **return**

> 停止处理，并返回给客户端指定的响应码

```bash
return code [text];
return code URL;
return URL;
```

能用 `return` 解决的事就别用 `rewrite`。`return` 不跑正则，开销更小，意图也更清楚。最典型的例子是 HTTP 跳 HTTPS，`return 301 https://$host$request_uri;` 一行搞定，比写 `rewrite ^(.*)$ https://...` 干净得多。

还有个冷门但很好用的值是 `return 444`。这是 Nginx 自定义的非标准状态码，含义是不返回任何响应直接关闭连接。扫描器和恶意请求打过来，444 连响应头都不发，比返回 403 更省资源，也不给对方任何信息。

3. **rewrite_log on | off;**

> 是否开启重写日志, 发送至`error_log（notice level）`

4. **set $variable value;**

- 用户自定义变量
- 注意：变量定义和调用都要以`$`开头

5. **if (condition) { ... }**

> 引入新的上下文,条件满足时，执行配置块中的配置指令； `server`, `location`

**比较操作符**：
- `==` 相同
- `!=` 不同
- `~：`模式匹配，区分字符大小写
- `~*`：模式匹配，不区分字符大小写
- `!~`：模式不匹配，区分字符大小写
- `!~*`：模式不匹配，不区分字符大小写
文件及目录存在性判断：
- `-e`, `!-e` 存在（包括文件，目录，软链接）
- `-f`, `!-f` 文件
- `-d`, `!-d` 目录
- `-x`, `!-x` 执行 

```bash
# 浏览器分流示例：
if ($http_user_agent ~ Chrom) {
rewrite ^(.*)$  /chrome/$1 break;                                                 
}
if ($http_user_agent ~ MSIE) {
rewrite ^(.*)$  /IE/$1 break;                                                      
}
```

`rewrite_log on` 配合 `error_log ... notice;` 一起开，能把每一次重写的前后 URI 都打到日志里。规则一多、跳来跳去搞不清楚的时候，这是最省事的排查手段。调完记得关掉，日志量不小。

关于 `if`，Nginx 社区有一篇著名的官方 wiki 文章标题就叫「If Is Evil」，说的是 `if` 在 location 里的行为很多时候和直觉不符。原因是它属于 rewrite 模块，只在特定阶段执行，块内能安全使用的指令其实很有限，写别的指令可能静默失效甚至段错误。

安全的用法只有两种，`if` 里面只写 `return`，或者只写 `rewrite`。上面这个浏览器分流的例子恰好符合这条，所以它是安全的。要做复杂判断，优先考虑 `map` 指令，它在配置解析阶段就展开成查表，没有 `if` 的那些副作用，性能也更好。

## 十一、引用模块ngx_http_referer_module

防盗链模块。你的图片被别人的站直接引走，带宽是你出、流量是人家赚，这个模块就是拦这个的。

```
valid_referers none|blocked|server_names|string ...;
```

> 定义`referer`首部的合法可用值，不能匹配的将是非法值,用于防盗链，

- `none`：请求报文首部没有`referer`首部,比如直接在浏览器打开一个图片
- `blocked`：请求报文有`referer`首部，但无有效值，伪装的头部信息。
- `server_names`：参数，其可以有值作为主机名或主机名模式
- `arbitrary_string`：任意字符串，但可使用`*`作通配符
- `regular expression`：被指定的正则表达式模式匹配到的字符串,要使用`~`开头，
- 例如： `~.*\.magedu\.com `

```bash
# 示例：
location ~*^.+\.(jpg|gif|png|swf|flv|wma|wmv|asf|mp3|mmf|zip|rar)$ {
valid_referers none blocked server_names *.magedu.com
*.mageedu.com magedu.* mageedu.* ~\.magedu\.;
if ($invalid_referer) {
return 403;
}
access_log off;
}
```

原文这段 `if` 块里 `return 403;` 后面还跟了一行 `break；`，两个问题：那个分号是全角的，Nginx 会直接报语法错；而且 `return` 已经终止处理了，后面的 `break` 永远执行不到。我把这行删掉了。

配置里那个 `none` 参数要想清楚再放行。它表示请求头里根本没有 Referer，用户直接在地址栏敲图片地址、从收藏夹打开、或者浏览器出于隐私策略不发 Referer，都是这种情况。放行它体验更好，但防盗链的效果也会打折，因为伪造一个空 Referer 太容易了。

说到今天的情况，Referer 防盗链的可靠性比 2018 年低了不少。浏览器默认的 `Referrer-Policy` 收紧成了 `strict-origin-when-cross-origin`，跨站请求只发送源站域名不带路径，跨协议降级时干脆不发。所以你会看到越来越多的合法请求落进 `none` 这一类。真正要保护的资源，现在更常见的做法是签名 URL，给链接加上时间戳和 HMAC，过期即失效，这个 Nginx 靠 `secure_link` 模块就能做。

## 十二、反向代理模块ngx_http_proxy_module

这是前端接触最多的一个模块。本地开发的接口转发、生产环境的 API 网关、把静态资源和动态接口挂到同一个域名下解决跨域，全靠它。指令很多，但真正常用的就 `proxy_pass`、`proxy_set_header` 加上一组超时参数。缓存那一套单独占了半个模块，值得专门看。

### 12.1 proxy_pass URL

```
Context:location, if in location, limit_except
```

> 注意： `proxy_pass`后面的路径不带`uri`时，其会将`location`的`uri`传递给后端主机

```bash
server {
    ...
    server_name HOSTNAME;
    location /uri/ {
    proxy_pass http://host[:port]; 
    }
    ...
}
```

- 上面示例： `http://HOSTNAME/uri --> http://host/uri`
- `http://host[:port]/` 意味着： `http://HOSTNAME/uri --> http://host/ `
- 注意：如果`location`定义其`uri`时使用了正则表达式的模式，则`proxy_pass`之后必须不能使用`uri`; 
- 用户请求时传递的`uri`将直接附加代理到的服务的之后

```bash
server {
    ...
    server_name HOSTNAME;
    location ~|~* /uri/ {
    proxy_pass http://host; 不能加/
    }
    ...
}
# http://HOSTNAME/uri/ --> http://host/uri/
```

`proxy_pass` 后面带不带 URI 部分，这是整个 Nginx 配置里排名第一的坑。规则本身一句话就能说清：带了 URI（哪怕只是一个斜杠），Nginx 就用它替换掉 location 匹配的那一段；没带，就把原始 URI 原样接上去。

正则 location 里不能带 URI 这一条也要记住。因为正则匹配的结果是不定长的，Nginx 没法确定该替换掉哪一段，所以直接禁止，写了 `nginx -t` 就报错。这个限制反过来说明了一件事，需要改写路径的场景，正则 location 配 `rewrite ... break` 加不带 URI 的 `proxy_pass` 才是正解。

后面第二部分我用四个具体例子把这个斜杠的四种组合都跑了一遍，对着看更清楚。

### 12.2 proxy_set_header field value

> 设定发往后端主机的请求报文的请求首部的值

```
Context: http, server, location
```

- 后端记录日志记录真实请求服务器`IP`

```bash
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

原文第一行末尾用的是全角分号，那样 Nginx 起不来，我改成了半角。

这三行几乎是所有反向代理配置的标配，值得逐条说。

`Host` 不转发的话，后端收到的 Host 头是 `proxy_pass` 里写的那个上游地址，不是用户访问的域名。后端如果按域名区分租户，或者框架用 Host 生成绝对链接（Laravel、Django 都会），就全乱了。表现通常是重定向跳到了内网地址上。

`X-Real-IP` 和 `X-Forwarded-For` 都是传递客户端真实 IP，区别在于前者只有一个值，后者是逗号分隔的链路。`$proxy_add_x_forwarded_for` 这个变量会把已有的 `X-Forwarded-For` 加上当前 `$remote_addr` 拼起来，所以多层代理串起来能看到完整路径。

这里有个安全问题很多人没注意到，`X-Forwarded-For` 是客户端可以伪造的。用户直接构造一个 `X-Forwarded-For: 1.2.3.4` 发过来，Nginx 会在后面追加而不是丢弃。所以后端如果拿这个头做 IP 白名单或者限流，取值必须从右往左数、跳过你自己可信的代理层数，不能直接取第一个。真正安全的做法是在最外层入口用 `realip` 模块统一覆写。

另外还有两个头在 WebSocket 场景下必须补，`Upgrade` 和 `Connection`。少了它们协议升级握手过不去，表现为 WebSocket 连上就断，这个我排查过一下午才想起来是代理层吞了头。

**标准格式如下**：

- `X-Forwarded-For: client1, proxy1, proxy2 `

如后端是`Apache`服务器应更改日志格式：

```
%h -----> %{X-Real-IP}i
```

### 12.3 proxy_cache_path

> 定义可用于`proxy`功能的缓存； `Context:http`


```bash
# 定义可用于proxy功能的缓存； Context:http
proxy_cache_path path [levels=levels] [use_temp_path=on|off]
keys_zone=name:size [inactive=time] [max_size=size]
[manager_files=number] [manager_sleep=time]
[manager_threshold=time] [loader_files=number] [loader_sleep=time]
[loader_threshold=time] [purger=on|off] [purger_files=number]
[purger_sleep=time] [purger_threshold=time];

# 例：
proxy_cache_path /data/nginx/cache（属主要为nginx） levels=1:2 keys_zone=nginxcache:20m inactive=2m
```

这一长串参数看着吓人，真正必填的只有三个，路径、`keys_zone` 和一个大小上限。其余的全是调优项，默认值在多数场景下够用。

`keys_zone=nginxcache:20m` 里的 20m 是内存，存的是缓存键和元数据，不是缓存内容本身。官方给的换算大约是 1MB 能放 8000 个键。缓存内容在磁盘上，由 `max_size` 限制。这两个概念混淆的后果是，你以为配了 20MB 缓存，实际磁盘被塞满了。

`inactive=2m` 是「多久没人访问就删」，它和 `proxy_cache_valid` 定义的过期时间是两回事，很容易搞混。前者管的是磁盘空间回收，一个资源两分钟没人要就清掉，哪怕它还没过期；后者管的是内容新鲜度，过期了但还在磁盘上，Nginx 会去后端确认。生产环境 `inactive` 一般设得比 `proxy_cache_valid` 大，不然缓存刚建好就被回收，命中率上不去。

`levels=1:2` 就是前面 `client_body_temp_path` 提过的目录分级，避免单目录文件太多。不写这个参数所有缓存文件平铺在一个目录里，量大了之后连 `ls` 都要卡半天。

那句「属主要为 nginx」是实打实的经验。缓存目录的属主必须是 worker 进程的运行用户，配错了的表现是缓存永远不命中、error.log 里刷 `Permission denied`，但服务本身跑得好好的，不看日志根本发现不了。

### 12.4 调用缓存

```bash
proxy_cache zone | off; #默认off
```

> 指明调用的缓存，或关闭缓存机制； `Context: http`,`server`, `location`

### 12.5 proxy_cache_key string

> 缓存中用于「键」的内容

- 默认值： `proxy_cache_key $scheme$proxy_host$request_uri;`

缓存键决定了「什么算同一个请求」，配错了要么该命中的不命中，要么不该共享的串了数据。后者是真出过事故的类型，比如缓存键里漏掉了区分用户的维度，A 用户的个人页被缓存下来发给了 B 用户。

默认键里带了 `$proxy_host`，多个上游的时候各存各的。如果你的缓存对所有上游是等价的，去掉它能提高命中率。反过来，如果响应内容和 `Accept-Language`、`Accept-Encoding` 之类的头有关，就得把对应变量加进键里，否则中文用户可能拿到英文页面。

带用户态的接口，最稳妥的做法是干脆别缓存。判断标准很简单，响应里有没有和当前登录用户相关的信息，有就不缓存，宁可放弃这点性能。

### 12.6 proxy_cache_valid [code ...] time;

> 定义对特定响应码的响应内容的缓存时

> 定义在`http{...}`中

```bash
# 示例:
proxy_cache_valid 200 302 10m;
proxy_cache_valid 404 1m; 

# 示例：
# 在http配置定义缓存信
proxy_cache_path /var/cache/nginx/proxy_cache
levels=1:1:1 keys_zone=proxycache:20m
inactive=120s max_size=1g;

# 调用缓存功能，需要定义在相应的配置段，如server{...}；
proxy_cache proxycache;
proxy_cache_key $request_uri;
proxy_cache_valid 200 302 301 1h;
proxy_cache_valid any 1m;
```

这段完整示例把定义和调用分开写了，这个结构值得照搬。`proxy_cache_path` 只能写在 `http` 块，因为它要分配共享内存；`proxy_cache` 和它的配套指令写在 `server` 或 `location` 里，按路径决定缓存策略。

`proxy_cache_valid any 1m;` 这行是好习惯。不写它的话，除了显式列出的状态码，其它响应一律不缓存。加上之后 404、500 这类也会短暂缓存一分钟，好处是后端挂了的时候不会被同一批请求反复打穿。缓存时间要短，不然后端恢复了前面还在返回错误。

有一点要说清楚，`proxy_cache_valid` 的优先级低于后端返回的 `Cache-Control` 和 `Expires` 头。后端明确说了 `no-cache`，Nginx 就不会缓存，你在这儿配多久都没用。想强制忽略后端的意见，得用 `proxy_ignore_headers Cache-Control Expires;`，这个开关要慎用，用之前先确认后端不是有意设的。

### 12.7 proxy_cache_use_stale

> 在被代理的后端服务器出现哪种情况下，可以直接使用过期的缓存响应客户端

```bash
proxy_cache_use_stale error | timeout |
invalid_header | updating | http_500 | http_502 |
http_503 | http_504 | http_403 | http_404 | off ..
```

这个指令是我心目中整个缓存体系里最有价值的一条，它把缓存从「加速手段」变成了「兜底手段」。后端全挂的时候，用户拿到的是过期五分钟的旧内容，而不是一个 502 白页。对内容类站点来说，这个差别就是「有点旧」和「网站崩了」的差别。

其中 `updating` 这个值单独说一下。它的作用是缓存过期后，只放一个请求去回源更新，其余请求继续吃旧缓存。不加它的话，热点内容缓存一过期，成百上千个请求同时打到后端，这就是缓存击穿。配合 `proxy_cache_lock on;` 效果更彻底，后者会让同一个键上的并发回源请求排队等第一个的结果。

### 12.8 proxy_cache_methods GET | HEAD | POST

> 对哪些客户端请求方法对应的响应进行缓存， `GET`和`HEAD`方法总是被缓存

缓存 POST 请听起来很怪，但确实有场景，比如查询条件太长只能用 POST 传的搜索接口。要开的话必须把请求体也加进 `proxy_cache_key`，不然不同条件的查询会共用同一份缓存。这属于高级用法，没把握就别碰。

### 12.9 proxy_hide_header field;

> 用于隐藏后端服务器特定的响应首部

这条主要用来擦掉后端泄露的技术栈信息，`X-Powered-By: PHP/7.2`、`X-AspNet-Version` 这类头，攻击者拿到就知道该找哪些漏洞了。Nginx 默认已经隐藏了 `Date`、`Server` 等几个上游头，其余的要自己列。

反过来还有个配套指令 `proxy_pass_header`，用来放行那些被默认隐藏的头。两个搭配使用，能精确控制暴露给客户端的信息面。

### 12.10  proxy_connect_timeout time;

> 定义与后端服务器建立连接的超时时长，如超时会出现`502`错误，默认为`60s`，一般不建议超出`75s`

```
proxy_connect_timeout time;
```

### 12.11 proxy_send_timeout time

> 把请求发送给后端服务器的超时时长；默认为`60s`

### 12.12 proxy_read_timeout time; 

> 等待后端服务器发送响应报文的超时时长， 默认为60s

这三个超时管的是三个不同阶段，混在一起调是没用的，得先判断卡在哪一步。

`proxy_connect_timeout` 是 TCP 握手阶段，后端进程没起来或者防火墙拦了，卡的就是这里，表现为 502。这个值不该配大，后端活着的话建连是毫秒级的事，配成 60 秒只会让故障时的请求全堆在这儿。我一般配 2 到 5 秒。

`proxy_read_timeout` 是等后端返回数据，慢查询、大报表导出卡的是这里，表现为 504。它算的也是两次读之间的间隔而不是总时长，逻辑和前面的 `send_timeout` 一样。有长耗时接口的话单独给那个 location 调大，别把全局值拉高。

原文那句「不建议超出 75s」和后端的 keepalive 设置有关。很多应用服务器的空闲连接超时默认是 60 秒，Nginx 这边等得比它久，就会出现连接已经被对端关了、Nginx 还以为能用的情况，随机 502。所以这两头的超时值要对着配，Nginx 侧要比后端侧短。

## 十三、首部信息

`add_header` 是响应头的出口，安全策略头基本都在这儿加。

添加自定义首部

```
add_header name value [always];
```

添加自定义响应信息的尾部

```bash
add_header X-Via $server_addr;
add_header X-Cache $upstream_cache_status;
add_header X-Accel $server_name;
add_trailer name value [always];
```

`$upstream_cache_status` 这个变量非常好用，它的值是 `MISS`、`HIT`、`EXPIRED`、`BYPASS`、`STALE` 之一。加到响应头里，浏览器 F12 一看就知道这个请求走没走缓存，调缓存策略的时候比翻日志快多了。上线之后建议去掉，或者只对内网可见，暴露缓存状态对外没必要。

`add_header` 有两个坑必须说。

第一个是继承规则。子级 location 里只要出现了任何一条 `add_header`，父级的所有 `add_header` 全部失效，不是合并而是整体覆盖。所以在 `http` 层加了安全头，某个 location 里又加了一条别的头，那个 location 的安全头就全没了。排查这种问题很痛苦，因为配置看起来一点毛病没有。

第二个是 `always` 参数。不加 `always` 的话，这个头只在 2xx 和 3xx 响应上生效，4xx、5xx 都不带。CORS 相关的头如果不加 `always`，接口一报错前端立刻变成跨域错误，真正的错误信息完全看不到。

## 十四、php 相关模块ngx_http_fastcgi_module

原文标题里的 `hph` 是 `php` 的笔误，这个模块是给 PHP-FPM 这类 FastCGI 后端用的。前端同学可能觉得用不上，但如果你的站点还挂着 WordPress 或者接手过老项目，这一节会用到。

**fastcgi_pass address**

- `address`为后端的`fastcgi server`的地址
- 可用位置：` location`, `if in location`

**fastcgi_index name**

- `fastcgi`默认的主页资源
- 示例： `fastcgi_index index.php`

**fastcgi_param parameter value [if_not_empty];**

- 设置传递给 `FastCGI`服务器的参数值，可以是文本，变量或组合

示例1：

- 在后端服务器先配置`fpm server`和`mariadb-server`
- 在前端`nginx`服务上做以下配置：

```bash
location ~* \.php$ {
    fastcgi_pass # 后端fpm服务器IP:9000;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME
/usr/share/nginx/html$fastcgi_script_name;
    include     fastcgi.conf;    
    …    
}
```

`SCRIPT_FILENAME` 这个参数是整段配置里最关键的一行，它告诉 PHP-FPM 该执行哪个文件。写错了的表现是「File not found」，而且错误出现在 PHP-FPM 的日志里不在 Nginx 日志里，第一次遇到基本查不到方向。

这里还藏着一个经典安全问题。`location ~* \.php$` 这种写法配合 PHP 的 `cgi.fix_pathinfo=1`，会让 `/upload/evil.jpg/x.php` 这样的路径也被当成 PHP 执行，攻击者上传一个伪装成图片的脚本就能拿到执行权限。防的办法是加一条 `try_files $uri =404;`，确认文件真实存在再交给 FPM。这条在今天的主流配置模板里都是标配。

示例2：

- 通过`/pm_status`和`/ping`来获取`fpm server`状态信息（真实服务器端`php-fpm`配置文件中将这两项
注释掉）

```bash
location ~* ^/(status|ping)$ {
    include fastcgi_params;
    fastcgi_pass # 后端fpm服务器IP:9000;
    fastcgi_param SCRIPT_FILENAME $fastcgi_script_name;
    include     fastcgi.conf; 
}
```

**fastcgi 缓存相关**

```bash
fastcgi_cache_path path [levels=levels] [use_temp_path=on|off]
keys_zone=name:size [inactive=time] [max_size=size]
[manager_files=number] [manager_sleep=time] [manager_threshold=time]
[loader_files=number] [loader_sleep=time] [loader_threshold=time]
[purger=on|off] [purger_files=number] [purger_sleep=time]
[purger_threshold=time];
```

- 定义`fastcgi`的缓存；
- `path` 缓存位置为磁盘上的文件系统
- `max_size=size`
  - 磁盘`path`路径中用于缓存数据的缓存空间上限
- `levels=levels`：缓存目录的层级数量，以及每一级的目录数量
- `levels=ONE:TWO:THREE`
- 示例： `leves=1:2:2`
- `keys_zone=name:size`
  - `k/v`映射的内存空间的名称及大小
- `inactive=time` 非活动时长

`fastcgi_cache_path` 和前面的 `proxy_cache_path` 参数完全一样，两套缓存是各自独立的，用哪个取决于后端是 FastCGI 还是 HTTP。WordPress 这类动态站开 FastCGI 缓存，效果比装十个缓存插件都好，因为它在 PHP 执行之前就返回了。

## 十五、代理模块ngx_http_upstream_module模块

单台后端撑不住的时候，就轮到这个模块了。它本身不做代理，只负责定义「有哪些后端、按什么规则挑一台」，实际转发还是 `proxy_pass` 干的。选调度算法这件事，选错了不会报错，只会让某台机器莫名其妙比别的忙一倍。

> 用于将多个服务器定义成服务器组，而由`proxy_pass`,`fastcgi_pass`等指令进行引用

### 15.1 upstream name { ... }

```bash
# 定义后端服务器组，会引入一个新的上下文
# 默认调度算法是wrr

Context: http
upstream httpdsrvs {
server ...
server...
...
}
```

### 15.2 server address [parameters];

> 在`upstream`上下文中`server`成员，以及相关的参数； `Context:upstream`

**address的表示格式**

- `unix:/PATH/TO/SOME_SOCK_FILE`
- `IP[:PORT]`
- `HOSTNAME[:PORT]`
- **parameters**：
  - `weight=number`     权重，默认为`1`    
  - `max_conns`     连接后端报务器最大并发活动连接数， `1.11.5`后支持    
  - `max_fails=number`     失败尝试最大次数；超出此处指定的次数时    
  - `server`将被标记为不可用,默认为`1`
  - `fail_timeout=time` 后端服务器标记为不可用状态的连接超时时
长，默认`10s`
  - `backup` 将服务器标记为「备用」，即所有服务器均不可用时才启用
  - `down` 标记为「不可用」，配合`ip_hash`使用，实现灰度发布

`max_fails` 和 `fail_timeout` 这一对是被动健康检查，理解它们的联动关系很重要。含义是「在 `fail_timeout` 这段时间内失败了 `max_fails` 次，就把这台标记为不可用，然后持续 `fail_timeout` 这么久不给它派活」。同一个参数在两个地方起作用，这个设计一开始挺反直觉的。

默认的 `max_fails=1` 太敏感了，一次网络抖动就把整台后端摘掉。生产上我一般配 `max_fails=3 fail_timeout=30s`，容忍偶发失败，又能在真挂掉时及时切走。

什么算「失败」也有讲究。默认只有连接错误和超时算，后端返回 500 是不算的。要把 5xx 也算进去得配 `proxy_next_upstream`，但这个开关要小心，POST 请求重试到另一台可能造成重复提交。

`backup` 那台在正常情况下一点流量都没有，那它的状态其实就是未知的，等主力全挂了切过去，很可能发现它自己也有问题（版本旧了、依赖没起来）。所以要么定期演练，要么干脆别用 backup，把所有机器都放进正常轮询。

`down` 用来做发布最顺手。标记上去、reload 一下，这台就不再接新流量了，等它手上的请求处理完就可以停服务升级，升完再去掉 `down`。灰度发布和滚动升级基本就是这个套路。

### 15.3 ip_hash 源地址hash调度方法

按客户端 IP 算哈希，同一个 IP 永远落到同一台后端。它解决的是 session 保持问题，后端把会话存在本机内存里的时候必须用它，不然用户点两下就掉登录。

但它有两个硬伤。一是运营商 NAT 会让一大片用户共用一个出口 IP，全都压到同一台后端上，负载严重倾斜。二是加减机器时哈希结果会大面积变化，一次扩容能让多数用户的会话全部失效。

我的建议是别靠 `ip_hash` 解决 session，把会话存到 Redis 里，后端做成无状态的，然后随便用哪种调度算法都行。这个改造成本不高，收益是后面所有扩缩容都不用再提心吊胆。

### 15.4 least_conn

> 最少连接调度算法，当`server`拥有不同的权重时其为`wlc`，当所有后端主机连接数相同时，则使用`wrr`，适用于长连接

轮询假设每个请求的开销差不多，这个假设在有慢接口的系统里不成立。一台机器接连碰上几个大查询，轮询照样按顺序给它派活，它就越积越多。`least_conn` 看的是当前连接数，谁闲给谁，天然规避了这个问题。

请求耗时差异大的场景，比如混着查询和导出的后台系统，`least_conn` 明显比轮询稳。反过来说，如果所有请求都是几十毫秒的短平快，两者没什么区别，轮询还更省一点点开销。

### 15.5 hash key [consistent] 

> 基于指定的`key`的`hash`表来实现对请求的调度，此处的`key`可以直接文本、变量或二者组合

- 作用：将请求分类，同一类请求将发往同一个`upstream`

> `server`，使用`consistent`参数， 将使用`ketama`一致性`hash`算法，适用于后端是`Cache`服务器（如`varnish`）时使用

```bash
hash $request_uri consistent;
hash $remote_addr;
```

`consistent` 这个参数是精髓所在，它启用一致性哈希。普通哈希是「键对机器数取模」，机器从 4 台变成 5 台，几乎所有键的归属都会变；一致性哈希只会让大约 1/N 的键迁移。后端是缓存服务器的时候，这个差别就是「缓存整体失效」和「小部分回源」的差别。

`hash $request_uri consistent` 是给 CDN 回源层用的经典写法，同一个 URL 永远打到同一台缓存机，命中率能上去一大截。要注意 `$request_uri` 是带查询串的，如果查询串里有随机参数（时间戳、埋点 ID），每次哈希都不一样，缓存等于白做，这种情况要换成 `$uri`。

### 15.6 keepalive

- `keepalive` 连接`数N`;
- 为每个`worker`进程保留的空闲的长连接数量,可节约`nginx`端口，并减少连接管理的消耗

这个参数我认为是 upstream 里最被低估的一个。默认情况下 Nginx 到后端是短连接，每个请求都要三次握手加四次挥手，高 QPS 下会产生大量 TIME_WAIT 状态的连接，把本地端口耗光，表现是压测到某个值就上不去了，日志里开始报连接失败。

配它有个前提条件，光写 `keepalive 32;` 是不够的，还必须在 location 里补两行：

```bash
proxy_http_version 1.1;
proxy_set_header Connection "";
```

原因是 HTTP/1.0 不支持长连接，而 Nginx 到上游默认用的就是 1.0；另外客户端传过来的 `Connection` 头会被透传，值可能是 `close`，把它置空才不会干扰。这两行少一行，`keepalive` 就静默失效，配了跟没配一样，`nginx -t` 也不会提醒你。这个我踩过，当时以为参数没生效反复调数值，后来抓包才发现每次都在重新建连。

### 15.7 health_check [parameters]

> 健康状态检测机制；只能用于`location`上下文

**常用参数：**

- `interval=time`检测的频率，默认为`5`秒
- `fails=number`：判定服务器不可用的失败检测次数；默认为`1`次
- `passes=number`：判定服务器可用的失败检测次数；默认为`1`次
- `uri=uri`：做健康状态检测测试的目标`uri`；默认为`/`
- `match=NAME`：健康状态检测的结果评估调用此处指定的`match`配置块
- **注意**：仅对`nginx plus`有效

### 15.8 match name { ... }

> 对`backend server`做健康状态检测时，定义其结果判断机制；

只能用于`http`上下文

**常用的参数**：

- `status code[ code ...]`: 期望的响应状态码
- `header HEADER[operator value]`：期望存在响应首
部，也可对期望的响应首部的值基于比较操作符和值进行比较
- `body`：期望响应报文的主体部分应该有的内容
- 注意：仅对`nginx plus`有效

这两节末尾那句「仅对 nginx plus 有效」千万别跳过，它是选型层面的关键信息。`health_check` 和 `match` 是主动健康检查，Nginx 会定期主动去 ping 后端，后端挂了立刻摘掉。开源版没有这个能力，只有商业版 Nginx Plus 才有。

开源版能用的是前面 `server` 参数里的 `max_fails`/`fail_timeout`，属于被动检查，得先有真实用户请求失败了才发现问题。这个差别在故障时很要命，被动检查意味着总有一批用户会先撞上错误。

开源方案有两条路。一是 `nginx_upstream_check_module` 这个第三方模块，淘宝出的，能做主动检查，但需要打补丁重新编译。二是干脆换成有原生主动健康检查的组件，比如 OpenResty 加 `lua-resty-upstream-healthcheck`，或者上 Kubernetes 让 Ingress 和 readinessProbe 去管。选哪条取决于你的运维体量，小项目用被动检查加监控告警其实也够。

## 十六、ngx_stream_core_module模块

前面所有内容都在 HTTP 这一层。但有些东西不是 HTTP，MySQL、Redis、SSH、SMTP、DNS，这些协议 Nginx 也能代理，靠的就是 `stream` 模块。它工作在传输层，只管转发字节流，不解析内容。

> 模拟反代基于`tcp`或`udp`的服务连接，即工作于传输层的反代或调度器

```bash
stream { ... }

# 定义stream相关的服务； Context:main

stream {
    upstream telnetsrvs {
        server 192.168.22.2:23;
        server 192.168.22.3:23;
        least_conn;
    }
server {
    listen 10.1.0.6:23;
    proxy_pass telnetsrvs;
    }
} 
listen address:port [ssl] [udp] [proxy_protocol]
[backlog=number] [bind] [ipv6only=on|off] [reuseport]
[so_keepalive=on|off|[keepidle]:[keepintvl]:[keepcnt]];
```

注意 `stream` 块和 `http` 块是平级的，都直接写在配置文件最外层，不能嵌套。第一次配的时候我把它写进了 `http` 里面，`nginx -t` 报的错信息不太直观，愣是找了一会儿。

`stream` 模块默认不编译，要 `./configure --with-stream`。用发行版的包安装通常已经带了，`nginx -V` 确认一下。

四层代理相比七层有个绕不开的问题，后端拿不到客户端真实 IP。因为这一层没有 HTTP 头可以塞 `X-Forwarded-For`。解法是 `proxy_protocol`，它在 TCP 连接建立后先发一小段文本声明真实地址，但要求后端也支持解析这个协议。MySQL 不支持，所以四层代理数据库时，后端看到的永远是代理机的 IP，审计日志会失去意义，这一点上线前要跟 DBA 说清楚。

## 十七、ngx_stream_proxy_module模块

> 可实现代理基于·TCP·， ·UDP (1.9.13)·, ·UNIX-domain·

**sockets的数据流**

- `proxy_pass address`;指定后端服务器地址
- `proxy_timeout timeout`;无数据传输时，保持连接状态的超时时长
默认为`10m`
- `proxy_connect_timeout time`;设置`nginx`与被代理的服务器尝试建立连接的超时时长
默认为`60s`

```bash
stream {
    upstream telnetsrvs {
        server 192.168.10.130:23;
        server 192.168.10.131:23;
        hash $remote_addr consistent;
    }
    server {
        listen 172.16.100.10:2323;
        proxy_pass telnetsrvs;
        proxy_timeout 60s;
        proxy_connect_timeout 10s;
    }
}
```

`proxy_timeout` 在四层这里的含义和七层不一样，它是「连接上多久没有数据传输就断开」，双向都算。默认 10 分钟，代理数据库连接池的时候这个值要调大，不然空闲连接被中途掐断，应用侧会收到莫名其妙的连接重置。

四层代理什么时候比 HAProxy 更合适？我的判断是，如果你的机器上本来就跑着 Nginx 做七层，只是顺带要转发一两个 TCP 服务，那用 `stream` 省一个组件很划算，配置语法还是同一套，不用再学一份。真要做重度的四层负载均衡，带完整的健康检查、连接统计、动态权重，HAProxy 的功能还是更全。

**linux对于nginx做的内核优化(/etc/sysctl.conf)**

最后这份 sysctl 参数是配套的，Nginx 配得再好，内核这边卡住了照样上不去。整份抄过去之前有两个必须说清楚的问题。

```bash
fs.file-max = 999999
net.ipv4.ip_forward = 0
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.default.accept_source_route = 0
kernel.sysrq = 0
kernel.core_uses_pid = 1
net.ipv4.tcp_syncookies = 1
kernel.msgmnb = 65536
kernel.msgmax = 65536
kernel.shmmax = 68719476736
kernel.shmall = 4294967296
net.ipv4.tcp_max_tw_buckets = 6000
net.ipv4.tcp_sack = 1
net.ipv4.tcp_window_scaling = 1
net.ipv4.tcp_rmem = 10240 87380 12582912
net.ipv4.tcp_wmem = 10240 87380 12582912
net.core.wmem_default = 8388608
net.core.rmem_default = 8388608
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.core.netdev_max_backlog = 262144
net.core.somaxconn = 40960
net.ipv4.tcp_max_orphans = 3276800
net.ipv4.tcp_max_syn_backlog = 262144
net.ipv4.tcp_timestamps = 0
net.ipv4.tcp_synack_retries = 1
net.ipv4.tcp_syn_retries = 1
net.ipv4.tcp_tw_recycle = 1
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_mem = 94500000 915000000 927000000
net.ipv4.tcp_fin_timeout = 1
net.ipv4.tcp_keepalive_time = 30
net.ipv4.ip_local_port_range = 1024 65000

# 执行sysctl  -p使内核修改生效
```

第一个问题是 `net.ipv4.tcp_tw_recycle = 1` 这一行，今天绝对不要开。它在 NAT 环境下会导致丢包，同一个出口 IP 后面的多个客户端时间戳不一致，内核会把后来的连接当成旧包丢掉，表现是部分用户随机连不上，极难排查。Linux 内核在 4.12 之后已经把这个参数移除了，新系统上写了也没用。真正安全有效的是同一份配置里的 `net.ipv4.tcp_tw_reuse = 1`，保留它就行。

第二个问题是 `net.ipv4.tcp_timestamps = 0`。关掉时间戳会让 `tcp_tw_reuse` 失效，两者是有依赖关系的，这份配置里同时出现是矛盾的。今天的建议是保持 `tcp_timestamps = 1`。

其余参数里真正值得关注的是这几个。`fs.file-max` 是全系统的文件描述符总量，和前面 `worker_rlimit_nofile` 配套；`net.core.somaxconn` 决定 `listen` 的 backlog 上限，Nginx 里配了 `backlog=1024` 而这里是 128 的话，实际生效的是 128；`net.ipv4.ip_local_port_range` 放宽本地端口范围，做反向代理时每个到后端的连接都要占一个本地端口，默认范围在高并发下会不够用。

至于那些 `tcp_rmem`、`tcp_wmem`、`shmmax` 的具体数值，是按当年的内存规格拍的，直接抄到今天的机器上未必合适。我的做法是先只改前面提到的那几个关键项，压测看瓶颈在哪，再针对性地调，而不是一次性把三十行全糊上去。

## 十八、proxy_pass 路径拼接的四种情况

下面这部分是把前面几个高频模块单独拎出来讲透，主要是那些光看指令说明看不明白、必须对着例子才能懂的地方。

> 在`nginx`中配置`proxy_pass`代理转发时，如果在`proxy_pass`后面的`url`加`/`，表示绝对根路径；如果没有`/`，表示相对路径，把匹配的路径部分也给代理走。

- 假设下面四种情况分别用 `http://192.168.1.1/proxy/test.html` 进行访问

```bash
# 第一种：

location /proxy/ {

    proxy_pass http://127.0.0.1/;

}

# 代理到URL：http://127.0.0.1/test.html

# 第二种（相对于第一种，最后少一个 / ）

location /proxy/ {

    proxy_pass http://127.0.0.1;

}

# 代理到URL：http://127.0.0.1/proxy/test.html

# 第三种：

location /proxy/ {

    proxy_pass http://127.0.0.1/aaa/;

}

# 代理到URL：http://127.0.0.1/aaa/test.html

 

# 第四种（相对于第三种，最后少一个 / ）

location /proxy/ {

    proxy_pass http://127.0.0.1/aaa;

}

# 代理到URL：http://127.0.0.1/aaatest.html

# 第五种 配合upstream模块

# 如果一个域名可以解析到多个地址，那么这些地址会被轮流使用，此外，还可以把一个地址指定为 server group

upstream fasf.com {

          server 10.*.*.20:17007 max_fails=2 fail_timeout=15s;

          server 10.*.*.21:17007 max_fails=2 fail_timeout=15s down;

          ip_hash;

    }

server {

        listen       9000;

        server_name  fsf-NGINX-P01;

        location / {

                proxy_pass http://fasf.com;

                proxy_read_timeout 300;

                proxy_connect_timeout 90;

                proxy_send_timeout 300;

               proxy_set_header HTTP_X_FORWARDED_FOR $remote_addr;

        } 
```

> `X-Forwarded-For`字段表示该条`http`请求是由谁发起的。如果反向代理服务器不重写该请求头的话，那么后端真实服务器在处理时会认为所有的请求都来自反向代理服务器，如果后端有防攻击策略的话，那么机器就被封掉了(显示真实访问ip)

这四种情况建议记结论：`proxy_pass` 后面只要有路径部分（包括那个孤零零的斜杠），location 匹配到的那一段就被它替换掉；一点路径都没有，就原样拼上去。

第四种最容易出事，`location /proxy/` 配 `proxy_pass http://127.0.0.1/aaa`，结果拼成了 `/aaatest.html`，两段直接黏在一起。这不是 bug，是严格按替换规则算出来的，`/proxy/` 被换成了 `/aaa`，剩下的 `test.html` 接在后面。真实项目里这种拼错的路径会直接 404，而配置看上去挺正常，所以改完 `proxy_pass` 一定要实际请求验证一遍，别只跑 `nginx -t`。

上面第五个例子还顺带演示了 upstream 的用法，注意那台带 `down` 标记的机器不会接收流量，是故意留着的备用节点。这个例子里的 `proxy_set_header HTTP_X_FORWARDED_FOR` 写法不推荐，标准头名是 `X-Forwarded-For`，用下划线形式后端框架多半读不到，正确写法在前面 12.2 节。

## 十九、rewrite 与正则速查    

```
syntax: rewrite regex replacement [flag]
```

> `rewrite`由`ngx_http_rewrite_module`标准模块支持是实现URL重定向的重要指令，他根据`regex`(正则表达式)来匹配内容跳转到`replacement`，结尾是`flag`标记

**简单的小例子：**

```
rewrite ^/(.*) http://www.baidu.com/ permanent;     
```

> 匹配成功后跳转到百度，执行永久`301`跳转

**常用正则表达式regex：**

- `\` 将后面接着的字符标记为一个特殊字符或者一个原义字符或一个向后引用

- `^` 匹配输入字符串的起始位置

- `$` 匹配输入字符串的结束位置

- `*` 匹配前面的字符零次或者多次

- `+` 匹配前面字符串一次或者多次

- `?` 匹配前面字符串的零次或者一次

- `.` 匹配除 `\n` 之外的所有单个字符

**rewrite 最后一项flag参数**

|标记符号 |说明|
|---|---|
|`last `|本条规则匹配完成后继续向下匹配新的`location URI`规则|
|`break` |本条规则匹配完成后终止，不在匹配任何规则|
|`redirect` |返回`302`临时重定向|
|`permanent` |返回`301`永久重定向|

这张 flag 对照表建议直接背下来，配 rewrite 时多数问题都出在选错 flag 上。表里 `last` 那行写的「继续向下匹配新的 location URI 规则」是准确的，它会拿改写后的 URI 重新走一遍 location 匹配流程。

> 在反向代理域名的使用，在`tomcat`中配置多个项目需要挂目录的使用案例

```bash
server {

    listen 443 ssl;

    server_name FLS-Nginx-P01;

    ssl_certificate   cert/214837463560686.pem;

    ssl_certificate_key  cert/214837463560686.key;
}
```

这段原文写的是 `listen 443;` 配 `ssl on;`，我改成了现在的标准写法 `listen 443 ssl;`。原因前面 SSL 那节说过，`ssl on` 已被移除，而只写 `listen 443;` 不带 `ssl` 参数的话，Nginx 会把 TLS 流量当明文 HTTP 解析，浏览器直接报错。这个组合在老配置里非常常见，迁移时是必查项。

公网域名解析`fls.***.com`

```bash
ssl_session_timeout 5m;

 ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;

 ssl_protocols TLSv1 TLSv1.1 TLSv1.2;

 ssl_prefer_server_ciphers on;

 location  = / {

 rewrite ^(.*)$ https://fls.***.com/fls/;

 }

 location / {

 proxy_redirect http https;

 proxy_set_header Host $host;

 proxy_set_header X-Real-IP $remote_addr;

 proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

 proxy_pass http://10.0.3.4:8080;

 }
 }
```

这段里我改了一处笔误，原文写的是 `X-Forwarded_For`，中间是下划线，标准头名全部用连字符。这类错误 Nginx 不会报，后端框架读不到就当没有，然后你会看到日志里所有请求的来源 IP 都是代理机。

另外那行 `proxy_redirect http https;` 值得单独说，它改写的是后端返回的 `Location` 响应头。后端跑在 HTTP 上、不知道外面套了 HTTPS，返回的重定向地址还是 `http://`，浏览器一跳就掉出安全上下文。更彻底的解法是给后端传 `X-Forwarded-Proto $scheme`，让应用自己生成正确的绝对地址。

至于这里的 `ssl_protocols TLSv1 TLSv1.1 TLSv1.2;`，我保留了原始写法，但今天配置只应该留 TLSv1.2 和 TLSv1.3。同样地，那串 `ssl_ciphers` 也别照抄，去 Mozilla SSL Configuration Generator 按你的版本生成一份当前的。

## 二十、log_format 与日志字段

> `nginx`服务器日志相关指令主要有两条：一条是`log_format`，用来设置日志格式；另外一条是`access_log`，用来指定日志文件的存放路径、格式和缓存大小，可以参加`ngx_http_log_module`。一般在`nginx`的配置文件中日记配置(`/usr/local/nginx/conf/nginx.conf`)

- `log_format`指令用来设置日志的记录格式，它的语法如下：
- `log_format name format {format ...}`
- 其中`name`表示定义的格式名称，`format`表示定义的格式样式。
- `log_format`有一个默认的、无须设置的`combined`日志格式设置，相当于`Apache`的`combined`日志格式，其具体参数如下：

```
log_format combined '$remote_addr-$remote_user [$time_local]'
```

- `'"$request" $status $body_bytes_sent'`
- `'"$http_referer" "$http_user_agent"'`

原文这两行用的是中文弯引号，实际配置里必须是英文单引号，我改过来了。

`combined` 这个默认格式的问题在于它是上世纪 Apache 留下来的遗产，那时候没有反向代理、没有微服务、没有 CDN。今天你需要的 `$request_time`、`$upstream_addr`、`$request_id` 它一个都没有。所以新装一台 Nginx，第一件事就是换掉默认的 log_format，别等出事了才想起来加字段，那时候故障现场已经没了。

特别推荐加一个 `$request_id`，这是 Nginx 自动生成的请求唯一标识，通过 `proxy_set_header X-Request-Id $request_id;` 传给后端，就能把网关日志和应用日志串起来。做链路排查时这个东西的价值远超其它所有字段。

## 二十一、ssl证书加密配置

这一段是把 upstream、SSL 和反向代理拼在一起的完整例子，比前面单条指令更接近真实配置文件的样子。

```bash
upstream fasf.com {

        server 10.5.1.*:17007 max_fails=2 fail_timeout=15s;

        server 10.5.1.*:17007 max_fails=2 fail_timeout=15s down;

        ip_hash;      # ----同一ip会被分配给固定的后端服务器,解决session问题

}

server {

    listen       443 ssl;

    server_name fsfs-pi-P01;

    ssl_certificate   214820781820381.pem;    #证书路径:nginx.conf所在目录

    ssl_certificate_key  214820781820381.key;

    ssl_session_timeout 5m;

    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;

    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;

    ssl_prefer_server_ciphers on;

 location / {

    proxy_pass http://fafs.com;

    proxy_set_header HTTP_X_FORWARDED_FOR $remote_addr;

 } 
}
```

这段配置里 `ip_hash` 后面那句注释「同一ip会被分配给固定的后端服务器,解决session问题」说清了它的用途，前面 15.3 节我也吐槽过这个方案的局限。同样地，`ssl on` 这行我按现在的写法并进了 `listen 443 ssl`。

`proxy_set_header HTTP_X_FORWARDED_FOR $remote_addr;` 这行有两个问题。头名应该是 `X-Forwarded-For`，用下划线的话后端多半读不到，因为 Nginx 默认会丢弃带下划线的请求头，`underscores_in_headers` 这个开关默认是 off。另外用 `$remote_addr` 会把上一跳传来的链路信息覆盖掉，多层代理时应该用 `$proxy_add_x_forwarded_for`。原配置我留着没动，它记录了当时的真实写法，但新配置别这么写。

## 二十二、sendfile

> `sendfile`: 设置为`on`表示启动高效传输文件的模式。`sendfile`可以让`Nginx`在传输文件时直接在磁盘和`tcp` `socket`之间传输数据。如果这个参数不开启，会先在用户空间（Nginx进程空间）申请一个`buffer`，用`read`函数把数据从磁盘读到`cache`，再从`cache`读取到用户空间的`buffer`，再用`write`函数把数据从用户空间的`buffer`写入到内核的`buffer`，最后到`tcp` `socket`。开启这个参数后可以让数据不用经过用户`buffer`

## 二十三、keepalive_timeout

> 当上传一个发数据文件时，`nginx`往往会超时，此时需要调整`keepalive_timeout`参数，保持会话长链接

## 二十四、gzip

> 如果你是个前端开发人员，你肯定知道线上环境要把`js`，`css`，图片等压缩，尽量减少文件的大小，提升响应速度，特别是对移动端，这个非常重要。

- `gzip`使用环境:`http`,`server`,`location`,`if(x)`,一般把它定义在`nginx.conf`的`http{…..}`之间

**gzip on**

- `on`为启用，`off`为关闭

**gzip_min_length 1k**

> 设置允许压缩的页面最小字节数，页面字节数从`header`头中的`Content-Length`中进行获取。默认值是`0`，不管页面多大都压缩。建议设置成大于1k的字节数，小于1k可能会越压越大。

**gzip_buffers 4 16k**

> 获取多少内存用于缓存压缩结果，`4 16k` 表示以 `16k*4` 为单位获得

**gzip_comp_level 5**

> `gzip`压缩比（1~9），越小压缩效果越差，但是越大处理越慢，所以一般取中间值;

这里的 `gzip_comp_level 5` 和前面第八节推荐的 6 是同一个量级，5 和 6 差别很小，选哪个都行，关键是别写 9。

**gzip_types text/plain application/x-javascript text/css application/xml text/javascript application/x-httpd-php**

> 对特定的`MIME`类型生效,其中 `text/html` 被系统强制启用

**gzip_http_version 1.1**

> 识别`http`协议的版本,早期浏览器可能不支持`gzip`自解压,用户会看到乱码

这一条原文有两处笔误，「早起」应为「早期」，「zip 自解压」应为「gzip」，意思都不难猜，但抄进配置注释里容易误导人。这个参数今天保持默认 1.1 就行，HTTP/1.0 的客户端在公网上基本绝迹了。

**gzip_vary on**

- 启用应答头`"Vary: Accept-Encoding"`

**gzip_proxied off**

> `nginx`做为反向代理时启用,`off`(关闭所有代理结果的数据的压缩),`expired`(启用压缩,如果`header`头中包括`"Expires"`头信息),`no-cache`(启用压缩,`header`头中包含`"Cache-Control:no-cache"`),`no-store`(启用压缩,header头中包含`"Cache-Control:no-store")`,`private`(启用压缩,`header`头中包含`"Cache-Control:private"`),`no_last_modefied`(启用压缩,h`eader`头中不包含`"Last-Modified")`,`no_etag`(启用压缩,如果`header`头中不包含"`Etag`"头信息),`auth`(启用压缩,如果`header`头中包含"`Authorization`"头信息)

**gzip_disable msie6**

> (`IE5.5`和`IE6 SP1`使用`msie6`参数来禁止`gzip`压缩 )指定哪些不需要`gzip`压缩的浏览器(将和`User-Agents`进行匹配),依赖于`PCRE`库

> 以上代码可以插入到 `http {...}`整个服务器的配置里，也可以插入到虚拟主机的 `server {...}`或者下面的`location`模块内

`gzip_proxied` 那一长串取值不用全记，配 `any` 覆盖所有情况就够了，除非你明确知道某类代理请求不该压缩。`gzip_disable msie6` 这条今天可以直接删掉，理由前面说过，多跑一次正则而已，没有任何收益。

放置位置这句话很关键，写在 `http` 块是全局生效，写在某个 `location` 里只对那一段生效并且会覆盖外层。我的习惯是在 `http` 层统一开，个别不需要压缩的路径（比如已经预压缩好的静态资源目录）再单独关掉。

## 二十五、客户端上传文件限制

```
client_body_buffer_size 15M;
```

> 请求缓冲区在`NGINX`请求处理中起着重要作用。 在接收到请求时，`NGINX`将其写入这些缓冲区，此指令设置用于请求主体的缓冲区大小。 如果主体超过缓冲区大小，则完整主体或其一部分将写入临时文件。 如果`NGINX`配置为使用文件而不是内存缓冲区，则该指令会被忽略。 默认情况下，该指令为`32`位系统设置一个8k缓冲区，为`64`位系统设置一个`16k`缓冲区

```
client_body_temp_path clientpath 3 2;
```

> 关于`client_body_temp`目录的作用，简单说就是如果客户端`POST`一个比较大的文件，长度超过了`nginx`缓冲区的大小，需要把这个文件的部分或者全部内容暂存到`client_body_temp`目录下的临时文件

- 后面的`level1，2，3`是什么意思？
- 因为如果所有上传的文件都放在一个文件夹下，不仅很容易文件名冲突，并且容易导致一个文件夹特别大。
- 所以有必要创建子目录
- 这里的`level1,2,3`如果有值就代表存在一级，二级，三级子目录。
- 目录名是由数字进行命名的，所以这里的具体的值就是代表目录名的数字位数

```
client_body_temp_path  /spool/nginx/client_temp 3 2;
```

可能创建的文件路径为

```
/spool/nginx/client_temp/702/45/00000123457
```

```
client_max_body_size 30M;
```

> 此指令设置`NGINX`能处理的最大请求主体大小。如果请求大于指定的大小，则`NGINX`发回`HTTP 413（Request Entity too large）`错误。 如果服务器处理大文件上传，则该指令非常重要

`client_max_body_size` 的默认值是 1MB，这个值小得离谱，稍微传张手机拍的照片就超了。上传功能做完在本地测好好的，一上线就报 413，十有八九是这里没改。它可以写在 `http`、`server`、`location` 任意一层，我的习惯是全局给一个保守值，只在上传接口那个 location 单独放大，别全站开成 100M，那等于给自己开了个内存和磁盘的口子。

还有一个容易漏的点，如果 Nginx 后面还有一层代理或者应用服务器（Tomcat 的 `maxPostSize`、Node 的 body-parser limit），每一层都要改。改了 Nginx 还是 413，那就是更里面那层拦的。

## 二十六、worker_processes和worker_connections

**worker_processes**：

- 操作系统启动多少个工作进程运行Nginx。注意是工作进程，不是有多少个nginx工程。在Nginx运行的时候，会启动两种进程，一种是主进程`master process`；一种是工作进程`worker process`。例如我在配置文件中将`worker_processes`设置为`4`，启动`Nginx`后，使用进程查看命令观察名字叫做`nginx`的进程信息，我会看到如下结果：`1`个`nginx`主进程，`master process`；还有四个工作进程，`worker process`。主进程负责监控端口，协调工作进程的工作状态，分配工作任务，工作进程负责进行任务处理。一般这个参数要和操作系统的CPU内核数成倍数。可以设置为`auto`自动识别
**worker_connections**：

- 这个属性是指单个工作进程可以允许同时建立外部连接的数量。无论这个连接是外部主动建立的，还是内部建立的。这里需要注意的是，一个工作进程建立一个连接后，进程将打开一个文件副本。所以这个数量还受操作系统设定的，进程最大可打开的文件数有关。

这段把 master 和 worker 的分工讲得挺清楚，补充一点：`master` 进程以 root 身份启动，作用是绑定 80、443 这类特权端口、读配置、管理 worker 的生死；真正处理请求的 worker 降权到 `nginx` 或 `www-data` 用户跑。这个设计让「需要 root 权限」和「暴露在网络上」这两件事分开了，worker 被攻破也拿不到 root。

`nginx -s reload` 的平滑重启也是靠这套结构：master 收到信号后加载新配置、起一批新 worker，然后给老 worker 发信号让它们处理完手上的请求再退出，全程不断连接。这也是为什么改配置基本不需要 restart，能 reload 就 reload。

`worker_connections` 那句「受操作系统进程最大可打开文件数限制」，和前面第一节的 `worker_rlimit_nofile` 是同一件事的两个说法，两个参数要配套调，只改一个不起作用。

Nginx 的进程模型和配置文件的整体结构，我在 [Nginx 学习篇](https://feinterview.poetries.top/blog/nginx-study) 里从安装开始完整梳理过一遍，想补基础可以看那篇。

## 二十七、stream模块

- `nginx`从`1.9.0`开始，新增加了一个`stream`模块，用来实现四层协议的转发、代理或者负载均衡等。这完全就是抢`HAproxy`份额的节奏，鉴于`nginx`在`7`层负载均衡和`web service`上的成功，和`nginx`良好的框架，`stream`模块前景一片光明
- `stream`模块默认没有编译到`nginx`， 编译`nginx`时候 `./configure --with-stream` 即可
- `stream`模块用法和`http`模块差不多，关键的是语法几乎一致。熟悉`http`模块配置语法的上手更快
以下是一个配置了`tcp`负载均衡和`udp(dns)`负载均衡的例子, 有 `server`，`upstream`块，而且还有`server`，
`hash`， `listen`， `proxy_pass`等指令，如果不看最外层的`stream`关键字，还以为是`http`模块呢,下例是四层反代邮箱协议的例子，直写了`25`端口，其他端口方法相同

```bash
stream {

     upstream smtp {

     least_conn;    # ------把请求转发给连接数较少的后端，能够达到更好的负载均衡效果

     server 10.5.3.17:25 max_fails=2 fail_timeout=10s;

     }

    server {

     listen        25;

     proxy_pass    smtp;

     proxy_timeout 3s;

     proxy_connect_timeout 1s;

   }

}
```

原文这段少了 `stream` 块最外层的收尾大括号，我补上了，直接抄过去是起不来的。

`least_conn` 那行注释说的没错，SMTP 这类连接持续时间长短差异很大的协议，按连接数分发确实比轮询合理。做四层代理时超时值给得比七层短，是因为这里代理的是内网服务，建连本来就该是毫秒级，`proxy_connect_timeout 1s` 已经很宽松了。

回到选型这件事，`stream` 模块的定位一直很清楚：它不是来取代专业四层负载均衡的，它是让你在已经装了 Nginx 的机器上，顺手把几个 TCP 服务也代理掉，不用再引入一个新组件。这个价值对中小规模的部署来说非常实在。

## 总结

把这一圈模块过完，我自己的收获是终于能把「指令」和「模块」对上号了。以前查到一条配置就往文件里贴，报 `unknown directive` 只会去搜报错信息；现在会先敲 `nginx -V` 看看这个二进制到底带了什么，再决定是加配置还是重新编译。这一步的转变，比记住任何单条指令都值。

如果要从这些模块里挑几条最容易踩的坑，我的清单是这四条。

`proxy_pass` 结尾那个斜杠，带和不带走的是完全不同的两条拼接路径，改完必须实际发个请求验证，`nginx -t` 帮不了你。`upstream` 里的 `keepalive` 不是写一行就完事，配套的 `proxy_http_version 1.1` 和 `proxy_set_header Connection ""` 少一行就静默失效。`add_header` 在子 location 里出现一次，父级的所有响应头全部丢失，安全头就是这么消失的。`health_check` 是商业版功能，开源版只有基于失败计数的被动检查，别拿它当主动健康检查用。

时效性上要动的地方也集中在几处。`ssl on` 已经废弃，统一写 `listen 443 ssl`；TLSv1 和 1.1 全部关掉，只留 1.2 和 1.3，套件列表以 Mozilla 的生成器为准而不是抄任何博客；`accept_mutex` 现在默认关闭，惊群问题交给 `reuseport` 解决；`net.ipv4.tcp_tw_recycle` 这一行内核参数在今天必须删掉，NAT 环境下会造成随机丢包，新内核里也已经没有它了；`http2_push` 被 Chrome 移除，不用再考虑服务端推送这条路。

最后说个选型上的判断。这些模块里，`core`、`proxy`、`upstream`、`log`、`gzip`、`ssl` 是任何一个线上站点都会用到的，值得花时间吃透；`fastcgi`、`referer`、`stream` 属于按需了解，遇到具体场景再回来查就行；而 `health_check`、`match` 这类只在商业版生效的，知道它们的存在和替代方案比记参数更重要。

配置这东西，抄一份能跑的很容易，知道每一行为什么在那儿才是难的。

## 参考

- [Nginx 官方文档模块索引](https://nginx.org/en/docs/)
- [ngx_http_core_module 指令说明](https://nginx.org/en/docs/http/ngx_http_core_module.html)
- [ngx_http_proxy_module 指令说明](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [ngx_http_upstream_module 指令说明](https://nginx.org/en/docs/http/ngx_http_upstream_module.html)
- [ngx_stream_core_module 指令说明](https://nginx.org/en/docs/stream/ngx_stream_core_module.html)
- [If Is Evil，Nginx 官方对 if 指令的说明](https://www.nginx.com/resources/wiki/start/topics/depth/ifisevil/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [前端进阶之旅](https://interview.poetries.top)
