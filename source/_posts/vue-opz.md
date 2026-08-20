---
title: Vue之项目整合与优化 alias 入口收敛与 Gzip 压缩
description: 用 alias 干掉一长串相对路径，把多个入口文件里重复的初始化配置抽成一个函数，再开启 Gzip 压缩减小传输体积，三件在 Vue 项目里性价比很高的整理工作。
date: 2019-06-02 00:20:32
tags:
  - Vue
  - webpack
  - 性能优化
  - 工程化
categories: Front-End
---

项目跑到第三个月，代码里开始出现 `import HelloWorld from '../../../../HelloWorld.vue'` 这种东西；多页应用的三个入口文件长得几乎一模一样，加一行埋点要改三处；打包出来的 `app.js` 五百多 KB，弱网下白屏时间长得能泡杯茶。这三件事都不算大问题，但堆在一起就是每天在消耗你。这篇讲三个投入产出比很高的整理动作，路径别名、入口配置收敛、Gzip 压缩，每个都是改一次以后一直受益。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 用 `alias` 把相对路径换成语义化前缀，以及 CLI 3 里为什么要走 `chainWebpack`
- 样式和 html 模板里引用别名为什么必须加 `~`
- 多入口文件的重复初始化代码怎么抽成一个函数，一处修改多处生效
- `CompressionWebpackPlugin` 的四个关键参数，`threshold` 和 `minRatio` 各自在挡什么
- Gzip 生成的 `.gz` 文件要服务器配合才有意义，nginx 那边该开什么
- 这三件事在 Vite 时代对应的做法

## 一、使用 alias 简化路径

### 问题出在哪

使用 webpack 构建过 Vue 项目的同学应该知道 `alias` 的作用，我们可以使用它将复杂的文件路径定义成一个变量来访问。在不使用 `alias` 的项目中，我们引入文件的时候通常会去计算被引入文件对于引入它的文件的相对路径，比如像这样：

```
import HelloWorld from '../../../../HelloWorld.vue'
```

一旦相对层次结构较深，我们就很难去定位所引入文件的具体位置。其实这并不是我们应该操心的地方，完全可以交给 webpack 来进行处理。

相对路径真正的代价不在写的时候，在移动文件的时候。你把一个组件从 `views/user/` 挪到 `views/account/`，里面所有的 `../../` 全部作废，而且编辑器不一定能全帮你改对，改漏一个就是运行时报错。

在原生的 webpack 配置中我们可以定义 `alias` 来解决这一问题：

```js
const path = require('path')

const resolve = dir => {
    return path.join(__dirname, dir)
}

module.exports = {
    ...
    
    resolve: {
        alias: {
            '@': resolve('src'), // 定义 src 目录变量
            _lib: resolve('src/common'), // 定义 common 目录变量,
            _com: resolve('src/components'), // 定义 components 目录变量,
            _img: resolve('src/images'), // 定义 images 目录变量,
            _ser: resolve('src/services'), // 定义 services 目录变量,
        }
    },
    
    ...
}
```

上方我们在 webpack `resolve`（解析）对象下配置 `alias` 的值，将常用的一些路径赋值给了我们自定义的变量，这样我们便可以将第一个例子简化为：

```js
import HelloWorld from '_com/HelloWorld.vue'
```

不管这个文件在哪一层，写法都一样。文件移动之后引用不用动，这才是别名的主要价值，少敲几个点号只是顺带的。

这里的命名用了 `_lib`、`_com` 这种下划线开头的短前缀，是为了和 npm 包名区分开。webpack 解析模块的时候，先在 `alias` 表里查，没命中才去 `node_modules` 找。前缀太普通的话，比如你定义了一个叫 `utils` 的别名，正好又装了一个叫 `utils` 的包，就会打架。`@` 是 Vue CLI 默认就配好的 `src` 别名，可以直接用。

### CLI 3 里怎么改

而在 CLI 3.x 中我们无法直接操作 webpack 的配置文件，我们需要通过 `chainWebpack` 来进行间接修改，代码如下：

