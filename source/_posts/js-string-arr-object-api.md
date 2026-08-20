---
title: JavaScript字符串、对象、数组常用方法速查
description: 讲透 slice、substr、substring 三个截取方法的差异和取舍，梳理对象遍历的 for in 与 for of 边界、属性顺序规则，并附数组方法索引表，帮你把常用 API 一次记牢。
date: 2018-02-23 15:10:12
tags:
  - JavaScript
  - API
  - 字符串
  - 对象
categories: Front-End
---

写一个手机号脱敏的小函数，我先用了 `substr`，同事 review 说这个方法在 MDN 上标着「已废弃」，让我换成 `slice`。换完发现负数索引的行为不太一样，又跑去试 `substring`，结果传负数直接被当成 0 处理了。三个名字长得像的方法，行为各不相同，这种事情不查文档真记不住。

这篇把字符串截取的三兄弟、对象的几种遍历方式一次性对齐讲清楚。数组方法那部分做成索引，展开的内容我放在另一篇里，避免重复。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `slice`、`substr`、`substring` 三个截取方法到底差在哪，该用哪个
- 字符串还有哪些高频方法，以及 2018 之后新增的那几个
- 数组常用方法的索引表，一行一个，方便速查
- `for...in` 和 `for...of` 各自能遍历什么、不能遍历什么
- 对象属性的枚举顺序规则，那个「整数键会被排序」的坑
- `Object.keys`、`entries`、`fromEntries` 这一套静态方法怎么组合用

## 一、字符串截取的三兄弟

### 1.1 slice

`stringObject.slice(start, end)`

```javascript
var a = 'Hello world!';
var b = a.slice(2);
var c = a.slice(-4, -2);
// a: 'Hello world!'
// b: 'llo world!'
// c: 'rl'，参数可为负
```

`slice` 取的是 `[start, end)` 这个左闭右开区间。负数参数会自动加上字符串长度，`-4` 就是倒数第四个字符。`a.slice(-4, -2)` 从倒数第四位取到倒数第三位，得到 `'rl'`。

如果 `start` 比 `end` 大，`slice` 不做任何补救，直接返回空字符串。

### 1.2 substr

`stringObject.substr(start, length)`

```javascript
var a = 'Hello world!';
var b = a.substr(0, 4);
var c = a.substr(-5, 2);
// a: 'Hello world!'
// b: 'Hell'
// c: 'or'，参数可为负
```

`substr` 是唯一一个第二个参数表示「长度」而不是「结束位置」的。这也是最容易记混的一点，`a.substr(0, 4)` 是取 4 个字符，`a.slice(0, 4)` 是取到下标 4 之前。碰巧这两个在起点为 0 时结果相同，换个起点就分道扬镳了。

这里得补一句现状。`String.prototype.substr` 现在被放在 ECMAScript 规范的 Annex B 里，也就是「为了兼容存量网页保留的遗留特性」。它不会被移除，各家浏览器还会一直支持，但 MDN 上明确标了 deprecated，新代码里不建议再写。要按长度截取，用 `slice(start, start + length)` 表达同一件事。

### 1.3 substring

`stringObject.substring(start, stop)`

```javascript
var a = 'Hello world!';
var b = a.substring(0, 4);
var c = a.substring(3, 2);
var d = a.substring(0, -1);
// a: 'Hello world!'
// b: 'Hell'
// c: 'l'，start 比 stop 大，交换这两个参数
// d: ''，参数为负，返回空字符串
```

`substring` 有两个很特别的行为。一是发现 `start` 大于 `stop` 会自动把两个参数对调，二是负数一律当 0 处理。

第一条在特定场景下挺方便，你不用关心用户输入的两个下标谁大谁小。但它同时也是 bug 的温床，因为出错的时候你得不到任何反馈，只会拿到一段莫名其妙但看起来合法的字符串。我自己的习惯是统一用 `slice`，行为最好预测。

`slice`、`substr`、`substring` 都是字符串的切割方法，三者之间有细微的区别，根据不同的使用场景可以灵活使用。三种方法都是生成新的字符串，而不是修改原 `string`。字符串在 JS 里是不可变的，所有看起来像「修改字符串」的方法，实际上都在返回新的字符串。

