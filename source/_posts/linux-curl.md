---
title: 学会用Curl调试接口，从常用参数到耗时排查
description: 用 curl 调试 HTTP 接口的实战笔记，讲清 -H、-d、-X、-L、--resolve、-w 的用法，以及 HTTPS 证书报错怎么定位、如何用 -w 打印各阶段耗时排查慢请求。
date: 2019-12-12 11:32:41
tags: 
  - Linux
  - Curl
  - 接口调试
categories: Back-end
---

接口联调卡住的时候，最难受的是分不清问题出在前端还是后端。浏览器里点一下，Network 面板一堆请求混在一起，想改个请求头还得回代码里改完重新构建。这种时候一条 curl 命令就够了，参数写在一行里，想改哪个字段改哪个字段，结果直接打在终端上。

这篇把我平时调接口用得最多的那几个 curl 参数梳理一遍。从 `-H`、`-d`、`-X` 这些基础的，到用 `--resolve` 绕开 DNS 直连某台机器，再到用 `-w` 打印各阶段耗时定位慢请求。HTTPS 证书报错的时候，curl 也是把问题缩小到具体哪一层的最快工具。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 什么场景下 curl 比 Postman 更顺手
- 常用参数速查，长短两种写法的对应关系
- 设置请求头、传参数、带 cookie、基本认证的写法
- POST 请求在 http 和 https 两种协议下的差别
- HTTPS 证书报错怎么用 curl 一层层定位
- 用 `--resolve` 跳过 DNS，直接打某台后端机器
- 用 `-w` 打印 DNS、握手、首字节各阶段耗时，排查慢请求
- 几个容易写错的地方，比如 `-d` 会隐式改方法、单双引号在 shell 里的坑

## 一、什么时候我会敲 curl 而不是开 Postman

平时打交道的接口大致分两类。

一类是自己写的、服务于自己系统的接口。这类接口本地就能跑，参数结构自己最清楚，用 Postman 这种 GUI 工具存一套 collection，改改字段点一下发送，效率是高的。

另一类是别人提供的能力接口，你的系统去调它。这类接口往往鉴权复杂，签名、时间戳、自定义 header 一堆，而且经常只能在特定的机器上才能访问到，比如只有内网某台跳板机能通。这时候 GUI 工具就用不上了，你只有一个 ssh 终端，curl 是唯一的选择。

我自己的习惯是，只要涉及「在服务器上验证」「问题不确定出在哪一层」这两种情况，一律用 curl。原因是它的输出可以被完整贴给后端同事，对方复制过去就能复现，不需要你截图描述半天。

还有一点很实际，curl 命令是纯文本，能直接写进部署脚本和健康检查里。你调通的那条命令，稍微改改就是线上的探活脚本。

## 二、常用参数速查

curl 的参数几乎都有长短两种写法，功能完全一样。

- `-X/--request [GET|POST|PUT|DELETE|…]` 使用指定的 HTTP method 发出请求
- `-H/--header` 设定 request 里的 header
- `-i/--include` 在输出里带上 response 的 header
- `-d/--data` 设定 HTTP 请求体参数
- `-v/--verbose` 输出比较多的过程信息
- `-u/--user` 使用者账号密码
- `-b/--cookie` 使用 cookie，可以给字符串也可以给文件路径

所以 `curl -X POST http://www.example.com` 和 `curl --request POST http://www.example.com/` 是完全相同的两条命令，写哪个看你自己习惯。我在终端里手敲用短参数，写进脚本里用长参数，因为长参数半年后回来看还认得出是干什么的。

这里要纠正一个我早年一直搞错的点：`-v` 不是「显示版本信息」，它是 verbose 的缩写，作用是把整个请求过程打出来，包括 DNS 解析、TCP 连接、TLS 握手、发出去的完整请求头、收到的完整响应头。显示版本用的是 `-V`（大写）或者 `--version`。这两个我混过好几次。

`-v` 的输出里，行首符号是有约定的。`*` 开头是 curl 自己的过程说明，`>` 开头是发出去的内容，`<` 开头是收到的内容。看懂这三个符号，排查问题的效率能翻一倍。

## 三、发请求的几种常见写法

