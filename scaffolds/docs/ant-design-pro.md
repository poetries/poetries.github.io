---
title: Ant Design Pro总结篇
date: 2018-09-17 00:10:23
tags: 
  - Dva
  - Umi
categories: Front-End
---


# 一、简介

## 1.1 ant pro系统特性

- 基于 `Ant Design` 体系精心设计
- 使用 `React/umi/dva/antd` 等前端前沿技术开发
- 针对不同屏幕大小设计
- 可配置的主题满足多样化的品牌诉求
- `Mock` 数据实用的本地数据调试方案

## 1.2 模板

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

## 1.3 使用

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

## 1.4 目录结构

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

## roadhog摘要介绍

- `roadhog` 是一个 `cli` 工具，提供 `server`、 `build` 和 test 三个命令，分别用于本地调试和构建，并且提供了特别易用的 mock 功能。命令行体验和 `create-react-app` 一致，配置略有不同，比如默认开启 `css` `modules`，然后还提供了 `JSON` 格式的配置方式。
- 重点介绍`roadhog`有关的几个配置项，主要是在`ant design pro`的代码中用到了这些配置项

**entry**

- 指定 `webpack` 入口文件，支持 `glob `格式。
- 如果你的项目是多页类型，会希望把 `src/pages `的文件作为入口。可以这样配：

