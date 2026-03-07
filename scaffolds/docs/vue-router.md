---
title: vue路由（十一）
date: 2018-08-28 15:30:32
tags: Vue
categories: Front-End
---

## 一、路由基础介绍

### 1.1 什么是前端路由

- 路由是根据不同的`url`地址展示不同的内容或页面
- 前端路由就是把不同的路由对应不同的内容或页面的任务交给前端来做，之前是通过服务端根据`url`的不同返回不同的页面实现的
  
### 1.2 什么时候使用前端路由

- 在单页面应用，大部分结构不变，只改变内容的使用
  

### 1.3 前端路由优点、缺点

- **优点**：
  - 用户体验好，不需要每次都从服务器全部获取，快速展现给用户
- **缺点**：
  - 不利于`SEO`
  - 使用浏览器的前进，后退键的时候会重新发送请求，没有合理的利用缓存
  - 单页面无法记住之前滚动的位置，无法再前进，后退的时候记住滚动的位置
     

## 二、vue-router用来构建SPA


### 2.1 开始

> 在你的文件夹下的 `src` 文件夹下的 `main.js` 文件内写入以下代码

```javascript
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)
```


> - `vue-router`其实就是对`history`的封装
> - 地址后面跟`#`其实就是用了`hash`

```html
<div id="box"> 

</div>
<!--定义模版-->
<template id="a">
    <div>
        第一个router
    </div>
</template>
<template id="b">
    <div>
        第二个router
    </div>
</template>
```

```javascript
var routes = [
    {
        path:"/one",

        component:{template:"#a"}
    },
    {
        path:"/two",
        component:{template:"#b"}
    },
];
// 定义路由组件
var router = new VueRouter({
    routes
});
// 定义路由
new Vue({
    el:"#box",
    router
});
// 创建和挂载实例
```

```html
<div id="box"> 
    <router-link to="/one">One</router-link>
    <router-link to="/two">Two</router-link>
    <router-view></router-view>
</div>
```

- `< router-link >` 默认会被渲染成一个 `<a>` 标签 `to=""`为我们定义的路由
- `< router-view >` 路由匹配到的组件将渲染在这里


- 在`new Router`中指定`mode`为`history`即可去掉`#`，这样加载更加逼真符合预期

```javascript
new Router({
    mode: "history",
    routes: []
})
```

```javascript
//router-link跳转标签 当a标签使用，to必须是一个绝对地址
<router-link to="/goods/title"></router-link>

//或者
this.$router.push({path:""})

// 组件的渲染 配合router—link使用
<router-view></router-view>
```

### 2.2 动态路由匹配

> 通过变化的地址去加载信息

|模式|匹配路径|`$route.params`|
|---|---|---|
|`/user/:username`|`/user/poetries`|`{username:"poetries"}`|
|`/user/:username/post/:post_id`|`/user/poetries/post/123`|`{username:"evan",post_id:123}`|

- 应用场景
  - 商城的详情页，要变换商品的`id`，根据商品的`id`去查对应商品的信息


### 2.3 嵌套路由

- 什么是嵌套路由
  - 路由嵌套路由
  

```javascript
new Router({
    mode: "history",
    routes: [
        {
            path:"/goods", 
            name: "GoodsList",
            component:GoodsList,
            children: [ // 定义子组件
               {
                   path:"title",//最后形式/goods/title
                   name:"title",
                   component:Title
               }
            ]
        }
    ]
})
```


### 2.4 编程式路由

> 通过js来实现页面的跳转

- 通过`push`名字就可以实现页面的跳转

```javascript
// 方式一
this.$router.push("name") //name /cart

// 方式二 
this.$router.push({path:"name"})

// 方式三 传递参数
this.$router.push({path:"name?a=123"})

// 或者
this.$router.push({path:"name",query:{a:123}})

// 方式四 
this.$router.go(1) //$router其实就是对history的封装
```

- 如何拿到传递过来的参数

```javascript
this.$router.push("/cart?goodsId=123")
```
```html
<!--如何在页面上拿到goodsId-->

<span>{{$.route.query.goodsId}}</span>

```

- `$route.params`是组件跟组件之间路由切换的时候，参数传递



### 2.5 命名路由

> 有时我们通过一个名称来标识一个路由显得更方便一些，特别是在链接一个路由，或者是执行一些跳转的时候。你可以在创建 `Router` 实例的时候，在 `routes` 配置中给某个路由设置名称

> - 给路由定义不同的名字，根据名字进行匹配
> - 给不同的`router-view`定义名字，通过名字进行对应组件渲染



```javascript
new Router({
    mode: "history",
    routes: [
        {
            path:"/cart/:cartId", 
            name: "cart",
            component:GoodsList,
        }
    ]
})
```

- 之前的跳转方式

```html
<router-link to="/cart"></router-link>
```

- 根据路由名字跳转。以下是一个命名的路由，而且还带了参数

