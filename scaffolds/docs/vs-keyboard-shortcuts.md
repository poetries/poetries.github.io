---
title: Visual Studio Code 常用快捷键
date: 2017-07-23 19:40:03
tags: VS
categories: 工欲善其事必先利其器
---

### 主命令框

> `F1` 或 `Ctrl+Shift+P`: 打开命令面板。在打开的输入框内，可以输入任何命令
- 按一下 `Backspace `会进入到 `Ctrl+P `模式
在 
- `Ctrl+P` 下输入 > 可以进入 `Ctrl+Shift+P` 模式

**在 `Ctrl+P` 窗口下还可以**

- 直接输入文件名，跳转到文件
- `?` 列出当前可执行的动作
- ! 显示 `Errors`或 `Warnings`，也可以 `Ctrl+Shift+M`
- : 跳转到行数，也可以 `Ctrl+G` 直接进入
- @ 跳转到 `symbol`（搜索变量或者函数），也可以 `Ctrl+Shift+O `直接进入
- @ 根据分类跳转 - `symbol`，查找属性或函数，也可以 `Ctrl+Shift+O `后输入:进入
- #根据名字查找 `symbol`，也可以 `Ctrl+T`


### 编辑器与窗口管理

- 打开一个新窗口： `Ctrl+Shift+N`
- 关闭窗口： `Ctrl+Shift+W`
- 新建文件 `Ctrl+N`
- 文件之间切换 `Ctrl+Tab`



### 代码编辑

#### 格式调整

- 代码行缩进 `Ctrl+[` 、 `Ctrl+]`
- `Ctrl+C `、 `Ctrl+V` 复制或剪切当前行/当前选中内容
- 代码格式化： `Ctrl+Shift+P` 后输入 `format code`
- 上下移动一行：` Alt+Up `或 `Alt+Down`
- 向上向下复制一行： `Shift+Alt+Up `或 `Shift+Alt+Down`
- 在当前行下边插入一行 `Ctrl+Enter`
- 在当前行上方插入一行 `Ctrl+Shift+Enter`

#### 光标相关


- 移动到行首： `Home`
- 移动到行尾： `End`
- 移动到文件结尾： `Ctrl+End`
- 移动到文件开头： `Ctrl+Home`
- 移动到定义处： `F12`
- 多行编辑(列编辑)：`Alt+Shift+`鼠标左键
- 同时选中所有匹配： `Ctrl+Shift+L`

### 重构代码


- 找到所有的引用： `Shift+F12`
- 同时修改本文件中所有匹配的： `Ctrl+F12`
- 重命名：比如要修改一个方法名，可以选中后按 `F2`，输入新的名字，回车，会发现所有的文件都修改了
- 跳转到下一个 `Error` 或 `Warning`：当有多个错误时可以按 `F8` 逐个跳转

### 查找替换

- 查找 `Ctrl+F`
- 查找替换 `Ctrl+H`
- 整个文件夹中查找 `Ctrl+Shift+F`

### 显示相关


- 全屏：`F11`
- 侧边栏显/隐：`Ctrl+B`
- 显示资源管理器 `Ctrl+Shift+E`
- 显示搜索 `Ctrl+Shift+F`
- 显示 `Debug Ctrl+Shift+D`

