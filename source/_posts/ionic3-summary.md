---
title: 混合App之Ionic3小结篇
date: 2019-01-10 18:10:24
tags: 
 - Ionic
 - Angular
categories: Front-End
---


> 没有`angular`基础，看一下这篇文章 http://blog.poetries.top/2019/01/09/angular7-intro-summary

# 一、介绍

> `Ionic` 是一款基于 `Angular`、`Cordova` 的强大的 `HTML5` 移动应用开发框架 , 可以快速创建一 个跨平台的移动应用。可以快速开发移动 `App`、移动端 `WEB` 页面、微信公众平台应用，混 合 `app web `页面。

## 1.1 ionic 特点

- `ionic` 基于`Angular`语法，简单易学。
- `ionic` 是一个轻量级框架。
- `ionic` 完美的融合下一代移动框架，支持 `Angularjs` 的特性， `MVC` ，代码易维护。
- `ionic` 提供了漂亮的设计，通过 `SASS` 构建应用程序，它提供了很多 UI 组件来帮助开发者开发强大的应用。
- `ionic` 专注原生，让你看不出混合应用和原生的区别
- `ionic` 提供了强大的命令行工具。
- `ionic` 性能优越，运行速度快。

## 1.2 Ionic 和 Cordova(phonegap)、Angular 关系

> `ionic` = `Cordova` + `Angular` + `ionic CSS`


> `Ionic `是完全基于谷歌的 `Angular` 框架，在 `Angular` 基础上面做了一些封装，让我们可以更快 速和容易的开发移动的项目。`Ionic` 调用原生的功能是基于 `Cordova`,`Cordova` 提供了使用 `JavaScript` 调用 `Native` 功能，`ionic` 自己也封装了一套漂亮的 `CSS UI` 库。



# 二、环境搭建


## 2.1 Ionic初始化构建

> https://ionicframework.com/getting-started#cli

```bash
# 全局安装
npm install -g ionic
```

- `ionic info` (查看当前`ionic`的全部版本信息)

