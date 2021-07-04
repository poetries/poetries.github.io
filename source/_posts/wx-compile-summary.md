---
title: 微信小程序反编译
date: 2021-04-20 15:30:41
tags: 小程序
categories: Front-End
---


## 环境准备

1. 安装node
2. 微信开发者工具
3. 安装pc端模拟器工具选择[网易MuMu](http://mumu.163.com)，简单易操作

需要安装以下两个软件，搜索框直接搜索即可

![](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/23931618899946_.pic_hd.jpg)

- 微信：登录上模拟器微信打开需要下载的小程序
- RE文件管理器：需要设置root权限，设置-权限（查看小程序压缩包）

![](http://img-repo.poetries.top/images/20210704101200.png)

4. [下载反编译工具](https://github.com/xuedingmiaojun/wxappUnpacker)

```bash
cd wxappUnpacker

npm install
```

## 获取小程序压缩包

- 打开模拟器的微信并登录
- 在模拟器微信的下拉小程序找到小程序
- 打开小程序等待加载之后就可以去找源码包了（注意：每个页面都浏览一遍，确保子包都加载下载下来）
- 打开RE文件管理器,进入到以下路径查找源码包(可以根据下载时间区分出你想要的源码包)

![](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/23941618900725_.pic_hd.jpg)

![](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/23951618900849_.pic_hd.jpg)

![](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/23961618900932_.pic_hd.jpg)

![](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/23971618901001_.pic_hd.jpg)

选择压缩文件发送给好友保存到电脑上

![](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/23981618901112_.pic_hd.jpg)

> 使用adb命令快速拉取 `adb pull /data/data/com.tencent.mm/MicroMsg/056e5e31623203e0efe74762a2584f40/appbrand/pkg`

**主流安卓模拟器连接方式:**

- 夜神模拟器：`adb connect 127.0.0.1:62001`
- 逍遥安卓模拟器：`adb connect 127.0.0.1:21503`
- 天天模拟器：`adb connect 127.0.0.1:6555`
- 海马玩模拟器：`adb connect 127.0.0.1:53001`
- 网易MUMU模拟器：`adb connect 127.0.0.1:7555` MacOS: `adb connect 127.0.0.1:5555`
- genymotion模拟器：`adb connect 127.0.0.1:5555`
- 谷歌原生模拟器：`adb connect <设备的IP地址>：5555`


## 编译主包

**执行命令**

```bash
# _-1215506245_427.wxapkg 主包
$ ./bingo.sh 小程序压缩包/_-1215506245_427.wxapkg
```

**输出结果**

![](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/2221618902029_.pic_hd.jpg)
![](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/2231618902381_.pic_hd.jpg)

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

## 编译分包

```
命令格式： ./bingo.sh 分包.wxapkg -s=主包目录
```

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

将分包内容拷贝至主包相应目录

![](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/2241618902951_.pic_hd.jpg)

> 重复以上过程，把所有的分包都拷贝到主包对应的目录

## 导入微信开发者工具

- 打开微信开发者工具，导入项目，选择随机appId测试
- 注意在项目设置中勾选不校验合法域名

![](https://hyzmj.oss-cn-shenzhen.aliyuncs.com/compile/2251618903031_.pic_hd.jpg)

**注意**

`miniprogram_npm`包可能下载源码的时候没有完整合并，具体看报错提示处理
