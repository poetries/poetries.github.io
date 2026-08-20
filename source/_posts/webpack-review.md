---
title: webpack 回顾篇，核心概念与配置项全景梳理
date: 2018-11-21 17:40:08
description: 从版本演进和四个核心概念出发，系统梳理 webpack 的 Entry、Output、Loader、Plugin 配置项，覆盖代码分割、CSS 处理、HMR、SourceMap、长缓存与多页面方案，并补上 webpack 5 时代的迁移说明。
tags: 
   - webpack
   - 优化
   - 前端工程化
   - 构建工具
categories: Front-End
---

接手一个老项目，`webpack.config.js` 三百多行，动一下 loader 的顺序整个构建就崩，报错信息还看不出是哪一层出的问题。这种时候光会抄配置是不够的，你得知道每个字段作用在构建流程的哪一段。这篇是我当年把 webpack 从头过一遍时留下的笔记，后来陆续补过几轮，把版本演进、四个核心概念、loader 链、代码分割、CSS 处理、HMR、SourceMap、长缓存和多页面配置串成了一条线。

原文写的时候基线是 `webpack 3`，现在线上主流已经是 `webpack 5`。老写法我一个字没删，历史记录本身有价值，看老项目也用得上；每处过时的地方我另起一小段写清楚现在该怎么做，以及为什么变了。

