---
title: ES6 Set、WeakSet、Map、WeakMap 用法与区别详解
date: 2019-09-22 15:50:43
description: 四种 ES6 集合类型的完整梳理，包含 SameValueZero 判等规则、实例方法清单、与数组和对象的相互转换、弱引用为什么不能遍历，以及这几年新增的集合运算和分组方法。
tags:
  - JavaScript
  - ES6
  - 数据结构
  - WeakMap
categories: Front-End
---

数组去重写 `[...new Set(arr)]`，这个大家都会。但再往下问一层就容易卡壳：为什么 `Set` 里 `NaN` 只会存一个，而 `===` 明明说 `NaN !== NaN`？给 DOM 节点挂一份额外数据，用 `WeakMap` 和用普通对象到底差在哪？`Map` 和普通对象都是键值对，什么时候该换成 `Map`？

这篇把这四个结构一次讲清楚，每个都给出判等规则、方法清单、转换手法和适用场景，最后补一节这几年新增的能力。文中的结论我在 Node 22.23.1 上逐条验证过。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `Set` 的判等规则 SameValueZero，以及它和严格相等的两处差别
- `Set` 的实例方法清单，交集并集差集的手写实现
- `WeakSet` 和 `WeakMap` 的弱引用到底弱在哪，为什么它们不能遍历
- `Map` 的键为什么是跟内存地址绑定的，以及和 Object 的性能取舍
- Map 与 Array、Object、JSON 之间的六种转换写法
- 这几年新增的集合运算方法、分组方法和 WeakRef

`Set` 和 `Map` 主要的应用场景在于数据重组和数据储存。`Set` 是一种叫做集合的数据结构，`Map` 是一种叫做字典的数据结构。

## 一、集合（Set）

`ES6` 新增的一种新的数据结构，类似于数组，但成员是唯一且无序的，没有重复的值。

Set 本身是一种构造函数，用来生成 Set 数据结构：

```js
new Set([iterable])
```

举个例子：

```js
const s = new Set();
[1, 2, 3, 4, 3, 2, 1].forEach(x => s.add(x));

for (let i of s) {
    console.log(i)	// 1 2 3 4
}

// 去重数组的重复对象
let arr = [1, 2, 3, 2, 1, 1];
console.log([... new Set(arr)])	// [1, 2, 3]
```

这里有个坑要注意，原文这两段代码是没有分号的，直接跑会报错。原因是自动分号插入不会在行尾是 `)` 而下一行以 `[` 开头时补分号，`const s = new Set()` 换行接 `[1, 2, 3...]` 会被解析成 `new Set()[1, 2, 3, 4, 3, 2, 1]`，也就是取属性而不是新建数组。这类问题在不写分号的代码风格里挺常见，行首是 `[`、`(`、`` ` ``、`+`、`-` 这五种字符时都要当心。上面的代码我补上了分号。

Set 对象允许你储存任何类型的唯一值，无论是原始值或者是对象引用。

### 1.1 判等规则 SameValueZero

向 Set 加入值的时候不会发生类型转换，所以 `5` 和 `"5"` 是两个不同的值。Set 内部判断两个值是否不同，使用的算法叫做「SameValueZero」，它类似于精确相等运算符（`===`），主要的区别是 Set 认为 `NaN` 等于自身，而精确相等运算符认为 `NaN` 不等于自身。

```js
let set = new Set();
let a = NaN;
let b = NaN;
set.add(a);
set.add(b);
set // Set {NaN}

