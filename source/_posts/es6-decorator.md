---
title: ES6系列之装饰器的原理与实战用法
description: 装饰器如何借 Object.defineProperty 改写类和方法，Babel 该怎么配，以及 autobind、debounce、loading、log、mixin 六个常用装饰器的完整实现与踩坑点。
date: 2018-12-21 11:50:24
tags:
  - ES6
  - Javascript
  - 装饰器
  - Decorator
categories: Front-End
---

React 项目里写 `connect(mapStateToProps)(MyComponent)` 这种高阶组件包一层，写多了就会觉得别扭：明明想说的是「这个组件连了 store」，写出来却是一堆嵌套的括号，而且要读到文件最后一行才知道这个组件被包了什么。装饰器把这件事挪到了类声明的上方，`@connect(...)` 一行摆在最显眼的位置，意图和代码位置对齐了。

装饰器的核心机制并不复杂，它就是一个在类定义阶段被调用的函数，拿到目标和属性描述符，改完再交回去。底层依赖的还是 ES5 那个 `Object.defineProperty`。这篇从 `defineProperty` 讲起，把类装饰和方法装饰的参数说清楚，然后给出六个常用装饰器的完整实现。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `Object.defineProperty` 和属性描述符，装饰器的地基
- 类装饰器的等价写法，以及为什么能带参数
- 方法装饰器的三个参数分别是什么
- 装饰器为什么不能用在函数上
- 六个实用装饰器：注释语义、connect、loading、log、autobind、debounce、time、mixin
- 提案演进与现状：legacy 语义和新语义的差别

## 一、装饰器依赖的地基

装饰器依赖于 `ES5` 的 `Object.defineProperty` 方法。搞清楚这个方法，装饰器的行为就有了解释。

### 1.1 Object.defineProperty

`Object.defineProperty()` 方法会直接在一个对象上定义一个新属性，或者修改一个对象的现有属性，并返回这个对象。

该方法允许精确添加或修改对象的属性。通过赋值来添加的普通属性会创建在属性枚举期间显示的属性（`for...in` 或 `Object.keys` 方法），这些值可以被改变，也可以被删除。用 `Object.defineProperty()` 添加的属性，默认情况下是不可变的。

```js
Object.defineProperty(obj, prop, descriptor)
```

- `obj`：要在其上定义属性的对象
- `prop`：要定义或修改的属性的名称
- `descriptor`：将被定义或修改的属性描述符
- 返回值：被传递给函数的对象

在 `ES6` 中，由于 `Symbol` 类型的特殊性，用 `Symbol` 类型的值来做对象的 `key` 与常规的定义或修改不同，而 `Object.defineProperty` 是定义 key 为 `Symbol` 的属性的方法之一。

### 1.2 descriptor 属性描述符

对象里目前存在的属性描述符有两种主要形式，数据描述符和存取描述符。

数据描述符是一个具有值的属性，该值可能是可写的，也可能不是可写的。存取描述符是由 `getter-setter` 函数对描述的属性。这两种形式互斥，同一个描述符里不能既有 `value` 又有 `get`，否则直接报错。

**configurable**

当且仅当该属性的 `configurable` 为 `true` 时，该属性描述符才能够被改变，同时该属性也能从对应的对象上被删除。默认为 `false`。

**enumerable**

`enumerable` 定义了对象的属性是否可以在 `for...in` 循环和 `Object.keys()` 中被枚举。当且仅当该属性的 `enumerable` 为 `true` 时，该属性才能够出现在对象的枚举属性中。默认为 `false`。

这两个默认值很关键。你用 `obj.a = 1` 赋值出来的属性，四个特性全是 `true`；用 `Object.defineProperty` 定义的，没写的一律是 `false` 或 `undefined`。所以定义完发现属性遍历不到、改不动、删不掉，八成是漏了写这几个字段。

方法装饰器拿到的第三个参数就是这个描述符对象，改它就等于改这个方法的行为。这条线索是理解后面所有代码的钥匙。

## 二、Babel 配置

装饰器在原生环境里跑不了，需要编译。

```bash
npm install --save-dev @babel/core @babel/cli

npm install --save-dev @babel/plugin-proposal-decorators @babel/plugin-proposal-class-properties
```

新建 `.babelrc` 文件：

```json
{
  "plugins": [
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    ["@babel/plugin-proposal-class-properties", {"loose": true}]
  ]
}
```

