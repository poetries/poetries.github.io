---
title: 关键路径渲染优化 preload 与资源预加载全解析
date: 2020-01-28 11:24:08
description: 拆解浏览器从 HTML 到首屏像素的五个步骤，讲清关键 CSS、preload、prefetch、dns-prefetch、preconnect、prerender 各自解决什么问题和怎么用。
tags:
  - 性能优化
  - 关键渲染路径
  - preload
categories: Front-End
---

有个现象你大概率也遇过：Network 面板里所有请求加起来才两百多 KB，接口也快，可白屏就是要一秒多。打开 Performance 一看，主线程前面一大段是空的，浏览器在等一个谁都没在意的 CSS 文件。这类问题不是「资源太大」造成的，是关键渲染路径上的顺序出了问题。这篇把浏览器从拿到 HTML 到把像素画上屏幕的五步拆开，再逐个讲关键 CSS、`preload`、`prefetch`、`dns-prefetch`、`preconnect`、`prerender` 分别卡在哪一步、解决什么、有什么坑。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 浏览器从 HTML 到首屏像素的五个步骤，以及谁会阻塞谁
- 优化关键渲染路径要盯住的三个变量，资源数、路径长度、字节数
- 关键 CSS 怎么拆，为什么内联首屏样式有效
- `preload` 和 `prefetch` 的根本区别，以及 `preload` 和 `defer` 的差异
- 用 `preload` 加速样式表、脚本、字体，字体那个 `crossorigin` 坑要重点看
- `dns-prefetch`、`preconnect`、`prerender` 各自省掉了链路上的哪一段

## 一、浏览器从 HTML 到像素的五步

浏览器从获取 HTML 到最终在屏幕上显示内容，需要完成这几步：

- 处理 HTML 标记并构建 DOM 树
- 处理 CSS 标记并构建 CSSOM 树
- 将 DOM 与 CSSOM 合并成一个 render tree
- 根据渲染树来布局，计算每个节点的几何信息
- 将各个节点绘制到屏幕上

走完这一整套，我们才能看见屏幕上出现渲染的内容。**优化关键渲染路径，指的就是最大限度缩短执行上述第 1 步到第 5 步耗费的总时间**，让用户最快看到首次渲染的内容。

这五步里最要命的是它们之间的阻塞关系。CSSOM 的构建会阻塞 HTML 的渲染，也会阻塞 JS 的执行；而 JS 的下载与执行（不管是内联的还是外部文件）会阻塞 HTML 的解析，解析停了后面的一切自然也就停了。

所以性能问题往往不是「东西太多」，而是「东西挡在路上」。

顺着这个思路想，一个 200 KB 的 JS 放在 `</body>` 前面和放在 `<head>` 里，对首屏的影响是天差地别的。前者只是多花点带宽，后者是直接把解析线程摁住。

## 二、要盯住的三个变量

为了尽快完成首次渲染，我们需要最大限度减小三种可变因素：

- **关键资源的数量**：可能阻止网页首次渲染的资源
- **关键路径长度**：获取所有关键资源所需的往返次数或总时间
- **关键字节的数量**：实现网页首次渲染所需的总字节数，是所有关键资源传送文件大小的总和

拿最简单的例子理解一下。一个只包含单个 HTML 页面的站点，关键资源就一项（HTML 文档本身），关键路径长度等于一次网络往返（假设文件较小），总关键字节数正好是 HTML 文档的传送大小。每往里加一个阻塞渲染的 CSS 或 JS，这三个数字就一起涨。

优化关键渲染路径的常规步骤也是围绕这三个数字来的：

- 先对关键路径做分析和特性描述，把资源数、字节数、长度量出来
- 最大限度减少关键资源的数量，删掉它们、延迟它们的下载、或者标记为异步
- 优化关键字节数以缩短下载时间，也就是减少往返次数
- 优化其余关键资源的加载顺序，尽早下载所有关键资产，缩短关键路径长度

顺序很重要，先量再改。没量过就动手，很容易花一天时间优化了一个根本不在关键路径上的资源。

## 三、关键 CSS

样式表会阻塞渲染，在加载完毕之前页面是不会显示的。既然是这样，那就把「用户第一眼要看到的那部分样式」和「剩下的样式」拆开。

抽出来的这部分样式单独放在一个样式表里，或者干脆内联在页面中，它就叫关键样式。内容上它可以是页面的骨架屏，也可以是用户刚加载进页面时看到的首屏内容。

```html
<!doctype html>
<head>
  <style> /* inlined critical CSS */ </style>
  <script> loadCSS('non-critical.css'); </script>
</head>
<body>
  ...body goes here
</body>
</html>
```

上面这段的思路是，首屏样式直接内联进 `<style>`，省掉一次网络往返，浏览器解析到这里就能立刻构建 CSSOM；剩下的样式交给 `loadCSS` 异步去拿，拿到了再应用。

