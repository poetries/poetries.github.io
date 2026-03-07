---
title: Hexo+GitHub搭建免费博客
date: 2016-03-14 19:33:57
tags:  Hexo
categories: Hexo
---

### 第一部分 基本介绍
---
<!--more-->
一直想自己搭建一个博客,断断续续,折折腾腾了两天多的多时间,终于算是搭建完毕了.

为什么要搭建博客呢?

 - 想有个属于自己的博客空间
 - 世面上的平台不够好看 
 - 佩服那些有博客的人,所以自己也想搞一个
 - 独立的才是自己的。
 - 但是不懂服务器,没有空间,不懂前端怎么破?

**小白进入门槛**
1、非常折腾，需要耐心；
2、也需要一定的学习能力和钻研精神；
3、懂一些网页基础知识

本博客是利用 Hexo +Github搭建,主题是 [Next][1] ,感觉不错,不需要什么上面所说的知识,也能搭建成功,方便也美观

**为什么选择GitHub Pages？**
---

很多人用wordpress，你为什么要用github pages来搭建？

 - github pages有300M免费空间，资料自己管理，保存可靠；
 - 学着用github，享受github的便利，上面有很多大牛，眼界会开阔很多；
 - 顺便看看github工作原理，最好的团队协作流程；
 - github是趋势；
 - 就算github被墙了，我可以搬到国内的gitcafe中去。


**搭建需要懂得github基本操作**

**不会GitHub的参考如下文章：**

 - [使用Github Pages建独立博客][2]
 - [GitHub的简单使用][3]
 - [史上最全github使用方法：github入门到精通][4]
 - [github搭建动态网站][5]


### 第二部分 Hexo+GitHub搭建博客
---

**环境准备**

 - [安装Node][6]
到Node.js官网下载相应平台的最新版本，一路安装即可

 - [安装Git][7]

 - GitHub

  - 首先注册一个『GitHub』帐号，已有的默认默认请忽略
  - 建立与你用户名对应的仓库，仓库名必须为『your_user_name.github.com』
  - 添加SSH公钥到『Account settings -> SSH Keys -> Add SSH Key』
 
- 首先设置你的用户名密码：
    `git config --global user.email "4353@qq.com"`
    `git config --global user.name "653b"`

- 生成密钥：
    `ssh-keygen -t rsa -C "faa@qq.com"`

  最后可以验证一下`：ssh -T git@github.com`
 

- **安装**

Node和Git都安装好后，可执行如下命令安装hexo：

`npm install -g hexo`

- **初始化**

执行init命令初始化hexo到你指定的目录：
`hexo init <folder>` 也可以cd到目标目录，执行hexo init。

至此，全部安装工作已经完成！

- **生成静态页面**

cd 到你的init目录，执行如下命令
`hexo generate`

- **本地启动**

执行如下命令，启动本地服务，进行文章预览调试

`hexo server`
浏览器输入http://localhost:4000就可以看到效果

---

- **写文章**

执行new命令，生成指定名称的文章至hexo\source\_posts\postName.md

`hexo new [layout] "postName" #新建文章`

    其中layout是可选参数，默认值为post。有哪些layout呢，请到scaffolds目录下查看，这些文件名称就是layout名称。当然你可以添加自己的layout，方法就是添加一个文件即可，同时你也可以编辑现有的layout，比如post的layout默认是hexo\scaffolds\post.md
    
```css
title: { { title } }
date: { { date } }
tags:
```

想添加categories，以免每次手工输入，只需要修改这个文件添加一行，如下：

```css
title: { { title } }
date: { { date } }
categories: 
tags: 
---
```

接下来，你就可以用喜爱的编辑器尽情书写你的文章


**实现[fancybox][8]效果**

只需要在你的文章*.md文件的头上添加photos项即可，然后一行行添加你要展示的照片：

```
layout: photo
title: 我的阅历
date: 2085-01-16 07:33:44
tags: [hexo]
photos:
- http://bruce.u.qiniudn.com/2013/11/27/reading/photos-0.jpg
- http://bruce.u.qiniudn.com/2013/11/27/reading/photos-1.jpg
```

不想每次都手动添加怎么办？同样的，打开您的`hexo\scaffolds\photo.md`

```
>layout: { { layout } }
title: { { title } }
date: { { date } }
tags: 
photos: 
```

然后每次可以执行带layout的new命令生成照片文章：

`hexo new photo "photoPostName" #新建照片文章`


- **主题安装**
---

