---
title: dll 预编译提高 webpack 打包速度，以及它现在的替代方案
date: 2018-11-23 11:10:21
description: 讲清 DllPlugin 的原理和三步接入方法，为什么改一行业务代码 vendor 的 hash 也会变，配合 happypack 多线程打包，并给出 webpack 5 用持久化缓存替代 dll 的迁移写法。
tags: 
   - webpack
   - dll
   - 构建优化
   - 打包速度
categories: Front-End
---

一个上了 antd、react 全家桶、moment、lodash 的中台项目，改一行业务代码，`npm run build` 要跑一分多钟。看构建日志会发现，绝大部分时间花在了那些一个月都不会动一次的第三方库上，每次都要重新解析、转译、压缩一遍。

DllPlugin 要解决的就是这件事：把第三方库提前单独打一次包，之后的每次构建直接引用现成的产物，跳过整个编译过程。这篇把原理、三步接入、踩过的坑讲一遍，最后说清楚 webpack 5 上为什么不再推荐这套做法，以及该换成什么。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 为什么 `CommonsChunkPlugin` 分了 vendor，改业务代码 vendor 的 hash 还是会变
- dll 的思路是从哪来的，`manifest.json` 里存的到底是什么
- 三步接入 DllPlugin 和 DllReferencePlugin，以及每一步的坑
- happypack 多线程打包怎么配，什么时候是负优化
- webpack 5 用 `cache: { type: 'filesystem' }` 替代 dll 的完整写法和迁移思路

## 一、webpack 的 dll 功能

下面这套配置基于 `webpack3` 构建，webpack 4 上写法基本一致，webpack 5 的情况放在最后单独讲。

### 1.1 dll 介绍

我们构建前端项目的时候，往往希望第三方库（`vendors`）和自己写的代码可以分开打包，因为第三方库往往不需要经常打包更新。对此 `Webpack` 的文档建议用 `CommonsChunkPlugin` 来单独打包第三方库。

这里要先分清两件事，很多人一开始会混。

我们这里的 `dll.js` 是提前打包好了的，而不是在每次 `build` 的时候去打包输出的，这样才能做到依赖包一次构建、无限次使用。另外，`webpack` 输出的文件名都带有 `hash` 值，而用 `dll` 构建后输出的文件名是固定的。

先看 `CommonsChunkPlugin` 那种做法长什么样：

```js
entry: {
  vendor: ["jquery", "other-lib"],
  app: "./entry"
}
new CommonsChunkPlugin({
  name: "vendor",

  // filename: "vendor.js"
  // (Give the chunk a different name)

  minChunks: Infinity,
  // (with more entries, this ensures that no other module
  //  goes into the vendor chunk)
})
```

这份配置确实把第三方库单独拆成了一个 `vendor` chunk，看起来目的达到了。但它有个致命问题。

通常为了对抗缓存，我们会给输出文件的文件名中加入 `hash` 后缀。问题就出在这里，我们编辑了 `app` 部分的代码后重新打包，会发现 `vendor` 的 `hash` 也跟着变了。

