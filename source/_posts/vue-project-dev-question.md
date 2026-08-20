---
title: Vue 项目开发中的十个痛点与解法（十四）
description: 路由传参、本地跨域代理、axios 封装、UI 库按需加载、定时器泄漏、rem 适配、sourcemap、点击延迟、路由懒加载、gzip 压缩，十个 Vue 实战问题的成因与解法。
date: 2018-08-28 17:10:30
tags:
  - Vue
  - 工程化
  - 性能优化
categories: Front-End
---

学 Vue 的语法是一回事，把一个项目从零跑到上线是另一回事。前者看文档就够了，后者遇到的全是文档不写的东西：本地请求接口被浏览器拦了、切了路由定时器还在跑、打包出来一个 6MB 的产物里有一半是 sourcemap、移动端点按钮要等三百毫秒才有反应。这些问题单拎出来都不难，但你不知道它存在的时候能耗掉一整天。这篇把我在 Vue 2 项目里踩得最密集的十个点整理出来，每个都写清楚成因、解法和现在的做法，方便对着排查。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 列表进详情传参，`query` 和 `params` 到底该选哪个
- 本地开发跨域，`proxyTable` 是怎么绕过同源策略的
- `axios` 封装和接口统一管理该封装到什么程度
- UI 库按需加载的原理，`babel-plugin-import` 干了什么
- 定时器不清理为什么会拖垮页面，两种清理写法的取舍
- rem 适配脚本的原理，以及现在更省事的方案
- 生产环境为什么要关掉 sourcemap，关了之后线上报错怎么查
- 移动端 300ms 点击延迟的来历，以及它现在还在不在
- 路由懒加载的写法演进，从 `require` 回调到动态 `import`
- gzip 为什么必须前后端一起配才生效

## 一、列表进入详情页传参

例如商品列表页面前往商品详情页面，需要传一个商品 id：

```html
<router-link :to="{path: 'detail', query: {id: 1}}">前往detail页面</router-link>
```

详情页的路径为 `http://localhost:8080/#/detail?id=1`，可以看到传了一个参数 `id=1`，并且就算刷新页面 id 也还会存在，通过 `this.$route.query.id` 就能拿到。

Vue 的传参方式有两种，`query` 和 `params` 加动态路由。`query` 通过 `path` 切换路由，`params` 通过 `name` 切换路由：

```html
<!-- query 通过 path 切换路由 -->
<router-link :to="{path: 'Detail', query: { id: 1 }}">前往Detail页面</router-link>
<!-- params 通过 name 切换路由 -->
<router-link :to="{name: 'Detail', params: { id: 1 }}">前往Detail页面</router-link>
```

接收也是两套 API：

```javascript
// query 通过 this.$route.query 接收
created () {
    const id = this.$route.query.id;
}

// params 通过 this.$route.params 接收
created () {
    const id = this.$route.params.id;
}
```

URL 上的表现差别很直观，`query` 是 `/detail?id=1&user=123`，`params` 加动态路由是 `/detail/123`。

用 `params` 有个前提，一定要在路由中定义参数，跳转时必须带上，否则就是空白页面：

```javascript
{
    path: '/detail/:id',
    name: 'Detail',
    component: Detail
}
```

**注意**，`params` 传参时如果没有在路由中定义参数，也是可以传过去的，同时也能接收到，但是一旦刷新页面这个参数就不存在了。对于需要依赖参数进行某些操作的行为，这是行不通的：

```html
<!-- 路由中只定义了 id 参数，token 没有定义 -->
<router-link :to="{name: 'Detail', params: { id: 1, token: '123456' }}">前往Detail页面</router-link>
```

```javascript
created () {
    // 两个都能拿到
    // 但页面刷新后 id 依然可以获取，token 就不存在了
    const id = this.$route.params.id;
    const token = this.$route.params.token;
}
```

原因说穿了很简单：没写进 URL 的参数只活在内存里，刷新等于整个应用重新加载，内存里的东西全清空，只有地址栏上的字符能活下来。

