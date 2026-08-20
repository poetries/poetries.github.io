---
title: Vue3笔记总结 组合式API与新特性完整梳理
description: 从 Composition API 的由来记到 setup、ref、reactive、生命周期、Suspense、Teleport，一份完整的 Vue3 笔记总结，并标注这几年已经变化的写法。
date: 2020-12-27 18:12:32
tags:
  - Vue
  - Vue3
  - CompositionAPI
categories: Front-End
---

这篇笔记是 2020 年底 Vue 3 正式发布那阵子整理的。写 Vue 2 的时候有个很磨人的体验，一个功能稍微复杂点的组件，同一件事的代码会被 options 的结构切成好几块，状态放 `data`，函数放 `methods`，派生值放 `computed`，副作用放 `watch`，想看清一条完整逻辑得在文件里上下翻好几趟。Composition API 就是冲着这件事来的。

下面把当时学的东西按顺序记一遍，从为什么要有 Composition API，到 setup、ref、reactive、生命周期、watch，再到 Suspense 和 Teleport 这两个新组件。另外这几年 Vue 3 的 API 定稿了不少，最后我单独加了一节，说明哪些写法已经变了。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Vue 2 的 Options API 到底卡在哪，Composition API 解决的是什么
- Mixin、Mixin Factory、作用域插槽、Composition API 四种复用方案的取舍
- `setup` 的执行时机、两个参数，以及 `ref` 的装箱与自动拆箱
- `reactive` 和 `toRefs` 的配合方式，以及什么时候该用哪个
- 生命周期钩子在 Vue 3 里的对应关系和新增的两个调试钩子
- `watch` 与 `watchEffect` 的五种常见写法
- 用组合函数封装 Promise 状态，实现跨组件的状态共享
- Suspense 处理异步加载和骨架屏，Teleport 把 DOM 传送到任意位置
- 这份 2020 年的笔记里，哪些写法到现在已经变了

## 一、为什么要有 CompositionAPI

### Vue2 的局限性

先说结论，Options API 不是写不了复杂组件，是写完之后没法读。具体卡在三个地方：

- 组件逻辑膨胀导致的可读性变差
- 无法跨组件重用代码
- Vue 2 对 TS 的支持有限

在传统的 Options API 中，我们需要把逻辑分散到以下六个部分：

- `components`
- `props`
- `data`
- `computed`
- `methods`
- `lifecycle methods`

问题不在于这六个格子本身，而在于它是按「代码的种类」分的，不是按「功能」分的。一个搜索框的逻辑，输入值在 `data`，防抖函数在 `methods`，过滤结果在 `computed`，请求触发在 `watch`。功能只有一个，代码却散在四个地方。组件小的时候没感觉，一旦一个组件里塞了搜索、排序、分页、导出四件事，这四条逻辑就在文件里彼此交织。

### 如何使用CompositionAPI解决问题

思路很直接，把同一个功能的代码聚到一起，可读性自然就回来了。

Composition API 是一个完全可选的语法，和原来的 Options API 并没有冲突。它让我们把相同功能的代码组织在一起，而不需要散落到 Options API 的各个角落。排序的状态、排序的方法、排序的计算属性，全部写在相邻的十几行里，读代码的人一眼扫过去就知道这块在干什么。

### 代码重用方法PK

聚合只解决了「一个组件内部」的问题。跨组件复用是另一件事。Vue 2 里我们大概有四个选择。

第一个是 Mixin 混入。

![Vue2 中使用 Mixin 混入复用逻辑的示意](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e44a48562d264ec986d993111b8f0a49~tplv-k3u1fbpfcp-zoom-1.image)

代码混入其实就是设计模式里的混合模式，缺点也非常明显。可以理解成多重继承，一个人如何有两个父亲。

缺点有两个：

- 无法避免属性名冲突
- 继承关系不清晰

属性名冲突这条是真的会咬人。你在组件里定义了一个 `loading`，混入的 mixin 里也有一个 `loading`，Vue 会按规则合并，但合并的结果往往不是你想要的。更麻烦的是继承关系不清晰，一个组件混了三个 mixin，模板里看到一个 `handleSubmit`，你得挨个翻文件才知道它是谁提供的。

第二个是 Mixin Factory 混入工厂，返回一个混入对象。

![Mixin Factory 混入工厂返回混入对象的写法](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ee2f700908ef4403aad0fcd7f7f5f919~tplv-k3u1fbpfcp-zoom-1.image)