再编译指定的文件：

```
babel decorator.js --out-file decorator-compiled.js
```

`legacy: true` 这个开关要单独说一下。它表示按早期的装饰器语义编译，也就是本文所有示例用的那套「三参数 + 改描述符」的写法。这个配置在 2018 年前后是绝大多数项目的选择，Ant Design Pro、dva、mobx-react 那一批脚手架默认都开着它。

原文写于装饰器提案还在早期阶段的时候。这个提案后来经历了好几轮大改，语义和早期版本已经很不一样了，现在阶段更靠后，TypeScript 5 也切换到了新语义并保留了 `experimentalDecorators` 开关兼容旧写法。具体处在哪个阶段、新旧语义的完整差异，建议以 TC39 提案仓库和 MDN 为准，我这里就不列版本号了，免得写错。

后面所有代码都保留原文的 legacy 写法，因为这是当年真实在跑的东西，也是你在老项目里会读到的形态。第五节会单独讲新语义的差别。

## 三、装饰器的用法

装饰器主要用于两个地方，装饰类，装饰方法或属性。

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

上面代码中，`@testable` 就是一个装饰器。它修改了 `MyTestableClass` 这个类的行为，为它加上了静态属性 `isTestable`。`testable` 函数的参数 `target` 就是 `MyTestableClass` 类本身。

装饰器的行为就是下面这样：

```js
@decorator
class A {}

// 等同于

class A {}
A = decorator(A) || A;
```

装饰器是一个对类进行处理的函数，它的第一个参数就是所要装饰的目标类。注意后面那个 `|| A`，装饰器不返回东西的时候，类保持不变；返回了新的类，就整个替换掉。这一点在实现「返回一个包装类」的装饰器时很重要。

如果觉得一个参数不够用，可以在装饰器外面再封装一层函数：

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

装饰器 `testable` 可以接受参数，这就等于可以修改装饰器的行为。`@testable(true)` 这个写法要理解成「先调用 `testable(true)` 拿到真正的装饰器函数，再用它去装饰类」，多一层柯里化而已。

装饰器对类行为的改变是在**代码编译时**发生的，而不是在运行时。装饰器就是编译时执行的函数。

这句原文的表述在 legacy 语义下大致成立，但容易引起误解，我补一句更准确的说法：装饰器函数本身是在**类定义求值的时候**执行的，也就是模块加载、`class` 语句执行的那一刻，而不是在实例化或者调用方法的时候。它比业务代码早，但仍然是运行时行为，Babel 只是把语法转成了普通函数调用。

前面的例子是为类添加一个静态属性，如果想添加实例属性，可以通过目标类的 `prototype` 对象操作：

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

上面代码通过装饰器 `mixins`，把 `Foo` 对象的方法添加到了 `MyClass` 的实例上面。注意它改的是 `prototype`，所以所有实例共享同一份方法，这和在构造函数里 `Object.assign(this, Foo)` 是两回事。

### 3.2 方法的装饰

装饰器不仅可以装饰类，还可以装饰类的方法和属性。

```js
class Person {
  // 装饰器 readonly 用来装饰类的 name 方法
  @readonly
  name() { return `${this.first} ${this.last}` }
}
```

原文这里的注释用了中文弯引号包住「类」，在双引擎渲染下容易出问题，已经改成不带引号的表述。

装饰器函数 `readonly` 一共可以接受三个参数：