hexo的主题列表[Hexo Themes][9]。
比较喜欢[pacman][10]，[modernist][11]、next。Pacman最为优秀，简洁大方小清新，同时移动版本支持的也很好


安装主题的方法就是一句git命令：

```
git clone https://github.com/heroicyang/hexo-theme-modernist.git themes/modernist
```
安装完成后，打开`hexo\_config.yml`，修改主题为`modernist`

打开`hexo\themes\modernist`目录，编辑主题配置文件`_config.yml：`


- **更新主题**


`cd themes/modernist`
`git pull`


**hexo命令行使用**
---

常用命令：

 - `hexo help` #查看帮助
 - `hexo init` #初始化一个目录
 - `hexo new "postName"` #新建文章
 - `hexo new page "pageName"` #新建页面
 - `hexo generate` #生成网页，可以在 public 目录查看整个网站的文件
 - `hexo server` #本地预览，'Ctrl+C'关闭
 - `hexo deploy` #部署.deploy目录
 - `hexo clean` #清除缓存，**强烈建议每次执行命令前先清理缓存，每次部署前先删除 .deploy 

**简写：**

 - `hexo n` == h`exo new`
 - `hexo g` == `hexo generate`
 - `hexo s` == `hexo server`
 - `hexo d` == `hexo deploy`


### 第三方服务
---

- [为NexT主题添加文章阅读量统计功能][12]
- [为hexo添加多说评论][13]
- [教你用swiftype为Hexo添加站内搜索][14]


- **图床**

1.墙裂推荐七牛云储存,注册地址。
2.七牛云储存提供10G的免费空间,以及每月10G的流量.存放个人博客图片最好不过了
具体使用见使用七牛作为github博客的图床

 - **域名**

- 将独立域名与GitHub Pages的空间绑定
- 方法一：在站点source目录下面，新建一个名为CNAME的文本文件，里面写入你要绑定的域名，比如wuxiaolong.me
- 方法二：在Repository的根目录下面，新建一个名为CNAME的文本文件，里面写入你要绑定的域名，比如wuxiaolong.us


- **DNS设置**
用DNSpod，快，免费，稳定。
注册DNSpod，添加域名，如下图设置。


其中A的两条记录指向的ip地址是github Pages的提供的ip
如何知道你的github上项目的IP

去Godaddy修改DNS地址
更改godaddy的Nameservers为DNSpod的NameServers。


### 至此，基本操作介绍完毕，以下内容普通用户无需了解
---

- 目录介绍

默认目录结构：

```
├── .deploy
├── public
├── scaffolds
├── scripts
├── source
|   ├── _drafts
|   └── _posts
├── themes
├── _config.yml
└── package.json
```

- .deploy：执行hexo deploy命令部署到GitHub上的内容目录
- public：执行hexo generate命令，输出的静态网页内容目录
- scaffolds：layout模板文件目录，其中的md文件可以添加编辑
- scripts：扩展脚本目录，这里可以自定义一些javascript脚本
- source：文章源码目录，该目录下的markdown和html文件均会被hexo处理。该页面对应repo的根目录，404文件、favicon.ico文件，CNAME文件等都应该放这里，该目录下可新建页面目录。
 - _drafts：草稿文章
 - _posts：发布文章
- themes：主题文件目录
- _config.yml：全局配置文件，大多数的设置都在这里
- package.json：应用程序数据，指明hexo的版本等信息，类似于一般软件中的关于按钮


- **修改局部页面**
---

页面展现的全部逻辑都在每个主题中控制，源代码在hexo\themes\你使用的主题\中，以modernist主题为例：

```
├── languages          #多语言
|   ├── default.yml    #默认语言
|   └── zh-CN.yml      #中文语言
├── layout             #布局，根目录下的*.ejs文件是对主页，分页，存档等的控制
|   ├── _partial       #局部的布局，此目录下的*.ejs是对头尾等局部的控制
|   └── _widget        #小挂件的布局，页面下方小挂件的控制
├── source             #源码
|   ├── css            #css源码 
|   |   ├── _base      #*.styl基础css
|   |   ├── _partial   #*.styl局部css
|   |   ├── fonts      #字体
|   |   ├── images     #图片
|   |   └── style.styl #*.styl引入需要的css源码
|   ├── fancybox       #fancybox效果源码
|   └── js             #javascript源代码
├── _config.yml        #主题配置文件
└── README.md          #用GitHub的都知道
```