优点是代码重用方便，继承关系也清晰了，因为你能在调用工厂函数时把命名传进去。代价是模板变复杂，写起来啰嗦。

第三个是 ScopeSlots 作用域插槽。这个方案的问题比较集中：

- 可读性不高
- 配置复杂，需要在模板中进行配置
- 性能低，每个插槽相当于一个实例

第四个才是 Composition API 复合 API。

![CompositionApi 复合 API 的复用方式](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2b096a64fe5c475e9952d5c83b732506~tplv-k3u1fbpfcp-zoom-1.image)

它的优势是这样几条：代码量少；没有引入新的语法，只是单纯的函数；异常灵活；工具语法提示友好，因为是单纯函数，所以很容易实现语法提示和自动补全。

最后这条我觉得被低估了。Mixin 和作用域插槽之所以对 TypeScript 不友好，是因为它们的组合发生在 Vue 的运行时，类型系统看不见。而组合函数就是一个普通函数调用，返回值的类型编辑器直接就能推出来。

## 二、setup 与 ref

### 使用CompositionAPI的理由

用它主要图三件事：更好的 TypeScript 支持；在复杂功能组件中可以按特性组织代码，比如把排序和搜索逻辑各自内聚成一块；组件间的代码复用。

### setup是什么

`setup` 在以下这些之前执行：

- Components
- Props
- Data
- Methods
- Computed Properties
- Lifecycle methods

它有两个好处。一是可以不再使用难于理解的 `this`，二是它有两个可选参数。

第一个参数是 `props`，它是一个响应式对象，而且可以被监听。

```js
import {watch} from "vue"
export default {
	props: {
		name: String
	},
	setup(props) {
		watch(() => {
			console.log(props.name)
		})
	}
}
```

这里插一句，上面这段是 2020 年那会儿的写法，`watch` 传单个函数在当时能跑通。现在这种「不指定数据源、自动收集依赖」的用法对应的是 `watchEffect`，具体请以官方文档为准，我在第十二节还会展开说。

第二个参数是 `context` 上下文对象，用来代替以前 `this` 上能访问到的一些东西：

```js
setup (props, context) {
	const {attrs, slots, parent, root, emit} = context
}
```

这段也要提醒一句。`parent` 和 `root` 是 Vue 3 早期版本上的字段，正式版的 setup context 已经收敛了，具体暴露哪几个属性请以官方文档为准。这一节先按原来的理解往下走，不影响你理解 setup 的定位。

### ref是什么

对基本数据类型的数据进行装箱操作，使它成为一个响应式对象，从而可以跟踪数据变化。

为什么非得装箱？因为 JavaScript 的原始值是按值传递的，你把一个数字赋给另一个变量，两者之间没有任何联系，Vue 没有办法在它变化时收到通知。装进一个对象里就不一样了，`ref` 返回的是一个带 `value` 属性的对象，读 `.value` 时收集依赖，写 `.value` 时触发更新。

`ref` 的存在不是为了好看，是为了给原始值找一个能被追踪的壳。

### 小结

![setup 与 ref 的可维护性对比总结](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3fdabdbdb577445ebce43d895602fa3d~tplv-k3u1fbpfcp-zoom-1.image)

可维护性的提升体现在两点：可以控制哪些变量暴露出去，以及可以追踪哪些属性被定义过，也就是属性继承与引用透明。Options API 里 `data` 返回的每个字段都会自动挂到实例上，模板能用，混入能改；`setup` 里你返回什么，外面才能拿到什么。

## 三、Methods 与自动拆装箱

### 基础用法

![setup 中定义方法的基础用法](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/145e67db4db94c7bad56186760a182ae~tplv-k3u1fbpfcp-zoom-1.image)

方法在 `setup` 里就是一个普通的函数声明，不需要挂到 `methods` 下面，也不需要 `this`。用到哪个响应式变量就直接闭包引用它，最后一起 return 出去。

### 自动拆装箱

![ref 的自动拆装箱规则](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9036b7bd5e724beca4dc723d22f3c384~tplv-k3u1fbpfcp-zoom-1.image)

规则就两条：

- JS 里需要通过 `.value` 访问包装对象
- 模板里自动拆箱