```js
function readonly(target, name, descriptor){
  // descriptor 对象原来的值如下
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

- 第一个参数是类的原型对象，上例是 `Person.prototype`。装饰器的本意是要装饰类的实例，但是这个时候实例还没生成，所以只能去装饰原型（这不同于类的装饰，那种情况下 `target` 参数指的是类本身）
- 第二个参数是所要装饰的属性名
- 第三个参数是该属性的描述对象

第三个参数是重点。你有两种改法：直接修改传进来的 `descriptor` 再 `return`，或者返回一个全新的描述符对象。后面几个实用装饰器基本都是「取出 `descriptor.value` 这个原函数，包一层，塞回去」这个套路。

### 3.3 为什么不能装饰函数

装饰器只能用于类和类的方法，不能用于函数，因为存在函数提升。

展开说一下这个理由。函数声明会被整体提升到作用域顶部，装饰器代码却在原来的位置执行，两者时机对不上。假设允许这么写：

```js
@log
function foo() {}
```

`foo` 在作用域开始时就已经存在了，而 `@log` 要到那一行才执行。如果有代码在装饰器执行前就调用了 `foo`，拿到的是没被装饰的原始版本，行为不确定。类声明不存在这个问题，`class` 是不提升的（准确说是提升了但处于 TDZ，声明前访问会报错）。

如果一定要装饰函数，可以采用高阶函数的形式直接执行：

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

这就是装饰器语法糖化掉的那个东西，只是没有 `@` 好看。

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

从上面代码中，我们一眼就能看出，`Person` 类是可测试的，而 `name` 方法是只读和不可枚举的。

多个装饰器叠加时的执行顺序值得记一下：**求值从上到下，应用从下到上**。也就是先算出 `readonly` 和 `nonenumerable` 这两个装饰器函数（如果带参数就是先调用外层拿到内层），然后 `nonenumerable` 先作用于方法，`readonly` 再作用于它的结果。跟数学上的函数复合一样，离目标近的先生效。顺序搞错的话，比如把 `@debounce` 放在 `@autobind` 外面还是里面，行为是不一样的。

### 4.2 React 的 connect

实际开发中，React 与 Redux 库结合使用时，常常需要写成下面这样：

```js
class MyReactComponent extends React.Component {}

export default connect(mapStateToProps, mapDispatchToProps)(MyReactComponent);
```

有了装饰器，就可以改写上面的代码：

```js
@connect(mapStateToProps, mapDispatchToProps)
export default class MyReactComponent extends React.Component {}
```

这个写法读起来顺畅多了，「这个组件连了 store」这个信息出现在类声明的正上方，不用翻到文件末尾。

有个语法坑要提醒：`@connect(...) export default class` 和 `export default @connect(...) class` 这两种排列，不同时期的提案和不同版本的 Babel 支持情况不一样，有的会直接报 parse 错误。最稳的写法是拆开：

```js
@connect(mapStateToProps, mapDispatchToProps)
class MyReactComponent extends React.Component {}

export default MyReactComponent;
```

这块我在老项目升级 Babel 版本的时候踩过，装饰器和 `export default` 写在一行升级完就 build 不过了，拆开就好了。

### 4.3 loading

在 `React` 项目中，我们可能需要在向后台请求数据时让页面出现 `loading` 动画。这个时候就可以使用装饰器来实现：

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

`loadingWrap` 函数如下：

```js
export function loadingWrap(needHide, text) {

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
        if (res && typeof res.finally === 'function') {
          res.finally(() => {
            Toast.hide();
          });
        } else {
          Toast.hide();
        }
      }
      return res;
    };
    return descriptor;
  };
}
```

原文这段有三个问题，我都改了。一是 `text` 这个变量在函数里被使用但从来没有声明，直接 `ReferenceError`，正确做法是把它作为 `loadingWrap` 的第二个参数收进来。二是 `get('finally')(res)` 用了 lodash 的 `get` 但没有导入，而且这个用法本身也不对，改成直接判断 `res.finally` 是不是函数更清楚。三是 `descriptor.value` 包装后的函数没有 `return res`，导致被装饰的方法返回值全部丢失，外面 `await` 不到东西。

这个装饰器演示了「取出原函数、包一层、塞回描述符」这个通用套路，后面几个都是同一个模子。

### 4.4 log

为一个方法添加 log 函数，检查输入的参数：

```js
class Calculator {
  @log('math')
  add(a, b) {
    return a + b;
  }
}

function log(type) {
  return (target, name, descriptor) => {
    const method = descriptor.value;
    descriptor.value = function (...args) {
      console.info(`(${type}) 正在执行: ${name}(${args}) = ?`);
      let ret;
      try {
        ret = method.apply(this, args);
        console.info(`(${type}) 成功 : ${name}(${args}) => ${ret}`);
      } catch (error) {
        console.error(`(${type}) 失败: ${name}(${args}) => ${error}`);
        throw error;
      }
      return ret;
    }
    return descriptor;
  }
};

const calc = new Calculator();

