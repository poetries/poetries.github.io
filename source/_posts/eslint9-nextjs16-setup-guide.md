---
title: 手把手基于ESLint 9+Husky+Prettier+Commitlint+Lint-staged配置前端规范
description: 在 Next.js 16 项目里落地一整套代码规范体系，含 ESLint 9 扁平化配置、Prettier 格式化、EditorConfig、Commitlint 提交校验、Lint-staged 增量检查与 Husky 钩子串联，附常见踩坑排查。
date: 2025-08-06 14:40:12
tags:
- ESLint
- Prettier
- Husky
- Commitlint
- Lint-staged
- 前端工程化
categories: Front-End
---

新人进组第二天提了个 PR，diff 里三百多行，真正改的业务逻辑只有五行，剩下全是缩进、引号、分号的差异。review 的人翻了十分钟没看出他到底做了什么，最后只能让他 revert 重来。这种事在没有统一规范的仓库里几乎每两周就要上演一次。

这篇把我在一个 Next.js 16 + TypeScript 项目里实际用的那套规范链路完整拆开写，ESLint 9 的扁平化配置怎么组、Prettier 和 ESLint 的边界划在哪、Lint-staged 为什么只检查暂存文件、Husky 9 的钩子该怎么写才不会在半年后失效。读完你能直接照着搭一份跑得起来的配置，也知道每个开关是为什么打开的。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 这套工具链里每个工具各自负责哪一段，边界划错了会怎样
- Next.js 16 项目的依赖安装清单与版本约束
- ESLint 9 扁平化配置（Flat Config）的完整写法与规则取舍
- Prettier、EditorConfig、VSCode 三者如何配合做到保存即修复
- Commitlint 约束提交信息、Lint-staged 做增量检查
- Husky 9 把钩子串起来，以及 husky add 已经不能用了这件事
- 一次完整提交在这条链路上都发生了什么
- 我自己踩过的几个坑和排查思路

## 一、先分清楚这几个工具各管什么

搭之前有个问题得想明白，为什么一套规范要装这么多包，一个 ESLint 不够吗。

不够。ESLint 管的是代码质量，比如变量声明了没用、Hook 写在条件分支里、img 标签缺 alt 属性，这些是「写错了」的问题。Prettier 管的是代码风格，单引号还是双引号、一行放多少个字符、对象末尾要不要留逗号，这些是「长得不一样」的问题。两件事混在一个工具里做，结果就是规则互相打架，改一个报另一个。

分工大概是这样：

| 工具 | 负责什么 | 配置文件 |
|------|----------|----------|
| ESLint 9 | 代码质量与潜在 bug | `eslint.config.mjs` |
| Prettier | 代码风格与排版 | `.prettierrc.js` |
| EditorConfig | 编辑器层面的缩进换行 | `.editorconfig` |
| Commitlint | 提交信息格式 | `commitlint.config.js` |
| Lint-staged | 只检查暂存区文件 | `lint-staged.config.js` |
| Husky | 在 Git 生命周期上挂钩子 | `.husky/` |

后面三个是「什么时候执行」的问题，前面三个是「执行什么」的问题。理清这条线，配置文件之间的引用关系就顺了。

顺着上面聊，EditorConfig 看起来和 Prettier 重复，其实不是。Prettier 只在你保存或者跑命令时才动手，EditorConfig 是编辑器打开文件那一刻就生效的，管的是你敲 Tab 键出来几个空格。团队里有人用 WebStorm 有人用 VSCode 的时候，这个文件能省掉不少扯皮。

## 二、项目初始化与依赖安装

先起一个 Next.js 16 项目。

```bash
npx create-next-app@latest my-app --typescript --tailwind --eslint
cd my-app
```

`--eslint` 会带一份最基础的 `eslint.config.mjs`，我们后面会整个覆盖掉，但留着它可以省去手动装 `eslint-config-next` 的步骤。

接下来装 ESLint 9 这一组。`@eslint/js` 提供官方推荐规则集，`typescript-eslint` 是新的统一入口包，替代了以前要同时装 `@typescript-eslint/parser` 和 `@typescript-eslint/eslint-plugin` 的写法。