这里有个坑要注意。模板的自动拆箱只对 `setup` 返回的顶层 ref 生效。如果你返回的是一个普通对象，对象里面套了一个 ref，模板里访问这个嵌套字段是不会自动拆的，还得写 `.value`。我一开始也是这么想的，以为拆箱是全自动的，结果模板里渲染出来一个 `[object Object]`，排查了一会儿才反应过来是嵌套层级的问题。

## 四、Computed 计算属性

这个地方实在没什么好讲的，和 Vue 2 没变化，只是从 options 的一个字段变成了从 `vue` 里 import 进来的函数。

```vue
<template>
  <div>
    <div>Capacity: {{ capacity }}</div>
    <p>Spaces Left: {{ spacesLeft }} out of {{ capacity }}</p>
    <button @click="increaseCapacity()">Increase Capacity</button>
  </div>
</template>

<script>
import { ref, computed } from "vue";
export default {
  setup(props, context) {
    const capacity = ref(3);
    const attending = ref(["Tim", "Bob", "Joe"]);
    function increaseCapacity() {
      capacity.value++;
    }
    const spacesLeft = computed(() => {
      return capacity.value - attending.value.length;
    });
    return { capacity, increaseCapacity, attending, spacesLeft };
  },
};
</script>
```

注意 `computed` 的回调里访问 `capacity` 必须写 `.value`，因为那是 JS 环境。模板里的 `spacesLeft` 不用写，因为那是模板环境。同一个变量，两种写法，刚上手确实容易搞混。

## 五、Reactive 响应式语法

之前我们用 `ref` 去声明所有的响应式属性：

```js
import { ref, computed } from 'vue'
export default {
  setup(){
    const capacity = ref(4);
    const attending = ref(["Tim","Bob","Joe"]);
    const spacesLeft = computed(()=>{
      return capacity.value - attending.value.length
    })
    function increaseCapacity(){ capacity.value++; }
    return { capacity, increaseCapacity, attending, spacesLeft }
  }
}
```

但是有另一个等效的方法，可以用它代替一堆 `ref`：

```js
import { reactive, computed } from 'vue'
export default {
  setup(){
    const event = reactive({
      capacity: 4,
      attending: ["Tim","Bob","Joe"],
      spacesLeft: computed(()=>{
        return event.capacity - event.attending.length;
      })
    })
    return { event }
  }
}
```

过去我们用 Vue 2 的 `data` 来声明响应式对象，现在在这里每一个属性都是响应式的，包括 `computed` 计算属性。这两种方式相比，第二种没有到处写 `.value`，读起来清爽一些。

接下来再声明 method，两种语法都可以，取决于你选哪一种：

```js
import { reactive, computed } from 'vue'
export default {
  setup(){
    const event = reactive({
      capacity: 4,
      attending: ["Tim","Bob","Joe"],
      spacesLeft: computed(()=>{
        return event.capacity - event.attending.length;
      })
    })
    function increaseCapacity(){ event.capacity++ }
    // return 整个对象
    return { event, increaseCapacity }
  }
}
```

模板里就通过 `event.xxx` 访问：

```html
<p>Spaces Left: {{ event.spacesLeft }} out of {{ event.capacity }}</p>
<h2>Attending</h2>
<ul>
  <li v-for="(name, index) in event.attending" :key="index">
    {{ name }}
  </li>
</ul>
<button @click="increaseCapacity()">Increase Capacity</button>
```

在这里我们访问对象都是点属性的方式。但如果这个结构变了，`event` 被拆成了一个个片段，这个时候就不能用点属性的方式了。那怎么办呢？

用 `toRefs`。

```js
// 在这里可以使用 toRefs
import { reactive, computed, toRefs } from 'vue'
export default {
  setup(){
    const event = reactive({
      capacity: 4,
      attending: ["Tim","Bob","Joe"],
      spacesLeft: computed(()=>{
        return event.capacity - event.attending.length;
      })
    })
    function increaseCapacity(){ event.capacity++ }
    return { ...toRefs(event), increaseCapacity }
  }
}
```

`toRefs` 做的事情，是把一个响应式对象的每个属性都转成一个独立的 ref，并且这个 ref 和原对象保持双向连接。所以解构之后响应性不会丢，模板里也能直接写 `capacity` 而不用写 `event.capacity`。

如果没有 `increaseCapacity` 这个方法，直接可以简化成一行：

```js
return toRefs(event)
```

把两种写法放一起对比，差别就很清楚了：

