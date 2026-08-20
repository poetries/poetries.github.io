---
title: vue-axios封装请求实战 拦截器与错误统一处理（十二）
description: 从 axios 基础用法讲到 Vue 项目里的完整请求封装，覆盖拦截器执行顺序、错误码统一处理、token 注入、取消请求、重复请求去重和超时重试，并标出 CancelToken 废弃后的新写法。
date: 2018-08-28 15:35:32
tags:
  - Vue
  - axios
  - HTTP
categories: Front-End
---

项目写到第三个页面的时候，你大概率会发现一件事：每个组件的 `created` 里都躺着一段几乎一样的代码。拼 baseURL、塞 token、`.then` 里判断后端返回的 code、`.catch` 里弹一个 toast。改一次错误提示文案要动十几个文件，加一个新的 401 处理逻辑更是灾难。这篇把 axios 在 Vue 项目里的封装从头捋一遍，先讲清楚基础 API 和拦截器的执行规则，再一步步搭出 `http.js` 加 `api.js` 这套结构，最后补上取消请求、重复请求去重、超时重试这三件老文章里没写、但真上线之后一定会遇到的事。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- axios 的能力边界，以及它和原生 fetch 的差别在哪
- 基础 API 速查，GET、POST、配置式调用、并发请求
- 拦截器的执行顺序，以及一个很多人踩过的注册顺序坑
- 请求方法封装，表单提交、文件上传、RESTful 四件套
- 错误统一处理，HTTP 状态码和业务 code 的两层分工
- `http.js` 加 `api.js` 的工程化目录，环境切换、超时、token 注入
- 取消请求，`CancelToken` 已废弃，现在用 `AbortController`
- 重复请求去重和超时重试的实现思路

## 一、axios 是什么

axios 是一个基于 Promise 的 HTTP 客户端，浏览器和 Node.js 里都能跑。它本身具有以下特征：

- 从浏览器中创建 `XMLHttpRequest`
- 从 Node.js 发出 http 请求
- 支持 Promise API
- 拦截请求和响应
- 转换请求和响应数据
- 取消请求
- 自动转换 JSON 数据
- 客户端支持防止 CSRF/XSRF

这份清单里，真正让它在 2018 年前后干掉 `vue-resource` 和手写 `XMLHttpRequest` 封装的，其实是中间那三条：拦截器、数据转换、取消请求。

先说结论，浏览器原生的 `fetch` 到今天也没把这几件事做好。`fetch` 拿不到上传进度，没有超时选项（得自己配 `AbortController` 加定时器），HTTP 404 和 500 不会走 reject 分支，需要你自己判断 `res.ok`，请求体和响应体都要手动 `JSON.stringify` 和 `res.json()`。axios 把这些琐事全包了，代价是多了十几 KB 的包体。业务项目里我一直选 axios，纯静态站或者只发一两个请求的场景才会考虑 `fetch`。

需要提前说明的是，这篇文章写于 2018 年，当时项目跑的是 axios 0.18 和 Vue 2。axios 现在已经到 1.x，绝大部分 API 保持兼容，少数几处有变化的地方我会在对应章节单独标出来。

## 二、基础 API 速查

axios 给每个 HTTP 方法都配了别名，参数结构分两类。`request`、`get`、`delete`、`head`、`options` 这一组没有请求体，第二个参数直接就是 config；`post`、`put`、`patch` 这一组有请求体，第二个参数是 data，第三个才是 config。

- `axios.request(config)`
- `axios.get(url[, config])`
- `axios.delete(url[, config])`
- `axios.head(url[, config])`
- `axios.options(url[, config])`
- `axios.post(url[, data[, config]])`
- `axios.put(url[, data[, config]])`
- `axios.patch(url[, data[, config]])`

这个参数位置的差异是新手最容易翻车的地方。写 `axios.get('/user', { id: 1 })` 拿不到参数，因为第二个位置是 config，`id` 不是 config 的合法字段，直接被丢掉了。

### 2.1 GET 请求

query 参数有两种写法，直接拼在 URL 上，或者交给 `params` 让 axios 帮你序列化。

```javascript
// 向具有指定ID的用户发出请求
axios.get('/user?ID=12345')
.then(function (res) {
    console.log(res);
})
.catch(function (error) {
    console.log(error);
});

// 也可以通过 params 对象传递参数
axios.get('/user', {
    params: {
        ID: 12345
    }
})
.then(function (response) {
    console.log(response);
})
.catch(function (error) {
    console.log(error);
});
```

优先用 `params`。它会自动做 `encodeURIComponent`，中文和特殊字符不用你操心，值是 `undefined` 的字段还会被跳过，不会拼出 `?name=undefined` 这种脏 URL。手动拼字符串则要自己处理这些边界。

`params` 遇到数组时默认序列化成 `ids[]=1&ids[]=2`，如果后端要的是 `ids=1,2` 或者 `ids=1&ids=2`，就得传 `paramsSerializer` 自己接管这一步。这个我踩过，前后端联调时对着 Network 面板看了半天才反应过来是数组格式对不上。

