---
title: nginx之location的匹配规则与优先级排查
description: 讲透 Nginx location 的五种匹配符和真实优先级顺序，精确匹配、^~ 前缀、正则、通用匹配谁先谁后，配合一组可对照的示例说明常见的匹配误判和排查方法。
date: 2018-02-28 13:01:42
tags:
  - Nginx
  - location
  - 运维
categories: Back-end
---

> Nginx 配置文件在线生成: https://nginxconfig.io/

配置文件里写了七八个 `location`，改完 reload，页面还是走到了不该走的那个块。这种情况我遇到过好几次，第一反应总是「是不是我写的正则不对」，把正则改来改去，结果发现问题根本不在正则上，而在于 Nginx 压根没走到那一条。

`location` 的匹配不是从上往下第一个命中就用，它有一套固定的优先级。搞不清这套优先级，你写多少条规则都是碰运气。这篇只讲 `location` 这一件事，把五种匹配符、真实的优先级顺序、以及那几个最容易误判的场景说清楚，配置片段和实战场景我放在了另外几篇里，这篇专心啃匹配规则本身。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `location` 的五种匹配符分别是什么，各自匹配的是路径还是正则
- 优先级的真实顺序，以及为什么它不是「从上往下」
- 一组六条规则的完整对照表，每个 URL 落到哪一条
- 静态资源被通用规则吃掉、正则抢走前缀匹配这两类典型误判
- 实际项目里至少要有的三条 `location`
- `root` 和 `alias` 在 `location` 里的区别，以及查问题的顺序

## 一、语法规则和五种匹配符

`location` 的完整语法就一行。

```
location [=|~|~*|^~] /uri/ { … }
```

方括号里那个符号是整件事的关键，它决定了这条规则参与哪一轮比赛。五个符号的含义先摆出来。

|符号|	含义|
|---|---|
|`=`|	开头表示精确匹配，请求路径必须和后面的字符串完全一致|
|`^~`|	开头表示 uri 以某个常规字符串开头，理解为匹配 `url` 路径即可。注意 `nginx` 在匹配前会先对 `URI` 做规范化（把 `%XX` 解码、消解相对路径），所以你写的前缀比对的是解码之后的路径|
|`~`|	开头表示区分大小写的正则匹配|
|`~*`|	开头表示不区分大小写的正则匹配|
|`/`|	通用匹配，任何请求都会匹配到|

这里先说个原文里流传很广但不准确的说法。很多版本的这张表会写成「nginx 不对 url 做编码，因此请求为 `/static/20%/aa` 可以被 `^~ /static/ /aa` 匹配到」，这句话是错的，`location` 后面也不能跟两段路径。Nginx 官方文档写得很明确，匹配是在规范化之后的 URI 上做的，`%XX` 会先被解码，`.` 和 `..` 这类相对路径成分会先被消解。所以真实的行为是反过来的，请求里带 `%2F` 之类的编码，最终参与匹配的是解码后的那个字符。

这个我踩过一次。前端把查询参数拼进了路径里，带了编码字符，我按编码后的原样写前缀，怎么都匹配不上，改成解码后的写法才通。

五个符号里，`=` 和 `^~` 和不带符号的前缀写法比的是「路径开头」，`~` 和 `~*` 比的是正则。这两类是分开跑的，理解了这一点，下面的优先级就顺了。

## 二、优先级到底是怎么排的

多个 `location` 同时能匹配上的时候，顺序是这样的。

- 首先匹配 `=`
- 其次匹配 `^~`
- 其次是按文件中顺序的正则匹配
- 最后是交给 / 通用匹配
- 当有匹配成功时候，停止匹配，按当前匹配规则处理请求

这五行是结论，但它省掉了中间一步，导致很多人记不牢。我把 Nginx 实际的执行过程拆开讲一遍。

Nginx 拿到一个请求，第一步先在所有前缀型的 `location`（也就是 `=`、`^~` 和不带符号的那些）里找。找的方式是「最长前缀优先」，不是配置文件里的先后顺序。你把 `location /` 写在最上面，`location /static/` 写在最下面，请求 `/static/a.js` 照样命中 `/static/`，因为它前缀更长。

配置文件的顺序对前缀匹配完全不起作用。

第二步，如果这一轮里命中的是 `=` 精确匹配，直接结束，正则一条都不看。如果命中的最长前缀带了 `^~`，也直接结束，同样不看正则。这就是 `^~` 存在的全部意义，它是一个「到此为止，别去比正则了」的开关。

第三步，如果最长前缀不带 `^~`，Nginx 会把这个结果先记在手里，然后从上往下逐条试正则。正则这一轮才是按配置文件顺序来的，第一个匹配上的就用它，后面的不再看。

