---
title: webpack 打包结果依赖分析，找出产物里的体积大头
date: 2018-11-20 17:40:08
description: 用 webpack-bundle-analyzer 把打包结果画成可视化矩形树图，讲清 stat / parsed / gzip 三种体积口径、常见的体积黑洞和对应改法，以及官方在线分析工具的用法。
tags: 
   - webpack
   - 优化
   - 打包分析
   - 性能优化
categories: Front-End
---

产物 3MB，首屏白屏两秒多，领导问你「大在哪」。这时候如果只能回答「可能是第三方库比较多」，那基本没法往下推。构建优化和性能优化都一样，先量清楚，再动手，凭感觉加插件多半是白忙。

这篇讲怎么把 webpack 的打包结果画成一张能点进去的图，谁占了多少一目了然。工具就一个 `webpack-bundle-analyzer`，配置十行以内，但真正值钱的是怎么读这张图，以及看完之后该改什么。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `stat`、`parsed`、`gzip` 三种体积口径的区别，以及该盯哪一个
- `webpack-bundle-analyzer` 的安装、按需启用和各配置项的含义
- 这张矩形树图怎么读，常见的几个体积黑洞长什么样
- 插件的原理，它的数据是从哪来的
- 官方在线分析工具 `webpack/analyse` 的用法和适用场景
- 看完图之后可以落地的几种改法

## 一、先弄清楚三种体积口径

打开报告你会看到右上角有个下拉框，三个选项 `stat`、`parsed`、`gzip`。很多人第一次看会被数字吓一跳，其实是口径没选对。

`stat` 是模块的原始体积，也就是 webpack 从磁盘读进来那份源码的大小，没经过任何处理。这个数一般最大，参考价值最低。

`parsed` 是经过 loader 转译、Tree shaking、压缩之后，真正写进产物文件的体积。这才是用户下载的那份 JS 的大小，也是日常最该盯的那个。

`gzip` 是 `parsed` 再过一遍 gzip 压缩的结果。如果你的服务器或者 CDN 开了 gzip（大多数都开了），用户实际消耗的流量是这个数。JS 文本的 gzip 压缩率通常在三分之一左右，所以这个数会比 `parsed` 小不少。

先说结论，日常排查看 `parsed`，跟别人汇报或者定优化目标用 `gzip`。看 `stat` 唯一的用处是判断某个库有没有被 Tree shaking 摇掉，`stat` 大但 `parsed` 小，说明摇掉了。

## 二、使用 webpack-bundle-analyzer 插件分析

### 2.1 安装插件

包地址在 https://www.npmjs.com/package/webpack-bundle-analyzer 。

```bash
npm install webpack-bundle-analyzer --save-dev
```

它是个开发依赖，装到 `devDependencies` 就够了，不要装进 `dependencies`。

### 2.2 按环境变量开关，不要常驻

这个插件每次构建都要跑一遍统计并起一个服务，日常构建根本不需要。所以正确的接法是按需开启，靠一个环境变量控制。

先在 `package.json` 里加一条命令，传入环境变量 `ANALYZE`，配置里再用 `process.env.ANALYZE` 去读：

```json
"scripts": {
  "build": "node scripts/build.js",
  "analyze": "cross-env ANALYZE=1 npm run build"
}
```

用 `cross-env` 是为了兼容 Windows。直接写 `ANALYZE=1 npm run build` 在 Windows 的 cmd 下是跑不通的，团队里有人用 Windows 就一定会踩这个。

然后在 `build/webpack.prod.config.js` 的 `plugins` 后面加上判断：