这篇偏「概念与配置项全景」，也就是每个字段是什么、怎么填。如果你要的是「从零跑通一套能用的开发环境」那种手把手流程，看这篇的姊妹篇 [webpack4 定制前端开发环境](https://feinterview.poetries.top/blog/webpack-custom-work-flow)，那边是按 Step 走的实战流水线。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- webpack 从 V1 到 V3 每一代补上了什么能力，怎么判断一份老配置停在哪一代
- Entry、Output、Loader、Plugin 四个核心概念，以及 Chunk / Bundle / Module 的区别
- Babel、TypeScript 在 webpack 里的接法，polyfill 的两种垫片选型
- `CommonsChunkPlugin` 提取公共代码，以及它在 webpack 4 之后被谁取代
- `require.ensure` 与 `import()` 两种代码分割写法的差异
- CSS 的完整处理链，`style-loader` / `css-loader` / 预处理器 / PostCSS / 提取成文件
- JS 与 CSS 两条 Tree shaking 路线，以及为什么有些库摇不动
- 图片、字体、第三方库这三类文件的处理套路
- dev server、proxy、HMR、SourceMap、ESLint 这套开发期能力怎么配
- 长缓存优化和多页面应用的两种组织方式

## 一、webpack 的版本演进

### 1.1 版本更迭

先看一眼从 0.x 到 3.x 这条时间线。知道每个大版本是什么时候出来的，以后看到一份陌生的老配置，扫一眼用了哪些插件就能判断它停在哪一代。

![webpack 从早期版本到 3.x 的版本发布时间线](https://s.poetries.top/gitee/2019/10/644.png)

下面这张是各个大版本之间的能力变化，重点看每一代往上加了什么。

![webpack 各大版本之间的能力变化对比](https://s.poetries.top/gitee/2019/10/645.png)

### 1.2 功能进化

把上面两张图里的信息拆开说，每一代的关键词其实很清楚。

**Webpack V1**

- 编译、打包
- `HMR` (模块热更新)
- 代码分割
- 文件处理

V1 把「模块化 + 打包」这件事做成了，`HMR` 和代码分割在那个年代是相当超前的能力。

**Webpack V2**

- `Tree Shaking`
- `ES module`
- 动态 `Import`
- 新的文档

V2 最重要的动作是原生支持 `ES module`。有了静态的 `import` / `export`，`Tree Shaking` 才有分析的基础，这是后面所有产物体积优化的地基。

**Webpack V3**

- `Scope Hoisting` (作用域提升)
- `Magic Comments` （配合动态`import`使用）

V3 的 `Scope Hoisting` 把能合并的模块塞进同一个函数作用域，减少了运行时的闭包包裹，产物小一点、启动快一点。`Magic Comments` 就是 `import()` 里那段 `/* webpackChunkName */` 注释，后面代码分割那节会用到。

> 版本迁移

**V1 -> V2**

迁移指南 https://doc.webpack-china.org/guides/migrating/

**V2 -> V3**

更新升级即可

顺着上面聊一下现在的情况。V3 之后 webpack 4 引入了 `mode` 和 `optimization.splitChunks`，webpack 5 又带来了持久化缓存、Asset Modules 和 Module Federation。也就是说这篇里凡是出现 `webpack.optimize.*` 系列内置插件的地方，在 webpack 5 上都已经不是推荐写法了，我会在对应章节挨个说明。如果你要的是 webpack 5 那一套构建性能配置，我单独写过一篇 [Webpack 5 构建性能优化实战](https://feinterview.poetries.top/blog/webpack-5-build-optimization)。

## 二、webpack 核心概念

webpack 的配置项看着多，骨架其实就四块，Entry 说从哪进，Output 说往哪出，Loader 管「这类文件怎么翻译成模块」，Plugin 管「构建过程中还要顺手干点什么」。剩下几十个字段都是挂在这四块上的细节。先把这四块的分工关系理顺，后面看任何一份配置都不会慌。

### 2.1 Entry

- 代码的入口
- 打包的入口
- 单个或多个

Entry 是整张依赖图的根。webpack 从这里开始读文件、解析 `import`、递归往下走，最后得到一张完整的模块依赖图。一个入口对应一条独立的依赖链，多入口就是多张图（有交集的部分后面靠代码分割去合并）。

写法上有四种，我建议直接用键值对那种，理由在下面。

最简写法，一个字符串就是一个入口，webpack 会给它一个默认名字 `main`。

```js
module.exports = {
  entry: 'index.js'
}
```

传数组表示「把这几个文件打进同一个 bundle」，它们仍然算一个入口，只是这个入口有多个起始文件。常见用途是把 polyfill 塞在业务代码前面。

```js
module.exports = {
  entry: ['index.js','vendor.js']
}
```

键值对写法，`index` 这个 key 会成为 chunk 的名字，后面 `output.filename` 里的 `[name]` 占位符取的就是它。

```js
module.exports = {
  entry: {
      index:'index.js'
  }
}
```

前两种能力合起来，多个入口、其中某个入口还有多个起始文件。

```js
module.exports = {
  entry: {
      index:['index.js','app.js'],
      vendor: 'vendor.js'
  }
}
```

为什么建议一律用键值对写法？因为字符串和数组写法拿不到 chunk 名，产物文件全叫 `main`，一旦要做多入口或者按 chunk 拆包，你得回头把配置改一遍。一开始就写成对象，后面加入口只是多一行的事。

### 2.2 Output

- 打包成的文件(`bundle`)
- 一个或多个
- 自定义规则
- 配合`CDN`

Output 决定产物落在哪、叫什么名字。它和 Entry 是对应关系，几个入口原则上就会产出几个 bundle，再加上代码分割出来的若干 chunk 文件。

单入口的时候写死文件名就行。

```js
module.exports = {
  entry: 'index.js',
  output: {
      filename: 'index.min.js'
  }
}
```

多入口就必须用占位符，不然两个入口会往同一个文件名上写。`[name]` 取的是 entry 的 key，`[hash:5]` 是本次构建的哈希取前 5 位，用来做浏览器缓存的破缓存标记。

```js
module.exports = {
  entry: {
    index: 'index.js',
    vendor: 'vendor.js'
  },
  output: {
      filename: '[name].min[hash:5].js'
  }
}
```

这里有个坑要注意，`[hash]` 是「整次构建」的哈希，只要有任意一个文件变了，所有产物的文件名都会一起变，缓存全部失效。真要做长期缓存得换成 `[chunkhash]`，第六节讲长缓存优化时会专门展开。

`output.publicPath` 这个字段这里先提一句，它决定运行时去哪个前缀下取异步 chunk 和静态资源，把它指向 CDN 域名就是最常见的「配合 CDN」的做法。

### 2.3 Loaders

- 处理文件
- 转化为模块

webpack 自己只认 JS。CSS、图片、字体、TypeScript 这些它一概不懂，Loader 干的就是翻译工作，把非 JS 的东西转成 webpack 能塞进依赖图的模块。

```js
module.exports = {
  module: {
      rules: [
        {
            test: /\.css$/,
            use: 'css-loader'
        }
      ]
  }
}
```

`test` 是匹配条件，`use` 是命中之后交给谁处理。一条 rule 就是一句「凡是长这样的文件，走这条链」。

#### 2.3.1 常用Loader

按职责分成三类记就行。

**编译相关**

- `babel-loader`
- `ts-loader`

**样式相关**

- `style-loader`
- `css-loader`
- `less-loader`
- `postcss-loader`

**文件相关**

- `file-loader`
- `url-loader`

文件这一类现在有变化。webpack 5 内置了 Asset Modules，`file-loader`、`url-loader`、`raw-loader` 这三个都不用装了，直接在 rule 里写 `type: 'asset/resource'`（等价 file-loader）、`type: 'asset/inline'`（等价 url-loader 内联）或者 `type: 'asset'`（按体积自动二选一）。老项目升级 webpack 5 的时候，这几个 loader 记得从 `package.json` 里删掉，留着反而容易和内置行为打架。

### 2.4 Plugins

- 参与打包整个过程
- 打包优化和压缩
- 配置编译时的变量
- 极其灵活

Loader 只在「文件转模块」这一步起作用，Plugin 的口子大得多。webpack 内部跑的是一套基于 `tapable` 的钩子系统，从初始化、编译、生成 chunk 一直到写文件，每个环节都暴露了钩子，Plugin 挂在哪个钩子上就能在哪一步插手。想深入了解常用插件都干了什么，可以看 [webpack 常用插件汇总](https://feinterview.poetries.top/blog/webpack-plugin-summary)。

```js
module.exports = {
 plugins: [
    new webpack.optimize.UglifyJsPlugin()
 ]
}
```

#### 2.4.1 常用plugins

**优化相关**

- `CommonsChunkPlugin`
- `UglifyJsWebpackPlugin`

**功能相关**

- `ExtractTextWebpackPlugin` 提取css
- `HtmlWebpackPlugin` 生成HTML模板
- `HotModuleReplacementPlugin` 热模块替换
- `CopyWebpackPlugin` 拷贝文件

这份清单里有三个已经换代了，先记个账，后面对应章节会细说。`CommonsChunkPlugin` 在 webpack 4 被 `optimization.splitChunks` 取代；`UglifyJsWebpackPlugin` 换成了 `terser-webpack-plugin`（Uglify 不支持 ES2015+ 语法，Terser 是它的 fork）；`ExtractTextWebpackPlugin` 换成了 `mini-css-extract-plugin`。`HtmlWebpackPlugin`、`HotModuleReplacementPlugin`、`CopyWebpackPlugin` 这三个到现在还在用，只是版本和参数有调整。

### 2.5 名词

- `Chunk` 打包过程分割的代码块
- `Bundle` 打包后的文件
- `Module` 

这三个词在文档和报错信息里混着出现，分不清会很难受，我一开始也被绕过。Module 是源码层面的一个文件，一个 `.js` 一个 `.css` 都是 Module；Chunk 是构建过程中的中间产物，webpack 把若干 Module 按依赖关系归成一组，这组就是一个 Chunk；Bundle 是最终落盘的那个文件。

多数时候一个 Chunk 对应一个 Bundle，所以容易混。但也有不对应的情况，比如开了 `ExtractTextWebpackPlugin` 之后，一个 Chunk 会同时产出 `.js` 和 `.css` 两个 Bundle。记住这条差别，看 `stats` 输出的时候就不会懵。

## 三、初探 webpack 


前面两节讲的是骨架，这一节开始动手。我把 webpack 最常打交道的几件事按顺序过一遍：编译 ES6、编译 TypeScript、提取公共代码、代码分割和懒加载、CSS 处理链、Tree shaking。

顺序是有讲究的。前两块解决「代码能不能跑」，后四块解决「产物大不大、加载快不快」。这两类问题的排查思路完全不同，混在一起想很容易绕晕。

### 3.1 使用babel打包es6

浏览器对新语法的支持永远落后于语言标准。想用 `async/await`、可选链、装饰器，就得有一层转译把它们变成目标浏览器能跑的代码，这层就是 Babel。


#### 3.1.1 编译 ES 6/7


Babel 要理解成三层。最底下是 `@babel/core`，负责解析、转换、生成三步流水线，它本身什么语法都不转。中间是插件，一个插件管一件事，比如把箭头函数转成 function。最上面是 preset，也就是插件的预设组合，省得你一个个配。

`babel-loader` 是把这套东西接进 webpack 的那层胶水，它本身不做转译。搞清楚这个分层，后面遇到「配了 preset 但没生效」这类问题就知道该查哪一层。

**Babel**

```bash
npm install babel-loader@8.0.0-beta.0 @babel/core
npm install --save-dev babel-loader babel-core
```

这两行分别是 Babel 7 和 Babel 6 的装法，别混着来。`babel-loader` 只是 webpack 和 babel 之间的胶水，真正干活的是 `@babel/core`。光装 loader 不装 core，启动就报错。


**Babel Presets**

> 主要有几种类型选择

- `es2015`
- `es2016`
- `es2017`
- `env`
- `babel-preset-react`
- `babel-preset-stage 0 - 3`

按年份分的那几个 preset（`es2015` / `es2016` / `es2017`）现在都不用了，它们已经被合并进 `env`。`env` 的思路更聪明，它不是「转成某个固定标准」，而是「根据你声明的目标浏览器决定要转什么」，目标浏览器越新，转译越少，产物越小。

`babel-preset-stage-0` 到 `stage-3` 对应的是 TC39 提案的四个阶段，数字越小越激进。Babel 7 把这几个 preset 也删了，改成按需引入具体的插件，比如装饰器就单独装 `@babel/plugin-proposal-decorators`。这个改动是有道理的，`stage-0` 会一次性引入一堆随时可能被废弃的语法，团队里很容易写出以后跑不了的代码。



```bash
npm install @babel/preset-env --save-dev
npm install babel-preset-env --save-dev
```

上面两行命令对应的是 Babel 7 和 Babel 6 两个时代。Babel 7 把所有官方包挪进了 `@babel/` 这个 scope，`babel-core` 变成 `@babel/core`，`babel-preset-env` 变成 `@babel/preset-env`。两套包名混用是老项目升级时最常见的报错来源，表现是各种 `Cannot find module` 或者 preset 不生效，检查一下 `package.json` 里有没有新旧包并存就行。


**Babel Polyfill**


> 针对一些不能处理的函数方法(`Generator`、`Set`、`Map`、`Array.from...`)需要用到`babel-Polyfill`处理

- 全局垫片
- 为应用准备

```bash
npm install babel-polyfill --save
```

```
import 'babel-polyfill'
```

`babel-polyfill` 要在业务代码之前执行，所以它一般放在入口文件的第一行，或者干脆写进 webpack 的 `entry` 数组里，这就是前面讲 Entry 时说的「数组写法常见用途」。


**Babel Runtime Transform**

- 局部垫片
- 为开发框架准备

```bash
npm install babel-plugin-transform-runtime --save-dev

npm install babel-runtime --save
```

这两种垫片的差别是「装在哪」。`babel-polyfill` 直接改全局对象，给 `Array.prototype` 挂 `includes`、给 `window` 挂 `Promise`，一次引入全局生效。应用里用它没问题，但如果你在写一个库，这么干等于污染了使用者的环境，两个库各自 polyfill 同一个方法还可能打架。

`transform-runtime` 走的是另一条路，它把用到的辅助函数从 `babel-runtime` 里 import 进来，改成局部变量，不碰全局。代价是实例方法（比如 `[].includes`）它处理不了，因为那必须改原型。

一句时效性说明。Babel 7.4 之后 `@babel/polyfill` 已经废弃，官方建议直接引 `core-js/stable`，或者更省事的做法是给 `@babel/preset-env` 配上 `useBuiltIns: 'usage'` 和 `corejs: 3`，让 babel 按你实际用到的 API 自动按需引入 polyfill，产物比全量引入小很多：

```javascript
['@babel/preset-env', {
  useBuiltIns: 'usage',
  corejs: 3
}]
```



下面是把 babel 接到 webpack 里的完整写法。

```js
module.exports = {
    entry: {
       app: 'app.js'
    },
    output: {
        filename: '[name].[hash:8].js'
    },
    module: {
        rules:[
            test: /\.js$/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [
                        '@babel/preset-env',{
                            //指定target为根据哪些语法编译
                            targets: {
                                browsers: ['> 1%','last 2 versions']
                            }
                        }
                    ]
                }
            },
            exclude: '/node_modules'
        ]
    }
}
```

`targets.browsers` 是这份配置的重点。`@babel/preset-env` 不是无脑把代码转成 ES5，它会根据你声明的目标浏览器，去查 compat-table 决定哪些语法需要转、哪些可以原样保留。目标写得越宽松，产物越小、跑得越快。

`> 1%` 表示全球使用率超过 1% 的浏览器，`last 2 versions` 表示每个浏览器的最近两个版本。这套语法叫 browserslist，现在更推荐把它写到 `package.json` 的 `browserslist` 字段里，因为 `autoprefixer`、`postcss-preset-env`、`eslint-plugin-compat` 都会读同一份配置，改一处全都生效。

`exclude: '/node_modules'` 这里原文写成了字符串，正确的写法是正则 `/node_modules/` 或者绝对路径，写成字符串是精确匹配路径，基本不会命中。这个错误的表现是构建慢得离谱，因为整个 `node_modules` 都在被 babel 转译。


> 对于`webpack`中`babel`的配置可以单独提取处理`.babelrc`统一管理

```json
{
    "presets": [
        ["@babel/preset-env",{
            "targets": {
                "browsers": ["> 1%", "last 2 versions"]
            }
        }]
    ],
    "plugins": [
      "transform-runtime"
    ]
}
```

把配置抽到 `.babelrc` 的好处是它不只服务于 webpack。Jest 跑测试、editor 的插件、`babel-node` 都会读这份文件，写在 webpack 的 `options` 里其他工具就看不到了。

原文这份 JSON 有两处笔误，我改过来了：内层的键要加引号（JSON 不认裸键名），最后的收尾括号应该是 `}` 不是 `]`。

Babel 7 之后配置文件有两种。`.babelrc` 是「文件相对」的，只对同目录及子目录生效，`node_modules` 里的包不受影响；`babel.config.js` 是「项目全局」的，能作用到 `node_modules`，monorepo 或者需要转译某个依赖包时得用它。分不清这两个的区别，会出现「配了 preset 但某个依赖还是没被转译」的情况。


### 3.2 打包 Typescript


TypeScript 接进 webpack 的方式和 Babel 是同一个套路，一个 loader 负责转译，一份配置文件负责规则。区别在于 TS 的规则文件是 `tsconfig.json`，而且它同时管着类型检查这件事。

```bash
npm i typescipt ts-loader  --save-dev
npm i typescipt awesome-typescript-loader  --save-dev
```

这两个 loader 是二选一的关系，不要同时装。`ts-loader` 是官方推荐的那个，`awesome-typescript-loader` 当年主打的是更快的增量编译，现在已经停止维护了，新项目不要用。


配置

- `tsconfig.json`
- `webpack.config.js`

**tsconfig**

- 配置选项:官网`/docs/handbook/compiler-options.html`
- 常用选项 `compilerOptions` `include` `exclude`

`compilerOptions` 是编译规则，`include` / `exclude` 圈定范围。这三个是日常改得最多的，其余几十个选项可以等遇到具体问题再查。


**声明文件**

> 用于编译时检查错误

以 `lodash` 为例，需要安装带有声明文件的 `@types/lodash`，而不是只安装 `lodash`

```bash
npm install @types/lodash
npm install @types/vue
```

现在很多包已经自带了类型声明（`package.json` 里有 `types` 或 `typings` 字段），装完直接就有提示，不需要额外的 `@types` 包。装之前先看一眼，装了多余的 `@types` 反而可能和自带的声明冲突。


**Typings**

> 也可以这样安装带有`type`的包

```bash
npm install typings
typings install lodash
```

`typings` 这个工具现在已经废弃了，它是 TypeScript 1.x 时代的产物。TypeScript 2.0 之后统一走 `@types/*` 这套 npm 包，直接 `npm i -D @types/lodash` 就行，装完自动生效，不需要在 `tsconfig.json` 里注册。这里保留原文写法只是为了让你在老项目里看到 `typings.json` 时知道那是什么。


下面是 `ts-loader` 接进 webpack 的最小配置，注意 `test` 要同时匹配 `.ts` 和 `.tsx`。

```js
module.exports = {
    entry: {
        'app': 'app.js'
    },
    output: {
        filename: '[name].bundle.js'
    },
    module: {
        rules: [
            test: /\.tsx?$/,
            use: {
                loader: 'ts-loader'
            }
        ]
    }
}
```

`ts-loader` 内部调的就是 `tsc`，所以真正的编译规则不在 webpack 配置里，而在 `tsconfig.json`。这一点和 `babel-loader` 不同，后者的规则可以写在 loader 的 `options` 里。


> 在项目根目录创建`tsconfig.json`

```js
 {
    "compilerOptions": {
         "module": "commonjs",
         "target": "es5", //编译后的文件在哪个环境运行
         "allowJs": true,//允许js语法
    },
    "include": [
        //编译路径
        "./src/*"
    ],
    "exclude": [
        //排除编译文件
        "./node_modules"
    ]
 }
```

`target` 决定编译产物跑在什么环境，`allowJs` 让 TS 项目里能混着写 JS，渐进式迁移时必须开。`include` 和 `exclude` 限定编译范围，写窄一点能省不少时间。

这块变化比较大，说三点。`awesome-typescript-loader` 已经停止维护了，别再用。`ts-loader` 还在维护，但它默认是「边编译边类型检查」，类型检查很慢且会阻塞构建，实践中一般配 `transpileOnly: true` 关掉检查，另外挂一个 `fork-ts-checker-webpack-plugin` 在独立进程里跑类型检查，两边并行。

另一条更主流的路是用 `babel-loader` 配 `@babel/preset-typescript`。babel 只做语法转换、直接把类型标注删掉，速度很快，类型检查完全交给 `tsc --noEmit` 在 CI 或者编辑器里做。代价是 babel 不理解类型，`const enum`、`namespace` 这类需要类型信息的特性它处理不了。我自己现在的项目走的是这条路。

webpack 5 上还有个细节，`resolve.extensions` 记得把 `.ts` 和 `.tsx` 加进去，不然 `import './a'` 找不到 `a.ts`。



### 3.3 提取 js 的公用代码

- 减少代码冗余
- 提高加载速度

多页面项目里，`pageA` 和 `pageB` 都 `import` 了同一个工具模块，不做处理的话这个模块会在两个 bundle 里各存一份。用户先后访问这两个页面，同样的代码要下载两遍。提取公共代码就是把这部分抽成独立文件，两个页面共用一份，第二个页面直接命中缓存。

第三方库更值得提。`react` 加 `react-dom` 一百多 KB，它们一年也升级不了几次，跟业务代码打在一起就意味着每次发版用户都要重新下载。


> 主要使用内置插件实现`webpack.optimize.CommonsChunkPlugin`

```js
{
	plugins: [
	     new webpack.optimize.CommonsChunkPlugin(option)
	]
}
```

`option` 里最常用的是三个参数。`name` 或 `names` 指定提取出来的 chunk 叫什么；`minChunks` 是阈值，一个模块被多少个 chunk 引用才值得提取，填数字是次数，填 `Infinity` 表示只提取 `entry` 里显式声明的；`chunks` 限定在哪几个 chunk 之间找公共代码，不写就是全部。


下面这个例子把业务公共代码、第三方库、webpack runtime 三样东西分别提了出来。

```js
module.exports = {
    entry: {
        "pageA": "./src/pageA",
        "pageB": "./src/pageB",
        "vendor": ['lodash']//业务代码和第三方代码区分开,给lodash单独打一个包
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].bundle.js',
        chunkFilename: '[name].chunk.js'
    },
    plugins: [
    // 提取common
    new webpack.optimize.CommonsChunkPlugin({
         name: 'common',
         minChunks:2,//出现两次就打包成common代码
         chunks: ['pageA','pageB']//指定范围提取公共代码
     })
        
    // 提取vendor、取业务代码manifest
     new webpack.optimize.CommonsChunkPlugin({
         //把entry的vendor代码和这里的common（webpack打包的）代码合并
         names: ['vendor','manifest']
         minChunks: Infinity
     })
     // ==== 提取业务代码manifest== 合并到上面names中
     // 如果不想把webpack打包的代码和vendor代码合并 需要提取到manifest
     //new webpack.optimize.CommonsChunkPlugin({
         // webpack代码和vendordiam区分开
       //  name: 'manifest' //manifest即生成
       //  minChunks: Infinity
    // })
     
    ]
}
```

这份配置里有三个动作，拆开看会清楚很多。

第一个 `CommonsChunkPlugin` 做的是「业务公共代码提取」。`minChunks: 2` 表示一个模块被两个及以上的 chunk 引用就抽出来，`chunks: ['pageA','pageB']` 限定了只在这两个入口之间找公共部分。

第二个做的是「第三方库和 runtime 提取」。`vendor` 是我们在 `entry` 里手动列的第三方库入口，`minChunks: Infinity` 表示不按引用次数抽取，只把 `entry` 里显式指定的那些放进去。`names: ['vendor','manifest']` 里的 `manifest` 是关键，webpack 自己有一段运行时代码（模块加载器和模块 id 映射表），如果不单独提出来它会跟 `vendor` 打在一起，业务代码一变，`vendor` 的 hash 也跟着变，长期缓存就废了。

注释掉的那一段是把 manifest 单独再提一次的写法，效果和写在 `names` 数组里一样。


![CommonsChunkPlugin 提取公共代码之后的产物结构](https://s.poetries.top/gitee/2019/10/646.png)

从图里能看到产物被拆成了几块，`common` 是两个页面共用的业务代码，`vendor` 是第三方库，`manifest` 是 webpack 的运行时。

先说结论，这套 `CommonsChunkPlugin` 的写法在 webpack 4 已经被移除了，现在用 `optimization.splitChunks`。但它背后的三层拆分思路完全没变，理解了这里，`splitChunks` 的配置项才看得懂。对应关系大致是：`minChunks: 2` 对应 `splitChunks.minChunks`，按范围提取对应 `cacheGroups` 加 `chunks` 选项，提取 manifest 对应 `optimization.runtimeChunk: 'single'`。

`splitChunks` 相比它的进步在于「自动」。它内置了一组启发式规则，默认就会把 `node_modules` 里的东西和被多次引用的模块拆出来，多数项目写一句 `chunks: 'all'` 就够用了，不用像上面这样一条条手写。



### 3.4 代码分割和懒加载

上一节的 `CommonsChunkPlugin` 解决的是「把公共代码抽出来」，抽出来的仍然是首屏就要加载的。代码分割要解决的是另一件事：把首屏用不到的代码切出去，等真正需要的时候再去下载。

webpack 里实现按需加载有两种写法，一种是它自己的 `require.ensure`，一种是标准的动态 `import()`。

**第一种方式：通过wepack内置方法**

> `require.ensure`动态加载一个模块，接收四个参数

- `[]:dependencies` 初次并不会执行
- `callback`的时候才会执行
- `errorCallback` 可省略
- `chunkName`

`require.ensure` 的语义是「把这些依赖单独打成一个 chunk，等回调执行的时候再去加载」。注意第一个参数里的依赖只是「声明」，不会自动执行，回调里还得再 `require` 一次才拿得到模块，这是它最容易踩的地方。


**第二种方式：通过ES2015 Loader Spec**

> `System.import()`后面演变为`import()`来动态加载模块


这两种写法的区别不只是语法。`require.ensure` 是 webpack 自己的 API，其他构建工具不认；`import()` 是 TC39 的标准提案，Vite、Rollup、esbuild 都支持，浏览器原生也实现了。所以现在写新代码一律用 `import()`，`require.ensure` 只在读老项目时需要认识。

`import()` 返回一个 `promise`，在 `import` 里传入需要依赖的模块名，就可以像用 `Promise` 一样写 `import().then()`


**代码分割场景**

- 分离业务代码 和 第三方依赖
- 分离业务代码 和 业务公共代码 和 第三方依赖
- 分离首次加载 和 访问后加载的代码

这三种场景对应的其实是三个不同的问题。第一种解决「第三方库不常变，不该跟着业务代码一起失效缓存」；第二种在此基础上再把多页面共用的业务代码抽出来；第三种解决「首屏不该为用不到的功能买单」，比如后台管理系统里那些点进去才用得上的图表库、富文本编辑器。


先看一份基础配置，重点是 `chunkFilename` 和 `publicPath` 这两项。

```js
module.exports = {
    entry: {
        "pageA": "./src/pageA"
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        publicPath: './dist/',//动态加载路径
        filename: '[name].bundle.js',
        chunkFilename: '[name].chunk.js'
    }
}
```

这里的 `chunkFilename` 专门管异步 chunk 的命名，和 `filename` 管的入口产物是两码事。`publicPath` 更关键，异步 chunk 是运行时用 JSONP 动态插 `<script>` 加载的，webpack 需要知道去哪个前缀下取文件，配错了表现就是「首屏正常，点进子页面报 404」。上了 CDN 之后这里填 CDN 域名。


> 目标是提取`pageA`、`pageB`中公共的模块`moduleA`

```js
//src/pageA.js

import './subPageA'
import './subPageB'

//ensure的时候代码不会执行 需要在下面加载一次
require.ensure(['lodash'],function(){
    var _ = require('lodash')
    _.join([1,2,3])
},'vendor')// 指定chunk名称


export default 'pageA'
```

`require.ensure` 的第一个参数是依赖数组，webpack 会为它们单独生成一个 chunk，但不会执行；真正要用的时候还得在回调里再 `require` 一次，这是它最反直觉的一点，很多人只写了第一个参数然后发现模块是 undefined。第三个字符串参数是 chunk 名，产出的文件就叫 `vendor.chunk.js`。


运行打包，这时 `lodash` 被提取到了 `vendor` 里

![lodash 被提取到 vendor chunk 的打包结果](https://s.poetries.top/gitee/2019/10/647.png)

这时候还不是我们想要的

问题在于 `subPageA` 和 `subPageB` 还是跟着 `pageA` 一起打进了初始包，用户打开页面就要下载两个分支的代码，但实际只会走其中一条。所以要把这两个分支也改成按需加载。


```js
//src/pageA.js

require.include('./moduleA')

if(page === 'subPageA'){
  require.ensure(['./subPageA'],function(){
    var subPageA = require('./subPageA')
    },'subPageA')// 指定chunk名称
}else{
  require.ensure(['./subPageB'],function(){
    var subPageB = require('./subPageB')
    },'subPageB')// 指定chunk名称
}


//ensure的时候代码不会执行 需要在下面加载一次
require.ensure(['lodash'],function(){
    var _ = require('lodash')
    _.join([1,2,3])
},'vendor')// 指定chunk名称


export default 'pageA'
```

`require.include` 是这里的关键。它的作用是「把这个模块提前塞进当前 chunk，但不执行」。因为 `subPageA` 和 `subPageB` 都依赖 `moduleA`，不做处理的话两个异步 chunk 里会各带一份；用 `require.include` 把它提到父 chunk 里，两个子 chunk 就都不用带了。


![按条件拆分出 subPageA 和 subPageB 之后的 chunk 列表](https://s.poetries.top/gitee/2019/10/648.png)

> 这时候只有 `pageA` 里才有 `moduleA`

![moduleA 只被打进 pageA 的产物结构](https://s.poetries.top/gitee/2019/10/649.png)

> 新建一个html验证是否动态加载

```html
<html>
    <body>
        <script src="./dist/pageA.bundle.js"></script>
    </body>
</html>
```


![浏览器中按需请求异步 chunk 的网络记录](https://s.poetries.top/gitee/2019/10/650.png)

打开 Network 面板就能看到，页面初始只加载了 `pageA.bundle.js`，点到对应分支时才发出第二个请求去取子 chunk。异步加载的效果就是这个。



**import()动态加载的写法**


把上面那段 `require.ensure` 换成 `import()` 之后是这样，`webpackChunkName` 这个魔法注释的作用和 `require.ensure` 的第四个参数一样，用来指定 chunk 名。

```js
//src/pageA.js

require.include('./moduleA')

var page = 'subPageA'

if(page === 'subPageA'){
 // 指定chunkName /** webpackChunkName: 'subPageA' **/ 
  import(/* webpackChunkName: 'subPageA' */ './subPageA').then(function(subPageA){
      console.log(subPageA)
  })
}else{
  import(/* webpackChunkName: 'subPageB' */ './subPageB').then(function(subPageB){
      console.log(subPageB)
  })
}

// 异步加载lodash
//ensure的时候代码不会执行 需要在下面加载一次
require.ensure(['lodash'],function(){
    var _ = require('lodash')
    _.join([1,2,3])
},'vendor')// 指定chunk名称


export default 'pageA'
```

`import()` 比 `require.ensure` 好在哪？它是标准提案，返回 Promise，能配合 `async/await` 写；`require.ensure` 是 webpack 私有的 API，换构建工具就得全改。现在写新代码一律用 `import()`。

React 的 `React.lazy`、Vue 的异步组件，底层用的都是 `import()`，路由级别的代码分割就是这么实现的。


> 如果`/** webpackChunkName: 'subPageA' **/`相同，则会合并处理

合并了`subPageA`和`subPageB`

![chunkName 相同导致 subPageA 与 subPageB 被合并成同一个 chunk](https://s.poetries.top/gitee/2019/10/651.png)

来看看打包后的文件，既有A、B

![合并后的 chunk 里同时包含 subPageA 和 subPageB 两个模块](https://s.poetries.top/gitee/2019/10/652.png)

所以 `webpackChunkName` 不只是给文件起个好看的名字，它还是「合并」的依据。同名的动态导入会被打进同一个 chunk，想让两个模块合并成一个请求就给它们起一样的名字，想拆开就起不同的名字。这个控制粒度在按路由拆包时特别有用，比如把几个低频页面合并成一个 chunk，避免请求太碎。

另外这里的注释写法要写成 `/* webpackChunkName: 'xxx' */`，是普通块注释不是 JSDoc 的 `/** */`，而且必须写在 `import()` 的括号里、模块路径前面。原文那几处写成了 `/** ... **/` 并且多了个逗号，这样是解析不了的，我顺手改成了标准写法。


**在`webpack`代码分割中使用`async`异步加载**


上面处理的都是同步的公共代码，异步 chunk 之间的公共部分要另外配。`pageA` 和 `pageB` 都会异步加载 `subPageA`、`subPageB`，而这两个子页面又都依赖 `moduleA`，如果不管，`moduleA` 会被复制两份。

```js
module.exports = {
    entry: {
        "pageA": "./src/pageA",
        "pageB": "./src/pageB",
        "vendor": ['lodash']//业务代码和第三方代码区分开,给lodash单独打一个包
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].bundle.js',
        chunkFilename: '[name].chunk.js'
    },
    plugins: [
    // add 异步模块
    new webpack.optimize.CommonsChunkPlugin({
        aysnc:'async-common',//异步共同的东西
        children: true,
        names: ['vendor','manifest']
        minChunks: Infinity
    })
     
     
    // 提取vendor、取业务代码manifest
     new webpack.optimize.CommonsChunkPlugin({
         //把entry的vendor代码和这里的common（webpack打包的）代码合并
         names: ['vendor','manifest']
         minChunks: Infinity
     })
     
    ]
}
```

下面这几个源文件的关系是：`pageA` 和 `pageB` 各自异步加载 `subPageA` 或 `subPageB`，而 `subPageA` 和 `subPageB` 都依赖 `moduleA`。目标是让 `moduleA` 也被异步提取出来，而不是被打进两个子页面各一份。


```js
//src/subPageA.js


import './moduleA'

console.log('this. is subPageA')

export default 'subPageA'
```

```js
//src/subPageB.js


import './moduleA'

console.log('this. is subPageB')

export default 'subPageB'
```

```js
//src/moduleA.js


import './moduleA'

console.log('this. is moduleA')

export default 'moduleA'
```


```js
//src/pageA.js

// 异步加载不能include 否则会和pageA打包到一起
// require.include('./moduleA')

import _ from 'lodash'

var page = 'subPageA'

if(page === 'subPageA'){
 // 指定chunkName /** webpackChunkName: 'subPageA' **/ 
  import(/* webpackChunkName: 'subPageA' */ './subPageA').then(function(subPageA){
      console.log(subPageA)
  })
}else{
  import(/* webpackChunkName: 'subPageB' */ './subPageB').then(function(subPageB){
      console.log(subPageB)
  })
}

// === lodash不在异步加载
//ensure的时候代码不会执行 需要在下面加载一次
//require.ensure(['lodash'],function(){
//    var _ = require('lodash')
//    _.join([1,2,3])
//},'vendor')// 指定chunk名称


export default 'pageA'
```

```js
//src/pageB.js

import _ from 'lodash'

var page = 'subPageB'

if(page === 'subPageA'){
 // 指定chunkName /** webpackChunkName: 'subPageA' **/ 
  import(/* webpackChunkName: 'subPageA' */ './subPageA').then(function(subPageA){
      console.log(subPageA)
  })
}else{
  import(/* webpackChunkName: 'subPageB' */ './subPageB').then(function(subPageB){
      console.log(subPageB)
  })
}

// === lodash不在异步加载
//ensure的时候代码不会执行 需要在下面加载一次
//require.ensure(['lodash'],function(){
//    var _ = require('lodash')
//    _.join([1,2,3])
//},'vendor')// 指定chunk名称


export default 'pageB'
```


![异步提取公共模块之后的构建输出](https://s.poetries.top/gitee/2019/10/653.png)
![异步公共 chunk 的产物文件列表](https://s.poetries.top/gitee/2019/10/654.png)


> 这样就把`subpageA`和`subPageB`共同依赖的`moduleA`异步提取出来

这段配置的核心是 `async: 'async-common'` 加 `children: true`。`children: true` 表示分析入口 chunk 的子 chunk（也就是异步加载出来的那些），`async` 则表示把它们的公共部分单独提成一个异步 chunk，而不是合并回入口。

不这么配的话，`moduleA` 会被 `subPageA` 和 `subPageB` 各打一份，用户不管点哪条分支都要下载重复代码。

webpack 4 之后这一整套 `CommonsChunkPlugin` 的写法都被 `optimization.splitChunks` 取代了，而且默认配置就已经处理了异步 chunk 的公共模块提取，多数项目根本不用写：

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
}
```

`chunks: 'all'` 表示同步和异步 chunk 都参与拆分，这也是现在最常用的一个值。`splitChunks` 的完整配置项我在 [Webpack 5 构建性能优化实战](https://feinterview.poetries.top/blog/webpack-5-build-optimization) 里展开写过。



### 3.5 处理 CSS 和 CSS 模块化

CSS 在 webpack 里的处理链是所有资源里最长的，一条 rule 上挂三四个 loader 是常态。这一节从最简单的两个 loader 开始，一层层往上加预处理器、模块化、提取成文件。

**引入css**

> 需要两个`loader`，`style-loader`(创建标签到文档流中)、`css-loader`(可以`import`一个样式文件，使得在`js`中可以使用)


这两个 loader 的顺序是新手最常出错的地方。`use` 数组是从右往左执行的，写成 `['style-loader', 'css-loader']` 表示先跑 `css-loader` 把 CSS 解析成 JS 模块，再交给 `style-loader` 在运行时创建 `<style>` 标签插进页面。写反了会报一堆看不懂的语法错误，因为 `style-loader` 拿到的是还没处理过的原始 CSS 文本。

记法很简单，离文件近的写在后面，离页面近的写在前面。

**Style-Loader**

> `style-loader`除了本身，还有这几个`loader`

- `style-loader/url` 可以注入link标签到页面
- `style-loader/useable` 控制样式是否插入到页面中

这两个是 `style-loader` 的子路径写法。`/url` 会生成 `<link>` 标签而不是 `<style>`，`/useable` 则给模块加上 `use()` 和 `unuse()` 两个方法，让你能手动控制样式什么时候插进页面，做主题切换时用得上。


Style-Loader的options

- `insertAt` （插入位置）
- `insertInto` （插入到`dom`）
- `singleton` （是否只使用一个`style` 标签）
- `transform` （转化，浏览器环境下，插入页面前）

这几个 options 里日常会用的其实只有 `insertAt`。默认样式会插到 `<head>` 末尾，如果你的项目里有一份必须最后生效的覆盖样式，或者引了组件库需要让自己的样式排在后面，就要靠它调整插入位置。`singleton` 把所有样式合并进一个 `<style>` 标签，能减少标签数量，但会让 source map 失效，调试时别开。

`style-loader/url` 和 `style-loader/useable` 这两个子路径在 `style-loader` 1.0 之后被移除了，改成用 `injectType` 选项区分，比如 `injectType: 'linkTag'` 对应原来的 `/url`。


下面这份配置演示的是 `style-loader/url` 那种用法。

```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: './dist/', //指定从项目中哪里引入资源 
        filename: '[name].bundle.js'
    },
    module: {
        // loader解析从后往前处理
        rules: [
            {
                test: /\.css$/,
                use: [
                    {
                        //loader: 'style-loader',
                        loader: 'style-loader/url', //使用这个可以往页面注入link标签 而不是style,这个并不常用
                    },
                    {
                        //loader: 'css-loader',
                        loader: 'file-loader'//使用这个可以往页面注入link标签 而不是style 这个并不常用
                    }
                ]
            }
        ]
    }
}
```

这段配置里 `style-loader/url` 配 `file-loader` 是一种少见的组合，它会把 CSS 输出成独立文件再用 `<link>` 引入，而不是内联成 `<style>`。原文自己也标了「并不常用」，真要提取 CSS 请看下面「提取 CSS」那一节，那才是正路。


**CSS-Loader**

options

- `alias` （解析的别名）
- `importLoader` （`@import` ）
- `Minimize` （是否压缩）
- `modules` （启用`css-modules`）

`css-loader` 干的是「把 CSS 当模块解析」。它会去处理 CSS 里的 `@import` 和 `url()`，把它们变成 webpack 认识的依赖，这样图片和字体才能被后续的 loader 接管。

`minimize` 是压缩开关，`modules` 是 CSS Modules 开关，这两个都在后续版本里改过写法，下面单独说。


**CSS-Modules**

```
localIdentName: '[path][name]__[local]--[hash:base64:5]'
```

CSS Modules 解决的是全局命名冲突。开了之后，`.title` 这样的类名会被编译成 `src-app__title--2Kj3f` 这种带哈希的唯一标识，JS 里通过 `import styles from './a.css'` 拿到映射对象，再写 `styles.title`。两个组件都写 `.title` 也不会互相覆盖。

`localIdentName` 就是这套命名规则的模板，`[path]` 是文件路径，`[name]` 是文件名，`[local]` 是你原本写的类名，`[hash:base64:5]` 是防冲突的哈希。

`importLoaders` 这个选项容易被忽略。它告诉 `css-loader`，在处理 `@import` 进来的文件时要回头再走几个 loader。写了 `importLoaders: 2` 表示 `@import` 的文件也要经过 `postcss-loader` 和 `less-loader`，不写的话被 import 进来的那些文件不会被加前缀，问题很隐蔽。


把这几项拼起来就是下面这份配置。

```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: './dist/', //指定从项目中哪里引入资源 
        filename: '[name].bundle.js'
    },
    module: {
        // loader解析从后往前处理
        rules: [
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader',
                        options: { 
                           //合并多个style为一个
                            singleton:true
                        }
                    },
                    {
                        loader: 'css-loader',
                        options: {
                           minimize:true,
                           modules: true,
                           // css模块化
                           localIdentName: '[path][name]_[local]_[hash:base64:5]'
                        }
                    }
                ]
            }
        ]
    }
}
```

`localIdentName` 里的占位符决定了生成的类名长什么样。开发环境建议保留 `[path][name]__[local]`，在 DevTools 里能一眼看出这个类来自哪个文件；生产环境可以只留 `[hash:base64:5]`，产物更小。

`css-loader` 从 4.0 开始，`modules` 的写法变了，改成 `modules: { localIdentName: '...' }` 嵌套形式，`minimize` 选项也被移除了（压缩交给 `css-minimizer-webpack-plugin` 做）。老配置升级时这两处必踩。



**配置Less / Sass**

```bash
npm install less-loader less  --save-dev
npm install sass-loader node-sass --save-dev
```

预处理器的 loader 要放在 `css-loader` 后面（数组里靠后，执行靠前），先把 less / sass 编译成标准 CSS，再交给 `css-loader` 去解析里面的 `@import` 和 `url()`。顺序反了会直接报语法错误，因为 `css-loader` 看不懂嵌套和变量。



配置上就是往 `use` 数组末尾追加对应的 loader。

```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: './dist/', //指定从项目中哪里引入资源 
        filename: '[name].bundle.js'
    },
    module: {
        // loader解析从后往前处理
        rules: [
            {
                test: /\.(css|less)$/,
                use: [
                    {
                        loader: 'style-loader',
                        options: { 
                           //合并多个style为一个
                            singleton:true
                        }
                    },
                    {
                        loader: 'css-loader',
                        options: {
                           minimize:true,
                           modules: true,
                           // css模块化
                           localIdentName: '[path][name]_[local]_[hash:base64:5]'
                        }
                    },
                    {
                        loader: 'less-loader'
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            }
        ]
    }
}
```

这里有个问题原文没说破，同一条 rule 里同时挂 `less-loader` 和 `sass-loader` 其实是不对的。loader 链是所有匹配文件都要走一遍的，`.less` 文件被塞进 `sass-loader` 会直接报语法错误。正确做法是拆成两条 rule，`/\.less$/` 走 less 链，`/\.s[ac]ss$/` 走 sass 链，公共的 `style-loader` 和 `css-loader` 各写一份。

还有一点时效性。`node-sass` 依赖 node-gyp 编译原生模块，装不上是老前端的集体记忆，它现在已经废弃了，改用 `sass` 这个包（Dart Sass 的 JS 版本），`sass-loader` 会自动选它。想要更快的话可以用 `sass-embedded`。



**提取 CSS**

- `extract-loader`
- `ExtractTextWebpackPlugin`

开发时用 `style-loader` 把样式塞进 `<style>` 标签很方便，热更新快，但生产环境不行。样式跟着 JS 一起加载，JS 没执行完页面就是裸的，会出现明显的样式闪烁；而且 CSS 和 JS 绑在一个文件里，改一行样式整个 JS 的缓存就失效了。

所以生产构建要把 CSS 提取成独立文件，用 `<link>` 引入，浏览器可以和 JS 并行下载，也能单独缓存。



下面是接入提取插件之后的完整写法，注意它把整条 `use` 链包在了 `extract()` 里。

```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: './dist/', //指定从项目中哪里引入资源 
        filename: '[name].bundle.js'
    },
    module: {
        // loader解析从后往前处理
        rules: [
            {
                test: /\.(css|less)$/,
                use:
                ExtractTextWebpackPlugin.extract({
                    // 提取css并不会自动加入到文档中，需要在HTML手动加入css文件
                    fallback: {
                        loader: 'style-loader',
                        options: { 
                           //合并多个style为一个
                            singleton:true
                        }
                    },
                    // 处理css
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                               minimize:true,
                               modules: true,
                               // css模块化
                               localIdentName: '[path][name]_[local]_[hash:base64:5]'
                        }
                        },
                        {
                            loader: 'less-loader'
                        },
                        {
                            loader: 'sass-loader'
                        }
                    ]
                })
            }
        ]
    },
    plugins: [
        new ExtractTextWebpackPlugin({
            filename: '[name].min.css',
            allChunks: false //指定提取css范围，true所有import进来的css
        })
    ]
}
```

`extract()` 的 `fallback` 是兜底方案，某些情况下（比如异步 chunk 且 `allChunks: false`）样式没被提取，就退回用 `style-loader` 运行时插入。`use` 里放的是提取之前要跑的处理链。


![提取 CSS 之后生成的独立样式文件](https://s.poetries.top/gitee/2019/10/655.png)

提取出来的 CSS 不会自动出现在页面上，`ExtractTextWebpackPlugin` 只负责生成文件，插入标签是 `HtmlWebpackPlugin` 的活，或者你手动在 HTML 里写 `<link>`。这一点原文的注释里提到了，实践中忘了这步的表现是「构建成功、CSS 文件也在、页面就是没样式」。

`allChunks` 这个选项决定提取范围。默认 `false` 只提取初始 chunk 里的样式，异步 chunk 里的 CSS 仍然走 `style-loader` 运行时插入；设成 `true` 则全部提取。异步加载的组件如果样式闪烁，可以试试打开它。

现在这个插件已经不用了。`ExtractTextWebpackPlugin` 在 webpack 4 上兼容性问题很多，官方推荐 `mini-css-extract-plugin`，写法上它是一个 loader 加一个 plugin，不再需要 `extract()` 那种包装：

```javascript
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  module: {
    rules: [{
      test: /\.less$/,
      use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader']
    }]
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: '[name].[contenthash:8].css' })
  ]
}
```

开发环境仍然用 `style-loader`，因为它支持 CSS 的热更新；生产环境才换成 `MiniCssExtractPlugin.loader`。这是现在的标准做法。


### 3.6 PostCSS in Webpack

PostCSS 不是预处理器，它是 CSS 的 babel。你给它一份 CSS，它解析成 AST，交给一串插件依次改写，再输出新的 CSS。所以它能做什么，完全取决于你挂了哪些插件。

安装

- `postcss`
- `postcss-loader`
- `Autoprefixer`
- `cssnano`
- `postcss-cssnext`

这几个包的分工是这样的。`postcss` 是内核，它只负责把 CSS 解析成 AST 再输出，本身什么都不做。`postcss-loader` 是它和 webpack 的桥。真正干活的是插件：`autoprefixer` 按目标浏览器自动补 `-webkit-` 这类前缀，`cssnano` 做压缩（删空格、合并规则、简写颜色值），`postcss-cssnext` 让你能写 CSS 未来标准的语法再降级成当前浏览器能认的。

拿 PostCSS 和 Sass 比是个常见误区。Sass 是一门要编译的语言，PostCSS 是一套处理 CSS 的工具链，两者不冲突，实际项目里经常一起用，Sass 负责变量和嵌套，PostCSS 负责兼容性和压缩。


下面这份配置在上一节 CSS 处理链的基础上，多挂了一个 `postcss-loader`。

```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: './dist/', //指定从项目中哪里引入资源 
        filename: '[name].bundle.js'
    },
    module: {
        // loader解析从后往前处理
        rules: [
            {
                test: /\.(css|less)$/,
                use:
                ExtractTextWebpackPlugin.extract({
                    // 提取css并不会自动加入到文档中，需要在HTML手动加入css文件
                    fallback: {
                        loader: 'style-loader',
                        options: { 
                           //合并多个style为一个
                            singleton:true
                        }
                    },
                    // 处理css
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                               minimize:true,
                               modules: true,
                               // css模块化
                               localIdentName: '[path][name]_[local]_[hash:base64:5]'
                        }
                        },
                        {
                            loader: 'less-loader'
                        },
                        {
                            loader: 'sass-loader'
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                ident: 'postcss',
                                plugins: [
                                    require('autoprefixer')()
                                ]
                            }
                        }
                    ]
                })
            }
        ]
    },
    plugins: [
        new ExtractTextWebpackPlugin({
            filename: '[name].min.css',
            allChunks: false //指定提取css范围，true所有import进来的css
        })
    ]
}
```

这里有个顺序问题原文没提，我补一下。`use` 数组是从后往前执行的，上面这份配置里 `postcss-loader` 排在最后，实际是最先执行，也就是在 less / sass 编译之前就跑了 PostCSS。这个顺序在只用 `autoprefixer` 时问题不大，但如果 PostCSS 插件依赖最终的 CSS 结构（比如合雪碧图、算 rem），就应该让它跑在预处理器之后，也就是把它放到 `less-loader` 前面。

另外把 PostCSS 的插件写在 webpack 配置里会让配置越来越臃肿，实践中一般单独建一个 `postcss.config.js`：

```javascript
module.exports = {
  plugins: [
    require('autoprefixer'),
    require('cssnano')
  ]
}
```

`autoprefixer` 加前缀的依据是 browserslist，也就是 `package.json` 里的 `browserslist` 字段或者 `.browserslistrc` 文件。配了 `last 2 versions` 和 `> 1%` 之后，需要哪些前缀由 Can I Use 的数据算出来，不用你自己记。这一点很关键，很多人以为 autoprefixer 是无脑加全部前缀，其实它加的是「你的目标浏览器确实需要的那些」。

`postcss-cssnext` 现在已经废弃，官方接班的是 `postcss-preset-env`，用法和 `@babel/preset-env` 一个思路，按目标浏览器决定要不要转译某个 CSS 新特性。`postcss-loader` 从 4.0 开始配置项也改了，`ident` 和 `plugins` 收进了 `postcssOptions` 里，老写法在新版本上会报 unknown option。


### 3.7 Tree shaking


Tree shaking 这个名字听着玄，做的事很朴素：把依赖树里没被引用到的分支摇掉。它成立的前提是 ES module 的 `import` / `export` 是静态结构，编译期就能确定谁引用了谁；CommonJS 的 `require` 可以写在 `if` 里、可以拼字符串，静态分析没法下手，所以摇不动。

我一开始也以为开个开关就完事了，实际上它是个很挑食的优化，下面这几种情况都会让它悄无声息地失效。

#### 3.7.1 JS Tree shaking

**使用场景**

- 常规优化
- 引入第三方库的某一个功能

第一种是常规优化，删掉自己代码里写了但没用到的导出。第二种是重头戏，引入 `lodash`、`antd` 这类大库时只用到其中几个函数，理想情况是产物里只留那几个函数的代码。实际上这一步经常不生效，原因下面会说。


 下面这份配置里，Tree shaking 是靠两样东西合力完成的。

```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: './dist/', //指定从项目中哪里引入资源 
        filename: '[name].bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['env'],
                            plugins: [
                                // lodash Tree shaking
                                'lodash'
                            ]
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new ExtractTextWebpackPlugin({
            filename: '[name].min.css',
            allChunks: false //指定提取css范围，true所有import进来的css
        })
        // Tree shaking
        new webpack.optimize.UglifyJsPlugin({
            
        })
    ]
}
```

这里要理解的是分工。`babel-plugin-lodash` 解决的是「引用方式」，`UglifyJsPlugin` 解决的是「删掉没引用的代码」。两者缺一不可，只配前者产物里仍然会留着死代码，只配后者则因为 lodash 是 CommonJS 写的，压缩器根本不敢删。


> 有些库不是es模块写的，并不能`tree shaking`。需要借助其他工具 

```
npm i babel-loader babel-core babel-preset-env babel-plugin-lodash --save
```

这行命令装的是 `babel-plugin-lodash`，它的作用是在编译期把 `import { join } from 'lodash'` 改写成 `import join from 'lodash/join'`，只引入用到的那个文件，绕开「整个 lodash 都被打进来」的问题。


> lodash Tree不生效

- `lodash-es` --> no
- `babel-lugin-lodash` --->working

> 查看模块是否Tree Shaking方式：去第三方库index.js中看模块书写方式是否是es

这条判断方法今天仍然适用，不过有更省事的做法：看这个包的 `package.json` 里有没有 `module` 字段。有的话说明它同时提供了 ES module 版本的入口，webpack 会优先用那个，Tree shaking 才有分析基础。还有一个 `sideEffects` 字段，标成 `false` 表示「这个包里的模块都没有副作用，随便删」，标成数组则是列出哪些文件有副作用（通常是 CSS 文件），这个字段对裁剪效果影响很大。

webpack 4 之后 Tree shaking 的配置简化了。`mode: 'production'` 会自动打开 `optimization.usedExports`（标记哪些导出没被用到）和 `optimization.minimize`（真正把标记的代码删掉），不用再手动 new 压缩插件。这两步是分开的，标记阶段只是加注释，删除是压缩器干的，理解这一点就明白为什么「开了 Tree shaking 但产物没变小」，多半是压缩那一步没生效。

还有几种写法会让 Tree shaking 直接失效：用 `require` 而不是 `import`、`import * as utils` 然后动态取属性、babel 把 ES module 转成了 CommonJS（`@babel/preset-env` 要配 `modules: false`）、包里有顶层副作用代码。lodash 的例子就属于第三种情况的变体，它本身是 CommonJS 写的，所以只能靠 `babel-plugin-lodash` 把 `import { join } from 'lodash'` 改写成 `import join from 'lodash/join'`，绕开整包引入。

现在更省事的选择是直接用 `lodash-es`，它是 ES module 版本，配合 webpack 5 能被正常摇树。原文里写 `lodash-es` 不行，那是当年 babel 会把 ES module 转成 CommonJS 导致的，把 `modules: false` 配上就正常了。

#### 3.7.2 CSS Tree shaking

> 主要使用 `purifycss-webpack`

CSS 这边的思路和 JS 完全不同。JS 靠的是 ES module 的静态结构做依赖分析，CSS 没有这套东西，只能反过来做：先把项目里所有 HTML 和 JS 扫一遍，收集用到的选择器，再拿这份清单去 CSS 里做减法。


配置上它要放在 `ExtractTextWebpackPlugin` 后面，因为它处理的是已经被提取出来的那个 CSS 文件，插件顺序反了就什么都扫不到。

```js
const glob = require('glob-all')

