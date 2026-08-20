---
title: 初探vscode插件开发 从环境搭建到发布上架
description: 用一个前端工具箱插件的开发过程串起 VSCode 插件开发全流程，讲清激活事件、贡献点、package.json 清单、extension.js 入口、Webview 与插件通信，以及 vsce 打包发布和版本升级。
date: 2021-01-03 15:01:24
tags:
  - 插件
  - vscode
  - 工程化
categories: Front-End
---

每天在 VSCode 里待八小时，总有些重复动作让人手痒：查个正则、转个时间戳、格式化一段 JSON，每次都要切浏览器找在线工具。趁着元旦假期最后一天，我照着官方文档把 VSCode 插件开发从头走了一遍，做了个前端工具箱塞进侧边栏，顺手把整个流程记下来。这篇从装脚手架讲到发布上架，中间把激活事件、贡献点、Webview 通信这几个绕人的概念拆开说，代码都是能直接跑的。看完你至少能把自己那几个小工具做成插件，不用再开浏览器。

![前端工具箱插件在 VSCode 中的运行截图](https://s.poetries.top/gitee/2020/12/screenshot.png)

在 VSCode 插件市场里搜「前端工具箱」，或者直接打开 https://marketplace.visualstudio.com/items?itemName=poetries.fe-tools 就能装。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 开发环境怎么搭，`yo code` 脚手架问的那几个问题该怎么答
- 按 F5 之后发生了什么，扩展宿主窗口和编辑窗口的关系
- 怎么给插件打断点，Webview 里的代码又该怎么调
- 激活事件、贡献点、VS Code API 这三个概念各自管什么
- `package.json` 清单文件的每个字段是干嘛的
- `extension.js` 里 `activate` 和 `deactivate` 的调用时机
- Webview 面板怎么创建，本地资源路径为什么不能直接写
- Webview 和插件之间怎么双向通信
- vsce 打包、发布、升级的完整命令，以及一份发布前 checklist

## 一、Step 1 搭开发环境

先把环境准备好。我用的是 macOS，第一步确认 VS Code、Node.js 和 Git 都装了：

```bash
code -v
node -v
npm -v
git --version
```

`code -v` 如果报命令找不到，去 VS Code 里按 `Cmd+Shift+P` 执行 `Shell Command: Install 'code' command in PATH`，这一步在后面本地安装 vsix 的时候还会用到。

官方的起步文档在这里，建议对照着看：https://code.visualstudio.com/api/get-started/your-first-extension

然后全局装脚手架。`yo` 是 Yeoman，`generator-code` 是 VS Code 官方提供的插件项目生成器：

```bash
npm install -g yo generator-code
```

用 `yo code` 初始化项目，它会问你一串问题：

```bash
yo code

# What type of extension do you want to create? 
# 创建哪一种类型的扩展

# What's the name of your extension?
# 扩展的名称

# What's the identifier of your extension?
# 扩展的标识

# What's the description of your extension?
# 扩展的描述

# Initialize a git repository? 
# 是否初始化 git 仓库

# Which package manager to use? 
# 使用哪一种包管理器
```

第一个问题最关键，它决定了生成什么骨架。当年的选项主要是 JavaScript、TypeScript、Color Theme、Language Support、Code Snippets、Keymap、Extension Pack 这几类，选 JavaScript 或 TypeScript 就能拿到一个可运行的 helloworld 项目。

这里补一句时效性的话。这篇写于 2021 年初，`yo code` 的选项列表这几年增加过（比如面向浏览器环境的 Web Extension 类型），提问的措辞也调整过。你跑出来和上面对不上是正常的，按提示选就行，具体以官方文档为准。标识（identifier）这一项建议一次填对，它会和后面的发布者名字拼成插件在市场里的唯一 ID，改起来很麻烦。

## 二、Step 2 跑起来，然后学会调试

### 按 F5 之后发生了什么

用 VS Code 打开刚生成的项目，在编辑器里按 F5，它会编译并打开一个新窗口，官方叫「扩展开发宿主机」（Extension Development Host）。为了叙述方便，下面把新打开的窗口叫**运行窗口**，原来那个叫**编辑窗口**。

在运行窗口的命令面板（`Ctrl+Shift+P`，macOS 是 `Cmd+Shift+P`）里执行 Hello World 命令，右下角就会弹出通知。到这一步，你已经跑起了一个自己写的插件。

![按 F5 打开扩展开发宿主窗口并执行 Hello World 命令的演示动图](https://s.poetries.top/gitee/2021/01/3.gif)

这个两窗口的设计一开始会有点绕，但想明白就很自然：插件跑在一个独立的扩展宿主进程里，编辑窗口是你的开发环境，运行窗口是插件的沙箱。你改了代码，在运行窗口按 `Cmd+R` 重载就能生效，不用重启整个 VS Code。

### 打断点调试

调试插件很省事，不需要额外配置，`yo code` 生成的项目里已经带好了 `.vscode/launch.json`。

在编辑窗口打开 `extension.js`，点击行号左侧的边栏设置断点。然后在运行窗口的命令面板里执行 Hello World 命令，断点就会命中，变量、调用栈、单步执行全都能用，和调试普通 Node 程序一模一样。

![在 extension.js 中设置断点并命中的调试演示动图](https://s.poetries.top/gitee/2021/01/4.gif)

这块要理解的是：插件代码跑在 Node 环境里，所以你调的是 Node 进程，`console.log` 的输出会打到编辑窗口的「调试控制台」，不是运行窗口的开发者工具。这两个地方我一开始经常找错。

### 调试 Webview

Webview 是另一回事。它其实就是一个内嵌的网页，跑在渲染进程里，Node 的断点管不着它。

调试方法是这样：按 F5 打开调试模式，在 Webview 页面上按 `Cmd+Shift+P`，执行 Open Webview Developer Tools（面板里搜 webview 就能找到）。

![命令面板中查找 webview 开发者工具的入口](https://s.poetries.top/gitee/2021/01/10.png)

打开之后就是一个完整的 Chrome DevTools，Elements、Console、Network、Sources 全都在，调它和调普通网页没有区别。

![Webview 开发者工具打开后的界面，可以像调试网页一样调试 Webview 内容](https://s.poetries.top/gitee/2021/01/11.png)

所以一个带 Webview 的插件其实有两套调试链路，插件侧走 Node 断点，Webview 侧走 DevTools。搞混了会浪费很多时间，这个我踩过，在 Webview 里打 `console.log` 死活在调试控制台看不到，排查了一下午才反应过来看错地方了。

## 三、Step 3 读懂 helloworld 这个骨架

接下来深入看看 helloworld 插件。它的功能极简，用户在命令面板执行 Hello World 命令，弹出一条 Hello World 消息。

从实现角度看，它做了三件事：

- 注册激活事件 `onCommand:extension.helloWorld`，插件在这个命令被触发时才被激活
- 注册贡献点 `contributes.commands:extension.helloWorld`，在命令面板中登记 Hello World 命令，并把它绑到 `extension.helloWorld` 这个 ID 上
- 调用 VS Code API `commands.registerCommand`，给这个命令 ID 绑定真正的处理函数

### 三个基本概念

上面提到的激活事件、贡献点和 API，是插件开发里绕不开的三个词，值得单独说清楚。

**激活事件**（Activation Events），在配置清单 `package.json` 里静态声明，就是 JSON 数组 `activationEvents` 的值。当声明的事件发生时，插件才会被激活。当年可用的激活事件包括 `onLanguage`、`onCommand`、`onDebug`、`onDebugInitialConfigurations`、`onDebugResolve`、`workspaceContains`、`onFileSystem`、`onView`、`onUri`、`onWebviewPanel`，以及表示「启动就激活」的 `*`。

那为什么要有激活事件这个东西？因为 VS Code 不想在启动时加载你的插件。一个人装二三十个插件很常见，如果每个都在启动时跑一遍初始化，编辑器几秒钟都起不来。所以设计成按需激活：声明清楚你在什么情况下需要被叫醒，其余时间你的代码根本不会被加载。**别图省事写 `*`**，那等于在所有人的启动时间上收税。

这里也有个时效性的提醒。较新版本的 VS Code 对 `contributes.commands` 里声明过的命令会自动推导出对应的激活事件，不用再在 `activationEvents` 里重复写一遍 `onCommand:xxx`。你如果看到新生成的项目里 `activationEvents` 是个空数组，不是脚手架坏了。具体规则以官方文档为准。

**贡献点**（Contribution Points），同样在 `package.json` 里静态声明，指的是 VS Code 开放给插件扩展的那些功能点。当年可用的贡献点包括 `configuration`、`configurationDefaults`、`commands`、`menus`、`keybindings`、`languages`、`debuggers`、`breakpoints`、`grammars`、`themes`、`snippets`、`jsonValidation`、`views`、`viewsContainers`、`problemMatchers`、`problemPatterns`、`taskDefinitions`、`colors`、`typescriptServerPlugins`、`resourceLabelFormatters` 等。

理解贡献点的关键是：它们全是**声明式**的。你在 JSON 里说「我要往右键菜单加一项」「我要占一个侧边栏图标」，VS Code 读了清单就知道该怎么渲染 UI，压根不用先加载你的代码。这也是它敢做懒激活的前提。

**VS Code API**，一组能在扩展代码里调用的 JavaScript 接口。官方文档列了全部可用 API，熟悉常用的那些就够了（`window`、`commands`、`workspace`、`languages` 这几个命名空间覆盖了绝大多数场景），其他的用到再查。

一句话串起来：贡献点负责「让用户看见入口」，激活事件负责「决定什么时候加载你」，API 负责「加载之后你能干什么」。

### JavaScript 插件的目录结构

![VS Code 插件项目的目录结构，包含 package.json、extension.js 与 test 目录](https://s.poetries.top/gitee/2021/01/5.jpeg)

目录结构很简单，看名字大概就知道作用。不同项目类型的结构差别可能很大，但对 JavaScript 项目来说，最重要的就两个文件：`package.json` 和 `extension.js`。前者告诉 VS Code「我是谁、我提供什么」，后者是真正跑起来的代码。

### 清单文件 package.json

每个 VS Code 插件都必须有一个描述自己的清单文件 `package.json`。它是声明式的 JSON，用来声明插件名（name）、展示名（displayName）、描述（description）、版本（version）、引擎（engines）、类别（categories）、依赖（devDependencies）、脚本（scripts）、贡献点（contributes）、入口文件（main）、激活事件（activationEvents）等。

下面是 helloworld 插件的清单内容，我加了注释方便对照：

```json
{
    "name": "helloworld", //插件名
    "displayName": "helloworld", // 插件市场显示的插件名，支持中文
    "description": "demo", // 插件市场显示的描述信息
    "version": "0.0.1", // 版本号
    // 最低支持的 VS Code 版本
    "engines": {
        "vscode": "^1.38.0"
    },
    // 插件市场分类
    "categories": [
        "Other"
    ],
    // 激活事件
    "activationEvents": [
        "onCommand:extension.helloWorld"
    ],
    "main": "./extension.js", // 指定入口文件
    // 贡献点
    "contributes": {
        "commands": [{
            "command": "extension.helloWorld",
            "title": "Hello World"
        }]
    },
    // 脚本
    "scripts": {
        "test": "node ./test/runTest.js"
    },
    // 依赖，包含版本信息
    "devDependencies": {
        "@types/glob": "^7.1.1",
        "@types/mocha": "^5.2.6",
        "@types/node": "^10.12.21",
        "@types/vscode": "^1.38.0",
        "eslint": "^5.13.0",
        "glob": "^7.1.4",
        "mocha": "^6.1.4",
        "typescript": "^3.3.1",
        "vscode-test": "^1.2.0"
    }
}
```

有三个字段容易踩坑，单独说一下。

`engines.vscode` 声明的是最低支持版本，它必须和 `@types/vscode` 的版本对得上，否则你可能用了一个高版本才有的 API，类型检查过了但在用户的旧版本上直接报错。写高了会把老用户挡在门外，写低了自己束手束脚，一般跟着你实际用到的 API 走。

`displayName` 和 `name` 是两个东西。`name` 参与组成插件 ID，只能是小写字母数字和连字符；`displayName` 是市场上展示的名字，可以写中文。上面那个前端工具箱，`name` 是 `fe-tools`，`displayName` 才是「前端工具箱」。

`categories` 影响你在市场里被归到哪一类，随手写 `Other` 会让插件很难被发现，能对上号就尽量填准确。

另外，上面 `devDependencies` 里的 `vscode-test` 是当年的测试包名，后来官方把这一系列工具包迁到了 `@vscode/` 命名空间下。你新建项目看到的名字大概率和这里不一样，以脚手架生成的为准。

### 插件入口文件 extension.js

入口文件由清单里的 `main` 字段指定。项目大了源文件多了，也可以统一放进 `src` 目录再改 `main` 指向。

```js
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
/* 导入 "vscode" 模块，这个模块包含 VS Code 的扩展接口。 */ 
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
// 第一次执行命令时，插件会被激活；插件被激活时，这个函数会被调用
// 必须在入口中实现这个函数。

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    /* 输出诊断日志到控制台 */
    console.log('Congratulations, your extension "helloworld" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    /* 
     * 这个命令 extension.helloWorld 已经在 package.json 文件中定义了。
     * 现在我们使用 registerCommand 接口给这个命令绑定实现。
     */
    let disposable = vscode.commands.registerCommand('extension.helloWorld', function () {
        // The code you place here will be executed every time your command is executed
        /* 每一次执行命令，这儿的代码都会执行 */

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
}
```

一个插件必须在主模块里实现并导出 `activate()` 和 `deactivate()` 两个函数。

`activate()` 负责初始化。任何一个声明的激活事件发生时，VS Code 会调用它，而且只调用一次。后面命令被执行多少次，跑的都是 `registerCommand` 里那个回调，`activate` 不会再进。

`deactivate()` 负责清理。如果清理过程是异步的，它必须返回一个 Promise；如果是同步的，返回 `undefined` 即可。

最后那行 `context.subscriptions.push(disposable)` 别漏掉。`registerCommand` 返回的是一个可释放对象，把它推进 `context.subscriptions`，VS Code 会在插件停用时自动帮你注销。不推进去的话，插件重载时命令会重复注册，行为就开始飘了。这条对所有 `register*` 系列 API 都适用，包括事件监听、TreeView、状态栏项。

## 四、Step 4 做一个 Webview 面板

插件分很多类，主题样式类、图标类、语言支持类，Webview 只是其中一个大类。但它是自由度最高的一类，因为你可以在里面塞一整个网页，前端那套技能直接复用。前面那个工具箱的界面就是 Webview 做的。

官方文档的示例里，Webview 的 HTML 是拼字符串生成的。演示够用，真做起来不行，稍微复杂一点的界面拼字符串就没法维护了。常见做法是引一个模板引擎，比如 pug，把模板文件单独放，再在里面按普通网页的方式引入 Vue 之类的运行时脚本。

创建一个 Webview 面板长这样：

```js
// 静态资源的目录。绝对路径，并且使用了vscode-resource协议
// vscode-resource:/Users/Desktop/game-news/views
const webviewDir = path.join(context.extensionPath, 'views');

// 创建一个Webview的面板
const panel = vscode.window.createWebviewPanel(
    viewType,
    title,
    vscode.ViewColumn.One,
    {
        enableScripts: true, // 允许运行js脚本，默认是关闭的
        retainContextWhenHidden: true, // 面板被隐藏时保留上下文，脚本不会被挂起
        // 指定允许加载的本地资源的根目录
        localResourceRoots: [vscode.Uri.file(webviewDir)]
    }
);

// 模版文件
const tpl = path.join(webviewDir, 'index.pug');

// 通过pug渲染模版文件，到webview上
panel.webview.html = pug.renderFile(tpl, options);
```

这几个配置项都有坑，一个个说。

`enableScripts` 默认是 `false`，也就是说你的 Webview 里所有 `<script>` 都不会执行。这是安全默认值，做纯展示面板保持关闭最好，需要交互再打开。

`retainContextWhenHidden` 这一项原文的注释写反了，我改过来了。设成 `true` 的含义是**面板被隐藏（比如切到别的标签页）时保留上下文**，DOM 状态和 JS 变量都还在，切回来还是原样。默认值 `false` 才会在隐藏时销毁上下文，下次显示时重新加载 HTML。方便是方便，代价是内存一直占着，官方明确建议只在「重建状态成本很高」的场景才开。

`localResourceRoots` 限定了 Webview 能加载哪些本地目录的资源。不在白名单里的路径一律加载失败，浏览器控制台里能看到被拦的请求。

### 本地资源该怎么引

Webview 里免不了要用本地的 CSS 和 JS 文件。行内写当然可以，但总归不好维护。用外部文件就会遇到路径问题：Webview 的页面上下文和你的插件目录不在同一个来源上，写相对路径找不到文件。

当年的解法是把文件系统路径转成 `vscode-resource` 协议的 URI：

```js
const webviewDir = path.join(context.extensionPath, 'views');
// 静态资源的绝对目录
let URI = vscode.Uri.file(path.join(webviewDir, 'js', 'vue.js'))
// 使用vscode-resource协议头
// 然后这个URL就可以使用在我们的webview的模版中了
URI = URI.with({ scheme: 'vscode-resource' });
```

这块要提醒一下时效性。`vscode-resource:` 是旧写法，后来官方提供了 `panel.webview.asWebviewUri(uri)` 来生成资源 URI，同时引入了 `panel.webview.cspSource` 配合内容安全策略使用。新项目建议直接用 `asWebviewUri`，手动拼协议头的方式在新版本上可能不再工作。具体 API 名和支持的版本以官方文档为准，我这份代码保留原样是为了和当时的写法对得上。

### Webview 和插件怎么通信

Webview 相当于一个网页，网页调不了本地功能。但插件本身跑在 Node 环境里，能干很多网页干不了的事。两边怎么搭上线？靠消息机制。

举个具体场景：Webview 里列了一堆链接，点击某一条要用系统默认浏览器打开。Webview 自己做不到，那就把 url 发给插件，让插件去调系统命令。

Webview 这一侧：

```js
// webview

// webview中，一个内置的全局api
const vscode = acquireVsCodeApi()

vscode.postMessage({
    command: 'preview',
    text: url
})
```

插件这一侧：

```js
// 插件
panel.webview.onDidReceiveMessage(message => {
    switch (message.command) {
        case 'preview':
            // 打开浏览器
            open(message.text);
            return;
    }
}, undefined, context.subscriptions);
```

`acquireVsCodeApi()` 是 VS Code 注入到 Webview 全局的函数，**一个 Webview 里只能调用一次**，调第二次会直接抛错。所以正确姿势是在脚本最开头调一次，把返回值存成模块级变量，后面都用它。这个我踩过，热重载的时候脚本跑了两遍，报了个莫名其妙的错。

反方向也能通，插件调 `panel.webview.postMessage(data)` 往 Webview 发消息，Webview 里监听 `window.addEventListener('message', event => {...})` 接收。加上 `acquireVsCodeApi()` 返回对象上的 `getState` / `setState`，就能在面板被销毁重建时恢复界面状态，这也是 `retainContextWhenHidden` 之外的另一条路，而且更省内存。

更多细节看官方的 Webview 指南：https://code.visualstudio.com/api/extension-guides/webview

## 五、Step 5 打包、发布和升级

插件写完了，怎么让别人也用上？和移动应用一样，两条路：

- 发布到 VS Code 插件市场，别人搜索就能找到、下载、安装
- 打包成 `vsix` 格式的文件，直接发给其他人手动安装

### 认识 vsce

vsce 是 Visual Studio Code Extensions 的缩写，是用于打包、发布和管理 VS Code 插件的命令行工具。

装好 Node.js 之后全局装它：

```bash
npm install -g vsce
```

然后在插件根目录执行这几条：

```bash
vsce create-publisher poetry # 这一步先创建一个发布账号，需要用到token，看下面步骤获取token
vsce package #打包插件 .vsix 格式
vsce publish #发布到 MarketPlace
```

时效性提醒放在这里：`vsce` 这个 npm 包后来迁到了 `@vscode/vsce`，旧包名不再维护，现在安装一般写 `npm install -g @vscode/vsce`。另外创建发布者（publisher）这一步也调整过，官方推荐在 Marketplace 管理页面上创建，命令行子命令是否还保留以官方文档为准。`vsce package` 和 `vsce publish` 这两个核心命令一直都在。

### 申请发布权限

发布到插件市场需要一个发布者账号，背后依赖的是微软的 Azure DevOps（当年叫 Visual Studio Team Services）。完整流程官方文档写得很细：https://code.visualstudio.com/api/working-with-extensions/publishing-extension

大致是这么几步：

Step 1. 在 Azure DevOps 创建一个组织（organization），入口是 https://dev.azure.com/

Step 2. 在个人设置里创建 Personal Access Token

![在 Azure DevOps 个人设置中进入 Personal Access Tokens 页面](https://s.poetries.top/gitee/2021/01/7.png)

![创建 Personal Access Token 的表单，填写名称与有效期](https://s.poetries.top/gitee/2021/01/8.png)

Step 3. 这一步最容易卡住，Organization 一定要选 **All accessible organizations**，Scopes 里勾上 Marketplace 的管理权限。范围选窄了，`vsce publish` 会报 401 之类的鉴权错误，而且错误信息不会告诉你是范围的问题。

![Personal Access Token 的 Organization 需要设置为所有可访问的组织](https://s.poetries.top/gitee/2021/01/9.png)

Step 4. 拿到 token 之后，用它登录发布者身份，之后 `vsce publish` 就能直接推上去了。token 是有有效期的，过期之后重新生成一个换上就行。

### 升级已发布的插件

改完代码，把 `package.json` 里的版本号加一位，再执行一次 `vsce publish` 即可。

也可以让 vsce 帮你改版本号，`vsce publish patch` / `minor` / `major` 会自动递增对应位并发布。注意插件市场不允许覆盖同一个版本号，所以每次发布必须是新版本。

### 本地安装 vsix

不想发到市场，或者想先在本地验证一下打包产物，可以直接安装 `vsce package` 生成的 vsix 文件：

```bash
code --install-extension vsix文件名
```

这条命令在给同事分发内部工具插件的时候很好用，不用走市场审核，把文件发过去就行。

## 六、发布前的 checklist

我自己发布前会过一遍这个清单，前面几条踩过坑才加上的：

- [ ] `name` 全小写、无空格，和 publisher 拼起来的 ID 是你想要的
- [ ] `displayName` 和 `description` 写清楚了，这两项决定用户在市场里第一眼看到什么
- [ ] `categories` 填了准确的分类，不是随手留的 `Other`
- [ ] `engines.vscode` 和你实际用到的 API 匹配，没有虚高也没有虚低
- [ ] `activationEvents` 里没有偷懒写 `*`
- [ ] 所有 `register*` 返回的 disposable 都推进了 `context.subscriptions`
- [ ] Webview 的 `localResourceRoots` 覆盖了全部静态资源目录
- [ ] `acquireVsCodeApi()` 在每个 Webview 里只调了一次
- [ ] 加了 `README.md`，市场详情页直接渲染它，空的会很难看
- [ ] 加了 `icon` 字段和一张图标（建议 128x128 PNG），没有图标的插件点击率明显低
- [ ] 加了 `repository` 字段，方便别人提 issue
- [ ] 写了 `.vscodeignore`，把 `node_modules` 里的开发依赖、测试文件、源码 map 排除掉，vsix 体积能小一大截
- [ ] 用 `vsce package` 打出包，先 `code --install-extension` 本地装一遍验证，再 publish
- [ ] 版本号已经递增，没有和线上已发布的版本重复

最后两条我建议每次都做，本地装一遍能拦掉大部分「开发时好好的、打包后就白屏」的问题，绝大多数是资源路径没打进包里。

## 总结

把整个流程走完，几个能直接带走的结论：

- 环境就三样，VS Code、Node.js、Git，脚手架是 `yo` 加 `generator-code`，`yo code` 生成的骨架已经配好了调试
- 按 F5 会开一个扩展开发宿主窗口，插件跑在里面。编辑窗口调 Node 断点，Webview 走自己的 DevTools，两套链路别搞混
- 贡献点让用户看见入口，激活事件决定什么时候加载你，API 决定你能干什么。三者都在 `package.json` 里有声明，只有 API 在代码里
- 激活事件是懒加载的关键，写 `*` 等于在所有用户的启动时间上收税
- `activate` 只会被调用一次，命令的实际逻辑在 `registerCommand` 的回调里
- 所有 `register*` 返回的 disposable 都要推进 `context.subscriptions`，否则重载会重复注册
- Webview 的 `enableScripts` 默认关闭，`retainContextWhenHidden` 开了会一直占内存，本地资源必须走专门的 URI 转换和 `localResourceRoots` 白名单
- 两侧通信靠 `postMessage` 加 `onDidReceiveMessage`，`acquireVsCodeApi()` 一个 Webview 只能调一次
- 发布走 vsce，卡人的一步基本都是 Personal Access Token 的组织范围没选全

最后再强调一次时效性。这篇写于 2021 年初，VS Code 的 API 和工具链这几年迭代过好几轮，`vsce` 包名、`vscode-resource` 协议、`activationEvents` 的自动推导、测试包的命名空间都有变化。文章里的写法和思路依然成立，但具体的包名、命令和 API 签名请以官方文档为准，别直接照抄版本号。

真正让我觉得值的是，做完一个插件之后你会重新审视自己每天的重复操作。哪些能自动化、哪些能一键完成，这个视角比插件本身更有用。

## 参考

- [vscode API文档](https://code.visualstudio.com/api/references/vscode-api)
- [vscode插件开发文档](https://code.visualstudio.com/api/extension-guides/overview)
- [VS Code 官方 - 你的第一个插件](https://code.visualstudio.com/api/get-started/your-first-extension)
- [VS Code 官方 - Webview API 指南](https://code.visualstudio.com/api/extension-guides/webview)
- [VS Code 官方 - 发布插件](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [VS Code 官方 - 激活事件](https://code.visualstudio.com/api/references/activation-events)
- [VS Code 官方 - 贡献点](https://code.visualstudio.com/api/references/contribution-points)
- [中文文档](https://liiked.github.io/VS-Code-Extension-Doc-ZH/#/get-started/your-first-extension)
- [前端进阶之旅](https://interview.poetries.top)
