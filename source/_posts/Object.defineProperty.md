---
title: Object.defineProperty详解与Vue2响应式原理
description: 逐个拆解 value、writable、enumerable、configurable 四个数据描述符和 get/set 存取器描述符，讲清默认值陷阱，并用它解释 Vue 2 响应式的实现与三个天生短板。
date: 2018-12-23 09:40:12
tags:
  - JavaScript
  - Object.defineProperty
  - 响应式原理
categories: Front-End
---

> 来自网络

有次接手一份老代码，配置对象上的某个字段赋值怎么都不生效，`console.log` 打出来还是旧值，也不报错。找了很久才发现前面有人用 `Object.defineProperty` 把它定成了 `writable: false`，非严格模式下这种赋值是静默失败的，连个警告都没有。

`Object.defineProperty` 平时写业务确实用得少，但它是 JS 对象模型的底层入口。`Object.freeze` 怎么冻住对象、`class` 的方法为什么 `for...in` 遍历不到、Vue 2 的响应式是怎么做的，答案全在属性描述符这套机制里。这篇把四个数据描述符和存取器描述符逐个过一遍，再用它解释一遍 Vue 2 的响应式和它的短板。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 属性描述符解决了什么问题
- `value`、`writable`、`enumerable`、`configurable` 各自管什么
- 用 `defineProperty` 定义属性时那个「默认全是 false」的坑
- 严格模式和非严格模式下违规操作的不同表现
- `get`/`set` 存取器描述符的用法和它的互斥规则
- Vue 2 的响应式为什么必须用它，以及三个绕不过去的短板
- `Proxy` 是怎么把这些短板补上的
- 配套的几个 API，`getOwnPropertyDescriptor`、`defineProperties`、`freeze`

## 一、简介

先说兼容性，在 IE8 下 `Object.defineProperty` 只能在 DOM 对象上使用，尝试在原生的对象上使用会报错。这条限制今天已经没有实际意义了，主流浏览器和 Node 都完整支持它，写它只是为了让你在读老代码里那些奇怪的兼容分支时知道来由。

定义对象可以使用构造函数或字面量的形式。

```js
var obj = new Object;  //obj = {}
obj.name = "张三";  //添加描述
obj.say = function(){};  //添加行为
```

除了以上添加属性的方式，还可以使用 `Object.defineProperty` 定义新属性或修改原有的属性。

两者的差别不只是写法。用 `obj.name = '张三'` 这种赋值方式创建的属性，是可写、可枚举、可配置的，也就是一个「什么都能干」的普通属性。而 `Object.defineProperty` 允许你把这三个开关单独关掉，这才是它存在的理由。

## 二、Object.defineProperty()

### 2.1 定义

```js
Object.defineProperty(obj, prop, descriptor)
```

参数说明：

- `obj` 必需，目标对象
- `prop` 必需，需定义或修改的属性的名字
- `descriptor` 必需，目标属性所拥有的特性

返回值是传入函数的对象，即第一个参数 `obj`。注意它是原地修改，返回的就是那个对象本身，不是副本。

针对属性我们可以设置一些特性，比如是否只读不可以写，是否可以被 `for...in` 或 `Object.keys()` 遍历。

给对象的属性添加特性描述，目前提供两种形式，数据描述和存取器描述。这两种形式是互斥的，同一个属性只能选一种。

### 2.2 数据描述

当修改或定义对象的某个属性的时候，给这个属性添加一些特性。

```js
var obj = {
    test:"hello"
}
//对象已有的属性添加特性描述
Object.defineProperty(obj,"test",{
    configurable:true | false,
    enumerable:true | false,
    value:任意类型的值,
    writable:true | false
});
//对象新添加的属性的特性描述
Object.defineProperty(obj,"newKey",{
    configurable:true | false,
    enumerable:true | false,
    value:任意类型的值,
    writable:true | false
});
```

数据描述中的属性都是可选的，来看一下设置每一个属性的作用。

#### 2.2.1 value

