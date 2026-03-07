---
title: 实现数据的双向绑定mvvm-剖析Vue的原理
date: 2018-02-25 17:12:32
tags: MVVM
categories: Front-End
---

> 完成的效果

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

![](https://github.com/honeydlp/mvvm/raw/master/defineProperty/img/1.gif)

## 一、几种实现双向绑定的做法

> 目前几种主流的`mvc(vm)`框架都实现了单向数据绑定，而我所理解的双向数据绑定无非就是在单向绑定的基础上给可输入元素（`input`、`textare`等）添加了`change(input)`事件，来动态修改`model`和 `view`，并没有多高深。所以无需太过介怀是实现的单向或双向绑定。

- 发布者-订阅者模式（`backbone.js`）
- 脏值检查（`angular.js`） 
- 数据劫持（`vue.js`） 

### 1.1 发布者-订阅者模式

- 一般通过`sub`, `pub`的方式实现数据和视图的绑定监听，更新数据方式通常做法是 `vm.set('property', value)`，[这里有篇文章讲的比较详细](http://www.html-js.com/article/Study-of-twoway-data-binding-JavaScript-talk-about-JavaScript-every-day)
- 这种方式现在毕竟太low了，我们更希望通过 `vm.property = value `这种方式更新数据，同时自动更新视图，于是有了下面两种方式

### 1.2 脏值检查

> `angular.js` 是通过脏值检测的方式比对数据是否有变更，来决定是否更新视图，最简单的方式就是通过 `setInterval()` 定时轮询检测数据变动，当然Google不会这么low，angular只有在指定的事件触发时进入脏值检测，大致如下：

- `DOM`事件，譬如用户输入文本，点击按钮等。( `ng-click` ) 
- `XHR`响应事件 ( `$http` ) 
- 浏览器`Location`变更事件 ( `$location` ) 
- `Timer`事件( `$timeout` , `$interval` ) 
- 执行 `$digest()` 或 `$apply()`

### 1.3 数据劫持 

- `vue.js`则是采用数据劫持结合发布者-订阅者模式的方式，通过`Object.defineProperty()`来劫持各个属性的`setter`，`getter`，在数据变动时发布消息给订阅者，触发相应的监听回调。

## 二、实现思路

> 已经了解到`vue`是通过数据劫持的方式来做数据绑定的，其中最核心的方法便是通过`Object.defineProperty()`来实现对属性的劫持，达到监听数据变动的目的，无疑这个方法是本文中最重要、最基础的内容之一，如果不熟悉`defineProperty`，猛戳[这里](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)

**要实现mvvm的双向绑定，就必须要实现以下几点**

- 实现一个数据监听器`Observer`，能够对数据对象的所有属性进行监听，如有变动可拿到最新值并通知订阅者
- 实现一个指令解析器`Compile`，对每个元素节点的指令进行扫描和解析，根据指令模板替换数据，以及绑定相应的更新函数
- 实现一个`Watcher`，作为连接`Observer`和`Compile`的桥梁，能够订阅并收到每个属性变动的通知，执行指令绑定的相应回调函数，从而更新视图
- `mvvm`入口函数，整合以上三者

上述流程如图所示：

![](https://github.com/honeydlp/mvvm/raw/master/defineProperty/img/2.png)

### 2.1 实现Observer

- 我们知道可以利用`Obeject.defineProperty()`来监听属性变动
- 那么将需要`observe`的数据对象进行递归遍历，包括子属性对象的属性，都加上`setter`和`getter`
- 这样的话，给这个对象的某个值赋值，就会触发`setter`，那么就能监听到了数据变化。相关代码可以是这样

```javascript
var data = {name: 'kindeng'};
observe(data);
data.name = 'dmq'; // 哈哈哈，监听到值变化了 kindeng --> dmq

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
        configurable: false, // 不能再define
        get: function() {
            return val;
        },
        set: function(newVal) {
            console.log('哈哈哈，监听到值变化了 ', val, ' --> ', newVal);
            val = newVal;
        }
    });
}
```

- 完整代码 https://github.com/poetries/mvvm/blob/master/observer.js

> 这样我们已经可以监听每个数据的变化了，那么监听到变化之后就是怎么通知订阅者了，所以接下来我们需要实现一个消息订阅器，很简单，维护一个数组，用来收集订阅者，数据变动触发`notify`，再调用订阅者的`update`方法，代码改善之后是这样

```javascript
// ... 省略
function defineReactive(data, key, val) {
	var dep = new Dep();
    observe(val); // 监听子属性

    Object.defineProperty(data, key, {
        // ... 省略
        set: function(newVal) {
        	if (val === newVal) return;
            console.log('哈哈哈，监听到值变化了 ', val, ' --> ', newVal);
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

- 那么问题来了，谁是订阅者，怎么往订阅器添加订阅者？
- 没错，上面的思路整理中我们已经明确订阅者应该是`Watcher`, 而且`var dep = new Dep();`是在 `defineReactive`方法内部定义的，所以想通过`dep`添加订阅者，就必须要在闭包内操作，所以我们可以在`getter`里面动手脚：

```javascript
// Observer.js
// ...省略
Object.defineProperty(data, key, {
	get: function() {
		// 由于需要在闭包内添加watcher，所以通过Dep定义一个全局target属性，暂存watcher, 添加完移除
		Dep.target && dep.addDep(Dep.target);
		return val;
	}
    // ... 省略
});

// Watcher.js
Watcher.prototype = {
	get: function(key) {
		Dep.target = this;
		this.value = data[key];	// 这里会触发属性的getter，从而添加订阅者
		Dep.target = null;
	}
}
```

- 这里已经实现了一个`Observer`了，已经具备了监听数据和数据变化通知订阅者的功能。那么接下来就是实现`Compile`了


### 2.2 实现`Compile`

- `compile`主要做的事情是解析模板指令，将模板中的变量替换成数据，然后初始化渲染页面视图
- 并将每个指令对应的节点绑定更新函数，添加监听数据的订阅者，一旦数据有变动，收到通知，更新视图，如图所示

![](https://github.com/honeydlp/mvvm/raw/master/defineProperty/img/3.png)

- 因为遍历解析的过程有多次操作`dom`节点，为提高性能和效率，会先将跟节点`el`转换成文档碎片`fragment`进行解析编译操作
- 解析完成，再将`fragment`添加回原来的真实`dom`节点中

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
        // 将原生节点拷贝到fragment
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }
        return fragment;
    }
};
```

- `compileElement`方法将遍历所有节点及其子节点，进行扫描解析编译，调用对应的指令渲染函数进行数据渲染，并调用对应的指令更新函数进行绑定，详看代码及注释说明

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
            // 规定：指令以 v-xxx 命名
            // 如 <span v-text="content"></span> 中指令为 v-text
            var attrName = attr.name;	// v-text
            if (me.isDirective(attrName)) {
                var exp = attr.value; // content
                var dir = attrName.substring(2);	// text
                if (me.isEventDirective(dir)) {
                	// 事件指令, 如 v-on:click
                    compileUtil.eventHandler(node, me.$vm, exp, dir);
                } else {
                	// 普通指令
                    compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
                }
            }
        });
    }
};

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
        // 实例化订阅者，此操作会在对应的属性消息订阅器中添加了该订阅者watcher
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


