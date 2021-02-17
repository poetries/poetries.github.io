---
title: Vue3之Composition API详解
date: 2021-02-17 20:12:12
tags: Vue
categories: Front-End
---

`Composition API`也叫组合式API，是Vue3.x的新特性。

> 通过创建 Vue 组件，我们可以将接口的可重复部分及其功能提取到可重用的代码段中。仅此一项就可以使我们的应用程序在可维护性和灵活性方面走得更远。然而，我们的经验已经证明，光靠这一点可能是不够的，尤其是当你的应用程序变得非常大的时候——想想几百个组件。在处理如此大的应用程序时，共享和重用代码变得尤为重要

**通俗的讲：**

没有`Composition API`之前vue相关业务的代码需要配置到option的特定的区域，中小型项目是没有问题的，但是在大型项目中会导致后期的维护性比较复杂，同时代码可复用性不高。Vue3.x中的composition-api就是为了解决这个问题而生的

**compositon api提供了以下几个函数：**

- `setup`
- `ref`
- `reactive`
- `watchEffect`
- `watch`
- `computed`
- `toRefs`
- 生命周期的`hooks`

## 一、setup组件选项

> 新的 `setup` 组件选项在**创建组件之前**执行，一旦 `props` 被解析，并充当合成 `API` 的入口点

**提示：**

> 由于在执行 `setup` 时尚未创建组件实例，因此在 `setup` 选项中没有 `this`。这意味着，除了`props` 之外，你将无法访问组件中声明的任何属性——本地状态、计算属性或方法。

使用 `setup` 函数时，它将接受两个参数：

1. `props`
2. `context`

让我们更深入地研究如何使用每个参数

### 1. Props

> `setup` 函数中的第一个参数是 `props`。正如在一个标准组件中所期望的那样，`setup` 函数中的 `props` 是响应式的，当传入新的 `prop` 时，它将被更新

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

**注意：**

> 但是，因为 `props` 是响应式的，你不能使用 `ES6` 解构，因为它会消除 `prop` 的响应性。

