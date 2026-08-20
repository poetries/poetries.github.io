---
title: Ionic 调用原生相机与 Cordova 插件命令实战
description: 用 Ionic Native 封装 Cordova 插件调用手机原生能力的完整接法，从找 API、装插件、在 app.module.ts 注册到页面里调用，配一份 Cordova 平台与插件常用命令清单，并说明这套栈今天的维护现状与迁移方向。
date: 2019-10-07 14:10:24
tags:
 - Ionic
 - Angular
 - Cordova
 - 混合App
categories: Front-End
---

混合 App 做到一半，产品说要加个「拍照上传头像」。你在浏览器里调 `navigator.mediaDevices.getUserMedia` 试了一下，能开摄像头，但拿不到系统相册、拿不到原图、`iOS` 上还得走 `HTTPS`。这时候就得往下走一层，让 `JavaScript` 去喊原生。

在 `Ionic 3` 这套体系里，喊原生的活是 `Cordova` 干的，`Ionic Native` 只是在它上面包了一层更好用的皮。这篇把接一个原生插件的完整四步走一遍，再把 `Cordova` 那些平台和插件命令归拢成一份能直接抄的清单。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `Ionic Native` 和 `Cordova` 插件到底是什么关系，为什么要装两个包
- 接入一个原生插件的固定四步，以及每一步漏了会报什么错
- 相机插件的接法，以及 `iOS` 上那句必须调的 `cleanup`
- `Cordova` 平台增删、`prepare`、真机运行这些命令各自在什么时候用
- 一份常用插件清单，以及老的 `org.apache.cordova.*` 插件 ID 现在该换成什么
- 这套技术栈今天的维护状态，以及要迁的话往哪迁

## 一、先说清楚这套栈现在的状态

这篇写于 2019 年，用的是 `Ionic 3` 加 `Cordova`。你现在如果是新开项目，不建议照着这套起。

`Apache Cordova` 已经不再活跃维护，项目退役进了 `Apache Attic` 归档，具体状态以 <https://attic.apache.org/> 上的公告为准，我这里不猜时间点。社区这些年整体迁到了 `Ionic` 官方自己做的 `Capacitor`，它解决的是同一类问题，但原生工程是当作源码提交进仓库管理的，不像 `Cordova` 那样每次 `prepare` 重新生成。

`Ionic Native` 这个包名后来也改了，现在叫 `Awesome Cordova Plugins`，`npm` 上的 scope 从 `@ionic-native/*` 变成了 `@awesome-cordova-plugins/*`。下面正文里出现的都还是当年的写法，我原样保留，因为存量项目里跑的就是这些，改名之后 API 形态没变，看懂了老的自然看得懂新的。

那这篇现在还有什么用？两点。一是存量的 `Ionic 3` 项目还在跑，出了问题得有地方查；二是「JS 怎么调到原生」这套思路本身没变，`Capacitor` 的插件接法和下面这四步几乎是同构的，只是包名和命令换了。

## 二、Ionic Native 到底包了什么

`Cordova` 原生插件暴露给 `JS` 的接口是挂在全局对象上的，形如 `navigator.camera.getPicture(onSuccess, onFail, options)`，纯回调风格，没有类型，也不知道插件到底装没装。

`Ionic Native` 干的事就是把这一层重新包成 `Angular` 能吃的形式：变成可注入的服务，回调换成 `Promise` 或者 `Observable`，带上 `TypeScript` 类型定义，插件没装的时候给你一句明确的报错而不是 `undefined is not a function`。

所以装插件的时候你会看到两条命令，很多人第一次接的时候会以为写重复了：

```bash
ionic cordova plugin add cordova-plugin-device

npm install @ionic-native/device --save
```

第一条装的是真正的原生代码（`Objective-C` / `Java` 那部分），第二条装的是给 `TypeScript` 用的那层包装。**少了第一条，插件在真机上根本没有实现；少了第二条，代码编译不过**。两条缺一不可。

