---
title: webpack4配置详解，从 entry 到 devServer 逐项拆解
date: 2018-11-18 14:32:12
description: 逐项拆解 webpack4 配置文件的每个字段，entry、output、hash、mode、devtool、optimization、resolve、module.rules、devServer 都讲清楚干什么、什么时候用，并标注在 webpack 5 下的现状与迁移方向。
tags:
  - webpack
  - 构建工具
  - 前端工程化
  - 配置详解
categories: Front-End
---

接手一个老项目，打开 `webpack.config.js`，两百行配置里一半的字段你都说不上来它在管什么，改一个 `publicPath` 得先在本地试三遍。这种情况我遇到过不止一次，问题不在配置难，在于大部分教程都是给你一份能跑的模板，没告诉你每个字段作用在构建的哪一步。

这篇是我当年整理 webpack4 配置时的逐字段笔记，按配置文件从上到下的顺序走一遍：每个字段管什么、典型取值是什么、什么场景下必须改。原文写于 webpack4 刚发布不久，现在 webpack 5 已经是主流，所以每一节后面我另起了一小段说明这块在新版本里有没有变化、该怎么迁移，老写法本身完整保留，因为老项目里它们还在跑。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `entry` 的单文件和多文件两种写法，以及 `vendors` 入口的历史用途
- `output` 里 `path` / `filename` / `chunkFilename` / `publicPath` 分别决定什么
- `hash`、`chunkhash`、`contenthash` 三种占位符的区别和选用场景
- `mode` 这个 webpack4 新增字段到底替代了什么
- `devtool` 各档位的取舍，以及生产环境的正确选择
- `optimization` 下 `minimize` / `splitChunks` / `runtimeChunk` 的作用
- `resolve` 的 `extensions` / `alias` / `modules` 三件套
- `module.rules` 的匹配规则和常见 loader 组合，含原文里一处配错的地方
- `devServer` 的代理、history 回退、热更新配置
- webpack4 删掉了哪些东西，以及这份配置迁到 webpack 5 要动哪几处

## 一、entry，构建的起点

`entry` 告诉 webpack 从哪个文件开始分析依赖。最常见的是对象形式，key 是 chunk 名字，value 是入口文件路径。

```js
//方式一：单文件写法
entry: {
	index: './src/pages/route.js',
	//about: './src/pages/about.js',
	//other:()=>{...}
}

//方式二：多文件写法
entry: {
	/*index:[
		'webpack-hot-middleware/client',
		'./src/root.js'
	],*/
	index: ['./src/root.js'],
	vendors : ['react','react-dom','redux','react-router','classnames'],
}
```

上面两段的差别在 value 的类型。单个字符串就是一个入口一个文件；数组形式表示这个 chunk 由多个文件合并而成，webpack 会按数组顺序把它们打进同一个 chunk，最后一个文件的导出作为整个 chunk 的导出。

被注释掉的那段 `'webpack-hot-middleware/client'` 值得说一句。用 `webpack-dev-middleware` + `webpack-hot-middleware` 自己搭 Node 服务时，热更新的客户端脚本得手动塞进入口数组里，dev-server 帮你做了这件事你才感觉不到它。

`vendors` 这个入口是那个年代的典型写法：把第三方库单独列成一个入口，配合 `CommonsChunkPlugin` 抽出来做长期缓存。

