---
title: Vue多页路由与模板解析 单页间跳转与模板定制
description: 多页应用里每个单页的路由怎么加前缀、跨单页跳转为什么只能用 location、devServer 的 historyApiFallback 怎么重写，以及 html-webpack-plugin 模板语法和自定义配置的用法。
date: 2019-06-02 00:15:32
tags:
  - Vue
  - Vue Router
  - webpack
  - 工程化
categories: Front-End
---

多页应用的构建配好之后，第一个真正卡住人的问题往往是：从 `page1` 点一个链接跳到 `page2`，`this.$router.push('/page2')` 敲下去，地址栏变了，页面没换，控制台还一声不吭。接着是本地跑得好好的，刷新 `/vue/page1` 直接 404。这两个坑都出在同一个地方，多页应用的每个 html 是独立的运行时，路由的边界跟单页完全不是一回事。这篇把多页的路由前缀、跨单页跳转、服务端重写，还有 html 模板怎么按环境定制，一条线讲清楚。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 多页应用里为什么 `vue-router` 跳不到别的单页，只能用 `location`
- 用 `base` 给每个单页的路由加前缀，避免路径互相打架
- 把跨单页跳转封装成 `$openRouter`，保持和 `vue-router` 一致的调用手感
- `devServer.historyApiFallback.rewrites` 怎么把 `/vue/page1` 重写到 `page1.html`
- `html-webpack-plugin` 的默认模板语法，`htmlWebpackPlugin.files` 里到底有什么
- 用自定义配置在生产环境往指定模板里注入统计脚本

## 一、路由配置

### 跨单页跳转只能靠 location

在配置路由前，首先我们要明确一点就是，多页应用中的每个单页都是相互隔离的。即如果你想从 `page1` 下的路由跳到 `page2` 下的路由，你无法使用 `vue-router` 中的方法进行跳转，需要使用原生方法 `location.href` 或 `location.replace`。

为什么？因为 `vue-router` 从头到尾都活在一个 html 的内存里。它的路由表是这个页面加载时注册的，`push` 做的事情是调 `history.pushState` 改地址栏，然后在自己的路由表里找匹配项去换 `<router-view>` 的内容。`page2` 的路由表在另一个 html 里，当前这个页面根本不知道它的存在，匹配不上就只能落到 404 或者什么都不做。

所以跨单页跳转必须让浏览器真的去请求另一个文档。

`location.href` 和 `location.replace` 的区别在历史记录上。前者会往历史栈里压一条，用户按返回键能回来；后者是替换当前记录，回不去。登录跳转、支付完成这类不希望用户退回去的场景用 `replace`，普通导航用 `href`。

此外为了能够清晰地分辨路由属于哪个单页，我们应该给每个单页路由添加前缀，比如：

- `index` 单页：`/vue/`
- `page1` 单页：`/vue/page1/`
- `page2` 单页：`/vue/page2/`

其中 `/vue/` 为项目的二级目录，其后的目录代表路由属于哪个单页。因此我们每个单页的路由配置可以像这样：

```js
/* page1 单页路由配置 */

import Vue from 'vue'
import Router from 'vue-router'

// 首页
const Home = (resolve => {
    require.ensure(['../views/home.vue'], () => {
        resolve(require('../views/home.vue'))
    })
})

Vue.use(Router)

let base = `${process.env.BASE_URL}` + 'page1'; // 添加单页前缀

export default new Router({
    mode: 'history',
    base: base,
    routes: [
        {
            path: '/',
            name: 'home',
            component: Home
        },
    ]
})
```

我们通过设置路由的 `base` 值来为每个单页添加路由前缀，如果是 `index` 单页我们无需拼接路由前缀，直接跳转至二级目录即可。

这里的巧妙之处在于，每个单页内部的路由表都可以从 `/` 开始写，互相之间不用协调命名。`page1` 有一个 `/detail`，`page2` 也有一个 `/detail`，两者实际的 URL 是 `/vue/page1/detail` 和 `/vue/page2/detail`，各走各的。前缀这件事交给 `base` 统一处理，业务代码里一个字都不用改。

