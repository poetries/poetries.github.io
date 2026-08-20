---
title: Ionic3 升级 Ionic4 变更对比与迁移避坑记录
description: 从 Ionic3 迁到 Ionic4 会遇到的九类变更逐项对比，包含项目结构、依赖包名、CSS 作用域、Angular Router 路由改造、页面生命周期、懒加载写法、组件控制器异步化和 Shadow DOM 主题方案，附旧写法与新写法的对照代码。
date: 2019-06-08 18:10:24
tags:
 - Ionic
 - Angular
 - 迁移升级
categories: Front-End
---

`Ionic 3` 升 `Ionic 4` 这件事，最容易让人低估的地方在于它不是一次版本升级，而是一次「换底座」。`Ionic 3` 是把 `Angular` 项目包了一层，你写的是 `Ionic` 的页面、`Ionic` 的导航、`Ionic` 的懒加载；`Ionic 4` 把这层壳拆了，底下就是一个标准 `Angular` 项目，组件改成了 `Web Components`，路由交还给 `Angular Router`。

结果就是，你以为改改包名就能跑，实际上路由、生命周期、样式、控制器调用方式全都要动。这篇是我当年对着两个版本逐项比对留下的记录，按九个维度列清楚哪里变了、旧写法对应的新写法长什么样。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `Ionic 4` 项目结构变成了什么样，`ionic start` 的参数要怎么带才不会又建出一个 v3 项目
- `provider` 改叫 `service`、`ionic-angular` 改叫 `@ionic/angular` 这些命名和依赖的变动
- 样式为什么不能再写 `page-xxx {}`，全局样式该放哪
- 从 `Push/Pop` 导航切到 `Angular Router` 要改哪些地方，两套导航能不能混用
- 页面生命周期哪些保留、哪些被 `Angular` 的钩子接管了
- 懒加载从 `@IonicPage` 换成 `loadChildren` 的完整对照
- `Loading` / `Toast` / `Alert` 从同步创建改成 `Promise` 之后，代码要怎么改
- 这套迁移在今天还值不值得做

## 一、项目结构的差异

先说结论，`Ionic 4` 项目就是一个 `Angular` 项目，没有别的了。

> 不`ionic`了，以后都`angular`了。命名方式都用`angular`的了；`provider`也改成`angular`的叫法了，以后请叫`service`

这句是当年记的原话，糙但准。`Ionic 3` 里 `ionic g provider MyData` 生成的那个东西，在 `Ionic 4` 里就是 `Angular` 的 `@Injectable()` 服务，连生成命令都建议直接用 `ng generate service`。心里先完成这个切换，后面很多变更就顺理成章了。

创建项目的命令签名是这样：

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

这里有个坑要注意。原生能力那一层除了 `Cordova` 之外多了 `Capacitor` 的选项，这是 `Ionic` 官方自己做的替代方案；而想创建 `Angular` 版本的 `Ionic 4` 项目，**必须带 `--type=angular` 参数，不带参数创建出来的是 `ionic3` 项目**：

```
ionic start myApp tabs --type=angular
```

这条当时坑了不少人，命令跑完没报错，项目也能起，结果照着 v4 文档写代码处处对不上，回头一看目录结构还是 v3 的。

> 当然也可以用`angular-cli`创建普通`Angular`项目，然后`npm`添加`@ionic/core`模块，创建完成后到目录结构如下图所示，它不再像`ionic3`那样封装了`angular`项目，而是直接就是一个`angular`项目，而且默认懒加载

下面这张是新项目的顶层目录，注意 `src` 平级多出来的 `angular.json`、`e2e`、`karma.conf.js` 这些标准 `Angular CLI` 产物。

