---
title: vue项目中的痛点（十四）
date: 2018-08-28 17:10:30
tags: Vue
categories: Front-End
---

## 一、列表进入详情页传参

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

> 综上：尽量使用`query`来传参

## 二、请求服务器接口跨域

> 本地开发项目请求服务器接口的时候，因为客户端的同源策略，导致了跨域的问题

- `vue-cli`初始化的项目，在配置文件中提供了`proxyTable`来解决本地开发的跨域问题。`config`文件的`index.js`文件中，找到`proxyTable`选项，进行如下配置


```javascript
proxyTable: {
      // 用‘/api’开头，代理所有请求到目标服务器
      '/api': {
        target: 'http://jsonplaceholder.typicode.com', // 接口域名
        changeOrigin: true, // 是否启用跨域
        pathRewrite: { //
          '^/api': ''
        }
      }
}
```

- 例如请求接口：`/api/posts/1 ==>http://jsonplaceholder.typicode.com/posts/1`
- 这个时候就可以在本地环境请求后台接口了

## 三、axios的封装和API接口的统一管理

- `axios`的封装，主要是用来帮我们进行请求的拦截和响应的拦截。
- 在请求的拦截中我们可以携带`userToken`，`post`请求头、`qs`对`post`提交数据的序列化等- 在响应的拦截中，我们可以进行根据状态码来进行错误的统一处理等等。
- `axios`接口的统一管理，是做项目时必须的流程。这样可以方便我们管理我们的接口，在接口更新时我们不必再返回到我们的业务代码中去修改接口

## 四、UI库的按需加载

> 这里以vant的按需加载为例，演示vue中ui库怎样进行按需加载

- 安装： `cnpm i vant -S`
- 安装`babel-plugin-import`插件使其按需加载：  `cnpm i babel-plugin-import -D`
- 在 `.babelrc`文件中中添加插件配置 

```javascript
libraryDirectory { 

    "plugins": [ 
        // 这里是原来的代码部分
        // …………

        // 这里是要我们配置的代码
        ["import", 
            { 
                "libraryName": "vant", 
                "libraryDirectory": "es", 
                "style": true 
            }
        ] 
    ] 
}
```

> 在`main.js`中按需加载你需要的插件

```javascript
// 按需引入vant组件
import {   
    DatetimePicker,   
    Button,   
    List 
} from 'vant';
```

> 使用组件

```javascript
// 使用vant组件
Vue.use(DatetimePicker)  
    .use(Button)  
    .use(List);
```


> 最后在在页面中使用：

```html
<van-button type="primary">按钮</van-button>
```

## 五、定时器问题

> 在a页面写一个定时，让他每秒钟打印一个1，然后跳转到b页面，此时可以看到，定时器依然在执行。这样是非常消耗性能的

**解决方案一**

> 在data函数里面进行定义定时器名称

```
data() {            
    return {                              
        timer: null  // 定时器名称          
    }        
},
```

> 然后这样使用定时器

```
this.timer = (() => {
    // 某些操作
}, 1000)
```

> 最后在`beforeDestroy()`生命周期内清除定时器

```javascript
beforeDestroy() {
    clearInterval(this.timer);        
    this.timer = null;
}
```

> 方案1有两点不好的地方

- 它需要在这个组件实例中保存这个 timer，如果可以的话最好只有生命周期钩子可以访问到它。这并不算严重的问题，但是它可以被视为杂物。
- 我们的建立代码独立于我们的清理代码，这使得我们比较难于程序化的清理我们建立的所有东西

**解决方案2**

> 该方法是通过`$once`这个事件侦听器器在定义完定时器之后的位置来清除定时器。以下是完整代码

```javascript
const timer = setInterval(() =>{                    
    // 某些定时器操作                
}, 500);            
// 通过$once来监听定时器，在beforeDestroy钩子可以被清除。
this.$once('hook:beforeDestroy', () => {            
    clearInterval(timer);                                    
})

```

## 六、rem文件的导入问题

> 在做手机端时，适配是必须要处理的一个问题。例如，我们处理适配的方案就是通过写一个`rem.js`，原理很简单，就是根据网页尺寸计算`html`的`font-size`大小

```javascript
; (function(c, d) {
    var e = document.documentElement || document.body,
    a = "orientationchange" in window ? "orientationchange": "resize",
    b = function() {
        var f = e.clientWidth;
        e.style.fontSize = (f >= 750) ? "100px": 100 * (f / 750) + "px"
    };
    b();
    c.addEventListener(a, b, false)
})(window);
```

> 在`main.js`中，直接`import './config/rem'`导入即可。`import`的路径根据你的文件路径去填写

## 七、打包后生成很大的.map文件

> 项目打包后，代码都是经过压缩加密的，如果运行时报错，输出的错误信息无法准确得知是哪里的代码报错。 而生成的`.map`后缀的文件，就可以像未加密的代码一样，准确的输出是哪一行哪一列有错可以通过设置来不生成该类文件。但是我们在生成环境是不需要`.map`文件的，所以可以在打包时不生成这些文件

- 在`config/index.js`文件中，设置`productionSourceMap: false`,就可以不生成`.map`文件

## 八、fastClick的300ms延迟

> 在`main.js`中引入`fastClick`和初始化

```javascript
import FastClick from 'fastclick'; // 引入插件
FastClick.attach(document.body); // 使用 fastclick
```

## 九、路由懒加载（延迟加载）

> 路由懒加载可以帮我们在进入首屏时不用加载过度的资源，从而减少首屏加载速度

**非懒加载写法**

```javascript
import Index from '@/page/index/index';
export default new Router({  
    routes: [    
        { 
            path: '/', 
            name: 'Index',     
            component: Index 
        }
    ]
})
```

**路由懒加载写法**

```javascript
export default new Router({
  routes: [    
        { 
            path: '/', 
            name: 'Index', 
            component: resolve => require(['@/view/index/index'], resolve) 
        }
   ]
})
```

## 十、开启gzip压缩代码

> `spa`这种单页应用，首屏由于一次性加载所有资源，所有首屏加载速度很慢。解决这个问题非常有效的手段之一就是前后端开启`gizp`（其他还有缓存、路由懒加载等等）。`gizp`其实就是帮我们减少文件体积，能压缩到`30%`左右，即`100k`的文件`gizp`后大约只有`30`k`

- `vue-cli`初始化的项目中，是默认有此配置的，只需要开启即可。但是需要先安装插件

```
npm i compression-webpack-plugin
```

- 在`config/index.js`中开启即可

```
build: {
    ………………
    productionGzip: true, // false不开启gizp，true开启
    ………………
}
```

> 这里前端进行的打包时的`gzip`，但是还需要后台服务器的配置。配置是比较简单的，配置几行代码就可以了

