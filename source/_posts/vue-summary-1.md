---
title: Vue学习总结(一)
date: 2017-03-19 12:24:08
tags: Vue
categories: Front-End
---



## 一、介绍

![](https://poetries1.gitee.io/img-repo/2019/10/635.png)


- `Vue`是一套构建用户界面的 渐进式框架。`Vue` 的核心库只关注视图层，并且非常容易学习，非常容易与其它库或已有项目整合。



## 二、Vue实例

**构造器**

- 每个 `Vue.js` 应用都是通过构造函数 `Vue` 创建一个 `Vue` 的根实例 启动的

```javascript
var vm = new Vue({
// 选项
})
```
- 在实例化 `Vue` 时，需要传入一个选项对象，它可以包含数据、模板、挂载元素、方法、生命周期钩子等选项。全部的选项可以在 `API` 文档中查看

**属性与方法**

- 每个 `Vue `实例都会代理其` data` 对象里所有的属性

```javascript
var data = { a: 1 }
var vm = new Vue({
data: data
})
vm.a === data.a
// -> true
// 设置属性也会影响到原始数据
vm.a = 2
data.a // -> 2
// ... 反之亦然
data.a = 3
vm.a // -> 3
```

- 除了 `data `属性， `Vue `实例暴露了一些有用的实例属性与方法。这些属性与方法都有前缀 `$ `，以便与代理的`data `属性区分。例如：

```javascript
var data = { a: 1 }
var vm = new Vue({
el: '#example',
data: data
})
vm.$data === data
// -> true
vm.$el === document.getElementById('example')
// -> true
// $watch 是一个实例方法
vm.$watch('a', function (newVal, oldVal) {
// 这个回调将在 `vm.a` 改变后调用
})
```

**实例生命周期**


```javascript
var vm = new Vue({
data: { a: 1 },
created: function () {
// `this` 指向 vm 实例
console.log('a is: ' + this.a)
}
})
// -> "a is: 1"
```

- 也有一些其它的钩子，在实例生命周期的不同阶段调用，如 `mounted` 、 `updated` 、 `destroyed` 。钩子的 `this` 指向调用它的 `Vue` 实例。一些用户可能会问 `Vue.js` 是否有“控制器”的概念？答案是，没有。组件的自定义逻辑可以分布在这些钩子中


**生命周期图示**

![生命周期图示][2]


## 三、模板语法

- `Vue.js` 使用了基于 `HTML` 的模版语法，允许开发者声明式地将 `DOM` 绑定至底层 `Vue` 实例的数据。所有`Vue.js` 的模板都是合法的 `HTML` ，所以能被遵循规范的浏览器和 `HTML` 解析器解析。

- 在底层的实现上， `Vue `将模板编译成虚拟` DOM` 渲染函数。结合响应系统，在应用状态改变时， `Vue` 能够智能地计算出重新渲染组件的最小代价并应用到 `DOM` 操作上。

### 插值

**文本**

- 数据绑定最常见的形式就是使用 “Mustache” 语法（双大括号）的文本插值

```html
<span>Message: {{ msg }}</span>
```

- `Mustache` 标签将会被替代为对应数据对象上 `msg` 属性的值。无论何时，绑定的数据对象上 `msg` 属性发生了改变，插值处的内容都会更新
- 通过使用 `v-once` 指令，你也能执行一次性地插值，当数据改变时，插值处的内容不会更新。但请留心这会影响到该节点上所有的数据绑定

```html
<span v-once>This will never change: {{ msg }}</span>
```

**纯 HTML**

- 双大括号会将数据解释为纯文本，而非 `HTML` 。为了输出真正的 `HTML `，你需要使用` v-html `指令：

```html
<div v-html="rawHtml"></div>
```

- 被插入的内容都会被当做 `HTML` —— 数据绑定会被忽略
- 你的站点上动态渲染的任意 `HTML` 可能会非常危险，因为它很容易导致 `XSS` 攻击。请只对可信内容使用`HTML` 插值，绝不要对用户提供的内容插值

**属性**

- Mustache 不能在 `HTML` 属性中使用，应使用 `v-bind` 指令：

```html
<div v-bind:id="dynamicId"></div>
```
**使用 JavaScript 表达式**

- 对于所有的数据绑定， `Vue.js`都提供了完全的 `JavaScript `表达式支持。

```html
{{ number + 1 }}{{ ok ? 'YES' : 'NO' }}
{{ message.split('').reverse().join('') }}
<div v-bind:id="'list-' + id"></div>
```
- 这些表达式会在所属 Vue 实例的数据作用域下作为 JavaScript 被解析

**过滤器**

- `Vue.js` 允许你自定义过滤器，被用作一些常见的文本格式化。过滤器应该被添加在` mustache` 插值的尾部，由“管道符”指示：

```javascript
{{ message | capitalize }}
```
**指令**

- 指令（`Directives`）是带有` v- `前缀的特殊属性。指令属性的值预期是单一 `JavaScript `表达式（除了`v-for` ，之后再讨论）
- 指令的职责就是当其表达式的值改变时相应地将某些行为应用到 DOM 上

```html
<p v-if="seen">Now you see me</p>
```

- 这里， `v-if` 指令将根据表达式 seen 的值的真假来移除/插入` <p> `元素

**参数**

- 一些指令能接受一个“参数”，在指令后以冒号指明。例如，` v-bind `指令被用来响应地更新 `HTML` 属性

```html
<a v-bind:href="url"></a>
```
- 在这里 `href `是参数，告知` v-bind` 指令将该元素的 `href` 属性与表达式 `url `的值绑定

- 另一个例子是 `v-on` 指令，它用于监听 `DOM` 事件：

```html
<a v-on:click="doSomething">
```
**修饰符**

- 修饰符（Modifiers）是以半角句号` . `指明的特殊后缀，用于指出一个指令应该以特殊方式绑定
- 例如，`.prevent` 修饰符告诉 `v-on` 指令对于触发的事件调用 `event.preventDefault()`

```html
<form v-on:submit.prevent="onSubmit"></form>
```
**缩写**

- `v-` 前缀在模板中是作为一个标示 `Vue` 特殊属性的明显标识
- `Vue.js` 为两个最为常用的指令提供了特别的缩写

- `v-bind` 缩写

```html
<!-- 完整语法 --><a v-bind:href="url"></a>
<!-- 缩写 --><a :href="url"></a>
```

- `v-on` 缩写

```html
<!-- 完整语法 -->
<a v-on:click="doSomething"></a>

<!-- 缩写 -->
<a @click="doSomething"></a>
```
## 四、计算属性

- 在模板中绑定表达式是非常便利的，但是它们实际上只用于简单的操作。在模板中放入太多的逻辑会让模板过重且难以维护。例如：

```html
<div id="example"> {{ message.split('').reverse().join('') }}</div>
```

- 在这种情况下，模板不再简单和清晰。在实现反向显示 `message` 之前，你应该确认它。这个问题在你不止一次反向显示 `message` 的时候变得更加糟糕。
- 这就是为什么任何复杂逻辑，你都应当使用计算属性

**基础例子**

```html
<div id="example"> 
   <p>Original message: "{{ message }}"</p> 
   <p>Computed reversed message: "{{ reversedMessage }}"</p>
</div>
```

```javascript
var vm = new Vue({ 
	el: '#example', data: { message: 'Hello' }, 
	computed: {
	  //a computed getter 
	reversedMessage: function () { 
	  // `this` points to the vm instance 
	return this.message.split('').reverse().join('')
} }})
```

- 结果：
  - Original message: "Hello"
  - Computed reversed message: "olleH"

- 这里我们声明了一个计算属性 `reversedMessage` 。我们提供的函数将用作属性

**计算缓存 vs Methods**

- 你可能已经注意到我们可以通过调用表达式中的`method`来达到同样的效果：

```html
<p>Reversed message: "{{ reverseMessage() }}"</p>
```

```javascript
// in component
methods: {
reverseMessage: function () {
	return this.message.split('
	').reverse().join('') 
}}
```
- 不经过计算属性，我们可以在 `method` 中定义一个相同的函数来替代它。对于最终的结果，两种方式确实是相同的。然而，不同的是计算属性是基于它的依赖缓存。计算属性只有在它的相关依赖发生改变时才会重新
取值。这就意味着只要 `message` 没有发生改变，多次访问`reversedMessage` 计算属性会立即返回之前的计算结果，而不必再次执行函数。

- 这也同样意味着如下计算属性将不会更新，因为 `Date.now() `不是响应式依赖：

```javascript
computed: { now: function () { return Date.now() }}
```
- 相比而言，每当重新渲染的时候，`method` 调用总会执行函数

- 我们为什么需要缓存？假设我们有一个重要的计算属性 `A` ，这个计算属性需要一个巨大的数组遍历和做大量的计算。然后我们可能有其他的计算属性依赖于 `A` 。如果没有缓存，我们将不可避免的多次执行 `A` 的 `getter`！如果你不希望有缓存，请用 `method` 替代

**计算属性 vs Watched Property**

- `Vue.js` 提供了一个方法` $watch` ，它用于观察 `Vue `实例上的数据变动

**计算 setter**

- 计算属性默认只有 `getter `，不过在需要时你也可以提供一个 `setter `：

```javascript
// ...
computed: {
fullName: { 
   // getter 
	get: function () { 
		return this.firstName + ' ' + this.lastName 
	}, 
	// setter 
	set: function (newValue) {
		var names = newValue.split(' ') 
		this.firstName = names[0] 
		this.lastName = names[names.length - 1] 

	}
}}
```
- 现在在运行` vm.fullName = 'John Doe'` 时， `setter `会被调用， `vm.firstName` 和`vm.lastName` 也会被对应更新


**观察 Watchers**

- 虽然计算属性在大多数情况下更合适，但有时也需要一个自定义的 `watcher` 。这是为什么 `Vue` 提供一个更通用的方法通过 `watch` 选项，来响应数据的变化。当你想要在数据变化响应时，执行异步操作或昂贵操作时，这是很有用的



## 五、Class与Style绑定

### Class 与 Style 绑定

- 数据绑定一个常见需求是操作元素的 `class` 列表和它的内联样式。因为它们都是属性 ，我们可以用 `v-bind`处理它们：只需要计算出表达式最终的字符串。不过，字符串拼接麻烦又易错。因此，在 `v-bind` 用于`class` 和 `style `时， `Vue.js` 专门增强了它。表达式的结果类型除了字符串之外，还可以是对象或数组

### 绑定 HTML Class

**对象语法**

- 我们可以传给` v-bind:class` 一个对象，以动态地切换 `class `

```html
<div v-bind:class="{ active: isActive }"></div>
```

- 上面的语法表示` class active `的更新将取决于数据属性` isActive` 是否为真值
- 我们也可以在对象中传入更多属性用来动态切换多个` class `。此外， v-`bind:class` 指令可以与普通的`class` 属性共存。如下模板:

```html
<div class="static" v-bind:class="{ active: isActive, 'text-danger': hasError }"></div>
```
- 如下 `data`:

```javascript
data: { isActive: true, hasError: false}
```

- 渲染为:

```html
<div class="static active"></div>
```

- 当 `isActive` 或者 `hasError` 变化时，`class` 列表将相应地更新。例如，如果 `hasError `的值为`true` ， `class`列表将变为` "static active text-danger"`

- 你也可以直接绑定数据里的一个对象

```html
<div v-bind:class="classObject"></div>
```

```javascript
data: { classObject: { active: true, 'text-danger': false }}
```

**数组语法**

- 我们可以把一个数组传给 `v-bind:class` ，以应用一个 `class` 列表

```html
<div v-bind:class="[activeClass, errorClass]">
```

```javascript
data: { activeClass: 'active', errorClass: 'text-danger'}
```

- 渲染为:

```html
<div class="active text-danger"></div>
```

- 如果你也想根据条件切换列表中的 `class` ，可以用三元表达式

```html
<div v-bind:class="[isActive ? activeClass : '', errorClass]">
```

### 绑定内联样式

**对象语法**

- `v-bind:style` 的对象语法十分直观——看着非常像` CSS` ，其实它是一个 `JavaScript` 对象。 `CSS` 属性名可以用驼峰式（camelCase）或短横分隔命名（kebab-case）

```html
<div 
v-bind:style="{ color: activeColor, fontSize: fontSize + 'px' }">
</div>
```

```javascript
data: { activeColor: 'red', fontSize: 30}
```

- 直接绑定到一个样式对象通常更好，让模板更清晰

```html
<div v-bind:style="styleObject"></div>
```

```javascript
data: { styleObject: { color: 'red', fontSize: '13px' }}
```

**数组语法**
- `v-bind:style` 的数组语法可以将多个样式对象应用到一个元素上

```html
<div v-bind:style="[baseStyles, overridingStyles]">
```
**自动添加前缀**

- 当 `v-bind:style` 使用需要特定前缀的 `CSS` 属性时，如 `transform` ，`Vue.js `会自动侦测并添加相应的前缀



## 六、条件渲染

**v-if**

- 在字符串模板中，如 `Handlebars `，我们得像这样写一个条件块

```javascript
<!-- Handlebars 模板 -->
{{#if ok}} <h1>Yes</h1>{{/if}}
```
- 在 `Vue.js `，我们使用 `v-if `指令实现同样的功能

```html
<h1 v-if="ok">Yes</h1>
```

- 也可以用 `v-else `添加一个 `“else” `块

```html
<h1 v-if="ok">Yes</h1><h1 v-else>No</h1>
```

**template v-if**

- 因为 `v-if` 是一个指令，需要将它添加到一个元素上。但是如果我们想切换多个元素呢？此时我们可以把一个 `<template>` 元素当做包装元素，并在上面使用 `v-if` ，最终的渲染结果不会包含它

```html
<template v-if="ok"> <h1>Title</h1> <p>Paragraph 1</p> <p>Paragraph 2</p></template>
```

**v-else**

- 可以用 `v-else `指令给 `v-if `或 `v-show` 添加一个 `“else”` 块
```html
<div v-if="Math.random() > 0.5"> Sorry</div><div v-else> Not sorry</div>
```
- `v-else` 元素必须紧跟在` v-if `或 `v-show` 元素的后面——否则它不能被识别

**v-show**

- 另一个根据条件展示元素的选项是` v-show `指令。用法大体上一样

```html
<h1 v-show="ok">Hello!</h1>
```
- 不同的是有 `v-show` 的元素会始终渲染并保持在 `DOM` 中。 `v-show `是简单的切换元素的 `CSS` 属性`display`

- 注意 `v-show` 不支持 `<template>` 语法

**v-if vs. v-show**

- `v-if` 是真实的条件渲染，因为它会确保条件块在切换当中适当地销毁与重建条件块内的事件监听器和子组件
- `v-if `也是惰性的：如果在初始渲染时条件为假，则什么也不做
- 相比之下， `v-show` 简单得多——元素始终被编译并保留，只是简单地基于 `CSS` 切换
- 一般来说， `v-if `有更高的切换消耗而 `v-show` 有更高的初始渲染消耗
- 因此，如果需要频繁切换使用`v-show `较好，如果在运行时条件不大可能改变则使用` v-if `较好

## 七、列表渲染

**v-for**
- 我们用 `v-for `指令根据一组数组的选项列表进行渲染。` v-for `指令需要以 `item in items` 形式的特殊语法， `items` 是源数据数组并且 `item` 是数组元素迭代的别名
- 在 `v-for` 块中，我们拥有对父作用域属性的完全访问权限。 `v-for` 还支持一个可选的第二个参数为当前项的索引

```html
<ul id="example-2"> 
	<li v-for="(item, index) in items"> 
		{{ parentMessage }} - {{ index }} - {{ item.message }} 
	</li>
</ul>
```
- 你也可以用 `of `替代 `in `作为分隔符，因为它是最接近 `JavaScript` 迭代器的语法

```html
<div v-for="item of items"></div>
```

**Template v-for**

- 如同 `v-if `模板，你也可以用带有 `v-for` 的 `<template> `标签来渲染多个元素块。例如：
```html
<ul> 
	<template v-for="item in items">
		<li>{{ item.msg }}</li> 
		<li class="divider"></li> 
	</template>
</ul>
```
**对象迭代 v-for**

- 你也可以用` v-for` 通过一个对象的属性来迭代

```html
<ul id="repeat-object" class="demo"> 
	<li v-for="value in object"> {{ value }} </li>
</ul>
```
```javascript
new Vue({
	el: '#repeat-object', 
	data: { 
		object: {
			FirstName: 'John', 
			LastName: 'Doe', Age: 30
	} 
}})
```
- 你也可以提供第二个的参数为键名
```html
<div v-for="(value, key) in object"> {{ key }} : {{ value }}</div>
```
- 第三个参数为索引
```html
<div v-for="(value, key, index) in object">
	{{ index }}. {{ key }} : {{ value }}
</div>
```
**整数迭代 v-for**

- `v-for` 也可以取整数。在这种情况下，它将重复多次模板

```html
<div> 
	<span v-for="n in 10">{{ n }}</span>
</div>
```

- 结果： 1 2 3 4 5 6 7 8 9 10

**组件 和 v-for**

- 在自定义组件里，你可以像任何普通元素一样用 `v-for`
```html
<my-component v-for="item in items"></my-component>
```

- 然而他不能自动传递数据到组件里，因为组件有自己独立的作用域。为了传递迭代数据到组件里，我们要用`props`

```html
<my-component v-for="(item, index) in items" 
v-bind:item="item" v-bind:index="index">
</my-component>>
```
- 不自动注入 `item `到组件里的原因是，因为这使得组件会紧密耦合到 `v-for `如何运作。在一些情况下，明确数据的来源可以使组件可重用。


## 八、事件处理器

**监听事件**

- 可以用 `v-on` 指令监听 `DOM` 事件来触发一些 `JavaScript` 代码

```html
<div id="example-1"> 
	<button v-on:click="counter += 1">增加 1</button> 
	<p>这个按钮被点击了 {{ counter }} 次。</p>
</div>
```
```javascript
var example1 = new Vue({ 
el: '#example-1', 
data: { 
	counter: 0 
}})
```
**方法事件处理器**

- 许多事件处理的逻辑都很复杂，所以直接把 `JavaScript` 代码写在 `v-on` 指令中是不可行的。因此 `v-on` 可以接收一个定义的方法来调用

**内联处理器方法**

- 除了直接绑定到一个方法，也可以用内联 `JavaScript `语句

```html
<div id="example-3"> 
	<button v-on:click="say('hi')">Say hi</button> 
	<button v-on:click="say('what')">Say what</button>
</div>
```

```javascript
new Vue({
el: '#example-3', 
methods: { 
	say: function (message) { 
		alert(message) 
	}
}})
```
- 有时也需要在内联语句处理器中访问原生 `DOM` 事件。可以用特殊变量 `$event `把它传入方法

```html
<button 
v-on:click="warn('Form cannot be submitted yet.', $event)">
Submit</button>
```
```javascript
methods: {
warn: function (message, event) {
// 现在我们可以访问原生事件对象 
		if(event) {
			event.preventDefault() 
			alert(message) 
		}
}}
```
**事件修饰符**

- 在事件处理程序中调用` event.preventDefault() `或`event.stopPropagation() `是非常常见的需求。尽管我们可以在` methods` 中轻松实现这点，但更好的方式是：`methods` 只有纯粹的数据逻辑，而不是去处理` DOM` 事件细节
- 为了解决这个问题， `Vue.js` 为 `v-on `提供了 事件修饰符。通过由点(`.`)表示的指令后缀来调用修饰符
- `.stop`
- `.prevent`
- `.capture`
- `.self`

```html
<!-- 阻止单击事件冒泡 -->
<a v-on:click.stop="doThis"></a>

<!-- 提交事件不再重载页面 -->
<form v-on:submit.prevent="onSubmit"></form>

<!-- 修饰符可以串联 -->
<a v-on:click.stop.prevent="doThat"></a>

<!-- 只有修饰符 -->
<form v-on:submit.prevent></form>

<!-- 添加事件侦听器时使用时间捕获模式 -->
<div v-on:click.capture="doThis">...</div>

<!-- 只当事件在该元素本身（而不是子元素）触发时触发回调 -->
<div v-on:click.self="doThat">...</div>
```

**按键修饰符**

- 在监听键盘事件时，我们经常需要监测常见的键值。 `Vue `允许为 `v-on `在监听键盘事件时添加按键修饰符：

```html
<!-- 只有在 keyCode 是 13 时调用 vm.submit() -->
<input v-on:keyup.13="submit">
```

- 记住所有的 `keyCode `比较困难，所以 `Vue `为最常用的按键提供了别名
```html
<!-- 同上 -->
<input v-on:keyup.enter="submit">

<!-- 缩写语法 -->
<input @keyup.enter="submit">
```

- 全部的按键别名：
  - `enter`
  - `tab`
  - `delete` (捕获 “删除” 和 “退格” 键)
  - `esc`
  - `space`
  - `up`
  - `down`
  - `left`
  - `right`

**为什么在 HTML 中监听事件?**

- 你可能注意到这种事件监听的方式违背了关注点分离（separation of concern）传统理念。不必担心，因为所有的 `Vue.js `事件处理方法和表达式都严格绑定在当前视图的 `ViewModel `上，它不会导致任何维护上的困难。

- 实际上，使用 `v-on `有几个好处
  - 扫一眼` HTML` 模板便能轻松定位在 `JavaScript `代码里对应的方法
  - 因为你无须在 `JavaScript`里手动绑定事件，你的 `ViewModel `代码可以是非常纯粹的逻辑，和 `DOM` 完全解耦，更易于测试。
  - 当一个 `ViewModel `被销毁时，所有的事件处理器都会自动被删除。你无须担心如何自己清理它们。

## 九、表单控制绑定

**基础用法**

- 你可以用 `v-model `指令在表单控件元素上创建双向数据绑定
- 它会根据控件类型自动选取正确的方法来更新元素。
- 尽管有些神奇，但 `v-model`本质上不过是语法糖，它负责监听用户的输入事件以更新数据，并特别处理一些极端的例子。
- `v-model` 并不关心表单控件初始化所生成的值。因为它会选择` Vue `实例数据来作为具体的值。

**文本**

```html
<input v-model="message" placeholder="edit me">
<p>Message is: {{ message }}</p>
```

**复选框**

- 单个勾选框，逻辑值

```html
<input type="checkbox" id="checkbox" v-model="checked">
<label for="checkbox">{{ checked}}</label>
```
- 多个勾选框，绑定到同一个数组

```html
<input type="checkbox" id="jack" value="Jack" v-model="checkedNames">
<label for="jack">Jack</label>

<input type="checkbox" id="john" value="John" v-model="checkedNames">
<label for="john">John</label>

<input type="checkbox" id="mike" value="Mike" v-model="checkedN
ames">
<label for="mike">Mike</label>

<span>Checked names: {{ checkedNames }}</span>
```

```javascript
new Vue({ el: '...', data: { checkedNames: [] }})
```




## 十、组件

### 什么是组件？

- 组件（Component）是 `Vue.js` 最强大的功能之一。组件可以扩展` HTML `元素，封装可重用的代码。在较高层面上，组件是自定义元素，` Vue.js` 的编译器为它添加特殊功能。在有些情况下，组件也可以是原生 `HTML` 元
素的形式，以` is` 特性扩展

### 使用组件

**注册**
- 之前说过，我们可以通过以下方式创建一个 `Vue `实例

```javascript
new Vue({ el: '#some-element', // 选项})
```
- 要注册一个全局组件，你可以使用 `Vue.component(tagName, options) 。 `例如：`Vue.component('my-component', { // 选项})`

- 组件在注册之后，便可以在父实例的模块中以自定义元素 `<my-component></my-component>` 的形式使用。要确保在初始化根实例 之前 注册了组件：`<div id="example"> <my-component></my-component></div>`

```javascript
// 注册
Vue.component('my-component', 
{ template: '<div>A custom component!</div>'
})
//创建根实例
new Vue({ el: '#example'})
```
- 渲染为：`<div id="example"> <div>A custom component!</div></div>`

**局部注册**

- 不必在全局注册每个组件。通过使用组件实例选项注册，可以使组件仅在另一个实例/组件的作用域中可用

**构成组件**

- 组件意味着协同工作，通常父子组件会是这样的关系：组件 A 在它的模版中使用了组件 B 。它们之间必然需要相互通信：父组件要给子组件传递数据，子组件需要将它内部发生的事情告知给父组件。然而，在一个良
好定义的接口中尽可能将父子组件解耦是很重要的。这保证了每个组件可以在相对隔离的环境中书写和理解，也大幅提高了组件的可维护性和可重用性
- 在 `Vue.js `中，父子组件的关系可以总结为 `props down`, `events up` 。父组件通过 `props` 向下传递数据给子组件，子组件通过 `events `给父组件发送消息。看看它们是怎么工作的

![enter description here][3]

### Props

**使用Props传递数据**

- 组件实例的作用域是孤立的。这意味着不能并且不应该在子组件的模板内直接引用父组件的数据。可以使用`props `把数据传给子组件。
- `prop `是父组件用来传递数据的一个自定义属性。子组件需要显式地用 `props` 选项 声明 `“prop”：`

```javascript
Vue.component('child', { 
// 声明 props
props: ['message'],
// 就像 data 一样，prop 可以用在模板内
// 同样也可以在 vm 实例中像 “this.message” 这样使用
template: '<span>{{ message}}</span>

'})
```
- 然后向它传入一个普通字符串`<child message="hello!"></child>`
- 结果：hello!

**动态 Props**

- 类似于用` v-bind` 绑定 `HTML` 特性到一个表达式，也可以用 `v-bind` 绑定动态 `props `到父组件的数据。每当父组件的数据变化时，也会传导给子组件：

**单向数据流**

- `prop `是单向绑定的：当父组件的属性变化时，将传导给子组件，但是不会反过来。这是为了防止子组件无意修改了父组件的状态——这会让应用的数据流难以理解
- 另外，每次父组件更新时，子组件的所有 `prop `都会更新为最新值。这意味着你不应该在子组件内部改变`prop` 。如果你这么做了，`Vue` 会在控制台给出警告

## 十一、附录

### 附录一 MVC、MVP、MVVM模式对比

#### MVC
---

##### 什么是MVC
---

- MVC是一种模式，它将应用分为3个部分：数据（模型）、表现层（视图）、用户交互层（控制器）
- 一个事件的处理大概是这样
  - 用户和应用产生交互
  - 控制器的事件处理器被触发
  - 控制器从模型中请求数据，并将其交给视图
  - 视图将数据呈现给用户
  
##### 模型（数据保存）
---

- 模型用来存放用户的所有数据对象。比如有一个user模型，用来存放用户列表、他们的属性以及所有和模型有关的逻辑
- 模型不必知晓视图和控制器的细节，模型只需包含数据以及直接和这些数据相关的逻辑

##### 视图（用户界面）
---

- 视图是呈现给用户的，用户与之产生交互。在JavaScript应用中，视图大都是由HTML、css、JavaScript模板组成的

##### 控制器（业务逻辑）
---

- 控制器是模型和视图之间的纽带。控制器从视图获得事件和输入，对它们进行进行处理，并相应的更新视图。
- 当页面加载时，控制器会给视图添加事件监听，比如监听表单提交或按钮点击。然后当用户和你的应用产生交互时，控制器中的事件触发器就开始工作了



##### 总结一下：
---

- `Controller` 监听 `Model` 变化，`Model` 一变，`Controller` 就会去更新` View`。
- `Controller` 监听用户交互，用户点了提交或修改按钮，Controller 就要去更新 Model

- `View` 传送指令到 `Controller`
- `Controller` 完成业务逻辑后，要求 `Model` 改变状态
- `Model` 将新的数据发送到 `View`，用户得到反馈

各部分之间的通信方式

![](http://image.beekka.com/blog/2015/bg2015020105.png)

#### 互动模式
---

- 接受用户指令时，MVC 可以分成两种方式。一种是通过 View 接受指令，传递给 Controller

![](http://image.beekka.com/blog/2015/bg2015020106.png)

- 另一种是直接通过controller接受指令

![](http://image.beekka.com/blog/2015/bg2015020107.png)


#### MVP
---

- ` MVP` 模式将 `Controller 改名为 `Presenter`，同时改变了通信方向

![](http://image.beekka.com/blog/2015/bg2015020109.png)

- 各部分之间的通信，都是双向的。
- `View` 与` Model` 不发生联系，都通过 `Presenter` 传递。
- `View` 非常薄，不部署任何业务逻辑，称为"被动视图"（Passive View），即没有任何主动性，而 Presenter非常厚，所有逻辑都部署在那里

#### MVVM
---

- `MVVM` 模式将 `Presenter` 改名为 `ViewModel`，基本上与 `MVP` 模式完全一致
- 唯一的区别是，它采用双向绑定（data-binding）：`View`的变动，自动反映在 `ViewModel`，反之亦然

![](http://image.beekka.com/blog/2015/bg2015020110.png)

### 附录二 vue与其他框架的对比

#### React

- `React` 和 `Vue` 有许多相似之处，它们都有
    - 使用 `Virtual DOM`
    - 提供了响应式（Reactive）和组件化（Composable）的视图组件。
    - 将注意力集中保持在核心库，伴随于此，有配套的路由和负责处理全局状态管理的库

#### angular1

- `Vue` 的一些语法和 `Angular `的很相似（例如 `v-if vs ng-if`）。因为` Angular `是 `Vue `早期开发的灵感来源。然而，Angular 中存在的许多问题，在 Vue 中已经得到解决

**复杂性**
 - 在 `API` 与设计两方面上` Vue.js `都比 `Angular 1` 简单得多，因此你可以快速地掌握它的全部特性并投入开发。

**灵活性和模块化**

- `Vue.js` 是一个更加灵活开放的解决方案。它允许你以希望的方式组织应用程序，而不是在任何时候都必须遵循 `Angular 1 `制定的规则，这让` Vue `能适用于各种项目。我们知道把决定权交给你是非常必要的

**数据绑定**

- `Angular 1 `使用双向绑定，`Vue` 在不同组件间强制使用单向数据流。这使应用中的数据流更加清晰易懂。

**指令与组件**

- 在 `Vue` 中指令和组件分得更清晰。指令只封装 `DOM` 操作，而组件代表一个自给自足的独立单元 —— 有自己的视图和数据逻辑。在 `Angular` 中两者有不少相混的地方

**性能**

- `Vue` 有更好的性能，并且非常非常容易优化，因为它不使用脏检查
- 在 `Angular 1` 中，当 `watchers` 越来越多时会变得越来越慢，因为作用域内的每一次变化，所有 `watchers `都要重新计算。并且，如果一些` watchers `触发另一个更新，脏检查循环（digest cycle）可能要运行多次。Angular 用户常常要使用深奥的技术，以解决脏检查循环的问题。有时没有简单的办法来优化有大量 `watchers `的作用域
- `Vue` 则根本没有这个问题，因为它使用基于依赖追踪的观察系统并且异步队列更新，所有的数据变化都是独立触发，除非它们之间有明确的依赖关系

  [1]: ./images/1489915348310.jpg "1489915348310"
  [2]: ./images/1489915053427.jpg "1489915053427"
  [3]: ./images/1489926033814.jpg "1489926033814"