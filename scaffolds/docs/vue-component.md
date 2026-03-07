---
title: vue组件（九)
date: 2018-08-27 11:20:32
tags: Vue
categories: Front-End
---

## 一、组件的基本使用

### 1.1 注册组件

> 注册组件就是利用`Vue.component()`方法，先传入一个自定义组件的名字，然后传入这个组件的配置

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


> 如上方式，就已经创建了一个自定义组件，然后就可以在Vue实例挂在的DOM元素中使用它

```html
<div id="app">
    <mycomponent></mycomponent>
    <my-component></my-component>
</div>
<script>
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
</script>
```

> 直接使用`Vue.component()`创建的组件，所有的Vue实例都可以使用。还可以在某个Vue实例中注册只有自己能使用的组件

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

### 1.2 模板的要求

> 注意：组件的模板只能有一个根元素。下面的情况是不允许的

```
template: `<div>这是一个局部的自定义组件，只能在当前Vue实例中使用</div>
            <button>hello</button>`,
```

### 1.3 组件中的data必须是函数

- 可以看出，注册组件时传入的配置和创建Vue实例差不多，但也有不同，其中一个就是`data`属性必须是一个函数
- 这是因为如果像`Vue`实例那样，传入一个对象，由于JS中对象类型的变量实际上保存的是对象的引用，所以当存在多个这样的组件时，会共享数据，导致一个组件中数据的改变会引起其他组件数据的改变。
- 而使用一个返回对象的函数，每次使用组件都会创建一个新的对象，这样就不会出现共享数据的问题来了

### 1.4 关于DOM模板的解析

> 当使用 DOM 作为模版时 (例如，将 el 选项挂载到一个已存在的元素上), 你会受到 HTML 的一些限制，因为 Vue 只有在浏览器解析和标准化 HTML 后才能获取模板内容。尤其像这些元素 `<ul>`，`<ol>`，`<table>`，`<select>` 限制了能被它包裹的元素，而一些像 `<option>` 这样的元素只能出现在某些其它元素内部

- 在自定义组件中使用这些受限制的元素时会导致一些问题，例如

```html
<table>
  <my-row>...</my-row>
</table>
```

- 自定义组件 `<my-row>` 被认为是无效的内容，因此在渲染的时候会导致错误。这时应使用特殊的 `is` 属性

```html
<table>
  <tr is="my-row"></tr>
</table>
```

> 也就是说，标准HTML中，一些元素中只能放置特定的子元素，另一些元素只能存在于特定的父元素中。比如`table`中不能放置`div`，`tr`的父元素不能`div`等。所以，当使用自定义标签时，标签名还是那些标签的名字，但是可以在标签的`is`属性中填写自定义组件的名字

**应当注意，如果您使用来自以下来源之一的字符串模板，这些限制将不适用**：

- `<script type="text/x-template">`
- `JavaScript` 内联模版字符串
- `.vue` 组件

> 一般情况下，只有单文件组件`.vue`可以忽略这种情况

## 二、组件的属性和事件

> 在`html`中使用元素，会有一些属性，如`class`,`id`，还可以绑定事件，自定义组件也是可以的。当在一个组件中，使用了其他自定义组件时，就会利用子组件的属性和事件来和父组件进行数据交流