### 2.2 POST 请求

POST 的 data 在第二个参数，config 在第三个。

```javascript
axios.post('/user', {
    userId: "123"
}, {
    headers: {
        token: "abc"
    }
})
.then(function (res) {
    console.log(res);
})
.catch(function (error) {
    console.log(error);
});
```

传对象时 axios 会自动 `JSON.stringify` 并把 `Content-Type` 设成 `application/json`。如果后端要的是表单格式，那就得自己转，第五节会讲。

### 2.3 配置式调用

`axios(config)` 是最原始的形态，上面那些别名都是它的语法糖。GET 请求发送参数在 `params` 中定义，POST 请求发送的是 request body，需要在 `data` 中定义。

```javascript
// get 在params中定义
axios({
    url: "package.json",
    method: "get",
    params: {
        userId: "123"
    },
    headers: {
        token: "http-test"
    }
}).then(res => {
    console.log(res.data);
})

// post 在data中定义
axios({
    url: "package.json",
    method: "post",
    data: {
        userId: "123"
    },
    headers: {
        token: "http-test"
    }
}).then(res => {
    console.log(res.data);
})
```

原文这两处 URL 写的是 `pakage.json`，少了一个 `c`，顺手改成 `package.json`。

配置式写法在封装的时候更好用，因为整个请求就是一个纯对象，可以拼、可以透传、可以存进配置表。后面封装 `postRequest`、`putRequest` 的时候用的都是这种形式。

## 三、并发请求

有些页面进来要同时拉几份数据，比如用户信息和用户权限，两个接口互不依赖，串行发就是白白多等一个 RTT。

```javascript
function getUserAccount() {
    // 返回一个promise对象
    return axios.get("/user/1234");
}
function getUserPermissions() {
    // 返回一个promise对象
    return axios.get("/user/1234/getUserPermissions");
}

// 一次性返回两个接口
axios.all([getUserAccount(), getUserPermissions()]).then(axios.spread((acct, perms) => {
    // spread展开两个返回的结果
    // 两个请求现已完成
}))
```

原文这段的函数定义写的是 `getUserAcount` 和 `getUserPermissions`，调用处却写成了 `getUserAccount` 和 `getUserPerssions`，两处都对不上，跑起来直接是 `is not defined`，上面已经改一致了。

`axios.all` 和 `axios.spread` 现在被官方标记为废弃，推荐直接用原生的 `Promise.all`，写出来其实更短：

```javascript
const [acct, perms] = await Promise.all([
  getUserAccount(),
  getUserPermissions()
])
```

这里有个坑要注意。`Promise.all` 是全有或全无，任何一个请求失败，整个 `await` 就抛错，前面已经成功的那份数据你也拿不到。如果页面上这两块内容可以独立降级，改用 `Promise.allSettled`，它会等所有请求都有结果，返回一个带 `status` 字段的数组，你再逐个判断。

## 四、拦截器

拦截器是 axios 相对手写封装最大的价值点。它在请求真正发出去之前、和响应交给业务代码之前各插了一个口子，所有请求的公共逻辑都可以收在这两个口子里。

```javascript
new Vue({
    el: "#app",
    data: {
        msg: ""
    },
    // 初始化生命周期的一个函数
    mounted: function () {
        // 拦截请求之前
        axios.interceptors.request.use(config => {
            // 这里做一些拦截操作,拦截用户的请求 请求之前做一些loading处理
            return config;
        })
        // 拦截响应之后处理
        axios.interceptors.response.use(response => {
            // 这里做一些拦截操作,响应以后做什么，在返回数据
            return response;
        })
    },

    methods: {
        get: function () {

        },
        post: function () {

        }
    }
})
```

这段演示代码把 `interceptors.use` 写在了组件的 `mounted` 里，只是为了让例子跑起来看效果。真实项目千万别这么写，`mounted` 每次进入页面都会执行一次，拦截器会一层层叠加上去，同一个响应被处理十几遍。拦截器要注册在应用初始化的地方，全局只跑一次。

### 4.1 执行顺序

拦截器可以注册多个，但两条链的执行顺序不一样。请求拦截器是后注册的先执行，响应拦截器是先注册的先执行。

```javascript
axios.interceptors.request.use(cfg => { console.log('req A'); return cfg })
axios.interceptors.request.use(cfg => { console.log('req B'); return cfg })
axios.interceptors.response.use(res => { console.log('res A'); return res })
axios.interceptors.response.use(res => { console.log('res B'); return res })

// 打印顺序：req B -> req A -> res A -> res B
```

axios 内部是把请求拦截器 `unshift` 到 promise 链前面、把响应拦截器 `push` 到链后面的，所以就成了这个像洋葱一样的顺序。平时只注册一个的时候感觉不到，一旦你在业务层又加了一个埋点拦截器，顺序问题就会冒出来。

注册返回的是一个 id，需要的时候可以摘掉：

```javascript
const id = axios.interceptors.request.use(fn)
axios.interceptors.request.eject(id)
```

