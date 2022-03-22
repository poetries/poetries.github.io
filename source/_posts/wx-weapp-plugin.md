---
title: 小程序插件总结
date: 2021-04-20 20:01:24
tags: 小程序
categories: Front-End
---

## 一、小程序插件功能介绍

> 插件的开发和使用自小程序基础库版本 `1.9.6` 开始支持

- 插件是对一组 js 接口、自定义组件或页面的封装，用于嵌入到小程序中使用
- 插件不能独立运行，必须嵌入在其他小程序中才能被用户使用
- 第三方小程序在使用插件时，也无法看到插件的代码。因此，插件适合用来封装自己的功能或服务，提供给第三方小程序进行展示和使用
- 会受到一些限制，如一些 API 无法调用或功能受限。还有个别特殊的接口，虽然插件不能直接调用，但可以使用 插件功能页 来间接实现
- 框架会对小程序和小程序使用的每个插件进行数据安全保护，保证它们之间不能窃取其他任何一方的数据（除非数据被主动传递给另一方）。


> 插件，是可被添加到小程序内直接使用的功能组件。开发者可以像开发小程序一样开发一个插件，供其他小程序使用。同时，小程序开发者可直接在小程序内使用插件，无需重复开发，为用户提供更丰富的服务

插件可以是

- 提供查询快递信息的服务
- 提供查询天气的服务
- 提供打车（滴滴）的服务 - 可以使用滴滴提供的组件，直接嵌入自己的小程序，实现打车功能）
- 提供外卖（美团外卖）的服务 - 例如每个餐厅需要的小程序风格都不一样，但他都需要外卖功能，那这时就可以给餐厅都定制一个小程序，在外卖部分的功能可以直接使用美团外卖提供的外卖插件（*后面发现插件居然不能微信支付）

