---
title: GraphQL+Koa2实现服务端API结合Apollo+Vue
date: 2022-07-01 20:40:43
tags: 
   - GraphQL
   - Node
categories: Back-end
---

# 一、GraphQL介绍

## 1.1 简介

> GraphQL 是一种新的 API 的查询语言，它提供了一种更高效、强大和灵活 API 查询。它 是由 Facebook 开发和开源，目前由来自世界各地的大公司和个人维护。GraphQL 对你的 API 中的数据提供了一套易于理解的完整描述，使得客户端能够准确地获得它需要的数据，而且 没有任何冗余。它弥补了 RESTful API（字段冗余，扩展性差、无法聚合 api、无法定义数据 类型、网络请求次数多）等不足

**注意**：GraphQL 是 api 的查询语言，而不是数据库。从这个意义上说，它是数据库无关的， 而且可以在使用 API 的任何环境中有效使用，我们可以理解为 GraphQL 是基于 API 之上的一 层封装，目的是为了更好，更灵活的适用于业务的需求变化

**GraphQL 可以用在常见各种服务器端语言以及客户端语言中**

- 服务器端语言：C# / .NET、Clojure、Elixir、Erlang、Go、Groovy、Java、JavaScript、PHP、Python、 Scala、Ruby
- 客户端语言：js、React + React Native、Angular、Vue.js、Apollo Link、Native iOS、Native Android、 Scala.js

- 中文文档：http://graphql.cn
- Github: https://github.com/facebook/graphql

**GraphQL 出现的历史背景**

当提起API设计的时候，大家通常会想到SOAP（一种简单的基于 XML 的协议），RESTful 等设计方式，从 2000 年 RESTful 的理论被提出的时候，在业界引起了很大反响，因为这种 设计理念更易于用户的使用，所以便很快的被大家所接受。

我们知道 REST 是一种从服务 器公开数据的流行方式。**当 REST 的概念被提及出来时**，客户端应用程序对数据的需求相 对简单，**而开发的速度并没有达到今天的水平**。

因此 REST 对于许多应用程序来说是非常 适合的。然而在业务越发复杂，客户对系统的扩展性有了更高的要求时，API 环境发生了巨 大的变，**RESTful 显得心有余而力不足**。比如：字段冗余，扩展性差、无法聚合 api、无法 定义数据类型、网络请求次数多

GraphQL 的出现整好弥补了 RESTful APi 的不足

**使用 GraphQL 的公司**

目前已经有很多的公司在使用 GraphQL（https://graphql.org/users/）

