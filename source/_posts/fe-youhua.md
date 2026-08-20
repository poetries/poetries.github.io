---
title: 前端页面性能优化实战，从测量到加载渲染全链路调优
date: 2021-02-08 10:50:03
description: 前端性能优化的完整路径，先用 Network、Lighthouse、Performance 和 Performance API 把问题量化，再逐条落地压缩、构建拆包、骨架屏、虚拟列表、缓存、预加载与懒加载。
tags:
- 性能优化
- 前端性能
- Lighthouse
- webpack
- 懒加载
- 缓存
categories: Front-End
---

页面慢这件事最难受的地方，不是不知道怎么优化，是不知道该优化哪儿。有人上来就压图片，有人先去拆包，忙活一通首屏时间纹丝不动。我自己也走过这段弯路，后来才想明白，性能优化的第一步从来不是动手改代码，是先把「慢在哪一毫秒」量出来。

这篇按这个顺序展开：先把测量工具和 Web API 讲清楚，让你能拿到数字；再按加载、渲染、缓存三条线逐条给可落地的手段，压缩、拆包、骨架屏、虚拟列表、预加载懒加载都在里面。每一条都说清它在解决哪个指标，以及什么场景下用了也白用。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Network、Lighthouse、Performance、WebPageTest 各自适合看什么
- 用 Performance API 自己算白屏、TTI、DNS 这些指标
- 雅虎军规里今天还真正管用的那几条
- Gzip、服务端压缩、JS/CSS/HTML 压缩、HTTP/2 首部压缩的实际收益
- webpack 侧的 DllPlugin 与 splitChunks 拆包
- 骨架屏、虚拟列表、白屏 loading 这类体验优化的原理
- HTTP 缓存四件套和 Service Worker
- preload、prefetch 和图片、路由懒加载的正确用法

## 一、先把问题量出来，四类调试工具

工欲善其事必先利其器。这一节的工具不用全学，但至少要知道各自看什么。

### 1.1 Network

