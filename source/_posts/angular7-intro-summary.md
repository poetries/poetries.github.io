---
title: Angular7 入门总结 从环境搭建到路由的完整笔记
description: Angular 7 入门笔记，覆盖 CLI 环境搭建、组件与模板语法、服务与依赖注入、生命周期钩子、RxJS 异步编程、HttpClient 数据交互和路由配置，并附上到新版本的演进说明。
tags: 
 - JavaScript
 - Angular
 - TypeScript
categories: Front-End
date: 2019-01-09 16:55:24
---

起因是我要做一个 Ionic 4 的混合应用。Ionic 那几个大版本一直绑着 Angular，模板语法、依赖注入、模块声明全是 Angular 那一套，不把 Angular 和 TypeScript 的基础补上，连一个页面跳转都写不明白。我之前整理过一篇 [Ionic 3 的踩坑总结](https://feinterview.poetries.top/blog/ionic3-summary)，当时是硬着头皮往前推的，这次干脆停下来，把 Angular 7 从头过一遍，边写 demo 边记，攒成了这篇笔记。

所以这篇不打算论证「Angular 有多好」。它更像是一个从 jQuery、Vue 那边过来的人，把 Angular 的心智模型对齐到能上手写业务的程度。读完你应该能独立搭起项目、写组件、拆服务、配路由，也能看懂别人的 Angular 代码在干什么。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Angular 的定位，以及它和 Vue、React 在工程取向上的差别
- 用 Angular CLI 搭环境、建项目，生成的目录里哪几个文件才是重点
- 组件、模板语法、内置指令、管道，配三个能跑起来的完整小案例
- 服务与依赖注入，怎么把状态从组件里挪出去
- 八个生命周期钩子的触发顺序，以及每一个该干什么
- RxJS 的 Observable 和 Promise 到底差在哪，RxJS 6 又改了什么
- 用 HttpClient 发 get、post、jsonp 请求
- 路由配置、路由传参、js 跳转和父子路由

## 一、Angular 介绍

`Angular` 是谷歌开源的 `web` 前端框架，前身 `AngularJS` 诞生于 2009 年，由 `Misko Hevery` 等人创建，后来被 `Google` 接手维护，`Google` 自家不少产品都在用它。

它和 `Vue`、`React` 最大的差别不在语法，而在「给不给你选择」这件事上。`Vue` 和 `React` 都是库或者说轻框架，路由、状态、HTTP 请求你自己配；`Angular` 是把路由、依赖注入、HTTP 客户端、表单、测试脚手架一整套全给你，代价是你得接受它的写法。这套取向在中大型企业级项目里很省心，几十个人的团队目录结构和分层方式天然一致；放到三五个页面的小项目上，就显得笨重。

- 从 2019 年初的项目数统计看，`angular(1.x、2.x、4.x、5.x、6.x、7.x)` 加起来的存量非常大，尤其是企业内部系统
- `Angular` 从 2.x 开始就以 `TypeScript` 为一等公民，类型、装饰器、接口这些都是日常写法，不是可选项

写这篇的时候是 2018 年 11 月发布的 `angular7.x`。官方走的是固定节奏的大版本发布，每隔几个月就会有一个新的主版本号，所以这份笔记里的基础概念同样适用于后面的 `Angular8.x`、`Angular9.x`。

![Angular 官方文档首页与版本说明](https://s.poetries.top/gitee/20191001/17.png)

这里得先说一句时效性。这篇写于 Angular 7 时代，之后 Angular 的大版本已经走出去很远了。Ivy 渲染器、standalone components（不用再写 `NgModule` 的独立组件）、signals 这套细粒度响应式，还有 `@if` / `@for` 这类新的模板控制流语法，都是这篇之后才有的东西。本文的写法在当年的项目里是标准写法，现在读到的老代码大量还是这个样子，所以留着不动是有价值的；但如果你是新起项目，具体用哪套 API 请以官方文档当前版本为准，我不确定各个特性具体落在哪个版本号上，就不在这里乱猜了。后面每一章我都会在末尾单独起一小段，说清楚这块后来往哪个方向演进了。

**学习 Angular 必备基础**

想顺畅读下去，`html`、`css`、`js`、`es6` 这几样是底子，另外 `TypeScript` 得会一点。倒不用把泛型、条件类型这些啃透，能看懂类型注解、`interface`、`class` 和装饰器语法就够开工了，剩下的边写边补。

## 二、Angular 环境搭建及创建项目

### 2.1 环境搭建

Angular 的工程化程度高，好处是脚手架帮你把编译、开发服务器、测试、打包全配好了，坏处是环境这一步没弄对，后面全是莫名其妙的报错。所以这一节值得慢一点。

**1. 安装 nodejs**

装 `angular` 的机器上必须有 `nodejs`，选 LTS 稳定版，别去追奇数版本号的当前版。Angular CLI 每个大版本都有自己支持的 Node 版本区间，装之前先去官方的版本兼容表对一眼，能省掉一大半「安装成功但 `ng serve` 起不来」的问题。

**2. 安装 cnpm**

当年国内直连 npm 官方源经常超时，`@angular/cli` 这个包依赖又特别多，所以一般先用 `npm` 装一个走淘宝镜像的 `cnpm`。

```bash
npm install -g cnpm --registry=https://registry.npm.taobao.org
```

这里有个坑要注意，淘宝源后来做过域名迁移，`registry.npm.taobao.org` 这个地址已经不是主推的了，现在的地址是 `registry.npmmirror.com`。你要是照上面这行敲报证书错误，八成就是撞上这个了，换成新域名即可。另外现在 npm 本身速度也还行，直接 `npm config set registry` 换源比再装一层 `cnpm` 更干净，`cnpm` 扁平化 node_modules 的方式偶尔会和某些包的路径假设打架。

**3. 使用 npm/cnpm 命令安装 angular/cli**

`@angular/cli` 是全局命令行工具，装完你就有了 `ng` 这个命令，后面建项目、生成组件、起开发服务器全靠它。

```bash
npm install -g @angular/cli 

# 或者 
cnpm install -g @angular/cli
```

装完敲 `ng v`，它会打印 CLI 版本、Angular 各个包的版本、Node 版本和操作系统。这一步不只是确认装没装上，更重要的是核对 CLI 版本和你要建的项目版本是不是一套。

![执行 ng v 输出的 Angular CLI 版本信息](https://s.poetries.top/gitee/20191001/18.png)

**4. 安装插件**

编辑器插件不是必需品，但差别很大。Angular 的模板是单独的 `.html` 文件，里面写的 `*ngFor`、`[ngClass]` 这些默认是没有提示的，装上语言服务插件之后，模板里能直接跳转到组件的属性定义，写错属性名当场标红。

![编辑器中安装 Angular 相关插件](https://s.poetries.top/gitee/20191001/19.png)

**5. 安装chrome扩展**

`augury` 是当年调 Angular 的浏览器扩展，地址是 https://augury.angular.io/ ，它能把当前页面的组件树画出来，点开某个组件可以看到它的输入属性、注入了哪些服务、变更检测的状态。排查「数据明明改了视图没动」这类问题的时候，比一路 `console.log` 快得多。

![用 augury 查看 Angular 组件树结构](https://s.poetries.top/gitee/20191001/20.png)

补一句时效性。`augury` 是针对 Ivy 之前的渲染器写的，Angular 切到 Ivy 之后它就不再适用了，官方后来另出了 Angular DevTools 扩展接替这个位置，功能上也是组件树加变更检测分析。具体从哪个版本开始换，以官方文档为准。

### 2.2 创建项目

环境好了就可以起项目了。`ng new` 会问你要不要路由、样式用 CSS 还是 SCSS，按需要选就行，选完它会自动跑一次依赖安装。

```bash
# 创建项目
ng new my-app

cd my-app

# 运行项目
ng serve --open
```

`ng serve` 起的是带热更新的开发服务器，默认端口 4200，`--open` 会顺手帮你把浏览器打开。这一步如果卡在依赖安装上，可以加 `--skip-install` 先把目录结构生成出来，再手动装依赖，后面第十章建路由项目的时候就是这么干的。

### 2.3 目录结构分析

`ng new` 一口气生成了几十个文件，第一次看会有点懵。其实真正日常会动的就那么几个，剩下的是配置和测试脚手架，知道它们存在就行。

![Angular CLI 生成的项目目录结构总览](https://s.poetries.top/gitee/20191001/21.png)

完整的文件说明可以参考官方的 https://www.angular.cn/guide/file-structure ，这里只挑重点讲。

**app目录（重点）**

`app` 目录是我们真正写代码的地方，业务代码全在这儿。一个 `Angular` 程序至少需要一个模块和一个组件，新建项目的时候 CLI 已经默认帮你生成好了，这也是 Angular 和 Vue 那种「一个 main.js 挂上去就行」最直观的区别，它一开始就强制你分模块。

![app 目录下默认生成的组件与模块文件](https://s.poetries.top/gitee/20191001/22.png)

先看 `app.component.ts`，这个文件表示一个组件。组件是 `Angular` 应用的基本构建单元，你可以把它理解成一段带着业务逻辑和数据的 `Html`。下面这张图是它的默认内容，我们逐行拆一下每部分在干什么。

![app.component.ts 默认代码内容](https://s.poetries.top/gitee/20191001/23.png)

```js
/*这里是从Angular核心模块里面引入了component装饰器*/
import {Component} from '@angular/core';

/*用装饰器定义了一个组件以及组件的元数据  所有的组件都必须使用这个装饰器来注解*/
@Component({
  /*组件元数据  Angular会通过这里面的属性来渲染组件并执行逻辑
  * selector就是css选择器，表示这个组件可以通过app-root来调用，index.html中有个<app-root>Loading...</app-root>标签，这个标签用来展示该组件的内容
  *templateUrl  组件的模板，定义了组件的布局和内容
  *styleUrls   该模板引用那个css样式
  * */
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
/*AppComponent本来就是一个普通的typescript类，但是上面的组件元数据装饰器告诉Angular，AppComponent是一个组件，需要把一些元数据附加到这个类上，Angular就会把AppComponent当组件来处理*/
export class AppComponent {
  /*这个类实际上就是该组件的控制器，我们的业务逻辑就是在这个类中编写*/
  title = '学习Angular';
}
```

**组件相关的概念**

上面这段代码信息量不小，把它拆成三块看就清楚了。

第一块是组件元数据装饰器 `@Component`，简称组件装饰器，作用是告诉 `Angular` 框架该怎么处理一个普通的 `TypeScript` 类。它里面写的那些属性叫元数据，`Angular` 会读这些元数据来渲染组件、执行组件逻辑。`selector` 决定这个组件在别的模板里用什么标签调用，`templateUrl` 指向布局文件，`styleUrls` 指向样式文件。

第二块是模板 `Template`，也就是组件的外观。模板以 `html` 形式存在，长得很像普通 HTML，但可以用 `Angular` 的数据绑定语法把控制器里的数据渲染出来。

第三块是控制器 `controller`，就是被 `@Component` 装饰的那个普通 TypeScript 类。组件所有的属性和方法都挂在这里，绝大多数业务逻辑也写在这里。模板和控制器之间靠数据绑定通信，模板展示控制器的数据，控制器处理模板上冒出来的事件。

装饰器、模板、控制器是组件的必备要素。除此之外还有一些可选项，用到的时候再回来查：

- 输入属性 `@Input`，用来接收外部传进来的数据。`Angular` 的程序结构本身就是一棵组件树，输入属性让数据能在这棵树上往下传
- 提供器 `providers`，做依赖注入用的，第四章会展开
- 生命周期钩子 `LifeCycle Hooks`，一个组件从创建到销毁会依次触发一串钩子，和 Android 里 `Activity` 的生命周期是同一个套路，第七章专门讲
- 样式表，组件可以关联自己的样式，而且默认是有作用域隔离的
- 动画 `Animations`，`Angular` 提供了独立的动画包，做淡入淡出这类跟组件状态挂钩的效果比手写 CSS class 切换清楚
- 输出属性 `@Output`，用来往外抛事件，或者在组件之间共享数据

顺带说一句，原文里写的 `@inputs` 和 `@Outputs` 是笔误，装饰器的实际名字是单数首字母大写的 `@Input` 和 `@Output`，写错了编译直接过不去。

这几个概念之间的关系，看下面这张图会更直观。

![Angular 组件的装饰器、模板与控制器关系图](https://s.poetries.top/gitee/20191001/24.png)

接着看模块文件。`app.module.ts` 表示一个模块，和 `AppComponent` 一样，模块也要靠装饰器来标记，用的是 `@NgModule`。模块这个东西是 Angular 早期最容易劝退新人的设计，因为你写完组件还得回来在模块里登记一遍，忘了登记就报「组件不是任何模块的一部分」。


```js
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeroesComponent } from './heroes/heroes.component';

@NgModule({
  declarations: [
   // 声明模块里有什么东西 只能声明：组件/指令/管道
    AppComponent,
    HeroesComponent
  ],
  // 声明该模块所依赖的模块
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  // 默认情况下是空的
  providers: [],
  // 声明模块的主组件是什么
  bootstrap: [AppComponent]
})
export class AppModule { }
```

`@NgModule` 里那四个字段各管一摊，分清楚了模块就没什么难的。`declarations` 登记本模块自己拥有的组件、指令、管道，注意只有这三类能进去，服务放进来会直接报错；`imports` 声明本模块依赖哪些别的模块，比如要用 `[(ngModel)]` 就得把 `FormsModule` 放进来，要发请求就得放 `HttpClientModule`；`providers` 注册依赖注入的服务；`bootstrap` 只在根模块出现，指明整个应用从哪个组件开始渲染。

一个很常见的新手报错是模板里写了 `[(ngModel)]`，控制台提示 `Can't bind to 'ngModel' since it isn't a known property of 'input'`。这个报错跟拼写没关系，就是 `FormsModule` 忘了进 `imports`。我第一次遇到的时候盯着模板看了半天，完全没往模块上想。

关于模块这块的演进，后来 Angular 推了 standalone components，组件可以自己声明依赖，不必再挂到某个 `NgModule` 的 `declarations` 里，新项目的默认姿势也逐步转向了独立组件。老项目里 `NgModule` 依然大量存在，两套写法能共存。具体从哪个版本开始默认 standalone，以官方文档为准。

### 2.4 Angular cli

CLI 不只是建项目用的。它最大的价值是把「新建一个东西要改哪几处」这件事自动化了，比如生成一个组件，它会同时建好四个文件并回头改 `app.module.ts`，手写很容易漏掉最后一步。

工具的完整文档在 https://cli.angular.io ，敲 `ng g` 不带参数会列出当前可生成的所有产物类型。

![执行 ng g 列出的 Angular CLI 可生成类型清单](https://s.poetries.top/gitee/20191001/25.png)

**1. 创建新组件 `ng generate component component-name`**

`ng g component components/header` 这种写法可以指定生成到哪个目录，路径是相对 `src/app` 的。执行完你会得到 `.ts`、`.html`、样式文件和一个 `.spec.ts` 测试文件。

关键在于，这条命令还会顺手把新组件登记到 `src/app/app.module.ts` 里 `@NgModule` 的 `declarations` 列表中。这就是前面说的那个「忘了登记就报错」的坑，用 CLI 生成就不会踩到。

![CLI 生成组件后自动写入 app.module.ts 的 declarations](https://s.poetries.top/gitee/20191001/26.png)

**2. 使用 Angular CLI 创建一个名叫 hero 的服务**

服务是用来放跨组件共享逻辑的地方，比如统一的请求封装、本地存储读写。生成方式和组件类似。

```
ng generate service hero
```

该命令会在 `src/app/hero.service.ts` 里生成 `HeroService` 类的骨架，代码长这样。

```js
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HeroService {

  constructor() { }

}
```

注意 `@Injectable({ providedIn: 'root' })` 这一句，它表示这个服务在根注入器上注册，全应用共用一个实例，而且没被用到的话打包时会被摇掉。这是 Angular 6 之后推荐的写法，比手动往 `NgModule` 的 `providers` 数组里塞更省事。第四章里的老写法我也保留了，两种都能跑，知道差别就行。

**3. 添加 AppRoutingModule**

路由模块单独拆出来是官方推荐做法，好处是路由表集中在一个文件里，不会和根模块的其它声明搅在一起。

```js
ng generate module app-routing --flat --module=app
```

这两个参数值得记一下：

- `--flat` 把生成的文件直接放进 `src/app`，而不是新建一个同名目录再放进去
- `--module=app` 告诉 `CLI` 生成完顺手把它注册到 `AppModule` 的 `imports` 数组里

刚生成出来的文件是这样的，注意它此时还只是个空壳模块，跟路由没有半点关系。

```js
// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: []
})
export class AppRoutingModule { }
```

要让它真的承担路由职责，得手动改成下面这样。核心是引入 `RouterModule`，用 `forRoot(routes)` 注册根路由表，再把 `RouterModule` 通过 `exports` 重新导出去，这样任何 `imports` 了 `AppRoutingModule` 的模块都能直接用 `routerLink`、`router-outlet`。

```js
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```


## 三、Angular 组件及组件里的模板

这一章是日常写业务最高频的部分。Angular 的模板语法一开始看着符号很多，插值、方括号、圆括号、方括号套圆括号各是一套，但记住一个规律就顺了。方括号是数据往模板里流，圆括号是事件往类里流，两个套一起就是双向。

### 3.1 创建 Angular 组件

**1. 创建组件**

```bash
ng g component components/header
```

**2. 使用组件**

生成之后不用手动 import，直接在别的模板里用它的 `selector` 当标签写就行，前提是两个组件在同一个模块下。

```html
<app-header></app-header>
```

### 3.2 Angular 绑定数据

**1. 数据文本绑定**

数据要先在控制器类里声明才能在模板里用。下面这张图列了几种常见的定义方式，可以带类型注解，也可以带访问修饰符。

![Angular 组件中定义数据的几种写法](https://s.poetries.top/gitee/20191001/27.png)

声明完在模板里用双大括号插值就能渲染出来。

```html
<h1>{{title}}</h1>
```

**2. 绑定 `HTML`**

插值语法会把内容当纯文本处理，标签会被转义显示成字面量。想让一段字符串真的作为 HTML 渲染，得用 `[innerHTML]`。

```js
 this.h="<h2>这是一个 h2 用[innerHTML]来解析</h2>"
```

```html
  <div [innerHTML]="h"></div>
```

这里有个坑要注意。`[innerHTML]` 会走 Angular 的内置消毒器，`<script>`、内联事件这类危险内容会被自动剥掉，所以你写的富文本可能渲染出来「少了点东西」，这不是 bug 是安全策略。真要放行得显式调 `DomSanitizer`，而且放行之前你得确认这段 HTML 的来源可信，否则就是自己给自己开了个 XSS 口子。

### 3.3 声明属性的几种方式  

这三个修饰符来自 TypeScript，不是 Angular 特有的，但在组件类里用得极多，值得单独拎出来。

- `public` 公有，也是默认值，类的内外都能访问
- `protected` 保护类型，只能在当前类和子类中使用
- `private` 私有类型，只能在当前类内部使用

有一点得说清楚，这三个修饰符只在编译期生效，编译成 JS 之后该访问还是能访问。所以模板里要绑定的属性不能写 `private`，因为模板编译出来的代码在类外面，会报访问不到。

### 3.4 绑定属性

要把类里的数据绑到元素的属性上，用方括号 `[]` 包住属性名。

```html
  <div [id]="id" [title]="msg">调试工具看看我的属性</div>
```

写完打开开发者工具看这个 `div`，`id` 和 `title` 已经是运行时的真实值了。

![浏览器调试工具中查看属性绑定后的结果](https://s.poetries.top/gitee/20191001/28.png)

方括号和普通 HTML 属性的区别在于，`[id]="id"` 里等号右边是表达式，会去类里取变量；不带方括号的 `id="id"` 就是字面量字符串。刚上手最容易混的就是这个。

### 3.5 数据循环 *ngFor

`*ngFor` 是结构型指令，名字前面那个星号是语法糖，展开之后其实是 `<ng-template>` 包裹。它会按数组长度把宿主元素复制多份，不是修改样式而是真的增删 DOM 节点。

**1. *ngFor 普通循环**

先在组件类里准备一份数据。

```js
export class HomeComponent implements OnInit {

  arr = [{ name: 'poetries', age: 22 }, { name: 'jing' , age: 31}];
  constructor() { }

  ngOnInit() {
  }

}
```

然后在模板里循环渲染。注意 `*ngIf` 和 `*ngFor` 分别挂在了 `ul` 和 `li` 上，这是必须的，同一个元素上不能同时写两个结构型指令，写了会直接报错。

```html
<ul *ngIf="arr.length>0">
      <li *ngFor="let item of arr">{{item.name}}- {{item.age}}</li>
</ul>
```

**2. 循环的时候设置 key**

`*ngFor` 提供了几个上下文变量，`index` 是下标，另外还有 `first`、`last`、`even`、`odd`，用分号隔开赋给自己的局部变量就能用。

```html
<ul>
<li *ngFor="let item of list;let i = index;"> <!-- 把索引index赋给i -->
     {{item}} --{{i}}
</li> </ul>
```

顺着上面聊一句性能。数组内容整体替换的时候，Angular 默认按对象引用判断有没有变化，引用变了就全量重建 DOM。列表一长，滚动位置和输入框状态就会跟着被重置。解决办法是给 `*ngFor` 加 `trackBy`，指定一个函数返回每一项的唯一标识，Angular 就能按标识复用节点，跟 Vue 的 `:key` 是一回事。

**3. template 循环数据**

```html
<ul>
  <li template="ngFor let item of list">
{{item}}
</li> </ul>
```

这个 `template="..."` 属性写法是 Angular 2 早期留下的老语法，效果和 `*ngFor` 完全一样。它后来被标记为废弃并移除了，取而代之的是 `<ng-template>` 元素形式。放在这里是因为你翻老项目还会遇到，看到别懵，但新代码别这么写。

### 3.6 条件判断 *ngIf

`*ngIf` 为假的时候是把元素从 DOM 里整个摘掉，不是设成 `display: none`。这一点和 `[hidden]` 有本质差别，后面的 ToDo 案例里正好两种都用到了。

```html
<p *ngIf="list.length > 3">这是 ngIF 判断是否显示</p>

<p template="ngIf list.length > 3">这是 ngIF 判断是否显示</p>
```

第二行同样是上面提到的废弃写法。什么时候用 `*ngIf` 什么时候用 `[hidden]`？我的判断标准是看切换频率和渲染成本，频繁来回切且内容轻的用 `[hidden]`，省掉反复创建销毁的开销；一次性判断或者内容里有重组件、有请求的用 `*ngIf`，让它彻底不渲染。

### 3.7 *ngSwitch

多路分支用 `*ngSwitch`，比堆一串 `*ngIf` 清楚。典型场景就是订单状态、审批状态这种枚举值。

```html
<ul [ngSwitch]="score">
<li *ngSwitchCase="1">已支付</li>
<li *ngSwitchCase="2">订单已经确认</li> <li *ngSwitchCase="3">已发货</li>
<li *ngSwitchDefault>无效</li>
</ul>
```

注意容器上用的是方括号 `[ngSwitch]`，分支上用的是带星号的 `*ngSwitchCase`，两者不能写混。匹配用的是严格相等，所以 `[ngSwitch]="score"` 里 `score` 是数字 `1` 的话，`*ngSwitchCase="1"` 才能命中，字符串 `'1'` 是匹配不上的。这个我踩过，接口返回的状态码是字符串，模板里写的是数字，结果永远走 default。

### 3.8 事件绑定 (click)

事件用圆括号包住事件名，等号右边写要调用的方法。这里不用像原生那样写 `on` 前缀。

```html
<button class="button" (click)="getData()"> 点击按钮触发事件
</button>
<button class="button" (click)="setData()"> 点击按钮设置数据
</button>
```

```js
getData(){ /*自定义方法获取数据*/ //获取
  alert(this.msg);
} 
setData(){
    //设置值
    this.msg='这是设置的值';
}
```

对应的方法就写在组件类里，`this` 直接指向组件实例，不需要像 jQuery 时代那样操心 `this` 指向。

### 3.9 表单事件

表单事件同理，需要拿到原生事件对象的话，在模板里传一个 `$event` 进去。

```html
<input
type="text"
(keyup)="keyUpFn($event)"/>

<input type="text" (keyup)="keyUpFn($event)"/>
```

```js
keyUpFn(e){
    console.log(e)
}
```

`$event` 是 Angular 给的保留名，绑原生 DOM 事件时它就是那个 `KeyboardEvent`，取值走 `e.target.value`。后面 ToDo 案例里判断回车键用的 `e.keyCode == 13` 就是从这儿来的。补一句，`keyCode` 现在已经是废弃属性了，新写法建议用 `e.key === 'Enter'`，语义清楚也不用背数字。Angular 还支持在模板里直接写 `(keyup.enter)="doAdd()"`，连判断都省了。

### 3.10 双向数据绑定

方括号加圆括号的这个组合，官方管它叫「盒子里的香蕉」，形状确实像。它等价于一个属性绑定加一个事件绑定，输入框改了同步回变量，变量改了同步回输入框。

```html
<input [(ngModel)]="inputVal">
```

用之前必须先引入 `FormsModule`，这就是前面提到的那个高频报错点。

```js
import {FormsModule} from '@angular/forms'

NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    NewsComponent
  ], 
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

```html
<!--使用-->
<input type="text" [(ngModel)]="inputValue"/> {{inputValue}}
```

### 3.11 [ngClass]、[ngStyle]

动态类名和动态行内样式各有一个内置指令。这两个用得非常多，值得记牢写法。

**1. [ngClass]:**

传一个对象，键是类名，值是布尔表达式，为真就挂上这个 class。最简单的形式是写死的。

```html
<div [ngClass]="{'red': true, 'blue': false}"> 
    这是一个 div
</div>
```

实际项目里当然是绑变量。先在类里声明一个标志位。

```js
public flag=false;
```

模板里根据 `flag` 在两个类之间来回切。

```html
<div [ngClass]="{'red': flag, 'blue': !flag}">
这是一个 div </div>
```

在循环里也能用，比如给列表第一项加高亮。

```js
public arr = [1, 3, 4, 5, 6];
```

```html
<ul>
<li *ngFor="let item of arr, let i = index"> <span [ngClass]="{'red': i==0}">{{item}}</span>
</li> </ul>
```

**2. [ngStyle]:**

`[ngStyle]` 同理，键换成 CSS 属性名。带连字符的属性名要加引号。

```html
<div [ngStyle]="{'background-color':'green'}">你好 ngStyle</div>
```

值也可以绑变量。

```js
public attr='red';
```

```html
<div [ngStyle]="{'background-color':attr}">你好 ngStyle</div>
```

这里有个性能上的小注意点。`[ngClass]` 和 `[ngStyle]` 的值如果直接写对象字面量，每轮变更检测都会生成一个新对象，Angular 比较引用发现不一样就重新算一遍。列表长了这个开销是能测出来的。数量大的时候，改成在类里算好一个字符串或者复用同一个对象引用会好一些。

### 3.12 管道

管道 `pipe` 是用来加工显示值的，大小写转换、数字格式化、日期格式化这类活儿全归它。语法是一根竖线，左边是原始值，右边是管道名，冒号后面跟参数。

```js
 public today=new Date();
```

```html
 <p>{{today | date:'yyyy-MM-dd HH:mm:ss' }}</p>
```

管道最大的好处是把「数据」和「怎么显示」分开了。你不用在组件类里存一个 `formattedDate`，模板里挂个管道就行，类里始终只保留原始的 `Date` 对象，后面要改格式只改模板。

**其他管道**

下面这些管道从 `angular4` 一直到 `angular7` 都是通用的，自定义管道的写法也一样。

常用的管道（`pipe`）有

**1. 大小写转换**

```html
<!--转换成大写-->
<p>{{str | uppercase}}</p>

<!--转换成小写-->
<p>{{str | lowercase}}</p>
```

**2. 日期格式转换**

```html
<p>
{{today | date:'yyyy-MM-dd HH:mm:ss' }}
</p> 
```

**3. 小数位数**

`number` 管道的参数格式是 `最少整数位数.最少小数位数-最多小数位数`，写起来有点绕，但表达能力挺强。

```html
<!--保留2~4位小数-->

<p>{{p | number:'1.2-4'}}</p> 
```

`'1.2-4'` 的意思是整数部分至少一位，小数部分至少两位、最多四位。展示价格、百分比这种场景基本够用了。

**4. JavaScript 对象序列化**

`json` 管道调试的时候特别顺手，把整个对象原样打在页面上，不用切到控制台。后面人员登记表单那个案例里我就是用它实时看表单数据的。

```html
<p>
    {{ { name: 'semlinker' } | json }}
</p> 
<!-- Output: { "name": "semlinker" } -->
```

**5. slice**

`slice` 截取字符串或数组的一段，参数和 JS 里的 `Array.prototype.slice` 一致。

```html
<p>{{ 'semlinker' | slice:0:3 }}</p> 
<!-- Output: sem -->
```

**6. 管道链**

管道可以串起来用，从左往右依次加工。

```html
<p>
{{ 'semlinker' | slice:0:3 | uppercase }}
</p> 

<!-- Output: SEM -->
```

**7. 自定义管道**

内置管道不够用的时候就自己写一个。这个设计比在组件里写一堆 `formatXxx` 方法要好，因为管道是全局可复用的，而且模板里读起来更像自然语言。

自定义管道就两步：

- 用 `@Pipe` 装饰器声明 `Pipe` 的元数据，最关键的是 `name` 属性，它就是模板里竖线右边那个名字
- 实现 `PipeTransform` 接口里的 `transform` 方法，第一个参数是管道左边的值，后面的参数依次对应冒号传进来的实参

写完记得把这个类加进模块的 `declarations`，不然模板里会报找不到管道。这一步 `ng g pipe` 会帮你做。

**7.1 WelcomePipe 定义**

```js
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'welcome' })

export class WelcomePipe implements PipeTransform {
  transform(value: string): string {
    if(!value) return value;
    if(typeof value !== 'string') {
      throw new Error('Invalid pipe argument for WelcomePipe');
    }
    return "Welcome to " + value;
  }
} 
```

**7.2 WelcomePipe 使用**

第一行那个 `ngNonBindable` 是让 Angular 别解析这段内容，把插值表达式原样当文本打出来，用来对照第二行的实际效果。写文档演示的时候这招挺好用。

```html
<div>
   <p ngNonBindable>{{ 'semlinker' | welcome }}</p>
   <p>{{ 'semlinker' | welcome }}</p> <!-- Output: Welcome to semlinker -->
</div>
```

**7.3 RepeatPipe 定义**

再看一个带参数的例子，`transform` 的第二个形参就接住了模板里冒号后面传的值。

```js
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'repeat'})
export class RepeatPipe implements PipeTransform {
    transform(value: any, times: number) {
        return value.repeat(times);
    }
}
```

**7.4 RepeatPipe 使用**

```html
<div>
   <p ngNonBindable>
   {{ 'lo' | repeat:3 }}
   </p>
   <p>
    {{ 'lo' | repeat:3 }}
   </p> 
   <!-- Output: lololo -->
</div>
```


这一节顺带补一个纯管道和非纯管道的区别，写自定义管道迟早会撞上。默认的管道是纯管道，只有当输入值的引用变了才重新执行 `transform`。所以你往管道里传一个数组，然后用 `push` 往里加元素，页面是不会更新的，因为数组引用没变。设成 `pure: false` 可以每轮变更检测都跑一次，但那样开销很大，一般不建议。我的做法是宁可在组件里返回一个新数组，也不去开非纯管道。

### 3.13 实现一个人员登记表单-案例

前面的语法点分散着讲了不少，这一节把它们串起来做一个能跑的东西。这个表单覆盖了单行输入、单选、下拉、多选和文本域五种控件的双向绑定，做完你对 `[(ngModel)]` 在各类表单元素上的行为就有底了。

先看最终效果。

![Angular 人员登记表单案例运行效果](https://s.poetries.top/gitee/20191001/29.png)

```bash
# 创建组件
ng g component components/form
```

```js
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {

  public peopleInfo:any = {
    username: '',
    sex: '2',
    cityList: ['北京', '上海', '深圳'],
    city: '上海',

    hobby:[{
          title: '吃饭',
          checked:false
      },{
            title:'睡觉',
            checked:false
        },{

          title:'敲代码',
          checked:true
      }],

      mark:''
  }

  constructor() { }

  ngOnInit() {

  }
  doSubmit(){
    /*    
    jquery  dom操作
      <input type="text" id="username" />
      let usernameDom:any=document.getElementById('username');
      console.log(usernameDom.value);    
    */

    console.log(this.peopleInfo);
  }
}
```

组件类里就一个 `peopleInfo` 对象，把整张表单的状态全兜住了。`doSubmit` 里那段注释很有意思，它对比了 jQuery 时代的做法，要先 `getElementById` 再读 `.value`。现在不用了，数据一直在 `this.peopleInfo` 里，提交的时候直接拿。这就是双向绑定省掉的那部分心智负担。

爱好那一项要留意，它没有用一个字符串数组，而是每一项都带 `title` 和 `checked` 两个字段。原因是 checkbox 组要双向绑定的是「选中状态」，得有个地方放它，把状态挂在每个对象自己身上是最省事的写法。

接着是模板。

```html
<h2>人员登记系统</h2>

<div class="people_list">
  <ul>
    <li>姓 名：<input type="text" id="username" class="fonm_input" [(ngModel)]="peopleInfo.username" /></li>
    <li>性 别：
      <input type="radio" value="1" name="sex" id="sex1" [(ngModel)]="peopleInfo.sex"> <label for="sex1">男 </label>　　　
      <input type="radio" value="2" name="sex"  id="sex2" [(ngModel)]="peopleInfo.sex"> <label for="sex2">女 </label>
    </li>
   <li>
    城 市：
      <select name="city" id="city" [(ngModel)]="peopleInfo.city">
          <option [value]="item" *ngFor="let item of peopleInfo.cityList">{{item}}</option>
      </select>
    </li>
    <li>
        爱 好：
        <span *ngFor="let item of peopleInfo.hobby;let key=index;">
            <input type="checkbox"  [id]="'check'+key" [(ngModel)]="item.checked"/> <label [for]="'check'+key"> {{item.title}}</label>
            &nbsp;&nbsp;
        </span>
     </li>
     <li>
       备 注：
       <textarea name="mark" id="mark" cols="30" rows="10" [(ngModel)]="peopleInfo.mark"></textarea>
     </li>
  </ul>

  <button (click)="doSubmit()" class="submit">获取表单的内容</button>
  <br>
  <br>
  <br>
  <br>

  <pre>
    {{peopleInfo | json}}
  </pre>
</div>
```

模板里有几处值得单独说。

单选按钮组靠相同的 `name` 加上同一个 `[(ngModel)]="peopleInfo.sex"` 联动，选中哪个，`sex` 就变成对应的 `value`。下拉框把 `option` 用 `*ngFor` 循环出来，`[value]="item"` 用了属性绑定，如果写成 `value="item"` 那每一项的值都会是字符串 `item` 本身，这是个高频错误。

复选框那块用了 `[id]="'check'+key"` 和 `[for]="'check'+key"`，目的是给每个 checkbox 生成唯一 id，好让 `label` 点击能聚焦。字符串拼接直接写在模板表达式里就行。

最下面那个用 `json` 管道挂在 `pre` 标签里的调试块是个神器，表单每改一下，底下的 JSON 实时跟着变，比来回切控制台看 `console.log` 直观太多。做表单类需求我基本都会先挂一个这玩意儿，写完再删。

最后是样式。

```scss
h2{
    text-align: center;
}
.people_list{
    width: 400px;
    margin: 40px auto;
    padding:20px;
    border:1px solid #eee;
    li{
        height: 50px;
        line-height: 50px;
        .fonm_input{
            width: 300px;
            height: 28px;
        }
    }

    .submit{
        width: 100px;
        height: 30px;
        float: right;
        margin-right: 50px;
        margin-top:120px;
    }
}
```

### 3.14 实现一个完整的ToDo-案例

表单练的是绑定，ToDo 练的是列表的增删改和条件渲染。这个例子里同一份 `todolist` 数组被渲染了两遍，用 `[hidden]` 按状态分成待办和已完成两块，是个挺经典的写法。

![Angular ToDoList 案例运行效果](https://s.poetries.top/gitee/20191001/30.png)

**基础版**

```bash
# 创建组件
ng g component components/todo
```

模板先写出来，两个 `ul` 循环的是同一个数组，靠 `[hidden]="item.status==1"` 和 `[hidden]="item.status==0"` 互斥。

```html
<h2>todoList</h2>
<div class="todolist">
    <input class="form_input" type="text" [(ngModel)]="keyword" (keyup)="doAdd($event)" />
    <hr>
    <h3>待办事项</h3>
    <ul>
      <li *ngFor="let item of todolist;let key=index;" [hidden]="item.status==1">
       <input type="checkbox" [(ngModel)]="item.status" />  {{item.title}}   ------ <button (click)="deleteData(key)">X</button>
      </li>
    </ul>
    <h3>已完成事项</h3>
    <ul>
        <li *ngFor="let item of todolist;let key=index;" [hidden]="item.status==0">
         <input type="checkbox" [(ngModel)]="item.status" />  {{item.title}}   ------ <button (click)="deleteData(key)">X</button>
        </li>
      </ul>
</div>
```

组件类里做三件事，回车添加、按下标删除、以及一个查重函数。

```js
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-todo',
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.scss']
})
export class TodoComponent implements OnInit {

  public keyword: string;

  public todolist: any[] = [];

  constructor() { }

  ngOnInit() {
  }
  doAdd(e){
    if(e.keyCode == 13){
        if(!this.todolistHasKeyword(this.todolist, this.keyword)){
          this.todolist.push({
            title: this.keyword,
            status: 0                   //0表示代办事项  1表示已完成事项
          });
          this.keyword='';
        }else{
          alert('数据已经存在');
          this.keyword='';
        }
     }
  }

  deleteData(key){
    this.todolist.splice(key,1);
  }
  
  //如果数组里面有keyword返回true  否则返回false
  todolistHasKeyword(todolist:any, keyword:any){
    //异步  会存在问题
    // todolist.forEach(value => {

    //   if(value.title==keyword){

    //       return true;
    //   } 
    // });
    if(!keyword)  return false;

    for(var i=0; i<todolist.length; i++){
      if(todolist[i].title==keyword){
          return true;
      } 
    }
    return false;
  }

}
```

`todolistHasKeyword` 里那段被注释掉的 `forEach` 值得单独拎出来说，它是初学最容易写错的地方。`forEach` 的回调里 `return true` 只是结束了当前这一次回调，返回值会被 `forEach` 丢掉，外层函数根本拿不到，最后永远走到底部返回 `undefined`。原文注释里写的「异步 会存在问题」这个说法不太准确，`forEach` 本身是同步的，真正的问题是它不支持提前终止也不透传返回值。所以这里退回了 `for` 循环。

要说现在的写法，用 `some` 最直接，`todolist.some(v => v.title === keyword)` 一行搞定，`find`、`findIndex` 也行。另外原文用的是 `var i` 和 `==`，现在一般写 `let` 加 `===`，前者是块级作用域不会泄漏到函数外，后者不做隐式类型转换。老写法在这里跑起来没问题，知道差别就好。

最后是样式。

```scss

h2{
    text-align: center;
}
.todolist{

    width: 400px;
    margin: 20px auto;
    .form_input{

        margin-bottom: 20px;

        width: 300px;
        height: 32px;
    }


    li{

        line-height: 60px;
    }

}
```

### 3.15 搜索缓存数据-案例

第三个案例是搜索历史。逻辑很短，但它是下一章讲服务的引子，因为现在这份历史记录一刷新就没了，第四章会把它挪进 `localStorage` 并抽成服务。

**基础版**

```bash
# 创建组件
ng g component components/search
```

```html
<div class="search">
    <input type="text" [(ngModel)]="keyword" />  <button (click)="doSearch()">搜索</button>
    <hr>
    <ul>
      <li *ngFor="let item of historyList;let key=index;">{{item}}   ------ <button (click)="deleteHistroy(key)">X</button></li>
    </ul>
</div>
```

```js
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  public keyword: string;
  public historyList: any[] = [];

  constructor() { }
  ngOnInit() {
  }
  doSearch(){
    if(this.historyList.indexOf(this.keyword)==-1){
      this.historyList.push(this.keyword);
    }
    this.keyword = '';    
  }
  deleteHistroy(key){
      alert(key);
      this.historyList.splice(key,1);
  }
}
```

`doSearch` 用 `indexOf` 做去重，找不到才 push，然后清空输入框。这里得提醒一句，`keyword` 声明成了 `public keyword: string` 但没给初值，严格模式下 TypeScript 会报未初始化。改成 `keyword = ''` 就好，我自己习惯所有字符串字段都给个空串初值，省得后面判空。

另外 `deleteHistroy` 这个方法名拼错了，正确拼写是 `deleteHistory`。它不影响运行，因为模板和类里是同一个错拼，但这种东西留在代码库里迟早坑到人。

```scss
.search{

    width: 400px;
    margin: 20px auto;
    input{

        margin-bottom: 20px;

        width: 300px;
        height: 32px;
    }

    button{
        height: 32px;
        width: 80px;
    }
}
```

## 四、Angular 中的服务

### 4.1 服务

服务解决的是「同一段逻辑要在好几个组件里用」这个问题。上一节的 ToDo 和搜索历史都要读写 `localStorage`，如果各写各的，两份代码马上就会漂移。把读写封装成一个 `StorageService`，谁要用谁注入，这才是可维护的做法。

再往深一点说，服务的真正价值在依赖注入。组件不关心 `StorageService` 是怎么造出来的，只在构造函数里声明「我需要一个」，Angular 负责给。这带来两个好处，一是切换实现不用改组件代码，二是写测试的时候可以塞一个假的进去。

![Angular 服务在多个组件之间共享逻辑的示意](https://s.poetries.top/gitee/20191001/31.png)

**1. 创建服务命令**

```bash
ng g service my-new-service

# 创建到指定目录下面
ng g service services/storage
```

**2. app.module.ts 里面引入创建的服务**

这是 Angular 6 之前的注册方式，把服务类塞进模块的 `providers` 数组。前面 2.4 节提到的 `providedIn: 'root'` 是后来的简化写法，两者达到的效果一样，都是全应用一个实例。老项目里这种写法遍地都是，所以得认识。

```js
// app.module.ts 里面引入创建的服务

import { StorageService } from './services/storage.service';
```

```js
// NgModule 里面的 providers 里面依赖注入服务

NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    NewsComponent,
    TodolistComponent
], imports: [
    BrowserModule,
FormsModule
  ],
  providers: [StorageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

**3. 使用的页面引入服务，注册服务**

```js
 import { StorageService } from '../../services/storage.service';
```

注入就是在构造函数参数上加一个访问修饰符加类型注解，Angular 看到类型就知道该给什么。

```js
 constructor(private storage: StorageService) {
 
 }
```

这行有个 TypeScript 的语法糖在里面。构造函数参数前面加了 `private` 或 `public`，等于自动声明并赋值了一个同名的成员属性，不用再写 `this.storage = storage`。所以后面直接 `this.storage.set(...)` 就能用。这个设计是真的舒服，写多了回头看 ES5 那种手动挂载会觉得很啰嗦。

选 `private` 还是 `public` 有个判断依据，模板里要用到的就得 `public`，只在类内部调的用 `private`。下面 4.2 节的例子用了 `public storage`，其实模板没用到它，写 `private` 更严谨。

```js
// 使用

addData(){
     // alert(this.username);
    this.list.push(this.username); 
    this.storage.set('todolist',this.list);
}
removerData(key){
    console.log(key); 
    this.list.splice(key,1); 
    this.storage.set('todolist',this.list);
}
```

### 4.2 改造上面的Todo、searchList

回到我们要解决的问题。上一章的两个案例数据都存在组件的内存里，刷新页面就没了。现在有了 `StorageService`，改造思路很清晰。进页面时从存储里读一次填回数组，任何会改变数组的操作之后再写回去一次。

**searchList**

```js
import { Component, OnInit } from '@angular/core';

// 引入服务
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {

  public keyword: string;
  public historyList: any[] = [];

  constructor(public storage: StorageService) {
    console.log(this.storage.get());
   }

  ngOnInit() {
   // 修改的地方
    var searchlist:any=this.storage.get('searchlist');
    if(searchlist){
      this.historyList=searchlist;        
    }
  }

  doSearch(){
    if(this.historyList.indexOf(this.keyword)==-1){
      this.historyList.push(this.keyword);
      
      // 修改的地方
      this.storage.set('searchlist',this.historyList);
    }
    this.keyword = '';    
  }

  deleteHistroy(key){
      alert(key);
      this.historyList.splice(key,1);
  }

}
```

读取放在 `ngOnInit` 而不是 `constructor`，这是有讲究的，第七章会展开。简单说构造函数只负责注入和最轻量的赋值，一切需要「数据准备好」的活儿都往 `ngOnInit` 里放。

这里还留了个 bug 没修，`deleteHistroy` 删掉元素之后没写回存储，刷新一下删掉的又回来了。这个我一开始也没注意到，直到自己点着玩才发现。补一行 `this.storage.set('searchlist', this.historyList)` 就行。

**TODOLIST**

```js
  ngOnInit() {
  // 修改的地方
    var todolist:any=this.storage.get('todolist');

    if(todolist){
      this.todolist=todolist;        
    }
 }
doAdd(e){
    if(e.keyCode==13){
        if(!this.todolistHasKeyword(this.todolist,this.keyword)){
          this.todolist.push({
            title:this.keyword,
            status:0                   //0表示代办事项  1表示已完成事项
          });
          this.keyword='';

          // 修改的地方
          this.storage.set('todolist',this.todolist);          //用到this一定要注意this指向
        }else{
          alert('数据已经存在');
          this.keyword='';
        }
     }
  }
 // 修改的地方
checkboxChange(){
    console.log('事件触发了');

    this.storage.set('todolist',this.todolist); 
  }
```

ToDo 这边多出来一个 `checkboxChange`，因为勾选状态的变化 `[(ngModel)]` 只改了内存里的对象，不会自动落盘，所以额外挂一个 `(change)` 事件手动写回。这个点很容易漏，表现就是「勾了之后刷新又变回未完成」。

原文那句注释「用到 this 一定要注意 this 指向」，放在这里其实不成立，箭头函数和类方法里的 `this` 都是稳的。真会出问题的是老式的 `function(){}` 回调，比如 `setTimeout(function(){ this.xxx })`，那个 `this` 会指向别处。TypeScript 的类方法配合模板事件绑定不存在这个问题。

模板对应改一下，两个 checkbox 都加上 `(change)="checkboxChange()"`。

```html
<h2>todoList</h2>
<div class="todolist">
    <input class="form_input" type="text" [(ngModel)]="keyword" (keyup)="doAdd($event)" />
    <hr>
    <h3>待办事项</h3>
    <ul>
      <li *ngFor="let item of todolist;let key=index;" [hidden]="item.status==1">
      <!-- add checkboxChange-->
       <input type="checkbox" [(ngModel)]="item.status"  (change)="checkboxChange()"/>  {{item.title}}   ------ <button (click)="deleteData(key)">X</button>
      </li>
    </ul>
    <h3>已完成事项</h3>
    <ul>
        <li *ngFor="let item of todolist;let key=index;" [hidden]="item.status==0">
   <!-- add checkboxChange-->
         <input type="checkbox" [(ngModel)]="item.status" (change)="checkboxChange()" />  {{item.title}}   ------ <button (click)="deleteData(key)">X</button>
        </li>
      </ul>
</div>
```

## 五、Dom 操作以及@ViewChild、 执行 css3 动画

写惯了 jQuery 的人来到 Angular，第一反应还是想 `document.getElementById`。能用，但不推荐，因为它绕过了 Angular 的抽象层，在服务端渲染或者 Web Worker 环境里直接崩。这一节先看两种写法，再说该选哪个。

**1. Angular 中的 dom 操作(原生 js)**

```js
ngAfterViewInit(){
var boxDom:any=document.getElementById('box'); boxDom.style.color='red';
}
```

注意这段代码放在了 `ngAfterViewInit` 里，不是 `ngOnInit`。为什么？因为 `ngOnInit` 触发的时候视图还没渲染完，`getElementById` 拿到的是 `null`。这是新手最常见的报错之一，「Cannot read property 'style' of null」十有八九就是钩子选错了。

**2. Angular 中的 dom 操作(ViewChild)**

更推荐的做法是 `@ViewChild`。它让 Angular 帮你把模板里的元素引用交到手上，不用去全局 DOM 里捞。

```js
 import { Component ,ViewChild,ElementRef} from '@angular/core';
```

```js
 @ViewChild('myattr') myattr: ElementRef;
```

模板里给元素加一个井号开头的模板引用变量，名字要和 `@ViewChild` 里那个字符串对上。

```html
<div #myattr></div>
```

```js
ngAfterViewInit(){
let attrEl = this.myattr.nativeElement;
}
```

`.nativeElement` 拿到的才是真正的 DOM 节点。同样必须在 `ngAfterViewInit` 之后访问，`ngOnInit` 里它还是 `undefined`。

![使用 ViewChild 获取 DOM 元素的调试结果](https://s.poetries.top/gitee/20191001/32.png)

顺着这块多说一句。真到了要改样式的场景，优先用 `[ngClass]`、`[ngStyle]` 这种声明式绑定，其次考虑 `Renderer2`，它是 Angular 提供的平台无关渲染接口，最后才是 `nativeElement` 直接操作。这个优先级不是洁癖，是为了让代码在非浏览器环境下也能跑。补一句 API 演进，`@ViewChild` 后来加了 `{ static: true | false }` 这个参数来明确查询时机，具体从哪个版本开始要显式传，以官方文档为准。

**3. 父子组件中通过 ViewChild 调用子组件 的方法**

> 调用子组件给子组件定义一个名称

```html
<app-footer #footerChild></app-footer>
```

> 引入 `ViewChild`

```js
 import { Component, OnInit ,ViewChild} from '@angular/core';
```

> `ViewChild` 和刚才的子组件关联起来

```js
 @ViewChild('footerChild') footer
```
 
 > 在父组件中调用子组件方法
 
```js
 run(){ 
    this.footer.footerRun();
}
```

## 六、Angular 父子组件以及组件之间通讯

组件拆细了之后，数据怎么在它们之间流动就成了主要矛盾。Angular 的答案和 Vue 很像，父传子用输入属性，子告父用事件，父主动读子用视图查询。下面这张图把三条路径画在一起了。

![Angular 父子组件通信的三种方式示意图](https://s.poetries.top/gitee/20191001/33.png)

### 6.1 父组件给子组件传值-@input

父组件不仅能给子组件传简单数据，还能把自己的方法甚至整个组件实例传下去。后面这种写法方便，但要慎用，理由放在这一节末尾说。

**1. 父组件调用子组件的时候传入数据**

```html
<app-header [msg]="msg"></app-header>
```

**2. 子组件引入 Input 模块**

```js
import { Component, OnInit ,Input } from '@angular/core';
```

**3. 子组件中 @Input 接收父组件传过来的数据**

```js
export class HeaderComponent implements OnInit {
  @Input() msg:string
  
  constructor() { }
  
  ngOnInit() {
  }
}
```

**4. 子组件中使用父组件的数据**

```html
<p>
  child works!
  {{msg}}
</p>
```

**5. 把整个父组件传给子组件**

在模板里 `this` 就指向当前组件实例，所以可以整个传下去。

```html
<app-header [home]="this"></app-header>
```

```js
export class HeaderComponent implements OnInit {
  @Input() home:any
  
  constructor() { }
  
  ngOnInit() {
  }
}
```

子组件里就能 `this.home.xxx()` 直接调父组件的方法了。

先说结论，这招能用但别滥用。把整个父实例传给子组件，等于把两个组件焊死了，子组件从此只能给这一个父用，测试也难写，类型上还得标成 `any` 丢掉所有检查。真需要子调父，走下一节的 `@Output` 才是正路。我一般只在临时调试或者确定不会复用的内部组件上这么干。

### 6.2 子组件通过@Output 触发父组件的方法（了解）

**1. 子组件引入 Output 和 EventEmitter**

```js
 import { Component, OnInit ,Input,Output,EventEmitter} from '@angular/core';
```

**2. 子组件中实例化 EventEmitter**

```js
@Output() private outer=new EventEmitter<string>(); /*用EventEmitter和output装饰器配合使用 <string>指定类型变量*/
```

**3. 子组件通过 EventEmitter 对象 outer 实例广播数据**

```js
sendParent(){
  // alert('zhixing');
  this.outer.emit('msg from child')
}
```

**4. 父组件调用子组件的时候，定义接收事件 , outer 就是子组件的 EventEmitter 对象 outer**

```html
<!--$event就是子组件emit传递的数据-->
 <app-header (outer)="runParent($event)"></app-header>
```

**5. 父组件接收到数据会调用自己的 runParent 方法，这个时候就能拿到子组件的数据**

```js
//接收子组件传递过来的数据 
runParent(msg:string){
   alert(msg);
 }
```

标题里写着「了解」，我觉得这个定位偏低了。`@Output` 加 `EventEmitter` 才是子传父的标准做法，它保持了两个组件的独立性，子组件只管往外喊一声，谁在听不关心。`EventEmitter<string>` 的泛型参数还能给你事件载荷的类型检查，比传整个父实例强太多。

### 6.3 父组件通过@ViewChild 主动获取子组 件的数据和方法

**1. 调用子组件给子组件定义一个名称**

```html
<app-footer #footerChild></app-footer>
```

**2. 引入 ViewChild**


```js
import { Component, OnInit ,ViewChild} from '@angular/core';
```

**3. ViewChild 和刚才的子组件关联起来**

```js
 @ViewChild('footerChild') footer;
```
 
 
**4. 调用子组件**

```js
run(){ this.footer.footerRun();
}
```

这条路径和 `@Output` 方向相反，是父主动去够子组件。适合「命令式」的场景，比如父组件点一下按钮让子组件里的表单重置、让子组件的弹窗打开。数据流方面还是建议走 `@Input`，`@ViewChild` 留给动作调用。

### 6.4 非父子组件通讯

隔了好几层甚至完全没有嵌套关系的两个组件要通信，上面三招都不好使了。当年常见的做法有这么几种：

- 公共的服务，把状态放在一个单例服务里，两边都注入它。配合 RxJS 的 `Subject` 还能做到一边改另一边收到通知，这是最正统的方案
- `Localstorage` 存一份，简单直接，缺点是没有变更通知，得自己轮询或者配合 `storage` 事件
- `Cookie`，一般不建议，容量小还会跟着每个请求发出去

原文把 `Localstorage` 标成推荐，我的看法不太一样。真正跨组件的运行时状态，走服务加 `Subject` 才是可控的，`localStorage` 更适合做持久化而不是通信通道。当然项目小的时候怎么快怎么来，这个没有绝对答案。

## 七、Angular 中的生命周期函数

生命周期这块是 Angular 里「知道了就一劳永逸，不知道就反复踩」的典型。前面已经出现过两次相关的坑，DOM 操作要放 `ngAfterViewInit`，请求数据要放 `ngOnInit`，这一章把整条链路补齐。

### 7.1 Angular中的生命周期函数

官方文档在 https://www.angular.cn/guide/lifecycle-hooks ，建议对着看。

生命周期函数说到底就是组件创建、更新、销毁这几个时刻上，Angular 会回调你的一组方法。当 `Angular` 用构造函数新建一个组件或指令之后，就会按固定顺序在特定时刻依次调用它们。

命名上有个规律，每个钩子对应一个接口，方法名就是接口名前面加 `ng`。比如 `OnInit` 接口的钩子方法叫 `ngOnInit`。所以你写 `implements OnInit` 的时候，TypeScript 会强制你实现 `ngOnInit`，拼错了当场报错。这个 `implements` 其实可以不写，Angular 只按方法名找，但强烈建议写上，白捡一层编译期检查。

**1. 生命周期钩子分类**

按指令和组件的区别来分，可以分成两组。指令没有自己的模板，所以跟视图和内容投影相关的那四个钩子它没有。

**指令与组件共有的钩子**

- `ngOnChanges`
- `ngOnInit`
- `ngDoCheck`
- `ngOnDestroy`

**组件特有的钩子**

- `ngAfterContentInit`
- `ngAfterContentChecked`
- `ngAfterViewInit`
- `ngAfterViewChecked`

![Angular 生命周期钩子分类与执行顺序图](https://s.poetries.top/gitee/20191001/34.png)

**2. 生命周期钩子的作用及调用顺序**

1、`ngOnChanges` - 当数据绑定输入属性的值发生变化时调用
2、`ngOnInit` - 在第一次 `ngOnChanges` 后调用
3、`ngDoCheck` - 自定义的方法，用于检测和处理值的改变
4、`ngAfterContentInit` - 在组件内容初始化之后调用
5、`ngAfterContentChecked` - 组件每次检查内容时调用
6、`ngAfterViewInit` - 组件相应的视图初始化之后调用
7、`ngAfterViewChecked` - 组件每次检查视图时调用
8、`ngOnDestroy` - 指令销毁前调用

这八个里真正天天用的就三个，`ngOnInit` 拉数据、`ngAfterViewInit` 摸 DOM、`ngOnDestroy` 收尾清理。剩下五个属于「知道它存在，遇到特定问题时想得起来」的层次。带 `Checked` 的那几个每一轮变更检测都会跑，在里面写重逻辑等于给自己挖坑。

有一个区分点值得记牢，`Content` 系列指的是外部投影进来的内容，也就是 `<ng-content>` 那部分；`View` 系列指的是组件自己模板里的东西。顺序上内容先于视图，所以 `ngAfterContentInit` 一定在 `ngAfterViewInit` 之前。

**3. 首次加载生命周期顺序**

```js
export class LifecircleComponent {

    constructor() {

        console.log('00构造函数执行了---除了使用简单的值对局部变量进行初始化之外，什么都不应该做')
    }

    ngOnChanges() {

        console.log('01ngOnChages执行了---当被绑定的输入属性的值发生变化时调用(父子组件传值的时候会触发)'); 
    }

    ngOnInit() {
        console.log('02ngOnInit执行了--- 请求数据一般放在这个里面');
    }
    ngDoCheck() {
        console.log('03ngDoCheck执行了---检测，并在发生 Angular 无法或不愿意自己检测的变化时作出反应');
    }
    ngAfterContentInit() {
        console.log('04ngAfterContentInit执行了---当把内容投影进组件之后调用');
    }
    ngAfterContentChecked() {
        console.log('05ngAfterContentChecked执行了---每次完成被投影组件内容的变更检测之后调用');
    }
    ngAfterViewInit() : void {
        console.log('06 ngAfterViewInit执行了----初始化完组件视图及其子视图之后调用（dom操作放在这个里面）');
    }
    ngAfterViewChecked() {
        console.log('07ngAfterViewChecked执行了----每次做完组件视图和子视图的变更检测之后调用');
    }

    ngOnDestroy() {
        console.log('08ngOnDestroy执行了····');
    }

    //自定义方法
    changeMsg() {

        this.msg = "数据改变了";
    }
}
```

把上面这个组件挂到页面上，控制台打印出来的顺序就是下面这张图。自己跑一遍比背表管用，尤其是能直观看到构造函数确实排在所有钩子前面。

![Angular 组件首次加载时生命周期钩子的控制台打印顺序](https://upload-images.jianshu.io/upload_images/1480597-7e0081f4616fe461.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

带 `Check` 的钩子可以用来对数据变化做响应。加两个能触发变更的控件试试。

```html
<button (click)="changeMsg()">数据改变了</button>
<input type='text' [(ngModel)]="userInfo" />
```

点击按钮或者在输入框里打字，都会触发一轮变更检测，控制台里 `ngDoCheck`、`ngAfterContentChecked`、`ngAfterViewChecked` 这几个会跟着刷屏。

![数据变化后重复触发的 Check 系列生命周期钩子](https://s.poetries.top/gitee/20191001/35.png)

这里正好能看出 `Check` 系列的代价。你敲一个字符，这三个钩子各跑一次，而且是全组件树跑。所以里面绝对不能放耗时逻辑，更不能在里面改绑定的数据，那会直接触发下一轮检测，开发模式下 Angular 会报 `ExpressionChangedAfterItHasBeenCheckedError`。这个报错我排查过一下午，最后发现是在 `ngAfterViewInit` 里改了一个模板正在用的属性。

顺手指两个上面代码里的问题。`changeMsg` 方法里用了 `this.msg`，但类里从头到尾没声明过 `msg` 这个属性，直接编译不过，得补一个 `msg: string = ''`。另外 `ngDoCheck` 里写的是 `this.userinfo`，模板绑的是 `userInfo`，大小写对不上，实际是两个不同的属性。这类拼写问题在 TypeScript 里本来能被抓住，前提是别把类型标成 `any`。

在 `ngDoCheck` 里可以自己比对新旧值做一些事情。

```js
ngDoCheck() {
        //写一些自定义的操作

        console.log('03ngDoCheck执行了---检测，并在发生 Angular 无法或不愿意自己检测的变化时作出反应');
        if(this.userinfo!==this.oldUserinfo){
            console.log(`你从${this.oldUserinfo}改成${this.userinfo}`);
            this.oldUserinfo = this.userinfo;
        }else{
            
            console.log("数据没有变化");          
        }

    }
```



### 7.2 生命周期钩子详解

上面是全景，这一节逐个说清楚每个钩子该干什么、不该干什么。

#### 7.2.1 constructor-掌握

`constructor` 严格说不是生命周期钩子，它是 JS 类本身的构造函数。`Angular` 的组件就是普通 `class`，所以它有构造函数很自然。在 `Angular` 里，构造函数的职责被收窄了，主要就是注入依赖，外加做点极轻量的初始化。它在所有生命周期钩子之前执行。

为什么不建议在构造函数里干活？因为这个时刻输入属性还没赋值，你拿到的 `@Input` 全是 `undefined`，下面 7.2.3 的例子会把这一点演示得很清楚。

```js
import { Component, ElementRef } from '@angular/core';

@Component({
  selector: 'my-app',
  template: `
    <h1>Welcome to Angular World</h1>
    <p>Hello {{name}}</p>
  `,
})
export class AppComponent {
  name: string = '';

  constructor(public elementRef: ElementRef) {//使用构造注入的方式注入依赖对象
    // 执行初始化操作
    this.name = 'Semlinker'; 
  }
}
```

#### 7.2.2  ngOnChanges()

当 `Angular` 设置或者重新设置数据绑定的输入属性时，这个钩子会被调用。它的形参是一个 `SimpleChanges` 对象，里面装着每个变化属性的当前值和上一次的值，还有一个 `firstChange` 标记。首次调用一定发生在 `ngOnInit()` 之前。

```html
<!-- 父组件中 传递title属性给header子组件 -->
<app-header [title]="title"></app-header>
```

只要父组件里的 `title` 变了，子组件的 `ngOnChanges` 就会跑一次。

![父组件修改输入属性触发子组件 ngOnChanges](https://s.poetries.top/gitee/20191001/36.png)

有个容易误会的点，`ngOnChanges` 比较的是引用。你传下去一个对象，然后在父组件里改这个对象的某个字段，引用没变，子组件的 `ngOnChanges` 不会触发。想让它触发就得整体换一个新对象。这个行为跟 `OnPush` 变更检测策略是一套逻辑，理解了一个另一个也就通了。

#### 7.2.3 ngOnInit()--掌握

在 `Angular` 第一次完成数据绑定、并把输入属性都设置好之后，这个钩子被调用，位置在第一轮 `ngOnChanges()` 之后，整个生命周期里只调用一次。发请求拉数据就放在这儿。

用 `ngOnInit()` 而不是构造函数，主要是两个理由：

- 构造函数之后马上执行的复杂初始化逻辑应该分离出来，构造函数保持轻量
- 只有到了这个时刻，`Angular` 才把输入属性设置完毕，组件才算「准备好了」

下面这段代码是最直观的对照，同一个 `pname`，构造函数里打印是 `undefined`，`ngOnInit` 里就有值了。
  
```js
import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'exe-child',
    template: `
     <p>父组件的名称：{{pname}} </p>
    `
})
export class ChildComponent implements OnInit {
    @Input()
    pname: string; // 父组件的名称

    constructor() {
        console.log('ChildComponent constructor', this.pname); 
        // Output：undefined
    }

    ngOnInit() {
        console.log('ChildComponent ngOnInit', this.pname); 
        // output: 输入的pname值
    }
}
```

#### 7.2.4 ngDoCheck()

用来检测那些 `Angular` 自己发现不了的变化，并作出反应。它在每一轮变更检测里都会跑，位置在 `ngOnChanges()` 和 `ngOnInit()` 之后。前面说过它触发极其频繁，一般只在实现自定义脏检查逻辑时才需要动它，日常业务几乎用不上。

#### 7.2.5 ngAfterContentInit()

当外部内容通过 `<ng-content>` 投影进组件之后调用，在第一次 `ngDoCheck()` 之后触发，只调用一次。做通用组件的时候会用到，比如需要在投影内容就位后统计一下里面有几个子项。

#### 7.2.6 ngAfterContentChecked()

每次完成被投影内容的变更检测之后调用，在 `ngAfterContentInit()` 之后以及每次 `ngDoCheck()` 之后触发。同样是高频钩子。

#### 7.2.7 ngAfterViewInit()--掌握

组件自己的视图和子视图初始化完成之后调用，位置在第一次 `ngAfterContentChecked()` 之后，只调用一次。前面第五章说的 DOM 操作、`@ViewChild` 取元素，都必须等到这个时刻。

#### 7.2.8 ngAfterViewChecked()

每次做完组件视图和子视图的变更检测之后调用，在 `ngAfterViewInit()` 之后以及每次 `ngAfterContentChecked()` 之后触发。

#### 7.2.9 ngOnDestroy()--掌握

`Angular` 销毁指令或组件之前调用，用来做清扫工作。移除事件监听、清除定时器、退订 `Observable` 都放这儿，不做的话就是妥妥的内存泄漏。

这个钩子的重要性经常被低估。单页应用里组件来回切，一个没退订的定时器或者订阅会一直挂着，用户在几个页面之间跳十几次，后台就堆了十几个副本在跑。表现出来往往不是崩溃，而是页面越用越卡，或者接口莫名其妙被重复调用。排查这类问题的时候，第一件事就是去看有没有漏写 `ngOnDestroy`。

下面这个指令是个最小演示，构造函数里开了 `setInterval`，销毁时清掉。

```js
@Directive({
    selector: '[destroyDirective]'
})
export class OnDestroyDirective implements OnDestroy {
  sayHiya: number;
  
  constructor() {
    this.sayHiya = window.setInterval(() => console.log('hello'), 1000);
  }
  
  ngOnDestroy() {
     window.clearInterval(this.sayHiya);
  }
}
```

原文这段里属性声明写的是 `sayHello`，用的却是 `this.sayHiya`，前后对不上，这里已经统一成 `sayHiya` 了。这种低级错误恰恰说明为什么值得开 `strict` 模式，编译器一眼就能揪出来。

关于退订还有个后来的改进方向可以提一句，如今更常见的做法是用 `takeUntilDestroyed` 之类的工具把退订和组件销毁自动绑在一起，不必手写 `ngOnDestroy`。具体 API 名称和引入路径以官方文档为准，我没在所有版本上验证过。

## 八、Rxjs 异步数据流编程

Angular 里绕不开 RxJS。路由参数是流，HTTP 响应是流，表单的值变化也是流，你不学它连一个接口都调不明白。这一章不打算把 RxJS 讲全，只把 Angular 场景下用得到的那部分讲清楚。

### 8.1 Rxjs介绍

参考手册在 https://www.npmjs.com/package/rxjs ，中文文档在 https://cn.rx.js.org/ 。

`RxJS` 是 `ReactiveX` 这套编程理念的 `JavaScript` 实现。`ReactiveX` 最早来自微软，核心思路是把一切数据都当成流来处理，`HTTP` 请求是流，`DOM` 事件是流，普通数据也能包成流。包好之后用一堆操作符去加工这些流，最后你写异步代码的姿势会接近写同步代码。

它的目标就一个，让异步可控。`Angular` 把它内建进来，就是为了给异步处理一套统一的抽象。RxJS 提供的模块非常多，这里主要讲最常用的 `Observable` 和 `fromEvent`。

回过头看，JS 处理异步的方案是一路演进过来的：

- 回调函数，最原始，嵌套多了就是回调地狱
- 事件监听和发布订阅，解耦了，但流程散在各处不好追
- `Promise`，解决了嵌套问题，缺点是只能吐一个值而且不能取消
- `Rxjs`，能吐多个值、能取消、还带一整套操作符

这四个不是替代关系，`Promise` 在只有一次性结果的场景仍然更简单。RxJS 的优势要在多值、可取消、需要组合的场景才显出来。

### 8.2 Promise和RxJS处理异步对比

最快理解 RxJS 的方式是拿它和 `Promise` 对着写一遍。新建一个 `service`。

```bash
ng g service services/rxjs
```

在 `services/rxjs.service.ts` 里写两个方法，一个用 `Promise`，一个用 `Observable`，做的事情完全一样，都是两秒后给出一个值。

```js
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class RxjsService {
  constructor() { }
  
 // Promise 处理异步
  getPromiseData() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('---promise timeout---');
      }, 2000);
    });
  }

  // RxJS 处理异步
  getRxjsData() {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next('observable timeout');
      }, 2000);
    });
  }

}
```

原文这段的 `getPromiseData` 少了一个闭合花括号，两个方法实际上嵌套在了一起，直接编译不过，上面已经补齐并重新缩进了。另外原文所有的箭头函数都被写成了 `= >`，中间多一个空格，这也是不合法的语法，估计是某次自动格式化搞坏的，本文里已经统一修正成 `=>`。

```js
// 在其他组件使用服务
import { Component, OnInit } from '@angular/core';
import { RxjsService } from '../../services/rxjs.service';

@Component({
  selector: 'app-rxjs',
  templateUrl: './rxjs.component.html',
  styleUrls: ['./rxjs.component.scss']
})
export class RxjsComponent implements OnInit {
  
  // 注入服务
  constructor(public request: RxjsService) {

   }

  ngOnInit() {
    // 调用方法
     this.request.getRxjsData().subscribe(data=>{
      console.log(data)
    })
  }

}
```


从上面这个例子能看出来，`RxJS` 和 `Promise` 的基本用法长得很像，差别主要在关键词上。`Promise` 用 `then()` 和 `resolve()`，`RxJS` 用 `next()` 和 `subscribe()`。

但相似只是表面。`Rxjs` 比 `Promise` 强的地方在于它可以中途撤回、可以发射多个值、还配了一大堆操作符。下面三节分别演示这几点。

有一个行为差异得先说清楚，`Promise` 是急切的，`new Promise` 那一刻里面的代码就开始跑了，你 `then` 不 `then` 它都在跑。`Observable` 是惰性的，没人 `subscribe` 就一行都不执行，订阅一次就跑一遍。这个区别在发请求的时候会咬人，同一个 `Observable` 订阅两次，请求就发两次。

### 8.3 Rxjs unsubscribe 取消订阅

`Promise` 一旦创建，动作就收不回来了。`Observable` 不一样，可以通过 `unsubscribe()` 中途撤回。

**Promise 创建之后动作无法撤回**

```js
let promise = new Promise(resolve =>{
    setTimeout(() =>{
        resolve('---promise timeout---');
    },
    2000);
});
promise.then(value =>console.log(value));
```

**Rxjs 可以通过 unsubscribe() 可以撤回 subscribe 的动作**

```js
let stream = new Observable(observer =>{
    let timeout = setTimeout(() =>{
        clearTimeout(timeout);
        observer.next('observable timeout');
    },
    2000);
});
let disposable = stream.subscribe(value =>console.log(value));
setTimeout(() =>{
    //取消执行 disposable.unsubscribe();
},
1000);
```

`subscribe()` 的返回值是一个 `Subscription` 对象，攥着它就能随时退订。上面代码里退订那行被注释掉了，放开注释你会发现两秒后的 `console.log` 不再打印，因为一秒的时候整条订阅已经被切断了。

这个能力在实际项目里价值很大。用户在搜索框里连打五个字，前四次请求都可以退掉只留最后一次；用户离开页面时把没回来的请求全部退订。用 `Promise` 你只能设个标志位在回调里判断「我还要不要这个结果」，请求本身是拦不住的。

不过退订不等于取消底层动作。上面这个例子里 `setTimeout` 其实还在跑，只是没人接收它的值了。要真正取消，得在 `Observable` 的构造函数里返回一个清理函数，Angular 的 `HttpClient` 内部就做了这件事，所以退订 HTTP 请求是真的会 abort 掉。

### 8.4 Rxjs 订阅后多次执行

有时候我们想让异步的回调多次执行，比如做一个计时器。

这一点 `Promise` 做不到。`Promise` 的最终状态要么 `resolve` 兑现要么 `reject` 拒绝，而且只能定格一次，在同一个 `Promise` 上重复调 `resolve`，后面几次会被静默忽略掉。`Observable` 不一样，它可以不断往外推下一个值，`next()` 这个名字本身就在说这件事。

```js
let promise = new Promise(resolve =>{
    setInterval(() =>{
        resolve('---promise setInterval---');
    },
    2000);
});
promise.then(value =>console.log(value));
```

上面这段 `Promise` 版本你会看到只打印一次，后面每两秒 `resolve` 一次全被吞掉了。

**Rxjs**

```js
let stream = new Observable < number > (observer =>{
    let count = 0;
    setInterval(() =>{
        observer.next(count++);
    },
    1000);
});
stream.subscribe(value =>console.log("Observable>" + value));
```

换成 `Observable`，控制台会持续输出 0、1、2 一直数下去。顺带提醒一句，这个 `setInterval` 没有清理逻辑，退订之后它还在后台跑，属于典型的内存泄漏写法，实际项目里要在构造函数里 `return () => clearInterval(timer)`。原文这里没写，是演示代码常见的省略。

补充一点，原文说「在同一个 Promise 对象上多次调用 resolve 会抛异常」，这个说法不准确。规范里重复调用 `resolve` 是被静默忽略的，不会报错，只是后面的值都进不来。结论没变，`Promise` 就是只能定一次，但原因说清楚更好。

### 8.5 Angualr6.x之前使用Rxjs的工具函数 map filter

这一节是历史包袱，但很值得看，因为它是 Angular 生态里最有名的一次破坏性升级。

`Angular6` 之后想继续用老的 `rxjs` 写法，必须装 `rxjs-compat` 这个兼容包，`map`、`filter` 这些操作符才能挂在 `Observable` 原型上直接链式调用。

```bash
npm install rxjs-compat
```

```js
import {Observable} from 'rxjs'; import 'rxjs/Rx';
```

```js
let stream = new Observable < any > (observer =>{
    let count = 0;
    setInterval(() =>{
        observer.next(count++);
    },
    1000);
});
stream.filter(val =>val % 2 == 0).subscribe(value =>console.log("filter>" + value));
stream.map(value =>{
    return value * value
}).subscribe(value =>console.log("map>" + value));
```

注意这里 `filter` 和 `map` 是直接挂在 `stream` 上链式调的。这种写法叫 patch operator，因为它靠 `import 'rxjs/Rx'` 给 `Observable.prototype` 打补丁。方便是方便，代价是打包工具没法做 tree shaking，你只用了两个操作符，整个 RxJS 都得打进去。这也是 RxJS 6 要改的根本原因。

### 8.6 Angualr6.x 以后 Rxjs6.x 的变化以及 使用

#### 8.6.1 Rxjs 的变化参考

从 `Angular5` 升到 `Angular6`，Angular 本身变化不大，但 `RXJS` 这块动静不小。下面把改了什么、怎么迁移过一遍。

**1. angular6 Angular7中使用以前的rxjs**

一个写了半年多的项目模块数量已经很可观了，升级到 `angular6` 之后不可能立刻把所有 RxJS 代码都改成新写法。官方为此给了一个过渡方案。

```js
npm install --save rxjs-compat
```

- 优点是暂时不用改代码，可以一个模块一个模块地慢慢改，全改完了再把这个包卸掉
- 缺点是对 `rxjs6` 里被重命名的那些 `operator` 无效，用到重命名 API 的地方还是得手动改

我的建议是把 `rxjs-compat` 当止血带用，别当长期方案。装着它 tree shaking 就废了，包体积下不来，而且团队里新写的代码很容易又用回老写法。

**2. Angular6 以后 RXJS6的变化**

`RXJS6` 主要改了包的结构，落到代码上就是三件事，`import` 路径变了、`operator` 的用法变了、以及要通过 `pipe()` 串联。

**2.1 Imports 方式改变**

![RxJS 6 中 import 路径变化的对照](https://s.poetries.top/gitee/20191001/37.png)

以前从 `rxjs` 深处一层层往下导入的写法没了。像 `Observable`、`Subject` 这些核心类型，现在统一止于 `rxjs` 这一层，不再往下钻。

**2.2 operator的改变**

![RxJS 6 中操作符导入路径的变化](https://s.poetries.top/gitee/20191001/38.png)

规律很好记，创建类的 API 从 `rxjs` 引入，加工类的操作符比如 `map`、`filter` 从 `rxjs/operators` 引入。分成两个入口的目的就是让打包器能精确知道你用了哪些，没用到的直接摇掉。

![RxJS 创建类 API 与操作符的引入位置对照](https://s.poetries.top/gitee/20191001/39.png)

**2.3 pipeable observable**

![RxJS 6 pipeable 操作符的写法示意](https://s.poetries.top/gitee/20191001/40.png)

这是最直观的一处变化。操作符不再挂在原型上，而是作为独立函数传进 `pipe()`。刚改的时候会觉得啰嗦，用一阵子反而更喜欢，因为 `pipe` 里是一串平铺的函数，加一个减一个都很清楚，也方便把常用组合抽成自定义操作符复用。

**2.4 被重新命名的API**

![RxJS 6 中被重命名的操作符清单](https://s.poetries.top/gitee/20191001/41.png)

这批重命名主要是为了避开 JS 关键字和内置方法名，比如 `do`、`catch`、`switch` 这些。改名之后 `rxjs-compat` 也救不了，只能手动搜替换。真到迁移的时候，官方提供过自动迁移工具，比自己肉眼找靠谱，具体用法以官方迁移文档为准。

下面是改造后的完整写法。

```js
import {Observable} from 'rxjs';
import {map,filter} from 'rxjs/operators';
```

```js
let stream= new Observable<any>(observer => {
    let count = 0;
    setInterval(() =>{
        observer.next(count++);
    },
    1000);
});

stream.pipe(filter(val =>val % 2 == 0))
.subscribe(value =>console.log("filter>" + value));

stream
.pipe(
    filter(val =>val % 2 == 0), 
    map(value =>{
        return value * value
}))
.subscribe(value =>console.log("map>" + value));
```

### 8.7 Rxjs 延迟执行

`fromEvent` 把 DOM 事件包成流，配上 `throttleTime` 就是节流。这类需求以前得自己写定时器加标志位，现在一个操作符解决。

```js
import {
    Observable,
    fromEvent
}
from 'rxjs';
import {
    map,
    filter,
    throttleTime
}
from 'rxjs/operators';

var button = document.querySelector('button');

fromEvent(button, 'click')
.pipe(throttleTime(1000))
.subscribe(() =>console.log(`Clicked`));
```

搜索框防抖是同样的路子，把 `throttleTime` 换成 `debounceTime`，再串一个 `distinctUntilChanged` 过掉重复输入，最后接 `switchMap` 发请求，`switchMap` 还会自动退掉上一次没回来的请求。这四个操作符串起来就是一个完整的搜索联想，代码不到十行。这是我觉得 RxJS 最香的场景，换成 `Promise` 写同样的逻辑要长得多，还容易漏掉竞态。

这块也有个坑要注意，`fromEvent(button, 'click')` 里的 `button` 是用 `document.querySelector` 取的，前面第五章说过，这种写法在组件里要放到 `ngAfterViewInit` 之后，而且更推荐用 `@ViewChild` 拿元素。

## 九、Angular 中的数据交互(get jsonp post)

前面铺垫的 `Observable` 在这一章开始兑现价值，因为 Angular 的 HTTP 客户端返回的就是 `Observable`，不是 `Promise`。

### 9.1 Angular get 请求数据

`Angular5.x` 以后和服务器交互统一用 `HttpClientModule` 模块，之前的 `HttpModule` 已经废弃。两者名字只差几个字母，但 `HttpClient` 默认就帮你把响应体解析成 JSON 了，不用再手动 `.json()`。

**1. 在 app.module.ts 中引入 HttpClientModule 并注入**

```js
import {HttpClientModule} from '@angular/common/http';
```

```js
imports: [
    BrowserModule,
    HttpClientModule
]
```

**2. 在用到的地方引入 HttpClient 并在构造函数声明**

```js
import {HttpClient} from "@angular/common/http";

constructor(public http:HttpClient) { }
```

**3. get 请求数据**

```js
var api = "http://a.itying.com/api/productlist";

this.http.get(api).subscribe(response => {
console.log(response); });
```

注意这里必须 `subscribe`，不订阅请求根本不会发出去。这就是前面说的 `Observable` 惰性特性，从 `Promise` 过来的人第一次撞上这个都会懵一下，代码写完了接口却没调用。

请求参数别自己拼字符串，`HttpClient` 的第二个参数可以传 `{ params: { id: 1 } }`，它会帮你做编码。手动拼接遇到中文或者特殊字符就出问题了。

还有一点，`get<T>()` 是支持泛型的，写成 `this.http.get<Product[]>(api)`，订阅回调里就能拿到有类型的数据，不用再一路 `any`。既然都用 TypeScript 了，这个便宜不占白不占。

### 9.2 Angular post 提交数据

post 和 get 用的是同一个 `HttpClientModule`，区别在于要带请求体，通常还得显式指定 `Content-Type`。

**1. 在 app.module.ts 中引入 HttpClientModule 并注入**

```js
import {HttpClientModule} from '@angular/common/http';

imports: [
    BrowserModule,
    HttpClientModule
]
```

**2. 在用到的地方引入 HttpClient、HttpHeaders 并在构造函数声明 HttpClient**

```js
import {HttpClient,HttpHeaders} from "@angular/common/http";

constructor(public http:HttpClient) { }
```

**3. post 提交数据**

前端调 post 得有个能收的后端，这里用 `express` 起一个最简单的服务。这段代码本身也值得看，因为它把跨域怎么放开写得很清楚。

```js
// package.json
{
  "dependencies": {
    "ejs": "^2.5.6",
    "express": "^4.15.3",
    "socket.io": "^2.0.3",
    "body-parser": "~1.17.1"
  }
}
```

```js
// app.js 代码
var express = require('express');
var app=express();
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/*express允许跨域*/
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    if(req.method=="OPTIONS") res.send(200);
    else  next();
});

//app.use(express.static(path.join(__dirname, 'public')));

app.get('/',function(req,res){
	res.send('首页');
})
app.post('/dologin',function(req,res){
	console.log(req.body);
 	res.json({"msg":'post成功'});
})

app.get('/news',function(req,res){

	//console.log(req.body);
	res.jsonp({"msg":'这是新闻数据'});

})

app.listen(3000,'127.0.0.1',function(){
   console.log('项目启动在3000端口')
});
```

中间那段 `app.all('*', ...)` 是手写的 CORS 处理。有两个细节值得留意，一是 `Access-Control-Allow-Headers` 必须把前端会发的自定义头都列进去，少一个浏览器就拦；二是最后那个 `if(req.method=="OPTIONS") res.send(200)`，处理的是预检请求。post 带 `Content-Type: application/json` 时浏览器会先发一个 `OPTIONS` 探路，这个不返回 200 后面的真实请求根本不会发出来。这个我踩过，当时一直以为是后端接口挂了，其实是预检被 404 了。

现在写 express 一般直接上 `cors` 中间件，一行 `app.use(cors())` 搞定，不用自己拼这些响应头。手写的好处是能看清楚每个头在管什么，所以这段留着挺有教学价值。另外 `body-parser` 从 Express 4.16 起已经内置了，直接用 `express.json()` 和 `express.urlencoded()` 就行，不用再单独装包。

前端这边这么调。

```js
// angular代码

doLogin() {
  
  // 手动设置请求类型
  const httpOptions = {
    headers: new HttpHeaders({
        'Content-Type': 'application/json'
    })
};
var api = "http://127.0.0.1:3000/doLogin";

this.http.post(api, {
    username: '张三',
    age: '20'
},
httpOptions).subscribe(response =>{
    console.log(response);
});
}
```

这里有个小不一致，服务端注册的路由是 `/dologin` 全小写，前端请求的是 `/doLogin`。Express 的路由默认不区分大小写所以能通，但两边写法对齐是个好习惯，哪天有人打开 `caseSensitive` 就炸了。

### 9.3 Angular Jsonp 请求数据

jsonp 是解决跨域的老办法，靠 `script` 标签不受同源策略限制这个特性绕过去。它只能发 get 请求，而且需要服务端配合按约定包一层回调函数。

**1. 在 app.module.ts 中引入 HttpClientModule、HttpClientJsonpModule 并注入**

```js
 import {HttpClientModule,HttpClientJsonpModule} from '@angular/common/http';
```
 
```js
 imports: [
  BrowserModule,
  HttpClientModule,
  HttpClientJsonpModule
]
```

**2. 在用到的地方引入 HttpClient 并在构造函数声明**

```js
import {HttpClient} from "@angular/common/http";

constructor(public http:HttpClient) { }
```

**3. jsonp 请求数据**

```js
// 接口支持jsonp请求
var api = "http://a.itying.com/api/productlist";

this.http.jsonp(api,'callback').subscribe(response => {
console.log(response); });
```

第二个参数 `'callback'` 是回调参数名，得和服务端约定的一致，有的接口叫 `callback`，有的叫 `jsonpCallback`，对不上就拿不到数据。

说句实在的，现在还需要用 jsonp 的场景已经很少了，CORS 才是正经方案。它只能 get、没法带 cookie 之外的凭证、错误处理也很弱，服务端返回 500 你在前端只会看到脚本加载失败。留在这里主要是维护老接口时会遇到。

### 9.4 Angular 中使用第三方模块 axios 请求数据

`HttpClient` 已经够用，为什么还要用 axios？我见过的理由通常是团队里已经有一套基于 axios 的请求封装，拦截器、错误码处理、token 注入全在里面，不想重写一遍。这种情况下把 axios 搬进来是合理的。

**1. 安装 axios**

```js
cnpm install axios --save
```

**2. 用到的地方引入 axios**

```
import axios from 'axios';
```

**3. 看文档使用**

```js
axios.get('/user?ID=12345').then(function(response) {
    // handle success
    console.log(response);
}).
catch(function(error) {
    // handle error console.log(error);
}).then(function() {
    // always executed 
});
    
```

用 axios 有个代价得心里有数。它返回的是 `Promise`，脱离了 Angular 的 `Observable` 体系，`HttpClient` 那套拦截器、请求取消、和路由守卫的配合就都用不上了。而且 axios 的回调跑在 Angular 的变更检测之外，偶尔会出现「数据回来了但视图没更新」的情况。两套并存的时候，我倾向于新写的走 `HttpClient`，老封装维持原样，别在一个项目里反复横跳。

## 十、Angular 中的路由

路由是单页应用的骨架。Angular 的路由器功能相当完整，懒加载、守卫、解析器都是官方内建的，不用另找库。这一章从最基础的配置开始，一路走到父子路由。

### 10.1 Angular 创建一个默认带路由的项目

**1. 命令创建项目**

```js
ng new angualrdemo08 --skip-install
```

**2. 创建需要的组件**

```bash
ng g component home
ng g component news
ng g component newscontent
```

**3. 找到 app-routing.module.ts 配置路由**

```js
// 引入组件

import { HomeComponent } from './home/home.component';
import { NewsComponent } from './news/news.component';
import { NewscontentComponent } from './newscontent/newscontent.component';

// 配置路由
const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: 'news', component: NewsComponent},
  {path: 'newscontent/:id', component: NewscontentComponent},
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
} ];
```



路由表里有几个点值得停一下。`newscontent/:id` 里的冒号表示这是一段动态参数，10.5 节会讲怎么取值。最后那条 `path: ''` 配 `redirectTo` 是默认路由，`pathMatch: 'full'` 不能省，因为空字符串是任何路径的前缀，不加这个约束会把所有路径都重定向走，直接死循环。

另外路由数组是有顺序的，Angular 从上往下找第一个匹配的就停，所以通配路由必须放最后。

**4. 找到 app.component.html 根组件模板，配置 router-outlet 显示动态加载的路由**

`<router-outlet>` 是个占位标记，匹配到的组件会被渲染在它后面。注意是「后面」不是「里面」，所以别指望给它加样式能影响到路由组件。

```html
<h1>
<a routerLink="/home">首页</a> <a routerLink="/news">新闻</a>
</h1>
<router-outlet></router-outlet>
```

### 10.2 routerLink 跳转页面 默认路由

页面里的跳转链接用 `routerLink` 而不是 `href`。用 `href` 会触发整页刷新，单页应用就白做了。

```html
 <a routerLink="/home">首页</a> 
 <a routerLink="/news">新闻</a>
```
 
兜底路由用两个星号表示，匹配所有没被前面命中的路径。你可以让它渲染一个 404 组件，也可以直接重定向回首页。

```js
//匹配不到路由的时候加载的组件 或者跳转的路由
{
    path: '**', /*任意的路由*/ 
    // component:HomeComponent 
    redirectTo:'home'
}
```

我个人偏好渲染一个 404 页面而不是静默跳回首页。用户手输错地址被弹回首页会一脸懵，给个明确提示体验好得多。

### 10.3 routerLinkActive 设置routerLink 默认选中路由

导航高亮不用自己写逻辑，`routerLinkActive` 会在当前路由匹配时自动给元素加上指定的 class。

```html
<h1>
<a routerLink="/home" routerLinkActive="active">首页</a> <a routerLink="/news" routerLinkActive="active">新闻</a>
</h1>
```

`routerLink` 也可以写成方括号绑定的数组形式，这在需要拼接动态片段的时候更好用。

```html
<h1>
<a [routerLink]="[ '/home' ]" routerLinkActive="active">首页</a> <a [routerLink]="[ '/news' ]" routerLinkActive="active">新闻</a>
</h1>
```

```css
 .active{
    color:red;
}
```

这里有个默认行为要留意。`routerLinkActive` 默认按前缀匹配，所以路径 `/news/detail` 也会让 `/news` 这个链接高亮。首页 `/` 更明显，它会一直亮着。要精确匹配得加上 `[routerLinkActiveOptions]="{exact: true}"`。

### 10.4 routerLink Get传递参数

query 参数适合传筛选条件、分页这类可选信息，特点是不影响路由匹配，刷新后还在。

**1. 跳转**

```html
  <li *ngFor="let item of list;let key=index;">
      <!-- <a href="/news-detail?aid=123">{{key}}--{{item}}</a> -->
       
      <a [routerLink]="['/news-detail']" [queryParams]="{aid:key}">{{key}}--{{item}}</a>

    </li>
```

**2. 接收参数**

```js
    import { ActivatedRoute } from '@angular/router';

    constructor(public route:ActivatedRoute) { }

   this.route.queryParams.subscribe((data)=>{
        console.log(data);
   })
```

注意 `queryParams` 是个 `Observable` 而不是普通对象，要订阅才能拿到值。为什么设计成流？因为同一个组件实例下参数可能会变，比如从 `?page=1` 跳到 `?page=2`，Angular 不会重建组件，只会往这个流里推一个新值。你要是只在 `ngOnInit` 里读一次快照，第二次翻页页面就不动了。这个我踩过，当时用的是 `snapshot.queryParams`，测试的时候直接输地址每次都对，一点分页按钮就失灵。

订阅了就记得退订，或者用 `async` 管道让模板帮你管，别忘了第七章讲的那件事。

### 10.5 动态路由

和 query 参数相对，动态路由参数是路径的一部分，适合表达资源标识，比如文章 id。SEO 上也更友好。

**1.配置动态路由**

```js
const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: 'news', component: NewsComponent},
  {path: 'newscontent/:id', component: NewscontentComponent},
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
} ];
```

**2. 跳转传值**

```html
<a [routerLink]="[ '/newscontent/',aid]">跳转到详情</a> 
<a routerLink="/newscontent/{{aid}}">跳转到详情</a>
```

**3. 获取动态路由的值**

```js
import { ActivatedRoute} from '@angular/router';

constructor( private route: ActivatedRoute) { }
 
ngOnInit() {
  console.log(this.route.params);
  this.route.params.subscribe(data=>this.id=data.id);
}
```

`params` 同样是流，理由和上面一样。还有个坑，从路由里取出来的参数永远是字符串，`/newscontent/32` 拿到的是 `'32'` 不是 `32`。拿它去和数字比较或者当数组下标用，就会出现「明明看着一样却不相等」。前面 3.7 节讲 `*ngSwitch` 时说的那个问题，根源也在这儿。

### 10.6 动态路由的 js 跳转

有些跳转不能靠点链接，比如提交表单成功后跳走、登录校验不通过踢回登录页。这时候注入 `Router` 用代码跳。

```js
// 引入
import { Router } from '@angular/router';

// 初始化

export class HomeComponent implements OnInit { 
    constructor(private router: Router) {}
    ngOnInit() {}
    goNews(){
    // this.router.navigate(['/news', hero.id]);
         this.router.navigate(['/news']);
      }
    }
```

```js
// 路由跳转
this.router.navigate(['/news', hero.id]);
```

`navigate` 接收的是一个片段数组，Angular 会帮你拼成路径并做编码。别自己拼字符串塞进去，参数里有斜杠或者中文就出问题了。

### 10.7 路由 get 传值 js 跳转

代码跳转要带 query 参数或者锚点，用 `NavigationExtras` 配置。

**1. 引入 NavigationExtras**

```js
import { Router ,NavigationExtras} from '@angular/router';
```

**2. 定义一个 goNewsContent 方法执行跳转，用 NavigationExtras 配置传参。**

```js
goNewsContent() {
    let navigationExtras: NavigationExtras = {
        queryParams: {
            'session_id': '123'
        },
        fragment: 'anchor'
    };
    this.router.navigate(['/news'], navigationExtras);
}
```

**3. 获取 get 传值**

```js
 constructor(private route: ActivatedRoute) {
     console.log(this.route.queryParams);
}
```

### 10.8 父子路由

页面里有二级导航的时候就要用父子路由，典型场景是后台管理系统的左侧菜单加右侧内容区。

**1. 创建组件引入组件**

```js
import { NewsaddComponent } from './components/newsadd/newsadd.component';
import { NewslistComponent } from './components/newslist/newslist.component';
```

**2. 配置路由**

```js
{
    path: 'news',
    component: NewsComponent,
    children: [{
        path: 'newslist',
        component: NewslistComponent
    },
    {
        path: 'newsadd',
        component: NewsaddComponent
    }]
}
```

**3. 父组件中定义 router-outlet**

```html
 <router-outlet></router-outlet>
```

关键在这一步，`NewsComponent` 自己的模板里也得放一个 `<router-outlet>`，子路由才有地方渲染。很多人配了 `children` 但页面一片空白，原因就是漏了这个。父组件的 outlet 和根组件的 outlet 是两个不同的坑位，各管各的层级。

子路由的路径是相对父路径的，所以上面这套配置对应的完整地址是 `/news/newslist` 和 `/news/newsadd`。子模板里写 `routerLink` 也要注意，`routerLink="newslist"` 是相对的，`routerLink="/newslist"` 带斜杠就变成绝对路径了，跳到根去了。

路由这块还有两块内容这篇没展开，一是路由守卫 `CanActivate`，做登录拦截和权限控制用的；二是懒加载，按模块拆包，首屏只加载用得到的那部分。这两块在真实项目里几乎必用，感兴趣可以顺着官方文档往下看。补一句演进，懒加载的写法后来从 `loadChildren` 的字符串形式换成了动态 `import()`，守卫也从基于类改成了可以用函数式写法，具体以官方文档为准。

## 十一、更多参考

- [Angular中文文档](https://www.angular.cn/guide/quickstart)

## 总结

这篇从环境搭建一路走到了父子路由，回头看，Angular 真正需要你转变思维的地方其实就三处。

第一处是模块和依赖注入。写组件之前先想清楚它属于哪个模块、依赖哪些服务，这套约束前期觉得繁琐，项目上到几十个页面之后你会感谢它。第二处是生命周期。搞清楚 `ngOnInit` 和 `ngAfterViewInit` 的分工，能省掉一大半「拿不到数据」「元素是 null」的排查时间。第三处是 RxJS。路由参数、HTTP 响应、表单值变化全是流，硬把它们转成 `Promise` 用是能跑，但等你需要防抖、取消、组合的时候就会发现绕了远路。

至于文中这些具体的 API 写法，Angular 后面几个大版本改动不小，standalone 组件、signals、新的模板控制流都在往「更少样板代码」的方向走。但模块化、依赖注入、单向数据流加事件回传这套骨架没变，这也是我把老写法原样留在文里的原因，看懂了老代码，迁移新写法只是换语法的事。

## 参考

- [Angular 中文文档](https://www.angular.cn/guide/quickstart)
- [Angular 文件结构说明](https://www.angular.cn/guide/file-structure)
- [Angular 生命周期钩子](https://www.angular.cn/guide/lifecycle-hooks)
- [Angular CLI 官网](https://cli.angular.io)
- [RxJS 中文文档](https://cn.rx.js.org/)
- [RxJS npm 包主页](https://www.npmjs.com/package/rxjs)
- [Ionic 3 项目实践总结](https://feinterview.poetries.top/blog/ionic3-summary)
- [前端进阶之旅](https://interview.poetries.top)