`process.env.BASE_URL` 是 Vue CLI 3 根据 `vue.config.js` 里的 `publicPath` 自动注入的，这一层的来龙去脉我在 [Vue单页应用的基本配置](https://feinterview.poetries.top/blog/vue-single-page-config) 里说过。

那么在单页间跳转的地方，我们可以这样写：

```html
<template>
  <div id="app">
    <div id="nav">
      <a @click="goFn('')">Index</a> |
      <a @click="goFn('page1')">Page1</a> |
      <a @click="goFn('page2')">Page2</a> |
    </div>
    <router-view/>
  </div>
</template>

<script>
export default {
    methods: {
        goFn(name) {
            location.href = `${process.env.BASE_URL}` + name
        }
    }
}
</script>
```

能用，但难受。项目里一半跳转写 `this.$router.push({ name, query })`，另一半写 `location.href = 拼字符串`，参数传递的写法也完全不同，新人过来根本分不清什么时候该用哪个。

为了保持和 Vue 路由跳转同样的风格，我可以对单页之间的跳转做一下封装，实现一个 `Navigator` 类。封装完成后我们可以将跳转方法修改为：

```js
this.$openRouter({
    name: name, // 跳转地址
    query: {
        text: 'hello' // 可以进行参数传递
    },
})
```

调用手感和 `this.$router.push` 对齐了，`Navigator` 内部做的事情就是把 `name` 拼成完整路径、把 `query` 对象序列化成 query string，最后走 `location.href`。这样业务代码里两种跳转看起来是一套东西，未来哪天页面合并回单页，改起来也只动 `Navigator` 一个文件。

使用上述 `$openRouter` 方法我们还需要一个前提条件，便是将其绑定到 Vue 的原型链上。我们在所有单页的入口文件中添加：

```js
import { Navigator } from '../../common' // 引入 Navigator

Vue.prototype.$openRouter = Navigator.openRouter; // 添加至 Vue 原型链
```

「在所有单页的入口文件中添加」这句话本身就是个信号。三个入口文件里抄三遍同样的代码，改一次要改三处。这个问题有专门的解法，把入口的公共配置抽成一个函数，我在 [Vue之项目整合与优化](https://feinterview.poetries.top/blog/vue-opz) 里写了具体怎么做。

至此我们已经能够成功模仿 `vue-router` 进行单页间的跳转，但是需要注意的是因为其本质使用的是 `location` 跳转，所以必然会产生浏览器的刷新与重载。这个成本躲不掉，页面状态全丢，公共依赖重新解析一遍。所以多页的切分粒度要想清楚，把用户会频繁来回切的两个页面拆成两个单页，体验是倒退的。

### 重定向

当我们完成上述路由跳转的功能后，可以在本地服务器上来进行一下测试。你会发现 `Index` 首页可以正常打开，但是跳转 `Page1`、`Page2` 却仍然处于 `Index` 父组件下。

这是因为浏览器认为你所要跳转的页面还是在 `Index` 根路由下，同时又没有匹配到 `Index` 单页中对应的路由。

说得再具体一点，你请求的是 `/vue/page1` 这个路径，服务器上并没有一个叫 `page1` 的文件或目录，开发服务器的 history 兜底规则把它交还给了 `index.html`。于是加载的还是 `Index` 单页，它的路由表里没有 `/page1`，就停在那儿了。

这时候我们服务器需要做一次重定向，将下方路由指向对应的 `html` 文件即可：

```
/vue/page1 -> /vue/page1.html
/vue/page2 -> /vue/page2.html
```

在 `vue.config.js` 中，我们需要对 `devServer` 进行配置，添加 `historyApiFallback` 配置项。该配置项主要用于解决 HTML5 History API 产生的问题，比如其 `rewrites` 选项用于重写路由：

```js
/* vue.config.js */

let baseUrl = '/vue/';

module.exports = {
    ...
    
    devServer: {
        historyApiFallback: {
            rewrites: [
                { from: new RegExp(baseUrl + 'page1'), to: baseUrl + 'page1.html' },
                { from: new RegExp(baseUrl + 'page2'), to: baseUrl + 'page2.html' },
            ]
        }
    }
    
    ...
}
```

上方我们通过 `rewrites` 匹配正则表达式的方式将 `/vue/page1` 这样的路由替换为访问服务器下正确 `html` 文件的形式，如此不同单页间便可以进行正确跳转和访问了。

两个提醒。

一是 `rewrites` 是按数组顺序匹配的，命中第一条就停。规则写得越宽泛越要往后放，否则会把后面的都吃掉。这里的正则没加 `^` 和边界，`/vue/page10` 也会被 `page1` 这条命中，页面数量多起来之后建议把正则写严一点。

二是这只是开发服务器的配置。生产环境上 `devServer` 整个不存在，同样的重写规则得在 nginx 或者你用的静态服务器上再配一遍。这件事我第一次做多页的时候忘了，本地全绿，一上测试环境所有子页面 404，排查了半天才想起来 `devServer` 三个字的含义。

## 二、模板配置

### 模板渲染

这里所说的模板渲染是在我们的 `html` 模板文件中使用 `html-webpack-plugin` 提供的 default template 语法进行模板编写。比如：

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>模板</title>
    <% for (var chunk in htmlWebpackPlugin.files.css) { %>
        <% if(htmlWebpackPlugin.files.css[chunk]) {%>
            <link href="<%= htmlWebpackPlugin.files.css[chunk] %>" rel="stylesheet" />
        <%}%>
    <% } %>
  </head>
  <body>
    <div id="app"></div>
    <!-- built files will be auto injected -->

    <% for (var chunk in htmlWebpackPlugin.files.js) { %>
        <% if(htmlWebpackPlugin.files.js[chunk]) {%>
            <script type="text/javascript" src="<%= htmlWebpackPlugin.files.js[chunk] %>"></script>
        <%}%>
    <% } %>
  </body>
</html>
```

这套 `<% %>` 语法是 lodash 的模板语法，`html-webpack-plugin` 默认用它来编译模板。`<% %>` 里写逻辑，`<%= %>` 输出内容。它是在构建时执行的，产出的是静态 html，跟运行时没有任何关系，别跟 Vue 的模板语法混在一起理解。

以上我们使用模板语法手动获取并遍历 `htmlWebpackPlugin` 打包后的文件并生成到模板中。其中的 `htmlWebpackPlugin` 变量是模板提供的可访问变量，其有以下特定数据：

```js
"htmlWebpackPlugin": {
    "files": {
        "css": [ "main.css" ],
        "js": [ "assets/head_bundle.js", "assets/main_bundle.js"],
        "chunks": {
            "head": {
                "entry": "assets/head_bundle.js",
                "css": [ "main.css" ]
            },
            "main": {
                "entry": "assets/main_bundle.js",
                "css": []
            },
        }
    }
}
```

我们通过 `htmlWebpackPlugin.files` 可以获取打包输出的 js 及 css 文件路径，包括入口文件路径等。注意这些路径都是带 hash 的最终产物路径，这也是为什么不能在模板里手写死一个固定的资源路径，hash 每次构建都会变。

需要注意的是如果你在模板中编写了插入对应 js 及 css 的语法，你需要设置 `inject` 的值为 `false` 来关闭资源的自动注入：

```js
/* utils.js */
...

let conf = {
    entry: filePath, // page 的入口
    template: filePath, // 模板路径
    filename: filename + '.html', // 生成 html 的文件名
    chunks: ['manifest', 'vendor',  filename],
    inject: false, // 关闭资源自动注入
}

...
```

否则页面上同一个 js 会被引入两次，一次是你在模板里手动写的，一次是插件自动注入的。表现出来就是入口代码执行了两遍，Vue 实例挂载两次，或者埋点上报翻倍。这类问题从现象上很难联想到构建配置，遇到的时候先打开生成的 html 看一眼 script 标签有几个，比什么都快。

反过来说，如果你不需要在模板里做任何定制，就让 `inject: true` 自动注入，别自己遍历，省事且不容易错。`html-webpack-plugin` 的多模板配置怎么批量生成，我在 [Vue CLI3之pages 构建多页应用](https://feinterview.poetries.top/blog/vue-muti-page-config) 里写过完整的 `setPages` 方法。

### 自定义配置

在模板渲染中，我们只能够使用 `htmlWebpackPlugin` 内部的一些属性和方法来进行模板的定制化开发。那么如果遇到需要根据不同环境来引入不同资源，同时不同模板间的配置还可能不一样的需求情况的话，我们使用自定义配置会比较方便。

原理是 `HtmlWebpackPlugin` 构造函数里传的所有字段都会挂到模板可访问的 `htmlWebpackPlugin.options` 上，包括你自己加的那些非标准字段。也就是说，你可以从 `vue.config.js` 往模板里传任意东西，甚至传函数。

比如我们需要在生产环境模板中引入第三方统计脚本：

```js
/* vue.config.js */

module.exports = {
    ...
    
    pages: utils.setPages({
        addScript() {
            if (process.env.NODE_ENV === 'production') {
                return `
                    <script src="https://s95.cnzz.com/z_stat.php?id=xxx&web_id=xxx" language="JavaScript"></script>
                `
            }

            return ''
        }
    }),
    
    ...
}
```

`setPages` 的参数会被 merge 进每个页面的配置，所以这个 `addScript` 方法在所有模板里都能拿到。

然后在页面模板中通过 `htmlWebpackPlugin.options` 获取自定义配置对象并进行输出：

```html
<% if(htmlWebpackPlugin.options.addScript){ %>
    <%= htmlWebpackPlugin.options.addScript() %>
<%}%>
```

外面那层 `if` 判断不能省。模板是共用的，万一某个页面的配置里没传 `addScript`，直接调用就是 `undefined is not a function`，整个构建会挂在模板编译这一步，报错信息还很不友好。

这里用 `<%= %>` 而不是 `<%- %>`，因为我们要输出的是一段真实的 HTML 标签，需要原样插入，不能被转义成实体字符。

同时你也可以针对个别模板进行配置。比如我想只在 Index 单页中添加统计脚本，在 Page1 单页中添加其他脚本，那么你可以给 `addScript` 传入标识符来进行判断输出，比如：

```html
<% if(htmlWebpackPlugin.options.addScript){ %>
    <%= htmlWebpackPlugin.options.addScript('index') %>
<%}%>
```

同时为 `addScript` 方法添加参数 `from`：

```js
addScript(from) {
    if (process.env.NODE_ENV === 'production') {
        let url = "https://xxx";
    
        if (from === 'index') {
            url = "https://s95.cnzz.com/z_stat.php?id=xxx&web_id=xxx";
        }
        
        return `
            <script src=${url} language="JavaScript"></script>
        `
    }

    return ''
}
```

标识符写在模板里而不是配置里，这个选择挺关键：配置是一份，模板是每个页面各一份，把差异点放在模板侧，就不用在 `vue.config.js` 里为每个页面单独写一套配置。

顺带说一句，返回的字符串里 `src=${url}` 没加引号。HTML 规范允许无引号属性值，但只限于值里不含空格、引号、`<`、`>`、反引号和等号。统计脚本的 URL 通常带 `?id=xxx&web_id=xxx`，等号在里面，无引号写法在这种情况下是有风险的，建议改成 `src="${url}"`。

### 这套写法在今天

`html-webpack-plugin` 的 lodash 模板语法在 4.x 之后做过调整，`htmlWebpackPlugin.files.chunks` 这个字段在新版本里的形态和上面这份数据结构不完全一样。抄这段之前建议先把插件版本对一下，或者在模板里先 `<%= JSON.stringify(htmlWebpackPlugin.files) %>` 打出来看看。

如果是新项目走 Vite，模板这一层的玩法完全变了。Vite 的 html 本身就是入口，不需要插件去注入资源；要做环境相关的注入，官方提供了 `transformIndexHtml` 钩子，或者直接在 html 里用 `%VITE_XXX%` 这种环境变量占位符。思路还是那个思路，构建时往 html 里塞点东西，只是接口换了。

## 总结

把这一圈过下来，几个能直接带走的结论：

- 多页应用里 `vue-router` 只在单页内部有效，跨单页跳转必须走 `location.href` 或 `location.replace`，代价是整页重载
- 用 `base` 给每个单页加路由前缀，各单页内部的路由表就能互不干扰地从 `/` 开始写
- 把跨单页跳转封装成 `$openRouter`，让调用方式和 `this.$router.push` 保持一致，未来改造成本低得多
- `historyApiFallback.rewrites` 按顺序匹配，正则要写严；而且它只管开发服务器，nginx 上得再配一遍
- `htmlWebpackPlugin.files` 拿到的是带 hash 的最终路径，模板里手写资源路径行不通
- 模板里自己插了资源就必须把 `inject` 关掉，否则同一份 js 会被引入两次
- `HtmlWebpackPlugin` 的配置对象会整体挂到 `htmlWebpackPlugin.options`，可以传函数进去做环境判断

多页配置这类东西的特点是，配对了之后基本再也不用碰，配错了又很难从现象倒推回原因。所以每一处配置为什么这么写，最好当时就记下来。

## 参考

- [Vue Router 3 - HTML5 History 模式](https://v3.router.vuejs.org/zh/guide/essentials/history-mode.html)
- [html-webpack-plugin - GitHub](https://github.com/jantimon/html-webpack-plugin)
- [webpack-dev-server - historyApiFallback](https://webpack.js.org/configuration/dev-server/#devserverhistoryapifallback)
- [MDN - Location.replace](https://developer.mozilla.org/zh-CN/docs/Web/API/Location/replace)
- [Vite - HTML 转换钩子](https://cn.vitejs.dev/guide/api-plugin.html)
- [前端进阶之旅](https://interview.poetries.top)
