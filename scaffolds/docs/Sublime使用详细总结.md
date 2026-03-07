---
title: Sublime使用详细总结
date: 2016-03-14 13:37:18
tags: sublime
categories: 工欲善其事必先利其器
---

# Sublime使用详细总结
<!--more-->
----------

> 【导读】 Sublime Text具有漂亮的用户界面和强大的功能，例如代码缩略图，多重选择，快捷命令等。SublimeText更妙的是它的可扩展性。SublimeText：一款具有代码高亮、语法提示、自动完成且反应快速的编辑器软件，不仅具有华丽的界面，还支持插件扩展机制，用她来写代码，绝对是一种享受。相比于难于上手的Vim，浮肿沉重的Eclipse，VS，即便体积轻巧迅速启动的Editplus、Notepad++，在SublimeText面前大略显失色，无疑这款性感无比的编辑器是Coding和Writing最佳的选择，没有之一。

### **一、Sublime Text 2和3的对比**

> 相比于2，Sublime Text 3就秒启动一项，就压倒性地胜利了。因此在之后的叙述中都以Sublime Text 3为主角。并且3一直在不断的完善更新，具体的差异可参看Sublime Blog.简单的说：

 - ST3支持在项目目录里面寻找变量
 - 提供了对标签页更好地支持（更多的命令和快捷键）
 - 加快了程序运行的速度
 - 更新了API，使用Python3.3

强烈推荐朋友们使用3! 唯快不破，不解释


### **二、Sublime Text 3安装插件**

 Sublime Text的强大就是她拥有强大的课可扩展性。您可根据自己的需要安装不同的插件；这使得她变的无比强大的同时又不失轻便。
 
 

 - 插件安装方式一：直接安装：
 安装Sublime text3插件很方便，可以直接下载安装包解压缩到Packages目录（菜单->preferences->packages）。

