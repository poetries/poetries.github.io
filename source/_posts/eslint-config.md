---
title: ESLint 常用配置与团队落地 从规则集到 CI 卡口
description: ESLint 常用配置怎么挑、怎么在团队里推得动。一份最小规则集、主流 config 包取舍、和 Prettier 的分工、--fix 与 lint-staged 增量检查、CI 卡口和严格度推进节奏。
date: 2018-01-27 22:41:24
tags: 
  - 规范
  - eslint
  - Prettier
  - 前端工程化
categories: Front-End
---

规范文档写得再全，落地一个月之后代码里还是四五种风格。原因不复杂，文档只是写在那儿，没有任何东西在拦。

ESLint 的价值不在于它有多少条规则，而在于它是少数能在保存、提交、构建三个环节把不合规代码挡回去的工具。这篇不逐字段讲配置文件的语法，那部分我另写了一篇；这篇只聊落地。一份最小可用的规则集长什么样、要不要用现成的 config 包、和 Prettier 怎么分工、`--fix` 能修到什么程度、lint-staged 怎么做增量、CI 上卡在哪一步、规则从松到严怎么推。那两份规则清单一条没删，放在后面当速查表，并且标注了哪些在新版本里已经改名或移除。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 三类规则的性质不同，该用什么态度对待
- 一份能直接抄进项目的最小规则集，以及每条为什么这么定
- 主流 config 包怎么选，airbnb、standard、typescript-eslint 各适合谁
- 和 Prettier 的分工线画在哪，为什么现在不推荐 `eslint-plugin-prettier`
- `--fix` 能自动修什么，不能修什么，大规模修复怎么提交
- lint-staged 做增量检查的完整配置和常见坑
- CI 卡口设在哪一步，`--max-warnings` 和 `--cache` 怎么用
- 规则严格度从 off 到 error 的推进节奏
- 一份带修正标注的常用规则速查表
- 迁到 ESLint 9 扁平配置之后，上面这些方案要改哪里

## 一、先分清三类规则

配置之前先分清楚 ESLint 的规则其实是三种不同性质的东西，混在一起谈就会吵不完。

第一类是「基本上写错了」。`no-dupe-keys`、`no-unreachable`、`no-const-assign` 这些，触发了几乎百分之百是 bug。这类规则没有讨论空间，全开 `error`。

第二类是「能跑但不该这么写」。`eqeqeq`、`no-eval`、`no-param-reassign` 属于这一档。它们有明确的理由，但也确实存在合理的例外，需要团队达成一致，个别地方允许带规则名的 `eslint-disable`。

第三类是纯格式。缩进、引号、分号、行宽，这一类完全是偏好问题，讨论它们的性价比最低。我的建议是整体交给 Prettier，ESLint 一条都别管，理由第四节展开。

分清这三类之后你会发现，团队里真正需要讨论的只有第二类，第一类照抄推荐集，第三类交给格式化工具。绝大多数关于「ESLint 配置」的争吵，都是在第三类上耗时间。

## 二、一份能直接用的最小规则集

先给一份能直接抄进项目的。这份规则不多，但每一条都是有实际约束力的。

```javascript
'rules': {
    // no-var
    'no-var': 'error',
    // 要求或禁止 var 声明中的初始化
    'init-declarations': 2,
    // 强制使用单引号
    'quotes': ['error', 'single'],
    // 要求或禁止使用分号而不是 ASI
    'semi': ['error', 'never'],
    // 禁止不必要的分号
    'no-extra-semi': 'error',
    // 强制使用一致的换行风格
    'linebreak-style': ['error', 'unix'],
    // 空格2个
    'indent': ['error', 2, {'SwitchCase': 1}],
    // 指定数组的元素之间要以空格隔开(,后面)， never参数：[ 之前和 ] 之后不能带空格，always参数：[ 之前和 ] 之后必须带空格
    'array-bracket-spacing': [2, 'never'],
    // 在块级作用域外访问块内定义的变量是否报错提示
    'block-scoped-var': 0,
    // if while function 后面的{必须与if在同一行，java风格。
    'brace-style': [2, '1tbs', {'allowSingleLine': true}],
    // 双峰驼命名格式
    'camelcase': 2,
    // 数组和对象键值对最后一个逗号， never参数：不能带末尾的逗号, always参数：必须带末尾的逗号， 
    'comma-dangle': [2, 'never'],
    // 控制逗号前后的空格
    'comma-spacing': [2, {'before': false, 'after': true}],
    // 控制逗号在行尾出现还是在行首出现
    'comma-style': [2, 'last'],
    // 圈复杂度
    'complexity': [2, 9],
    // 以方括号取对象属性时，[ 后面和 ] 前面是否需要空格, 可选参数 never, always
    'computed-property-spacing': [2, 'never'],
    // TODO 关闭 强制方法必须返回值，TypeScript强类型，不配置
    // 'consistent-return': 0
  }
```