### 4.2 别污染全局

`axios.interceptors` 改的是全局默认实例。如果你的项目要同时调两套后端（比如自家网关和第三方开放平台），token 格式、错误码约定都不一样，全局拦截器就会互相打架。这种时候用 `axios.create()` 各建一个实例，拦截器各挂各的：

```javascript
export const gateway = axios.create({ baseURL: '/api', timeout: 10000 })
export const openApi = axios.create({ baseURL: 'https://open.example.com' })

gateway.interceptors.request.use(injectToken)
```

我自己的习惯是永远不用 `axios.xxx` 直接发请求，项目里只导出实例。这样以后要加第二套后端，改动量接近于零。

## 五、请求封装与异常统一处理

Vue 中采用 axios 处理网络请求，为了避免请求接口的重复代码，以及各种网络情况造成的异常判断散落各处，通常会做一层请求封装加异常拦截。

### 5.1 axios 请求封装

下面这套是按 HTTP 动词封装的一组函数。它解决的问题是：后端接口要的是 `application/x-www-form-urlencoded` 表单格式，而 axios 默认发 JSON，每个调用点都手写一次 `transformRequest` 太啰嗦，索性收到一个地方。

```javascript
//  引入axios文件包
import axios from 'axios'

// 把对象序列化成 a=1&b=2 的表单格式
const toFormUrlEncoded = (data) => {
  let ret = ''
  for (let it in data) {
    ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
  }
  return ret
}

// POST 方法封装  (参数处理)
export const postRequest = (url, params) => {
  return axios({
    method: 'post',
    url: url,
    data: params,
    transformRequest: [toFormUrlEncoded],
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

// PUT 方法封装
export const putRequest = (url, params) => {
  return axios({
    method: 'put',
    url: url,
    data: params,
    transformRequest: [toFormUrlEncoded],
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}
```

原文里 `postRequest` 和 `putRequest` 各抄了一份一模一样的 `transformRequest` 函数体，上面提成了 `toFormUrlEncoded` 复用。这个函数是最朴素的写法，遇到嵌套对象、数组、`null` 都会拼出奇怪的结果，生产环境更推荐直接用 `qs.stringify(params)`，它把这些边界都处理好了。

剩下三个方法就简单了。文件上传要改 `Content-Type`，GET 和 DELETE 没有请求体：

```javascript
// POST 方法封装  (文件上传)
export const uploadFileRequest = (url, params) => {
  return axios({
    method: 'post',
    url: url,
    data: params,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

//  GET 方法封装
export const getRequest = (url) => {
  return axios({
    method: 'get',
    url: url
  });
}

//  DELETE 方法封装
export const deleteRequest = (url) => {
  return axios({
    method: 'delete',
    url: url
  });
}
```

文件上传这块补一句。`data` 传的必须是 `FormData` 实例，而且 `Content-Type` 那行其实可以不写。浏览器在发送 `FormData` 时会自动带上 `multipart/form-data` 并附一个随机 boundary，手动写死反而会丢掉 boundary 导致后端解析失败。手写这个 header 只在 Node 环境或者你自己拼 boundary 的时候才有意义。

### 5.2 请求异常统一处理

错误处理其实分两层，很多人一开始会把它们搅在一起。第一层是 HTTP 层，服务器返回了 4xx 或 5xx，axios 会走 reject，错误对象上有 `error.response`；第二层是业务层，HTTP 明明是 200，但后端在 body 里塞了一个 `code` 表示业务失败，比如未登录、余额不足。这两层要分开处理。

先看业务层，走的是响应拦截器的成功回调：

```javascript
import axios from 'axios'
import { Message } from 'element-ui'

axios.interceptors.response.use(response => {
    // 注意：这里的 response 是完整响应对象，业务数据在 response.data 里
    const data = response.data

    switch (data.code) {
        case '0':
            // exp: 修复iPhone 6+ 微信点击返回出现页面空白的问题
            if (isIOS()) {
                // 异步以保证数据已渲染到页面上
                setTimeout(() => {
                    // 通过滚动强制浏览器进行页面重绘
                    document.body.scrollTop += 1
                }, 0)
            }
            // 这一步保证数据返回，没有 return 会继续往下走
            return response

        // 需要重新登录
        case 'SHIRO_E5001':
            if (isWeChat() && IS_PRODUCTION) {
                axios.get(apis.common.wechat.authorizeUrl).then(({ result }) => {
                    location.replace(decodeURIComponent(result))
                })
            } else {
                location.replace('/user/login')
            }
            // 不显示提示消息
            data.description = ''
            break

        default:
    }

    // 不是正确的 code，抛出错误交给调用方的 catch
    const err = new Error(data.description)
    err.data = data
    err.response = response
    return Promise.reject(err)
})
```

原文这段有三处站不住的地方，上面一并改了。第一，拦截器成功回调拿到的参数是完整的响应对象，业务字段在 `response.data` 里，原文直接读 `data.code` 会永远是 `undefined`，所有分支都走不进去。第二，`err.response = response` 里的 `response` 在原文作用域中根本没定义，直接报错。第三，构造完 `err` 之后原文没有把它抛出去，业务侧感知不到失败。