// (math) 正在执行: add(2,4) = ?
// (math) 成功 : add(2,4) => 6
calc.add(2, 4);
```

原文这段问题比较集中，逐条说。

类名原文叫 `Math`，会在当前作用域遮蔽全局的 `Math` 对象，同一个文件里再用 `Math.max` 就炸了，改名成 `Calculator`。

`log` 原文用 `let` 声明在 class 之后，但 `@log` 在类定义求值时就要用它，这时候 `log` 还在 TDZ 里，直接报 `Cannot access 'log' before initialization`。改用 `function log` 声明，靠函数提升解决。

`log` 是个需要传参的装饰器工厂，所以用法必须是 `@log('math')` 而不是原文的 `@log`。写成 `@log` 的话传进去的第一个参数是 `target`，`type` 就变成了类的原型对象。

原文用箭头函数做包装 `descriptor.value = (...args) => {...}`，箭头函数没有自己的 `this`，会捕获装饰器工厂那一层的 `this`（通常是 `undefined`），实例方法里访问 `this.xxx` 直接挂。必须用普通函数。

同理，`method.apply(target, args)` 里传的是 `target` 也就是原型对象，应该传 `this` 才是当前实例。

最后，`catch` 里吞掉了异常只打了日志，调用方完全感知不到出错。日志装饰器不该改变函数的行为，打完日志要把异常重新抛出去。

这六处都是很典型的装饰器编写错误，值得对照着看一遍。

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

正常情况下，从实例上解构出方法再单独调用，`this` 就丢了。`autobind` 让方法永远绑定在实例上。

最容易想到的场景是 React 绑定事件的时候：

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

我们来写这样一个 `autobind` 函数：

```js
const { defineProperty, getPrototypeOf } = Object;

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

这个实现比前面几个巧妙，值得拆开看。

它没有直接返回一个绑定好的函数，而是把方法从「数据描述符」改成了「存取描述符」，用 `get` 拦住第一次访问。第一次通过实例访问 `this.handleClick` 时，`get` 里 `this` 指向实例，于是 `bind(fn, this)` 绑出正确的版本，然后立刻用 `defineProperty` 在**实例自身**上定义一个同名属性存住它。之后再访问就走实例自己的属性，不再经过原型上的 getter，等于只绑一次。

`if (this === target) return fn` 这个判断是为了处理直接从原型上访问的情况，比如 `Person.prototype.getPerson`，那时候没有实例可绑，返回原函数就好。

现在还需要这个装饰器吗？大部分场景不需要了。类属性加箭头函数 `handleClick = () => {}` 是更主流的写法，语法上也是标准（类字段已经进标准），效果一样而且不用装饰器。`autobind` 的价值在于它绑在原型上、每个实例只绑一次，而箭头函数类属性是每个实例各存一份。实例特别多的时候有点内存差别，一般项目里感知不到。

### 4.6 debounce