```js
/* vue.config.js */
module.exports = {
    ...
    
    chainWebpack: config => {
        config.resolve.alias
            .set('@', resolve('src'))
            .set('_lib', resolve('src/common'))
            .set('_com', resolve('src/components'))
            .set('_img', resolve('src/images'))
            .set('_ser', resolve('src/services'))
    },
    
    ...
}
```

`chainWebpack` 和 `configureWebpack` 的分工值得说一句：后者是整块合并，适合加插件、改 `entry` 这类整体性的改动；前者基于 `webpack-chain`，能精确定位到某一条已有的 loader 规则去改它的某个参数，适合做外科手术。改 `alias` 用哪个都行，改「已有的 url-loader 的 limit 值」这种就只能用 `chainWebpack`。这两个口子的区别在多页配置里更明显，我在 [Vue CLI3之pages 构建多页应用](https://feinterview.poetries.top/blog/vue-muti-page-config) 里写过 `configureWebpack` 返回对象和原地修改的坑。

### 样式里要加波浪线

这样我们修改 webpack `alias` 来简化路径的优化就实现了。但是需要注意的是对于在样式及 html 模板中引用路径的简写时，前面需要加上 `~` 符，否则路径解析会失败，如：

```css
.img {
    background: url(~_img/home.png);
}
```

原文这里写的是 `background: (~_img/home.png)`，少了 `url()`，这样写 CSS 是不生效的，我补上了。

那为什么在 CSS 里非要加个 `~` 呢？

因为 `css-loader` 处理 `url()` 的时候要先判断这是一个相对路径还是一个模块请求。看到 `./img/a.png` 它当相对路径处理，看到 `~foo/a.png` 它把 `~` 剥掉，剩下的部分交给 webpack 的模块解析流程，这时候 `alias` 才会生效。不加 `~`，`_img/home.png` 会被当成当前文件旁边的一个叫 `_img` 的目录，自然找不到。

html 模板里通过 `<img src="~_img/xxx.png">` 引用是同样的道理，走的是 `vue-loader` 对模板资源路径的转换。

## 二、整合功能模块

在多页应用的构建中，由于存在多个入口文件，因此会出现重复书写相同入口配置的情况，这样对于后期的修改和维护都不是特别友好，需要修改所有入口文件的相同配置。

比如在 `index` 单页的入口中我们引用了 VConsole 及 performance 的配置，同时在 Vue 实例上还添加了 `$openRouter` 方法：

```js
import Vue from 'vue'
import App from './index.vue'
import router from './router'
import store from '@/store/'
import { Navigator } from '../../common'

// 如果是非线上环境，不加载 VConsole
if (process.env.NODE_ENV !== 'production') {
    var VConsole = require('vconsole/dist/vconsole.min.js');
    var vConsole = new VConsole();

    Vue.config.performance = true;
}

Vue.$openRouter = Vue.prototype.$openRouter = Navigator.openRouter;

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
```

这段代码里有两处细节。`require` 写在 `if` 里面而不是文件顶部，是为了让 VConsole 只在非生产环境被打进包里；如果写成顶部的 `import`，静态分析阶段就会把它作为依赖引入，生产包里也会带上这个几十 KB 的调试工具。`Vue.config.performance = true` 打开的是组件级别的性能追踪，开发时能在浏览器 Performance 面板里看到每个组件 init、compile、render、patch 各花了多少时间。这个开关在生产环境要关掉，它本身有开销。

`$openRouter` 是多页应用里跨单页跳转的封装，具体实现和为什么需要它，我在 [Vue多页路由与模板解析](https://feinterview.poetries.top/blog/vue-router-and-template-analyse) 里写过。

而在 `page1` 和 `page2` 的入口文件中也同样进行了上述配置。那我们该如何整合这些重复代码，使其能够实现一次修改多处生效的功能呢？

最简单的方法便是封装成一个共用方法来进行调用。这里我们可以在 `common` 文件夹下新建 `entryConfig` 文件夹用于放置入口文件中公共配置的封装，封装代码如下：

```js
import { Navigator } from '../index'

export default (Vue) => {

    // 如果是非线上环境，不加载 VConsole
    if (process.env.NODE_ENV !== 'production') {
        var VConsole = require('vconsole/dist/vconsole.min.js');
        var vConsole = new VConsole();

        Vue.config.performance = true;
    }

    Vue.$openRouter = Vue.prototype.$openRouter = Navigator.openRouter;
}
```

上述代码我们向外暴露了一个函数，在调用它的入口文件中传入 Vue 实例作为参数即可实现内部功能的共用。

注意这里是把 `Vue` 当参数传进来的，而不是在这个文件里自己 `import Vue`。这个选择挺重要：模块拿到的是入口文件里的那个 Vue 引用，挂在原型链上的东西一定作用在同一个 Vue 上。如果这个文件自己 import 一次，在某些构建配置下（比如 Vue 被配成了 external，或者存在多份 Vue 副本）就可能挂到另一个 Vue 上去，表现为「明明写了 `$openRouter` 却是 undefined」。这类问题查起来非常费劲。

我们可以将原本的入口文件简化为：

```js
import Vue from 'vue'
import App from './index.vue'
import router from './router'
import store from '@/store/'
import entryConfig from '_lib/entryConfig/'

// 调用公共方法加载配置
entryConfig(Vue)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
```

入口文件瘦下来了，而且瘦下来之后它读起来是有结构的：引依赖、装公共配置、创建实例挂载。以后要加全局指令、全局过滤器、错误上报，都往 `entryConfig` 里塞，三个入口文件一个字都不用动。

这个模式在单页项目里同样成立，只是收益没那么直观。单页只有一个 `main.js`，把配置抽出去主要是为了让入口保持干净，顺便让这部分逻辑可测试。

## 三、开启 Gzip 压缩

前面两件事是为了改代码的人，这件事是为了用户。

JS 和 CSS 是纯文本，重复度很高，Gzip 对这类内容的压缩效果非常好。做法是在构建时预先生成一份 `.gz` 文件，服务器直接把压好的文件发出去，省掉每次请求实时压缩的 CPU 开销。

```js
/* vue.config.js */
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const isPro = process.env.NODE_ENV === 'production'

module.exports = {
    ...
    
    configureWebpack: config => {
        if (isPro) {
            return {
                plugins: [
                    new CompressionWebpackPlugin({
                         // 目标文件名称。[path] 被替换为原始文件的路径和 [query] 查询
                        asset: '[path].gz[query]',
                        // 使用 gzip 压缩
                        algorithm: 'gzip', 
                        // 处理与此正则相匹配的所有文件
                        test: new RegExp(
                            '\\.(js|css)$'
                        ),
                        // 只处理大于此大小的文件
                        threshold: 10240,
                        // 最小压缩比达到 0.8 时才会被压缩
                        minRatio: 0.8,
                    })
                ]
            }
        }
    }
    ...
}
```

原文这段有两个问题，我改掉了：`minRatio: 0.8` 后面跟的是一个中文全角逗号，直接跑会是语法错误；另外少了 `CompressionWebpackPlugin` 的 `require` 语句，我补在了开头。

四个参数挨个说。

`test` 决定压哪些文件。这里只匹配 `.js` 和 `.css`，因为图片、字体这类二进制文件本身已经是压缩格式，再 Gzip 一遍基本没收益，还白白多一份产物。

`threshold: 10240` 是 10KB，小于这个体积的文件不处理。原因是 Gzip 有固定的头部开销，小文件压完可能还变大，而且多一次文件读取的成本不划算。

`minRatio: 0.8` 是压缩比的门槛。压完的体积除以原体积大于 0.8，说明这个文件几乎压不动，那就别生成 `.gz` 了。这两个参数配合起来，挡掉的是所有「压了也没用」的情况。

`asset` 是产物文件名模板，`[path].gz[query]` 表示在原路径后面加 `.gz` 后缀。这个字段在插件后续版本里改名成了 `filename`，升级版本的时候记得对一下当前版本的文档，参数名对不上插件会直接报错。

上方我们通过在生产环境中增加 Gzip 压缩配置实现了打包后输出增加对应的 `.gz` 为后缀的文件。而由于我们配置项中配置的是只压缩大小超过 10240B（10kB）的 JS 及 CSS，因此不满足条件的文件不会进行 Gzip 压缩。构建完成后去 `dist` 目录看一眼，你会看到 `app.xxxx.js` 旁边多了一个 `app.xxxx.js.gz`，对比两者的体积就能直观看到压缩效果，文本类资源压到原体积的三分之一以下是很常见的。

### 光生成文件是不够的

这一步最容易被忽略：`.gz` 文件生成出来，服务器不认的话它就只是静静躺在那儿占磁盘。

浏览器请求 `app.js` 的时候会带上 `Accept-Encoding: gzip` 这个请求头，表示我能解 gzip。服务器需要识别这个头，把 `app.js.gz` 的内容发回来，并带上响应头 `Content-Encoding: gzip`。nginx 上对应的配置是 `gzip_static on;`，它的行为就是优先找同名的 `.gz` 文件直接发送，找不到才回退。

如果服务器只开了 `gzip on;`（动态压缩）而没开 `gzip_static`，那你构建时生成的 `.gz` 完全没被用上，nginx 每次请求都在实时压一遍。功能上没错，但白干了一件事。

验证方法很简单，打开 Chrome DevTools 的 Network 面板，看目标文件的响应头有没有 `Content-Encoding: gzip`，再对比 Size 和 Content 两列的数值差异。

### 现在还这么做吗

Gzip 这件事本身没过时，但工具链变了。

如果你用的是 Vite，社区常用的是 `vite-plugin-compression` 这类插件，配置项的思路和上面基本一致。另一个变化是 Brotli，压缩率比 Gzip 更高一些，主流浏览器都支持了，nginx 上有对应的 `ngx_brotli` 模块。做法是同时生成 `.gz` 和 `.br` 两份，让服务器按浏览器的 `Accept-Encoding` 自己选。

还有一种更省事的路子是把静态资源托管到 CDN 或者对象存储上，压缩这件事由服务商在边缘节点处理，你的构建流程里一行配置都不用加。我现在的小项目基本都走这条路，构建产物越简单越好维护。

至于 `alias` 和入口收敛这两件事，Vite 里对应的是 `resolve.alias` 配置和 `main.js` 里的插件注册，写法不同，做的事情是同一件。

## 总结

把这一圈过下来，几个能直接带走的结论：

- `alias` 的核心价值是让引用路径和文件位置解耦，移动文件不用改引用，少打点号只是附带
- 别名前缀要跟 npm 包名区分开，`_com` 这种写法比 `utils` 安全
- CLI 3 改 webpack 配置分两个口子，整体合并用 `configureWebpack`，改已有规则的细节用 `chainWebpack`
- CSS 和模板里引用别名必须加 `~`，否则 `css-loader` 会当成相对路径去找
- 多入口的公共初始化抽成一个接收 Vue 的函数，别在里面自己 import Vue，避免多份 Vue 副本的坑
- Gzip 的 `threshold` 和 `minRatio` 是用来挡掉「压了也没收益」的文件，别把它们调没
- 构建时生成 `.gz` 只完成了一半，服务器要开 `gzip_static` 才会真正用上
- 原文那段 Gzip 配置里 `minRatio: 0.8` 后面是个全角逗号，照抄会直接报语法错误

这三件事都属于「不做也能上线，做了之后每天都舒服一点」的类型。我的建议是趁项目还小的时候一次性配好，等文件多到几百个再来整理，光是改引用路径就够折腾一天。

## 参考

- [Vue CLI - webpack 相关配置](https://cli.vuejs.org/zh/guide/webpack.html)
- [webpack - resolve.alias](https://webpack.docschina.org/configuration/resolve/#resolvealias)
- [compression-webpack-plugin - GitHub](https://github.com/webpack-contrib/compression-webpack-plugin)
- [nginx - ngx_http_gzip_static_module](https://nginx.org/en/docs/http/ngx_http_gzip_static_module.html)
- [MDN - Content-Encoding](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Encoding)
- [前端进阶之旅](https://interview.poetries.top)
