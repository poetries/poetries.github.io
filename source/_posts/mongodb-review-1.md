---
title: MongoDB拾遗(一)，环境搭建、基本概念与常用查询
description: MongoDB 入门实操笔记，覆盖 Windows 与 Linux 下的环境搭建与配置文件、database/collection/document 与关系型数据库的概念对照、用户授权、增删改查命令，以及 mongoose 连接 Node 服务的完整示例。
date: 2019-01-22 17:10:30
tags: 
  - MongoDB
  - NoSQL
  - 数据库
categories: DataBase
---

第一次装 MongoDB 的时候，我在「服务起不来」这一步卡了大半个下午。命令敲下去没报错，进程也不在，日志文件是空的。后来才发现是 `--dbpath` 指的那个目录我压根没建，MongoDB 找不到数据目录就直接退出了，而那个版本连一行提示都不给。

这篇是我把 MongoDB 从环境搭建到日常增删改查重新过了一遍的笔记。Windows 和 Linux 两套装法都记下来了，配置文件每一项在干什么也逐条说明，后面是概念对照表、用户授权和常用查询语句。最后给一个 Node 里用 mongoose 连库的完整例子。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- MongoDB 是什么，它和关系型数据库的取舍点在哪
- Windows 下三种启动方式，从命令行传参到注册成系统服务
- Linux 下从上传安装包到建软链的完整流程
- 配置文件每一项的含义，以及哪些配置在新版本里已经不能用了
- database、collection、document、field 和 SQL 概念的对照
- 开启授权、创建管理员账号、给业务库加用户
- 增删改查的命令，以及常用查询语句和 SQL 的逐条对照
- 在 Node 里用 mongoose 连接 MongoDB 的写法与新旧 API 差异

## 一、MongoDB 是什么

MongoDB 旨在为 WEB 应用提供可扩展的高性能数据存储解决方案。

它把数据存储为一个文档，数据结构由键值（`key=>value`）对组成。MongoDB 文档类似于 JSON 对象，字段值可以包含其他文档、数组及文档数组。

