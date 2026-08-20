---
title: Electron 构建跨平台桌面应用实战笔记 mac/windows/linux
description: 用 HTML/CSS/JS 构建 mac、windows、linux 三端桌面应用的完整笔记，涵盖 Electron 主进程与渲染进程、IPC 通信、菜单托盘弹窗、快捷键剪贴板、electron-vue 与多平台打包。
date: 2019-01-06 17:40:43
tags: 
   - Electron
   - Node
   - 桌面应用
categories: Front-End
---

把一个已经跑在浏览器里的后台系统做成能装在电脑上的客户端，同时支持 mac 和 windows，还得有托盘图标、右键菜单、断网提醒这些「像个真软件」的细节，这活儿交给只会写前端的人能不能干？我为了搞清楚这个问题，从头到尾用 Electron 做了一个舆情监控的桌面端出来，源码在文末。结论是能干，这些原生能力 Electron 基本都包好了，剩下的还是写 HTML 和 JavaScript。

这篇是我边做边记的完整笔记，从环境搭建一路到多平台打包，中间卡住过的地方也一并留着。读完你能拿到一条从 `electron .` 跑起第一个窗口，到把应用打成 `.dmg` 和 `.exe` 的完整路径。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Electron 是什么，它凭什么能把网页变成桌面软件
- 四种搭项目的方式，以及主进程和渲染进程到底怎么分工
- 自定义顶部菜单和右键菜单
- 主进程与渲染进程、渲染进程之间的四种通信姿势
- shell、webview、dialog 这些和系统打交道的模块
- 系统托盘、图标闪烁、消息通知、监听网络变化
- 全局快捷键、剪贴板与 nativeImage
- 结合 electron-vue 做一个完整的舆情监控系统并打包上线
- 2019 年的写法放到今天该怎么改（安全模型变了，这块单独讲）

先说一句放在最前面的提醒：这篇笔记写于 2019 年初，那会儿 Electron 还允许渲染进程直接 `require('electron')`、直接读文件，`remote` 模块也还在核心里。现在的官方安全基线已经变成 `contextIsolation: true` + `nodeIntegration: false`，能力统一由 preload 脚本通过 `contextBridge` 往外暴露，`remote` 也早就从核心移出去了。原文的写法我一个字没删，因为它能帮你理解这套模型是怎么演进过来的；但每个涉及安全边界的地方，我都另起了一小段写现在该怎么做。要直接抄进新项目的话，请照着新写法来。

<!--more-->

## 一、前言

- `NW.js` 和 `Electron` 都可以用前端的知识来开发桌面应用。`NW.js` 和 `Electron `起初是同一 个作者开发。后来种种原因分为两个产品。一个命名为 `NW.js`(英特尔公司提供技术支持)、 另一命名为 `Electron`(Github 公司提供技术支持)。
- `NW.js` 和 `Electron` 可以用 `Nodejs` 中几乎所有的模块。`NW.js` 和 `Electron `不仅可以把 `html` 写的 `web` 页面打包成跨平台可以安装到电脑上面的软件，也可以通过 `javascript` 访问操作 系统原生的 `UI` 和 `Api`(控制窗口、添加菜单项目、托盘应用菜单、读写文件、访问剪贴板)。

>  `github` 的 `atom` 编辑器、微软的 `vscode` 编辑器，包括阿里内部的一些 软件也是用 `electron` 开发的

你每天在用的 `VS Code` 就是 Electron 写的。这一点对我当时的说服力比任何文档都强，一个前端能写出来的东西，可以是编辑器这种量级的产品，那我做个后台客户端总归没问题。

顺着上面聊，`NW.js` 和 `Electron` 的分家其实是个挺有意思的历史。它们的入口哲学不一样：`NW.js` 是以页面为入口，直接指一个 `html` 文件就能跑；Electron 是以脚本为入口，先起一个 Node 进程（主进程），再由这个进程去开窗口装页面。这个差别看着小，但它决定了后面整篇笔记的所有内容，因为「主进程和渲染进程分工」这件事就是从这儿来的。

下面这几个问题是我当时给自己列的自查清单，搞清楚了再动手。

**1. Electron 是由谁开发的?**

> `Electron` 是由 `Github` 开发

**2.  Electron 是什么?**

> `Electron` 是一个用 `HTML`，`CSS` 和 `JavaScript` 来构建跨平台桌面应用程序的一个开源库

**3. Electron 把 HTML，CSS 和 JavaScript 组合的程序构建为跨平台桌面应用程序的原理 是什么?**

> 原理为 `Electron` 通过将 `Chromium` 和 `Node.js` 合并到同一个运行时环境中，并将其打包为 `Mac`，`Windows` 和 `Linux` 系统下的应用来实现这一目的。

**4. Electron 何时出现的，为什么会出现?**

> `Electron` 于 `2013` 年作为构建 `Atom` 的框架而被开发出来。这两个项目在 `2014` 春季开源。 (Atom:为 Github 上可编程的文本编辑器)

**一些历史:**
- `2013` 年 `4` 月 `Atom Shell` 项目启动 。
- `2014` 年 `5` 月 `Atom Shell` 被开源 。
- `2015` 年 `4` 月 `Atom Shell` 被重命名为 `Electron` 
- `2016` 年 `5` 月 `Electron` 发布了 `v1.0.0` 版本 

**5. Electron 当前流行程度?**

> 目前 `Electron` 已成为开源开发者、初创企业和老牌公司常用的开发工具。

**6. Electron 当前由那些人在维护支持?**

> `Electron` 当前由 `Github` 上的一支团队和一群活跃的贡献者维护。有些贡献者是独立开发者，有些则在用 `Electron` 构建应用的大型公司里工作。

**7. Electron 新版本多久发布一次?**

> `Electron` 的版本发布相当频繁。每当 `Chromium`、`Node.js` 有重要的 `bug` 修复，新 `API` 或是版本更新时 `Electron` 会发布新版本。

- 一般 `Chromium` 发行新的稳定版后的一到两周之内，`Electron` 中 `Chromium` 的版本会对其进行更新，具体时间根据升级所需的工作量而定。
一般 `Node.js` 发行新的稳定版一个月后，`Electron` 中 `Node.js` 的版本会对其进行更新，具 体时间根据升级所需的工作量而定。

**8. Electron 的核心理念是什么?**

> `Electron` 的核心理念是:保持 `Electron` 的体积小和可持续性开发。
如:为了保持 `Electron` 的小巧 (文件体积) 和可持续性开发 (以防依赖库和 `API` 的泛滥) ， `Electron` 限制了所使用的核心项目的数量。
比如 `Electron` 只用了 `Chromium` 的渲染库而不是其全部组件。这使得升级 `Chromium` 更加容易，但也意味着 `Electron` 缺少了 `Google Chrome` 里的一些浏览器相关的特性。 添加到 `Electron` 的新功能应该主要是原生 `API`。 如果可以的话，一个功能应该尽可能的成 为一个 `Node.js` 模块。

**9. Electron 当前的最新版本为多少?**

> `Electron` 当前的最新版本为 `4.0.1` (当前时间为 `2019` 年 `1` 月 `6` 号)

这个 `4.0.1` 是我写这篇笔记那天的版本，现在早就翻了好几倍了，具体多少以官方 releases 页面为准。我不写死数字，因为 Electron 的发版节奏是跟着 Chromium 走的，你今天看到的数字过两周就不对了。真正需要记住的是它的支持策略：只有最近几个 major 版本会拿到安全补丁，老版本用着用着就等于把一个不再打补丁的 Chromium 装进了用户电脑。所以选版本这件事，别挑「我熟悉的那个」，挑还在支持窗口里的那个。

回到我们要解决的问题。搞明白 Electron 是「Chromium 渲染 + Node 运行时」这一个合体，后面所有 API 的位置就都好理解了：跟界面有关的走 Chromium 那一半，跟系统有关的走 Node 那一半，两半之间靠进程通信连起来。

## 二、环境搭建

搭环境这块有四条路，从「一条命令跑起来」到「一个文件一个文件手搓」都有。我建议第一次学的时候走手搓那条，因为只有自己写一遍 `main.js`，你才知道那个窗口是谁创建的、什么时候创建的。等你熟了，做真实项目再用脚手架。

**1. 安装 electron**

```bash
npm install -g electron
```

全局装是为了能在任意目录直接敲 `electron .`，方便试手。真实项目里我更推荐装成项目的 `devDependencies`，理由很实在：Electron 的版本号决定了你的 Chromium 和 Node 版本，全局装的话每个项目共用同一个运行时，一旦你同时维护两个不同版本的项目就会互相打架，而且报出来的错和版本八竿子打不着，很难往这个方向想。

**2. 克隆一个仓库、快速启动一个项目**

```bash
# 克隆示例项目的仓库
git clone https://github.com/electron/electron-quick-start

# 进入这个仓库
cd electron-quick-start

# 安装依赖并运行
npm install && npm start
```

`electron-quick-start` 是官方维护的最小样板，`main.js` 加 `index.html` 加 `package.json` 三个文件，看完不超过五分钟。想快速确认自己机器上的环境没问题，跑它最快。

**3. 手动搭建一个 electron 项目**

1. 新建一个项目目录 例如: `electrondemo01`
2. 在 `electrondemo01` 目录下面新建三个文件: `index.html`、`main.js` 、`package.json `
3. `index.html` 里面用 `css` 进行布局(以前怎么写现在还是怎么写)
4. 在 `main.js` 中写如下代码

这段代码是整个 Electron 应用的起点，它就干三件事：等 Electron 初始化完成、创建一个 800x600 的窗口把 `index.html` 装进去、在窗口关掉时把引用置空。`package.json` 里的 `main` 字段要指向这个文件，Electron 启动时先跑的就是它。

```js
var electron = require('electron'); // electron 对象的引用
const app = electron.app;           // 控制应用生命周期
const BrowserWindow = electron.BrowserWindow; // BrowserWindow 类的引用

let mainWindow = null;

// 监听应用准备完成的事件
app.on('ready', function () {
    // 创建窗口
    mainWindow = new BrowserWindow({ width: 800, height: 600 });
    mainWindow.loadFile('index.html');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
});

// 监听所有窗口关闭的事件
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
```

有两个点特别容易被跳过去，但它们都是有原因的。

`let mainWindow = null` 为什么要放在函数外面？因为 `BrowserWindow` 对象一旦被 JavaScript 垃圾回收，对应的原生窗口就跟着关了。如果你写成 `app.on('ready', function () { let win = new BrowserWindow(...) })`，窗口有时候会莫名其妙自己消失。放到模块作用域顶层，就是为了留一个全局引用把它拴住。

`window-all-closed` 里那个 `process.platform !== 'darwin'` 判断，是在照顾 mac 的习惯。windows 和 linux 上关掉最后一个窗口就等于退出程序，mac 上不是，应用会继续留在 Dock 里，得按 Cmd + Q 才真退。这行判断让你的应用在两种系统上都表现得像本地应用。跨平台开发里这种小分支后面还会遇到很多。

5. 运行

```bash
electron . #注意:命令后面有个点
```

那个点是「当前目录」的意思，Electron 会去读当前目录 `package.json` 的 `main` 字段。少打这个点是新手最常见的报错来源。

**4. electron-forge 搭建一个 electron 项目**

> `electron-forge` 相当于 `electron` 的一个脚手架，可以让我们更方便的创建、运行、打包 `electron` 项目

```bash
npm install -g electron-forge 

electron-forge init my-new-app 

cd my-new-app

npm start
```

`electron-forge` 的价值在打包那一步才体现出来，它把 `electron-packager`、生成安装包这些活儿串成了一条命令。这篇后面第十三节会专门讲打包，到那儿你就明白为什么不建议自己从零配。

需要提一句，`electron-forge` 这些年 CLI 用法有过调整，包名和初始化命令跟 2019 年不完全一样了，动手前对一下官方文档，我就不写死命令了。

## 三、Electron 运行流程

这一节是整篇里最该慢慢看的部分。Electron 的绝大多数「奇怪问题」，追到底都是主进程和渲染进程分不清导致的。你在渲染进程里 `require('electron').dialog` 拿到 `undefined`，在主进程里 `document.querySelector` 直接报错，都是同一个原因。

### 3.1 Electron 运行的流程