```
"entry": "src/pages/\*.js"
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



# 二、布局

> 页面整体布局是一个产品最外层的框架结构，往往会包含导航、页脚、侧边栏、通知栏以及内容等。在页面之中，也有很多区块的布局结构。在真实项目中，页面布局通常统领整个应用的界面，有非常重要的作用

## 2.1 Ant Design Pro 的布局

> 在 Ant Design Pro 中，我们抽离了使用过程中的通用布局，都放在 `layouts` 目录中，分别为

**BasicLayout：基础页面布局，包含了头部导航，侧边栏和通知栏**

![](https://gw.alipayobjects.com/zos/rmsportal/oXmyfmffJVvdbmDoGvuF.png)

**UserLayout：抽离出用于登陆注册页面的通用布局**

![](https://gw.alipayobjects.com/zos/rmsportal/mXsydBXvLqBVEZLMssEy.png)

**BlankLayout：空白的布局**

## 2.2 如何使用 Ant Design Pro 布局

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

> 更多 Umi 的路由配置方式可以参考：[Umi 配置式路由]( https://umijs.org/guide/router.html#%E9%85%8D%E7%BD%AE%E5%BC%8F%E8%B7%AF%E7%94%B1)

## 2.3 Pro 扩展配置

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

## 2.4 Ant Design 布局组件

> 除了 Pro 里的内建布局以为，在一些页面中需要进行布局，可以使用 Ant Design 目前提供的两套布局组件工具：`Layout` 和 `Grid`

**Grid 组件**

> - 栅格布局是网页中最常用的布局，其特点就是按照一定比例划分页面，能够随着屏幕的变化依旧保持比例，从而具有弹性布局的特点。
> - 而 Ant Design 的栅格组件提供的功能更为强大，能够设置间距、具有支持响应式的比例设置，以及支持 flex 模式，基本上涵盖了大部分的布局场景 https://ant.design/components/grid/

**Layout 组件**

> 如果你需要辅助页面框架级别的布局设计，那么 Layout 则是你最佳的选择，它抽象了大部分框架布局结构，使得只需要填空就可以开发规范专业的页面整体布局 https://ant.design/components/layout-cn/

- 根据不同场景区分抽离布局组件#
在大部分场景下，我们需要基于上面两个组件封装一些适用于当下具体业务的组件，包含了通用的导航、侧边栏、顶部通知、页面标题等元素。例如 Ant Design Pro 的 `BasicLayout`。
- 通常，我们会把抽象出来的布局组件，放到跟 pages、 components 平行的 layouts 文件夹中方便管理。需要注意的是，这些布局组件和我们平时使用的其它组件并没有什么不同，只不过功能性上是为了处理布局问题

# 四、路由和菜单

> 路由和菜单是组织起一个应用的关键骨架，pro 中的路由为了方便管理，使用了中心化的方式，在 `router.config.js` 统一配置和管理

## 4.1 基本结构

- **路由管理** 通过约定的语法根据在 `router.config.js` 中配置路由。
- **菜单生成** 根据路由配置来生成菜单。菜单项名称，嵌套路径与路由高度耦合。
- **面包屑** 组件 [PageHeader](https://pro.ant.design/components/PageHeader-cn) 中内置的面包屑也可由脚手架提供的配置信息自动生成

### 4.1.1 路由

> 目前脚手架中所有的路由都通过 `router.config.js` 来统一管理，在 `umi` 的配置中我们增加了一些参数，如`name`,`icon`,`hideChildren`,`authority`，来辅助生成菜单。其中

- `name` 和 `icon`分别代表生成菜单项的图标和文本。
- `hideChildren` 用于隐藏不需要在菜单中展示的子路由。用法可以查看 分步表单 的配置。
- `hideInMenu` 可以在菜单中不展示这个路由，包括子路由。效果可以查看 `exception/trigger`页面。
- `authority` 用来配置这个路由的权限，如果配置了将会验证当前用户的权限，并决定是否展示

### 4.1.2 菜单

> 菜单根据 `router.config.js` 生成，具体逻辑在 `src/layouts/BasicLayout` 中的 `formatter` 方法实现

- 如果你的项目并不需要菜单，你可以直接在` BasicLayout` 中删除 `SiderMenu` 组件的挂载。并在 `src/layouts/BasicLayout` 中 设置 `const MenuData = []`。
- 如果你需要从服务器请求菜单，可以将` menuData `设置为 `state`，然后通过网络获取来修改了 `state`

### 4.1.3 面包屑

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

## 4.2 需求实例

### 4.2.1 新增页面

> 脚手架默认提供了两种布局模板：基础布局 - `BasicLayout` 以及 账户相关布局 - `UserLayout`

![](https://gw.alipayobjects.com/zos/rmsportal/oXmyfmffJVvdbmDoGvuF.png)

![](https://gw.alipayobjects.com/zos/rmsportal/mXsydBXvLqBVEZLMssEy.png)

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

### 4.2.2 新增布局

> 在脚手架中我们通过嵌套路由来实现布局模板。`router.config.js` 是一个数组，其中第一级数据就是我们的布局，如果你需要新增布局可以在直接增加一个新的一级数组

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

### 4.2.3 带参数的路由

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

# 五、新增页面

> 这里的『页面』指配置了路由，能够通过链接直接访问的模块，要新建一个页面，通常只需要在脚手架的基础上进行简单的配置

## 5.1 新增 js、less 

> 在 `src/pages` 下新建页面的 `js` 及 `less` 文件，如果相关页面有多个，可以新建一个文件夹来放置相关文件

![](https://gw.alipayobjects.com/zos/rmsportal/hjDyFTVOgRwDzAIHApMO.png)

> 样式文件默认使用 CSS Modules，如果需要，你可以在样式文件的头部引入 antd 样式变量文件

```
@import "~antd/lib/style/themes/default.less";
```

## 5.2 将文件加入菜单和路由

> 加入菜单和路由的方式请参照 路由和菜单 - 添加路由/菜单 中的介绍完成。加好后，访问 `http://localhost:8000/#/new` 就可以看到新增的页面了 https://pro.ant.design/docs/router-and-nav-cn#%E6%B7%BB%E5%8A%A0%E8%B7%AF%E7%94%B1/%E8%8F%9C%E5%8D%95

