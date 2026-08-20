---
title: ESLint 配置文件详解 从 eslintrc 字段到扁平配置
description: 逐字段拆解 ESLint 配置文件，env、globals、parserOptions、plugins、extends、rules、overrides 各管什么，配置怎么查找和继承，以及 ESLint 9 扁平配置里的对应写法。
date: 2018-11-23 10:40:08
tags: 
   - eslint
   - 代码风格
   - Flat Config
   - 前端工程化
categories: Front-End
---

接手一个跑了几年的老项目，根目录躺着一份两百多行的 `.eslintrc.json`，`env`、`parserOptions`、`extends`、`rules` 一字排开，谁也不敢动。想加一条规则，不确定会不会被 `extends` 里的某个包覆盖掉；想让 `test/` 目录松一点，又不知道该写在哪一层。

ESLint 是一个 JavaScript 静态检查工具，它能帮你养成良好的编程习惯。但要让它真的听话，得先看懂它的配置文件。这篇就把这个文件拆开，一个字段一个字段说清楚它管什么、什么时候用得上、写错了会出什么症状。那份带中文注释的完整规则清单我一条没删，只是按类别拆成了几段，每段前面补上背景。最后再补一节 ESLint 9 扁平配置的对应写法，老项目和新项目都能对上号。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- ESLint 到底去哪里找配置文件，`root: true` 这一行在挡什么
- `env` 和 `globals` 的分工，以及为什么 ESLint 9 里 `env` 消失了
- `parserOptions` 的几个子字段分别影响解析的哪一步
- `plugins` 和 `extends` 的关系，插件装了不等于规则开了
- `rules` 的严重度写法、参数写法，以及一份逐条注释的完整规则清单
- `overrides` 怎么给不同目录配不同规则
- 多份配置叠在一起时，到底谁覆盖谁
- 行内注释临时关掉校验的三种写法
- 上面这些字段在 ESLint 9 扁平配置里对应成了什么

## 一、ESLint 先得找到配置文件

写规则之前，先搞清楚 ESLint 是怎么找到这个文件的。这一步不清楚，后面所有的「我明明改了但没生效」都没法排查。

`.eslintrc.*` 这套体系（下面统称 eslintrc）用的是级联查找。ESLint 拿到一个待检查的文件，从它所在的目录开始往上翻，每一层只要有配置文件就读进来，一直翻到某一层写了 `root: true`，或者翻到文件系统根目录为止。翻到的所有配置自上而下合并，离被检查文件越近的那份优先级越高。

同一个目录里放了多种格式的配置文件时，ESLint 只取第一个，其余的直接忽略。顺序是固定的。

```
.eslintrc.js
.eslintrc.cjs
.eslintrc.yaml
.eslintrc.yml
.eslintrc.json
package.json 里的 eslintConfig 字段
```

这里有个坑要注意。项目里同时存在 `.eslintrc.js` 和 `.eslintrc.json` 时，`.json` 那份是完全不生效的，而且没有任何警告。我见过好几次「改了半天规则纹丝不动」，最后发现是在改一份根本没被读的文件。

`root: true` 的作用是「到我为止，别再往上翻了」。这一行在 monorepo 里几乎是必写的，否则子包的 lint 会一路读到仓库根目录甚至用户主目录下的配置，行为在不同人的机器上还不一样。

还有一个独立于配置文件的 `.eslintignore`，语法和 `.gitignore` 一致，用来把 `dist/`、`node_modules/`、生成代码排除掉。它和 `.eslintrc` 是两个文件，很多人以为忽略规则也写在配置里，结果构建产物被一起 lint，报出几万条错误。

先记住这两点，因为待会儿讲 ESLint 9 的时候，这两条恰好都变了。

## 二、env 声明代码跑在什么环境里

`env` 解决的是一个很具体的问题：ESLint 不知道 `window` 和 `process` 是什么。

它只是个语法分析器，看到一个没声明过的标识符，`no-undef` 规则就会报 `'window' is not defined`。`env` 做的事情就是告诉 ESLint「这份代码跑在浏览器里，浏览器那一整套全局变量都是合法的」，ESLint 内部维护着这些环境对应的全局变量表，打开开关就把整张表塞进作用域。

```js
// .eslintrc.json 片段
{
    // 环境定义了预定义的全局变量。
    "env": {
        //环境定义了预定义的全局变量。更多在官网查看
        "browser": true,
        "node": true,
        "commonjs": true,
        "amd": true,
        "es6": true,
        "mocha": true
    }
}
```

这几个开关分别对应什么，值得逐条对一下。`browser` 给的是 `window`、`document`、`navigator` 这类；`node` 给的是 `process`、`__dirname`、`Buffer`、`require`；`commonjs` 是给 Browserify、webpack 这种在浏览器里用 CommonJS 打包的场景准备的；`amd` 对应 `define` 和 `require` 的 AMD 形式；`mocha` 给的是 `describe`、`it`、`before` 这些测试全局函数。

`es6` 这一项要单独说，它不只是加全局变量。打开 `es6` 会同时把 `Promise`、`Map`、`Set`、`Symbol` 这些内置对象加进来，并且自动把 `parserOptions.ecmaVersion` 设成 6。所以你会看到很多老配置里 `es6: true` 和 `ecmaVersion: 6` 同时写着，其实后者是冗余的。

我自己的习惯是不要把 `browser` 和 `node` 一起全开。全开确实不报错了，代价是你在浏览器代码里写 `process.env.XXX` 也不会被拦住，直到运行时才炸。更好的做法是根目录只开 `browser`，用后面讲的 `overrides` 给构建脚本单独开 `node`。

## 三、globals 补 env 覆盖不到的全局变量

`env` 给的是成套的预设，`globals` 给的是零散的补充。CDN 引进来的 jQuery、后端模板注入的 `__INITIAL_STATE__`、老项目里挂在 `window` 上的那些全局对象，都归它管。

```js
// .eslintrc.json 片段
{
    "globals": {
        // true 表示允许重新赋值，false 表示只读
        "jQuery": false,
        "$": false,
        "__INITIAL_STATE__": true
    }
}
```

值的含义容易记反。`false`（或者写成 `"readonly"`）是只读，代码里给它重新赋值会被 `no-global-assign` 拦住；`true`（`"writable"`）才是允许改写。绝大多数场景应该写 `false`，第三方库的全局对象没有理由被业务代码覆盖。

如果只有单个文件用到某个全局变量，没必要写进配置，直接在文件顶部用注释声明就行。

```js
/* global __INITIAL_STATE__ */
console.log(__INITIAL_STATE__)
```

