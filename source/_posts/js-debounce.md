---
title: JavaScript防抖节流原理与手写实现
description: 从滚动卡顿和按钮重复提交两个真实场景出发，讲清防抖节流的区别、immediate 立即执行选项的取舍，逐段拆解 underscore 的 throttle 源码，并给出现代项目里的选型建议。
date: 2018-12-21 21:20:43
tags:
  - JavaScript
  - 防抖节流
  - 性能优化
categories: Front-End
---

一个长列表页，滚动的时候要根据当前位置算高亮的目录项。功能写完了，滚起来页面明显一顿一顿的。打开 Performance 面板录一段，`scroll` 回调在一秒内被调了两百多次，每次都要遍历一遍 DOM 算位置。

另一头，提交按钮被用户连点三下，后端收到三条一模一样的订单。

这两个问题的解法方向相反，一个是「等你停下来我再算」，一个是「第一下我就干活，后面的都不理」。它们对应的就是防抖和节流。这篇把两者的差别、`immediate` 选项的取舍讲清楚，再逐段读一遍 underscore 的节流实现。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 防抖和节流各自解决什么问题，区别到底在哪
- 袖珍版防抖的实现，以及它丢了什么
- 为什么需要 `immediate` 立即执行选项
- 带立即执行的完整防抖实现
- 节流的两种思路，时间戳和定时器
- underscore 的 `throttle` 源码逐段拆解
- `leading` 和 `trailing` 两个配置项分别在管什么
- 现在的项目里该怎么选

## 一、防抖debounce

你是否在日常开发中遇到一个问题，在滚动事件中需要做个复杂计算，或者实现一个按钮的防二次点击操作。

这些需求都可以通过函数防抖动来实现。如果在频繁的事件回调中做复杂计算，很有可能导致页面卡顿，不如将多次计算合并为一次计算，只在一个精确点做操作。

防抖和节流的作用都是防止函数多次调用。区别在于，假设一个用户一直触发这个函数，且每次触发函数的间隔小于 `wait`，防抖的情况下只会调用一次，而节流的情况会每隔一定时间（参数 `wait`）调用函数。

持续触发 `scroll` 事件时，并不执行 `handle` 函数，当 1000 毫秒内没有触发 `scroll` 事件时，才会延时触发 `scroll` 事件。

