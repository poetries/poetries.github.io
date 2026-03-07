---
title: 初探Cordova结合Vue
date: 2019-10-07 18:10:24
tags: 
 - Cordova
 - Vue
categories: Front-End
---

## 一、前言

> 我们可以使用`cordova`来打包现有的`vue`、`react`、`angular`应用为`app`，可以借助`cordova`来调用手机设备的原生能力，比如拍照、扫码、定位等

### 1.1 ionic3

> `ionic3=cordova+angular+ionicUI`（Ionic UI组件+ Javascript API+Ionic Native） 

- **优点**：它提供了漂亮的`UI`组件库、强大的`JS APi`以及基于调用原生的的`Native APi`,可以让我们快速开发跨平台的混合`APP`以及移动`web`页面。（推荐*）
- **缺点**：`angular` `react` `vue`开发的移动端应用要打包成`app`的时候得重新再学习`ionic`

### 1.2 cordova

> `cordova`: 可以把`html css js`写的代码打包成`app`，还可以让`js`调用原生的`api`。`cordova`非常成熟、插件也非常多、扩展性也强，10年的历史

**打包App有几个方案**

- `ionic`
- `reactNative`
- `weex`
- `flutter`
- `cordova+vue`
- `cordova+react`
- `cordova+angular`


## 二、环境搭建

### 2.1 用cordova开发android 应用

- 安装jdk 、配置jdk
- 安装android studio
- 安装nodejs
- 安装cordova

```bash
## 淘宝源安装
npm install -g cordova --registry=https://registry.npm.taobao.org
```

```
cnpm install -g cordova
```

**创建项目cordova create 项目名称**

> `cordova create 项目名`  `com.公司名.项目名  类名` （建议）

```
cordova create cordovademo02  com.baidu.cordova  Cordovademo	
```


> 创建项目的时候注意包名称：发布上线打包的时候用到包名称，注意

> 修改应用包名名称参考：http://www.ionic.wang/article-index-id-91.html

**修改应用包名名称：**

- 修改`config.xml`里面的包名称
- 修改完成以后重新执行`cordova platform add android`

