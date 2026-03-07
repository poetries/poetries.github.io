---
title: Hexo主题功能优化
date: 2016-07-7 02:08:41
tags: Hexo
categories: Hexo
---



### **添加音乐播放器**
---
<!--more-->
以前觉得网页嵌入播放器很牛逼的感觉，原来就是一句代码的事儿！感谢外连接，感谢开源，让这个世界变得更美好。

markdown语法是完全兼容html代码的，直接把html代码扔进去就oook咯。

- **添加豆瓣音乐**

复制下面代码到你的博文任意位置，然后Hexo s预览。

加入豆瓣音乐 歌曲是随机播放，游客可切歌，不能定制播哪首歌，而且不能按钮停止，只能音量调到0，无语，有利有弊的吧。

尽量放在最下面，如果你放在最上面，很有可能别人还未点击进入博文，你的博客就有了背景音乐了，要想赶紧播放音乐的另说。


```html
<center> <iframe name="iframe_canvas" src="http://douban.fm/partner/baidu/doubanradio" scrolling="no" frameborder="0" width="400" height="200"></iframe> </center>
```
- **添加网易云音乐**
打开网页版网易云音乐。

如果只是加入单曲，只需要搜索歌曲，点开歌曲名，点击生成外链播放器，复制html代码（可以选择是否自动播放），将html代码无需任何修改放入markdown文章里就OK了。

如果想要加入歌单，就需要自己创建歌单，然后分享歌单，找到自己的分享动态，点进去可以看到有“生成外链播放器”这些字眼，其余操作就和上面一样了。不过，你的歌单有变化的话，这个外链的歌曲同样跟着变，这一点挺棒的。

例如，播放待你长发及腰这首歌，自动播放只需要嵌入一下代码

```html
<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=330 height=86 src="http://music.163.com/outchain/player?type=2&id=28947001&auto=1&height=66"></iframe>
```

---

### **NexT使用自定义的CSS样式**
---

**添加样式支持**

首先，在样式文件的`source`文件夹下找到css文件夹，打`开main.sty`l文件，在最后添加：`@import "_my/mycss";`

新建自定义样式
找到样式文件夹css 新建_my文件夹，在其中新建`mycss.styl`文件，之后就可以按照style的格式自定义样式了。

例子
例如：我想在文章中添加个自定义样式的按钮，怎么做呢？？？

打开新建的`mycss.styl`文件，在其中添加样式：

```css
.myButton {
    background-color:#0f94bd;
    -moz-border-radius:15px;
    -webkit-border-radius:15px;
    border-radius:15px;
    display:inline-block;
    cursor:pointer;
    color:#ffffff;
    font-family:Arial;
    font-size:17px;
    padding:11px 27px;
    text-decoration:none;
    text-shadow:0px 1px 0px #2f6627;
}
.myButton:hover {
    background-color:#5cbf2a;
}
.myButton:active {
    position:relative;
    top:1px;
}
```

引用：在想要引用的时候添加

`<a href="#" class="myButton">MyButton</a>`