let set1 = new Set()
set1.add(5)
set1.add('5')
console.log([...set1])	// [5, "5"]
```

把这条规则说完整一点，JavaScript 里一共有四套判等：

| 算法 | 对应写法 | NaN 与 NaN | +0 与 -0 |
|------|----------|------------|----------|
| 宽松相等 | `==` | 不等 | 相等 |
| 严格相等 | `===` | 不等 | 相等 |
| SameValueZero | `Set` / `Map` / `includes` | 相等 | 相等 |
| SameValue | `Object.is` | 相等 | 不等 |

`Set`、`Map`、`Array.prototype.includes` 走的都是 SameValueZero，所以 `[NaN].includes(NaN)` 是 `true` 而 `[NaN].indexOf(NaN)` 是 `-1`。这个差别偶尔会咬人。

对象引用不参与值比较，两个内容一样的对象在 Set 里是两个成员。想按内容去重，得先序列化成字符串再去重，或者自己写一轮比较。

### 1.2 实例属性

- `constructor`：构造函数
- `size`：元素数量

```JS
let set = new Set([1, 2, 3, 2, 1])

console.log(set.length)	// undefined
console.log(set.size)	// 3
```

注意是 `size` 不是 `length`。这个设计上和 `Map` 保持一致，也和数组区分开了，因为 Set 没有下标的概念。

### 1.3 操作方法

- `add(value)`：新增，相当于 array 里的 push
- `delete(value)`：存在即删除集合中 value
- `has(value)`：判断集合中是否存在 value
- `clear()`：清空集合

```js
let set = new Set()
set.add(1).add(2).add(1)

set.has(1)	// true
set.has(3)	// false
set.delete(1)
set.has(1)	// false
```

`add` 返回的是 Set 本身，所以可以链式调用；`delete` 返回布尔值表示有没有删掉东西。这两个返回值的差别记一下，写链式的时候容易搞混。

`Array.from` 方法可以将 Set 结构转为数组：

```js
const items = new Set([1, 2, 3, 2])
const array = Array.from(items)
console.log(array)	// [1, 2, 3]
// 或
const arr = [...items]
console.log(arr)	// [1, 2, 3]
```

`has` 是 Set 最有价值的地方。数组的 `includes` 是线性查找，数据量一大就慢；Set 的 `has` 是基于哈希的，接近常数时间。判重、白名单校验、已访问节点标记这类场景，用 Set 替掉数组能带来数量级的差别。

### 1.4 遍历方法

遍历顺序为插入顺序，这一点是规范保证的，不是实现细节。

- `keys()`：返回一个包含集合中所有键的迭代器
- `values()`：返回一个包含集合中所有值的迭代器
- `entries()`：返回一个包含 Set 对象中所有元素的键值对迭代器
- `forEach(callbackFn, thisArg)`：用于对集合成员执行 callbackFn 操作，如果提供了 thisArg 参数，回调中的 this 会是这个参数，没有返回值

```js
let set = new Set([1, 2, 3])
console.log(set.keys())	// SetIterator {1, 2, 3}
console.log(set.values())	// SetIterator {1, 2, 3}
console.log(set.entries())	// SetIterator {1, 2, 3}

for (let item of set.keys()) {
  console.log(item);
}	// 1	2	 3
for (let item of set.entries()) {
  console.log(item);
}	// [1, 1]	[2, 2]	[3, 3]

set.forEach((value, key) =>  {
    console.log(key + ' : ' + value)
})	// 1 : 1	2 : 2		3 : 3
```

Set 里 `keys()` 和 `values()` 返回的是一样的东西，因为集合只有值没有键。`entries()` 给出的是 `[value, value]` 这种成对形式，纯粹是为了和 Map 的接口保持一致，实际很少用。

Set 可默认遍历，默认迭代器生成函数是 `values()` 方法：

```js
Set.prototype[Symbol.iterator] === Set.prototype.values	// true
```

我在 Node 22 上确认过这一行返回 `true`。这就是 `[...set]` 和 `for...of` 能直接用在 Set 上的原因，展开运算符找的就是 `Symbol.iterator`。

Set 本身没有 `map` 和 `filter`，但转成数组之后就有了：

```js
let set = new Set([1, 2, 3])
set = new Set([...set].map(item => item * 2))
console.log([...set])	// [2, 4, 6]

