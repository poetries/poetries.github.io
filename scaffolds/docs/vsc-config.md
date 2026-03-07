---
title: VS Code折腾记
date: 2018-02-02 11:40:43
tags: VS Code
categories: Tools
---

## VS Code常用插件

- `Auto Close Tag` （自动关闭HTML标签）
- `Auto Rename Tag` (HTML标签自动改名)
- `Babel ES6/ES7` 
- `Beautify css/sass/scss/less`
- `Brackets Light` (主题)
- `Complete JSDoc Tags` (js文档注释提示)
- `Git History` (查看git提交记录)
- `HTML CSS Support` (HTML中提示可用的class)
- `npm Intellisense` (提示可以require的模块名称)
- `One Dark Theme` (主题)
- `Path Intellisense` (路径补全)
- `Reactjs code snippets` (reactjs代码提示)
- `Sass`
- `SCSS IntelliSense Preview`  SCSS智能提醒，配置强大
- `Sublime Babel`
- `VSCode Great Icons` (文件图标)
- `vscode-icons` （文件图标）
- `Beautify` - HTML、CSS、JS、JSON语法高亮
- `Guides` - 代码对齐辅助线
- `OneDark`主题
- `JavaScript (ES6) Code Snippets` (代码片段插件)
- `Project Manager` (项目管理器插件) 简单的项目管理器,可以在你的编辑器中快速切换项目
- `Sync Settings` (设置同步插件)在电脑上移植你的插件和设置是轻而易举的事
- `Git History` (`Git` 历史记录插件) 可视化的 `Git` 历史记录插件
- `Document This` (`JSDoc`注释插件)
- `npm Intellisense` (npm 模块导入插件)
- `Align` (代码对齐插件)
- `amVim` (`vim` 插件)
- `Faker` 可以生成随机的名称，地址，图像，电话号码
- `Color Info` 颜色信息及转换 
- `SVG Viewer SVG `预览
- `TODO Highlight` TODO 高亮
- `Minify` 代码压缩 
- `Regex Previewer` 正则表达式预览
- `File Tree View`  提供几个常见编程语言的函数或状态的树集合展示,可以快速点击跳转!
- `JavaScript Test Runner Preview` 快速执行单元测试,支持 `Mocha` 和 `Jest`
- `NPM-Scripts` 在侧边栏可视化执行 `npm` 命令(项目内的 `package.json`)
- `colorize`会给颜色代码增加一个当前匹配代码颜色的背景
- `vscode-fake`------生成各种假数据类型。（姓名，电话）
- `vscode-CSS Peek`------`class`类定义跳转
- `vscode-Git Lens`-----增强`vscode`的`git`管理工具
- `vscode-Live Server`-----`http`服务器（相当于使用`nodejs`的`http-server` ）
- `EditorConfig for VS Code EditorConfig` 插件
- `Emoji` 在代码中输入`emoji`
- `File Peek` 根据路径字符串，快速定位到文件
- `Font-awesome codes for html FontAwesome`提示代码段
- `Guides` 高亮缩进基准线
- `JavaScript (ES6) code snippets ES6`语法代码段
- `language-stylus Stylus`语法高亮和提示
- `Lodash Lodash`代码段
- `Prettify JSON` 格式化`JSON`
- `Test Spec Generator` 测试用例生成（支持`chai`、`should`、`jasmine`）
- `vetur` 目前比较好的`Vue`语法高亮
- `cssrem` css值转rem插件
- `polacode` 代码截图工具

## 配置

```json
{
    "workbench.activityBar.visible": true,
    "workbench.iconTheme": "vscode-icons",
    "window.menuBarVisibility": "default",
    "editor.minimap.enabled": true,
    "cssrem.rootFontSize": 75,
    "workbench.colorTheme": "Atom One Dark",
    "editor.fontSize": 16,
    "liveServer.settings.donotShowInfoMsg": true,
    "editor.cursorStyle": "block",
    "editor.fontFamily": "Fira Code",
    "editor.fontLigatures": true,
    "editor.lineHeight": 24,
    "editor.lineNumbers": "on",
    "editor.rulers": [
        120
    ],
    "auto-close-tag.SublimeText3Mode": true,
    "vsicons.dontShowNewVersionMessage": true,
    "[javascript]": {
        
    },
    "window.zoomLevel": 0,
    "javascript.implicitProjectConfig.experimentalDecorators": true,
    "Scss2Css.compileAfterSave": true,
    "fileheader.Author": "poetryxie",
    "fileheader.LastModifiedBy": "poetryxie",
    "todohighlight.isEnable": false,
    "workbench.startupEditor": "newUntitledFile",
    "explorer.confirmDragAndDrop": false,
    "gitlens.advanced.messages": {
        "suppressCommitHasNoPreviousCommitWarning": false,
        "suppressCommitNotFoundWarning": false,
        "suppressFileNotUnderSourceControlWarning": false,
        "suppressGitVersionWarning": false,
        "suppressLineUncommittedWarning": false,
        "suppressNoRepositoryWarning": false,
        "suppressUpdateNotice": false,
        "suppressWelcomeNotice": true
    }
}
```

## 字体美化

> 参考这里配置 https://github.com/tonsky/FiraCode