所以这一条的结论是尽量使用 `query` 来传参。它刷新不丢、可复制、可分享，出了问题让同事把链接发过来就能直接复现。`params` 留给「这个值本身就是资源标识」的场景，比如商品 id 拼成 RESTful 风格的路径。路由本身的完整用法我在 [Vue 路由 vue-router](https://feinterview.poetries.top/blog/vue-router) 那篇里系统梳理过，这里只讲落到项目里的取舍。

## 二、请求服务器接口跨域

本地开发项目请求服务器接口的时候，因为浏览器的同源策略，会遇到跨域问题。

`vue-cli` 初始化的项目在配置文件里提供了 `proxyTable` 来解决本地开发的跨域。在 `config/index.js` 里找到 `proxyTable` 选项，做如下配置：

```javascript
proxyTable: {
      // 用 '/api' 开头，代理所有请求到目标服务器
      '/api': {
        target: 'http://jsonplaceholder.typicode.com', // 接口域名
        changeOrigin: true, // 是否改写请求头里的 Host
        pathRewrite: {
          '^/api': ''   // 转发时把前缀去掉
        }
      }
}
```

这样请求 `/api/posts/1` 会被转发到 `http://jsonplaceholder.typicode.com/posts/1`，本地环境就能正常调后台接口了。

它为什么能绕过跨域？关键在于同源策略是浏览器的限制，服务器之间互相请求不受这条约束。加了代理之后，浏览器发出的请求打的是 `localhost:8080/api/xxx`，和页面同源，浏览器不拦；`webpack-dev-server` 收到之后在 Node 这一层转发给真实后端，再把响应原样带回来。整条链路里浏览器从头到尾以为自己只跟本地服务器打过交道。

三个配置项各管一件事：`target` 是转发目标；`changeOrigin: true` 会把转发请求头里的 `Host` 改成目标域名，很多后端服务或者 Nginx 会按 `Host` 做虚拟主机路由，不改就匹配不上；`pathRewrite` 负责把用来识别的前缀去掉，因为真实接口路径上并没有 `/api` 这一段。

这里有个坑要注意，代理只在开发服务器上生效。打包出来的静态文件跑在 Nginx 上，`proxyTable` 这些配置压根不在产物里。上线的跨域要么后端加 CORS 响应头，要么 Nginx 配一段反向代理，两条路都得提前和后端约定好，不能等到发布当天才发现。

Vue CLI 3 之后配置文件换成了 `vue.config.js`，字段名从 `proxyTable` 改成了 `devServer.proxy`，Vite 里则是 `server.proxy`，三者的选项结构基本一致，迁移的时候照着改字段名就行。

## 三、axios 的封装和 API 接口的统一管理

`axios` 的封装主要是为了做请求拦截和响应拦截。

请求拦截里能干的事情有：统一带上 `userToken`、设置 `post` 请求头、用 `qs` 对 `post` 提交数据做序列化、给需要 loading 的请求打开遮罩。响应拦截里则可以根据状态码做统一的错误处理，比如 401 跳登录、500 弹提示、业务码非 0 统一 toast。

不封装会怎样？每个接口调用点都得自己写一遍 token 注入和错误处理，一个中型项目几百个接口，改一次登录态失效的处理逻辑要改几百处。这不是能不能维护的问题，是一定会漏改的问题。

接口的统一管理是做项目时必须的流程。把所有请求方法按模块收进 `api` 目录，业务组件里只 import 方法名，不出现任何 URL 字符串。这样接口路径变更时不必再回到业务代码里去改，改一处即可。顺带还有两个好处：接口有没有被用到，编辑器直接能查引用；接口的入参出参可以在这一层做类型标注，用 TypeScript 的话收益更明显。

封装到什么程度合适？我的经验是别过度。把「所有请求都要做的事」放进拦截器，把「URL 和参数拼装」放进 api 层，剩下的留在业务里。见过封装到最后连 loading、缓存、重试、并发控制全塞进一个 `request.js` 的，改一行牵动整站，比不封装还难维护。这块的具体写法在 [Vue 中使用 axios](https://feinterview.poetries.top/blog/vue-axios) 那篇里有展开。

## 四、UI 库的按需加载

这里以 `vant` 的按需加载为例，演示 Vue 里 UI 库怎样按需加载。

先装依赖：

```bash
npm i vant -S
npm i babel-plugin-import -D
```

在 `.babelrc` 文件中添加插件配置：

```json
{
    "plugins": [
        ["import",
            {
                "libraryName": "vant",
                "libraryDirectory": "es",
                "style": true
            }
        ]
    ]
}
```

原文这段配置开头多出了一个 `libraryDirectory {`，是复制时串行了，直接粘进项目 Babel 会报解析错误，这里去掉了。

然后在 `main.js` 里按需引入需要的组件：

```javascript
// 按需引入 vant 组件
import {
    DatetimePicker,
    Button,
    List
} from 'vant';
```

注册：

```javascript
// 使用 vant 组件
Vue.use(DatetimePicker)
    .use(Button)
    .use(List);
```

最后在页面中使用：

```html
<van-button type="primary">按钮</van-button>
```

`babel-plugin-import` 到底做了什么？它在编译阶段把上面那句解构导入改写成了逐个的路径导入，同时补上对应的样式文件导入。也就是说源码里写的一句 `import { Button } from 'vant'`，编译后会变成从 `vant/es/button` 导入组件、从 `vant/es/button/style` 导入样式。

为什么要这么绕一圈？因为直接从包入口解构导入，打包工具拿到的是整个入口模块，虽然现代打包器的 tree-shaking 能砍掉没用到的 JS，但样式文件是靠 `import` 副作用引入的，摇不掉。结果就是 JS 只留了一个按钮，CSS 却把整个组件库的样式全打进去了。

`libraryDirectory` 填 `es` 而不是 `lib`，是因为 `es` 目录是 ESM 格式的产物，能配合 tree-shaking；`lib` 是 CommonJS，静态分析做不了。`style: true` 引入的是未编译的样式源文件（vant 是 less），需要项目里配好对应的预处理器；填 `"css"` 则引入编译好的 css，省去 loader 配置。

现在的组件库大多已经内置了按需加载方案，Element Plus、Vant 4 都推荐用 `unplugin-vue-components` 这类插件，连 import 语句都不用写，模板里直接用标签，插件扫描后自动补导入。手动配 `babel-plugin-import` 这一套主要是老项目还在用。

## 五、定时器问题

在 a 页面写一个定时器，让它每秒打印一个 1，然后跳转到 b 页面，可以看到定时器依然在执行。这是非常消耗性能的。

为什么组件都销毁了定时器还活着？因为 `setInterval` 是挂在浏览器全局的，Vue 只负责清理它自己建立的东西，比如模板里的事件绑定和内部 watcher。你手动创建的资源，它管不到也不该管。更糟的是回调函数里通常引用了 `this`，这条引用链让已经销毁的组件实例没法被垃圾回收，来回切几次路由内存就上去了。

### 方案一，把定时器存到 data 上

在 `data` 里定义定时器名称：

```javascript
data() {
    return {
        timer: null  // 定时器名称
    }
},
```

然后这样使用定时器：

```javascript
this.timer = setInterval(() => {
    // 某些操作
}, 1000)
```

原文这段少写了 `setInterval`，写成了 `this.timer = (() => {...}, 1000)`。这其实是一个逗号表达式，最终把 `1000` 赋给了 `this.timer`，定时器根本没建立起来。照抄的话会得到一个「定时器不执行，清理也不报错」的诡异现象，这里补上了。

最后在 `beforeDestroy()` 生命周期内清除定时器：

```javascript
beforeDestroy() {
    clearInterval(this.timer);
    this.timer = null;
}
```

方案一有两点不好的地方：

- 它需要在组件实例中保存这个 timer，如果可以的话最好只有生命周期钩子能访问到它。这不算严重问题，但它可以被视为杂物
- 建立代码和清理代码是分开的，这使得比较难于程序化地清理建立的所有东西

补一句实际的：`timer` 放进 `data` 还会被 Vue 转成响应式的，白白多一次 `defineProperty` 改造。定时器 ID 是个数字，没有任何理由需要响应式。真要挂在实例上，挂到 `this.timer` 但不写进 `data` 就行。

### 方案二，用 $once 监听销毁钩子

该方法是通过 `$once` 这个事件侦听器，在定义完定时器之后的位置来清除定时器：

```javascript
const timer = setInterval(() => {
    // 某些定时器操作
}, 500);
// 通过 $once 来监听销毁钩子，在 beforeDestroy 时清除
this.$once('hook:beforeDestroy', () => {
    clearInterval(timer);
})
```

这个写法的好处是建立和清理写在了一起，`timer` 是个局部变量，不污染实例。`hook:` 前缀是 Vue 2 提供的能力，可以把生命周期钩子当成事件来监听。

顺着上面聊，Vue 3 的组合式 API 把这件事做得更彻底。`onMounted` 里建、`onBeforeUnmount` 里清，两段代码写在同一个函数里，还能整个抽成一个可复用的组合函数，用的地方只要调一次。这个设计是真的舒服，它解决的正是方案一那个「建立和清理隔了几十行」的老问题。

顺带提一句，同样的道理适用于所有手动创建的资源：`addEventListener` 加的原生监听、`ResizeObserver`、WebSocket 连接、第三方图表实例、`requestAnimationFrame`。这些都得自己在销毁钩子里收拾。SPA 的内存泄漏十有八九出在这里。

## 六、rem 文件的导入问题

做手机端时适配是必须处理的一个问题。一种常见方案是写一个 `rem.js`，原理很简单，就是根据网页尺寸计算 `html` 的 `font-size` 大小：

```javascript
; (function(c, d) {
    var e = document.documentElement || document.body,
    a = "orientationchange" in window ? "orientationchange": "resize",
    b = function() {
        var f = e.clientWidth;
        e.style.fontSize = (f >= 750) ? "100px": 100 * (f / 750) + "px"
    };
    b();
    c.addEventListener(a, b, false)
})(window);
```

在 `main.js` 中直接 `import './config/rem'` 导入即可，路径根据你的文件位置填写。

这段代码值得逐句读一下。`750` 是设计稿宽度（当时主流的二倍图 iPhone 6 稿），基准值 `100px` 是为了换算方便，设计稿上量到 `37px` 就写 `0.37rem`，心算就能出结果。超过 750 宽度时锁死在 100px，避免在 iPad 或桌面浏览器上字大得离谱。监听事件优先用 `orientationchange` 是因为部分老安卓在横竖屏切换时 `resize` 触发不可靠。

现在还这么写吗？大部分场景不用了。构建阶段用 `postcss-pxtorem` 或者 `postcss-px-to-viewport` 直接把设计稿的 `px` 转成 `rem` 或 `vw`，写样式的时候按设计稿标注原样写数字，转换交给工具。`vw` 方案还能省掉这段 JS，纯 CSS 就能完成适配。

不过原理是一样的，都是把「一个设计稿单位」映射成「一个和屏幕宽度成比例的长度」。理解了这段脚本，看那些 PostCSS 插件的配置项会顺很多。移动端适配的更多细节可以看 [移动端适配方案](https://feinterview.poetries.top/blog/mobile-device-size)。

## 七、打包后生成很大的 .map 文件

项目打包后代码都是经过压缩混淆的，如果运行时报错，输出的错误信息无法准确得知是哪里的代码报错。生成的 `.map` 后缀文件可以像未加密的代码一样，准确输出是哪一行哪一列有错。

在 `config/index.js` 文件中设置 `productionSourceMap: false`，就可以不生成 `.map` 文件。

要不要关，取决于你怎么定位线上问题。sourcemap 文件体积通常比源码还大，跟着产物一起发布的话，一来占带宽，二来等于把源码公开了，任何人打开 DevTools 都能看到你的业务逻辑。所以生产环境不建议直接把 sourcemap 部署到公网。

那线上报错怎么查？现在主流做法是构建时照常生成 sourcemap，但不发布到 CDN，而是上传给错误监控平台。Sentry 这类服务支持接收 sourcemap 并在后台做还原，前端只上报压缩后的堆栈，平台把它翻译成源码位置。既保住了排查能力，又没把源码暴露出去。

如果暂时没有监控平台，退一步的做法是把 `devtool` 设成只生成不带源码内容的形式，或者把 map 文件放到只有内网能访问的地址。总之别一刀切地关掉就完事，关掉之后线上报错栈是一堆 `a.b.c is not a function`，那种排查体验非常痛苦。

## 八、fastClick 的 300ms 延迟

在 `main.js` 中引入 `fastClick` 并初始化：

```javascript
import FastClick from 'fastclick'; // 引入插件
FastClick.attach(document.body); // 使用 fastclick
```

这 300 毫秒是哪来的？早期移动浏览器要支持双击缩放，用户手指抬起之后浏览器得再等一小会儿，确认没有第二次点击才能判定这是一次单击，于是 `click` 事件被推迟了大约 300ms。在需要连续操作的界面里，这个延迟的手感非常明显，像是页面卡了一下。

FastClick 的做法是监听 `touchstart` 和 `touchend`，一旦判定为一次点击就立刻手动派发一个 `click` 事件，同时把浏览器随后真正派发的那个 click 拦掉。

这块要补一句时效性的说明。这个方案是 2018 年前后的标配，但现在基本用不上了。原因是浏览器自己把问题解决了：只要页面上声明了 `<meta name="viewport" content="width=device-width">`，表明这是一个为移动端优化过的页面、不需要双击缩放，主流浏览器就不再等那 300ms。局部还可以用 CSS 的 `touch-action: manipulation` 达到同样效果。FastClick 这个库本身也早已停止维护，作者在仓库说明里明确建议不再使用。

新项目直接把 viewport 那行 meta 写对就行，不要再引这个库。老项目里如果还留着它，摘掉之前建议在真机上回归一遍点击类交互，因为 FastClick 会改变事件派发顺序，某些依赖 `touchend` 的逻辑可能被它兜住了。

## 九、路由懒加载

路由懒加载可以让我们在进入首屏时不用加载过多资源，从而提升首屏速度。

非懒加载写法：

```javascript
import Index from '@/page/index/index';
export default new Router({
    routes: [
        {
            path: '/',
            name: 'Index',
            component: Index
        }
    ]
})
```

路由懒加载写法：

```javascript
export default new Router({
  routes: [
        {
            path: '/',
            name: 'Index',
            component: resolve => require(['@/view/index/index'], resolve)
        }
   ]
})
```

差别在于「什么时候把这个模块的代码下载下来」。顶部的 `import` 是静态依赖，打包时会被合进主 chunk，用户一进首页就得把所有页面的代码全下下来，哪怕他只看首页。懒加载写法则告诉打包工具「这里切一刀」，把这个组件单独打成一个 chunk，等路由真正被访问到才发请求去拿。

页面一多，这个差别就是几百 KB 起步。后台管理系统尤其明显，几十个路由全打进一个文件，首屏白屏时间能到好几秒。

`resolve => require([...], resolve)` 这个写法是 webpack 早期的 AMD 风格回调，现在应该用动态 `import()`：

```javascript
{
  path: '/',
  name: 'Index',
  component: () => import('@/view/index/index')
}
```

动态 `import()` 是语言标准的一部分，返回 Promise，webpack 和 Vite 都原生支持。还能用魔法注释给 chunk 命名，把几个相关页面打进同一个 chunk：

```javascript
component: () => import(/* webpackChunkName: "user" */ '@/view/user/index')
```

这里有个坑要注意，别切得太碎。每个 chunk 都是一次额外的网络请求，路由多的时候几十个小文件的请求开销可能比合并成几个大文件更差。按业务模块分组是比较合适的粒度。

配套要做的还有加载态。懒加载意味着切路由时会有一段等待，网络差的时候用户会看到空白。给路由加一个全局的进度条（比如 NProgress）成本很低，体感提升很大。

## 十、开启 gzip 压缩

SPA 这种单页应用首屏要一次性加载较多资源，加载速度容易偏慢。解决这个问题非常有效的手段之一就是前后端开启 gzip（其他还有缓存、路由懒加载等等）。gzip 帮我们减少文件体积，文本类资源通常能压到 30% 左右，也就是 100k 的文件 gzip 后大约只有 30k。

`vue-cli` 初始化的项目里默认有此配置，只需要开启即可，但需要先安装插件：

```bash
npm i compression-webpack-plugin -D
```

在 `config/index.js` 中开启：

```javascript
build: {
    // ...
    productionGzip: true, // false 不开启 gzip，true 开启
    // ...
}
```

这里前端做的是打包时的 gzip，还需要后台服务器配合。

为什么两边都要配？gzip 有两种做法。一种是服务器实时压缩，请求进来时现压，配置简单但每次请求都消耗 CPU。另一种是构建时预压缩，打包阶段就生成好 `.gz` 文件，服务器发现同名的 `.gz` 存在就直接把它发出去，CPU 开销为零。`compression-webpack-plugin` 走的是第二种，但服务器不知道要去找 `.gz` 文件，所以必须配合服务端开关。Nginx 里对应的是 `gzip_static on;` 这个指令，实时压缩则是 `gzip on;` 加上 `gzip_types`。

还有两个细节值得记：

图片和视频不要压。JPG、PNG、MP4 本身已经是压缩格式，再走一遍 gzip 体积几乎不降，白费 CPU。`gzip_types` 里只留文本类型就够了，HTML、CSS、JS、JSON、SVG、字体。

小文件也不划算。gzip 有固定的头部开销，几百字节的文件压完可能比原来还大。Nginx 的 `gzip_min_length` 默认值就是干这个的，一般设成 1k。

想再进一步的话，现在还可以上 Brotli，同样的文本压缩率比 gzip 再好一成左右，主流浏览器都支持，服务器按客户端的 `Accept-Encoding` 自动选择就行。

## 总结

这十个问题，如果按性质重新分组，其实是三类。

一类是「不知道就会卡住」的：本地跨域、`history` 模式刷新 404、`params` 刷新丢参数。这类问题没有技术难度，纯粹是知道与不知道的差别，看一遍就过去了。

一类是「不处理会慢慢恶化」的：定时器不清理、接口散落在业务代码里、UI 库全量引入、路由不做懒加载。这类问题在项目小的时候完全没感觉，等到几十个页面几百个接口时才爆发，而那时候改造成本已经很高了。项目起步阶段就把规范定下来最省事。

还有一类是「有明确时效性」的：FastClick 现在基本不需要了，rem 脚本可以换成 PostCSS 插件加 `vw`，`require` 回调式懒加载应该换成动态 `import()`，`proxyTable` 在新版本里叫别的名字。老文章看到这类内容，先确认一下它有没有被浏览器或工具链自己解决掉。

最后是我自己最有体感的一条：上线前一定单独跑一遍生产构建，本地开发环境跑得再顺，也遮不住 `history` 模式兜底、跨域、gzip 这三件只在生产环境暴露的事。

## 参考

- [Vue CLI 官方文档 - devServer.proxy](https://cli.vuejs.org/zh/config/#devserver-proxy)
- [Vue Router 官方文档](https://router.vuejs.org/zh/)
- [webpack 官方文档 - 代码分离](https://webpack.docschina.org/guides/code-splitting/)
- [Nginx 官方文档 - ngx_http_gzip_static_module](https://nginx.org/en/docs/http/ngx_http_gzip_static_module.html)
- [MDN - touch-action](https://developer.mozilla.org/zh-CN/docs/Web/CSS/touch-action)
- [前端进阶之旅](https://interview.poetries.top)