set = new Set([...set].filter(item => (item >= 4)))
console.log([...set])	//[4, 6]
```

因此，Set 很容易实现交集（Intersect）、并集（Union）、差集（Difference）：

```js
let set1 = new Set([1, 2, 3])
let set2 = new Set([4, 3, 2])

let intersect = new Set([...set1].filter(value => set2.has(value)))
let union = new Set([...set1, ...set2])
let difference = new Set([...set1].filter(value => !set2.has(value)))

console.log(intersect)	// Set {2, 3}
console.log(union)		// Set {1, 2, 3, 4}
console.log(difference)	// Set {1}
```

这三行是 2019 年的标准写法，现在有原生方法了，第七节会讲。

## 二、WeakSet

WeakSet 对象允许你将弱引用对象储存在一个集合中。

WeakSet 与 Set 的区别：

- WeakSet 只能储存对象引用，不能存放原始值，而 Set 两者都可以
- WeakSet 对象中储存的对象值都是被弱引用的，即垃圾回收机制不考虑 WeakSet 对该对象的引用。如果没有其他的变量或属性引用这个对象值，则这个对象将会被垃圾回收掉（不考虑该对象还存在于 WeakSet 中）。所以 WeakSet 对象里有多少个成员元素，取决于垃圾回收机制有没有运行，运行前后成员个数可能不一致，遍历结束之后有的成员可能取不到了。ES6 规定 WeakSet 不可遍历，也没有办法拿到它包含的所有元素

那为什么规范干脆禁掉遍历，而不是让你自己承担风险呢？

因为一旦允许遍历，垃圾回收的时机就变成了可观测的行为。同一段代码在不同引擎、不同内存压力下遍历出的结果会不一样，这在语言层面是不可接受的。禁掉遍历，弱引用就成了一个纯粹的内部实现细节。同理，WeakSet 也没有 `size` 属性。

属性：

- `constructor`：构造函数，任何一个具有 Iterable 接口的对象，都可以作参数

```js
const arr = [[1, 2], [3, 4]]
const weakset = new WeakSet(arr)
console.log(weakset)
```

<img width="677" alt="2019-03-08 9 24 34" src="https://user-images.githubusercontent.com/19721451/54000905-3d36c980-4184-11e9-9ccf-0f13bc6dd414.png">

上图是这段代码在控制台里的输出。注意能塞进去的是 `[1, 2]` 和 `[3, 4]` 这两个数组本身，数组是对象所以合法；如果换成 `new WeakSet([1, 2])`，直接抛 `Invalid value used in weak set`。

方法：

- `add(value)`：在 WeakSet 对象中添加一个元素 value
- `has(value)`：判断 WeakSet 对象中是否包含 value
- `delete(value)`：删除元素 value

```js
var ws = new WeakSet()
var obj = {}
var foo = {}

ws.add(window)
ws.add(obj)

ws.has(window)	// true
ws.has(foo)	// false

ws.delete(window)	// true
ws.has(window)	// false

```

原文这里还列了一个 `clear()` 并标注「该方法已废弃」。实际情况比废弃更彻底，它已经被完全移除了，我在 Node 22 上打印 `typeof WeakSet.prototype.clear` 得到的是 `undefined`，调用会直接报不是函数。原因也很直白，既然不能遍历，`clear` 就没有合理的语义，重新 `new` 一个更干净。

WeakSet 最典型的用途是给对象打标记，比如「这个 DOM 节点已经初始化过了」「这个实例已经被处理过了」。用普通 Set 打标记，节点从页面上移除之后 Set 还攥着它，节点永远回收不掉。这类由集合持有引用导致的泄漏我在 [JavaScript 内存泄漏排查](https://feinterview.poetries.top/blog/js-memory-leak) 那篇里写过排查方法。

## 三、字典（Map）

集合与字典的区别：

- 共同点：集合、字典可以储存不重复的值
- 不同点：集合是以 `[value, value]` 的形式储存元素，字典是以 `[key, value]` 的形式储存

```js
const m = new Map()
const o = {p: 'haha'}
m.set(o, 'content')
m.get(o)	// content

