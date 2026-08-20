---
title: Vue之class与style绑定 对象与数组两种语法（三）
description: Vue 系列第三篇，把 class 绑定的对象语法、数组语法、计算属性写法和组件上的类名继承讲透，再过一遍内联 style 的对象与数组语法、自动前缀和多重值。
date: 2018-08-26 14:02:32
tags:
  - Vue
  - class绑定
  - style绑定
categories: Front-End
---

上一篇把八类绑定语法过了一遍，其中 class 和 style 是最容易写歪的两个。原因也简单，它们支持的写法太多了，对象、数组、数组里套对象、计算属性返回对象，四种写法能解决同一个问题，新手根本不知道该挑哪个。我自己刚写 Vue 那会儿是全用三元字符串拼的，一个标签上拼出三层嵌套三元，过两周回头看谁都不认识。这篇把 class 和 style 的全部写法排一遍，重点说清每种写法适合什么场景，以及那个官方称为「常用且强大」的计算属性模式到底强在哪。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 为什么 Vue 要给 class 和 style 开小灶，而不是当普通属性处理
- class 对象语法的四种形态，从写死的键值到计算属性返回对象
- class 数组语法，以及数组里嵌对象这个组合写法
- 在自定义组件上写 class 会发生什么，类名落到哪个元素上
- 内联 style 的对象语法、对象数组语法、自动前缀和多重值兜底
- 这些写法在 Vue 3 里有哪些变化

## 一、为什么 class 和 style 要特殊对待

`v-bind` 处理普通属性时逻辑很直白，表达式算出什么值就往属性上放什么值。但 class 和 style 不行。

你想想看，一个元素上的类名往往来自好几处。有布局用的固定类，有状态相关的 `active`、`disabled`，有主题相关的 `dark`。如果 `:class` 只接受字符串，那你每次都得自己拼，还得处理空格、处理某个类要不要加的判断，最后拼出一坨没法读的表达式。

所以 Vue 在 `v-bind` 里给这两个属性做了增强，允许传对象和数组，框架负责把它们展开成最终的字符串，还会自动和标签上写死的静态 class 合并。这一层增强省掉的正是字符串拼接那部分脏活。

## 二、绑定 class 的对象语法

对象语法的规则一句话，键是类名，值是布尔，值为真类名就上。数据属性一变，class 列表跟着更新。

### 2.1 最简形态

```html
<div id="app">
    <div v-bind:class="{ active: isActive }"></div>
</div>
<script>
var app = new Vue({
    el: "#app",
    data: {
        msg: "对象语法",
        isActive: true
    }
});
</script>
```

`isActive` 为 `true` 时渲染成 `class="active"`，改成 `false` 类名就没了。注意键名如果带连字符，比如 `text-danger`，得写成 `'text-danger': hasError`，加引号，否则会被 JS 当成减法表达式。

### 2.2 和静态 class 共存

`v-bind:class` 不会覆盖标签上原有的 class，两者是合并关系：

```html
<style>
.active {
    width: 100px;
    height: 100px;
    background: red;
}
</style>

<div id="app">
    <div class="box" v-bind:class="{ active: isActive }"></div>
</div>
<script>
    var app = new Vue({
        el: "#app",
        data: {
            msg: "对象语法",
            isActive: true
        }
    });
</script>
```

最终渲染出来是 `class="box active"`。这个特性用得很多，静态类负责基础样式，动态类负责状态叠加，职责分得很清楚。原文这段的 CSS 直接裸写在 HTML 里没有包 `<style>` 标签，上面补上了。

### 2.3 直接绑定 data 里的一个对象

模板里的对象字面量一长就影响可读性，可以把整个对象搬到 data 里：

```html
<style>
.active1 {
    width: 100px;
    height: 100px;
    margin-top: 10px;
    border: 1px solid #ccc;
}
</style>

<div id="app">
    <div v-bind:class="classObj"></div>
</div>
<script>
var app = new Vue({
    el: "#app",
    data: {
        classObj: {
            active: true,
            aaa: false
        }
    }
});
</script>
```

模板一下子干净了。代价是这个对象里的每个键都得提前在 data 里声明好，后加的键在 Vue 2 里不是响应式的，得走 `this.$set`。

### 2.4 用计算属性返回对象

这是官方文档专门点名的一种模式，也是我实际项目里用得最多的：

```html
<style>
.aaa {
    background: green;
    width: 100px;
    height: 100px;
    margin-top: 10px;
}
</style>

<div id="app">
    <div v-bind:class="classObject"></div>
</div>
<script>
    var app = new Vue({
        el: "#app",
        data: {
            msg: "对象语法",
            isActive: true
        },
        computed: {
            classObject: function () {
                return {
                    aaa: this.isActive
                }
            }
        }
    });
</script>
```

