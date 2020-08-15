---
title: 快应用入门小结篇
date: 2018-08-21 18:05:43
tags: 快应用
categories: Front-End
---

> - MD原文件 https://github.com/poetries/poetries.github.io/blob/dev/source/_posts/quick-app-summary.md
> - 博客链接 http://blog.poetries.top/2018/08/21/quick-app-summary/

# 前言

## 与微信小程序的比较

- 二者都采用前端技术栈，快应用是`native` 渲染，性能体验会比较好，而小程序目前是`webview`渲染
- 二者开发框架和规范不同，所以代码写法上有差异，快应用的`css`支持能力较弱
- 快应用基于`native`，可以调起丰富的系统api，小程序在此方面会有些无力

## 快应用入口

- 应用商店
- 桌面图标
- 全局搜索
- 浏览器搜索
- 网页跳转
- 负一屏
- 智能推送
- 智慧识屏
- 场景化入口（短信按钮、应用卸载替换、二维码、传送门）

## 快应用优点

- 轻松调起更多系统api
- 各厂商的流量扶持
- `native`渲染，`deeplink`入口，原生桌面入口，`push`能力

# 一、环境搭建

## 1.1 安装NodeJS

> 需安装`6.0`以上版本的`NodeJS`

## 1.2 安装hap-toolkit

```shell
// hap -V // 会显示安装版本信息
npm install -g hap-toolkit
```
## 1.3 创建项目工程

```
hap init projectName

// 增加编译支持
hap update --force

cd projectName && npm i
```

生成的目录结构

```javascript
├── sign rpk //包签名模块
│ └── debug //调试环境
│ ├── certificate.pem //证书文件
│ └── private.pem //私钥文件
├── src
│ ├── Common //公用的资源和组件文件
│ │ └── logo.png //应用图标
│ ├── Demo //页面目录
│ | └── index.ux //页面文件，可自定义页面名称
│ ├── app.ux //APP文件，可引入公共脚本，暴露公共数据和方法等
│ └── manifest.json //项目配置文件，配置应用图标、页面路由等
└── package.json //定义项目需要的各种模块及配置信息
```

- `src`：项目源文件夹
- `sign`：签名模块，当前仅有`debug`签名，如果内测上线，请添加`release`文件夹，增加线上签名；签名生成方法详见文档编译工具


**编译项目**

- `npm run release`     # 发布程序包，在 `/dist/.signed.rpk`，注意需要使用 `release` 签名模块
- `npm run build `      # 生成 `build` 和 `dist` 两个目录。前者是临时产出，后者是最终产出
- `npm run watch `      # 文件保存时自动编译和调试

手动编译项目

> 在项目的根目录下，运行如下命令进行编译打包，生成rpk包

```
npm run build
```

- 编译打包成功后，项目根目录下会生成文件夹：`build`、`dist`
- `build`：临时产出，包含编译后的页面js，图片等
- `dist`：最终产出，包含`rpk`文件。其实是将`build`目录下的资源打包压缩为一个文件，后缀名为`rpk`，这个`rpk`文件就是项目编译后的最终产出

自动编译项目

- 每次修改源代码文件后，都自动编译项目

```
npm run watch
```

**在安卓手机上安装调试工具**

> https://www.quickapp.cn/docCenter/post/69

