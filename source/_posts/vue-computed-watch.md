---
title: Vue 计算属性与 watch 数据监听详解（十）
description: 从一个年龄提示的需求出发，讲透 watch 的基础监听、deep 深度监听、监听计算属性三种写法，再对比 computed 的缓存机制，给出 computed、watch、methods 三者的选型标准。
date: 2018-08-28 14:10:42
tags:
  - Vue
  - computed
  - watch
categories: Front-End
---

有个需求几乎每个人都写过：输入框里填年龄，下面实时给一句提示。第一反应是在输入框上绑个 `@input`，方法里判断一下改文案。能跑，但数据一多就散了，页面上七八个字段都这么写，方法区里全是 `handleXxxChange`。Vue 给了两个更合适的工具，`computed` 和 `watch`。这两个东西功能上有重叠，很多人分不清什么时候用哪个，写着写着就全用 `watch` 了。这篇从那个年龄提示的需求一路改到三个版本，把两者的差别、各自的边界条件讲清楚，最后给一条能直接照着用的选型标准。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `watch` 的基础写法，`val` 和 `oldVal` 两个参数分别是什么
- 监听对象里的属性为什么必须开 `deep`，开了之后有什么代价
- 为什么 `watch` 的处理函数不能写成箭头函数
- 监听计算属性这种绕一层的做法，什么时候值得
- `computed` 的缓存到底缓存了什么，和 `methods` 差在哪
- 计算属性的 `getter` 和 `setter`，`setter` 什么场景用得上
- `computed`、`watch`、`methods` 三者的选型标准
- Vue 3 组合式 API 里这两个东西变成了什么

## 一、监听属性 watch

工作中常常需要监听某一个属性值的变化，做出响应，这时候用到的就是监听属性 `watch`。

### 1.1 基础版监听

场景是这样：输入框输入年龄，0 到 15 岁提示「你还是个小孩」，15 到 25 岁提示「你已经是个少年」，25 岁以上提示「你已经长大了」。

```html
<template>
 <div id="app">
  年龄：<input type="number" v-model="age"><br>
  提示信息：<span>{{infoMsg}}</span>
 </div>
</template>

<script>
export default {
 data() {
  return {
   age: "",
   infoMsg:""
  }
 },
 watch:{
  age:function(val,oldval){
   if(val>0 && val<15){
    this.infoMsg="你还是个小孩"
   }else if(val>=15 && val<25){
    this.infoMsg="你已经是个少年"
   }else{
    this.infoMsg="你已经长大了"
   }
  }
 }
}
</script>
```

`watch` 的写法就是「在 `watch` 对象里放一个和 data 属性同名的函数」，这个属性一变，函数就跑一次。函数收两个参数，第一个是新值，第二个是旧值。

原文这段的边界判断有个洞：第二个条件写的是 `val > 15`，那么正好等于 15 岁的时候，两个分支都不满足，直接落到 `else` 里提示「你已经长大了」。这里改成了 `val >= 15`。边界值这种问题在 code review 里最容易被放过，写区间判断的时候习惯性想一想两端各属于哪一边，能省不少事。

