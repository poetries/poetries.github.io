---
title: "ESLint 9完全指南：新特性、重大变化与升级攻略"
date: 2024-04-28 14:40:12
description: 深入解析ESLint 9带来的所有变化，包括Flat Config新配置格式、移除的格式化程序、新规则、API变化等，并提供ESLint 8到9的升级对比表格。
tags:
- ESLint
- 前端开发
- 代码规范
- Flat Config
categories: Front-End
---

ESLint 9.0.0于2024年4月正式发布，这是ESLint历史上最重要的版本迭代之一。ESLint 9带来了全新的配置系统（Flat Config）、移除了大量废弃的格式化程序、更新了推荐规则集，并对规则API进行了重大改革。

本文将全面解析ESLint 9的所有重要变化，并提供ESLint 8到9的详细升级对比表格，帮助你顺利迁移到新版本。

## 一、安装与环境要求

### Node.js版本要求

ESLint 9不再支持Node.js v18.18.0以下的版本，也不再支持v19.x。最低要求为Node.js v18.18.0或更高版本。

```bash
# 检查Node.js版本
node -v

# 如果版本过低，需要升级Node.js
nvm install 20
nvm use 20
```

### 安装ESLint 9

```bash
# 安装最新版本的ESLint
npm install eslint@9 --save-dev

# 或指定版本
npm install eslint@9.0.0 --save-dev
```

## 二、Flat Config：全新配置系统

### 什么是Flat Config

ESLint 9最重要的变化是Flat Config（平面配置）成为默认配置格式。原来基于`.eslintrc.*`的配置方式正式被弃用。

新的配置文件格式为：

- `eslint.config.js`
- `eslint.config.mjs`
- `eslint.config.cjs`

### 新配置文件结构

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

### 配置项说明

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

### 使用官方推荐配置

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

### 兼容旧版配置

如果项目庞大无法立即迁移到Flat Config，可以使用`@eslint/eslintrc`包来兼容旧配置：

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

## 三、ESLint 8 vs ESLint 9 升级对比

### 配置方式对比

| 特性 | ESLint 8 | ESLint 9 |
|------|----------|----------|
| 配置文件 | `.eslintrc.json` | `eslint.config.js` |
| 配置格式 | 对象形式 | 数组形式 |
| 插件引用 | `plugins: ['react']` | `plugins: { react: reactPlugin }` |
| 环境变量 | `env`属性 | `languageOptions.globals` |
| 全局变量 | `globals`属性 | `languageOptions.globals` |
| 推荐规则 | `extends: ['eslint:recommended']` | `js.configs.recommended` |

### API变化对比

| 特性 | ESLint 8 | ESLint 9 |
|------|----------|----------|
| 主类 | `ESLint` | `ESLint` (原FlatESLint) |
| 加载配置 | 自动 | `loadESLint()` |
| CLI | `eslint` CLI | `eslint` CLI (默认flat config) |
| 环境变量 | `ESLINT_USE_FLAT_CONFIG=false` | 默认开启 |

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

保留的格式化器：`stylish`、`html`、`json`、`json-with-metadata`

### 移除的规则

| 移除的规则 | 替代方案 |
|------------|----------|
| `valid-jsdoc` | 使用 `eslint-plugin-jsdoc` |
| `require-jsdoc` | 使用 `eslint-plugin-jsdoc` |

### 命令行参数变化

| 特性 | ESLint 8 | ESLint 9 |
|------|----------|----------|
| 无文件参数 | 报错 | 默认lint当前目录 |
| `--quiet` | 只隐藏warning | 不执行warn级别规则 |
| `--output-file` 空输出 | 不写入文件 | 写入空文件 |

### 规则默认行为变化

| 规则 | ESLint 8 | ESLint 9 |
|------|----------|----------|
| `no-inner-declarations` | 块内函数声明报警告 | ES2015+块级函数不再警告 |
| `no-useless-computed-key` | 类成员默认关闭 | `enforceForClassMembers`默认为true |
| `no-unused-vars` | `caughtErrors`默认为none | 默认为all |
| `no-implicit-coercion` | 部分场景检查 | 新增更多检查场景 |

