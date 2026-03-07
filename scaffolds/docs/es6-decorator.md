---
title: ES6系列之装饰器
date: 2018-12-21 11:50:24
tags: 
  - ES6
  - Javascript
categories: Front-End
---

## 一、简介

> 装饰器依赖于 `ES5` 的 `Object.defineProperty` 方法 

### 1.1 Object.defineProperty

- `Object.defineProperty()` 方法会直接在一个对象上定义一个新属性，或者修改一个对象的现有属性， 并返回这个对象
- 该方法允许精确添加或修改对象的属性。通过赋值来添加的普通属性会创建在属性枚举期间显示的属性（`for...in` 或 `Object.keys` 方法）， 这些值可以被改变，也可以被删除。这种方法允许这些额外的细节从默认值改变。默认情况下，使用 `Object.defineProperty()` 添加的属性值是不可变的

```js
Object.defineProperty(obj, prop, descriptor)
```

- `obj`：要在其上定义属性的对象。
- `prop`：要定义或修改的属性的名称。
- `descriptor`：将被定义或修改的属性描述符。
- 返回值：被传递给函数的对象。

> 在`ES6`中，由于 `Symbol`类型 的特殊性，用 `Symbol`类型 的值来做对象的`key`与常规的定义或修改不同，而`Object.defineProperty` 是定义 `key`为 `Symbol` 的属性的方法之一

**descriptor属性描述符**

> 对象里目前存在的属性描述符有两种主要形式：数据描述符和存取描述符

- 数据描述符是一个具有值的属性，该值可能是可写的，也可能不是可写的。
- 存取描述符是由 `getter-setter` 函数对描述的属性。

**configurable**

> 当且仅当该属性的 `configurable` 为 `true` 时，该属性描述符才能够被改变，同时该属性也能从对应的对象上被删除。默认为 `false`

**enumerable**

- `enumerable`定义了对象的属性是否可以在 `for...in `循环和 `Object.keys()` 中被枚举。
- 当且仅当该属性的 `enumerable` 为 `true` 时，该属性才能够出现在对象的枚举属性中。默认为 `false`。

## 二、Babel

**安装编译**

```bash
npm install --save-dev @babel/core @babel/cli

npm install --save-dev @babel/plugin-proposal-decorators @babel/plugin-proposal-class-properties
```

> 新建 `.babelrc` 文件

```json
{
  "plugins": [
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    ["@babel/plugin-proposal-class-properties", {"loose": true}]
  ]
}
```

再编译指定的文件

```
babel decorator.js --out-file decorator-compiled.js
```





## 三、用法

**装饰器主要用于**

- 装饰类
- 装饰方法或属性

### 3.1 类的装饰

```js
@testable
class MyTestableClass {
  // ...
}

function testable(target) {
  target.isTestable = true;
}

MyTestableClass.isTestable // true
```

> 上面代码中，`@testable` 就是一个装饰器。它修改了 `MyTestableClass`这 个类的行为，为它加上了静态属性`isTestable`。`testable` 函数的参数 `target` 是 `MyTestableClass` 类本身

基本上，装饰器的行为就是下面这样

```js
@decorator
class A {}

// 等同于

class A {}
A = decorator(A) || A;
```

> 也就是说，装饰器是一个对类进行处理的函数。装饰器函数的第一个参数，就是所要装饰的目标类

如果觉得一个参数不够用，可以在装饰器外面再封装一层函数

```js
function testable(isTestable) {
  return function(target) {
    target.isTestable = isTestable;
  }
}

@testable(true)
class MyTestableClass {}
MyTestableClass.isTestable // true

@testable(false)
class MyClass {}
MyClass.isTestable // false
```

> 上面代码中，装饰器 `testable` 可以接受参数，这就等于可以修改装饰器的行为

**注意**，装饰器对类的行为的改变，是代码编译时发生的，而不是在运行时。这意味着，装饰器能在编译阶段运行代码。也就是说，装饰器本质就是编译时执行的函数。

> 前面的例子是为类添加一个静态属性，如果想添加实例属性，可以通过目标类的 `prototype` 对象操作

```js
// mixins.js
export function mixins(...list) {
  return function (target) {
    Object.assign(target.prototype, ...list)
  }
}

// main.js
import { mixins } from './mixins'

const Foo = {
  foo() { console.log('foo') }
};

@mixins(Foo)
class MyClass {}

let obj = new MyClass();
obj.foo() // 'foo'
```

