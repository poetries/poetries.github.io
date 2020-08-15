---
title: 使用Fiddler做抓包分析
date: 2017-11-04 14:09:43
tags: 
 - 调试
 - Fiddler
categories: Tools
---


一、Fiddler简介
---

> `Fiddler`是位于客户端和服务器端的`HTTP`代理，也是目前最常用的`http`抓包工具之一 。 它能够记录客户端和服务器之间的所有 `HTTP`请求，可以针对特定的`HTTP`请求，分析请求数据、设置断点、调试`web`应用、修改请求的数据，甚至可以修改服务器返回的数据，功能非常强大，是`web`调试的利器

- 客户端的所有请求都要先经过`Fiddler`，然后转发到相应的服务器，反之，服务器端的所有响应，也都会先经过`Fiddler`然后发送到客户端
- 使用了`Fiddler`之后，web客户端和服务器的请求如下所示

![](https://poetries1.gitee.io/img-repo/2019/10/187.png)
![](https://poetries1.gitee.io/img-repo/2019/10/188.png)


**主界面中主要包括四个常用的块**

- `Fiddler`的菜单栏，上图绿色部分。包括捕获`http`请求，停止捕获请求，保存`http`请求，载入本地`session`、设置捕获规则等功能。
- `Fiddler`的工具栏,上图红色部分。包括`Fiddler`针对当前`view`的操作（暂停，清除`session`,`decode`模式、清除缓存等）。
- `web Session`面板，上图黄色区域，主要是`Fiddler`抓取到的每条`http`请求（每一条称为一个`session`）,主要包含了请求的`url`，协议，状态码，`body`等信息，详细的字段含义如下图所示

![](https://poetries1.gitee.io/img-repo/2019/10/189.png)

二、HTTP请求图标说明
---

![](https://poetries1.gitee.io/img-repo/2019/10/190.png)
![](https://poetries1.gitee.io/img-repo/2019/10/191.png)


三、Statistic
---

> 关于HTTP请求的性能和其他数据分析

![](https://poetries1.gitee.io/img-repo/2019/10/192.png)


> 我们可以从中看出一些基本性能数据：如DNS解析的时间消耗是`8ms`,建立`TCP/IP`连接的时间消耗是`8ms`等等信息


四、Inspectors
---

> 分为上下两个部分，上半部分是请求头部分，下半部分是响应头部分。对于每一部分，提供了多种不同格式查看每个请求和响应的内容。

- JPG 格式使用 ImageView 就可以看到图片
- HTML/JS/CSS 使用 TextView可以看到响应的内容。
- Raw标签可以查看原始的符合HTTP标准的请求和响应头。
- Auth则可以查看授权Proxy-Authorization 和 Authorization的相关信息。
- Cookies标签可以看到请求的cookie和响应的set-cookie头信息


五、Composer
---

> 老版本的`fiddler`中叫`request-builder`.顾名思义，可以构建相应的请求，有两种常用的方式构建请求

- `Parsed 输入请求的url之后`executed`即可，也可以修改相应的头信息（如添加常用的`accept`, `host`, `referrer`, `cookie`，`cache-control`等头部）后`execute`.
- `Raw`。使用HTTP头部信息构建`http`请求。与上类似

六、fiddler过滤会话
---

> 问题：每次使用`Fiddler`,
打开一个网站，都能在`Fiddler`中看到几十个会话，看得眼花缭乱。

- 期望：只想抓取自己想要的请求

![](https://poetries1.gitee.io/img-repo/2019/10/193.png)


七、Response乱码时的处理方法
---

> 问题：有时候我们看到`Response`中的`HTML`是乱码的， 这是因为`HTML`被压缩了， 我们可以通过两种方法去解压缩

![](https://poetries1.gitee.io/img-repo/2019/10/194.png)


- 方法二：选中工具栏中的"Decode"。  这样会自动解压缩

![](https://poetries1.gitee.io/img-repo/2019/10/195.png)

八、反向代理-AutoResponder
---

> 原理：利用`fiddler`作為反向代理。意思就是将外界的`request`请求端口修改掉！ 改写返回数据，最实用的功能

- 用浏览器随意输入一个网址，如`http://www.baidu.com/`
- 选中序号`16`记录，右击-勾选`“Unlock fo Editing”`,选择`Fiddler`右侧`reponse`块下的`TextView`，这里修改`title`,如图：


![](https://poetries1.gitee.io/img-repo/2019/10/196.png)

- 选择`Fiddler`右侧`reponse`块下的`TextView`，这里修改`title`,如图：

![](https://poetries1.gitee.io/img-repo/2019/10/197.png)

- 去掉`“Unlock for Editing”`，再选择右侧上方的`AutoResponder`,勾选下方的`checkbox`选框，并将序号`16`托到下方，同时，里面会多条记录，如下图：

![](https://poetries1.gitee.io/img-repo/2019/10/198.png)


- 回到浏览器，刷新页面，如图，标题变为上面改的内容

![](https://poetries1.gitee.io/img-repo/2019/10/199.png)

九、fiddler提供了一个功能，让我们模拟低速网路环境
---

> 启用方法如：Rules → Performances → Simulate Modem Speeds

![](https://poetries1.gitee.io/img-repo/2019/10/200.png)


十、直接在fiddler上配置host
---

> 点击`tools>>hosts`,在里面填写自己想要设置的`host`即可

![](https://poetries1.gitee.io/img-repo/2019/10/201.png)


十一、Fiddler显示请求服务器的ip及系统环境的配置方法
---

- 打开`Rules——>Customize  Rules`
- 找到如下这段代码

```javascript
static function Main()
{
var today: Date = new Date();
FiddlerObject.StatusText = " CustomRules.js was loaded at: " + today;
// Uncomment to add a "Server" column containing the response "Server" header, if present

在这一行后面添加如下代码：

// 显示服务器web环境
FiddlerObject.UI.lvSessions.AddBoundColumn("Server", 50, "@response.server");
// 显示服务器IP地址
FiddlerObject.UI.lvSessions.AddBoundColumn("HostIP", 50, "x-hostIP");
}
```

- 设置后重启`fiddler`，效果如下

![](https://poetries1.gitee.io/img-repo/2019/10/202.png)
![](https://poetries1.gitee.io/img-repo/2019/10/203.png)

十二、fiddler断点调试
---

> 第一种方法：菜单栏 `Rules` –》 `Automatic Breakpoints` –》 `Before Requests`(请求被发送到服务器端之前)；或者 `After Responses`(响应返回客户端之前)，这种设置对客户机发出的所有请求都进行拦截

![](https://poetries1.gitee.io/img-repo/2019/10/204.png)
![](https://poetries1.gitee.io/img-repo/2019/10/205.png)

十三、配合SwitchySharp插件使用
---

> 为`fiddler`创建一个规则，代理到本地的`8888`端口（`fiddler`所用的端口）
> `google`设置代理的方法：下载`SwitchySharp`插件，设置如下：

![](https://poetries1.gitee.io/img-repo/2019/10/206.png)

- 接着点击保存即可~ 这样在需要的时候可以切换到`Fiddler`

![](https://poetries1.gitee.io/img-repo/2019/10/207.png)