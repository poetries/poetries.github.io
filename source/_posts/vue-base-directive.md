---
title: Vue 基本指令用法详解与常见坑（四）
description: 把 Vue 的 v-text、v-html、v-bind、v-on、v-model、v-for、v-if/v-show、v-cloak、v-pre、v-once 这套常用指令逐个讲透，附带 key 的作用、事件修饰符顺序问题和 Vue 3 的对应写法。
date: 2018-08-26 14:10:32
tags:
  - Vue
  - 指令
  - 前端基础
categories: Front-End
---

刚上手 Vue 那阵，我最不适应的是「模板里怎么突然多了一堆 `v-` 开头的属性」。写惯了 jQuery 的人第一反应是把它们当成语法糖背下来，能跑就行。结果就是遇到列表更新错位、页面刷新瞬间闪出一串花括号、`v-if` 和 `v-show` 随手挑一个用，出了问题完全没方向。这篇把常用指令一个个过一遍，重点不是罗列语法，而是讲清楚每个指令在渲染流程里站在什么位置、什么场景该用它、哪些写法会埋雷。读完你至少能自己判断一件事：眼前这个需求，该用哪个指令。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 指令到底是什么，它和普通 HTML 属性的区别在哪
- `v-text` 和 `v-html` 的差别，以及 `v-html` 的 XSS 风险
- `v-bind` 和 `v-on` 的完整语法、缩写和传参方式
- 事件修饰符的顺序为什么会影响结果
- `v-for` 的四种遍历形式，以及 `key` 到底解决了什么问题
- `v-if` 和 `v-show` 的取舍标准
- `v-cloak` 怎么解决首屏闪烁，`v-pre` 和 `v-once` 怎么省渲染开销
- 原文里的 `v-ref` / `v-el` 是 Vue 1 的写法，Vue 2 之后应该怎么写
- 这套指令在 Vue 3 里哪些还在、哪些没了

