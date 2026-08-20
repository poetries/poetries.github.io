---
title: JavaScript深浅拷贝原理与手写实现
description: 从栈内存与堆内存的差别讲起，理清赋值、浅拷贝、深拷贝三者的界线，梳理常见浅拷贝 API 的边界，手写深拷贝怎么处理循环引用与 Date/RegExp/Map/Set，以及 structuredClone 该怎么选。
date: 2018-12-21 18:08:43
tags:
  - JavaScript
  - 深浅拷贝
  - structuredClone
categories: Front-End
---

改一个表单的时候踩过这么一次。表单初始值存了一份 `initialForm`，用户编辑的是 `form`，点重置的时候把 `initialForm` 赋回去。结果测试提了个 bug，说重置按钮第二次点就没用了。排查了一下午才发现，`form = initialForm` 这行根本没复制任何东西，两个变量指的是同一个对象，用户一改 `form`，`initialForm` 跟着一起改了。

这类问题的根子在于，JS 里的赋值、浅拷贝、深拷贝是三件不同的事，但写起来长得很像。这篇把三者的界线画清楚，再把手写深拷贝里最容易漏掉的循环引用和特殊类型补上。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 基本类型和引用类型在内存里的存放差别
- 赋值为什么不算拷贝
- 浅拷贝的四种常见写法，以及它们各自的边界
- `JSON.parse(JSON.stringify())` 到底丢了什么
- 手写深拷贝的完整版，含循环引用处理
- `Date`、`RegExp`、`Map`、`Set`、`Symbol` 这些特殊类型怎么办
- 浏览器和 Node 内置的 `structuredClone`
- 实际项目里该怎么选

## 一、先把栈和堆分清楚

在 JS 里变量的类型可以大致分成两种，基本数据类型和引用数据类型。基本数据类型指的是简单的数据段，包括 `undefined`、`Null`、`Boolean`、`Number`、`String`。字符串在一些其他语言里是被当做对象使用的，属于引用类型，但在 JS 里它是基本类型。

而引用类型的值指的是可能包含多个值的对象。这两类值的差别，是因为基本数据类型保存在栈内存，引用类型保存在堆内存中。

为什么要分两种保存方式呢？根本原因在于，保存在栈内存里的必须是大小固定的数据。引用类型的大小不固定，一个对象可以随时加属性、一个数组可以随时 push，只能放到堆里，然后把它在堆里的地址写在栈内存中以供访问。

```js
var a = 1;//定义了一个number类型
var obj1 = {//定义了一个object类型
    name:'obj'
};
```

执行这段代码之后，内存空间里大概是这样的。

