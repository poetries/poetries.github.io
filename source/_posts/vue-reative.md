---
title: Vue响应式原理从defineProperty到Proxy
description: 梳理 Vue 响应式原理的完整链路，讲透 Object.defineProperty 的依赖收集、数组为什么监听不到、$set 与变异方法的适用边界，以及 Vue 3 用 Proxy 补上了哪些洞。
date: 2021-01-16 17:20:22
tags:
  - vue
  - 响应式原理
  - Proxy
categories: Front-End
---

写 Vue 2 的项目，大概率你撞过这么一次：`this.list[0] = newItem` 执行完了，Vue DevTools 里数据确实变了，页面纹丝不动。换成 `this.$set(this.list, 0, newItem)` 立刻就好。当时可能就记住了「数组要用 $set」这个结论，但没想明白为什么。

这背后是 Vue 2 响应式实现方式带来的一整套边界条件。搞清楚 `Object.defineProperty` 在这条链路上具体做了什么，那些「什么时候能直接改、什么时候必须用 $set」的规则就不需要死记了，能自己推出来。

这篇从数据变化到视图更新的完整链路讲起，把依赖收集、数组拦截、新增属性、整体替换这几个场景逐个拆开，最后看看 Vue 3 换成 Proxy 之后补上了哪些洞。文章偏原理侧，更偏实践总结的版本可以看 [Vue 响应式原理总结](https://feinterview.poetries.top/blog/vue-reative-summary)。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 从数据修改到 DOM 更新，中间到底经过了几道工序
- `Object.defineProperty` 的 getter 和 setter 各自负责什么
- 依赖收集里的 Dep 和 Watcher 是怎么配对的
- 数组为什么监听不到，以及「defineProperty 做不到」这个说法哪里不准确
- 数组变异方法的原型拦截是怎么实现的
- 修改已有属性、新增属性、整体替换三种场景的正确写法
- `$forceUpdate` 能让页面更新，但它和响应式不是一回事
- Vue 3 换成 Proxy 之后哪些限制消失了，又引入了什么新约束

## 一、响应式的整条链路

先把全貌摆出来。

Vue 的响应式原理核心是通过 ES5 用于保护对象的 `Object.defineProperty` 中的访问器属性，也就是 `get` 和 `set` 方法。`data` 中声明的属性都被添加了访问器属性，当读取 `data` 中的数据时自动调用 `get` 方法，当修改 `data` 中的数据时自动调用 `set` 方法。检测到数据变化后会通知观察者 `Watcher`，`Watcher` 自动触发当前组件重新 render（子组件不会重新渲染），生成新的虚拟 DOM 树。Vue 框架会遍历并对比新旧两棵虚拟 DOM 树中每个节点的差别并记录下来，最后把所有记录的不同点局部修改到真实 DOM 树上。

![Vue 响应式从数据变更到 DOM 更新的完整流程示意](https://s.poetries.top/gitee/2021/01/15.png)

这条链路可以拆成四道工序，每一道出问题的表现都不一样：

- **劫持**：初始化时递归遍历 `data`，给每个属性装上 getter/setter
- **依赖收集**：渲染过程中读取属性，getter 把当前正在渲染的 Watcher 记下来
- **派发更新**：属性被赋值，setter 通知所有记下来的 Watcher
- **打补丁**：Watcher 触发重新 render，diff 新旧虚拟 DOM，把差异打到真实 DOM 上

虚拟 DOM（Virtual DOM）是用 JS 对象模拟的，保存当前视图内所有 DOM 节点对象的基本描述属性和节点间关系的树结构。用 JS 对象描述每个节点及其父子关系，形成虚拟 DOM 对象树。

大部分「数据变了页面不动」的问题，卡的都是前两道工序。要么属性压根没被劫持，要么劫持了但依赖没收集上。

## 二、getter 和 setter 分别在干什么

很多人对 `defineProperty` 的理解停留在「拦截读写」，但读和写这两件事的分工是完全不对等的。

```js
function defineReactive(obj, key, val) {
  const dep = new Dep(); // 每个属性一个依赖收集器

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      // 谁在读我，就把谁记下来
      if (Dep.target) {
        dep.depend();
      }
      return val;
    },
    set(newVal) {
      if (newVal === val) return;
      val = newVal;
      // 我变了，通知所有记下来的人
      dep.notify();
    }
  });
}
```

getter 干的是收集的活。`Dep.target` 是一个全局变量，指向当前正在执行的 Watcher。组件渲染的时候，Vue 先把这个组件的渲染 Watcher 挂到 `Dep.target` 上，再执行 render 函数。render 过程中读到哪个属性，哪个属性的 `dep` 就把这个 Watcher 收进去。

setter 干的是通知的活。属性被赋值时，遍历自己的 `dep` 里存的所有 Watcher，挨个通知它们该更新了。

所以有个推论很关键：**没有在模板里被读到的属性，它的 dep 是空的，改了也不会触发任何更新**。

这解释了一个常见的困惑。你在 `data` 里声明了一个属性但模板里没用，改它页面当然没反应，这不是 bug，是依赖收集根本没发生。关于 `Object.defineProperty` 本身的更多用法，可以看 [Object.defineProperty 详解](https://feinterview.poetries.top/blog/Object.defineProperty)。

## 三、数组为什么监听不到

因为只要在 `data` 中声明的基本数据类型的数据基本不存在数据不响应的问题，所以重点是数组和对象在 Vue 中的数据响应问题。Vue 可以检测对象属性的修改，但无法监听数组的所有变动以及对象的新增和删除，只能使用数组变异方法及 `$set` 方法。

这里要澄清一个流传很广的说法。很多文章会写「`Object.defineProperty` 监听不到数组」，这句话其实不太准确。

数组的下标本身也是对象的属性，技术上完全可以对 `arr[0]`、`arr[1]` 逐个 `defineProperty`。Vue 2 没这么做，是主动权衡的结果。数组的长度可能是几万甚至几十万，初始化时逐个装 getter/setter 的开销扛不住，而且 `push` 之后新增的下标还得重新处理一遍。尤雨溪在多个场合都解释过这是性能取舍，不是能力缺失。

所以 Vue 2 换了个思路，不拦截下标，改成拦截方法。

![Vue 2 中 arrayMethods 对数组变异方法的重写实现](https://s.poetries.top/gitee/2021/01/16.png)

可以看到，`arrayMethods` 首先继承了 `Array.prototype`，然后对数组中所有能改变数组自身的方法进行重写。重写后的方法会先执行它们本身原有的逻辑，并对能增加数组长度的三个方法 `push`、`unshift`、`splice` 做了判断，获取到插入的值，然后把新添加的值变成响应式对象，最后调用 `ob.dep.notify()` 手动触发依赖通知。这就很好地解释了为什么 `vm.items.splice(newLength)` 能被检测到变化。

被重写的一共是七个方法：

| 方法 | 会改变原数组 | 需要额外 observe 新元素 |
|------|------------|----------------------|
| `push` | 是 | 是 |
| `unshift` | 是 | 是 |
| `splice` | 是 | 是 |
| `pop` | 是 | 否 |
| `shift` | 是 | 否 |
| `sort` | 是 | 否 |
| `reverse` | 是 | 否 |

反过来看，`filter`、`map`、`concat`、`slice` 这些方法不在列表里，因为它们返回新数组，不改变原数组。用它们的时候把结果整体赋值回去就能触发响应，走的是对象属性 setter 那条路。

至于两个经典的失效场景，现在就能自己解释了：

- `this.list[0] = x` 直接改下标，没走任何被重写的方法，`dep.notify()` 不会被调用
- `this.list.length = 0` 改长度同理，`length` 属性上没有 setter

## 四、三种修改场景该怎么写

### 4.1 修改已有属性，直接改就行

当想要修改对象已有的属性而非新增属性时，一个已经在 `data` 中声明过的响应式数据可以直接操作改变，数据改变会经过上图的步骤触发视图更新，直接 `obj.xxx = xxx` 即可。

数组除外，但后台传过来的 JSON 数组，数组中嵌套的对象也可以直接修改。因为 `Object.defineProperty` 的限制导致无法监听数组的变动，但 Vue 始终会深度遍历 `data` 中的数据，给数组中嵌套的对象添加上 get 和 set 方法，完成对对象的监听。所以数组中嵌套对象的情况是可以直接修改数组中的对象，并且保持响应式。

这一条特别实用。`this.list[0].name = 'new'` 是能触发更新的，因为 `list[0]` 这个对象本身被 observe 过，它的 `name` 属性有 setter。但 `this.list[0] = {...}` 不行，因为这一步操作的是下标。

一字之差，行为完全不同。

### 4.2 新增属性，用 $set 或变异方法

即使是一个后台传过来的 JSON 数组，也可以使用 `this.$set` 向数组中的某个对象添加一个响应式的属性，例如 `this.$set(arr[0], 'xxx', xxx)`。或者使用数组变异方法例如 `splice`。

`$set` 内部做的事情其实就三步。判断目标是数组还是对象，是数组就调重写过的 `splice` 塞进去；是对象就先检查这个 key 是不是已经存在，存在就直接赋值，不存在才走 `defineReactive` 给它补上 getter/setter，最后手动 `ob.dep.notify()` 通知一次。

```js
// 给对象新增响应式属性
this.$set(this.form, 'phone', '13800000000');

// 给数组指定位置替换元素
this.$set(this.list, 0, newItem);
// 等价写法
this.list.splice(0, 1, newItem);
```

这里有个坑要注意，`$set` 不能作用在 Vue 实例本身或者根级 `data` 对象上。也就是说 `this.$set(this, 'newProp', 1)` 会在开发环境报警告。根级属性必须在 `data` 里预先声明，哪怕先给个 `null` 占位。

### 4.3 整体替换

向响应式的数组和对象替换为新的数据时，可以直接赋值。因为 `data` 中声明的数据已经添加了访问器属性 setter，当重新赋值一个新的堆内存地址时，该数组或对象也会被循环遍历添加访问器属性，所以依然是有响应式的。

![整体替换数组或对象后依然保持响应式的示意](https://s.poetries.top/gitee/2021/01/17.png)

这是处理列表数据最省心的写法。与其纠结怎么往数组里精确插入，不如构造一个新数组整体赋值：

```js
// 与其这样
this.list[index] = newItem;

// 不如这样，走的是 list 属性的 setter，一定触发更新
this.list = this.list.map((item, i) => (i === index ? newItem : item));
```

整体替换的代价是这个数组会被重新完整地 observe 一遍，数据量很大时有性能开销。列表上万条的场景要斟酌，几十上百条完全不用考虑。

## 五、$forceUpdate 能救场，但它不是响应式

Vue 无法监听对象的新增和删除。直接通过 `obj.xxx = xxx` 新增一个原本没有的属性，同时修改当前组件的另一个响应式数据，会重新触发当前组件 render，可以让非响应式数据也保持更新状态，但它并不是响应式的。

具体来说，给一个已经在 `data` 中声明过的对象 `obj` 新增一个原本没有的属性，同时修改组件中其他某个响应式数据，该 `obj` 也会同步更新到最新的数据。另一种情况是，当你向一个对象或数组中同时增加一个响应式和一个非响应式数据，非响应式数据也会同步更新到页面上。

只要触发当前组件重新 render，就可以让数据显示为最新状态，例如 `this.$forceUpdate()`。

![通过强制重新渲染让非响应式数据同步到页面的示意](https://s.poetries.top/gitee/2021/01/18.png)

我一开始也觉得这算是个可用的技巧，后来发现它坑很深。

`$forceUpdate` 做的只是「这一次把最新值渲染出来」，属性上依然没有 setter。下一次这个属性再变，页面不会有任何反应，除非你再调一次。更麻烦的是它只强制当前组件重新渲染，不影响子组件，所以你会遇到父组件更新了、子组件还是老数据这种极难排查的现象。

线上代码里出现 `$forceUpdate`，九成是某处该用 `$set` 却没用。

## 六、为什么 Vue 3 换成了 Proxy

`Object.defineProperty` 虽然能实现双向绑定，但缺点很明确，它只能对对象的已有属性做数据劫持，所以初始化时要深度遍历整个对象，不管层级有多深。只要数组中嵌套有对象就能监听到对象的数据变化，但监听不到数组本身的变化。`Proxy` 没有这个问题，可以代理整个对象的操作，所以 Vue 3 用 `Proxy` 代替了 `defineProperty`。

Proxy 补上的洞主要有这几个：

- 直接改数组下标 `arr[0] = x` 能被拦截
- 修改 `arr.length` 能被拦截
- 新增属性 `obj.newKey = x` 能被拦截，不再需要 `$set`
- 删除属性 `delete obj.key` 能被拦截，不再需要 `$delete`
- 代理是惰性的，只有真正访问到某一层才会递归代理下去，初始化开销显著降低

```js
// Vue 3 的最简响应式模型
function reactive(target) {
  return new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key); // 依赖收集
      const res = Reflect.get(obj, key, receiver);
      // 惰性递归，访问到才代理
      return typeof res === 'object' && res !== null ? reactive(res) : res;
    },
    set(obj, key, value, receiver) {
      const oldValue = obj[key];
      const result = Reflect.set(obj, key, value, receiver);
      if (oldValue !== value) trigger(obj, key); // 派发更新
      return result;
    }
  });
}
```

但 Proxy 也不是没有代价。它代理的是对象，没法代理原始值，所以 Vue 3 才额外引入了 `ref` 用一个对象把原始值包一层。另外 `Proxy` 没有办法被 polyfill，这是 Vue 3 直接放弃 IE11 的根本原因。

`Map`、`Set`、`WeakMap` 这些集合类型也需要单独写一套 handler，因为它们的操作走的是方法调用而不是属性读写，普通的 `get`/`set` 拦截不到。

## 七、动手写一个最小的双向绑定

把前面的东西串起来，一个最小可用的双向绑定其实就是 Observer 加 Dep 加 Watcher 加 Compiler 四个部分。

![数据双向绑定的整体实现结构示意](https://s.poetries.top/gitee/2021/01/19.png)

Observer 负责递归遍历数据对象，给每个属性装上 getter/setter。Dep 是每个属性各自持有的订阅者列表。Watcher 代表一个具体的更新任务，它在被创建时把自己挂到 `Dep.target` 上，然后主动读一次数据来完成依赖收集。Compiler 负责扫描模板，遇到指令和插值就创建对应的 Watcher。

```js
class Watcher {
  constructor(vm, key, updateFn) {
    this.vm = vm;
    this.key = key;
    this.updateFn = updateFn;

    // 关键的两行：挂上去，读一次，触发 getter 完成收集，再摘下来
    Dep.target = this;
    this.vm[this.key];
    Dep.target = null;
  }

  update() {
    this.updateFn.call(this.vm, this.vm[this.key]);
  }
}
```

这十几行代码就是整个依赖收集机制的核心。理解了「挂上全局变量、主动读一次、摘掉」这三步，Vue 2 源码里 `mountComponent` 那块逻辑就不难看懂了。

至于后半段的 diff 和 patch，属于另一个话题，可以看 [虚拟 DOM 原理分析](https://feinterview.poetries.top/blog/virtual-dom-analysis)。

## 总结

Vue 2 的响应式建立在 `Object.defineProperty` 之上，getter 负责在渲染时收集依赖，setter 负责在赋值时派发更新。所有的行为边界都是从这个机制推导出来的，不需要单独记。

数组的问题不是 `defineProperty` 做不到，是 Vue 2 出于性能考虑主动放弃了对下标的逐个劫持，改成重写 `push`、`pop`、`shift`、`unshift`、`splice`、`sort`、`reverse` 这七个变异方法。绕开这七个方法去改数组，更新就不会触发。

三种修改场景的规则也就清楚了。改对象已有属性直接赋值；新增属性和改数组下标用 `$set`；改一大片就整体替换，让它走属性本身的 setter。`$forceUpdate` 只是把当前这一帧渲染出来，属性依然没有响应式，看到它出现基本可以判定某处漏了 `$set`。

Vue 3 换成 `Proxy` 之后，新增属性、删除属性、数组下标、`length` 修改全部能被拦截，初始化也从深度遍历变成了惰性递归。代价是原始值需要 `ref` 包一层，以及彻底告别 IE11。

## 参考

- [Vue 2 官方文档 深入响应式原理](https://v2.cn.vuejs.org/v2/guide/reactivity.html)
- [Vue 3 官方文档 深入响应式系统](https://cn.vuejs.org/guide/extras/reactivity-in-depth.html)
- [MDN Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
- [MDN Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [前端进阶之旅](https://interview.poetries.top)
