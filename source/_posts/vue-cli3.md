---
title: Vue CLI 3 项目构建基础 vue.config.js 配置详解
description: 从零搭一个 Vue CLI 3 项目，讲清它为什么看不到 webpack 配置文件，逐项拆解 vue.config.js 里的 publicPath、outputDir、chainWebpack、configureWebpack、devServer，并附默认插件清单与迁移到 Vite 的对照。
date: 2019-06-02 00:12:32
tags:
  - Vue
  - Vue CLI
  - webpack
  - 前端工程化
categories: Front-End
---

用 Vue CLI 3 建完项目，很多人第一反应是懵的：`build` 目录呢？`webpack.base.conf.js` 呢？CLI 2 时代那一堆能随便改的配置文件全没了，根目录干净得只剩一个 `package.json`。想改个图片打包阈值、加个二级目录、配个代理，无从下手。这篇就顺着这条线走一遍，先把项目跑起来，再讲清 CLI 3 把 webpack 藏到哪去了，然后把 `vue.config.js` 里每一项配置对应改的是 webpack 的哪个字段讲明白，最后附上默认插件清单和现在该怎么选型。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 安装 Vue CLI 3 并创建项目，看懂生成的目录结构
- CLI 3 到底把 webpack 配置藏在了哪里，为什么要这么做
- `vue.config.js` 六个常用配置项各自改的是 webpack 的什么
- `chainWebpack` 和 `configureWebpack` 的区别，什么时候用哪个
- 用 `vue inspect` 反查最终生效的完整配置
- CLI 3 默认给你装了哪些 webpack 插件，各自干什么
- Vue CLI 进入维护状态之后，新项目该怎么办

## 一、先把环境和脚手架装好

先确认本地 Node 环境。CLI 3 官方要求的 Node 版本是 8.9 及以上，太老的版本装不上：

```bash
# 查看 node 版本
node -v

# 查看 npm 版本
npm -v
```

然后全局装脚手架：

```bash
# 安装 Vue CLI 3.x
npm i -g @vue/cli
```

这里有个新旧包名的坑。CLI 2 的包名是 `vue-cli`，CLI 3 换成了带 scope 的 `@vue/cli`，两者是两个独立的 npm 包。如果你机器上以前装过 `vue-cli`，`vue -V` 打出来还是 2.x，先把老的卸干净再装新的，不然命令会打架。

装完之后，在你想要放项目的目录下执行创建命令：

```bash
# my-project 是你的项目名称
vue create my-project
```

它会先问你选预设还是手动选特性，手动模式下可以勾 Router、Vuex、CSS 预处理器、ESLint、单元测试这些。这一步选完之后配置会记在本地，下次建项目可以直接复用预设，不用再点一遍。

## 二、目录结构和可视化界面

创建完成后的目录长这样：

```bash
├── node_modules     # 项目依赖包目录
├── public
│   ├── favicon.ico  # ico图标
│   └── index.html   # 首页模板
├── src 
│   ├── assets       # 样式图片目录
│   ├── components   # 组件目录
│   ├── views        # 页面目录
│   ├── App.vue      # 父组件
│   ├── main.js      # 入口文件
│   ├── router.js    # 路由配置文件
│   └── store.js     # vuex状态管理文件
├── .gitignore       # git忽略文件
├── .postcssrc.js    # postcss配置文件
├── babel.config.js  # babel配置文件
├── package.json     # 包管理文件
└── yarn.lock        # yarn依赖信息文件
```

几个点值得留意。`public` 目录里的东西是原样拷贝到构建产物里的，不走 webpack 处理，所以那些必须保持固定文件名的资源（第三方 SDK、静态 JSON）放这儿最省事。`index.html` 是模板，里面可以用 `htmlWebpackPlugin.options` 的变量。