![MongoDB 文档结构示意](http://www.runoob.com/wp-content/uploads/2013/10/crud-annotated-document.png)

看这张图就明白它和 MySQL 最大的差别了。关系型数据库里一条订单和它的多个商品项，得拆成两张表再靠外键关联，查的时候 join 回来；MongoDB 里直接把商品项数组嵌在订单文档里，一次查询就全拿到了。

主要特点是这几条：

- 高可扩展性
- 分布式存储
- 低成本
- 结构灵活

「结构灵活」这条要辩证地看。刚起项目的时候不用写迁移脚本，加字段直接就加了，确实爽。但字段名写错也不会报错，只是多出来一个没人用的字段，等你发现的时候库里已经有两种结构的数据了。我的做法是应用层用 mongoose 的 Schema 把结构约束住，享受灵活的同时别真的什么都往里塞。

至于什么时候该用它，我的判断很简单：数据之间关联关系强、需要事务和复杂 join 的，老老实实用 MySQL；数据结构会经常变、单个文档能自包含、读多写少的，MongoDB 更省事。这块可以对照着看我另一篇 [MySQL 基础复习](https://feinterview.poetries.top/blog/mysql-base-review)，两边的概念放一起看会清晰很多。

## 二、Windows 下搭环境

整体就三步：下载安装包或压缩包、添加 db 存储和日志存储文件夹、添加服务配置环境变量启动 Mongo。

### 2.1 先把目录建出来

在任意目录创建几个文件夹。

![创建 MongoDB 所需的目录结构](https://s.poetries.top/gitee/2019/12/182.png)

![目录创建完成后的样子](https://s.poetries.top/gitee/2019/12/183.png)

开头说的那个坑就在这一步。`data` 和 `logs` 这两个目录必须提前手动建好，MongoDB 不会替你创建。目录不存在的时候进程会直接退出，老版本给的提示很弱，很容易以为是安装包有问题。

### 2.2 命令行传参启动

配好环境变量之后，最直接的启动方式是这样。

```bash
#  --dbpath指定数据存储位置
C:\Program Files\MongoDB\Server\3.4\bin\mongod --dbpath d:\mongodb\data
```

![命令行启动 mongod 服务的输出](https://s.poetries.top/gitee/2019/12/184.png)

这种方式最快，适合第一次验证能不能跑起来。缺点也明显，参数一多命令就长得没法看，而且关掉这个命令行窗口服务就停了。

### 2.3 用配置文件启动

参数多了就写进配置文件。

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

逐条说一下这里面值得注意的。

`logappend=true` 建议一直开着。关掉的话每次重启都会覆盖日志文件，你想回看上次为什么挂掉，日志已经没了。

`quiet=true` 是把大部分常规日志过滤掉，只留关键信息。生产上开着能省不少磁盘，但排查问题时一定要临时关掉，不然你什么线索都看不到。

`journal=true` 是预写日志，掉电或者进程被强杀之后靠它恢复数据。除非是纯临时的测试库，否则不要关。

这份配置有两处是时代痕迹，得说清楚，别照抄到新版本上。

`storageEngine=mmapv1` 指的是老的 MMAPv1 存储引擎。MongoDB 从 3.2 开始默认就换成 WiredTiger 了，MMAPv1 在后续版本中被移除。现在的版本不用写这一项，写了反而起不来。WiredTiger 支持文档级别的并发控制和压缩，比 MMAPv1 的库级别锁强太多，没有理由回头去用老引擎。

`httpinterface=true` 说的是那个 28017 端口的网页状态界面。这个功能后来也被移除了，现在看实例状态用 MongoDB Compass 或者 `mongosh` 里的 `db.serverStatus()`。

还有一点，这种 `key=value` 的配置文件格式是老写法，新版本推荐的是 YAML 格式（`storage.dbPath` 这种带层级的写法）。老格式在一段时间内还兼容，但新项目建议直接用 YAML。具体哪个版本移除了什么，以官方文档为准。

启动方式：

```
C:\Program Files\MongoDB\Server\3.4\bin\mongod --config d:\mongodb\etc\mongodb.conf 
```

原文这里的 `--config` 后面跟的是 `d:\mongodb\data`，那是数据目录不是配置文件，跟着敲一定起不来，我按上面配置文件的实际路径改正了。`--config` 必须指向那个 `.conf` 文件本身。

![使用配置文件启动服务](https://s.poetries.top/gitee/2019/10/349.png)

### 2.4 注册成 Windows 服务

前面两种方式都得开着命令行窗口，更省事的是装进 Windows 的服务里。

```
C:\Program Files\MongoDB\Server\3.4\bin\mongod --config d:\mongodb\etc\mongodb.conf --install --serviceName "MongoDB"
```

![MongoDB 注册为 Windows 服务后的样子](https://s.poetries.top/gitee/2019/10/350.png)

装完之后开机自启，也不用管命令行窗口了。要卸载的话把 `--install` 换成 `--remove`。这里同样把 `--config` 的路径改成了配置文件。

### 2.5 用客户端连上去看看

服务起来之后，用图形客户端连一下是最快的验证方式，比在命令行里敲 `show dbs` 直观。

![MongoVue 连接数据库](https://s.poetries.top/gitee/2019/10/351.png)

![MongoVue 中查看集合数据](https://s.poetries.top/gitee/2019/10/352.png)

图里用的是 MongoVue，那个年代比较流行。现在官方自己出了 MongoDB Compass，免费而且更新跟得上服务端版本，新装的话直接用它。

## 三、Linux 下搭环境

思路和 Windows 一样，下载安装包或压缩包、添加 db 存储和日志存储文件夹、添加服务配置环境变量启动 Mongo。区别在于文件传输和软链这两步。

远程登录服务器：

```bash
# 远程登录服务器
ssh root@123.142.25.36
```

把本地的安装包传上去：

```bash
# 上传文件夹，传文件不需要r
scp /mongodb/... -r root@123.142.25.36:/home

# 传到服务器的/home/
```

`scp` 传目录必须加 `-r`，传单个文件不用。这条命令传的量大的时候没有进度条会让人心里没底，可以换成 `rsync -avP`，它有进度显示而且断了能续传。

在指定的目录创建启动需要的文件：

```bash
$ cd /home/
$ mkdir etc logs data
$ touch logs/mongodb.log etc/mongo.conf
```

写配置：

```bash
# /home/mongodb/etc/mongo.conf配置

dbpath=/home/mongodb/data
logpath=/home/mongodb/logs/mongodb.log
logappend=true
journal=true
quiet=true
port=27017
```

原文这份配置里 `logpath` 写的是 `/mongodb/logs/...`，少了 `/home` 前缀，和上面建目录的路径对不上；`port` 写的是 `2701`，少了一位，和默认端口 27017 不一致。这两处我都按上下文改齐了。配置文件里路径写错是最常见的启动失败原因，改完之后建议先 `ls` 一下确认每个路径都真实存在。

启动服务：

```bash
# 启动服务
mongod -f /home/mongodb/etc/mongo.conf
```

`-f` 就是 `--config` 的短写法。

最后建软链，这样在任意目录都能直接敲 `mongo` 和 `mongod`，不用写全路径。

```bash
ln -s /home/mongodb/bin/mongo /usr/local/bin/mongo

ln -s /home/mongodb/bin/mongod /usr/local/bin/mongod
```

补一句现状，`mongo` 这个旧的命令行客户端在新版本里已经被 `mongosh` 取代了，语法基本兼容，多了自动补全和语法高亮。装新版本的话软链的目标名字要跟着变。

## 四、基本概念

### 4.1 和关系型数据库的概念对照

刚从 MySQL 转过来的时候，最省事的入门方式就是把两边的概念对上号。

|SQL术语/概念|MongoDB术语/概念|解析/说明|
|---|---|---|
|`database`|`database`|数据库|
|`table`|`collection`|数据表/集合|
|`row`|`document`|数据记录/文档|
|`column`|`field`|数据字段|
|`index`|`index`|索引|
|`table joins`| 无直接对应 |表连接，早期 MongoDB 不支持|
|`primary key`|`primary key`|主键，MongoDB 自动将 `_id` 字段设置为主键|

![关系型表结构到 MongoDB 集合的映射](http://www.runoob.com/wp-content/uploads/2013/10/Figure-1-Mapping-Table-to-Collection-1.png)

表连接那一行要补充一下。「MongoDB 不支持 join」这个说法在早期是准确的，后来的版本提供了 `$lookup` 聚合阶段，可以做类似左外连接的操作。但它的性能特征和关系型数据库的 join 差别很大，设计数据模型时还是应该优先考虑内嵌而不是靠 `$lookup` 拼，具体能力和限制以官方文档为准。

`_id` 这个字段值得单独说。插入文档时你不给，MongoDB 会自动生成一个 ObjectId，它是 12 字节的值，里面编码了时间戳。所以 ObjectId 天然是按创建时间递增的，按 `_id` 排序约等于按创建时间排序，这个特性偶尔挺好用。

### 4.2 数据库

- 一个 MongoDB 中可以建立多个数据库
- 默认连上去所在的数据库是 `test`，数据文件存储在启动时 `dbpath` 指定的目录中
- `show dbs` 命令可以显示所有数据库的列表
- 执行 `db` 命令可以显示当前所在的数据库
- `use` 命令可以切换到一个指定的数据库

原文这里写的是「MongoDB 的默认数据库为 db」，把 `db` 这个查看当前库的命令当成库名了，实际默认库是 `test`，我改正了。

### 4.3 文档

文档是一组键值（`key-value`）对，底层存储格式是 BSON（Binary JSON）。

```bash
{"site":"www.runoob.com", "name":"菜鸟教程"}
```

BSON 和 JSON 的区别在于它是二进制的，而且多了几种 JSON 没有的类型，比如 Date、ObjectId、二进制数据。所以你在 MongoDB 里存的日期是真正的日期类型，能直接参与范围比较，不是一个日期字符串。

### 4.4 插入文档

切换数据库用 `use 数据库名`，这个库不存在的话会在你第一次写入数据时才真正创建。

创建集合相当于创建表名：

```
db.createCollection("user")
```

或者不显式创建，直接往一个不存在的集合里插数据，集合会被自动建出来：

```
db.user.insert({id:123})
```

原文这里写的是 `db.user.inert(...)`，少了一个字母，是个 typo。

「集合自动创建」这个行为有好有坏。好处是省事，坏处是集合名敲错了不会报错，你会得到一个空的新集合，然后在原来那个集合里怎么也查不到刚插的数据。这个我踩过，查了十几分钟才发现是把 `users` 敲成了 `user`。

### 4.5 插入数据表

手动插入：

```bash
# 切换创建数据库
use demo 

# goods相当于数据表
db.goods.insert({"prodictId":"10001","productName":"aaa","slaePrice":246,"productImage":"1.jpg"})

# 创建数据表，暂时不需插入数据
db.createCollection("goods")
```

顺带说一句，上面这条命令里的字段名 `prodictId` 和 `slaePrice` 都拼错了（应该是 `productId` 和 `salePrice`）。我保留了原样，因为它正好说明了前面提到的问题：MongoDB 不会因为字段名拼错报任何错，这条数据会安安静静地存进去，直到某天你按 `productId` 查不到东西为止。用 mongoose 的 Schema 或者在新版本里配 schema validation，就是为了拦住这类问题。

客户端插入的话，用 MongoVue 或者 Compass 的导入功能，把 JSON 文件直接导进去。

## 五、常用操作

### 5.1 创建用户与授权

默认起的 MongoDB 是不需要密码就能连的，这在开发机上无所谓，暴露到公网上就是事故。开启授权的方式是启动时加 `--auth`。

```bash
# --auth进行授权，需要认证才可以
mongod -f d:/mongodb/etc/mongodb.conf --auth
```

这里有个先有鸡还是先有蛋的问题：开了 `--auth` 之后没账号连不上，可账号又得连上去才能建。MongoDB 的解法是「本地例外」，第一次可以先用非授权方式启动，把管理员建好再重启成授权模式。

先用非授权方式启动服务，然后建管理员：

```bash
# 创建admin数据库
use admin 

# 给admin数据库创建账号 
db.createUser({user:"admin",pwd:"admin",roles:["root"]}) # 3.4
db.addUser # 2.x

# 创建成功需要认证
db.auth("admin","admin") # 账号、密码
```

![创建管理员账号并认证](https://s.poetries.top/gitee/2019/10/353.png)

`db.addUser` 是 2.x 时代的老 API，2.6 之后就被 `db.createUser` 取代了，这里列出来只是给你看老文档时能对上号。

`roles:["root"]` 给的是超级权限，只应该给这个初始管理员。业务用的账号要按最小权限来，比如只读的服务给 `read`，需要写的给 `readWrite`，而且要限定在具体的数据库上。密码这里写成 `admin` 是演示，真实环境不用多说。

给使用的数据库添加用户：

![给业务数据库创建专用用户](https://s.poetries.top/gitee/2019/10/354.png)

建完之后一定要实际用这个账号登录验证一次。常见的错在于账号是在哪个库下建的，认证时也必须指定同一个库（连接串里的 `authSource`），建在 A 库的账号拿去 B 库认证是不通过的。这个报错信息看起来像密码错了，方向很容易带偏。

### 5.2 创建与删除数据库

创建数据库的语法是这样，如果数据库不存在则创建，否则切换到指定数据库。

```
use DATABASE_NAME
```

`show dbs` 查看所有数据库。刚创建的数据库并不会出现在列表里，要显示它，需要先往里面插入一些数据。

```bash
> db.runoob.insert({"name":"poetries"})
WriteResult({ "nInserted" : 1 })
> show dbs
```

这个行为的原因是 MongoDB 的库是「惰性创建」的，`use` 只是把当前上下文切过去，磁盘上什么都没发生，直到有第一次写入。

删除当前数据库，默认为 `test`，可以用 `db` 命令查看当前数据库名：

```bash
db.dropDatabase()
```

删除集合：

```
db.collection.drop()
```

这两个命令没有二次确认，敲下去就没了。在生产库上操作前先看一眼 `db` 的输出确认自己在哪个库，这个习惯值得养成。

### 5.3 插入文档

MongoDB 使用 `insert()` 或 `save()` 方法向集合中插入文档。

```bash
db.COLLECTION_NAME.insert(document)
```

以下文档可以存储在 MongoDB 的 runoob 数据库的 col 集合中：

```bash
> db.col.insert({title: 'MongoDB 学习', 
    description: 'MongoDB 是一个 Nosql 数据库',
    by: 'poetries',
    url: 'http://blog.poetries.top',
    tags: ['mongodb', 'database', 'NoSQL'],
    likes: 100
})
```

`col` 是集合名，如果该集合不在该数据库中，MongoDB 会自动创建该集合并插入文档。

查看已插入文档：

```bash
> db.col.find()
> db.col.find().pretty() #格式化方式查看
```

`pretty()` 是刚上手时的救命稻草，不加的话一条文档会挤成一行，字段一多根本读不了。

补一句新旧 API：`insert()` 和 `save()` 在后来的版本里被标记为废弃，推荐用语义更明确的 `insertOne()` 和 `insertMany()`。老命令目前还能用，但新写的代码建议直接用新的，因为它们的返回值结构更清楚，也更容易判断到底写成功了几条。

### 5.4 更新文档

MongoDB 使用 `update()` 和 `save()` 方法来更新集合中的文档。

通过 `update()` 方法来更新标题：

```
db.col.update({'title':'MongoDB 学习'},{$set:{'title':'MongoDB'}})
```

这里的 `$set` 千万不能漏。不写 `$set` 直接给第二个参数传一个文档对象，MongoDB 的行为是把整条记录替换成你给的那个对象，其他字段全没了。这是个非常经典的事故来源，一条命令能把一整个集合的数据洗掉。

`update()` 默认只更新匹配到的第一条，想全改要加 `{multi: true}`。新版本同样把它拆成了语义明确的 `updateOne()` 和 `updateMany()`，不用再靠一个布尔开关来区分，推荐用新的。

## 六、常用查询语句与 SQL 对照

查询是日常用得最多的部分，和 SQL 逐条对照着记最快。

|mongo|sql|说明|
|---|---|---|
|`db.users.find()`|`select * from users`|从 user 表中查询所有数据|
|`db.users.find({"username" : "joe", "age" : 27})`|`select * from users where username = 'joe' and age = 27`|查找 username = joe 且 age = 27 的人|
|`db.users.find({}, {"username" : 1, "email" : 1})`|`select username, email from users`|只查 username 和 email 这两个字段|
|`db.users.find({"age" : {"$gt" : 18}})`|`select * from users where age > 18`|查找 age > 18 的会员|
|`db.users.find({"age" : {"$gte" : 18}})`|`select * from users where age >= 18`|查找 age >= 18 的人|
|`db.users.find({"age" : {"$lt" : 18}})`|`select * from users where age < 18`|查找 age < 18 的人|
|`db.users.find({"age" : {"$lte" : 18}})`|`select * from users where age <= 18`|查找 age <= 18 的人|
|`db.users.find({"username" : {"$ne" : "joe"}})`|`select * from users where username <> 'joe'`|查找 username != joe 的会员|
|`db.users.find({"ticket_no" : {"$in" : [725, 542, 390]}})`|`select * from users where ticket_no in (725, 542, 390)`|符合 ticket_no 在此范围的结果|
|`db.users.find({"ticket_no" : {"$nin" : [725, 542, 390]}})`|`select * from users where ticket_no not in (725, 542, 390)`|符合 ticket_no 不在此范围的结果|
|`db.users.find({"name" : /^joey/})`|`select * from users where name like 'joey%'`|查找前 4 个字符为 joey 的人|

原文这张表里的引号全是中文弯引号，直接复制到 shell 里执行会报语法错误，我统一换成了英文直引号。最后一行的正则原文写的是 `/joey^/`，`^` 放在末尾是「匹配字符串开头」这个锚点放错了位置，这个表达式永远匹配不到东西，正确写法是 `/^joey/`。

关于正则查询有个性能问题得提醒一下。`/^joey/` 这种以 `^` 开头、不带忽略大小写标志的前缀匹配，MongoDB 能用上索引；而 `/joey/` 这种中间匹配（相当于 SQL 的 `like '%joey%'`）用不上索引，只能全集合扫描。数据量上来之后这两者的差距是数量级的。

第三行那个投影参数也值得单独说。`{"username": 1, "email": 1}` 表示只返回这两个字段，但 `_id` 是个例外，它默认总会返回，不想要得显式写 `{_id: 0}`。接口往前端返数据时，把不需要的字段投影掉能省不少带宽。

## 七、在 Node 里连接 MongoDB

下面是一个 Express 结合 mongoose 的完整例子，涵盖了连接、定义模型、增删改查。

```js
const express = require('express');
const mongoose = require('mongoose');
const app = express();

// 连接mongo 并且使用react这个数据库，没有就会新建
const DB_URL = 'mongodb://127.0.0.1:27017/react';
mongoose.connect(DB_URL);
mongoose.connection.on('connected',()=>{
    console.log('mongo connect success');
})

// 类似于MySQL的表 mongo里有文档、字段的概念

const User = mongoose.model('user',new mongoose.Schema({
    user:{type:String,required:true},
    age:{type:Number,required:true}
}))
```

`mongoose.model` 的第一个参数是模型名，mongoose 会自动把它转成小写复数作为集合名，也就是这里的 `user` 对应库里的 `users` 集合。这个自动转换第一次遇到会有点懵，明明写的 `user`，去库里一看集合叫 `users`。想指定集合名可以传第三个参数。

原文 Schema 里写的是 `require:true`，正确的字段名是 `required`。写成 `require` 不会报错，mongoose 会把它当成一个未知选项忽略掉，结果就是你以为加了必填校验，实际上空值照样能存进去。这类「静默失效」的配置错误最难查，我改正了。

接着是增删改查的部分。

```js
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
```

这段是 2019 年的写法，现在跑不通了，得说清楚差在哪。

一是回调风格。老版本 mongoose 的方法既支持回调也返回 Promise，后来的大版本把回调支持整个移除了，现在只能用 `await` 或者 `.then()`。所以上面这些 `(err, doc) => {}` 的写法在新版本里会直接抛错。

二是方法名。`remove()` 和 `update()` 都已废弃，对应换成 `deleteOne()`/`deleteMany()` 和 `updateOne()`/`updateMany()`。

换成现在的写法大概是这样。

```js
await User.create({ user: '小胡', age: 18 })
await User.deleteMany({ age: 22 })
await User.updateOne({ user: '小明' }, { $set: { age: 30 } })
```

具体哪个版本移除了哪个 API，以 mongoose 官方的迁移文档为准，不同大版本之间差异不小。

最后是路由部分。

```js
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

`findOne` 和 `find` 的区别在返回值形态上：前者返回单个文档对象或者 `null`，后者永远返回数组（没查到就是空数组）。前端拿到 `null` 和拿到 `[]` 的处理逻辑不一样，接口设计时最好统一，别一个接口返对象另一个返数组。

如果你用的是 Koa 而不是 Express，接法是一样的，mongoose 和框架本身没有耦合。Koa 那边的中间件和 `ctx` 机制我在 [重新认识 Koa2](https://feinterview.poetries.top/blog/relearn-koa) 里写过，连库的代码可以直接搬过去。

## 总结

MongoDB 入门这一段，真正会卡住人的其实是环境和概念，不是命令。

环境这块记住三件事。数据目录和日志目录必须手动建，不建就是静默退出。`--config` 后面跟的是配置文件路径，不是数据目录。老教程里的 `storageEngine=mmapv1` 和 `httpinterface=true` 在新版本上会导致起不来，照抄配置前先对一下自己的版本。

概念这块最值得先建立的是「集合和字段都是惰性创建」这个认知。集合名敲错、字段名拼错，MongoDB 一律不报错，安静地帮你新建。所以应用层的 Schema 校验不是可选项，是必需品，`required` 别写成 `require`。

命令这块，`update` 不写 `$set` 会整条替换，这是能造成实际数据损失的一个坑；正则查询只有 `/^prefix/` 这种前缀匹配用得上索引；投影时 `_id` 默认总会返回，要显式排除。

至于 Node 侧，2019 年的回调写法在现在的 mongoose 上已经跑不通了，`remove`/`update` 换成了 `deleteOne`/`updateOne` 这类语义明确的方法，回调支持也被移除了，迁移时按官方文档逐个对照过一遍比较稳妥。

## 参考

- [MongoDB 官方文档](https://www.mongodb.com/docs/manual/)
- [MongoDB 配置文件选项](https://www.mongodb.com/docs/manual/reference/configuration-options/)
- [MongoDB CRUD 操作](https://www.mongodb.com/docs/manual/crud/)
- [MongoDB 用户与角色管理](https://www.mongodb.com/docs/manual/reference/method/db.createUser/)
- [Mongoose 官方文档](https://mongoosejs.com/docs/guide.html)
- [菜鸟教程 MongoDB 教程](https://www.runoob.com/mongodb/mongodb-tutorial.html)
- [前端进阶之旅](https://interview.poetries.top)