> 上面代码通过装饰器 `mixins`，把`Foo`对象的方法添加到了 `MyClass `的实例上面

### 3.2 方法的装饰

> 装饰器不仅可以装饰类，还可以装饰类的属性

```js
class Person {
// 装饰器 readonly 用来装饰“类”的name方法。
  @readonly
  name() { return `${this.first} ${this.last}` }
}
```

> 装饰器函数 `readonly` 一共可以接受三个参数。


```js
function readonly(target, name, descriptor){
  // descriptor对象原来的值如下
  // {
  //   value: specifiedFunction,
  //   enumerable: false,
  //   configurable: true,
  //   writable: true
  // };
  descriptor.writable = false;
  return descriptor;
}

readonly(Person.prototype, 'name', descriptor);
// 类似于
Object.defineProperty(Person.prototype, 'name', descriptor);
```

- 第一个参数是类的原型对象，上例是 `Person.prototype`，装饰器的本意是要“装饰”类的实例，但是这个时候实例还没生成，所以只能去装饰原型（这不同于类的装饰，那种情况时`target`参数指的是类本身）
- 第二个参数是 所要装饰的属性名
- 第三个参数是 该属性的描述对象

### 3.3 函数方法的装饰

- 装饰器只能用于类和类的方法，不能用于函数，因为存在函数提升
- 另一方面，如果一定要装饰函数，可以采用高阶函数的形式直接执行

```js
function doSomething(name) {
  console.log('Hello, ' + name);
}

function loggingDecorator(wrapped) {
  return function() {
    console.log('Starting');
    const result = wrapped.apply(this, arguments);
    console.log('Finished');
    return result;
  }
}

const wrapped = loggingDecorator(doSomething);
```

## 四、使用场景

### 4.1 装饰器有注释的作用

```js
@testable
class Person {
  @readonly
  @nonenumerable
  name() { return `${this.first} ${this.last}` }
}
```

> 从上面代码中，我们一眼就能看出，`Person`类是可测试的，而`name`方法是只读和不可枚举的

### 4.2 React 的 connect

> 实际开发中，React 与 Redux 库结合使用时，常常需要写成下面这样

```js
class MyReactComponent extends React.Component {}

export default connect(mapStateToProps, mapDispatchToProps)(MyReactComponent);
```

> 有了装饰器，就可以改写上面的代码。装饰

```js
@connect(mapStateToProps, mapDispatchToProps)
export default class MyReactComponent extends React.Component {}
```

### 4.3 loading

> 在 `React` 项目中，我们可能需要在向后台请求数据时，页面出现 `loading` 动画。这个时候，你就可以使用装饰器，优雅地实现功能。


```js
@autobind
@loadingWrap(true)
async handleSelect(params) {
  await this.props.dispatch({
    type: 'product_list/setQuerypParams',
    querypParams: params
  });
}
```

> loadingWrap 函数如下：

```js
export function loadingWrap(needHide) {

  const defaultLoading = (
    <div className="toast-loading">
      <Loading className="loading-icon"/>
      <div>加载中...</div>
    </div>
  );

  return function (target, property, descriptor) {
    const raw = descriptor.value;
    
    descriptor.value = function (...args) {
      Toast.info(text || defaultLoading, 0, null, true);
      const res = raw.apply(this, args);
      
      if (needHide) {
        if (get('finally')(res)) {
          res.finally(() => {
            Toast.hide();
          });
        } else {
          Toast.hide();
        }
      }
    };
    return descriptor;
  };
}
```

### 4.4 log

> 为一个方法添加 log 函数，检查输入的参数：

```js
class Math {
  @log
  add(a, b) {
    return a + b;
  }
}

let log = (type) => {
  return (target, name, descriptor) => {
    const method = descriptor.value;
    descriptor.value =  (...args) => {
      console.info(`(${type}) 正在执行: ${name}(${args}) = ?`);
      let ret;
      try {
        ret = method.apply(target, args);
        console.info(`(${type}) 成功 : ${name}(${args}) => ${ret}`);
      } catch (error) {
        console.error(`(${type}) 失败: ${name}(${args}) => ${error}`);
      }
      return ret;
    }
  }
};

const math = new Math();

// Calling add with [2, 4]
math.add(2, 4);
```

### 4.5 autobind

```js
class Person {
  @autobind
  getPerson() {
      return this;
  }
}

let person = new Person();
let { getPerson } = person;

getPerson() === person;
// true
```

> 我们很容易想到的一个场景是 React 绑定事件的时候