这份配置里有几条值得单独说说。

`'no-var': 'error'` 加上 `'init-declarations': 2` 是一组。前者禁掉 `var`，后者要求声明变量时就给初值。两条一起的效果是逼你把变量声明尽量往使用处挪，而不是在函数顶部先声明一堆空变量。老项目上这两条会炸出很多报错，可以先设成 `1` 观察。

`'semi': ['error', 'never']` 是不写分号那一派。这个选择本身没有对错，但一旦定了就必须全项目统一，因为不写分号在少数场景下会踩到 ASI 的坑，比如下一行以 `(` 或 `[` 开头。团队里一半人写一半人不写才是最糟的情况。

`'quotes': ['error', 'single']` 和 `'indent': ['error', 2, {'SwitchCase': 1}]` 是典型的第三类规则。`SwitchCase: 1` 这个子选项别漏，不写的话 `case` 默认和 `switch` 顶格对齐。

`'complexity': [2, 9]` 限制圈复杂度，一个函数里的分支超过 9 个就报错。这条我挺推荐开的，它是少数能拦住「一个函数写八百行」的规则。顺带一提，ESLint 9 把可选链 `?.` 也算进复杂度了，老项目升上去会有一批函数突然卡线。

最后那两行被注释掉的 `consistent-return` 说明了一件事，用 TypeScript 之后有一批 ESLint 规则可以直接关掉，因为编译器管得更准。这个取舍在 TS 项目里很常见。

## 三、别从零开始，先挑一个 config 包

自己从零维护两百条规则是件吃力不讨好的事。规则会随着 ESLint 版本变动，改名的、弃用的、默认值改了的，靠人工跟不现实。更省事的做法是先 `extends` 一个成熟的配置包，再在上面增删十来条。

常见的几个选择，按我自己的使用感受列一下。

| 配置包 | 定位 | 我的感受 |
|--------|------|----------|
| `@eslint/js` 的 `recommended` | ESLint 官方最小推荐集 | 只包含第一类规则，零争议，任何项目都该垫在最底下 |
| `eslint-config-airbnb` / `airbnb-base` | 规则最全最严 | 上手就是几百条报错，适合新项目从头立规矩，老项目慎用 |
| `eslint-config-standard` | 观点很强，不写分号、两空格 | 省心，但风格是它说了算，改不动 |
| `typescript-eslint` 的 `recommended` | TS 项目基础 | TS 项目基本是必选，它会关掉一批被编译器覆盖的原生规则 |
| `eslint-config-next` | Next.js 项目自带 | 框架方维护，跟着框架版本走，省事 |
| `eslint-config-prettier` | 不加任何规则，只关规则 | 和 Prettier 一起用时必装，而且必须放在最后一位 |

选的时候有个判断标准比「哪个更好」实用得多：看这个包最近有没有在维护、有没有出扁平配置版本。ESLint 9 之后没跟上的包，会把你的升级路堵死。

`eslint-config-prettier` 那一行要特别注意顺序。它的全部作用就是把前面所有包开启的格式化规则统统关掉，所以放在 `extends` 数组的最后一位才有意义。放中间等于白装，我见过好几次。

## 四、和 Prettier 的分工线画在哪

这块是最容易配错的地方，也是我态度最明确的一块。

分工线其实很清楚。Prettier 管排版，它把代码重新打印一遍，缩进、换行、引号、分号全部由它决定；ESLint 管代码质量，未使用变量、可疑写法、复杂度、框架用法。两边职责不重叠，才不会互相打架。

问题在于 ESLint 自己也有一大堆格式化规则，它们会和 Prettier 的输出冲突。你保存时 Prettier 把代码格式化成 A，ESLint 立刻报错说应该是 B，来回拉锯。`eslint-config-prettier` 解决的就是这个，它把所有可能冲突的 ESLint 规则关掉，让格式这件事只剩一个说话的人。

那 `eslint-plugin-prettier` 呢。它的思路是把 Prettier 当成一条 ESLint 规则跑，格式不符就报成 lint 错误。听起来很整齐，一条命令搞定所有事。

