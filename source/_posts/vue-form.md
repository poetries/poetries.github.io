---
title: Vue 表单控件与 v-model 双向绑定实战（七）
description: 从 v-model 的语法糖展开，讲透 Vue 里文本框、数字框、多行文本、复选框、单选框、下拉框的绑定写法，以及 lazy/number/trim 修饰符和 Vue 3 的语义变化。
date: 2018-08-27 10:10:32
tags:
  - Vue
  - v-model
  - 表单
categories: Front-End
---

写业务表单的时候，最容易被 `v-model` 的「省事」骗过去。一个 `v-model="age"` 敲上去，输入框和数据就通了，看起来什么都不用管。可等到提交接口的时候你会发现，年龄字段传过去是字符串 `"18"` 而不是数字 18；多选框绑了个空字符串，选了三项之后 data 里只剩最后一个值；下拉框第一次进页面显示的是空白，用户还以为页面挂了。这些都不是玄学，是 `v-model` 在不同控件上展开成了不同的东西。这篇把六类常用表单控件的绑定写法逐个过一遍，顺带把每种写法背后到底绑了什么属性、监听了什么事件讲清楚。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `v-model` 在不同表单控件上分别展开成什么
- 文本框、数字框、多行文本框的绑定，以及 `.number` 为什么必须加
- 复选框的三种形态，单个布尔值、自定义真假值、多选数组
- 单选框和下拉框的绑定，动态选项与多选列表
- `.lazy` / `.number` / `.trim` 三个修饰符各自解决什么问题
- Vue 3 里 `v-model` 的语义变化，以及老代码迁移时要动哪里

## 一、v-model 不是魔法，是语法糖

先说结论，`v-model` 只是「绑一个属性 + 听一个事件」的缩写。

拿最普通的文本框来说，写 `v-model="textBox"` 和下面这段是等价的：

```html
<input :value="textBox" @input="textBox = $event.target.value">
```

Vue 帮你做的事情就两件，把数据的值同步到 DOM 上，再把用户输入回写到数据里。所以「双向绑定」这个词容易让人以为有什么特殊通道，其实只是把单向绑定正反各接了一遍。

关键在于，不同的控件绑的属性和听的事件不一样：

| 控件 | 绑定的属性 | 监听的事件 |
|------|-----------|-----------|
| `input[type=text]` / `textarea` | `value` | `input` |
| `input[type=checkbox]` | `checked` | `change` |
| `input[type=radio]` | `checked` | `change` |
| `select` | `value` | `change` |

搞清楚这张表，后面遇到的绝大多数「为什么绑不上」都能自己推出来。比如复选框听的是 `change` 不是 `input`，所以你想在每次勾选时做点别的事，写 `@input` 是不会触发的。

还有一条容易被忽略的规则，`v-model` 会忽略所有表单元素上 `value`、`checked`、`selected` 的初始值，一律以 Vue 实例 data 里的值为准。也就是说你在 HTML 里写死的 `value="张三"`，页面渲染出来是空的，因为 data 里是空字符串。想给初值就去 data 里给。

## 二、文本框

### 2.1 普通文本框

最基础的一种，输入什么 data 里就是什么：

```html
<div id="app-1">
    <p><input v-model="textBox" placeholder="输入内容...">输入的内容：{{ textBox }}</p>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            textBox: ''
        }
    })
</script>
```

这段代码有个细节值得留意，`data` 里的 `textBox` 初始化成了空字符串而不是 `null` 或者干脆不写。Vue 2 的响应式基于 `Object.defineProperty`，只有在实例创建时就存在于 data 里的属性才会被转成响应式的。后加的属性不会自动响应，得走 `Vue.set`。所以哪怕暂时没值，也要在 data 里先占个位。

### 2.2 数字文本框

表单里最常见的类型不匹配问题就出在这儿：

```html
<div id="app-1">
    <p><input v-model.number="numberTextBox" type="number" placeholder="输入内容..."> 输入的内容：{{ numberTextBox }}</p>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            numberTextBox: ''
        }
    })
</script>
```

