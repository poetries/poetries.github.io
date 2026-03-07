---
title: Javascript中的复制粘贴功能
date: 2018-12-23 09:10:43
tags: 
  - JavaScript
  - 复制粘贴 
categories: Front-End
---

> 来源网络

## 一、基本使用

### 1.1 API 介绍

**复制、剪切、粘贴事件**

- `copy` 发生复制操作时触发;
- `cut` 发生剪切操作时触发;
- `paste` 发生粘贴操作时触发

> 每个事件都有一个 `before` 事件对应：`beforecopy`、`beforecut`、`beforepaste`。这几个 `before` 一般不怎么用，所以我们把注意力放在另外三个事件就可以了

**触发条件**

- 鼠标右键菜单的`复制`、`粘贴`、`剪切`
- 使用了相应的键盘组合键，比如:`command+c`、`command+v`

**使用姿势**

> 以 `copy` 为例

```js
document.body.oncopy = e => {
  // 监听全局复制 做点什么
};
// 还有这种写法：
document.addEventListener('copy', e => {
  // 监听全局复制 做点什么
});
```

> 上面是在`document.body`上全局监听的，然而很多人不知道的是，我们还可以为某些 `dom` 单独添加剪切板事件

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

> 其他事件也是一样的

### 1.2 clipboardData


**clipboardData 对象:用于访问以及修改剪贴板中的数据**

> 不同浏览器，所属的对象不同：在 `IE` 中这个对象是`window`对象的属性，在`Chrome`、`Safari`和`Firefox`中，这个对象是相应的`event`对象的属性。所以我们在使用的时候，需要做一下如下兼容

```js
document.body.oncopy = e => {
  let clipboardData = e.clipboardData || window.clipboardData;
  // 获取clipboardData对象 + do something
};
```

**对象方法**

> 对象有三个方法: `getData()`、`setData()`、`clearData()`

**getData() 访问剪切板中的数据**

> `getData()`接受一个`text`参数，即要取得的数据的格式

**在复制、剪切、粘贴触发的事件的数据**

> 实际上在 `chorme` 上测试只有`paste`粘贴的时候才能用`getData()`访问到数据，用法如下

```js
// 要粘贴的数据：

document.body.onpaste = e => {
  let clipboardData = e.clipboardData || window.clipboardData; // 兼容处理
  console.log('要粘贴的数据', clipboardData.getData('text'));
};
```

**被复制/剪切的数据**：

> 在复制和剪切中的数据，需要通过`window.getSelection(0).toString()`来访问:

```js
document.body.oncopy = e => {
  console.log('被复制的数据:', window.getSelection(0).toString());
};
```

**setData(): 修改剪切板中的数据**

> 第一个参数也是`text`，第二个参数是要放在剪切板中的文本

**clearData()**

## 二、应用

### 2.1 复制大段文本

**实现类知乎/掘金复制大段文本添加版权信息**

> 实现很简单：取消默认复制之后，主要是在被复制的内容后面添加信息，然后根据 `clipboardData` 的 `setData()`方法将信息写入剪贴板

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

> 然后 `command+c`、`command+v`，输出:

```
你复制的内容
作者：OBKoro1
链接：https://juejin.im/user/58714f0eb123db4a2eb95372/posts
来源：掘金
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。
```

### 2.2 防复制功能

- 禁止复制+剪切
- 禁止右键，右键某些选项:全选，复制，粘贴等。
- 禁用文字选择，能选择却不能复制，体验很差。
- `user-select` 用 `css` 禁止选择文本

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

- 使用`e.preventDefault()`也可以禁用，但建议使用`return false`这样就不用去访问`e`和`e`的方法了。
- 示例中`document.body`全局都禁用了，也可以对 `dom`(某些区域)进行禁用

**破解防复制**

上面的防复制方法通过`js+css`实现的，所以思路就是：禁用`js+取消user-select`样式。

> `Chrome`浏览器的话：打开浏览器控制台，按`F1`进入`Setting`，勾选`Disable` `JavaScript`(禁止 `js`)。

![image.png](https://upload-images.jianshu.io/upload_images/1480597-2f3188629fa5a86d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> 此时如果还不能复制的话，就要去找`user-select`样式,取消这个样式就可以了

### 2.3 点击复制功能

**不能使用 clipboardData**

- 在 `IE` 中可以用`window.clipboardData.setData('text','内容')`实现
- 上文提到过，在 `IE` 中`clipboardData`是`window`的属性
- 而其他浏览器则是相应的`event`对象的属性，这实际上是一种安全措施，防止未经授权的访问,为了兼容其他浏览器，所以我们不能通过`clipboardData`来实现这种操作

**具体做法**

- 创建一个隐藏的`input`框
- 点击的时候，将要复制的内容放进`input`框中
- 选择文本内容`input.select()`。这里只能用`input`或者`textarea`才能选择文本
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

### 2.4 第三方库clipboard

> https://github.com/zenorocha/clipboard.js


