---
title: Ant Design Pro总结篇，中后台脚手架的目录约定与常用能力
date: 2018-09-17 00:10:23
description: 把 Ant Design Pro 的目录约定、布局体系、路由和菜单的中心化配置、样式方案、请求分层、图表与业务图标、权限管理和构建发布梳理成一份可查的实践笔记，并说明这些约定在新版本里的变化。
tags: 
  - Dva
  - Umi
  - Ant Design
  - React
  - 中后台
categories: Front-End
---

中后台项目最没意思的部分是开头那两周：搭框架、配路由、写登录、做权限、调布局、接 mock。每个公司做一遍，每个人做一遍，做出来的东西还都差不多。Ant Design Pro 干的事就是把这两周的活儿预置好，你 clone 下来直接从第三周开始写业务。

这篇是我 2018 年用 Pro 做项目时整理的总结，覆盖目录结构、布局体系、路由和菜单的中心化配置、CSS Modules、请求分层、图表、业务图标、权限管理和构建发布。原文的写法和当时的 API 我原样保留着，另外在每一块后面补了它现在变成什么样，因为 antd 已经到 v5/v6，umi 也翻过好几个大版本，照着 2018 年的文档写新项目会踩坑。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Pro 的目录约定分成哪几层，每一层放什么
- 三套内建布局怎么和路由配置绑在一起，什么时候需要自己加一套
- `router.config.js` 中心化管理路由和菜单的思路，以及带参数路由的处理
- 新增一个页面完整要动哪些文件
- CSS Modules 的原理、`:global` 的用法和样式文件的分类
- 从 UI 交互到服务端的完整链路，service 和 model 怎么分层
- 图表、业务图标、mock 联调这些日常需求的标准做法
- `Authorized` 权限组件的四种用法和登录后刷新权限的时机
- 构建发布、跨域代理、effect 里并发请求这几个实际问题
- 这套脚手架在 antd v5/v6 和新版 umi 下变成了什么样

## 一、简介

### 1.1 ant pro系统特性

- 基于 `Ant Design` 体系精心设计
- 使用 `React/umi/dva/antd` 等前端前沿技术开发
- 针对不同屏幕大小设计
- 可配置的主题满足多样化的品牌诉求
- `Mock` 数据实用的本地数据调试方案

这五条里，「可配置的主题」和「Mock 数据」是当年最省事的两块。主题变量改一行全站换色，mock 让前端不用等后端就能把页面做完。

### 1.2 模板

Pro 预置的页面模板是它真正的价值所在。这些不是空壳，每一个都带完整的交互和 mock 数据，做需求的时候找一个最接近的直接改，比从零写快得多。

```
- Dashboard
  - 分析页
  - 监控页
  - 工作台
- 表单页
  - 基础表单页
  - 分步表单页
  - 高级表单页
- 列表页
  - 查询表格
  - 标准列表
  - 卡片列表
  - 搜索列表（项目/应用/文章）
- 详情页
  - 基础详情页
  - 高级详情页
- 结果
  - 成功页
  - 失败页
- 异常
  - 403 无权限
  - 404 找不到
  - 500 服务器出错
- 个人页
  - 个人中心
  - 个人设置
- 帐户
  - 登录
  - 注册
  - 注册成功
```

异常页那三个（403/404/500）建议一开始就留着，请求拦截器里跳转要用。个人页和账户页用不上可以直接删，删之前记得同步删掉 `router.config.js` 里对应的配置，否则菜单会指向不存在的组件。

### 1.3 使用

两种起项目的方式，直接 clone 仓库或者用官方 cli。`--depth=1` 那个参数是只拉最近一次提交，Pro 的仓库历史很大，不加这个下载会很慢。

```npm
$ git clone --depth=1 https://github.com/ant-design/ant-design-pro.git my-project
$ cd my-project
```

或者

```npm
$ npm install ant-design-pro-cli -g
$ mkdir my-project && cd my-project
$ pro new  # 安装脚手架
```

### 1.4 目录结构

目录结构是整个脚手架的地图，摸清楚它，后面「这段代码该放哪」的问题就不用再想了。

整个项目的目录结构

```
├── mock                     # 本地模拟数据
├── node_modules             # 依赖库
├── public
│   ├── favicon.ico          # Favicon
│   └── index.html           # HTML 入口模板
├── src
│   ├── common               # 应用公用配置，如导航信息
│   ├── components           # 业务通用组件
│   ├── e2e                  # 集成测试用例
│   ├── layouts              # 通用布局
│   ├── models               # dva model
│   ├── routes               # 业务页面入口和常用模板
│   ├── services             # 后台接口服务
│   ├── utils                # 工具库
│   ├── g2.js                # 可视化图形配置
│   ├── polyfill.js          # 兼容性垫片
│   ├── theme.js             # 主题配置
│   ├── index.js             # 应用入口
│   ├── index.less           # 全局样式
│   └── router.js            # 路由入口
├── tests                    # 测试工具
├── .editorconfig            # 编辑器配置
├── .eslintrc                # js代码检测工具
├── .ga                      # 未知
├── .gitignore               # git版本配置
├── .roadhogrc               # roadhog配置
├── .roadhogrc.mock.js       # roadhog的模拟配置
├── .stylelintrc             # css代码审查配置
├── .travis.yml              # travis持续构建工具配置
├── package.json             # web前端项目配置文件
├── README.md
└──
```

