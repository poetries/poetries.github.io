---
title: 小程序入门总结篇
date: 2018-08-09 16:20:20
tags: 小程序
categories: Front-End
---


## 一、小程序代码组成

![](https://poetries1.gitee.io/img-repo/2019/10/664.png)

**须知**

- `App()` 必须在 `app.js` 中注册，且不能注册多个。
- 编译后的代码包大小需小于 `1MB`，否则代码包将上传失败。
- 每个页面需要手动在`app.json`中进行注册，否则不能访问。
- `app.json`中`pages`数组的第一项代表小程序的初始页面，小程序中新增/减少页面，都需要对 `pages` 数组进行修改。
- 直接修改 `this.data`无效，无法改变页面的状态，还会造成数据不一致。
- 单次设置的数据不能超过`1024kB`，请尽量避免一次设置过多的数据。
- 不要尝试修改页面栈，会导致路由以及页面状态错误。
- `tabBar`只能配置最少2个、最多5个，`tab` 按数组的顺序排序。
- 小程序页面只能同时打开 5 个，如果交互流程较长难以支持。
- 同时只能存在 5 个`url`请求。
- 无法跳转小程序以外的`url`。
- 没有`cookie`。
- 没有开放加载`web`页面
- 没有a标签链接，不可嵌套`iframe`
- 没有`window`变量，但微信提供了wx全局方法集
- 事件绑定和条件渲染类似`Angular`，全部写在`WXML`中

### 1.1 主体

> 由`app.js`、`app.json`、`app.wxss`三个文件组成，放在根目录

- `app.js` 根目录的`app.js`很有用,因为在它内部注册的变量或方法，都是可以被所有页面获取到。可以监听并处理小程序的生命周期、声明全局变量。其余的`.js`文 件可以通过`var app = getApp()` 获取其实例，调用其中定义的方法和变量，但不可以调用生命周期的方法
- `app.json `是小程序的全局配置

```
pages 配置小程序的组成页面，第一个代表小程序的初始页面
window  设置小程序的状态栏、标题栏、导航条、窗口背景颜色
tabBar  配置小程序tab栏的样式和对应的页面
```

- `app.wxss` 是小程序的公共样式表，可以在其他`.wxss`文件中直接使用


> `app.json`


```javascript
"pages": [ //设置页面的路径
  "pages/index/index", //不需要写index.wxml,index.js,index,wxss,框架会自动寻找并整合
  "pages/logs/logs"
],
"window": { //设置默认窗口的表现形式
  "navigationBarBackgroundColor": "#ffffff", //顶部导航栏背景色
  "navigationBarTextStyle": "black", //顶部导航文字的颜色 black/white
  "navigationBarTitleText": "微信接口功能演示", //顶部导航的显示文字
  "backgroundColor": "#eeeeee", //窗口的背景色
  "backgroundTextStyle": "light", //下拉背景字体、loading 图的样式，仅支持 dark/light
  "enablePullDownRefresh": "false"， //是否支持下拉刷新 ，不支持的话就直接不写！
  "disableScroll": true, //  设置true不能上下滚动，true/false，注意！只能在 page.json 中有效，无法在 app.json 中设置该项。
},
"tabBar": { //底部tab或者顶部tab的表现，是个数组，最少配置2个，最多5个
  "list": [{ //设置tab的属性，最少2个，最多5个
    "pagePath": "pages/index/index", //点击底部 tab 跳转的路径
    "text": "首页", //tab 按钮上的文字
    "iconPath": "../img/a.png", //tab图片的路径
    "selectedIconPath": "../img/a.png" //tab 在当前页，也就是选中状态的路径
  }, {
    "pagePath": "pages/logs/logs",
    "text": "日志"
  }],
  "color": "red", //tab 的字体颜色
  "selectedColor": "#673ab7", //当前页 tab 的颜色，也就是选中页的
  "backgroundColor": "#2196f3", //tab 的背景色
  "borderStyle": "white", //边框的颜色 black/white
  "position": "bottom" //tab处于窗口的位置 top/bottom
  },
"networkTimeout": { //默认都是 60000 秒一分钟
    "request": 10000, //请求网络超时时间 10000 秒
    "downloadFile": 10000， //链接服务器超时时间 10000 秒
      "uploadFile": "10000", //上传图片 10000 秒
    "downloadFile": "10000" //下载图片超时时间 10000 秒
  },
"debug": true //项目上线后，建议关闭此项，或者不写此项
```


### 1.2 pages

> `pages`文件夹里是小程序的各个页面，每个界面一般都由`.wxml`、`.wxss`、`.js`、`.json`四个文件组成，四个文件必须是相同的名字和路径

- `.js` 是页面的脚本代码，通过`Page()`函数注册页面。可以指定页面的初始数据、生命周期、事件处理等 
- `.wxml` 是页面的布局文件，只能使用微信定义的组件 
- `.wxss` 是样式表，需要注意
  - 尺寸单位：`rpx` 可以根据屏幕的宽带进行自适应
  - 样式导入：`@import`导入外联样式表，如：`@import "test.wxss"`;
  - 定义在`app.wxss`中的全局样式，作用于每个页面。定义在`page`的`.wxss`文件只作用于对应的页面，会覆盖`app.wxss`中相同的选择器
- `.json` 是页面的配置文件，只能设置`app.json`中的`window`配置内容，会覆盖`app.json`中`window`的相同配置项，即使不配置任何东西也需要写`{}`,否则会报错

### 1.3 utils

> `utils` 里面包含一些公共的代码抽取的`js`文件，作为模块方便使用。模块通过`module.exports`对外暴露接口

- 其他地方使用是`var utils = require('../../utils/util.js')` 进行引用


## 二、视图层 WXML

### 2.1 数据绑定


> 传统的视图和数据绑定

![](https://poetries1.gitee.io/img-repo/2019/10/665.png)


**那么微信小程序是通过什么方法来管理视图和对象绑定的呢,状态模式-单向数据流**

![](https://poetries1.gitee.io/img-repo/2019/10/666.png)


> 数据流向是单向的，即视图变化不会影响对象状态

- 用户触发事件不仅要考虑当前`UI`元素更新，还会通过当前元素更新其他视图。
- 所以视图上的数据都必须用过事件传递给对象，只有用户操作视图，才能获取到数据，并更新对象状态

![](https://poetries1.gitee.io/img-repo/2019/10/667.png)


> `.wxml` 中的动态数据都来自`Page`中的`data`。数据绑定使用数据绑定使用双大括号将变量包起来，可以作用于内容、组件属性(需要在双引号之内)、控制属性(需要在双引号之内)、关键字(需要在双引号之内)


```javascript
Page({
    data: {
        message: "Hello",
        id:0,
        status: true
    }
})
```


```
<view> {{message}} </view>
<view id="item-{{id}}"> </view>
<view wx:if="{{status}}"> </view>
<view hidden="{{status}}"> </checkbox>
```


> 还可以进行简单的运算在大括号里


```
<view hidden="{{status ? true : false}}"> Hidden </view>
<view> {{a + b}} + c </view> 
<view wx:if="{{num > 6}}"> </view>
<view>{{"hello" + word}}</view>
```


### 2.2 条件渲染

> 用 `wx:if=”{{status}}”`来判断是否渲染代码块

```
<view wx:if="{{status}}"> isShow </view>
```


> 还可以添加`else`块


```
<view wx:if="{{num > 5}}"> A </view>
<view wx:elif="{{num > 2}}"> B </view>
<view wx:else> C </view>
```


### 2.3 列表渲染

- 在组件上使用 `wx:for`属性绑定一个数组，就可以渲染组件了 
- 默认情况下数组的当前下标变量名为`index`,当前项的变量名为`item`

```
<view wx:for="{{array}}">
  {{index}}: {{item.message}}
</view>
```

```javascript
Page({
  data: {
    array: ["AA","BB","CC"]
  }
})
```

> 使用 `wx:for-item` 可以指定数组当前元素的变量名，使用 `wx:for-index` 可以指定数组当前下标的变量名


```
<view wx:for="{{array}}" wx:for-index="num" wx:for-item="itemName">
  {{num}}: {{itemName}}
</view>
```

### 2.4 模板template

- `name` 定义组件模版的名称，引用模版的时候使用 `is` 属性指定模版的名字，`is` 可以进行简单的三目运算，需要传入模版需要的 `data` 数据。
- 因为模版拥有自己的作用域，所以只能使用 `data` 传入数据，而不接受双花括号的写法

```
<template name="msgItem">
<view>
<text> {{index}}: {{msg}} </text>
<text> Time: {{time}} </text>
</view>
</template>

<!-- 其他代码 -->
<template is="msgItem" data="{{...item}}"/>
```

### 2.5 公共模块的引用

- `WXML` 提供 `import` 和 `include` 两种文件引用方式。
- `import` 有作用域的概念，不能多重引用

```
<!-- B.wxml -->
<import src="a.wxml"/>

<!-- A.wxml -->
<template name="A">
 <text> A template </text>
</template>
```

> `include` 就可以多重引用

```
<!--引用 header、其中 header.wxml 中也引用了 footer.wxml-->
<include src="header.wxml"/>
<view> body </view>

<!-- header.wxml -->
<view> header </view>
<include src="footer.wxml"/>
```

### 2.6 事件

- 名称以 `bind` 开头的事件不阻止冒泡，名称以 `catch` 开头的事件冒泡是阻止的。如 `bindTap` 和 `catchTab`
- 在 `WXM`L 中，可以使用 `dataset` 定义` data `中的数据，会通过事件传递。它的事件以 `data- `开头，多个单词以 - 链接，如 `data-a-b`



## 三、生命周期


### 3.1 App()应用生命周期

![](https://poetries1.gitee.io/img-repo/2019/10/668.png)

- 用户首次打开小程序，触发 `onLaunch`（全局只触发一次）。
- 小程序初始化完成后，触发`onShow`方法，监听小程序显示。
- 小程序从前台进入后台，触发 `onHide`方法。
- 小程序从后台进入前台显示，触发 `onShow`方法。
- 小程序后台运行一定时间，或系统资源占用过高，会被销毁。
- 小程序出错，触发`onError`

> 前台、后台定义： 当用户点击左上角关闭，或者按了设备 Home 键离开微信，小程序并没有直接销毁，而是进入了后台；当再次进入微信或再次打开小程序，又会从后台进入前台

```javascript
//app.js
App({
  onLaunch: function() { 
      //小程序初始化(全局只触发一次)
  },
  onShow: function() {
      //小程序显示
  },
  onHide: function() {
      //小程序隐藏
  },
  onError: function(msg) {
      //小程序错误
  },
})
//其他 开发者可以添加任意的函数或数据到 Object 参数中，用 this 可以访问
```

### 3.2 Page页面生命周期

> 每个页面也有自己的生命周期

![](https://poetries1.gitee.io/img-repo/2019/10/669.png)

- 小程序注册完成后，加载页面，触发`onLoad`方法。
- 页面载入后触发`onShow`方法，显示页面。
- 首次显示页面，会触发`onReady`方法，渲染页面元素和样式，一个页面只会调用一次。
- 当小程序后台运行或跳转到其他页面时，触发`onHide`方法。
- 当小程序有后台进入到前台运行或重新进入页面时，触发`onShow`方法。
- 当使用重定向方法`wx.redirectTo(OBJECT)`或关闭当前页返回上一页`wx.navigateBack()`，触发`onUnload`

```javascript
//index.js
Page({
  onLoad: function(options) {
    //页面加载-----(一个页面只会调用一次)
  },
  onReady: function() {
    //页面渲染-----(一个页面只会调用一次)
  },
  onShow: function() {
    //页面显示-----(每次打开页面都会调用一次)
  },
  onHide: function() {
    //页面隐藏-----(当navigateTo或底部tab切换时调用)
  },
  onUnload: function() {
    //页面卸载-----(当redirectTo或navigateBack的时候调用)
  },
})
//其他 开发者可以添加任意的函数或数据到 object 参数中，在页面的函数中用 this 可以访问
```

### 3.3 应用生命周期影响页面生命周期

![](https://poetries1.gitee.io/img-repo/2019/10/670.png)

- 小程序初始化完成后，页面首次加载触发`onLoad`，只会触发一次。
- 当小程序进入到后台，先执行页面`onHide`方法再执行应用`onHide`方法。
- 当小程序从后台进入到前台，先执行应用`onShow`方法再执行页面`onShow`方法

## 四、小程序限制

### 4.1 程序限制

- 脚本内不能使用`window`等对象
- `zepto/jquery` 会使用到`window`对象和`document`对象，所以无法使用。
- 样式表不支持级联选择器
- 本地资源无法通过 `css` 获取 `background-image`可以使用网络图片，或者 `base64`，或者使用标签
- 不支持 `A` 标签，无法打开普通网页

### 4.2 数量限制

- 底部或顶部可以添加`tab`按钮区域 `tabBar` 是一个数组，只能配置最少2个、最多5个 `tab`，`tab`按数组的顺序排序。
- 一个应用同时只能打开5个页面
- 小程序的`wx.request`请求最开始最大并发数是5个，后来，估计随着用小程序的越来越多，总之，就是增加到了10个

### 4.3 大小限制

- `tabBar` 上面的按钮 `iconPath` 图片路径，`icon `大小限制为`40kb`
- `tabBar` 上面的按钮 `selectedIconPath `选中时的图片路径，`icon` 大小限制为`40kb`
- `setData` 页面传递数据单次设置的数据不能超过`1024kB`
- `setStorage` 本地缓存最大为`10MB`
- 小程序源码打包后的大小限制为`1M`


## 五、路由

- 微信路由接口有三个，分别是`wx.redirectTo`、`wx.navigateTo`和`wx.switchTab`
`wx.navigateTo`全局最多调用5次
- 如果某页面设置为`tab`页，则只支持`wx.switchTab`，不支持其他两种路由方式访问

### 5.1 哪些情况会触发页面跳转

- 小程序启动，初始化第一个页面
- 打开新页面，调用 API `wx.navigateTo` 或使用`<navigator />`组件
- 页面重定向，调用 API `wx.redirectTo` 或使用`<navigator />`组件
- 页面返回，调用 API `wx.navigateBack`或用户按左上角返回按钮
- `tarbar`切换

### 5.2 如何跳转页面

- 使用`wx.navigateTo`接口跳转,原页面保留

```javascript
wx.navigateTo({
  //目的页面地址
  url: 'pages/logs/index',
  success: function(res){},
  ...
})
```

- 使用`wx.redirectTo`接口跳转，关闭原页面,不能返回

```javascript
wx.redirectTo({
  //目的页面地址
  url: 'pages/logs/index',
  success: function(res){},
  ...
})
```

### 5.3 使用组件

```
<navigator url="pages/logs/index" hover-class="navigator-hover">跳转</navigator>
```

> 当该组件添加`redirect`属性时，等同于`wx.redirectTo`接口；默认`redirect`属性为`false`，等同于`wx.navigateTo`接口

用户点击左上角返回按钮，或调用`wx.navigateBack`接口返回上一页

```javascript
wx.navigateBack({
    delta: 1
})
```

> `delta`为1时表示返回上一页，为2时表示上上一页，以此类推；如果dalta大于已打开的页面总数，则返回到首页。返回后，元界面会销毁

### 5.4 页面跳转传值

```
url?key=value&key1=value1
```

> 传递的参数没有被`URIEncode`,传递中文没有乱码

### 5.5 如何正确使用页面跳转

> 官方规定小程序最多只能有五个页面同时存在，意思是在不关闭页面的情况，最多新开五个页面，页面深度为5

- 对于可逆操作，使用`wx.navigateTo`,比如从首页跳转到二级页面，从二级页面返回是不需要重新渲染首页
- 对于不可逆操作，使用`wx.redirectTo`,比如用户登录成功后，关闭登录页面，不能返回到登录界面。
- 对于一些介绍性等不常用页面`wx.redirectTo`或`wx.navigatrBack`
- 不要在首页使用`wx.redirectTo`，这样会导致应用无法返回首页

### 5.6 页面栈

- 页面栈以栈（先进后出）的形式维护页面与页面之间的关系
- 小程序提供了`getCurrentPages()`函数获取页面栈，第一个元素为首页，最后一个元素为当前页面

**使用wx.navigateTo每新开一个页面，页面栈大小加1,直到页面栈大小为5为止**

![](https://poetries1.gitee.io/img-repo/2019/10/671.png)

**使用wx.navigateTo重复打开界面**

![](https://poetries1.gitee.io/img-repo/2019/10/672.png)

> 假如使用wx.navigateTo从四级页面跳转到二级页面，此时会在页面栈顶添加一个与二级页面初始状态一样的界面，但两个页面状态是独立的。页面栈大小会加1，如果页面栈大小为5，则wx.navigateTo无效

**使用wx.redirectTo重定向**

![](https://poetries1.gitee.io/img-repo/2019/10/673.png)

> 假如使用wx.redirectTo从四级页面重定向到二级页面，此时会将关闭四级页面，并使用二级页面替换四级页面，但两个页面状态是独立的。此时的页面栈大小不变，请注意和使用wx.navigateTo的区别

**使用wx.navigateBack返回**

![](https://poetries1.gitee.io/img-repo/2019/10/674.png)

**总结**

- `wx.navigateTo`会增加页面栈大小，直到页面栈大小为5
- `wx.redirectTo`不会增加页面栈大小
- `wx.navigateBack`会减少页面栈大小，直到页面栈大小为1


## 六、数据通信

### 6.1 页面之间的通信

- 使用全局变量 `app.globalData`
- 使用本地缓存 `wx.setStorageSync`
- `url`传递**


```javascript
// A页面-传递数据

// 需要注意的是，wx.switchTab 中的 url 不能传参数。
wx.navigateTo({
   url:'../pageD/pageD?name=raymond&gender=male'
})

// B页面-接收数据//

//通过onLoad的option...

Page({
onLoad: function(option){
 console.log(option.name +'is'+ option.gender)// raymond is male
  this.setData({option: option })
}})
```

### 6.2 参数传递

#### 6.2.1 小程序传递参数的方式

**1、通过在`App.js`中设置全局变量**

> 通常把不会更改的数据放在`app.js`的`Data`中，在各个页面中都可以通过`APP`实例获取`Data`数据

```javascript
var app = getApp();
var data = app.data;
```

**2、通过拼接`URL`直接传递**

> `wx.navigateTo({})`中`URL`携带参数

```
wx.navigateTo({
  url: 'test?id=1'
});
```

**在wxml中使用`navigator`跳转url传递参数**

> 代码如下，将要传递到另一个页面的字符串testId的值赋值到url中

```
<navigator class="test-item" url="../../pages/test/test?testId={{testData.testId}}"></navigator>
```

> 在`js`页面中`onLoad`方法中接收

```javascript
Page({
  onLoad: function(options) {
      var testId = options.testId
      console.log(testId)
  }
})
```

**`navigator`跳转`url`传递数组**

> 如果一个页面要将一个数组，如相册列表传递到另一个页面

```
<navigator class="test-item" url="../../pages/test/test?albumList={{testData.albumList}}"></navigator>
```

> 传递到js后从`options`中得到的是个字符串，每个图片的url通过','分隔，所以此时还需要对其进行处理，重新组装为数组

```javascript
Page({
    data: {
         // 相册列表数据
        albumList: [],
    },    
    onLoad: function (options) {
        var that = this;

        that.setData({
            albumList: options.albumList.split(",")
        });
    }
})
```


**3、在wxml中绑定事件后，通过`data-hi="参数"`的方式传递**

> 这种方式一般是在wxml中绑定事件，同时设置需要传递的数据，如果需要传递多个，可以写多个`data-[参数]`的方式进行传递

```
<view bindtap="clickMe" data-testId={{testId}}">
    ...
</view>
```

> 在js页面中自定义方法clickMe中接收

```javascript
Page({
    clickMe: function(event) {
        var testId = event.currentTarget.dataset.testid;
        wx.navigateTo({
            url: '../../pages/test/test'
        })
    }
})
```

**wxml中配置data-albumlist传递数组**

```
<view bindtap="clickMe" data-albumlist={{testData.albumList}}">
    
</view>
```

```javascript
在js页面中自定义方法clickMe中接收

Page({
    clickMe: function(event) {
        var albumList = event.currentTarget.dataset.albumlist.split(",");
        wx.navigateTo({
            url: '../../pages/test/test'
        })
    }
})
```



**4、通过数据缓存存储再获取**

> `wx.setStorageSync(KEY,DATA)`存储数据

```
try {
  wx.setStorageSync('key', 'value')
} catch (e) {    
}
```

> `wx.getStorageSync(KEY)`获取数据

```javascript
try {
  var value = wx.getStorageSync('key')
  if (value) {
    // Do something with return value
  }
} catch (e) {
   // Do something when catch error
}
或
wx.getStorage({
  key: 'key',
  success: function(res) {
     console.log(res.data)
  }
})
```


## 七、疑问汇总

**为什么脚本内不能使用window等对象**

- 页面的脚本逻辑是在`JsCore`中运行，JsCore是一个没有窗口对象的环境，所以不能在脚本中使用`window`，也无法在脚本中操作组件

**为什么 zepto/jquery 无法使用**

- `zepto/jquery` 会使用到`window`对象和`document`对象，所以无法使用

**wx.navigateTo无法打开页面**

- 一个应用同时只能打开5个页面，当已经打开了5个页面之后，`wx.navigateTo`不能正常打开新页面。请避免多层级的交互方式，或者使用`wx.redirectTo`

**样式表不支持级联选择器**

- `WXSS`支持以`.`开始的类选择器

**本地资源无法通过 css 获取**

- `background-image`：可以使用网络图片，或者 `base64`，或者使用`<image/>`标签

**如何修改窗口的背景色**

- 使用 page 标签选择器，可以修改顶层节点的样式

```css
page { 
  display: block; 
  min-height: 100%; 
  background-color: red;
}

```

**为什么上传不成功**

- 为了提升体验流畅度，编译后的代码包大小需小于 1MB ，大于 1MB 的代码包将上传失败

**HTTPS 请求不成功**

- tls 仅支持 1.2 及以上版本

**微信小程序支持fetch或者promise吗?**

- `promise`工具目前不支持，`fetch` 客户端不支持 工具下个版本保持统一

**wx.request的POST方法的参数传输服务器接收不到的bug**

- `wx.request post` 的 `content-type` 默认为 `‘application/json '`
- 如果服务器没有用到 `json` 解释的话，可以把 `content-type` 设置回 `urlencoded`

```javascript
wx.request({
....
method: "POST",
header: {
"content-type": "application/x-www-form-urlencoded"
},
...
})
```

**wx.uploadFile在手机上返回http码403**

- 安卓的微信升级到6.5.2及其以上版本

**小程序SVG支持吗?**

- `image`的src放远程svg可以，`background-image`里也可以

**ipad不能使用小程序？**

- 暂时不支持ipad打开小程序

**请问小程序页内支持长按保存图片或分享图片吗？**

- 目前没有这个功能

**微信小程序不支持cookie**

- 使用`Reids`存储`session`

**有些手机不支持Object.assign方法，如果使用了该方法会出现莫名其妙的报错（并不会提示Object.assign is not function，而是导致调用了Object.assign方法的方法不能被调用）！**

> 直接写一个合并对象的方法

```javascript
function assignObject(o, n) {
    for (var p in n) {
        if (n.hasOwnProperty(p) && (!o.hasOwnProperty(p)))
            o[p] = n[p];
    }
}
```

## 八、小程序组件

![](https://poetries1.gitee.io/img-repo/2019/10/675.png)