> 除了可以做这些方面还有很多很多，但小程序插件目前限制了开放范围及服务类目（[开放类目](https://developers.weixin.qq.com/miniprogram/introduction/plugin.html#%E5%BC%80%E6%94%BE%E8%8C%83%E5%9B%B4%E5%8F%8A%E6%9C%8D%E5%8A%A1%E7%B1%BB%E7%9B%AE)）

**开放范围**：企业、媒体、政府及其他组织主体

开发者可选择当前小程序帐号已选类目中的一个，作为插件的服务类目。以下为当前已开放的插件服务类目，将逐步开放更多类目。

| 一级类目     | 二级类目                                                     | 特殊说明             |
| ------------ | ------------------------------------------------------------ | -------------------- |
| 快递业与邮政 | 所有二级类目                                                 |                      |
| 医疗         | 就医服务、互联网医院                                         | 仅医疗类小程序可使用 |
| 政务民生     | 所有二级类目                                                 |                      |
| 金融业       | 征信业务                                                     |                      |
| 出行与交通   | 所有二级类目                                                 |                      |
| 生活服务     | 票务、生活缴费                                               |                      |
| IT科技       | 所有二级类目                                                 |                      |
| 餐饮         | 点评与推荐、菜谱、餐厅排队、点餐平台、外卖平台               |                      |
| 旅游         | 所有二级类目                                                 |                      |
| 文娱         | 视频、FM/电台、音乐、有声读物、动漫                          |                      |
| 工具         | 记账、投票、日历、天气、备忘录、办公、字典、计算类、报价/比价、发票查询、企业管理 |                      |
| 电商平台     | 电商平台                                                     |                      |
| 商业服务     | 招聘/求职                                                    |                      |
| 汽车         | 所有二级类目                                                 |                      |

**开发小程序插件的流程**

1. 开通入口：`小程序管理后台-小程序插件`
2. 开通插件功能 条件：企业、媒体、政府及其他组织主体的小程序，个人小程序不行 个数：一个小程序只能开通一个插件
3. 填写开发信息并开发 限制：填写了小程序插件基本信息和头像就不能修改
4. 提交审核、发布 限制：在开发类目内才能提交 官方文档说“插件发布后才可以被其他小程序搜索并添加”，但实际上不是，没有发布的也可以搜索到和添加


## 二、创建插件项目

小程序的 AppID 可以创建小程序插件项目，插件是独立于小程序之外的，但是 AppID 是公用的，所以`不要使用原有的小程序项目进行插件开发`。 在创建项目页面，选择一个空文件夹作为项目路径，可以选择创建小程序插件快速启动模板

> 没有插件appId的，我们需要去申请一个，用来开发插件

![](https://img.poetries.top/static/images/20210419092828.png)

- `miniprogram` 目录：放置一个小程序，用于调试插件。
  - 文件夹是一个普通小程序项目，用来编写小程序插件的使用 Demo，上传插件代码时这个 Demo 会一起上传，并作为小程序插件的发布的审核依据.
- `plugin` 文件就是小程序插件项目，用来编写小程序插件的代码。
- `project.config.json` 需要关注 `compileType` 字段，`compileType == 'plugin'` 时才能正常的使用插件项目。详情
- `doc 目录`：插件文档必须放置在插件项目根目录中的 doc 目录下
  - 插件文档的入口文件是 `doc/README.md`，在 `README.md` 中引用到的图片资源不能是网络图片，且必须放在这个目录下。
  - 文档中的链接只能链接到
    - 微信开发者社区（developers.weixin.qq.com）
    - 微信公众平台（mp.weixin.qq.com）
    - GitHub（github.com）
  - 编辑 `README.md` 之后，可以在开发者工具左侧资源管理器的文件栏中右键单击`README.md`，并选择上传文档。发布上传文档后，文档不会立刻发布。此时可以使用帐号和密码登录 管理后台 ，在 `小程序插件 > 基本设置` 中预览、发布插件文档
  - 插件文档`总大小不能大于 2M`，超过时上传将返回错误码 80051
  ![](https://img.poetries.top/static/images/20210419093822.png)

### 2.1 插件目录结构

一个插件可以包含若干个自定义组件、页面，和一组 js 接口。插件的目录内容如下

```js
plugin
├── components
│   ├── hello-component.js   // 插件提供的自定义组件文件夹， 中自定义组件可以有多个
│   ├── hello-component.json
│   ├── hello-component.wxml
│   └── hello-component.wxss
├── pages
│   ├── hello-page.js        // 插件提供的页面（可以有多个，自小程序基础库版本 2.1.0 开始支持）
│   ├── hello-page.json
│   ├── hello-page.wxml
│   └── hello-page.wxss
├── index.js                 //  插件入口文件，可以在这里 export 一些 js 接口，供插件使用者使用
└── plugin.json              //  插件的配置文件，主要说明有哪些自定义组件可以供插件外部调用，并标识哪个js文件是插件的js接口文件，默认的配置形式如下：

{
  "publicComponents": {
    "list": "components/list/list"
  },
  "main": "index.js"
}
```

### 2.2 插件配置文件

> 提供给使用者小程序使用的自定义组件必须在配置文件的 publicComponents 段中列出

```json
{
  "publicComponents": {
    "hello-component": "components/hello-component"
  },
  "pages": {
    "hello-page": "pages/hello-page"
  },
  "main": "index.js"
}
```

这个配置文件将向使用者小程序开放一个自定义组件 `hello-component`，一个页面 `hello-page` 和 `index.js` 下导出的所有 js 接口。

### 2.3 插件预览、上传和发布

- 插件可以像小程序一样预览和上传，但`插件没有体验版`。
- 插件会同时有多个线上版本，由使用插件的小程序决定具体使用的版本号。
- 手机预览和提审插件时，会使用一个特殊的小程序来套用项目中 miniprogram 文件夹下的小程序，从而预览插件。

**在开发版小程序中测试**

- 通常情况下，可以将 `miniprogram` 下的代码当做使用插件的小程序代码，来进行插件的调试和测试
- 但有时，`需要将插件的代码放在实际运行的小程序中进行调试、测试`。此时，`可以使用开发版的小程序直接引用开发版插件`。方法如下：

1. 在开发者工具的插件项目中上传插件，此时，在上传成功的通知信息中将包含这次上传获得的插件开发版 ID （一个英文、数字组成的随机字符串）；
2. 点击开发者工具右下角的通知按钮，可以打开通知栏，看到`新生成的 ID` ；
3. 在需要使用开发版本插件的小程序项目中，将插件 `version` 设置为 `"version": "dev-[开发版 ID]"` 的形式，如 `"version": "dev-abcdef0123456789abcdef0123456789"` 即可。

> 如果开发版小程序引用了开发版插件，此时这个小程序就不能上传发布了。必须要将插件版本设为正式版本之后，小程序才可以正常上传、发布

**注意事项：**

- `每次上传插件所生成的 ID 不一定相同`，即使是同一个插件和同一个开发者，`多次上传也可能会改变 ID`；
- 每个开发者在每个插件中只会同时存在一个有效的开发版插件，即只有最新上传的开发版 ID 有效（使用旧的 ID 会提示失效）；
- 同一个插件不同开发者上传的开发版互不影响，可以同时有效；
- 开发版插件没有时间限制，长期有效。


## 三、使用插件

- **添加插件**
 - 在使用插件前，首先要在小程序管理后台的`“设置-第三方服务-插件管理”`中添加插件。开发者可登录小程序管理后台，通过 appid 查找插件并添加。如果插件无需申请，添加后可直接使用；否则需要申请并等待插件开发者通过后，方可在小程序中使用相应的插件。
  ![](https://img.poetries.top/static/images/20210416164731.png)
- **引入插件代码包**
  - 使用插件前，使用者要在 `app.json` 中声明需要使用的插件，例如
    - **在主包中使用插件**
      ```json
        {
          "plugins": {
            "myPlugin": {
              "version": "1.0.0",
              "provider": "wxidxxxxxxxxxxxxxxxx"
            }
          }
        }
      ```
      - `plugins` 定义段中可以包含多个插件声明，每个插件声明以一个使用者自定义的插件引用名作为标识，并指明插件的 appid 和需要使用的版本号。其中，引用名（如上例中的 myPlugin）由使用者自定义，无需和插件开发者保持一致或与开发者协调。在后续的插件使用中，该引用名将被用于表示该插件
    - **在分包内引入插件代码包**
      - 如果插件只在一个分包内用到，可以将插件仅放在这个分包内，例如：
        ```json
          {
            "subpackages": [
              {
                "root": "packageA",
                "pages": [
                  "pages/cat",
                  "pages/dog"
                ],
                "plugins": {
                  "myPlugin": {
                    "version": "1.0.0",
                    "provider": "wxidxxxxxxxxxxxxxxxx"
                  }
                }
              }
            ]
          }
        ```
      - 在分包内使用插件有如下限制：
        - 仅能在这个分包内使用该插件
        - 同一个插件不能被多个分包同时引用


**使用插件方式**

> 使用插件时，插件的代码对于使用者来说是不可见的。阅读由插件开发者提供的插件开发文档，通过文档来明确插件提供的自定义组件、页面名称及提供的 js 接口规范等。

- **使用插件提供的自定义组件**
  - 使用插件提供的自定义组件，和 使用普通自定义组件 的方式相仿。在 json 文件定义需要引入的自定义组件时，使用 `plugin:// 协议指明插件的引用名和自定义组件名`，例如
  - 插件跳转到自身页面时， url 应设置为这样的形式：`plugin-private://PLUGIN_APPID/PATH/TO/PAGE` 。需要跳转到其他插件时，也可以这样设置 url 。
  ```json
    {
      "usingComponents": {
        "hello-component": "plugin://myPlugin/hello-component"
      }
    }
  ```
  - 出于对插件的保护，插件提供的自定义组件在使用上有一定的限制：
    - 默认情况下，页面中的 `this.selectComponent` 接口无法获得插件的自定义组件实例对象；
    - `wx.createSelectorQuery` 等接口的 >>> 选择器无法选入插件内部
- **使用插件提供的页面**
  - 需要跳转到插件页面时，url 使用 `plugin:// 前缀`，形如 `plugin://PLUGIN_NAME/PLUGIN_PAGE`
  ```html
    <navigator url="plugin://myPlugin/hello-page">
      Go to pages/hello-page!
    </navigator>
  ```
- **js 接口**
  - 使用插件的 js 接口时，可以使用 `requirePlugin` 方法。例如，插件提供一个名为 hello 的方法和一个名为 world 的变量，则可以像下面这样调用：
  ```js
    var myPluginInterface = requirePlugin('myPlugin');

    myPluginInterface.hello();
    var myWorld = myPluginInterface.world;
  ```
  - 基础库 `2.14.0` 起，也可以通过`插件的 AppID 来获取接口`，如：`var myPluginInterface = requirePlugin('wxidxxxxxxxxxxxxxxxx')`
- **使用插件的小程序可以导出内容到插件中共享**
  - 在声明使用插件时，可以通过 `export` 字段来指定一个文件
  ```json
    "myPlugin": {
      "version": "dev",
      "provider": "",
      "export": "exportToPlugin.js"
    }
  ```
  ![](https://img.poetries.top/static/images/20210419141729.png)
  - 导出的内容可以被这个插件用全局函数获得。例如，在上面的文件中，使用插件的小程序做了如下导出：
  ![](https://img.poetries.top/static/images/20210419141948.png)

**为插件提供小程序自定义组件**

> 在插件中可以将一部分区域交给使用的小程序来渲染

给插件名为 `plugin-index` 的页面中的抽象节点 `mp-view` 指定小程序的自定义组件 `components/comp-from-miniprogram` 作为实现的话

```json
{
  "myPlugin": {
    "provider": "wxAPPID",
    "version": "1.0.0",
    "genericsImplementation": {
      "plugin-index": {
        "mp-view": "components/comp-from-miniprogram"
      }
    }
  }
}
```

```html
<!-- miniprogram/page/index.wxml -->
<plugin-view generic:mp-view="comp-from-miniprogram" />
```

## 四、插件的一些限制

### 4.1 调用 API 的限制

- 插件的请求域名列表与小程序相互独立；
- 一些 API 不允许插件调用（这些函数不存在于 wx 对象下）。
- 有些接口虽然在插件中不能使用，但可以通过插件功能页来达到目的，请参考插件功能页。

**小程序插件中不能使用API**

| wx.login                    | 登录                   |
| --------------------------- | ---------------------- |
| wx.getUserInfo              | 获取用户信息           |
| wx.chooseAddress            | 获取用户收货地址       |
| wx.requestPayment           | 【发起微信支付】       |
| wx.addCard                  | 添加卡券               |
| wx.openCard                 | 打开卡券               |
| wx.saveFile                 | 保存文件               |
| wx.getSavedFileList         | 获取已保存的文件列表   |
| wx.getSavedFileInfo         | 获取已保存的文件信息   |
| wx.removeSavedFile          | 删除已保存的文件信息   |
| wx.openDocument             | 打开文件               |
| wx.getStorageInfo           | 获取本地缓存的相关信息 |
| wx.getStorageInfoSync       | 获取本地缓存的相关信息 |
| wx.clearStorage             | 清理本地数据缓存       |
| wx.clearStorageSync         | 清理本地数据缓存       |
| wx.setNavigationBarTitle    | 设置当前页面标题       |
| wx.showNavigationBarLoading | 显示导航条加载动画     |
| wx.hideNavigationBarLoading | 隐藏导航条加载动画     |
| wx.navigateTo               | 新窗口打开页面         |
| wx.redirectTo               | 原窗口打开页面         |
| wx.switchTab                | 切换到 tabbar 页面     |
| wx.navigateBack             | 退回上一个页面         |
| wx.stopPullDownRefresh      | 停止下拉刷新动画       |

### 4.2 使用组件的限制

在插件开发中，以下组件不能在插件页面中使用：

- 开放能力（open-type）为以下之一的 button： contact（打开客服会话） getPhoneNumber（获取用户手机号） getUserInfo（获取用户信息）
- open-data
- web-view 以下组件的使用对基础库版本有要求
- navigator 需要基础库版本 2.1.0
- live-player 和 live-pusher 需要基础库版本 2.3.0

### 4.3 注意事项 

- **插件间互相调用**
  - 插件不能直接引用其他插件。但如果小程序引用了多个插件，插件之间是可以互相调用的。
  - 一个插件调用另一个插件的方法，与插件调用自身的方法类似。可以使用 `plugin-private://APPID 访问插件的自定义组件、页面`（暂不能使用 plugin:// ）。
  - 对于 js 接口，可使用 `requirePlugin` ，但目前尚不能在文件一开头就使用 `requirePlugin` ，因为被依赖的插件可能还没有初始化，请考虑在更晚的时机调用 `requirePlugin` ，如接口被实际调用时、组件 attached 时

## 五、插件功能页

### 5.1 插件功能页

插件功能页从小程序基础库版本 `2.1.0` 开始支持。

> 某些接口不能在插件中直接调用（如 `wx.login`），但插件开发者可以使用插件功能页的方式来实现功能。目前，插件功能页包括

- 获取用户信息，包括 `openid `和昵称等（相当于 `wx.login` 和 `wx.getUserInfo `的功能），详见用户信息功能页
- 支付（相当于 `wx.requestPayment`），详见支付功能页；
- 获取收货地址（相当于 `wx.chooseAddress`），详见收货地址功能页。

> 要使用插件功能页，需要先激活功能页特性，配置对应的功能页函数，再使用 [functional-page-navigator](https://developers.weixin.qq.com/miniprogram/dev/component/functional-page-navigator.html) 组件跳转到插件功能页，从而实现对应的功能

- 激活功能页特性
  - 要在插件中调用插件功能页，需要先激活插件所有者小程序的功能页特性
  - `app.json` 文件中添加 `functionalPages` 定义段
  ```json
    {
      "functionalPages": {
        "independent": true
      }
    }
  ```


### 5.2 跳转到功能页

> 功能页不能使用 `wx.navigateTo` 来进行跳转，而是需要一个名为 `functional-page-navigator` 的组件。以获取用户信息为例，可以在插件中放置如下的 `functional-page-navigator`

```html
<functional-page-navigator name="loginAndGetUserInfo" args="" version="develop" bind:success="loginSuccess">
  <button>登录到插件</button>
</functional-page-navigator>
```

- 用户在点击这个 `navigator` 时，会自动跳转到插件所有者小程序的对应功能页。功能页会提示用户进行登录或其他相应的操作。操作结果会以组件事件的方式返回。
- 从小程序基础库版本 2.4.0 开始，支持插件所有者小程序跳转到自己的功能页。在基础库版本低于 2.4.0 时，点击跳转到自己的功能页的 `functional-page-navigator` 将没有任何反应

> 注意：`functional-page-navigator` 的 `version=develop` 仅用于调试，因此在插件提审前，需要：

- 确保已发布设置了 `"functionalPages": true` 的插件所有者小程序；
- 确保所有的 `functional-page-navigator` 组件属性设置为 `version="release"`

### 5.4 小程序部分功能页

**1. 用户信息功能页**

> 用户信息功能页用于帮助插件获取用户信息，包括 openid 和昵称等，相当于 wx.login 和 wx.getUserInfo 的功能。

此外，自基础库版本 2.3.1 起，用户在这个功能页中授权之后，插件就可以直接调用 `wx.login 和 wx.getUserInfo` 。无需再次进入功能页获取用户信息。自基础库版本 2.6.3 起，可以使用 `wx.getSetting` 来查询用户是否授权过

**2. 支付功能页**

- 支付功能页用于帮助插件完成支付，相当于 `wx.requestPayment` 的功能。
- 需要注意的是：插件使用支付功能，需要进行额外的权限申请，申请位置位于管理后台的`“小程序插件 -> 基本设置 -> 支付能力”`设置项中。另外，无论是否通过申请，主体为个人小程序在使用插件时，都无法正常使用插件里的支付功能。

**3. 收货地址功能页**

收货地址功能页用于展示用户的收货地址列表，用户可以选择其中的收货地址。自基础库版本 2.4.0 开始支持。


