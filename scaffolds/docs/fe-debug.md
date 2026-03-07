---
title: 前端之调试
date: 2020-03-26 09:35:08
tags: 前端调试
categories: Front-End
---

# 一、Chrome devtool调试

Chrome 开发者工具有很多重要的面板，比如与性能相关的有网络面板、`Performance` 面板、内存面板等，与调试页面相关的有 `Elements` 面板、`Sources` 面板、`Console` 面板等。

你可以在浏览器窗口的右上方选择 `Chrome` 菜单，然后选择“更多工具–> 开发者工具”来打开` Chrome` 开发者工具。打开的页面如下图所示

![](https://poetries1.gitee.io/img-repo/2020/03/7.png)

从图中可以看出，它一共包含了 10 个功能面板，包括了 

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

**10 个面板的大致功能**

![](https://poetries1.gitee.io/img-repo/2020/03/8.png)

简单来说，`Chrome` 开发者工具为我们提供了通过界面访问或者编辑 `DOM` 和 `CSSOM` 的能力，还提供了强大的调试功能和查看性能指标的能力。

OK，接下来我们就要重点看下`Network` 面板、`console`面板、`source`调试面板

## 1.1 console面板

```js
console.log("打印字符串");//在控制台打印自定义字符串
console.error("我是个错误");//在控制台打印自定义错误信息
console.info("我是个信息");//在控制台打印自定义信息
console.warn("我是个警告");//在控制台打印自定义警告信息
console.debug("我是个调试");//在控制台打印自定义调试信息
```

**格式化输出**

> 除此以外，`console`还支持自定义样式和类似c语言`printf`形式

```js
console.log("%s年",2016);//%s表示字符串
console.log("%d年%d月",2016,11);//%d表示整数
console.log("%f",3.1415926);//%f小数
console.log("%o",console);//%o表示对象

console.log("%c自定义样式","font-size:30px;color:#00f");
console.log("%c我是%c自定义样式","font-size:20px;color:green","font-size:10px;color:red");
```

## 1.2 网络面板

> 网络面板由控制器、过滤器、抓图信息、时间线、详细列表和下载信息概要这 6 个区域构成（如下图所示）

![](https://poetries1.gitee.io/img-repo/2020/03/9.png)

1. 控制器

其中，控制器有 4 个比较重要的功能，我们按照下文中的这张图来简单介绍下

![](https://poetries1.gitee.io/img-repo/2020/03/10.png)

- 红色圆点的按钮，表示“开始 / 暂停抓包”，这个功能很常见，很容易理解
- “全局搜索”按钮，这个功能就非常重要了，可以在所有下载资源中搜索相关内容，还可以快速定位到某几个你想要的文件上
- Disable cache，即“禁止从 Cache 中加载资源”的功能，它在调试 Web 应用的时候非常有用，因为开启了 Cache 会影响到网络性能测试的结果
- Online 按钮，是“模拟 2G/3G”功能，它可以限制带宽，模拟弱网情况下页面的展现情况，然后你就可以根据实际展示情况来动态调整策略，以便让 Web 应用更加适用于这些弱网

2. 过滤器

网络面板中的过滤器，主要就是起过滤功能。因为有时候一个页面有太多内容在详细列表区域中展示了，而你可能只想查看 JavaScript 文件或者 CSS 文件，这时候就可以通过过滤器模块来筛选你想要的文件类型。

3. 抓图信息

抓图信息区域，可以用来分析用户等待页面加载时间内所看到的内容，分析用户实际的体验情况。比如，如果页面加载 1 秒多之后屏幕截图还是白屏状态，这时候就需要分析是网络还是代码的问题了。（勾选面板上的“Capture screenshots”即可启用屏幕截图。）

4. 时间线

时间线，主要用来展示 `HTTP`、`HTTPS`、`WebSocket` 加载的状态和时间的一个关系，用于直观感受页面的加载过程。如果是多条竖线堆叠在一起，那说明这些资源被同时被加载。至于具体到每个文件的加载信息，还需要用到下面要讲的详细列表

5. 详细列表

这个区域是最重要的，它详细记录了每个资源从发起请求到完成请求这中间所有过程的状态，以及最终请求完成的数据信息。通过该列表，你就能很容易地去诊断一些网络问题。

> 详细列表是我们本篇文章介绍的重点

6. 下载信息概要

下载信息概要中，你要重点关注下 `DOMContentLoaded` 和 `Load` 两个事件，以及这两个事件的完成时间。

- `DOMContentLoaded`，这个事件发生后，说明页面已经构建好 `DOM` 了，这意味着构建 `DOM` 所需要的 HTML 文件、`JavaScript` 文件、`CSS` 文件都已经下载完成了
- `Load`，说明浏览器已经加载了所有的资源（图像、样式表等）

> 通过下载信息概要面板，你可以查看触发这两个事件所花费的时间

### 网络面板中的详细列表

下面我们就来重点介绍网络面板中的详细列表，这里面包含了大量有用的信息

1. 列表的属性

列表的属性比较多，比如 Name、Status、Type、Initiator 等等，这个不难理解。当然，你还可以通过点击右键的下拉菜单来添加其他属性，这里我就不再赘述了，你可以自己上手实操一下。

另外，你也可以按照列表的属性来给列表排序，默认情况下，列表是按请求发起的时间来排序的，最早发起请求的资源在顶部。当然也可以按照返回状态码、请求类型、请求时长、内容大小等基础属性排序，只需点击相应属性即可。

![](https://poetries1.gitee.io/img-repo/2020/03/11.png)

2. 详细信息

如果你选中详细列表中的一项，右边就会出现该项的详细信息，如下所示：

![](https://poetries1.gitee.io/img-repo/2020/03/12.png)

你可以在此查看请求列表中任意一项的请求行和请求头信息，还可以查看响应行、响应头和响应体。然后你可以根据这些查看的信息来判断你的业务逻辑是否正确，或者有时候也可以用来逆向推导别人网站的业务逻辑。

3. 单个资源的时间线

了解了每个资源的详细请求信息之后，我们再来分析单个资源请求时间线，这就涉及具体的 HTTP 请求流程了

在发起一个 HTTP 请求之后，浏览器首先查找缓存，如果缓存没有命中，那么继续发起 DNS 请求获取 IP 地址，然后利用 IP 地址和服务器端建立 TCP 连接，再发送 HTTP 请求，等待服务器响应；不过，如果服务器响应头中包含了重定向的信息，那么整个流程就需要重新再走一遍。这就是在浏览器中一个 HTTP 请求的基础流程。

> 那详细列表中是如何表示出这个流程的呢？这就要重点看下时间线面板了

![](https://poetries1.gitee.io/img-repo/2020/03/14.png)

**那面板中这各项到底是什么含义呢？**

> 第一个是 Queuing，也就是排队的意思，当浏览器发起一个请求的时候，会有很多原因导致该请求不能被立即执行，而是需要排队等待。导致请求处于排队状态的原因有很多

- 首先，页面中的资源是有优先级的，比如 CSS、HTML、JavaScript 等都是页面中的核心文件，所以优先级最高；而图片、视频、音频这类资源就不是核心资源，优先级就比较低。通常当后者遇到前者时，就需要“让路”，进入待排队状态。
- 其次，我们前面也提到过，浏览器会为每个域名最多维护 6 个 TCP 连接，如果发起一个 HTTP 请求时，这 6 个 TCP 连接都处于忙碌状态，那么这个请求就会处于排队状态。
- 最后，网络进程在为数据分配磁盘空间时，新的 HTTP 请求也需要短暂地等待磁盘分配结束

1. 等待排队完成之后，就要进入发起连接的状态了。不过在发起连接之前，还有一些原因可能导致连接过程被推迟，这个推迟就表现在面板中的Stalled上，它表示停滞的意思
2. 接下来，就到了Initial connection/SSL 阶段了，也就是和服务器建立连接的阶段，这包括了建立 TCP 连接所花费的时间；不过如果你使用了 HTTPS 协议，那么还需要一个额外的 SSL 握手时间，这个过程主要是用来协商一些加密信息的
3. 和服务器建立好连接之后，网络进程会准备请求数据，并将其发送给网络，这就是Request sent 阶段。通常这个阶段非常快，因为只需要把浏览器缓冲区的数据发送出去就结束了，并不需要判断服务器是否接收到了，所以这个时间通常不到 1 毫秒。
4. 数据发送出去了，接下来就是等待接收服务器第一个字节的数据，这个阶段称为 Waiting (TTFB)，通常也称为“第一字节时间”。 `TTFB` 是反映服务端响应速度的重要指标，对服务器来说，`TTFB` 时间越短，就说明服务器响应越快
5. 接收到第一个字节之后，进入陆续接收完整数据的阶段，也就是`Content Download` 阶段，这意味着从第一字节时间到接收到全部响应数据所用的时间

**优化时间线上耗时项**

> 了解了时间线面板上的各项含义之后，我们就可以根据这个请求的时间线来实现相关的优化操作了。

1. 排队（Queuing）时间过久

排队时间过久，大概率是由浏览器为每个域名最多维护 6 个连接导致的。那么基于这个原因，你就可以让 1 个站点下面的资源放在多个域名下面，比如放到 3 个域名下面，这样就可以同时支持 18 个连接了，这种方案称为域名分片技术。除了域名分片技术外，我个人还建议你把站点升级到 HTTP2，因为 HTTP2 已经没有每个域名最多维护 6 个 TCP 连接的限制了。

2. 第一字节时间（TTFB）时间过久

这可能的原因有如下：

- 服务器生成页面数据的时间过久。对于动态网页来说，服务器收到用户打开一个页面的请求时，首先要从数据库中读取该页面需要的数据，然后把这些数据传入到模板中，模板渲染后，再返回给用户。服务器在处理这个数据的过程中，可能某个环节会出问题。
- 网络的原因。比如使用了低带宽的服务器，或者本来用的是电信的服务器，可联通的网络用户要来访问你的服务器，这样也会拖慢网速。
- 发送请求头时带上了多余的用户信息。比如一些不必要的 Cookie 信息，服务器接收到这些 Cookie 信息之后可能需要对每一项都做处理，这样就加大了服务器的处理时长。

> 对于这三种问题，你要有针对性地出一些解决方案。面对第一种服务器的问题，你可以想办法去提高服务器的处理速度，比如通过增加各种缓存的技术；针对第二种网络问题，你可以使用 CDN 来缓存一些静态文件；至于第三种，你在发送请求时就去尽可能地减少一些不必要的 Cookie 数据信息

3. Content Download 时间过久

如果单个请求的 `Content Download` 花费了大量时间，有可能是字节数太多的原因导致的。这时候你就需要减少文件大小，比如压缩、去掉源码中不必要的注释等方法

## 1.3 source面板

![](https://poetries1.gitee.io/img-repo/2020/03/40.png)

> 我们可以在这里断点调试JS

**调试JS代码**

- 点击JS代码块前面的数字外来设置断点，如果当前代码是经过压缩的话，可以点击下方的花括号{}来增强可读性，所有的断点都会列出右侧的断点区。

### 1.3.1 断点调试

#### 1.3.1.1 debug介绍

下图红色区域从左至右依次是：

- （等号）pause script execution –>暂停脚本执行
- （半弧箭头）step 快捷键：F9 –>单步执行 注意：遇到子函数会进去继续单步执行
- （下箭头）step into 快捷键：F11 全称：step into next function call –>单步执行，遇到子函数就进去继续单步执行
- （上箭头）step over 快捷键：F10 全称：step over next function call –>单步执行，遇到子函数并不进去，将子函数执行完并将其作为一个单步
- （右箭头）step out 快捷键：Shift + F11 全称：step out of current function –>直接跳出当前的函数，返回父级函数
- （右粗箭头，点击一下多一个斜线，再次点击就取消了）deactivate breakpoints or activate breakpoints –>禁用断点/启用断点
- （圆形等号）pause on execution –>暂停执行

![](https://poetries1.gitee.io/img-repo/2020/03/15.png)

#### 1.3.1.2 行断点

**1. 代码行断点**

- 点击 `Sources` 标签。
- 打开包含您想要中断的代码行的文件。
- 转至代码行。
- 代码行的左侧是行号列。 点击行号列。 行号列顶部将显示一个蓝色图标。

![](https://poetries1.gitee.io/img-repo/2020/03/16.png)


**2. 条件代码行断点**

> 在代码中调用debugger 可在该行暂停。 此操作相当于使用代码行断点，只是此断点是在代码中设置，而不是在 DevTools 界面中设置。

```js
console.log('a');
console.log('b');
debugger;
console.log('c');
```

**3. 管理代码行断点**

- 勾选条目旁的复选框可以停用相应的断点。
- 右键点击条目可以移除相应的断点。
- 点击代码可以跳转到断点对应位置

![](https://poetries1.gitee.io/img-repo/2020/03/17.png)

> 右键点击 Breakpoints 窗格中的任意位置可以取消激活所有断点、停用所有断点，或移除所有断点。 停用所有断点相当于取消选中每个断点。 取消激活所有断点可让 DevTools 忽略所有代码行断点，但同时会继续保持其启用状态，以使这些断点的状态与取消激活之前相同。

![](https://poetries1.gitee.io/img-repo/2020/03/18.png)

#### 1.3.1.3 DOM 更改断点

**设置 DOM 更改断点：**

- 点击 Elements 标签。
- 转至要设置断点的元素。
- 右键点击此元素。
- 将鼠标指针悬停在 Break on 上，然后选择 Subtree modifications、Attribute modifications 或 Node removal

> - Subtree modifications：在移除或添加当前所选节点的子级，或更改子级内容时触发这类断点。 在子级节点属性发生变化或对当前所选节点进行任何更改时不会触发这类断点。
> - Attributes modifications：在当前所选节点上添加或移除属性，或属性值发生变化时触发这类断点。
> - Node Removal：在移除当前选定的节点时会触发

![](https://poetries1.gitee.io/img-repo/2020/03/19.png)

> 图为DOM断点在source面板的窗格

![](https://poetries1.gitee.io/img-repo/2020/03/20.png)


#### 1.3.1.4 XHR/Fetch 断点

- 点击 `Sources` 标签。
- `XHR Breakpoints` 窗格。
- 点击 `Add breakpoint`。
- 输入要对其设置断点的字符串。 `DevTools `会在 XHR 的请求网址的任意位置显示此字符串时暂停。
- 按 Enter 键以确认。

![](https://poetries1.gitee.io/img-repo/2020/03/21.png)

#### 1.3.1.5 事件侦听器断点

- 点击 `Sources` 标签。
- 展开 `Event Listener Breakpoints` 窗格。 `DevTools` 会显示 `Animation` 等事件类别列表。
- 勾选这些类别之一以在触发该类别的任何事件时暂停，或者展开类别并勾选特定事件

![](https://poetries1.gitee.io/img-repo/2020/03/22.png)

#### 1.3.1.6 异常断点

> 引发已捕获或未捕获异常的代码行暂停，可以使用异常断点。

- 点击 Sources 标签。
- 点击 Pause on exceptions 引发异常时暂停。 启用后，此按钮变为蓝色

![](https://poetries1.gitee.io/img-repo/2020/03/23.png)

### 1.3.2 Filesystem

> 在 Chrome DevTools上调试 css 或 JavaScript时，修改的属性值在重新刷新页面时，所有的修改都会被重置。如果你想把修改的值保存下来并且同步到本地，可以使用Source的Filesystem，来与本地目录进行映射，前提是必须拥有，如果本地没有代码，那么更改不会被保存同步

![](https://poetries1.gitee.io/img-repo/2020/03/24.png)

### 1.3.3 Overrides

> 与Filesystem的区别，Filesystem必须在本地有源代码，Overrides则不需要。

写在 Chrome DevTools上调试 css 或 JavaScript时，修改的属性值在重新刷新页面时，所有的修改都会被重置。如果你想把修改的值保存下来，刷新页面的时候不会被重置，可以使用Overrides

### 1.3.4 Snippets 随时编写代码

- `Chrome`在`souces`页面提供`snippets`一栏，这里我们可以随时编写`JS`代码，运行结果会打印到控制台。代码是全局保存的，我们在任何页面，包括新建标签页，都可以查看或运行这些代码。
- 我们不再需要为了运行一小段`JS`代码而新建一个`HTML`页面。`snippets`的方便之处在于，你只需要打开`chrome`就可以编写一份任意页面都可以运行的`JS`代码

# 二、vConsole调试

> vConsole是腾讯出的一个轻量、可拓展、针对手机网页的前端开发者调试面板

## 2.1 特性

- 查看 console 日志
- 查看网络请求
- 查看页面 element 结构
- 查看 Cookies 和 localStorage
- 手动执行 JS 命令行
- 自定义插件

**使用场景**

- 移动端调试
- 小程序端调试

## 2.2 使用方式 


### 2.2.1 初始化配置

```bash
npm install vconsole
```

```js
//import vconsole
import VConsole from 'vconsole/dist/vconsole.min.js'

new VConsole(option) // 初始化

// option 是一个选填的 object 对象，具体配置定义请参阅 公共属性及方法
```

> 或者找到这个模块下面的 `dist/vconsole.min.js` ，然后复制到自己的项目中


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

> 在手动 new 实例化之前，`vConsole` 不会被插入到网页中

![](https://poetries1.gitee.io/img-repo/2020/03/25.png)
![](https://poetries1.gitee.io/img-repo/2020/03/26.png)


**日志类型**

> 支持 5 种不同类型的日志，会以不同的颜色输出到前端面板

```js
console.log('foo');   // 白底黑字
console.info('bar');  // 白底紫字
console.debug('oh');  // 白底黄字
console.warn('foo');  // 黄底黄字
console.error('bar'); // 红底红字
```

### 2.2.2 Object/Array 结构化展示

> 支持打印 `Object` 或 `Array` 变量，会以结构化 JSON 形式输出（并折叠）：

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

### 2.2.3 支持传入多个参数

> 支持传入多个参数，会以空格隔开：

```js
var uid = 233;
console.log('UserID:', uid); // 打印出 UserID: 233
```

### 2.2.4 特殊格式

> 支持使用 `[system]` 作为第一个参数，来将 log 输出到 System 面板：

```js
// 'foo' 会输出到 System 面板
console.log('[system]', 'foo'); 
```

## 2.3 内置插件

> 所有 `XMLHttpRequest` 请求都会被显示到 `Network tab` 中

> 若不希望一个请求显示在面板中，可添加属性 `_noVConsole = true` 到 XHR 对象中

```js
var xhr = new XMLHttpRequest();
xhr._noVConsole = true; // 不会显示到 tab 中
xhr.open("GET", 'http://example.com/');
xhr.send();
```

> 更多详情 https://github.com/Tencent/vConsole/blob/dev/doc/tutorial_CN.md

# 三、webview调试

## 3.1 webview 介绍

> webview本身是一个view，以webkit作为核心的，用来显示网页，包含了浏览器的基本功能

- 是 app 中的一个组件（ app 可以有 webview ，也可以没有）
- 用于加载 h5 页面，即一个小型的浏览器内核

![](https://poetries1.gitee.io/img-repo/2020/03/27.png)
![](https://poetries1.gitee.io/img-repo/2020/03/28.png)

## 3.2 原理

### 3.2.1 file 协议

> `file` 协议：本地文件，快

- 其实在一开始接触 `html`开发，就已经使用了 `file` 协议
- 只不过你当时没有“协议”“标准”等这些概念

![](https://poetries1.gitee.io/img-repo/2020/03/29.png)

### 3.2.2 具体实现

- 不是所有场景都适合使用 hybrid
- 使用 NA ：体验要求极致，变化不频繁（无头条的首页）
- 使用 hybrid ：体验要求高，变化频繁（如头条的新闻详情页）
- 使用 h5：体验无要求，不常用（如举报、反馈等页面）

**实现**

- 前端做好静态页面（html js css），将文件交给客户端
- 客户端拿到前端静态页面，以文件形式存储在 app 中
- 客户端在一个 webview 中
- 使用 file 协议加载静态页面

![](https://poetries1.gitee.io/img-repo/2020/03/30.png)

## 3.3 webview的基本使用

1. webview显示外部网页

```
webview.loadUrl('https://baidu.com')
```

2. webview加载本地资源

```
webview.loadUrl('file:///android_asset/test.html')
```

3. webview显示html语句

> 可以显示富文本的格式

```
var testHTML = <html><body>
  <p>test</p>
</body></html>

webview.loadUrl(testHTML,'text/html',null)
```

## 3.4 webview中如何调试

- 在PC端，我们调试网页一般直接打开chrome或者firefox的开发者工具就OK了，chrome也有手机模式，可以粗略地预览下移动网页，但是这都太粗糙了，PC上看到的，和移动设备上看到的页面，可能根本不是一回事，并且放入webview之后，也可能大变样，并且还会经历数不清的设备兼容性问题，我们需要能够在PC端，直接调试移动设备上的网页，甚至直接调试app中的webview
- 使用Chrome Inspect调试混合应用可以帮助我们排查问题。例如定位元素，快速修改CSS样式并实时查看效果。其实微信开发也是一种混合开发模式，微信可以看做一个原生的Android App搭配了一个JS运行环境（WebView），然后大家就可以愉快地使用Web前端技术（Html/Css/Js）开发微信网页、小程序了

### 3.4.1 安卓中webview调试


#### 3.4.1.1 基础调试

> 无论是调试`Web`页面还是调试`Hybrid`混合应用，只要是调试`Android`的`webview`，都需要使用`Chrome://inspect`进行调试。

**Google提供的调试Android上WebView的步骤**

1. 开启手机上的USB调试功能
2. 打开Chrome浏览器，地址栏输入：`Chrome://inspect`，回车
3. `Chrome`会自动检测手机上打开的`App`，并列出可调试的`WebView`页面
4. 点击`Inspect`。出现空白页面的话(国内开发者经常会出现`404 Not Found`错误)

![](https://poetries1.gitee.io/img-repo/2020/03/45.png)

![](https://poetries1.gitee.io/img-repo/2020/03/46.png)

> 问题就出现在这里，对于国内的程序猿来说，由于无法访问 `https://chrome-devtools-frontend.appspot.com`，只能出现空白页面：

Chrome为什么要去访问那个网址呢？而不是提供本地的解决方案？可能是是版本问题，对于海量版本，都打包到Chrome安装程序里，势必会大大增加安装包的体积。例如上面的 @640一串字符，就是其中的一个版本号，当你换一个手机或模拟器，版本号可能就不一样了。因为不同型号的手机生产商可能会打包不同版本的chrome浏览器内

**解决方法有两种：**

1. 最直接的方法：翻墙。翻墙最大的问题免费的不稳定
2. 使用离线开发者调试工具包

> 由于是离线包，当你点击Inspect时就不用再去Google下载了，而是直接从本地加载。从而达到了不FQ使用Inspect调试的目的

#### 3.4.1.2  Chrome Inspect不显示Webview页面的问题总结

> 首先，确保手机打开了USB调试。如果还是检测不到WebView页面，主要有以下几种情况

- 反应慢，稍等一会
- 关闭然后重新打开USB调试开关，刺激一下chrome，我的魅族手机有时需要这样操作一下。
- 华为手机，打开USB调试和仅充电模式下允许ADB调试。如下图所示

![](https://poetries1.gitee.io/img-repo/2020/03/42.png)

> 如果还不行，请安装华为手机助手，插上手机后会提示安装的。不安装的话，可能会出现不稳定的情况。

如果手机型号识别了，但是没有识别WebView。可能是要调试的APP没有打开WebView的调试模式。会出现有的App能Inspect，有的不能

#### 3.4.1.3 Cordova/Ionic开发的Android APP启用Chrome Inspect调试的方法

> `Cordova/Ionic`开发的`Android APP`，需要启用WebView的调试模式，才可以在Chrome浏览器中输入`chrome://Inspect`，然后使用大家熟悉的开发者工具进行调试。不启用的话，就看不到App中的WebView页面，也没有Inspect链接

- 确保Android版本4.4以上
- 打开scr下的主活动文件，如MainActivity.java，导入名称空间

```js
import android.os.Build;
import android.util.Log;
import android.content.pm.ApplicationInfo;
import android.webkit.WebView;
```

![](https://poetries1.gitee.io/img-repo/2020/03/44.png)

> 找到`onCreate()` 方法，添加如下代码

```js
if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT){
    if(0 != (getApplicationInfo().flags = ApplicationInfo.FLAG_DEBUGGABLE)){
        Log.i("Your app", "Enabling web debugging");
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
```

#### 3.4.1.4 演示

> 下面我们以微信app为例子，调试app内的webview

按步骤依次操作

1. 开启手机上的USB调试功能
2. 打开Chrome浏览器，地址栏输入：`Chrome://inspect`，回车
3. `Chrome`会自动检测手机上打开的`App`，并列出可调试的`WebView`页面
4. 在手机上给自己微信发送该地址打开 `http://debugx5.qq.com` 打开调试

> 如果不打开TBS开关，Inspect时会检测不到任何微信的H5页面

![](https://poetries1.gitee.io/img-repo/2020/03/49.png)
![](https://poetries1.gitee.io/img-repo/2020/03/50.png)
![](https://poetries1.gitee.io/img-repo/2020/03/47.png)
![](https://poetries1.gitee.io/img-repo/2020/03/48.png)



### 3.4.2 IOS中webview调试

> `IOS`中`webview`以及`IOS`中`safari`如何在`Mac`中采用`safari`调试

**环境**

- `iphone`
- `mac`电脑

1. 在iphone中设置safari，开启web检查

![](https://poetries1.gitee.io/img-repo/2020/03/31.png)

2. `USB`线连上`Mac`，然后打开Mac中的safari，点开开发者工具，就可以看到你的移动设备，然后可以调试其中的网页和webview

![](https://poetries1.gitee.io/img-repo/2020/03/32.png)

> 就这样简单两步，就可对`ios`设备进行真机调试

# 四、nodejs调试

为了方便讲解，我们新建了一个项目

https://github.com/tomoat/koa2-generator

```
koa2 -e koa2-demo
```

## 4.1 打日记形式

> 回顾下，我们平时的调试方式

- 在某个需要输入的地方输入 `console.log()` `console.dir()`，打印调试结果
- 引入 `asserts` 模块，对调试区域进行 `debug`

> 这两种调试方式，都需要我们显式将各种 `debug` 信息嵌入到我们的业务逻辑代码中。这种方式平时使用也是可以的，但是在复杂项目中，不是太方便

## 4.2 调试方式

### 4.2.1 chrome devtools调试

**--inspect 方式调试**

- 使用Inspector调试Node.js的优势
  - 可查看当前上下文的变量
  - 可以观察当前函数调用堆栈
  - 不会侵入代码
  - 可以在暂停状态下执行一些指定代码

> 新版本的`Chrome`浏览器和新版本的`Node.js`支持通过一个新的调试协议能互相直接通讯了，就不再需要`node-inspector`了

- `nodejs 6.3+`
- `Chrome 55+`

> 以上面的例子为例，运行`node --inspect bin/www` Node进程通过`WebSockets`监听调试客户端信息

- `--inspect`参数是启动调试模式必需的。打开浏览器访问`http://127.0.0.1:3000`

**inspector原理**

> `--inspect`激活调试后

- 启动`websocket`服务，监听命令
- `HTTP`服务,元信息

```
$ node --inspect bin/www

# facbf3d7-96a3-4a55-b628-67bfe9790d6a是userId 每个程序都不一样

Debugger listening on ws://127.0.0.1:9229/facbf3d7-96a3-4a55-b628-67bfe9790d6a
For help see https://nodejs.org/en/docs/inspector
listen 3000 port: http://localhost:3000
```

> 打开http://127.0.0.1:9229/json可以看到http服务的一些元信息

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


> inspect命令参数详情 https://nodejs.org/zh-cn/docs/guides/debugging-getting-started

**调试面板打开方式**

1. 访问`chrome://inspect`

![](https://poetries1.gitee.io/img-repo/2020/03/debug.png)

2. chrome开发者工具，点击node图标也可以进入开发者模式

![](https://poetries1.gitee.io/img-repo/2020/03/debug2.png)

3. 访问`127.0.0.1:9229/json`元信息中的 `devtoolsFrontendUrl`地址即可

调试工具有四个面板，其实就是开发者工具的定制版，省去了很多没用到的功能  

![](https://poetries1.gitee.io/img-repo/2020/03/debug3.png)

- `Console`：控制台
- `Memory`：内存
- `Profiler`：性能
- `Sources`：源码

这里主要介绍sources中设置断点的形式

![](https://poetries1.gitee.io/img-repo/2020/03/debug4.png)

> 可以看到右侧面板的一些变量的状态，我们也可以在`watch`的那栏添加需要监听的变量

**调试没有--inspect激活的node程序**

1. 首先正常启动程序
2. 查找上面脚本的进程号

```bash
$ ps ax | grep bin/www

# 可以看到，node程序进程号是53999
90581 s002  R+     0:00.00 grep --color=auto bin/www
53999 s003  S+     0:02.62 node --inspect bin/www
```

> 接着执行 `node -e 'process._debugProcess(53999)'` ，上面命令会建立进程 53999 与调试工具的连接，然后就可以打开调试工具了

### 4.2.2 VSCode配置启动入口

> 之前的方式在实际开发中不太方便，那有没有更好的方式呢，答案是肯定的。我们可以通过`vscode`、`webstom`在代码中调试

1. 打开项目，点击旁边的调试按钮
2. 配置`vscode` `launch.json`文件
3. 打断点
4. 启动项目
5. 打开 `http://localhost:3000/poetries`

![](https://poetries1.gitee.io/img-repo/2020/03/debug5.png)

> 把项目跑起来，我们就可以调试代码了，非常方便

进入断点，调试界面如下

![](https://poetries1.gitee.io/img-repo/2020/03/debug6.png)

- 在界面的左边，可以查看当前上下文环境，也可以设置变量监听
- 将鼠标防止在断点前的变量或者参数上，也可以查看该变量当前的数值，体验与`Chrome`开发者工具的调试一致