属性对应的值，可以是任意类型的值，默认为 `undefined`。

```js
var obj = {}
//第一种情况：不设置value属性
Object.defineProperty(obj,"newKey",{

});
console.log( obj.newKey );  //undefined
------------------------------
//第二种情况：设置value属性
Object.defineProperty(obj,"newKey",{
    value:"hello"
});
console.log( obj.newKey );  //hello
```

上面这两段用分隔线隔开了，是因为它们必须分别运行。第一种情况执行完之后 `newKey` 的 `configurable` 是 `false`，同一个 `obj` 上再调一次 `defineProperty` 会直接抛错。这个细节后面讲 `configurable` 的时候还会再遇到一次。

#### 2.2.2 writable

属性的值是否可以被重写。设置为 `true` 可以被重写，设置为 `false` 不能被重写，默认为 `false`。

```js
var obj = {}
//第一种情况：writable设置为false，不能重写。
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:false
});
//更改newKey的值
obj.newKey = "change value";
console.log( obj.newKey );  //hello

//第二种情况：writable设置为true，可以重写
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:true
});
//更改newKey的值
obj.newKey = "change value";
console.log( obj.newKey );  //change value
```

第一种情况里那次赋值就是我开头踩的坑。非严格模式下它悄无声息地失败，什么都不发生。开了严格模式（`'use strict'`）或者在 ES 模块里（模块默认严格模式），同样的代码会抛 `TypeError: Cannot assign to read only property`。

这个差别在实践中很重要。现在用打包工具的项目源码基本都是 ESM，天生严格模式，所以你反而更容易第一时间看到报错。真正难查的是那些跑在非严格模式下的老脚本。

#### 2.2.3 enumerable

此属性是否可以被枚举（使用 `for...in` 或 `Object.keys()`）。设置为 `true` 可以被枚举，设置为 `false` 不能被枚举，默认为 `false`。

```js
var obj = {}
//第一种情况：enumerable设置为false，不能被枚举。
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:false,
    enumerable:false
});

//枚举对象的属性
for( var attr in obj ){
    console.log( attr );  
}
//第二种情况：enumerable设置为true，可以被枚举。
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:false,
    enumerable:true
});

//枚举对象的属性
for( var attr in obj ){
    console.log( attr );  //newKey
}
```

不可枚举不等于不存在。`enumerable: false` 的属性，`for...in`、`Object.keys`、`JSON.stringify`、展开运算符都拿不到它，但 `obj.newKey` 直接访问是有值的，`Object.getOwnPropertyNames(obj)` 也能列出来，`'newKey' in obj` 同样返回 `true`。

这个特性在语言内部用得很多。`Array.prototype.push`、`Object.prototype.toString` 这些内置方法全是不可枚举的，否则你 `for...in` 一个数组会把所有原型方法都遍历出来。`class` 里定义的方法默认也是不可枚举的，而 ES5 时代手动挂在 `prototype` 上的函数是可枚举的，这是两者一个容易被忽略的差别。

#### 2.2.4 configurable

是否可以删除目标属性，或是否可以再次修改属性的特性（`writable`、`configurable`、`enumerable`）。设置为 `true` 可以被删除或可以重新设置特性，设置为 `false` 不能被删除也不可以重新设置特性，默认为 `false`。

这个属性起到两个作用：

- 目标属性是否可以使用 `delete` 删除
- 目标属性是否可以再次设置特性

```js
//-----------------测试目标属性是否能被删除------------------------
var obj = {}
//第一种情况：configurable设置为false，不能被删除。
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:false,
    enumerable:false,
    configurable:false
});
//删除属性
delete obj.newKey;
console.log( obj.newKey ); //hello

//第二种情况：configurable设置为true，可以被删除。
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:false,
    enumerable:false,
    configurable:true
});
//删除属性
delete obj.newKey;
console.log( obj.newKey ); //undefined
```

这两段代码同样要分开跑，原文没说清楚这点。放在一起顺序执行的话，第二次 `defineProperty` 会因为上一次设了 `configurable: false` 而直接抛 `TypeError: Cannot redefine property`，根本走不到 `delete` 那行。