`components` 和 `views` 的分工是 CLI 给的一个约定：`views` 放路由级别的页面，`components` 放可复用的组件。这条约定挺重要，它其实对应的是容器组件和展示组件的划分，我在 [Vue组件化实践详解](https://feinterview.poetries.top/blog/vue-comp) 里把组件之间怎么通信讲得比较细，配合着看会更清楚为什么要这么分。

还有一点，`router.js` 和 `store.js` 是 CLI 3 早期版本生成的单文件形式。后来的版本改成了 `router/index.js` 和 `store/index.js` 目录形式，方便把路由拆成多个模块。你手上的版本生成哪种以实际为准，两种都能跑。

除了命令行，CLI 3 还提供了一个图形化界面，在项目目录下运行：

```
vue ui
```

它会起一个本地服务，浏览器里能看到依赖列表、可用的 task、插件管理。日常我用得不多，但有两个场景挺顺手：一是给非前端同学演示怎么跑构建，二是下面要讲的查看 webpack 完整配置。

## 三、CLI 3 为什么看不到 webpack 配置

用过 CLI 2 的人都知道，它生成的项目里有一整套 webpack 配置文件摊在 `build` 目录下，想改什么直接进去改。CLI 3 里这些文件一个都没有，那它是抛弃 webpack 了吗？

当然不是。CLI 3 用的还是 webpack，只是把配置封装进了 `@vue/cli-service` 这个包里，对外只暴露一个 `vue.config.js` 作为修改入口。

这个改动当年争议不小，我一开始也觉得别扭，配置摸不着心里没底。用久了才体会到好处：项目里那份 webpack 配置一旦落地成文件，就跟项目绑死了，升级 webpack、升级 loader 全靠人肉改，几十个项目就是几十份需要各自维护的配置。封装进依赖之后，升级 CLI 版本就等于升级了整套构建配置，成本从 N 降到 1。

代价是灵活性。你想做的事如果超出了 `vue.config.js` 暴露的范围，就得靠 `chainWebpack` 去改内部结构，得先知道 CLI 给每条规则、每个插件起的名字是什么。这也是为什么 `vue inspect` 这个命令后面会反复出现。

## 四、vue.config.js 逐项拆解

`vue.config.js` 放在项目根目录，导出一个对象。下面这几项是最常改的。

### 1. baseUrl 与现在的 publicPath

如果你想把项目部署在一个二级目录下，比如 `http://localhost:8080/vue/`，需要配置这一项：

```js
// vue.config.js
module.exports = {
    ...
    
    baseUrl: 'vue',
    
    ...
}
```

它改的是 webpack 配置里 `output.publicPath`，重启服务之后首页 URL 就带上二级目录了。

这里要补两个更正。第一，`baseUrl` 这个名字从 Vue CLI 3.3 起就废弃了，改名叫 `publicPath`，新版本里写 `baseUrl` 会给你一条警告，功能还在但别再用。第二，值本身建议写成 `'/vue/'` 这种前后都带斜杠的形式，只写 `'vue'` 在部分资源路径拼接时容易出问题。所以现在的写法是：

```js
// vue.config.js
module.exports = {
    publicPath: process.env.NODE_ENV === 'production' ? '/vue/' : '/'
}
```

按环境区分是因为本地开发一般在根路径下跑，生产才有二级目录。如果部署到 CDN，这里直接填完整的 CDN 域名也行。

### 2. outputDir

想把构建产物输出到别的文件夹（默认是 `dist`）：

```js
// vue.config.js
module.exports = {
    ...
    
    outputDir: 'output',
    
    ...
}
```

跑 `yarn build` 之后项目根目录会出现 `output` 文件夹。它改的是 webpack `output.path`。

顺带说个相关的：`assetsDir` 控制的是产物内部静态资源的子目录名（默认是空，资源直接散在根下）。如果后端同学要求 js、css、图片必须归到 `static` 下，配 `assetsDir: 'static'` 就行，不用去动 webpack。

### 3. productionSourceMap

这一项控制生产构建要不要生成 source map：

```js
// vue.config.js
module.exports = {
    ...
    
    productionSourceMap: true,
    
    ...
}
```

它对应 webpack 里 `devtool` 的值。开启后线上报错能还原到源码行号，定位问题快很多。

但这条现在得加个前提。生产环境直接把 `.map` 文件传上服务器，等于把源码原封不动交出去了，任何人打开 DevTools 都能看到你的业务逻辑。现在通行的做法是关掉 `productionSourceMap`，改成在构建流程里单独生成 map 文件、上传给 Sentry 这类错误监控平台，然后从部署产物里删掉。既保留了还原能力，又不把源码挂到公网上。

顺手一提，`productionSourceMap: false` 还能明显缩短构建时间，大项目上能省掉不少。

### 4. chainWebpack

`chainWebpack` 允许我们用链式操作细致地修改 webpack 内部配置，底层集成的是 `webpack-chain` 这个库。比如要把图片的 base64 内联阈值改大：

```js
// 用于做相应的合并处理
const merge = require('webpack-merge');

module.exports = {
    ...
    
    // config 参数为已经解析好的 webpack 配置
    chainWebpack: config => {
        config.module
            .rule('images')
            .use('url-loader')
            .tap(options =>
                merge(options, {
                  limit: 5120,
                })
            )
    }
    
    ...
}
```

`rule('images')` 和 `use('url-loader')` 里的字符串不是随便写的，是 CLI 给这条规则和这个 loader 起的名字，得先用 `vue inspect` 查出来才能对得上。`tap` 拿到的是这个 loader 当前的 options，返回值就是新的 options，这里用 `webpack-merge` 做合并而不是直接覆盖，是为了保住 CLI 原本设的其他字段。

改完之后，webpack 里对应的这段配置变成：

```js
{
    ...
    
    module: {
        rules: [
            {   
                /* config.module.rule('images') */
                test: /\.(png|jpe?g|gif|webp)(\?.*)?$/,
                use: [
                    /* config.module.rule('images').use('url-loader') */
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 5120,
                            name: 'img/[name].[hash:8].[ext]'
                        }
                    }
                ]
            }
        ]
    }
    
    ...
}
```

注意 `limit: 5120` 的单位是字节，也就是 5KB，不是 5MB。这个数字调大要慎重，内联进 JS 的 base64 会变大三分之一左右，而且没法被浏览器单独缓存，阈值设太大反而拖慢首屏。我的经验是 4KB 到 10KB 之间，专门给图标类小图用。

### 5. configureWebpack

除了链式修改，还可以用 `configureWebpack` 改配置。两者的区别在于 `chainWebpack` 是精细的链式操作，`configureWebpack` 更倾向于整体替换和合并：

```js
// vue.config.js
module.exports = {
    ...
    
    // config 参数为已经解析好的 webpack 配置
    configureWebpack: config => {
        // config.plugins = []; // 这样会直接将 plugins 置空
        
        // 使用 return 一个对象会通过 webpack-merge 进行合并，plugins 不会置空
        return {
            plugins: []
        }
    }
    
    ...
}
```

`configureWebpack` 可以直接是一个对象，也可以是一个函数。是对象时 CLI 会用 `webpack-merge` 把它并进去；是函数时，你既可以直接改传入的 `config` 参数（改的是原对象，返回值不用管），也可以返回一个新对象交给 merge 处理。这两种用法千万别混着写，函数里既改 `config` 又 `return` 一个对象，很容易搞不清最终生效的是哪份。

选哪个的判断很简单：加插件、改 `externals`、加 `resolve.alias` 这类「往上叠东西」的需求用 `configureWebpack`；要改某条已有 loader 规则的参数、要删掉某个默认插件、要调整插件的构造参数，这类「动内部结构」的需求只能用 `chainWebpack`，因为你需要按名字定位。

改完怎么确认生效了？在项目目录下运行 `vue inspect` 就能看到最终解析出来的完整 webpack 配置，也可以缩小范围：

```bash
# 只查看 plugins 的内容
vue inspect plugins
```

这个命令是排查构建问题的第一手段。配置没生效、loader 顺序不对、插件被重复注册，`vue inspect` 一跑基本都能看出来。输出很长，建议重定向到文件里再慢慢看。

### 6. devServer

`devServer` 用于配置本地开发服务器的行为。我们跑的 `yarn serve` 对应的是 `vue-cli-service serve`，底层就是 `webpack-dev-server`：

```js
// vue.config.js
module.exports = {
    ...
    
    devServer: {
        open: true, // 是否自动打开浏览器页面
        host: '0.0.0.0', // 指定使用一个 host。默认是 localhost
        port: 8080, // 端口地址
        https: false, // 使用https提供服务
        proxy: null, // string | Object 代理设置
        
        // 提供在服务器内部的其他中间件之前执行自定义中间件的能力
        before: app => {
          // `app` 是一个 express 实例
        }
    }
    
    ...
}
```

日常用得最多的是 `proxy`。前端本地 8080，后端接口在另一个域名上，直接请求会被跨域拦下来，配个代理把 `/api` 开头的请求转发过去就绕开了。要注意 `changeOrigin: true` 一般是必须的，不然后端拿到的 Host 头还是 `localhost:8080`，有些网关会因此拒绝。

`host: '0.0.0.0'` 的作用是让局域网内其他设备也能访问，手机上调试移动端页面时必须这么设。

除了以上参数，它支持所有 `webpack-dev-server` 的选项，比如 `historyApiFallback` 用于重写路由（history 模式下刷新页面 404 就靠它）。

这里有个需要更新的点：`before` 这个字段在 `webpack-dev-server` 4 之后经历过几次改名，最终统一到 `setupMiddlewares` 上。你手上的 CLI 版本用的是哪一版 dev-server，决定了该写哪个名字，以对应版本的官方文档为准，别照着老文章硬抄。

## 五、默认装了哪些 webpack 插件

既然 CLI 把配置封装起来了，那它默认给我们塞了哪些插件？除了 `vue inspect plugins`，也可以走图形界面看：

- 打开可视化页面，点击对应项目进入管理页面（如果没有对应项目，需要导入或新建）
- 点击侧边栏 `Tasks` 选项，再点击二级栏 `inspect` 选项
- 点击 `Run task` 按钮执行审查命令

从输出里找到 `plugins` 数组，大致是下面这些（配置项已省略，补上了定义插件的代码）：

```js
// vue-loader是 webpack 的加载器，允许你以单文件组件的格式编写 Vue 组件
const VueLoaderPlugin = require('vue-loader/lib/plugin');

// webpack 内置插件，用于创建在编译时可以配置的全局常量
const { DefinePlugin } = require('webpack');

// 用于强制所有模块的完整路径必需与磁盘上实际路径的确切大小写相匹配
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');

// 识别某些类型的 webpack 错误并整理，以提供开发人员更好的体验。
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');

// 将 CSS 提取到单独的文件中，为每个包含 CSS 的 JS 文件创建一个 CSS 文件
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// 用于在 webpack 构建期间优化、最小化 CSS文件
const OptimizeCssnanoPlugin = require('optimize-css-assets-webpack-plugin');

// webpack 内置插件，用于根据模块的相对路径生成 hash 作为模块 id, 一般用于生产环境
const { HashedModuleIdsPlugin } = require('webpack');

// 用于根据模板或使用加载器生成 HTML 文件
const HtmlWebpackPlugin = require('html-webpack-plugin');

// 用于在使用 html-webpack-plugin 生成的 html 中添加 <link rel ='preload'> 或 <link rel ='prefetch'>，有助于异步加载
const PreloadPlugin = require('preload-webpack-plugin');

// 用于将单个文件或整个目录复制到构建目录
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    plugins: [
        /* config.plugin('vue-loader') */
        new VueLoaderPlugin(), 
        
        /* config.plugin('define') */
        new DefinePlugin(),
        
        /* config.plugin('case-sensitive-paths') */
        new CaseSensitivePathsPlugin(),
        
        /* config.plugin('friendly-errors') */
        new FriendlyErrorsPlugin(),
        
        /* config.plugin('extract-css') */
        new MiniCssExtractPlugin(),
        
        /* config.plugin('optimize-css') */
        new OptimizeCssnanoPlugin(),
        
        /* config.plugin('hash-module-ids') */
        new HashedModuleIdsPlugin(),
        
        /* config.plugin('html') */
        new HtmlWebpackPlugin(),
        
        /* config.plugin('preload') */
        new PreloadPlugin(),
        
        /* config.plugin('copy') */
        new CopyWebpackPlugin()
    ]
}
```

原文这段代码里插件变量声明成了 `FriendlyErrorsPlugin`，实例化时却写成 `new FriendlyErrorsWebpackPlugin()`，两个名字对不上，直接跑会报未定义，上面已经统一了。另外 `OptimizeCssnanoPlugin` 这个变量名和它 require 的 `optimize-css-assets-webpack-plugin` 也对不上，不同 CLI 版本用的 CSS 压缩插件不完全一样，你本地实际用的是哪个，以 `vue inspect plugins` 的输出为准。

注释里那句 `/* config.plugin('xxx') */` 是重点，那就是 `chainWebpack` 里定位插件要用的名字。想删掉 preload 插件，`config.plugins.delete('preload')` 一行就够了。

这份清单本身也有几处随时代变了。`vue-loader/lib/plugin` 是 vue-loader 15 的引入路径，配 Vue 3 的 vue-loader 16 及以上直接从 `vue-loader` 主入口导出 `VueLoaderPlugin`。`HashedModuleIdsPlugin` 在 webpack 5 里被移除了，等价能力内置成了 `optimization.moduleIds: 'deterministic'`。真要照着改配置，还是以你项目里 webpack 的实际版本为准。

## 六、Vue CLI 之后，现在该用什么

这篇写的是 2019 年的 Vue CLI 3。到今天，情况变了：Vue CLI 官方已经把它置为维护状态，新项目官方推荐的脚手架是 `create-vue`，底层跑的是 Vite 而不是 webpack。Vue 2 本身的官方维护也已经停止。

不是说 CLI 3 这套东西不能用了，存量项目该跑还是跑得好好的。但如果你现在从零开一个项目，用 `npm create vue@latest` 起会顺手得多，开发环境冷启动是秒级的，热更新也几乎没有等待。

从 `vue.config.js` 迁到 `vite.config.js`，上面讲的几项大致能对上：

| Vue CLI | Vite | 说明 |
|---------|------|------|
| `publicPath` | `base` | 部署基础路径 |
| `outputDir` | `build.outDir` | 产物输出目录 |
| `productionSourceMap` | `build.sourcemap` | 生产 source map |
| `devServer.proxy` | `server.proxy` | 开发代理 |
| `devServer.port` | `server.port` | 端口 |
| `chainWebpack` / `configureWebpack` | Vite 插件 / Rollup 配置 | 概念不对等，需要重写 |

前五项基本是改个名字的事，最后一行是真正的迁移成本所在。webpack 的 loader 生态和 Vite 的插件生态不通用，自定义构建逻辑得按 Vite 插件的写法重来一遍。项目里 loader 改得越多，迁移越贵。具体字段以 Vite 官方文档为准，它更新得比较快。

## 总结

回到开头那个「配置文件去哪了」的疑问。CLI 3 把整套 webpack 配置封进了 `@vue/cli-service`，换来的是升级成本从每个项目各改一遍降到改一个依赖版本，代价是你必须通过 `vue.config.js` 这个受限入口去改，而改之前得先用 `vue inspect` 搞清楚内部结构长什么样。

几条实操结论：`baseUrl` 已经改名 `publicPath`，值写成前后带斜杠的形式；`productionSourceMap` 在今天默认应该关掉，map 单独传给监控平台；往上叠东西用 `configureWebpack`，动内部规则用 `chainWebpack`，后者的字符串名字全部来自 `vue inspect` 的输出；`devServer.proxy` 配 `changeOrigin: true`，`host` 设 `0.0.0.0` 才能局域网调试。

最后是选型。Vue CLI 已进入维护状态，社区主流是 Vite，新项目直接用 `create-vue` 起。老项目不必为了迁而迁，但要清楚 CLI 不会再有大的功能更新了，这一点在做技术规划时得算进去。

## 参考

- [Vue CLI 官方文档 - 配置参考](https://cli.vuejs.org/zh/config/)
- [Vue CLI 官方文档 - webpack 相关配置](https://cli.vuejs.org/zh/guide/webpack.html)
- [webpack-chain - GitHub](https://github.com/neutrinojs/webpack-chain)
- [webpack 官方文档 - DevServer](https://webpack.js.org/configuration/dev-server/)
- [Vite 官方文档 - 配置](https://cn.vitejs.dev/config/)
- [create-vue - GitHub](https://github.com/vuejs/create-vue)
- [前端进阶之旅](https://interview.poetries.top)
