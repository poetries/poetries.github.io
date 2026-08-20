---
title: Cordova 结合 Vue 打包混合 App 从环境搭建到调用原生插件
description: 用 Cordova 把已有的 Vue 项目打包成 Android 和 iOS 应用的完整流程，包含环境搭建、Android Studio 导入报错的逐个排查、插件安装与使用、打包路径配置的三处关键改动，以及在 Vue 组件里调用相机定位等原生能力的两种写法。
date: 2019-10-07 18:10:24
tags:
 - Cordova
 - Vue
 - 混合App
 - Android
categories: Front-End
---

手上有个跑得好好的 `Vue` 项目，产品突然说要上架应用商店。重写一套 `React Native`？没这个人力。学一遍 `Ionic`？那得连 `Angular` 一起学。这种时候 `Cordova` 是成本最低的一条路，它不要求你换框架，只是把你打包好的那堆 `HTML`、`CSS`、`JS` 塞进一个原生壳子里，再给你一座能从 `JS` 喊到原生的桥。

这篇是我当年把 `Vue` 项目用 `Cordova` 打成 App 的完整记录，从装环境、导 `Android Studio`（这一步的报错最多，占了小半篇幅），到装插件调相机定位，再到打包时那三处必改的路径配置。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `Cordova`、`Ionic`、`React Native` 这些打包方案各自适合什么场景
- `Android` 和 `iOS` 两套环境分别要装什么，创建项目时包名为什么必须一次填对
- 导入 `Android Studio` 最常见的五类报错，分别是什么原因、怎么解
- `Cordova` 插件的安装、查看、卸载，以及调原生能力的固定套路
- 把 `Vue` 打包产物塞进 `Cordova` 项目时，那三处不改就白屏的路径配置
- 在 `Vue` 组件里调 `cordova` 插件的两种写法，以及为什么我不推荐用封装库
- 这套技术栈今天的维护状态

## 一、先说清楚这套方案现在的状态

这篇写于 2019 年。`Apache Cordova` 现在已经不再活跃维护，项目退役进了 `Apache Attic` 归档状态，具体以 <https://attic.apache.org/> 上的官方公告为准，我不猜时间点。

所以你要是现在开新项目，别照抄这一套。同样的思路（把 Web 产物塞进原生壳、通过桥调原生能力）现在的主流实现是 `Capacitor`，它是 `Ionic` 团队做的，`API` 设计和 `Cordova` 一脉相承，甚至兼容一部分 `Cordova` 插件，但原生工程是作为源码提交进仓库管理的，出问题能直接改，不像 `Cordova` 那样每次 `prepare` 都重新生成。

那这篇还留着干什么？因为存量项目还在跑，出问题得有地方查；更重要的是，下面第四节那一整段 `Android Studio` 报错排查、第七节那三处路径配置，换成 `Capacitor` 也照样会遇到，它们本来就不是 `Cordova` 独有的问题，是「Web 产物跑在 `WebView` 里」这件事本身带来的。

## 二、Cordova 是什么，和别的方案怎么选

> 我们可以使用`cordova`来打包现有的`vue`、`react`、`angular`应用为`app`，可以借助`cordova`来调用手机设备的原生能力，比如拍照、扫码、定位等

先把当年的几个选项摆开看。

### 2.1 Ionic 3 这条路

> `ionic3=cordova+angular+ionicUI`（Ionic UI组件+ Javascript API+Ionic Native）

- **优点**：它提供了漂亮的`UI`组件库、强大的`JS APi`以及基于调用原生的的`Native APi`,可以让我们快速开发跨平台的混合`APP`以及移动`web`页面。（推荐*）
- **缺点**：`angular` `react` `vue`开发的移动端应用要打包成`app`的时候得重新再学习`ionic`

