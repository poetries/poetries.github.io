---
title: ES6系列之Proxy的拦截机制与实战场景
description: Proxy 的 13 个 trap 分别拦截什么操作，如何用它实现真正的私有变量、抽离校验逻辑、记录访问日志和撤销授权，以及它相比 Object.defineProperty 强在哪里。
date: 2018-12-21 10:00:24
tags:
  - ES6
  - Javascript
  - Proxy
  - 元编程
categories: Front-End
---

Vue 2 到 Vue 3 最大的一次底层重写，就是把响应式系统从 `Object.defineProperty` 换成了 `Proxy`。这次替换解决的问题非常具体：Vue 2 里给对象新增属性不会触发更新，得靠 `$set`；数组直接改下标也不生效，得靠重写七个数组方法。这些补丁的根源都在于 `defineProperty` 只能劫持已经存在的属性，它拦的是「某个 key 的读写」，而不是「这个对象上的所有操作」。

Proxy 换了个思路。它不改动目标对象本身，而是在外面套一层壳，所有进出的操作都要先过这层壳。这篇把 13 个 trap 的分工列清楚，然后用六个实际场景展示它能干什么，最后聊聊它和 `defineProperty` 的取舍。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Proxy 的基本结构，target 和 handler 各管什么
- 13 个 trap 分别在什么操作时被触发
- 用 Proxy 实现真正的私有变量（两种拦截思路）
- 把校验逻辑从业务类里抽离出来
- 访问日志、废弃预警、请求去重三个中间件式的用法
- `Proxy.revocable` 撤销代理，以及它适合的场景
- Proxy 相比 `Object.defineProperty` 的优势和代价

## 一、Proxy 概述

先看看它的兼容性，这张图是 2018 年前后的情况。

