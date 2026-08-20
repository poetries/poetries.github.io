---
title: Typora+PicGo+阿里云OSS实现图片自动上传
description: 完整记录 Typora 配合 PicGo 与阿里云 OSS 搭建 Markdown 图床的全过程，包含 Bucket 权限、RAM 子账号、PicGo Server 端口、防盗链与批量上传等实操细节。
date: 2021-02-07 09:30:12
tags:
  - 图床
  - PicGo
  - 阿里云OSS
categories: 工欲善其事必先利其器
---

用 Markdown 写技术文章，最烦的从来不是排版，是图片。截图默认落在本地某个文件夹里，文章一发到掘金、公众号、自己的博客，三个平台三套图片路径，换台电脑打开老文章满屏都是碎图标。更糟的是有些编辑器把图片存成相对路径，你把 md 文件挪个位置，图全没了。

解决办法就一条，让图片在你截图的那一刻就自动传到云上，Markdown 里留下的直接是一个公网 URL。这篇把 Typora 加 PicGo 加阿里云 OSS 这条链路完整走一遍，从 OSS 的 Bucket 创建到 Typora 的验证，中间的权限配置、端口冲突、防盗链这些容易卡住的地方也一并写出来。

Typora 是一款简单、高效而且优雅的 Markdown 编辑器，它提供了一种所见即所得的写作体验，把源码编辑和效果预览两者合二为一，在输入 Markdown 代码的时候即时生成预览效果。它的一切都围绕纯粹的生产效率而设计，图床这一环打通之后，写作体验会有一个很明显的台阶。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 为什么本地图片管理方案迟早会出问题
- 阿里云 OSS 侧的完整准备：Bucket、读写权限、自定义域名、AccessKey
- 为什么强烈建议用 RAM 子账号而不是主账号的 AccessKey
- PicGo 的安装与阿里云 OSS 图床参数怎么填
- PicGo Server 的作用和 36677 端口的坑
- Typora 偏好设置里的上传服务配置与验证
- 防盗链、图片压缩、批量上传这些后续会遇到的问题
- 除了阿里云 OSS 还有哪些可选方案

## 一、先说清楚这套链路在解决什么

整条链路上有三个角色，各管一段。

阿里云 OSS 是存储层，负责把图片文件真正存下来，并提供一个可以公网访问的 URL。PicGo 是中间层，负责拿到本地图片文件、调用 OSS 的 SDK 上传、拿到返回的 URL。Typora 是最上层的触发者，你往编辑器里粘贴一张截图的瞬间，它去调 PicGo，拿到 URL 之后自动把 Markdown 里的本地路径替换掉。

这三段任何一段断了，整条链路就不通，所以后面排查问题时也按这个顺序来分段验证。

## 二、阿里云 OSS 设置

### 2.1 创建储存空间

登录阿里云控制台，进入对象存储 OSS，创建 Bucket。

