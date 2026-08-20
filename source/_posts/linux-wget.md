---
title: 常用命令之wget使用记录，断点续传与整站镜像
description: wget 下载命令的实战笔记，讲清 -c 断点续传的前提条件、-O 与 -P 的区别、递归抓站的四个参数配合、限速配额，以及 wget 和 curl 该怎么分工。
date: 2018-12-04 11:00:45
tags: 
  - Linux
  - wget
  - 下载
categories: Back-end
---

在服务器上装东西的时候，十有八九第一条命令就是 `wget`。下一个 tar 包、拉一份安装脚本、把某个域名下的静态资源整个扒下来，都靠它。但真用起来会发现几个别扭的地方：明明加了 `-c` 却还是从头下；`-O` 和 `-P` 长得像却完全不是一回事；抓整站的时候一不留神把半个互联网都爬下来了。

这些坑背后都有具体的原因，不是 `wget` 在为难你。这篇把 `wget` 的常用参数按使用场景理一遍，重点讲清楚参数背后在做什么，以及它和 `curl` 各自适合的活。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `wget` 和 `curl` 的分工，什么时候该用哪个
- 下载单个文件，`-O` 和 `-P` 到底差在哪
- 批量下载 `-i`、后台下载 `-b` 和日志文件去了哪
- 断点续传 `-c` 的前提条件，为什么有时候它不生效
- 限速 `--limit-rate` 和配额 `-Q`，别把带宽吃满
- 递归下载和整站镜像，`--mirror`、`-p`、`--convert-links`、`--no-parent` 怎么配合
- 证书报错、被反爬拦截、FTP 下载这几种情况怎么处理
- 写进脚本时必须加的超时和重试

## 一、先说结论，wget 和 curl 怎么分工

这两个命令功能有重叠，但设计目标完全不同。

`wget` 是个下载器。它默认把内容存成文件，天然支持递归、断点续传、后台运行、失败重试。你要的是「把东西弄到本地」，`wget` 一条命令就够。

