---
title: Vue 路由 vue-router 用法完全梳理（十一）
description: 从前端路由的原理讲起，梳理 vue-router 的动态路由、嵌套路由、编程式导航、命名路由与命名视图、重定向别名，以及 query 和 params 两种传参方式的取舍。
date: 2018-08-28 15:30:32
tags:
  - Vue
  - vue-router
  - 前端路由
categories: Front-End
---

第一次做单页应用，我卡在一个很蠢的问题上：地址栏明明变了，页面为什么没刷新？后来才反应过来，这正是前端路由要干的事。把「URL 变化」和「向服务器要一个新页面」这两件事解绑，改成由前端自己决定该渲染哪个组件。理清这一层之后，`vue-router` 的那堆 API 就不再是零散的配置项了，它们各自对应着一类真实需求。这篇把路由基础、动态匹配、嵌套、编程式跳转、命名视图、传参这几块串起来讲一遍，顺带把原文里几处写错的配置改对。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 前端路由是什么，它的优点和代价各在哪
- `hash` 和 `history` 两种模式的差别，以及 `history` 模式为什么会 404
- 动态路由匹配，商品详情页这类场景怎么配
- 嵌套路由和命名视图分别解决什么布局问题
- 编程式导航的几种写法，`push` 和 `go` 的区别
- `query` 和 `params` 两种传参方式，为什么一般建议用 `query`
- 重定向和别名的区别，别名不是跳转
- Vue Router 4 的写法变化，老项目迁移要动哪里

## 一、路由基础

### 1.1 什么是前端路由

路由是根据不同的 `url` 地址展示不同的内容或页面。

前端路由就是把「不同的路由对应不同的内容或页面」这个任务交给前端来做。之前是通过服务端根据 `url` 的不同返回不同的页面实现的，现在这一步挪到了浏览器里。

实现上靠的是两套浏览器能力。一套是 `hash`，URL 里 `#` 后面的部分变化不会触发页面请求，监听 `hashchange` 事件就能知道该切哪个组件；另一套是 HTML5 的 History API，`pushState` 和 `replaceState` 可以在不刷新页面的前提下改地址栏，配合 `popstate` 事件感知前进后退。

### 1.2 什么时候使用前端路由

单页面应用里，大部分结构不变，只改变内容的场景。

比如后台管理系统，左侧菜单和顶部导航永远在，切菜单只换右侧那块内容区。这种结构用前端路由收益最大，因为不变的部分完全不需要重新渲染。

反过来，如果每个页面的结构差异很大、SEO 又很重要（比如内容站、电商详情页），前端路由就不一定划算。

### 1.3 前端路由的优点和代价

优点很直接：用户体验好，不需要每次都从服务器全部获取，切换是瞬时的。

代价这块，原文列了三条，这里逐条说清楚。

第一条是不利于 SEO。这是真的，因为搜索引擎爬虫拿到的是一个几乎空的 HTML 加一堆 JS。虽然现在主流爬虫具备执行 JS 的能力，但成本高、时机不可控，重视自然流量的站点还是得上服务端渲染。

第二条原文写的是「使用浏览器的前进后退键时会重新发送请求」。这条要修正一下：前进后退本身不会触发整页刷新，路由切换是在前端完成的。真正会重复请求的是数据，如果组件在 `created` 里发请求且没做缓存，每次回到这个路由都会再请求一次。所以问题不在路由机制，在数据层没有缓存，`keep-alive` 或者一个简单的内存缓存就能解决。

第三条是滚动位置。SPA 切换路由时页面不会重新加载，浏览器原生的滚动恢复也就不生效了，从列表页进详情再返回，回到的是顶部而不是原来那个位置。`vue-router` 提供了 `scrollBehavior` 配置来手动处理这件事，配合 `keep-alive` 记录 `scrollTop` 是常见做法。

## 二、用 vue-router 构建 SPA

### 2.1 从最小可运行的例子开始

在项目 `src` 目录下的 `main.js` 里注册插件：

```javascript
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)
```

`vue-router` 底层就是对 History API 的封装，地址后面跟 `#` 用的是 `hash` 模式。