下面这张图是整个启动链路：`package.json` 的 `main` 指向主进程脚本，主进程起来后创建 `BrowserWindow`，每个 `BrowserWindow` 内部跑一个独立的渲染进程去加载你的页面。

 ![Electron 应用启动流程：package.json 的 main 指向主进程脚本，主进程创建 BrowserWindow 并加载页面](https://s.poetries.top/gitee/20191001/48.png)

看懂这张图你就能回答一个常见面试题：为什么 Electron 应用一打开，任务管理器里会冒出好几个进程？因为主进程一个，每个窗口一个渲染进程，再加 GPU 进程和网络服务进程，这套架构是从 Chromium 那边原样继承过来的。

### 3.2 Electron 主进程和渲染进程

- `Electron` 运行 `package.json` 的 `main` 脚本的进程被称为主进程。 
- 在主进程中运行的脚本通过创建 `web` 页面来展示用户界面。 一个 `Electron` 应用总是有且只有一个主进程。
- 由于 `Electron` 使用了 `Chromium`(谷歌浏览器)来展示 `web` 页面，所以 `Chromium` 的 多进程架构也被使用到。 每个 `Electron` 中的 `web` 页面运行在它自己的渲染进程中。
- 主进程使用 `BrowserWindow` 实例创建页面。每个 `BrowserWindow` 实例都在自己的渲 染进程里运行页面。 当一个 `BrowserWindow`实例被销毁后，相应的渲染进程也会被终止

下面两张图把这层关系画得更清楚，一个主进程带着 N 个渲染进程，主进程负责生命周期和原生能力，渲染进程只管画界面。

 ![Electron 主进程与多个渲染进程的层级关系示意图](https://s.poetries.top/gitee/20191001/49.png)

![每个 BrowserWindow 实例对应一个独立渲染进程的架构图](https://s.poetries.top/gitee/20191001/50.png)

记住一个判断标准，你就不用背 API 表了：凡是「窗口级别以上」的能力，菜单、托盘、弹窗、应用退出、全局快捷键，都归主进程；凡是「窗口内部」的事，DOM、CSS、页面路由，都归渲染进程。中间那条线跨不过去，只能靠通信。

顺带把进程和线程的概念也捋一下，后面讲通信会反复用到。

- 进程:进程是计算机中的程序关于某数据集合上的一次运行活动，是 系统进行资源分配和调度的基本单位，是操作系统结构的基础。
- 线程:在一个程序里的一个执行路线就叫做线程(`thread`)。更准确的定义是: 线程是「一个进程内部的控制序列」。
- 线程和进程:一个程序至少有一个进程,一个进程至少有一个线程

进程之间内存是隔离的，这就是为什么两个窗口不能直接互相调函数，必须走 IPC 把数据序列化后传过去。第六节整节都在讲这件事。

### 3.3 Electron 渲染进程中通过 Nodejs 读取本地文件

> 在普通的浏览器中，`web`页面通常在一个沙盒环境中运行，不被允许去接触原生的资源。 然而 `Electron` 的用户在 `Node.js` 的 `API`支持下可以在页面中和操作系统进行一些底层交 互。
`Nodejs` 在主进程和渲染进程中都可以使用。渲染进程因为安全限制，不能直接操作生 `GUI`。虽然如此，因为集成了 Nodejs，渲染进程也有了操作系统底层 `API`的能力，`Nodejs` 中常用的 `Path`、`fs`、`Crypto` 等模块在 `Electron` 可以直接使用，方便我们处理链接、路径、 文件 `MD5` 等，同时 `npm` 还有成千上万的模块供我们选择。

```js
var fs = require('fs');
var content = document.getElementById('content'); 
var button = document.getElementById('button');

button.addEventListener('click',function(e){
    fs.readFile('package.json','utf8',function(err,data){ 
        content.textContent = data;
        console.log(data);
    }); 
});
```

这段代码点一下按钮，就把项目里的 `package.json` 读出来塞进页面。在浏览器里这是绝对做不到的事，`fs` 根本不存在。能跑通，是因为 Electron 把 Node 的模块系统注入进了渲染进程。

**这里必须插一段 2019 年之后的变化，不看这段直接抄代码会有安全问题。**

上面这种「渲染进程里直接 `require('fs')`」的写法，前提是窗口开了 `nodeIntegration: true`。在我写这篇笔记的时候，这个选项默认就是开的，所以原文里所有例子都没写它。后来 Electron 把默认值反过来了，现在新建窗口的安全基线是这样：

```js
// 现在推荐的窗口配置
mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,   // 页面上下文和 preload 上下文隔离
        nodeIntegration: false,   // 页面里拿不到 require / process
        sandbox: true             // 渲染进程进沙箱
    }
});
```

为什么要改？你想想看，只要页面里加载了任何一段第三方脚本，广告 SDK 也好、被劫持的 CDN 也好，`nodeIntegration: true` 就等于把用户整台电脑的文件读写权限交给了那段脚本。它可以 `require('child_process').exec` 干任何事。这已经不是 XSS 了，是直接的远程代码执行。

新写法是把能力收到 preload 里，只暴露你确实需要的那几个函数：

```js
// preload.js，跑在渲染进程但拥有 Node 能力
const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');

contextBridge.exposeInMainWorld('nativeApi', {
    // 只暴露读 package.json 这一个能力，而不是整个 fs
    readPackageJson: () => fs.promises.readFile('package.json', 'utf8'),
    // 需要主进程配合的，走 IPC
    openFile: () => ipcRenderer.invoke('dialog:openFile')
});
```

```js
// 渲染进程里就变成这样，页面拿不到 fs，只拿得到你定义的那一个方法
const content = document.getElementById('content');
document.getElementById('button').addEventListener('click', async () => {
    content.textContent = await window.nativeApi.readPackageJson();
});
```

差别在哪？前一种写法里页面能干的事等于 Node 能干的事；后一种写法里页面能干的事，等于你在 `exposeInMainWorld` 里明确列出来的那几行。攻击面从「无限」缩到「你写了几个函数」。

原文后面所有渲染进程直接 `require('electron')` 的例子，迁移思路都是同一个：能力搬进 preload，页面通过 `contextBridge` 暴露出来的对象调用。我不再每处重复了。具体的配置项名称和默认值以官方文档的 Security 章节为准，各版本之间有过调整。

### 3.4 Electron 开启调试模式

Electron 内置的就是 Chrome DevTools，Elements、Console、Network 一个不少，调试体验和调网页完全一致。开发阶段直接在创建窗口后加一行：

```js
 mainWindow.webContents.openDevTools();
 ```
 
![Electron 窗口中打开的 Chrome DevTools 调试面板](https://s.poetries.top/gitee/20191001/51.png)

记得打包前把这行去掉，或者用 `process.env.NODE_ENV` 包一层。我见过不止一个正式版应用一启动就弹 DevTools 的，挺尴尬。另外提醒一句，主进程的代码是不会出现在这个 DevTools 里的，它跑在另一个进程，`console.log` 打在你启动 `electron .` 的那个终端窗口里。这个我一开始也懵过，在 DevTools 里找了半天找不到主进程的日志。

## 四、Electron 模块介绍

> `Electron` 模块介绍、`remote` 模块、通 过 `BrowserWindow` 打开新窗口

### 4.1 Electron 主进程和渲染进程中的模块

Electron 的 API 按可用位置分成三类：只能在主进程用的、只能在渲染进程用的、两边都能用的。下面这张表值得截图存下来，写代码时对着看能省很多次「为什么是 undefined」。

![Electron 模块分类表：主进程模块、渲染进程模块、通用模块](https://s.poetries.top/gitee/20191001/52.png)

规律其实很直白，`app`、`Menu`、`Tray`、`dialog`、`globalShortcut`、`BrowserWindow` 这些碰系统的都在主进程；`ipcRenderer`、`webFrame` 在渲染进程；`clipboard`、`shell`、`nativeImage`、`crashReporter` 两边通用。通用的那几个之所以通用，是因为它们不需要维护窗口状态，调一次拿一次结果就完事。

### 4.2 Electron remote 模块

> `remote` 模块提供了一种在渲染进程(网页)和主进程之间进行进程间通讯(`IPC`)的简便途径

> `Electron` 中, 与 `GUI` 相关的模块(如 `dialog`, `menu` 等)只存在于主进程，而不在渲染进程中 。为了能从渲染进程中使用它们，需要用`ipc`模块来给主进程发送进程间消息。使用 `remote` 模块，可以调用主进程对象的方法，而无需显式地发送进程间消息，这类似于 `Java` 的 `RMI`

`remote` 用起来是真的舒服，在渲染进程里写 `require('electron').remote.dialog.showErrorBox(...)`，感觉就像在同一个进程里调函数。这也是它在 2019 年那波教程里出镜率极高的原因。

但它现在已经从 Electron 核心里移除了。

`remote` 被砍掉有三个原因，都挺硬：一是它把每次属性访问都变成一次隐藏的同步 IPC，你写一行看着像本地调用的代码，实际可能触发好几次跨进程往返，性能坑得毫无提示；二是它的错误堆栈会断在进程边界上，出了问题极难排查；三是最要命的，它等于给渲染进程开了一条通往主进程任意对象的通道，跟上一节说的 `nodeIntegration` 是同一类风险。

迁移方向是明确的：把 `remote.xxx` 换成 `ipcRenderer.invoke` 加主进程侧的 `ipcMain.handle`。也就是把「隐式的远程调用」改回「显式的消息传递」，你自己决定哪些操作可以被页面触发。社区还有一个把老代码搬出去的独立模块可以过渡，但新项目别用了。原文后面 `remote` 出现了很多次，我都保留原样，你看到时心里有数就行。

一个对照的例子，感受一下改法：

```js
// 老写法（remote，已从核心移除）
const { dialog } = require('electron').remote;
dialog.showErrorBox('警告', '操作有误');
```

```js
// 新写法：主进程侧
const { ipcMain, dialog } = require('electron');
ipcMain.handle('dialog:showError', (event, title, content) => {
    dialog.showErrorBox(title, content);
});

// preload 侧
contextBridge.exposeInMainWorld('nativeApi', {
    showError: (title, content) => ipcRenderer.invoke('dialog:showError', title, content)
});

// 页面侧
window.nativeApi.showError('警告', '操作有误');
```

代码是多了几行，但换来的是「页面只能做主进程明确允许的事」。这笔账我觉得划算。

### 4.3 通过BrowserWindow 打开新窗口

> `Electron` 渲染进程中通过 **`remote` 模块调用主进程中的 `BrowserWindow`** 打开新窗口

> https://electronjs.org/docs/api/browser-window

先看主进程这块，它是一个更完整的启动脚本，比第二节那个多了 `activate` 事件和开发者工具。注释我基本保留了原样，因为它把每一步在干什么都说清楚了。

```js
// 主进程代码


const electron = require('electron'); 

// 控制应用生命周期的模块 
const {app} = electron;

// 创建本地浏览器窗口的模块 
const {BrowserWindow} = electron;

// 指向窗口对象的一个全局引用，如果没有这个引用，那么当该 javascript 对象被垃圾回收 的
// 时候该窗口将会自动关闭
let win;

function createWindow() {
    // 创建一个新的浏览器窗口
    win = new BrowserWindow({width: 1104, height: 620});//570+50
    
    // 并且装载应用的 index.html 页面
    win.loadURL(`file://${__dirname}/html/index.html`);
    
    // 打开开发工具页面
    win.webContents.openDevTools();
    
    //当窗口关闭时调用的方法
    win.on('closed', () => {
        // 解除窗口对象的引用，通常而言如果应用支持多个窗口的话，你会在一个数组里 // 存放窗口对象，在窗口关闭的时候应当删除相应的元素。
        win = null;
    });
}

// 当 Electron 完成初始化并且已经创建了浏览器窗口，则该方法将会被调用。
// 有些 API 只能在该事件发生后才能被使用
app.on('ready', createWindow);

// 当所有的窗口被关闭后退出应用 
app.on('window-all-closed', () => {
    // 对于 OS X 系统，应用和相应的菜单栏会一直激活直到用户通过 Cmd + Q 显式退出 
    if (process.platform !== 'darwin') {
        app.quit(); 
    }
});


app.on('activate', () => {
    // 对于 OS X 系统，当 dock 图标被点击后会重新创建一个 app 窗口，并且不会有其他
    // 窗口打开
    if (win === null) {
        createWindow(); 
    }
});

// 在这个文件后面你可以直接包含你应用特定的由主进程运行的代码。 
// 也可以把这些代码放在另一个文件中然后在这里导入
```

这里有个 mac 专属的细节，就是那个 `activate` 事件。mac 上关掉所有窗口应用不退出，用户再点 Dock 图标时，如果你不处理 `activate`，图标点了没反应，看着就像应用挂了。这三行判断 `win === null` 就是补这个洞的。

接着是渲染进程侧，点一下按钮开一个新窗口。

```js
// 渲染进程代码 /src/render/index.js
// 打开新窗口属性用法有点类似vscode打开新的窗口

const btn = document.querySelector('#btn');
const path = require('path');
const BrowerWindow = require('electron').remote.BrowserWindow;

btn.onclick = () => {
    win = new BrowerWindow({ 
        width: 300,
        height: 200, 
        frame: false, // false隐藏关闭按钮、菜单选项 true显示
        fullscreen:true, // 全屏展示
        transparent: true 
    }) 

    win.loadURL(path.join('file:',__dirname,'news.html'));

    win.on('close',()=>{win = null});
}
```

![通过 remote 调用 BrowserWindow 打开的无边框透明新窗口效果](https://s.poetries.top/gitee/20191001/53.png)

这几个窗口参数值得单独说说，做客户端的时候用得非常频繁。`frame: false` 去掉系统自带的标题栏和红黄绿三个按钮，这是所有「自定义外观」应用的第一步，QQ、网易云那种自绘标题栏就是这么来的，代价是最小化最大化关闭都得你自己实现，第十三节有具体做法。`transparent: true` 让窗口背景透明，配合 `frame: false` 能做出不规则形状的窗口，比如桌面挂件。`fullscreen: true` 直接全屏。

需要注意的是，`transparent` 在不同平台上的表现并不一致，linux 下依赖桌面环境的合成器支持，同时开透明和 resize 也有已知的限制。真要用，先在目标平台上实测一遍。

同样提醒一下，这段渲染进程代码用的是 `require('electron').remote`，现在的做法是页面点击时通过 IPC 通知主进程去 `new BrowserWindow`，第六节 6.1.4 那个例子其实已经是正确姿势了，直接照那个写就行。

## 五、自定义顶部菜单/右键菜单

菜单是把网页变成「软件」最直观的一步。加上顶部菜单栏和右键菜单，用户的观感立刻就不一样了。

![Electron 自定义顶部菜单与右键菜单效果预览](https://s.poetries.top/gitee/20191001/54.png)

Electron 的 `Menu` 模块设计得挺克制，你只需要描述一个树形的模板数组，剩下的渲染交给系统。mac 上它会出现在屏幕顶部的全局菜单栏，windows 和 linux 上它挂在窗口内部，你写一份代码两边都对。

### 5.1 主进程中调用Menu模块-自定义软件顶部菜单

> https://electronjs.org/docs/api/menu-item


> `Electron` 中 `Menu` 模块可以用来创建原生菜单，它可用作应用菜单和 `context` 菜单

> 这个模块是一个主进程的模块，并且可以通过 `remote` 模块给渲染进程调用

下面这段就是一份完整的菜单模板，三个顶级项，每个下面挂子菜单。注意看「编辑」那组用的是 `role` 而不是 `click`。

```js
// main/menu.js
const { Menu }  = require('electron')

// 文档 https://electronjs.org/docs/api/menu-item
// 菜单项目
let menus = [
    {
        label: '文件',
        submenu: [
            {
                label: '新建文件',
                accelerator: 'ctrl+n', // 绑定快捷键
                click: function () { // 绑定事件
                    console.log('新建文件')
                }
            },
            {
                label: '新建窗口',
                click: function () {
                    console.log('新建窗口')
                }
            }
        ]
    },
    {
        label: '编辑',
        submenu: [
            {
                label: '复制',
                role: 'copy' // 调用内置角色实现对应功能
            },
            {
                label: '剪切',
                role: 'cut'  // 调用内置角色实现对应功能
            }
        ]
    },
    {
        label: '视图',
        submenu: [
            {
                label: '浏览'
            },
            {
                label: '搜索'
            }
        ]
    }
]

let m = Menu.buildFromTemplate(menus)
Menu.setApplicationMenu(m)
```

这里有三个字段决定了菜单好不好用。

`accelerator` 绑快捷键，写法是 `'ctrl+n'` 这种字符串。跨平台的时候别硬编码 `ctrl`，Electron 提供了 `CmdOrCtrl` 这个占位符，它在 mac 上是 Command 在 windows 上是 Ctrl，写 `'CmdOrCtrl+N'` 一份代码两边都对。原文这里写死了 `ctrl+n`，在 mac 上用户按 Command+N 是不会触发的，这算是个实际会踩的坑。

`role` 是内置角色，像 `copy`、`cut`、`paste`、`undo`、`selectAll` 这些。为什么优先用 `role` 而不是自己 `click` 里写逻辑？因为剪切复制粘贴是由系统和 Chromium 处理的，你自己实现不但要处理焦点在哪个输入框，还要处理富文本、图片这些情况，费力还容易出 bug。能用 `role` 就用 `role`。

`click` 才是你自己的业务逻辑，注意它跑在主进程里，拿不到 DOM。要操作界面就得往渲染进程发消息，这就是第六节的内容了。

引入的方式很简单，在主进程创建窗口的地方 `require` 一下。

```js
// 在主进程src/index.js中引入
const createWindow = () => {

  // 创建菜单  
  // 引入菜单模块
  require('./main/menu.js')
};

```

跑起来的效果是这样，顶部多了「文件」「编辑」「视图」三组菜单。

![Electron 主进程创建的应用顶部菜单栏效果](https://s.poetries.top/gitee/20191001/55.png)

> 我们给菜单绑定事件，在命令行控制台可以看到

点击菜单项触发的 `console.log` 打在启动 Electron 的终端里，不在 DevTools 里，这一点和前面 3.4 说的一致。

![点击菜单项后主进程在终端输出日志的截图](https://s.poetries.top/gitee/20191001/56.png)

还有一个 mac 平台的坑值得先说：mac 上应用菜单的第一项永远会显示成你的应用名，而且系统预期这一项里有「关于」「退出」这些标准条目。如果你像上面这样把第一项写成「文件」，mac 用户会觉得别扭。稳妥的做法是按 `process.platform` 判断，mac 下在数组最前面插一个 `{ label: app.name, submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] }`。

### 5.2 渲染进程中调用Menu模块

> 不推荐使用这种方式，建议在主进程中使用

原文这句「不推荐」当年是从代码组织的角度说的，现在它还多了一层安全上的理由。应用级菜单本来就是全局的东西，放在渲染进程里既容易被多个窗口重复设置，又要求你开着 `remote` 通道。所以这个写法你知道有这么回事就行。

**1. remote**

> 通过`remote`调用主进程的方法

```js
// 菜单引入的方式发生变化
const { Menu }  = require('electron').remote

// 其他代码和上面菜单一样
// ...
```

**2. 加入index.html**

```html
<script src="render/menu.js"></script>
```

### 5.3 渲染进程中自定义右键菜单

右键菜单和应用菜单不一样，它天然是「跟着某个页面元素走」的。你在文件列表上右键和在编辑器里右键，菜单内容应该不同，所以它确实需要渲染进程参与判断。

**1. 定义菜单**

```js
// render/menu.js

// 在渲染进程中通过remote模块调用主进程中的模块
const { Menu }  = require('electron').remote
const { remote } = require('electron')

// 文档 https://electronjs.org/docs/api/menu-item
// 菜单项目
let menus = [
    {
        label: '文件',
        submenu: [
            {
                label: '新建文件',
                accelerator: 'ctrl+n', // 绑定快捷键
                click: function () { // 绑定事件
                    console.log('新建文件')
                }
            },
            {
                label: '新建窗口',
                click: function () {
                    console.log('新建窗口')
                }
            }
        ]
    },
    {
        label: '编辑',
        submenu: [
            {
                label: '复制',
                role: 'copy' // 调用内置角色实现对应功能
            },
            {
                label: '剪切',
                role: 'cut'  // 调用内置角色实现对应功能
            }
        ]
    },
    {
        label: '视图',
        submenu: [
            {
                label: '浏览'
            },
            {
                label: '搜索'
            }
        ]
    }
]

let m = Menu.buildFromTemplate(menus)
// Menu.setApplicationMenu(m)

// 绑定右键菜单
window.addEventListener('contextmenu', (e)=>{
   e.preventDefault()
   m.popup({
    window: remote.getCurrentWindow()
   })
}, false)
```

这段的关键在最后那个事件监听。`e.preventDefault()` 是必须的，不然 Chromium 自己那套右键菜单会跳出来。`m.popup({ window: remote.getCurrentWindow() })` 告诉 Electron 这个菜单要弹在哪个窗口上，多窗口应用里漏了这个参数会弹错地方。

注意这里没有调 `Menu.setApplicationMenu(m)`，那行被注释掉了。因为右键菜单只需要 `popup` 出来，不需要挂成应用菜单，两者用的是同一个 `Menu` 实例但用途完全不同。

![Electron 渲染进程中自定义的右键上下文菜单效果](https://s.poetries.top/gitee/20191001/57.png)

现在的做法是把菜单模板留在主进程，渲染进程监听到 `contextmenu` 事件后，通过 IPC 把「在哪儿右键了、右键的是什么元素」发给主进程，主进程决定弹哪套菜单再 `popup`。逻辑没变，只是把 `Menu` 的调用挪回了它该在的那一侧。

**2. 引入**

```html
<!--index.html-->
<script src="render/menu.js"></script>
```

## 六、进程通信

这一节是整篇的核心。前面反复说主进程和渲染进程各管一摊，那它们怎么配合？答案就是 IPC。

![Electron 主进程与渲染进程之间 IPC 通信示意图](https://s.poetries.top/gitee/20191001/58.png)

- 渲染进程 https://electronjs.org/docs/api/ipc-renderer
- 主进程 https://electronjs.org/docs/api/ipc-main

### 6.1 主进程与渲染进程之间的通信

> 有时候我们想在渲染进程中通过一个事件去执行主进程里面的方法。或者在渲染进程中通知 主进程处理事件，主进程处理完成后广播一个事件让渲染进程去处理一些事情。这个时候就 用到了主进程和渲染进程之间的相互通信

> `Electron` 主进程，和渲染进程的通信主要用到两个模块:`ipcMain` 和 `ipcRenderer`

- `ipcMain`:当在主进程中使用时，它处理从渲染器进程(网页)发送出来的异步和同步信息,当然也有可能从主进程向渲染进程发送消息。
- `ipcRenderer`: 使用它提供的一些方法从渲染进程 (`web` 页面) 发送同步或异步的消息到主进程。 也可以接收主进程回复的消息

IPC 有个前提你得记住：**跨进程传的数据会被序列化**。所以能传的只有能被结构化克隆的东西，普通对象、数组、字符串、数字都没问题；函数、DOM 节点、类实例上的方法这些传不过去。我见过有人试图把一个 Vue 组件实例发给主进程，那当然是不行的。

下面四个小节是四种不同的通信形态，从最简单的单向发消息，一路到双向回调和窗口互通。建议按顺序看，后面的都建立在前面的基础上。

#### 6.1.1 渲染进程给主进程发送异步消息

> 间接实现渲染进程执行主进程里面的方法

最基础的一种，页面发一条消息，主进程收到后做事，不需要回复。菜单点击、日志上报、通知主进程「用户登录了」这类场景都用它。

**1. 引入ipcRender**

```html
<!--src/index.html-->
<button id="send">在 渲染进程中执行主进程里的方法（异步）</button>
<script src="render/ipcRender.js"></script>
```

**2. 引入ipcMain**

```js
// 在主进程src/index.js中引入
const createWindow = () => {

  // 创建菜单  
  // 引入菜单模块
  require('./main/ipcMain.js')
};
```


**3. 渲染进程发送消息**


```js
// src/render/ipcRender.js
//渲染进程

let send = document.querySelector('#send');
const { ipcRenderer } = require('electron');

send.onclick = function () {
    // 传递消息给主进程
    // 异步
    ipcRenderer.send('sendMsg', {name:'poetries', age: 23})
}
```

**4. 主进程接收消息**

```js
// src/main/ipcMain.js

//主进程

const { ipcMain }  = require('electron')

// 主进程处理渲染进程广播数据
ipcMain.on('sendMsg', (event, data)=> {
    console.log('data\n ', data)
    console.log('event\n ', event)
})
```

`ipcRenderer.send` 和 `ipcMain.on` 就是一对，第一个参数是频道名，随便你起，但要两边一致。这个频道名建议定成常量放一个文件里，我吃过手抖打错一个字母然后盯着代码找半天的亏。

![主进程终端打印出渲染进程通过 ipcRenderer.send 发来的数据](https://s.poetries.top/gitee/20191001/59.png)

`event` 对象里最有用的是 `event.sender`，它指向发消息过来的那个 `webContents`，也就是「谁发的」。下一节的反馈就靠它。

#### 6.1.2 渲染进程发送消息，主进程接收消息并反馈

> 渲染进程给主进程发送异步消息，主进程接收到异步消息以后通知渲染进程

上一节是单向的，这一节补上回程。做法是主进程处理完后，用 `event.sender.send` 往回发一条新消息，渲染进程那边再 `ipcRenderer.on` 监听。

**1. 引入ipcRender**

```html
<!--src/index.html-->
<button id="sendFeedback">在 渲染进程中执行主进程里的方法，并反馈给主进程（异步）</button>
<script src="render/ipcRender.js"></script>
```

**2. 引入ipcMain**

```js
// 在主进程src/index.js中引入
const createWindow = () => {

  // 创建菜单  
  // 引入菜单模块
  require('./main/ipcMain.js')
};
```

**3. 渲染进程发送消息**

```js
// src/render/ipcRender.js

//渲染进程
let sendFeedback = document.querySelector('#sendFeedback');

const { ipcRenderer } = require('electron');

// 向主进程发送消息
sendFeedback.onclick = function () {
    // 触发主进程里面的方法
    ipcRenderer.send('sendFeedback', {name:'poetries', age: 23})
}
```

**4. 主进程收到消息处理并广播反馈通知渲染进程**

```js
// src/main/ipcMain.js

//主进程
const { ipcMain }  = require('electron')


// 主进程处理渲染进程广播数据，并反馈给渲染进程
ipcMain.on('sendFeedback', (event, data)=> {
    // console.log('data\n ', data)
    // console.log('event\n ', event)
    
    // 主进程给渲染进程广播数据
    event.sender.send('sendFeedbackToRender', '来自主进程的反馈')
})
```

**5. 渲染进程处理主进程广播的数据**

```js
// src/render/ipcRender.js
// 向主进程发送消息后，接收主进程广播的事件
ipcRenderer.on('sendFeedbackToRender', (e, data)=>{
    console.log('event\n ', e)
    console.log('data\n ', data)
})
```

![渲染进程收到主进程反馈消息后在 DevTools 控制台打印的结果](https://s.poetries.top/gitee/20191001/60.png)

这套「发一条、回一条」的模式能用，但有两个别扭的地方：一是你得自己维护两个频道名，`sendFeedback` 和 `sendFeedbackToRender`；二是如果同时有多个请求在飞，回来的消息你分不清是哪一个的。

Electron 后来加了 `ipcRenderer.invoke` 配 `ipcMain.handle`，直接返回 Promise，一次请求一次响应，天然对得上号：

```js
// 主进程
ipcMain.handle('sendFeedback', async (event, data) => {
    return '来自主进程的反馈';
});

// 渲染进程（通过 preload 暴露后调用）
const reply = await ipcRenderer.invoke('sendFeedback', { name: 'poetries', age: 23 });
console.log(reply);
```

新代码优先用这一对。`send` / `on` 留给真正的单向广播，比如主进程主动通知所有窗口「网络断了」。

#### 6.1.3 渲染进程给主进程发送同步消息

同步通信是另一种形态，调用完当场就能拿到返回值，写起来最顺手。

**1. 引入ipcRender**

```html
<!--src/index.html-->
 <button id="sendSync">渲染进程和主进程同步通信</button>
<script src="render/ipcRender.js"></script>
```

**2. 引入ipcMain**

```js
// 在主进程src/index.js中引入
const createWindow = () => {

  // 创建菜单  
  // 引入菜单模块
  require('./main/ipcMain.js')
};
```

**3. 渲染进程给主进程同步通信**

```js
// src/render/ipcMain.js
let sendSync = document.querySelector('#sendSync');

// 渲染进程和主进程同步通信
sendSync.onclick = function () {
    // 同步广播数据
   let msg =  ipcRenderer.sendSync('sendsync', {name:'poetries', age: 23})
    
   // 同步返回主进程反馈的数据
   console.log('msg\n ', msg)
}
```

**4. 主进程接收数据处理**

```js
// src/main/ipcMain.js

// 渲染进程和主进程同步通信 接收同步广播
ipcMain.on('sendsync', (event, data)=> {
    // console.log('data\n ', data)
    // console.log('event\n ', event)
    // 主进程给渲染进程广播数据
    event.returnValue ='渲染进程和主进程同步通信 接收同步广播，来自主进程的反馈.';
})
```

主进程这边的关键是 `event.returnValue`，赋值给它就等于「返回」。忘了赋值的话，渲染进程会一直卡在那行 `sendSync` 上。

![渲染进程同步调用主进程后立即拿到返回值的控制台输出](https://s.poetries.top/gitee/20191001/61.png)

那同步这么方便，为什么不全用同步？

因为 `sendSync` 会**阻塞渲染进程**。从你调用那一刻起，整个页面的 JavaScript 停住，动画停住，点击没响应，一直等到主进程返回。主进程如果这时候正在读一个大文件或者等网络，用户看到的就是应用卡死。

我的原则是：只有在应用启动阶段读一次配置这种场景才考虑同步，而且要确认主进程那边是纯内存操作。业务逻辑里一律用 `invoke`。这个我踩过，早期图省事在一个列表渲染里用了 `sendSync` 拿本地缓存，数据量一上来滚动直接卡成 PPT。

#### 6.1.4 渲染进程广播通知主进程打开窗口

> 一般都是在渲染进程中执行广播操作，去通知主进程完成任务

这个例子很典型，因为「开新窗口」是纯粹的主进程能力，渲染进程只能请求它去做。前面 4.3 那种在渲染进程里 `remote.BrowserWindow` 直接 new 的写法，正确的替代品就是这一节。

**1. 引入openWindow**

```html
<!--src/index.html-->
 <button id="sendSync">渲染进程和主进程同步通信</button>
<script src="render/openWindow.js"></script>
```

**2. 引入ipcMain2**

```js
// 在主进程src/index.js中引入
const createWindow = () => {

  // 创建菜单  
  // 引入菜单模块
  require('./main/ipcMain2.js')
};
```

**3. 渲染进程通知主进程打开窗口**

```js
// src/render/openWindow.js

/* eslint-disable */
let openWindow = document.querySelector('#openWindow');

var { ipcRenderer } = require('electron');

// 渲染进程和渲染进程直接的通信========
openWindow.onclick = function () {
    // 通过广播的形式 通知主进程执行操作
    ipcRenderer.send('openwindow', {name:'poetries', age: 23})
}
```

**4. 主进程收到通知执行操作**

```js
// src/main/ipcMain2.js

/* eslint-disable */
let { ipcMain,BrowserWindow } = require('electron')
const path = require('path')

let win;

// 接收到广播
ipcMain.on('openwindow', (e, data)=> {
    // 调用window打开新窗口
    win = new BrowserWindow({
        width: 400,
        height: 300,
    });
    win.loadURL(path.join('file:',__dirname, '../news.html'));
    win.webContents.openDevTools()
    win.on('closed', () => {
        win = null;
      });
})
```

`win` 变量为什么又放到模块顶层了？还是 3.2 讲过的那个原因，防止窗口对象被回收。但这里其实藏了个问题：`let win` 只有一个，你连点两次按钮，第二次会把第一个窗口的引用覆盖掉，第一个窗口就失联了。真实项目里应该用一个数组或者 Map 存所有窗口，用完从里面删掉。原文这么写是为了演示简洁，照抄到多窗口场景会出问题。

![渲染进程通知主进程后成功打开的新窗口截图](https://s.poetries.top/gitee/20191001/62.png)

### 6.2 渲染进程与渲染进程之间的通信

> 也就是两个窗口直接的通信

两个窗口之间没有直接的管道，这是进程隔离决定的。所以所谓「窗口间通信」，实际都是绕道：要么走一个双方都能访问的存储，要么走主进程中转。下面两种方案就是这两条路。

#### 6.2.1 localstorage传值

> `Electron` 渲染进程通过 `localstorage` 给另一个渲染进程传值

`localStorage` 能用是因为同源的页面共享同一份存储。窗口 A 写进去，窗口 B 读出来，简单粗暴。


**1. 引入openWindow**

```html
<!--src/index.html-->
 <button id="sendSync">渲染进程和主进程同步通信</button>
<script src="render/openWindow.js"></script>
```

**2. 引入ipcMain2**

```js
// 在主进程src/index.js中引入
const createWindow = () => {

  // 创建菜单  
  // 引入菜单模块
  require('./main/ipcMain2.js')
};
```

**3. 渲染进程通知主进程打开窗口**

```js
// src/render/openWindow.js

/* eslint-disable */
let openWindow = document.querySelector('#openWindow');

var { ipcRenderer } = require('electron');

// 渲染进程和渲染进程直接的通信========
openWindow.onclick = function () {
    // 通过广播的形式 通知主进程执行操作
    ipcRenderer.send('openwindow', {name:'poetries', age: 23})
    
    // ======= localstorage传值 =====
     localStorage.setItem('username', 'poetries')
}
```

**4. 新建news页面**

```html
<!--src/news.html-->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title></title>
  </head>
  <body>
    news page
  </body>
  <script src="render/news.js"></script>
</html>
```

```js
// src/render/news.js

let username = localStorage.getItem('username')
console.log(username)
```

**5. 主进程收到通知执行操作**

```js
// src/main/ipcMain2.js

/* eslint-disable */
let { ipcMain,BrowserWindow } = require('electron')
const path = require('path')

let win;

// 接收到广播
ipcMain.on('openwindow', (e, data)=> {
    // 调用window打开新窗口
    win = new BrowserWindow({
        width: 400,
        height: 300,
    });
    win.loadURL(path.join('file:',__dirname, '../news.html'));
    win.webContents.openDevTools()
    win.on('closed', () => {
        win = null;
      });
})
```


这套方案的适用范围其实很窄，你得清楚它的三个限制。它是同步阻塞的，写大对象会卡住渲染；它没有变更通知，窗口 B 只能在自己打开的那一刻读一次，A 之后再改 B 是不知道的（`storage` 事件在 Electron 多窗口下并不可靠）；它还只能存字符串，复杂数据得自己 `JSON.stringify` 来回转。

所以我一般只用它传「打开新窗口时的初始参数」这种一次性的、小的、只读的数据。要做真正的实时同步，往下看 6.2.2。

#### 6.2.2 BrowserWindow和webContents方式实现

> 通过 `BrowserWindow` 和 `webContents` 模块实现渲染进程和渲染进程的通信

> `webContents` 是一个事件发出者.它负责渲染并控制网页，也是 `BrowserWindow` 对象的属性

这条路是主进程中转，数据链路是「渲染进程 A → 主进程 → 渲染进程 B」，反过来再走一遍就是双向。它能传结构化数据，能实时推，是正经方案。

**需要了解的几个知识点**

1. 获取当前窗口的 `id`

```js
const winId = BrowserWindow.getFocusedWindow().id;
```

2. 监听当前窗口加载完成的事件

```js
win.webContents.on('did-finish-load',(event) => {
    
})
```

3. 同一窗口之间广播数据

```js
win.webContents.on('did-finish-load',(event) => {
    win.webContents.send('msg',winId,'我是 index.html 的数据');
})
```

4. 通过 `id` 查找窗口

```js
let win = BrowserWindow.fromId(winId);
```

这四个知识点串起来就是整套方案的骨架：拿到 A 的 id，把 id 一起发给 B，B 需要回话时用 `fromId` 反查出 A，再往 A 的 `webContents` 发消息。窗口 id 在这里扮演的角色，相当于「地址」。

第二点那个 `did-finish-load` 特别关键。新窗口的页面是异步加载的，你 `new BrowserWindow` 之后立刻 `send`，那边的 `ipcRenderer.on` 还没注册上，消息就丢了。这个坑我排查了挺久，现象是「第一次点没反应，第二次点就好了」，非常迷惑。等 `did-finish-load` 再发，就稳了。

> 下面是具体演示

**1. 引入openWindow**

```html
<!--src/index.html-->
 <button id="sendSync">渲染进程和主进程同步通信</button>
<script src="render/openWindow.js"></script>
```

**2. 引入ipcMain2**

```js
// 在主进程src/index.js中引入
const createWindow = () => {

  // 创建菜单  
  // 引入菜单模块
  require('./main/ipcMain2.js')
};
```

**3. 渲染进程通知主进程打开窗口**

```js
// src/render/openWindow.js

/* eslint-disable */
let openWindow = document.querySelector('#openWindow');

var { ipcRenderer } = require('electron');

// 渲染进程和渲染进程直接的通信========
openWindow.onclick = function () {
    // 通过广播的形式 通知主进程执行操作
    ipcRenderer.send('openwindow', {name:'poetries', age: 23})
}
```

**4. 主进程收到通知执行操作**

```js
// src/main/ipcMain2.js

let { ipcMain,BrowserWindow } = require('electron')
const path = require('path')

let win;

// 接收到广播
ipcMain.on('openwindow', (e, userInfo)=> {
    // 调用window打开新窗口
    win = new BrowserWindow({
        width: 400,
        height: 300,
    });
    win.loadURL(path.join('file:',__dirname, '../news.html'));

    // 新开窗口调试模式
    win.webContents.openDevTools()

    // 把渲染进程传递过来的数据再次传递给渲染进程news
    // 等待窗口加载完
    win.webContents.on('did-finish-load', () => {
        win.webContents.send('toNews', userInfo)
    })
    

    win.on('closed', () => {
        win = null;
      });
})
```

这段就是中转的核心，主进程把 A 发来的 `userInfo` 原封不动转发给 B。原文这里箭头函数的函数体误写成了方括号，虽然靠着「表达式会被求值」侥幸能跑，但语义上是返回一个数组，我改回花括号了，别照着方括号那版写。

**5. news接收主进程传递的数据**

> 数据经过渲染进程->主进程->`news`渲染进程

```html
<!--news页面-->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title></title>
  </head>
  <body>
    news page
  </body>
  <script src="render/news.js"></script>
</html>
```

```js
// src/render/news.js

var { ipcRenderer } = require('electron');

// let username = localStorage.getItem('username')
// console.log(username)

// 监听主进程传递过来的数据 
ipcRenderer.on('toNews',(e, userInfo)=>{
    console.log(userInfo)
})
```

跑起来的效果，第一张是发起方窗口，第二张是新开的 news 窗口在自己的 DevTools 里打出了收到的数据。

![发起方窗口点击按钮触发通信的界面截图](https://s.poetries.top/gitee/20191001/63.png)

![news 窗口的 DevTools 中打印出从主进程转发过来的 userInfo 数据](https://s.poetries.top/gitee/20191001/64.png)

> 那么，这里有一个问题，`news`进程接收到了广播后如何给出反馈呢？

数据现在是单向的，A 到 B 通了，B 想回话却不知道 A 在哪儿。因为主进程转发时并没有告诉 B「消息是谁发来的」。

![渲染进程之间双向通信的数据流向示意图](https://s.poetries.top/gitee/20191001/65.png)

解法就是把 A 的窗口 id 一起捎过去。下面三步改造分别对应链路上的三个节点。

**1. 在主进程中获取窗口ID传递**

```js
// src/main/ipcMain2.js


let { ipcMain,BrowserWindow } = require('electron')
const path = require('path')

let win;

// 接收到广播
ipcMain.on('openwindow', (e, userInfo)=> {
      // 获取当前窗口ID 放在第一行保险  因为后面也打开了新窗口使得获取的ID有问题
    let winId = BrowserWindow.getFocusedWindow().id

    // 调用window打开新窗口
    win = new BrowserWindow({
        width: 400,
        height: 300,
    });
    win.loadURL(path.join('file:',__dirname, '../news.html'));

    // 新开窗口调试模式
    win.webContents.openDevTools()

  

    // 把渲染进程传递过来的数据再次传递给渲染进程news
    // 等待窗口加载完
    win.webContents.on('did-finish-load', () => {
        win.webContents.send('toNews', userInfo, winId)
    })
    

    win.on('closed', () => {
        win = null;
      });
})
```

代码里那句注释「放在第一行保险」值得展开一下。`BrowserWindow.getFocusedWindow()` 拿的是当前获得焦点的窗口，一旦你 `new BrowserWindow` 开出新窗口，焦点就跑到新窗口上了，这时候再取 id 拿到的是新窗口自己的 id，不是发起方的。所以必须在创建新窗口之前就把 id 存下来。

更稳的写法其实是不用 `getFocusedWindow`，直接从 IPC 事件里取：`e.sender.id` 就是发消息那个 `webContents` 的 id，跟焦点在哪儿完全无关。用户在消息飞行途中点了别的窗口，用 `getFocusedWindow` 就会拿错。

**2. 在news进程中广播数据**

```js
// src/render/news.js

var { ipcRenderer } = require('electron');

// 注意这里 在渲染进程中需要从remote中获取BrowserWindow
const BrowerWindow = require('electron').remote.BrowserWindow;

// let username = localStorage.getItem('username')
// console.log(username)

// 监听主进程传递过来的数据 
ipcRenderer.on('toNews',(e, userInfo, winId)=>{
    // windID 第一个窗口ID
    // 获取对应ID的窗口
    let firstWin = BrowerWindow.fromId(winId)
    firstWin.webContents.send('toIndex', '来自news进程反馈的信息')
    console.log(userInfo)
})
```


**3. 在另一个渲染进程中处理广播**

```js
/* eslint-disable */
let openWindow = document.querySelector('#openWindow');

var { ipcRenderer } = require('electron');

// 渲染进程和渲染进程直接的通信========
openWindow.onclick = function () {
    // 传递消息给主进程
    ipcRenderer.send('openwindow', {name:'poetries', age: 23})

    // 传递给打开的窗口 渲染进程和渲染进程直接的通信
    localStorage.setItem('username', 'poetries')
    
}

// 接收news渲染进程传递回来的消息
ipcRenderer.on('toIndex', (e, data)=>{
    console.log('===', data)
})
```

至此整条链路闭合了：A 点击 → 主进程开窗口并带上 A 的 id → B 加载完收到数据和 id → B 用 `fromId(winId)` 找到 A → 直接往 A 发消息。

![两个渲染进程双向通信成功，两侧控制台分别打印出对方消息](https://s.poetries.top/gitee/20191001/66.png)

回过头看这四种通信方式，选型其实不难。窗口内要调系统能力，用 `invoke` / `handle`；主进程要主动推给页面，用 `webContents.send`；窗口之间要通信，统一走主进程中转，别指望它们直连；`localStorage` 只当作传初始参数的便车。

顺便说一句，如果你的应用窗口一多、消息一杂，建议在主进程里建一个消息路由层，所有 `ipcMain.on` 集中注册在一个文件，频道名用常量。散在各处的话，半年后你会不知道某个频道是谁在监听。Node 侧的模块组织思路可以参考我之前写的 [Node 基础回顾](https://feinterview.poetries.top/blog/node-base-review)。

## 七、Electron Shell 模块

前面讲的都是应用内部的事，`shell` 模块管的是应用和外部世界打交道：用默认浏览器打开一个网址、用系统默认程序打开一个文件、把文件扔进回收站、在文件管理器里定位到某个文件。

![Electron shell 模块功能概览](https://s.poetries.top/gitee/20191001/67.png)

### 7.1 Shell 模块使用

> 文档 https://electronjs.org/docs/api/shell

> `Electron Shell` 模块在用户默认浏览器 中打开 `URL` 以及 `Electron DOM webview` 标签。`Shell`既属于主进程模块又是渲染进程模块

> `shell` 模块提供了集成其他桌面客户端的关联功能


**1. 引入**

```html
<!--index.html-->
<button id="shellDom">通过shell打开外部链接</button>
<script src="render/shell.js"></script>
```

**2. shell.js**

```js
// src/render/shell.js

const { shell } = require('electron')
let shellDom = document.querySelector('#shellDom');

shellDom.onclick = function (e) {
   shell.openExternal('https://github.com/poetries')
}
```

`shell.openExternal` 是「关于我们」「帮助文档」「检查更新」这类菜单项的标准做法，它会调起用户的默认浏览器而不是在应用里开窗口。为什么不在应用里开？因为在自己的 `BrowserWindow` 里加载外部网站，等于把一个你控制不了的页面塞进了自己的应用上下文，风险和收益完全不成比例。

这里有个坑要注意：`openExternal` 接受的是一个字符串，如果这个字符串来自用户输入或者远程数据，一定要先校验协议是不是 `http` 或者 `https`。传入 `file://` 甚至系统自定义协议是可以触发本机程序执行的，这是一类真实存在的攻击手法。判断一行的事：

```js
const url = new URL(input);
if (url.protocol === 'http:' || url.protocol === 'https:') {
    shell.openExternal(input);
}
```

`shell` 里另外几个常用的还有 `shell.openPath` 用默认程序打开文件、`shell.showItemInFolder` 在访达或资源管理器里高亮某个文件、`shell.trashItem` 把文件移到回收站。做文件类应用的话，这几个能省掉大量原生代码。API 名字在早期版本里叫法不太一样，用之前对一下官方文档。

### 7.2 `Electron DOM` `<webview>` 标签

> `Webview` 与 `iframe` 有点相似，但是与 `iframe` 不同, `webview` 和你的应用运行的是不同的进程。它不拥有渲染进程的权限，并且应用和嵌入内容之间的交互全部都是异步的。因为这能 保证应用的安全性不受嵌入内容的影响。

```html
<!--src/index.html中引入-->
<webview id="webview" src="http://blog.poetries.top" style="position:fixed; width:100%; height:100%">
</webview>
```

一行标签就把整个网站嵌进来了，做「内置浏览器」类的功能非常方便。跟 `iframe` 最大的区别是它跑在独立进程里，嵌入的页面崩了不会拖垮你的应用。

不过 `webview` 在 Electron 里一直是个「能用但不被推荐」的标签，官方文档自己都标了它可能发生重大变化甚至被移除，同时它默认是关闭的，需要在 `webPreferences` 里显式打开 `webviewTag`。现在官方推荐的替代品是 `WebContentsView`（早期叫 `BrowserView`），由主进程创建并挂到窗口上，行为更可控。具体名称和用法各版本有差异，以官方文档为准。

这一节的代码你当作理解「隔离渲染外部内容」这个思路来看，真做新项目的话往那个方向走。

### 7.3 `shell`模块`<webview>`结合`Menu`模块使用案例

把前面三块拼起来就是一个小浏览器：菜单栏列一堆网址，点「在窗口外打开」走 `shell.openExternal` 调系统浏览器，点「加载网页」就通过 IPC 通知渲染进程改 `webview` 的 `src`。这个例子把主进程菜单、IPC、shell、webview 全串上了，很适合拿来检验前面几节有没有真看懂。


**1. 新建src/render/webview.js**

```js
/* eslint-disable */
var { ipcRenderer } = require('electron');
let myWebview = document.querySelector('#myWebview')

ipcRenderer.on('openwebview', (e, url)=>{
    myWebview.src = url
})
```

**2. 引入src/index.html**

```html
<webview id="myWebview" src="http://blog.poetries.top" style="position:fixed; width:100%; height:100%">
</webview>
    
<script src="render/webview.js"></script>
```

**3. 新建src/main/menu.js**

菜单定义在主进程，两个辅助函数分别对应两种打开方式。`openWebView` 走 IPC 通知当前窗口，`openWeb` 走 shell 调系统浏览器。注意 `type: 'separator'` 那几项，它们是菜单里的分隔线，加上之后视觉分组会清楚很多。

```js
/* eslint-disable */
const { shell, Menu, BrowserWindow } = require('electron');

// 当前窗口渲染网页
function openWebView(url) {
    // 获取当前窗口Id
    let win = BrowserWindow.getFocusedWindow()

    // 广播通知渲染进程打开webview
    win.webContents.send('openwebview', url)
}

// 在窗口外打开网页
function openWeb(url) {
    shell.openExternal(url)
}

let template = [
    {
        label: '帮助',
        submenu: [
            {
                label: '关于我们',
                click: function () {
                    openWeb('http://blog.poetries.top')
                }
            },
            {
                type: 'separator'
            },
            {
                label: '联系我们',
                click: function () {
                    openWeb('https://github.com/poetries')
                }
            }
        ]
    },
   {
        label: '加载网页',
        submenu: [
            {
                label: '博客',
                click: function () {
                    openWebView('http://blog.poetries.top')
                }
            },
            {
                type: 'separator' // 分隔符
            },
            {
                label: 'GitHub',
                click: function () {
                    openWebView('https://github.com/poetries')
                }
            },
            {
                type: 'separator' // 分隔符
            },
            {
                label: '简书',
                click: function () {
                    openWebView('https://www.jianshu.com/users/94077fcddfc0/timeline')
                }
            }
        ]
   },
   {
    label: '视频网站',
    submenu: [
        {
            label: '优酷',
            click: function () {
                openWebView('https://www.youku.com')
            }
        },
        {
            type: 'separator' // 分隔符
        },
        {
            label: '爱奇艺',
            click: function () {
                openWebView('https://www.iqiyi.com/')
            }
        },
        {
            type: 'separator' // 分隔符
        },
        {
            label: '腾讯视频',
            click: function () {
                openWebView('https://v.qq.com/')
            }
        }
    ]
    }
]

let m = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(m)
```

**4. 引入menu**

```js
// 在主进程src/index.js中引入
const createWindow = () => {

  // 创建菜单  
  // 引入菜单模块
  require('./main/menu.js')
};
```

![菜单点击后 webview 在当前窗口加载对应网页的效果](https://s.poetries.top/gitee/20191001/68.png)

这个小案例跑通之后，你基本就掌握了 Electron 应用的主干：主进程管菜单和系统能力，渲染进程管界面，中间用 IPC 串起来。剩下的模块都是在这个框架上加功能。

## 八、Electron dialog 弹出框

原生对话框是「桌面应用感」的另一半。网页里的 `alert` 和 `confirm` 长得就一副网页样，而 `dialog` 弹出来的是货真价实的系统对话框，用户一眼分辨不出你这是不是原生应用。

![Electron dialog 模块四种对话框类型概览](https://s.poetries.top/gitee/20191001/69.png)

更重要的是选择文件这件事。浏览器里的 `<input type="file">` 只能拿到一个受限的 File 对象，你不知道它在磁盘上的真实路径。`showOpenDialog` 直接给你绝对路径，配合 `fs` 就能做任何事，这是桌面应用相比 Web 最实在的能力差距之一。

> 文档 https://electronjs.org/docs/api/dialog

> `dialog`属于主进程中的模块

> `dialog` 模块提供了 `api` 来展示原生的系统对话框，例如打开文件框，`alert` 框， 所以 `web` 应用可以给用户带来跟系统应用相同的体验


**1. 在src/index.html中引入**

```html
<button id="showError">showError</button><br />
<button id="showMsg">showMsg</button><br />
<button id="showOpenDialog">showOpenDialog</button><br />
<button id="saveDialog">saveDialog</button><br />

<script src="render/dialog.js"></script>
```

**2. 新建render/dialog.js**

四个按钮对应四种对话框，先看完整代码，后面挨个拆开讲。

```js
// render/dialog.js

let showError = document.querySelector('#showError');
let showMsg = document.querySelector('#showMsg');
let showOpenDialog = document.querySelector('#showOpenDialog');
let saveDialog = document.querySelector('#saveDialog');

var {remote} = require('electron')

showError.onclick = function () {
    remote.dialog.showErrorBox('警告', '操作有误')
}
showMsg.onclick = function () {
    remote.dialog.showMessageBox({
        type: 'info',
        title: '提示信息',
        message: '内容',
        buttons: ['确定', '取消']
    },function(index){
        console.log(index)
    })
}
showOpenDialog.onclick = function () {
    remote.dialog.showOpenDialog({
        // 打开文件夹
        properties: ['openDirectory', 'openFile']

        // 打开文件
        // properties: ['openFile']
    }, function (data) {
        console.log(data)
    })
}
saveDialog.onclick = function () {
    remote.dialog.showSaveDialog({
        title: 'Save File',
        defaultPath: '/Users/poetry/Downloads/',
        // filters 指定一个文件类型数组，用于规定用户可见或可选的特定类型范围
        filters: [
            { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
            { name: 'Movies', extensions: ['mkv', 'avi', 'mp4'] },
            { name: 'Custom File Type', extensions: ['as'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    }, function (path) {
        // 不是真的保存 ，具体还需nodejs处理
        console.log(path)
    })
}
```

**showError**

最简单的一个，两个参数分别是标题和内容，弹一个纯报错框。它甚至可以在 `app.on('ready')` 之前调用，这一点在处理启动阶段的致命错误时很有用。

```js
remote.dialog.showErrorBox('警告', '操作有误')
```

![Electron showErrorBox 弹出的系统原生错误提示框](https://s.poetries.top/gitee/20191001/70.png)

**showMessageBox**

```js
remote.dialog.showMessageBox({
    type: 'info',
    title: '提示信息',
    message: '内容',
    buttons: ['确定', '取消']
},function(index){
    console.log(index)
})
```

`buttons` 数组决定按钮，回调里的 `index` 是用户点了第几个，从 0 开始。`type` 可选 `info`、`error`、`question`、`warning`，影响图标。做「确定要退出吗」这类拦截时，判断一下 `index === 0` 就行。

![Electron showMessageBox 弹出的带确定取消按钮的信息框](https://s.poetries.top/gitee/20191001/71.png)

这里要提一个重要变化：原文这套「回调函数」写法是老 API。后来这几个 dialog 方法都改成返回 Promise 了，`showMessageBox` 返回的是 `{ response, checkboxChecked }`，`showOpenDialog` 返回的是 `{ canceled, filePaths }`。如果你照抄回调写法发现回调根本不执行，八成就是版本对不上。新版写法长这样：

```js
const { response } = await dialog.showMessageBox({
    type: 'info',
    title: '提示信息',
    message: '内容',
    buttons: ['确定', '取消']
});
if (response === 0) {
    // 用户点了确定
}
```

**showOpenDialog**

```js
remote.dialog.showOpenDialog({
    // 打开文件夹
    properties: ['openDirectory', 'openFile']

    // 打开文件
    // properties: ['openFile']
}, function (data) {
    console.log(data)
})
```

`properties` 是个能力开关数组，`openFile` 允许选文件，`openDirectory` 允许选文件夹，加上 `multiSelections` 就能多选，`createDirectory` 让 mac 用户能在选择器里新建文件夹。两个都写就是文件和文件夹都能选。

![Electron showOpenDialog 弹出的系统文件选择器](https://s.poetries.top/gitee/20191001/72.png)

**showSaveDialog**

```js
remote.dialog.showSaveDialog({
    title: 'Save File',
    defaultPath: '/Users/poetry/Downloads/',
    // filters 指定一个文件类型数组，用于规定用户可见或可选的特定类型范围
    filters: [
        { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
        { name: 'Movies', extensions: ['mkv', 'avi', 'mp4'] },
        { name: 'Custom File Type', extensions: ['as'] },
        { name: 'All Files', extensions: ['*'] }
    ]
}, function (path) {
    // 不是真的保存 ，具体还需nodejs处理
    console.log(path)
})
```

代码里那句注释很关键，我把它再强调一遍：**`showSaveDialog` 只负责让用户选一个路径，它不写文件**。真正落盘还得你自己调 `fs.writeFile`。第一次用的时候我以为选完就存好了，结果目录里空空如也，愣了一会儿才反应过来。

`filters` 那个数组决定文件类型下拉框里有哪几项，`extensions: ['*']` 表示所有文件。做导出功能时把常用格式排在第一位，因为它是默认选中项。

![Electron showSaveDialog 弹出的系统保存文件对话框](https://s.poetries.top/gitee/20191001/73.png)

还有一点：`dialog` 是主进程模块，原文这里用 `remote` 从渲染进程调。按 4.2 说的迁移思路，现在应该在主进程 `ipcMain.handle('dialog:open', ...)` 里调 `dialog.showOpenDialog`，把结果 return 出去，渲染进程 `await` 拿路径。顺便还有个好处，主进程可以在这一层做路径白名单校验，不至于让页面拿到任意磁盘位置的读写能力。

## 九、实现一个类似EditPlus的简易记事本代码编辑器

前面八节的东西凑齐了，其实就能拼出一个可用的代码编辑器：`dialog` 负责打开和保存文件，`fs` 负责读写，`Menu` 负责快捷键和菜单项，`BrowserWindow` 负责多标签或多窗口。这个 demo 我放在 GitHub 上了，代码不长，建议对着前面几节看一遍，比单看 API 文档有感觉得多。

> 代码 https://github.com/poetries/electron-demo/tree/master/notepad

要做得更完整的话，编辑区可以换成 CodeMirror 或者 Monaco Editor（VS Code 用的就是 Monaco），语法高亮、行号、代码折叠这些直接白拿。剩下的工作量主要在文件状态管理上：当前文件路径、有没有未保存的修改、关窗口前要不要拦一下提示保存。这三件事看着简单，真做起来的边界情况比编辑器本身还多。

## 十、系统托盘、托盘右键菜单、托盘图标闪烁 

托盘是那种「不做没人夸，不做用户就觉得你不专业」的功能。IM、下载工具、杀毒软件全都有，用户关掉窗口时预期是最小化到托盘而不是退出。

![Electron 系统托盘图标与托盘右键菜单效果](https://s.poetries.top/gitee/20191001/74.png)

> 文档 https://electronjs.org/docs/api/tray

> 系统托盘，托盘右键菜单、托盘图标闪烁 点击右上角关闭按钮隐藏到托盘(仿杀毒软件)

**1. 引入文件**

```js
// src/index.js
const createWindow = () => {
    require('./main/tray.js')
};
```

**2. Electron 创建任务栏图标以及任务栏图标右键菜单**

```js
// src/main/tray.js
var {
    Menu, Tray, app, BrowserWindow
} = require('electron');

const path = require('path');

var appIcon = new Tray(path.join(__dirname, '../static/lover.png'));

const menu = Menu.buildFromTemplate([
    {
        label: '设置',
        click: function() {} //打开相应页面 
    },
    {
        label: '帮助',
        click: function() {}
    },
    {
        label: '关于',
        click: function() {}
    },
    {
        label: '退出',
        click: function() { 
            // BrowserWindow.getFocusedWindow().webContents().send('close-main-window');
            app.quit();
    }
}])
// 鼠标放上去提示信息
appIcon.setToolTip('hello poetries');
appIcon.setContextMenu(menu);
```

`new Tray(图片路径)` 这一行就创建了托盘图标，`setToolTip` 是鼠标悬停时的提示文字，`setContextMenu` 挂右键菜单。

托盘图标最容易翻车的地方是图片。几点经验：路径必须用 `path.join(__dirname, ...)` 拼绝对路径，相对路径打包后一定找不到；mac 上建议用 16x16 或 32x32 的模板图（文件名以 `Template` 结尾的黑白 png），这样在深色菜单栏下会自动反色，否则你的图标在深色模式下就是一坨黑；windows 上用 `.ico` 兼容性最好。这三条踩过一次就不会忘。

还有一个隐蔽的坑：`Tray` 实例也必须用变量拴住，跟 `BrowserWindow` 一个道理。写成 `new Tray(...)` 不赋值给任何变量，图标会在下一次垃圾回收时凭空消失，现象是「一开始有，过一会儿没了」。

![Electron 创建的系统托盘图标及其右键菜单](https://s.poetries.top/gitee/20191001/75.png)

**3. 监听任务栏图标的单击、双击事件**

这就是「关掉窗口不退出，双击托盘再打开」的完整实现，逻辑只有两句：拦截 `close` 事件不让它真关，改成 `hide`；托盘双击时 `show` 回来。

```js
// 实现点击关闭按钮，让应用保存在托盘里面，双击托盘打开
let win = BrowserWindow.getFocusedWindow()

win.on('close', (e)=>{
    e.preventDefault()
    win.hide()
})

appIcon.on('double-click', (e)=>{
    win.show()
})
```

原文这里托盘变量写成了 `iconTray`，但上面创建时叫 `appIcon`，两个名字对不上会直接报未定义，我统一成 `appIcon` 了。

`e.preventDefault()` 是核心。默认情况下最后一个窗口关闭会触发 `window-all-closed` 进而退出应用，拦下来才有「后台运行」这回事。但这样一来用户就没法退出程序了，所以托盘菜单里的「退出」那一项必须给一个真退出的通道，通常的做法是设一个标志位：

```js
let isQuitting = false;
app.on('before-quit', () => { isQuitting = true; });
win.on('close', (e) => {
    if (!isQuitting) {
        e.preventDefault();
        win.hide();
    }
});
```

没有这个标志位，你在托盘菜单里点「退出」也会被 `preventDefault` 挡住，应用变成关不掉的流氓软件。这个我踩过，当时还纳闷为什么 `app.quit()` 调了没反应。

**4. Electron 点击右上角关闭按钮隐藏任务栏图标**

下面是另一种写法，多加了一个 `isFocused` 的判断。

```js
let win = BrowserWindow.getFocusedWindow();

win.on('close', (e) =>{

    console.log(win.isFocused());
    
    if (!win.isFocused()) {
        win = null;
    } else {
        e.preventDefault();/*阻止应用退出*/
        win.hide();/*隐藏当前窗口*/
    }
})
```

原文这段把 `win` 声明成了 `const` 却又在分支里赋值 `win = null`，严格模式下会直接抛 TypeError，我改成 `let` 了。

另外还得说一句，托盘的 `click` 和 `double-click` 事件在 windows 上才完整生效，mac 的菜单栏图标交互逻辑不一样，单击默认就弹菜单。原文在 13.4.2 里也提到了这一点。做跨平台就得接受这类差异，别指望一份代码两边表现完全一致。

**5. Electron 实现任务栏闪烁图标**

图标闪烁其实没有什么「闪烁 API」，就是拿定时器在两张图之间来回切，一张是正常图标，一张是空白图。新消息提醒那种一闪一闪的效果就是这么做的。

```js
var appIcon = new Tray(path.join(__dirname, '../static/lover.png'));

timer = setInterval(function() {
    count++;
    if (count % 2 == 0) {
        appIcon.setImage(path.join(__dirname, '../static/empty.ico'))
    } else {
        appIcon.setImage(path.join(__dirname, '../static/lover.png'))
    }
},
500);
```

500 毫秒这个间隔是试出来的，再快会让人烦躁，再慢又不够醒目。记得在用户点开消息后 `clearInterval(timer)` 并把图标 `setImage` 回正常那张，不然它会一直闪到天荒地老。

## 十一、消息通知、监听网络变 化、网络变化弹出通知框

### 11.1 消息通知

**1. Electron 实现消息通知**

> `Electron` 里面的消息通知是基于 `h5` 的通知 `api` 实现的

> 文档 https://developer.mozilla.org/zh-CN/docs/Web/API/notification

这个设计我觉得挺聪明的。Electron 没有另造一套通知 API，直接复用了 H5 的 `Notification`，你写的还是网页代码，弹出来的却是 mac 的通知中心或者 windows 的操作中心。而且因为是在桌面环境里，浏览器里那个烦人的权限弹窗也不用处理了。

**1. 新建notification.js**

```js
// h5api实现通知
const path = require('path')

let options = {
    title: 'electron 通知API',
    body: 'hello poetries',
    icon: path.join('../static/img/favicon2.ico') // 通知图标
}


document.querySelector('#showNotification').onclick = function () {
    let myNotification  = new window.Notification(options.title, options)
    
    // 消息可点击
    myNotification.onclick = function () {
        console.log('click notification')
    }
}
```


**2. 引入**

```html
<!--src/index.html-->

<button id="showNotification">弹出消息通知</button>
<script src="render/notification.js"></script>
```

`mac`上的消息通知

![mac 系统通知中心弹出的 Electron 应用消息通知](https://s.poetries.top/gitee/20191001/76.png)

`myNotification.onclick` 里可以做很多事，比如把主窗口 `show()` 出来并跳转到对应的会话，IM 类应用都是这么干的。要在渲染进程里操作窗口，还是那句话，发 IPC 给主进程去做。

补充一点：主进程侧也有一个 `Notification` 类，`new Notification({ title, body }).show()`，适合在没有窗口打开时（比如应用最小化到托盘）发通知。两套 API 各有各的位置，别混着用。

### 11.2 监听网络变化

断网提醒是桌面应用的基本礼貌。Electron 里不需要什么特殊 API，浏览器的 `online` / `offline` 事件直接就能用。

**1. 基本使用**

```js
 // 监听网络变化
// 端开网络 再次连接测试
 window.addEventListener('online', function(){
    console.log('online')
 }); 
 
 window.addEventListener('offline', function(){
    console.log('offline')
 });
 ```

这两个事件有个众所周知的局限：它反映的是「网卡有没有连上网络」，不是「能不能访问到你的服务器」。连着一个没有外网的 WiFi，`navigator.onLine` 照样是 `true`。所以严肃一点的做法是 `offline` 事件加上一个轻量的心跳请求双保险，事件负责快速响应，心跳负责兜底。

 **2. 监听网络变化实现消息通知**

把上面两块拼起来，断网时弹一个系统通知，就是 QQ 邮箱那种提示。
 
 ```js
// 端开网络 再次连接测试
// 监听网络变化实现消息通知
 window.addEventListener('online', function(){
    console.log('online')
 }); 
 window.addEventListener('offline', function(){
    // 断开网络触发事件
    var options = {
        title: 'QQ邮箱',
        body: '网络异常，请检查你的网络',
        icon: path.join('../static/img/favicon2.ico') // 通知图标
    }
    var myNotification  = new window.Notification(options.title, options)
    myNotification.onclick = function () {
        console.log('click notification')
    }
 });
 ```
 
 ![断开网络后应用弹出的网络异常系统通知](https://s.poetries.top/gitee/20191001/77.png)
 
测试方法很简单，把 WiFi 关掉再打开就能看到效果。注意别在 `offline` 回调里做重试请求，网都断了，重试只会堆一堆失败的 Promise。正确姿势是标记状态、暂停轮询，等 `online` 事件回来再恢复。
 
## 十二、注册全局快捷键/剪切板事件/nativeImage 模块
 
> `Electron` 注册全局快捷键 (`globalShortcut`) 以及 `clipboard` 剪 切板事件以及 `nativeImage` 模块(实现类似播放器点击机器码自动复制功 能)
 

### 12.1 注册全局快捷键

全局快捷键和 5.1 里菜单上的 `accelerator` 不是一回事。菜单快捷键只在你的应用处于前台时生效，全局快捷键是注册到操作系统层面的，你的应用在后台甚至最小化了，用户按下组合键照样触发。截图工具、录屏工具、剪贴板管理器都靠它。

![Electron globalShortcut 全局快捷键功能示意](https://s.poetries.top/gitee/20191001/78.png)

- [keyboard-shortcuts文档]( https://electronjs.org/docs/tutorial/keyboard-shortcuts)
- [app模块参考文档](https://electronjs.org/docs/api/app)


**1. 新建src/main/shortCut.js**

```js
const {globalShortcut, app} = require('electron')

app.on('ready', ()=>{
    // 注册全局快捷键
    globalShortcut.register('command+e', ()=>{
        console.log(1)
    })

    // 检测快捷键是否注册成功 true是注册成功
    let isRegister = globalShortcut.isRegistered('command+e')
    console.log(isRegister)
})

// 退出的时候取消全局快捷键
app.on('will-quit', ()=>{
    globalShortcut.unregister('command+e')
})
```

这段有三个必须注意的点。

注册必须在 `app.on('ready')` 之后，早了会失败。`isRegistered` 那行不是摆设，全局快捷键是先到先得的系统资源，别人已经占了你就抢不到，而 `register` 失败时不一定会抛错，你得主动查一下再给用户提示「快捷键已被占用」。`will-quit` 里的 `unregister` 也不能省，Electron 文档明确说了应用退出时要注销，否则可能把这个组合键一直占着。

还有跨平台的老问题，`command+e` 只在 mac 上有意义，windows 用户按不出 Command 键。这里同样应该用 `CmdOrCtrl+E`。原文写死了 `command+e`，照抄到 windows 上会直接失效。

**2. 引入src/index.js**

```js
// 注意在外部引入即可 不用放到app中
require('./main/shortCut.js')
```

这行注释解释一下：因为 `shortCut.js` 内部自己监听了 `app.on('ready')`，所以在模块顶层 `require` 就够了，不用塞进 `createWindow` 里。塞进去反而可能因为 `createWindow` 本身就在 ready 之后调用，导致 `ready` 事件已经过去了、回调再也不触发。

### 12.2  剪切板clipboard、nativeImage 模块

剪贴板是 Electron 里少数几个「两边都能用」的模块之一。做序列号复制、图片粘贴、把内容一键拷到别的软件，都靠它。

![Electron clipboard 与 nativeImage 模块功能示意](https://s.poetries.top/gitee/20191001/79.png)


- [剪切板clipboard文档](https://electronjs.org/docs/api/clipboard)
- [nativeImage模块](https://electronjs.org/docs/api/native-image)


**1. html**

```html
<!--src/index.html-->
<div>
  <h2>双击下面信息复制</h2>
  <p id='msg'>123456789</p>
  <button id="plat">粘贴</button><br />
  <input id="text" type="text"/>
</div>
<div>
  <h2>复制图片到界面</h2>
  <button id="copyImg">复制图片</button><br />
</div>
<script src="render/clipboard.js"></script>
```

**2. 新建src/render/clipboard.js**

下面这段实现了两件事：双击一段文本自动复制（就是播放器里点一下机器码就复制的那个交互），以及把一张本地图片读成图像对象放进剪贴板再读出来显示。

```js
// clipboard可以在主进程或渲染进程使用
const { clipboard, nativeImage }  = require('electron')

//复制
// 运行ctrl+v可看到复制的内容
// clipboard.writeText('poetries')

// clipboard.readText() //获取复制的内容 粘贴

// 双击复制消息
let msg = document.querySelector('#msg')
let plat = document.querySelector('#plat')
let text = document.querySelector('#text')

msg.ondblclick  = function () {
    clipboard.writeText(msg.innerHTML)
    alert(msg.innerHTML)
}
plat.onclick = function () {
    text.value = clipboard.readText()
}

// 复制图片显示到界面
let copyImg = document.querySelector('#copyImg')
copyImg.onclick = function () {
    // 结合nativeImage模块
    let image = nativeImage.createFromPath('../static/img/lover.png') 

    // 复制图片
    clipboard.writeImage(image)

    // 粘贴图片
    let imgSrc = clipboard.readImage().toDataURL() // base64图片

    // 显示到页面上
    let imgDom = new Image()
    imgDom.src = imgSrc 
    document.body.appendChild(imgDom)
}
```

`clipboard` 的方法是成对的，`writeText` / `readText` 管纯文本，`writeHTML` / `readHTML` 管富文本，`writeImage` / `readImage` 管图片。这里图片这条链路值得单独看一眼：`nativeImage.createFromPath` 把磁盘上的图读成 Electron 的图像对象，`clipboard.writeImage` 放进系统剪贴板，`clipboard.readImage().toDataURL()` 又把它读回来转成 base64 直接塞给 `<img>` 的 `src`。

`nativeImage` 除了 `createFromPath` 还有 `createFromDataURL` 和 `createFromBuffer`，托盘图标、窗口图标、通知图标接受的都是它。做截图工具的话，`nativeImage` 加 `desktopCapturer` 就是核心组合。

这里有个坑要注意：代码里的 `'../static/img/lover.png'` 是相对路径，在开发时可能碰巧能跑，打包后一定找不到。凡是涉及资源路径的地方都用 `path.join(__dirname, ...)`，或者 electron-vue 里的 `__static`，13.4.4.3 会再提一次这件事。

## 十三、结合electron-vue

前面十二节都是原生 Electron，一个页面一个 `<script>` 标签那种写法。真做项目肯定不行，你需要组件化、路由、状态管理、构建工具。这一节就是把 Vue 那一整套接进来。

### 13.1 electron-vue 的使用

**1. electron-vue 的一些资源**

> https://github.com/SimulatedGREG/electron-vue


`Electron-vue` 文档 https://simulatedgreg.gitbooks.io/electron-vue/content/cn

先说一句放在前面的话：`electron-vue` 这个脚手架现在已经不维护了，它基于的是 `vue-cli 2` 和 Vue 2，Electron 版本也停在很早的阶段。2019 年它是最省事的选择，现在如果你开新项目，更合适的方案是 `electron-vite`，或者用 Vite 自己搭渲染进程再配 `electron-builder` 打包。

那这一节还有没有价值？我觉得有。因为「主进程配置 + 渲染进程配置 + 多平台打包」这个三段式结构，换成任何脚手架都是一样的，具体命令会变，思路不变。下面的内容你当成一个完整项目的组织范例来看。Vue 项目本身的工程化配置可以参考我写过的 [vue-cli3 配置](https://feinterview.poetries.top/blog/vue-cli3)。

**2. electron-vue 环境搭建、创建项目**

```bash
npm install -g vue-cli

vue init simulatedgreg/electron-vue my-project

cd my-project

yarn # or npm install

yarn run dev # or npm run dev
```

**3. electron-vue 目录结构分析**

![electron-vue 项目目录结构，src 下分 main 主进程和 renderer 渲染进程](https://s.poetries.top/gitee/20191001/80.png)

这张图里最需要记住的是 `src/main` 和 `src/renderer` 这个划分，它把前面反复讲的进程边界固化成了目录结构。主进程的代码不会被打进渲染进程的 bundle，反过来也一样，两边各有一份 webpack 配置。你写代码时只要问自己「这段逻辑该放哪个目录」，进程边界就不容易搞混。

`static` 目录也值得留意，里面的文件不会被 webpack 处理，原样拷贝到打包产物里。托盘图标、应用图标这类需要用真实路径访问的资源都放这儿。

### 13.2 electron-vue 中使用 sass/ElementUi

**1. electron-vue UI 框架 ElementUi 的使用**

> http://element-cn.eleme.io/#/zh-CN

桌面端管理系统用 Element UI 是很自然的选择，它本来就是给 PC 端设计的，表格、表单、弹窗这些组件密度也合适。移动端组件库放桌面上会显得特别空。

**2. electron-vue 中使用 sass**

- [electron-vue 中使用 sass](https://simulatedgreg.gitbooks.io/electron-vue/content/cn/using_pre-processors.html)


```bash
# 安装 sass-loader:

npm install --save-dev sass-loader node-sass
```

```html
<!--vue 文件中修改 style 为如下代码:-->

<style lang="scss"> 
    body {
        /* SCSS */ 
    }
</style>
```

`node-sass` 现在已经废弃了，它依赖原生编译，换 Node 版本就要重新 `rebuild`，Electron 环境下还得跟 Electron 的 Node ABI 对齐，装不上是家常便饭。现在统一用 `sass` 这个包（Dart Sass 的纯 JS 实现），`npm i -D sass sass-loader` 就完事，没有原生编译这一层，省心太多。这算是这些年前端工具链里少数几个「换了明显更好」的变化。

### 13.3 electron-vue 中隐藏顶部菜单隐藏

> electron-vue 中隐藏顶部菜单隐藏顶部最大化、最小化、关闭按钮 自定最大化、最小化 、关闭按钮

自绘标题栏几乎是所有 IM 和工具类客户端的标配，因为系统默认那条标题栏很难融进产品的视觉风格。代价是最大化最小化关闭这三个按钮都得你自己做，而且还得处理窗口拖拽。

**1. electron-vue 中隐藏顶部菜单**

```js
// src/main/index.js
mainWindow.setMenu(null)
```

**2. electron-vue 中隐藏关闭 最大化 最小化按钮**

```js
// src/main/index.js
mainWindow = new BrowserWindow({
    height: 620,
    useContentSize: true,
    width: 1280,
    frame: false /*去掉顶部导航 去掉关闭按钮 最大化最小化按钮*/
})
```

`setMenu(null)` 去掉的是菜单栏，`frame: false` 去掉的是整条标题栏，两者是两回事，看你要哪种效果。mac 上还有个折中方案叫 `titleBarStyle: 'hidden'`，标题栏隐藏但保留左上角红黄绿三个交通灯按钮，用户操作习惯不被破坏，视觉上又足够干净。做 mac 优先的产品我一般选这个。

**3 .electron-vue 自定义关闭/最大化最小化按钮**

按钮做好后，点击事件要通过 IPC 通知主进程去操作窗口，因为 `minimize` / `maximize` / `close` 都是 `BrowserWindow` 上的方法，只在主进程能调。

```js
// 注意在mac下不需要监听窗口最大最小化、以为系统默认支持，这个只是针对windows平台

ipc.on('window-min',function() {
    mainWindow.minimize();
})

//登录窗口最大化 
ipc.on('window-max',function(){
    if (mainWindow.isMaximized()) {
        mainWindow.restore();
    } else {
        mainWindow.maximize();
    }
}) 

ipc.on('window-close',function() {
    mainWindow.close();
})
```

这段代码里的 `ipc` 就是主进程的 `ipcMain`，三个频道对应三个按钮。`window-max` 那个分支要判断当前是不是已经最大化，是的话就 `restore` 还原，这样一个按钮能来回切换，跟系统按钮的行为一致。

**4. electron-vue 自定义导航可拖拽**

- 可拖拽的 `css`: `-webkit-app-region: drag; `
- 不可拖拽的 `css`:  `-webkit-app-region: no-drag;`

这两行 CSS 是自绘标题栏的最后一块拼图。去掉系统标题栏之后窗口就拖不动了，得手动指定哪块区域可以拖。给你的自定义标题栏容器加 `drag`，再给里面的按钮加 `no-drag`，不然按钮会被当成拖拽区域，点了没反应只会拖动窗口。

这个设计是真的舒服，一行 CSS 解决原生开发里要写一堆消息处理的事。不过有两个已知的怪脾气：`drag` 区域内的元素默认收不到鼠标事件，所以按钮必须显式声明 `no-drag`；另外 `drag` 区域里的文字是选不中的，如果你的标题栏里有需要复制的内容，也得给它加 `no-drag`。

### 13.4 使用electron-vue开发舆情监控系统

下面是一个真实项目的完整配置，把前面所有零散的知识点串成一个能跑的应用。这个舆情监控系统的功能是从服务端接收实时数据，做图表展示和关键词预警，源码在文末的 GitHub 链接里。

#### 13.4.1 配置开发环境

**1. 项目搭建**

```bash
npm install -g vue-cli

vue init simulatedgreg/electron-vue my-project

cd my-project

yarn # or npm install

yarn run dev # or npm run dev
```

**2. 安装一些依赖**

```bash
# 安装 sass-loader:
npm install --save-dev sass-loader node-sass

# 安装elementUI、js-md5
npm i element-ui  js-md5 -S
```

`js-md5` 是给接口签名用的，`element-ui` 是组件库。在 `.electron-vue/webpack.renderer.config.js` 里配置 `sass-loader` 就可以写 sass 了。注意配置文件在 `.electron-vue` 目录下，不是根目录的 webpack 配置，这个脚手架把主进程和渲染进程的构建配置分开放了。

- 在`.electron-vue/webpack.renderer.config.js`中配置`sass-loader`就可以编写 `sass` 了

```html
<!--vue 文件中修改 style 为如下代码:-->

<style lang="scss"> 
    body {
        /* SCSS */ 
    }
</style>
```

#### 13.4.2 主进程配置

主进程这边把菜单、托盘、快捷键三块拆成独立文件，在 `createWindow` 里按需引入。这种拆法比全堆在 `index.js` 里清爽得多，也方便按平台条件加载。

**1. `src/main/index.js`**

```js
function createWindow () {
  // 去掉顶部菜单
  mainWindow.setMenu(null)
  
  // 菜单项
  require('./model/menu.js');
  
  // 系统托盘相关
  require('./model/tray.js');
}
```

原文这段少了个收尾的花括号，我补上了。另外注意引入路径是 `./model/`，跟下面几个小标题写的 `src/main/xxx.js` 对不上，这是原文档的笔误，以你自己项目里的实际目录为准。

**2. `src/main/menu.js`菜单配置**

```js
const { Menu,ipcMain,BrowserWindow} = require('electron');


//右键菜单
const contextMenuTemplate=[
    {
        label: '复制', role: 'copy' },
    {
        label: '黏贴', role: 'paste' },        
    { type: 'separator' }, //分隔线
    {
        label: '其他功能',     
        click: () => {
        console.log('click')
         }
    }
];

const contextMenu=Menu.buildFromTemplate(contextMenuTemplate);


ipcMain.on('contextmenu',function(){

    contextMenu.popup(BrowserWindow.getFocusedWindow());

})
```

这就是 5.3 那个右键菜单的「正确版本」：菜单模板定义在主进程，渲染进程只负责在 `contextmenu` 事件里发一条 IPC 消息过来，主进程收到后 `popup`。渲染进程完全不碰 `Menu` 模块，也就不需要 `remote`。

`popup` 的参数写法在不同版本里有过变化，早期直接传窗口对象，后来改成传一个 `{ window }` 配置对象。两种写法你都可能在网上的教程里见到，以你手上那个版本的官方文档为准。

**3. `src/main/tray.js`系统托盘配置**

> 托盘点击监听事件只有在`windows`下才生效，`mac`系统默认支持

```js
(function () {
    const path=require('path');
    const {app,Menu,BrowserWindow,Tray, shell} = require('electron');

    //创建系统托盘
    const tray = new Tray(path.resolve(__static, 'favicon.png'))

    //给托盘增加右键菜单
    const template= [
        {
            label: '设置',
            click: function () {
                shell.openExternal('http://blog.poetries.top')
            }
        },
        {
            label: '帮助',
            click: function () {
                shell.openExternal('http://blog.poetries.top/2019/01/06/electron-summary')
            }
        },
        {
            label: '关于',
            click: function () {
                shell.openExternal('https://github.com/poetries/yuqing-monitor-electron')
            }
        },
        {
            label: '退出',
            click: function () {
                // BrowserWindow.getFocusedWindow().webContents().send('close-main-window');
                app.quit();
            
            }
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    tray.setContextMenu(menu);


    tray.setToolTip('舆情监控系统');


    //监听关闭事件隐藏到系统托盘
    // 这里需要注意：在window中才生效，mac下系统默认支持
    // var win = BrowserWindow.getFocusedWindow();
    // win.on('close',(e)=>{
    //         if(!win.isFocused()){
    //             win=null;
    //         }else{
    //             e.preventDefault();  /*阻止应用退出*/

    //             win.hide(); /*隐藏当前窗口*/

    //         }       
    // })

    // //监听托盘的双击事件
    // tray.on('double-click',()=>{               
    //     win.show();
    // })
})()
```

这里的 `__static` 是 electron-vue 注入的全局变量，指向那个不被 webpack 处理的 `static` 目录。开发和打包后它都能拿到正确路径，这就是我在 12.2 说的「别写相对路径」的具体解法。

托盘菜单几项都用 `shell.openExternal` 打开外部网页，跟 7.1 讲的是同一个用法。最后那一大段被注释掉的代码就是「关闭隐藏到托盘」，作者留着但没启用，原因写在上面那句提示里：mac 下行为不一样，硬开会有副作用。这种「留代码加注释说明为什么不开」的做法我挺喜欢，比直接删掉有价值。

整个文件用 IIFE 包起来，是为了不污染全局作用域，同时保证 `require` 进来就自动执行一次。

**4. `src/main/shortCut.js`快捷键配置**

在`src/main/index.js`中引入（`require('src/main/shortCut.js')`）即可，不需要放到`app`监控中

```js
var {globalShortcut, app} = require('electron')

app.on('ready', ()=>{
    // 注册全局快捷键
    globalShortcut.register('command+e', ()=>{
        console.log(1)
    })

    // 检测快捷键是否注册成功 true是注册成功
    let isRegister = globalShortcut.isRegistered('command+e')
    console.log(isRegister)
})

// 退出的时候取消全局快捷键
app.on('will-quit', ()=>{
    globalShortcut.unregister('command+e')
})
```

#### 13.4.3 渲染进程配置

渲染进程这边就是标准的 Vue 项目了，路由、状态管理、组件库、HTTP 客户端，跟你写 Web 应用没什么区别。唯一多出来的是 `vue-electron` 这个插件。

**1. src/render/main.js配置**

```js
import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'

import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import VueHighcharts from 'vue-highcharts';
import VueSocketIO from 'vue-socket.io'

Vue.use(ElementUI);
Vue.use(VueHighcharts);

//引入socket.io配置连接
Vue.use(new VueSocketIO({
  debug: true,
  connection: 'http://118.123.14.36:3000',
  vuex: {
      store,
      actionPrefix: 'SOCKET_',
      mutationPrefix: 'SOCKET_'
  }
}))

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false


/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
```

这里的 `VueSocketIO` 是实时数据的来源，舆情监控要秒级推送，轮询扛不住，所以走 WebSocket。它还配了 `vuex`，socket 收到的事件会自动 dispatch 成带 `SOCKET_` 前缀的 action，省掉手写一堆监听。Node 侧的 socket.io 怎么搭，我另外写过一篇 [Node 中使用 socket.io](https://feinterview.poetries.top/blog/node-socketio)。

那行 `if (!process.env.IS_WEB) Vue.use(require('vue-electron'))` 是 electron-vue 的一个贴心设计。这个脚手架支持把同一份代码同时构建成桌面应用和网页版，`IS_WEB` 就是用来区分的，跑在浏览器里时不加载 Electron 相关的东西，避免直接报错。

顺便提醒一句，代码里那个 `connection: 'http://118.123.14.36:3000'` 是硬编码的服务端地址。demo 里无所谓，真项目一定要抽到环境变量里，不然换个环境就得改代码重新打包。桌面应用改配置的成本比 Web 高得多，用户得重新下载安装包。

**2. 路由配置src/renderer/router/index.js**

```js
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/home',
      name: 'home',
      component: require('@/components/Home').default
    },
    {
      path: '/report',
      name: 'report',
      component: require('@/components/Report').default
    },
    {
      path: '/negativereport',
      name: 'negativereport',
      component: require('@/components/NegativeReport').default
    },
    {
      path: '/positivereport',
      name: 'positivereport',
      component: require('@/components/PositiveReport').default
    },
    {
      path: '/keyword',
      name: 'keyword',
      component: require('@/components/KeyWord').default
    },
    {
      path: '/alarm',
      name: 'alarm',
      component: require('@/components/Alarm').default
    },
    {
      path: '/msg',
      name: 'msg',
      component: require('@/components/Msg').default
    },
    {
      path: '*',
      redirect: '/home'
    }
  ]
})
```

路由这块唯一值得说的是最后那条 `path: '*'` 的兜底重定向。桌面应用里用户不会手输地址，但路由跳错的时候如果没有兜底，页面会白屏，而且用户连「刷新」这个动作都不太会做。加一条重定向到首页，体验会好很多。

还有一点，electron-vue 默认用的是 hash 模式路由。桌面应用里页面是通过 `file://` 协议加载的，history 模式那套需要服务端配合的方案根本走不通，所以只能用 hash。这一点在打包后才会暴露，开发时用 dev server 是感知不到的。

> [其他页面更多详情Github](https://github.com/poetries/yuqing-monitor-electron/tree/master/src/renderer)

**3. 在渲染进程中使用主进程方式**

```js
// electron挂载到了vue实例上 $electron
this.$electron.shell
```

`vue-electron` 干的就是这件事，把 `electron` 对象挂到 Vue 原型上，组件里 `this.$electron.xxx` 直接用。写起来是方便，但它说到底跟 `remote` 是一路货色，等于把整个 Electron 能力暴露给了所有组件。按现在的安全模型，这类插件都不该再用了，能力应该收在 preload 里按需暴露。

#### 13.4.4 多平台打包

> 需要注意的是打包`mac`版本在`mac`系统上打包，打包`window`则在`windows`上打包，可以避免很多问题

这句话是整个打包环节最值钱的一条经验。理论上 `electron-builder` 支持交叉编译，实际操作里坑非常多：mac 的 `.dmg` 需要 macOS 的原生工具链，windows 的代码签名需要 Windows SDK，还有原生模块（比如 `sqlite3`、`serialport`）必须在目标平台上重新编译。在对应平台上打包能省掉一大堆莫名其妙的问题。

真要自动化的话，正经做法是用 CI 起三个不同系统的 runner 各打各的，而不是在一台机器上硬凑。

```bash
# 在不同平台上执行即可打包应用
npm run build
```

##### 13.4.4.1 打包介绍

> [electron-vue打包文档](https://simulatedgreg.gitbooks.io/electron-vue/content/cn/using-electron-packager.html)

**1. electron 中构建应用最常用的模块**

- `electron-packager` 
- `electron-builder`

> `electron-packager` 和 `electron-builder`在自己单独创建的应用用也可以完成打包功 能。但是由于配置太复杂所以我们不建议单独配置

这两个的分工可以这么理解：`electron-packager` 只负责把你的代码和 Electron 运行时打成一个可执行的应用目录，到这儿就停了；`electron-builder` 在这之上还管生成安装包（`.dmg`、`.exe`、`.AppImage`）、代码签名、自动更新。做正经产品要发给用户的，用 `electron-builder`，因为签名和自动更新这两件事你迟早绕不开。

签名这块提一句，mac 上不签名的应用用户双击会被 Gatekeeper 拦住，得右键打开还要点确认；windows 上不签名会弹 SmartScreen 警告。这不是技术问题是钱的问题，两边的开发者证书都要年费。做内部工具可以不管，做面向公众的产品必须做。

**2. electron-forge**

> https://github.com/electron-userland/electron-forge

```
electron-forge package 
electron-forge make
```

**3. electron-vue中的打包方式**


```bash
# https://simulatedgreg.gitbooks.io/electron-vue/content/cn/using-electron-packager. html
# 之需要执行一条命令
npm run build
```

electron-vue 把配置都封好了，一条命令产出安装包。省心是省心，代价是想改点什么得去翻 `.electron-vue` 目录下的配置文件，出了问题也不好排查。这也是我前面说新项目别用它的原因之一。

##### 13.4.4.2 修改应用信息

应用名、版本号、作者、图标这些信息决定了用户装完之后在启动台和控制面板里看到的样子，别用默认值发出去。

**1. 修改package.json**

![package.json 中应用名称、版本号、描述等打包信息配置](https://s.poetries.top/gitee/20191001/81.png)

`package.json` 里的 `name`、`productName`、`version`、`description`、`author` 都会被打进安装包。`productName` 是用户看到的应用名，可以写中文；`name` 建议保持英文小写，它会参与生成文件路径。

**2. 修改src/index.ejs标题信息**

这是窗口标题栏和任务栏上显示的文字。

**3. 修改build/icons图标**

图标要准备多套尺寸和格式：mac 用 `.icns`，windows 用 `.ico`，linux 用一组不同尺寸的 `.png`。`electron-builder` 能从一张 1024x1024 的 png 自动生成大部分格式，但 mac 上的效果我还是建议自己出图，因为 mac 的图标规范有留白要求，直接缩放会显得比别的应用大一圈。

##### 13.4.4.3 打包遇到的问题

下面这几个是我当时实际卡住过的，记下来给你省时间。

**1. 创建应用托盘的时候可能会遇到错误**

- 把托盘图片放在根目录`static`里面，然后注意下面写法。 

```js
var tray = new Tray(path.join(__static,'favicon.ico'))
```

- 如果托盘路径没有问题，还是包托盘相关错误的话，把托盘对应的图片换成`.png` 格式重试

这个问题的根因是打包后文件被塞进了 `asar` 归档，原来的相对路径全失效了。`__static` 指向的是不参与打包的 `static` 目录，所以它能正常访问。`.ico` 换 `.png` 那条则是因为 Electron 在非 windows 平台上对 `.ico` 的支持不完整，报的错还很不直观，容易往别的方向排查。

**2. 模块问题可能会遇到的错误**

![打包过程中出现的模块依赖下载失败报错信息](https://s.poetries.top/gitee/20191001/82.png)

![打包失败的完整终端错误堆栈截图](https://s.poetries.top/gitee/20191001/83.png)

**解决办法**

- 删掉 `node_modules` 然后重新用 `npm install` 安装依赖
- 用 `yarn` 来安装模块
- 用手机创建一个热点电脑连上热点重试

第三条看着离谱，但它其实点到了真问题上。`electron-builder` 打包时要去下载 Electron 的预编译二进制和各平台的运行时文件，这些资源在国内网络下经常拉不下来，报出来的错却是一堆看不懂的模块错误。所以换网络能解决。更稳的做法是配镜像源，设 `ELECTRON_MIRROR` 环境变量指向国内镜像，一次配好长期有效。

> 最后执行`yarn run build`即可

![打包成功后生成的安装包文件截图](https://s.poetries.top/gitee/20191001/84.png)

> 项目源码 https://github.com/poetries/yuqing-monitor-electron

## 十四、更多参考

- [本文对应DEMO地址](https://github.com/poetries/electron-demo)
- [一些比较常用的API，克隆后跑起来你就可以快速查看这些常用API](https://github.com/electron/electron-api-demos)
- [electron学习资料整理](https://github.com/poetries/electron-wiki)
- [electron中文文档](https://wizardforcel.gitbooks.io/electron-doc/content/faq/electron-faq.html)

`electron-api-demos` 我要单独推荐一下，它是官方做的一个可交互的 API 演示应用，左边点一个功能右边就跑给你看，还能直接看到对应源码。学 Electron 的时候我把它开着当手册用，比翻文档快。

## 总结

从头捋一遍，Electron 这套东西的核心其实就一件事：**主进程和渲染进程各管一摊，中间用 IPC 连起来**。你把这条线搞清楚，剩下的 API 都是往这个框架上挂功能。菜单托盘弹窗是主进程的活，界面是渲染进程的活，跨界的一律发消息。

具体到落地，我这轮下来最有用的几条经验是这些。

窗口对象和托盘对象必须用变量拴住，否则会被垃圾回收掉，表现是「窗口莫名其妙消失」。跨窗口通信别指望直连，走主进程中转，用 `did-finish-load` 等页面加载完再发消息。`sendSync` 会阻塞整个渲染进程，业务逻辑里一律用 `invoke` / `handle`。所有资源路径用 `path.join(__dirname, ...)` 或者 `__static` 拼绝对路径，相对路径打包后必挂。跨平台的差异集中在 mac，`window-all-closed`、`activate`、托盘点击事件、快捷键的 Command 键，这四处必须做平台判断。

最后再把安全那块强调一遍，因为它是这篇 2019 年的笔记里唯一会「害人」的部分。当年默认开着的 `nodeIntegration: true`、随手可用的 `remote` 模块，现在都不该出现在新代码里。新项目的起手式是 `contextIsolation: true` + `nodeIntegration: false` + `sandbox: true`，能力放进 preload，用 `contextBridge.exposeInMainWorld` 按需暴露，主进程侧用 `ipcMain.handle` 承接。多写的那几十行，换的是「页面里跑的任何脚本都动不了用户的文件系统」，这个交换我觉得非常值。

原文的老写法我一行没删，是因为理解它为什么被淘汰，比直接背新写法更有用。但要往生产环境里放的，请照新的来。各个 API 的具体参数和默认值在不同版本间有过调整，动手前对一下官方文档的 Security 章节。

## 参考

- [Electron 官方文档](https://www.electronjs.org/docs/latest)
- [Electron 安全建议](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron 进程间通信](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Electron API Demos](https://github.com/electron/electron-api-demos)
- [MDN Notification API](https://developer.mozilla.org/zh-CN/docs/Web/API/Notification)
- [本文对应 DEMO 仓库](https://github.com/poetries/electron-demo)
- [舆情监控系统源码](https://github.com/poetries/yuqing-monitor-electron)
- [前端进阶之旅](https://interview.poetries.top)