原文还有一段「第二种方式，仅对 200 和 error 状态处理」的分支，逻辑和上面的 switch 重叠，混在一个拦截器里会互相干扰，这里去掉了，思路可以理解成同一件事的简化版：

```javascript
// 简化版：不约定业务 code，只看 data.status
if (response.status === 200 && response.data.status === 'error') {
  Message.error({ message: response.data.msg })
  return Promise.reject(new Error(response.data.msg))
}
```

再看 HTTP 层，走的是失败回调。这里把状态码映射成人能看懂的中文：

```javascript
axios.interceptors.response.use(null, err => {
   if (err && err.response) {
        switch (err.response.status) {
            case 400: err.message = '请求错误(400)'; break;
            case 401: err.message = '未授权，请重新登录(401)'; break;
            case 403: err.message = '拒绝访问(403)'; break;
            case 404: err.message = '请求出错(404)'; break;
            case 408: err.message = '请求超时(408)'; break;
            case 500: err.message = '服务器错误(500)'; break;
            case 501: err.message = '服务未实现(501)'; break;
            case 502: err.message = '网络错误(502)'; break;
            case 503: err.message = '服务不可用(503)'; break;
            case 504: err.message = '网络超时(504)'; break;
            case 505: err.message = 'HTTP版本不受支持(505)'; break;
            default: err.message = `连接出错(${err.response.status})!`;
        }
    } else {
        err.message = '连接服务器失败!'
    }
  Message.error({ message: err.message })
  return Promise.reject(err);
})
```

原文这里写的是 `Message.err(...)`，element-ui 上没有这个方法，正确的是 `Message.error(...)`，改掉了。

### 5.3 resolve 还是 reject

原文在这里留了一句很关键的话：请求出错的时候执行的是 `Promise.resolve(err)` 而不是 `Promise.reject(err)`，这样无论请求成功还是失败，在成功的回调中都能收到通知。

这个做法我理解它的动机。业务代码写起来确实省事，不用每个调用点都挂 `.catch`，也不会因为漏了 `catch` 触发一堆 `Unhandled Promise Rejection` 的控制台警告。

但代价是真实存在的。

一旦对失败也 resolve，`.then` 里拿到的可能是数据，也可能是一个 Error 对象，调用方每次都得先判断一下这是成功还是失败，判断逻辑又散回到了各个组件里，绕了一圈回到原点。更麻烦的是 `async/await` 场景，`try/catch` 彻底失效，因为压根没有异常抛出来。

我现在的做法是失败一律 `Promise.reject`，然后在拦截器里就把提示弹掉。业务侧不关心失败的场景直接不写 `catch`，为了消掉控制台警告，在封装层统一挂一个空的兜底 `catch`，或者约定所有调用都走 `await`。要一个「不抛异常」的版本，可以额外导出一个把结果包成 `[err, data]` 元组的辅助函数，让调用方按需选择，而不是把整个应用的错误语义都改掉。

不是说 `Promise.resolve(err)` 这条路不行，而是它把「成功」和「失败」两种语义压进了同一个通道，项目大了之后维护成本会显现出来。

### 5.4 在 Vue 项目中使用

在 `main.js` 中导入所有请求方法：

```javascript
//  导入所有请求方法
import { getRequest, postRequest, deleteRequest, putRequest } from './utils/api'
```

将请求方法添加至 `Vue.prototype` 上：

```javascript
//  向VUE的原型上添加请求方法
Vue.prototype.getRequest = getRequest;
Vue.prototype.postRequest = postRequest;
Vue.prototype.deleteRequest = deleteRequest;
Vue.prototype.putRequest = putRequest;
```

之后任意组件里 `this.postRequest(...)` 就能发请求了：

```javascript
//  发送网络请求
this.postRequest('/login', { userName, password }).then(resp => {
    // ...
});
```

原文这段的对象字面量里用了中文逗号 `{userName，password}`，而且尾部多了一个花括号，语法过不了，上面改成了 ASCII 逗号并补齐了括号。

挂 `Vue.prototype` 这个做法在 Vue 2 时代很常见，好处是模板和方法里随手可用。它的代价是 IDE 不认识这些属性，没有类型提示，TypeScript 项目还得手动扩展 `ComponentCustomProperties` 接口。Vue 3 里 `Vue.prototype` 已经没有了，对应的是 `app.config.globalProperties`。我现在更倾向于哪里用哪里 `import`，显式依赖比全局挂载好排查。

## 六、工程化封装 http.js 加 api.js

上面那套按动词封装解决了「怎么发」，但没解决「发给谁」。接口地址散在各个组件里，后端改一次路径你得全局搜索。这一节把结构再往前推一步。

我的习惯是在项目的 `src` 目录中新建一个 `request` 文件夹，里面放 `http.js` 和 `api.js`。`http.js` 封装 axios 本身，`api.js` 统一管理接口。业务组件只 import `api.js`，不碰 axios。