![](https://poetries1.gitee.io/img-repo/2019/10/cordova/2.png)

> cd 到项目里面 `cd cordovademo02`

- 把`android`的平台添加到项目里面 `cordova platform add android`
- 把项目导入到 `android studio` 进行运行调试  （或者运行   `cordova  run  android`）   注意可能遇到的问题参考（安装遇到问题图文解决方案文件夹

> 导入`platform`下的`Android`文件

![](https://poetries1.gitee.io/img-repo/2019/10/cordova/3.png)

**导入android studio可能遇到的错误解决方法**

1. 导入后提示：`Android Studio Error:Connection timed out: connect`

![](https://poetries1.gitee.io/img-repo/2019/10/cordova/4.png)

> 解决方案参考：https://blog.csdn.net/u013020000/article/details/73159754

![](https://poetries1.gitee.io/img-repo/2019/10/cordova/5.png)
![](https://poetries1.gitee.io/img-repo/2019/10/cordova/6.png)

2. 遇到错误 `failed  to  find with hash string  'android-26'`

![](https://poetries1.gitee.io/img-repo/2019/10/cordova/7.png)

> 解决方案点击 图上蓝色链接进行安装

3. `Gradle build` 没有反应如

![](https://poetries1.gitee.io/img-repo/2019/10/cordova/8.png)
![](https://poetries1.gitee.io/img-repo/2019/10/cordova/9.png)

> 解决方案 ：点击`build`见图箭头。如果有下载内容 耐心等待 （30分钟-2小时）

4. 提示 `please configure Android SDK`

![](https://poetries1.gitee.io/img-repo/2019/10/cordova/10.png)

> 解决方案：点击蓝色 `configure`，然后选择对应的sdk   （前提是sdk已经安装）

5. 真机调试,手机连上没有反应

- 关闭或者卸载自己电脑上面的360手机助手或者其他连手机的软件
- 安装你手机对应的`sdk`

![](https://poetries1.gitee.io/img-repo/2019/10/cordova/11.png)

> 建议 `android 5-到android8` sdk都安装 （安装sdk  ： Tools->SDK Manager）

- 点击右上角对应箭头按钮配置

> 查看当前连接上的手机

![](https://poetries1.gitee.io/img-repo/2019/10/cordova/12.png)

- 手机必须开启调试模式（百度搜 xxx手机开启调试模式）
- 手机拔下来重启`android studio`，重新插入手机重试
- 百度搜（`android studio` 连不上手机...）


**运行项目 ：注意**

- `android`手机要连上电脑，并且 `android`手机必须开启调试模式
- `android studio` 必须得安装手机对应的`sdk`
- 关闭360手机助手、xxx手机助手
- 修改项目:  运行`cordova prepare`

### 2.2 iOS平台搭建cordova环境

- 安装`nodejs` 安装`xcode`
- 安装`cordova`    

```
cnpm install -g cordova
```

1. 创建项目

> `cordova create 项目名  com.公司名.项目名  类名` （建议）

```
cordova create cordovademo02  com.baidu.cordova  Cordovademo	
```

- 2. `cd  cordovademo02`
- 3.把ios的平台添加到项目里面  `cordova platform add ios`
- 4. 用xcode打开项目运行


## 三、cordova插件的使用

> cordova插件拍照插件 、定位插件、文件上传插件 以及vconsole开启真机（手机）调试模式

**cordova安装插件**

> 如果我们要在自己的`html`里面调用手机原生的功能（拍照、扫描二维码、获取地理位置...）,借助`cordova`的插件

> `cordova` 官网：https://cordova.apache.org/

**如何使用插件：**

- 安装插件 `cordova plugin  add  插件名称`
- 复制文档使用

**查看已经安装的插件：**

```
cordova plugin list
```

**卸载插件：**

```
cordova plugin rm  cordova-plugin-network-information
```

> 插件使用

**1. 设备插件的使用**

> https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-device/index.html

```bash
## 安装 看文档使用
cordova plugin add cordova-plugin-device
```

**2. 使用网络相关的插件**

> https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-network-information/index.html

```bash
# 安装 看文档使用
cordova plugin add cordova-plugin-network-information
```

**3. 定位插件**

> https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-geolocation/index.html

```
cordova plugin add cordova-plugin-geolocation
```

- 注意改代码以后要运行：`cordova prepare`
- 注意：要引入`cordova.js`
- 注意：项目里面不要有中文文件夹、不要有`zip`包 、不要有中文文件

**4. 拍照插件**

> https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-camera/index.html

> 注意：`ios`拍照完成以后调用 `navigator.camera.cleanup(onSuccess, onFail)`

**5. 文件上传 或者下载**

- 文件插件: https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html
- 文件传输插件：https://www.npmjs.com/package/cordova-plugin-file-transfer


## 四、cordova结合vue

### 4.1 cordova结合vue开发跨平台app

> `cordova`结合`vue`开发跨平台混合app之`Cordova`打包Vue项目

**cordova打包vue项目：**

- `cordova`: 可以把`html css js`写的代码打包成`app`，还可以让`js`调用原生的 `api`

> `cordova+vue`、`cordova+react` 、`cordova+angular` 、 `cordova+jquery`

**创建vue项目的时候有两种方式：**

```
vue init webpack 项目名称
```

```
vue init webpack-simple  项目名称
```

> 正式发布`vue`的项目：（把`vue`项目打包成浏览器能解析的代码）

```bash
npm run build # 把vue打包成浏览器能解析的代码
```

**把vue项目用cordova打包成app：**

- `npm run build` （注意：图片目录的路径）
- 把`vue`打包后的静态资源复制到`cordova`项目里面
- 运行 `cordova prepare`

**注意：**

```bash
vue init webpack-simple  #项目名称 
```

- 修改：`webpack.config.js` 里面  `publicPath`
- 把`publicPath: '/dist/'`    改为  `publicPath: 'dist/'`
- 修改`index`里面引入`dist`的路径,去掉前面的`/` (重要)

**vue init webpack 项目名称**

- 修改：`config/index.js` 把 `assetsPublicPath: '/'`,	
- 修改成 `assetsPublicPath: './'`

![](https://poetries1.gitee.io/img-repo/2019/10/cordova/14.png)

> ios下打开效果。这样很方便打包原有的项目为app

![](https://poetries1.gitee.io/img-repo/2019/10/cordova/16.png)

### 4.2 vue调用cordova插件

> `cordova`打包`vue`项目并在`Vue`中调用原生的`api`：


**使用vue-cordova 插件（不推荐使用）**

> https://github.com/kartsims/vue-cordova		

1. `vue`项目安装 `npm install --save vue-cordova`
2. 在 `main.js` 引入插件并`use`插件

```
import VueCordova from 'vue-cordova'
Vue.use(VueCordova)
```

3. 调用插件注意在对应的组件需要引入 

```js
var Vue = require('vue')
```

```js
Vue.cordova.camera.getPicture((imageURI) => {
    window.alert('Photo URI : ' + imageURI)
}, (message) => {
    window.alert('FAILED : ' + message)
}, {
    quality: 50,
    destinationType: Vue.cordova.camera.DestinationType.FILE_URI
})
```

4. 注意需要在`vue`项目 `index.html`引入 `cordova.js`

```html
<script src="cordova.js"></script>
```

> `index.html` 引入`cordova.js`  并定义全局变量让`vue`组件里面直接使用`cordova`插件(推荐的使用方法）

- 在vue `index.html`引入`cordova.js` （注意顺序`cordova.js`放在`build.js`上面）
- 直接可以在组件里面使用`cordova`的`api`（注意`cordova`里面要安装`api`的插件）