内联的量要控制。关键 CSS 是塞进 HTML 里的，它会让 HTML 文档变大，而 HTML 本身也在关键路径上。一般控制在十几 KB 以内比较合适，超过这个量收益就开始被文档体积吃掉了。

## 四、preload 和 prefetch 分别在解决什么

这两个名字长得像，做的事完全相反。

`preload` 会提升资源的优先级，因为它标明这个资源是本页肯定会用到的，属于本页优先。`prefetch` 会降低这个资源的优先级，因为它标明这个资源是下一页可能用到的，属于为下一页提前加载。

`preload` 最大的作用，是把下载与执行分离，并且把下载的优先级提到很高的位置，然后由我们自己去控制资源执行的位置。

记住这一句就够了：`preload` 管本页，`prefetch` 管下一页。

用 `preload` 有个必填项容易漏，就是 `as`。不写 `as` 的话浏览器不知道这是脚本还是样式还是字体，既定不了优先级，也可能重复下载一次。控制台通常会给你一条警告，别忽略它。

## 五、用 preload 加速样式表

样式表是阻塞页面呈现的，注意是呈现，不是解析。正常通过 `link` 加载的外部样式表，要等下载完、构建完 CSSOM，页面才会呈现。而 `preload` 能让样式表的下载和呈现分离。

试想你在页面的 head 中写了这两个样式表：

```html
<link href="critical.css" rel="stylesheet" />
<link href="non-critical.css" rel="stylesheet" />
```

第一个是关键 CSS，第二个不是。页面解析了这两个 `link` 标签之后同时开始下载，但即使 `critical.css` 下载解析完毕，页面也不会呈现，因为还要等 `non-critical.css`。

那把第二个改成 `preload` 呢？原文给的写法是这样：

```html
<link href="critical.css" rel="stylesheet" />
<link rel="preload" href="non-critical.css" as="style" />
<link href="non-critical.css" rel="stylesheet" />
```

这里要说清楚一件事，很多人（包括我自己当时）会以为加了 `preload` 那一行，后面那个 `rel="stylesheet"` 就不阻塞了。实际上不是。`preload` 只负责把资源以高优先级提前拉进缓存，紧跟着的 `<link rel="stylesheet">` 该阻塞还是阻塞，它只是因为命中了缓存所以等待时间变短了。

要真正做到非阻塞，得让这个 link 在加载期间不是 stylesheet，加载完了再变成 stylesheet：

```html
<link rel="preload" href="non-critical.css" as="style" onload="this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="non-critical.css"></noscript>
```

还有一种等效写法是用 `media` 骗过浏览器，`media="print"` 时它不参与屏幕渲染所以不阻塞，加载完再把 media 改回 `all`：

```html
<link rel="stylesheet" href="non-critical.css" media="print" onload="this.media='all'">
```

这样一来页面在解析完 `critical.css` 之后就会呈现（暂不考虑脚本），`non-critical.css` 也在同时下载，但不阻塞，直到它下载和解析完毕才会应用到页面上。

浏览器对 `preload` 的支持不是全都有，兼容性兜底可以用 `loadCSS` 这个库做 polyfill。它的实现思路其实跟上面第二种写法是一回事：遍历所有带 `preload` 和 `as` 的标签，把标签的 `media` 改成不匹配任何条件并开始下载，下载完毕后再还原这个 link 原来的 media 把它应用上。

## 六、用 preload 加速脚本，以及它和 defer 的差别

`preload` 把脚本的加载及执行分离了。给 `<link>` 加上 `preload` 的作用是把脚本提到高优先级尽快完成下载，但并不执行：

```html
<link rel="preload" href="//cdn.staticfile.org/jquery/3.2.1/jquery.min.js" as="script" />
```

还需要在你想让它执行的地方，引入一个正常的 `<script>` 标签来执行这个脚本：

```html
<script src="//cdn.staticfile.org/jquery/3.2.1/jquery.min.js"></script>
```

只 preload 不执行会怎样？Chrome 大约会在三秒后报一个 warning 提醒你这个资源被浪费了，完全没有被使用到。这个警告挺有用的，它能帮你发现那些「加了 preload 但其实页面根本没用到」的僵尸配置。

`preload` 听起来很像被 `defer` 的脚本，但两者有几处不同：

| 对比项 | defer | preload |
|--------|-------|---------|
| 执行时机 | 无法控制，在 `DOMContentLoaded` 触发前执行 | 由你插入 `<script>` 的位置决定 |
| 是否阻塞 `DOMContentLoaded` | 会阻塞 | 不参与，取决于配套的 script |
| 是否阻塞 `onload` | 会阻塞 | 原文结论是不阻塞 |
| 下载优先级 | low | high |

