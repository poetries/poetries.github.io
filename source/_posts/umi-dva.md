---
title: 使用umi改进dva项目开发，约定式路由与插件体系实践
date: 2018-09-07 20:10:23
description: umi 用目录约定替掉手写 router.js 和 app.model 注册，这篇讲清约定式路由的全部规则、model 自动加载的查找顺序、配置文件与 UMI_ENV 分环境、mock 约定，以及和 dva 的分工。
tags:
  - Dva
  - Umi
  - React
  - 约定式路由
  - 前端工程化
categories: Front-End
---

裸 dva 项目写到第二十个页面的时候，`router.js` 已经三百行了。每加一个页面要做四件事，在 `routes/` 建组件、在 `models/` 建 model、去 `index.js` 里补一行 `app.model(require(...))`、再回 `router.js` 加一条 `<Route>`。漏掉任何一步都是白屏或者 dispatch 没反应，而且报错信息还不会告诉你漏的是哪一步。

umi 干的事就是把这四步压成一步，你在 `pages/` 下建个文件，路由和 model 自己就注册好了。这篇是我 2018 年从 dva 迁到 umi 时整理的笔记，约定式路由的全部规则、model 的查找顺序、配置文件的分环境写法、mock 约定，一条条列在这儿。原文的写法我一字没删，另外补了几段现在的情况，umi 后来发过好几个大版本，有些写法已经变了，哪些能抄、哪些不能抄，我在对应的位置标了出来。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- umi、dva、roadhog 三者到底是什么关系，为什么它们能拆开也能合起来用
- 从扁平的 `models/services/routes` 换成按页面组织的目录，具体解决了什么问题
- 约定式路由的八条规则，动态路由、可选动态路由、嵌套路由、404、注释扩展
- 什么时候该放弃约定式改用配置式路由，两者是互斥的
- 权限路由、路由动效、面包屑、hash 路由这几个高频需求的实现方式
- `.umirc.js` 和 `UMI_ENV` 怎么配出多套环境的配置
- mock 目录的约定写法，以及怎么模拟网络延迟
- model 自动注册的完整查找规则，全局 model 和页面 model 的边界

## 一、Umi简介

> 一个可插拔的企业级 `react` 应用框架。`umi` 以路由为基础的，以及各种进阶的路由功能，并以此进行功能扩展，比如支持路由级的按需加载。然后配以完善的插件体系，覆盖从源码到构建产物的每个生命周期

这段官方定义里有两个词是重点，「以路由为基础」和「插件体系」。前者决定了你的目录长什么样，后者决定了 dva、antd、PWA 这些东西怎么接进来。这篇后面的内容基本都在展开这两句。

### 1.1 特性

- 开箱即用，内置 `react`、`react-router` 等
- 支持配置的路由方式
- 完善的插件体系，覆盖从源码到构建产物的每个生命周期
- 高性能，通过插件支持 `PWA`、以路由为单元的 `code splitting` 等
- 支持静态页面导出，适配各种环境，比如中台业务、无线业务、egg、支付宝钱包、云凤蝶等
- 开发启动快，支持一键开启 `dll` 和 `hard-source-webpack-plugin` 等
- 一键兼容到 `IE9`，基于 `umi-plugin-polyfills`
- 完善的 `TypeScript` 支持，包括 `d.ts `定义和 `umi test`
- 与 `dva` 数据流的深入融合，支持 `duck directory`、`model` 的自动加载、`code splitting `等等

这一串里，对老 dva 项目冲击最大的是最后一条。`duck directory` 和 `model` 自动加载合起来的效果是，你不用再维护那份 `app.model(require(...))` 的清单了。第七节会把这套规则拆开讲。

### 1.2 架构

下面这张官方架构图把 umi 的分层画得挺清楚，从下往上看会更好理解。