这个写法和前面 `rules` 里 `no-undef` 那条注释说的是同一件事，「禁用未声明的变量，除非它们在 `/*global */` 注释中被提到」。

## 四、parserOptions 决定代码怎么被解析

前面两个字段管的是「有哪些变量」，`parserOptions` 管的是「这段代码按什么语法解析」。解析这一步失败，后面所有规则都跑不起来，报错通常是 `Parsing error: Unexpected token`。

```js
// .eslintrc.json 片段
{
    // JavaScript 语言选项
    "parserOptions": {
        // ECMAScript 版本
        "ecmaVersion": 6,
        "sourceType": "module", //设置为 "script" (默认) 或 "module"（如果你的代码是 ECMAScript 模块)。
        //想使用的额外的语言特性:
        "ecmaFeatures": {
            // 允许在全局作用域下使用 return 语句
            "globalReturn": true,
            // 全局使用严格模式（impliedStrict）
            "impliedStrict": true,
            // 启用 JSX
            "jsx": true,
            "modules": true
        }
    }
}
```

`ecmaVersion` 现在一般直接写 `2022`、`2023` 这种年份形式，或者写 `"latest"` 让它跟着 ESLint 版本走。写 `6` 的问题是可选链 `?.`、空值合并 `??` 这些后来的语法会直接解析失败。老配置里留着 `6` 是因为当年就到这儿，新项目没必要跟。

`sourceType` 只有两个值有实际区别。写 `"module"` 时 ESLint 按 ES Module 解析，`import`/`export` 可用，并且代码默认处于严格模式；写 `"script"` 时按传统脚本解析，顶层 `this` 指向全局对象。这一项配错的典型症状是 `import` 那一行报 `Unexpected token import`。

`ecmaFeatures` 里几个子项都比较边缘。`globalReturn` 允许顶层 `return`，这是 CommonJS 模块的历史遗留；`impliedStrict` 让所有代码都按严格模式解析，等价于每个文件顶部都有 `'use strict'`；`jsx` 是让内置解析器认识 JSX 语法。

这里要澄清一个常见误解。`ecmaFeatures.jsx` 只让 ESLint 能把 JSX **解析成语法树**，它不提供任何 React 相关的检查规则，那是 `eslint-plugin-react` 的活。另外 `modules` 这一项在现在的 ESLint 里已经不需要了，用 `sourceType: "module"` 就够，老配置里带着它不会报错，纯属冗余。

还有一个和 `parserOptions` 平级的 `parser` 字段，这份配置里没写，但实际项目基本绕不开。内置解析器叫 espree，只认标准 JavaScript；写 TypeScript 要换成 `@typescript-eslint/parser`，写 Vue 单文件组件要换成 `vue-eslint-parser`。换解析器之后 `parserOptions` 里往往还要额外配 `project` 指向 `tsconfig.json`，那些依赖类型信息的规则才能跑。

## 五、plugins 和 extends 是两件事

这两个字段挨得近，作用完全不同，混淆的人非常多。

```js
// .eslintrc.json 片段
{
    //-----让eslint支持 JSX start
    "plugins": [
        "react"
    ],
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended"
    ]
    //-----让eslint支持 JSX end
}
```

`plugins` 只做一件事，把插件里的规则**注册**进来，让你可以在 `rules` 里写 `react/jsx-uses-vars` 这种带前缀的规则名。注册不等于开启，光写 `plugins: ["react"]` 而不配任何规则，lint 结果一条都不会变。这是新手最容易懵的地方，装了插件却发现什么都没检查出来。

`extends` 才是「批量开规则」。它接受三类值：`"eslint:recommended"` 是 ESLint 内置的推荐集；`"plugin:react/recommended"` 是插件自己导出的推荐集，写法是 `plugin:` 加插件名加配置名；直接写包名（比如 `"airbnb"`）则对应 `eslint-config-airbnb` 这个独立的配置包。

注意第二种写法里插件名可以省略 `eslint-plugin-` 前缀，`react` 会被解析成 `eslint-plugin-react`。这套省略约定在 monorepo 里经常出问题，因为 ESLint 是按自己的路径规则去 `node_modules` 里找包的，pnpm 那种非扁平的 `node_modules` 结构下解析失败是家常便饭。

`extends` 数组是有顺序的，后面的覆盖前面的，你自己写的 `rules` 又覆盖整个 `extends`。这条优先级链后面第九节还会展开。