> 完整代码 https://github.com/poetries/mvvm/blob/master/compile.js

- 这里通过递归遍历保证了每个节点及子节点都会解析编译到
- 指令的声明规定是通过特定前缀的节点属性来标记，如`<span v-text="content"`中`v-text`便是指令
- 监听数据、绑定更新函数的处理是在`compileUtil.bind()`这个方法中，通过`new Watcher()`添加回调来接收数据变化的通知
- 至此，一个简单的`Compile`就完成了。接下来要看看`Watcher`这个订阅者的具体实现了

### 2.3 实现Watcher

> `Watcher`订阅者作为`Observer`和`Compile`之间通信的桥梁，主要做的事情是

- 在自身实例化时往属性订阅器`dep`里面添加自己
- 自身必须有一个`update()`方法
- 待属性变动`dep.notice()`通知时，能调用自身的`update()`方法，并触发`Compile`中绑定的回调，则功成身退。


```javascript
function Watcher(vm, exp, cb) {
    this.cb = cb;
    this.vm = vm;
    this.exp = exp;
    // 此处为了触发属性的getter，从而在dep添加自己，结合Observer更易理解
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
            this.cb.call(this.vm, value, oldVal); // 执行Compile中绑定的回调，更新视图
        }
    },
    get: function() {
        Dep.target = this;	// 将当前订阅者指向自己
        var value = this.vm[exp];	// 触发getter，添加自己到属性订阅器中
        Dep.target = null;	// 添加完毕，重置
        return value;
    }
};
// 这里再次列出Observer和Dep，方便理解
Object.defineProperty(data, key, {
	get: function() {
		// 由于需要在闭包内添加watcher，所以可以在Dep定义一个全局target属性，暂存watcher, 添加完移除
		Dep.target && dep.addDep(Dep.target);
		return val;
	}
    // ... 省略
});
Dep.prototype = {
    notify: function() {
        this.subs.forEach(function(sub) {
            sub.update(); // 调用订阅者的update方法，通知变化
        });
    }
};
```

