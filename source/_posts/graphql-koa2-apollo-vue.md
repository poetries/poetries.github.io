---
title: GraphQL+Koa2 搭建服务端 API 并用 Apollo 对接 Vue
description: 从零用 GraphQL 搭一套服务端 API。先在 Express 和 Koa2 里集成 graphql-js，写 Schema、聚合查询、分页与增删改，再用 Apollo Client 在 Vue 项目里做查询、mutation 和上拉加载更多。
date: 2022-07-01 20:40:43
tags:
   - GraphQL
   - Node
   - Koa
   - Vue
categories: Back-end
---

做后台管理系统那阵子，我被一个需求折腾得挺烦：文章列表页要标题和状态，文章详情页要正文和分类名，App 端只要标题和封面图。三个端，三套字段，后端就得维护三个接口，或者维护一个返回 50 个字段的「大而全」接口。前端拿到一坨 JSON，还得靠猜才知道哪个字段是有用的。

后来把这套东西用 GraphQL 重写了一遍，前端要什么字段自己在查询里写，后端只管把 Schema 描述清楚。这篇是我当时的完整实战笔记，从 mongodb 造数据开始，到 Express、Koa2 两种集成方式，再到 Vue 里用 Apollo 消费接口，中间的坑我都标出来了。

<!--more-->

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- GraphQL 到底解决了 RESTful 的哪几个具体痛点，什么场景下不值得上
- GraphQL 的类型系统：标量类型、Object、List、Non-Null 分别怎么用
- 整套 Demo 的架构分层，请求从 Vue 组件走到 mongodb 中间经过了什么
- Express 集成 `express-graphql`，写出第一个可查询的 Schema
- Koa2 集成 `koa-graphql`，实现聚合查询、分页查询和增删改（mutation）
- Vue 里用 `vue-apollo` + `apollo-boost` 做简单查询、带参查询、mutation 和上拉分页
- 上线前必须确认的一份 checklist，以及 2022 年至今这套依赖的现状

## 一、GraphQL 解决了什么问题

### 1.1 先说清楚它是什么

> GraphQL 是一种新的 API 的查询语言，它提供了一种更高效、强大和灵活 API 查询。它是由 Facebook 开发和开源，目前由来自世界各地的大公司和个人维护。GraphQL 对你的 API 中的数据提供了一套易于理解的完整描述，使得客户端能够准确地获得它需要的数据，而且没有任何冗余。它弥补了 RESTful API（字段冗余，扩展性差、无法聚合 api、无法定义数据类型、网络请求次数多）等不足

这里有个很多人一上来就搞混的点，**GraphQL 是 API 的查询语言，不是数据库**。它和 SQL 没有半点关系，也不关心你底层用的是 mongodb、MySQL 还是别人家的 HTTP 接口。我更愿意把它理解成架在业务 API 之上的一层描述和编排：你把数据长什么样、字段是什么类型、怎么取到，全部用 Schema 声明一遍，剩下的拼装交给客户端。

正因为它和存储无关，所以在哪种语言里都能落地。

- 服务器端语言：C# / .NET、Clojure、Elixir、Erlang、Go、Groovy、Java、JavaScript、PHP、Python、Scala、Ruby
- 客户端语言：js、React + React Native、Angular、Vue.js、Apollo Link、Native iOS、Native Android、Scala.js

两个官方入口先存下来，后面写 Schema 查类型的时候要反复翻：

- 中文文档：http://graphql.cn
- Github: https://github.com/facebook/graphql

### 1.2 它是被什么倒逼出来的

当提起 API 设计的时候，大家通常会想到 SOAP（一种简单的基于 XML 的协议）、RESTful 等设计方式。从 2000 年 RESTful 的理论被提出的时候，在业界引起了很大反响，因为这种设计理念更易于用户的使用，所以便很快的被大家所接受。

REST 是一种从服务器公开数据的流行方式。**当 REST 的概念被提出来的时候**，客户端应用程序对数据的需求相对简单，而迭代的速度也没有达到今天的水平。

那时候 REST 对于许多应用程序来说是非常合适的。可业务越来越复杂，客户对系统扩展性的要求越来越高，API 环境发生了巨大的变化，**RESTful 就显得心有余而力不足**。具体表现就是那几条：字段冗余、扩展性差、无法聚合 api、无法定义数据类型、网络请求次数多。

GraphQL 的出现正好补上了 RESTful API 的这几块短板。

已经在用 GraphQL 的公司不少，官方维护了一份名单（https://graphql.org/users/）：

