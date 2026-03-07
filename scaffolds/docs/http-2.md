---
title: HTTP协议系列（二）
date: 2018-02-26 23:20:43
tags: HTTP
categories: Back-end
---


> 图解HTTP一书

# 一、了解web及网络基础

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/TOP1%3A了解web及网络基础.png)

> 对于与`HTTP`相关的协议如`TCP`,`IP`,`DNS`,`ARP`等，它们之间协作关系如下：

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/http_tcp_dns_arp.png)


# 二、简单的HTTP协议

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/TOP2简单的HTTP协议.png)

## 2.1 请求与响应

> `HTTP`协议通过客户端(`request`)，服务器端(`response`)实现网络通信

- 请求报文：

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/request.png)

- 响应报文：

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/reponses.png)

## 2.2 HTTP非持久连接和持久连接

> `HTTP`既可以使用非持久连接（`nonpersistent connection`），也可以使用持久连接（`persistent connection`）。HTTP/1.0使用非持久连接，`HTTP/1.1`默认使用持久连接。

- HTTP持久连接是使用同一个TCP连接来发送和接收多个`HTTP`请求/应答，而不是为每一个新的请求/应答打开新的连接的方法

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/HTTP_persistent_connection.png)


## 2.3 HTTP管线化

- HTTP管线化将多个`HTTP`请求整批提交，而在发送过程中不需先等待服务端的回应。

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/HTTP_pipelining.png)

# 三、HTTP报文内HTTP信息

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/TOP3HTTP报文内HTTP信息.png)

## 3.1 请求报文

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/1a4e7e6a-6d7b-38f1-af8a-043140034c8f.jpg)

下面是一个实际请求：

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/412b4451-2738-3ebc-b1f6-a0cc13b9697b.jpg)

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/cdc4dbbb-f98e-31d5-8270-3c37bf1c54e5.jpg)

## 3.2 响应报文

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/0236098f-1a98-3a4f-ba6c-4a44c6ec4ed0.jpg)

以下是一个实际的HTTP响应报文： 

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/bddb00b6-a3e1-3112-a4f4-4b3cb8687c70.jpg)

# 四、返回结果的HTTP状态码

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/http1.jpg)

# 五、与HTTP协作的Web服务器

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/TOP5与HTTP协作的Web服务器.png)

# 六、HTTP首部

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/TOP6HTTP首部.png)

## 6.1 通用首部字段

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/header1.png)

## 6.2 请求首部字段

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/header2.png)

## 6.3 响应首部字段

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/header3.png)

## 6.4 实体首部字段

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/header4.png)

## 6.5 为 Cookie 服务的首部字段

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/header5.png)

# 七、确保Web安全的Https

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/TOP7确保Web安全的Https.png)

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/img_0137.png)

# 八、确认访问用户身份的认证

![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/TOP8确认访问用户身份的认证.png)

# 九、基于HTTP的功能追加协议
![](https://raw.githubusercontent.com/BeginMan/BookNotes/master/HTTP/media/TOP9基于HTTP的功能追加协议.png)