module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: './dist/', //指定从项目中哪里引入资源 
        filename: '[name].bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['env'],
                            plugins: [
                                // lodash Tree shaking
                                'lodash'
                            ]
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new ExtractTextWebpackPlugin({
            filename: '[name].min.css',
            allChunks: false //指定提取css范围，true所有import进来的css
        })
        
        // 放到ExtractTextWebpackPlugin后面
        new PurifyCss({
            paths: glob.sync([
                path.join(__dirname,'./*.html'),
                path.join(__dirname,'./src/*.js')
            ])
        })
        
        // Tree shaking
        new webpack.optimize.UglifyJsPlugin({
            
        })
    ]
}
```

`purifycss-webpack` 的做法是扫描你指定的 HTML 和 JS 文件，收集里面出现过的类名，再把 CSS 里没被用到的规则删掉。`glob-all` 用来一次匹配多个路径。

这类工具有个共同的软肋，动态拼出来的类名它认不出来。写 `className={'btn-' + type}` 或者 `classList.add(someVar)`，对应的样式会被当成无用规则删掉，页面上直接掉样式。所以上线前一定要在真实页面上过一遍，别只看构建有没有报错。这个坑我踩过，表现是某个状态下按钮突然没了背景色，查了半天才想到是 CSS 被裁了。

`purifycss-webpack` 现在已经不维护了，接班的是 `purgecss-webpack-plugin`，判断更准，也提供了 `safelist` 让你把动态类名加进白名单：

```javascript
const { PurgeCSSPlugin } = require('purgecss-webpack-plugin')
const glob = require('glob')