`delete` 失败的表现也分模式。非严格模式下 `delete obj.newKey` 返回 `false` 然后什么都不发生，严格模式下直接抛 `TypeError`。

```js
//-----------------测试是否可以再次修改特性------------------------
var obj = {}
//第一种情况：configurable设置为false，不能再次修改特性。
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:false,
    enumerable:false,
    configurable:false
});

//重新修改特性
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:true,
    enumerable:true,
    configurable:true
});
console.log( obj.newKey ); //报错：Uncaught TypeError: Cannot redefine property: newKey

//第二种情况：configurable设置为true，可以再次修改特性。
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:false,
    enumerable:false,
    configurable:true
});

//重新修改特性
Object.defineProperty(obj,"newKey",{
    value:"hello",
    writable:true,
    enumerable:true,
    configurable:true
});
console.log( obj.newKey ); //hello
```

`configurable: false` 是一道单向门，关上就再也打不开了。有一个小例外，如果原来是 `writable: true` 加 `configurable: false`，你还可以把 `writable` 改成 `false`（只能收紧，不能放宽），改完就彻底锁死。

这个「只能收紧不能放宽」的规则是刻意设计的。有了它，一段代码就可以对外提供一个真正不可篡改的属性，第三方脚本拿到这个对象也改不回来。`Object.freeze` 就是靠批量设置 `writable: false` 加 `configurable: false` 实现的。

### 2.3 默认值这个坑

除了可以给新定义的属性设置特性，也可以给已有的属性设置特性。

```js
//定义对象的时候添加的属性，是可删除、可重写、可枚举的。
var obj = {
    test:"hello"
}

//改写值
obj.test = 'change value';

console.log( obj.test ); //'change value'

Object.defineProperty(obj,"test",{
    writable:false
})


//再次改写值
obj.test = 'change value again';

console.log( obj.test ); //依然是：'change value'
```

一旦使用 `Object.defineProperty` 给对象添加属性，那么如果不设置属性的特性，`configurable`、`enumerable`、`writable` 这些值都为默认的 `false`。

```js
var obj = {};
//定义的新属性后，这个属性的特性中configurable，enumerable，writable都为默认的值false
//这就导致了newKey这个属性是不能重写、不能枚举、不能再次设置特性
//
Object.defineProperty(obj,'newKey',{

});

//设置值
obj.newKey = 'hello';
console.log(obj.newKey);  //undefined

//枚举
for( var attr in obj ){
    console.log(attr);
}
```

这是新手用 `defineProperty` 最容易翻的一次车。你只想给某个属性加个 getter，结果因为没写 `enumerable: true`，这个属性在 `Object.keys`、`JSON.stringify`、`{...obj}` 里全部消失了，接口传数据的时候直接丢字段。

有一条规则要区分清楚：

| 创建方式 | writable | enumerable | configurable |
|----------|----------|------------|--------------|
| `obj.key = v` 或字面量 | `true` | `true` | `true` |
| `Object.defineProperty` 不指定 | `false` | `false` | `false` |

但如果是用 `defineProperty` 修改一个**已存在**的属性，没指定的那些描述符会保持原样，不会被重置成 `false`。上面 `obj.test` 那个例子里只传了 `writable: false`，`enumerable` 和 `configurable` 依然是 `true`。

设置的特性总结：

- `value` 设置属性的值
- `writable` 值是否可以重写，`true` 或 `false`
- `enumerable` 目标属性是否可以被枚举，`true` 或 `false`
- `configurable` 目标属性是否可以被删除或是否可以再次修改特性，`true` 或 `false`

### 2.4 存取器描述

#### 2.4.1 定义

当使用存取器描述属性的特性的时候，允许设置以下特性属性。

```js
var obj = {};
Object.defineProperty(obj,"newKey",{
    get: function (){} , // 或 undefined
    set: function (value){} , // 或 undefined
    configurable: true , // 或 false
    enumerable: true // 或 false
});
```