`.number` 修饰符会把返回值转成 `Number` 类型。为什么非要加它？因为就算你写了 `type="number"`，HTML 规范里 `input.value` 的类型永远是字符串，浏览器不会替你转。不加 `.number`，你拿到的是 `"18"`，做加法就变成了字符串拼接，`age + 1` 得到 `"181"`。

这个我踩过。当时后端接口校验类型，年龄字段传字符串直接 400，翻了半天以为是接口文档不对，最后发现是少写了一个修饰符。

`.number` 的实现是调用 `parseFloat`，如果转不出数字（比如用户输了一堆空格或者字母），它会原样返回字符串。所以 `.number` 只能保证「能转就转」，不能保证「一定是数字」，真要保证还得配校验。

### 2.3 多行输入框

`textarea` 用法和文本框一样，注意展示的时候要保留换行：

```html
<div id="app-1">
    <p><textarea v-model="multiTextBox" placeholder="输入内容..."></textarea></p>
    <p>输入的内容：</p>
    <p style="white-space:pre">{{ multiTextBox }}</p>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            multiTextBox: ''
        }
    })
</script>
```

`style="white-space:pre"` 表示空白会被浏览器保留，行为类似 HTML 里的 `<pre>` 标签。不加这一句，用户在文本域里敲的回车在展示区会被折叠成一个空格，看起来像丢了数据。实际项目里更常用 `pre-wrap`，它既保留换行又允许长行自动折行，纯 `pre` 遇到长文本会撑出横向滚动条。

另外提一句，`textarea` 里千万别写插值，像 `<textarea>{{ text }}</textarea>` 这种在 Vue 里是无效的，官方明确要求用 `v-model` 代替。

## 三、复选框

复选框是三类控件里变化最多的，因为它有三种完全不同的用法。

### 3.1 单个复选框

一个复选框绑一个布尔值，勾上是 `true`，取消是 `false`：

```html
<div id="app-1">
    <input type="checkbox" id="checkbox" v-model="singleCheckBox">
    <label for="checkbox">{{ singleCheckBox }}</label>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            singleCheckBox: false
        }
    })
</script>
```

这种适合「同意用户协议」「记住我」这类开关型场景。

### 3.2 自定义真假值的复选框

问题来了，后端接口经常不收布尔值，它要的是 `"Y"` / `"N"`，或者 `1` / `0`。这时候不用在提交前手动转，`true-value` 和 `false-value` 就是干这个的：

```html
<div id="app-1">
    <input type="checkbox" id="checkbox" v-model="customSingleCheckBox" v-bind:true-value="customTrue" v-bind:false-value="customFalse">
    <label for="checkbox">{{ customSingleCheckBox }}</label>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            customTrue: '真',
            customFalse: '假',
            customSingleCheckBox: '假'
        }
    })
</script>
```

`v-bind:true-value` 设置为真时的属性，`v-bind:false-value` 设置为假时的属性。

这里有个坑要注意。`true-value` 和 `false-value` 不是标准 HTML 属性，是 Vue 自己加的，只在 `v-model` 场景下生效。而且如果你写成不带 `v-bind` 的 `true-value="Y"`，传的是字符串字面量 `"Y"`；写成 `:true-value="1"` 才是数字 1。两者在后续做 `===` 比较时结果完全不同。

还有一点，用了自定义值之后，未勾选状态下 data 里存的是 `false-value` 而不是 `false`。要是你别的地方写了 `if (form.agree)` 这种真值判断，`'假'` 这个字符串是真值，判断就翻车了。

### 3.3 多个复选框绑数组

多选场景下，把多个复选框绑到同一个数组上，每个框的 `value` 就是它选中后进数组的值：

```html
<div id="app-1">
    <input type="checkbox" id="tansea" value="TanSea" v-model="multiCheckBox">
    <label for="tansea">TanSea</label>
    <input type="checkbox" id="google" value="Google" v-model="multiCheckBox">
    <label for="google">Google</label>
    <input type="checkbox" id="baidu" value="Baidu" v-model="multiCheckBox">
    <label for="baidu">Baidu</label>
    <p>选择的项：{{ multiCheckBox }}</p>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            multiCheckBox: []
        }
    })
</script>
```

