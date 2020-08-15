---
title: ES6系列之Proxy
date: 2018-12-21 10:00:24
tags: 
  - ES6
  - Javascript
categories: Front-End
---

## 一、proxy概述

**Proxy的兼容性**

![](https://poetries1.gitee.io/img-repo/2019/10/55.png)

> `proxy`在目标对象的外层搭建了一层拦截，外界对目标对象的某些操作，必须通过这层拦截

```js
var proxy = new Proxy(target, handler);
```

> `new Proxy()`表示生成一个`Proxy`实例，`target`参数表示所要拦截的目标对象，`handler`参数也是一个对象，用来定制拦截行为

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
   }
 }
 var targetWithLog = new Proxy(target, logHandler);
 
 targetWithLog.name; // 控制台输出：name 被读取
 targetWithLog.name = 'others'; // 控制台输出：name 被设置为 others
 
 console.log(target.name); // 控制台输出: others
```

- `targetWithLog` 读取属性的值时，实际上执行的是 `logHandler.get` ：在控制台输出信息，并且读取被代理对象 `target` 的属性。
- 在 `targetWithLog` 设置属性值时，实际上执行的是 `logHandler.set` ：在控制台输出信息，并且设置被代理对象 `target` 的属性的值

```js
// 由于拦截函数总是返回35，所以访问任何属性都得到35
var proxy = new Proxy({}, {
  get: function(target, property) {
    return 35;
  }
});

proxy.time // 35
proxy.name // 35
proxy.title // 35
```

**Proxy 实例也可以作为其他对象的原型对象**

```js
var proxy = new Proxy({}, {
  get: function(target, property) {
    return 35;
  }
});

let obj = Object.create(proxy);
obj.time // 35
```

> `proxy`对象是`obj`对象的原型，`obj`对象本身并没有`time`属性，所以根据原型链，会在`proxy`对象上读取该属性，导致被拦截

**Proxy的作用**

> 对于代理模式 `Proxy` 的作用主要体现在三个方面

- 拦截和监视外部对对象的访问
- 降低函数或类的复杂度
- 在复杂操作前对操作进行校验或对所需资源进行管理


## 二、Proxy所能代理的范围--handler

> 实际上 `handler` 本身就是`ES6`所新设计的一个对象.它的作用就是用来 自定义代理对象的各种可代理操作 。它本身一共有`13`中方法,每种方法都可以代理一种操作.其`13`种方法如下

```js
// 在读取代理对象的原型时触发该操作，比如在执行 Object.getPrototypeOf(proxy) 时。
handler.getPrototypeOf()

// 在设置代理对象的原型时触发该操作，比如在执行 Object.setPrototypeOf(proxy, null) 时。
handler.setPrototypeOf()

 
// 在判断一个代理对象是否是可扩展时触发该操作，比如在执行 Object.isExtensible(proxy) 时。
handler.isExtensible()

 
// 在让一个代理对象不可扩展时触发该操作，比如在执行 Object.preventExtensions(proxy) 时。
handler.preventExtensions()

// 在获取代理对象某个属性的属性描述时触发该操作，比如在执行 Object.getOwnPropertyDescriptor(proxy, "foo") 时。
handler.getOwnPropertyDescriptor()

 
// 在定义代理对象某个属性时的属性描述时触发该操作，比如在执行 Object.defineProperty(proxy, "foo", {}) 时。
andler.defineProperty()

 
// 在判断代理对象是否拥有某个属性时触发该操作，比如在执行 "foo" in proxy 时。
handler.has()

// 在读取代理对象的某个属性时触发该操作，比如在执行 proxy.foo 时。
handler.get()

 
// 在给代理对象的某个属性赋值时触发该操作，比如在执行 proxy.foo = 1 时。
handler.set()

// 在删除代理对象的某个属性时触发该操作，比如在执行 delete proxy.foo 时。
handler.deleteProperty()

// 在获取代理对象的所有属性键时触发该操作，比如在执行 Object.getOwnPropertyNames(proxy) 时。
handler.ownKeys()

// 在调用一个目标对象为函数的代理对象时触发该操作，比如在执行 proxy() 时。
handler.apply()

 
// 在给一个目标对象为构造函数的代理对象构造实例时触发该操作，比如在执行new proxy() 时。
handler.construct()
```


## 三、Proxy场景

### 3.1 实现私有变量

```js
var target = {
   name: 'poetries',
   _age: 22
}

