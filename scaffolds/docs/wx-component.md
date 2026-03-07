---
title: 小程序之自定义组件
date: 2018-08-12 23:43:20
tags: 小程序
categories: Front-End
---

一、创建自定义组件
---

> 类似于页面，一个自定义组件由 `json` `wxml` `wxss` `js` 4个文件组成。要编写一个自定义组件，首先需要在 json 文件中进行自定义组件声明（将 component 字段设为 true 可这一组文件设为自定义组件）

```
{
  "component": true
}
```

二、使用自定义组件
---

> 使用已注册的自定义组件前，首先要在页面的 json 文件中进行引用声明。此时需要提供每个自定义组件的标签名和对应的自定义组件文件路径

```javascript
{
  "usingComponents": {
    "component-tag-name": "path/to/the/custom/component"
  }
}
```

> 这样，在页面的 wxml 中就可以像使用基础组件一样使用自定义组件。节点名即自定义组件的标签名，节点属性即传递给组件的属性值。

```
<view>
  <!-- 以下是对一个自定义组件的引用 -->
  <component-tag-name inner-text="Some text"></component-tag-name>
</view>
```

三、组件模版
---

- 在组件模板中可以提供一个 `<slot> `节点，用于承载组件引用时提供的子节点

```html
<!-- 组件模板 -->
<view class="wrapper">
  <view>这里是组件的内部节点</view>
  <slot></slot>
</view>
```

```html
<!-- 引用组件的页面模版 -->
<view>
  <component-tag-name>
    <!-- 这部分内容将被放置在组件 <slot> 的位置上 -->
    <view>这里是插入到组件slot中的内容</view>
  </component-tag-name>
</view>
```

**模版数据绑定**

> 可以使用数据绑定，这样就可以向子组件的属性传递动态数据

```html
<!-- 引用组件的页面模版 -->
<view>
  <component-tag-name prop-a="{{dataFieldA}}" prop-b="{{dataFieldB}}">
    <!-- 这部分内容将被放置在组件 <slot> 的位置上 -->
    <view>这里是插入到组件slot中的内容</view>
  </component-tag-name>
</view>
```

**组件wxml的slot**

- 在组件的`wxml`中可以包含 `slot` 节点，用于承载组件使用者提供的`wxml`结构。
- 默认情况下，一个组件的`wxml`中只能有一个`slot`。需要使用多`slot`时，可以在组件js中声明启用

```javascript
Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  properties: { /* ... */ },
  methods: { /* ... */ }
})
```

> 此时，可以在这个组件的wxml中使用多个slot，以不同的 name 来区分

```html
<!-- 组件模板 -->
<view class="wrapper">
  <slot name="before"></slot>
  <view>这里是组件的内部细节</view>
  <slot name="after"></slot>
</view>
```

> 使用时，用 slot 属性来将节点插入到不同的slot上

```html
<!-- 引用组件的页面模版 -->
<view>
  <component-tag-name>
    <!-- 这部分内容将被放置在组件 <slot name="before"> 的位置上 -->
    <view slot="before">这里是插入到组件slot name="before"中的内容</view>
    <!-- 这部分内容将被放置在组件 <slot name="after"> 的位置上 -->
    <view slot="after">这里是插入到组件slot name="after"中的内容</view>
  </component-tag-name>
</view>
```

四、Component构造器
---

> Component构造器可用于定义组件，调用Component构造器时可以指定组件的属性、数据、方法等

```javascript
Component({

  behaviors: [],

  properties: {
    myProperty: { // 属性名
      type: String, // 类型（必填），目前接受的类型包括：String, Number, Boolean, Object, Array, null（表示任意类型）
      value: '', // 属性初始值（可选），如果未指定则会根据类型选择一个
      observer: function(newVal, oldVal, changedPath) {
         // 属性被改变时执行的函数（可选），也可以写成在methods段中定义的方法名字符串, 如：'_propertyChange'
         // 通常 newVal 就是新设置的数据， oldVal 是旧数据
      }
    },
    myProperty2: String // 简化的定义方式
  },
  data: {}, // 私有数据，可用于模版渲染

  // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
  attached: function(){},
  moved: function(){},
  detached: function(){},

  methods: {
    onMyButtonTap: function(){
      this.setData({
        // 更新属性和数据的方法与更新页面数据的方法类似
      })
    },
    // 内部方法建议以下划线开头
    _myPrivateMethod: function(){
      // 这里将 data.A[0].B 设为 'myPrivateData'
      this.setData({
        'A[0].B': 'myPrivateData'
      })
    },
    _propertyChange: function(newVal, oldVal) {

    }
  }

})
```

- 在 properties 定义段中，属性名采用驼峰写法（propertyName）；
- 在 wxml 中，指定属性值时则对应使用连字符写法（`component-tag-name property-name="attr value"`），应用于数据绑定时采用驼峰写法（`attr="{{propertyName}}"`）