顺着这个再看一个常被忽略的点。`Ionic Native` 的包装层在浏览器里是跑不出结果的，因为底下没有原生实现。所以调这类 API 的页面，`ionic serve` 下调试你只会拿到一个 reject，必须上模拟器或者真机。这个我一开始也踩过，盯着浏览器控制台找了半天，以为是自己代码写错了。

## 三、接入一个原生插件的固定四步

流程是死的，接哪个插件都一样。这里拿 `Device` 插件走一遍，它读设备信息，没有权限弹窗，最适合拿来验证链路通不通。

**Step 1，先去官方文档找到对应的 API。**

> https://ionicframework.com/docs/native/device/

`Ionic Native` 的文档页结构很统一，上面是安装命令，中间是用法示例，最下面是这个插件在各平台的支持情况。**先看最下面那个平台支持表**，有些插件只支持 `Android`，你在 `iOS` 上折腾半天是白费的。

**Step 2，装插件。**

```bash
ionic cordova plugin add cordova-plugin-device 

npm install @ionic-native/device --save
```

这里两个注意点，原文写得很简，我展开一下。

> - 注意: 安装 `ionic` 调用原生 api 的插件的时候在模块加上 `--save` 
> - 注意: `ios` 安装插件的时候命令签名加 `sudo`

`--save` 是为了把依赖写进 `package.json`，不然你本地跑得好好的，同事拉下来 `npm install` 之后一片红。这条在新版 `npm` 里已经是默认行为了，但当年的 `npm 5` 之前不是，老项目里养成写上的习惯不吃亏。

`sudo` 那条是权限问题。`Cordova` 装 `iOS` 插件时要往 `platforms/ios` 里写文件，如果那个目录是之前用 `sudo` 建出来的，属主是 root，普通用户就写不进去。真遇到了更干净的解法是把目录属主改回来，别一路 `sudo` 下去，那样只会让越来越多的文件变成 root 所有：

```bash
sudo chown -R $(whoami) ./platforms ./plugins
```

**Step 3，在 `app.module.ts` 里注册。**

```js
import { Device } from '@ionic-native/device/ngx';
```

```js
providers: [
    StatusBar,
    SplashScreen,
    Device,
    { 
        provide: RouteReuseStrategy, useClass: IonicRouteStrategy 
    }
]
```

这一步是 `Angular` 的依赖注入要求，不是 `Ionic` 的额外规矩。把 `Device` 放进 `providers` 数组，注入器才知道怎么造这个实例。漏了这一步的报错是 `No provider for Device!`，看到这句就回来检查这里。

路径末尾那个 `/ngx` 是个历史遗留，得留意。`@ionic-native` 早期同时要兼容 `Ionic 3` 的老写法和 `Angular` 新的注入方式，就拆成了两个入口，带 `/ngx` 的是给 `Angular 5+` 用的。**同一个项目里两种写法混用会出现两个不同的实例**，注入进去的那个可能根本没初始化。统一都带上 `/ngx` 就好。

**Step 4，在页面里注入并使用。**

```js
import { Device } from '@ionic-native/device/ngx'; 

constructor(private device: Device) { }
...
console.log('Device UUID is: ' + this.device.uuid);
```

`Device` 这个插件的属性是同步的，拿到就能读。多数其他插件不是，返回的是 `Promise`，得 `await` 或者 `.then`。跑到真机上，控制台能打出一串 `UUID`，说明从 `TypeScript` 到原生这条链路整个通了，接别的插件照抄这四步即可。

## 四、相机插件怎么接

相机是这类需求里最常用的，接法同样是上面那四步，但有两处额外的东西要处理。