![umi 架构图：底层是 webpack 和 babel，中间是 umi 内核与插件体系，上层是路由、dva、antd 等按需接入的能力](https://gw.alipayobjects.com/zos/rmsportal/zvfEXesXdgTzWYZCuHLe.png)

最底下是 webpack 和 babel，中间那层才是 umi 自己的东西，也就是内核加插件机制，再往上的 dva 整合、antd 按需加载、PWA、polyfill，全都是插件。你要是嫌某个能力用不上，把插件摘掉就行，这跟 create-react-app 那种一次性 eject 的思路完全不同。

### 1.3 和 dva、roadhog关系

- `roadhog` 是基于 `webpack` 的封装工具，目的是简化 `webpack` 的配置
umi 可以简单地理解为 `roadhog + 路由`，思路类似 `next.js/nuxt.js`，辅以一套插件机制，目的是通过框架的方式简化 `React `开发
- `dva ` 目前是纯粹的数据流，和 `umi` 以及 `roadhog` 之间并没有相互的依赖关系，可以分开使用也可以一起使用

这三者的关系我一开始也绕了半天，后来发现按「谁管什么」来记最省事。roadhog 管构建，umi 管构建加路由，dva 只管数据流。所以你能看到三种组合，光用 dva 不用 umi（老 dva 脚手架就是这样，路由自己写在 `router.js` 里），光用 umi 不用 dva（数据流换成别的），或者两个一起上。

也正因为这样，这篇不会重复讲 model 里 `state`、`reducers`、`effects`、`subscriptions` 怎么写，那部分我在 [Dva实践总结](https://feinterview.poetries.top/blog/dva) 里从五个 API 一路写到了完整案例。这篇只讲 umi 接进来之后，dva 的写法哪里变了。

## 二、环境搭建

umi 没有独立的 cli 包要全局装，直接用 `yarn create` 起一个交互式脚手架就行。

```
$ mkdir myapp && cd myapp
$ yarn create umi
```

跑完会弹出一个选择器，问你要建什么类型的项目。

![yarn create umi 的交互式选择界面，可以选择创建 app、block、library 等不同类型的项目](https://gw.alipayobjects.com/zos/rmsportal/mlEDcowMOSeXwLoukayR.png)

选 `app` 之后它还会接着问要不要 TypeScript、要不要 dva、要不要 antd，按需勾就行，这几个选项对应的其实就是往 `.umirc.js` 的 `plugins` 里塞不塞对应的插件。

> 确定后，会根据你的选择自动创建好目录和文件

![脚手架执行完成后自动生成的目录和文件列表，包含 mock、src/pages、.umirc.js 等](https://gw.alipayobjects.com/zos/rmsportal/ppRAiFpnZbpwDDuoFdPh.png)

生成出来的东西比 dva-cli 少得多，没有 `router.js`，也没有一大堆 webpack 配置文件，这正是 umi 的风格，能靠约定推导出来的就不落成文件。

## 三、目录结构

这一节是整篇最值钱的部分。umi 带来的改变不在于某个 API，而在于你的文件该往哪儿放。

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

这种平铺法在页面少的时候没问题，超过二十个页面就开始难受了。`models/` 里躺着四十个文件，你光看文件名分不清哪个还在用；想删掉一个下线的页面，得去三个目录里各找一遍，漏删的那个 model 还会一直被注册进 store，白占内存。

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

「一删全删」这四个字是我用下来感受最深的。页面下线的时候 `rm -rf pages/a` 就完事了，它的 model、service 全跟着走，不会留下孤儿文件。反过来，要把一个功能搬到另一个项目里，也是整个目录 copy 过去。这种把相关文件放一起的组织方式在社区里叫 duck directory，最早是 Redux 圈子里为了解决同一个功能的文件散落各处提出来的。

注意 `models/global.js` 还留在 `src` 顶层，这是有意的。登录用户信息、全局菜单、权限这类跨页面共享的数据不属于任何一个页面，放全局；只有当前页面用的数据放页面自己的目录里。这条线画不清楚，页面 model 迟早会被别的页面偷偷引用，duck directory 就白分了。

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

第四条要多看两眼，`/c/d` 拿到的是 `c/model.js` 加 `c/d/models/d.js` 两份，也就是说页面 model 会沿着目录往上找。这个设计在做多级菜单的中后台时很省事，`/order` 这一层的公共数据放 `pages/order/model.js`，下面的 `/order/list`、`/order/detail` 都能直接用，不用提到全局去。

我踩过的坑是文件名冲突。model 的 namespace 默认取文件名，如果 `pages/a/models/list.js` 和 `pages/b/models/list.js` 同时被加载，两个 namespace 都叫 `list`，后注册的会盖掉前面的。生产环境下页面 model 是按需加载的，你未必撞得上；但开发模式是全量载入的，所以线下正常线上异常，或者反过来，都有可能。稳妥的做法是把 namespace 显式写成带业务前缀的名字。

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

这张结构图里没有 `router.js`，也没有 webpack 配置，能省的全省了。下面把这些约定挨个说一遍，重点是每一条约定「省掉了什么」，这样你记起来会容易得多。

**1、dist**

> 默认输出路径，可通过配置 `outputPath` 修改

**2、mock**

> 约定 `mock `目录里所有的 `.js` 文件会被解析为 `mock` 文件

不用装 json-server，也不用另起一个 node 服务，`umi dev` 本身就是那个 mock 服务器。

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


这两种写法我的建议是加上 `src`。项目一大，根目录迟早会堆进 Dockerfile、CI 配置、脚本目录这些跟源码没关系的东西，有 `src` 这层隔离，构建工具和你自己找文件都清爽。

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

看懂这个转换你就明白 layout 的本质了，它不是一个「壳组件」，而是真的往路由表里插了一层父路由，子路由从 `props.children` 出去。所以 layout 组件不会因为你在子页面之间跳转而重新挂载，侧边栏的展开状态、顶部的未读消息轮询都能保持住。这也是把全局布局做成 layout 而不是在每个页面里手动 import 的最大理由。

**5、src/pages**

> 约定 `pages` 下所有的 `(j|t)sx?` 文件即路由

这一条是约定式路由的地基，也是最容易咬到人的一条。它是「所有」，不是「除了 xxx 之外」。你在 `pages/user/` 下顺手建一个 `utils.js` 放格式化函数，它也会变成 `/user/utils` 这条路由。所以工具函数、常量、非路由组件都别往 `pages` 里丢，第八节最后那条问题就是被这个坑到的。

**6、src/pages/404.js**

> `404` 页面。注意开发模式下有内置 umi 提供的 404 提示页面，所以只有显式访问 `/404` 才能访问到这个页面


**7、src/pages/document.ejs**

> 有这个文件时，会覆盖默认的 HTML 模板。需至少包含以下代码，

```html
<div id="root"></div>
```

**8、src/pages/.umi**

> 这是 `umi dev` 时生产的临时目录，默认包含 `umi.js` 和 `router.js`，有些插件也会在这里生成一些其他临时文件。可以在这里做一些验证，但请不要直接在这里修改代码，`umi` 重启或者 `pages` 下的文件修改都会重新生成这个文件夹下的文件

这个目录是排查路由问题的第一现场。约定式路由生成出来的路由表长什么样，全在 `.umi/router.js` 里写着。页面 404、layout 没套上、动态参数没匹配到，先打开这个文件看看实际生成的配置对不对，比对着自己的目录结构猜快多了。它是构建产物，记得加进 `.gitignore`。

**9、src/pages/.umi-production**

> 同 `src/pagers/.umi`，但是是在 `umi build `时生成的，会在 `umi build` 执行完自动删除


**10、src/global.(j|t)sx?**

> 在入口文件最前面被自动引入，可以考虑在此加入 `polyfill`

**11、src/global.(css|less|sass|scss)**

> 这个文件不走 `css modules`，自动被引入，可以写一些全局样式，或者做一些样式覆盖

「不走 css modules」这半句是重点。项目里其它 `.less` 文件的类名都会被编译成带 hash 的唯一类名，只有这个文件保持原样，所以要覆盖 antd 的样式就得写在这儿，写在页面的 less 里是不生效的。

**12、.umirc.js 和 config/config.js**

> `umi` 的配置文件，二选一

选哪个看配置量。配置项少就用根目录的 `.umirc.js`，配置多到要拆成 `router.config.js`、`theme.config.js` 好几份的时候，用 `config/` 目录会舒服很多，Ant Design Pro 就是走的这条路。

**13、.env**

环境变量，比如：

```
CLEAR_CONSOLE=none
BROWSER=none
```

`BROWSER=none` 是我每个项目都会加的一行，作用是 `umi dev` 起来之后不自动打开浏览器。开发时一天重启十几次，每次都弹一个新标签页真的很烦。

## 四、路由配置

路由是 umi 的核心，它提供两套模式，约定式和配置式，两者互斥。先看约定式。

### 4.1 约定式路由

约定式路由的规则一共八条，看着多，其实就是「目录结构怎么映射成 URL」这一件事的八种情况。

#### 4.1.1 基础路由

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

对着看一眼就明白了，目录名变成路径段，`index.js` 对应目录本身那一级。这条规则底下没有任何魔法，umi 只是扫了一遍 `pages` 目录然后生成上面这段配置，你在 `.umi/router.js` 里能看到一模一样的东西。

#### 4.1.2 动态路由

列表页点进详情，URL 里得带 id，这就要用到动态路由。

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

`$` 换成 `:` 就是最终的路由参数名，取值在组件里用 `props.match.params.id` 拿。选 `$` 做前缀是因为文件名里不能带冒号，Windows 直接不让你建这种文件。

这里有个坑要注意，动态路由和静态路由撞车的时候，谁先匹配上就归谁。假如你既有 `pages/users/$id.js` 又有 `pages/users/new.js`，访问 `/users/new` 到底走哪个，取决于生成的路由表里两条的先后顺序。真遇到了就去 `.umi/router.js` 里确认，别猜。

#### 4.1.3 可选的动态路由

同一个页面既要能新建又要能编辑的时候，这条规则就派上用场了。

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
  { path: '/', component: './pages/index.js' },
  { path: '/users/:id?', component: './pages/users/$id$.js' },
]
```

生成结果里那个 `?` 就是 react-router 的可选参数写法，`/users` 和 `/users/123` 都会命中同一个组件。组件里判断一下 `match.params.id` 有没有值，有就是编辑，没有就是新建，一套表单代码两用。原文这段的示例代码里对象属性之间写成了冒号，应该是逗号，我顺手改对了，照着原样抄会直接语法报错。

#### 4.1.4 嵌套路由

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
  { path: '/users', component: './pages/users/_layout.js',
    routes: [
     { path: '/users/', component: './pages/users/index.js' },
     { path: '/users/:id', component: './pages/users/$id.js' },
   ],
  },
]
```

（这段原文同样把 `path` 后面的逗号写成了冒号，还漏了一个逗号，我按能跑的写法补上了。）

局部 layout 最常见的用法是给一组页面加公共的 Tab 导航。比如 `/users` 底下有列表、统计、设置三个页面，头部那排 Tab 写在 `_layout.js` 里，切换的时候 Tab 不重新渲染，只有下面的内容区在变。下划线开头是 umi 的约定，凡是 `_` 开头的文件都不会被当成路由，所以你想在 `pages` 里放非路由文件，前面加个下划线是个可行的办法。

#### 4.1.5 全局 layout

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

#### 4.1.6 不同的全局 layout

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

登录页是这条规则的经典场景，它不该有侧边栏和面包屑。这种 if 判断多了会很难看，页面一多就变成一长串 `pathname.startsWith(...)`。我的做法是把不需要主框架的路径抽成一个数组，用 `some` 判断一次；再复杂就直接放弃全局 layout，改成 4.2 的配置式路由，在配置里给不同的一级路由指定不同的 layout 组件，Ant Design Pro 的 `BasicLayout` 和 `UserLayout` 就是这么分的，具体写法我在 [Ant Design Pro 总结篇](https://feinterview.poetries.top/blog/ant-design-pro) 里展开写过。

#### 4.1.7 404 路由

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

这条注意事项救过我一次。开发时随便打个不存在的地址，看到的是 umi 自带的那个带路由列表的调试页，不是你写的 404，很容易以为自己的 404 没生效。想验证就老老实实访问 `/404`，或者直接跑一次 `umi build` 看构建产物。

#### 4.1.8 通过注释扩展路由

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

这个设计挺巧的，约定式路由没有配置文件可以写，那就把配置写进页面文件的头部注释里，标题、权限包装组件这些额外信息就有地方放了。代价是它跟普通注释长得一模一样，新同学很容易在格式化代码或者清理注释的时候顺手删掉，然后页面权限就没了。团队里用这套写法，最好在代码规范里单独提一句。

### 4.2 配置式路由

> 如果你倾向于使用配置式的路由，可以配置 `routes` ，此配置项存在时则不会对 `src/pages` 目录做约定式的解析。

「此配置项存在时则不会对 `src/pages` 目录做约定式的解析」这句话是硬开关，两套模式不能混用。写了 `routes` 之后 `pages` 下的文件就纯粹是组件了，加了新文件不配路由就是访问不到，别在那儿找半天。

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

我自己的感受是，中后台项目最后基本都会倒向配置式。原因不是约定式不好用，而是中后台的菜单树、面包屑、权限几乎一定要跟路由一起管，有一份集中的配置反而好维护，改菜单顺序不用去挪文件夹。小项目和面向 C 端的站点用约定式更爽，建个文件就能跑。

### 4.3 权限路由

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

看明白 `Routes` 的机制之后你会发现它就是个高阶包装，umi 把匹配到的页面组件塞进 `props.children`，你在外层这个组件里决定是渲染它还是踢去登录页。所以权限校验、埋点上报、页面级的数据预取都能挂在这一层，不用每个页面自己写一遍。

要提醒一句，前端的权限路由只是体验层面的拦截，把没权限的入口藏起来而已。接口该做的鉴权一样不能少，不然改个 localStorage 就能进后台了。这一点在 dva 项目里尤其容易被忽略，因为权限值往往就存在 localStorage 里。

### 4.4 路由动效

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
  ({ location, children }) =>
    <TransitionGroup>
      <CSSTransition key={location.key} classNames="fade" timeout={300}>
        { children }
      </CSSTransition>
    </TransitionGroup>
)
```

关键在 `key={location.key}`。React 靠 key 判断是不是同一个节点，key 变了就当成新节点重新挂载，`CSSTransition` 才有机会跑进场动画。原文这段只解构了 `location` 却用到了 `children`，抄过去会直接报 `children is not defined`，我把 `children` 补进解构里了。

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

样式必须写在 `global.css` 里，写在页面的 less 里会被 CSS Modules 加上 hash，类名对不上，动画就是不生效。这个问题我排查了挺久，最后是在 DevTools 里看到元素上挂着 `fade-enter___2xKpQ` 才反应过来。

顺带一提，路由动效在中后台系统里我一般不加。切页面本来就要等接口，再叠 300ms 的过渡，操作密集的人会觉得卡。

### 4.5 面包屑

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

面包屑这块要注意的是，`react-router-breadcrumbs-hoc` 需要你手动维护一份路径到名称的映射表，路由改了这份表不改，面包屑就对不上了。用配置式路由的项目其实可以省掉这个库，直接从 `routes` 配置里读 `name` 生成面包屑，Ant Design Pro 走的就是这条路。

### 4.6 启用 Hash 路由

> `umi` 默认是用的 `Browser History`，如果要用 `Hash History`，需配置：

```javascript
export default {
  history: 'hash',
}
```

什么时候要切回 hash？你的静态资源部署在没法配 nginx 规则的地方（对象存储、GitHub Pages），或者后端不愿意为你加那条把所有未匹配路径都返回 `index.html` 的 fallback，那就用 hash。代价是 URL 里多个 `#`，而且服务端拿不到 `#` 后面的部分，一些统计和分享场景会有点别扭。

### 4.7 Scroll to top

原文这一段被上面那个代码块吃进去了，格式坏掉了，我把它拆出来单独放一节。这是个很实际的问题：单页应用切换路由时滚动条不会自动回到顶部，从长列表点进详情页，一进去就是页面中间，用户会一脸问号。

在 layout 组件（`layouts/index.js` 或者 pages 子目录下的 `_layout.js`）的 `componentDidUpdate` 里决定是否 scroll to top，比如：

```javascript
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

放在 layout 里而不是每个页面里，是因为 layout 不会随路由切换而卸载，它的 `componentDidUpdate` 正好能捕捉到 location 的变化。`withRouter` 那层不能省，不套的话 layout 拿不到最新的 `location`，条件永远不成立。这也是下一节第 2 个问题的同一个根因。

### 4.8 页面间跳转

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

选哪个看它出现在什么位置。渲染在页面上、用户能看见能点的，用 `Link`，它最终渲染成 `<a>`，能右键新窗口打开，对无障碍和 SEO 也友好。写在事件回调里的，比如提交表单成功之后跳转、拿到接口返回再决定去哪儿，用 `router.push`。

这里要说一句时效性。`umi/link` 和 `umi/router` 这种子路径导入是 umi 2 的写法，umi 后来又发了好几个大版本，导入方式改成了从 `umi` 统一导出。所以你要是在新版本上抄这篇的代码，会直接报模块找不到。改法很简单，按你项目里 umi 版本的官方文档改导入语句，`Link`、`history` 这些能力本身没变，变的只是从哪儿引进来。这一节往后的所有代码你都得带着这个前提看。

## 五、配置

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

这几个配置项挑两个说说。`base` 是路由的基础路径，应用挂在 `/admin` 这种子路径下时必须配，不然刷新页面路由匹配不上。`publicPath` 是静态资源的引用前缀，走 CDN 就配成 CDN 域名，这两个经常被搞混，一个管路由一个管资源，改错了症状是「首页能开但样式全丢」或者「资源都在但一刷新就 404」。

**.umirc.local.js**

> `.umirc.local.js` 是本地的配置文件，不要提交到 `git`，所以通常需要配置到 `.gitignore`。如果存在，会和 `.umirc.js` 合并后再返回。

这个文件解决的是团队协作里一个很烦的问题。每个人联调的后端地址不一样，proxy 配置改来改去，一不小心就把自己的本地地址提交上去了，别人拉下来接口全挂。有了 `.umirc.local.js`，个性化配置写在这里，它不进版本库，谁也不会覆盖谁。

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

对着这两个结果推一下优先级就清楚了，`.umirc.local.js` 永远在最上面，`UMI_ENV` 指定的环境配置排中间，基础的 `.umirc.js` 垫底。所以本地文件能盖掉任何东西，这也是为什么它绝对不能提交。

实际用法是在 `package.json` 里给每套环境配一条 script，比如 `"build:test": "UMI_ENV=test umi build"`，CI 上跑哪条就出哪个环境的包。有一点我一直不太放心，就是嵌套对象在合并时到底是整体替换还是逐键合并，不同版本的行为我没有逐个验证过。所以像 `theme`、`proxy` 这种嵌套结构，我的习惯是在环境配置里写全，不去指望它跟基础配置合并，省得出现「测试环境少了一半主题变量」这种排查起来很费劲的问题。

## 六、Mock 数据

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

这个 key 的写法值得记一下，`'GET /api/users'` 是「方法加空格加路径」，方法可以省略，省略了就是所有方法都匹配。value 支持三种，对象、数组和函数，前两种直接返回，函数则是标准的 express 处理器，能拿到 `req` 做参数判断，能自己设状态码。做「查询条件不同返回不同数据」这种模拟就得用函数写法。

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

![mock 目录下按数据模型拆分的多个 mock 文件，每个业务实体一个文件，会被 umi 自动引入](https://gw.alipayobjects.com/zos/rmsportal/wbeiDacBkchXrTafasBy.png)

拆分的粒度跟 model 保持一致就行，一个业务实体一个文件，`mock/user.js`、`mock/order.js`。别图省事全堆在一个 `mock/index.js` 里，几百行之后你想找某个接口的模拟数据都得靠搜索。

**模拟延迟**

> 为了更加真实的模拟网络数据请求，往往需要模拟网络延迟时间

这件事看着可有可无，其实很要紧。mock 接口是零延迟返回的，你本地看着 loading 一闪而过甚至根本看不见，等上了测试环境接口要跑 800ms，才发现按钮没做防重复点击、表格没接 loading、竞态请求会把旧数据盖回去。加个延迟，这些问题在本地就能暴露出来。

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

「如果服务器的接口满足之前的约定」这个前提，实际项目里十次有三次是不成立的。所以联调前把 mock 文件和后端的接口文档对一遍，字段名、层级、分页结构，能省下大半天的扯皮时间。

## 七、结合dva实践

前面六节讲的都是 umi 自己的事，这一节才是这篇标题里说的「改进 dva 项目开发」到底改进了什么。

> 自`>= umi@2`起，`dva`的整合可以直接通过 `umi-plugin-react` 来配置


**特性**

- 按目录约定注册 `model`，无需手动 `app.model`
- 文件名即` namespace`，可以省去 model 导出的 `namespace key`
- 无需手写 `router.js`，交给 `umi` 处理，支持 `model` 和 `component` 的按需加载
- 内置 `query-string` 处理，无需再手动解码和编码
- 内置 `dva-loading `和 `dva-immer`，其中 `dva-immer` 需通过配置开启
- 开箱即用，无需安装额外依赖，比如 `dva`、`dva-loading`、`dva-immer`、`path-to-regexp`、`object-assign`、`react`、`react-dom` 等

对照裸 dva 项目看，这几条省掉的是实打实的重复劳动。以前每加一个 model 要去 `index.js` 补一行注册，现在建文件就行；以前 model 里第一行永远是 `namespace: 'users'`，现在文件名就是 namespace；以前 `router.js` 手写一长串 `<Route>`，现在整个文件都不存在了。

`dva-immer` 那条值得单独说。开了之后 reducer 可以直接写 `state.list = payload`，不用再 `return { ...state, list: payload }`。嵌套三层以上的 state 用扩展运算符改起来是真的痛苦，immer 底层用 Proxy 拦截你的「修改」，最后产出一个新对象，写法像可变的，结果是不可变的。这个思路后来在整个 React 生态里铺开了，Redux Toolkit 的 `createSlice` 内置的就是同一套东西。

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

这里必须插一句时效性提醒。`umi-plugin-react` 是 umi 2 时代的聚合插件，后来的大版本里官方把这套整合并进了预设（preset）里，装完框架就自带，不用再手动往 `plugins` 里塞。所以上面这段配置在新版本上是抄不动的，具体的包名和配置项请以你项目里那个 umi 版本的官方文档为准，我不去猜。能沿用的是思路，dva 的整合在 umi 里始终是「一个可插拔的能力」，而不是内核的一部分。

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
- `/c` 的 `page model` 为 `src/pages/c/model.js`
- `/c/d` 的 `page model` 为 `src/pages/c/model.js`, `src/pages/c/d/models/d.js`

这套规则里有一条容易被漏掉，「`global model` 全量载入，`page model` 在 production 时按需载入，在 development 时全量载入」。开发和生产的行为不一样，意味着有些问题只在打包后才出现。最典型的是跨页面引用页面 model，比如在 `/a` 的组件里读 `state.b`，开发时 b 的 model 全量注册着，能读到；上线之后没进过 `/b` 页面，那个 model 根本没注册，读出来是 `undefined`，页面直接白屏。要共享的数据老老实实提到 `src/models/` 里去。

回到主线，这就是 umi 给 dva 项目带来的全部改变，路由不用写了，model 不用注册了，namespace 跟着文件名走，按需加载白送。model 内部怎么写一点没变，state 还是那个 state，effect 还是 generator，`put` 和 `call` 也还是 redux-saga 那一套。

## 八、问题汇总

下面这几个是我当年迁移时真正卡住过的问题，也是社区里问得最多的几个。

**1、如何配置 onError、initialState 等 hook？**

裸 dva 里这些是传给 `dva({...})` 的，可 umi 把创建实例这一步藏起来了，你根本没有那个入口。答案还是约定，约定一个文件名给你放这些配置。

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

`onError` 这个 hook 我建议第一天就配上。effect 里不写 try/catch 的话请求挂了是静默失败的，页面一直转圈，用户什么提示都看不到，配一个全局的 `message.error` 能省掉后面无数次「我这边点了没反应」的沟通。

**2、url 变化了，但页面组件不刷新，是什么原因？**

> `layouts/index.js` 里如果用了 `connect` 传数据，需要用 `umi/withRouter` 高阶一下

```javascript
import withRouter from 'umi/withRouter';

export default withRouter(connect(mapStateToProps)(LayoutComponent));
```

这个问题的根因在 `connect` 的性能优化上。react-redux 的 `connect` 默认给组件做了浅比较，state 没变就不重新渲染，可路由变化并不会改动你 `mapStateToProps` 里那几个字段，于是 layout 拿着旧的 `location` 一动不动，下面的菜单高亮、面包屑就全不对了。`withRouter` 的作用是把路由变化也变成 props 的变化，把这层拦截打开。

顺序也别写反，`withRouter` 要在最外层。写成 `connect(...)(withRouter(Layout))` 就没用了，因为拦截你的那个 `connect` 还在外面。这条同样适用于任何被 `connect` 包过又依赖路由的组件，不只是 layout。

**3、如何访问到 store 或 dispatch 方法？**

```javascript
window.g_app._store
window.g_app._store.dispatch
```

下划线开头就是在告诉你这是私有的，不保证向后兼容。调试时在控制台里敲敲没问题，业务代码里别这么写，正经路子是 `connect` 注入的 `dispatch`。真有那种脱离 React 树的场景（比如 axios 拦截器里收到 401 想清空用户信息），也尽量改成事件通知或者让 subscription 去订阅，别直接摸全局 store。

**4、如何禁用包括 component 和 models 的按需加载？**

> 在 `.umirc.js` 里配置：

```javascript
export default {
  disableDynamicImport: true,
};
```

什么时候会想关掉它？内网的中后台系统，用户不多、带宽管够、页面数量也就几十个，拆成一堆小 chunk 反而让每次跳转都多一次网络往返。整包一次下完，之后全在本地跑，体感更顺。公网项目就别关了，首屏体积会很难看。

**如果不用page.js的命名，倒是能生成路由，但是model、service、components就全部变路由了**

这就是第三节里说的那条约定咬人了，`pages` 下所有 `(j|t)sx?` 文件都是路由，没有例外。

> 不用 page.js，然后通过 umi-plugin-routes 过滤掉不需要的路由，参考 https://github.com/zuiidea/antd-admin/blob/develop/.umirc.js#L4-L16

除了插件过滤，还有两个更省事的办法。一是把非路由文件放进 `models/`、`services/`、`components/` 这些 umi 认识的子目录里，它们不会被当成路由；二是文件名前面加下划线，`_utils.js` 这种，umi 约定下划线开头的文件跳过。我自己更常用第二种，改个文件名就完事，不用引第三方插件。

**.umirc.mock.js 这个文件怎么配置呢？**

> 可以不用配置，在 mock/ 下建文件写 mock 代码即可。

这是从 roadhog 迁过来的人最常问的，roadhog 时代 mock 配置确实写在 `.roadhogrc.mock.js` 里，umi 换成了目录约定。两套东西的写法思路是一脉相承的，只是从「写配置」变成了「建文件」，整个 umi 的设计取向都在这句话里。

## 九、Demo

上面所有配置我当年攒了一个可以直接跑的最小仓库，路由、model 自动注册、mock 都配好了，clone 下来 `yarn && yarn start` 就能起。

> https://github.com/poetries/umi-tmp

## 总结

umi 对 dva 项目的改造集中在三处，路由从手写变成目录约定，model 从手动 `app.model` 变成自动加载，构建配置从一堆散文件收进一个 `.umirc.js`。省下来的都是重复劳动，而不是抽象了什么新概念，所以从裸 dva 迁过来的成本很低，model 里的代码基本一行不用改。

真正需要拿主意的其实就一个，约定式还是配置式。菜单树复杂、权限跟路由强绑定的中后台，配置式更省心；页面之间关系简单的，约定式建个文件就能跑，爽得多。两者互斥，中途切换要重写整份路由，所以这个决定最好在项目开头就下。

至于现在还要不要开新项目用这套。umi 本身一直在更新，做中后台仍然是个靠谱的选择，但这篇里的 `umi/link`、`umi/router`、`umi-plugin-react` 都是 umi 2 的写法，新版本上直接抄会报错，请对着你那个版本的官方文档改导入语句。dva 这边的情况更明确一些，社区活跃度这几年一直在往下走，React 生态现在的主流做法是分层，服务端数据交给 TanStack Query 这类请求库管缓存和重试，客户端状态用 Redux Toolkit 或者 Zustand，两边各管各的，比把所有东西塞进一个 model 更清爽。这几种方案怎么选，我在 [React 状态管理方案对比](https://feinterview.poetries.top/blog/react-state-management-comparison) 里单独算过账。

老项目就别折腾了。dva 加 umi 跑得好好的中后台，重构的收益远比不上风险，把这篇当维护手册用就行。

## 参考

- [Umi config配置](https://umijs.org/zh/config/#%E5%9F%BA%E6%9C%AC%E9%85%8D%E7%BD%AE)
- [Umi APi](https://umijs.org/zh/api/)
- [Umi插件](https://umijs.org/zh/plugin/)
- [使用 umi 改进 dva 项目开发](https://github.com/sorrycc/blog/issues/66)
- [umi 官网](https://umijs.org/)
- [dva 官方文档](https://dvajs.com/)
- [前端进阶之旅](https://interview.poetries.top)
