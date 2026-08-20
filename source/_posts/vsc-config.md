---
title: VS Code 配置越堆越乱？一套能跟团队共享的整理方法
description: 从用户设置与工作区设置的边界出发，整理 VS Code 配置、扩展推荐、格式化器、字体和设置同步，附可直接使用的 settings.json 与排错清单。
date: 2018-02-02 11:40:43
tags:
  - VS Code
  - 开发工具
  - 前端工程化
categories: Tools
---

> 文章首发于: https://feinterview.poetries.top/blog/vsc-config

VS Code 用久之后很容易变成另一种状态，扩展装了几十个，`settings.json` 从旧电脑复制到新电脑，保存时三个格式化器轮流抢活。编辑器确实更顺手了，可一旦换项目或换机器，很多配置已经说不清为什么存在。

我自己的整理原则是把个人偏好和项目约束分开。字体、主题、光标属于个人设置；格式化器、文件排除、语言覆盖更适合工作区设置。扩展只留下能解释用途的那一批，失效字段及时删除。这样配置才是工具，不是历史遗迹。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 用户设置、工作区设置与语言设置的覆盖关系
- 一份前端开发可直接使用的基础配置
- 扩展怎样按能力分类，避免重复安装
- 保存格式化冲突应该如何排查
- Fira Code 字体与连字怎样启用
- 哪些配置适合提交到仓库
- 换电脑时如何使用 Settings Sync

## 一、先分清三层设置

VS Code 的用户设置对所有窗口生效，工作区设置只对当前项目生效，并且会覆盖用户设置。打开单文件夹项目时，工作区配置位于 `.vscode/settings.json`；多根工作区则写在 `.code-workspace` 文件中。

语言专属配置会继续覆盖通用配置。例如团队希望 JavaScript 用 Prettier，Markdown 不在保存时格式化，可以这样写：

```json
{
  "editor.formatOnSave": true,
  "[javascript][typescript][typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.formatOnSave": false
  }
}
```

字体大小、主题和侧边栏位置不要提交到项目，它们不影响产物。默认格式化器、文件关联和测试目录排除可以提交，因为这些配置能减少团队成员保存后的无意义 diff。

## 二、常用扩展先按用途去重

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

这份清单来自早期使用记录，其中不少能力已经被 VS Code 内置，或者被语言官方扩展替代。现在挑扩展时我会先问三个问题，它有没有与内置能力重复、项目是否真的使用对应语言、维护状态是否正常。

同类扩展只留一个。图标主题装一个就够，代码片段不要同时装三套，格式化也应为每种语言指定唯一的 `editor.defaultFormatter`。扩展越多，启动、索引和冲突排查的成本越高。

更稳的分组方式如下：

- 语言能力：项目实际使用的 Vue、Python、Rust 等官方或主流语言扩展
- 代码质量：ESLint、Stylelint、Prettier
- Git：内置 Source Control 不够时再加 GitLens
- 运行调试：项目需要的测试适配器、容器或远程开发扩展
- 体验增强：主题、图标、路径补全，严格控制数量

## 三、一份可维护的基础配置

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

旧配置里有些字段来自已卸载扩展，有些字段已经改名。直接复制整份配置很容易出现「Unknown Configuration Setting」。更建议从下面这份基础配置开始，再按当前项目加字段：

