---
title: 业务中处理数据结构常用的JS方法
description: 从后台列表页的真实需求出发，讲清 map、filter、find、reduce、some、every 在业务里怎么选、怎么组合，附不可变更新的固定套路、reduce 写出 O(n²) 的坑，以及 flatMap、Object.groupBy 这些新写法。
date: 2018-08-12 19:11:43
tags:
  - JavaScript
  - API
  - 数组方法
categories: Front-End
---

接一个后台列表页，接口丢回来一坨数据，产品的需求是：先按状态过滤掉已作废的，再把 `user_name` 改成 `userName` 交给表格组件，右上角还要显示一个合计数字，点某一行的时候要根据 id 把那条记录捞出来。我刚工作那会儿的写法是一路 `for` 循环加临时变量，写到第三个需求的时候自己都读不下去了。

后来把这几件事拆给 `filter`、`map`、`reduce`、`find`，代码从二十多行缩到五行，更重要的是每一行在干什么一眼就能看出来。这篇不打算逐个抄 API 签名，重点放在：遇到一个具体需求该挑哪个方法、几个方法怎么串起来、以及哪些写法看着优雅其实藏着性能坑。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `filter`、`find`、`map`、`reduce`、`some`、`every` 各自负责的那一件事
- 拿到需求怎么在三十秒内选出该用哪个方法
- 业务里高频出现的不可变更新套路，新增、删除、改某一项、动态键
- `reduce` 里用展开运算符累加为什么会退化成 O(n²)
- 链式调用遍历多遍，到底要不要合并成一次 `reduce`
- 2018 之后新增的 `flatMap`、`Object.fromEntries`、`Object.groupBy` 能省掉哪些手写代码