`multiCheckBox` 必须初始化成数组 `[]`。这是文章开头提到的那个坑，初始化成 `''` 或者 `false` 的话，Vue 会按单个复选框的逻辑处理，三个框会一起联动，选一个全选中，data 里永远只有一个布尔值。

数组里元素的顺序是按用户勾选顺序进去的，不是按 DOM 顺序。如果你要提交给后端的顺序有要求，提交前自己排一次。

## 四、单选框

单选框靠 `name` 分组是原生 HTML 的做法，在 Vue 里靠的是绑同一个 `v-model`：

```html
<div id="app-1">
    <input type="radio" id="male" value="男" v-model="radioBox">
    <label for="male">男</label>
    <input type="radio" id="female" value="女" v-model="radioBox">
    <label for="female">女</label>
    <p>选择的项：{{ radioBox }}</p>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            radioBox: ''
        }
    })
</script>
```

原文这段代码块开头混进了一行复制网页时带上来的「复制代码」，直接跑会当成文本节点渲染出来，这里去掉了。

单选框的 `value` 就是选中后写进 data 的值。绑同一个 `v-model` 的一组 radio，Vue 会自动帮它们互斥，不需要再写 `name`。不过为了无障碍和表单原生提交，加上 `name` 也没坏处。

如果选项是从接口拿的，记得配 `v-for` 的时候用 `:value` 而不是 `value`，前者传的是表达式的值，后者传的是字符串字面量。这一点在 [Vue 绑定 class 与 style](https://feinterview.poetries.top/blog/vue-bind-class-style) 里也是同样的规则，`v-bind` 决定了引号里的内容按表达式还是按字符串处理。

## 五、下拉框

### 5.1 普通下拉框

```html
<div id="app-1">
    <select v-model="comboBox">
        <option disabled value="">请选择一项</option>
        <option>男</option>
        <option>女</option>
    </select>
    <p>选择的项：{{ comboBox }}</p>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            comboBox: ''
        }
    })
</script>
```

第一个 `<option disabled value="">请选择一项</option>` 不是可有可无的装饰。`v-model` 绑的初始值是空字符串，如果没有一个 `value` 为空的选项去匹配它，`select` 在 iOS 上会渲染成一片空白，用户根本不知道这是个下拉框。加上这个占位项之后，初始态显示「请选择一项」，而 `disabled` 保证用户点开之后没法把它选回去。

`<option>` 不写 `value` 时，选中后取的是标签内的文本内容。所以上面选「男」，data 里就是字符串 `'男'`。

### 5.2 动态绑定下拉框

真实项目里选项基本都来自接口，用 `v-for` 渲染：

```html
<div id="app-1">
    <select v-model="dynamicComboBox">
        <option v-for="optionItem in optionItems" v-bind:value="optionItem.value">
            {{ optionItem.text }}
        </option>
    </select>
    <p>选择的项：{{ dynamicComboBox }}</p>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            dynamicComboBox: '',
                optionItems: [
                    { value: 'TanSea', text: '双子宫殿' },
                    { value: 'Google', text: '谷歌搜索' },
                    { value: 'Baidu', text: '百度搜索' }
                ]
        }
    })
</script>
```

这里展示的是 `text`，存进 data 的是 `value`，展示和取值分开，这才是下拉框该有的样子。生产代码里还应该给 `v-for` 加上 `:key="optionItem.value"`，原文写于 Vue 2.2 之前的习惯，那时 `key` 还不是强制要求，现在 ESLint 的 `vue/require-v-for-key` 规则会直接报错。

`:value` 支持绑对象。如果你写 `:value="optionItem"`，选中后 data 里存的就是整个对象引用，回显的时候要注意 `select` 靠的是严格相等去匹配选中项，对象引用变了就匹配不上，这是回显失败最常见的原因。

### 5.3 多选列表

给 `select` 加 `multiple`，绑定值就要换成数组：

```html
<div id="app-1">
    <p><select v-model="multiComboBox" multiple>
        <option>双子宫殿</option>
        <option>谷歌搜索</option>
        <option>百度搜索</option>
    </select></p>
    <p>选择的项：{{ multiComboBox }}</p>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            multiComboBox: []
        }
    })
</script>
```

和多选复选框一个道理，绑定值必须是数组。原生 `multiple` 的交互体验其实很差，要按住 Ctrl 或 Cmd 才能多选，移动端基本不可用。所以业务里大多用组件库的多选下拉替代，但底层原理是一样的。

## 六、三个修饰符

`v-model` 后面能跟三个修饰符，各自解决一类问题。

`.lazy` 把监听的事件从 `input` 换成 `change`。默认情况下每敲一个字符就同步一次数据，如果这个数据触发了搜索请求或者复杂计算，输入会明显卡顿。加上 `.lazy` 之后只在失焦或者回车时同步一次。

```html
<input v-model.lazy="keyword">
```

`.number` 前面讲过了，转数字。

`.trim` 自动去掉首尾空白。用户复制粘贴过来的内容前后常常带空格，登录表单里一个尾随空格就能让账号密码校验失败，而且用户肉眼看不出来。这个 bug 我排查了一下午才定位到，从那以后账号类输入框我都默认加 `.trim`。

```html
<input v-model.trim="username">
```

修饰符可以串着用，`v-model.lazy.trim="keyword"` 是合法的。

## 七、Vue 3 里 v-model 变成了什么

上面所有写法都是 Vue 2 的，绝大部分在 Vue 3 里原样能跑。但有两处语义上的变化，迁移老项目时会遇到。

第一处是自定义组件上的 `v-model`。Vue 2 里它默认展开成 `value` 属性加 `input` 事件，Vue 3 改成了 `modelValue` 属性加 `update:modelValue` 事件。所以你自己封装的输入组件，`props: ['value']` 要改成 `props: ['modelValue']`，`this.$emit('input', val)` 要改成 `this.$emit('update:modelValue', val)`。原生表单元素上的 `v-model` 不受影响，Vue 内部会自动选对属性和事件。

第二处是 `.sync` 修饰符被移除了，它的功能并进了 `v-model` 参数写法。Vue 2 里的 `:title.sync="pageTitle"` 在 Vue 3 里写作 `v-model:title="pageTitle"`。带来的好处是一个组件上可以挂多个 `v-model`，比如 `v-model:first-name` 和 `v-model:last-name` 同时存在，这在 Vue 2 里得靠 `model` 选项加 `.sync` 拼凑。

另外 Vue 3 允许自定义修饰符了。组件的 props 里会多出一个 `modelModifiers`，你可以自己实现一个 `v-model.capitalize`，把首字母大写的逻辑封进组件。Vue 2 没有这个能力。

关于自定义组件如何实现 `v-model`、`props` 和 `$emit` 怎么配合，我在 [Vue 组件](https://feinterview.poetries.top/blog/vue-component) 那篇里拆得更细。数据绑定的底层机制，也就是「为什么改了 data 视图会跟着动」，在 [Vue 数据绑定](https://feinterview.poetries.top/blog/vue-data-bind) 里有展开。

## 总结

回到开头那三个「玄学」问题，现在都有答案了：

- 年龄传成字符串，是因为 `input.value` 天生是字符串，加 `.number` 解决
- 多选框只留最后一个值，是因为绑定的 data 初始化成了非数组，改成 `[]` 解决
- 下拉框初始显示空白，是因为没有 `value` 为空的占位 `option`，补一个 `disabled` 项解决

再往上抽一层，`v-model` 的所有行为都能从「绑什么属性、听什么事件」这一条推出来。文本框绑 `value` 听 `input`，勾选框绑 `checked` 听 `change`，下拉框绑 `value` 听 `change`。记住这个，遇到没见过的场景也能自己推。

最后是修饰符，`.trim` 建议在账号、手机号、验证码这类输入框上默认加，成本为零，能省掉一类很难查的线上问题。

## 参考

- [Vue 3 官方文档 - 表单输入绑定](https://cn.vuejs.org/guide/essentials/forms.html)
- [Vue 3 官方文档 - 组件 v-model](https://cn.vuejs.org/guide/components/v-model.html)
- [Vue 3 迁移指南 - v-model](https://v3-migration.vuejs.org/breaking-changes/v-model.html)
- [MDN - input 元素](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input)
- [前端进阶之旅](https://interview.poetries.top)
