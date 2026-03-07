---
title: Nginx中常用的模块整理
date: 2018-11-27 10:40:24
tags: 
   - Nginx
   - 模块
categories: Back-end
---

> Nginx 配置文件在线生成: https://nginxconfig.io/

# 第一部分 基础模块

## 一、性能相关配置

```
worker_processes number | auto；
```

> `worker`进程的数量；通常应该为当前主机的`cpu`的物理核心数。多于`8`个的话建议写`8`，超过`8`个性能不会提升，稳定性降低

```bash
worker_cpu_affinity auto [cpumask] #将work进程绑定在固定cpu上提高缓存命中率 
# 例：
worker_cpu_affinity 0001 0010 0100 1000;
worker_cpu_affinity 0101 1010;
```

```bash
worker_priority number
# 指定worker进程的nice值，设定worker进程优先级： [-20,20]
```

```bash
worker_rlimit_nofile number
worker # 进程所能够打开的文件数量上限,默认较小，生产中需要调大如65535。系统资源通过配置修改/etc/security/limits.conf 例：root soft nofile 65535，或命令修改ulimit -n，修改后需重启服务或系统生效。
```

## 二、时间驱动events相关的配置

- 每个`worker`进程所能够打开的最大并发连接数数量，如`10240`
- 总最大并发数： `worker_processes * worker_connections`

```bash
worker_connections number
```

- 指明并发连接请求的处理方法,默认自动选择最优方法不用调整

```bash
use method
# 如：use epoll;
```


- `on`指由各个`worker`轮流处理新请求
- `Off`指每个新请求的到达都会通知(唤醒)所有的`worker`进程，但只有一个进程可获得连接，造成“惊群”，影响性能，默认`on`

```bash
# 处理新的连接请求的方法
accept_mutex on | off # 互斥；
```




## 三、http核心模块相关配置ngx_http_core_module

### 3.1web服务模板

```bash
server { ... }
# 配置一个虚拟主机
server {
    listen address[:PORT]|PORT;
    server_name SERVER_NAME; # 指令指向不同的主机名
    root /PATH/TO/DOCUMENT_ROOT;
} 
```

### 3.2套接字相关配置

```bash
listen address[:port] [default_server] [ssl] [http2 | spdy] [backlog=number] [rcvbuf=size] [sndbuf=size]
```
- `default_server` 设定为默认虚拟主机
- `ssl` 限制仅能够通过`ssl`连接提供服务
- `backlog=number` 超过并发连接数后，新请求进入后援队列的长度
- `rcvbuf=size` 接收缓冲区大小
- `sndbuf=size` 发送缓冲区大小

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

### 3.4 延迟发送选项


```
tcp_nodelay on | off;
tcp_nopush  on | off;
```

- 在`keep alived`模式下的连接是否启用`TCP_NODELAY`选项。
- `tcp_nopush`必须在`sendfile`为`on`时才有效，当为`off`时，延迟发送，合并多个请求后再发送
- 默认`On`时，不延迟发送
- 可用于： `http`, `server`, `location`

### 3.5 sendfile

```bash
sendfile on | off;
```

> 是否启用`sendfile`功能，在内核中封装报文直接发送。如用来进行下载等应用磁盘IO重负载应用可设置为`off`，以平衡磁盘与网络IO处理速度降低系统负载，如图片显示不正常把这个改为`off`。默认`Off`

### 3.6 隐藏版本信息

> 是否在响应报文的`Server`首部显示`nginx`版本

```bash
server_tokens on | off | build | string
```

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
- `=`, `^~`, `～/～*`, 不带符号

**路径别名alias path**

示例：

```bash
# http://www.magedu.com/bbs/index.php

location /bbs/ {
    alias /web/forum/;
} # --> /web/forum/index.html
location /bbs/ {
    root /web/forum/;
}     # --> /web/forum/bbs/index.html    
```

**注意**：

> `location`中使用`root`指令和`alias`指令的意义不同    

- `root`，相当于追加在`root`目录后面  
- `alias`，相当于对`location`中的`url`进行替换

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