数组方法的完整清单（包括哪些会改原数组、各自的返回值边界）我另开了一篇 [JavaScript数组方法总结](https://feinterview.poetries.top/blog/javaScript-arr-summary) 讲，这篇只聊业务里怎么用。

## 一、四个方法，各管一件事

先把职责划清楚，后面选型就不用犹豫了。

### 1.1 filter 负责筛

`filter` 可以筛除数组和类似结构中不满足条件的元素，并返回满足条件的元素组成的数组。

```javascript
const integers = [1, 2, 3, 4, 6, 7];
const evenIntegers = integers.filter(i => i % 2 === 0);
// evenIntegers 的值为 [2, 4, 6]
```

它的返回值一定是数组，最坏情况是空数组，不会是 `undefined`。这一点很关键，业务里拿到 `filter` 的结果可以直接 `.length` 或者直接丢给 `v-for`，不用先判空。

### 1.2 find 负责找一个

`find` 返回数组或类似结构中满足条件的第一个元素。

```javascript
const posts = [
  {id: 1, title: 'Title 1'},
  {id: 2, title: 'Title 2'}
];
// 找出 id 为 1 的 post
const title = posts.find(p => p.id === 1).title;
```

这里有个坑要注意，`find` 找不到的时候返回 `undefined`，上面这行 `.title` 就会直接抛 `Cannot read properties of undefined`。这是我在列表页点击详情那一步最常见的线上报错来源，尤其是列表已经刷新过、用户点的是一条已经被删掉的记录。稳妥的写法是加可选链：

```javascript
const title = posts.find(p => p.id === 1)?.title ?? '';
```

`?.` 和 `??` 是 ES2020 才有的，2018 年那会儿只能写 `const post = posts.find(...); const title = post ? post.title : ''`。现在直接用新语法就行。

### 1.3 map 负责整批换一遍

`map` 的作用在于处理流式数据，比如数组。可以把它想象成所有元素都要经过的一个转换器。

```javascript
const integers = [1, 2, 3, 4, 6, 7];
const twoXIntegers = integers.map(i => i * 2);
// twoXIntegers 现在是 [2, 4, 6, 8, 12, 14]，而 integers 不发生变化
```

`map` 的返回数组长度和原数组严格一致，这是它和 `filter` 最根本的差别。想边转换边过滤，正规做法是 `filter` 之后再 `map`，别指望在 `map` 里 `return` 一个 `undefined` 就能把那一项去掉，那样只会得到一个塞满 `undefined` 的等长数组。

### 1.4 reduce 负责合成一个

当你想要把多个数据揉进一个结果里时，就该用 reducer 了。

```javascript
const posts = [
  {id: 1, upVotes: 2},
  {id: 2, upVotes: 89},
  {id: 3, upVotes: 1}
];
const totalUpvotes = posts.reduce((totalUpvotes, currentPost) =>
  totalUpvotes + currentPost.upVotes, // reducer 函数
  0 // 初始化投票数为 0
);
console.log(totalUpvotes) // 输出投票总数：92
```

传给 `reduce` 的回调函数除了累加值和当前值，还可以再接两个参数。第三个参数是每个元素在原数据结构中的位置，比如数组下标。第四个参数是调用 `reduce` 方法的数据集合，比如例子中的 `posts`。

第二个参数那个初始值别省。数组为空且没给初始值的时候，`reduce` 会直接抛 `TypeError: Reduce of empty array with no initial value`。接口返回空列表在业务里太常见了，这个错我踩过不止一次。

### 1.5 some 和 every 负责回答是非题

`some` 找到数组中符合条件的一项就不会再往下找，跟 `find` 一样只关心第一个命中的。

```javascript
[1, 2, 3, 4, 5].some(v => v > 4) // true，有某一项满足条件即为真
```

`every` 则是数组中每个元素都为真才会返回真。

```javascript
[1, 2, 3, 4, 5].every(v => v > 1) // false，每一项都大于 1 才会返回 true
```

这两个都是短路的，`some` 一旦拿到 `true` 就停，`every` 一旦拿到 `false` 就停。所以「判断列表里有没有勾选项」这种需求，写 `list.some(i => i.checked)` 比 `list.filter(i => i.checked).length > 0` 更省，后者会把整个数组走完还额外造一个新数组。

有个反直觉的地方：空数组调用 `every` 返回 `true`，调用 `some` 返回 `false`。逻辑上讲得通，空集合里「所有元素都满足条件」这句话是空真，但表单校验里如果用户一项都没填，`every` 直接放行，这个我踩过。

## 二、拿到需求先问三个问题

选型其实不复杂，问三句就够了。

第一，我要的结果是什么形状？一个布尔值、一个元素、一个新数组，还是一个别的东西。

第二，结果的长度和原数组一样吗？

第三，我需要提前退出吗？

对着下面这张表落座就行：

| 我想要的结果 | 用它 | 找不到 / 空数组时 |
|--------------|------|-------------------|
| 满足条件的全部元素 | `filter` | 返回 `[]` |
| 满足条件的第一个元素 | `find` | 返回 `undefined` |
| 满足条件的第一个下标 | `findIndex` | 返回 `-1` |
| 长度不变、内容换一遍 | `map` | 返回等长数组 |
| 有没有任意一个满足 | `some` | 空数组返回 `false` |
| 是不是全部都满足 | `every` | 空数组返回 `true` |
| 一个汇总值、一个对象、一个 Map | `reduce` | 空数组且无初始值会抛错 |
| 只想执行副作用，不要返回值 | `forEach` | 无法中途 `break` |

最后一行值得多说一句。`forEach` 里 `return` 只能结束当前这次回调，跳不出整个循环，`break` 更是直接语法错误。真需要提前跳出的场景，要么用 `some` 当伪 `break`，要么老老实实写 `for...of`。为了跳出循环去 `throw` 一个异常再 `catch`，这种写法我见过，但不建议。

## 三、业务里高频的不可变更新套路

React 的 `setState`、Redux 的 reducer、Vue 3 的 `ref` 替换，都要求你造一个新对象而不是原地改。下面这几段是我几乎每个项目都会写一遍的模板。

### 3.1 向对象数组添加新元素

```javascript
const books = [];
const newBook = {title: 'Alice in wonderland', id: 1};
const updatedBooks = [...books, newBook];
// updatedBooks 的值为 [{title: 'Alice in wonderland', id: 1}]
```

`[...books, newBook]` 而不是 `books.push(newBook)`，差别在于前者产生新引用，React 的浅比较能看出变化，后者改的还是同一个数组，组件不会重渲染。

### 3.2 为一个数组创建视图

如果需要实现用户从购物车中删除物品，但是又不想破坏原来的购物车列表，可以用 `filter`。

```javascript
const myId = 6;
const userIds = [1, 5, 7, 3, 6];
const allButMe = userIds.filter(id => id !== myId);
// allButMe is [1, 5, 7, 3]
```

这里其实是「删除」的不可变实现。用 `splice` 也能删，但 `splice` 改的是原数组，而且要先 `indexOf` 找下标，两步操作中间数组一变就容易出错。

### 3.3 向数组中新增元素

```javascript
const books = ['Positioning by Trout', 'War by Green'];
const newBooks = [...books, 'HWFIF by Carnegie'];
// newBooks 现在是 ['Positioning by Trout', 'War by Green', 'HWFIF by Carnegie']
```

### 3.4 为对象新增一组键值对

```javascript
const user = {name: 'Shivek Khurana'};
const updatedUser = {...user, age: 23};
// updatedUser 的值为：{name: 'Shivek Khurana', age: 23}
```

对象展开运算符是 ES2018 才进标准的，数组展开是 ES2015。2018 年写这段的时候还得靠 babel 转译，现在所有现代浏览器和 Node 18 以上都直接支持。

### 3.5 使用变量作为键名为对象添加键值对

```javascript
const dynamicKey = 'wearsSpectacles';
const user = {name: 'Shivek Khurana'};
const updatedUser = {...user, [dynamicKey]: true};
// updatedUser is {name: 'Shivek Khurana', wearsSpectacles: true}
```

方括号里放变量叫计算属性名。表单那种字段名由配置决定的场景全靠它，写 `{ [field.key]: value }` 就能动态拼出来。

### 3.6 修改数组中满足条件的元素对象

```javascript
const posts = [
  {id: 1, title: 'Title 1'},
  {id: 2, title: 'Title 2'}
];
const updatedPosts = posts.map(p => p.id !== 1 ?
  p : {...p, title: 'Updated Title 1'}
);
/*
updatedPosts is now
[
  {id: 1, title: 'Updated Title 1'},
  {id: 2, title: 'Title 2'}
];
*/
```

这段是我用得最多的一个模板，改列表里某一项。注意不匹配的那些项直接把 `p` 原样返回了，引用没变。这个设计是真的舒服，React 里配合 `memo` 用，没被改的行一次都不会重渲染。要是图省事写成 `posts.map(p => ({...p}))`，每一项都成了新对象，整张表全部重渲染。

### 3.7 找出数组中满足条件的元素

```javascript
const posts = [
  {id: 1, title: 'Title 1'},
  {id: 2, title: 'Title 2'}
];
const postInQuestion = posts.find(p => p.id === 2);
// postInQuestion now holds {id: 2, title: 'Title 2'}
```

### 3.8 获取数组中某一对象的下标

```javascript
const posts = [
  {id: 13, title: 'Title 221'},
  {id: 5, title: 'Title 102'},
  {id: 131, title: 'Title 18'},
  {id: 55, title: 'Title 234'}
];
// 找到 id 为 131 的元素下标
const requiredIndex = posts.findIndex(obj => obj.id === 131);
```

`findIndex` 和 `indexOf` 的区别在于前者接受一个判定函数，后者只能按 `===` 比对整个值。数组里装的是对象的时候，`indexOf` 基本没用，因为你手里那个对象字面量和数组里的不是同一个引用。

### 3.9 删除目标对象的一组属性

原文这里给了两个方法，第一个方法有处笔误，先把正确版本贴出来：

```javascript
// 方法一：filter 掉不要的 key，再 reduce 合回一个对象
const user = {name: 'Shivek Khurana', age: 23, password: 'SantaCl@use'};
const userWithoutPassword = Object.keys(user)
  .filter(key => key !== 'password')
  .map(key => ({ [key]: user[key] }))
  .reduce((accumulator, current) =>
    ({...accumulator, ...current}),
    {}
  );
// userWithoutPassword becomes {name: 'Shivek Khurana', age: 23}
```

原文这里写的是 `.map(key => {[key]: user[key]})`，少了一对包裹的圆括号。箭头函数后面直接跟 `{` 会被解析成函数体而不是对象字面量，里面的 `[key]:` 就成了一个带标签的语句，跑起来要么报错要么返回一堆 `undefined`。要返回对象字面量，必须写成 `({ ... })`。

方法二用解构，短得多：

```javascript
// 方法二：解构出想留的字段
const account = {name: 'Shivek Khurana', age: 23, password: 'SantaCl@use'};
const userWithoutPassword = (({name, age}) => ({name, age}))(account);
// userWithoutPassword becomes {name: 'Shivek Khurana', age: 23}
```

原文两段示例都用了 `const user`，写在同一个作用域里会直接报重复声明，所以第二段这里换了个变量名。

要是字段很多、只想剔掉一两个，rest 解构更直接：

```javascript
const { password, ...userWithoutPassword } = account;
```

一行搞定，代价是留下一个用不到的 `password` 变量，ESLint 的 `no-unused-vars` 会告警，配置里加个 `ignoreRestSiblings: true` 就好。

### 3.10 将对象转化成请求串

```javascript
const params = {color: 'red', minPrice: 8000, maxPrice: 10000};
const query = '?' + Object.keys(params)
  .map(k =>
    encodeURIComponent(k) + '=' + encodeURIComponent(params[k])
  )
  .join('&');
// encodeURIComponent 将对特殊字符进行编码
// query is now "?color=red&minPrice=8000&maxPrice=10000"
```

原文的注释漏了开头那个问号，实际结果是带 `?` 的。

`encodeURIComponent` 这一步千万别省。搜索框里用户输个 `&` 或者 `#`，不编码的话整个 query 就断在那儿了，后端拿到的参数是残的。

不过现在有更省事的写法，`URLSearchParams` 是浏览器和 Node 都内置的：

```javascript
const query = '?' + new URLSearchParams(params).toString();
```

它会自动做编码，还能处理数组和重复 key。有一个差异要知道，`URLSearchParams` 把空格编码成 `+`，`encodeURIComponent` 编码成 `%20`。绝大多数后端框架两种都认，但如果你的后端是自己手写的解析，这里可能会不一致。

## 四、reduce 里用展开运算符，小心 O(n²)

上面 3.9 的方法一，我当年觉得写得很漂亮，函数式味道很足。后来在一个几千条数据的导出功能里用了类似写法，页面直接卡住了。

问题出在这一行：

```javascript
.reduce((accumulator, current) => ({...accumulator, ...current}), {})
```

每一轮迭代都在把累加器整个展开一遍造新对象。数组长度是 n，第 k 轮要复制 k 个属性，加起来就是 n(n+1)/2 次属性复制。n 是 10 的时候无所谓，n 到了 5000 就是两千多万次操作。

写成直接改累加器就是线性的：

```javascript
.reduce((acc, current) => {
  Object.assign(acc, current);
  return acc;
}, {})
```

累加器本身是 `reduce` 内部创建的临时对象，从头到尾没有暴露出去，原地改它不违反不可变原则。同样的道理也适用于数组累加，`(acc, x) => [...acc, x]` 是 O(n²)，`(acc, x) => { acc.push(x); return acc; }` 是 O(n)。

先说结论，不可变的边界在函数的输入和输出，不在函数内部的临时变量。这个区分清楚了，很多性能问题自己就没了。

## 五、链式调用遍历几遍，要不要合并

`list.filter(...).map(...).reduce(...)` 这种写法会把数组走三遍，还会造两个中间数组。很多人第一反应是合并成一次 `reduce`。

我一开始也是这么想的，后来基本不这么干了。

原因有两个。一是现代 JS 引擎对这些方法的优化很好，几千条数据的量级下，三次遍历和一次遍历的差距在几毫秒以内，用户完全感知不到。二是合并之后的 `reduce` 可读性会掉一大截，回调里同时混着过滤条件、转换逻辑和累加逻辑，三个月后回来改需求就是灾难。

真正需要合并的情况我只遇到过两类：数据量到十万级别以上（这时候更应该考虑分页或者虚拟列表），或者每一步的回调里有昂贵计算（比如正则、日期格式化），这时候中间数组的内存开销和重复计算才真的值钱。

回到这块，我的默认选择是链式写法，遇到实测卡顿再合并，别提前优化。

## 六、2018 之后，这些活不用自己写了

原文写于 2018 年，那时候标准里还没有下面这些方法。有几个能直接替掉上面的手写代码。

`flatMap`（ES2019）等价于 `map` 之后 `flat(1)`，但只遍历一次。想在转换的同时顺便过滤，它比 `filter().map()` 更顺手，因为回调里返回空数组就等于把这一项丢掉：

```javascript
const activeNames = users.flatMap(u => u.active ? [u.name] : []);
```

`Object.fromEntries`（ES2019）是 `Object.entries` 的逆运算，3.9 那段 `map` 加 `reduce` 拼对象的代码可以整个换掉：

```javascript
const userWithoutPassword = Object.fromEntries(
  Object.entries(user).filter(([key]) => key !== 'password')
);
```

一行，而且没有 O(n²) 的问题。

`Object.groupBy` 和 `Map.groupBy`（ES2024）把「按某个字段分组」这个需求标准化了。以前这是 `reduce` 最经典的用法，现在直接：

```javascript
const byStatus = Object.groupBy(orders, o => o.status);
```

这个方法比较新，用之前查一下你的目标浏览器和 Node 版本，具体支持范围以 MDN 为准。项目里要兼容老环境的话，还是老老实实用 `reduce` 或者 lodash 的 `_.groupBy`。

`findLast` 和 `findLastIndex`（ES2023）从后往前找，以前得写 `[...arr].reverse().find(...)`，又拷贝又反转。

`at`（ES2022）支持负索引，`arr.at(-1)` 取最后一项，比 `arr[arr.length - 1]` 干净。

`toSorted`、`toReversed`、`toSpliced`、`with`（ES2023）是 `sort`、`reverse`、`splice` 和下标赋值的不可变版本，返回新数组不动原数组。3.6 那段改某一项的代码，用 `with` 一行就够：

```javascript
const updatedPosts = posts.with(0, {...posts[0], title: 'Updated Title 1'});
```

前提是你知道下标。要按条件匹配还是得用 `map`。

## 总结

这几个方法真正要记的不是签名，是各自的返回值形状。`filter` 给数组，`find` 给元素或 `undefined`，`map` 给等长数组，`reduce` 给任意东西。想清楚要什么形状的结果，选哪个方法就是自动的。

`find` 的返回值必须防空，直接 `.title` 是列表页最高频的线上报错来源，用 `?.` 挡一下成本几乎为零。

不可变更新的套路就那么几个，新增用展开、删除用 `filter` 或 rest 解构、改某一项用 `map` 加三元、动态键用计算属性名。这几个模板背下来，Redux reducer 和 React 的 `setState` 基本不用再想。

`reduce` 里别对累加器用展开运算符，那是 O(n²)。累加器是内部临时变量，原地改它不脏。

链式调用遍历多遍这件事，绝大多数业务量级下不用管。可读性比那几毫秒值钱得多。

数组方法的完整清单和「改不改原数组」的分类，可以接着看 [JavaScript数组方法总结](https://feinterview.poetries.top/blog/javaScript-arr-summary)；字符串和对象那一侧的常用方法在 [JavaScript字符串、对象、数组常用方法速查](https://feinterview.poetries.top/blog/js-string-arr-object-api)。

## 参考

- [MDN Array.prototype.reduce](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
- [MDN Array.prototype.flatMap](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap)
- [MDN Object.fromEntries](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries)
- [MDN Object.groupBy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy)
- [MDN URLSearchParams](https://developer.mozilla.org/zh-CN/docs/Web/API/URLSearchParams)
- [前端进阶之旅](https://interview.poetries.top)