```js
// 第一种：全部用 ref
import { ref, computed } from 'vue'
export default {
  setup(){
    const capacity = ref(4)
    const attending = ref(["Tim","Bob","Joe"])
    const spacesLeft = computed(()=>{
      return capacity.value - attending.value.length;
    });
    function increaseCapacity(){ capacity.value++; }
    return { capacity, increaseCapacity, attending, spacesLeft }
  }
}
```

```js
// 第二种：用 reactive 聚成一个对象
import { reactive, computed } from 'vue'
export default {
  setup(){
    const event = reactive({
      capacity: 4,
      attending: ["Tim","Bob","Joe"],
      spacesLeft: computed(()=>{
        return event.capacity - event.attending.length;
      })
    })
    // 我们不再使用 .value
    function increaseCapacity() { event.capacity++; }
    // 把这个 event 放入到 template 中
    return { event, increaseCapacity }
  }
}
```

我自己的感受是，状态少的时候 `ref` 更直接，一眼能看出哪些是响应式的；状态多而且属于同一个业务实体的时候，`reactive` 聚成一个对象更好维护。真正要避开的是把 `reactive` 对象整个解构出去，那样响应性会断掉，除非配合 `toRefs`。

## 六、Modularizing 按功能拆分模块

使用 Composition API 的两个理由，到这里就能落地了。

第一个是可以按照功能组织代码。

![按照功能组织代码的效果示意](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/997110346e1c461a9552a9d421fa8152~tplv-k3u1fbpfcp-zoom-1.image)

第二个是组件间的功能代码复用。

![把功能抽成组合函数在组件间复用](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/70c637236436425caa46c933dba3ce37~tplv-k3u1fbpfcp-zoom-1.image)

![组合函数在多个组件中被调用的结构](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1ff23cea4a554e6499d773e48f3d85b9~tplv-k3u1fbpfcp-zoom-1.image)

拆分的粒度按功能走就行，别按代码种类走。一个 `useSearch.js` 里放搜索的状态、方法和计算属性，一个 `useSort.js` 里放排序的，组件的 `setup` 就变成几行调用加一个 return。文件是多了，但每个文件的职责清楚，改搜索逻辑的时候你只用打开一个文件。

## 七、LifecycleHooks 生命周期钩子

Vue2 | Vue3
---|---
beforeCreate | ❌setup(替代)
created | 	❌setup(替代)
beforeMount |  onBeforeMount
mounted |  onMounted
beforeUpdate |  onBeforeUpdate
updated |  onUpdated
beforeDestroy |  onBeforeUnmount
destroyed |  onUnmounted
errorCaptured |  onErrorCaptured
 - |  🎉onRenderTracked
 - |  🎉onRenderTriggered

有几个点值得单独说。`beforeCreate` 和 `created` 没有对应的组合式钩子，因为 `setup` 本身就在这两个时机之间执行，你要在这里干的事直接写在 `setup` 里就行。`beforeDestroy` 和 `destroyed` 改名成了 `onBeforeUnmount` 和 `onUnmounted`，unmount 这个词比 destroy 更准确，组件只是从 DOM 上卸载了，实例并不一定被销毁。

新增的 `onRenderTracked` 和 `onRenderTriggered` 是调试用的。前者在依赖被追踪时触发，后者在依赖变化触发重新渲染时触发。排查「这个组件为什么老是重渲染」的时候特别好使，能直接告诉你是哪个响应式属性动了。这两个钩子只在开发模式下工作。

除了表里这些，还有 `onActivated` 和 `onDeactivated` 对应 `keep-alive` 的两个钩子，用法一样。

在 setup 中调用生命周期钩子：

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

顺带说个细节，这些钩子必须在 `setup` 的同步执行流程里调用，不能放在 `setTimeout` 或者 `await` 之后。因为 Vue 是靠「当前正在执行哪个组件的 setup」这个全局状态来把钩子绑到组件实例上的，异步之后这个上下文就没了。

## 八、Watch 监听器

`watch` 这块的几种写法一次列全，实际项目里这五种基本够用：