```bash
npm install eslint@9 @eslint/js@9 --save-dev
npm install typescript-eslint@8 --save-dev
npm install eslint-config-next@16 --save-dev
npm install eslint-plugin-simple-import-sort@12 eslint-plugin-unused-imports@4 --save-dev
npm install @eslint/compat@1 --save-dev
```

`@eslint/compat` 这个包很关键。ESLint 9 对插件的写法做了破坏性调整，社区里有不少插件当时还没跟上，`fixupPluginRules` 能把老写法的插件包一层适配到扁平化配置里。关于 ESLint 8 到 9 到底改了哪些东西，我之前写过一篇更细的拆解，可以配合看 [ESLint 9 完全指南](https://feinterview.poetries.top/blog/eslint-9-upgrade-guide)。

然后是 Prettier 这一组。

```bash
npm install prettier@3 prettier-plugin-tailwindcss@0.7 --save-dev
npm install eslint-config-prettier@10 --save-dev
```

`eslint-config-prettier` 不加任何规则，它只做一件事，把 ESLint 里所有和排版相关、会跟 Prettier 打架的规则全部关掉。装了它，上面说的「规则互相打架」就基本消失了。

最后是 Git 钩子这一组。

```bash
npm install husky@9 lint-staged@16 --save-dev
npm install @commitlint/cli@17 @commitlint/config-conventional@17 --save-dev
```

装完对一遍完整的清单，版本号锁在这个区间是我实际验证过能跑通的组合。

```json
{
  "devDependencies": {
    "@commitlint/cli": "^17.7.2",
    "@commitlint/config-conventional": "^17.7.0",
    "@eslint/compat": "^1.4.1",
    "@eslint/eslintrc": "^3",
    "eslint": "^9.39.0",
    "eslint-config-next": "^16.0.1",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-prettier": "^5.5.4",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-simple-import-sort": "^12.1.1",
    "eslint-plugin-unused-imports": "^4.3.0",
    "husky": "^9.1.7",
    "lint-staged": "^16.2.6",
    "prettier": "^3.6.2",
    "prettier-plugin-tailwindcss": "^0.7.1",
    "typescript": "^5.9.3"
  }
}
```

这里有个细节容易被忽略，`@eslint/eslintrc` 和 `@eslint/compat` 是两个不同的东西。前者用来把老的 `.eslintrc` 配置塞进扁平化配置（`FlatCompat`），后者用来适配老写法的插件。如果你是全新项目，`@eslint/eslintrc` 其实可以不装。

## 三、ESLint 9 扁平化配置怎么写

ESLint 9 把配置格式换成了 Flat Config，文件名从 `.eslintrc.json` 变成 `eslint.config.mjs`，结构从一个大对象变成了一个数组。数组里每一项是一段独立配置，按顺序合并，后面的覆盖前面的。

先看骨架部分。

```javascript
// eslint.config.mjs
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import tseslint from 'typescript-eslint'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import { fixupPluginRules } from '@eslint/compat'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  tseslint.configs.recommendedTypeChecked,
  // ...下面是我们自己的那一段
])

export default eslintConfig
```

`eslint-config-next` 在 16 版本里拆成了 `core-web-vitals` 和 `typescript` 两个子路径导出，直接展开进数组就行，不再需要以前 `extends: 'next/core-web-vitals'` 那种字符串写法。这也是 Flat Config 最舒服的一点，配置就是普通的 JS 模块，能 import 能展开能条件判断。

`tseslint.configs.recommendedTypeChecked` 是带类型信息的规则集，它比 `recommended` 强得多，能查出 `await` 一个非 Promise 这类问题，代价是要求 ESLint 能读到 TS 的类型信息，也就是下面 `projectService: true` 那行。

```javascript
{
  files: ['src/**/*.{js,jsx,ts,tsx}'],
  plugins: {
    'simple-import-sort': fixupPluginRules(simpleImportSort),
    'unused-imports': fixupPluginRules(unusedImports)
  },
  extends: [],
  languageOptions: {
    parserOptions: {
      projectService: true
    },
    globals: {
      JSX: true
    }
  },
  rules: {
    // 见下一段
  }
}
```

`projectService: true` 是 typescript-eslint 8 推荐的新写法，替代了以前手写 `project: './tsconfig.json'` 的方式，它会自动找到每个文件对应的 tsconfig，monorepo 里省事很多。这里有个坑要注意，一旦开了类型检查规则，ESLint 的执行时间会明显变长，因为它要跑一遍 TS 的类型推导。项目大了之后 `npx eslint src` 跑个几十秒是正常的，所以后面才需要 Lint-staged 只检查改动文件。

`files` 限定成 `src/**` 也是有意的。构建产物、配置文件、脚本目录不该被带类型的规则扫，不然会因为它们不在 tsconfig 的 include 范围里直接报错。

规则那一块比较长，我按用途拆成三组说。第一组是把默认开着但和项目习惯冲突的规则关掉。

```javascript
rules: {
  semi: 'off',
  'trailing-comma': 'off',
  '@typescript-eslint/explicit-member-accessibility': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/ban-ts-comment': 'off',
  '@typescript-eslint/no-var-requires': 'off',
  '@typescript-eslint/no-require-imports': 'off',
  '@typescript-eslint/ban-types': 'off',
  '@typescript-eslint/no-empty-object-type': 'off',
  'prefer-const': 'off',
  'react/display-name': 'off',
  'react/no-children-prop': 'off',
  'import/no-anonymous-default-export': 'off',
  '@next/next/no-img-element': 'off'
}
```

`semi` 和 `trailing-comma` 关掉是因为这两件事交给 Prettier 管，留在 ESLint 里就是双重标准。`no-explicit-any` 关掉这条我知道会有人不同意，我的理由是存量项目里 `any` 一时清不干净，开成 error 会让 lint 输出淹没在几百条噪音里，真正重要的问题反而看不见。等类型补齐了再打开也不迟。

第二组是那一大串 `no-unsafe-*` 和 Promise 相关的规则。

```javascript
rules: {
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-argument': 'off',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
  '@typescript-eslint/no-floating-promises': 'off',
  '@typescript-eslint/no-misused-promises': 'off',
  '@typescript-eslint/require-await': 'off',
  '@typescript-eslint/await-thenable': 'off',
  '@typescript-eslint/only-throw-error': 'off',
  '@typescript-eslint/prefer-promise-reject-errors': 'off',
  '@typescript-eslint/restrict-template-expressions': 'off',
  '@typescript-eslint/no-base-to-string': 'off',
  '@typescript-eslint/no-unused-expressions': 'off'
}
```

这一组全是 `recommendedTypeChecked` 带进来的。它们本身质量很高，`no-floating-promises` 尤其能救命，但只要项目里有 `any`，`no-unsafe-*` 系列就会连锁爆炸，一个 `any` 变量的每次属性访问都要报一条。我的做法是先整体关掉，把类型补到一定程度之后再一条一条打开，一次开一条，改完再开下一条。

不是说这些规则不重要，而是一上来全开只会让人直接加 `--quiet` 跳过 lint。

第三组是真正开着的规则，也是这份配置里唯一在起约束作用的部分。

```javascript
rules: {
  'simple-import-sort/imports': 'warn',
  'simple-import-sort/exports': 'warn',
  'unused-imports/no-unused-imports': 'error',
  'react-hooks/exhaustive-deps': 'off',
  'react-hooks/rules-of-hooks': 'off',
  'jsx-a11y/alt-text': 'error'
}
```

`simple-import-sort` 设成 `warn` 而不是 `error`，因为它可以 `--fix` 自动修，没必要卡住流程。`unused-imports/no-unused-imports` 设成 `error`，未使用的 import 会实打实增加打包体积，而且同样能自动修，卡住它的成本很低。

`jsx-a11y/alt-text` 开成 `error` 是这份配置里我唯一坚持的一条硬规则。图片没有 alt，屏幕阅读器读不出来，搜索引擎也拿不到图片语义，这条是收益最直接的无障碍规则。

这里必须说一个原文配置里的坑。`jsx-a11y/alt-text` 在同一个 rules 对象里出现了两次，前面一次是 `'off'`，后面一次是 `'error'`。JS 对象字面量的重复 key 是后者覆盖前者，所以最终生效的是 `error`，结果是对的，但这纯属运气。如果哪天有人调整顺序，规则就悄悄失效了，而且不会有任何报错提示。我建议开 `no-dupe-keys` 或者干脆让编辑器帮你标出来。

同样可疑的还有 `'typescript-eslint/unbound-method'` 这一条，插件前缀少了 `@`，正确的应该是 `@typescript-eslint/unbound-method`。在 Flat Config 下配置一个不存在的规则名，ESLint 在 lint 时会直接抛「Definition for rule was not found」。这条我没在你的具体版本上复现过，遇到类似报错先往这个方向查。

`react-hooks/rules-of-hooks` 关掉这件事，我个人是不推荐的。Hook 调用顺序错乱会导致 React 内部状态错位，报出来的错往往指向完全不相干的组件，排查成本极高。存量项目实在开不了就先开成 `warn`，别直接 `off`。

最后是忽略配置。

```javascript
globalIgnores([
  '.next/**',
  'out/**',
  'build/**',
  'next-env.d.ts',
  'eslint.config.mjs',
  'node_modules/**',
  '**/*.json',
  '**/.vscode',
  '.husky/**'
])
```

`globalIgnores` 是 ESLint 9 提供的辅助函数，等价于一个只有 `ignores` 字段的配置项，作用于整个配置数组。注意 `.eslintignore` 文件在 ESLint 9 里已经不再被读取了，忽略规则必须写进配置文件，从 8 升上来的项目这一步最容易漏。

配置写完加个脚本。

```json
{
  "scripts": {
    "eslint": "npx eslint --fix src"
  }
}
```

补一句，`next lint` 这个命令在新版本里已经不是官方推荐的入口了，方向是直接调用 eslint CLI。具体从哪个版本开始变化，以你装的 `next` 版本的 release notes 为准，但配置层面按上面这样写，两种入口都能跑。

## 四、Prettier 负责风格这一半

回到 Prettier。它的配置项不多，但每一条都会影响整个仓库的 diff 长相，定下来之后基本不要再改，改一次全仓库重排是灾难。

```javascript
// .prettierrc.js
module.exports = {
  // 一行最多140字符
  printWidth: 140,
  // 使用2个空格缩进
  tabWidth: 2,
  // 不使用缩进符，而使用空格
  useTabs: false,
  // 行尾不需要分号
  semi: false,
  // 使用单引号
  singleQuote: true,
  // 对象的key仅在必要时用引号
  quoteProps: 'as-needed',
  // JSX使用双引号
  jsxSingleQuote: false,
  // 末尾不需要逗号
  trailingComma: 'none',
  // 大括号内的首尾需要空格
  bracketSpacing: true,
  // JSX标签的反尖括号不需要换行
  bracketSameLine: false,
  // 箭头函数只有一个参数的时候也需要括号
  arrowParens: 'always',
  // 每个文件格式化的范围是文件的全部内容
  rangeStart: 0,
  rangeEnd: Infinity,
  // 不需要写文件开头的@prettier
  requirePragma: false,
  // 不需要自动在文件开头插入@prettier
  insertPragma: false,
  // 使用默认的折行标准
  proseWrap: 'preserve',
  // 根据显示样式决定html要不要折行
  htmlWhitespaceSensitivity: 'css',
  // vue文件中的script和style内不用缩进
  vueIndentScriptAndStyle: false,
  // 换行符使用lf
  endOfLine: 'lf',
  // 格式化嵌入的内容
  embeddedLanguageFormatting: 'auto',
  // HTML, Vue, JSX中每个属性占一行
  singleAttributePerLine: false,
  // 使用Tailwind CSS插件
  plugins: ['prettier-plugin-tailwindcss']
}
```

几个值得单独说的。`printWidth: 140` 比默认的 80 宽不少，我的判断是现在大家显示器都够宽，80 会把 JSX 打得七零八落，一个稍长的组件属性列表就要拆五行。但也别设到 200，超过屏幕宽度之后横向滚动比换行更难读。

`endOfLine: 'lf'` 这条在 Windows 和 macOS 混用的团队里是必须的。不设的话，Windows 同学提交的文件行尾是 CRLF，Git diff 会显示整个文件都变了。配合 `.gitattributes` 里的 `* text=auto eol=lf` 一起用效果更稳。

`semi: false` 加 `singleQuote: true` 是社区里比较常见的一套，和上面 ESLint 里关掉 `semi` 规则是配套的。真正重要的不是选哪种，是选了就别改。

`prettier-plugin-tailwindcss` 这个插件的作用是把 `className` 里的 Tailwind 类名按官方推荐顺序重排。装了它之后，`className="text-sm flex p-4"` 会被改成 `className="flex p-4 text-sm"`，好处是同样一组样式在任何文件里长得都一样，diff 干净很多。这个插件必须放在 `plugins` 数组的最后一位，它依赖其他插件先处理完。

然后是忽略文件。

```text
# .prettierignore
node_modules
.next
out
build
dist
coverage
*.lock
package-lock.json
yarn.lock
pnpm-lock.yaml
```

lock 文件一定要排除。Prettier 格式化一次 `yarn.lock`，你的 PR 就会多出一万行 diff，而且下次 `yarn install` 又会把它改回去。

```json
{
  "scripts": {
    "prettier": "prettier --write ./src"
  }
}
```

这里有个坑我踩过。`.prettierrc.js` 用的是 `module.exports`，属于 CommonJS 写法。如果你的 `package.json` 里有 `"type": "module"`，Node 会把所有 `.js` 当 ESM 解析，这个文件直接报 `module is not defined`。解法是改名成 `.prettierrc.cjs`，或者换成 `export default`。同样的问题 `commitlint.config.js` 和 `lint-staged.config.js` 也有，排查了一下午才反应过来是 `type` 字段的锅。

## 五、EditorConfig 与 VSCode 保存即修复

EditorConfig 的配置最短，但覆盖的是编辑器最底层的行为。

```ini
# .editorconfig
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
end_of_line = auto
```

`root = true` 表示到此为止，不再往上层目录找配置。`insert_final_newline` 让每个文件结尾留一个空行，这条能避免 Git diff 里出现「\ No newline at end of file」那种烦人的提示。

VSCode 这边分两块。先是格式化相关的。

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": "explicit",
    "source.fixAll.eslint": "explicit",
    "source.fixAll.stylelint": "explicit"
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

`formatOnSave` 和 `codeActionsOnSave` 是两件不同的事。前者跑 Prettier 排版，后者跑 ESLint 的 `--fix`。执行顺序上 ESLint 的修复先跑，Prettier 的格式化后跑，所以最终排版以 Prettier 为准，不会打架。

`"explicit"` 这个值是 VSCode 1.85 之后的新写法，以前写 `true`。老写法还能用但会有弃用提示，新项目直接用字符串形式。

为每种语言单独指定 `defaultFormatter` 看着啰嗦，但很有必要。装了多个格式化插件的同事，全局默认值可能被别的插件抢走，语言级配置的优先级更高，能保证团队里每个人的结果一致。

第二块是排除目录，纯粹为了性能。

```json
{
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/*/**": true,
    "**/dist/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/bower_components": true,
    "**/*.code-search": true,
    "**/.DS_Store": true,
    "**/.git": true,
    "**/.gitignore": true,
    "**/.idea": true,
    "**/.svn": true,
    "**/.vscode": true,
    "**/build": true,
    "**/dist": true,
    "**/tmp": true,
    "**/yarn.lock": true
  },
  "files.exclude": {
    "**/.git": true,
    "**/.svn": true,
    "**/.hg": true,
    "**/CVS": true,
    "**/.DS_Store": true
  },
  "editor.rulers": []
}
```

`files.watcherExclude` 对大仓库的效果特别明显。VSCode 默认会监听工作区所有文件的变化，`node_modules` 里几十万个文件全监听一遍，macOS 上会直接顶到文件描述符上限，编辑器卡到打字都有延迟。

各配置项的作用整理成表：

| 配置项 | 说明 |
|--------|------|
| `editor.formatOnSave` | 保存时用 Prettier 排版 |
| `editor.codeActionsOnSave` | 保存时跑 ESLint 和 Stylelint 的自动修复 |
| `editor.defaultFormatter` | 指定默认格式化器，避免被其他插件抢走 |
| `files.watcherExclude` | 不监听的目录，直接影响编辑器响应速度 |
| `search.exclude` | 全局搜索时跳过的目录 |

再加一份推荐扩展清单，新人 clone 下来 VSCode 会弹窗提示安装。

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "stylelint.vscode-stylelint",
    "editorconfig.editorconfig"
  ]
}
```

也可以让新人直接在命令行装。

```bash
# 在VSCode中打开扩展面板，输入 @recommended 一键安装
# 或在项目根目录执行
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension stylelint.vscode-stylelint
code --install-extension editorconfig.editorconfig
```

## 六、Commitlint 约束提交信息

提交信息这件事，不做约束的话最后仓库里会有一堆 `fix`、`update`、`111`、`最终版`。等到某天要查一个 bug 是哪次引入的，git log 完全帮不上忙。

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 提交信息最大长度100字符
    'header-max-length': [1, 'always', 100],
    // 允许的提交类型
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // Bug修复
        'enhance',  // 增强
        'chore',    // 杂项
        'test',     // 测试
        'doc',      // 文档
        'docs',     // 文档
        'refactor', // 重构
        'style',    // 样式
        'revert'   // 回滚
      ]
    ]
  }
}
```