一张表收尾：

| 方法 | 第二个参数含义 | 负数处理 | start > end 时 | 现状 |
|------|----------------|----------|----------------|------|
| `slice` | 结束下标（不含） | 加上长度 | 返回空串 | 推荐 |
| `substr` | 截取长度 | 加上长度 | 不适用 | Annex B 遗留特性 |
| `substring` | 结束下标（不含） | 当作 0 | 自动交换参数 | 可用，行为怪 |

## 二、字符串还有这些高频方法

原文只列了截取的部分，实际业务里还有几个用得同样多，顺手补齐。

判断包含关系用 `includes`、`startsWith`、`endsWith`（ES2015），比以前写 `indexOf(x) !== -1` 直观得多。

去空白用 `trim`，只去一头用 `trimStart` 和 `trimEnd`（ES2019）。表单提交前先 `trim` 一下，能省掉一半的「为什么后端说我账号不存在」的排查。

补位用 `padStart` 和 `padEnd`（ES2017）。做时间格式化的时候 `String(m).padStart(2, '0')` 是标配写法。

替换全部匹配用 `replaceAll`（ES2021）。以前只能写 `replace(/x/g, y)`，字符串里带正则元字符的时候还得先转义，很烦。

按下标取字符用 `at`（ES2022），支持负数，`str.at(-1)` 拿最后一个字符。

还有一个坑要注意，上面这些方法处理的都是 UTF-16 码元而不是「人眼看到的字符」。emoji 和一些生僻字占两个码元，`'👍'.length` 是 2，用 `slice` 从中间切开会得到乱码。真要按字符处理，得用 `[...str]` 或者 `Array.from(str)` 先拆成数组，它们走的是字符串迭代器，认码点。

## 三、数组方法索引