![改动 app 代码后 vendor 的 hash 也跟着变化](https://s.poetries.top/gitee/2019/10/639.png)

这么一来，每次发布版本的时候 vendor 代码都要刷新，即使我并没有修改其中的代码。这样并不符合我们分开打包的初衷。

那为什么改业务代码会让 vendor 改名呢？两个原因叠在一起。一是 `[hash]` 是整次构建的哈希，只要有任何文件变了，所有产物一起改名，得换成 `[chunkhash]` 才是按 chunk 内容算；二是 webpack 的运行时代码里存着模块 id 到 chunk 的映射表，业务代码一变这张表就变，而这段 runtime 默认是塞在 vendor 里的。所以就算换了 `[chunkhash]`，不把 runtime 单独提出去，vendor 照样会变。

dll 走的是另一条路，它干脆让 vendor 不参与每次构建。

`Dll` 这个概念应该是借鉴了 `Windows` 系统的 `dll`。一个 `dll` 包，就是一个纯纯的依赖库，它本身不能运行，是用来给你的 `app` 引用的。打包 `dll` 的时候，`Webpack` 会将所有包含的库做一个索引，写在一个 `manifest` 文件中，而引用 `dll` 的代码（`dll user`）在打包的时候，只需要读取这个 `manifest` 文件就可以了。

**优势**

- `Dll` 打包以后是独立存在的，只要其包含的库没有增减、升级，`hash` 也不会变化，因此线上的 `dll` 代码不需要随着版本发布频繁更新
- `App` 部分代码修改后，只需要编译 `app` 部分的代码，`dll` 部分，只要包含的库没有增减、升级，就不需要重新打包。这样也大大提高了每次编译的速度
- 假设你有多个项目，使用了相同的一些依赖库，它们就可以共用一个 `dll`

第三条在多项目的团队里特别香。几个中台系统用同一套技术栈，dll 打一份放 CDN，所有项目共用，用户从第二个系统开始就是直接命中缓存。

### 1.2 dll 使用

整个流程分三步，先建一个 dll 的配置文件（`entry` 只包含第三方库），再加一条构建命令，最后在业务配置里把 dll 关联进来。

**第一步：新建 webpack.dll.conf.js**

`webpack.DllPlugin` 的选项中，`path` 是 `manifest` 文件的输出路径，`name` 是 `dll` 暴露的对象名，要跟 `output.library` 保持一致。这两个对不上的话，运行时会直接抛 undefined，而且报错信息完全看不出原因，这个坑我踩过。

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
    path: path.resolve(__dirname, "../dist/static/js"),
    filename: '[name].dll.js',
    library: '[name]_library'
  },
  plugins: [
    new webpack.DllPlugin({
      path: path.join(__dirname, '../dist/static/js/[name].manifest.json'),
      name: '[name]_library'
    }),
    new webpack.optimize.UglifyJsPlugin()
  ]
}
```

这里说明一下，我原来的笔记在 `plugins` 里写的是 `DllReferencePlugin` 加一段 `Object.keys(['react','ui','others']).map(...)`，那是错的。`DllReferencePlugin` 是给业务配置用的，dll 配置里该用 `DllPlugin`；而 `Object.keys` 作用在数组上返回的是 `['0','1','2']` 这样的下标，不是包名。上面已经改成正确写法了。

`entry` 按「更新频率」分组是个好习惯。React 全家桶、UI 库、工具库各一组，某个库升级时只需要重打对应那一组，不用全量重来。

**第二步：加一个命令**

```js
// package.json
"scripts": {
  "dll": "webpack --config config/webpack.dll.conf.js"
}
```

执行 `npm run dll`。

运行 `Webpack` 之后会输出两类文件，一类是打包好的 `[name].dll.js`，一类是对应的 `manifest.json`，长这样：

```js
{
  "name": "vendor_ac51ba426d4f259b8b18",
  "content": {
    "./node_modules/antd/dist/antd.js": 1,
    "./node_modules/react/react.js": 2,
    "./node_modules/react/lib/React.js": 3,
    "./node_modules/react/node_modules/object-assign/index.js": 4,
    "./node_modules/react/lib/ReactChildren.js": 5,
    "./node_modules/react/lib/PooledClass.js": 6,
    "./node_modules/react/lib/reactProdInvariant.js": 7,
    "./node_modules/fbjs/lib/invariant.js": 8,
    "./node_modules/react/lib/ReactElement.js": 9,
    
    ............
```

`Webpack` 将每个库都进行了编号索引，之后的 `dll user` 可以读取这个文件，直接用 `id` 来引用。

![manifest.json 里记录的模块路径与 id 索引](https://s.poetries.top/gitee/2019/10/640.png)

理解这张表是理解 dll 的关键。业务代码构建时遇到 `import React from 'react'`，webpack 会先去 manifest 里查这个路径在不在，在的话就不再解析这个模块，直接生成一句「去全局变量 `react_library` 里取 id 为 2 的那个模块」。整个解析、转译、压缩的过程都跳过了，省下来的就是这部分时间。

**第三步：在 plugins 中增加配置**

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

有几个 dll 分组就 new 几个 `DllReferencePlugin`，一个都不能漏，漏了那一组就会被重新编译进业务包。

还有一步文章里容易漏掉：dll 产出的 `[name].dll.js` 不会自动出现在页面上，得自己在 HTML 里用 `<script>` 引入，而且要排在业务脚本前面。用了 `html-webpack-plugin` 的话，可以配合 `add-asset-html-webpack-plugin` 自动注入。忘了这一步的表现是构建成功但页面一片空白，控制台报某个全局变量 undefined。

再次执行 `npm run build`。

之前

![接入 dll 之前的构建耗时](https://s.poetries.top/gitee/2019/10/641.png)

之后

![接入 dll 之后的构建耗时明显下降](https://s.poetries.top/gitee/2019/10/642.png)

时间降下来了，降幅取决于你的第三方依赖有多重，依赖越重收益越大。

用之前有几件事要想清楚。dll 配置和业务配置的 webpack 版本、babel 配置得对齐，两边不一致会打出跑不起来的产物。依赖升级之后必须重跑 `npm run dll`，忘了的话会出现「明明装了新版本，跑的还是旧代码」这种玄学问题，我为这个排查了一下午。另外 dll 里的库不参与业务侧的 Tree shaking，你打进去多少就是多少，所以 `entry` 里不要图省事把整个 `package.json` 的依赖倒进去。

## 二、happypack 多线程打包

一般情况下，js 是单线程执行的，但 `node` 不是。利用 `node` 提供的多线程环境，`happypack` 是可以多线程打包的。基本上打开官网看了一下 readme 就可以配置了，特别是我只针对 js 的编译进行优化，配置还是比较简单的。

包地址在 https://www.npmjs.com/package/happypack 。

`happyPack` 把所有串行的东西并行处理，使得 `loader` 并行处理，减少文件处理时间。

它和 dll 打的是不同的位置。dll 省的是「第三方库不用再编译」，happypack 省的是「自己的代码编译得更快」，两个可以叠加用。

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

这时的编译时间也减小了一些。

![接入 happypack 之后的构建耗时](https://s.poetries.top/gitee/2019/10/643.png)

用它有个前提要先想清楚，进程间通信本身是有开销的。文件数量少的小项目开了反而更慢，这类并行化手段几乎都有这个门槛。我的经验是文件数上千再考虑，几百个文件的项目提升很有限。

另外 `happypack` 的作者已经不再维护它了，README 里明确建议改用 `thread-loader`。写法更简单，把它放在耗时 loader 前面就行：

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

更多分析打包结果的方法可以看 [webpack 打包结果依赖分析](https://feinterview.poetries.top/blog/webpack-bundleAnalyzer)，webpack 的配置项全景在 [webpack 回顾篇](https://feinterview.poetries.top/blog/webpack-review)。

## 三、webpack 5 之后，dll 该换成什么

这一节是这篇现在最该看的部分。

webpack 5 带来了持久化缓存，一般就不再用 DllPlugin 了。开启只需要一段配置：

```javascript
const path = require('path')

module.exports = {
  cache: {
    type: 'filesystem',
    // 缓存落盘位置，默认在 node_modules/.cache/webpack
    cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
    // 这些文件变了就整个缓存作废
    buildDependencies: {
      config: [__filename]
    }
  }
}
```

它比 dll 好在三个地方。

覆盖范围更大。dll 只能加速第三方库，持久化缓存把整个构建过程的中间结果都落到磁盘，业务代码的转译结果同样能复用，二次构建整体跳过。

不用手工维护清单。dll 要你自己列出哪些包进 dll，加了新依赖要记得改配置、重跑命令。持久化缓存不需要，它按文件内容哈希自动判断哪些能复用。

不会打出不一致的产物。dll 那套双配置最容易出的问题就是两边 babel 配置不同步，持久化缓存没有这个问题，因为它就是同一次构建的缓存。

`buildDependencies` 这一项是最容易漏配的，它声明「哪些文件变了就整个缓存作废」，通常填 webpack 配置本身、`.babelrc`、`postcss.config.js` 这些。不配的话，你改了 babel 的 preset，构建却还在用旧规则的缓存产物，然后开始怀疑人生。

从 dll 迁到持久化缓存的步骤也简单：删掉 `webpack.dll.conf.js` 和那条 `dll` 命令，删掉所有 `DllReferencePlugin`，删掉 HTML 里手动引入的 dll 脚本，加上上面那段 `cache` 配置，最后确认 `.gitignore` 里有缓存目录。

那 dll 是不是彻底没用了？也不完全。多个项目共享同一份第三方库产物、需要把 vendor 长期挂在 CDN 上这类场景，dll 仍然有它的位置，只是这种需求现在更多会用 Module Federation 来做，那是 webpack 5 提供的另一套能力，能让多个独立构建的应用在运行时共享依赖。

webpack 5 那一侧完整的构建性能配置我单独写过一篇，[Webpack 5 构建性能优化实战](https://feinterview.poetries.top/blog/webpack-5-build-optimization)，缓存、Tree shaking、分包、并行构建都在里面。webpack 4 升级到 5 的变更点在 [webpack4 升级篇](https://feinterview.poetries.top/blog/webpack4-update)。

## 总结

回到最开始那个问题，为什么分了 vendor 还是每次都要重新下载。答案是 `[hash]` 用错了、runtime 没提出来，dll 则是从根上绕开了这件事，让 vendor 压根不参与构建。

DllPlugin 的三步很好记：dll 配置里用 `DllPlugin` 产出 `dll.js` 和 `manifest.json`，业务配置里用 `DllReferencePlugin` 读 manifest，HTML 里把 dll 脚本引进去。三步里最容易漏的是第三步，最容易出错的是 `output.library` 和 `DllPlugin.name` 对不上。

happypack 和 dll 打在不同位置，可以叠加，但它对小项目是负优化，而且已经不维护了，用 `thread-loader` 替代。

如果你现在开的是新项目，直接上 webpack 5 的 `cache: { type: 'filesystem' }`，别再折腾 dll 了。存量项目要不要迁，看你的 webpack 版本，能升到 5 就顺手把 dll 那套删掉，配置能少一大截。

## 参考

- [webpack DllPlugin](https://webpack.js.org/plugins/dll-plugin/)
- [webpack 5 持久化缓存配置](https://webpack.js.org/configuration/cache/)
- [webpack 5 迁移指南](https://webpack.js.org/migrate/5/)
- [thread-loader](https://webpack.js.org/loaders/thread-loader/)
- [Webpack 打包优化之体积篇](https://www.jeffjade.com/2017/08/06/124-webpack-packge-optimization-for-volume/)
- [Webpack 打包优化之速度篇](https://www.jeffjade.com/2017/08/12/125-webpack-package-optimization-for-speed/)
- [预打包Dll，实现webpack音速编译](https://segmentfault.com/a/1190000007104372)
- [利用DllPlugin分割你的第三方库](https://juejin.im/post/5a4f031b518825733e6040c0)
- [提高webpack的打包速度：happypack和dll打包](https://github.com/p2227/p2227.github.io/issues/21)
- [前端进阶之旅](https://interview.poetries.top)