```html
<router-link v-bind:to="{{name:'cart',params:{cartId:123}}}"></router-link>
<!--params是路由的参数，并不是页面之间跳转的参数-->
```

### 2.6 命名视图

> 有时候想同时（同级）展示多个视图，而不是嵌套展示，例如创建一个布局，有 `·sidebar·`（侧导航） 和` main`（主内容） 两个视图，这个时候命名视图就派上用场了。你可以在界面中拥有多个单独命名的视图，而不是只有一个单独的出口。如果 `router-view` 没有设置名字，那么默认为 `default`

- 实现一个命名的视图（很少用到）
  - 给`router-view`加`name`值
  
```html
<router-view></router-view>

<router-view name="title"></router-view>

<router-view name="image"></router-view>
```

- 页面一进来就加载三个`router-view`。实现方法

```javascript
new Router({
    mode: "history",
    routes: [
        {
            path:"/", 
            name: "cart",
            // 根据不同的name值去加载对应的router-view,映射到对应的组件
            components:{
                default:GoodsList,
                title:Title,
                img:Image
            },
            path:"/cart/:cartId", 
            name: "cart",
            component:Cart
        }
    ]
})
```

```html
<router-view></router-view>
<router-view></router-view>
```

> 当我们的视图如上时,我们会发现每一个路由被渲染了两次,所以我们需要为视图命名

```html
<router-view name="a"></router-view>
<router-view name="b"></router-view>
```    

```javascript
var Foo = { template: '<div>foo</div>' }
var Bar = { template: '<div>bar</div>' }
var routes = [
        {
            path:"/one",
            name:"one",
            components:{
                a:Foo,
                b:Bar
            }
        },
    ]
```

### 2.7 重定向和别名

**重定向**

> 重定向(`Redirect`)就是通过各种方法将各种网络请求重新定个方向转到其它位置,用于网站调整或网页被移到一个新地址,它也是通过 `routes` 配置来完成，下面例子是从 `/a` 重定向到 `/b`

```javascript
var router = new VueRouter({
  routes: [
    { path: '/a', redirect: '/b' }
  ]
})
```

**别名**

> `/a` 的别名是 `/b`，意味着，当用户访问` /b` 时，`URL` 会保持为 `/b`，但是路由匹配则为 `/a`，就像用户访问` /a` 一样。简单的说就是给 /a 起了一个外号叫做 `/b` ,但是本质上还是 `/a`

```javascript
var router = new VueRouter({
  routes: [
    { path: '/a', component: A, alias: '/b' }
  ]
})
```

### 2.8 列表进入详情页传参

> 例如商品列表页面前往商品详情页面，需要传一个商品id

```html
<router-link :to="{path: 'detail', query: {id: 1}}">前往detail页面</router-link>
```

> `c`页面的路径为`http://localhost:8080/#/detail?id=1`，可以看到传了一个参数`id=1`，并且就算刷新页面id也还会存在。此时在c页面可以通过id来获取对应的详情数据，获取`id`的方式是`this.$route.query.id`

**vue传参方式有：query、params+动态路由传参**

> `query`通过`path`切换路由，`params`通过`name`切换路由

```html
// query通过path切换路由
<router-link :to="{path: 'Detail', query: { id: 1 }}">前往Detail页面</router-link>
// params通过name切换路由
<router-link :to="{name: 'Detail', params: { id: 1 }}">前往Detail页面</router-link>
```

> `query`通过`this.$route.query`来接收参数，`params`通过`this.$route.params`来接收参数


```javascript
// query通过this.$route.query接收参数
created () {
    const id = this.$route.query.id;
}

// params通过this.$route.params来接收参数
created () {
    const id = this.$route.params.id;
}
```

- `query`传参的`url`展现方式：`/detail?id=1&user=123&identity=1&`更多参数
- `params`＋动态路由的`url`方式：`/detail/123`
- `params`动态路由传参，一定要在路由中定义参数，然后在路由跳转的时候必须要加上参数，否则就是空白页面

```
{      
    path: '/detail/:id',      
    name: 'Detail',      
    component: Detail    
},
```

- **注意**，`params`传参时，如果没有在路由中定义参数，也是可以传过去的，同时也能接收到，但是一旦刷新页面，这个参数就不存在了。这对于需要依赖参数进行某些操作的行为是行不通的

```html
// 定义的路由中，只定义一个id参数
{
    path: 'detail/:id',
    name: 'Detail',
    components: Detail
}

// template中的路由传参，
// 传了一个id参数和一个token参数
// id是在路由中已经定义的参数，而token没有定义
<router-link :to="{name: 'Detail', params: { id: 1, token: '123456' }}">前往Detail页面</router-link>

// 在详情页接收
created () {
    // 以下都可以正常获取到
    // 但是页面刷新后，id依然可以获取，而token此时就不存在了
    const id = this.$route.params.id;
    const token = this.$route.params.token;
}
```
