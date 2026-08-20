---
title: 微信小程序反编译实战 从 wxapkg 包还原可运行源码
description: 用安卓模拟器 + adb 拉取微信小程序的 wxapkg 包，再用 wxappUnpacker 还原成 wxml、wxss、js 源码，讲清包结构、主包分包差异和导入开发者工具的全过程。
date: 2021-04-20 15:30:41
tags:
  - 小程序
  - 反编译
  - wxapkg
categories: Front-End
---

接手过一个交接得很潦草的项目，线上小程序还在跑，源码只剩半个仓库，最后一次提交是一年前，构建产物和代码对不上。找前同事要，人早就离职了。这种时候唯一还能拿到完整逻辑的地方，就是微信客户端本地缓存的那份小程序包。

这篇是我把一个带 6 个分包的小程序从模拟器里整包捞出来、还原成能在微信开发者工具里跑起来的源码目录的完整记录。全程用的是开源工具 `wxappUnpacker`，中间那几百行看着吓人的日志我会拆开讲，它们其实把小程序的打包结构说得很清楚。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `wxapkg` 是一种什么格式，头部那几个字段分别代表什么
- 为什么小程序的包里没有 `wxml` 文件，反编译到底在还原什么
- 用安卓模拟器 + RE 文件管理器 / adb 两条路把包拉到本地
- 主包怎么解，输出日志里的每一段在做什么事
- 分包为什么必须带 `-s` 参数，解完怎么合并回主包
- 导入微信开发者工具时那些必须关掉的校验
- `miniprogram_npm` 合并失败等常见报错怎么处理
- 这件事的合规边界在哪里

## 一、先弄明白 wxapkg 到底是个什么文件

先说结论，`wxapkg` 不是 zip，也不是 tar，用解压软件打开只会得到一堆乱码。它是微信自己定义的一种**只读打包格式**，结构简单到有点朴素，一个固定长度的头部 + 一张文件索引表 + 所有文件内容首尾相接。

头部信息在后面的日志里能直接看到：

```
Header info:
  firstMark: 0xbe
  unknownInfo:  0
  infoListLength:  15360
  dataLength:  2960164
  lastMark: 0xed
```

`firstMark` 固定是 `0xbe`，`lastMark` 固定是 `0xed`，这两个魔数是校验用的。解包工具第一件事就是读这两个字节，对不上直接判定文件不是 `wxapkg`，或者被加密改造过。`infoListLength` 是索引表的字节长度，索引表里存的是每个文件的路径名、在数据区的起始偏移和长度。`dataLength` 是数据区总长度。

所以解包这一步本身没什么技术含量，按索引表把 `dataLength` 那段字节切开写到磁盘上就完事了。真正麻烦的是切开之后的事。

你打开解出来的目录会发现一件很反直觉的事，里面**根本没有 `wxml` 文件，也没有一堆分散的 `js` 文件**，只有几个巨大的文件躺在根目录：

| 文件 | 里面装的是什么 |
|------|----------------|
| `app-service.js` | 所有页面、组件、工具模块的逻辑层代码，被打包器串成了一个大文件 |
| `page-frame.html` 或 `app-wxss.js` | 所有 `wxss` 样式，被编译成了 JS 里的字符串数组 |
| `xxx.html` / `app-config.json` | 每个页面的 `wxml` 结构，被编译成了名为 `$gwx` 的一堆函数 |

这就是小程序双线程架构的直接后果。逻辑层跑在 JSCore（iOS）或 V8（安卓）里，视图层跑在 WebView 里，两边通过 `setData` 通信。`wxml` 不是模板字符串，它在构建期就被编译成了生成虚拟 DOM 的 JS 函数；`wxss` 也不是 CSS 文件，它被编译成了带 rpx 换算逻辑的 JS 数组。

那反编译在做什么就清楚了，它做的不是「解压」，是**把这三次编译逆着走一遍**：

- 把 `app-service.js` 按模块边界切回一个个 `.js` 文件（日志里的 `splitJs`）
- 把 `$gwx` 函数还原成 `wxml` 标签结构（日志里的 `Decompile ... wxml`）
- 把 JS 数组里的样式还原成 `wxss`，并猜出原来的 `@import` 关系（日志里的 `Guess wxss`）

