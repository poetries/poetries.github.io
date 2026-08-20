---
title: ESLint 9新特性、重大变化与从8升级的完整攻略
description: ESLint 9 带来了 Flat Config 默认化、格式化程序移除、规则默认行为调整和规则 API 改革。这篇逐项拆解 8 到 9 的全部破坏性变化，附对比表格、迁移步骤和插件兼容方案。
date: 2024-04-28 14:40:12
tags:
- ESLint
- 前端开发
- 代码规范
- Flat Config
- 版本升级
categories: Front-End
---

把一个跑了三年的项目从 ESLint 8 升到 9，第一次 `npx eslint .` 直接吐出一堆红字，说找不到配置文件。项目根目录明明躺着 `.eslintrc.json`，ESLint 就是当没看见。这不是 bug，是 9.0 把默认配置系统整个换掉了。

ESLint 9.0.0 在 2024 年 4 月正式发布，是这个工具历史上改动最大的一次。Flat Config 从可选变成默认，一批格式化程序被踢出核心包，推荐规则集调整，规则 API 也做了破坏性改革。这篇把这些变化逐条拆开，配上 8 和 9 的对比表格，让你知道升级过程中每个报错对应的是哪一项改动。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Node.js 版本要求变化，以及为什么 19.x 被排除在外
- Flat Config 的结构、字段含义与和 eslintrc 的对应关系
- 老项目怎么用 `FlatCompat` 过渡，什么时候该彻底重写配置
- 移除的格式化程序、规则和 context 方法的完整清单
- 规则默认行为的几处静默变化，最容易在升级后误伤代码
- 新增的 `--stats`、`--inspect-config` 和 `loadESLint()` 怎么用
- 写插件的人需要改哪些地方
- 一份可以照着走的六步升级流程

## 一、先确认 Node 版本

升级第一件事不是装 ESLint，是看 Node。

ESLint 9 不再支持 Node.js v18.18.0 以下的版本，也不再支持 v19.x。最低要求是 v18.18.0 或更高。

```bash
# 检查Node.js版本
node -v

# 如果版本过低，需要升级Node.js
nvm install 20
nvm use 20
```

v19 被整个排除掉这件事经常有人问。原因是 Node 的奇数版本号是非 LTS 的短期发布线，19.x 早就过了维护期，ESLint 没有理由为一条已经停止支持的分支付出兼容成本。如果你线上还在跑 v19，升级 ESLint 之前先把 Node 挪到 20 或者 18.18 以上，这一步绕不过去。

版本确认完再装。

```bash
# 安装最新版本的ESLint
npm install eslint@9 --save-dev

# 或指定版本
npm install eslint@9.0.0 --save-dev
```

## 二、Flat Config 是怎么回事

ESLint 9 最大的变化是 Flat Config 成为默认配置格式，原来基于 `.eslintrc.*` 的方式正式被弃用。

新的配置文件名有三种。

- `eslint.config.js`
- `eslint.config.mjs`
- `eslint.config.cjs`

ESLint 会从当前工作目录往上找这三个文件，找不到就报错，而不是回退去读 `.eslintrc.json`。开头那个「找不到配置文件」的报错就是这么来的。

那为什么要换。老的 eslintrc 系统有几个绕不开的设计问题。`extends` 的继承链是字符串解析出来的，你很难知道最终生效的规则是哪一层给的；插件名要遵守 `eslint-plugin-` 前缀约定，ESLint 自己去 `node_modules` 里找，路径解析在 monorepo 里经常出错；`env` 这种预设集合是硬编码在 ESLint 内部的，加一个新环境要改核心代码。

Flat Config 的思路是把这些全部交还给 JS 模块系统。配置文件就是一个导出数组的普通模块，插件是你自己 import 进来的对象，继承就是数组展开，谁覆盖谁一目了然。

### 新配置文件的结构

```javascript
// eslint.config.js
export default [
  {
    name: 'my-configuration',
    files: ['**/*.js'],
    ignores: ['**/dist/**'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        browser: true,
        node: true,
        es2022: true
      }
    },
    linterOptions: {
      noInlineConfig: false,
      reportUnusedDisableDirectives: 'warn'
    },
    plugins: {
      react: reactPlugin
    },
    rules: {
      'no-unused-vars': 'error',
      'react/react-in-jsx-scope': 'off'
    }
  }
];
```