new PurgeCSSPlugin({
  paths: glob.sync(`${path.join(__dirname, 'src')}/**/*`, { nodir: true }),
  safelist: [/^btn-/]
})
```

用了 Tailwind 这类原子化 CSS 的项目不需要额外配，它们自己内置了同样的裁剪逻辑。


## 四、由浅入深Webpack

上一节把核心概念和基础配置过了一遍，这一节往下沉一层，讲那些「demo 里用不上、真项目里躲不掉」的部分：各类静态资源怎么处理，HTML 怎么自动生成并把资源正确地插进去。

这两块是老项目里最容易积攒历史包袱的地方，一份配置里同时存在 `file-loader`、`url-loader`、`html-loader` 三种资源处理方式的情况我见过不止一次。

### 4.1 文件处理 

图片、字体、第三方脚本这三类东西，共同点是它们都不是 JS，webpack 默认不认识。区别在于处理目标不一样：图片要考虑体积和请求数，字体要考虑格式兼容，第三方脚本要考虑全局变量怎么注入。

#### 4.1.1 图片处理

- `css`中引入图片
- 自动合成雪碧图
- 压缩图片
- `Base64`编码

> 处理需要用到的`loader`

- `file-loader` `css`中引入图片
- `url-loader` `base64`编码
- `img-loader` 压缩图片
- `postcss-sprites`合成雪碧图

这四个 loader 各管一段，串起来才是完整的图片处理链。

`file-loader` 是基础，它把图片当作模块引进来，输出到指定目录，再把 `import` 的结果换成最终的 URL。`url-loader` 是它的上层封装，多了一个体积判断，小图转 base64 内联，大图透传给 `file-loader`。`img-loader` 负责压缩，`postcss-sprites` 在 CSS 层面合并雪碧图。

顺序上，`url-loader` 要放在 `img-loader` 前面（数组里靠前，执行靠后），先压缩再决定要不要转 base64，这样内联的也是压缩过的数据。


#### 4.1.2 处理雪碧图、base64、压缩图片


下面这份配置把 CSS 处理链和图片处理链拼在了一起，代码有点长，我拆开说。CSS 那一段和上一节讲的一样，多的是 `postcss-sprites`；图片那一段是新的，`url-loader` 加 `img-loader` 两级串联。

```js
module.exports = {
    module: {
         rules: [
            {
                test: /\.(css|less)$/,
                use:
                extractLess.extract({
                    // 提取css并不会自动加入到文档中，需要在HTML手动加入css文件
                    fallback: {
                        loader: 'style-loader',
                        options: { 
                           //合并多个style为一个
                            singleton:true
                        }
                    },
                    // 处理css
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                               minimize:true,
                               modules: true,
                               // css模块化
                               localIdentName: '[path][name]_[local]_[hash:base64:5]'
                        }
                        },
                        {
                            loader: 'less-loader'
                        },
                        {
                            loader: 'sass-loader'
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                ident: 'postcss',
                                plugins: [
                                    // 合并雪碧图
                                    require('postcss-sprites')({
                                        // 指定雪碧图输出路径
                                        spritePath: 'dist/assets/imgs/sprites',
                                        retina: true // 处理苹果高清retina 图片命名需要 xx@2x.png,对应的图片的css大小设置也要减小一半 
                                    })
                                ]
                            }
                        }
                    ]
                })
            },
            {
                test: /\.(png|jpg|gif)$/,
                use:[
                    //{
                    //    loader: //'file-loader',//处理图片
                    //    options: {
                    //       publicPath:'',// 使得图片地址可以访问
                    //       outputPath: 'dist/'
                    //       useRelativePath:true
                        //}
                    
                    //}
                    // url-loader会把图片转成base64
                    {
                        loader: 'url-loader',
                        options: {
                            name: '[name].min.[ext]' //5kb内会转成base64 ,否则输出图片路径
                            limit: 1000, 
                            publicPath:'',
                            outputPath: 'dist/',
                            useRelativePath:true
                        }
                    },
                    // 压缩图片
                    {
                        loader: 'img-loader',
                        options: {
                            pngquant: {
                                //图片质量
                                quality:80
                            }
                        }
                    },
                    
                ]
            }
        ]
    }
}
```

这份配置里有几个点单独说一下。

`url-loader` 的 `limit` 是 base64 的分界线，小于这个值转成 base64 内联到 CSS 里，省一次 HTTP 请求；大于就交给 `file-loader` 输出成文件。配置里写的是 1000 字节，注释里写的却是 5kb，这是原文的笔误，以代码为准。阈值定多少要看场景，HTTP/2 多路复用之后请求数的代价没那么大了，我一般设在 4 到 8 KB 之间，图标类的小图内联，其余的走文件。

`postcss-sprites` 会扫描 CSS 里的 `background-image`，把符合条件的小图合成一张雪碧图并自动改写 `background-position`。`retina: true` 会识别 `@2x` 命名的高清图，单独合成一张，CSS 里的尺寸要写成实际像素的一半。雪碧图在 HTTP/1.1 时代是刚需，现在收益小了很多，图标类需求更推荐直接用 SVG symbol 或者字体图标。

`img-loader` 调的是 `pngquant`、`mozjpeg` 这些原生压缩工具，`quality: 80` 是有损压缩的质量档位。这一步比较慢，只在生产构建里开，开发环境跳过。它现在也有更活跃的替代品 `image-webpack-loader` 和 `imagemin` 系列。

最后一句时效性说明。webpack 5 内置了 Asset Modules 之后，`file-loader`、`url-loader`、`raw-loader` 这三个都不用装了，图片这条 rule 简化成这样：

```javascript
{
  test: /\.(png|jpg|gif)$/,
  type: 'asset',
  parser: {
    dataUrlCondition: { maxSize: 8 * 1024 }
  },
  generator: {
    filename: 'assets/imgs/[name].[hash:8][ext]'
  }
}
```

`type: 'asset'` 就是按体积自动在内联和输出之间二选一，等价于配了 `limit` 的 `url-loader`。压缩仍然需要额外的 loader 或插件，Asset Modules 不管这一层。


#### 4.1.3 处理字体文件

- `file-loader`
- `url-loader`



```js
module.exports = {
    module: {
         rules: [
            {
                test: /\.(css|less)$/,
                use:
                extractLess.extract({
                    // 提取css并不会自动加入到文档中，需要在HTML手动加入css文件
                    fallback: {
                        loader: 'style-loader',
                        options: { 
                           //合并多个style为一个
                            singleton:true
                        }
                    },
                    // 处理css
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                               minimize:true,
                               modules: true,
                               // css模块化
                               localIdentName: '[path][name]_[local]_[hash:base64:5]'
                        }
                        },
                        {
                            loader: 'less-loader'
                        },
                        {
                            loader: 'sass-loader'
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                ident: 'postcss',
                                plugins: [
                                    // 合并雪碧图
                                    require('postcss-sprites')({
                                        // 指定雪碧图输出路径
                                        spritePath: 'dist/assets/imgs/sprites',
                                        retina: true // 处理苹果高清retina 图片命名需要 xx@2x.png,对应的图片的css大小设置也要减小一半 
                                    })
                                ]
                            }
                        }
                    ]
                })
            },
            {
                test: /\.(png|jpg|gif)$/,
                use:[
                    //{
                    //    loader: //'file-loader',//处理图片
                    //    options: {
                    //       publicPath:'',// 使得图片地址可以访问
                    //       outputPath: 'dist/'
                    //       useRelativePath:true
                        //}
                    
                    //}
                    // url-loader会把图片转成base64
                    {
                        loader: 'url-loader',
                        options: {
                            name: '[name].min.[ext]' //5kb内会转成base64 ,否则输出图片路径
                            limit: 1000, 
                            publicPath:'',
                            outputPath: 'dist/',
                            useRelativePath:true
                        }
                    },
                    // 压缩图片
                    {
                        loader: 'img-loader',
                        options: {
                            pngquant: {
                                //图片质量
                                quality:80
                            }
                        }
                    },
                    // 处理字体文件
                    {
                        test: /\.(eot|woff2|woff|ttf|svg)$/,
                        use: [
                            {
                                loader:'url-loader',
                                options: {
                                    name: '[name].min.[ext]' //5kb内会转成base64 ,否则输出图片路径
                                    limit: 5000, 
                                    publicPath:'',
                                    outputPath: 'dist/',
                                    useRelativePath:true
                                }
                            }
                        ]
                    }
                    
                ]
            }
        ]
    }
}
```

字体和图片走的是同一套 loader，区别在阈值怎么定。字体文件通常几十到几百 KB，转 base64 会让 CSS 膨胀得很厉害，而且 base64 之后没法被单独缓存，所以 `limit` 要设得比图片大一些，或者干脆不转，直接用 `file-loader` 输出。

`eot`、`woff`、`woff2`、`ttf`、`svg` 这一串后缀是为了兼容老浏览器留的。现在只需要 `woff2` 就能覆盖绝大多数环境，`woff` 作为兜底，`eot` 是 IE 专用，`ttf` 体积大，能砍就砍，字体文件本身的体积降下来比什么优化都实在。

webpack 5 里字体这条 rule 可以直接写成 `type: 'asset/resource'`，不用装 loader。



#### 4.1.4 处理第三方 JS 库

> 处理第三方库 用到`providePlugin`、`imports-loader`

老项目里总有几个不走模块化的库，jQuery 是最典型的，代码里到处直接用 `$` 而没有 `import`。打包之后这些 `$` 会变成 undefined，因为模块作用域里根本没有这个变量。

有两条路能解决，`ProvidePlugin` 做全局注入，`imports-loader` 做按文件注入。


**1.providePlugin**

以引入`jQuery`为例

```
npm i jquery
```

```js
module.exports = {
    plugins: [
        new webpack.ProvidePlugin({
            // 在全局注入jQuery变量
            $:'jquery'
        })
    ]
}
```

`ProvidePlugin` 的做法是在编译期做静态替换。任何模块里出现了没有定义过的 `$`，webpack 会自动在这个模块顶部加上 `var $ = require('jquery')`。所以它不是真的往 `window` 上挂变量，模块之间仍然是隔离的，这一点和直接引 CDN 脚本有本质区别。

想注入多个别名就多写几个键，`jQuery: 'jquery'`、`_: 'lodash'` 都是常见写法。


引入本地`libs`中的`jQuery`

```js
module.exports = {
    resolve: {
        alias: {
            // $确切匹配 把jQuery这个关键字解析到某个目录下
            jquery$:path.resolve(__dirname,'src/libs/jquery.min.js')
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            // 在全局注入jQuery变量
            $:'jquery'
        })
    ]
}
```

`resolve.alias` 里的 `$` 后缀表示精确匹配。写 `jquery$` 只有 `require('jquery')` 会被重定向，`require('jquery/dist/xxx')` 不受影响；不加 `$` 则是前缀匹配，容易误伤。用本地文件替代 npm 包的场景下这个后缀一定要加。


**2.imports-loader**


`imports-loader` 是另一条路，它在指定文件的开头插入一段 import 语句，等于替你手写了那行 `import $ from 'jquery'`。

```js
module.exports = {
    module:{
        rules:[
            {
                test:path.resolve(__dirname,'src/app.js'),
                use:[
                    {
                        loader: 'imports-loader',
                        options: {
                            $: 'jquery'
                        }
                    }
                ]
            }
        ]
    }
}
```

`ProvidePlugin` 和 `imports-loader` 的差别在作用范围。前者是全局的，凡是用到 `$` 的模块都会被自动补上 import；后者是按文件粒度的，只给 `test` 匹配到的文件注入。老项目里有一段祖传脚本依赖全局 `$`，但你又不想把 `$` 变成真全局变量，用 `imports-loader` 更合适。

这两个 API 现在都还在，但用到的机会越来越少。原因是现在的库基本都是标准 ES module，直接 `import` 就行，不需要垫这一层。真正还会用到 `ProvidePlugin` 的场景是 webpack 5 之后的 Node polyfill 问题，webpack 4 会自动给 `process`、`Buffer`、`crypto` 这些 Node 内置模块注入浏览器实现，webpack 5 把这个行为去掉了，升级之后会报 `Can't resolve 'crypto'`。解决办法就是手动装 polyfill 包，再用 `ProvidePlugin` 注入：