```javascript
// 在http.js中引入axios
import axios from 'axios'; // 引入axios
import QS from 'qs'; // 引入qs模块，用来序列化post类型的数据
// vant的toast提示框组件，大家可根据自己的ui组件更改
import { Toast } from 'vant';
```

### 6.1 环境切换

项目环境通常有开发、测试、生产三套，接口前缀各不相同。通过 Node 的环境变量匹配默认的 URL 前缀，`axios.defaults.baseURL` 可以设置 axios 的默认请求地址。

```javascript
// 环境的切换
if (process.env.NODE_ENV == 'development') {
  axios.defaults.baseURL = 'https://www.baidu.com';
} else if (process.env.NODE_ENV == 'debug') {
  axios.defaults.baseURL = 'https://www.ceshi.com';
} else if (process.env.NODE_ENV == 'production') {
  axios.defaults.baseURL = 'https://www.production.com';
}
```

这种 if-else 写法在 2018 年很主流，现在一般换成 `.env` 文件。Vue CLI 里建 `.env.development` 和 `.env.production`，Vite 里同理，变量名带 `VUE_APP_` 或 `VITE_` 前缀才会被注入，然后一行搞定：

```javascript
axios.defaults.baseURL = process.env.VUE_APP_BASE_API
```

好处是加一套环境不用改代码，而且构建工具会做静态替换，没用到的分支能被摇掉。

### 6.2 超时和请求头

通过 `axios.defaults.timeout` 设置默认的请求超时时间。超过设定值就会告知用户当前请求超时。

```javascript
axios.defaults.timeout = 10000;
```

10 秒是个偏保守的值。要注意 axios 的 `timeout` 计时的是从请求发出到响应完整返回的整个过程，包含服务端处理时间。导出报表、批量提交这类接口本来就慢，别用全局值卡死它们，单独在那次调用的 config 里放大 `timeout` 就行。

超时触发时 axios 抛出的错误没有 `error.response`，只能靠 `error.code` 判断。axios 1.x 里超时的 code 是 `ECONNABORTED`，开启 `transitional.clarifyTimeoutError` 之后会变成 `ETIMEDOUT`，具体以官方文档为准。

POST 请求头也可以做一个默认设置：

```javascript
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
```

原文这一行末尾被截断成了 `application/x-www-form-urlencode`，且没有闭合引号，补全了。

### 6.3 请求拦截，注入 token

发送请求前做拦截，是为了处理那些每个请求都要做一遍的事。最典型的就是携带登录态，其次是 POST 数据的序列化。

```javascript
// 先导入vuex,因为我们要使用到里面的状态对象
// vuex的路径根据自己的路径去写
import store from '@/store/index';

// 请求拦截器
axios.interceptors.request.use(
  config => {
    // 每次发送请求之前判断vuex中是否存在token
    // 如果存在，则统一在http请求的header都加上token，这样后台根据token判断你的登录情况
    // 即使本地存在token，也有可能token是过期的，所以在响应拦截器中要对返回状态进行判断
    const token = store.state.token;
    token && (config.headers.Authorization = token);
    return config;
  },
  error => {
    return Promise.reject(error);
  }
)
```

原文这段有两个问题。一是 `// 请求拦截器axios.interceptors.request.use(` 把注释和代码写在了同一行，后面的整个调用都被注释掉了；二是错误回调里写的是 `Promise.error(error)`，Promise 上没有 `error` 这个静态方法，正确的是 `Promise.reject(error)`。都改了。

完整的登录态流程是这样：登录成功后把 token 通过 `localStorage` 或 cookie 存在本地，用户每次进入页面时（在 `main.js` 里）先从本地存储读 token，存在就说明登录过，更新 Vuex 里的 token 状态。之后每次请求都在 header 中携带 token，后端根据它判断登录是否过期。

这时候可能有人会问，不需要登录就能访问的页面也带 token，会不会有问题？其实不会，前端可以一律携带，后端选择不校验就行。真要区分，在 config 上加一个自定义标记，拦截器里判断一下跳过注入，比维护一张白名单 URL 表要省事。

顺带说下 token 放在哪。`localStorage` 会被 XSS 直接读走，`HttpOnly` 的 cookie 读不到但要处理 CSRF。这两条路都没有绝对安全，选哪条取决于你的后端配合方式，不是前端能单方面拍板的事。

### 6.4 响应拦截，登录过期与错误提示

响应拦截器就是在数据交给业务代码之前做一层处理。下面这版按 HTTP 状态码分发，401 跳登录，403 清 token 后跳登录，404 提示网络请求不存在：