m.has(o)	// true
m.delete(o)	// true
m.has(o)	// false
```

任何具有 Iterator 接口、且每个成员都是一个双元素的数组的数据结构，都可以当作 `Map` 构造函数的参数：

```js
const set = new Set([
  ['foo', 1],
  ['bar', 2]
]);
const m1 = new Map(set);
m1.get('foo') // 1

const m2 = new Map([['baz', 3]]);
const m3 = new Map(m2);
m3.get('baz') // 3
```

如果读取一个未知的键，则返回 `undefined`：

```js
new Map().get('asfddfsasadf')
// undefined
```

### 3.1 键是跟内存地址绑定的

注意，只有对同一个对象的引用，Map 结构才将其视为同一个键。这一点要非常小心：

```js
const map = new Map();

map.set(['a'], 555);
map.get(['a']) // undefined
```

上面代码的 `set` 和 `get` 方法表面是针对同一个键，但实际上这是两个值，内存地址是不一样的，因此 `get` 方法无法读取该键，返回 `undefined`。

由上可知，Map 的键实际上是跟内存地址绑定的，只要内存地址不一样就视为两个键。这就解决了同名属性碰撞（clash）的问题，我们扩展别人的库的时候，如果使用对象作为键名，就不用担心自己的属性与原作者的属性同名。

如果 Map 的键是一个简单类型的值（数字、字符串、布尔值），则只要两个值严格相等，Map 将其视为一个键。比如 `0` 和 `-0` 就是一个键，布尔值 `true` 和字符串 `true` 则是两个不同的键。另外 `undefined` 和 `null` 也是两个不同的键。虽然 `NaN` 不严格相等于自身，但 Map 将其视为同一个键。

```js
let map = new Map();

map.set(-0, 123);
map.get(+0) // 123

map.set(true, 1);
map.set('true', 2);
map.get(true) // 1

map.set(undefined, 3);
map.set(null, 4);
map.get(undefined) // 3

map.set(NaN, 123);
map.get(NaN) // 123
```

这一段的判等规则和 Set 是同一套 SameValueZero，所以 `+0` 和 `-0` 归一、`NaN` 等于自身。回头看第一节那张表，就是同一行。

### 3.2 属性和方法

属性：

- `constructor`：构造函数
- `size`：返回字典中所包含的元素个数

```js
const map = new Map([
  ['name', 'An'],
  ['des', 'JS']
]);

map.size // 2
```

操作方法：

- `set(key, value)`：向字典中添加新元素
- `get(key)`：通过键查找特定的数值并返回
- `has(key)`：判断字典中是否存在键 key
- `delete(key)`：通过键 key 从字典中移除对应的数据
- `clear()`：将这个字典中的所有元素删除

遍历方法：

- `keys()`：将字典中包含的所有键名以迭代器形式返回
- `values()`：将字典中包含的所有数值以迭代器形式返回
- `entries()`：返回所有成员的迭代器
- `forEach()`：遍历字典的所有成员

```js
const map = new Map([
            ['name', 'An'],
            ['des', 'JS']
        ]);
console.log(map.entries())	// MapIterator {"name" => "An", "des" => "JS"}
console.log(map.keys()) // MapIterator {"name", "des"}
```

Map 结构的默认遍历器接口（`Symbol.iterator` 属性）就是 `entries` 方法：

```js
map[Symbol.iterator] === map.entries
// true
```

这行我也在 Node 22 上确认返回 `true`。所以 `for (const [k, v] of map)` 能直接解构，用的就是 `entries` 给出的 `[key, value]` 对。

对于 forEach，看一个例子：

```js
const reporter = {
  report: function(key, value) {
    console.log("Key: %s, Value: %s", key, value);
  }
};