五、组件间通信与事件
---

**组件间通信**

> 组件间的基本通信方式有以下几种。

- WXML 数据绑定：用于父组件向子组件的指定属性设置数据
- 事件：用于子组件向父组件传递数据，可以传递任意数据。
- 如果以上两种方式不足以满足需要，父组件还可以通过 `this.selectComponent` 方法获取子组件实例对象，这样就可以直接访问组件的任意数据和方法

**监听事件**

- 自定义组件可以触发任意的事件，引用组件的页面可以监听这些事件
- 监听自定义组件事件的方法与监听基础组件事件的方法完全一致

```html
<!-- 当自定义组件触发“myevent”事件时，调用“onMyEvent”方法 -->
<component-tag-name bindmyevent="onMyEvent" />
<!-- 或者可以写成 -->
<component-tag-name bind:myevent="onMyEvent" />
```

```javascript
Page({
  onMyEvent: function(e){
    e.detail // 自定义组件触发事件时提供的detail对象
  }
})
```

**触发事件**

> 自定义组件触发事件时，需要使用 `triggerEvent` 方法，指定事件名、`detail`对象和事件选项

```html
<!-- 在自定义组件中 -->
<button bindtap="onTap">点击这个按钮将触发“myevent”事件</button>
```

```javascript
Component({
  properties: {}
  methods: {
    onTap: function(){
      var myEventDetail = {} // detail对象，提供给事件监听函数
      var myEventOption = {} // 触发事件的选项
      this.triggerEvent('myevent', myEventDetail, myEventOption)
    }
  }
})
```

六、自定义组件案例
---

> 实现一个弹框

- 在component下新建popup文件夹

![](https://user-gold-cdn.xitu.io/2018/3/14/16223cc683fa5afc?w=295&h=676&f=png&s=15505)

popup.wxml

```html
<view class="wx-popup" hidden="{{flag}}">
  <view class='popup-container'>
    <view class="wx-popup-title">{{title}}</view>
    <view class="wx-popup-con">{{content}}</view>
    <view class="wx-popup-btn">
      <text class="btn-no" bindtap='_error'>{{btn_no}}</text>
      <text class="btn-ok" bindtap='_success'>{{btn_ok}}</text>
    </view>
  </view>
</view>
```

popup.js

```javascript
Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  /**
   * 组件的属性列表
   */
  properties: {
    title: {            // 属性名
      type: String,     // 类型（必填），目前接受的类型包括：String, Number, Boolean, Object, Array, null（表示任意类型）
      value: '标题'     // 属性初始值（可选），如果未指定则会根据类型选择一个
    },
    // 弹窗内容
    content: {
      type: String,
      value: '内容'
    },
    // 弹窗取消按钮文字
    btn_no: {
      type: String,
      value: '取消'
    },
    // 弹窗确认按钮文字
    btn_ok: {
      type: String,
      value: '确定'
    } 
  },
 
  /**
   * 组件的初始数据
   */
  data: {
    flag: true,
  },
 
  /**
   * 组件的方法列表
   */
  methods: {
    //隐藏弹框
    hidePopup: function () {
      this.setData({
        flag: !this.data.flag
      })
    },
    //展示弹框
    showPopup () {
      this.setData({
        flag: !this.data.flag
      })
    },
    /*
    * 内部私有方法建议以下划线开头
    * triggerEvent 用于触发事件
    */
    _error () {
      //触发取消回调
      this.triggerEvent("error")
    },
    _success () {
      //触发成功回调
      this.triggerEvent("success");
    }
  }
})
```

> 在首页用这个组件需要配置一下，首先建一个名为index.json的文件，里边配置"usingComponents"，就是需要引入到首页

```javascript
{
  "usingComponents": {
    "popup": "/component/popup/popup"
  }
}
```

> 引入到首页

```html
<!--index.wxml-->
<view class="container">
  <view class="userinfo">
    <button bindtap="showPopup"> 点我 </button>
  </view>
  <popup id='popup' 
      title='小组件' 
      content='学会了吗' 
      btn_no='没有' 
      btn_ok='学会了'
      bind:error="_error"  
      bind:success="_success">
  </popup>
</view>
```

> 配置index.js操作点击事件

```javascript
//index.js
//获取应用实例
const app = getApp()
 
Page({
  onReady: function () {
    //获得popup组件
    this.popup = this.selectComponent("#popup");
  },
 
  showPopup() {
    this.popup.showPopup();
  },
 
  //取消事件
  _error() {
    console.log('你点击了取消');
    this.popup.hidePopup();
  },
  //确认事件
  _success() {
    console.log('你点击了确定');
    this.popup.hidePopup();
  }
})
```