```javascript
// 响应拦截器
axios.interceptors.response.use(
  response => {
    // 状态码 2xx 才会进这个回调
    if (response.status === 200) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(response);
    }
  },
  error => {
    if (!error.response) {
      // 断网、跨域被拦、请求被取消，都没有 response
      Toast({ message: '网络连接异常', duration: 1500 });
      return Promise.reject(error);
    }
    switch (error.response.status) {
      // 401: 未登录，跳转登录页并携带当前页面路径
      case 401:
        router.replace({
          path: '/login',
          query: { redirect: router.currentRoute.fullPath }
        });
        break;
      // 403: token 过期，清本地 token 和 vuex 再跳登录
      case 403:
        Toast({ message: '登录过期，请重新登录', duration: 1000, forbidClick: true });
        localStorage.removeItem('token');
        store.commit('loginSuccess', null);
        setTimeout(() => {
          router.replace({
            path: '/login',
            query: { redirect: router.currentRoute.fullPath }
          });
        }, 1000);
        break;
      // 404: 请求不存在
      case 404:
        Toast({ message: '网络请求不存在', duration: 1500, forbidClick: true });
        break;
      // 其他错误，直接抛出错误提示
      default:
        Toast({ message: error.response.data.message, duration: 1500, forbidClick: true });
    }
    return Promise.reject(error.response);
  }
);
```

原文的失败回调里第一句是 `if (error.response.status)`，断网的时候 `error.response` 是 `undefined`，这一句直接抛 `Cannot read property 'status' of undefined`，真正的网络错误反而被一个更莫名其妙的错误盖住了。上面把这个判断挪到最前面单独处理。

另外那个 `default` 分支读的是 `error.response.data.message`，如果后端 500 时返回的是一段 HTML 错误页，`data` 就是字符串，`.message` 又是 `undefined`，toast 弹出来一片空白。这种地方最好加个兜底文案。

上面的 `Toast()` 用的是 vant 的轻提示组件，换成你项目里的 UI 库对应组件即可。

401 跳登录这里还有个实际问题：一个页面同时发了五个请求，全都 401，那就会连续 replace 五次路由，还弹五个 toast。解决办法是加一个模块级的标志位，第一次进入 401 分支就置 true 并跳转，后续请求直接 reject 掉不做任何提示，跳转完成后再复位。这个坑我排查了一下午才定位到，Network 面板里看着一切正常，问题只出在时序上。

### 6.5 封装 get 和 post

为了简化调用，再对 get 和 post 做一层薄封装。get 函数接收 url 和参数对象，返回 Promise，请求成功时 resolve 服务端返回值，失败时 reject。

```javascript
/**
 * get方法，对应get请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 */
export function get(url, params) {
  return new Promise((resolve, reject) => {
    axios.get(url, { params })
      .then(res => resolve(res.data))
      .catch(err => reject(err));
  });
}
```

post 的原理和 get 基本一样，区别在于 post 需要对提交的参数对象做序列化，这里用 qs 模块。如果后端要的是表单格式，没有这一步是拿不到数据的。

```javascript
/**
 * post方法，对应post请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 */
export function post(url, params) {
  return new Promise((resolve, reject) => {
    axios.post(url, QS.stringify(params))
      .then(res => resolve(res.data))
      .catch(err => reject(err));
  });
}
```

原文这两个函数的 `catch` 里写的是 `reject(err.data)`。这里有个隐蔽的问题：axios 抛出的 error 对象上并没有 `data` 属性，业务数据在 `err.response.data` 上，所以 `reject(err.data)` 永远 reject 一个 `undefined`，调用方的 `catch(e => ...)` 拿到的是空值，什么都排查不了。上面改成直接 reject 原始 error。

再往前一步说，这两个函数其实是典型的 Promise 反模式。`axios.get()` 本来就返回 Promise，外面再套一层 `new Promise` 属于多余，而且套这一层之后 `AbortController` 的取消信号也传不进来。更干净的写法是：

```javascript
export const get = (url, params) => axios.get(url, { params }).then(res => res.data)
export const post = (url, params) => axios.post(url, QS.stringify(params)).then(res => res.data)
```

`axios.get()` 和 `axios.post()` 在提交数据时参数的书写方式是有区别的。get 的第二个参数是一个对象，参数放在这个对象的 `params` 属性里；post 的第二个参数直接就是参数对象。这一点前面第二节讲过，这里再强调一次，因为它是最高频的出错点。

### 6.6 api 的统一管理

先在 `api.js` 中引入封装好的 get 和 post：

```javascript
/**
 * api接口统一管理
 */
import { get, post } from './http'

export const apiAddress = param => post('api/v1/users', param)
```

页面中这样调用：

```javascript
import { apiAddress } from '@/request/api'; // 导入我们的api接口

export default {
  name: 'Address',
  created () {
    this.onLoad();
  },
  methods: {
    // 获取数据
    onLoad() {
      // 调用api接口，并且提供了两个参数
      apiAddress({
        type: 0,
        sort: 1
      }).then(res => {
        // 获取数据成功后的其他操作
      })
    }
  }
}
```

这个设计是真的舒服。组件里看不到任何 URL 字符串，接口改路径只改 `api.js` 一行；接口名是有语义的函数名，IDE 能跳转能补全；哪个接口被哪些页面用了，全局搜函数名就有答案。项目大了之后可以按业务域拆成 `api/user.js`、`api/order.js`，再在 `api/index.js` 里汇总导出。

