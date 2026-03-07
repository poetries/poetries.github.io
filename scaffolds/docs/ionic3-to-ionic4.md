---
title: Ionic3与Ionic4变更对比
date: 2019-06-08 18:10:24
tags: 
 - Ionic
 - Angular
categories: Front-End
---

## 一、项目差异

> 不`ionic`了，以后都`angular`了。命名方式都用`angular`的了；`provider`也改成`angular`的叫法了，以后请叫`service`

> 首先，我们还是以传统的`angular`来使用之

```
ionic start <name> <template> [options]
```

```bash
ionic start myApp
ionic start myApp blank
ionic start myApp tabs --cordova
ionic start myApp tabs --capacitor
ionic start myApp tabs --type=angular
ionic start myApp blank --type=ionic1
```

> 其中，创建使用原生功能的项目，除了`Cordova`外，多了`Capacitor`的选择，此外，创建`Angular`版本`ionic4`项目的命令是这个(注意：带参数。不带参数创建的是`ionic3`项目)

```
ionic start myApp tabs --type=angular
```

> 当然也可以用`angular-cli`创建普通`Angular`项目，然后`npm`添加`@ionic/core`模块，创建完成后到目录结构如下图所示，它不再像`ionic3`那样封装了`angular`项目，而是直接就是一个`angular`项目，而且默认懒加载

![](https://upload-images.jianshu.io/upload_images/7275341-0f971c79cf8f7013.png)

![](https://upload-images.jianshu.io/upload_images/6197976-e501ab37265544f6.png)

## 二、配置和代理

> `v4`同`angular`配置保持一致，可以在`angular.json`中进行一系列配置，代理则通过`proxy.config.json`配置

## 三、依赖变更

- `ionic-angular` 引入变为了`@ionic/angular`
- `rxjs`变化主要是由于`rxjs5.5`引入了`Pipeable Operator`，[参考这里rxjs](https://zhuanlan.zhihu.com/p/36106514)

## 四、css

- 和`angular`保持一致，采用`style`或`styleUrls`方式引入，不再使用`page-**{}`方式
- 全局样式：可以将`v3`中全局样式放置到`global.scss`中，也可以创建一个新的`scss`引入到`angular.json`中

![](https://upload-images.jianshu.io/upload_images/6197976-9aeda32321efb616.png)


## 五、路由差异

> `angular` 路由官方文档 https://angular.cn/guide/router

> 也许`Ionic 4`中最显着的变化，以及需要对现有应用程序进行最大改变的变化，是转向`Angular`风格的路由。`Ionic`过去使用的典型`Push/Pop`风格导航仍然可用，您甚至可以直接通过`Ionic`的`Web`组件使用这种导航方式，但推荐的方法是使用`Angular Router`

观察目录结构，很容易发现这是一个`angular`项目，是因为它有一个`routing`模块

```js
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: '', loadChildren: './tabs/tabs.module#TabsPageModule' }
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
```

> 而对应的路由组件是`ion-router-outlet`，是对`Angular`的`router-outlet`扩展，以兼容旧的导航方式，打开`tabs.page.html`可看到下面内容


```html
<ion-tabs>
  <ion-tab label="Home" icon="home" href="/tabs/(home:home)">
    <ion-router-outlet name="home"></ion-router-outlet>
  </ion-tab>
  <ion-tab label="About" icon="information-circle" href="/tabs/(about:about)">
    <ion-router-outlet name="about"></ion-router-outlet>
  </ion-tab>
  <ion-tab label="Contact" icon="contacts" href="/tabs/(contact:contact)">
    <ion-router-outlet name="contact"></ion-router-outlet>
  </ion-tab>
</ion-tabs>
```

> 而原来`ionic3`的生命周期函数由原来的

```
ionViewDidLoad
ionViewWillEnter
ionViewDidEnter
ionViewWillLeave
ionViewDidLeave
ionViewWillUnload
ionViewCanEnter
ionViewCanLeave
```


也相应做了调整，如

```
ionNavDidChange
ionNavWillChange
ionNavWillLoad
```

> 言外之意是，你既可以使用如下`Angular`方式做路由跳转

```
this.router.navigateByUrl('/login');
this.router.navigate(['/detail', { id: itemId }]);
```

> 也可以使用原有`Ionic`方式管控堆栈：

```js
this.navCtrl.goForward('/route');
this.navCtrl.goBack('/route');
this.navCtrl.goRoot('/route');
```

> 前者注重`URL`管控，好处是灵活控制跳转的位置；后者注重代码管控，好处是它允许您指定导航的“方向”，这将有助于`Ionic <ion-router-outlet>`正确显示页面过渡。


## 六、生命周期

> 一些 `Ionic` 生命周期事件等同于 `Angular` 生命周期 `hooks`。 例如，`ionViewDidLoad()` 扮演与 `Angular OnInit `生命周期 `hook（ngOnInit()`）相同的角色。 在这种情况下，请使用 `Angular` 生命周期 `hooks`

## 七、懒加载

> 推荐使用`angular`路由的`loadChildren`方法实现

```js
// v3 home.page.ts
@IonicPage({
  segment: 'home'
})
@Component({ ... })
export class HomePage {}

// home.module.ts
@NgModule({
  declarations: [HomePage],
  imports: [IonicPageModule.forChild(HomePage)]
})
export class HomePageModule {}
```

```js
// v4 home.module.ts
@NgModule({
  imports: [
    IonicModule,
    RouterModule.forChild([{ path: '', component: HomePage }])
  ],
  declarations: [HomePage]
})
export class HomePageModule {}

// app.module.ts
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    RouterModule.forRoot([
      { path: 'home', loadChildren: './pages/home/home.module#HomePageModule' },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ])
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```



## 八、组件和指令的变更

> `Ionic`为了更通用化，把原来的指令调整为更通用标准的属性方式，如`icon-right`调整为`slot="end"`, `large`变成`size="large"`,`<button ion-button>`变为`<ion-button>`，所以对于`ionic4`的组件使用，还是建议先上官网了解组件的api，特别留意下`xxx-controller`的变更，常见的有如下几个

```
modal-controller
popover-controller
action-sheet-controller
loading-controller
……
```

> 前面2个一般是有自定义UI的，在`ionic3`中是可通过自定义组件注入`ViewController`来关闭窗口，在`ionic4`中已经没有这个方法，改为通过监听事件或回调给外面的`xxx-controller`来关闭

> 注意：也就是说现有的一些第三方`ionic2/3`组件大部分不能用在`ionic4`上，但是`angular2+`的组件就可以

**组件变更**

> `Loading`，`Toast` 或 `Alert` 等组件在`v3`是同步创建的。 在 `Ionic v4` 中，这些组件都是基于 `promise`异步创建的

```js
// v3
showAlert() {
  const alert = this.alertCtrl.create({
    message: "Hello There",
    subHeader: "I'm a subheader"
  });

  alert.present();
}
```

```js
// v4
showAlert() {
  this.alertCtrl.create({
    message: "Hello There",
    subHeader: "I'm a subheader"
  }).then(alert => alert.present());
}

// Or using async/await

async showAlert() {
  const alert = await this.alertCtrl.create({
    message: "Hello There",
    subHeader: "I'm a subheader"
  });

  await alert.present();
}
```



## 九、主题样式的变更

> 这一块也是变更比较大的，主要是`ionic4`使用了大量的`ShadowDOM`和`CSS`变量

