---
title: 前端调试实战指南 从 Chrome DevTools 到真机与 Node
description: 前端调试实战笔记，讲透 Chrome DevTools 的 Console、Network、Sources 三大面板与五类断点，移动端用 vConsole 兜底，Android 用 chrome://inspect、iOS 用 Safari 连真机调 WebView，Node 用 --inspect 打断点。
date: 2020-03-26 09:35:08
tags:
  - 前端调试
  - Chrome DevTools
  - vConsole
  - WebView
  - Node.js
categories: Front-End
---

线上页面白屏，用户截图发过来只有一句「我这打不开」。你打开自己的 Chrome，一切正常。这种时候最缺的不是聪明，是一套能把问题「按住」的调试手法：知道去哪个面板看、看哪一列数字、什么时候该上真机、什么时候该在 Node 侧打断点。

这篇是我把日常用到的调试手段整理了一遍的结果，从 Chrome DevTools 的三大面板讲到断点体系，再讲移动端 H5、App 里的 WebView、以及 Node 服务端。每个工具都配了截图，你可以对着图找按钮，不用凭记忆猜位置。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Chrome DevTools 十个面板各管什么，先建立一张地图
- Console 面板除了 `console.log` 还能做什么
- Network 面板的六个区域，以及一次请求时间线上每一段的含义
- Sources 面板的断点体系：行断点、DOM 断点、XHR 断点、事件断点、异常断点
- 用 Filesystem、Overrides、Snippets 把调试改动留下来
- 移动端 H5 没有控制台时，怎么用 vConsole 兜底
- WebView 是什么，为什么它必须单独调
- Android 用 `chrome://inspect` 连真机，iOS 用 Safari 网页检查器连真机
- Node.js 的 `--inspect` 调试原理，以及 VSCode 里怎么配 `launch.json`
- 这些面板在新版 Chrome 里都挪到了哪

## 一、先建一张 DevTools 的地图

Chrome 开发者工具里的面板不少，性能相关的有网络面板、`Performance` 面板、内存面板，页面调试相关的有 `Elements` 面板、`Sources` 面板、`Console` 面板。很多人用了几年也只在 Console 和 Elements 之间来回切，剩下的面板完全没打开过。

打开方式是在浏览器窗口右上方选择 `Chrome` 菜单，然后选择「更多工具 → 开发者工具」。快捷键在 Mac 上是 `Cmd + Option + I`，Windows 上是 `F12` 或者 `Ctrl + Shift + I`。

下面这张图是打开后的样子，先看顶部那一排标签，那就是面板列表。

