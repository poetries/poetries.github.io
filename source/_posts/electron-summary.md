---
title: Electron构建跨平台应用mac/windows/linux
date: 2019-01-06 17:40:43
tags: 
   - Electron
   - Node
categories: Front-End
---


# 一、前言

- `NW.js` 和 `Electron` 都可以用前端的知识来开发桌面应用。`NW.js` 和 `Electron `起初是同一 个作者开发。后来种种原因分为两个产品。一个命名为 `NW.js`(英特尔公司提供技术支持)、 另一命名为 `Electron`(Github 公司提供技术支持)。
- `NW.js` 和 `Electron` 可以用 `Nodejs` 中几乎所有的模块。`NW.js` 和 `Electron `不仅可以把 `html` 写的 `web` 页面打包成跨平台可以安装到电脑上面的软件，也可以通过 `javascript` 访问操作 系统原生的 `UI` 和 `Api`(控制窗口、添加菜单项目、托盘应用菜单、读写文件、访问剪贴板)。

>  `github` 的 `atom` 编辑器、微软的 `vscode` 编辑器，包括阿里内部的一些 软件也是用 `electron` 开发的


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


# 二、环境搭建


**1. 安装 electron**

```bash
npm install -g electron
```

**2. 克隆一个仓库、快速启动一个项目**

```bash
# 克隆示例项目的仓库
git clone https://github.com/electron/electron-quick-start

# 进入这个仓库
cd electron-quick-start

# 安装依赖并运行
npm install && npm start
```

**3. 手动搭建一个 electron 项目**

1. 新建一个项目目录 例如: `electrondemo01`
2. 在 `electrondemo01` 目录下面新建三个文件: `index.html`、`main.js` 、`package.json `
3. `index.html` 里面用 `css` 进行布局(以前怎么写现在还是怎么写)
4. 在 `main.js` 中写如下代码

```js
var electron =require('electron'); //electron 对象的引用
const app=electron.app; //BrowserWindow 类的引用
const BrowserWindow=electron.BrowserWindow;

let mainWindow=null; //监听应用准备完成的事件 app.on('ready',function(){

//监听应用准备完成的事件
app.on('ready',function(){
    //创建窗口
    mainWindow=new BrowserWindow({width: 800, height: 600}); mainWindow.loadFile('index.html');
    
    mainWindow.on('closed', function () {
        mainWindow = null; })
    })
})

//监听所有窗口关闭的事件 
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar // to stay active until the user quits explicitly with Cmd + Q 
    if (process.platform !== 'darwin') {
        app.quit(); 
    }
})
```

5. 运行

```bash
electron . #注意:命令后面有个点
```

**4. electron-forge 搭建一个 electron 项目**

> `electron-forge` 相当于 `electron` 的一个脚手架，可以让我们更方便的创建、运行、打包 `electron` 项目

```bash
npm install -g electron-forge 

electron-forge init my-new-app 

cd my-new-app

npm start
```


# 三、Electron 运行流程


