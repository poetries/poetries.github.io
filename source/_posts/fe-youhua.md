---
title: 图解前端性能优化
date: 2021-02-08 10:50:03
tags: 性能优化
categories: Front-End
---

## 一、调试工具

### 1、Network

![image-20210208102537169](http://img-repo.poetries.top/images/image-20210208102537169.png)

这里可以看到资源加载详情，初步评估影响`页面性能`的因素。鼠标右键可以自定义选项卡，页面底部是当前加载资源的一个概览。`DOMContentLoaded` DOM渲染完成的时间，`Load`：当前页面所有资源加载完成的时间

**思考：如何判断哪些资源对当前页面加载无用，做对应优化？**

**shift + cmd + P 调出控制台的扩展工具，添加规则**

![image-20210208102549961](http://img-repo.poetries.top/images/image-20210208102549961.png)

**监控页面性能变化**

![image-20210208102650825](http://img-repo.poetries.top/images/image-20210208102650825.png)

#### 瀑布流waterfal

![image-20210208102723253](http://img-repo.poetries.top/images/image-20210208102723253.png)

- `Queueing` 浏览器将资源放入队列时间

- `Stalled` 因放入队列时间而发生的停滞时间
- `DNS Lookup` DNS解析时间

- `Initial connection`  建立HTTP连接的时间

- `SSL` 浏览器与服务器建立安全性连接的时间

- `TTFB` 等待服务端返回数据的时间

- `Content Download`  浏览器下载资源的时间



### 2、Lighthouse

![image-20210208102851752](http://img-repo.poetries.top/images/image-20210208102851752.png)

- `First Contentful Paint` 首屏渲染时间，1s以内绿色
- `Speed Index` 速度指数，4s以内绿色
- `Time to Interactive` 到页面可交换的时间

> 根据chrome的一些策略自动对网站做一个质量评估，并且会给出一些优化的建议

### 3、Peformance



![image-20210208102949596](http://img-repo.poetries.top/images/image-20210208102949596.png)

对网站最专业的分析

### 4、webPageTest

> 可以模拟不同场景下访问的情况，比如模拟不同浏览器、不同国家等等，在线测试地址：[webPageTest](https://www.webpagetest.org/)

![image-20210208103032419](http://img-repo.poetries.top/images/image-20210208103032419.png)

![image-20210208103054016](http://img-repo.poetries.top/images/image-20210208103054016.png)

### 5、资源打包分析

#### webpack-bundle-analyzer

![image-20210208103127992](http://img-repo.poetries.top/images/image-20210208103127992.png)

```js
npm install --save-dev webpack-bundle-analyzer
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

// package.json
"analyz": "NODE_ENV=production npm_config_report=true npm run build"

```

#### 开启source-map

>  `webpack.config.js`

```
module.exports = {
    mode: 'production',
    devtool: 'hidden-source-map',
}
```

package.json

```js
"analyze": "source-map-explorer 'build/*.js'",
```

npm run analyze

![image-20210208103321371](http://img-repo.poetries.top/images/image-20210208103321371.png)



## 二、WEB API

工欲善其事，必先利其器。浏览器提供的一些分析API`至关重要`



### 1、监听视窗激活状态

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9b7ab11fc7b94fcf8c79bd3b28706b2c~tplv-k3u1fbpfcp-watermark.image)



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

其实有很多隐藏的api，这里大家有兴趣的可以去试试看：

### 2、观察长任务（performance 中Task）

```js
const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        console.log(entry)
    }
})

observer.observe({entryTypes: ['longtask']})
```

### 3、监听网络变化

网络变化时给用户反馈网络问题，有时候看直播的时候自己的网络卡顿，直播平台也会提醒你或者自动给你切换清晰度

```js
var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
var type = connection.effectiveType;

function updateConnectionStatus() {
  console.log("Connection type changed from " + type + " to " + connection.effectiveType);
  type = connection.effectiveType;
}

connection.addEventListener('change', updateConnectionStatus);
```

### 4、计算DOMContentLoaded时间

```js
window.addEventListener('DOMContentLoaded', (event) => {
    let timing = performance.getEntriesByType('navigation')[0];
    console.log(timing.domInteractive);
    console.log(timing.fetchStart);
    let diff = timing.domInteractive - timing.fetchStart;
    console.log("TTI: " + diff);
})
```

### 5、更多计算规则

- `DNS` 解析耗时: `domainLookupEnd - domainLookupStart `
- `TCP` 连接耗时: `connectEnd - connectStart `
- `SSL` 安全连接耗时: `connectEnd - secureConnectionStart `
- 网络请求耗时 (`TTFB`): `responseStart - requestStart `
- 数据传输耗时: `responseEnd - responseStart `
- `DOM` 解析耗时: `domInteractive - responseEnd `
- 资源加载耗时:` loadEventStart - domContentLoadedEventEnd `
- `First Byte`时间: `responseStart - domainLookupStart `
- 白屏时间: `responseEnd - fetchStart `
- 首次可交互时间: `domInteractive - fetchStart `
- `DOM Ready` 时间: `domContentLoadEventEnd - fetchStart `
- 页面完全加载时间: `loadEventStart - fetchStart `
- `http` 头部大小： `transferSize - encodedBodySize `
- 重定向次数：`performance.navigation.redirectCount `
- 重定向耗时: `redirectEnd - redirectStart`

## 三、雅虎军规



关于雅虎军规，你知道的有多少条，平时写用到的又有哪些？针对以下规则，我们可以做很多优化工作

![image-20210208103918197](http://img-repo.poetries.top/images/image-20210208103918197.png)

### 1、减少cookie传输

>  `cookie`传输会造成带宽浪费，可以：

- 减少`cookie`中存储的东西
- 静态资源不需要`cookie`，可以采用其他的域名，不会主动带上`cookie`

### 2、避免过多的回流与重绘

连续触发页面回流操作

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

看下效果，很明显的卡顿

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7618dea1a4774c8685e9926b08d67fdd~tplv-k3u1fbpfcp-watermark.image)

> `performance`分析结果，`load`事件之后存在大量的回流，并且`chrome`都给标记了红色

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9b543d68fab7445da1dedb72bb224f69~tplv-k3u1fbpfcp-watermark.image)

> 使用`fastDom`进行优化，将对dom的`读和写`分离，合并

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

![img](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1df5c32c30494c13b3402305f866b327~tplv-k3u1fbpfcp-watermark.image)

> `performance`分析结果，load事件之后也没有了那么多的红色标记

感兴趣的可以去了解一下fastDom：[github fastdom](https://github.com/wilsonpage/fastdom) 在线预览：[fastdom demo](http://wilsonpage.github.io/fastdom/examples/animation.html)

关于任务拆分与组合的思想，`react fiber`架构做的很牛逼，有兴趣的可以去了解一下调度算法在fiber中的实践

## 四、压缩

### 1、Gzip

开启方式可参考：[nginx开启gzip](https://juejin.cn/post/6844903605187641357)



![image-20210208104535672](http://img-repo.poetries.top/images/image-20210208104535672.png)

>  还有一种方式：打包的时候生成gz文件，上传到服务器端，这样就不需要nginx来压缩了，可以降低服务器压力。 可参考：[gzip压缩文件&webPack配置Compression-webpack-plugin](https://segmentfault.com/a/1190000020976930)

### 2、服务端压缩



server.js



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

package.json



```
"start": "npm run build && node server.js",
```

![image-20210208104641677](http://img-repo.poetries.top/images/image-20210208104641677.png)

### 3、JavaScript、Css、Html压缩

工程化项目中直接使用对应的插件即可，webpack的主要有下面三个：

- `UglifyJS`
- `webpack-parallel-uglify-plugin`
- `terser-webpack-plugin`



>  具体优缺点可参考：[webpack常用的三种JS压缩插件](https://blog.csdn.net/qq_24147051/article/details/103557728)。`压缩原理`简单的讲就是去除一些空格、换行、注释，借助es6模块化的功能，做了一些`tree-shaking`的优化。同时做了一些代码混淆，一方面是为了更小的体积，另一方面也是为了源码的安全性。

css压缩主要是`mini-css-extract-plugin`，当然前面的js压缩插件也会给你做好css压缩。使用姿势

```
npm install --save-dev mini-css-extract-plugin
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
plugins:[
 new MiniCssExtractPlugin({
       filename: "[name].css",
       chunkFilename: "[id].css"
   })
]
```

html压缩可以用`HtmlWebpackPlugin`，单页项目就一个index.html,性能提升微乎其微~



### 4、http2首部压缩

**http2的特点**

- 二进制分帧
- 首部压缩
- 流量控制
- 多路复用
- 请求优先级
- 服务器推送`http2_push: 'xxx.jpg'`

具体升级方式也很简单，修改一下`nginx`配置，方法请自行`Google`

## 五、webpack优化



上文中也提到了部分webpack插件，下面我再来看看还有哪些~

### 1、DllPlugin 提升构建速度

> 通过`DllPlugin`插件，将一些比较大的，基本很少升级的包拆分出来，生成`xx.dll.js`文件,通过`manifest.json`引用

webpack.dll.config.js

```js
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



package.json



```
"scripts": {
    "dll-build": "NODE_ENV=production webpack --config webpack.dll.config.js",
  },
```



> webpack4不需要配置dll了，因为webpack4打包性能已经足够优化，vue-cli3都已经移除`dll`

### 2、splitChunks 拆包

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

## 六、骨架屏

> 用css提前占好位置，当资源加载完成即可填充，减少页面的回流与重绘，同时还能给用户最直接的反馈。 图中使用插件：[react-placeholder](https://github.com/buildo/react-placeholder)

![img](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3666ae07b9eb4d839f7a893b89d83f47~tplv-k3u1fbpfcp-watermark.image)

关于实现骨架屏还有很多种方案，用`Puppeteer`服务端渲染的挺多的

使用css伪类：[只要css就能实现的骨架屏方案](https://segmentfault.com/a/1190000020437426)



## 七、窗口化

> 原理：只加载当前窗口能显示的DOM元素，当视图变化时，删除隐藏的，添加要显示的DOM就可以保证页面上存在的dom元素数量永远不多，页面就不会卡顿

图中使用的插件：[react-window](https://github.com/bvaughn/react-window)

![img](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1a459cc811844b7793aff6c9878d19ad~tplv-k3u1fbpfcp-watermark.image)

安装：`npm i react-window`

引入：`import { FixedSizeList as List } from 'react-window';`

使用：



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

## 八、缓存

### 1、http缓存

#### keep-alive

判断是否开启：看`response headers`中有没有`Connection: keep-alive` 。开启以后，看`network`的瀑布流中就没有 `Initial connection`耗时了

`nginx`设置`keep-alive`（默认开启）

```
# 0 为关闭
#keepalive_timeout 0;
# 65s无连接 关闭
keepalive_timeout 65;
# 连接数，达到100断开
keepalive_requests 100;
```

#### Cache-Control / Expires / Max-Age

设置资源是否缓存，以及缓存时间

#### Etag / If-None-Match

资源唯一标识作对比，如果有变化，从服务器拉取资源。如果没变化则取缓存资源，状态码304，也就是协商缓存

#### Last-Modified / If-Modified-Since

通过对比时间的差异来觉得要不要从服务器获取资源

更多HTTP缓存参数可参考：[使用 HTTP 缓存：Etag, Last-Modified 与 Cache-Control](https://harttle.land/2017/04/04/using-http-cache.html)

### 2、Service Worker

> 借助webpack插件`WorkboxWebpackPlugin`和`ManifestPlugin`,加载serviceWorker.js,通过`serviceWorker.register()`注册

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

![image-20210208105415279](http://img-repo.poetries.top/images/image-20210208105415279.png)



## 九、预加载 && 懒加载

### 1、preload



就拿demo中的字体举例，正常情况下的加载顺序是这样的：



![image-20210208105446451](http://img-repo.poetries.top/images/image-20210208105446451.png)

加入preload：



```html
<link rel="preload" href="https://fonts.gstatic.com/s/longcang/v5/LYjAdGP8kkgoTec8zkRgqHAtXN-dRp6ohF_hzzTtOcBgYoCKmPpHHEBiM6LIGv3EnKLjtw.119.woff2" as="font" crossorigin="anonymous"/> 
<link rel="preload" href="https://fonts.gstatic.com/s/longcang/v5/LYjAdGP8kkgoTec8zkRgqHAtXN-dRp6ohF_hzzTtOcBgYoCKmPpHHEBiM6LIGv3EnKLjtw.118.woff2" as="font" crossorigin="anonymous"/> 
<link rel="preload" href="https://fonts.gstatic.com/s/longcang/v5/LYjAdGP8kkgoTec8zkRgqHAtXN-dRp6ohF_hzzTtOcBgYoCKmPpHHEBiM6LIGv3EnKLjtw.116.woff2" as="font" crossorigin="anonymous"/> 
```

![image-20210208105522277](http://img-repo.poetries.top/images/image-20210208105522277.png)

### 2、prefetch

>  场景：首页不需要这样的字体文件，下个页面需要：首页会以最低优先级`Lowest`来提前加载

加入`prefetch`：

需要的页面，从`prefetch cache`中取



![image-20210208105625448](http://img-repo.poetries.top/images/image-20210208105625448.png)

webpack也是支持这两个属性的:[webpackPrefetch 和 webpackPreload](https://www.cnblogs.com/skychx/p/webpack-webpackChunkName-webpackPreload-webpackPreload.html)



### 3、懒加载

#### 图片

机械图片

![image-20210208105717958](http://img-repo.poetries.top/images/image-20210208105717958.png)

`渐进式图片（类似高斯模糊）` 需要UI小姐姐出稿的时候指定这种格式

![image-20210208105747314](http://img-repo.poetries.top/images/image-20210208105747314.png)



`响应式图片`

原生模式：`<img src="./img/index.jpg" sizes="100vw" srcset="./img/dog.jpg 800w, ./img/index.jpg 1200w"/>`



![img](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7427e9243791461b8ffa49f47981cfba~tplv-k3u1fbpfcp-watermark.image?imageslim)

#### 路由懒加载

通过`函数 + import`实现

```
const Page404 = () => import(/* webpackChunkName: "error" */'@views/errorPage/404');
```



## 十、ssr && react-snap

- 服务端渲染`SSR`，vue使用`nuxt.js`，`react`使用`next.js`
- `react-snap`可以借助`Puppeteer`实现先渲染单页，然后保留`DOM`，发送到客户端

## 十一、体验优化



### 白屏loading

![img](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/41557f3a361c4cf899a4eab3bde79154~tplv-k3u1fbpfcp-watermark.image)

**loading.html** 需要自取哦，还有种方式，使用`webpack`插件`HtmlWebpackPlugin`将loading资源插入到页面中



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

