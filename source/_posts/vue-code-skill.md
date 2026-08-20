---
title: Vue编码技巧与规范 九条能落到代码里的实践
description: 从对象映射代替 if switch、v-for 的 key 怎么选、computed 与 watch 的取舍，到路由跳转用 name、缓存变量统一管理，九条 Vue 编码技巧逐条讲清适用边界和踩坑点。
date: 2019-06-02 00:25:32
tags:
  - Vue
  - 编码规范
  - 前端优化
categories: Front-End
---

review 别人的 Vue 代码，最常挑出来的不是什么高深问题，翻来覆去就那么几类：一串写了七八个分支的 `if else`、`v-for` 上挂着 `:key="index"`、一个 `watch` 追着另一个 `watch` 改数据、路由跳转里散落着写死的 `path`。这些写法都能跑，也都不会报错，但它们会在项目做大之后一点点变成维护负担。这篇整理九条我自己在项目里反复用到的编码技巧，每一条都讲清它解决什么问题、什么时候适用、什么时候反而不该用。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 用对象映射代替一长串 `if` 和 `switch`，以及它的适用边界
- `Array.from` 快速生成规律数组
- `router.beforeEach` 里做跳转拦截的正确姿势，以及一个很容易写出的死循环
- 用 `v-if` 做按需渲染，它和 `v-show` 到底该怎么选
- 路由跳转为什么优先用 `name` 而不是 `path`
- `v-for` 的 `key` 拿什么当值，用 `index` 会出什么问题
- `computed` 和 `watch` 的分工
- 缓存变量统一管理，以及别用 `for in` 遍历数组

## 一、用对象映射代替 if 和 switch

循环判断然后赋值，是业务代码里出现频率极高的一类场景。一般的写法是这样：

```js
let name = 'lisi';
let age = 18;

if (name === 'zhangsan') {
    age = 21;
} else if (name === 'lisi') {
    age = 18;
} else if (name === 'wangwu') {
    age = 12;
}

// 或者
switch(name) {
    case 'zhangsan':
        age = 21;
        break
    case 'lisi':
        age = 18;
        break
    case 'wangwu':
        age = 12;
        break
}
```

分支一多，这段代码就开始难看了。改成对象映射之后是这样：

```js
let name = 'lisi';
let obj = {
    zhangsan: 21,
    lisi: 18,
    wangwu: 12
};

let age = obj[name] || 18;
```

原文这里说 `if` 和 `switch` 的写法「代码执行效率不高」，这条我得改一下。对象查找是哈希查找，分支特别多的时候确实比线性比较快，但在三五个分支的规模上，这点差异现代 JS 引擎里几乎测不出来。这个技巧真正的价值不在性能，在于把「判断逻辑」变成了「数据结构」。数据结构是可以从接口拿、可以配置化、可以单独抽成文件维护的，`if else` 不行。

有个坑要注意，`obj[name] || 18` 这个兜底写法在值可能是 `0` 或空字符串时会失效，会被当成 falsy 然后走默认值。这种情况用 `??` 空值合并操作符更安全，只有 `null` 和 `undefined` 才走默认。

还有一点，这个技巧只适用于「判断一次然后赋一个值」的场景。如果每个分支后面还跟着一大段处理逻辑，硬塞进对象里会变成一堆函数字面量，可读性反而不如老老实实写 `if`。对象里存函数也不是不行，但那时候你要考虑的就是策略模式了，得配上统一的入参出参约定。

## 二、用 Array.from 快速生成数组

生成有规律的数组，比如时间选择器要用的 24 小时列表，最直觉的写法是循环 push：

```js
let hours = [];

for (let i = 0; i < 24; i++) {
    hours.push(i + '时');
}
```

`Array.from` 的第二个参数是一个映射函数，配合一个只有 `length` 属性的类数组对象，一行就能搞定：

```js
let hours = Array.from({ length: 24 }, (value, index) => index + '时');
```

这里 `{ length: 24 }` 是关键。`Array.from` 只认 `length`，其余索引都是 `undefined`，所以第一个参数 `value` 永远是 `undefined`，真正有用的是 `index`。写的时候一般直接用下划线占位。

这个技巧在写 `mock` 数据的时候特别顺手，生成 20 条假列表数据配合模板字符串，比循环 push 干净得多。

## 三、用 router.beforeEach 处理跳转前逻辑

路由跳转之前经常要做点事：设置页面标题、校验登录态、埋点、权限拦截。这些逻辑放在每个页面的 `created` 里会重复无数遍，正确的位置是全局前置守卫：