let map = new Map([
    ['name', 'An'],
    ['des', 'JS']
])
map.forEach(function(value, key, map) {
  this.report(key, value);
}, reporter);
// Key: name, Value: An
// Key: des, Value: JS
```

在这个例子中，forEach 方法的回调函数的 this 就指向 reporter。这里回调的参数顺序是 `(value, key, map)`，值在前键在后，和直觉相反，写的时候容易搞反。另外第二个参数 `thisArg` 只对普通函数有效，回调写成箭头函数就绑不上了，因为箭头函数的 this 是词法作用域决定的。

### 3.3 与其他数据结构的相互转换

**1. Map 转 Array**

```js
const map = new Map([[1, 1], [2, 2], [3, 3]])
console.log([...map])	// [[1, 1], [2, 2], [3, 3]]
```

**2. Array 转 Map**

```js
const map = new Map([[1, 1], [2, 2], [3, 3]])
console.log(map)	// Map {1 => 1, 2 => 2, 3 => 3}
```

**3. Map 转 Object**

Map 的键可以是任意类型，而 Object 的键只能是字符串或者 Symbol，所以转换的时候非字符串键名会被转换为字符串键名。这一步是有损的，两个不同的对象键转成字符串之后可能撞到一起。

```js
function mapToObj(map) {
    let obj = Object.create(null)
    for (let [key, value] of map) {
        obj[key] = value
    }
    return obj
}
const map = new Map().set('name', 'An').set('des', 'JS')
mapToObj(map) // {name: "An", des: "JS"}
```

现在有更短的写法，`Object.fromEntries(map)` 一行就够，它是 ES2019 加的。

**4. Object 转 Map**

```js
function objToMap(obj) {
    let map = new Map()
    for (let key of Object.keys(obj)) {
        map.set(key, obj[key])
    }
    return map
}

objToMap({'name': 'An', 'des': 'JS'}) // Map {"name" => "An", "des" => "JS"}
```

同样也有短写法，`new Map(Object.entries(obj))`。

**5. Map 转 JSON**

```js
function mapToJson(map) {
    return JSON.stringify([...map])
}

let map = new Map().set('name', 'An').set('des', 'JS')
mapToJson(map)	// [["name","An"],["des","JS"]]
```

这里要提醒一句，`JSON.stringify(map)` 直接传 Map 得到的是 `{}`，不是你想要的。因为 Map 的数据存在内部槽里，不是自有属性，序列化看不到。所以必须先展开成数组。这个我踩过，接口传过去的数据是个空对象，找了一会儿才想起来是 Map 没转。

**6. JSON 转 Map**

```js
function jsonToStrMap(jsonStr) {
  return objToMap(JSON.parse(jsonStr));
}

jsonToStrMap('{"name": "An", "des": "JS"}') // Map {"name" => "An", "des" => "JS"}
```

## 四、WeakMap

WeakMap 对象是一组键值对的集合，其中的键是弱引用对象，而值可以是任意类型。

注意，WeakMap 弱引用的只是键名，而不是键值，键值依然是正常引用。

WeakMap 中，每个键对自己所引用对象的引用都是弱引用。在没有其他引用和该键引用同一对象时，这个对象将会被垃圾回收（相应的 key 则变成无效的），所以 WeakMap 的 key 是不可枚举的。

属性：

- `constructor`：构造函数

方法：

- `has(key)`：判断是否有 key 关联对象
- `get(key)`：返回 key 关联对象（没有则返回 undefined）
- `set(key, value)`：设置一组 key 关联对象
- `delete(key)`：移除 key 的关联对象

```js
let myElement = document.getElementById('logo');
let myWeakmap = new WeakMap();

myWeakmap.set(myElement, {timesClicked: 0});