var logHandler = {
  get: function(target,key){
    if(key.startsWith('_')){
      console.log('私有变量age不能被访问')
      return false
    }
    return target[key];
  },
  set: function(target, key, value) {
     if(key.startsWith('_')){
      console.log('私有变量age不能被修改')
      return false
    }
     target[key] = value;
   }
} 
var targetWithLog = new Proxy(target, logHandler);
 
// 私有变量age不能被访问
targetWithLog.name; 
 
// 私有变量age不能被修改
targetWithLog.name = 'others'; 
```

> 在下面的代码中，我们声明了一个私有的 `apiKey`，便于 `api` 这个对象内部的方法调用，但不希望从外部也能够访问 `api._apiKey`

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

> 很显然，约定俗成是没有束缚力的。使用 `ES6 Proxy` 我们就可以实现真实的私有变量了，下面针对不同的读取方式演示两个不同的私有化方法。第一种方法是使用 `set / get` 拦截读写请求并返回 `undefined`:

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
        return Reflect.get(target, key, value, proxy);
    }
});

// 以下操作都会抛出错误
console.log(api._apiKey);
api._apiKey = '987654321';  
```

> 第二种方法是使用 `has` 拦截 `in` 操作

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

### 3.2 抽离校验模块

> 让我们从一个简单的类型校验开始做起，这个示例演示了如何使用 `Proxy` 保障数据类型的准确性

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

> 如果要直接为对象的所有属性开发一个校验器可能很快就会让代码结构变得臃肿，使用 `Proxy` 则可以将校验器从核心逻辑分离出来自成一体

```js
function createValidator(target, validator) {  
    return new Proxy(target, {
        _validator: validator,
        set(target, key, value, proxy) {
            if (target.hasOwnProperty(key)) {
                let validator = this._validator[key];
                if (!!validator(value)) {
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
        return typeof age === 'number' && age > 18;
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

> 通过校验器和主逻辑的分离，你可以无限扩展 `personValidators` 校验器的内容，而不会对相关的类或函数造成直接破坏。更复杂一点，我们还可以使用 `Proxy` 模拟类型检查，检查函数是否接收了类型和数量都正确的参数

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
            var checkArgs = argChecker(key, args, argTypes[key]);
            return Reflect.apply(value, target, args);
        };
    }
});

function argChecker(name, args, checkers) {  
    for (var idx = 0; idx < args.length; idx++) {
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


### 3.3 访问日志

> 对于那些调用频繁、运行缓慢或占用执行环境资源较多的属性或接口，开发者会希望记录它们的使用情况或性能表现，这个时候就可以使用 `Proxy` 充当中间件的角色，轻而易举实现日志功能

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
        return function(...arguments) {
            logMethodAsync(new Date(), key);
            return Reflect.apply(value, target, arguments);
        };
    }
});

api.getUsers();
```

### 3.4 预警和拦截

> 假设你不想让其他开发者删除 `noDelete` 属性，还想让调用 `oldMethod` 的开发者了解到这个方法已经被废弃了，或者告诉开发者不要修改 `doNotChange` 属性，那么就可以使用 `Proxy` 来实现

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
                Reflect.apply(target[key], target, args);
            } :
            val;
    }
});

// these will throw errors or log warnings, respectively
dataStore.doNotChange = "foo";  
delete dataStore.noDelete;  
dataStore.oldMethod();
```

### 3.5 过滤操作

> 某些操作会非常占用资源，比如传输大文件，这个时候如果文件已经在分块发送了，就不需要在对新的请求作出相应（非绝对），这个时候就可以使用 `Proxy` 对当请求进行特征检测，并根据特征过滤出哪些是不需要响应的，哪些是需要响应的。下面的代码简单演示了过滤特征的方式，并不是完整代码，相信大家会理解其中的妙处

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

### 3.6 中断代理

> `Proxy` 支持随时取消对 `target` 的代理，这一操作常用于完全封闭对数据或接口的访问。在下面的示例中，我们使用了 `Proxy.revocable` 方法创建了可撤销代理的代理对象：

```js
let sensitiveData = { username: 'devbryce' };
const {sensitiveData, revokeAccess} = Proxy.revocable(sensitiveData, handler);
function handleSuspectedHack(){  
    revokeAccess();
}

// logs 'devbryce'
console.log(sensitiveData.username);
handleSuspectedHack();
// TypeError: Revoked
console.log(sensitiveData.username);
```