原文这段示意代码用 `|` 表示可选值，但漏了几个逗号，直接抄进去会报语法错误，我按合法语法调整了一下并把可选值挪进注释。

当使用了 `getter` 或 `setter` 方法，不允许使用 `writable` 和 `value` 这两个属性，同时写会抛 `TypeError`。原因很直白，`get`/`set` 已经完全接管了读写行为，`value` 存在哪儿、能不能写都由你的函数决定，再给一个 `value` 就矛盾了。

#### 2.4.2 getter/setter

当设置或获取对象的某个属性的值的时候，可以提供 `getter`/`setter` 方法。`getter` 是一种获得属性值的方法，`setter` 是一种设置属性值的方法。在特性中使用 `get`/`set` 属性来定义对应的方法。

```js
var obj = {};
var initValue = 'hello';
Object.defineProperty(obj,"newKey",{
    get:function (){
        //当获取值的时候触发的函数
        return initValue;    
    },
    set:function (value){
        //当设置值的时候触发的函数,设置的新值通过参数value拿到
        initValue = value;
    }
});
//获取值
console.log( obj.newKey );  //hello

//设置值
obj.newKey = 'change value';

console.log( obj.newKey ); //change value
```

`get` 或 `set` 不是必须成对出现，任写其一就可以。如果不设置方法，则 `get` 和 `set` 的默认值为 `undefined`。只写 `get` 就是一个只读属性，非严格模式下给它赋值静默失败。

这里有个坑要注意，真实值必须存在闭包或者别的地方，不能存在属性自己身上。像下面这样写会直接爆栈：

```js
Object.defineProperty(obj, 'key', {
  get() { return this.key; },  // 又触发了自己的 getter，无限递归
  set(v) { this.key = v; }     // 同样递归
});
```

正确的做法就是原文那样用外部变量，或者约定一个下划线开头的影子属性 `_key` 来存实际值。

## 三、Vue 2 的响应式就是这么做的

铺垫了这么多描述符，最有名的应用场景该出场了。

Vue 2 在初始化 `data` 的时候，会递归遍历每一个属性，用 `Object.defineProperty` 把它改造成一对 `get`/`set`。`get` 里做依赖收集，把当前正在渲染的组件记下来；`set` 里做派发更新，通知所有记下来的组件重新渲染。

```js
function defineReactive(obj, key, val) {
  const dep = new Dep(); // 这个属性的订阅者集合
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      dep.depend();   // 谁在读我，就把它记下来
      return val;
    },
    set(newVal) {
      if (newVal === val) return;
      val = newVal;
      dep.notify();   // 值变了，通知所有订阅者
    }
  });
}
```

代码本身不复杂，`enumerable: true` 和 `configurable: true` 这两行必须显式写上，不然改造完的 `data` 属性会变成不可枚举的，模板渲染和序列化立刻出问题。这正好印证了前面说的默认值陷阱。

### 3.1 三个绕不过去的短板

`Object.defineProperty` 拦截的是「某个具体属性的读写」，这个粒度决定了它的三处天生缺陷。

第一，新增和删除属性拦不到。`this.obj.newProp = 1` 这个 `newProp` 从来没被 `defineProperty` 改造过，没有 getter/setter，Vue 完全不知道。这就是 Vue 2 必须提供 `Vue.set` / `this.$set` 的原因。

第二，数组的下标赋值和 `length` 修改拦不到。理论上可以给每个下标都定义描述符，但数组长度是动态的，每次 push 都要重新改造一遍，代价太高。Vue 2 的做法是替换数组的原型，重写 `push`、`pop`、`splice` 等七个方法，在里面手动触发更新。所以 `arr[0] = 1` 和 `arr.length = 0` 在 Vue 2 里都不会触发视图更新。

第三，必须一上来就递归遍历到底。`data` 里嵌了五层对象，初始化时就要把五层全部走一遍挨个改造。数据量大的时候这是实打实的启动开销，而且深层的对象你可能根本没用到。