![防抖时序示意图，持续触发期间不执行回调，停止触发后延迟 wait 毫秒执行一次](https://s.poetries.top/gitee/2019/10/312.png)

### 1.1 最简单的版本

```js
// 防抖
function debounce(fn, wait) {    
    var timeout = null;    
    return function() {        
        if(timeout !== null)   clearTimeout(timeout);        
        timeout = setTimeout(fn, wait);    
    }
}
// 处理函数
function handle() {    
    console.log(Math.random()); 
}
// 滚动事件
// 当持续触发scroll事件时，事件处理函数handle只在停止滚动1000毫秒之后才会调用一次，也就是说在持续触发scroll事件的过程中，事件处理函数handle一直没有执行
window.addEventListener('scroll', debounce(handle, 1000));
```

核心逻辑只有两行，每次触发先把上一次的定时器清掉，再重开一个。只要触发间隔小于 `wait`，上一个定时器永远等不到执行就被清了，最后一次触发之后没人再来打断，`wait` 毫秒后才真正跑一次。

这版有个缺陷，`setTimeout(fn, wait)` 直接把函数丢进去，`fn` 里的 `this` 会指向全局对象，事件对象也拿不到。所以稍微正式一点的实现都会用 `apply` 转发上下文和参数。

我们先来看一个袖珍版的防抖理解一下防抖的实现。

```js
// func是用户传入需要防抖的函数
// wait是等待时间
const debounce = (func, wait = 50) => {
  // 缓存一个定时器id
  let timer = 0
  // 这里返回的函数是每次用户实际调用的防抖函数
  // 如果已经设定过定时器了就清空上一次的定时器
  // 开始一个新的定时器，延迟执行用户传入的方法
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}
// 可以看出，如果用户调用该函数的间隔小于wait的情况下，上一次的时间还未到就被清除了，并不会执行函数
```

注意这里返回的是 `function` 而不是箭头函数。返回箭头函数的话 `this` 会被绑死在定义时的作用域上，事件回调里就拿不到触发元素了。内层用箭头函数包住 `func.apply(this, args)` 反而是对的，因为它要借外层 `function` 的 `this`。

### 1.2 为什么需要立即执行选项

这是一个简单版的防抖，但是有缺陷，这个防抖只能在最后调用。一般的防抖会有 `immediate` 选项，表示是否立即调用。这两者的区别，举个栗子来说：

- 例如在搜索引擎搜索问题的时候，我们当然是希望用户输入完最后一个字才调用查询接口，这个时候适用延迟执行的防抖函数，它总是在一连串（间隔小于 `wait` 的）函数触发之后调用
- 例如用户给 `interviewMap` 点 `star` 的时候，我们希望用户点第一下的时候就去调用接口，并且成功之后改变 `star` 按钮的样子，用户就可以立马得到反馈是否 `star` 成功了。这个情况适用立即执行的防抖函数，它总是在第一次调用，并且下一次调用必须与前一次调用的时间间隔大于 `wait` 才会触发

这两种模式的分界线其实是「用户在不在等反馈」。搜索联想是用户还在输入，晚一点没关系；点赞按钮是用户等着看状态变化，延迟 300 毫秒他就会怀疑是不是没点上。

回到我们要解决的问题，开头那个重复提交的按钮，要的就是立即执行这一档。

### 1.3 完整实现

下面我们来实现一个带有立即执行选项的防抖函数。

```js
// 这个是用来获取当前时间戳的
function now() {
  return +new Date()
}
/**
 * 防抖函数，返回函数连续调用时，空闲时间必须大于或等于 wait，func 才会执行
 *
 * @param  {function} func        回调函数
 * @param  {number}   wait        表示时间窗口的间隔
 * @param  {boolean}  immediate   设置为ture时，是否立即调用函数
 * @return {function}             返回客户调用函数
 */
function debounce (func, wait = 50, immediate = true) {
  let timer, context, args

  // 延迟执行函数
  const later = () => setTimeout(() => {
    // 延迟函数执行完毕，清空缓存的定时器序号
    timer = null
    // 延迟执行的情况下，函数会在延迟函数中执行
    // 使用到之前缓存的参数和上下文
    if (!immediate) {
      func.apply(context, args)
      context = args = null
    }
  }, wait)

  // 这里返回的函数是每次实际调用的函数
  return function(...params) {
    // 如果没有创建延迟执行函数（later），就创建一个
    if (!timer) {
      timer = later()
      // 如果是立即执行，调用函数
      // 否则缓存参数和调用上下文
      if (immediate) {
        func.apply(this, params)
      } else {
        context = this
        args = params
      }
    // 如果已有延迟执行函数（later），调用的时候清除原来的并重新设定一个
    // 这样做延迟函数会重新计时
    } else {
      clearTimeout(timer)
      timer = later()
    }
  }
}
```

对于按钮防点击来说的实现：如果函数是立即执行的，就立即调用；如果函数是延迟执行的，就缓存上下文和参数，放到延迟函数中去执行。一旦我开始一个定时器，只要我定时器还在，你每次点击我都重新计时。一旦你点累了，定时器时间到，定时器重置为 `null`，就可以再次点击了。

对于延时执行函数来说的实现：清除定时器 ID，如果是延迟调用就调用函数。

这段代码里最巧妙的是用 `timer` 是不是 `null` 来当「冷却中」的标志位。`immediate` 模式下真正的函数在 `if (!timer)` 分支里同步跑掉了，后面的定时器纯粹是个计时器，它到期只做一件事，把 `timer` 置回 `null` 解除冷却。

这里有个坑要注意，`context` 和 `args` 在执行完之后被置成了 `null`。这不是强迫症，而是为了断开闭包对上一次调用参数的引用。事件对象可能挂着整个 DOM 子树，不主动断开的话，只要这个防抖函数还挂在监听器上，那份数据就一直回收不掉。这类由闭包引起的内存问题，可以看 [JS内存泄漏与垃圾回收机制完全梳理](https://feinterview.poetries.top/blog/js-memory-leak)。

## 二、节流throttle

防抖动和节流要解决的问题是不一样的。防抖动是将多次执行变为最后一次执行，节流是将多次执行变成每隔一段时间执行。

如下图，持续触发 `scroll` 事件时，并不立即执行 `handle` 函数，每隔 1000 毫秒才会执行一次 `handle` 函数。

![节流时序示意图，持续触发期间每隔 wait 毫秒稳定执行一次回调](https://s.poetries.top/gitee/2019/10/313.png)

差别在图上看得很清楚。防抖那张图里，只要你不停手，中间一次都不执行；节流这张图里，你不停手它也按固定频率在执行。

那什么时候用哪个？我的判断很简单，看这个操作「中间过程有没有意义」。搜索联想的中间输入没意义，用防抖；滚动进度条、拖拽跟随、播放器进度上报，中间过程本身就是要展示的，必须用节流。

### 2.1 两种实现思路

节流有两种基础写法。时间戳版本记录上次执行的时刻，每次触发算一下过去多久了，够 `wait` 就执行。它的特点是第一次触发立刻执行，但最后一次触发如果不够 `wait` 就会被丢掉。

定时器版本是触发时如果没有定时器就设一个，`wait` 后执行并清空。它的特点相反，第一次要等 `wait` 才执行，但最后一次一定会被执行到。

underscore 的做法是把两者结合起来，用 `leading` 和 `trailing` 两个开关让调用方自己选。

### 2.2 underscore 源码拆解

```js
/**
 * underscore 节流函数，返回函数连续调用时，func 执行频率限定为 次 / wait
 *
 * @param  {function}   func      回调函数
 * @param  {number}     wait      表示时间窗口的间隔
 * @param  {object}     options   如果想忽略开始函数的的调用，传入{leading: false}。
 *                                如果想忽略结尾函数的调用，传入{trailing: false}
 *                                两者不能共存，否则函数不能执行
 * @return {function}             返回客户调用函数   
 */
_.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    // 之前的时间戳
    var previous = 0;
    // 如果 options 没传则设为空对象
    if (!options) options = {};
    // 定时器回调函数
    var later = function() {
      // 如果设置了 leading，就将 previous 设为 0
      // 用于下面函数的第一个 if 判断
      previous = options.leading === false ? 0 : _.now();
      // 置空一是为了防止内存泄漏，二是为了下面的定时器判断
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      // 获得当前时间戳
      var now = _.now();
      // 首次进入前者肯定为 true
	  // 如果需要第一次不执行函数
	  // 就将上次时间戳设为当前的
      // 这样在接下来计算 remaining 的值时会大于0
      if (!previous && options.leading === false) previous = now;
      // 计算剩余时间
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      // 如果当前调用已经大于上次调用时间 + wait
      // 或者用户手动调了时间
 	  // 如果设置了 trailing，只会进入这个条件
	  // 如果没有设置 leading，那么第一次会进入这个条件
	  // 还有一点，你可能会觉得开启了定时器那么应该不会进入这个 if 条件了
	  // 其实还是会进入的，因为定时器的延时
	  // 并不是准确的时间，很可能你设置了2秒
	  // 但是他需要2.2秒才触发，这时候就会进入这个条件
      if (remaining <= 0 || remaining > wait) {
        // 如果存在定时器就清理掉否则会调用二次回调
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        // 判断是否设置了定时器和 trailing
	    // 没有的话就开启一个定时器
        // 并且不能不能同时设置 leading 和 trailing
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
};
```

这段代码信息量不小，挑三处关键的说。

第一处是 `previous` 的初始值 0。第一次调用时 `now - previous` 是一个巨大的数，`remaining` 必然小于 0，所以会直接走进执行分支，这就是默认的 `leading: true` 行为。传了 `leading: false` 的话，`if (!previous && options.leading === false) previous = now` 会把 `previous` 补成当前时刻，`remaining` 变成 `wait`，第一次就进不去执行分支了。

第二处是 `remaining > wait` 这个看起来多余的条件。它防的是用户手动改了系统时间，把时钟往回拨之后 `now - previous` 会变成负数，`remaining` 就超过 `wait` 了。不加这一条，节流函数会被卡死到时钟追回来为止。

第三处是注释里提到的，为什么开了定时器还可能进入第一个 `if`。因为 `setTimeout` 的延时并不精确，主线程忙的时候它可能晚触发几百毫秒。这时候新的调用进来算出的 `remaining` 已经是负数了，就会走执行分支，同时把那个还没触发的定时器清掉，避免同一个窗口内执行两次。

`leading: false` 和 `trailing: false` 不能同时设置，原因也在这里。两个都关掉，第一个 `if` 因为 `previous` 被补齐进不去，第二个 `else if` 因为 `trailing === false` 也进不去，函数就再也不会被执行了。

## 三、现在的项目里怎么用

前面这些实现该看还是要看，面试和排查问题都用得上。但真到写业务代码的时候，我自己基本不再手写了。

`lodash` 的 `_.debounce` 和 `_.throttle` 已经把 `leading`、`trailing`、`maxWait`、取消（`cancel`）和立即刷新（`flush`）都做全了，其中 `cancel` 是手写版最容易漏的一环。组件卸载的时候不调 `cancel`，挂着的定时器还会在组件销毁后触发回调，轻则报错重则泄漏。

在 React 里还有个额外的坑。直接写 `onChange={debounce(fn, 300)}` 是没用的，每次渲染都会生成一个全新的防抖函数，内部的 `timer` 从来不会被复用。得用 `useMemo` 或者 `useRef` 把它稳住，并在 `useEffect` 的清理函数里调 `cancel`。

另外有些场景其实不该用节流。

跟随滚动做动画的，用 `requestAnimationFrame` 比 `throttle(fn, 16)` 更合适，它天然和浏览器的刷新节奏对齐，不会出现掉帧或者一帧内跑两次。判断元素是否进入视口的，直接用 `IntersectionObserver`，根本不用监听 `scroll`。监听输入框的搜索请求，除了防抖还要记得取消上一个还在飞的请求，否则先发的慢响应会覆盖后发的快响应。

滚动监听如果非要保留，记得加 `{ passive: true }`，告诉浏览器这个回调不会调 `preventDefault`，滚动就不用等 JS 执行完再动。更多这类优化手段可以看 [前端性能优化梳理](https://feinterview.poetries.top/blog/fed-performance-optimization)。

## 总结

防抖和节流不是两种性能优化技巧，而是两种不同的语义。防抖表达的是「等用户停下来」，节流表达的是「按固定频率取样」。选错了不是性能问题，是功能问题，用防抖做滚动进度条，进度条会一直不动直到你停手。

手写实现里最容易漏的三点：用 `apply` 转发 `this` 和参数、执行完把缓存的上下文置 `null`、提供 `cancel` 让调用方能主动清理。前两点决定正确性，第三点决定它在组件里用起来会不会泄漏。

underscore 那套 `leading`/`trailing` 的设计值得单独理解一遍。两个开关组合出四种行为，默认是首尾都执行，关掉首就是纯延迟触发，关掉尾就是纯立即触发，两个都关函数直接失效。

最后，业务代码直接用 lodash，别自己维护一份。真正要手写的场合只有两个，面试，和你在读别人代码时想搞明白它为什么这么写。

## 参考

- [MDN setTimeout](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/setTimeout)
- [lodash debounce](https://lodash.com/docs/#debounce)
- [lodash throttle](https://lodash.com/docs/#throttle)
- [underscore 源码](https://github.com/jashkenas/underscore/blob/master/modules/throttle.js)
- [MDN requestAnimationFrame](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestAnimationFrame)
- [前端进阶之旅](https://interview.poetries.top)
