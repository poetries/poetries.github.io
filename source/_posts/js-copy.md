---
title: JavaScript复制粘贴与剪贴板操作详解
description: 梳理 copy/cut/paste 三个剪贴板事件、clipboardData 的读写方式，实现复制自动追加版权信息、防复制、点击复制按钮，并对比 execCommand 与现代异步 Clipboard API 的差异。
date: 2018-12-23 09:10:43
tags:
  - JavaScript
  - 复制粘贴
  - 剪贴板
categories: Front-End
---

> 来源网络

产品提了个需求，文档页要加一个「复制代码」按钮，顺手还想学掘金那样，用户复制超过一定长度的正文时自动在末尾追加版权信息。这两件事看起来都很小，真动手才发现剪贴板这块的 API 有点乱，`clipboardData` 在不同浏览器上挂的位置不一样，`execCommand` 又被标记成废弃了。

这篇把浏览器里操作剪贴板的几条路径捋一遍，从最基础的三个事件讲到能落地的几个场景，再说清楚老方案和新方案各自的适用范围。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `copy`、`cut`、`paste` 三个事件的触发时机和绑定方式
- `clipboardData` 对象的兼容处理和三个方法
- 复制正文时自动追加版权信息的完整实现
- 防复制的几种做法，以及它们为什么拦不住人
- 用隐藏 input 加 `execCommand` 实现点击复制
- 现代异步 Clipboard API 的用法和它的两道限制
- 什么时候该直接上 clipboard.js

## 一、剪贴板的三个事件

### 1.1 事件与触发条件

浏览器暴露了三个剪贴板相关的事件：

- `copy` 发生复制操作时触发
- `cut` 发生剪切操作时触发
- `paste` 发生粘贴操作时触发

每个事件都有一个 `before` 事件对应，`beforecopy`、`beforecut`、`beforepaste`。这几个 `before` 一般不怎么用，把注意力放在另外三个事件就可以了。

能触发它们的操作有两类，一类是鼠标右键菜单里的复制、粘贴、剪切，另一类是键盘组合键，比如 `command+c`、`command+v`。注意用 JS 主动调用 `document.execCommand('copy')` 同样会触发 `copy` 事件，这一点在后面实现点击复制的时候会用到。

### 1.2 怎么绑

以 `copy` 为例，两种写法都可以。

```js
document.body.oncopy = e => {
  // 监听全局复制 做点什么
};
// 还有这种写法：
document.addEventListener('copy', e => {
  // 监听全局复制 做点什么
});
```

上面是在 `document.body` 上全局监听的。很多人不知道的是，我们还可以为某些 DOM 单独添加剪贴板事件。

```html
// html结构
<div id="test1"></div>
<div id="test2"></div>

<script>
    // 写法一样：
    let test1 = document.querySelector('#test1');
    test1.oncopy = e => {
        // 监听test1发生的复制事件 做点什么
        // test1发生的复制事件会触发回调，其他地方不会触发回调
    }
</script>
```

其他事件也是一样的。

