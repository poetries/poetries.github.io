---
title: Vue 组件从注册到通信完整梳理（九）
description: 讲透 Vue 组件的注册方式、data 为什么必须是函数、props 传值与验证、自定义事件、动态组件与 keep-alive、slot 内容分发，以及父子和兄弟组件三种通信方式。
date: 2018-08-27 11:20:32
tags:
  - Vue
  - 组件
  - 组件通信
categories: Front-End
---

组件是 Vue 里绕不过去的一关。语法本身不难，`Vue.component` 一注册，模板里当标签用就行。真正卡人的是那些「为什么必须这样写」的规则：为什么组件的 `data` 一定要写成函数，为什么模板只能有一个根元素，为什么在子组件里改 props 会挨骂，为什么 `table` 里放自定义组件会渲染错位。这些规则不是 Vue 团队随手定的，每一条背后都有具体的原因。这篇把组件的注册、传值、事件、插槽、通信这几块串起来讲一遍，重点放在规则背后的机制上，顺带把原文里几处写错的代码改对。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 全局注册和局部注册的差别，各自什么时候用
- 组件的 `data` 为什么必须是函数，不是函数会发生什么
- DOM 模板的解析限制，以及 `is` 属性在解决什么问题
- `props` 的传值规则，为什么静态传值拿到的永远是字符串
- 单向数据流，子组件想改父组件数据的三种正确姿势
- `prop` 验证的完整写法和自定义构造器校验
- 自定义事件、`.native` 修饰符，以及 `v-model` 在组件上的原理
- 动态组件 `component :is` 和 `keep-alive` 的缓存
- 具名插槽的内容分发规则
- 父子、子父、兄弟三个方向的组件通信
- 这些写法在 Vue 3 里哪些变了

## 一、组件的基本使用

### 1.1 注册组件

注册组件就是利用 `Vue.component()` 方法，先传入一个自定义组件的名字，然后传入这个组件的配置：

```javascript
Vue.component('mycomponent',{
    template: `<div>这是一个自定义组件</div>`,
    data () {
      return {
        message: 'hello world'
      }
    }
  })
```

这样就创建了一个全局组件，之后在任何 Vue 实例挂载的 DOM 元素中都可以使用它。

还可以在某个 Vue 实例中注册只有自己能用的局部组件，写在 `components` 选项里：

```javascript
var app = new Vue({
    el: '#app',
    data: {
    },
    components: {
      'my-component': {
        template: `<div>这是一个局部的自定义组件，只能在当前Vue实例中使用</div>`,
      }
    }
  })
```

两种组件在模板里的用法没差别：

```html
<div id="app">
    <mycomponent></mycomponent>
    <my-component></my-component>
</div>
```

那该选哪种？我的判断标准是看复用范围。全局注册胜在方便，注册一次到处能用，但它有个实实在在的代价：无论项目里有没有真的用到，这个组件的代码都会被打进最终产物，而且打包工具没法通过静态分析摇掉它。所以只有确实全站在用的基础组件（按钮、图标、弹窗）才值得全局注册，业务组件一律局部注册。

组件名的写法也有讲究。用 kebab-case（短横线）注册的组件，模板里只能用 kebab-case；用 PascalCase（首字母大写）注册的，两种写法都能用。在字符串模板和 DOM 模板里表现还不一样，稳妥的做法是注册时用 PascalCase，在单文件组件的模板里也用 PascalCase，在 DOM 模板里用 kebab-case。

### 1.2 模板的要求

组件的模板只能有一个根元素，下面的写法是不允许的：

```javascript
template: `<div>这是一个局部的自定义组件，只能在当前Vue实例中使用</div>
            <button>hello</button>`,
```

为什么有这条限制？因为 Vue 2 的虚拟 DOM 实现里，一个组件实例对应一棵虚拟节点树，而树必须有唯一的根。有了唯一根节点，diff 的时候才能从一个确定的起点开始比对，组件的 `$el` 也才有一个明确的指向。

实际写业务时，绕过它的办法就是外面包一层 `div`。代价是多一层无意义的 DOM 嵌套，在做 flex 布局或者写 CSS 选择器的时候偶尔会碍事。

Vue 3 已经支持多根节点了（官方叫 Fragment），这条限制不存在了。但相应地，多根节点组件上的非 prop 属性没法自动继承（Vue 不知道该往哪个根上放），需要用 `v-bind="$attrs"` 手动指定落到哪个元素上。

### 1.3 组件中的 data 必须是函数

注册组件时传入的配置和创建 Vue 实例差不多，但有一个关键差别：`data` 属性必须是一个函数。

原因在于 JavaScript 里对象类型的变量保存的是引用。如果像 Vue 实例那样直接传一个对象，当页面上存在多个这样的组件时，它们会共享同一份数据，导致一个组件中数据的改变会引起其他组件数据的改变。

