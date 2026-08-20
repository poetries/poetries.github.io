---
title: 浏览器渲染原理 从DOM树到合成层的五个阶段
date: 2018-12-22 10:20:43
description: 拆开浏览器渲染的五个阶段，DOM 与 CSSOM 怎么合成渲染树，script 为什么阻塞解析，重绘与回流分别在哪一步触发，以及合成层、will-change、content-visibility 的正确用法。
tags:
  - JavaScript
  - 浏览器渲染
  - 重绘回流
  - 性能优化
categories: Front-End
---

页面白屏了两秒才出内容，你把接口时间、打包体积、图片大小挨个查了一遍，发现都没问题。最后打开 Performance 面板一看，主线程在 `Recalculate Style` 和 `Layout` 上卡了很久。这种问题光看网络瀑布图是查不出来的，得知道资源下完之后浏览器还要干哪几件事。这篇把渲染这条流水线从解析 HTML 一直走到 GPU 合成，讲清每一步在做什么、哪一步会被阻塞、以及重绘和回流到底卡在哪个环节。看完你再打开 Performance 面板，那些色块就能对上号了。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 浏览器渲染的五个阶段分别在做什么，哪两步最耗时
- 解析器碰到 `script` 标签时发生的四件事，`defer` 和 `async` 的差别
- CSS 明明不改结构，为什么还是会阻塞渲染
- `Load` 和 `DOMContentLoaded` 的触发时机差在哪
- 图层是怎么生成的，合成层的收益和代价各是什么
- 重绘和回流的触发条件，以及它们和 Event Loop 的关系
- 减少回流的几种具体写法，以及 `will-change`、`content-visibility` 该怎么用

## 一、浏览器如何渲染网页

浏览器渲染一共有五步：

1. 处理 `HTML` 并构建 `DOM` 树。
2. 处理 `CSS` 构建 `CSSOM` 树。
3. 将 `DOM` 与 `CSSOM` 合并成一个渲染树。
4. 根据渲染树来布局，计算每个节点的位置。
5. 调用 `GPU` 绘制，合成图层，显示在屏幕上

第四步和第五步是最耗时的部分，这两步合起来，就是我们通常所说的渲染。

下面这个交互演示可以配合着看，它把请求发出之后浏览器内部的流转过程按帧拆开了，比干读文字直观：

<div data-doc-demo="cross-origin-flow" data-demo-kind="rendering"></div>

具体过程如下图所示：