先定义两个模板：

```html
<div id="box">
</div>
<!--定义模版-->
<template id="a">
    <div>
        第一个router
    </div>
</template>
<template id="b">
    <div>
        第二个router
    </div>
</template>
```

再把路由表和实例接起来：

```javascript
// 定义路由表
var routes = [
    {
        path: "/one",
        component: { template: "#a" }
    },
    {
        path: "/two",
        component: { template: "#b" }
    }
];
// 创建路由实例
var router = new VueRouter({
    routes
});
// 挂载到根实例上
new Vue({
    el: "#box",
    router
});
```

最后在模板里放入口和出口：

```html
<div id="box">
    <router-link to="/one">One</router-link>
    <router-link to="/two">Two</router-link>
    <router-view></router-view>
</div>
```

两个组件的分工是这样的：

- `router-link` 默认会被渲染成一个 `a` 标签，`to` 是我们定义的路由路径
- `router-view` 是出口，路由匹配到的组件将渲染在这里

为什么不直接用 `a` 标签？因为原生 `a` 标签点击会触发浏览器导航，整页刷新，SPA 的状态全丢。`router-link` 内部拦掉了默认行为，改成调用路由的跳转方法，同时还会自动给当前激活的链接加上 `router-link-active` 类名，做导航高亮不用自己写逻辑。

### 2.2 hash 模式和 history 模式

在 `new Router` 中指定 `mode` 为 `history` 即可去掉 `#`，这样地址看起来更接近传统页面：

```javascript
new Router({
    mode: "history",
    routes: []
})
```

这里有个坑要注意，而且是上线才会暴露的那种。`history` 模式下地址栏是真实路径，用户在 `/goods/123` 这个页面按 F5，浏览器会真的向服务器请求 `/goods/123` 这个资源，而服务器上根本没有这个文件，返回 404。解决办法是在服务器上配一条兜底规则，把所有未匹配到静态资源的请求都指向 `index.html`。Nginx 里就是 `try_files $uri $uri/ /index.html;` 这一行。

`hash` 模式没有这个问题，因为 `#` 后面的内容压根不会发给服务器。代价是地址不好看，而且某些第三方分享、微信 JS-SDK 签名遇到 hash 会有额外麻烦。

跳转的两种方式，模板里用 `router-link`，代码里用 `this.$router.push`：

```javascript
// router-link 跳转标签，当 a 标签使用，to 必须是一个绝对地址
// <router-link to="/goods/title"></router-link>

// 或者用编程式导航
this.$router.push({ path: "/goods/title" })
```

### 2.3 动态路由匹配

通过变化的地址去加载不同的信息，路径里用冒号声明参数段：

|模式|匹配路径|`$route.params`|
|---|---|---|
|`/user/:username`|`/user/poetries`|`{username:"poetries"}`|
|`/user/:username/post/:post_id`|`/user/poetries/post/123`|`{username:"poetries",post_id:"123"}`|

原文表格第二行的匹配结果写成了 `evan`，和左边的路径对不上，这里改回一致的。另外注意 `post_id` 拿到的是字符串 `"123"` 而不是数字，URL 里没有类型这回事，要数字得自己转。

典型应用场景是商城的详情页，要变换商品的 `id`，根据商品的 `id` 去查对应商品的信息。

这里还有一个高频问题：从 `/user/a` 跳到 `/user/b`，两个路径匹配的是同一个组件，Vue 会复用组件实例而不是销毁重建，所以 `created` 和 `mounted` 都不会再跑一遍，你在里面写的请求也就不会重新发。解决办法是 `watch` 一下 `$route`，或者给 `router-view` 加一个以完整路径为值的 `key` 强制重建。前者性能好，后者写起来省事。

### 2.4 嵌套路由

嵌套路由就是路由里面再套路由，对应的是「页面里有一块区域自己还要切换」的布局：

```javascript
new Router({
    mode: "history",
    routes: [
        {
            path: "/goods",
            name: "GoodsList",
            component: GoodsList,
            children: [ // 定义子路由
               {
                   path: "title", // 最终形式 /goods/title
                   name: "title",
                   component: Title
               }
            ]
        }
    ]
})
```