![](https://poetries1.gitee.io/img-repo/2019/10/621.png)

- 父子组件之间的通信就是 `props down`,`events up`，父组件通过属性`props`向下传递数据给子组件，子组件通过 事件`events` 给父组件发送消息。
- 比如，子组件需要某个数据，就在内部定义一个prop属性，然后父组件就像给`html`元素指定特性值一样，把自己的`data`属性传递给子组件的这个属性。
- 而当子组件内部发生了什么事情的时候，就通过自定义事件来把这个事情涉及到的数据暴露出来，供父组件处理

```html
<my-component v-bind:foo="baz" v-on:event-a="doThis(arg1,...arg2)"></my-component>
```

- `foo`是`<my-component>`组件内部定义的一个`prop`属性，`baz`是父组件的一个`data`属性，
- `event-a`是子组件定义的一个事件，`doThis`是父组件的一个方法

**过程就是这样**

- 父组件把`baz`数据通过`prop`传递给子组件的`foo`；
- 子组件内部得到`foo`的值，就可以进行相应的操作；
- 当子组件内部发生了一些变化，希望父组件能知道时，就利用代码触发`event-a`事件，把一些数据发送出去
- 父组件把这个事件处理器绑定为`doThis`方法，子组件发送的数据，就作为`doThis`方法的参数被传进来
- 然后父组件就可以根据这些数据，进行相应的操作

## 三、属性Props

> Vue组件通过`props`属性来声明一个自己的属性，然后父组件就可以往里面传递数据

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

> 调用该组件

```html
<div id="app">
    <mycomponent my-message="hello"></mycomponent>
</div>
```

- **注意**，由于`HTML`特性是不区分大小写的，所以传递属性值时，`myMessage`应该转换成 `kebab-case` (短横线隔开式)`my-message="hello"`

### 3.1 v-bind绑定属性值

- 一般情况下，使用`v-bind`给元素特性(attribute)传递值时，`Vue`会将`""`中的内容当做一个表达式
- 用`v-bind:class`和`class`传入正常的类名，效果是一样的，因为对于这两个特性，`Vue`采用了合并而不是替换的原则

### 3.2 动态绑定特性值

> 想要把父组件的属性绑定到子组件，应该使用`v-bind`，这样，父组件中数据改变时能反映到子组件。
注意，根据父组件传递给子组件的属性类型的不同，当在子组件中更改这个属性时，会有以下两种情况

- 当父组件传递的属性是引用类型时，在子组件中更改相应的属性会导致父组件相应属性的更改

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

> 当父组件传递值为基本类型时，在子组件中更改这个属性会报错。正确的做法是，在父组件中绑定属性值时，加上`.sync`修饰符

```html
<my-component :child-array.sync="parentArray"></my-component>
```

> 然后在子组件中改变相应的属性

```javascript
 methods: {
     changeArray () {
       this.counter++
       this.$emit('update:childArray', this.counter)
     }
   }
```

### 3.3 子组件希望对传入的prop进行操作

> 一般来说，是不建议在子组件中对父组件中传递来的属性进行操作的。如果真的有这种需求,可以这样:

- 父组件传递了一个基本类型值，那么可以在子组件中创建一个新的属性，并以传递进来的值进行初始化，之后就可以操作这个新的属性了

```javascript
props: ['initialCounter'],
data: function () {
  return { counter: this.initialCounter }
}
```

- 父组件传递了一个引用类型值，为了避免更改父组件中相应的数据，最好是对引用类型进行复制。复杂的情况，肯定应该是深复制。

### 3.4 给子组件传递正确类型的值

> 静态的给子组件的特性传递值，它都会把他当做一个字符串

```
<!-- 传递了一个字符串 "1" -->
<comp some-prop="1"></comp>
```

> 子组件中，特性的值是字符串 "1" 而不是 `number` 1。如果想传递正确的数值，应该使用`v-bind`传递，这样就能把传递的值当做一个表达式来处理，而不是字符串

```
<!-- 传递实际的 number 1 -->
<comp v-bind:some-prop="1"></comp>
```

## 四、Prop验证

> 我们可以给组件的`props`属性添加验证，当传入的数据不符合要求时，`Vue`会发出警告


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

**type 可以是下面原生构造器**：

- `String`
- `Number`
- `Boolean`
- `Function`
- `Object`
- `Array`
- `Symbol`
- `type `也可以是一个自定义构造器函数，使用 `instanceof` 检测

```javascript
// 自定义Person构造器
 function Person(name, age) {
    this.name = name
    this.age = age
  }
  Vue.component('my-component', {
    template: `<div>名字: {{ person-prop.name }}， 年龄： {{ person-prop.age }} </div>`,
    props: {
      person-prop: {
        type: Person     // 指定类型
      }
    }
  })
  new Vue({
    el: '#app2',
    data: {
      person: 2        // 传入Number类型会报错
    }
  })
```

**非Prop类型的属性**

> 也可以像在html标签中添加`data-`开头的自定义属性一样，给自定义组件添加任意的属性。而不仅限于`data-*`形式，这样做的话，Vue会把这个属性放在自定义组件的根元素上。一个自定义组件的模板只能有一个根元素

**覆盖非Prop属性**

> 如果父组件向子组件的非`prop`属性传递了值，那么这个值会覆盖子组件模板中的特性

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

- 上面渲染的结果是，`div`的`att`属性是`helloParent`。
- 注意：前面已经提到过，覆盖原则对于`class`和`style`不适用,而是采用了合并(`merge`)的原则

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

> 上面的渲染结果是，`div`的类名是`class1 class2`，行内样式是`color:red; background:yellow;`

## 五、自定义事件

> 通过`prop`属性，父组件可以向子组件传递数据，而子组件的自定义事件就是用来将内部的数据报告给父组件的

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

> 子组件在自己的方法中将自定义事件以及需要发出的数据通过以下代码发送出去

```
this.$emit('myclick', '这是我暴露出去的数据', '这是我暴露出去的数据2')
```

- 第一个参数是自定义事件的名字
- 后面的参数是依次想要发送出去的数据

> 父组件利用`v-on`为事件绑定处理器

```
<my-component2 v-on:myclick="onClick"></my-component2>
```

### 5.1 绑定原生事件

> 如果想在某个组件的根元素上监听一个原生事件。可以使用 `.native `修饰 `v-on`

```html
<my-component v-on:click.native="doTheThing"></my-component>
```

### 5.2 探究v-model

> `v-model`可以对表单控件实现数据的双向绑定，它的原理就是利用了绑定属性和事件来实现的。比如`input`控件。不使用`v-model`，可以这样实现数据的双向绑定

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

> 上面的代码同样实现了数据的双向绑定。其本质就是:

- 把`input`的`value`特性绑定到`Vue`实例的属性`text`上，`text`改变，`input`中的内容也会改变
- 然后把表单的`input`事件处理函数设置为`Vue`实例的一个方法，这个方法会根据输入参数改变`Vue`中`text`的值
相应的，在input中输入内容时，触发了`input`事件，把`event.target.value`传给这个方法，最后就实现了改变绑定的数据的效果。
- 而`v-model`就是上面这种方式的语法糖，也就是把上面的写法封装了一下，方便我们使用

### 5.3 使用自定义事件创建自定义的表单输入组件

> 理解了`v-model`的内幕，也就可以把这个效果用在自定义表单组件上了。来实现一个简单的只能输入hello的表单输入组件

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

## 六、动态组件

> 通过使用保留的 `<component>` 元素，动态地绑定到它的 `is` 特性，可以让多个组件使用同一个挂载点，并动态切换

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

**保留切换出去的组件，避免重新渲染**

> 如果把切换出去的组件保留在内存中，可以保留它的状态或避免重新渲染。为此可以添加一个 `keep-alive` 指令参数

```html
<keep-alive>
  <component :is="currentComponent">
    <!-- 非活动组件将被缓存！ -->
  </component>
</keep-alive>
```

## 七、使用slot分发内容

### 7.1 单个slot

> 很多组件的使用方式是这样的：

```
<component></component>
```

- 也就是说组件中是空的，没有放置任何文本或元素。但是原生的html元素都是可以进行嵌套的，`div`里面放`table`什么的。自定义组件开闭标签之间也可以放置内容，不过需要在定义组件时使用`slot`。
- `slot`相当于子组件设置了一个地方，如果在调用它的时候，往它的开闭标签之间放了东西，那么它就把这些东西放到`slot`中。
- 当子组件中没有`slot`时，父组件放在子组件标签内的东西将被丢弃；
- 子组件的`slot`标签内可以放置内容，当父组件没有放置内容在子组件标签内时，slot中的内容会渲染出来


子组件的模板:

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

### 7.2 带名称的slot

- `slot`可以有很多个。那么子组件对于父组件放置的多余的内容如何放到各个`slot`中呢？方法就是子组件给每个`slot`起一个名字`name`，父组件放置多余的元素时，给每个元素的`slot`属性分配一个代表`slot`的名字。到时候，多余的内容就会根据自己的`slot`属性去找具有对应名字的`slot`元素。

**注意**：

- 子组件可以有一个匿名的`slot`，当分发的多余内容找不到对应的`slot`时，就会进入这里面
如果子组件没有匿名的`slot`，当分发的多余内容找不到对应的`slot`时，就会被丢弃

例如，假定我们有一个 `app-layout`组件，它的模板为：

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

父组件模版：

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

## 八、组件通信

> 在 Vue.js 中，父子组件的关系可以总结为 `props down`, `events up`

![image.png](https://upload-images.jianshu.io/upload_images/1480597-a057513f8294a129.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> 父组件通过 `props` 向下传递数据给子组件，子组件通过 `events` 给父组件发送消息

## 8.1 父与子

> 父组件是通过`props`属性给子组件通信的来看下代码

```
<parent>
    <child :child-com="content"></child> //注意这里用驼峰写法哦
</parent>

data(){
    return {
        content:'sichaoyun'
    };
}
```

**子组件通过props来接受数据**

> 第一种方法

```javascript
props: ['childCom']
```

> 第二种方法


```javascript
props: {
    childCom: String // 这里指定了字符串类型，如果类型不一致会警告哦
}
```

> 第三种方法

```javascript
props: {
    childCom: {
        type: String,
        default: 'sichaoyun' 
    }
}
```

### 8.2 子与父

> `vue2.0`只允许单向数据传递，我们通过出发事件来改变组件的数据

子组件

```html
<template>
    <div @click="open"></div>
</template>

<script>
    methods: {
       open() {
            this.$emit('showbox','the msg'); //触发showbox方法，'the msg'为向父组件传递的数据
        }
    }
</script>
```

父组件

```html
<child @showbox="toshow" :msg="msg"></child> //监听子组件触发的showbox事件,然后调用toshow方法

<script>
    methods: {
        toshow(msg) {
            this.msg = msg;
        }
    }
</script>
```

### 8.3 兄弟组件之间的通信

> 我们可以实例化一个vue实例，相当于一个第三方

```
let vm = new Vue(); //创建一个新实例
```

组件他哥

```
<div @click="ge"></div>
methods: {
    ge() {
        vm.$emit('blur','sichaoyun'); //触发事件
    }
}
```

组件小弟接受大哥命令

```
<div></div>
created() {
  vm.$on('blur', (arg) => { 
        this.test= arg; // 接收
    });
}
```