强在哪？强在它把「什么条件下加什么类」这段逻辑从模板里搬到了 JS 里。真实业务的判断条件从来不是一个布尔，往往是「状态是 pending 且当前用户有权限且不在只读模式」。这种条件塞进模板就是灾难，放进计算属性里可以写 if else、可以写注释、可以单独测。

而且计算属性有缓存，依赖不变就不会重新计算，比在模板里写复杂表达式效率高。计算属性和侦听器的细节在 [vue计算属性与数据监听（十）](https://feinterview.poetries.top/blog/vue-computed-watch) 里。

原文这里把计算属性命名成了 `Obj`，首字母大写在 JS 里通常表示构造函数，容易误导，上面改成了 `classObject`，功能一样。

## 三、绑定 class 的数组语法

数组语法传的是一组类名，Vue 把它们拼起来。

### 3.1 基本形态

```html
<style>
    .active {
        width: 100px;
        height: 100px;
        background: red;
    }
    .active1 {
        color: yellow;
    }
    .aaa {
       border: 5px solid #ccc;
    }
</style>

<div id="app">
    <div class="box" v-bind:class="[isActive, isActive1, isActive2]">{{ msg }}</div>
</div>
<script>
    var app = new Vue({
        el: "#app",
        data: {
            msg: "数组语法",
            isActive: "active",
            isActive1: "active1",
            isActive2: "aaa"
        }
    });
</script>
```

这里有个容易懵的点，数组里写的是变量名，变量的值才是类名字符串。`isActive` 这个名字起得有误导性，它看着像布尔，实际存的是 `"active"` 这个字符串。要直接写死类名，得加引号，写成 `['active', 'aaa']`。

### 3.2 用三元表达式做条件

数组里的每一项都可以是表达式，所以条件类名可以这么写：

```html
<div id="app">
    <div class="box" v-bind:class="[isActive, isActive1, isActive5 ? isActive2 : '']">{{ msg }}</div>
</div>
<script>
    var app = new Vue({
        el: "#app",
        data: {
            msg: "数组语法",
            isActive5: false,
            isActive: "active",
            isActive1: "active1",
            isActive2: "aaa"
        }
    });
</script>
```

条件为假时返回空字符串，Vue 会自动过滤掉，不会渲染出多余的空格类名。

### 3.3 数组里嵌对象

三元只有一两个还行，条件一多整行就废了。这时候把对象语法塞进数组里：

```html
<div id="app">
    <div class="box" v-bind:class="[isActive, { active1: isActive5 }, isActive5 ? isActive2 : '']">{{ msg }}</div>
</div>
<script>
    var app = new Vue({
        el: "#app",
        data: {
            msg: "数组语法",
            isActive5: true,
            isActive: "active",
            isActive1: "active1",
            isActive2: "aaa"
        }
    });
</script>
```

数组负责「一定要加的类」，里面的对象负责「按条件加的类」，读起来比三元清楚。不过说实话，一旦写到这个复杂度，我更倾向于直接换成 2.4 那个计算属性方案。

## 四、在组件上使用 class

在自定义组件的标签上写 class，这些类会被加到组件的根元素上，根元素上已有的类不会被覆盖，两边是合并的：

```html
<style>
    .active1 {
        width: 100px;
        background: red;
    }
    .aaa {
        border: 5px solid #ccc;
    }
    .bbb {
        height: 100px;
    }
</style>

<div id="app">
    <tanchu v-bind:class="classObj"></tanchu>
</div>
<script>
    Vue.component('tanchu', {
        template: `<div class="bbb">
                <input type="button" value="弹出"/>
            </div>`
    })

    var app = new Vue({
        el: "#app",
        data: {
            classObj: {
                active1: true,
                aaa: true
            }
        }
    })
</script>
```

最终根元素上是 `class="bbb active1 aaa"`。这个行为让封装组件时很省心，使用方想给你的组件加个外边距，直接在标签上写类就行，不需要你在组件内部专门开一个 prop。

这里有个坑要注意。这套自动继承只在组件模板有单个根元素时才成立。如果模板有多个并列的根节点，Vue 不知道该往哪个上放，类名就会丢失。Vue 2 本来就不允许多根节点，所以碰不到；Vue 3 允许了，这个问题就浮出来了，后面第六节会说。

## 五、绑定内联样式

### 5.1 对象语法

```html
<div id="app">
    <div v-bind:style="{ background: a, border: b, width: c }">内联样式</div>
    <div v-bind:style="styleObj">内联样式</div>
</div>
<script>
    var app = new Vue({
        el: "#app",
        data: {
            a: "red",
            b: "5px solid #ccc",
            c: "100px",
            styleObj: {
                background: "red",
                border: "5px solid #ccc",
                width: "100px",
                marginTop: "10px"
            }
        }
    })
</script>
```

原文这段 data 里 `c: "100px"` 后面漏了一个逗号，直接跑会抛语法错误，上面补上了。同时把 `classObj` 这个名字改成了 `styleObj`，样式对象叫 class 开头的名字实在容易看串。

两条写法规则记牢就不会错。属性名用驼峰，`marginTop` 而不是 `margin-top`，非要写连字符形式就加引号包起来。值必须是带单位的完整字符串，写 `width: 100` 没有任何效果，因为 Vue 只是把它塞进元素的 `style` 里，不会替你补 `px`。

### 5.2 数组语法

样式的数组语法和 class 不一样，它接受的是一组样式对象，后面的会覆盖前面的同名属性：

```html
<div id="app">
    <!-- 数组语法 -->
    <div v-bind:style="[styleObj, styleObj1]">内联样式</div>
</div>
<script>
    var app = new Vue({
        el: "#app",
        data: {
            styleObj: {
                background: "red",
                border: "5px solid #ccc",
                width: "100px"
            },
            styleObj1: {
                height: "100px"
            }
        }
    })
</script>
```

典型用法是「基础样式对象加覆盖样式对象」，基础的那份写死，覆盖的那份根据状态算出来。

### 5.3 自动添加前缀和多重值

用到需要浏览器前缀的 CSS 属性时，比如 `transform`，Vue 会在运行时侦测当前浏览器支持哪种写法，自动补上对应前缀。你只管写标准属性名。

还有一个不太常见但很实用的能力，属性值可以传数组，Vue 会渲染数组里浏览器支持的最后一个值。做旧浏览器兜底时用得上，写法上就是给同一个属性给出多个候选值，从最保守的排到最新的。

回到这一节开头的问题，为什么要这么多写法。因为内联样式在 Vue 里承担的是「只能在运行时算出来的样式」，比如根据滚动距离算出来的高度、根据数据算出来的进度条宽度。凡是能提前写死在 CSS 类里的，都该走 class 而不是 style，内联样式的优先级太高，后期想覆盖非常难受。

## 六、Vue 3 里的差异

class 和 style 的绑定语法在 Vue 3 里几乎原样保留，对象、数组、计算属性这几种写法都能直接用，这块是迁移成本最低的部分之一。

差异集中在组件上。Vue 3 支持多根节点组件，这时候 class 和 style 不再自动落到某个根元素上，你需要在模板里显式绑定，写成 `:class="$attrs.class"` 指定落点，否则会有警告并且类名丢失。另外 Vue 2 里 `$attrs` 不包含 class 和 style，Vue 3 把它们合并进去了，写透传组件时这点要留意。

还有一个是 `<style scoped>` 的行为。Vue 3 里子组件的根节点会同时带上父组件的作用域 id，深度选择器的写法也从 `::v-deep` 统一成了 `:deep()`。具体以官方文档为准，这块我只在 Vue 3 加 Vite 的项目里验证过。

## 总结

四种写法怎么选，我的判断标准是这样的。

只有一两个状态类，直接在模板里写对象字面量，最省事。类名固定但数量多，用数组。条件判断超过两个，或者判断逻辑本身要写注释才说得清，一律搬进计算属性返回对象，这是维护成本最低的方案。

其余几条容易踩的：

- 对象语法的键带连字符必须加引号
- 数组语法里放的是变量，变量的值才是类名，写死类名要加引号
- 静态 class 和动态 class 是合并不是覆盖，组件上写 class 会落到根元素
- style 的属性名用驼峰，值必须带单位
- 能用 class 表达的样式就别用内联 style，优先级太高不好覆盖

原文这篇里被我修掉的是 style 对象 data 里缺的那个逗号，以及两处会误导的变量命名。

上一篇是 [vue中的数据绑定（二）](https://feinterview.poetries.top/blog/vue-data-bind)，下一篇 [vue 基本指令（四）](https://feinterview.poetries.top/blog/vue-base-directive) 会把 Vue 的常用指令按用途分类过一遍。

## 参考

- [Vue 3 官方文档 - Class 与 Style 绑定](https://cn.vuejs.org/guide/essentials/class-and-style.html)
- [Vue 3 官方文档 - 透传 Attributes](https://cn.vuejs.org/guide/components/attrs.html)
- [Vue 3 官方文档 - 计算属性](https://cn.vuejs.org/guide/essentials/computed.html)
- [Vue 2 官方文档（已停止维护）](https://v2.cn.vuejs.org/)
- [Vue 3 迁移指南](https://v3-migration.vuejs.org/)
- [前端进阶之旅](https://interview.poetries.top)