`curl` 是个数据传输工具，更准确说是个 HTTP 客户端瑞士军刀。它默认把响应打到标准输出，强项是构造请求（自定义方法、请求头、请求体、认证），以及看清楚一次请求的每个环节。你要的是「调这个接口」或者「搞清楚这个请求哪一步慢」，那是 `curl` 的活。我之前写过一篇 [学会用Curl调试接口，从常用参数到耗时排查](https://feinterview.poetries.top/blog/linux-curl)，接口调试那一侧的细节都在那边。

一句话记：下载用 `wget`，调试用 `curl`。

还有个实际差别，`curl` 几乎所有系统都自带（macOS、各种 Linux 发行版、Windows 10 之后），`wget` 在 macOS 和一些精简的容器镜像里需要自己装。写通用脚本的时候这点得考虑进去。

## 二、下载单个文件，以及 -O 和 -P 的区别

最基础的用法，什么参数都不带。

```bash
wget http://www.baidu.com
```

这条命令会在当前目录下生成一个 `index.html`。文件名是 `wget` 根据 URL 推出来的，URL 末尾没有具体文件名时它就用 `index.html` 兜底。

想指定存到哪、叫什么名字，用 `-O`（大写字母 O，不是数字 0）。

```bash
wget -O /home/index http://www.baidu.com
```

这里的 `-O` 是 output document，它给的是**完整的输出路径加文件名**，不是目录。写成 `-O /home/` 会直接报错。

想只指定目录、文件名保持服务器给的那个，用的是 `-P`。

```bash
wget -P /home/downloads/ http://example.com/pkg/app-1.2.3.tar.gz
```

这两个参数搞混是很常见的事。我的记法是，`-O` 里的 O 是 output file，`-P` 里的 P 是 prefix（目录前缀）。

`-O -` 这个写法值得单独提一句，把文件内容输出到标准输出，可以直接接管道。安装脚本经常这么写。

```bash
wget -qO- https://example.com/install.sh | bash
```

`-q` 是安静模式，不打印进度条，不然进度信息会污染管道。顺带说一句，这种「下载即执行」的写法方便归方便，但你等于把机器交给了那个 URL，公司内网的脚本还好，来路不明的地址建议先下下来看一眼再跑。

## 三、批量下载、后台下载和日志

URL 多的时候，一条条敲太累。把它们写进一个文本文件，一行一个，然后用 `-i`。

```bash
wget -i file.txt
```

`file.txt` 里每行一个 URL，`wget` 会按顺序挨个下。原文这段写成了「会下载两个两个文件」，是个笔误，意思是文件里写几个 URL 就下几个。

下载大文件时终端不能一直占着，用 `-b` 转后台。

```bash
wget -b http://example.com/big.tar.gz
```

执行之后终端立刻返回，下载在后台继续。这时候进度信息去哪了？`wget` 会在当前目录生成一个 `wget-log` 文件，所有输出都写在里面。原文写的是 `web-log`，实际的默认文件名是 `wget-log`（同名文件已存在时会依次生成 `wget-log.1`、`wget-log.2`）。想看进度的话 `tail -f wget-log` 就行。

自己指定日志文件名用 `-o`（小写 o）。

```bash
wget -o dw.txt http://www.baidu.com
```

注意 `-o` 是覆盖写，同一个日志文件跑第二次前一次的记录就没了。想追加用 `-a`。

到这里已经有三个长得很像的参数了，`-O` 输出文件、`-o` 日志文件、`-P` 目录前缀。大小写在 `wget` 里是硬语义，这点跟 `scp` 的 `-P`/`-p` 是一个性质。

## 四、断点续传，以及它为什么有时候不生效

`-c` 是 `wget` 最实用的参数，尤其在网络不稳的机器上。

```bash
wget -c http://example.com/big.tar.gz
```

它的原理是这样：`wget` 看到本地已经有个同名文件且大小是 N 字节，就在请求里带上 `Range: bytes=N-` 这个头，请求服务端只发 N 之后的部分。服务端支持的话返回 206 Partial Content，接着写；不支持的话返回完整的 200，那就只能从头下。

所以 `-c` 能不能生效，取决于服务端支不支持 Range 请求。这不是你能控制的。判断方法也简单，用 `curl -I` 看一眼响应头里有没有 `Accept-Ranges: bytes`。

这里有个坑要注意，`-c` 和 `-O` 一起用容易出问题。`-c` 靠的是「本地文件大小」推断续传起点，而 `-O` 改了文件名之后，续传逻辑在某些情况下会判断失误，甚至把已有内容截断。要断点续传就别自作聪明改名，让 `wget` 用服务器给的文件名，下完了再 `mv`。

配合重试参数一起用效果更好。

```bash
wget -c --tries=5 --waitretry=10 -T 30 http://example.com/big.tar.gz
```

`--tries=5` 最多重试 5 次（原文写的是 `--tries=3`，含义一样），`--waitretry=10` 每次重试前的等待秒数，`-T 30` 是超时时间。三个配上之后，网络抖一下不会直接失败退出。

`--tries=0` 或者 `--tries=inf` 是无限重试。写在无人值守的脚本里要谨慎，服务端要是永久性 404，你的脚本就会一直转下去。

## 五、限速和配额，别把带宽吃满

在共用的机器或者办公网上下大文件，不限速是不礼貌的行为，严重的时候会把整条链路打满。

```bash
wget --limit-rate=100k -O zfj.html http://www.baidu.com
```

`--limit-rate` 的单位可以是 `k` 或者 `m`。要说明的是，它限制的是平均速度而不是瞬时速度，`wget` 的做法是下一小段就停一会儿，所以刚开始那几秒可能会冲得比较高，之后才稳定下来。

多文件下载时还可以设总配额。

```bash
wget -Q5m -i file.txt
```

下满 5MB 就停。这个参数只在下载多个文件时有效，单个文件下到一半不会被它掐断，`wget` 的策略是不做残缺文件。这一点原文有提到，是对的。

还有个 `--wait=秒数`，控制每个文件之间的间隔。抓一批资源的时候加上，对目标站客气一点，也降低被限流的概率。`--random-wait` 会在这个值上下随机浮动。

## 六、递归下载和整站镜像

这块是 `wget` 相对 `curl` 最大的优势，`curl` 完全没有递归能力。

先说最常见的诉求，把一个页面连同它依赖的 CSS、JS、图片一起存下来，离线也能打开。

```bash
wget --mirror -p --convert-links -P ./test http://localhost
```

拆开看这四个参数各自在干什么。

- `--mirror` 打开镜像模式，它是一组参数的简写，相当于开启递归、不限递归深度、保留时间戳、保留目录列表
- `-p` 下载显示这个页面所必需的全部文件，也就是图片、样式表、脚本这些
- `--convert-links` 下载完成后把 HTML 里的链接改写成本地相对路径，这样双击打开也能正常跳转
- `-P ./test` 所有内容存到 `./test` 目录下

不加 `--convert-links` 的话，你本地打开那个 HTML，里面的链接还是指向原站，断网就是一片白板。这个参数是「离线可用」的关键。

**这里必须提醒一句，`--mirror` 是不限深度的，用它之前一定要想清楚边界在哪。**

站点有外链的话，理论上它会顺着爬到别人家去。控制范围主要靠这两个参数：`--no-parent`（简写 `-np`）禁止往上级目录爬，`--domains` 限定只在指定域名内递归。抓某个文档目录的时候，我一般是这么写的。

```bash
wget -r -np -p --convert-links --domains example.com -P ./docs https://example.com/guide/
```

按类型筛选用 `-A`（accept）和 `-R`（reject）。

```bash
wget -r -A .png http://www.baidu.com
wget --reject=png --mirror -p --convert-links -P ./test http://localhost
```

第一条只要 PNG，第二条是把 PNG 排除在外。注意这两个参数过滤的是最终要保存的文件，`wget` 还是得先把 HTML 页面下下来解析链接，所以它并不能减少请求数，只能减少落盘的文件。

递归下载还有个 `-l` 参数控制深度，`-l 2` 就是只往下两层。不确定站点结构的时候，先用小的深度试一次，看看抓下来多少东西再放大，比直接 `--mirror` 稳妥得多。

## 七、访问不通的几种情况

### 7.1 证书报错

老服务器上 `wget` 链接的 CA 证书包过期，或者对方用了自签证书，会直接报证书验证失败。

```bash
wget --no-check-certificate https://example.com/pkg.tar.gz
```

原文这条命令末尾多了个全角的 `·`，是个手误，我一并去掉了。

这个参数的代价要说清楚，加上它等于把 TLS 的身份校验整个关掉，中间人可以随便替换你下载的内容。装软件包的场景下这尤其危险，你以为下的是官方包，实际可能是被掉包过的。临时应急可以，长期方案应该是更新系统的 CA 证书包，或者用 `--ca-certificate` 把对方的根证书指给 `wget`。

### 7.2 被当成爬虫拦下来

不少站点会看 User-Agent，`wget` 的默认 UA 里明晃晃写着自己是 wget，容易被 403。

```bash
wget --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" https://example.com/file.zip
```

有些站还会校验 Referer，那就再加 `--referer=`。需要登录态的资源用 `--load-cookies cookies.txt` 带 cookie。

要说明的是，这些参数是用来处理「正常访问但被误判」的情况的。对方明确不希望被抓的内容，绕过去是另一回事了，自己掂量。

### 7.3 先探一下通不通

```bash
wget --spider http://www.baidu.com
```

`--spider` 只发请求不下载内容，用来确认链接是不是有效。批量检查一批 URL 有没有失效的时候挺好用，配合 `-i` 一起。

不过做服务健康检查的话我更倾向用 `curl -f -s -o /dev/null -w '%{http_code}'`，状态码拿得更直接，也更容易接后续判断。

### 7.4 FTP 下载

```bash
wget --ftp-user=USERNAME --ftp-password=PASSWORD ftp://example.com/path/file.zip
```

原文这里写的是 `--file-user` 和 `--file-password`，这两个参数并不存在，正确的是 `--ftp-user` 和 `--ftp-password`，我改过来了。

密码写在命令行里会进 shell history，也会出现在 `ps` 的输出里被同机器的其他用户看到。更稳妥的做法是写进 `~/.wgetrc` 或者 `~/.netrc`，并且把文件权限设成 600。

## 八、写进脚本时该加什么

手敲和写脚本是两种要求。手敲错了重来一次就行，脚本里一个没设超时的 `wget` 可能让整条 CI 流水线挂住几个小时。

我自己脚本里的固定写法大概是这样。

```bash
wget -q \
  --tries=3 \
  --waitretry=5 \
  --timeout=30 \
  --no-verbose \
  -O /tmp/app.tar.gz \
  https://example.com/releases/app-1.2.3.tar.gz
```

`--timeout` 一定要给，它同时覆盖 DNS 解析、连接和读取三个阶段（也可以用 `--dns-timeout`、`--connect-timeout`、`--read-timeout` 分别设）。`--tries` 限定重试上限，避免无限重试。`-O` 指定固定路径，这样后续步骤不用去猜文件名。

另外记得判断退出码。`wget` 下载失败时退出码非 0，脚本里配合 `set -e` 或者显式判断，不然你会拿到一个空文件继续往下跑，错误在更后面的步骤才暴露出来，排查起来绕远路。关于脚本的健壮性写法，[shell入门](https://feinterview.poetries.top/blog/shell) 那篇里讲得更细一些。

校验也别省。下载后跑一次 `sha256sum -c` 对一下官方给的校验值，这一步能挡掉传输损坏和被掉包两类问题，成本只有一行。

## 总结

`wget` 的参数看着多，按场景归拢之后其实没几个需要背。

下载落盘这块，`-O` 是完整输出路径，`-P` 是目录前缀，`-o` 是日志文件，大小写别搞混。`-i` 批量读 URL 列表，`-b` 转后台并把日志写进 `wget-log`。

断点续传 `-c` 是最值钱的一个，但它依赖服务端支持 Range 请求，用 `curl -I` 看 `Accept-Ranges` 就能提前判断，另外别和 `-O` 混用。配合 `--tries` 和 `--waitretry`，弱网环境下能省掉大量手工重来。

递归是 `wget` 独有的能力，`--mirror -p --convert-links` 三件套做离线镜像，但一定要用 `-np` 和 `--domains` 把范围框住，不然它真的会一直爬下去。

最后是分工。要文件用 `wget`，要看请求细节、调接口、量各阶段耗时用 `curl`。写进脚本的每一条 `wget` 都补上超时、重试上限和退出码判断，这三样是脚本能不能无人值守的分界线。

## 参考

- [GNU Wget 官方手册](https://www.gnu.org/software/wget/manual/wget.html)
- [MDN HTTP Range 请求](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Range_requests)
- [linux wget 命令用法详解(附实例说明)](https://blog.csdn.net/freeking101/article/details/53691481/)
- [前端进阶之旅](https://interview.poetries.top)
