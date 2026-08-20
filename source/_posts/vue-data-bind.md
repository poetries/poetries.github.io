---
title: Vue中的数据绑定 八类绑定语法一次讲透（二）
description: Vue 系列第二篇，把文本插值、属性绑定、类名绑定、样式绑定、条件与列表渲染、事件绑定、按键修饰符和 v-model 八类绑定语法排成一张表，并修正原文里几处写错的模板写法。
date: 2018-08-26 14:01:32
tags:
  - Vue
  - 数据绑定
  - v-model
categories: Front-End
---

上一篇讲了数据驱动这个思路，这篇开始落到手上。Vue 里所有「让数据出现在页面上」的活，最后都会归到几种绑定语法里，插值、属性、类名、样式、条件、列表、事件、按键、`v-model`，加起来不到十种。麻烦的是它们的写法长得很像，对象语法和数组语法混在一起，字符串里还要嵌表达式，第一次写很容易写成看着对但跑不出来的样子。这篇把这几类绑定一次排完，每一类都给出正确写法和常见的写错方式，顺手把原文里几处笔误也修掉。

> Vue 对象的改变会直接影响到 HTML 标签的变化，而且标签的变化也会反过来影响 Vue 对象属性的变化

![Vue 双向绑定示意图，数据模型与视图之间通过 ViewModel 双向联动](https://malun666.github.io/aicoder_vip_doc/pages/vue/imgs/02vue%E5%8F%8C%E5%90%91%E7%BB%91%E5%AE%9A.jpg)

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 文本渲染的三种方式，插值、`v-text`、`v-html`，以及 `v-html` 的安全红线
- 属性绑定 `v-bind` 的完整写法和缩写
- 类名绑定的对象、数组、三元三种语法，以及最容易写错的地方
- 内联样式绑定，对象、对象数组两种写法
- 条件渲染与列表渲染，`v-if` 和 `v-show` 怎么选，`v-for` 的四种参数形态
- 事件绑定与六个事件修饰符的实际用途
- 按键修饰符的全部别名
- `v-model` 的原理和 `.lazy`、`.number`、`.trim` 三个修饰符
- 以上写法在 Vue 3 里哪些变了

## 一、先把这张图看懂

上面那张图画的就是双向绑定的两条路。数据变了往右推到视图，用户在视图上操作又往左写回数据，中间那层胶水由 Vue 实例来做。

后面所有语法都可以按方向归类。绝大多数指令只走「数据到视图」这一条，包括插值、`v-bind`、`v-if`、`v-for`。只有 `v-model` 是双向的，它在表单元素上同时挂了值绑定和输入监听。想清楚这一点，就不会再纠结「为什么 `v-bind:value` 改不动数据」。

## 二、文本渲染

三种写法，各有各的场景：

```html
  <div>{{ message }}</div>      <!--文本插值，最常用-->
  <div v-html="htmlMess"></div> <!--按 HTML 解析并写入 innerHTML-->
  <div v-text="message"></div>  <!--等价于设置 textContent-->
```

原文这里写的是单层大括号 `{message}`，那是渲染不出来的，Vue 的插值语法要求双层大括号，上面改过来了。这个笔误在老教程里出现频率相当高。

插值和 `v-text` 的效果基本一致，差别在于 `v-text` 会整个替换元素内容，而插值可以和其他文本混排。另外页面加载瞬间，插值语法有可能被用户看见原始的双大括号，`v-text` 不会，这也是 `v-cloak` 存在的原因。

`v-html` 是三个里唯一有风险的。它走的是 `innerHTML`，字符串里的标签会被真的执行。任何来自用户输入、来自接口的富文本，直接丢给 `v-html` 就是给自己开了一个 XSS 口子。要用就先过一遍白名单过滤。

## 三、属性绑定

想让 HTML 属性的值跟着数据走，就得用 `v-bind`：

```html
<h1 v-bind:title="message">aaa</h1>  <!--属性绑定-->
<a v-bind:href="url">百度</a>        <!--属性绑定-->
<a :href="url">百度</a>              <!--缩写-->
```

有个细节新手容易忽略。`href="url"` 和 `:href="url"` 是两件完全不同的事，前者的值就是字符串 `url` 这四个字母，后者才会去 data 里找名叫 `url` 的变量。凡是引号里想写变量或表达式，前面就得有冒号。

## 四、类名绑定

这是几类绑定里花样最多的一个：

```html
<!--单个类名，isActive 为 true 时 active 生效-->
<div v-bind:class="{ active: isActive }"></div>

<!--多个类名，用逗号隔开-->
<div v-bind:class="{ active: isActive, red: isRed }"></div>

<!--直接绑定 data 里的一个对象-->
<div v-bind:class="classObj"></div>

<!--数组语法，activeClass 和 redClass 的值是类名字符串-->
<div v-bind:class="[activeClass, redClass]"></div>

<!--三元表达式，注意类名要加引号-->
<div v-bind:class="isActive ? 'active' : 'red'"></div>
```

原文这五行有三处写法不成立，我逐条说明一下。

第一处，`v-bind:class="active : isActive"` 少了外层花括号，对象语法必须写成 `{ active: isActive }`，不然 Vue 会把它当表达式解析然后报错。第二处同理，多类名也要包在一对花括号里。第三处是三元那行，`isActive ? active : red` 里的 `active` 和 `red` 会被当成 data 里的变量去找，找不到就是 `undefined`，想直接写死类名必须加引号。

数组语法这里也有个容易混的点。`[activeClass, redClass]` 里放的是变量，变量的值才是类名字符串。原文写的是 `[active, red]`，如果 data 里没有叫 `active` 的字段，这一行同样不生效。

这块的完整展开，包括在组件上用 class、以及用计算属性返回类名对象这个常用模式，在下一篇 [vue之class与style绑定（三）](https://feinterview.poetries.top/blog/vue-bind-class-style) 里。

## 五、内联样式绑定

```html
<!--内联样式，对象字面量-->
<div v-bind:style="{ width: width, height: height }"></div>

<!--绑定 data 里的样式对象-->
<div v-bind:style="styleObj"></div>

<!--样式对象数组，后面的覆盖前面的-->
<div v-bind:style="[styleObj1, styleObj2]"></div>
```

原文第二行把 `style` 拼成了 `sytle`，这样写 Vue 不会报错，只会当成一个普通的自定义属性原样输出到 DOM 上，页面没效果但控制台干干净净，排查起来特别费劲。这个我踩过，盯着 data 看了半天才发现问题在标签上。

样式对象里的属性名要用驼峰，`fontSize` 而不是 `font-size`；一定要写连字符形式的话，得加引号包起来。值必须带单位，`width: 100` 是无效的，得是 `'100px'`。

## 六、条件渲染与列表渲染

### 6.1 v-if 与 v-show

```html
<!--条件为真时才创建元素，为假时 DOM 里根本没有这个节点-->
<p v-if="seen">hahah</p>

<!--元素始终存在，只是切换 display 属性-->
<p v-show="seen">hah</p>
```

两者的取舍标准就一条，看切换频率。`v-if` 每次都要销毁和重建整棵子树，还会触发子组件的生命周期，切换成本高但初始不渲染时开销为零。`v-show` 相反，初始就会渲染出来，之后切换只改一个 CSS 属性，几乎没有代价。

所以像 tab 面板这种反复切的用 `v-show`，像「只有管理员才能看到的一整块表单」这种基本不变的用 `v-if`。

还有一点，`v-show` 不能用在 `<template>` 上，也不能和 `v-else` 配合。

### 6.2 v-for 的四种参数形态

```html
<!--遍历数组，取每一项-->
<p v-for="item in lists">{{ item.text }}</p>

<!--遍历数组，同时拿到索引-->
<p v-for="(item, index) in lists">{{ index }}:{{ item }}</p>

<!--遍历对象，第一个参数是值，第二个是键-->
<p v-for="(value, key) in obj">{{ key }}:{{ value }}</p>

<!--遍历对象，第三个参数是索引-->
<p v-for="(value, key, index) in obj">{{ index }}:{{ key }}:{{ value }}</p>

<!--遍历整数，n 从 1 开始-->
<p v-for="n in 10">{{ n }}</p>
```

原文这几行有两类问题。一是括号里的参数之间漏了逗号，`(key value)` 这种写法会直接编译报错。二是参数顺序反了，Vue 的对象遍历约定是值在前、键在后，写成 `(key, value)` 的话你拿到的 `key` 其实是值。这两处上面都改正了。另外第一行原文写的是 `{{alist.text}}`，`alist` 这个变量并不存在，应该是 `list.text` 的笔误，这里统一用 `item`。

`v-for` 还有一条实践上的硬要求，加 `key`。没有 `key` 时 Vue 用的是就地复用策略，列表顺序变了它不会移动 DOM，只会原地改内容，一旦列表项里有输入框或者组件内部状态，就会串位。用索引当 `key` 也不行，索引在插入删除时会整体变动，跟没写差不多。要用数据本身的唯一 id。

## 七、事件绑定与修饰符

```html
<!--绑定 fun1 方法-->
<a v-on:click="fun1">点击</a>

<!--缩写-->
<a @click="fun1">点击</a>
```

事件修饰符是 Vue 里我觉得设计得最舒服的一处，它把一堆重复的样板代码压成了后缀：

```html
<!-- 阻止单击事件冒泡 -->
<a v-on:click.stop="doThis"></a>

<!-- 提交事件不再重载页面 -->
<form v-on:submit.prevent="onSubmit"></form>

<!-- 修饰符可以串联 -->
<a v-on:click.stop.prevent="doThat"></a>

<!-- 只有修饰符，不需要处理函数 -->
<form v-on:submit.prevent></form>

<!-- 添加事件侦听器时使用事件捕获模式 -->
<div v-on:click.capture="doThis">...</div>

<!-- 只当事件在该元素本身而不是子元素上触发时才回调 -->
<div v-on:click.self="doThat">...</div>

<!-- 点击事件只触发一次，2.1.4 版本新增 -->
<a v-on:click.once="doThis"></a>
```

这几个里 `.self` 和 `.stop` 经常被搞混。`.stop` 是我这个元素被触发之后不让事件继续往上冒；`.self` 是只有事件的目标就是我自己时才响应，子元素冒上来的一律不管。做遮罩层点击关闭弹窗的时候用的是 `.self`，因为点弹窗内容区不应该关闭。

修饰符串联的顺序有讲究，第六篇会专门说这个。

## 八、按键修饰符

按键事件可以直接在后面写别名，省掉手动判断 `keyCode`：

```html
<input v-on:keyup.enter="submit">
<input @keyup.enter="submit">
```

Vue 2 内置的别名有这些：

- `.enter`
- `.tab`
- `.delete`（同时捕获「删除」和「退格」两个键）
- `.esc`
- `.space`
- `.up`
- `.down`
- `.left`
- `.right`
- `.ctrl`
- `.alt`
- `.shift`
- `.meta`

前九个是普通按键，后四个是系统修饰键，用法不太一样。系统修饰键单独用在 `keyup` 上会有个反直觉的行为，比如 `@keyup.ctrl` 只有在松开 Ctrl 的同时还按着别的键才触发，实际项目里一般是当组合键的前缀用，写成 `@keyup.ctrl.enter` 这种。

## 九、v-model 与三个修饰符

```html
<p>{{ message }}</p>

<!--输入框的值会同步到 message-->
<input type="text" v-model="message" />

<select v-model="message" id="aa">
    <option>百度</option>
    <option>腾讯</option>
    <option>阿里</option>
</select>
```

原文这里也是单层大括号，一并改成了双层。

`v-model` 不是什么魔法，它就是语法糖。在 `input` 上它展开成 `:value` 加 `@input`，在 `select` 和 `checkbox` 上展开成 `:value` 加 `@change`。知道这一点之后很多问题就自解了，比如为什么中文输入法打字过程中 `v-model` 的值会跳，因为 `input` 事件在拼音上屏前就一直在触发。

三个修饰符分别处理三类烦人的细节：

- `v-model.lazy` 把同步时机从 `input` 改成 `change`，输入过程中不更新，失焦或回车才更新。中文输入和实时校验场景很有用
- `v-model.number` 把能转成数字的字符串转成数字。表单里拿到的原始值永远是字符串，不加这个修饰符，`age` 拿到的是 `'18'` 而不是 `18`，做数值比较时会出问题
- `v-model.trim` 自动去掉首尾空格，用户名和手机号这类输入框基本都该挂上

原文把 `.number` 写成了 `.mumber`，这里改正。

表单控件绑定还有 checkbox 多选绑数组、radio 绑值、`select` 多选这些细节，第七篇 [vue 表单控件与绑定（七）](https://feinterview.poetries.top/blog/vue-form) 会专门讲。

## 十、Vue 3 里有什么不一样

上面全部是 Vue 2 的写法。Vue 2 已经停止官方维护，新项目用 Vue 3，这里把对应关系列一下，老代码迁移时可以照着查。

`v-model` 的变化最大。在组件上使用时，Vue 2 默认展开成 `value` 加 `input` 事件，Vue 3 改成了 `modelValue` 加 `update:modelValue`。而且 Vue 3 支持一个组件上挂多个 `v-model`，写法是 `v-model:title="xxx"`，Vue 2 里要实现这个得靠 `.sync` 修饰符，那个修饰符在 Vue 3 里被移除了。原生表单元素上的 `v-model` 用法没变。

按键修饰符方面，Vue 3 移除了 `config.keyCodes` 全局配置，也不再支持直接写数字键码。别名改成基于 `KeyboardEvent.key` 的短横线格式，比如 `.page-down`。常用的 `.enter`、`.esc`、`.delete` 这些还在。

事件方面，`.native` 修饰符被移除了，取而代之的是组件上的 `emits` 选项，没有在 `emits` 里声明的监听器会自动落到根元素上。

`v-if` 和 `v-for` 同时用在一个元素上时的优先级也反了。Vue 2 里 `v-for` 优先级更高，Vue 3 里 `v-if` 更高。不过这两个本来就不建议写在同一个标签上，该拆就拆。

过滤器整个被移除，管道语法在 Vue 3 里不再可用。

## 总结

这一篇的内容看着杂，其实就三条主线。

数据到视图这条线上，插值和 `v-text` 管文本，`v-html` 管富文本但有 XSS 风险，`v-bind` 管属性，class 和 style 是 `v-bind` 的两个特化版本，支持对象和数组两种语法。

结构控制这条线上，`v-if` 是真删真建，`v-show` 只切 `display`，`v-for` 的对象遍历参数顺序是值、键、索引，`key` 必须给稳定的唯一 id。

视图到数据这条线上，只有 `v-model` 和事件绑定。`v-model` 是 `:value` 加输入监听的语法糖，三个修饰符分别处理同步时机、类型转换和空格。

原文里被我改掉的几处，单层大括号、对象语法缺花括号、`sytle` 拼写、`v-for` 参数缺逗号且顺序反了、`.mumber`，都是那种编译器不一定报错、但页面一定没效果的坑，写的时候多留个心。

上一篇是 [初识Vue与环境搭建（一）](https://feinterview.poetries.top/blog/vue-start)，下一篇进入 class 与 style 绑定的细节。

## 参考

- [Vue 3 官方文档 - 模板语法](https://cn.vuejs.org/guide/essentials/template-syntax.html)
- [Vue 3 官方文档 - 列表渲染](https://cn.vuejs.org/guide/essentials/list.html)
- [Vue 3 官方文档 - 表单输入绑定](https://cn.vuejs.org/guide/essentials/forms.html)
- [Vue 3 官方文档 - 事件处理](https://cn.vuejs.org/guide/essentials/event-handling.html)
- [Vue 2 官方文档（已停止维护）](https://v2.cn.vuejs.org/)
- [Vue 3 迁移指南](https://v3-migration.vuejs.org/)
- [前端进阶之旅](https://interview.poetries.top)