关于 onload 那一行我要说句实话，这条我没有在最新版本的 Chrome 上重新量过。`preload` 的资源是否计入 load 事件，各浏览器的实现历史上有过调整，如果你的监控指标恰好卡在 load 上，建议自己在目标浏览器里跑一遍再下结论，别直接信表格。

## 七、用 preload 加速字体，以及 crossorigin 那个坑

自定义字体在加载完成之前会有 FOIT（Flash of Invisible Text）现象，也就是文字先隐形一段时间。我们可以用 webFont 一类的库来控制字体的闪现、添加钩子函数，但最根本的解法还是让字体加载得尽可能快。

用 `preload` 就能做到。在 `head` 里直接声明字体的 `preload`，比等浏览器先下载样式表、再从里面读到 `@font-face` 的 `src`、再去发起字体请求要快得多，直接省掉一层串行依赖：

```html
<link rel="preload" as="font" href="https://at.alicdn.com/t/font_zck90zmlh7hf47vi.woff">
```

写成上面这样，你会发现字体被下载了两次。

原因在于跨域模式对不上。`preload` 不带 `crossorigin` 时，默认情况下 CORS 根本不会启用，HTTP 的 request header 里就不会有 `Origin`，走的是非跨域请求；而 `@font-face` 加载字体默认就是跨域请求（匿名模式）。两次请求的 request header 不一样，缓存命中不了，于是重复请求一次。

这条规则容易被忽略的地方是：**即使字体文件跟页面在同一个域名下，也要加 `crossorigin`**。很多人以为同域就不用管，结果照样下两次。

解决办法就是带上 `crossorigin`：

```html
<link rel="preload" as="font" href="//at.alicdn.com/t/font_327081_19o9k2m6va4np14i.woff" crossorigin>
<link rel="preload" as="font" href="//at.alicdn.com/t/font_327081_19o9k2m6va4np14i.woff" crossorigin="anonymous">
<link rel="preload" as="font" href="//at.alicdn.com/t/font_327081_19o9k2m6va4np14i.woff" crossorigin="fi3ework">
```

上面三种写法效果是一样的，空关键字和无效关键字都会被当做 `anonymous` 处理。所以第三行那个看起来像瞎写的值，实际行为跟第二行完全相同。

排查这个问题最快的办法是打开 Network 面板按字体文件名过滤，看到同一个 woff 出现两条记录，基本就是 `crossorigin` 漏了。

## 八、preload 还能拿来做什么

`preload` 不只能加速 head 里那些显式声明的资源，还可以提前加载一些藏在 CSS 和 JS 内部的资源，比如刚才说的藏在 CSS 里的字体，或者 JS 运行时才发起的那些请求。这些资源浏览器要等解析完外层文件才能发现，`preload` 相当于提前把它们暴露出来。

另外 `preload` 的标签可以动态生成。也就是说任何时候你都可以在页面中提前加载但不执行一个脚本，等需要的时候再通过动态插入 script 立刻执行它：

```js
var link = document.createElement("link");
link.href = "myscript.js";
link.rel = "preload";
link.as = "script";
document.head.appendChild(link);
```

原文这段里变量声明写的是 `var preload`，下面却在给 `link` 赋值，直接跑会报 `link is not defined`，这里改成一致的 `link` 了。

到了真正要执行的时机，再插入一个普通的 script 标签，因为资源已经在缓存里，这次几乎是瞬间执行：

```js
var script = document.createElement("script");
script.src = "myscript.js";
document.body.appendChild(script);
```

这套组合的典型场景是「用户点了按钮才需要的大组件」，页面空闲时先 preload，点击时再执行，感知上就是秒开。这些 `var` 写法现在一般换成 `const`，行为没有区别，只是块级作用域更安全。

## 九、dns-prefetch，先把域名解析掉

`dns-prefetch` 的用法比前面几个都简单：

```html
<link rel="dns-prefetch" href="//host_name_to_prefetch.com">
```

`link` 标签的 `rel` 设为 `dns-prefetch`，`href` 设为需要预解析的主机域名即可。

在讲它有什么用之前，先复习一遍 DNS 在链路里干了什么。网络通讯大部分基于 TCP/IP，而 TCP/IP 基于 IP 地址，所以计算机在网络上通讯时只认得类似 `202.96.134.133` 这样的 IP 地址，不认识域名。我们记不住十个以上的 IP，所以访问网站时更多是在地址栏输入域名，能看到页面是因为有一台叫 DNS 服务器的机器，自动把域名「翻译」成了对应的 IP 地址，再去请求这个 IP 上的网页。

这层翻译是要花时间的，而且它发生在建立连接之前，属于纯等待。`dns-prefetch` 做的事就是在用户点击一个链接之前，提前把对应的域名解析掉，浏览器会在用户浏览当前页时多线程完成这件事，等用户真正点下去，域名解析的时间就已经省掉了。