```js
class Toggle extends React.Component {

  @autobind
  handleClick() {
      console.log(this)
  }

  render() {
    return (
      <button onClick={this.handleClick}>
        button
      </button>
    );
  }
}
```

> 我们来写这样一个 `autobind `函数：

```js
const { defineProperty, getPrototypeOf} = Object;

function bind(fn, context) {
  if (fn.bind) {
    return fn.bind(context);
  } else {
    return function __autobind__() {
      return fn.apply(context, arguments);
    };
  }
}

function createDefaultSetter(key) {
  return function set(newValue) {
    Object.defineProperty(this, key, {
      configurable: true,
      writable: true,
      enumerable: true,
      value: newValue
    });

    return newValue;
  };
}

function autobind(target, key, { value: fn, configurable, enumerable }) {
  if (typeof fn !== 'function') {
    throw new SyntaxError(`@autobind can only be used on functions, not: ${fn}`);
  }

  const { constructor } = target;

  return {
    configurable,
    enumerable,

    get() {

      /**
       * 使用这种方式相当于替换了这个函数，所以当比如
       * Class.prototype.hasOwnProperty(key) 的时候，为了正确返回
       * 所以这里做了 this 的判断
       */
      if (this === target) {
        return fn;
      }

      const boundFn = bind(fn, this);

      defineProperty(this, key, {
        configurable: true,
        writable: true,
        enumerable: false,
        value: boundFn
      });

      return boundFn;
    },
    set: createDefaultSetter(key)
  };
}
```

### 4.6 debounce

> 有的时候，我们需要对执行的方法进行防抖处理:

```js
class Toggle extends React.Component {

  @debounce(500, true)
  handleClick() {
    console.log('toggle')
  }

  render() {
    return (
      <button onClick={this.handleClick}>
        button
      </button>
    );
  }
}
```

```js
function _debounce(func, wait, immediate) {

    var timeout;

    return function () {
        var context = this;
        var args = arguments;

        if (timeout) clearTimeout(timeout);
        if (immediate) {
            var callNow = !timeout;
            timeout = setTimeout(function(){
                timeout = null;
            }, wait)
            if (callNow) func.apply(context, args)
        }
        else {
            timeout = setTimeout(function(){
                func.apply(context, args)
            }, wait);
        }
    }
}

function debounce(wait, immediate) {
  return function handleDescriptor(target, key, descriptor) {
    const callback = descriptor.value;

    if (typeof callback !== 'function') {
      throw new SyntaxError('Only functions can be debounced');
    }

    var fn = _debounce(callback, wait, immediate)

    return {
      ...descriptor,
      value() {
        fn()
      }
    };
  }
}
```

### 4.7 time

> 用于统计方法执行的时间:

```js
function time(prefix) {
  let count = 0;
  return function handleDescriptor(target, key, descriptor) {

    const fn = descriptor.value;

    if (prefix == null) {
      prefix = `${target.constructor.name}.${key}`;
    }

    if (typeof fn !== 'function') {
      throw new SyntaxError(`@time can only be used on functions, not: ${fn}`);
    }

    return {
      ...descriptor,
      value() {
        const label = `${prefix}-${count}`;
        count++;
        console.time(label);

        try {
          return fn.apply(this, arguments);
        } finally {
          console.timeEnd(label);
        }
      }
    }
  }
}
```

### 4.8 mixin

> 用于将对象的方法混入` Class` 中

```js
const SingerMixin = {
  sing(sound) {
    alert(sound);
  }
};

const FlyMixin = {
  // All types of property descriptors are supported
  get speed() {},
  fly() {},
  land() {}
};

@mixin(SingerMixin, FlyMixin)
class Bird {
  singMatingCall() {
    this.sing('tweet tweet');
  }
}

var bird = new Bird();
bird.singMatingCall();
// alerts "tweet tweet"
```

> `mixin` 的一个简单实现如下

```js
function mixin(...mixins) {
  return target => {
    if (!mixins.length) {
      throw new SyntaxError(`@mixin() class ${target.name} requires at least one mixin as an argument`);
    }

    for (let i = 0, l = mixins.length; i < l; i++) {
      const descs = Object.getOwnPropertyDescriptors(mixins[i]);
      const keys = Object.getOwnPropertyNames(descs);

      for (let j = 0, k = keys.length; j < k; j++) {
        const key = keys[j];

        if (!target.prototype.hasOwnProperty(key)) {
          Object.defineProperty(target.prototype, key, descs[key]);
        }
      }
    }
  };
}
```