我一开始也是这么配的，用下来的感受是不太值。Prettier 官方文档现在也不推荐这种用法，理由主要有几条：整段格式差异会被报成一堆红色的 lint 错误，噪音很大；Prettier 跑在 ESLint 里比单独跑慢；编辑器里的报错体验也别扭，明明保存一下就能修好的东西，却一直标着红波浪线。

现在更推荐的做法是让 Prettier 单独跑一条命令。

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

编辑器里配好保存自动 Prettier，提交前 lint-staged 里两条都跑一遍，CI 上 `format:check` 和 `lint` 各卡一道。职责分开之后，出问题也好定位，是格式问题还是质量问题一眼就知道。

顺着上面聊，ESLint 自己对格式化这件事的态度也变了。从 8.53 开始，ESLint 把所有纯格式化规则标记为弃用，不再接受新特性和 bug 修复，官方把它们迁到了独立的 `@stylistic/eslint-plugin`。方向已经很明确，格式化 ESLint 不打算继续管了。所以如果你还在纠结 `indent` 和 `quotes` 怎么配，可以直接跳过这一步。

## 五、--fix 能修什么，不能修什么

`eslint . --fix` 是投入产出比最高的一个命令，但要知道它的边界。

能自动修的规则，官方文档里会标一个扳手图标。大致规律是「改动是确定的、不会改变语义」的都能修，比如引号、分号、`prefer-const`、`no-extra-semi`、多余空格。不能修的是那些「怎么改取决于你想干什么」的，比如 `no-unused-vars`，ESLint 不知道该删掉这个变量还是你忘了用它；再比如 `complexity` 超标，拆函数这事只能人来。

有几个参数配合起来很好用。

```bash
# 只看会修成什么样，不落盘
npx eslint src --fix-dry-run

# 只修某一类问题，避免一次改动过大
npx eslint src --fix --fix-type problem,suggestion

# 只修布局类，通常搭配格式化迁移
npx eslint src --fix --fix-type layout
```

这里有个坑要注意。老项目第一次跑全量 `--fix`，改动动辄上千个文件，和业务代码混在一个提交里，review 根本没法看，出了问题也没法二分定位。正确做法是全量修复单独一个提交，提交信息写清楚这是纯机械改动，然后在 `.git-blame-ignore-revs` 里把这个 commit 加进去，免得以后 `git blame` 全指向它。

## 六、lint-staged 做增量检查

全量 lint 在稍大的项目上要跑几十秒，放进 pre-commit 钩子里没人受得了。lint-staged 的思路是只检查这次暂存的文件。

装上 husky 和 lint-staged 之后，`package.json` 里这么写。

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix --max-warnings 0",
      "prettier --write"
    ],
    "*.{json,md,css,scss}": [
      "prettier --write"
    ]
  }
}
```

lint-staged 会把匹配到的暂存文件路径追加到命令后面，所以命令里不用写路径。修复后的内容会被自动重新 `git add`，这一点它已经处理好了。

有两个坑我踩过。

一个是被 ignore 的文件。lint-staged 只按 glob 匹配文件名，它不知道你的 ESLint 忽略配置，所以可能把一个已经被忽略的文件传给 ESLint，ESLint 会输出一条「File ignored because of a matching ignore pattern」的警告。配了 `--max-warnings 0` 的话，这条警告足以让提交失败。ESLint 9 提供了 `--no-warn-ignored` 来关掉这个提示，加上就行。

另一个是顺序。`eslint --fix` 和 `prettier --write` 都会改文件，两条命令的先后会影响最终结果。我的做法是 ESLint 在前 Prettier 在后，让 Prettier 有最终话语权，这样和第四节说的分工是一致的。

还要说一句，pre-commit 钩子是可以被 `--no-verify` 绕过的，所以它只是提效手段，不能当卡口。真正的卡口在 CI。

## 七、CI 上把卡口设在哪一步

CI 里的 lint 和本地的 lint 目的不一样。本地是为了让你早点发现问题，CI 是为了保证没人能把不合规的代码合进主干。

```yaml
- name: Lint
  run: |
    npx eslint . --max-warnings 0 --cache --cache-location .eslintcache
    npx prettier --check .