### 3.1 设置 header

```
curl -i -H "Content-Type: application/json" http://www.baidu.com
```

`-H` 可以重复写多次，每个 header 一个 `-H`。加了 `-i` 之后响应头会跟着 body 一起打出来，调试的时候基本是默认要加的，不然你看不到状态码，也看不到 `Set-Cookie` 和缓存相关的头。

如果只想看响应头不想要 body，用 `-I`（大写 i），它发的是 HEAD 请求。检查一个静态资源的缓存策略、CDN 有没有命中，用 `-I` 最快。

### 3.2 设置请求参数

```
curl -X POST -d "param1=value1&param2=value2" http://www.example.com/
```

或者拆开写，效果一样，curl 会自动用 `&` 把它们拼起来。

```
curl -X POST -d "param1=value1" -d "param2=value2" http://www.example.com/
```

这里有个坑要注意，键值之间是等号不是冒号。表单编码的格式就是 `key=value`，写成 `param1:value1` 的话，整串会被当成一个没有等号的字段名发出去，后端解析不到，你会看到一个「参数为空」的报错，然后在参数值上找半天。

还有一点，只要写了 `-d`，curl 就会自动把方法切成 POST，并且默认带上 `Content-Type: application/x-www-form-urlencoded`。所以上面那条命令里的 `-X POST` 其实可以省掉。但我一般还是会写上，因为显式写出来别人一眼就知道这是个 POST。

参数值里如果有中文、空格或者 `&` 这类特殊字符，用 `--data-urlencode` 代替 `-d`，它会帮你做 URL 编码。GET 请求想把参数拼到 query string 上，加个 `-G`，curl 就会把 `-d` 的内容挪到 URL 后面而不是放进 body。

### 3.3 session 认证

```
curl -X GET 'http://www.baidu.com/' --header 'sessionid:sessionid值'
```

不少内部系统的鉴权就是这么做的，一个自定义 header 带上会话标识。要注意的是自定义 header 的名字大小写不敏感，但值是敏感的，从浏览器里复制的时候别把前后空格带进来。

### 3.4 使用 cookie

```
curl -i --header "Content-Type:application/json" -X GET -b ~/cookie.txt http://www.baidu.com
```

`-b` 既可以直接给字符串（`-b "name=value; name2=value2"`），也可以给一个 cookie 文件的路径。配套的还有 `-c`，作用是把服务端下发的 cookie 存到文件里。这两个搭配起来就能模拟一次完整的登录流程：先用 `-c cookie.txt` 请求登录接口把会话存下来，后面每次请求都用 `-b cookie.txt` 带上。

测试文件上传接口的时候用 `-F "file=@__FILE_PATH__"` 这种写法，注意路径前面那个 `@` 不能少，少了的话 curl 会把这串路径当成普通字符串发出去，而不是读文件内容。想看到详细的请求信息就再加个 `-v`。

```
curl -i -X POST -F 'file=@/User/uploadFile.txt' -H "token:abc123" -v http://www.example.com/upload
```

### 3.5 HTTP 基本认证

```
curl -i -u username:password http://www.baidu.com/api/foo
```

`-u` 会把账号密码做 base64 编码放进 `Authorization: Basic` 头里。这里提醒一句，基本认证的编码不是加密，抓包能直接还原出明文密码，所以走 HTTP 明文协议的基本认证等于没有保护。真要用，前面必须是 HTTPS。

另外密码写在命令行里会进 shell 的 history 文件，机器上别人能翻到。省事的做法是只写 `-u username`，curl 会交互式地问你要密码，不落盘。

## 四、POST 请求在两种协议下的调法

平时遇到的接口大多是 POST，所以单独把这块拿出来说。

### 4.1 http 协议

```
curl -v -X POST http://localhost:3000/api/posts --data '{"title":"controller", "content": "what is controller"}' -H 'Content-Type:application/json; charset=UTF-8'
```

拆开看这几个参数在干什么。

`-v` 打印完整交互过程。`-H`（等同 `--header`）指定请求头，很多服务端会靠请求头做权限校验，比如约定必须带某个 token 头，带了才放行，不带就直接拒绝。`--data`（等同 `-d`）是请求体。`-X` 显式指定请求方法。