### 内联注释变化

| 特性 | ESLint 8 | ESLint 9 |
|------|----------|----------|
| 同一规则多个`/* eslint */` | 最后一个生效 | 第一个生效，其他报lint错误 |
| 仅严重性注释 | 忽略其他配置选项 | 保留配置文件中的选项 |

## 四、新增功能

### 新规则：no-useless-assignment

检测变量赋值后从未使用的情况：

```javascript
let id = 1234;      // 1234 永远不会被使用
id = calculateId();  // 变量被重新赋值
```

### 性能统计

使用`--stats`标志可以在格式化输出中获取规则性能信息：

```bash
npx eslint --stats src/
```

### 配置检查器

使用`--inspect-config`标志查看配置详情：

```bash
npx eslint --inspect-config
```

### loadESLint() API

新增`loadESLint()`函数用于获取ESLint类：

```javascript
import { loadESLint } from 'eslint'

const eslint = await loadESLint()
const lazyLinter = new eslint.LegacyESLint({ overrideConfigFile: true })
```

## 五、规则变化详解

### no-inner-declarations

ESLint 9之前，块内的函数声明会被警告。从ESLint 9开始，ES2015+的块级函数声明不再被视为错误：

```javascript
// ESLint 9中不再报错
if (true) {
  function foo() { }  // 合法
}
```

### no-useless-computed-key

`enforceForClassMembers`选项默认值从`false`变为`true`：

```javascript
// ESLint 9中会报错
class Foo {
  [key] = 'value';
}
```

### no-unused-vars

- `caughtErrors`默认值从`"none"`变为`"all"`
- `varsIgnorePattern`不再适用于catch参数
- 新增`ignoreClassWithStaticInitBlock`选项
- 新增`reportUsedIgnorePattern`选项

### complexity规则

现在还考虑可选链和解构参数中的默认值：

```javascript
// 复杂度计算包含可选链
const a = obj?.b?.c?.d?.e;
```

## 六、插件开发者注意

### 规则写法变化

1. **函数式规则不再工作**：必须使用对象形式并导出`create()`方法

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

2. **规则必须声明meta.schema**

没有schema的规则默认应用空schema，传入选项会报错。

### context方法变化

移除的`context`方法：

- `context.getScope()` → 使用`SourceCode.getScope()`
- `context.getAncestors()` → 已移除
- `context.markVariableAsUsed()` → 使用`SourceCode.markVariableAsUsed()`
- `context.getDeclaredVariables()` → 使用`SourceCode.getDeclaredVariables()`

### 使用兼容性工具

安装`@eslint/compat`包处理未更新的插件：

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

## 七、升级步骤

### 1. 升级Node.js

确保Node.js版本 >= v18.18.0

### 2. 升级ESLint

```bash
npm install eslint@9 --save-dev
npm install @eslint/js --save-dev
```

### 3. 创建新配置文件

将`.eslintrc.json`转换为`eslint.config.js`：

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

### 4. 处理插件兼容

如果使用第三方插件，安装兼容包：

```bash
npm install @eslint/compat --save-dev
```

### 5. 更新package.json

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

### 6. 迁移社区规范

如果使用`eslint-config-standard`等社区规范，需要等待更新或使用`FlatCompat`：

```javascript
import { FlatCompat } from '@eslint/eslintrc'
import standard from 'eslint-config-standard'

const compat = new FlatCompat()

export default [
  ...compat.config(standard)
]
```

## 八、总结

ESLint 9是一次重大版本更新，核心变化包括：

- **Flat Config**：全新的配置系统，配置更灵活
- **移除格式化程序**：推荐使用Prettier
- **规则API更新**：为多语言支持铺路
- **性能提升**：更好的性能统计和优化

建议尽快规划升级计划，享受新版本带来的改进。多数项目应该可以平滑迁移，部分使用旧版插件的项目可能需要等待插件更新。

## 参考资料

- [ESLint 9.0.0发布公告](https://eslint.org/blog/2024/04/eslint-v9.0.0-released/)
- [ESLint官方迁移指南](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [ESLint兼容性工具](https://eslint.org/blog/2024/05/eslint-compatibility-utilities/)