```

`--max-warnings 0` 是核心。不加这个参数，`warn` 级别的规则永远不会让 CI 变红，那这些规则就等于没配。加上之后 `warn` 和 `error` 在 CI 上是同等效力，区别只在本地开发时的视觉噪音。

`--cache` 在中大型项目上省时间很明显，它会把上次检查通过的文件记下来，只重新检查变动过的。CI 上要配合缓存目录一起用才有意义，缓存文件本身记得加进 `.gitignore`。

还有一件事容易被忽略。ESLint 9 把一批格式化输出器从核心包里移走了，`checkstyle`、`compact`、`junit`、`tap`、`unix` 这些都要单独装 `eslint-formatter-*` 包。很多流水线用 `--format junit` 把结果喂给测试报告系统，升级之后直接报找不到 formatter，而本地跑的是默认的 `stylish`，根本发现不了。这个坑和其它升级变化我整理在 [ESLint 9 升级攻略](https://feinterview.poetries.top/blog/eslint-9-upgrade-guide) 里了。

## 八、规则严格度怎么一步步推上去

新项目从严开始很容易，难的是给一个跑了几年的老项目加规范。直接把 airbnb 那套压上去，跑出来两万条错误，团队第一反应就是把 lint 关掉。

我自己用的节奏是这样的。

先只开第一类规则，也就是 `@eslint/js` 的 `recommended`，配上 `--max-warnings 0`。这一档基本都是真 bug，改起来没有争议，团队接受度最高。

第二步引入 Prettier，全量格式化一次，单独提交。格式这块一次性解决完，后面就不用再讨论了。

第三步开始逐条加第二类规则，每次只加两三条，先设成 `warn`。用 `--max-warnings` 加上当前的警告数量做棘轮，允许存量存在但不允许新增。这个数字每次改完一批就往下调一格，直到调到 0，然后把规则提到 `error`。

第四步是分区域收紧。用 `overrides` 给新写的模块单独配一套更严的规则，老代码维持宽松。这样新代码从一开始就是干净的，老代码慢慢还。

```javascript
"overrides": [
  {
    "files": ["src/modules/new-feature/**/*.ts"],
    "rules": {
      "complexity": ["error", 8],
      "@typescript-eslint/no-explicit-any": "error"
    }
  }
]
```

整个过程里有一条纪律要立住，`eslint-disable` 必须带具体规则名，禁止裸写。光秃秃的 `/* eslint-disable */` 等于把整个文件从校验里摘出去，后面加进来的问题一个都发现不了。再配上 `reportUnusedDisableDirectives`，把那些代码改完之后已经不需要的 disable 注释也报出来，不然它们会越攒越多。

说实话这套节奏走完至少要几个月，中间还得有人持续盯着。但比起「一次性压上去然后被全员关掉」，这条路是真的能走通的。

## 九、常用规则速查表

下面这份是我当年整理的完整规则清单，逐条带中文说明，当速查手册用。

先提个醒，这份清单是 2018 年整理的，里面有一批规则在后来的 ESLint 版本里改名或者移除了，直接整份复制到项目里会报「规则不存在」。我在每段后面标了需要注意的条目。

另外它和第二节那份最小规则集在几个地方是矛盾的，比如这里 `"semi": [2, "always"]` 要求分号，前面那份是 `'semi': ['error', 'never']` 禁止分号。这说明速查表就只是速查表，不是一份可以直接用的配置。同一份清单里 `array-bracket-spacing`、`brace-style`、`camelcase`、`indent`、`quotes` 这些键也出现了不止一次，真写进 JSON 的话后面的会静默覆盖前面的，不会有任何提示。

```javascript
"no-alert": 0,//禁止使用alert confirm prompt
"no-array-constructor": 2,//禁止使用数组构造器
"no-bitwise": 0,//禁止使用按位运算符
"no-caller": 1,//禁止使用arguments.caller或arguments.callee
"no-catch-shadow": 2,//禁止catch子句参数与外部作用域变量同名
"no-class-assign": 2,//禁止给类赋值
"no-cond-assign": 2,//禁止在条件表达式中使用赋值语句
"no-console": 2,//禁止使用console
"no-const-assign": 2,//禁止修改const声明的变量
"no-constant-condition": 2,//禁止在条件中使用常量表达式 if(true) if(1)
"no-continue": 0,//禁止使用continue
"no-control-regex": 2,//禁止在正则表达式中使用控制字符
"no-debugger": 2,//禁止使用debugger
"no-delete-var": 2,//不能对var声明的变量使用delete操作符
"no-div-regex": 1,//不能使用看起来像除法的正则表达式/=foo/
"no-dupe-keys": 2,//在创建对象字面量时不允许键重复 {a:1,a:1}
"no-dupe-args": 2,//函数参数不能重复
"no-duplicate-case": 2,//switch中的case标签不能重复
"no-else-return": 2,//如果if语句里面有return,后面不能跟else语句
"no-empty": 2,//块语句中的内容不能为空
"no-empty-character-class": 2,//正则表达式中的[]内容不能为空
"no-empty-label": 2,//禁止使用空label
"no-eq-null": 2,//禁止对null使用==或!=运算符
"no-eval": 1,//禁止使用eval
"no-ex-assign": 2,//禁止给catch语句中的异常参数赋值
"no-extend-native": 2,//禁止扩展native对象
"no-extra-bind": 2,//禁止不必要的函数绑定
"no-extra-boolean-cast": 2,//禁止不必要的bool转换
"no-extra-parens": 2,//禁止非必要的括号
"no-extra-semi": 2,//禁止多余的分号
```

这一段里有两条要改。`no-empty-label` 在 ESLint 2.0 就被移除了，它的功能并进了 `no-labels`；`no-catch-shadow` 是弃用规则，当年是为了绕开 IE8 的 catch 作用域行为，现在没有意义。另外 `no-extra-semi` 原注释写的是「禁止多余的冒号」，应该是分号，这里顺手改了。

`no-console` 设成 `2` 在如今的项目里偏严。更实用的写法是 `["warn", { "allow": ["warn", "error"] }]`，放行 `console.warn` 和 `console.error`，只拦调试用的 `console.log`。

```javascript
"no-fallthrough": 1,//禁止switch穿透
"no-floating-decimal": 2,//禁止省略浮点数中的0 .5 3.
"no-func-assign": 2,//禁止重复的函数声明
"no-implicit-coercion": 1,//禁止隐式转换
"no-implied-eval": 2,//禁止使用隐式eval
"no-inline-comments": 0,//禁止行内备注
"no-inner-declarations": [2, "functions"],//禁止在块语句中使用声明（变量或函数）
"no-invalid-regexp": 2,//禁止无效的正则表达式
"no-invalid-this": 2,//禁止无效的this，只能用在构造器，类，对象字面量
"no-irregular-whitespace": 2,//不能有不规则的空格
"no-iterator": 2,//禁止使用__iterator__ 属性
"no-label-var": 2,//label名不能与var声明的变量名相同
"no-labels": 2,//禁止标签声明
"no-lone-blocks": 2,//禁止不必要的嵌套块
"no-lonely-if": 2,//禁止else语句内只有if语句
"no-loop-func": 1,//禁止在循环中使用函数（如果没有引用外部变量不形成闭包就可以）
"no-mixed-requires": [0, false],//声明时不能混用声明类型
"no-mixed-spaces-and-tabs": [2, false],//禁止混用tab和空格
"linebreak-style": [0, "windows"],//换行风格
"no-multi-spaces": 1,//不能用多余的空格
"no-multi-str": 2,//字符串不能用\换行
"no-multiple-empty-lines": [1, {"max": 2}],//空行最多不能超过2行
"no-native-reassign": 2,//不能重写native对象
"no-negated-in-lhs": 2,//in 操作符的左边不能有!
"no-nested-ternary": 0,//禁止使用嵌套的三目运算
"no-new": 1,//禁止在使用new构造一个实例后不赋值
"no-new-func": 1,//禁止使用new Function
"no-new-object": 2,//禁止使用new Object()
"no-new-require": 2,//禁止使用new require
"no-new-wrappers": 2,//禁止使用new创建包装实例，new String new Boolean new Number
"no-obj-calls": 2,//不能调用内置的全局对象，比如Math() JSON()
"no-octal": 2,//禁止使用八进制数字
"no-octal-escape": 2,//禁止使用八进制转义序列
"no-param-reassign": 2,//禁止给参数重新赋值
```

这一段有个明显的错位。`"linebreak-style": [0, "windows"]` 被夹在一堆 `no-` 开头的规则中间，而且和第二节那份配置里的 `['error', 'unix']` 直接冲突。换行符这件事现在更推荐交给 Git 的 `core.autocrlf` 和 `.gitattributes` 处理，在 ESLint 里管反而会让跨平台协作变麻烦。

`no-negated-in-lhs` 也是弃用规则，替代品是 `no-unsafe-negation`，后者除了 `in` 还能覆盖 `instanceof`。`no-mixed-requires: [0, false]` 里的第二个参数 `false` 是很老的写法，现在应该传对象。

`no-param-reassign` 设成 `2` 我是支持的。直接改传进来的参数会让调用方莫名其妙拿到被改过的对象，尤其参数是引用类型的时候。想改就先复制一份。

```javascript
"no-path-concat": 0,//node中不能使用__dirname或__filename做路径拼接
"no-plusplus": 0,//禁止使用++，--
"no-process-env": 0,//禁止使用process.env
"no-process-exit": 0,//禁止使用process.exit()
"no-proto": 2,//禁止使用__proto__属性
"no-redeclare": 2,//禁止重复声明变量
"no-regex-spaces": 2,//禁止在正则表达式字面量中使用多个空格 /foo bar/
"no-restricted-modules": 0,//如果禁用了指定模块，使用就会报错
"no-return-assign": 1,//return 语句中不能有赋值表达式
"no-script-url": 0,//禁止使用javascript:void(0)
"no-self-compare": 2,//不能比较自身
"no-sequences": 0,//禁止使用逗号运算符
"no-shadow": 2,//外部作用域中的变量不能与它所包含的作用域中的变量或参数同名
"no-shadow-restricted-names": 2,//严格模式中规定的限制标识符不能作为声明时的变量名使用
"no-spaced-func": 2,//函数调用时 函数名与()之间不能有空格
"no-sparse-arrays": 2,//禁止稀疏数组， [1,,2]
"no-sync": 0,//nodejs 禁止同步方法
"no-ternary": 0,//禁止使用三目运算符
"no-trailing-spaces": 1,//一行结束后面不要有空格
"no-this-before-super": 0,//在调用super()之前不能使用this或super
"no-throw-literal": 2,//禁止抛出字面量错误 throw "error";
"no-undef": 1,//不能有未定义的变量
"no-undef-init": 2,//变量初始化时不能直接给它赋值为undefined
"no-undefined": 2,//不能使用undefined
"no-unexpected-multiline": 2,//避免多行表达式
"no-underscore-dangle": 1,//标识符不能以_开头或结尾
"no-unneeded-ternary": 2,//禁止不必要的三元表达式 var isYes = answer === 1 ? true : false;
"no-unreachable": 2,//不能有无法执行的代码
"no-unused-expressions": 2,//禁止无用的表达式
"no-unused-vars": [2, {"vars": "all", "args": "after-used"}],//不能有声明后未被使用的变量或参数
"no-use-before-define": 2,//未定义前不能使用
"no-useless-call": 2,//禁止不必要的call和apply
"no-void": 2,//禁用void操作符
"no-var": 0,//禁用var，用let和const代替
"no-warning-comments": [1, { "terms": ["todo", "fixme", "xxx"], "location": "start" }],//不能有警告备注
"no-with": 2,//禁用with
```

这一段里 `no-undefined` 设成 `2` 需要斟酌。它禁止把 `undefined` 当标识符用，理由是在 ES5 之前 `undefined` 可以被重新赋值。现在这个风险早就不存在了，而 TypeScript 项目里 `x === undefined` 是非常自然的写法，一刀切禁掉反而别扭。

`no-restricted-modules` 已经从核心里移走，和上一段的 `no-path-concat`、`no-process-env`、`no-sync` 一样，现在归 `eslint-plugin-n` 管。`no-native-reassign` 改名成了 `no-global-assign`，`no-spaced-func` 改名成了 `func-call-spacing`。

`no-warning-comments` 那条配置挺有意思，它会把代码里的 `TODO`、`FIXME`、`XXX` 报成警告。设成 `1` 是合理的，报成 `error` 的话没人受得了。我一般不开它，改用 CI 上单独统计 TODO 数量，避免它混在 lint 输出里。

下面是风格相关的一批。

```javascript
"array-bracket-spacing": [2, "never"],//是否允许非空数组里面有多余的空格
"arrow-parens": 0,//箭头函数用小括号括起来
"arrow-spacing": 0,//=>的前/后括号
"accessor-pairs": 0,//在对象中使用getter/setter
"block-scoped-var": 0,//块语句中使用var
"brace-style": [1, "1tbs"],//大括号风格
"callback-return": 1,//避免多次调用回调什么的
"camelcase": 2,//强制驼峰法命名
"comma-dangle": [2, "never"],//对象字面量项尾不能有逗号
"comma-spacing": 0,//逗号前后的空格
"comma-style": [2, "last"],//逗号风格，换行时在行首还是行尾
"complexity": [0, 11],//循环复杂度
"computed-property-spacing": [0, "never"],//是否允许计算后的键名什么的
"consistent-return": 0,//return 后面是否允许省略
"consistent-this": [2, "that"],//this别名
"constructor-super": 0,//非派生类不能调用super，派生类必须调用super
"curly": [2, "all"],//必须使用 if(){} 中的{}
"default-case": 2,//switch语句最后必须有default
"dot-location": 0,//对象访问符的位置，换行的时候在行首还是行尾
"dot-notation": [0, { "allowKeywords": true }],//避免不必要的方括号
"eol-last": 0,//文件以单一的换行符结束
"eqeqeq": 2,//必须使用全等
"func-names": 0,//函数表达式必须有名字
"func-style": [0, "declaration"],//函数风格，规定只能使用函数声明/函数表达式
"generator-star-spacing": 0,//生成器函数*的前后空格
"guard-for-in": 0,//for in循环要用if语句过滤
"handle-callback-err": 0,//nodejs 处理错误
"id-length": 0,//变量名长度
"indent": [2, 4],//缩进风格
"init-declarations": 0,//声明时必须赋初值
"key-spacing": [0, { "beforeColon": false, "afterColon": true }],//对象字面量中冒号的前后空格
"lines-around-comment": 0,//行前/行后备注
"max-depth": [0, 4],//嵌套块深度
"max-len": [0, 80, 4],//字符串最大长度
"max-nested-callbacks": [0, 2],//回调嵌套深度
"max-params": [0, 3],//函数最多只能有3个参数
"max-statements": [0, 10],//函数内最多有几个声明
"new-cap": 2,//函数名首行大写必须使用new方式调用，首行小写必须用不带new方式调用
```

这一段几乎全是第三类规则，也就是纯格式。按第四节说的分工，`indent`、`max-len`、`key-spacing`、`comma-spacing` 这些交给 Prettier 就好，在 ESLint 里配它们只会和格式化工具打架。

`camelcase` 是这里少数值得留下的。它管的是命名而不是排版，Prettier 不会碰。不过后端接口返回 snake_case 字段的场景很常见，实际用的时候一般要加 `{ "properties": "never" }`，只管变量名不管对象属性。

`consistent-this: [2, "that"]` 是箭头函数普及之前的产物，现在可以直接关掉。

最后一批。

```javascript
"new-parens": 2,//new时必须加小括号
"newline-after-var": 2,//变量声明后是否需要空一行
"object-curly-spacing": [0, "never"],//大括号内是否允许不必要的空格
"object-shorthand": 0,//强制对象字面量缩写语法
"one-var": 1,//连续声明
"operator-assignment": [0, "always"],//赋值运算符 += -=什么的
"operator-linebreak": [2, "after"],//换行时运算符在行尾还是行首
"padded-blocks": 0,//块语句内行首行尾是否要空行
"prefer-const": 0,//首选const
"prefer-spread": 0,//首选展开运算
"prefer-reflect": 0,//首选Reflect的方法
"quotes": [1, "single"],//引号类型 `` "" ''
"quote-props":[2, "always"],//对象字面量中的属性名是否强制双引号
"radix": 2,//parseInt必须指定第二个参数
"id-match": 0,//命名检测
"require-yield": 0,//生成器函数必须有yield
"semi": [2, "always"],//语句强制分号结尾
"semi-spacing": [0, {"before": false, "after": true}],//分号前后空格
"sort-vars": 0,//变量声明时排序
"space-after-keywords": [0, "always"],//关键字后面是否要空一格
"space-before-blocks": [0, "always"],//不以新行开始的块{前面要不要有空格
"space-before-function-paren": [0, "always"],//函数定义时括号前面要不要有空格
"space-in-parens": [0, "never"],//小括号里面要不要有空格
"space-infix-ops": 0,//中缀操作符周围要不要有空格
"space-return-throw-case": 2,//return throw case后面要不要加空格
"space-unary-ops": [0, { "words": true, "nonwords": false }],//一元运算符的前/后要不要加空格
"spaced-comment": 0,//注释风格要不要有空格什么的
"strict": 2,//使用严格模式
"use-isnan": 2,//禁止比较时使用NaN，只能用isNaN()
"valid-jsdoc": 0,//jsdoc规则
"valid-typeof": 2,//必须使用合法的typeof的值
"vars-on-top": 2,//var必须放在作用域顶部
"wrap-iife": [2, "inside"],//立即执行函数表达式的小括号风格
"wrap-regex": 0,//正则表达式字面量用小括号包起来
"yoda": [2, "never"]//禁止尤达条件
```

收尾这段里有三条已经不能用了。`space-after-keywords` 和 `space-return-throw-case` 在 ESLint 3 时期被合并进了 `keyword-spacing`，`prefer-reflect` 也已经移除。`valid-jsdoc` 在 ESLint 9 里同样被删掉，要做 JSDoc 校验得装 `eslint-plugin-jsdoc`。

`quote-props: [2, "always"]` 那条注释写的是「强制双引号」，其实这条规则管的是属性名要不要加引号，加什么引号是 `quotes` 管的。这是两件事。

`strict: 2` 在 ES Module 项目里没必要，模块代码天然处于严格模式，再写 `'use strict'` 反而会被报成多余。

## 十、迁到扁平配置之后要改什么

上面这套落地方案的思路在 ESLint 9 上完全成立，但写法要调。ESLint 9 把扁平配置（`eslint.config.js`）设成了默认，`.eslintrc.*` 不再被读取。

改动集中在这几处。

配置文件名换成 `eslint.config.js`（或者 `.mjs`/`.cjs`），内容从一个对象变成一个数组，数组里每一项按顺序合并，后面的覆盖前面的。

`.eslintignore` 不再被读取，内容要搬进一个只有 `ignores` 的配置项。这一条最容易漏，症状是 `dist/` 突然开始被检查，CI 上炸出成千上万条错误。

`env` 预设没有了。以前 `env: { browser: true }` 一行的事，现在要装 `globals` 这个包，写成 `globals: { ...globals.browser }`。忘了这步的典型症状是满屏 `'window' is not defined`。

`extends` 的用法变了，不再是字符串数组，而是把配置对象直接展开进数组。所以第三节讲的那些 config 包，得看它有没有出扁平配置版本。没出的可以用 `@eslint/eslintrc` 提供的 `FlatCompat` 先顶着，但那只是过渡手段。

`--ext` 参数的行为也变了。检查范围现在由配置里的 `files` 字段决定，`package.json` 和 lint-staged 命令里那句 `--ext .js,.ts` 需要重写。具体到你装的那个 9.x 小版本怎么处理这个参数，跑一次 `npx eslint --help` 看输出最准，别照抄网上的老文章。

`overrides` 这个字段也没了，因为数组里多写一项带 `files` 的配置就是 override。

把前面几节的方案翻译过来，大概长这样。

```javascript
// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import prettierConfig from 'eslint-config-prettier'