而使用一个返回对象的函数，每次创建组件实例时都会调用一次这个函数，拿到一个全新的对象，各实例之间互不影响。

这个坑很有画面感：一个列表里渲染了十个计数器组件，点第一个的加号，十个数字一起跳。写业务的时候不太容易碰到，因为 `.vue` 单文件组件里 `data` 天然就是函数写法，写错了 ESLint 也会拦。但面试问到「为什么」的时候，能不能说到「引用类型共享」这一层，差别就出来了。

顺带说一句，根实例（`new Vue({})`）的 `data` 可以是对象，因为根实例全局只有一份，不存在复用问题。

### 1.4 关于 DOM 模板的解析

当使用 DOM 作为模板时（例如把 `el` 选项挂载到一个已存在的元素上），会受到 HTML 的一些限制，因为 Vue 只有在浏览器解析和标准化 HTML 之后才能获取模板内容。

像 `ul`、`ol`、`table`、`select` 这些元素限制了能被它包裹的元素，而 `option` 这样的元素只能出现在某些特定元素内部。在自定义组件中使用这些受限制的元素时会出问题，例如：

```html
<table>
  <my-row>...</my-row>
</table>
```

自定义组件 `my-row` 被认为是无效的内容，浏览器在解析阶段就会把它从 `table` 里挪出去，等 Vue 接手时结构已经乱了。这时应使用特殊的 `is` 属性：

```html
<table>
  <tr is="my-row"></tr>
</table>
```

也就是说，标准 HTML 中一些元素里只能放置特定的子元素，另一些元素只能存在于特定的父元素中。比如 `table` 中不能直接放 `div`，`tr` 的父元素不能是 `div`。所以当使用自定义组件时，标签名还是用那些合法的标签名，把自定义组件的名字填在 `is` 属性里。

有一点要强调，这是浏览器的 HTML 解析规则在作怪，跟 Vue 没关系。所以如果模板不是从页面 DOM 里读出来的，这些限制就不适用。以下三种来源不受影响：

- `type="text/x-template"` 的模板标签
- JavaScript 内联模板字符串
- `.vue` 单文件组件

一般情况下，只要用了 `vue-cli` 或者 Vite 走单文件组件，就完全不用操心这一节的内容。这也是我建议新手直接上脚手架、别从 CDN 引入开始学的原因之一，能少踩一整类坑。

## 二、组件的属性和事件

在 HTML 中使用元素会有一些属性，如 `class`、`id`，还可以绑定事件，自定义组件也是一样的。当在一个组件中使用了其他自定义组件时，就会利用子组件的属性和事件来和父组件进行数据交流。