放到今天这条路已经不用了。webpack4 之后 `splitChunks` 用 `test: /[\\/]node_modules[\\/]/` 就能自动识别第三方依赖，不需要你手写一份依赖清单。手写清单最大的麻烦是维护，装了个新库忘了加进去，它就悄悄跑进业务 chunk 里了。同一时期还有 DllPlugin 那条路子，我在 [dll 预编译提高 webpack 打包速度](https://feinterview.poetries.top/blog/webpack-dll) 里单独写过，那篇也说明了为什么现在不推荐再用它。

## 二、output，产物往哪放

`output` 决定打包结果落到哪、叫什么名字、页面通过什么路径去请求它。

- `path`: 输出文件的目录
- `filename`: 输出的文件名，它一般跟你 `entry` 配置相对应，如 `js/[name].js`，`[name]` 在这里表示的是 `index`、`vendors` 这些入口名
- `chunkFilename`：块，配置了它，非入口 `entry` 的模块会被自动拆分文件，也就是大家常说的按需加载，与路由中的 `require.ensure` 相互对应
- `publicPath`：文件输出的公共路径
- `pathinfo`：保留相互依赖的包中的注释信息，这个基本不用主动设置，`development` 模式下默认 `true`，`production` 模式下默认 `false`
- 主要的就是这些，还有一些其他的 `library`、`libraryTarget`、`auxiliaryComment` 等

```js
output: {
	path: path.resolve(__dirname, '../assets'),
	filename: 'js/[name].js',
	chunkFilename: 'js/[name].[chunkhash:8].js',
	publicPath: '/_static_/', //最终访问的路径就是：localhost:3000/_static_/js/*.js
	//pathinfo:true,
}
```

这里最容易出问题的是 `publicPath`。它不影响文件写到磁盘的哪个目录，只影响运行时资源 URL 的前缀。异步 chunk 加载不出来、字体图片 404，十次里有八次是它配错了。本地开发一般用 `/`，部署到 CDN 就换成完整域名，部署在子路径下就写 `/子路径/`。

`filename` 和 `chunkFilename` 的分工也常被搞混。前者管有名字的入口 chunk，后者管那些通过动态导入产生的、没人给它起名的 chunk。原文里入口不带 hash、异步 chunk 带 `[chunkhash:8]`，这种搭配在有服务端模板渲染 HTML 的项目里能见到，纯前端项目一般两边都要带 hash。

`require.ensure` 是 webpack 1 时代的按需加载 API。现在统一用 `import('./xxx')`，它是 ECMAScript 标准语法，配合 `/* webpackChunkName: "foo" */` 魔法注释还能给 chunk 起名字。`require.ensure` 至今仍能用，但没有理由在新代码里写它。

## 三、hash 占位符怎么选

文件名里的那几个方括号占位符，用错了会直接毁掉浏览器缓存。常用的有三种：

|模板 |描述 |
|---|---|
|`hash`| 模块标识符的 `hash`，一般应用于 `filename：'[name].[hash].js'`|
|`chunkhash` |按需加载块内容的 `hash`，根据 chunk 自身的内容计算而来，`'js/[name].[chunkhash:8].js'`|
|`contenthash` |在提取 `css` 文件时根据内容计算而来的 `hash`，结合 `ExtractTextWebpackPlugin` 插件使用|
|`hash` 长度 |默认 `20`，可自定：`[hash:8]`、`[chunkhash:16]`|

三者的关键区别在计算范围。`[hash]` 是整次构建一个值，你改任何一个文件，所有产物的文件名全变，缓存全部作废，所以生产环境几乎不该用它。`[chunkhash]` 按 chunk 算，改业务代码不影响 vendors chunk 的名字。`[contenthash]` 按最终文件内容算，粒度最细。

那为什么 JS 和 CSS 打在一个 chunk 里时非要用 `[contenthash]` 呢？因为一个 chunk 会同时产出 `.js` 和 `.css` 两个文件，用 `[chunkhash]` 的话，你只改了一行 CSS，同 chunk 的 JS 文件名也跟着变，白白让用户重新下一遍 JS。

现在的建议很简单：生产环境所有产物统一用 `[contenthash]`。原文提到的 `ExtractTextWebpackPlugin` 在 webpack4 之后已经换成了 `mini-css-extract-plugin`，它对 `[contenthash]` 的支持更完整。这块的迁移细节我在 [webpack4 升级篇](https://feinterview.poetries.top/blog/webpack4-update) 里展开写了。

## 四、mode，webpack4 省下的一大堆配置

`mode` 属于 webpack4 才新增的字段，4 之前大家一般用 `DefinePlugin` 手动设置环境变量，再自己挨个开插件。

- `mode` 取值为 `development`、`production`、`none`
- `development`：开发模式，打包的代码不会被压缩，开启代码调试
- `production`：生产模式，正好反之

```js

//方法一
webpack --mode development/production

//方法二
……
mode:'development/production'
……

```

这个字段的价值不在于它本身，而在于它背后自动开了一整套预设。设成 `production` 之后，webpack 会自动把 `optimization.minimize`、`optimization.usedExports`、`optimization.concatenateModules`、`optimization.sideEffects` 这些统统打开，同时把 `process.env.NODE_ENV` 注入成 `'production'`。设成 `development` 则相反，走的是不压缩、保留可读性、开 `namedModules` 那套。

先说结论，绝大多数项目只需要设 `mode`，不需要再手动配那一堆开关。我见过不少配置文件里 `mode: 'production'` 和一长串 `optimization` 手动开关同时存在，其实是重复劳动，还容易改出前后矛盾的组合。

`none` 这个值是给要做精细控制或者调试 webpack 本身的场景用的，它什么优化都不开，产物最接近原始模块结构。想看清楚 webpack 的运行时代码长什么样，用它跑一次很直观。

webpack 5 这块没变，`mode` 的语义和默认值都延续下来了。

## 五、devtool，SourceMap 的取舍

`devtool` 控制是否生成、以及如何生成 source map 文件，开发环境下更有利于定位问题，默认 `false`。它的开启会影响编译速度，所以生产环境一定要谨慎。

常用的值有 `cheap-eval-source-map`、`eval-source-map`、`cheap-module-eval-source-map`、`inline-cheap-module-source-map` 等等，更详细的可以去[官方文档](https://webpack.js.org/configuration/devtool/)查看。一般使用 `eval-source-map` 较多，每个取值都有它不一样的特性。

这些看着眼花的名字其实是几个关键词拼出来的，拆开就好记了：

- `eval`：用 `eval()` 包裹模块代码，构建和重建都最快，代价是产物里全是字符串
- `cheap`：只映射到行，不映射到列，也不映射 loader 处理前的源码，速度提升明显
- `module`：把 `cheap` 丢掉的那部分补回来，映射回 loader 处理之前的原始源码
- `inline`：map 内容直接以 base64 塞进产物文件，不单独产出 `.map`
- `hidden`：生成 map 文件但不在产物末尾写引用注释

这里有个坑要注意，`cheap` 不带 `module` 的时候，你在浏览器里看到的是 Babel 转译后的代码，不是你写的那份 JSX 或 TS。调试组件时发现断点位置对不上，多半就是漏了 `module`。

原文推荐的 `cheap-module-eval-source-map` 在 webpack 5 里改名成了 `eval-cheap-module-source-map`，关键词顺序被规范化了，旧名字不再识别。这是升级时会直接报错的一处，改配置的时候留意一下。

生产环境我的做法是用 `hidden-source-map`，产出 map 文件但不公开引用，单独上传到 Sentry 这类平台还原堆栈，用户在浏览器里拿不到源码。要是连 map 文件都不想传，`nosources-source-map` 能给你堆栈行号但不含源码内容。直接用 `source-map` 等于把源码挂在公网上，别这么干。

## 六、optimization，webpack4 的优化总开关

`optimization` 是 webpack4 新增的，主要是用来让开发者根据需要自定义一些优化构建打包的策略配置。

- `minimize: true/false`，告诉 webpack 是否开启代码最小化压缩
- `minimizer`：自定 JS 优化配置，会覆盖默认的配置，结合 `UglifyJsPlugin` 插件使用
- `removeEmptyChunks`：布尔值，检测并删除空的块，设置为 `false` 将禁用此优化
- `nodeEnv`：它并不是 node 里的环境变量，设置后可以在代码里使用 `process.env.NODE_ENV === 'development'` 来判断一些逻辑，生产环境 `UglifyJsPlugin` 会自动删除无用代码
- `splitChunks`：取代了 `CommonsChunkPlugin`，自动分包拆分、代码拆分，默认配置只会作用于异步加载的代码块，也就是 `chunks: 'async'`，它有三个值：`all`、`async`、`initial`

```js
//环境变更也可以直接 在启动中设置
 //webpack --env.NODE_ENV=local --env.production --progress

//splitChunks 默认配置
splitChunks: {
  chunks: 'async',
  minSize: 30000,
  maxSize: 0,
  minChunks: 1,
  maxAsyncRequests: 5,
  maxInitialRequests: 3,
  automaticNameDelimiter: '~',
  name: true,
  cacheGroups: {
    vendors: {
      test: /[\\/]node_modules[\\/]/,
      priority: -10
    },
    default: {
      minChunks: 2,
      priority: -20,
      reuseExistingChunk: true
    }
  }
}
```

`chunks: 'async'` 是默认值，也是很多人第一次配 `splitChunks` 时最大的困惑来源。你写了 vendors 缓存组，构建完发现 `node_modules` 还在主包里，原因就是默认只处理异步 chunk，同步引入的那些它根本不管。改成 `chunks: 'all'` 就好了，这也是绝大多数项目该选的值。

`minSize: 30000` 是说小于 30KB 的模块不单独拆，免得把一堆几百字节的东西拆成几十个请求。`maxInitialRequests: 3` 限制入口能并行请求的 chunk 数，这个默认值在 HTTP/1.1 时代是合理的，在今天偏保守。

`runtimeChunk` 用来提取 webpack 运行时代码，可以设置为布尔值或者对象。该配置开启时，会覆盖入口指定的名称。

```js
optimization: {
	runtimeChunk:true,//方式一
  runtimeChunk: {
    name: entrypoint => `runtimechunk~${entrypoint.name}` //方式二
  }
}
```

运行时代码里存着「模块 id 到 chunk 文件名」的映射表。不单独抽出来的话，它会被塞进入口 chunk，任何一个异步 chunk 的 hash 变了，入口 chunk 的内容跟着变，用户的入口文件缓存就作废了。抽出来之后变的只是那个几 KB 的 runtime 文件。

webpack 5 在这一层动得比较多。`minimizer` 的默认实现从 `uglifyjs-webpack-plugin` 换成了 `terser-webpack-plugin`，UglifyJS 对 ES2015+ 语法支持不好，Terser 是它的 fork 且支持现代语法。`splitChunks` 的默认值也变了，`maxInitialRequests` 和 `maxAsyncRequests` 都提到了 30，`minSize` 在不同 chunk 类型下有区分，`automaticNameDelimiter` 的行为和 `name: true` 的默认命名策略也做过调整，具体数值以你用的版本的官方文档为准。分包和长期缓存的完整打法我写在了 [Webpack 5 构建性能优化实战](https://feinterview.poetries.top/blog/webpack-5-build-optimization) 里。

## 七、resolve，模块怎么找

`resolve` 配置模块如何解析，说的是「你写 `import x from 'y'` 时 webpack 去哪找这个 `y`」。

- `extensions`：自动解析确定的扩展，省去你引入组件时写后缀的麻烦
- `alias`：非常重要的一个配置，它可以配置一些短路径
- `modules`：webpack 解析模块时应该搜索的目录

其他的 `plugins`、`unsafeCache`、`enforceExtension` 基本没有怎么用到。

```js
//extensions 后缀可以省略，
import Toast from 'src/components/toast'; 

// alias ,短路径
import Modal from '../../../components/modal' 
//简写
import Modal from 'src/components/modal' 


resolve: {
  extensions: ['.js', '.jsx','.ts','.tsx', '.scss','.json','.css'],
  alias: {
    src :path.resolve(__dirname, '../src'),
    components :path.resolve(__dirname, '../src/components'),
    utils :path.resolve(__dirname, '../src/utils'),
  },
  modules: ['node_modules'],
},
```

`extensions` 这个数组是有代价的，webpack 会按顺序挨个试。一个不存在的 `./foo` 在上面这份配置下最多要试 7 次文件系统查找。所以两条经验：把项目里最常见的后缀放前面，用不到的别往里加。样式文件在业务代码里一般都是写全后缀导入的，`.scss` 和 `.css` 放进 `extensions` 收益很小。

`alias` 的坑在于它只对 webpack 生效。TypeScript 的类型检查、ESLint 的 `import/no-unresolved`、Jest 的模块解析都是各自独立的一套，配了 webpack alias 之后还得在 `tsconfig.json` 的 `paths`、`jest.config.js` 的 `moduleNameMapper` 里各配一遍，不然编辑器一片飘红。这个我踩过，找了半天以为是 webpack 的问题。

`modules: ['node_modules']` 是默认值，写不写都一样。改它的场景是想让某个目录像 `node_modules` 一样支持裸模块名导入，比如加上 `path.resolve(__dirname, '../src')` 之后就能直接 `import 'components/Modal'`。不过这种写法会和真实的 npm 包名产生歧义，我个人还是更倾向用 `alias` 加一个明确的前缀。

`modules` 里的相对路径写法（比如直接写 `'src'`）行为和绝对路径不同，它会像 `node_modules` 那样从当前目录逐级往上找，容易出意外，建议一律用 `path.resolve` 写绝对路径。

## 八、module.rules，编译规则

`rules` 也就是之前的 `loaders`，每一条规则回答两个问题：匹配哪些文件，用什么处理。

- `test`：正则表达式，匹配编译的文件
- `exclude`：排除特定条件，如通常会写 `node_modules`，即把某些目录或文件过滤掉
- `include`：它正好与 `exclude` 相反
- `use - loader`：必须要有它，相当于是 `test` 匹配到的文件对应的解析器，`babel-loader`、`style-loader`、`sass-loader`、`url-loader` 等等
- `use - options`：与 `loader` 配合使用，可以是一个字符串或对象，配置可以直接简写在 `loader` 内一起，它下面还有 `presets`、`plugins` 等属性

先看 JS 这条规则：

```js
{
	test: /\.(js|jsx)$/,
	exclude: /node_modules/,
	use: [
		{
			loader: 'babel-loader',
			options: {
				presets: [
					['env',
					{
						targets: {
						browsers: CSS_BROWSERS,
					},
				}],'react', 'es2015', 'stage-0'
				],
				plugins: [
					'transform-runtime',
					'add-module-exports',
				],
			},
		},
	],
},
```

`exclude: /node_modules/` 是这条规则里最影响构建速度的一行。不加它，webpack 会把几万个第三方文件也送进 Babel 转一遍，构建时间能差出好几倍。用 `include: path.resolve(__dirname, '../src')` 正向圈定范围比 `exclude` 更保险，因为 `exclude` 只排掉了你想到的那些目录。

这段 presets 是 Babel 6 时代的写法。`env`、`react`、`es2015`、`stage-0` 这些短名字在 Babel 7 里全部加了 `@babel/preset-` 前缀，`es2015` 已经被 `@babel/preset-env` 完全覆盖不再需要单列，`stage-x` 系列的提案预设在 Babel 7 里被整个移除了，官方要求你显式声明具体用到了哪个提案插件。`transform-runtime` 现在叫 `@babel/plugin-transform-runtime`。老项目升级 Babel 大版本时这一整段基本要重写。

再看样式这条：

```js
{
	test: /\.(scss|css)$/,
	use: [
		'style-loader',
		{loader: 'css-loader',options:{plugins: [require('autoprefixer')({browsers: CSS_BROWSERS,}),],sourceMap: true}},
		{loader: 'postcss-loader',options:{plugins: [require('autoprefixer')({browsers: CSS_BROWSERS,}),],sourceMap: true}},
		{loader: 'sass-loader',options:{sourceMap: true}}
	]
},
```

这里原文有一处配错了：`css-loader` 的 `options` 里塞了 `plugins: [autoprefixer]`。`css-loader` 不接受 PostCSS 插件配置，autoprefixer 属于 `postcss-loader` 的职责，这一项在 `css-loader` 上是无效配置，正确的做法是只在 `postcss-loader` 那一行配。我把这个错误留在上面的代码里没删，是为了让你知道踩过的样子，实际用的时候把 `css-loader` 那行的 `plugins` 去掉就行。

loader 数组的执行顺序是从右往左、从下往上，所以真实链路是 `sass-loader` 编译 SCSS，`postcss-loader` 加前缀，`css-loader` 处理 `@import` 和 `url()`，最后 `style-loader` 把 CSS 塞进 `<style>` 标签。写反了会报一堆看不懂的语法错误。

autoprefixer 的 `browsers` 选项在它的 9.x 版本里就被标记废弃了，改用 `package.json` 里的 `browserslist` 字段或者单独的 `.browserslistrc`。好处是 Babel 和 autoprefixer 共用同一份目标浏览器声明，不会两边配不一致。

最后是资源文件这两条：

```js
{
	test: /\.(png|jpg|jpeg|gif)$/,
	exclude: /node_modules/,
	use: [
		{
			loader: 'url-loader?limit=12&name=images/[name].[hash:8].[ext]',
		},
	],
},
{
	test: /\.(woff|woff2|ttf|eot|svg)$/,
	exclude: /node_modules/,
	use: [
		{
			loader: 'file-loader?name=fonts/[name].[hash:8].[ext]',
		},
	],
},
```

`url-loader` 的 `limit` 单位是字节，写成 `12` 的话几乎所有图片都会走文件输出，等价于直接用 `file-loader`。常见的取值是 `8192`，也就是 8KB 以下转 base64 内联，省一个 HTTP 请求；再大就不划算了，base64 会让体积膨胀约三分之一，还没法单独缓存。

`loader: 'url-loader?limit=12&name=...'` 这种查询字符串写法是 webpack 1 留下的习惯，能用但可读性差，现在都写成 `options` 对象。

webpack 5 把这两个 loader 的活揽了过去，内置了 Asset Modules，用 `type: 'asset/resource'`（等价 file-loader）、`type: 'asset/inline'`（等价 url-loader 内联）、`type: 'asset'`（按体积自动二选一，阈值用 `parser.dataUrlCondition.maxSize` 配）。升级时把 `url-loader`、`file-loader`、`raw-loader` 三个依赖一起删掉，配置反而更短。

## 九、项目中常用 loader

按处理对象归一下类，日常用到的其实就这么几组：

- `babel-loader`、`awesome-typescript-loader` 做 JS / TS 编译
- `css-loader`、`postcss-loader`、`sass-loader`、`less-loader`、`style-loader` 做 CSS 样式处理
- `file-loader`、`url-loader`、`html-loader` 做图片、SVG、HTML 的处理

这份清单里有两个需要更新。`awesome-typescript-loader` 已经不再维护，现在的选择是 `ts-loader`，或者更常见的做法是用 `babel-loader` 配 `@babel/preset-typescript` 只做类型擦除，类型检查交给独立的 `tsc --noEmit` 或者 `fork-ts-checker-webpack-plugin` 跑在另一个进程里，构建不被类型检查阻塞。`file-loader` 和 `url-loader` 如前面所说，在 webpack 5 里被 Asset Modules 取代了。

## 十、plugins 与 loader 的分工

先列一下原文提到的常用插件：

- `UglifyJsPlugin`
- `HotModuleReplacementPlugin`
- `NoEmitOnErrorsPlugin`
- `HtmlWebPackPlugin`
- `ExtractTextPlugin`
- `PreloadWebpackPlugin`

loader 的作用在于解析文件，比如把 ES6 转换成 ES5 甚至 ES3（毕竟还有万恶的 IE），把 Sass、Less 解析成 CSS，给 CSS 自动加上兼容前缀，对图片进行解析等等。plugins 则是对 loader 干的事情进行优化分类、提取公共代码、做压缩处理、输出到指定目录等。

这个区分从 API 层面看更清楚。loader 是一个函数，输入一个文件的内容字符串，输出转换后的字符串，它只能看到单个文件。plugin 拿到的是 `compiler` 对象，可以往构建生命周期的几十个钩子上挂回调，从初始化到写文件的每一步都能插手。所以凡是需要跨文件、需要知道整体产物结构的事情，都只能由 plugin 来做。

这份插件清单里有三个要换掉。`UglifyJsPlugin` 换 `terser-webpack-plugin`，`ExtractTextPlugin` 换 `mini-css-extract-plugin`，`NoEmitOnErrorsPlugin` 在 webpack4 之后由 `optimization.noEmitOnErrors` 接管、`production` 模式下默认就是开的。插件生态的完整梳理可以看 [webpack 常用插件总结篇](https://feinterview.poetries.top/blog/webpack-config-optize)。

## 十一、webpack-dev-server

本地开发服务器，除了起个静态服务，主要解决三件事：热更新、跨域代理、单页应用的路由回退。

- `contentBase`：告诉 dev server 在哪里查找文件，默认不指定会是当前项目根目录
- `historyApiFallback`：可以是布尔值或对象，默认响应的入口文件，包括 404 都会指向这里
- `compress`：启用 gzip 压缩
- `publicPath`：它其实就是 `output.publicPath`，当你改变了它，即会覆盖 `output` 的配置
- `stats`：可以自定控制要显示的编译细节信息
- `proxy`：它其实就是 `http-proxy-middleware`，可以处理一些代理的请求

```js
//方式一：不配置方式二的内容
 webpack-dev-server --config webpack/webpack.config.dev.js
//指定 端口： --port=8080 
//开启热更新：--hot
//gzip： --compress

//方式二
devServer: {
	contentBase:'./assets',
	host: '0.0.0.0',
	port: 9089,
	publicPath: '/assets/',
	historyApiFallback: {
		index: '/views/index.html'
	},
	/*
	匹配路径，进入不同的入口文件
	rewrites: [
			{ from: /^\/$/, to: '/views/landing.html' },
			{ from: /^\/subpage/, to: '/views/subpage.html' },
			{ from: /./, to: '/views/404.html' }
		]
	}
	*/
	compress: true,
	noInfo: true,
	inline: true,
	hot: true,
	stats: {
		colors: true,
		chunks: false
	},
	proxy:{
		'/mockApi': 'https://easy-mock.com/project/5a0aad39eace86040263d' ,//请求可直接写成  /mockApi/api/login...
	}
}
```

原文这段 `devServer` 少写了一个左花括号，上面已经补上了。

`historyApiFallback` 解决的是这个场景：单页应用用 History 模式路由，你在 `/user/123` 这个地址刷新页面，服务器上根本没有这个文件，直接 404。开了之后所有找不到的路径都回退到 `index.html`，由前端路由接管。用 Hash 模式路由的项目不需要它。

`host: '0.0.0.0'` 是让服务监听所有网卡，这样手机连同一个 Wi-Fi 就能用你电脑的局域网 IP 访问，调移动端时很常用。默认的 `localhost` 只监听回环地址，外部访问不到。

`proxy` 那一行有个高频问题：目标接口如果做了 Host 校验，直接代理过去会被拒。这时候要写成对象形式加上 `changeOrigin: true`，把请求头里的 Host 改成目标地址。跨域的排查思路我在这里就不展开了，浏览器控制台里看请求实际发到了哪个地址，八成能直接定位。

dev-server 4 对配置做了一轮重命名，这几处变化最容易踩到：`contentBase` 拆成了 `static`，`publicPath` 并进了 `devMiddleware.publicPath`，`stats` 和 `noInfo` 并进了 `devMiddleware.stats` 和 `client.logging`，`inline` 被移除（行为变成默认），`hotOnly: true` 改写成 `hot: 'only'`。`proxy` 在更新的版本里从对象形式改成了数组形式，具体以你装的那个版本的文档为准。

## 十二、webpack4 删掉的东西

原文这里列了五项，我核对了一下，有一项是错的：

- `module.loaders`：确实在 webpack4 移除，统一用 `module.rules`
- `NoErrorsPlugin`：早在 webpack 2 就被 `NoEmitOnErrorsPlugin` 取代，webpack4 里已经没有
- `CommonsChunkPlugin`：webpack4 移除，由 `optimization.splitChunks` 接管，这是升级时最大的一块工作量
- `OccurrenceOrderPlugin`：原文拼成了 `OccurenceOrderPlugin`，少了一个 r。它的功能被内置成默认行为，不需要手动引入
- `DefinePlugin`：**这一项是原文的错误，`DefinePlugin` 从来没有被移除**，它在 webpack 5 里依然是官方内置插件，日常注入环境变量还在用它

我猜原作者想说的是「4 之前用 `DefinePlugin` 手动设 `NODE_ENV`，现在 `mode` 会自动帮你设」，这个说法是对的，但插件本身还在。除了 `NODE_ENV` 之外的自定义常量注入，该用 `DefinePlugin` 还是得用。

顺带补一句 `webpack.optimize.UglifyJsPlugin`。它在 webpack4 里被移除了，改用 `optimization.minimizer` 配 `uglifyjs-webpack-plugin`；到了 webpack 5 又进一步换成了 `terser-webpack-plugin`，且默认就装好了，一般不用自己配。

## 十三、这份配置迁到 webpack 5 要动哪几处

把上面散落的迁移点集中列一下，老项目升级时可以照着过：

- [ ] `devtool` 的 `cheap-module-eval-source-map` 改名为 `eval-cheap-module-source-map`，旧名字会直接报错
- [ ] `url-loader` / `file-loader` / `raw-loader` 全部删掉，改用 `type: 'asset/resource'` 等 Asset Modules 写法
- [ ] `ExtractTextPlugin` 换 `mini-css-extract-plugin`，文件名占位符统一改 `[contenthash]`
- [ ] `uglifyjs-webpack-plugin` 换 `terser-webpack-plugin`，多数情况直接删掉配置用默认值
- [ ] `clean-webpack-plugin` 删掉，改用 `output.clean: true`
- [ ] `eslint-loader` 删掉，改用 `eslint-webpack-plugin`，lint 不再阻塞转译链路
- [ ] Node 内置模块（`path`、`crypto`、`buffer` 等）不再自动 polyfill，浏览器端用到的要在 `resolve.fallback` 里显式配 polyfill 包，或者干脆去掉这些依赖
- [ ] `optimization.namedModules` / `namedChunks` 换成 `optimization.moduleIds: 'named'` / `chunkIds: 'named'`
- [ ] 加上 `cache: { type: 'filesystem' }`，这是 webpack 5 收益最大的一个新特性
- [ ] `dev-server` 升到 4 之后按上一节的清单改字段名
- [ ] 手写的 `vendors` 入口和 DllPlugin 那套可以整个删掉，交给 `splitChunks` 加持久化缓存

清单里我自己在项目上实际走过的是前六条和最后两条，Node polyfill 那条只在一个用了 `crypto-js` 的老项目上遇到过一次，其他情况没验证过，遇到再查文档比较稳妥。

## 总结

webpack4 的配置文件看着长，拆开就是几个各管一段的字段。`entry` 和 `output` 决定从哪读、往哪写；`resolve` 决定模块怎么找；`module.rules` 决定每类文件用什么处理；`plugins` 和 `optimization` 决定产物怎么优化；`devServer` 只管本地开发体验，跟生产构建没关系。理清这个分工，看陌生的配置文件就不慌了。

真正要小心的字段其实不多。`publicPath` 配错会让资源 404，`hash` 占位符选错会毁掉浏览器缓存，`devtool` 在生产环境选错会把源码泄露到公网，`exclude: /node_modules/` 漏掉会让构建慢好几倍。这四处值得每次改配置时多看一眼。

原文提到的「webpack4 删除了 `DefinePlugin`」是错的，这个插件一直都在，被 `mode` 接管的只是 `NODE_ENV` 的自动注入。样式规则里把 autoprefixer 配在 `css-loader` 上也是无效的，它属于 `postcss-loader`。

至于迁移到 webpack 5，改动集中在几个 loader 和插件的替换上，配置量是往下减的，Asset Modules、`output.clean`、内置 Terser 都在帮你删代码。真正值得单独花时间的是 `cache: { type: 'filesystem' }`，二次构建的提升幅度是所有配置项里最大的。

## 参考

- [Webpack - Configuration](https://webpack.js.org/configuration/)
- [Webpack - Devtool 配置](https://webpack.js.org/configuration/devtool/)
- [Webpack - Asset Modules](https://webpack.js.org/guides/asset-modules/)
- [Webpack - SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/)
- [Webpack - To v5 from v4 迁移指南](https://webpack.js.org/migrate/5/)
- [webpack-dev-server - Options](https://webpack.js.org/configuration/dev-server/)
- [Babel - preset-env](https://babeljs.io/docs/babel-preset-env)
- [Browserslist 仓库](https://github.com/browserslist/browserslist)
- [前端进阶之旅](https://interview.poetries.top)
