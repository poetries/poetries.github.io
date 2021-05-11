---
title: 前端监控系统总结篇
date: 2021-05-11 10:50:32
tags: 前端监控
categories: Front-End
---


## 一、性能优化方法论

![](http://img-repo.poetries.top/images/20210502210714.png)

> 首屏时间可以拆分为白屏时间、数据接口响应时间、图片加载资源等


![](http://img-repo.poetries.top/images/20210502214539.png)

![](http://img-repo.poetries.top/images/20210503212926.png)

## 二、指标采集：首屏时间指标采集具体办法

### 手动采集办法及优缺点：
 
- 所谓手动采集，一般是通过埋点的方式进行， 比如在页面开始位置打上 `FMP.Start()`，在首屏结束位置打上 `FMP.End()`，利用 `FMP.End()-FMP.Start()` 获取到首屏时间。
- 手动采集的统计结果并不精确，因为依赖于人，每个人对首屏的理解有偏差，经常打错或者忘记打点。
 

### 自动化采集优势及办法

> 所谓自动化采集，即引入一段通用的代码来做首屏时间自动化采集，引入过程中，除了必要的配置不需要做其他事情。

自动化采集的好处是独立性更强，接入过程更自动化。具体的自动化采集代码，可以由一个公共团队来开发，试点后，推广到各个业务团队。而且统计结果更标准化，同一段统计代码，标准更统一，业务侧同学也更认可这个统计结果。

当然，它也有缺点，最明显的是，有些个性化需求无法满足，毕竟在工作中，总会有一些特殊业务场景。所以，采用自动化采集方案必须做一些取舍。

### 单页面（SPA）应用业务下的采集办法

SPA 页面因为无法基于 `DOMContentLoaded` 做首屏指标采集，可以使用 `MutationObserver` 采集首屏时间。

> `MutationObserver` 接口提供了监视对 DOM 树所做更改的能力。它被设计为旧的 `Mutation Events` 功能的替代品，该功能是 DOM3 Events 规范的一部分。

简单来说， 使用 `MutationObserver 能监控页面信息的变化`，当页面 `body` 变化最剧烈的时候，我们拿到的时间数据，就是`首屏时间`。

首先，在用户进入页面时，我们可以使用 `MutationObserver` 监控 `DOM` 元素 （Document Object Model，文档对象模型）。当 DOM 元素发生变化时，程序会标记变化的元素，记录时间点和分数，存储到数组中。数据的格式类似于 `[200ms,18.5]`。

为了提升计算的效率，我们认为首屏指标采集到某些条件时，首屏渲染已经结束，我们需要考虑首屏采集终止的条件，即计算时间超过 30 秒还没有结束；计算了 4 轮且 1 秒内分数不再变化；计算了 9 次且分数不再变化。

接下来，设定元素权重计算分数。

递归遍历 DOM 元素及其子元素，根据子元素所在层数设定元素权重，比如第一层元素权重是 1，当它被渲染时得 1 分，每增加一层权重增加 0.5，比如第五层元素权重是 3.5，渲染时给出对应分数。

为什么需要权重呢？

因为页面中每个 DOM 元素对于首屏的意义是不同的，越往内层越接近真实的首屏内容，如图片和文字，越往外层越接近 body 等框架层。

最后，根据前面的得分，计算元素的分数变化率，获取变化率最大点对应的分数。然后找到该分数对应的时间，即为首屏时间。

分数部分核心计算逻辑是递归遍历元素，将一些无用的标签排除，如果元素超过可视范围返回 0 分，每一层增加 0.5 的权重，具体请看下面代码示例。

```js
function CScor(el, tiers, parentScore) {
    let score = 0;
    const tagName = el.tagName;
    if ("SCRIPT" !== tagName && "STYLE" !== tagName && "META" !== tagName && "HEAD" !== tagName) {
      const childrenLen = el.children ? el.children.length : 0;
      if (childrenLen > 0) for (let childs = el.children, len = childrenLen - 1; len >= 0; len--) {
        score += calculateScore(childs[len], tiers + 1, score > 0);
      }
      if (score <= 0 && !parentScore) {
        if (!(el.getBoundingClientRect && el.getBoundingClientRect().top < WH)) return 0;
      }
      score += 1 + .5 * tiers;
    }
    return score;
  }
```

变化率部分核心计算逻辑是获取 DOM 变化最大时对应的时间，代码如下所示

```js
calFinallScore() {
    try {
      if (this.sendMark) return;
      const time = Date.now() - performance.timing.fetchStart;
      var isCheckFmp = time > 30000 || SCORE_ITEMS && SCORE_ITEMS.length > 4 && time - (SCORE_ITEMS && SCORE_ITEMS.length && SCORE_ITEMS[SCORE_ITEMS.length - 1].t || 0) > 2 * CHECK_INTERVAL || (SCORE_ITEMS.length > 10 && window.performance.timing.loadEventEnd !== 0 && SCORE_ITEMS[SCORE_ITEMS.length - 1].score === SCORE_ITEMS[SCORE_ITEMS.length - 9].score);
      if (this.observer && isCheckFmp) {
        this.observer.disconnect();
        window.SCORE_ITEMS_CHART = JSON.parse(JSON.stringify(SCORE_ITEMS));
        let fmps = getFmp(SCORE_ITEMS);
        let record = null
        for (let o = 1; o < fmps.length; o++) {
          if (fmps[o].t >= fmps[o - 1].t) {
            let l = fmps[o].score - fmps[o - 1].score;
            (!record || record.rate <= l) && (record = {
              t: fmps[o].t,
              rate: l
            });
          }
        }
        //
        this.fmp = record && record.t || 30001;
        try {
          this.checkImgs(document.body)
          let max = Math.max(...this.imgs.map(element => {
            if(/^(\/\/)/.test(element)) element = 'https:' + element;
            try {
              return performance.getEntriesByName(element)[0].responseEnd || 0
            } catch (error) {
              return 0
            }
          }))
          record && record.t > 0 && record.t < 36e5 ? this.setPerformance({
            fmpImg: parseInt(Math.max(record.t , max))
          }) : this.setPerformance({});
        } catch (error) {
          this.setPerformance({});
          // console.error(error)
        }
      } else {
        setTimeout(() => {
          this.calFinallScore();
        }, CHECK_INTERVAL);
      }
    } catch (error) {

    }
  }
```

这个就是首屏计算的部分流程。

看完前面的流程，不知道你有没有这样的疑问：`如果页面里包含图片，使用上面的首屏指标采集方案，结果准确吗`？

> 结论是：不准确。上述计算逻辑主要是针对 DOM元素来做的，图片加载过程是异步，图片容器（图片的 DOM 元素）和内容的加载是分开的，当容器加载出来时，内容还没出来，一定要确保内容加载出来，才算首屏。

这就需要增加一些策略了，以下是包含图片页面的首屏计算 demo。

```html
<!doctype html><body><img id="imgTest" src="https://www.baidu.com/img/bd_logo1.png?where=super">
  <img id="imgTest" src="https://www.baidu.com/img/bd_logo1.png?where=super">
  <style type=text/css>
    background-image:url('https://www.baidu.com/img/dong_8f1d47bcb77d74a1e029d8cbb3b33854.gif);
  </style>
  </body>
  <html>
<script type="text/javascript">
(() => {
  const imgs = []
  const getImageDomSrc = {
    _getImgSrcFromBgImg: function (bgImg) {
      var imgSrc;
      var matches = bgImg.match(/url\(.*?\)/g);
      if (matches && matches.length) {
        var urlStr = matches[matches.length - 1];
        var innerUrl = urlStr.replace(/^url\([\'\"]?/, '').replace(/[\'\"]?\)$/, '');
        if (((/^http/.test(innerUrl) || /^\/\//.test(innerUrl)))) {
          imgSrc = innerUrl;
        }
      }
      return imgSrc;
    },
    getImgSrcFromDom: function (dom, imgFilter) {
      if (!(dom.getBoundingClientRect && dom.getBoundingClientRect().top < window.innerHeight))
        return false;
      imgFilter = [/(\.)(png|jpg|jpeg|gif|webp|ico|bmp|tiff|svg)/i]
      var src;
      if (dom.nodeName.toUpperCase() == 'IMG') {
        src = dom.getAttribute('src');
      } else {
        var computedStyle = window.getComputedStyle(dom);
        var bgImg = computedStyle.getPropertyValue('background-image') || computedStyle.getPropertyValue('background');
        var tempSrc = this._getImgSrcFromBgImg(bgImg, imgFilter);
        if (tempSrc && this._isImg(tempSrc, imgFilter)) {
          src = tempSrc;
        }
      }
      return src;
    },
    _isImg: function (src, imgFilter) {
      for (var i = 0, len = imgFilter.length; i < len; i++) {
        if (imgFilter[i].test(src)) {
          return true;
        }
      }
      return false;
    },
    traverse(e) {
      var _this = this
        , tName = e.tagName;
      if ("SCRIPT" !== tName && "STYLE" !== tName && "META" !== tName && "HEAD" !== tName) {
        var el = this.getImgSrcFromDom(e)
        if (el && !imgs.includes(el))
          imgs.push(el)
        var len = e.children ? e.children.length : 0;
        if (len > 0)
          for (var child = e.children, _len = len - 1; _len >= 0; _len--)
            _this.traverse(child[_len]);
      }
    }
  }
  getImageDomSrc.traverse(document.body);
console.log(imgs,'-imgs--')
  window.onload=function(){
  var max = Math.max(...imgs.map(element => {
     if (/^(\/\/)/.test(element))
      element = 'https:' + element;
    try {
      return performance.getEntriesByName(element)[0].responseEnd || 0
    } catch (error) {
      return 0
    }
  }
  ))
  console.log(max);
  }
}
)()
</script>
```

它的计算逻辑是这样的。

首先，获取页面所有的图片路径。在这里，图片类型分两种，一种是带 IMG 标签的，一种是带 DIV 标签的。前者可以直接通过 src 值得到图片路径，后者可以使用 `window.getComputedStyle(dom)` 方式获取它的样式集合。

接下来，通过正则获取图片的路径即可。

然后通过 `performance.getEntriesByName(element)[0].responseEnd` 的方式获取到对应图片路径的下载时间，最后与使用 `MutationObserver` 获得的 DOM 首屏时间相比较，哪个更长，哪个就是最终的首屏时间。

> 以上就是首屏采集的完整流程

> 注意：计算首屏时间用到的`getBoundingClientRect`和`getComputedStyle`会引起强制回流

![](http://img-repo.poetries.top/images/20210503151137.png)

## 三、指标采集：白屏、卡顿、网络环境指标采集方法

### 白屏指标采集

> 白屏时间是指从输入内容回车（包括刷新、跳转等方式）后，到页面开始出现第一个字符的时间。白屏时间的长短会影响用户对 App 或站点的第一印象

白屏指标怎么采集呢？我们先来回顾一下浏览器的页面加载过程：

> 客户端发起请求 -> 下载 HTML 及 JS/CSS 资源 -> 解析 JS 执行 -> JS 请求数据 -> 客户端解析 DOM 并渲染 -> 下载渲染图片-> 完成渲整体染

在这个过程中，客户端解析 DOM 并渲染之前的时间，都算白屏时间。所以，**白屏时间的采集思路如下**：`白屏时间 = 页面开始展示时间点 - 开始请求时间点`。如果你是借助浏览器的 `Performance API` 工具来采集，那么可以使用公式：`白屏时间 FP` = `domLoading - navigationStart`。

这是浏览器页面加载过程，如果放在 App场景下，就不太一样了，App下的页面加载过程：

> 初始化 WebView -> 客户端发起请求 -> 下载 HTML 及 JS/CSS 资源 -> 解析 JS 执行 -> JS 请求数据 -> 服务端处理并返回数据 -> 客户端解析 DOM 并渲染 -> 下载渲染图片 -> 完成整体渲染。

`App下的白屏时间，多了启动浏览器内核，也就是 Webview 初始化的时间`。这个时间必须通过手动采集的方式来获得，而且因为线上线下时间差别不大，线下采集即可。**具体来说，在 App 测试版本中，程序在 App 创建 WebView 时打一个点，然后在开始建立网络连接打一个点，这两个点的时间差就是 Webview 初始化的时间**。

### 卡顿指标采集

**所谓卡顿，简单来说就是页面出现卡住了的不流畅的情况**。 提到它的指标，你是不是会一下就想到 FPS（Frames Per Second，每秒显示帧数）？FPS 多少算卡顿？网上有很多资料，大多提到 FPS 在 60 以上，页面流畅，不卡顿。但事实上并非如此，比如我们看电影或者动画时，素虽然 FPS 是 30 （低于60），但我们觉得很流畅，并不卡顿。

FPS 低于 60 并不意味着卡顿，那 FPS 高于 60 是否意味着一定不卡顿呢？比如前 60 帧渲染很快（10ms 渲染 1 帧），后面的 3 帧渲染很慢（ 20ms 渲染 1 帧），这样平均起来 FPS 为95，高于 60 的标准。这种情况会不会卡顿呢？实际效果是卡顿的。因为卡顿与否的关键点在于单帧渲染耗时是否过长。

> 但难点在于，在浏览器上，我们没办法拿到单帧渲染耗时的接口，所以这时候，只能拿 FPS 来计算，只要 FPS 保持稳定，且值比较低，就没问题。`它的标准是多少呢？连续 3 帧不低于 20 FPS，且保持恒定`。

以 H5 为例，`H5 场景下获取 FPS 方案如下`：

```js
var fps_compatibility= function () {
    return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        }
    );
}();
var fps_config={
  lastTime:performance.now(),
  lastFameTime : performance.now(),
  frame:0
}
var fps_loop = function() {
    var _first =  performance.now(),_diff = (_first - fps_config.lastFameTime);
    fps_config.lastFameTime = _first;
    var fps = Math.round(1000/_diff);
    fps_config.frame++;
    if (_first > 1000 + fps_config.lastTime) {
        var fps = Math.round( ( fps_config.frame * 1000 ) / ( _first - fps_config.lastTime ) );
        console.log(`time: ${new Date()} fps is：`, fps);
        fps_config.frame = 0;    
        fps_config.lastTime = _first ;    
    };           
    fps_compatibility(fps_loop);   
}
fps_loop();
function isBlocking(fpsList, below=20, last=3) {
  var count = 0
  for(var i = 0; i < fpsList.length; i++) {
    if (fpsList[i] && fpsList[i] < below) {
      count++;
    } else {
      count = 0
    }
    if (count >= last) {
      return true
    }
  }
  return false
}
```

> 利用 `requestAnimationFrame` 在一秒内执行 `60` 次（在不卡顿的情况下）这一点，假设页面加载用时 `X ms`，这期间 `requestAnimationFrame` 执行了 `N` 次，则帧率为 `1000* N/X`，也就是`FPS`

由于用户客户端差异很大，我们要考虑兼容性，在这里我们定义 `fps_compatibility` 表示兼容性方面的处理，在浏览器不支持 `requestAnimationFrame` 时，利用 `setTimeout` 来模拟实现，在 `fps_loop` 里面完成 FPS 的计算，最终通过遍历 `fpsList` 来判断是否连续三次 fps 小于20。

如果连续判断 3次 FPS 都小于20，就认为是卡顿。

![](http://img-repo.poetries.top/images/20210503152718.png)

## 四、工具实践：性能 SDK 及上报策略设计

由于性能 SDK 最终是给各个业务使用的，所以它的设计要满足在接入性能监控平台时，简单易用和运行平稳高效，这两个要求。

### SDK 接入设计

要保证 `SDK` 接入简单，容易使用，`首先要把之前首屏、白屏和卡顿采集的脚本封装在一起，并让脚本自动初始化和运行`。

![](http://img-repo.poetries.top/images/20210503152937.png)

- 具体来说，首屏采集的`分数计算部分 API（calculateScore）`、`变化率计算的 API（calFinallScore）`和`首屏图片时间计算 API（fmpImg）`可以一起封装成 FMP API。其中首屏图片计算 API 因为比较独立，可以专门抽离成一个 util，供其他地方调用。白屏和卡顿采集也类似，可以封装成 `FP API` 和 `BLOCK API`。
- 还有一个 `ExtensionAPI` 接口，用来封装一些后续需要使用的数据，比如加载瀑布流相关的数据（将首屏时间细分为DNS、TCP连接等时间），这些数据可以通过浏览器提供的 `performance` 接口获得。

> 为了进行首屏、白屏、卡顿的指标采集，我们可以封装 `Perf API`，调用 `FMP、FP、BLOCK、ExtensionAPI` 四个 API 来完成。因为是调用 `window.performance` 接口，所以先做环境兼容性的判断，即看看浏览器是否支持 `window.performance`

最终我们接入时只要安装一个 `npm` 包，然后初始化即可，具体代码如下：

```js
 npm install @common/Perf -S;
 import { perfInit } from '@common';
 perfInit ();
```

或者以外链的形式接入：

```js
<script type="text/javascript">https://s1.static.com/common/perf/static/js/1.0.0/perf.min.js</script>
try {
  perfInit ();
} catch (err) {
  console.warn(err);
}
```

除了性能 SDK 自身的方案设计之外，提供帮助文档（如示例代码、 QA 列表等），也可以提高性能 SDK 的易用性。

具体来说，我们可以搭建一个简单的性能 SDK 网站，进入站点后，前端工程师可以看到使用文档，包括各种平台下如何接入，接入的示例代码是怎样的，接入性能 SDK 后去哪个 URL 看数据，遇到异常问题时怎么调试，等等。

### SDK 运行设计

SDK 如果想运行高效，必须有好的兼容性策略、容错机制和测试方案。

所谓兼容性策略，就是性能 SDK 可以在各个业务下都可以稳定运行。

**我们知道，前端性能优化会面临的业务场景大致有：**

- 各类页面，如平台型页面、3C 类页面、中后台页面；
- 一些可视化搭建的平台，如用于搭建天猫双十一会场页这种用于交易运行页面的魔方系统；
- 各个终端，如 PC 端，移动端，小程序端等。

这就要求性能 SDK 要能适应这些业务，及时采集性能指标并进行上报。那具体怎么做呢？

一般不同页面和终端，它们的技术栈也会不同，如 PC端页面使用 React，移动端页面使用 VUE 。这个时候，`我们可以尽可能用原生 JavaScript 去做性能指标的采集，从而实现跨不同技术栈的采集`。

> 不同终端方面，我设计了一个适配层来抹平采集方面的差异。`具体来说，小程序端可以用有自己的采集 API，如 minaFMP`，`其他端可以直接用 FMP`，这样在性能 SDK 初始化时，`根据当前终端类型的不同，去调用各自的性能指标采集 API`。

容错方面怎么做呢？

> 如果是性能 SDK 自身的报错，可以通过 `try catch` 的方式捕获到，然后上报异常监控平台。注意，不要因为 SDK 的报错而影响引入性能 SDK 页面的正常运行。

### 日志数据过滤

我的建议是，在采集性能指标之后，最好先对异常数据进行过滤。

异常数据分一般有两类，第一类是计算错误导致的异常数据，比如负值或者非数值数据，第二类是合法异常值、极大值、极小值，属于网络断掉或者超时形成的数值，比如 15s 以上的首屏时间。

负值的性能指标数据影响很大，它会严重拖低首屏时间，也会把计算逻辑导致负值的问题给掩盖掉。

### 数据抽样策略

性能 SDK 上报数据是全量还是抽象，需要根据本身 App 或者网站的日活来确定，如果日活10万以下，那抽样就没必要了。如果是一款日活千万的 App，那就需要进行数据抽样了，因为如果上报全量日志的话，会耗费大量用户的流量和请求带宽。

### 上报机制选择

一般，为了节省流量，性能 SDK 也会根据网络能力，选择合适的上报机制。在强网环境（如 `4G/WIFI`），直接进行上报；在弱网（`2G/3G`）下，将日志存储到本地，延时到强网下再上报。

除了网络能力，我们还可以让 SDK 根据 App 忙碌状态，选择合适的上报策略。如果 App 处于空闲状态，直接上报；如果处于忙碌状态，等到闲时（比如凌晨 2-3 点）再进行上报。

除此之外，还有一些其他的策略，如批量数据上报，默认消息数量达到 30 条才上报，或者只在 App 启动时上报等策略，等等。你可以根据实际情况进行选择。

![](http://img-repo.poetries.top/images/20210503153920.png)

> 采集到数据后，先对数据进行校验，如果发现数据异常则直接上报到数据异常平台（通过邮件或者钉钉通知的方式发送给开发者），反之如果数据是正常范围内的，则结合采样率来看是否需要上报。

## 五、平台实践：如何从 0 到 1 搭建前端性能平台

前端性能平台是一个 Web 系统，主要包括后台的性能数据处理和前台的可视化展示两部分

其中，数据处理后台主要是对 SDK 上报后的性能指标进行处理和运算，具体包括数据入库、数据清洗、数据计算，做完这些后，前台会对结果进行可视化展现，我们借助它就可以实时监督前端的性能情况。下图是性能平台大盘页的效果，主要对当前用户关注的性能模块进行展示，内容包括首屏时间、秒开率和采样PV。

![](http://img-repo.poetries.top/images/20210503154327.png)

那么，我们该如何搭建这样一个性能平台呢？

![](http://img-repo.poetries.top/images/20210503154342.png)

**这是具体的技术架构图，从底层到前台大致情况如下：**

- 数据接入层，主要是接收 `SDK` 上报的性能数据，做数据处理后入库，包含的技术有 `Node.js、Node-sechdule、Node-mailer`；
- 数据计算层，会对性能数据做计算处理，需要的技术有 `Kafka、Spark、Hive、HDFS`
- 存储层，包括 `MySQL + MongoDB` ，性能平台需要的数据会来这里
- 平台层，也就是展示给用户的部分，需要的技术有 `React、Ant design、Antv、Less`

### 性能数据处理后台

想要搭建性能平台，我们先来看它的性能处理后台情况。**一般性能 SDK 上报数据的处理过程是这样的**：

- 客户端借助 `SDK` 上报性能数据指标，数据接入层（图中绿色部分）接收相应数据，并做协议转换等简单处理后，作为生产者向 Kafka 写入数据；
- 数据计算层（图中橙色部分）作为消费者，从 Kafka 读数据存入 Hive（Hadoop平台的存储表），Hadoop 平台借助 Spark 做数据分析计算；
- 借助 Hive 提供的接口，数据计算层使用 SQL 语句从 Hive 拉取计算后的数据到数据库平台（MongoDB），平台层取出数据，准备数据可视化展现的数据。

**上述数据流程，对应的性能数据后台的搭建过程如下**：

1. 第一步是入库，客户端借助 SDK 上报性能数据指标后，需要后端服务层的处理，这里我们选取的是 NodeJS 做后端，利用 Controller 层对数据做处理。

为了避免数据库出现“脏数据”（如空数据、异常数据），影响后续数据处理，我们将 SDK 上报的数据通过 URL 解析成 key-value 格式的数据，对数据进行空数据删除，异常数据舍弃等操作。然后我们让数据写进消息队列 Kafka。

**为什么不是直接存入 Hive 呢？**

因为客户端上报的性能数据量和用户规模有关。如果直接入库到 Hive，遇到高并发的时候，会因为服务器扛不住而导致数据丢失。与此同时，因为数据下游（数据的使用方，如数据清洗计算平台，性能预警模块）会有多个数据接收端，直接入库的话也会造成数据重复。

所以最好我们选择 Kafka，先让数据写进消息队列。Kafka 能通过缓存，慢慢接收这些数据，降低流量洪峰压力。同时，消息队列还有接收数据后将其删除的特点，可以避免数据重复的问题。

2. 第二步，`对 Kafka 中的数据，做数据清洗和数据计算`

**数据清洗，是指针对性能上报单条数据进行核对校验的过程。所清洗的数据包括：**

- 对重复数据的处理，即同一个用户网络出错时，多次重试导致上传了好几条首屏时间相关的数据；
- 对缺失数据的处理，虽然上报了首屏时间，但白屏时间或者卡顿时间计算时没能给出；
- 对错误数据的处理，即数据超出正常范围，出现负值或者超出极大值的情况。

这几种类型数据问题如果不处理，最终会影响计算结果的准确性。那么该怎么处理呢？

- 遇到重复数据，直接去重删除即可。
- 遇到缺失数据，我们在 Spark 平台上，先根据上报的 Performance 数据进行计算补全，如果无法补全的，就直接舍弃掉，不然会出现后续无法入库的情况。
- 遇到超出正常范围的数据，如负值或者超过 10 秒以上的数据，把它当作无效数据，直接舍弃掉。

> 做完数据清洗之后，我们还需要`使用 Spark 做数据计算，为可视化展现准备数据`。具体需要做以下数据计算：

- 首屏时间分布的计算，`1s ～ 2s` 占比多少，`2s ～ 4s` 占比多少；
- 秒开率的计算，首屏时间小于等于 1 秒的数据占比；
- 页面瀑布流时间的计算。

其中，页面瀑布流时间是对首屏时间的细分，`包括 DNS 查询、TCP链接、请求耗时、内容传输、资源解析、DOM 解析和资源加载的时间`。这些细分时间点，是我们根据 SDK 上报的 Performance 接口数据指标计算出来的，前端工程师根据页面瀑布流时间，可以快速定位性能瓶颈点出现在哪个环节。

3. 第三步，准备性能前台所需的可视化数据

为了完成前台展现，性能平台需要登录功能，还需要做一些用户关注的模块信息，比如前端开发者添加关注的业务模块。我们可以用关系数据库去存储这些数据，具体可以选择 MySQL完成账号权限系统和关注业务模块对应的数据表。

而性能数据，因为都是单条性能信息，相互之间并没有什么关系，可以用 MongoDB 做存储。具体来说，我们可以用 NodeJS 提供的定时脚本（Node-sechdule）从 Spark 取到数据导入到 MongoDB 中。

### 前端数据可视化展示前台

前端数据可视化展现前台，整体上只有两个页面，大盘页和详情页。

大盘页包括一个个业务的性能简图。每一个性能简图包括首屏时间、秒开率、采样 PV 数据。点击性能简图上的“进入详情”链接，就可以进入详情页。初次进入大盘页的时候，需要你登录并关注相关的业务，然后就可以在大盘首页看到相关的性能情况。

详情页的设计的初衷是为了对性能简图做进一步的补充，除了展示对应性能简图的秒开率、性能均值细节、白屏均值细节之外，还会展示终端信息，比如多少比例在IOS端，多少比例在Android端，以方便用户根据不同场景去做优化。

![](http://img-repo.poetries.top/images/20210503160942.png)

> 同时，为了解秒开率不达标原因或者首屏时间变慢的细节在哪里，我们会给出页面加载瀑布流，前面数据处理阶段已经提到可以使用的数据（包括 DNS 查询、TCP链接、请求耗时、内容传输、资源解析、DOM 解析和资源加载的时间），套用 AntV （阿里巴巴集团的数据可视化方案）的瀑布流模板即可完成数据展现。

![](http://img-repo.poetries.top/images/20210503161021.png)

**那么，大盘页和详情页如何实现的呢？**

首先是前端展示技术栈的选择，对应技术架构图中的淡黄色部分，因为这两个页面都属于 PC 端后台页面，主要给公司前端开发者使用，功能上更多是数据可视化展示，非常适合用 React 技术栈做开发。

为了更好实现首屏时间、秒开率和采用 PV 的功能效果，我们使用 AntdPro 的模板，相关的配套的数据可视化方案，我推荐 Antv，因为它能够满足我们在首屏时间、秒开率等性能指标的展示需求，用起来比较简单（开箱即用），功能灵活且扩展性强（比如秒开率部分，要自定义一些图形，能够较好满足）。

大盘页和详情页的数据展示效果比较丰富多样，相应的 CSS 代码逻辑就比较复杂，为了让 CSS代码更容易维护和扩展，CSS 方面可以选用 Less 框架。

接下来是前后端交互方面，为了让前后台更独立，大盘页、详情页与后端的通信通过 HTTP 接口来实现，使用 nginx 作为 Web Server。为了让传输更高效，我们采用 compression 对 HTTP 传输内容进行 GZip 压缩处理。

最后是后台服务部分，为了让性能平台开发过程更简单，效率更高，同时平台本身的性能体验更流畅，后台服务方面可以选用 Egg.js（基于 NodeJS 的开发框架）做开发，进行数据处理和存储服务。

为了解决监控预警的问题，我们借助 `Node-schedule` 做调度和定时任务的处理，通过 `node-mailer` 进行邮件报警

![](http://img-repo.poetries.top/images/20210503161251.png)

## 六、诊断清单：如何实现监控预警并进行问题诊断

### 监控预警

监控预警部分，我们借助 Node-schedule 做调度和定时任务的处理，通过 node-mailer 进行邮件报警。具体来说我们通过以下几步来实现。

**第一步，准备预警数据**

在做完数据清洗之后，一个分支使用 `Spark` 做计算，另外一个分支使用 `Flink` 实时数据计算。这两者的区别在于后者的数据是实时处理的，因为监控预警如果不实时的话，就没有意义了。有关数据的处理，我是这样做的：超过 2s 的数据，或者认定为卡顿的数据，直接标记为预警数据。实际当中你也可以根据情况去定义和处理。

**第二步，我们借助 Node-schedule**，用一批定时任务将预警数据通过 Node.js，拉取数据到 MongoDB 的预警表中。

**第三步，预警的展示流程**。根据预警方式不同，样式展示也不同。具体来说，预警的方式有三种：企业微信报警通知、邮件报警通知、短信报警通知。

以手机列表页为例，性能标准是首屏时间 1.5s，秒开率 90%，超过这个标准就会在性能平台预警模块展示，按照严重程度倒序排列展示。如果超出 10%，平台上会标红展示，并会发企业微信报警通知；如果超过 20%，会发借助 `node-mailer` 做邮件报警；如果超出 30%，会发短信报警通知。

注意，预警通知需要用到通信资源，为了避免数据量太大而浪费资源，一般对 App 首页核心的导航位进行页面监控即可。

### 问题诊断

当预警功能做好后，前端性能平台就可以对重要指标进行实时监督了。当发现性能问题——不论是我们自己发现还是用户反馈，都需要先对问题进行诊断，然后看情况是否需要进一步采取措施。

一般问题诊断时需要先确认是共性问题还是个例问题。如果是共性问题，那接下来我们就开始诊断和优化；如果是个例问题，是因为偶发性因素导致的（如个人的网络抖动、手机内存占用太多、用户连了代理等），则不需要进行专门优化。

![](http://img-repo.poetries.top/images/20210503161715.png)

## 七、优化手段：首屏秒开的 4 重保障

### 懒加载

懒加载是性能优化的前头兵。什么叫懒加载呢？懒加载是指在长页面加载过程时，先加载关键内容，延迟加载非关键内容。比如当我们打开一个页面，它的内容超过了浏览器的可视窗口大小，我们可以先加载前端的可视区域内容，剩下的内容等它进入可视区域后再按需加载。

具体怎么做呢？我们可以先根据手机的可视窗口，估算需要多少条数据，比如京东 App 列表页是 4 条数据，这时候，先从后端拉取 4 条数据进行展现，然后超出首屏的内容，可以在页面下拉或者滚动时再发起加载。

那么如果首页当中图片比较多，比如搜索引擎产品的首页，如何保证首屏秒开呢？同样也可以采用懒加载。以百度图片列表页为例，可视区域范围内的图片先请求加载，一般会根据不同手机机型估算一个最大数据，比如 ihone12 Pro 屏幕比较大， 4 行 8 条数据，我们就先请求 8 条数据，用来在可视区域展示，其他位置采用占位符填充，在滑动到目标区域位置后，才使用真实的图片填充。这样，通过使用懒加载，可以最大限度降低了数据接口传输阶段的时间。

### 缓存

如果说懒加载本质是提供首屏后请求非关键内容的能力，那么缓存则是赋予二次访问不需要重复请求的能力。在首屏优化方案中，接口缓存和静态资源缓存起到中流砥柱的作用。

### 接口缓存

接口缓存的实现，如果是端内的话，所有请求都走 Native 请求，以此来实现接口缓存。为什么要这么做呢？

App 中的页面展现有两种形式，使用 Native 开发的页面展现和使用 H5 开发的页面展现。如果统一使用 Native 做请求的话，已经请求过的数据接口，就不用请求了。而如果使用 H5 请求数据，必须等 WebView 初始化之后才能请求（也就是串行请求），而 Native 请求时，可以在 WebView 初始化之前就开始请求数据（也就是并行请求），这样能有效节省时间。

那么，如何通过 Native 进行接口缓存呢？**我们可以借助 SDK 封装来实现，即修改原来的数据接口请求方法，实现类似 Axios 的请求方法。**具体来说就是，把包括 post、Get 和 Request 功能的接口，封装进 SDK 中。

这样，客户端发起请求时，程序会调用 SDK.axios 方法，WebView 会拦截这个请求，去查看 App 本地是否有数据缓存，如果有的话，就走接口缓存，如果没有的话，先向服务端请求数据接口，获取接口数据后存放到 App 缓存中。

### 静态资源缓存

数据接口的请求一般来说较少，只有几个，而静态资源（如 JS、CSS、图片和字体等）的请求就太多了。以京东首页为例，177 个请求中除了 1 个文档和 1 个数据接口外，其余都是静态资源请求。

那么，如何做静态缓存方案呢？这里有两种情况，一种是静态资源长期不需要修改，还有一种是静态资源修改频繁的

资源长期不变的话，比如 1 年都不怎么变化，我们可以使用强缓存，如 Cache-Control 来实现。具体来说可以通过设置 Cache-Control:max-age=31536000，来让浏览器在一年内直接使用本地缓存文件，而不是向服务端发出请求。

至于第二种，**如果资源本身随时会发生改动的，可以通过设置 Etag 实现协商缓存** 具体来说，在初次请求资源时，设置 Etag（比如使用资源的 md5 作为 Etag），并且返回 200 的状态码，之后请求时带上 `If-none-match` 字段，来询问服务器当前版本是否可用。如果服务端数据没有变化，会返回一个 304 的状态码给客户端，告诉客户端不需要请求数据，直接使用之前缓存的数据即可

### 离线化

离线化是指线上实时变动的资源数据静态化到本地，访问时走的是本地文件的方案。说到这里，你是不是想到了离线包？离线包是离线化的一种方案，是将静态资源存储到 App 本地的方案，不过，在这里，我重点讲的是离线化的另一个方案——把页面内容静态化到本地。

离线化一般适合首页或者列表页等不需要登录页面的场景，同时能够支持 SEO 功能。那么，如何实现离线化呢？其实，打包构建时预渲染页面，前端请求落到 index.html 上时，已经是渲染过的内容。此时，可以通过 Webpack 的 `prerender-spa-plugin `来实现预渲染，进而实现离线化。Webpack 实现预渲染的代码示例如下：

```js
// webpack.conf.js
var path = require('path')
var PrerenderSpaPlugin = require('prerender-spa-plugin')
module.exports = {
  // ...
  plugins: [
    new PrerenderSpaPlugin(
      // 编译后的html需要存放的路径
      path.join(__dirname, '../dist'),
      // 列出哪些路由需要预渲染
      [ '/', '/about', '/contact' ]
    )
  ]
}
```

### 并行化

懒加载、缓存和离线化都是在请求本身上下功夫，想尽办法减少请求或者推迟请求，并行化则是在请求通道上功夫，解决请求阻塞问题，进而减少首屏时间。 这就像解决交通阻塞一样，除了限号减少车辆，还可以增加车道数量，我们在处理请求阻塞时，也可以加大请求通道数量——借助于HTTP 2.0 的多路复用方案来解决。

HTTP 1.1 时代，有两个性能瓶颈点，串行的文件传输和同域名的连接数限制（6个），到了HTTP 2.0 时代，因为提供了多路复用的功能，传输数据不再使用文本传输（文本传输必须按顺序传输，否则接收端不知道字符的顺序），而是采用二进制数据帧和流的方式进行传输。

其中，帧是数据接收的最小单位，流是连接中的一个虚拟通道，它可以承载双向信息。每个流都会有一个唯一的整数 ID 对数据顺序进行标识，这样接收端收到数据后，可以按照顺序对数据进行合并，不会出现顺序出错的情况。所以，在使用流的情况下，不论多少个资源请求，只要建立一个连接即可。

文件传输环节问题解决后，同域名连接数限制问题怎么解决呢？以 Nginx 服务器为例，原先因为每个域名有 6 个连接数限制，最大并发就是 100 个请求，采用 HTTP 2.0 之后，现在则可以做到 600，提升了 6倍。

你一定会问，这不是运维侧要做的事情吗，我们前端开发需要做什么？我们要改变静态文件合并（JS、CSS、图片文件）和静态资源服务器做域名散列这两种开发方式。

具体来说，使用 HTTP 2.0 多路复用之后，单个文件可以单独上线，不需要再做 JS 文件合并了。因为原先遇到由 A 和 B 组成的 C 文件，其中 A 文件稍微有点修改，整个C 文件就需要重新加载的情况，如今由于没有同域名连接数限制了，也就不需要了。

![](http://img-repo.poetries.top/images/20210503162414.png)

## 八、优化手段：白屏 300ms 和界面流畅优化技巧

### 白屏优化

现在我们假设一个场景，有一天你想要在某电商 App 上买个手机，于是你搜索后进入商品列表页，结果屏幕一片空白，过了好久还是没什么内容出现，这时候你是不是会退出来，换另外一个电商 App 呢？这就是白屏时间过长导致用户跳出的情形。

作为前端开发者，我们遇到这种问题如何解决呢？首先去性能平台上查看白屏时间指标，确认是否是白屏问题。问题确认后，我们可以基于影响白屏时间长短的两个主要因素来解决——DNS 查询和首字符展示。

### DNS 查询优化

DNS 查询是指浏览器发起请求时，需要将用户输入的域名地址转换为 IP 地址的过程，这个转换时间长短就会影响页面的白屏时间。

那么如何对 DNS 查询进行优化呢？根据 DNS 查询过程，我们可以从前端和客户端这两部分采取措施。

前端侧，可以通过在页面中加入 `dns-prefetch`，在静态资源请求之前对域名进行解析，从而减少用户进入页面的等待时间。如下所示：

```
<meta http-equiv="x-dns-prefetch-control" content="on" />
<link rel="dns-prefetch" href="https://s.google.com/" >
```

其中第一行中的 `x-dns-prefetch-control` 表示开启 `DNS` 预解析功能，第二行 `dns-prefetch` 表示强制对 `s.google.com` 的域名做预解析。这样在 `s.google.com` 的资源请求开始前，`DNS` 解析完成，后续请求就不需要重复做解析了。不要小看这个标签哦，它可以为你减少 `150ms` 左右的 DNS 解析时间。

客户端侧呢？可以在启动 App 时，同步创建一个肉眼不可见的 WebView（例如 1*1 像素的 webview），将常用的静态资源路径写入这个 WebView 中，然后对它做域名解析并放入缓存中。这样后面需要使用 WebView 打开真正所需的页面时，由于已经做过域名解析了，客户端直接从缓存中获取即可。

当然如果是端外页面，因为没在 App 里面，就没法使用 `1*1 WebView` 的策略了，我们可以使用 `iframe` ，也能达到类似效果。

以上是一个轻量级的方案，通过它可以将 DNS 解析时间控制在 `400ms` 以内（这个算是比较快的）。如果你想要将耗时进一步压缩，比如控制在 200ms，此时就需要一个重量级的方案了。具体来说，可以采用 IP 直连方式，原来是请求 `www.google.com`，现在我们通过调用 SDK 进行域名解析，拿到对应的 IP（如 6.6.6.6），然后直接请求这个 IP 地址拿到数据。

当然，这个实现起来需要避过许多坑，比如，HTTPS 证书和配置文件。

`Https` 证书是指当客户端使用 IP 直连时，请求 URL 中的 host 会被替换成对应的 IP，所以在证书验证时，会出现 domain 不匹配的情况，导致 SSL/TLS 握手不成功。

怎么解决呢？在非 SNI（Server Name Indication，表示单 IP多域名）的场景下，可以把证书验证环节独立出来 （如 Hook证书校验环节），然后将 IP 替换为原来的域名。在 SNI 场景下，可以定制 `SSLSocketFactory`，在 createSocket 时替换为 IP，并进行 SNI/HostNameVerify 配置。

而配置文件方面，一般在域名只有两三个的情况时，我们可以用到它来做 IP 和域名的映射。但随着机房的扩大，每次扩机器都要升级配置文件，后续会非常麻烦。

对此我们可以采用 httpDNS 来解决。这是因为 httpDNS 可以准确调度到对应区域的服务器 IP 地址给用户，同时还可以避免运行商 DNS 劫持。具体来说， SDK 会通过发报文（类似系统向 DNS 运营商发的报文）向 httpDNS 做一个 HTTP 请求（也是通过 IP 直接请求），请求通过后拿到对应域名，然后进行 IP 直连，完成资源或者数据接口请求。

### 首字符展示优化

所谓首字符展示，通常我们会在页面加载过程中出现一个 loading 图，用来告诉用户页面内容需要加载，请耐心等待。但这样一个 loading 图既无法让用户感受到页面加载到什么程度，也无法给用户视觉上一个焦点，让人们的注意力集中在上面。

如何解决这个问题呢？我们可以使用骨架屏。骨架屏（Skeleton Screen）是指在页面数据加载完成前，先给用户展示出页面的大致结构（灰色占位图），告诉用户页面正在渐进式地加载中，然后在渲染出实际页面后，把这个结构替换掉。骨架屏并没有真正减少白屏时间，但是给了用户一个心理预期，让他可以感受到页面上大致有什么内容。

那么，如何构建骨架屏呢？因为考虑到每次视觉修改或者功能迭代，骨架屏都要配合修改，我建议采用自动化方案，而不是手动骨架屏方案（也就是自己编写骨架屏代码）。骨架屏的实现方法有以下三个步骤。

- 步骤一，确定生成规则，遍历所有的 DOM 元素。针对特定区块（如视频、音频）生成相应的代码块，获取原始页面中 DOM 节点的宽度、高度和距离视窗的位置，计算出当前设备快高对应的大小，转换成相应的百分比，然后来适配不同的设备。
- 步骤二，基于上述规则结合 CLI 工具可以通过脚手架自动生成骨架屏
- 步骤三，将骨架屏自动化注入页面，再利用 Puppeteer 把骨架屏代码注入页面中自动运行。整个过程比较复杂，且有不少坑

以上就是白屏时间优化方面相关的内容，但即便首屏展示比较快，如果有卡顿的现象，用户操作也会很不流畅，那怎么解决这个问题呢。下面我们就讲聊聊卡顿治理。

### 卡顿治理

卡顿现象，一般可以通过用户反馈或性能平台来发现。比如我们接到用户说某页面比较卡，然后在性能平台上查看卡顿指标后，发现页面出现连续 5 帧超过 50ms ，这就属于严重卡顿。如何处理呢？

首先也还是问题的定位，先通过 charles 等工具抓包看一下数据接口，如果是和数据相关的问题，找后端同事，或者用数据缓存的方式解决。如果问题出在前端，一般和以下两种情形有关：`浏览器的主线程与合成线程调度不合理，以及计算耗时操作`。

### 浏览器的主线程与合成线程调度不合理

比如，在某电商 App 页面点击抽奖活动时，遇到一个红包移动的效果，在红包位置变化时，页面展现时特别卡，这就是主线程和合成线程调度的问题。怎么解决呢？

一般来说，主线程主要负责运行 JavaScript，计算 CSS 样式，元素布局，然后交给合成线程，合成线程主要负责绘制。当使用 height、width、margin、padding 等作为 transition 值时，会让主线程压力很大。此时我们可以使用 transform 来代替直接设置 margin 等操作。

比如红包元素从 margin-left:-10px 渲染到 margin-left:0，主线程需要计算样式 margin-left:-9px，margin-left:-8px，一直到 margin-left:0，每一次主线程计算样式后，合成线程都需要绘制到 GPU 再渲染到屏幕上，来来回回需要进行 10 次主线程渲染，10 次合成线程渲染，这给浏览器造成很大压力，从而出现卡顿。

如何解决呢？我们可以利用 transform 来做，比如 tranform:translate(-10px,0) 到 transform:translate(0,0)，主线程只需要进行一次tranform:translate(-10px,0) 到 transform:translate(0,0)，然后合成线程去一次将 -10px 转换到 0px。这样的话，总计 11 次计算，可以减少 9 步操作，假设一次 10ms，将减少 90ms。

### 计算耗时操作

除了主线程和合成线程调度不合理导致的卡顿，还有因为计算耗时过大导致的卡顿。遇到这类问题，一般有两种解法：空间换时间和时间换空间。

空间换时间方面，比如你需要频繁增加删除很多 DOM 元素，这时候一定会很卡，在对 DOM 元素增删的过程中最好先在 DocumentFragment （DOM文档碎片）上操作，而不是直接在 DOM上操作。只在最后一步操作完成后，将所有 DocumentFragment 的变动更新到 DOM上，从而解决频繁更新 DOM 带来的卡顿问题。

至于时间换空间，一般是通过将一个复杂的操作细分成一个队列，然后通过多次操作解决复杂操作的问题。

![](http://img-repo.poetries.top/images/20210503163046.png)

## 九、JS SDK 设计

![](http://img-repo.poetries.top/images/20210503170316.png)

### Performance

网站的性能怎么样。不能单单是靠某种工具去检测，就能得出的结果。因为影响它的因素有很多（dns解析、网络、缓存...）

> `Performance`是一个做前端性能监控离不开的`API`，最好在页面完全加载完成之后再使用，因为很多值必须在页面完全加载之后才能得到。最简单的办法是在`window.onload`事件中读取各种数据。

**1. 页面加载**

> 一个页面的请求到响应再到显示出来，需要经过下面一些重要过程，当我们在浏览器输入一个`URL`或者说点击一个`URL`开始，会出现如下流程

- 页面准备
- 重定向：在`header`定义了重定向才会有这个过程，如果没有重定向，不会产生这个过程。
- `app cache`：会先检查这个域名是否有缓存，如果有缓存就不需要DNS解析域名。这里的`app`是值应用程序`application`，不指手机`app`。
- `DNS`解析：把域名解析成`IP`，如果直接用`ip`地址访问，不产生这个过程。
- `TCP`连接：`http`协议是经过`TCP`来传输的，所以产生一个`http`请求就会有`TCP connect`，但是依赖于长连接，不会产生这个过程。
- `request header`：请求头信息。
- `request body`：请求体信息，比如`get`请求是没有请求体信息的，所以没有这个过程，这就是为什么把头跟体分开写的原因。
- `response header`：响应头信息。
- `response body`：响应体信息。
- 解析`HTML`结构
- 加载外部脚本和样式表文件：正常来说`JS`、`css`都是外部加载的，当然有不正常的人啊，比如我。
- 解析并执行脚本代码
- 构建与解析`HTML DOM`树：这个过程可以去了解下`DOM`树是怎样的就明白啦。
- 加载外部图片
- 页面加载完成，显示出来啦

**2. 重定向分析**

- `app cach`
- `DNS`解析
- `TCP`连接
- `request header`
- 重定向
- `app cach`
- `DNS`解析
- `TCP`连接
- `request header`

**3. performance.timing**

> 这个API能帮我们得到整个页面请求的时间，如下图，在`Chrome`的`Console`是可以直接运行的

![](http://img-repo.poetries.top/images/20210503170506.png)

先解释下这些时间都是代表什么

**timing 对象里边的数据比较多，梳理如下几个关键性的节点**

- `fetchStart`：发起获取当前文档的时间点，我的理解是浏览器收到发起页面请求的时间点；
- `domainLookupStart`：返回浏览器开始`DNS`查询的时间，如果此请求没有`DNS`查询过程，如长连接、资源`cache`、甚至是本地资源等，那么就返回`fetchStart`的值；
- `domainLookupEnd`：返回浏览器结束`DNS`查询的时间，如果没有`DNS`查询过程，同上；
- `connectStart`：浏览器向服务器请求文档，开始建立连接的时间，如果此连接是一个长连接，或者无需与服务器连接（命中缓存），则返回`domainLookupEnd`的值；
- `connectEnd`：浏览器向服务器请求文档，建立连接成功的时间；
- `requestStart`：开始请求文档的时间（注意没有`requestEnd`）;
- `responseStart`：浏览器开始接收第一个字节数据的时间，数据可能来自于服务器、缓存、或本地资源；
- `unloadEventStart`：卸载上一个文档开始的时间；
- `unloadEventEnd`：卸载上一个文档结束的时间；
- `domLoading`：浏览器把`document.readyState`设置为`“loading”`的时间点，开始构建`dom`树的时间点；
- `responseEnd`：浏览器接收最后一个字节数据的时间，或连接被关闭的时间；
- `domInteractive`：浏览器把`document.readyState设`置为`“interactive”`的时间点，`DOM`树创建结束；
- `domContentLoadedEventStart`：文档发生`DOMContentLoaded`事件的时间；
- `domContentLoadedEventEnd`：文档的`DOMContentLoaded`事件结束的时间；
- `domComplete`：浏览器把`document.readyState`设置为`“complete”`的时间点；
- `loadEventStart`：文档触发`load`事件的时间；
- `loadEventEnd`：文档出发`load`事件结束后的时间

> 再来一张图，表示各阶段的开始与结束对应的时间

![](http://img-repo.poetries.top/images/20210503170539.png)

> 从以上的分析，我们就可以得到一些时间的计算

- 准备新页面耗时：`fetchStart - navigationStart`
- 重定向时间：`redirectEnd - redirectStart`
- `App Cache`时间：`domainLookupStart - fetchStart`
- `DNS`解析时间：`domainLookupEnd -domainLookupStart`
- `TCP`连接时间：`connectEnd - connectStart`
- `request`时间：`responseEnd - requestStart`这个计算是代表请求响应加起来的时间
- 请求完毕到`DOM`树加载：`domInteractive -responseEnd`
- 构建与解析`DOM`树，加载资源时间：`domCompleter -domInteractive`
- `load`时间：`loadEventEnd - loadEventStart`
- 整个页面加载时间：`loadEventEnd -navigationStart`
- 白屏时间：`responseStart-navigationStart`

```js
 let timing = performance.timing

// DNS 解析耗时
timing.domainLookupEnd - timing.domainLookupStart

// TCP 连接耗时
timing.connectEnd - timing.connectStart

// SSL 安全连接耗时
timing.connectEnd - timing.secureConnectionStart

// 网络请求耗时
timing.responseStart - timing.requestStart

// 数据传输耗时
timing.responseEnd - timing.responseStart

// DOM 解析耗时
timing.domInteractive - timing.responseEnd

// 资源加载耗时
timing.loadEventStart - timing.domContentLoadedEventEnd 

/* 关键性能指标 */

// 首包时间
timing.responseStart - timing.domainLookupStart

// 白屏时间
timing.responseStart - timing.navigationStart 

// 首次可交互时间
timing.domInteractive - timing.requestStart 

// HTML 加载完成时间， 即 DOM Ready 时间
timing.domContentLoadedEventEnd - timing.navigationStart

// 页面完全加载时间
timing.loadEventStart - timing.navigationStart
```

**4. performance.getEntries()**

> 这个API能帮我们获得资源的请求时间，包括JS、CSS、图片等

![](http://img-repo.poetries.top/images/20210503170603.png)

> 如上图可以看到这个API请求返回的是一个数组，这个数组包括整个页面所有的资源加载，上图打开了一个其中一个资源，可以看到如下信息

- `entryType`：类型为`resource`
- `name`：资源的`url`
- `initiatorType`：资源是`link`
- 资源时间：`duration`的值，是`responseEnd - startTime`得到的

**performance.memory**

> 这个API主要是得到浏览器内存情况

- `jsHeapSizeLimit`：内存大小限制
- `totalJSHeapSize`：可使用的内容
- `userdJSHeapSize`：已使用的内容

> `userdJSHeapSize`表示所有被使用的JS堆栈内存，`totalJSHeapSize`可使用的JS堆栈内存，如果`userdJSHeapSize`的值大于`totalJSHeapSize`，就可能出现内存泄漏

![](http://img-repo.poetries.top/images/20210503170616.png)

**5. getEntriesByType**

这个 [API](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEntry/entryType) 可以让我们通过传入 `type` 获取一些相应的信息：

- frame：事件循环中帧的时间数据。
- resource：加载应用程序资源的详细网络计时数据
- mark：`performance.mark` 调用信息
- measure：`performance.measure` 调用信息
- longtask：长任务（执行时间大于 50ms）信息。这个类型已被废弃（文档未标注，但是在 Chrome 中使用会显示已废弃），我们可以通过别的方式来拿
- navigation：浏览器文档事件的指标的方法和属性
- paint：获取 FP 和 FCP 指标

最后两个 `type` 是性能检测中获取指标的关键类型。当然你如果还想分析加载资源相关的信息的话，那可以多加上 `resource` 类型。

**6. PerformanceObserver**

`PerformanceObserver `也是用来获取一些性能指标的 API，用法如下：

```js
const perfObserver = new PerformanceObserver((entryList) => {
    // 信息处理
})
// 传入需要的 type
perfObserver.observe({ type: 'longtask', buffered: true })
```

> 结合 `getEntriesByType` 以及 `PerformanceObserver`，我们就能获取到所有需要的指标了。


### 错误监控

**js 运行时报错**

> 为了更好的保证网站正常的运行，我们会通过`window.onerror`捕获，js具体的堆栈信息和错误行和列。一般我们的js都是打包压缩、混淆后上传到cdn的（无法定位到具体错误）。因此在打包时，同时生产`.map`文件，用 `sourcemap` js库（nodejs）来还原具体错误信息

**资源加载出错**

> 为了防止加载资源失败，而导致网站打不开。一般我们会通过 `window.addEventListener('error')` 对资源加载进行监控。

**后端api接口监控**

> 一般对于小公司而言，可能连后端都很少会有接口方面的监控。一旦出现问题，却又不好排查问题，因此我们可以通过对浏览器底层的xhr对象进行拦截，上报相关调用数据和接口耗时。一方面可以检测到接口的实时调用情况，同时也方便后期对接口的数据统计。

![](http://img-repo.poetries.top/images/20210503175341.png)

### 数据处理和展示

用到 `es（elasticsearch）`来对数据进行实时查询和分析。可是怎么把数据推到es里面呢？这对于前端同学来说，这又是一个难点。别急，“logstash” 了解一下。logstash主要对数据进行采集、分析、过滤的工具，然后推送到es里面。数据既然有了，那么怎么展示呢？这时候 Kibana 出来了，来作为数据展示的承托。这就是后端开源届的日志分析系统“ELK”。

![](http://img-repo.poetries.top/images/20210503175506.png)

其实对于数据的展示，可以不用kibana或者其他开源的产品进行展示，也可以自己通过es的restful接口，来搭建数据展示

![](http://img-repo.poetries.top/images/20210503175531.png)

## 十、前端监控系统实战

### 没有前端监控下的痛点有哪些

- 用户反馈点击某个按钮没有任何反应。（没办法知道用户点了按钮，为什么没反应呢？是js报错导致，还是其它原因导致？）
- 用户反馈打开页面很慢。（没办法感知用户慢在什么地方）
- 调用后端api接口出错，无法第一时间感知。（只能被动等待用户告诉和自己去发现）
- 网站静态资源加载出错，导致网站打不开。
- 上报的js错误信息，怎么反解析出源代码报错位置。

![](http://img-repo.poetries.top/images/20210503175936.png)

### 手动搭建一个前端监控系统

在搭建前端监控系统开始之前，我们先来了解下整个系统的架构是怎么样的。因为你只有了解到流程是怎样走的，才清楚每个步骤我们该做些什么事情。

![](http://img-repo.poetries.top/images/20210503180034.png)

### JS SDK 功能设计

**1. 监控js错误信息上报**

通过`window.onerror`方法，对页面js错误进行监控。上报具体的错误信息和堆栈信息（如下图），利用`webpack/gulp打包出来的.map文件`，来解析出具体的错误信息。

![](http://img-repo.poetries.top/images/20210503180112.png)

nodejs通过上传.map文件，解析出具体错误信息。代码如下：

```js
let sourceMap = require('source-map');

let _sourceMap = fs.readFileSync(resolve(`${name}`), 'utf-8')

// 通过sourceMap库转换为sourceMapConsumer对象  
let consumer = await new sourceMap.SourceMapConsumer(_sourceMap);
// 传入要查找的行列数，查找到压缩前的源文件及行列数  
let sm = consumer.originalPositionFor({
    line: line, column: column
});
// 压缩前的所有源文件列表  
let sources = consumer.sources;
// 根据查到的source，到源文件列表中查找索引位置  
let smIndex = sources.indexOf(sm.source);
// 到源码列表中查到源代码  
let smContent = consumer.sourcesContent[smIndex];
// 将源代码串按"行结束标记"拆分为数组形式  
const rawLines = smContent.split(/\r?\n/g);
// 输出源码行，因为数组索引从0开始，故行数需要-1  
let errInfo = []
errInfo.push({
    line: sm.line - 2,
    text: rawLines[sm.line - 2]
})
errInfo.push({
    line: sm.line - 1,
    text: rawLines[sm.line - 1]
})
errInfo.push({
    line: sm.line,
    text: rawLines[sm.line]
}) 

this.ctx.body = JSON.stringify({
  code: 1,
  data: errInfo,
  msg: 'success'
})
```

首先在管理后台，上传对应错误js的map文件，最终还原效果图如下：

![](http://img-repo.poetries.top/images/20210503180234.png)

通过上图，我们可以快速定位错误的具体位置，大大节省了排查错误的时间。

**2. api接口调用请求上报**

> 可能有些朋友会好奇，怎么去实时监听ajax异步接口请求情况呢？其实很简单：首先我们先通过代理XMLHttpRequest对象，来实现对ajax异步请求进行数据劫持。如下图：

![](http://img-repo.poetries.top/images/20210503180304.png)

通过上图不难发现，我们通过xhr对象的`onreadystatechange`事件进行劫持，针对后端api接口返回的数据，进行处理上报接口的调用情况，因此达到实时监控接口调用情况，是不是觉得很神奇！

如有同学想了解这块内容具体的代码，github社区有开源的模块，可自行查看： [https://github.com/wendux/Ajax-hook](https://github.com/wendux/Ajax-hook)

根据需要统计哪些数据进行上报，比如`:page query`参数、api接口请求数据...方便后续出错，定位问题。如下图：

![](http://img-repo.poetries.top/images/20210503180352.png)

**3. 页面性能数据上报**

> 关于页面性能数据，我们一般通过浏览器`performance.timingAPI`来进行上报

**各阶段耗时图**

![](http://img-repo.poetries.top/images/20210503180431.png)

**关键性能指标图**

![](http://img-repo.poetries.top/images/20210503180455.png)

**4. 能支持自定义数据上报**

> 上述一般都是自动进行错误采集进行上报，但有些情况是需要我们手动调用进行上报（自定义数据的埋点）。因此sdk的设计，最好支持手动调用上报。

```js
let report = new Reort({
    参数配置...
})

// get 上报
report.getRport({xxx: 111}, (data) => {
    Consoel.log('上报回调的数据：', data)

})


// post 上报
report.postRport({xxx: 111}, (data) => {
    Consoel.log('上报回调的数据：', data)

})
```

**关于SDK设计的时候，需要注意的以下几点：**

- SDK上报采用哪种方式比较好。一般来说采用`get`（`image`方式上报，因为它避免的跨域的限制，目前也是业界主流的上报方式）
- 在SDK上报方式，最好设计`get`和`post`两种方式上报。因为有些复杂的数据结构，采用post上报，在服务端解析会比较方便。
- 当网站每天的pv很大时，要支持抽样上报，减少服务器资源。（一般做法，通过每次随机一个数值，来跟预设定的值做比较）
- 如有想对一些错误信息不需要上报，要支持排查哪些错误信息上报。
- 如果针对`get`上报时，一般是在`xx.gif`后带参数，一定要对参数进行转义，不然在某些场景下会报错！
- 针对采集`page`参数时，也要进行`encodeURIComponent`进行转义，不然在某些场景下会报错！
- 要支持站点级别的功能，因为你想要接入不同的项目。就得根据不同的做区分和报警设置。思路很简单通过增加一个站点id值，来作为后续数据的筛选条件。比如：`pid`

### 服务端接收数据，并记录日志

> sdk设计好了，上报数据也有了。现在我们开始设计服务怎么接收和处理数据。以Nodejs为例：

![](http://img-repo.poetries.top/images/20210503180707.png)

> 通过上图不难发现，我们通过接收到参数，然后通过decode解析出参数，并对参数进行处理。利用 nodejs `file-stream-rotator` 这个库，把数据写入本地到日志中。(不过在写入日志的时候，记得对一些数据进行校检。

比如：不存在站点id，不给写入。对于外部网站的接口请求，不给写入。通过实战来看，有些情况，竟然会把UC浏览器部分请求给抓上来，所以需要过滤处理)

### 数据收集与过滤

> 当数据写入日志文件中，通过Logstash监测日志变化，收集到数据并对数据进行格式化和过滤处理，并收集推送到ES（数据存储）。

比如利用`geoip`和`useragent`插件，分别对ip和浏览器的UA进行解析，分别得到对应的地理位置信息和浏览器相关距离信息。如下图：

![](http://img-repo.poetries.top/images/20210503180802.png)

关于`logstash`的安装和配置，在这里不多说啦，可自行google安装配置。（建议使用docker版本，简单省事）

### 数据存储（ES）提供分析和查询能力

> 通过ES（elasticsearch）提供对应的restful api，手动搭建数据大盘（或者用kibana）。对于es数据管理，前期可以先安装一个es-head的插件，来查看数据情况。

![](http://img-repo.poetries.top/images/20210503180831.png)

> 关于修改`es header 5.0 request content-type` 不对的情况。可以对 `/usr/src/app/_site/ vendor.js` 文件进行修改。以docker镜像为例：

1. 从从镜像`copy vendor.js`文件出来，如：

```
docker cp elasticsearch-head:/usr/src/app/_site/vendor.js /Users/duanliang/logstash
```

2. 修改ajax 请求`content-type`

```
大约在6886行
/contentType: "application/x-www-form-urlencoded
改成
contentType: "application/json;charset=UTF-8"
```

3. 把文件copy回容器

```
docker cp /Users/duanliang/logstash/vendor.js elasticsearch-head:/usr/src/app/_site/vendor.js
```

4. 重启镜像

```
docker restart elasticsearch-head
```

你可能用到的 docker 镜像地址：

```
es：docker pull docker.elastic.co/elasticsearch/elasticsearch:6.5.4

es-headder: docker pull mobz/elasticsearch-head:5 

logstash: docker.elastic.co/logstash/logstash:6.5.4 
```

### 告警配置

> 通过后台配置自定义报警规则，来告警开发人员。原理：通过nodejs启动定时任务来读取配置表，根据不同的规则去读取es里面的数据（一分钟查询一次），如果有错误，则通知报警。

![](http://img-repo.poetries.top/images/20210503181001.png)

![](http://img-repo.poetries.top/images/20210503181010.png)

![](http://img-repo.poetries.top/images/20210503181017.png)

![](http://img-repo.poetries.top/images/20210503181025.png)

最终以：首页 Dashboard为例

![](http://img-repo.poetries.top/images/20210503181035.png)