- **插件**
---

 - 安装插件：`npm install <plugin-name> --save`
 - 启用插件：在*hexo\_config.yml文件添加：
 - plugins: `- <plugin-name>  #插件名`
 - 升级插件： `npm update`
 - 卸载插件：`npm uninstall <plugin-name>`


- **迁移**
hexo支持从其他类型站点迁移，如通用RSS，Jekyll，Octopress，WordPress等。请参考官方文档[Hexo Migration][18]。


- **更新**
 - 更新hexo：`npm update -g hexo`
 - 更新主题：`cd themes/你的主题 git pull`


- **换机器写博客**
---

保留好自己的博客源码。换机器写博客，就只能使用各种网盘的同步功能，或者你把你的站点源文件提交到某代码托管服务器。另外，貌似这篇很牛逼，[Hexo 服务器端布署及 Dropbox 同步][19]。

办法是这样的，先在一个目录下做好`Node+Git+Hexo`的绿色环境，写个`hexos.bat`可以一键启动hexo工作台，把整个目录用`Dropbox同步`，这样随便在办公室或家的任何笔记本台式机都可以写博客，也不用处理什么文件拷贝备份的事情



### 问题详解
---
 - [hexo 部署至Git遇到的坑][20]
 - [Hexo常见问题解决方案][21]

## 总结
---

 - 对于一个不懂什么服务器,什么前端的人来说,Hexo+Github给搭建个人博客带来了很大的便利.
 - 搭建博客不是心血来潮,也并不是一帆风顺的,所以需要耐心,折腾得起才行.
 - 很多教程已经过时,多看官方文档.
 - 搭建博客并不是必须,写笔记文章找个平台也是可以的.
 - 搭建博客才是第一步,坚持写好文章才是关键,路还很长.


** 参考：**
---

 - [Hexo官网][22]
 - [Hexo + GitHub 博客搭建之旅][23]
 - [配置 - Hexo 中文版 - 极客学院Wiki][24]
 - [零基础免费搭建个人博客-hexo+github][25]
 - [5 分钟快速安装Next主题][26]
 - [Themes · hexojs/hexo Wiki][27]
 - [Hexo 主题开发指南](https://gold.xitu.io/entry/576d662b0a2b580058f9c5d5)

 


  [1]: http://notes.iissnan.com/
  [2]: http://beiyuu.com/github-pages/
  [3]: http://jingyan.baidu.com/article/b907e627aadbb246e7891cf1.html
  [4]: http://blog.csdn.net/hcbbt/article/details/11651229/
  [5]: http://qun.jikexueyuan.com/web/topic/290
  [6]: http://nodejs.org/
  [7]: http://code.google.com/p/msysgit
  [8]: http://bruce-sha.github.io/reading/
  [9]: http://github.com/tommy351/hexo/wiki/Themes
  [10]: http://github.com/A-limon/pacman
  [11]: http://github.com/heroicyang/hexo-theme-modernist
  [12]: http://www.tuicool.com/articles/YB3EJnz
  [13]: http://blog.xiazhiri.com/hexo-add-duoshuo.html
  [14]: http://jingyan.baidu.com/article/9158e0003500a1a254122836.html
  [15]: http://mmsns.qpic.cn/mmsns/Xt8SNz7AwrAMbI125Vzd3NuZMrw4QWgMAPao3pSL7sXV6usiblN3pmA/0?wx_lazy=1
  [16]: http://mmsns.qpic.cn/mmsns/Xt8SNz7AwrAMbI125Vzd3NuZMrw4QWgM6f4w4NQBwiak30cNFupwljA/0?wx_lazy=1
  [17]: http://mmsns.qpic.cn/mmsns/Xt8SNz7AwrAMbI125Vzd3NuZMrw4QWgMiaaN9oclT3yvpl3b0ahSB9w/0?wx_lazy=1
  [18]: http://zespia.tw/hexo/docs/migration.html
  [19]: http://lucifr.com/2013/06/02/hexo-on-cloud-with-dropbox-and-vps/
  [20]: http://www.jianshu.com/p/67c57c70f275
  [21]: http://wp.huangshiyang.com/hexo%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88
  [22]: https://hexo.io/
  [23]: http://www.tuicool.com/articles/3mMV3iu
  [24]: http://wiki.jikexueyuan.com/project/hexo-document/configuration.html
  [25]: http://blog.csdn.net/jzooo/article/details/46781805
  [26]: http://theme-next.iissnan.com/five-minutes-setup.html
  [27]: https://github.com/hexojs/hexo/wiki/themes