![浏览器渲染流水线示意图，从 HTML 解析到最终绘制](https://s.poetries.top/gitee/2019/10/19.png)

![DOM 树与 CSSOM 树合并生成渲染树的过程](https://s.poetries.top/gitee/2019/10/20.png)

这条流水线有个容易被忽略的前提，它不是只跑一次。

网页生成的时候至少会渲染一次，在用户访问的过程中还会不断重新渲染。重新渲染需要重复之前的第四步（重新生成布局）加第五步（重新绘制），或者只有第五步（重新绘制）。所以我们后面讲的性能优化，绝大部分功夫都花在「怎么让第二次以后的渲染少走几步」上。

有两条阻塞规则要先记住。

在构建 `CSSOM` 树时会阻塞渲染，直至 `CSSOM` 树构建完成。并且构建 `CSSOM` 树是一个十分消耗性能的过程，所以应该尽量保证层级扁平，减少过度层叠，越是具体的 `CSS` 选择器，执行速度越慢。

当 `HTML` 解析到 `script` 标签时，会暂停构建 `DOM`，完成后才会从暂停的地方重新开始。也就是说，如果你想首屏渲染得越快，就越不应该在首屏就加载 `JS` 文件。并且 `CSS` 也会影响 `JS` 的执行，只有当解析完样式表才会执行 `JS`，所以也可以认为这种情况下，`CSS` 也会暂停构建 `DOM`。

最后那句话很多人第一次看会觉得别扭，CSS 怎么会挡住 JS。原因在于 JS 里随时可能出现 `getComputedStyle` 这种读样式的调用，浏览器没法预知，只能保守处理：样式表没解析完，就不让脚本跑。这条规则带来的实际后果是，一个放在 `<head>` 里的慢 CSS，会连带把后面的同步脚本一起拖住。

## 二、浏览器渲染五个阶段

### 2.1 第一步：解析HTML标签，构建DOM树

在这个阶段，引擎开始解析 `html`，解析出来的结果会成为一棵 `dom` 树。`dom` 的目的至少有 2 个：

- 作为下个阶段渲染树状图的输入
- 成为网页和脚本的交互界面（最常用的就是 `getElementById` 等等）

当解析器到达 `script` 标签的时候，发生下面四件事情：

1. `html` 解析器停止解析
2. 如果是外部脚本，就从外部网络获取脚本代码
3. 将控制权交给 `js` 引擎，执行 `js` 代码
4. 恢复 `html` 解析器的控制权

由此可以得到第一个结论：

- 由于 `<script>` 标签是阻塞解析的，将脚本放在网页尾部会加速代码渲染。
- `defer` 和 `async` 属性也能有助于加载外部脚本。
- `defer` 使得脚本会在 `dom` 完整构建之后执行；
- `async` 标签使得脚本只有在完全 `available` 才执行，并且是以非阻塞的方式进行的

这两个属性的区别我一开始也记混过，后来换了个角度就清楚了：它们的下载都是并行的，差别只在执行时机。`defer` 的脚本按文档里的书写顺序排队，等 DOM 解析完再依次执行，所以它适合有依赖关系的业务脚本；`async` 是谁先下完谁先执行，顺序完全不保证，它适合埋点、统计这类跟页面其它代码没关系的独立脚本。把有依赖的模块写成 `async`，线上会出现那种「十次里坏一次」的诡异报错，排查起来很费劲。

现代项目里还多了一个 `type="module"`，它默认就是 `defer` 的行为，不用再手动加属性。这块的写法比 2018 年那会儿舒服了不少。

### 2.2 第二步：解析CSS标签，构建CSSOM树

我们已经看到 `html` 解析器碰到脚本后会做的事情，接下来看 `html` 解析器碰到样式表会发生的情况。

`js` 会阻塞解析，因为它会修改文档（`document`）。`css` 不会修改文档的结构，如果这样的话，似乎看起来 `css` 样式不会阻塞浏览器 `html` 解析。但是事实上 `css` 样式表是阻塞的，阻塞是指当 `cssom` 树建立好之后才会进行下一步的解析渲染。

那为什么一个不改结构的东西也会挡住渲染呢？

因为渲染树需要 DOM 和 CSSOM 两份输入，缺一个就拼不出来。浏览器要是在 CSSOM 没建好之前就先画一版，用户会先看到一坨没有样式的裸 HTML，样式到位之后再整个跳一下。这个现象有个名字叫 FOUC，比多等几十毫秒难受得多，所以浏览器选择了等。

通过以下手段可以减轻 `cssom` 带来的影响：

- 将 `script` 脚本放在页面底部
- 尽可能快地加载 `css` 样式表
- 将样式表按照 `media type` 和 `media query` 区分，这样有助于我们将 `css` 资源标记成非阻塞渲染的资源。
- 非阻塞的资源还是会被浏览器下载，只是优先级较低

第三条现在还很好用，写成 `<link rel="stylesheet" href="print.css" media="print">` 这样，打印样式就不会挡住首屏了。另外还有一个 2018 年时还没普及的做法，把首屏必需的那几十行样式内联进 `<head>`，其余的用 `rel="preload"` 异步加载完再切成 `stylesheet`，能把阻塞时间压到接近零。这条思路我在 [关键路径渲染优化](https://feinterview.poetries.top/blog/render-path-optimize) 那篇里展开写过。

### 2.3 第三步：把DOM和CSSOM组合成渲染树（render tree）

![DOM 树与 CSSOM 树组合成渲染树的结构对照](https://s.poetries.top/gitee/2019/10/21.png)

这一步有个细节值得单独提。渲染树里只放要显示的节点，`display: none` 的元素连同它的子树压根不会进渲染树，而 `visibility: hidden` 的元素会进，只是画的时候是透明的。这个差别就是后面「用 `visibility` 替代 `display: none`」那条优化建议的根据，不是玄学。

### 2.4 第四步：在渲染树的基础上进行布局，计算每个节点的几何结构

布局（`layout`）负责定位坐标和大小，是否换行，以及各种 `position`、`overflow`、`z-index` 属性的处理。

这一步的成本跟渲染树的节点数直接相关，是全文里最容易变成性能瓶颈的地方。一个长列表渲染两千个 DOM，每次布局都要把这两千个节点的几何信息重算一遍。

### 2.5 调用 GPU 绘制，合成图层，显示在屏幕上

将渲染树的各个节点绘制到屏幕上，这一步被称为绘制（`painting`）。

绘制之后还有一步合成，浏览器把不同图层的位图交给 GPU 拼在一起输出到屏幕。这一步是我们后面讲合成层优化的落脚点，因为纯粹的合成不需要主线程参与，代价极低。

## 三、渲染优化相关

### 3.1 Load 和 DOMContentLoaded 区别

- `Load` 事件触发代表页面中的 `DOM`、`CSS`、`JS`、图片已经全部加载完毕。
- `DOMContentLoaded` 事件触发代表初始的 `HTML` 被完全加载和解析，不需要等待 `CSS`、`JS`、图片加载

实际用的时候记一条就够：需要操作 DOM 的初始化逻辑挂 `DOMContentLoaded`，需要拿到图片真实尺寸的逻辑才挂 `Load`。有些页面里一张挂了的第三方图片就能把 `Load` 拖到几十秒，初始化逻辑要是绑在上面，页面就一直是死的。这个我踩过，排查了一下午最后发现是个统计像素的域名解析超时。

补一句上面第二条的边界。`DOMContentLoaded` 说的是不等图片，但它其实是要等阻塞渲染的样式表的，因为前面讲过样式表会挡住后面的同步脚本执行。写成「不等待 CSS」不够准确，实际行为是不等异步样式和图片，但会等 `<head>` 里的阻塞样式表。

### 3.2 图层

一般来说，可以把普通文档流看成一个图层。特定的属性可以生成一个新的图层。不同的图层渲染互不影响，所以对于某些频繁需要渲染的建议单独生成一个新图层，提高性能。但也不能生成过多的图层，会引起反作用。

通过以下几个常用属性可以生成新图层：

- `3D` 变换：`translate3d`、`translateZ`
- `will-change`
- `video`、`iframe` 标签
- 通过动画实现的 `opacity` 动画转换
- `position: fixed`

「不能生成过多」这句话原文一笔带过，这里得说清代价在哪。每一个合成层都要单独存一份位图，显存是实打实占掉的，一个全屏的合成层在高分屏上就是好几 MB。层多了之后，合成阶段本身也会变慢，甚至出现「层爆炸」，某个元素被提升之后，它后面所有跟它有重叠关系的元素会被连锁提升。DevTools 的 Layers 面板能直接看到当前有多少层、每层多大，怀疑有问题的时候打开它比猜准得多。

`will-change` 这个属性尤其容易用错。我见过直接写 `* { will-change: transform }` 的，那等于告诉浏览器「所有元素都要变」，浏览器只好挨个提升，内存直接爆掉。正确的用法是精准且短命：只写在真正会动的那个元素上，只写会变的那个属性，而且最好在动画开始前用 JS 加上、动画结束后移除。如果一个元素常年挂着 `will-change`，浏览器为它准备的那份优化资源就一直闲置着。

`position: fixed` 那条也要补个前提。它不是无条件提升合成层的，现在的 Chrome 只在页面确实可滚动的时候才会给固定定位元素单独开层，不滚动的页面上并不会。这类实现细节各浏览器各版本有出入，我只在 Chrome 的 Layers 面板上翻过，别的内核没逐个验证。

### 3.3 重绘（Repaint）和回流（Reflow）

重绘和回流是渲染步骤中的一小节，但是这两个步骤对于性能影响很大。

- 重绘是当节点需要更改外观而不会影响布局的，比如改变 `color` 就称为重绘
- 回流是布局或者几何属性需要改变就称为回流

回流必定会发生重绘，重绘不一定会引发回流。回流所需的成本比重绘高得多，改变深层次的节点很可能导致父节点的一系列回流。

对着前面那条流水线看就清楚了。回流是从第四步重来，布局、绘制、合成一个都跑不掉；重绘是从第五步重来，跳过了布局。还有第三档更省的，只改 `transform` 和 `opacity` 这类合成属性，布局和绘制都跳过，直接进合成，这也是为什么动画一律推荐用 `transform` 而不是 `top`。

以下几个动作可能会导致性能问题：

- 改变 `window` 大小
- 改变字体
- 添加或删除样式
- 文字改变
- 定位或者浮动
- 盒模型

很多人可能没注意到，重绘和回流其实和 Event Loop 有关：

- 当 `Event loop` 执行完 `Microtasks` 后，会判断 `document` 是否需要更新。因为浏览器是 `60Hz` 的刷新率，每 `16ms` 才会更新一次。
- 然后判断是否有 `resize` 或者 `scroll`，有的话会去触发事件，所以 `resize` 和 `scroll` 事件也是至少 `16ms` 才会触发一次，并且自带节流功能。
- 判断是否触发了 `media query`
- 更新动画并且发送事件
- 判断是否有全屏操作事件
- 执行 `requestAnimationFrame` 回调
- 执行 `IntersectionObserver` 回调，该方法用于判断元素是否可见，可以用于懒加载上，但是兼容性不好
- 更新界面
- 以上就是一帧中可能会做的事情。如果在一帧中有空闲时间，就会去执行 `requestIdleCallback` 回调

这里要更新一条。原文说 `IntersectionObserver` 兼容性不好，那是 2018 年的情况，现在它在各主流浏览器上都是可用状态，做图片懒加载和曝光埋点基本可以直接上，不必再自己监听 `scroll` 加 `getBoundingClientRect` 那一套。另外 `60Hz` 那个数字现在也不绝对了，高刷屏上一帧可能只有 8ms 甚至更短，代码里不要写死 16.7 这个常数。

常见的引起重绘的属性：

- `color`
- `border-style`
- `visibility`
- `background`
- `text-decoration`
- `background-image`
- `background-position`
- `background-repeat`
- `outline-color`
- `outline`
- `outline-style`
- `border-radius`
- `outline-width`
- `box-shadow`
- `background-size`

### 3.4 常见引起回流属性和方法

任何会改变元素几何信息（元素的位置和尺寸大小）的操作，都会触发重排，下面列一些例子：

- 添加或者删除可见的 `DOM` 元素
- 元素尺寸改变，包括边距、填充、边框、宽度和高度
- 内容变化，比如用户在 `input` 框中输入文字
- 浏览器窗口尺寸改变，也就是 `resize` 事件发生时
- 计算 `offsetWidth` 和 `offsetHeight` 属性
- 设置 `style` 属性的值

最后两条要连起来看才有意思。写操作会把布局标记成脏，读操作又要求立刻拿到准确值，浏览器只好当场把布局算完。一写一读交替出现，就是那个经典的强制同步布局问题，Performance 面板里会标一条紫色的警告。除了 `offsetWidth`，`getComputedStyle`、`getBoundingClientRect`、`scrollTop`、`clientHeight` 都会触发同样的行为。

回流影响的范围。由于浏览器渲染界面是基于流式布局模型的，所以触发重排时会对周围 DOM 重新排列，影响的范围有两种：

- 全局范围：从根节点 `html` 开始对整个渲染树进行重新布局
- 局部范围：对渲染树的某部分或某一个渲染对象进行重新布局

**全局范围回流**

```html
<body>
  <div class="hello">
    <h4>hello</h4>
    <p><strong>Name:</strong>BDing</p>
    <h5>male</h5>
    <ol>
      <li>coding</li>
      <li>loving</li>
    </ol>
  </div>
</body>
```

当 `p` 节点上发生 `reflow` 时，`hello` 和 `body` 也会重新渲染，甚至 `h5` 和 `ol` 都会受到影响。

**局部范围回流**

用局部布局来解释这种现象：把一个 `dom` 的宽高之类的几何信息定死，然后在 `dom` 内部触发重排，就只会重新渲染该 `dom` 内部的元素，而不会影响到外界。

这个思路后来被标准化成了 `contain` 属性。给容器写上 `contain: layout`，就是在明确告诉浏览器「我内部的布局变化不会外溢」，浏览器可以放心地把重排锁在这个盒子里。再往后还有个 `content-visibility: auto`，屏幕外的内容直接跳过布局和绘制，长列表和长文档页面上收益很明显，代价是要配 `contain-intrinsic-size` 把占位高度给出来，不然滚动条会一跳一跳。这两个属性我只在自己的文档站上试过，业务里没大规模铺开，你要用的话建议自己压一遍。

### 3.5 减少重绘和回流

第一条是使用 `translate` 替代 `top`：

```html
<div class="test"></div>
<style>
    .test {
        position: absolute;
        top: 10px;
        width: 100px;
        height: 100px;
        background: red;
    }
</style>
<script>
    setTimeout(() => {
        // 引起回流
        document.querySelector('.test').style.top = '100px'
    }, 1000)
</script>
```

上面这段改 `top` 会走完整的布局、绘制、合成；换成 `transform: translateY(90px)` 就只剩合成一步，主线程几乎不参与。这是所有动画优化里性价比最高的一条。

其余几条：

- 使用 `visibility` 替换 `display: none`，因为前者只会引起重绘，后者会引发回流（改变了布局）
- 把 `DOM` 离线后修改，比如先把 `DOM` 给 `display: none`（有一次 `Reflow`），然后你修改 100 次，然后再把它显示出来
- 不要把 `DOM` 结点的属性值放在一个循环里当成循环里的变量

```js
for(let i = 0; i < 1000; i++) {
    // 获取 offsetTop 会导致回流，因为需要去获取正确的值
    console.log(document.querySelector('.test').style.offsetTop)
}
```

这段代码原文有个小笔误要纠正一下，`style.offsetTop` 拿不到东西，`offsetTop` 挂在元素上而不是 `style` 上，应该写成 `document.querySelector('.test').offsetTop`。写成 `style.offsetTop` 会一直是 `undefined`，反而不触发回流，跟这条要演示的问题正好相反。真实的写法是把读操作提到循环外面，读一次缓存起来，或者用 `requestAnimationFrame` 把读写分批。

剩下几条也都还成立：

- 不要使用 `table` 布局，可能很小的一个小改动会造成整个 `table` 的重新布局
- 动画实现的速度的选择，动画速度越快，回流次数越多，也可以选择使用 `requestAnimationFrame`
- `CSS` 选择符从右往左匹配查找，避免 `DOM` 深度过深
- 将频繁运行的动画变为图层，图层能够阻止该节点回流影响别的元素。比如对于 `video` 标签，浏览器会自动将该节点变为图层

![DevTools 中观察重绘区域的高亮显示](https://s.poetries.top/gitee/2019/10/22.png)

![Performance 面板中布局与绘制阶段的耗时分布](https://s.poetries.top/gitee/2019/10/23.png)

这两张图对应的面板现在还在，位置略有调整。Rendering 抽屉里的 `Paint flashing` 勾上之后，页面上每次重绘的区域会闪绿框，滚动一下就能看出来是不是整屏在重画。Performance 面板录一段，紫色是布局和样式计算，绿色是绘制和合成，哪一块宽就查哪一块。

## 总结

把这条流水线倒过来看，优化的层次感就出来了。

改 `transform` 和 `opacity`，只走合成，主线程不参与，最便宜；改颜色、背景、阴影，从绘制开始重来，中等；改宽高、位置、内容，从布局开始重来，最贵，而且代价会随渲染树规模放大。所以性能优化不是背一张属性表，是想清楚你这次改动把浏览器踢回了流水线的第几步。

具体到日常写代码，我自己常用的就这么几条：动画只用 `transform` 和 `opacity`；读写分离，别在循环里一边改样式一边读 `offsetWidth`；`will-change` 只在动画期间挂，用完摘掉；长列表配 `content-visibility` 或者虚拟滚动；样式表能标 `media` 的就标上，别让打印样式挡首屏。

至于哪一条对你的页面最有效，别猜，Performance 面板录一段，哪一段色块最宽就先动哪里。

想把渲染这块和缓存、资源加载顺序连起来看，可以接着读 [浏览器缓存原理总结](https://feinterview.poetries.top/blog/browser-cache) 和 [前端性能优化总结](https://feinterview.poetries.top/blog/fed-performance-optimization)。

## 参考

- [MDN 渲染页面 浏览器的工作原理](https://developer.mozilla.org/zh-CN/docs/Web/Performance/How_browsers_work)
- [web.dev 渲染性能](https://web.dev/articles/rendering-performance)
- [MDN CSS contain 属性](https://developer.mozilla.org/zh-CN/docs/Web/CSS/contain)
- [MDN will-change](https://developer.mozilla.org/zh-CN/docs/Web/CSS/will-change)
- [前端进阶之旅](https://interview.poetries.top)