```js
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

// 首页
const Home = (resolve => {
    require.ensure(['../views/home.vue'], () => {
        resolve(require('../views/home.vue'))
    })
})

let base = `${process.env.BASE_URL}`;

let router =  new Router({
    mode: 'history',
    base: base,
    routes: [
        {
            path: '/',
            name: 'home',
            component: Home,
            meta: { title: '首页' }
        },
    ]
})

router.beforeEach((to, from, next) => {
    let title = to.meta && to.meta.title;
    
    if (title) {
        document.title = title; // 设置页面 title
    }
    
    next();
})

export default router
```

`meta` 字段是个好东西，页面标题、是否需要登录、需要什么权限，全塞在这里，守卫里统一读，路由表就成了一份自带元信息的配置。

原文这段守卫里还有一段拦截跳转的逻辑，写法是先调一个封装好的 `$openRouter` 跳到 `page2`，然后再调 `next()`。这个写法有问题，我上面把它从主流程里拿掉了，单独说。

先说注释里那个「`$openRouter` 方法在第 5 节中封装」，本文第五节讲的是路由用 `name` 不用 `path`，并没有这个封装，这句应该是原稿从更长的文章里摘出来时留下的残句，实际它指的是项目里自己包了一层的全局跳转方法。

更要紧的是逻辑本身。在守卫里想改变跳转目标，正确做法是把新目标交给 `next`，而不是自己发起一次跳转再放行原来的：

```js
router.beforeEach((to, from, next) => {
    if (to.meta && to.meta.title) {
        document.title = to.meta.title;
    }

    // 想改跳转目标，把新目标交给 next，不要另起一次 push
    if (to.name === 'home') {
        next({ name: 'page2' });
        return;
    }

    next();
})
```

按原文那种写法，`push` 会触发一次新的导航，同时 `next()` 又放行了当前这次导航，两次导航互相打架，运气不好就是控制台一堆 `NavigationDuplicated` 警告，或者直接进死循环。这个我踩过，页面卡死浏览器标签页直接没响应，排查了半天才想明白是守卫在自己递归自己。

另外 `next()` 必须调，而且**每个分支上有且只能调一次**。忘了调，页面就永远停在原地，白屏还不报错，是新手最容易懵的一类问题。

顺带更新两处写法。`require.ensure` 是 webpack 特有的老式异步加载 API，现在统一用标准的动态 `import()`，也就是 `const Home = () => import('../views/home.vue')`，写法短还能被 Rollup、Vite 一起理解。另外 Vue Router 4（配 Vue 3）里守卫已经不强制调 `next` 了，可以直接 `return` 一个路由地址表示重定向、`return false` 表示取消导航，`next` 仍然兼容但官方推荐用返回值的写法。

## 四、用 v-if 优化页面加载

页面上有些模块要用户主动触发才显示，弹框、抽屉、折叠面板里的复杂表单都属于这类。这种没必要一进页面就渲染，用 `v-if` 按需渲染就行：

```html
<template>
    <div>
        <div @click="isShowModuleB = true">打开 B 模块</div>
        <module-b v-if="isShowModuleB"></module-b>
    </div>
</template>

<script>
import moduleB from 'components/moduleB'
export default {
    data() {
        return {
            isShowModuleB: false
        }  
    },
    components: {
        moduleB
    }
}
</script>
```

原文这段代码有两处得改。一是模板里 `div` 和 `module-b` 是并列的两个根节点，Vue 2 的单文件组件模板必须单根，这样写编译不过，上面套了一层 `div`。二是点击事件里改的是 `showModuleB`，`v-if` 判断的却是 `isShowModuleB`，两个名字对不上，点了也不会显示，上面统一成了 `isShowModuleB`。

`isShowModuleB` 为 `false` 时，这个组件的实例根本不会创建，它内部的 `created`、`mounted` 都不会跑，钩子里那些耗时的接口调用自然也就省掉了。这才是 `v-if` 相比 `v-show` 真正省下来的东西，不是少了几个 DOM 节点，是少了一整套组件初始化和副作用。

那什么时候用 `v-show`？切换频繁的时候。`v-if` 每次切换都要销毁重建，`v-show` 只是改 `display`。一个 tab 用户会来回点几十次，用 `v-if` 就是几十次组件重建，这时候 `v-show` 明显更划算。

但有一条是死规矩：涉及权限的内容一律用 `v-if`。`v-show` 只是把元素藏起来，DOM 还在页面里，打开控制台改一行样式就看见了。这个跟性能无关，是安全问题。