```javascript
new webpack.ProvidePlugin({
  process: 'process/browser',
  Buffer: ['buffer', 'Buffer']
})
```

这个改动是 webpack 5 升级时最常见的报错来源之一，遇到 `Can't resolve 'xxx'` 而 xxx 是个 Node 内置模块名，基本就是它。



### 4.2 HTML in webpack(自动生成HTML)

> 自动生成`HTML`，把这个页面需要的`js`、`css`插入到页面中


产物文件名带 hash 之后，HTML 里的脚本路径每次构建都在变，手工维护是不可能的。`html-webpack-plugin` 干的就是这件事，构建结束后把本次产出的 JS 和 CSS 按规则插进 HTML 模板，再输出到 `dist`。

这个插件到现在还是标配，webpack 5 上照样用，只是版本要升到 5.x。


#### 4.2.1 生成 HTML


> `htmlWebpackPlugin`

options

- `template`
- `filename`
- `minify` 是否压缩
- `chunks` 
- `inject` 是否让`css、js`通过标签形式插入到页面中

`template` 传的是你自己写的 HTML 模板，插件在它的基础上注入脚本，而不是从零生成。不传的话会用插件内置的一个极简模板，通常只在写 demo 时够用。



```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js'
    },
    plugins: [
        new htmlWebpackPlugin({
            filename:'index.html', // 不传默认index.html
            template: './index.html',//传入模板
            inject:true,//控制js\css是否插入到页面
            minify: {
                collapseWhitespace:true //压缩空格
            },
            chunks:['app']//指定chunks会把跟这个入口相关的chunks插入到页面中
        })
    ]
}
```

这几个选项里 `chunks` 最容易出问题。不写的话，页面会把所有 entry 产出的脚本都插进去，多页面项目里 A 页面会加载 B 页面的代码。写了之后要注意顺序，`chunks` 数组的顺序就是标签的插入顺序，公共 chunk 得排在业务 chunk 前面，不然运行时会找不到模块。

`minify` 在开发环境建议关掉，压缩后的 HTML 在浏览器里看是一整行，调试很难受。生产环境除了 `collapseWhitespace`，还可以加 `removeComments` 和 `removeAttributeQuotes`。

多页面就是 new 多个实例，一个页面一个：

```javascript
plugins: [
  new HtmlWebpackPlugin({ filename: 'a.html', template: './src/a.html', chunks: ['vendor', 'a'] }),
  new HtmlWebpackPlugin({ filename: 'b.html', template: './src/b.html', chunks: ['vendor', 'b'] })
]
```



#### 4.2.2 HTML 中引入图片

> 需要用到`html-loader`

**html-loader**

options

- `attrs: [img:src]`

`HtmlWebpackPlugin` 只处理脚本和样式的注入，模板里 `<img src="./imgs/a.png">` 这种引用它是不管的，原样输出，结果就是路径没经过 webpack 处理，上线之后 404。要让 webpack 接管 HTML 里的资源引用，得再挂一个 `html-loader`。


```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
        publicPath:'/' //网站路径为/ 图片等资源引用不会发生错误
    },
    module:{
        rules:[
            {
                loader: 'url-loader',
                options: {
                    name: '[name].min.[ext]' //5kb内会转成base64 ,否则输出图片路径
                    limit: 1000, 
                    publicPath:'',
                    outputPath: 'assets/imgs/',
                    //useRelativePath:true // 这里不能使用这个 因为图片路径在HTML中、css中都存在，打包的时候图片会放错地方。需要用到绝对路径，在output指定publicPath:'/'
                }
            },
            // 处理HTML中的图片引用路径问题
            {
                test: /\.html$/,
                use: [
                    {
                        loader: 'html-loader',
                        options: {
                            attrs: ['img:src','img:data-src']
                        }
                    }
                ]
            }
        ]
    }
}
```

`html-loader` 的 `attrs` 指定要处理哪些标签的哪些属性，默认只有 `img:src`。懒加载常用的 `img:data-src` 得自己加进去，不然那些路径不会被 webpack 接管，打包后就是 404。

这里有个坑，图片路径在 CSS 和 HTML 里都可能出现，用 `useRelativePath: true` 会让两边算出不同的相对路径，总有一边是错的。解决办法就是配置里注释写的那样，`output.publicPath` 设成 `/`，全部走绝对路径。

`html-loader` 从 1.0 开始配置项改名了，`attrs` 变成了 `sources.list`，写法完全不同。webpack 5 里更常见的做法是配合 Asset Modules，HTML 里的资源引用由 `sources` 选项自动识别，不用一条条列。


**require在HTML中引入图片**

```html
<img src="${require('./public/imgs/xx.png)}" />
```

这段是模板里用 `require` 引图片。`html-webpack-plugin` 默认用 ejs 编译模板，模板里的 `${}` 会被求值，`require` 出来的是经过 `url-loader` 处理后的最终路径。原文这行少了一个引号，我补上了。



#### 4.2.3 配合优化

> 提前载入webpack加载代码

- `inline-manifest-webpack-plugin`
- `html-webpack-inline-chunk-plugin`

这两个插件干的是同一件事，把 webpack 的运行时代码内联到 HTML 里。`inline-manifest-webpack-plugin` 对 `html-webpack-plugin` 的版本要求比较死，配错版本会静默失效，所以这里推荐后者。


建议使用 `html-webpack-inline-chunk-plugin`

```
npm i html-webpack-inline-chunk-plugin
```

```js
var HTMLInlineChunk = require('html-webpack-inline-chunk-plugin')

module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
        publicPath:'/'
    },
    plugins: [
        new htmlWebpackPlugin({
            filename:'index.html', // 不传默认index.html
            template: './index.html',//传入模板
            inject:true,//控制js\css是否插入到页面
            minify: {
                collapseWhitespace:true //压缩空格
            },
            chunks:['app']//指定chunks会把跟这个入口相关的chunks插入到页面中
        })
        new webpack.optimize.CommonsChunkPlugin({
            name: 'manifest'
        })
        new HTMLInlineChunk({
            inlineChunks: ['manifest'] //把webpack生成的manifest提取到HTML文件script中，减少请求
        })
    ]
}
```

这一步优化的是首屏请求数。webpack 生成的 manifest 里存的是模块 id 到 chunk 文件的映射表，通常只有一两 KB，但它是个独立文件，浏览器要多发一次请求才能开始跑主逻辑。把这么小的东西内联进 HTML 的 `<script>` 标签里，省掉的那次往返在弱网下能差出上百毫秒。

同样的思路也用在关键 CSS 上，首屏样式内联进 HTML，其余样式异步加载。代价是 HTML 本身不能被长期缓存了，manifest 变了 HTML 就得重新下，所以只适合内联体积很小的内容。

webpack 4 之后 `CommonsChunkPlugin` 换成了 `optimization.runtimeChunk: 'single'`，内联插件也换成了 `react-dev-utils` 里的 `InlineChunkHtmlPlugin` 或者 `html-webpack-inline-source-plugin` 这类还在维护的包。思路没变，包名换了。



## 五、Webpack 环境配置

前面讲的都是「怎么把代码打出来」，这一节讲「开发的时候怎么用得舒服」。改一行代码就手敲一次 `webpack` 显然不现实，所以有了 watch 模式；产物落磁盘还要自己起静态服务，所以有了 `webpack-dev-server`；接口跨域、页面刷新丢状态、报错定位不到源码，分别对应 proxy、HMR 和 SourceMap。

最后还要把开发和生产两套配置分开，这是绕不过去的一步，配置写到几百行之后你会庆幸早点拆了。

### 5.1 Webpack Watch Mode

```js
webpack --watch

// 简写
webpack -w
```

watch 模式的原理是给依赖图里的每个文件注册文件系统监听，任何一个文件的修改时间变了就触发一次增量编译。它只重新编译受影响的那部分模块，所以第二次之后会明显比首次快。

单纯的 watch 只解决「自动重新编译」，浏览器还是要你自己刷新。下面这份配置是配合 watch 用的完整例子。


```js
//webpack.config.js

var webpack = require('webpack')
var PurifyWebpack = require('purifycss-webpack')
var ExtractTextWebpackPlugin = require('extract-text-webpack-plugin')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var CleanWebpack = require('clean-webpack-plugin')

var path = require('path')
var glob = require('glob-all')//处理多个路径

var extractLess = new ExtractTextWebpackPlugin({
    filename: 'css/[name]-bundle-[hash:5].css'
})

module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name]-bundle-[hash:5].js'
    },
    module:{
        rules: [
            {
                test: /\.(css|less)$/,
                use:
                extractLess.extract({
                    // 提取css并不会自动加入到文档中，需要在HTML手动加入css文件
                    fallback: {
                        loader: 'style-loader',
                        options: { 
                           //合并多个style为一个
                            singleton:true
                        }
                    },
                    // 处理css
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                               minimize:true,
                               modules: true,
                               // css模块化
                               localIdentName: '[path][name]_[local]_[hash:base64:5]'
                        }
                        },
                        {
                            loader: 'less-loader'
                        },
                        {
                            loader: 'sass-loader'
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                ident: 'postcss',
                                plugins: [
                                    // 合并雪碧图
                                    require('postcss-sprites')({
                                        // 指定雪碧图输出路径
                                        spritePath: 'dist/assets/imgs/sprites',
                                        retina: true // 处理苹果高清retina 图片命名需要 xx@2x.png,对应的图片的css大小设置也要减小一半 
                                    })
                                ]
                            }
                        }
                    ]
                })
            }
        ]
    }
    plugin: [
        new CleanWebpack()
    ]
}
```


这份配置本身没什么新东西，就是把前面几节的 loader 和插件拼在一起，重点是 `CleanWebpackPlugin`。开了 watch 或者反复构建之后，`dist` 目录里会堆一堆带旧 hash 的文件，`[hash:5]` 每次构建都在变，不清理的话几十次之后目录里全是垃圾，还容易误上传到线上。

`clean-webpack-plugin` 从 2.x 开始构造参数从数组改成了对象，写成 `new CleanWebpackPlugin()` 不带参数即可，它会自动清理 `output.path`。webpack 5 更省事，配置里写 `output: { clean: true }`，插件都不用装。

watch 模式还有两个选项偶尔用得上。`watchOptions.aggregateTimeout` 是防抖时间，改动之后等多少毫秒才开始编译，默认 300 毫秒，用编辑器的格式化保存会连续触发多次写盘时可以调大。`watchOptions.poll` 是轮询间隔，在 Docker 容器或者某些网络文件系统上，文件变化事件传不出来，只能靠轮询兜底，表现是「改了代码没反应」，这个我在容器里开发时踩过。


### 5.2 Webpack Dev Server

`webpack --watch` 解决的是「不用手动敲命令」，但产物还是落到磁盘，你得再起一个静态服务器去访问它，改完还得手动刷新浏览器。`webpack-dev-server` 把这几件事合并了：起一个 express 服务，把编译产物放在内存里直接响应请求，编译完自动通知浏览器刷新。

产物在内存里这一点值得强调。开着 dev server 的时候你去看 `dist` 目录，很可能是空的或者是上一次 `build` 留下的旧文件，这不是 bug。内存读写比磁盘快得多，热更新才能做到秒级响应。

#### 5.2.1 Dev Server

> 不能用来直接打包文件，`Dev Server`搭建本地开发，文件存在内存中

**特性**

- `live reloading`
- 路径重定向
- 支持`HTTPS`
- 浏览器中显示编译错误
- 接口代理
- 模块热更新


**dev server**

- `inline`
- `contentBase`
- `port`
- `historyApiFallback`
- `https`
- `proxy`
- `hot`
- `openpage`
- `lazy`
- `overlay` 开启错误遮罩


这堆选项里，日常真正会动的其实就四五个。`port` 定端口，端口被占了会启动失败，dev-server 4.x 之后可以写 `port: 'auto'` 让它自己找。`contentBase`（新版叫 `static`）指定除了打包产物之外还要托管哪个目录的静态文件，比如 `public` 下的图标和 mock 数据。`historyApiFallback` 处理单页应用刷新 404，下面细说。`hot` 开热更新，`proxy` 配接口代理，这两个各占一节。`overlay` 把编译错误直接盖在页面上，不用切回终端看日志。

`lazy` 是个冷门但偶尔救命的选项，开了之后只有收到请求才编译，适合超大项目里只想看某一个页面的场景，代价是没有 watch 也没有 HMR。它在 dev-server 4.x 里被移除了。

**使用**

```
"script"{
    // 启动
    "server": "webpack-dev-server --open" 
}
```


下面这份配置演示的是 dev server 最常用的两项，端口和路由回退。

```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        filename: '[name].[hash:5].js'
    },
    
    devServer: {
        port: 9001,
        // 输入任意路径都不会出现404 都会重定向
       // historyApiFallback: true
        historyApiFallback: {
            //从一个确定的url指向对应的文件
            //rewrites: [
            //    {
            //        from: '/pages/a',// 可以写正则
           //         to: '/pages/a.html'
            //    }
            rewrites: [
                {
                    from: /^\/([a-zA-Z0-9]+\/?)([a-zA-Z0-9]+)/
                    to: function(context){
                        return '/' + context.match[1] + context.match[2] + '.html'
                    }
                }
            ]
            ]
        }
    }
}
```

`historyApiFallback` 是给单页应用用的。React Router 或 Vue Router 用 history 模式时，地址栏是 `/user/detail` 这样的真实路径，直接回车或者刷新，请求会打到 dev server 上找 `/user/detail` 这个文件，当然是 404。开了这个选项之后，所有找不到文件的请求都会返回 `index.html`，交给前端路由自己处理。

`rewrites` 是它的进阶用法，多页面项目里可以按规则把 URL 映射到不同的 HTML。上面那段正则做的事是把 `/pages/a` 这样的路径转成 `/pages/a.html`。单页应用用不上，写 `historyApiFallback: true` 就够了。

有个坑要注意，`output.publicPath` 必须设成 `/`，不然 fallback 回来的 `index.html` 里引的脚本路径会是相对路径，二级路由下就找不到文件了。这个错误的表现是首页正常、刷新子路由白屏，很典型。



#### 5.2.2 proxy代理远程接口

- 代理远程接口请求
- `http-proxy-middleware`
- `devServer.proxy`

开发时前端跑在 `localhost:9001`，接口在另一个域名上，浏览器的同源策略会把请求拦下来。让后端加 CORS 头是一种办法，但每换一个联调环境都要找人改配置，很麻烦。dev server 的 proxy 是另一种办法，浏览器请求的是同源的 `localhost:9001/api/xxx`，dev server 收到之后在 Node 层转发给真实后端，服务端之间的请求不受同源策略约束，问题就绕过去了。

底层用的就是 `http-proxy-middleware`，`devServer.proxy` 里的配置项和它是一一对应的，查文档可以直接看那个包。


```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        filename: '[name].[hash:5].js'
    },
    
    devServer: {
        port: 9001,
        // 输入任意路径都不会出现404 都会重定向
       // historyApiFallback: true
        historyApiFallback: {
            //从一个确定的url指向对应的文件
            //rewrites: [
            //    {
            //        from: '/pages/a',// 可以写正则
           //         to: '/pages/a.html'
            //    }
            rewrites: [
                {
                    from: /^\/([a-zA-Z0-9]+\/?)([a-zA-Z0-9]+)/
                    to: function(context){
                        return '/' + context.match[1] + context.match[2] + '.html'
                    }
                }
            ]
            ]
        },
        proxy: {
            '/api': {
                target: 'https://blog.poetries.top',//代理到服务器
                changeOrigin:true,
                logLevel: 'debug',
                // pathRewrite: { },
                headers:{}// 请求头
            }
        }
    }
}
```

`changeOrigin: true` 是最容易漏的一项。不开它，转发出去的请求 Host 头还是 `localhost:9001`，后端如果按域名做了路由或者鉴权就会直接 403。开了之后 Host 会被改写成目标服务器的域名。

`pathRewrite` 用来去掉前缀。前端统一走 `/api/xxx` 方便匹配，但后端真实路径可能是 `/xxx`，写成 `pathRewrite: { '^/api': '' }` 就能在转发时把前缀抹掉。`logLevel: 'debug'` 会把每条转发的原始地址和目标地址打到终端，代理不生效的时候先开它看看请求到底去哪了。

proxy 只在开发期有效，上线之后这层是 Nginx 或者网关在做，前端代码里不该出现任何和代理相关的判断。这一点我见过不少项目搞混，本地跑得好好的，一上线接口全 404。

`webpack-dev-server` 4.x 之后 `proxy` 推荐写成数组形式，`{ context: ['/api'], target: '...' }`，对象形式仍然兼容但不再是文档里的主推写法。


