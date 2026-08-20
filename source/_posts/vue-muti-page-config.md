---
title: Vue CLI3之pages 构建多页应用 多入口与多模板自动化
description: 用 glob 自动扫描 pages 目录生成多入口和多模板配置，再收敛到 Vue CLI3 的 pages 选项，一份配置支持任意数量的 html 产出，附常见踩坑和 Vite 时代的对应做法。
date: 2019-06-02 00:14:32
tags:
  - Vue
  - Vue CLI
  - webpack
  - 工程化
categories: Front-End
---

接到一个需求：同一个仓库里要打出三个互不相干的 html，活动页、后台页、落地页各一个，共用一套组件和工具函数，但各自有独立的路由和状态。用三个仓库分开做，公共代码得抄三份；硬塞进一个单页，路由会长成一团乱麻。这就是多页应用要解决的场景。这篇从最土的手写 `entry` 开始，一步步做到用 `glob` 自动扫描目录生成配置，最后收敛到 Vue CLI 3 官方的 `pages` 选项上，新增一个页面只要建个文件夹，构建配置一个字都不用改。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 多页应用的目录该怎么切，每个单页里放什么
- 用 `glob` 自动扫描 `pages` 目录生成 webpack 的 `entry`，避免手写入口
- `html-webpack-plugin` 的多模板配置，以及 `minify`、`chunks`、`inject` 各自管什么
- `configureWebpack` 里为什么 `entry` 能直接覆盖而 `plugins` 不能
- 把多入口和多模板合并成一个 `setPages` 方法，改用 CLI 的 `pages` 选项
- 这套 webpack 时代的写法，在 Vite 里对应什么

## 一、多页应用长什么样

首先我们可以把多页应用理解为由多个单页构成的应用。而何谓多个单页呢？其实你可以把一个单页看成是一个 `html` 文件，那么多个单页便是多个 `html` 文件，多页应用便是由多个 `html` 组成的应用。

既然多页应用拥有多个 `html`，那么同样其应该拥有多个独立的入口文件、组件、路由、`vuex` 等。说简单一点，多页应用的每个单页都可以拥有单页应用 `src` 目录下的文件及功能。我们来看一下一个基础多页应用的目录结构：

```bash
├── node_modules               # 项目依赖包目录
├── build                      # 项目 webpack 功能目录
├── config                     # 项目配置项文件夹
├── src                        # 前端资源目录
│   ├── images                 # 图片目录
│   ├── components             # 公共组件目录
│   ├── pages                  # 页面目录
│   │   ├── page1              # page1 目录
│   │   │   ├── components     # page1 组件目录
│   │   │   ├── router         # page1 路由目录
│   │   │   ├── views          # page1 页面目录
│   │   │   ├── page1.html     # page1 html 模板
│   │   │   ├── page1.vue      # page1 vue 配置文件
│   │   │   └── page1.js       # page1 入口文件
│   │   ├── page2              # page2 目录
│   │   └── index              # index 目录
│   ├── common                 # 公共方法目录
│   └── store                  # 状态管理 store 目录
├── .gitignore                 # git 忽略文件
├── .env                       # 全局环境配置文件
├── .env.dev                   # 开发环境配置文件
├── .postcssrc.js              # postcss 配置文件
├── babel.config.js            # babel 配置文件
├── package.json               # 包管理文件
├── vue.config.js              # CLI 配置文件
└── yarn.lock                  # yarn 依赖信息文件
```

这个结构里有两条边界值得先说清楚。

`src/pages/xxx/` 里面的东西是这个单页私有的，别的单页看不见也不该看见。`src/components`、`src/common`、`src/store` 这三个是跨单页共享的，谁都能引。分层一乱，多页的意义就没了，几个页面互相 import 内部组件，最后还是一坨。