export default [
  // 替代 .eslintignore
  { ignores: ['dist/**', 'coverage/**', '.next/**'] },

  js.configs.recommended,

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser }
    },
    rules: {
      'no-var': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'complexity': ['error', 9],
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  },

  // 相当于旧配置里的 overrides，给新模块单独收紧
  {
    files: ['src/modules/new-feature/**/*.js'],
    rules: { complexity: ['error', 8] }
  },

  // 放在最后，关掉所有和 Prettier 冲突的格式化规则
  prettierConfig
]
```

`eslint-config-prettier` 放最后这条规矩没变，只是从「数组最后一个字符串」变成了「数组最后一项」。

想把配置文件里每个字段的含义搞清楚，可以看我另一篇 [ESLint 配置文件详解](https://feinterview.poetries.top/blog/eslint-conf-info)，那篇把 `env`、`parserOptions`、`plugins`、`extends`、`overrides` 逐个拆开讲了，也附了新旧字段的对照表。想直接抄一份跑在 Next.js 上的完整配置，看 [基于 ESLint 9 配置前端开发规范](https://feinterview.poetries.top/blog/eslint9-nextjs16-setup-guide)。

## 总结

回到开头那个问题，规范落不了地，问题从来不在规则表不够长。

真正起作用的是这么几件事。规则按三类分开对待，第一类照抄官方推荐集，第三类整体交给 Prettier，只在第二类上和团队讨论。格式化和代码质量分成两条命令跑，别用 `eslint-plugin-prettier` 把它们搅在一起。pre-commit 用 lint-staged 做增量提效，CI 上用 `--max-warnings 0` 做真正的卡口。存量项目靠 `--max-warnings` 当棘轮一格一格收紧，配合 `overrides` 让新代码从一开始就干净。

规则清单本身反而是最不重要的部分。后面那份速查表的正确用法是查，不是抄，里面已经有一批规则在新版本上跑不起来了。

如果你现在要从零起一个项目，我的建议很简单：`@eslint/js` 的 recommended 打底，加上框架方提供的 config 包，末尾挂 `eslint-config-prettier`，自己只写十来条真正在意的规则。剩下的精力花在 CI 卡口和推进节奏上，比调规则值钱得多。

## 参考

- [ESLint 规则总表](https://eslint.org/docs/latest/rules/)
- [ESLint 命令行参数文档](https://eslint.org/docs/latest/use/command-line-interface)
- [ESLint 配置文件文档](https://eslint.org/docs/latest/use/configure/configuration-files)
- [Prettier 官方关于和 Linter 集成的说明](https://prettier.io/docs/integrating-with-linters)
- [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier)
- [lint-staged](https://github.com/lint-staged/lint-staged)
- [typescript-eslint 官方文档](https://typescript-eslint.io/)
- [前端进阶之旅](https://interview.poetries.top)
