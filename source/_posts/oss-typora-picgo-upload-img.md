---
title: Typora+PicGo+阿里云OSS实现自动上传图片
date: 2021-02-07 09:30:12
tags: 图床
categories: 工欲善其事必先利其器
---


> Typora 是一款简单、高效而且优雅的 Markdown 编辑器，它提供了一种所见即所得的全新的 Markdown 写作体验。它把源码编辑和效果预览两者合二为一，在输入 Markdown 代码的时候即时生成预览效果。Typora 的一切都围绕纯粹的生产效率而设计。



## 阿里云OSS设置



### **创建储存空间**

![image-20210207094854180](http://interview.poetries.top/blog-img-repo/image-20210207094854180.png)



- 存储空间名称：按规则随便取
- 存储区域：选择离靠近的地区
- 读写权限：选择**公开**，否则**外网无法访问，没法作为图床**



**绑定已备案的域名**



> 需要前往域名服务商创建解析

![image-20210207095156443](http://interview.poetries.top/blog-img-repo/image-20210207095156443.png)



**获取访问OSS的秘钥**



![image-20210207095407260](http://interview.poetries.top/blog-img-repo/image-20210207095407260.png)

![image-20210207095440307](http://interview.poetries.top/blog-img-repo/image-20210207095440307.png)

## 图床管理工具PicGo设置



> `PicGo`用于免费搭建个人图床，并且跨平台支持 Windows、macOS 和 Linux 系统，它的使用非常简单，只需先设置好图床网站 / 云存储服务的账号之后，用鼠标将图片拖放到 PicGo 主窗口的图片上传框，即可完成图片的上传并返回一个url链接到剪切板。

现在图床基本可以使用了，但是为了能更方便的管理，最重要的是能跟Typora无缝衔接，我们还需要PicGo辅助，

PicGo[下载地址](https://github.com/Molunerfinn/PicGo/releases)，选择版本并且根据自己的操作系统选择对应的安装包即可。



![image-20210207095548548](http://interview.poetries.top/blog-img-repo/image-20210207095548548.png)



安装好后打开界面如下所示：



![image-20210207095624957](http://interview.poetries.top/blog-img-repo/image-20210207095624957.png)



在左侧的图床设置中，有非常多的图床可供选择，大家可以根据自己的使用进行选择，这儿我们选择“阿里云OSS图床”



![image-20210207095752809](http://interview.poetries.top/blog-img-repo/image-20210207095752809.png)



- 上传图片成功后剪贴板会自动获取图片引用的外链
- 在相册可以查看通过PicGo上传过的图片



## 实现Typora中图片自动的上传



我们需要设置`PicGo Server`，如下图所示。



![image-20210207095903111](http://interview.poetries.top/blog-img-repo/image-20210207095903111.png)

![image-20210207095912384](http://interview.poetries.top/blog-img-repo/image-20210207095912384.png)



默认配置即可，只要保证端口没有被占用。



### Typora配置图片上传



设置好PicGo后来到Typora进行配置，打开Typora的文件菜单，选择“偏好设置”，选择“图像”，如下图所示。



![image-20210207100005792](http://interview.poetries.top/blog-img-repo/image-20210207100005792.png)



- 上传服务：选择PicGo
- PicGo路径：选择PicGo安装根目录的文件

配置好后，可以单击上图中的“验证图片上传选项”，来确定配置的正确性。



> 之后就可以直接上传图片了