再往前一步，如果这个模块本身体积很大，光 `v-if` 还不够，因为组件代码已经被打进主包了。这时候要配合异步组件，把 `import moduleB from '...'` 改成 `components: { moduleB: () => import('components/moduleB') }`，让它单独拆出一个 chunk，用户不点就不下载。组件怎么拆、拆完之后彼此怎么通信，我在 [Vue组件化实践详解](https://feinterview.poetries.top/blog/vue-comp) 里系统写过。

## 五、路由跳转尽量用 name 而不是 path

前期定的路由路径，后期改动是常态。产品说 `/user-center` 要改成 `/account`，如果项目里跳转全写的 `path`，你得全局搜一遍挨个改，还怕漏。

`name` 就没这个问题。它是路由的唯一标识，跟 `path` 解耦，`path` 怎么改都不影响跳转代码：

```js
this.$router.push({ 
    name: 'page1'
});

// 而不是
this.$router.push({ 
    path: 'page1'
});
```

顺便说一个很多人没注意的细节：用 `name` 跳转时传参用 `params`，用 `path` 跳转时 `params` 会被直接忽略，只有 `query` 有效。这个规则不知道的话，调试起来会很莫名其妙，参数明明传了对面就是收不到。

`name` 的代价是全局唯一，项目大了之后容易撞名，建议按模块加前缀，比如 `user-detail`、`order-detail`，别都叫 `detail`。

## 六、用 key 来优化 v-for 循环

`v-for` 是基于源数据多次渲染元素或模板块的指令。数据一变，Vue 会拿新旧两个虚拟节点列表做 diff，`key` 就是它判断「这两个节点是不是同一个」的依据。`key` 相同就复用并更新，不同就销毁重建。

所以数据里有唯一 `id` 就用 `id`：

```html
<template>
    <ul>
        <li v-for="(item, index) in arr" :key="item.id">{{ item.data }}</li>
    </ul>
</template>

<script>
export default {
    data() {
        return {
            arr: [
                {
                    id: 1,
                    data: 'a'
                },
                {
                    id: 2,
                    data: 'b'
                },
                {
                    id: 3,
                    data: 'c'
                }
            ]
        }
    }
}
</script>
```

那用 `index` 当 `key` 会怎样？纯展示的静态列表其实看不出区别。问题出在你往数组中间插入或者删除一项的时候：后面所有项的 `index` 全部平移了，Vue 按 `key` 一比，发现每个位置的「身份」都变了，于是从插入点往后全部重新渲染一遍。数据没变，DOM 却全白重建了一次。

更麻烦的是带内部状态的列表。每一行里有个 `input`，用户在第二行输了字，你在第一行前面插一条新数据，因为 `key` 是 `index`，Vue 会认为第二行还是第二行，把它复用了，结果用户输入的内容跑到了错误的那一行上。这类 bug 表现得非常诡异，第一次遇到基本想不到是 `key` 的问题。

所以选 `key` 的原则就一句：拿数组里那个不会变化、且唯一的字段。后端没给 `id` 就在拿到数据时自己补一个，别图省事写 `index`。

## 七、什么时候用 computed 代替 watch

`watch` 被滥用是老项目里的常见病。先厘清两者的区别：

- `watch` 在被监测的属性变化时执行对应的回调函数
- `computed` 只有在它依赖的响应式数据变化时才重新求值，并且结果会被缓存

同一件事用两种方式实现，对比一下就很清楚了：

```html
<template>
    <div>
        <input type="text" v-model="firstName">
        <input type="text" v-model="lastName">
        <span>{{ fullName }}</span>
        <span>{{ fullName2 }}</span>
    </div>
</template>

<script>
export default {
    data() {
        return {
            firstName: '',
            lastName: '',
            fullName2: ''
        }
    },
    
    // 使用 computed
    computed: {
        fullName() {
            return this.firstName + ' ' + this.lastName
        }
    },
    
    // 使用 watch
    watch: {
        firstName: function(newVal, oldVal) {
            this.fullName2 = newVal + ' ' + this.lastName;
        },
        lastName: function(newVal, oldVal) {
            this.fullName2 = this.firstName + ' ' + newVal;
        },
    }
}
</script>
```

原文这段里 `data` 写成了 `reurn`，是个 typo，上面改成 `return` 了。

看这两段的差距：`computed` 三行，`watch` 七行还得多维护一个 `fullName2` 状态。更要命的是扩展性，再加一个 `middleName`，`computed` 改一行就完事，`watch` 得再写一个监听，同时把已有的两个也改一遍。依赖越多，`watch` 的写法就越容易漏掉某个组合。

判断标准我总结成一句话：如果一段逻辑的最终目的是「根据现有数据算出一个新值」，那它就该是 `computed`。

`watch` 应该留给真正的副作用，发请求、写 `localStorage`、操作 DOM、跳路由这些。它的特点是有输入没有返回值，`computed` 反过来，必须有返回值而且不该有副作用。组合式 API 下 `computed`、`watch`、`watchEffect` 三者的边界，我在 [Vue3之Composition API详解](https://feinterview.poetries.top/blog/vue3-composition-api) 里单独展开过。

## 八、统一管理缓存变量

项目里多多少少会用 `sessionStorage` 和 `localStorage`。这些 key 是字符串，散落在各个页面里，跟全局变量没什么两样，改一个名字要满项目搜。

做法很简单，把它们收到一个文件里：

```js
/* types.js */

export const USER_NAME = 'userName';
export const TOKEN = 'token';
```

用的时候引进来：

```js
import { USER_NAME, TOKEN } from '../types.js'

sessionStorage[USER_NAME] = '张三';
localStorage[TOKEN] = 'xxx';
```

好处有三个。改名只改一处；不会因为手误写成 `usename` 而静默拿到 `undefined`；不同模块之间的 key 冲突能在这个文件里一眼看出来。这个思路跟 Vuex 里把 mutation 类型抽成常量是一回事。

再往前走一步的做法是不直接操作 storage，而是封一个薄薄的工具层，把 `JSON.stringify`、`JSON.parse`、过期时间、异常兜底都收进去。浏览器隐私模式下写 `localStorage` 是会抛异常的，不包一层的话整个页面就挂了，这个坑挺常见。用 TypeScript 的项目还可以给每个 key 标上对应的值类型，取出来直接就有类型提示。

## 九、不要用 for in 遍历数组

`for in` 是用来遍历对象的。数组在 JS 里也是对象，所以语法上它能遍历数组，但有隐患：它会把原型链上可枚举的属性也遍历出来。

```js
let arr = [1, 2];

for (let key in arr) {
    console.log(arr[key]); // 会正常打印 1, 2
}

// 但是如果在 Array 原型链上添加一个方法
Array.prototype.test = function() {};

for (let key in arr) {
    console.log(arr[key]); // 此时会打印 1, 2, ƒ () {}
}
```

你可能会说，谁会往 `Array.prototype` 上挂东西。自己不会，但引入的老 polyfill、某些年代久远的第三方库会。而且这种问题一旦出现，报错点离原因十万八千里，非常难查。

除了原型链，还有两个坑。一是 `for in` 拿到的 `key` 是字符串，`'0'` 而不是 `0`，你要是拿它做数值运算会得到字符串拼接的结果。二是规范上它不保证遍历顺序，虽然主流引擎对数组索引是按序的，但依赖未定义行为总归不踏实。

补一句原理：这个问题的根源是「可枚举性」。直接给原型赋值属性，它的 `enumerable` 默认是 `true`，所以会被 `for in` 抓到。这也是为什么 ES6 之后往内置对象加方法都用 `Object.defineProperty` 并显式把 `enumerable` 设为 `false`。

遍历数组该用什么？拿值用 `for...of`，要索引用 `forEach` 或者带 `entries()` 的 `for...of`，需要 `break` 就用普通 `for` 循环或者 `for...of`（`forEach` 里是跳不出去的，这个也经常有人踩）。

## 总结

九条过完，其实能归成三类。

一类是可读性和可维护性的：对象映射代替长 `if`、路由跳转用 `name`、缓存变量集中管理，共同点都是把散落的字面量收成一份可以被搜索、被复用、被类型约束的数据。

一类是关于性能的，但收益点跟直觉不太一样：`v-if` 省的是组件初始化和接口调用而不是几个 DOM 节点；`key` 选对了省的是无谓的重建，选错了还会引入状态错位这种功能性 bug；`computed` 相比 `watch` 省的是一个额外的状态和一堆同步逻辑。

最后一类是避坑：守卫里改跳转目标要交给 `next` 而不是自己再 `push` 一次，遍历数组别用 `for in`。这两条都是那种平时不出事、出事很难查的类型。

这些技巧是 Vue 2 时代总结的，其中和 Vue 无关的部分（对象映射、`Array.from`、`for in`）今天一样成立；`v-if`、`key`、`computed` 的结论在 Vue 3 里也没变；变化最大的是路由部分，Vue Router 4 的守卫推荐用返回值而不是 `next`。Vue 2 官方维护已经停止，新项目按 Vue 3 和 Vue Router 4 的文档来。

## 参考

- [Vue 3 官方文档 - 列表渲染与 key](https://cn.vuejs.org/guide/essentials/list.html)
- [Vue 3 官方文档 - 计算属性](https://cn.vuejs.org/guide/essentials/computed.html)
- [Vue Router 官方文档 - 导航守卫](https://router.vuejs.org/zh/guide/advanced/navigation-guards.html)
- [MDN - Array.from](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/from)
- [MDN - for...in](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/for...in)
- [MDN - 空值合并运算符](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)
- [前端进阶之旅](https://interview.poetries.top)
