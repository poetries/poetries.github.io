---
title: .editorconfig 配了却不生效？把团队缩进和换行一次管住
description: 从查找顺序、通配符和属性优先级讲清 EditorConfig，给出适合前端仓库的完整配置，并说明它与 Prettier、ESLint、Git 的职责边界和排查方法。
date: 2018-01-27 22:48:24
tags:
  - 规范
  - EditorConfig
  - 前端工程化
categories: Front-End
---

> 文章首发于: https://feinterview.poetries.top/blog/editconfig

同一份代码在 macOS 上保存成 `LF`，到了 Windows 变成 `CRLF`；有人用两个空格，有人按一次 Tab；改了一行逻辑，Git 却显示整个文件都变了。这类 diff 最让人头疼，因为 review 看不到真正的业务改动。

`.editorconfig` 就是解决这件事的。它不负责格式化表达式，也不检查代码质量，只把缩进、编码、换行符、文件末尾换行这些最基础的编辑行为写进仓库。规则跟着代码走，团队成员换编辑器也能得到接近的保存结果。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- EditorConfig 到底约束什么，不约束什么
- `.editorconfig` 的查找顺序与覆盖规则
- 前端项目可以直接使用的配置模板
- 通配符和七个常用属性怎么写
- EditorConfig、Prettier、ESLint 与 `.gitattributes` 怎样分工
- 配置没有生效时如何逐层排查
- 老项目第一次接入怎样避免全仓 diff

## 一、EditorConfig 解决的是编辑器差异

EditorConfig 由一套配置文件格式和编辑器插件或内置支持组成。编辑器打开文件时读取 `.editorconfig`，再把匹配到的属性应用到当前文件。

它最适合管理这些事情：

- 使用空格还是 Tab
- 一个缩进占几列
- 文件使用 `LF` 还是 `CRLF`
- 编码是否为 UTF-8
- 保存时是否删除行尾空格
- 文件末尾是否保留换行

它不会替你决定单引号还是双引号，不会把长数组自动换行，也不会发现未使用变量。前两类交给 Prettier，后一类交给 ESLint 或编译器。

先把边界划清楚，工具之间就不会互相打架。

## 二、规则是怎么找到当前文件的

打开一个文件时，EditorConfig 会从文件所在目录开始向父目录查找 `.editorconfig`。遇到文件系统根目录，或遇到包含 `root = true` 的配置就停止。

规则读取有两层优先级：

1. 同一个文件里的 section 从上往下读取，后匹配的属性覆盖前面的属性。
2. 多层目录存在 `.editorconfig` 时，离目标文件更近的配置优先。

假设仓库结构是这样：

```text
project/
├── .editorconfig
├── src/
│   └── app.ts
└── legacy/
    ├── .editorconfig
    └── old.js
```

`src/app.ts` 只受根配置影响，`legacy/old.js` 会先读根配置，再由 `legacy/.editorconfig` 覆盖其中同名属性。多包仓库可以利用这个机制为旧模块保留特殊规则，不必把所有例外堆在根文件里。

## 三、一份适合前端仓库的基础配置

下面这份可以作为起点。它先设置全局默认值，再针对 Markdown 和 Makefile 处理例外。

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab

[*.py]
indent_size = 4