有一点容易漏：父组件 `GoodsList` 的模板里必须自己放一个 `router-view`，子路由的组件才有地方渲染。忘了放的话，地址变了但页面上什么都不显示，也不报错。

子路由的 `path` 不以斜杠开头时是相对父路径拼接的，写成 `/title` 就变成了绝对路径，会直接挂在根上。这个区别在配置多级菜单的时候经常出问题。

### 2.5 编程式导航

通过 JavaScript 来实现页面跳转：

```javascript
// 方式一，直接传路径字符串
this.$router.push("/cart")

// 方式二，传对象
this.$router.push({ path: "/cart" })

// 方式三，路径里拼查询参数
this.$router.push({ path: "/cart?a=123" })

// 或者用 query 字段，更推荐
this.$router.push({ path: "/cart", query: { a: 123 } })

// 方式四，在历史记录里前进后退
this.$router.go(1)   // 前进一步
this.$router.go(-1)  // 后退一步，等价于 this.$router.back()
```

`push` 和 `go` 是两类东西。`push` 是往历史栈里压一条新记录，用户按返回键能回到原来的页面；`go` 是在已有的历史栈里移动。还有一个 `replace`，它替换当前记录而不是新增，登录成功后跳首页最适合用它，这样用户按返回不会又回到登录页。

拿传过去的参数：

```javascript
this.$router.push("/cart?goodsId=123")
```

```html
<!--在页面上拿 goodsId-->
<span>{{$route.query.goodsId}}</span>
```

原文这里写的是 `$.route.query`，中间多了一个点，是个笔误，正确的是 `$route`。顺带把两个容易混的对象说清楚：`$router` 是路由实例，用来做跳转这类动作；`$route` 是当前路由信息对象，用来读 `path`、`params`、`query` 这些数据。一个动词一个名词，记这个就不会搞反。

### 2.6 命名路由

有时通过一个名称来标识一个路由更方便，特别是在链接一个路由或者执行跳转的时候。可以在创建 `Router` 实例时，在 `routes` 配置中给某个路由设置名称：

```javascript
new Router({
    mode: "history",
    routes: [
        {
            path: "/cart/:cartId",
            name: "cart",
            component: Cart
        }
    ]
})
```

之前的跳转方式是写死路径：

```html
<router-link to="/cart"></router-link>
```

用名字跳转，还能带上参数：

```html
<router-link :to="{ name: 'cart', params: { cartId: 123 }}"></router-link>
<!--params 是路由的参数，并不是页面之间跳转的查询参数-->
```

原文这一行在 `v-bind:to` 的引号里套了两层花括号。`v-bind` 的引号里本来就是 JavaScript 表达式，写一层对象字面量就够了，多套一层会直接报解析错误。这里改成了上面那种单层的正确形式。

命名路由的实际价值在于解耦。路径是会变的，产品说详情页从 `/detail/:id` 改成 `/goods/detail/:id`，如果全项目都是硬编码路径，得全局搜索改一遍；用名字的话只改路由表一处。

### 2.7 命名视图

有时候想同时（同级）展示多个视图，而不是嵌套展示。例如创建一个布局，有 `sidebar`（侧导航）和 `main`（主内容）两个视图，这时候命名视图就派上用场了。如果 `router-view` 没有设置名字，那么默认为 `default`。

先给出口起名字：

```html
<router-view></router-view>
<router-view name="title"></router-view>
<router-view name="image"></router-view>
```

再在路由配置里用 `components`（注意是复数）把名字映射到组件：

```javascript
new Router({
    mode: "history",
    routes: [
        {
            path: "/",
            name: "home",
            // 根据不同的 name 值加载对应的 router-view
            components: {
                default: GoodsList,
                title: Title,
                image: Image
            }
        },
        {
            path: "/cart/:cartId",
            name: "cart",
            component: Cart
        }
    ]
})
```