#### 5.2.3 模块热更新

- 保持应用的数据状态
- 节省调试时间
- 不需要刷新

- `devServer.hot`
- `webpack.HotModuleReplacementPlugin`
- `webpack.NamedModulesPlugin` 看到模块更新的路径

HMR 和 live reload 是两回事，这个区别很多人一开始分不清。live reload 是「文件变了就刷新整个页面」，简单粗暴，代价是页面上的所有状态归零，表单填了一半、弹窗开着、路由跳到第三层，全没了。HMR 是「只把变化的模块换掉」，页面不刷新，状态还在。

它的运行链路是这样的：webpack 监听到文件变化后重新编译出变化的那部分，通过 WebSocket 把更新消息推给浏览器里的 HMR runtime，runtime 拿到新模块代码，再去找有没有人声明了「我能处理这个模块的更新」，也就是下面要说的 `module.hot.accept`。找得到就局部替换，找不到就退回整页刷新。

配置上要两件东西一起上，`devServer.hot: true` 负责起通信，`HotModuleReplacementPlugin` 负责往产物里注入 runtime。webpack 4 时代少写一个都不生效，webpack 5 的 dev-server 里 `hot: true` 会自动帮你加上插件，不用重复写。



**Module Hot Reloading**

- `module.hot`
- `module.hot.accept`


```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        filename: '[name].[hash:5].js'
    },
    
    devServer: {
        port: 9001,
        // 输入任意路径都不会出现404 都会重定向
       // historyApiFallback: true
        historyApiFallback: {
            //从一个确定的url指向对应的文件
            //rewrites: [
            //    {
            //        from: '/pages/a',// 可以写正则
           //         to: '/pages/a.html'
            //    }
            rewrites: [
                {
                    from: /^\/([a-zA-Z0-9]+\/?)([a-zA-Z0-9]+)/
                    to: function(context){
                        return '/' + context.match[1] + context.match[2] + '.html'
                    }
                }
            ]
            ]
        },
        hot:true,//开启模块热更新
        hotOnly:true,
        proxy: {
            '/api': {
                target: 'https://blog.poetries.top',//代理到服务器
                changeOrigin:true,
                logLevel: 'debug',
                // pathRewrite: { },
                headers:{}// 请求头
            }
        }
    },
    plugins: [
        // 模块热更新插件
        new webpack.HotModuleReplacementPlugin(),
        
        // 输出热更新路径
        new webpack.NamedModulesPlugin()
    ]
}
```

`NamedModulesPlugin` 在这里的作用是让控制台打印出模块的路径而不是一串数字 id，HMR 触发时能看到「哪个文件更新了」。webpack 5 里它被 `optimization.moduleIds: 'named'` 取代，开发模式下默认就是这个值，不用再手动加。


**模块热更新配置**

> 需要通过module.hot

```js
if (module.hot) {
  module.hot.accept('./library.js', function() {
    // Do something with the updated library module...
  })
}
```

`module.hot.accept` 是 HMR 真正生效的关键。webpack 推给浏览器的只是「某个模块变了」这条消息加上新模块的代码，怎么用这份新代码是你自己的事。如果没有任何模块声明 `accept`，这条消息会一路冒泡到入口，最后 webpack 只能整页刷新兜底。

日常开发里你很少手写这段，因为框架的 loader 已经替你写好了。React 那边现在是 `react-refresh-webpack-plugin`（Fast Refresh），Vue 有 `vue-loader` 内置的 HMR，它们在组件层面自动注册 `accept`，还能保住组件的 state。真正需要手写的场景是 Redux store、i18n 资源、纯 JS 工具模块这类没有框架托管的东西。

webpack 5 的 dev-server 4.x 里，`hotOnly: true` 改成了 `hot: 'only'`，含义不变，都是「热更新失败时不要整页刷新」。调试 HMR 逻辑本身的时候这个开关很有用，不然页面一刷新，出错的现场就没了。




#### 5.2.4 开启调试SourceMap

**Source Map调试**

把生成以后代码和之前的做一个映射


打包之后的代码经过转译、合并、压缩，浏览器里看到的是一坨认不出来的东西，断点打不下去，报错堆栈也指不到源文件。Source Map 就是那份映射表，它记录了产物里第几行第几列对应源码的哪个文件哪一行，浏览器读到它之后就能在 Sources 面板里还原出原始代码。

代价是生成映射表要花时间，所以 `devtool` 才有那么多档位，本质是在「构建速度」和「还原精度」之间取不同的平衡点。

> 开启Source Map方式

**`JS Source Map`设置**

develpoment

- `eval`
- `eval-source-map`
- `cheap-eval-source-map`
- `cheap-module-eval-source-map`

> 推荐使用`cheap-module-source-map`

production

- `source-map`
- `hidden-source-map`
- `nosource-source-map`

> 推荐使用`source-map`

先说这些名字怎么记，后面配置那一段会用到。


**`CSS Source Map`设置**

> 改变`loader`的`options`选项

- `css-loader.options.soucemap`
- `less-loader.options.soucemap`
- `sass-loader.options.soucemap`


CSS 的 source map 是分段接力的。`less-loader` 把 less 到 css 的映射交给 `css-loader`，`css-loader` 再往下传给 `style-loader`，链条上任何一环没开 `sourceMap: true`，映射就断在那里，浏览器里看到的行号就是编译后的行号。所以这几个 loader 得一起开，不能只开一个。


```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        filename: '[name].[hash:5].js'
    },
    module: {
        // 处理css的每个loader加上sourceMap: true 观察css样式 可以看到对应的行号
        rules: [
            test: /\.less/,
            use: [
                {
                    loader: 'style-loader',
                    options: {
                        // singleton: true,会导致css的sourceMap不生效
                        //singleton: true,
                        sourceMap: true
                    }
                },
                {
                    loader: 'css-loader',
                    options: {
                        importLoaders: 2,
                        sourceMap: true
                    }
                },
                {
                    loader: 'less-loader',
                    options: {
                        sourceMap: true
                    }
                }
            ]
        ]
    },
    devtool: 'cheap-module-eval-source-map',//开启sourcemap
    devServer: {
        port: 9001,
        // 输入任意路径都不会出现404 都会重定向
       // historyApiFallback: true
        historyApiFallback: {
            //从一个确定的url指向对应的文件
            //rewrites: [
            //    {
            //        from: '/pages/a',// 可以写正则
           //         to: '/pages/a.html'
            //    }
            rewrites: [
                {
                    from: /^\/([a-zA-Z0-9]+\/?)([a-zA-Z0-9]+)/
                    to: function(context){
                        return '/' + context.match[1] + context.match[2] + '.html'
                    }
                }
            ]
            ]
        },
        hot:true,//开启模块热更新
        hotOnly:true,
        overlay:true,//错误提示
        proxy: {
            '/api': {
                target: 'https://blog.poetries.top',//代理到服务器
                changeOrigin:true,
                logLevel: 'debug',
                // pathRewrite: { },
                headers:{}// 请求头
            }
        }
    },
    plugins: [
        // 模块热更新插件
        new webpack.HotModuleReplacementPlugin(),
        
        // 输出热更新路径
        new webpack.NamedModulesPlugin()
    ]
}
```

CSS 的 source map 有个坑我提一句，`style-loader` 的 `singleton: true` 会把所有样式合并进一个 `<style>` 标签，映射关系就断了，source map 直接失效。上面那份配置里把它注释掉了，就是这个原因。

`devtool` 的取值看着有十几个，其实是几个关键词的排列组合，拆开就好记了。`eval` 表示用 `eval()` 包裹模块并在末尾追加 `sourceURL`，构建最快但只能定位到模块级；`cheap` 表示只映射到行不映射到列，并且忽略 loader 内部的 source map，快很多；`module` 表示把 loader 的 source map 也串上，这样看到的才是你写的那份源码而不是 babel 转译后的；`inline` 是把 map 内容以 base64 塞进产物，`hidden` 是生成 map 文件但不在产物里写引用注释。

按这个规则回头看推荐值就清楚了。开发用 `cheap-module-eval-source-map`，牺牲列信息换速度，但保留 loader 映射所以能看到原始源码。生产用 `source-map` 生成独立 map 文件，配合 `hidden-source-map` 传给错误监控平台，用户拿不到源码但你能还原堆栈。

webpack 5 把这些关键词的顺序规范化了，`cheap-module-eval-source-map` 要写成 `eval-cheap-module-source-map`，顺序固定为 `[inline-|hidden-|eval-][nosources-][cheap-[module-]]source-map`。老配置直接升级会报无效的 devtool 值，按新顺序重排一下即可。


#### 5.2.5 设置 ESLint 检查代码格式

- `eslint`
- `eslint-loader`
- `eslint-plugin-html`
- `eslint-friendly-formatter` 友好提示错误


构建期做代码检查的好处是「跑不起来就改」，规范能真正落地。坏处是每次构建都要多跑一遍 lint，项目大了会明显拖慢。所以这套东西建议只在开发环境开，生产构建里关掉。

**配置eslint**

- `wepback config` 新增`loader`
- `.eslintrc`或者在`package.json`的`eslintConfig`中写