![Chrome 开发者工具打开后的整体界面，顶部一排是各个功能面板的标签](https://s.poetries.top/gitee/2020/03/7.png)

你应该能在顶部数出十来个标签。窗口窄的时候部分标签会被折叠进右边的 `»` 里，找不到某个面板先去那里翻一翻。

这十个面板分别是：

- Elements
- Console
- Sources
- NetWork
- Performance
- Memory
- Application
- Security
- Audits
- Layers

光看名字还是抽象，下面这张表把每个面板负责的事写出来了，扫一眼就知道遇到什么问题该去哪。

![Chrome DevTools 十个面板的功能说明表，逐个列出每个面板负责什么](https://s.poetries.top/gitee/2020/03/8.png)

看完这张表你大概能记住一条主线：DOM 和样式的问题去 Elements，脚本执行的问题去 Sources，请求的问题去 Network，卡顿和内存的问题去 Performance 和 Memory。这条主线足够覆盖八成日常场景。

这里补一句版本差异。上面这份面板清单是 2020 年那会儿的样子，`Audits` 面板后来改名叫 `Lighthouse` 了，另外新版还多出了 `Recorder`、`Application` 下的更多子项等等。不同 Chrome 版本入口位置有差异，你在自己浏览器里数出来的面板数量和这张图对不上是正常的，按功能去找就行。

接下来重点看三个面板：`Network`、`Console`、`Sources`。

## 二、Console 面板不只是 console.log

先说结论，Console 面板真正值钱的地方是它能让你在**任意时刻**拿到页面的运行时上下文，而不是只能打日志。不过日志确实是最常用的，先把日志的几个等级过一遍。

```js
console.log("打印字符串");//在控制台打印自定义字符串
console.error("我是个错误");//在控制台打印自定义错误信息
console.info("我是个信息");//在控制台打印自定义信息
console.warn("我是个警告");//在控制台打印自定义警告信息
console.debug("我是个调试");//在控制台打印自定义调试信息
```

这五个方法的区别不只是颜色。Console 面板顶部有个日志等级过滤器（`Default levels`），能单独勾掉 `Verbose`、`Info`、`Warning`、`Error`。第三方 SDK 疯狂刷屏的时候，把等级过滤一下比翻页快得多。`console.debug` 默认属于 `Verbose` 等级，很多人发现「debug 打不出来」，就是因为这一级默认没勾上。

### 2.1 格式化输出

除此以外，`console` 还支持自定义样式和类似 C 语言 `printf` 形式的占位符。这套东西用在给日志分组、给关键日志加高亮上很省事。

```js
console.log("%s年",2016);//%s表示字符串
console.log("%d年%d月",2016,11);//%d表示整数
console.log("%f",3.1415926);//%f小数
console.log("%o",console);//%o表示对象

console.log("%c自定义样式","font-size:30px;color:#00f");
console.log("%c我是%c自定义样式","font-size:20px;color:green","font-size:10px;color:red");
```

`%c` 这个我自己用得最多。项目里如果有一类日志你希望一眼扫到，比如埋点上报或者路由切换，给它统一加个背景色，在几百条日志里也能一眼捞出来。要注意 `%c` 的样式作用范围是从它出现的位置到下一个 `%c` 为止，所以上面第二行才会出现两段不同样式的文字。

顺着上面聊，`%o` 打对象和直接 `console.log(obj)` 有个细微差别：直接打印会给你一个可展开的交互式对象，而且展开时读的是**展开那一刻**的值，不是打印那一刻的。所以调试对象被后续代码改过的场景，稳妥的做法是 `console.log(JSON.parse(JSON.stringify(obj)))` 打个快照，或者直接上断点。这个我踩过，排查了一下午发现是日志骗了我。

## 三、Network 面板与一次请求的完整生命周期

网络面板由控制器、过滤器、抓图信息、时间线、详细列表和下载信息概要这 6 个区域构成。先对着下面这张图把六块区域的位置认清楚，后面讲每一块的时候你才知道在说哪。

![Chrome 网络面板的整体布局，从上到下依次是控制器、过滤器、抓图信息、时间线、详细列表和下载信息概要六个区域](https://s.poetries.top/gitee/2020/03/9.png)

图里从上往下的分层很清楚。如果你打开面板发现下半部分是空的，多半是没在录制状态下刷新页面，先刷新一次再看。

### 3.1 控制器：四个最该记住的开关

控制器在最上面那一排，功能不少，但真正天天用的就四个。看下面这张图里被标出来的位置。

![网络面板控制器区域的按钮，标出了开始暂停抓包、全局搜索、Disable cache 和 Online 限速四个功能](https://s.poetries.top/gitee/2020/03/10.png)

按图从左往右看，这几个按钮分别是：

- 红色圆点的按钮，表示「开始 / 暂停抓包」，这个功能很常见，很容易理解
- 「全局搜索」按钮，这个功能就非常重要了，可以在所有下载资源中搜索相关内容，还可以快速定位到某几个你想要的文件上
- Disable cache，即「禁止从 Cache 中加载资源」的功能，它在调试 Web 应用的时候非常有用，因为开启了 Cache 会影响到网络性能测试的结果
- Online 按钮，是「模拟 2G/3G」功能，它可以限制带宽，模拟弱网情况下页面的展现情况，然后你就可以根据实际展示情况来动态调整策略，以便让 Web 应用更加适用于这些弱网

这里有个坑要注意，`Disable cache` 只在 DevTools 打开的时候生效。你关掉 DevTools 再刷新，缓存又回来了。所以「我明明勾了禁用缓存怎么还是老代码」这种情况，先确认面板是不是开着的。

新版 Chrome 里这块的名字变了。`Online` 那个下拉现在统一叫「节流 / Throttling」，预设档位的名称也随版本调整过，还多了自定义网络配置的入口。功能是同一个，找不到就在控制器那一排横着扫，看哪个下拉里有 `No throttling` 字样。

### 3.2 过滤器、抓图信息、时间线

网络面板中的过滤器，主要就是起过滤功能。因为有时候一个页面有太多内容在详细列表区域中展示了，而你可能只想查看 JavaScript 文件或者 CSS 文件，这时候就可以通过过滤器模块来筛选你想要的文件类型。

过滤器输入框其实还支持一些关键字语法，比如按域名、按状态码、按大小筛。真正救命的场景是接口特别多的页面，直接输接口路径的一段就能定位到。

抓图信息区域，可以用来分析用户等待页面加载时间内所看到的内容，分析用户实际的体验情况。比如，如果页面加载 1 秒多之后屏幕截图还是白屏状态，这时候就需要分析是网络还是代码的问题了。勾选面板上的「Capture screenshots」即可启用屏幕截图。

那怎么判断到底是网络问题还是代码问题？看截图那一排的时间戳，对照下面详细列表里资源到达的时刻。如果关键 JS 早就下载完了，屏幕还是白的，那问题在渲染或者脚本执行，不在网络。

时间线，主要用来展示 `HTTP`、`HTTPS`、`WebSocket` 加载的状态和时间的一个关系，用于直观感受页面的加载过程。如果是多条竖线堆叠在一起，那说明这些资源被同时被加载。至于具体到每个文件的加载信息，还需要用到下面要讲的详细列表。

### 3.3 下载信息概要里的两个事件

下载信息概要在面板最底部那一条，你要重点关注下 `DOMContentLoaded` 和 `Load` 两个事件，以及这两个事件的完成时间。

- `DOMContentLoaded`，这个事件发生后，说明页面已经构建好 `DOM` 了，也就是构建 `DOM` 所需要的 HTML 文件、`JavaScript` 文件、`CSS` 文件都已经下载完成了
- `Load`，说明浏览器已经加载了所有的资源（图像、样式表等）

通过下载信息概要面板，你可以查看触发这两个事件所花费的时间。这两个数字是最粗粒度的体检指标：`DOMContentLoaded` 长说明关键路径上的资源被阻塞了，`Load` 长而 `DOMContentLoaded` 正常，那多半是图片、字体这些非关键资源拖的。关于关键渲染路径怎么优化，我之前单独写过一篇 [渲染路径优化](https://feinterview.poetries.top/blog/render-path-optimize)，这里就不展开了。

### 3.4 详细列表：一次请求的所有细节

详细列表这个区域是最重要的，它详细记录了每个资源从发起请求到完成请求这中间所有过程的状态，以及最终请求完成的数据信息。通过该列表，你就能很容易地去诊断一些网络问题。

先看列表本身有哪些列。

![网络面板详细列表，展示 Name、Status、Type、Initiator 等属性列，可以点击列头排序](https://s.poetries.top/gitee/2020/03/11.png)

列表的属性比较多，比如 Name、Status、Type、Initiator 等等，这个不难理解。当然，你还可以通过点击右键的下拉菜单来添加其他属性。

另外，你也可以按照列表的属性来给列表排序，默认情况下，列表是按请求发起的时间来排序的，最早发起请求的资源在顶部。当然也可以按照返回状态码、请求类型、请求时长、内容大小等基础属性排序，只需点击相应属性即可。

这里推荐一个很多人没注意的列：`Initiator`。它记录了这个请求是被谁发起的，鼠标悬停上去能看到完整调用栈。页面里冒出一个你不认识的请求，用它一秒定位到是哪个 SDK 干的。

选中列表中的任意一项，右边会出现这一项的详细信息。

![选中某条请求后右侧展开的详情面板，可以看到请求行、请求头、响应头和响应体](https://s.poetries.top/gitee/2020/03/12.png)

你可以在此查看请求列表中任意一项的请求行和请求头信息，还可以查看响应行、响应头和响应体。然后你可以根据这些查看的信息来判断你的业务逻辑是否正确，或者有时候也可以用来逆向推导别人网站的业务逻辑。

排查接口问题的时候，我的习惯是先看 `Status`，再看 `Request Headers` 里的 `Cookie` 和自定义 token 头有没有带上，最后才看 `Response`。顺序反过来的话，你会对着一个 401 的响应体研究半天业务逻辑。

### 3.5 单个资源的时间线怎么读

了解了每个资源的详细请求信息之后，我们再来分析单个资源请求时间线，这就涉及具体的 HTTP 请求流程了。

在发起一个 HTTP 请求之后，浏览器首先查找缓存，如果缓存没有命中，那么继续发起 DNS 请求获取 IP 地址，然后利用 IP 地址和服务器端建立 TCP 连接，再发送 HTTP 请求，等待服务器响应。不过，如果服务器响应头中包含了重定向的信息，那么整个流程就需要重新再走一遍。这就是在浏览器中一个 HTTP 请求的基础流程。

那详细列表中是如何表示出这个流程的呢？这就要重点看下 `Timing` 那一栏。

![单个请求的时间线瀑布图，依次标出 Queuing、Stalled、Initial connection、Request sent、Waiting TTFB 和 Content Download 各阶段耗时](https://s.poetries.top/gitee/2020/03/14.png)

图里每一段色块就是上面那个流程里的一步。鼠标悬停到瀑布图上也能直接看到这张分解表，不用点进详情。

第一个是 Queuing，也就是排队的意思。当浏览器发起一个请求的时候，会有很多原因导致该请求不能被立即执行，而是需要排队等待。导致请求处于排队状态的原因有很多：

- 页面中的资源是有优先级的，比如 CSS、HTML、JavaScript 等都是页面中的核心文件，所以优先级最高；而图片、视频、音频这类资源就不是核心资源，优先级就比较低。通常当后者遇到前者时，就需要「让路」，进入待排队状态。
- 浏览器会为每个域名最多维护 6 个 TCP 连接，如果发起一个 HTTP 请求时，这 6 个 TCP 连接都处于忙碌状态，那么这个请求就会处于排队状态。
- 网络进程在为数据分配磁盘空间时，新的 HTTP 请求也需要短暂地等待磁盘分配结束。

等待排队完成之后，就要进入发起连接的状态了。不过在发起连接之前，还有一些原因可能导致连接过程被推迟，这个推迟就表现在面板中的 Stalled 上，它表示停滞的意思。

接下来就到了 Initial connection / SSL 阶段，也就是和服务器建立连接的阶段，这包括了建立 TCP 连接所花费的时间。如果你使用了 HTTPS 协议，那么还需要一个额外的 SSL 握手时间，这个过程主要是用来协商一些加密信息的。

和服务器建立好连接之后，网络进程会准备请求数据，并将其发送给网络，这就是 Request sent 阶段。通常这个阶段非常快，因为只需要把浏览器缓冲区的数据发送出去就结束了，并不需要判断服务器是否接收到了，所以这个时间通常不到 1 毫秒。

数据发送出去了，接下来就是等待接收服务器第一个字节的数据，这个阶段称为 Waiting (TTFB)，通常也称为「第一字节时间」。`TTFB` 是反映服务端响应速度的重要指标，对服务器来说，`TTFB` 时间越短，就说明服务器响应越快。

接收到第一个字节之后，进入陆续接收完整数据的阶段，也就是 `Content Download` 阶段，这一段的长度就是从第一字节时间到接收到全部响应数据所用的时间。

### 3.6 每一段变长了该怎么优化

了解了时间线面板上的各项含义之后，我们就可以根据这个请求的时间线来实现相关的优化操作了。

**排队（Queuing）时间过久**，大概率是由浏览器为每个域名最多维护 6 个连接导致的。基于这个原因，你就可以让 1 个站点下面的资源放在多个域名下面，比如放到 3 个域名下面，这样就可以同时支持 18 个连接了，这种方案称为域名分片技术。除了域名分片技术外，我更建议你把站点升级到 HTTP2，因为 HTTP2 已经没有每个域名最多维护 6 个 TCP 连接的限制了。

补一句现在的看法：域名分片在 HTTP2 下反而是负优化，因为它会把本来可以复用的一条连接拆成多条，多域名还要多做几次 DNS 和 TLS 握手。这套写法留着当历史背景理解就好，新项目直接上 HTTP2 或者 HTTP3。

**第一字节时间（TTFB）过久**，可能的原因有这几个：

- 服务器生成页面数据的时间过久。对于动态网页来说，服务器收到用户打开一个页面的请求时，首先要从数据库中读取该页面需要的数据，然后把这些数据传入到模板中，模板渲染后，再返回给用户。服务器在处理这个数据的过程中，可能某个环节会出问题。
- 网络的原因。比如使用了低带宽的服务器，或者本来用的是电信的服务器，可联通的网络用户要来访问你的服务器，这样也会拖慢网速。
- 发送请求头时带上了多余的用户信息。比如一些不必要的 Cookie 信息，服务器接收到这些 Cookie 信息之后可能需要对每一项都做处理，这样就加大了服务器的处理时长。

对于这三种问题，你要有针对性地出一些解决方案。面对第一种服务器的问题，你可以想办法去提高服务器的处理速度，比如通过增加各种缓存的技术；针对第二种网络问题，你可以使用 CDN 来缓存一些静态文件；至于第三种，你在发送请求时就去尽可能地减少一些不必要的 Cookie 数据信息。

**Content Download 时间过久**，如果单个请求的 `Content Download` 花费了大量时间，有可能是字节数太多的原因导致的。这时候你就需要减少文件大小，比如压缩、去掉源码中不必要的注释等方法。

## 四、Sources 面板与断点体系

Network 面板告诉你「数据对不对」，Sources 面板告诉你「代码走到哪、变量是什么」。这是整篇里最值得花时间的一块。

![Chrome Sources 面板的整体布局，左侧是文件树，中间是代码区，右侧是调试相关的各个窗格](https://s.poetries.top/gitee/2020/03/40.png)

面板分三栏：左边文件树，中间代码，右边调试窗格。右边那一栏才是断点调试的主战场，Watch、Call Stack、Scope、Breakpoints 都在那儿。

点击 JS 代码前面的行号来设置断点，如果当前代码是经过压缩的话，可以点击下方的花括号 `{}` 来增强可读性（也就是 Pretty print），所有的断点都会列在右侧的断点区。

线上代码基本都是压缩过的，这时候光靠 Pretty print 只能勉强读，真正解决问题的是 source map。构建时把 source map 传上去（或者只传给内网），DevTools 会自动把压缩代码还原成源码，断点、变量名、调用栈全都对得上。这块的开关在 DevTools 设置里的 `Enable JavaScript source maps`，默认是开的，如果发现断点打在了压缩代码上，先去确认 source map 有没有被正确加载，Sources 面板里文件名旁边会提示。

### 4.1 调试工具栏那几个按钮

下图红色区域从左至右就是调试工具栏。这几个按钮我按官方名称和快捷键列一遍：

- pause / resume script execution，暂停或恢复脚本执行
- Step over next function call，快捷键 F10，单步执行，遇到子函数并不进去，将子函数执行完并将其作为一个单步
- Step into next function call，快捷键 F11，单步执行，遇到子函数就进去继续单步执行
- Step out of current function，快捷键 Shift + F11，直接跳出当前的函数，返回父级函数
- Step，快捷键 F9，按语句往下走
- Deactivate / activate breakpoints，禁用或启用断点，点一下按钮上会多一条斜线，再点就取消
- Pause on exceptions，异常时暂停，启用后按钮变蓝

![Sources 面板顶部的调试工具栏按钮，从左到右依次是暂停恢复、单步跳过、单步进入、跳出、逐语句、禁用断点和异常暂停](https://s.poetries.top/gitee/2020/03/15.png)

对着图认按钮的时候记一个规律：弧线跨过一个圆点的是 Step over，向下的箭头是 Step into，向上的箭头是 Step out。原文这里把 F9 和 F10 的按钮对应关系写反过，我按 DevTools 里实际的提示文案改正了，你把鼠标悬停在按钮上，Chrome 会直接告诉你它的英文名和快捷键，以那个为准最稳。

日常用得最多的其实就 F10 和 F11 两个。F10 用来在当前这一层往下扫，找到出问题的那一行；F11 用来钻进去看那一行内部到底干了什么。跳错了就 Shift + F11 出来。

### 4.2 代码行断点

最基础的一种，步骤是：

- 点击 `Sources` 标签
- 打开包含您想要中断的代码行的文件
- 转至代码行
- 代码行的左侧是行号列，点击行号列，行号列上将显示一个蓝色图标

![在 Sources 面板代码行号列上点击后出现的蓝色行断点标记](https://s.poetries.top/gitee/2020/03/16.png)

蓝色标记出现就说明断点生效了。如果点了之后标记是灰色或者带斜线，说明这行代码所在的脚本还没加载，或者断点被挪到了下一个可执行行上。

### 4.3 debugger 语句断点

在代码中调用 `debugger` 可在该行暂停。此操作相当于使用代码行断点，只是此断点是在代码中设置，而不是在 DevTools 界面中设置。

```js
console.log('a');
console.log('b');
debugger;
console.log('c');
```

`debugger` 的好处是它跟着代码走，改一次代码所有人都能断到同一个位置，适合排查那种「只在某个同事机器上复现」的问题。坏处也很明显，忘了删就跟着上线了，所以生产构建里一定要配上删除 `debugger` 的插件。

顺带说清楚一个容易混的概念：**条件断点**是另一回事，它是在行号上右键选择 `Add conditional breakpoint`，然后填一个表达式，只有表达式为真时才会停。循环里跑一千次只想看第 `i === 998` 那次，用它比一直按 F8 舒服太多。新版 Chrome 还在同一个右键菜单里加了 `Logpoint`，能在不停下来的前提下往控制台打一行日志，等于不改代码就插了个 `console.log`。不同 Chrome 版本这几项的菜单文案略有差异。

### 4.4 管理断点

打的断点多了得管，右侧的 Breakpoints 窗格就是干这个的。

- 勾选条目旁的复选框可以停用相应的断点
- 右键点击条目可以移除相应的断点
- 点击代码可以跳转到断点对应位置

![Sources 面板右侧的 Breakpoints 窗格，列出了当前所有代码行断点并可以逐个勾选停用](https://s.poetries.top/gitee/2020/03/17.png)

图里每一条就是一个断点，前面的复选框控制启用状态。在这里能一眼看到自己到底在多少个地方埋了断点，避免「代码明明没走到却一直被中断」。

右键点击 Breakpoints 窗格中的任意位置可以取消激活所有断点、停用所有断点，或移除所有断点。停用所有断点相当于取消选中每个断点。取消激活所有断点可让 DevTools 忽略所有代码行断点，但同时会继续保持其启用状态，以使这些断点的状态与取消激活之前相同。

![Breakpoints 窗格的右键菜单，提供取消激活所有断点、停用所有断点和移除所有断点等操作](https://s.poetries.top/gitee/2020/03/18.png)

「取消激活」和「移除」的区别就在这张图里：前者是临时静音，改完一版代码想再断回来，勾回去即可；后者是真删了，得重新一个个点。

### 4.5 DOM 更改断点

有时候问题不是「哪行代码报错」，而是「谁把这个节点改了」。这种时候用 DOM 断点。

设置步骤：

- 点击 Elements 标签
- 转至要设置断点的元素
- 右键点击此元素
- 将鼠标指针悬停在 Break on 上，然后选择 Subtree modifications、Attribute modifications 或 Node removal

三种类型的触发条件分别是：

- Subtree modifications：在移除或添加当前所选节点的子级，或更改子级内容时触发这类断点。在子级节点属性发生变化或对当前所选节点进行任何更改时不会触发这类断点。
- Attribute modifications：在当前所选节点上添加或移除属性，或属性值发生变化时触发这类断点。
- Node Removal：在移除当前选定的节点时会触发。

![Elements 面板中右键元素后展开的 Break on 子菜单，可选择子树修改、属性修改和节点移除三种 DOM 断点](https://s.poetries.top/gitee/2020/03/19.png)

菜单藏在右键的二级菜单里，第一次找容易漏。选完之后元素上会多一个小蓝点标记。

设好的 DOM 断点会汇总到 Sources 面板的一个独立窗格里。

![Sources 面板右侧的 DOM Breakpoints 窗格，列出已设置的 DOM 更改断点及其类型](https://s.poetries.top/gitee/2020/03/20.png)

在这里能看到自己一共下了几个 DOM 断点、分别是什么类型。断点命中时 Sources 会直接停在那段改 DOM 的代码上，配合右边的 Call Stack 往上翻，就能揪出到底是哪个组件或者哪个第三方脚本动的手。第三方脚本偷偷改你样式的问题，用这招最快。

### 4.6 XHR / Fetch 断点

请求发出去了但参数不对，想知道是谁拼的参数，用 XHR 断点：

- 点击 `Sources` 标签
- 展开 `XHR Breakpoints` 窗格
- 点击 `Add breakpoint`
- 输入要对其设置断点的字符串，`DevTools` 会在 XHR 的请求网址的任意位置显示此字符串时暂停
- 按 Enter 键以确认

![Sources 面板的 XHR Breakpoints 窗格，添加了一条按 URL 关键字匹配的请求断点](https://s.poetries.top/gitee/2020/03/21.png)

输入框里填的是 URL 的**片段**，不是完整地址，填接口路径里最有辨识度的一段就够。留空则表示任何 XHR 都断。新版 Chrome 里这个窗格改叫 `XHR/fetch Breakpoints`，也覆盖 `fetch` 发出的请求了。

### 4.7 事件侦听器断点

想知道某个点击到底触发了哪些代码，用事件断点：

- 点击 `Sources` 标签
- 展开 `Event Listener Breakpoints` 窗格，`DevTools` 会显示 `Animation` 等事件类别列表
- 勾选这些类别之一以在触发该类别的任何事件时暂停，或者展开类别并勾选特定事件

![Sources 面板的 Event Listener Breakpoints 窗格，按事件类别分组列出可勾选的各类事件](https://s.poetries.top/gitee/2020/03/22.png)

分类是折叠的，展开 `Mouse` 能找到 `click`，展开 `Keyboard` 能找到 `keydown`。这里有个坑，勾了 `click` 之后你在页面上的每一次点击都会断住，包括点 DevTools 之外的任何地方，调完记得取消勾选，不然你会以为浏览器卡死了。

### 4.8 异常断点

想让引发已捕获或未捕获异常的代码行暂停，可以使用异常断点：

- 点击 Sources 标签
- 点击 Pause on exceptions 按钮，引发异常时暂停，启用后此按钮变为蓝色

![Sources 面板工具栏上的 Pause on exceptions 按钮以及展开后的暂停于捕获异常复选框](https://s.poetries.top/gitee/2020/03/23.png)

按钮变蓝就是开启状态，旁边还有一个「暂停于已捕获的异常」复选框。默认只断未捕获异常，勾上之后连 `try/catch` 里的异常也会停，代价是第三方库内部靠异常做控制流的地方会疯狂断住。我一般只在「线上偶发报错怎么都定位不到」的时候临时勾一下。

## 五、把调试改动留下来：Filesystem、Overrides、Snippets

上面这些手段都是「看」，这一节讲怎么「改」，而且让改动不被刷新冲掉。

### 5.1 Filesystem 映射本地目录

在 Chrome DevTools 上调试 CSS 或 JavaScript 时，修改的属性值在重新刷新页面时，所有的修改都会被重置。如果你想把修改的值保存下来并且同步到本地，可以使用 Sources 的 Filesystem，来与本地目录进行映射。前提是本地必须有对应的源码，如果本地没有代码，那么更改不会被保存同步。

![Sources 面板 Filesystem 标签下添加本地目录并与线上资源建立映射](https://s.poetries.top/gitee/2020/03/24.png)

点 `Add folder to workspace` 选中本地项目目录，浏览器会弹一个授权条，同意之后 DevTools 会自动把线上文件和本地文件按内容匹配起来，匹配成功的文件在文件树里会带一个绿色小点。你在 DevTools 里改 CSS，本地文件会跟着变。

### 5.2 Overrides 不需要本地源码

Overrides 和 Filesystem 的区别在于，Filesystem 必须在本地有源代码，Overrides 则不需要。

在 Chrome DevTools 上调试 CSS 或 JavaScript 时，修改的属性值在重新刷新页面时会被重置。如果你想把修改的值保存下来、刷新页面的时候不被重置，就可以使用 Overrides。

它的实际用法是：指定一个本地目录用来放「覆盖文件」，之后你在 DevTools 里对某个线上资源的修改会被写进这个目录，页面再次请求这个资源时 Chrome 直接用本地那份。这招在「线上出问题但没法马上发版，想先本地验证补丁对不对」的时候特别好用，改完直接刷新就能看到效果，不用起本地服务、不用改 host。

新版 Chrome 把 Overrides 的入口铺得更广了，Network 面板里对着某个请求右键也能直接 `Override content`，不用先去 Sources 里配。不同 Chrome 版本入口位置有差异，找不到就在 Sources 左侧那排标签里翻。

### 5.3 Snippets 随时写一段代码

`Chrome` 在 `Sources` 页面提供 `Snippets` 一栏，这里我们可以随时编写 `JS` 代码，运行结果会打印到控制台。代码是全局保存的，我们在任何页面，包括新建标签页，都可以查看或运行这些代码。

我们不再需要为了运行一小段 `JS` 代码而新建一个 `HTML` 页面。`Snippets` 的方便之处在于，你只需要打开 Chrome 就可以编写一份任意页面都可以运行的 `JS` 代码。

我自己在 Snippets 里常年存着几段：一段是遍历页面所有图片打印实际尺寸和显示尺寸，用来查有没有加载了大图却缩着显示；一段是把 `localStorage` 全量导出成 JSON。这类脚本写一次就能一直用，比每次现敲快得多。运行方式是打开 Snippets 里的文件后按 `Cmd + Enter`（Windows 上是 `Ctrl + Enter`），或者在命令菜单里搜 `Run snippet`。

## 六、移动端 H5 的兜底方案 vConsole

回到移动端。手机浏览器里没有 DevTools，页面出问题你连报错都看不到。vConsole 是腾讯出的一个轻量、可拓展、针对手机网页的前端开发者调试面板，作用就是在页面上叠一个能看日志的浮层。

它能做的事包括：

- 查看 console 日志
- 查看网络请求
- 查看页面 element 结构
- 查看 Cookies 和 localStorage
- 手动执行 JS 命令行
- 自定义插件

典型使用场景是移动端 H5 调试和小程序端调试，尤其是那些「只在某个用户的某台机器上复现」的问题，让对方打开带 vConsole 的测试链接，截个图发过来就有了完整日志。

### 6.1 接入方式

用 npm 装：

```bash
npm install vconsole
```

然后在入口处实例化。注意 `vConsole` 在你手动 new 之前不会被插入到网页中，所以想按环境控制显隐，只要控制这一行执行不执行就够了。

```js
//import vconsole
import VConsole from 'vconsole/dist/vconsole.min.js'

new VConsole(option) // 初始化

// option 是一个选填的 object 对象，具体配置定义请参阅 公共属性及方法
```

上面这个直接引 `dist` 下压缩产物的写法是当年的做法，现在 vConsole 的包已经配好了入口字段，直接 `import VConsole from 'vconsole'` 就行，交给打包工具去解析。原来的写法还能跑，但没必要绕这一圈。

不想走构建的话，也可以找到这个模块下面的 `dist/vconsole.min.js`，然后复制到自己的项目中，用 script 标签引入：

```html
<head>
    <script src="dist/vconsole.min.js"></script>
</head>
<!--建议在 `<head>` 中引入哦~ -->
<script>
  // 初始化
  var vConsole = new VConsole();
  console.log('VConsole is cool');
</script>
```

引入并实例化之后，页面右下角会出现一个绿色的圆形按钮，点开就是完整的调试面板。

![移动端页面右下角出现的 vConsole 入口按钮](https://s.poetries.top/gitee/2020/03/25.png)
![点开 vConsole 后展示的日志面板，可以看到 Log、System、Network、Element、Storage 等标签](https://s.poetries.top/gitee/2020/03/26.png)

面板底部那排标签就是它的全部能力：Log 看日志、Network 看请求、Element 看 DOM、Storage 看本地存储。手机上字小，双指放大再看。这里有个坑要注意，vConsole 是叠在页面上的真实 DOM，它会占据一小块点击区域，做全屏交互的页面记得在正式环境把它去掉。

### 6.2 日志类型与格式化

vConsole 支持 5 种不同类型的日志，会以不同的颜色输出到前端面板：

```js
console.log('foo');   // 白底黑字
console.info('bar');  // 白底紫字
console.debug('oh');  // 白底黄字
console.warn('foo');  // 黄底黄字
console.error('bar'); // 红底红字
```

它也支持打印 `Object` 或 `Array` 变量，会以结构化 JSON 形式输出并折叠：

```js
var obj = {};
obj.foo = 'bar';
console.log(obj);
/*
Object
{
  foo: "bar"
}
*/
```

支持传入多个参数，会以空格隔开：

```js
var uid = 233;
console.log('UserID:', uid); // 打印出 UserID: 233
```

还支持使用 `[system]` 作为第一个参数，来将 log 输出到 System 面板：

```js
// 'foo' 会输出到 System 面板
console.log('[system]', 'foo');
```

把框架级、生命周期级的日志统一打到 System 面板，业务日志留在 Log 面板，两边互不干扰，翻日志的时候会轻松很多。

### 6.3 内置的网络插件

所有 `XMLHttpRequest` 请求都会被显示到 `Network tab` 中。若不希望某个请求显示在面板中，可添加属性 `_noVConsole = true` 到 XHR 对象中：

```js
var xhr = new XMLHttpRequest();
xhr._noVConsole = true; // 不会显示到 tab 中
xhr.open("GET", 'http://example.com/');
xhr.send();
```

这个开关的用处是屏蔽轮询类请求。页面里有个 3 秒一次的心跳接口的话，不屏蔽掉，Network 面板会被它刷满，你要找的那条业务请求根本翻不到。

更多详情看官方文档 https://github.com/Tencent/vConsole/blob/dev/doc/tutorial_CN.md

## 七、WebView 是什么，为什么要单独调

vConsole 解决的是「看不到日志」，但它解决不了「页面在 App 里长得不一样」。这类问题的根源在 WebView。

WebView 本身是一个 view，以 webkit 作为核心，用来显示网页，包含了浏览器的基本功能。特点是：

- 它是 app 中的一个组件，app 可以有 webview，也可以没有
- 用于加载 h5 页面，相当于一个小型的浏览器内核

![WebView 在原生 App 中的位置示意，App 内嵌一个用于加载网页的组件](https://s.poetries.top/gitee/2020/03/27.png)
![WebView 加载 H5 页面的示意，原生容器里渲染出一个完整的网页](https://s.poetries.top/gitee/2020/03/28.png)

看这两张图就能明白：对用户来说那是一个 App 页面，对你来说那是一个网页，只不过跑在一个你控制不了的浏览器内核里。这也是为什么 PC 上一切正常的页面进了 App 就出问题。

### 7.1 file 协议

`file` 协议加载的是本地文件，最大的好处是快。

其实在一开始接触 `html` 开发，你就已经使用了 `file` 协议，只不过当时没有「协议」「标准」这些概念，双击一个 html 文件用浏览器打开，地址栏里就是 `file://` 开头。

![浏览器地址栏中以 file 协议打开本地 html 文件的示意](https://s.poetries.top/gitee/2020/03/29.png)

地址栏那个 `file://` 前缀就是关键。hybrid 方案之所以快，就是因为把前端资源提前放进了 App 包里，走本地协议加载，省掉了整个网络请求过程。

### 7.2 什么场景该用 hybrid

不是所有场景都适合使用 hybrid，选型大致是这样：

- 使用 NA（原生）：体验要求极致，变化不频繁，比如头条的首页
- 使用 hybrid：体验要求高，变化频繁，比如头条的新闻详情页
- 使用 h5：体验无要求，不常用，比如举报、反馈等页面

hybrid 的具体实现流程是：

- 前端做好静态页面（html js css），将文件交给客户端
- 客户端拿到前端静态页面，以文件形式存储在 app 中
- 客户端起一个 webview
- 使用 file 协议加载静态页面

![hybrid 方案的实现流程，前端产出静态资源交给客户端打包，客户端用 file 协议在 webview 中加载](https://s.poetries.top/gitee/2020/03/30.png)

图里这条链路有个隐含成本：资源在 App 包里，更新就得跟着发版。所以真实项目一般还会配一套离线包更新机制，让客户端能在不发版的情况下把 App 里的前端资源换掉。

### 7.3 WebView 的基本使用

从客户端的角度看，加载方式主要是这三种：

显示外部网页：

```
webview.loadUrl('https://baidu.com')
```

加载本地资源：

```
webview.loadUrl('file:///android_asset/test.html')
```

直接显示一段 html，可以渲染富文本格式：

```
var testHTML = '<html><body><p>test</p></body></html>'

webview.loadData(testHTML, 'text/html', null)
```

第三种原文写成了 `loadUrl(testHTML, 'text/html', null)`，那个签名对不上，Android 上直接塞 HTML 字符串用的是 `loadData`（或者带 baseUrl 的 `loadDataWithBaseURL`），我这里改过来了。另外原文那个 `testHTML` 的赋值没加引号，在 JS 里是语法错误，也一并补上了。

### 7.4 为什么必须真机调

在 PC 端，我们调试网页一般直接打开 chrome 或者 firefox 的开发者工具就 OK 了。Chrome 也有手机模式，可以粗略地预览下移动网页，但是这都太粗糙了。PC 上看到的和移动设备上看到的页面，可能根本不是一回事，放入 webview 之后也可能大变样，还会经历数不清的设备兼容性问题。所以我们需要能够在 PC 端直接调试移动设备上的网页，甚至直接调试 app 中的 webview。

使用 Chrome Inspect 调试混合应用可以帮我们排查问题，比如定位元素、快速修改 CSS 样式并实时查看效果。其实微信开发也是一种混合开发模式，微信可以看做一个原生的 Android App 搭配了一个 JS 运行环境（WebView），然后大家就可以愉快地使用 Web 前端技术（Html/Css/Js）开发微信网页、小程序了。

这块我后来单独又写过一篇更新版的踩坑记录，讲了 iOS 16.4 之后 `isInspectable` 默认关闭这类新变化，感兴趣可以看 [真机调试 WebView 完整指南](https://feinterview.poetries.top/blog/webview-real-device-debugging-ios-safari-android-chrome)。下面还是按 2020 年这套流程走。

## 八、Android WebView 真机调试

无论是调试 `Web` 页面还是调试 `Hybrid` 混合应用，只要是调试 `Android` 的 `webview`，都需要使用 `chrome://inspect` 进行调试。

### 8.1 基础流程

Google 提供的调试 Android 上 WebView 的步骤是：

1. 开启手机上的 USB 调试功能
2. 打开 Chrome 浏览器，地址栏输入 `chrome://inspect`，回车
3. `Chrome` 会自动检测手机上打开的 `App`，并列出可调试的 `WebView` 页面
4. 点击 `Inspect`

前三步都对的话，你应该能在页面上看到设备和它下面挂着的 WebView 列表。

![chrome://inspect 页面上列出的已连接设备及其可调试的 WebView 条目](https://s.poetries.top/gitee/2020/03/45.png)

每个 WebView 条目下面那个 `inspect` 链接就是入口。设备名旁边如果显示的是 `Offline` 或者一串未授权提示，回手机上看有没有弹出 USB 调试授权对话框。

点了 `inspect` 之后，国内开发者经常会撞上这一幕。

![点击 inspect 后 DevTools 打开的是一片空白页面，控制台提示资源加载失败](https://s.poetries.top/gitee/2020/03/46.png)

空白页，或者一个 `404 Not Found`。这不是你的手机有问题，问题出在资源来源上：由于无法访问 `https://chrome-devtools-frontend.appspot.com`，DevTools 的前端界面根本没下载下来。

Chrome 为什么要去访问那个网址，而不是提供本地的解决方案？大概率是版本问题。DevTools 前端要和 WebView 的内核版本对上，对于海量版本都打包到 Chrome 安装程序里，势必会大大增加安装包的体积。上面截图里 `@640` 那一串字符就是其中的一个版本号，当你换一个手机或模拟器，版本号可能就不一样了，因为不同型号的手机生产商可能会打包不同版本的 Chrome 浏览器内核。

解决方法有两种：

1. 最直接的方法是翻墙，最大的问题是免费的不稳定
2. 使用离线开发者调试工具包

由于是离线包，当你点击 Inspect 时就不用再去 Google 下载了，而是直接从本地加载，从而达到了不 FQ 使用 Inspect 调试的目的。

补一个后来才知道的更省事的办法：新版 Chrome 的 `chrome://inspect` 里，每个条目除了 `inspect` 还多了一个 `inspect fallback` 链接，它用的是 Chrome 本地内置的那份 DevTools 前端，不依赖外网，断网也能开。碰到白屏先点它试试，比装离线包快。

### 8.2 列表里死活不显示 WebView

首先确保手机打开了 USB 调试。如果还是检测不到 WebView 页面，主要有以下几种情况：

- 反应慢，稍等一会
- 关闭然后重新打开 USB 调试开关，刺激一下 Chrome，我的魅族手机有时需要这样操作一下
- 华为手机需要同时打开 USB 调试和「仅充电模式下允许 ADB 调试」

第三条这个开关藏得比较深，位置见下图。

![华为手机开发者选项中的 USB 调试与仅充电模式下允许 ADB 调试两个开关](https://s.poetries.top/gitee/2020/03/42.png)

两个开关都要打开。国产 ROM 各家的叫法不太一样，找不到就在开发者选项里把所有带 USB 字样的项都翻一遍。

如果还不行，请安装对应厂商的手机助手，插上手机后一般会提示安装。不安装的话，可能会出现不稳定的情况。

如果手机型号识别了，但是没有识别 WebView，可能是要调试的 APP 没有打开 WebView 的调试模式，所以会出现有的 App 能 Inspect、有的不能。这一条是最容易被忽略的，下面单独讲。

### 8.3 让 App 允许 WebView 被调试

`Cordova/Ionic` 开发的 `Android APP` 需要启用 WebView 的调试模式，才可以在 Chrome 浏览器中输入 `chrome://inspect` 然后使用开发者工具进行调试。不启用的话，就看不到 App 中的 WebView 页面，也没有 Inspect 链接。

前提是确保 Android 版本 4.4 以上。然后打开 src 下的主活动文件，如 `MainActivity.java`，导入命名空间：

```java
import android.os.Build;
import android.util.Log;
import android.content.pm.ApplicationInfo;
import android.webkit.WebView;
```

![MainActivity.java 中导入调试相关命名空间的代码位置](https://s.poetries.top/gitee/2020/03/44.png)

这几行要加在文件顶部已有的导入语句后面，位置就是图里那一块。加错地方会直接编译不过。

找到 `onCreate()` 方法，添加如下代码：

```java
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
    if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
        Log.i("Your app", "Enabling web debugging");
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
```

原文这段里那个内层判断写的是 `getApplicationInfo().flags = ApplicationInfo.FLAG_DEBUGGABLE`，一个等号是赋值不是按位与，那样写会把 flags 整个覆盖掉，判断结果也永远不对。这里按官方文档的写法改成了 `&` 位运算，判断的是「当前包是不是 debuggable」。外面这层 `BuildConfig.DEBUG` 或者 `FLAG_DEBUGGABLE` 的判断一定要留着，正式包里把 WebView 调试打开等于把你的内嵌页面逻辑敞开给任何能连上 adb 的人。

### 8.4 实操：调微信里的 H5

下面以微信 App 为例，调试 App 内的 webview，按步骤依次操作：

1. 开启手机上的 USB 调试功能
2. 打开 Chrome 浏览器，地址栏输入 `chrome://inspect`，回车
3. `Chrome` 会自动检测手机上打开的 `App`，并列出可调试的 `WebView` 页面
4. 在手机上给自己微信发送 `http://debugx5.qq.com` 这个地址并打开，开启 TBS 调试开关

第 4 步是微信特有的。微信用的是自家的 X5 内核，不打开 TBS 开关，Inspect 时会检测不到任何微信的 H5 页面。下面几张图是完整的操作过程。

![在微信中打开 debugx5.qq.com 后的 TBS 调试页面，包含是否打开 TBS 内核 Inspect 调试的开关](https://s.poetries.top/gitee/2020/03/49.png)
![勾选 TBS 内核调试开关后的状态，提示需要重启微信生效](https://s.poetries.top/gitee/2020/03/50.png)
![开启调试开关后，chrome://inspect 中成功列出微信里正在打开的 H5 页面](https://s.poetries.top/gitee/2020/03/47.png)
![点击 inspect 后弹出的 DevTools 窗口，左侧是手机屏幕镜像，右侧是完整的开发者工具面板](https://s.poetries.top/gitee/2020/03/48.png)

到最后这张图就成功了：左边是手机画面的实时镜像，可以直接用鼠标点，操作会同步到真机；右边是你熟悉的那套面板，Elements、Console、Network 全都能用。开关改完记得杀掉微信进程重进，不然不生效，这一步我第一次弄的时候卡了挺久。

## 九、iOS 真机调试

`iOS` 中的 webview 以及 iOS 中的 Safari 如何在 Mac 中采用 Safari 调试，需要的环境很简单：一台 iPhone 加一台 Mac 电脑。注意 iOS 这条路必须有 Mac，Windows 上没有对应方案。

第一步，在 iPhone 中设置 Safari，开启 Web 检查器。路径是「设置 → Safari 浏览器 → 高级 → 网页检查器」。

![iPhone 设置中 Safari 高级选项下的网页检查器开关](https://s.poetries.top/gitee/2020/03/31.png)

把这个开关打开。找不到「高级」的话往 Safari 设置页最底部翻。新版 iOS 把设置 App 重构过，Safari 相关设置可能被挪到了「应用」分组下面，不同系统版本入口位置有差异。

第二步，用 USB 线连上 Mac，然后打开 Mac 中的 Safari，点开「开发」菜单，就可以看到你的移动设备，然后可以调试其中的网页和 webview。

![Mac 上 Safari 的开发菜单中列出已连接的 iPhone 设备及其中可调试的页面](https://s.poetries.top/gitee/2020/03/32.png)

菜单里设备名下面挂的就是当前手机上打开的页面，点一下就会弹出网页检查器。如果菜单栏里根本没有「开发」这一项，去 Safari 设置的「高级」里勾选「在菜单栏中显示开发菜单」。另外第一次连线手机上会弹「是否信任此电脑」，必须点信任。

就这样简单两步，就可对 iOS 设备进行真机调试。

## 十、Node.js 调试

前面都是浏览器侧。Node 服务出问题的时候，同一套 DevTools 其实也能用上。为了方便讲解，我们新建了一个项目：

https://github.com/tomoat/koa2-generator

```
koa2 -e koa2-demo
```

### 10.1 打日志这种方式的局限

先回顾下我们平时的调试方式：

- 在某个需要输出的地方加 `console.log()` 或 `console.dir()`，打印调试结果
- 引入 `debug` 模块，对调试区域按命名空间打日志

这两种调试方式都需要我们显式将各种 debug 信息嵌入到业务逻辑代码中。平时使用也是可以的，但是在复杂项目中不太方便：你得先猜到问题在哪，才知道该往哪儿加日志；猜错了就得改代码、重启服务、再复现一遍。

### 10.2 用 Chrome DevTools 调 Node

用 Inspector 调试 Node.js 的优势在于：

- 可查看当前上下文的变量
- 可以观察当前函数调用堆栈
- 不会侵入代码
- 可以在暂停状态下执行一些指定代码

新版本的 `Chrome` 浏览器和新版本的 `Node.js` 支持通过一个新的调试协议互相直接通讯了，就不再需要 `node-inspector` 了。要求是 `nodejs 6.3+` 和 `Chrome 55+`。

以上面的例子为例，运行 `node --inspect bin/www`，Node 进程会通过 WebSockets 监听调试客户端信息。`--inspect` 参数是启动调试模式必需的，然后打开浏览器访问 `http://127.0.0.1:3000`。

`--inspect` 激活调试后，做了两件事：启动一个 WebSocket 服务用来接收调试命令，同时起一个 HTTP 服务提供元信息。

```
$ node --inspect bin/www

# facbf3d7-96a3-4a55-b628-67bfe9790d6a是userId 每个程序都不一样

Debugger listening on ws://127.0.0.1:9229/facbf3d7-96a3-4a55-b628-67bfe9790d6a
For help see https://nodejs.org/en/docs/inspector
listen 3000 port: http://localhost:3000
```

这里的 9229 是 Inspector 的默认端口，和你应用自己的 3000 端口是两回事，别搞混。打开 `http://127.0.0.1:9229/json` 可以看到 HTTP 服务的一些元信息：

```json
[ {
  "description": "node.js instance",
  "devtoolsFrontendUrl": "chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:9229/facbf3d7-96a3-4a55-b628-67bfe9790d6a",
  "faviconUrl": "https://nodejs.org/static/favicon.ico",
  "id": "facbf3d7-96a3-4a55-b628-67bfe9790d6a",
  "title": "bin/www",
  "type": "node",
  "url": "file:///Users/poetry/workspace/work/jiazhaoye/share/koa2-demo/bin/www",
  "webSocketDebuggerUrl": "ws://127.0.0.1:9229/facbf3d7-96a3-4a55-b628-67bfe9790d6a"
} ]
```

注意里面 `devtoolsFrontendUrl` 的协议头是 `chrome-devtools://`，较新的 Chrome 已经把这个协议头改成了 `devtools://`，直接粘贴老链接可能打不开。inspect 命令的参数详情看官方文档 https://nodejs.org/zh-cn/docs/guides/debugging-getting-started

### 10.3 三种打开调试面板的方式

第一种，访问 `chrome://inspect`。

![chrome://inspect 页面下方的 Remote Target 区域列出了正在调试的 Node 进程](https://s.poetries.top/gitee/2020/03/debug.png)

Node 进程会出现在 `Remote Target` 那一栏里，点下面的 `inspect` 就能连进去。看不到的话检查 `Discover network targets` 的配置里有没有 `localhost:9229`。

第二种，打开 Chrome 开发者工具，点击左上角那个绿色的 Node 图标也可以进入。

![Chrome 开发者工具左上角出现的绿色 Node.js 图标，点击可打开专用调试窗口](https://s.poetries.top/gitee/2020/03/debug2.png)

这个绿色小图标只有在检测到本地有 Node 调试进程时才会出现，所以它同时也是个「调试进程起没起来」的指示灯。

第三种，直接访问 `127.0.0.1:9229/json` 元信息中的 `devtoolsFrontendUrl` 地址。

打开之后的调试工具只有四个面板，其实就是开发者工具的定制版，省去了很多用不到的功能。

![Node 专用调试窗口的界面，只有 Console、Memory、Profiler 和 Sources 四个面板](https://s.poetries.top/gitee/2020/03/debug3.png)

四个面板分别是：

- `Console`：控制台
- `Memory`：内存
- `Profiler`：性能
- `Sources`：源码

Elements 面板没有是正常的，Node 里没有 DOM。这里主要介绍 Sources 中设置断点的形式。

![在 Node 调试窗口的 Sources 面板中给服务端代码打断点并命中后的界面，右侧显示作用域变量](https://s.poetries.top/gitee/2020/03/debug4.png)

断点命中后可以看到右侧面板里的变量状态，我们也可以在 `Watch` 那一栏添加需要监听的变量。调用栈能一路往上翻到框架内部，看清楚一个请求到底经过了哪几层中间件。

### 10.4 调试已经跑起来的 Node 进程

有时候服务已经在跑了，你不想重启它（重启就复现不了了）。这种情况可以这样做：

首先服务正常启动着，然后查找它的进程号：

```bash
$ ps ax | grep bin/www

# 可以看到，node程序进程号是53999
90581 s002  R+     0:00.00 grep --color=auto bin/www
53999 s003  S+     0:02.62 node bin/www
```

接着执行 `node -e 'process._debugProcess(53999)'`，上面命令会建立进程 53999 与调试工具的连接，然后就可以打开调试工具了。

原文这段的 `ps` 输出里写的是 `node --inspect bin/www`，和标题「调试没有 --inspect 激活的 node 程序」自相矛盾，我把它改成了 `node bin/www`。另外在 Linux 和 macOS 上，给进程发 `SIGUSR1` 信号（`kill -USR1 53999`）也是等价的做法。

### 10.5 VSCode 里配 launch.json

之前的方式在实际开发中不太方便，那有没有更好的方式呢？答案是肯定的。我们可以通过 `vscode`、`webstorm` 直接在代码编辑器里调试。

步骤是：

1. 打开项目，点击旁边的调试按钮
2. 配置 `vscode` 的 `launch.json` 文件
3. 打断点
4. 启动项目
5. 打开 `http://localhost:3000/poetries`

![VSCode 调试面板中配置好的 launch.json 启动项，指定了 Node 程序入口](https://s.poetries.top/gitee/2020/03/debug5.png)

配置里最关键的是 `program` 那一项，指向你的启动入口文件。如果项目是靠 npm script 起的，用 `runtimeExecutable` 配 `npm` 加 `runtimeArgs` 也可以。

把项目跑起来，我们就可以调试代码了，非常方便。进入断点后调试界面如下。

![VSCode 中命中断点后的调试界面，左侧显示变量、监视和调用堆栈，代码行内直接内联显示变量值](https://s.poetries.top/gitee/2020/03/debug6.png)

在界面的左边，可以查看当前上下文环境，也可以设置变量监听。将鼠标放在断点前的变量或者参数上，也可以查看该变量当前的数值，体验与 Chrome 开发者工具的调试一致。VSCode 还会把变量的值直接内联显示在代码行尾，这个设计是真的舒服，不用一个个悬停去看。

## 总结

把这一整篇串起来看，调试其实就是在回答四个问题，每个问题有它固定的去处：

数据对不对，去 Network 看请求和响应，重点看 `Initiator` 列和 Timing 那张分解表；代码走到哪，去 Sources 打断点，行断点定不到就上 DOM 断点、XHR 断点、事件断点；手机上看不到日志，先上 vConsole 兜底；App 里的页面表现不对，那就必须连真机，Android 走 `chrome://inspect` 并且别忘了 `setWebContentsDebuggingEnabled`，iOS 走 Mac 上 Safari 的开发菜单；服务端出问题，Node 的 `--inspect` 让你用同一套 DevTools 打断点，日常开发直接配 VSCode 的 `launch.json` 更省事。

这篇里的截图是 2020 年的 Chrome，面板名称和入口后来改过不少，比如 `Audits` 改叫 `Lighthouse`，`XHR Breakpoints` 改叫 `XHR/fetch Breakpoints`，`chrome-devtools://` 协议头变成了 `devtools://`。不同 Chrome 版本入口位置有差异，按功能去找就行，底层的调试思路这几年基本没变过。

最后说一句我自己的感受：调试工具会用是一回事，能不能快速缩小范围是另一回事。真正省时间的从来不是记住多少个快捷键，而是在动手之前先想清楚「我怀疑问题在哪一层」，然后只在那一层上花力气。

## 参考

- [Chrome DevTools 官方文档](https://developer.chrome.com/docs/devtools)
- [Chrome DevTools 断点调试指南](https://developer.chrome.com/docs/devtools/javascript/breakpoints)
- [Remote debugging Android devices](https://developer.chrome.com/docs/devtools/remote-debugging)
- [Android WebView.setWebContentsDebuggingEnabled 文档](https://developer.android.com/reference/android/webkit/WebView#setWebContentsDebuggingEnabled(boolean))
- [Node.js Debugging Getting Started](https://nodejs.org/en/learn/getting-started/debugging)
- [vConsole 使用教程](https://github.com/Tencent/vConsole/blob/dev/doc/tutorial_CN.md)
- [前端进阶之旅](https://interview.poetries.top)