```js
plugins.concat(process.env.ANALYZE?[
    new BundleAnalyzerPlugin({
    //  可以是`server`，`static`或`disabled`。
    //  在`server`模式下，分析器将启动HTTP服务器来显示软件包报告。
    //  在`static`模式下，会生成带有报告的单个HTML文件。
    //  在`disabled`模式下，你可以使用这个插件来将`generateStatsFile`设置为`true`来生成Webpack Stats JSON文件。
    analyzerMode: 'server',
    //  将在`server`模式下使用的主机启动HTTP服务器。
    analyzerHost: '127.0.0.1',
    //  将在`server`模式下使用的端口启动HTTP服务器。
    analyzerPort: 8888,
    //  路径捆绑，将在`static`模式下生成的报告文件。
    //  相对于捆绑输出目录。
    reportFilename: 'report.html',
    //  模块大小默认显示在报告中。
    //  应该是`stat`，`parsed`或者`gzip`中的一个。
    //  有关更多信息，请参见「定义」一节。
    defaultSizes: 'parsed',
    //  在默认浏览器中自动打开报告
    openAnalyzer: true,
    //  如果为true，则Webpack Stats JSON文件将在bundle输出目录中生成
    generateStatsFile: false,
    //  如果`generateStatsFile`为`true`，将会生成Webpack Stats JSON文件的名字。
    //  相对于捆绑输出目录。
    statsFilename: 'stats.json',
    //  stats.toJson() 方法的选项。
    //  例如，您可以使用 source: false 选项排除统计文件中模块的来源。
    //  在这里查看更多选项：https://github.com/webpack/webpack/blob/webpack-1/lib/Stats.js#L21
    statsOptions: null,
    logLevel: 'info' // 日志级别。可以是'info'，'warn'，'error'或'silent'。
  	})
  ]:[])
```

配置项里真正要挑的只有 `analyzerMode` 这一个。

`server` 模式会起一个本地服务，浏览器里能交互，适合本地排查。`static` 模式生成一个单独的 `report.html`，适合在 CI 里跑完之后当产物存下来，或者发给同事看。`disabled` 配合 `generateStatsFile: true` 只吐一份 `stats.json`，不出界面，适合接自己的分析脚本或者做体积门禁。

`defaultSizes: 'parsed'` 建议保留，理由上一节说过了。

### 2.3 启动

```bash
npm run analyze
```

在对应地址后面加上端口 `8888`，就能得到一个可视化的模块体积界面。

