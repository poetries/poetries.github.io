---
title: Vue组件化实践详解 九种组件通信方式的取舍
description: 系统梳理 Vue 组件通信的九种方式，props、自定义事件、事件总线、Vuex、$parent、$children、$attrs、refs、provide/inject 各自的适用边界，并用插槽和表单、弹窗两个实战组件把它们串起来。
date: 2021-03-13 12:12:12
tags:
  - Vue
  - 组件化
  - 组件通信
categories: Front-End
---

写业务组件的时候，最常卡住的一步不是把界面画出来，而是「这两个组件之间的数据怎么传」。父传子好办，子传父也好办，难的是隔了四层的祖孙、是两个八竿子打不着的兄弟、是那个已经挂在 body 上、根本不在组件树里的弹窗。Vue 给的通道其实不少，光常用的就有九种，但每种都有自己的适用范围，用错了要么写得别扭，要么埋下维护雷。这篇把这九种方式逐个过一遍，讲清各自的代价，最后用一个表单组件和一个弹窗组件把它们串起来，看看真实场景里是怎么组合使用的。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 组件化到底在解决什么问题
- 九种组件通信方式的写法、适用场景和代价，附一张选型对照表
- 一个把 props、自定义事件、事件总线、`$attrs`、inject 全用上的完整示例
- 插槽的三种形态，匿名插槽、具名插槽、作用域插槽
- 实战一，用 provide/inject 加事件通知实现一套通用表单组件
- 实战二，用 JS 动态创建组件实例实现弹窗，以及 Vue 3 里对应的写法

## 一、组件化在解决什么问题

Vue 组件系统提供了一种抽象，让我们可以用独立可复用的组件来构建大型应用，任意类型的应用界面都可以抽象为一棵组件树。组件化能提高开发效率，方便重复使用，简化调试步骤，提升项目可维护性，也便于多人协同开发。