规则数组的第一个数字是等级，`0` 是关闭，`1` 是警告，`2` 是报错。`header-max-length` 设成 `1` 表示超长只提醒不拦截，`type-enum` 设成 `2` 表示类型写错直接拒绝提交。这个搭配我觉得挺合理，格式硬约束，长度软提醒。

`doc` 和 `docs` 同时保留是历史包袱，老提交里两种都有，一刀切掉会让 revert 老提交时报错。新项目建议只留 `docs`。

写出来大概是这个样子。

```
feat: 添加用户登录功能
fix: 修复首页加载慢的问题
enhance: 优化图片加载性能
chore: 更新依赖版本
refactor: 重构登录模块代码
```

冒号后面那个空格是必须的，`feat:添加` 会被判定为格式错误。这个我一开始也是这么想的，觉得中文冒号看起来更整齐，试了才发现 Conventional Commits 规范里定死了是半角冒号加空格。

## 七、Lint-staged 只检查改动的文件

前面提过，开了类型检查规则之后 ESLint 会变慢。如果每次 `git commit` 都全量扫一遍 `src`，几千个文件的项目提交一次要等一分钟，最后所有人都会去用 `--no-verify` 绕过。

Lint-staged 解决的就是这个。它只把 Git 暂存区里的文件交给检查工具，改了三个文件就只检查三个。