![Proxy 在各浏览器中的兼容性支持情况](https://s.poetries.top/gitee/2019/10/55.png)

图里能看到 IE 全线飘红，这也是 Vue 3 直接放弃 IE11 的原因之一。Proxy 的行为**无法被 polyfill**，因为它拦截的是语言层面的基础操作，用 JS 自己实现不出来。这一点和大多数新特性不一样，别的都能靠转译或垫片兼容，Proxy 只能靠运行时原生支持。

`proxy` 在目标对象的外层搭建了一层拦截，外界对目标对象的某些操作，必须通过这层拦截。

```js
var proxy = new Proxy(target, handler);
```

`new Proxy()` 表示生成一个 `Proxy` 实例，`target` 参数表示所要拦截的目标对象，`handler` 参数也是一个对象，用来定制拦截行为。

```js
var target = {
   name: 'poetries'
 };
 var logHandler = {
   get: function(target, key) {
     console.log(`${key} 被读取`);
     return target[key];
   },
   set: function(target, key, value) {
     console.log(`${key} 被设置为 ${value}`);
     target[key] = value;
     return true;
   }
 }
 var targetWithLog = new Proxy(target, logHandler);

 targetWithLog.name; // 控制台输出：name 被读取
 targetWithLog.name = 'others'; // 控制台输出：name 被设置为 others

 console.log(target.name); // 控制台输出: others
```

读取 `targetWithLog` 的属性值时，实际上执行的是 `logHandler.get`，在控制台输出信息，并且读取被代理对象 `target` 的属性。设置属性值时执行的是 `logHandler.set`，输出信息之后再去设置 `target` 上的值。

原文的 `set` 里没有 `return true`，我补上了。这不是可有可无的细节：严格模式下 `set` trap 返回假值会抛 `TypeError: 'set' on proxy: trap returned falsish`。ES 模块默认就是严格模式，所以这个坑现在几乎必踩。

最后一行 `console.log(target.name)` 输出 `others`，说明改动落到了原对象上。**代理不是复制，target 和 proxy 操作的是同一份数据。**

拦截函数可以完全不理会 target：

```js
// 由于拦截函数总是返回 35，所以访问任何属性都得到 35
var proxy = new Proxy({}, {
  get: function(target, property) {
    return 35;
  }
});

proxy.time // 35
proxy.name // 35
proxy.title // 35
```

`Proxy` 实例也可以作为其他对象的原型对象：

```js
var proxy = new Proxy({}, {
  get: function(target, property) {
    return 35;
  }
});

let obj = Object.create(proxy);
obj.time // 35
```

`proxy` 对象是 `obj` 对象的原型，`obj` 对象本身并没有 `time` 属性，所以根据原型链会在 `proxy` 对象上读取该属性，导致被拦截。

这里有个很容易踩的边界：**必须通过 proxy 访问才会触发拦截**。上面那个例子里如果你直接 `target.time`，什么都不会发生。所以用 Proxy 做响应式的时候，一定要保证外部拿到的是 proxy 而不是原对象，一旦某个地方漏出了 target 的引用，那条路径上的改动就全部丢失了。

对于代理模式，`Proxy` 的作用主要体现在三个方面：

- 拦截和监视外部对对象的访问
- 降低函数或类的复杂度
- 在复杂操作前对操作进行校验，或者对所需资源进行管理

## 二、Proxy 所能代理的范围

`handler` 本身是 `ES6` 新设计的一个对象，作用是自定义代理对象的各种可代理操作。它一共有 13 种方法，每种方法都可以代理一种操作。

原文这里写的是「13 中方法」，是个错别字，应为「13 种」。另外原文的 `andler.defineProperty()` 少了个 `h`，一起改了。

```js
// 在读取代理对象的原型时触发，比如执行 Object.getPrototypeOf(proxy) 时
handler.getPrototypeOf()

// 在设置代理对象的原型时触发，比如执行 Object.setPrototypeOf(proxy, null) 时
handler.setPrototypeOf()

// 在判断一个代理对象是否可扩展时触发，比如执行 Object.isExtensible(proxy) 时
handler.isExtensible()

// 在让一个代理对象不可扩展时触发，比如执行 Object.preventExtensions(proxy) 时
handler.preventExtensions()

// 在获取代理对象某个属性的属性描述时触发，比如执行 Object.getOwnPropertyDescriptor(proxy, "foo") 时
handler.getOwnPropertyDescriptor()

// 在定义代理对象某个属性的属性描述时触发，比如执行 Object.defineProperty(proxy, "foo", {}) 时
handler.defineProperty()

// 在判断代理对象是否拥有某个属性时触发，比如执行 "foo" in proxy 时
handler.has()

// 在读取代理对象的某个属性时触发，比如执行 proxy.foo 时
handler.get()

// 在给代理对象的某个属性赋值时触发，比如执行 proxy.foo = 1 时
handler.set()

// 在删除代理对象的某个属性时触发，比如执行 delete proxy.foo 时
handler.deleteProperty()

// 在获取代理对象的所有属性键时触发，比如执行 Object.getOwnPropertyNames(proxy) 时
handler.ownKeys()

// 在调用一个目标对象为函数的代理对象时触发，比如执行 proxy() 时
handler.apply()

// 在给一个目标对象为构造函数的代理对象构造实例时触发，比如执行 new proxy() 时
handler.construct()
```

十三个看着多，实际按用途分成四组就好记了。

日常最常用的是**属性读写组**：`get`、`set`、`has`、`deleteProperty`、`ownKeys`。响应式框架、私有变量、访问控制基本都在这五个里打转。

其次是**描述符组**：`defineProperty`、`getOwnPropertyDescriptor`。它们负责属性元信息，多数时候你不主动写它们，但 `set` 内部可能会间接触发（Reflect 那篇会展开）。

再往下是**扩展性组**：`isExtensible`、`preventExtensions`、`getPrototypeOf`、`setPrototypeOf`，属于比较冷门的语言机制。

最后是**函数组**：`apply` 和 `construct`，只有在被代理对象本身是函数或类的时候才会用上，做函数埋点、参数校验、单例工厂都靠它们。

有个约束要记住：trap 不能想返什么就返什么。比如 target 上有一个 `configurable: false, writable: false` 的属性，`get` trap 就必须返回和原值相同的东西，否则引擎直接抛 `TypeError`。这些叫不变量（invariants），是标准为了保证语言基本假设不被破坏定的规矩，写复杂 handler 时被它拦住是很常见的事。

## 三、Proxy 的六个实战场景

### 3.1 实现私有变量

约定用下划线开头表示私有，这个惯例大家都懂，但它没有任何强制力。

```js
var target = {
   name: 'poetries',
   _age: 22
}

var logHandler = {
  get: function(target, key){
    if(key.startsWith('_')){
      console.log('私有变量不能被访问')
      return undefined
    }
    return target[key];
  },
  set: function(target, key, value) {
     if(key.startsWith('_')){
      console.log('私有变量不能被修改')
      return false
    }
     target[key] = value;
     return true
   }
}
var targetWithLog = new Proxy(target, logHandler);

// 正常返回 'poetries'
targetWithLog.name;

// 打印「私有变量不能被访问」
targetWithLog._age;

// 打印「私有变量不能被修改」
targetWithLog._age = 30;
```

原文这段的示例有点乱：注释写着「私有变量 age 不能被访问」，但访问的是 `name`，实际根本不会触发那个分支。上面改成访问 `_age` 才对得上注释，同时把 `get` 里的 `return false` 改成了 `return undefined`（读一个禁止访问的属性返回 `false` 语义很怪），并给 `set` 的成功分支补上 `return true`。

再看一个更贴近真实的例子。下面的代码声明了一个私有的 `apiKey`，便于 `api` 这个对象内部的方法调用，但不希望从外部也能够访问 `api._apiKey`：

```js
var api = {
    _apiKey: '123abc456def',
    /* mock methods that use this._apiKey */
    getUsers: function(){},
    getUser: function(userId){},
    setUser: function(userId, config){}
};

// logs '123abc456def';
console.log("An apiKey we want to keep private", api._apiKey);

// get and mutate _apiKeys as desired
var apiKey = api._apiKey;
api._apiKey = '987654321';
```

约定俗成是没有束缚力的。使用 `ES6 Proxy` 我们就可以实现真实的私有变量了。第一种方法是使用 `set / get` 拦截读写请求并抛错：

```js
let api = {
    _apiKey: '123abc456def',
    getUsers: function(){ },
    getUser: function(userId){ },
    setUser: function(userId, config){ }
};

const RESTRICTED = ['_apiKey'];
api = new Proxy(api, {
    get(target, key, proxy) {
        if(RESTRICTED.indexOf(key) > -1) {
            throw Error(`${key} is restricted. Please see api documentation for further info.`);
        }
        return Reflect.get(target, key, proxy);
    },
    set(target, key, value, proxy) {
        if(RESTRICTED.indexOf(key) > -1) {
            throw Error(`${key} is restricted. Please see api documentation for further info.`);
        }
        return Reflect.set(target, key, value, proxy);
    }
});

// 以下操作都会抛出错误
console.log(api._apiKey);
api._apiKey = '987654321';
```

原文的 `set` 里写的是 `return Reflect.get(target, key, value, proxy)`，用了 `get` 而不是 `set`，参数个数也对不上，这是个真实的 bug，上面已经改成 `Reflect.set`。

这里顺便说一下为什么 handler 里到处是 `Reflect`。`Reflect.get(target, key, proxy)` 和 `target[key]` 在简单场景下结果一样，但涉及 getter 里的 `this` 指向、原型链继承的时候就不一样了，而且 `Reflect` 的每个方法都和 trap 一一对应，返回值也刚好符合 trap 的要求。这套配合关系我单独写在 [ES6系列之 Reflect 的设计意图与 API 全览](https://feinterview.poetries.top/blog/es6-reflect) 里。

第二种方法是使用 `has` 拦截 `in` 操作：

```js
var api = {
    _apiKey: '123abc456def',
    getUsers: function(){ },
    getUser: function(userId){ },
    setUser: function(userId, config){ }
};

const RESTRICTED = ['_apiKey'];
api = new Proxy(api, {
    has(target, key) {
        return (RESTRICTED.indexOf(key) > -1) ?
            false :
            Reflect.has(target, key);
    }
});

// these log false, and `for in` iterators will ignore _apiKey
console.log("_apiKey" in api);

for (var key in api) {
    if (api.hasOwnProperty(key) && key === "_apiKey") {
        console.log("This will never be logged because the proxy obscures _apiKey...")
    }
}
```

两种思路的区别在于**藏的层次**。`get/set` 是拦住读写但存在性还在，`in` 依然返回 true；`has` 是让它在存在性检查里消失，但直接 `api._apiKey` 还是能读到。真要藏严实，两个 trap 加上 `ownKeys` 和 `deleteProperty` 一起写才完整。

不过说句实在话，2018 年之后这套写法的必要性降低了很多。类的 `#privateField` 是语法层面的私有，编译期就能查出越界访问，比 Proxy 干净得多。Proxy 版私有变量现在更适合的场景是「你没法改目标对象的定义，只能在外面套一层」，比如包装第三方库返回的对象。

### 3.2 抽离校验模块

先从一个简单的类型校验开始，这个示例演示了如何使用 `Proxy` 保障数据类型的准确性：

```js
let numericDataStore = {
    count: 0,
    amount: 1234,
    total: 14
};

numericDataStore = new Proxy(numericDataStore, {
    set(target, key, value, proxy) {
        if (typeof value !== 'number') {
            throw Error("Properties in numericDataStore can only be numbers");
        }
        return Reflect.set(target, key, value, proxy);
    }
});

// 抛出错误，因为 "foo" 不是数值
numericDataStore.count = "foo";

// 赋值成功
numericDataStore.count = 333;
```

如果要直接为对象的所有属性开发一个校验器，代码结构很快就会变得臃肿。使用 `Proxy` 则可以将校验器从核心逻辑分离出来自成一体：

```js
function createValidator(target, validator) {
    return new Proxy(target, {
        _validator: validator,
        set(target, key, value, proxy) {
            if (Object.prototype.hasOwnProperty.call(target, key)) {
                let validator = this._validator[key];
                if (validator(value)) {
                    return Reflect.set(target, key, value, proxy);
                } else {
                    throw Error(`Cannot set ${key} to ${value}. Invalid.`);
                }
            } else {
                throw Error(`${key} is not a valid property`)
            }
        }
    });
}

const personValidators = {
    name(val) {
        return typeof val === 'string';
    },
    age(val) {
        return typeof val === 'number' && val > 18;
    }
}
class Person {
    constructor(name, age) {
        this.name = name;
        this.age = age;
        return createValidator(this, personValidators);
    }
}

const bill = new Person('Bill', 25);

// 以下操作都会报错
bill.name = 0;
bill.age = 'Bill';
bill.age = 15;
```

原文的 `personValidators.age` 里写的是 `typeof age === 'number' && age > 18`，用了外层不存在的 `age` 而不是形参 `val`，运行时直接 `ReferenceError`。这是个必修的 bug，上面已经改成 `val`。同时把 `!!validator(value)` 简化成 `validator(value)`（`if` 本来就做真值判断，双感叹号是多余的），把 `target.hasOwnProperty(key)` 换成了 `Object.prototype.hasOwnProperty.call`，避免 target 恰好有个同名属性时翻车。

`handler` 对象上挂 `_validator` 这个写法值得说一句。trap 是被当作 handler 的方法调用的，所以里面的 `this` 指向 handler 本身，`this._validator` 能取到。这个技巧可行但有点隐晦，我更倾向直接用闭包里的 `validator` 参数，可读性好很多。

通过校验器和主逻辑的分离，你可以无限扩展 `personValidators` 的内容，而不会对相关的类或函数造成直接破坏。构造函数里 `return` 一个 proxy 是这里的关键一招，`new Person()` 拿到的其实是代理对象，外部感知不到差别。

更复杂一点，我们还可以使用 `Proxy` 模拟类型检查，检查函数是否接收了类型和数量都正确的参数：

```js
let obj = {
    pickyMethodOne: function(obj, str, num) { /* ... */ },
    pickyMethodTwo: function(num, obj) { /*... */ }
};

const argTypes = {
    pickyMethodOne: ["object", "string", "number"],
    pickyMethodTwo: ["number", "object"]
};

obj = new Proxy(obj, {
    get: function(target, key, proxy) {
        var value = target[key];
        return function(...args) {
            argChecker(key, args, argTypes[key]);
            return Reflect.apply(value, target, args);
        };
    }
});

function argChecker(name, args, checkers) {
    for (var idx = 0; idx < checkers.length; idx++) {
        var arg = args[idx];
        var type = checkers[idx];
        if (!arg || typeof arg !== type) {
            console.warn(`You are incorrectly implementing the signature of ${name}. Check param ${idx + 1}`);
        }
    }
}

obj.pickyMethodOne();
// > You are incorrectly implementing the signature of pickyMethodOne. Check param 1
// > You are incorrectly implementing the signature of pickyMethodOne. Check param 2
// > You are incorrectly implementing the signature of pickyMethodOne. Check param 3

obj.pickyMethodTwo("wopdopadoo", {});
// > You are incorrectly implementing the signature of pickyMethodTwo. Check param 1

// No warnings logged
obj.pickyMethodOne({}, "a little string", 123);
obj.pickyMethodOne(123, {});
```

原文的 `argChecker` 循环条件是 `idx < args.length`，但注释里写着「不传参数会报三条警告」。不传参 `args.length` 是 0，循环一次都不进，一条警告都不会有。要对上注释，循环应该按 `checkers.length` 走，上面改过来了。另外原文里 `var checkArgs = argChecker(...)` 接了个从不使用的返回值，一并去掉了。

这类参数检查现在基本被 TypeScript 接管了，编译期就报错，比运行时打 warning 有用得多。但在纯 JS 的库里给使用者一个友好提示，这套写法还是有价值的。

### 3.3 访问日志

对于那些调用频繁、运行缓慢或占用执行环境资源较多的属性或接口，开发者会希望记录它们的使用情况或性能表现。这时可以使用 `Proxy` 充当中间件的角色，实现日志功能：

```js
let api = {
    _apiKey: '123abc456def',
    getUsers: function() { /* ... */ },
    getUser: function(userId) { /* ... */ },
    setUser: function(userId, config) { /* ... */ }
};

function logMethodAsync(timestamp, method) {
    setTimeout(function() {
        console.log(`${timestamp} - Logging ${method} request asynchronously.`);
    }, 0)
}

api = new Proxy(api, {
    get: function(target, key, proxy) {
        var value = target[key];
        return function(...args) {
            logMethodAsync(new Date(), key);
            return Reflect.apply(value, target, args);
        };
    }
});

api.getUsers();
```

`logMethodAsync` 用 `setTimeout` 把日志推到下一轮任务队列，这一步是有意为之，埋点本身不该拖慢业务代码的执行。

这个 `get` trap 有个缺陷要留意：它无条件返回一个函数，所以 `api._apiKey` 这种取普通值的操作也会拿到一个函数。稳妥的写法是先判断 `typeof value === 'function'`，不是函数就原样返回。

### 3.4 预警和拦截

假设你不想让其他开发者删除 `noDelete` 属性，还想让调用 `oldMethod` 的开发者知道这个方法已经被废弃了，或者告诉开发者不要修改 `doNotChange` 属性，那么就可以使用 `Proxy` 来实现：

```js
let dataStore = {
    noDelete: 1235,
    oldMethod: function() {/*...*/ },
    doNotChange: "tried and true"
};

const NODELETE = ['noDelete'];
const NOCHANGE = ['doNotChange'];
const DEPRECATED = ['oldMethod'];

dataStore = new Proxy(dataStore, {
    set(target, key, value, proxy) {
        if (NOCHANGE.includes(key)) {
            throw Error(`Error! ${key} is immutable.`);
        }
        return Reflect.set(target, key, value, proxy);
    },
    deleteProperty(target, key) {
        if (NODELETE.includes(key)) {
            throw Error(`Error! ${key} cannot be deleted.`);
        }
        return Reflect.deleteProperty(target, key);
    },
    get(target, key, proxy) {
        if (DEPRECATED.includes(key)) {
            console.warn(`Warning! ${key} is deprecated.`);
        }
        var val = target[key];

        return typeof val === 'function' ?
            function(...args) {
                return Reflect.apply(target[key], target, args);
            } :
            val;
    }
});

// these will throw errors or log warnings, respectively
dataStore.doNotChange = "foo";
delete dataStore.noDelete;
dataStore.oldMethod();
```

这段的 `get` 就做了上一节说的类型判断，函数才包装，非函数直接返回。原文包装后的函数里少了 `return`，调用 `dataStore.oldMethod()` 永远拿到 `undefined`，我补上了。

这套写法在做**库的平滑升级**时特别好用。旧 API 不直接删，先套一层 Proxy 打 deprecation 警告，观察一两个版本没人用了再真正下线。比在文档里写一行「此 API 已废弃」有效得多，因为警告是直接打在使用者控制台上的。

### 3.5 过滤操作

某些操作会非常占用资源，比如传输大文件。如果文件已经在分块发送了，就不需要对新的请求作出响应。这个时候可以使用 `Proxy` 对请求进行特征检测，过滤出哪些是不需要响应的：

```js
let obj = {
    getGiantFile: function(fileId) {/*...*/ }
};

obj = new Proxy(obj, {
    get(target, key, proxy) {
        return function(...args) {
            const id = args[0];
            let isEnroute = checkEnroute(id);
            let isDownloading = checkStatus(id);
            let cached = getCached(id);

            if (isEnroute || isDownloading) {
                return false;
            }
            if (cached) {
                return cached;
            }
            return Reflect.apply(target[key], target, args);
        }
    }
});
```

这段是示意，`checkEnroute`、`checkStatus`、`getCached` 都没给实现。思路本身很值得记：**请求去重加缓存**这层逻辑跟业务方法本身无关，抽到 Proxy 里之后，业务方法可以保持干净。你在 SWR、React Query 这类数据请求库里能看到同样的分层思想，只不过它们用的是别的手段。

### 3.6 中断代理

`Proxy` 支持随时取消对 `target` 的代理，这一操作常用于完全封闭对数据或接口的访问。使用 `Proxy.revocable` 方法可以创建可撤销的代理对象：

```js
let sensitiveData = { username: 'devbryce' };
const { proxy, revoke } = Proxy.revocable(sensitiveData, handler);

function handleSuspectedHack(){
    revoke();
}

// logs 'devbryce'
console.log(proxy.username);
handleSuspectedHack();
// TypeError: Cannot perform 'get' on a proxy that has been revoked
console.log(proxy.username);
```

原文这段有两个问题，都必须改。一是 `Proxy.revocable` 返回的对象固定是 `{ proxy, revoke }` 两个键，原文解构成 `{sensitiveData, revokeAccess}` 拿到的是两个 `undefined`。二是原文用 `const sensitiveData` 重复声明了上一行已经用 `let` 声明过的同名变量，直接语法报错。上面按标准返回值改写了。

撤销之后，这个 proxy 上的**任何**操作都会抛 `TypeError`，不只是 `get`。原对象 `sensitiveData` 不受影响，还是好好的。所以 `revocable` 的典型用法是：把 proxy 交给不受信任的第三方代码，自己攥着 `revoke`，需要收回权限时一调了事，对方手上那个引用当场作废。

## 四、和 Object.defineProperty 的取舍

回到开头 Vue 的例子。Proxy 相比 `Object.defineProperty` 的优势可以归成三条。

**拦截范围不同。** `defineProperty` 只能拦某个已存在属性的 get/set，Proxy 拦的是整个对象上的十三类操作，新增属性、删除属性、`in` 判断、`Object.keys` 全都能拦。Vue 2 那些 `$set` 补丁在 Proxy 下自然就不需要了。

**不用递归遍历。** `defineProperty` 要在初始化时把对象的每个 key 都走一遍，嵌套对象还得递归下去，对象越大初始化越慢。Proxy 是访问到哪一层才代理哪一层，深层数据没人碰就一直不用处理，属于惰性的。

**数组不用打补丁。** 数组下标赋值和 `length` 变化在 Proxy 里就是普通的 `set`，直接就能拦到。Vue 2 得重写 `push`、`pop`、`splice` 那七个方法，还是拦不住 `arr[0] = 1`。

代价也很实在。一是兼容性，前面说了不能 polyfill，需要支持 IE 就直接出局。二是性能，单次属性访问 Proxy 是要慢一些的，因为多了一层间接调用；不过实际项目里省下的初始化开销通常更划算。三是理解成本，前面提到的 trap 不变量、`this` 指向、必须通过 proxy 访问才生效，这些坑写复杂 handler 时都会遇到。

我自己的感受是，业务代码里直接手写 Proxy 的机会真不多，它更多出现在框架和库的内部。但理解它对读框架源码帮助很大，Vue 3 的 `reactive`、MobX 5 之后的观察机制、Immer 的草稿对象，底层都是 Proxy。

## 总结

Proxy 干的事情是在对象外面套一层可编程的壳，十三个 trap 对应语言里十三类基础操作，你想改哪类就实现哪个 trap，不实现的自动走默认行为。

用起来记住几条：改动会落到原对象上，代理不是复制；只有通过 proxy 访问才触发拦截，漏出 target 引用就失效；严格模式下 `set` 和 `deleteProperty` 必须返回 `true`，返假值直接抛错；trap 的返回值受不变量约束，不能想返什么返什么。

场景上，属性读写组（`get`/`set`/`has`/`deleteProperty`/`ownKeys`）能覆盖九成需求，私有变量、校验抽离、访问日志、废弃预警都在这几个里打转。`apply` 和 `construct` 只在代理函数和类的时候用得上。`Proxy.revocable` 适合把引用交给不受信任的代码，随时能收回。

和 `Object.defineProperty` 比，Proxy 赢在拦截范围、惰性代理和数组支持，输在兼容性和单次访问性能。这也是 Vue 3 敢换、同时不得不放弃 IE11 的原因。

## 参考

- [MDN Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [MDN Proxy handler](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy)
- [MDN Proxy.revocable](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/revocable)
- [ryf教程-Proxy](https://es6.ruanyifeng.com/#docs/proxy)
- [Vue 3 响应式原理 reactivity 源码](https://github.com/vuejs/core/tree/main/packages/reactivity)
- [前端进阶之旅](https://interview.poetries.top)