![](https://s.poetries.work/uploads/2022/06/1f26bea368abe7ae.png)

## 1.2 为什么推荐 GraphQL 而不是 RESTful API

在过去的十多年中，REST 已经成为设计 web api 的标准(虽然只是一个模糊的标准)。 

它提供了一些很棒的想法，比如无状态服务器和结构化的资源访问。

然而 REST api 表 现得过于僵化，无法跟上访问它们的客户的快速变化的需求

### RESTful API 不足

- **扩展性（多个终端需要返回不同的字段）**，单个 RESTful 接口返回数据越来越 臃肿。前端对于真正用到的字段是没有直观映像的，仅仅通过 url 地址，无法预测也无 法回忆返回的字段数目和字段是否有效，接口返回 50 个字段，但却只用 5 个字段，造 成字段冗余，扩展性差，单个 RESTful 接口返回数据越来越臃肿
- **API 聚合问题**，某个前端展现，实际需要调用多个独立的 RESTful API 才能获 取到足够的数据，**导致网络请求次数多**
- **前后端字段频繁改动**，导致类型不一致，错误的数据类型可能会导致网站出错 尤其是在业务多变的场景中，很难在保证工程质量的同时快速满足业务需求

### GraphQL 的优点 

- 吸收了 RESTful API 的特性
- **所见即所得** 各种不同的前端框架和平台可以指定自己需要的字段。查询的返回结果就是输 入的查询结构的精确映射

**客户端可以自定义 Api 聚合**

如果设计的数据结构是从属的，直接就能在查询语句中指定;即使数据结构是独 立的，也可以在查询语句中指定上下文，只需要一次网络请求，就能获得资源和子 资源的数据。

**代码即是文档**

GraphQL 会把 schema 定义和相关的注释生成可视化的文档，从而使得代码的变更，直接就反映到最新的文档上，避免 RESTful 中手工维护可能会造成代码、 文档不一致的问题

**参数类型强校验**

- RESTful 方案本身没有对参数的类型做规定，往往都需要自行实现参数的校验机制， 以确保安全。
- 但 GraphQL 提供了强类型的 schema 机制，从而天然确保了参数类型的合法性

# 二、GraphQl类型系统

## 2.1 GraphQl类型

> 可以将GraphQL的类型系统分为`标量类型`（ScalarTypes，标量类型）和其他`高级数据类型`，标量类型即可以表示最细粒度数据结构的数据类型，可以和JavaScript的原始类型对应

**GraphQL规范目前规定支持的标量类型有**

- **Int**：有符号`32`位整数 -- `GraphQLInt`
- **Float**：有符号双精度浮点值 -- `GraphQLFloat`
- **String**：`UTF‐8`字符序列 -- `GraphQLString`
- **Boolean**：`true`或者`false` -- `GraphQLBoolean`
- **ID(GraphQLID)**：ID标量类型表示一个唯一标识符，通常用以重新获取对象或者作为缓存中的键。ID类型使用和String一样的方式序列化；然而将其定义为ID意味着并不需要可读型。

**GraphQL其他高级数据类型包括**

- **Object：对象(newGraphQLObjectType)**

> 用于描述层级或者树形数据结构。对于树形数据结构来说，叶子字段的类型都是标量数据类型。几乎所有GraphQL类型都是对象类型。Object类型有一个name字段，以及一个很重要的fields字段。fields字段可以描述出一个完整的数据结构。例如一个表示地址数据结构的GraphQL对象为

```js
const AddressType=newGraphQLObjectType({
    name:'Address',
    fields:{
        street:{
            type:GraphQLString
        },
        number:{
            type:GraphQLInt
        },
        formatted:{
            type:GraphQLString,
            resolve(obj){
                return obj.number+''+obj.street
            }   
        }
    }
});
```

- `Interface`：接口用于描述多个类型的通用字
- `Union`：联合类型用于描述某个字段能够支持的所有返回类型以及具体请求真正的返回类型
- `Enum`：枚举用于表示可枚举数据结构的类型
- `InputObject`：输入对象
- `List`：列表

> 列表是其他类型的封装，通常用于对象字段的描述。例如下面PersonType类型数据的parents和children字段

```js
const PersonType=newGraphQLObjectType({
    name:'Person',
    fields:()=>({
        parents:{type:newGraphQLList(Person)},
        children:{type:newGraphQLList(Person)},
    })
})
```

- `Non-Null`：不能为`Null`

> `Non-Null`强制类型的值不能为`null`，并且在请求出错时一定会报错。可以用于必须保证值不能为`null`的字段。例如数据库的行的id字段不能为`null`

```js 
const RowType=newGraphQLObjectType({
    name:'Row',
    fields:()=>({
        id:{
            type:newGraphQLNonNull(GraphQLString)
        }
    })
})
```

## 2.2 GraphQl查询语言

**GraphQL规范支持两种操作**

- `query`：仅获取数据（`fetch`）的只读请求
- `mutation`：获取数据后还有写操作的请求

> 新版本的GraphQL还支持`subscription`，这是为了处理订阅更新这种比较复杂的实时数据更新场景而设计的操作

![](https://s.poetries.work/uploads/2022/07/505bd2a4b2604bcf.png)

# 三、Express中集成GraphQl 实现 Server API

## 3.1 安装mongodb造数据

使用`mongodb`做数据库演示，mac安装`mongodb`，`brew install mongodb-community`

```bash
# 进入mongo shell
mongo 

# 创建数据库
use graphql (graphql数据库不存在会自动创建)

# 创建nav、articlecate集合插入数据
db.nav.insert({name: "标题1", url: "/", sort: 1, add_time: "2022-06-30"})
db.nav.insert({name: "标题2", url: "/", sort: 1, add_time: "2022-06-30"})
db.nav.insert({name: "标题3", url: "/", sort: 1, add_time: "2022-06-30"})

db.articlecate.insert({name: "分类1", description: "描述", keywords: "关键词", status: 1})
db.articlecate.insert({name: "分类2", description: "描述", keywords: "关键词", status: 1})
db.articlecate.insert({name: "分类3", description: "描述", keywords: "关键词", status: 1})
```

**或者导入数据库数据**

> 下载数据库文件解压并导入mongodb即可 https://blog.poetries.top/db/koa.zip

**导入mongodb数据库** 

```
mongorestore -h localhost:27017 -d koa-demo(数据库名称，不存在会自动创建) ./dump(本地数据文件路径)
```

## 3.2 express集成GraphQl


https://github.com/graphql/express-graphql

```
npm install express-graphql graphql--save
```

引入express-graphql配置中间件

### app完善配置

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

### 定义GraphQLSchema模型

- 新建`schema/default.js`
- 定义`Schema`

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

### 编写数据库操作方法

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

**打开本地调试**

http://localhost:3000/graphql

![](https://s.poetries.work/uploads/2022/06/f906b572a508f1bc.png)

# 四、Koa中集成GraphQl实现 Server API

> 下载数据库文件解压并导入mongodb即可 https://blog.poetries.top/db/koa.zip

- **导入mongodb数据库** `mongorestore -h localhost:27017 -d koa-demo(数据库名称，不存在会自动创建) ./dump(本地数据文件路径)`
- 导出mongodb数据库 `mongodump -h localhost:27017 -d test(数据库名称) -o ./dump`

> 文档地址 https://github.com/chentsulin/koa-graphql

```
npm install graphql koa-graphql koa-mount --save
```

> 实现导航列表API、文章分类API、文章列表API、文章详情API 、文章列表分页查询API、以及文章列表关联文章分类实现聚合API


## 4.1 app完善配置

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

## 4.2 定义schema模型

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
        keywords:{ type: GraphQLInt },
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

## 4.3 编写数据库操作方法

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
    url: 'mongodb://localhost:27017',
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

![](https://s.poetries.work/uploads/2022/07/1550d35a92e40d2e.png)

![](https://s.poetries.work/uploads/2022/07/7c07e1cc36336aa9.png)

## 4.4 聚合查询

**聚合查询文章分类信息，分类信息的方式要放在article的schema里面，这样才能聚合查询到**

![](https://s.poetries.work/uploads/2022/07/3312490f4089a734.png)

聚合查询结果

![](https://s.poetries.work/uploads/2022/07/ef305f6e77e96b5f.png)

**查询订单，聚合查询订单关联的商品信息返回，实现类似以下效果**

![](https://s.poetries.work/uploads/2022/07/d4573ffa0133b43f.png)


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

![](https://s.poetries.work/uploads/2022/07/7d04081f284a53c4.png)

查询订单详情

![](https://s.poetries.work/uploads/2022/07/eb55ac8b7201d6e9.png)

需要哪些字段，就返回哪些字段，编辑器会自定提示

![](https://s.poetries.work/uploads/2022/07/f43be591155843e5.png)

## 4.5 分页查询

```js
//定义文章分类的schema
var ArticleCateSchema=new GraphQLObjectType({
    name:'articlecate',
    fields:{
        _id:{type:GraphQLString},
        title:{type:GraphQLString},
        description:{ type: GraphQLString },
        keywords:{ type: GraphQLInt },
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

## 4.6 实现数据增加、修改、删除

```js  
// scehma/default.js 
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

- 新增

![](https://s.poetries.work/uploads/2022/07/52aab4cf8421000b.png)

可以看到必填字段不填会提示

![](https://s.poetries.work/uploads/2022/07/9d5c6adb31018789.png)

再次查询列表

![](https://s.poetries.work/uploads/2022/07/a91926ec7799fd92.png)

- 修改

![](https://s.poetries.work/uploads/2022/07/afd87b6526705d2b.png)

- 删除

![](https://s.poetries.work/uploads/2022/07/db769eb8c3a823aa.png)

# 五、Vue中使用GraphQl

## 5.1 使用graphQl简单查询

### 安装

1. 找到Vue中集成GraphQl的文档

- [https://github.com/vuejs/apollo](https://github.com/vuejs/apollo)
- [https://vue-apollo.netlify.app/](https://vue-apollo.netlify.app/)

2. 安装相应的模块

> ApolloBoost是一种零配置开始使用ApolloClient的方式。它包含一些实用的默认值，例如我们推荐的InMemoryCache和HttpLink，它非常适合用于快速启动开发。将它与vue-apollo和graphql一起安装：

```bash
npm install vue-apollo graphql apollo-boost --save
```

3. 在`src/main.js`中引入`apollo-boost`模块并实例化`ApolloClient`

```js
import ApolloClient from'apollo-boost'

const apolloClient = newApolloClient({
    //你需要在这里使用绝对路径
    uri:'http://118.123.14.36:3002/graphql'
})
```

可以打开 http://118.123.14.36:3002/graphql 在控制台查看查询结果

![](https://s.poetries.work/uploads/2022/07/580837041d7098cc.png)

4. 在`src/main.js`配置`vue-apollo`插件

```js
import VueApollofrom'vue-apollo'

Vue.use(VueApollo);
```

5. 创建`Apollo provider`

> Provider保存了可以在接下来被所有子组件使用的Apollo客户端实例

```js 
const apolloProvider = newVueApollo({
    defaultClient:apolloClient
})
```

使用`apollo Provider`选项将它添加到你的应用程序

```js
new Vue({
    el:'#app',
    apolloProvider,
    render:h=>h(App)
})
```

### 简单查询

> 组件加载的时候就会去服务器请求数据，请求的数据会放在`navList`这个属性上面，在模板中可以直接使用当前属性

> [简单查询文档](https://vue-apollo.netlify.app/zh-cn/guide/apollo/queries.html#%E7%AE%80%E5%8D%95%E6%9F%A5%E8%AF%A2)

[带参数查询参考 ](https://vue-apollo.netlify.app/zh-cn/guide/apollo/queries.html#%E5%B8%A6%E5%8F%82%E6%95%B0%E7%9A%84%E6%9F%A5%E8%AF%A2)

```js 
import gql from'graphql-tag';

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

另一种写法：

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

完整例子

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


### 高级查询

> [高级查询文档](https://vue-apollo.netlify.app/zh-cn/api/smart-query.html)

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

逻辑

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

### Vue GraphQl 传参查询

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

## 5.2 使用graphQl增加修改删除

> [详情文档参考](https://vue-apollo.netlify.app/zh-cn/guide/apollo/mutations.html#%E6%9C%8D%E5%8A%A1%E7%AB%AF%E7%A4%BA%E4%BE%8B)

服务器端接口

![](https://s.poetries.work/uploads/2022/07/5a2e957da5d677af.png)

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

![](https://s.poetries.work/uploads/2022/07/a68e014f0e3fee3c.png)

可以看到新增成功效果

![](https://s.poetries.work/uploads/2022/07/990bcf87b1a4293f.png)

## 5.3 上拉分页加载更多

```
npm i vue-infinite-scroll -S
```

```js 
// main.js配置 

//配置上拉分页加载更多
var infiniteScroll =  require('vue-infinite-scroll');
Vue.use(infiniteScroll);
```

### 方法1：数据拼接

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

          if (response.data.articleList < 8) {
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

### 方法2：使用 fetchMore 实现分页（推荐）

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

分页效果 

![](https://s.poetries.work/uploads/2022/07/a1ddb2379d5c7287.png)

> 项目例子完整代码下载地址 https://blog.poetries.top/assets/graphql-code.zip

# 六、文档 

- 中文文档：http://graphql.cn
- Github: https://github.com/facebook/graphql
- vue-apollo文档：https://vue-apollo.netlify.app/zh-cn/guide/apollo.html