有的时候我们需要对执行的方法进行防抖处理：

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
        return fn.apply(this, arguments)
      }
    };
  }
}
```

原文这里 `value() { fn() }` 有两个毛病，`this` 和参数都没转发进去。防抖后的函数拿不到实例，也拿不到事件对象，实际用起来必然出错，上面改成了 `fn.apply(this, arguments)`。

还有一个更隐蔽的坑必须说：`_debounce` 的调用发生在装饰器执行时，也就是类定义阶段，所以 `timeout` 这个闭包变量是**所有实例共享**的。列表里渲染 20 个 `Toggle`，点第一个之后 500ms 内点第二个，第二个会被第一个的定时器挡掉。要每个实例独立防抖，得在 `get` 里为每个实例惰性创建一个 debounce 函数，思路跟上面的 `autobind` 一样。这个我踩过，当时排查了挺久才想明白是共享闭包的问题。

### 4.7 time

用于统计方法执行的时间：

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

这个实现比 `debounce` 那个规范，`this` 和 `arguments` 都正确转发了，而且用 `try...finally` 保证即使抛异常也会打出耗时。`count` 用来给每次调用生成不同的 label，因为 `console.time` 同名 label 会互相覆盖。

它只能测同步耗时。方法是 `async` 的话，`fn.apply` 返回 Promise 就立刻走到 `finally` 了，测出来的是「发起异步操作花了多久」，不是「异步完成花了多久」。要测后者得判断返回值是不是 Promise，在它的 `finally` 里再 `timeEnd`。

### 4.8 mixin

用于将对象的方法混入 `Class` 中：

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

`mixin` 的一个简单实现如下：

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

这个实现比 3.1 节那个 `Object.assign(target.prototype, ...list)` 的版本讲究得多，差别在两处。

一是用 `getOwnPropertyDescriptors` 而不是直接读值，所以 `FlyMixin` 里那个 `get speed()` 能作为访问器完整搬过去。`Object.assign` 会触发 getter 拿到返回值，然后把结果当普通值赋过去，getter 就丢了。

二是 `if (!target.prototype.hasOwnProperty(key))` 这个判断，类自己定义的方法优先，mixin 不会覆盖它。这个优先级设计是对的，不然你在类里写的实现会被莫名其妙地覆盖掉。

多个 mixin 有同名方法时，先传进来的赢，后面的会被 `hasOwnProperty` 挡住（因为前一轮已经定义上去了）。这一点用的时候要留意顺序。

## 五、提案演进与现状

原文这些代码都是 legacy 语义下的写法，2018 年前后的项目基本都长这样。装饰器提案后来改动很大，主要差别有这么几处，帮你在读新代码时对上号。

参数形态变了。旧写法是 `(target, key, descriptor)` 三个参数，新语义改成了 `(value, context)` 两个参数，`context` 里带着 `kind`（是方法、getter、字段还是类）、`name`、`static`、`private` 这些元信息，还有 `addInitializer` 这类钩子。

返回值语义变了。旧写法返回描述符对象，新语义返回的是替换后的值（方法装饰器返回新函数、字段装饰器返回一个初始化函数）。

能装饰的东西变多了。私有字段和私有方法在新语义下也能装饰，旧语义不行。

`Reflect.metadata` 那套东西不属于装饰器标准。它来自 `reflect-metadata` 这个第三方库和一个独立的元数据提案，Angular 和 NestJS 的依赖注入靠它。`Reflect` 标准本身只有 13 个方法，不包括 `metadata`，这一点在 [ES6系列之 Reflect 的设计意图与 API 全览](https://feinterview.poetries.top/blog/es6-reflect) 里也提到过，很多人会混。

具体的提案阶段、Babel 各版本对应哪套语义、TypeScript 的 `experimentalDecorators` 开关怎么迁移，这些我不列具体版本号了，请以 TC39 提案仓库和 MDN 为准，变动比较频繁。

新项目要不要用装饰器？我的判断是看框架。NestJS、Angular、TypeORM 这类框架里装饰器就是主要 API，不用不行。纯前端的 React 项目里现在基本用不上了，Hooks 之后连高阶组件都少了，`@connect` 这套写法随着 class 组件一起淡出了。想拦截对象行为的话，`Proxy` 是更通用也更标准的工具，用法我整理在 [ES6系列之 Proxy 的拦截机制与实战场景](https://feinterview.poetries.top/blog/es6-proxy) 这篇。

## 总结

装饰器的机制可以压缩成一句话：它是在类定义求值时执行的函数，拿到目标和属性描述符，改完再交回引擎，底层落到 `Object.defineProperty` 上。

类装饰器的参数是类本身，返回非空值就整体替换掉这个类。方法装饰器在 legacy 语义下拿三个参数，第一个是原型（不是实例），第三个是描述符，绝大多数实现都是「取出 `descriptor.value`、包一层、塞回去」这个套路。装饰器不能用在函数上，原因是函数提升会让执行时机对不齐。

自己写装饰器最容易踩的四个坑，这篇里都出现了实例：包装函数不能用箭头函数，否则 `this` 丢失；`apply` 要传 `this` 而不是 `target`；包装后必须 `return` 原函数的返回值，否则 `await` 不到东西；闭包变量定义在装饰器工厂层会被所有实例共享，防抖节流这类有状态的装饰器必须做实例级隔离。

多个装饰器叠加时，求值从上到下，应用从下到上，离目标近的先生效。

提案本身已经大改过，参数形态和返回值语义都变了，具体阶段以 TC39 仓库和 MDN 为准。老项目里的 legacy 写法还会存在很久，读得懂它比追新更实用。

## 参考

- [TC39 装饰器提案](https://github.com/tc39/proposal-decorators)
- [MDN Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
- [Babel plugin-proposal-decorators](https://babeljs.io/docs/babel-plugin-proposal-decorators)
- [TypeScript Decorators 文档](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [core-decorators 常用装饰器实现](https://github.com/jayphelps/core-decorators)
- [前端进阶之旅](https://interview.poetries.top)
