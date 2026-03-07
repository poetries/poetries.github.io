---
title: Hexo持续集成自动部署到github
date: 2016-07-03 00:41:12
tags: Hexo
categories: Hexo
---

### **一、 新建新的分支**
---
<!--more-->
`master：`博客的静态文件，也就是hexo生成后的HTML文件，因为要使用Gitpage服务，所以他规定的网页文件必须是在master分支


建新的分支`：dev`：存放博客的源代码


Git怎么推送本地分支到远程新分支上面去？

`git push --force origin local_branch:remote_branch`

这个操作，`local_branch`必须为你本地存在的分支，`remote_branch`为远程分支，如果`remote_branch`不存在则会自动创建分支。

类似，`git push origin :remote_branch，local_branch`留空的话则是删除远程`remote_branch`分支。


**这里是分支常用命令：**
---


- 列出所有本地分支
`$ git branch`

- 列出所有远程分支
`$ git branch -r`

- 列出所有本地分支和远程分支
`$ git branch -a`

- 新建一个分支，但依然停留在当前分支
`$ git branch [branch-name]`

- 新建一个分支，并切换到该分支
`$ git checkout -b [branch]`

- 新建一个分支，指向指定commit
`$ git branch [branch] [commit]`

- 新建一个分支，与指定的远程分支建立追踪关系
`$ git branch --track [branch] [remote-branch]`

- 切换到指定分支，并更新工作区
`$ git checkout [branch-name]

- 切换到上一个分支
`$ git checkout -`

- 建立追踪关系，在现有分支与指定的远程分支之间
`$ git branch --set-upstream [branch] [remote-branch]`

- 合并指定分支到当前分支
`$ git merge [branch]`

- 选择一个commit，合并进当前分支
`$ git cherry-pick [commit]

- 删除分支
`$ git branch -d [branch-name]`

- 删除远程分支
```
$ git push origin --delete [branch-name]
$ git branch -dr [remote/branch]
```


### **二、配置Travis**
---

- 接入Travis CI
 - 打开Travis CI网站，使用github账号登录。
 - 将鼠标放在右上角的用户名上，点击Account选项，会显示github的项目。
 - 找到博客项目，点击前面带有 X 符号的按钮，开启`travis`支持。
![此处输入图片的描述][1]


然后点击设置按钮，在项目的设置中开启Build only if .travis.yml is present这一项.

![此处输入图片的描述][2]

到这一步， 我们已经开启了要构建的仓库

- 在Travis CI配置Github的Access Token

 - 在github上生成Access Token

首先我们来到github的设置界面，点击到`Personal access tokens`页面，点击右上角的`Generate new token`按钮会重新生成一个，点击后他会叫你输入密码，然后来到如下界面，给他去一个名字，下面是勾选一些权限

![此处输入图片的描述][3]
 
 生成完后，你需要拷贝下来,接下来要用到
 
 - 在Travis CI配置

配置界面还是在项目的setting里面，如下图

![此处输入图片的描述][4]

还需要在源代码的仓库里创建一个`.travis.yml`配置文件，放到源代码的根目录，如下图
  
其中内容如下：

```javascript
language: node_js
node_js: stable

# S: Build Lifecycle
install:
  - npm install

#before_script:
 # - npm install -g gulp

script:
  - hexo g

after_script:
  - cd ./public
  - git init
  - git config user.name "lifengsofts"
  - git config user.email "lifengsofts@gmail.com"
  - git add .
  - git commit -m "Update docs"
  - git push --force --quiet "https://${GH_TOKEN}@${GH_REF}" master:master
# E: Build LifeCycle

branches:
  only:
    - blog-source
env:
 global:
   - GH_REF: github.com/lifengsofts/lifengsofts.github.io.git

```


其中给你需要更换的又`git config`后面的配置信息
`GH_REF`的值更改为你的仓库地址

到这一步我们配置已经完成了

### **三、本地操作**
---

- 把远程仓库源码下载下来新建新的分支dev  `git clone  -b dev https://github.com/poetries/poetries.github.io.git `
- 切换到项目根目录下
- 开始写作
- 关联远程仓库 `git remote add origin git@github.com:poetries/poetries.github.io.git`
- 提交本地修改，推送至github仓库。

- `$ git add` .
- `$ git commit -m "test travis"`
- `$ git push origin dev:dev`


以下是自己在Ubuntu下写的一个很简单很简单的脚本，用来方便写作部署博客

- [hexo-write.sh](https://github.com/poetries/poetries.github.io/blob/dev/hexo-write.sh)
- [hexo-deploy.sh](https://github.com/poetries/poetries.github.io/blob/dev/hexo-deploy.sh)


push本地的代码至远程仓库之后，在https://travis-ci.org后台查看相关情况。

下面是成功的结果：

![此处输入图片的描述][5]


**参考：**
---

[使用Travis自动部署Hexo(3)][6]
[使用Travis自动部署Hexo(1)][7]


  [1]: http://upload-images.jianshu.io/upload_images/1152636-241d2155adb0eb9c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
  [2]: http://seayxu.github.io/static/images/hexo-with-travisci-setting.jpg
  [3]: http://upload-images.jianshu.io/upload_images/1152636-a16de8c027bf5091.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
  [4]: http://upload-images.jianshu.io/upload_images/1152636-9ba41b1ba943f624.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
  [5]: http://upload-images.jianshu.io/upload_images/1628444-3fa39b6aab6aefc7.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
  [6]: http://www.jianshu.com/p/fff7b3384f46#
  [7]: http://www.jianshu.com/p/7f05b452fd3a#