![使用 GraphQL 的公司名单，GitHub、Shopify 等都在列](https://s.poetries.top/uploads/2022/06/1f26bea368abe7ae.png)

### 1.3 为什么推荐 GraphQL 而不是 RESTful API

在过去的十多年中，REST 已经成为设计 web api 的标准（虽然只是一个模糊的标准）。它提供了一些很棒的想法，比如无状态服务器和结构化的资源访问。

然而 REST api 表现得过于僵化，跟不上客户端需求变化的速度。

先看 RESTful 具体卡在哪三个地方。

**扩展性差，多个终端需要返回不同的字段。** 单个 RESTful 接口返回的数据会越滚越臃肿。前端对于真正用到的字段是没有直观映像的，仅仅通过 url 地址，无法预测也无法回忆返回的字段数目和字段是否有效。接口返回 50 个字段，实际只用 5 个，剩下 45 个就是纯粹的带宽浪费。

**API 聚合问题。** 某个前端页面的一次展现，实际需要调用多个独立的 RESTful API 才能凑齐数据，导致网络请求次数多。文章详情页要拿文章 + 分类 + 作者，就是三个请求，串行起来首屏直接慢一截。

**前后端字段频繁改动，导致类型不一致。** 错误的数据类型可能会导致网站出错，尤其是在业务多变的场景中，很难在保证工程质量的同时快速满足业务需求。后端偷偷把 `status` 从数字改成字符串，前端的 `=== 1` 判断就悄无声息地失效了。

那 GraphQL 好在哪？它吸收了 RESTful API 的特性，同时补上了这几块。

**所见即所得。** 各种不同的前端框架和平台可以指定自己需要的字段，查询的返回结果就是输入的查询结构的精确映射。你写什么形状，就回什么形状，不多不少。

**客户端可以自定义 API 聚合。** 如果设计的数据结构是从属的，直接就能在查询语句中指定；即使数据结构是独立的，也可以在查询语句中指定上下文。只需要一次网络请求，就能拿到资源和子资源的全部数据。上面那个「文章 + 分类 + 作者」的例子，在 GraphQL 里就是一次请求。

**代码即是文档。** GraphQL 会把 schema 定义和相关的注释生成可视化的文档，代码变更直接反映到最新的文档上，避免 RESTful 里手工维护 Swagger 造成代码、文档不一致的问题。这个设计是真的舒服，后面用 GraphiQL 调试的时候你会有体感。

**参数类型强校验。** RESTful 方案本身没有对参数的类型做规定，往往都需要自行实现参数的校验机制以确保安全；GraphQL 提供了强类型的 schema 机制，从而天然确保了参数类型的合法性。必填字段少传一个，请求根本进不到 resolve 里。

这里也要泼一点冷水。不是说 RESTful 不行，而是 GraphQL 有它自己的代价：缓存策略比 REST 复杂（所有请求都打到一个 URL，CDN 和浏览器缓存基本用不上）、深层嵌套查询容易触发 N+1 数据库查询、还得额外防一手恶意的超深查询。**如果你的项目只有一个 Web 端、接口十来个、字段也基本稳定，那上 GraphQL 大概率是给自己找活干。** 我自己的判断是，多端 + 字段差异大 + 页面需要聚合多个资源，这三条至少中两条才值得上。

## 二、GraphQL 的类型系统

Schema 是整个 GraphQL 服务的骨架，而 Schema 是由类型拼出来的。这一节先把类型认全，后面写 `schema/default.js` 的时候才不会照抄不知所以。

### 2.1 标量类型和高级类型

> 可以将 GraphQL 的类型系统分为 `标量类型`（Scalar Types）和其他 `高级数据类型`。标量类型即可以表示最细粒度数据结构的数据类型，可以和 JavaScript 的原始类型对应

标量类型是叶子节点，一个查询最终一定会落到某个标量上，不然 GraphQL 会直接报错说这个字段必须再选子字段。规范目前规定支持的标量类型有这几个：

- **Int**：有符号 `32` 位整数，对应 `GraphQLInt`
- **Float**：有符号双精度浮点值，对应 `GraphQLFloat`
- **String**：`UTF-8` 字符序列，对应 `GraphQLString`
- **Boolean**：`true` 或者 `false`，对应 `GraphQLBoolean`
- **ID**（`GraphQLID`）：表示一个唯一标识符，通常用以重新获取对象或者作为缓存中的键。ID 类型使用和 String 一样的方式序列化，但把它定义为 ID 就是在告诉调用方「这玩意儿不用给人看」

这里有个坑要注意：mongodb 的 `_id` 是 ObjectId，序列化出来是 24 位十六进制字符串。用 `GraphQLID` 或 `GraphQLString` 都能跑，但语义上 `GraphQLID` 更准，Apollo Client 的默认缓存策略也是靠 `id` / `_id` 字段做归一化的。后面 Koa 那版 Schema 就把 `_id` 换成了 `GraphQLID`。

再往上是高级数据类型。

**Object（`new GraphQLObjectType`）** 用于描述层级或者树形数据结构。对于树形数据结构来说，叶子字段的类型都是标量数据类型。几乎所有 GraphQL 类型都是对象类型。Object 类型有一个 `name` 字段，以及一个很重要的 `fields` 字段，`fields` 可以描述出一个完整的数据结构。

下面这段定义了一个地址对象，重点看 `formatted` 字段，它在数据库里根本不存在，是靠 `resolve` 现算出来的：

```js
const AddressType = new GraphQLObjectType({
    name: 'Address',
    fields: {
        street: {
            type: GraphQLString
        },
        number: {
            type: GraphQLInt
        },
        formatted: {
            type: GraphQLString,
            resolve(obj) {
                return obj.number + ' ' + obj.street
            }
        }
    }
});
```

`resolve(obj)` 里的 `obj` 就是上一层传下来的数据对象。这个能力后面会反复用到：**只要一个字段能写 `resolve`，它就可以去查另一张表、调另一个服务，聚合查询就是靠这个实现的。**

剩下几个类型平时用得少一些，但要知道有：

- `Interface`：接口，用于描述多个类型的通用字段
- `Union`：联合类型，用于描述某个字段能够支持的所有返回类型以及具体请求时真正的返回类型
- `Enum`：枚举，用于表示可枚举数据结构的类型（订单状态这种就很适合）
- `InputObject`：输入对象，mutation 参数多的时候用它打包
- `List`：列表

列表是其他类型的封装，通常用于对象字段的描述。像下面 `PersonType` 的 `parents` 和 `children` 字段，装的都是 `PersonType` 自己：

```js
const PersonType = new GraphQLObjectType({
    name: 'Person',
    fields: () => ({
        parents: { type: new GraphQLList(PersonType) },
        children: { type: new GraphQLList(PersonType) },
    })
})
```

注意 `fields` 这里写成了箭头函数而不是对象字面量。这不是风格问题，是必须的：`PersonType` 在定义自己的时候引用了自己，写成对象字面量的话执行到那一行 `PersonType` 还是 `undefined`。用函数包一层就变成了延迟求值，等真正需要 fields 的时候再执行，循环引用就解开了。这个我踩过，报错信息还挺不直观的。

最后是 `Non-Null`，强制类型的值不能为 `null`，并且在请求出错时一定会报错。用在那些绝对不该为空的字段上，比如数据库某一行的 id：

```js
const RowType = new GraphQLObjectType({
    name: 'Row',
    fields: () => ({
        id: {
            type: new GraphQLNonNull(GraphQLString)
        }
    })
})
```

`GraphQLNonNull` 用在 args 上的价值更大。你在 mutation 参数里标了 `new GraphQLNonNull(GraphQLString)`，客户端不传这个参数请求根本进不了 resolve，省掉一堆手写校验。后面 5.6 节讲 mutation 的截图里能直接看到这个效果。

### 2.2 查询语言支持哪几种操作

**GraphQL 规范支持两种操作**

- `query`：仅获取数据（`fetch`）的只读请求
- `mutation`：获取数据后还有写操作的请求

> 新版本的 GraphQL 还支持 `subscription`，这是为了处理订阅更新这种比较复杂的实时数据更新场景而设计的操作

`query` 和 `mutation` 在传输层上没区别，都是 POST 到同一个地址。区别在语义和执行顺序：query 的顶层字段是并行执行的，mutation 的顶层字段是串行执行的，这样你在一次请求里连着写三个 mutation 才能保证顺序。这块规范写得很明确。

![GraphQL 查询语句结构，query 与 mutation 的写法对照](https://s.poetries.top/uploads/2022/07/505bd2a4b2604bcf.png)

## 三、整套 Demo 的架构长什么样

动手之前先把全景摆出来，不然后面代码一多容易迷路。这套 Demo 一共三层，请求的流向是这样的：

```
┌──────────────────────────────────────────────────────────┐
│  Vue 组件（Home.vue / Article.vue / Nav.vue）             │
│  apollo: { navList: gql`{ navList { title } }` }         │
└───────────────────────┬──────────────────────────────────┘
                        │  vue-apollo 把 gql 模板挂成 smart query
                        ▼
┌──────────────────────────────────────────────────────────┐
│  ApolloClient（apollo-boost）                             │
│  InMemoryCache  +  HttpLink(uri: /graphql)                │
└───────────────────────┬──────────────────────────────────┘
                        │  一次 POST，body 里是 query + variables
                        ▼
┌──────────────────────────────────────────────────────────┐
│  Node 服务  Express: app.use('/graphql', graphqlHTTP)     │
│             Koa2  : app.use(mount('/graphql', ...))       │
│             graphiql: true → 浏览器里的调试面板            │
└───────────────────────┬──────────────────────────────────┘
                        │  按查询语句逐字段调用 resolve
                        ▼
┌──────────────────────────────────────────────────────────┐
│  schema/default.js                                        │
│  RootSchema(query) ── navList / articleList / orderList   │
│  MutationSchema  ── addNav / editNav / deleteNav          │
│  字段级 resolve ── cateInfo / orderItems（聚合查询在这）   │
└───────────────────────┬──────────────────────────────────┘
                        │  DB.find / DB.insert / DB.update
                        ▼
┌──────────────────────────────────────────────────────────┐
│  model/db.js（单例封装的 mongodb 驱动）                    │
│  mongodb  库名 graphql / koa-demo                          │
│  集合：nav、articlecate、article、order、order_item        │
└──────────────────────────────────────────────────────────┘
```

有两个地方值得先说一句。

第一，`schema/default.js` 是唯一的真源。前端能查什么、字段是什么类型、参数必不必填，全在这个文件里，改它等于同时改了接口和文档。第二，聚合查询发生在**字段级的 resolve**，不是在根节点。`cateInfo` 写在 `ArticleSchema` 里面，前端不选它就不执行那次数据库查询，这是 GraphQL 省请求的关键。

回到我们要解决的问题，接下来就按这个分层从下往上搭：先造数据，再写 Schema，最后接前端。

## 四、Express 中集成 GraphQL 实现 Server API

### 4.1 Step 1：装 mongodb 造点数据

使用 `mongodb` 做数据库演示。mac 下装 mongodb 用 `brew install mongodb-community`（现在得先 `brew tap mongodb/brew`，Homebrew 官方仓库里已经没有 mongodb 了，具体以 MongoDB 官方安装文档为准）。

数据结构很简单，一个导航表 `nav`，一个文章分类表 `articlecate`：

```bash
# 进入mongo shell
mongo

# 创建数据库
use graphql (graphql数据库不存在会自动创建)

# 创建nav、articlecate集合插入数据
db.nav.insert({title: "标题1", url: "/", sort: 1, status: 1, add_time: "2022-06-30"})
db.nav.insert({title: "标题2", url: "/", sort: 1, status: 1, add_time: "2022-06-30"})
db.nav.insert({title: "标题3", url: "/", sort: 1, status: 1, add_time: "2022-06-30"})

db.articlecate.insert({title: "分类1", description: "描述", keywords: "关键词", status: 1})
db.articlecate.insert({title: "分类2", description: "描述", keywords: "关键词", status: 1})
db.articlecate.insert({title: "分类3", description: "描述", keywords: "关键词", status: 1})
```

这里字段名一定要和下面 Schema 里的字段名对上。**Schema 声明了 `title`，数据里存的却是 `name`，查询不会报错，只会安安静静给你返回一串 `null`。** 我第一次跑就是这样，盯着 GraphiQL 看了半天以为是中间件配错了。

如果懒得一条条插，直接下载现成的数据文件解压导入：

> 下载数据库文件解压并导入mongodb即可 https://blog.poetries.top/db/koa.zip

**导入mongodb数据库**

```
mongorestore -h localhost:27017 -d koa-demo(数据库名称，不存在会自动创建) ./dump(本地数据文件路径)
```

### 4.2 Step 2：Express 接上 express-graphql

Express 这边靠一个中间件就能接管 `/graphql` 这条路由，文档在这：

https://github.com/graphql/express-graphql

```
npm install express-graphql graphql --save
```

装完引入 `express-graphql` 配置中间件就行。注意 `graphql` 这个包是 peer 依赖，版本要和中间件匹配，装错大版本会报一堆 `Cannot use GraphQLSchema from another module` 之类的错。

#### app 完善配置

```js
// app.js
var express=require('express');
var DB=require('./model/db.js');
const graphqlHTTP = require('express-graphql');
const GraphQLDefaultSchema = require('./schema/default.js');

var app=express();

// 配置中间件
app.use('/graphql', graphqlHTTP({
    schema: GraphQLDefaultSchema,
    graphiql: true // 线上环境关闭，开发环境开启
}));

//配置路由
app.get('/',function(req,res){
    res.send('hello express');
})

app.listen(3000,()=>console.log("http://localhost:3000"));
```

整个 app.js 里和 GraphQL 有关的只有 `app.use('/graphql', graphqlHTTP({...}))` 这一句。它做了两件事：把这条路由上的 POST 请求交给 GraphQL 引擎去执行，以及在 `graphiql: true` 时给 GET 请求返回一个调试页面。

**`graphiql` 在生产环境一定要关掉。** 它不只是个好看的编辑器，它背后靠内省查询（introspection）把你的整个 Schema 都暴露出去了，等于把接口文档挂在公网上。这条后面 checklist 里还会再提一次。

补一句时效性：上面写的是 `const graphqlHTTP = require('express-graphql')` 这种默认导出。`express-graphql` 后来的版本改成了具名导出，要写 `const { graphqlHTTP } = require('express-graphql')`，装完发现 `graphqlHTTP is not a function` 就是撞上这个了。具体从哪个版本开始改的，以你装的那版 README 为准。

#### 定义 GraphQLSchema 模型

接下来是核心。新建 `schema/default.js`，这个文件干三件事，我按顺序标在了代码注释里：定义数据类型 → 定义根查询 → 挂到 `GraphQLSchema` 上。

```js
const DB=require('../model/db.js'); /*引入DB库*/

const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema,
    GraphQLList
} =require('graphql')

//1、获取导航列表     定义导航的schema类型
var NavSchema=new GraphQLObjectType({
    name:'nav',
    fields:{
        _id:{
            type:GraphQLString
        },
        title:{
            type:GraphQLString
        },
        url:{
            type:GraphQLString
        },
        sort:{
            type:GraphQLInt
        },
        status:{
            type:GraphQLInt
        },
        add_time:{
            type:GraphQLString
        }
    }
})

var ArticleCateSchema=new GraphQLObjectType({
    name:'articlecate',
    fields:{
        _id:{
            type:GraphQLString
        },
        title:{
            type:GraphQLString
        },
        description:{
            type:GraphQLString
        },
        keywords:{
            type:GraphQLString
        } ,
        status:{
            type:GraphQLInt
        }
    }
})

//2、定义一个跟       根里面定义调用导航Schema类型的方法
var RootSchema=new GraphQLObjectType({
    name:'root',
    fields:{
        oneNavList:{  //方法名称：定义调用导航Schema类型的方法
            type:NavSchema,  //方法的类型, 方法返回的参数必须和NavSchema里面定义的类型一致
            args:{id:{type:GraphQLString}}, //参数
            async resolve(parent,args){  //执行的操作

                // args.id 获取调用方法传入的值
                var id=args.id;

                var navList=await DB.find('nav',{"_id":DB.getObjectId(id)});
                return navList[0];
            }
        },
        navList:{
            type:GraphQLList(NavSchema),
            async resolve(parent,args){
                var navList=await DB.find('nav',{});
                return navList;
            }
        },
        articleCateList:{
            type:GraphQLList(ArticleCateSchema),
            async resolve(parent,args){
                var articlecateList=await DB.find('articlecate',{});
                return articlecateList;
            }
        },
        oneArticleCateList:{
            type:ArticleCateSchema,
            args:{id:{type:GraphQLString}},
            async resolve(parent,args){
                var id=args.id;
                var articlecateList=await DB.find('articlecate',{"_id":DB.getObjectId(id)});
                return articlecateList[0];   //要返回一个json对象
            }
        }
    }

})

//3、把根挂载到 GraphQLSchema
module.exports=new GraphQLSchema({
    query:RootSchema
})
```

这段代码信息量不小，拆开看三块。

`NavSchema` 和 `ArticleCateSchema` 是数据类型，只描述「一条导航长什么样」，跟怎么取数据无关。这里的字段名必须和 mongodb 里存的字段名一一对应，对不上就返回 `null`，前面已经踩过一次了。

`RootSchema` 是查询入口，前端能调用的方法全在它的 `fields` 里。四个方法刚好覆盖了两种典型形态：`navList` / `articleCateList` 不带参数返回列表，用 `GraphQLList(XxxSchema)` 包一层；`oneNavList` / `oneArticleCateList` 通过 `args` 收一个 id 返回单条，类型直接写 `XxxSchema`。

`resolve(parent, args)` 这两个参数是理解 GraphQL 的关键。`args` 是客户端传进来的参数，`parent` 是上一层 resolve 的返回值。在根节点上 `parent` 是 undefined，但在嵌套字段里它就是父对象，聚合查询全靠它，Koa 那一节会大量用到。

**注意 `resolve` 返回单条时必须返回 JSON 对象而不是数组**，所以代码里写的是 `articlecateList[0]`。返回类型声明的是 `ArticleCateSchema` 却给了个数组，GraphQL 会直接把它当成对象去取字段，结果全是 null。

最后 `module.exports = new GraphQLSchema({ query: RootSchema })` 把根挂上去，这个导出的对象就是 app.js 里传给中间件的那个 `schema`。

#### 编写数据库操作方法

Schema 里反复出现的 `DB.find`，是自己封装的一层 mongodb 操作。封装的目的有两个：一是用单例避免每次查询都重连数据库，二是把 `find` 的分页、排序、字段筛选收进一个方法里，Schema 那边就能写得很干净。

```js
/**

 * http://mongodb.github.io/node-mongodb-native

 * http://mongodb.github.io/node-mongodb-native/3.0/api/
 */

//DB库
var MongoDB=require('mongodb');
var MongoClient =MongoDB.MongoClient;
const ObjectID = MongoDB.ObjectID;

var Config= {
    dbUrl: 'mongodb://localhost:27017/',
    dbName: 'graphql' // 数据库名
}

class Db {
    static getInstance(){   /*1、单例  多次实例化实例不共享的问题*/
        if(!Db.instance){
            Db.instance=new Db();
        }
        return  Db.instance;
    }

    constructor(){
        this.dbClient=''; /*属性 放db对象*/
        this.connect();   /*实例化的时候就连接数据库*/

    }
    connect(){  /*连接数据库*/
      let _that=this;
      return new Promise((resolve,reject)=>{
          if(!_that.dbClient){         /*1、解决数据库多次连接的问题*/
              MongoClient.connect(Config.dbUrl,{ useNewUrlParser: true },(err,client)=>{
                  if(err){
                    reject(err)
                  }else{
                    _that.dbClient=client.db(Config.dbName);
                    resolve(_that.dbClient)
                  }
              })
          }else{
            resolve(_that.dbClient);
          }
      })
    }
    /*
     DB.find('user',{})  返回所有数据

     DB.find('user',{},{"title":1})    返回所有数据  只返回一列

     DB.find('user',{},{"title":1},{   返回第二页的数据
        page:2,
        pageSize:20,
        sort:{"add_time":-1}
     })
     js中实参和形参可以不一样      arguments 对象接收实参传过来的数据
    * */
    find(collectionName,json1,json2,json3){
        if(arguments.length==2){
            var attr={};
            var slipNum=0;
            var pageSize=0;
        }else if(arguments.length==3){
            var attr=json2;
            var slipNum=0;
            var pageSize=0;
        }else if(arguments.length==4){
            var attr=json2;
            var page=parseInt(json3.page) ||1;
            var pageSize=parseInt(json3.pageSize)||20;
            var slipNum=(page-1)*pageSize;
            if(json3.sort){
                var sortJson=json3.sort;
            }else{
                var sortJson={}
            }
        }else{
            console.log('传入参数错误')
        }
       return new Promise((resolve,reject)=>{
            this.connect().then((db)=>{
                //var result=db.collection(collectionName).find(json);
                var result =db.collection(collectionName).find(json1,{fields:attr}).skip(slipNum).limit(pageSize).sort(sortJson);
                result.toArray(function(err,docs){
                    if(err){
                        reject(err);
                        return;
                    }
                    resolve(docs);
                })

            })
        })
    }
    update(collectionName,json1,json2){
        return new Promise((resolve,reject)=>{
            this.connect().then((db)=>{
                //db.user.update({},{$set:{}})
                db.collection(collectionName).updateOne(json1,{
                    $set:json2
                },(err,result)=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                })
            })
        })
    }
    insert(collectionName,json){
        return new  Promise((resolve,reject)=>{
            this.connect().then((db)=>{
                db.collection(collectionName).insertOne(json,function(err,result){
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                })
            })
        })
    }
    remove(collectionName,json){
        return new  Promise((resolve,reject)=>{
            this.connect().then((db)=>{
                db.collection(collectionName).removeOne(json,function(err,result){
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                })
            })
        })
    }
    getObjectId(id){  /*mongodb里面查询 _id 把字符串转换成对象*/
        return new ObjectID(id);
    }
    //统计数量的方法
    count(collectionName,json){
        return new  Promise((resolve,reject)=> {
            this.connect().then((db)=> {
                var result = db.collection(collectionName).count(json);
                result.then(function (count) {
                        resolve(count);
                    }
                )
            })
        })
    }
}

module.exports=Db.getInstance();
```

这个封装里有几处值得单独说说。

`getInstance()` 这个静态方法配合 `Db.instance` 做了单例。为什么要单例？因为 `require` 虽然有模块缓存，但一旦有人手写 `new Db()`，连接就又开一条。mongodb 驱动本身是带连接池的，重复建连接除了浪费文件描述符没有任何好处。这块我之前在别的 Node 项目上吃过亏，文件描述符打满以后报的错跟数据库半点关系没有，可以顺手看下我另一篇排查记录 [一次 node 文件操作过多排查总结](https://feinterview.poetries.top/blog/node-fs-youhua)。

`connect()` 里那个 `if (!_that.dbClient)` 判断是第二道保险，解决的是并发调用时重复连接的问题。不过说实话它并不严谨：如果两个查询几乎同时进来，第一个还没 resolve，`dbClient` 还是空的，第二个照样会去连一次。要真做严谨得把整个 Promise 缓存下来，而不是缓存结果。demo 里够用，上生产建议改掉。

`find` 用 `arguments.length` 来区分「只传集合和条件」「加字段筛选」「加分页排序」三种调用方式。这写法今天看有点糙，`var` 在 if 分支里声明也是 ES5 时代的习惯（`var` 有函数级作用域提升，所以分支里声明外面能用，换成 `let` 就直接报未定义了）。现在一般会改成一个 options 对象加解构默认值，可读性好很多，但原逻辑我原样保留，方便你对着老项目看。

再补一句时效性。这段代码是 mongodb Node 驱动 3.x 时代的写法，驱动升到 4.x 之后有几处对不上：`ObjectID` 改叫 `ObjectId`，`find` 的 `fields` 选项换成了 `projection`，回调风格的 API 也在逐步移除，只剩 Promise。另外 `removeOne` 其实不是驱动提供的方法（正确的是 `deleteOne` / `deleteMany`），而 `insertOne` 返回值里的 `ops` 在新版本里也拿不到了。你要在新版本上跑这套代码，这几个地方都得改，具体签名以 MongoDB Node Driver 官方文档为准。

**打开本地调试**

服务起来以后访问 http://localhost:3000/graphql，就能看到 GraphiQL 面板。左边写查询，右边出结果，右上角的 Docs 里是自动生成的接口文档：

![GraphiQL 调试面板，左侧写 query 右侧返回 JSON 结果](https://s.poetries.top/uploads/2022/06/f906b572a508f1bc.png)

到这一步 Express 版就通了。但 Express 这版只做了最基础的查询，真实项目里要的聚合、分页、增删改都还没有，下面换到 Koa2 把它补全。

## 五、Koa2 中集成 GraphQL 实现 Server API

Koa2 和 Express 的差别只在中间件怎么挂，Schema 那部分是完全通用的，毕竟 Schema 是 `graphql` 这个包的东西，跟 Web 框架无关。这一节要把功能做全：**导航列表 API、文章分类 API、文章列表 API、文章详情 API、文章列表分页查询 API，以及文章列表关联文章分类实现的聚合 API。**

数据还是用现成的那份：

> 下载数据库文件解压并导入mongodb即可 https://blog.poetries.top/db/koa.zip

- **导入mongodb数据库** `mongorestore -h localhost:27017 -d koa-demo(数据库名称，不存在会自动创建) ./dump(本地数据文件路径)`
- 导出mongodb数据库 `mongodump -h localhost:27017 -d test(数据库名称) -o ./dump`

顺手记一下：`mongodump` 导出、`mongorestore` 导入，这两条命令在换机器或者给同事同步 demo 数据的时候特别省事，比一条条 insert 快得多。

koa 这边用的中间件文档在这：

> 文档地址 https://github.com/chentsulin/koa-graphql

```
npm install graphql koa-graphql koa-mount --save
```

比 Express 多装了一个 `koa-mount`。原因是 `koa-graphql` 导出的是一个接管整个请求的中间件，直接 `app.use()` 会把所有路由都吃掉，得靠 `koa-mount` 把它限制在 `/graphql` 这个前缀下面。这个坑很典型，漏装 `koa-mount` 的话你会发现首页也返回 GraphQL 的报错。

### 5.1 Step 1：app 完善配置

```js
// app.js

var Koa=require('koa');

var router = require('koa-router')();

const mount = require('koa-mount');

const graphqlHTTP = require('koa-graphql');

var GraphQLDefaultSchema=require('./schema/default.js')


const DB=require('./model/db.js');

var app=new Koa();


//配置中间件
app.use(mount('/graphql', graphqlHTTP({
    schema: GraphQLDefaultSchema,
    graphiql: true
})));


router.get('/',async (ctx)=>{
    ctx.body="首页";
})

router.get('/getNavList',async (ctx)=>{

    var navList=await DB.find('nav',{});
     ctx.body=navList;
})

app.use(router.routes());   /*启动路由*/
app.use(router.allowedMethods());
app.listen(4000, ()=>console.log('http://localhost:4000'));
```

注意这里保留了一个 `/getNavList` 的普通 REST 路由。这不是多余的，实际项目迁移的时候基本都是这个状态：老接口先留着，新页面走 GraphQL，两套并存慢慢换。GraphQL 挂在 `/graphql` 上，跟原有的路由是井水不犯河水的，这也是它比较容易渐进接入的原因。

端口用了 4000，跟 Express 那版的 3000 错开，两个服务可以同时跑着对比。

### 5.2 Step 2：定义 schema 模型

这个文件是本节的重点，它要同时支撑导航、文章分类、文章、订单、订单商品五种数据，以及其中两处聚合查询。先整体过一遍代码，再逐块拆：

```js
// schema/default.js
const DB=require('../model/db.js');

//文章分类api接口     //文章列表api接口 （分页）     //文章详情api接口（api聚合 获取分类信息）

const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLList,
    GraphQLSchema,
    GraphQLID
}=require('graphql')

//1、定义导航的schema
var NavSchema=new GraphQLObjectType({
    name:'nav',
    fields:{
        _id:{
            type:GraphQLString
        },
        title:{
            type:GraphQLString
        },url:{

            type:GraphQLString
        },
        sort:{
            type:GraphQLInt

        },
        status:{
            type:GraphQLString
        },
        add_time:{
            type:GraphQLString
        }
    }
})


//定义文章分类的schema
var ArticleCateSchema=new GraphQLObjectType({
    name:'articlecate',
    fields:{
        _id:{type:GraphQLString},
        title:{type:GraphQLString},
        description:{ type: GraphQLString },
        keywords:{ type: GraphQLString },
        pid:{type:GraphQLInt},
        add_time:{ type: GraphQLString },
        status:{ type: GraphQLInt }
    }
})



//定义文章的schema
var ArticleSchema=new GraphQLObjectType({
    name:'article',
    fields:{
        _id:{type:GraphQLID},
        pid:{type:GraphQLID},
        title:{ type: GraphQLString },
        author:{ type: GraphQLString },
        status:{type:GraphQLInt},
        is_best:{ type: GraphQLInt },
        is_hot:{ type: GraphQLInt },
        is_new:{ type: GraphQLInt },
        keywords:{ type: GraphQLString },
        description:{ type: GraphQLString },
        content:{ type: GraphQLString },
        sort:{ type: GraphQLInt },
        // 聚合查询文章分类信息
        cateInfo:{
            type:ArticleCateSchema,
            async resolve(parent,args){
                // parent.pid 当前新闻的分类id
                console.log(parent);

                var cateResult=await DB.find('articlecate',{"_id":DB.getObjectId(parent.pid)});

                return cateResult[0];

            }

        }
    }
})

//订单商品的Schema  （order_item）
var OrderItem=new GraphQLObjectType({
    name:'orderitem',
    fields:{
        uid:{ type: GraphQLID },
        order_id:  { type: GraphQLID },
        product_title: { type: GraphQLString },
        product_id: { type: GraphQLID },
        product_img: { type: GraphQLString },
        product_price: { type: GraphQLFloat },
        product_num: { type: GraphQLInt },
        add_time: {
          type: GraphQLString
        }
    }
})

//订单的Schema
var OrderSchema=new GraphQLObjectType({
    name:'order',
    fields:{
        _id:{type:GraphQLID},
        uid: { type:GraphQLID},
        all_price: { type: GraphQLInt },
        order_id: { type: GraphQLInt },
        name: { type: GraphQLString },
        phone: { type: GraphQLString },
        address:  { type: GraphQLString },
        zipcode:  { type: GraphQLString },
        pay_status:{ type: GraphQLInt},   // 支付状态： 0 表示未支付     1 已经支付
        pay_type:{type: GraphQLString},      // 支付类型： alipay    wechat
        order_status: {               // 订单状态： 0 已下单  1 已付款  2 已配货  3、发货   4、交易成功   5、退货     6、取消
          type: GraphQLInt
        },
        add_time: {
          type: GraphQLString
        },
        // 聚合查询订单关联的商品列表信息
        orderItems:{
            type:GraphQLList(OrderItem),
            async resolve(parent,args){
                //获取当前订单对应的商品 parent._id就是objectId
                var orderItemList=await DB.find('order_item',{"order_id":parent._id});
                return orderItemList;
            }

        }
    }
})



//2、定义一个根 配置调用Schema的方法
var RootSchema=new GraphQLObjectType({
    name:'root',
    fields:{
        navList:{
            type:GraphQLList(NavSchema),
            async resolve(parent,args){
                var navList=await DB.find('nav',{});
                return navList;
            }
        },
        oneNavList:{
            type:NavSchema,
            args:{
                _id:{
                    type:GraphQLString
                },
                status:{
                    type:GraphQLString
                }
            },
            async resolve(parent,args){

                var oneNavList=await DB.find('nav',{"_id":DB.getObjectId(args._id),"status":args.status});
                return oneNavList[0];

            }
        },
        articleCateList:{
            type:GraphQLList(ArticleCateSchema),
            async resolve(parent,args){

                var articlecateList=await DB.find('articlecate',{});
                return articlecateList;
            }
        },
        articleList:{
            type:GraphQLList(ArticleSchema),
            args:{
                page:{
                    type:GraphQLInt
                },
                pageSize:{
                    type:GraphQLInt
                }
            },
            // 分页查询文章列表
            async resolve(parent,args){
                var page=args.page||1;
                var pageSize=args.pageSize||5;
                console.log(page,pageSize);
                var articleList=await DB.find('article',{},{},{
                    page,
                    pageSize:pageSize,
                    sort:{"add_time":-1}
                 });

                return articleList;
            }
        },
        // 订单列表
        orderList:{
            type:GraphQLList(OrderSchema),
            args:{
                page:{
                    type:GraphQLInt
                }
            },
            async resolve(parent,args){
                var page=args.page || 1;
                var orderList=await DB.find('order',{},{},{
                    page,
                    pageSize:3
                 });
                return orderList;
            }
        },
        // 单个订单信息
        oneOrderList:{
            type:OrderSchema,
            args:{
                _id:{
                    type:GraphQLID
                }
            },
            async resolve(parent,args){
                var orderList=await DB.find('order',{"_id":DB.getObjectId(args._id)});
                return orderList[0];
            }
        }
    }
})

//3、把查询的根 挂载到GraphQLSchema
module.exports=new GraphQLSchema({
    query:RootSchema
})
```

代码有点长，挑三个关键点讲。

第一，`ArticleSchema` 里的 `cateInfo` 字段。它的类型是 `ArticleCateSchema`，而 `article` 这张表里根本没有 `cateInfo` 这列，有的只是一个 `pid`（分类 id）。真正干活的是那个 `resolve(parent, args)`，`parent` 就是当前这篇文章的完整数据，拿 `parent.pid` 去 `articlecate` 表里再查一次，返回的对象就填进了 `cateInfo`。

**这就是聚合查询的全部秘密：把一个「本来不存在的字段」定义成另一个类型，再用 resolve 去补数据。** 前端只要写 `articleList { title cateInfo { title } }`，一次请求就能拿到文章加分类，不用再发第二个请求。

第二，`orderItems` 是同样的套路，只是它返回的是列表，所以类型写 `GraphQLList(OrderItem)`，`resolve` 里用 `parent._id` 去 `order_item` 表里捞。一个订单对多个商品，一对多的关联就这么表达。

这里有个坑要注意，也是 GraphQL 老生常谈的 N+1 问题：你查 20 条订单，`orderItems` 的 resolve 就会跑 20 次，也就是 21 次数据库查询。数据量一上来这就是性能杀手。业界的标准解法是 DataLoader，把同一轮事件循环里的查询合并成一次批量查询。这套 demo 数据量小没做，但真上生产这块躲不掉。

第三，`args` 定义在字段上，`resolve` 里通过 `args.page` 取。像 `articleList` 就收了 `page` 和 `pageSize` 两个参数，并且在 resolve 里给了默认值 `args.page || 1`。为什么不用 `GraphQLNonNull` 强制必传？因为分页参数有合理默认值，强制必传反而让调用方难受。**必填校验交给 Non-Null，可选参数的兜底交给 resolve，这是我自己划的一条线。**

顺带说一句字段类型。`NavSchema` 里 `status` 写的是 `GraphQLString`，`ArticleCateSchema` 里 `status` 写的是 `GraphQLInt`，这种不一致在实际项目里非常常见，根源是数据库里存的类型本身就没统一。GraphQL 在这里是个照妖镜：类型对不上，序列化的时候要么报错要么给你 null，反而逼着你把数据规范掉。

### 5.3 Step 3：编写数据库操作方法

`model/db.js` 和 Express 那版几乎一样，只是库名换成了 `koa-demo`：

```js
// model/db.js
/**

 * http://mongodb.github.io/node-mongodb-native

 * http://mongodb.github.io/node-mongodb-native/3.0/api/
 */

//DB库
var MongoDB=require('mongodb');
var MongoClient =MongoDB.MongoClient;
const ObjectID = MongoDB.ObjectID;

var Config= {
    dbUrl: 'mongodb://localhost:27017',  // 注意 key 要叫 dbUrl，下面 connect 里读的就是 Config.dbUrl
    dbName: 'koa-demo'
}

class Db{
    static getInstance(){   /*1、单例  多次实例化实例不共享的问题*/
        if(!Db.instance){
            Db.instance=new Db();
        }
        return  Db.instance;
    }

    constructor(){
        this.dbClient=''; /*属性 放db对象*/
        this.connect();   /*实例化的时候就连接数据库*/
    }

    connect(){  /*连接数据库*/
      let _that=this;
      return new Promise((resolve,reject)=>{
          if(!_that.dbClient){         /*1、解决数据库多次连接的问题*/
              MongoClient.connect(Config.dbUrl,{ useNewUrlParser: true },(err,client)=>{

                  if(err){
                      reject(err)
                  }else{
                      _that.dbClient=client.db(Config.dbName);
                      resolve(_that.dbClient)
                  }
              })
          }else{
            resolve(_that.dbClient);
          }
      })

    }
    /*

     DB.find('user',{})  返回所有数据


     DB.find('user',{},{"title":1})    返回所有数据  只返回一列


     DB.find('user',{},{"title":1},{   返回第二页的数据
        page:2,
        pageSize:20,
        sort:{"add_time":-1}
     })
     js中实参和形参可以不一样      arguments 对象接收实参传过来的数据
    * */

    find(collectionName,json1,json2,json3){
        if(arguments.length==2){
            var attr={};
            var slipNum=0;
            var pageSize=0;
        }else if(arguments.length==3){
            var attr=json2;
            var slipNum=0;
            var pageSize=0;
        }else if(arguments.length==4){
            var attr=json2;
            var page=parseInt(json3.page) ||1;
            var pageSize=parseInt(json3.pageSize)||20;
            var slipNum=(page-1)*pageSize;

            if(json3.sort){
                var sortJson=json3.sort;
            }else{
                var sortJson={}
            }
        }else{
            console.log('传入参数错误')
        }
       return new Promise((resolve,reject)=>{
            this.connect().then((db)=>{
                //var result=db.collection(collectionName).find(json);
                var result =db.collection(collectionName).find(json1,{fields:attr}).skip(slipNum).limit(pageSize).sort(sortJson);
                result.toArray(function(err,docs){
                    if(err){
                        reject(err);
                        return;
                    }
                    resolve(docs);
                })

            })
        })
    }
    update(collectionName,json1,json2){
        return new Promise((resolve,reject)=>{
                this.connect().then((db)=>{

                    //db.user.update({},{$set:{}})
                    db.collection(collectionName).updateOne(json1,{
                        $set:json2
                    },(err,result)=>{
                        if(err){
                            reject(err);
                        }else{
                            resolve(result);
                        }
                    })

                })

        })

    }
    insert(collectionName,json){
        return new  Promise((resolve,reject)=>{
            this.connect().then((db)=>{

                db.collection(collectionName).insertOne(json,function(err,result){
                    if(err){
                        reject(err);
                    }else{

                        resolve(result);
                    }
                })


            })
        })
    }

    remove(collectionName,json){

        return new  Promise((resolve,reject)=>{
            this.connect().then((db)=>{

                db.collection(collectionName).removeOne(json,function(err,result){
                    if(err){
                        reject(err);
                    }else{

                        resolve(result);
                    }
                })


            })
        })
    }
    getObjectId(id){    /*mongodb里面查询 _id 把字符串转换成对象*/

        return new ObjectID(id);
    }
    //统计数量的方法
    count(collectionName,json){

        return new  Promise((resolve,reject)=> {
            this.connect().then((db)=> {

                var result = db.collection(collectionName).count(json);
                result.then(function (count) {

                        resolve(count);
                    }
                )
            })
        })

    }
}


module.exports=Db.getInstance();
```

**启动服务**

`node app.js` 起来之后打开 http://localhost:4000/graphql，在左边写查询。先来个最简单的导航列表，只要 title：

![Koa 服务启动后 GraphiQL 查询 navList 返回标题列表](https://s.poetries.top/uploads/2022/07/1550d35a92e40d2e.png)

再试试带参数的单条查询，右侧的返回结构和左侧写的查询结构是一一对应的：

![GraphiQL 中带 args 查询单条导航，返回结构与查询结构完全对应](https://s.poetries.top/uploads/2022/07/7c07e1cc36336aa9.png)

顺着上面聊，查询能跑通只是第一步，GraphQL 真正值钱的地方在下面这两节。

### 5.4 聚合查询，一次请求拿到关联数据

**聚合查询文章分类信息，聚合的字段要放在 article 的 schema 里面，这样才能查得到。** 放在根节点上是不行的，因为根节点的 resolve 拿不到「当前这篇文章」的上下文。

先看 Schema 里的定义位置：

![ArticleSchema 内部定义 cateInfo 字段，通过 parent.pid 查询分类表](https://s.poetries.top/uploads/2022/07/3312490f4089a734.png)

聚合查询结果长这样，`cateInfo` 直接嵌在每一条文章里返回：

![GraphiQL 查询 articleList 同时返回嵌套的 cateInfo 分类信息](https://s.poetries.top/uploads/2022/07/ef305f6e77e96b5f.png)

如果换成 RESTful，这个页面得先请求 `/article/list`，拿到一堆 `pid`，再去请求 `/category/list`，前端自己做 map 匹配。GraphQL 把这层拼装挪到了服务端，前端代码能省掉一大截。

订单是同样的思路，一个订单要带出它下面的所有商品，实现类似下面这种效果：

![订单查询返回订单信息并嵌套 orderItems 商品列表](https://s.poetries.top/uploads/2022/07/d4573ffa0133b43f.png)

对应的 Schema 定义：

```js
// schema/default.js
//订单商品的Schema  （order_item）
var OrderItem=new GraphQLObjectType({
    name:'orderitem',
    fields:{
        uid:{ type: GraphQLID },
        order_id:  { type: GraphQLID },
        product_title: { type: GraphQLString },
        product_id: { type: GraphQLID },
        product_img: { type: GraphQLString },
        product_price: { type: GraphQLFloat },
        product_num: { type: GraphQLInt },
        add_time: {
          type: GraphQLString
        }
    }
})

//订单的Schema
var OrderSchema=new GraphQLObjectType({
    name:'order',
    fields:{
        _id:{type:GraphQLID},
        uid: { type:GraphQLID},
        all_price: { type: GraphQLInt },
        order_id: { type: GraphQLInt },
        name: { type: GraphQLString },
        phone: { type: GraphQLString },
        address:  { type: GraphQLString },
        zipcode:  { type: GraphQLString },
        pay_status:{ type: GraphQLInt},   // 支付状态： 0 表示未支付     1 已经支付
        pay_type:{type: GraphQLString},      // 支付类型： alipay    wechat
        order_status: {               // 订单状态： 0 已下单  1 已付款  2 已配货  3、发货   4、交易成功   5、退货     6、取消
          type: GraphQLInt
        },
        add_time: {
          type: GraphQLString
        },
        // 聚合查询订单关联的商品列表信息
        orderItems:{
            type:GraphQLList(OrderItem),
            async resolve(parent,args){
                //获取当前订单对应的商品 parent._id就是objectId
                var orderItemList=await DB.find('order_item',{"order_id":parent._id});
                return orderItemList;
            }

        }
    }
})


// 定义一个根 配置调用Schema的方法
var RootSchema=new GraphQLObjectType({
    name:'root',
    fields:{
        orderList:{
            type:GraphQLList(OrderSchema),
            args:{
                page:{
                    type:GraphQLInt
                }
            },
            async resolve(parent,args){
                var page=args.page || 1;
                var orderList=await DB.find('order',{},{},{
                    page,
                    pageSize:3
                 });
                return orderList;
            }
        },
        oneOrderList:{
            type:OrderSchema,
            args:{
                _id:{
                    type:GraphQLID
                }
            },
            async resolve(parent,args){
                var orderList=await DB.find('order',{"_id":DB.getObjectId(args._id)});
                return orderList[0];
            }
        }
    }
})
```

订单列表带商品一起返回，注意 `orderItems` 里面还能继续选字段，只要 `product_title` 就只回 `product_title`：

![GraphiQL 查询订单列表并展开 orderItems 嵌套商品字段](https://s.poetries.top/uploads/2022/07/7d04081f284a53c4.png)

查询订单详情，把根节点换成 `oneOrderList` 并传 `_id`，聚合逻辑完全复用，一行都不用改：

![GraphiQL 通过 oneOrderList 传入 _id 查询单个订单详情](https://s.poetries.top/uploads/2022/07/eb55ac8b7201d6e9.png)

需要哪些字段就返回哪些字段，而且编辑器会自动提示。这个提示不是编辑器猜的，是 GraphiQL 通过内省查询把你的 Schema 拉下来生成的，所以你 Schema 一改，提示立刻跟着变：

![GraphiQL 编辑器根据 Schema 自动提示可选字段](https://s.poetries.top/uploads/2022/07/f43be591155843e5.png)

说到这个，前面提到的「代码即是文档」在这一刻是最有体感的。后端加了个字段，前端在编辑器里敲两下就发现了，不用等谁去更新 Swagger。

### 5.5 分页查询

列表接口没有分页是不能上线的。GraphQL 这边的分页没有什么魔法，就是把 `page` 和 `pageSize` 声明成 `args`，在 resolve 里透传给数据库的 `skip` / `limit`：

```js
//定义文章分类的schema
var ArticleCateSchema=new GraphQLObjectType({
    name:'articlecate',
    fields:{
        _id:{type:GraphQLString},
        title:{type:GraphQLString},
        description:{ type: GraphQLString },
        keywords:{ type: GraphQLString },
        pid:{type:GraphQLInt},
        add_time:{ type: GraphQLString },
        status:{ type: GraphQLInt }
    }
})



//定义文章的schema
var ArticleSchema=new GraphQLObjectType({
    name:'article',
    fields:{
        _id:{type:GraphQLID},
        pid:{type:GraphQLID},
        title:{ type: GraphQLString },
        author:{ type: GraphQLString },
        status:{type:GraphQLInt},
        is_best:{ type: GraphQLInt },
        is_hot:{ type: GraphQLInt },
        is_new:{ type: GraphQLInt },
        keywords:{ type: GraphQLString },
        description:{ type: GraphQLString },
        content:{ type: GraphQLString },
        sort:{ type: GraphQLInt },
        // 聚合查询文章分类信息
        cateInfo:{
            type:ArticleCateSchema,
            async resolve(parent,args){
                // parent.pid 当前新闻的分类id
                console.log(parent);

                var cateResult=await DB.find('articlecate',{"_id":DB.getObjectId(parent.pid)});

                return cateResult[0];

            }

        }
    }
})


//2、定义一个根 配置调用Schema的方法
var RootSchema=new GraphQLObjectType({
    name:'root',
    fields:{
        articleCateList:{
            type:GraphQLList(ArticleCateSchema),
            async resolve(parent,args){

                var articlecateList=await DB.find('articlecate',{});
                return articlecateList;
            }
        },
        articleList:{
            type:GraphQLList(ArticleSchema),
            args:{
                page:{
                    type:GraphQLInt
                },
                pageSize:{
                    type:GraphQLInt
                }
            },
            // 分页查询文章列表
            async resolve(parent,args){
                var page=args.page||1;
                var pageSize=args.pageSize||5;
                console.log(page,pageSize);
                var articleList=await DB.find('article',{},{},{
                    page,
                    pageSize:pageSize,
                    sort:{"add_time":-1}
                 });

                return articleList;
            }
        },
    }
})
```

`DB.find('article', {}, {}, { page, pageSize, sort })` 这个四参数调用，对应的就是前面 db.js 里 `arguments.length == 4` 那个分支，里面算出 `slipNum = (page - 1) * pageSize` 再交给 `.skip().limit()`。排序传的是 `{"add_time": -1}`，按时间倒序。

这里必须补一个坑：**`skip` + `limit` 这种偏移分页，翻到深页的时候 mongodb 要先扫过前面所有文档才能开始返回，页码越大越慢。** 数据量小的后台管理系统无所谓，但如果是可以无限下拉的信息流，正经做法是游标分页（记住上一页最后一条的 `_id` 或时间戳，下一页查 `{ _id: { $lt: lastId } }`）。GraphQL 社区那套 Relay Connection 规范（`edges` / `cursor` / `pageInfo`）就是干这个的。这套 demo 用的还是页码分页，我在真项目里换过一次游标，改动主要在 Schema 的 args 和前端的 `fetchMore` 逻辑上。

另外你可能注意到 `articleList` 只返回了数组，没返回总数。前端要渲染页码就得再来一个 `articleCount` 字段。更规整的做法是包一层，返回 `{ list: [...], total: 100 }` 这样的结构，Schema 里多定义一个 Object 类型就行。

### 5.6 实现数据增加、修改、删除（mutation）

查询讲完了，写操作要用 `mutation`。它和 `query` 在 Schema 里是平级的两个根，分别挂在 `GraphQLSchema` 的 `query` 和 `mutation` 上：

```js
// schema/default.js
//增加 修改 删除
// 定义根MutationRoot实现增删改
var MutationSchema=new GraphQLObjectType({
    name:"mutation",
    fields:{
        addNav:{
            type:NavSchema,
            args:{
                title: {type: new GraphQLNonNull(GraphQLString)},     //表示title 和 url是必传字段
                url: {type: GraphQLNonNull(GraphQLString)},
                sort: {type: GraphQLInt},
                status: {type: GraphQLString},
                add_time: {type: GraphQLString}
            },
            async resolve(parent, args) {
                var result = await DB.insert('nav', {title:args.title,
                    url:args.url,
                    sort:args.sort,
                    status:args.status,
                    add_time:new Date().getTime()
                });

                console.log(result.ops[0]);

                return result.ops[0];
            }
        },
        editNav:{
            type:NavSchema,
            args:{
                _id:{type: new GraphQLNonNull(GraphQLString)},
                title: {type: new GraphQLNonNull(GraphQLString)},     //表示title 和 url是必传字段
                url: {type: GraphQLNonNull(GraphQLString)},
                sort: {type: GraphQLInt},
                status: {type: GraphQLString},
                add_time: {type: GraphQLString}
            },
            async resolve(parent, args) {
                var result = await DB.update('nav', {"_id":DB.getObjectId(args._id)},{title:args.title,
                    url:args.url,
                    sort:args.sort,
                    status:args.status,
                    add_time:new Date().getTime()
                });

                // console.log(result);
                return {
                    _id:args._id,
                    title:args.title,
                    url:args.url,
                    sort:args.sort,
                    status:args.status,
                    add_time:new Date().getTime()
                }
            }

        }
        ,
        deleteNav:{
            type:NavSchema,
            args:{
                _id:{type: new GraphQLNonNull(GraphQLString)},
            },
            async resolve(parent, args) {

                var oneNavList = await DB.find('nav', { "_id": DB.getObjectId(args._id)});

                var deleteResult = await DB.remove('nav', {"_id":DB.getObjectId(args._id)});

                console.log(deleteResult.result.n);

                if(deleteResult.result.n){
                    return oneNavList[0];
                }else{
                    return {}
                }

            }

        }
    }
})

// 挂载到GraphQLSchema
module.exports=new GraphQLSchema({
    // query:RootSchema,
    mutation:MutationSchema
})
```

几个细节值得停一下。

`addNav` 的 args 里 `title` 和 `url` 用 `new GraphQLNonNull(GraphQLString)` 标成了必填，`sort`、`status` 是可选的。写 mutation 时把必填标准确，能省掉 resolve 里一半的手写判空。

三个方法的返回类型都是 `NavSchema`，也就是说改完之后把这条数据本身返回给客户端。**这是 GraphQL mutation 的惯例，返回被改动的实体，客户端拿到就能直接更新本地缓存，不用再发一次查询。** `editNav` 里因为 `DB.update` 只返回影响行数，所以手动拼了一个对象回去；`deleteNav` 更取巧，先把要删的那条查出来存着，删成功了再把它返回。

还有一处别忽略：最后 `module.exports` 里 `query: RootSchema` 被注释掉了，这是当时为了单独调试 mutation 临时干的。**真跑项目的时候两个都得挂上**，否则前端一查询就报「Schema is not configured for queries」。

- 新增

写一条 mutation，参数直接写在括号里，返回值里选想要的字段：

![GraphiQL 执行 addNav mutation 新增一条导航数据](https://s.poetries.top/uploads/2022/07/52aab4cf8421000b.png)

可以看到必填字段不填会直接提示，请求根本发不出去，这就是 `GraphQLNonNull` 的价值：

![GraphiQL 提示 addNav 缺少必填参数 title](https://s.poetries.top/uploads/2022/07/9d5c6adb31018789.png)

再次查询列表，新数据已经进去了：

![再次查询 navList，可以看到刚新增的导航数据](https://s.poetries.top/uploads/2022/07/a91926ec7799fd92.png)

- 修改

修改要多传一个 `_id`，同样标成了必填：

![GraphiQL 执行 editNav mutation 修改导航数据](https://s.poetries.top/uploads/2022/07/afd87b6526705d2b.png)

- 删除

删除只需要 `_id`，返回的是被删掉的那条记录：

![GraphiQL 执行 deleteNav mutation 删除导航数据](https://s.poetries.top/uploads/2022/07/db769eb8c3a823aa.png)

服务端到这里就齐了：查询、聚合、分页、增删改全通。下面接前端。

## 六、Vue 中使用 GraphQL

服务端接口有了，前端怎么调？直接用 `fetch` 往 `/graphql` POST 一个字符串当然能跑，但那样就白瞎了 GraphQL 的缓存和状态管理能力。Vue 生态里的标准做法是 Apollo Client 加 `vue-apollo`。

### 6.1 简单查询

#### 安装和初始化

1. 找到 Vue 中集成 GraphQL 的文档

- [https://github.com/vuejs/apollo](https://github.com/vuejs/apollo)
- [https://vue-apollo.netlify.app/](https://vue-apollo.netlify.app/)

2. 安装相应的模块

> Apollo Boost 是一种零配置开始使用 ApolloClient 的方式。它包含一些实用的默认值，例如我们推荐的 InMemoryCache 和 HttpLink，它非常适合用于快速启动开发。将它与 vue-apollo 和 graphql 一起安装：

```bash
npm install vue-apollo graphql apollo-boost --save
```

这三个包各管一摊，分清楚了后面配置就不会晕：`apollo-boost` 是打包好默认配置的 Apollo Client，`vue-apollo` 是把 Apollo 接到 Vue 组件选项上的桥，`graphql` 是解析查询语句的底层库。

3. 在 `src/main.js` 中引入 `apollo-boost` 模块并实例化 `ApolloClient`

```js
import ApolloClient from 'apollo-boost'

const apolloClient = new ApolloClient({
    //你需要在这里使用绝对路径
    uri: 'http://118.123.14.36:3002/graphql'
})
```

`uri` 这里必须写绝对路径。另外接口跨域的话服务端要开 CORS，Koa 那边加个 `koa2-cors` 就行，不然浏览器控制台会给你一个跟 GraphQL 毫无关系的跨域报错，排查半天才反应过来。

可以打开 http://118.123.14.36:3002/graphql 在控制台查看查询结果：

![浏览器控制台查看 Apollo 发出的 GraphQL 请求与返回结果](https://s.poetries.top/uploads/2022/07/580837041d7098cc.png)

4. 在 `src/main.js` 配置 `vue-apollo` 插件

```js
import VueApollo from 'vue-apollo'

Vue.use(VueApollo);
```

5. 创建 `Apollo provider`

> Provider 保存了可以在接下来被所有子组件使用的 Apollo 客户端实例

```js
const apolloProvider = new VueApollo({
    defaultClient: apolloClient
})
```

使用 `apolloProvider` 选项将它添加到你的应用程序：

```js
new Vue({
    el:'#app',
    apolloProvider,
    render:h=>h(App)
})
```

注意选项名叫 `defaultClient`，说明 `vue-apollo` 是支持挂多个 client 的。一个项目同时对接两套 GraphQL 服务的时候用得上，平时一个就够。

#### 简单查询

配好之后，组件里用起来非常轻。

> 组件加载的时候就会去服务器请求数据，请求的数据会放在 `navList` 这个属性上面，在模板中可以直接使用当前属性

> [简单查询文档](https://vue-apollo.netlify.app/zh-cn/guide/apollo/queries.html#%E7%AE%80%E5%8D%95%E6%9F%A5%E8%AF%A2)

[带参数查询参考 ](https://vue-apollo.netlify.app/zh-cn/guide/apollo/queries.html#%E5%B8%A6%E5%8F%82%E6%95%B0%E7%9A%84%E6%9F%A5%E8%AF%A2)

组件里多了一个和 `data`、`methods` 平级的 `apollo` 选项，键名就是要挂到组件上的属性名：

```js
import gql from 'graphql-tag';

export default{
    data(){
        return { msg: '我是一个 home 组件' }
    },
    apollo: {
        // 简单的查询，将更新 'hello' 这个 vue 属性
        navList: gql`query {
            navList {
                title
            }
        }`
    },
}
```

`apollo` 下面的键名 `navList` 有两层含义：既是查询里那个根字段的名字，也是数据最终挂到组件上的属性名。所以模板里直接 `v-for` 遍历 `navList` 就行，不用自己写 `created` 里发请求、`then` 里赋值那一套。

`gql` 这个标签模板函数干的事是把字符串解析成 AST 对象，Apollo 需要的是 AST 不是字符串。忘了套 `gql` 直接传字符串，报错信息挺让人摸不着头脑的。

另一种写法是把值写成函数，返回一个配置对象。函数写法的好处是能读到 `this`，参数依赖组件状态的时候必须这么写：

```js
import gql from 'graphql-tag';
export default{
    data(){
        return {
            msg:'我是一个 home 组件'
        }
    },
    // Apollo 具体选项
    apollo: {
        // // 带参数的查询
        // ping: {
        //     // gql 查询
        //     query: gql`query PingMessage($message: String!) {
        //     ping(message: $message)
        //     }`,
        //     // 静态参数
        //     variables: {
        //     message: 'Meow',
        //     },
        // },
    },
    apollo: {
        // 注意方法名称 和 查询的名称对应
        navList(){
            return {
                query:gql`query {
                    navList {
                        title
                     }
                }`
            }
        }
    }
}
```

这段贴的是当时的调试稿，有个地方得提醒一下：**同一个对象里出现了两个 `apollo` 键，后面那个会把前面那个整个覆盖掉**，前面被注释的 `ping` 示例只是留着参考。真写业务代码要把所有查询合并到同一个 `apollo` 对象里，别照抄这个结构。

一个组件里可以同时挂多个查询，`vue-apollo` 会各自独立发请求、独立管理 loading 状态。下面是完整例子，一个组件同时拿导航和文章两份数据：

```html
<template>
  <div class="news">
    <h1>{{ msg }}</h1>
    <ul>
      <li v-for="(item,index) of navList" :key="index">
          {{item.title}}
      </li>
    </ul>
    <br>
    <hr>
    <br>
    <ul>
      <li v-for="(item, index) of articleList" :key="index">
          {{item.title}}---{{item.status}}--{{item._id}}
      </li>
    </ul>
  </div>
</template>

<script>
  import gql from 'graphql-tag';
  export default {
    name: 'app',
    data(){
      return{

        msg:'我是一个首页页面'

      }
    },
    apollo: {
      // 简单的查询，将更新 'hello' 这个 vue 属性
      navList: gql`{
         navList{
            title
          }
      }`,
      articleList:gql`{
         articleList{
            title,
            status,
            _id
          }
      }`
    }

  }
</script>
```


#### 高级查询

上面那种写法有个限制：查询在组件初始化时就发出去了，没法等用户点了按钮再查。要手动控制时机，就得用 `addSmartQuery`。

> [高级查询文档](https://vue-apollo.netlify.app/zh-cn/api/smart-query.html)

模板部分很简单，一个列表加一个触发按钮：

```html
  <div class="news">
    <h1>{{ msg }}</h1>


    <ul>

      <li v-for="(item,key) of articleList" v-bind:key="key">
          {{item.title}}---{{item.status}}
      </li>
    </ul>

    <button @click="getData()">
      点击按钮触发事件请求graphQl接口
    </button>

    {{navList}}

  </div>
```

逻辑部分是重点。`articleList` 走的还是声明式的 `apollo` 选项，但多了 `variables` 用来传分页参数；`navList` 则挪到了 `getData()` 里，点击按钮才通过 `this.$apollo.addSmartQuery` 动态注册：

```js
import gql from 'graphql-tag';

  var navListGql=gql`{
        navList{
            title
        }
   }`;

  export default {
    name: 'app',
    data(){
      return{
        msg:'我是一个新闻页面',
        navList:[]

      }
    },
    apollo:{
      // articleList:gql`{
      //        articleList{
      //         title,
      //         status
      //       }

      // }`
        // 把请求的数据赋值给articleList
        articleList:{
          query:gql`query articleList($page:Int!,$pageSize:Int!){
                articleList(page:$page,pageSize:$pageSize){
                  title,
                  status
                }
          }`,
          variables:{
            page:2,
            pageSize:10
          }
        }
    },
    methods:{
      getData(){
        this.$apollo.addSmartQuery('navList',{
            query:navListGql,
            result(response){
              console.log(response);
            },error(err){
              console.log(err);
            }
        })
      }
    }
  }
```

`addSmartQuery(key, options)` 的第一个参数就是数据要挂到哪个属性上，和声明式写法里的键名是一个意思。`result` 和 `error` 两个回调用来拿原始响应和错误，调试的时候很好使。

**注意 `addSmartQuery` 是「注册」不是「执行一次」。** 同一个 key 重复注册，vue-apollo 会先销毁旧的再建新的，所以点按钮多次也不会叠加出多个订阅。但如果你只是想重新拉一次数据，更合适的是 `this.$apollo.queries.xxx.refetch()`。

#### 传参查询

把变量声明在查询语句里（`query articleList($page: Int!, $pageSize: Int!)`），再通过 `variables` 传值，这是 GraphQL 传参的标准姿势：

```html
<template>
  <div class="article">
    <h1>{{ msg }}</h1>
    <button @click="getData()">获取文章数据</button>
   <ul>
      <li v-for="(item,key) of articleList" v-bind:key="key">
          {{item.title}}
      </li>
    </ul>

  </div>
</template>

<script>
  import gql from 'graphql-tag';

  var articleListGql=gql`query articleList($page:Int!,$pageSize:Int!){
       articleList(page:$page,pageSize:$pageSize){
        title
      }
  }`;
  export default {
    name: 'app',
    data(){
      return{
        msg:'article页面',
        articleList:[]

      }
    },
    methods:{
      getData(){
        this.$apollo.addSmartQuery('articleList',{
          query:articleListGql,
          variables:{
            page:2,
            pageSize:8
          },
          result(response){
            console.log(response)
          },error(err){
            console.log(err)
          }
        })
      }
    }
  }
</script>
```

千万别把参数用字符串拼进查询语句里，一是没有类型校验，二是拼接本身就是注入风险的来源。`$page: Int!` 这个 `!` 就是服务端 `GraphQLNonNull` 在查询语言里的写法，少传一个参数 Apollo 在本地就会拦下来，请求都发不出去。

### 6.2 增加、修改、删除

查询和 mutation 在客户端的差别，是从「声明式挂属性」变成了「命令式调方法」。查询用 `apollo` 选项，写操作用 `this.$apollo.mutate()`，因为写操作必须由用户动作触发，不能组件一加载就跑。

> [详情文档参考](https://vue-apollo.netlify.app/zh-cn/guide/apollo/mutations.html#%E6%9C%8D%E5%8A%A1%E7%AB%AF%E7%A4%BA%E4%BE%8B)

先确认服务端接口已经就绪，在 GraphiQL 里能看到三个 mutation：

![GraphiQL 文档面板中列出 addNav、editNav、deleteNav 三个 mutation 接口](https://s.poetries.top/uploads/2022/07/5a2e957da5d677af.png)

前端这边写一个最朴素的表单，两个输入框加三个按钮：

```html
<template>
  <div class="news">
    <h1>导航的增加修改删除</h1>
    <div class="navForm">

        导航名称：<input v-model="navJson.title" type="text" /> <br><br>
        导航链接： <input v-model="navJson.url" type="text" /><br><br>

        <button @click="doAdd()">提交数据</button>
        <button @click="doEdit()">修改数据</button>
        <button @click="doDele()">删除数据</button>
    </div>


  </div>
</template>

<script>
  import gql from 'graphql-tag';

  var navMutationAddGql=gql`mutation($title:String!,$url:String!){
    addNav(title:$title,url:$url){
      title
    }
  }`;

  var navMutationEditGql=gql`mutation($id:String!,$title:String!,$url:String!){
    editNav(_id:$id,title:$title,url:$url){
      title
    }
  }`;

  var navMutationDelGql=gql`mutation($id:String!){
    deleteNav(_id:$id){
      title
    }
  }`;

  export default {
    name: 'app',
    data(){
      return{
        navJson:{
          title:"",
          url:""
        }
      }
    },
    methods:{
      // 提交表单
      doAdd(){
          // eslint-disable-next-line no-console
          console.log(this.navJson.title);

        this.$apollo.mutate({
            mutation:navMutationAddGql,
            variables: {
            title: this.navJson.title,
            url:this.navJson.url,
            }
        }).then((response)=>{
            console.log(response);
        }).catch((err)=>{
            console.log(err);
        })
      },
      // 修改数据
      doEdit(){
        this.$apollo.mutate({
          mutation:navMutationEditGql,
          variables: {
            id:"62beaf16323cb708d06580ce",
            title: this.navJson.title,
            url:this.navJson.url,
          }
        }).then((response)=>{
          console.log(response);
        }).catch((err)=>{
          console.log(err);
        })
      },
      doDele(){
        this.$apollo.mutate({
          mutation:navMutationDelGql,
          variables: {
            id:"62beaf50323cb708d06580d0",
          }
        }).then((response)=>{
          console.log(response);
        }).catch((err)=>{
          console.log(err);
        })
      }
    }

  }
</script>
```

三个 mutation 语句都提到了组件外面定义成常量，这一步别省。`gql` 每次执行都要解析一遍 AST，放在 methods 里等于每次点击都重新解析，而且 Apollo 内部对相同的 AST 对象还有缓存优化。

`this.$apollo.mutate()` 返回的是 Promise，`then` 里能拿到服务端返回的那条数据。这也是前面说服务端 mutation 要「返回被改动的实体」的原因，前端拿到就能直接更新列表，不用再发一次查询。

这里有个坑要注意：**demo 里 `doEdit` 和 `doDele` 的 id 是写死的**（`62beaf16323cb708d06580ce` 这种），实际项目当然要从列表点击的那一行拿。我贴出来是因为调试的时候就是这么干的，别照抄上生产。

页面跑起来是这样：

![Vue 页面上的导航增删改表单，填入标题和链接](https://s.poetries.top/uploads/2022/07/a68e014f0e3fee3c.png)

提交之后可以看到新增成功的效果，控制台里返回了新建的那条数据：

![控制台打印 addNav mutation 返回结果，新增成功](https://s.poetries.top/uploads/2022/07/990bcf87b1a4293f.png)

还有个细节值得一提：新增成功后列表并不会自动刷新。Apollo 的缓存不知道这次 mutation 影响了哪些查询，得靠 `refetchQueries` 或者 `update` 手动告诉它。这块我当时是直接 `refetch` 了事，正经做法是在 `update` 回调里改缓存，能省一次请求。

### 6.3 上拉分页加载更多

分页在后台管理系统里是页码，在移动端就是上拉加载更多。这一节把服务端的 `page` / `pageSize` 接口接到滚动事件上。

滚动检测用现成的指令库：

```
npm i vue-infinite-scroll -S
```

```js
// main.js配置

//配置上拉分页加载更多
var infiniteScroll =  require('vue-infinite-scroll');
Vue.use(infiniteScroll);
```

装完就有了 `v-infinite-scroll` 指令，配套三个属性：绑定的加载函数、`infinite-scroll-disabled` 控制什么时候停、`infinite-scroll-distance` 控制距底部多远开始触发。

实现有两条路，我都试了，结论写在后面。

#### 方法 1：自己拼接数据

思路最直白：每次请求回来，把新数据 `concat` 到一个专门的数组上，模板遍历这个数组：

```html
<template>
  <div class="article">
    <h1>{{ msg }}</h1>

    <div v-infinite-scroll="loadMore" infinite-scroll-disabled="busy" infinite-scroll-distance="10">
      <ul>
        <li v-for="(item,key) of articleListData" v-bind:key="key">{{item.title}}</li>
      </ul>
    </div>
  </div>
</template>

<script>
import gql from "graphql-tag";

var articleListGql = gql`
  query articleList($page: Int!, $pageSize: Int!) {
    articleList(page: $page, pageSize: $pageSize) {
      title
    }
  }
`;

export default {
  name: "app",
  data() {
    return {
      msg: "上拉分页加载更多",
      articleList: [],
      articleListData: [] /*实际要循环的数据*/,

      page: 1,
      busy: false
    };
  },
  methods: {
    loadMore() {
      this.$apollo.addSmartQuery("articleList", {
        query: articleListGql,

        variables: {
          page: this.page,
          pageSize: 8
        },

        result(response) {
          console.log(response);

          this.articleListData = this.articleListData.concat(
            response.data.articleList
          );

          this.page++;

          // 注意要比较 length，直接拿数组和数字比是永远不成立的
          if (response.data.articleList.length < 8) {
            this.busy = true; //没有数据禁用上拉分页加载更多
          }
        },
        error(err) {
          console.log(err);
        }
      });
    }
  }
};
</script>

<style scoped>
  li {
    line-height: 4;
  }
</style>
```

这段代码里 `articleList` 和 `articleListData` 是两个数组，前者接请求结果，后者才是模板真正遍历的。多维护一个变量是这个方案最别扭的地方。

原代码里的 `if (response.data.articleList < 8)` 我改成了 `.length < 8`。数组直接和数字比较，JS 会先把数组转成字符串再转数字，`["a","b"]` 转出来是 `NaN`，任何比较都是 false，也就是说这个「没有更多数据」的判断从来没生效过，一直会往下滚。这个 bug 挺隐蔽的，因为页面表现上只是多发几个空请求，不报错。

另外 `result(response)` 是个普通函数，里面的 `this` 能不能拿到组件实例，取决于 vue-apollo 的调用方式。写 `result: (response) => {}` 箭头函数在这里反而更稳，因为箭头函数的 `this` 是定义时的词法作用域。这块我当时没细究，能跑就过了。

#### 方法 2：使用 fetchMore 实现分页（推荐）

Apollo 官方给的方案更干净：查询还是声明式挂着，加载更多的时候调 `fetchMore`，在 `updateQuery` 里把新旧数据合并，合并结果直接写回缓存，模板不用感知。

> https://vue-apollo.netlify.app/zh-cn/guide/apollo/pagination.html

```html
<template>
  <div class="article">
    <h1>{{ msg }}</h1>

    <div v-infinite-scroll="loadMore" infinite-scroll-disabled="busy" infinite-scroll-distance="10">
      <ul>
        <li v-for="(item,key) of articleList" v-bind:key="key">{{item.title}}</li>
      </ul>
    </div>
  </div>
</template>

<script>
import gql from "graphql-tag";

var articleListGql = gql`
  query articleList($page: Int!, $pageSize: Int!) {
    articleList(page: $page, pageSize: $pageSize) {
      title
    }
  }
`;

export default {
  name: "app",
  data() {
    return {
      msg: "上拉分页加载更多",
      articleList: [],
      page: 1,
      busy: false
    };
  },
  apollo: {
    articleList() {
      return {
        // GraphQL 查询
        query: articleListGql,
        // 初始变量
        variables: {
          page: this.page,
          pageSize: 5
        }
      };
    }
  },
  methods: {
    loadMore() {
      this.page++;

      this.$apollo.queries.articleList.fetchMore({
        // 新的变量
        variables: {
          page: this.page,
          pageSize: 5
        },
        // 用新数据转换之前的结果
        updateQuery: (previousResult, { fetchMoreResult }) => {
          // eslint-disable-next-line no-console
          console.log(fetchMoreResult);
          return {
            articleList: [
              ...previousResult.articleList,
              ...fetchMoreResult.articleList
            ]
          };
        }
      });
    }
  }
};
</script>

<style scoped>
li {
  line-height: 4;
}
</style>
```

对比一下两种写法的差别，`updateQuery` 拿到 `previousResult` 和 `fetchMoreResult`，返回值必须和查询结构保持一致，也就是外面还得包一层 `{ articleList: [...] }`。返回的形状对不上，Apollo 会直接把缓存写坏，页面变成空白。

**这个方案好在数据只有一份，就在 Apollo 缓存里。** 组件被销毁重建、别的组件也查了同一份数据，缓存都能复用，不像方案一那样每个组件维护一份自己的副本。我自己项目里用的是方案二。

分页效果：

![上拉加载更多的分页效果，滚动到底部自动追加文章列表](https://s.poetries.top/uploads/2022/07/a1ddb2379d5c7287.png)

需要注意的是，`page` 递增放在了 `loadMore` 的第一行，请求失败也会递增，会漏掉一页数据。稳妥点应该放到成功回调里。这块我当时偷懒了，你抄的时候顺手改掉。

完整代码打包在这里，本地跑一遍比看文章有用：

> 项目例子完整代码下载地址 https://blog.poetries.top/assets/graphql-code.zip

## 七、上线前的 checklist

demo 跑通和敢往生产推是两回事。下面这几条是我认为最低限度要确认的，按重要程度排的。

- [ ] **关掉 `graphiql`。** 生产环境把 `graphiql` 设成 false，最好把内省查询（introspection）也一起禁掉，否则整套 Schema 等于公开了
- [ ] **限制查询深度和复杂度。** GraphQL 允许嵌套，恶意用户写一个 `order { orderItems { order { orderItems { ... } } } }` 就能把数据库拖垮。社区有 `graphql-depth-limit` 这类中间件，装一个设个上限
- [ ] **处理 N+1 查询。** 只要 Schema 里有字段级 resolve 去查库，列表一长就是 N+1。上 DataLoader 做批量合并，别等线上慢查询告警才想起来
- [ ] **鉴权放在 context 里。** GraphQL 只有一个入口，不能再靠路由粒度做权限。把用户身份塞进 context，在每个敏感字段的 resolve 里判断
- [ ] **错误信息别直接抛出去。** graphql-js 默认会把 resolve 里抛出的异常连堆栈一起返回，数据库连接串泄露就是这么来的。生产环境要统一格式化错误
- [ ] **分页参数设上限。** `pageSize` 不做限制的话，前端传个 `pageSize: 999999` 就是一次全表扫描
- [ ] **跨域和请求体大小。** GraphQL 查询语句都在 POST body 里，复杂查询体积不小，body-parser 的默认限制可能不够
- [ ] **确认字段类型和数据库实际存储一致。** 前面踩过的 `name` / `title` 对不上、`keywords` 声明 Int 实际存 String，这类问题不报错只返回 null，最难查
- [ ] **监控要按操作名统计。** 所有请求都打在 `/graphql` 一个 URL 上，传统的按路由统计 QPS 和耗时完全失效，得改成按 operationName 打点

最后一条我想单独说：**GraphQL 把复杂度从「接口数量」转移到了「单个接口的运行时行为」上**。REST 时代慢接口一眼就能定位到路由，GraphQL 时代同一个 URL 可能又快又慢，取决于客户端写了什么查询。这个心理准备要提前有。

## 八、文档与代码下载

- 中文文档：http://graphql.cn
- Github: https://github.com/facebook/graphql
- vue-apollo文档：https://vue-apollo.netlify.app/zh-cn/guide/apollo.html
- 数据库文件：https://blog.poetries.top/db/koa.zip
- 完整示例代码：https://blog.poetries.top/assets/graphql-code.zip

关于时效性，这篇写于 2022 年 7 月，有几个依赖后来变化不小，照抄之前先确认一下。

`apollo-boost` 已经不是推荐入口了，Apollo Client 3 把 `InMemoryCache`、`HttpLink` 这些都收进了 `@apollo/client` 一个包里，新项目直接装 `@apollo/client`。`vue-apollo` 本身也分了版本，Vue 2 和 Vue 3 用的不是同一套 API，Vue 3 那套是 Composition API 风格的 `useQuery` / `useMutation`。具体包名和版本对应关系以 vue-apollo 官方文档为准，我这里不瞎报版本号。

Vue 2 已经在 2023 年底停止维护了，新项目没有理由再用 Vue 2。不过这篇里 Schema 的写法、聚合查询的思路、分页的两种做法，跟前端框架没关系，换到 Vue 3 或者 React 都成立，这也是我保留原文写法没重写成 Vue 3 的原因。

服务端这边，`express-graphql` 官方已经不再积极维护，社区现在更多用 `graphql-http`。Apollo Server 也发过大版本，配置方式和这篇里的中间件写法差别不小。如果你是新起项目，建议直接看官方最新文档；如果是维护老项目，这篇的内容还是能对得上的。

Node 服务这块要是想往更规整的方向走，可以看看我另一篇 [Nestjs 学习总结](https://feinterview.poetries.top/blog/nest-summary)，NestJS 有官方的 GraphQL 模块，Schema First 和 Code First 两种模式都支持，比手写 `new GraphQLObjectType` 舒服很多。

## 总结

回过头看，这套东西真正值钱的就三个点。

**Schema 是唯一真源。** 字段有哪些、什么类型、必不必填，全在 `schema/default.js` 里，改它等于同时改了接口、文档和校验规则。前后端撕扯字段的成本从「开个会」降到「看一眼编辑器提示」。

**聚合发生在字段级的 resolve 里。** `cateInfo` 和 `orderItems` 这两个字段是整篇最该记住的写法：定义一个数据库里不存在的字段，用 `parent` 拿到上下文再去查一次。前端不选它就不执行，选了就一次请求拿全。代价是 N+1，上生产得配 DataLoader。

**客户端要的不是「请求库」，是「缓存」。** `vue-apollo` 最大的价值不是帮你发请求，是 `InMemoryCache`。分页那两个方案的差别就在这，方案一自己维护数组，方案二让 Apollo 管缓存，后者在多组件复用数据时省事得多。

至于要不要上 GraphQL，我的判断没变：多端 + 字段差异大 + 页面需要聚合多个资源，中两条以上再考虑。只有一个 Web 端、接口十几个的项目，RESTful 加个 BFF 层就够了，别给自己找活干。

## 参考

- [GraphQL 中文文档](http://graphql.cn)
- [graphql-js 官方文档](https://graphql.org/graphql-js/)
- [express-graphql](https://github.com/graphql/express-graphql)
- [koa-graphql](https://github.com/chentsulin/koa-graphql)
- [vue-apollo 中文文档](https://vue-apollo.netlify.app/zh-cn/guide/apollo.html)
- [MongoDB Node.js Driver 文档](https://www.mongodb.com/docs/drivers/node/current/)
- [前端进阶之旅](https://interview.poetries.top)