![Chrome DevTools Network 面板总览](https://blog.poetries.top/img/static/images/image-20210208102537169.png)

Network 面板能看到资源加载详情，用来初步评估影响页面性能的因素。鼠标右键可以自定义列，页面底部是当前加载资源的一个概览。里面有两个数字要先认准：`DOMContentLoaded` 是 DOM 渲染完成的时间，`Load` 是当前页面所有资源加载完成的时间。

先想一个问题，怎么判断哪些资源对当前页面加载是无用的？

答案不在这个面板里。按 `shift + cmd + P` 调出命令面板，输入 Coverage 打开覆盖率工具，它会告诉你每个 JS 和 CSS 文件里有多少字节是本次访问根本没执行到的：

![DevTools 命令面板与扩展工具](https://blog.poetries.top/img/static/images/image-20210208102549961.png)

同一个命令面板里还能调出 Performance monitor，实时看 DOM 节点数、JS 堆大小、每秒布局次数的变化：

![Performance monitor 实时监控页面性能](https://blog.poetries.top/img/static/images/image-20210208102650825.png)

DOM 节点数持续上涨而不回落，基本可以断定有泄漏，这个指标比内存曲线更直观。

#### 瀑布流 waterfall

单条请求点开的这个时间条，是排查慢请求最重要的信息：

![Network 瀑布流各阶段耗时拆解](https://blog.poetries.top/img/static/images/image-20210208102723253.png)

- `Queueing` 浏览器将资源放入队列的时间
- `Stalled` 因放入队列时间而发生的停滞时间
- `DNS Lookup` DNS 解析时间
- `Initial connection` 建立 HTTP 连接的时间
- `SSL` 浏览器与服务器建立安全性连接的时间
- `TTFB` 等待服务端返回数据的时间
- `Content Download` 浏览器下载资源的时间

这七段的意义在于它能直接告诉你锅在哪边。`TTFB` 长是后端慢或者网络链路远，`Content Download` 长是资源太大，`Queueing` 和 `Stalled` 长通常是同域名并发请求数打满了。三种情况的解法完全不同，光看一个总耗时是分不出来的。

### 1.2 Lighthouse

![Lighthouse 性能评分报告](https://blog.poetries.top/img/static/images/image-20210208102851752.png)

Lighthouse 会根据 Chrome 的一套策略自动对网站做质量评估，并给出优化建议。几个核心指标：

- `First Contentful Paint` 首屏渲染时间，1s 以内是绿色
- `Speed Index` 速度指数，4s 以内是绿色
- `Time to Interactive` 到页面可交互的时间

它最大的价值是把「感觉有点慢」变成一个可以拿去开会的分数，而且给的建议基本都能直接照着做。缺点是本地跑分受你自己的机器和网络影响很大，同一个页面开着一堆标签页跑和干净环境跑能差二十分，看趋势别看绝对值。

### 1.3 Performance

![Performance 面板的火焰图分析](https://blog.poetries.top/img/static/images/image-20210208102949596.png)

Performance 是对网站最专业的分析面板，能看到每一帧里 JS 执行、样式计算、布局、绘制各花了多久。前面两个工具告诉你有问题，这个告诉你问题具体在哪一行代码。

学会读火焰图之后，很多玄学问题会立刻变得具体。渲染链路这块我在 [浏览器渲染路径与性能优化](https://feinterview.poetries.top/blog/render-path-optimize) 里单独展开过，可以配着看。

### 1.4 WebPageTest

WebPageTest 可以模拟不同场景下的访问情况，比如不同浏览器、不同国家、不同网速，在线测试地址是 [webPageTest](https://www.webpagetest.org/)。

![WebPageTest 测试结果概览](https://blog.poetries.top/img/static/images/image-20210208103032419.png)

![WebPageTest 逐帧加载视图](https://blog.poetries.top/img/static/images/image-20210208103054016.png)

它比本地 Lighthouse 强的地方是节点在全球各地，能真实反映海外用户或者弱网用户看到的样子。做出海业务的话这个工具比什么都实在。

### 1.5 打包体积分析

前面几个看的是运行时，这个看的是产物。

`webpack-bundle-analyzer` 会把打包结果画成一张矩形树图，哪个包占地大一目了然：

![webpack-bundle-analyzer 体积树图](https://blog.poetries.top/img/static/images/image-20210208103127992.png)

安装和配置：

```
npm install --save-dev webpack-bundle-analyzer
```

```js
// webpack.config.js 文件
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
module.exports={
  plugins: [
    new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerHost: '127.0.0.1',
          analyzerPort: 8889,
          reportFilename: 'report.html',
          defaultSizes: 'parsed',
          openAnalyzer: true,
          generateStatsFile: false,
          statsFilename: 'stats.json',
          statsOptions: null,
          logLevel: 'info'
        }),
  ]
}
```

再在 `package.json` 里加个入口：

```
"analyz": "NODE_ENV=production npm_config_report=true npm run build"
```

另一条路是开 source-map 配合 `source-map-explorer`，它的粒度更细，能看到某个第三方库里具体是哪几个文件占了体积。先在 `webpack.config.js` 里开 source-map：

```
module.exports = {
    mode: 'production',
    devtool: 'hidden-source-map',
}
```

`hidden-source-map` 会生成 map 文件但不在 bundle 末尾写引用注释，这样浏览器 DevTools 不会自动加载它，源码不至于泄漏出去，同时本地分析工具还能用。

然后配脚本：

```js
"analyze": "source-map-explorer 'build/*.js'",
```

跑 `npm run analyze` 出来的结果长这样：

![source-map-explorer 分析结果](https://blog.poetries.top/img/static/images/image-20210208103321371.png)

我一般是先用 `webpack-bundle-analyzer` 找大块，锁定某个库之后再用 `source-map-explorer` 看内部构成，判断是能 tree-shaking 掉还是得整个换掉。

## 二、用 Web API 自己采数据

工具面板只能看当下这一次访问。要做长期监控，得靠浏览器提供的这几个 API 自己上报。

### 2.1 监听视窗激活状态

![页面可见性变化的效果演示](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9b7ab11fc7b94fcf8c79bd3b28706b2c~tplv-k3u1fbpfcp-watermark.image)

用户切走标签页之后，页面里的定时器、轮询、动画其实都还在跑，白白烧电和流量。`visibilitychange` 就是用来管这件事的：

```js
// 窗口激活状态监听
let vEvent = 'visibilitychange';
if (document.webkitHidden != undefined) {
    vEvent = 'webkitvisibilitychange';
}

function visibilityChanged() {
    if (document.hidden || document.webkitHidden) {
        document.title = '客官，别走啊~'
        console.log("Web page is hidden.")
    } else {
        document.title = '客官，你又回来了呢~'
        console.log("Web page is visible.")
    }
}

document.addEventListener(vEvent, visibilityChanged, false);
```

这段里的 `webkitHidden` 是老 Safari 和老 Android 浏览器时代的前缀写法，现在主流浏览器全都支持无前缀的 `document.hidden` 和 `visibilitychange`，新项目直接用标准写法就够了，不用再做这层降级判断。

真正有价值的用法不是改标题逗用户，是在 `hidden` 时暂停轮询、停掉 `requestAnimationFrame`、断开 WebSocket，回到 `visible` 时再恢复。做直播或者行情类页面，这一下能省掉相当可观的资源。

### 2.2 观察长任务

主线程上超过 50ms 的任务就算长任务，它是页面卡顿、点击没反应的直接原因。`PerformanceObserver` 能把它们全捞出来：

```js
const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        console.log(entry)
    }
})

observer.observe({entryTypes: ['longtask']})
```

拿到 `entry` 之后上报到监控平台，就能知道线上用户实际卡在哪些操作上，比在本地反复复现靠谱得多。

### 2.3 监听网络变化

网络变化时给用户一个反馈，看直播的时候网络卡了平台会提醒你或者自动降清晰度，就是这套东西：

```js
var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
var type = connection.effectiveType;

function updateConnectionStatus() {
  console.log("Connection type changed from " + type + " to " + connection.effectiveType);
  type = connection.effectiveType;
}

connection.addEventListener('change', updateConnectionStatus);
```

这个我踩过一个坑，`navigator.connection` 的兼容性比看起来差，Safari 到现在都不支持，直接取 `connection.effectiveType` 会抛错。上生产一定要判空，别学上面这段直接往下写。

### 2.4 计算 DOMContentLoaded 时间

```js
window.addEventListener('DOMContentLoaded', (event) => {
    let timing = performance.getEntriesByType('navigation')[0];
    console.log(timing.domInteractive);
    console.log(timing.fetchStart);
    let diff = timing.domInteractive - timing.fetchStart;
    console.log("TTI: " + diff);
})
```

`performance.getEntriesByType('navigation')[0]` 拿到的是 Navigation Timing Level 2 的数据，比老的 `performance.timing` 更准，因为它的时间戳都是相对 `navigationStart` 的高精度值，不用自己做减法对齐。

### 2.5 更多计算规则

有了这份 timing 对象，常见指标基本都能自己算出来：

- `DNS` 解析耗时：`domainLookupEnd - domainLookupStart`
- `TCP` 连接耗时：`connectEnd - connectStart`
- `SSL` 安全连接耗时：`connectEnd - secureConnectionStart`
- 网络请求耗时（`TTFB`）：`responseStart - requestStart`
- 数据传输耗时：`responseEnd - responseStart`
- `DOM` 解析耗时：`domInteractive - responseEnd`
- 资源加载耗时：`loadEventStart - domContentLoadedEventEnd`
- `First Byte` 时间：`responseStart - domainLookupStart`
- 白屏时间：`responseEnd - fetchStart`
- 首次可交互时间：`domInteractive - fetchStart`
- `DOM Ready` 时间：`domContentLoadedEventEnd - fetchStart`
- 页面完全加载时间：`loadEventStart - fetchStart`
- `http` 头部大小：`transferSize - encodedBodySize`
- 重定向次数：`performance.navigation.redirectCount`
- 重定向耗时：`redirectEnd - redirectStart`

这里提醒一句，上面这些名字容易记混，`domContentLoadedEventEnd` 中间那个 `ed` 别丢，写成 `domContentLoadEventEnd` 取到的是 `undefined`，算出来的指标是 `NaN`，而且不会报错，很难发现。

另外 `secureConnectionStart` 在非 HTTPS 请求下是 0，直接拿 `connectEnd` 减它会得到一个巨大的数字，上报前要过滤掉。

## 三、雅虎军规里今天还管用的几条

![雅虎前端性能优化军规](https://blog.poetries.top/img/static/images/image-20210208103918197.png)

雅虎军规你知道多少条，平时真正用到的又有哪些？这套规则出得早，有些条目在 HTTP/2 普及之后已经不适用了，比如合并请求减少 HTTP 数量。但下面这两条到今天依然成立。

### 3.1 减少 cookie 传输

cookie 会跟着同域名下的每一个请求发出去，包括图片和 JS，这是纯粹的带宽浪费。两个做法：

减少 cookie 中存储的东西，别把用户配置、埋点参数这类大对象往里塞。以及静态资源换一个独立域名，不同域名不会主动带上主站的 cookie。很多大站的静态资源用单独的 CDN 域名，一半原因就在这儿。

### 3.2 避免过多的回流与重绘

这条是所有军规里我认为最值钱的一条，因为它造成的卡顿是持续的，用户能实时感觉到。

先看一段会连续触发回流的代码：

```js
  let cards = document.getElementsByClassName("MuiPaper-rounded");
  const update = (timestamp) => {
    for (let i = 0; i <cards.length; i++) {
      let top = cards[i].offsetTop;
      cards[i].style.width = ((Math.sin(cards[i].offsetTop + timestamp / 100 + 1) * 500) + 'px')
    }
    window.requestAnimationFrame(update)
  }
  update(1000);
```

问题出在循环里的读写交替。`offsetTop` 是读操作，浏览器为了给出准确值必须立刻做一次布局计算；紧接着 `style.width` 是写操作，把刚算好的布局又弄脏了。下一轮循环再读，又得重算一次。这叫强制同步布局，几十个元素就能把一帧的预算吃光。

效果非常明显的卡顿：

![强制同步布局导致的页面卡顿](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7618dea1a4774c8685e9926b08d67fdd~tplv-k3u1fbpfcp-watermark.image)

Performance 里的分析结果，`load` 事件之后存在大量回流，Chrome 直接给标了红色：

![Performance 中大量回流被标红](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9b543d68fab7445da1dedb72bb224f69~tplv-k3u1fbpfcp-watermark.image)

解法是把对 DOM 的读和写分离再各自合并，让浏览器在一帧里只做一次布局。`fastdom` 就是干这个的：

```js
let cards = document.getElementsByClassName("MuiPaper-rounded");
  const update = (timestamp) => {
    for (let i = 0; i < cards.length; i++) {
      fastdom.measure(() => {
        let top = cards[i].offsetTop;
        fastdom.mutate(() => {
          cards[i].style.width =
            Math.sin(top + timestamp / 100 + 1) * 500 + "px";
        });
      });
    }
    window.requestAnimationFrame(update)
  }
  update(1000);
```

`measure` 里放读、`mutate` 里放写，`fastdom` 会把所有 measure 排到一起先跑完，再统一跑 mutate。注意优化后的版本里用的是外层缓存下来的 `top` 变量，而不是重新读 `offsetTop`，这一点很关键，写回调里再去读就前功尽弃了。

优化后的效果：

![使用 fastdom 后帧率恢复正常](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1df5c32c30494c13b3402305f866b327~tplv-k3u1fbpfcp-watermark.image)

Performance 分析结果里，`load` 事件之后也没有那么多红色标记了。

感兴趣可以去看 [github fastdom](https://github.com/wilsonpage/fastdom)，在线预览 [fastdom demo](http://wilsonpage.github.io/fastdom/examples/animation.html)。

顺着这个思路再往下走一层，就是任务的拆分与调度。React Fiber 架构把渲染工作切成小块、在浏览器空闲时逐块执行，跟读写分离其实是同一类思想，都是在跟浏览器的一帧预算做配合。有兴趣可以去了解调度算法在 Fiber 里的实践。

## 四、压缩

### 4.1 Gzip

开启方式可以参考 [nginx 开启 gzip](https://juejin.cn/post/6844903605187641357)。

![开启 gzip 前后的体积对比](https://blog.poetries.top/img/static/images/image-20210208104535672.png)

Gzip 对文本类资源的压缩率相当可观，JS 和 CSS 普遍能压到三分之一以下。图片和视频这类已经压缩过的二进制格式就别开了，压不动还白白消耗 CPU。

还有一种方式是打包时直接生成 `.gz` 文件传到服务器，这样 Nginx 就不用实时压缩了，能降低服务器压力。可以参考 [gzip 压缩文件 & webPack 配置 Compression-webpack-plugin](https://segmentfault.com/a/1190000020976930)。

### 4.2 服务端压缩

Node 侧用 `compression` 中间件，一行 `app.use` 的事：

```js
const express = require('express');
const app = express();
const fs = require('fs');
const compression = require('compression');
const path = require('path');


app.use(compression());
app.use(express.static('build'));

app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname+'/build/index.html'));
});

const listener = app.listen(process.env.PORT || 3000, function () {
    console.log(`Listening on port ${listener.address().port}`);
});
```

`app.use(compression())` 要写在 `express.static` 前面，顺序反了静态文件会先被返回，压缩中间件就不生效了。这个坑很典型，改完发现体积没变的话先检查这里。

配上启动脚本：

```
"start": "npm run build && node server.js",
```

效果：

![开启服务端压缩后的响应体积](https://blog.poetries.top/img/static/images/image-20210208104641677.png)

### 4.3 JavaScript、CSS、HTML 压缩

工程化项目里直接用对应插件即可，webpack 侧主要是这三个：

- `UglifyJS`
- `webpack-parallel-uglify-plugin`
- `terser-webpack-plugin`

具体优缺点可参考 [webpack 常用的三种 JS 压缩插件](https://blog.csdn.net/qq_24147051/article/details/103557728)。压缩原理简单讲就是去掉空格、换行、注释，再借助 ES6 模块化做一些 tree-shaking 优化，同时做代码混淆，一方面为了更小的体积，另一方面也是为了源码安全。

这三个里现在只需要记住 `terser-webpack-plugin`。`UglifyJS` 不支持 ES6+ 语法，webpack 4 开始默认压缩器就换成 terser 了，webpack 5 内置了它，生产模式下不配也会自动压缩，只有要改压缩选项时才需要显式安装配置。

CSS 这块要澄清一个常见的说法。`mini-css-extract-plugin` 的职责是把 CSS 从 JS 里抽成独立文件，它本身并不做压缩，真正压缩 CSS 的是 `css-minimizer-webpack-plugin`（老版本叫 `optimize-css-assets-webpack-plugin`）。两个通常配着用：

```
npm install --save-dev mini-css-extract-plugin
```

```js
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
plugins:[
 new MiniCssExtractPlugin({
       filename: "[name].css",
       chunkFilename: "[id].css"
   })
]
```

抽成独立文件本身也是一项优化，CSS 和 JS 可以并行下载，而且能各自走缓存，改了 JS 不至于让 CSS 缓存一起失效。

HTML 压缩用 `HtmlWebpackPlugin` 的 `minify` 选项。单页项目就一个 `index.html`，这块的收益微乎其微，配上就行别指望它。

### 4.4 HTTP/2 首部压缩

HTTP/2 的几个特点：

- 二进制分帧
- 首部压缩
- 流量控制
- 多路复用
- 请求优先级
- 服务器推送

首部压缩用的是 HPACK，把重复的请求头做字典编码。请求越多、头越大，省得越明显，带一堆 cookie 的场景效果尤其突出。多路复用则让同一个连接上可以并行跑多个请求，前面 Network 那节说的 `Queueing` 和 `Stalled` 问题在 HTTP/2 下基本消失了。

升级方式很简单，改一下 Nginx 配置在 `listen 443 ssl` 后面加 `http2` 即可。

服务器推送这条要打个问号。它当年的写法是在 Nginx 里配 `http2_push /xxx.jpg;`，主动把资源推给客户端。但实践下来命中率不高，经常推了一堆客户端已经缓存的东西，反而更慢。Chrome 后来移除了对 HTTP/2 Server Push 的支持，现在想提前加载关键资源，用 `preload` 更可控，服务端能力允许的话 103 Early Hints 是更现代的替代品。

## 五、webpack 侧的构建优化

上面提到了几个 webpack 插件，这一节看看还有哪些。

### 5.1 DllPlugin 提升构建速度

思路是把体积大、基本不升级的包提前单独打成 `xx.dll.js`，业务代码构建时不再重复处理它们，通过 `manifest.json` 建立映射关系：

```js
// webpack.dll.config.js
const path = require("path");
const webpack = require("webpack");
module.exports = {
    mode: "production",
    entry: {
        react: ["react", "react-dom"],
    },
    output: {
        filename: "[name].dll.js",
        path: path.resolve(__dirname, "dll"),
        library: "[name]"
    },
    plugins: [
        new webpack.DllPlugin({
            name: "[name]",
            path: path.resolve(__dirname, "dll/[name].manifest.json")
        })
    ]
};
```

配一个单独的构建脚本，改了依赖才需要重新跑一次：

```
"scripts": {
    "dll-build": "NODE_ENV=production webpack --config webpack.dll.config.js",
  },
```

这套写法今天基本可以不用了。webpack 4 开始打包性能已经足够好，vue-cli 3 直接移除了 dll 相关配置，webpack 5 更是内置了文件系统级的持久化缓存（`cache: { type: 'filesystem' }`），二次构建的提速比 DllPlugin 更明显，配置量也少得多。我把这段留在这儿，是因为老项目里还能见到，看到了不至于懵。

### 5.2 splitChunks 拆包

这个才是今天真正天天在用的：

```js
optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    name: 'vendor',
                    test: /[\\/]node_modules[\\/]/,
                    minSize: 0,
                    minChunks: 1,
                    priority: 10,
                    chunks: 'initial'
                },
                common: {
                    name: 'common',
                    test: /[\\/]src[\\/]/,
                    chunks: 'all',
                    minSize: 0,
                    minChunks: 2
                }
            }
        }
    },
```

两个 cacheGroup 分工明确。`vendor` 把 `node_modules` 里的三方库抽出去，这部分内容几乎不变，用户第一次访问下载之后长期命中缓存。`common` 抽的是被至少两个模块引用的自家代码（`minChunks: 2`），避免同一段逻辑在多个 chunk 里重复打包。

`priority` 数字大的先匹配，`vendor` 给了 10 就是让三方库优先归到 vendor 而不是被 common 抢走。

拆包不是越碎越好。分得太细会让请求数暴涨，HTTP/1.1 下并发受限反而更慢，`minSize` 设成 0 在小项目里没问题，中大型项目建议给个几十 KB 的下限。

## 六、骨架屏

用 CSS 提前把位置占好，资源加载完成就直接填充，既减少页面回流与重绘，又给了用户最直接的反馈。图中用的插件是 [react-placeholder](https://github.com/buildo/react-placeholder)：

![骨架屏加载效果](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3666ae07b9eb4d839f7a893b89d83f47~tplv-k3u1fbpfcp-watermark.image)

骨架屏骗的是感知时间，实际加载并没有变快，但用户看到有结构的灰块和看到一片空白，等待的心理体验完全不同。这类优化的性价比往往比抠几十毫秒高得多。

实现方案还有很多种，用 `Puppeteer` 在服务端把首屏渲染成骨架的做法也不少。纯 CSS 伪类也能实现，可以看 [只要 css 就能实现的骨架屏方案](https://segmentfault.com/a/1190000020437426)。

要注意骨架的形状得和真实内容对得上。骨架是三行文字、真实内容是一张大图，填充那一刻会有明显的跳动，这就是 CLS 变差，得不偿失。

## 七、窗口化

原理是只渲染当前视口能显示的 DOM 元素，视图变化时删掉移出的、补上要显示的，保证页面上存在的 DOM 数量永远维持在一个很小的量级，页面就不会卡。这套东西现在更常听到的叫法是虚拟列表。

图中使用的插件是 [react-window](https://github.com/bvaughn/react-window)：

![react-window 虚拟列表效果](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1a459cc811844b7793aff6c9878d19ad~tplv-k3u1fbpfcp-watermark.image)

安装 `npm i react-window`，引入 `import { FixedSizeList as List } from 'react-window';`，用法：

```
const Row = ({ index, style }) => (
  <div style={style}>Row {index}</div>
);
 
const Example = () => (
  <List
    height={150}
    itemCount={1000}
    itemSize={35}
    width={300}
  >
    {Row}
  </List>
);

```

`Row` 上那个 `style` 一定要透传下去，里面是 `react-window` 算好的 `position: absolute` 和 `top`，漏了的话所有行会堆在一起。`FixedSizeList` 要求每行等高，行高不固定的场景用 `VariableSizeList`，得自己提供一个根据 index 返回高度的函数，这块实现起来会麻烦不少。

一千条以内的列表其实不太需要上虚拟化，直接渲染也不卡，反而是虚拟化带来的滚动白屏和搜索定位失效更烦人。上万条再考虑。

## 八、缓存

### 8.1 HTTP 缓存

**keep-alive** 判断是否开启，看 `response headers` 里有没有 `Connection: keep-alive`。开启之后，Network 的瀑布流里就不再有 `Initial connection` 耗时了，因为 TCP 连接被复用了。

Nginx 侧默认就是开的：

```
# 0 为关闭
#keepalive_timeout 0;
# 65s无连接 关闭
keepalive_timeout 65;
# 连接数，达到100断开
keepalive_requests 100;
```

`keepalive_requests 100` 意味着一条连接跑满 100 个请求就会断开重建。静态资源多的页面这个值偏小，可以往上调。

**Cache-Control / Expires / Max-Age** 设置资源是否缓存以及缓存时间，命中的是强缓存，浏览器压根不发请求。

**Etag / If-None-Match** 用资源的唯一标识做对比，有变化就从服务器拉新的，没变化返回 304 取缓存，这是协商缓存。

**Last-Modified / If-Modified-Since** 通过对比修改时间来决定要不要重新获取资源。它的精度只到秒，同一秒内的多次修改识别不出来，所以 Etag 的优先级比它高。

更多参数可参考 [使用 HTTP 缓存：Etag, Last-Modified 与 Cache-Control](https://harttle.land/2017/04/04/using-http-cache.html)。

实际配置时的原则很简单，带 hash 的静态资源走一年的强缓存，入口 `index.html` 必须禁强缓存走协商缓存。反过来配的话，你发了新版本用户却一直看到老页面，而且怎么刷新都不管用。

### 8.2 Service Worker

借助 webpack 插件 `WorkboxWebpackPlugin` 和 `ManifestPlugin` 生成 `serviceWorker.js`，再通过 `serviceWorker.register()` 注册：

```js
new WorkboxWebpackPlugin.GenerateSW({
    clientsClaim: true,
    exclude: [/\.map$/, /asset-manifest\.json$/],
    importWorkboxFrom: 'cdn',
    navigateFallback: paths.publicUrlOrPath + 'index.html',
    navigateFallbackBlacklist: [
        new RegExp('^/_'),
        new RegExp('/[^/?]+\\.[^/]+$'),
    ],
}),
```

配套的资源清单生成：

```js
new ManifestPlugin({
    fileName: 'asset-manifest.json',
    publicPath: paths.publicUrlOrPath,
    generate: (seed, files, entrypoints) => {
        const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path;
            return manifest;
        }, seed);
        const entrypointFiles = entrypoints.app.filter(
            fileName => !fileName.endsWith('.map')
        );

        return {
            files: manifestFiles,
            entrypoints: entrypointFiles,
        };
    },
}),
```

注册成功后在 DevTools 的 Application 面板能看到：

![Service Worker 注册成功](https://blog.poetries.top/img/static/images/image-20210208105415279.png)

Service Worker 是二次访问的加速利器，但它也是最容易翻车的一块。缓存策略配错了，用户会被永久锁在某个旧版本上，而且清浏览器缓存都不一定管用，得手动 unregister。上线前一定要想清楚更新和失效的路径，`clientsClaim: true` 配合 `skipWaiting` 能让新版本尽快接管，代价是页面可能在使用中途被切换。

排查这类缓存问题的具体手法，我在 [前端调试实战](https://feinterview.poetries.top/blog/fe-debug) 里写过一些，可以参考。

## 九、预加载与懒加载

前面所有手段都是让资源更小更快，这一节换个思路，调整资源的加载顺序和时机。

### 9.1 preload

拿 demo 里的字体举例。正常情况下字体的加载顺序是这样，它藏在 CSS 里，浏览器要先下 CSS、再解析、再发现字体、再去下，串行了好几步：

![未使用 preload 时字体的加载顺序](https://blog.poetries.top/img/static/images/image-20210208105446451.png)

加上 `preload` 之后，浏览器在解析 HTML 阶段就知道要下这几个文件，直接并行发出去：

```html
<link rel="preload" href="https://fonts.gstatic.com/s/longcang/v5/LYjAdGP8kkgoTec8zkRgqHAtXN-dRp6ohF_hzzTtOcBgYoCKmPpHHEBiM6LIGv3EnKLjtw.119.woff2" as="font" crossorigin="anonymous"/> 
<link rel="preload" href="https://fonts.gstatic.com/s/longcang/v5/LYjAdGP8kkgoTec8zkRgqHAtXN-dRp6ohF_hzzTtOcBgYoCKmPpHHEBiM6LIGv3EnKLjtw.118.woff2" as="font" crossorigin="anonymous"/> 
<link rel="preload" href="https://fonts.gstatic.com/s/longcang/v5/LYjAdGP8kkgoTec8zkRgqHAtXN-dRp6ohF_hzzTtOcBgYoCKmPpHHEBiM6LIGv3EnKLjtw.116.woff2" as="font" crossorigin="anonymous"/> 
```

![使用 preload 后的加载顺序](https://blog.poetries.top/img/static/images/image-20210208105522277.png)

`as="font"` 不能省，浏览器靠它决定优先级和 Accept 头。字体的 `crossorigin` 也必须写，哪怕是同源的，因为字体请求默认按匿名 CORS 模式发起，不写会导致下载两次，反而更慢。这个坑很多人踩过，控制台里会有一条明确的警告，别忽略它。

`preload` 只管下载不管执行，下完先放进内存缓存等着用。如果下了三秒还没被用到，控制台同样会警告，这通常说明你 preload 了不该 preload 的东西。

### 9.2 prefetch

场景不一样。首页不需要这个字体文件，但下一个页面需要，那就用 `prefetch`，浏览器会以最低优先级 `Lowest` 在空闲时提前加载，需要的页面直接从 `prefetch cache` 里取：

![prefetch 命中缓存的效果](https://blog.poetries.top/img/static/images/image-20210208105625448.png)

一句话区分，`preload` 是「这个页面马上要用」，`prefetch` 是「下个页面可能会用」。用反了会抢占关键资源的带宽。

webpack 也支持这两个属性，写成魔法注释就行，可参考 [webpackPrefetch 和 webpackPreload](https://www.cnblogs.com/skychx/p/webpack-webpackChunkName-webpackPreload-webpackPreload.html)。

### 9.3 图片懒加载

最朴素的做法是先放一张体积极小的占位图，滚到视口附近再换成真图：

![占位图方式的图片懒加载](https://blog.poetries.top/img/static/images/image-20210208105717958.png)

进一步是渐进式图片，先出一张模糊的低清版本，清晰版本下完再替换，视觉上是逐渐变清楚的过程，比突然蹦出来舒服：

![渐进式图片的加载过程](https://blog.poetries.top/img/static/images/image-20210208105747314.png)

这种要在设计出稿时就指定格式，JPEG 存成 progressive、PNG 用交错模式，前端这边改不了。

再往上是响应式图片，让浏览器根据视口宽度自己挑合适尺寸，手机上就别下 1200px 的图了：

```
<img src="./img/index.jpg" sizes="100vw" srcset="./img/dog.jpg 800w, ./img/index.jpg 1200w"/>
```

![响应式图片按视口选择资源](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7427e9243791461b8ffa49f47981cfba~tplv-k3u1fbpfcp-watermark.image?imageslim)

`srcset` 里的 `800w` 是图片的真实像素宽度，`sizes` 描述的是图片在布局中会占多宽。两者配合浏览器才能算对，只写 `srcset` 不写 `sizes` 的话浏览器会按 100vw 估算，小图容器上会挑到过大的资源。

补一句现在的做法，纯粹的「滚到再加载」已经不需要写 JS 了，`<img loading="lazy">` 原生属性主流浏览器都支持，一个属性搞定。上面那些手写 `IntersectionObserver` 的方案，留给需要精细控制加载时机的场景就行。

### 9.4 路由懒加载

通过函数加 `import()` 实现，webpack 会自动把它切成独立 chunk：

```
const Page404 = () => import(/* webpackChunkName: "error" */'@views/errorPage/404');
```

`webpackChunkName` 那段魔法注释别嫌麻烦，产物文件名带上语义之后，出问题时看 Network 一眼就知道是哪个页面的包在拖慢加载。多个路由用同一个 chunkName 还能把它们合并成一个包，适合那种几个小页面各自单独打包反而不划算的场景。

## 十、SSR 与 react-snap

上面所有手段都在优化「资源什么时候到」，服务端渲染换的是另一条思路，让用户拿到的第一份 HTML 里就已经有内容。

- 服务端渲染 SSR，Vue 用 `nuxt.js`，React 用 `next.js`
- `react-snap` 借助 `Puppeteer` 在构建时把单页预渲染一遍，保留渲染后的 DOM 发给客户端

两者的区别是 SSR 每次请求都在服务端渲染，能处理动态内容但要养一台 Node 服务；`react-snap` 属于构建时预渲染，产物还是纯静态文件，部署成本几乎为零，代价是只适合内容不随用户变化的页面。营销页、文档站这类用后者就够了。

## 十一、体验优化

### 白屏 loading

单页应用在 JS 加载执行完之前是彻底空白的，给一个动画至少让用户知道页面在动：

![白屏期间的 loading 动画](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/41557f3a361c4cf899a4eab3bde79154~tplv-k3u1fbpfcp-watermark.image)

关键点在于这段 loading 必须是纯 HTML 加 CSS 内联在 `index.html` 里，不能依赖任何 JS 或外部资源，否则它自己也得等加载，就失去意义了。可以用 `HtmlWebpackPlugin` 在构建时把 loading 资源插进页面。

完整的 `loading.html` 需要自取：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Loading</title>
    <style>
      body {
        margin: 0;
      }
      #loadding {
        position: fixed;
        top: 0;
        bottom: 0;
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: center;
      }
      #loadding > span {
        display: inline-block;
        width: 8px;
        height: 100%;
        margin-right: 5px;
        border-radius: 4px;
        -webkit-animation: load 1.04s ease infinite;
        animation: load 1.04s ease infinite;
      }
      @keyframes load {
        0%,
        100% {
          height: 40px;
          background: #98beff;
        }
        50% {
          height: 60px;
          margin-top: -20px;
          background: #3e7fee;
        }
      }
    </style>
  </head>

  <body>
    <div id="loadding">
      <span></span>
      <span style="animation-delay: 0.13s"></span>
      <span style="animation-delay: 0.26s"></span>
      <span style="animation-delay: 0.39s"></span>
      <span style="animation-delay: 0.52s"></span>
    </div>
  </body>
  <script>
    window.addEventListener("DOMContentLoaded", () => {
      const $loadding = document.getElementById("loadding");
      if (!$loadding) {
        return;
      }
      $loadding.style.display = "none";
      $loadding.parentNode.removeChild($loadding);
    });
  </script>
</html>
```

动画本身靠 `@keyframes` 改高度，五个 `span` 用不同的 `animation-delay` 错开就有了波浪效果，全程只动 `height` 和 `margin-top`。这两个属性会触发布局，元素少的时候无所谓，如果你要做更复杂的加载动画，尽量只用 `transform` 和 `opacity`，它们能走合成器不占主线程。

移除时机选在 `DOMContentLoaded`，也就是 DOM 结构就绪的那一刻。如果你的应用要等数据回来才有内容，那这里移得太早，用户会看到 loading 消失后又是一片白，改成由框架在首屏渲染完成后手动移除更合适。

## 总结

性能优化的顺序应该是先量再改。Network 的瀑布流告诉你锅在网络、服务端还是资源体积，Lighthouse 给你一个能拿去开会的分数，Performance 定位到具体哪一行代码，WebPageTest 模拟真实的弱网和海外场景，`webpack-bundle-analyzer` 和 `source-map-explorer` 负责产物侧。线上长期监控则靠 `PerformanceObserver` 和 Navigation Timing 自己采数据上报。

具体手段可以归到三条线。加载这条线上，Gzip 对文本资源收益最大，`terser-webpack-plugin` 和 `css-minimizer-webpack-plugin` 各管一摊（`mini-css-extract-plugin` 只负责抽离不负责压缩），`splitChunks` 把三方库和公共代码拆出去吃缓存，`preload` 管本页关键资源、`prefetch` 管下一页，图片用 `loading="lazy"` 加响应式 `srcset`，路由用 `import()` 切包。

渲染这条线上，最值钱的是避免强制同步布局，读写分离用 `fastdom` 或者手动分批，动画尽量只碰 `transform` 和 `opacity`。列表上万条再考虑虚拟化，骨架屏和白屏 loading 优化的是感知时间，性价比往往比抠毫秒更高。

缓存这条线上记住一条铁律，带 hash 的静态资源走长强缓存，入口 `index.html` 必须走协商缓存。Service Worker 能显著加速二次访问，但更新策略配错会把用户锁在旧版本上，上线前一定要把失效路径想清楚。

## 参考

- [MDN - Performance API](https://developer.mozilla.org/zh-CN/docs/Web/API/Performance_API)
- [MDN - PerformanceObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/PerformanceObserver)
- [MDN - Page Visibility API](https://developer.mozilla.org/zh-CN/docs/Web/API/Page_Visibility_API)
- [MDN - rel=preload 预加载内容](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/rel/preload)
- [web.dev - Core Web Vitals](https://web.dev/articles/vitals)
- [webpack - SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/)
- [Yahoo - Best Practices for Speeding Up Your Web Site](https://developer.yahoo.com/performance/rules.html)
- [github fastdom](https://github.com/wilsonpage/fastdom)
- [react-window](https://github.com/bvaughn/react-window)
- [使用 HTTP 缓存：Etag, Last-Modified 与 Cache-Control](https://harttle.land/2017/04/04/using-http-cache.html)
- [前端进阶之旅](https://interview.poetries.top)
