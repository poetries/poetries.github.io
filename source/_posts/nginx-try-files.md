---
title: 浅析Nginx之try_files指令与SPA路由回退
description: 讲清 Nginx try_files 的匹配顺序、$uri 与 $uri/ 的区别、最后一个参数的特殊规则，以及 SPA history 路由为什么必须靠它兜底，附与 rewrite 的取舍对比。
date: 2021-02-08 09:58:20
tags:
  - Nginx
  - 部署
  - SPA
categories: Back-end
---

Vue 或者 React 项目开了 history 模式，本地 `dev server` 跑得好好的，一部署到 Nginx 上就出问题。首页能开，点导航跳转也正常，但在 `/user/detail` 这个地址上按一下刷新，直接 404。

这个问题几乎每个前端都会撞一次，标准答案是在 Nginx 里加一行 `try_files $uri $uri/ /index.html;`。抄过去确实能用，但如果不搞清楚这一行到底做了什么，下次遇到带查询参数丢失、静态资源被兜底成 HTML、或者需要转发到后端接口的场景，还是只能继续搜。

这篇把 `try_files` 拆开讲。匹配顺序是怎样的、`$uri` 和 `$uri/` 差在哪、最后一个参数为什么和前面的不一样、`=404` 和命名 `location` 该选哪个、以及什么时候该退回去用 `rewrite`。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `try_files` 的语法、默认值和作用域
- 参数从左到右的匹配顺序，以及「第一个命中即停」的规则
- `$uri` 检查文件、`$uri/` 检查目录，两者触发的后续行为并不一样
- 最后一个参数的特殊地位，以及漏写会导致 500 的原因
- `=404` 与命名 `location` 两种回退写法的差异
- 为什么 `$args` 不会自动保留，需要手写 `?$query_string`
- SPA history 路由必须用它兜底的底层原因
- `try_files` 和 `rewrite` 的取舍标准

## 一、try_files 的基本形态

Nginx 的配置语法灵活，可控制度非常高。在 0.7 以后的版本中加入了一个 `try_files` 指令，配合命名 `location`，可以部分替代原本常用的 `rewrite` 配置方式，提高解析效率。

- 语法：`try_files file ... uri` 或 `try_files file ... = code`
- 默认值：无
- 作用域：`server` `location`