## 3.1 Electron 运行的流程

 ![](https://poetries1.gitee.io/img-repo/20191001/48.png)

## 3.2 Electron 主进程和渲染进程

- `Electron` 运行 `package.json` 的 `main` 脚本的进程被称为主进程。 
- 在主进程中运行的脚本通过创建 `web` 页面来展示用户界面。 一个 `Electron` 应用总是有且只有一个主进程。
- 由于 `Electron` 使用了 `Chromium`(谷歌浏览器)来展示 `web` 页面，所以 `Chromium` 的 多进程架构也被使用到。 每个 `Electron` 中的 `web` 页面运行在它自己的渲染进程中。
- 主进程使用 `BrowserWindow` 实例创建页面。每个 `BrowserWindow` 实例都在自己的渲 染进程里运行页面。 当一个 `BrowserWindow`实例被销毁后，相应的渲染进程也会被终止

 ![](https://poetries1.gitee.io/img-repo/20191001/49.png)

![](https://poetries1.gitee.io/img-repo/20191001/50.png)


- 进程:进程是计算机中的程序关于某数据集合上的一次运行活动，是 系统进行资源分配和调度的基本单位，是操作系统结构的基础。
- 线程:在一个程序里的一个执行路线就叫做线程(`thread`)。更准确的定义是: 线程是“一个进程内部的控制序列”。
- 线程和进程:一个程序至少有一个进程,一个进程至少有一个线程

## 3.3 Electron 渲染进程中通过 Nodejs 读取本地文件

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

## 3.4 Electron 开启调试模式

```js
 mainWindow.webContents.openDevTools();
 ```
 
![](https://poetries1.gitee.io/img-repo/20191001/51.png)


# 四、Electron 模块介绍

> `Electron` 模块介绍、`remote` 模块、通 过 `BrowserWindow` 打开新窗口

## 4.1 Electron 主进程和渲染进程中的模块

![](https://poetries1.gitee.io/img-repo/20191001/52.png)

## 4.2 Electron remote 模块

> `remote` 模块提供了一种在渲染进程(网页)和主进程之间进行进程间通讯(`IPC`)的简便途径

> `Electron` 中, 与 `GUI` 相关的模块(如 `dialog`, `menu` 等)只存在于主进程，而不在渲染进程中 。为了能从渲染进程中使用它们，需要用`ipc`模块来给主进程发送进程间消息。使用 `remote` 模块，可以调用主进程对象的方法，而无需显式地发送进程间消息，这类似于 `Java` 的 `RMI`

## 4.3 通过BrowserWindow 打开新窗口

> `Electron` 渲染进程中通过 **`remote` 模块调用主进程中的 `BrowserWindow`** 打开新窗口

> https://electronjs.org/docs/api/browser-window

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

![](https://poetries1.gitee.io/img-repo/20191001/53.png)


# 五、自定义顶部菜单/右键菜单

![](https://poetries1.gitee.io/img-repo/20191001/54.png)

## 5.1 主进程中调用Menu模块-自定义软件顶部菜单

> https://electronjs.org/docs/api/menu-item


> `Electron` 中 `Menu` 模块可以用来创建原生菜单，它可用作应用菜单和 `context` 菜单

> 这个模块是一个主进程的模块，并且可以通过 `remote` 模块给渲染进程调用

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

```js
// 在主进程src/index.js中引入
const createWindow = () => {

  // 创建菜单  
  // 引入菜单模块
  require('./main/menu.js')
};

```

![](https://poetries1.gitee.io/img-repo/20191001/55.png)

> 我们给菜单绑定事件，在命令行控制台可以看到

![](https://poetries1.gitee.io/img-repo/20191001/56.png)

## 5.2 渲染进程中调用Menu模块

> 不推荐使用这种方式，建议在主进程中使用

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

## 5.3 渲染进程中自定义右键菜单

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

![](https://poetries1.gitee.io/img-repo/20191001/57.png)


**2. 引入**

```html
<!--index.html-->
<script src="render/menu.js"></script>
```


# 六、进程通信

![](https://poetries1.gitee.io/img-repo/20191001/58.png)

- 渲染进程 https://electronjs.org/docs/api/ipc-renderer
- 主进程 https://electronjs.org/docs/api/ipc-main

## 6.1 主进程与渲染进程之间的通信

> 有时候我们想在渲染进程中通过一个事件去执行主进程里面的方法。或者在渲染进程中通知 主进程处理事件，主进程处理完成后广播一个事件让渲染进程去处理一些事情。这个时候就 用到了主进程和渲染进程之间的相互通信

> `Electron` 主进程，和渲染进程的通信主要用到两个模块:`ipcMain` 和 `ipcRenderer`

- `ipcMain`:当在主进程中使用时，它处理从渲染器进程(网页)发送出来的异步和同步信息,当然也有可能从主进程向渲染进程发送消息。
- `ipcRenderer`: 使用它提供的一些方法从渲染进程 (`web` 页面) 发送同步或异步的消息到主进程。 也可以接收主进程回复的消息

### 6.1.1 渲染进程给主进程发送异步消息

> 间接实现渲染进程执行主进程里面的方法

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

**2. 主进程接收消息**

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

![](https://poetries1.gitee.io/img-repo/20191001/59.png)

### 6.1.2 渲染进程发送消息，主进程接收消息并反馈

> 渲染进程给主进程发送异步消息，主进程接收到异步消息以后通知渲染进程

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


![](https://poetries1.gitee.io/img-repo/20191001/60.png)

### 6.1.3 渲染进程给主进程发送同步消息

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

![](https://poetries1.gitee.io/img-repo/20191001/61.png)

### 6.1.4 渲染进程广播通知主进程打开窗口

> 一般都是在渲染进程中执行广播操作，去通知主进程完成任务

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

![](https://poetries1.gitee.io/img-repo/20191001/62.png)


## 6.2 渲染进程与渲染进程之间的通信

> 也就是两个窗口直接的通信

### 6.2.1 localstorage传值

> `Electron` 渲染进程通过 `localstorage` 给另一个渲染进程传值


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


### 6.2.2 BrowserWindow和webContents方式实现

> 通过 `BrowserWindow` 和 `webContents` 模块实现渲染进程和渲染进程的通信

> `webContents` 是一个事件发出者.它负责渲染并控制网页，也是 `BrowserWindow` 对象的属性

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
    win.webContents.on('did-finish-load', ()=>[
        win.webContents.send('toNews', userInfo)
    ])
    

    win.on('closed', () => {
        win = null;
      });
})
```

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

![](https://poetries1.gitee.io/img-repo/20191001/63.png)

![](https://poetries1.gitee.io/img-repo/20191001/64.png)

> 那么，这里有一个问题，`news`进程接收到了广播后如何给出反馈呢？

![](https://poetries1.gitee.io/img-repo/20191001/65.png)

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
    win.webContents.on('did-finish-load', ()=>[
        win.webContents.send('toNews', userInfo, winId)
    ])
    

    win.on('closed', () => {
        win = null;
      });
})
```

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

![](https://poetries1.gitee.io/img-repo/20191001/66.png)

# 七、Electron Shell 模块

![](https://poetries1.gitee.io/img-repo/20191001/67.png)

## 7.1 Shell 模块使用

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


## 7.2 `Electron DOM` `<webview>` 标签

> `Webview` 与 `iframe` 有点相似，但是与 `iframe` 不同, `webview` 和你的应用运行的是不同的进程。它不拥有渲染进程的权限，并且应用和嵌入内容之间的交互全部都是异步的。因为这能 保证应用的安全性不受嵌入内容的影响。

```html
<!--src/index.html中引入-->
<webview id="webview" src="http://blog.poetries.top" style="position:fixed; width:100%; height:100%">
</webview>
```

## 7.3 `shell`模块`<webview>`结合`Menu`模块使用案例


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

![](https://poetries1.gitee.io/img-repo/20191001/68.png)


# 八、Electron dialog 弹出框

![](https://poetries1.gitee.io/img-repo/20191001/69.png)


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

```js
remote.dialog.showErrorBox('警告', '操作有误')
```

![](https://poetries1.gitee.io/img-repo/20191001/70.png)

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

![](https://poetries1.gitee.io/img-repo/20191001/71.png)

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

![](https://poetries1.gitee.io/img-repo/20191001/72.png)

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

![](https://poetries1.gitee.io/img-repo/20191001/73.png)

# 九、实现一个类似EditPlus的简易记事本代码编辑器

> 代码 https://github.com/poetries/electron-demo/tree/master/notepad


# 十、系统托盘、托盘右键菜单、托盘图标闪烁 

![](https://poetries1.gitee.io/img-repo/20191001/74.png)

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

![](https://poetries1.gitee.io/img-repo/20191001/75.png)

**3. 监听任务栏图标的单击、双击事件**

```js
// 实现点击关闭按钮，让应用保存在托盘里面，双击托盘打开
let win = BrowserWindow.getFocusedWindow()

win.on('close', (e)=>{
    e.preventDefault()
    win.hide()
})

iconTray.on('double-click', (e)=>{
    win.show()
})
```

**4. Electron 点击右上角关闭按钮隐藏任务栏图标**


```js
const win = BrowserWindow.getFocusedWindow();

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

**5. Electron 实现任务栏闪烁图标**

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

# 十一、消息通知、监听网络变 化、网络变化弹出通知框

## 11.1 消息通知

**1. Electron 实现消息通知**

> `Electron` 里面的消息通知是基于 `h5` 的通知 `api` 实现的

> 文档 https://developer.mozilla.org/zh-CN/docs/Web/API/notification

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

![](https://poetries1.gitee.io/img-repo/20191001/76.png)

## 11.2 监听网络变化

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
 
 **2. 监听网络变化实现消息通知**
 
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
 
 ![](https://poetries1.gitee.io/img-repo/20191001/77.png)
 
 
# 十二、注册全局快捷键/剪切板事件/nativeImage 模块
 
> `Electron` 注册全局快捷键 (`globalShortcut`) 以及 `clipboard` 剪 切板事件以及 `nativeImage` 模块(实现类似播放器点击机器码自动复制功 能)
 

## 12.1 注册全局快捷键

![](https://poetries1.gitee.io/img-repo/20191001/78.png)

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


**2. 引入src/index.js**

```js
// 注意在外部引入即可 不用放到app中
require('./main/shortCut.js')
```



## 12.2  剪切板clipboard、nativeImage 模块

![](https://poetries1.gitee.io/img-repo/20191001/79.png)


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
</div>.
<div>
  <h2>复制图片到界面</h2>
  <button id="copyImg">复制图片</button><br />
</div>
<script src="render/clipboard.js"></script>
```

**2. 新建src/render/clipboard.js**

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


# 十三、结合electron-vue

## 13.1 electron-vue 的使用

**1. electron-vue 的一些资源**

> https://github.com/SimulatedGREG/electron-vue


`Electron-vue` 文档 https://simulatedgreg.gitbooks.io/electron-vue/content/cn

**2. electron-vue 环境搭建、创建项目**

```bash
npm install -g vue-cli

vue init simulatedgreg/electron-vue my-project

cd my-project

yarn # or npm install

yarn run dev # or npm run dev
```

**3. electron-vue 目录结构分析**

![](https://poetries1.gitee.io/img-repo/20191001/80.png)

## 13.2 electron-vue 中使用 sass/ElementUi

**1. electron-vue UI 框架 ElementUi 的使用**

> http://element-cn.eleme.io/#/zh-CN


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

## 13.3 electron-vue 中隐藏顶部菜单隐藏

> electron-vue 中隐藏顶部菜单隐藏顶部最大化、最小化、关闭按钮 自定最大化、最小化 、关闭按钮

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

**3 .electron-vue 自定义关闭/最大化最小化按钮**



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

**4. electron-vue 自定义导航可拖拽**

- 可拖拽的 `css`: `-webkit-app-region: drag; `
- 不可拖拽的 `css`:  `-webkit-app-region: no-drag;`


## 13.4 使用electron-vue开发舆情监控系统

### 13.4.1 配置开发环境

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

- 在`.electron-vue/webpack.renderer.config.js`中配置`sass-loader`就可以编写``sass`了

```html
<!--vue 文件中修改 style 为如下代码:-->

<style lang="scss"> 
    body {
        /* SCSS */ 
    }
</style>
```

### 13.4.2 主进程配置

**1. `src/main/index.js`**

```js
function createWindow () {
  // 去掉顶部菜单
  mainWindow.setMenu(null)
  
  // 菜单项
  require('./model/menu.js');
  
  // 系统托盘相关
  require('./model/tray.js');
```

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

### 13.4.3 渲染进程配置

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

> [其他页面更多详情Github](https://github.com/poetries/yuqing-monitor-electron/tree/master/src/renderer)

**3. 在渲染进程中使用主进程方式**

```js
// electron挂载到了vue实例上 $electron
this.$electron.shell
```

### 13.4.4 多平台打包

> 需要注意的是打包`mac`版本在`mac`系统上打包，打包`window`则在`windows`上打包，可以避免很多问题


```bash
# 在不同平台上执行即可打包应用
npm run build
```

#### 13.4.4.1 打包介绍

> [electron-vue打包文档](https://simulatedgreg.gitbooks.io/electron-vue/content/cn/using-electron-packager.html)

**1. electron 中构建应用最常用的模块**

- `electron-packager` 
- `electron-builder`

> `electron-packager` 和 `electron-builder`在自己单独创建的应用用也可以完成打包功 能。但是由于配置太复杂所以我们不建议单独配置

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

#### 13.4.4.2 修改应用信息

**1. 修改package.json**

![](https://poetries1.gitee.io/img-repo/20191001/81.png)

**2. 修改src/index.ejs标题信息**

**3. 修改build/icons图标**

#### 13.4.4.3 打包遇到的问题

**1. 创建应用托盘的时候可能会遇到错误**

- 把托盘图片放在根目录`static`里面，然后注意下面写法。 

```js
var tray = new Tray(path.join(__static,'favicon.ico'))
```

- 如果托盘路径没有问题，还是包托盘相关错误的话，把托盘对应的图片换成`.png` 格式重试

**2. 模块问题可能会遇到的错误**

![](https://poetries1.gitee.io/img-repo/20191001/82.png)

![](https://poetries1.gitee.io/img-repo/20191001/83.png)

**解决办法**

- 删掉 `node_modules` 然后重新用 `npm install` 安装依赖
- 用 `yarn` 来安装模块
- 用手机创建一个热点电脑连上热点重试

> 最后执行`yarn run build`即可

![](https://poetries1.gitee.io/img-repo/20191001/84.png)


> 项目源码 https://github.com/poetries/yuqing-monitor-electron

# 十四、更多参考

- [本文对应DEMO地址](https://github.com/poetries/electron-demo)
- [一些比较常用的API，克隆后跑起来你就可以快速查看这些常用API](https://github.com/electron/electron-api-demos)
- [electron学习资料整理](https://github.com/poetries/electron-wiki)
- [electron中文文档](https://wizardforcel.gitbooks.io/electron-doc/content/faq/electron-faq.html)