![](https://gw.alipayobjects.com/zos/rmsportal/xZIqExWKhdnzDBjajnZg.png)

## 5.3 新增 model、service

> 布局及路由都配置好之后，回到之前新建的 `NewPage.js`，可以开始写业务代码了！如果需要用到 `dva` 中的数据流，还需要在 `src/models src/services` 中建立相应的` model` 和 service，具体可以参考脚手架内置页面的写法

# 六、新增业务组件

> 对于一些可能被多处引用的功能模块，建议提炼成业务组件统一管理。这些组件一般有以下特征：

- 只负责一块相对独立，稳定的功能；
- 没有单独的路由配置；
- 可能是纯静态的，也可能包含自己的 state，但不涉及 dva 的数据流，仅受父组件（通常是一个页面）传递的参数控制。

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

# 七、样式

**less**

> Ant Design Pro 默认使用 less 作为样式语言

**CSS Modules**

在样式开发过程中，有两个问题比较突出

- 全局污染 —— CSS 文件中的选择器是全局生效的，不同文件中的同名选择器，根据 build 后生成文件中的先后顺序，后面的样式会将前面的覆盖；
- 选择器复杂 —— 为了避免上面的问题，我们在编写样式的时候不得不小心翼翼，类名里会带上限制范围的标识，变得越来越长，多人开发时还很容易导致命名风格混乱，一个元素上使用的选择器个数也可能越来越多。

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

**样式文件类别**

> 在一个项目中，样式文件根据功能不同，可以划分为不同的类别

- `src/index.less#`

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

- `src/utils/utils.less#`

> 这里可以放置一些工具函数供调用，比如清除浮动 `.clearfix`

- 模块样式

> 针对某个模块/页面生效的文件

# 八、和服务端进行交互

**前端请求流程**

> 在 Ant Design Pro 中，一个完整的前端 UI 交互到服务端处理流程是这样的

- UI 组件交互操作；
- 调用 `model` 的 `effect`；
- 调用统一管理的 `service` 请求函数；
- 使用封装的 `request.js `发送请求；
- 获取服务端返回；
- 然后调用` reducer `改变 `state`；
- 更新 `model`

> 为了方便管理维护，统一的请求处理都放在 services 文件夹中，并且一般按照 model 维度进行拆分文件

```
services/
  user.js
  api.js
  ...
```

> 其中，`utils/request.js `是基于 `fetch` 的封装，便于统一处理 POST，GET 等请求参数，请求头，以及错误提示信息等

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

# 九、引入外部模块

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


# 十、图表

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

# 十一、业务图标

> 通常情况下，你可以通过 `Ant Design` 提供的 `<Icon />` 图标组件来使用 Ant Design 官方图标。基本使用方式如下：

```
<Icon type="heart" style={{ fontSize: '16px', color: 'hotpink' }} />
```

> 如果你没有在 `Ant Design` 官方图标中找到需要的图标，可以到 `iconfont.cn` 上采集并生成自己的业务图标库，再进行使用

**生成图标库代码**

- 首先，搜索并找到你需要的图标，将它采集到你的购物车里，在购物车里，你可以将选中的图标添加到项目中（没有的话，新建一个），后续生成的资源/代码都是以项目为维度的。
- 如果你已经有了设计稿，只是需要生成相关代码，可以上传你的图标后，再进行上面的操作

![](https://gw.alipayobjects.com/zos/rmsportal/jJQYzRyqVFBBamUOppXH.png)

> 来到刚才选中的项目页，点击『生成代码』的链接，会在下方生成不同引入方式的代码，下面会分别介绍

![](https://gw.alipayobjects.com/zos/rmsportal/DbDSgiRukSANKWyhULir.png)

**引入**

- 有三种引入方式供你选择：`SVG Symbol`、`Unicode` 及 `Font class`。我们推荐在现代浏览器下使用 `SVG Symbol `方式引入。

> SVG 符号引入是现代浏览器未来主流的图标引入方式。其方法是预先加载符号，在合适的地方引入并渲染为矢量图形。有如下特点：

- 支持多色图标，不再受到单色图标的限制
- 通过一些技巧，支持像字体那样，通过 `font-size`、`color` 来调整样式
- 支持IE 9+ 及现代浏览器

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

# 十二、Mock 和联调

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

# 十三、主题定制

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

# 十四、权限管理

> 只需要在配置菜单的时候配置上准入身份，在登录成功以后获取到登陆者身份以后更新登录人身份参数即可


## 权限组件 Authorized

> 这是脚手架权限管理的基础，基本思路是通过比对当前权限与准入权限，决定展示正常渲染内容还是异常内容

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

## 控制页面元素显示

> 使用 `Authorized` 或` Authorized.Secured` 可以很方便地控制元素/组件的渲染。https://pro.ant.design/components/Authorized#Authorized.Secured

## demo关于权限简介

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
effects：{
* login({payload}, {call, put}) {
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
}，
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

> 如此而且，只是把新的身份值存在`localStorage`里边，注意`getAuthority`，下边会用到

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


# 十五、构建和发布

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

# 十六、一些问题

## 在ant-design-pro中解决跨域办法

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

## 在model中怎么同时发起多次请求

> 因为`yield`将异步请求转为同步请求了，所以请求会按照同步顺序依次执行，使请求时间延长

**错误写法**

```javascript
// effects将按顺序执行
const response = yield call(fetch, '/users');
const res = yield call(fetch, '/roles');
```

**正确写法**

```javascript
// effects将会同步执行
const [response, res] = yield [
  call(fetch, '/users'),
  call(fetch, '/roles'),
]
```

