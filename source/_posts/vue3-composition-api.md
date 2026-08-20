---
title: Vue3之Composition API详解 从setup到组合式函数
description: Vue3 组合式 API 完整拆解，讲清 setup 的两个参数、ref 与 reactive 怎么选、toRefs 解构不丢响应性、watch 与 watchEffect 的区别、生命周期钩子改名规律，以及把逻辑抽成组合式函数的正确姿势。
date: 2021-02-17 20:12:12
tags:
  - Vue
  - Vue3
  - Composition API
categories: Front-End
---

一个业务组件写到八百行，`data` 里堆了二十个字段，`methods` 里躺着三十个函数，你想改「购物车优惠券」这一块的逻辑，得在文件里上下横跳七八次，因为它的状态在第 30 行，计算在第 210 行，方法在第 480 行，监听在第 700 行。这不是代码写得烂，是选项式 API 按「选项类型」而不是按「业务关注点」组织代码的必然结果。组合式 API 就是冲着这件事来的。这篇把 `setup`、`ref`、`reactive`、`toRefs`、`computed`、`watch`、`watchEffect`、生命周期钩子和 `provide` / `inject` 逐个拆开讲，重点不在 API 签名，而在什么时候用哪个、边界在哪。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `setup` 的执行时机、两个参数，以及它为什么没有 `this`
- `ref` 和 `reactive` 到底该用哪个，`reactive` 的三个坑
- `toRefs` 怎么让解构不丢响应性，这是组合式函数的关键一环
- `computed` 和 `readonly` 的典型用法
- `watchEffect` 自动收集依赖，`watch` 手动指定源，两者的四点区别
- 组合式 API 的生命周期钩子改名规律和注册时机
- `provide` / `inject` 跨层级传值，以及怎么保住响应性
- 把逻辑抽成组合式函数，这才是组合式 API 存在的理由
- 关于 `script setup`，2021 年它还是实验特性，现在已经是推荐写法

`Composition API` 也叫组合式 API，是 Vue 3.x 的新特性。

官方文档里的说法是这样的：通过创建 Vue 组件，我们可以将接口的可重复部分及其功能提取到可重用的代码段中，仅此一项就能让应用在可维护性和灵活性上走得更远。但经验证明光靠这一点可能不够，尤其是当你的应用变得非常大的时候，比如上百个组件的规模。在处理这么大的应用时，共享和重用代码变得尤为重要。

通俗的讲：没有 `Composition API` 之前，Vue 相关业务的代码需要配置到 option 的特定区域，中小型项目没有问题，但在大型项目中会导致后期维护复杂，同时代码可复用性不高。Vue 3.x 中的 composition-api 就是为了解决这个问题而生的。

compositon api 提供了以下几个函数：

- `setup`
- `ref`
- `reactive`
- `watchEffect`
- `watch`
- `computed`
- `toRefs`
- 生命周期的 `hooks`

## 一、setup组件选项

新的 `setup` 组件选项在创建组件之前执行，一旦 `props` 被解析，它就充当组合式 API 的入口点。

这里有个提示要记住：由于在执行 `setup` 时尚未创建组件实例，因此在 `setup` 选项中没有 `this`。所以除了 `props` 之外，你无法访问组件中声明的任何属性，本地状态、计算属性、方法一个都拿不到。

使用 `setup` 函数时，它会接受两个参数：

1. `props`
2. `context`

下面分别看这两个参数怎么用。

### 1. Props

`setup` 函数中的第一个参数是 `props`。正如在一个标准组件中所期望的那样，`setup` 函数中的 `props` 是响应式的，当传入新的 `prop` 时，它会被更新。

```js
// MyBook.vue

export default {
  props: {
    title: String
  },
  setup(props) {
    console.log(props.title)
  }
}
```

注意：因为 `props` 是响应式的，你不能使用 ES6 解构，解构会消除 `prop` 的响应性。

