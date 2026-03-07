---
title: 一键更新Hexo到github和coding
date: 2016-07-02 20:48:22
tags: Hexo
categories: Hexo
---

### **一、 _config.yml配置**
<!--more-->
想要同时部署到2个平台，就要修改博客根目录下面的`_config.yml`文件中的deploy如下
根据Hexo官方文档需要修改成下面的形式

```
deploy:
  type: git
  message: [message]
  repo:
    github: <repository url>,[branch]
    gitcafe: <repository url>,[branch]
```



我的配置

```
deploy:
  type: git
  repo: # 同时部署到github和coding
    github: https://github.com/poetries/poetries.github.io.git,master
    coding: git@git.coding.net:poetry/poetry.git,master
    
```

提交采用的SSH密钥，这个方法有个好处，提交的时候不用输入用户名和密码

---

### **二、coding上创建一个新项目**

创建后进入项目的代码模块，获取到这个项目的ssh地址

![此处输入图片的描述][1]


  ---
  
### **三、同步本地hexo到coding上**

把获取到了ssh配置在上面的_config.yml文件中的deploy下，如果是第一次使用coding的话，需要设置SSH公钥，生成的方法可以参考[coding帮助中心][2]

![此处输入图片的描述][3]

本地打开 id_rsa.pub 文件，复制其中全部内容，填写到SSH_RSA公钥key下的一栏，公钥名称可以随意起名字。完成后点击“添加”，然后输入密码或动态码即可添加完成

---

添加后，在`git bash`命令输入：

`ssh -T git@git.coding.net`

如果得到下面提示就表示公钥添加成功了：

`Coding.net Tips : [Hello ! You've conected to Coding.net by SSH successfully! ]`

最后使用部署命令就能把博客同步到coding上面：

`hexo deploy -g`

---

### **四、pages服务方式部署**

部署博客方式有两种，第一种就是pages服务的方式，也推荐这种方式，因为可以绑定域名，而第二种演示的方式必须升级会员才能绑定自定义域名。pages方式也很简单
就是在`source/`需要创建一个空白文件，至于原因，是因为 coding.net需要这个文件来作为以静态文件部署的标志。就是说看到这个`Staticfile`就知道按照静态文件来发布

```
cd source/
touch Staticfile  #名字必须是Staticfile
```

分支选择master，因为前面配置的分支是`master`,因此开启之后，也需要是master。然后看起之后就可访问了。

**注意：**

如果你的项目名称跟你coding的用户名一样，比如我的用户是叫tengj,博客项目名也叫tengj
那直接访问 poetry.coding.me就能访问博客，否则就要带上项目名：poetry.coding.me/项目名 才能访问
推荐项目名跟用户名一样，这样就可以省略项目名了

---

### **五、演示方式部署**

当你把你的静态网站上传到Coding之后，就可以着手部署演示了，Coding的演示平台支持静态网页，所以其实非常简单。在开启演示模式之前，会提醒你没有检测到环境，你直接强制开启就可以了。

![此处输入图片的描述][4]

- 部署版本我没有填，默认是`master`
- 运行环境一定要选择`HTML`
- 自动部署要勾上，为后面配置自动部署做准备
- 访问域名根据你自己喜爱填写，填好要点急后面的确认按钮
- 应用内存也根据自己喜好填写，填好要点急后面的确认按钮

![此处输入图片的描述][5]

以上都配置好了，就可以按下一键部署的按钮了，部署成功后输入地址：poetry.coding.io就能访问

---

### **六、设置自动部署**

如果你是演示方式的话，就需要设置自动部署，这样才能同步新发布的文章

**要配置WebHook才行**

- 找到项目设置那边的`WebHook`,然后点击新建 `Hook`
- 第一个输入框中是填你的博客域名，然后在后面加上 `/_`
- 第二个输入框是输入一个 `token` ，我们直接填写 `{{TOKEN}}`就可以了,TOKEN两边的大括号见的空格记得去掉
- 回到演示里，在左边的栏目中找到环境变量,变量名填写为 `WEBHOOK_TOKEN` ，值为 `{{TOKEN}}` ，接着重新启动应用就 ok 了！

![此处输入图片的描述][6]

![此处输入图片的描述][7]



  [1]: http://upload-images.jianshu.io/upload_images/1637925-3cbdade49c4ed7ba.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
  [2]: https://coding.net/help/doc/git/ssh-key.html
  [3]: http://upload-images.jianshu.io/upload_images/1637925-e9759ccb34032256.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
  [4]: http://upload-images.jianshu.io/upload_images/1637925-665ded40c0fb65bb.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
  [5]: http://upload-images.jianshu.io/upload_images/1637925-dbe1323655714ed7.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
  [6]: http://upload-images.jianshu.io/upload_images/1637925-50b39c29a8ef1785.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
  [7]: http://upload-images.jianshu.io/upload_images/1637925-3e1794da1fa2c9c2.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240