第一是权限描述。`iOS` 上只要包里出现了相机或相册的调用，`Info.plist` 里就必须写上对应的用途说明，否则不是崩溃就是被审核打回。相机对应 `NSCameraUsageDescription`，相册对应 `NSPhotoLibraryUsageDescription`，文案要说清楚拿这个权限干什么，光写「需要访问相机」是会被拒的。这块我在 [Ionic 的 iOS 打包与上架流程](https://feinterview.poetries.top/blog/Ionic-ios-build) 那篇里列了完整的权限键名对照表，要上架的话对着补一遍。

第二是 `iOS` 上的内存回收。官方文档里专门提了一句，用 `FILE_URI` 方式拿照片的话，`Cordova` 会把照片写到临时目录，拍完之后要主动调一次清理：

```js
navigator.camera.cleanup(onSuccess, onFail)
```

不调的结果是临时文件一直堆着，连续拍十几张之后 App 占用会明显上去。这条只在 `iOS` 生效，`Android` 上调了也不报错，写上就是了。

插件的安装命令是这一对：

```bash
ionic cordova plugin add cordova-plugin-camera

npm install @ionic-native/camera --save
```

具体的 `options` 参数（`quality`、`destinationType`、`sourceType`、`correctOrientation` 这些）以官方文档为准，版本之间有过调整，我就不在这里抄一份可能过期的表了。有个参数值得单独说：`destinationType` 选 `DATA_URL` 会直接给你 base64 字符串，写起来最省事，但大图很容易把 `WebView` 内存打爆，正经项目还是走 `FILE_URI` 再自己读文件。

## 五、Cordova 常用命令清单

上面都是 `Ionic Native` 那一层，往下就是 `Cordova` 自己的命令了。这些命令 `Ionic CLI` 都做了同名转发，前面加 `ionic` 就行，效果一样，区别是 `ionic cordova` 那套会顺带帮你跑一遍 `Ionic` 的构建。

**增加平台。** 一个项目要发几个端，就得先把对应平台加进来，加完会在 `platforms/` 下生成一整套原生工程。

```
cordova platform add android
cordova platform add ios

ionic cordova platform add android
ionic cordova platform add ios
```

**移除平台。** 原生工程被改坏了、插件装乱了、`Gradle` 怎么都不通，最快的办法就是删掉重加。`platforms/` 目录是可再生的，删了不心疼，反倒是你手动改过 `platforms` 里的文件的话，这一步会全部丢掉，那些改动应该放到 `hooks` 或者 `config.xml` 里去。

```
cordova platform rm android 
cordova platform rm ios

ionic cordova platform rm android 
ionic cordova platform rm ios
```

**改完代码让代码生效。** 这条是新手最容易漏的一条。你改的是 `src` 下的源码，构建产物落在 `www`，而原生工程读的是 `platforms/xxx/www`，`prepare` 干的就是把 `www` 和插件配置同步到各个平台目录里去。

```
cordova prepare

ionic cordova prepare
```

漏了它的表现特别迷惑，代码明明改了，真机上跑的还是老版本，你会怀疑是缓存、是没重新编译、是手机没装上。其实只是资源没拷过去。

**真机运行。**

```
cordova run android

ionic cordova run android
```

`Android` 走这条很方便，插上线开好调试模式就能跑。`iOS` 我的建议是别用这条命令，直接用 `Xcode` 打开 `platforms/ios` 下的工程运行，签名和证书出了问题 `Xcode` 的报错信息比命令行清楚太多。

**查看和删除插件。**

```
cordova plugin list
```

```
cordova plugin rm org.apache.cordova.console

cordova plugin rm org.apache.cordova.geolocation
```

`plugin list` 在排查问题时很有用，尤其是接手别人的项目，先跑一遍它，能看到装了哪些插件、版本是多少。跟 `package.json` 对不上的话，多半是有人手动改过 `platforms` 目录。

## 六、常用插件清单以及插件 ID 的变迁

下面这份是原文列的清单，我原样保留：

```js
//设备 API
cordova plugin add org.apache.cordova.device

//网络(事件)
cordova plugin add org.apache.cordova.network-information 

//电池(事件)
cordova plugin 
add org.apache.cordova.battery-status 

//加速器
cordova plugin add org.apache.cordova.device-motion 

//罗盘
cordova plugin add org.apache.cordova.device-orientation 

//定位
cordova plugin add org.apache.cordova.geolocation

//摄像头
cordova plugin add org.apache.cordova.camera

//媒体文件处理
cordova plugin add org.apache.cordova.media-capture cordova plugin add org.apache.cordova.media

//文件访问
cordova plugin add org.apache.cordova.file

//文件传输
cordova plugin add org.apache.cordova.file-transfer

//对话框
cordova plugin add org.apache.cordova.dialogs

//震动
cordova plugin add org.apache.cordova.vibration

//联系人
cordova plugin add org.apache.cordova.contacts

//全球化
cordova plugin add org.apache.cordova.globalization 

//闪屏
cordova plugin add org.apache.cordova.splashscreen 

//打开新的浏览器窗口
cordova plugin add org.apache.cordova.inappbrowser 

//调试控制台
cordova plugin add org.apache.cordova.console
```

这里有个坑要注意，这份清单里的 `org.apache.cordova.*` 是老的插件 ID。`Cordova` 早年有自己的插件仓库（`plugins.cordova.io`），后来整体迁到了 `npm`，包名也改成了 `cordova-plugin-*` 这种形式。所以上面这些 ID 现在多数已经装不上了，对应关系是把前缀换掉：

| 老 ID | 现在的包名 |
|-------|-----------|
| `org.apache.cordova.device` | `cordova-plugin-device` |
| `org.apache.cordova.camera` | `cordova-plugin-camera` |
| `org.apache.cordova.geolocation` | `cordova-plugin-geolocation` |
| `org.apache.cordova.network-information` | `cordova-plugin-network-information` |
| `org.apache.cordova.file` | `cordova-plugin-file` |
| `org.apache.cordova.inappbrowser` | `cordova-plugin-inappbrowser` |

规律就是 `org.apache.cordova.x` 对应 `cordova-plugin-x`，照着改基本不会错。清单里还有两个需要单独说一下。

`file-transfer` 这个插件很早就被官方标成不再维护了，推荐改用标准的 `XMLHttpRequest` 或者 `fetch` 直接传 `Blob`，`WebView` 这些年对大文件上传的支持已经够用了。

`console` 插件的作用是让 `console.log` 在原生日志里也能看到，现在主流的调试方式是直接连 `Safari` 的网页检查器或者 `chrome://inspect` 远程调试 `WebView`，比翻原生日志直观得多。这条路的具体接法可以看 [真机调试 WebView 的完整指南](https://feinterview.poetries.top/blog/webview-real-device-debugging-ios-safari-android-chrome)。

## 总结

`Ionic` 调原生这件事，剥掉框架的皮之后就是一句话：`Cordova` 负责把原生能力桥接到 `JS`，`Ionic Native` 负责把这个桥包装成 `Angular` 服务。所以装插件永远是两条命令，一条装原生实现，一条装类型包装，然后在 `app.module.ts` 里注册，再到页面里注入。

排查这类问题也有条固定的顺序。先看是不是漏了 `providers` 注册（报 `No provider for`），再看是不是漏了 `cordova prepare`（改了代码不生效），再看是不是在浏览器里跑（原生实现根本不存在），最后才去怀疑插件本身。这个顺序能省掉大量无效搜索。

至于要不要继续用这套栈，我的判断是存量项目该修就修，别硬迁，`Ionic 3` 那套 `Cordova` 集成还是能跑的。但新项目就别开这个头了，`Cordova` 已经进入归档状态，`Capacitor` 是官方明确的接班方案，插件生态和文档都在那边。真要迁的话，上面这套「找 API、装插件、注册、注入」的思路是完全能复用的。

## 参考

- Ionic Native / Awesome Cordova Plugins 文档 <https://ionicframework.com/docs/native>
- Apache Cordova 官方文档 <https://cordova.apache.org/docs/en/latest/>
- cordova-plugin-camera 仓库 <https://github.com/apache/cordova-plugin-camera>
- cordova-plugin-device 仓库 <https://github.com/apache/cordova-plugin-device>
- Capacitor 官方文档 <https://capacitorjs.com/docs>
- Apache Attic <https://attic.apache.org/>
- [前端进阶之旅](https://interview.poetries.top)