这个坑很多人踩过。`const { title } = props` 之后，`title` 就是一次性取出来的普通字符串，父组件再怎么改，你手里这个变量都不会动。如果需要解构 prop，可以通过使用 `setup` 函数中的 [`toRefs`](https://v3.cn.vuejs.org/guide/reactivity-fundamentals.html#响应式状态解构) 来安全地完成此操作：

```js
// MyBook.vue

import { toRefs } from 'vue'

setup(props) {
	const { title } = toRefs(props)

	console.log(title.value)
}
```

这里有个额外的坑：如果某个 prop 是可选的、父组件没传，`toRefs` 在那个 key 上拿不到东西，这种情况用 `toRef(props, 'title')` 更稳，它对不存在的 key 也能建立引用。

顺便说个时效性的事。新版本 Vue 对 `defineProps` 的解构做了编译期处理，让解构后的变量也能保持响应性，不再需要处处包 `toRefs`。具体从哪个版本开始默认开启、有哪些限制，以官方文档为准。

### 2. 上下文

传递给 `setup` 函数的第二个参数是 `context`。`context` 是一个普通的 JavaScript 对象，它暴露三个组件的 property：

```js
// MyBook.vue

export default {
  setup(props, context) {
    // Attribute (非响应式对象)
    console.log(context.attrs)

    // 插槽 (非响应式对象)
    console.log(context.slots)

    // 触发事件 (方法)
    console.log(context.emit)
  }
}
```

`context` 是一个普通的 JavaScript 对象，它不是响应式的，所以你可以安全地对 `context` 使用 ES6 解构：

```js
// MyBook.vue
export default {
  setup(props, { attrs, slots, emit }) {
    ...
  }
}
```

不过 `attrs` 和 `slots` 是有状态的对象，它们总是会随组件本身的更新而更新。所以你应该避免对它们再往下解构，始终以 `attrs.x` 或 `slots.x` 的方式引用 property。请注意，与 `props` 不同，`attrs` 和 `slots` 是非响应式的。如果你打算根据 `attrs` 或 `slots` 做副作用，那应该在 `onUpdated` 生命周期钩子中执行。

这三个之外，`context` 上还有一个 `expose`，用来显式声明这个组件对外暴露哪些属性和方法，父组件通过模板 ref 拿到的就是你 expose 出去的那些。

### 3. setup 组件的 property

执行 `setup` 时，组件实例尚未被创建。因此，你只能访问以下 property：

- `props`
- `attrs`
- `slots`
- `emit`

也就是说，你将无法访问以下组件选项：

- `data`
- `computed`
- `methods`

这个限制不是故意为难人，它是执行顺序决定的。`setup` 跑在 `beforeCreate` 和 `created` 之间，那时候 `data()` 还没被调用，`computed` 还没被求值，自然什么都没有。

### 4. ref reactive 以及 setup 结合模板使用

在看 `setup` 结合模板使用之前，我们首先得知道 `ref` 和 `reactive` 方法。

如果 `setup` 返回一个对象，则可以在模板中绑定对象中的属性和方法。但要定义响应式数据的时候，需要用 `ref` 或 `reactive` 方法。

#### 错误写法

下面这段是最典型的入门错误，`msg` 是个普通字符串，点按钮之后 `alert` 会弹，值也确实改了，但页面纹丝不动：

```html
<template>
{{msg}}
<br>

<button @click="updateMsg">改变setup中的msg</button>

<br>
</template>

<script>
export default {
    data() {
        return {

        }
    },
    setup() {
        let msg = "这是setup中的msg";
        let updateMsg = () => {
            alert("触发方法")
            msg = "改变后的值"
        }
        return {
            msg,
            updateMsg
        }
    },

}
</script>
```

为什么改了值页面不更新呢？因为 `return` 出去的那一刻，`msg` 的值就被拷贝进返回对象了，之后你改的是 `setup` 作用域里那个局部变量，和模板拿到的那份已经没有关系。Vue 也没法在这中间插进去，一个普通字符串上没有任何可以被劫持的入口。这块的底层机制我在 [Vue响应式原理模拟](https://feinterview.poetries.top/blog/vue-reative-summary) 里从 `Object.defineProperty` 和 `Proxy` 讲起手写了一遍。

#### 正确写法一 ref

`ref` 用来定义响应式的字符串、数值、数组、`Bool` 类型：

```js
import {  
    ref
} from 'vue'
```

模板部分照常写，注意模板里用 `msg` 不用带 `.value`：

```html
<template>
{{msg}}
<br>
<br>
<button @click="updateMsg">改变setup中的msg</button>
<br>
<br>
<ul>
    <li v-for="(item,index) in list" :key="index">
        {{item}}
    </li>
</ul>

<br>
</template>
```

脚本里定义和修改都要走 `.value`：

```html
<script>
import {

    ref
} from 'vue'

export default {
    data() {
        return {

        }
    },
    setup() {
        let msg = ref("这是setup中的msg");

        let list = ref(["马总", "李总", "刘总"])

        let updateMsg = () => {
            alert("触发方法");
            msg.value = "改变后的值"
        }
        return {
            msg,
            list,
            updateMsg
        }
    },

}
</script>
```

`ref` 的原理就是包一层。它返回一个带 `value` 属性的对象，读写都过这个属性的 getter/setter，这样 Vue 就有地方做依赖收集和触发更新了。模板里之所以不用写 `.value`，是因为渲染的时候 Vue 会对顶层的 ref 自动解包。这个自动解包只在模板的顶层属性上生效，把 ref 塞进数组或者 Map 里再取出来，还是得自己写 `.value`。

#### 正确写法二 reactive

`reactive` 用来定义响应式的对象：

```js
import {
    reactive   
} from 'vue'
```

模板里 `reactive` 定义的对象直接按属性路径访问：

```html
<template>
{{msg}}
<br>
<br>
<button @click="updateMsg">改变setup中的msg</button>
<br>
<br>
<ul>
    <li v-for="(item,index) in list" :key="index">
        {{item}}
    </li>
</ul>
<br>
{{setupData.title}}
<br>
<button @click="updateTitle">更新setup中的title</button>
<br>
<br>
</template>
```

脚本里 `reactive` 返回的是一个 Proxy 代理对象，改属性不需要 `.value`：

```html
<script>
import {
    reactive,
    ref
} from 'vue'

export default {
    setup() {
        let msg = ref("这是setup中的msg");

        let setupData = reactive({
            title: "reactive定义响应式数据的title",
            userinfo: {
                username: "张三",
                age: 20
            }

        })

        let updateMsg = () => {
            alert("触发方法");
            msg.value = "改变后的值"
        }
        let updateTitle = () => {
            alert("触发方法");
            setupData.title = "我是改变后的title"

        }
        return {
            msg,
            setupData,
            updateMsg,
            updateTitle
        }
    },

}
</script>
```

说明：要改变 `ref` 定义的属性需要通过 `属性名称.value` 来修改，要改变 `reactive` 中定义的对象属性可以直接赋值。

#### 那到底该用哪个

我一开始也是按类型分的，基本类型用 `ref`，对象用 `reactive`。用了一段时间之后改成了几乎只用 `ref`，因为 `reactive` 有三个绕不过去的坑。

第一个坑，它只吃对象。`reactive(0)` 或者 `reactive('abc')` 直接无效，你没法把一个数字包成响应式的。

第二个坑，整体替换会断。`let state = reactive({ list: [] })`，后面写 `state = reactive({ list: newList })`，模板还盯着老那个 Proxy，页面不动。用 `ref` 的话 `state.value = newList` 就没这个问题。

第三个坑，解构就丢。`const { title } = setupData` 拿到的是普通值，和 props 那个坑是同一个根因，都得靠 `toRefs` 救。

反过来看 `ref`，代价只是脚本里多写几个 `.value`。所以我的结论是统一用 `ref`，团队里也少一层「这个变量到底要不要写 .value」的记忆负担。当然这只是我自己的取舍，Vue 官方文档对两者都是认可的。

### 5. 使用 this

在 `setup()` 内部，`this` 不会是该活跃实例的引用。因为 `setup()` 是在解析其它组件选项之前被调用的，所以 `setup()` 内部的 `this` 的行为与其它选项中的 `this` 完全不同。这在和其它选项式 API 一起使用 `setup()` 时可能会导致混淆。

实践中的建议很简单：别在 `setup` 里碰 `this`，需要什么就从参数和导入的函数里拿。

## 二、toRefs 解构响应式对象数据

`toRefs` 把一个响应式对象转换成普通对象，该普通对象的每个 `property` 都是一个 `ref`，和原响应式对象的 `property` 一一对应。

```html
<template>
<div>
    <h1>解构响应式对象数据</h1>
    <p>Username: {{username}}</p>
    <p>Age: {{age}}</p>
</div>
</template>

<script>
import {
    reactive,
    toRefs
} from "vue";

export default {
    name: "解构响应式对象数据",
    setup() {
        const user = reactive({
            username: "张三",
            age: 10000,
        });

        return {
            ...toRefs(user)
        };
    },
};
</script>
```

注意这里的 `...toRefs(user)`。展开之后模板里直接写 `username` 和 `age`，不用再写 `user.username`，模板干净了不少，而且响应性一点没丢。

当想要从一个组合逻辑函数中返回响应式对象时，`toRefs` 是很有效的。它让消费组件可以解构或者扩展返回的对象，并且不会丢失响应性：

```js
function useFeatureX() {
  const state = reactive({
    foo: 1,
    bar: 2,
  })

  // 对 state 的逻辑操作
  // ....

  // 返回时将属性都转为 ref
  return toRefs(state)
}

export default {
  setup() {
    // 可以解构，不会丢失响应性
    const { foo, bar } = useFeatureX()

    return {
      foo,
      bar,
    }
  },
}
```

这一段是后面组合式函数那一节的地基，先记住这个形状：内部用 `reactive` 攒状态，出口用 `toRefs` 铺平。

## 三、computed 计算属性

计算属性用来声明「由其他状态推导出来的值」。它会缓存结果，依赖不变就不重算，这一点比在模板里直接写表达式强：

```html
<template>
<div>
    <h1>解构响应式对象数据+computed</h1>

    <input type="text" v-model="firstName" placeholder="firstName" />
    <br>
    <br>
    <input type="text" v-model="lastName" placeholder="lastName" />

    <br>
    {{fullName}}
</div>
</template>

<script>
import {
    reactive,
    toRefs,
    computed
} from "vue";

export default {
    name: "解构响应式对象数据",
    setup() {
        const user = reactive({
            firstName: "",
            lastName: "",
        });

        const fullName = computed(() => {
            return user.firstName + " " + user.lastName
        })

        return {
            ...toRefs(user),
            fullName
        };
    },
};
</script>
```

`computed` 返回的是一个只读的 ref，所以在脚本里读它要写 `fullName.value`，模板里自动解包。如果你需要一个可写的计算属性，`computed` 也接受 `{ get, set }` 形式的对象参数，典型场景是给 `v-model` 做双向代理。

这里有条纪律：计算属性的 getter 里只做纯计算，别发请求、别改别的状态。要做副作用，那是 `watch` 和 `watchEffect` 的活。

## 四、readonly 深层的只读代理

`readonly` 传入一个对象（响应式或普通）或 ref，返回一个原始对象的只读代理。这个只读代理是深层的，对象内部任何嵌套的属性也都是只读的：

```html
<template>
  <div>
    <h1>readonly - 深层的只读代理</h1>
    <p>original.count: {{original.count}}</p>
    <p>copy.count: {{copy.count}}</p>
  </div>
</template>

<script>
import { reactive, readonly } from "vue";

export default {
  name: "Readonly",
  setup() {
    const original = reactive({ count: 0 });
    const copy = readonly(original);

    setInterval(() => {
      original.count++;
      copy.count++; // 报警告，Set operation on key "count" failed: target is readonly. Proxy {count: 1}
    }, 1000);


    return { original, copy };
  },
};
</script>
```

改 `original` 的时候 `copy` 会跟着变，改 `copy` 则只会在控制台收到一条警告，值不动。

它最实在的用途是配合 `provide`。祖先组件 `provide(readonly(state))`，后代组件想改就得调祖先给的方法，改不动共享状态。这样数据的修改入口收敛在一个地方，出了问题好查。要注意这个警告只在开发模式下有，生产构建里静默失败，所以别把它当运行时防护，它是给开发阶段兜底的。

## 五、watchEffect 自动收集依赖

`watchEffect` 在响应式地跟踪其依赖项时立即运行一个函数，并在更改依赖项时重新运行它。

```html
<template>
<div>
    <h1>watchEffect - 侦听器</h1>
    <p>{{data.count}}</p>
    <button @click="stop">手动关闭侦听器</button>
</div>
</template>

<script>
import {
    reactive,
    watchEffect
} from "vue";
export default {
    name: "WatchEffect",
    setup() {
        const data = reactive({
            count: 1,
            num: 1
        });
        const stop = watchEffect(() => console.log(`侦听器：${data.count}`));
        setInterval(() => {
            data.count++;
        }, 1000);
        return {
            data,
            stop
        };
    },
};
</script>
```

这段有几个细节。第一，`watchEffect` 会立即执行一次，不需要额外配置。第二，依赖是它自己收集的，回调里读了 `data.count`，`count` 就成了依赖；`data.num` 没被读到，改 `num` 不会触发。第三，它返回一个停止函数，上面这个例子把它 return 给模板，点按钮就能停。

在组件的 `setup` 里创建的侦听器会随组件卸载自动停止，一般不用手动收。但如果你是在异步回调里创建的侦听器，它绑不上当前组件实例，那就必须自己留着停止函数收尾，不然组件销毁了它还在跑。这个我踩过，一个页面来回进出十几次之后控制台开始刷屏，才发现是 `setTimeout` 里建的 `watchEffect` 没停。

回调还能接一个清理函数参数，用来在下一次执行前取消上一次未完成的异步操作，做搜索联想这类场景必备。这个参数在不同小版本里名字有调整，具体以官方文档为准。

## 六、watch 与 watchEffect 的区别

对比 `watchEffect`，`watch` 允许我们：

- 懒执行，也就是说仅在侦听的源变更时才执行回调
- 更明确哪些状态的改变会触发侦听器重新运行
- 访问侦听状态变化前后的值

**更明确哪些状态的改变会触发侦听器重新运行**

```html
<template>
<div>
    <h1>watch - 侦听器</h1>
    <p>count1: {{data.count1}}</p>
    <p>count2: {{data.count2}}</p>
    <button @click="stopAll">Stop All</button>
</div>
</template>

<script>
import {
    reactive,
    watch
} from "vue";
export default {
    name: "Watch",
    setup() {
        const data = reactive({
            count1: 0,
            count2: 0
        });
        // 侦听单个数据源
        const stop1 = watch(data, () =>
            console.log("watch1", data.count1, data.count2)
        );
        // 侦听多个数据源
        const stop2 = watch([data], () => {
            console.log("watch2", data.count1, data.count2);
        });
        setInterval(() => {
            data.count1++;
        }, 1000);
        return {
            data,
            stopAll: () => {
                stop1();
                stop2();
            },
        };
    },
};
</script>
```

这里有个容易被忽略的行为：当侦听源直接是一个 `reactive` 对象时，`watch` 会自动进入深度监听，对象里任何一层属性变了都会触发。所以上面 `count2` 变化也会打印。想只盯某一个属性，把源写成 getter 函数，`watch(() => data.count1, cb)`，这样才是真正的「明确指定」。

**访问侦听状态变化前后的值**

```html
<template>
<div>
    <h1>watch - 侦听器</h1>
    <input type="text" v-model="keywords" />
</div>
</template>

<script>
import {
    ref,
    watch
} from "vue";
export default {
    name: "Watch",
    setup() {
        let keywords = ref("111");
        // 侦听单个数据源
        watch(keywords, (newValue, oldValue) => {
            console.log(newValue, oldValue)
        });

        return {
            keywords
        };
    },
};
</script>
```

新旧值这一对参数是 `watch` 相对 `watchEffect` 最大的优势，做「只有从 A 变到 B 才执行」这类判断离不开它。这里也有个坑：侦听 `reactive` 对象的深层变化时，新旧值指向的是同一个对象引用，你会发现两个参数打印出来一模一样。

**懒执行，也就是说仅在侦听的源变更时才执行回调**

```html
<template>
<div>
    <h1>watch - 侦听器</h1>
    <p>num1={{num1}}</p>
    <p>num2={{num2}}</p>
</div>
</template>

<script>
import {
    ref,
    watch,
    watchEffect
} from "vue";
export default {
    name: "Watch",
    setup() {
        let num1 = ref(10);
        let num2 = ref(10);
        // 侦听单个数据源
        watch(num1, (newValue, oldValue) => {
            console.log(newValue, oldValue)
        });

        watchEffect(() => console.log(`watchEffect侦听器：${num2.value}`));

        return {
            num1,
            num2
        };
    },
};
</script>
```

跑起来你会看到，页面一加载 `watchEffect` 那行就打印了，`watch` 那行没有。想让 `watch` 也立即执行一次，传第三个参数 `{ immediate: true }`。

那实际项目里怎么选？我的用法是：依赖简单、逻辑就是「读几个值做点事」的用 `watchEffect`，写起来短；需要新旧值对比、需要精确控制触发源、或者回调里会读到一堆不想当依赖的值时，用 `watch`。`watchEffect` 有个隐藏成本，回调里所有被读到的响应式数据都会变成依赖，代码一长你很难说清它到底为什么被触发了。

## 七、组合式api生命周期钩子

你可以通过在生命周期钩子前面加上 `on` 来访问组件的生命周期钩子。

下表包含如何在 [setup ()](https://v3.cn.vuejs.org/guide/composition-api-setup.html) 内部调用生命周期钩子：

| 选项式 API        | Hook inside `setup` |
| :---------------- | :------------------ |
| `beforeCreate`    | 不需要*             |
| `created`         | 不需要*             |
| `beforeMount`     | `onBeforeMount`     |
| `mounted`         | `onMounted`         |
| `beforeUpdate`    | `onBeforeUpdate`    |
| `updated`         | `onUpdated`         |
| `beforeUnmount`   | `onBeforeUnmount`   |
| `unmounted`       | `onUnmounted`       |
| `errorCaptured`   | `onErrorCaptured`   |
| `renderTracked`   | `onRenderTracked`   |
| `renderTriggered` | `onRenderTriggered` |

因为 `setup` 是围绕 `beforeCreate` 和 `created` 生命周期钩子运行的，所以不需要显式地定义它们。在这两个钩子中编写的任何代码都应该直接写在 `setup` 函数里：

```js
export default {
  setup() {
    // mounted
    onMounted(() => {
      console.log('Component is mounted!')
    })
  }
}
```

有条纪律必须遵守：这些钩子只能在 `setup` 的同步执行期间调用。写在 `await` 之后、`setTimeout` 里或者事件回调里，Vue 找不到「当前正在初始化的组件实例」，钩子就绑不上去，开发模式下会给一条警告。

好处也在这。因为钩子是函数调用而不是选项，你可以把它们放进组合式函数里，让一段可复用逻辑自带挂载和卸载的收尾动作，调用方一行都不用写。选项式 API 里这件事只能靠 mixin，而 mixin 的问题我在 [Vue3基础小结](https://feinterview.poetries.top/blog/vue3-base) 里专门说过。

## 八、provide 和 inject 跨层级传值

通常我们需要把数据从父组件传到子组件时用 [props](https://v3.cn.vuejs.org/guide/component-props.html)。但设想一下这样的结构：你有一些深嵌套的组件，而深处的子组件只需要父组件里的某个值。这种情况下，你仍然得把这个 prop 一层层往下传，中间那些组件根本用不到它，纯属过路，写起来很烦人。

对于这种情况，我们可以使用 `provide` 和 `inject`。父组件可以作为其所有子组件的依赖项提供者，不管组件层次结构有多深。这个特性有两个部分：父组件有一个 `provide` 选项来提供数据，子组件有一个 `inject` 选项来使用这个数据。

### 1. 非组合式 api 中的写法

```html
<!-- src/components/MyMap.vue -->
<template>
  <MyMarker />
</template>

<script>
import MyMarker from './MyMarker.vue'

export default {
  components: {
    MyMarker
  },
  provide: {
    location: 'North Pole',
    geolocation: {
      longitude: 90,
      latitude: 135
    }
  }
}
</script>
```

```html
<!-- src/components/MyMarker.vue -->
<script>
export default {
  inject: ['location', 'geolocation']
}
</script>
```

选项式写法里 `provide` 如果写成对象字面量，里面是拿不到 `this` 的，要用到组件自身数据就得把它写成函数形式。

### 2. 组合式 api 中的写法

**Provider**

在 `setup()` 中使用 `provide` 时，我们首先从 `vue` 显式导入 `provide` 方法。这使我们能够在调用 `provide` 时逐个定义 property。

`provide` 函数允许你通过两个参数定义 property：

1. property 的 name（`String` 类型）
2. property 的 value

使用 `MyMap` 组件，我们提供的值可以按如下方式重构：

```html
<!-- src/components/MyMap.vue -->
<template>
  <MyMarker />
</template>

<script>
import { provide } from 'vue'
import MyMarker from './MyMarker.vue'

export default {
  components: {
    MyMarker
  },
  setup() {
    provide('location', 'North Pole')
    provide('geolocation', {
      longitude: 90,
      latitude: 135
    })
  }
}
</script>
```

**Inject**

在 `setup()` 中使用 `inject` 时，同样需要从 `vue` 显式导入它。导入之后调用它，就能拿到祖先提供的值。

`inject` 函数有两个参数：

1. 要注入的 property 的名称
2. 一个默认值（可选）

使用 `MyMarker` 组件，可以用以下代码重构：

```html
<!-- src/components/MyMarker.vue -->
<script>
import { inject } from 'vue'

export default {
  setup() {
    const userLocation = inject('location', 'The Universe')
    const userGeolocation = inject('geolocation')

    return {
      userLocation,
      userGeolocation
    }
  }
}
</script>
```

### 3. provide inject 的响应性

上面那种写法传的是死值，父组件改了子组件不知道。想要响应式，提供的就得是 `ref` 或者 `reactive` 本身。

父组件：

```js
import {
    provide,
    ref,
    reactive
} from 'vue'

setup() {
        const location = ref('北京')
        const geolocation = reactive({
            longitude: 90,
            latitude: 135
        })
        const updateLocation = () => {
            location.value = '上海'
        }
        provide('location', location);
        provide('geolocation', geolocation);
        return {
            updateLocation
        }
    }
```

父组件模板里放个按钮触发修改：

```html
<button @click="updateLocation">改变location</button>
```

子组件：

```js
import { inject } from 'vue'

export default {
  setup() {
    const userLocation = inject('location', 'The Universe')
    const userGeolocation = inject('geolocation')

    return {
      userLocation,
      userGeolocation
    }
  }
}
```

点一下按钮，深层的 `MyMarker` 里显示的值就跟着变了，中间隔多少层组件都不影响。

这套机制用起来爽，但有两个约束建议提前定好。一是数据的修改权最好留在提供方，往下传的时候包一层 `readonly`，同时把修改方法也 `provide` 下去，别让任意后代都能改共享状态。二是注入名建议用一个导出的常量或者 Symbol，别到处写裸字符串，不然拼错一个字母就是静默失败。TypeScript 项目里还可以用 `InjectionKey` 给注入值带上类型。

要提醒的是 provide/inject 只解决「祖先到后代」这一个方向。兄弟组件之间、任意两个组件之间的通信是另一套题，我在 [Vue组件化实践详解](https://feinterview.poetries.top/blog/vue-comp) 里把九种方式的适用边界都列了。

## 九、把逻辑抽成组合式函数

前面这些 API 单独看都只是「换个写法」，它们真正的价值要合起来才显出来。

回到开头那个八百行组件的问题。用组合式 API 之后，你可以把「购物车优惠券」的状态、计算、方法、监听、生命周期钩子全部写进一个函数里，比如 `useCoupon.js`：

```js
import { ref, computed, onMounted } from 'vue'

export function useCoupon(cartTotal) {
  const list = ref([])
  const selectedId = ref(null)

  const selected = computed(
    () => list.value.find(item => item.id === selectedId.value) || null
  )

  const discount = computed(() => {
    if (!selected.value) return 0
    return Math.min(selected.value.amount, cartTotal.value)
  })

  async function fetchList() {
    list.value = await fetch('/api/coupons').then(res => res.json())
  }

  onMounted(fetchList)

  return { list, selectedId, selected, discount, fetchList }
}
```

组件里用起来只有一行：

```js
const { list, selectedId, discount } = useCoupon(cartTotal)
```

这就是组合式 API 的目的。相比 mixin，它有三个明确的好处：来源清楚，模板里出现的 `discount` 一眼能看出来自 `useCoupon`；不会命名冲突，重名了自己在解构时重命名就行；可以传参，`useCoupon(cartTotal)` 把依赖显式传进去，而 mixin 只能隐式依赖组件上有某个字段。

写组合式函数有几条约定值得遵守。函数名用 `use` 开头；在 `setup` 的同步阶段调用，别放在条件分支或者循环里；返回值优先返回一组 ref 而不是一个 `reactive` 对象，这样调用方解构不会丢响应性，实在要返回对象就记得 `toRefs` 一下。

## 十、关于 script setup

这篇写于 2021 年，那会儿 `script setup` 还挂着实验特性的标签，所以上面所有例子用的都是 `setup()` 函数加 `return` 的形式。现在情况变了，`script setup` 已经是官方推荐的写法，新项目基本不用再写 `setup()` 选项了。

差别主要是三点：顶层声明的变量、函数、导入的组件自动暴露给模板，不用手动 `return`；`props` 和 `emit` 改用 `defineProps` 和 `defineEmits` 这两个编译宏声明；组件默认对外封闭，父组件想通过 ref 调子组件的方法，得用 `defineExpose` 主动开口子。

同一段 `ref` 逻辑用新写法是这样的：

```html
<script setup>
import { ref } from 'vue'

const msg = ref('这是 setup 中的 msg')

function updateMsg() {
  msg.value = '改变后的值'
}
</script>

<template>
  <p>{{ msg }}</p>
  <button @click="updateMsg">改变 msg</button>
</template>
```

上面那些 API 本身一个都没变，`ref`、`reactive`、`watch`、`computed`、生命周期钩子照旧，变的只是组件的组织形式。所以这篇讲的心法完全不过时，你只需要在落地时把外壳换掉。

## 总结

把组合式 API 这一圈过下来，几个能直接带走的结论：

- `setup` 在 `beforeCreate` 和 `created` 之间跑，没有 `this`，只能拿到 `props` 和 `context`，别在里面找组件实例
- 响应式数据统一用 `ref` 更省心，`reactive` 有「只吃对象、整体替换会断、解构就丢」三个坑
- props 和 `reactive` 对象要解构就配 `toRefs`，单个属性用 `toRef` 更稳
- `computed` 只做纯计算并且带缓存，副作用交给 `watch` 和 `watchEffect`
- `watchEffect` 自动收依赖、立即执行、写着短；`watch` 懒执行、能拿新旧值、能精确指定源，复杂场景选它
- 生命周期钩子加 `on` 前缀，必须在 `setup` 同步阶段注册，这条限制换来了「钩子可以被封装进组合式函数」的能力
- `provide` / `inject` 传 ref 才有响应性，往下传时包 `readonly`，注入名用常量
- 所有这些 API 的落点是组合式函数，按业务关注点组织代码，这才是组合式 API 值钱的地方

如果只让我留一句：别把组合式 API 当成「`data` 换个地方写」，它真正改变的是你切分代码的维度。

## 参考

- [Vue 3 官方文档 - 组合式 API 常见问答](https://cn.vuejs.org/guide/extras/composition-api-faq.html)
- [Vue 3 官方文档 - 响应式基础](https://cn.vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Vue 3 官方文档 - 计算属性](https://cn.vuejs.org/guide/essentials/computed.html)
- [Vue 3 官方文档 - 侦听器](https://cn.vuejs.org/guide/essentials/watchers.html)
- [Vue 3 官方文档 - 组合式 API 生命周期钩子](https://cn.vuejs.org/api/composition-api-lifecycle.html)
- [Vue 3 官方文档 - 依赖注入](https://cn.vuejs.org/guide/components/provide-inject.html)
- [Vue 3 官方文档 - 组合式函数](https://cn.vuejs.org/guide/reusability/composables.html)
- [前端进阶之旅](https://interview.poetries.top)