## 四、访问控制模块ngx_http_access_module

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
    allow 10.1.1.0/16;
    allow 2001:0db8::/32;
    deny all;
}
```

## 五、用户认证模块ngx_http_auth_basic_module

> 实现基于用户的访问控制，使用`basic`机制进行用户认证

```bash
auth_basic string | off;
auth_basic_user_file file;
location /admin/ {
    auth_basic "Admin Area";
    auth_basic_user_file /etc/nginx/.ngxpasswd;
}
```

**用户口令：**

- 明文文本：格式`name:password:comment`
- 加密文本：由`htpasswd`命令实现 `httpd-tools`所提供
- `htpasswd` [`-c`第一次创建时使用] [`-D`删除用户] `passwdfile`   `username`

六、状态查看模块ngx_http_stub_status_module

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

## 七、日志记录模块ngx_http_log_module

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
json格式日志示例;log_format json '{"@timestamp":"$time_iso8601",'
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

## 八、压缩相关选项ngx_http_gzip_module

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
如果启用压缩，是否在响应报文首部插入`“Vary: AcceptEncoding`
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

## 九、https模块ngx_http_ssl_module模块：

- `ssl on | off`; 为指定虚拟机启用`HTTPS protocol`， 建议用`listen`指令代替
- `ssl_certificate file`; 当前虚拟主机使用PEM格式的证书文件
- `ssl_certificate_key fil`; 当前虚拟主机上与其证书匹配的私钥文件
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

## 十、重定向模块ngx_http_rewrite_module

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
rewrite ^/zz/(.*\.html)$  https://www.dianping/zhengzhou/$1 permanent;
```

2. **return**

> 停止处理，并返回给客户端指定的响应码

```bash
return code [text];
return code URL;
return URL;
```

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

## 十一、引用模块ngx_http_referer_module

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
break；
}
access_log off;
}
```

## 十二、反向代理模块ngx_http_proxy_module

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


### 12.2 proxy_set_header field value

> 设定发往后端主机的请求报文的请求首部的值

```
Context: http, server, location
```

- 后端记录日志记录真实请求服务器`IP`

```bash
proxy_set_header	Host	$host；
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

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

### 12.4 调用缓存

```bash
proxy_cache zone | off; #默认off
```

> 指明调用的缓存，或关闭缓存机制； `Context: http`,`server`, `location`

### 12.5 proxy_cache_key string

> 缓存中用于“键”的内容

- 默认值： `proxy_cache_key $scheme$proxy_host$request_uri;`

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

### 12.7 proxy_cache_use_stale

> 在被代理的后端服务器出现哪种情况下，可以直接使用过期的缓存响应客户端

```bash
proxy_cache_use_stale error | timeout |
invalid_header | updating | http_500 | http_502 |
http_503 | http_504 | http_403 | http_404 | off ..
```

### 12.8 proxy_cache_methods GET | HEAD | POST

> 对哪些客户端请求方法对应的响应进行缓存， `GET`和`HEAD`方法总是被缓存

### 12.9 proxy_hide_header field;

> 用于隐藏后端服务器特定的响应首部

### 12.10  proxy_connect_timeout time;

> 定义与后端服务器建立连接的超时时长，如超时会出现`502`错误，默认为`60s`，一般不建议超出`75s`

```
proxy_connect_timeout time;
```

### 12.11 proxy_send_timeout time

> 把请求发送给后端服务器的超时时长；默认为`60s`

### 12.12 proxy_read_timeout time; 

> 等待后端服务器发送响应报文的超时时长， 默认为60s

## 十三、首部信息

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

## 十四、 hph 相关模块ngx_http_fastcgi_module

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


## 十五、代理模块ngx_http_upstream_module模块

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
  - `backup` 将服务器标记为“备用”，即所有服务器均不可用时才启用
  - `down` 标记为“不可用”，配合`ip_hash`使用，实现灰度发布
  
### 15.3 ip_hash 源地址hash调度方法

### 15.4 least_conn

> 最少连接调度算法，当`server`拥有不同的权重时其为`wlc`，当所有后端主机连接数相同时，则使用`wrr`，适用于长连接

### 15.5 hash key [consistent] 

> 基于指定的`key`的`hash`表来实现对请求的调度，此处的`key`可以直接文本、变量或二者组合

- 作用：将请求分类，同一类请求将发往同一个`upstream`

> `server`，使用`consistent`参数， 将使用`ketama`一致性`hash`算法，适用于后端是`Cache`服务器（如`varnish`）时使用

```bash
hash $request_uri consistent;
hash $remote_addr;
```

### 15.6 keepalive

- `keepalive` 连接`数N`;
- 为每个`worker`进程保留的空闲的长连接数量,可节约`nginx`端口，并减少连接管理的消耗

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

### 十六、ngx_stream_core_module模块

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

**linux对于nginx做的内核优化(/etc/sysctl.conf)**

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

# 第二部分 功能详解