```js
// 所有依赖响应式对象监听
watchEffect(() => {
  results.value = getEventCount(searchInput.value);
});

// 特定响应式对象监听
watch(
  searchInput,
  () => {
    console.log("watch searchInput:");
  }
);

// 特定响应式对象监听 可以获取新旧值
watch(
  searchInput,
  (newVal, oldVal) => {
    console.log("watch searchInput:", newVal, oldVal);
  },
);

// 多响应式对象监听
watch(
  [firstName, lastName],
  ([newFirst, newLast], [oldFirst, oldLast]) => {
    // .....
  },
);

// 非懒加载方式监听 可以设置初始值
watch(
  searchInput,
  (newVal, oldVal) => {
    console.log("watch searchInput:", newVal, oldVal);
  },
  {
    immediate: true,
  }
);
```

回到这块，`watchEffect` 和 `watch` 的区别是依赖收集的方式。`watchEffect` 会立即执行一次回调，执行过程中碰到哪个响应式数据就自动把它记为依赖，以后任何一个变了都会重跑。`watch` 要你明确指定数据源，只有这个源变了才跑，而且默认是懒执行，不加 `immediate: true` 首次不会触发。

想省事就用 `watchEffect`，想精确控制触发时机、需要新旧值对比、或者要避免误收集依赖，就用 `watch`。我踩过一次坑是在 `watchEffect` 里顺手读了一个不相关的响应式变量做日志，结果那个变量一变整个副作用就重跑一遍，接口被打了好多次。

## 九、Sharing State 共享状态

![组合函数实现跨组件状态共享的结构](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7f34ac88fffa49eea6b36365821cf32d~tplv-k3u1fbpfcp-zoom-1.image)

来写一个公共函数 `usePromise`，需求是这样的：

- `results`：返回 Promise 执行结果
- `loading`：返回 Promise 运行状态，PENDING 时为 `true`，REJECTED 和 RESOLVED 时为 `false`
- `error`：返回执行错误

![usePromise 组合函数的返回值设计](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/79eae593674e4feab40c9c7f312488cf~tplv-k3u1fbpfcp-zoom-1.image)

实现只有二十来行，核心就是把 `loading`、`error`、`results` 三个 ref 和一次异步调用绑在一起：

```js
import { ref } from "vue";

export default function usePromise(fn) {
  const results = ref(null);
  // is PENDING
  const loading = ref(false);
  const error = ref(null);

  const createPromise = async (...args) => {
    loading.value = true;
    error.value = null;
    results.value = null;
    try {
      results.value = await fn(...args);
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  };
  return { results, loading, error, createPromise };
}
```

注意 `finally` 里那句 `loading.value = false`。不管成功还是失败都要把 loading 关掉，不然一次请求报错，页面上的转圈就永远停不下来。这种模板代码写一次封装好，全项目的异步请求都能省掉。

应用起来是这样：

```js
import { ref, watch } from "vue";
import usePromise from "./usePromise";
export default {
  setup() {
    const searchInput = ref("");
    function getEventCount() {
      return new Promise((resolve) => {
        setTimeout(() => resolve(3), 1000);
      });
    }

    const getEvents = usePromise((searchInput) => getEventCount());

    watch(searchInput, () => {
      if (searchInput.value !== "") {
        getEvents.createPromise(searchInput);
      } else {
        getEvents.results.value = null;
      }
    });

    return { searchInput, ...getEvents };
  },
};
```

这里有个真实场景下要补的东西，上面的写法没有做请求竞态处理。用户连续输入的时候会发出多个请求，返回顺序不保证，后发的可能先回。真要上生产，还得加一个请求序号或者 `AbortController` 来丢弃过期结果。这块笔记里当时没写，算是个遗漏。

## 十、Suspense 悬念

### 复杂的Loading实现

我们考虑一下，当你加载一个远程数据时，怎么显示 loading 状态。

通常我们可以在模板中使用 `v-if`：

![用 v-if 控制单个组件的 loading 状态](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ea10d14558994eab82a3f83858a8f45a~tplv-k3u1fbpfcp-zoom-1.image)

但在一个组件树中，其中几个子组件需要远程加载数据，当加载完成前父组件希望处于 loading 状态时，我们就必须借助全局状态管理来管理这个 loading 状态。

![多个子组件异步加载时父级 loading 状态的管理难题](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/15d5b1fb66c543bcb9ccbb7fcd512884~tplv-k3u1fbpfcp-zoom-1.image)

为了一个转圈动画去动全局 store，这事本身就说明抽象漏了。

### Suspense基础语法

这个问题在 Vue 3 中有一个全新的解决方法，就是 Suspense Component 悬念组件。

