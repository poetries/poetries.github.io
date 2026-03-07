---
title: Vue3基础小结
date: 2021-02-16 16:12:12
tags: Vue
categories: Front-End
---

# 一、vue环境搭建

## 安装Vue官方脚手架以及创建项目

**注意:**    安装脚手架创建项目之前之前，我们的电脑上必须得安装Nodejs，推荐安装nodejs稳定版本

**文档地址：** https://v3.vuejs.org/guide/installation.html#cli

**Vue-cli地址：** https://cli.vuejs.org/

**Vite地址：** https://github.com/vitejs/vite

通过Vue-cli脚手架工具可以让我们快速的搭建vue项目，目前Vue官方给我们提供了2个脚手架，Vue-cli和Vite。

## 通过Vue-cli创建我们的项目

```
yarn global add @vue/cli
# OR
npm install -g @vue/cli
# OR
cnpm install -g @vue/cli
```

如果电脑上面没有安装过cnpm可以通过下面命令安装：

```
npm install -g cnpm --registry=https://registry.npm.taobao.org
```

如果电脑上面没有安装过yarn可以通过下面命令安装：

```
npm i -g yarn
```

创建项目

```
vue create hello-vue3

yarn serve
```

## 通过Vite脚手架创建我们的项目

**1. 使用npm创建**

```bash
npm init vite-app <project-name>
cd <project-name>
npm install
npm run dev
```

**2. 使用yarn创建**

```bash
yarn create vite-app <project-name>
cd <project-name>
yarn
yarn dev
```

### 目录结构

![image-20210217182003600](https://blog.poetries.top/img/static/images/image-20210217182003600.png)

### 开发工具以及插件配置

![image-20210217182033814](https://blog.poetries.top/img/static/images/image-20210217182033814.png)

# 二、父组件给子组件传值、Props验证、单向数据流

## 父子组件介绍

![image-20210217182834168](https://blog.poetries.top/img/static/images/image-20210217182834168.png)

## 父组件给子组件传值

### 父组件调用子组件的时候传值

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

## Props验证

> 我们可以为组件的 `prop` 指定验证要求，例如你知道的这些类型。如果有一个需求没有被满足，则 `Vue` 会在浏览器控制台中警告你。这在开发一个会被别人用到的组件时尤其有帮助

**props验证：**

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
      // 与对象或数组默认值不同，这不是一个工厂函数 —— 这是一个用作默认值的函数
      default: function() {
        return 'Default function'
      }
    }
```

## 单向数据流

所有的 prop 都使得其父子 prop 之间形成了一个**单向下行绑定**：父级 prop 的更新会向下流动到子组件中，但是反过来则不行。这样会防止从子组件意外变更父级组件的状态，从而导致你的应用的数据流向难以理解。

另外，每次父级组件发生变更时，子组件中所有的 prop 都将会刷新为最新的值。这意味着你**不**应该在一个子组件内部改变 prop。如果你这样做了，Vue 会在浏览器的控制台中发出警告。

## 父组件主动获取子组件的数据和执行子组件方法

### 调用子组件的时候定义一个ref

```html
 <v-header ref="header"></v-header>
```

### 父组件主动获取子组件数据

```js
this.$refs.header.属性	
```

### 父组件主动执行子组件方法

```js
this.$refs.header.方法		
```

## 子组件主动获取父组件的数据和执行父组件方法

### 子组件主动获取父组件的数据

```js
 this.$parent.数据	
```

### 子组件主动获取父组件的数据

```js
this.$parent.方法
```

# 三、组件的生命周期函数、 this.$nextTick、动态组件 keep-alive

## 生命周期函数

![img](http://bbs.itying.com/public/upload/02e3b550-2d3b-11eb-8ac2-41a88e51bce8.png)

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

**setup中调用生命周期钩子**

```js
import { onBeforeMount,onMounted } from "vue";
export default {
  setup() {
    onBeforeMount(() => {
        console.log('Before Mount!')
    }) 
    onMounted(() => {
        console.log('Before Mount!')
    }) 
  },
};
```

## 动态组件 keep-alive

- 当在这些组件之间切换的时候，你有时会想保持这些组件的状态，以避免反复重渲染导致的性能问题，这个时候就用用`keep-alive`
- 在不同路由切换的时候想保持组件的状态也可以使用`keep-alive`

```js
<keep-alive>
       <life-cycle v-if="isShow"></life-cycle>
  </keep-alive>
```

## this.$nextTick

> Vue中可以把获取Dom节点的代码放在`mounted`里面，但是如果要在渲染完成数据后获取DOM节点就需要用到`this.$nextTick`

```js
 mounted() {
      this.$nextTick(function () {
        // 仅在渲染整个视图之后运行的代码
      })
 },
```

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

# **四、Mixin实现组件功能的复用**

## mixin介绍使用

> 混入 (mixin) 提供了一种非常灵活的方式，来分发 Vue 组件中的可复用功能。一个混入对象可以包含任意组件选项。当组件使用混入对象时，所有混入对象的选项将被“混合”进入该组件本身的选项

### **新建mixin/base.js**

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

### **使用mixin**

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

## 关于Mixin的选项合并

> 当组件和混入对象含有同名选项时，这些选项将以恰当的方式进行“合并”

**1. 数据对象在内部会进行递归合并，并在发生冲突时以组件数据优先**

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

**2. 同名钩子函数将合并为一个数组，因此都将被调用。另外，混入对象的钩子将在组件自身钩子之前调用**

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

**3. 值为对象的选项，例如 `methods`、`components`，将被合并为同一个对象。两个对象键名冲突时，取组件对象的键值对**

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

## 全局配置Mixin

你还可以为 Vue 应用程序全局应用 mixin

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

# 五、使用Teleport自定义一个模态对话框的组件

## Teleport

> Vue3.x中的组件模板属于该组件，有时候我们想把模板的内容移动到当前组件之外的DOM 中，这个时候就可以使用 Teleport。

表示`teleport`内包含的内容显示到`body`中

```html
<teleport to="body">
内容
</teleport>
```

```html
<teleport to="#app">
内容
</teleport>
```

## 使用Teleport实现一个模态对话框的组件

**Modal.vue**

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

`Home.vue`使用`model`

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
