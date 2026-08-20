---
title: 教你如何使用vercel服务免费部署前端项目和serverless api
description: 用 vercel 免费部署 Hexo 博客、Vue/React 前端项目和 serverless api 的完整流程，含 GitHub 授权、模板部署、自定义域名 CNAME 解析、vercel.json 配置与接腾讯云数据库写接口的踩坑记录。
date: 2022-01-04 18:21:43
tags: 
  - vercel
  - 部署
  - Serverless
categories: Front-End
---

我的博客最早挂在 GitHub Pages 上，一直有个毛病，推完代码要等好几分钟才能看到变化，偶尔还会卡在构建那一步不动。后来换到 vercel，push 完基本上一分钟内就能看到新页面，构建日志、预览链接、HTTPS 证书全是现成的，一分钱没花。

更让我意外的是它还能跑接口。不买服务器、不配 nginx、不管进程守护，在项目里建一个 `api` 目录，写个函数导出去，部署完就有一个能对外访问的 HTTPS 接口了。

这篇把这两件事从头到尾走一遍。前半部分是静态站点，包括 GitHub 授权、模板部署 Hexo、绑自定义域名；后半部分是 serverless api，包括 `vercel.json` 怎么配、接口文件放哪、怎么连腾讯云数据库读数据。中间会标出几个当时卡住我的地方。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- vercel 和 GitHub Pages、Netlify 的差别在哪，免费额度的边界是什么
- GitHub 授权给 vercel 之后，push 到不同分支分别会发生什么
- 用官方模板一键部署 Hexo 博客的完整流程
- 自定义域名的 CNAME 解析怎么配，根域名为什么不能直接 CNAME
- 从已有 GitHub 仓库导入 Vue / React 项目的注意事项
- `vercel.json` 里 headers 和 rewrites 各自在解决什么问题
- 在 `api` 目录下写 serverless 接口，并连上腾讯云数据库查数据
- 密钥不能硬编码进仓库，环境变量该怎么配

## 一、先说 vercel 是个什么东西

> `vercel` 是一个站点托管平台，提供CDN加速，同类的平台有`Netlify` 和 `Github Pages`，相比之下，`vercel` 国内的访问速度更快，并且提供`Production`环境和`development`环境，对于项目开发非常的有用的，并且支持持续集成，一次`push`或者一次`PR`会自动化构建发布，发布在`development`环境，都会生成不一样的链接可供预览。

这段里最有价值的是「两套环境」这件事，值得展开讲。

vercel 把部署分成 Production 和 Preview 两类。推到默认分支（一般是 `main` 或 `master`）的代码会发布到 Production，也就是你绑的正式域名；推到其他分支或者开一个 PR，vercel 会自动生成一条独立的 Preview 链接，域名里带上分支名和一段哈希。这条链接是可以直接发给别人看的，改版评审、给产品验收都不用再本地起服务截图了。

这个设计是真的舒服。以前给别人看效果得先合到主干或者本地开个内网穿透，现在 PR 一开链接就有了。

> 但是`vercel`只是针对个人用户免费，`teams`是收费的

免费额度这块得说清楚边界，不然后面容易踩坑。vercel 的免费计划是给个人非商业项目用的，团队协作、商业站点属于付费范畴。另外 serverless 函数的执行时长、内存、每月调用次数都有配额，超了会被限流。具体数值官方调整过好几次，我不写死数字，部署前去控制台的 Usage 页面看当前额度最准。

再看它相对 GitHub Pages 的几个实际优势。

> 首先`vercel`零配置部署，第二访问速度比`github-page`好很多，并且构建很快，还是免费使用的，对于部署个人前端项目路、接口服务非常方便

- `vercel`类似于`github page`，但远比`github page`强大，速度也快得多得多，而且`将Github授权给vercel`后，可以达到最优雅的发布体验，只需将代码轻轻一推，项目就自动更新部署了。
- `vercel`还支持部署`serverless接口`。那代表着，其不仅仅可以部署静态网站，甚至可以部署动态网站，而这些功能，统统都是免费的
- `vercel`还支持自动配置`https`，不用自己去`FreeSSL`申请证书，更是省去了一大堆证书的配置
- `vercel`目前的部署模板有31种之多

关于访问速度我要补一句实话。2022 年写这段的时候国内访问 vercel 默认域名体感是不错的，但这几年线路情况变化挺大，不同地区、不同运营商差异很明显。如果你的站点主要面向国内用户，绑自定义域名之前建议先拿几台不同网络环境的机器实测一下，别直接照搬结论。