第四步，如果所有正则都没匹配上，才回过头用第二步记下来的那个前缀结果。

所以「按文件中顺序」这句话只对正则成立，对前缀不成立。这是我认为最值得记住的一条，因为绝大多数「明明写了却不生效」的问题都卡在这里。

## 三、一组规则跑一遍

光讲流程容易忘，看一组具体的。下面这六条规则放在同一个 `server` 里。

```nginx
location = / {
   #规则A
}
location = /login {
   #规则B
}
location ^~ /static/ {
   #规则C
}
location ~ \.(gif|jpg|png|js|css)$ {
   #规则D
}
location ~* \.png$ {
   #规则E
}
location / {
   #规则F
}
```

那么产生的效果如下。

- 访问根目录 `/`， 比如 `http://localhost/` 将匹配规则 `A`
- 访问 `http://localhost/login` 将匹配规则 `B`，`http://localhost/register` 则匹配规则 `F`
- 访问 `http://localhost/static/a.html` 将匹配规则 `C`
- 访问 `http://localhost/a.gif`, `http://localhost/b.jpg` 将匹配规则 `D `和规则 `E`，但是规则 `D` 顺序优先，规则 `E `不起作用，而 `http://localhost/static/c.png `则优先匹配到规则 `C`
- 访问 `http://localhost/a.PNG` 则匹配规则 `E`，而不会匹配规则 `D`，因为规则 `E` 不区分大小写

访问 `http://localhost/category/id/1111` 则最终匹配到规则 `F`，因为以上规则都不匹配，这个时候应该是 `nginx` 转发请求给后端应用服务器，比如 `FastCGI（PHP`），`tomcat（jsp）`，`nginx` 作为反向代理服务器存在。

顺着上面聊几条最容易被绕进去的。

`/` 命中 A 而不是 F，是因为 `=` 精确匹配优先级最高，而 `/` 这个请求路径恰好和 `= /` 完全相等。注意 `= /` 只对根路径生效，`/index.html` 是命中不了它的。这也是官方推荐给首页单独写一条 `= /` 的原因，首页访问量大，精确匹配一步到位，省掉后面所有的比对。

`/static/c.png` 命中 C 而不是 E，是 `^~` 在起作用。如果把 C 的 `^~` 去掉写成 `location /static/`，那么 `/static/c.png` 就会被规则 D 抢走，因为前缀匹配虽然命中了但没有阻断，正则轮次照跑。这一条差别在真实项目里的表现是「静态目录的配置好像没生效，图片走到了另一套缓存策略上」，排查了一下午才发现少了两个字符。

`/a.gif` 同时符合 D 和 E 的形式，但 E 只匹配 `.png`，实际上只有 `.png` 结尾的才会两条都符合。真正两条都符合的是 `b.png` 这种，此时 D 写在前面，D 赢。而 `a.PNG` 大写，D 是区分大小写的正则匹配不上，落到 E。

