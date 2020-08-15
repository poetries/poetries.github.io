---
title: Vue核心梳理
date: 2019-10-06 18:10:32
tags: Vue
categories: Front-End
---

## 一、组件的核心概念-属性props几种写法

> 我们的开发都是围绕着`options`来的

![](https://poetries1.gitee.io/img-repo/2019/10/vue/1.png)


![](https://poetries1.gitee.io/img-repo/2019/10/vue/2.png)

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

## 二、组件的核心概念-事件

![](https://poetries1.gitee.io/img-repo/2019/10/vue/3.png)

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

## 三、组件的核心概念-插槽

![](https://poetries1.gitee.io/img-repo/2019/10/vue/4.png)

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


![](https://poetries1.gitee.io/img-repo/2019/10/vue/5.png)

**大属性例子**

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

## 四、双向绑定和单项数据流并不冲突

![](https://poetries1.gitee.io/img-repo/2019/10/vue/6.png)

![](https://poetries1.gitee.io/img-repo/2019/10/vue/7.png)

## 五、如何触发组件的更新

![](https://poetries1.gitee.io/img-repo/2019/10/vue/8.png)

![](https://poetries1.gitee.io/img-repo/2019/10/vue/9.png)

![](https://poetries1.gitee.io/img-repo/2019/10/vue/11.png)

## 六、合理应用计算属性和监听器

### 6.1 计算属性Computed

- 减少模板中的计算逻辑
- 数据缓存
- 依赖固定的数据类型（响应式数据）

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

### 6.2 监听watcher

- 更加灵活通用
- `watcher`可以执行任何逻辑，包括函数节流、ajax异步获取数据

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

**watcher中使用节流**

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

### 6.3 computed vs watcher

- `computed` 能做的，`watcher` 都可以做，反之不行
- 能用computed的尽量使用`computed`

## 七、生命周期的应用场景和函数式组件


### 7.1 生命周期

![](https://poetries1.gitee.io/img-repo/2019/10/vue/12.png)

![](https://poetries1.gitee.io/img-repo/2019/10/vue/13.png)

![](https://poetries1.gitee.io/img-repo/2019/10/vue/14.png)

![](https://poetries1.gitee.io/img-repo/2019/10/vue/15.png)

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

> 打印顺序 `beforeCreate - data - created - beforeMount - render - mounted`

### 7.2 函数式组件

- `functional：true`
- 无状态、无实例、没有`this`上下文、没有生命周期

```js
// TempVar.js
export default {
  functional: true,
  render: (h, ctx) => {
    return ctx.scopedSlots.default && ctx.scopedSlots.default(ctx.props || {});
  }
};
```

```html
// Functional.vue
<template functional>
  <div>
    {{ props }}
  </div>
</template>
```

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

![](https://poetries1.gitee.io/img-repo/2019/10/vue/16.png)

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
    <h2>v-if v-esle-if v-else</h2>
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

### 8.2 自定义指令

![](https://poetries1.gitee.io/img-repo/2019/10/vue/17.png)

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

## 九、template和jsx

### 9.1 JSX VS template

**Template**

- 学习成本低
- 大量内置指令简化开发
- 组件作用域css
- 但灵活性低

**JSX**

- 总体上很灵活

### 9.2 以下是jsx写法

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

## 十、为什么需要vuex


![](https://poetries1.gitee.io/img-repo/2019/10/vue/19.png)

**Vuex运行机制**


![](https://poetries1.gitee.io/img-repo/2019/10/vue/20.png)

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

## 十一、vuex核心概念和底层原理

### 11.1 核心概念

![](https://poetries1.gitee.io/img-repo/2019/10/vue/23.png)


### 11.2 底层原理

![](https://poetries1.gitee.io/img-repo/2019/10/vue/22.png)

**简化版本的vuex**

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
  // 当我们取值 如 $store.getter.count的时候就会触发这里
  state: { 
    get: function(){
      return this._vm._data.$$state
    } 
  }
});
export default {Store}
```

## 十二、vuex最佳实践

### 12.1 核心概念

![](https://poetries1.gitee.io/img-repo/2019/10/vue/23.png)

### 12.2 使用常量代替Mutation事件类型

![](https://poetries1.gitee.io/img-repo/2019/10/vue/24.png)

### 12.3 命名空间

> 对所有模块开启命名空间

![](https://poetries1.gitee.io/img-repo/2019/10/vue/25.png)


### 12.4 实践例子

> DEMO地址 https://github.com/poetries/vuex-demo


## 十三、vue-router使用场景

### 13.1 解决的问题

![](https://poetries1.gitee.io/img-repo/2019/10/vue/26.png)

### 13.2 使用方式

![](https://poetries1.gitee.io/img-repo/2019/10/vue/27.png)

### 13.3 例子

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

> 更多详情 https://github.com/poetries/vue-router-demo

## 十四、路由的类型及底层原理

**路由的类型**

- `Hash`模式：无法使用锚点定位
- `History`模式：需要后端配合，IE9不兼容，可以使用强制刷新处理

**原理**

![](https://poetries1.gitee.io/img-repo/2019/10/vue/28.png)