为什么绑在 `document.body` 上就能拦下页面里任何位置的复制？因为剪贴板事件和 `click` 一样是会冒泡的，从选区所在的元素一路往上传到 `document`。所以你既可以做全局拦截，也可以只在文章容器上绑一个，让评论区、代码块之类的地方不受影响。事件冒泡和事件委托的完整机制，可以看 [JavaScript事件机制](https://feinterview.poetries.top/blog/js-event)。

## 二、clipboardData 对象

`clipboardData` 对象用于访问以及修改剪贴板中的数据。

不同浏览器，它所属的对象不同。在 IE 中这个对象是 `window` 对象的属性，在 Chrome、Safari 和 Firefox 中，它是相应的 `event` 对象的属性。所以使用的时候需要做一下兼容。

```js
document.body.oncopy = e => {
  let clipboardData = e.clipboardData || window.clipboardData;
  // 获取clipboardData对象 + do something
};
```

这个差别不只是挂载位置的问题。把它放在 `event` 上，等于强制你只能在真实的剪贴板事件回调里访问剪贴板，页面脚本没法在任意时刻偷偷读用户的剪贴板，这其实是一种安全措施。IE 那种挂在 `window` 上、随时能读写的设计，正是后来被否掉的原因。

对象有三个方法，`getData()`、`setData()`、`clearData()`。

### 2.1 getData 读数据

`getData()` 接受一个 `text` 参数，即要取得的数据的格式。

实际上在 Chrome 上测试，只有 `paste` 粘贴的时候才能用 `getData()` 访问到数据，用法如下。

```js
// 要粘贴的数据：

document.body.onpaste = e => {
  let clipboardData = e.clipboardData || window.clipboardData; // 兼容处理
  console.log('要粘贴的数据', clipboardData.getData('text'));
};
```

这里补一句规范上的说法。`copy` 和 `cut` 事件里 `clipboardData` 处于「只写」状态，读不到东西是设计如此，不是浏览器 bug。要拿被复制的内容得走另一条路。

被复制和被剪切的数据，需要通过 `window.getSelection(0).toString()` 来访问。

```js
document.body.oncopy = e => {
  console.log('被复制的数据:', window.getSelection(0).toString());
};
```

顺带说个原文里的小问题，`getSelection()` 按规范是不接收参数的，写成 `getSelection(0)` 里的这个 `0` 会被直接忽略，不影响结果，但新写代码的时候直接写 `window.getSelection().toString()` 更规范。

### 2.2 setData 写数据

`setData()` 第一个参数也是 `text`，第二个参数是要放在剪贴板中的文本。

格式参数这块也演进过。规范里现在用的是标准 MIME 类型，比如 `text/plain`、`text/html`，`'text'` 是浏览器为了兼容老代码保留的别名。新写的代码建议直接写 `text/plain`，语义清楚，而且如果你要同时写入富文本，还能追加一份 `text/html`。

### 2.3 clearData

`clearData()` 清空剪贴板中指定格式的数据，实际业务里用得很少。

## 三、复制大段文本时追加版权信息

### 3.1 类知乎/掘金的实现

实现很简单。取消默认复制之后，主要是在被复制的内容后面添加信息，然后根据 `clipboardData` 的 `setData()` 方法将信息写入剪贴板。

```js
// 掘金这里不是全局监听，应该只是监听文章的dom范围内。
document.body.oncopy = event => {
  event.preventDefault(); // 取消默认的复制事件
  let textFont,
    copyFont = window.getSelection(0).toString(); // 被复制的文字 等下插入
  // 防知乎掘金 复制一两个字则不添加版权信息 超过一定长度的文字 就添加版权信息
  if (copyFont.length > 10) {
    textFont =
      copyFont +
      '\n' +
      '作者：OBKoro1\n' +
      '链接：https://juejin.im/user/58714f0e325b123db4a2eb95372/posts\n' +
      '来源：掘金\n' +
      '著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。';
  } else {
    textFont = copyFont; // 没超过十个字 则采用被复制的内容。
  }
  if (event.clipboardData) {
    return event.clipboardData.setData('text', textFont); // 将信息写入粘贴板
  } else {
    // 兼容IE
    return window.clipboardData.setData('text', textFont);
  }
};
```

然后 `command+c`、`command+v`，输出：

```
你复制的内容
作者：OBKoro1
链接：https://juejin.im/user/58714f0eb123db4a2eb95372/posts
来源：掘金
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。
```

### 3.2 这段代码的关键点

`event.preventDefault()` 这一行是整段的枢纽。剪贴板事件的默认行为就是「把当前选区的内容写进剪贴板」，你不取消它，后面 `setData` 写进去的东西会被默认行为覆盖掉。取消之后剪贴板就是一块空白画布，完全由你来填。

长度阈值那个 `if` 也不是随便加的。用户复制一个词去查释义，结果粘出来跟着四行版权声明，体验很差。设个门槛只对成段的正文追加，是这类功能里必备的一步。

还有一处原文没提但实际会踩的，就是监听范围。示例绑在 `document.body` 上，那用户从你页面的输入框里复制自己刚打的字，也会被追加版权信息。真上线的话建议绑在文章容器上，代码块所在的元素再单独 `stopPropagation` 一下。

## 四、防复制功能

### 4.1 几条常见做法

- 禁止复制和剪切
- 禁止右键，右键某些选项：全选、复制、粘贴等
- 禁用文字选择，能选择却不能复制，体验很差
- `user-select` 用 CSS 禁止选择文本

```js
// 禁止右键菜单
document.body.oncontextmenu = e => {
    console.log(e, '右键');
    return false;
    // e.preventDefault();
};
// 禁止文字选择。
document.body.onselectstart = e => {
    console.log(e, '文字选择');
    return false;
    // e.preventDefault();
};
// 禁止复制
document.body.oncopy = e => {
    console.log(e, 'copy');
    return false;
    // e.preventDefault();
}
// 禁止剪切
document.body.oncut = e => {
    console.log(e, 'cut');
    return false;
    // e.preventDefault();
};
// 禁止粘贴
document.body.onpaste = e => {
    console.log(e, 'paste');
    return false;
    // e.preventDefault();
};
```

```css
/** css 禁止文本选择 这样不会触发js**/
body {
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
}
```

使用 `e.preventDefault()` 也可以禁用，但原文建议使用 `return false`，这样就不用去访问 `e` 和 `e` 的方法了。有个前提要说清楚，`return false` 只在 DOM0 级的 `onxxx = fn` 这种写法下才等价于阻止默认行为，如果你用的是 `addEventListener`，`return false` 什么都不会发生，必须老老实实调 `preventDefault()`。

示例中 `document.body` 全局都禁用了，也可以对某些 DOM 区域单独禁用。实际项目里我更倾向后者，整站禁选会把输入框、可编辑区域一起废掉。

### 4.2 破解防复制

上面的防复制方法是通过 JS 加 CSS 实现的，所以思路就是禁用 JS 加取消 `user-select` 样式。

Chrome 浏览器的话，打开浏览器控制台，按 `F1` 进入 `Setting`，勾选 `Disable JavaScript`（禁止 JS）。

![Chrome DevTools 设置面板中勾选 Disable JavaScript 选项](https://upload-images.jianshu.io/upload_images/1480597-2f3188629fa5a86d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

此时如果还不能复制的话，就要去找 `user-select` 样式，取消这个样式就可以了。

所以防复制这件事，拦得住普通用户，拦不住任何一个会开 DevTools 的人。内容真要保护，得靠服务端做水印、鉴权、限流这类手段，前端这层只能算劝退。我一开始也觉得禁右键挺有用，后来发现被投诉最多的反而是它，因为它把「在新标签页打开链接」「检查元素」这些正常操作一并干掉了。

## 五、点击复制功能

### 5.1 为什么不能直接用 clipboardData

在 IE 中可以用 `window.clipboardData.setData('text','内容')` 实现，因为上文提到过，在 IE 中 `clipboardData` 是 `window` 的属性。

而其他浏览器则是相应的 `event` 对象的属性，这实际上是一种安全措施，防止未经授权的访问。为了兼容其他浏览器，所以我们不能通过 `clipboardData` 来实现这种操作。

### 5.2 隐藏 input 加 execCommand

具体做法是：

- 创建一个隐藏的 `input` 框
- 点击的时候，将要复制的内容放进 `input` 框中
- 选择文本内容 `input.select()`，这里只能用 `input` 或者 `textarea` 才能选择文本
- `document.execCommand("copy")`，执行浏览器的复制命令

```js
function copyText() {
  var text = document.getElementById('text').innerText; // 获取要复制的内容也可以传进来
  var input = document.getElementById('input'); // 获取隐藏input的dom
  input.value = text; // 修改文本框的内容
  input.select(); // 选中文本
  document.execCommand('copy'); // 执行浏览器复制命令
  alert('复制成功');
}
```

这套写法有几个坑。第一，隐藏 input 不能用 `display: none` 或者 `visibility: hidden`，那样元素不可聚焦，`select()` 会失效，常见做法是绝对定位挪到屏幕外，或者用 `opacity: 0` 加 `position: fixed`。第二，iOS Safari 上 `input.select()` 对只读输入框行为不一致，通常要配合 `setSelectionRange(0, text.length)` 才稳。第三，`execCommand('copy')` 会返回一个布尔值表示是否成功，直接 `alert('复制成功')` 是不严谨的，应该拿返回值判断。

### 5.3 现在的做法是异步 Clipboard API

`document.execCommand` 在 MDN 上已经被标记为废弃，替代方案是 `navigator.clipboard`。

```js
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.warn('复制失败', err);
    return false;
  }
}
```

它比隐藏 input 那套干净太多，不用造 DOM、不用管选区、结果通过 Promise 明确告诉你。读取也有对应的 `navigator.clipboard.readText()`，还能通过 `ClipboardItem` 写入图片这类非文本内容。

但它有两道硬限制，不知道的话本地跑得好好的、一上测试环境就报错：

- 只在安全上下文里可用。也就是 HTTPS 页面或者 `localhost`，用 IP 加 HTTP 访问的测试环境直接拿不到 `navigator.clipboard`
- 需要用户手势。写入一般要求在用户点击等交互的回调里同步发起，读取在 Chrome 上还要额外的 `clipboard-read` 权限，Firefox 更保守，基本只允许在 `paste` 事件里读

所以稳妥的做法是两套并存，优先走 `navigator.clipboard`，`catch` 到或者对象不存在时降级到 `execCommand`。这也是现在大部分复制类组件的实现思路。

## 六、第三方库 clipboard.js

如果不想自己处理这一堆分支，可以直接用现成的库。

> https://github.com/zenorocha/clipboard.js

它把降级、选区处理、iOS 兼容都封装好了，用 `data-clipboard-text` 属性声明式地绑在按钮上就能工作，体积也很小。除非你的项目对包体积极端敏感，或者只需要一个最简单的 `writeText`，否则引它比自己维护一份兼容代码划算。

## 总结

浏览器操作剪贴板一共就两条路。一条是拦截用户自己发起的复制粘贴，靠 `copy`/`cut`/`paste` 事件加 `clipboardData`，追加版权信息、拦截富文本粘贴这类需求都走这条；另一条是页面主动往剪贴板里写，老方案是隐藏 input 加 `execCommand`，新方案是 `navigator.clipboard`。

`clipboardData` 挂在 `event` 上而不是 `window` 上，是刻意的安全设计，意思是只有在用户真的做了复制粘贴动作时，页面才有权碰剪贴板。理解了这条，后面异步 Clipboard API 为什么要求安全上下文和用户手势，也就顺理成章了。

防复制这件事，前端能做的只有劝退。禁 JS 加取消 `user-select` 两步就能破，投入产出比很低，而且容易伤到正常用户的体验。

新项目直接用 `navigator.clipboard` 加一层 `execCommand` 降级，或者干脆引 clipboard.js，别再从头写一遍隐藏 input 那套了。

## 参考

- [MDN Clipboard API](https://developer.mozilla.org/zh-CN/docs/Web/API/Clipboard_API)
- [MDN ClipboardEvent.clipboardData](https://developer.mozilla.org/zh-CN/docs/Web/API/ClipboardEvent/clipboardData)
- [MDN Document.execCommand](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/execCommand)
- [MDN Window.getSelection](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/getSelection)
- [clipboard.js](https://github.com/zenorocha/clipboard.js)
- [前端进阶之旅](https://interview.poetries.top)