```javascript
// lint-staged.config.js
module.exports = {
  // TypeScript类型检查和ESLint检查
  '**/*.(ts|tsx)': () => ['npx tsc --noEmit', 'npx eslint --fix src'],
  // 代码格式化
  '**/*.(ts|tsx|md|json)': () => `npx prettier --write src`
}
```

这里的写法要解释一下。Lint-staged 默认会把匹配到的文件名拼在命令后面，比如你写 `'**/*.ts': 'eslint --fix'`，实际执行的是 `eslint --fix a.ts b.ts`。而上面用了函数形式并且忽略了传入的文件名参数，返回的命令是写死的 `src`，所以实际还是全量跑。

为什么要这么写。因为 `tsc --noEmit` 没法只检查单个文件，类型检查天然需要完整的模块图，你只给它两个文件，它会因为找不到依赖类型而误报。这是个取舍，要么类型检查全量跑得慢一点，要么放弃提交时的类型检查。

如果你的项目不需要提交时做类型检查，那就用标准写法，速度会快很多。

```javascript
module.exports = {
  '**/*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '**/*.{md,json,css,scss}': ['prettier --write']
}
```

标准写法下 Lint-staged 还会自动把修复后的文件重新 `git add` 回暂存区，不用你手动加。

## 八、Husky 把钩子串起来