原文这段配置把两条路由的 `path` 和 `name` 写进了同一个对象里，同名的键后面会覆盖前面的，实际只有最后一条生效，这里拆成了两个路由对象。另外出口写的是 `name="image"` 而配置里写的是 `img`，对不上号那个视图就是空的，这里也统一了。

不命名会怎样？页面上放两个匿名的 `router-view`：

```html
<router-view></router-view>
<router-view></router-view>
```

它们都会匹配 `default`，同一个组件被渲染两次。所以需要为视图命名：

```html
<router-view name="a"></router-view>
<router-view name="b"></router-view>
```

```javascript
var Foo = { template: '<div>foo</div>' }
var Bar = { template: '<div>bar</div>' }
var routes = [
    {
        path: "/one",
        name: "one",
        components: {
            a: Foo,
            b: Bar
        }
    }
]
```

说实话命名视图我在业务里用得极少，绝大多数「同页多区块」的需求直接写组件就行，不需要走路由。它真正的用武之地是那种「同一个 URL 下多个区域都要跟着路由变」的布局，比如带独立侧栏内容的文档站。

### 2.8 重定向和别名

重定向就是通过配置把某个路径的请求转到另一个位置，常用于网站调整或者页面被移到新地址。它也是通过 `routes` 配置来完成的，下面的例子是从 `/a` 重定向到 `/b`：

```javascript
var router = new VueRouter({
  routes: [
    { path: '/a', redirect: '/b' }
  ]
})
```

别名是另一回事。`/a` 的别名是 `/b`，当用户访问 `/b` 时，URL 会保持为 `/b`，但是路由匹配则为 `/a`，就像用户访问 `/a` 一样：

```javascript
var router = new VueRouter({
  routes: [
    { path: '/a', component: A, alias: '/b' }
  ]
})
```

两者的差别就一句话：重定向会改地址栏，别名不改。旧链接要淘汰用重定向，同一个页面想挂两个入口且都要保留用别名。

`redirect` 还支持传函数，根据来源动态决定去哪，做灰度分流的时候有用。

### 2.9 列表进详情的传参

例如商品列表页面前往商品详情页面，需要传一个商品 id：

```html
<router-link :to="{path: 'detail', query: {id: 1}}">前往detail页面</router-link>
```

详情页的路径为 `http://localhost:8080/#/detail?id=1`，可以看到传了一个参数 `id=1`，并且就算刷新页面 id 也还会存在。此时在详情页可以通过 id 来获取对应的详情数据，获取方式是 `this.$route.query.id`。

Vue 的传参方式有两种，`query` 和 `params` 加动态路由。`query` 通过 `path` 切换路由，`params` 通过 `name` 切换路由：

```html
<!-- query 通过 path 切换路由 -->
<router-link :to="{path: 'Detail', query: { id: 1 }}">前往Detail页面</router-link>
<!-- params 通过 name 切换路由 -->
<router-link :to="{name: 'Detail', params: { id: 1 }}">前往Detail页面</router-link>
```

接收也分两套，`query` 通过 `this.$route.query`，`params` 通过 `this.$route.params`：

```javascript
// query 通过 this.$route.query 接收参数
created () {
    const id = this.$route.query.id;
}

// params 通过 this.$route.params 来接收参数
created () {
    const id = this.$route.params.id;
}
```

两者在 URL 上的表现完全不同：

- `query` 传参的 URL 是 `/detail?id=1&user=123&identity=1`，参数都挂在问号后面
- `params` 加动态路由的 URL 是 `/detail/123`，参数是路径的一部分

`params` 动态路由传参一定要在路由中定义参数，跳转的时候也必须带上参数，否则就是空白页面：

```javascript
{
    path: '/detail/:id',
    name: 'Detail',
    component: Detail
}
```

**注意**，`params` 传参时如果没有在路由中定义参数，也是可以传过去的，同时也能接收到，但是一旦刷新页面，这个参数就不存在了。这对于需要依赖参数进行某些操作的行为是行不通的：

```javascript
// 定义的路由中，只定义一个 id 参数
{
    path: '/detail/:id',
    name: 'Detail',
    component: Detail
}
```