具体到哪些 config 包值得用、和 Prettier 怎么配合，我另写了一篇 [eslint 常用配置](https://feinterview.poetries.top/blog/eslint-config)，这篇就不铺开了。

## 六、rules 的严重度和参数写法

到了真正配规则的地方。每条规则的值有两种形态，要么是一个严重度，要么是一个数组，数组第一项是严重度，后面是这条规则自己的选项。

```js
/**
 * "off" 或 0 - 关闭规则
 * "warn" 或 1 - 开启规则，使用警告级别的错误：warn (不会导致程序退出),
 * "error" 或 2 - 开启规则，使用错误级别的错误：error (当被触发的时候，程序会退出)
 */
```

数字和字符串完全等价，`2` 就是 `"error"`。老配置普遍用数字，因为当年文档里就是这么写的；现在更推荐字符串形式，理由很简单，`"error"` 比 `2` 好读，code review 的时候不用回想哪个是哪个。

`warn` 和 `error` 的区别在于退出码。`warn` 会打印但进程正常退出，`error` 会让 `eslint` 命令返回非零，CI 直接红。团队推进规范主要就靠这个差别，新规则先上 `warn` 观察一段时间，存量改完再提到 `error`。

参数的写法看这条就明白了。

```js
// 数组和对象键值对最后一个逗号
// never 参数：不能带末尾的逗号
// always 参数：必须带末尾的逗号
// always-multiline：多行模式必须带逗号，单行模式不能带逗号
"comma-dangle": [1, "never"]
```

第一项 `1` 是严重度，第二项 `"never"` 是这条规则的选项。有些规则的选项是对象形式，比如 `"no-unused-vars": [2, { "vars": "all", "args": "none" }]`。选项支持什么值只能查官方文档，每条规则都不一样。

## 七、一份逐条注释的完整规则清单

下面这份是我最早整理的那套完整规则配置，按 ESLint 官方的分类拆成了几段。它的价值不在于照抄，而在于当你不确定某条规则是干什么的时候，可以在这里扫一眼。

我的建议是别把这份配置整个复制到项目里。规则数量不是越多越好，一份两百条规则的配置，团队里没人记得住，最后的结果是所有人都在写 `eslint-disable`。真正可用的做法是先 `extends` 一个成熟的 config 包，再从这份清单里挑十来条你们团队确实在意的补上去。

### 可能的错误

这一类管的是「基本上写错了」的代码，误报率最低，是最应该开成 `error` 的一批。

下面每段都是 `"rules"` 对象里的片段，实际使用时把它们合并进同一个 `rules` 里。

```js
        ////////////////
        // 可能的错误 //
        ////////////////

        // 禁止条件表达式中出现赋值操作符
        "no-cond-assign": 2,
        // 禁用 console
        "no-console": 0,
        // 禁止在条件中使用常量表达式
        // if (false) {
        // doSomethingUnfinished();
        // } //cuowu
        "no-constant-condition": 2,
        // 禁止在正则表达式中使用控制字符 ：new RegExp("\x1f")
        "no-control-regex": 2,
        // 数组和对象键值对最后一个逗号， never参数：不能带末尾的逗号, always参数：必须带末尾的逗号，
        // always-multiline：多行模式必须带逗号，单行模式不能带逗号
        "comma-dangle": [1, "never"],
        // 禁用 debugger
        "no-debugger": 2,
        // 禁止 function 定义中出现重名参数
        "no-dupe-args": 2,
        // 禁止对象字面量中出现重复的 key
        "no-dupe-keys": 2,
        // 禁止重复的 case 标签
        "no-duplicate-case": 2,
        // 禁止空语句块
        "no-empty": 2,
        // 禁止在正则表达式中使用空字符集 (/^abc[]/)
        "no-empty-character-class": 2,
        // 禁止对 catch 子句的参数重新赋值
        "no-ex-assign": 2,
        // 禁止不必要的布尔转换
        "no-extra-boolean-cast": 2,
        // 禁止不必要的括号 //(a * b) + c;//报错
        "no-extra-parens": 0,
        // 禁止不必要的分号
        "no-extra-semi": 2,
        // 禁止对 function 声明重新赋值
        "no-func-assign": 2,
```

这一段里 `comma-dangle` 和 `no-extra-parens` 是唯二偏风格的，其余都是实打实的错误。`no-constant-condition` 抓的是 `if (false)` 这种写了一半忘了改回来的调试代码，我自己就靠它拦下过好几次。`no-extra-parens` 设成 `0` 是对的，它会把 `(a * b) + c` 这种为了可读性加的括号也报出来，开着很烦人。

接着往下。

```js
        // 禁止在嵌套的块中出现 function 或 var 声明
        "no-inner-declarations": [2, "functions"],
        // 禁止 RegExp 构造函数中无效的正则表达式字符串
        "no-invalid-regexp": 2,
        // 禁止在字符串和注释之外不规则的空白
        "no-irregular-whitespace": 2,
        // 禁止在 in 表达式中出现否定的左操作数
        "no-negated-in-lhs": 2,
        // 禁止把全局对象 (Math 和 JSON) 作为函数调用 错误：var math = Math();
        "no-obj-calls": 2,
        // 禁止直接使用 Object.prototypes 的内置属性
        "no-prototype-builtins": 0,
        // 禁止正则表达式字面量中出现多个空格
        "no-regex-spaces": 2,
        // 禁用稀疏数组
        "no-sparse-arrays": 2,
        // 禁止出现令人困惑的多行表达式
        "no-unexpected-multiline": 2,
        // 禁止在return、throw、continue 和 break语句之后出现不可达代码
        "no-unreachable": 2,
        // 要求使用 isNaN() 检查 NaN
        "use-isnan": 2,
        // 强制使用有效的 JSDoc 注释
        "valid-jsdoc": 1,
        // 强制 typeof 表达式与有效的字符串进行比较
        // typeof foo === "undefimed" 错误
        "valid-typeof": 2,
```

这一段里有两条要按现在的情况修正一下。`no-negated-in-lhs` 早就被标记为弃用，替代品是 `no-unsafe-negation`，它除了 `in` 还能覆盖 `instanceof`；`valid-jsdoc` 同样处于弃用状态，ESLint 9 里已经把它移除了，JSDoc 相关的检查现在交给 `eslint-plugin-jsdoc`。老配置照抄的话，在 ESLint 9 上会直接报「规则不存在」。

`valid-typeof` 那条注释里的 `"undefimed"` 不是笔误，它就是在举反例，把 `undefined` 拼错正是这条规则要抓的东西。

### 最佳实践

这一类是「能跑但不该这么写」，主观性开始变强，也是团队里最容易吵起来的一批。

```js
        //////////////
        // 最佳实践 //
        //////////////

        // 定义对象的set存取器属性时，强制定义get
        "accessor-pairs": 2,
        // 强制数组方法的回调函数中有 return 语句
        "array-callback-return": 0,
        // 强制把变量的使用限制在其定义的作用域范围内
        "block-scoped-var": 0,
        // 限制圈复杂度，也就是类似if else能连续接多少个
        "complexity": [2, 9],
        // 要求 return 语句要么总是指定返回的值，要么不指定
        "consistent-return": 0,
        // 强制所有控制语句使用一致的括号风格
        "curly": [2, "all"],
        // switch 语句强制 default 分支，也可添加 // no default 注释取消此次警告
        "default-case": 2,
        // 强制object.key 中 . 的位置，参数:
        // property，'.'号应与属性在同一行
        // object, '.' 号应与对象名在同一行
        "dot-location": [2, "property"],
        // 强制使用.号取属性
        // 参数： allowKeywords：true 使用保留字做属性名时，只能使用.方式取属性
        // false 使用保留字做属性名时, 只能使用[]方式取属性 e.g [2, {"allowKeywords": false}]
        // allowPattern: 当属性名匹配提供的正则表达式时，允许使用[]方式取值,否则只能用.号取值 e.g [2, {"allowPattern": "^[a-z]+(_[a-z]+)+$"}]
        "dot-notation": [2, {
            "allowKeywords": false
        }],
        // 使用 === 替代 == allow-null允许null和undefined==
        "eqeqeq": [2, "allow-null"],
        // 要求 for-in 循环中有一个 if 语句
        "guard-for-in": 2,
```

`complexity: [2, 9]` 这条值得单独说。它限制的是圈复杂度，一个函数里 `if`、`for`、`&&`、`?:` 每多一个分支就加一分，超过 9 就报错。数值定多少没有标准答案，我见过定 10 的也见过定 20 的，关键是定了之后别轻易往上调，一调就等于放弃了这条线。顺带提一句，ESLint 9 把可选链 `?.` 和解构参数默认值也算进复杂度了，老项目升上去以后一批函数会突然卡线。

`eqeqeq: [2, "allow-null"]` 是个折中写法，允许 `x == null` 这种同时判 `null` 和 `undefined` 的惯用法，其余场景必须全等。现在更常见的写法是 `["error", "always", { "null": "ignore" }]`，效果一样但语义更明确。

后面是一长串 `no-` 开头的禁令，先看和执行安全相关的。

```js
        // 禁用 alert、confirm 和 prompt
        "no-alert": 0,
        // 禁用 arguments.caller 或 arguments.callee
        "no-caller": 2,
        // 不允许在 case 子句中使用词法声明
        "no-case-declarations": 2,
        // 禁止除法操作符显式的出现在正则表达式开始的位置
        "no-div-regex": 2,
        // 禁止 if 语句中有 return 之后有 else
        "no-else-return": 0,
        // 禁止出现空函数.如果一个函数包含了一条注释，它将不会被认为有问题。
        "no-empty-function": 2,
        // 禁止使用空解构模式no-empty-pattern
        "no-empty-pattern": 2,
        // 禁止在没有类型检查操作符的情况下与 null 进行比较
        "no-eq-null": 1,
        // 禁用 eval()
        "no-eval": 2,
        // 禁止扩展原生类型
        "no-extend-native": 2,
        // 禁止不必要的 .bind() 调用
        "no-extra-bind": 2,
        // 禁用不必要的标签
        "no-extra-label": 0,
        // 禁止 case 语句落空
        "no-fallthrough": 2,
        // 禁止数字字面量中使用前导和末尾小数点
        "no-floating-decimal": 2,
        // 禁止使用短符号进行类型转换(!!fOO)
        "no-implicit-coercion": 0,
        // 禁止在全局范围内使用 var 和命名的 function 声明
        "no-implicit-globals": 1,
        // 禁止使用类似 eval() 的方法
        "no-implied-eval": 2,
        // 禁止 this 关键字出现在类和类对象之外
        "no-invalid-this": 0,
        // 禁用 __iterator__ 属性
        "no-iterator": 2,
        // 禁用标签语句
        "no-labels": 2,
```

这一段里 `no-eval`、`no-implied-eval`、`no-extend-native` 三条是安全底线，任何项目都该开成 `error`。`no-implied-eval` 抓的是 `setTimeout("doSomething()", 100)` 这种传字符串的写法，它和 `eval` 一样会走一遍解析器。

这里有个小笔误我顺手改了，`"no-extra-label:"` 的键名多带了一个冒号。这种错在 eslintrc 时代很难发现，因为 ESLint 对不认识的规则名是直接报错的，但键名带冒号会被当成另一个规则名，报的错是「Definition for rule 'no-extra-label:' was not found」，很多人扫一眼以为是规则不存在就把整行删了。

`no-implicit-globals` 设成 `1` 只是警告，我倾向于在模块化项目里直接关掉。用了 `sourceType: "module"` 之后每个文件本来就有自己的作用域，顶层声明根本到不了全局，这条规则基本只在传统 script 项目里有意义。

再往下是一批更细的禁令。

```js
        // 禁用不必要的嵌套块
        "no-lone-blocks": 2,
        // 禁止在循环中出现 function 声明和表达式
        "no-loop-func": 1,
        // 禁用魔术数字(3.14什么的用常量代替)
        "no-magic-numbers": [1, {
            "ignore": [0, -1, 1]
        }],
        // 禁止使用多个空格
        "no-multi-spaces": 2,
        // 禁止使用多行字符串，在 JavaScript 中，可以在新行之前使用斜线创建多行字符串
        "no-multi-str": 2,
        // 禁止对原生对象赋值
        "no-native-reassign": 2,
        // 禁止在非赋值或条件语句中使用 new 操作符
        "no-new": 2,
        // 禁止对 Function 对象使用 new 操作符
        "no-new-func": 0,
        // 禁止对 String，Number 和 Boolean 使用 new 操作符
        "no-new-wrappers": 2,
        // 禁用八进制字面量
        "no-octal": 2,
        // 禁止在字符串中使用八进制转义序列
        "no-octal-escape": 2,
        // 不允许对 function 的参数进行重新赋值
        "no-param-reassign": 0,
        // 禁用 __proto__ 属性
        "no-proto": 2,
        // 禁止使用 var 多次声明同一变量
        "no-redeclare": 2,
        // 禁用指定的通过 require 加载的模块
        "no-return-assign": 0,
        // 禁止使用 javascript: url
        "no-script-url": 0,
        // 禁止自我赋值
        "no-self-assign": 2,
        // 禁止自身比较
        "no-self-compare": 2,
```

`no-magic-numbers` 这条我踩过。它默认会把代码里所有裸数字都报出来，`setTimeout(fn, 300)` 里的 `300` 也算，开成 `error` 之后整个项目一片红。这里用 `[1, { "ignore": [0, -1, 1] }]` 只报警告并放过最常见的三个值，是个比较务实的配置。

`no-native-reassign` 现在的名字叫 `no-global-assign`，前者是弃用别名，ESLint 9 里已经移除。同一批被改名的还有 `no-negated-in-lhs`，前面提过。

剩下这几条偏收尾。

```js
        // 禁用逗号操作符
        "no-sequences": 2,
        // 禁止抛出非异常字面量
        "no-throw-literal": 2,
        // 禁用一成不变的循环条件
        "no-unmodified-loop-condition": 2,
        // 禁止出现未使用过的表达式
        "no-unused-expressions": 0,
        // 禁用未使用过的标签
        "no-unused-labels": 2,
        // 禁止不必要的 .call() 和 .apply()
        "no-useless-call": 2,
        // 禁止不必要的字符串字面量或模板字面量的连接
        "no-useless-concat": 2,
        // 禁用不必要的转义字符
        "no-useless-escape": 0,
        // 禁用 void 操作符
        "no-void": 0,
        // 禁止在注释中使用特定的警告术语
        "no-warning-comments": 0,
        // 禁用 with 语句
        "no-with": 2,
        // 强制在parseInt()使用基数参数
        "radix": 2,
        // 要求所有的 var 声明出现在它们所在的作用域顶部
        "vars-on-top": 0,
        // 要求 IIFE 使用括号括起来
        "wrap-iife": [2, "any"],
        // 要求或禁止 "Yoda" 条件
        "yoda": [2, "never"],
        // 要求或禁止使用严格模式指令
        "strict": 0,
```

`strict` 设成 `0` 是对的。用了 `sourceType: "module"` 之后代码天然处于严格模式，再写 `'use strict'` 反而会被某些配置报成多余。

### 变量声明

这一类里 `no-undef` 和 `no-unused-vars` 是绝对主力，剩下的多数项目都用不上。

```js
        //////////////
        // 变量声明 //
        //////////////

        // 要求或禁止 var 声明中的初始化(初值)
        "init-declarations": 0,
        // 不允许 catch 子句的参数与外层作用域中的变量同名
        "no-catch-shadow": 0,
        // 禁止删除变量
        "no-delete-var": 2,
        // 不允许标签与变量同名
        "no-label-var": 2,
        // 禁用特定的全局变量
        "no-restricted-globals": 0,
        // 禁止 var 声明 与外层作用域的变量同名
        "no-shadow": 0,
        // 禁止覆盖受限制的标识符
        "no-shadow-restricted-names": 2,
        // 禁用未声明的变量，除非它们在 /*global */ 注释中被提到
        "no-undef": 2,
        // 禁止将变量初始化为 undefined
        "no-undef-init": 2,
        // 禁止将 undefined 作为标识符
        "no-undefined": 0,
        // 禁止出现未使用过的变量
        "no-unused-vars": [2, {
            "vars": "all",
            "args": "none"
        }],
        // 不允许在变量定义之前使用它们
        "no-use-before-define": 0
```

`no-unused-vars` 的 `args: "none"` 表示完全不检查函数参数。这个设置很宽松，好处是 Express 那种 `(req, res, next)` 里没用到的参数不会报错，坏处是真正多余的参数也发现不了。更常用的是 `args: "after-used"`，只报最后一个没用到的参数。

这条规则在 ESLint 9 里有个静默变化，`caughtErrors` 的默认值从 `"none"` 改成了 `"all"`，也就是说所有 `catch (e) {}` 里没用到 `e` 的地方全都开始报错。老项目升级完发现错误数暴涨，八成就是这里，详细情况我在 [ESLint 9 新特性、重大变化与从 8 升级的完整攻略](https://feinterview.poetries.top/blog/eslint-9-upgrade-guide) 里展开过。

`no-catch-shadow` 也是弃用规则之一，它当年是为了兼容 IE8 的 catch 作用域行为，现在没有存在意义。

### Node.js 与 CommonJS

这一组只在 Node 端代码里有用，纯前端项目全部关掉也不影响。

```js
        //////////////////////////
        // Node.js and CommonJS //
        //////////////////////////

        // require return statements after callbacks
        "callback-return": 0,
        // 要求 require() 出现在顶层模块作用域中
        "global-require": 1,
        // 要求回调函数中有容错处理
        "handle-callback-err": [2, "^(err|error)$"],
        // 禁止混合常规 var 声明和 require 调用
        "no-mixed-requires": 0,
        // 禁止调用 require 时使用 new 操作符
        "no-new-require": 2,
        // 禁止对 __dirname 和 __filename进行字符串连接
        "no-path-concat": 0,
        // 禁用 process.env
        "no-process-env": 0,
        // 禁用 process.exit()
        "no-process-exit": 0,
        // 禁用同步方法
        "no-sync": 0
```

这组规则现在都从 ESLint 核心里搬走了。`callback-return`、`global-require`、`handle-callback-err`、`no-mixed-requires`、`no-new-require`、`no-path-concat`、`no-process-env`、`no-process-exit`、`no-sync` 这一整批在 ESLint 7 时期被标记弃用，官方建议改用 `eslint-plugin-n`（早期叫 `eslint-plugin-node`）里的同名规则。老配置留着它们在 ESLint 8 上还能跑，到 9 就要动手了。

`handle-callback-err` 的参数 `"^(err|error)$"` 是一个正则，用来识别哪个参数名算错误参数。这种「回调第一个参数是 error」的约定在 async/await 普及之后基本退场了，新代码用 try/catch 就够。

### 风格指南

这是条目最多的一类，也是最没必要逐条纠结的一类。缩进、引号、分号这些，交给格式化工具比在 ESLint 里配划算得多，理由我在另一篇里说了。

```js
        //////////////
        // 风格指南 //
        //////////////

        // 指定数组的元素之间要以空格隔开(, 后面)， never参数：[ 之前和 ] 之后不能带空格，always参数：[ 之前和 ] 之后必须带空格
        "array-bracket-spacing": [2, "never"],
        // 禁止或强制在单行代码块中使用空格(禁用)
        "block-spacing": [1, "never"],
        //强制使用一致的缩进 第二个参数为 "tab" 时，会使用tab，
        // if while function 后面的{必须与if在同一行，java风格。
        "brace-style": [2, "1tbs", {
            "allowSingleLine": true
        }],
        // 双峰驼命名格式
        "camelcase": 2,
        // 控制逗号前后的空格
        "comma-spacing": [2, {
            "before": false,
            "after": true
        }],
        // 控制逗号在行尾出现还是在行首出现 (默认行尾)
        // http://eslint.org/docs/rules/comma-style
        "comma-style": [2, "last"],
        //"SwitchCase" (默认：0) 强制 switch 语句中的 case 子句的缩进水平
        // 以方括号取对象属性时，[ 后面和 ] 前面是否需要空格, 可选参数 never, always
        "computed-property-spacing": [2, "never"],
        // 用于指统一在回调函数中指向this的变量名，箭头函数中的this已经可以指向外层调用者，应该没卵用了
        // e.g [0,"that"] 指定只能 var that = this. that不能指向其他任何值，this也不能赋值给that以外的其他值
        "consistent-this": [1, "that"],
        // 强制使用命名的 function 表达式
        "func-names": 0,
        // 文件末尾强制换行
        "eol-last": 2,
        "indent": [2, 4, {
            "SwitchCase": 1
        }],
        // 强制在对象字面量的属性中键和值之间使用一致的间距
        "key-spacing": [2, {
            "beforeColon": false,
            "afterColon": true
        }],
        // 强制使用一致的换行风格
        "linebreak-style": [1, "unix"],
        // 要求在注释周围有空行 ( 要求在块级注释之前有一空行)
        "lines-around-comment": [1, {
            "beforeBlockComment": true
        }],
```

`indent: [2, 4, { "SwitchCase": 1 }]` 里的 `SwitchCase: 1` 容易漏。不写这一项的话，`switch` 里的 `case` 默认不缩进，和 `switch` 顶格对齐，很多人第一次配完 `indent` 都被这个默认值搞过。

`consistent-this: [1, "that"]` 是个时代产物。它规定回调里保存 `this` 的变量只能叫 `that`，因为当年满地都是 `var self = this` 和 `var _this = this` 混着写。箭头函数普及之后这条基本可以关掉了，上面注释里那句「应该没卵用了」说得挺实在。

接着是命名和长度限制这一批。

```js
        // 强制一致地使用函数声明或函数表达式，方法定义风格，参数：
        // declaration: 强制使用方法声明的方式，function f(){} e.g [2, "declaration"]
        // expression：强制使用方法表达式的方式，var f = function() {} e.g [2, "expression"]
        // allowArrowFunctions: declaration风格中允许箭头函数。 e.g [2, "declaration", { "allowArrowFunctions": true }]
        "func-style": 0,
        // 强制回调函数最大嵌套深度 5层
        "max-nested-callbacks": [1, 5],
        // 禁止使用指定的标识符
        "id-blacklist": 0,
        // 强制标识符的最新和最大长度
        "id-length": 0,
        // 要求标识符匹配一个指定的正则表达式
        "id-match": 0,
        // 强制在 JSX 属性中一致地使用双引号或单引号
        "jsx-quotes": 0,
        // 强制在关键字前后使用一致的空格 (前后腰需要)
        "keyword-spacing": 2,
        // 强制一行的最大长度
        "max-len": [1, 200],
        // 强制最大行数
        "max-lines": 0,
        // 强制 function 定义中最多允许的参数数量
        "max-params": [1, 7],
        // 强制 function 块最多允许的的语句数量
        "max-statements": [1, 200],
        // 强制每一行中所允许的最大语句数量
        "max-statements-per-line": 0,
        // 要求构造函数首字母大写 （要求调用 new 操作符时有首字母大小的函数，允许调用首字母大写的函数时没有 new 操作符。）
        "new-cap": [2, {
            "newIsCap": true,
            "capIsNew": false
        }],
        // 要求调用无参构造函数时有圆括号
        "new-parens": 2,
        // 要求或禁止 var 声明语句后有一行空行
        "newline-after-var": 0,
        // 禁止使用 Array 构造函数
        "no-array-constructor": 2,
        // 禁用按位运算符
        "no-bitwise": 0,
        // 要求 return 语句之前有一空行
        "newline-before-return": 0,
        // 要求方法链中每个调用都有一个换行符
        "newline-per-chained-call": 1,
```

`max-len: [1, 200]` 这个 200 定得相当宽松。常见取值是 100 或 120，超过就该换行。定 200 基本等于没限制，好处是不会天天被打断，坏处是 code review 的时候得横向滚动。

`max-statements: [1, 200]` 同理，一个函数两百条语句还不报警，这条形同虚设。我的看法是这类阈值规则要么定一个真会触发的值，要么干脆关掉，定一个永远碰不到的数字只会给人一种「我们管了」的错觉。

`newline-after-var` 现在是弃用规则，替代品是更通用的 `padding-line-between-statements`，后者能表达「import 之后空一行」「return 之前空一行」这类更细的要求。

下面是空白和换行相关的一批。

```js
        // 禁用 continue 语句
        "no-continue": 0,
        // 禁止在代码行后使用内联注释
        "no-inline-comments": 0,
        // 禁止 if 作为唯一的语句出现在 else 语句中
        "no-lonely-if": 0,
        // 禁止混合使用不同的操作符
        "no-mixed-operators": 0,
        // 不允许空格和 tab 混合缩进
        "no-mixed-spaces-and-tabs": 2,
        // 不允许多个空行
        "no-multiple-empty-lines": [2, {
            "max": 2
        }],
        // 不允许否定的表达式
        "no-negated-condition": 0,
        // 不允许使用嵌套的三元表达式
        "no-nested-ternary": 0,
        // 禁止使用 Object 的构造函数
        "no-new-object": 2,
        // 禁止使用一元操作符 ++ 和 --
        "no-plusplus": 0,
        // 禁止使用特定的语法
        "no-restricted-syntax": 0,
        // 禁止 function 标识符和括号之间出现空格
        "no-spaced-func": 2,
        // 不允许使用三元操作符
        "no-ternary": 0,
        // 禁用行尾空格
        "no-trailing-spaces": 2,
        // 禁止标识符中有悬空下划线_bar
        "no-underscore-dangle": 0,
        // 禁止可以在有更简单的可替代的表达式时使用三元操作符
        "no-unneeded-ternary": 2,
        // 禁止属性前有空白
        "no-whitespace-before-property": 0,
        // 强制花括号内换行符的一致性
        "object-curly-newline": 0,
        // 强制在花括号中使用一致的空格
        "object-curly-spacing": 0,
        // 强制将对象的属性放在不同的行上
        "object-property-newline": 0,
```

`no-spaced-func` 也已经改名，现在叫 `func-call-spacing`。它管的是 `foo ()` 这种函数名和括号之间的多余空格。

这一段里大部分设成 `0` 的规则，关掉是对的。`no-nested-ternary`、`no-plusplus`、`no-underscore-dangle` 这几条争议大到不适合团队强制，开着只会制造无谓的讨论。

最后一批是空格、引号、分号。

```js
        // 强制函数中的变量要么一起声明要么分开声明
        "one-var": [2, {
            "initialized": "never"
        }],
        // 要求或禁止在 var 声明周围换行
        "one-var-declaration-per-line": 0,
        // 要求或禁止在可能的情况下要求使用简化的赋值操作符
        "operator-assignment": 0,
        // 强制操作符使用一致的换行符
        "operator-linebreak": [2, "after", {
            "overrides": {
                "?": "before",
                ":": "before"
            }
        }],
        // 要求或禁止块内填充
        "padded-blocks": 0,
        // 要求对象字面量属性名称用引号括起来
        "quote-props": 0,
        // 强制使用一致的反勾号、双引号或单引号
        "quotes": [2, "double", "avoid-escape"],
        // 要求使用 JSDoc 注释
        "require-jsdoc": 1,
        // 要求或禁止使用分号而不是 ASI（这个才是控制行尾部分号的，）
        "semi": [2, "always"],
        // 强制分号之前和之后使用一致的空格
        "semi-spacing": 0,
        // 要求同一个声明块中的变量按顺序排列
        "sort-vars": 0,
        // 强制在块之前使用一致的空格
        "space-before-blocks": [2, "always"],
        // 强制在 function的左括号之前使用一致的空格
        "space-before-function-paren": [0, "always"],
        // 强制在圆括号内使用一致的空格
        "space-in-parens": [2, "never"],
        // 要求操作符周围有空格
        "space-infix-ops": 2,
        // 强制在一元操作符前后使用一致的空格
        "space-unary-ops": [2, {
            "words": true,
            "nonwords": false
        }],
        // 强制在注释中 // 或 /* 使用一致的空格
        "spaced-comment": [2, "always", {
            "markers": ["global", "globals", "eslint", "eslint-disable", "*package", "!"]
        }],
        // 要求或禁止 Unicode BOM
        "unicode-bom": 0,
        // 要求正则表达式被括号括起来
        "wrap-regex": 0
```

`quotes: [2, "double", "avoid-escape"]` 这里的第三个参数是老写法，现在应该写成 `[2, "double", { "avoidEscape": true }]`。作用一样，允许字符串里本身含双引号时改用单引号，省掉转义。

`require-jsdoc` 和前面的 `valid-jsdoc` 一样已经从 ESLint 里移除，要做 JSDoc 校验得装 `eslint-plugin-jsdoc`。

整个「风格指南」这一类还有个更大的变化。ESLint 从 8.53 开始把所有纯格式化规则标记为弃用，不再接受新特性和 bug 修复，官方推荐迁移到 `@stylistic/eslint-plugin`。这些规则在 ESLint 9 里还能用，但方向已经很明确了，格式化这件事 ESLint 不打算继续管。

### ES6 相关

最后这一类跟着 ES2015 加进来的语法走。

```js
        //////////////
        // ES6.相关 //
        //////////////

        // 控制箭头函数体是否使用大括号，默认选项 as-needed 表示能省则省
        "arrow-body-style": 2,
        // 要求箭头函数的参数使用圆括号
        "arrow-parens": 2,
        "arrow-spacing": [2, {
            "before": true,
            "after": true
        }],
        // 强制在子类构造函数中用super()调用父类构造函数，TypeScrip的编译器也会提示
        "constructor-super": 0,
        // 强制 generator 函数中 * 号周围使用一致的空格
        "generator-star-spacing": [2, {
            "before": true,
            "after": true
        }],
        // 禁止修改类声明的变量
        "no-class-assign": 2,
        // 不允许箭头功能，在那里他们可以混淆的比较
        "no-confusing-arrow": 0,
        // 禁止修改 const 声明的变量
        "no-const-assign": 2,
        // 禁止类成员中出现重复的名称
        "no-dupe-class-members": 2,
        // 不允许复制模块的进口
        "no-duplicate-imports": 0,
        // 禁止 Symbol 的构造函数
        "no-new-symbol": 2,
```

`no-const-assign`、`no-class-assign`、`no-this-before-super`、`no-dupe-class-members` 这四条都是纯粹的错误检查，没有讨价还价的余地，全开 `error`。用 TypeScript 的话编译器本来也会拦，但 ESLint 这层多一道保险不亏。

剩下这一批是「建议用新写法」，主观性强，这里基本都设成了 `0`。

```js
        // 允许指定模块加载时的进口
        "no-restricted-imports": 0,
        // 禁止在构造函数中，在调用 super() 之前使用 this 或 super
        "no-this-before-super": 2,
        // 禁止不必要的计算性能键对象的文字
        "no-useless-computed-key": 0,
        // 要求使用 let 或 const 而不是 var
        "no-var": 0,
        // 要求或禁止对象字面量中方法和属性使用简写语法
        "object-shorthand": 0,
        // 要求使用箭头函数作为回调
        "prefer-arrow-callback": 0,
        // 要求使用 const 声明那些声明后不再被修改的变量
        "prefer-const": 0,
        // 要求在合适的地方使用 Reflect 方法
        "prefer-reflect": 0,
        // 要求使用扩展运算符而非 .apply()
        "prefer-spread": 0,
        // 要求使用模板字面量而非字符串连接
        "prefer-template": 0,
        // Suggest using the rest parameters instead of arguments
        "prefer-rest-params": 0,
        // 要求generator 函数内有 yield
        "require-yield": 0,
        // enforce spacing between rest and spread operators and their expressions
        "rest-spread-spacing": 0,
        // 强制模块内的 import 排序
        "sort-imports": 0,
        // 要求或禁止模板字符串中的嵌入表达式周围空格的使用
        "template-curly-spacing": 1,
        // 强制在 yield* 表达式中 * 周围使用空格
        "yield-star-spacing": 2
```

`no-var` 和 `prefer-const` 这两条在 2018 年设成 `0` 情有可原，那会儿存量 `var` 太多，一开就是几千条报错。现在新项目里我会把它们直接开成 `error`，`prefer-const` 还能自动修复，成本很低。

`prefer-reflect` 已经从 ESLint 里移除了，`Reflect` 那套 API 并没有像当年预期的那样取代传统写法。

到这里整份配置就过完了。回到最开始的问题，看懂每个字段之后，改配置就不再是碰运气了。

## 八、overrides 给不同目录配不同规则

一个项目里往往有好几类代码，业务代码跑在浏览器、构建脚本跑在 Node、测试文件里有一堆 `describe`。全都用一套规则要么太松要么太紧。`overrides` 就是干这个的。

```js
// .eslintrc.json 片段
{
    "env": { "browser": true },
    "rules": { "no-console": "error" },
    "overrides": [
        {
            "files": ["scripts/**/*.js", "*.config.js"],
            "env": { "node": true },
            "rules": { "no-console": "off" }
        },
        {
            "files": ["**/*.test.js"],
            "env": { "mocha": true },
            "rules": { "no-magic-numbers": "off" }
        }
    ]
}
```

`files` 接受 glob 数组，还有个 `excludedFiles` 可以做排除。`overrides` 数组本身也是有顺序的，同一个文件命中多项时，后面的覆盖前面的。

有个细节容易忽略。`overrides` 里的配置永远比同一份文件里的顶层配置优先，跟写在前面还是后面无关。所以你不能指望在 `overrides` 后面再写一条顶层 `rules` 去盖住它。

回到前面第二节说的那个建议，根目录只开 `browser`，构建脚本在 `overrides` 里单独开 `node`，就是这么落地的。

## 九、多份配置叠在一起时谁说了算

这一节是排查「我改了但没生效」的关键。ESLint 的合并优先级从低到高是这样一条链。

| 优先级 | 来源 |
|--------|------|
| 最低 | 上级目录的 `.eslintrc.*`（级联查找到的） |
| ↓ | 本目录 `extends` 里排在前面的配置包 |
| ↓ | 本目录 `extends` 里排在后面的配置包 |
| ↓ | 本目录自己写的 `rules` |
| ↓ | 本目录 `overrides` 里命中的配置项 |
| 最高 | 文件内的 `/* eslint */` 注释 |

有几条推论值得记住。`extends` 数组里越靠后的包越有话语权，这就是为什么 `eslint-config-prettier` 必须放在最后一位，它的全部作用就是把前面那些包开启的格式化规则统统关掉。

另外，规则选项的合并不是深合并。你在自己的 `rules` 里写 `"no-unused-vars": ["error", { "args": "none" }]`，整条规则的配置会被完整替换，而不是和 `extends` 里的选项对象做合并。想在别人的基础上只改一个选项，只能把完整的选项对象重写一遍。

拿不准最终生效的是哪一条时，别猜，直接跑 `npx eslint --print-config src/index.js`，它会把某个文件最终合并出来的完整配置打印出来。我排查这类问题基本都是从这条命令开始的。

## 十、行内注释临时关掉校验

配置层面之外，还有一层是文件内的注释。它优先级最高，能盖掉一切配置，所以要克制着用。

关闭整段校验，写在文件或代码块开头。

```
/* eslint-disable */
```

关闭当前这一行。

```
some code // eslint-disable-line
```

关闭下一行。

```
// eslint-disable-next-line
some code
```

这三种写法后面都可以跟具体的规则名，比如 `// eslint-disable-next-line no-console`，只关这一条而不是全关。我强烈建议永远带上规则名，光秃秃的 `/* eslint-disable */` 等于把整个文件从校验里摘出去，后面加进来的问题一个都发现不了。

还有一条实用配置叫 `reportUnusedDisableDirectives`，打开之后那些已经不需要的 `eslint-disable` 注释会被报出来。代码改过之后遗留的 disable 注释是常见的技术债，靠人工是清不干净的。

行内注释也能开规则，比如 `/* eslint no-console: "error" */`。这个用法在 ESLint 9 里有个变化，同一条规则写了多个 `/* eslint */` 注释时，以前是最后一个生效，现在是第一个生效并且其余的直接报错。

## 十一、这些字段在扁平配置里对应成了什么

ESLint 9 把扁平配置（`eslint.config.js`）变成了默认，`.eslintrc.*` 那一套正式退居二线。前面讲的字段大半都换了位置，对着看一遍最快。

| eslintrc 字段 | 扁平配置里的对应 |
|---------------|------------------|
| `env` | 没有对应字段，改用 `globals` 包展开进 `languageOptions.globals` |
| `globals` | `languageOptions.globals` |
| `parserOptions.ecmaVersion` / `sourceType` | 提到 `languageOptions` 顶层 |
| `parserOptions.ecmaFeatures` | `languageOptions.parserOptions.ecmaFeatures` |
| `parser`（字符串包名） | `languageOptions.parser`，传 import 进来的对象 |
| `plugins`（字符串数组） | `plugins` 对象，键是前缀名，值是插件对象 |
| `extends` | 没有这个字段，把配置对象展开进数组 |
| `overrides` | 没有这个字段，数组里多写一项带 `files` 的配置就是 |
| `root: true` | 不需要，扁平配置本来就不做级联查找 |
| `.eslintignore` 文件 | `ignores` 字段 |
| `rules` | 还叫 `rules`，写法不变 |

把本文前面那份配置翻译成扁平配置，大概长这样。

```js
// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactPlugin from 'eslint-plugin-react'

export default [
  // 只有 ignores 的配置项等于全局忽略，用来替代 .eslintignore
  { ignores: ['dist/**', 'coverage/**'] },

  js.configs.recommended,

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.mocha },
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    plugins: { react: reactPlugin },
    rules: {
      'no-cond-assign': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }]
    }
  },

  // 这一项相当于旧配置里的 overrides
  {
    files: ['scripts/**/*.js', '*.config.js'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-console': 'off' }
  }
]
```

几个升级时最容易翻车的点，挨个说。

`env` 消失这件事影响面最广。以前 `env: { browser: true }` 一行搞定的事，现在要装 `globals` 这个 npm 包，写成 `globals: { ...globals.browser }`。忘了这一步的症状是满屏 `'window' is not defined`。

`.eslintignore` 不再被读取。文件还在，内容还在，ESLint 就是不看它。表现是 `dist/` 突然开始被检查，报出成千上万条错误。要把内容搬进一个只有 `ignores` 的配置项里。

`extends` 变成了数组展开。`js.configs.recommended` 直接作为数组一项放进去，插件的推荐集也是同理。ESLint 后续版本又围绕 `defineConfig` 补了一些写法上的便利，这块变动比较快，以官方迁移文档为准。

`--ext` 参数的行为也变了。扁平配置下检查范围由配置里的 `files` 决定，`package.json` 里那句 `eslint . --ext .js,.ts` 需要重写。具体到你装的那个 9.x 小版本对这个参数怎么处理，跑一次 `npx eslint --help` 看输出最准。

想看完整的升级步骤和破坏性变更清单，可以翻我那篇 [ESLint 9 升级攻略](https://feinterview.poetries.top/blog/eslint-9-upgrade-guide)；想看一份跑在 Next.js 项目上、从零写起的扁平配置，看 [基于 ESLint 9 配置前端开发规范](https://feinterview.poetries.top/blog/eslint9-nextjs16-setup-guide)。

最后提一句，`npx eslint --inspect-config` 是扁平配置时代的 `--print-config`，它会开一个可视化界面，告诉你某个文件命中了数组里的哪几项、每条规则的最终值来自哪一项。配置写复杂之后，跑它比逐行读代码快太多。

## 总结

这份配置文件真正需要记住的其实只有一条主线，谁在提供变量、谁在决定解析方式、谁在注册规则、谁在开启规则、谁能覆盖谁。

`env` 和 `globals` 提供变量，`parserOptions` 和 `parser` 决定解析，`plugins` 注册，`extends` 和 `rules` 开启，`overrides` 和行内注释做局部覆盖。搞清楚这五组，遇到任何一条规则不生效，都能顺着优先级链倒推回去，实在推不出来就上 `--print-config`。

规则清单那部分不用背。它的正确用法是当参考手册，需要的时候回来查一条，而不是整个抄进项目。真正的落地策略是先选一个成熟的 config 包打底，再按团队情况增删十几条。

至于扁平配置，字段是换了位置，但这条主线一点没变。反倒因为把继承变成了数组展开，「谁覆盖谁」比以前更容易看清楚。老项目不用急着迁，但新起的项目没必要再写 `.eslintrc` 了。

## 参考

- [ESLint 配置文件文档](https://eslint.org/docs/latest/use/configure/configuration-files)
- [ESLint v8 时代的 eslintrc 文档](https://eslint.org/docs/v8.x/use/configure/configuration-files)
- [ESLint 规则总表](https://eslint.org/docs/latest/rules/)
- [ESLint 官方迁移到 9.0.0 指南](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [globals npm 包](https://www.npmjs.com/package/globals)
- [前端进阶之旅](https://interview.poetries.top)