另一条边界是运行时。三个 html 是三个独立的浏览器上下文，页面之间的跳转必须走 `location.href`，`vue-router` 的 `push` 只在单页内部有效，跨单页会静默失败。至于单页内部本身的路由、Vuex、接口层怎么组织，跟单页应用是一模一样的，我在 [Vue单页应用的基本配置](https://feinterview.poetries.top/blog/vue-single-page-config) 里写了完整一套，这篇不重复，专门聊构建层。

## 二、多入口，让 entry 自己长出来

在单页应用中，我们的入口文件只有一个，`CLI` 默认配置的是 `main.js`。但是到了多页应用，我们的入口文件便包含了 `page1.js`、`page2.js`、`index.js` 等，数量取决于 `pages` 文件夹下目录的个数。最直白的写法是手写死：

```js
module.exports = {
    ...
    
    entry: {
        page1: '/xxx/pages/page1/page1.js',
        page2: '/xxx/pages/page2/page2.js',
        index: '/xxx/pages/index/index.js',
    },
    
    ...
}
```

能跑，但每加一个页面就要回来改一次配置，还得记得改对路径。这类事情交给代码做比交给人做靠谱。

那么我们如何读取并解析这样的路径呢，这里就需要使用工具和函数来解决了。我们可以在根目录新建 `build` 文件夹存放 `utils.js` 这样共用的 webpack 功能性文件，并加入多入口读取解析方法：

```js
/* utils.js */
const path = require('path');

// glob 是 webpack 安装时依赖的一个第三方模块，该模块允许你使用 * 等符号,
// 例如 lib/*.js 就是获取 lib 文件夹下的所有 js 后缀名的文件
const glob = require('glob');

// 取得相应的页面路径，因为之前的配置，所以是 src 文件夹下的 pages 文件夹
const PAGE_PATH = path.resolve(__dirname, '../src/pages');

/* 
* 多入口配置
* 通过 glob 模块读取 pages 文件夹下的所有对应文件夹下的 js * 后缀文件，如果该文件存在
* 那么就作为入口处理
*/
exports.getEntries = () => {
    let entryFiles = glob.sync(PAGE_PATH + '/*/*.js') // 同步读取所有入口文件
    let map = {}
    
    // 遍历所有入口文件
    entryFiles.forEach(filePath => {
        // 获取文件名
        let filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'))
        
        // 以键值对的形式存储
        map[filename] = filePath 
    })
    
    return map
}
```

这段代码的核心就一句 `glob.sync(PAGE_PATH + '/*/*.js')`。两层 `*` 分别对应「任意一个单页目录」和「该目录下任意一个 js 文件」，所以它只会扫到 `pages/page1/page1.js` 这一层，不会递归进 `pages/page1/views/` 里去。这个通配符的精度是有意为之的，写成 `**/*.js` 就会把所有业务代码都当成入口。

这里有个约定必须遵守：入口文件名要和它所在的文件夹同名。因为 `map` 的 key 取的是文件名，后面模板、chunk 名全靠这个 key 串起来。你在 `page1/` 目录下建一个 `utils.js`，它会被当成一个新入口打出来。这个坑我第一次配的时候踩过，产物里莫名多了个 html，排查了好一会儿才想明白是 glob 多扫了一个文件。

`filePath.lastIndexOf('\/')` 这个写法看着奇怪，`'\/'` 在 JS 字符串里就是 `'/'`，反斜杠是多余的转义，不影响结果。真要写得干净点可以用 `path.basename(filePath, '.js')` 一步到位。

读取并存储完毕后，我们得到了一个入口文件的对象集合，这个对象我们便可以将其设置到 webpack 的 `entry` 属性上。这里我们需要修改 `vue.config.js` 的配置来间接修改 webpack 的值：

```js
/* vue.config.js */

const utils = require('./build/utils')

module.exports = {
    ...
    
    configureWebpack: config => {
        config.entry = utils.getEntries()
    },
    
    ...
}
```

这样我们多入口的设置便完成了。当然这并不是 CLI 所希望的操作，后面我们会进行改进。

## 三、多模板，一个页面配一个 html

相对于多入口来说，多模板的配置也是大同小异。这里所说的模板便是每个 `page` 下的 `html` 模板文件，而模板文件的作用主要用于 webpack 中 `html-webpack-plugin` 插件的配置，其会根据模板文件生成一个编译后的 `html` 文件并自动加入携带 hash 的脚本和样式。基本配置如下：

```js
/* webpack 配置文件 */
const HtmlWebpackPlugin = require('html-webpack-plugin') // 安装并引用插件

module.exports = {
    ...
    
    plugins: [
        new HtmlWebpackPlugin({
            title: 'My Page', // 生成 html 中的 title
            filename: 'demo.html', // 生成 html 的文件名
            template: 'xxx/xxx/demo.html', // 模板路径
            chunks: ['manifest', 'vendor', 'demo'], // 所要包含的模块
            inject: true, // 是否注入资源
        })
    ]
    
    ...
}
```

`chunks` 这个字段是多页配置里最容易出事的地方。它决定了这个 html 里会插入哪些 script 标签。不写的话，webpack 会把所有 chunk 都塞进每一个页面，三个页面各自加载三份业务代码，多页就白做了。

那为什么每个页面还要带上 `manifest` 和 `vendor` 呢？因为这两个是所有页面共用的运行时和第三方依赖，缺了页面直接报错。这里有个版本差异要提醒：`manifest` 和 `vendor` 是 webpack 3 时代 Vue CLI 2 模板的默认命名，Vue CLI 3 换成了 `chunk-vendors` 和 `chunk-common`。照抄这份配置之前，先去 `dist` 目录看一眼自己项目实际打出来的 chunk 叫什么名字，对不上的话页面会加载不到公共代码。

以上是单模板的配置，那么如果是多模板只要继续往 `plugins` 数组中添加 `HtmlWebpackPlugin` 即可。但是为了和多入口一样能够灵活地获取 `pages` 目录下所有模板文件并进行配置，我们可以在 `utils.js` 中添加多模板的读取解析方法：

```js
/* utils.js */
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')

// 多页面输出配置
// 与上面的多页面入口配置相同，读取 page 文件夹下的对应的 html 后缀文件，然后放入数组中
exports.htmlPlugin = configs => {
    let entryHtml = glob.sync(PAGE_PATH + '/*/*.html')
    let arr = []
    
    entryHtml.forEach(filePath => {
        let filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'))
        let conf = {
            template: filePath, // 模板路径
            filename: filename + '.html', // 生成 html 的文件名
            chunks: ['manifest', 'vendor',  filename],
            inject: true,
        }
        
        // 如果有自定义配置可以进行 merge
        if (configs) {
            conf = merge(conf, configs)
        }
        
        // 针对生产环境配置
        if (process.env.NODE_ENV === 'production') {
            conf = merge(conf, {
                minify: {
                    removeComments: true, // 删除 html 中的注释代码
                    collapseWhitespace: true, // 删除 html 中的空白符
                    // removeAttributeQuotes: true // 删除 html 元素中属性的引号
                },
                chunksSortMode: 'manual' // 按 manual 的顺序引入
            })
        }
        
        arr.push(new HtmlWebpackPlugin(conf))
    })
    
    return arr
}
```

原文这段没写 `merge` 和 `HtmlWebpackPlugin` 的引入，我在开头补上了，不然直接跑会报 `merge is not defined`。`webpack-merge` 在 4.x 之后导出方式改成了具名的 `{ merge }`，用新版本的话这一行要相应调整。

以上我们仍然是使用 `glob` 读取所有模板文件，然后将其遍历并设置每个模板的 config，同时针对一些自定义配置和生产环境的配置进行了 `merge` 处理。其中自定义配置的功能我在 [Vue多页路由与模板解析](https://feinterview.poetries.top/blog/vue-router-and-template-analyse) 里展开写了，包括怎么在模板里按环境插入统计脚本。这里介绍一下生产环境下 `minify` 配置的作用：将 `html-minifier` 的选项作为对象来缩小输出。

`html-minifier` 是一款用于缩小 `html` 文件大小的工具，其有很多配置项功能，包括上述所列举的常用的删除注释、空白、引号等。

被注释掉的 `removeAttributeQuotes` 值得说一句，它会把 `class="foo"` 压成 `class=foo`。规范上没问题，但如果你的项目里有代码用正则去匹配 HTML 属性，或者接了某些老旧的第三方脚本，压掉引号之后就会出诡异问题。默认关着是保守的选择，我觉得也没必要开，那点字节数省下来意义不大。

当我们编写完了多模板的方法后，我们同样可以在 `vue.config.js` 中进行配置。与多入口不同的是我们在 `configureWebpack` 中不能直接替换 `plugins` 的值，因为它还包含了其他插件：

```js
/* vue.config.js */

const utils = require('./build/utils')

module.exports = {
    ...
    
    configureWebpack: config => {
        config.entry = utils.getEntries() // 直接覆盖 entry 配置
        
        // 使用 return 一个对象会通过 webpack-merge 进行合并，plugins 不会置空
        return {
            plugins: [...utils.htmlPlugin()]
        }
    },
    
    ...
}
```

这个细节很多人会栽。`configureWebpack` 支持两种用法，写成函数直接修改传进来的 `config` 是原地改，写成返回一个对象是走 `webpack-merge` 合并。`entry` 我们本来就要整个换掉，原地赋值正合适；`plugins` 里 CLI 已经默认塞了一堆东西，比如 `DefinePlugin`、`CaseSensitivePathsPlugin`，你要是直接 `config.plugins = [...]`，那些全没了，构建会以各种莫名其妙的方式挂掉。所以这里用 return 的形式让它 merge 进去。

如此我们多页应用的多入口和多模板的配置就完成了。这时候我们运行命令 `yarn build` 后你会发现 `dist` 目录下生成了 3 个 html 文件，分别是 `index.html`、`page1.html` 和 `page2.html`。

## 四、收敛到 pages 配置

到这一步功能是齐的，但整套东西是绕开 CLI 直接操作 webpack 的，有点逆着框架走。

其实在 `vue.config.js` 中，我们还有一个配置没有使用，便是 `pages`。`pages` 对象允许我们为应用配置多个入口及模板，这就为我们的多页应用提供了开放的配置入口。官方示例代码如下：

```js
/* vue.config.js */
module.exports = {
    pages: {
        index: {
            // page 的入口
            entry: 'src/index/main.js',
            // 模板来源
            template: 'public/index.html',
            // 在 dist/index.html 的输出
            filename: 'index.html',
            // 当使用 title 选项时，
            // template 中的 title 标签需要是 <title><%= htmlWebpackPlugin.options.title %></title>
            title: 'Index Page',
            // 在这个页面中包含的块，默认情况下会包含
            // 提取出来的通用 chunk 和 vendor chunk。
            chunks: ['chunk-vendors', 'chunk-common', 'index']
        },
        // 当使用只有入口的字符串格式时，
        // 模板会被推导为 `public/subpage.html`
        // 并且如果找不到的话，就回退到 `public/index.html`。
        // 输出文件名会被推导为 `subpage.html`。
        subpage: 'src/subpage/main.js'
    }
}
```

注意官方示例里的 `chunks` 写的是 `chunk-vendors` 和 `chunk-common`，这就是前面提到的 CLI 3 默认命名。

`pages` 对象中的 `key` 就是入口的别名，而其 `value` 对象其实是入口 `entry` 和模板属性的合并。这样我们上述介绍的获取多入口和多模板的方法就可以合并成一个函数来进行多页的处理。合并后的 `setPages` 方法如下：

```js
// pages 多入口配置
exports.setPages = configs => {
    let entryFiles = glob.sync(PAGE_PATH + '/*/*.js')
    let map = {}

    entryFiles.forEach(filePath => {
        let filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'))
        let tmp = filePath.substring(0, filePath.lastIndexOf('\/'))

        let conf = {
            // page 的入口
            entry: filePath, 
            // 模板来源，和入口文件同目录同名
            template: tmp + '/' + filename + '.html', 
            // 在 dist/index.html 的输出
            filename: filename + '.html', 
            // 页面模板需要加对应的js脚本，如果不加这行则每个页面都会引入所有的js脚本
            chunks: ['manifest', 'vendor', filename], 
            inject: true,
        };

        if (configs) {
            conf = merge(conf, configs)
        }

        if (process.env.NODE_ENV === 'production') {
            conf = merge(conf, {
                minify: {
                    removeComments: true, // 删除 html 中的注释代码
                    collapseWhitespace: true, // 删除 html 中的空白符
                    // removeAttributeQuotes: true // 删除 html 元素中属性的引号
                },
                chunksSortMode: 'manual'// 按 manual 的顺序引入
            })
        }

        map[filename] = conf
    })

    return map
}
```

这里我改了原文一处。原文写的是 `template: tmp + '.html'`，而 `tmp` 是入口文件所在的目录路径，比如 `/src/pages/page1`，拼上 `.html` 得到的是 `/src/pages/page1.html`，也就是 `pages` 目录下的一个平级文件，跟第三节里 `glob` 扫的 `pages/*/*.html` 对不上。按前面约定的目录结构，模板应该是 `/src/pages/page1/page1.html`，所以改成了 `tmp + '/' + filename + '.html'`。如果你照着原写法跑，构建时会提示模板文件找不到。

上述代码我们 return 出的 `map` 对象就是 `pages` 所需要的配置项结构，我们只需在 `vue.config.js` 中引用即可：

```js
/* vue.config.js */

const utils = require('./build/utils')

module.exports = {
    ...
    
    pages: utils.setPages(),
    
    ...
}
```

这样我们多页应用基于 `pages` 配置的改进就大功告成了。当你运行打包命令来查看输出结果的时候，你会发现和之前的方式相比并没有什么变化，这就说明这两种方式都适用于多页的构建，但是这里还是推荐大家使用更便捷的 `pages` 配置。

那既然产物一样，为什么还要绕这一圈换过来？

因为 `pages` 是 CLI 自己认识的配置项。走 `configureWebpack` 手动塞 `HtmlWebpackPlugin` 的时候，CLI 内部的一些行为，比如 preload/prefetch 提示的注入、开发服务器的多页面路由处理，是按它自己那套 `pages` 来推导的，你从旁边插进去的插件它不知道，容易出现「打包没问题但 dev server 行为怪怪的」。用官方口子，这些配套能力是白送的。

## 五、这套写法在今天的对应做法

Vue CLI 已经进入维护状态，官方推荐新项目用 Vite。多页这件事在 Vite 里没有 `pages` 这样的专属选项，走的是 Rollup 的多入口。你在 `vite.config.js` 里配 `build.rollupOptions.input`，传一个 `{ index: 'index.html', page1: 'page1/index.html' }` 这样的对象，注意 Vite 的入口是 html 文件本身，不是 js。html 里用 script 标签引自己的入口 js，依赖关系由 Vite 从 html 反向解析出来。

思路上是反过来的：webpack 时代是 js 是入口、html 是模板；Vite 时代是 html 是入口、js 是被引用的资源。所以「用 glob 扫目录自动生成配置」这个套路还是能用，只是扫的对象从 `*.js` 换成了 `*.html`。

这块我只在小项目上试过，复杂多页项目从 CLI 迁到 Vite 会遇到什么，我没有完整踩过一遍，别当成结论。

## 总结

把这一圈过下来，几个能直接带走的结论：

- 多页应用就是多个 html，`src/pages/` 下每个目录自成一体，公共的东西留在 `components`、`common`、`store`
- 入口不要手写，`glob.sync(PAGE_PATH + '/*/*.js')` 两层通配符刚好扫到入口层，注意别在单页目录下放同级的工具 js
- 入口文件名必须和所在文件夹同名，整套配置的 key 都靠这个约定串起来
- `chunks` 字段决定 html 里插哪些 script，公共 chunk 的名字要按自己项目实际产物填，`manifest`/`vendor` 和 `chunk-vendors`/`chunk-common` 是不同 CLI 版本的命名
- `configureWebpack` 写成函数是原地改，返回对象是走 merge，`plugins` 只能用后者
- 最终推荐收敛到 CLI 的 `pages` 选项，`setPages` 一个方法同时产出入口和模板配置
- 原文 `setPages` 里的 `template: tmp + '.html'` 拼出的路径是错的，得带上文件夹那一层

配好之后你会发现，新增一个页面的成本变成了「复制一个文件夹改个名」，构建配置再也不用碰。这就是自动化扫目录这件事真正值钱的地方。

## 参考

- [Vue CLI 配置参考 - pages](https://cli.vuejs.org/zh/config/#pages)
- [html-webpack-plugin - GitHub](https://github.com/jantimon/html-webpack-plugin)
- [webpack - 入口起点](https://webpack.docschina.org/concepts/entry-points/)
- [glob - GitHub](https://github.com/isaacs/node-glob)
- [Vite - 构建选项](https://cn.vitejs.dev/config/build-options.html)
- [前端进阶之旅](https://interview.poetries.top)
