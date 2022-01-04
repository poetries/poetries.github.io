---
title: 教你如何使用vercel服务免费部署前端项目和serverless api
date: 2021-01-04 18:21:43
tags: 
  - vercel
  - 部署
categories: Front-End
---

## 一、介绍一下vercel

> `vercel` 是一个站点托管平台，提供CDN加速，同类的平台有`Netlify` 和 `Github Pages`，相比之下，`vercel` 国内的访问速度更快，并且提供`Production`环境和`development`环境，对于项目开发非常的有用的，并且支持持续集成，一次`push`或者一次`PR`会自动化构建发布，发布在`development`环境，都会生成不一样的链接可供预览。

但是`vercel`只是针对个人用户免费，`teams`是收费的

> 首先`vercel`零配置部署，第二访问速度比`github-page`好很多，并且构建很快，还是免费使用的，对于部署个人前端项目路、接口服务非常方便

- `vercel`类似于`github page`，但远比`github page`强大，速度也快得多得多，而且`将Github授权给vercel`后，可以达到最优雅的发布体验，只需将代码轻轻一推，项目就自动更新部署了。
- `vercel`还支持部署`serverless接口`。那代表着，其不仅仅可以部署静态网站，甚至可以部署动态网站，而这些功能，统统都是免费的
- `vercel`还支持自动配置`https`，不用自己去`FreeSSL`申请证书，更是省去了一大堆证书的配置
- `vercel`目前的部署模板有31种之多

![vercel template](http://img-repo.poetries.top/images/20220104154330.png)

## 二、起步

打开`vercel`主页`https://vercel.com/signup`

![vercel主页](http://img-repo.poetries.top/images/20220104154552.png)

使用`GitHub`账号去关联`vercel`，后续代码提交到`vercel`可以自动触发部署

![GitHub授权给vercel](http://img-repo.poetries.top/images/20220104154810.png)

出现授权页面，点击`Authorize Vercel`。

## 三、部署Hexo博客

> vercel是最好用的静态站点托管平台，借助vercel平台，我们可以把博客静态文件部署到vercel上，不在使用GitHub pages托管，vercel比GitHub pages快多了。

选择一个vercel提供的模板部署，当然你也可以把代码提交到GitHub上，再去vercel选择即可

![](http://img-repo.poetries.top/images/20220104160617.png)

创建一个GitHub项目，代码会自动在GitHub账号上创建

![](http://img-repo.poetries.top/images/20220104160823.png)

创建完成后，等待vercel构建

![](http://img-repo.poetries.top/images/20220104160941.png)

创建成功后自动跳到主页

![](http://img-repo.poetries.top/images/20220104161004.png)
![](http://img-repo.poetries.top/images/20220104161135.png)

点击visit即可访问创建好的服务 https://hexo-seven-blush.vercel.app ，vercel会分配给我们一个默认的域名，当然你也可以自定义修改。

![](http://img-repo.poetries.top/images/20220104161311.png)

我们可以查看打包日志，如果构建过程出现问题，在这里看即可

![](http://img-repo.poetries.top/images/20220104161400.png)

> 点击`view domain` 绑定自定义域名

![](http://img-repo.poetries.top/images/20220104161653.png)

然后我们去域名解析处理解析`CNAME`到`cname.vercel-dns.com`

![](http://img-repo.poetries.top/images/20220104162009.png)

> 最后解析完成，访问`hexo.poetries.com`自定义域名即可。到此我们把博客hexo项目部署到vercel上，后期当你在GitHub提交代码会自动触发vercel打包构建

你也可以从Github选择代码来创建项目

![](http://img-repo.poetries.top/images/20220104162313.png)

导入GitHub账号上的项目

![](http://img-repo.poetries.top/images/20220104162344.png)
![](http://img-repo.poetries.top/images/20220104162448.png)

部署vue、react等前端项目过程也类似，这里不再演示


## 四、部署Serverless Api

> 用`vercel`部署`Serverless Api`，不购买云服务器也能拥有自己的动态网站

简单演示部署api接口服务

![](http://img-repo.poetries.top/images/20220104163025.png)


配置`vercel.json`，更多配置在vercel官网查 `https://vercel.com/docs`

```json
{
  "headers": [{
    "source": "/(.*)",
    "headers" : [
      {
        "key" : "Access-Control-Allow-Origin",
        "value" : "*"
      },
      {
        "key" : "Access-Control-Allow-Headers",
        "value" : "content-type"
      },
      {
        "key" : "Access-Control-Allow-Methods",
        "value" : "DELETE,PUT,POST,GET,OPTIONS"
      }
    ]
  }],
  "rewrites": [
    {
      "source": "/", // 重定向配置 访问/根路径重定向到/api/query-all-users
      "destination": "/api/query-all-users"
    }
  ]
}
```

> 创建接口，`vercel约定在api下创建接口路径`，最后我们可以通过`域名/api/json` `域名/api/query-all-users`来访问接口服务，我们这里创建了两个接口


```js
// api/json.js
// req接收所有请求信息，res 是响应信息
// 通过module.exports暴露出去
module.exports = (req, res) => {
  res.send('test')
}
```

> 我们这里使用腾讯云数据库，把一些数据存到云数据库上

```js
// utils/db.js

// 操作云数据库的包
const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: "填入环境ID", // 在腾讯云后台创建环境ID
  // 访问该链接获取secretId、secretKey填入即可 https://console.cloud.tencent.com/cam/capi
  secretId: "",
  secretKey: ""
});

// 1. 获取数据库引用
module.exports = app.database();
```

> 访问该链接获取secretId、secretKey填入即可 https://console.cloud.tencent.com/cam/capi

![](http://img-repo.poetries.top/images/20220104175640.png)

> 来到腾讯云控制台，创建环境获取环境ID

![](http://img-repo.poetries.top/images/20220104175831.png)

选择`数据库-创建新的集合users`

![](http://img-repo.poetries.top/images/20220104175945.png)

```js
// api/query-all-users.js
// 查询腾讯云数据库用户记录
const db = require('../utils/db')
const _ = db.command

module.exports = async (req, response) => {
  let {name, pwd, size = 50} = req.query
  
  // 更多语法查看腾讯云数据库文档即可 https://cloud.tencent.com/document/product/876/46897
  let { total } = await db.collection("users").count()
  let pickField = {
    '_id': false,
    createAt: true,
    userName: true,
    address: true
  }
  let { data } = await db.collection("users")
  .field(pickField)
  .orderBy('createAt', 'desc')
  .limit(parseInt(size))
  .get()

  response.json({
    total,
    count: data.length,
    list: data
  })
}
```

> 这样我们就写好了两个接口服务，提交代码到GitHub上，然后在vercel上创建项目导入GitHub上的代码部署即可，最后部署的服务通过`https://域名/api/query-all-users?name=小月&size=100`访问即可

> 作者介绍：小月，专注分享前端领域进阶技能与技术干货，更多干货内容请看工宗好「前端进阶之旅」