`/category/id/1111` 什么都不沾，只能落到 F。前端 SPA 的路由几乎全长这样，所以 F 那一块通常要配 `try_files`，不然刷新就是 404。这个具体怎么配，我在 [Nginx try_files 用法](https://feinterview.poetries.top/blog/nginx-try-files) 里单独写过一篇。

## 四、实际项目里的三条必备规则

实际使用中，至少有三个匹配规则定义，如下。

```nginx
# 直接匹配网站根，通过域名访问网站首页比较频繁，使用这个会加速处理，官网如是说。
# 这里是直接转发给后端应用服务器了，也可以是一个静态首页
# 第一个必选规则
location = / {
    proxy_pass http://tomcat:8080/index
}

# 第二个必选规则是处理静态文件请求，这是 nginx 作为 http 服务器的强项
# 有两种配置模式，目录匹配或后缀匹配，任选其一或搭配使用
location ^~ /static/ {
    root /webroot/static/;
}
location ~* \.(gif|jpg|jpeg|png|css|js|ico)$ {
    root /webroot/res/;
}

# 第三个规则就是通用规则，用来转发动态请求到后端应用服务器
# 非静态文件请求就默认是动态请求，自己根据实际把握
# 毕竟目前的一些框架的流行，带.php、.jsp后缀的情况很少了
location / {
    proxy_pass http://tomcat:8080/
}
```

这三条各自在解决一个具体问题。

第一条是首页提速。首页是全站访问最集中的一个路径，用 `=` 让它一步命中，Nginx 不用再去跑后面的前缀比较和正则轮次。收益不大但零成本。

第二条是把静态资源从应用服务器手里抢过来。静态文件让 Nginx 直接读磁盘返回，比转发给 Tomcat 再由 Tomcat 读文件快一个量级，而且不占应用服务器的线程。这里给了两种写法，目录匹配用 `^~` 保证不被后面的正则截胡，后缀匹配用 `~*` 兼容大小写。两种混用的时候要留神，`/static/a.png` 会被 `^~ /static/` 拿走，走不到后缀那条。

第三条是兜底。所有动态请求最后都落到这里转发给后端。

有个细节容易被忽略，上面第一条和第三条的 `proxy_pass` 一个是 `.../index` 没有结尾斜杠，一个是 `http://tomcat:8080/` 带斜杠，这两种写法转发出去的路径完全不同。带斜杠会把 `location` 匹配到的前缀剥掉，不带斜杠会把原始路径整段拼上去。这个坑我在 [Nginx 反向代理与负载均衡常用配置](https://feinterview.poetries.top/blog/review-nginx) 里详细拆过。

## 五、几个容易误判的地方

先说结论，绝大多数 `location` 问题是这四类之一。

**第一类是漏了 `^~`。** 你写了 `location /static/`，同时又有一条 `location ~ \.js$`，结果 `/static/app.js` 走到了正则那条。表现是静态目录里某几类文件的表现和其它文件不一样。加上 `^~` 就好了。

**第二类是正则的先后顺序写反了。** 正则这一轮是严格按配置文件顺序的，范围窄的必须写在范围宽的前面。把 `~ \.(js|css)$` 写在 `~ \.(gif|jpg|png|js|css)$` 后面，前者永远不会被命中。这种情况 `nginx -t` 是不会报错的，语法完全合法，它只是永远匹配不到。

**第三类是 `root` 和 `alias` 搞混了。** 这两个在 `location` 里的行为不一样，`root` 是把 `location` 匹配的路径拼在后面，`alias` 是把 `location` 匹配的那段替换掉。

```nginx
location /img/ {
    alias /var/www/image/;
}
# 请求 /img/a.png 实际找的是 /var/www/image/a.png

location /img/ {
    root /var/www/image;
}
# 请求 /img/a.png 实际找的是 /var/www/image/img/a.png
```

`alias` 有个额外规则，如果 `location` 是以 `/` 结尾的，`alias` 也必须以 `/` 结尾，少写一个斜杠会拼出 `/var/www/imagea.png` 这种路径，然后你就得到一个 404 而日志里的路径看着还挺正常。

**第四类是把 `if` 塞进 `location` 里做分支。** Nginx 的 `if` 在 `location` 上下文里行为很反直觉，官方 wiki 里那篇标题就叫 `If Is Evil`。能用 `location` 表达的分支就别用 `if`，实在要判断，优先用 `try_files` 或者 `map`。

排查顺序我一般是这样。先 `nginx -t` 确认配置真的加载了，再把可疑的几条 `location` 里各加一句 `add_header X-Debug-Loc "C" always;`，然后打开浏览器看响应头里到底是哪个字母。这个办法比盯着配置文件猜快得多，两分钟就能定位。

关于 `location` 之外的配置结构、上下文层级和常用指令，可以看 [Nginx 安装与配置结构详解](https://feinterview.poetries.top/blog/nginx-study)；各类实战配置片段在 [工作中常用的 Nginx 配置](https://feinterview.poetries.top/blog/nginx-config)；模块能力清单和选型在 [Nginx 常用模块整理](https://feinterview.poetries.top/blog/nginx-module-summary)。

## 总结

`location` 这套规则真正需要记住的其实只有三句话。

前缀匹配比的是长度不是顺序，正则匹配比的是顺序不是长度。`=` 和 `^~` 都是「命中即停」的开关，区别只在于 `=` 要求完全相等而 `^~` 只要求开头相同。所有正则都不命中的时候，才会回落到之前记下的最长前缀。

写配置的时候有个习惯值得养成，静态目录一律加 `^~`，正则一律从窄到宽排，首页单独一条 `=`，最后一条 `location /` 兜底。按这个顺序码下来，基本不会出现匹配错乱。

至于 `root` 和 `alias`、`proxy_pass` 结尾斜杠这两个坑，它们不属于 `location` 匹配本身，但排查的时候经常被误判成匹配问题，值得一起记住。

## 参考

- [Nginx ngx_http_core_module location 指令文档](https://nginx.org/en/docs/http/ngx_http_core_module.html#location)
- [Nginx ngx_http_core_module alias 指令文档](https://nginx.org/en/docs/http/ngx_http_core_module.html#alias)
- [Nginx 官方 If Is Evil 说明](https://www.nginx.com/resources/wiki/start/topics/depth/ifisevil/)
- [Nginx 配置文件在线生成](https://nginxconfig.io/)
- [前端进阶之旅](https://interview.poetries.top)
