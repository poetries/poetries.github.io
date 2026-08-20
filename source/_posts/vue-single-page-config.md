---
title: Vue单页应用的基本配置 路由 Vuex 与接口层分层
description: 从 Vue CLI 3 生成的默认模板出发，把路由懒加载、history 模式、Vuex 模块拆分、接口层封装和 devServer 代理一步步配到能上生产，并补上这些写法在 Vite 时代的对应做法。
date: 2019-06-02 00:13:32
tags:
  - Vue
  - Vue CLI
  - 工程化
categories: Front-End
---

`vue create` 敲完，项目跑起来了，`Home.vue` 和 `About.vue` 也能来回切。看着挺完整，但真接上业务就会发现，路由是全量打进一个 bundle 的，`Vuex` 只有一个空壳 `store.js`，请求是散在各个组件里的 `axios.get`，公共方法找不到地方放。这些坑我在几个项目上都重复踩过一遍。这篇把单页项目开工前该定下来的四件事捋一遍，路由、状态、接口、公共设施，每一处都给出改动前后的代码和改动的理由。读完你能拿到一份可以直接抄进新项目的目录约定。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- CLI 默认生成的 `router.js` 有哪三处必须改
- `base`、`history` 模式、路由懒加载各自解决什么问题，代价是什么
- `require.ensure` 和动态 `import()` 的区别，以及 webpack 魔法注释怎么给 chunk 命名
- Vuex 从单文件拆成模块的目录约定，四个核心概念之间的调用顺序
- 接口层怎么封装成一个 `Http` 类，`devServer.proxy` 怎么绕开本地跨域
- 这套 2019 年的配置，放到 Vite + Vue 3 时代对应的写法是什么

## 一、路由配置从默认模板改起

### CLI 生成的那份配置

先看 `CLI` 给我们生成的 `router.js` 文件的配置：

```js
/* router.js */

import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue' // 引入 Home 组件
import About from './views/About.vue' // 引入 About 组件

Vue.use(Router) // 注册路由

export default new Router({
    routes: [{
        path: '/',
        name: 'home',
        component: Home
    }, {
        path: '/about',
        name: 'about',
        component: About
    }]
})
```

这份配置能跑，但它是给「跑通 demo」准备的，不是给上线准备的。有三点需要优化：

- 如果路由存在二级目录，需要添加 `base` 属性，否则默认为 `"/"`
- 默认路由模式是 `hash` 模式，会携带 `#` 标记，与真实 url 不符，可以改为 `history` 模式
- 页面组件没有进行按需加载，可以使用 `require.ensure()` 来进行优化

下面是我们优化结束的代码：

```js
/* router.js */

import Vue from 'vue'
import Router from 'vue-router'

// 引入 Home 组件
const Home = resolve => {
    require.ensure(['./views/Home.vue'], () => {
        resolve(require('./views/Home.vue'))
    })
}

// 引入 About 组件
const About = resolve => {
    require.ensure(['./views/About.vue'], () => {
        resolve(require('./views/About.vue'))
    })
}

Vue.use(Router)

let base = `${process.env.BASE_URL}` // 动态获取二级目录

export default new Router({
    mode: 'history',
    base: base,
    routes: [{
        path: '/',
        name: 'home',
        component: Home
    }, {
        path: '/about',
        name: 'about',
        component: About
    }]
})
```

三处改动，三个不同的问题。挨个说。

### base 是给二级目录准备的

很多人第一次遇到 `base` 是在部署之后。本地 `yarn serve` 一切正常，传到服务器上放在 `https://xxx.com/vue/` 这个路径下，页面一片空白，控制台全是 404。

原因是路由默认认为自己挂在域名根路径上。你访问 `/vue/about`，`vue-router` 拿到的 `path` 是 `/vue/about`，而路由表里注册的是 `/about`，匹配不上。

`base` 做的事就是告诉路由「前面这一截不归你管」。配上 `base: '/vue/'` 之后，`vue-router` 会先把这一段截掉再去匹配。

