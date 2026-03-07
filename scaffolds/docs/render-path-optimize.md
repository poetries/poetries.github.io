---
title: 关键路径渲染优化
date: 2020-01-28 11:24:08
tags: 性能优化
categories: Front-End
---

> 浏览器从获取 HTML到最终在屏幕上显示内容需要完成以下步骤：

- 处理 HTML 标记并构建 DOM 树。
- 处理 CSS 标记并构建 CSSOM 树。
- 将 DOM 与 CSSOM 合并成一个 render tree。
- 根据渲染树来布局，以计算每个节点的几何信息。
- 将各个节点绘制到屏幕上。

经过以上整个流程我们才能看见屏幕上出现渲染的内容，**优化关键渲染路径就是指最大限度缩短执行上述第 1 步至第 5步耗费的总时间**，让用户最快的看到首次渲染的内容

> CSSOM 的构建会阻塞 HTML 的渲染，也会阻塞 JS 的执行，JS 的下载与执行（内联及外部样式表）也会阻塞 HTML 的渲染

### 优化方法

> 为尽快完成首次渲染，我们需要最大限度减小以下三种可变因素

- 关键资源的数量：可能阻止网页首次渲染的资源
- 关键路径长度：获取所有关键资源所需的往返次数或总时间。
- 关键字节的数量：实现网页首次渲染所需的总字节数，它是所有关键资源传送文件大小的总和。我们包含单个 HTML 页面的第一个示例包含一项关键资源（HTML 文档）；关键路径长度也与 1 次网络往返相等（假设文件较小），而总关键字节数正好是 HTML 文档本身的传送大小

**优化关键渲染路径的常规步骤如下**

- 对关键路径进行分析和特性描述：资源数、字节数、长度
- 最大限度减少关键资源的数量：删除它们，延迟它们的下载，将它们标记为异步等
- 优化关键字节数以缩短下载时间（往返次数）
- 优化其余关键资源的加载顺序：您需要尽早下载所有关键资产，以缩短关键路径长度

**关键 CSS**

> 样式表会阻塞渲染，在加载完毕之前是不会显示的，为了让用户以最快的速度看到页面上的内容，可以将页面的某一部分的样式抽离出来，单独放在一个样式表中或者内联在页面中，这样的样式称为关键样式，这部分样式会优先它可以是页面的骨架屏或者是用户刚加载进页面时看到的首屏的内容。

