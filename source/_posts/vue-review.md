---
title: Vue核心梳理 组件通信 生命周期 Vuex 与路由原理
description: 把 Vue 2 的组件三要素、更新触发条件、computed 与 watch 的取舍、生命周期、指令、JSX、Vuex 和 vue-router 串成一条线梳理一遍，每个知识点配代码和使用边界。
date: 2019-10-06 18:10:32
tags:
  - Vue
  - Vuex
  - Vue Router
  - 面试
categories: Front-End
---

Vue 用了两年，业务需求都能做，但被问到「组件为什么会更新」「computed 和 watch 到底该选哪个」「Vuex 的 state 是怎么变成响应式的」，脑子里能浮现的只有 API 文档的样子，讲不出个所以然。我自己有一阵就卡在这个状态，会用但不成体系。这篇是我把 Vue 2 的核心概念从头串一遍的笔记，从组件的属性、事件、插槽三要素起步，一路走到 Vuex 的简化实现和路由的底层原理。每一节都给了可以直接跑的代码和它的使用边界，不是 API 罗列。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 组件的三个核心概念，属性 props 的四种声明写法、事件的触发与冒泡、插槽的新旧两套语法
- 「大属性」这种把插槽当属性传的写法，什么时候值得用
- 双向绑定和单向数据流为什么不冲突，`v-model` 展开之后是什么
- 触发组件更新的条件是什么，为什么有时候改了数据视图不动
- computed 和 watch 各自的适用面，以及为什么优先用 computed
- 生命周期每个钩子的实际用途，函数式组件省掉了什么
- 内置指令和自定义指令的五个钩子
- template 和 JSX 的取舍，同一组组件用 JSX 重写一遍是什么样
- Vuex 的运行机制、核心概念、最佳实践，以及一个三十行的简化实现
- vue-router 的使用方式、路由类型和底层原理

## 一、组件的核心概念-属性props几种写法

我们的开发都是围绕着 `options` 来的。Vue 2 的组件说到底就是一个配置对象，`props`、`data`、`computed`、`methods`、生命周期钩子，全是这个对象上的字段。先把这张全景图放在这里：