这份结构里最该记住的是 `src` 下面那六个目录的分工。`routes` 是页面（后来改叫 `pages`），`components` 是可复用的业务组件，`layouts` 是页面外框，`models` 是 dva 数据流，`services` 是接口封装，`utils` 是工具函数。这条分层跟 dva 的实践是一脉相承的，model、service 怎么分工我在 [Dva实践总结](https://feinterview.poetries.top/blog/dva) 里展开写过。

顺带说下现在的情况。Pro 后来的版本把 `routes` 改成了 `pages`（跟 umi 的约定对齐），路由配置从 `src/router.js` 挪到了 `config/routes.ts`，整个项目默认用 TypeScript，还多了 `src/access.ts` 这类约定文件。目录名对不上不代表这篇过时，分层的思路是一样的，只是位置换了。

### roadhog摘要介绍

- `roadhog` 是一个 `cli` 工具，提供 `server`、 `build` 和 test 三个命令，分别用于本地调试和构建，并且提供了特别易用的 mock 功能。命令行体验和 `create-react-app` 一致，配置略有不同，比如默认开启 `css` `modules`，然后还提供了 `JSON` 格式的配置方式。
- 重点介绍`roadhog`有关的几个配置项，主要是在`ant design pro`的代码中用到了这些配置项

**entry**

- 指定 `webpack` 入口文件，支持 `glob `格式。
- 如果你的项目是多页类型，会希望把 `src/pages `的文件作为入口。可以这样配：

```
"entry": "src/pages/*.js"
```

**env**

> 针对特定的环境进行配置。`server` 的环境变量是 `development`，`build` 的环境变量是` production`。

比如：

```javascript
"extraBabelPlugins": ["transform-runtime"],
"env": {
  "development": {
    "extraBabelPlugins": ["dva-hmr"]
  }
}
```

> 这样，开发环境下的 `extraBabelPlugins` 是 `["transform-runtime", "dva-hmr"]`，而生产环境下是 `["transform-runtime"]`。

```javascript
"env": {
  "development": {
    "extraBabelPlugins": [
      "dva-hmr",
      "transform-runtime",
      "transform-decorators-legacy",
      "transform-class-properties",
      ["import", { "libraryName": "antd", "style": true }]
    ]
  },
  "production": {
    "extraBabelPlugins": [
      "transform-runtime",
      "transform-decorators-legacy",
      "transform-class-properties",
      ["import", { "libraryName": "antd", "style": true }]
    ]
  }
}
```

> 在这段代码中，开发环境和生产环境分别配置，其中开发环境使用了`dva-hmr`插件

那几个 babel 插件各有分工，`transform-decorators-legacy` 支持 `@connect` 这类装饰器语法，`transform-class-properties` 支持类属性写法（`state = {}` 而不用写在构造函数里），`import` 就是 antd 的按需加载。开发环境多出来的 `dva-hmr` 负责 model 的热更新，改 reducer 不用刷新页面。

roadhog 这个工具现在已经不用了，它的能力被 umi 吸收进去，Pro 从比较早的版本起就直接用 umi 构建，配置文件也从 `.roadhogrc` 换成了 `config/config.ts`。上面这段留着是给你看老项目用的，新项目不会再出现 `.roadhogrc`。同理，antd v5 开始换成 cssinjs 之后，`babel-plugin-import` 也不需要配了。

## 二、布局

> 页面整体布局是一个产品最外层的框架结构，往往会包含导航、页脚、侧边栏、通知栏以及内容等。在页面之中，也有很多区块的布局结构。在真实项目中，页面布局通常统领整个应用的界面，有非常重要的作用

### 2.1 Ant Design Pro 的布局

> 在 Ant Design Pro 中，我们抽离了使用过程中的通用布局，都放在 `layouts` 目录中，分别为

**BasicLayout：基础页面布局，包含了头部导航，侧边栏和通知栏**

![Ant Design Pro 的 BasicLayout 基础布局效果图，左侧深色侧边栏菜单，顶部导航条和用户信息区，右侧为内容区](https://gw.alipayobjects.com/zos/rmsportal/oXmyfmffJVvdbmDoGvuF.png)

绝大多数业务页面都跑在这套布局里，登录之后看到的就是它。

**UserLayout：抽离出用于登陆注册页面的通用布局**

![Ant Design Pro 的 UserLayout 布局效果图，居中的登录注册表单，顶部为产品 logo 和标题，底部为页脚链接](https://gw.alipayobjects.com/zos/rmsportal/mXsydBXvLqBVEZLMssEy.png)

登录、注册、注册成功这几个页面用它，因为这些页面不该有侧边栏和菜单，用户还没登录呢。

**BlankLayout：空白的布局**

第三套是空白布局，什么都不加。适合做全屏的大屏展示页，或者要嵌到别人 iframe 里的页面。

### 2.2 如何使用 Ant Design Pro 布局

> 通常布局是和路由系统紧密结合的，Ant Design Pro 的路由使用了 `Umi` 的路由方案，为了统一方便的管理路由和页面的关系，我们将配置信息统一抽离到 `config/router.config.js` 下，通过如下配置定义每个页面的布局

```javascript
module.exports = [{
  path: '/',
  component: '../layouts/BasicLayout',  // 指定以下页面的布局
  routes: [
    // dashboard
    { path: '/', redirect: '/dashboard/analysis' },
    {
      path: '/dashboard',
      name: 'dashboard',
      icon: 'dashboard',
      routes: [
        { path: '/dashboard/analysis', name: 'analysis', component: './Dashboard/Analysis' },
        { path: '/dashboard/monitor', name: 'monitor', component: './Dashboard/Monitor' },
        { path: '/dashboard/workplace', name: 'workplace', component: './Dashboard/Workplace' },
      ],
    },
  ],
}]
```

看这段配置的结构，最外层那条 `component: '../layouts/BasicLayout'` 就是布局，它下面 `routes` 数组里的所有页面都会被套进这个布局渲染。**布局在 Pro 里不是一个你在页面里引入的组件，而是路由表里的一个父节点**，这是理解整套机制的关键。

Pro 用的是 umi 的配置式路由而不是约定式，因为中后台需要给每条路由挂菜单名、图标、权限这些额外信息，纯靠文件目录表达不了。umi 两种路由模式的差别我在 [使用 umi 改进 dva 项目开发](https://feinterview.poetries.top/blog/umi-dva) 里对比过。

> 更多 Umi 的路由配置方式可以参考：[Umi 配置式路由]( https://umijs.org/guide/router.html#%E9%85%8D%E7%BD%AE%E5%BC%8F%E8%B7%AF%E7%94%B1)

### 2.3 Pro 扩展配置

> 我们在 `router.config.js` 扩展了一些关于 `pro` 全局菜单的配置

```javascript
{
  name: 'dashboard',
  icon: 'dashboard',
  hideInMenu: true,
  hideChildrenInMenu: true,
  hideInBreadcrumb: true,
  authority: ['admin'],
}
```

- `name`: 当前路由在菜单和面包屑中的名称，注意这里是国际化配置的 `key`，具体展示菜单名可以在 `/src/locales/zh-CN.js` 进行配置。
- `icon`: 当前路由在菜单下的图标名。
- `hideInMenu`: 当前路由在菜单中不展现，默认 `false`。
- `hideChildrenInMenu`: 当前路由的子级在菜单中不展现，默认 `false`。
- `hideInBreadcrumb`: 当前路由在面包屑中不展现，默认 `false`。
- `authority`: 允许展示的权限，不设则都可见，详见：权限管理

这几个扩展字段是 Pro 加的，不是 umi 原生的。它们的作用是让一份路由配置同时喂给三个消费者：路由系统、侧边栏菜单、面包屑。一处配置三处生效，加页面的时候少改两个地方。

`name` 那条注释要看仔细，它填的是国际化的 key 不是中文标题，实际显示的文案在 `src/locales/zh-CN.js` 里。这个我踩过，直接把中文写进 `name`，菜单上显示的就是那串中文原样，看着没问题，等要出英文版的时候才发现全都得返工。

`hideInMenu` 和 `hideChildrenInMenu` 的区别也容易混，前者是这条路由自己不出现在菜单里（比如详情页、编辑页），后者是自己在但子级不展开（比如分步表单，菜单上只留一个入口）。

### 2.4 Ant Design 布局组件

> 除了 Pro 里的内建布局以为，在一些页面中需要进行布局，可以使用 Ant Design 目前提供的两套布局组件工具：`Layout` 和 `Grid`

**Grid 组件**

> - 栅格布局是网页中最常用的布局，其特点就是按照一定比例划分页面，能够随着屏幕的变化依旧保持比例，从而具有弹性布局的特点。
> - 而 Ant Design 的栅格组件提供的功能更为强大，能够设置间距、具有支持响应式的比例设置，以及支持 flex 模式，基本上涵盖了大部分的布局场景 https://ant.design/components/grid/

**Layout 组件**

> 如果你需要辅助页面框架级别的布局设计，那么 Layout 则是你最佳的选择，它抽象了大部分框架布局结构，使得只需要填空就可以开发规范专业的页面整体布局 https://ant.design/components/layout-cn/

- 根据不同场景区分抽离布局组件
在大部分场景下，我们需要基于上面两个组件封装一些适用于当下具体业务的组件，包含了通用的导航、侧边栏、顶部通知、页面标题等元素。例如 Ant Design Pro 的 `BasicLayout`。
- 通常，我们会把抽象出来的布局组件，放到跟 pages、 components 平行的 layouts 文件夹中方便管理。需要注意的是，这些布局组件和我们平时使用的其它组件并没有什么不同，只不过功能性上是为了处理布局问题

最后这句话点破了一层窗户纸，布局组件没有任何特殊性，它就是个普通 React 组件，特殊的是它在路由表里的位置。放进 `layouts` 目录纯粹是为了好找。

补一句现在的情况。Pro 后来把 `BasicLayout` 这套抽成了独立的包 `@ant-design/pro-layout`，你不用再改脚手架里那几百行布局代码，直接传配置就行。整套 ProComponents（ProLayout、ProTable、ProForm）是 Pro 这几年最大的变化，中后台的表格和表单基本不用手写了。

## 三、路由和菜单

> 路由和菜单是组织起一个应用的关键骨架，pro 中的路由为了方便管理，使用了中心化的方式，在 `router.config.js` 统一配置和管理

中心化这个决定值得多说两句。umi 本身主推的是约定式路由，文件放对位置路由就有了，但 Pro 反过来选了配置式。原因很直接，中后台的菜单树、面包屑、权限都要跟路由一一对应，这些信息塞不进文件名，与其分散在各处不如集中在一个文件里。

代价是加页面必须改这个文件，多人协作时它是冲突高发区。我的经验是按业务模块把 `router.config.js` 拆成几个数组再合并，冲突面积能小很多。

### 3.1 基本结构

- **路由管理** 通过约定的语法根据在 `router.config.js` 中配置路由。
- **菜单生成** 根据路由配置来生成菜单。菜单项名称，嵌套路径与路由高度耦合。
- **面包屑** 组件 [PageHeader](https://pro.ant.design/components/PageHeader-cn) 中内置的面包屑也可由脚手架提供的配置信息自动生成

#### 3.1.1 路由

> 目前脚手架中所有的路由都通过 `router.config.js` 来统一管理，在 `umi` 的配置中我们增加了一些参数，如`name`,`icon`,`hideChildren`,`authority`，来辅助生成菜单。其中

- `name` 和 `icon`分别代表生成菜单项的图标和文本。
- `hideChildren` 用于隐藏不需要在菜单中展示的子路由。用法可以查看 分步表单 的配置。
- `hideInMenu` 可以在菜单中不展示这个路由，包括子路由。效果可以查看 `exception/trigger`页面。
- `authority` 用来配置这个路由的权限，如果配置了将会验证当前用户的权限，并决定是否展示

一份配置喂三个消费者，路由、菜单、面包屑各取所需，这是这套设计最省心的地方。缺点是耦合，菜单结构被路由结构绑死了，如果产品要求菜单顺序和 URL 层级不一致，你就得另外想办法。

#### 3.1.2 菜单

> 菜单根据 `router.config.js` 生成，具体逻辑在 `src/layouts/BasicLayout` 中的 `formatter` 方法实现

- 如果你的项目并不需要菜单，你可以直接在` BasicLayout` 中删除 `SiderMenu` 组件的挂载。并在 `src/layouts/BasicLayout` 中 设置 `const MenuData = []`。
- 如果你需要从服务器请求菜单，可以将` menuData `设置为 `state`，然后通过网络获取来修改了 `state`

第二条是真实项目里迟早会遇到的需求。权限系统一旦做细，菜单就不能写死在前端，得登录后向后端要。这时候路由表还是本地的（因为组件路径要打包时就确定），只有菜单数据从接口来，两边靠 `path` 对齐。

这里有个坑：菜单是异步来的，首屏渲染时 `menuData` 是空数组，如果你的布局组件没处理这个中间态，用户会先看到一个没有菜单的空框再突然弹出来。加个 loading 或者骨架屏能解决。

#### 3.1.3 面包屑

> 面包屑由 `PageHeaderLayout` 实现，`MenuContext` 将 根据 `MenuData` 生成的 `breadcrumbNameMap` 通过` props` 传递给了 `PageHeader`，如果你要做自定义的面包屑，可以通过修改传入的 `breadcrumbNameMap` 来解决

`breadcrumbNameMap` 示例数据如下：

```javascript
{
  '/': { path: '/', redirect: '/dashboard/analysis', locale: 'menu' },
  '/dashboard/analysis': {
    name: 'analysis',
    component: './Dashboard/Analysis',
    locale: 'menu.dashboard.analysis',
  },
  ...
}
```

### 3.2 需求实例

#### 3.2.1 新增页面

> 脚手架默认提供了两种布局模板：基础布局 - `BasicLayout` 以及 账户相关布局 - `UserLayout`

![BasicLayout 基础布局效果图，业务页面默认套用这一套带侧边栏和顶部导航的框架](https://gw.alipayobjects.com/zos/rmsportal/oXmyfmffJVvdbmDoGvuF.png)

![UserLayout 账户布局效果图，登录注册这类页面套用的居中无菜单框架](https://gw.alipayobjects.com/zos/rmsportal/mXsydBXvLqBVEZLMssEy.png)

新增页面之前先问自己一句，这个页面属于上面哪种。答案是这两种之一的话，工作量就只有一条路由配置。

如果你的页面可以利用这两种布局，那么只需要在路由配置中增加一条即可

```javascript
 // app
  {
    path: '/',
    component: '../layouts/BasicLayout',
    routes: [
      // dashboard
      { path: '/', redirect: '/dashboard/analysis' },
      { path :'/dashboard/test',component:"./Dashboard/Test"},
    ...
},
```

> 加好后，会默认生成相关的路由及导航

#### 3.2.2 新增布局

> 在脚手架中我们通过嵌套路由来实现布局模板。`router.config.js` 是一个数组，其中第一级数据就是我们的布局，如果你需要新增布局可以在直接增加一个新的一级数组

数组第一级就是布局，这条规则记住之后整个配置文件就好读了。什么时候需要新增一级？比如做一个不需要登录的公开分享页，或者一个要嵌进第三方系统的纯净页面，这些页面的外框跟 BasicLayout 完全不同，套着改不如新开一套。

```javascript
module.exports = [
   // user
   {
    path: '/user',
    component: '../layouts/UserLayout',
    routes:[...]
   },
   // app
   {
    path: '/',
    component: '../layouts/BasicLayout',
    routes:[...]
   },
   // new
   {
    path: '/new',
    component: '../layouts/new_page',
    routes:[...]
   },
]
```

#### 3.2.3 带参数的路由

> 脚手架默认支持带参数的路由,但是在菜单中显示带参数的路由并不是个好主意，我们并不会自动的帮你注入一个参数，你可能需要在代码中自行处理

```javascript
{ 
    path: '/dashboard/:page',
    hideInMenu:true, 
    name: 'analysis', 
    component: './Dashboard/Analysis' 
},
```

你可以通过以下代码来跳转到这个路由

```javascript
import router from 'umi/router';

router.push('/dashboard/anyParams')

//or

import Link from 'umi/link';

<Link to="/dashboard/anyParams">go</Link>
```

> 在路由组件中，可以通过`this.props.match.params` 来获得路由参数

带参数的路由一定要配 `hideInMenu: true`，原因文档里说得比较委婉，实际情况是菜单项需要一个确定的跳转地址，而 `/dashboard/:page` 里的 `:page` 没有默认值，不隐藏的话点菜单会跳到一个字面量是冒号的错误路径上去。

再补一句现状。`this.props.match.params` 是 react-router v4/v5 的写法，v6 之后改成了 `useParams()` 这个 Hook，编程式跳转也从 `router.push` 换成了 `useNavigate`。老项目照这篇看没问题，新项目要按你所用的 react-router 版本文档来。

## 四、新增页面

> 这里的『页面』指配置了路由，能够通过链接直接访问的模块，要新建一个页面，通常只需要在脚手架的基础上进行简单的配置

### 4.1 新增 js、less 

> 在 `src/pages` 下新建页面的 `js` 及 `less` 文件，如果相关页面有多个，可以新建一个文件夹来放置相关文件

![在 src/pages 下新建页面目录的文件树截图，页面 js 文件与同名 less 文件放在一起](https://gw.alipayobjects.com/zos/rmsportal/hjDyFTVOgRwDzAIHApMO.png)

按图里这样把 js 和 less 放在一起、同名，是 Pro 的隐性约定。好处是删页面的时候一整个目录删掉就干净了，不会留下孤儿样式文件。

> 样式文件默认使用 CSS Modules，如果需要，你可以在样式文件的头部引入 antd 样式变量文件

```
@import "~antd/lib/style/themes/default.less";
```

引了这个文件之后，你就能在自己的 less 里直接用 `@primary-color`、`@border-color-base` 这类 antd 的变量，跟着主题走，换主题的时候不用回来改颜色值。

antd v5 之后这条不成立了。样式方案换成 cssinjs，less 变量那一套被 Design Token 取代，取主题色改成用 `theme.useToken()` 这样的 API 从 React 里拿。老项目的 less 变量写法在 v4 及以前有效，升到 v5 这块是要改的，具体迁移方式以官方迁移指南为准。

### 4.2 将文件加入菜单和路由

> 加入菜单和路由的方式请参照 路由和菜单 - 添加路由/菜单 中的介绍完成。加好后，访问 `http://localhost:8000/#/new` 就可以看到新增的页面了 https://pro.ant.design/docs/router-and-nav-cn#%E6%B7%BB%E5%8A%A0%E8%B7%AF%E7%94%B1/%E8%8F%9C%E5%8D%95

![新增页面后侧边栏菜单里出现对应菜单项、页面内容正常渲染的效果截图](https://gw.alipayobjects.com/zos/rmsportal/xZIqExWKhdnzDBjajnZg.png)

配好之后菜单项会自己长出来，就是图里这个效果，你不用去改任何菜单相关的代码。

### 4.3 新增 model、service

> 布局及路由都配置好之后，回到之前新建的 `NewPage.js`，可以开始写业务代码了！如果需要用到 `dva` 中的数据流，还需要在 `src/models src/services` 中建立相应的` model` 和 service，具体可以参考脚手架内置页面的写法

到这一步整理一下，新增一个页面完整要动四个地方：`pages` 下建 js 和 less，`router.config.js` 加一条路由，`models` 建 model，`services` 建接口封装。前两步是必须的，后两步看这个页面要不要跟服务端交互。model 内部怎么组织、effect 和 reducer 怎么分工，我在 [Dva实践总结](https://feinterview.poetries.top/blog/dva) 里按用户管理页完整走过一遍。

## 五、新增业务组件

> 对于一些可能被多处引用的功能模块，建议提炼成业务组件统一管理。这些组件一般有以下特征：

- 只负责一块相对独立，稳定的功能；
- 没有单独的路由配置；
- 可能是纯静态的，也可能包含自己的 state，但不涉及 dva 的数据流，仅受父组件（通常是一个页面）传递的参数控制。

第三条是这三条里最重要的。**业务组件不碰 dva，数据只从 props 来**，这条守住了，组件才能真正复用，才能被单独测试。一旦某个组件里出现了 `connect`，它就跟具体的 model 绑死了，换个页面用就得连 model 一起搬。

**新建文件**

> 在 `src/components` 下新建一个以组件名命名的文件夹，注意首字母大写，命名尽量体现组件的功能，这里就叫 `ImageWrapper`。在此文件夹下新增 js 文件及样式文件（如果需要），命名为 `index.js `和 `index.less`

- 在使用组件时，默认会在 `index.js` 中寻找 `export` 的对象，如果你的组件比较复杂，可以分为多个文件，最后在 `index.js `中统一 `export`，就像这样

```javascript
// MainComponent.js
export default ({ ... }) => (...);

// SubComponent1.js
export default ({ ... }) => (...);

// SubComponent2.js
export default ({ ... }) => (...);

// index.js
import MainComponent from './MainComponent';
import SubComponent1 from './SubComponent1';
import SubComponent2 from './SubComponent2';

MainComponent.SubComponent1 = SubComponent1;
MainComponent.SubComponent2 = SubComponent2;
export default MainComponent;
```

把子组件挂成主组件的静态属性，用起来就是 `<Card.Meta>` 这种形式。antd 自己大量用这个模式，好处是引入一次能拿到一整族组件，语义上也表达了从属关系。

你的代码大概是这个样子

```javascript
// index.js
import React from 'react';
import styles from './index.less';    // 按照 CSS Modules 的方式引入样式文件。

export default ({ src, desc, style }) => (
  <div style={style} className={styles.imageWrapper}>
    <img className={styles.img} src={src} alt={desc} />
    {desc && <div className={styles.desc}>{desc}</div>}
  </div>
);
```

```css
// index.less
.imageWrapper {
  padding: 0 20px 8px;
  background: #f2f4f5;
  width: 400px;
  margin: 0 auto;
  text-align: center;
}

.img {
  vertical-align: middle;
  max-width: calc(100% - 32px);
  margin: 2.4em 1em;
  box-shadow: 0 8px 20px rgba(143, 168, 191, 0.35);
}
```

**使用**

> 在要使用这个组件的地方，按照组件定义的 `API` 传入参数，直接使用就好，不过别忘了先引入

```javascript
import React from 'react';
import ImageWrapper from '@/components/ImageWrapper';  // @ 表示相对于源文件根目录

export default () => (
  <ImageWrapper
    src="https://os.alipayobjects.com/rmsportal/mgesTPFxodmIwpi.png"
    desc="示意图"
  />
);
```

那个 `@` 别名值得单独提一句，它指向 `src` 目录。有了它就不会再写出 `../../../components/xxx` 这种数不清有几层的相对路径，文件移动位置时引用也不用跟着改。umi 默认就配好了，自己搭的项目要在 webpack 或者 tsconfig 里配 alias。

## 六、样式

**less**

> Ant Design Pro 默认使用 less 作为样式语言

**CSS Modules**

在样式开发过程中，有两个问题比较突出

- 全局污染，CSS 文件中的选择器是全局生效的，不同文件中的同名选择器，根据 build 后生成文件中的先后顺序，后面的样式会将前面的覆盖；
- 选择器复杂，为了避免上面的问题，我们在编写样式的时候不得不小心翼翼，类名里会带上限制范围的标识，变得越来越长，多人开发时还很容易导致命名风格混乱，一个元素上使用的选择器个数也可能越来越多。

这两个问题在中后台项目里格外明显，页面多、人多、迭代快，靠命名规范约束是约束不住的，总有人图省事写个 `.title`。

> 为了解决上述问题，我们的脚手架默认使用 CSS Modules 模块化方案，先来看下在这种模式下怎么写样式

```
// example.js
import styles from './example.less';

export default ({ title }) => <div className={styles.title}>{title}</div>;
```

```
// example.less
.title {
  color: @heading-color;
  font-weight: 600;
  margin-bottom: 16px;
}
```

- 用 less 写样式好像没什么改变，只是类名比较简单（实际项目中也是这样），js 文件的改变就是在设置 `className` 时，用一个对象属性取代了原来的字符串，属性名跟 less 文件中对应的类名相同，对象从 less 文件中引入。
- 在上面的样式文件中，`.title` 只会在本文件生效，你可以在其他任意文件中使用同名选择器，也不会对这里造成影响。不过有的时候，我们就是想要一个全局生效的样式呢？可以使用 `:global`

```
// example.less
.title {
  color: @heading-color;
  font-weight: 600;
  margin-bottom: 16px;
}

/* 定义全局样式 */
:global(.text) {
  font-size: 16px;
}

/* 定义多个全局样式 */
:global {
  .footer {
    color: #ccc;
  }
  .sider {
    background: #ebebeb;
  }
}
```

> CSS Modules 的基本原理很简单，就是对每个类名（非 `:global` 声明的）按照一定规则进行转换，保证它的唯一性。如果在浏览器里查看这个示例的 dom 结构，你会发现实际渲染出来是这样的

```
<div class="title___3TqAx">title</div>
```

- 类名被自动添加了一个 `hash` 值，这保证了它的唯一性

所以你在浏览器里看到的类名跟源码里写的对不上，调试时想从 DevTools 反查是哪个文件写的，得靠 hash 前面那截原始类名去搜。这算是 CSS Modules 的一点代价。

`:global` 用来开天窗，写第三方组件的样式覆盖时必须用它，因为 antd 的 `.ant-tag` 这类类名不能被 hash 掉。用它的时候要克制，每加一条 `:global` 就是往全局污染回退一步。

**样式文件类别**

> 在一个项目中，样式文件根据功能不同，可以划分为不同的类别

- `src/index.less`

> 全局样式文件，在这里你可以进行一些通用设置，比如脚手架中自带的

```
html, body, :global(#root) {
  height: 100%;
}

body {
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

// temporary font size patch
:global(.ant-tag) {
  font-size: 12px;
}
```

- `src/utils/utils.less`

> 这里可以放置公共的样式函数供调用，比如清除浮动 `.clearfix`

- 模块样式

> 针对某个模块/页面生效的文件

这三类的边界很清楚，全局的（reset、body 设置、第三方样式覆盖）进 `index.less`，可复用的 mixin 和函数进 `utils.less`，剩下的都跟着组件走。判断标准是「这段样式换个项目还用得上吗」，用得上的往上提，用不上的留在原地。

现在这块的选择更多了，Tailwind、CSS-in-JS、原生 CSS Modules 各有各的拥趸，antd v5 自己也换到了 cssinjs。不过上面这条分类原则跟具体方案无关，用哪套都成立。

## 七、和服务端进行交互

**前端请求流程**

> 在 Ant Design Pro 中，一个完整的前端 UI 交互到服务端处理流程是这样的

- UI 组件交互操作；
- 调用 `model` 的 `effect`；
- 调用统一管理的 `service` 请求函数；
- 使用封装的 `request.js `发送请求；
- 获取服务端返回；
- 然后调用` reducer `改变 `state`；
- 更新 `model`

这七步值得背下来，中后台的每一次数据交互都是这条链路。排查问题的时候按这个顺序一站站看，组件有没有 dispatch、effect 有没有进、service 有没有发请求、reducer 有没有收到数据，很快就能定位到断在哪一环。

> 为了方便管理维护，统一的请求处理都放在 services 文件夹中，并且一般按照 model 维度进行拆分文件

```
services/
  user.js
  api.js
  ...
```

> 其中，`utils/request.js `是基于 `fetch` 的封装，便于统一处理 POST，GET 等请求参数，请求头，以及错误提示信息等

Pro 的 `request.js` 用的是 fetch，dva 官方示例里更多用 axios，两者选哪个不重要，重要的是有这么一层。它负责的事情是固定的那几样：统一前缀、带 token、统一处理 HTTP 状态码、统一弹错误提示、401 跳登录。基于 axios 的一份完整实现我在 [Dva实践总结](https://feinterview.poetries.top/blog/dva) 的第六节贴过，可以直接抄。

有一点要注意，`fetch` 在 HTTP 状态码是 4xx、5xx 的时候不会 reject，只有网络层面的错误才会。所以自己封装 fetch 必须手动检查 `response.ok`，否则错误会静默地流到业务代码里，这个跟 axios 的行为不一样。

```javascript
// services/user.js
import request from '../utils/request';

export async function query() {
  return request('/api/users');
}

export async function queryCurrent() {
  return request('/api/currentUser');
}

// models/user.js
import { queryCurrent } from '../services/user';
...
effects: {
  *fetch({ payload }, { call, put }) {
    ...
    const response = yield call(queryUsers);
    ...
  },
}
```

**处理异步请求**

> 在处理复杂的异步请求的时候，很容易让逻辑混乱，陷入嵌套陷阱，所以 `Ant Design Pro` 的底层基础框架 `dva `使用 `effect` 的方式来管理同步化异步请求

```javascript
effects: {
  *fetch({ payload }, { call, put }) {
    yield put({
      type: 'changeLoading',
      payload: true,
    });
    // 异步请求 1
    const response = yield call(queryFakeList, payload);
    yield put({
      type: 'save',
      payload: response,
    });
    // 异步请求 2
    const response2 = yield call(queryFakeList2, payload);
    yield put({
      type: 'save2',
      payload: response2,
    });
    yield put({
      type: 'changeLoading',
      payload: false,
    });
  },
},
```

这段代码里两个请求是串行的，第二个要等第一个回来才发。如果它们之间没有依赖关系，串行就是白白多等一倍时间，改成并发的写法见本文最后一节。

`changeLoading` 这一对手写 loading 其实可以省掉，装 `dva-loading` 插件之后框架会自动维护每个 effect 的 loading 状态，组件里直接读 `loading.effects['namespace/fetch']`。

## 八、引入外部模块

> 除了` antd `组件以及脚手架内置的业务组件，有时我们还需要引入其他外部模块，这里以引入富文本组件 `react-quill` 为例进行介绍

```
$ npm install react-quill --save
```

```javascript
import React from 'react';
import { Button, notification, Card } from 'antd';
import ReactQuill from 'react-quill'; 
import 'react-quill/dist/quill.snow.css';

export default class NewPage extends React.Component {
  state = {
    value: 'test',
  };

  handleChange = (value) => {
    this.setState({
      value,
    })
  };

  prompt = () => {
    notification.open({
      message: 'We got value:',
      description: <span dangerouslySetInnerHTML={{ __html: this.state.value }}></span>,
    });
  };

  render() {
    return (
      <Card title="富文本编辑器">
        <ReactQuill value={this.state.value} onChange={this.handleChange} />
        <Button style={{ marginTop: 16 }} onClick={this.prompt}>Prompt</Button>
      </Card>
    );
  }
}
```

这个例子里有两行值得留意。`import 'react-quill/dist/quill.snow.css'` 是手动引第三方组件的样式，很多人漏了这一行然后发现编辑器长得像个纯文本框。另一个是 `dangerouslySetInnerHTML`，富文本编辑器的产出是 HTML 字符串，要渲染就绕不开它，但内容如果来自用户输入，一定要在服务端做过 XSS 过滤再存，前端这层是拦不住的。

外部模块引进来之后打包体积会涨，中后台里富文本、图表、地图这几类库都不小，用之前先想清楚是不是每个页面都要加载它，能按需引入就按需引入。

## 九、图表

> Ant Design Pro 提供了由设计师精心设计抽象的图表类型，是在 `BizCharts` 图表库基础上的二次封装，同时提供了业务中常用的图表套件，可以单独使用，也可以组合起来实现复杂的展示效果

> 图表组件 https://pro.ant.design/components/Charts-cn/

**使用 Ant Design Pro 的图表**

Charts 图表套件是在 `components/Charts` 包中，引用到项目就像使用其它组件一样

```javascript
import { ChartCard, MiniBar } from '@/components/Charts';
import { Tooltip, Icon } from 'antd';

const visitData = [
  {
    x: "2017-09-01",
    y: 100
  },
  {
    x: "2017-09-02",
    y: 120
  },
  {
    x: "2017-09-03",
    y: 88
  },
  {
    x: "2017-09-04",
    y: 65
  }
];

ReactDOM.render(
  <ChartCard
    title="支付笔数"
    action={
      <Tooltip title="支付笔数反应交易质量">
        <Icon type="exclamation-circle-o" />
      </Tooltip>
    }
    total="6,500"
    contentHeight={46}
  >
    <MiniBar height={46} data={visitData} />
  </ChartCard>,
  mountNode
);
```

https://github.com/alibaba/BizCharts

`ChartCard` 加 `MiniBar` 这种组合是 Pro 抽出来的套件，卡片头、总数、迷你图、提示，Dashboard 上那一排指标卡片就是这么拼出来的，不用自己调样式。

**使用 BizCharts 绘制图表**

> 如果 `Ant Design Pro` 不能满足你的业务需求，可以直接使用 `BizCharts` 封装自己的图表组件。

```
npm install bizcharts --save
```

```javascript
import { Chart, Axis, Tooltip, Geom } from 'bizcharts';

const data = [...];

<Chart height={400} data={data} forceFit>
  <Axis name="month" />
  <Axis name="temperature" label={{ formatter: val => `${val}°C` }} />
  <Tooltip crosshairs={{ type : "y" }} />
  <Geom type="line" position="month*temperature" size={2} color={'city'} />
  <Geom type='point' position="month*temperature" size={4} color={'city'} />
</Chart>
```

BizCharts 这套 API 是把图表拆成 `Axis`、`Tooltip`、`Geom` 这些 React 组件来声明，跟直接写 G2 的命令式配置比更贴近 React 的写法。`forceFit` 那个属性是自适应容器宽度，做响应式布局必开，不然窗口一缩图表就溢出去了。

图表这块后来变化不小，阿里系的推荐方案换成了 `@ant-design/charts`（底层是 G2Plot），开箱即用的图表类型更多，配置也更简单。BizCharts 仍然可用，新项目选哪个以官方文档当前的推荐为准。

## 十、业务图标

> 通常情况下，你可以通过 `Ant Design` 提供的 `<Icon />` 图标组件来使用 Ant Design 官方图标。基本使用方式如下：

```
<Icon type="heart" style={{ fontSize: '16px', color: 'hotpink' }} />
```

这种用字符串指定图标的写法在 antd v4 之后不再支持了。图标被拆成了独立的 `@ant-design/icons` 包，改成按组件引入（比如 `import { HeartOutlined } from '@ant-design/icons'`），好处是能做 tree shaking，不用把整套图标字体打进包里。老项目升级时这块的改动量不小，是要提前评估的。

> 如果你没有在 `Ant Design` 官方图标中找到需要的图标，可以到 `iconfont.cn` 上采集并生成自己的业务图标库，再进行使用

**生成图标库代码**

- 首先，搜索并找到你需要的图标，将它采集到你的购物车里，在购物车里，你可以将选中的图标添加到项目中（没有的话，新建一个），后续生成的资源/代码都是以项目为维度的。
- 如果你已经有了设计稿，只是需要生成相关代码，可以上传你的图标后，再进行上面的操作

![iconfont.cn 上把选中的图标加入购物车并添加到项目的操作界面截图](https://gw.alipayobjects.com/zos/rmsportal/jJQYzRyqVFBBamUOppXH.png)

图里这个「购物车」的比喻挺形象，先挑图标丢进车里，再一次性结算成一个项目。以项目为维度生成资源这一点很关键，后面加新图标只要重新生成，线上引用的地址不用换。

> 来到刚才选中的项目页，点击『生成代码』的链接，会在下方生成不同引入方式的代码，下面会分别介绍

![iconfont 项目页生成代码的界面截图，提供 Unicode、Font class、Symbol 三种引入方式的代码片段](https://gw.alipayobjects.com/zos/rmsportal/DbDSgiRukSANKWyhULir.png)

这一步生成的是一个 js 地址，把它记下来，下面配置的时候要用。

**引入**

- 有三种引入方式供你选择：`SVG Symbol`、`Unicode` 及 `Font class`。我们推荐在现代浏览器下使用 `SVG Symbol `方式引入。

> SVG 符号引入是现代浏览器未来主流的图标引入方式。其方法是预先加载符号，在合适的地方引入并渲染为矢量图形。有如下特点：

- 支持多色图标，不再受到单色图标的限制
- 通过一些技巧，支持像字体那样，通过 `font-size`、`color` 来调整样式
- 支持IE 9+ 及现代浏览器

多色图标这条是选 Symbol 而不选字体方案的主要理由。Font class 和 Unicode 走的是字体渲染，一个字形只有一种颜色，双色或者多色的品牌图标做不了。

> 切换到 `Symbol` 页签，复制项目生成的地址代码：

```
//at.alicdn.com/t/font_405362_lyhvoky9rc7ynwmi.js
```

加入图标样式代码，如果没有特殊的要求，你可以直接复用 Ant Design 图标的样式

```
.icon {
  width: 1em;
  height: 1em;
  fill: currentColor;
  vertical-align: -.125em;
}
```

挑选相应图标并获取类名，应用于页面

```
<svg class="icon" aria-hidden="true">
    <use xlink:href="#icon-ali-pay"></use>
</svg>
```

你也可以通过使用 Ant Design 图标组件提供的 `Icon.createFromIconfontCN({...})` 方法来更加方便地使用图标，使用方式如下：


```
import { Icon } from 'antd';

const IconFont = Icon.createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/font_405362_lyhvoky9rc7ynwmi.js'
});

export default IconFont;
```

之后可以像使用 `<Icon />` 组件一样方便地使用，支持配置样式

```
<IconFont type="icon-ali-pay" style={{ fontSize: '16px', color: 'lightblue' }} />
```

> 了解更多用法 https://pro.ant.design/docs/biz-icon-cn#%E4%BA%8C%E3%80%81%E5%BC%95%E5%85%A5

`createFromIconfontCN` 这个方法是我推荐的用法，它把 iconfont 的 svg symbol 包成了一个跟 antd `Icon` 一模一样的组件，业务代码里用起来毫无差别，样式、大小、颜色都能接。缺点是那个 `scriptUrl` 是外链，内网部署或者 CDN 挂了图标就全没了，对可用性要求高的项目建议把 js 文件下载下来自己托管。

antd v4 之后这个方法从 `Icon` 上挪到了 `@ant-design/icons` 包里，名字还叫 `createFromIconfontCN`，导入路径变了。

## 十一、Mock 和联调

> Mock 数据是前端开发过程中必不可少的一环，是分离前后端开发的关键链路。通过预先跟服务器端约定好的接口，模拟请求数据甚至逻辑，能够让前端开发独立自主，不会被服务端的开发所阻塞

- 在 `Ant Design Pro` 中，因为我们的底层框架是 `umi`，而它自带了代理请求功能，通过代理请求就能够轻松处理数据模拟的功能

**使用 umi 的 mock 功能**

> umi 里约定 mock 文件夹下的文件即 mock 文件，文件导出接口定义，支持基于 require 动态分析的实时刷新，支持 ES6 语法，以及友好的出错提示

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

> 当客户端（浏览器）发送请求，如：`GET /api/users`，那么本地启动的 umi dev 会跟此配置文件匹配请求路径以及方法，如果匹配到了，就会将请求通过配置处理，就可以像样例一样，你可以直接返回数据，也可以通过函数处理以及重定向到另一个服务器

了解更多 https://pro.ant.design/docs/mock-api-cn#%E4%BD%BF%E7%94%A8-umi-%E7%9A%84-mock-%E5%8A%9F%E8%83%BD

mock 这套约定我在 [使用 umi 改进 dva 项目开发](https://feinterview.poetries.top/blog/umi-dva) 里写得更细，包括怎么用 Mock.js 生成随机数据、怎么模拟网络延迟、怎么处理跨域头。Pro 这块完全复用 umi 的能力，没有额外的东西。

联调阶段最省事的做法是把 mock 文件留着别删，通过配置切换走 mock 还是走真实代理。后端接口挂了的时候你还能继续开发，这个习惯救过我不止一次。

## 十二、主题定制

> 我们基于 Ant Design React 进行开发，完全支持官方提供的 less 变量定制功能. 你可以在脚手架目录中找到 `config/config.js` 代码类似这样

```
...
theme: {
  'font-size-base': '14px',
  'badge-font-size': '12px',
  'btn-font-size-lg': '@font-size-base',
  'menu-dark-bg': '#00182E',
  'menu-dark-submenu-bg': '#000B14',
  'layout-sider-background': '#00182E',
  'layout-body-background': '#f0f2f5',
};
...
```

改一个 `@primary-color` 全站的按钮、链接、选中态就跟着变了，这是 less 变量方案最爽的地方。要注意这套定制是编译期生效的，改完得重启 dev server，运行时切主题它做不到。

antd v5 之后主题定制换成了 Design Token 加 `ConfigProvider` 的 `theme` 属性，可以在运行时动态切换，暗色模式也是官方支持的。配置项名字跟上面这份 less 变量表对不上，升级时这块要重写，具体以官方主题文档为准。

## 十三、权限管理

> 只需要在配置菜单的时候配置上准入身份，在登录成功以后获取到登陆者身份以后更新登录人身份参数即可

权限是中后台绕不开的一块，也是最容易做歪的一块。先说清楚边界：**前端做的权限控制只是体验优化，不是安全措施**。菜单藏了、按钮灰了，用户照样能直接调接口，真正的拦截必须在服务端。前端的目标是让用户看不到他用不了的东西，仅此而已。


### 权限组件 Authorized

> 这是脚手架权限管理的基础，基本思路是通过比对当前权限与准入权限，决定展示正常渲染内容还是异常内容

整套机制归纳起来就一个比对：当前用户有什么身份，这块内容要求什么身份，对得上渲染内容，对不上渲染异常。剩下的都是这个比对的不同包装形式（组件、HOC、装饰器、函数）。

**控制菜单和路由显示**

> 如需对某些页面进行权限控制，只须在路由配置文件 `router.config.js` 中设置 `authority` 属性即可，代表该路由的准入权限，pro 的路由系统中会默认包裹 `Authorized` 进行判断处理。

```javascript
{
  path: '/form',
  icon: 'form',
  name: 'form',
  routes:[{
    path: '/form/basic-form',
    name: 'basicform',
    component: './Forms/BasicForm',
  }, {
    path: '/form/step-form',
    name: 'stepform',
    component: './Forms/StepForm',
    authority: ['guest'], // 配置准入权限，可以配置多个角色
  }, {
    path: '/form/advanced-form',
    name: 'advancedform',
    component: './Forms/AdvancedForm',
    authority: ['admin'], // 配置准入权限，可以配置多个角色
  }],
}
```

### 控制页面元素显示

> 使用 `Authorized` 或` Authorized.Secured` 可以很方便地控制元素/组件的渲染。https://pro.ant.design/components/Authorized#Authorized.Secured

配在路由上是最省事的方式，一条 `authority` 同时管住了菜单显示和页面访问。注意 `authority` 是数组，写多个角色是「或」的关系，任一命中就放行。

### demo关于权限简介

- 用邮箱自己注册账户（注册后可以登录但是没有任何权限）`guest`
- 联系管理员分配权限（分配后可以查看有权限的页面）
- 每次登录后获取最新的权限身份（如：`admin`，`user`，`guest`）

> 在`src/router.js`中会发现如下代码

```html
<AuthorizedRoute
    path="/"
    render={props => <BasicLayout {...props} />}
    authority={['admin', 'user', 'guest']}
    redirectPath="/user/login"
/>
```

> 其中`authority`对象就是准入身份的数组，表示只有这些身份的人可以登录，我们在配置的时候一定不要忘记在这更新我们新增的身份

- 然后就是`menu.js`,如下，展示了我们在配置菜单的时候怎么配身份

```javascript
const menuData = [{
  name: '题库管理',
  path: 'question',
  icon: 'warning',
  authority: ['admin', 'user'],
  children: [{
    name: '题库列表',
    path: 'list',
  }, {
    name: '编辑题目',
    path: 'create-question',
    hideInMenu: true,
  }, {
    name: '科目管理'
  }]
}, {
  name: '账号管理',
  icon: 'warning',
  path: 'account',
  children: [{
    name: '账号列表',
    path: 'list',
    authority: 'admin',
  }, {
    name: '建设中',
    path: '',
    authority: ['admin', 'user'],
  }]
}]
```

> 登录成功以后怎么获取权限了

```javascript
effects: {
  *login({payload}, {call, put}) {
      const response = yield call(login, payload);
      yield put({
        type: 'changeLoginStatus',
        payload: response,
      });
      // 登录成功以后更新权限，跳转页面
      if (response && response.code === '0000') {
        reloadAuthorized();
        yield put(routerRedux.push('/'));
      }
    },
},
reducers: {
    changeLoginStatus(state, {payload}) {
      let _status = "ok";
      let _user = "admin";
      setToken("token");
      setAuthority(_user);//设置权限
      return {
        ...state,
        status: _status,
        type: 'account',
      };
    },
  }
```

这段是整个权限流程的关键节点，顺序不能反。先 `changeLoginStatus` 把身份写进 localStorage，再 `reloadAuthorized()` 让权限组件重新读一遍，最后才跳首页。要是先跳转再刷新权限，新页面渲染的时候读到的还是旧身份，表现就是登录成功后菜单是空的，手动刷一下又正常了。

原文这段代码里 `effects：{` 和结尾的 `}，` 用的是全角冒号和全角逗号，直接粘过去会报语法错误，我改成半角了。

- 我们看看`setAuthority`、`reloadAuthorized`这两个方法都做了什么事儿

```javascript
//设置身份
export function setAuthority(authority) {
  return localStorage.setItem('antd-pro-authority', authority);
}
//获取身份
export function getAuthority() {
  return localStorage.getItem('antd-pro-authority');
}
```

> 如此而已，只是把新的身份值存在`localStorage`里边，注意`getAuthority`，下边会用到

存 localStorage 有两个后果要知道。好处是刷新页面权限还在，不用重新登录；风险是用户可以在控制台里手改这个值，把自己改成 admin。所以再强调一遍，前端权限拦不住有心人，服务端必须独立校验。

另外记得在退出登录时清掉这个 key，否则下一个用户在同一台机器上登录，可能短暂看到上一个人的菜单。

```javascript
import RenderAuthorized from '../components/Authorized';
import { getAuthority } from './authority';
let Authorized = RenderAuthorized(getAuthority());
const reloadAuthorized = () => {
  Authorized = RenderAuthorized(getAuthority());
};
export { reloadAuthorized };
export default Authorized;
RenderAuthorized: (currentAuthority: string | () => string) => Authorized
```

> 权限组件默认 `export RenderAuthorized` 函数，它接收当前权限作为参数，返回一个权限对象，该对象提供以下几种使用方式

**Authorized**

> 最基础的权限控制

|参数|	说明|	
|---|---|
|`children`|	正常渲染的元素，权限判断通过时展示|	
|`authority`|	准入权限/权限判断|
|`noMatch`	|权限异常渲染元素，权限判断不通过时展示|

**Authorized.AuthorizedRoute**

|参数|	说明|
|---|---|
|`authority`|	准入权限/权限判断|
|`redirectPath`|	权限异常时重定向的页面路由|

**Authorized.Secured**

> 注解方式，`@Authorized.Secured(authority, error)`

|参数|	说明|
|---|---|
|`authority`	|准入权限/权限判断|
|`error`|	权限异常时渲染元素|

**Authorized.check**

> 函数形式的 `Authorized`，用于某些不能被 `HOC` 包裹的组件。 `Authorized.check(authority, target, Exception) `

- 注意：传入一个 `Promise` 时，无论正确还是错误返回的都是一个 `ReactClass`


|参数|	说明|
|---|---|
|`authority	`|准入权限/权限判断
|`target`|	权限判断通过时渲染的元素|
|`Exception`|	权限异常时渲染元素

四种用法各有适用场景。`Authorized` 包一段 JSX 最直观，日常用得最多；`AuthorizedRoute` 用在路由层，不通过就重定向到登录页；`Secured` 是装饰器语法，适合整个类组件都要控权的情况；`check` 是函数形式，给那些不方便被 HOC 包裹的地方兜底，比如在某个回调里判断要不要弹窗。

Pro 后来的版本把这套换成了 `src/access.ts` 加 `useAccess` / `Access` 的方案，权限定义集中在一个函数里返回一个对象，组件里用 Hook 取。思路没变还是「定义权限、比对、决定渲染什么」，API 换了一套，具体写法以你所用版本的官方文档为准。

## 十四、构建和发布

**构建**

> 当项目开发完毕，只需要运行一行命令就可以打包你的应用：

```
$ npm run build
```

> 由于 Ant Design Pro 使用的工具 Umi 已经将复杂的流程封装完毕，构建打包文件只需要一个命令 umi build，构建打包成功之后，会在根目录生成 dist 文件夹，里面就是构建打包好的文件，通常是 *.js、*.css、index.html 等静态文件

**分析构建文件体积**

> 如果你的构建文件很大，你可以通过 analyze 命令构建并分析依赖模块的体积分布，从而优化你的代码。

```
$ npm run analyze
```

这个命令会开一个可视化页面，方块越大占的体积越大。中后台项目最常见的几个大户是 moment 的语言包、图表库、富文本编辑器，看到它们占了半张图别慌，逐个查有没有按需引入或者替换的方案。

**发布**

> 对于发布来讲，只需要将最终生成的静态文件，也就是通常情况下 dist 文件夹的静态文件发布到你的 cdn 或者静态服务器即可，需要注意的是其中的 `index.html` 通常会是你后台服务的入口页面，在确定了 js 和 css 的静态之后可能需要改变页面的引入路径

**前端路由与服务端的结合**

> Ant Design Pro 使用的 Umi 支持两种路由方式：`browserHistory` 和 `hashHistory`。

- 可以在 `config/config.js` 中进行配置选择用哪个方式：

```javascript
export default {
  history: 'hash', // 默认是 browser
}
```

这个选择直接影响运维配合度。`browserHistory` 的 URL 干净，但服务端必须配一条 fallback，把所有前端路由都指回 `index.html`，nginx 里就是 `try_files $uri $uri/ /index.html`。`hashHistory` 不需要服务端做任何事，代价是 URL 里多个 `#`，而且部分统计工具对 hash 变化的追踪要额外配置。

内网系统或者拿不到服务端配置权限的时候，直接上 hash 最省事。

## 十五、一些问题

最后收几个当时踩过、后来发现别人也常问的问题。

### 在ant-design-pro中解决跨域办法

本地开发时页面跑在 `localhost:8000`，接口在另一个域名上，浏览器的同源策略会把请求拦下来。让后端加 CORS 头当然可以，但更省事的做法是用 dev server 的代理，请求先发给本地服务，由它转发出去，浏览器那边看到的一直是同源请求。

> 需要在配置文件中(`.webpackrc`)加入如下代码

```javascript
"proxy": {
  "/api": {
    "target": "http://xxx:xx/",
    "changeOrigin": true,
    "pathRewrite": { "^/api" : "" }
  }
},
```

> 需要注意的是此处不是将`/api/`代理到正式请求`/api/`中，（例如请求`/api/users`则会代理到`http://xxx:xx/users`）
如果需要多次代理且需要代理到不同的服务器则可以在配置文件中进行如下配置


```javascript
"proxy": {
      "/test": {
        "target": "http://xxx:xx/",
        "changeOrigin": true,
        "pathRewrite": { "^/test" : "" }
      },
      "/cross": {
        "target": "http://jsonplaceholder.typicode.com",
        "changeOrigin": true,
        "pathRewrite": {"^/cross": ""}
      } // 此处有一点需要注意，不能在最后一个代理对象后面加逗号，否则会报错！！！
  },
```

那三个配置项分别管一件事：`target` 是转发到哪，`changeOrigin` 会把请求头里的 Host 改成目标地址（很多后端服务靠这个判断来源，不开会被拒），`pathRewrite` 负责把用来标记的前缀去掉。所以请求 `/api/users` 实际打到的是 `http://xxx:xx/users`，`/api` 只是一个本地路由标记，不是真实路径的一部分。这点没弄明白的话，你会一直纳闷为什么后端说没这个接口。

那句「最后一个代理对象后面不能加逗号」是因为 `.webpackrc` 是 JSON 文件，JSON 标准不允许尾逗号。后来配置文件换成 `.umirc.js` 或者 `config/config.ts` 这类 JS 文件之后，尾逗号就没问题了。

### 在model中怎么同时发起多次请求

> 因为`yield`将异步请求转为同步请求了，所以请求会按照同步顺序依次执行，使请求时间延长

**错误写法**

```javascript
// effects将按顺序执行
const response = yield call(fetch, '/users');
const res = yield call(fetch, '/roles');
```

**正确写法**

```javascript
// 两个请求会并发发出，总耗时取决于慢的那个
const [response, res] = yield [
  call(fetch, '/users'),
  call(fetch, '/roles'),
]
```

原文这里的注释写的是「同步执行」，容易让人理解反，实际效果是两个请求同时发出去、一起等结果，总耗时从「两个之和」变成「较慢的那一个」。页面上要同时拉用户列表和角色列表这种场景，改一下能省掉一半的等待时间。

`yield` 一个数组这种写法在早期 redux-saga 里是支持的，后来的版本推荐显式用 `all`，也就是 `yield all([call(...), call(...)])`，语义更清楚。你项目里用的是哪个版本，以对应文档为准，两种写法我都见过能跑的。

要注意的是并发之后错误处理也变了，数组里任何一个失败，整个 `yield` 就抛错，另一个的结果也拿不到了。要求「一个挂了另一个照常展示」的话，得给每个请求各自套 try/catch，或者用 `race` 这类更细的控制。

## 十六、这套脚手架现在长什么样

上面这些是 2018 年那一版 Pro 的用法，代码可以照着看，但如果你现在要起一个新项目，有几处大的变化必须知道。

先说构建层。roadhog 已经退休，Pro 现在直接用 umi，配置文件是 `config/config.ts`，路由挪到了 `config/routes.ts`，项目默认 TypeScript。umi 各大版本之间约定改过不止一次，动态路由的写法、插件 API、目录约定都动过，具体以你所用版本的官方文档为准，我在 [使用 umi 改进 dva 项目开发](https://feinterview.poetries.top/blog/umi-dva) 里也标了同样的提醒。

再说 antd。v4 把图标拆成了 `@ant-design/icons` 独立包，v5 换成了 cssinjs，less 变量定制被 Design Token 取代。还有一处影响面很大的改动是表单：老版本用 `Form.create()` 这个高阶组件包一层再从 props 拿 `form`，v4 之后改成了在函数组件里调 `Form.useForm()` 拿到实例。这是升级 antd 时改动量最大的一块，中后台项目表单又特别多，有升级计划的话建议先拿一个页面试水再铺开。表单复杂到一定程度之后还有别的思路，比如用 schema 驱动，我在 [Formily 复杂表单实践指南](https://feinterview.poetries.top/blog/formily-complex-forms-guide) 里写过。

组件层面最大的增量是 ProComponents。ProTable 把「查询表单加表格加分页加工具栏」这一整套打包成了一个组件，接一个返回数据的函数就能跑；ProForm 同理。中后台大量的重复劳动被它们吃掉了，本文第五节讲的自己抽业务组件，现在很多场景可以直接用现成的。

数据流这块变化也不小。Pro 早年绑 dva，后来 umi 自带了更轻的数据流方案，社区更常见的组合是把服务端数据交给 TanStack Query 这类请求库、客户端状态交给 Zustand。dva 的 model 分层思路依然值得学，具体选型可以看 [React 状态管理方案对比](https://feinterview.poetries.top/blog/react-state-management-comparison)。

那这篇还有什么用？我觉得价值在于它把中后台脚手架要解决的问题列全了：布局、路由、菜单、权限、请求分层、mock、主题、构建。这些问题今天还在，只是答案换了一批。你搞明白问题是什么，看新版文档会快很多。

## 总结

Ant Design Pro 的核心不是那堆好看的页面，是一套把中后台常见问题预先回答掉的约定。目录约定告诉你代码放哪，`router.config.js` 用一份配置同时喂给路由、菜单和面包屑，layouts 用嵌套路由的父节点实现，权限靠「当前身份对比准入身份」这一个判断展开成四种用法，请求统一走 `services` 加 `request` 两层。

真正上手时最该先搞清楚三件事：路由配置里那几个扩展字段各自影响什么，新增一个页面要动哪四个地方，以及前端权限只是体验优化、服务端必须独立校验。这三件事想明白了，剩下的查文档就行。

至于版本，这篇写的是 2018 年那一版。antd 到了 v5/v6，构建从 roadhog 换成 umi，权限换成了 `access.ts`，表格表单被 ProComponents 接管。老项目照着这篇能看懂，新项目请以官方文档为准，但上面那套分层思路是没变的。

## 参考

- [Ant Design Pro 官方文档](https://pro.ant.design/zh-CN/docs/getting-started)
- [Ant Design 组件库文档](https://ant.design/index-cn)
- [ProComponents 文档](https://procomponents.ant.design/)
- [umi 官方文档](https://umijs.org/)
- [dva 官方文档](https://dvajs.com/)
- [BizCharts](https://github.com/alibaba/BizCharts)
- [前端进阶之旅](https://interview.poetries.top)
