---
title: 混合App之Ionic3完整实战小结 从环境搭建到打包上架
description: 一份 Ionic3 混合 App 开发的完整实战笔记，覆盖环境搭建、目录结构、页面生命周期、原生插件调用、页面传参、管道、主题夜间模式、自定义组件、常用 UI 组件封装，以及 iOS 与安卓两端从图标生成到签名打包上架的全流程。
date: 2019-01-10 18:10:24
tags: 
 - Ionic
 - Angular
 - Cordova
 - 混合App
 - 打包发布
categories: Front-End
---

用一套 Web 技术同时交付 iOS、安卓和微信里的 H5，这是 2018 年前后很多小团队的现实选择。`Ionic 3` 当时给的答案很完整：底下 `Cordova` 负责桥接原生，中间 `Angular` 负责应用架构，上层一套仿原生的 UI 组件库直接能用。缺点也很实在，链路长、坑多，从装环境到出一个能上架的包，中间能卡住的地方有几十处。

这篇是我做完一个完整的 `Ionic 3` 项目之后整理的笔记，从 `ionic start` 一直写到安卓签名包 `zipalign` 优化。内容偏工具书性质，可以顺着读一遍建立全貌，也可以卡住的时候回来查对应那一节。

> 没有`angular`基础，先看一下这篇 [Angular 入门梳理](https://feinterview.poetries.top/blog/angular7-intro-summary)

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `Ionic` 和 `Cordova`、`Angular` 三者的分工，以及这个组合今天还剩多少价值
- 浏览器、iOS 模拟器、安卓模拟器、微信四种环境分别怎么跑起来
- `Ionic 3` 的目录结构，哪些目录是源码、哪些是生成物不能手改
- 页面生命周期钩子各自在什么时机触发，初始化代码该放哪个
- 相机、本地存储、二维码扫描、版本号读取这几个高频原生能力的完整接法
- 页面传参的两种写法、管道、主题夜间模式切换、自定义组件的完整实现
- `Loading` / `Toast` / `Modal` 怎么封装成基类，省掉每个页面重复的样板代码
- iOS 和安卓两端打包上架的全流程，包含 `Gradle` 环境配置和 apk 签名的每一条命令

## 零、先说清楚这套栈现在的状态

这篇写于 2019 年初，那时候 `Ionic 3` 还是主流选择。现在情况变了，动手之前先知道这几件事，省得走弯路。

`Ionic 3` 已经是好几个大版本之前的东西了，`Ionic 4` 起底层组件重写成了 `Web Components`，路由交还给 `Angular Router`，跟 3 之间是断代式的差异，两版之间怎么迁我单独写了一篇 [Ionic3 升级 Ionic4 变更对比](https://feinterview.poetries.top/blog/ionic3-to-ionic4)。

`Apache Cordova` 现在也不再活跃维护了，项目退役进了 `Apache Attic` 归档，具体以 <https://attic.apache.org/> 上的官方公告为准。`Ionic` 官方推的替代方案是自家的 `Capacitor`，思路一致，但原生工程当作源码提交进仓库管理，不像 `Cordova` 每次 `prepare` 重新生成。

那这篇留着干什么？两个理由。一是存量项目还在跑，出问题得有地方查；二是这里面**至少有一半内容跟 `Ionic` 版本无关**，比如安卓签名打包那一整套 `keytool` / `jarsigner` / `zipalign` 命令，比如 iOS 的证书和上架流程，比如 `Gradle` 环境变量配置，这些换成 `Capacitor`、`React Native` 甚至纯原生也是同一套。真正过时的只有 `ionic-angular` 那些 API 写法，我会在对应位置标出来。

## 一、介绍

> `Ionic` 是一款基于 `Angular`、`Cordova` 的强大的 `HTML5` 移动应用开发框架 , 可以快速创建一 个跨平台的移动应用。可以快速开发移动 `App`、移动端 `WEB` 页面、微信公众平台应用，混 合 `app web `页面。

### 1.1 ionic 特点

- `ionic` 基于`Angular`语法，简单易学。
- `ionic` 是一个轻量级框架。
- `ionic` 完美的融合下一代移动框架，支持 `Angularjs` 的特性， `MVC` ，代码易维护。
- `ionic` 提供了漂亮的设计，通过 `SASS` 构建应用程序，它提供了很多 UI 组件来帮助开发者开发强大的应用。
- `ionic` 专注原生，让你看不出混合应用和原生的区别
- `ionic` 提供了强大的命令行工具。
- `ionic` 性能优越，运行速度快。

这几条是官方口径下的卖点，我按当年的原文保留。以今天的眼光补两句实话：「性能优越、看不出和原生的区别」这个说法要打折扣，`Ionic 3` 的页面跑在 `WebView` 里，简单的列表和表单确实流畅，但长列表滚动、复杂手势、大量动画同时进行的场景，跟原生的差距是能感觉到的。选型时按你的 App 是「内容展示为主」还是「重交互」来判断，前者完全够用，后者别硬上。

### 1.2 Ionic 和 Cordova(phonegap)、Angular 关系

> `ionic` = `Cordova` + `Angular` + `ionic CSS`


> `Ionic `是完全基于谷歌的 `Angular` 框架，在 `Angular` 基础上面做了一些封装，让我们可以更快 速和容易的开发移动的项目。`Ionic` 调用原生的功能是基于 `Cordova`,`Cordova` 提供了使用 `JavaScript` 调用 `Native` 功能，`ionic` 自己也封装了一套漂亮的 `CSS UI` 库。

这个等式值得多花两分钟拆开看，因为它决定了你后面遇到问题该去哪个文档里查。

`Angular` 管的是应用架构：组件、模块、依赖注入、`RxJS`。你写的绝大多数代码其实是 `Angular` 代码，报的错也多半是 `Angular` 的错，遇到 `No provider for XXX`、`Can't bind to 'ngModel'` 这类，去 `Angular` 文档里找。

`Cordova` 管的是原生桥接和打包。它把你的静态资源塞进一个原生壳子，同时提供插件机制让 `JS` 能调相机、定位这些。所有跟「装不上」「调不到原生能力」「打包失败」相关的问题，都在这一层。

`ionic CSS` 和那套组件管的是外观和交互。`ion-list`、`ion-card`、`ion-refresher` 这些标签属于这层，样式不对、组件用法不对，去 `Ionic` 的组件文档查。

分清楚这三层之后，排查效率会高很多。我一开始就是不分层，什么问题都去搜「ionic xxx 报错」，搜出来一堆不相干的答案。

## 二、环境搭建

这一节把四种运行环境（浏览器、iOS、安卓、微信）挨个跑通。建议按顺序来，浏览器最快，跑通它至少证明你的代码是好的，后面出问题就可以专心排查平台侧。

### 2.1 Ionic初始化构建

> https://ionicframework.com/getting-started#cli

```bash
# 全局安装
npm install -g ionic
```

- `ionic info` (查看当前`ionic`的全部版本信息)

装完先跑一下 `ionic info`，它会把 `Ionic CLI`、框架版本、`Cordova` 版本、平台、`Node`、`Xcode` 全列出来。

![执行 ionic info 后输出的环境版本信息](https://s.poetries.top/gitee/2019/10/235.png)

这条命令的价值在于**它是排查环境问题的第一现场**。装插件失败、打包报错、别人的解决方案在你这不生效，多半是某个版本对不上，先跑它，再对照文档看版本要求。往论坛提问的时候贴上这段输出，回复效率也会高很多。

```bash
ionic start myApp tabs # 建议使用初始化

cd myApp 

ionic serve
```

`tabs` 是模板名。可选的还有 `blank`（空白）、`sidemenu`（侧边栏），起手用 `tabs` 最省事，因为底部导航、页面结构、路由都给你搭好了，照着改就行。

![ionic serve 启动后在浏览器中打开的项目首页](https://s.poetries.top/gitee/2019/10/236.png)

- `ionic serve` 运行项目

`ionic serve` 起的是一个带热更新的本地开发服务器，改代码浏览器自动刷新。日常开发九成时间应该待在这里，别动不动就上真机，那一圈跑下来至少一两分钟。

### 2.2 Genymotion 安卓模拟器

> 使用方法 https://www.jianshu.com/p/aabc4fd01311

`Genymotion` 是第三方的安卓模拟器，当年比 `Android Studio` 自带的 AVD 快不少，把 apk 直接拖进窗口就能装。现在官方 AVD 在硬件加速开启后已经够快了，用哪个看习惯。要提醒的是模拟器上相机、蓝牙、推送这些原生能力要么不可用要么是假数据，调这些必须上真机。

### 2.3 在IOS环境下体验

> 需要配备`mac`，安装`xcode`

```bash
# mac下需要添加sudo
sudo ionic cordova platform add ios

# 注意获取目录权限的问题
chmod -R 777 项目文件夹名
```

> 真机调试与发布需要`Apple`开发者账号

那个 `chmod -R 777` 是在解决什么？因为前面用 `sudo` 加平台，生成出来的目录属主是 root，你当前用户没有写权限，`Xcode` 打不开工程。更干净的解法是把属主改回自己（`sudo chown -R $(whoami) ./platforms ./plugins`），然后往后别再用 `sudo` 跑 `ionic` 命令，不然过两天又是同样的问题。

**打开xcode选择platform下中ios文件夹，点击运行项目**

![在 Xcode 中打开 platforms/ios 下的工程并选择模拟器运行](https://s.poetries.top/gitee/2019/10/237.png)

有一点必须记牢：`platforms/` 目录是**生成物，不是源码**。你在 `Xcode` 里直接改里面的文件，下次 `cordova prepare` 或者删平台重加就全没了。真要改原生配置，正确的位置是根目录的 `config.xml`，或者写 `hooks` 脚本。这个我踩过，改完 `Info.plist` 打包发现权限描述又没了，反复三次才想明白是被覆盖了。

iOS 从真机调试到打包上架那一整套证书流程，我单独写了一篇 [Ionic 的 iOS 打包与上架流程](https://feinterview.poetries.top/blog/Ionic-ios-build)，这里不重复。

### 2.4 在安卓下体验

**1. 添加android**

```bash
ionic cordova platform add android

# 注意获取目录权限的问题
chmod -R 777 项目文件夹名

# 直接使用Android studio 进行调试链接

# 打包成apk拖入Genymotion调试
```

**2. 下载android studio 打开/platform/andriod文件**

导入的时候选 `platforms` 下的 `android` 目录，不是项目根目录，选错了 `Gradle` 根本识别不出来。

![在 Android Studio 中导入 platforms/android 工程目录](https://s.poetries.top/gitee/2019/10/238.png)

第一次导入基本都会卡在 `Gradle` 同步上，因为它要去下载 wrapper 和一堆依赖。国内网络下最有效的两招是给 `build.gradle` 换阿里云的 maven 镜像，以及把 `gradle-x.x-all.zip` 手动下下来改成本地路径（具体怎么改见后面 12.5.2 节）。同步进度条在动就是在下载，耐心等；完全不动多半是网络断了。

**3. 然后连接android studio结合geny生成apk调试**

![Android Studio 编译出 apk 后在模拟器中运行的效果](https://s.poetries.top/gitee/2019/10/239.png)

真机连不上的情况也常见，多半是电脑上装了手机助手类软件抢占了 `adb` 端口。先把它们全关掉，跑一次 `adb kill-server && adb devices` 重启服务，再确认手机上开了 USB 调试并点了「允许调试」的确认框。

### 2.5 在浏览器/微信下体验

这一节容易被忽略，但对很多项目来说价值很高：同一份代码可以直接打成静态站点部署，微信里、浏览器里都能访问，等于免费多了一个投放渠道。

**1. 添加browser文件夹**

```bash
ionic cordova platform add browser
```

`browser` 也是一个 `Cordova` 平台，跟 `ios`、`android` 平级。加它的意义在于产物里会带上 `cordova.js` 的浏览器实现，那些原生插件调用不会直接报错炸掉，而是走降级逻辑。

**2. 打包**

> `ionic cordova build browser`

![执行 ionic cordova build browser 的构建输出](https://s.poetries.top/gitee/2019/10/240.png)
![构建完成后在 platforms/browser 下生成的产物目录](https://s.poetries.top/gitee/2019/10/241.png)

**3. 运行**

```bash
npm run serve

# 浏览器打开 http://localhost:8100
```

**4. 部署**

> 把`www`目录部署到服务器上即可

> 在微信下体验 注意微信`title`问题

「微信 `title` 问题」这句原文写得简，展开说一下：微信的内置浏览器在 iOS 上加载页面时会锁住标题栏，页面里后续用 `document.title = 'xxx'` 改标题是不生效的。社区的通用绕法是用一个隐藏的 `iframe` 加载一个同域小文件，触发微信刷新标题：

```js
document.title = '新标题';
const iframe = document.createElement('iframe');
iframe.style.display = 'none';
iframe.src = '/favicon.ico';
iframe.onload = () => setTimeout(() => document.body.removeChild(iframe), 0);
document.body.appendChild(iframe);
```

这是个 hack，靠的是微信容器的实现细节，各版本行为不完全一致，我只在当年的版本上验证过。有条件的话更稳妥的做法还是让每个页面服务端渲染出正确的 `title`。

### 2.6 ionic的常用命令

**1. 基本命令**

- `ionic g page myPage` 创建页面
- `ionic g provider MyData` 创建`provider`
- `ionic serve` 在浏览器中看
- `ionic platform add/remove android/ios` 添加删除平台
- `ionic build android/ios`  快捷打包（`IOS`最好通过`xcode`打包发布）

**2. 辅助命令**

- `ionic info` 查看关于`ionic`的系统消息
- `ionic emulate android/ios` 模拟器中打开
- `ionic cordova plugin list` 查看插件安装列表

**3. 正式发布需要的命令**

- `ionic cordova platforms add android` 添加安卓平台
- `ionic cordova build android --release` 打包成`apk`

这里有一条没列出来但最容易漏的命令：`ionic cordova prepare`。它干的事是把构建产物 `www` 和插件配置同步进各平台的原生工程。漏了它的表现特别迷惑，代码明明改了，真机上跑的还是老版本，你会开始怀疑是缓存、是没重新编译、是手机没装上。**建议直接把 `build` 和 `prepare` 串成一条 npm 脚本**，别指望每次都记得手动跑。

## 三、Ionic3.x+ 目录结构分析及创建组件

搞清楚哪些目录是你的源码、哪些是工具生成的，能省掉后面一大堆「改了不生效」和「改完又没了」的困惑。

### 3.1 Ionic3.x 目录结构分析

**1. 整体目录结构**

![Ionic 3 项目的整体目录结构](https://s.poetries.top/gitee/2019/10/242.png)

- `hooks`:编译 `cordova` 时自定义的脚本命令，方便整合到我们的编译系统和版本控制系统中 
- `node_modules` :`node` 各类依赖包
- `resources` :`android/ios` 资源(更换图标和启动动画) 
- `src`:开发工作目录，页面、样式、脚本和图片都放在这个目录下
- `www`:静态文件
- `platforms`:生成 `android` 或者 `ios` 安装包路径(`platforms\android\build\outputs\apk:apk`
所在位置)执行 `cordova platform add android` 后会生成
- `plugins`:插件文件夹，里面放置各种 `cordova` 安装的插件
- `config.xml`: 打包成 `app` 的配置文件
- `package.json`: 配置项目的元数据和管理项目所需要的依赖
- `tsconfig.json`: `TypeScript` 项目的根目录，指定用来编译这个项目的根文件和编译选项 
- `tslint.json`:格式化和校验 `typescript`

对着这份清单，可以把这些目录分成三类，分类比逐条记忆有用得多。

**你的源码**只有 `src` 和 `resources`，加上根目录那几个配置文件。这是唯一需要进版本库的部分。

**生成物**是 `www`、`platforms`、`plugins`、`node_modules`。它们全部可以从源码和配置重新生成，所以应该写进 `.gitignore`，也不该手动去改。很多人把 `platforms` 提交进仓库，结果换台机器拉下来编译各种报错，就是因为里面写死了上一台机器的绝对路径。

**配置**是 `config.xml`、`package.json`、`tsconfig.json`。其中 `config.xml` 最关键，应用包名、版本号、图标启动图、插件配置、原生权限全在这里，它是驱动 `platforms` 生成的源头。

**2. src目录**

![src 目录下的子目录结构](https://s.poetries.top/gitee/2019/10/243.png)


- `app`:应用根目录
- `assets`:资源目录(静态文件(图片，js 框架) 
- `pages`:页面文件，放置编写的页面文件，包括:`html`，`scss`，`ts`
- `theme`:主题文件，里面有一个 `scss` 文件，设置主题信息。

实际项目里我一般还会再加两个目录：`providers` 放数据服务（接口请求、本地存储封装），`common` 放跨页面复用的基类和工具函数。后面 11.1 节封装 `Loading` 和 `Toast` 的基类就放在 `common` 下。

**3. Ionic3.x src 下面文件分析**

![src 根目录下的入口文件构成](https://s.poetries.top/gitee/2019/10/244.png)

`src` 根目录下有个 `index.html`，它是整个应用的宿主页面。这个文件基本不用动，唯一常改的地方是加 `meta` 标签控制视口和状态栏，以及在调试期临时引入 `vconsole` 之类的工具。

**4. app.module.ts 分析**

`app.module.ts` 是整个应用的装配清单，新手最常在这里踩坑，所以下面这段完整代码建议逐块看一遍。

```js
//这个根模块会告诉 ionic 如何组装该应用

import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';
import { MyApp } from './app.component';

// 其他组件
import { HomePage } from '../pages/home/home';
import { DiscoveryPage } from '../pages/discovery/discovery';
import { ChatPage } from '../pages/chat/chat';
import { NotificationPage } from '../pages/notification/notification';
import { MorePage } from '../pages/more/more';
import { LoginPage } from '../pages/login/login';
import { TabsPage } from '../pages/tabs/tabs';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ApiProvider } from '../providers/api/api';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    DiscoveryPage,
    ChatPage,
    NotificationPage,
    MorePage,
    LoginPage,
    TabsPage
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    DiscoveryPage,
    ChatPage,
    NotificationPage,
    MorePage,
    LoginPage,
    TabsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    ApiProvider
  ]
})
export class AppModule {}
```

这里面四个数组各管一件事，分清楚了能省掉大量摸不着头脑的报错。

`declarations` 声明这个模块里有哪些组件、指令、管道。新建的页面和管道忘了加进来，报错是 `xxx is not a known element` 或者模板里管道不生效。

`imports` 引入别的模块提供的能力，比如 `HttpClientModule` 提供 `HttpClient`，`IonicStorageModule.forRoot()` 提供本地存储。注意那个 `forRoot()`，它表示「在应用根部初始化一次单例」，子模块里引同一个模块要用 `forChild()`，混用会造出两个实例。

`entryComponents` 是 `Ionic 3` 特有的一个坑。凡是不通过模板标签直接出现、而是靠代码动态创建的组件（`navCtrl.push(SomePage)` 里的页面、`ModalController` 弹出的页面）都必须登记在这里，否则编译期的 `AOT` 优化会把它当成没人用的代码摇掉，运行时报 `No component factory found`。**页面加到 `declarations` 却忘了加 `entryComponents`，是新手最高频的一个错。**

`providers` 登记可注入的服务，插件包装类（`StatusBar`、`SplashScreen`）和你自己写的 `Provider` 都放这。漏了报 `No provider for XXX`。

### 3.2 创建组件

页面和组件的区别是：页面能被路由推入导航栈，组件只能嵌在别的模板里用。做一块要在多个页面复用的 UI（比如自定义的空状态、评分星条），就用组件。

1. `cd` 到我们的项目目录
2. 通过 `ionic g component` 组件名称创建组件

> 输入`ionic g`后，可以创建的组件如下

![执行 ionic g 后 CLI 列出的可生成类型列表](https://s.poetries.top/gitee/2019/10/245.png)

从这个列表能看出 `Ionic 3` 把代码分成了 page、component、directive、pipe、provider 几类。用 CLI 生成而不是手写文件的好处，是它会顺带把样板代码和目录结构建好，命名风格也统一。

3. 创建完成组件以后会在 `src` 目录下面多一个 `components` 的目录，这个目录里面有我们用命令创建的所有的组件

![生成后新增的 src/components 目录及其内容](https://s.poetries.top/gitee/2019/10/246.png)

注意这个目录下会有一个 `components.module.ts`，所有生成的组件都会自动登记进去。这是个统一出口，你只需要在 `app.module.ts` 里引这一个模块，而不是逐个引组件。

4. 如果我们要使用这些组件必须在 `app.module.ts` 里面注册我们的模块，注册完成后就可以在 `pages` 里面的其页面里面使用这些组件

![在 app.module.ts 的 imports 中引入 ComponentsModule](https://s.poetries.top/gitee/2019/10/247.png)
![注册完成后在页面模板中直接使用自定义组件标签](https://s.poetries.top/gitee/2019/10/248.png)

做完这一步，组件的选择器（默认就是组件名的短横线形式）就能当标签用了。如果标签写上去没渲染出来，先回来确认 `ComponentsModule` 引进 `imports` 了没有，这是九成情况的原因。

### 3.3 创建页面以及页面跳转

**1. 创建页面**

```bash
ionic g page news
```

这条命令会生成 `news.ts`、`news.html`、`news.scss` 三个文件（视配置还可能有 `news.module.ts`）。

**2. 跳转**

```html
<button ion-button (click)="pushButton">执行button跳转</button>
```

这行模板代码有个笔误值得指出来：`(click)="pushButton"` 只是引用了这个方法，并没有调用它，正确写法要带括号：

```html
<button ion-button (click)="pushButton()">执行button跳转</button>
```

漏括号的表现是点了完全没反应，控制台也不报错，排查起来挺费时间的。这个错我犯过不止一次。

![点击按钮后跳转到新页面的效果](https://s.poetries.top/gitee/2019/10/249.png)

跳转的具体写法（`navCtrl.push` 和 HTML 上的 `[navPush]`）在第六节展开讲，那里连传参一起说更连贯。

## 四、Ionic页面生命周期

生命周期这块是 `Ionic` 和纯 `Angular` 差别最大的地方，因为 `Ionic` 的页面是带缓存的栈式导航，页面被推走了并不销毁，回来时也不会重新创建。这套行为决定了初始化代码该放哪个钩子。

先看这份注释齐全的清单，它把每个时机在干什么说得很清楚：

```js
// 页面被加载完成后调用的函数，切换页面时并不会进行重新加载，因为有cache的存在
onPageLoaded() {
  console.log('page 1: page loaded.');
}
 
// 页面即将进入的时候
onPageWillEnter() {
  // 在这里可以做页面初始化的一些事情
  console.log('page 1: page will enter.');
}
 
// 页面已经进入的时候
onPageDidEnter() {
  console.log('page 1: page did enter.');
}
 
// 页面即将离开的时候
onPageWillLeave() {
  console.log('page 1: page will leave.');
}
 
// 页面已经离开的时候
onPageDidLeave() {
  console.log('page 1: page did leave.');
}
 
// 从 DOM 中移除的时候执行的生命周期
onPageWillUnload() {
 
}
 
// 从 DOM 中移除执行完成的时候
onPageDidUnload() {
 
}
```

这里有个必须更正的地方。上面这套 `onPageXxx` 的命名是 `Ionic 2` beta 时期的写法，正式版之后官方统一改成了 `ionViewXxx` 前缀，`Ionic 3` 里照抄上面的方法名是不会被调用的。对应关系如下：

| 上面的旧名 | Ionic 3 实际的钩子 | 触发时机 |
|-----------|-------------------|---------|
| `onPageLoaded` | `ionViewDidLoad` | 页面首次创建完成，只跑一次 |
| `onPageWillEnter` | `ionViewWillEnter` | 每次进入页面前 |
| `onPageDidEnter` | `ionViewDidEnter` | 每次进入页面后（转场动画结束） |
| `onPageWillLeave` | `ionViewWillLeave` | 每次离开页面前 |
| `onPageDidLeave` | `ionViewDidLeave` | 每次离开页面后 |
| `onPageWillUnload` | `ionViewWillUnload` | 页面即将从 DOM 移除 |

除此之外 `Ionic 3` 还有两个守卫类的钩子：`ionViewCanEnter` 和 `ionViewCanLeave`，返回 `false` 或者 reject 的 `Promise` 就能拦住这次导航，做登录校验和「有未保存内容，确认离开吗」很合适。

那实际写代码时该选哪个？关键是分清「只跑一次」和「每次都跑」。

`ionViewDidLoad` 只在页面实例创建时跑一次，被推走再回来不会重跑。适合放一次性的初始化：拉详情数据、初始化图表实例、订阅长连接。

`ionViewWillEnter` 每次进入都跑。适合放需要刷新的逻辑：列表页从详情页返回后重新拉数据、根据全局状态更新界面。

放反了的表现分两种，都很折磨人：该刷新的不刷新（用户在详情页点了赞，返回列表还是旧数据），或者接口被重复调用（每次返回都重新初始化一次图表，内存越吃越多）。

还有一条容易忽略的：在 `ionViewWillLeave` 里做清理。定时器、订阅、`WebSocket` 这些，如果只在 `ionViewWillUnload` 里清，页面被缓存着的时候是不会触发的，后台还在跑。

## 五、API的使用

这一节是调原生能力的部分，也是混合 App 相比纯 H5 的核心价值所在。四个例子（相机、本地存储、扫码、版本号）覆盖了绝大多数场景的接法，套路完全一致：装两个包、在 `app.module.ts` 注册、在页面注入使用。

### 5.1 图片上传

> 文档 https://ionicframework.com/docs/native


```bash
npm i --save @ionic-native/camera @ionic-native/file @ionic-native/file-path @ionic-native/transfer

# 插件 mac下需要sudo
sudo ionic cordova plugin add cordova-plugin-camera 
sudo ionic cordova plugin add cordova-plugin-file 
sudo ionic cordova plugin add cordova-plugin-file-transfer
sudo ionic cordova plugin add cordova-plugin-filepath
```

这四个插件是一组，缺一不可，各管一段：`camera` 负责调起相机或相册拿到一个 URI，`filepath` 负责把安卓那种 `content://` 形式的 URI 转成真实文件路径，`file` 负责读文件，`transfer` 负责上传。安卓上少了 `filepath` 的表现是拿到 URI 但读不出文件，这个组合是当年趟出来的。

补两句今天的做法。`file-transfer` 插件后来被官方标成不再维护了，推荐改用标准的 `XMLHttpRequest` 或 `fetch` 直接传 `Blob`，现在 `WebView` 对大文件上传的支持已经够用，少装一个插件就少一处原生侧出问题的可能。另外相机参数里 `destinationType` 选 `DATA_URL` 会直接给你 base64，写起来最省事，但大图很容易把 `WebView` 内存打爆，正经项目还是走 `FILE_URI` 再自己读文件。`iOS` 上拍完照记得调一次 `navigator.camera.cleanup()` 清临时文件，不清的话连拍几十张之后占用会明显涨上去。

相机插件更细的接法我在 [Ionic 调用原生相机与 Cordova 插件命令实战](https://feinterview.poetries.top/blog/ionic-ios-camera) 里单独写了。

### 5.2 Icon 本地存储的使用

> https://ionicframework.com/docs/storage

`@ionic/storage` 解决的是一个很现实的问题：混合 App 里存数据，到底用 `localStorage` 还是 `SQLite` 还是 `IndexedDB`？各平台支持情况不一样，而且 `localStorage` 在系统内存紧张时可能被清掉。`@ionic/storage` 的做法是包一层统一的异步 API，底下自动挑当前环境下最靠谱的实现，装了 `SQLite` 插件就优先用它，没装就退回 `IndexedDB` 或 `localStorage`。

**1. 安装插件**

```bash
ionic cordova plugin add cordova-sqlite-storage

npm install --save @ionic/storage
```

第一条是可选的但强烈建议装，因为只有 `SQLite` 的数据不会被系统在清理缓存时抹掉。第二条是必须的。

**2. src/app/app.module.ts导入配置**

```js
import { IonicStorageModule } from '@ionic/storage';

@NgModule({
  declarations: [
    // ...
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    // ...
  ],
  providers: [
    // ...
  ]
})
export class AppModule {}
```

**3. 在你的页面中使用**

```js
import { Storage } from '@ionic/storage';

export class MyApp {
  constructor(private storage: Storage) { }

  ...

  // set a key/value
  storage.set('name', 'Max');

  // Or to get a key/value pair
  storage.get('age').then((val) => {
    console.log('Your age is', val);
  });
}
```

这里有个坑要注意：**`storage.get()` 返回的是 `Promise`，不是同步值**。从 `localStorage` 迁过来的人特别容易写成 `const token = storage.get('token')` 然后拿去发请求，结果传了个 `Promise` 对象出去。而且它不报错，接口那边只会告诉你 token 无效，排查方向很容易跑偏。

还有一条，`Storage` 的初始化本身也是异步的。应用启动时立刻读，可能拿到 `null`。稳妥做法是在 `app.component.ts` 的 `platform.ready()` 之后再做首次读取，或者干脆把「读 token → 决定跳登录页还是首页」这段逻辑整个放进 `ready` 回调里。

### 5.3 二维码扫描


> https://ionicframework.com/docs/native/qr-scanner

**1. 安装插件**


```bash
# 安装插件
$ ionic cordova plugin add cordova-plugin-qrscanner
$ npm install --save @ionic-native/qr-scanner
```

**2. 在`src/app/app.module.ts`中导入**

```js
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';

  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    QRScanner // 导入插件
  ]
```

**3. 在页面中使用**

扫码这个功能的实现思路跟别的插件不太一样，值得单独说清楚，不然下面那段 CSS 会看得莫名其妙。

`cordova-plugin-qrscanner` 的做法是把摄像头画面渲染在 **`WebView` 的背后**，而不是弹出一个原生的相机界面。所以要让用户看见摄像头，你必须把 `WebView` 自身以及页面上所有元素的背景都设成透明，相当于在页面上「挖个洞」。这就是下面 `scan.scss` 里那一堆 `background-color: transparent !important` 的来历。

```bash
# 新建扫描页面
ionic g page scan
```

```scss
/** scan.scss **/
page-scan {
html,
body,
ion-app,
ion-content,
ion-page,
.nav-decor {
  background-color: transparent !important;
}
.line {
  position: absolute;
  z-index: 999999;
  top: 15px;
  height: 2px;
  width: 100%;
  background-color: #009900; //动画
  animation: scan 1s infinite alternate;
  -webkit-animation: scan 1s infinite alternate;
}
@keyframes scan {
  from {
    top: 20%;
  }
  to {
    top: 80%;
  }
}
}
```


```html
<!--scan.html-->
<ion-header>
<ion-navbar>
  <ion-title></ion-title>
</ion-navbar>
</ion-header>

<div class="line"></div>
```

模板里就一个 `div.line`，配合上面那段 `@keyframes scan` 动画，就是那条上下扫动的绿色线。整个「扫码框」的视觉全靠 CSS 画，摄像头画面是透出来的。

下面是逻辑部分，重点看 `prepare()` 和 `scan()` 的配合：

```js
// scan.ts
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';

@Component({
  selector: 'page-scan',
  templateUrl: 'scan.html',
})
export class ScanPage {

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    public qrScanner: QRScanner) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ScanPage');
  }
  ionViewDidEnter() {
    this.scanQRCode();
  }

  scanQRCode() {
    this.qrScanner.prepare()
      .then((status: QRScannerStatus) => {
        if (status.authorized) {
          window.document.querySelector('body').classList.add('transparent-body');
          let scanSub = this.qrScanner.scan().subscribe((text: string) => {
            let alert = this.alertCtrl.create({
              title: '二维码内容',
              subTitle: text,
              buttons: ['OK']
            });
            alert.present();
            scanSub.unsubscribe();
          });

          this.qrScanner.show();

        }
        else if (status.denied) {
          //提醒用户权限没有开
        }
        else {

        }
      })
      .catch((e: any) => console.error('Error :', e));
  }

}
```

这段代码有几处值得拆开说。

`prepare()` 干的是申请相机权限并初始化，返回的 `status` 里 `authorized` 表示拿到权限，`denied` 表示用户拒了。`denied` 这个分支原文留了空注释，实际项目里必须补上，因为用户一旦选了「不允许」，之后再调 `prepare()` 系统不会再弹框，你得自己弹个提示引导他去系统设置里手动开。这是体验上最容易被忽略的一环。

`scan()` 返回的是 `Observable`，扫到内容就推一次。注意代码里扫到之后立刻 `scanSub.unsubscribe()`，这一步很关键，不取消订阅的话摄像头会继续扫，同一个码可能连续触发好几次弹窗。

还有个**必须补上的清理动作**：离开这个页面时要把透明 body 的 class 去掉、调 `qrScanner.hide()` 和 `qrScanner.destroy()`，否则返回上一页会发现整个应用背景是透的，相机也一直开着耗电。写在 `ionViewWillLeave` 里最合适：

```js
ionViewWillLeave() {
  window.document.querySelector('body').classList.remove('transparent-body');
  this.qrScanner.hide();
  this.qrScanner.destroy();
}
```

这个我踩过，扫完码返回首页发现界面一片黑，还以为是页面渲染出了问题。

**4. 调用scan页面**


```html
<button ion-item (click)="gotoScanQRCode()">
  <ion-icon name="qr-scanner" item-start color="dark"></ion-icon>
  <ion-label>扫描二维码</ion-label>
</button>
```

```js
import { ScanPage } from '../scan/scan'; // 引入新建的扫描页面

constructor(public navCtrl: NavController, 
  public navParams: NavParams) {
    super()
}

// 跳转到二维码扫描界面，加上'animate': false参数是为了相机能够在整个屏幕显示，否则相机出不来
gotoScanQRCode() {
  this.navCtrl.push(ScanPage, null, {'animate': false})
}
```

那个 `{'animate': false}` 的注释解释了原因，但值得再点破一句：转场动画期间 `Ionic` 会给页面容器加上位移和背景，正好把「透明穿透」这件事破坏掉，动画结束后状态也不一定能恢复。所以扫码页是个特例，得关掉转场。这种「框架特性和插件实现打架」的情况在混合开发里不算少见，遇到界面莫名其妙不对劲，可以往这个方向想。

### 5.4 读取版本信息

读版本号看着是个小需求，实际用处不少：给用户看的「关于」页面、上报埋点时带上版本、做强制更新时比对线上版本。

> https://ionicframework.com/docs/native/app-version

**1. 安装插件**

```bash
$ ionic cordova plugin add cordova-plugin-app-version
$ npm install --save @ionic-native/app-version
```

**导入app.module.ts**

```js
import { AppVersion } from '@ionic-native/app-version';
providers: [
    AppVersion
]
```

**2. 新建一个页面展示version**

```bash
ionic g page versions
```

**3. 在app.modules.ts中导入**

跟前面一样，把 `AppVersion` 加进 `providers` 数组。

**4. version页面配置**

> 在浏览器中不可以调试，需要真机调试

这句提醒适用于所有原生插件，不只是这个。`Ionic Native` 的包装层在浏览器里没有底层实现，调用只会 reject。所以设计页面的时候最好给个兜底值，不然本地开发时这块永远是空白，你都看不出布局对不对。

```html
<ion-header>

  <ion-navbar>
    <ion-title>版本信息</ion-title>
  </ion-navbar>

</ion-header>

<ion-content>
  <ion-list>
    <ion-item>
      AppName: {{appName}}
    </ion-item>
    <ion-item>
      PackageName: {{packageName}}
    </ion-item>
    <ion-item>
      VersionCode: {{versionCode}}
    </ion-item>
    <ion-item>
      VersionNumber: {{versionNumber}}
    </ion-item>
  </ion-list>

</ion-content>
```

```js
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AppVersion } from '@ionic-native/app-version';

@Component({
  selector: 'page-versions',
  templateUrl: 'versions.html',
})
export class VersionsPage {

  appName: string;
  packageName: string;
  versionCode: string;
  versionNumber: string;

  constructor(public navCtrl: NavController,
    private appVersion: AppVersion,
    public navParams: NavParams) {
  }

  ionViewDidLoad() {
    this.appVersion.getAppName().then(v => {
      this.appName = v;
    });

    this.appVersion.getPackageName().then(v => {
      this.packageName = v;
    });

    this.appVersion.getVersionCode().then(v => {
      this.versionCode = v;
    });

    this.appVersion.getVersionNumber().then(v => {
      this.versionNumber = v;
    });
  }
}
```


这四个字段的含义分别是：`appName` 应用名，`packageName` 包名（对应 `config.xml` 的 `id`），`versionNumber` 是给用户看的版本号（`1.0.1` 这种），`versionCode` 是构建号（一个递增的整数）。上架时要改的是哪个、什么时候改，第十二节会展开讲。

四个 `then` 写下来有点啰嗦，实际项目里我一般用 `Promise.all` 一次拿完，代码干净不少：

```js
ionViewDidLoad() {
  Promise.all([
    this.appVersion.getAppName(),
    this.appVersion.getPackageName(),
    this.appVersion.getVersionCode(),
    this.appVersion.getVersionNumber()
  ]).then(([appName, packageName, versionCode, versionNumber]) => {
    Object.assign(this, { appName, packageName, versionCode, versionNumber });
  }).catch(() => {
    // 浏览器环境下走这里，给个占位值
    this.versionNumber = 'dev';
  });
}
```

**5. 其他组件中使用**


```html
<button ion-item (click)="gotoVersions()">
<ion-icon name="help-circle" item-start color="dark"></ion-icon>
<ion-label>关于</ion-label>
</button>
```

```js
gotoVersions(){
  this.navCtrl.push(newPage)
}
```

这里 `newPage` 是个占位写法，实际要换成你导入进来的页面类，比如 `this.navCtrl.push(VersionsPage)`。别忘了页面类除了 `import` 之外还得登记进 `app.module.ts` 的 `entryComponents`，理由前面 3.1 节说过了。

## 六、页面之间的传参

`Ionic 3` 的导航是栈式的，跟浏览器的 URL 路由不是一回事，传参也就有了自己的一套。有两种写法，用 `TypeScript` 传和用模板属性传。

### 6.1 js跳转方式

> 路由跳转通过`NavController`

**1. 导入NavController**

```js
import { NavController} from 'ionic-angular';
```

**2. 注入**

```js
constructor(public navCtrl: NavController) {}
```

**3. 传参**

```js
 // 参数可以说任意 这里对象形式
 this.navCtrl.push(DetailsPage, {id: questionId}) 
```

> `navCtrl`传参和`ModalCtr`传参一样 

```js
this.ModalCtrl.create(AnswerPage, {
  id: this.id
})
```

**4. 接收参数**

```js
public id:string;

constructor(public navCtrl: NavController, public navParams: NavParams) {
  this.id = navParams.get('id') // 接收传递过来的参数
}

// 或者这样写
ionViewDidLoad(){
   this.id = this.navParams.get('id')
}
```

两种接收位置的差别在于时机。构造函数里拿参数最早，能赶在模板首次渲染前把值准备好；`ionViewDidLoad` 里拿则更适合参数拿到后要立刻发请求的场景，因为那时候页面 DOM 已经就绪，`Loading` 之类的 UI 能正常显示。

有个坑要注意：`navParams.get()` 拿不到会返回 `null` 而不是报错，所以**从别处复制过来的页面很容易因为参数名拼错而静默失败**。页面一片空白、接口传了个 `undefined` 过去，多半就是这个。稳妥点可以加一句兜底，参数缺失时直接退回上一页。

另外传对象是按引用传的，详情页里改了这个对象，列表页那边也跟着变了。要么传 id 让详情页自己拉数据，要么传之前深拷贝一份，别指望它是隔离的。

### 6.2 HTML传参

这种写法适合列表项跳详情这类纯声明式的场景，不用为了跳转专门写一个方法。


**1. 传参**

> 通过`[navPush]`打开新页面，`[navParams]`传递参数。[navPush文档](https://ionicframework.com/docs/api/components/nav/NavPush)


```js
import { ChatdetailsPage } from '../chatdetails/chatdetails' // 1.导入页面

public ChatdetailsPage: any; // 2. 声明类型

constructor(){
    userinfo = {
        userId: '1234',
        username: 'poetries'
    }
    this.ChatdetailsPage = ChatdetailsPage; // 3. 
}
```

```html
<!--4. 使用-->
<ion-item [navPush]="ChatdetailsPage" [navParams]="userinfo">
  <ion-avatar>
    <img src="https://blog.poetries.top/images/avatar.jpg">
  </ion-avatar>
  <h2>poetries</h2>
  <p>聊天组件开发</p>
</ion-item>
```

**2. 获取传递的参数**

```js
  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.username = navParams.get('username')
    this.userid = navParams.get('userid')
  }
```

这里正好有个现成的例子说明前面那个坑。上面传的对象里字段叫 `userId`（大写 I），接收时写的是 `navParams.get('userid')`（全小写），拿到的是 `null`。这类大小写不一致的问题不会报错，只会让页面上少一块内容。**参数名建议定义成常量或者用接口约束**，比靠记忆强。

那为什么要多一句 `public ChatdetailsPage: any` 的声明？因为 `[navPush]` 接收的是页面类本身，而模板里访问不到 `import` 进来的变量，只能访问组件实例的属性，所以得在类里挂一份。这是 `Ionic 3` 时代的固定套路，看着别扭，但没别的写法。

两种传参方式怎么选？逻辑简单的列表跳详情用 `[navPush]` 更省代码；跳转前需要做校验、埋点、异步取数据的，还是走 `navCtrl.push`，可控性强得多。

## 七、管道的使用

管道解决的是「同一份数据在不同地方要换个样子展示」这件事，最典型的就是时间格式化。把逻辑写进管道，模板里一个竖线就能复用，不用每个组件都写一遍转换函数。

**1. 新建管道**

```
ionic g pipe realativetime # 管道名称
```

**2. 配置**

```js
import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment'

/**
 * Generated class for the RelativetimePipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'relativetime',
})
export class RelativetimePipe implements PipeTransform {
  /**
   * Takes a value and makes it lowercase.
   */
  transform(value: string, ...args) {
    return moment(value).toNow() // 将过去时间变成距离现在多久
  }
}
```


这里有个地方要更正。注释写的是「将过去时间变成距离现在多久」，但 `moment` 里干这件事的是 `fromNow()`，`toNow()` 的方向是反的（它算的是「从现在到那个时间点」）。对一个过去的时间调 `toNow()`，出来的文案会是「in 3 天前」这种别扭的结果。想要「3 天前」应该写：

```js
transform(value: string, ...args) {
  return moment(value).fromNow()
}
```

顺带说两句 `moment` 本身。它现在处于官方声明的维护模式，不再推荐用于新项目，主要原因是包体大、对象可变、不支持 tree-shaking。轻量的替代有 `dayjs`（API 几乎一样，迁移成本极低）和 `date-fns`。老项目继续用没问题，新写的话可以直接上 `dayjs`。

**3. src/App/modules.ts中全局导入**

```js
import { RelativetimePipe } from '../pipes/relativetime/relativetime'


@NgModule({
  declarations: [
    RelativetimePipe
  ]
...
```


**4. 使用**

```html
<!--relativetime管道名称-->
<div class="msg-info">
  <p>{{msg.username}}&nbsp;{{msg.time | relativetime}}</p>
</div>
```    

管道注册到 `declarations` 里就全局可用了。要提醒一句，`Angular` 的管道默认是纯管道，只有输入引用变了才重新计算。相对时间这种「输入没变但结果会随时间推移变化」的场景，页面停留久了显示的还是进来那一刻的值。真需要实时更新，得配合定时器主动触发变更检测，别指望管道自己会变。

## 八、Theme主题全局样式

主题这块 `Ionic 3` 用的是 SCSS 变量方案，跟 `Ionic 4` 之后的 CSS 自定义属性完全是两套东西，这一节的写法在新版本里不适用，注意版本对应。

### 8.1 全局图标颜色配置

**1. `theme/variables.scss`中定义**

```scss
$colors: (
  primary:    #488aff, /**蓝色。优先匹配**/
  secondary:  #32db64, /**第二匹配**/
  danger:     #f53d3d, /**第三匹配**/
  light:      #f4f4f4,
  dark:       #222
);
```


**2. 使用**

```html
<!--在color上使用primary-->
<ion-icon name="paper" item-start color="primary"></ion-icon>
```

![使用 color 属性后图标呈现出主题色的效果](https://s.poetries.top/gitee/2019/10/250.png)

这个 `$colors` map 是 `Ionic 3` 主题系统的核心。你往里加一项 `purple: #9c27b0`，`Ionic` 的 SCSS 会自动为几乎所有组件生成对应的 `color="purple"` 支持，按钮、图标、开关、卡片全都能用，不用一个个写样式。后面 8.3 节夜间模式那段模板里出现的 `color="purple"` 就是这么来的。

代价是这套是编译期生成的，颜色写死在 CSS 里，运行时改不了。想做「用户自选主题色」这种功能，`Ionic 3` 下只能用切 class 覆盖的土办法，也就是下面 8.3 节的思路。`Ionic 4` 换成 CSS 变量之后这个限制才被解掉。

### 8.2 自定义样式

> 定义两套样式

> 在`theme`中新建`light.scss`。在`variables.scss`中导入

```scss
// 自定义样式
@import "light";
```

拆文件的意义在于 `variables.scss` 本身内容已经不少了，把自定义部分单独放一个文件，改起来不会跟 `Ionic` 自带的变量混在一起。

### 8.3 全局设置夜间模式切换

夜间模式这一节是整个主题部分最有实操价值的，因为它演示了一个完整的「全局状态驱动样式」的链路：两套 SCSS 定义外观，一个 `Provider` 持有当前主题，`app.html` 把这个值绑到根节点的 class 上，任意页面都能触发切换。

**1. 在`theme`中新建`theme.dark.scss`。在`variables.scss`中导入 **

```scss
/** 根据dark-theme 作用域切换主题 **/
.dark-theme {
    ion-content,.card,.floatMenu {
      background-color: #1e2446 !important;
      color: #fff !important;
    }
  
    .toolbar-title {
      color: #fff !important;
    }
   
    .header .toolbar-background {
      border-color: #140414 !important;
      background-color: #3a3c4b !important;
    }
  
    .list,.label,.item{
      background-color: #3a3c4b !important;
      color:#FFFFFF !important;
    }
    .item{
      border-bottom: 0.55px solid #2e2749 !important;
    }
    .item-inner {
      border: none !important;
    }
    .item-block{
      border-bottom: 0.55px solid #2e2749 !important;
    }
 }
```

**2. 在`theme`中新建`theme.light.scss`。在`variables.scss`中导入**


```scss
.light-theme {
    ion-content {
        background-color: #e3e4e7
      }
     
      .toolbar-background {
        background-color: #fff;
      }
 }
 ```
 
 
**3. 在`variables.scss`中导入**

```scss
/** 这里导入的是两套主题样式 **/

@import "theme.light";
@import "theme.dark";
```

```html
<ion-list class="marginTop">
  <ion-list-header>
   设置
  </ion-list-header>
  <ion-item>
    <ion-icon name="cloudy-night" item-start color="purple"></ion-icon>
    <ion-label>夜间模式</ion-label>
    <ion-toggle color="purple" (ionChange)="toggleChangeTheme()"></ion-toggle>
  </ion-item>
</ion-list>
```

这两套 SCSS 的写法有个共同点：都靠一个顶层 class（`.dark-theme` / `.light-theme`）圈定作用域，里面全是 `!important`。为什么非要 `!important`？因为 `Ionic 3` 组件自带的样式选择器权重不低，不加就覆盖不掉。这是当年的现实，不是好实践，`Ionic 4` 之后用 CSS 变量就不需要这么干了。

**4. 新建一个provider来控制app主题的切换**

```bash
ionic g provider settings
```

原文这里写的是 `ionic provider settings`，少了个 `g`（`generate` 的缩写），照抄会提示命令不存在。

```js
// settings.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/Rx'

@Injectable()
export class SettingsProvider {

  private theme: BehaviorSubject<string>
  constructor(public http: HttpClient) {
    this.theme = new BehaviorSubject('light-theme')
  }
  setActiveTheme(val) {
    this.theme.next(val)
  }
  getActiveTheme() {
    return this.theme.asObservable()
  }
}

```

这个 `Provider` 用 `BehaviorSubject` 而不是普通变量，是有讲究的。`BehaviorSubject` 会保存当前值，任何时候订阅都能立刻拿到最新主题，不用等下一次变化；而 `getActiveTheme()` 返回 `asObservable()` 而不是 subject 本身，是为了不让外部直接 `next()` 改值，只能走 `setActiveTheme`。这两个细节让状态的流向变成单向的，页面多了之后不容易乱。

另外 `import { BehaviorSubject } from 'rxjs/Rx'` 这个路径是 `RxJS 5` 的老写法，`RxJS 6` 之后统一改成从 `rxjs` 根路径导入（`from 'rxjs'`），升级时这一行要改。

**5. 在`app.component.ts`中设置**

![在 app.component.ts 中订阅主题变化并赋值给 selectedTheme](https://s.poetries.top/gitee/2019/10/251.png)

然后在`src/app/app.html`中设置`selectedTheme`

```html
<ion-nav [root]="rootPage" [class]="selectedTheme"></ion-nav>
```

这一行是整套方案的枢纽。`[class]` 绑定把当前主题名写到 `ion-nav` 这个根容器上，于是 `.dark-theme` 那套规则就覆盖到了它下面所有页面。**主题切换说到底就是改这一个字符串**，不需要任何页面配合。

**6. 在对应组件页面中设置**


```js
// 1. 引入settings providers
import { SettingsProvider } from '../../providers/settings/settings';

export class UserCenterPage {

  // 2. 定义变量
  public selectedTheme: string;

  constructor(public navCtrl: NavController, 
                      public navParams: NavParams,
                      // 3. 注入
                      public settings: SettingsProvider
                      public ModalCtrl: ModalController ) {
                        super()
                        
                         // 4. 获取主题
                        this.settings.getActiveTheme().subscribe(val => this.selectedTheme = val)
  }
  // 5.切换主题
  toggleChangeTheme() {
    if(this.selectedTheme == 'dark-theme') {
      this.settings.setActiveTheme('light-theme')
    }else{
      this.settings.setActiveTheme('dark-theme')
    }
  }
}
```

这段代码里有个 `super()` 调用，说明这个页面继承了某个基类（就是 11.1 节要讲的 `BaseUI`）。构造函数参数列表里 `public settings: SettingsProvider` 后面漏了个逗号，照抄会编译报错，实际写的时候补上。

**7. 在整个app启动的时候设置夜间或者白天模式**

![在应用启动时根据存储的偏好初始化主题](https://s.poetries.top/gitee/2019/10/252.png)

这一步不能省。用户上次选了夜间模式，重启应用如果不读回来，又变回白天了。做法是在 `setActiveTheme` 的时候顺手写进 `Storage`，应用启动时在 `platform.ready()` 之后读出来再 `setActiveTheme` 一次。注意读取是异步的，读回来之前会有一瞬间显示默认主题，介意闪烁的话可以让启动图多停一会儿，等主题确定了再隐藏。

## 九、组件化开发-自定义组件

页面写多了会发现有些 UI 块反复出现，抽成组件是自然的下一步。这一节除了怎么建组件，重点是父子之间怎么传数据、以及怎么用绑定语法做动态显隐和样式。

### 9.1 自定义组件

**1. 新建组件**

```bash
# 新建组件

ionic g component emojipicker# 组件名称
```

![执行 ionic g component 生成自定义组件的输出](https://s.poetries.top/gitee/2019/10/253.png)

**2. 在src/app/app.module.ts中导入**

```js
import { ComponentsModule } from '../components/components.module'

@NgModule({
  declarations: [
  
  ],
  imports: [
  BrowserModule,
    HttpClientModule,
    ComponentsModule, // 导入自定义组件
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
```

**3. 使用**

> 在页面中使用即可

![在页面模板中使用自定义组件标签的效果](https://s.poetries.top/gitee/2019/10/254.png)

注意 `ComponentsModule` 是放在 `imports` 而不是 `declarations` 里的，因为它是个模块不是组件。放错位置的报错是 `Unexpected module declared in the bootstrap property`，看到这句就回来检查这里。

**4. 组件通过@input()接收外部参数**

**4.1 定义组件**

```js
import { Component, Input } from '@angular/core';

// datatype 外部传递进来，dataSourceType 本地接收之后的参数命名
@Input('dataType') dataSourceType;

//这里没有 ionViewDidLoad 生命周期的函数
ngAfterContentInit(){
  console.log(this.dataSourceType) 
}
```

**4.2 使用组件**

```html
<!--dataType传递给question-list中的Input 接收-->
<question-list dataType="{{dataType}}"></question-list>
```

`@Input('dataType') dataSourceType` 这个写法里有两个名字，容易搞混：括号里的 `dataType` 是外部模板上用的属性名，后面的 `dataSourceType` 是组件内部的属性名。别名机制的用处是外部接口可以保持稳定，内部随便重构。不需要改名的话直接写 `@Input() dataType;` 更清楚。

注释里提到「这里没有 `ionViewDidLoad` 生命周期的函数」，这点很重要：**`ionView*` 那套钩子只有页面才有，普通组件没有**，组件要用 `Angular` 自己的 `ngOnInit`、`ngAfterContentInit`、`ngOnChanges`。原文这里用的是 `ngAfterContentInit`，能拿到值；但如果父组件的这个值是异步来的（比如接口返回后才赋值），`ngAfterContentInit` 只跑一次是接不到后续变化的，那种情况得用 `ngOnChanges`。

还有个传值方式的细节。上面模板里用插值语法把变量塞进普通属性，传过去的永远是**字符串**。要传数字、布尔、对象、数组，必须用方括号形式 `[dataType]="dataType"`。传布尔值时这个坑最坑人：`enabled="false"` 传过去的是字符串 `"false"`，在 `if` 里判断为真，逻辑就反了。

### 9.2 [hidden] [style] [class] 动态控制组件

这三个绑定语法是模板里做动态效果的基本功，都是 `Angular` 的能力，不是 `Ionic` 的。
 
**1. 动态显示隐藏hidden**

```html
<ion-content padding>
  <img src="{{pathForImage(lastImage)}}"  class="img" [hidden]="lastImage === null" />
  <h3 [hidden]="lastImage !== null">请从图片库选择一个图片</h3>
</ion-content>
```

**2. 动态绑定style**

```html
<ion-footer no-border [style.height]="isOpenEmojiPicker ? '255px': '55px' ">
</ion-footer>
```

**3. 动态绑定class属性**

```html
<div class="message right" 
    *ngFor="let msg of messageList"
    [class.right] = "msg.userId === userId"
    [class.left] = "msg.userId === chatUserId"
>
</div>
```

这三段各有一个值得留意的地方。

`[hidden]` 用的是 HTML 的 `hidden` 属性，元素还在 DOM 里只是不显示。跟 `*ngIf` 的区别是后者会把元素整个从 DOM 移除。频繁切换的用 `[hidden]` 省去重建开销，很少出现或者内部有重逻辑的用 `*ngIf` 省内存。有个坑是 `[hidden]` 会被 `display: flex` 之类的样式覆盖掉，元素明明 hidden 了还看得见，遇到这种情况得补一句 `[hidden] { display: none !important; }`。

`[style.height]` 这种带点的写法是绑定单个样式属性，值必须带单位。要绑多个用 `[ngStyle]="{...}"`。

`[class.right]` 同理，条件为真就加这个 class。这段代码里外层已经硬写了 `class="message right"`，再用 `[class.right]` 动态控制同一个 class，两者会打架，实际应该把外层的 `right` 去掉，只留 `class="message"`。

## 十、指令

> 采用了`angular`语法，`*ngFor`、`*ngIf`、`[ngClass]` 这些的用法可以看 [Angular 入门梳理里的数据循环那一节](https://feinterview.poetries.top/blog/angular7-intro-summary)

指令这块 `Ionic` 没有额外发明东西，完全是 `Angular` 的那一套，所以原文只给了个链接。唯一要提醒的是 `*ngFor` 在长列表下的性能，`Ionic 3` 项目里列表动辄几百条，不加 `trackBy` 的话数据一刷新整个列表会全部重建，滚动位置也会丢。写法是 `*ngFor="let item of list; trackBy: trackById"`，配一个返回唯一 id 的方法。这条在 `WebView` 里的收益比在桌面浏览器上明显得多。

## 十一、常用组件使用

> 组件文档 https://ionicframework.com/docs/components

`Ionic` 的组件分两类，一类是直接写在模板里的标签（`ion-list`、`ion-card`、`ion-refresher`），一类是用代码调起来的控制器（`LoadingController`、`ToastController`、`ModalController`）。下面先讲后者，因为它们的用法最容易写成一团散代码，值得封装。

### 11.1 ModalController/LoadingController/ToastController

**1. 导入**

```js
import {ModalController, LoadingController,  ToastController, ViewController} from 'ionic-angular';
```

**2. 注入**

```js
 constructor(
    public loadingCtr: LoadingController,
    public viewCtr: ViewController,
    public toastCtrl: ToastController,
    public ModalCtrl: ModalController 
  ) {
      
 }
```

**3. 使用**

```js
// loading使用
let loader = loadingCtr.create({
    content: message, // 加载的内容
    dismissOnPageChange: true 
})
loader.present() // 触发生效
loader.dismiss() // 关闭loading（原文这里写成了 loading，变量名对不上）
 
// toastCtrl使用
let toast = toastCtrl.create({
    message, // 提示的信息
    duration: 3000, // 间隔时间
    position: 'bottom' // top buttom left right
})
toast.present() // 触发生效

// ModalController 

let modal = this.ModalCtrl.create(QuestionPage) // 弹出的页面
modal.present() // 生效
// 关闭后进行父页面刷新
modal.onDidDismiss(()=>{
    // 刷新页面
    this.loadPage()
})


// viewCtr
// 关闭当前页面
this.viewCtr.dismiss()
```

几个参数值得说清楚。

`dismissOnPageChange: true` 是 loading 的救命选项，意思是页面一跳转就自动关掉。不加这个的话，请求还没回来用户点了返回，loading 就永远挂在那了，整个应用被一层遮罩盖住，只能杀进程。

`ModalController` 和 `NavController.push` 的区别在于：`push` 是把新页面压进导航栈，有返回按钮和转场；`modal` 是覆盖一层，通常用于表单填写、选择器这类「做完就回来」的场景。`modal.onDidDismiss()` 拿关闭回调，配合弹窗内部 `viewCtr.dismiss(data)` 传值出来，是父子通信最常用的一组。

`toast` 的 `position` 有 `top` / `middle` / `bottom` 三个值，原文注释里写的 `left` `right` 是不支持的。

**4. 封装loading, toast**

上面那套写法散在每个页面里，重复度很高。抽成一个基类之后，页面只要继承它就能直接用。

```js
// common/baseui
import { Loading, LoadingController, ToastController, Toast} from 'ionic-angular';

export abstract class BaseUI {
constructor() {

}

protected showLoading(loadingCtr: LoadingController, message: string): Loading {
    let loader = loadingCtr.create({
        content: message,
        dismissOnPageChange: true
    })
    loader.present()
    return loader
}
protected showToast(toastCtrl: ToastController, message: string):Toast {
    let toast = toastCtrl.create({
        message,
        duration: 3000,
        position: 'bottom'
    })
    toast.present()
    return toast
}
}
```

```js
// 使用
import { Component } from '@angular/core';
import { ModalController, LoadingController,  ToastController} from 'ionic-angular';
import { ApiProvider } from '../../providers/api/api'
import { BaseUI } from '../../common/baseui' // 1.导入封装的组件

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage extends BaseUI { // 2. 继承BaseUI

  feeds: string[];
  errorMessage: string;

  constructor(
    public loadingCtr: LoadingController, // 3. 构造
    public api: ApiProvider,
    public toastCtrl: ToastController,  // 3. 构造
    public ModalCtrl: ModalController 
    ) {
      super() // 调用父类构造函数
  }
  
  getFeeds() {
    let loading = super.showLoading(this.loadingCtr, '加载中...') // 4. 使用loading
    this.api.getFeeds().subscribe(data=>{
    
      if(data['UserId']) {
        this.feeds = data
        loading.dismiss() // 关闭loading
      }else{
        // 5. 使用toast
        super.showToast(this.toastCtrl, data['StatusContent'])
      }
    },err=>this.errorMessage = <any>err)
  }
}

```

这套封装有个明显的短板值得指出来：`BaseUI` 的方法要求你把 `loadingCtr`、`toastCtrl` 当参数传进去，等于每个页面还是得在构造函数里注入一遍。更彻底的做法是把它写成一个 `Provider`（在 `Provider` 内部注入这些控制器），页面只注入这一个服务就够了，也不用继承。继承在 `Angular` 里还有个副作用：父类构造函数的参数变了，所有子类都得跟着改。

不过这段代码里有个实践值得学：`getFeeds` 里失败分支只弹 toast 却没关 loading，这是个 bug。**loading 的关闭一定要放在所有分支都能走到的地方**，成功、失败、异常都要关。写成 `finally` 或者在 `subscribe` 的三个回调里都调一次，别只在成功路径上关。

### 11.2 Refresh组件

下拉刷新是移动端的标配交互，`Ionic` 把它做成了一个可以直接塞进 `ion-content` 的组件。

> [刷新组件](https://ionicframework.com/docs/api/components/refresher/Refresher/)

```html
<ion-content>
    <!--刷新组件-->
    <ion-refresher (ionRefresh)="doRefresh($event)">
      <ion-refresher-content
         pullingIcon="arrow-down"
         pullingText="下拉刷新"
         refreshingSpinner="circles"
         refreshingText="数据加载中..."
       >
      </ion-refresher-content>
    </ion-refresher>
    <ion-card *ngFor="let q of questions" (click)="gotoDetails(q.IdentityId)">
        <ion-item>
          <ion-avatar item-start>
            <img src="{{q.HeadFace}}">
          </ion-avatar>
          <p>
              {{q.UserNickName}}发布了该问题
            <ion-icon class="more-button" name="more"></ion-icon>
          </p>
        </ion-item>
        <h2>{{q.ContentTitle}}</h2>
        <ion-card-content>
          <p>{{q.ContentSummary}}</p>
        </ion-card-content>
        <ion-row>
          <ion-col col-8 center text-left>
            <ion-note>
                {{q.LikeCount}}&nbsp;赞同&nbsp;&nbsp;.&nbsp;&nbsp;{{q.CommentCount}}&nbsp;评论&nbsp;&nbsp;.&nbsp;&nbsp;关注
            </ion-note>
          </ion-col>
          <ion-col col-4></ion-col>
        </ion-row>
      </ion-card>
</ion-content>
```

```js
doRefresh(refresher) {
    this.getQuestions() // 再次请求数据
    refresher.complete() // 停止刷新
}
```

这段有个典型的时序 bug，很多人都这么写过。`getQuestions()` 是异步的，`refresher.complete()` 紧跟其后同步执行，结果就是数据还没回来，刷新动画已经收起来了。用户会觉得「刷了个寂寞」。正确写法是把 `complete()` 放进请求完成的回调里：

```js
doRefresh(refresher) {
  this.api.getQuestions().subscribe(
    data => {
      this.questions = data;
      refresher.complete();
    },
    err => {
      refresher.complete(); // 失败也要收起来，否则一直转
    }
  );
}
```

失败分支那句同样重要。请求挂了不调 `complete()`，刷新指示器会一直转下去，看起来像卡死了。

模板那段还有个细节，`ion-refresher` 必须是 `ion-content` 的**直接子元素**，塞进别的容器里就不生效了，而且不报错。这个我排查了一下午，最后是把它从一个包裹 div 里挪出来才好的。

### 11.3 List组件

> https://ionicframework.com/docs/components/#lists

`ion-list` 加 `ion-item` 是用得最多的一组。要记的属性其实就几个：`item-start` / `item-end` 控制子元素靠左还是靠右（`Ionic 4` 之后改成了 `slot="start"` / `slot="end"`），`ion-item-sliding` 做左滑出操作按钮，`ion-list-header` 做分组标题。列表长了记得配 `trackBy`，理由第十节说过。

### 11.4 button组件

> https://ionicframework.com/docs/components/#buttons

`Ionic 3` 的按钮写法是 `<button ion-button>`，`ion-button` 在这里是个指令而不是标签。`Ionic 4` 改成了 `<ion-button>` 标签形式，`clear`、`outline`、`round` 这些属性也有调整。迁移时这块的改动量不小，全项目搜一遍 `ion-button` 就知道了。

### 11.5 card组件

> https://ionicframework.com/docs/components/#cards

卡片是信息流类页面的主力组件，下面这段是一个典型的「头像 + 标题 + 摘要 + 底部计数」结构：

```html
<ion-card *ngFor="let f of feeds" (click)="gotoDetails(f.IdentityId)">
    <ion-item>
      <ion-avatar item-start>
        <img src="{{f.HeadFace}}">
      </ion-avatar>
      <p>
          {{f.UserNickName}}回答了该问题
        <ion-icon class="more-button" name="more"></ion-icon>
      </p>
    </ion-item>
    <h2>{{f.ContentTitle}}</h2>
    <ion-card-content>
      <p>{{f.ContentSummary}}</p>
    </ion-card-content>
    <ion-row>
      <ion-col col-8 center text-left>
        <ion-note>
            {{f.LikeCount}}&nbsp;赞同&nbsp;&nbsp;.&nbsp;&nbsp;{{f.CommentCount}}&nbsp;评论&nbsp;&nbsp;.&nbsp;&nbsp;关注
        </ion-note>
      </ion-col>
      <ion-col col-4></ion-col>
    </ion-row>
</ion-card>
```



这段跟 11.2 节那段几乎一样，区别只在字段名（一个是 `questions` 一个是 `feeds`）。实际项目里这种重复正是该抽成自定义组件的信号，把它做成 `<feed-card [data]="item">`，两个页面都能用，改样式也只改一处。

### 11.6 表单组件

> https://ionicframework.com/docs/components/#inputs

表单这块 `Ionic` 提供的是 `ion-input`、`ion-select`、`ion-toggle` 这些外观组件，校验和数据绑定还是走 `Angular` 的 `FormsModule` 或 `ReactiveFormsModule`。移动端有个通用的坑要提醒：键盘弹出会顶起页面导致布局错乱，`Ionic` 提供了 `cordova-plugin-ionic-keyboard` 配合一些配置项来处理，具体行为在 iOS 和安卓上不一致，得两端都实测。

## 十二、Ionic打包上线流程

这一节是整篇里生命力最强的部分，因为它讲的大多是平台侧的事，跟 `Ionic` 版本关系不大。安卓的签名打包那套命令，换成 `Capacitor`、`React Native` 甚至纯原生项目也是一样的。

### 12.1 图标生成

> 替换`resource/icon.png`图标为`1024*1024`

**生成图标**

> 第一次生成，需要注册账号才可生成 https://dashboard.ionicframework.com/signup

> 生成图标的过程可能需要翻墙

![执行图标生成前需要先登录 Ionic 账号](https://s.poetries.top/gitee/2019/10/255.png)

`ionic cordova resources` 这条命令干的事挺省心的：你只放一张 1024×1024 的原图，它会调用 `Ionic` 的云端服务，按 iOS 和安卓各自需要的十几种尺寸批量裁切，直接生成到 `resources/ios` 和 `resources/android` 目录，并把配置写进 `config.xml`。手工切这些尺寸是件很枯燥的事，能自动化就自动化。

```bash
# 在项目根目录执行 不需要进到resources文件夹
ionic cordova resources
```

![命令执行后批量生成的各尺寸图标文件](https://s.poetries.top/gitee/2019/10/256.png)

需要联网这一点是它的短板，服务不可用或者网络不通就卡住了。离线的替代方案是用 `cordova-res` 这个本地工具，功能类似但在本机跑，不依赖云端。原图有两个要求：尺寸够大（1024×1024 起），四周留出安全边距，因为 iOS 的圆角和安卓的自适应图标都会裁掉边缘。

### 12.2 启动图生成

> 替换resource/splash.png图标为1024*1024

```
# 在项目根目录执行 不需要进到resources文件夹
ionic cordova resources
```

启动图和图标是同一条命令生成的，但设计要求不一样。启动图会被按各种屏幕比例**裁切**而不是缩放，所以内容（logo、文字）必须集中在正中间一小块区域内，四周留大片纯色。按边缘排版的启动图，在长屏手机上大概率被切掉一半。这个规律我是做了两轮返工才记住的。

### 12.3 打包前细节处理

1. **修改index.html中的title**
2. **修改config.xml** 中的信息

- `widget id="io.ionic.starter" version="0.0.1"` 修改id（包名）以及`version`
- `<name>MyApp</name>` 修改`app`名字
- `<description>An awesome Ionic/Cordova app.</description>` 修改`app`描述
- ` <author email="hi@ionicframework" href="http://ionicframework.com/">Ionic Framework Team</author>` 修改`email`

![在 config.xml 中修改包名、版本号、应用名与描述等信息](https://s.poetries.top/gitee/2019/10/257.png)

这几项里 `widget id` 最要命，它就是应用包名，**上架之后再也改不了**，改了等于是一个全新的应用，老用户收不到更新。所以别图省事用默认的 `io.ionic.starter` 一路跑到底，正式开发的第一天就改成正式的。

`version` 也在这里改。上传新包时版本号必须往上走，不然商店会直接拒收。iOS 还额外有个构建号（`ios-CFBundleVersion`），同一个 version 下每传一次要加一。这两个号的区别很多人搞混，我在 [Ionic 的 iOS 打包与上架流程](https://feinterview.poetries.top/blog/Ionic-ios-build) 里专门写了一段。

改完这里记得跑 `cordova prepare`，不然改动同步不进原生工程。

### 12.4 打包部署

```bash
# 将所有的平台打包
sudo ionic build
```

**项目文件夹需要执行权限**

```bash
# 这样才可以在xcode中打开调试
sudo chmod -R 777 your_project_name
```

原文这里把 `chmod` 写成了 `chomd`，照抄会提示命令不存在，另外少了 `-R` 递归参数，只改顶层目录是不够的。更干净的解法还是改属主：`sudo chown -R $(whoami) your_project_name`，权限问题的根源是前面那些 `sudo`，把属主改回来比一路开 777 安全。

> 打开`xcode`进行`ios`下的调试

### 12.5 上架流程

#### 12.5.1 IOS的打包

iOS 这边的核心是签名。`Xcode` 里选好 Team、勾上自动管理签名，然后走 `Product → Archive` 归档。

![在 Xcode 中执行 Archive 归档打包](https://s.poetries.top/gitee/2019/10/258.png)

> `app store`上架,需要注册开发者账号

![登录苹果开发者中心进行账号与证书配置](https://s.poetries.top/gitee/2019/10/259.png)

这套流程步骤多，我单独整理了一篇 [Ionic 的 iOS 打包与上架流程](https://feinterview.poetries.top/blog/Ionic-ios-build)，从注册 UDID 一直到提交审核每一步都配了图，这里就不重复了。想把证书、描述文件、App ID 这几样东西之间的关系彻底理清楚，可以再看 [RN 构建 iOS 包发布到 AppStore 全流程](https://feinterview.poetries.top/blog/ios-build)。

#### 12.5.2 安卓版本打包

安卓这边没有苹果那套签名体系那么绕，但环境配置的坑更多，尤其是 `Gradle`。下面这一整套从环境变量到 apk 签名的流程，是当年一步步试出来的。

> 最后生成`apk`文件。

**打包方式**

> - 通过`Android studio`生成
> - 通过命令生成


**1. 需要安装`jdk`环境，并设置环境变量**

```bash
# mac上安装
brew install jdk java
```

这条命令按现在的 `Homebrew` 已经跑不通了，`jdk` 这个 formula 不存在。现在的写法是 `brew install openjdk`（开源版）或者 `brew install --cask temurin`（Adoptium 发行版）。装完还要配 `JAVA_HOME`，`Gradle` 找不到它就没法工作。另外 JDK 版本要和你的 `Gradle` 版本对得上，老项目配新 JDK 是最常见的一类构建失败原因，报错通常是 `Unsupported class file major version`。

**2. 配置`Gradle`**

这一步是国内环境下最容易卡住的地方。`Cordova` 生成的安卓工程会去 `services.gradle.org` 下载指定版本的 `Gradle`，网络不通就一直卡着。下面的做法是把包手动下下来，改成读本地文件。


```bash
# 打开 GradleBuilder.js

platforms/android/cordova/lib/builders/GradleBuilder.js
```


> 找到`distributionUrl`


```js
var distributionUrl = process.env['CORDOVA_ANDROID_GRADLE_DISTRIBUTION_URL'] || 'https\\://services.gradle.org/distributions/gradle-4.1-all.zip';
```

> - 把这个资源下载下来(具体下载哪个版本，根据`distributionUrl`来下载)，放到`platforms/android/gradle`
> - 下载地址：https://services.gradle.org/distributions/gradle-4.1-all.zip

![把下载好的 gradle 压缩包放到 platforms/android/gradle 目录下](https://s.poetries.top/gitee/2019/10/300.png)

版本号一定要跟 `distributionUrl` 里写的对上，下错版本的表现是构建时报一堆莫名其妙的语法错误，因为 `Gradle` 各大版本之间的构建脚本 DSL 是不兼容的。


```js
// 注释
// var distributionUrl = process.env['CORDOVA_ANDROID_GRADLE_DISTRIBUTION_URL'] || 'https\\://services.gradle.org/distributions/gradle-4.1-all.zip';

// 新增
var distributionUrl = process.env['CORDOVA_ANDROID_GRADLE_DISTRIBUTION_URL'] || '../gradle-4.1-all.zip';
```

这里有个隐患要说明：`GradleBuilder.js` 在 `platforms/android` 目录下，那是生成物，删平台重加或者某些 `prepare` 操作之后改动就没了。所以这个改法适合应急，长期方案是从注释里那个环境变量入手，在 `.bash_profile` 里 `export CORDOVA_ANDROID_GRADLE_DISTRIBUTION_URL=file:///你的本地路径`，这样不管重建几次都生效。

**3. 配置Gradle的环境变量**

上一步解决的是构建时自动下载的问题，这一步是让你自己也能在命令行直接用 `gradle` 命令。

**第一步**

> 把上一步下载的`Gradle`把放到任意目录，这里我放的路径`/Users/poetry/cordova/gradle-4.1`

**第二步: 新增环境变量**

> 在`mac`下编辑`.bash_profile`配置文件， `sudo vi  ~/.bash_profile`。新增一个环境变量，这里的`$HOME`就是`/Users/poetry`路径

![在 .bash_profile 中新增 Gradle 相关的环境变量](https://s.poetries.top/gitee/2019/10/310.png)

改自己家目录下的 `.bash_profile` 其实不需要 `sudo`，加了反而会让这个文件属主变成 root，之后普通编辑器保存不了。

**第三步: 使环境变量生效**

```bash
source ~/.bash_profile
```

- 如果你的终端使用`iTerm`，需要加载一条命令

```bash
sudo vi ~/.zshrc

# 新增
source .bash_profile
```

![在 .zshrc 中加入 source .bash_profile 一行](https://s.poetries.top/gitee/2019/10/302.png)

这一步的原因是 `.bash_profile` 只被 `bash` 读取，而 `iTerm` 默认用的是 `zsh`，两个 shell 各读各的配置文件。macOS 从 Catalina 起默认 shell 就换成 `zsh` 了，所以现在这一步基本是必做的。写法上建议用绝对路径 `source ~/.bash_profile`，原文写的 `source .bash_profile` 是相对路径，在非家目录启动的终端里可能找不到文件。

**第四步：新开一个终端**

环境变量的修改只对新开的终端生效，老窗口里怎么试都不对。

```bash
# 执行下面命令看环境变量

echo $PATH
```

![echo $PATH 输出中可以看到新加入的 Gradle 路径](https://s.poetries.top/gitee/2019/10/303.png)

在输出里找到你刚加的那段路径，说明配置生效了。

**第五步：测试**

```bash
gradle -v
```

![gradle -v 输出的版本信息，确认环境变量配置成功](https://s.poetries.top/gitee/2019/10/304.png)

能打出版本号就算过关。打不出来的话，九成是路径写错了（要指到 `gradle` 目录下的 `bin`），或者忘了新开终端。


**4. debug测试版打包**

环境配好了，先打一个 debug 包验证链路。debug 包用的是 `Android SDK` 自带的调试签名，装在自己手机上没问题，但不能上架。

> 查看当前打包环境`ionic info`


```bash
Ionic:

   ionic (Ionic CLI)  : 4.7.1
   Ionic Framework    : ionic-angular 3.9.2
   @ionic/app-scripts : 3.2.1

Cordova:

   cordova (Cordova CLI) : 8.1.2 (cordova-lib@8.1.1)
   Cordova Platforms     : android 7.1.4, browser 5.0.4, ios 4.5.5
   Cordova Plugins       : cordova-plugin-ionic-webview 1.2.1, (and 11 other plugins)

System:

   Android SDK Tools : 26.1.1
   NodeJS            : v9.10.0
   npm               : 5.6.0
   OS                : macOS Mojave
   Xcode             : Xcode 10.1 Build version 10B61
```

> 注意：需要前面几步环境配置好了，才可以正常执行打包

```bash
# 执行这条命令默认打包的是debug版本
cordova build android 
```

这段 `ionic info` 输出把当年的完整版本组合都记下来了：`Ionic CLI 4.7.1`、`ionic-angular 3.9.2`、`Cordova CLI 8.1.2`、`android 7.1.4`、`Node v9.10.0`、`Xcode 10.1`。贴出这种具体版本很有价值，因为「同样的命令别人能跑我跑不了」十有八九就是版本差异。

> 打包后输出`apk`路径 `platforms/android/app/build/outputs/apk/debug/`

![debug 包构建完成后的命令行输出](https://s.poetries.top/gitee/2019/10/305.png)

![在输出目录下生成的 debug 版 apk 文件](https://s.poetries.top/gitee/2019/10/306.png)

> 生成的`apk`。此时可以把`apk`，拖入`Genymotion`模拟器调试

拖进模拟器能装能跑，说明构建这条链路是通的，接下来才有资格谈正式包。

**5. 正式版本打包**

正式包要走三道工序：先构建出未签名的 apk，再用你的私钥签名，最后做字节对齐优化。缺一道都上不了架。

**5.1 未签名版本**

> 此时打包的`apk`是没有签名的版本，不可以在手机上安装

```bash
# 生成未签名版
ionic cordova build android  --release
```

![执行 release 构建后的命令行输出](https://s.poetries.top/gitee/2019/10/307.png)

`--release` 和 debug 的区别不只是签名，它还会开启代码压缩和资源优化，包体会小一截，但也因此更容易暴露出 debug 下不出现的问题（比如被压缩器改名后反射失效）。**正式发版前一定要用 release 包完整测一遍**，别拿 debug 包测完就发。

> 打包后输出`apk`路径 `platforms/android/app/build/outputs/apk/release`

> 在手机安装示意图，签名版不能安装

![未签名的 apk 在手机上安装被系统拒绝的提示](https://s.poetries.top/gitee/2019/10/308.png)

这里原文的表述反了，图上演示的是**未签名版**不能安装。安卓从系统层面要求所有 apk 必须签名才能安装，没有例外。所以下一步就是签名。

**5.2 签名版本apk打包**

签名这件事解决的是「这个包确实是我发的」以及「后续更新确实来自同一个人」。安卓靠的是你自己生成的一对密钥，**这个密钥文件丢了就没法给已上架的应用发更新了**，只能换包名重新上架，用户全部流失。所以生成之后第一件事是备份，密码也记好。

**签名步骤**

**1. 创建私钥，项目根目录下执行命令(记住设置的别名)**

```
keytool -genkey -v -keystore [自定义秘钥文件名，如 my-app].jks -keyalg RSA -keysize 2048 -validity 36500 -alias [自定义app别名，如 my-alias]
```


- `-genkey`		意味着执行的是生成数字证书操作
- `v`			表示将生成证书的详细信息打印出来，显示在`dos`窗口中
- `-keyalg RSA`		表示生成密钥文件所采用的算法为`RSA`
- `-validity 36500`		表示该数字证书的有效期为`36500`天

**2. 接下来会让设置秘钥库口令(记住秘钥)：**

> 秘钥库就是你的密码

![keytool 提示输入密钥库口令](https://s.poetries.top/gitee/2019/10/309.png)

这个口令和后面的别名口令一定要记下来，写进团队的密码管理工具里。丢了跟丢文件是一个后果。

**3. 设置秘钥库口令后会让输入一些APP信息**

![依次填写姓名、组织、城市、国家代码等证书信息](https://s.poetries.top/gitee/2019/10/310.png)

这些信息（姓名、组织单位、城市、省份、国家代码）会写进证书里，填真实的就行，填错了不影响使用但改不了。最后会让你确认一遍，输入 `y` 或者 `是` 回车。

**4. 按照提示依次输入后会在你的项目根目录生成秘钥文件 my-app.jks**

> 把之前生成好的`platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk`复制到项目根目录，这样和`my-app.jks`同一目录签名

```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore [上步生成的xxx.jks] app-release-unsigned.apk [步骤1命令中设置的app别名，如 my-alias]
```

```bash
# 这里是上面的示例：执行签名命令
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-app.jks app-release-unsigned.apk my-app
```

原文这里贴的示例误粘成了上面那条 `keytool -genkey` 生成密钥的命令，我按 `jarsigner` 的实际用法改正了。注意 `jarsigner` 是**原地签名**，它直接改你传进去的那个 apk，不会另存一份，所以最好先备份一个未签名的副本。

再补一句时效性：`jarsigner` 走的是 v1（JAR）签名方案，安卓 7.0 之后引入了 v2 及更新的方案，`Google Play` 现在对签名方案有最低要求。当前推荐的工具是 `Android SDK` 自带的 `apksigner`，用法是 `apksigner sign --ks my-app.jks --out app-release.apk app-release-unsigned.apk`。老项目继续用 `jarsigner` 装机测试没问题，要上架的话以商店当前的要求为准。

**5. 验证应用是否签名成功**

```bash
jarsigner -verify -verbose -certs 你的apk名
```

```bash
# 示例
jarsigner -verify -verbose -certs app-release-unsigned.apk
```

输出里出现 `jar verified` 就是签好了。用 `apksigner` 的话对应的验证命令是 `apksigner verify -v your.apk`，它还会告诉你用的是哪几个版本的签名方案。

**6. 优化 apk 文件**

`zipalign` 干的是字节对齐，把 apk 里的资源按 4 字节边界对齐，这样系统可以直接内存映射读取，运行时内存占用更低。`Google Play` 对此有强制要求，不做会被拒。

顺序上有个硬规则：**用 `jarsigner` 签名的话，必须先签名后对齐**；如果用 `apksigner`，则要反过来，先对齐再签名。搞反了签名会失效。

**6.1 首先需要配置环境变量**

```bash
# 这里以mac下的iTerm2来配置
vi ~/.bash_profile

# 增加一行
export PATH=$PATH:$ANDROID_HOME/build-tools/27.0.3

# 这里其实是安卓的路径,我们需要给zipalign配置环境变量
/Users/poetry/Library/Android/sdk/build-tools/27.0.3/zipalign

# 使得bash_profile生效
source ~/.bash_profile

# 因为使用到iTerm2需要在.zshrc加入.bash_profile
vi ~/.zshrc

# 加入bash_profile
source .bash_profile

# 最后新建窗口echo $PATH就看到环境变量配置了

# 查看是否生效
zipalign -v
```

![echo $PATH 输出中包含 build-tools 路径，确认 zipalign 可用](https://upload-images.jianshu.io/upload_images/1480597-2fbdaea1e10a67d3.png)

注意路径里那个 `27.0.3` 是 `build-tools` 的版本号，得换成你本机实际装的版本，去 `$ANDROID_HOME/build-tools/` 下看一眼有哪些目录就知道了。

**6.2 在项目根目录执行**

```bash
# 自定义最终生成的apk的名字，如 ionicQa.apk
zipalign -v 4 app-release-unsigned.apk ionicQa.apk
```

那个 `4` 是对齐字节数，固定写 4 就行，这是安卓要求的值。输出的第二个文件名就是最终产物，可以起个带版本号的名字方便区分。

**7. 遇到的问题**

**7.1 无法打开 jar 文件**

> 将 秘钥文件 `xxx.jks` 与 `android-release-unsigned.apk` 放在同一目录下，放到项目根目录就好了

这个报错的原因通常不是「必须同目录」，而是路径没写对。`jarsigner` 的最后一个参数是 apk 路径，你在项目根目录执行却传了个只有文件名的相对路径，它自然找不到。放同目录是最省事的绕法，写全路径也一样能解决。

> 此时就构建好了应用，这里是[构建的应用](https://github.com/poetries/ionic-qa-app/blob/master/ionicQa.apk)

#### 12.5.3 网站微信端发布

> 打包成一个静态站点方便部署

```bash
sudo ionic build 
```

> 静态网站部署的站点资源路径 `platform/browser/www`

这条路的性价比很高：同一份代码多一个投放渠道，不用过应用商店审核，改完直接部署就生效。要注意的是纯浏览器环境下所有原生插件都不可用，代码里得做环境判断给出降级方案，不然一进页面就报错。

## 十三、一些问题记录

### 13.1 问题

**1. 【ionic3】刷新页面，ws中断**

> 解决办法升级`@ionic/app-scripts`

```bash
npm install @ionic/app-scripts@latest --save-dev
```

这个 `ws` 指的是 `ionic serve` 用来做热更新的 WebSocket 连接。断掉的表现是改了代码浏览器不自动刷新，得手动刷。升级构建脚本能解决大部分情况，如果还不行，试试 `ionic serve --no-livereload` 关掉热更新自己手动刷，或者检查是不是有代理软件把本地 WebSocket 拦了。

### 13.2 技巧

**读取可空对象**

> `question?.ContentTitle` `question`可能返回空

这个问号叫安全导航运算符，`Angular` 模板里专用。它解决的是异步数据的时序问题：模板先渲染、数据后到，`question` 还是 `undefined` 的时候直接访问属性会抛错，整个页面白屏。加上问号，值为空就渲染空字符串，页面正常显示。

数据嵌套深的时候可以连着写：`user?.profile?.avatar`。`TypeScript` 3.7 之后 `.ts` 文件里也支持同样的语法了（叫可选链），配合空值合并 `??` 用起来更顺手。这个小符号能挡掉相当一部分「页面偶尔白屏」的问题，值得养成习惯。

## 十四、更多参考

### 14.1 项目学习

> 完整的示例项目在这里：https://github.com/poetries/ionic-qa-app

上面讲的这些东西，从页面结构、原生插件调用、主题切换到打包签名，在这个仓库里都能找到实际的代码。看文档看不明白的地方，直接翻代码往往更快。

### 14.2 文档参考

- [Ionic官方文档](https://ionicframework.com/docs/)
- [ionic官方GitHub](https://github.com/ionic-team)
- [Ionic菜鸟教程](http://www.runoob.com/ionic/ionic-tutorial.html)

## 总结

这篇内容铺得比较开，最后把几条真正需要记住的东西收一下。

**架构上，分清三层。** `Angular` 管应用结构，`Cordova` 管原生桥接和打包，`Ionic` 管 UI 组件。遇到问题先判断是哪一层的，再去对应的文档里查，这个习惯能省掉大量无效搜索。

**开发上，分清源码和生成物。** `src`、`resources`、`config.xml` 是你的东西，`www`、`platforms`、`plugins` 是生成的。所有「改了不生效」的问题答案都是 `ionic build` 加 `cordova prepare`，所有「改完又没了」的问题答案都是你改错了地方，应该去改 `config.xml`。

**生命周期上，分清一次性和每次执行。** `ionViewDidLoad` 只跑一次放初始化，`ionViewWillEnter` 每次都跑放刷新，清理逻辑放 `ionViewWillLeave`。放错位置的表现是数据不刷新或者接口被重复调，都很难一眼看出来。

**打包上，两端各有一个必须记牢的东西。** iOS 是描述文件这条链，包名、证书、设备列表任何一个变了都得重新生成描述文件并重新打包；安卓是那个 `.jks` 密钥文件，丢了就没法给已上架应用发更新，生成之后立刻备份。

最后回到时效性这个问题。`Ionic 3` 和 `Cordova` 这套组合今天已经不是合适的新项目选型了，`Cordova` 进了 `Apache Attic`，官方接班的是 `Capacitor`。但这篇里安卓签名、`Gradle` 环境、iOS 上架、启动图裁切规则、`WebView` 里的时序问题这些内容，跟框架版本没什么关系，换个技术栈照样会遇到。手上还有 `Ionic 3` 存量项目要维护的话，这篇够你查；要往新版本迁，先看一遍 [Ionic3 升级 Ionic4 变更对比](https://feinterview.poetries.top/blog/ionic3-to-ionic4) 了解那道分水岭在哪。

## 参考

- Ionic 官方文档 <https://ionicframework.com/docs>
- Ionic Native / Awesome Cordova Plugins 文档 <https://ionicframework.com/docs/native>
- Apache Cordova 官方文档 <https://cordova.apache.org/docs/en/latest/>
- Angular 官方文档 <https://angular.cn/docs>
- Android 开发者文档：为应用签名 <https://developer.android.com/studio/publish/app-signing>
- Android 开发者文档：zipalign <https://developer.android.com/tools/zipalign>
- Capacitor 官方文档 <https://capacitorjs.com/docs>
- Apache Attic <https://attic.apache.org/>
- [前端进阶之旅](https://interview.poetries.top)