## 一、proxy_pass

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

        listen       9000;

        server_name  fsf-NGINX-P01;

        location / {

                proxy_pass http://fasf.com;

                proxy_read_timeout 300;

                proxy_connect_timeout 90;

                proxy_send_timeout 300;

               proxy_set_header HTTP_X_FORWARDED_FOR $remote_addr;

        } 
```

> `X_Forward_For`字段表示该条`http`请求是有谁发起的？如果反向代理服务器不重写该请求头的话，那么后端真实服务器在处理时会认为所有的请求都来在反向代理服务器，如果后端有防攻击策略的话，那么机器就被封掉了(显示真实访问ip)

## 二、rewrite    

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

- `.` 匹配除“`\n`”之外的所有单个字符

**rewrite 最后一项flag参数**

|标记符号 |说明|
|---|---|
|`last `|本条规则匹配完成后继续向下匹配新的`location URI`规则|
|`break` |本条规则匹配完成后终止，不在匹配任何规则|
|`redirect` |返回`302`临时重定向|
|`permanent` |返回`301`永久重定向|

> 在反向代理域名的使用，在`tomcat`中配置多个项目需要挂目录的使用案例

```bash
server {

    listen 443;

    server_name FLS-Nginx-P01;

    ssl on;

    ssl_certificate   cert/214837463560686.pem;

    ssl_certificate_key  cert/214837463560686.key;
}
```

公网域名解析`fls.***.com`

```bash
ssl_session_timeout 5m;

 ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;

 ssl_protocols TLSv1 TLSv1.1 TLSv1.2;

 ssl_prefer_server_ciphers on;

 location  = / {

 rewrite ^(.*)$ https://fls.***.com/fls/;

 }

 location / {

 proxy_redirect http https;

 proxy_set_header Host $host;

 proxy_set_header X-Real-IP $remote_addr;

 proxy_set_header X-Forwarded_For $proxy_add_x_forwarded_for;

 proxy_pass http://10.0.3.4:8080;

 }
 }
```

## 三、log_format

> `nginx`服务器日志相关指令主要有两条：一条是`log_format`，用来设置日志格式；另外一条是`access_log`，用来指定日志文件的存放路径、格式和缓存大小，可以参加`ngx_http_log_module`。一般在`nginx`的配置文件中日记配置(`/usr/local/nginx/conf/nginx.conf`)

- `log_format`指令用来设置日志的记录格式，它的语法如下：
- `log_format name format {format ...}`
- 其中`name`表示定义的格式名称，`format`表示定义的格式样式。
- `log_format`有一个默认的、无须设置的`combined`日志格式设置，相当于`Apache`的`combined`日志格式，其具体参数如下：

```
log_format combined '$remote_addr-$remote_user [$time_local]'
```

- `‘"$request"$status $body_bytes_sent’`
- ` ‘"$http_referer" "$http_user_agent"’`

## 四、ssl证书加密配置

```bash
upstream fasf.com {

        server 10.5.1.*:17007 max_fails=2 fail_timeout=15s;

        server 10.5.1.*:17007 max_fails=2 fail_timeout=15s down;

        ip_hash;      # ----同一ip会被分配给固定的后端服务器,解决session问题

}