myElement.addEventListener('click', function() {
  let logoData = myWeakmap.get(myElement);
  logoData.timesClicked++;
}, false);
```

这个例子正好说明了 WeakMap 的价值。给 DOM 节点关联一份额外数据，有三种做法。

写在 DOM 节点自己身上（`el.__data = ...`）会污染节点，而且和框架、第三方库容易撞名。用普通 `Map` 存，节点从文档里移除之后，Map 还持有它的引用，整棵子树都回收不了，页面反复渲染就是稳定的内存增长。换成 `WeakMap`，节点没人引用了就连带这份数据一起被回收，不需要你手动 `delete`。

有一点必须说清楚，弱的是键，不是值。如果你在 value 里反过来引用了 key 对应的那个对象，就形成了一条从 WeakMap 内部指向 key 的强引用链，回收照样发生不了。这是使用 WeakMap 时最容易忽略的坑。

WeakMap 的另一个经典用途是给类实现私有数据。在 `#private` 字段普及之前，大家用的就是这个套路：

```js
const _private = new WeakMap()

class Counter {
  constructor() {
    _private.set(this, { count: 0 })
  }
  inc() {
    _private.get(this).count++
  }
}
```

实例被回收时，那份私有数据自动跟着走。现在直接写 `#count` 更省事，但理解这个模式有助于看懂一些老库的源码。

## 五、四种结构怎么选

- Set
  - 成员唯一、无序且不重复
  - `[value, value]`，键值与键名是一致的（或者说只有键值，没有键名）
  - 可以遍历，方法有 add、delete、has
- WeakSet
  - 成员都是对象
  - 成员都是弱引用，可以被垃圾回收机制回收，可以用来保存 DOM 节点，不容易造成内存泄漏
  - 不能遍历，方法有 add、delete、has
- Map
  - 就是键值对的集合，键可以是任意类型
  - 可以遍历，方法很多，可以跟各种数据格式转换
- WeakMap
  - 只接受对象作为键名（null 除外），不接受其他类型的值作为键名
  - 键名是弱引用，键值可以是任意的，键名所指向的对象可以被垃圾回收，此时键名是无效的
  - 不能遍历，方法有 get、set、has、delete

选的时候我一般按两个问题走。

第一个问题：需要键值对还是只需要成员？只判断「在不在」用 Set，要存关联数据用 Map。

第二个问题：这些键的生命周期归谁管？如果键的存活由别处决定（DOM 节点、组件实例、第三方传进来的对象），用 Weak 版本；如果由你自己管，用普通版本。

至于 Map 和普通对象怎么选，我的判断是：键不是字符串、需要频繁增删、需要知道数量、需要按插入顺序遍历，这四条命中任意一条就上 Map。反过来，纯粹的配置对象、需要 JSON 序列化的数据结构，还是用普通对象方便。

## 六、扩展：Object 与 Set、Map

**1. Object 与 Set**

```JS
// Object
const properties1 = {
    'width': 1,
    'height': 1
}
console.log(properties1['width']? true: false) // true

// Set
const properties2 = new Set()
properties2.add('width')
properties2.add('height')
console.log(properties2.has('width')) // true
```

用对象模拟集合有个隐患，`properties1['width'] ? true : false` 这种写法在值为 `0`、`''`、`false` 时会误判成不存在。Set 的 `has` 不看值只看有没有这个成员，语义干净得多。另外用对象当 map 还得防着原型链上的 `toString`、`constructor` 这些键，`Object.create(null)` 是常见的绕法。

**2. Object 与 Map**

JS 中的对象（Object）说到底也是键值对的集合（hash 结构）。

```js
const data = {};
const element = document.getElementsByClassName('App');

data[element] = 'metadata';
console.log(data['[object HTMLCollection]']) // "metadata"
```

当以一个 DOM 节点作为对象 data 的键时，对象会被自动转化为字符串 `[object HTMLCollection]`。所以说，Object 结构提供了「字符串对应值」，Map 则提供了「值对应值」。

这个例子里的问题不止是「键变成了字符串」，更要命的是**所有 HTMLCollection 都会转成同一个字符串**，你存第二个元素就把第一个覆盖了，而且不报错。这就是 Map 存在的核心理由。