这里有个必须注意的配合关系：发 JSON 的时候，`Content-Type` 一定要写成 `application/json`。前面说过 `-d` 默认发的是 `application/x-www-form-urlencoded`，服务端拿到这个 Content-Type 就会按表单去解析，你的 JSON 字符串会被整个当成一个字段名，然后报参数缺失。这个错我见过太多次了，报错信息还特别有迷惑性。

上面这条命令实际发出去的 HTTP 请求，内容大概是这样。

```
POST /api/posts HTTP/1.1
Host: localhost:3000
Content-Type: application/json; charset=UTF-8

{"title": "controller", "content": "what is controller"}
```

理解了这个映射关系，curl 就不再是一堆需要背的参数了，它就是让你手写一个 HTTP 报文而已。哪个参数对应报文的哪一部分，心里有数之后写命令就很快。

### 4.2 https 协议与双向认证

对接一些金融、政务类的接口时，服务端会要求客户端也提供证书，也就是双向 TLS。这时候要多传几个参数。

```
curl -v -k -X POST https://localhost:3000/api/posts \
  --cert '/app/milo/tomcat/milogenius/webapps/client.crt' \
  --key '/app/milo/tomcat/milogenius/webapps/client.key' \
  --pass 'milogenius'
```

- `-k` 允许连接没有有效证书的 SSL 站点，跳过证书校验
- `--cert` 客户端证书文件
- `--key` 私钥文件
- `--pass` 私钥密码

原文这几个参数写成了单横线的 `-cert`、`-key`、`-pass`，实际上它们都是长参数，必须写两个横线。还有一处原文把 URL 写成了 `http://`，既然是配 SSL 证书，协议头得是 `https://` 才有意义，我一并改过来了。

`-k` 这个参数要谨慎。它确实能让「证书验证失败」这个报错立刻消失，但它同时也把 TLS 的身份校验整个关掉了，中间人可以随便冒充服务端。开发环境用自签证书时可以图方便加上，联调完记得去掉，绝不能带进生产脚本里。

## 五、HTTPS 证书报错怎么一层层定位

`-k` 是绕过问题，不是解决问题。真遇到证书报错，curl 是把问题缩小到具体哪一层最好用的工具。

先不加 `-k` 直接打一次，看 curl 给的是什么错。常见的几种表现不一样，对应的原因也完全不同。

如果提示证书是自签的或者签发方不受信任，那多半是服务端用了内部 CA，你的机器上没装这个根证书。正确做法不是 `-k`，是用 `--cacert` 把那个根证书指给 curl。

```
curl --cacert /path/to/internal-ca.crt https://api.internal.example.com/health
```

如果提示的是主机名不匹配，说明证书上的域名和你访问的域名对不上。常见于用 IP 直接访问一个绑了域名的 HTTPS 服务，或者证书里只签了 `example.com` 却拿去给 `api.example.com` 用（没有配泛域名）。

如果提示证书过期，那看一眼本机时间。容器里时间不同步导致「证书还没生效」或者「已过期」的情况我踩过，服务端证书其实好好的，是客户端的钟走偏了。

想直接看服务端到底给了张什么证书，`-v` 的输出里就有，包括签发者、有效期、主题备用名（SAN）。这几行信息基本能定位掉八成的证书问题。

补一句时效性的说明：这篇写于 2019 年，这些年 TLS 生态变化不小，curl 对 TLS 1.3、HTTP/2 乃至 HTTP/3 的支持，以及不同发行版自带的 curl 链接的是 OpenSSL 还是别的库，行为都可能有出入。`curl -V` 能看到你这台机器上的 curl 链接了哪个 TLS 库、支持哪些协议，具体行为差异以官方文档为准。

## 六、用 --resolve 跳过 DNS 直连某台机器

这个参数知道的人不多，但排查线上问题时特别好用。

场景是这样：服务挂在负载均衡后面，有四台后端机器，用户反馈说「有时候能打开有时候报错」。这种间歇性问题，多半是其中某一台机器出了问题，但你直接请求域名的话，DNS 和负载均衡会随机把你分到某一台，抓不住那台坏的。