HTTPS 证书这条倒是一直很稳。vercel 会给每个部署自动签发并续期证书，绑自定义域名之后也是自动的，不用管到期时间，这件事省下来的心智成本比看上去大。

模板这块，官方提供了一批开箱即用的框架模板。

![vercel 提供的项目模板列表](https://blog.poetries.top/img/static/images/20220104154330.png)

图里能看到 Next.js、Nuxt、Hexo、Gatsby 这些常见框架都在。模板的作用是帮你把构建命令和输出目录预设好，选中之后 vercel 会直接在你的 GitHub 账号下建一个仓库并完成首次部署。模板数量这几年一直在加，你现在打开看到的会比图里多，具体以实际界面为准。

## 二、注册并把 GitHub 授权给 vercel

打开`vercel`主页`https://vercel.com/signup`

这一步是整条流水线的起点，授权之后 vercel 才有权限读你的仓库、监听 push 事件。

![vercel 注册页面](https://blog.poetries.top/img/static/images/20220104154552.png)

注册页会让你选登录方式，GitHub、GitLab、Bitbucket 都行。我建议直接用 GitHub 账号登录，而不是先用邮箱注册再去绑定，后者会多几步。

使用`GitHub`账号去关联`vercel`，后续代码提交到`vercel`可以自动触发部署

![GitHub 授权 vercel 的确认页面](https://blog.poetries.top/img/static/images/20220104154810.png)

出现授权页面，点击`Authorize Vercel`。

授权页会列出 vercel 要的权限，主要是读取仓库内容和创建 webhook。这里有个选项容易被忽略，GitHub 会问你是授权「所有仓库」还是「选中的仓库」。我一般选后者，只勾要部署的那几个。授权范围后面随时能在 GitHub 的 Settings 里改，一开始给小一点没坏处。

授权完成后你会跳回 vercel 的 Dashboard，这时候账号就算准备好了。

## 三、用模板部署 Hexo 博客

> vercel是最好用的静态站点托管平台，借助vercel平台，我们可以把博客静态文件部署到vercel上，不在使用GitHub pages托管，vercel比GitHub pages快多了。

先走模板这条路，因为它一步都不用配，最适合先把整条链路跑通看看效果。

选择一个vercel提供的模板部署，当然你也可以把代码提交到GitHub上，再去vercel选择即可

![在模板列表里选择 Hexo 模板](https://blog.poetries.top/img/static/images/20220104160617.png)

选中 Hexo 模板之后，vercel 会问你要在哪个 Git 账号下创建仓库。这一步不是「把模板部署到 vercel」，而是「把模板代码 fork 一份到你自己的 GitHub，再从那份代码部署」。搞清楚这个顺序后面就不会困惑为什么 GitHub 里凭空多了个仓库。

创建一个GitHub项目，代码会自动在GitHub账号上创建

![填写要创建的 GitHub 仓库名](https://blog.poetries.top/img/static/images/20220104160823.png)

这里填的仓库名会同时成为 vercel 上的项目名，也会影响默认分配的二级域名，随手填一个之后不太好改，稍微想一下再敲。

创建完成后，等待vercel构建

![vercel 正在执行构建流程](https://blog.poetries.top/img/static/images/20220104160941.png)

构建过程中这个页面会实时滚动日志。Hexo 模板的构建大概是拉依赖、跑 `hexo generate`、把 `public` 目录作为静态产物这几步。第一次构建因为没有依赖缓存，会比后续慢一些。

如果这一步卡住或者失败，九成是依赖装不上（网络或者 lockfile 问题），日志里往上翻能看到具体是哪个包。

创建成功后自动跳到主页

![部署成功后的庆祝页面](https://blog.poetries.top/img/static/images/20220104161004.png)
![项目部署成功的概览信息](https://blog.poetries.top/img/static/images/20220104161135.png)

看到这两个页面就说明部署成功了。上面那张是 vercel 的成功动画，下面那张是项目概览，里面能看到本次部署对应的 commit、分支和生成的预览地址。

点击visit即可访问创建好的服务 https://hexo-seven-blush.vercel.app ，vercel会分配给我们一个默认的域名，当然你也可以自定义修改。

![访问 vercel 分配的默认域名看到的博客首页](https://blog.poetries.top/img/static/images/20220104161311.png)

`hexo-seven-blush.vercel.app` 这种域名是 vercel 按「项目名加随机词」的规则分配的，能用但不好记。别急着到处发这个链接，下一节就换成自己的域名。

我们可以查看打包日志，如果构建过程出现问题，在这里看即可

![部署详情页里的完整构建日志](https://blog.poetries.top/img/static/images/20220104161400.png)

这个日志页面在 Deployments 列表里点进任意一次部署都能看到，而且是永久保留的。排查「昨天还好好的今天怎么就崩了」这类问题，把两次部署的日志并排对一下最快。

## 四、绑定自定义域名

> 点击`view domain` 绑定自定义域名

![项目设置里的 Domains 配置入口](https://blog.poetries.top/img/static/images/20220104161653.png)

在项目的 Settings 里找到 Domains，把你的域名填进去。vercel 会立刻检测这个域名当前的解析情况，然后告诉你该加什么记录。

然后我们去域名解析处理解析`CNAME`到`cname.vercel-dns.com`

![在域名服务商处添加 CNAME 解析记录](https://blog.poetries.top/img/static/images/20220104162009.png)

图里是在域名服务商的控制台加一条 CNAME，主机记录填子域名前缀，记录值填 `cname.vercel-dns.com`。

这里有个坑要注意。CNAME 只能用在子域名上，比如 `hexo.poetries.com` 没问题，但根域名 `poetries.com` 按 DNS 规范是不能配 CNAME 的，因为根域名上必须存在 SOA 和 NS 记录，CNAME 和它们互斥。所以绑根域名的时候 vercel 会改让你加一条 A 记录，指向它给出的 IP。这个 IP 以控制台当时显示的为准，别抄别人博客里写死的那个，换过。

另外解析生效需要时间，取决于你之前那条记录的 TTL。刚改完就去访问看到旧内容或者报证书错误是正常的，等一会儿再看，别反复改配置。

> 最后解析完成，访问`hexo.poetries.com`自定义域名即可。到此我们把博客hexo项目部署到vercel上，后期当你在GitHub提交代码会自动触发vercel打包构建

解析生效之后 vercel 会自动为这个域名签发证书，Domains 页面上那个域名旁边会从警告图标变成绿色对勾。看到对勾才算真的完成。

## 五、从已有的 GitHub 仓库导入项目

模板那条路适合从零开始，但大部分时候你手上已经有代码了，走导入更实际。

你也可以从Github选择代码来创建项目

![选择从 Git 仓库导入项目](https://blog.poetries.top/img/static/images/20220104162313.png)

在 Dashboard 点 New Project，vercel 会列出你授权过的仓库。如果这里看不到你想要的仓库，回 GitHub 的应用授权设置里把那个仓库勾上，刷新就出来了，这是最常见的「为什么找不到我的项目」的原因。

导入GitHub账号上的项目

![确认要导入的仓库并进入配置页](https://blog.poetries.top/img/static/images/20220104162344.png)
![配置构建命令、输出目录和环境变量](https://blog.poetries.top/img/static/images/20220104162448.png)

第二张图这一步是导入流程里唯一需要动脑的地方。vercel 会根据仓库里的 `package.json` 猜你用的框架，猜中了构建命令和输出目录都会自动填好，直接点 Deploy 就行。猜不中的话（比如你用了自定义的构建脚本），就要手动指定 Build Command 和 Output Directory。

Vue CLI 项目输出目录是 `dist`，Create React App 是 `build`，Vite 是 `dist`，Next.js 不用填让它自己处理。填错的表现是构建成功但访问 404，因为 vercel 拿着一个空目录当静态根目录在发布。

环境变量也是在这一步配，后面接数据库要用到，这里先记住位置。

部署vue、react等前端项目过程也类似，这里不再演示

## 六、部署 Serverless Api

> 用`vercel`部署`Serverless Api`，不购买云服务器也能拥有自己的动态网站

到这儿静态部分就结束了，下面是我觉得 vercel 最有意思的能力。

简单演示部署api接口服务

![serverless 接口部署后的访问效果](https://blog.poetries.top/img/static/images/20220104163025.png)

vercel 的约定很简单，项目根目录下的 `api` 目录里，每个文件就是一个接口，文件路径直接映射成访问路径。`api/json.js` 对应 `/api/json`，`api/query-all-users.js` 对应 `/api/query-all-users`。不用写路由表，不用起框架。

这些函数跑在 serverless 环境里，也就是说没有请求的时候进程是不存在的，来请求了才拉起来。好处是不花钱、不用管容量；代价是冷启动，长时间没人访问之后的第一个请求会明显慢一点。个人项目和低频接口完全能接受，做在线业务就得掂量了。想深入了解这套模型的话，我之前写过一篇 [Serverless 入门](https://feinterview.poetries.top/blog/serverless-intro) 可以配合看。

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
      "source": "/",
      "destination": "/api/query-all-users"
    }
  ]
}
```

这份配置里两块东西各管一件事，拆开说。

`headers` 那块是在给所有响应加跨域头。`source` 写 `/(.*)` 表示匹配全部路径，三个 header 分别放开了来源、允许的请求头和允许的方法。`Access-Control-Allow-Methods` 里那个 `OPTIONS` 别删，浏览器发非简单请求前会先发一个 OPTIONS 预检，预检被拒的话真正的请求根本发不出去，控制台报的还是跨域错误，很容易让人以为是 `Allow-Origin` 没配对。

`Access-Control-Allow-Origin` 配成 `*` 是图省事，接口涉及用户数据的话应该收窄到具体域名。而且 `*` 和携带 Cookie 的请求是互斥的，前端一旦设了 `withCredentials`，浏览器会直接拒绝 `*` 这个值。

`rewrites` 那块是把根路径改写到接口上，访问 `/` 实际返回的是 `/api/query-all-users` 的内容，浏览器地址栏还是 `/`。这跟 `redirects` 不一样，`redirects` 会真的返回 301/302 让浏览器跳转，地址栏会变。做前端路由 fallback 或者给接口套个好看的路径用 `rewrites`，做域名迁移用 `redirects`。

这里有个必须提醒的点。`vercel.json` 是严格 JSON，不支持 `//` 注释，写了会导致配置解析失败、部署直接报错。原文那份配置在 `rewrites` 里带了行注释，实际用的时候要去掉，上面这份是清理过的版本。

> 创建接口，`vercel约定在api下创建接口路径`，最后我们可以通过`域名/api/json` `域名/api/query-all-users`来访问接口服务，我们这里创建了两个接口

先看最简单的那个，用来确认路由约定生效。

```js
// api/json.js
// req接收所有请求信息，res 是响应信息
// 通过module.exports暴露出去
module.exports = (req, res) => {
  res.send('test')
}
```

`req` 和 `res` 的接口跟 Express 很像，`res.send`、`res.json`、`res.status` 这些都能直接用，但它并不是 Express，是 vercel 自己的 Node.js Runtime 提供的封装。CommonJS 的 `module.exports` 和 ESM 的 `export default` 两种导出方式都认。

部署完访问 `https://你的域名/api/json`，看到 `test` 就说明这条链路通了。先跑通这个再去接数据库，不然出问题的时候你不知道是路由的锅还是数据库的锅。

## 七、接上腾讯云数据库

接口能返回死数据了，下一步是让它返回真数据。

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

这段代码本身没问题，但**密钥绝对不能像这样硬编码后提交进仓库**。GitHub 上有自动扫描，腾讯云的 secretKey 泄漏之后被人拿去开机器挖矿是真实发生过的事。正确做法是在 vercel 项目的 Settings 里配 Environment Variables，代码里读 `process.env`。

```js
const app = cloudbase.init({
  env: process.env.TCB_ENV_ID,
  secretId: process.env.TCB_SECRET_ID,
  secretKey: process.env.TCB_SECRET_KEY
})
```

vercel 的环境变量可以按 Production、Preview、Development 三个环境分别设值，改完之后要重新部署一次才会生效，这点容易忘。

> 访问该链接获取secretId、secretKey填入即可 https://console.cloud.tencent.com/cam/capi

![腾讯云控制台的 API 密钥管理页面](https://blog.poetries.top/img/static/images/20220104175640.png)

这个页面是腾讯云的访问密钥管理。新建密钥的时候 secretKey 只会完整显示一次，关掉就看不到了，当场复制走。另外这里能建的是主账号密钥，权限极大，正经做法是去访问管理里建一个子账号，只授予云开发相关的权限，用子账号的密钥。

> 来到腾讯云控制台，创建环境获取环境ID

![在云开发控制台创建环境并查看环境 ID](https://blog.poetries.top/img/static/images/20220104175831.png)

环境 ID 是一串带随机后缀的字符串，形如 `prod-xxxxxxx`。云开发的资源是按环境隔离的，正式和测试建议各建一个环境，别图省事共用一个然后靠集合名区分。

选择`数据库-创建新的集合users`

![在云开发数据库里创建 users 集合](https://blog.poetries.top/img/static/images/20220104175945.png)

创建集合之后记得看一眼权限设置。云开发的集合默认权限一般是「仅创建者可读写」，从服务端用 SDK 带密钥访问是管理员身份，不受这个限制；但如果你后面想在小程序端直连，就得根据场景调整权限，这块的行为跟你想的可能不一样，改之前先看文档。云开发这套东西我在 [CloudBase 云开发总结](https://feinterview.poetries.top/blog/cloudbase-summary) 里聊得更细。

集合建好了，写查询接口。

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

这段有几个细节值得看。

`pickField` 那个对象是字段投影，`'_id': false` 表示不返回内部 ID，其余几个字段显式设为 `true` 表示只要这几个。云开发的 `field` 方法就是靠这个对象控制返回哪些列的，不加的话整条记录全吐出来，敏感字段容易顺手泄漏。

`limit(parseInt(size))` 这里的 `parseInt` 不能省。`req.query` 拿到的都是字符串，直接传字符串给 `limit` 行为不可控。而且这个 `size` 是从 URL 来的，属于外部输入，真要上生产的话还得夹一层上下界，比如 `Math.min(Math.max(parseInt(size) || 20, 1), 100)`，不然有人传个 `size=999999` 你的函数就超时了。

还有个小问题，函数签名里解构出了 `name` 和 `pwd` 但下面完全没用到，这是原文遗留的调试代码。真要做条件查询的话，`db.command` 那个 `_` 就是用来构造查询条件的，比如 `where({ userName: _.eq(name) })`。

> 这样我们就写好了两个接口服务，提交代码到GitHub上，然后在vercel上创建项目导入GitHub上的代码部署即可，最后部署的服务通过`https://域名/api/query-all-users?name=小月&size=100`访问即可

## 八、关于界面变化的一点说明

这篇写于 2022 年初，vercel 的控制台这几年调整过好几轮，Dashboard 的布局、Domains 的入口位置、环境变量的配置页面都跟图里不完全一样了。文中的操作顺序和背后的原理没变，按「新建项目、选来源、配构建、绑域名」这个逻辑走就行，具体按钮位置以你打开时的实际界面为准。

腾讯云那边同理，云开发控制台改过版，密钥管理和环境管理的入口都挪过位置。

另外有两个能力是当年这篇没写的，现在做类似的事可以直接考虑。一个是 Edge Functions，跑在离用户更近的边缘节点上，冷启动比常规 serverless 函数快很多，适合做重定向、A/B 分流这类轻量逻辑。另一个是 vercel 自己的存储产品，省得再去接第三方数据库。这两块我只在小 demo 上试过，没有在正经项目上长期跑过，就不展开写了。

## 总结

vercel 对个人项目来说是性价比很高的一套东西。静态站点这块，授权 GitHub 之后整个流程基本没有配置成本，push 就发布，PR 自带预览链接，HTTPS 全自动，比自己折腾服务器加 nginx 省太多事。

真正需要留神的是这么几处。绑域名的时候子域名用 CNAME 指 `cname.vercel-dns.com`，根域名不能 CNAME，得按控制台给的 A 记录来。导入已有项目时构建产物目录一定要填对，Vue CLI 是 `dist`，CRA 是 `build`，填错的表现是构建绿了但页面 404。`vercel.json` 是严格 JSON，别写注释。

serverless 那部分，`api` 目录的文件路径就是接口路径，这个约定省掉了整个路由层。跨域头在 `vercel.json` 里统一配，记得把 `OPTIONS` 加进 `Allow-Methods`。密钥一律走环境变量，硬编码提交进仓库这件事没有任何借口，改完环境变量记得重新部署一次才生效。

免费额度是有边界的，商业项目和团队协作要走付费计划，函数的执行时长和调用次数也有配额。个人博客、工具站、低频接口这些场景，免费版够用很久了。

## 参考

- [Vercel 官方文档](https://vercel.com/docs)
- [vercel.json 配置参考](https://vercel.com/docs/projects/project-configuration)
- [Vercel Functions 文档](https://vercel.com/docs/functions)
- [Vercel 自定义域名配置](https://vercel.com/docs/domains/working-with-domains)
- [腾讯云 CloudBase Node SDK 文档](https://docs.cloudbase.net/api-reference/server/node-sdk/introduction)
- [腾讯云数据库查询语法](https://cloud.tencent.com/document/product/876/46897)
- [MDN 跨源资源共享 CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [前端进阶之旅](https://interview.poetries.top)