数组里每一项叫一个 config object，ESLint 会按顺序把匹配当前文件的所有配置项合并，后面的覆盖前面的。这个规则很简单，但正是因为简单，你才能靠肉眼推断出最终结果。

各字段的作用整理成表。

| 属性 | 说明 |
|------|------|
| `name` | 配置名称，用于错误消息中识别配置 |
| `files` | glob模式，指定配置适用的文件 |
| `ignores` | glob模式，指定忽略的文件 |
| `languageOptions` | JavaScript语言配置 |
| `linterOptions` | Linter过程相关设置 |
| `plugins` | 插件配置 |
| `rules` | 规则配置 |
| `settings` | 共享设置 |

有个坑要注意。`ignores` 写在带 `files` 的配置项里，只对这一项生效；单独写一个只有 `ignores` 的配置项，才是全局忽略。另外 `.eslintignore` 文件在 Flat Config 下彻底不被读取了，从 8 升上来最容易漏掉这一步，表现是构建产物目录突然开始被 lint，报出成千上万条错误。

用官方推荐规则集的写法也变了。

```javascript
// eslint.config.js
import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn'
    }
  }
]
```

以前写 `extends: ['eslint:recommended']`，现在要装 `@eslint/js` 然后 import 进来。这个包是从 ESLint 核心里拆出去的，装 eslint 时不会自动带上，得单独装。

### 老项目怎么过渡

如果项目庞大到没法一次性重写配置，`@eslint/eslintrc` 提供了 `FlatCompat`，可以把老格式的配置塞进新系统。

```javascript
// eslint.config.js
import { FlatCompat } from '@eslint/eslintrc'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname
})

export default [
  ...compat.extends('standard', 'react'),
  ...compat.env({
    es2022: true,
    node: true
  }),
  ...compat.plugins('react'),
  {
    rules: {
      'semi': 'error'
    }
  }
]
```

`compat.extends()` 对应老的 `extends`，`compat.env()` 对应 `env`，`compat.plugins()` 对应 `plugins` 数组。它做的事情是把老写法翻译成等价的 config object 数组再展开进去。

我的建议是把 `FlatCompat` 当过渡手段而不是终点。它能让你今天就完成升级，但配置的可读性会变差，而且社区的配置包陆续都提供原生 Flat Config 导出之后，留着 compat 层反而是负担。等你依赖的几个 config 包都出了新版本，就该把它拆掉。