![](https://poetries1.gitee.io/img-repo/2019/10/235.png)

```bash
ionic start myApp tabs # 建议使用初始化

cd myApp 

ionic serve
```

![](https://poetries1.gitee.io/img-repo/2019/10/236.png)


- `ionic serve` 运行项目

## 2.2 Genymotion 安卓模拟器

> 使用方法 https://www.jianshu.com/p/aabc4fd01311

## 2.3 在IOS环境下体验

> 需要配备`mac`，安装`xcode`

```bash
# mac下需要添加sudo
sudo ionic cordova platform add ios

# 注意获取目录权限的问题
chmod -R 777 项目文件夹名
```

> 真机调试与发布需要`Apple`开发者账号

**打开xcode选择platform下中ios文件夹，点击运行项目**

![](https://poetries1.gitee.io/img-repo/2019/10/237.png)


## 2.4 在安卓下体验

**1. 添加android**

```bash
ionic cordova platform add android

# 注意获取目录权限的问题
chmod -R 777 项目文件夹名

# 直接使用Android studio 进行调试链接

# 打包成apk拖入Genymotion调试
```

**2. 下载android studio 打开/platform/andriod文件**

![](https://poetries1.gitee.io/img-repo/2019/10/238.png)

**3. 然后连接android studio结合geny生成apk调试**

![](https://poetries1.gitee.io/img-repo/2019/10/239.png)


## 2.5 在浏览器/微信下体验


**1. 添加browser文件夹**


```bash
ionic cordova platform add browser
```

**2. 打包**

> `ionic cordova build browser`

![](https://poetries1.gitee.io/img-repo/2019/10/240.png)
![](https://poetries1.gitee.io/img-repo/2019/10/241.png)

**3. 运行**

```bash
npm run serve

# 浏览器打开 http://localhost:8100
```

**4. 部署**

> 把`www`目录部署到服务器上即可

> 在微信下体验 注意微信`title`问题


## 2.6 ionic的常用命令

**1. 基本命令**

- `ionic g page myPage` 创建页面
- `ionic g provider MyData` 创建`provider`
- `ionic serve` 在浏览器中看
- `ionic platform add/remove android/ios` 添加删除平台
- `ionic build android/ios`  快捷打包（`IOS`最好通过`xcode`打包发布）

**2. 辅助命令**

- `ionic info` 查看关于`ionic`的系统消息
- `ionic emulate android/ios` 模拟器中打开
- `ionic cordova plugin list` 查看插件安装列表

**3. 正式发布需要的命令**

- `ionic cordova platforms add android` 添加安卓平台
- `ionic cordova build android --release` 打包成`apk`


# 三、Ionic3.x+ 目录结构分析及创建组件


## 3.1 Ionic3.x 目录结构分析

**1. 整体目录结构**

![](https://poetries1.gitee.io/img-repo/2019/10/242.png)

- `hooks`:编译 `cordova` 时自定义的脚本命令，方便整合到我们的编译系统和版本控制系统中 
- `node_modules` :`node` 各类依赖包
- `resources` :`android/ios` 资源(更换图标和启动动画) 
- `src`:开发工作目录，页面、样式、脚本和图片都放在这个目录下
- `www`:静态文件
- `platforms`:生成 `android` 或者 `ios` 安装包路径(`platforms\android\build\outputs\apk:apk`
所在位置)执行 `cordova platform add android` 后会生成
- `plugins`:插件文件夹，里面放置各种 `cordova` 安装的插件
- `config.xml`: 打包成 `app` 的配置文件
- `package.json`: 配置项目的元数据和管理项目所需要的依赖
- `tsconfig.json`: `TypeScript` 项目的根目录，指定用来编译这个项目的根文件和编译选项 
- `tslint.json`:格式化和校验 `typescript`

**2. src目录**

![](https://poetries1.gitee.io/img-repo/2019/10/243.png)


- `app`:应用根目录
- `assets`:资源目录(静态文件(图片，js 框架) 
- `pages`:页面文件，放置编写的页面文件，包括:`html`，`scss`，`ts`
- `theme`:主题文件，里面有一个 `scss` 文件，设置主题信息。

**3. Ionic3.x src 下面文件分析**

![](https://poetries1.gitee.io/img-repo/2019/10/244.png)

**4. app.module.ts 分析**

```js
//这个根模块会告诉 ionic 如何组装该应用

import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';
import { MyApp } from './app.component';

// 其他组件
import { HomePage } from '../pages/home/home';
import { DiscoveryPage } from '../pages/discovery/discovery';
import { ChatPage } from '../pages/chat/chat';
import { NotificationPage } from '../pages/notification/notification';
import { MorePage } from '../pages/more/more';
import { LoginPage } from '../pages/login/login';
import { TabsPage } from '../pages/tabs/tabs';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ApiProvider } from '../providers/api/api';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    DiscoveryPage,
    ChatPage,
    NotificationPage,
    MorePage,
    LoginPage,
    TabsPage
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    DiscoveryPage,
    ChatPage,
    NotificationPage,
    MorePage,
    LoginPage,
    TabsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    ApiProvider
  ]
})
export class AppModule {}
```

## 3.2 创建组件

1. `cd` 到我们的项目目录
2. 通过 `ionic g component` 组件名称创建组件

> 输入`ionic g`后，可以创建的组件如下

![](https://poetries1.gitee.io/img-repo/2019/10/245.png)

3. 创建完成组件以后会在 `src` 目录下面多一个 `components` 的目录，这个目录里面有我们用命令创建的所有的组件

![](https://poetries1.gitee.io/img-repo/2019/10/246.png)

4. 如果我们要使用这些组件必须在 `app.module.ts` 里面注册我们的模块，注册完成后就可以在 `pages` 里面的其页面里面使用这些组件


![](https://poetries1.gitee.io/img-repo/2019/10/247.png)
![](https://poetries1.gitee.io/img-repo/2019/10/248.png)



## 3.3 创建页面以及页面跳转


**1. 创建页面**

```bash
ionic g page news
```

**2. 跳转**

```html
<button ion-button (click)="pushButton">执行button跳转</button>
```

![](https://poetries1.gitee.io/img-repo/2019/10/249.png)


# 四、Ionic页面生命周期

```js
// 页面被加载完成后调用的函数，切换页面时并不会进行重新加载，因为有cache的存在
onPageLoaded() {
  console.log('page 1: page loaded.');
}
 
// 页面即将进入的时候
onPageWillEnter() {
  // 在这里可以做页面初始化的一些事情
  console.log('page 1: page will enter.');
}
 
// 页面已经进入的时候
onPageDidEnter() {
  console.log('page 1: page did enter.');
}
 
// 页面即将离开的时候
onPageWillLeave() {
  console.log('page 1: page will leave.');
}
 
// 页面已经离开的时候
onPageDidLeave() {
  console.log('page 1: page did leave.');
}
 
// 从 DOM 中移除的时候执行的生命周期
onPageWillUnload() {
 
}
 
// 从 DOM 中移除执行完成的时候
onPageDidUnload() {
 
}
```

# 五、API的使用

## 5.1 图片上传

> 文档 https://ionicframework.com/docs/native


```bash
npm i --save @ionic-native/camera @ionic-native/file @ionic-native/file-path @ionic-native/transfer

# 插件 mac下需要sudo
sudo ionic cordova plugin add cordova-plugin-camera 
sudo ionic cordova plugin add cordova-plugin-file 
sudo ionic cordova plugin add cordova-plugin-file-transfer
sudo ionic cordova plugin add cordova-plugin-filepath
```

## 5.2 Icon 本地存储的使用

> https://ionicframework.com/docs/storage

**1. 安装插件**

```bash
ionic cordova plugin add cordova-sqlite-storage

npm install --save @ionic/storage
```

**2. src/app/app.module.ts导入配置**

```js
import { IonicStorageModule } from '@ionic/storage';

@NgModule({
  declarations: [
    // ...
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    // ...
  ],
  providers: [
    // ...
  ]
})
export class AppModule {}
```

**3. 在你的页面中使用**

```js
import { Storage } from '@ionic/storage';

export class MyApp {
  constructor(private storage: Storage) { }

  ...

  // set a key/value
  storage.set('name', 'Max');

  // Or to get a key/value pair
  storage.get('age').then((val) => {
    console.log('Your age is', val);
  });
}
```

## 5.3 二维码扫描


> https://ionicframework.com/docs/native/qr-scanner

**1. 安装插件**


```bash
# 安装插件
$ ionic cordova plugin add cordova-plugin-qrscanner
$ npm install --save @ionic-native/qr-scanner
```

**2. 在`src/app/app.module.ts`中导入**

```js
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';

  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    QRScanner // 导入插件
  ]
```

**3. 在页面中使用**

```bash
# 新建扫描页面
ionic g page scan
```

```scss
/** scan.scss **/
page-scan {
html,
body,
ion-app,
ion-content,
ion-page,
.nav-decor {
  background-color: transparent !important;
}
.line {
  position: absolute;
  z-index: 999999;
  top: 15px;
  height: 2px;
  width: 100%;
  background-color: #009900; //动画
  animation: scan 1s infinite alternate;
  -webkit-animation: scan 1s infinite alternate;
}
@keyframes scan {
  from {
    top: 20%;
  }
  to {
    top: 80%;
  }
}
}
```


```html
<!--scan.html-->
<ion-header>
<ion-navbar>
  <ion-title></ion-title>
</ion-navbar>
</ion-header>

<div class="line"></div>
```


```js
// scan.ts
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';

@Component({
  selector: 'page-scan',
  templateUrl: 'scan.html',
})
export class ScanPage {

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    public qrScanner: QRScanner) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ScanPage');
  }
  ionViewDidEnter() {
    this.scanQRCode();
  }

  scanQRCode() {
    this.qrScanner.prepare()
      .then((status: QRScannerStatus) => {
        if (status.authorized) {
          window.document.querySelector('body').classList.add('transparent-body');
          let scanSub = this.qrScanner.scan().subscribe((text: string) => {
            let alert = this.alertCtrl.create({
              title: '二维码内容',
              subTitle: text,
              buttons: ['OK']
            });
            alert.present();
            scanSub.unsubscribe();
          });

          this.qrScanner.show();

        }
        else if (status.denied) {
          //提醒用户权限没有开
        }
        else {

        }
      })
      .catch((e: any) => console.error('Error :', e));
  }

}
```

**4. 调用scan页面**


```html
<button ion-item (click)="gotoScanQRCode()">
  <ion-icon name="qr-scanner" item-start color="dark"></ion-icon>
  <ion-label>扫描二维码</ion-label>
</button>
```

```js
import { ScanPage } from '../scan/scan'; // 引入新建的扫描页面

constructor(public navCtrl: NavController, 
  public navParams: NavParams) {
    super()
}

// 跳转到二维码扫描界面，加上'animate': false参数是为了相机能够在整个屏幕显示，否则相机出不来
gotoScanQRCode() {
  this.navCtrl.push(ScanPage, null, {'animate': false})
}
```

## 5.4 读取版本信息

> https://ionicframework.com/docs/native/app-version

**1. 安装插件**

```bash
$ ionic cordova plugin add cordova-plugin-app-version
$ npm install --save @ionic-native/app-version
```

**导入app.module.ts**

```js
import { AppVersion } from '@ionic-native/app-version';
providers: [
    AppVersion
]
```

**2. 新建一个页面展示version**

```bash
ionic g page versions
```

**3. 在app.modules.ts中导入**


**4. version页面配置**

> 在浏览器中不可以调试，需要真机调试

```html
<ion-header>

  <ion-navbar>
    <ion-title>版本信息</ion-title>
  </ion-navbar>

</ion-header>

<ion-content>
  <ion-list>
    <ion-item>
      AppName: {{appName}}
    </ion-item>
    <ion-item>
      PackageName: {{packageName}}
    </ion-item>
    <ion-item>
      VersionCode: {{versionCode}}
    </ion-item>
    <ion-item>
      VersionNumber: {{versionNumber}}
    </ion-item>
  </ion-list>

</ion-content>
```

```js
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AppVersion } from '@ionic-native/app-version';

@Component({
  selector: 'page-versions',
  templateUrl: 'versions.html',
})
export class VersionsPage {

  appName: string;
  packageName: string;
  versionCode: string;
  versionNumber: string;

  constructor(public navCtrl: NavController,
    private appVersion: AppVersion,
    public navParams: NavParams) {
  }

  ionViewDidLoad() {
    this.appVersion.getAppName().then(v => {
      this.appName = v;
    });

    this.appVersion.getPackageName().then(v => {
      this.packageName = v;
    });

    this.appVersion.getVersionCode().then(v => {
      this.versionCode = v;
    });

    this.appVersion.getVersionNumber().then(v => {
      this.versionNumber = v;
    });
  }
}
```


**5. 其他组件中使用**


```html
<button ion-item (click)="gotoVersions()">
<ion-icon name="help-circle" item-start color="dark"></ion-icon>
<ion-label>关于</ion-label>
</button>
```

```js
gotoVersions(){
  this.navCtrl.push(newPage)
}
```


# 六、页面之间的传参

## 6.1 js跳转方式

> 路由跳转通过`NavController`

**1. 导入NavController**

```js
import { NavController} from 'ionic-angular';
```

**2. 注入**

```js
constructor(public navCtrl: NavController) {}
```

**3. 传参**

```js
 // 参数可以说任意 这里对象形式
 this.navCtrl.push(DetailsPage, {id: questionId}) 
```

> `navCtrl`传参和`ModalCtr`传参一样 

```js
this.ModalCtrl.create(AnswerPage, {
  id: this.id
})
```

**4. 接收参数**

```js
public id:string;

constructor(public navCtrl: NavController, public navParams: NavParams) {
  this.id = navParams.get('id') // 接收传递过来的参数
}

// 或者这样写
ionViewDidLoad(){
   this.id = this.navParams.get('id')
}
```


## 6.2 HTML传参


**1. 传参**

> 通过`[navPush]`打开新页面，`[navParams]`传递参数。[navPush文档](https://ionicframework.com/docs/api/components/nav/NavPush)


```js
import { ChatdetailsPage } from '../chatdetails/chatdetails' // 1.导入页面

public ChatdetailsPage: any; // 2. 声明类型

constructor(){
    userinfo = {
        userId: '1234',
        username: 'poetries'
    }
    this.ChatdetailsPage = ChatdetailsPage; // 3. 
}
```

```html
<!--4. 使用-->
<ion-item [navPush]="ChatdetailsPage" [navParams]="userinfo">
  <ion-avatar>
    <img src="https://blog.poetries.top/images/avatar.jpg">
  </ion-avatar>
  <h2>poetries</h2>
  <p>聊天组件开发</p>
</ion-item>
```

**2. 获取传递的参数**

```js
  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.username = navParams.get('username')
    this.userid = navParams.get('userid')
  }
```


# 七、管道的使用

**1. 新建管道**

```
ionic g pipe realativetime # 管道名称
```

**2. 配置**

```js
import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment'

/**
 * Generated class for the RelativetimePipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'relativetime',
})
export class RelativetimePipe implements PipeTransform {
  /**
   * Takes a value and makes it lowercase.
   */
  transform(value: string, ...args) {
    return moment(value).toNow() // 将过去时间变成距离现在多久
  }
}
```


**3. src/App/modules.ts中全局导入**

```js
import { RelativetimePipe } from '../pipes/relativetime/relativetime'


@NgModule({
  declarations: [
    RelativetimePipe
  ]
...
```


**4. 使用**

```html
<!--relativetime管道名称-->
<div class="msg-info">
  <p>{{msg.username}}&nbsp;{{msg.time | relativetime}}</p>
</div>
```    

# 八、Theme主题全局样式

## 8.1 全局图标颜色配置

**1. `theme/variables.scss`中定义**

```scss
$colors: (
  primary:    #488aff, /**蓝色。优先匹配**/
  secondary:  #32db64, /**第二匹配**/
  danger:     #f53d3d, /**第三匹配**/
  light:      #f4f4f4,
  dark:       #222
);
```


**2. 使用**

```html
<!--在color上使用primary-->
<ion-icon name="paper" item-start color="primary"></ion-icon>
```

![](https://poetries1.gitee.io/img-repo/2019/10/250.png)

## 8.2 自定义样式

> 定义两套样式

> 在`theme`中新建`light.scss`。在`variables.scss`中导入

```scss
// 自定义样式
@import "light";
```

## 8.3 全局设置夜间模式切换

**1. 在`theme`中新建`theme.dark.scss`。在`variables.scss`中导入 **

```scss
/** 根据dark-theme 作用域切换主题 **/
.dark-theme {
    ion-content,.card,.floatMenu {
      background-color: #1e2446 !important;
      color: #fff !important;
    }
  
    .toolbar-title {
      color: #fff !important;
    }
   
    .header .toolbar-background {
      border-color: #140414 !important;
      background-color: #3a3c4b !important;
    }
  
    .list,.label,.item{
      background-color: #3a3c4b !important;
      color:#FFFFFF !important;
    }
    .item{
      border-bottom: 0.55px solid #2e2749 !important;
    }
    .item-inner,{
      border: none !important;
    }
    .item-block{
      border-bottom: 0.55px solid #2e2749 !important;
    }
 }
```

**2. 在`theme`中新建`theme.light.scss`。在`variables.scss`中导入**


```scss
.light-theme {
    ion-content {
        background-color: #e3e4e7
      }
     
      .toolbar-background {
        background-color: #fff;
      }
 }
 ```
 
 
**3. 在`variables.scss`中导入**

```scss
/** 这里导入的是两套主题样式 **/

@import "theme.light";
@import "theme.dark";
```

```html
<ion-list class="marginTop">
  <ion-list-header>
   设置
  </ion-list-header>
  <ion-item>
    <ion-icon name="cloudy-night" item-start color="purple"></ion-icon>
    <ion-label>夜间模式</ion-label>
    <ion-toggle color="purple" (ionChange)="toggleChangeTheme()"></ion-toggle>
  </ion-item>
</ion-list>
```

**4. 新建一个provider来控制app主题的切换**

```bash
ionic provider settings
```

```js
// settings.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/Rx'

@Injectable()
export class SettingsProvider {

  private theme: BehaviorSubject<string>
  constructor(public http: HttpClient) {
    this.theme = new BehaviorSubject('light-theme')
  }
  setActiveTheme(val) {
    this.theme.next(val)
  }
  getActiveTheme() {
    return this.theme.asObservable()
  }
}

```

**5. 在`app.component.ts`中设置**

![](https://poetries1.gitee.io/img-repo/2019/10/251.png)

然后在`src/app/app.html`中设置`selectedTheme`

```html
<ion-nav [root]="rootPage" [class]="selectedTheme"></ion-nav>
```

**6. 在对应组件页面中设置**


```js
// 1. 引入settings providers
import { SettingsProvider } from '../../providers/settings/settings';

export class UserCenterPage {

  // 2. 定义变量
  public selectedTheme: string;

  constructor(public navCtrl: NavController, 
                      public navParams: NavParams,
                      // 3. 注入
                      public settings: SettingsProvider
                      public ModalCtrl: ModalController ) {
                        super()
                        
                         // 4. 获取主题
                        this.settings.getActiveTheme().subscribe(val => this.selectedTheme = val)
  }
  // 5.切换主题
  toggleChangeTheme() {
    if(this.selectedTheme == 'dark-theme') {
      this.settings.setActiveTheme('light-theme')
    }else{
      this.settings.setActiveTheme('dark-theme')
    }
  }
}
```

**7. 在整个app启动的时候设置夜间或者白天模式**

![](https://poetries1.gitee.io/img-repo/2019/10/252.png)

# 九、组件化开发-自定义组件

## 9.1 自定义组件

**1. 新建组件**

```bash
# 新建组件

ionic g component emojipicker# 组件名称
```

![](https://poetries1.gitee.io/img-repo/2019/10/253.png)

**2. 在src/app/app.module.ts中导入**

```js
import { ComponentsModule } from '../components/components.module'

@NgModule({
  declarations: [
  
  ],
  imports: [
  BrowserModule,
    HttpClientModule,
    ComponentsModule, // 导入自定义组件
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
```

**3. 使用**

> 在页面中使用即可

![](https://poetries1.gitee.io/img-repo/2019/10/254.png)


**4. 组件通过@input()接收外部参数**

**4.1 定义组件**

```js
import { Component, Input } from '@angular/core';

// datatype 外部传递进来，dataSourceType 本地接收之后的参数命名
@Input('dataType') dataSourceType;

//这里没有 ionViewDidLoad 生命周期的函数
ngAfterContentInit(){
  console.log(this.dataSourceType) 
}
```

**4.2 使用组件**

```html
<!--dataType传递给question-list中的Input 接收-->
<question-list dataType="{{dataType}}"></question-list>
```

## 9.2 [hidden] [style] [class] 动态控制组件
 
**1. 动态显示隐藏hidden**

```html
<ion-content padding>
  <img src="{{pathForImage(lastImage)}}"  class="img" [hidden]="lastImage === null" />
  <h3 [hidden]="lastImage !== null">请从图片库选择一个图片</h3>
</ion-content>
```

**2. 动态绑定style**

```html
<ion-footer no-border [style.height]="isOpenEmojiPicker ? '255px': '55px' ">
</ion-footer>
```

**3. 动态绑定class属性**

```html
<div class="message right" 
    *ngFor="let msg of messageList"
    [class.right] = "msg.userId === userId"
    [class.left] = "msg.userId === chatUserId"
>
</div>
```

# 十、指令

> 采用了`angular`语法 [建议参考这篇文章](http://blog.poetries.top/2019/01/09/angular7-intro-summary/#3-5-%E6%95%B0%E6%8D%AE%E5%BE%AA%E7%8E%AF-ngFor)


# 十一、常用组件使用

> 组件文档 https://ionicframework.com/docs/components

## 11.1 ModalController/LoadingController/ToastController

**1. 导入**

```js
import {ModalController, LoadingController,  ToastController, ViewController} from 'ionic-angular';
```

**2. 注入**

```js
 constructor(
    public loadingCtr: LoadingController,
    public viewCtr: ViewController,
    public toastCtrl: ToastController,
    public ModalCtrl: ModalController 
  ) {
      
 }
```

**3. 使用**

```js
// loading使用
let loader = loadingCtr.create({
    content: message, // 加载的内容
    dismissOnPageChange: true 
})
loader.present() // // 触发生效
loading.dismiss() // 关闭loading
 
// toastCtrl使用
let toast = toastCtrl.create({
    message, // 提示的信息
    duration: 3000, // 间隔时间
    position: 'bottom' // top buttom left right
})
toast.present() // 触发生效

// ModalController 

let modal = this.ModalCtrl.create(QuestionPage) // 弹出的页面
modal.present() // 生效
// 关闭后进行父页面刷新
modal.onDidDismiss(()=>{
    // 刷新页面
    this.loadPage()
})


// viewCtr
// 关闭当前页面
this.viewCtr.dismiss()
```


**4. 封装loading, toast**

```js
// common/baseui
import { Loading, LoadingController, ToastController, Toast} from 'ionic-angular';

export abstract class BaseUI {
constructor() {

}

protected showLoading(loadingCtr: LoadingController, message: string): Loading {
    let loader = loadingCtr.create({
        content: message,
        dismissOnPageChange: true
    })
    loader.present()
    return loader
}
protected showToast(toastCtrl: ToastController, message: string):Toast {
    let toast = toastCtrl.create({
        message,
        duration: 3000,
        position: 'bottom'
    })
    toast.present()
    return toast
}
}
```

```js
// 使用
import { Component } from '@angular/core';
import { ModalController, LoadingController,  ToastController} from 'ionic-angular';
import { ApiProvider } from '../../providers/api/api'
import { BaseUI } from '../../common/baseui' // 1.导入封装的组件

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage extends BaseUI { // 2. 继承BaseUI

  feeds: string[];
  errorMessage: string;

  constructor(
    public loadingCtr: LoadingController, // 3. 构造
    public api: ApiProvider,
    public toastCtrl: ToastController,  // 3. 构造
    public ModalCtrl: ModalController 
    ) {
      super() // 调用子类方法
  }
  
  getFeeds() {
    let loading = super.showLoading(this.loadingCtr, '加载中...') // 4. 使用loading
    this.api.getFeeds().subscribe(data=>{
    
      if(data['UserId']) {
        this.feeds = data
        loading.dismiss() // 关闭loading
      }else{
        // 5. 使用toast
        super.showToast(this.toastCtrl, data['StatusContent'])
      }
    },err=>this.errorMessage = <any>err)
  }
}

```


## 11.2 Refresh组件

> [刷新组件](https://ionicframework.com/docs/api/components/refresher/Refresher/)

```html
<ion-content>
    <!--刷新组件-->
    <ion-refresher (ionRefresh)="doRefresh($event)">
      <ion-refresher-content
         pullingIcon="arrow-down"
         pullingText="下拉刷新"
         refreshingSpinner="circles"
         refreshingText="数据加载中..."
       >
      </ion-refresher-content>
    </ion-refresher>
    <ion-card *ngFor="let q of questions" (click)="gotoDetails(q.IdentityId)">
        <ion-item>
          <ion-avatar item-start>
            <img src="{{q.HeadFace}}">
          </ion-avatar>
          <p>
              {{q.UserNickName}}发布了该问题
            <ion-icon class="more-button" name="more"></ion-icon>
          </p>
        </ion-item>
        <h2>{{q.ContentTitle}}</h2>
        <ion-card-content>
          <p>{{q.ContentSummary}}</p>
        </ion-card-content>
        <ion-row>
          <ion-col col-8 center text-left>
            <ion-note>
                {{q.LikeCount}}&nbsp;赞同&nbsp;&nbsp;.&nbsp;&nbsp;{{q.CommentCount}}&nbsp;评论&nbsp;&nbsp;.&nbsp;&nbsp;关注
            </ion-note>
          </ion-col>
          <ion-col col-4></ion-col>
        </ion-row>
      </ion-card>
</ion-content>
```

```js
doRefresh(refresher) {
    this.getQuestions() // 再次请求数据
    refresher.complete() // 停止刷新
}
```


## 11.3 List组件

> https://ionicframework.com/docs/components/#lists

## 11.4 button组件

> https://ionicframework.com/docs/components/#buttons

## 11.5 card组件

> https://ionicframework.com/docs/components/#cards

```html
<ion-card *ngFor="let f of feeds" (click)="gotoDetails(f.IdentityId)">
    <ion-item>
      <ion-avatar item-start>
        <img src="{{f.HeadFace}}">
      </ion-avatar>
      <p>
          {{f.UserNickName}}回答了该问题
        <ion-icon class="more-button" name="more"></ion-icon>
      </p>
    </ion-item>
    <h2>{{f.ContentTitle}}</h2>
    <ion-card-content>
      <p>{{f.ContentSummary}}</p>
    </ion-card-content>
    <ion-row>
      <ion-col col-8 center text-left>
        <ion-note>
            {{f.LikeCount}}&nbsp;赞同&nbsp;&nbsp;.&nbsp;&nbsp;{{f.CommentCount}}&nbsp;评论&nbsp;&nbsp;.&nbsp;&nbsp;关注
        </ion-note>
      </ion-col>
      <ion-col col-4></ion-col>
    </ion-row>
</ion-card>
```



## 11.6 表单组件

> https://ionicframework.com/docs/components/#inputs


# 十二、Ionic打包上线流程

## 12.1 图标生成

> 替换`resource/icon.png`图标为`1024*1024`

**生成图标**

> 第一次生成，需要注册账号才可生成 https://dashboard.ionicframework.com/signup

> 生成图标的过程可能需要翻墙

![](https://poetries1.gitee.io/img-repo/2019/10/255.png)

```bash
# 在项目根目录执行 不需要进到resources文件夹
ionic cordova resources
```

![](https://poetries1.gitee.io/img-repo/2019/10/256.png)

## 12.2 启动图生成

> 替换resource/splash.png图标为1024*1024

```
# 在项目根目录执行 不需要进到resources文件夹
ionic cordova resources
```

## 12.3 打包前细节处理

1. **修改index.html中的title**
2. **修改config.xml** 中的信息

- `widget id="io.ionic.starter" version="0.0.1"` 修改id（包名）以及`version`
- `<name>MyApp</name>` 修改`app`名字
- `<description>An awesome Ionic/Cordova app.</description>` 修改`app`描述
- ` <author email="hi@ionicframework" href="http://ionicframework.com/">Ionic Framework Team</author>` 修改`email`

![](https://poetries1.gitee.io/img-repo/2019/10/257.png)

## 12.4 打包部署

```bash
# 将所有的平台打包
sudo ionic build
```

**项目文件夹需要执行权限**

```bash
# 这样才可以在xcode中打开调试
sudo chomd 777 your_project_name
```

> 打开`xcode`进行`ios`下的调试


## 12.5 上架流程

### 12.5.1 IOS的打包

![](https://poetries1.gitee.io/img-repo/2019/10/258.png)

> `app store`上架,需要注册开发者账号

![](https://poetries1.gitee.io/img-repo/2019/10/259.png)

### 12.5.2 安卓版本打包

> 最后生成`apk`文件。

**打包方式**

> - 通过`Android studio`生成
> - 通过命令生成


**1. 需要安装`jdk`环境，并设置环境变量**

```bash
# mac上安装
brew install jdk java
```

**2. 配置`Gradle`**


```bash
# 打开 GradleBuilder.js

platforms/android/cordova/lib/builders/GradleBuilder.js
```


> 找到`distributionUrl`


```js
var distributionUrl = process.env['CORDOVA_ANDROID_GRADLE_DISTRIBUTION_URL'] || 'https\\://services.gradle.org/distributions/gradle-4.1-all.zip';
```

> - 把这个资源下载下来(具体下载哪个版本，根据`distributionUrl`来下载)，放到`platforms/android/gradle`
> - 下载地址：https://services.gradle.org/distributions/gradle-4.1-all.zip

![](https://poetries1.gitee.io/img-repo/2019/10/300.png)


```js
// 注释
// var distributionUrl = process.env['CORDOVA_ANDROID_GRADLE_DISTRIBUTION_URL'] || 'https\\://services.gradle.org/distributions/gradle-4.1-all.zip';

// 新增
var distributionUrl = process.env['CORDOVA_ANDROID_GRADLE_DISTRIBUTION_URL'] || '../gradle-4.1-all.zip';
```


**3. 配置Gradle的环境变量**

**第一步**

> 把上一步下载的`Gradle`把放到任意目录，这里我放的路径`/Users/poetry/cordova/gradle-4.1`

**第二步: 新增环境变量**

> 在`mac`下编辑`.bash_profile`配置文件， `sudo vi  ~/.bash_profile`。新增一个环境变量，这里的`$HOME`就是`/Users/poetry`路径


![](https://poetries1.gitee.io/img-repo/2019/10/310.png)

**第三步: 使环境变量生效**

```bash
source ~/.bash_profile
```

- 如果你的终端使用`iTerm`，需要加载一条命令

```bash
sudo vi ~/.zshrc

# 新增
source .bash_profile
```

![](https://poetries1.gitee.io/img-repo/2019/10/302.png)

**第四步：新开一个终端**

```bash
# 执行下面命令看环境变量

echo $PATH
```

![](https://poetries1.gitee.io/img-repo/2019/10/303.png)

**第五步：测试**

```bash
gradle -v
```

![](https://poetries1.gitee.io/img-repo/2019/10/304.png)


**4. debug测试版打包**

> 查看当前打包环境`ionic info`


```bash
Ionic:

   ionic (Ionic CLI)  : 4.7.1
   Ionic Framework    : ionic-angular 3.9.2
   @ionic/app-scripts : 3.2.1

Cordova:

   cordova (Cordova CLI) : 8.1.2 (cordova-lib@8.1.1)
   Cordova Platforms     : android 7.1.4, browser 5.0.4, ios 4.5.5
   Cordova Plugins       : cordova-plugin-ionic-webview 1.2.1, (and 11 other plugins)

System:

   Android SDK Tools : 26.1.1
   NodeJS            : v9.10.0
   npm               : 5.6.0
   OS                : macOS Mojave
   Xcode             : Xcode 10.1 Build version 10B61
```

> 注意：需要前面几步环境配置好了，才可以正常执行打包

```bash
# 执行这条命令默认打包的是debug版本
cordova build android 
```

> 打包后输出`apk`路径 `platforms/android/app/build/outputs/apk/debug/`

![](https://poetries1.gitee.io/img-repo/2019/10/305.png)

> 生成的`apk`。此时可以把`apk`，拖入`Genymotion`模拟器调试


![](https://poetries1.gitee.io/img-repo/2019/10/306.png)


**5. 正式版本打包**

**5.1 未签名版本**

> 此时打包的`apk`是没有签名的版本，不可以在手机上安装

```bash
# 生成未签名版
ionic cordova build android  --release
```

![](https://poetries1.gitee.io/img-repo/2019/10/307.png)


> 打包后输出`apk`路径 `platforms/android/app/build/outputs/apk/release`

> 在手机安装示意图，签名版不能安装

![](https://poetries1.gitee.io/img-repo/2019/10/308.png)

**5.2 签名版本apk打包**

**签名步骤**

**1. 创建私钥，项目根目录下执行命令(记住设置的别名)**

```
keytool -genkey -v -keystore [自定义秘钥文件名，如 my-app].jks -keyalg RSA -keysize 2048 -validity 36500 -alias [自定义app别名，如 my-alias]
```


- `-genkey`		意味着执行的是生成数字证书操作
- `v`			表示将生成证书的详细信息打印出来，显示在`dos`窗口中
- `-keyalg RSA`		表示生成密钥文件所采用的算法为`RSA`
- `-validity 36500`		表示该数字证书的有效期为`36500`天

**2. 接下来会让设置秘钥库口令(记住秘钥)：**

> 秘钥库就是你的密码

![](https://poetries1.gitee.io/img-repo/2019/10/309.png)

**3. 设置秘钥库口令后会让输入一些APP信息**

![](https://poetries1.gitee.io/img-repo/2019/10/310.png)


**4. 按照提示依次输入后会在你的项目根目录生成秘钥文件 my-app.jks**

> 把之前生成好的`platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk`复制到项目根目录，这样和`my-app.jks`同一目录签名

```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore [上步生成的xxx.jks] app-release-unsigned.apk [步骤1命令中设置的app别名，如 my-alias]
```

```bash
# 这里是上面的示例：执行签名命令
keytool -genkey -v -keystore my-app.jks -keyalg RSA -keysize 2048 -validity 36500 -alias my-app
```

**5. 验证应用是否签名成功**

```bash
jarsigner -verify -verbose -certs 你的apk名
```

```bash
# 示例
jarsigner -verify -verbose -certs app-release-unsigned.apk
```

**5. 优化 apk 文件**

**5.1 首先需要配置环境变量**

```bash
# 这里以mac下的iTerm2来配置
vi ~/.bash_profile

# 增加一行
export PATH=$PATH:$ANDROID_HOME/build-tools/27.0.3

# 这里其实是安卓的路径,我们需要给zipalign配置环境变量
/Users/poetry/Library/Android/sdk/build-tools/27.0.3/zipalign

# 使得bash_profile生效
source ~/.bash_profile

# 因为使用到iTerm2需要在.zshrc加入.bash_profile
vi ~/.zshrc

# 加入bash_profile
source .bash_profile

# 最后新建窗口echo $PATH就看到环境变量配置了

# 查看是否生效
zipalign -v
```

![echo $PATH](https://upload-images.jianshu.io/upload_images/1480597-2fbdaea1e10a67d3.png)


**5.2 在项目根目录执行**

```bash
# 自定义最终生成的apk的名字，如 ionicQa.apk
zipalign -v 4 app-release-unsigned.apk ionicQa.apk
```

**6. 遇到的问题**

**6.1 无法打开 jar 文件**

> 将 秘钥文件 `xxx.jks` 与 `android-release-unsigned.apk` 放在同一目录下，放到项目根目录就好了


> 此时就构建好了应用，这里是[构建的应用](https://github.com/poetries/ionic-qa-app/blob/master/ionicQa.apk)

### 12.5.3 网站微信端发布

> 打包成一个静态站点方便部署

```bash
sudo ionic build 
```

> 静态网站部署的站点资源路径 `platform/browser/www`


# 十三、一些问题记录

## 13.1 问题

**1. 【ionic3】刷新页面，ws中断**

> 解决办法升级`@ionic/app-scripts`

```bash
npm install @ionic/app-scripts@latest --save-dev
```

## 13.2 技巧

**读取可空对象**

> `question?.ContentTitle` `question`可能返回空



# 十四、更多参考

## 14.1 项目学习

> https://github.com/poetries/ionic-qa-app

## 14.2 文档参考

- [Ionic官方文档](https://ionicframework.com/docs/)
- [ionic官方GitHub](https://github.com/ionic-team)
- [Ionic菜鸟教程](http://www.runoob.com/ionic/ionic-tutorial.html)