> 配置eslint的规范，推荐使用JavaScript standard style(https://standardjs.com)

需要安装以下插件

- `eslint-config-standard`
- `eslint-plugin-promise`
- `eslint-plugin-standard`
- `eslint-plugin-import`
- `eslint-plugin-node`


这几个包不是随便列的，`eslint-config-standard` 只是一份规则集合，它引用到的规则来自 `eslint-plugin-promise`、`eslint-plugin-import`、`eslint-plugin-node` 这些插件，少装一个启动就报 `Cannot find module`。ESLint 8 之前这套 peerDependencies 要手动装齐，是很常见的报错来源。


**eslint-loader**

- `options.failOnWarning` 出现警告
- `options.failOnError`
- `options.formatter`
- `options.outputReport`

> 设置 `devServer.overlay`在浏览器中看提示的错误


配 `.eslintrc` 的时候有个心理准备，规则冲突是常态。standard 默认不加分号，如果团队习惯加分号，就要在 `rules` 里逐条覆盖，或者干脆换一套 `extends`。规则谈不拢的时候，与其争论不如把 Prettier 拉进来管格式、ESLint 只管代码质量，这是现在比较主流的分工。

```js
// .eslintrc.js

module.exports = {
    root: true,
    extends: 'standard',
    plugins: [],
    env: {
        browser: true,
        node: true // node环境
    },
    rules: {
        // 缩进
        indent: ['error', 4],
        
        //换行
        "eol-last": ['error', 'never']
    }
}
```

这份配置文件叫 `.eslintrc.js`，写成 `module.exports` 的形式，好处是可以写注释、可以引 Node 的模块。`root: true` 让 ESLint 停止往上层目录找配置，不加这一条，你的 monorepo 或者用户目录下的配置可能会意外生效。`extends: 'standard'` 继承 standard 那套规则，`rules` 里写的是你要覆盖的部分，缩进改成 4 空格、文件末尾不留空行。


```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        filename: '[name].[hash:5].js'
    },
    module: {
        // 处理css的每个loader加上sourceMap: true 观察css样式 可以看到对应的行号
        rules: [
            {
                test: /\.js$/,
                include: [path.resolve(__dirname,'src/')],
                exclude: [path.resolve(__dirname,'src/libs')],
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['env']
                        }
                    },
                    //eslint-loader需要在babel-loader之后处理
                    {
                        loader: 'eslint-loader',
                        options: {
                            formatter: require('eslint-friendly-formatter')
                        }
                    }
                ]
            },
            {
                test: /\.less/,
                use: [
                    {
                        loader: 'style-loader',
                        options: {
                            // singleton: true,会导致css的sourceMap不生效
                            //singleton: true,
                            sourceMap: true
                        }
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 2,
                            sourceMap: true
                        }
                    },
                    {
                        loader: 'less-loader',
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            }
        ]
    },
    devtool: 'cheap-module-eval-source-map',//开启sourcemap
    devServer: {
        port: 9001,
        // 输入任意路径都不会出现404 都会重定向
       // historyApiFallback: true
        historyApiFallback: {
            //从一个确定的url指向对应的文件
            //rewrites: [
            //    {
            //        from: '/pages/a',// 可以写正则
           //         to: '/pages/a.html'
            //    }
            rewrites: [
                {
                    from: /^\/([a-zA-Z0-9]+\/?)([a-zA-Z0-9]+)/
                    to: function(context){
                        return '/' + context.match[1] + context.match[2] + '.html'
                    }
                }
            ]
            ]
        },
        hot:true,//开启模块热更新
        hotOnly:true,
        overlay:true,//错误提示
        proxy: {
            '/api': {
                target: 'http://blog.poetries.top',//代理到服务器
                changeOrigin:true,
                logLevel: 'debug',
                // pathRewrite: { },
                headers:{}// 请求头
            }
        }
    },
    plugins: [
        // 模块热更新插件
        new webpack.HotModuleReplacementPlugin(),
        
        // 输出热更新路径
        new webpack.NamedModulesPlugin()
    ]
}
```

这份配置里 loader 的顺序值得单独说。`use` 数组里 `babel-loader` 在前、`eslint-loader` 在后，而 webpack 的 loader 是从后往前执行的，所以实际是 `eslint-loader` 先跑、检查原始源码，检查完再交给 `babel-loader` 转译。顺序写反的话，eslint 检查的就是 babel 转译后的产物，行号对不上，规则也会大量误报。

`include` 限定在 `src` 目录、`exclude` 排掉 `src/libs`，一是提速，二是避免第三方脚本触发一堆你根本不打算改的告警。

现在这块的做法变了。`eslint-loader` 已经废弃，官方接班的是 `eslint-webpack-plugin`，它作为插件在编译过程中并行跑 lint，不占用 loader 链路，构建更快：

```javascript
const ESLintPlugin = require('eslint-webpack-plugin')

module.exports = {
  plugins: [
    new ESLintPlugin({ extensions: ['js', 'jsx'] })
  ]
}
```

再往后一步，很多项目已经改用 `eslint --cache` 配 `lint-staged` 在提交前跑，构建过程里干脆不做 lint。这样构建更快，反馈也更早，我自己现在的项目就是这么配的。ESLint 9 之后配置格式换成了扁平的 `eslint.config.js`，`.eslintrc` 那套写法要迁移，具体规则以你用的 ESLint 版本文档为准。


#### 5.2.6 区分开发环境 和 生产环境

开发和生产要的东西几乎是相反的。开发要快、要能调试、要出错能看见；生产要小、要能缓存、要没有多余代码。把两套需求塞进一份配置，最后一定会写成满屏的 `if`。

**开发环境**

- 模块热更新
- `sourceMap`
- 接口代理
- 代码规范检查

**生产环境**

- 提取公共代码
- 压缩
- 文件压缩或`base64`编码
- 去除无用的代码

**共同点**

- 入口一致
- loader处理
- 解析配置一致

> 使用`webpack-merge`合并公共配置

- `webpack.dev.conf.js`
- `wepback.prod.conf.js`
- `webpack.common.conf.js`

拆三份文件是最常见的组织方式。`webpack.common.conf.js` 放 entry、output、resolve 和所有环境都要的 loader；`webpack.dev.conf.js` 放 devServer、devtool 和 HMR 插件；`webpack.prod.conf.js` 放压缩、提取、清理这些。`webpack-merge` 负责把公共配置和环境配置合成一份。

不用 `webpack-merge`、直接用 `Object.assign` 会出问题，因为配置里大量是数组和嵌套对象，浅合并会把 `module.rules` 整个覆盖掉。


```json
"scripts":{
    "server": "webpack-dev-server --env development --open --config build/webpack.common.config.js",
    "build": "webpack --env production --open --config build/webpack.common.config.js"
}
```

`--env` 这个参数会作为实参传给配置文件导出的那个函数。webpack 4 之后 `--env` 的解析规则改了，`--env production` 传进来的是 `{ production: true }` 这样一个对象而不是字符串，写成 `env === 'production'` 会永远为 false。升级的时候这个坑很多人踩，判断改成 `env.production` 就好。


> 公共配置 `build/webpack.common.conf.js`

```js
const merge = require('webpack-merge')
const webpack = require('webpack')
const path = require('path')

const chalk = require('chalk')
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')

const developmentConfig = require('./webpack.dev.conf')
const productionConfig = require('./webpack.prod.conf')


// 根据环境变量生成配置
const generateConfig = env =>{
    const extractLess = new ExtractTextWebpackPlugin({
        filename: 'css/[name]-bundle-[hash:5].css'
    })
    const scriptLoader = [
      'babel-loader'
    ].concat(env === 'production'
      ? []
      : [{
          loader: 'eslint-loader',
          options: {
              formatter: require('eslint-friendly-formatter')
          }
      }]
    )
    const cssLoaders = [
      {
          loader: 'css-loader',
          options: {
              importLoaders: 2,
              sourceMap: env==='development'
          }
      },
      {
        loader: "postcss-loader",
        options: {
          ident: "postcss",
          sourceMap: env==='development',
          plugins: [

          ].concat(env==='production'
            ? require('postcss-sprites')({
              spritePath: 'build/assets/imgs/sprites',
              retina: true
            })
            :[]
          )
        }
      },
      {
          loader: 'less-loader',
          options: {
              sourceMap: env==='development'
          }
      }
    ]
    const styleLoader = env === 'production'
          // 线上需要提取css成文件
          ? extractLess.extract({
            fallback:'style-loader',
            use: cssLoaders
          })
          : ['style-loader'].concat(cssLoaders)

    const fileLoader = env === 'development'
        ? [{
            loader: 'file-loader',
            options: {
              name: '[name]-[hash:5].[ext]',
              outputPath: 'assets/imgs/'
            }
          }]
        : [{
          loader: 'url-loader',
          options: {
            name: '[name]-[hash:5].[ext]',
            limit: 1000,//1k
            outputPath: 'assets/imgs/'
          }
        }]

    return {
      entry: {
          app: './src/index.js'
      },
      output: {
          path: path.resolve(__dirname, '../build'),
          publicPath: '/',
          filename: '[name]-bundle-[hash:5].js'
      },
      // 路径解析
      resolve: {
          alias: {
              // jquery$: path.resolve(__dirname, '../src/libs/jquery.min.js')
          }
      },
      module: {
          rules: [
              {
                  test: /\.(js|jsx)$/,
                  include: [path.resolve(__dirname,'../src/')],
                  exclude : /node_modules/,
                  use: scriptLoader
              },
              {
                  test: /\.(less|css|scss)/,
                  use: styleLoader
              },
              {
                test: /\.(png|jpg|jpeg|gif)$/,
                use: fileLoader.concat(env==='production'
                  ? [
                    {
                      loader: 'img-loader',
                      options: {
                        pngquant: {
                          quality: 80
                        }
                      }
                    }
                  ]
                  : []
                )
              },
              {
                test: /\.(eot|woff2?|ttf|svg)$/,
                use: fileLoader
              }
          ]
      },
      plugins: [
        extractLess,

        new ProgressBarPlugin({
          format: '  build [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
          clear: false
        }),
        new HtmlWebpackPlugin({
    			inject: true,
    			template: path.resolve(__dirname,'../public/index.html'),
          minify: {
            collapseWhitespace: true
          }
    		}),
        new webpack.ProvidePlugin({
          $: 'jquery'
        })
      ]
    }
}


module.exports = env =>{
  const config = env==='development' ? developmentConfig : productionConfig
  return merge(generateConfig(env),config)
}
```

这份公共配置的关键在 `generateConfig` 这个函数。它接收环境变量，返回一份配置对象，把「哪些 loader 只在开发环境用」「哪些插件只在生产环境用」全部收在函数内部用三元表达式处理。这样一来，dev 和 prod 两份配置文件只需要写各自独有的那部分，公共部分永远只有一份，改 entry 不用改两个地方。

具体看几处：`scriptLoader` 在开发环境才追加 `eslint-loader`，生产构建不做 lint 是为了省时间；`cssLoaders` 里的 `sourceMap` 跟着环境走；`postcss-sprites` 只在生产环境合雪碧图，开发时合并雪碧图纯粹是浪费时间；图片在开发环境用 `file-loader` 直接输出文件（改图立刻能看到），生产环境才用 `url-loader` 做 base64 内联。

`webpack-merge` 做的是深合并，数组会拼接而不是覆盖，所以 dev 配置里的 `plugins` 会追加到公共配置的 `plugins` 后面，不会把它冲掉。这一点和 `Object.assign` 的行为差别很大，用错了会莫名其妙丢插件。



> 开发环境配置 `build/webpack.dev.conf.js`

```js
const webpack = require('webpack')
const path = require('path')

module.exports = {
    devtool: 'cheap-module-eval-source-map',//开启sourcemap
    devServer: {
        port: 9001,
        // 输入任意路径都不会出现404 都会重定向
        historyApiFallback: true,
        // historyApiFallback: {
            //从一个确定的url指向对应的文件
            //rewrites: [
            //    {
            //        from: '/pages/a',// 可以写正则
           //         to: '/pages/a.html'
            //    }
            // rewrites: [
            //     {
            //         from: /^\/([a-zA-Z0-9]+\/?)([a-zA-Z0-9]+)/
            //         to: function(context){
            //             return '/' + context.match[1] + context.match[2] + '.html'
            //         }
            //     }
            // ]
        // },
        hot:true,//开启模块热更新
        hotOnly:true,
        overlay:true,//错误提示
        proxy: {
            '/api': {
                // target: 'http://blog.poetries.top',//代理到服务器
                changeOrigin:true,
                logLevel: 'debug',
                // pathRewrite: { },
                headers:{}// 请求头
            }
        }
    },
    plugins: [
      // 模块热更新插件
       new webpack.HotModuleReplacementPlugin(),

       // 输出热更新路径
       new webpack.NamedModulesPlugin()
    ]
}


```

开发配置里除了上面这些，`devServer.host` 设成 `0.0.0.0` 才能让同一局域网的手机访问到，调移动端的时候会用上。`overlay: true` 把编译错误直接盖在页面上，比切回终端看日志顺手。

webpack 5 配套的 `webpack-dev-server` 4.x 改了几个字段名，`overlay` 挪到了 `client.overlay`，`hotOnly` 变成 `hot: 'only'`，`contentBase` 变成 `static`。老配置直接升级会报 unknown option，照着报错提示改就行。



> 生产环境配置 `build/webpack.prod.conf.js`

```js
const webpack = require('webpack')
const PurifyCssWebpack = require('purifycss-webpack')
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')

const path = require('path')
const glob = require('glob-all')//处理多个路径

module.exports = {
  plugins: [
    new PurifyCssWebpack({
      paths: glob.sync([
        './*html',
        './src/*js'
      ])
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest'
    }),
    new HtmlWebpackPlugin({
      inlineChunks: ['manifest']
    }),
    new webpack.optimize.UglifyJsPlugin(),
    new CleanWebpackPlugin(['../build'])
  ]
}
```

生产配置这份要说两句。`PurifyCssWebpack` 现在基本不用了，它的继任者是 `purgecss-webpack-plugin`，判断规则更准，对 CSS Modules 和动态类名的支持也好一些。`CommonsChunkPlugin` 在 webpack 4 已经被删掉，提取 runtime 改用 `optimization.runtimeChunk`。

webpack 4 之后还多了一个 `mode` 字段，这是最省事的一个改动。写上 `mode: 'production'`，webpack 会自动帮你打开 `optimization.minimize`、`usedExports`（Tree shaking 的标记阶段）、`sideEffects`、`concatenateModules`（Scope Hoisting），并把 `process.env.NODE_ENV` 设成 `production`。上面这堆手动 new 出来的插件，一大半可以直接删掉。

所以同样是「区分开发和生产」，在 webpack 4/5 上的写法会瘦很多：dev 配置只留 `mode: 'development'` 加 devServer 和 devtool，prod 配置只留 `mode: 'production'` 加真正需要定制的那几项。



### 5.3 使用 middleware 来搭建开发环境

> 可以更灵活配置,需要以下插件搭建

- `Express or koa`
- `webpack-dev-middleware`
- `webpack-hot-middleware` 热更新
- `http-proxy-middleware` 代理
- `connect-history-api-fallback` 地址rewrite
- `opn` 命令工具打开浏览器页面

先说清楚这几个包各管一段，不然看代码会一头雾水。`webpack-dev-middleware` 负责把 webpack 的编译产物挂到 express 的路由上，请求过来直接从内存里返回，不落磁盘。`webpack-hot-middleware` 负责在浏览器和服务端之间开一条 SSE 通道，编译完推消息触发热更新。`http-proxy-middleware` 转发接口请求，`connect-history-api-fallback` 处理单页应用刷新 404，`opn` 只是启动后帮你把浏览器打开。


```js
// build/server.js

/**
 * 使用middleware搭建服务:更灵活配置,不在使用webpack-dev-server
 * @type {[type]}
 */

const express = require('express')
const webpack = require('webpack')
const opn = require('opn')

const app = express()
const port = 3000

//把express和配置联合起来 需要用到middleware
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const proxyMiddleware = require('http-proxy-middleware')
const historyApiFallback = require('connect-history-api-fallback')

const config = require('./webpack.common.conf')({env:'development'})
const compiler = webpack(config) //给express使用

const proxyTable = require('./proxy')

for(let context in proxyTable){
  app.use(proxyMiddleware(context, proxyTable[context]))
}

app.use(historyApiFallback(require('./historyfallback')))

app.use(webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath
}))

app.use(webpackHotMiddleware(compiler))


app.listen(port, function(){
  console.log('> Ready on:' + port)
  opn('http://localhost:' + port)
})
```

这套写法的价值在于「服务是你自己的」。`webpack-dev-server` 内部其实也是 express 加这几个 middleware，只是把配置口收窄了。自己搭之后，想加个 mock 接口、想在启动前跑一段初始化脚本、想按环境切不同的代理表，都是往 `app.use` 里插一行的事。

代价是这些能力得自己维护。`webpack-dev-server` 升级带来的新特性你享受不到，HTTPS、`allowedHosts` 这类东西要自己接。我的判断是，项目没有特殊需求就老老实实用 `webpack-dev-server`，等到确实被它的配置口卡住了再自己搭。

`webpack-dev-middleware` 和 `webpack-hot-middleware` 到现在还在维护，Next.js、Storybook 这类工具内部用的也是这一层，所以这套知识没过时。变化的是周边：`opn` 改名成了 `open`，`http-proxy-middleware` 从 3.x 开始导出方式变成了 `const { createProxyMiddleware } = require('http-proxy-middleware')`，照抄老代码会报 not a function。



## 六、webpack实战场景

前面几节都在讲单个配置项怎么写，这一节换个视角，按项目里真实会遇到的问题来组织：产物太大怎么看清楚、构建太慢怎么提速、发版之后浏览器缓存怎么才不会整体失效、多页面项目的配置怎么组织。

这几件事在真实项目里是连着发生的。产物大了才想去分析，分析完发现第三方库占大头，于是做 vendor 分离；分离完又发现每次发版 hash 全变，再回头补长缓存。顺着这条链往下看会比较顺。

### 6.1 分析打包结果

优化之前得先看清楚产物里到底装了什么。`webpack-bundle-analyzer` 会把每个 chunk 里的模块画成一张可交互的矩形树图，哪个库占了最大那块，鼠标一悬停就知道。常见的收获是发现整个 `moment` 的 locale 目录被打进去了，或者某个组件库压根没走按需加载。

这块我单独写过一篇，配置方法和读图思路都在 [webpack 打包结果依赖分析](https://feinterview.poetries.top/blog/webpack-bundleAnalyzer)。


### 6.2 优化打包速度


构建慢分两种。一种是首次构建慢，大头在第三方依赖的解析和压缩；另一种是改一行代码要等半天，大头在 loader 每次都把没变的文件重新转译一遍。下面四种方法打在不同位置上，别指望一招通吃。

动手之前建议先量一下。`speed-measure-webpack-plugin` 能把每个 loader 和 plugin 的耗时列出来，看清楚时间花在哪再决定改哪，比凭感觉加插件靠谱得多。

#### 6.2.1 方法一：分开 vendor 和 app

> 分开第三方代码和业务代码，借助`DllPlugin`和`DllReferencePlugin`

`DllPlugin` 的思路是把 `react`、`antd` 这种一年也动不了几次的依赖提前单独打一次包，产出一个 `dll.js` 和一份 `manifest.json`。之后业务代码构建时，`DllReferencePlugin` 读那份 manifest，发现 `import React from 'react'` 已经在 dll 里了，就不再走一遍解析和转译，直接指向 dll 暴露的全局变量。

省下来的正是第三方库那部分的编译时间。项目的第三方依赖越重，这招收益越大。


**之前的打包时间**

> 现在我们来优化这个时间

![接入 DllPlugin 之前的 webpack 构建耗时](https://s.poetries.top/gitee/2019/10/656.png)

**第一步：新建`webpack.dll.conf.js`**

```js
// build/webpack.dll.conf.js

const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: {
    // 把这些资源打包成dll，提高编译速度
    react: ['react','react-router-dom','redux','redux-immutable','immutable','react-redux','react-router','redux-logger','redux-thunk','styled-components'],
    ui: ['antd-mobile','antd'],
    others: ['react-icons','axios','clipboard','humps','lodash','md5','moment','normalizr']
  },
  output: {
    path: path.resolve(__dirname, "../dll/"),
    filename: '[name].dll.js',
    library: '[name]'
  },
  plugins: [
    new webpack.DllPlugin({
      path: path.join(__dirname,'../dll/','[name]-manifest.json'),
      name: '[name]'
    }),
    new webpack.optimize.UglifyJsPlugin()
  ]
}

```

这份配置有三个点要留意。`entry` 是按「更新频率」分组的，React 全家桶、UI 库、工具库各一组，某个库升级时只需要重打对应那一组，不用全量重来。`output.library` 必须写，dll 产物要把模块挂到一个全局变量上，业务侧才找得到它。`DllPlugin` 的 `name` 要和 `output.library` 保持一致，对不上运行时会直接抛 undefined，而且报错信息看不出原因。

**第二步：加一个命令**

```js
// package.json
"scripts": {
  "dll": "webpack --config config/webpack.dll.conf.js"
}
```

> 执行`npm run dll`

![执行 npm run dll 之后生成的 dll 产物和 manifest 文件](https://s.poetries.top/gitee/2019/10/657.png)

**第三步： 在plugins中增加配置**

```js
// build/webpack.prod.conf.js
module.exports = {
   plugins: [
        new webpack.DllReferencePlugin({
          manifest: require('../dll/react-manifest.json')
        }),
        new webpack.DllReferencePlugin({
          manifest: require('../dll/ui-manifest.json')
        }),
        new webpack.DllReferencePlugin({
          manifest: require('../dll/others-manifest.json')
        })
   ]
}
```

> 再次执行`npm run build`

![接入 DllReferencePlugin 之后的构建耗时明显下降](https://s.poetries.top/gitee/2019/10/658.png)

编译时间大大减少了

这套方案在 webpack 3 / 4 时代是标配，代价是多了一条构建链路。dll 配置和业务配置的 webpack 版本、babel 配置要对齐，依赖升级之后忘了重跑 `npm run dll`，就会出现「明明装了新版本，跑的还是旧代码」这种玄学问题。这个我踩过，排查了一下午才想起来是 dll 没重打。

到了 webpack 5，一般就不再用 DllPlugin 了，换成持久化缓存：

```javascript
module.exports = {
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  }
}
```

它把整个构建过程的中间结果落到磁盘，二次构建直接读回来。覆盖范围比 dll 大得多，业务代码也能受益，而且不用你手工维护一份依赖清单。DllPlugin 的完整步骤和迁移说明我写在 [dll 预编译提高 webpack 打包速度](https://feinterview.poetries.top/blog/webpack-dll) 那篇里了。



#### 6.2.2 方法二：UglifyJsPlugin并行处理

**UglifyJsPlugin**

- `parallel`
- `cache`

压缩是 Seal 阶段最耗时的一步，它要把整棵 AST 重新遍历一遍，重命名变量、去掉死代码。`parallel` 打开后会按 CPU 核数起多个子进程分摊这件事，`cache` 则把没变过的 chunk 的压缩结果缓存下来，二次构建跳过。

```js
// build/webpack.prod.conf.js
module.exports = {
   plugins: [
        new UglifyJsPlugin({
          parallel:true, //并行处理
          cache: true
        })
   ]
}

这两个开关基本是白给的收益，唯一代价是内存占用会上去一些，在容器里跑 CI 要留意内存上限，我见过因为这个被 OOM kill 掉的。

不过 `UglifyJsPlugin` 现在已经不用了。Uglify 不认识 ES2015+ 语法，遇到箭头函数、`class` 直接报 parse error，社区从它 fork 出了 Terser。webpack 4 之后用 `terser-webpack-plugin`，webpack 5 干脆内置了它，`mode: 'production'` 下默认就压缩，要改选项才需要显式写出来：

```javascript
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({ parallel: true })]
  }
}
```

webpack 5 里 `parallel` 默认就是开的，这份配置只是给你看它挂在哪。

```


#### 6.2.3 方法三：happyPack

> `happyPack`把所有串行的东西并行处理,使得`loader`并行处理，较少文件处理时间

https://www.npmjs.com/package/happypack


`happypack` 干的事是把 loader 的执行丢进一个进程池。webpack 自己的构建流程是单线程的，几百个文件的项目，`babel-loader` 一个一个转译，CPU 其他核全在看戏。happypack 把文件分发给多个子进程并行转译，转完再收回来汇总。

用它有个前提得先想清楚，进程间通信本身是有开销的。文件数量少的小项目开了反而更慢，这类并行化手段几乎都有这个门槛。

```js
// build/webpack.prod.conf.js

// @file: webpack.config.js
const HappyPack = require('happypack');
 
exports.module = {
  rules: [
    {
      test: /.js$/,
      // 1) replace your original list of loaders with "happypack/loader":
      // loaders: [ 'babel-loader?presets[]=es2015' ],
      use: 'happypack/loader',
      include: [ /* ... */ ],
      exclude: [ /* ... */ ]
    }
  ],
  plugins: [
     // 2) create the plugin:
    new HappyPack({
        // 3) re-add the loaders you replaced above in #1:
        loaders: [ 'babel-loader?presets[]=es2015' ]
    })
  ]
}
```

这时的编译时间也减小了一些

![接入 happypack 之后的构建耗时](https://s.poetries.top/gitee/2019/10/659.png)

`happypack` 的作者早就不再维护它了，README 里明确建议改用 `thread-loader`。写法更简单，把 `thread-loader` 放在耗时 loader 前面就行：

```javascript
module.exports = {
  module: {
    rules: [{
      test: /\.js$/,
      use: ['thread-loader', 'babel-loader']
    }]
  }
}
```

顺着上面聊一句，webpack 5 开了持久化缓存之后，多进程转译的性价比其实在下降，二次构建根本不会再走 loader。我的建议是先开缓存，还嫌慢再考虑上多进程。


#### 6.2.4 方法四：减少 babel-loader 编译时间

**babel-loader**

> 开启缓存，指定编译范围

- `options.cacheDirectory`
- `include`
- `exclude`

`babel-loader` 是绝大多数项目里最慢的那一环，三个开关按收益排序是这样的。

`cacheDirectory: true` 打开后，babel 会把转译结果按文件内容哈希缓存到 `node_modules/.cache/babel-loader`，没改过的文件下次直接读缓存。这是收益最大的一个，副作用几乎没有。

`include` 指向 `src` 目录，让 loader 只处理你自己写的代码。很多人只写 `exclude: /node_modules/`，但 webpack 仍然要对每个文件做一次正则匹配，直接用 `include` 白名单更省事也更准。

`exclude` 用来在 `include` 范围内再挖掉一块，比如 `src/libs` 下那些本来就是 ES5 的第三方脚本，转译它们纯属浪费。

```javascript
{
  test: /\.js$/,
  include: path.resolve(__dirname, 'src'),
  exclude: path.resolve(__dirname, 'src/libs'),
  use: [{
    loader: 'babel-loader',
    options: { cacheDirectory: true }
  }]
}
```

我原来的笔记里把选项名写成了 `options.cache`，那是错的，babel-loader 的选项叫 `cacheDirectory`，上面已经改过来了。


#### 6.2.5 其他

- 减少`resolve`
- `Devtool`去除`sourcemap`
- `cache-loader`
- 升级`node`
- 升级`webpack`

这几条都是小收益但基本没成本的，顺手做掉就行。

`resolve` 那块，把 `resolve.extensions` 收窄到项目真正用到的后缀（每多一个后缀，找不到文件时就多一轮磁盘查找），`resolve.modules` 写成绝对路径避免逐层往上翻 `node_modules`，常用目录配上 `alias`。

`devtool` 在生产构建里如果不需要排查线上错误，直接关掉能省不少时间。既想留 source map 又不想泄露源码，用 `hidden-source-map`，把 map 文件传给 Sentry 这类平台，不放到线上目录。

`cache-loader` 是给那些自身没有缓存能力的 loader 用的，放在它们前面把结果存到磁盘。webpack 5 之后这个包也不需要了，`cache: { type: 'filesystem' }` 把它的场景全覆盖了。

升级 Node 和 webpack 这两条听着像套话，但确实有效。webpack 5 相比 4 在模块解析和缓存上重写了不少东西，Node 新版本的 V8 性能也一直在涨。构建慢到影响开发节奏的时候，先看看这两个版本是不是还停在好几年前。

再往前一步就是换工具。Vite 开发期用 esbuild 预打包加浏览器原生 ESM，冷启动几乎不用等；Rspack 用 Rust 重写了 webpack 的核心，配置基本兼容，迁移成本比换 Vite 低；Next.js 那边还有 Turbopack。不是说 webpack 不行，而是纯靠调配置能榨出来的空间是有上限的，到了上限就该考虑换赛道了。webpack 5 这一侧还能怎么调，我在 [Webpack 5 构建性能优化实战](https://feinterview.poetries.top/blog/webpack-5-build-optimization) 里写全了。



### 6.3 长缓存优化

长缓存要解决的问题是这样的：静态资源上了 CDN，服务端配了很长的 `Cache-Control`，理想状态是只有真正改过的文件才换文件名，其余的继续命中浏览器缓存。做不到这一点，每次发版用户都得把全部 JS 重新下一遍，首屏直接被打回原形。

**场景**

> 改变`app`代码，`vendor`变化

**解决**

- 提取`vendor`
- `hash`--> `chunkhash`(把`hash`变为代码块的`hash`，而不是文件的`hash`)
- 提取`webpack runtime`

这三步是有先后顺序的，跳步会白做。

先提取 `vendor`，把第三方库和业务代码分开，第三方库不动的时候它的内容就不会变。

然后把 `[hash]` 换成 `[chunkhash]`。`[hash]` 是整次构建的哈希，任何一个文件改动都会让所有产物一起改名，等于没做缓存；`[chunkhash]` 按 chunk 内容单独算，改业务代码不会牵连 vendor。

最后要把 webpack 的 runtime 提出来。runtime 里存着模块 id 到 chunk 的映射表，业务代码一变它就跟着变，如果它还留在 `vendor` 里，`vendor` 的 chunkhash 照样会变。这一步最容易被漏掉，前两步做了却发现缓存还是失效，多半就卡在这。

配置上的改动其实就一行的事：


```js
output: {
    path: path.resolve(__dirname, '../build/'),
    filename: 'static/js/[name].[chunkhash:5].js',
    chunkFilename: 'static/js/[name].[chunkhash:8].chunk.js',
    publicPath: '/' //浏览器中访问资源的路径
}
```

![使用 chunkhash 之后 vendor 文件名在多次构建之间保持不变](https://s.poetries.top/gitee/2019/10/660.png)

> 每次打包 `vendor` 的文件名都不会变，浏览器就能一直命中缓存（前提是服务端把 `Cache-Control` 配好了）

**场景：引入新模块，模块顺序变化，vendor hash变化**

> 解决： `NamedChunksPlugin` `NamedModulesPlugin`

对于动态模块引入需要给名称

这个场景挺隐蔽的。webpack 默认按递增数字给模块编 id，新增一个模块或者调整了 import 顺序，后面所有模块的 id 都会往后挪一位，`vendor` 的内容跟着变，`chunkhash` 自然也变了。代码明明一行没动，缓存却整体失效，第一次遇到会很懵。

`NamedModulesPlugin` 把数字 id 换成模块路径，`NamedChunksPlugin` 给 chunk 也起个稳定名字，id 不再依赖顺序，问题就消失了。动态 `import()` 记得配 `webpackChunkName` 注释，不然 chunk 名还是数字。

webpack 5 上这两个插件都没了，收敛进了 `optimization`：

```javascript
module.exports = {
  optimization: {
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
    runtimeChunk: 'single'
  }
}
```

`deterministic` 生成的是短的、和模块路径相关的稳定 id，比 `named` 的产物更小；`runtimeChunk: 'single'` 就是上面说的「提取 webpack runtime」，不用再手写 `CommonsChunkPlugin`。另外 webpack 5 做长缓存推荐用 `[contenthash]` 而不是 `[chunkhash]`，前者只跟这个文件最终输出的内容有关，提取 CSS 之后表现更准。

### 6.4 多页面应用

单页应用之外，后台系统、活动页、官网这类项目还是多页面居多。webpack 里组织多页面有两种路子，配置数组和单配置多入口。取舍点不在写法漂不漂亮，在于页面之间要不要共享代码。

#### 6.4.1 多页面特点

- 多入口
- 多页面`HTML`
- 每个页面不同的`chunk`
- 每个页面不同的参数

这四条里最容易出事的是第三条。每个页面要引哪些 chunk 得一个个写清楚，`HtmlWebpackPlugin` 的 `chunks` 参数漏配一项，页面上就会少一段脚本，偏偏构建还不报错，只有打开页面才发现白屏。


#### 6.4.2 多页面多配置

> `webpack` 从 `3.1.0` 开始支持 `module.exports` 导出一个配置数组，多页面多配置就是基于这个能力

 **优点**：
 - 可以使用`parallel-webpack`(并行处理多份配置)提高打包速度
- 配置更独立、灵活

**缺点**

- 不能多页面之间共享代码

配置数组的实际效果是「跑 N 次互相独立的构建」。每份配置有自己的 entry、自己的 `HtmlWebpackPlugin`，彼此完全不知道对方存在。好处是可以拿 `parallel-webpack` 并行跑，坏处也来自同一个原因，页面之间的公共依赖提取不了，React 会被完整打进每个页面的产物。

下面这份配置演示的是用一个 `generatePage` 函数批量生成页面配置，再用 `webpack-merge` 和公共配置合并，页面多的时候不用一份份手写。

```js
//package.json

{
  "name": "多页面配置",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "clean-webpack-plugin": "^1.0.0",
    "css-loader": "^1.0.1",
    "ejs-loader": "^0.3.1",
    "file-loader": "^2.0.0",
    "html-loader": "^0.5.5",
    "html-webpack-plugin": "^3.2.0",
    "react": "^16.3.1",
    "style-loader": "^0.23.1",
    "webpack": "^4.26.0",
    "webpack-merge": "^4.1.4"
  },
  "scripts": {},
  "devDependencies": {
    "extract-text-webpack-plugin": "^4.0.0-beta.0"
  }
}

```


```js
/**
 * 多页面多配置
 * @type {[type]}
 */

const merge = require('webpack-merge')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpack = require('clean-webpack-plugin')
const ExtractTextwebpack = require('extract-text-webpack-plugin')

const path = require('path')

const baseConfig = {
    mode: 'development',
    entry: {
        react: 'react'
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ExtractTextwebpack.extract({
            fallback: 'style-loader',
            use: 'css-loader'
          })
        }
      ]
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name].[chunkhash].js'
    },
    plugins: [
        new ExtractTextwebpack({
          filename: 'css/[name].[hash].css'
        }),
        new CleanWebpack(['./dist'])
    ],
    optimization: {
      splitChunks: {
          cacheGroups: {
              commons: {
                  // commons里面的name就是生成的共享模块bundle的名字
                  name: "react",
                  // chunks 有三个可选值，'initial'、'async' 和 'all'. 分别对应优化时只选择初始的chunks，所需要的chunks 还是所有chunks
                  chunks: "initial",
                  minChunks: Infinity
              }
          }
      }
    }
}

//生成每个页面配置
const generatePage = function({
    title = '',
    entry = '',
    template = './src/index.html',
    name = '',
    chunks = []
} = {}){
    return {
        entry,
        plugins: [
            new HtmlWebpackPlugin({
                chunks,
                template:`!!html-loader!${template}`,
                filename: name + '.html'
            })
        ]
    }
}

const pages = [
  generatePage({
      title: 'page A',
      entry: {
        a: './src/pages/a'
      },
      name: 'a',
      chunks: ['react','a']
  }),
  generatePage({
      title: 'page B',
      entry: {
        b: './src/pages/b'
      },
      name: 'b',
      chunks: ['react','b']
  }),
  generatePage({
      title: 'page C',
      entry: {
        c: './src/pages/c'
      },
      name: 'c',
      chunks: ['react','c']
  })
]

module.exports = pages.map(page=>merge(baseConfig, page))

```

这里的 `optimization.splitChunks` 只在单份配置内部生效，它把 `react` 这个 entry 拆成独立 chunk，但拆出来的仍然是每份配置各自的一份。想让三个页面共用同一份 React，得用下面的单配置写法。






#### 6.4.3 多页面单配置

> 多个页面共享一个配置

单配置的做法是把所有页面的 entry 塞进同一份配置，一次构建产出全部页面。因为在同一次构建里，webpack 能看到所有模块之间的关系，`splitChunks` 才有机会把 React 这种公共依赖提取成一个共享 chunk，三个页面共用一份。

- 优点：可以共享各个`entry`之间公用代码
- 缺点：打包速度比较慢，输出的内容比较复杂



代价是构建时间随页面数量线性上涨，而且任何一个页面的配置写错都会让整次构建失败，不像多配置那样各跑各的。页面在十个以内、依赖高度重合的项目，我一般选这种。

```js
/**
 * 多页面单配置
 */

 const merge = require('webpack-merge')
 const webpack = require('webpack')
 const HtmlWbpackPlugin = require('html-webpack-plugin')
 const CleanWebpack = require('clean-webpack-plugin')
 const ExtractTextwebpack = require("extract-text-webpack-plugin")

 const path = require('path')

 const baseConfig = {
     mode: 'development',
     entry: {
         react: 'react'
     },
     module: {
       rules: [
         {
           test: /\.css$/,
           use: ExtractTextwebpack.extract({
             fallback: 'style-loader',
             use: 'css-loader'
           })
         }
       ]
     },
     output: {
         path: path.resolve(__dirname, 'dist'),
         filename: 'js/[name].[chunkhash].js'
     },
     plugins: [
         new ExtractTextwebpack({
           filename: 'css/[name].[hash].css'
         }),
         new CleanWebpack(path.resolve(__dirname, 'dist'))
     ],
     optimization: {
       splitChunks: {
           cacheGroups: {
               commons: {
                   // commons里面的name就是生成的共享模块bundle的名字
                   name: "react",
                   // chunks 有三个可选值，'initial'、'async' 和 'all'. 分别对应优化时只选择初始的chunks，所需要的chunks 还是所有chunks
                   chunks: "initial",
                   minChunks: Infinity
               }
           }
       }
     }
 }

 //生成每个页面配置
 const generatePage = function({
     title = '',
     entry = '',
     template = './src/index.html',
     name = '',
     chunks = []
 } = {}){
     return {
         entry,
         plugins: [
             new HtmlWbpackPlugin({
                 chunks,
                 template:`!!html-loader!${template}`,
                 title,
                 filename: name + '.html'
             })
         ]
     }
 }

 const pages = [
   generatePage({
       title: 'page A',
       entry: {
         a: './src/pages/a'
       },
       name: 'a',
       chunks: ['react','a']
   }),
   generatePage({
       title: 'page B',
       entry: {
         b: './src/pages/b'
       },
       name: 'b',
       chunks: ['react','b']
   }),
   generatePage({
       title: 'page C',
       entry: {
         c: './src/pages/c'
       },
       name: 'c',
       chunks: ['react','c']
   })
 ]

 module.exports = merge([baseConfig].concat(pages))

```

> 完整例子 https://github.com/poetries/webpack-config-demo

两种写法的代码几乎一模一样，区别只在最后一行。多配置是 `pages.map(page => merge(baseConfig, page))` 导出一个数组，单配置是 `merge([baseConfig].concat(pages))` 合成一份。选哪个就看页面之间的公共代码多不多。

这两种写法在 webpack 4 上都还能跑，只是依赖要换：`ExtractTextWebpackPlugin` 换成 `mini-css-extract-plugin`，`CleanWebpackPlugin` 的构造参数从数组改成了对象。到 webpack 5 连清理插件都省了，`output.clean: true` 一行搞定。


## 七、更多学习

下面两篇是我当年配 webpack 4 的时候反复翻的，比这篇更贴近具体项目：

- [webpack4.0 入门篇 - 构建前端开发的基本环境](https://juejin.im/post/5bb089e86fb9a05cd84935d0)
- [用于前端开发的webpack4配置[带注释]](https://juejin.im/post/5be45723e51d45305c2ceaf0?utm_source=gold_browser_extension#heading-2)

webpack 这个主题我在站里拆成了几篇，各管一段，避免一篇写成万字长文谁也看不完：

- [webpack4 配置详解](https://feinterview.poetries.top/blog/webpack4-config)，webpack 4 的配置项手册
- [webpack4 定制前端开发环境](https://feinterview.poetries.top/blog/webpack-custom-work-flow)，从零搭一套开发环境的完整流程
- [webpack4 升级篇](https://feinterview.poetries.top/blog/webpack4-update)，3 升 4 的变更点和踩坑
- [webpack 常用插件总结](https://feinterview.poetries.top/blog/webpack-config-optize)，按场景整理的插件清单
- [dll 预编译提高 webpack 打包速度](https://feinterview.poetries.top/blog/webpack-dll)，预编译的完整步骤
- [webpack 打包结果依赖分析](https://feinterview.poetries.top/blog/webpack-bundleAnalyzer)，产物体积怎么看
- [Webpack 5 构建性能优化实战](https://feinterview.poetries.top/blog/webpack-5-build-optimization)，webpack 5 时代的性能配置

## 总结

回到开头那个三百多行配置的老项目。真正让人发怵的从来不是配置项多，是不知道每个字段作用在构建流程的哪一段，于是只能靠试。

Entry 决定依赖图从哪里开始长，Output 决定产物落在哪、叫什么。`[name]`、`[hash]`、`[chunkhash]`、`[contenthash]` 这几个占位符的差别看着细微，直接决定了长缓存能不能生效。

Loader 是「文件转模块」这一层的翻译官，链式执行、从右往左，`css-loader` 和 `style-loader` 顺序写反是最典型的报错来源。Plugin 挂在 webpack 的生命周期钩子上，口子比 loader 大得多，从改产物到改 HTML 都能干。

开发期真正要配的是四件事，dev server、proxy、HMR、SourceMap。它们互相之间有依赖，HMR 要 `hot: true` 加 `HotModuleReplacementPlugin` 一起上，CSS 的 source map 得在每个样式 loader 上单独开，少开一个链路就断了。

产物优化建议按这个顺序做：先用 analyzer 看清楚谁占了体积，再分离 vendor，再换 `chunkhash` 把长缓存做对，最后才轮到并行和缓存这类提速手段。反过来做很容易白忙。

最后说时效性。这篇的基线是 webpack 3，写新项目直接上 webpack 5 就行，`file-loader` / `url-loader` 换 Asset Modules，`CommonsChunkPlugin` 换 `optimization.splitChunks`，`ExtractTextWebpackPlugin` 换 `mini-css-extract-plugin`，`UglifyJsPlugin` 换 `terser-webpack-plugin`，DllPlugin 换 `cache: { type: 'filesystem' }`。老写法我一条没删，不是让你照抄，是因为你迟早要接手一个还在用它们的项目，到时候得看得懂。

## 参考

- [webpack 官方文档 Concepts](https://webpack.js.org/concepts/)
- [webpack 5 迁移指南](https://webpack.js.org/migrate/5/)
- [Asset Modules](https://webpack.js.org/guides/asset-modules/)
- [SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/)
- [webpack Caching 指南](https://webpack.js.org/guides/caching/)
- [webpack DevServer 配置](https://webpack.js.org/configuration/dev-server/)
- [Babel 官方文档](https://babeljs.io/docs/)
- [前端进阶之旅](https://interview.poetries.top)
