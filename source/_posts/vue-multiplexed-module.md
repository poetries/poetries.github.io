---
title: Vue之学会编写可复用性模块 函数组件与插件三种粒度
description: 从重复的模板表达式讲到函数封装、过滤器、组件封装与插槽定制，再到用 install 写全局插件，讲清 Vue 里三种复用粒度各自的适用边界与踩坑点，并附 Vue 3 下的替代写法。
date: 2019-06-02 00:28:32
tags:
  - Vue
  - 组件化
  - 代码复用
categories: Front-End
---

同一段字符串处理，在模板里写了两遍；同一个 loading 遮罩，在五个页面各复制了一份；同一个确认弹窗，每次用都要先 `import` 再注册再声明一个 `visible` 变量。这些重复不会让你的代码跑不起来，但会在需求变更的时候集中爆发，改一处漏三处。Vue 项目里的复用其实有三个粒度，函数、组件、插件，各自解决不同大小的重复。这篇把这三层挨个讲清楚：怎么写、什么时候该往上升一级、以及每一级各自的坑。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 把重复的表达式封装成方法和过滤器，以及过滤器在 Vue 3 里的下场
- 组件封装的两种形态，整体封装和用插槽做定制化封装
- 用 `install` 把公共逻辑封装成插件，全局挂一个 `$toast`
- 原文那份 toast 插件代码里的一个 bug，以及为什么它一直不显示
- 三种粒度怎么选，以及组合式 API 出现后这套划分有什么变化

在 Vue 项目里，每一个页面都可以看作是由大大小小的模块构成的，一行代码、一个函数、一个组件都算模块。提高复用性的关键就在于把这些模块写得可复用。

## 一、封装成一个函数

开发过程中最常见的重复不是数据的重复读取，而是功能点的重复。比如下面这段：

```html
<template>
    <div>
        <input type="text" v-model="str1">
        <input type="text" v-model="str2">
        <div>{{ str1.slice(1).toUpperCase() }}</div>
        <div>{{ str2.slice(1).toUpperCase() }}</div>
    </div>
</template>
```

原文这段的开标签写成了 `tempalte`，是个 typo，上面改回来了。

重复的功能点是「截取输入框第二个字符开始到最后的值，并转成大写」。这么短的表达式写两遍看着没什么，但只要它出现在模板里，就有三个隐患：一是逻辑分散，改规则要满模板找；二是模板里塞表达式会让这一行的可读性迅速下降，再加两个条件判断就没法看了；三是这段逻辑没法单独测试。

所以把它提成方法：

```js
export default {
    methods: {
        sliceUpperCase(val) {
            return val.slice(1).toUpperCase()
        }
    }
}
```

用到的地方调用一下，传值进去拿新值出来。

如果这个功能点只出现在双花括号插值和 `v-bind` 表达式里，Vue 2 还给了一个更贴合的选择，过滤器：

```js
// 单文件组件注册过滤器
filters: {
    sliceUpperCase(val) {
        return val.slice(1).toUpperCase()
    }
}

// 全局注册过滤器
Vue.filter('sliceUpperCase', function (val) {
    return val.slice(1).toUpperCase()
})
```

然后在模板里用「管道」符调用：

```html
<div>{{ str1 | sliceUpperCase }}</div>
<div>{{ str2 | sliceUpperCase }}</div>
```

过滤器的好处是读起来顺，从左到右就是数据的流向。金额格式化、时间格式化这类场景用它特别舒服。

这里必须补一句时效性：过滤器在 Vue 3 里被移除了，全局的 `Vue.filter` 和组件内的 `filters` 选项都没有了。官方给的迁移建议是改用计算属性或者直接调方法。原因也说得很直白，管道语法是一套 Vue 自己发明的、只在模板里成立的规则，学习成本和收益不成正比，而方法调用是标准 JavaScript，谁都看得懂。

所以老项目里的过滤器不用急着改，Vue 2 里它是好用的；但新写的代码，尤其是准备往 Vue 3 迁的项目，直接用方法或计算属性，别再新增过滤器了。

不管是过滤器还是普通方法，底下都是函数封装这一件事。函数是复用粒度里最小、也最该优先考虑的一级。一段逻辑如果不依赖组件的状态，也不产生 DOM 相关的副作用，就把它抽成纯函数放进 `utils`，连组件都不用碰。

## 二、封装成一个组件

比函数大一号的粒度是组件。组件包含模板、脚本和样式三部分，是 Vue 里复用的主力。项目中每个页面都可以看作一个父组件，里面包含很多子组件，子组件接收父组件的值来渲染，父组件通过响应子组件的回调来触发事件。

封装组件主要有两种方式。

第一种是整体封装，使用者通过改变数据源来呈现不同状态，代码结构不可定制：

```html
<div>
    <my-component data="我是父组件传入子组件的数据"></my-component>
</div>
```

这种封装最简单，也最容易翻车。翻车的方式永远是同一种：需求方说「这里能不能加个图标」，你加了个 `showIcon` prop；下次说「图标想换成头像」，你加了个 `iconType`；再下次说「这块想放一个按钮」，你加了个 `extraButton`。半年之后这个组件有二十个 prop，里面全是 `v-if`。

