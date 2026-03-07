---
title: 配置sublime的LiveReload与webstorm的插件实现实时预览
date: 2016-08-13 18:20:43
tags: 
  - sublime
  - webstorm 
categories: 工欲善其事必先利其器
---


### sublime配置LiveReload插件实现实时预览
<!--more-->
`LiveReload`是很棒的插件，可以在浏览器中实时预览，但是在Sublime text3里，从`Package Control`中安装的`LiveReload`是无法使用的，但是可以选择手动安装解决

- **Sublime端**

直接`clone`到`Packages`文件夹

```
git clone https://github.com/Grafikart/ST3-LiveReload.git LiveReload

```

- 浏览器端

用的是`chrome`，在应用商店可以直接找到`LiveReload`，安装

![](http://image.codes51.com/Article/image/20151225/20151225164913_2188.jpg)

- 配置

打开`sublime `

`Preference>Package Settings>LiveReload>Settings User`

```
{
    "enabled_plugins": [
        "SimpleReloadPlugin",
        "SimpleRefresh"
    ]
}
```
- 实时预览

把`html`文件在浏览器中打开，点击一次图标中间的圆环变成原点就代表可以实时预览了。`ST3`中的文件保存一次，浏览器就会刷新一次，实时预览，很方便

![](http://image.codes51.com/Article/image/20151225/20151225164914_1563.jpg)


- `sublime`配上美美的透明插件，是不是很酷呢，再也不用来回切换了

- 透明插件：[SublimeTextTrans](https://github.com/vhanla/SublimeTextTrans)

![](http://7xq6al.com1.z0.glb.clouddn.com/snapshot.png)


---


###  WebStorm Live Edit与Google浏览器实时无刷新自动加载页面

- 在`WebStorm`中是自带`Live Edit`功能的，只是默认没有开启

- `Ctrl + Alt + S` --> `Live Edit `--> 勾选` Enable live editing`，如下图：

![](http://static.oschina.net/uploads/space/2014/0617/233936_cv38_1473099.png)

- 接下来就是要在Google浏览器中安装 `JetBrains IDE Suport `扩展，这里直接给出地址啦

- [JetBrains IDE Suport ](https://chrome.google.com/webstore/detail/hmhgeddbohgjknpmjagkdomcpobmllji)

- 安装好之后在地址栏的右边会有一个`JB`的小图标![](http://static.oschina.net/uploads/space/2014/0617/234605_fNis_1473099.png)

- 如果单击这个小图标可以切换到`WebStorm`的页面中

- 最后，要实现在`WebStorm`中编辑代码，而不刷新浏览器自动实时更新，需要在`WebStorm`中开启`Debug`模式打开页面，直接在`Project`面板右击页面选择`Debug`就行啦

![](http://static.oschina.net/uploads/space/2014/0618/000227_NoT5_1473099.png)

- 一切OK，现在在`WebStorm`修改，然后切换到`chrome`查看一下，是不是已经同步过来啦；浏览器上面的黄色背景提示条一定不能关闭，关闭了就不会实时同步啦