![Suspense 组件的 default 与 fallback 两个插槽](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ae2eaf2667264ffea020f3f33e88224e~tplv-k3u1fbpfcp-zoom-1.image)

它的模型是这样的：`default` 插槽里放真正要渲染的内容，`fallback` 插槽里放等待时的占位。只要 `default` 里任何一个后代组件还在等待异步依赖，整棵子树就都显示 fallback，全部就绪了才一起换上真身。

```vue
<template>
  <div>
    <div v-if="error">Uh oh .. {{ error }}</div>
    <Suspense>
      <template #default>
        <div>
          <Event />
          <AsyncEvent />
        </div>
      </template>
      <template #fallback> Loading.... </template>
    </Suspense>
  </div>
</template>

<script>
import { ref, onErrorCaptured, defineAsyncComponent } from "vue";

import Event from "./Event.vue";

const AsyncEvent = defineAsyncComponent(() => import("./Event.vue"));
export default {
  components: {
    Event,
    AsyncEvent,
  },

  setup() {
    const error = ref(null);
    onErrorCaptured((e) => {
      error.value = e;
      // 阻止错误继续冒泡
      return true;
    });
    return { error };
  },
};
</script>
```

`onErrorCaptured` 里那句 `return true` 别漏了，它的作用是阻止错误继续往上冒泡。异步组件加载失败是很常见的事，网络抖一下、chunk 404 了都会走到这里，如果不拦住，错误会一路冒到全局的 `errorHandler`。

Suspense 不负责错误处理，它只管等待，出错了得你自己接。

### 骨架屏实现

![用 Suspense 的 fallback 实现骨架屏](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1066b78a6e424ca991e5c95691fa44cf~tplv-k3u1fbpfcp-zoom-1.image)

![骨架屏在页面加载过程中的渲染效果](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f66859b79e164c66978a9607cecf0704~tplv-k3u1fbpfcp-zoom-1.image)

骨架屏就是把 `fallback` 里的 `Loading....` 换成一组灰块占位。相比一个居中的转圈图标，骨架屏能让页面的布局在数据回来之前就稳定下来，切换时的跳动会小很多。

要提醒一句，Suspense 从 Vue 3 发布到现在，官方文档上一直标着实验性特性，API 有可能调整。真要用在生产项目里，用之前请以官方文档当时的状态为准。

## 十一、Teleport 传送门

### 功能

类似 React 中的 Portal，可以将特定的 HTML 模板传送到 DOM 的任何位置。

![Teleport 把内容传送到 DOM 任意位置的示意](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c4284c1e65a44103861d11a7a9681c5a~tplv-k3u1fbpfcp-zoom-1.image)

这个东西解决的是一类很具体的麻烦。弹窗、下拉菜单、全屏遮罩这些组件，逻辑上属于某个业务组件，DOM 上却必须挂到 body 下面，否则父级的 `overflow: hidden`、`transform`、`z-index` 层叠上下文随便一个都能把它裁掉或者压住。Teleport 之前的通用解法是手写一个 `appendChild` 到 body 再自己管理销毁，代码丑而且容易漏。

### 基础语法

通过选择器 querySelector 配置目标位置。

![Teleport 通过选择器指定目标容器](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ff506f248d0041b8a44151bf7192cacd~tplv-k3u1fbpfcp-zoom-1.image)

### 示例代码

![Teleport 示例代码与运行结果](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/173de4724de64b9eb97776b3bb9afc8a~tplv-k3u1fbpfcp-zoom-1.image)

```vue
<template>
  <div>
    <teleport to="#end-of-body" :disabled="!showText">
      <!-- 【Teleport : This should be at the end 】 -->
      <div>
        <video src="../assets/flower.webm" muted controls="controls" autoplay="autoplay" loop="loop">
        </video>
      </div>
    </teleport>
    <div>【Teleport : This should be at the top】</div>
    <button @click="showText = !showText">Toggle showText</button>
  </div>
</template>
<script>
import { ref } from "vue";
export default {
  setup() {
    const showText = ref(false);
    setInterval(() => {
      showText.value = !showText.value;
    }, 1000);
    return { showText };
  },
};
</script>
```

`disabled` 这个属性很实用，值为 `true` 时内容留在原地不传送。做响应式弹窗的时候，桌面端传到 body 下面做居中遮罩，移动端留在原地做行内展开，一个属性就切了。