后面日志里三段名字奇怪的输出，对应的就是这三件事。如果你对小程序本身的运行机制还不太熟，可以先看看我之前整理的[小程序开发知识梳理](https://feinterview.poetries.top/blog/wx-weapp-summary)，理解双线程之后再回来看这篇会顺很多。

## 二、环境准备

整条链路需要四样东西，缺一样都走不下去。

1. Node.js（反编译工具是纯 Node 写的）
2. 微信开发者工具（最后验证成果用）
3. PC 端安卓模拟器，我用的是[网易 MuMu](http://mumu.163.com)，装完开箱即用，不用自己刷 root
4. 反编译工具本身

为什么非要模拟器？因为小程序包是被微信下载到客户端本地的，iOS 上根本拿不到沙盒目录，Windows/Mac 版微信的小程序缓存也是加密过的。安卓 + root 是目前门槛最低的一条路，而模拟器天生就带 root 开关，比拿真机刷机省事太多。

模拟器装好后，在它自带的应用商店里直接搜这两个包装上：

![在模拟器应用商店搜索并安装微信和 RE 文件管理器](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/23931618899946_.pic_hd.jpg)

- 微信，登录后在模拟器里打开你要研究的那个小程序
- RE 文件管理器，必须先在「设置 - 权限」里把 root 打开，否则它进不了微信的私有数据目录

![在 RE 文件管理器里开启 root 权限](https://blog.poetries.top/img/static/images/20210704101200.png)

这里有个坑要注意，root 开关打开之后 RE 文件管理器第一次访问 `/data` 会弹一个授权框，必须点允许并勾选「记住」，不然每进一层目录弹一次，能烦死人。

最后是[反编译工具 wxappUnpacker](https://github.com/xuedingmiaojun/wxappUnpacker)。这是社区里流传最广的那个 fork，相比原版多了一个 `bingo.sh` 一键脚本，省掉了手动依次调 `wuWxapkg.js`、`wuJs.js`、`wuWxss.js`、`wuWxml.js` 的麻烦。

```bash
cd wxappUnpacker

npm install
```

`npm install` 装的是 `esprima`、`escodegen`、`uglify-es`、`cssbeautify`、`js-beautify` 这一票 AST 解析和美化的包。说实话这套依赖年代比较久，我当时是在 Node 12 上跑通的，后来在更高版本的 Node 上碰到过安装失败，具体见后面「踩坑」那一节。

## 三、把 wxapkg 从模拟器里捞出来

拿包这一步的核心是「让微信主动把包下全」，然后再去它的缓存目录里翻。

操作顺序是这样的：

- 打开模拟器里的微信并登录
- 在下拉小程序面板里找到目标小程序，或者扫码进
- 打开小程序，等首屏加载完
- **每个页面都手动点一遍**，尤其是那些藏在二级入口里的页面
- 打开 RE 文件管理器，进到微信的缓存目录去找包

第四步是最容易被跳过、也最容易翻车的一步。小程序默认按分包加载，你不点进那个页面，对应的分包压根不会下载到本地，最后解出来的项目就是缺胳膊少腿的。你想想看，一个电商小程序的下单流程往往整个塞在一个 `subPackage` 里，你只在首页转了一圈，捞回来的就只有主包。

包在这个路径下面：

```
/data/data/com.tencent.mm/MicroMsg/<32位用户哈希>/appbrand/pkg
```

中间那段 32 位十六进制是当前登录微信号的目录哈希，每个账号不一样，直接照抄我的路径是找不到的，得进 `MicroMsg` 目录自己看。如果里面有多个哈希目录，挑修改时间最新的那个，那是当前登录的账号。

![用 RE 文件管理器进入 data/data 目录](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/23941618900725_.pic_hd.jpg)

![定位到 com.tencent.mm 下的 MicroMsg 目录](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/23951618900849_.pic_hd.jpg)

![进入用户哈希目录下的 appbrand 目录](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/23961618900932_.pic_hd.jpg)

![pkg 目录下按修改时间排列的 wxapkg 包](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/23971618901001_.pic_hd.jpg)

`pkg` 目录里会躺着一堆命名规律很怪的 `.wxapkg` 文件，像 `_-1215506245_427.wxapkg` 这种。这里不用猜，**按修改时间倒序排**，你刚才操作的那个小程序的包一定挤在最前面几个，文件最大的那个通常就是主包，剩下几个小的是分包。

拿到手之后，最土但最稳的传输方式是直接在模拟器微信里发给文件传输助手：

![选中压缩文件发送给好友传到电脑上](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/23981618901112_.pic_hd.jpg)

### 用 adb 一次性拉走整个目录

上面那套点点点的流程包一多就很崩溃，包名还带下划线和负号，手动挑容易挑漏。更省事的做法是走 `adb`，直接把整个 `pkg` 目录拖到本地。

先确认设备是不是连上了：

```bash
adb get-state
```

如果返回 `error: no devices/emulators found`，说明 adb 还没和模拟器握上手。模拟器其实就是个跑在本机上的安卓设备，通过一个固定端口暴露 adb 服务，各家端口号不一样：

- 夜神模拟器：`adb connect 127.0.0.1:62001`
- 逍遥安卓模拟器：`adb connect 127.0.0.1:21503`
- 天天模拟器：`adb connect 127.0.0.1:6555`
- 海马玩模拟器：`adb connect 127.0.0.1:53001`
- 网易 MUMU 模拟器：`adb connect 127.0.0.1:7555`，MacOS 版是 `adb connect 127.0.0.1:5555`
- genymotion 模拟器：`adb connect 127.0.0.1:5555`
- 谷歌原生模拟器：`adb connect <设备的IP地址>:5555`

MUMU 在 Windows 和 macOS 上端口不一致这点我卡过一会儿，Mac 上照着网上抄的 `7555` 一直连不上，换成 `5555` 才通。连上之后 `adb get-state` 会返回 `device`，这时候就能拉了：

```bash
adb pull /data/data/com.tencent.mm/MicroMsg/056e5e31623203e0efe74762a2584f40/appbrand/pkg
```

路径里那串哈希记得换成你自己的。整个目录拉下来，主包分包一个不漏，比手动挑靠谱得多。

## 四、编译主包

包到手了，接下来是重头戏。先解主包，因为分包解包时要拿主包目录当参照。

```bash
# _-1215506245_427.wxapkg 主包
$ ./bingo.sh 小程序压缩包/_-1215506245_427.wxapkg
```

`bingo.sh` 是那个 fork 加的一键脚本，它内部就是按顺序调用 `wuWxapkg.js`，后者再依次触发解包、拆 JS、还原 wxss、还原 wxml。你也可以自己一个一个调，但没必要。

跑起来之后终端会疯狂滚屏：

![终端里滚动输出的解包日志](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/2221618902029_.pic_hd.jpg)
![解包完成后生成的项目目录结构](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/2231618902381_.pic_hd.jpg)

这几百行日志值得逐段看一遍，它把小程序的打包结构全招了。下面我按阶段拆开讲。

```
node /Users/poetry/Downloads/小程序反编译工具/wuWxapkg.js
Unpack file 小程序压缩包/_-1215506245_427.wxapkg...

Header info:
  firstMark: 0xbe
  unknownInfo:  0
  infoListLength:  15360
  dataLength:  2960164
  lastMark: 0xed

File list info:
  fileCount:  375
Saving files...
Unpack done.
Split app-service.js and make up configs & wxss & wxml & wxs...
deal config ok
deal js ok
deal wxss.js ok
deal css ok
=======================================================
这个小程序采用了分包
子包个数为:  6
=======================================================
```

### 4.1 头部校验和文件清点

第一段日志信息量其实很大。`firstMark: 0xbe` 和 `lastMark: 0xed` 对上了，说明这是一个标准未加密的 `wxapkg`。`fileCount: 375` 是索引表里登记的文件数，`dataLength: 2960164` 差不多 2.8MB，这就是主包的实际体积。

小程序主包有 2MB 的硬限制（当年是 2MB，后来放宽到 4MB，整包 20MB），这里 2.8MB 已经超了单包旧限额，所以开发者才不得不上分包。工具也看出来了，紧跟着打出「这个小程序采用了分包，子包个数为 6」。这行提示很关键，它等于提前告诉你，后面还有 6 个 `.wxapkg` 要解，主包解完只是完成了一小半。

`deal config ok` / `deal js ok` / `deal wxss.js ok` / `deal css ok` 这四行是预处理，把 `app-config.json`、`app-service.js`、`app-wxss.js` 这几个大文件先读进内存并做初步切分。

### 4.2 还原自定义组件的 wxml

接下来是最长的一段，一行 `Decompile xxx.wxml...` 跟一行 `Decompile success!`。这一段在干的事就是前面说的「把 `$gwx` 函数逆回标签结构」。

先是项目自己写的业务组件：

```
Decompile ./components/articlelist/articlelist.wxml...
Decompile success!
Decompile ./components/bigplate/bigplate.wxml...
Decompile success!
Decompile ./components/chart/chart.wxml...
Decompile success!
Decompile ./components/collect/collect.wxml...
Decompile success!
Decompile ./components/community/community.wxml...
Decompile success!
Decompile ./components/emptycart/emptycart.wxml...
Decompile success!
Decompile ./components/f2-canvas/index.wxml...
Decompile success!
Decompile ./components/findSell/findSell.wxml...
Decompile success!
Decompile ./components/footer/footer.wxml...
Decompile success!
Decompile ./components/formtea/formtea.wxml...
Decompile success!
Decompile ./components/goodList/goodList.wxml...
Decompile success!
Decompile ./components/guideList/guideList.wxml...
Decompile success!
Decompile ./components/hotplate/hotplate.wxml...
Decompile success!
Decompile ./components/icons/icons.wxml...
Decompile success!
Decompile ./components/navSimple/navSimple.wxml...
Decompile success!
Decompile ./components/newProductList/newProductList.wxml...
Decompile success!
Decompile ./components/newRetail/newRetail.wxml...
Decompile success!
Decompile ./components/newSellList/newSellList.wxml...
Decompile success!
Decompile ./components/popup/popup.wxml...
Decompile success!
Decompile ./components/productlist/productlist.wxml...
Decompile success!
Decompile ./components/publish/publish.wxml...
Decompile success!
Decompile ./components/reload/reload.wxml...
Decompile success!
Decompile ./components/retail/retail.wxml...
Decompile success!
Decompile ./components/searchcommunity/searchcommunity.wxml...
Decompile success!
Decompile ./components/searchretail/searchretail.wxml...
Decompile success!
Decompile ./components/tarBar/tarbar.wxml...
Decompile success!
Decompile ./components/tea/tea.wxml...
Decompile success!
Decompile ./components/teaLarge/teaLarge.wxml...
Decompile success!
Decompile ./components/tealist/tealist.wxml...
Decompile success!
Decompile ./components/theme/theme.wxml...
Decompile success!
```

光看这份组件清单，这个项目的业务形态就已经很清楚了。`articlelist`、`community`、`publish`、`searchcommunity` 是内容社区那一摊，`goodList`、`productlist`、`emptycart`、`retail`、`newRetail` 是电商那一摊，`chart` 和 `f2-canvas` 说明有数据图表，`tarBar` 是自定义 tabBar。反编译最实用的场景之一就在这，你还没读一行代码，靠目录结构就能把对方的模块划分摸个七七八八。

顺带说一句，`tarBar/tarbar.wxml` 这个目录名拼错了，正确的写法是 `tabBar`。这种 typo 在还原出来的代码里会原样保留，因为它本来就是人家源码里的写法。

然后是通过 npm 引入的第三方组件库，全部躺在 `miniprogram_npm` 下面：

```
Decompile ./miniprogram_npm/@vant/weapp/action-sheet/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/area/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/button/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/calendar/calendar.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/calendar/components/header/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/calendar/components/month/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/calendar/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/card/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/cell-group/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/cell/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/checkbox-group/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/checkbox/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/circle/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/col/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/collapse-item/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/collapse/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/count-down/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/datetime-picker/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/dialog/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/divider/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/dropdown-item/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/dropdown-menu/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/empty/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/field/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/goods-action-button/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/goods-action-icon/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/goods-action/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/grid-item/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/grid/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/icon/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/image/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/index-anchor/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/index-bar/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/info/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/loading/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/nav-bar/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/notice-bar/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/notify/index.wxml...
Decompile success!
```

这里得插一句，`miniprogram_npm` 并不是 `node_modules`，它是微信开发者工具点了「构建 npm」之后生成的产物目录。开发者工具会把 `node_modules` 里的小程序组件库摘出来、做一遍依赖打平和裁剪，再放进 `miniprogram_npm`。真正打进 `wxapkg` 的是后者。

这个区别很要命，因为它意味着**你反编译出来的 `miniprogram_npm` 是构建产物，不是原始依赖**。等下导入开发者工具的时候，如果它认为需要重新构建 npm，而你手上又没有 `package.json` 和 `node_modules`，就会报错。后面「踩坑」那节会说怎么绕。

剩下的 vant 组件继续刷：

```
Decompile ./miniprogram_npm/@vant/weapp/overlay/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/panel/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/picker-column/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/picker/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/picker/toolbar.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/popup/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/progress/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/radio-group/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/radio/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/rate/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/row/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/search/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/share-sheet/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/share-sheet/options.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/sidebar-item/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/sidebar/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/skeleton/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/slider/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/stepper/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/steps/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/sticky/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/submit-bar/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/swipe-cell/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/switch/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/tab/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/tabbar-item/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/tabbar/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/tabs/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/tag/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/toast/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/transition/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/tree-select/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/@vant/weapp/uploader/index.wxml...
Decompile success!
Decompile ./miniprogram_npm/wechat-miniprogram-rate/index.wxml...
Decompile success!
```

组件还原完，最后才轮到页面级的 `wxml`。注意这里只有 6 个页面加一个 `wxParse`：

```
Decompile ./pages/community/community.wxml...
Decompile success!
Decompile ./pages/efamily/efamily.wxml...
Decompile success!
Decompile ./pages/homepage/homepage.wxml...
Decompile success!
Decompile ./pages/index/index.wxml...
Decompile success!
Decompile ./pages/my2/my2.wxml...
Decompile success!
Decompile ./pages/retailnew/retailnew.wxml...
Decompile success!
Decompile ./wxParse/wxParse.wxml...
Decompile success!
```

主包只有 6 个页面，说明绝大部分页面都被挪进分包了，符合前面「子包个数为 6」的判断。那个 `wxParse` 是个老牌的富文本解析库，用来在小程序里渲染 HTML 字符串，因为小程序原生 `rich-text` 组件早期支持的标签有限，很多项目都会引它。

### 4.3 拆分 app-service.js

`wxml` 还原完，工具开始处理逻辑层。日志里 `Guess wxss(first turn)...` 和 `splitJs:` 挨在一起打出来，看着像交错了，实际是两个阶段的输出恰好挤到一块了。

`splitJs` 这一步是整个反编译里最有价值的一环。前面说过，打包时所有 JS 模块被塞进了一个 `app-service.js`，里面是形如 `__wxAppCode__['xxx.js'] = function(){...}` 的注册结构。工具做的事是把这些 key 当成原始路径，一个个 `mkdir -p` 出来再写回去。所以下面这一长串路径，其实就是**这个小程序原始工程的完整目录树**：

```
Guess wxss(first turn)...
splitJs: /Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427/app-service.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 address.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 aes.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 ajaxMethods/ajax.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 api.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 apiFunctions.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 common/canvas.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 common/chart.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 common/common.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 common/const.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/f2-canvas/miniprogram_npm/@antv/wx-f2/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/calendar/utils.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/circle/canvas.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/common/color.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/common/component.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/common/utils.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/common/version.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/count-down/utils.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/definitions/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/definitions/weapp.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/dialog/dialog.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/field/props.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/mixins/basic.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/mixins/button.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/mixins/link.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/mixins/open-type.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/mixins/page-scroll.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/mixins/touch.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/mixins/transition.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/notify/notify.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/picker/shared.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/toast/toast.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/uploader/shared.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/uploader/utils.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/flyio/engine-wrapper.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/flyio/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/jsbn/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/miniprogram-sm-crypto/index.js
```

前半段基本都是基础设施。`aes.js`、`jsbn/index.js`、`miniprogram-sm-crypto/index.js` 三个凑在一起，说明这个小程序在客户端做了不少加解密，`jsbn` 是大数运算库（RSA 常配它），`miniprogram-sm-crypto` 是国密 SM2/SM3/SM4 的小程序版实现，多半是接了某些对合规有要求的接口。`flyio` 是当年很流行的一个跨端 HTTP 库，用来统一封装 `wx.request`。`@antv/wx-f2` 是 AntV F2 的小程序版本，对应前面那个 `f2-canvas` 组件。

接着往下是业务代码，`module/` 目录一眼就是接口层：

```
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/address.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/ads.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/article.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/average.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/cart.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/chat.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/common.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/community.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/customer.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/edit.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/login.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/order.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/plate.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/postage.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/product.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/profession.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/publish.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/rate.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/recommend.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/register.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/reply.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/require.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/retail.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/search.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/settings.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/shop.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/statistics.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/stock.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/tea.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 module/vouchercenter.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 public.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 qqmap-wx-jssdk1.0/qqmap-wx-jssdk.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 qqmap-wx-jssdk1.0/qqmap-wx-jssdk.min.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 request.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 server.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 settings.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 tools.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 util.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 utils/log.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 utils/md5.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 utils/util.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 utils/wxcharts.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 wxParse/html2json.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 wxParse/htmlparser.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 wxParse/showdown.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 wxParse/wxDiscode.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 wxParse/wxParse.js
```

`module/` 下面 30 个文件按业务域切得挺整齐，`login`、`order`、`cart`、`product`、`community` 各管一摊，配合根目录的 `request.js`、`api.js`、`server.js`，是很典型的「请求封装 + 接口按域拆文件」结构。`qqmap-wx-jssdk1.0` 是腾讯地图的小程序 SDK，`.js` 和 `.min.js` 两份都打进包了，这其实是个体积浪费，压缩版和未压缩版留一个就够。

最后是入口和组件的逻辑文件：

```
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 app.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/articlelist/articlelist.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/bigplate/bigplate.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/chart/chart.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/collect/collect.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/community/community.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/emptycart/emptycart.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/f2-canvas/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/findSell/findSell.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/footer/footer.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/formtea/formtea.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/goodList/goodList.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/guideList/guideList.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/hotplate/hotplate.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/icons/icons.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/navSimple/navSimple.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/newProductList/newProductList.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/newRetail/newRetail.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/newSellList/newSellList.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/popup/popup.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/productlist/productlist.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/publish/publish.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/reload/reload.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/retail/retail.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/searchcommunity/searchcommunity.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/searchretail/searchretail.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/tarBar/tarbar.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/tea/tea.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/teaLarge/teaLarge.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/tealist/tealist.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 components/theme/theme.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/action-sheet/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/area/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/button/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/calendar/components/header/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/calendar/components/month/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/calendar/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/card/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/cell-group/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/cell/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/checkbox-group/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/checkbox/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/circle/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/col/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/collapse-item/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/collapse/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/count-down/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/datetime-picker/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/dialog/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/divider/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/dropdown-item/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/dropdown-menu/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/empty/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/field/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/goods-action-button/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/goods-action-icon/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/goods-action/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/grid-item/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/grid/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/icon/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/image/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/index-anchor/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/index-bar/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/info/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/loading/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/nav-bar/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/notice-bar/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/notify/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/overlay/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/panel/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/picker-column/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/picker/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/popup/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/progress/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/radio-group/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/radio/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/rate/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/row/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/search/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/share-sheet/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/share-sheet/options.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/sidebar-item/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/sidebar/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/skeleton/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/slider/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/stepper/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/steps/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/sticky/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/submit-bar/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/swipe-cell/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/switch/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/tab/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/tabbar-item/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/tabbar/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/tabs/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/tag/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/toast/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/transition/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/tree-select/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/@vant/weapp/uploader/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 miniprogram_npm/wechat-miniprogram-rate/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 pages/index/index.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 pages/community/community.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 pages/my2/my2.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 pages/homepage/homepage.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 pages/efamily/efamily.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427 pages/retailnew/retailnew.js
Splitting "/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427/app-service.js" done.
```

### 4.4 猜回 wxss 的引用关系

JS 拆完，最后一个阶段处理样式，这也是唯一一个日志里带「猜」字的环节：

```
Regard /Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427/miniprogram_npm/@vant/weapp/area/index.wxss as pure import file.
Import count info: {"./miniprogram_npm/@vant/weapp/common/index.wxss":69}
Guess wxss(first turn) done.
Generate wxss(second turn)...
Generate wxss(second turn) done.
Save wxss...
saveDir: /Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_-1215506245_427
Split and make up done.
Delete files...
Deleted.

File done.
Total use: 17898.449ms
(base)
```

这段要拆开看。`Regard ... as pure import file` 是说 `area/index.wxss` 里没有自己的样式规则，只有 `@import`，所以工具把它标成纯引用文件。`Import count info` 那行更有意思，`common/index.wxss` 被引用了 69 次，vant 的每个组件都会 import 一次公共变量表。

为什么这一步要「猜」？因为 `wxss` 在打包时被编译成了 JS 里的一个数组，每一项是一段样式，`@import` 关系被展开压平了，原始的文件边界在产物里并不存在。工具只能反过来做统计，哪些样式片段被重复引用了 N 次，就推断它原本是个被 import 的公共文件，然后再把它抽出来、在引用方补回 `@import` 语句。所以才有 first turn 和 second turn 两轮。

这也意味着**还原出来的 `wxss` 拆分方式不一定和原始工程完全一致**，样式效果是对的，但文件切分可能和作者当初写的不一样。我这次跑下来视觉上没看出差异，不过如果原项目用了很多层级很深的 import，这块出偏差是完全可能的。

`Delete files...` 是清理中间产物，把 `app-service.js`、`app-wxss.js` 这些大文件删掉，留下拆好的目录。`Total use: 17898.449ms` 差不多 18 秒，一个 375 个文件的主包这个速度可以接受。

跑完之后进解出来的目录看一眼，`app.json`、`app.js`、`pages/`、`components/` 该有的都有，那主包这一步就算成了。

## 五、编译分包

主包解完，前面日志里提示的那 6 个分包还得一个个来。分包不能直接单独解，命令格式多一个参数：

```
命令格式： ./bingo.sh 分包.wxapkg -s=主包目录
```

`-s` 后面跟的是**主包解出来的那个目录**（相对路径、绝对路径都行，我这里为了演示写成了 `test`）。

为什么必须给主包？因为分包在打包时会做依赖去重，凡是主包里已经有的公共模块、公共样式、自定义组件，分包里**不会再存一份**，只留一个引用。工具解分包时如果不知道主包在哪，就没法把这些引用对上，还原出来的 `wxml` 会缺组件、`wxss` 会缺变量，最后导入开发者工具一片报错。

```
$ ./bingo.sh 小程序压缩包/_1462998946_427.wxapkg -s=test
```

```
node /Users/poetry/Downloads/小程序反编译工具/wuWxapkg.js
Unpack file 小程序压缩包/_1462998946_427.wxapkg...

Header info:
  firstMark: 0xbe
  unknownInfo:  0
  infoListLength:  2070
  dataLength:  512073
  lastMark: 0xed

File list info:
  fileCount:  32
Saving files...
Unpack done.
```

分包的头部和主包一模一样，`firstMark`、`lastMark` 那两个魔数没变，只是小了很多，`dataLength` 512073 大约 500KB，`fileCount` 只有 32。

接下来几行是分包特有的，工具要先算清楚三个路径：

```
now dir: /Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427
param of mainDir: test
sub package word dir: /Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/pages/subPackage/retail
real mainDir: /Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test
Split app-service.js and make up configs & wxss & wxml & wxs...
deal js ok
deal sub html ok
splitJs: /Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/pages/subPackage/retail/app-service.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/confirmorder/confirmorder.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/retaildetail/retaildetail.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/retailsearch/retailsearch.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/product/product.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/cart/cart.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/addresslist/addresslist.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/newaddress/newaddress.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/morerecommend/morerecommend.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/website/website.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/writecomment/writecomment.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/comment/comment.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/vouchercenter/vouchercenter.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/faq/faq.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/faqdetail/faqdetail.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/hotlist/hotlist.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/dwhindex/dwhindex.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/addTeaCommnet/addTeaCommnet.js
/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test pages/subPackage/retail/pages/rule/rule.js
Splitting "/Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/pages/subPackage/retail/app-service.js" done.
```

`sub package word dir` 这行是关键，它告诉你这个分包在原工程里的挂载路径是 `pages/subPackage/retail`。这个路径不是工具瞎猜的，是从分包自己的配置里读出来的，等下合并回主包时就得原样放到这个位置。`real mainDir` 则是解析后的主包绝对路径。

从拆出来的 18 个页面看，这个分包装的是完整的零售交易链路，`product` 商品详情、`cart` 购物车、`confirmorder` 确认订单、`addresslist` 和 `newaddress` 收货地址、`comment` 和 `writecomment` 评价、`vouchercenter` 领券中心。回到前面那句提醒，你要是在模拟器里只逛了首页没走一遍下单流程，这 500KB 压根不会下载到本地。

然后同样是还原这些页面的 `wxml`：

```
Decompile ./pages/subPackage/retail/pages/addTeaCommnet/addTeaCommnet.wxml...
Decompile success!
Decompile ./pages/subPackage/retail/pages/addresslist/addresslist.wxml...
Decompile success!
Decompile ./pages/subPackage/retail/pages/cart/cart.wxml...
Decompile success!
Decompile ./pages/subPackage/retail/pages/comment/comment.wxml...
Decompile success!
Decompile ./pages/subPackage/retail/pages/confirmorder/confirmorder.wxml...
Decompile success!
Decompile ./pages/subPackage/retail/pages/dwhindex/dwhindex.wxml...
Decompile success!
Decompile ./pages/subPackage/retail/pages/faq/faq.wxml...
Decompile success!
Decompile ./pages/subPackage/retail/pages/faqdetail/faqdetail.wxml...
Decompile success!
Decompile ./pages/subPackage/retail/pages/hotlist/hotlist.wxml...
Decompile success!
Decompile ./pages/subPackage/retail/pages/morerecommend/morerecommend.wxml...
Decompile success!
Decompile ./pages/subPackage/retail/pages/newaddress/newaddress.wxml...
Decompile success!
Decompile ./pages/subPackage/retail/pages/product/product.wxml...
Decompile success!
Decompile ./pages/subPackage/retail/pages/retaildetail/retaildetail.wxml...
Decompile success!
Decompile ./pages/subPackage/retail/pages/retailsearch/retailsearch.wxml...
Decompile success!
Decompile ./pages/subPackage/retail/pages/rule/rule.wxml...
Decompile success!
Decompile ./pages/subPackage/retail/pages/vouchercenter/vouchercenter.wxml...
Decompile success!
Decompile ./pages/subPackage/retail/pages/website/website.wxml...
Decompile success!
Decompile ./pages/subPackage/retail/pages/writecomment/writecomment.wxml...
Decompile success!
Guess wxss(first turn)...
Import count info: {}
Guess wxss(first turn) done.
Generate wxss(second turn)...
Generate wxss(second turn) done.
Save wxss...
saveDir: /Users/poetry/Downloads/小程序反编译工具/小程序压缩包/_1462998946_427/test
```

注意最后那个 `saveDir` 已经指到 `_1462998946_427/test` 里去了，也就是你传进去的主包目录副本。`Import count info: {}` 是空的，因为公共样式都在主包里，分包自己没有需要抽取的重复片段。

### 合并回主包

解完不算完，还得把分包的产物挪到主包目录的对应位置上去，路径就是前面日志里那个 `sub package word dir`。

![把分包解出的目录拷贝到主包对应路径下](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/2241618902951_.pic_hd.jpg)

> 重复以上过程，把所有的分包都拷贝到主包对应的目录

6 个分包就得跑 6 遍，每次 `-s` 都指向同一个主包目录。这一步没什么技巧，就是耐心，路径放错一层就会出现「组件找不到」的报错。合并完之后建议对着主包 `app.json` 里的 `subPackages` 字段核一遍，每个 `root` 声明的目录是不是都真的存在了。

## 六、导入微信开发者工具

到这一步，手上已经是一个结构完整的小程序工程目录了，可以拿开发者工具跑起来验证。

- 打开微信开发者工具，导入项目，AppID 选「测试号」或者随机生成一个
- 在项目设置里勾上「不校验合法域名、web-view 域名、TLS 版本以及 HTTPS 证书」

![项目设置里勾选不校验合法域名等选项](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/2251618903031_.pic_hd.jpg)

第二项必须勾，原因很直接。合法域名是绑在原小程序的 AppID 上的后台配置，你用测试号导入，这份白名单不会跟着过来，所有 `wx.request` 都会被拦下来报 `url not in domain list`。勾掉校验之后请求才能发出去。

当然，请求发出去多半也是 401 或者签名错误，因为业务接口通常要 `code2session` 换来的 openid 和后端下发的 token。所以这套流程能还原的是**前端代码结构和交互逻辑**，不是一个能真正下单的应用。这点心里要有数。

## 七、这条路上我踩过的坑

**`miniprogram_npm` 合并不完整。** 这是最高频的一个。前面说过它是构建产物而不是依赖源码，包被拆成多个 `wxapkg` 时，`miniprogram_npm` 的内容也可能被分散到不同包里。表现就是导入之后报某个 vant 组件找不到。处理办法是看报错提示缺哪个组件，去其它已解出的分包目录里搜同名路径，手动补进去。实在补不齐的，直接按报错的版本号自己 `npm i @vant/weapp` 再点一次「构建 npm」，通常也能救回来。

**Node 版本。** `wxappUnpacker` 依赖里有 `uglify-es`，这个包已经停止维护好几年了。我是在 Node 12 上跑通的，后来在新机器上用较新的 Node 装依赖遇到过报错。如果你 `npm install` 就挂了，先别怀疑自己，用 `nvm` 切个老版本再试。这块我没有在每个 Node 大版本上都验证过，只能说 12/14 是稳的。

**解出来的代码是压缩过的。** `app-service.js` 里存的本来就是构建后的代码，变量名可能已经被混淆成 `a`、`b`、`t`。工具会用 `js-beautify` 做格式化，缩进和换行能恢复，语义化的变量名恢复不了。所以你拿到的是「结构清晰但命名难看」的代码，读起来还是要费点劲。

**分包解错顺序。** 一定要先解主包再解分包。我第一次图快，拿分包先跑了一遍不带 `-s`，结果解出来一堆残缺的 `wxml`，还得删掉目录从头再来。

**包认不出来。** 如果 `firstMark` 校验就失败，说明这个包做了加固或者用了新的打包格式。这种情况这套工具直接投降，我也没继续深挖。

## 八、这件事的边界在哪

必须把话说在前面。小程序的前端代码虽然天然会下发到客户端，但它仍然是有著作权的作品。反编译他人小程序去抄一套一模一样的产品、或者绕过付费逻辑，风险是实打实的。

我自己认为站得住脚的用途只有这么几种：找回自己公司丢失的历史源码；排查线上包和仓库代码对不上的问题；做安全审计，看看有没有把密钥硬编码进前端；纯粹的学习研究，看看别人的目录怎么划分、组件怎么拆。

顺带说一句，这件事反过来也提醒我们，**任何写进小程序前端的东西都等于公开**。AppSecret、第三方服务的密钥、内部接口的完整地址，都不该出现在小程序代码里，该走服务端的一定要走服务端。这方面的服务端配套写法我在[小程序发布上线流程整理](https://feinterview.poetries.top/blog/weapp-post)里提过一些。

## 总结

整条链路拆开看其实就三段。第一段是拿包，靠安卓模拟器 + root，路径固定在 `MicroMsg/<哈希>/appbrand/pkg`，进去前记得把小程序的每个页面都点一遍，不然分包不会下载。第二段是解包，`./bingo.sh 主包.wxapkg` 先跑主包，再用 `./bingo.sh 分包.wxapkg -s=主包目录` 逐个解分包并合并回去。第三段是验证，测试号导入，勾掉域名校验。

真正值得记住的不是命令，是那几百行日志暴露出来的结构。`wxapkg` 只是个带 `0xbe` / `0xed` 魔数的简单容器，难的是它装的三样东西都被编译过，`wxml` 变成了 `$gwx` 函数、`wxss` 被压平进 JS 数组、所有模块被串成一个 `app-service.js`。反编译就是把这三次编译逆着走，其中 `wxss` 那一步只能靠引用计数去猜，所以还原度是三者里最低的。

工具能还原结构，还不回来变量名和后端权限。想拿它做「一键复制一个小程序」，不现实，也不合适。

## 参考

- [小程序代码构成 - 微信官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/quickstart/code.html)
- [使用分包 - 微信官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/basic.html)
- [npm 支持与构建 npm - 微信官方文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html)
- [wxappUnpacker 反编译工具](https://github.com/xuedingmiaojun/wxappUnpacker)
- [Android Debug Bridge (adb) 官方文档](https://developer.android.com/tools/adb)
- [前端进阶之旅](https://interview.poetries.top)
