---
title: MongoDB拾遗(一)
date: 2019-01-22 17:10:30
tags: MongoDB
categories: DataBase
---

# 一、环境搭建

## 1.1 mongodb简介

- `MongoDB `旨在为WEB应用提供可扩展的高性能数据存储解决方案
- `MongoDB` 将数据存储为一个文档，数据结构由键值(`key=>value`)对组成。`MongoDB` 文档类似于 `JSON` 对象。字段值可以包含其他文档，数组及文档数组

![](http://www.runoob.com/wp-content/uploads/2013/10/crud-annotated-document.png)

**主要特点**

- 高可扩展性
- 分布式存储
- 低成本
- 结构灵活

## 1.2 window下mongodb环境搭建

- 下载安装包或压缩包
- 添加`db`存储和日志存储文件夹
- 添加服务、配置环境变量、启动`Mongo`

> 配置演示

- 在任意目录创建几个文件夹

![](https://poetries1.gitee.io/img-repo/2019/12/182.png)
![](https://poetries1.gitee.io/img-repo/2019/12/183.png)


**通过命令行启动服务**

> 配置环境变量

```bash
#  --dbpath指定数据存储位置
C:\Program Files\MongoDB\Server\3.4\bin\mongod --dbpath d:\mongodb\data
```

![](https://poetries1.gitee.io/img-repo/2019/12/184.png)

**通配置启动服务**

```bash
# 配置d:\mongodb\etc\mongodb.conf

#数据库路径
dbpath=d:\mongodb\data\

#日志输出文件路径
logpath=d:\mongodb\logs\mongodb.log

#错误日志采用追加模式，配置这个选项后mongodb的日志会追加到现有的日志文件，而不是从新创建一个新文件
logappend=true

#启用日志文件，默认启用
journal=true

#这个选项可以过滤掉一些无用的日志信息，若需要调试使用请设置为false
quiet=true

#端口号 默认为27017
port=27017

#指定存储引擎（默认先不加此引擎，如果报错了，大家在加进去）
storageEngine=mmapv1

#http配置 开启这个服务才可以在网页中访问 端口28017
httpinterface=true
```

- 启动方式 

```
C:\Program Files\MongoDB\Server\3.4\bin\mongod --config d:\mongodb\data 
```

![](https://poetries1.gitee.io/img-repo/2019/10/349.png)


**更加简洁的启动方式**
> 安装到`window`的服务里面，打开Windows看一下

```
C:\Program Files\MongoDB\Server\3.4\bin\mongod --config d:\mongodb\data --install --serviceName "MongoDB"
```

![](https://poetries1.gitee.io/img-repo/2019/10/350.png)


**使用MongoVue连接数据库**

![](https://poetries1.gitee.io/img-repo/2019/10/351.png)
![](https://poetries1.gitee.io/img-repo/2019/10/352.png)


## 1.3 linux下mongodb环境搭建

- 下载安装包或压缩包
- 添加`db`存储和日志存储文件夹
- 添加服务、配置环境变量、启动`Mongo`


```bash
# 远程登录服务器
ssh root@123.142.25.365
```

> 上传本地的安装包

```bash
# 上传文件夹，传文件不需要r
scp /mongodb/... -r root@123.142.25.365:/home

# 传到服务器的/home/
```


```bash
# 在指定的目录创建启动需要的文件

$ cd /home/
$ mkdir etc logs data
$ touch logs/mongodb.log etc/mongo.conf
```

```bash
# /home/etc/mongo.conf配置

dbpath=/home/mongodb/data
logpath=/mongodb/logs/mongodb.log
logappend=true
journal=true
quiet=true
port=2701
```


```bash
# 启动服务
mongod -f /home/mongodb/etc/mongo.conf
```

```bash
# 创建软连接

ln -s /home/mongodb/bin/mongo /usr/local/bin/mongo

ln -s /home/mongodb/bin/mongod /usr/local/bin/mongod
```


# 二、基本概念

## 2.1 数据库对比

|SQL术语/概念|MongoDB术语/概念|解析/说明|
|---|---|---|
|`database`|`database`|数据库|
|`table`|`collection`|数据表/集合|
|`row`|`document`|数据记录/文档|
|`column`|`field`|数据记录行/文档|
|`index`|`index`|索引|
|`table`| `joins`|表连接，`MongoDB`不支持|
|`primary key`|`primary key`|主键,`MongoDB`自动将`_id`字段设置为主键|

![](http://www.runoob.com/wp-content/uploads/2013/10/Figure-1-Mapping-Table-to-Collection-1.png)


## 2.2 数据库

- 一个`mongodb`中可以建立多个数据库
- `MongoDB`的默认数据库为"`db`"，该数据库存储在`data`目录中
- `"show dbs"` 命令可以显示所有数据的列表
- 执行 `"db"` 命令可以显示当前数据库对象或集合
- `"use"`命令，可以连接到一个指定的数据库

## 2.3 文档

- 文档是一组键值(`key-value`)对(即`BSON`)

```bash
{"site":"www.runoob.com", "name":"菜鸟教程"}
```


## 2.4 插入文档

- 切换数据库
  - `use` 数据库名(没有就创建)
- `db.createCollection("user") `
  - 创建集合相当于创建表名
  - 或者这样创建
    - `db.user.inert({id:123})`


## 2.5 插入数据表

**1. 手动插入**

```bash
# 切换创建数据库
use demo 

# goods相当于数据表
db.goods.insert({"prodictId":"10001","productName":"aaa","slaePrice":246,"productImage":"1.jpg"})

# 创建数据表，暂时不需插入数据
db.createCollection("goods")
```

**2. 客户端插入**

> 利用`mongodbVue`导入

# 三、常用操作

## 3.1 创建用户

**1. 创建管理员**

- 开启服务

```bash
# --auth进行授权，需要认证才可以
mongod -f d:/mongodb/etc/mongodb.conf --auth
```

**2. 通过非授权的方式启动服务**


```bash
# 创建admin数据库
use admin 

# 给admin数据库创建账号 
db.createUser({user:"admin",pwd:"admin",roles:["root"]}) # 3.4
db.addUser # 2.x

# 创建成功需要认证
db.auth("admin","admin") # 账号、密码
```

![](https://poetries1.gitee.io/img-repo/2019/10/353.png)


**3. 给使用的数据库添加用户**

1. 创建用户

![](https://poetries1.gitee.io/img-repo/2019/10/354.png)

2. 然后在授权登录试一下

## 3.2 MongoDB 创建数据库

- `MongoDB` 创建数据库的语法格式如下
- 如果数据库不存在，则创建数据库，否则切换到指定数据库

```
use DATABASE_NAME
```

- 查看所有数据库 
  - `show dbs`
- 我们刚创建的数据库 runoob 并不在数据库的列表中， 要显示它，我们需要向 runoob 数据库插入一些数据

```bash
> db.runoob.insert({"name":"poetries"})
WriteResult({ "nInserted" : 1 })
> show dbs
```


## 3.3 MongoDB 删除数据库

- `MongoDB `删除数据库的语法格式如下
- 删除当前数据库，默认为 `test`，你可以使用 `db` 命令查看当前数据库名

```bash
db.dropDatabase()
```

## 3.4 删除集合

```
db.collection.drop()
```

## 3.5 MongoDB 插入文档

> 文档的数据结构和`JSON`基本一样

## 3.6 插入文档

- `MongoDB` 使用 `insert() `或 `save()` 方法向集合中插入文档，语法如下

```bash
db.COLLECTION_NAME.insert(document)
```

- 以下文档可以存储在 `MongoDB` 的 `runoob `数据库 的 `col` 集合中

```bash
>db.col.insert({title: 'MongoDB 学习', 
    description: 'MongoDB 是一个 Nosql 数据库',
    by: 'poetries',
    url: 'http://blog.poetries.top',
    tags: ['mongodb', 'database', 'NoSQL'],
    likes: 100
})
```

- 以上实例中 `col` 是我们的集合名，如果该集合不在该数据库中， `MongoDB` 会自动创建该集合并插入文档。

- 查看已插入文档

```bash
> db.col.find()
> db.col.find().pretty() #格式化方式查看
```

## 3.7 MongoDB 更新文档


- `MongoDB` 使用 `update()` 和 `save()` 方法来更新集合中的文档

## 3.7 update() 方法

> `update()` 方法用于更新已存在的文档。语法格式如下

- 通过 `update() `方法来更新标题(`title`):

```
db.col.update({'title':'MongoDB 学习'},{$set:{'title':'MongoDB'}})
```

# 四、常用查询语句

|mongo|sql|说明|
|---|---|---|
|`db.users.find()`|`select * from users`|从`user`表中查询所有数据|
|`db.users.find({“username” : “joe”, “age” : 27})`|`select * from users where “username” = “joe” and age = 27`|查找`username = joe`且`age = 27`的人|
|`db.users.find({}, {“username” : 1, “email” : 1})`|`select username, email from users`|查找`username`,`email`这`2`个子项|
|`db.users.find({“age” : {“$gt” : 18}})`|`select * from users where age >18`|查找`age > 18`的会员|
|`db.users.find({“age” : {“$gte” : 18}})`|`select * from users where age >=18`|查找`age >= 18`的人|
|`db.users.find({“age” : {“$lt” : 18}})`|`select * from users where age <18`	|查找`age < 18`的人|
|`db.users.find({“age” : {“$lte” : 18}})`|`select * from users where age <=18`|查找`age <= 18`的人|
|`db.users.find({“username” : {“$ne” : “joe”}})`|`select * from users where username <> “joe”`|查找 `username != joe`的会员|
|`db.users.find({“ticket_no” : {“$in” : [725, 542, 390]}})`|`select * from users where ticket_no in (725, 542, 390)`|符合`tickt_no`在此范围的结果|
|`db.users.find({“ticket_no” : {“$nin” : [725, 542, 390]}})`|`select * from users where ticket_no not in (725, 542, 390)`|符合`tickt_no`不在此范围的结果|
|`db.users.find({“name” : /joey^/})`|`select * from users where name like “joey%”`|查找前`4`个字符为`joey`的人|



# 五、MongoDB链接

## 5.1 MongoDB链接express

```js
const express = require('express');
const mongoose = require('mongoose');
const app = express();

// 连接mongo 并且使用React这个集合，没有就会新建
const DB_URL = 'mongodb://127.0.0.1:27017/react';
mongoose.connect(DB_URL);
mongoose.connection.on('connected',()=>{
    console.log('mongo connect success');
})

// 类似于MySQL的表 mongo里有文档、字段的概念

const User = mongoose.model('user',new mongoose.Schema({
    user:{type:String,require:true},
    age:{type:Number,require:true}
}))

//新增数据
// User.create({
//     user:'小胡',
//     age:18
// },(err,doc)=>{
//     if(!err) {
//         console.log(doc)
//     } else {
//         console.log(err)
//     }
// })

// 删除数据 {}过滤对象
// User.remove({age:22},(err,doc)=>{
//     console.log(doc)
// })
// 更新
User.update({'user':'小明'},{'$set':{age:30}},(err,doc)=>{
    console.log(doc)
})
app.get('/',(req,res)=>{
    res.send('<h1>Hello word!</h1>')
})
app.get('/data',(req,res)=>{
    // findOne 只返回一条，返回对象直接使用，而不是返回数组
    User.findOne({'user':'小明'},(err,doc)=>{
        res.json(doc)
    })
})



app.listen(9000,()=>{
    console.log('Node app listen 9000')
})  
```