[{package.json,*.yml,*.yaml}]
indent_style = space
indent_size = 2
```

Markdown 单独关闭行尾空格清理，是因为两个行尾空格在 Markdown 里可能代表硬换行。Makefile 必须保留 Tab，强行换成空格会改变语义。Python 常用四空格，所以放在后面的 section 覆盖全局两空格。

我一直觉得，配置越短越好。仓库里没有的语言不要提前写，真正出现例外时再加，后面维护的人才看得懂每条规则为何存在。

## 四、常用属性别配反了

`indent_style` 决定缩进字符，值是 `space` 或 `tab`。`indent_size` 决定每级缩进占几列。设置 Tab 时，如果 `tab_width` 没写，通常会使用 `indent_size`；但团队只想保留真实 Tab、允许成员自行选择显示宽度时，可以不写 `indent_size`。

`end_of_line` 支持 `lf`、`crlf` 和 `cr`。跨平台 Web 项目通常统一成 `lf`，Git diff 会干净很多。

`charset` 常见选择是 `utf-8`。除非兼容历史系统，不建议新项目使用 BOM 或 UTF-16。

`trim_trailing_whitespace = true` 会在保存时删除行尾空格。这个配置对代码文件很合适，对 Markdown 要看团队是否用两个空格表示换行。

`insert_final_newline = true` 表示文件结尾保留一个换行。这里不是额外插入空白行，而是让最后一行以换行符结束。很多命令行工具和补丁格式都期待这个行为。

`root` 不是普通 section 属性，它只能写在文件顶部。设置为 `true` 后，当前目录就是查找边界。

还有一个不太常用但很好使的值是 `unset`。子目录想取消父配置的某个属性时，可以写 `indent_size = unset`，让编辑器回到自己的默认设置。

## 五、通配符怎么匹配

section 名称是区分大小写的文件路径 glob，并且统一使用 `/` 作为分隔符。

| 模式 | 匹配范围 |
|------|----------|
| `*` | 除 `/` 外的任意字符 |
| `**` | 包含目录分隔符的任意字符 |
| `?` | 任意单个字符 |
| `[abc]` | `a`、`b`、`c` 中的一个字符 |
| `[!abc]` | 不属于集合的单个字符 |
| `{js,ts,tsx}` | 任意一个给定字符串 |
| `{1..3}` | 范围内的整数 |

比如下面的规则只覆盖 `lib` 目录及其子目录里的 JavaScript 文件：

```ini
[lib/**.js]
indent_style = space
indent_size = 2
```

这里有个坑要注意。`*` 不会跨过 `/`，要匹配任意深度目录应该用 `**`。规则看着没问题但深层文件不生效，经常就是少了一个星号。

## 六、它和 Prettier、ESLint、Git 怎么分工

四个工具可以同时存在，只要职责没有重叠得太离谱。

| 工具 | 主要职责 | 典型配置 |
|------|----------|----------|
| EditorConfig | 编辑器基础行为 | 缩进、编码、换行、行尾空格 |
| Prettier | 代码排版 | 引号、分号、换行、对象与数组布局 |
| ESLint | 代码质量 | 未使用变量、危险语法、框架规则 |
| `.gitattributes` | Git 检出与入库换行 | `text=auto eol=lf` |

EditorConfig 与 Prettier 都可能碰缩进和换行。项目里已经用 Prettier 时，让两边配置保持一致就行，不要一边两空格、一边四空格。EditorConfig 仍然能覆盖 `.env`、纯文本、配置片段等 Prettier 没处理的文件。

`.gitattributes` 管的是 Git 仓库层面的规范化，EditorConfig 管的是编辑器保存行为。对换行要求严格的跨平台仓库，两者可以一起用。

```gitattributes
* text=auto eol=lf
*.bat text eol=crlf
*.cmd text eol=crlf
```

这段配置让文本文件入库时统一为 `LF`，Windows 批处理文件保留 `CRLF`。它解决 Git 层问题，不能代替编辑器里的缩进设置。

## 七、配置不生效怎么查

碰到某个文件不听话，我通常按这个顺序排：

1. 文件名是不是严格的 `.editorconfig`，有没有被保存成 `.editorconfig.txt`。
2. 当前编辑器是否内置支持，还是需要安装插件并重新加载窗口。
3. section 的 glob 能否匹配目标文件，路径大小写是否一致。
4. 更靠后的 section 有没有覆盖前面的属性。
5. 子目录是否存在另一份 `.editorconfig`。
6. Prettier 或语言扩展是否在保存时再次格式化文件。
7. 文件是否已经带着旧换行，编辑器只对新输入内容应用配置。

VS Code 可以查看右下角的缩进和换行状态，也可以执行「Developer: Inspect Editor Tokens and Scopes」之外的扩展日志来确认插件是否工作。不同插件的诊断入口会变化，最直接的测试仍是新建一个空文件，输入两级缩进并保存，再检查字节和换行。

```bash
# 查看文件类型与换行信息
file src/app.ts

# 检查行尾是否出现 CR 字符
sed -n 'l' src/app.ts | head
```

先在临时文件测试，不要直接拿几千个历史文件试保存。

## 八、老项目接入时别一次改完整仓

`.editorconfig` 加进仓库后，开发者下一次保存可能触发大量空白变化。如果同一个提交里还混着业务逻辑，review 基本没法看。

更稳的做法是分两步：先提交配置文件，让团队确认规则；再用统一工具做一次纯格式迁移，单独提交，并明确说明没有业务变更。迁移期间避免多人同时改同一批文件。

上生产前可以照这份清单检查：

- [ ] 根目录包含 `root = true`
- [ ] Markdown 和 Makefile 的例外已经处理
- [ ] EditorConfig 与 Prettier 的缩进、换行配置一致
- [ ] macOS、Windows 各保存一个测试文件并比较 diff
- [ ] 没有把格式迁移和业务代码混在同一个提交
- [ ] CI 至少检查格式，避免不支持 EditorConfig 的工具写回脏文件

## 总结

EditorConfig 做的事情很小，却正好卡在团队协作最前面。根配置给默认值，后置 section 写例外，离文件更近的配置覆盖父级，这三条弄明白后，绝大多数问题都能定位。

一份基础配置十分钟就能接入。老项目真正需要时间的是清理历史格式，最好拆成独立提交。它不能替代 Prettier 和 ESLint，但能把编辑器差异挡在代码进入 review 之前。

## 参考

- [EditorConfig 官方网站与配置示例](https://editorconfig.org/)
- [EditorConfig 规范](https://spec.editorconfig.org/)
- [Git 官方文档 - gitattributes](https://git-scm.com/docs/gitattributes)
- [前端进阶之旅](https://interview.poetries.top)