![try_files 指令的基本配置示例](https://blog.poetries.top/img/static/images/image-20210208093424322.png)

配合上面这段配置来看它的行为：

- 当用户在浏览器输入 `blog.zsc.com` 或者 `blog.zsc.com/index.html` 或者 `blog.zsc.com/index.php` 时，根据 `try_files` 规则，可以找到该域名对应的 web 页面
- 当用户在浏览器输入 `blog.zsc.com/fjdklfjaldkfjlads/zjklfjdslfjds` 这类不存在的路径时，`$uri` 和 `$uri/` 都不符合，所以 Nginx 就自动把请求转成 `blog.zsc.com/index.php`，然后把 `index.php` 的页面内容反馈给客户端

一句话概括，`try_files` 的作用是按顺序检查文件是否存在，返回第一个找到的文件或文件夹（结尾加斜线表示为文件夹），如果所有的文件或文件夹都找不到，会进行一次内部重定向到最后一个参数。

这个「按顺序」和「内部」是两个关键词，下面两节分别展开。

## 二、匹配顺序：从左到右，第一个命中即停

`try_files` 的参数列表是严格从左往右扫的，命中一个就立刻停止，后面的参数看都不会看。

```nginx
location / {
    root /data/www;
    try_files $uri $uri/ /index.html;
}
```

请求 `/about/team.html` 进来的时候，Nginx 的动作依次是：

- 拼出 `/data/www/about/team.html`，去磁盘上 `stat` 一下，存在就直接把这个文件吐出去，结束
- 不存在的话，拼出 `/data/www/about/team.html/` 检查是不是目录，是目录就走目录的处理逻辑
- 还是不行，就内部重定向到 `/index.html`

需要留意的是，每一个非最后参数的检查都是一次真实的文件系统调用。参数列得越多，磁盘 IO 越多。所以不要图省事写一长串候选路径，一般两三个就够了。如果站点静态文件多且不常变，可以配上 `open_file_cache` 把这些 stat 结果缓存起来。

```nginx
open_file_cache max=10000 inactive=60s;
open_file_cache_valid 80s;
open_file_cache_min_uses 1;
open_file_cache_errors on;
```

`open_file_cache_errors on` 这一项容易被忽略，它会把「文件不存在」这个结果也缓存下来。对 SPA 这种绝大多数请求最后都要回退到 `index.html` 的场景，收益很明显。

## 三、$uri 和 $uri/ 到底差在哪

这两个写法看起来只差一个斜杠，触发的行为完全不同。

`$uri` 检查的是「有没有这个文件」。命中之后 Nginx 直接把这个文件当作响应内容发出去，不再有任何后续跳转。

`$uri/` 检查的是「有没有这个目录」。命中之后 Nginx 并不会把目录内容发出去，而是把内部 URI 指向这个目录，接着交给 `index` 指令去找默认文件（通常是 `index.html`），找不到再看 `autoindex` 是否开启。

举个具体例子。目录结构是 `/data/www/docs/index.html`，请求 `/docs` 进来：

- `$uri` 对应 `/data/www/docs`，这是个目录不是文件，不算命中
- `$uri/` 对应 `/data/www/docs/`，命中，于是走 `index index.html;`，最终吐出 `/data/www/docs/index.html`

如果你的配置里只写了 `try_files $uri /index.html;`，漏掉了 `$uri/`，那么访问 `/docs` 就会直接掉到最后一个参数上，返回 SPA 的首页而不是那个目录下的文档。这类问题在混合部署（一部分静态文档 + 一部分 SPA）的站点上特别容易出现。

`$uri/` 这一项在纯 SPA 场景其实可有可无，但加上它几乎没有副作用，所以约定俗成都会写上。

## 四、最后一个参数的特殊地位

只有最后一个参数可以引起一个内部重定向，之前的参数只设置内部 URI 的指向。

最后一个参数是回退 URI 且必须存在，否则会出现内部 500 错误。命名的 `location` 也可以使用在最后一个参数中。与 `rewrite` 指令不同，如果回退 URI 不是命名的 `location`，那么 `$args` 不会自动保留，如果你想保留 `$args`，则必须明确声明。

![try_files 最后一个参数触发内部重定向的示意](https://blog.poetries.top/img/static/images/image-20210208093626879.png)

### 4.1 三种回退写法

**写法一，回退到一个 URI。**

```nginx
try_files $uri $uri/ /index.html;
```

这是 SPA 的标配。注意 `/index.html` 会重新走一遍 `location` 匹配，也就是说它是一次完整的内部重定向，不是简单的路径替换。

**写法二，直接返回状态码。**

```nginx
try_files $uri $uri/ =404;
```

`=404` 表示所有候选都没命中就返回 404。这个写法适合纯静态资源目录，比如把 `/static/` 这个 `location` 单独拎出来用 `=404` 收口，避免请求一个不存在的图片却拿到一个 200 的 HTML 首页。

顺带说一句，这个坑我见过不止一次。SPA 全站兜底到 `index.html` 之后，任何一个路径不对的 JS 或图片请求都会拿到 200 加一段 HTML，浏览器控制台里报的是 `Uncaught SyntaxError: Unexpected token <`，看着完全不像是路径问题。真正的定位方式是打开 Network 看那个 404 资源的 Response，是 HTML 就说明被兜底了。

**写法三，回退到命名 location。**

```nginx
location / {
    try_files $uri $uri/ @backend;
}

location @backend {
    proxy_pass http://127.0.0.1:3000;
}
```

命名 `location` 以 `@` 开头，它不参与常规的 URI 匹配，只能被内部重定向命中。这个写法的典型场景是「静态文件存在就直接发，不存在就转给后端应用处理」，Node、Python、Tornado 这类应用的部署基本都是这个模式。

把 `try_files` 的最后一个参数设置为 `@tornado`，当 `$uri` 找不到时，就做一次内部重定向，把请求抛给 `location @tornado` 处理。

顺便说明一下为什么这里不能直接写 `proxy_pass`。`try_files` 的参数只能是文件路径、URI 或者状态码，它没有能力直接发起一次代理请求，所以必须借道命名 `location`。

### 4.2 为什么 $args 会丢

这条规则单独拿出来说，因为它是排查成本最高的一个。

```nginx
# 错误写法，?page=2 会丢
try_files $uri $uri/ /index.php;

# 正确写法
try_files $uri $uri/ /index.php?$query_string;
```

`rewrite` 指令在不带 `?` 的时候会自动把原始查询串接到新 URI 后面，`try_files` 没有这个行为。请求 `/list?page=2` 回退到 `/index.php` 之后，后端拿到的 `$_GET` 是空的。

回退目标是命名 `location` 时不受影响，因为命名 `location` 不改写 URI，`$args` 原封不动。

## 五、SPA history 路由为什么必须用它

回到开头那个刷新 404 的问题。

history 模式的路由是纯前端行为，`/user/detail` 这个地址只在浏览器的 JS 运行时里有意义，服务器磁盘上根本不存在 `user/detail` 这个文件。用户点导航跳转时走的是 `history.pushState`，压根没发请求，所以没事；一按 F5，浏览器老老实实向服务器请求 `/user/detail`，Nginx 找不到文件，返回 404。

解法就是告诉 Nginx，找不到实体文件时统一把 `index.html` 发回去，剩下的交给前端路由自己解析。

```nginx
server {
    listen 80;
    server_name example.com;
    root /data/www/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源单独收口，避免被兜底成 HTML
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?)$ {
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

这里有个细节值得强调。`index.html` 本身不能被强缓存，否则你发新版本了用户还在拿旧的 HTML，里面引用的带 hash 的 JS 文件早就不存在了，页面直接白屏。带 hash 的静态资源可以放心 `immutable`，入口 HTML 必须 `no-cache`。

```nginx
location = /index.html {
    add_header Cache-Control "no-cache, must-revalidate";
}
```

如果项目部署在子路径下（比如 `/admin/`），配置要跟着改：

```nginx
location /admin/ {
    alias /data/www/admin-dist/;
    try_files $uri $uri/ /admin/index.html;
}
```

`alias` 加 `try_files` 这个组合在早期版本的 Nginx 上有过一些行为不一致的报告，我自己只在 1.18 和 1.20 上验过，跑起来没问题。如果你用的版本更老，遇到 `try_files` 拼路径不对的情况，可以把 `alias` 换成 `root` 加上目录层级来绕开。

## 六、try_files 和 rewrite 该怎么选

原文提到 `try_files` 可以部分替代 `rewrite` 并提高解析效率，这个说法需要补充一下前提。

`rewrite` 的每一条规则都要跑一次正则匹配，规则多了 CPU 开销会累积，而且 `rewrite` 写在 `server` 块里的话每个请求都要过一遍。`try_files` 不做正则，代价是文件系统的 stat 调用，配上 `open_file_cache` 之后这部分开销可以压得很低。

所以选择标准大致是这样：

| 场景 | 推荐 | 原因 |
|------|------|------|
| 文件存在就发、不存在就兜底 | `try_files` | 判定依据就是「文件在不在」，天然匹配 |
| SPA history 路由回退 | `try_files` | 同上，且写法最短 |
| URL 需要按模式改写（去掉前缀、加版本段） | `rewrite` | 涉及正则捕获和替换，`try_files` 做不到 |
| 301/302 跳转到外部地址 | `rewrite` 或 `return` | `try_files` 只能内部重定向 |
| 需要保留并改写查询参数 | `rewrite` | 自动保留 `$args`，心智负担小 |

我一直觉得这两个指令不是替代关系，而是判定依据不同。`try_files` 问的是「磁盘上有没有」，`rewrite` 问的是「URL 长得像不像」。问题本身属于哪一类，就用哪一个。

还有个隐藏规则要提一下，`try_files` 在同一个 `location` 里只能写一条，写多条只有最后一条生效，不会报错也不会警告。这个我排查过一次，配置文件被两个人先后编辑，各自加了一行 `try_files`，结果前面那行完全没作用。`nginx -t` 是查不出来的。

关于 `location` 本身的匹配优先级，可以看看这篇 [Nginx location 匹配规则](https://feinterview.poetries.top/blog/nginx-location-match-rules)，两者配合起来才是完整的路由链路。

## 总结

`try_files` 的行为可以压缩成三句话。参数从左到右扫，第一个命中即停；非最后参数只做存在性检查并设置内部 URI 指向；最后一个参数是回退目标，会触发一次真正的内部重定向，且必须存在，否则 500。

`$uri` 查文件，命中就直接发；`$uri/` 查目录，命中之后还要交给 `index` 指令继续找默认文件。这个区别在混合部署的站点上会直接决定访问某个目录时拿到的是文档还是 SPA 首页。

回退写法有三种。`=404` 用来给静态资源收口，避免 404 资源被兜底成 200 的 HTML；`/index.html` 是 SPA 标配；命名 `location` 用在需要转发给后端应用的场景。注意 `$args` 不会自动带过去，回退到 URI 时要手动写 `?$query_string`。

至于和 `rewrite` 怎么选，判定依据是「磁盘上有没有」就用 `try_files`，是「URL 长得像不像」就用 `rewrite`。别硬套。

## 参考

- [Nginx 官方文档 ngx_http_core_module try_files](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)
- [Nginx 官方文档 open_file_cache](https://nginx.org/en/docs/http/ngx_http_core_module.html#open_file_cache)
- [Vue Router HTML5 History 模式服务器配置](https://router.vuejs.org/zh/guide/essentials/history-mode.html)
- [前端进阶之旅](https://interview.poetries.top)