这里用 `process.env.BASE_URL` 而不是写死字符串，是因为 Vue CLI 3 会自动把 `vue.config.js` 里的 `publicPath` 注入成这个环境变量。这样部署路径只需要改一个地方，路由和静态资源引用会同步跟着走，不会出现「JS 加载成功但路由匹配不上」这种最难查的半残状态。

顺带说一句，`publicPath` 这个字段在 Vue CLI 3.3 之前叫 `baseUrl`，老文章和老项目里两种写法都能见到，看到 `baseUrl` 别以为是笔误。

### history 模式要后端配合

`hash` 模式的地址长这样：`https://xxx.com/#/about`。井号后面的内容不会发给服务器，所以刷新页面永远命中的是同一个 `index.html`，天然不需要后端做任何事。代价是 URL 里挂着一个多余的 `#`，做 SEO 和分享的时候都不好看。

`history` 模式用的是 HTML5 的 `pushState`，地址是干净的 `https://xxx.com/about`。但你在这个地址上按刷新，请求是真的会发到服务器的，服务器上并没有 `/about` 这个文件，返回 404。

所以 `history` 模式不是改一行配置就完事的。

服务端需要配一条兜底规则，把所有匹配不到静态文件的请求都指回 `index.html`。nginx 里就是 `try_files $uri $uri/ /index.html;` 这一行。这块在多页应用里要复杂得多，每个单页都得单独指回自己的 html，我在 [Vue多页路由与模板解析](https://feinterview.poetries.top/blog/vue-router-and-template-analyse) 里专门写了怎么配。

### 路由懒加载，两种写法

不做懒加载的项目，打包出来就是一个几百 KB 的 `app.js`，用户打开首页要把整站所有页面的代码都下载完。页面越多，首屏越慢。

懒加载做的事是把每个路由组件切成单独的 chunk，访问到哪个路由才去下载哪个 chunk。

上面的优化版用的是 `require.ensure`，这是 webpack 早期提供的代码分割 API。它能用，但语法比较绕，`resolve` 回调那一层完全是仪式感。

除了使用 `require.ensure` 来拆分代码，`Vue Router` 官方文档还推荐使用动态 `import` 语法来进行代码分块，比如上述 `require.ensure` 代码可以修改为：

```js
// 引入 Home 组件
const Home = () => import('./views/Home.vue');

// 引入 About 组件
const About = () => import('./views/About.vue');
```

一行搞定，而且这是 ECMAScript 的标准提案，不绑定 webpack。新项目直接用这个就行，`require.ensure` 只在维护老代码时才需要认识。

拆出来的 chunk 默认叫 `0.js`、`1.js` 这种数字名，线上排查问题的时候完全看不出是哪个页面。如果你想给拆分出的文件命名，可以尝试一下 webpack 提供的 Magic Comments（魔法注释）：

```js
const Home = () => import(/* webpackChunkName:'home'*/ './views/Home.vue');
```

这个注释会被 webpack 读走，打包产物就变成 `home.js`。多个路由用同一个 `webpackChunkName`，它们还会被合并进同一个 chunk，适合把几个总是一起访问的页面打包在一起，省几次请求。

## 二、Vuex 从单文件拆成模块

CLI 生成的 `store.js` 是这样一个空壳：

```js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {

    },
    mutations: {

    },
    actions: {

    }
})
```

主要有 4 个核心点：`state`、`mutations`、`actions` 及 `getter`。

这里我用一句话介绍它们之间的关系就是：**我们可以通过 actions 异步提交 mutations 去修改 state 的值并通过 getter 获取**。

这个顺序不是 Vuex 故意找麻烦。`mutations` 必须是同步的，因为 devtools 要靠它记录每一次状态变更的快照，异步操作一进来时间线就乱了。所以异步逻辑统一放 `actions`，拿到结果再 `commit` 给 `mutations`。你在 `actions` 里直接改 `state` 也能改动，但 devtools 追踪不到，出问题的时候你会很想抽自己。

项目一大，所有状态堆在一个文件里就没法看了。按模块拆开：

```
└── store
    ├── index.js          # 我们组装模块并导出 store 的地方
    ├── actions.js        # 根级别的 action
    ├── mutations.js      # 根级别的 mutation
    └── modules
        ├── moduleA.js    # A模块
        └── moduleB.js    # B模块
```

与单个 `store.js` 文件不同的是，我们按模块进行了划分，每个模块中都可以包含自己 4 个核心功能。比如模块 A 中：

```js
/* moduleA.js */

const moduleA = {
    state: { 
        text: 'hello'
    },
    mutations: {
        addText (state, txt) {
            // 这里的 `state` 对象是模块的局部状态
            state.text += txt
        }
    },
    
    actions: {
        setText ({ commit }) {
            commit('addText', ' world')
        }
    },

    getters: {
        getText (state) {
            return state.text + '!'
        }
    }
}

export default moduleA
```

注意 `mutations` 里那个 `state` 参数，它是模块的局部状态，不是根 state。想在模块里访问根 state，得从 `actions` 的第一个参数里解构 `rootState`。这个我踩过，在模块的 `getters` 里直接写 `state.someGlobalFlag` 拿到 `undefined`，查了半天才反应过来作用域不对。

然后在 `index.js` 里组装：

```js
/* index.js */

import Vue from 'vue'
import Vuex from 'vuex'
import moduleA from './modules/moduleA'
import moduleB from './modules/moduleB'
import { mutations } from './mutations'
import actions from './actions'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        groups: [1]
    },
    modules: {
        moduleA, // 引入 A 模块
        moduleB, // 引入 B 模块
    },
    actions, // 根级别的 action
    mutations, // 根级别的 mutations
    
    // 根级别的 getters
    getters: {
        getGroups (state) {
            return state.groups
        }
    }   
})
```

这样项目中状态的模块划分就更加清晰，对应模块的状态我们只需要修改相应模块文件即可。

还有一个坑要注意：模块默认是不带命名空间的，`moduleA` 里的 `addText` 会被注册到全局，两个模块起了同名的 mutation 就会互相覆盖，而且不报错，只是两个都被触发。解决办法是在模块里加一行 `namespaced: true`，之后调用要写成 `commit('moduleA/addText')`。新项目建议一开始就全开，省得后面回来改一遍调用点。

## 三、接口层封装成一个 Http 类

请求散在组件里是个慢性病。刚开始只是 `axios.get('/api/list')`，后来要加 token，要统一处理 401，要在 loading 期间禁用按钮，你就得挨个文件去改。

我们可以在 `src` 目录下新建 `services` 文件夹用于存放接口文件：

```
└── src
    └── services
        ├── http.js      # 接口封装
        ├── moduleA.js    # A模块接口
        └── moduleB.js    # B模块接口
```

`http.js` 是底座，它只关心「怎么发一个请求」，不关心业务：

```js
/* http.js */
import 'whatwg-fetch'

// HTTP 工具类
export default class Http {
    static async request(method, url, data) {
        const param = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (method === 'GET') {
            url += this.formatQuery(data)
        } else {
            param['body'] = JSON.stringify(data)
        }

        // Tips.loading(); // 可调用 loading 组件

        return fetch(url, param).then(response => this.isSuccess(response))
                .then(response => {
                    return response.json()
            })
    }

    // 判断请求是否成功
    static isSuccess(res) {
        if (res.status >= 200 && res.status < 300) {
            return res
        } else {
            this.requestException(res)
        }
    }

    // 处理异常
    static requestException(res) {
        const error = new Error(res.statusText)

        error.response = res

        throw error
    }
    
    // url处理
    static formatQuery(query) {
        let params = [];

        if (query) {
            for (let item in query) {
                let vals = query[item];
                if (vals !== undefined) {
                    params.push(item + '=' + query[item])
                }
            }
        }
        return params.length ? '?' + params.join('&') : '';
    }
    
    // 处理 get 请求
    static get(url, data) {
        return this.request('GET', url, data)
    }
    
    // 处理 put 请求
    static put(url, data) {
        return this.request('PUT', url, data)
    }
    
    // 处理 post 请求
    static post(url, data) {
        return this.request('POST', url, data)
    }
    
    // 处理 patch 请求
    static patch(url, data) {
        return this.request('PATCH', url, data)
    }
    
    // 处理 delete 请求
    static delete(url, data) {
        return this.request('DELETE', url, data)
    }
}
```

这段代码有几处值得停一下。

`isSuccess` 只把 2xx 当成功。这一步不能省，因为 `fetch` 的行为和 `XMLHttpRequest` 不一样，服务器返回 404 或者 500，`fetch` 的 Promise 依然是 resolve 的，只有网络层面彻底断了才会 reject。不自己判断 `status`，你会拿着一个 500 的响应体去 `response.json()`，然后收获一个莫名其妙的解析错误。

开头那句 `import 'whatwg-fetch'` 是 fetch 的 polyfill，2019 年还得考虑 IE 和一部分安卓机型。现在主流浏览器都原生支持了，新项目可以去掉，除非你的目标里还有 IE11。

`formatQuery` 这里有个隐患得提一句：它直接把值拼进 URL，没有做 `encodeURIComponent`。参数里一旦出现 `&`、`=` 或者中文，拼出来的 query string 就是错的。真正用的时候这行应该改成 `params.push(item + '=' + encodeURIComponent(vals))`。原文这段是从演示代码里来的，我把这个问题标在这里。

上层的业务接口文件就很薄了，只声明「有这么一个接口」：

```js
/* moduleA.js */
import Http from './http'

// 获取测试数据
export const getTestData = () => {
    return Http.get('https://api.github.com/repos/octokit/octokit.rb')
}
```

然后在项目页面中进行调用，会成功获取 `github` 返回的数据。但是一般我们在项目中配置接口的时候会直接省略项目 url 部分，比如：

```js
/* moduleA.js */
import Http from './http'

// 获取测试数据
export const getTestData = () => {
    return Http.get('/repos/octokit/octokit.rb')
}
```

### devServer 代理

写成相对路径之后问题就来了。这时候我们再次调用接口的时候会发现其调用地址为本地地址 `http://127.0.0.1:8080/repos/octokit/octokit.rb`，那么为了让其指向 `https://api.github.com`，我们需要在 `vue.config.js` 中进行 `devServer` 的配置：

```js
/* vue.config.js */

module.exports = {
    ...
    
    devServer: {
    
        // string | Object 代理设置
        proxy: {
        
            // 接口是 '/repos' 开头的才用代理
            '/repos': {
                target: 'https://api.github.com', // 目标地址
                changeOrigin: true, // 是否改变源地址
                // pathRewrite: {'^/api': ''}
            }
        },
    }
    
    ...
}
```

`changeOrigin: true` 这一行经常被忽略，但它是很多「本地代理配了却还是 403」的原因。它做的事是把转发出去的请求头里的 `Host` 改成目标服务器的域名。不少后端服务，尤其是走了网关或者带虚拟主机的，会按 `Host` 来路由，收到一个 `localhost:8080` 的 Host 直接就拒了。

被注释掉的 `pathRewrite` 用在前缀不一致的场景。比如你本地统一用 `/api` 开头做标记，但后端真实路径没有这一层，就写 `pathRewrite: { '^/api': '' }` 把它剥掉。

要记住的是，`devServer.proxy` 只在开发服务器上生效。打包出来的静态文件里没有代理这回事，生产环境的跨域得靠 nginx 转发或者后端开 CORS。这个错我见过不止一次，本地跑得好好的，一上测试环境全挂。

## 四、公共设施配置

最后我们项目开发中肯定需要对一些公共的方法进行封装使用，这里我把它称之为公共设施，那么我们可以在 `src` 目录下建一个 `common` 文件夹来存放其配置文件：

```
└── src
    └── common
        ├── index.js      # 公共配置入口
        ├── validate.js   # 表单验证配置
        └── other.js      # 其他配置
```

在入口文件中我们可以向外暴露其他功能配置的模块，比如：

```js
/* index.js */
import Validate from './validate'
import Other from './other'

export {
    Validate,
    Other,
}
```

这个 `index.js` 看着没什么技术含量，作用是给调用方一个稳定的入口。业务代码里只写 `import { Validate } from '@/common'`，具体是从哪个文件来的、后面文件拆分了没有，调用方不用关心。等某天 `validate.js` 涨到八百行需要拆成三个文件，你只改这一个入口就行。

这套目录约定的价值在于「新人进来知道东西该放哪」。`components` 放通用组件，`views` 放页面，`services` 放接口，`common` 放纯函数工具，`store` 放状态。约定本身怎么定其实没那么重要，重要的是定下来之后全组都遵守。

## 五、这套配置放到今天怎么写

得说清楚，上面这些是 2019 年 Vue CLI 3 时代的做法。这几年变化不小，一条条对照：

Vue CLI 目前已经进入维护状态，官方文档明确推荐新项目使用 Vite 搭配 `create-vue`。所以 `vue.config.js` 这个文件在新项目里不存在了，对应的是 `vite.config.js`。`devServer.proxy` 那套配置在 Vite 里叫 `server.proxy`，字段名和行为很接近，`target` 和 `changeOrigin` 都还在，迁移的时候基本能平移过去。

`publicPath` 在 Vite 里对应 `base`。路由懒加载不用再考虑 `require.ensure`，动态 `import()` 是 Vite 的原生能力，连魔法注释都不太需要，Vite 有自己的 chunk 命名策略。

Vue 2 已经在 2023 年底停止官方维护，新项目直接上 Vue 3。路由换成 Vue Router 4，`new Router({})` 改成 `createRouter({ history: createWebHistory() })`，`mode: 'history'` 这个字段没有了，模式变成了传入不同的 history 实现。状态管理官方推荐从 Vuex 换成 Pinia，`mutations` 这一层被彻底去掉了，直接在 action 里改 state，devtools 的追踪能力用别的方式补上。Vue 3 本身的写法变化我在 [Vue3基础入门](https://feinterview.poetries.top/blog/vue3-base) 里整理过。

但这不是说这篇就作废了。目录怎么分层、接口层为什么要抽一个 `Http` 类、`base` 和 history 模式的关系、代理为什么只在开发环境生效，这些判断跟构建工具是哪个没关系。工具换了一茬，要解决的问题还是同一批。

如果你的项目不是单页而是多页，也就是一个仓库里要打出好几个 html，配置的思路完全是另一套，得从入口和模板的批量生成开始。这部分我写在 [Vue CLI3之pages 构建多页应用](https://feinterview.poetries.top/blog/vue-muti-page-config) 里，和这篇是配套的。

## 总结

把这一圈过下来，几个能直接带走的结论：

- CLI 生成的 `router.js` 是 demo 级别的，上生产至少要补 `base`、路由模式和懒加载这三件事
- `base` 用 `process.env.BASE_URL` 取，跟着 `publicPath` 走，部署路径只改一处
- `history` 模式的干净 URL 是拿服务端配置换来的，nginx 那条 `try_files` 兜底规则必须配
- 懒加载优先用动态 `import()`，`require.ensure` 只在维护老代码时需要认识；魔法注释能让 chunk 有个人话名字
- Vuex 拆模块的时候顺手把 `namespaced: true` 开了，别等命名冲突了再回头改
- `fetch` 收到 404 和 500 也是 resolve 的，`Http` 类里那个 `isSuccess` 是必需品不是装饰
- `devServer.proxy` 只在开发服务器生效，生产的跨域是另一个问题
- 这套配置的工具链已经换代，但分层的判断依据没变

我的建议是新项目开工第一天就把这几个目录建好，哪怕里面还是空的。等业务代码堆到两百个文件再来分层，成本完全不是一个量级。

## 参考

- [Vue CLI 配置参考](https://cli.vuejs.org/zh/config/)
- [Vue Router 3 - 路由懒加载](https://v3.router.vuejs.org/zh/guide/advanced/lazy-loading.html)
- [Vue Router 3 - HTML5 History 模式](https://v3.router.vuejs.org/zh/guide/essentials/history-mode.html)
- [Vuex 3 - Module](https://v3.vuex.vuejs.org/zh/guide/modules.html)
- [Vite - 服务器选项](https://cn.vitejs.dev/config/server-options.html)
- [MDN - 使用 Fetch](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch)
- [前端进阶之旅](https://interview.poetries.top)
