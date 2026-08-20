---
title: 移动设备分辨率对照与移动端适配方案
date: 2018-01-27 21:20:43
description: 从 iPhone 分辨率对照表出发，讲清物理像素、CSS 像素与 DPR 的关系，以及 viewport、rem、vw、媒体查询断点、srcset 与安全区域这几套移动端适配方案怎么选。
tags:
  - 移动端
  - 适配
  - 响应式
  - DPR
categories: Front-End
---

设计师给了一张 750px 宽的稿子，你在 Chrome 里按 iPhone 尺寸调试，量出来的 375 怎么都对不上；换台安卓机再看，边距又歪了。这类问题的根子几乎都在同一处，就是「像素」这个词在移动端至少有三层含义，而我们平时说的时候把它们混着用了。这篇从一张分辨率对照表切进去，先把物理像素、CSS 像素、设备像素比这几个概念钉死，再顺着讲 `viewport`、`rem`、`vw`、媒体查询断点、响应式图片和刘海屏安全区，最后给一套我自己现在在用的组合。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 物理像素、设备独立像素、CSS 像素分别指什么，DPR 是怎么把它们串起来的
- 那张 iPhone 分辨率对照表该怎么读，逻辑分辨率和渲染分辨率为什么会差一档
- `viewport` 这行 meta 到底改了浏览器的什么行为
- `rem` 方案和 `vw` 方案的适用边界，以及它们各自的坑
- 媒体查询断点应该按设备挑还是按内容挑
- `srcset` 和 `image-set` 怎么让不同 DPR 的屏幕拿到合适的图
- 刘海屏和底部横条怎么用 `env(safe-area-inset-*)` 躲开

## 一、先把三种像素分清楚

**物理像素**是屏幕上真实存在的发光点，出厂就定死了，改不了。iPhone 6 的屏幕是 750×1334 个物理像素，这是硬件参数。

**设备独立像素**，也叫逻辑像素或者 DIP，是操作系统对外报出来的一套抽象坐标。iPhone 6 报的是 375×667。为什么要多这一层？因为屏幕越做越密，如果直接按物理像素排版，同样一个 44 高的按钮在老机器上是舒服的一指宽，在高密度屏上就缩成一条缝了。系统给出一套跟视觉尺寸挂钩的坐标，应用只管按这套坐标画，剩下的放大交给系统。

**CSS 像素**是我们在样式表里写的那个 `px`。在默认缩放比例下，1 个 CSS 像素对应 1 个设备独立像素。注意「默认缩放」这四个字，用户双指放大之后这个对应关系就变了，CSS 像素会被拉大，但物理像素一个没多。

把它们串起来的是 **DPR**，也就是设备像素比，`window.devicePixelRatio` 能直接读到。

它的定义就是一个设备独立像素等于几个物理像素。iPhone 6 的 750 除以 375 等于 2，所以 DPR 是 2。你在 CSS 里写 `width: 1px`，屏幕上实际点亮的是 2×2 共 4 个物理像素点。

回到开头那个对不上的问题。设计稿 750 宽，是按物理像素给的；你在浏览器里量到 375，是 CSS 像素。两者差一个 DPR，不是谁量错了。

这里有个坑要注意，DPR 并不总是整数。很多安卓机是 2.75、3.5 这种值，Chrome 里把页面缩放调到 110% 也会让 DPR 变成小数。所以那条经典的「1px 边框在高清屏上显示成 2px」的问题，用 `transform: scale(0.5)` 这种硬编码的方案在非整数 DPR 上并不准。现在更省事的做法是直接用 `border: 0.5px`，Safari 和新版 Chrome 都认，实在要精确就读 `devicePixelRatio` 动态算。

## 二、这张对照表怎么读

下面这张图是 PaintCode 整理的历代 iPhone 分辨率对照，我把它放在这里当查询用，实际排期时比翻文档快得多。