```html
<!-- 传了一个 id 参数和一个 token 参数 -->
<!-- id 是在路由中已经定义的参数，而 token 没有定义 -->
<router-link :to="{name: 'Detail', params: { id: 1, token: '123456' }}">前往Detail页面</router-link>
```

```javascript
// 在详情页接收
created () {
    // 以下都可以正常获取到
    // 但是页面刷新后，id 依然可以获取，而 token 此时就不存在了
    const id = this.$route.params.id;
    const token = this.$route.params.token;
}
```

原因不难理解：没在路径里出现过的参数只存在于内存里，刷新页面等于重新加载应用，内存里的东西全没了，只有 URL 上写着的才活得下来。

所以结论是尽量用 `query` 传参。它的值全部体现在 URL 上，刷新不丢、可分享、可收藏、可以直接复制给同事复现问题。`params` 只在「这个值本身就是资源标识」的场景用，比如商品 id、文章 id，它构成 RESTful 风格路径的一部分。

对应的代价也要说清楚：`query` 参数在地址栏上是明文，敏感信息不能这么传；参数多的时候 URL 会很长，超过服务器或浏览器的长度限制会被截断。真有大量参数要带，用 Vuex 或者 sessionStorage 更合适。这类实战取舍我在 [Vue 项目中的痛点](https://feinterview.poetries.top/blog/vue-project-dev-question) 那篇里还聊了跨域、按需加载、懒加载几个话题。

## 三、Vue Router 4 有哪些变化

上面所有代码都是 Vue Router 3 配 Vue 2 的写法。Vue 3 项目要用 Vue Router 4，几处改动是绕不过去的。

创建方式变了。不再是 `new VueRouter({})`，改成从包里导入 `createRouter` 函数：

```javascript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ...
  ]
})
```

`mode: 'history'` 这个配置项没了，改成传一个 history 实现进去。`createWebHistory` 对应原来的 history 模式，`createWebHashHistory` 对应 hash 模式。这个改动的好处是可以按需打包，用不到的那种模式不会进产物。

通配符路由的写法变了。原来匹配 404 页面写 `path: '*'`，Vue Router 4 里要写成带自定义正则的参数形式，因为路由匹配引擎换了一套。具体的写法以官方文档为准，我记的是 `/:pathMatch(.*)*` 这个形式。

`router-link` 上的 `tag` 和 `event` 两个 prop 被移除了，需要自定义渲染的改用作用域插槽。

`push` 时用 `path` 配 `params` 的组合不再生效。这个行为在 Vue Router 3 里其实也是无效的（`params` 会被静默忽略），只是 4 里把它明确化了。要传 `params` 就用 `name`，别混着写。

`$route` 和 `$router` 在组合式 API 里通过 `useRoute()` 和 `useRouter()` 两个函数拿，`script setup` 里没有 `this` 可用。

## 总结

把这一路的 API 按需求归个类会清楚很多：

想让一个组件根据 URL 里的变量展示不同数据，用动态路由 `:id`；想让页面里某块区域自己切换，用嵌套路由加内层 `router-view`；想让同一个 URL 下多个区域同时切换，用命名视图；想在代码里跳转，用 `push` / `replace` / `go`；想淘汰旧链接，用 `redirect`；想给一个页面挂两个入口，用 `alias`。

传参这块只有一条结论值得记：默认用 `query`。它刷新不丢、可分享，代价只是 URL 长一点、明文可见。只有当那个参数本身就是资源标识的时候才用 `params` 加动态路由。

上线前记得确认两件事：`history` 模式的服务器兜底规则配了没，同组件路由切换时的数据刷新处理了没。这两个问题在本地开发环境都不会暴露。

## 参考

- [Vue Router 官方文档](https://router.vuejs.org/zh/)
- [Vue Router 4 从 Vue2 迁移](https://router.vuejs.org/zh/guide/migration/index.html)
- [Vue 3 官方文档](https://cn.vuejs.org/)
- [MDN - History API](https://developer.mozilla.org/zh-CN/docs/Web/API/History_API)
- [前端进阶之旅](https://interview.poetries.top)
