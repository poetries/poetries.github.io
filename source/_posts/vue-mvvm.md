---
title: 实现数据双向绑定 MVVM 剖析 Vue 的原理
description: 对比发布订阅、脏值检查、数据劫持三种双向绑定流派，再用 Observer、Compile、Watcher 加 MVVM 入口四个模块，把 Vue 2 数据劫持这条链路的架构讲清楚。
date: 2018-02-25 17:12:32
tags:
  - MVVM
  - Vue
  - 响应式原理
categories: Front-End
---

「Vue 的双向绑定是怎么实现的」这个问题，多数人的答案停在「用 `Object.defineProperty` 劫持了 getter 和 setter」。这句话没错，但它只回答了一半。数据变了之后，Vue 怎么知道该更新页面上哪个节点？模板里的指令是什么时候被解析成更新函数的？谁负责把这两头接起来？这篇不去逐行抠代码，而是把整套架构拆成四个模块讲清楚各自的职责和边界，顺带把 Vue 之外的另外两种流派（Backbone 的发布订阅、Angular 的脏值检查）拿来做对照，看看数据劫持到底赢在哪。

想看逐行手写的完整实现，可以配合 [Vue 响应式原理模拟 手写一个迷你版 Vue](https://feinterview.poetries.top/blog/vue-reative-summary) 那篇一起看；只关心 `Object.defineProperty` 这个 API 本身的描述符细节，看 [Object.defineProperty 详解](https://feinterview.poetries.top/blog/Object.defineProperty)。这三篇的分工是：那篇讲 API，另一篇讲代码怎么敲，这篇讲架构为什么这么分。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 发布订阅、脏值检查、数据劫持三种流派各自的做法和代价
- 为什么数据劫持能做到 `vm.property = value` 这种自然的写法
- `Observer` 怎么把普通对象变成能广播变化的对象
- `Dep` 这个消息订阅器为什么必须建在闭包里
- `Compile` 为什么要先把 DOM 搬进 `DocumentFragment` 再解析
- `Watcher` 作为桥梁，是靠什么完成依赖收集的
- `MVVM` 入口的属性代理在解决什么问题
- 这套实现和真实 Vue 之间还差什么，Vue 3 换成 Proxy 补上了哪些短板

先看要做出来的效果：

```html
<div id="mvvm-app">
    <input type="text" v-model="word">
    <p>{{word}}</p>
    <button v-on:click="sayHi">change model</button>
</div>

<script src="observer.js"></script>
<script src="watcher.js"></script>
<script src="compile.js"></script>
<script src="mvvm.js"></script>
<script>
var vm = new MVVM({
    el: '#mvvm-app',
    data: {
        word: 'Hello World!'
    },
    methods: {
        sayHi: function() {
            this.word = 'Hi, everybody!';
        }
    }
    });
</script>
```

输入框里敲字，下面的段落跟着变；点按钮改数据，输入框和段落一起变：

![输入框与文本双向同步的运行效果](https://github.com/honeydlp/mvvm/raw/master/defineProperty/img/1.gif)

## 一、几种实现双向绑定的做法

目前几种主流的 MVC(VM) 框架都实现了单向数据绑定，而所谓双向数据绑定，无非就是在单向绑定的基础上给可输入元素（`input`、`textarea` 等）添加了 `change`（`input`）事件，来动态修改 `model` 和 `view`，并没有多高深。所以无需太过介怀实现的是单向还是双向绑定。

三种主流做法是这样的：

- 发布者订阅者模式（`backbone.js`）
- 脏值检查（`angular.js`）
- 数据劫持（`vue.js`）

### 1.1 发布者订阅者模式

一般通过 `sub`、`pub` 的方式实现数据和视图的绑定监听，更新数据的做法通常是 `vm.set('property', value)`，[这里有篇文章讲得比较详细](http://www.html-js.com/article/Study-of-twoway-data-binding-JavaScript-talk-about-JavaScript-every-day)。

这种方式的问题在于用起来不自然。改一个数据得调方法，取一个数据得调 `get`，模型对象和普通 JavaScript 对象长得不一样，写着写着就忘了哪个是模型哪个是普通对象。我们更希望通过 `vm.property = value` 这种方式更新数据，同时自动更新视图，于是有了下面两种方式。

要说清楚的是，发布订阅这个模式本身并没有被淘汰。Vue 内部的 `Dep` 和 `Watcher` 用的就是这套思路，只是它不再暴露给使用者，而是藏进了 getter/setter 里面。被淘汰的是「让用户手动调 set」这种交互方式，不是模式本身。

### 1.2 脏值检查

`angular.js` 是通过脏值检测的方式比对数据是否有变更，来决定是否更新视图。最简单的方式是通过 `setInterval()` 定时轮询检测数据变动，当然 Google 不会这么做，Angular 只在指定的事件触发时进入脏值检测，大致有这几类：

- DOM 事件，譬如用户输入文本、点击按钮等（`ng-click`）
- XHR 响应事件（`$http`）
- 浏览器 Location 变更事件（`$location`）
- Timer 事件（`$timeout`、`$interval`）
- 执行 `$digest()` 或 `$apply()`

脏值检查的思路和数据劫持是反着来的。数据劫持是「数据变的那一刻我就知道」，脏值检查是「我不知道什么时候变，但在几个关键时机把所有值都跟上一次的快照比一遍」。

代价在于比对本身有成本。每次 `$digest` 要遍历所有 watcher，而且一轮比对里如果有 watcher 修改了别的数据，还得再来一轮，直到没有变化为止（Angular 里最多循环十次，超了就报错）。绑定项一多，一次交互跑几千次比对是常事。

好处也很明显：它不关心数据是怎么变的。用 `arr[0] = x` 改数组、用 `delete obj.a` 删属性、直接整个对象换掉，脏值检查一视同仁。而这几种情况恰恰是 `Object.defineProperty` 方案的软肋。

### 1.3 数据劫持

`vue.js` 采用的是数据劫持结合发布者订阅者模式，通过 `Object.defineProperty()` 来劫持各个属性的 `setter`、`getter`，在数据变动时发布消息给订阅者，触发相应的监听回调。

它的好处是精确。哪个属性变了就通知订阅了那个属性的人，不需要全量比对。代价是得在初始化时把整个 data 对象递归遍历一遍，把每个属性都改造成访问器属性，对象层级深、字段多的时候，这个初始化开销是实打实的。

先说结论，这三种做法解决的是同一个问题的不同侧面：怎么在数据变化和视图更新之间建立联系。发布订阅让用户手动报告，脏值检查靠定时比对，数据劫持靠改写属性描述符。Vue 选了第三种，代价换来的是最自然的书写体验。

## 二、实现思路

已经了解到 Vue 是通过数据劫持的方式来做数据绑定的，其中最核心的方法便是通过 `Object.defineProperty()` 来实现对属性的劫持，达到监听数据变动的目的。不熟悉 `defineProperty` 的话，[MDN 上这一页](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) 要先过一遍。

要实现 MVVM 的双向绑定，必须要实现以下几点：

- 实现一个数据监听器 `Observer`，能够对数据对象的所有属性进行监听，如有变动可拿到最新值并通知订阅者
- 实现一个指令解析器 `Compile`，对每个元素节点的指令进行扫描和解析，根据指令模板替换数据，以及绑定相应的更新函数
- 实现一个 `Watcher`，作为连接 `Observer` 和 `Compile` 的桥梁，能够订阅并收到每个属性变动的通知，执行指令绑定的相应回调函数，从而更新视图
- `mvvm` 入口函数，整合以上三者

上述流程如图所示：

![Observer、Compile、Watcher 三者的协作流程](https://github.com/honeydlp/mvvm/raw/master/defineProperty/img/2.png)

这个四模块的划分值得多想一层。为什么不把监听和更新写在一起？因为它们变化的原因不一样。数据的形态千变万化（对象、数组、嵌套），指令的种类也在不断增加（`v-text`、`v-html`、`v-model`、`v-on`），如果耦在一起，加一个指令要改数据层的代码，加一种数据类型要改指令层的代码。拆成两半，中间用 `Watcher` 这个只做转发的桥梁连起来，两边就能各自演进。

### 2.1 实现 Observer

我们知道可以利用 `Object.defineProperty()` 来监听属性变动。那么将需要 observe 的数据对象进行递归遍历，包括子属性对象的属性，都加上 `setter` 和 `getter`。这样的话，给这个对象的某个值赋值，就会触发 `setter`，也就能监听到数据变化了：

```javascript
var data = {name: 'kindeng'};
observe(data);
data.name = 'dmq'; // 监听到值变化了 kindeng --> dmq

function observe(data) {
    if (!data || typeof data !== 'object') {
        return;
    }
    // 取出所有属性遍历
    Object.keys(data).forEach(function(key) {
	    defineReactive(data, key, data[key]);
	});
};

function defineReactive(data, key, val) {
    observe(val); // 监听子属性
    Object.defineProperty(data, key, {
        enumerable: true, // 可枚举
        configurable: false, // 不能再 define
        get: function() {
            return val;
        },
        set: function(newVal) {
            console.log('监听到值变化了 ', val, ' --> ', newVal);
            val = newVal;
        }
    });
}
```

完整代码在 https://github.com/poetries/mvvm/blob/master/observer.js

这段代码里 `val` 这个参数是关键。它是 `defineReactive` 的形参，被 `get` 和 `set` 两个闭包共同引用，成了这个属性真正的值仓库。原来的属性已经被访问器属性覆盖掉了，如果 getter 里写 `return data[key]`，那就是再次触发自己的 getter，死循环爆栈。这是新手手写响应式时最常见的一个错误。

`configurable: false` 表示定义完之后不能再改这个属性的描述符，也不能删除它。真实的 Vue 源码里没有这么写，因为要留出后续处理的余地。自己练手的话知道有这回事就行。

有了监听能力，接下来是怎么通知订阅者。很简单，维护一个数组用来收集订阅者，数据变动时触发 `notify`，再调用订阅者的 `update` 方法：

```javascript
// ... 省略
function defineReactive(data, key, val) {
	var dep = new Dep();
    observe(val); // 监听子属性

    Object.defineProperty(data, key, {
        // ... 省略
        set: function(newVal) {
        	if (val === newVal) return;
            val = newVal;
            dep.notify(); // 通知所有订阅者
        }
    });
}

function Dep() {
    this.subs = [];
}
Dep.prototype = {
    addSub: function(sub) {
        this.subs.push(sub);
    },
    notify: function() {
        this.subs.forEach(function(sub) {
            sub.update();
        });
    }
};
```

`if (val === newVal) return;` 这一行别漏。赋一个和原来一样的值时直接返回，不触发通知，能省掉大量无意义的重渲染。

那么问题来了，谁是订阅者，怎么往订阅器里添加订阅者？

按前面的思路整理，订阅者应该是 `Watcher`。而 `var dep = new Dep();` 是在 `defineReactive` 方法内部定义的，想通过 `dep` 添加订阅者，就必须在闭包内操作。所以可以在 `getter` 里面动手脚：

```javascript
// Observer.js
// ...省略
Object.defineProperty(data, key, {
	get: function() {
		// 由于需要在闭包内添加 watcher，所以通过 Dep 定义一个全局 target 属性
		// 暂存 watcher，添加完移除
		Dep.target && dep.addSub(Dep.target);
		return val;
	}
    // ... 省略
});

// Watcher.js
Watcher.prototype = {
	get: function(key) {
		Dep.target = this;
		this.value = data[key];	// 这里会触发属性的 getter，从而添加订阅者
		Dep.target = null;
	}
}
```

原文这里 getter 里调的是 `dep.addDep(...)`，但 `Dep.prototype` 上定义的方法叫 `addSub`，两个名字对不上，直接跑会报「不是一个函数」。这里统一成了 `addSub`。

这套「全局 target 中转」的手法是整个响应式实现里最巧的一处。依赖收集要解决的问题是：`dep` 在 `Observer` 的闭包里，`watcher` 在另一个文件里，两者互相看不见。解法是在 `Dep` 这个构造函数上挂一个静态属性 `Dep.target` 当作临时的公共黑板，watcher 求值前把自己写上去，求值过程中会触发一个或多个属性的 getter，每个 getter 都从黑板上把它抄走，求值完擦掉黑板。

所以「读一次属性」这个动作，同时也是「建立一次依赖关系」的动作。这也解释了一个常被问到的现象：计算属性里如果某个分支没走到，那个分支里的属性就不会被收集为依赖，之后它变了也不会触发重算。因为它压根没被读到过。

这里已经实现了一个 `Observer`，具备了监听数据和通知订阅者的能力。接下来是 `Compile`。

### 2.2 实现 Compile

`Compile` 主要做的事情是解析模板指令，将模板中的变量替换成数据，然后初始化渲染页面视图，并将每个指令对应的节点绑定更新函数、添加监听数据的订阅者，一旦数据有变动就收到通知更新视图，如图所示：

![Compile 解析指令并绑定更新函数的流程](https://github.com/honeydlp/mvvm/raw/master/defineProperty/img/3.png)

因为遍历解析的过程有多次操作 DOM 节点，为提高性能和效率，会先将根节点 `el` 转换成文档碎片 `fragment` 进行解析编译操作，解析完成再将 `fragment` 添加回原来的真实 DOM 节点中：

```javascript
function Compile(el) {
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);
    if (this.$el) {
        this.$fragment = this.node2Fragment(this.$el);
        this.init();
        this.$el.appendChild(this.$fragment);
    }
}
Compile.prototype = {
	init: function() { this.compileElement(this.$fragment); },
    node2Fragment: function(el) {
        var fragment = document.createDocumentFragment(), child;
        // 将原生节点拷贝到 fragment
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }
        return fragment;
    }
};
```

`DocumentFragment` 这一步为什么值得单独做？因为它是一个游离在文档树之外的容器，往它里面增删改节点不会触发浏览器的重排重绘。解析模板要改几十上百次 DOM，如果直接在页面上的真实节点上操作，每一次都可能引发一轮布局计算。搬进 fragment 里改完，最后一次性 `appendChild` 回去，浏览器只需要重排一次。

`while (child = el.firstChild)` 这个循环也有个细节：`appendChild` 是「移动」不是「复制」，节点被添加到 fragment 的同时会从原位置移除，所以 `el.firstChild` 会自动指向下一个，循环到没有子节点为止自然结束。

`compileElement` 方法会遍历所有节点及其子节点，进行扫描解析编译，调用对应的指令渲染函数进行数据渲染，并调用对应的指令更新函数进行绑定：

```javascript
Compile.prototype = {
	// ... 省略
	compileElement: function(el) {
        var childNodes = el.childNodes, me = this;
        [].slice.call(childNodes).forEach(function(node) {
            var text = node.textContent;
            var reg = /\{\{(.*)\}\}/;	// 表达式文本
            // 按元素节点方式编译
            if (me.isElementNode(node)) {
                me.compile(node);
            } else if (me.isTextNode(node) && reg.test(text)) {
                me.compileText(node, RegExp.$1);
            }
            // 遍历编译子节点
            if (node.childNodes && node.childNodes.length) {
                me.compileElement(node);
            }
        });
    },

    compile: function(node) {
        var nodeAttrs = node.attributes, me = this;
        [].slice.call(nodeAttrs).forEach(function(attr) {
            // 规定：指令以 v-xxx 命名，如 v-text="content" 中指令为 v-text
            var attrName = attr.name;	// v-text
            if (me.isDirective(attrName)) {
                var exp = attr.value; // content
                var dir = attrName.substring(2);	// text
                if (me.isEventDirective(dir)) {
                	// 事件指令，如 v-on:click
                    compileUtil.eventHandler(node, me.$vm, exp, dir);
                } else {
                	// 普通指令
                    compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
                }
            }
        });
    }
};
```

指令的处理集合和更新函数分开放，加新指令时只要往这两个对象里各加一项：

```javascript
// 指令处理集合
var compileUtil = {
    text: function(node, vm, exp) {
        this.bind(node, vm, exp, 'text');
    },
    // ...省略
    bind: function(node, vm, exp, dir) {
        var updaterFn = updater[dir + 'Updater'];
        // 第一次初始化视图
        updaterFn && updaterFn(node, vm[exp]);
        // 实例化订阅者，此操作会在对应属性的消息订阅器中添加该订阅者 watcher
        new Watcher(vm, exp, function(value, oldValue) {
        	// 一旦属性值有变化，会收到通知执行此更新函数，更新视图
            updaterFn && updaterFn(node, value, oldValue);
        });
    }
};

// 更新函数
var updater = {
    textUpdater: function(node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    }
    // ...省略
};
```

完整代码在 https://github.com/poetries/mvvm/blob/master/compile.js

几个关键点串一下：

- 这里通过递归遍历保证了每个节点及子节点都会被解析编译到
- 指令的声明规定是通过特定前缀的节点属性来标记，比如 `v-text` 这个属性名里 `v-` 之后的部分就是指令名
- 监听数据、绑定更新函数的处理都在 `compileUtil.bind()` 这个方法中，通过 `new Watcher()` 添加回调来接收数据变化的通知

`bind` 里那两行的顺序很讲究：先调 `updaterFn` 做首次渲染，再 `new Watcher` 建立订阅。而 `new Watcher` 内部求值时会触发 getter，正好把自己登记进这个属性的 `dep` 里。整个依赖关系就是在这一刻建立的，不需要任何显式的注册代码。

至此一个简单的 `Compile` 就完成了。接下来看 `Watcher` 这个订阅者的具体实现。

### 2.3 实现 Watcher

`Watcher` 订阅者作为 `Observer` 和 `Compile` 之间通信的桥梁，主要做三件事：

- 在自身实例化时往属性订阅器 `dep` 里面添加自己
- 自身必须有一个 `update()` 方法
- 待属性变动 `dep.notify()` 通知时，能调用自身的 `update()` 方法，并触发 `Compile` 中绑定的回调

```javascript
function Watcher(vm, exp, cb) {
    this.cb = cb;
    this.vm = vm;
    this.exp = exp;
    // 此处为了触发属性的 getter，从而在 dep 添加自己，结合 Observer 更易理解
    this.value = this.get();
}
Watcher.prototype = {
    update: function() {
        this.run();	// 属性值变化收到通知
    },
    run: function() {
        var value = this.get(); // 取到最新值
        var oldVal = this.value;
        if (value !== oldVal) {
            this.value = value;
            this.cb.call(this.vm, value, oldVal); // 执行 Compile 中绑定的回调，更新视图
        }
    },
    get: function() {
        Dep.target = this;	        // 将当前订阅者指向自己
        var value = this.vm[this.exp];	// 触发 getter，添加自己到属性订阅器中
        Dep.target = null;	        // 添加完毕，重置
        return value;
    }
};
```

原文 `get` 方法里写的是 `this.vm[exp]`，`exp` 是个未定义的自由变量，非严格模式下会一路找到全局，拿到 `undefined` 或者直接报错，正确的是 `this.vm[this.exp]`，这里改过来了。

完整代码在 https://github.com/poetries/mvvm/blob/master/watcher.js

实例化 `Watcher` 的时候调用 `get()` 方法，通过 `Dep.target = watcherInstance` 标记订阅者是当前 watcher 实例，强行触发属性定义的 `getter` 方法。`getter` 执行的时候，就会在属性的订阅器 `dep` 里添加当前 watcher 实例，从而在属性值有变化的时候，这个 watcher 就能收到更新通知。

`run` 里的 `if (value !== oldVal)` 又是一道闸门。属性变了不代表最终值变了，比如两个不同的属性算出同一个结果，这一层比较能挡掉一次多余的 DOM 操作。不过这个比较是全等比较，对象和数组比的是引用，内部改了引用没变就挡不住，真实 Vue 里对这块有额外处理。

## 三、实现 MVVM 入口

`MVVM` 作为数据绑定的入口，整合 `Observer`、`Compile` 和 `Watcher` 三者。通过 `Observer` 来监听自己的 `model` 数据变化，通过 `Compile` 来解析编译模板指令，最终利用 `Watcher` 搭起两者之间的通信桥梁，达到「数据变化到视图更新」以及「视图交互变化（`input`）到数据变更」的双向绑定效果。

一个简单的 `MVVM` 构造器是这样的：

```javascript
function MVVM(options) {
    this.$options = options;
    var data = this._data = this.$options.data;
    observe(data, this);
    this.$compile = new Compile(options.el || document.body, this)
}
```

但这里有个问题。监听的数据对象是 `options.data`，每次更新视图都必须通过 `vm._data.name = 'dmq'` 这样的方式来改数据，显然不符合期望。我们希望的调用方式是 `vm.name = 'dmq'`。

所以需要给 `MVVM` 实例添加一个属性代理的方法，使访问 `vm` 的属性代理为访问 `vm._data` 的属性：

```javascript
function MVVM(options) {
    this.$options = options;
    var data = this._data = this.$options.data, me = this;
    // 属性代理，实现 vm.xxx -> vm._data.xxx
    Object.keys(data).forEach(function(key) {
        me._proxy(key);
    });
    observe(data, this);
    this.$compile = new Compile(options.el || document.body, this)
}

MVVM.prototype = {
	_proxy: function(key) {
		var me = this;
        Object.defineProperty(me, key, {
            configurable: false,
            enumerable: true,
            get: function proxyGetter() {
                return me._data[key];
            },
            set: function proxySetter(newVal) {
                me._data[key] = newVal;
            }
        });
	}
}
```

完整代码在 https://github.com/poetries/mvvm/blob/master/mvvm.js

这里主要还是利用了 `Object.defineProperty()` 这个方法，劫持了 `vm` 实例对象上属性的读写权，使读写 `vm` 实例的属性转成读写 `vm._data` 的属性值。

同一个 API 在这套实现里被用了两次，用途完全不同，值得对照着看：在 `Observer` 里它用来「感知变化并广播」，在 `MVVM` 里它只是「把读写转发到另一个对象上」，不做任何通知。前者是响应式的核心，后者纯粹是为了书写体验。

真实的 Vue 也是这么干的，你写 `this.message` 能取到值，就是因为 Vue 在 `initState` 阶段把 `_data` 上的属性代理到了实例上。同理还有 `props`、`methods`、`computed`，全都被挂到了实例这一层。这也解释了为什么 data、props、methods 之间不能重名，它们最终要挤在同一个对象上。

## 四、这套实现和真实 Vue 还差什么

上面四个模块跑通之后，双向绑定的骨架就有了。但和真实的 Vue 2 比，还差好几层，这几层恰恰是工程实现和玩具实现的分水岭。

差的第一层是异步批量更新。上面的实现里，`dep.notify()` 一触发就同步更新 DOM，一次操作改了五个属性就更新五次。Vue 2 的做法是把 watcher 推进一个队列，去重之后在微任务里统一执行，一轮 tick 内改多少次都只渲染一次。`$nextTick` 这个 API 就是从这套机制里长出来的。

差的第二层是虚拟 DOM。上面的 `updater` 是直接改 `node.textContent`，一个指令对应一个 DOM 节点。Vue 2 中间隔了一层虚拟节点树，先算出新树，跟旧树 diff，再把差异 patch 到真实 DOM 上。这一层带来的好处是组件粒度的更新和跨平台渲染的可能。

差的第三层是数组的处理。`Object.defineProperty` 只能劫持属性的读写，`arr.push(1)` 这种操作不经过任何 setter，改不了也拦不住。Vue 2 的解法是重写数组原型上的七个变更方法（`push`、`pop`、`shift`、`unshift`、`splice`、`sort`、`reverse`），在里面手动触发通知。所以 Vue 2 里 `arr[0] = x` 和 `arr.length = 0` 都是不响应的，得用 `Vue.set` 或者 `splice`。

同样的短板还有新增和删除属性。`Object.defineProperty` 是「一个一个属性去劫持」，实例创建之后新加的属性没被劫持过，自然不响应，这就是 `Vue.set` 存在的理由。

Vue 3 换成 `Proxy` 之后，这几个短板一起补上了。`Proxy` 代理的是整个对象而不是单个属性，新增属性、删除属性、数组下标赋值、修改 `length`，全都能拦到，`Vue.set` 这个 API 也就没有存在的必要了。另外它是懒代理，只有真正访问到某个嵌套对象时才递归代理下去，初始化开销比 Vue 2 那种一上来就全量递归小得多。

代价是 `Proxy` 没法被 ES5 环境 polyfill，Vue 3 直接放弃了 IE 11。这个取舍在 2020 年之后基本没人有异议了。

要补一句的是，把这套原理理解透之后，写业务时的收益是很具体的：知道为什么给对象加新字段页面不更新，知道为什么 `arr[0]=x` 不生效，知道为什么在 `updated` 里改数据会死循环，知道为什么计算属性没走到的分支不会被收集。这些都不是需要背的规则，是从一条链路上推出来的结果。

## 总结

回到开头那个问题：Vue 的双向绑定是怎么实现的？完整的回答应该是四段。

`Object.defineProperty` 把 data 上的每个属性改造成访问器属性，setter 里广播变化，getter 里收集依赖。这是数据侧。

`Compile` 把模板扫一遍，每遇到一个指令就创建一个 watcher，watcher 创建时求一次值，正好触发 getter 把自己登记进对应属性的 dep 里。这是视图侧。

`Watcher` 是桥。它一头连着 dep（被通知），一头连着 compile 传进来的回调（去更新）。两侧谁都不认识谁，只认识这座桥。

`v-model` 那条反向的路最简单，就是在更新函数里多绑一个 `input` 事件监听，用户输入时把值写回 data。所谓双向，就是单向绑定正反各接了一遍。

三种流派的对照也值得记一句：发布订阅要用户手动报告变化，脏值检查在关键时机全量比对，数据劫持在赋值那一刻精确捕获。Vue 选第三种，用初始化时的一次全量递归，换来了运行时的精确通知和最自然的书写体验。Vue 3 把底层的 `Object.defineProperty` 换成 `Proxy`，思路没变，只是把「一个一个属性劫持」升级成了「整个对象代理」，顺手补掉了数组和新增属性这两个老短板。

## 参考

- [MDN - Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
- [MDN - Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [MDN - DocumentFragment](https://developer.mozilla.org/zh-CN/docs/Web/API/DocumentFragment)
- [Vue 3 官方文档 - 深入响应式系统](https://cn.vuejs.org/guide/extras/reactivity-in-depth.html)
- [Vue 源码仓库](https://github.com/vuejs/vue)
- [前端进阶之旅](https://interview.poetries.top)