![历代 iPhone 屏幕尺寸、逻辑分辨率与物理分辨率对照表](https://s.poetries.top/gitee/2019/10/348.png)

读这张表的时候盯住三列就够了。屏幕物理尺寸决定手感，逻辑分辨率（Points）决定你 CSS 里写的数值，渲染分辨率（Rendered Pixels）决定切图要出几倍。

有一档比较特殊，就是 iPhone 6 Plus 那一代。它的逻辑分辨率是 414×736，按 DPR 3 渲染出来是 1242×2208，可屏幕的物理分辨率只有 1080×1920。系统的做法是先按 3 倍渲染，再整体降采样压到 1080p 上。这也是为什么那几台机器上细线条会有轻微发虚，不是你的 CSS 写错了。

顺着上面聊，这张表还能解释一件事：为什么设计稿的主流宽度是 750。iPhone 6 的 375 逻辑宽度在很长一段时间里是国内的机型中位数，DPR 2，乘出来正好 750。今天的设计稿宽度已经在往 375 和 390 迁，出图倍数也普遍给到 @3x，但「按某台基准机的 CSS 宽度乘 DPR 出稿」这个逻辑一直没变。

## 三、viewport 这行 meta 在改什么

移动端浏览器有一个历史包袱。早年网页都是为桌面写的，宽度动辄 980px，直接塞进手机屏幕会横向溢出，所以浏览器默认给自己造了一个宽度 980 的虚拟视口，把整页渲染好之后再缩小塞进屏幕。结果就是字全是小的，用户得自己放大。

那行 meta 就是用来关掉这个行为的：

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

`width=device-width` 是让布局视口的宽度等于设备的逻辑宽度，也就是 375 或者 390 这个值，页面不再按 980 排版。`initial-scale=1` 是初始缩放比例，写成 1 表示不做额外缩放。

这两个参数经常一起写，因为它们在不同浏览器上的优先级不完全一致，尤其是横竖屏切换的时候，只写其中一个可能得到不一样的结果，两个都写等于两头堵。

`viewport-fit=cover` 是后面为刘海屏加的，先记住它的存在，第七节会用到。

还有两个参数你会在老代码里见到，`user-scalable=no` 和 `maximum-scale=1`，作用是禁止用户手动缩放。这个我建议别写了。iOS 10 之后 Safari 已经不再理会这条限制，更重要的是它对视力不好的用户很不友好，属于可访问性上的减分项。真正需要防误触缩放的场景，用 `touch-action` 去管具体元素比一刀切禁用缩放合适。

## 四、rem 方案和 vw 方案

有了前面的铺垫，适配方案的思路就清楚了：设计稿是一个固定宽度，实际设备宽度是变的，我们要的是等比例缩放。

`rem` 方案的做法是把 `html` 的 `font-size` 跟屏幕宽度绑起来，所有尺寸都写成 `rem`：

```js
// 以 375 设计稿为基准，把屏幕宽度十等分，1rem = 屏幕宽度 / 10
function setRem() {
  const docEl = document.documentElement
  const width = docEl.clientWidth
  docEl.style.fontSize = width / 10 + 'px'
}
setRem()
window.addEventListener('resize', setRem)
```

这段在解决的是「基准值随屏幕变化」这件事。设计稿上一个 75px 宽的按钮，在 375 基准下换算成 `2rem`，屏幕变宽变窄它都会跟着按比例走。实际项目里没人手算，配一个 `postcss-pxtorem` 让构建把 `px` 自动转成 `rem` 就行。

`rem` 方案有两个坑。一是那句 `font-size` 必须在样式生效前就跑完，否则首屏会闪一下，所以这段脚本通常内联在 `head` 里而不是打进 bundle。二是用户在系统里调大了字号之后，`html` 的 `font-size` 基准会被改动，整个布局跟着走样。

`vw` 方案更直接，`1vw` 就是视口宽度的百分之一，不需要任何 JS：

```css
/* 375 设计稿下，75px 的按钮 = 75 / 375 * 100 = 20vw */
.btn {
  width: 20vw;
  height: 10.6667vw;
}
```

同样交给 `postcss-px-to-viewport` 自动转。没有 JS 依赖、没有首屏闪动，是我现在的默认选择。它的限制是在平板和折叠屏展开态这种超宽屏幕上会把元素放得过大，一般会配一个最大宽度兜住：

```css
:root {
  --page-max: 750px;
}
.container {
  max-width: var(--page-max);
  margin: 0 auto;
}
```

不是说 `rem` 不行，而是它多出来的那段 JS 在今天已经没有必要了。老项目里的 `rem` 方案继续跑着就好，没必要专门去改。

## 五、媒体查询的断点怎么挑

`@media` 这块最容易踩的坑，是照着机型列表去排断点。

我一开始也是这么想的，写了一长串 320、375、414、768 的断点，结果新机型一出全对不上，维护起来极其痛苦。断点的正确挑法是看内容什么时候撑不住，而不是看某台设备有多宽。

具体做法是：把浏览器窗口从窄往宽拖，盯着页面看，什么时候排版开始难看了，就在那个宽度加一个断点。得到的值往往是 600、900、1200 这种整数，跟具体机型没关系。

```css
/* 移动优先，基础样式给最窄的场景，往上逐级加 */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 600px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 900px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
```

写成 `min-width` 而不是 `max-width`，也就是移动优先，好处是基础样式最简单，越往宽走越是叠加，不容易出现样式互相覆盖打架。

再补一句现在的做法。很多原来要靠媒体查询解决的问题，现在用 `clamp()` 和 `minmax()` 一行就够了：

```css
/* 字号在 14px 到 20px 之间跟着视口宽度连续变化，不需要断点 */
.title {
  font-size: clamp(14px, 4vw, 20px);
}

/* 卡片最小 240px，放得下几列就放几列 */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}
```

断点是离散的，`clamp` 是连续的。能用连续方案解决的，就少写一个断点。

## 六、响应式图片，srcset 和 image-set

DPR 2 的屏幕上放一张 375px 宽的图，实际会被拉伸到 750 物理像素，糊。反过来给 DPR 1 的老机器下发一张 3 倍图，白白多花两倍流量。`srcset` 就是让浏览器自己去挑。

按 DPR 挑用 `x` 描述符：

```html
<img src="logo@1x.png"
     srcset="logo@1x.png 1x, logo@2x.png 2x, logo@3x.png 3x"
     alt="站点 logo">
```

按实际渲染宽度挑用 `w` 描述符，配合 `sizes` 告诉浏览器这张图在版面里会占多宽：

```html
<img src="cover-800.jpg"
     srcset="cover-400.jpg 400w, cover-800.jpg 800w, cover-1600.jpg 1600w"
     sizes="(min-width: 900px) 800px, 100vw"
     alt="文章封面">
```

`sizes` 这个属性很多人会漏掉，漏了之后浏览器会按 `100vw` 去估算，在多栏布局里就会挑到过大的那张。它必须写。

CSS 背景图对应的是 `image-set()`：

```css
.hero {
  background-image: image-set(
    url("hero@1x.jpg") 1x,
    url("hero@2x.jpg") 2x
  );
}
```

格式降级用 `<picture>`，把新格式放前面，浏览器不认就往下落：

```html
<picture>
  <source srcset="banner.avif" type="image/avif">
  <source srcset="banner.webp" type="image/webp">
  <img src="banner.jpg" alt="活动 banner">
</picture>
```

顺带说一句，图片这块最容易被忽略的其实不是格式，是有没有写死宽高。不写的话图片加载完会把下面的内容顶下去，Core Web Vitals 里的 CLS 直接变差。给 `img` 加上 `width` 和 `height` 属性，或者 CSS 里给 `aspect-ratio`，是成本最低的一处优化。

## 七、刘海屏和安全区域

iPhone X 之后，屏幕顶部有刘海，底部有一条 Home Indicator。如果你的页面有吸顶导航或者吸底按钮，不处理就会被挡住一部分。

先要打开第三节提到的那个开关：

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

不写 `viewport-fit=cover`，页面会被限制在安全区域内渲染，上下留白，`env()` 拿到的值全是 0。写了之后页面铺满整块屏幕，同时四个方向的安全边距通过 `env()` 暴露出来：

```css
.footer-bar {
  padding-bottom: env(safe-area-inset-bottom);
}

/* 需要一个保底值时用 max()，避免非刘海屏上完全没有内边距 */
.header-bar {
  padding-top: max(12px, env(safe-area-inset-top));
}
```

四个变量分别是 `safe-area-inset-top`、`right`、`bottom`、`left`，横屏时左右两个也会有值。在不支持的浏览器上 `env()` 会回落到你给的第二个参数，写成 `env(safe-area-inset-bottom, 0px)` 更稳。

这块我自己踩过一次：吸底的提交按钮只加了 `bottom: 0`，在 iPhone 上被 Home Indicator 压掉小半截，测试机是台安卓所以一直没复现，排查了半天才想起来是安全区的事。

## 总结

把这几层理一遍，移动端适配其实是一条很短的链路。

先认清 DPR，它解释了设计稿宽度和 CSS 宽度之间那个倍数关系，也解释了为什么切图要出多套。再用 `viewport` 那行 meta 把布局视口锁到设备逻辑宽度上，这是所有后续方案的地基。等比缩放优先用 `vw` 配 `postcss-px-to-viewport`，老项目里的 `rem` 方案保持不动即可。断点按内容挑不按机型挑，能用 `clamp()` 和 `auto-fill` 连续解决的就别加断点。图片一律带 `srcset` 和 `sizes`，同时写死宽高防止布局抖动。最后别忘了 `viewport-fit=cover` 加 `env(safe-area-inset-*)`，这一步不做，刘海屏上吸底元素一定会出问题。

移动端的性能部分我在 [移动端优化篇](https://feinterview.poetries.top/blog/mobile-opitize) 里单独写过，适配解决的是「显示对不对」，那篇解决的是「显示得快不快」，两件事要一起做。想看更完整的优化清单可以接着读 [前端性能优化总结](https://feinterview.poetries.top/blog/fe-youhua)。

## 参考

- [PaintCode · The Ultimate Guide To iPhone Resolutions](https://www.paintcodeapp.com/news/ultimate-guide-to-iphone-resolutions)
- [MDN · Viewport meta 标签](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Viewport_meta_tag)
- [MDN · 响应式图片](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Responsive_images)
- [MDN · env()](https://developer.mozilla.org/zh-CN/docs/Web/CSS/env)
- [前端进阶之旅](https://interview.poetries.top)