![Vue 常用指令一览](https://s.poetries.top/gitee/2019/10/620.png)

## 一、指令是什么

先说结论，指令就是「带副作用的模板属性」。

普通的 HTML 属性是静态的，浏览器解析到 `class="btn"` 就把这个类名放上去，结束。指令不一样，Vue 在编译模板的时候会把 `v-` 开头的属性挑出来，把属性值当成一段 JavaScript 表达式求值，然后在这个 DOM 节点上挂一个更新函数。以后只要表达式里用到的数据变了，这个更新函数就会被再跑一遍。

所以指令干的事情可以拆成两半，一半是「初次渲染时把数据塞进 DOM」，另一半是「数据变了之后把 DOM 改回来」。理解了这一点，后面为什么 `v-once` 能省性能、为什么 `v-pre` 能跳过编译，就都能自己推出来了。

指令的完整写法是 `v-指令名:参数.修饰符="表达式"`。比如 `v-on:click.stop="handler"` 里面，`on` 是指令名，`click` 是参数，`stop` 是修饰符，`handler` 是表达式。四个部分不是每个指令都有，但格式是统一的。

## 二、内容渲染 v-text 和 v-html

`v-text` 更新元素的 `textContent`：

```html
<h1 v-text="msg"></h1>
```

`v-html` 更新元素的 `innerHTML`：

```html
<h1 v-html="msg"></h1>
```

两个指令看着只差一个字，风险差得远。`v-text` 走的是 `textContent`，浏览器会把内容当纯文本，标签会被转义显示出来。`v-html` 走 `innerHTML`，内容会被当成 HTML 解析。

这里有个坑要注意。只要 `v-html` 的内容里混进了用户可控的字符串，就是一个现成的 XSS 入口。评论区、富文本详情、后端返回的 HTML 片段，这几类场景是重灾区。Vue 官方文档在这块的措辞很直接，绝不要对用户提供的内容使用 `v-html`。真要渲染富文本，先过一遍 DOMPurify 这类白名单过滤库。

另外 `v-text` 和插值语法的差别只在一处，插值可以做局部替换，比如一段文字里只有中间某几个字是动态的；`v-text` 是整体替换 `textContent`，元素里原来写的内容会被覆盖掉。

## 三、属性绑定 v-bind

`v-bind` 负责把表达式的值响应式地作用到 DOM 属性上：

```html
<!-- 完整语法 -->
<a v-bind:href="url"></a>
<!-- 缩写 -->
<a :href="url"></a>
```

对应的实例：

```html
<script>
    // 创建 Vue 的实例对象
    var vm = new Vue({
      // el 用来指定 vue 挂载到页面中的元素，值是选择器
      // 理解：用来指定 vue 管理的 HTML 区域
      el: '#app',
      // 数据对象，用来给视图中提供数据的
      data: {
        url: 'http://www.baidu.com'
      }
    })
</script>
```

加不加 `v-bind` 是两件完全不同的事。写 `href="url"` 传的是字符串字面量 `"url"`，写 `:href="url"` 传的是变量 `url` 的值。这条规则在后面讲 `v-for` 的 `:value` 和讲组件 props 的时候还会反复出现，它是 Vue 模板里最容易出错也最容易解释清楚的一条。

`v-bind` 还有个特殊之处，绑到 `class` 和 `style` 上时，Vue 用的是合并而不是覆盖。也就是说静态的 `class="btn"` 和动态的 `:class="{ active: isOn }"` 可以共存，最后渲染出来两个类名都在。别的属性没有这个待遇，同名的会被动态值顶掉。

## 四、事件绑定 v-on

`v-on` 用来绑事件，绑定的处理函数从 `methods` 里取：

```html
<!-- 完整语法 -->
<a v-on:click="doSomething"></a>
<!-- 缩写 -->
<a @click="doSomething"></a>
<!-- 方法传参 -->
<a @click="doSomething('123')"></a>
```

```html
<script>
    var vm = new Vue({
      el: '#app',
      // methods 属性用来给 vue 实例提供方法（事件）
      methods: {
        doSomething: function(str) {
          // 接受参数，并输出
          console.log(str);
        }
      }
    })
</script>
```

原文这行传参示例里混进了全角括号和中文引号，直接粘到项目里会编译报错，这里换回了半角写法。老博客从网页复制代码时很容易带上这类字符，遇到「模板编译失败但看不出哪里错」，先检查一遍标点是不是全角的。

不带括号写 `@click="doSomething"`，Vue 会把原生事件对象作为第一个参数传进去。带括号写 `@click="doSomething('123')"`，事件对象就丢了，想拿到得手动写 `$event`，也就是 `@click="doSomething('123', $event)"`。这个细节在下一篇讲事件的文章里会展开。

### 4.1 事件修饰符

事件修饰符是 Vue 用得最舒服的设计之一，它把「处理业务逻辑」和「处理 DOM 事件细节」拆开了：

- `.stop` 阻止冒泡，等价于在处理函数里调用 `event.stopPropagation()`
- `.prevent` 阻止默认事件，等价于 `event.preventDefault()`
- `.capture` 添加事件侦听器时使用捕获模式
- `.self` 只当事件在该元素本身（不是子元素）触发时才执行回调
- `.once` 事件只触发一次

有了它们，方法里就不用再写那两行 `event.xxx()`，方法可以保持纯粹，只关心业务。

修饰符可以串联，但顺序会影响结果。`@click.prevent.self` 是先阻止所有点击的默认行为，再判断是不是自身触发；`@click.self.prevent` 是先判断是不是自身触发，只有自身触发时才阻止默认行为。两者行为不同，写的时候按「从左到右依次生效」去理解就不会错。

## 五、双向绑定 v-model

`v-model` 在表单元素上创建双向数据绑定，监听用户输入事件来更新数据：

```html
<input v-model="message" placeholder="edit me">
```

它不是什么特殊通道，就是「绑一个属性 + 听一个事件」的缩写。文本框绑 `value` 听 `input`，勾选框绑 `checked` 听 `change`。表单控件的完整绑定规则、三个修饰符、多选数组这些细节，我在 [Vue 表单控件与 v-model](https://feinterview.poetries.top/blog/vue-form) 那篇里单独拆过。

## 六、列表渲染 v-for

`v-for` 基于源数据多次渲染元素或模板块，它支持四种遍历形式：

```html
<!-- 1 基础用法 -->
<div v-for="item in items">
  {{ item.text }}
</div>
<!-- item 为当前项，index 为索引 -->
<p v-for="(item, index) in list">{{item}} -- {{index}}</p>
<!-- 遍历对象，item 为值，key 为键，index 为索引 -->
<p v-for="(item, key, index) in obj">{{item}} -- {{key}}</p>
<!-- 遍历整数，item 从 1 开始 -->
<p v-for="item in 10">{{item}}</p>
```

遍历整数那个写法要留意，它是从 1 开始而不是 0，做分页页码的时候正好省一次加一。

### 6.1 key 到底解决什么问题

`v-for` 用起来简单，出问题基本都出在没写 `key` 上。

Vue 更新已渲染的元素列表时，默认用的是「就地复用」策略。如果数据项的顺序变了，Vue 不会去移动 DOM 元素来匹配数据项的顺序，而是简单复用此处的每个元素，确保它在特定索引下显示已被渲染过的每个元素。这套策略类似 Vue 1.x 里的 `track-by="$index"`。

```html
<div v-for="item in items" :key="item.id">
  <!-- 内容 -->
</div>
```

那不写 `key` 到底会怎样？就地复用在纯展示的静态列表上完全没问题，性能还更好。翻车的是带内部状态的列表。你想想看，一个待办列表每项都有个复选框，你勾上了第三项，然后在头部插入一条新数据。没有 `key` 的话，Vue 认为第三个位置的 DOM 还是那个 DOM，只是文本内容变了，于是复用它，而复选框的勾选状态是 DOM 自身的状态，不会被重置。结果就是你勾的那条内容变了，勾还留在原位。

给了 `key`，Vue 就能按 key 去匹配新旧节点，该移动的移动，该销毁的销毁，状态自然跟着数据走。带表单元素、带过渡动画、带组件实例的列表，`key` 是必须的。

还有一条，别拿数组下标当 `key`。用 `index` 相当于没给，因为下标本身就是位置，插入删除之后所有下标都变了，等于告诉 Vue「每一项都变了」。用数据里稳定唯一的 id。

现在的 ESLint 规则 `vue/require-v-for-key` 会直接把漏写 `key` 报成错误，2018 年那会儿它还只是推荐项。

## 七、样式处理，class 和 style

`class` 和 `style` 都是 HTML 元素的属性，用 `v-bind` 绑定时，只需要通过表达式计算出结果即可。表达式的类型可以是字符串、数组、对象：

```html
<!-- 对象语法：值为真的键名会被加上 -->
<div v-bind:class="{ active: true }"></div>
<!-- 渲染为 <div class="active"></div> -->

<!-- 数组语法 -->
<div :class="['active', 'text-danger']"></div>
<!-- 渲染为 <div class="active text-danger"></div> -->

<!-- 数组里套对象 -->
<div v-bind:class="[{ active: true }, errorClass]"></div>
<!-- 渲染为 <div class="active text-danger"></div> -->
```

`style` 同理，注意 CSS 属性名要写成驼峰形式，或者用引号包住中划线形式：

```html
<div v-bind:style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>
<!-- 把多个样式对象应用到一个元素上 -->
<div v-bind:style="[baseStyles, overridingStyles]"></div>
```

对应的数据：

```html
<script>
    var vm = new Vue({
      el: '#app',
      data: {
        activeColor: 'red',
        fontSize: 30,
        baseStyles: {
          color: 'red',
          'font-size': '30px'
        },
        overridingStyles: {
          color: 'green'
        }
      }
    })
</script>
```

数组语法里后面的对象会覆盖前面的同名属性，上面这个例子最终字体是绿色的。这块的完整用法我在 [Vue 绑定 class 与 style](https://feinterview.poetries.top/blog/vue-bind-class-style) 那篇里写得更细。

## 八、条件渲染 v-if 和 v-show

两个指令的效果肉眼看着一样，机制完全不同：

- `v-if` 根据表达式的真假，销毁或重建元素。为假时元素压根不在 DOM 里，连同它内部的组件、事件监听、子组件生命周期一起销毁
- `v-show` 根据表达式的真假，切换元素的 `display` 属性。元素始终在 DOM 里，只是看不见

选哪个的判断标准就一条，看切换频率。频繁切换用 `v-show`，因为它只改一个 CSS 属性，代价极低；条件基本不变或者只在初始化时判断一次的用 `v-if`，因为它能省掉整块 DOM 和组件实例的创建开销。

一个常被忽略的点，`v-if` 是惰性的，条件为假时里面的内容根本不会渲染。所以权限控制、按角色显示的区块要用 `v-if`，用 `v-show` 的话内容其实已经在 DOM 里了，F12 一开就能看见。

## 九、提升用户体验，v-cloak

`v-cloak` 这个指令会保持在元素上，直到关联实例结束编译。配合下面这条 CSS 规则一起用，可以隐藏未编译的插值标签，直到实例准备完毕：

```html
<style>
  [v-cloak] { display: none; }
</style>

<div v-cloak>
  {{ message }}
</div>
```

它解决的是一个很具体的体验问题。用 CDN 直接引 Vue 的页面，浏览器解析到 HTML 时 Vue 还没执行，模板里的双花括号会原样显示在页面上，网速慢的时候能闪个几百毫秒，用户看到的就是一串奇怪的符号。

现在用 `vue-cli` 或者 Vite 构建的单文件组件项目基本遇不到这个问题，因为模板在构建阶段就被编译成渲染函数了，页面上根本不存在未编译的插值。但只要你还在写 CDN 引入的页面，`v-cloak` 依然有用。

## 十、提升性能，v-pre 和 v-once

这两个指令都是拿「放弃响应式」换渲染开销。

`v-pre` 跳过这个元素和它子元素的编译过程。它有两个用途，一是显示原始的插值标签（写文档、做代码演示的时候有用），二是跳过大量没有指令的静态节点来加快编译：

```html
<span v-pre>{{ this will not be compiled }}</span>
```

`v-once` 只渲染元素和组件一次。之后的重新渲染，这个元素及其所有子节点都会被当作静态内容跳过：

```html
<span v-once>This will never change: {{msg}}</span>
```

区别在于，`v-pre` 是连编译都不做，里面的插值原样输出；`v-once` 会正常编译渲染一次，拿到当前值，之后不再更新。

我自己的感受是，这两个指令在业务代码里用得非常少，真正需要它们的时候多半是长列表或者大段静态文案拖慢了更新。日常写业务先别惦记它，等 Vue Devtools 的性能面板明确指出某块渲染耗时高了再来用。

## 十一、拿 DOM 元素，v-ref 和 v-el

这一节要先说明一件事：`v-ref` 和 `v-el` 是 **Vue 1.x 的写法，Vue 2 已经把它们移除了**。原文当时把这两个指令一起收进了 Vue 2 的笔记里，跑起来是不生效的。为了保留原文的知识脉络，下面先照录 Vue 1 的用法，再给出 Vue 2 之后的正确写法。

Vue 1 里 `v-ref` 在父组件上注册一个子组件的索引，便于直接访问，不需要表达式，必须提供参数 id。和 `v-for` 一起用时，注册的值是一个数组，包含所有子组件；如果 `v-for` 用在对象上，注册的值就是一个对象。

`v-el` 则是给 DOM 元素注册一个索引，通过所属实例的 `$els` 访问：

```html
<span v-el:msg>hello</span>
<span v-el:other-msg>world</span>
```

```javascript
this.$els.msg.textContent  // ==>  "hello"
this.$els.otherMsg.textContent  // ==>  "world"
```

Vue 2 把这两个指令合并成了一个普通属性 `ref`，DOM 元素和组件实例都用它，统一从 `this.$refs` 上取：

```html
<span ref="msg">hello</span>
<my-component ref="child"></my-component>
```

```javascript
this.$refs.msg.textContent   // "hello"
this.$refs.child.someMethod() // 调用子组件的方法
```

`$els` 这个属性在 Vue 2 里不存在了，写了会拿到 `undefined`。用 `ref` 的时候还有个时机问题，`$refs` 要等 DOM 挂载完才有值，在 `created` 里访问是拿不到的，得放到 `mounted` 里。关于每个钩子里能拿到什么，[Vue 生命周期](https://feinterview.poetries.top/blog/vue-lifecircle) 那篇按阶段拆过一遍。

## 十二、Vue 3 里这套指令变了什么

上面所有写法在 Vue 3 里绝大部分能原样用，Vue 3 保留了整套内置指令的语法。差别集中在几处：

`v-model` 在自定义组件上的展开方式变了，从 `value` 加 `input` 变成 `modelValue` 加 `update:modelValue`，`.sync` 修饰符被移除，功能并进了 `v-model:参数` 的写法。原生表单元素上的 `v-model` 不受影响。

`v-if` 和 `v-for` 同时用在一个元素上时，优先级反过来了。Vue 2 里 `v-for` 优先级更高，Vue 3 里 `v-if` 更高，所以 Vue 2 那种「用 `v-if` 过滤列表项」的写法迁移过去会直接报错，因为 `v-if` 先执行时拿不到 `v-for` 的循环变量。这两个指令本来就不该写在同一个元素上，正确做法是把过滤逻辑放进计算属性。

按键修饰符里的 `keyCode` 数字形式被移除了，`Vue.config.keyCodes` 这个全局配置也没了，改成直接用按键名，比如 `@keyup.enter`。

`ref` 依然可用，但在 `script setup` 里的取法不一样了。选项式 API 还是 `this.$refs`，组合式 API 需要声明一个同名的响应式引用来接。具体写法以官方文档为准，这块我只在小 demo 里验证过。

`v-cloak` 在 Vue 3 里还在，只是构建型项目基本用不上了。

## 总结

回头看，这十来个指令按职责能分成四组：

- 往 DOM 里塞内容的：`v-text`、`v-html`、插值
- 建立数据到 DOM 单向连接的：`v-bind`
- 建立 DOM 到数据反向连接的：`v-on`、`v-model`
- 控制节点存在与否的：`v-if`、`v-show`、`v-for`

剩下的 `v-cloak`、`v-pre`、`v-once` 是三个专项开关，各解决一个具体问题，不常用但用对了很省事。

几条实操结论：`v-html` 只在内容可控时用；`v-for` 一定给稳定唯一的 `key`，别用下标；频繁切换选 `v-show`，权限相关选 `v-if`；`v-ref` / `v-el` 是 Vue 1 的遗产，现在统一用 `ref` 加 `$refs`。

## 参考

- [Vue 3 官方文档 - 模板语法](https://cn.vuejs.org/guide/essentials/template-syntax.html)
- [Vue 3 官方文档 - 内置指令](https://cn.vuejs.org/api/built-in-directives.html)
- [Vue 3 官方文档 - 列表渲染](https://cn.vuejs.org/guide/essentials/list.html)
- [Vue 3 官方文档 - 条件渲染](https://cn.vuejs.org/guide/essentials/conditional.html)
- [Vue 2 官方文档存档](https://v2.cn.vuejs.org/)
- [Vue 3 迁移指南](https://v3-migration.vuejs.org/)
- [前端进阶之旅](https://interview.poetries.top)