![父子组件通过 props 向下传值、通过 events 向上通信](https://s.poetries.top/gitee/2019/10/621.png)

父子组件之间的通信可以概括成 `props down`，`events up`。父组件通过属性 `props` 向下传递数据给子组件，子组件通过事件 `events` 给父组件发送消息。

比如子组件需要某个数据，就在内部定义一个 `prop` 属性，然后父组件像给 HTML 元素指定特性值一样，把自己的 `data` 属性传递给子组件的这个属性。而当子组件内部发生了什么事情，就通过自定义事件把涉及到的数据暴露出来，供父组件处理。

```html
<my-component v-bind:foo="baz" v-on:event-a="doThis(arg1, arg2)"></my-component>
```

这一行里，`foo` 是 `my-component` 组件内部定义的一个 `prop` 属性，`baz` 是父组件的一个 `data` 属性；`event-a` 是子组件定义的一个事件，`doThis` 是父组件的一个方法。

整个过程是这样的：

- 父组件把 `baz` 数据通过 `prop` 传递给子组件的 `foo`
- 子组件内部拿到 `foo` 的值，进行相应的操作
- 当子组件内部发生了一些变化、希望父组件知道时，触发 `event-a` 事件，把数据发送出去
- 父组件把这个事件的处理器绑定为 `doThis` 方法，子组件发送的数据作为参数传进来
- 父组件根据这些数据进行相应的操作

这套约定看着简单，但它定义了整个组件树的数据流向：数据只能从上往下流，变更的意图只能从下往上报。所有组件通信的复杂方案（Vuex、provide/inject、event bus）都是在这条基本规则不够用的时候才出场的。

## 三、属性 Props

Vue 组件通过 `props` 属性来声明自己接收哪些属性，然后父组件就可以往里面传递数据：

```javascript
Vue.component('mycomponent',{
    template: '<div>这是一个自定义组件,父组件传给我的内容是：{{myMessage}}</div>',
    props: ['myMessage'],
    data () {
      return {
        message: 'hello world'
      }
    }
  })
```

调用该组件：

```html
<div id="app">
    <mycomponent my-message="hello"></mycomponent>
</div>
```

**注意**，由于 HTML 特性不区分大小写，所以在 DOM 模板里传递属性时，`myMessage` 应该转换成 kebab-case 形式写作 `my-message="hello"`。声明的时候用驼峰，模板里用短横线，Vue 会自动做这层转换。

这条规则只在 DOM 模板里成立。单文件组件的模板是由 Vue 自己编译的，不经过浏览器的大小写标准化，所以写 `:myMessage` 也能工作。但为了统一，社区惯例还是模板里一律 kebab-case。

### 3.1 v-bind 绑定属性值

一般情况下，使用 `v-bind` 给元素特性传递值时，Vue 会把引号里的内容当作一个表达式来求值。

`class` 和 `style` 是两个例外，用 `v-bind:class` 和静态 `class` 同时传入类名，效果会叠加，因为对这两个特性 Vue 采用的是合并而不是替换的原则。

### 3.2 动态绑定特性值

想要把父组件的属性绑定到子组件，应该使用 `v-bind`，这样父组件中数据改变时能反映到子组件。

根据传递的属性类型不同，在子组件中更改这个属性会出现两种情况。

第一种，当父组件传递的属性是引用类型时，在子组件中更改属性内部的内容会直接影响父组件：

```html
<div id="app2">
     <div>这是父组件的parentArray：{{parentArray}}</div>
     <my-component :child-array="parentArray"></my-component>
   </div>
   <script>
     Vue.component('my-component', {
       template: `
       <div>这是接收了父组件传递值的子组件的childArray: {{childArray}} <br>
           <button type="button" @click="changeArray">
           点击我改变父元素的parentArray</button>
         </div>`,
       props: ['childArray'],
       data () {
         return {
           counter: 1
         }
       },
       methods: {
         changeArray () {
           this.childArray.push(this.counter++)
         }
       }
     })
     new Vue({
       el: '#app2',
       data: {
         parentArray: []
       }
     })
   </script>
```

这段代码能跑通，而且不会有任何警告。原因是 Vue 检查的是「这个 prop 本身有没有被重新赋值」，`push` 改的是数组内部，引用没变，检查不到。

但能跑不代表该这么写。这种改法绕过了单向数据流，父组件的数据在自己完全不知情的地方被改掉了，出问题的时候根本不知道该去哪个文件找。组件一多，这类隐式修改是最难排查的一类 bug。

第二种，当父组件传递的是基本类型的值，在子组件里直接给这个 prop 赋值，Vue 会在控制台打出警告，提示不要直接修改 prop，而且下次父组件重新渲染时你改的值会被覆盖回去。原文这里写的是「会报错」，准确说是开发模式下的警告，程序不会中断。

正确的做法之一是在父组件绑定属性值时加上 `.sync` 修饰符：

```html
<my-component :child-array.sync="parentArray"></my-component>
```

然后在子组件中通过约定的事件名把新值抛出去：

```javascript
 methods: {
     changeArray () {
       this.counter++
       this.$emit('update:child-array', this.counter)
     }
   }
```

这里有个坑要注意。`.sync` 是一个语法糖，`:child-array.sync="parentArray"` 会被展开成 `:child-array="parentArray"` 加上一个 `@update:child-array` 的监听。Vue 2 的事件名不做大小写自动转换，所以你 emit 出去的名字必须和模板里写的形式完全一致。模板写 `:child-array.sync` 就 emit `update:child-array`，对不上的话不会报错，就是静默无效，这种问题查起来很费时间。原文这里 emit 的是驼峰形式，和模板里的短横线形式对不上，这里改成一致的了。

### 3.3 子组件希望对传入的 prop 进行操作

一般来说，不建议在子组件中对父组件传递来的属性进行操作。如果确实有这种需求，有两种做法。

父组件传递的是基本类型值时，在子组件中创建一个新的属性，用传进来的值做初始化，之后操作这个新属性：

```javascript
props: ['initialCounter'],
data: function () {
  return { counter: this.initialCounter }
}
```

要留意这个初始化只发生一次。之后父组件把 `initialCounter` 改了，子组件的 `counter` 不会跟着变，因为 `data` 只在实例创建时执行一次。需要同步跟随的话得用计算属性或者 `watch`。

父组件传递的是引用类型值时，为了避免更改父组件中的数据，最好对引用类型做复制。结构复杂的情况要用深拷贝。

除了这两种，其实还有第三条路，也是我现在更常用的：用计算属性配 `getter` 和 `setter`。`getter` 读 prop，`setter` 里 `$emit` 出去，模板上直接 `v-model` 绑这个计算属性，读写都自然，也没有破坏单向数据流。

### 3.4 给子组件传递正确类型的值

静态地给子组件的特性传递值，Vue 会把它当作一个字符串：

```html
<!-- 传递了一个字符串 "1" -->
<comp some-prop="1"></comp>
```

子组件中拿到的是字符串 `"1"` 而不是数字 1。如果想传递真正的数值，应该使用 `v-bind`，这样引号里的内容会被当作表达式来处理：

```html
<!-- 传递实际的 number 1 -->
<comp v-bind:some-prop="1"></comp>
```

这条规则适用于所有非字符串类型。传布尔值 `some-prop="false"` 得到的是字符串 `"false"`，而它是个真值，`if` 判断直接翻车。传数组、对象同理，不加 `v-bind` 得到的都是字符串字面量。

我一开始也在这上面栽过。给一个组件传 `disabled="false"`，怎么都禁用不掉，看了半天代码没问题，最后才想起来少了个冒号。加了 `prop` 类型校验之后这类问题会在控制台直接报出来，所以下一节的 `prop` 验证不是可选项。

## 四、Prop 验证

可以给组件的 `props` 属性添加验证，当传入的数据不符合要求时，Vue 会在控制台发出警告：

```javascript
Vue.component('example', {
  props: {
    // 基础类型检测 (`null` 意思是任何类型都可以)
    propA: Number,
    // 多种类型
    propB: [String, Number],
    // 必传且是字符串
    propC: {
      type: String,
      required: true
    },
    // 数字，有默认值
    propD: {
      type: Number,
      default: 100
    },
    // 数组/对象的默认值应当由一个工厂函数返回
    propE: {
      type: Object,
      default: function () {
        return { message: 'hello' }
      }
    },
    // 自定义验证函数
    propF: {
      validator: function (value) {
        return value > 10
      }
    }
  }
})
```

`propE` 那条注释很关键：数组和对象的默认值必须由工厂函数返回。原因和 `data` 必须是函数是同一个，直接写 `default: {}` 的话所有组件实例会共享同一个对象，一个实例改了其他全跟着变。

`type` 可以是下面这些原生构造器：

- `String`
- `Number`
- `Boolean`
- `Function`
- `Object`
- `Array`
- `Symbol`

`type` 也可以是一个自定义构造器函数，Vue 会用 `instanceof` 来检测：

```javascript
// 自定义 Person 构造器
function Person(name, age) {
  this.name = name
  this.age = age
}

Vue.component('my-component', {
  // 模板里用短横线形式
  template: `<div>名字: {{ personProp.name }}， 年龄： {{ personProp.age }} </div>`,
  props: {
    // 声明用驼峰形式
    personProp: {
      type: Person     // 指定类型
    }
  }
})

new Vue({
  el: '#app2',
  data: {
    person: 2        // 传入 Number 类型会在控制台警告
  }
})
```

原文这段的 prop 名写成了 `person-prop`，短横线在 JavaScript 里是减号，既不能当对象的键名直接写，模板里的 `person-prop.name` 也会被解析成减法运算，实际跑起来直接报错。这里统一改成了驼峰形式 `personProp`。这也是前面那条命名规则的实际后果：声明必须用驼峰，模板里才写短横线。

`validator` 这个选项被低估了。它接收当前值返回布尔，适合做枚举校验，比如按钮的 `type` 只允许 `primary` / `danger` / `text` 三个值，传别的立刻警告。相当于在没有 TypeScript 的项目里给组件加了一层运行时契约。

### 4.1 非 prop 类型的属性

也可以像给 HTML 标签添加 `data-` 开头的自定义属性一样，给自定义组件添加任意属性，而不仅限于 `data-*` 形式。这种没有被 `props` 声明的属性，Vue 会把它放在自定义组件的根元素上。

**覆盖非 prop 属性**：如果父组件向子组件的非 prop 属性传递了值，这个值会覆盖子组件模板中的同名特性：

```html
<div id="app3">
    <my-component2 att="helloParent"></my-component2>
</div>
<script>
  Vue.component('my-component2', {
    template: `<div att="helloChild">子组件原有的特性被覆盖了</div>`
  })
  new Vue({
    el: '#app3'
  })
</script>
```

上面渲染的结果是，`div` 的 `att` 属性是 `helloParent`。

前面提到过，覆盖原则对 `class` 和 `style` 不适用，这两个走的是合并：

```html
<div id="app3">
    <my-component2 att="helloParent" class="class2" style="color: red;"></my-component2>
</div>
<script>
  Vue.component('my-component2', {
    template: `<div att="helloChild" class="class1" style="background: yellow;">子组件原有的特性被覆盖了</div>`
  })
  new Vue({
    el: '#app3'
  })
</script>
```

渲染结果是 `div` 的类名为 `class1 class2`，行内样式是 `color:red; background:yellow;`。

这个机制的实用价值在封装第三方组件时才体现出来。你包一层自己的输入框组件，用的人想传 `placeholder`、`maxlength`、`autofocus`，你不可能把原生 input 的所有属性都在 `props` 里声明一遍。靠属性透传，没声明的自动落到根元素上，一行代码都不用写。想控制落到哪个元素上，可以关掉 `inheritAttrs` 再手动 `v-bind="$attrs"`。

## 五、自定义事件

通过 `prop` 属性父组件可以向子组件传递数据，而子组件的自定义事件就是用来把内部的数据报告给父组件的：

```html
<div id="app3">
    <my-component2 v-on:myclick="onClick"></my-component2>
</div>
<script>
  Vue.component('my-component2', {
    template: `<div>
    <button type="button" @click="childClick">点击我触发自定义事件</button>
    </div>`,
    methods: {
      childClick () {
        this.$emit('myclick', '这是我暴露出去的数据', '这是我暴露出去的数据2')
      }
    }
  })
  new Vue({
    el: '#app3',
    methods: {
      onClick () {
        console.log(arguments)
      }
    }
  })
</script>
```

子组件在自己的方法里把自定义事件和需要发出的数据一起发送出去：

```javascript
this.$emit('myclick', '这是我暴露出去的数据', '这是我暴露出去的数据2')
```

第一个参数是自定义事件的名字，后面的参数是依次想要发送出去的数据。父组件利用 `v-on` 为事件绑定处理器：

```html
<my-component2 v-on:myclick="onClick"></my-component2>
```

事件名这里也有个容易踩的点。和 prop 不同，Vue 2 对事件名不做任何大小写转换，`$emit('myClick')` 就必须写 `@myClick` 去监听。而 DOM 模板里的属性名会被浏览器统一转成小写，`@myClick` 会变成 `@myclick`，两边对不上。所以事件名一律用全小写或者 kebab-case，别用驼峰。

### 5.1 绑定原生事件

如果想在某个组件的根元素上监听一个原生事件，可以用 `.native` 修饰 `v-on`：

```html
<my-component v-on:click.native="doTheThing"></my-component>
```

不加 `.native` 的话，`@click` 监听的是子组件通过 `$emit('click')` 抛出的自定义事件，跟原生点击是两条完全不同的链路。这是新手最容易懵的地方，明明写了点击没反应，控制台还一声不吭。事件修饰符的完整清单在 [Vue 事件处理与事件修饰符](https://feinterview.poetries.top/blog/vue-event) 那篇里。

### 5.2 探究 v-model

`v-model` 可以对表单控件实现数据的双向绑定，原理就是利用了绑定属性和事件。以 `input` 控件为例，不使用 `v-model`，可以这样实现同样的效果：

```html
<div id="app4">
    <input type="text" v-bind:value="text" v-on:input="changeValue($event.target.value)">
    {{text}}
  </div>
  <script>
      new Vue({
        el: '#app4',
        data: {
          text: '444'
        },
        methods: {
          changeValue (value) {
            this.text = value
          }
        }
      })
  </script>
```

上面的代码同样实现了数据的双向绑定，拆开看就两步：

- 把 `input` 的 `value` 特性绑定到 Vue 实例的属性 `text` 上，`text` 改变，`input` 中的内容也会改变
- 把表单的 `input` 事件处理函数设置为实例的一个方法，这个方法根据输入参数改变 `text` 的值

在 input 中输入内容时触发 `input` 事件，把 `event.target.value` 传给这个方法，就实现了改变绑定数据的效果。而 `v-model` 就是上面这种写法的语法糖。

所以「双向绑定」这个词有点误导，它并不是什么特殊通道，只是把单向绑定正反各接了一遍。

### 5.3 用自定义事件创建自定义的表单输入组件

理解了 `v-model` 的内幕，就可以把这个效果用在自定义表单组件上。来实现一个简单的、只能输入 hello 的表单输入组件：

```html
<div id="app5">
    <my-component3 v-model="hello"></my-component3>
    <div>{{hello}}</div>
</div>
<script>
  Vue.component('my-component3', {
    template: `<input ref="input" type="text" :value="value" @input="checkInput($event.target.value)">`,
    props: ['value'],
    methods: {
      checkInput (value) {
        var hello = 'hello'
        if (!hello.includes(value)) {
          this.$emit('input', hello)
          this.$refs.input.value = hello
        } else {
          this.$emit('input', value)
        }
      }
    }
  })
  new Vue({
    el: '#app5',
    data: {
      hello: ''
    }
  })
</script>
```

这里的关键是两条约定：组件必须声明一个叫 `value` 的 prop，必须 `$emit` 一个叫 `input` 的事件。名字一个字都不能差，因为 Vue 2 的 `v-model` 在组件上就是按这两个名字展开的。

那 checkbox 这类组件怎么办，它天然该绑 `checked` 听 `change`？Vue 2 提供了 `model` 选项来改这两个名字：

```javascript
Vue.component('my-checkbox', {
  model: {
    prop: 'checked',
    event: 'change'
  },
  props: ['checked'],
  // ...
})
```

代码里还有一行 `this.$refs.input.value = hello` 值得说一下。既然已经 `$emit` 出去了，为什么还要手动改 DOM？因为父组件的 `hello` 本来就是 `'hello'`，`$emit` 之后值没变，Vue 认为不需要重渲染，而输入框里用户敲进去的内容是 DOM 自身的状态，不会被自动纠正回来。所以得手动同步一次。这是所有「输入时做格式化」的组件都会遇到的问题。

表单控件上 `v-model` 的完整行为，包括各类控件绑什么属性听什么事件、三个修饰符怎么用，在 [Vue 表单控件与 v-model](https://feinterview.poetries.top/blog/vue-form) 那篇里拆得更细。

## 六、动态组件

通过使用保留的 `component` 元素，动态地绑定到它的 `is` 特性，可以让多个组件使用同一个挂载点并动态切换：

```html
<div id="app6">
    <select v-model="currentComponent">
      <option value="home">home</option>
      <option value="post">post</option>
      <option value="about">about</option>
    </select>
    <component :is="currentComponent"></component>
  </div>
  <script>
      new Vue({
        el: '#app6',
        data: {
          currentComponent: 'home'
        },
        components: {
          home: {
            template: `<header>这是home组件</header>`
          },
          post: {
            template: `<header>这是post组件</header>`
          },
          about: {
            template: `<header>这是about组件</header>`
          }
        }
      })
</script>
```

`is` 的值可以是注册过的组件名字符串，也可以直接是一个组件的选项对象。用它替代一长串 `v-if` / `v-else-if` 会清爽很多，Tab 切换、分步表单、根据后端返回的类型渲染不同卡片，都是它的典型场景。

**保留切换出去的组件，避免重新渲染**

默认情况下，切走的组件会被销毁，再切回来是一个全新的实例，之前填的表单、滚动位置、请求回来的数据全都没了。想把它保留在内存中，外面套一层 `keep-alive`：

```html
<keep-alive>
  <component :is="currentComponent">
    <!-- 非活动组件将被缓存 -->
  </component>
</keep-alive>
```

原文这里把 `keep-alive` 写成了「指令参数」，准确说它是 Vue 内置的一个抽象组件，用法是包裹，不是加在元素上的属性。

被 `keep-alive` 缓存的组件，销毁钩子不会触发，取而代之的是 `activated` 和 `deactivated` 两个钩子，进入时走前者，离开时走后者。所以「每次进来都刷新数据」的逻辑要从 `created` 挪到 `activated`，否则只有第一次会执行。这个我踩过，Tab 切回来数据一直是旧的，排查了半天才想起来组件根本没重建。

`keep-alive` 还支持 `include`、`exclude` 和 `max` 三个属性，分别用来白名单、黑名单和限制缓存数量。缓存是拿内存换体验，页面多的时候记得用 `max` 兜一下底。

## 七、使用 slot 分发内容

### 7.1 单个 slot

很多组件的使用方式是这样的，标签之间是空的：

```html
<my-component></my-component>
```

但原生的 HTML 元素都是可以嵌套的，`div` 里能放 `table`。自定义组件的开闭标签之间也可以放内容，前提是定义组件时用了 `slot`。

`slot` 相当于子组件预留了一个位置，父组件在调用它的时候往开闭标签之间放的东西，都会被塞到这个位置上。有两条配套规则：

- 当子组件中没有 `slot` 时，父组件放在子组件标签内的内容会被直接丢弃
- 子组件的 `slot` 标签内可以放置内容，当父组件没有放置内容时，这些内容会作为默认值渲染出来

子组件的模板：

```html
<div>
  <h2>我是子组件的标题</h2>
  <slot>
    只有在没有要分发的内容时才会显示。
  </slot>
</div>
```

父组件模板：

```html
<div>
  <h1>我是父组件的标题</h1>
  <my-component>
    <p>这是一些初始内容</p>
  </my-component>
</div>
```

渲染结果：

```html
<div>
  <h1>我是父组件的标题</h1>
  <div>
    <h2>我是子组件的标题</h2>
    <p>这是一些初始内容</p>
  </div>
</div>
```

这里有个作用域的规则很容易搞错。插槽里的内容是在父组件作用域里编译的，你在插槽内容里插值引用 `msg`，取的是父组件的数据，不是子组件的。想把子组件内部的数据暴露给插槽内容用，得走作用域插槽，子组件在 `slot` 上绑属性，父组件通过 `slot-scope`（Vue 2.6 之后是 `v-slot`）接收。列表类组件的「自定义每一行怎么渲染」全靠这个能力。

### 7.2 带名称的 slot

`slot` 可以有很多个。子组件给每个 `slot` 起一个名字 `name`，父组件放置内容时给每个元素的 `slot` 属性分配一个对应的名字，内容就会去找具有对应名字的 `slot` 元素。

有两条规则要记：

- 子组件可以有一个匿名的 `slot`，当分发的内容找不到对应的具名 `slot` 时，就会进到这里面
- 如果子组件没有匿名的 `slot`，找不到归属的内容会被丢弃

例如有一个 `app-layout` 组件，它的模板为：

```html
<div class="container">
  <header>
    <slot name="header"></slot>
  </header>
  <main>
    <slot></slot>
  </main>
  <footer>
    <slot name="footer"></slot>
  </footer>
</div>
```

父组件模板：

```html
<app-layout>
  <h1 slot="header">这里可能是一个页面标题</h1>
  <p>主要内容的一个段落。</p>
  <p>另一个主要段落。</p>
  <p slot="footer">这里有一些联系信息</p>
</app-layout>
```

渲染结果为：

```html
<div class="container">
  <header>
    <h1>这里可能是一个页面标题</h1>
  </header>
  <main>
    <p>主要内容的一个段落。</p>
    <p>另一个主要段落。</p>
  </main>
  <footer>
    <p>这里有一些联系信息</p>
  </footer>
</div>
```

这套 `slot="header"` 加 `slot-scope` 的写法，从 Vue 2.6 开始已经被标记为废弃，官方推荐换成统一的 `v-slot` 指令，写在 `template` 标签上，缩写是 `#`：

```html
<app-layout>
  <template #header>
    <h1>这里可能是一个页面标题</h1>
  </template>

  <p>主要内容的一个段落。</p>

  <template #footer>
    <p>这里有一些联系信息</p>
  </template>
</app-layout>
```

改动的原因是老写法把具名插槽和作用域插槽拆成了两套语法，还各自有一堆边界规则，`v-slot` 把它们统一成了一个指令。Vue 3 里旧写法已经彻底移除，迁移老项目时这块是必改项。

插槽是组件封装能力的天花板。只有 props 和事件的话，组件只能做到「配置」；有了插槽，使用者可以直接决定内部某块长什么样，组件才真正变成可复用的骨架。

## 八、组件通信

在 Vue.js 中，父子组件的关系可以总结为 `props down`，`events up`。

![父组件通过 props 向下传数据，子组件通过事件向上传消息](https://upload-images.jianshu.io/upload_images/1480597-a057513f8294a129.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

父组件通过 `props` 向下传递数据给子组件，子组件通过 `events` 给父组件发送消息。

### 8.1 父传子

父组件通过 `props` 属性给子组件传数据：

```html
<parent>
    <!-- 模板里用短横线形式，props 声明用驼峰 -->
    <child :child-com="content"></child>
</parent>
```

```javascript
data(){
    return {
        content: 'sichaoyun'
    };
}
```

子组件通过 `props` 来接收数据，三种写法从简到繁。

第一种，数组形式，只声明名字：

```javascript
props: ['childCom']
```

第二种，对象形式，顺带指定类型，类型不一致会在控制台警告：

```javascript
props: {
    childCom: String
}
```

第三种，完整对象形式，可以给默认值：

```javascript
props: {
    childCom: {
        type: String,
        default: 'sichaoyun'
    }
}
```

原文这里的注释写的是「注意这里用驼峰写法哦」但代码是短横线，容易看懵。把规则再说一遍：`props` 里声明用驼峰 `childCom`，DOM 模板里传值用短横线 `child-com`，Vue 负责转换。

日常我一律用第三种。多写两行的成本，换来的是别人看你的组件时不用去翻实现就知道该传什么、不传会怎样。

### 8.2 子传父

Vue 2 只允许单向数据传递，子组件要影响父组件的数据，得通过触发事件来做。

子组件：

```html
<template>
    <div @click="open"></div>
</template>
```

```javascript
methods: {
   open() {
        // 触发 showbox 事件，'the msg' 是向父组件传递的数据
        this.$emit('showbox', 'the msg');
    }
}
```

父组件：

```html
<!-- 监听子组件触发的 showbox 事件，然后调用 toshow 方法 -->
<child @showbox="toshow" :msg="msg"></child>
```

```javascript
methods: {
    toshow(msg) {
        this.msg = msg;
    }
}
```

这条链路的价值在于，数据的所有权始终在父组件手里。子组件只是「报告发生了什么」，改不改、怎么改由父组件决定。调试的时候顺着这条线走，永远能找到数据是在哪一行被改的。

### 8.3 兄弟组件之间的通信

两个没有直接父子关系的组件要通信，可以实例化一个 Vue 实例当作第三方，也就是常说的事件总线：

```javascript
let vm = new Vue(); // 创建一个新实例
```

发送方：

```html
<div @click="ge"></div>
```

```javascript
methods: {
    ge() {
        vm.$emit('blur', 'sichaoyun'); // 触发事件
    }
}
```

接收方：

```javascript
created() {
  vm.$on('blur', (arg) => {
        this.test = arg; // 接收
    });
}
```

它能工作是因为每个 Vue 实例都实现了一套事件接口，`$on` 订阅、`$emit` 发布，跟这个实例有没有挂到页面上没关系。

这里有个坑要注意，而且很多人不知道。`$on` 注册的监听不会随组件销毁自动解除，得在 `beforeDestroy` 里手动 `vm.$off('blur')`。不解绑的话，组件反复创建销毁之后，同一个事件上会累积一堆监听，触发一次执行 N 遍，而且旧实例被闭包引用着回收不掉，就是内存泄漏。

我自己对事件总线的态度是能不用就不用。它最大的问题是数据流向不可追踪，一个 `$emit` 出去，你不知道有谁在听，改代码的时候不敢删。组件层级不深的话优先考虑「共同的父组件转发」，状态需要跨页面共享就直接上 Vuex。Vuex 的用法在 [Vue 状态管理 Vuex](https://feinterview.poetries.top/blog/vue-vuex) 那篇里。

顺带把 Vue 2 里其他几种通信方式列个全：`$parent` / `$children` 直接访问上下级实例（能用但耦合太紧，不推荐）、`$refs` 拿子组件实例调方法、`provide` / `inject` 做跨层级注入（适合组件库内部，业务里慎用，因为依赖关系是隐式的）、`$attrs` / `$listeners` 做多层透传。

## 九、Vue 3 里组件这块变了什么

上面所有内容都是 Vue 2 的写法。Vue 2 已经停止官方维护，迁到 Vue 3 时这几处是必改的。

组件上的 `v-model` 变了。Vue 2 默认展开成 `value` prop 加 `input` 事件，Vue 3 改成了 `modelValue` prop 加 `update:modelValue` 事件。前面 5.3 那个自定义输入组件迁移过去，`props: ['value']` 要改成 `props: ['modelValue']`，`$emit('input', val)` 要改成 `$emit('update:modelValue', val)`。用来改名字的 `model` 选项也没了，因为 Vue 3 允许一个组件挂多个 `v-model`，比如 `v-model:title` 和 `v-model:content` 同时存在。

`.sync` 修饰符被移除，功能并进了 `v-model:参数` 的写法。`.native` 修饰符也被移除，取而代之的是 `emits` 选项：组件显式声明自己会抛出哪些事件，没被声明的监听器自动落到根元素上。

事件总线这条路在 Vue 3 里走不通了。实例上的 `$on`、`$off`、`$once` 三个方法被移除，`$emit` 保留（因为组件还要往外抛事件）。官方给的替代方案是用 `mitt` 这类第三方的极小事件库，或者干脆改用状态管理。这个移除我觉得是好事，等于从语言层面劝退了一种容易失控的写法。

过滤器（`filters`）选项被移除了，Vue 2 里在插值里用竖线接一个过滤器名的那种写法在 Vue 3 里不存在，改用计算属性或者方法。

插槽只剩 `v-slot` 一种语法，`slot` 属性和 `slot-scope` 全部移除。

组件的 `data` 在 Vue 3 里必须是函数，根实例也不例外，Vue 2 那种「根实例可以传对象」的宽松处理没有了。

好的一面是 Vue 3 补了不少能力：多根节点组件、`script setup` 语法糖让组件定义少写一半样板代码、`defineProps` / `defineEmits` 配 TypeScript 之后 props 有了真正的类型推导，比 `validator` 那种运行时校验强得多。具体的 API 签名以官方文档为准。

## 总结

把这一整篇串起来，组件这套设计其实只在回答一个问题：一块 UI 怎么才能被安全地复用。

三条规则是地基。`data` 必须是函数，保证多个实例的数据互相独立；props 单向向下，保证数据只有一个来源；变更通过事件向上报，保证数据的修改点唯一可查。这三条一旦破掉，组件多起来就没法调试了。

三种扩展能力决定了组件的复用上限。props 让使用者能配置行为，事件让使用者能响应变化，插槽让使用者能替换内容。只有前两个的组件是「可配置的」，加上插槽才是「可复用的骨架」。

通信这块的选型顺序我会这么排：父子直接用 props 和事件，兄弟优先找共同的父组件转发，跨页面共享的状态上 Vuex 或 Pinia，事件总线放最后，而且 Vue 3 里已经没有原生支持了。

最后是几个具体的坑，写一遍省得再踩：DOM 模板里 prop 名用短横线、事件名别用驼峰、`.sync` 的 emit 名要和模板写法完全一致、`keep-alive` 之后数据刷新逻辑要挪到 `activated`、`$on` 注册的监听记得在销毁时 `$off`。

## 参考

- [Vue 3 官方文档 - 组件基础](https://cn.vuejs.org/guide/essentials/component-basics.html)
- [Vue 3 官方文档 - Props](https://cn.vuejs.org/guide/components/props.html)
- [Vue 3 官方文档 - 组件事件](https://cn.vuejs.org/guide/components/events.html)
- [Vue 3 官方文档 - 插槽](https://cn.vuejs.org/guide/components/slots.html)
- [Vue 3 官方文档 - KeepAlive](https://cn.vuejs.org/guide/built-ins/keep-alive.html)
- [Vue 3 迁移指南](https://v3-migration.vuejs.org/)
- [前端进阶之旅](https://interview.poetries.top)