```
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

**预加载 —— preload & prefetch**

> 使用 preload meta 来提升资源加载的优先级

- `preload` 会提升资源的优先级因为它标明这个资源是本页肯定会用到 —— 本页优先
- `prefetch` 会降低这个资源的优先级因为它标明这个资源是下一页可能用到的 —— 为下一页提前加载
- `preload` 最大的作用就是将下载与执行分离，并且将下载的优先级提到了一个很高的地步，再由我们去控制资源执行的位置

**加速样式表下载**

> 样式表是阻塞页面呈现的（注意是呈现，不是解析），正常通过 `link` 加载的外部样式表要等下载，构建 `CSSOM` 树才会让页面呈现完成，但是 `preload` 能够让样式表的下载和呈现分离

试想，当你在页面的 head 中写了如下的两个样式表

```
<link href="critial.css" rel="stylesheet" />
<link href="non-critial.css" rel="stylesheet" />
```

- 第一个是关键 `CSS`，第二个不是关键 CSS，当页面解析了这两个 `link` 标签后开始下载，但是即使 `critical.css` 下载解析完毕也不会呈现页面，因为页面还要下载和解析 `non-critical.css`。
- 这时候，就要将 `non-critial.css` 作为预加载，当样式表作为被 `preload` 后，他就不会再阻塞页面的呈现，也就是所谓的异步下载，修改后的代码如下：

```html
<link href="critial.css" rel="stylesheet" />
<link rel="preload" href="non-critial.css" as="style" />
<link href="non-critial.css" rel="stylesheet" />
```

> 如此一来，页面在解析完 `critical.css` 之后就会呈现（暂不考虑脚本），而 `non-critial` 也在下载，但是并不阻塞页面，指导它下载和解析完毕后才会应用到页面上

> 现在并不是所有的浏览器都支持 `preload`，我们可以用 `loadCSS` 这个库来做 `polyfill`，其实现的思路也是遍历所有带 `preload `和 as 的标签，然后修改标签的 `media` 为不匹配任何条件并开始下载，在下载完毕后再还原该 link 原来的 media 标签将它应用

**加速脚本下载**

> `preload` 将脚本的加载及执行分离，加了 `preload` 的 `<link>` 标签的作用是将脚本提到高优先级尽快完成下载，但并未执行。

```
<link rel="preload" href="//cdn.staticfile.org/jquery/3.2.1/jquery.min.js" as="script" />
```

> 还需要在你想要他执行的地方引入一个正常的 `<script>` 标签执行这个脚本

```html
<script src="//cdn.staticfile.org/jquery/3.2.1/jquery.min.js"></script>
```

> 否则 chrome 大约会在 3s 后报一个 warning 来提醒你这个资源被浪费了完全没有被使用到

**preload 的功能听起来很像被 defer 的脚本，但是**

- `defer` 无法控制脚本执行的时机，是在 `DOMContentLoaded` 执行前触发
- `defer` 会阻塞 `DOMContentLoaded` 事件
- `defer` 会阻塞 `onload` 事件，`preload` 不会阻塞 `onload` 事件
- `defer` 的脚本下载的优先级是 `low`，`preload` 的脚本优先级是 `high`

**加速字体下载**

> 自定义的字体在加载之前会处于 FOIT（Flash of Invisible Text）现象，虽然我们可以使用类似 webFont 一类的库来控制字体的闪现和添加钩子函数，但最佳解决方法还是让字体的加载达到最快的速度。

使用 `preload` 也可以来加速字体的下载，在 `head` 中声明 `preload`，比先下载样式表再从中读到 `@font-face` 的 src 再去加载要快得多

```
<link rel="preload" as="font" href="https://at.alicdn.com/t/font_zck90zmlh7hf47vi.woff">
```

> `preload` 字体不带 `crossorigin` 也将会二次获取！ 确保你对 `preload` 的字体添加 `crossorigin` 属性，否则他会被下载两次，这个请求使用匿名的跨域模式。这个建议也适用于字体文件在相同域名下，也适用于其他域名的获取(比如说默认的异步获取)。

> `preload` 如果不带 `crossorigin meta` ，默认情况下 （即未指定 `crossorigin` 属性时）, CORS 根本不会使用，这样 http 的 `request header` 中就不会有 origin，默认不去跨域，但是 `@font-face` 中去加载字体是默认跨域请求的，所以会造成两次的 `request header`不同，无法命中缓存，造成重复请求。

解决方法就是带上 `crossorigin`，

```html
<link rel="preload" as="font" href="//at.alicdn.com/t/font_327081_19o9k2m6va4np14i.woff" crossorigin>
<link rel="preload" as="font" href="//at.alicdn.com/t/font_327081_19o9k2m6va4np14i.woff" crossorigin="anonymous">
<link rel="preload" as="font" href="//at.alicdn.com/t/font_327081_19o9k2m6va4np14i.woff" crossorigin="fi3ework">
```

> 空关键字和无效关键字都会被当做 `anonymous`

**其他资源**

- `preload` 不仅可以将这些在 `head` 中的资源加速，还可以提前加载一些隐藏在 CSS 和 JS 中的资源，比如刚才隐藏在 CSS 中的字体资源，或者 JS 中请求的资源。
- `preload` 的标签可以动态生成，这意味着在任何时候你都可以在页面中提前加载但不执行一个脚本，然后通过动态脚本来立刻执行它

```js
var preload = document.createElement("link");
link.href = "myscript.js";
link.rel = "preload";
link.as = "script";
document.head.appendChild(link);
```

```js
var script = document.createElement("script");
script.src = "myscript.js";
document.body.appendChild(script);
```

**DNS 预解析 —— dns-prefetch**

> `dns-prefetch` 的使用方法更加简单

```
<link rel="dns-prefetch" href="//host_name_to_prefetch.com">
```

- link 标签的 rel 设定为 `dns-prefetch`，`href` 设定为需要预加载的主机域名即可。
- 在讲 `dns-prefetch` 之前，先复习一遍 `DNS` 的作用及可以优化的点才能了解 `dns-prefetch` 带来的好处

> 网络通讯大部分是基于`TCP/IP`的，而`TCP/IP`是基于IP地址的，所以计算机在网络上进行通讯时只能识别如“202.96.134.133”之类的IP地址，而不能认识域名。我们无法记住10个以上IP地址的网站，所以我们访问网站时，更多的是在浏览器地址栏中输入域名，就能看到所需要的页面，这是因为有一个叫“DNS服务器”的计算机自动把我们的域名“翻译”成了相应的IP地址，然后调出IP地址所对应的网页

`dns-prefetch` 主要用来在用户点击一个链接之前解析对应的域名，这会自动去调用用户浏览器的解析机制。浏览器会在用户浏览网页时多线程完成预加载，当用户真正点击的时候就节省了用户等待域名解析的时间

**DNS 预解析 + TCP + TLS —— preconnect**

**提前加载整个页面 —— prerender**