server {

    listen       443;

    server_name fsfs-pi-P01;

    ssl on;

    ssl_certificate   214820781820381.pem;    #证书路径:nginx.conf所在目录

    ssl_certificate_key  214820781820381.key;

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

## 五、sendfile

> `sendfile`: 设置为`on`表示启动高效传输文件的模式。`sendfile`可以让`Nginx`在传输文件时直接在磁盘和`tcp` `socket`之间传输数据。如果这个参数不开启，会先在用户空间（Nginx进程空间）申请一个`buffer`，用`read`函数把数据从磁盘读到`cache`，再从`cache`读取到用户空间的`buffer`，再用`write`函数把数据从用户空间的`buffer`写入到内核的`buffer`，最后到`tcp` `socket`。开启这个参数后可以让数据不用经过用户`buffer`

## 六、keepalive_timeout

> 当上传一个发数据文件时，`nginx`往往会超时，此时需要调整`keepalive_timeout`参数，保持会话长链接

## 七、gzip

> 如果你是个前端开发人员，你肯定知道线上环境要把`js`，`css`，图片等压缩，尽量减少文件的大小，提升响应速度，特别是对移动端，这个非常重要。

- `gzip`使用环境:`http`,`server`,`location`,`if(x)`,一般把它定义在`nginx.conf`的`http{…..}`之间

**gzip on**

- `on`为启用，`off`为关闭

**gzip_min_length 1k**

> 设置允许压缩的页面最小字节数，页面字节数从`header`头中的`Content-Length`中进行获取。默认值是`0`，不管页面多大都压缩。建议设置成大于1k的字节数，小于1k可能会越压越大。

**gzip_buffers 4 16k**

> 获取多少内存用于缓存压缩结果，`‘4 16k’`表示以`16k*4`为单位获得

**gzip_comp_level 5**

> `gzip`压缩比（1~9），越小压缩效果越差，但是越大处理越慢，所以一般取中间值;

**gzip_types text/plain application/x-javascript text/css application/xml text/javascript application/x-httpd-php**

> 对特定的`MIME`类型生效,其中`'text/html’`被系统强制启用

**gzip_http_version 1.1**

> 识别`http`协议的版本,早起浏览器可能不支持`zip`自解压,用户会看到乱码

**gzip_vary on**

- 启用应答头`"Vary: Accept-Encoding"`

**gzip_proxied off**

> `nginx`做为反向代理时启用,`off`(关闭所有代理结果的数据的压缩),`expired`(启用压缩,如果`header`头中包括`"Expires"`头信息),`no-cache`(启用压缩,`header`头中包含`"Cache-Control:no-cache"`),`no-store`(启用压缩,header头中包含`"Cache-Control:no-store")`,`private`(启用压缩,`header`头中包含`"Cache-Control:private"`),`no_last_modefied`(启用压缩,h`eader`头中不包含`"Last-Modified")`,`no_etag`(启用压缩,如果`header`头中不包含"`Etag`"头信息),`auth`(启用压缩,如果`header`头中包含"`Authorization`"头信息)

**gzip_disable msie6**

> (`IE5.5`和`IE6 SP1`使用`msie6`参数来禁止`gzip`压缩 )指定哪些不需要`gzip`压缩的浏览器(将和`User-Agents`进行匹配),依赖于`PCRE`库

> 以上代码可以插入到 `http {...}`整个服务器的配置里，也可以插入到虚拟主机的 `server {...}`或者下面的`location`模块内

## 八、客户端上传文件限制

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

## 九、worker_processes和worker_connections

**worker_processes**：

- 操作系统启动多少个工作进程运行Nginx。注意是工作进程，不是有多少个nginx工程。在Nginx运行的时候，会启动两种进程，一种是主进程`master process`；一种是工作进程`worker process`。例如我在配置文件中将`worker_processes`设置为`4`，启动`Nginx`后，使用进程查看命令观察名字叫做`nginx`的进程信息，我会看到如下结果：`1`个`nginx`主进程，`master process`；还有四个工作进程，`worker process`。主进程负责监控端口，协调工作进程的工作状态，分配工作任务，工作进程负责进行任务处理。一般这个参数要和操作系统的CPU内核数成倍数。可以设置为`auto`自动识别
**worker_connections**：

- 这个属性是指单个工作进程可以允许同时建立外部连接的数量。无论这个连接是外部主动建立的，还是内部建立的。这里需要注意的是，一个工作进程建立一个连接后，进程将打开一个文件副本。所以这个数量还受操作系统设定的，进程最大可打开的文件数有关。

## 十、stream模块

- `nginx`从`1.9.0`开始，新增加了一个`stream`模块，用来实现四层协议的转发、代理或者负载均衡等。这完全就是抢`HAproxy`份额的节奏，鉴于`nginx`在`7`层负载均衡和`web service`上的成功，和`nginx`良好的框架，`stream`模块前景一片光明
- `stream`模块默认没有编译到`nginx`， 编译`nginx`时候 `./configure –with-stream `即可
- `stream`模块用法和`http`模块差不多，关键的是语法几乎一致。熟悉`http`模块配置语法的上手更快
以下是一个配置了`tcp`负载均衡和`udp(dns)`负载均衡的例子, 有 `server`，`upstream`块，而且还有`server`，
`hash`， `listen`， `proxy_pass`等指令，如果不看最外层的`stream`关键字，还以为是`http`模块呢,下例是四层反代邮箱协议的例子，直写了`25`端口，其他端口方法相同

```bash
stream {

     upstream smtp {

     least_conn;    # ------把请求转发给连接数较少的后端，能够达到更好的负载均衡效果

     server 10.5.3.17:25 max_fails=2 fail_timeout=10s;

     }

    server {

     listen        25;

     proxy_pass    smtp;

     proxy_timeout 3s;

     proxy_connect_timeout 1s;

   }
```
