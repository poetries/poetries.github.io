---
title: 学会使用Curl调试接口
date: 2019-12-12 11:32:41
tags: 
  - Linux
  - Curl
categories: Back-end
---

> 在我们平时开发接口完成后，需要上线联调接口，而接口往往和业务逻辑精密联系，想要调试接口，就需要将业务测一遍，那么有没有更好的办法使得调试更简单？

**常用的接口分为两类**

- 第一类：自己开发服务于自己系统的接口，该类接口调试可以在本地使用`postman`工具调试；
- 第二类：不是自己开发，调用别人能力接口服务于自己的系统，该类接口我们就可以使用`curl`命令调试。


# 一、Curl常用参数

- `-X/--request [GET|POST|PUT|DELETE|…]` 使用指定的`http method`发出 `http request`
- `-H/--header` 设定`request`里的`header`
- `-i/--include` 显示`response`的`header`
- `-d/--data` 设定 `http parameters`
- `-v/--verbose` 輸出比较多的信息
- `-u/--user` 使用者账号
- `-b/--cookie` `cookie` 文件路径 使用`cookie`

> 同一个功能常会有两个完全相同的参数, 一个是比较短的参数, 另一个是比较长的参数

> 参数`-X` 和 `--request` 两个功能是一样的 `curl -X POST http://www.example.com`  or  `curl --request POST http://www.example.com/`  是完全相同的.

# 二、curl发送请求参数使用

- `curl`发送请求参数使用

## 2.1 设置header

```
curl -i -H "Content-Type: application/json" http://www.baidu.com
```

## 2.2 设置HTTP parameter

```
curl -X POST -d "param1:value1&param2=value2" 或者 -d "param1=value1" -d "param2=value2"
```

## 2.3 session认证

```
curl -X GET 'http://www.baidu.com/' --header 'sessionid:sessionid值'
```

## 2.4 使用cookie

```
curl -i --header "Content-Type:application/json" -X GET -b ~/cookie.txt http://www.baidu.com
```

> 测试接口上传文件:我们用 `-F "file=@__FILE_PATH__"` 的方式，传输文件即可, 如果想看到详细的请求信息，可以加上 `-v` 参数 `curl -i -X POST -F 'file=@/User/uploadFile.txt' -H "token:abc123`" -v


## 2.5 HTTP基本认证

```
curl -i -u username:password http://www.baidu.com/api/foo'
```

## 2.6 post请求

> 由于我们平时遇到接口请求都是`post`请求，所以接下来我们以`post`请求为例，分别探讨http协议和https协议两种情况下如何通过curl命令来调试接口；

**http协议**

```
curl -v -X POST http://localhost:3000/api/posts --data '{"title":"controller", "content": "what is controller"}' -H 'Content-Type:application/json; charset=UTF-8'
```

- `-v` 显示版本信息
- `--header`等同于 `-H` 指定请求头（可校验调用方是否有权限，通过判断请求头信息，如果有规定的请求头信息，则允许调用，否则拒绝调用
- `--data` 请求参数(请求报文)
- `-X`：指定请求方式

**通过 curl 发出的 HTTP 请求的内容就会是下面这样的**

```
POST /api/posts HTTP/1.1
Host: localhost:3000
Content-Type: application/json; charset=UTF-8

{"title": "controller", "content": "what is controller"}
```

**https协议**

```
curl -v -k -X POST http://localhost:3000/api/posts
–cert '/app/milo/tomcat/milogenius/webapps/client.crt'
–key '/app/milo/tomcat/milogenius/webapps/client.key'
–pass 'milogenius'
```

- `-k` :允许不使用证书到`SSL`站点;
- `-cert`: 客户端证书文件;
- `-key`: 私钥文件名 (`SSL`);
- `-pass`: 私钥密码 (`SSL`);

## 2.7 扩展知识

- `curl post`请求, 数据可以采用`xml` 或者`json`格式, 并且可以发送本地`xml`和`json`文件

```
curl -H 'Content-Type:application/json' -X POST -d '{"name":"zhangsan"}' http://www.baidu.com/
```

```
curl -X POST -H 'content-type: application/json'  -d /apps/jsonfile.json http://www.baidu.com/
```

```
curl -X POST -H 'content-type:application/xml'  -d '<?xml version="1.0" encoding="UTF-8"?><name>zhangsan</name>' http://www.baidu.com/
```