![Vue 组件 options 配置项全景，包含数据、DOM、生命周期、资源等分类](https://s.poetries.top/gitee/2019/10/vue/1.png)

组件之间要协作，靠的是三个东西：属性往下传数据，事件往上报变化，插槽往里塞内容。属性是其中最基础的一环。

![props 的几种声明写法对比，数组写法与对象写法](https://s.poetries.top/gitee/2019/10/vue/2.png)

下面这个组件把 props 的几种写法都用上了，类型约束、自定义校验、默认值、函数型 prop 各一个：

```html
<template>
  <div>
    name: {{ name }}
    <br />
    type: {{ type }}
    <br />
    list: {{ list }}
    <br />
    isVisible: {{ isVisible }}
    <br />
    <button @click="handleClick">change type</button>
  </div>
</template>

<script>
export default {
  name: "PropsDemo",
  // inheritAttrs: false,
  // 这种写法不利于后期维护
  // props: ['name', 'type', 'list', 'isVisible'],
  props: {
    name: String,
    type: {
      validator: function(value) {
        // 这个值必须匹配下列字符串中的一个
        return ["success", "warning", "danger"].includes(value);
      }
    },
    list: {
      type: Array,
      // 对象或数组默认值必须从一个工厂函数获取
      default: () => []
    },
    isVisible: {
      type: Boolean,
      default: false
    },
    onChange: {
      type: Function,
      default: () => {}
    }
  },
  methods: {
    handleClick() {
      // 不要这么做、不要这么做、不要这么做
      // this.type = "warning";

      // 可以，还可以更好
      this.onChange(this.type === "success" ? "warning" : "success");
    }
  }
};
</script>
```

这段代码里有四个点值得停一下。

`props: ['name', 'type', 'list', 'isVisible']` 这种数组写法被我注释掉了，因为它不利于后期维护。数组写法只声明了名字，没有类型、没有默认值、没有校验，半年后接手的人得去读调用方的代码才知道该传什么。

`type` 用的是 `validator` 自定义校验，只允许 `success`、`warning`、`danger` 三个值。传错了 Vue 会在控制台打警告，但组件照常渲染，它是开发期的提示不是运行时的拦截。

`list` 的默认值写成了 `default: () => []`，这里必须是工厂函数。对象或数组默认值必须从一个工厂函数获取，因为组件可能被复用多次，写成 `default: []` 的话所有实例共享同一个数组引用，一个实例往里 push，别的实例全跟着变。

`onChange` 是一个函数型的 prop。`handleClick` 里注释掉的那行 `this.type = "warning"` 是明确不该做的事，props 是单向的，子组件直接改父组件传下来的值，父组件下次重新渲染就会把你的修改覆盖掉，而且 Vue 会警告。正确做法是调用父组件传下来的 `onChange`，让父组件自己去改。

用法这边混着写了 props 和原生属性：

```
// 用法
<Props
  name="Hello Vue！" // 原生属性
  :type="type"
  :is-visible="false"
  :on-change="handlePropChange"
  title="属性Demo" // 原生属性
  class="test1" // 原生属性
  :class="['test2']"
  :style="{ marginTop: '20px' }"
  style="margin-top: 10px" // 原生属性
/>
```

没有在 `props` 里声明的属性，比如这里的 `title`，会落到组件根元素上，同时能通过 `$attrs` 拿到。不想让它自动落到根元素上，就打开被注释掉的那行 `inheritAttrs: false`。

`class` 和 `style` 是两个特例，它们不走 `$attrs`，而是和组件内部根元素上写的 class、style 做合并，不是覆盖。所以上面同时写 `class="test1"` 和 `:class="['test2']"` 两个都会生效，`style` 同理。

还有个细节，模板里写 `:is-visible` 是短横线命名，声明的时候是 `isVisible` 驼峰。HTML 属性名大小写不敏感，所以模板里推荐用短横线，Vue 会自动转换。用 JSX 或者 render 函数的时候没有这个限制，直接写驼峰。

## 二、组件的核心概念-事件

属性把数据从父传到子，事件负责把变化从子报回父。

![Vue 组件自定义事件的触发与监听机制示意](https://s.poetries.top/gitee/2019/10/vue/3.png)

下面这个例子既演示了 `$emit` 上报，也演示了一个很容易踩的坑，原生事件的冒泡阻止：

```html
<template>
  <div>
    name: {{ name || "--" }}
    <br />
    <input :value="name" @change="handleChange" />
    <br />
    <br />
    <div @click="handleDivClick">
      <button @click="handleClick">重置成功</button>&nbsp;&nbsp;&nbsp;
      <button @click.stop="handleClick">重置失败</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "EventDemo",
  props: {
    name: String
  },
  methods: {
    handleChange(e) {
      this.$emit("change", e.target.value);
    },
    handleDivClick() {
      this.$emit("change", "");
    },
    handleClick(e) {
      // 都会失败
      //e.stopPropagation();
    }
  }
};
</script>
```

`handleChange` 里的 `this.$emit("change", e.target.value)` 是标准写法，事件名用小写短横线风格更安全，因为 HTML 里事件名同样大小写不敏感。

真正有意思的是那两个按钮。外层 `div` 上绑了 `handleDivClick`，里层按钮上绑了 `handleClick`。点「重置成功」这个按钮，事件冒泡到外层 div，`handleDivClick` 会执行，`$emit("change", "")` 把名字清空，所以它「成功」了。点「重置失败」那个按钮，模板上写了 `@click.stop`，冒泡被 Vue 的修饰符拦住了，外层的处理函数不执行。

`handleClick` 里被注释掉的 `e.stopPropagation()` 标着「都会失败」，这句注释指的是：你想在这个方法里手动阻止冒泡，效果和用 `.stop` 修饰符不一样。修饰符生成的代码是在事件处理函数最外层先调 `stopPropagation`，而你写在函数体里的时机没那么靠前，遇到多个处理函数或者更复杂的绑定顺序时行为不可控。

结论就是能用修饰符就用修饰符。`.stop`、`.prevent`、`.capture`、`.self`、`.once`、`.passive` 这一套是 Vue 给你的声明式出口，逻辑意图写在模板上一眼可见，比藏在方法体里清楚得多。

## 三、组件的核心概念-插槽

属性传数据，事件传变化，插槽传的是「内容」，也就是一段 DOM 结构。

![Vue 插槽的默认插槽、具名插槽与作用域插槽结构示意](https://s.poetries.top/gitee/2019/10/vue/4.png)

Vue 2.6 换过一次插槽语法，新旧两套都能用，下面这段把它们放在一起对比：

```html
 <a-tab-pane key="slot" tab="插槽">
    <h2>2.6 新语法</h2>
    <SlotDemo>
      <p>default slot</p>
      <template v-slot:title>
        <p>title slot1</p>
        <p>title slot2</p>
      </template>
      <template v-slot:item="props">
        <p>item slot-scope {{ props }}</p>
      </template>
    </SlotDemo>
    <br />
    <h2>老语法</h2>
    <SlotDemo>
      <p>default slot</p>
      <p slot="title">title slot1</p>
      <p slot="title">title slot2</p>
      <p slot="item" slot-scope="props">item slot-scope {{ props }}</p>
    </SlotDemo>
</a-tab-pane>
<script>
import Slot from "./Slot";
export default {
  components: {
    SlotDemo: Slot
  },
  data: () => {
    return {
      name: "",
      type: "success",
      bigPropsName: "Hello world!"
    };
  },
};
</script>
```

新语法统一用 `v-slot`，具名插槽写 `v-slot:title`，作用域插槽写 `v-slot:item="props"`，一个指令覆盖两种场景。老语法是 `slot="title"` 和 `slot-scope="props"` 两个不同的特性，而且 `slot` 是写在普通元素上的，看不出它和插槽的关系。

新语法还有个硬性限制：`v-slot` 只能用在 `<template>` 标签或者组件标签上，不能像老的 `slot` 那样随便挂在一个 `<p>` 上。这个限制不是找麻烦，它让插槽的边界在模板里变得明确。

对应的子组件是这么定义插槽出口的：

```html
<!-- Slot.vue -->
<template>
  <div>
    <slot />
    <slot name="title" />
    <slot name="item" v-bind="{ value: 'vue' }" />
  </div>
</template>

<script>
export default {
  name: "SlotDemo"
};
</script>
```

三个 `<slot>` 分别是默认插槽、具名插槽和作用域插槽。作用域插槽的关键在 `v-bind="{ value: 'vue' }"` 这一句，子组件把自己内部的数据抛给父组件，父组件在 `v-slot:item="props"` 里接住，然后决定怎么渲染。数据在子组件，渲染方式在父组件，这是列表类组件最常用的扩展方式。

![插槽与大属性两种写法的对比，插槽走 slot 通道，大属性把 VNode 当 prop 传](https://s.poetries.top/gitee/2019/10/vue/5.png)

**大属性例子**

还有一种少见但有用的写法：不走插槽通道，直接把 VNode 数组当成普通属性传进去。

```html
<!--子组件 bigProps.vue-->

<template>
  <div>
    {{ name }}
    <br />
    <button @click="handleChange">change name</button>
    <br />
    <!-- {{ slotDefault }} -->
    <VNodes :vnodes="slotDefault" />
    <br />
    <VNodes :vnodes="slotTitle" />
    <br />
    <VNodes :vnodes="slotScopeItem({ value: 'vue' })" />
  </div>
</template>

<script>
export default {
  name: "BigProps",
  components: {
    VNodes: {
      functional: true,
      render: (h, ctx) => ctx.props.vnodes
    }
  },
  props: {
    name: String,
    onChange: {
      type: Function,
      default: () => {}
    },
    slotDefault: Array,
    slotTitle: Array,
    slotScopeItem: {
      type: Function,
      default: () => {}
    }
  },
  methods: {
    handleChange() {
      this.onChange("Hello vue!");
    }
  }
};
</script>
```


这里的 `VNodes` 是一个函数式组件，`render: (h, ctx) => ctx.props.vnodes`，它做的事情只有一件，把接到的 VNode 原样渲染出来。因为 VNode 数组不能直接写在模板的插值里，得有这么一个壳子。

父组件调用的时候，插槽内容变成了普通属性：

```html
<!--父组件调用-->
<a-tab-pane key="bigProps" tab="大属性">
    <BigProps
      :name="bigPropsName"
      :on-change="handleBigPropChange"
      :slot-default="getDefault()"
      :slot-title="getTitle()"
      :slot-scope-item="getItem"
    />
</a-tab-pane>
```

`slotDefault` 和 `slotTitle` 是数组，对应普通插槽；`slotScopeItem` 是函数，调用时传参，对应作用域插槽。你会发现作用域插槽的实现原理就是一个接收参数返回 VNode 的函数，这里只是把它显式地写出来了。

那什么时候用这种写法？我的判断是，绝大多数情况下老老实实用插槽。大属性写法的适用场景是组件库开发，尤其是那些既要支持模板用法又要支持配置式用法的组件，比如表格的列定义，用配置传比用插槽写灵活。业务代码里用它，只会让接手的人一脸问号。

## 四、双向绑定和单向数据流并不冲突

很多人第一次学 Vue 会困惑：既然 props 是单向的，为什么 `v-model` 能双向绑？

![单向数据流示意，数据从父组件流向子组件，子组件通过事件通知父组件](https://s.poetries.top/gitee/2019/10/vue/6.png)

`v-model` 是语法糖。写在表单元素上，`<input v-model="msg">` 展开是 `:value="msg"` 加上 `@input="msg = $event.target.value"`；写在组件上，展开是 `:value` 加 `@input` 这一对约定（组件可以通过 `model` 选项改成别的 prop 和事件名）。

![v-model 语法糖展开示意，绑定值加事件监听两条通路](https://s.poetries.top/gitee/2019/10/vue/7.png)

所以双向绑定从来没有打破单向数据流。数据往下走的那条路还是 props，往上走的那条路还是事件，只是 Vue 把这两行代码合成了一个指令。数据的所有权始终在父组件手里，子组件做的是「请求父组件修改」。

理解这一点之后有个直接的好处：你在组件上写 `v-model` 却不生效的时候，知道该去查什么。要么子组件没有 `$emit('input')`，要么它接的 prop 名字不叫 `value`。响应式和数据流这一层如果想再往底下挖，可以看我这篇 [Vue响应式原理模拟 手写一个迷你版Vue](https://feinterview.poetries.top/blog/vue-reative-summary)，把 `v-model` 拆到 Watcher 那一层去写了一遍。

## 五、如何触发组件的更新

组件什么时候会重新渲染？答案是它依赖的响应式数据变了。但「响应式数据变了」这句话里有不少陷阱。

![组件更新的触发条件，props 变化与 data 变化两条路径](https://s.poetries.top/gitee/2019/10/vue/8.png)

第一类是 props 变化。父组件传下来的值变了，子组件跟着更新。这里要注意 Vue 2 的更新是组件粒度的，父组件重新渲染时会重新生成子组件的 VNode 并做 patch，即使传给子组件的 props 一个都没变，patch 这一步也会走。

![data 变化触发更新的路径，setter 通知渲染 Watcher](https://s.poetries.top/gitee/2019/10/vue/9.png)

第二类是自身 data 变化。这里最经典的坑是新增属性和数组下标赋值。`this.obj.newKey = 1` 不会触发更新，因为 `newKey` 在初始化时不存在，没被 `Object.defineProperty` 处理过；`this.arr[0] = 1` 和 `this.arr.length = 0` 同样不行。前者要用 `this.$set(this.obj, 'newKey', 1)`，后者要用 `splice` 这类被 Vue 重写过的数组方法。

![组件更新流程示意，从数据变更到重新渲染的完整链路](https://s.poetries.top/gitee/2019/10/vue/11.png)

还有一个兜底手段是 `$forceUpdate()`，它跳过响应式系统直接让当前组件重渲染。真要用到它的时候，先想想是不是数据结构设计出了问题，八成能改。

顺带说一句，Vue 3 换成 `Proxy` 之后，新增属性和数组下标赋值都能正常触发更新了，`$set` 这个 API 也就跟着退场了。

## 六、合理应用计算属性和监听器

### 6.1 计算属性Computed

计算属性解决三件事：

- 减少模板中的计算逻辑
- 数据缓存
- 依赖固定的数据类型（响应式数据）

下面这个例子把 `computed` 和 `methods` 放在一起对比，同样是反转字符串：

```html
<template>
  <div>
    <p>Reversed message1: "{{ reversedMessage1 }}"</p>
    <p>Reversed message2: "{{ reversedMessage2() }}"</p>
    <p>{{ now }}</p>
    <button @click="() => $forceUpdate()">forceUpdate</button>
    <br />
    <input v-model="message" />
  </div>
</template>
<script>
export default {
  data() {
    return {
      message: "hello vue"
    };
  },
  computed: {
    // 计算属性的 getter
    reversedMessage1: function() {
      console.log("执行reversedMessage1");
      return this.message
        .split("")
        .reverse()
        .join("");
    },
    now: function() {
      return Date.now();
    }
  },
  methods: {
    reversedMessage2: function() {
      console.log("执行reversedMessage2");
      return this.message
        .split("")
        .reverse()
        .join("");
    }
  }
};
</script>
```

点几次 `forceUpdate` 按钮，看控制台就明白了。`reversedMessage1` 是计算属性，只有 `message` 变了才会重新执行；`reversedMessage2()` 是方法，每次渲染都跑一遍。模板里那个 `now` 计算属性更有意思，`Date.now()` 不是响应式数据，所以这个计算属性的缓存永远不会失效，页面上的时间戳会一直停在第一次求值的那个数。

这就是「依赖固定的数据类型」这条要求的含义。计算属性的缓存靠依赖收集，依赖里没有响应式数据，它就没有任何理由重新计算。用计算属性包 `Date.now()`、`Math.random()` 这类东西是拿不到预期结果的。

### 6.2 监听watcher

- 更加灵活通用
- `watcher` 可以执行任何逻辑，包括函数节流、ajax 异步获取数据

计算属性要求你返回一个值，侦听器不要求，它就是「数据变了之后去干点什么」。下面这段把侦听器的几种写法都覆盖了：

```html
<template>
  <div>
    {{ $data }}
    <br />
    <button @click="() => (a += 1)">a+1</button>
  </div>
</template>
<script>
export default {
  data: function() {
    return {
      a: 1,
      b: { c: 2, d: 3 },
      e: {
        f: {
          g: 4
        }
      },
      h: []
    };
  },
  watch: {
    a: function(val, oldVal) {
      this.b.c += 1;
      console.log("new: %s, old: %s", val, oldVal);
    },
    "b.c": function(val, oldVal) {
      this.b.d += 1;
      console.log("new: %s, old: %s", val, oldVal);
    },
    "b.d": function(val, oldVal) {
      this.e.f.g += 1;
      console.log("new: %s, old: %s", val, oldVal);
    },
    e: {
      handler: function(val, oldVal) {
        this.h.push("😄");
        console.log("new: %s, old: %s", val, oldVal);
      },
      deep: true
    },
    h(val, oldVal) {
      console.log("new: %s, old: %s", val, oldVal);
    }
  }
};
</script>
```

几个写法上的要点。`"b.c": function(val, oldVal)` 用字符串路径侦听嵌套属性，不用给整个 `b` 加 `deep`。`e` 那个配了 `deep: true`，会递归侦听对象内部所有层级的变化，代价是要把整个对象遍历一遍建立依赖，对象大的话开销不小，能用字符串路径就别开 `deep`。

还有个容易困惑的地方：侦听对象或数组时，`val` 和 `oldVal` 是同一个引用，打印出来完全一样。因为改的是对象内部，引用没变。想拿到变化前的值，得自己在别处存一份深拷贝。这个我一开始也被绕进去过，以为是 Vue 的 bug。

这个例子还演示了侦听器的连锁反应，`a` 变了改 `b.c`，`b.c` 变了改 `b.d`，一路串下去。能这么写，但真在业务里这么写，出问题的时候你会找不到源头。

**watcher中使用节流**

侦听器最典型的用武之地是异步和防抖。下面这个把 `firstName`、`lastName` 合成 `fullName`，中间加了 500ms 的延迟：

```html
<template>
  <div>
    {{ fullName }}

    <div>firstName: <input v-model="firstName" /></div>
    <div>lastName: <input v-model="lastName" /></div>
  </div>
</template>
<script>
export default {
  data: function() {
    return {
      firstName: "Foo",
      lastName: "Bar",
      fullName: "Foo Bar"
    };
  },
  watch: {
    firstName: function(val) {
      clearTimeout(this.firstTimeout);
      this.firstTimeout = setTimeout(() => {
        this.fullName = val + " " + this.lastName;
      }, 500);
    },
    lastName: function(val) {
      clearTimeout(this.lastTimeout);
      this.lastTimeout = setTimeout(() => {
        this.fullName = this.firstName + " " + val;
      }, 500);
    }
  }
};
</script>
```

这段代码严格说是防抖不是节流，每次输入都会清掉上一个定时器重新计时，只有停下来 500ms 才真正赋值。名字叫节流是习惯用法，实现是 debounce。真实项目里搜索框联想、表单实时校验都是这个模式，把 `this.fullName = ...` 换成一次接口请求就是了。

注意定时器 id 存在 `this.firstTimeout` 上，而不是 `data` 里。这是个小技巧，挂在实例上但不进 `data`，就不会被做成响应式，省掉一次没必要的劫持。

### 6.3 computed vs watcher

- `computed` 能做的，`watcher` 都可以做，反之不行
- 能用 `computed` 的尽量使用 `computed`

为什么优先 `computed`？因为它是声明式的，你写的是「这个值等于什么」，依赖关系由 Vue 自己推导，加一个依赖不用改任何别的代码。`watch` 是命令式的，你写的是「这个变了我去改那个」，依赖多了之后会长成一张互相触发的网。

我的判断标准很简单：能用一个表达式从别的数据推导出来的，用 `computed`；需要做异步、需要调接口、需要操作 DOM、需要延时的，用 `watch`。

## 七、生命周期的应用场景和函数式组件

### 7.1 生命周期

![Vue 实例生命周期总览，从 beforeCreate 到 destroyed](https://s.poetries.top/gitee/2019/10/vue/12.png)

![生命周期各阶段的实例状态，data 与 DOM 何时可用](https://s.poetries.top/gitee/2019/10/vue/13.png)

![生命周期钩子的典型使用场景对照](https://s.poetries.top/gitee/2019/10/vue/14.png)

![父子组件生命周期钩子的执行顺序](https://s.poetries.top/gitee/2019/10/vue/15.png)

图里信息量不小，落到实际用法上其实就几条：`created` 里 data 已经可用但 DOM 还没有，适合发起接口请求；`mounted` 里能拿到真实 DOM，需要初始化第三方图表库、绑定原生事件的放这里；`beforeDestroy` 是清理现场的地方，定时器、事件监听、WebSocket 连接都得在这里断掉，不然组件销毁了它们还在跑，就是内存泄漏。

下面这个时钟组件把这些点都用上了：

```html
<template>
  <div>
    {{ log("render") }}
    {{ now }}
    <button @click="start = !start">{{ start ? "停止" : "开始" }}</button>
  </div>
</template>
<script>
import moment from "moment";
export default {
  data: function() {
    console.log("data");
    this.moment = moment;
    this.log = window.console.log;
    return {
      now: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      start: false
    };
  },
  watch: {
    start() {
      this.startClock();
    }
  },
  beforeCreate() {
    console.log("beforeCreate");
  },
  created() {
    console.log("created");
  },
  beforeMount() {
    console.log("beforeMount");
  },
  mounted() {
    console.log("mounted");
    this.startClock();
  },
  beforeUpdate() {
    console.log("beforeUpdate");
  },
  updated() {
    console.log("updated");
  },
  beforeDestroy() {
    console.log("beforeDestroy");
    clearInterval(this.clockInterval);
  },
  destroyed() {
    console.log("destroyed");
  },
  methods: {
    startClock() {
      clearInterval(this.clockInterval);
      if (this.start) {
        this.clockInterval = setInterval(() => {
          this.now = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
        }, 1000);
      }
    }
  }
};
</script>
```

打印顺序是 `beforeCreate`、`data`、`created`、`beforeMount`、`render`、`mounted`。

这个顺序里有两个信息。`data` 函数在 `beforeCreate` 之后、`created` 之前执行，所以 `beforeCreate` 里访问 `this.xxx` 拿到的是 undefined，数据初始化还没做。`render` 在 `beforeMount` 之后、`mounted` 之前，也就是说 `mounted` 触发时首次渲染已经完成，DOM 是实实在在存在的。

另外注意 `data` 函数里那两行 `this.moment = moment` 和 `this.log = window.console.log`。它们把外部引用挂到实例上但不放进返回的对象里，这样模板里能直接用 `log(...)`，又不会被做成响应式数据。给一个第三方库实例做响应式毫无意义，还可能因为深度遍历它内部的对象把浏览器搞卡。

`beforeDestroy` 里那句 `clearInterval(this.clockInterval)` 是这段代码里最不能省的一行。定时器不清，组件销毁之后它还在每秒钟往一个已经不存在的实例上写数据。

### 7.2 函数式组件

- `functional: true`
- 无状态、无实例、没有 `this` 上下文、没有生命周期

既然什么都没有，那它还剩什么？只剩一个 `render` 函数，输入 props 输出 VNode。因为不需要创建组件实例、不需要建响应式系统，渲染开销比普通组件小得多，适合用在列表项这类会被渲染成百上千次的地方。

```js
// TempVar.js
export default {
  functional: true,
  render: (h, ctx) => {
    return ctx.scopedSlots.default && ctx.scopedSlots.default(ctx.props || {});
  }
};
```

`TempVar` 是函数式组件的一个巧用。它接受任意 props，然后原样通过作用域插槽传回给使用者，效果相当于在模板里声明了几个临时变量。Vue 2 的模板没有 `v-let` 这种东西，需要在模板里缓存一个复杂表达式的时候，这个小组件很好用。

单文件组件里写函数式组件更简单，在 `<template>` 上加一个 `functional` 特性就行：

```html
// Functional.vue
<template functional>
  <div>
    {{ props }}
  </div>
</template>
```

注意这里访问 props 是直接写 `props`，不是 `this.props`。函数式组件没有 `this`，模板编译出来的渲染函数从上下文对象上取值。

```html
// 使用
<template>
  <div>
    <a-tabs>
      <a-tab-pane key="Functional" tab="函数式组件">
        <Functional :name="name" />
        <TempVar
          :var1="`hello ${name}`"
          :var2="destroyClock ? 'hello vue' : 'hello world'"
        >
          <template v-slot="{ var1, var2 }">
            {{ var1 }}
            {{ var2 }}
          </template>
        </TempVar>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>
<script>
import Functional from "./Functional";
import TempVar from "./TempVar";
export default {
  components: {
    Functional,
    TempVar
  },
  data() {
    return {
      destroyClock: false,
      name: "vue"
    };
  }
};
</script>
```

## 八、Vue指令

### 8.1 内置指令

![Vue 内置指令一览，v-text、v-html、v-show、v-if、v-for 等](https://s.poetries.top/gitee/2019/10/vue/16.png)

下面这个例子把常用的内置指令挨个演示了一遍：

```html
<template>
  <div>
    <h2>v-text</h2>
    <div v-text="'hello vue'">hello world</div>
    <h2>v-html</h2>
    <div v-html="'<span style=&quot;color: red&quot;>hello vue</span>'">
      hello world
    </div>
    <h2>v-show</h2>
    <div v-show="show">hello vue</div>
    <button @click="show = !show">change show</button>
    <h2>v-if v-else-if v-else</h2>
    <div v-if="number === 1">hello vue {{ number }}</div>
    <div v-else-if="number === 2">hello world {{ number }}</div>
    <div v-else>hello geektime {{ number }}</div>
    <h2>v-for v-bind</h2>
    <div v-for="num in [1, 2, 3]" v-bind:key="num">hello vue {{ num }}</div>
    <h2>v-on</h2>
    <button v-on:click="number = number + 1">number++</button>
    <h2>v-model</h2>
    <input v-model="message" />
    <h2>v-pre</h2>
    <div v-pre>{{ this will not be compiled }}</div>
    <h2>v-once</h2>
    <div v-once>
      {{ number }}
    </div>
  </div>
</template>
<script>
export default {
  data: function() {
    this.log = window.console.log;
    return {
      show: true,
      number: 1,
      message: "hello"
    };
  }
};
</script>
```

几个平时容易混的点。`v-show` 和 `v-if` 的区别在于前者只改 `display`，元素一直在 DOM 里，切换成本低；后者是真的创建和销毁，切换成本高但初始不渲染。频繁切换用 `v-show`，条件基本不变用 `v-if`。

`v-for` 后面那个 `:key` 不是可选的。没有 key，Vue 做列表 diff 时用的是就地复用策略，列表顺序一变，带内部状态的元素（比如输入框里已经输入的内容）就会串位。key 也别用数组下标，下标在插入删除时同样会变。

`v-html` 会直接插入原始 HTML，用在用户可控的内容上就是 XSS 漏洞。这条没有商量余地。

`v-pre` 跳过这个元素及其子元素的编译，`v-once` 只渲染一次之后就当成静态内容。这两个是性能优化用的，日常写不到，但知道有这么回事，遇到大段静态内容的时候能想起来。

### 8.2 自定义指令

内置指令不够用的时候，自己写一个。自定义指令适合处理那些「必须直接操作 DOM」的需求，比如自动聚焦、拖拽、图片懒加载、权限控制。

![自定义指令的五个钩子函数，bind、inserted、update、componentUpdated、unbind](https://s.poetries.top/gitee/2019/10/vue/17.png)

```html
<template>
  <div>
    <button @click="show = !show">
      销毁
    </button>
    <button v-if="show" v-append-text="`hello ${number}`" @click="number++">
      按钮
    </button>
  </div>
</template>
<script>
export default {
  directives: {
    appendText: {
      bind() {
        console.log("bind");
      },
      inserted(el, binding) {
        el.appendChild(document.createTextNode(binding.value));
        console.log("inserted", el, binding);
      },
      update() {
        console.log("update");
      },
      componentUpdated(el, binding) {
        el.removeChild(el.childNodes[el.childNodes.length - 1]);
        el.appendChild(document.createTextNode(binding.value));
        console.log("componentUpdated");
      },
      unbind() {
        console.log("unbind");
      }
    }
  },
  data() {
    return {
      number: 1,
      show: true
    };
  }
};
</script>
```

五个钩子的分工是这样的：`bind` 在指令第一次绑定到元素时调用，此时元素还没插入父节点；`inserted` 在元素被插入父节点后调用，需要操作 DOM 尺寸、调 `focus()` 的都要放这里；`update` 在所在组件的 VNode 更新时调用，但子 VNode 可能还没更新完；`componentUpdated` 在所在组件及其子 VNode 全部更新后调用；`unbind` 在解绑时调用，清理工作放这里。

上面例子里 `inserted` 负责追加文本节点，`componentUpdated` 先删掉旧的再追加新的。为什么不写在 `update` 里？因为 `update` 的时机太早，那会儿子节点还没稳定，删错节点的风险很高。这个区分是自定义指令最容易搞混的地方，我的记法是：读写 DOM 就用带 `ed` 的那两个。

`binding.value` 是指令的绑定值，也就是上面模板里 `v-append-text` 那个模板字符串求值之后的结果。想知道值有没有变，可以对比 `binding.value` 和 `binding.oldValue`。

## 九、template和jsx

Vue 的模板最终会被编译成渲染函数，JSX 只是跳过模板这一层直接写渲染函数。两者的产物是同一类东西，区别在于表达能力和约束。

### 9.1 JSX VS template

**Template**

- 学习成本低
- 大量内置指令简化开发
- 组件作用域 css
- 但灵活性低

**JSX**

- 总体上很灵活

模板的灵活性低不完全是缺点。它的静态结构让编译器有机会做静态节点提升、静态 class 标记这类优化，JSX 因为是任意 JS，编译器能推导的东西少得多。

我的实际选择是这样：绝大多数业务组件用模板，可读性好、约束强、团队上手快。遇到那种「根据配置动态决定渲染哪个标签、渲染几层」的组件，比如表单生成器、动态表格列、递归树，模板里得靠 `component :is` 和一堆 `v-if` 硬拼，这时候换 JSX 会清爽很多。

### 9.2 以下是jsx写法

把前面那一组组件用 JSX 重写一遍，对照着看差异最直观。先是父组件：

```html
// index.vue
<script>
import Props from "./Props";
import Event from "./Event";
import Slot from "./Slot";
import BigProps from "./BigProps";
export default {
  components: {
    Props,
    Event,
    SlotDemo: Slot,
    BigProps
  },
  data: () => {
    return {
      name: "",
      type: "success",
      bigPropsName: "Hello world!"
    };
  },
  methods: {
    handlePropChange(val) {
      this.type = val;
    },
    handleEventChange(val) {
      this.name = val;
    },
    handleBigPropChange(val) {
      this.bigPropsName = val;
    },
    getDefault() {
      return [<p>default slot</p>];
    },
    getTitle() {
      return [<p>title slot1</p>, <p>title slot2</p>];
    },
    getItem(props) {
      return [<p>{`item slot-scope ${JSON.stringify(props)}`}</p>];
    }
  },
  render() {
    const {
      type,
      handlePropChange,
      name,
      handleEventChange,
      bigPropsName,
      getDefault,
      getTitle,
      getItem,
      handleBigPropChange
    } = this;
    const slotDemoProps = {
      scopedSlots: {
        item(props) {
          return `item slot-scope ${JSON.stringify(props)}`;
        }
      },
      props: {}
    };
    const bigProps = {
      props: {
        onChange: handleBigPropChange
      }
    };
    return (
      <div>
        <a-tabs>
          <a-tab-pane key="props" tab="属性">
            <Props
              name="Hello Vue！"
              type={type}
              isVisible={false}
              {...{ props: { onChange: handlePropChange } }}
              title="属性Demo"
              class="test1"
              class={["test1", "test2"]}
              style={{ marginTop: "10px" }}
            />
          </a-tab-pane>
          <a-tab-pane key="event" tab="事件">
            <Event name={name} onChange={handleEventChange} />
          </a-tab-pane>
          <a-tab-pane key="slot" tab="插槽">
            <SlotDemo {...slotDemoProps}>
              <p>default slot</p>
              <p slot="title">title slot1</p>
              <p slot="title">title slot2</p>
            </SlotDemo>
          </a-tab-pane>
          <a-tab-pane key="bigProps" tab="大属性">
            <BigProps
              name={bigPropsName}
              {...bigProps}
              slotDefault={getDefault()}
              slotTitle={getTitle()}
              slotScopeItem={getItem}
            />
          </a-tab-pane>
        </a-tabs>
      </div>
    );
  }
};
</script>
```

这段 JSX 里有几个 Vue 特有的写法要留意。

传 props 不能像 React 那样直接写属性名就完事。`type={type}` 这种简单值可以，但要传到组件的 `props` 上而不是落成原生属性，稳妥的写法是用展开对象 `{...{ props: { onChange: handlePropChange } }}`。因为 Vue 的 JSX 需要区分 props、attrs、on、scopedSlots 这些不同的数据类型，React 没有这个概念。

作用域插槽在 JSX 里就是 `scopedSlots` 对象里的一个函数，看 `slotDemoProps` 那段。这也印证了前面说的，作用域插槽的实现就是函数。

`class` 在这里写了两次，后面那个 `class={["test1", "test2"]}` 会覆盖前面的字符串写法。JSX 里没有模板那套 class 合并规则，同名属性就是后面覆盖前面，这点和模板行为不一样，容易踩。

子组件也要相应改成 `render` 函数：

```html
// bigProps
<script>
export default {
  name: "BigProps",
  components: {
    VNodes: {
      functional: true,
      render: (h, ctx) => ctx.props.vnodes
    }
  },
  props: {
    name: String,
    onChange: {
      type: Function,
      default: () => {}
    },
    slotDefault: Array,
    slotTitle: Array,
    slotScopeItem: {
      type: Function,
      default: () => {}
    }
  },
  methods: {
    handleChange() {
      this.onChange("Hello vue!");
    }
  },
  render() {
    const { name, handleChange, slotDefault, slotTitle, slotScopeItem } = this;
    return (
      <div>
        {name}
        <br />
        <button onClick={handleChange}>change name</button>
        <br />
        {slotDefault}
        <br />
        {slotTitle}
        <br />
        {slotScopeItem({ value: "vue" })}
      </div>
    );
  }
};
</script>
```

`{slotDefault}` 直接把 VNode 数组渲染出来，不需要模板版本里那个 `VNodes` 包装组件。这是 JSX 相比模板真正的优势，VNode 就是普通的 JS 值，可以随便传、随便存、随便组合。

事件组件的 JSX 版本顺便把前面那个冒泡问题修好了：

```html
// Events.vue
<script>
export default {
  name: "EventDemo",
  props: {
    name: String
  },
  methods: {
    handleChange(e) {
      this.$emit("change", e.target.value);
    },
    handleDivClick() {
      this.$emit("change", "");
    },
    handleClick(e, stop) {
      console.log("stop", stop);
      if (stop) {
        e.stopPropagation();
      }
    }
  },
  render() {
    const { name, handleChange, handleDivClick, handleClick } = this;
    return (
      <div>
        name: {name || "--"}
        <br />
        <input value={name} onChange={handleChange} />
        <br />
        <br />
        <div onClick={handleDivClick}>
          <button onClick={handleClick}>重置成功</button>&nbsp;&nbsp;&nbsp;
          <button onClick={e => handleClick(e, true)}>重置失败</button>
        </div>
      </div>
    );
  }
};
</script>
```

注意 `onClick={e => handleClick(e, true)}` 这一句。JSX 里没有 `.stop` 修饰符，阻止冒泡只能自己调 `e.stopPropagation()`，所以这里多传了一个 `stop` 参数来控制。灵活性的代价就是这些原本由指令帮你处理的细节，现在得自己写。

属性组件的 JSX 版本，`props` 声明部分完全不变，只是把模板换成了 `render`：

```html
// Props.vue
<script>
export default {
  name: "PropsDemo",
  // inheritAttrs: false,
  // props: ['name', 'type', 'list', 'isVisible'],
  props: {
    name: String,
    type: {
      validator: function(value) {
        // 这个值必须匹配下列字符串中的一个
        return ["success", "warning", "danger"].includes(value);
      }
    },
    list: {
      type: Array,
      // 对象或数组默认值必须从一个工厂函数获取
      default: () => []
    },
    isVisible: {
      type: Boolean,
      default: false
    },
    onChange: {
      type: Function,
      default: () => {}
    }
  },
  methods: {
    handleClick() {
      // 不要这么做、不要这么做、不要这么做
      //this.type = "warning";

      // 可以，还可以更好
      this.onChange(this.type === "success" ? "warning" : "success");
    }
  },
  render() {
    const { name, type, list, isVisible, handleClick } = this;
    return (
      <div>
        name: {name}
        <br />
        type: {type}
        <br />
        list: {list}
        <br />
        isVisible: {isVisible}
        <br />
        <button onClick={handleClick}>change type</button>
      </div>
    );
  }
};
</script>
```

插槽组件在 JSX 里最直白，`$scopedSlots` 上挂的就是一组函数，调用它们拿到 VNode：

```html
// Slot
<script>
export default {
  name: "SlotDemo",
  render() {
    const { $scopedSlots } = this;
    return (
      <div>
        {$scopedSlots.default()}
        {$scopedSlots.title()}
        {$scopedSlots.item({ value: "vue" })}
      </div>
    );
  }
};
</script>
```

对比下来能感觉到，同样一组组件，JSX 版本代码更长、更啰嗦，但每一行在做什么是确定的。模板版本更短，代价是你得知道那些指令和特性背后展开成了什么。

## 十、为什么需要vuex

组件通信这套东西，父传子用 props，子传父用事件，兄弟组件可以走事件总线。层级一深就变成了「props 一层层往下钻，事件一层层往上冒」，中间的组件明明用不上这些数据，却不得不当二传手。

![组件树中跨层级通信的困境，props 逐层传递与事件逐层冒泡](https://s.poetries.top/gitee/2019/10/vue/19.png)

Vuex 做的事情是把这些跨组件共享的状态抽出来，放到一个所有组件都能直接访问的地方。

**Vuex运行机制**

![Vuex 运行机制图，组件 dispatch 到 actions，commit 到 mutations，再改 state](https://s.poetries.top/gitee/2019/10/vue/20.png)

这张图要记的就一条链路：组件 `dispatch` 一个 action，action 里做异步，拿到结果 `commit` 一个 mutation，mutation 同步修改 state，state 是响应式的，组件自动更新。

为什么非要绕 `actions` 和 `mutations` 两层？因为 `mutations` 必须同步。devtools 靠记录每次 mutation 前后的状态快照来做时间旅行调试，异步一进来，快照对应不上操作，这个能力就废了。所以异步统一放 `actions`。

**基本例子**

```js
import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'

Vue.use(Vuex)
Vue.config.productionTip = false

const store = new Vuex.Store({
  state: {
    count: 0,
  },
  mutations: {
    increment(state) {
      state.count++
    }
  },
  actions: {
    increment({commit}) {
      setTimeout(()=>{
        // state.count++ // 不要对state进行更改操作，应该通过commit交给mutations去处理
        commit('increment')
      }, 3000)
    }
  },
  getters: {
    doubleCount(state) {
      return state.count * 2
    }
  }
})

new Vue({
  store,
  render: h => h(App),
}).$mount('#app')
```

注意 `actions` 里那行被注释掉的 `state.count++`，旁边写着「不要对 state 进行更改操作，应该通过 commit 交给 mutations 去处理」。这不是洁癖，绕过 mutation 改的 state，devtools 追踪不到，出问题的时候你会完全找不到是谁改的。

组件里用起来是这样：

```html
// App.vue

<template>
  <div id="app">
    {{count}}
    <br>
    {{$store.getters.doubleCount}}
    <button @click="$store.commit('increment')">count++</button>
    <button @click="$store.dispatch('increment')">count++</button>
  </div>
</template>

<script>

export default {
  name: 'app',
  computed: {
    count() {
      return this.$store.state.count
    }
  }
}
</script>

<style>

</style>
```

两个按钮分别演示 `commit` 和 `dispatch`。`commit('increment')` 是同步的，点了立刻加一；`dispatch('increment')` 走 action，里面有个 3 秒的 `setTimeout`，点了要等一会儿。这个对比把两者的分工说得很清楚。

`doubleCount` 是 getter，作用相当于 store 层面的计算属性，同样有缓存。派生数据放 getter 而不是在每个组件里各算一遍，是 Vuex 用得好不好的一个明显标志。

## 十一、vuex核心概念和底层原理

### 11.1 核心概念

![Vuex 的 State、Getter、Mutation、Action、Module 五个核心概念](https://s.poetries.top/gitee/2019/10/vue/23.png)

### 11.2 底层原理

那么 Vuex 的 state 是怎么变成响应式的？答案有点出人意料，它自己内部 new 了一个 Vue 实例。

![Vuex 底层实现示意，内部借助 Vue 实例实现 state 的响应式](https://s.poetries.top/gitee/2019/10/vue/22.png)

**简化版本的vuex**

三十行代码就能把这个思路演示清楚：

```js
import Vue from 'vue'
const Store = function Store (options = {}) {
  const {state = {}, mutations={}} = options
  
  // 把state进行响应式和vue写法一样
  this._vm = new Vue({
    data: {
      $$state: state
    },
  })
  this._mutations = mutations
}
Store.prototype.commit = function(type, payload){
  if(this._mutations[type]) {
    this._mutations[type](this.state, payload)
  }
}
Object.defineProperties(Store.prototype, { 
  // 当我们取值 如 $store.state.count 的时候就会触发这里
  state: { 
    get: function(){
      return this._vm._data.$$state
    } 
  }
});
export default {Store}
```

整段的核心是 `this._vm = new Vue({ data: { $$state: state } })` 这一句。把 state 塞进一个 Vue 实例的 `data` 里，Vue 的响应式系统就会自动把它整个劫持一遍。Vuex 没有自己实现响应式，它直接复用了 Vue 的。这也解释了为什么 Vuex 3 必须配合 Vue 2 使用，两者是绑死的。

`$$state` 这个双美元符号的命名不是随便起的。Vue 约定以 `$` 或 `_` 开头的实例属性不会被代理到实例上，这样外部就不能通过 `this._vm.$$state` 之类的路径直接摸到它，只能走 `Store.prototype` 上定义的那个 `state` getter。

再看 `Object.defineProperties` 那段，它只定义了 getter 没定义 setter。所以 `store.state = {}` 这种直接赋值会失败，逼着你只能通过 `commit` 去改。这个设计约束是刻意的。

`commit` 的实现也很朴素，从 `_mutations` 里按名字取出函数，把 `state` 和 `payload` 传进去调用。真实的 Vuex 在这基础上加了订阅机制、严格模式检查、模块的命名空间解析，但主干就是这几行。

响应式这块如果想再挖深一层，`Object.defineProperty` 是怎么劫持的、Dep 和 Watcher 怎么配合，我在 [Vue响应式原理模拟 手写一个迷你版Vue](https://feinterview.poetries.top/blog/vue-reative-summary) 里把五个类都手写了一遍。

## 十二、vuex最佳实践

知道怎么用之后，还有几条约定能让 store 在项目变大之后不失控。

### 12.1 核心概念

![Vuex 核心概念回顾，State、Getter、Mutation、Action、Module](https://s.poetries.top/gitee/2019/10/vue/23.png)

### 12.2 使用常量代替Mutation事件类型

![用常量定义 mutation types 的写法示意](https://s.poetries.top/gitee/2019/10/vue/24.png)

`commit('increment')` 里的字符串是个隐患：拼错了不报错，只是静默地什么都没发生。把这些事件类型抽到一个 `mutation-types.js` 里定义成常量，拼错就是引用了一个不存在的变量，构建阶段或者运行时立刻能发现。附带的好处是打开这个文件就能看到整个应用能发生哪些状态变更，相当于一份目录。

小项目里这套显得啰嗦，我自己在两三个页面的项目里也懒得抽。但只要 store 超过五个模块，这一步的收益就很明显了。

### 12.3 命名空间

对所有模块开启命名空间。

![Vuex 模块开启 namespaced 后的调用方式](https://s.poetries.top/gitee/2019/10/vue/25.png)

模块默认是不带命名空间的，模块里定义的 mutation 和 action 会被注册到全局。两个模块起了同名的 mutation，`commit` 一次会把两个都触发，而且不报任何错。这个坑很隐蔽，因为它的表现是「有个地方的数据莫名其妙变了」。

解决办法是每个模块都加上 `namespaced: true`，调用时带上路径 `commit('moduleA/increment')`。建议一开始就全开，等命名冲突真发生了再回来加，所有调用点都得改一遍。

### 12.4 实践例子

DEMO 地址：https://github.com/poetries/vuex-demo

### 12.5 Vuex 在今天

得说清楚，Vue 3 时代官方推荐的状态管理已经换成了 Pinia。Pinia 去掉了 `mutations` 这一层，直接在 action 里改 state，同步异步都在一个地方；TypeScript 的类型推导也比 Vuex 好得多。Vuex 仍在维护，老项目不用急着迁。

但上面这些判断没有过时。为什么要把共享状态抽出来、为什么派生数据要放在一个地方算、为什么模块要有命名空间，换成 Pinia 一样成立。Vue 3 的整体变化我整理在 [Vue3基础入门](https://feinterview.poetries.top/blog/vue3-base) 里。

## 十三、vue-router使用场景

### 13.1 解决的问题

![vue-router 解决的问题，单页应用中的视图切换与状态保持](https://s.poetries.top/gitee/2019/10/vue/26.png)

单页应用只有一个 html，所有「页面」都是同一个文档里的组件切换。路由要做的是把 URL 和组件对应起来，让用户能通过地址访问到特定视图，能前进后退，能收藏和分享链接。

### 13.2 使用方式

![vue-router 的基本使用方式，注册插件、定义路由表、挂载 router-view](https://s.poetries.top/gitee/2019/10/vue/27.png)

### 13.3 例子

先是入口，注册插件并创建 router 实例：

```js

// main.js
import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import routes from './routes'

Vue.config.productionTip = false

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  routes,
})

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
```

```html
// App.vue
<template>
  <div id="app">
    <h2>router demo</h2>
    <router-view></router-view>
  </div>
</template>

<script>

export default {
  name: 'app',
  components: {
  },
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
```

`<router-view>` 是路由匹配到的组件的渲染出口，放在哪里，页面就在哪里换内容。

路由表这份文件信息量最大：

```js
// routes.js
import RouterDemo from './components/RouterDemo'
import RouterChildrenDemo from './components/RouterChildrenDemo'

const routes = [
  { path: '/foo', component: RouterDemo, name: '1' },
  { path: '/bar', component: RouterDemo, name: '2' },
  // 当 /user/:id 匹配成功，
  // RouterDemo 会被渲染在 App 的 <router-view /> 中
  { path: '/user/:id', 
    component: RouterDemo, 
    name: '3',
    props: true,
    children: [
      {
        // 当 /user/:id/profile 匹配成功，
        // RouterChildrenDemo 会被渲染在 RouterDemo 的 <router-view/> 中
        path: 'profile',
        component: RouterChildrenDemo,
        name: '3-1'
      },
      {
        // 当 /user/:id/posts 匹配成功
        // RouterChildrenDemo 会被渲染在 RouterDemo 的 <router-view/> 中
        path: 'posts',
        component: RouterChildrenDemo
      }
    ]
  },
  { path: '/a', redirect: '/bar' },
  { path: '*', component: RouterDemo, name: '404' }
]

export default routes
```

这一份路由表里塞进了五种常见配置。`/user/:id` 是动态路由，冒号后面是参数名，组件里通过 `$route.params.id` 取；配了 `props: true` 之后，参数会直接作为 prop 传进组件，组件就不用依赖 `$route` 了，可复用性和可测试性都更好，这个写法值得养成习惯。

`children` 是嵌套路由，子路由的组件会渲染在父组件内部的 `<router-view>` 里。注意子路由的 `path` 写的是 `'profile'` 而不是 `'/profile'`，带斜杠会被当成根路径，这是嵌套路由最常见的配置错误。

`{ path: '/a', redirect: '/bar' }` 是重定向，`{ path: '*', component: RouterDemo }` 是通配兜底，也就是 404 页面。通配这条必须放在数组最后，因为路由是按顺序匹配的，放前面会把所有请求都吃掉。

更多详情：https://github.com/poetries/vue-router-demo

## 十四、路由的类型及底层原理

**路由的类型**

- `Hash` 模式：无法使用锚点定位
- `History` 模式：需要后端配合，IE9 不兼容，可以使用强制刷新处理

**原理**

![路由的底层原理，hash 模式监听 hashchange，history 模式基于 pushState](https://s.poetries.top/gitee/2019/10/vue/28.png)

两种模式的实现路子完全不同。

hash 模式靠的是 `window.onhashchange`。URL 里 `#` 后面的部分变化不会触发页面请求，浏览器只会派发一个 `hashchange` 事件，路由监听这个事件去做视图切换。好处是零成本，任何静态服务器都能跑；代价除了 URL 难看，还有一条容易忽略的：`#` 本身是锚点定位用的，路由占了它，页面内的锚点跳转就没法用了。

history 模式靠的是 HTML5 的 `pushState` 和 `replaceState`，它们能改地址栏但不发请求，配合 `popstate` 事件监听前进后退。URL 干净，但用户直接访问或者刷新 `/user/1` 的时候，请求是真的会发到服务器的，服务器上没有这个文件就返回 404。所以 history 模式必须让服务端把所有未匹配的路径都指回 `index.html`，nginx 里就是 `try_files $uri $uri/ /index.html;` 这一行。「需要后端配合」说的就是这件事。

至于 IE9，`pushState` 是 IE10 才支持的，vue-router 在不支持的环境下会自动回退到 hash 模式。所谓「强制刷新处理」是指在这类环境下把路由跳转降级成 `location.href` 整页跳转。这条现在基本不用管了，IE 已经退役。

## 总结

一圈梳理下来，几个我认为最值得记住的点：

- 组件通信就三条通道，props 往下传数据、事件往上报变化、插槽往里塞结构，`v-model` 只是前两条的语法糖，从没打破单向数据流
- props 声明用对象写法，对象和数组的默认值必须用工厂函数，否则多个实例会共享同一个引用
- 阻止冒泡优先用 `.stop` 修饰符，写在方法体里的 `stopPropagation` 时机不可控
- Vue 2 里新增属性、数组下标赋值、改 `length` 都不会触发更新，得用 `$set` 和被重写过的数组方法；Vue 3 换成 Proxy 之后这些坑消失了
- 能从已有数据推导出来的用 `computed`，需要异步、延时、操作 DOM 的用 `watch`；`computed` 包非响应式数据（比如 `Date.now()`）拿不到预期结果
- `created` 发请求，`mounted` 操作 DOM，`beforeDestroy` 清定时器和监听，这三条覆盖生命周期的绝大多数实际用途
- 自定义指令里读写 DOM 用 `inserted` 和 `componentUpdated`，别用 `bind` 和 `update`
- 业务组件用模板，需要动态决定渲染结构的用 JSX，JSX 里传 props 要走 `{...{ props: {} }}` 这种展开写法
- Vuex 的 state 响应式是直接复用了 Vue 实例的 `data`，所以它和 Vue 的版本是绑死的
- 模块一律开 `namespaced: true`，mutation 类型抽成常量，这两条能省掉后期很多排查时间
- hash 模式监听 `hashchange`，history 模式基于 `pushState` 加服务端兜底，后者的「需要后端配合」是一条 nginx 配置

这些东西单独看都不难，难的是把它们串成一条线。我的经验是，把这篇里的代码挑几段自己敲一遍再改坏一次，比反复读要有效得多。

## 参考

- [Vue 2 官方文档](https://v2.cn.vuejs.org/)
- [Vue 2 - 自定义指令](https://v2.cn.vuejs.org/v2/guide/custom-directive.html)
- [Vue 2 - 渲染函数 & JSX](https://v2.cn.vuejs.org/v2/guide/render-function.html)
- [Vuex 3 官方文档](https://v3.vuex.vuejs.org/zh/)
- [Vue Router 3 官方文档](https://v3.router.vuejs.org/zh/)
- [Pinia 官方文档](https://pinia.vuejs.org/zh/)
- [MDN - History.pushState](https://developer.mozilla.org/zh-CN/docs/Web/API/History/pushState)
- [前端进阶之旅](https://interview.poetries.top)