数组这块方法太多，一个个展开会把这篇撑爆，而且我另开了一篇专门讲，包括每个方法改不改原数组、返回值边界、时间复杂度。这里只做一张索引表，需要展开的直接跳过去看 [JavaScript数组方法总结](https://feinterview.poetries.top/blog/javaScript-arr-summary)。

| 方法 | 一句话 | 改原数组 |
|------|--------|----------|
| `concat` | 连接数组或值，返回副本 | 否 |
| `slice` | 按区间截取，返回新数组 | 否 |
| `join` | 用分隔符拼成字符串 | 否 |
| `push` | 尾部追加，返回新长度 | 是 |
| `pop` | 删尾部一项，返回被删的值 | 是 |
| `unshift` | 头部插入，返回新长度 | 是 |
| `shift` | 删头部一项，返回被删的值 | 是 |
| `splice` | 从指定位置删除或插入 | 是 |
| `sort` | 排序，无参时按字符串比较 | 是 |
| `reverse` | 颠倒顺序 | 是 |
| `map` | 每项过一遍转换器，返回等长新数组 | 否 |
| `forEach` | 只跑副作用，没有返回值 | 否 |
| `find` / `findIndex` | 返回第一个满足条件的元素 / 下标 | 否 |
| `filter` | 返回全部满足条件的元素 | 否 |
| `reduce` / `reduceRight` | 从左 / 从右归并成一个值 | 否 |
| `some` | 有任意一项满足就返回 `true` | 否 |
| `every` | 全部满足才返回 `true` | 否 |

有两条我在这里单独拎出来，因为最容易翻车。

`sort` 无参数调用的时候，是把每一项转成字符串再按 UTF-16 码元比较，所以 `[1, 10, 8, 6, 9].sort()` 得到的是 `[1, 10, 6, 8, 9]`，`10` 排在 `8` 前面。排数字必须传比较函数：

```javascript
var a = [1, 10, 8, 6, 9];
var b = a.sort(function (prev, next) {
  return prev - next;
});
// a: [1, 6, 8, 9, 10]，修改了原数组
// b: [1, 6, 8, 9, 10]，返回修改后的数组
```

注意 `a` 和 `b` 指向的是同一个数组，`sort` 是原地排序，返回值只是为了方便链式调用。想不动原数组，2018 年的写法是 `[...a].sort(fn)`，现在有 `toSorted`（ES2023）可以直接用。

另一条是 `forEach` 没法中断。它没有返回值，只针对每个元素调用回调，代码是简洁，但 `break`、`continue` 都用不了，`return` 只结束当前这次回调。需要提前跳出就换 `for...of` 或者 `some`。

`map`、`filter`、`reduce` 在业务里怎么组合、怎么选型，我单独写了一篇 [业务中处理数据结构常用的JS方法](https://feinterview.poetries.top/blog/js-map-reduce-find-filter)，那篇讲的是实战套路，跟这里的清单不重复。

## 四、对象怎么遍历

### 4.1 for in

`for-in` 循环实际是为循环 enumerable 对象而设计的，`for in` 也可以循环数组，但是不推荐这样使用。`for-in` 是用来循环带有字符串 key 的对象的方法。

```javascript
var obj = {a: 1, b: 2, c: 3};
for (var prop in obj) {
  console.log("obj." + prop + " = " + obj[prop]);
}
// print:  "obj.a = 1" "obj.b = 2" "obj.c = 3"
```

不推荐用它遍历数组，有两个具体原因。一是它拿到的 key 是字符串 `'0'`、`'1'` 而不是数字，做算术之前得先转。二是它会把数组对象上挂的其他可枚举属性也遍历出来。

第二条更要命的地方在于，`for...in` 会顺着原型链一路往上找。谁往 `Array.prototype` 或者 `Object.prototype` 上挂过东西（老库很爱干这事），你的循环里就会冒出没预料到的 key。所以规范的写法要加一道过滤：

```javascript
for (var prop in obj) {
  if (!Object.prototype.hasOwnProperty.call(obj, prop)) continue;
  console.log(prop, obj[prop]);
}
```

ES2022 给了个更短的写法，`Object.hasOwn(obj, prop)`，语义一样但不用绕 `call`。

### 4.2 for of

`for of` 为 ES6 提供，具有 `iterator` 接口，就可以用 `for of` 循环遍历它的成员。

`for of` 循环可以使用的范围包括数组、`Set` 和 `Map` 结构、某些类似数组的对象（比如 `arguments` 对象、`DOM NodeList` 对象）、`Generator` 对象，以及字符串。

那为什么普通对象不能直接 `for of` 呢？因为它身上没有 `Symbol.iterator`。`for...of` 拿到目标先去找这个方法，找不到就抛 `TypeError: obj is not iterable`。数组、`Set`、`Map`、字符串都在原型上部署了这个方法，普通对象没有。

一种解决方法是，用 `Object.keys` 方法将对象的键名生成一个数组，然后遍历这个数组。`Set`、`Map` 这些结构的迭代细节，可以看 [Set WeakSet Map WeakMap 梳理](https://feinterview.poetries.top/blog/es6-set-weakSet-map-weakMap)。

### 4.3 entries、keys、values

`entries()` 返回一个遍历器对象，用来遍历「键名, 键值」组成的数组。对于数组，键名就是索引值；对于 `Set`，键名与键值相同。`Map` 结构的 `iterator` 接口，默认就是调用 `entries` 方法。

`keys()` 返回一个遍历器对象，用来遍历所有的键名。

`values()` 返回一个遍历器对象，用来遍历所有的键值。

这三个方法调用后生成的遍历器对象，所遍历的都是计算生成的数据结构。

```javascript
// 遍历数组
let list = [1, 2, 3, 4, 5];
for (let e of list) {
    console.log(e);
}
// print: 1 2 3 4 5

// 遍历对象
let obj = {a: 1, b: 2, c: 3};
for (let key of Object.keys(obj)) {
  console.log(key, obj[key]);
}
// print:  a 1 b 2 c 3

// entries
let arr = ['a', 'b', 'c'];
for (let pair of arr.entries()) {
  console.log(pair);
}
// [0, 'a']
// [1, 'b']
// [2, 'c']
```

这里要分清两组同名方法。`arr.entries()` 是数组原型上的实例方法，返回迭代器；`Object.entries(obj)` 是 `Object` 上的静态方法，返回的是一个真数组。名字一样，返回值类型不一样，别记混。

配合解构用 `Object.entries` 遍历对象是我现在的默认写法，一次就能拿到 key 和 value：

```javascript
for (const [key, value] of Object.entries(obj)) {
  console.log(key, value);
}
```

## 五、属性顺序这件事，比想象中有规则

很多人以为对象的 key 是无序的，这个说法在 ES2015 之后已经不准确了。规范明确定义了 `Object.keys`、`Object.entries`、`for...in`、`JSON.stringify` 的枚举顺序：

先按升序排列所有的整数索引键（能被规范化成 32 位非负整数的那些），然后按插入顺序排列其余的字符串键，最后是 `Symbol` 键（`for...in` 和 `Object.keys` 拿不到 `Symbol` 键，只有 `Reflect.ownKeys` 能拿到）。

这个规则带来一个很反直觉的现象：

```javascript
const obj = { b: 1, 2: 2, a: 3, 1: 4 };
console.log(Object.keys(obj)); // ['1', '2', 'b', 'a']
```

数字键被提到了前面并且排了序。这个我踩过一次，后端返回的是一个以 ID 为 key 的映射对象，我以为遍历出来的顺序就是后端给的顺序，结果前端展示的列表跟后台管理页对不上。排查了一下午才想起来是这条规则。

需要顺序稳定的映射，用 `Map` 而不是普通对象。`Map` 严格按插入顺序迭代，而且 key 可以是任意类型，不会被隐式转成字符串。

## 六、Object 静态方法的现代组合

`Object.keys`、`Object.values`（ES2017）、`Object.entries`（ES2017）返回的都是真数组，可以直接接数组方法链。加上 `Object.fromEntries`（ES2019）之后，「遍历对象，改一改，再变回对象」就成了一个固定套路：

```javascript
// 把所有 value 转成字符串
const stringified = Object.fromEntries(
  Object.entries(obj).map(([k, v]) => [k, String(v)])
);
```

以前这段要么写 `for...in` 加临时对象，要么写 `reduce` 拼，都不如这个直白。

还有几个值得记一下的。`Object.assign` 做浅合并，会触发目标对象的 setter，展开运算符 `{...a, ...b}` 则是直接定义新属性，不触发。`Object.freeze` 冻结对象，但只冻第一层，嵌套对象照样能改。`Object.groupBy`（ES2024）按字段分组，是新加的，用之前确认目标环境支持情况，以 MDN 为准。

对象拷贝那一摊事（浅拷贝到底浅在哪、深拷贝怎么处理循环引用），我在 [JavaScript深浅拷贝原理与手写实现](https://feinterview.poetries.top/blog/js-deep-copy) 里写全了，这里就不重复了。

## 总结

字符串截取三兄弟里，`slice` 行为最可预测，日常统一用它就行。`substr` 已经是 Annex B 遗留特性，能不写就不写。`substring` 会自动交换参数、把负数当 0，出错时不给你任何提示，这一点在维护期很难受。

字符串是不可变的，所有截取和替换方法都返回新串。处理 emoji 和生僻字要按码点走，`[...str]` 比 `str.split('')` 靠谱。

`for...in` 会爬原型链，遍历对象时该加的 `Object.hasOwn` 别省；`for...of` 只认可迭代对象，普通对象要先过一道 `Object.keys` 或 `Object.entries`。

对象的枚举顺序有明确规则，整数键会被提前并排序。需要顺序稳定就用 `Map`，别赌普通对象。

数组方法的完整展开在 [JavaScript数组方法总结](https://feinterview.poetries.top/blog/javaScript-arr-summary)，业务里的组合套路在 [业务中处理数据结构常用的JS方法](https://feinterview.poetries.top/blog/js-map-reduce-find-filter)，三篇分工不同，配着看比较省事。

## 参考

- [MDN String.prototype.slice](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/slice)
- [MDN String.prototype.substring](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/substring)
- [MDN String.prototype.substr](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/substr)
- [MDN Object.entries](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/entries)
- [MDN for...in](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/for...in)
- [MDN 迭代协议](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Iteration_protocols)
- [前端进阶之旅](https://interview.poetries.top)
