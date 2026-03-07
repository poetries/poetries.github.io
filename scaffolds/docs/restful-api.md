---
title: 初探RESTful API
date: 2017-10-23 16:35:24
tags: 
   - JavaScript
   - RESTful API
categories: Front-End
---

## 一、RESTful API 简介

![](https://poetries1.gitee.io/img-repo/2019/10/509.png)
![](https://poetries1.gitee.io/img-repo/2019/10/510.png)
![](https://poetries1.gitee.io/img-repo/2019/10/511.png)

**总结一下什么是RESTful架构**

- 每一个`URI`代表一种资源
- 客户端和服务器之间，传递这种资源的某种表现层
- 客户端通过四个`HTTP`动词(`GET、POST、PUT、DELETE`)，对服务器端资源进行操作，实现"表现层状态转化"


## 二、RESTful API 设计

### 2.1、协议

- `API`与用户的通信协议，总是使用`HTTPs`协议

### 2.2、域名

- 应该尽量将`API`部署在专用域名之下

```javascript
https://api.example.com
```

- 如果确定API很简单，不会有进一步扩展，可以考虑放在主域名下

```javascript
https://example.org/api/
```

### 2.3、版本（Versioning）

- 应该将`API`的版本号放入`URL`

```javascript
https://api.example.com/v1/
```

### 2.4、路径（Endpoint）

- 表示`API`的具体网址
- 在`RESTful`架构中，每个网址代表一种资源（`resource`），所以网址中不能有动词，只能有名词

- 举例来说，有一个`API`提供动物园（`zoo`）的信息，还包括各种动物和雇员的信息，则它的路径应该设计成下面这样

```javascript
https://api.example.com/v1/zoos
https://api.example.com/v1/animals
https://api.example.com/v1/employees
```

### 2.5、HTTP动词

- 对于资源的具体操作类型，由`HTTP`动词表示


- `GET（SELECT）`：从服务器取出资源（一项或多项）。
- `POST（CREATE）`：在服务器新建一个资源。
- `PUT（UPDATE）`：在服务器更新资源（客户端提供改变后的完整资源）。
- `PATCH（UPDATE）`：在服务器更新资源（客户端提供改变的属性）。
- `DELETE（DELETE）`：从服务器删除资源。

> 下面是一些例子

```javascript
GET /zoos：列出所有动物园
POST /zoos：新建一个动物园
GET /zoos/ID：获取某个指定动物园的信息
PUT /zoos/ID：更新某个指定动物园的信息（提供该动物园的全部信息）
PATCH /zoos/ID：更新某个指定动物园的信息（提供该动物园的部分信息）
DELETE /zoos/ID：删除某个动物园
GET /zoos/ID/animals：列出某个指定动物园的所有动物
DELETE /zoos/ID/animals/ID：删除某个指定动物园的指定动物
```

### 2.6、过滤信息

> 如果记录数量很多，服务器不可能都将它们返回给用户。API应该提供参数，过滤返回结果

- 下面是一些常见的参数
  - `?limit=10`：指定返回记录的数量
  - `?offset=10`：指定返回记录的开始位置。
  - `?page=2&per_page=100`：指定第几页，以及每页的记录数。
  - `?sortby=name&order=asc`：指定返回结果按照哪个属性排序，以及排序顺序。
  - `?animal_type_id=1`：指定筛选条件

> 参数的设计允许存在冗余，即允许API路径和URL参数偶尔有重复。比如，`GET /zoo/ID/animals` 与 `GET /animals?zoo_id=ID` 的含义是相同的

### 2.7、状态码

> 服务器向用户返回的状态码和提示信息


### 2.8、错误处理

> 如果状态码是`4xx`，就应该向用户返回出错信息。一般来说，返回的信息中将`error`作为键名，出错信息作为键值即可

```javascript
{
    error: "Invalid API key"
}
```

### 2.9、返回结果

- 针对不同操作，服务器向用户返回的结果应该符合以下规范

```javascript
GET /collection：返回资源对象的列表（数组）
GET /collection/resource：返回单个资源对象
POST /collection：返回新生成的资源对象
PUT /collection/resource：返回完整的资源对象
PATCH /collection/resource：返回完整的资源对象
DELETE /collection/resource：返回一个空文档
```

### 2.10、Hypermedia API


> `RESTful API`最好做到`Hypermedia`，即返回结果中提供链接，连向其他`API`方法，使得用户不查文档，也知道下一步应该做什么


- 比如，当用户向`api.example.com`的根目录发出请求，会得到这样一个文档

```javascript
{"link": {
  "rel":   "collection https://www.example.com/zoos",
  "href":  "https://api.example.com/zoos",
  "title": "List of zoos",
  "type":  "application/vnd.yourformat+json"
}}
```

- 上面代码表示，文档中有一个`link`属性，用户读取这个属性就知道下一步该调用什么`API`了。`rel`表示这个`API`与当前网址的关系（collection关系，并给出该collection的网址），`href`表示`API`的路径，`title`表示`API`的标题，`type`表示返回类型


## 三、参考资料
  - [restful_api](http://www.ruanyifeng.com/blog/2014/05/restful_api.html)
