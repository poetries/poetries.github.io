---
title: Vue3基础小结 从建项目到Teleport的完整上手路径
description: Vue3 上手全流程梳理，含 Vue CLI 与 Vite 建项目、props 与单向数据流、Vue2 到 Vue3 生命周期钩子对照表、keep-alive 与 nextTick、mixin 的取舍，以及用 Teleport 写模态框。
date: 2021-02-16 16:12:12
tags:
  - Vue
  - Vue3
categories: Front-End
---

用 Vue 2 写了两三年，第一次开 Vue 3 的项目，最先卡住的往往不是组合式 API，而是一堆细碎的变化。脚手架到底该用哪个，生命周期钩子改了几个名字，mixin 还能不能继续用，模态框那个被父级 `overflow` 裁掉的老问题在 Vue 3 里有没有官方解法。这篇是我把 Vue 3 基础这块重新过一遍的笔记，按「建项目 → 父子传值 → 生命周期 → 逻辑复用 → Teleport」这条线走完，每个点都说清楚它解决什么、什么时候用、边界在哪。读完你至少能独立起一个 Vue 3 项目，并且知道哪些 Vue 2 的肌肉记忆需要改掉。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Vue CLI 和 Vite 两套脚手架怎么选，各自的命令和适用场景
- 父组件给子组件传值、props 验证的七种写法、单向数据流为什么不能破
- `$refs` 和 `$parent` 这两条「越级」通道的正确用法和代价
- Vue 2 到 Vue 3 生命周期钩子的完整对照表，以及 `setup` 为什么吃掉了前两个钩子
- `keep-alive` 缓存组件状态、`this.$nextTick` 拿渲染后的 DOM
- mixin 的三条合并规则，以及它为什么在 Vue 3 里被劝退
- 用 Teleport 实现一个模态对话框组件，顺手解决层级和裁切问题

## 一、先把项目跑起来 Vue CLI 和 Vite 怎么选

动手之前电脑上得先有 Node.js，装稳定版就行。Vue 官方那会儿同时提供了两个脚手架，Vue CLI 和 Vite，两者不是替代关系，是两个时代。

Vue CLI 基于 webpack，生态成熟、插件多、配置项全，老项目和需要复杂构建定制的项目还在用它。安装是全局装一个命令行工具：

```
yarn global add @vue/cli
# OR
npm install -g @vue/cli
# OR
cnpm install -g @vue/cli
```

如果电脑上面没有安装过 cnpm，可以通过下面命令安装：

```
npm install -g cnpm --registry=https://registry.npm.taobao.org
```

这条命令在 2021 年是标准写法，现在淘宝源域名已经迁移到 `registry.npmmirror.com`，老域名的证书早就过期了，照抄会直接报错。现在更常见的做法是不装 cnpm，直接给 npm 配镜像源，或者用 pnpm 自带的 registry 配置。

如果电脑上面没有安装过 yarn，可以通过下面命令安装：

```
npm i -g yarn
```

装完就能创建项目了，这一步会有一个交互式的选项列表，问你要不要 Router、Vuex、TypeScript、ESLint：

```
vue create hello-vue3

yarn serve
```

另一条路是 Vite。它开发阶段不打包，直接用浏览器原生的 ES Module 按需编译，改一行代码热更新几乎是瞬时的，项目越大差距越明显。用 npm 创建：

```bash
npm init vite-app <project-name>
cd <project-name>
npm install
npm run dev
```

用 yarn 创建：

```bash
yarn create vite-app <project-name>
cd <project-name>
yarn
yarn dev
```

这里有个坑要注意，`vite-app` 这个包名是 Vite 1.x 时期的产物，后来官方模板改名了，现在通行的是 `npm create vite@latest`。如果你要的是一个开箱带 Router 和 Pinia 的 Vue 项目，Vue 官方现在推荐的入口是 `npm create vue@latest`，它内部就是 Vite 驱动的。Vue CLI 目前处于维护状态，新项目基本不用再考虑它了，具体版本策略以官方文档为准。

先说结论，除非你要接手的是一个已经跑在 webpack 上的老仓库，否则新项目直接上 Vite。

### 目录结构

创建完的项目长这样，`src` 下面是源码，`public` 放不参与打包的静态资源，入口在 `main.js`：