### 6.7 完整封装代码

把前面几段拼起来，就是 `http.js` 的完整形态。先是配置和请求拦截：

```javascript
/**
 * axios封装
 * 请求拦截、响应拦截、错误统一处理
 */
import axios from 'axios';
import QS from 'qs';
import { Toast } from 'vant';
import store from '../store/index';
import router from '../router';

// 环境的切换
if (process.env.NODE_ENV === 'development') {
  axios.defaults.baseURL = '/api';
} else if (process.env.NODE_ENV === 'debug') {
  axios.defaults.baseURL = '';
} else if (process.env.NODE_ENV === 'production') {
  axios.defaults.baseURL = 'http://api.123dailu.com/';
}

// 请求超时时间
axios.defaults.timeout = 10000;

// post请求头
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';

// 请求拦截器
axios.interceptors.request.use(
  config => {
    const token = store.state.token;
    token && (config.headers.Authorization = token);
    return config;
  },
  error => Promise.reject(error)
);
```

然后是响应拦截和两个方法导出：

```javascript
// 响应拦截器
axios.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      Toast({ message: '网络连接异常', duration: 1500 });
      return Promise.reject(error);
    }
    switch (error.response.status) {
      case 401:
        router.replace({ path: '/login', query: { redirect: router.currentRoute.fullPath } });
        break;
      case 403:
        Toast({ message: '登录过期，请重新登录', duration: 1000, forbidClick: true });
        localStorage.removeItem('token');
        store.commit('loginSuccess', null);
        setTimeout(() => {
          router.replace({ path: '/login', query: { redirect: router.currentRoute.fullPath } });
        }, 1000);
        break;
      case 404:
        Toast({ message: '网络请求不存在', duration: 1500, forbidClick: true });
        break;
      default:
        Toast({ message: error.response.data.message || '请求失败', duration: 1500 });
    }
    return Promise.reject(error.response);
  }
);

export const get = (url, params) => axios.get(url, { params }).then(res => res.data);
export const post = (url, params) => axios.post(url, QS.stringify(params)).then(res => res.data);
```

原文的这段完整代码在流传过程中被某个格式化工具搅坏了，箭头函数全变成了 `config = > {`，`export function` 被断成两行，`.catch` 被拆成 `. catch (`，直接复制过去是跑不起来的。上面重新整理了一遍，同时把 `router` 的 import 补上（原文用了 `router.replace` 却没有引入），逻辑和原意没有改动。

## 七、取消请求

搜索框输入联想、Tab 快速切换、列表分页连点，这几个场景都会连着发出多个请求，而且返回顺序不保证。你输入「vue」发了三个请求，最后回来的可能是「vu」的结果，页面上显示的就是错的数据。这类问题叫竞态，解决办法是发新请求前把旧的取消掉。

2018 年的写法是 `CancelToken`：

```javascript
const CancelToken = axios.CancelToken
const source = CancelToken.source()

axios.get('/search', { params: { q }, cancelToken: source.token })
  .catch(err => {
    if (axios.isCancel(err)) {
      // 被主动取消，不做提示
      return
    }
    throw err
  })

// 发下一个请求之前
source.cancel('取消上一次搜索')
```

`CancelToken` 从 axios 0.22.0 起被标记为废弃，官方推荐改用浏览器原生的 `AbortController`，具体的移除计划以官方文档为准。新写法长这样：

```javascript
let controller = null

function search(q) {
  // 取消上一次还在飞的请求
  if (controller) controller.abort()
  controller = new AbortController()

  return axios.get('/search', {
    params: { q },
    signal: controller.signal
  }).catch(err => {
    if (axios.isCancel(err)) return
    throw err
  })
}
```

`AbortController` 的好处是它是 Web 标准，`fetch`、`addEventListener` 都认这个 signal，不是 axios 私有的东西。判断是否为取消错误继续用 `axios.isCancel(err)`，这个 API 对两种方式都适用。

这里有个必须注意的点：被取消的请求走的是 reject 分支，如果你的响应拦截器里无脑弹 toast，用户每敲一个字就会看到一个「网络连接异常」。所以拦截器的错误回调开头就要先判断 `axios.isCancel`，是取消就静默返回。

Vue 组件卸载时也应该把未完成的请求取消掉，在 `beforeDestroy`（Vue 3 是 `onUnmounted`）里调 `controller.abort()`，否则响应回来时组件已经没了，`this.list = res.data` 这类赋值会报错或者引发内存泄漏。

## 八、重复请求去重

跟取消请求相邻但不完全相同的一个问题：用户手抖，提交按钮连点三下，同一个订单被创建了三次。按钮加 loading 能挡住大部分情况，但页面上有好几个入口触发同一个接口时就挡不住了，更彻底的做法是在请求层做去重。

思路是维护一张「进行中的请求」表，key 由 method、url、参数拼出来。发请求前先查表，命中就把老的取消掉（或者直接复用老的 Promise），请求结束时从表里删掉。