如果你想看一份已经完全是 Flat Config 写法、跑在 Next.js 项目上的完整配置，可以看我另一篇 [基于 ESLint 9 配置前端开发规范](https://feinterview.poetries.top/blog/eslint9-nextjs16-setup-guide)，那篇把规则取舍也一条条说了。

## 三、ESLint 8 与 9 的对比清单

这一节是升级时最实用的部分，遇到报错先来这里对一眼。

### 配置方式

| 特性 | ESLint 8 | ESLint 9 |
|------|----------|----------|
| 配置文件 | `.eslintrc.json` | `eslint.config.js` |
| 配置格式 | 对象形式 | 数组形式 |
| 插件引用 | `plugins: ['react']` | `plugins: { react: reactPlugin }` |
| 环境变量 | `env`属性 | `languageOptions.globals` |
| 全局变量 | `globals`属性 | `languageOptions.globals` |
| 推荐规则 | `extends: ['eslint:recommended']` | `js.configs.recommended` |

`env` 这一行的变化影响面最广。以前写 `env: { browser: true }`，ESLint 内部会把浏览器的一整套全局变量塞进来。现在没有这个预设了，要么自己列，要么装 `globals` 这个包，写成 `globals: { ...globals.browser }`。忘了这一步的典型症状是满屏的 `'window' is not defined`。

### API 变化

| 特性 | ESLint 8 | ESLint 9 |
|------|----------|----------|
| 主类 | `ESLint` | `ESLint` (原FlatESLint) |
| 加载配置 | 自动 | `loadESLint()` |
| CLI | `eslint` CLI | `eslint` CLI (默认flat config) |
| 环境变量 | `ESLINT_USE_FLAT_CONFIG=false` | 默认开启 |

`ESLINT_USE_FLAT_CONFIG=false` 这个环境变量是 9.x 留的后门，设了它 ESLint 会退回去读 eslintrc。实在来不及改配置又必须先升 ESLint 的话，可以拿它救一下急，但要清楚这是临时方案，后续大版本会把这条路封掉。

### 移除的格式化程序

| 移除的格式化器 | 替代npm包 |
|----------------|----------|
| `checkstyle` | `eslint-formatter-checkstyle` |
| `compact` | `eslint-formatter-compact` |
| `jslint-xml` | `eslint-formatter-jslint-xml` |
| `junit` | `eslint-formatter-junit` |
| `tap` | `eslint-formatter-tap` |
| `unix` | `eslint-formatter-unix` |
| `visualstudio` | `eslint-formatter-visualstudio` |

保留在核心里的只有 `stylish`、`html`、`json`、`json-with-metadata` 四个。

这条对 CI 影响最大。很多流水线用 `--format junit` 把结果喂给测试报告系统，升级之后直接报找不到 formatter，构建全红。改法很简单，把对应的 `eslint-formatter-*` 包装上就行，用法不变。踩到这个坑的人特别多，因为本地跑 lint 用的是默认 `stylish`，根本发现不了。

### 移除的规则

| 移除的规则 | 替代方案 |
|------------|----------|
| `valid-jsdoc` | 使用 `eslint-plugin-jsdoc` |
| `require-jsdoc` | 使用 `eslint-plugin-jsdoc` |

这两条本来就长期处于弃用状态，JSDoc 相关的检查交给专门的插件做更合适。

### 命令行参数

| 特性 | ESLint 8 | ESLint 9 |
|------|----------|----------|
| 无文件参数 | 报错 | 默认lint当前目录 |
| `--quiet` | 只隐藏warning | 不执行warn级别规则 |
| `--output-file` 空输出 | 不写入文件 | 写入空文件 |

`--quiet` 的变化值得单独说。以前它只是把 warning 从输出里过滤掉，规则该跑还是跑；现在是直接不执行 warn 级别的规则。好处是 `--quiet` 变快了，坏处是如果你有规则依赖执行副作用，行为会变。日常用不太会碰到，但写自定义规则的人要留意。

另外像 `--rulesdir`、`--resolve-plugin-relative-to` 这类为 eslintrc 设计的参数，在 Flat Config 下已经没有对应概念，规则和插件都通过 import 引入。不同 9.x 小版本对个别参数的处理有过调整，具体以你装的版本 `npx eslint --help` 输出为准。

### 规则默认行为

| 规则 | ESLint 8 | ESLint 9 |
|------|----------|----------|
| `no-inner-declarations` | 块内函数声明报警告 | ES2015+块级函数不再警告 |
| `no-useless-computed-key` | 类成员默认关闭 | `enforceForClassMembers`默认为true |
| `no-unused-vars` | `caughtErrors`默认为none | 默认为all |
| `no-implicit-coercion` | 部分场景检查 | 新增更多检查场景 |

这一组是最阴险的，因为它们不会让你的配置报错，只会让 lint 结果悄悄变多或变少。`no-unused-vars` 的 `caughtErrors` 改成 `all` 之后，所有 `catch (e) {}` 里没用到 `e` 的地方全都会报错，老项目里这种写法能有几十上百处。

### 内联注释

| 特性 | ESLint 8 | ESLint 9 |
|------|----------|----------|
| 同一规则多个`/* eslint */` | 最后一个生效 | 第一个生效，其他报lint错误 |
| 仅严重性注释 | 忽略其他配置选项 | 保留配置文件中的选项 |

第一条从「静默覆盖」改成了「直接报错」，我觉得这个改得对。以前同一个文件里写了两次 `/* eslint no-console: off */`，你完全不知道哪个生效，现在会明确告诉你重复了。

## 四、新增的几个能力

### no-useless-assignment 规则

检测变量赋值之后从未被读取的情况。

```javascript
let id = 1234;      // 1234 永远不会被使用
id = calculateId();  // 变量被重新赋值
```

这条和 `no-unused-vars` 的区别在于，`no-unused-vars` 管的是变量整个没被用过，而这条管的是「赋了一个后来被覆盖掉、中间从没读过」的值。这种代码通常是重构留下的残渣，删掉不影响逻辑。

### 性能统计 --stats

```bash
npx eslint --stats src/
```

`--stats` 会在结果里带上每条规则的执行耗时和调用次数。lint 变慢的时候拿它定位最有效，一般会发现是某一条依赖类型信息的规则吃掉了大部分时间。要看清楚数据建议配合 `--format json`，默认的 `stylish` 展示得比较有限。

### 配置检查器 --inspect-config

```bash
npx eslint --inspect-config
```

这条会启动一个本地的可视化界面，让你看到配置数组最终合并出来的结果，某个文件命中了哪几个 config object、每条规则的最终值来自哪一项。前面说 Flat Config 的优势是「谁覆盖谁一目了然」，这个工具就是把那句话落到实处的地方。配置写复杂之后，跑一次它比逐行读代码快得多。

### loadESLint() API

```javascript
import { loadESLint } from 'eslint'

const eslint = await loadESLint()
const lazyLinter = new eslint.LegacyESLint({ overrideConfigFile: true })
```

这个 API 是给要同时兼容两套配置系统的工具作者用的。它会根据当前环境返回合适的 ESLint 类，普通业务项目基本用不到，但如果你在写 IDE 插件或者构建工具集成，需要它来做版本适配。

## 五、几条规则的具体变化

### no-inner-declarations

ESLint 9 之前，块内的函数声明会被警告。从 9 开始，ES2015 及以后的块级函数声明不再被视为问题。

```javascript
// ESLint 9中不再报错
if (true) {
  function foo() { }  // 合法
}
```

这个调整是跟着规范走的。ES2015 给块级函数声明定了明确的语义，在严格模式下它的作用域就是块，不再有以前那种被提升到函数顶部的怪行为，所以没必要继续报警。

### no-useless-computed-key

`enforceForClassMembers` 的默认值从 `false` 变成了 `true`。

```javascript
// ESLint 9中会报错
class Foo {
  [key] = 'value';
}
```

写类字段的时候用了不必要的计算属性名会被抓出来。升级后如果你的类里有大量这种写法，可以先把这个选项显式设回 `false`，改完再打开。

### no-unused-vars

这条改动最多，列一下。

- `caughtErrors` 默认值从 `"none"` 变为 `"all"`
- `varsIgnorePattern` 不再适用于 catch 参数
- 新增 `ignoreClassWithStaticInitBlock` 选项
- 新增 `reportUsedIgnorePattern` 选项

前两条是配套的。以前你可以靠 `varsIgnorePattern: '^_'` 让 `catch (_e)` 不报错，现在这个模式对 catch 参数不生效了，要用专门的 `caughtErrorsIgnorePattern`。升级后满屏 catch 报错的话，问题就出在这里。

### complexity

现在计算圈复杂度时会把可选链和解构参数的默认值也算进去。

```javascript
// 复杂度计算包含可选链
const a = obj?.b?.c?.d?.e;
```

这个改法是合理的，`?.` 每一层都是一个隐含的分支判断。副作用是如果你设了 `complexity: ['error', 10]`，升级后一些原本刚好卡在阈值内的函数会开始报错。要么改代码，要么把阈值调高一点再慢慢收。

## 六、写插件的人要改什么

如果你只是用 ESLint，这一节可以跳过。维护插件或者项目里有自定义规则的话，下面几条是必须改的。

### 函数式规则不再工作

规则必须用对象形式并导出 `create()` 方法。

```javascript
// ESLint 9 - 正确写法
module.exports = {
  meta: { type: 'suggestion' },
  create(context) {
    return {
      // 规则逻辑
    }
  }
}

// ESLint 9 - 错误写法（不再支持）
module.exports = function(context) {
  return {
    // 规则逻辑
  }
}
```

函数式写法是 ESLint 很早期留下来的，一直兼容到 8.x。9 里彻底移除之后，老插件如果没更新，加载时就会直接抛错。

### 规则必须声明 meta.schema

没有声明 schema 的规则会默认应用空 schema，也就是「不接受任何选项」。这时候如果配置里给它传了选项，ESLint 会报错。老规则如果本来就支持选项但没写 schema，升级后会直接不能用。

### context 上的方法搬家了

- `context.getScope()` 改用 `SourceCode.getScope()`
- `context.getAncestors()` 已移除
- `context.markVariableAsUsed()` 改用 `SourceCode.markVariableAsUsed()`
- `context.getDeclaredVariables()` 改用 `SourceCode.getDeclaredVariables()`

这一批调整的方向是把和源码分析相关的能力都收拢到 `SourceCode` 对象上，`context` 只保留配置和上报相关的职责。职责划分确实更清晰了，代价是所有自定义规则都要改一遍。

### 用 @eslint/compat 兜底

依赖的第三方插件还没适配的话，官方提供了兼容工具。

```bash
npm install @eslint/compat --save-dev
```

```javascript
// eslint.config.js
import { fixupPluginRules } from '@eslint/compat'
import example from 'eslint-plugin-example'

export default [
  {
    plugins: {
      example: fixupPluginRules(example)
    }
  }
]
```

`fixupPluginRules` 会把插件里老写法的规则包一层，补上缺失的 `meta` 并把 `context` 上被移除的方法代理回去。它是权宜之计，插件更新之后应该拆掉。

## 七、照着走的六步升级流程

前面讲了这么多变化，实际操作时按下面的顺序来会顺一些。

**Step 1 升级 Node.js**。确保版本不低于 v18.18.0，并且不是 19.x。这一步不做，后面全是白搭。

**Step 2 升级 ESLint 本体**。

```bash
npm install eslint@9 --save-dev
npm install @eslint/js --save-dev
```

`@eslint/js` 别忘了，官方推荐规则集在它里面。

**Step 3 创建新配置文件**。把 `.eslintrc.json` 翻译成 `eslint.config.js`。

```javascript
// eslint.config.js
import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off'
    }
  }
]
```

同时把 `.eslintignore` 的内容搬进配置里的 `ignores` 字段，老文件可以删了。

**Step 4 处理插件兼容**。跑一次 lint，看哪些插件加载失败。

```bash
npm install @eslint/compat --save-dev
```

能升到支持 Flat Config 的新版本就升，升不了的用 `fixupPluginRules` 包一层。

**Step 5 更新 package.json**。

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

注意命令里不需要再写 `--ext .js,.ts` 了，文件范围由配置里的 `files` 决定。CI 里如果用了非默认 formatter，记得把对应的 `eslint-formatter-*` 包加进依赖。

**Step 6 迁移社区规范**。用了 `eslint-config-standard` 这类社区配置的，看它有没有出 Flat Config 版本，没有就先用 `FlatCompat` 顶着。

```javascript
import { FlatCompat } from '@eslint/eslintrc'
import standard from 'eslint-config-standard'

const compat = new FlatCompat()

export default [
  ...compat.config(standard)
]
```

走完六步之后建议跑一次 `npx eslint --inspect-config` 核对最终规则，再跑一次全量 lint 看错误数量。如果错误数比升级前多出一大截，八成是 `no-unused-vars` 的 `caughtErrors` 或者 `.eslintignore` 没搬这两件事之一。

## 总结

ESLint 9 这次升级的难点不在于新东西多，而在于变化分布得很散。配置系统换了、格式化程序搬到独立包了、几条规则的默认值悄悄改了、插件 API 也动了，每一项单独看都不复杂，凑在一起就容易让人不知道从哪下手。

按影响大小排个序的话，最先要处理的是 Flat Config 迁移和 `.eslintignore` 的搬家，这两件不做 lint 根本跑不起来。其次是 CI 里的 formatter 依赖，这个本地发现不了，只会在流水线上炸。再往后才是规则默认行为变化带来的新报错，这些可以慢慢改，实在赶时间就先把对应选项显式设回老值。

对多数项目来说迁移是能平滑完成的，卡住的通常是那些依赖了长期没更新的第三方插件的仓库，`@eslint/compat` 能顶一阵子，但根本解法还是等插件跟上或者换掉。

真要说这次升级带来了什么，我的感受是配置终于变成了可以用读代码的方式理解的东西，不用再靠猜继承链了。

## 参考

- [ESLint 9.0.0 发布公告](https://eslint.org/blog/2024/04/eslint-v9.0.0-released/)
- [ESLint 官方迁移指南](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [ESLint 兼容性工具](https://eslint.org/blog/2024/05/eslint-compatibility-utilities/)
- [Flat Config 配置文件文档](https://eslint.org/docs/latest/use/configure/configuration-files)
- [前端进阶之旅](https://interview.poetries.top)