用它的性价比很高，因为代价极小，一次 DNS 查询而已。站点上引用了第三方 CDN、统计脚本、图床、支付网关的，把这些域名都列上基本没有副作用。

## 十、preconnect，把 DNS 加 TCP 加 TLS 一起提前

`dns-prefetch` 只解决了链路的第一段。一次 HTTPS 请求真正开始传数据之前，要依次完成 DNS 解析、TCP 三次握手、TLS 协商，三段都是纯等待，跨境访问时加起来可能比传输本身还久。

`preconnect` 把这三段一次性提前：

```html
<link rel="preconnect" href="https://cdn.example.com">
```

如果这个域名上要拿的是字体这类匿名跨域资源，同样要带 `crossorigin`，道理跟第七节一样，连接的凭据模式对不上就复用不了：

```html
<link rel="preconnect" href="https://at.alicdn.com" crossorigin>
```

这里有个坑要注意，预连接建好之后如果一直没人用，浏览器会把它关掉回收，Chrome 大约留十秒左右。所以 `preconnect` 只对「马上就要用到」的域名有意义，提前太久等于白建。

另外别把站点上所有第三方域名都写成 `preconnect`。每条连接都要占用客户端和服务端的资源，握手本身也耗 CPU 和电量，域名多了反而会跟真正的关键请求抢带宽。一般挑两三个最关键的就够，剩下的用 `dns-prefetch` 兜底。

两者可以一起写，把 `dns-prefetch` 放在 `preconnect` 后面，不支持 `preconnect` 的浏览器会退回去用前者。

## 十一、prerender，提前渲染整个下一页

前面几个预加载指令，提前的都是链路上的某一段，`prerender` 则更激进，它让浏览器在后台把下一个页面完整地加载并渲染出来：

```html
<link rel="prerender" href="https://example.com/next-page">
```

用户真的点过去的时候，页面几乎是瞬间出现，因为它早就画好了。

代价也同样明显。预渲染等于在后台完整加载了一个页面，它的 HTML、CSS、JS、图片、接口请求全都会发生一遍。猜错了，这些流量、内存和电量就全白费；如果那个页面里还有埋点或者写操作，甚至可能产生你不想要的副作用。所以它只适合把握极大的下一跳，比如搜索结果里排第一的那条，或者分页浏览里的下一页。

这里要补一句现状。Chrome 对老的 `<link rel="prerender">` 后来做过降级处理，实际行为变成了只预取子资源、不执行脚本也不构建完整页面，再之后浏览器又提供了 Speculation Rules 这套新的推测式加载方案来做真正的预渲染，并且能配置触发条件和激进程度。具体到你要支持的浏览器上是哪种行为，建议查一下当前的兼容性表再决定用哪套，我这块只在 demo 里试过，没在正式项目上铺开。

## 总结

把这些手段按它们作用的链路位置排一下，就很好记了：

| 手段 | 省掉的是哪一段 | 典型场景 |
|------|----------------|----------|
| 关键 CSS 内联 | 一次样式表往返 | 首屏骨架 |
| `preload` | 资源发现的延迟，同时提优先级 | 本页必用的字体、关键脚本 |
| `prefetch` | 下一页资源的下载时间 | 高概率的下一跳资源 |
| `dns-prefetch` | DNS 解析 | 第三方域名，成本极低 |
| `preconnect` | DNS 加 TCP 加 TLS | 两三个最关键的跨域来源 |
| `prerender` | 整个下一页的加载与渲染 | 把握极大的下一跳 |

真正要动手的时候，顺序建议是这样：先用 Performance 面板量出关键路径上到底卡在哪，再决定用哪一个。这几个指令都不是「加了就快」的银弹，`preload` 加多了会挤掉真正关键资源的带宽，`preconnect` 加多了会浪费握手开销，`prerender` 猜错了就是纯浪费。

最容易被漏掉、修好之后收益又立竿见影的，是第七节字体那个 `crossorigin`。同域也要加，Network 里同一个 woff 出现两条就是它。

浏览器渲染这块的底层机制，可以接着看我之前写的 [浏览器渲染原理](https://feinterview.poetries.top/blog/browser-render)；缓存策略配合预加载一起用效果更好，相关内容在 [浏览器缓存机制](https://feinterview.poetries.top/blog/browser-cache)；更完整的前端性能优化清单在 [前端性能优化总结](https://feinterview.poetries.top/blog/fed-performance-optimization)。

## 参考

- [Preload 规范 · W3C](https://www.w3.org/TR/preload/)
- [HTML Standard 中的 link 类型定义](https://html.spec.whatwg.org/multipage/links.html)
- [MDN link 元素](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/link)
- [loadCSS](https://github.com/filamentgroup/loadCSS)
- [前端进阶之旅](https://interview.poetries.top)