----------

 - 插件安装方式二：使用Package Control组件安装：
 按Ctrl+`调出console（注：安装有QQ输入法的这个快捷键会有冲突的，输入法属性设置-输入法管理-取消热键切换至QQ拼音）粘贴以下代码到底部命令行并回车：
如果是text2输入如下命令：

```
import urllib2,os,hashlib; h = '7183a2d3e96f11eeadd761d777e62404' + 'e330c659d4bb41d3bdf022e94cab3cd0'; pf = 'Package Control.sublime-package'; ipp = sublime.installed_packages_path(); os.makedirs( ipp ) if not os.path.exists(ipp) else None; urllib2.install_opener( urllib2.build_opener( urllib2.ProxyHandler()) ); by = urllib2.urlopen( 'http://sublime.wbond.net/' + pf.replace(' ', '%20')).read(); dh = hashlib.sha256(by).hexdigest(); open( os.path.join( ipp, pf), 'wb' ).write(by) if dh == h else None; print('Error validating download (got %s instead of %s), please try manual install' % (dh, h) if dh != h else 'Please restart Sublime Text to finish installation')
```
如果是text3输入如下命令：

```
import urllib.request,os,hashlib; h = '7183a2d3e96f11eeadd761d777e62404' + 'e330c659d4bb41d3bdf022e94cab3cd0'; pf = 'Package Control.sublime-package'; ipp = sublime.installed_packages_path(); urllib.request.install_opener( urllib.request.build_opener( urllib.request.ProxyHandler()) ); by = urllib.request.urlopen( 'http://sublime.wbond.net/' + pf.replace(' ', '%20')).read(); dh = hashlib.sha256(by).hexdigest(); print('Error validating download (got %s instead of %s), please try manual install' % (dh, h)) if dh != h else open(os.path.join( ipp, pf), 'wb' ).write(by)
```
重启Sublime Text 3。如果在Perferences->package settings中看到package control这一项，则安装成功。按下Ctrl+Shift+P调出命令面板输入install 调出 Install Package 选项并回车，然后在列表中选中要安装的插件。

安装好了之后，在Preferences会看到package control，如下:

![此处输入图片的描述][1]

PS：国内使用SublimeText3，经常可能遇到无法安装可用插件问题，可remove掉Package Control重新安装下；如遇到连PackageControl也无法安装，则可以在别处拷贝一份关于Package Control的文件－(Package Control.sublime-package)存放于Installed Packages目录之下即可

### **三、Sublime Text 3插件推荐**

无插件，不神器！根据自己的需要定制属于自己的强大插件集；下面是一些常用的推荐。
[Sublime Text3插件：增强篇][2]
[20个强大的SublimeText插件][3]

### 实用的sublime插件集合

 - **[Emmet][4]**

功能：编码快捷键，前端必备

简介：Emmet作为zen coding的升级版，对于前端来说，可是必备插件，如果你对它还不太熟悉，可以在其官网（http://docs.emmet.io/）上看下具体的演示视频。

使用：教程-http://docs.emmet.io/cheat-sheet/、http://peters-playground.com/Emmet-Css-Snippets-for-Sublime-Text-2/

![此处输入图片的描述][5]

 - [**JSFormat**][6]

功能：Javascript的代码格式化插件

简介：很多网站的JS代码都进行了压缩，一行式的甚至混淆压缩，这让我们看起来很吃力。而这个插件能帮我们把原始代码进行格式的整理，包括换行和缩进等等，是代码一目了然，更快读懂~

使用：在已压缩的JS文件中，右键选择jsFormat或者使用默认快捷键（Ctrl+Alt+F）

![此处输入图片的描述][7]

 - **[LESS][8]**

功能：LESS高亮插件

简介：用LESS的同学都知道，sublime没有支持less的语法高亮，所以这个插件可以帮上我们

使用：打开.less文件或者设置为less格式

![此处输入图片的描述][9]

 - [**Less2CSS**][10]

功能：编译Less

简介：监测到文件改动时，编译保存为.css文件

使用：打开.less文件，编写代码保存即可看到同时生成.css的文件，如果没有则需要安装node。不推荐用这种方法编译，要么用koala，要么就用grunt编译。

 - **[Alignment][11]**

功能：”=”号对齐

简介：变量定义太多，长短不一，可一键对齐

使用：默认快捷键Ctrl+Alt+A和QQ截屏冲突，可设置其他快捷键如：Ctrl+Shift+Alt+A；先选择要对齐的文本

![此处输入图片的描述][12]

 - **[sublime-autoprefixer][13]**

功能：CSS添加私有前缀

简介：CSS还未标准化，所以要给各大浏览器一个前缀以解决兼容问题

使用：Ctrl+Shift+P，选择autoprefixer即可。需要安装node.js。

其他设置如快捷键请参考：https://sublime.wbond.net/packages/Autoprefixer

![此处输入图片的描述][14]

 - **[Clipboard History][15]**

功能：粘贴板历史记录

简介：方便使用复制/剪切的内容

使用：

Ctrl+alt+v：显示历史记录
Ctrl+alt+d：清空历史记录
Ctrl+shift+v：粘贴上一条记录（最旧）
Ctrl+shift+alt+v：粘贴下一条记录（最新）

![此处输入图片的描述][16]

 - **[Bracket Highlighter][17]**

功能：代码匹配

简介：可匹配[], (), {}, “”, ”, <tag></tag>，高亮标记，便于查看起始和结束标记

使用：点击对应代码即可

![此处输入图片的描述][18]

 - **[Git][19]**

功能：git管理

简介：插件基本上实现了git的所有功能

使用：https://github.com/kemayo/sublime-text-git/wiki

![此处输入图片的描述][20]
 

 - **[jQuery][21]**

功能：jQ函数提示

简介：快捷输入jQ函数，是偷懒的好方法

![此处输入图片的描述][22]

 - **[Doc​Blockr][23]**

功能：生成优美注释

简介：标准的注释，包括函数名、参数、返回值等，并以多行显示，手动写比较麻烦

使用：输入/*、/**然后回车，还有很多用法，请参照

https://sublime.wbond.net/packages/DocBlockr

![此处输入图片的描述][24]
![此处输入图片的描述][25]

 - **[Color​Picker][26]**

功能：调色板

简介：需要输入颜色时，可直接选取颜色

使用：快捷键Windows: ctrl+shift+c

![此处输入图片的描述][27]
![此处输入图片的描述][28]

 - **[ConvertToUTF8][29]**

功能：文件转码成utf-8

简介：通过本插件，您可以编辑并保存目前编码不被 Sublime Text 支持的文件，特别是中日韩用户使用的 GB2312，GBK，BIG5，EUC-KR，EUC-JP ，ANSI等。ConvertToUTF8 同时支持 Sublime Text 2 和 3。

使用：安装插件后自动转换为utf-8格式

![此处输入图片的描述][30]

 - **[AutoFileName][31]**

功能：快捷输入文件名

简介：自动完成文件名的输入，如图片选取

使用：输入”/”即可看到相对于本项目文件夹的其他文件

![此处输入图片的描述][32]

 - **[Nodejs][33]**

功能：node代码提示

教程：https://sublime.wbond.net/packages/Nodejs

![此处输入图片的描述][34]

 - **[IMESupport][35]**

功能：sublime中文输入法

简介：还在纠结 Sublime Text 中文输入法不能跟随光标吗？试试「IMESupport 」这个插件吧！目前只支持 Windows，在搜索等界面不能很好的跟随光标。

使用：Ctrl + Shift + P →输入pci →输入IMESupport →回车

![此处输入图片的描述][36]

 - **[Trailing spaces][37]**

功能：检测并一键去除代码中多余的空格

简介：还在纠结代码中有多余的空格而显得代码不规范？或是有处女座情节？次插件帮你实现发现多余空格、一键删除空格、保存时自动删除多余空格，让你的代码规范清爽起来

使用：安装插件并重启，即可自动提示多余空格。一键删除多余空格：CTRL+SHITF+T（需配置），更多配置请点击标题。快捷键配置：在Preferences / Key Bindings – User加上代码（数组内）

    { "keys": ["ctrl+shift+t"], "command": "delete_trailing_spaces" }
    
![此处输入图片的描述][38]

 - **[FileDiffs][39]**

功能：强大的比较代码不同工具

简介：比较当前文件与选中的代码、剪切板中代码、另一文件、未保存文件之间的差别。可配置为显示差别在外部比较工具，精确到行。

使用：右键标签页，出现FileDiffs Menu或者Diff with Tab…选择对应文件比较即可

![此处输入图片的描述][40]

 - **[GBK Encoding Support][41]**

功能：中文识别

简介：Sublime Text 2可识别UTF-8格式的中文，不识别GBK和ANSI，因此打开很多含中文的文档都会出现乱码。可以通过安装插件GBK Support,来识别GBK和ANSI。

使用：

Open a GBK File
Save file with GBK encoding
Change file encoding from utf8 to GBK or GBK to utf8

![此处输入图片的描述][42]

 - [**Git​Gutter**][43]
 
 简介：指示代码中插入、修改、删除的地方
 ![此处输入图片的描述][44]

### 其他插件

- AutoFileName
- SublimeLinter-json
- SublimeLinter-jslint
- SublimeLinter-html-tidy
- SideBarEnhancements
- Terminal
- Highlighter
- Color Highlighter
- HTMLAttributes
- StringEncode
- HTML-CSS-JS Prettify


 - [**MarkDown Editing**][45]
 
SublimeText不仅仅是能够查看和编辑 Markdown 文件，但它会视它们为格式很糟糕的纯文本。这个插件通过适当的颜色高亮和其它功能来更好地完成这些任务。

关于如何在SublimeText下高效些东西可参见文章：[sublime text 2(3)下的Markdown写作][46] 抑或是[追寻高效工作的一路折腾㈡][47]

 - [**SideBarFolders**][48]

打开的文件夹都太多了? 来用这个来管理文件夹，世界原来也可以这么美好。
![此处输入图片的描述][49]

 - **[Sublime Terminal][50]**

这个插件可以让你在Sublime中直接使用终端打开你的项目文件夹，并支持使用快捷键。

 - **[SublimeREPL][51]**

这可能是对程序员很有用的插件。SublimeREPL 允许你在 Sublime Text 中运行各种语言（NodeJS ， Python，Ruby， Scala 和 Haskell 等等）。

 - **[Ctags插件][52]**

有童鞋抱怨Sublime Text不能支持函数的跳转（比如像Eclipse那样，按住Control点击该方法或者对象，即可跳转到定义的地方； Alt+←即可回到原处）。其实Sublime Text也可以借助插件实现之（当然，有些情况下:Can not find defination）毕竟这个也是借助正则来匹配完成的。因此这个也就要求代码很规范。这个插件相对来讲会有些麻烦，具体的可以参见:[Sublime Text ctags 的配置.][53]

 - **[SublimeLinter插件][54]**

SublimeLinter 是前端编码利器——[Sublime Text][55] 的一款插件，用于高亮提示用户编写的代码中存在的不规范和错误的写法，支持 JavaScript、CSS、HTML、Java、PHP、Python、Ruby 等十多种开发语言。这篇文章介绍如何在 Windows 中配置 SublimeLinter 进行 JS & CSS 校验。
比如写例如像lua这样的弱语言脚本代码，有这个可以规避掉很多不该有的低级错误吧？当然这也需要你SublimeLinter安装完毕之后再安装一个

> SublimeLinter-lua

即可。具体的使用可以参见：借助 [SublimeLinter 编写高质量的 JavaScript & CSS 代码][56]

 - **[SideBarEnhancements插件][57]**

SideBarEnhancements是一款很实用的右键菜单增强插件；在安装该插件前，在Sublime Text左侧FOLDERS栏中点击右键，只有寥寥几个简单的功能；安装了就相当于给其丰了大胸一般。
更强大的是，该插件还能让我们自定义快捷键呼出某个浏览器以预览页面！这样就不用到项目目录下寻找和拖动到特定浏览器中预览了。
安装此插件后，点击菜单栏的preferences->package setting->side bar->Key Building-User，键入以下代码：

```
[   
    { "keys": ["ctrl+shift+c"], "command": "copy_path" },
    //chrome
    { "keys": ["f2"], "command": "side_bar_files_open_with",
            "args": {
                "paths": [],
                "application": "C:\\Users\\jeffj\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
                "extensions":".*"
            }
     }
]
```
这里设置按Ctrl+Shift+C复制文件路径，按F2即可在Chrome浏览器预览效果(如果需要的话，也可以根据自己的需要为Firefox，Safari，IE，Opera等加上)，当然你也可以自己定义喜欢的快捷键，最后注意代码中的浏览器路径要以自己电脑里的文件路径为准。

 - **[HTML-CSS-JS Prettify][58]**

一款集成了格式化（美化）html、css、js三种文件类型的插件，即便html,js写在PHP文件之内。插件依赖于nodejs，因此需要事先安装nodejs，然后才可以正常运行。插件安装完成后，快捷键ctrl+shift+H完成当前文件的美化操作。插件对html、css文件的美化不是非常满意，但还可以，后面将说明如何修改css美化脚本。本人用起来超级爽的，鉴于篇幅，就不赘述，可以参见**[这篇][59]**介绍。

 - **[CSScomb CSS属性排序:][60]**

有时候看看自己写的CSS文件，会不会觉得属性很乱查找不易维护难？CSScomb可以按照一定的CSS属性排序规则，将杂乱无章的CSS属性进行重新排序。选中要排序的CSS代码，按Ctrl+Shift+C，即可对CSS属性重新排序了，代码从此简洁有序易维护，如果不款选代码则插件将排序文件中所有的CSS属性。当然，可以自己自定义CSS属性排序规则，打开插件目录里的CSScomb.sublime-settings文件，更改里面的CSS属性顺序就行了。因为这个插件使用PHP写的，要使他工作需要在环境变量中添加PHP的路径，具体请看github上的说明。

 - **[SublimeTmpl 快速生成文件模板][61]**

一直都很奇怪为什么sublime text 3没有新建文件模板的功能，像html头部的DTD声明每次都要复制粘贴。用SublimeTmpl这款插件终于可以解脱了，SublimeTmpl能新建html、css、javascript、php、python、ruby六种类型的文件模板，所有的文件模板都在插件目录的templates文件夹里，可以自定义编辑文件模板。
SublimeTmpl默认的快捷键:

> ctrl+alt+h html
ctrl+alt+j javascript
ctrl+alt+c css
ctrl+alt+p php
ctrl+alt+r ruby
ctrl+alt+shift+p python

 - **[Javascript-API-Completions:][62]**

支持Javascript、JQuery、Twitter Bootstrap框架、HTML5标签属性提示的插件，是少数支持sublime text 3的后缀提示的插件，HTML5标签提示sublime text3自带，不过JQuery提示还是很有用处的，也可设置要提示的语言。

**[WakaTime][63]** — 记录你的Code时间;
WakaTime可以做到精确地统计到你花在某个项     目上的时间;WakaTime针对不同的IDE，拥有不同的[插件][64]，在Sublime上安装着插件，就能统计到我使用Sublime进行的所有项目的行为。可以高效管理和知晓自己code时间

> Waka的基本设计和rescuetime类似。每个人注册完将获取一个key，装一个客户端，把key输进去（登陆是同一个道理），然后它就把本地的所有行为带个key扔给服务器来统计，一段时间之后给你个报表。不过Waka做的真的很精准，精确到每一个文件用了多少秒，每一种语言用了多少时间。

![此处输入图片的描述][65]

安装和使用都很简单，请参见**[这里][66]**。另外一篇比较详细的文章**[时间都去哪了?用RescueTime和WakaTime来记录你的时间][67]**,对RescueTime和WakaTime有一个更为详细的叙述，可以一读



## 四、定制属于自己的快捷键

 - **首先要会使用SublimeText内置的快捷键：**

比如 `Commond Shift P` 打开命令面板:例如打开Package Control安装各种插件；可以可以输入Set(Snytax)来改变使用的语言环境，瞬间切换等等。

 - 设置快捷键。在SublimeText里
 

> [
    { "keys": ["ctrl+f9"], "command": "build" },
    { "keys": ["f10"], "command": "build", "args": {"variant": "Run"} },
    { "keys": ["ctrl+shift+x"], "command": "toggle_comment", "args": { "block": true } },
]

具体可参见这边文章Sublime Text3 [快捷键汇总及设置快捷键配置环境变量][68]

---

#### sublime中的vim模式配置：

在Reference-> User Settings 选项，点击进入配置文件编辑状态
请添加如下的内容 "ignored_packages": []
然后使用 Ctrl+S 快捷键进行保存，这时候编辑文件，只要按下键盘上的ESC键就可以进入VIM模式了，可以使用VIM的快捷键

---

**常用快捷键表**

![此处输入图片的描述][69]

## 五、定制属于自己的个性化主题

我想合适的主题和配色是能够潜在提高工程师效率的重要工具，虽然用白底黑字的记事本也能写出稳固高效的代码，但是为了我们的心情和眼睛，还是选几款好的配色比较好。前端工程师对设计和美学更加敏锐，虽然不是设计师，但我们知道“什么是美的”。在Sublime Text中改变视觉效果有两部分设置，分别是代码高亮的“配色”以及编辑器本身的“主题”（包括了Tab栏、侧边栏以及Command窗口等）。顺便插播一下，最新版本的Sublime Text 3能够指定侧边栏的文件图标了~

记得知乎上有为什么大部分程序员都喜欢用黑色界面这样的问题，嗯…… 不管你使用亮色系还是暗色系的主题（事实上我在不同的编辑器分别用了这两种），下面这几种都非常值得推荐

**Material Theme：**非常推荐的主题


**9 个最佳的 Sublime Text 2/3 主题**

**[Spacegray][70]**
![此处输入图片的描述][71]

一个最小化的设计可以帮你把注意力放在编写代码上，该主题在 UI 上没什么吸引人之处，但很适合编码。

**[Solarized][72]**

![此处输入图片的描述][73]

非常精确的颜色设置，这些颜色在不同的设备和不同的亮度环境下测试过

**[Glacier][74]**

颜色很丰富，使用流行的扁平设计风格。

![此处输入图片的描述][75]

**[Predawn][76]**

![此处输入图片的描述][77]

Predawn 非常漂亮，特别适合编写代码。

**[Flatland][78]**

![此处输入图片的描述][79]

Flatland 是一个基于 Soda 构建的 Sublime Text 主题，看起来不错

**[Tron Legacy][80]**

![此处输入图片的描述][81]

Tron 电影迷们可能会喜欢这一款主题，因为颜色相似

**[ITG:Flat][82]**

![此处输入图片的描述][83]

另外一个扁平化设计风格主题

**[Tomorrow Theme][84]**

![此处输入图片的描述][85]

Tomorrow 主题颜色丰富，有着强烈的对比

**[Brogrammar][86]**
 
 ![此处输入图片的描述][87]
 
 扁平而且性感的设计。


附录参考文章：

 - [sublime推荐必备插件][88]
 - [如何优雅地使用Sublime Text][89]


  [1]: http://www.haorooms.com/uploads/images/sublime.jpg
  [2]: http://www.jianshu.com/p/5905f927d01b
  [3]: http://www.open-open.com/news/view/26d731
  [4]: https://sublime.wbond.net/packages/Emmet
  [5]: http://www.xuanfengge.com/wp-content/uploads/2013/12/emmet.gif
  [6]: https://sublime.wbond.net/packages/JsFormat
  [7]: http://www.xuanfengge.com/wp-content/uploads/2013/12/jsFormat.gif
  [8]: https://sublime.wbond.net/packages/LESS
  [9]: http://www.xuanfengge.com/wp-content/uploads/2013/12/less.gif
  [10]: https://sublime.wbond.net/packages/Less2Css
  [11]: https://github.com/wbond/sublime_alignment
  [12]: http://www.xuanfengge.com/wp-content/uploads/2013/12/align.gif
  [13]: https://sublime.wbond.net/packages/Autoprefixer
  [14]: http://www.xuanfengge.com/wp-content/uploads/2013/12/prefixer.gif
  [15]: https://github.com/kemayo/sublime-text-2-clipboard-history
  [16]: http://www.xuanfengge.com/wp-content/uploads/2013/12/keyboard.gif
  [17]: https://github.com/facelessuser/BracketHighlighter
  [18]: http://www.xuanfengge.com/wp-content/uploads/2013/12/highlight.gif
  [19]: https://github.com/kemayo/sublime-text-git
  [20]: http://www.xuanfengge.com/wp-content/uploads/2013/12/git.png
  [21]: https://github.com/mrmartineau/Jquery
  [22]: http://www.xuanfengge.com/wp-content/uploads/2013/12/jquery.gif
  [23]: https://sublime.wbond.net/packages/DocBlockr
  [24]: http://www.xuanfengge.com/wp-content/uploads/2013/12/basic.gif
  [25]: http://www.xuanfengge.com/wp-content/uploads/2013/12/function-template.gif
  [26]: https://sublime.wbond.net/packages/ColorPicker
  [27]: http://www.xuanfengge.com/wp-content/uploads/2013/12/i5KI6SBAfs7Qk.png
  [28]: http://www.xuanfengge.com/wp-content/uploads/2013/12/iY1DDCRG5TsyR.png
  [29]: https://sublime.wbond.net/packages/ConvertToUTF8
  [30]: http://www.xuanfengge.com/wp-content/uploads/2013/12/uy67y.gif
  [31]: https://sublime.wbond.net/packages/AutoFileName
  [32]: http://www.xuanfengge.com/wp-content/uploads/2013/12/autofilename.gif
  [33]: https://sublime.wbond.net/packages/Nodejs
  [34]: http://www.xuanfengge.com/wp-content/uploads/2013/12/ZCFcC.png
  [35]: http://t.cn/zYDBkjL
  [36]: http://www.xuanfengge.com/wp-content/uploads/2013/12/c1608aa0gw1e9dmrd3vxpg209y08d75x.gif
  [37]: https://github.com/SublimeText/TrailingSpaces
  [38]: http://www.xuanfengge.com/wp-content/uploads/2013/12/spac.gif
  [39]: https://github.com/colinta/SublimeFileDiffs
  [40]: http://www.xuanfengge.com/wp-content/uploads/2013/12/diff.gif
  [41]: https://sublime.wbond.net/packages/GBK%20Encoding%20Support
  [42]: http://www.xuanfengge.com/wp-content/uploads/2013/12/zxdcsaf.jpg
  [43]: https://packagecontrol.io/packages/GitGutter
  [44]: http://www.xuanfengge.com/wp-content/uploads/2013/12/cb42e7cddad0c04794b783742ee8f2085e95295a.png
  [45]: https://github.com/SublimeText-Markdown/MarkdownEditing
  [46]: http://www.cnblogs.com/jadeboy/p/4165449.html
  [47]: http://www.jeffjade.com/2015/08/28/2015-08-28-Write-Morkdown/
  [48]: https://github.com/titoBouzout/SideBarFolders
  [49]: http://www.jeffjade.com/img/toss/sublimetext-folder.png
  [50]: http://wbond.net/sublime_packages/terminal
  [51]: https://github.com/wuub/SublimeREPL
  [52]: https://github.com/SublimeText/CTags
  [53]: http://firstleaf.diandian.com/post/2013-03-29/40049695682
  [54]: https://github.com/SublimeLinter
  [55]: http://www.cnblogs.com/lhb25/archive/2012/12/28/best-tools-for-web-development-b.html
  [56]: http://www.cnblogs.com/lhb25/archive/2013/05/02/sublimelinter-for-js-css-coding.html
  [57]: https://github.com/titoBouzout/SideBarEnhancements
  [58]: https://github.com/victorporof/Sublime-HTMLPrettify
  [59]: http://frontenddev.org/article/sublime-does-text-three-plug-ins-html-and-css-js-prettify.html
  [60]: https://github.com/csscomb/CSScomb-for-Sublime
  [61]: https://github.com/kairyou/SublimeTmpl
  [62]: https://github.com/Pleasurazy/Sublime-JavaScript-API-Completions
  [63]: https://wakatime.com/
  [64]: https://wakatime.com/help/plugins/sublime
  [65]: http://7xoosr.com1.z0.glb.clouddn.com/WakaTime.jpg
  [66]: https://wakatime.com/help/plugins/sublime-text
  [67]: https://luolei.org/track-your-time/
  [68]: http://blog.csdn.net/moyan_min/article/details/11530751
  [69]: http://7xq6al.com1.z0.glb.clouddn.com/sublime%E5%BF%AB%E6%8D%B7%E9%94%AE.jpg
  [70]: http://kkga.github.io/spacegray/
  [71]: http://static.oschina.net/uploads/img/201409/12070241_RMc4.png
  [72]: http://ethanschoonover.com/solarized
  [73]: http://static.oschina.net/uploads/img/201409/12070243_tEzd.png
  [74]: http://glaciertheme.com/
  [75]: http://static.oschina.net/uploads/img/201409/12070244_Gl7v.png
  [76]: http://jamiewilson.io/predawn/
  [77]: http://static.oschina.net/uploads/img/201409/12070246_chdY.png
  [78]: https://github.com/thinkpixellab/flatland
  [79]: http://static.oschina.net/uploads/img/201409/12070247_2zco.png
  [80]: https://github.com/daylerees/colour-schemes/blob/master/sublime/legacy.tmTheme
  [81]: http://static.oschina.net/uploads/img/201409/12070249_PVaA.png
  [82]: http://itsthatguy.com/post/70191573560/sublime-text-theme-itg-flat
  [83]: http://static.oschina.net/uploads/img/201409/12070251_sQge.png
  [84]: https://github.com/chriskempson/tomorrow-theme
  [85]: http://static.oschina.net/uploads/img/201409/12070252_MIhr.png
  [86]: https://github.com/kenwheeler/brogrammer-theme
  [87]: http://static.oschina.net/uploads/img/201409/12070254_kAXO.png
  [88]: http://www.xuanfengge.com/practical-collection-of-sublime-plug-in.html
  [89]: http://www.jeffjade.com/2015/12/15/2015-04-17-toss-sublime-text/