`--resolve` 让你手动指定某个域名在某个端口上解析到哪个 IP。

```
curl -v --resolve api.example.com:443:10.0.0.11 https://api.example.com/health
```

这条命令的 Host 头和 TLS SNI 用的还是 `api.example.com`，所以服务端那边的域名匹配、证书校验全都正常，但 TCP 连接实际打到了 `10.0.0.11` 这台机器上。四台机器挨个打一遍，坏的那台立刻就现原形了。

同样的思路还能用来验证 DNS 切换。新域名的解析还没生效，你想提前确认新机器上的服务是不是配对了，`--resolve` 指过去打一发就知道，不用改本机 hosts。

跟它类似的还有 `--connect-to`，语法不太一样但目的接近。以及 `-x` 指定代理，调试走网关的请求时用得上。

顺着上面这块聊，如果这台机器上跑的是 Nginx，那配合 Nginx 的日志一起看会更快，我之前整理过一篇 [Nginx 极简教程](https://feinterview.poetries.top/blog/review-nginx)，反向代理和 upstream 那部分能和这里的排查思路对上。

## 七、用 -w 看各阶段耗时，排查慢请求

「这个接口好慢」是最难接的一类反馈，因为慢可以慢在很多地方：DNS 解析慢、TCP 建连慢、TLS 握手慢、服务端处理慢、下行传输慢。这五种原因的解决方向完全不同，先分清是哪一种，才谈得上优化。

`-w`（`--write-out`）能在请求结束后按你给的格式打印一批内部变量，其中就包括各阶段的时间戳。

先准备一个格式文件，省得每次在命令行里写一长串。

```
# curl-format.txt
    time_namelookup:  %{time_namelookup}s
       time_connect:  %{time_connect}s
    time_appconnect:  %{time_appconnect}s
   time_pretransfer:  %{time_pretransfer}s
      time_redirect:  %{time_redirect}s
 time_starttransfer:  %{time_starttransfer}s
                     ----------
         time_total:  %{time_total}s
          http_code:  %{http_code}
      size_download:  %{size_download} bytes
```

然后这样调用。

```
curl -w "@curl-format.txt" -o /dev/null -s https://api.example.com/posts
```

`-o /dev/null` 把响应体丢掉不打屏，`-s` 关掉进度条，这样输出里就只剩下你要的时间数据，干净。

关键在于怎么读这几个数。这些时间点都是从命令发起算起的累计值，不是每一段单独的耗时，所以要靠相减来看。

| 变量 | 含义 | 相减看什么 |
| :--- | :--- | :--- |
| `time_namelookup` | DNS 解析完成的时刻 | 它本身就是 DNS 耗时 |
| `time_connect` | TCP 三次握手完成的时刻 | 减 `time_namelookup` 是建连耗时 |
| `time_appconnect` | TLS 握手完成的时刻 | 减 `time_connect` 是 TLS 握手耗时，HTTP 请求下这项是 0 |
| `time_pretransfer` | 准备好开始传输的时刻 | 一般紧跟 appconnect，差值很小 |
| `time_starttransfer` | 收到第一个字节的时刻 | 减 `time_pretransfer` 就是服务端处理耗时 |
| `time_total` | 整个请求结束的时刻 | 减 `time_starttransfer` 是响应体下载耗时 |

判断规则其实很直白。

`time_namelookup` 大，问题在 DNS，换个解析服务或者上本地缓存。`time_connect` 减去它的差值大，问题在网络链路或者服务端连接队列满了。`time_appconnect` 那一段大，看看是不是证书链太长、或者用的是握手成本高的加密套件。`time_starttransfer` 减 `time_pretransfer` 大，那就是服务端自己慢，跟网络没关系，去查慢 SQL 和下游调用。最后一段大，那是响应体太大或者带宽不够，考虑压缩（curl 这边加 `--compressed` 试试）和分页。

这套方法我自己在排查一个「首页偶尔要三四秒」的问题时用过一次，跑一圈下来发现大头在 `time_starttransfer`，网络那边完全是清白的，省掉了一整轮和运维互相甩锅的时间。

`-w` 还支持不少别的变量，`%{url_effective}` 看最终 URL、`%{num_connects}` 看建了几次连接、`%{num_redirects}` 看跳了几次，具体有哪些以官方文档为准，版本之间会有增减。

## 八、几个容易写错的地方

### 8.1 重定向不会自动跟

curl 默认不跟随 302/301。你打一个会重定向的地址，看到的是一个空 body 加一个 3xx 状态码，很容易误判成「接口挂了」。加 `-L`（`--location`）才会跟过去。

```
curl -L -i https://example.com/old-path
```

配合 `-v` 用，能看到完整的跳转链路，每一跳的 Location 头都会打出来。排查登录跳转、CDN 回源这类问题必备。要注意的是 `-L` 在跟随重定向时，默认不会把 `Authorization` 头带到不同的主机上，这是安全设计，遇到「加了 `-L` 反而 401」的情况可以往这个方向想。

### 8.2 引号在 shell 里的坑

JSON 请求体里全是双引号，外面就必须用单引号包住。

```
curl -d '{"name":"zhangsan"}' -H 'Content-Type: application/json' http://www.example.com/
```

反过来用双引号包 JSON 的话，里面的双引号得一个个转义，写起来很痛苦而且容易漏。另外单引号里的 `$` 不会被 shell 展开，双引号里会，请求体里恰好带 `$` 的时候这个区别会咬人。

### 8.3 从文件读请求体

数据量大或者是一个现成的 JSON 文件时，用 `@` 前缀让 curl 去读文件。

```
curl -X POST -H 'content-type: application/json' -d @/apps/jsonfile.json http://www.example.com/
```

原文这里漏了 `@`，写成 `-d /apps/jsonfile.json`，那样 curl 会把这串路径本身当成请求体发出去。这个错误的表现是服务端报 JSON 解析失败，但你打开文件看又觉得内容没问题，很容易卡住。

发 XML 也是一样的路子，改一下 Content-Type 就行。

```
curl -X POST -H 'content-type:application/xml' -d '<?xml version="1.0" encoding="UTF-8"?><name>zhangsan</name>' http://www.example.com/
```

### 8.4 超时和重试

写进监控脚本的 curl 命令，超时一定要加，不然接口卡死时你的脚本会跟着一起挂住。

```
curl --connect-timeout 3 --max-time 10 --retry 2 https://api.example.com/health
```

`--connect-timeout` 只管建连阶段，`--max-time`（`-m`）管整个请求的总时长。两个都设上，行为才是可预期的。

关于 Linux 上这类命令行工具的更多用法，我另外整理过一篇 [Linux 常用命令总结](https://feinterview.poetries.top/blog/linux-summary)，日志排查那部分和这篇是配套的。

## 总结

curl 值得记住的东西其实不多，把 HTTP 报文和参数的对应关系搞清楚，剩下的都是查文档就能解决的。

`-H` 对应请求头，`-d` 对应请求体并且会隐式把方法改成 POST，`-X` 显式指定方法，`-i` 让你看到响应头。这四个覆盖了日常八成的场景。

再往上一层，`-v` 是你的眼睛，DNS、握手、请求头、响应头全在里面，遇事先加 `-v` 看一眼比猜快得多。`-k` 只是让证书报错闭嘴，真要定位问题得用 `--cacert` 指定根证书，或者从 `-v` 输出里读证书的签发者和有效期。

最后两个是拉开差距的：`--resolve` 让你绕过 DNS 精准打到某一台后端机器，负载均衡后面某台机器出问题时就靠它揪出来；`-w` 把一次请求拆成 DNS、建连、TLS、服务端处理、下载五段耗时，慢请求的锅到底在谁身上，一条命令就分清了。

这两个参数我是工作两三年后才用起来的，用上之后回头看，前面那些靠猜和加日志的排查方式确实浪费了不少时间。

## 参考

- [curl 官方手册](https://curl.se/docs/manpage.html)
- [curl --write-out 变量说明](https://curl.se/docs/manpage.html#-w)
- [MDN HTTP 请求方法](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Methods)
- [MDN HTTP 头字段索引](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers)
- [前端进阶之旅](https://interview.poetries.top)