```json
{
  "editor.fontSize": 16,
  "editor.lineHeight": 24,
  "editor.fontFamily": "Fira Code, Menlo, Monaco, monospace",
  "editor.fontLigatures": true,
  "editor.minimap.enabled": true,
  "editor.rulers": [100],
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true,
  "[markdown]": {
    "files.trimTrailingWhitespace": false
  },
  "[javascript][typescript][javascriptreact][typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

`source.fixAll.eslint` 使用 `explicit` 后，显式保存会执行 ESLint 修复，Auto Save 不会频繁改写文件。Markdown 关闭行尾空格清理，是为了保留可能用于硬换行的两个空格。

这里有个坑要注意。工作区已经配置 `.editorconfig` 或 Prettier 时，VS Code 自身的 `tabSize`、引号和换行配置可能被覆盖。看到保存结果不符合 `settings.json`，不要马上重装扩展，先检查仓库里的格式化配置。

## 四、保存时三个工具打架怎么查

典型现象是保存后代码闪两次，或者 Prettier 刚改完，ESLint 又报格式错误。排查时一次只留一个动作：

1. 执行 `Format Document With...`，确认当前文件使用哪个格式化器。
2. 通过 `Configure Default Formatter...` 为该语言指定唯一工具。
3. 暂时关闭 `editor.codeActionsOnSave`，判断是不是 ESLint 二次改写。
4. 查看 Output 面板里的 Prettier 和 ESLint 日志。
5. 检查工作区设置是否覆盖用户设置。

Prettier 管排版，ESLint 管质量，两边再配 `eslint-config-prettier` 关闭冲突规则，通常最省心。不要同时启用 Beautify、Prettier 和语言扩展自带格式化。

## 五、字体与连字只是个人偏好

> 参考这里配置 https://github.com/tonsky/FiraCode

Fira Code 会把 `=>`、`!==` 等字符组合显示为连字，但源文件里的字符并没有改变。安装字体后，`editor.fontFamily` 必须写到正确的字体名称，`editor.fontLigatures` 设为 `true`。

如果连字没有出现，先确认系统字体册能找到 Fira Code，再用开发者工具检查编辑器实际使用的字体。远程桌面或 Web 版 VS Code 使用的是运行浏览器设备上的字体，不是远端服务器的字体。

这类配置适合放在用户设置，不该提交进项目。团队没有必要为同一套字体达成一致。

## 六、项目里应该提交哪些 VS Code 文件

`.vscode` 不需要整目录忽略，也不需要什么都提交。常见做法是只提交能帮助项目协作的文件：

- `settings.json` 保存项目级格式化与文件排除
- `extensions.json` 推荐必要扩展，不强制安装
- `launch.json` 保存可复用的调试入口
- `tasks.json` 保存构建、测试等标准任务

推荐扩展应保持克制。ESLint、项目语言扩展可以推荐，主题和图标不该塞给所有成员。

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "editorconfig.editorconfig"
  ]
}
```

扩展 ID 可以从扩展详情页复制。团队移除 ESLint、Prettier 这类协作工具时，也要同步删除推荐项和对应设置。

## 七、换机器优先用 Settings Sync

VS Code 自带 Settings Sync，可同步设置、快捷键、代码片段、任务、UI 状态和扩展。它适合个人设备之间迁移，不等于项目配置。项目约束仍然应该进入仓库，个人偏好再交给同步功能。

同步前先清理一次配置。把旧插件留下的未知字段带到每台机器，只会让问题扩散。敏感 Token 也不要直接写入 `settings.json`，扩展需要凭证时优先使用系统密钥存储或环境变量。

上生产前可以用这份清单做一次整理：

- [ ] 每种语言只有一个默认格式化器
- [ ] 保存动作不会重复运行格式化与修复
- [ ] 用户偏好没有进入项目工作区配置
- [ ] `.vscode/extensions.json` 只推荐项目必需扩展
- [ ] `settings.json` 中没有 Token、账号或本机绝对路径
- [ ] 未知配置字段已经删除

## 总结

VS Code 配置真正难的不是字段多，而是作用域和工具职责混在一起。用户设置保留个人偏好，工作区设置保存项目约束，语言配置处理局部覆盖，每种语言只选一个格式化器，基本就能避开大多数冲突。

整理一套旧配置通常需要 20 到 30 分钟。不要追求一次装齐所有扩展，先保证保存、Lint、调试三条主链路稳定，剩下的体验增强用到再加。

## 参考

- [VS Code 官方文档 - User and workspace settings](https://code.visualstudio.com/docs/configure/settings)
- [VS Code 官方文档 - Workspaces](https://code.visualstudio.com/docs/editing/workspaces/workspaces)
- [VS Code 官方文档 - Settings Sync](https://code.visualstudio.com/docs/configure/settings-sync)
- [Fira Code](https://github.com/tonsky/FiraCode)
- [前端进阶之旅](https://interview.poetries.top)