![Vue3 项目创建完成后的目录结构，src 下按 components / assets 划分](https://blog.poetries.top/img/static/images/image-20210217182003600.png)

### 开发工具以及插件配置

编辑器这块我用 VS Code。这里有个特别容易踩的点，Vue 2 时代大家装的是 Vetur，但 Vetur 不认 Vue 3 的类型推导，装了反而会满屏飘红。Vue 3 项目要装的是 Volar，它后来改名叫 Vue - Official，两个插件同时开启会互相打架，装新的记得把旧的禁用掉。

![VS Code 中 Vue 开发相关插件的配置界面](https://blog.poetries.top/img/static/images/image-20210217182033814.png)

## 二、父组件给子组件传值 props验证与单向数据流

### 父子组件是怎么串起来的

组件树的关系图先放在这，父组件通过标签属性把数据往下传，子组件通过事件把消息往上抛，这是最基础的一组通道：

![父组件与子组件的层级关系示意图，数据向下流事件向上抛](https://blog.poetries.top/img/static/images/image-20210217182834168.png)

### 父组件调用子组件的时候传值

父组件这边，把要传的数据写在 `data` 里，在标签上用 `:title` 绑上去：

```html
<template>
    <v-header :title="title"></v-header>
</template>

<script>
import Header from './Header'
export default {
    data() {
        return {
            title: "首页组件title"
        }
    },  
    components: {
        "v-header": Header
    }
}
</script>
```

### 子组件接收父组件传值

子组件用 `props` 声明自己要接收哪些字段，声明完就能像自己的数据一样在模板里用：

```html
<template>
    <header>{{title}}</header>
</template>

<script>
export default {
    props: ["title"]
}
</script>
```

数组形式的 `props` 写起来快，但它什么都不校验。传错类型、少传必填项，全都要等到页面白屏了才发现。

### Props 验证

我们可以为组件的 `prop` 指定验证要求。如果有一个要求没被满足，Vue 会在浏览器控制台里警告你。这在开发一个会被别人用到的组件时尤其有帮助，相当于给组件写了一份可执行的接口文档。

下面这段把常见的七种写法都列全了，从最简单的类型检查到自定义验证函数：

```js
props: {
  // 基础的类型检查 (`null` 和 `undefined` 会通过任何类型验证)
  propA: Number,
  // 多个可能的类型
  propB: [String, Number],
  // 必填的字符串
  propC: {
    type: String,
    required: true
  },
  // 带有默认值的数字
  propD: {
    type: Number,
    default: 100
  },
  // 带有默认值的对象
  propE: {
    type: Object,
    // 对象或数组默认值必须从一个工厂函数获取
    default: function() {
      return { message: 'hello' }
    }
  },
  // 自定义验证函数
  propF: {
    validator: function(value) {
      // 这个值必须匹配下列字符串中的一个
      return ['success', 'warning', 'danger'].indexOf(value) !== -1
    }
  },
  // 具有默认值的函数
  propG: {
    type: Function,
    // 和对象、数组的默认值不同，这里的函数不是工厂函数，它本身就是默认值
    default: function() {
      return 'Default function'
    }
  }
}
```

`propE` 和 `propG` 这两条最容易记混。对象和数组的 `default` 必须写成工厂函数，因为引用类型如果直接写字面量，所有组件实例会共享同一个对象，一个改了大家全跟着变。而 `Function` 类型的 `default` 就是那个函数本身，不需要再包一层。

### 单向数据流

所有的 prop 都使得其父子 prop 之间形成了一个**单向下行绑定**：父级 prop 的更新会向下流动到子组件中，但是反过来则不行。这样能防止子组件意外改掉父组件的状态，避免数据流向变得难以追踪。

另外，每次父级组件发生变更时，子组件中所有的 prop 都会刷新为最新的值。所以你不应该在子组件内部直接改 prop，改了 Vue 会在控制台发警告，而且下一次父组件更新时你的修改会被覆盖掉。

那真的需要在子组件里改怎么办？两种做法。一种是把 prop 当初始值，在 `data` 里复制一份自己维护；另一种是用 `computed` 基于 prop 派生出新值。要是父组件也需要知道这个变化，那就别绕了，老老实实 `$emit` 一个事件让父组件自己改。

### 父组件主动获取子组件的数据和执行子组件方法

props 和事件是常规通道，但有时候你就是想在父组件里直接调子组件的一个方法，比如让表单子组件执行一次校验。这时候用 `ref`。

调用子组件的时候定义一个 ref：

```html
 <v-header ref="header"></v-header>
```

父组件主动获取子组件数据：

```js
this.$refs.header.属性	
```

父组件主动执行子组件方法：

```js
this.$refs.header.方法		
```

### 子组件主动获取父组件的数据和执行父组件方法

反过来，子组件也能通过 `$parent` 摸到父组件实例。

子组件主动获取父组件的数据：

```js
 this.$parent.数据	
```

子组件主动执行父组件方法：

```js
this.$parent.方法
```

这两条通道我自己的感受是能少用就少用。`$refs` 还算可控，父组件本来就知道自己挂了哪些子组件；但 `$parent` 相当于让子组件对它的使用环境做了假设，一旦这个组件被挪到别的地方复用，`this.$parent.xxx` 立刻就是 `undefined`。真要跨层级通信，后面 provide/inject 或者状态管理才是正路，这块我在 [Vue组件化实践详解](https://feinterview.poetries.top/blog/vue-comp) 里把九种方式的取舍都排了一遍。

还有个 Vue 3 的变化得提一句。用 `script setup` 写的组件默认是封闭的，父组件通过 `ref` 拿到的实例上什么都没有，你得在子组件里用 `defineExpose` 显式暴露想给外面用的属性和方法。这个设计我一开始觉得麻烦，用久了反而觉得舒服，组件的对外接口一眼就能看全。

## 三、生命周期函数 从Vue2到Vue3的钩子对照

### 生命周期函数

先看这张图，一个组件从创建到销毁会经过创建、挂载、更新、卸载四个阶段，每个阶段前后各埋一个钩子：

![Vue 组件生命周期流程图，涵盖创建、挂载、更新、销毁四个阶段的钩子调用顺序](http://bbs.itying.com/public/upload/02e3b550-2d3b-11eb-8ac2-41a88e51bce8.png)

Vue 3 里这些钩子在组合式 API 中都换了名字，规律是加 `on` 前缀改成驼峰：

| Vue2          | Vue3               |
| :------------ | :----------------- |
| beforeCreate  | ❌setup(替代)       |
| created       | ❌setup(替代)       |
| beforeMount   | onBeforeMount      |
| mounted       | onMounted          |
| beforeUpdate  | onBeforeUpdate     |
| updated       | onUpdated          |
| beforeDestroy | onBeforeUnmount    |
| destroyed     | onUnmounted        |
| errorCaptured | onErrorCaptured    |
| -             | 🎉onRenderTracked   |
| -             | 🎉onRenderTriggered |

表里有三处值得单独拎出来说。

第一处是 `beforeCreate` 和 `created` 没有对应的组合式钩子。因为 `setup` 本身就在这两个时机之间执行，你原来写在 `created` 里的逻辑直接写在 `setup` 函数体里就行，不需要再包一层。

第二处是销毁阶段改了叫法，`destroy` 变成了 `unmount`。这不只是换个词，Vue 3 把「组件被卸载」和「实例被销毁」的概念对齐了，选项式 API 里也跟着改成了 `beforeUnmount` / `unmounted`，老名字要靠迁移构建版本才认。

第三处是新增的 `onRenderTracked` 和 `onRenderTriggered`。这两个是调试用的，分别在「某个响应式依赖被追踪时」和「某个依赖变化触发重新渲染时」调用，排查「这个组件为什么又渲染了」特别好使。它们只在开发模式下生效，生产构建里会被去掉。

**setup 中调用生命周期钩子**

用法是从 `vue` 里按需导入，在 `setup` 里直接调：

```js
import { onBeforeMount, onMounted } from "vue";
export default {
  setup() {
    onBeforeMount(() => {
        console.log('Before Mount!')
    }) 
    onMounted(() => {
        console.log('Mounted!')
    }) 
  },
};
```

这些钩子必须在 `setup` 同步执行期间注册，写在 `setTimeout` 或者 `await` 后面就绑不上当前组件实例了。组合式 API 的完整用法我单独写了一篇 [Vue3之Composition API详解](https://feinterview.poetries.top/blog/vue3-composition-api)，`setup` 的两个参数、`ref` 和 `reactive` 的区别都在那里。

## 四、动态组件keep-alive与nextTick

### 动态组件 keep-alive

在组件之间来回切换的时候，默认行为是销毁旧的、创建新的。这就带来一个问题：用户在标签页 A 填了半天表单，切到 B 再切回来，内容全没了。

`keep-alive` 就是解决这个的，它把包裹的组件实例缓存起来而不是销毁：

```js
<keep-alive>
       <life-cycle v-if="isShow"></life-cycle>
  </keep-alive>
```

在不同路由切换的时候想保持组件状态，也是包一层 `keep-alive`。

用它之前得知道三件事。被缓存的组件不会再触发 `mounted` 和 `unmounted`，取而代之的是 `activated` 和 `deactivated` 这一对钩子，那些依赖「每次进来都重新拉数据」的逻辑要挪过去。缓存是有成本的，实例常驻内存，列表页缓存几十个详情页很容易把内存吃满，所以 `keep-alive` 提供了 `include`、`exclude` 和 `max` 三个属性做精细控制。最后，匹配 `include` 用的是组件的 `name` 选项，组件没写 `name` 就匹配不上，这个我踩过，找了半天以为是缓存没生效。

### this.$nextTick

Vue 里获取 DOM 节点的代码一般放在 `mounted` 里，但如果你是改完数据马上要拿更新后的 DOM，就得用 `this.$nextTick`：

```js
 mounted() {
      this.$nextTick(function () {
        // 仅在渲染整个视图之后运行的代码
      })
 },
```

为什么需要它？因为 Vue 的 DOM 更新是异步的。你改了 `this.msg`，Vue 不会立刻去操作 DOM，而是把这次更新推进一个队列，等当前这一轮同步代码跑完，在微任务里统一刷新。这样连着改十次数据也只渲染一次。

下面这段能直接把这个行为跑出来：

```js
 mounted() {
       
        var oDiv1 = document.querySelector("#msg");
        console.log("1-" + oDiv1.innerHTML);
        this.msg = "$nextTick演示";
        var oDiv2 = document.querySelector("#msg");
        console.log("2-" + oDiv2.innerHTML);
        this.$nextTick(() => {
            // 仅在渲染整个视图之后运行的代码
            var oDiv3 = document.querySelector("#msg");
            console.log("3-" + oDiv3.innerHTML);
        })
    },
```

第 1 行和第 2 行打印出来是一样的旧值，只有第 3 行是新值。这段代码用的是 `var`，现在一般写 `const`，因为这三个变量都不会被重新赋值，`const` 能让作用域和意图更清楚。

回到组合式 API，Vue 3 里 `nextTick` 是从 `vue` 导入的独立函数，而且返回 Promise，可以写成 `await nextTick()`，比回调嵌套干净得多。

## 五、Mixin实现组件功能的复用

混入（mixin）提供了一种分发 Vue 组件中可复用功能的方式。一个混入对象可以包含任意组件选项，当组件使用混入对象时，所有混入对象的选项将被「混合」进该组件本身的选项。

### 新建 mixin/base.js

把公共的域名配置和几个通用方法抽出来：

```js
const baseMixin = {
    data() {
       return{
            apiDomain: "http://www.itying.com"
       }
       
    },
    methods: {
        success() {
            console.log('succss')
        },
        error() {
            console.error('error')
        }
    }
}

export default baseMixin;
```

### 使用 mixin

组件里声明 `mixins` 数组，混入对象的 data 和 methods 就像自己写的一样可以直接用：

```html
<template>
<div>
    首页模板--{{apiDomain}}
</div>
</template>

<script>
import BaseMixin from '../mixin/base'
export default {
    mixins: [BaseMixin],
    data() {
        return {

        }
    }
}
</script>
```

### 关于 Mixin 的选项合并

当组件和混入对象含有同名选项时，这些选项会按各自的规则合并，规则一共三条。

**1. 数据对象会进行合并，发生冲突时以组件数据优先**

```js
const myMixin = {
  data() {
    return {
      message: 'hello',
      foo: 'abc'
    }
  }
}

const app = Vue.createApp({
  mixins: [myMixin],
  data() {
    return {
      message: 'goodbye',
      bar: 'def'
    }
  },
  created() {
    console.log(this.$data) // => { message: "goodbye", foo: "abc", bar: "def" }
  }
})
```

这里补一句时效性的说明。Vue 2 文档写的是「递归合并」，Vue 3 文档的措辞是浅层合并（一层），嵌套层级深的对象别指望它帮你深度合并，具体行为以官方文档为准。

**2. 同名钩子函数将合并为一个数组，因此都将被调用，混入对象的钩子在组件自身钩子之前调用**

```js
const myMixin = {
  created() {
    console.log('mixin hook called')
  }
}

const app = Vue.createApp({
  mixins: [myMixin],
  created() {
    console.log('component hook called')
  }
})

// => "混入对象的钩子被调用"
// => "组件钩子被调用"
```

生命周期钩子不覆盖而是排队执行，这条和 data 的规则正好相反，写的时候容易搞混。

**3. 值为对象的选项，例如 `methods`、`components`，将被合并为同一个对象，键名冲突时取组件自己的**

```js
const myMixin = {
  methods: {
    foo() {
      console.log('foo')
    },
    conflicting() {
      console.log('from mixin')
    }
  }
}

const app = Vue.createApp({
  mixins: [myMixin],
  methods: {
    bar() {
      console.log('bar')
    },
    conflicting() {
      console.log('from self')
    }
  }
})

const vm = app.mount('#mixins-basic')

vm.foo() // => "foo"
vm.bar() // => "bar"
vm.conflicting() // => "from self"
```

### 全局配置 Mixin

你还可以为 Vue 应用程序全局应用 mixin：

```js
const app = Vue.createApp({
  myOption: 'hello!'
})

// 为自定义的选项 'myOption' 注入一个处理器。
app.mixin({
  created() {
    const myOption = this.$options.myOption
    if (myOption) {
      console.log(myOption)
    }
  }
})

app.mount('#mixins-global') // => "hello!"
```

在项目入口里挂全局 mixin 是这么写的：

```js
import { createApp } from 'vue'
import App from './App.vue'
import BaseMixin from './mixin/base'

//原来的代码
// createApp(App).mount('#app')

//修改后的代码
const app=createApp(App);

app.mixin(BaseMixin)

app.mount('#app');
```

全局 mixin 会影响应用里每一个组件，包括第三方组件库里的。除非你在写插件，否则别碰它。

顺着上面聊，mixin 这套东西在 Vue 3 官方文档里已经被明确劝退了，原因有三个。模板里冒出来一个 `apiDomain`，你翻遍当前文件也找不到它从哪来；两个 mixin 都定义了 `handleClick`，谁覆盖谁只能靠合并规则去推；mixin 之间还可能互相依赖，改一个牵一串。组合式 API 的 composable 函数正是冲着这三条来的，`const { apiDomain } = useBase()` 一行就把来源、命名、依赖全交代清楚了。老项目里的 mixin 不用急着重写，但新写的复用逻辑建议直接上 composable。

## 六、使用Teleport自定义一个模态对话框组件

### Teleport 解决的是什么

Vue 3 中组件的模板属于该组件，渲染出来的 DOM 也就待在组件所在的位置。这在写模态框、下拉菜单、Toast 这类组件时会出事：只要祖先元素上有 `overflow: hidden`、`transform` 或者 `filter`，你的弹层就会被裁掉，或者 `position: fixed` 的定位基准被改掉，`z-index` 调到多大都没用。

Teleport 就是把模板内容传送到当前组件之外的 DOM 里去。

表示 `teleport` 内包含的内容显示到 `body` 中：

```html
<teleport to="body">
内容
</teleport>
```

也可以指定其他选择器：

```html
<teleport to="#app">
内容
</teleport>
```

DOM 位置被挪走了，但组件的逻辑关系没变。传送出去的内容仍然是当前组件的子节点，props 照传、事件照冒泡、`provide` 照拿得到，这个设计是真的舒服。

### 用 Teleport 实现一个模态对话框组件

先看 Modal.vue 的结构部分。它接收 `title` 和 `visible` 两个 prop，关闭时向外抛 `close-model` 事件，中间留了个默认插槽给调用方填内容：

```html
<template>
<teleport to="body">
    <div class="model-bg" v-show="visible">
        <div class="modal-content">
            <button class="close" @click="$emit('close-model')">X</button>
            <div class="model-title">{{title}}</div>
            <div class="model-body">
                <slot>
                    第一个对话框
                </slot>
            </div>
        </div>
    </div>

</teleport>
</template>

<script>
export default {
    props: ["title", "visible"]
}
</script>
```

这里用 `v-show` 而不是 `v-if`，是因为弹窗会被反复开关，`v-show` 只切 `display`，省掉了重复创建销毁的开销。

配套的样式，遮罩铺满、内容居中：

```html
<style lang="scss">
.model-bg {
    background: #000;
    opacity: 0.7;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0px;
}

.modal-content {
    width: 600px;
    min-height: 300px;
    border: 1px solid #eee;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;

    .model-title {
        background: #eee;
        color: #000;
        height: 32px;
        line-height: 32px;
        text-align: center;
    }

    .model-body {
        padding: 40px;
    }

    .close {
        position: absolute;
        right: 10px;
        top: 5px;
        padding: 5px;
        border: none;
        cursor: pointer;
    }

}
</style>
```

这份样式有个可以改进的地方：遮罩用了 `position: absolute`，页面一旦能滚动，遮罩就盖不住滚出去的部分，改成 `fixed` 更稳。另外遮罩上的 `opacity: 0.7` 会连同子元素一起变半透明，正经写法是用 `background: rgba(0, 0, 0, 0.7)`，把透明度放在背景色上。

`Home.vue` 里使用这个 `model`：

```html
<template>
<div class="home">
    <button @click="isVisible=true">弹出一个模态对话框</button>
    <modal :visible="isVisible" title="用户登录" @close-model="isVisible=false"></modal>
</div>
</template>

<script>
import Modal from "./Modal"
export default {
    data() {
        return {
            isVisible: false
        }
    },
    components: {
        Modal
    }

}
</script>

<style lang="scss">
.home {
    position: relative;
}
</style>
```

用 Teleport 还有几个边界要记住。`to` 指向的目标元素必须在组件挂载时就已经存在于 DOM 里，指向一个由 Vue 自己渲染出来的、还没挂载的节点会报错，所以最常用的目标就是 `body`。多个 Teleport 传送到同一个目标时是按顺序追加，不会互相覆盖。它还有个 `disabled` 属性，为 `true` 时内容留在原地不传送，做响应式布局时可以用它在移动端把弹层收回组件内部。新版本还加了延迟挂载相关的能力，具体以官方文档为准。

## 总结

把这一圈过下来，Vue 3 基础这块的落点其实很清楚：

- 脚手架优先 Vite，`npm create vue@latest` 是现在最省事的入口；Vue CLI 只在接手 webpack 老项目时才需要
- props 一律写对象形式带类型校验，对象和数组的默认值必须用工厂函数；子组件想改 prop，走本地副本、computed 或者 `$emit`，别直接改
- `$refs` 可控但要节制，`$parent` 会让组件绑死使用环境，能不用就不用；`script setup` 下记得用 `defineExpose` 开口子
- 生命周期钩子加 `on` 前缀，`beforeCreate` / `created` 被 `setup` 吃掉，`destroy` 系列改叫 `unmount`，`onRenderTriggered` 是排查多余渲染的利器
- `keep-alive` 配合 `activated` / `deactivated` 用，记得给组件写 `name`，并用 `max` 兜住内存
- mixin 的三条合并规则该懂，但新代码请用 composable
- 弹层类组件用 Teleport 挪到 `body`，一次性解决裁切、定位和层级三个老问题

这些点里，我认为最值得马上改掉的肌肉记忆是两条：别再用 `$parent` 做通信，别再用 mixin 抽复用逻辑。

## 参考

- [Vue 3 官方文档 - 快速上手](https://cn.vuejs.org/guide/quick-start.html)
- [Vue 3 官方文档 - Props](https://cn.vuejs.org/guide/components/props.html)
- [Vue 3 官方文档 - 组合式 API 生命周期钩子](https://cn.vuejs.org/api/composition-api-lifecycle.html)
- [Vue 3 官方文档 - KeepAlive](https://cn.vuejs.org/guide/built-ins/keep-alive.html)
- [Vue 3 官方文档 - Teleport](https://cn.vuejs.org/guide/built-ins/teleport.html)
- [Vue 3 官方文档 - 混入](https://cn.vuejs.org/api/options-composition.html#mixins)
- [Vue CLI 官方文档](https://cli.vuejs.org/)
- [Vite - GitHub](https://github.com/vitejs/vite)
- [前端进阶之旅](https://interview.poetries.top)