![应用界面被抽象成组件树的示意图，页面按区域拆分为可复用组件](https://blog.poetries.top/img/static/images/20210313133919.png)

一旦拆成树，通信就成了必答题。树里的两个节点想说话，无非三种关系：直接相邻的父子、有共同祖先的跨层级、彻底不相关的任意两个。下面九种方式，说到底就是在这三种关系上做文章。

## 二、组件通信常用方式

### 1. props

父给子传值，最基础也最该优先用的一种。

```js
 
// child
props: { msg: String }
// parent
<HelloWorld msg="Welcome to Your Vue.js App"/>
```

props 的好处是数据流向一眼可见，配上类型校验还能当接口文档用。它的约束是单向下行，子组件不能改，改了会被警告并且在父组件下次更新时被覆盖。这块的完整写法和单向数据流的原因我在 [Vue3基础小结](https://feinterview.poetries.top/blog/vue3-base) 里展开过。

### 2. 自定义事件

子给父传值，和 props 组成一对完整的父子通道。

```js
  
// child this.$emit('add', good)
// parent
<Cart @add="cartAdd($event)"></Cart>
```

Vue 3 里建议用 `emits` 选项（或者 `defineEmits`）把组件会抛出的事件声明出来，这样组件的对外契约就完整了：往下是 props，往上是 emits。

### 3. 事件总线

任意两个组件之间传值常用事件总线，或者 vuex 的方式。

```js
// Bus:事件派发、监听和回调管理
class Bus {
  constructor() {
    this.callbacks = {}
  }
  $on(name, fn) {
    this.callbacks[name] = this.callbacks[name] || []
    this.callbacks[name].push(fn)
  }
  $emit(name, args) {
    if (this.callbacks[name]) {
      this.callbacks[name].forEach(cb => cb(args))
    }
  }
}

// main.js
Vue.prototype.$bus = new Bus()

// child1
this.$bus.$on('foo', handle)
// child2
this.$bus.$emit('foo')
```

实践中通常用 Vue 实例代替这个 Bus 类，因为 Vue 已经实现了相应接口，`new Vue()` 出来的对象自带 `$on` / `$emit`。

这里有个必须提的变化：Vue 3 把实例上的 `$on`、`$off`、`$once` 移除了，所以「拿一个空 Vue 实例当事件总线」这个经典写法在 Vue 3 里直接失效。替代方案有两条，一是用 `mitt` 这类几百字节的第三方发布订阅库，二是就用上面这个手写的 Bus 类，它是纯 JavaScript，跟 Vue 版本没关系。挂载方式也要改，Vue 3 没有 `Vue.prototype`，全局属性走 `app.config.globalProperties`。

顺带说一句代价。事件总线是最自由的通信方式，也是最容易失控的。事件名是字符串，没有类型约束，谁发的谁收的全靠搜代码；组件销毁时忘了 `$off`，监听会一直挂着，下次进页面又加一个，回调越堆越多。这个我排查过一次，一个提交按钮点一下发了七次请求，就是反复进出页面攒下来的。所以真要用，一定在 `beforeUnmount` 里配对解绑。

### 4. vuex

创建唯一的全局数据管理者 store，通过它管理数据并通知组件状态变更。

跨组件共享的、有生命周期的、多处读写的状态，交给状态管理是最省心的。它比事件总线强在数据有明确归属，改动有迹可循，还有 devtools 可以回放。Vue 3 生态里官方推荐的已经是 Pinia，去掉了 mutation 这一层，对 TypeScript 也友好得多。Vuex 的实现原理和手写版本我写在 [Vue Router、Vuex原理实践](https://feinterview.poetries.top/blog/vue-router-vuex) 里了。

### 5. $parent / $root

兄弟组件之间通信可通过共同祖辈搭桥，用 `$parent` 或 `$root`。

```js
 
// brother1
this.$parent.$on('foo', handle)
// brother2 
this.$parent.$emit('foo')
```

这招的思路挺巧：既然两个兄弟都能摸到同一个父组件，那就把父组件当临时的信号中心。但它同样依赖实例上的 `$on` / `$emit`，Vue 3 里用不了了。

更根本的问题是，这种写法让子组件对自己的父组件做了假设。组件一旦被挪到别处复用，`this.$parent` 指向的就不是原来那个了，代码静默失效。

### 6. $children

父组件可以通过 `$children` 访问子组件，实现父子通信。

```js
 // parent 
 this.$children[0].xx = 'xxx'
```

这个 API 有两个问题。第一，官方文档明确说它不保证顺序，你今天写 `[0]` 拿到的是 A，明天在模板里加个条件渲染，`[0]` 就成了 B。第二，Vue 3 直接把 `$children` 移除了，没有替代品，官方的建议是改用模板 ref。

### 7. $attrs / $listeners

`$attrs` 包含了父作用域中不作为 prop 被识别（且获取）的特性绑定，class 和 style 除外。当一个组件没有声明任何 prop 时，这里会包含所有父作用域的绑定，同样不含 class 和 style。它可以通过 `v-bind="$attrs"` 传入内部组件，在创建高级别的包装组件时非常有用。

```js
 
// child:并未在props中声明foo 
<p>{{$attrs.foo}}</p>
// parent
<HelloWorld foo="foo"/>
```

典型用途是写「透传」组件。比如你封装一个 `MyInput` 包住原生 `input`，用户传的 `placeholder`、`maxlength`、`autofocus` 你不可能一个个声明成 prop，直接 `v-bind="$attrs"` 全甩给内部的 `input` 就完事了。配合 `inheritAttrs: false` 可以阻止这些属性自动落在根元素上。

Vue 3 在这里做了合并：`$listeners` 被移除，事件监听器统一并进了 `$attrs`，class 和 style 现在也包含在 `$attrs` 里。所以 Vue 2 里那种 `v-bind="$attrs" v-on="$listeners"` 的双写法，在 Vue 3 里一个 `v-bind="$attrs"` 就够了。

### 8. refs

获取子节点引用。

```js
 
// parent
<HelloWorld ref="hw"/>
mounted() { 
  this.$refs.hw.xx = 'xxx'
}
```

`$refs` 是这几种「越级」手段里最可控的一个，因为引用关系写在父组件自己的模板上，明明白白。它适合的是命令式操作，比如让子组件执行校验、让某个输入框获得焦点、调用一个播放器组件的 `play()`。用它来同步数据就不合适了，那还是 props 的活。

注意 `$refs` 要在 `mounted` 之后才有值，在 `setup` 或者 `created` 里访问是 `undefined`。Vue 3 用 `script setup` 时，子组件得用 `defineExpose` 主动暴露成员，否则父组件拿到的实例上什么都没有。

### 9. provide / inject

能够实现祖先和后代之间传值。

```js
   
// ancestor
provide() {
  return {foo: 'foo'}
}
// descendant
inject: ['foo']
```

这是解决「深层嵌套导致 props 层层透传」的正牌方案。祖先提供，任意深度的后代直接注入，中间组件完全不参与。

它的代价是隐式依赖，后代组件光看自己的代码不知道 `foo` 从哪来，一旦脱离那个祖先就跑不起来。所以它更适合组件库内部的父子协作，比如 `Form` 和 `FormItem`、`Tabs` 和 `TabPane` 这种成套出现的组件，而不适合当业务数据的通用管道。组合式 API 下的 `provide` / `inject` 写法和响应性处理，我在 [Vue3之Composition API详解](https://feinterview.poetries.top/blog/vue3-composition-api) 里单独讲了。

### 怎么选

九种方式听着多，实际决策没那么复杂：

| 关系 | 首选 | 备选 | 不建议 |
|------|------|------|--------|
| 父传子 | props | provide（组件库场景） | `$children` |
| 子传父 | 自定义事件 | provide 下发的方法 | `$parent` 直接改数据 |
| 父调子的方法 | 模板 ref | - | `$children[0]` |
| 跨多层祖先到后代 | provide / inject | 状态管理 | 逐层透传 props |
| 兄弟组件 | 状态管理 | 提升到共同父组件 | `$parent` 当中转 |
| 任意两个组件 | 状态管理 | 事件总线（配好解绑） | 全局变量 |
| 属性透传封装 | `$attrs` | - | 手动声明一堆 prop |

一句话原则：能用 props 加事件解决的，别上更重的方案。

### 完整示例

把上面几种方式放进一个可运行的例子里。父组件用 props 给 Child1 传值、监听它抛上来的事件，同时借 `$parent` 当兄弟之间的信号中心：

```js
// index.vue
<template>
  <div>
    <h2>组件通信</h2>
    <!-- props, 自定义事件 -->
    <Child1 msg="some msg from parent" @some-event="onSomeEvent"></Child1>
    <!-- 事件总线 -->
    <Child2 msg="other msg"></Child2>
  </div>
</template>

<script>
  import Child1 from '@/components/communication/Child1.vue'
  import Child2 from '@/components/communication/Child2.vue'
  
  export default {
    components: {
      Child1, Child2,
      // Child3: () => import('./Child3.vue')
    },
    methods: {
      onSomeEvent(msg) {
        console.log('Communition:', msg);
      }
    },
    mounted () {
      // $children持有所有自定义组件
      // 它不保证顺序
      console.log(this.$children);
    },
  }
</script>
```

Child1 接收 props、点击时 `$emit` 向上抛，同时在 `mounted` 里订阅来自 Child2 的消息：

```js
// child1.vue
<template>
  <div @click="$emit('some-event', 'msg from child1')">
    <h3>child1</h3>
    <p>{{msg}}</p>
  </div>
</template>

<script>
  export default {
    props: {
      msg: {
        type: String,
        default: ''
      },
    },
    mounted () {
      // this.$bus.$on('event-from-child2', msg => {
      //   console.log('Child1:', msg);
      // });
      this.$parent.$on('event-from-child2', msg => {
        console.log('Child1:', msg);
      });
    },
  }
</script>
```

Child2 一次性用上了三样东西：`$attrs` 接住没声明成 prop 的 `msg`，`inject` 拿祖先提供的 `foo`，点按钮时通过 `$parent` 广播消息给兄弟：

```js
// child2.vue
<template>
  <div>
    <!-- 展开$attrs对象 -->
    <h3 v-bind="$attrs">child2</h3>
    <button @click="sendToChild1">给child1发送消息</button>
    <!-- $attrs -->
    <p>{{$attrs.msg}}</p>
    <!-- inject -->
    <p>{{foo}}</p>
  </div>
</template>

<script>
  export default {
    inheritAttrs: false,
    inject: ['foo'],
    methods: {
      sendToChild1() {
        // 利用事件总线发送事件
        // this.$bus.$emit('event-from-child2', 'some msg from child2')
        this.$parent.$emit('event-from-child2', 'some msg from child2')
      }
    },
  }
</script>
```

这段代码是 Vue 2 的写法，直接搬到 Vue 3 会在 `$parent.$on` 和 `$children` 这两处报错，前面已经说过原因了。原意保留在这里，是因为它把「一个组件同时用四种通信方式」这件事展示得很完整，改到 Vue 3 只需要把总线那部分换成 mitt。

## 三、插槽

插槽语法是 Vue 实现的内容分发 API，用于复合组件开发。这项技术在通用组件库开发中有大量应用。

props 传的是数据，插槽传的是结构。做通用组件的时候，你没法预知使用者要往里面塞什么内容，插槽就是给他们留的口子。

### 1. 匿名插槽

组件里放一个 `<slot></slot>`，父组件写在标签之间的内容就会填进去：

```js
 
// comp1
<div>
  <slot></slot>
</div>
// parent
<comp>hello</comp>
```

### 2. 具名插槽

把内容分发到子组件的指定位置。

```js
 
// comp2
<div>
  <slot></slot>
  <slot name="content"></slot>
</div>

// parent
<Comp2>
  <!-- 默认插槽用 default 做参数 -->
  <template v-slot:default>这段进默认插槽</template>
  <!-- 具名插槽用插槽名做参数 -->
  <template v-slot:content>这段进 content 插槽</template>
</Comp2>
```

`v-slot:` 可以简写成 `#`，`<template #content>` 和上面等价，实际项目里基本都用简写。

### 3. 作用域插槽

分发的内容需要用到子组件里的数据时，就要用作用域插槽。子组件把数据绑在 `<slot>` 标签上，父组件通过 `v-slot` 的值接住：

```js
 
// comp3
<div>
  <slot :foo="foo"></slot>
</div>

// parent
<Comp3>
  <!-- 把 v-slot 的值指定为作用域上下文对象 -->
  <template v-slot:default="slotProps">
    来自子组件数据:{{slotProps.foo}}
  </template>
</Comp3>
```

作用域插槽是通用组件里最有价值的一种。表格组件的自定义列渲染、列表组件的自定义 item、树组件的自定义节点，全靠它。它的实现方式是把插槽内容编译成一个函数，子组件调用这个函数并把数据当参数传进去，所以数据能从子流向父。

### 范例

一个 Layout 组件，头部和底部是具名插槽，中间是默认插槽，底部还额外把一句计算出来的话传给了父组件：

```js
// 子组件 Layout.vue
<template>
  <div>
    <div class="header">
      <slot name="header"></slot>
    </div>
    <div class="body">
      <slot></slot>
    </div>
    <div class="footer">
      <slot name="footer" :fc="footerContent"></slot>
    </div>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        remark: [
          '好好学习，天天向上',
          '学习永远不晚',
          '学习知识要善于思考,思考,再思考',
          '学习的敌人是自己的满足,要认真学习一点东西,必须从不自满开始',
          '构成我们学习最大障碍的是已知的东西,而不是未知的东西',
          '在今天和明天之间,有一段很长的时间;趁你还有精神的时候,学习迅速办事',
          '三人行必有我师焉；择其善者而从之，其不善者而改之'
        ]
      }
    },
    computed: {
      footerContent() {
        // getDay() 周日返回 0，直接减 1 会取到 -1 越界，先做一次归一化
        const day = new Date().getDay()
        const index = day === 0 ? 6 : day - 1
        return this.remark[index]
      }
    },
  }
</script>
```

原文这里写的是 `this.remark[new Date().getDay() - 1]`，周日跑会得到 `undefined`，因为 `getDay()` 周日返回 0。上面顺手修掉了，顺便也说明一下这类边界很容易在自测时逃过去，毕竟一周只有一天会出问题。

配套的样式：

```css
.header {
  background-color: rgb(252, 175, 175);
}
.body {
  display: flex;
  background-color: rgb(144, 250, 134);
  min-height: 100px;
  align-items: center;
  justify-content: center;
}
.footer {
  background-color: rgb(114, 116, 255);
}
```

父组件三种插槽一起用：

```js
//父组件 index.vue
<template>
  <div>
    <h2>插槽</h2>
    <!-- 插槽 -->
    <Layout>
      <!-- 具名插槽 -->
      <template v-slot:header>全栈工程师</template>
      <!-- 匿名插槽 -->
      <template v-slot:default>content...</template>
      <!-- 作用域插槽 -->
      <template v-slot:footer="{fc}">{{fc}}</template>
    </Layout>
  </div>
</template>

<script>
  import Layout from '@/components/slots/Layout.vue'
  
  export default {
    components: {
      Layout
    },
  }
</script>
```

原文这里的匿名插槽写的是不带 `v-slot` 的裸 `<template>`，那种写法会被当成普通元素处理，上面补上了 `v-slot:default`。

## 四、组件化实战 通用表单组件

### 要做成什么样

目标是收集数据、校验数据并提交，对齐 Element UI 的使用体验：

- KForm 指定数据和校验规则
- KFormItem 负责 label 标签、执行校验、显示错误信息
- KInput 负责维护数据

参照物长这样：

```js
<template>
  <el-form :model="userInfo" :rules="rules" ref="loginForm">
    <el-form-item label="用户名" prop="username">
      <el-input v-model="userInfo.username"></el-input>
    </el-form-item>
    <el-form-item label="密码" prop="password">
      <el-input v-model="userInfo.password" type="password"></el-input>
    </el-form-item>
    <el-form-item>
      <el-button @click="login">登录</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  data() {
    return {
      userInfo: {
        username: "",
        password: ""
      },
      rules: {
        username: [{ required: true, message: "请输入用户名称" }],
        password: [{ required: true, message: "请输入密码" }]
      }
    };
  },
  methods: {
    login() {
      this.$refs["loginForm"].validate(valid => {
        if (valid) {
          alert("submit");
        } else {
          console.log("error submit!");
          return false;
        }
      });
    }
  }
};
</script>
```

注意这里 `prop` 的值必须和 `model` 里的字段名对上，原文这段写的是 `prop="name"` 配 `v-model="userInfo.name"`，但 data 里定义的是 `username`，对不上，校验规则永远取不到，上面已经改一致了。

难点在于这三个组件是嵌套关系，而且中间隔着插槽，KInput 和 KForm 之间不是直接的父子。这正是 provide/inject 加事件通知的用武之地。

### 1. KInput

创建 `components/form/KInput.vue`。它做两件事：用 `:value` 加 `@input` 手动实现双向绑定，以及在值变化时通知外层去校验。

```js
// 创建components/form/KInput.vue
<template>
  <div>
    <!-- 管理数据：实现双绑 -->
    <!-- :value, @input -->
    <input :type="type" :value="value" @input="onInput"
      v-bind="$attrs">
  </div>
</template>

<script>
  export default {
    inheritAttrs: false , // 关闭特性继承
    props: {
      value: {
        type: String,
        default: ''
      },
      type: {
        type: String,
        default: 'text'
      }
    },
    methods: {
      onInput(e) {
        this.$emit('input', e.target.value)

        // 值发生变化的时候就是需要校验的时候
        this.$parent.$emit('validate')
      }
    },
  }
</script>
```

`value` 加 `input` 这一组约定是 Vue 2 里 `v-model` 的默认展开形式。Vue 3 改成了 `modelValue` 加 `update:modelValue`，所以这个组件迁移时这两个名字要一起换。

### 2. 使用 KInput

创建 `components/form/index.vue`，添加如下代码：

```js
<template>
  <div>
    <h3>KForm表单</h3>
    <hr>
    <k-input v-model="model.username"></k-input>
    <k-input type="password" v-model="model.password"></k-input>
  </div>
</template>

<script>
import KInput from "./KInput";

export default {
  components: {
    KInput
  },
  data() {
    return {
      model: { username: "tom", password: "" },
    };
  }
};
</script>
```

### 3. 实现 KFormItem

创建 `components/form/KFormItem.vue`。它 `inject` 到 KForm 实例拿规则和数据，监听 KInput 抛来的 `validate` 事件，用 `async-validator` 执行校验并把错误信息显示出来：

```js
<template>
  <div>
    <!-- label标签 -->
    <label v-if="label">{{label}}</label>
    <!-- 容器，放插槽 -->
    <slot></slot>
    <!-- 错误信息展示 -->
    <p v-if="error" class="error">{{error}}</p>
  </div>
</template>

<script>
  import Schema from 'async-validator'

  export default {
    inject: ['form'],
    data() {
      return {
        error: ''
      }
    },
    props: {
      label: {
        type: String,
        default: ''
      },
      prop: {
        type: String,
        default: ''
      }
    },
    mounted () {
      // 监听校验事件
      this.$on('validate', () => {
        this.validate()
      })
    },
    methods: {
      validate() {
        // 1.获取值和校验规则
        const rules = this.form.rules[this.prop]
        const value = this.form.model[this.prop]

        // 2.执行校验：使用官方也使用的async-validator
        // 创建描述对象
        const descriptor = {[this.prop]: rules}
        // 创建校验器
        const validator = new Schema(descriptor)
        // 执行校验
        return validator.validate({[this.prop]: value}, errors => {
          // 如果errors存在，则说明校验失败
          if (errors) {
            this.error = errors[0].message
          } else {
            this.error = ''
          }
        })
      }
    },
  }
</script>

<style scoped>
.error{
  color: red
}
</style>
```

`async-validator` 是 Element UI 官方也在用的校验库，它的 `validate` 返回 Promise，校验失败会走 reject，这个特性下一步会用上。

### 4. 使用 KFormItem

`components/form/index.vue` 里给每个输入项套上 KFormItem，`prop` 指定要校验哪个字段：

```js
<template>
  <div>
    <h3>KForm表单</h3>
    <hr>
    <k-form-item label="用户名" prop="username">
      <k-input v-model="model.username"></k-input>
    </k-form-item>
    <k-form-item label="确认密码" prop="password">
      <k-input type="password" v-model="model.password"></k-input>
    </k-form-item>
  </div>
</template>
```

### 5. 实现 KForm

KForm 本身几乎不渲染东西，它的职责是当数据和规则的载体，并把自己 `provide` 下去：

```js
<template>
  <div>
    <!-- 容器：存放所有表单项 -->
    <!-- 存储值载体：保存大家数据和校验规则 -->
    <slot></slot>
  </div>
</template>

<script>
// 我们平时写的组件是一个组件配置对象
export default {
  provide() {
    return {
      // 直接把当前组件实例传递下去
      // 传递下去的对象是响应式的则还可以响应式
      form: this
    };
  },
  props: {
    // 数据模型
    model: {
      type: Object,
      required: true
    },
    rules: Object
  },
  methods: {
    validate(cb) {
      // 遍历肚子里面的所有FormItem，执行他们的validate方法
      // 全部通过才算通过
      // tasks是校验结果的Promise组成的数组
      const tasks = this.$children
        .filter(item => item.prop)
        .map(item => item.validate());
      // 统一判断
      Promise.all(tasks)
        .then(() => cb(true))
        .catch(() => cb(false));
    }
  }
};
</script>
```

`provide` 直接把 `this` 传下去这一手很关键。因为组件实例本身就是响应式的，后代拿到之后读 `form.model.username`，依赖关系是活的，父组件改数据后代能感知到。

### 6. 使用 KForm

`components/form/index.vue` 最终的样子：

```js
<template>
  <div>
    <h3>KForm表单</h3>
    <hr>
    <k-form :model="model" :rules="rules" ref="loginForm">
      <!-- 这里放前面那些 k-form-item -->
    </k-form>
  </div>
</template>

<script>
import KForm from "./KForm";

export default {
  components: {
    KForm
  },
  data() {
    return {
      model: { username: "tom", password: "" },
      rules: {
        username: [{ required: true, message: "请输入用户名" }],
        password: [{ required: true, message: "请输入密码" }]
      }
    };
  },
  methods: {
    submitForm() {
      this.$refs['loginForm'].validate(valid => {
        if (valid) {
          alert("请求登录!");
        } else {
          alert("校验失败!");
        }
      });
    }
  }
};
</script>
```

原文这一段在传阅过程中被格式化工具搅乱了，箭头函数变成了 `valid = >`，标签也断成了碎片，上面重新整理了一遍，逻辑和原意没有改动。

### 7. 把校验链路串起来

回过头看整条数据流，它一共三跳。

第一跳，Input 通知校验：

```js
onInput(e) {
    // ...
    // $parent 指 FormItem
    this.$parent.$emit('validate');
}
```

第二跳，FormItem 监听校验通知，获取规则并执行校验：

```js
inject: ['form'],
mounted() {
    // 监听校验事件
    this.$on('validate', () => {
        this.validate()
    })
},
methods: {
    validate() {
        // 获取对应 FormItem 的校验规则
        console.log(this.form.rules[this.prop]);
    }
},
```

补全校验逻辑：

```js
import Schema from "async-validator";

validate() {
    // 获取对应FormItem校验规则
    const rules = this.form.rules[this.prop];
    // 获取校验值
    const value = this.form.model[this.prop];
    // 组装描述对象
    const descriptor = { [this.prop]: rules };
    // 校验
    const schema = new Schema(descriptor);
    // 返回Promise，没有触发catch就说明验证通过
    return schema.validate({ [this.prop]: value }, errors => {
        if (errors) {
            // 将错误信息显示
            this.error = errors[0].message;
        } else {
            // 校验通过
            this.error = "";
        }
    });
}
```

原文这段少了 `descriptor` 的定义，直接 `new Schema(descriptor)` 会报未定义，上面补上了。

第三跳，表单全局验证，为 Form 提供 `validate` 方法：

```js
validate(cb) {
    // 调用所有含有prop属性的子组件的validate方法并得到Promise数组
    const tasks = this.$children
        .filter(item => item.prop)
        .map(item => item.validate());
    // 所有任务必须全部成功才算校验通过，任一失败则校验失败
    Promise.all(tasks)
        .then(() => cb(true))
        .catch(() => cb(false));
}
```

这套设计里用到了三种通信方式，各司其职：KForm 用 provide 向下共享数据和规则，KInput 用 `$parent.$emit` 向上一层通知，KForm 用 `$children` 收集所有表单项。缺点也很明显，后两处都依赖具体的层级结构，中间插一层 div 组件就断了。Vue 3 里这两处都得换，`$children` 换成用 provide 让 FormItem 主动注册到 Form 上，`$parent.$emit` 换成 inject 拿到 FormItem 提供的方法直接调。改完之后反而更稳，因为不再依赖层级。

## 五、组件化实战 弹窗组件

### 为什么弹窗要单独说

弹窗这类组件的特点是它们在当前 Vue 实例之外独立存在，通常挂载于 body。它们是通过 JS 动态创建的，不需要在任何组件中声明。常见的使用姿势是这样：

```js
this.$create(Notice, {
    title: '喊你来搬砖',
    message: '提示信息',
    duration: 1000
}).show();
```

一行调用，不用在模板里预先写标签，也不用维护一个 `visible` 变量。要做到这点，得自己写一个把组件配置对象变成真实 DOM 的函数。

### create 函数

```js
import Vue from "vue";

// 创建函数接收要创建组件定义
function create(Component, props) {
  // 创建一个 Vue 新实例
  const vm = new Vue({
    render(h) {
      // render 函数将传入组件配置对象转换为虚拟 dom
      return h(Component, { props });
    }
  }).$mount(); // 执行挂载函数，但未指定挂载目标，表示只执行初始化工作

  // 将生成的 dom 元素追加至 body
  document.body.appendChild(vm.$el);

  // 给组件实例添加销毁方法
  const comp = vm.$children[0];
  comp.remove = () => {
    document.body.removeChild(vm.$el);
    vm.$destroy();
  };
  return comp;
}

// 暴露调用接口
export default create;
```

这里的关键是 `$mount()` 不传参数。不传目标就只做初始化和渲染，生成的 DOM 挂在 `vm.$el` 上但不插进页面，接下来我们自己决定把它 append 到哪里。销毁也得手动，`removeChild` 摘 DOM，`$destroy()` 清实例，两步都不能少，只摘 DOM 不销毁实例就是内存泄漏。

另一种创建组件实例的方式是 `Vue.extend(Component)`：

```js
const Ctor = Vue.extend(Component);
const comp = new Ctor({
  propsData: props
});
comp.$mount();

document.body.appendChild(comp.$el);

comp.remove = () => {
  // 移除 dom
  document.body.removeChild(comp.$el);
  // 销毁组件
  comp.$destroy();
};
```

两种写法效果一样，`Vue.extend` 这条更直接一点，注意它传 props 用的是 `propsData` 而不是 `props`。

这两种写法在 Vue 3 里都用不了了：`Vue.extend` 被移除，`new Vue()` 换成了 `createApp`。Vue 3 的对应做法是 `createApp(Component, props).mount(container)`，或者用 `render(h(Component, props), container)` 配合 `render(null, container)` 卸载。功能上是对齐的，只是 API 换了名字。顺带一提，如果你只是想让某个模板渲染到 body，Vue 3 内置的 Teleport 就够了，不用走动态创建这条路。

### 通知组件

创建通知组件 Notice.vue。它自带 `show` 和 `hide`，`hide` 里调用的 `remove` 就是上面 create 函数塞进来的那个：

```js
<template>
  <div class="box" v-if="isShow">
    <h3>{{title}}</h3>
    <p class="box-content">{{message}}</p>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: ""
    },
    message: {
      type: String,
      default: ""
    },
    duration: {
      type: Number,
      default: 2000
    }
  },
  data() {
    return {
      isShow: false
    };
  },
  methods: {
    show() {
      this.isShow = true;
      setTimeout(this.hide, this.duration);
    },
    hide() {
      this.isShow = false;
      this.remove();
    }
  }
};
</script>
```

样式部分：

```css
.box {
  position: fixed;
  width: 100%;
  top: 16px;
  left: 0;
  text-align: center;
  pointer-events: none;
  background-color: #fff;
  border: grey 3px solid;
  box-sizing: border-box;
}
.box-content {
  width: 200px;
  margin: 10px auto;
  font-size: 14px;  
  padding: 8px 16px;
  background: #fff;
  border-radius: 3px;
  margin-bottom: 8px;
}
```

最后用插件进一步封装便于使用，`create.js`：

```js
import Notice from '@/components/Notice.vue'
//...
export default {
  install(Vue) {
      Vue.prototype.$notice = function(options) {
          return create(Notice, options)
      }
  }
}
```

装完这个插件，任意组件里 `this.$notice({...})` 就能弹提示了。Vue 3 里 `install` 的第一个参数变成了 app 实例，挂载点也从 `Vue.prototype` 换成 `app.config.globalProperties`，其余不变。

## 总结

回到最开始那个问题，组件之间的数据到底怎么传。过完这一圈，我的结论是：

- 优先 props 加自定义事件，这对通道数据流最清晰，能覆盖八成场景
- 跨层级用 provide / inject，但把它限制在成套组件内部，别当业务数据的通用管道；往下传时配合 `readonly`，修改入口收在提供方
- 兄弟组件和任意组件之间用状态管理，Vue 3 项目直接上 Pinia；事件总线是最后手段，用了就必须配对解绑
- `$refs` 用来做命令式操作可以，用来同步数据不行；`$parent` 和 `$children` 让组件绑死层级结构，Vue 3 已经把 `$children` 移除了
- `$attrs` 是写包装组件的利器，Vue 3 里它合并了 `$listeners`，一个 `v-bind="$attrs"` 顶原来两行
- 插槽传的是结构不是数据，作用域插槽让子组件的数据能流回父组件，通用组件库离不开它

表单和弹窗这两个实战例子最值得记的不是代码，而是它们的设计思路：表单靠 provide 建立跨层级协作，弹窗靠动态创建脱离组件树。这两种模式在任何组件库里都能找到影子。

## 参考

- [Vue 3 官方文档 - 组件基础](https://cn.vuejs.org/guide/essentials/component-basics.html)
- [Vue 3 官方文档 - 透传 Attributes](https://cn.vuejs.org/guide/components/attrs.html)
- [Vue 3 官方文档 - 插槽](https://cn.vuejs.org/guide/components/slots.html)
- [Vue 3 官方文档 - 依赖注入](https://cn.vuejs.org/guide/components/provide-inject.html)
- [Vue 3 迁移指南 - 移除的 API](https://v3-migration.vuejs.org/breaking-changes/)
- [async-validator - GitHub](https://github.com/yiminghe/async-validator)
- [mitt - GitHub](https://github.com/developit/mitt)
- [前端进阶之旅](https://interview.poetries.top)