![阿里云 OSS 创建储存空间的配置界面](https://blog.poetries.top/img/static/images/image-20210207102313573.png)

几个字段的填法：

- **存储空间名称**：全局唯一，一旦创建不能改名，建议用 `你的域名前缀-img` 这类好认的格式
- **存储区域**：选择离你和你的读者最近的地区。这个选项创建后同样不能改，选错了只能重建 Bucket 再迁数据
- **读写权限**：必须让外网能读，否则没法作为图床

读写权限这一项要单独说一下。阿里云给的三个选项是私有、公共读、公共读写，图床场景选**公共读**就够了。

原文这里写的是「选择公开」，实际操作中很容易顺手点到公共读写。公共读写意味着任何人都可以往你的 Bucket 里写文件甚至删文件，被人拿去当免费网盘刷流量是常有的事，OSS 的流量费是按量计费的，这个账单不好受。上传动作由 PicGo 携带 AccessKey 完成，本来就不需要匿名写权限。

- **存储类型**：选标准存储。低频访问和归档存储的单价是便宜，但取回要另外收费，图床这种随时会被读的场景反而更贵

### 2.2 绑定已备案的域名

Bucket 创建完会有一个默认的访问域名，形如 `bucket-name.oss-cn-hangzhou.aliyuncs.com`。这个域名能用，但有两个问题，一是太长影响 Markdown 可读性，二是万一以后换存储服务商，所有历史文章里的链接全部作废。

绑定自己的域名可以把这个风险摘掉，以后换服务商只需要改 DNS 解析。

![OSS 绑定自定义域名的配置界面](https://blog.poetries.top/img/static/images/image-20210207102411339.png)

绑定之前需要前往域名服务商创建解析，加一条 CNAME 记录指向 Bucket 的默认外网域名。国内节点的 Bucket 绑定自定义域名要求域名已经完成 ICP 备案，这是硬性要求，没备案的话可以考虑把 Bucket 建在香港或者海外区域。

绑完记得顺手开一下 HTTPS。OSS 控制台支持直接上传证书，阿里云也提供免费的 DV 证书。现在的博客站基本都是 HTTPS 的，图片走 HTTP 会被浏览器判定为混合内容直接拦掉，这个坑不提前处理，配完当天就会遇到。

### 2.3 获取访问 OSS 的秘钥

PicGo 要代表你上传文件，需要一对 AccessKey ID 和 AccessKey Secret。

![阿里云 AccessKey 管理入口](https://blog.poetries.top/img/static/images/image-20210207102428005.png)

![创建 AccessKey 并保存密钥对](https://blog.poetries.top/img/static/images/image-20210207102438448.png)

这里强烈建议不要用主账号的 AccessKey。主账号的密钥等同于你整个阿里云账号的最高权限，PicGo 的配置是明文存在本地 JSON 文件里的，一旦这个文件跟着 dotfiles 仓库被推到 GitHub 上，后果是你不会想面对的。

正确做法是去访问控制 RAM 里建一个子账号，只给它这一个 Bucket 的读写权限：

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["oss:PutObject", "oss:GetObject"],
      "Resource": ["acs:oss:*:*:你的bucket名称/*"]
    }
  ]
}
```

这段策略只放开了往指定 Bucket 写对象和读对象两个动作，连列举 Bucket 列表都不行。密钥泄漏的损失范围被压到最小。

AccessKey Secret 只在创建的那一次完整显示，关掉页面就再也看不到了，当场复制存好。

## 三、图床管理工具 PicGo 设置

PicGo 用于免费搭建个人图床，跨平台支持 Windows、macOS 和 Linux。它的使用非常简单，只需先设置好图床网站或云存储服务的账号，用鼠标将图片拖放到 PicGo 主窗口的上传框，即可完成上传并返回一个 URL 链接到剪贴板。

现在图床基本可以使用了，但是为了能更方便地管理，最重要的是能跟 Typora 无缝衔接，还需要 PicGo 来辅助。

PicGo 的[下载地址](https://github.com/Molunerfinn/PicGo/releases)在 GitHub Releases 页，选择版本并且根据自己的操作系统选择对应的安装包即可。

![PicGo 的 GitHub Releases 下载页面](https://blog.poetries.top/img/static/images/image-20210207102450970.png)

macOS 用户装完第一次打开可能会提示「已损坏，无法打开」，这不是文件真的坏了，是因为安装包没有经过 Apple 公证。在终端里执行下面这条命令去掉隔离属性就好：

```bash
sudo xattr -r -d com.apple.quarantine /Applications/PicGo.app
```

安装好后打开界面如下所示：

![PicGo 安装完成后的主界面](https://blog.poetries.top/img/static/images/image-20210207102501215.png)

在左侧的图床设置中，有非常多的图床可供选择，大家可以根据自己的使用情况进行选择，这里我们选择阿里云 OSS 图床。

![PicGo 中阿里云 OSS 图床的参数配置](https://blog.poetries.top/img/static/images/image-20210207102511487.png)

各个字段对应关系是这样的：

| PicGo 字段 | 填什么 | 常见错误 |
|-----------|--------|---------|
| KeyId | RAM 子账号的 AccessKey ID | 误填成主账号密钥 |
| KeySecret | 对应的 AccessKey Secret | 复制时带了空格 |
| 存储空间名 | Bucket 名称 | 填成了完整域名 |
| 存储区域 | 形如 `oss-cn-hangzhou` | 填成 `oss-cn-hangzhou.aliyuncs.com` 或者中文的「华东1」 |
| 存储路径 | 形如 `blog/img/` | 忘了结尾的斜杠，导致文件名被拼接成 `blogimg2021xxx.png` |
| 自定义域名 | 形如 `https://img.example.com` | 结尾多写了斜杠，或者忘了写协议头 |

存储区域这一栏踩的人最多。阿里云控制台上显示的是「华东1（杭州）」，但 PicGo 要的是 Endpoint 前缀 `oss-cn-hangzhou`，两者对不上号的时候上传会直接报连接失败。

存储路径建议按年月分目录，比如写成 `blog/2021/02/`。图片全堆在根目录下，等你攒到几千张之后想在控制台里找某一张会非常痛苦。

配置填完点确定，再把它设为默认图床。这时候可以先拖一张图进上传区试试，能返回 URL 就说明 PicGo 到 OSS 这一段通了。

- 上传图片成功后剪贴板会自动获取图片引用的外链
- 在相册里可以查看通过 PicGo 上传过的所有图片

先把这一段验通再往下走，别急着配 Typora。链路分段验证能省掉大量猜测时间。

## 四、实现 Typora 中图片自动上传

### 4.1 开启 PicGo Server

Typora 不直接调用 PicGo 的界面，而是通过 HTTP 接口通信。所以需要在 PicGo 里把 Server 打开。

![PicGo 设置中开启 PicGo Server 的位置](https://blog.poetries.top/img/static/images/image-20210207102521859.png)

![PicGo Server 的监听地址与端口配置](https://blog.poetries.top/img/static/images/image-20210207102534331.png)

默认配置即可，监听地址 `127.0.0.1`，端口 `36677`，只要保证端口没有被占用。

想确认端口有没有冲突，可以直接查一下：

```bash
# macOS / Linux
lsof -i :36677

# Windows
netstat -ano | findstr 36677
```

如果这个端口已经被别的程序占了，改成别的（比如 `36678`）也行，但改完之后 Typora 那边的配置要跟着改。这也是后面「验证图片上传选项」失败最常见的原因之一。

还有一点容易忘，PicGo 必须处于运行状态 Typora 才能上传。很多人习惯用完就退出后台程序，结果第二天写文章发现上传全失败。macOS 上可以把 PicGo 加到登录项里，Windows 上加到启动项。

### 4.2 Typora 配置图片上传

设置好 PicGo 后来到 Typora 进行配置，打开 Typora 的文件菜单，选择偏好设置，选择图像。

![Typora 偏好设置中的图像上传服务配置](https://blog.poetries.top/img/static/images/image-20210207102543849.png)

- **上传服务**：选择 PicGo（app）
- **PicGo 路径**：选择 PicGo 安装根目录下的可执行文件

除了上传服务本身，上面那个「插入图片时」的下拉框也要一起改。把它设成「上传图片」，才会在你粘贴截图的瞬间自动触发上传。默认值是「无特殊操作」，很多人配完 PicGo 发现还是要手动点上传，问题就出在这里。

下面还有两个勾选项建议一起开。「对本地位置的图片应用上述规则」会让你从本地拖进来的图片也走上传，「对网络位置的图片应用上述规则」会把别人博客里的图片转存到你自己的图床，避免以后对方删图导致你的文章开天窗。

配置好后，可以单击界面中的「验证图片上传选项」来确定配置的正确性。验证通过会看到一张测试图和返回的 URL。

之后就可以直接上传图片了。截图、粘贴、URL 自动替换，整个过程感知不到。

这个设计是真的舒服，配完之后写文章的注意力可以完全回到内容上。

### 4.3 验证失败时怎么排查

按前面说的三段分开查，效率最高。

先在 PicGo 界面里手动拖一张图上传。传不上去说明是 PicGo 到 OSS 这一段的问题，回去检查 AccessKey、存储区域和 Bucket 名称。

PicGo 手动能传但 Typora 验证失败，那就是 Typora 到 PicGo 这一段的问题。检查 PicGo 是否在运行、Server 开关是否打开、端口是否一致、PicGo 路径是否指向了正确的可执行文件。

传上去了但图片打不开、显示 403，那是 OSS 的权限或者域名配置问题。回去看 Bucket 的读写权限是不是公共读，自定义域名的 CNAME 解析是否生效。

## 五、配完之后还会遇到的几件事

### 5.1 防盗链把自己挡在外面

OSS 的防盗链功能可以设置 Referer 白名单，防止别人盗用你的图片消耗流量。但配置的时候一定要勾上「允许空 Referer」。

Typora 本地预览、部分 Markdown 编辑器、以及从地址栏直接打开图片链接，发出的请求都不带 Referer。不允许空 Referer 的话，你自己写文章时看到的全是裂图，而别人的网站反而能正常显示，这个现象第一次遇到会非常困惑。

### 5.2 图片压缩

截图动辄两三 M，直接传上去既费流量又拖慢文章加载。有两个思路。

一是上传前压缩，PicGo 有个 `picgo-plugin-compress` 插件，在插件设置里搜索安装，能在上传前自动走一遍压缩。

二是上传后处理，直接用 OSS 自带的图片处理服务，在 URL 后面挂参数：

```
https://img.example.com/blog/2021/02/xxx.png?x-oss-process=image/resize,w_1200/quality,q_85
```

`resize,w_1200` 把宽度限制到 1200，`quality,q_85` 把质量压到 85。这个方式的好处是原图还在，随时可以改参数；坏处是每次请求都要走一次图片处理，会产生额外费用。我自己是两个都用，上传时压一遍，展示时再按需缩放。

### 5.3 存量文章的图片怎么办

已经写好的一堆 md 文件，图片还都是本地路径。手动一张张传显然不现实。

PicGo 支持命令行批量上传：

```bash
npm install picgo -g
picgo upload ./images/*.png
```

它会依次上传并把 URL 打印出来。再配合一个简单的替换脚本把 md 里的本地路径换掉就行。这块我只在自己的博客仓库上跑过一次，几百张图没出问题，但如果你的文件名里有中文或空格，建议先批量重命名再传。

### 5.4 备份

图床最怕的就是单点。服务商调整策略、账号欠费、Bucket 被误删，任何一种情况都会让你所有文章的图集体失效。

OSS 控制台可以开版本控制和跨区域复制，但更简单的做法是本地留一份原图。Typora 的「插入图片时」选项其实支持先复制到指定文件夹再上传，两件事不冲突。

## 六、除了阿里云 OSS 还有什么选择

顺着上面聊，OSS 不是唯一解，几个常见的替代方案对比一下。

| 方案 | 优点 | 需要注意的 |
|------|------|-----------|
| 腾讯云 COS | 配置和 OSS 几乎一样，PicGo 原生支持 | 同样需要备案才能绑自定义域名 |
| 七牛云 | 有一定的免费额度 | 测试域名有效期限制，到期要重新绑定 |
| GitHub + jsDelivr | 完全免费，仓库即备份 | 国内访问不稳定，仓库大小有限制 |
| 自建服务器 + Nginx | 完全可控，无流量费 | 要自己管带宽、备份和证书 |

选哪个主要看你对「链接长期有效」的要求有多高。只要绑了自己的域名，后面换底层存储的成本就不高，这也是前面反复强调绑域名的原因。

## 总结

这套链路的核心其实就是三段。OSS 提供公网可访问的存储，PicGo 负责调用 SDK 上传并返回 URL，Typora 在你粘贴图片时触发 PicGo 并自动替换 Markdown 里的路径。

配置过程里最容易卡住的几个点，一是 Bucket 读写权限选公共读而不是公共读写，二是存储区域要填 `oss-cn-hangzhou` 这种 Endpoint 前缀而不是中文地区名，三是 Typora 的「插入图片时」要手动改成「上传图片」，四是 PicGo 必须保持后台运行。

强烈建议用 RAM 子账号的 AccessKey，并且只授予单个 Bucket 的读写权限。这个配置多花不了五分钟，能省掉一次真正的安全事故。

绑自定义域名这一步别省。它决定了你以后换不换得动存储服务商，也决定了几年后那些老文章里的图还在不在。

## 参考

- [阿里云 OSS 官方文档 创建存储空间](https://help.aliyun.com/zh/oss/user-guide/create-a-bucket-4)
- [阿里云 OSS 图片处理参数](https://help.aliyun.com/zh/oss/user-guide/img-parameters)
- [PicGo 官方文档](https://picgo.github.io/PicGo-Doc/zh/guide/)
- [PicGo Releases 下载](https://github.com/Molunerfinn/PicGo/releases)
- [Typora 官网](https://typora.io/)
- [前端进阶之旅](https://interview.poetries.top)
