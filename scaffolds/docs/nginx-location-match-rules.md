---
title: nginx之location的匹配规则
date: 2018-02-28 13:01:42
tags: Nginx
categories: Back-end
---

> Nginx 配置文件在线生成: https://nginxconfig.io/

## 一、语法规则

```
location [=|~|~*|^~] /uri/ { … }
```

|符号|	含义|
|---|---|
|`=`|	开头表示精确匹配|
|`^~`|	开头表示 uri 以某个常规字符串开头，理解为匹配 `url` 路径即可。`nginx` 不对 `url` 做编码，因此请求为`/static/20%/aa`，可以被规则`^~ /static/ /aa`匹配到（注意是空格）|
|`~`|	开头表示区分大小写的正则匹配|
|`~`*|	开头表示不区分大小写的正则匹配|
|`/`|	通用匹配，任何请求都会匹配到|

> 多个 `location` 配置的情况下匹配顺序为

- 首先匹配 `=`
- 其次匹配 `^~`
- 其次是按文件中顺序的正则匹配
- 最后是交给 / 通用匹配
- 当有匹配成功时候，停止匹配，按当前匹配规则处理请求

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

> 那么产生的效果如下

- 访问根目录 `/`， 比如 `http://localhost/` 将匹配规则 `A`
- 访问 `http://localhost/login` 将匹配规则 `B`，`http://localhost/register` 则匹配规则 `F`
- 访问 `http://localhost/static/a.html` 将匹配规则 `C`
- 访问 `http://localhost/a.gif`, `http://localhost/b.jpg` 将匹配规则 `D `和规则 `E`，但是规则 `D` 顺序优先，规则 `E `不起作用，而 `http://localhost/static/c.png `则优先匹配到规则 `C`
- 访问 `http://localhost/a.PNG` 则匹配规则 `E`，而不会匹配规则 `D`，因为规则 `E` 不区分大小写

> 访问 `http://localhost/category/id/1111` 则最终匹配到规则 `F`，因为以上规则都不匹配，这个时候应该是 `nginx` 转发请求给后端应用服务器，比如 `FastCGI（PHP`），`tomcat（jsp）`，`nginx` 作为反向代理服务器存在

## 二、运用场景

> 实际使用中，至少有三个匹配规则定义，如下

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