如果需要解构 prop，可以通过使用 `setup` 函数中的 [`toRefs`](https://v3.cn.vuejs.org/guide/reactivity-fundamentals.html#响应式状态解构) 来安全地完成此操作。

```js
// MyBook.vue

import { toRefs } from 'vue'

setup(props) {
	const { title } = toRefs(props)

	console.log(title.value)
}
```

### 2. 上下文

> 传递给 `setup` 函数的第二个参数是 `context`。`context` 是一个普通的 JavaScript 对象，它暴露三个组件的 property

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

> `context` 是一个普通的 JavaScript 对象，也就是说，它不是响应式的，这意味着你可以安全地对 `context` 使用 ES6 解构

```js
// MyBook.vue
export default {
  setup(props, { attrs, slots, emit }) {
    ...
  }
}
```

> `attrs` 和 `slots` 是有状态的对象，它们总是会随组件本身的更新而更新。这意味着你应该避免对它们进行解构，并始终以 `attrs.x` 或 `slots.x` 的方式引用 property。请注意，与 `props` 不同，`attrs` 和 `slots` 是**非**响应式的。如果你打算根据 `attrs` 或 `slots` 更改应用副作用，那么应该在 `onUpdated` 生命周期钩子中执行此操作。

### 3. setup组件的 property

> 执行 `setup` 时，组件实例尚未被创建。因此，你只能访问以下 property：

- `props`
- `attrs`
- `slots`
- `emit`

换句话说，你**将无法访问**以下组件选项：

- `data`
- `computed`
- `methods`

### 4. ref reactive 以及setup结合模板使用

在看`setup`结合模板使用之前，我们首先得知道`ref` 和 `reactive` 方法。

如果 `setup` 返回一个对象则可以在模板中绑定对象中的属性和方法，但是要定义响应式数据的时候可以使用`ref`, `reactive`方法定义响应式的数据

##### **错误写法：**

```js
<template>
{{msg}}
<br>

<button @click="updateMsg">改变etup中的msg</button>

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

<style lang="scss">
.home {
    position: relative;
}
</style>
```

##### **正确写法一：**

>  **ref**用来定义响应式的 字符串、 数值、 数组、`Bool`类型

```js
import {  
    ref
} from 'vue'
```

```js
<template>
{{msg}}
<br>
<br>
<button @click="updateMsg">改变etup中的msg</button>
<br>
<br>
<ul>
    <li v-for="(item,index) in list" :key="index">
        {{item}}
    </li>
</ul>

<br>
</template>

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

<style lang="scss">
.home {
    position: relative;
}
</style>
```

##### **正确写法二：**

**reactive** 用来定义响应式的对象

```js
import {
    reactive   
} from 'vue'
```

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

<script>
import {
    reactive,
    ref
} from 'vue'

export default {
    data() {
        return {

        }
    },
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

<style lang="scss">
.home {
    position: relative;
}
</style>
```

**说明:**要改变ref定义的属性名称需要通过 `属性名称.value`来修改，要改变`reactive`中定义的对象名称可以直接

### 5. 使用 `this`

> **在 `setup()` 内部，`this` 不会是该活跃实例的引用**，因为 `setup()` 是在解析其它组件选项之前被调用的，所以 `setup()` 内部的 `this` 的行为与其它选项中的 `this` 完全不同。这在和其它选项式 API 一起使用 `setup()` 时可能会导致混淆

##  二、toRefs - 解构响应式对象数据

> 把一个响应式对象转换成普通对象，该普通对象的每个 `property` 都是一个 `ref` ，和响应式对象 `property` 一一对应

```js
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

> 当想要从一个组合逻辑函数中返回响应式对象时，用 toRefs 是很有效的，该 API 让消费组件可以 解构 / 扩展（使用 `… `操作符）返回的对象，并不会丢失响应性：

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

## 三、computed - 计算属性

```js
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

## 四、readonly “深层”的只读代理

> 传入一个对象（响应式或普通）或 ref，返回一个原始对象的只读代理。一个只读的代理是“深层的”，对象内部任何嵌套的属性也都是只读的

```js
<template>
  <div>
    <h1>readonly - “深层”的只读代理</h1>
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

## 五、watchEffect

> 在响应式地跟踪其依赖项时立即运行一个函数，并在更改依赖项时重新运行它。

```js
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

## 六、watch 、watch 与watchEffect区别

对比`watchEffect`，**`watch`允许我们**：

- 懒执行，也就是说仅在侦听的源变更时才执行回调；
- 更明确哪些状态的改变会触发侦听器重新运行；
- 访问侦听状态变化前后的值

**更明确哪些状态的改变会触发侦听器重新运行**

```js
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

**访问侦听状态变化前后的值**

```js
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

**懒执行，也就是说仅在侦听的源变更时才执行回调**

```js
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

## 七、组合式api生命周期钩子

你可以通过在生命周期钩子前面加上 “on” 来访问组件的生命周期钩子。

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

> 因为 `setup` 是围绕 `beforeCreate` 和 `created` 生命周期钩子运行的，所以不需要显式地定义它们。换句话说，在这些钩子中编写的任何代码都应该直接在 `setup` 函数中编写

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

## 八、Provider Inject

通常，当我们需要将数据从父组件传递到子组件时，我们使用 [props](https://v3.cn.vuejs.org/guide/component-props.html)。想象一下这样的结构：你有一些深嵌套的组件，而你只需要来自深嵌套子组件中父组件的某些内容。在这种情况下，你仍然需要将 prop 传递到整个组件链中，这可能会很烦人

> 对于这种情况，我们可以使用 `provide` 和 `inject` 对父组件可以作为其所有子组件的依赖项提供程序，而不管组件层次结构有多深。这个特性有两个部分：父组件有一个 `provide` 选项来提供数据，子组件有一个 `inject` 选项来开始使用这个数据

### 1. **非组合式api中的写法**

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
<!-- src/components/MyMarker.vue -->
<script>
export default {
  inject: ['location', 'geolocation']
}
</script>
```

### 2. **组合式api中的写法**

##### Provider：

> 在 `setup()` 中使用 `provide` 时，我们首先从 `vue` 显式导入 `provide` 方法。这使我们能够调用 `provide` 时来定义每个 `property`

`provide` 函数允许你通过两个参数定义 `property`：

1. `property` 的 `name` (`<String>` 类型)
2. `property` 的 `value`

使用 `MyMap` 组件，我们提供的值可以按如下方式重构：

```html
<!-- src/components/MyMap.vue -->
<template>
  <MyMarker />
</template>

<script>
import { provide } from 'vue'
import MyMarker from './MyMarker.vue

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

##### Inject:

> 在 `setup()` 中使用 `inject` 时，还需要从 `vue` 显式导入它。一旦我们这样做了，我们就可以调用它来定义如何将它暴露给我们的组件。

`inject` 函数有两个参数：

1. 要注入的 `property` 的名称
2. 一个默认的值 (**可选**)

使用 `MyMarker` 组件，可以使用以下代码对其进行重构：

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

**Provider Inject 响应性**

**父组件：**

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

```html
<button @click="updateLocation">改变location</button>
```

**子组件：**

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
</script>
```