Husky 负责的是「什么时候触发」。它的原理是把 Git 的 `core.hooksPath` 指向项目里的 `.husky` 目录，这样钩子脚本可以跟着仓库一起提交，团队成员 clone 下来就自动生效。

```bash
npx husky init
```

这条命令会创建 `.husky` 目录、写一个默认的 `pre-commit`，并且往 `package.json` 里加 `prepare` 脚本。

```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

这里必须提醒一句，`husky install` 在 Husky 9 里已经被标记为弃用了，`npx husky init` 生成的其实是 `"prepare": "husky"`。旧写法在 9.x 还能跑，但会打印一行弃用警告，Husky 10 会彻底移除。新项目直接用 `"prepare": "husky"`。

同样的问题也出在 `husky add` 上。

```bash
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit $1'
npx husky add .husky/pre-commit 'npx lint-staged'
```

这两条命令在 Husky 9 里同样是弃用状态，会提示你直接创建文件。现在推荐的做法是手动往 `.husky/` 下写文件，内容就一行命令，不需要以前那种 `#!/usr/bin/env sh` 加 `. "$(dirname -- "$0")/_/husky.sh"` 的样板头。

```bash
# .husky/pre-commit
npx lint-staged
```

```bash
# .husky/commit-msg
npx --no -- commitlint --edit $1
```