![webpack-bundle-analyzer 生成的模块体积矩形树图](https://s.poetries.top/gitee/2019/10/636.png)

图里每个矩形代表一个模块或者一个目录，面积和体积成正比，可以一层层点进去。鼠标悬停会同时显示三种口径的数值。

## 三、这张图该怎么读

图打开了不代表问题就找到了。我一般按这个顺序看。

先看最外层有几个大块，确认分包策略生不生效。如果整张图就是一个巨大的 `main.js`，说明 `splitChunks` 压根没配或者没起作用，那这一步就该先去补分包，别急着抠单个库。

然后找面积最大的那几个 `node_modules` 子块。这里最常见的几个坑，几乎每个项目都能撞上一两个。

`moment` 是重灾区。它默认会把全部 locale 语言包打进去，一个几十 KB 的库能撑到两百多 KB，而你大概率只用中文。解决办法是用 `IgnorePlugin` 把 locale 目录忽略掉，或者干脆换成 `day.js`，API 基本兼容而体积只有几 KB。

`lodash` 整包引入是第二常见的。写 `import _ from 'lodash'` 会把整个库打进来，改成 `import debounce from 'lodash/debounce'` 或者上 `babel-plugin-lodash` 就能只留用到的那几个函数。

组件库没走按需加载排第三。`antd`、`element-ui` 这类库整包引入动辄几百 KB，配上对应的按需引入插件之后通常能砍掉一大半。

还有一类比较隐蔽，同一个库出现了两个不同版本。图里会看到两个同名的块分别躺在不同的路径下，通常是某个依赖锁定了旧版本导致的。`npm ls <包名>` 能看出依赖树里谁引了哪个版本，用 `resolutions` 或者升级依赖去收敛。

最后看一眼有没有本该异步加载的东西被打进了首屏包。富文本编辑器、图表库、Excel 导出这类只在特定页面用的东西，出现在初始 chunk 里就说明按需加载没生效，多半是 `import()` 写成了静态 `import`。

我自己的感受是，第一次跑这个工具基本都能找出至少两处可以砍的地方，而且改起来都不难。真正难的是坚持每次发版前跑一遍，不然过两个月又会长回去。

## 四、插件的原理

这个插件的做法其实不复杂。webpack 构建结束时会产出一份 `stats` 对象，里面记录了每个 chunk 包含哪些模块、每个模块多大、依赖关系是什么。插件从 `stats.json` 里取出 `chunks` 数据，算好每个模块的三种体积，最后用 `Canvas` 把矩形树图画出来。具体代码在 `analyzer.js` 的 `getViewerData` 方法里。

知道这一点有个实际好处，`stats.json` 是标准产物，你可以自己写脚本读它，做一些插件没提供的事，比如在 CI 里比对两次构建的体积差异，超过阈值就让流水线失败。

## 五、使用官方提供的在线工具

除了插件，webpack 官方还提供了一个在线分析页面。先生成一份 stats 文件：

```bash
webpack --profile --json > stats.json
```

然后把这份 `stats.json` 上传到 http://webpack.github.io/analyse 就能看到分析结果。

![webpack 官方在线分析工具的界面](https://s.poetries.top/gitee/2019/10/637.png)

顺带说一句，原文这条命令里的 `--proile` 是个笔误，正确写法是 `--profile`。

这个在线工具和 `webpack-bundle-analyzer` 的侧重点不同。analyzer 强在体积，一眼看出谁大；官方这个强在结构，能看到模块之间的依赖关系、chunk 的父子关系、警告和错误的详细信息。想搞清楚「这个模块到底是被谁引进来的」，用它更合适。

它的缺点也很明显，界面比较老，大项目的 `stats.json` 动辄几十 MB，上传和渲染都慢。而且 stats 文件里包含你的模块路径信息，公司项目往上传之前想清楚。这块我自己用得不多，多数时候 analyzer 就够了。

## 六、看完图之后可以做什么

分析只是第一步，落地的改法大致分三类。

第一类是换或者裁。`moment` 换 `day.js`，`lodash` 改按需，组件库配按需引入插件，`IgnorePlugin` 干掉用不上的语言包目录。这类改动收益最直接，风险也最低。

第二类是拆。用 `optimization.splitChunks` 把第三方库和业务代码分开，把超稳定的核心库（React 这类）再单独分一组，配合 `[contenthash]` 做长期缓存。首屏用不到的路由和重组件改成 `import()` 动态加载。这部分的完整配置我写在 [Webpack 5 构建性能优化实战](https://feinterview.poetries.top/blog/webpack-5-build-optimization) 里了。

第三类是压。生产构建确认开了压缩（webpack 4 之后 `mode: 'production'` 默认就开），服务端或 CDN 打开 gzip 或者 brotli。这一步通常已经做了，但值得确认一遍，我见过配置里手动关掉了 `minimize` 却没人发现的情况。

顺带提一下时效性。这篇写的时候基线是 webpack 3 / 4，`webpack-bundle-analyzer` 到现在还在维护，webpack 5 上照样用，配置项也基本没变。变化的是周边：`webpack --profile --json` 在 webpack 5 里推荐写成 `webpack --json=stats.json`，`--profile` 现在主要用来输出各阶段耗时。另外 webpack 5 内置了更好用的 `stats` 配置，以及 `performance.hints` 可以在产物超过阈值时直接报警，做体积门禁比自己写脚本省事。

## 总结

分析产物这件事，工具本身十分钟就能配完，难的是养成习惯和会读图。

三种体积口径先分清楚，日常盯 `parsed`，对外说 `gzip`。插件一定要用环境变量控制开关，别让它常驻在每次构建里。读图按「先看分包生不生效，再找最大的几个 node_modules 块，最后确认有没有该异步的东西被打进首屏」这个顺序走。

`moment` 的 locale、`lodash` 整包、组件库没按需、同一个库多版本，这四个是最高频的体积黑洞，第一次跑基本都能中一两个。

想看更多插件的用法，可以翻 [webpack 常用插件总结](https://feinterview.poetries.top/blog/webpack-config-optize)；构建速度那一侧的优化手段在 [dll 预编译提高 webpack 打包速度](https://feinterview.poetries.top/blog/webpack-dll)；配置项的全景梳理在 [webpack 回顾篇](https://feinterview.poetries.top/blog/webpack-review)。

## 参考

- [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)
- [webpack 官方在线分析工具](http://webpack.github.io/analyse)
- [webpack Stats 配置](https://webpack.js.org/configuration/stats/)
- [webpack 代码分离指南](https://webpack.js.org/guides/code-splitting/)
- [day.js](https://day.js.org/)
- [前端进阶之旅](https://interview.poetries.top)