![](https://poetries1.gitee.io/img-repo/2019/10/405.png)

## 1.4 连接手机进行调试

> 注意：一定要注意手机连接的wifi与电脑所连接的网络需要在同一局域网和网段，需要能够相互访问。

- 在项目根目录下执行如下命令，启动HTTP调试服务器：（`server`前需要先`npm run build`）

```
npm run server
```

- 开发者可以通过命令行终端或者调试服务器主页看到提供扫描的二维码
- 开发者通过快应用调试器扫码安装按钮，扫码安装待调试的`rpk`文件
- 开发者点击快应用调试器中的开始调试按钮，开始调试

> 打开之前安装的快应用调试助手扫描即可预览

![](https://poetries1.gitee.io/img-repo/2019/10/406.png)

> 扫描二维码之后点击开始调试，会调出devtool工具本地调试

![](https://poetries1.gitee.io/img-repo/2019/10/407.png)
![](https://poetries1.gitee.io/img-repo/2019/10/408.png)

## 1.5 安装Hap Extension

> 启动Visual Studio Code，打开项目，点击左上侧扩展，搜索hap，点击安装Hap Extension

- 更多详情 https://doc.quickapp.cn/tutorial/getting-started/code-edit-conf.html

# 二、快应用结构分析

## 2.1 文件组织

> 一个应用包含：描述项目配置信息的`manifest`文件，放置项目公共资源脚本的`app.ux`文件，多个描述页面/自定义组件的ux文件

```
├── sign                            rpk包签名模块
    └── debug                       调试环境
            └── certificate.pem     证书文件
            └── private.pem         私钥文件
├── src
   ├── Common                       公用的资源和组件文件
            └──logo.png             应用图标
   ├── Demo                         页面目录
            └── index.ux            页面文件，可自定义页面名称
   ├── app.ux               APP文件，可引入公共脚本，暴露公共数据和方法等
   └── manifest.json                项目配置文件，配置应用图标、页面路由等
└── package.json                    定义项目需要的各种模块及配置信息
```

**目录的简要说明如下**

- `src`：项目源文件夹
- `sign`：签名模块（当前仅有`debug`签名，如果内测上线，请添加`release`文件夹，增加线上签名）



## 2.2 源码文件

> `APP`，页面和自定义组件均通过`ux`文件编写，`ux`文件由`template`模板、`style`样式和`script`脚本3个部分组成，一个典型的页面`ux`文件示例如下

```html
<template>
  <!-- template里只能有一个根节点 -->
  <div class="demo-page">
    <text class="title">欢迎打开{{title}}</text>
    <!-- 点击跳转详情页 -->
    <input class="btn" type="button" value="跳转到详情页" onclick="routeDetail">
  </div>
</template>

<style>
  .demo-page {
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .title {
    font-size: 40px;
    text-align: center;
  }

  .btn {
    width: 550px;
    height: 86px;
    margin-top: 75px;
    border-radius: 43px;
    background-color: #09ba07;
    font-size: 30px;
    color: #ffffff;
  }
</style>

<script>
  import router from '@system.router'

  export default {
    // 页面级组件的数据模型，影响传入数据的覆盖机制：private内定义的属性不允许被覆盖
    private: {
      title: '示例页面'
    },
    routeDetail () {
      // 跳转到应用内的某个页面，router用法详见：文档->接口->页面路由
      router.push ({
        uri: '/DemoDetail'
      })
    }
  }
</script>
```

## 2.3 manifest配置

> https://doc.quickapp.cn/framework/manifest.html


```javascript
{
    # 包名，区分不同应用的唯一id，因为名称其实是可以一样的
    "package": "com.application.demo",

    # 应用名称
    "name": "hi",

    # 版本管理的话，每次更新将versionCode自增1即可
    "versionName": "1.0.0",
    "versionCode": "1",
    "minPlatformVersion": "101",

    # 程序的入口icon，所有关于文件的引用统一使用根目录
    # 根目录对应src文件夹
    "icon": "/Common/logo.png",

    # 
    "features": [
        { "name": "system.prompt" },
        { "name": "system.router" },
        { "name": "system.shortcut" }
    ],

    "permissions": [
        { "origin": "*" }
    ],

    # 配置相关
    "config": {
        # 这里的设置是log输出的最低等级
        # 如果是warn的话，info类型将不会输出
        # 等级请参考js中的console日志
        "logLevel": "off"
    },

    # 路由
    # 这里会配置应用入口的页面
    # 所有的页面都需要在这里配置
    # 会把页面与对应的页面文件对应起来
    # 经过配置之后可以通过/Demo访问到Demo目录下的index.ux页面
    "router": {
        "entry": "Demo",
        "pages": {
            "Demo": {
                # 这里对应的Demo文件夹里的index.ux
                "component": "index"
            },
            "DemoDetail": {
                "component": "index"
            },
            "About": {
                "component": "index"
            }
        }
    },
    
    # 配置页面UI显示
    # 主要分为两种，页面公有与页面私有
    "display": {
        # 这三个都是所有页面公有的，顶部titleBar内容
        "titleBarText": "public title"
        "titleBarBackgroundColor": "#f2f2f2",
        "titleBarTextColor": "#414141",

        # 会增加一个导航栏
        "menu": true,

        # 页面私有内容
        "pages": {
            "Demo": {
                # 这里面的内容就是每个页面私有的了
                "titleBarText": "示例页",
                "menu": false
            },
            "DemoDetail": {
                "titleBarText": "详情页"
            },
            "About": {
                "menu": false
            }
        }
    }
}
```

- `package` 应用包名，确认与原生应用的包名不一致，推荐采用`com.company.module`的格式，如：`com.example.demo`
- `name` 应用名称，6个汉字以内，与应用商店保存的名称一致，用于在桌面图标、弹窗等处显示应用名称
- `icon` 应用图标，提供`192x192`大小的即可
- `versionName` 应用版本名称，如：`"1.0"`
- `versionCode` 应用版本号，从1自增，推荐每次重新上传包时`versionCode+1`
- `minPlatformVersion` 支持的最小平台版本号，兼容性检查，避免上线后在低版本平台运行并导致不兼容；如果不填按照内测版本处理
- `features` 接口列表，绝大部分接口都需要在这里声明，否则不能调用，详见每个接口的文档说明
- `config` 系统配置
    - `logLevel`：打印日志等级，分为`off`,`error`,`warn`,`info`,`log`,`debug`
    - `designWidth`：页面设计基准宽度，根据实际设备宽度来缩放元素大小
- `router` 路由信息 
    - `entry:`首页名称
    - `pages`:页面配置列表，`key`值为页面名称（对应页面目录名，例如Hello对应'Hello'目录），`value`为页面详细配置`page`，详见下面说明
    - `router.page` 用于定义单个页面路由信息
        - `component`: 页面对应的组件名，与`ux`文件名保持一致，例如`'hello'` 对应 `'hello.ux'`
        - `path` 页面路径，例如`“/user”`,不填则默认为/<页面名称>。`path`必须唯一,不能和其他`page`的`path`相同。下面`page`的`path`因为缺失,会被设置为`“/Index”`：`"Index"`: `{"component": "index"}`
        - `filter`: 声明页面可以处理某种请求
- `display UI`显示相关配置
    - `backgroundColor` 窗口背景颜色
    - `fullScreen` 是否是全屏模式，默认不会同时作用于`titleBar`，`titleBar`需要继续通过`titleBar`控制
    - `titleBar` 是否显示`titleBar`
    - `titleBarBackgroundColor `标题栏背景色
    - `titleBarTextColor` 标题栏文字颜色
    - `titleBarText` 标题栏文字(也可通过页面跳转传递参数(`titleBarText`)设置)
    - `menu` 是否显示标题栏右上角菜单按钮
    - `pages` 各个页面的显示样式，key为页面名（与路由中的页面名保持一致），`value`为窗口显示

## 2.4 app.ux

> 当前`app.ux`编译后会包含`manifest`配置信息（可以在`npm run build`之后查看文件内容），所以请不要删除`/**manifest**/`的注释内容标识

- 您可以在`<script>`中引入一些公共的脚本，并暴露在当前app的对象上，如下所示，然后就可以在页面ux文件的`ViewModel`中，通过`this.$app.util`访问

## 2.5 style样式

- 样式布局采用`CSS Flexbox`（弹性盒）样式

> 支持2种导入外部文件的方式

```html
<!-- 导入外部文件, 代替style内部样式 -->
<style src="./style.css"></style>

<!-- 合并外部文件 -->
<style>
  @import './style.css';
  .a {
  }
</style>
```

**模板内部样式**

```html
<!-- 内联inline -->
<div style="color:red; margin: 10px;"/>
<!-- class声明 -->
<div class="normal append"/>
```

**样式预编译**

> 目前支持less, sass的预编译

```html
<!--导入外部文件, 代替style内部样式-->
<style lang="less" src="./lessFile.less"></style>

<!--合并外部文件-->
<style lang="less">
  @import './lessFile.less';
  .page-less {
    #testTag {
      .less-font-text, .less-font-comma {
        font-size: 60px;
      }
    }
  }
</style>
```


```html
<script>
  /**
   * 应用级别的配置，供所有页面公用
   */
  import util from './util'

  export default {
    showMenu: util.showMenu,
    createShortcut: util.createShortcut
  }
</script>
```

## 2.6 template模板

```html
<!-- temp.ux -->
<import name="hint" src="./hint-modal"></import>  <!-- 引入外部模板 -->
<import src="./table"></import>  <!-- 引入外部模板 -->

<template>
  <div class="container">
      <div class="mod-header">
          <text class="mod-title" style="color: red; margin: 10px;">{{title}}</text>    <!-- 行内样式 -->
          <text class="mod-detail" onclick="showDetail">?</text>    <!-- 无参事件绑定 -->
      </div>
      <div class="mod-content">
          <!-- block 用来表示逻辑，不渲染 -->
          <block for="totalData">   <!-- for 循环遍历数组 $idx, $item 分别为数组的索引和值-->
              <!-- 事件绑定 -->
              <div onclick="onTabClick($idx)" class="item {{tabIndex === $idx && 'active'}}"> <!-- 支持简单表达式 -->
                  <text class="{{tabIndex === $idx && 'text-active'}}">{{($item || {}).name}}</text>
                  <text class="{{tabIndex === $idx && 'text-active'}}">{{($item || {}).value}}</text>  <!-- 布尔值、null、undefined、'' 不渲染，其余包括 falsy 值一律渲染 -->
              </div>
          </block>
      </div>
      <image class="mod-like" if="{{isLike}}" /> <!-- 支持if elif else, 必须是相邻节点 -->
      <image class="mod-dislike" else />
      <table data={{dataList}}></table>  <!-- 传入属性值，使用外部模板-->
      <hint show="{{isHintShown}}">
          This is children of hint templete.
      </hint>   <!-- 使用外部模板 -->
      <!-- if 和 show 的区别：if 为 false 分支的节点不会渲染进 DOM 树，而 show 为 false 的节点会渲染，只是 display: none; -->
  </div>
</template>

<style lang="less" src="./lessFile.less"></style>   <!-- 引入外部 CSS/LESS -->

<style lang="less">
  /* 引入外部 CSS/LESS */
  @import '../Common/global.less';

  .container{
    /* 定义样式，less 支持 */
  }
</style>

<script>
  import fetch from "@system.fetch"    // 引入系统 js
  import conf from './globalConf';     // 引入外部 js
  
  export default {
    props: ['title', 'dataList'],  // 传入属性：必须字母开头，全小写、数字和 `-` ，不能保留字和函数，不能以符号开头
    public: {
      // 定义变量，会被 props 和内部请求覆盖
    },
    private: {
      // 定义变量，不会被 props 覆盖
    },
    protected: {
      // 定义变量，不会被 props 覆盖, 但会被内部请求覆盖(获得通过 a 标签和 router 传递的参数)
    }
    data :{   // data 不能和 public、private、protected 一起使用，data 也可以是 function（返回 data 对象，onInit之前执行）
      // 定义变量：不能保留字和函数，不能以符号开头
      totalData: [{name: 'a',value: 97},{name: 'b',value: 98}];
        // 定义变量，会被 props 覆盖
    },
    onTabClick(index){    // 内部事件定义
      console.log(index);
    },
    events: {
       onIDChange(){
          // 外部事件定义
       }
    }
  }
</script>

<!-- hint.ux -->
<template>
  <text><slot></slot></text>          <!-- slot: 获取该数据的引用的 children, 该例中即：This is children of hint templete. -->
</template>
```

## 2.7 script脚本

### 2.7.1 模块声明

> 可以通过`import`引入功能模块，在代码中调用模块方法

```
import fetch from "@system.fetch"
```

> 也可以一次引入所有的模块，例如

```
import system from "@system"
```

- 在代码中使用`system.network`来调用接口方法

### 2.7.2 对象

#### 2.7.2.1 页面级组件

**data(废弃)**

- 页面级组件的数据模型，能够转换为`JSON`对象
- 如果是函数，返回结果必须是对象，在组件初始化时会执行函数获取结果作为`data`的值
- 使用`data`方式声明的属性会被外部数据覆盖，因此存在一定安全风险，推荐使用下面的`public`,`protected`,`rivate`来声明属性（注意：它们不能与data同时声明）

**public**

> 页面级组件的数据模型，影响传入数据的覆盖机制：`public`内定义的属性允许被传入的数据覆盖，如果外部传入数据的某个属性未被声明，在`public`中不会新增这个属性

**protected**

> 页面级组件的数据模型，影响传入数据的覆盖机制：protected内定义的属性，允许被应用内部页面请求传递的数据覆盖，不允许被应用外部请求传递的数据覆盖

**private**

> 页面级组件的数据模型，影响传入数据的覆盖机制：private内定义的属性不允许被覆盖

```javascript
 export default {
    props: ['title', 'dataList'],  // 传入属性：必须字母开头，全小写、数字和 `-` ，不能保留字和函数，不能以符号开头
    public: {
      // 定义变量，会被 props 和内部请求覆盖
    },
    private: {
      // 定义变量，不会被 props 覆盖
    },
    protected: {
      // 定义变量，不会被 props 覆盖, 但会被内部请求覆盖(获得通过 a 标签和 router 传递的参数)
    }
    data :{   // data 不能和 public、private、protected 一起使用，data 也可以是 function（返回 data 对象，onInit之前执行）
      // 定义变量：不能保留字和函数，不能以符号开头
      totalData: [{name: 'a',value: 97},{name: 'b',value: 98}];
        // 定义变量，会被 props 覆盖
    },
    onTabClick(index){    // 内部事件定义
      console.log(index);
    },
    events: {
       onIDChange(){
          // 外部事件定义
       }
    }
  }
```

#### 2.7.2.2 自定义组件

**data**

> 自定义组件的数据模型，能够转换为JSON对象；属性名不能以$或_开头, 不要使用for, if, show, tid等保留字
如果是函数，返回结果必须是对象，在组件初始化时会执行函数获取结果作为data的值

**props**

- 定义组件外部可传入的所有属性
- 在模板代码中，请使用短横线分隔命名代替驼峰命名。如，属性定义`props: ['propA']`，可通过`<tag prop-a='xx'>`方式传递到组件内部

**prop验证**

> 在自定义组件中，可将props定义为带验证需求的对象。其中，key为属性名，value为属性对应的验证需求。验证失败则输出错误提示日志，增加prop验证有利于规范自定义组件的使用

|属性|	类型|	描述|
|---|---|---|
|`type`| 	-	|检查属性值的类型。支持单一类型和多种可能类型，可在原生和自定义构造函数中任意选择，单独或组合使用。原生构造函数：`String`  `Number`  `Boolean`  `Function`  `Object`  `Array`  `Symbol`
|`default`|-|	设置属性的默认值 |
|`required` |`Boolean`|	设置属性是否必填|
`validator `|	`Function`|	设置自定义验证函数。若函数的返回值为真，则通过验证；否则验证失败|

```javascript
export default {
    props: {
      // 单一类型检查的简写
      propA: Number,
      // 多种可能类型的简写
      propB: [String, Number],
      // 必填的字符串
      propC: {
        type: String,
        required: true
      },
      // 带默认值的数字
      propD: {
        type: Number,
        default: 100
      },
      // 带有默认值的对象
      propE: {
        type: Object,
        default () {
          return { message: 'hello' }
        }
      },
      // 自定义验证函数
      propF: {
        validator (value) {
          return value === 'hello'
        }
      }
    }
  }
 ```
 
#### 2.7.2.3 公共对象

|属性|	类型|	描述|
|---|---|---|
|`$app`|`	Object`	|应用对象|
|`$page`|	`Object`	|页面对象|
|`$valid`|	`Boolean`	|页面对象是否有效|
|`$visible`|	`Boolean`	|页面是否处于用户可见状态|

#### 2.7.2.4 应用对象

> 可通过`$app`访问

|属性|	类型|	描述|
|---|---|---|
|`$def`|`	Object`|	使用`this.$app.$def`获取在`app.ux`中暴露的对象|
|`$data`|	`Object`	|使用`this.$app.$data`获取在`manifest.json`的`config.data`中声明的全局数据|

#### 2.7.2.5 页面对象

> 可通过`$page`访问


|属性|	类型	|描述|
|---|---|---|
|`actio`n|	`String`|	获取打开当前页面的`action`。仅在当前页面是通过`filter`匹配的方式打开时有效，否则为`undefined`|
|`uri`	|`String`	|获取打开当前页面的uri。仅在当前页面是通过filter匹配的方式打开时有效，否则为`undefined`|

### 2.7.3 方法

#### 2.7.3.1 数据方法

|属性|	类型|	参数|	描述|
|---|---|---|---|
|`$set`|	`Function`|`key: String value: Any`|添加数据属性，用法`：this.$set('key',value)` `this.$vm('id').$set('key',value)`
|`$delete`|	`Function`|	`key: String`	|删除数据属性，用法：`this.$delete('key')` ` this.$vm('id').$delete('key')`|

#### 2.7.3.2 公共方法

|属性  |描述|
|---|---|
|`$element`|获取指定`id`的组件`dom`对象，如果没有指定`id`，则返回根组件`dom`对象用法：`<template> <div id='xxx'></div> </template> this.$element('xxx')` 获取`id`为`xxx`的`div`组件实例对象 `this.$element()` 获取根组件实例对象|
|`$root`| 获取顶层`ViewModel`|
|`$parent`	|获取父亲`ViewModel`|
|`$child`|	获取指定`id`的自定义组件的`ViewModel`用法：`this.$child('xxx')` 获取`id`为`xxx`的`div`组件`ViewModel`|
|`$vm deprecated`	|请使用上面`this.$child('xxx')`替代|
|`$rootElement deprecated`|	请使用上面`this.$element()`替代|
|`$forceUpdate`	|更新`ViewModel`数据，可能会触发`DOM`操作，如：创建节点、更新节点、删除节点等；这些DOM操作不一定在数据更新时立即执行，而是在开发者的业务代码执行后触发；若开发者期望数据更新时立即执行相应的`DOM`操作，可使用：`this.$forceUpdate()`；一般不推荐使用|


#### 2.7.3.3 事件方法

|属性|	参数|	描述|
|---|---|---|
|`$on`	|	`type: String` 事件名 <br>`handler: Function `事件句柄函数|	添加事件处理句柄用法：`this.$on('xxxx', this.fn)` `fn`是在`<script>`中定义的函数|
|`$off`	|	`type: String` 事件名 <br>`handler`:  事件句柄函数	|删除事件处理句柄用法：`this.$off('xxxx', this.fn)` `this.$off('xxx')` 删除指定事件的所有处理句柄|
|`$dispatch`	|	`type: String` 事件名|向上层组件发送事件通知用法：`this.$dispatch('xxx')`正常情况下，会一直向上传递事件（冒泡）如果要停止冒泡，在事件句柄函数中调用`evt.stop()`即可|
|`$broadcast`|		`type: String` 事件名|向子组件发送事件通知用法：`this.$broadcast('xxx')`正常情况下，会一直向下传递事件如果要停止传递，在事件句柄函数中调用`evt.stop()`即可|
|`$emit`|		`type: String` 事件名 <br>`data: Object` 事件参数|	触发事件，对应的句柄函数被调用用法：`this.$emit('xxx') this.$emit('xxx', {a:1})`传递的事件参数可在事件回调函数中，通过`evt.detail`来访问，例如`evt.detail.a`|
|`$emitElement`|		`type: String` 事件名<br>`data: Object` 事件参数 <br>`id: String` 组件`id` (默认为`-1` 代表根元素)	|触发组件事件,对应的句柄函数被调用用法：`this.$emitElement('xxx', null, 'id') this.$emitElement('xxx',{a:1})`传递的事件参数可在事件回调函数中，通过`evt.detail`来访问，例如`evt.detail.a`|
|`$watch	`|	`data: String` 属性名, 支持`'a.b.c'`格式，不支持数组索引 <br>`handler: String` 事件句柄函数名,函数的第一个参数为新的属性值，第二个参数为旧的属性值|	动态添加属性/事件绑定，属性必须在`data`中定义，`handler`函数必须在`<script>`定义；当属性值发生变化时事件才被触发用法：`this.$watch('a','handler')`|

####  2.7.3.4 应用方法

> 可通过$app访问

|属性|	描述|
|---|---|
|exit |	退出快应用，结束应用生命周期。<br>调用方法：`this.$app.exit()`|

#### 2.7.3.5 页面方法

> 可通过`$page`访问

|属性|	参数|	描述|
|---|---|---|
|`setTitleBar`	|	`text: String` 标题栏文字 <br>`textColor: String` 文字颜色 <br>`backgroundColor: String` 背景颜色 <br>`backgroundOpacity : Number `背景透明度 <br>`menu : Boolean` 是否在标题栏右上角显示菜单按钮|	设置当前页面的标题栏用法：`this.$page.setTitleBar({text:'Hello', textColor:'#FF0000', backgroundColor:'#FFFFFF', backgroundOpacity:0.5, menu: true})`|
|`finish` |	无|	从本页面退出，结束页面生命周期。调用方法：`this.$page.finish()`|

## 2.8 指令

**for**

> `for`指令用于循环输出一个数组类型的数据

- 自定义变量表示`for`指令的数组索引和数组元素时，变量名不可以用`$`或`_`开头；

```html
<template>
  <div class="tutorial-page">
    <!-- 方式1：默认$item代表数组中的元素, $idx代表数组中的索引 -->
    <div class="tutorial-row" for="{{list}}">
      <text>{{$idx}}.{{$item.name}}</text>
    </div>
    <!-- 方式2：自定义元素变量名称 -->
    <div class="tutorial-row" for="value in list">
      <text>{{$idx}}.{{value.name}}</text>
    </div>
    <!-- 方式3：自定义元素、索引的变量名称 -->
    <div class="tutorial-row" for="(personIndex, personItem) in list">
      <text>{{personIndex}}.{{personItem.name}}</text>
    </div>
  </div>
</template>

<style lang="less">
  .tutorial-page {
    flex-direction: column;
    .tutorial-row {
      width: 85%;
      margin-top: 10px;
      margin-bottom: 10px;
    }
  }
</style>

<script>
  export default {
    private: {
      list: [
        {name: 'aa'},
        { name: 'bb' }
      ]
    },
    onInit () {
      this.$page.setTitleBar({ text: '指令for' })
    }
  }
</script>
```

**指令if与指令show**

- `if`条件指令，是指`if/elif/else`这3个相关指令，用于控制是否增加或者删除组件；
- `show`指令，是指是否显示组件，用于控制组件的显示状态，并不会从DOM结构中删除

```html
<template>
  <div class="tutorial-page">
    <text onclick="onClickShow">显示隐藏：</text>
    <text show="{{showVar}}">show: 渲染但控制是否显示</text>

    <text onclick="onClickCondition">条件指令：</text>
    <text if="{{conditionVar === 1}}">if: if条件</text>
    <text elif="{{conditionVar === 2}}">elif: elif条件</text>
    <text else>else: 其余</text>
  </div>
</template>

<style lang="less">
  .tutorial-page {
    flex-direction: column;
  }
</style>

<script>
  export default {
    private: {
      showVar: true,
      conditionVar: 1
    },
    onInit () {
      this.$page.setTitleBar({ text: '指令if与指令show' })
    },
    onClickShow () {
      this.showVar = !this.showVar
    },
    onClickCondition () {
      this.conditionVar = ++this.conditionVar % 3
    }
  }
</script>
```

- 当`if/elif`指令的值为`false`时，节点会从页面中移除，当`if/elif`指令值为`true`，组件会动态插入节点中；
- 当`show`指令的值为`true`时，节点可见， - 当其值为`false`时，组件不可见，但节点仍会保留在页面DOM结构中

**组件block**

> block组件是表达逻辑区块的组件，没有对应的Native组件。可以使用<block>实现更为灵活的"列表/条件渲染"。如在<block>上使用for指令和if指令


```html
<template>
  <div class="tutorial-page">
    <text onclick="toggleCityList">点击：控制是否显示城市</text>
    <div class="city" for="city in cities" if="{{showCityList === 1}}">
      <text>城市：{{city.name}}</text>
      <block if="{{city.showSpots}}" for="{{city.spots}}">
        <text>景点：{{$item.name}}</text>
      </block>
    </div>
  </div>
</template>

<style lang="less">
  .tutorial-page {
    flex-direction: column;
  }
  .city {
    flex-direction: column;
  }
</style>

<script>
  import {dataDirective} from '../../Common/js/data'

  export default {
    private: {
      showCityList: 1,
      cities: dataDirective
    },
    onInit () {
      this.$page.setTitleBar({ text: '组件block' })
    },
    toggleCityList () {
      this.showCityList = this.showCityList === 1 ? 0 : 1
    }
  }
</script>
```

**组件slot**

> slot节点用于向开发者额外开发的自定义ux组件中插入内容

- 通常自定义组件的模板中提供`slot`组件，当该组件被引入到页面组件中后，开发者可以灵活定义该自定义组件内部的子内容


```html
//自定义组件part1.ux

<!-- par1.ux -->
<template>
  <div>
    <text>{{ header }}</text>
    <slot></slot>
    <text>{{ footer }}</text>
  </div>
</template>

<script>
  export default {
    props: [
      'header', 'footer'
    ]
  }
</script>
```

```html
//自定义组件使用者页面index.ux

<!-- index.ux -->
<import src="./part1"></import>
<template>
  <part1 class="component" header="{{header}}" footer="{{footer}}">
    <text>slot节点内容</text>
  </part1>
</template>

<style>
  .component {
    flex-direction: column;
  }
</style>

<script>
  export default {
    private: {
      header: 'HEAD',
      footer: 'FOOT'
    },
    onInit () {
      this.$page.setTitleBar({ text: '组件slot' })
    }
  }
</script>
```

> 在子组件中使用`slot`组件，使得子组件接纳调用者传入的子内容，从而动态渲染子组件，得到最终的页面


# 三、生命周期

## 3.1 APP的生命周期

> 当前为APP的生命周期提供了两个回调函数：`onCreate`, `onDestroy`；可在`app.ux`中定义回调函数

![](https://poetries1.gitee.io/img-repo/2019/10/409.png)

```javascript
import {
  natives
} from './util/asyncNatives'

export default {
  onCreate () {
    console.info('Application onCreate')
  },
  onDestroy () {
    console.info('Application onDestroy')
  },
  // 暴露给所有页面，在页面中通过：this.$app.$def.method1()访问
  method1 () {
    console.info('这是APP的方法')
  },
  // 暴露给所有页面，在页面中通过：this.$app.$def.data1访问
  data1: {
    name: '这是APP存的数据'
  },
  natives
}
```

- 在`app.ux`中，开发者可以做一些独立于页面的操作。比如：引入公共的JS资源，然后暴露给所有页面
- 在`app.ux`中，通过`this.$def`访问`app.ux`中定义的数据和方法

```javascript
console.info(`获取：APP文件中的数据：${this.$def.data1.name}`)
console.info(`执行：APP文件中的方法`, this.$def.method1())
console.info(`获取：manifest.json的应用名称：${this.$def.manifest.name}`)
console.info(`获取：manifest.json的config.data的数据：${this.$data.name}`)
```

> 在`pageName.ux`中，通过`this.$app.$def`访问`app.ux`中定义的数据和方法

```javascript
console.info(`获取：APP文件中的数据：${this.$app.$def.data1.name}`)
console.info(`执行：APP文件中的方法`, this.$app.$def.method1())
console.info(`获取：manifest.json的应用名称：${this.$app.$def.manifest.name}`)
console.info(`获取：manifest.json的config.data的数据：${this.$app.$data.name}`)
```

**关于$app与$app.$def**

- 前者代表框架为开发者暴露提供的APP对象；后者代表开发者在`app.ux`中导出的对象，放置业务相关的全局数据和方法
- 前者对象拥有`onCreate`, `onDestroy`生命周期；当应用启动时会执行`onCreate`方法，里面执行`this.variable1`的赋值是在`$app`对象上
- 后者对象中的`onCreate`, `onDestroy`方法并不会执行，作用仅仅只是把方法复制到前者对象上而已
- 这些全局方法在页面中：既可以通过`this.$app.method1()`调用，也可以通过`this.$app.$def.method1()`调用；不同之处在于前者可以取到之前赋值的`variable1`变量，而后者不可以取到（因为之前的赋值是在`$app`对象上执行的）

## 3.2 页面生命周期

![image.png](https://upload-images.jianshu.io/upload_images/1480597-70b55809168cd48a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

**onInit()**

> 表示ViewModel的数据已经准备好，可以开始使用页面中的数据

```javascript
private: {
  // 生命周期的文本列表
  lcList: []
},
onInit () {
  this.$page.setTitleBar({ text: '生命周期' })

  this.lcList.push('onInit')

  console.info(`触发：onInit`)
  console.info(`执行：获取ViewModel的lcList属性：${this.lcList}`)   // 执行：获取ViewModel的lcList属性：onInit
  // $app信息
  console.info(`获取：manifest.json的config.data的数据：${this.$app.$data.name}`)
  console.info(`获取：APP文件中的数据：${this.$app.$def.data1.name}`)
  console.info(`执行：APP文件中的方法`, this.$app.$def.method1())
}
```

**onReady()**

> 表示ViewModel的模板已经编译完成，可以开始获取DOM节点（如：this.$element(idxxx)

```javascript
onReady () {
  this.lcList.push('onReady')

  console.info(`触发：onReady`)
  console.info(`执行：获取模板节点：${this.$rootElement()}`)   // 执行：获取模板节点：<div attr={} style={"flexDirection":"column"}>...</div>
}
```

**onShow(), onHide()**

> 页面被切换隐藏时调用onHide()，页面被切换重新显示时调用onShow()

- 判断页面的显示状态，可以调用`ViewModel`的`$visible`属性：`true`表示显示，`false`表示隐藏

```javascript
onShow () {
  this.lcList.push('onShow')

  console.info(`触发：onShow`)
  console.info(`执行：获取页面显示状态属性：${this.$visible}`)  // true
},
onHide () {
  this.lcList.push('onHide')

  console.info(`触发：onHide`)
  console.info(`执行：获取页面显示状态属性：${this.$visible}`)  // false
}
```

**onDestroy()**

> 页面被销毁时调用，被销毁的可能原因有：用户从当前页面返回到上一页，或者用户打开了太多的页面，框架自动销毁掉部分页面，避免占用资源

- 所以，页面销毁时应该做一些释放资源的操作，如：取消接口订阅监听`geolocation.unsubscribe()`

```javascript
onDestroy () {
  console.info(`触发：onDestroy`)
  console.info(`执行：页面要被销毁，销毁状态：${this.$valid}，应该做取消接口订阅监听的操作: geolocation.unsubscribe()`)    // true，即将销毁
  setTimeout(function () {
    console.info(`执行：页面已被销毁，不会执行`)                // 页面已销毁，不会执行
  }.bind(this), 0)
}
```

**onBackPress()**

> 当用户点击返回实体按键、左上角返回菜单、调用返回API时触发该事件

- 如果事件响应方法最后返回true表示不返回，自己处理业务逻辑（完毕后开发者自行调用API返回）；否则：不返回数据，或者返回其它数据：表示遵循系统逻辑：返回到上一页

```javascript
onBackPress () {
  console.info(`触发：onBackPress`)

  // true：表示自己处理；否则默认返回上一页
  // return true
}
```

> 返回上一页的接口API：`router.back()`


**onMenuPress()**

> 当使用原生的顶部标题栏时，可以通过manifest.json中的menu属性配置是否显示右上角的菜单

```javascript
onMenuPress () {
  this.lcList.push('onMenuPress')

  console.info(`触发：onMenuPress`)
}
```



**A页面的生命周期接口的调用顺序**

- 打开页面A：`onInit()` -> `onReady()` -> `onShow()`
- 在页面A打开页面B：`onHide()`
- 从页面B返回页面A：`onShow()`
- A页面返回：`onBackPress() -> onHide() -> onDestroy()`

# 四、置顶对象

- `$app` 应用对象
- `$app.$def` 获取在`app.ux`中暴露的对象
- `$app.$data` 获取在`manifest.json`的`config.data`中声明的全局数据
- `$page` 页面对象
- `$page.action` 获取打开当前页面的`action`。仅在当前页面是通过`filter`匹配的方式打开时有效，否则为`undefined`。参见`manifest`
- `$page.uri` 获取打开当前页面的`uri`。仅在当前页面是通过`filter`匹配的方式打开时有效，否则为`undefined`
- `$page.setTitleBar` 设置页面标题
- `$valid` 页面对象是否有效
- `$visible` 页面是否处于用户可见状态

> `this.$page.setTitleBar` 参数属性包括


```javascript
{
  text: 'Hello QuickApp',        //标题栏文字
  textColor: '#ffff',            //文字颜色
  backgroundColor: '#434343',    //背景颜色
  backgroundOpacity: '0.8',      //背景透明度
  menu: false,      //是否在标题栏右上角显示菜单按钮 | 设置当前
}
```

# 五、全局对象

- `$element` 获取指定id的组件dom对象，如果没有指定id，则返回根组件`dom`对象用法：`this.$element('xxx')`获取id为xxx的组件实例对象 `this.$element()` 获取根组件实例对象
- `$root` 获取顶层`ViewModel`
- `$parent` 获取父亲`ViewModel`
- `$child` 获取指定id的自定义组件的`ViewModel`用法：`this.$child('xxx')` 获取`id`为`xxx`的`div`组件`ViewModel`
- `$vm(弃用) 请使用上面`this.$child('xxx')`替代
- `$forceUpdate` 强制页面刷新
- `$set` 添加数据属性，必须在`onInit`函数中使用，用法：`this.$set('key',value)`
- `$delete` 删除数据属性，如果在`onInit`函数中使用，用法：`this.$delete('key')`


# 六、元素属性方法

> 注意，获取元素应该在页面已渲染后，如 onReady 事件中或 onReady 事件执行完以后

- `$set` 添加数据属性，用法：`this.$vm('id').$set('key',value)`
- `$delete `删除数据属性，用法：`this.$vm('id').$delete('key')`
- `$on` 在当前页面注册监听事件， 可监听`$emit()`、 `$dispatch()`、 `$broadcast()`等触发的自定义事件，不能用于注册组件节点的事件响应
- `$off` 移除事件监听，参数 `fnHandler` 为可选，传递仅移除指定的响应函数，不传递则移除此事件的所有监听
- `$emit` 触发当前实例监听事件函数，与 `$on()` 配合使用

# 七、页面设计

**布局和尺寸**

- 采用` border-box` 模型且不支持 `box-sizing` 属性
- 目前仅支持长度单位`px`和`%`
- 设计稿1px / 设计稿基准宽度 = 框架样式1px / 项目配置基准宽度(项目配置基准宽度:`/src/manifest.json` 中 `config.designWidth` 的值，默认`750`)

**CSS**

- 可以使用内联样式、`tag`选择器、`class`选择器、id选择器来为组件设置样式
- 仅可以使用并列选择、后代选择器、子代选择器
- 支持`@import`引入外部样式、内联样式、行内样式
- 颜色值不支持缩写，伪类支持不完全（支持`:disabled`,`:checked`,`:focus`等)


# 八、组件

> `<text>`、`<a>`、`<span>`、`<label>`组件为文本容器组件，其它组件不能直接放置文本内容

**`<div>`: 和 HTML 一样**

> 支持样式 flex-direction, flex-wrap, justify-content, align-items, align-content

**`<popup>`: 气泡框**

- 支持属性 `target` 和 `placement`
- 支持样式 `mask-color`
- 支持事件 `visibilitychange`
- 自组件只能是`<text>`

**`<refresh>`: 下拉刷新**

- 支持属性 `offset `和 `refreshing`
- 支持样式 `background-color` 和 `progress-color`
- 支持事件 `refresh`


**`<richtext>`: 富文本编辑器**

- 支持属性 `type(值为 html)`
- 支持`div`样式, `height` 无效
- 不支持子组件

> 更多详情 https://doc.quickapp.cn/widgets/div.html


# 九、页面切换和参数传递

## 9.1 参数传递

**传递方法1**

> `<a>`标签配合 `queryString` 传递参数, 这个和前端一致

```html
<a href="/src/home/index.html?key=2333">跳转页面</a>

<!-- 添加变量参数 -->
<a href="/PageParams/receiveparams?key={{title}}">携带参数key2跳转</a>
```


**传递方法2**

```
// 导入模块
import router from '@system.router'
```

> 通过 `router` 接口：`router.push()`, `router.replace()`, 接受一个如下结构的对象，用法这个和前端 `router` 一致。

```javascript
{
  url: '/src/home/index.html',
  params: { key: 2333 /* 需要传递的参数 */ }
}
```

**接收参数**

> 上述2种传递参数的方法，其接收方法一致，在接收参数页面的 `protected `对象中获取即可（可设置默认值）

```javascript
 export default {
    protected: {
      key: ''
    },
    onInit () {
      this.$page.setTitleBar({ text: '接收参数' })

      // js中输出页面传递的参数
      console.info('key: ' + this.key)
    }
  }
```

**回传参数**

> 开发者可能会遇到需要在页面之间回传参数的需求


- 假设存在页面A和页面B，先从页面A跳转至页面B，然后从页面B返回到页面A时，需要传递参数
= 此时，组件a和接口router传参不能满足需求，可以借助于app级别的对象：this.$app.$data

> 页面A实现代码如下

```html
<template>
  <div class="tutorial-page">
    <a href="/PageParams/returnParams/pageb">跳转到页面B</a>
    <text>{{msg}}</text>
  </div>
</template>

<style>
  .tutorial-page {
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  a {
    margin-top: 75px;
    font-size: 30px;
    color: #09ba07;
    text-decoration: underline;
  }
</style>

<script>
  export default {
    private: {
      msg: ''
    },
    onInit () {
      this.$page.setTitleBar({ text: '页面A' })
    },
    onShow () {
      // 页面被切换显示时，从数据中检查是否有页面B传递来的数据
      if (this.$app.$data.dataPageB && this.$app.$data.dataPageB.gotoPage === 'pageA') {
        // 从数据中获取回传给本页面的数据
        const data = this.$app.$data.dataPageB.params
        this.msg = data.msg
      }
    }
  }
</script>
```

页面B实现代码如下：

```html
<template>
  <div class="tutorial-page">
    <text>页面B</text>
    <input style="width: 450px;" placeholder="请输入回传给页面A的信息" onchange="updateMsg"/>
  </div>
</template>

<style>
  .tutorial-page {
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
</style>

<script>
  export default {
    private: {
      msg: ''
    },
    onInit () {
      this.$page.setTitleBar({ text: '页面B' })
    },
    onHide () {
      // 页面被切换隐藏时，将要传递的数据对象写入
      this.$app.$data.dataPageB = {
        gotoPage: 'pageA',
        params: {
          msg: this.msg
        }
      }
    },
    updateMsg (e) {
      // 更新input输入的信息文本
      this.msg = e.text
    }
  }
</script>
```

## 9.2 页面间通信

> https://doc.quickapp.cn/framework/script.html

> 会利用到一个构造函数 `new BroadcastChannel(string)`, 它接受一个字符串参数，作为实例的频道名称。它的实例具有以下属性和方法

- `name ` 频道名称,区分不同的消息频道(注意：不同频道之间不可通信)。
- `postMessage` 用于在当前频道中广播消息
- `onmessage` 订阅消息。在频道中接收到广播消息之后，会给所有订阅者派发消息事件
- `close` 关闭当前的频道

> 其中 `onmessage` 事件有2个属性(通过 `event` 对象访问)

- `type` message
- `data` 接收到的消息内容


# 十、组件通信

**父组件到子组件**

- 子组件通过 `props` 获取父组件传入的值，见上文 template 部分
- 通过 `this.watch(props, callback)` 监控传入数据变化并调用回调函数
- 父组件通过`this.$broadcast()`完成事件触发，子组件通过`$on()`绑定事件并响应

**子组件到父组件**

- 父子组件传对象类型属于引用传递，可以直接修改父组件传入对象改变父组件数据
- 子组件通过`this.$dispatch()`完成事件触发，父组件通过`$on()`绑定事件并响应
- 子组件通过`this.$emit()`触发在节点上绑定的事件来执行父组件的方法

> * 注：`this.$broadcast()`、`this.$emit()` 和 `this.$dispatch() `参数一致
> * 注：触发时传递参数，再接收时使用`event.detail`来获取参数
> * 注：当传递结束后，可以调用`event.stop()`来结束传递

# 十一、Deeplink

> 配合`<web>`标签框架支持通过链接从外部打开应用，格式

```javascript
http://hapjs.org/app/<package>/[path][?key=value]
https://hapjs.org/app/<package>/[path][?key=value]
hap://app/<package>/[path][?key=value]
```

- `package`: 应用包名，必选
- `path`: 应用内页面的`path`，可选，默认为首页
- `key-value`: 希望传给页面的参数，可选，可以有多个

> 从传统网页调起需引入以下脚本

```
<script src='//statres.quickapp.cn/quickapp/js/routerinline.min.js'/>
```


# 十二、事件监听与触发

> `$on` 用于监听自定义事件；`$off`移除对应的事件监听

**$on(evtName, fnHandler)**

> 在当前页面注册监听事件， 可监听`$emit()`、 `$dispatch()`、 `$broadcast()`等触发的自定义事件，不能用于注册组件节点的事件响应

```javascript
export default {
    onInit(){
      this.$on('customEvtType1', this.customEvtType1Handler)
    },
    customEvtType1Handler(evt){
      // 事件类型，事件参数
      console.info(`触发事件：类型：${evt.type}, 参数： ${JSON.stringify(evt.detail)}`);
    }
  }
```

**$off(evtName, fnHandler)**

> 移除事件监听，参数 fnHandler 为可选，传递仅移除指定的响应函数，不传递则移除此事件的所有监听

```javascript
export default {
    removeEventHandler () {
      // 不传递fnHandler：移除所有监听
      this.$off('customEvtType1')
      // 传递fnHandler：移除指定的监听函数
      this.$off('customEvtType1', this.customEvtType1Handler)
    }
  }
```

**触发ViewModel事件**

> 页面的交互中可能会遇到一些非手动触发的需求，$emit() 通过触发当前实例上的事件达到动态触发事件的行为

**$emit(evtName, evtDetail)**

- 触发当前实例监听事件函数，与 `$on()` 配合使用
- 注意：`$emit()` 目前只触发 `$on` 所监听的事件

```javascript
export default {
    emitEvent () {
      this.$emit('customEvtType1', { params: '参数内容' })
    }
  }
```

**监听原生组件事件**

- 原生组件支持一系列事件，如通用事件（如：click, disappear）、组件专有事件（如：focus）

> - 在响应函数执行时通过target获取，如：onClickHandler
> - 在响应函数绑定时传递参数，如：onClickHandler2

```html
<template>
  <div class="tutorial-page">
    <text id="elNode1" class="{{ elClassName + 1 }}" disabled="false" onclick="onClickHandler">组件节点1</text>
    <text id="elNode2" class="class-static-1 {{ elClassName + 2 }}" onclick="onClickHandler2('参数1', argName)">组件节点2</text>
  </div>
</template>

<style lang="less">
  .tutorial-page {
    flex-direction: column;
  }
</style>

<script>
  export default {
    private: {
      elClassName: 'class-dynamic',
      argName: '动态参数'
    },
    onClickHandler (evt) {
      // 事件类型，参数详情
      console.info(`触发事件：类型：${evt.type}, 详情： ${JSON.stringify(evt.detail)}`);

      if (evt.target) {
        console.info(`触发事件：节点：${evt.target.id}, ${evt.target.attr.disabled}`)
      }
    },
    onClickHandler2 (arg1, arg2, evt) {
      // 事件类型，事件参数，target
      console.info(`触发事件：类型：${evt.type}, 参数： ${arg1}, ${arg2}`);
    }
  }
</script>
```

**触发原生组件事件**

> 通过`$emitElement()`完成事件的动态触发

- **$emitElement(evtName, evtDetail, id)**

> 可以触发指定组件`id`的事件，通过`evt.detail`获取传递的参数；该方法对自定义组件无效

```html
<template>
  <div class="tutorial-page">
    <text onclick="emitElement">触发组件节点的事件：click</text>
    <text id="elNode1" class="{{ elClassName + 1 }}" disabled="false" onclick="onClickHandler">组件节点1</text>
    <text id="elNode2" class="class-static-1 {{ elClassName + 2 }}" onclick="onClickHandler2('参数1', argName)">组件节点2</text>
  </div>
</template>

<style lang="less">
  .tutorial-page {
    flex-direction: column;
  }
</style>

<script>
  export default {
    private: {
      elClassName: 'class-dynamic',
      argName: '动态参数'
    },
    onClickHandler (evt) {
      // 事件类型，参数详情
      console.info(`触发事件：类型：${evt.type}, 详情： ${JSON.stringify(evt.detail)}`);

      if (evt.target) {
        console.info(`触发事件：节点：${evt.target.id}, ${evt.target.attr.disabled}`)
      }
    },
    onClickHandler2 (arg1, arg2, evt) {
      // 事件类型，事件参数，target
      console.info(`触发事件：类型：${evt.type}, 参数： ${arg1}, ${arg2}`);
    },
    emitElement () {
      // 注意：通过此类方式的事件不会携带target属性，开发者可以通过detail参数实现
      this.$emitElement('click', { params: '参数内容' }, 'elNode1')
    }
  }
</script>
```

# 十三、打包及发布

## 13.1 编译工具

**1）编译打包工程**

- 在工程的根目录下运行

```
npm run build
```

- 编译后的工程目录在`/build`
- 生成的应用路径为`/dist/.rpk`

**2）增加 release 签名**

> 通过 `openssl` 命令等工具生成签名文件`private.pem`、`certificate.pem`，例如：

> https://doc.quickapp.cn/tools/compiling-tools.html

```
opensslreq -newkey rsa:2048 -nodes -keyout private.pem -x509 -days 3650 -outcertificate.pem
```

> 在工程的 `sign` 目录下创建 `release` 目录，将私钥文件 `private.pem` 和证书文件 `certificate.pem` 拷贝进去

**3）发布程序包**

> 发布程序包前需要增加`release`签名，然后在工程的根目录下运行

```
npm run release
```

- 生成的应用路径为`/dist/.release.rpk`
- 如果需要临时使用 `debug` 签名，可以使用

```
npm run release -- --debug
```

## 13.2 IDE发布

- 1）生成证书。点击快应用面板的【生成证书】按钮, 按提示输入相关信息
- 2）生成发布用 `RPK`。点击【发布 `rpk`包】按钮, 生成成功的话会弹出对应的文件夹

![](https://bbs.quickapp.cn/data/attachment/forum/201812/15/182933kudoghhmnj8vc4ms.png)


# 十四、快应用分享专题

![](https://bbs.quickapp.cn/data/attachment/forum/201812/12/143505moccppi1ofo6b16a.png)


# 十五、上传到快应用中心审核

> 快应用注册账号 https://www.quickapp.cn/docCenter/post/74

![](https://poetries1.gitee.io/img-repo/2019/10/410.png)

# 十六、一些问题

- 资源文件、代码文件的命名均不能含有中文，命名不能连续使用下划线，否则打包发布时会包解析失败，导致无法上传
- 自定义属性名不能采用驼峰命名，否则值永远是 `undefined`
- `show` 属性并不好用，没起什么作用
- 类似 `onInit` 等等函数是页面生命周期，不是组件生命周期，不会因为组件状态变化而执行
- `display `类型只有 `flex` 和 `none`
- 子盒子不能将父盒子撑高
- 不遵循盒子模型，类似但不完全等同于 `border-box`
- 不能全局引用样式，只能在每个`page`中使用`@import`引入
- `<block>`逻辑控制块，仅支持`for`和`if/elif/else`，不支持`show`条件渲染
- `justify-content`属性，在快应用官方开发环境中，目前不支持`space-around`
- 针对于目前`vscode`插件`hap-extension`不支持`sass`语法，可以把`.scss`单独存储，通过`style.src`引入到`.ux`中，同时方便管理
- 当前自定义组件不支持传入的`props`为`function`
- 快应用中很多 `html `都不能用，比如没有 `p`,`h1~h2` 等，因为它只是模拟了部分 `html `标签,最终会转化成原生组件
- 只能使用 `a`、`span`、`text`、`label` 放置文本内容
- `position` 只能是 `fixed` 或 `none`
- 长度单位只有 `px `和` %`


# 十七、快应用开发资源

## 官方资讯

* [十大手机厂商共推快应用标准，发布会完美落幕](http://bbs.quickapp.cn/posts/detail?id=308)
* [教你尝鲜「快应用」！体验秒开，如丝般顺滑！](https://mp.weixin.qq.com/s/7zPwdXRAl7SIoFw4eKhXyA)
* [快应用+小程序，99%的Android程序员即将失业！](http://bbs.quickapp.cn/posts/detail?id=446)

## 官方文档

* [入门教程](https://doc.quickapp.cn/)
* [接口文档](https://doc.quickapp.cn/features/)
* [框架文档](https://doc.quickapp.cn/framework/)
* [官方网站](https://www.quickapp.cn/)
* [官方论坛](http://bbs.quickapp.cn/)
* [toolkit](https://doc.quickapp.cn/tools/toolkit-tools.html)
* [编译工具](https://doc.quickapp.cn/tools/compiling-tools.html)
* [调试工具](https://doc.quickapp.cn/tools/debugging-tools.html)

## 工具

* [Quix - UI for Quick App](https://github.com/wuxinzhe/Quix)
* [基于weui开发的quickapp](https://github.com/xiaomak/quickapp-weui)
* [快应用转换工具 - 小程序转快应用](http://quickapp.dcloud.io/#wxconvert)
* [flyio - 支持快应用的http网络库](https://segmentfault.com/a/1190000013984402?utm_source=tag-newest)

## 示例

* [Gank客户端](https://github.com/ColorfulCat/quickapp_gank)
* [内涵车站APP](https://github.com/Licoy/quickapp-neihanchezhan)
* [wanandroid快应用](https://github.com/CB-ysx/wanandroid-quickapp)
* [quickapp-douban](https://github.com/hjl19911127/quickapp-douban)
* [快应用版Wechat](https://github.com/yale8848/quickapp-wechat)

## 插件

* [Vscode Hap Extension--轻应用语法高亮插件](https://marketplace.visualstudio.com/items?itemName=yupeng528.hap)
* [Vscode 一个基于vscode应用于‘快应用’语法高亮](https://github.com/hatedMe/QuickApp-For-Highlighter)
* [Vscode Quick App美化代码](https://github.com/hatedMe/beautify-quick-app)

## 教程

* [对标小程序 ? "快应用"开发入门指南 By鸿洋](https://juejin.im/post/5ab26a1e6fb9a028b547c675)
* [快应用快速入门教程 by大大花猫](https://juejin.im/post/5ab27d8e518825557e78485e)
* [快应用 QuickApp--入门指北](https://zhuanlan.zhihu.com/p/34774751)
* [快应用简明使用指引](https://github.com/williamfzc/QuickAppLearner)
* [快应用QuickApp--HelloWorld体验](https://www.cnblogs.com/simleSmith/p/8618256.html)
* [快应用快速入门教程 by五个半柠檬(SF)](https://segmentfault.com/a/1190000014012762?utm_source=tag-newest)

## 讨论

* [「快应用」项目？会对微信小程序以及 App 生态有何影响？(知乎)](https://www.zhihu.com/question/268663484/answer/343010272)
* [如何看待国内几家硬件厂商联合鼎力打造的快应用?(知乎)](https://www.zhihu.com/question/268675437/answer/343249351)
* [九大厂商联合推出「快应用」，围攻微信？(知乎)](https://zhuanlan.zhihu.com/p/34796337)
* [腾讯“小程序”与手机“快应用”之战(知乎)](https://zhuanlan.zhihu.com/p/34877700)

## 分享

* [饿了么快应用初体验](https://juejin.im/post/5ab119ef51882555712c3372)
* [是前端还是Android？快应用 快速入门与初步分析](https://segmentfault.com/a/1190000013915359)
* [快应用初体验](https://juejin.im/post/5ab378235188255574599cc4)
* [[前端工坊]快应用-技术调研](https://mp.weixin.qq.com/s/44SX9k1tbAtqhaxP-OwosQ)
* [快应用发起进攻第一枪！小米直达服务正式更名快应用](https://zhuanlan.zhihu.com/p/34985022)
* [手机厂商和开发者为何看好快应用新生态](https://zhuanlan.zhihu.com/p/34984080)
* [魅族体验快应用：免安装，快速触达你要的服务](https://zhuanlan.zhihu.com/p/35007620)
- [资源汇总 快应用开发常见问题和技术帖子汇总（持续更新）](https://bbs.quickapp.cn/forum.php?mod=viewthread&tid=838)
- [快应用API Demo 集合 QuickAPP](https://github.com/l455202325/APIDemo)

> 更多详情 https://github.com/yesvods/awesome-quick-app