这就是第二种方式存在的理由，用插槽做自定义封装。开放一部分槽位给父组件，让它自己往里塞结构：

```html
<div>
    <my-component data="我是父组件传入子组件的数据">
        <template slot="customize">
            <span>这是定制化的数据</span>
        </template>
    </my-component>
</div>
```

组件内部用 `slot` 标签的 `name` 接住：

```html
<div class="container">
    <span>{{ data }}</span>
    <slot name="customize"></slot>
</div>
```

原文这段的结尾写成了 `<div>` 而不是 `</div>`，少了一个斜杠，上面补上了。

子组件里 `slot` 的 `name` 定为 `customize`，父组件在 `template` 上写 `slot="customize"`，两边对上，父组件里那段结构就会被渲染到对应位置。不同的父组件可以塞不同的内容，实现差异化。最终渲染出来是这样：

```html
<div>
    <div class="container">
        <span>我是父组件传入子组件的数据</span>
        <span>这是定制化的数据</span>
    </div>
</div>
```

这里的插槽语法也要更新一下。`slot="customize"` 这种写在标签属性上的老语法从 Vue 2.6 起就被废弃了，取而代之的是 `v-slot:customize`，简写成 `#customize`。Vue 3 直接把老语法移除了，写了不生效。所以上面那段父组件的代码，现在应该写成 `<template #customize>`。