![栈内存保存基本类型的值和引用类型的地址，堆内存保存对象实体](https://s.poetries.top/gitee/2019/10/314.png)

因为这种保存方式的存在，我们在操作变量的时候，如果是基本数据类型，就是按值访问，操作的就是变量保存的值。如果是引用类型的值，我们只是通过保存在变量中的地址去操作实际对象。

所谓的深浅拷贝问题，全部是从这张图里长出来的。

## 二、赋值根本不是拷贝

回到开头那个表单的例子。

```js
const initialForm = { name: 'poetry', tags: ['前端'] };
const form = initialForm;

form.name = 'changed';
console.log(initialForm.name); // 'changed'
```

`form = initialForm` 这行做的事情，是把栈里那个地址复制了一份。堆里的对象只有一个，两个变量指着同一个门牌号。所以改哪个都一样。

基本类型就不会有这个问题：

```js
let a = 1;
let b = a;
b = 2;
console.log(a); // 1
```

因为栈里存的就是值本身，复制的是值，两份互不相干。

分清这一点之后再看拷贝就简单了。拷贝要解决的问题是「我想要一个新的堆对象，内容和原来一样，但改它不影响原来那个」。按「复制多深」分成两档，只复制第一层的叫浅拷贝，一路递归下去的叫深拷贝。

## 三、浅拷贝只管第一层

### 3.1 手写一个

先看最原始的写法，理解浅拷贝到底做了什么。

```js
// 假设有两个对象

var objA = {
  a: 'aa',
  b: 'bb'
};
var objB = {};
```

现在想把对象 A 的值复制给 B。由于对象 A 的两个值都是原始类型，用浅拷贝就够了。

```js
// 现在想把对象A的值复制给B，由于对象A的两个值都是原始类型，用浅复制即可

function copy(sub, sup) {
  for (var key in sup) {
    sub[key] = sup[key];
  }
}
copy(objB, objA);
```

这里有个坑要注意，`for...in` 会连原型链上可枚举的属性一起遍历出来。如果你给 `Object.prototype` 挂过东西（或者用了某些老库），拷出来的对象会多出你没预料到的键。稳妥一点的写法是加一道 `hasOwnProperty` 过滤。

关于属性的可枚举性到底由什么控制，可以看 `Object.defineProperty` 里的 `enumerable` 描述符，那篇讲得更细。

### 3.2 Object.assign

```
Object.assign() (兼容性不好)
```

原文这里写「兼容性不好」，那是 2018 年的判断，当时还要照顾 IE。现在主流浏览器和 Node 都支持它，直接用就行。

它有两个容易忽略的行为。一是它会触发目标对象的 setter，也会读取源对象的 getter（拿到的是 getter 的返回值，不是 getter 本身）。二是它只拷贝自身的可枚举属性，包括 `Symbol` 键，但不拷贝原型链。

### 3.3 lodash 的 clone

```
_.clone()
```

`_.clone()` 是浅拷贝，`_.cloneDeep()` 才是深拷贝，别记混了。

### 3.4 数组的 concat 和 slice

数组中 `concat` 和 `slice` 方法都返回新数组，也都是浅拷贝。

```js
const arr = [{ name: 'poetries' }];
const copy1 = arr.concat();
const copy2 = arr.slice();

copy1[0].name = 'changed';
console.log(arr[0].name); // 'changed'
```

新数组是新的，但里面装的对象还是原来那几个。这一点在处理接口返回的列表数据时最容易翻车，你以为 `slice()` 了一份就安全了，改一改发现源数据也变了。

### 3.5 ES6 展开运算符

```js
var arr = [{name:'poetries',age:22}]

var target = [...arr]
```

展开运算符和 `Object.assign` 的行为接近，也是浅的。有一处差别，展开运算符是直接定义新属性，不会触发目标对象上已有的 setter；`Object.assign` 会。大部分场景下感知不到，但如果你在往一个带 setter 的响应式对象上合并数据，这个差别就是 bug 的来源。

## 四、深拷贝的几种现成方案

简单来说，深复制就是当遇到值是对象类型的时候，就再运行一遍复制。

### 4.1 JSON.parse(JSON.stringify(obj))

简单粗暴又有点 dirty，但是能满足日常需求。它只能处理 JSON 能理解的数据格式，性能也没有特别好。

具体丢了什么，值得单独列一下，因为这几条几乎是面试必问：

| 原值 | 序列化后 |
|------|----------|
| `undefined` | 对象属性被整个丢掉，数组元素变 `null` |
| 函数 | 同上，被丢掉 |
| `Symbol` 值 / `Symbol` 键 | 被丢掉 |
| `Date` | 变成 ISO 字符串，不再是 Date 对象 |
| `RegExp` | 变成空对象 `{}` |
| `Map` / `Set` | 变成空对象 `{}` |
| `NaN` / `Infinity` | 变成 `null` |
| 循环引用 | 直接抛 `TypeError` |
| `BigInt` | 直接抛 `TypeError` |

还有一条更隐蔽的，如果对象上定义了 `toJSON` 方法，`JSON.stringify` 会用它的返回值。`Date` 变成字符串正是因为这个。

我自己的感受是，这个方案适合拷贝纯数据的接口响应，不适合拷贝任何带行为的对象。

### 4.2 lodash 的 cloneDeep

`_.cloneDeep()` 很好地兼容了 ES6 的新引用类型，而且处理了环型对象（循环引用）的情况。项目里已经装了 lodash 的话，这是最省事的选择。

### 4.3 jQuery 的 clone 和 extend

`$.clone()` / `$.extend(true, {}, obj)` 这套源码适合初学者学习，比较好理解。放在今天新项目里当然不会为了拷贝对象去引 jQuery，但它的实现思路值得读一遍。

## 五、手写一个深拷贝

面试里真正要考的是这一段。先看原文给的版本：

```js
function deepCopy (obj) {
    var result;

    //引用类型分数组和对象分别递归
    if (Object.prototype.toString.call(obj) == '[object Array]') {
      result = []
      for (i = 0; i < obj.length; i++) {
        result[i] = deepCopy(obj[i])
      }
    } else if (Object.prototype.toString.call(obj) == '[object Object]') {
      result = {}
      for (var attr in obj) {
        result[attr] = deepCopy(obj[attr])
      }
    }
    //值类型直接返回
    else {
      return obj
    }
    return result
}
```

思路是对的，用 `Object.prototype.toString.call` 判断类型比 `typeof` 精确，数组和对象分别递归，基本类型直接返回。

不过这版有几个问题。`for (i = 0; ...)` 里的 `i` 少写了 `var`，非严格模式下会变成隐式全局变量，递归的时候还会互相覆盖，这是原文的一处笔误，实际用的时候要补上。这类隐式全局变量也是内存泄漏的典型来源，可以看看 [JS内存泄漏与垃圾回收机制完全梳理](https://feinterview.poetries.top/blog/js-memory-leak)。

更要命的是它处理不了循环引用。

### 5.1 循环引用会把栈撑爆

```js
const a = { name: 'a' };
a.self = a;

deepCopy(a); // RangeError: Maximum call stack size exceeded
```

`a.self` 指回 `a` 自己，递归永远到不了底。解决办法是拿一张表记住「这个对象我已经拷过了，拷出来的是哪一个」，再遇到就直接返回记录里的那份。

用 `WeakMap` 存这张表最合适，它的键是弱引用，拷贝函数跑完之后表里的对象不会因为被这张表引用着而无法回收。关于弱引用集合的具体行为，[Set WeakSet Map WeakMap 梳理](https://feinterview.poetries.top/blog/es6-set-weakSet-map-weakMap) 里有更完整的说明。

```js
function deepClone(source, cache = new WeakMap()) {
  if (source === null || typeof source !== 'object') return source;

  // 命中缓存说明这个对象在本次拷贝中已经出现过，直接返回上次的结果
  if (cache.has(source)) return cache.get(source);

  const target = Array.isArray(source) ? [] : {};
  cache.set(source, target);

  Object.keys(source).forEach((key) => {
    target[key] = deepClone(source[key], cache);
  });

  return target;
}
```

关键在于 `cache.set(source, target)` 这行的位置，它必须写在递归之前。先登记再递归，环绕回来的时候才能命中缓存。写在后面就等于没写。

### 5.2 特殊类型要单独处理

上面那版还是只认对象和数组。真实数据里经常混着 `Date`、`RegExp`、`Map`、`Set`，一律当普通对象遍历的话，拷出来的是一个属性全空的壳。

```js
function cloneSpecial(source) {
  const tag = Object.prototype.toString.call(source);

  if (tag === '[object Date]') return new Date(source.getTime());
  if (tag === '[object RegExp]') return new RegExp(source.source, source.flags);
  if (tag === '[object Error]') return new Error(source.message);
  return null; // 交给通用逻辑
}
```

`Map` 和 `Set` 要连里面的键值一起递归：

```js
if (source instanceof Map) {
  const target = new Map();
  cache.set(source, target);
  source.forEach((v, k) => target.set(k, deepClone(v, cache)));
  return target;
}

if (source instanceof Set) {
  const target = new Set();
  cache.set(source, target);
  source.forEach((v) => target.add(deepClone(v, cache)));
  return target;
}
```

还有两块常被漏掉。一是 `Symbol` 作为键的属性，`Object.keys` 拿不到，得用 `Reflect.ownKeys(source)` 才能连 `Symbol` 键一起遍历。二是原型，如果你想让拷贝出来的对象还是原来那个 class 的实例，得用 `Object.create(Object.getPrototypeOf(source))` 建目标对象，而不是直接写 `{}`。

至于函数，一般不拷贝，直接返回原引用就行。函数是无状态的，共享一份没什么问题，真要「拷贝」也拷不出等价的闭包。

说实话我自己写的深拷贝也很少做到面面俱到，项目里遇到复杂结构还是直接上 `_.cloneDeep`。手写这套的意义更多在于知道边界在哪，出问题的时候知道往哪儿看。

## 六、structuredClone 已经是内置的了

原文写于 2018 年，那时候只能自己写或者引库。现在浏览器和 Node 都内置了结构化克隆算法的入口 `structuredClone`，Node 从 17 开始也在全局暴露了它。

```js
const source = { d: new Date(), m: new Map([['k', 1]]), arr: [1, 2] };
source.self = source; // 循环引用

const copy = structuredClone(source);
console.log(copy.d instanceof Date); // true
console.log(copy.self === copy); // true
```

一行搞定循环引用、`Date`、`RegExp`、`Map`、`Set`、`ArrayBuffer`、`Blob`、`File`，这个设计是真的舒服。

但它也有明确的边界，用之前要知道：

- 函数拷不了，遇到会抛 `DataCloneError`
- `Symbol` 拷不了，同样抛错
- DOM 节点拷不了
- 不保留原型链，class 实例拷完变成普通对象
- 不保留属性描述符，getter/setter 会被求值成普通数据属性

所以它替代不了 `_.cloneDeep`，两者覆盖的场景不完全重合。我的判断是，如果你拷的是纯数据结构（包括 `Map`、`Set`、二进制），优先用 `structuredClone`，零依赖且是引擎原生实现。如果结构里有 class 实例或者需要保留 getter，还是老老实实上 lodash。

## 七、实际项目里怎么选

先说结论，绝大多数场景根本不需要深拷贝。

React 和 Vue 这类框架推的是不可变更新，你要改的往往只是对象里的一两层，用展开运算符构造一个新对象就够了：

```js
setForm((prev) => ({ ...prev, profile: { ...prev.profile, name: 'poetry' } }));
```

这样只有被改的路径上的对象是新的，其他分支还是原来那些引用。深拷贝会把整棵树都换成新对象，反而让框架的引用比较全部失效，该跳过的重渲染也跳不过去了。

真的需要整份拷贝的场景，我自己的顺序是这样：

1. 纯 JSON 数据、不在意 `Date` 精度，`JSON.parse(JSON.stringify())` 一行了事
2. 有 `Date`/`Map`/`Set`/循环引用，用 `structuredClone`
3. 有 class 实例、getter、`Symbol` 键，用 `_.cloneDeep`
4. 上面都不满足，才自己写，并且一定要带 `WeakMap` 缓存

## 总结

深浅拷贝这题看着简单，考的其实是你脑子里有没有那张栈和堆的图。赋值复制的是栈里的地址，浅拷贝复制的是第一层的值（对象属性还是地址），深拷贝才是把堆里的结构整个复刻一份。

浅拷贝的几个 API 差别很小但不是没有，`Object.assign` 会触发 setter、展开运算符不会，这类细节在响应式框架里会放大成真问题。

手写深拷贝的两个必答点是循环引用和特殊类型。循环引用靠 `WeakMap` 缓存，缓存的登记动作必须写在递归之前；特殊类型要按 `Object.prototype.toString` 的 tag 分开处理，`Map`/`Set` 还得递归内部的键值。

`structuredClone` 现在是浏览器和 Node 都有的内置能力，能覆盖循环引用和大部分内置类型，但它拷不了函数、`Symbol` 和原型链。知道这条边界，比记住十种深拷贝写法有用得多。

## 参考

- [MDN 结构化克隆算法](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
- [MDN structuredClone](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/structuredClone)
- [MDN Object.assign](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
- [MDN JSON.stringify](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
- [lodash cloneDeep](https://lodash.com/docs/#cloneDeep)
- [前端进阶之旅](https://interview.poetries.top)
