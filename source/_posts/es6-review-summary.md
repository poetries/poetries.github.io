---
title: ES6 系统复习 ES2015 ES2016 ES2017 ES2018 ES2019 特性全梳理
description: 按年份梳理 ES2015 到 ES2019 的全部语言特性，从 let/const、解构、Class、Module 到 Proxy、Promise、Generator、Async，每一条都补上「什么时候用、坑在哪」，并标注这些年标准的变化。
date: 2019-11-17 19:50:43
tags: 
  - JavaScript
  - ES6
  - ES2015
  - 前端面试
categories: Front-End
---

![ES6 全版本特性知识图谱封面](https://s.poetries.top/gitee/2019/11/123.png)

面试前翻 ES6，最容易踩的坑不是「不会写」，而是记混了年份和归属。有人把 `Object.values()` 说成 ES6 新增，有人以为 `includes()` 是数组和字符串一起加的，还有人把 `async/await` 归到 ES2015 里去。这些细节平时不影响写代码，被追问一句「这个是哪一版进的标准」就容易卡壳。

这篇是我按年份重新捋的一份复习笔记，从 ES2015 一路排到 ES2019，外加当年还在提案阶段的一批语法。每一节不只列 API 名字，还会补上它在解决什么问题、什么场景真用得上、边界条件在哪。读完你至少能把「ES6 到底包含哪些东西」这件事讲清楚，面试被追问细节时心里有底。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- ES6 和 ES2015 到底是什么关系，为什么不该再叫 ES7、ES8
- ES2015 的全量特性，声明、解构、字符串、数值、对象、数组、函数、正则、Symbol、Set/Map、Proxy/Reflect、Class、Module、Iterator、Promise、Generator
- ES2016 到 ES2019 这四年每年加了什么，为什么后面几年的更新越来越小
- 当年还在提案里的 `?.`、`??`、`BigInt`、私有属性、顶层 await，现在都跑到哪一步了
- 每个特性的重点难点和踩坑清单，可以直接当面试自查表用

<!--more-->

## 一、前言

- `ES6`是`ECMA`为`JavaScript`制定的第6个标准版本
- 标准委员会最终决定，标准在每年6月正式发布并作为当年的正式版本，接下来的时间里就在此版本的基础上进行改动，直到下一年6月草案就自然变成新一年的版本，这样一来就无需以前的版本号，只要用年份标记即可。`ECMAscript 2015`是在2015年6月发布ES6的第一个版本。以此类推，`ECMAscript` 2016是ES6的第二个版本、 ECMAscript 2017是ES6的第三个版本。ES6既是一个历史名词也是一个泛指，含义是5.1版本以后的JavaScript下一代标准，目前涵盖了`ES2015`、`ES2016`、`ES2017`、`ES2018`、`ES2019`

> 所以有些文章上提到的ES7(实质上是ES2016)、ES8(实质上是ES2017)、ES9(实质上是ES2018)、ES10(实质上是ES2019)，实质上都是一些不规范的概念。从ES1到ES6，每个标准都是花了好几年甚至十多年才制定下来，你一个ES6到ES7，ES7到ES8，才用了一年，按照这样的定义下去，那不是很快就ES20了。用正确的概念来说ES6目前涵盖了ES2015、ES2016、ES2017、ES2018、ES2019

这里补一句我自己的理解。年份命名不只是换个叫法，它背后是 TC39 把「攒大版本」改成了「小步快跑」。一个提案只要走完 Stage 0 到 Stage 4 五个阶段，就直接搭上最近一班年度快车，不用等整个大版本谈拢。所以你会看到 ES2015 一口气塞了几十个特性，后面几年每年只有三五条，这不是标准停滞了，恰恰是流程顺了。

下面这张图是版本演进的整体脉络，可以先扫一眼建立坐标系，后面每一节都能对回这张图上。

![ECMAScript 各版本发布时间线与命名规则](https://s.poetries.top/gitee/2019/11/124.png)

顺着上面聊，日常交流里说「ES6」通常泛指 ES5.1 之后的一整套新语法，说「ES2015」才是精确指某一年的标准。写简历和答面试题的时候建议用年份，不容易被挑刺。

## 二、ES2015

ES2015 是这套标准里最厚的一版，也是绝大多数人口中「ES6」真正指的那一版。它一次性补齐了块级作用域、模块系统、类语法、迭代协议、异步原语这几块 JavaScript 缺了十几年的地基。后面 ES2016 到 ES2019 加的东西，基本都是在这批地基上打补丁。

所以这一节篇幅最长，建议按图里的分类逐块过。

![ES2015 特性全景分类图](https://s.poetries.top/gitee/2019/11/125.png)

### 声明

先看这块。`var` 最让人头疼的地方有两个，一是没有块级作用域，`for` 循环里声明的变量会漏到外面；二是变量提升，声明还没执行就能访问到 `undefined`。`let` 和 `const` 就是冲着这两个问题来的。

- `const`命令：声明常量
- `let`命令：声明变量

> 作用

**作用域**

- 全局作用域
- 函数作用域：`function() {}`
- 块级作用域：`{}`

**作用范围**

- `var`命令在全局代码中执行
- `const`命令和`let`命令只能在代码块中执行

**赋值使用**

- `const`命令声明常量后必须立马赋值
- `let`命令声明变量后可立马赋值或使用时赋值

> 声明方法：`var`、`const`、`let`、`function`、`class`、`import`

**重点难点**

- 不允许重复声明
- 未定义就使用会报错：`const`命令和`let`命令不存在变量提升
- 暂时性死区：在代码块内使用let命令声明变量之前，该变量都不可用

暂时性死区这块很多人记成了「`let` 没有提升」。严格说变量还是被提升到了块顶部，只是在执行到声明语句之前它处于未初始化状态，访问就抛 `ReferenceError`。这个区别在面试里会被追问，答「没有提升」容易被反问一句「那为什么 `typeof` 也报错」。

再补一个 `const` 的老误会。`const` 锁的是绑定不是值，`const arr = []` 之后 `arr.push(1)` 完全合法，只有 `arr = []` 才报错。想让对象内容也不可改，得配合 `Object.freeze()`，而且它只冻一层。

### 解构赋值

解构解决的是「从一坨数据里挑几个字段出来」这件事。以前得写 `const name = res.data.user.name` 一行一行摘，现在一行搞定，函数入参也能顺手带默认值。这套语法在处理接口返回和写工具函数时使用频率极高。

- 字符串解构：`const [a, b, c, d, e] = "hello"`
- 数值解构：`const { toString: s } = 123`
- 布尔值解构：`const { toString: b } = true`

**对象解构**

- 形式：`const { x, y } = { x: 1, y: 2 }`
- 默认：`const { x, y = 2 } = { x: 1 }`
- 改名：`const { x, y: z } = { x: 1, y: 2 }`

**数组解构**

- 规则：数据结构具有`Iterator`接口可采用数组形式的解构赋值
- 形式：`const [x, y] = [1, 2]`
- 默认：`const [x, y = 2] = [1]`

**函数参数解构**

- 数组解构：`function Func([x = 0, y = 1]) {}`
- 对象解构：`function Func({ x = 0, y = 1 } = {}) {}`

**应用场景**

- 交换变量值：`[x, y] = [y, x]`
- 返回函数多个值：`const [x, y, z] = Func()`
- 定义函数参数：`Func([1, 2])`
- 提取JSON数据：`const { name, version } = packageJson`
- 定义函数参数默认值：`function Func({ x = 1, y = 2 } = {}) {}`
- 遍历Map结构：`for (let [k, v] of Map) {}`
- 输入模块指定属性和方法：`const { readFile, writeFile } = require("fs")`

**重点难点**

- 匹配模式：只要等号两边的模式相同，左边的变量就会被赋予对应的值
- 解构赋值规则：只要等号右边的值不是对象或数组，就先将其转为对象
- 解构默认值生效条件：属性值严格等于undefined
- 解构遵循匹配模式
- 解构不成功时变量的值等于`undefined`
- `undefined`和`null`无法转为对象，因此无法进行解构

第三条那个「严格等于 undefined」是真踩过的坑。接口返回 `{ count: null }`，你写 `const { count = 0 } = res`，拿到的还是 `null` 不是 `0`，因为默认值只在属性值严格等于 `undefined` 时才生效。后来 ES2020 补的 `??` 就是专门收拾 `null` 这种情况的，这个后面提案那一节还会说。

还有个写法值得单拎出来：`function Func({ x = 1, y = 2 } = {})` 里那个外层 `= {}` 千万别省。省了之后调用 `Func()` 不传参，解构 `undefined` 直接报错。

### 字符串扩展

字符串这块的改动可以分两拨看。一拨是模板字符串和标签模板，解决拼接可读性；另一拨是一堆 `Unicode` 相关方法，解决 JavaScript 早年只按 16 位处理字符、遇到 emoji 和生僻字就算错长度的老问题。

- `Unicode`表示法：大括号包含表示`Unicode`字符(`\u{0xXX}`或`\u{0XXX}`)
- 字符串遍历：可通过for-of遍历字符串
- 字符串模板：可单行可多行可插入变量的增强版字符串
- 标签模板：函数参数的特殊调用
- `String.raw()`：返回把字符串所有变量替换且对斜杠进行转义的结果
- `String.fromCodePoint()`：返回码点对应字符
- `codePointAt()`：返回字符对应码点(`String.fromCodePoint()`的逆操作)
- `normalize()`：把字符的不同表示方法统一为同样形式，返回新字符串(Unicode正规化)
- `repeat()`：把字符串重复n次，返回新字符串
- `matchAll()`：返回正则表达式在字符串的所有匹配
- `includes()`：是否存在指定字符串
- `startsWith()`：是否存在字符串头部指定字符串
- `endsWith()`：是否存在字符串尾部指定字符串

**重点难点**

> 以上扩展方法均可作用于由4个字节储存的`Unicode`字符上

这句是整节的关键。`"👍".length` 返回 2 而不是 1，因为它由两个代理对码元组成；用 `for-of` 遍历或者 `[..."👍"]` 展开，拿到的才是一个完整字符。做输入框字数统计、做昵称截断的时候，这个差别直接决定了会不会把 emoji 劈成两半变乱码。这个我踩过，当时截出来的半个字符在 iOS 上显示成方块。

再纠正一处归属。上面列表里的 `matchAll()` 严格说不属于 ES2015，它是后来才进标准的方法，很多教材按主题把它并到「字符串扩展」一章里，容易让人以为是同一批。具体进标准的年份以 MDN 为准，面试答「后来补的」比乱报年份安全。

### 数值扩展

数值这块新增的东西多，但日常真正高频的就三四个。二进制和八进制字面量是给位运算和权限掩码用的；`Number.isNaN()` 和 `Number.isInteger()` 是为了绕开全局 `isNaN()` 会先做类型转换的坑；`Number.EPSILON` 则是浮点数比较的标准解法。

- 二进制表示法：0b或0B开头表示二进制(`0bXX`或`0BXX`)
- 八进制表示法：0o或0O开头表示八进制(`0oXX`或`0OXX`)
- `Number.EPSILON`：数值最小精度
- `Number.MIN_SAFE_INTEGER`：最小安全数值(`-(2^53 - 1)`)
- `Number.MAX_SAFE_INTEGER`：最大安全数值(`2^53 - 1`)
- `Number.parseInt()`：返回转换值的整数部分
- `Number.parseFloat()`：返回转换值的浮点数部分
- `Number.isFinite()`：是否为有限数值
- `Number.isNaN()`：是否为`NaN`
- `Number.isInteger()`：是否为整数
- `Number.isSafeInteger()`：是否在数值安全范围内
- `Math.trunc()`：返回数值整数部分
- `Math.sign()`：返回数值类型(正数1、负数-1、零0)
- `Math.cbrt()`：返回数值立方根
- `Math.clz32()`：返回数值转成32位无符号整数后，前导0的个数
- `Math.imul()`：返回两个数值以32位带符号整数方式相乘的结果
- `Math.fround()`：返回数值的32位单精度浮点数形式
- `Math.hypot()`：返回所有数值平方和的平方根
- `Math.expm1()`：返回`e^n - 1`
- `Math.log1p()`：返回`1 + n`的自然对数(`Math.log(1 + n)`)
- `Math.log10()`：返回以10为底的n的对数
- `Math.log2()`：返回以2为底的n的对数
- `Math.sinh()`：返回n的双曲正弦
- `Math.cosh()`：返回n的双曲余弦
- `Math.tanh()`：返回n的双曲正切
- `Math.asinh()`：返回n的反双曲正弦
- `Math.acosh()`：返回n的反双曲余弦
- `Math.atanh()`：返回n的反双曲正切

后面这一长串 `Math` 双曲函数，说实话我在业务代码里一次都没用过，做图形和信号处理才会碰到，扫一眼知道有这么回事就行。真正建议记牢的是 `Math.trunc()` 和 `Math.sign()`，前者比 `parseInt()` 更适合截断数字（`parseInt()` 会先把参数转成字符串，遇到 `0.0000005` 这种科学计数法表示的值会算错），后者省掉一堆三元判断。

`Number.EPSILON` 的典型用法是这样：判断两个浮点数是否相等，别写 `a === b`，写 `Math.abs(a - b) < Number.EPSILON`。经典的 `0.1 + 0.2 !== 0.3` 就靠这个绕过去。

### 对象扩展

对象这块最实用的是简洁表示法和属性名表达式，写 Redux reducer、拼接口参数的时候能少敲一半字符。剩下的 `Object.is()`、`Object.assign()`、原型操作三兄弟，属于「不常用但一用就得用对」的类型。

- 简洁表示法：直接写入变量和函数作为对象的属性和方法`({ prop, method() {} })`
- 属性名表达式：字面量定义对象时使用[]定义键(`[prop]`，不能与上同时使用)
- **方法的name属性：返回方法函数名**
    - 取值函数(`getter`)和存值函数(`setter`)：`get/set`函数名(属性的描述对象在get和set上)
    - `bind`返回的函数：`bound` 函数名
    - `Function`构造函数返回的函数实例：`anonymous`
- 属性的可枚举性和遍历：描述对象的`enumerable`
- `super`关键字：指向当前对象的原型对象(只能用在对象的简写方法中`method() {}`)
- `Object.is()`：对比两值是否相等
- `Object.assign()`：合并对象(浅拷贝)，返回原对象
- `Object.getPrototypeOf()`：返回对象的原型对象
- `Object.setPrototypeOf()`：设置对象的原型对象
- `__proto__`：返回或设置对象的原型对象

**属性遍历**

- 描述：自身、可继承、可枚举、非枚举、`Symbol`
- **遍历**
  - `for-in`：遍历对象自身以及继承来的可枚举属性(不含`Symbol`键)
  - `Object.keys()`：返回对象自身可枚举属性的键组成的数组(不含继承，不含`Symbol`键)
  - `Object.getOwnPropertyNames()`：返回对象自身的字符串键组成的数组(含不可枚举，不含继承，不含`Symbol`键)
  - `Object.getOwnPropertySymbols()`：返回对象自身`Symbol`属性的键组成的数组
  - `Reflect.ownKeys()`：返回对象自身的全部键组成的数组(字符串键加`Symbol`键，含不可枚举，不含继承)
- **规则**
  - 首先遍历所有数值键，按照数值升序排列
  - 其次遍历所有字符串键，按照加入时间升序排列
  - 最后遍历所有`Symbol`键，按照加入时间升序排列

原文这几条我做了修正。只有 `for-in` 会往原型链上找，其余四个都只看对象自身；`Object.getOwnPropertyNames()` 和 `Reflect.ownKeys()` 的区别在于后者额外带上 `Symbol` 键。这块概念糊在一起，写「深拷贝」「对象合并」这类工具函数时就会漏字段。

那个遍历顺序规则也值得单独记一下。很多人以为对象是无序的，其实整数键会被强制按升序排到最前面，这就是为什么 `{ 2: 'b', 1: 'a' }` 打印出来 `1` 在前。用对象存 ID 到数据的映射时，顺序会跟你插入的顺序不一致，这种场景应该换成 `Map`。


### 数组扩展

数组这块的主角是扩展运算符。它把「类数组转真数组」「合并」「克隆」「代替 apply」这四件老麻烦事一次性收拾干净了，是 ES2015 里性价比最高的语法之一。

- 扩展运算符(`...`)：转换数组为用逗号分隔的参数序列(`[...arr]`，相当于`rest/spread`参数的逆运算)
- `Array.from()`：转换具有`Iterator`接口的数据结构为真正数组，返回新数组
  - 类数组对象：包含`length`的对象、`Arguments`对象、`NodeList`对象
  - 可遍历对象：`String`、`Set`结构、`Map`结构、`Generator`函数
- `Array.of()`：转换一组值为真正数组，返回新数组
- `copyWithin()`：把指定位置的成员复制到其他位置，返回原数组
- `find()`：返回第一个符合条件的成员
- `findIndex()`：返回第一个符合条件的成员索引值
- `fill()`：根据指定值填充整个数组，返回原数组
- `keys()`：返回以索引值为遍历器的对象
- `values()`：返回以属性值为遍历器的对象
- `entries()`：返回以索引值和属性值为遍历器的对象
- 数组空位：ES6明确将数组空位转为`undefined`(空位处理规不一，建议避免出现)

**扩展应用**

- 克隆数组：`const arr = [...arr1]`
- 合并数组：`const arr = [...arr1, ...arr2]`
- 拼接数组：`arr.push(...arr1)`
- 代替`apply`：`Math.max.apply(null, [x, y]) => Math.max(...[x, y])`
- 转换字符串为数组：`[..."hello"]`
- 转换类数组对象为数组：`[...Arguments, ...NodeList]`
- 转换可遍历对象为数组：`[...String, ...Set, ...Map, ...Generator]`
- 与数组解构赋值结合：`const [x, ...rest/spread] = [1, 2, 3]`
- 计算`Unicode`字符长度：`Array.from("hello").length => [..."hello"].length`

**重点难点**

- 使用`keys()`、`values()`、`entries()`返回的遍历器对象，可用`for-of`自动遍历或`next()`手动遍历

这里有个坑要注意：`[...arr]` 是浅拷贝。数组里装的是对象的话，新旧两个数组里的对象还是同一份引用，改一个另一个跟着变。真要深拷贝，老办法是 `JSON.parse(JSON.stringify(arr))`（会丢函数、`undefined`、`Date` 类型），后来浏览器提供了 `structuredClone()`，具体兼容性以 MDN 为准。

`Array.from()` 还有个第二参数很多人不知道，它能顺手做一次 map：`Array.from({ length: 5 }, (_, i) => i)` 直接生成 `[0,1,2,3,4]`，比 `new Array(5).fill(0).map(...)` 干净，因为 `new Array(5)` 造出来的是空位数组，`map()` 会直接跳过空位什么都不做。

### 函数扩展

函数这块改动最大的是参数默认值和箭头函数。前者干掉了 `x = x || 1` 这种老写法，后者把回调里的 `this` 问题从根上解决了。尾调用优化那条要留个心眼，规范里写了，但主流引擎的实际支持情况一直很有限，别在生产代码里依赖它。

- **参数默认值：为函数参数指定默认值**
  - 形式：`function Func(x = 1, y = 2) {}`
  - 参数赋值：惰性求值(函数调用后才求值)
  - 参数位置：尾参数
  - 参数作用域：函数作用域
  - 声明方式：默认声明，不能用`const`或`let`再次声明
  - `length`：返回没有指定默认值的参数个数
  - 与解构赋值默认值结合：`function Func({ x = 1, y = 2 } = {}) {}`  
  - **应用**
    - 指定某个参数不得省略，省略即抛出错误：`function Func(x = throwMissing()) {}`
    - 将参数默认值设为`undefined`，表明此参数可省略：`Func(undefined, 1)`
- **rest/spread参数(...)：返回函数多余参数**
  - 形式：以数组的形式存在，之后不能再有其他参数
  - 作用：代替`Arguments`对象
  - `length`：返回没有指定默认值的参数个数但不包括`rest/spread`参数
- **严格模式：在严格条件下运行JS**
  - 应用：只要函数参数使用默认值、解构赋值、扩展运算符，那么函数内部就不能显式设定为严格模式
- **name属性**：返回函数的函数名
  - 将匿名函数赋值给变量：空字符串(ES5)、变量名(ES6)
  - 将具名函数赋值给变量：函数名(ES5和ES6)
  - `bind`返回的函数：`bound` 函数名(ES5和ES6)
  - `Function`构造函数返回的函数实例：`anonymous`(ES5和ES6)
- **箭头函数(=>)：函数简写**
  - 无参数：`() => {}`
  - 单个参数：`x => {}`
  - 多个参数：`(x, y) => {}`
  - 解构参数：`({x, y}) => {}`
  - 嵌套使用：部署管道机制
  - `this`指向固定化
    - 并非因为内部有绑定`this`的机制，而是根本没有自己的`this`，导致内部的`this`就是外层代码块的`this`
    - 因为没有`this`，因此不能用作构造函数
- **尾调用优化：只保留内层函数的调用帧**
  - **尾调用**
    - 定义：某个函数的最后一步是调用另一个函数
    - 形式：`function f(x) { return g(x); }`
  - **尾递归**
    - 定义：函数尾调用自身
    - 作用：只要使用尾递归就不会发生栈溢出，相对节省内存
    - 实现：把所有用到的内部变量改写成函数的参数并使用参数默认值

**箭头函数误区**

- 函数体内的`this`是定义时所在的对象而不是使用时所在的对象
- 可让`this`指向固定化，这种特性很有利于封装回调函数
- 不可当作构造函数，因此箭头函数不可使用`new`命令
- 不可使用`yield`命令，因此箭头函数不能用作`Generator`函数
- 不可使用`Arguments`对象，此对象在函数体内不存在(可用`rest/spread`参数代替)
- 返回对象时必须在对象外面加上括号

第一条是箭头函数的全部秘密所在。它没有自己的 `this`、`arguments`、`super`、`new.target`，用到这些名字时会沿着作用域链往外找，找到最近那个普通函数的。所以在 Vue 2 的 `methods` 里写箭头函数会拿不到组件实例，在对象字面量里写箭头函数当方法也拿不到对象本身。

那为什么返回对象非得加括号呢？因为 `x => { name: x }` 里的 `{}` 会被解析成函数体，`name:` 变成了标签语句，整个函数返回 `undefined`。写成 `x => ({ name: x })` 才对。这个错误 ESLint 不一定会拦，调试时容易盯着别处找半天。

关于 `length` 属性还有一条容易记混：它返回的是「第一个有默认值的参数之前」的参数个数。`function f(a, b = 1, c) {}` 的 `length` 是 1 而不是 2，因为遇到 `b` 就停了。

### 正则扩展

正则这块的两个修饰符解决的是不同问题。`u` 修饰符管的是 Unicode 正确性，不加它的话 `/^.$/` 匹配不了一个 emoji；`y` 修饰符管的是「必须从上次结束的位置接着匹配」，做词法分析器、模板编译器的时候特别有用，因为它能保证不跳过任何字符。

- **变更`RegExp`构造函数入参**：允许首参数为正则对象，尾参数为正则修饰符(返回的正则表达式会忽略原正则表达式的修饰符)
- **正则方法调用变更**：字符串对象的`match()`、`replace()`、`search()`、`split()`内部调用转为调用`RegExp`实例对应的`RegExp.prototype[Symbol.方法]`
- **u修饰符**：`Unicode`模式修饰符，正确处理大于`\uFFFF`的`Unicode`字符
    - 点字符(`.`)
    - `Unicode`表示法
    - 量词
    - 预定义模式
    - `i`修饰符
    - 转义
- **y修饰符**：粘连修饰符，确保匹配必须从剩余的第一个位置开始全局匹配(与g修饰符作用类似)
- **unicode**：是否设置`u`修饰符
- **sticky**：是否设置`y`修饰符
- **flags**：正则表达式的修饰符

**重点难点**

- `y`修饰符隐含头部匹配标志`^`
- 单单一个y修饰符对`match()`只能返回第一个匹配，必须与g修饰符联用才能返回所有匹配


### Symbol

`Symbol` 是 ES2015 新增的第七种原始类型，它存在的理由只有一个：造一个绝对不会和别人撞车的属性名。往一个不属于你的对象上挂字段时，用字符串键随时可能覆盖人家的属性，用 `Symbol` 就不会。

- 定义：独一无二的值
- 声明：`const set = Symbol(str)`
- 入参：字符串(可选)

**方法**

- `Symbol()`：创建以参数作为描述的Symbol值(不登记在全局环境)
- `Symbol.for()`：创建以参数作为描述的Symbol值，如存在此参数则返回原有的Symbol值(先搜索后创建，登记在全局环境)
- `Symbol.keyFor()`：返回已登记的`Symbol`值的描述(只能返回`Symbol.for()`的`key`)
- `Object.getOwnPropertySymbols()`：返回对象中所有用作属性名的`Symbol`值的数组

**内置**

- `Symbol.hasInstance`：指向一个内部方法，当其他对象使用`instanceof`运算符判断是否为此对象的实例时会调用此方法
- `Symbol.isConcatSpreadable`：指向一个布尔值，定义对象用于`Array.prototype.concat()`时是否可展开
- `Symbol.species`：指向一个构造函数，当实例对象使用自身构造函数时会调用指定的构造函数
- `Symbol.match`：指向一个函数，当实例对象被`String.prototype.match()`调用时会重新定义`match()`的行为
- `Symbol.replace`：指向一个函数，当实例对象被`String.prototype.replace()`调用时会重新定义`replace()`的行为
- `Symbol.search`：指向一个函数，当实例对象被`String.prototype.search()`调用时会重新定义`search()`的行为
- `Symbol.split`：指向一个函数，当实例对象被`String.prototype.split()`调用时会重新定义`split()`的行为
- `Symbol.iterator`：指向一个默认遍历器方法，当实例对象执行`for-of`时会调用指定的默认遍历器
- `Symbol.toPrimitive`：指向一个函数，当实例对象被转为原始类型的值时会返回此对象对应的原始类型值
- `Symbol.toStringTag`：指向一个函数，当实例对象被`Object.prototype.toString()`调用时其返回值会出现在`toString()`返回的字符串之中表示对象的类型
- `Symbol.unscopables`：指向一个对象，指定使用`with`时哪些属性会被`with`环境排除

**数据类型**

- `Undefined`
- `Null`
- `String`
- `Number`
- `Boolean`
- `Object`(包含`Array`、`Function`、`Date`、`RegExp`、`Error`)
- `Symbol`

**应用场景**

- 唯一化对象属性名：属性名属于`Symbol`类型，就都是独一无二的，可保证不会与其他属性名产生冲突
- 消除魔术字符串：在代码中多次出现且与代码形成强耦合的某一个具体的字符串或数值
- 遍历属性名：无法通过`for-in`、`for-of`、`Object.keys()`、`Object.getOwnPropertyNames()`、`JSON.stringify()`返回，只能通过`Object.getOwnPropertySymbols`返回
- 启用模块的`Singleton`模式：调用一个类在任何时候返回同一个实例(`window`和`global`)，使用`Symbol.for()`来模拟全局的`Singleton`模式

`Symbol()` 和 `Symbol.for()` 的区别是这一节最容易考的点。前者每次调用都造一个全新的值，`Symbol('a') === Symbol('a')` 永远是 `false`；后者会先去全局注册表里查，查到就复用，所以 `Symbol.for('a') === Symbol.for('a')` 是 `true`。跨 iframe、跨模块想拿到同一个 `Symbol`，只能走 `Symbol.for()`。

那一堆 `Symbol.hasInstance`、`Symbol.toPrimitive` 这种内置 `Symbol`，日常业务基本用不上，但它们是理解「JavaScript 的内部行为其实是可改的」这件事的入口。比如改写 `Symbol.iterator` 就能让任意对象支持 `for-of`，改写 `Symbol.toStringTag` 就能让 `Object.prototype.toString.call(obj)` 返回你自定义的类型名。

**重点难点**

- `Symbol()`生成一个原始类型的值不是对象，因此`Symbol()`前不能使用`new`命令
- `Symbol()`参数表示对当前`Symbol`值的描述，相同参数的`Symbol()`返回值不相等
- `Symbol`值不能与其他类型的值进行运算
- `Symbol`值可通过`String()`或`toString()`显式转为字符串
- `Symbol`值作为对象属性名时，此属性是公开属性，但不是私有属性
- `Symbol`值作为对象属性名时，只能用方括号运算符(`[]`)读取，不能用点运算符(`.`)读取
- `Symbol`值作为对象属性名时，不会被常规方法遍历得到，可利用此特性为对象定义非私有但又只用于内部的方法

最后一条有个实际后果：`JSON.stringify()` 会把 `Symbol` 键的属性直接丢掉。用 `Symbol` 存内部状态是好事，但如果这个对象要序列化上传，那部分数据就悄无声息地没了，排查起来很费劲。

### Set

在 `Set` 出现之前，数组去重要么两层循环，要么用对象当哈希表（还得忍受键被转成字符串，`1` 和 `"1"` 会撞）。`Set` 把这件事变成了一行。四种新集合类型里，`Set` 和 `Map` 是日常真会用的，`WeakSet` 和 `WeakMap` 则是为内存管理准备的。

这四个结构的完整对比我单独写过一篇，想深入看这个：[ES6 Set、WeakSet、Map、WeakMap 用法与区别详解](https://feinterview.poetries.top/blog/es6-set-weakSet-map-weakMap)。

**Set**

- 定义：类似于数组的数据结构，成员值都是唯一且没有重复的值
- 声明：`const set = new Set(arr)`
- 入参：具有`Iterator`接口的数据结构
- 属性
  - `constructor`：构造函数，返回`Set`
  - `size`：返回实例成员总数
- 方法
  - `add()`：添加值，返回实例
  - `delete()`：删除值，返回布尔值
  - `has()`：检查值，返回布尔值
  - `clear()`：清除所有成员
  - `keys()`：返回以属性值为遍历器的对象
  - `values()`：返回以属性值为遍历器的对象
  - `entries()`：返回以属性值和属性值为遍历器的对象
  - `forEach()`：使用回调函数遍历每个成员

**应用场景**

- 去重字符串：`[...new Set(str)].join("")`
- 去重数组：`[...new Set(arr)]或Array.from(new Set(arr))`
- 集合数组
  - 声明：`const a = new Set(arr1)、const b = new Set(arr2)`
  - 并集：`new Set([...a, ...b])`
  - 交集：`new Set([...a].filter(v => b.has(v)))`
  - 差集：`new Set([...a].filter(v => !b.has(v)))`
- 映射集合
  - 声明：`let set = new Set(arr)`
  - 映射：`set = new Set([...set].map(v => v * 2))`或`set = new Set(Array.from(set, v => v * 2))`
  
**重点难点**

- 遍历顺序：插入顺序
- 没有键只有值，可认为键和值两值相等
- 添加多个`NaN`时，只会存在一个`NaN`
- 添加相同的对象时，会认为是不同的对象
- 添加值时不会发生类型转换`(5 !== "5")`
- `keys()`和`values()`的行为完全一致，`entries()`返回的遍历器同时包括键和值且两值相等

「添加多个 `NaN` 只会存在一个」这条挺反直觉的，毕竟 `NaN !== NaN`。`Set` 内部用的是 SameValueZero 算法比较，它跟 `===` 的唯一区别就是认为 `NaN` 等于 `NaN`（跟 `Object.is()` 的区别则是它认为 `+0` 等于 `-0`）。所以 `[...new Set([NaN, NaN])]` 长度是 1。

还有一条得记牢：`new Set([{a:1}, {a:1}])` 的 size 是 2。对象比的是引用地址不是内容，指望 `Set` 帮你按内容给对象数组去重是不行的，那种场景得先 `JSON.stringify()` 或者挑个唯一字段做 key。

**WeakSet**

- 定义：和`Set`结构类似，成员值只能是对象
- 声明：`const set = new WeakSet(arr)`
- 入参：具有`Iterator`接口的数据结构
- 属性
  - `constructor`：构造函数，返回`WeakSet`
- 方法
  - `add()`：添加值，返回实例
  - `delete()`：删除值，返回布尔值
  - `has()`：检查值，返回布尔值
  
**应用场景**

- 储存`DOM`节点：`DOM`节点被移除时自动释放此成员，不用担心这些节点从文档移除时会引发内存泄漏
- 临时存放一组对象或存放跟对象绑定的信息：只要这些对象在外部消失，它在`WeakSet`结构中的引用就会自动消失

**重点难点**

- 成员都是弱引用，垃圾回收机制不考虑`WeakSet`结构对此成员的引用
- 成员不适合引用，它会随时消失，因此ES6规定`WeakSet`结构不可遍历
- 其他对象不再引用成员时，垃圾回收机制会自动回收此成员所占用的内存，不考虑此成员是否还存在于`WeakSet`结构中

弱引用这个词说起来玄乎，落到实处就一句话：`WeakSet` 里存着某个对象，不足以阻止这个对象被回收。所以它没有 `size`、不能遍历、不能 `clear()`，因为里面有什么随时可能变，能遍历就等于把回收时机暴露给了脚本。

### Map

对象当字典有两个硬伤：键只能是字符串或 `Symbol`，以及键的遍历顺序会被整数键打乱。`Map` 把这两条都修了，键可以是对象、函数、`NaN`，顺序严格按插入来。判断该用对象还是 `Map`，我的经验是「键的集合在运行时会增删」就用 `Map`，「结构固定像一条记录」就用对象。

**Map**

- 定义：类似于对象的数据结构，成员键可以是任何类型的值
- 声明：`const map = new Map(arr)`
- 入参：具有`Iterator`接口且每个成员都是一个双元素数组的数据结构
- 属性
  - `constructor`：构造函数，返回`Map`
  - `size`：返回实例成员总数
- 方法
  - `get()`：返回键值对
  - `set()`：添加键值对，返回实例
  - `delete()`：删除键值对，返回布尔值
  - `has()`：检查键值对，返回布尔值
  - `clear()`：清除所有成员
  - `keys()`：返回以键为遍历器的对象
  - `values()`：返回以值为遍历器的对象
  - `entries()`：返回以键和值为遍历器的对象
  - `forEach()`：使用回调函数遍历每个成员

**重点难点**

- 遍历顺序：插入顺序
- 对同一个键多次赋值，后面的值将覆盖前面的值
- 对同一个对象的引用，被视为一个键
- 对同样值的两个实例，被视为两个键
- 键跟内存地址绑定，只要内存地址不一样就视为两个键
- 添加多个以`NaN`作为键时，只会存在一个以`NaN`作为键的值
- `Object`结构提供「字符串到值」的对应，`Map`结构提供「值到值」的对应

最后一条是 `Map` 存在的全部理由。用对象当映射表时，`obj[{}]` 会把那个对象转成字符串 `"[object Object]"`，两个不同的对象当键会互相覆盖；`Map` 则按引用区分，各存各的。

补一条性能上的经验：频繁增删的场景 `Map` 通常比对象快，因为对象每次 `delete` 都可能触发引擎内部的隐藏类退化。不过这属于「量级上去了才需要在意」的事，几十个键的表随便用哪个都行。

**WeakMap**

- 定义：和`Map`结构类似，成员键只能是对象
- 声明：`const map = new WeakMap(arr)`
- 入参：具有`Iterator`接口且每个成员都是一个双元素数组的数据结构
- 属性
  - `constructor`：构造函数，返回`WeakMap`
- 方法
  - `get()`：返回键值对
  - `set()`：添加键值对，返回实例
  - `delete()`：删除键值对，返回布尔值
  - `has()`：检查键值对，返回布尔值

**应用场景**

- 储存DOM节点：DOM节点被移除时自动释放此成员键，不用担心这些节点从文档移除时会引发内存泄漏
- 部署私有属性：内部属性是实例的弱引用，删除实例时它们也随之消失，不会造成内存泄漏

**重点难点**

- 成员键都是弱引用，垃圾回收机制不考虑`WeakMap`结构对此成员键的引用
- 成员键不适合引用，它会随时消失，因此ES6规定`WeakMap`结构不可遍历
- 其他对象不再引用成员键时，垃圾回收机制会自动回收此成员所占用的内存，不考虑此成员是否还存在于`WeakMap`结构中
- 一旦不再需要，成员会自动消失，不用手动删除引用
- 弱引用的只是键而不是值，值依然是正常引用
- 即使在外部消除了成员键的引用，内部的成员值依然存在

最后两条组合起来是个真会中招的坑。弱的只是键，值是强引用。如果你把值写成 `weakMap.set(node, { el: node })`，值里又引用回了键，这条引用链首尾接上自己咬住自己，节点反而回收不掉。用 `WeakMap` 存 DOM 相关数据时，值里千万别再存节点本身。

### Proxy

`Proxy` 干的事是给对象套一层拦截器，读、写、删、遍历这些操作都能被你接管。Vue 3 的响应式从 `Object.defineProperty` 换成 `Proxy`，就是因为前者只能逐个属性劫持，新增属性和数组下标改动都拦不到，后者是在对象这一层拦，天生覆盖全。

我另外写过一篇专门讲它的：[ES6系列之Proxy的拦截机制与实战场景](https://feinterview.poetries.top/blog/es6-proxy)，这里只列速查清单。

- 定义：修改某些操作的默认行为
- 声明：`const proxy = new Proxy(target, handler)`
- 入参
  - `target`：拦截的目标对象
  - `handler`：定制拦截行为
- 方法
  - `Proxy.revocable()`：返回可取消的`Proxy`实例(返回`{ proxy, revoke }`，通过`revoke()`取消代理)

- 拦截方式
  - `get()`：拦截对象属性读取
  - `set()`：拦截对象属性设置，返回布尔值
  - `has()`：拦截对象属性检查`k in obj`，返回布尔值
  - `deleteProperty()`：拦截对象属性删除`delete obj[k]`，返回布尔值
  - `defineProperty()`：拦截对象属性定义`Object.defineProperty()`、`Object.defineProperties()`，返回布尔值
  - `ownKeys()`：拦截对象属性遍历`for-in`、`Object.keys()`、`Object.getOwnPropertyNames()、Object.getOwnPropertySymbols()`，返回数组
  - `getOwnPropertyDescriptor()`：拦截对象属性描述读取`Object.getOwnPropertyDescriptor()`，返回对象
  - `getPrototypeOf()`：拦截对象原型读取`instanceof`、`Object.getPrototypeOf()`、`Object.prototype.__proto__`、`Object.prototype.isPrototypeOf()`、`Reflect.getPrototypeOf()`，返回对象
  - `setPrototypeOf()`：拦截对象原型设置`Object.setPrototypeOf()`，返回布尔值
  - `isExtensible()`：拦截对象是否可扩展读取`Object.isExtensible()`，返回布尔值
  - `preventExtensions()`：拦截对象不可扩展设置`Object.preventExtensions()`，返回布尔值
  - `apply()`：拦截`Proxy`实例作为函数调用`proxy()`、`proxy.apply()`、`proxy.call()`
  - `construct()`：拦截`Proxy`实例作为构造函数调用`new proxy()`

**应用场景**

- `Proxy.revocable()`：不允许直接访问对象，必须通过代理访问，一旦访问结束就收回代理权不允许再次访问
- `get()`：读取未知属性报错、读取数组负数索引的值、封装链式操作、生成DOM嵌套节点
- `set()`：数据绑定(`Vue`数据绑定实现原理)、确保属性值设置符合要求、防止内部属性被外部读写
- `has()`：隐藏内部属性不被发现、排除不符合属性条件的对象
- `deleteProperty()`：保护内部属性不被删除
- `defineProperty()`：阻止属性被外部定义
- `ownKeys()`：保护内部属性不被遍历

**重点难点**

- 要使`Proxy`起作用，必须针对实例进行操作，而不是针对目标对象进行操作
- 没有设置任何拦截时，等同于直接通向原对象
- 属性被定义为不可读写/扩展/配置/枚举时，使用拦截方法会报错
- 代理下的目标对象，内部`this`指向`Proxy`代理

第一条得反复强调：`Proxy` 拦的是代理实例上的操作。你 `new Proxy(obj, handler)` 之后还继续用 `obj` 去改数据，一个拦截都不会触发。Vue 3 里 `reactive()` 返回的是代理，你留着原始对象改值不生效，就是这个原因。

最后一条是 `Proxy` 最常见的事故来源。目标对象内部方法里的 `this` 会指向代理，如果这个对象是 `Map`、`Set`、`Date` 这类依赖内部槽的原生对象，方法一执行就抛 `TypeError`。想代理原生对象，得在 `get` 拦截里手动把方法 `bind` 回原对象。这个我排查过一下午，最后是在控制台里逐个属性打印才定位到的。

### Reflect

`Reflect` 和 `Proxy` 是配套设计的。`Proxy` 的每个拦截方法，在 `Reflect` 上都有一个同名的默认实现，你在拦截里做完自己的事，调一下 `Reflect.xxx()` 就能把操作转发回原对象，不用自己手写默认行为。这就是为什么这两个 API 总是成对出现。

- 定义：保持`Object`方法的默认行为
- 方法
  - `get()`：返回对象属性
  - `set()`：设置对象属性，返回布尔值
  - `has()`：检查对象属性，返回布尔值
  - `deleteProperty()`：删除对象属性，返回布尔值
  - `defineProperty()`：定义对象属性，返回布尔值
  - `ownKeys()`：遍历对象属性，返回数组(相当于`Object.getOwnPropertyNames()`加`Object.getOwnPropertySymbols()`)
  - `getOwnPropertyDescriptor()`：返回对象属性描述，返回对象
  - `getPrototypeOf()`：返回对象原型，返回对象
  - `setPrototypeOf()`：设置对象原型，返回布尔值
  - `isExtensible()`：返回对象是否可扩展，返回布尔值
  - `preventExtensions()`：设置对象不可扩展，返回布尔值
  - `apply()`：绑定`this`后执行指定函数
  - `construct()`：调用构造函数创建实例

**设计目的**

- `Object`属于语言内部的方法放到`Reflect`上
- 将某些`Object`方法报错情况改成返回`false`
- 让`Object`操作变成函数行为
- `Proxy`与`Reflect`相辅相成

**推荐迁移的方法**

- `Object.defineProperty()` => `Reflect.defineProperty()`
- `Object.getOwnPropertyDescriptor()` => `Reflect.getOwnPropertyDescriptor()`

这两条我改了原文的说法。当年不少资料写「`Object.defineProperty()` 已废弃」，这个表述不准确，标准里它一直是正常方法，MDN 上也没有 deprecated 标记。真实情况是 TC39 建议新代码优先用 `Reflect` 版本，因为它失败时返回 `false` 而不是抛错，更适合写在拦截器里做条件判断。

下面这段是把 `Proxy` 和 `Reflect` 配合起来做响应式的最小实现，Vue 3 响应式的骨架跟它是一个思路：收集一批副作用函数，`set` 被触发时挨个重跑。

```js
const observerQueue = new Set();
const observe = fn => observerQueue.add(fn);
const observable = obj => new Proxy(obj, {
    set(tgt, key, val, receiver) {
        const result = Reflect.set(tgt, key, val, receiver);
        observerQueue.forEach(v => v());
        return result;
    }
});

const person = observable({ age: 25, name: "Yajun" });
const print = () => console.log(`${person.name} is ${person.age} years old`);
observe(print);
person.name = "Joway";
```

跑起来的效果是，`person.name` 一被改写，`print` 就自动重新执行一次。真实框架还要加依赖收集、批量更新、嵌套对象递归代理这些东西，但核心就是上面这十几行。

### Class

`class` 是构造函数的语法糖，这句话人人都会说，但语法糖并不代表完全等价。类不会被提升、类体默认严格模式、类的方法不可枚举、必须用 `new` 调用，这几条都是 ES5 构造函数没有的约束。它们让类的行为更可预测，也让一部分老写法迁过来时会报错。

- 定义：对一类具有共同特征的事物的抽象(构造函数语法糖)
- 原理：类本身指向构造函数，所有方法定义在`prototype`上，可看作构造函数的另一种写法(`Class === Class.prototype.constructor`)
- **方法和关键字**
  - `constructor()`：构造函数，`new`命令生成实例时自动调用
  - `extends`：继承父类
  - `super`：新建父类的this
  - `static`：定义静态属性方法
  - `get`：取值函数，拦截属性的取值行为
  - `set`：存值函数，拦截属性的存值行为
- **属性**
  - `__proto__`：构造函数的继承(总是指向父类)
  - `__proto__.__proto__`：子类的原型的原型，即父类的原型(总是指向父类的`__proto__`)
  - `prototype.__proto__`：属性方法的继承(总是指向父类的`prototype`)
- **静态属性**：定义类完成后赋值属性，该属性不会被实例继承，只能通过类来调用
- **静态方法**：使用static定义方法，该方法不会被实例继承，只能通过类来调用(方法中的this指向类，而不是实例)
- **继承**
 - 实质
   - ES5实质：先创造子类实例的`this`，再将父类的属性方法添加到`this`上(`Parent.apply(this)`)
   - `ES6`实质：先将父类实例的属性方法加到`this`上(调用`super()`)，再用子类构造函数修改`this`
   - `super`
     - 作为函数调用：只能在构造函数中调用`super()`，内部`this`指向继承的当前子类(`super()`调用后才可在构造函数中使用`this`)
     - 作为对象调用：在普通方法中指向父类的原型对象，在静态方法中指向父类
   - 显示定义：使用`constructor() { super(); }`定义继承父类，没有书写则显示定义
   - 子类继承父类：子类使用父类的属性方法时，必须在构造函数中调用`super()`，否则得不到父类的`this`
     - 父类静态属性方法可被子类继承
     - 类继承父类后，可从`super`上调用父类静态属性方法
- **实例**：类相当于实例的原型，所有在类中定义的属性方法都会被实例继承
  - 显式指定属性方法：使用`this`指定到自身上(使用`Class.hasOwnProperty()`可检测到)
  - 隐式指定属性方法：直接声明定义在对象原型上(使用`Class.__proto__.hasOwnProperty()`可检测到)
- **表达式**
  - 类表达式：`const Class = class {}`
  - `name`属性：返回紧跟`class`后的类名
  - 属性表达式：`[prop]`
  - `Generator`方法：`* mothod() {}`
  - `Async`方法：`async mothod() {}`
- **this指向**：解构实例属性或方法时会报错
  - 绑定`this`：`this.mothod = this.mothod.bind(this)`
  - 箭头函数：`this.mothod = () => this.mothod()`
- **属性定义位置**
  - 定义在构造函数中并使用`this`指向
  - 定义在类最顶层
- **`new.target`：确定构造函数是如何调用**

继承那几条里最关键的是 `super()` 必须先调用。ES5 是先造好子类的 `this` 再往上贴父类属性，ES6 反过来，是父类先造好实例对象再交给子类加工。所以在子类构造函数里 `super()` 之前碰 `this` 直接报 `ReferenceError`，这不是编译器挑刺，是那时候 `this` 压根还不存在。

`this` 指向那一条也很实际。React 类组件年代天天写 `this.handleClick = this.handleClick.bind(this)`，就是因为把方法当回调传出去时会丢掉 `this`。后来大家改用类字段加箭头函数写法，本质是把方法挂到实例上而不是原型上，代价是每个实例都存一份函数。

**原生构造函数**

- `String()`
- `Number()`
- `Boolean()`
- `Array()`
- `Object()`
- `Function()`
- `Date()`
- `RegExp()`
- `Error()`

**重点难点**

- 在实例上调用方法，实质是调用原型上的方法
- `Object.assign()`可方便地一次向类添加多个方法`(Object.assign(Class.prototype, { ... }))`
- 类内部所有定义的方法是不可枚举的(`non-enumerable`)
- 构造函数默认返回实例对象(`this`)，可指定返回另一个对象
- 取值函数和存值函数设置在属性的`Descriptor`对象上
- 类不存在变量提升
- 利用`new.target === Class`写出不能独立使用必须继承后才能使用的类
- 子类继承父类后，`this`指向子类实例，通过`super`对某个属性赋值，赋值的属性会变成子类实例的属性
- 使用`super`时，必须显式指定是作为函数还是作为对象使用
- `extends`不仅可继承类还可继承原生的构造函数

「`extends` 可继承原生构造函数」这条在 ES5 时代是做不到的。以前想继承 `Array` 得靠各种 hack，实例的 `length` 还不会自动更新；ES6 之后 `class MyArray extends Array {}` 造出来的实例，`length` 行为跟真数组一致。

**私有属性方法**

ES2015 那会儿还没有真正的私有成员，社区的通行做法是拿 `Symbol` 当键。下面这段就是这个套路，外部拿不到 `name` 和 `print` 这两个 `Symbol`，也就调不到对应的属性和方法。

```js
const name = Symbol("name");
const print = Symbol("print");
class Person {
    constructor(age) {
        this[name] = "Bruce";
        this.age = age;
    }
    [print]() {
        console.log(`${this[name]} is ${this.age} years old`);
    }
}
```

这套写法只是「不好拿到」，不是真私有，用 `Object.getOwnPropertySymbols()` 还是能挖出来。真正的私有字段要等 `#` 语法，那个在本文写作时还是提案，具体进标准的年份以 MDN 为准，后面提案那一节还会提。

**继承混合类**

JavaScript 只支持单继承，想给一个类同时混入多份能力，就得自己动手把属性描述符逐个拷过去。下面这段做的就是这件事，`CopyProperties` 负责搬运，`MixClass` 负责把多个类合成一个可继承的中间类。

```js
function CopyProperties(target, source) {
    for (const key of Reflect.ownKeys(source)) {
        if (key !== "constructor" && key !== "prototype" && key !== "name") {
            const desc = Object.getOwnPropertyDescriptor(source, key);
            Object.defineProperty(target, key, desc);
        }
    }
}
function MixClass(...mixins) {
    class Mix {
        constructor() {
            for (const mixin of mixins) {
                CopyProperties(this, new mixin());
            }
        }
    }
    for (const mixin of mixins) {
        CopyProperties(Mix, mixin);
        CopyProperties(Mix.prototype, mixin.prototype);
    }
    return Mix;
}
class Student extends MixClass(Person, Kid) {}
```

用 `Reflect.ownKeys()` 而不是 `Object.keys()` 是有讲究的，前者能把不可枚举的方法和 `Symbol` 键一起搬走，类里定义的方法默认就是不可枚举的，换成 `Object.keys()` 会一个方法都拷不到。

### Module

模块系统是 ES2015 里影响最深远的一块。在它之前，浏览器端只能靠 `<script>` 标签顺序加载加全局变量，或者上 AMD、CMD 这类运行时方案；Node 那边是 CommonJS。ESM 用「静态化依赖」把这件事统一了，编译期就能确定依赖关系，这才有了后来的 tree shaking。

**命令**

- `export`：规定模块对外接口
  - 默认导出：`export default Person`(导入时可指定模块任意名称，无需知晓内部真实名称)
  - 单独导出：`export const name = "Bruce"`
  - 按需导出：`export { age, name, sex }(推荐)`
  - 改名导出：`export { name as newName }`
- `import`：导入模块内部功能
  - 默认导入：`import Person from "person"`
  - 整体导入：`import * as Person from "person"`
  - 按需导入：`import { age, name, sex } from "person"`
  - 改名导入：`import { name as newName } from "person"`
  - 自执导入：`import "person"`
  - 复合导入：`import Person, { name } from "person"`
- 复合模式：`export`命令和`import`命令结合在一起写成一行，变量实质没有被导入 当前模块，相当于对外转发接口，导致当前模块无法直接使用其导入变量
  - 默认导入导出：`export { default } from "person"`
  - 整体导入导出：`export * from "person"`
  - 按需导入导出：`export { age, name, sex } from "person"`
  - 改名导入导出：`export { name as newName } from "person"`
  - 具名改默认导入导出：`export { name as default } from "person"`
  - 默认改具名导入导出：`export { default as name } from "person"`
- 继承：默认导出和改名导出结合使用可使模块具备继承性
- 设计思想：尽量地静态化，使得编译时就能确定模块的依赖关系，以及输入和输出的变量
- 严格模式：ES6模块自动采用严格模式(不管模块头部是否添加`use strict`)

**模块方案**

- **CommonJS**：用于服务器(动态化依赖)
- **AMD**：用于浏览器(动态化依赖)
- **CMD**：用于浏览器(动态化依赖)
- **UMD**：用于浏览器和服务器(动态化依赖)
- **ESM**：用于浏览器和服务器(静态化依赖)

这几种模块方案里，现在真正还需要关心的只有 CommonJS 和 ESM。AMD、CMD 是浏览器还没有原生模块时的过渡产物，UMD 则是打包库时为了兼容两端而生成的胶水格式，写业务代码基本碰不到，看到 `dist/xxx.umd.js` 知道它是干嘛的就行。

**加载方式**

- **运行时加载**
  - 定义：整体加载模块生成一个对象，再从对象上获取需要的属性和方法进行加载(全部加载)
  - 影响：只有运行时才能得到这个对象，导致无法在编译时做静态优化
- **编译时加载**
  - 定义：直接从模块中获取需要的属性和方法进行加载(按需加载)
  - 影响：在编译时就完成模块加载，效率比其他方案高，但无法引用模块本身(本身不是对象)，可拓展JS高级语法(宏和类型校验)

这个区别直接决定了打包体积。`const { debounce } = require('lodash')` 是运行时加载，整个 lodash 都会被打进去；`import { debounce } from 'lodash-es'` 是编译时加载，打包器能静态分析出你只用了一个函数，把其余的摇掉。项目里有人图省事写成 CommonJS 引入方式，包体积莫名其妙涨几百 KB，多半就是这个原因。

**加载实现**

- **传统加载**：通过`<script>`进行同步或异步加载脚本
  - 同步加载：`<script src=""></script>`
  - `Defer`异步加载：`<script src="" defer></script>`(顺序加载，渲染完再执行)
  - `Async`异步加载：`<script src="" async></script>`(乱序加载，下载完就执行)
- **模块加载**：`<script type="module" src=""></script>`(默认是`Defer`异步加载)

**CommonJS和ESM的区别**

- `CommonJS`输出值的拷贝，`ESM`输出值的引用
  - `CommonJS`一旦输出一个值，模块内部的变化就影响不到这个值
  - `ESM`是动态引用且不会缓存值，模块里的变量绑定其所在的模块，等到脚本真正执行时，再根据这个只读引用到被加载的那个模块里去取值
- `CommonJS`是运行时加载，`ESM`是编译时加载
  - `CommonJS`加载模块是对象(即`module.exports`)，该对象只有在脚本运行完才会生成
  - `ESM`加载模块不是对象，它的对外接口只是一种静态定义，在代码静态解析阶段就会生成

「拷贝还是引用」这条差异有个经典验证：模块里导出一个计数器变量和一个自增函数，外部调用函数之后再读那个变量。CommonJS 下读到的还是旧值，ESM 下读到的是新值。写单例、写全局配置模块时如果混用了两种规范，这个差异会让你怀疑人生。

**Node加载**

下面这几条是 2019 年那会儿的状态，Node 对 ESM 的支持当时还挂在实验标志后面。现在的 Node 已经把这套流程规范化了，主要变化是可以在 `package.json` 里写 `"type": "module"` 来让 `.js` 直接按 ESM 解析，不再必须改后缀，`--experimental-modules` 这个标志也早就不需要了。具体到你用的那个 Node 版本支持到什么程度，以 Node 官方文档的 Modules 章节为准。原文这套 `.mjs` 方案本身仍然有效，只是不再是唯一选择。

- 背景：`CommonJS`和`ESM`互不兼容，目前解决方案是将两者分开，采用各自的加载方案
- 区分：要求`ESM`采用`.mjs`后缀文件名
  - `require()`不能加载`.mjs`文件，只有`import`命令才可加载`.mjs`文件
  - `.mjs`文件里不能使用`require()`，必须使用`import`命令加载文件
- 驱动：`node --experimental-modules file.mjs`
- 限制：`Node`的`import`命令目前只支持加载本地模块(`file:协`议)，不支持加载远程模块
- 加载优先级
  - 脚本文件省略后缀名：依次尝试加载四个后缀名文件(`.mjs`、`.js`、`.json`、`node`)
  - 以上不存在：尝试加载`package.json`的`main`字段指定的脚本
  - 以上不存在：依次尝试加载名称为`index`四个后缀名文件(`.mjs`、`.js`、`.json`、`node`)
  - 以上不存在：报错
- 不存在的内部变量：`arguments`、`exports`、`module`、`require`、`this`、`__dirname`、`__filename`
- `CommonJS`加载`ESM`
  - 不能使用`require()`，只能使用`import()`
- `ESM`加载`CommonJS`
  - 自动将`module.exports`转化成`export default`
  - `CommonJS`输出缓存机制在ESM加载方式下依然有效
  - 采用`import`命令加载`CommonJS`模块时，不允许采用按需导入，应使用默认导入或整体导入
  
**循环加载**

- 定义：脚本`A`的执行依赖脚本`B`，而脚本`A`的执行又依赖脚本B
- **加载原理**
  - `CommonJS`：`require()`首次加载脚本就会执行整个脚本，在内存里生成一个对象缓存下来，二次加载脚本时直接从缓存中获取
  - `ESM`：`import`命令加载变量不会被缓存，而是成为一个指向被加载模块的引用
- **循环加载**
  - `CommonJS`：只输出已经执行的部分，还未执行的部分不会输出
  - `ESM`：需开发者自己保证真正取值时能够取到值(可把变量写成函数形式，函数具有提升作用)

循环依赖这块建议的处理方式其实是「别让它发生」。真遇到了，多数是模块划分出了问题，两个模块互相要对方的东西，通常意味着该抽第三个模块出来。用函数提升绕过去只是应急手段，代码可读性会变差。

**重点难点**

- `ES6`模块中，顶层`this`指向`undefined`，不应该在顶层代码使用`this`
- 一个模块就是一个独立的文件，该文件内部的所有变量，外部无法获取
- `export`命令输出的接口与其对应的值是动态绑定关系，即通过该接口可获取模块内部实时的值
- `import`命令大括号里的变量名必须与被导入模块对外接口的名称相同
- `import`命令输入的变量只读(本质是输入接口)，不允许在加载模块的脚本里改写接口
- `import`命令具有提升效果，会提升到整个模块的头部，首先执行
- 重复执行同一句import语句，只会执行一次
- `export default`命令只能使用一次
- `export default`命令导出的整体模块，在执行`import`命令时其后不能跟大括号
- `export default`命令本质是输出一个名为`default`的变量，后面不能跟变量声明语句
- `export default`命令本质是将后面的值赋给名为`default`的变量，可直接将值写在其后
- `export default`命令和`export {}`命令可同时存在，对应复合导入
- `export`命令和`import`命令可出现在模块任何位置，只要处于模块顶层即可，不能处于块级作用域
- `import()`加载模块成功后，此模块会作为一个对象，当作`then()`的参数，可使用对象解构赋值来获取输出接口
- 同时动态加载多个模块时，可使用`Promise.all()`和`import()`相结合来实现
- `import()`结合`async/await`来书写同步风格的代码

「`import` 具有提升效果」这条经常被忽略，但它能解释一个现象：你在 `import` 之前写的那行 `console.log()`，输出顺序永远在被导入模块的顶层代码之后。因为 ESM 是先把所有依赖解析、加载、求值完，才轮到当前模块的语句执行。

**单例模式：跨模块常量**

模块天然就是单例，一个文件不管被多少地方 import，只会求值一次，导出的东西大家共用同一份。所以想在多个文件间共享常量，不需要挂到 `window` 上，建一个常量模块导出就行。

```js
// 常量跨文件共享
// person.js
const NAME = "Bruce";
const AGE = 25;
const SEX = "male";
export { AGE, NAME, SEX };
```

```js
// file1.js
import { AGE } from "person";
console.log(AGE);
```

```js
// file2.js
import { AGE, NAME, SEX } from "person";
console.log(AGE, NAME, SEX);
```

> 默认导入互换整体导入

同一个模块，用默认导入和整体导入拿到的东西层级不一样，这是新手最容易搞混的地方。默认导入直接拿到 `export default` 的那个值，整体导入拿到的是整个命名空间对象，默认导出被放在它的 `default` 属性上。

```js
import Person from "person";
console.log(Person.AGE);
```

```js
import * as Person from "person";
console.log(Person.default.AGE);
```

### Iterator

`Iterator` 是 ES2015 里存在感最低、但地位最高的一块。`for-of`、扩展运算符、解构赋值、`Array.from()`、`yield*`、`Promise.all()`，这些看起来毫不相干的语法，底层走的都是同一套迭代协议。搞懂它，上面这一堆特性就串成一条线了。

- 定义：为各种不同的数据结构提供统一的访问机制
- 原理：创建一个指针指向首个成员，按照次序使用`next()`指向下一个成员，直接到结束位置(数据结构只要部署`Iterator`接口就可完成遍历操作)
- **作用**
  - 为各种数据结构提供一个统一的简便的访问接口
  - 使得数据结构成员能够按某种次序排列
  - `ES6`创造了新的遍历命令`for-of`，`Iterator`接口主要供`for-of`消费
- 形式：`for-of`(自动去寻找`Iterator`接口)
- 数据结构
  - 集合：`Array`、`Object`、`Set`、`Map`
  - 原生具备接口的数据结构：`String`、`Array`、`Set`、`Map`、`TypedArray`、`Arguments、NodeList`
- 部署：默认部署在`Symbol.iterator`(具备此属性被认为可遍历的`iterable`)
- 遍历器对象
  - `next()`：下一步操作，返回`{ done, value }`(必须部署)
  - `return()`：`for-of`提前退出调用，返回`{ done: true }`
  - `throw()`：不使用，配合`Generator`函数使用
  
**ForOf循环**

- 定义：调用`Iterator`接口产生遍历器对象(`for-of`内部调用数据结构的`Symbol.iterator()`)
- 遍历字符串：`for-in`获取索引，`for-of`获取值(可识别32位UTF-16字符)
- 遍历数组：`for-in`获取索引，`for-of`获取值
- 遍历对象：`for-in`获取键，`for-of`需自行部署
- 遍历`Set`：`for-of`获取值 => `for (const v of set)`
- 遍历`Map`：`for-of`获取键值对 =>  `for (const [k, v] of map)`
- 遍历类数组：包含`length`的对象、`Arguments`对象、`NodeList`对象(无`Iterator`接口的类数组可用`Array.from()`转换)
- 计算生成数据结构：`Array`、`Set`、`Map`
  - `keys()`：返回遍历器对象，遍历所有的键
  - `values()`：返回遍历器对象，遍历所有的值
  - `entries()`：返回遍历器对象，遍历所有的键值对
- **与for-in区别**
  - 有着同`for-in`一样的简洁语法，但没有`for-in`那些缺点
  - 不同于`forEach()`，它可与`break`、`continue`和`return`配合使用
  - 提供遍历所有数据结构的统一操作接口

「能配合 `break` 用」这条是 `for-of` 相对 `forEach()` 的核心优势。`forEach()` 一旦开跑就停不下来，想提前退出只能靠抛异常这种脏办法。需要在遍历中途跳出的循环，一律用 `for-of`。

普通对象没有 `Symbol.iterator`，所以 `for (const v of obj)` 会报 `obj is not iterable`。想遍历对象，要么用 `Object.entries(obj)` 转成数组再 `for-of`，要么自己给对象部署一个迭代器方法。很多人可能没注意到，这也是为什么 `[...obj]` 会报错，而 `{ ...obj }` 却完全正常，后者走的是另一套对象展开规则，跟迭代协议没关系。

**应用场景**

- 改写具有`Iterator`接口的数据结构的`Symbol.iterator`
- 解构赋值：对`Set`进行结构
- 扩展运算符：将部署Iterator接口的数据结构转为数组
- `yield*`：`yield*`后跟一个可遍历的数据结构，会调用其遍历器接口
- 接受数组作为参数的函数：`for-of`、`Array.from()`、`new Set()`、`new WeakSet()`、`new Map()`、`new WeakMap()`、`Promise.all()`、`Promise.race()`

### Promise

回调地狱不是「嵌套太深不好看」这么简单，真正的麻烦是错误处理没法统一，每一层都得自己判断 `err`，漏一层就静默失败。`Promise` 把异步结果变成了一个可以传递、可以链式组合的对象，错误顺着链条往下冒，一个 `catch()` 兜底。

想搞清楚状态机怎么转、`then` 为什么能链式调用，建议直接照着规范手写一遍，比看十篇文章都管用。

- 定义：包含异步操作结果的对象
- 状态
  - 进行中：`pending`
  - 已成功：`resolved`
  - 已失败：`rejected`

补一句术语上的事。规范里这三个状态的正式叫法是 `pending`、`fulfilled`、`rejected`，`resolved` 严格说指的是「这个 Promise 已经锁定到某个结果上」，它可能锁定到另一个 pending 的 Promise，那时候状态还没落定。日常交流里 `resolved` 和 `fulfilled` 基本混着用，面试遇到较真的面试官，答 `fulfilled` 更稳。
- 特点
  - 对象的状态不受外界影响
  - 一旦状态改变就不会再变，任何时候都可得到这个结果
- 声明：`new Promise((resolve, reject) => {})`
- 出参
  - `resolve`：将状态从未完成变为成功，在异步操作成功时调用，并将异步操作的结果作为参数传递出去
  - `reject`：将状态从未完成变为失败，在异步操作失败时调用，并将异步操作的错误作为参数传递出去
- 方法
  - `then()`：分别指定`resolved`状态和`rejected`状态的回调函数
    - 第一参数：状态变为`resolved`时调用
    - 第二参数：状态变为`rejected`时调用(可选)
  - `catch()`：指定发生错误时的回调函数
  - `Promise.all()`：将多个实例包装成一个新实例，返回全部实例状态变更后的结果数组(齐变更再返回)
    - 入参：具有`Iterator`接口的数据结构
    - 成功：只有全部实例状态变成`resolved`，最终状态才会变成`resolved`
    - 失败：其中一个实例状态变成`rejected`，最终状态就会变成`rejected`
  - `Promise.race()`：将多个实例包装成一个新实例，返回全部实例状态优先变更后的结果(先变更先返回)
  - `Promise.resolve()`：将对象转为Promise对象(等价于`new Promise(resolve => resolve())`)
    - `Promise`实例：原封不动地返回入参
    - `Thenable`对象：将此对象转为`Promise`对象并返回(`Thenable`为包含`then()`的对象，执行`then()`相当于执行此对象的`then()`)
    - 不具有`then()`的对象：将此对象转为`Promise`对象并返回，状态为`resolved`
    - 不带参数：返回`Promise`对象，状态为`resolved`
  - `Promise.reject()`：将对象转为状态为`rejected`的`Promise`对象(等价于`new Promise((resolve, reject) => reject())`)
  

`Promise.all()` 和 `Promise.race()` 这两个静态方法是并发控制的基本盘。`all()` 用来并行发多个请求、全都回来再渲染；`race()` 最典型的用法是做超时，把真实请求和一个 `setTimeout` 后 reject 的 Promise 放一起赛跑，谁快听谁的。

这里要提一个当年没有的能力。`Promise.all()` 有个明显缺陷：一个失败全盘皆输，剩下那些成功的结果你一个也拿不到。后来标准补上了 `Promise.allSettled()`，它等所有 Promise 都落定，返回每一项的状态和值，成功失败都给你；还有 `Promise.any()`，任意一个成功就返回，全失败才 reject，跟 `race()` 的区别是它不会被第一个失败带偏。这两个方法都是本文写完之后才进的标准，具体版本以 MDN 为准。原文列的 `all()` 和 `race()` 依然有效，只是遇到「部分失败也要拿结果」的场景，现在有更顺手的选择了。

**应用场景**

- 加载图片
- `AJAX`转`Promise`对象

**重点难点**

- 只有异步操作的结果可决定当前状态是哪一种，其他操作都无法改变这个状态
- 状态改变只有两种可能：从`pending`变为`resolved`、从`pending`变为`rejected`
- 一旦新建`Promise`对象就会立即执行，无法中途取消
- 不设置回调函数，内部抛错不会反应到外部
- 当处于`pending`时，无法得知目前进展到哪一个阶段
- 实例状态变为`resolved`或`rejected`时，会触发`then()`绑定的回调函数
- `resolve()`和`reject()`的执行总是晚于本轮循环的同步任务
- `then()`返回新实例，其后可再调用另一个`then()`
- `then()`运行中抛出错误会被`catch()`捕获
- `reject()`的作用等同于抛出错误
- 实例状态已变成`resolved`时，再抛出错误是无效的，不会被捕获，等于没有抛出
- 实例状态的错误具有冒泡性质，会一直向后传递直到被捕获为止，错误总是会被下一个`catch()`捕获
- 不要在`then()`里定义`rejected`状态的回调函数(不使用其第二参数)
- 建议使用`catch()`捕获错误，不要使用`then()`第二个参数捕获
- 没有使用`catch()`捕获错误，实例抛错不会传递到外层代码，即不会有任何反应
- 作为参数的实例定义了`catch()`，一旦被`rejected`并不会触发`Promise.all()`的`catch()`
- `Promise.reject()`的参数会原封不动地作为`rejected`的理由，变成后续方法的参数

「没有 `catch()` 的话抛错不会传到外层」这条在早期是真会吃亏的，一个 Promise 里报错整个页面毫无反应，控制台干干净净。现在的浏览器和 Node 都会对未处理的 rejection 发出警告（Node 里默认还会直接让进程退出），情况好了不少，但该写的 `catch()` 一个都不能少。

「一旦新建就立即执行，无法中途取消」这条也值得展开。`new Promise(executor)` 里的 `executor` 是同步执行的，不是等到 `then()` 才跑。想要「用到了才发请求」，得包一层函数返回 Promise。至于取消，标准里始终没有原生方案，实际项目里用的是 `AbortController` 配合 `fetch`，那属于 Web API 而不是语言特性。

### Generator

`Generator` 是 JavaScript 里唯一能「暂停函数执行」的语法。它当年最主要的用途是配合 co 这类执行器写同步风格的异步代码，后来 `async/await` 直接把这套模式内置进语言，`Generator` 在业务代码里就退居二线了。但它在 redux-saga、在自定义迭代器、在惰性求值这些场景里依然不可替代。

- 定义：封装多个内部状态的异步编程解决方案
- 形式：调用`Generator`函数(该函数不执行)返回指向内部状态的指针对象(不是运行结果)
- 声明：`function* Func() {}`
- 方法
  - `next()`：使指针移向下一个状态，返回`{ done, value }`(入参会被当作上一个`yield`命令表达式的返回值)
  - `return()`：返回指定值且终结遍历`Generator`函数，返回`{ done: true, value: 入参 }`
  - `throw()`：在`Generator`函数体外抛出错误，在`Generator`函数体内捕获错误，返回自定义的`new Errow()`
- `yield`命令：声明内部状态的值(`return`声明结束返回的值)
  - 遇到`yield`命令就暂停执行后面的操作，并将其后表达式的值作为返回对象的`value`
  - 下次调用`next()`时，再继续往下执行直到遇到下一个`yield`命令
  - 没有再遇到`yield`命令就一直运行到`Generator`函数结束，直到遇到`return`语句为止并将其后表达式的值作为返回对象的`value`
  - `Generator`函数没有`return`语句则返回对象的`value`为`undefined`
- `yield*`命令：在一个`Generator`函数里执行另一个`Generator`函数(后随具有`Iterator`接口的数据结构)
- 遍历：通过`for-of`自动调用`next()`
- 作为对象属性
  - 全写：`const obj = { method: function*() {} }`
  - 简写：`const obj = { * method() {} }`
- 上下文：执行产生的上下文环境一旦遇到`yield`命令就会暂时退出堆栈(但并不消失)，所有变量和对象会冻结在当前状态，等到对它执行`next()`时，这个上下文环境又会重新加入调用栈，冻结的变量和对象恢复执行

**方法异同**

- **相同点**：
  - `next()`、`throw()`、`return()`说到底是同一件事，作用都是让函数恢复执行且使用不同的语句替换yield命令
- **不同点**
  - `next()`：将`yield`命令替换成一个值
  - `return()`：将`yield`命令替换成一个`return`语句
  - `throw()`：将`yield`命令替换成一个`throw`语句

**应用场景**

- 异步操作同步化表达
- 控制流管理
- 为对象部署`Iterator`接口：把`Generator`函数赋值给对象的`Symbol.iterator`，从而使该对象具有`Iterator`接口
- 作为具有`Iterator`接口的数据结构

**重点难点**

- 每次调用`next()`，指针就从函数头部或上次停下的位置开始执行，直到遇到下一个`yield`命令或`return`语句为止
- 函数内部可不用`yield`命令，但会变成单纯的暂缓执行函数(还是需要`next()`触发)
- `yield`命令是暂停执行的标记，`next()`是恢复执行的操作
- `yield`命令用在另一个表达式中必须放在圆括号里
- `yield`命令用作函数参数或放在赋值表达式的右边，可不加圆括号
- `yield`命令本身没有返回值，可认为是返回`undefined`
- `yield`命令表达式为惰性求值，等`next()`执行到此才求值
- 函数调用后生成遍历器对象，此对象的`Symbol.iterator`是此对象本身
- 在函数运行的不同阶段，通过`next()`从外部向内部注入不同的值，从而调整函数行为
- 首个`next()`用来启动遍历器对象，后续才可传递参数
- 想首次调用`next()`时就能输入值，可在函数外面再包一层
- 一旦`next()`返回对象的`done`为`true`，`for-of`遍历会中止且不包含该返回对象
- 函数内部部署`try-finally`且正在执行`try`，那么`return()`会导致立刻进入`finally`，执行完`finally`以后整个函数才会结束
- 函数内部没有部署`try-catch`，`throw()`抛错将被外部`try-catch`捕获
- `throw()`抛错要被内部捕获，前提是必须至少执行过一次`next()`
- `throw()`被捕获以后，会附带执行下一条`yield`命令
- 函数还未开始执行，这时`throw()`抛错只可能抛出在函数外部

「首个 `next()` 用来启动遍历器对象，后续才可传递参数」这条最容易绕晕。原因是 `next()` 的入参会被当成上一个 `yield` 表达式的返回值，第一次调用时压根还没执行到任何 `yield`，传进去的值无处安放，就被丢掉了。

> 首次next()可传值

想让第一次调用就能传值，办法是在外面包一层，先替调用方消耗掉那个启动用的 `next()`。下面这段就是这个包装器。

```js
function Wrapper(func) {
    return function(...args) {
        const generator = func(...args);
        generator.next();
        return generator;
    }
}
const print = Wrapper(function*() {
    console.log(`First Input: ${yield}`);
    return "done";
});
print().next("hello");
```

## 三、ES2016

ES2015 塞得太满，导致标准落地和引擎实现都拖了很久。TC39 吸取教训，从这一年开始改成小步快跑，谈拢一个发一个。所以 ES2016 只有两条，是历史上最短的一版，短到经常被人以为不存在。

![ES2016 新增特性一览](https://s.poetries.top/gitee/2019/11/126.png)

### 数值扩展

- 指数运算符(`**`)：数值求幂(相当于`Math.pow()`)

`2 ** 10` 比 `Math.pow(2, 10)` 短，而且支持复合赋值 `x **= 2`。有个细节要留意，它是右结合的，`2 ** 3 ** 2` 等于 `2 ** 9` 而不是 `8 ** 2`。另外左操作数不能直接写一元表达式，`-2 ** 2` 会报语法错误，必须写成 `(-2) ** 2`，这是规范故意留的强制括号，防止你把优先级搞混。

### 数组扩展

- `includes()`：是否存在指定成员

在这之前判断数组里有没有某个值，得写 `arr.indexOf(x) !== -1`，又长又不直观，还有个硬伤：`indexOf()` 内部用严格相等比较，`[NaN].indexOf(NaN)` 返回 `-1`。`includes()` 用的是 SameValueZero，能正确识别 `NaN`。

顺带说一句，字符串的 `includes()` 是 ES2015 就有的，数组的要等到 ES2016，这两个经常被记混。

## 四、ES2017

这一版的分量比 ES2016 重得多，因为它带来了 `async/await`。异步写法从 Promise 链条进化到同步风格，这是近十年 JavaScript 体验提升最大的一次改动。

![ES2017 新增特性一览](https://s.poetries.top/gitee/2019/11/127.png)

**声明**
 
- 共享内存和原子操作：由全局对象`SharedArrayBuffer`和`Atomics`实现，将数据存储在一块共享内存空间中，这些数据可在`JS`主线程和`web-worker`线程之间共享

这个 API 后来因为 Spectre 侧信道攻击被各家浏览器默认关掉过一段时间，重新启用要求页面设置跨源隔离相关的响应头。现在是不是可用、要配哪些头，以 MDN 上 `SharedArrayBuffer` 页面的安全要求一节为准，别照着老文章直接抄。

### 字符串扩展

- `padStart()`：把指定字符串填充到字符串头部，返回新字符串
- `padEnd()`：把指定字符串填充到字符串尾部，返回新字符串

补零场景终于不用自己写循环了。时间格式化 `String(m).padStart(2, '0')`、手机号打码、控制台对齐输出，这三个是我用得最多的地方。注意第二个参数省略时默认填空格，以及如果原字符串已经够长，它什么都不做而不是截断。

**对象扩展**

- `Object.getOwnPropertyDescriptors()`：返回对象所有自身属性(非继承属性)的描述对象
- `Object.values()`：返回以值组成的数组
- `Object.entries()`：返回以键和值组成的数组

`Object.entries()` 是把对象转成可迭代结构的标准姿势，配合 `for-of` 和解构写起来很顺：`for (const [k, v] of Object.entries(obj))`。

`Object.getOwnPropertyDescriptors()` 看着冷门，但它是修复 `Object.assign()` 缺陷的关键。`Object.assign()` 拷贝时会触发 getter 并把结果存成普通值，取值函数就丢了；配合这个方法和 `Object.defineProperties()` 才能连描述符一起搬过去。

### 函数扩展

- 函数参数尾逗号：允许函数最后一个参数有尾逗号

这条纯粹是为了 Git diff 好看。加参数时不用去动上一行，diff 里就只有一行新增而不是一增一改。

**Async**

`async/await` 是 `Generator` 加自动执行器的语法糖，这个说法很准确。以前用 co 库跑 `Generator` 才能实现的效果，现在语言直接内置了执行器，不用再装任何东西。相关细节我在这篇里展开讲过：[ES6系列之async await的用法与实现原理](https://feinterview.poetries.top/blog/es6-async)。

- 定义：使异步函数以同步函数的形式书写(`Generator`函数语法糖)
- 原理：将`Generator`函数和自动执行器`spawn`包装在一个函数里
- 形式：将`Generator`函数的`*`替换成`async`，将`yield`替换成`await`
- **声明**
  - 具名函数：`async function Func() {}`
  - 函数表达式：`const func = async function() {}`
  - 箭头函数：`const func = async() => {}`
  - 对象方法：`const obj = { async func() {} }`
  - 类方法：`class Cla { async Func() {} }`
- **await命令**：等待当前`Promise`对象状态变更完毕
  - 正常情况：后面是`Promise`对象则返回其结果，否则返回对应的值
  - 后随`Thenable`对象：将其等同于`Promise`对象返回其结果
- **错误处理**：将`await`命令`Promise`对象放到`try-catch`中(可放多个)

**Async对Generator改进**

- 内置执行器
- 更好的语义
- 更广的适用性
- 返回值是`Promise`对象

**应用场景**

- 按顺序完成异步操作

**重点难点**

- `Async`函数返回`Promise`对象，可使用`then()`添加回调函数
- 内部`return`返回值会成为后续`then()`的出参
- 内部抛出错误会导致返回的`Promise`对象变为`rejected`状态，被`catch()`接收到
- 返回的`Promise`对象必须等到内部所有`await`命令`Promise`对象执行完才会发生状态改变，除非遇到`return`语句或抛出错误
- 任何一个`await`命令`Promise`对象变为`rejected`状态，整个`Async`函数都会中断执行
- 希望即使前一个异步操作失败也不要中断后面的异步操作
  - 将`await`命令`Promise`对象放到`try-catch`中
  - `await`命令`Promise`对象跟一个`catch()`
- `await`命令`Promise`对象可能变为`rejected`状态，最好把其放到`try-catch`中
- 多个`await`命令`Promise`对象若不存在继发关系，最好让它们同时触发
- `await`命令只能用在`Async`函数之中，否则会报错
- 数组使用`forEach()`执行`async/await`会失效，可使用`for-of`和`Promise.all()`代替
- 可保留运行堆栈，函数上下文随着`Async`函数的执行而存在，执行完成就消失

倒数第二条是重灾区，我见过太多人栽在这。`arr.forEach(async item => { await save(item) })` 这行代码不会等任何一个 `save` 完成，`forEach` 拿到一堆 Promise 之后直接扔掉走人，后面的代码立刻执行。要串行就用 `for-of` 包 `await`，要并行就 `await Promise.all(arr.map(fn))`。

「多个 `await` 若不存在继发关系，最好让它们同时触发」这条也值得展开。连着写两行 `await` 是串行的，两个 500ms 的请求要花 1s；先各自调用拿到 Promise 再 `await Promise.all([p1, p2])`，总耗时就是 500ms。列表页同时拉配置和数据的场景，这一改就是一倍的首屏提速。

那什么时候必须串行呢？后一个请求要用前一个的返回值时。除此之外，能并行就并行。

## 五、ES2018

这一年的主题是「把之前只给数组的能力补给对象和异步」。对象扩展运算符、异步迭代，都是在补齐正交性。

![ES2018 新增特性一览](https://s.poetries.top/gitee/2019/11/128.png)

### 字符串扩展

- 放松对标签模板里字符串转义的限制：遇到不合法的字符串转义返回`undefined`，并且从`raw`上可获取原字符串

这条是为了让标签模板能承载 LaTeX、Windows 路径这类含大量反斜杠的文本。以前 `\unicode` 这种写法直接报语法错误，现在解析出来的值是 `undefined`，但原始文本还能从 `raw` 上拿到。

**对象扩展**

- 扩展运算符(`...`)：转换对象为用逗号分隔的参数序列(`{ ...obj }`，相当于`rest/spread`参数的逆运算)

对象展开是 ES2018 里用得最多的一条，React 里改 state、Redux 里写 reducer 全靠它。要记住它跟 `Object.assign()` 一样是浅拷贝，而且只复制自身可枚举属性，原型链上的东西不带。

> 扩展应用

- 克隆对象：`const obj = { __proto__: Object.getPrototypeOf(obj1), ...obj1 }`
- 合并对象：`const obj = { ...obj1, ...obj2 }`
- 转换字符串为对象：`{ ..."hello" }`
- 转换数组为对象：`{ ...[1, 2] }`
- 与对象解构赋值结合：`const { x, ...rest/spread } = { x: 1, y: 2, z: 3 }`(不能复制继承自原型对象的属性)
- 修改现有对象部分属性：`const obj = { x: 1, ...{ x: 2 } }`

### 正则扩展

正则这块是 ES2018 里改动最集中的部分，四条加起来把 JavaScript 正则和其他语言的差距拉平了不少，尤其是后行断言，以前只能靠捕获组绕。

- `s`修饰符：`dotAll`模式修饰符，使`.`匹配任意单个字符(`dotAll`模式)
- `dotAll`：是否设置`s`修饰符
- 后行断言：`x`只有在`y`后才匹配
- 后行否定断言：`x`只有不在`y`后才匹配
- **`Unicode`属性转义**：匹配符合`Unicode`某种属性的所有字符
  - 正向匹配：`\p{PropRule}`
  - 反向匹配：`\P{PropRule}`
  - 限制：`\p{...}`和`\P{...}`只对`Unicode`字符有效，使用时需加上u修饰符
- **具名组匹配**：为每组匹配指定名字(`?<GroupName>`)
  - 形式：`str.exec().groups.GroupName`
  - 解构赋值替换
    - 声明：`const time = "2017-09-11"、const regexp = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/u`
    - 匹配：`time.replace(regexp, "$<day>/$<month>/$<year>")`

具名组匹配是这几条里最该用起来的。以前解析日期得数 `match[1]` 是年还是月，改一次正则后面全乱套；现在写 `groups.year`，改正则也不影响读取代码。可读性上的收益很直接。

`s` 修饰符也别小看。`.` 默认不匹配换行符，用正则去截取多行 HTML 片段时经常匹配失败，很多人绕道用 `[\s\S]`，加个 `s` 修饰符就干净了。

### Promise

- `finally()`：指定不管最后状态如何都会执行的回调函数

`finally()` 的典型场景是关 loading。以前得在 `then()` 和 `catch()` 里各写一遍 `setLoading(false)`，现在一处搞定。它的回调不接收参数，因为它不该关心成功还是失败；而且它会把上游的值或错误原样往下传，不影响链条。

### Async

- 异步迭代器(`for-await-of`)：循环等待每个`Promise`对象变为`resolved`状态才进入下一步

这个配合异步 Generator 用，处理流式数据特别顺手。读大文件、消费分页接口、处理 SSE 推流，都可以写成 `for await (const chunk of stream)`，一行一行来，不用把所有数据攒在内存里。

## 六、ES2019

到了这一年，能加的大件基本加完了，剩下的都是把社区里高频的工具函数收编进标准。`flat()`、`fromEntries()`、`trimStart()` 这几个，以前都得靠 lodash 或者自己写。

![ES2019 新增特性一览](https://s.poetries.top/gitee/2019/11/129.png)

### 字符串扩展

- 直接输入`U+2028`和`U+2029`：字符串可直接输入行分隔符和段分隔符
- `JSON.stringify()`改造：可返回不符合`UTF-8`标准的字符串
- `trimStart()`：消除字符串头部空格，返回新字符串
- `trimEnd()`：消除字符串尾部空格，返回新字符串

处理用户输入时，只想去掉尾部空格保留缩进的场景就靠 `trimEnd()`。这两个方法各自还有个别名 `trimLeft()` 和 `trimRight()`，是为了兼容早已存在的浏览器实现保留的，写新代码用带 Start/End 的那对，语义上对从右往左的语言更友好。

### 对象扩展

- `Object.fromEntries()`：返回以键和值组成的对象(`Object.entries()`的逆操作)

这个和 `Object.entries()` 凑成一对，让「对象转数组，处理完再转回对象」变成一条流水线。最常见的用法是过滤对象字段：`Object.fromEntries(Object.entries(obj).filter(([k]) => k !== 'password'))`。它也能直接吃 `Map` 和 `URLSearchParams`，把 query string 转成对象就是一行。

### 数组扩展

- `flat()`：扁平化数组，返回新数组
- `flatMap()`：映射且扁平化数组，返回新数组(只能展开一层数组)

`flat()` 默认只拍平一层，想全部拍平传 `Infinity` 进去。它还会顺手删掉数组里的空位，这个副作用有时挺好用。`flatMap()` 等于 `map()` 之后再 `flat(1)`，处理「一项展开成多项」的场景很合适，比如把每条评论和它的回复拉平成一个列表。

另外这一版还规定了 `Array.prototype.sort()` 必须是稳定排序。以前不同引擎实现不一，元素数量超过阈值时排序结果的相对顺序可能变，做多字段排序时会出玄学 bug，这条落地之后就不用担心了。

### 函数扩展

- `toString()`改造：返回函数原始代码(与编码一致)
- `catch()`参数可省略：`catch()`中的参数可省略

`Function.prototype.toString()` 返回原始代码这条，是 Vue 2 里 props 类型推断、以及各种依赖注入框架解析参数名的基础。`catch {}` 省略参数则是纯粹的书写便利，你只想兜底不关心错误内容时，不用再写一个用不到的 `e` 让 ESLint 报未使用变量。

### Symbol
 
- `description`：返回`Symbol`值的描述

以前想拿到描述只能 `String(sym).slice(7, -1)` 这样切字符串，现在有正经属性了。注意它是只读的，而且没传描述时返回 `undefined` 而不是空字符串。

## 七、ES提案

下面这些是本文写作时（2019 年）还在 TC39 提案流程里的语法。这一节我原样保留了当时的记录，因为它能反映那个时间点的真实生态；同时在每块下面补了一段现状说明。需要强调的是，提案的阶段和进标准的年份变动频繁，下面凡是涉及「现在到哪一步了」的判断，请以 TC39 提案仓库和 MDN 为准，别拿这篇文章当依据去答面试题。

![ES 提案阶段特性一览](https://s.poetries.top/gitee/2019/11/130.png)

### 声明

- `globalThis`对象：作为顶层对象，指向全局环境下的`this`
- `do`表达式：封装块级作用域的操作，返回内部最后执行表达式的值(`do{}`)
- `throw`表达式：直接使用`throw new Error()`，无需`()`或`{}`包括
- `#!`命令：指定脚本执行器(写在文件首行，原文误写为`!#`)

`globalThis` 后来是落地了的。在这之前，浏览器里是 `window`，Worker 里是 `self`，Node 里是 `global`，写通用库得靠一段丑陋的嗅探代码去拼，现在一个 `globalThis` 全平台通吃。至于 `do` 表达式和 `throw` 表达式，本文写完这些年一直没见它们进标准，当前状态以 TC39 提案仓库为准。

Hashbang 那条原文写成了 `!#`，正确写法是 `#!`（井号在前），也就是 `#!/usr/bin/env node` 这种。这个符号在 Unix 里叫 shebang，作用是让脚本文件能直接执行。这里顺手改正。

### 数值扩展

- 数值分隔符(`_`)：使用`_`作为千分位分隔符(增加数值的可读性)
- `BigInt()`：创建任何位数的整数(新增的数据类型，使用`n`结尾)

这两条后来都进了标准。`BigInt` 是 JavaScript 的第八种原始类型，解决的是超过 `Number.MAX_SAFE_INTEGER` 之后整数会失真的问题，后端用 Java 的 `Long` 当 ID 传过来时最容易撞上。有两个坑要记：`BigInt` 不能和 `Number` 直接混算，`1n + 1` 会抛 `TypeError`；`JSON.stringify()` 也不认它，会直接报错，得自己写 `replacer` 转成字符串。

数值分隔符纯粹是可读性糖，`1_000_000` 一眼就知道是一百万。它在运行时会被完全忽略，不影响数值本身。

### 对象扩展

- 链判断操作符(`?.`)：是否存在对象属性(不存在返回`undefined`且不再往下执行)
- 空判断操作符(`??`)：是否值为`undefined`或`null`，是则使用默认值

这两个后来也都进标准了，而且是我用得最多的两个新语法。以前判空得写 `a && a.b && a.b.c`，一层层堆下去，现在 `a?.b?.c` 完事。`?.` 还能用在方法调用 `obj.fn?.()` 和下标访问 `arr?.[0]` 上。

`??` 和 `||` 的区别必须掰清楚，这是高频面试题。`||` 在左值为任意假值时都走右边，`0`、`''`、`false` 全会被顶掉；`??` 只在左值是 `null` 或 `undefined` 时才走右边。所以 `count || 10` 遇到 `count = 0` 会错误地取到 10，换成 `count ?? 10` 才对。这个我踩过，当时是分页组件的页码从 0 开始，默认值把用户选的第 0 页给覆盖了，排查了一下午才发现问题在这行判空上。

还有个语法限制：`??` 不能和 `||`、`&&` 直接混写，`a || b ?? c` 是语法错误，必须加括号明确优先级。规范这么设计就是为了逼你把意图写清楚。

### 函数扩展

- 函数部分执行：复用函数功能(`?`表示单个参数占位符，`...`表示多个参数占位符)
- 管道操作符(`|>`)：把左边表达式的值传入右边的函数进行求值(`f(x) => x |> f`)
- 绑定运算符(`::`)：函数绑定(左边是对象右边是函数，取代`bind`、`apply`、`call`调用)
  - `bind`：`bar.bind(foo)` => `foo::bar`
  - `apply`：`bar.apply(foo, arguments)` => `foo::bar(...arguments)`

这三条到今天为止我都没在生产项目里见过原生支持。管道操作符 `|>` 的语法形态社区吵了好几年，绑定运算符 `::` 更是长期没有推进。想用只能靠 Babel 插件，而且随时可能因为提案改语法而返工。具体状态以 TC39 提案仓库为准，我的建议是别在业务代码里赌这类还没定型的语法。

### Promise

- `Promise.try()`：不想区分是否同步异步函数，包装函数为实例，使用`then()`指定下一步流程，使用`catch()`捕获错误

原文这一节的标题写的是 Proxy，但内容讲的是 `Promise.try()`，明显是笔误，这里改成 Promise。

这个方法解决的问题很实在：你拿到一个函数，不知道它是同步抛错还是返回 rejected Promise，两种情况的错误处理路径不一样。`Promise.try()` 把两者统一成后者。它后来也落地了，进标准的具体年份以 MDN 为准。在那之前社区的通行写法是 `Promise.resolve().then(fn)`，效果接近，区别是会多等一个微任务。

### Realm

- 定义：提供沙箱功能，允许隔离代码，防止被隔离的代码拿到全局对象
- 声明：`new Realm().global`

这个提案后来改名叫 ShadowRealm，API 形态也和原文写的不一样了。它想解决的是「在同一个进程里跑不受信任的代码，但不让它碰到你的全局对象」，微前端和插件系统都很需要。当前推进到哪一步、API 长什么样，以 TC39 提案仓库为准。在它可用之前，微前端方案基本还是靠 iframe 或者手写 Proxy 沙箱在扛。

### Class

- 静态属性：使用`static`定义属性，该属性不会被实例继承，只能通过类来调用
- 私有属性：使用`#`定义属性，该属性只能在类内部访问
- 私有方法：使用`#`定义方法，该方法只能在类内部访问
- 装饰器：使用`@`注释或修改类和类方法

类字段、静态属性、`#` 私有成员这几条后来都进了标准，写法和原文记的一致。`#` 是真正的私有，跟前面 `Symbol` 那套「不好拿到」不一样，外部访问直接是语法错误，`Object.getOwnPropertySymbols()` 也挖不出来。还能用 `#x in obj` 来做品牌检查，判断某个对象是不是这个类的实例。

装饰器是这里面最坎坷的一个，提案推翻重写过好几轮，早年 TypeScript 里的 `experimentalDecorators` 和后来的标准版语义并不一样。用它之前先确认你的构建工具跟的是哪一版，以 TC39 提案仓库和你所用工具链的文档为准。

### Module

- **import()：动态导入(返回Promise)**
  - 背景：`import`命令被JS引擎静态分析，先于模块内的其他语句执行，无法取代`require()`的动态加载功能，提案建议引入`import()`来代替`require()`
  - 位置：可在任何地方使用
  - 区别：`require()`是同步加载，`import()`是异步加载
  - 场景：按需加载、条件加载、模块路径动态化
- **import.meta：返回脚本元信息**

动态 `import()` 后来进标准了，而且是现代前端路由懒加载的基础，React 的 `lazy()`、Vue Router 的异步组件，底层都是它。打包器看到 `import()` 会自动切出一个 chunk，这是代码分割的入口。

`import.meta` 也落地了，最常用的是 `import.meta.url` 拿当前模块的地址，Vite 里的 `import.meta.env` 和 `import.meta.glob` 则是在这个语法上做的扩展。

### Async

- 顶层`Await`：允许在模块的顶层独立使用`await`命令(借用`await`解决模块异步加载的问题)

顶层 await 后来也进了标准，但有个前提：只在 ES 模块里可用，普通脚本和 CommonJS 里写会报错。它的代价是会阻塞依赖当前模块的其他模块求值，用来做「拿到配置再导出」这类初始化很合适，塞进热路径就得掂量一下了。

## 总结

把这五年的更新连起来看，脉络其实很清楚。ES2015 一次性补齐了块级作用域、模块、类、迭代协议、Promise 这几块地基，也正因为塞得太满拖了太久，才有了后面按年份小步发布的节奏。ES2016 只有两条，ES2017 靠 `async/await` 一条撑起整年，ES2018 补对象展开和异步迭代，ES2019 收编社区高频工具函数。越往后单次更新越小，但整体更稳。

复习的时候有几个点特别值得单独记一遍。`let` 和 `const` 的暂时性死区不是「没有提升」而是「未初始化」；解构默认值只认 `undefined` 不认 `null`；箭头函数没有自己的 `this` 而不是绑定了 `this`；`Proxy` 拦的是代理实例，操作原对象一律不触发；`forEach()` 里写 `await` 等于没写。这五条我见过最多人答错。

还有一件事得说在前面。这篇写于 2019 年，当时归在「提案」那一节的 `?.`、`??`、`BigInt`、`#` 私有属性、动态 `import()`、顶层 await，后来都成了正式标准，日常写业务已经可以放心用；而管道操作符、绑定运算符、ShadowRealm 这些至今仍在流程里。所以看到任何一篇讲提案的老文章，包括这一篇，都请回 TC39 提案仓库和 MDN 上确认当前状态再下结论。

面试前想快速过一遍的话，建议按「ES2015 一整块 + 后面四年各几条」这个结构记，比按 API 字母序背有效得多。被问到某个特性属于哪一年，答不出精确年份没关系，能说清它解决了什么问题、和前一代写法差在哪，反而更能体现你是真用过。

## 参考

- [ECMAScript 语言规范（TC39 官方）](https://tc39.es/ecma262/)
- [TC39 提案仓库](https://github.com/tc39/proposals)
- [MDN JavaScript 参考文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference)
- [ECMAScript 6 入门（阮一峰）](https://es6.ruanyifeng.com/)
- [Node.js Modules 官方文档](https://nodejs.org/api/esm.html)
- [前端进阶之旅](https://interview.poetries.top)
