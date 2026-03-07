---
title: 移动端优化篇
date: 2018-11-20 15:40:15
tags: 
   - 移动端
   - 优化
categories: Front-End
---


![](https://image-static.segmentfault.com/462/322/462322984-553e3da07b565_articlex)

## 一、概述

- `PC`优化手段在`Mobile`侧同样适用
- 在`Mobile`侧我们提出三秒种渲染完成首屏指标
- 基于第二点，首屏加载`3`秒完成或使用`Loading`
- 基于联通3G网络平均`338KB/s(2.71Mb/s`），所以首屏资源不应超过`1014KB`
- `Mobile`侧因手机配置原因，除加载外渲染速度也是优化重点
- 基于第五点，要合理处理代码减少渲染损耗
- 基于第二、第五点，所有影响首屏加载和渲染的代码应在处理逻辑中后置
- 加载完成后用户交互使用时也需注意性能

## 二、加载优化

> 加载过程是最为耗时的过程，可能会占到总耗时的`80%`时间，因此是优化的重点

### 2.1 缓存

> 使用缓存可以减少向服务器的请求数，节省加载时间，所以所有静态资源都要在服务器端设置缓存，并且尽量使用长`Cache`（长`Cache`资源的更新可使用时间戳）

### 2.2 压缩HTML、CSS、JavaScript

> 减少资源大小可以加快网页显示速度，所以要对`HTML`、`CSS`、`JavaScript`等进行代码压缩，并在服务器端设置`GZip`

- a） 压缩（例如，多余的空格、换行符和缩进）
- b） 启用`GZip`

### 2.3 无阻塞

> 写在`HTML`头部的`JavaScript`（无异步），和写在`HTML`标签中的`Style`会阻塞页面的渲染，因此`CSS`放在页面头部并使用`Link`方式引入，避免在`HTML`标签中写`Style`，`JavaScript`放在页面尾部或使用异步方式加载

### 2.4 使用首屏加载

> 首屏的快速显示，可以大大提升用户对页面速度的感知，因此应尽量针对首屏的快速显示做优化。

### 2.5 按需加载

> 将不影响首屏的资源和当前屏幕资源不用的资源放到用户需要时才加载，可以大大提升重要资源的显示速度和降低总体流量。

**PS：按需加载会导致大量重绘，影响渲染性能**

- a） `LazyLoad`
- b） 滚屏加载
- c） 通过`Media Query`加载

### 2.6 预加载

> 大型重资源页面（如游戏）可使用增加`Loading`的方法，资源加载完成后再显示页面。但`Loading`时间过长，会造成用户流失。

对用户行为分析，可以在当前页加载下一页资源，提升速度。

- a）可感知`Loading`
- b）不可感知的`Loading`（如提前加载下一页）

### 2.7 压缩图片

> 图片是最占流量的资源，因此尽量避免使用他，使用时选择最合适的格式（实现需求的前提下，以大小判断），合适的大小，然后使用智图压缩，同时在代码中用`Srcset`来按需显示

**PS：过度压缩图片大小影响图片显示效果**

- a）使用智图（ http://zhitu.tencent.com/ ）
- b）使用其它方式代替图片(1. 使用`CSS3` 2. 使用`SVG` 3. 使用`IconFont`）
- c）使用`Srcset`
- d）选择合适的图片(1. `webP`优于`JPG `2. `PNG8`优于`GIF`）
- e）选择合适的大小（1. 首次加载不大于`1014KB` 2. 不宽于`640`（基于手机屏幕一般宽度））

### 2.8 减少Cookie

> `Cookie`会影响加载速度，所以静态资源域名不使用`Cookie`。

### 2.9 避免重定向

重定向会影响加载速度，所以在服务器正确设置避免重定向。

### 2.10 异步加载第三方资源

第三方资源不可控会影响页面的加载和显示，因此要异步加载第三方资源

### 2.11 减少HTTP请求

> 因为手机浏览器同时响应请求为4个请求（`Android`支持4个，`iOS` 5后可支持6个），所以要尽量减少页面的请求数，首次加载同时请求数不能超过4个

- a）合并`CSS`、`JavaScript`
- b）合并小图片，使用雪碧图


## 三、脚本执行优化

> 脚本处理不当会阻塞页面加载、渲染，因此在使用时需当注意

- `CSS`写在头部，`JavaScript`写在尾部或异步
- 避免图片和`iFrame`等的空`Src`，空`Src`会重新加载当前页面，影响速度和效率。
- 尽量避免重设图片大小
- 重设图片大小是指在页面、`CSS`、J`avaScript`等中多次重置图片大小，多次重设图片大小会引发图片的多次重绘，影响性能
- 图片尽量避免使用`DataURL`，`DataURL`图片没有使用图片的压缩算法文件会变大，并且要解码后再渲染，加载慢耗时长


## 四、CSS优化

> 尽量避免写在HTML标签中写`Style`属性


### 4.1 css3过渡动画开启硬件加速

```css
.translate3d{
   -webkit-transform: translate3d(0, 0, 0);
   -moz-transform: translate3d(0, 0, 0);
   -ms-transform: translate3d(0, 0, 0);
   transform: translate3d(0, 0, 0);
 }

```

### 4.2 避免CSS表达式

CSS表达式的执行需跳出CSS树的渲染，因此请避免CSS表达式。

### 4.3 不滥用Float

Float在渲染时计算量比较大，尽量减少使用

### 4.4 值为0时不需要任何单位

为了浏览器的兼容性和性能，值为`0`时不要带单位

## 五、JavaScript执行优化

### 5.1 减少重绘和回流

- 避免不必要的Dom操作
- 尽量改变`Class`而不是`Style`，使用`classList`代替`className`
- 避免使用`document.write`
- 减少`drawImage`

### 5.2 TOUCH事件优化

> 使用`touchstart`、`touchend`代替`click`，因快影响速度快。但应注意`Touch`响应过快，易引发误操作

## 六、渲染优化

### 6.1 HTML使用Viewport

**Viewport可以加速页面的渲染，请使用以下代码**

```
<meta name=”viewport” content=”width=device-width, initial-scale=1″>
```

### 6.2 动画优化

- 尽量使用`CSS3`动画
- 合理使用`requestAnimationFrame`动画代替`setTimeout`
- 适当使用`Canvas`动画 `5`个元素以内使用`css`动画，`5`个以上使用`Canvas`动画（`iOS8`可使用`webGL`）

### 6.4 高频事件优化

> `Touchmove`、`Scroll` 事件可导致多次渲染

- 使用`requestAnimationFrame`监听帧变化，使得在正确的时间进行渲染
- 增加响应变化的时间间隔，减少重绘次数

### 6.5 GPU加速

> `CSS`中以下属性（`CSS3 transitions`、`CSS3 3D transforms`、`Opacity`、`Canvas`、`WebGL`、`Video`）来触发`GPU`渲染，请合理使用

## 七、参考

- [浅谈移动前端的最佳实践-叶小钗](https://www.cnblogs.com/yexiaochai/p/4219523.html)