还有两个前提要记住：`to` 指向的目标元素必须在组件挂载之前就已经存在于 DOM 里，Vue 不会帮你创建它；被传送走的内容，逻辑上仍然是原组件的子节点，`props`、`provide/inject`、事件冒泡全都按组件树走，不按 DOM 树走。

这个设计是真的舒服，DOM 位置和逻辑归属被彻底解耦了。

## 十二、这份笔记里哪些写法后来变了

这篇是 2020 年 12 月写的，Vue 3 刚发布不久，有些 API 当时还在调整。下面这几条是我后来回头对照发现有出入的地方，原文的写法上面都保留着，这里单独说明。

关于 `setup` 的第二个参数。上面写的是 `const {attrs, slots, parent, root, emit} = context`，其中 `parent` 和 `root` 是早期版本上的字段。正式版的 setup context 已经收窄了，日常能用到的主要是 `attrs`、`slots`、`emit` 这几个，另外还有一个用来控制对外暴露内容的方法。具体到底暴露哪几个，请以官方文档为准，别照着这篇的解构写。

关于 `watch` 传单个函数。第二节里那段 `watch(() => { console.log(props.name) })` 是当时能跑的写法。现在这种自动收集依赖的用法对应的是 `watchEffect`，`watch` 则需要明确传入监听源。第八节的五种写法是符合现在规范的，可以直接照抄。

关于 `export defalut`。原文那段代码里有个拼写错误，正确的是 `export default`，这次顺手改掉了。

关于组件的组织方式。这篇通篇用的是 `export default { setup() {...} }` 这种写法。Vue 3.2 之后有了 `script setup` 语法糖并且标记为稳定，它把整个单文件组件的脚本块当作 `setup` 函数体，顶层的变量和函数自动暴露给模板，不用再写 return，props 和 emits 通过编译宏声明。现在新项目基本都直接用它了。原来的写法并没有废弃，两种都能跑，只是 `script setup` 少写不少样板代码。

关于状态管理。这篇第九节用组合函数做共享状态，思路到现在依然成立。项目级别的全局状态，官方推荐的方案已经从 Vuex 换成了 Pinia，它的 API 和组合式写法更贴合。

关于 Suspense。到现在文档上仍然标着实验性，用之前请以官方文档为准。

最后一条，Vue 2 已经在 2023 年底停止官方维护了。如果你现在还在维护 Vue 2 项目，升级这件事优先级可以往上提一提。想先熟悉一下语法可以看这两篇：[Vue3 基础](https://feinterview.poetries.top/blog/vue3-base) 和 [Vue3 Composition API](https://feinterview.poetries.top/blog/vue3-composition-api)。

## 总结

回过头看，Vue 3 这套 Composition API 真正改变的不是语法，是组织代码的单位。Options API 的单位是「代码的种类」，Composition API 的单位是「功能」，所以一个组件复杂到一定程度之后，前者会越来越难读，后者不会。

具体到几个 API 的选用，我的判断是这样：单个的、原始类型的状态用 `ref`；同属一个业务实体的一组状态用 `reactive`，要解构就配 `toRefs`；副作用逻辑优先用 `watch` 明确指定源，图省事再用 `watchEffect`；可复用的逻辑一律抽成 `useXxx` 组合函数，别再碰 mixin。

Suspense 和 Teleport 是两个补齐能力短板的组件。Teleport 已经稳定可用，弹窗类组件建议直接上；Suspense 到现在还标着实验性，用之前看一眼文档的状态。

这篇笔记的价值在于它记录了 Vue 3 刚落地时的完整思路。API 细节会变，但「为什么要这么设计」这件事不太会变，这也是我这次没有把老写法删掉、只在旁边加说明的原因。

## 参考

- [Vue 3 官方文档 组合式 API](https://cn.vuejs.org/guide/extras/composition-api-faq.html)
- [Vue 3 官方文档 生命周期钩子](https://cn.vuejs.org/api/composition-api-lifecycle.html)
- [Vue 3 官方文档 Suspense](https://cn.vuejs.org/guide/built-ins/suspense.html)
- [Vue 3 官方文档 Teleport](https://cn.vuejs.org/guide/built-ins/teleport.html)
- [Pinia 官方文档](https://pinia.vuejs.org/zh/)
- [前端进阶之旅](https://interview.poetries.top)