```javascript
const pending = new Map()

const genKey = config => [
  config.method,
  config.url,
  JSON.stringify(config.params || {}),
  JSON.stringify(config.data || {})
].join('&')

axios.interceptors.request.use(config => {
  const key = genKey(config)
  if (pending.has(key)) {
    // 策略一：取消前一个，保留最新的（适合搜索、筛选）
    pending.get(key).abort()
  }
  const controller = new AbortController()
  config.signal = controller.signal
  pending.set(key, controller)
  return config
})

axios.interceptors.response.use(
  res => {
    pending.delete(genKey(res.config))
    return res
  },
  err => {
    if (err.config) pending.delete(genKey(err.config))
    return Promise.reject(err)
  }
)
```

这里的策略要按场景选。搜索、筛选这类「只要最新结果」的，取消旧的留新的；提交订单、支付这类「只能成功一次」的，反过来，丢弃新的、复用旧的那个 Promise 更合适。

说实话我也没完全跑通所有边界，比如 `FormData` 作为 data 时 `JSON.stringify` 出来是 `{}`，两个不同文件的上传请求会被误判成重复。真上生产之前，key 的生成规则要按自己项目的接口特点再打磨一轮。

## 九、超时重试

移动端弱网下偶发超时是常态，一次失败就报错给用户体验很差。重试的实现可以挂在响应拦截器的错误回调里：

```javascript
axios.interceptors.response.use(null, async err => {
  const config = err.config
  // 没有 config 说明错误发生在请求发出之前，没法重试
  if (!config || !config.retry) return Promise.reject(err)
  // 只重试超时和网络错误，业务错误重试没有意义
  const retriable = !err.response || err.code === 'ECONNABORTED'
  if (!retriable) return Promise.reject(err)

  config.__retryCount = config.__retryCount || 0
  if (config.__retryCount >= config.retry) return Promise.reject(err)
  config.__retryCount += 1

  // 指数退避，第 n 次等 2^n * 300ms
  const delay = Math.pow(2, config.__retryCount) * 300
  await new Promise(resolve => setTimeout(resolve, delay))
  return axios(config)
})
```

有三条边界一定要守住。

只重试幂等请求。GET 重试没关系，POST 创建订单重试就可能建出两单，所以上面用 `config.retry` 做开关，需要重试的接口自己声明，而不是全局默认打开。业务错误（后端明确返回 4xx）也不该重试，重试一百次结果还是一样。

重试要有退避。失败了立刻重发，只会在服务端已经过载的时候雪上加霜，等待时间按次数指数增长是更友好的做法。

重试次数要和 `timeout` 一起算。单次超时 10 秒、重试 3 次，最坏情况用户要等 30 多秒才看到错误提示，这时候不如把单次 timeout 调短一点。

不想自己写的话，社区有 `axios-retry` 这个插件，配置项覆盖了重试次数、退避策略和判断条件，成熟度比手写的高。

## 十、这套封装和 Vue 生态的衔接

请求封装不是孤立的一层，它和路由、状态管理是咬在一起的。拦截器里的 401 跳转要用到路由实例，token 要从 store 里读，登录过期还要清 store。这几块的写法我在同系列的 [vue-router 路由管理](https://feinterview.poetries.top/blog/vue-router) 和 [vue 状态管理之 vuex](https://feinterview.poetries.top/blog/vue-vuex) 里分别写过，配合着看会更完整。

另外，本地开发时接口跨域怎么配代理、按需加载、打包体积这些工程问题，整理在了 [vue 项目中的痛点](https://feinterview.poetries.top/blog/vue-project-dev-question) 那篇。

## 总结

回到开头那个「每个组件里都有一段重复请求代码」的问题，这一圈下来，我的结论是这样：

- 参数位置是最高频的低级错误，`get` 的第二个参数是 config，`post` 的第二个参数是 data
- 拦截器要注册在应用初始化处，只跑一次；多套后端就用 `axios.create()` 分实例，别污染全局
- 错误分两层，HTTP 层看 `error.response`，业务层看 `response.data.code`，别混着写
- 失败建议一律 `Promise.reject`，用 resolve 兜住失败会让成功和失败共用一个通道，后期很难维护
- `http.js` 管连接，`api.js` 管接口清单，组件里不出现任何 URL 字符串
- 取消请求现在用 `AbortController`，`CancelToken` 已废弃；拦截器错误回调开头要先 `axios.isCancel` 放行
- 去重和重试都要按接口幂等性区别对待，全局一刀切会出事

老文里那套 `Vue.prototype` 挂载、`Promise.error`、`err.data` 的写法都有各自的历史原因，看懂它们为什么这么写，比直接抄一份新版模板更有价值。

## 参考

- [axios 官方文档](https://axios-http.com/zh/docs/intro)
- [axios 取消请求](https://axios-http.com/zh/docs/cancellation)
- [MDN AbortController](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortController)
- [MDN Promise.allSettled](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
- [axios-retry GitHub](https://github.com/softonic/axios-retry)
- [qs GitHub](https://github.com/ljharb/qs)
- [前端进阶之旅](https://interview.poetries.top)