还有一点，`age` 绑的是 `type="number"` 的输入框，但 `input.value` 拿到的永远是字符串。`"18" > 15` 这种比较 JavaScript 会隐式转换，看起来没问题，可一旦用户输入的是 `"1e5"` 或者空字符串，行为就不好说了。稳妥的做法是加 `.number` 修饰符，这块在 [Vue 表单控件与 v-model](https://feinterview.poetries.top/blog/vue-form) 里展开过。

### 1.2 进阶版监听，deep 深度监听

改一下需求：因为后台数据库的调整，需要提交这样一个数据结构：

```javascript
data() {
  return {
   info: {
    age: ""
   },
   infoMsg: ""
  };
 }
```

年龄从顶层属性变成了 `info` 对象里的一个字段。这时候直接写 `watch: { info: function(){} }` 是监听不到的，因为 `info` 这个引用本身没变，变的是它里面的属性。要监听得开深度监听：

```html
<template>
 <div id="app">
  年龄：<input type="number" v-model="info.age"><br>
  提示信息：<span>{{infoMsg}}</span>
 </div>
</template>

<script>
export default {
 data() {
  return {
   info: {
    age: ""
   },
   infoMsg: ""
  };
 },
 watch: {
  info: {
   handler: function(val, oldval) {
    var that = this;
    if (val.age > 0 && val.age < 15) {
     that.infoMsg = "你还是个小孩";
    } else if (val.age >= 15 && val.age < 25) {
     that.infoMsg = "你已经是个少年";
    } else {
     that.infoMsg = "你已经长大了";
    }
   },
   deep: true
  }
 }
};
</script>
```

写法从「一个函数」变成了「一个对象」，真正的处理逻辑挪到 `handler` 里，多出来的 `deep` 表示是否开启深度监听，`true` 开启，`false` 不开启。

有两个细节得说清楚。

这里的 `function` 不能用箭头函数替代。箭头函数没有自己的 `this`，它会沿着定义时的作用域往上找，在 `export default` 这个对象字面量里往上找就找到了模块顶层，`this` 会指向 `undefined` 或者全局对象，反正不是组件实例。Vue 需要在调用时把 `this` 绑成组件实例，箭头函数直接把这条路堵死了。同样的道理适用于 `methods`、`computed`、生命周期钩子，所有需要 `this` 的选项都别用箭头函数。

另一个是 `oldval`。深度监听下 `val` 和 `oldval` 指向的是同一个对象引用，所以你会发现两个参数打印出来一模一样，拿不到修改前的值。想拿到旧值只能自己在别处存一份深拷贝，或者干脆换成监听具体的路径。

那 `deep` 有什么代价？Vue 2 实现深度监听的方式是递归遍历这个对象的所有属性，逐个触发 getter 完成依赖收集。对象层级深、字段多的时候，这个遍历本身就有开销，而且对象内部任何一个字段变了都会触发回调，哪怕你只关心 `age` 一个。

所以更精确的写法是直接监听路径，字符串形式支持点号：

```javascript
watch: {
  'info.age': function(val, oldval) {
    // 只有 age 变了才会进来，而且 oldval 是真的旧值
  }
}
```

这个写法比 `deep: true` 精确得多，能用就优先用它。

### 1.3 高级版监听，监听计算属性

还有一种绕一层的做法，先用计算属性把要监听的值抽出来，再监听这个计算属性：

```html
<template>
 <div id="app">
  年龄：<input type="number" v-model="info.age"><br>
  提示信息：<span>{{infoMsg}}</span>
 </div>
</template>
<script>
export default {
 data() {
  return {
   info: {
    age: "",
    name: "",
    hobit: ""
   },
   infoMsg: ""
  };
 },
 computed: {
  ageval: function() {
   return this.info.age;
  }
 },
 watch: {
  ageval: {
   handler: function(val, oldval) {
    var that = this;
    if (val > 0 && val < 15) {
     that.infoMsg = "你还是个小孩";
    } else if (val >= 15 && val < 25) {
     that.infoMsg = "你已经是个少年";
    } else {
     that.infoMsg = "你已经长大了";
    }
   }
  }
 }
};
</script>
```

这次监听的是计算属性 `ageval`，而计算属性返回的是 `info` 对象中 `age` 的值。和上一版比，两次代码里监听的一个是对象 `info`，一个是 `info` 对象中 `age` 的值。

这么写有两个实打实的好处：`val` 和 `oldval` 都是原始值，旧值是真的旧值；`info` 里其他字段变化不会触发回调，`name` 和 `hobit` 怎么改都不会误触发。

顺带说一句，原文这一版里 `ageval` 上还留着 `deep: true`。计算属性返回的是一个原始值，深度遍历一个字符串没有任何意义，这里去掉了。

那什么时候用这种写法，什么时候直接监听 `'info.age'`？我自己的习惯是，如果被监听的值需要一点计算（比如拼接、取默认值、单位换算），就走计算属性；纯取值就直接写路径字符串，少一层间接。

### 1.4 两个常用配置

`watch` 的对象写法除了 `deep` 还有一个 `immediate`。默认情况下 `watch` 只在值变化时触发，页面初次渲染那次不算变化，回调不会跑。加上 `immediate: true` 就会在监听器创建时立刻执行一次：

```javascript
watch: {
  'info.age': {
    handler(val) { /* ... */ },
    immediate: true
  }
}
```

「进页面先根据当前值算一次，之后跟着变」这类需求靠它，比在 `created` 里再手动调一遍干净。

另外 `watch` 的回调支持写成方法名字符串，`watch: { age: 'onAgeChange' }`，处理函数放在 `methods` 里，多个监听共用一个处理逻辑的时候能省点代码。

## 二、计算属性 computed

### 2.1 什么是计算属性

模板内的表达式非常便利，但是设计它们的初衷是用于简单运算的。在模板中放入太多的逻辑会让模板过重且难以维护，例如：

```html
<div id="example">
  {{ message.split('').reverse().join('') }}
</div>
```

这一行还能看懂，再加两个条件判断就没法看了。而且模板里的表达式没法复用，同样的逻辑在三个地方用就得抄三遍。遇到复杂逻辑应该用 Vue 自带的计算属性 `computed` 来处理。

### 2.2 计算属性的用法

在一个计算属性里可以完成各种复杂的逻辑，包括运算、函数调用等，只要最终返回一个结果就可以：

```html
<div id="example">
  <p>Original message: "{{ message }}"</p>
  <!-- 复杂处理放在了计算属性里面 -->
  <p>Computed reversed message: "{{ reversedMessage }}"</p>
</div>
```

```javascript
var vm = new Vue({
    el: '#example',
    data: {
        message: 'Hello'
    },
    computed: {
        reversedMessage: function () {
            // `this` 指向 vm 实例
            return this.message.split('').reverse().join('')
        }
    }
});
```

模板里用计算属性和用 data 属性写法完全一样，不带括号。这不是巧合，计算属性最终会被挂到实例上，从外面看它就是个只读属性。

计算属性还可以依赖多个数据，只要其中任一数据变化，计算属性就会重新执行，视图也会更新：

```html
<div id="app">
    <button @click="add()">补充货物1</button>
    <div>总价为：{{price}}</div>
</div>
```

```javascript
var app = new Vue({
   el: '#app',
   data: {
       package1: {
           count: 5,
           price: 5
       },
       package2: {
           count: 10,
           price: 10
       }
    },
    computed: {
     // 总价随着货物或价格的改变会重新计算
     price: function(){
         return this.package1.count * this.package1.price + this.package2.count * this.package2.price
     }
    },
    methods: {
        add: function(){
            this.package1.count++
        }
    }
});
```

这里 Vue 是怎么知道 `price` 依赖了这四个属性的？靠的是首次求值时的依赖收集。计算属性求值会读到 `package1.count` 等属性，读取动作触发它们的 getter，getter 里就把当前这个计算属性的 watcher 记了下来。之后任何一个属性的 setter 被触发，就通知这些 watcher 重新算。这套机制的完整实现，我在 [实现数据的双向绑定 mvvm](https://feinterview.poetries.top/blog/vue-mvvm) 里从零手写过。

这里有个连带的坑：依赖收集只认「实际读到的属性」。如果计算属性里写了 `if (a) return b; else return c;`，第一次求值时 `a` 为真，那 `c` 根本没被读到，也就不会被收集为依赖，之后 `c` 变了计算属性不会重算。这个行为是正确的（当前分支确实不依赖 `c`），但排查起来容易懵。

### 2.3 getter 和 setter

每一个计算属性都包含一个 `getter` 和一个 `setter`，上面两个示例都是默认用法，只利用了 `getter` 来读取。

在需要时也可以提供一个 `setter` 函数，当像修改普通数据那样手动修改计算属性的值时，就会触发 `setter`，执行一些自定义的操作：

```javascript
var vm = new Vue({
    el: '#demo',
    data: {
        firstName: 'Foo',
        lastName: 'Bar'
    },
    computed: {
        fullName: {
            // getter
            get: function () {
                return this.firstName + ' ' + this.lastName
            },
            // setter
            set: function (newValue) {
                var names = newValue.split(' ');
                this.firstName = names[0];
                this.lastName = names[names.length - 1];
            }
        }
    }
});
// 运行 vm.fullName = 'John Doe' 时，setter 会被调用
// vm.firstName 和 vm.lastName 也会相应地被更新
```

绝大多数情况下只会用默认的 `getter` 来读取一个计算属性，业务中很少用到 `setter`，所以声明计算属性时可以直接用简写形式，不必把 `getter` 和 `setter` 都写出来。

那 `setter` 什么时候真的有用？我用得最多的一个场景是给自定义组件做 `v-model`。`v-model` 要求这个值可读可写，但值本身来自 props 或者 Vuex，不能直接改。这时候写一个带 `setter` 的计算属性，`getter` 读 props，`setter` 里 `$emit` 出去，模板上就能直接 `v-model` 绑这个计算属性了，比手写 `:value` 加 `@input` 干净。

### 2.4 计算属性的缓存

除了使用计算属性外，也可以通过在表达式中调用方法来达到同样的效果：

```html
<div>{{reverseTitle()}}</div>
```

```javascript
// 在组件中
methods: {
  reverseTitle: function () {
    return this.title.split('').reverse().join('')
  }
}
```

同一个函数定义为方法还是计算属性，最终结果确实是完全相同的，只是一个用 `reverseTitle()` 取值，一个用 `reverseTitle` 取值。

差别在缓存上。计算属性是基于它们的依赖进行缓存的，只有在相关依赖发生改变时才会重新求值。只要 `title` 还没有发生改变，多次访问 `reverseTitle` 计算属性会立即返回之前的计算结果，而不必再次执行函数。

下面这段对照着看更清楚：

```html
<div>{{reverseTitle}}</div>
<div>{{reverseTitle1()}}</div>
<button @click="add()">补充货物1</button>
<div>总价为：{{price}}</div>
```

```javascript
computed: {
  reverseTitle: function(){
      // 使用计算属性，只要 title 没变，页面重新渲染时不会进这里重算，走的是缓存
      return this.title.split('').reverse().join('')
  },
  price: function(){
     return this.package1.count * this.package1.price + this.package2.count * this.package2.price
  }
},
methods: {
  add: function(){
      this.package1.count++
  },
  reverseTitle1: function(){
      // 点击补充货物也会进这个方法，再次计算
      // 不是刷新，而是只要页面重新渲染，就会进方法里重新计算
      return this.title.split('').reverse().join('')
  }
}
```

点一下「补充货物」，`package1.count` 变了，组件重新渲染。这一轮里 `reverseTitle1()` 会被完整执行一遍，虽然 `title` 压根没动；而 `reverseTitle` 检查到依赖没变，直接返回上次的结果。

为什么需要缓存？假设有一个性能开销比较大的计算属性 A，它需要遍历一个巨大的数组并做大量的计算，然后可能还有其他计算属性依赖于 A。如果没有缓存，就不可避免地要多次执行 A 的 `getter`。如果你不希望有缓存，用方法来替代就行。

反过来也有必须用方法的场景，那就是需要传参的时候。计算属性不接受参数，模板里想写 `formatPrice(item)` 这种带参数的插值，只能用方法。真要给带参数的逻辑加缓存，得让计算属性返回一个函数，或者上 `lodash` 的 `memoize`。

还有一个容易踩的点，计算属性依赖的必须是响应式数据。依赖 `Date.now()`、`Math.random()` 或者某个普通的模块级变量，缓存永远不会失效，页面上的值就再也不动了。

## 三、computed、watch、methods 怎么选

三者的边界其实很清楚，一句话概括：

- `computed` 用于「由已有数据推导出一个新值」，有缓存，同步，必须有返回值
- `watch` 用于「某个值变了之后要做一件事」，无返回值，支持异步
- `methods` 用于「用户触发一个动作」，每次调用都执行

| 场景 | 用什么 | 原因 |
|------|--------|------|
| 全名 = 姓 + 名 | `computed` | 纯推导，有缓存 |
| 列表按关键词过滤 | `computed` | 纯推导，依赖变了自动重算 |
| 搜索框输入后请求接口 | `watch` | 有副作用，还要防抖，是异步 |
| 路由参数变化后重新拉数据 | `watch` | 监听 `$route` |
| 点击按钮提交表单 | `methods` | 用户动作触发 |
| 模板里需要传参的格式化 | `methods` | 计算属性不接受参数 |

有一条经验值得写下来：能用 `computed` 就别用 `watch`。很多人写着写着变成「监听 A 变了去改 B」，其实 B 完全可以是一个由 A 推导出来的计算属性。用 `watch` 手动同步两份数据，多一份状态就多一份不一致的可能。官方文档里也是这个口径，`watch` 留给真正有副作用的场景。

## 四、Vue 3 里这两个东西变成了什么

Vue 3 的选项式 API 完全保留了 `computed` 和 `watch` 这两个选项，上面的写法原样能跑。变化在组合式 API 这边。

`computed` 变成了一个从 `vue` 导入的函数，传一个 getter 进去，返回一个只读的 ref，用的时候要 `.value`：

```javascript
import { ref, computed } from 'vue'

const firstName = ref('Foo')
const lastName = ref('Bar')
const fullName = computed(() => firstName.value + ' ' + lastName.value)
```

需要 setter 的话传一个带 `get` 和 `set` 的对象进去，和选项式的对象写法是对应的。

`watch` 也变成了函数，第一个参数是要监听的数据源，第二个是回调，第三个是配置对象（`deep`、`immediate` 这些还在）。数据源可以是 ref、getter 函数，也可以是数组同时监听多个。

Vue 3 另外还加了一个 `watchEffect`，它不需要显式声明监听谁，回调里用到了哪些响应式数据就自动收集哪些。写起来更省事，但代价是依赖关系不再一目了然，回调里分支多的时候容易漏收集。我自己的习惯是依赖明确的用 `watch`，图省事的小逻辑才用 `watchEffect`。

在模板里用的时候，`script setup` 里定义的 ref 会自动解包，不用写 `.value`，这一点和选项式 API 的体感是一致的。具体的参数签名以官方文档为准。

## 总结

回到开头那个年龄提示的需求。第一版直接监听顶层属性，最直白；第二版数据变成嵌套对象，只能开 `deep`，代价是拿不到旧值而且会被无关字段误触发；第三版先用计算属性把值抽出来再监听，两个问题都解决了。而更简单的路是直接监听 `'info.age'` 这个路径字符串。

计算属性和方法的区别只有一个词：缓存。依赖没变就不重算，这在依赖链长、计算量大的场景下是数量级的差别。代价是计算属性不能传参、必须依赖响应式数据。

选型上记住这条就够了：能推导出来的值用 `computed`，要做副作用的用 `watch`，用户动作用 `methods`。写 `watch` 之前先问一句「这个值能不能直接算出来」，能算出来就别监听。

## 参考

- [Vue 3 官方文档 - 计算属性](https://cn.vuejs.org/guide/essentials/computed.html)
- [Vue 3 官方文档 - 侦听器](https://cn.vuejs.org/guide/essentials/watchers.html)
- [Vue 3 官方文档 - 响应式 API 核心](https://cn.vuejs.org/api/reactivity-core.html)
- [Vue 2 官方文档存档](https://v2.cn.vuejs.org/)
- [前端进阶之旅](https://interview.poetries.top)