![Ionic 4 项目顶层目录结构，可以看到 angular.json 等标准 Angular CLI 文件](https://upload-images.jianshu.io/upload_images/7275341-0f971c79cf8f7013.png)

再往里看 `src/app`，每个页面自带一个 `xxx-routing.module.ts`，这就是「默认懒加载」的来源。

![src/app 下的页面目录，每个页面自带独立的 routing module](https://upload-images.jianshu.io/upload_images/6197976-e501ab37265544f6.png)

看到这两张图就该明白了，往后你查文档的顺序要反过来：先查 `Angular` 怎么做，再看 `Ionic` 在这基础上加了什么。

## 二、配置和代理

> `v4`同`angular`配置保持一致，可以在`angular.json`中进行一系列配置，代理则通过`proxy.config.json`配置

`Ionic 3` 时代改构建配置是件麻烦事，得去动 `@ionic/app-scripts` 的 `config` 目录，能改的口子还很有限。v4 之后这些统统落到 `angular.json` 里，`assets`、`styles`、`scripts`、`budgets`、多环境的 `fileReplacements` 全都是 `Angular CLI` 那一套。

本地联调跨域走 `proxy.config.json`，配好之后启动命令要带上，比如 `ionic serve --proxy-config proxy.config.json`，或者干脆写进 `angular.json` 的 `serve` 配置里，省得每次手打。这块完全是 `Angular` 的能力，`Ionic` 只是透传。

## 三、依赖变更

- `ionic-angular` 引入变为了`@ionic/angular`
- `rxjs`变化主要是由于`rxjs5.5`引入了`Pipeable Operator`，[参考这里rxjs](https://zhuanlan.zhihu.com/p/36106514)

第一条是全局替换就能解决的机械劳动，但要小心从 `ionic-angular` 里导出的那些东西不是一一对应搬过去的，`ViewController` 这类在 v4 里干脆没了（第八节会说）。

第二条影响更大一些。`RxJS 5.5` 引入了 `Pipeable Operator` 之后，链式的 `.map().filter()` 要改成 `pipe(map(), filter())`，导入路径也从 `rxjs/add/operator/map` 换成了 `rxjs/operators`。项目里 `HTTP` 请求处理写得多的话，这一块的改动量比换包名大得多。

```js
// 旧写法
import 'rxjs/add/operator/map';
this.http.get(url).map(res => res.json()).subscribe(...)

// 新写法
import { map } from 'rxjs/operators';
this.http.get(url).pipe(map(res => res)).subscribe(...)
```

顺带提一句，`Angular` 的 `HttpClient` 已经自动帮你解析 `JSON` 了，那句 `res.json()` 在新写法里是多余的，留着反而会报错。这个我排查过一次，一直以为是 `pipe` 用错了。

## 四、CSS 的变更

- 和`angular`保持一致，采用`style`或`styleUrls`方式引入，不再使用`page-**{}`方式
- 全局样式：可以将`v3`中全局样式放置到`global.scss`中，也可以创建一个新的`scss`引入到`angular.json`中

那为什么 v3 要写 `page-home { ... }` 这么一层包裹呢？因为当年没有样式隔离，全靠这个类名手工圈定作用域，谁忘了包一层，样式就会漏到别的页面去。v4 用的是 `Angular` 的组件样式封装，写在 `home.page.scss` 里的规则默认只作用于这个组件，那层包裹就没有存在的必要了，留着反而会因为多一层选择器导致规则失效。

全局样式统一放 `global.scss`：

![Ionic 4 的 global.scss 全局样式入口以及在 angular.json 中的引入位置](https://upload-images.jianshu.io/upload_images/6197976-9aeda32321efb616.png)

迁移的时候一个偷懒但有效的做法，是先把 v3 那些 `page-xxx` 包裹整体挪进 `global.scss`，保证页面先跑起来不变形，再一个页面一个页面往组件样式里拆。一次性全拆容易改到崩，改完还找不出是哪条规则丢了。

## 五、路由差异

> `angular` 路由官方文档 https://angular.cn/guide/router

这是整个迁移里改动最大的一块。

> 也许`Ionic 4`中最显着的变化，以及需要对现有应用程序进行最大改变的变化，是转向`Angular`风格的路由。`Ionic`过去使用的典型`Push/Pop`风格导航仍然可用，您甚至可以直接通过`Ionic`的`Web`组件使用这种导航方式，但推荐的方法是使用`Angular Router`

观察目录结构，很容易发现这是一个 `angular` 项目，是因为它有一个 `routing` 模块：

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

`loadChildren` 这里写的是字符串形式 `'路径#模块名'`，这是当年的写法，我原样保留。`Angular 8` 之后官方改推动态 `import` 的形式（`loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)`），原因是字符串形式没法被 `TypeScript` 类型检查和 IDE 跳转，写错模块名要跑起来才知道。老项目升 `Angular` 大版本时这块是必改项。

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

这段是 `Ionic 4` beta 阶段的 tabs 写法，用的是 `Angular` 的辅助路由（那对括号 `(home:home)` 就是 named outlet 语法）。正式版之后 tabs 的结构调整成了 `ion-tabs` 里放 `ion-tab-bar` 加 `ion-tab-button`，标签的路由改由 `tabs-routing.module.ts` 里的 `children` 配置，不再用辅助路由。你手上的模板长什么样以你安装的版本和官方文档为准，我把当年这段留在这，是因为不少 2018 到 2019 年间起的项目里就是这个样子，看到了不至于以为写错了。

`ion-router-outlet` 值得单独说一句。它是 `Angular` `router-outlet` 的扩展版，多做的事情是维护一个页面栈并处理转场动画。所以在 `Ionic` 应用里**别用原生的 `router-outlet` 替换它**，换了之后路由能跳，但页面切换会变成生硬的整屏替换，返回手势也没了。

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

也相应做了调整。这里要说清楚一件事，原文把下面这三个当成上面那批的替代，其实不准确：

```
ionNavDidChange
ionNavWillChange
ionNavWillLoad
```

`ionNav*` 是 `ion-nav` / `ion-router-outlet` 这些**导航容器组件**派发的事件，监听的是「导航发生了变化」；而 `ionView*` 是**页面组件自己**的生命周期钩子，两者不是一回事。实际迁移时的对应关系是：`ionViewWillEnter` / `ionViewDidEnter` / `ionViewWillLeave` / `ionViewDidLeave` 这四个在 v4 里继续可用；`ionViewDidLoad` 被移除，改用 `Angular` 的 `ngOnInit`；`ionViewCanEnter` / `ionViewCanLeave` 这两个守卫类的钩子，改用 `Angular Router` 的 `CanActivate` / `CanDeactivate` 路由守卫。

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

> 前者注重`URL`管控，好处是灵活控制跳转的位置；后者注重代码管控，好处是它允许您指定导航的「方向」，这将有助于`Ionic <ion-router-outlet>`正确显示页面过渡。

这两套怎么选，我的经验是以 `Router` 为主，`NavController` 只在需要明确指定动画方向的地方用。因为 `Ionic 4` 的 `NavController` 底下也是调 `Router` 的，它额外做的只是给下一次导航打个方向标记，好让 `ion-router-outlet` 播对转场动画。混用不会冲突，但**返回按钮和硬件返回键的行为要统一测一遍**，尤其是从详情页 `goRoot` 回首页这种打断栈的场景。

## 六、生命周期

> 一些 `Ionic` 生命周期事件等同于 `Angular` 生命周期 `hooks`。 例如，`ionViewDidLoad()` 扮演与 `Angular OnInit `生命周期 `hook（ngOnInit()`）相同的角色。 在这种情况下，请使用 `Angular` 生命周期 `hooks`

上一节已经把对应关系摊开讲了，这里补一个实际迁移时最容易出错的点。

`ngOnInit` 和 `ionViewWillEnter` 看起来都能做初始化，但触发次数不一样。`ngOnInit` 只在组件实例创建时跑一次，页面被缓存着从别处返回回来是不会再跑的；`ionViewWillEnter` 每次进入页面都会跑。所以「进详情页拉一次数据」放 `ngOnInit`，「每次回到列表页刷新一下状态」放 `ionViewWillEnter`。放反了的表现是数据不刷新或者接口被重复调，排查起来还挺费劲。

## 七、懒加载

> 推荐使用`angular`路由的`loadChildren`方法实现

v3 的懒加载靠的是 `@IonicPage` 装饰器加 `IonicPageModule.forChild`，页面之间通过字符串名字互相引用：

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

v4 把这一整套换成了 `Angular` 标准的路由级懒加载：

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

对照着看，差别在于 v3 的懒加载单位是「页面」，v4 的懒加载单位是「路由」。子模块里那句 `RouterModule.forChild([{ path: '', component: HomePage }])` 的 `path` 是空字符串，因为路径已经在父级 `loadChildren` 那里定义过了，这里只负责把空路径映射到具体组件。这个空字符串很多人第一次写会填成 `'home'`，结果访问 `/home` 白屏，实际得访问 `/home/home` 才出来。

同样地，上面 `loadChildren` 的字符串写法在新版 `Angular` 里要换成动态 `import`，理由前面说过了。

## 八、组件和指令的变更

> `Ionic`为了更通用化，把原来的指令调整为更通用标准的属性方式，如`icon-right`调整为`slot="end"`, `large`变成`size="large"`,`<button ion-button>`变为`<ion-button>`，所以对于`ionic4`的组件使用，还是建议先上官网了解组件的api，特别留意下`xxx-controller`的变更，常见的有如下几个

```
modal-controller
popover-controller
action-sheet-controller
loading-controller
……
```

为什么要改成 `slot="end"` 这种写法？因为 `Ionic 4` 的组件是用 `Stencil` 编译出来的 `Web Components`，`slot` 是 Web Components 标准里内容分发的机制，不是 `Ionic` 自己发明的属性。改完之后这些组件脱离 `Angular` 也能用，`React`、`Vue` 甚至原生 HTML 都能挂，这是这次重构真正的目的。

> 前面2个一般是有自定义UI的，在`ionic3`中是可通过自定义组件注入`ViewController`来关闭窗口，在`ionic4`中已经没有这个方法，改为通过监听事件或回调给外面的`xxx-controller`来关闭

`ViewController` 没了这件事，是迁移时改动量的一个隐形大头。v3 里弹窗内部随手 `this.viewCtrl.dismiss(data)` 就能带着数据关闭自己，v4 里弹窗内容组件拿不到这个引用，得改成注入 `ModalController` 调 `this.modalCtrl.dismiss(data)`，外面用 `onDidDismiss()` 接返回值。逻辑是通的，但每个自定义弹窗都得改一遍。

> 注意：也就是说现有的一些第三方`ionic2/3`组件大部分不能用在`ionic4`上，但是`angular2+`的组件就可以

这条在做技术评估时权重很高。你项目里挂了多少个第三方 `Ionic` 组件，就有多少个潜在的返工点。纯 `Angular` 的库（图表、表单、日期处理这类）基本无痛，依赖 `ionic-angular` 的库大概率要找替代。

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

这个改动最阴的地方在于它不报错。`create()` 返回的是 `Promise`，你按老写法直接调 `alert.present()`，`TypeScript` 那关如果类型没配严会放过去，运行时就是「点了没反应」。全项目搜一遍 `Ctrl.create(` 挨个改成 `await`，比出了问题再回来找快得多。

还有个配套的坑：`loading` 用了 `await` 之后，`present()` 和后续的 `dismiss()` 可能会因为异步顺序错乱，出现「先 dismiss 后 present」导致 loading 永远关不掉。稳妥的做法是把 loading 的实例存成成员变量，关闭前先判断存不存在。

## 九、主题样式的变更

> 这一块也是变更比较大的，主要是`ionic4`使用了大量的`ShadowDOM`和`CSS`变量

这一句原文只留了个引子，补几句我的理解。

`Shadow DOM` 带来的直接后果是，v3 那套靠全局 `!important` 强行覆盖组件内部样式的手段大面积失效了。你在 `global.scss` 里写 `.toolbar-background { background: #fff !important; }`，在 v4 里可能根本选不中，因为那个元素在组件的 shadow root 里，外部样式表穿不进去。

官方给的替代方案是 CSS 自定义属性。`Ionic 4` 给每个组件都暴露了一批 CSS 变量作为「样式接口」，形如 `--background`、`--color`、`--padding-start`。CSS 变量能穿透 Shadow DOM 边界，所以改主题变成了改变量：

```scss
ion-toolbar {
  --background: #ffffff;
  --color: #333333;
}
```

全局主题色也从 v3 那个 `$colors` 的 SCSS map，换成了 `:root` 下的 `--ion-color-primary` 这一套 CSS 变量。好处是运行时可改，做夜间模式不用再切两份编译产物，直接在 `body` 上加个 class 覆盖变量就行，比 v3 那套整套 SCSS 重编译的方案干净不少。这个设计是真的舒服。

具体有哪些变量、哪个组件支持哪些，得逐个查组件文档页最下面的 CSS Custom Properties 表格，没有一份能背下来的通用清单。

## 总结

回头看这次迁移，真正的改动量不在包名和标签，而在三处结构性的东西：路由从 `Push/Pop` 换成 `Angular Router`、控制器从同步创建变成 `Promise`、样式从全局覆盖变成 CSS 变量。这三块的代码基本上是要重写而不是改写的，评估工时的时候按这三块算才准。

迁移顺序上，我的建议是先把项目跑起来再谈优化：先 `--type=angular` 建个空壳，把 `global.scss` 整体搬过去让页面不变形，然后按路由一个页面一个页面地搬，每搬一个就把它的弹窗调用和生命周期钩子顺手改掉。想着「全改完再一起跑」的话，第一次启动能给你报出上百个错，根本无从下手。

最后说个现实问题。这篇写于 2019 年，`Ionic` 后来又出了 5、6、7 等多个大版本，`Cordova` 也退役进了 `Apache Attic`，官方推的原生方案是 `Capacitor`。如果你现在手上还是个 `Ionic 3` 项目，先想清楚要迁到哪个版本，直接对着当前官方文档的最新迁移指南走会更省事，这篇的价值在于帮你理解 3 到 4 之间那道分水岭为什么存在。没有 `Angular` 基础的话，建议先看一遍 [Angular 入门梳理](https://feinterview.poetries.top/blog/angular7-intro-summary)，v4 之后的绝大多数概念都是 `Angular` 的，不是 `Ionic` 的；`Ionic 3` 这边的完整用法我整理在 [混合 App 之 Ionic3 小结篇](https://feinterview.poetries.top/blog/ionic3-summary)。

## 参考

- Ionic 官方文档 <https://ionicframework.com/docs>
- Angular 路由官方文档 <https://angular.cn/guide/router>
- RxJS Pipeable Operator 说明 <https://rxjs.dev/guide/operators>
- Capacitor 官方文档 <https://capacitorjs.com/docs>
- Apache Attic <https://attic.apache.org/>
- [RxJS 5.5 Pipeable Operator 参考](https://zhuanlan.zhihu.com/p/36106514)
- [前端进阶之旅](https://interview.poetries.top)