> 完整代码 https://github.com/poetries/mvvm/blob/master/watcher.js

- 实例化`Watcher`的时候，调用`get()`方法，通过`Dep.target = watcherInstance`标记订阅者是当前`watcher`实例，强行触发属性定义的`getter`方法，`getter`方法执行的时候，就会在属性的订阅器`dep`添加当前`watcher`实例，从而在属性值有变化的时候，`watcherInstance`就能收到更新通知。
- 基本上`vue`中数据绑定相关比较核心的几个模块也是这几个，猛戳[这里](https://github.com/vuejs/vue) , 在`src` 目录可找到`vue`源码。

> 最后来讲讲`MVVM`入口文件的相关逻辑和实现吧，相对就比较简单了

## 三、实现MVVM

> `MVVM`作为数据绑定的入口，整合`Observer`、`Compile`和`Watcher`三者，通过`Observer`来监听自己的`model`数据变化，通过`Compile`来解析编译模板指令，最终利用`Watcher`搭起`Observer`和`Compile`之间的通信桥梁，达到数据变化 -> 视图更新；视图交互变化(`input`) -> 数据`model`变更的双向绑定效果。

- 一个简单的`MVVM`构造器是这样子：

```javascript
function MVVM(options) {
    this.$options = options;
    var data = this._data = this.$options.data;
    observe(data, this);
    this.$compile = new Compile(options.el || document.body, this)
}
```

- 但是这里有个问题，从代码中可看出监听的数据对象是`options.data`，每次需要更新视图，则必须通过`var vm = new MVVM({data:{name: 'kindeng'}}); vm._data.name = 'dmq'; `这样的方式来改变数据。
- 显然不符合我们一开始的期望，我们所期望的调用方式应该是这样的：
`var vm = new MVVM({data: {name: 'kindeng'}}); vm.name = 'dmq';`
- 所以这里需要给`MVVM`实例添加一个属性代理的方法，使访问`vm`的属性代理为访问`vm._data`的属性，改造后的代码如下：

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

完整代码 https://github.com/poetries/mvvm/blob/master/mvvm.js

- 这里主要还是利用了`Object.defineProperty()`这个方法来劫持了`vm`实例对象的属性的读写权，使读写`vm`实例的属性转成读写了`vm._data`的属性值，达到鱼目混珠的效果