这个取舍写得挺实在。`Ionic` 给你的是一整套东西，UI 组件、导航、原生封装全包了，从零起一个 App 确实快。但代价是绑定 `Angular`（`Ionic 3` 时代是硬绑定），你原来那个 `Vue` 项目一行都用不上。`Ionic 3` 的完整用法我另外整理了一篇 [混合 App 之 Ionic3 小结篇](https://feinterview.poetries.top/blog/ionic3-summary)，想走这条路可以对着看。

### 2.2 Cordova 这条路

> `cordova`: 可以把`html css js`写的代码打包成`app`，还可以让`js`调用原生的`api`。`cordova`非常成熟、插件也非常多、扩展性也强，10年的历史

`Cordova` 的定位比 `Ionic` 低一层，它不管你 UI 怎么写、路由怎么跳，只干两件事：把 Web 产物包成安装包，以及提供插件机制让 `JS` 能调原生。所以它跟框架无关，这正是它适合「已有项目要上架」这个场景的原因。

**打包App有几个方案**

- `ionic`
- `reactNative`
- `weex`
- `flutter`
- `cordova+vue`
- `cordova+react`
- `cordova+angular`

这几个里，`React Native` 和 `Flutter` 是另一个路子，UI 走原生渲染，性能上限高，但要重写。`Cordova` 系的方案 UI 还是跑在 `WebView` 里，性能天花板受 `WebView` 限制，长列表和复杂动画会明显吃亏。选哪个说到底看你的 App 是「内容展示为主」还是「重交互」，前者用 `Cordova` 完全够，后者别硬上。

## 三、Android 环境搭建

搭 `Android` 环境要装四样东西：

- 安装jdk 、配置jdk
- 安装android studio
- 安装nodejs
- 安装cordova

前三样各自去官网装就行，没什么讲究，`JDK` 记得配 `JAVA_HOME` 环境变量。`Cordova` 走 `npm`：

```bash
## 淘宝源安装
npm install -g cordova --registry=https://registry.npm.taobao.org
```

```
cnpm install -g cordova
```

这两条是当年国内下载慢的应对办法，现在 `npm` 镜像地址已经换成 `https://registry.npmmirror.com` 了，`taobao.org` 那个域名早就停了，照抄会连不上。`cnpm` 我个人不推荐用来装这种全局 CLI，它做的是软链接式的安装，遇到需要读取自身目录结构的工具容易出怪问题，直接用 `npm` 配镜像更稳。

**创建项目 cordova create 项目名称**

> `cordova create 项目名`  `com.公司名.项目名  类名` （建议）

```
cordova create cordovademo02  com.baidu.cordova  Cordovademo	
```

三个参数分别是：本地目录名、应用包名、应用显示名。中间那个包名是重点。

> 创建项目的时候注意包名称：发布上线打包的时候用到包名称，注意

这句必须重视。包名（`Android` 那边叫 `applicationId`，`iOS` 那边叫 `Bundle Identifier`）是应用在商店里的唯一身份，**上架之后就再也改不了了**，改了等于是一个全新的应用，老用户不会收到更新。所以别图省事用 `com.example.demo` 一路跑到底，创建那一刻就填成正式的。

**修改应用包名名称：**

- 修改`config.xml`里面的包名称
- 修改完成以后重新执行`cordova platform add android`

如果一开始填错了，改法在 `config.xml` 根节点的 `id` 属性上。

![在 config.xml 中修改 widget 的 id 属性即应用包名](https://s.poetries.top/gitee/2019/10/cordova/2.png)

改完这里还没完，必须把平台删掉重加。原因是 `platforms/android` 下的原生工程是根据 `config.xml` 生成出来的，包名会被写进 `AndroidManifest.xml`、`build.gradle` 和一堆 `Java` 包目录里，光改 `config.xml` 不重新生成，编出来的还是老包名。这个我踩过，改完直接 build，装到手机上发现新旧两个 App 并存，才反应过来。

> cd 到项目里面 `cd cordovademo02`

- 把`android`的平台添加到项目里面 `cordova platform add android`
- 把项目导入到 `android studio` 进行运行调试  （或者运行   `cordova  run  android`）

导入的时候选 `platforms` 下的 `android` 目录，不是项目根目录。

![在 Android Studio 中导入 platforms 下的 android 工程目录](https://s.poetries.top/gitee/2019/10/cordova/3.png)

这里得建立一个认知：`platforms/` 目录是**生成物**，不是源码。你在 `Android Studio` 里直接改里面的文件，下次 `cordova platform rm/add` 或者某些 `prepare` 操作会把改动冲掉。真需要改原生配置，正确的位置是 `config.xml` 或者写 `hooks` 脚本。

## 四、导入 Android Studio 可能遇到的报错

这一节是当年花时间最多的地方。`Cordova` 生成的 `Android` 工程用的 `Gradle` 版本通常偏老，跟你本机装的 `Android Studio` 未必对得上，加上依赖要从境外仓库拉，各种报错就都来了。

**1. 导入后提示 `Android Studio Error:Connection timed out: connect`**

![Android Studio 导入后提示 Connection timed out 的报错界面](https://s.poetries.top/gitee/2019/10/cordova/4.png)

这是最典型的一个，`Gradle` 要去 `services.gradle.org` 下载 wrapper、去 `jcenter` / `maven` 拉依赖，网络不通就卡在这。

> 解决方案参考：https://blog.csdn.net/u013020000/article/details/73159754

![在 Gradle 设置中配置代理或改用本地 Gradle 发行版](https://s.poetries.top/gitee/2019/10/cordova/5.png)
![配置完成后重新同步 Gradle 的界面](https://s.poetries.top/gitee/2019/10/cordova/6.png)

思路有两条：给 `Gradle` 配代理（`gradle.properties` 里写 `systemProp.http.proxyHost` 那几项），或者把 `gradle-x.x-all.zip` 手动下下来放到本地，再把 `distributionUrl` 改成本地路径。后一条更彻底，因为它连带解决了每次换项目都重新下一遍 wrapper 的问题。国内环境还有第三条路，把 `build.gradle` 里的仓库地址换成阿里云的 `maven` 镜像，依赖拉取速度会有质的变化。

**2. 遇到错误 `failed to find with hash string 'android-26'`**

![提示 failed to find target with hash string android-26 的报错](https://s.poetries.top/gitee/2019/10/cordova/7.png)

> 解决方案点击 图上蓝色链接进行安装

这个报错友好得多，意思是工程要的 `compileSdkVersion` 是 26，而你本机 SDK Manager 里没装这个版本。报错信息里那条蓝色链接点下去 `Android Studio` 会自动帮你装，装完重新同步就好。

**3. `Gradle build` 没有反应**

![Gradle build 长时间没有反应的界面](https://s.poetries.top/gitee/2019/10/cordova/8.png)
![点击 build 按钮触发同步后的进度显示](https://s.poetries.top/gitee/2019/10/cordova/9.png)

> 解决方案 ：点击`build`见图箭头。如果有下载内容 耐心等待 （30分钟-2小时）

「耐心等待 30 分钟到 2 小时」这句是实话，第一次 `Gradle` 同步要下的东西是真多。判断它到底是在下载还是卡死了，看 `Android Studio` 底部状态栏有没有进度条在动，或者去 `~/.gradle/caches` 看目录大小是不是还在涨。都不动的话基本就是网络断了，回去看第 1 条。

**4. 提示 `please configure Android SDK`**

![提示 please configure Android SDK 并给出蓝色 configure 链接](https://s.poetries.top/gitee/2019/10/cordova/10.png)

> 解决方案：点击蓝色 `configure`，然后选择对应的sdk   （前提是sdk已经安装）

这条是工程没关联上 SDK 路径。点 `configure` 指过去就行，前提是 SDK 确实装了。顺手把 `ANDROID_HOME`（新版叫 `ANDROID_SDK_ROOT`）环境变量也配上，因为 `cordova run android` 走的是命令行，它读的是环境变量，不看 `Android Studio` 的设置。

**5. 真机调试时手机连上没有反应**

- 关闭或者卸载自己电脑上面的360手机助手或者其他连手机的软件
- 安装你手机对应的`sdk`

![在 SDK Manager 中安装手机对应版本的 Android SDK](https://s.poetries.top/gitee/2019/10/cordova/11.png)

> 建议 `android 5-到android8` sdk都安装 （安装sdk  ： Tools->SDK Manager）

那些手机助手会抢占 `adb` 端口，还会自己启一个版本不同的 `adb` 进程，两边打架的结果就是设备列表永远是空的。先把它们全关掉，然后跑一次 `adb kill-server && adb devices` 重启服务，多数情况就恢复了。

- 点击右上角对应箭头按钮配置

> 查看当前连接上的手机

![在 Android Studio 顶部设备下拉中确认已连接的手机](https://s.poetries.top/gitee/2019/10/cordova/12.png)

- 手机必须开启调试模式（百度搜 xxx手机开启调试模式）
- 手机拔下来重启`android studio`，重新插入手机重试
- 百度搜（`android studio` 连不上手机...）

开发者模式的入口各家 ROM 藏的位置不一样，通用做法是「设置 → 关于手机 → 连点版本号七次」，然后回设置里找开发者选项，把「USB 调试」打开。插上线手机上会弹一个「允许 USB 调试吗」的确认框，没点这个框也是连不上的，很多人第一次遇到会以为是驱动问题。

**运行项目的几个前提，跑之前挨个确认一遍：**

- `android`手机要连上电脑，并且 `android`手机必须开启调试模式
- `android studio` 必须得安装手机对应的`sdk`
- 关闭360手机助手、xxx手机助手
- 修改项目:  运行`cordova prepare`

最后那条 `cordova prepare` 尤其容易忘。你改的是根目录 `www` 下的文件，原生工程读的是 `platforms/android/app/src/main/assets/www`，`prepare` 干的就是把前者同步到后者。不跑它，你会看到「代码明明改了，App 里还是老样子」这种最费时间的现象。

## 五、iOS 平台搭建 Cordova 环境

`iOS` 这边简单得多，因为苹果的工具链是一整套的：

- 安装`nodejs` 安装`xcode`
- 安装`cordova`

```
cnpm install -g cordova
```

1. 创建项目

> `cordova create 项目名  com.公司名.项目名  类名` （建议）

```
cordova create cordovademo02  com.baidu.cordova  Cordovademo	
```

- 2. `cd  cordovademo02`
- 3. 把ios的平台添加到项目里面  `cordova platform add ios`
- 4. 用xcode打开项目运行

第四步展开一句：用 `Xcode` 打开的是 `platforms/ios` 下的 `.xcworkspace` 文件，不是 `.xcodeproj`。装过插件之后 `Cordova` 会用 `CocoaPods` 管理原生依赖，开错文件的表现是编译时一堆找不到头文件的错。

`iOS` 真机调试和打包上架那一整套证书、描述文件、Archive 的流程，比 `Android` 复杂不少，我单独写了一篇 [Ionic 的 iOS 打包与上架流程](https://feinterview.poetries.top/blog/Ionic-ios-build)，`Cordova` 项目走的是同一套，可以直接对着操作。

## 六、Cordova 插件的使用

> cordova插件拍照插件 、定位插件、文件上传插件 以及vconsole开启真机（手机）调试模式

> 如果我们要在自己的`html`里面调用手机原生的功能（拍照、扫描二维码、获取地理位置...）,借助`cordova`的插件

> `cordova` 官网：https://cordova.apache.org/

插件是 `Cordova` 的核心机制，也是它跟「把网页塞进 WebView」这种土办法拉开差距的地方。一个插件包含两部分：原生侧的实现（`Java` / `Objective-C`），和 `JS` 侧的接口。装插件的时候 `Cordova` 会把原生代码拷进各平台工程、把配置写进清单文件，`JS` 侧的接口则挂到全局对象上。

**如何使用插件：**

- 安装插件 `cordova plugin  add  插件名称`
- 复制文档使用

**查看已经安装的插件：**

```
cordova plugin list
```

**卸载插件：**

```
cordova plugin rm  cordova-plugin-network-information
```

`plugin list` 在接手别人的项目时特别有用，先跑一遍看装了什么、版本多少。

下面是几个最常用的插件，官方文档链接我保留了原文的：

**1. 设备插件**

> https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-device/index.html

```bash
## 安装 看文档使用
cordova plugin add cordova-plugin-device
```

读设备型号、系统版本、`UUID` 这些信息，没有权限弹窗，最适合拿来验证「插件机制到底通没通」。第一次接插件建议先装它跑一遍。

**2. 网络状态插件**

> https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-network-information/index.html

```bash
# 安装 看文档使用
cordova plugin add cordova-plugin-network-information
```

它给的是 `navigator.connection.type`，能区分 wifi / 4g / none。做「弱网提示」「大文件只在 wifi 下下载」这类功能靠它。

**3. 定位插件**

> https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-geolocation/index.html

```
cordova plugin add cordova-plugin-geolocation
```

- 注意改代码以后要运行：`cordova prepare`
- 注意：要引入`cordova.js`
- 注意：项目里面不要有中文文件夹、不要有`zip`包 、不要有中文文件

这三条注意都是血泪。第三条尤其隐蔽：路径里带中文或者有 `zip` 包，`Gradle` 打包时可能因为编码问题直接失败，报错信息还完全不指向真实原因，能排查很久。养成项目路径全英文的习惯就好。

**4. 拍照插件**

> https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-camera/index.html

> 注意：`ios`拍照完成以后调用 `navigator.camera.cleanup(onSuccess, onFail)`

这条 `cleanup` 是 `iOS` 独有的。用 `FILE_URI` 方式拿照片时，`Cordova` 会把图写到临时目录，不清理的话连拍几十张之后 App 占用会明显涨上去。`Android` 上调了不报错，写上就是了。

**5. 文件上传或下载**

- 文件插件: https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html
- 文件传输插件：https://www.npmjs.com/package/cordova-plugin-file-transfer

`file-transfer` 这个插件后来被官方标成不再维护了，推荐的替代是直接用标准的 `XMLHttpRequest` 或者 `fetch` 传 `Blob`。现在 `WebView` 对大文件上传的支持已经够用，少装一个插件就少一份原生侧出问题的可能。

## 七、Cordova 打包 Vue 项目

前面都是壳子，这一节才是「结合 Vue」的正题。

> `cordova`: 可以把`html css js`写的代码打包成`app`，还可以让`js`调用原生的 `api`

> `cordova+vue`、`cordova+react` 、`cordova+angular` 、 `cordova+jquery`

思路其实很朴素：`Vue` 该怎么开发还怎么开发，打包出静态产物，把产物丢进 `Cordova` 项目的 `www` 目录，然后 `prepare`。整个过程 `Cordova` 完全不关心你用的什么框架。

**创建vue项目的时候有两种方式：**

```
vue init webpack 项目名称
```

```
vue init webpack-simple  项目名称
```

这是 `vue-cli 2.x` 时代的命令，现在的 `Vue CLI` 用 `vue create`，配置项也搬到了 `vue.config.js` 里，下面要改的那几处对应关系我会一并说。

> 正式发布`vue`的项目：（把`vue`项目打包成浏览器能解析的代码）

```bash
npm run build # 把vue打包成浏览器能解析的代码
```

**把vue项目用cordova打包成app：**

- `npm run build` （注意：图片目录的路径）
- 把`vue`打包后的静态资源复制到`cordova`项目里面
- 运行 `cordova prepare`

三步里最容易出事的是第一步那个括号。为什么要注意路径？因为 `Vue` 默认打包出来的资源引用是绝对路径（形如 `/static/js/app.js`），在浏览器里访问 `http://localhost` 没问题，但 App 里页面是通过 `file://` 协议加载本地文件的，绝对路径 `/static/...` 会被解析到文件系统根目录，结果就是**白屏，控制台一片 404**。

这也是这一节唯一的核心知识点：把绝对路径改成相对路径。两种脚手架的改法不同。

**vue init webpack-simple 创建的项目**

```bash
vue init webpack-simple  #项目名称 
```

- 修改：`webpack.config.js` 里面  `publicPath`
- 把`publicPath: '/dist/'`    改为  `publicPath: 'dist/'`
- 修改`index`里面引入`dist`的路径,去掉前面的`/` (重要)

**vue init webpack 创建的项目**

- 修改：`config/index.js` 把 `assetsPublicPath: '/'`,	
- 修改成 `assetsPublicPath: './'`

![在 config/index.js 中把 assetsPublicPath 由斜杠改为点斜杠](https://s.poetries.top/gitee/2019/10/cordova/14.png)

要点都是同一个：**去掉开头那个斜杠**。用现在的 `Vue CLI` 的话，对应的配置是 `vue.config.js` 里的 `publicPath: './'`；`Vite` 项目则是 `vite.config.js` 里的 `base: './'`。名字换了，要解决的问题一模一样。

配好之后打包、拷贝、`prepare`，用 `Xcode` 跑起来就是这个效果：

![Vue 项目通过 Cordova 打包后在 iOS 模拟器中运行的界面](https://s.poetries.top/gitee/2019/10/cordova/16.png)

> ios下打开效果。这样很方便打包原有的项目为app

顺手补两个我后来加上的实践。一是把「打包 + 拷贝 + prepare」这三步写成一条 `npm` 脚本，不然手动拷贝迟早会漏；二是路由要用 `hash` 模式，`history` 模式在 `file://` 协议下是不工作的，这个坑比路径问题还隐蔽，因为首页能打开，一跳转就白屏。

## 八、在 Vue 里调用 Cordova 插件

产物能跑起来之后，最后一步是让 `Vue` 组件能调到原生能力。有两种写法。

**写法一：用 vue-cordova 封装库（不推荐）**

> https://github.com/kartsims/vue-cordova

1. `vue`项目安装 `npm install --save vue-cordova`
2. 在 `main.js` 引入插件并`use`插件

```
import VueCordova from 'vue-cordova'
Vue.use(VueCordova)
```

3. 调用插件注意在对应的组件需要引入 

```js
var Vue = require('vue')
```

```js
Vue.cordova.camera.getPicture((imageURI) => {
    window.alert('Photo URI : ' + imageURI)
}, (message) => {
    window.alert('FAILED : ' + message)
}, {
    quality: 50,
    destinationType: Vue.cordova.camera.DestinationType.FILE_URI
})
```

4. 注意需要在`vue`项目 `index.html`引入 `cordova.js`

```html
<script src="cordova.js"></script>
```

我当年标了「不推荐」，理由到今天也站得住：这类封装库多加了一层间接，出问题时你得同时怀疑插件、封装库、自己的代码三个地方；而且它跟不上 `Cordova` 插件的更新节奏，新插件它没适配你还是得绕过它直接调。它带来的收益，无非是少写一个 `document.addEventListener('deviceready', ...)`，不划算。

**写法二：直接引 cordova.js 用全局对象（推荐）**

> `index.html` 引入`cordova.js`  并定义全局变量让`vue`组件里面直接使用`cordova`插件(推荐的使用方法）

- 在vue `index.html`引入`cordova.js` （注意顺序`cordova.js`放在`build.js`上面）
- 直接可以在组件里面使用`cordova`的`api`（注意`cordova`里面要安装`api`的插件）

「`cordova.js` 放在 `build.js` 上面」这个顺序要求得解释一下。`cordova.js` 加载后会去初始化插件桥接，完成后派发一个 `deviceready` 事件。放在业务代码后面的话，你的 `Vue` 应用可能在桥还没建好的时候就去调 `navigator.camera`，拿到的是 `undefined`。

顺着这个再多说一句，光注意顺序还不够，**所有原生调用都必须等到 `deviceready` 之后**。稳妥的写法是在 `main.js` 里把挂载动作包一层：

```js
document.addEventListener('deviceready', function () {
  new Vue({ el: '#app', render: h => h(App) })
}, false)
```

但浏览器里没有 `cordova.js`，`deviceready` 永远不会触发，本地开发就起不来了。所以实际项目里要做个环境判断，检测到 `window.cordova` 存在才等事件，否则直接挂载。这块调试麻烦的地方在于两套环境行为不一致，我的做法是把所有原生调用收进一个 `native.js` 的适配层，浏览器环境下返回 mock 数据，这样日常开发完全在浏览器里进行，只有联调原生能力时才上真机。

另外真机上调试 `WebView` 里的 `JS`，别靠 `alert` 硬调，`iOS` 用 `Safari` 的网页检查器、`Android` 用 `chrome://inspect` 都能直接开出完整的 `DevTools`，具体接法可以看 [真机调试 WebView 的完整指南](https://feinterview.poetries.top/blog/webview-real-device-debugging-ios-safari-android-chrome)。

## 总结

把 `Vue` 项目 `Cordova` 化这件事，真正的技术含量只有三处，其余全是环境问题。

第一处是路径。打包产物的资源引用必须是相对路径，路由必须是 `hash` 模式，因为 App 里跑的是 `file://` 协议。这两条不满足就是白屏，而且报错信息不会告诉你原因。

第二处是时序。原生桥的建立是异步的，所有插件调用都得排在 `deviceready` 之后。同时得留一条浏览器环境下的降级路径，否则日常开发效率会掉一大截。

第三处是同步。改了代码要跑 `cordova prepare`，改了包名要删平台重加。`platforms/` 是生成物不是源码，这个认知建立起来能省掉大量「明明改了却不生效」的困惑。

至于导入 `Android Studio` 那一堆报错，说到底是 `Gradle` 版本和网络的问题，配好镜像、装齐 SDK、关掉手机助手，基本就都能过。

最后还是那句：这套栈今天已经归档了，新项目走 `Capacitor`。但上面这三处坑，换个工具照样在，理解了原因比记住命令有用得多。

## 参考

- Apache Cordova 官方文档 <https://cordova.apache.org/docs/en/latest/>
- cordova-plugin-camera 文档 <https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-camera/index.html>
- cordova-plugin-geolocation 文档 <https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-geolocation/index.html>
- Vue CLI 配置参考 <https://cli.vuejs.org/zh/config/>
- Capacitor 官方文档 <https://capacitorjs.com/docs>
- Apache Attic <https://attic.apache.org/>
- [前端进阶之旅](https://interview.poetries.top)