还有一种插槽值得提一句，作用域插槽。上面这种插槽传的是「结构」，父组件塞什么子组件就渲染什么，但父组件拿不到子组件内部的数据。作用域插槽解决的就是这个：子组件把数据绑在 `slot` 标签上，父组件用 `v-slot` 的值接住。表格组件的自定义列、列表组件的自定义 item 全靠它。插槽的三种形态和组件之间九种通信方式，我在 [Vue组件化实践详解](https://feinterview.poetries.top/blog/vue-comp) 里完整写过一遍。

封装好的组件，页面里 `import` 进来注册一下就能用，也可以全局注册：

```js
import myComponent from '../myComponent.vue'

// 全局
Vue.component('my-component', myComponent)
```

全局注册用起来省事，代价是这个组件无论用不用都会被打进主包，而且 tree-shaking 拿它没办法。所以全局注册只留给真正每个页面都用的东西，其余的老老实实局部注册。

## 三、封装成一个插件

再往上一级是插件。有些公共逻辑，使用者根本不需要了解内部结构，只要知道调什么方法、传什么参数。loading、toast、确认弹窗都属于这一类，它们的共同点是「随手就要能调，不想为它在模板里预留标签」。

Vue 2 提供了 `install` 方法来编写插件，第一个参数是 Vue 构造器，拿到它就能给项目添加全局方法、资源和选项：

```js
/* toast.js */
import ToastComponent from './toast.vue' // 引入组件

let $vm

export default {    
    install(Vue, options) {
        
        // 判断实例是否存在
        if (!$vm) {            
            const ToastPlugin = Vue.extend(ToastComponent); // 创建一个「扩展实例构造器」
            
            // 创建 $vm 实例
            $vm = new ToastPlugin({                
                el: document.createElement('div')  // 声明挂载元素          
            });            
            
            document.body.appendChild($vm.$el); // 把 toast 组件的 DOM 添加到 body 里
        } 
        
        // 给 toast 设置自定义文案和时间
        let toast = (text, duration) => {
            $vm.text = text;
            $vm.duration = duration;
            $vm.isShow = true;   // 原文漏了这一行，不置为 true 的话 toast 永远不显示
            
            // 在指定 duration 之后让 toast 消失
            setTimeout(() => {
                $vm.isShow = false;  
            }, $vm.duration);
        }
        
        // 判断 Vue.$toast 是否存在
        if (!Vue.$toast) {            
            Vue.$toast = toast;        
        }        
        
        Vue.prototype.$toast = Vue.$toast; // 全局添加 $toast 事件
    }
}
```

这段代码里我改了一处。原文的 `toast` 函数只设置了 `text` 和 `duration`，然后开个定时器把 `isShow` 设成 `false`，但从头到尾没有把 `isShow` 设成 `true`。组件初始的 `isShow` 是 `false`，调用之后还是 `false`，结果就是调了没反应，页面上什么都不出现。这种 bug 很典型，代码逻辑通顺、控制台干净，就是没效果。

再拆解一下这段的几个关键点。

`Vue.extend(ToastComponent)` 是把一个组件配置对象变成可以 `new` 的构造函数。直接 `new` 一个组件配置对象是不行的，必须先 extend 一次。

`el: document.createElement('div')` 这一手是让实例挂载到一个还没进入文档的游离节点上。这样组件会正常完成渲染流程，DOM 就挂在 `$vm.$el` 上，之后我们自己决定 append 到哪里。这也是所有「脱离组件树的弹窗」的共同做法。

`if (!$vm)` 这个判断保证了全局只有一个 toast 实例，反复调用只是改文案，不会往 body 里堆一堆节点。

这里也有个坑要注意：连续快速调用两次 `$toast`，第一次的定时器还没到点，第二次又开了一个，第一个定时器到点时会把正在显示的第二条也关掉。真要做严谨的话，每次调用前先 `clearTimeout` 掉上一个，把定时器 id 存起来。原文这版没处理，用在低频提示上问题不大，但列表里循环触发就会看到闪烁。

写完插件脚本，在入口文件里用 `Vue.use()` 注册：

```js
import Toast from '@/widgets/toast/toast.js'

Vue.use(Toast); // 注册 Toast
```

`Vue.use` 做的事很简单，调用你导出对象上的 `install` 方法并把 Vue 传进去，同时做一次去重，同一个插件注册两遍只生效一次。

之后在任何组件里直接调：

```
this.$toast('Hello World', 2000);
```

一行搞定，不用 import，不用注册，不用在模板里写标签。这就是插件这一级换来的东西。

代价是它往 `Vue.prototype` 上挂了东西，属于全局污染。名字要挑得足够特别，`$toast` 这种带 `$` 前缀的约定就是为了降低撞车概率。而且插件多了之后，一个新人接手项目看到 `this.$xxx` 会不知道它从哪来，这一点得靠文档或者 TypeScript 的类型声明来补。

Vue 3 里这套写法要改几个地方。`install` 的第一个参数从 Vue 构造器变成了 app 实例，全局属性挂载点从 `Vue.prototype` 换成 `app.config.globalProperties`，`Vue.extend` 被移除了，动态创建组件实例改用 `createApp` 或者 `render` 配合 `h`。整体思路完全一样，只是 API 名字换了一轮。另外如果你只是想把某段模板渲染到 body 上，Vue 3 内置的 Teleport 就够用了，不必绕动态创建实例这条路。

## 四、三种粒度怎么选

三层讲完，实际怎么选？我的判断顺序是这样。

重复的是一段纯计算逻辑，不碰 DOM 也不依赖组件状态，抽成函数放 `utils`，这是成本最低的一级，能停在这里就别往上走。

重复的是一块带模板和样式的界面，抽成组件。如果使用方对内部结构有定制需求，用插槽而不是加 prop，这条能救你后半年的维护时间。

重复的是一个「随手调用、不想在模板里预留位置」的能力，才升级成插件。插件是三者里唯一会做全局污染的，用之前先确认真的有这个必要。

判断标准可以简化成一句：调用方需要知道多少内部细节。需要传参就够了的是函数，需要摆位置和塞内容的是组件，什么都不想知道只想调一个方法的是插件。

组合式 API 出来之后，这个梯子中间多了一档：组合式函数。它比普通函数多了「可以持有响应式状态、可以挂生命周期钩子」的能力，又比组件轻，不占层级。以前那些必须封装成组件才能复用的有状态逻辑，比如分页、表单校验、窗口尺寸监听，现在一个 `useXxx` 就够了。这一档具体怎么写、和 mixin 比好在哪，我在 [Vue3之Composition API详解](https://feinterview.poetries.top/blog/vue3-composition-api) 里单独讲过。

## 总结

复用这件事，粒度选对了事半功倍，选错了自己给自己挖坑。

函数是起点，纯逻辑一律先抽函数。过滤器在 Vue 2 里是模板场景下的顺手工具，但 Vue 3 已经移除，新代码用计算属性或方法替代。

组件是主力，两种封装形态里插槽比堆 prop 重要得多。判断信号很简单：当你发现自己在给一个组件加第五个布尔类型的 prop 时，那个位置本该是个插槽。老项目里的 `slot="name"` 语法在 Vue 2.6 起废弃、Vue 3 移除，统一改成 `v-slot` 或者 `#` 简写。

插件是最重的一级，换来的是随手调用的便利，代价是全局污染。原文那份 toast 插件的实现里漏了 `isShow = true`，这类「逻辑通顺但没效果」的 bug 值得留意；另外连续调用时定时器互相覆盖的问题也要自己处理。

最后是版本。这篇写于 2019 年，Vue 2 官方维护已经停止，上面提到的过滤器、`slot` 属性语法、`Vue.extend`、`Vue.prototype` 在 Vue 3 里都有对应的替代方案，原始写法保留在文中是为了让还在维护 Vue 2 项目的人对得上号。具体 API 以官方文档为准。

## 参考

- [Vue 3 官方文档 - 插槽](https://cn.vuejs.org/guide/components/slots.html)
- [Vue 3 官方文档 - 插件](https://cn.vuejs.org/guide/reusability/plugins.html)
- [Vue 3 官方文档 - 组合式函数](https://cn.vuejs.org/guide/reusability/composables.html)
- [Vue 3 迁移指南 - 移除过滤器](https://v3-migration.vuejs.org/breaking-changes/filters.html)
- [Vue 3 官方文档 - Teleport](https://cn.vuejs.org/guide/built-ins/teleport.html)
- [前端进阶之旅](https://interview.poetries.top)
