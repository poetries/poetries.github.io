---
title: Angular7入门总结篇
date: 2019-01-09 16:55:24
tags: 
 - JavaScript
 - Angular
categories: Front-End
---


> 最近在学`Ionic4`，不得不学习`angular`、`Typescript`基础知识，这里简单总结记录一下。

# 一、Angular 介绍

> `Angualr` 是一款来自谷歌的开源的 `web` 前端框架，诞生于 `2009` 年，由 `Misko Hevery` 等 人创建，后为 `Google` 所收购。是一款优秀的前端 `JS` 框架，已经被用于 `Google` 的多款产品当中。

- 根据项目数统计 `angular(1.x 、2.x 、4.x、5.x、6.x、7.x)`是现在网上使用量最大的框架
- `Angualr` 基于 `TypeScript` 和 `react`、`vue` 相比, `Angular` 更适合中大型企业级项目。

> 目前 2018 年 11 月 25 日 `angular` 最新版本 `angular7.x`。根据官方介绍，`Angular` 每过几个月 就会更新一个版本。此教程同样适用于后期更新的 `Angular8.x`、`Angular9.x` 

![](https://poetries1.gitee.io/img-repo/20191001/17.png)


**学习 Angular 必备基础**

> 必备基础:`html` 、`css` 、`js`、`es6`、`Typescript`

# 二、Angular 环境搭建及创建项目

## 2.1 环境搭建

**1. 安装 nodejs**

> 安装 `angular` 的计算机上面必须安装最新的 `nodejs`--注意安装 `nodejs` 稳定版本

**2. 安装 cnpm**

> npm 可能安装失败建议先用 `npm` 安装一下 `cnpm` 用淘宝镜像安装`https://npm.taobao.org`

```bash
npm install -g cnpm --registry=https://registry.npm.taobao.org
```

**3. 使用 npm/cnpm 命令安装 angular/cli**

```bash
npm install -g @angular/cli 

# 或者 
cnpm install -g @angular/cli
```
> `ng v` 查看版本信息 

![](https://poetries1.gitee.io/img-repo/20191001/18.png)


**4. 安装插件**

![](https://poetries1.gitee.io/img-repo/20191001/19.png)


**5. 安装chrome扩展**

> https://augury.angular.io/

>  用`augury`查看`component`结构，更方便调试

![](https://poetries1.gitee.io/img-repo/20191001/20.png)

## 2.2 创建项目

```bash
# 创建项目
ng new my-app

cd my-app

# 运行项目
ng serve --open
```

## 2.3 目录结构分析

![](https://poetries1.gitee.io/img-repo/20191001/21.png)

> 详情参考 https://www.angular.cn/guide/file-structure

**app目录（重点）**

> `app`目录是我们要编写的代码目录。我们写的代码都是放在这个目录。 
一个`Angular`程序至少需要一个模块和一个组件。在我们新建项目的时候命令行已经默认生成出来了

![](https://poetries1.gitee.io/img-repo/20191001/22.png)

- `app.component.ts`：这个文件表示组件， 
- 组件是`Angular`应用的基本构建模块，可以理解为一段带有业务逻辑和数据的`Html` 
我们来看看`app.component.ts`中的代码，并解释下代码的意义

![](https://poetries1.gitee.io/img-repo/20191001/23.png)

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

1. 组件元数据装饰器（`@Component`） 
简称组件装饰器，用来告知`Angular`框架如何处理一个`TypeScript`类. 
`Component`装饰器包含多个属性，这些属性的值叫做元数据，`Angular`会根据这些元数据的值来渲染组件并执行组件的逻辑
2. 模板（`Template`） 
我们可以通过组件自带的模板来定义组件的外观，模板以`html`的形式存在，告诉`Angular`如何来渲染组件，一般来说，模板看起来很像`html`，但是我们可以在模板中使用`Angular`的数据绑定语法，来呈现控制器中的数据。
3. 控制器（`controller`） 
控制器就是一个普通的`typescript`类，他会被`@Component`来装饰，控制器会包含组件所有的属性和方法，绝大多数的业务逻辑都是写在控制器里的。控制器通过数据绑定与模板来通讯，模板展现控制器的数据，控制器处理模板上发生的事件。

**装饰器**，模板和控制器是组件的必备要素。还有一些可选的元素，比如：

- 输入属性（`@inputs`）:是用来接收外部传入的数据的,`Angular`的程序结构就是一个组件树，输入属性允许在组件树种传递数据 
提供器（`providers`）：这个是用来做依赖注入的 
- 生命周期钩子（`LifeCycle Hooks`）：一个组件从创建到销毁的过程中会有多个钩子会被触发，类似于Android中的`Activity`的生命周期 
- 样式表：组件可以关联一些样式表 
- 动画（`Animations`）： `Angular`提供了一个动画包来帮助我们方便的创建一些跟组件相关的动画效果，比如淡入淡出等 
- 输出属性（`@Outputs`）：用来定义一些其他组件可能需要的事件或者用来在组件之间共享数据

> 组件的中关系就如下图所示

![](https://poetries1.gitee.io/img-repo/20191001/24.png)

下面我们来看看模块文件 

- `app.module.ts`：这个文件表示模块
- 与`AppComponent`类似，模块也需要装饰器来装饰


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

## 2.4 Angular cli

> https://cli.angular.io

> 通过`ng g`列出当前命令

![](https://poetries1.gitee.io/img-repo/20191001/25.png)

**1. 创建新组件 `ng generate component component-name`**

> `ng g component components/header` 指定生成到哪个目录

该命令会把生成的组件，添加到 `src/app/app.module.ts` 文件中 `@NgModule` 的 `declarations` 列表中声明

![](https://poetries1.gitee.io/img-repo/20191001/26.png)

**2. 使用 Angular CLI 创建一个名叫 hero 的服务**

```
ng generate service hero
```

> 该命令会在 `src/app/hero.service.ts` 中生成 `HeroService` 类的骨架。 `HeroService` 类的代码如下：

```js
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HeroService {

  constructor() { }

}
```

**3. 添加 AppRoutingModule**

```js
ng generate module app-routing --flat --module=app
```

- `--flat` 把这个文件放进了 `src/app` 中，而不是单独的目录中。
- `--module=app` 告诉 `CLI` 把它注册到 `AppModule`的 `imports` 数组中。

生成的文件是这样的：

```js
src/app/app-routing.module.ts (generated)
content_copy
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

修改后

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


# 三、angular组件及组件里的模板

## 3.1 创建angualr组件

**1. 创建组件**

```bash
ng g component components/header
```

**2. 使用组件**

```html
<app-header></app-header>
```

## 3.2 Angular 绑定数据

**1. 数据文本绑定**

> 定义数据几种方式

![](https://poetries1.gitee.io/img-repo/20191001/27.png)


```html
<h1>{{title}}</h1>
```


**2. 绑定`HTML`**



```js
 this.h="<h2>这是一个 h2 用[innerHTML]来解析</h2>"
 ```
 
 ```html
  <div [innerHTML]="h"></div>
 ```

## 3.3 声明属性的几种方式  

- `public` 共有（默认） 可以在类里外使用
- `protected` 保护类型 只能在当前类和子类中使用
- `private` 私有类型 只能在当期类使用



## 3.4 绑定属性

> 用`[]`包裹
 
 ```html
  <div [id]="id" [title]="msg">调试工具看看我的属性</div>
 ```
 
 ![](https://poetries1.gitee.io/img-repo/20191001/28.png)

## 3.5 数据循环 *ngFor

**1. *ngFor 普通循环**

```js
export class HomeComponent implements OnInit {

  arr = [{ name: 'poetries', age: 22 }, { name: 'jing' , age: 31}];
  constructor() { }

  ngOnInit() {
  }

}
```
```html
<ul *ngIf="arr.length>0">
      <li *ngFor="let item of arr">{{item.name}}- {{item.age}}</li>
</ul>
```

**2. 循环的时候设置 key**

```html
<ul>
<li *ngFor="let item of list;let i = index;"> <!-- 把索引index赋给i -->
     {{item}} --{{i}}
</li> </ul>
```

**3. template 循环数据**

```html
<ul>
  <li template="ngFor let item of list">
{{item}}
</li> </ul>
```

## 3.6 条件判断 *ngIf

```html
<p *ngIf="list.length > 3">这是 ngIF 判断是否显示</p>

<p template="ngIf list.length > 3">这是 ngIF 判断是否显示</p>
```

## 3.7 *ngSwitch

```html
<ul [ngSwitch]="score">
<li *ngSwitchCase="1">已支付</li>
<li *ngSwitchCase="2">订单已经确认</li> <li *ngSwitchCase="3">已发货</li>
<li *ngSwitchDefault>无效</li>
</ul>
```


## 3.8 执行事件 (click)=”getData()”

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

## 3.9 表单事件

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

## 3.10 双向数据绑定

```html
<input [(ngModel)]="inputVal">
```

> 注意引入:`FormsModule`

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

## 3. 11 [ngClass]、[ngStyle]

**1. [ngClass]:**

```html
<div [ngClass]="{'red': true, 'blue': false}"> 
    这是一个 div
</div>
```

```js
public flag=false;
```

```html
<div [ngClass]="{'red': flag, 'blue': !flag}">
这是一个 div </div>
```

```js
public arr = [1, 3, 4, 5, 6];
```

```html
<ul>
<li *ngFor="let item of arr, let i = index"> <span [ngClass]="{'red': i==0}">{{item}}</span>
</li> </ul>
```

**2. [ngStyle]:**

```html
<div [ngStyle]="{'background-color':'green'}">你好 ngStyle</div>
```

```js
public attr='red';
```


```html
<div [ngStyle]="{'background-color':attr}">你好 ngStyle</div>
```

## 3.12 管道

```js
 public today=new Date();
```

```html
 <p>{{today | date:'yyyy-MM-dd HH:mm:ss' }}</p>
```

**其他管道**

> `angular`中的管道(`pipe`)是用来对输入的数据进行处理，如大小写转换、数值和日期格式化等

> `angular`中的管道(`pipe`) 以及自定义管道适用于`angular4 angualr5 angualr6 angular7`

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

> 接收的参数格式为`{最少整数位数}.{最少小数位数}-{最多小数位数}`

```html
<!--保留2~4位小数-->

<p>{{p | number:'1.2-4'}}</p> 
```

**4. JavaScript 对象序列化**

```html
<p>
    {{ { name: 'semlinker' } | json }}
</p> 
<!-- Output: { "name": "semlinker" } -->
```

**5. slice**

```html
<p>{{ 'semlinker' | slice:0:3 }}</p> 
<!-- Output: sem -->
```

**6. 管道链**

```html
<p>
{{ 'semlinker' | slice:0:3 | uppercase }}
</p> 

<!-- Output: SEM -->
```

**7. 自定义管道**

自定义管道的步骤：

- 使用 `@Pipe` 装饰器定义 `Pipe` 的 `metadata` 信息，如 `Pipe` 的名称 - 即 `name` 属性
- 实现 `PipeTransform` 接口中定义的 `transform` 方法

**7.1 WelcomePipe 定义**

```js
import { Pipe, PipeTransform } from '@angular/core';

[@Pipe](/user/Pipe)({ name: 'welcome' })

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

```html
<div>
   <p ngNonBindable>{{ 'semlinker' | welcome }}</p>
   <p>{{ 'semlinker' | welcome }}</p> <!-- Output: Welcome to semlinker -->
</div>
```

**7.3 RepeatPipe 定义**

```js
import {Pipe, PipeTransform} from '@angular/core';

[@Pipe](/user/Pipe)({name: 'repeat'})
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


## 3.13 实现一个人员登记表单-案例

 ![](https://poetries1.gitee.io/img-repo/20191001/29.png)


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

```html
<h2>人员登记系统</h2>

<div class="people_list">
  <ul>
    <li>姓 名：<input type="text" id="username" [(ngModel)]="peopleInfo.username" value="fonm_input" /></li>
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

## 3.14 实现一个完整的ToDo-案例

 ![](https://poetries1.gitee.io/img-repo/20191001/30.png)

**基础版**

```bash
# 创建组件
ng g component components/todo
```

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

## 3.15 搜索缓存数据-案例

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

# 四、Angular 中的服务

## 4.1 服务

> 定义公共的方法，使得方法在组件之间共享调用

 ![](https://poetries1.gitee.io/img-repo/20191001/31.png)

**1. 创建服务命令**

```bash
ng g service my-new-service

# 创建到指定目录下面
ng g service services/storage
```

**2. app.module.ts 里面引入创建的服务**

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

```js
 constructor(private storage: StorageService) {
 
 }
```

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

## 4.2 改造上面的Todo、searchList

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

# 五、Dom 操作以及@ViewChild、 执行 css3 动画

**1. Angular 中的 dom 操作(原生 js)**

```js
ngAfterViewInit(){
var boxDom:any=document.getElementById('box'); boxDom.style.color='red';
}
```

**2. Angular 中的 dom 操作(ViewChild)**

```js
 import { Component ,ViewChild,ElementRef} from '@angular/core';
```

```js
 @ViewChild('myattr') myattr: ElementRef;
```

```html
<div #myattr></div>
```

```js
ngAfterViewInit(){
let attrEl = this.myattr.nativeElement;
}
```

 ![](https://poetries1.gitee.io/img-repo/20191001/32.png)

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

# 六、Angular 父子组件以及组件之间通讯

 ![](https://poetries1.gitee.io/img-repo/20191001/33.png)


## 6.1 父组件给子组件传值-@input

> 父组件不仅可以给子组件传递简单的数据，还可把自己的方法以及整个父组件传给子组件

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

> 通过`this`传递整个组件实例

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

> 执行父组件方法 `this.home.xxx()`

## 6.2 子组件通过@Output 触发父组件的方法（了解）

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

## 6.3 父组件通过@ViewChild 主动获取子组 件的数据和方法

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

## 6.4 非父子组件通讯

- 公共的服务 
- `Localstorage` (推荐) 
- `Cookie`

# 七、Angular 中的生命周期函数

## 7.1 Angular中的生命周期函数

> 官方文档:https://www.angular.cn/guide/lifecycle-hooks

- 生命周期函数通俗的讲就是组件创建、组件更新、组件销毁的时候会触发的一系列的方法。
- 当 `Angular` 使用构造函数新建一个组件或指令后，就会按下面的顺序在特定时刻调用这些 生命周期钩子方法。
- 每个接口都有唯一的一个钩子方法，它们的名字是由接口名再加上`ng`前缀构成的，比如`OnInit`接口的钩子方法叫做`ngOnInit`.

**1. 生命周期钩子分类**

> 基于指令与组件的区别来分类

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

 ![](https://poetries1.gitee.io/img-repo/20191001/34.png)

**2. 生命周期钩子的作用及调用顺序**

1、`ngOnChanges` - 当数据绑定输入属性的值发生变化时调用
2、`ngOnInit` - 在第一次 `ngOnChanges` 后调用
3、`ngDoCheck` - 自定义的方法，用于检测和处理值的改变
4、`ngAfterContentInit` - 在组件内容初始化之后调用
5、`ngAfterContentChecked` - 组件每次检查内容时调用
6、`ngAfterViewInit` - 组件相应的视图初始化之后调用
7、`ngAfterViewChecked` - 组件每次检查视图时调用
8、`ngOnDestroy` - 指令销毁前调用

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

![生命周期调用顺序](https://upload-images.jianshu.io/upload_images/1480597-7e0081f4616fe461.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> 带`check`的可以对数据做响应操作

```html
<button (click)="changeMsg()">数据改变了</button>
<input type='text' [(ngModel)]="userInfo" />
```

> 点击按钮/双向数据绑定此时触发了以下生命周期。只要数据改变

 ![](https://poetries1.gitee.io/img-repo/20191001/35.png)


> 可以在`check`做一些操作

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



## 7.2 生命周期钩子详解

### 7.2.1 constructor-掌握

> `constructor`，来初始化类。`Angular`中的组件就是基于`class`类实现的，在`Angular`中，`constructor`用于注入依赖。组件的构造函数会在所有的生命周期钩子之前被调用，它主要用于依赖注入或执行简单的数据初始化操作。

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

### 7.2.2  ngOnChanges()

> 当 `Angular`(重新)设置数据绑定输入属性时响应。该 方法接受当前和上一属性值的 `SimpleChanges` 对象 当被绑定的输入属性的值发生变化时调用，首次调用一 定会发生在 `ngOnInit() `之前。

```html
<!-- 父组件中 传递title属性给header子组件 -->
<app-header [title]="title"></app-header>
```

> 此时改变`title`会触发`ngOnChanges`生命周期，并且也会触发

 ![](https://poetries1.gitee.io/img-repo/20191001/36.png)


### 7.2.3 ngOnInit()--掌握

> 在 `Angular` 第一次显示数据绑定和设置指令/组件的输入属性之后，初始化指令/组件。在第一轮 `ngOnChanges()` 完成之后调用，只调用一次。可以请求数据

- **使用 ngOnInit() 有两个原因**: 
  - 在构造函数之后马上执行复杂的初始化逻辑
  - 在 `Angular` 设置完输入属性之后，对该组件进行准备。有经验的开发者会认同组件的构建应该很便宜和安全
  
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

### 7.2.4 ngDoCheck()

> 检测，并在发生 `Angular` 无法或不愿意自己检测的变 化时作出反应。在每个 `Angular` 变更检测周期中调用， `ngOnChanges()` 和 `ngOnInit() `之后。

### 7.2.5 ngAfterContentInit()

> 当把内容投影进组件之后调用。第一次 `ngDoCheck()` 之后调用，只调用一次

### 7.2.6 ngAfterContentChecked()

> 每次完成被投影组件内容的变更检测之后调用。 `ngAfterContentInit()` 和每次 `ngDoCheck()` 之后调

### 7.2.7 ngAfterViewInit()--掌握

> 初始化完组件视图及其子视图之后调用。第一 次 `ngAfterContentChecked()` 之后调用，只调用一次。在这里可以操作`DOM`

### 7.2.8 ngAfterViewChecked()

> 每次做完组件视图和子视图的变更检测之后调用。 `ngAfterViewInit()`和每次 `ngAfterContentChecked()` 之后 调用。

### 7.2.9 ngOnDestroy()--掌握

> 当 `Angular` 每次销毁指令/组件之前调用并清扫。在这儿反订阅可观察对象和分离事件处理器，以防内存泄 漏。在 `Angular` 销毁指令/组件之前调用。比如：移除事件监听、清除定时器、退订 `Observable` 等。

```js
@Directive({
    selector: '[destroyDirective]'
})
export class OnDestroyDirective implements OnDestroy {
  sayHello: number;
  
  constructor() {
    this.sayHiya = window.setInterval(() => console.log('hello'), 1000);
  }
  
  ngOnDestroy() {
     window.clearInterval(this.sayHiya);
  }
}
```

# 八、Rxjs 异步数据流编程

## 8.1 Rxjs介绍

> - 参考手册:https://www.npmjs.com/package/rxjs
> - 中文手册:https://cn.rx.js.org/

> `RxJS` 是 `ReactiveX` 编程理念的 `JavaScript` 版本。`ReactiveX` 来自微软，它是一种针对异步数据 流的编程。简单来说，它将一切数据，包括 `HTTP` 请求，`DOM` 事件或者普通数据等包装成流的形式，然后用强大丰富的操作符对流进行处理，使你能以同步编程的方式处理异步数据，并组合不同的操作符来轻松优雅的实现你所需要的功能。

- `RxJS` 是一种针对异步数据流编程工具，或者叫响应式扩展编程;可不管如何解释 RxJS 其目 标就是异步编程，`Angular` 引入 `RxJS` 为了就是让异步可控、更简单。
- `RxJS` 里面提供了很多模块。这里我们主要给大家讲 `RxJS` 里面最常用的` Observable` 和 f`romEvent`

**目前常见的异步编程的几种方法:**

- 回调函数 
- 事件监听/发布订阅 
- `Promise`
- `Rxjs`

## 8.2 Promise和RxJS处理异步对比

> 新建一个`services`

```bash
ng g service services/rxjs
```

> 在`services/rxjs.service.ts`中写以下方法

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
    return new Promise(resolve = >{
    setTimeout(() = >{
        resolve('---promise timeout---');
    },
    2000);
  });

// RxJS 处理异步:
getRxjsData() {
   return new Observable(observer = >{
      setTimeout(() = >{
        observer.next('observable timeout');
      },
      2000);
  }); 
}

}
```

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


- 从上面列子可以看到 `RxJS` 和 `Promise`的基本用法非常类似，除了一些关键词不同。`Promise` 里面用的是 `then()` 和 `resolve()`，而 `RxJS `里面用的是 `next()` 和 `subscribe()`
- `Rxjs`相比`Promise `要强大很多。 比如 `Rxjs` 中可以中途撤回、`Rxjs` 可以发射多个值、`Rxjs` 提供了多种工具函数等等


## 8.3 Rxjs unsubscribe 取消订阅

> `Promise` 的创建之后，动作是无法撤回的。`Observable` 不一样，动作可以通过 `unsbscribe()` 方法中途撤回，而且 `Observable` 在内部做了智能的处理.

**Promise 创建之后动作无法撤回**

```js
let promise = new Promise(resolve = >{
    setTimeout(() = >{
        resolve('---promise timeout---');
    },
    2000);
});
promise.then(value = >console.log(value));
```

**Rxjs 可以通过 unsubscribe() 可以撤回 subscribe 的动作**

```js
let stream = new Observable(observer = >{
    let timeout = setTimeout(() = >{
        clearTimeout(timeout);
        observer.next('observable timeout');
    },
    2000);
});
let disposable = stream.subscribe(value = >console.log(value));
setTimeout(() = >{
    //取消执行 disposable.unsubscribe();
},
1000);
```

## 8.4 Rxjs 订阅后多次执行

- 如果我们想让异步里面的方法多次执行，比如下面代码。

> 这一点 `Promise `是做不到的，对于 `Promise `来说，最终结果要么 `resole`(兑现)、要么 `reject` (拒绝)，而且都只能触发一次。如果在同一个 `Promise` 对象上多次调用 `resolve` 方法， 则会抛异常。而 `Observable`不一样，它可以不断地触发下一个值，就像 `next() `这个方法的 名字所暗示的那样。

```js
let promise = new Promise(resolve = >{
    setInterval(() = >{
        resolve('---promise setInterval---');
    },
    2000);
});
promise.then(value = >console.log(value));
```

**Rxjs**

```js
let stream = new Observable < number > (observer = >{
    let count = 0;
    setInterval(() = >{
        observer.next(count++);
    },
    1000);
});
stream.subscribe(value = >console.log("Observable>" + value));
```

## 8.5 Angualr6.x之前使用Rxjs的工具函数 map filter

> 注意:`Angular6` 以后使用以前的`rxjs` 方法，必须安装 `rxjs-compat` 模块才可以使用 `map`、`filter` 方法。

> `angular6` 后官方使用的是 `RXJS6`的新特性，所以官方给出了一个可以暂时延缓我们不需要修 改 `rsjx` 代码的办法

```bash
npm install rxjs-compat
```

```js
import {Observable} from 'rxjs'; import 'rxjs/Rx';
```

```js
let stream = new Observable < any > (observer = >{
    let count = 0;
    setInterval(() = >{
        observer.next(count++);
    },
    1000);
});
stream.filter(val = >val % 2 == 0).subscribe(value = >console.log("filter>" + value));
stream.map(value = >{
    return value * value
}).subscribe(value = >console.log("map>" + value));
```


## 8.6 Angualr6.x 以后 Rxjs6.x 的变化以及 使用

### 8.6.1 Rxjs 的变化参考

> 从`Angular5`升级到`Angular6`， `angular6`相比较于`angular5`总体变化不大，但是在`RXJS`上面却有一些变动，下面给大家讲讲关于`Angular6`版本升级和`RXJS6`新特性的讲解

**1. angular6 Angular7中使用以前的rxjs**

> 对于写了半年多的项目，模块已经很多了，所以不可能在升级到`angular6`后马上更新所有代码关于`RXJS6`的新特性，所以官方给出了一个可以暂时延缓我们不需要修改`rsjx`代码的办法。

```js
npm install --save rxjs-compat
```

- **优点**： 暂时不用改代码，可以一点点地改，直到改完后吧这个包卸掉
- **缺点**： 对于`rxjs6`的`rename`的`operator`无效，所以，如果有用到`rename`的`API`，必须手动修改

**2. Angular6 以后 RXJS6的变化**

> `RXJS6`改变了包的结构，主要变化在 `import`方式和`operator `上面以及使用`pipe()`

**2.1 Imports 方式改变**

 ![](https://poetries1.gitee.io/img-repo/20191001/37.png)


> 从`rxjs`中类似像导入`observable` `subject` 等的不再进一步导入，而是止于`rxjs`, `rxjs6`在包的结构上进行了改变

**2.2 operator的改变**

 ![](https://poetries1.gitee.io/img-repo/20191001/38.png)

> 总而言之： 类似于创建之类的用的`API`都是从`rxjs`引入的，类似于`map` 之类的操作都是从`rxjs/operators`引入的

 ![](https://poetries1.gitee.io/img-repo/20191001/39.png)

**2.3 pipeable observable**

 ![](https://poetries1.gitee.io/img-repo/20191001/40.png)

**2.4 被重新命名的API**

 ![](https://poetries1.gitee.io/img-repo/20191001/41.png)

> `RXJS6` 改变了包的结构，主要变化在 `import` 方式和 `operator` 上面以及使用 `pipe()`

```js
import {Observable} from 'rxjs';
import {map,filter} from 'rxjs/operators';
```

```js
let stream= new Observable<any>(observer => {
    let count = 0;
    setInterval(() = >{
        observer.next(count++);
    },
    1000);
});

stream.pipe(filter(val = >val % 2 == 0))
.subscribe(value = >console.log("filter>" + value));

stream
.pipe(
    filter(val = >val % 2 == 0), 
    map(value = >{
        return value * value
}))
.subscribe(value = >console.log("map>" + value));
```

## 8.7 Rxjs 延迟执行

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
.subscribe(() = >console.log(`Clicked`));
```

# 九、Angular 中的数据交互(get jsonp post)

## 9.1 Angular get 请求数据

> `Angular5.x` 以后 `get`、`post` 和和服务器交互使用的是 `HttpClientModule` 模块。


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

## 9.2 Angular post 提交数据

> `Angular5.x` 以后 `get`、`post` 和和服务器交互使用的是` HttpClientModule` 模块。

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

> 用`express`搭建一个`server`

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
httpOptions).subscribe(response = >{
    console.log(response);
});
}
```

## 9.3 Angular Jsonp 请求数据

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

**3. 在用到的地方引入 HttpClient 并在构造函数声明**

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

## 9.4 Angular 中使用第三方模块 axios 请求数据

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

# 十、Angular 中的路由

## 10.1 Angular 创建一个默认带路由的项目

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



**4. 找到 app.component.html 根组件模板，配置 router-outlet 显示动态加载的路由**

```html
<h1>
<a routerLink="/home">首页</a> <a routerLink="/news">新闻</a>
</h1>
<router-outlet></router-outlet>
```

## 10.2 routerLink 跳转页面 默认路由


```html
 <a routerLink="/home">首页</a> 
 <a routerLink="/news">新闻</a>
 ```
 
 ```js
//匹配不到路由的时候加载的组件 或者跳转的路由
{
    path: '**', /*任意的路由*/ 
    // component:HomeComponent 
    redirectTo:'home'
}
```

## 10.3 routerLinkActive 设置routerLink 默认选中路由

```html
<h1>
<a routerLink="/home" routerLinkActive="active">首页</a> <a routerLink="/news" routerLinkActive="active">新闻</a>
</h1>
```

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

## 10.4 routerLink Get传递参数

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


## 10.5 动态路由

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

## 10.6 动态路由的 js 跳转

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

## 10.7 路由 get 传值 js 跳转

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

## 10.8 父子路由

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
 
# 十一、更多参考

- [Angular中文文档](https://www.angular.cn/guide/quickstart)
