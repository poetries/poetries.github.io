---
title: 使用umi改进dva项目开发
date: 2018-09-07 20:10:23
tags: 
  - Dva
  - Umi
categories: Front-End
---


# 一、Umi简介

> 一个可插拔的企业级 `react` 应用框架。`umi` 以路由为基础的，以及各种进阶的路由功能，并以此进行功能扩展，比如支持路由级的按需加载。然后配以完善的插件体系，覆盖从源码到构建产物的每个生命周期


## 1.1 特性

- 开箱即用，内置 `react`、`react-router` 等
- 支持配置的路由方式
- 完善的插件体系，覆盖从源码到构建产物的每个生命周期
- 高性能，通过插件支持 `PWA`、以路由为单元的 `code splitting` 等
- 支持静态页面导出，适配各种环境，比如中台业务、无线业务、egg、支付宝钱包、云凤蝶等
- 开发启动快，支持一键开启 `dll` 和 `hard-source-webpack-plugin` 等
- 一键兼容到 `IE9`，基于 `umi-plugin-polyfills`
- 完善的 `TypeScript` 支持，包括 `d.ts `定义和 `umi test`
- 与 `dva` 数据流的深入融合，支持 `duck directory`、`model` 的自动加载、`code splitting `等等

## 1.2 架构