## 七、这几年新增的能力

原文写于 2019 年，这几年这块又加了一些东西，简单列一下。以下这些我都在 Node 22.23.1 上跑通过。

**Set 有原生的集合运算了。** ES2025 给 Set 加了七个方法，第一节手写的交集并集差集现在可以直接调：

```js
const s1 = new Set([1, 2, 3])
const s2 = new Set([4, 3, 2])

s1.union(s2)                // Set {1, 2, 3, 4}
s1.intersection(s2)         // Set {2, 3}
s1.difference(s2)           // Set {1}
s1.symmetricDifference(s2)  // Set {1, 4}
s1.isSubsetOf(s2)           // false
s1.isSupersetOf(s2)         // false
s1.isDisjointFrom(s2)       // false
```

比 `[...s1].filter(...)` 那套写法直观得多，性能也更好，因为不用来回构造中间数组。浏览器支持情况建议查一下 caniuse 再用，老项目里还是得留降级路径。

**分组方法。** `Object.groupBy` 和 `Map.groupBy` 是 ES2024 加的，后者返回 Map，所以分组的键可以是任意值：

```js
const list = [
  { type: 'a', v: 1 },
  { type: 'b', v: 2 },
  { type: 'a', v: 3 },
]
Map.groupBy(list, item => item.type)
// Map { 'a' => [...], 'b' => [...] }
```

以前这种事都是自己写 `reduce`，现在少一段样板代码。

**Object.fromEntries。** 前面提过，Map 转对象一行搞定，反向用 `Object.entries` 配合 `new Map()`。

**WeakRef 和 FinalizationRegistry。** ES2021 加的，前者持有一个可以被回收的弱引用，后者在对象被回收时触发回调。官方文档明确写了不建议在业务代码里用，因为回收时机不确定，行为跨引擎不一致。知道有这么个东西就行。

**Symbol 可以当 WeakMap 的键了。** 较新的引擎允许把非注册的 Symbol 作为 WeakMap 和 WeakSet 的键，我在 Node 22 上试了一下确实不报错了。这块我只在 Node 上验证过，浏览器端各版本的支持情况没挨个测。

## 总结

四个结构的分工其实很清楚。Set 管「有没有」，Map 管「对应什么」，Weak 版本管「这份数据的生命周期跟着别人走」。

判等规则是 Set 和 Map 共用的一套 SameValueZero，两个特征记住就够：`NaN` 等于自身，`+0` 和 `-0` 算同一个。所以 `[NaN].includes(NaN)` 是 `true` 而 `indexOf` 找不到。对象键按引用比，内容一样的两个字面量是两个不同的键。

Weak 系列不能遍历、没有 `size`，这不是功能缺失而是刻意设计。允许遍历就等于把垃圾回收时机变成可观测行为，同一段代码在不同引擎下结果不一样。`WeakSet.prototype.clear` 已经被彻底移除了，不只是废弃。用 WeakMap 时记住弱的只是键，value 里反向引用 key 会让回收整个失效。

Map 和 Object 的取舍，我的标准是四条命中一条就上 Map：键不是字符串、频繁增删、需要知道数量、需要按插入顺序遍历。另外 `JSON.stringify` 直接传 Map 得到的是空对象，序列化前必须先展开成数组。

原文写于 2019 年，那时候交集并集还得用 `filter` 手写。现在 Set 有了原生的七个集合运算方法，`Map.groupBy` 也省掉了一段 reduce 样板。老写法依然能跑，只是没必要了。

## 参考

- [Set - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Set)
- [WeakSet - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)
- [Map - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Map)
- [WeakMap - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
- [Equality comparisons and sameness - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness)
- [Map.groupBy - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Map/groupBy)
- [WeakRef - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakRef)
- [ES6 入门总结](https://feinterview.poetries.top/blog/es6-review-summary)
- [前端进阶之旅](https://interview.poetries.top)