关于 Vue 响应式的完整实现和 Vue 3 的改动，可以看 [Vue响应式原理梳理](https://feinterview.poetries.top/blog/vue-reative-summary)。

### 3.2 Proxy 是怎么补上的

Vue 3 换成了 `Proxy`。差别在于 `Proxy` 代理的是整个对象，不是某个属性。

```js
const proxy = new Proxy(target, {
  get(obj, key, receiver) { /* 任何属性的读取都会进来 */ },
  set(obj, key, value, receiver) { /* 任何属性的写入都会进来，包括新增的 */ },
  deleteProperty(obj, key) { /* delete 也能拦到 */ }
});
```

拦截层级从「属性」提到了「对象」，前面三个问题就一起解决了。新增属性走 `set`、删除走 `deleteProperty`、数组下标赋值在 `Proxy` 眼里也就是一次普通的 `set`。而且它可以做惰性代理，只在真正访问到某层对象时才给那一层套上 `Proxy`，不用一上来就递归到底。

代价是 `Proxy` 没法被 polyfill，所以 Vue 3 直接放弃了 IE11。`Proxy` 的十三种拦截操作可以看 [ES6 Proxy 详解](https://feinterview.poetries.top/blog/es6-proxy)。

不是说 `Object.defineProperty` 不行，而是它的设计目标本来就是「精确控制单个属性的行为」，用它做全对象的变更侦测属于超纲使用。定义常量、隐藏内部字段、给对象加计算属性这些场景，它到今天依然是最合适的工具。

## 四、配套的几个 API

单独用 `defineProperty` 之外，还有几个配套的方法值得记住。

`Object.getOwnPropertyDescriptor(obj, key)` 读出某个属性当前的描述符，调试的时候比猜有用得多。开头那个「赋值不生效」的问题，如果一开始就打一下这个，马上能看到 `writable: false`。

`Object.defineProperties(obj, descriptors)` 一次定义多个属性，参数是一个「属性名到描述符」的对象。

`Object.freeze(obj)` 把所有属性设成不可写不可配置，同时禁止新增属性。注意它是浅的，嵌套对象里的属性照样能改。`Object.seal` 弱一些，只禁止新增和删除，已有属性还能改值。

`Reflect.defineProperty` 是 `Object.defineProperty` 的函数式版本，区别是失败时返回 `false` 而不是抛异常，写批量逻辑的时候更好处理。

## 总结

`Object.defineProperty` 的核心是四个开关加一对函数。`value` 和 `writable` 管值，`enumerable` 管可见性，`configurable` 管这些开关本身还能不能改，`get`/`set` 则是完全接管读写。

最容易踩的坑是默认值。用它新建属性时三个开关默认全 `false`，用它修改已有属性时不传的那些保持原样。忘了写 `enumerable: true` 会让属性在 `Object.keys` 和 `JSON.stringify` 里凭空消失，这种 bug 特别难查。

违规操作的表现分模式。非严格模式下改只读属性、删不可配置属性都是静默失败，严格模式和 ES 模块里会抛 `TypeError`。排查这类问题的第一步是 `Object.getOwnPropertyDescriptor` 打一下描述符。

`configurable: false` 是单向门，唯一允许的收紧动作是把 `writable` 从 `true` 改成 `false`。这条规则是 `Object.freeze` 能提供真正不可篡改保证的基础。

它和 `Proxy` 的差别在拦截层级上。前者盯的是一个具体属性，所以拦不到新增、删除和数组下标；后者代理整个对象，这三件事天然覆盖。Vue 2 到 Vue 3 的这次替换，换掉的正是这层能力边界。

## 参考

- [MDN Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
- [MDN Object.getOwnPropertyDescriptor](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptor)
- [MDN Object.freeze](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
- [MDN Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [Vue 2 深入响应式原理](https://v2.cn.vuejs.org/v2/guide/reactivity.html)
- [前端进阶之旅](https://interview.poetries.top)