`--no` 这个参数是让 npx 在找不到本地包时直接报错，而不是偷偷去网上下一个。少了它，如果本地 commitlint 没装上，npx 会临时下载一个版本不确定的包来跑，行为就不可控了。

`$1` 是 Git 传给 commit-msg 钩子的参数，指向存放提交信息的临时文件路径，`--edit` 告诉 commitlint 去读这个文件。

完整的 scripts 长这样。

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prettier": "prettier --write ./src",
    "stylelint": "stylelint **/*.{css,scss,sass} --fix",
    "eslint": "npx eslint --fix src",
    "prepare": "husky install",
    "tsc": "npx tsc --noEmit",
    "lint-staged": "npx lint-staged",
    "cz": "git add . && git-cz"
  }
}
```

`cz` 那条依赖 `commitizen` 和 `cz-conventional-changelog`，上面的依赖清单里没有，要单独装并且在 `.czrc` 里指定适配器。不装的话跑 `yarn cz` 会提示找不到 `git-cz` 命令。

## 九、一次提交在这条链路上发生了什么

把上面所有配置串起来，一次 `git commit` 的完整过程是这样的。

你执行 `git add .` 和 `git commit`，Git 在真正生成 commit 之前会先触发 `pre-commit` 钩子。因为 `core.hooksPath` 被 Husky 指到了 `.husky`，这个钩子里的 `npx lint-staged` 就会执行。Lint-staged 拿到暂存区的文件列表，按 `lint-staged.config.js` 里的 glob 分组，对 TS 文件跑 `tsc --noEmit` 和 `eslint --fix`，对文档和配置跑 `prettier --write`。任何一步退出码非 0，提交立刻中断。

检查通过之后，Git 才会去读你写的提交信息，然后触发 `commit-msg` 钩子。commitlint 读取临时文件里的内容，按 `type-enum` 和 `header-max-length` 校验，格式不对同样拒绝。

两道关都过了，commit 才真正落进仓库。

用 `yarn cz` 的话，第一步会变成交互式选择提交类型，不用自己记有哪些 type。

```
yarn cz
```

![git-cz 交互式选择提交类型的命令行界面](https://s.poetries.top/uploads/2026/03/65a6c4ff77e6a2f5.png)

选完类型再填 scope 和描述，工具会拼成符合规范的提交信息，后面的 commitlint 自然就过了。团队里对规范不熟的同学，用这个比背规则靠谱。

## 十、我踩过的几个坑

**Husky 装完钩子不触发**。这个最常见。先确认 `.git/config` 里有没有 `hooksPath = .husky`，没有就是 `prepare` 脚本没跑。`prepare` 只在 `npm install` 时自动执行，你如果是先装的 husky 再手动加的 scripts，得再跑一次 `npm install` 或者直接 `npm run prepare`。另外 clone 下来的仓库，`.husky` 目录里的文件如果丢了可执行权限，钩子也不会跑，`chmod +x .husky/*` 补一下。

**ESLint 和 Prettier 打架**。表现是保存之后代码被改来改去，或者 lint 报的错 Prettier 修不掉。装 `eslint-config-prettier` 并且确保它在配置数组的最后一位，因为 Flat Config 是后面覆盖前面，放中间就压不住后面配置里的排版规则。顺带一提，`eslint-plugin-prettier`（注意是 plugin 不是 config）是另一种方案，它把 Prettier 当成一条 ESLint 规则跑，好处是只需要一个命令，坏处是排版问题会以 lint error 的形式刷屏，我个人不太推荐。

**Lint-staged 一个文件都没匹配到**。检查 glob 写法。上面用的 `'**/*.(ts|tsx)'` 是 micromatch 的 extglob 语法，更通用的写法是 `'**/*.{ts,tsx}'`。两种在 Lint-staged 里都能用，但如果你从别的项目抄配置过来发现不生效，先把 glob 换成花括号形式试试。

**类型检查慢到无法忍受**。`tsc --noEmit` 在中型项目上跑十几秒是常态。可以考虑在 `tsconfig.json` 里开 `incremental: true` 加 `tsBuildInfoFile`，第二次之后会快很多。或者干脆把类型检查从 pre-commit 挪到 CI，本地只留 ESLint 和 Prettier。

**规则改了没生效**。ESLint 9 有缓存机制，另外 VSCode 的 ESLint 插件会常驻一个 server 进程，改完配置文件记得在命令面板里执行一次 ESLint: Restart ESLint Server，不然编辑器里看到的还是老规则。

## 总结

这套东西搭下来，真正的价值不在于「代码变整齐了」，而在于把风格争论从 code review 里彻底移走。以后 PR 里的每一行 diff 都是有意义的改动，review 的人可以只看逻辑。

几个关键取舍再强调一遍。ESLint 只管质量，排版全部交给 Prettier，中间用 `eslint-config-prettier` 隔开。类型检查规则收益高但代价大，存量项目先关掉一批，补一块类型开一条规则。Lint-staged 的作用是让检查时间控制在可接受范围，否则再好的规范也会被 `--no-verify` 绕过。Husky 9 里 `husky install` 和 `husky add` 都已经弃用，抄网上教程时留意这一点。

最后一句提醒，配置文件的重复 key 和拼错的插件前缀是最难发现的问题，因为它们大多不会报错，只是悄悄地不生效。定期跑一次 `npx eslint --inspect-config` 看看最终合并出来的规则集，比逐行读配置靠谱。

## 参考

- [ESLint Flat Config 官方文档](https://eslint.org/docs/latest/use/configure/configuration-files)
- [ESLint 迁移到 9.0.0 指南](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [typescript-eslint 官方文档](https://typescript-eslint.io/getting-started/)
- [Prettier 配置选项](https://prettier.io/docs/en/options.html)
- [Husky 官方文档](https://typicode.github.io/husky/)
- [lint-staged 仓库](https://github.com/lint-staged/lint-staged)
- [Conventional Commits 规范](https://www.conventionalcommits.org/zh-hans/v1.0.0/)
- [前端进阶之旅](https://interview.poetries.top)