![](https://gw.alipayobjects.com/zos/rmsportal/zvfEXesXdgTzWYZCuHLe.png)

## 1.3 和 dva、roadhog关系

- `roadhog` 是基于 `webpack` 的封装工具，目的是简化 `webpack` 的配置
umi 可以简单地理解为 `roadhog + 路由`，思路类似 `next.js/nuxt.js`，辅以一套插件机制，目的是通过框架的方式简化 `React `开发
- `dva ` 目前是纯粹的数据流，和 `umi` 以及 `roadhog` 之间并没有相互的依赖关系，可以分开使用也可以一起使用


# 二、环境搭建

```
$ mkdir myapp && cd myapp
$ yarn create umi
```

![](https://gw.alipayobjects.com/zos/rmsportal/mlEDcowMOSeXwLoukayR.png)

> 确定后，会根据你的选择自动创建好目录和文件

![](https://gw.alipayobjects.com/zos/rmsportal/ppRAiFpnZbpwDDuoFdPh.png)


# 三、目录结构


> `dva` 项目之前通常都是这种扁平的组织方式

```javascript
+ models
  - global.js
  - a1.js
  - a2.js
  - b.js
+ services
  - a.js
  - b.js
+ routes
  - PageA.js
  - PageB.js
```

> 用了 `umi` 后，可以按页面维度进行组织

```javascript
+ models/global.js
+ pages
  + a
    - index.js
    + models
      - a1.js
      - a2.js
    + services
      - a.js
  + b
    - index.js
    - model.js
    - service.js
```

> 好处是更加结构更加清晰了，减少耦合，一删全删，方便 copy 和共享

**自动注册 models**

```
+ src
  + models
    - g.js
  + pages
    + a
      + models
        - a.js
        - b.js
        + ss
          - s.js
      - page.js
    + c
      - model.js
      + d
        + models
          - d.js
        - page.js
      - page.js
```

- `global model` 为 `src/models/g.js`
- `/a` 的 `page model` 为 `src/pages/a/models/{a,b,ss/s}.js`
- `/c` 的 `page model` 为 `src/pages/c/model.js`
- `/c/d` 的 `page model` 为 `src/pages/c/model.js`, `src/pages/c/d/models/d.js`


> 一个复杂应用的目录结构如下

```javascript
.
├── dist/                          // 默认的 build 输出目录
├── mock/                          // mock 文件所在目录，基于 express
├── config/
    ├── config.js                  // umi 配置，同 .umirc.js，二选一
└── src/                           // 源码目录，可选
    ├── layouts/index.js           // 全局布局
    ├── pages/                     // 页面目录，里面的文件即路由
        ├── .umi/                  // dev 临时目录，需添加到 .gitignore
        ├── .umi-production/       // build 临时目录，会自动删除
        ├── document.ejs           // HTML 模板
        ├── 404.js                 // 404 页面
        ├── page1.js               // 页面 1，任意命名，导出 react 组件
        ├── page1.test.js          // 用例文件，umi test 会匹配所有 .test.js 和 .e2e.js 结尾的文件
        └── page2.js               // 页面 2，任意命名
    ├── global.css                 // 约定的全局样式文件，自动引入，也可以用 global.less
    ├── global.js                  // 可以在这里加入 polyfill
├── .umirc.js                      // umi 配置，同 config/config.js，二选一
├── .env                           // 环境变量
└── package.json
```

**1、dist**

> 默认输出路径，可通过配置 `outputPath` 修改


**2、mock**

> 约定 `mock `目录里所有的 `.js` 文件会被解析为 `mock` 文件

比如，新建` mock/users.js`，内容如下：

```javascript
export default {
  '/api/users': ['a', 'b'],
}
```

> 然后在浏览器里访问 `http://localhost:8000/api/users 就可以看到 ['a', 'b']` 了

**3、src**

> 约定 src 为源码目录，但是可选，简单项目可以不加 src 这层目录

比如：下面两种目录结构的效果是一致的。

```
+ src
  + pages
    - index.js
  + layouts
    - index.js
- .umirc.js

```

```
+ pages
  - index.js
+ layouts
  - index.js
- .umirc.js
```


**4、src/layouts/index.js**

> 全局布局，实际上是在路由外面套了一层

比如，你的路由是：

```javascript
[
  { path: '/', component: './pages/index' },
  { path: '/users', component: './pages/users' },
]
```

如果有 `layouts/index.js`，那么路由则变为：

```javascript

[
  { path: '/', component: './layouts/index', routes: [
    { path: '/', component: './pages/index' },
    { path: '/users', component: './pages/users' },
  ] }
]

```

**5、src/pages**

> 约定 `pages` 下所有的 `(j|t)sx?` 文件即路由


**6、src/pages/404.js**

> `404` 页面。注意开发模式下有内置 umi 提供的 404 提示页面，所以只有显式访问 `/404` 才能访问到这个页面


**7、src/pages/document.ejs**

> 有这个文件时，会覆盖默认的 HTML 模板。需至少包含以下代码，

```html
<div id="root"></div>
```

**8、src/pages/.umi**

> 这是 `umi dev` 时生产的临时目录，默认包含 `umi.js` 和 `router.js`，有些插件也会在这里生成一些其他临时文件。可以在这里做一些验证，但请不要直接在这里修改代码，`umi` 重启或者 `pages` 下的文件修改都会重新生成这个文件夹下的文件

**9、src/pages/.umi-production**

> 同 `src/pagers/.umi`，但是是在 `umi build `时生成的，会在 `umi build` 执行完自动删除


**10、src/global.(j|t)sx?**

> 在入口文件最前面被自动引入，可以考虑在此加入 `polyfill`

**11、src/global.(css|less|sass|scss)**

> 这个文件不走 `css modules`，自动被引入，可以写一些全局样式，或者做一些样式覆盖


**12、.umirc.js 和 config/config.js**

> `umi` 的配置文件，二选一

**13、.env**

环境变量，比如：

```
CLEAR_CONSOLE=none
BROWSER=none
```

# 四、路由配置

## 4.1 约定式路由

### 4.1.1 基础路由

假设 `pages` 目录结构如下：

```
+ pages/
  + users/
    - index.js
    - list.js
  - index.js
```

那么，umi 会自动生成路由配置如下：

```javascript
[
  { path: '/', component: './pages/index.js' },
  { path: '/users/', component: './pages/users/index.js' },
  { path: '/users/list', component: './pages/users/list.js' },
]
```

### 4.1.2 动态路由

> `umi` 里约定，带 `$` 前缀的目录或文件为动态路由。

比如以下目录结构：

```
+ pages/
  + $post/
    - index.js
    - comments.js
  + users/
    $id.js
  - index.js
```

会生成路由配置如下：

```javascript
[
  { path: '/', component: './pages/index.js' },
  { path: '/users/:id', component: './pages/users/$id.js' },
  { path: '/:post/', component: './pages/$post/index.js' },
  { path: '/:post/comments', component: './pages/$post/comments.js' },
]
```

### 4.1.3 可选的动态路由

> `umi` 里约定动态路由如果带 `$` 后缀，则为可选动态路由。

比如以下结构：

```
+ pages/
  + users/
    - $id$.js
  - index.js
```

会生成路由配置如下：

```javascript
[
  { path: '/': component: './pages/index.js' },
  { path: '/users/:id?': component: './pages/users/$id$.js' },
]
```

### 4.1.4 嵌套路由

> `umi` 里约定目录下有` _layout.js` 时会生成嵌套路由，以` _layout.js` 为该目录的 `layout` 。

比如以下目录结构：

```
+ pages/
  + users/
    - _layout.js
    - $id.js
    - index.js
```

会生成路由配置如下：

```javascript
[
  { path: '/users': component: './pages/users/_layout.js'
    routes: [
     { path: '/users/', component: './pages/users/index.js' },
     { path: '/users/:id', component: './pages/users/$id.js' },
   ],
  },
]
```

### 4.1.5 全局 layout

> 约定 `src/layouts/index.js` 为全局路由，返回一个 React 组件，通过 `props.children` 渲染子组件。

比如：

```javascript
export default function(props) {
  return (
    <>
      <Header />
      { props.children }
      <Footer />
    </>
  );
}
```

### 4.1.6 不同的全局 layout

> 你可能需要针对不同路由输出不同的全局 `layout`，`umi` 不支持这样的配置，但你仍可以在 `layouts/index.js` 对 `location.path` 做区分，渲染不同的 `layout `。

- 比如想要针对 `/login` 输出简单布局，

```javascript
export default function(props) {
  if (props.location.pathname === '/login') {
    return <SimpleLayout>{ props.children }</SimpleLayout>
  }
  
  return (
    <>
      <Header />
      { props.children }
      <Footer />
    </>
  );
}
```

### 4.1.7 404 路由

> 约定 `pages/404.js` 为 `404 `页面，需返回 `React` 组件。

比如：

```javascript
export default () => {
  return (
    <div>I am a customized 404 page</div>
  );
};
```

> 注意：开发模式下，umi 会添加一个默认的 `404` 页面来辅助开发，但你仍然可通过精确地访问 `/404 `来验证 404 页面。

### 4.1.8 通过注释扩展路由

> 约定路由文件的首个注释如果包含 `yaml `格式的配置，则会被用于扩展路由。

比如：

```
+ pages/
  - index.js
  
```

> 如果` pages/index.js` 里包含：

```javascript
/**
 * title: Index Page
 * Routes:
 *   - ./src/routes/a.js
 *   - ./src/routes/b.js
 */
```

则会生成路由配置：

```javascript
[
  { path: '/', component: './index.js',
    title: 'Index Page',
    Routes: [ './src/routes/a.js', './src/routes/b.js' ],
  },
]
```

## 4.2 配置式路由

> 如果你倾向于使用配置式的路由，可以配置 `routes` ，此配置项存在时则不会对 `src/pages` 目录做约定式的解析。

比如：


```javascript
export default {
  routes: [
    { path: '/', component: './a' },
    { path: '/list', component: './b', Routes: ['./routes/PrivateRoute.js'] },
    { path: '/users', component: './users/_layout',
      routes: [
        { path: '/users/detail', component: './users/detail' },
        { path: '/users/:id', component: './users/id' }
      ]
    },
  ],
};
```

> 注意：`component` 是相对于 `src/pages` 目录的

## 4.3 权限路由

> `umi` 的权限路由是通过配置路由的 `Routes` 属性来实现。约定式的通过 `yaml` 注释添加，配置式的直接配上即可。

比如有以下配置：

```javascript
[
  { path: '/', component: './pages/index.js' },
  { path: '/list', component: './pages/list.js', Routes: ['./routes/PrivateRoute.js'] },
]
```

> 然后 umi 会用` ./routes/PrivateRoute.js `来渲染 `/list`。

`./routes/PrivateRoute.js` 文件示例：

```javascript
export default (props) => {
  return (
    <div>
      <div>PrivateRoute (routes/PrivateRoute.js)</div>
      { props.children }
    </div>
  );
}
```

## 4.4 路由动效

> 路由动效应该是有多种实现方式，这里举 react-transition-group 的例子。

先安装依赖，

```
$ yarn add react-transition-group
```

> 在 ` layout`  组件（` layouts/index.js`  或者 `pages` 子目录下的 _layout.js）里在渲染子组件时用 `TransitionGroup` 和 `CSSTransition` 包裹一层，并以 `location.key` 为 `key`，

```javascript
import withRouter from 'umi/withRouter';
import { TransitionGroup, CSSTransition } from "react-transition-group";

export default withRouter(
  ({ location }) =>
    <TransitionGroup>
      <CSSTransition key={location.key} classNames="fade" timeout={300}>
        { children }
      </CSSTransition>
    </TransitionGroup>
)
```

> 上面用到的 `fade` 样式，可以在 `src` 下的 `global.css` 里定义：

```css
.fade-enter {
  opacity: 0;
  z-index: 1;
}

.fade-enter.fade-enter-active {
  opacity: 1;
  transition: opacity 250ms ease-in;
}
```

## 4.5 面包屑

> 面包屑也是有多种实现方式，这里举 `react-router-breadcrumbs-hoc` 的例子。

先安装依赖，

```
$ yarn add react-router-breadcrumbs-hoc
```

然后实现一个 `Breakcrumbs.js`，比如：

```javascript
import NavLink from 'umi/navlink';
import withBreadcrumbs from 'react-router-breadcrumbs-hoc';

// 更多配置请移步 https://github.com/icd2k3/react-router-breadcrumbs-hoc
const routes = [
  { path: '/', breadcrumb: '首页' },
  { path: '/list', breadcrumb: 'List Page' },
];

export default withBreadcrumbs(routes)(({ breadcrumbs }) => (
  <div>
    {breadcrumbs.map((breadcrumb, index) => (
      <span key={breadcrumb.key}>
        <NavLink to={breadcrumb.props.match.url}>
          {breadcrumb}
        </NavLink>
        {(index < breadcrumbs.length - 1) && <i> / </i>}
      </span>
    ))}
  </div>
));
```

然后在需要的地方引入此 `React` 组件即可。

## 4.6 启用 Hash 路由

> `umi` 默认是用的 `Browser History`，如果要用 `Hash History`，需配置：

```javascript
export default {
  history: 'hash',
}
# Scroll to top
在 layout 组件（layouts/index.js 或者 pages 子目录下的 _layout.js）的 componentDidUpdate 里决定是否 scroll to top，比如：

import { Component } from 'react';
import withRouter from 'umi/withRouter';

class Layout extends Component {
  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
      window.scrollTo(0, 0);
    }
  }
  render() {
    return this.props.children;
  }
}

export default withRouter(Layout);

```

## 4.7 页面间跳转

> 在 umi 里，页面之间跳转有两种方式：声明式和命令式

**声明式**

> 基于 `umi/link`，通常作为 `React` 组件使用。

```javascript
import Link from 'umi/link';

export default () => (
  <Link to="/list">Go to list page</Link>
);
```

**命令式**

> 基于 `umi/router`，通常在事件处理中被调用。

```javascript
import router from 'umi/router';

function goToListPage() {
  router.push('/list');
}
```

# 五、配置

> 配置文件
`umi` 允许在 `.umirc.js` 或 `config/config.js `（二选一，`.umirc.js` 优先）中进行配置，支持 `ES6 `语法。


比如：

```javascript
export default {
  base: '/admin/',
  publicPath: 'http://cdn.com/foo',
  plugins: [
    ['umi-plugin-react', {
      dva: true,
    }],
  ],
};
```

**.umirc.local.js**

> `.umirc.local.js` 是本地的配置文件，不要提交到 `git`，所以通常需要配置到 `.gitignore`。如果存在，会和 `.umirc.js` 合并后再返回。

**UMI_ENV**

> 可以通过环境变量 `UMI_ENV` 区分不同环境来指定配置。

举个例子，

```javascript
// .umirc.js
export default { a: 1, b: 2 };

// .umirc.cloud.js
export default { b: 'cloud', c: 'cloud' };

// .umirc.local.js
export default { c: 'local' };
```

不指定 `UMI_ENV` 时，拿到的配置是：

```json
{
  a: 1,
  b: 2,
  c: 'local',
}
```

> 指定 `UMI_ENV=cloud `时，拿到的配置是：

```json
{
  a: 1,
  b: 'cloud',
  c: 'local',
}
```

# 六、Mock 数据

**使用 umi 的 mock 功能**

> `umi` 里约定 `mock` 文件夹下的文件即` mock `文件，文件导出接口定义，支持基于 `require` 动态分析的实时刷新，支持 ES6 语法，以及友好的出错提示

```javascript
export default {
  // 支持值为 Object 和 Array
  'GET /api/users': { users: [1, 2] },

  // GET POST 可省略
  '/api/users/1': { id: 1 },

  // 支持自定义函数，API 参考 express@4
  'POST /api/users/create': (req, res) => { res.end('OK'); },
};
```

> 当客户端（浏览器）发送请求，如：`GET /api/users`，那么本地启动的 `umi dev` 会跟此配置文件匹配请求路径以及方法，如果匹配到了，就会将请求通过配置处理

**引入 Mock.js**

> `Mock.js` 是常用的辅助生成模拟数据的第三方库，当然你可以用你喜欢的任意库来结合 roadhog 构建数据模拟功能

```javascript
import mockjs from 'mockjs';

export default {
  // 使用 mockjs 等三方库
  'GET /api/tags': mockjs.mock({
    'list|100': [{ name: '@city', 'value|1-100': 50, 'type|0-2': 1 }],
  }),
};
```

**添加跨域请求头**

> 设置 `response` 的请求头即可：

```javascript
'POST /api/users/create': (req, res) => {
  ...
  res.setHeader('Access-Control-Allow-Origin', '*');
  ...
},
```

**合理的拆分你的 mock 文件**

> 对于整个系统来说，请求接口是复杂并且繁多的，为了处理大量模拟请求的场景，我们通常把每一个数据模型抽象成一个文件，统一放在 mock 的文件夹中，然后他们会自动被引入

![](https://gw.alipayobjects.com/zos/rmsportal/wbeiDacBkchXrTafasBy.png)

**模拟延迟**

> 为了更加真实的模拟网络数据请求，往往需要模拟网络延迟时间

- 手动添加 `setTimeout` 模拟延迟

你可以在重写请求的代理方法，在其中添加模拟延迟的处理，如：

```javascript
'POST /api/forms': (req, res) => {
  setTimeout(() => {
    res.send('Ok');
  }, 1000);
},
```

**使用插件模拟延迟**

> 上面的方法虽然简便，但是当你需要添加所有的请求延迟的时候，可能就麻烦了，不过可以通过第三方插件来简化这个问题，如：`roadhog-api-doc#delay`。

```javascript
import { delay } from 'roadhog-api-doc';

const proxy = {
  'GET /api/project/notice': getNotice,
  'GET /api/activities': getActivities,
  'GET /api/rule': getRule,
  'GET /api/tags': mockjs.mock({
    'list|100': [{ name: '@city', 'value|1-100': 50, 'type|0-2': 1 }]
  }),
  'GET /api/fake_list': getFakeList,
  'GET /api/fake_chart_data': getFakeChartData,
  'GET /api/profile/basic': getProfileBasicData,
  'GET /api/profile/advanced': getProfileAdvancedData,
  'POST /api/register': (req, res) => {
    res.send({ status: 'ok' });
  },
  'GET /api/notices': getNotices,
};

// 调用 delay 函数，统一处理
export default delay(proxy, 1000);
```

**联调**

> 当本地开发完毕之后，如果服务器的接口满足之前的约定，那么你只需要不开本地代理或者重定向代理到目标服务器就可以访问真实的服务端数据，非常方便

# 七、结合dva实践

> 自`>= umi@2`起，`dva`的整合可以直接通过 `umi-plugin-react` 来配置


**特性**

- 按目录约定注册 `model`，无需手动 `app.model`
- 文件名即` namespace`，可以省去 model 导出的 `namespace key`
- 无需手写 `router.js`，交给 `umi` 处理，支持 `model` 和 `component` 的按需加载
- 内置 `query-string` 处理，无需再手动解码和编码
- 内置 `dva-loading `和 `dva-immer`，其中 `dva-immer` 需通过配置开启
- 开箱即用，无需安装额外依赖，比如 `dva`、`dva-loading`、`dva-immer`、`path-to-regexp`、`object-assign`、`react`、`react-dom` 等`

**使用**

```
$ yarn add umi-plugin-react
```

然后在 `.umirc.js` 里配置插件：

```javascript
export default {
  plugins: [
    [
      'umi-plugin-react',
    ]
  ],
};
```

推荐开启 `dva-immer` 以简化 `reducer` 编写，

```javascript
export default {
  plugins: [
    [
      'umi-plugin-react',
      {
        dva: {
          immer: true
        }
      }
    ],
  ],
};
```

**model 注册**

> `model` 分两类，一是全局` model`，二是页面` model`。全局 `model `存于 `/src/models/` 目录，所有页面都可引用；页面 model 不能被其他页面所引用。

规则如下：

- `src/models/**/*.js` 为 `global model`
- `src/pages/**/models/**/*.js `为 `page model`
- `global model` 全量载入，`page model` 在 `production `时按需载入，在 `development` 时全量载入
- `page model` 为 `page js` 所在路径下 `models/**/*.js` 的文件
- `page model` 会向上查找，比如 `page js` 为 `pages/a/b.js`，他的 `page model` 为 `pages/a/b/models/**/*.js` +` pages/a/models/**/*.js`，依次类推
- 约定 `model.js` 为单文件 model，解决只有一个` model` 时不需要建 models 目录的问题，有 `model.js `则不去找 `models/**/*.js`

```
+ src
  + models
    - g.js
  + pages
    + a
      + models
        - a.js
        - b.js
        + ss
          - s.js
      - page.js
    + c
      - model.js
      + d
        + models
          - d.js
        - page.js
      - page.js
```

如上目录：


- `global model` 为 `src/models/g.js`
- `/a` 的 `page model `为 `src/pages/a/models/{a,b,ss/s}.js`
- `/c `的 `page model` `为` src/pages/c/model.js`
- `/c/d` 的 `page model` 为 `src/pages/c/model.js`, `src/pages/c/d/models/d.js`


# 八、问题汇总

**1、如何配置 onError、initialState 等 hook？**

> 新建 `src/dva.js`，通过导出的 `config` 方法来返回额外配置项，比如：

```javascript
import { message } from 'antd';

export function config() {
  return {
    onError(err) {
      err.preventDefault();
      message.error(err.message);
    },
    initialState: {
      global: {
        text: 'hi umi + dva',
      },
    },
  };
}
```

**2、url 变化了，但页面组件也刷新，是什么原因？**

> `layouts/index.js` 里如果用了 `connect` 传数据，需要用 `umi/withRouter` 高阶一下

```javascript
import withRouter from 'umi/withRouter';

export default withRouter(connect(mapStateToProps)(LayoutComponent));
```

**3、如何访问到 store 或 dispatch 方法？**

```javascript
window.g_app._store
window.g_app._store.dispatch
```

**4、如何禁用包括 component 和 models 的按需加载？**

> 在 `.umirc.js` 里配置：

```javascript
export default {
  disableDynamicImport: true,
};
```



**如果不用page.js的命名，倒是能生成路由，但是model、service、components就全部变路由了**

> 不用 page.js，然后通过 umi-plugin-routes 过滤掉不需要的路由，参考 https://github.com/zuiidea/antd-admin/blob/develop/.umirc.js#L4-L16

**.umirc.mock.js 这个文件怎么配置呢？**

> 可以不用配置，在 mock/ 下建文件写 mock 代码即可。

# 九、Demo

> https://github.com/poetries/umi-tmp

# 十、参考

- [Umi config配置](https://umijs.org/zh/config/#%E5%9F%BA%E6%9C%AC%E9%85%8D%E7%BD%AE)
- [Umi APi](https://umijs.org/zh/api/)
- [Umi插件](https://umijs.org/zh/plugin/)
- [使用 umi 改进 dva 项目开发](https://github.com/sorrycc/blog/issues/66)
