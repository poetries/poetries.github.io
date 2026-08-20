---
title: moment时间处理常用方法与现代替代方案
description: 梳理 moment 的格式化、加减、起止时间、时间差等常用写法，逐条修正老笔记里 HH:MM:SS、day(0) 这类经典坑，并说明 moment 进入维护模式后 day.js、date-fns、Intl.DateTimeFormat 各自适合什么场景。
date: 2018-12-06 11:08:24
tags:
  - JavaScript
  - moment
  - 日期处理
categories: Front-End
---

后台管理系统的筛选栏最容易碰到这类需求。产品要「今天、昨天、近 7 天、近 30 天、本月」五个快捷按钮，每个按钮点下去要给后端一对 `YYYY-MM-DD` 的起止日期。用原生 `Date` 手写，光是「上个月的今天」就得先判断上个月有多少天，代码写到第三个按钮就开始打结。moment 把这类事情压成了一行。

这篇是我当年用 moment 时攒的一份速查笔记，这次回头重新整理，顺手把里面几处写错的地方改了，也补上 2018 年之后发生的变化。moment 官方现在已经把项目置于维护模式，新项目该怎么选，最后一节会说。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- moment 对象是可变的，这个特性带来的坑
- `format` 占位符里 `MM` 和 `mm`、`HH` 和 `hh` 的区别
- 取年月日、取周几，以及 `day` 和 `weekday` 到底差在哪
- `add` / `subtract` 做时间加减
- `startOf` / `endOf` 拿一天、一月的起止时刻
- `fromNow` 和 `diff` 算相对时间与时间差
- 把这些拼成筛选栏的日期常量表
- moment 进入维护模式之后的替代方案与迁移思路

## 一、先记住一件事，moment 对象是可变的

这是 moment 最容易翻车的地方，也是我建议放在最前面讲的原因。

```js
const base = moment('2018-12-06');
const next = base.add(1, 'days');

console.log(base.format('YYYY-MM-DD')); // 2018-12-07
console.log(next.format('YYYY-MM-DD')); // 2018-12-07
```

`add` 不返回新对象，它直接改掉了 `base` 自己，然后把 `base` 返回给你。所以 `base` 和 `next` 是同一个对象。你要是把一个 moment 对象存进 state 或者当成常量复用，某个地方不小心 `add` 了一下，其他所有地方跟着一起偏。

这个坑我踩过，排查了半天才反应过来是同一个引用。

绕开的办法只有一个，每次都从 `clone()` 出发：

```js
const base = moment('2018-12-06');
const next = base.clone().add(1, 'days');

console.log(base.format('YYYY-MM-DD')); // 2018-12-06
console.log(next.format('YYYY-MM-DD')); // 2018-12-07
```

或者干脆每次都重新 `moment()` 一个新的。下面所有示例都写成 `moment().xxx()` 这种一次性的链式调用，就是因为一次性对象没有共享，也就没有这个问题。

## 二、format 的占位符，MM 和 mm 是两回事

最基础的用法是取当前时间，按中文格式输出。

```js
var now = moment().format("YYYY年MM月DD日");
```

任意时间戳格式化，注意 moment 接收的是毫秒级时间戳：

```js
var t1 = moment(1411641720000).format('YYYY-MM-DD HH:mm:ss');
```

如果你手上是后端给的秒级时间戳（10 位），得先乘 1000：

```js
// 格式化秒级时间戳为 2018-12-06 12:21:00
moment(unixSeconds * 1000).format('YYYY-MM-DD HH:mm:ss')
```

这里有个坑要注意，占位符是区分大小写的，而且区分得很较真：

| 占位符 | 含义 | 常见误用 |
|--------|------|----------|
| `YYYY` | 四位年 | `yyyy` 在 moment 里不是年 |
| `MM` | 两位月份 | 被当成分钟 |
| `DD` | 两位日期 | `dd` 是星期几的缩写 |
| `HH` | 24 小时制小时 | `hh` 是 12 小时制 |
| `mm` | 两位分钟 | 被写成 `MM` |
| `ss` | 两位秒 | 被写成 `SS`，`S` 是毫秒的小数位 |

我那份老笔记里就有这么一行：

```js
// 这行是错的
now = moment().format('YYYY-MM-DD:HH:MM:SS');
```

`HH:MM:SS` 里的 `MM` 输出的是月份，`SS` 输出的是毫秒小数位，所以拿到的时间部分完全不对。正确写法是：

```js
now = moment().format('YYYY-MM-DD HH:mm:ss');
```

这个错误特别隐蔽，因为月份和分钟在某些时刻碰巧看起来都像合法数字，测试的时候未必一眼看得出来。

除了自己拼占位符，moment 还提供了几个本地化的短名：

```js
now = moment().format('L');   // 10/22/2016，随 locale 变化
now = moment().format('LL');  // October 22, 2016，随 locale 变化
```

`L` 和 `LL` 输出什么完全取决于当前加载的 locale。默认是 `en`，所以是美式日期。要中文得先引入并切换到 `zh-cn`。这类跟 locale 绑定的格式，我一般只在给用户看的展示层用，传给后端的参数永远写死成 `YYYY-MM-DD`，免得换个环境就变样。

## 三、取年月日和周几

单独取某个部分，moment 提供了一组同名方法。

```js
var t14 = moment().year();
var t15 = moment().month(); // 此处月份从 0 开始，当前月要 +1
var t16 = moment().date();
```

`month()` 从 0 开始这件事跟原生 `Date.prototype.getMonth()` 是一致的，属于历史包袱。要拿到人看的月份记得加一，或者干脆用 `format('MM')`，那个是从 1 开始的。

`date()` 是「几号」，别和 `day()` 搞混，`day()` 是「星期几」。

顺着这个说到 `day` 和 `weekday` 的差别，这是我老笔记里另一处错误：

```js
// 老笔记写的是「获取前一天日期」，其实不是
var t11 = moment().day(0).format('YYYY-MM-DD');
```

`day(0)` 拿到的是本周的周日，不是前一天。moment 的 `day()` 固定以周日为 0、周六为 6，跟 locale 无关。要拿前一天，用后面讲的 `subtract` 才对。

```js
var t12 = moment().weekday(5).format('YYYY-MM-DD');
var t13 = moment().weekday(-3).format('YYYY-MM-DD');
```

`weekday()` 和 `day()` 的区别在于，它是相对「本地化的一周第一天」来数的。在默认的 `en` locale 下一周从周日开始，`weekday(5)` 是周五；切到 `zh-cn`，一周从周一开始，同样的 `weekday(5)` 就变成周六了。负数会往前一周数，`weekday(-3)` 落在上一周，具体是周几同样看 locale。

所以老笔记里「获取本周五」「获取上周五」这两条注释，只在某个特定 locale 下成立。

你要是在做跨语言的项目，我的建议是别用 `weekday`，用 `day()` 加显式的加减，行为是确定的，不会因为某个地方 `moment.locale('zh-cn')` 一句就全变了。

## 四、加减时间用 add 和 subtract

这两个方法是 moment 用得最多的部分，签名都是 `(数量, 单位)`。

```js
// 获取上个月今天的日期
var t18 = moment().subtract(1, 'months').format('YYYY-MM-DD');

// 获取上个月，只要年月
var t19 = moment().subtract(1, 'months').format('YYYY-MM');

// 获取前一天
var t20 = moment().subtract(1, 'days').format('YYYY-MM-DD');

// 获取两个小时之后
var t22 = moment().add(2, 'hours').format('YYYY-MM-DD HH:mm:ss');

// 获取五天前，例如今天 2018-7-23，拿到 2018-7-18
var t23 = moment().subtract(5, 'days').format('YYYY-MM-DD');
```

单位可以写单数、复数或者缩写，`'day'`、`'days'`、`'d'` 是同一个意思。`add` 传负数等价于 `subtract`，所以下面两行结果一样：

```js
let beforeDay = moment().add(-5, 'day').toDate();
beforeDay = moment().subtract(5, 'day').toDate();
```

按月加减这块有个行为值得知道。moment 做月份加减时会保护「日」不溢出，比如 3 月 31 号减一个月，2 月没有 31 号，结果是 2 月 28 号（闰年 29 号），而不是滚到 3 月 3 号去。这跟你手写 `setMonth` 的默认行为是不一样的，`setMonth` 会溢出。

回到实际场景，这个差别决定了「上个月今天」这种需求能不能一行搞定。

`toDate()` 会把 moment 对象转回原生 `Date`，需要把值交给不认识 moment 的第三方库时会用到：

```js
var now = moment().toDate();
```

## 五、startOf 和 endOf 拿区间端点

筛选栏要的是「这一天从 00:00:00 到 23:59:59」这种闭区间，手写会很啰嗦。

```js
// 这个月月初
let startMonth = moment().startOf('month').toDate();

// 今天开始的时间
let dayOfStart = moment().startOf('day').toDate();

// 今天结束的时间
let dayOfEnd = moment().endOf('day').toDate();
```

`startOf('day')` 把时分秒毫秒全部清零，`endOf('day')` 设成 `23:59:59.999`。单位除了 `day`、`month`，还有 `year`、`week`、`hour` 这些。

注意 `endOf` 给的是 `.999` 毫秒而不是下一天的 `00:00:00`。如果后端那边是按左闭右开区间查的，直接把 `endOf('day')` 传过去会漏掉那一毫秒里的数据。这种边界差一点点的问题，量小的时候根本发现不了。稳妥的做法是和后端约定清楚区间是闭是开，然后统一用 `startOf('day')` 加上「下一天的 `startOf('day')`」这种左闭右开的写法。

`startOf('week')` 同样受 locale 影响，一周从周日还是周一开始，取决于当前 locale。

## 六、fromNow 和 diff

`fromNow()` 给的是「三天前」「两个月后」这种相对描述，列表页展示时间时很常用：

```js
// 获取到现在的年限，如果不满一年显示出具体几个月
let years = moment('2020-12-31').fromNow();
```

输出的语言同样跟着 locale 走，默认英文的 `in 2 years`，切到 `zh-cn` 才是「2 年后」。

`diff` 算的是两个时间的差值，第二个参数是单位：

```js
const oneHourLater = moment().add(1, 'h');
const minute = moment().diff(oneHourLater, 'minute'); // -60
```

我老笔记里这段是写坏的，两处都得改。原来是这样：

```js
// 原始写法，两处问题
new Date(moment().add(1, 'h').format('YYYY-MM-DD hh:mm:ss')).getTime()

const minute = moment(currTime).diff(oneHourBefore), 'minute')
```

第一行的问题是 `hh` 是 12 小时制，下午三点会被格式化成 `03`，再交给 `new Date()` 解析就变成凌晨三点了，时间戳直接差 12 小时。第二行括号位置写错了，`'minute'` 掉到了 `diff()` 外面，这行根本跑不起来。

改对之后是这样：

```js
// 一小时后的时间戳，不用绕字符串
const oneHourLater = moment().add(1, 'h').valueOf();

// 当前时间和一小时后差多少分钟
const minute = moment().diff(oneHourLater, 'minute'); // -60
```

顺带说一句，凡是「moment 对象转时间戳」的需求，直接 `.valueOf()` 就行，别绕一圈 `format` 成字符串再 `new Date()` 解析。字符串往返多一次格式化和一次解析，中间任何一步占位符写错，结果就是错的，而且错得很难查。

## 七、把这些拼成筛选栏的常量表

前面这些单点方法凑到一起，就是开头那个筛选栏的实现。

```js
import moment from 'moment'

const DATE = {
  DATE_TODAY: moment().format('YYYY-MM-DD'),
  DATE_YESTERDAY: moment().subtract(1, 'days').format('YYYY-MM-DD'),
  DATE_1_WEEK_BEFORE: moment().subtract(1, 'weeks').format('YYYY-MM-DD'),
  DATE_2_WEEKS_BEFORE: moment().subtract(2, 'weeks').format('YYYY-MM-DD'),
  DATE_3_WEEKS_BEFORE: moment().subtract(3, 'weeks').format('YYYY-MM-DD'),
  DATE_1_MONTH_BEFORE: moment().subtract(1, 'months').format('YYYY-MM-DD'),
  DATE_2_MONTH_BEFORE: moment().subtract(2, 'months').format('YYYY-MM-DD'),
  DATE_3_MONTHS_BEFORE: moment().subtract(3, 'months').format('YYYY-MM-DD'),
  DATE_1_YEAR_BEFORE: moment().subtract(1, 'years').format('YYYY-MM-DD'),
}
```

还有往后推和取月份端点的：

```js
const DATE_RANGE = {
  DATE_3_MONTHS_AFTER: moment().add(3, 'months').format('YYYY-MM-DD'),
  DATE_1_YEAR_AFTER: moment().add(1, 'year').format('YYYY-MM-DD'),
  DATE_FIRST_DAY_OF_MONTH: moment().startOf('month').format('YYYY-MM-DD'),
  DATE_LAST_DAY_OF_MONTH: moment().endOf('month').format('YYYY-MM-DD'),
  DATE_7_DAYS_BEFORE: moment().subtract(7, 'days').format('YYYY-MM-DD'),
  DATE_30_DAYS_BEFORE: moment().subtract(30, 'days').format('YYYY-MM-DD'),
  DATE_90_DAYS_BEFORE: moment().subtract(90, 'days').format('YYYY-MM-DD'),
  DATE_100_DAYS_BEFORE: moment().subtract(100, 'days').format('YYYY-MM-DD'),
}
```

这种写法有个前提要说清楚。这些值是在模块加载的那一刻算好的，之后就固定住了。页面开着不刷新跨过零点，`DATE_TODAY` 还是昨天的日期。

所以这份常量表更适合写成函数，用的时候现算：

```js
const getDateRange = (n, unit = 'days') => ({
  start: moment().subtract(n, unit).format('YYYY-MM-DD'),
  end: moment().format('YYYY-MM-DD'),
});
```

这个改动很小，但能省掉一类「用户反馈日期不对，刷新一下又好了」的诡异 bug。

## 八、和 moment 无关，但常一起写的时间列表

选时间段的下拉框需要一串 `00:00`、`00:15`、`00:30` 这样的选项，这段纯用原生就能写：

```js
/**
 * 生成时间列表
 * @param  {number} hours 小时数
 * @param  {number} step  分段间隔（分钟）
 * @return {string[]}     时间段列表
 */
function getTimeList(hours, step) {
  var minutes = 60
  var timeArr = []

  for (var i = 0; i < hours; i++) {
    var str = i < 10 ? '0' + i : '' + i

    for (var j = 0; j < minutes; j++) {
      if (j % step == 0) {
        var s = j < 10 ? ':0' + j : ':' + j
        timeArr.push(str + s)
      }
    }
  }

  return timeArr
}

getTimeList(12, 15)
```

原始版本里有 `hours = hours` 和 `step = step` 两行自赋值，没有任何作用，是当年从别处抄过来时留下的残渣，这里删掉了。补零那两处也合并了一下。

内层循环从 0 数到 59 再用取模筛，其实可以直接用 `step` 当步长，少走 45 次空转：

```js
for (var j = 0; j < 60; j += step) {
  timeArr.push(str + ':' + String(j).padStart(2, '0'))
}
```

一天只有几十个选项，性能上没差别，但读起来意图更清楚。`padStart` 是 ES2017 的方法，补零这件事不用再自己写三目。

## 九、2018 之后，moment 变成了「不推荐用于新项目」

写这份笔记的时候 moment 还是日期处理的默认选择。后来官方发了一份项目状态说明，明确把 moment 定位成维护模式的遗留项目（legacy project in maintenance mode），继续修 bug 但不再加新特性，也不建议新项目引入。

官方给出的理由主要是两条，一条是 moment 对象可变，也就是第一节说的那个坑，这个设计已经改不动了；另一条是 moment 的体积和结构不利于 tree-shaking，用了它的一两个方法，整包还是会被打进去。

体积这块具体是这样。moment 默认会把所有 locale 文件一起打包，实际项目里绝大多数只需要 `zh-cn` 一个。webpack 环境下常见的做法是用 `IgnorePlugin` 把 `moment/locale` 目录排除掉，再手动引入需要的那个：

```js
// webpack 配置里排除掉全部 locale
new webpack.IgnorePlugin({
  resourceRegExp: /^\.\/locale$/,
  contextRegExp: /moment$/,
})
```

```js
// 业务代码里只引需要的那一个
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');
```

这个配置能砍掉相当可观的一块体积。具体数字跟版本有关，我就不给一个拍脑袋的数了，自己跑一次 `webpack-bundle-analyzer` 看最准。

## 十、现在该选什么

先说结论，老项目不用急着迁，新项目别再引 moment。

几个替代方案我的理解是这样：

**day.js** 的 API 几乎是照着 moment 抄的，`format`、`add`、`subtract`、`startOf` 这些名字和参数都对得上，从 moment 迁过去成本最低。它默认不可变，`add` 返回新对象，第一节那个坑天然不存在。功能通过插件按需加载，核心很小。如果你手上就是本文这种「格式化 + 加减 + 起止时间」的需求，day.js 基本是无脑替换。

**date-fns** 是纯函数式的，每个能力是一个独立导出的函数，`format(date, 'yyyy-MM-dd')` 这种调用形式，配合打包工具能做到真正的按需引入。它操作的是原生 `Date` 对象，不包一层。缺点是从 moment 迁过去要改写法，而且它的格式化占位符和 moment 不完全一样，`yyyy` 和 `YYYY` 在 date-fns 里含义不同，迁移的时候这块最容易出错。

**Luxon** 是 moment 团队自己做的后继项目，基于 `Intl` 处理时区和本地化，对时区要求复杂的场景比较合适。

**原生 `Intl.DateTimeFormat`** 值得单独提一句。只是要把时间按地区格式展示给用户，不需要任何库：

```js
new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());
```

它是浏览器内置的，零体积。做不了的是日期加减和复杂解析，那些还是得靠库。

**Temporal** 是 TC39 上专门解决日期时间问题的提案，设计上是不可变的，也内建了时区和历法支持，目标就是替掉 `Date` 这个历史遗留 API。它已经推进到比较靠后的阶段，部分浏览器开始实现了，具体到哪个浏览器哪个版本可用，以 MDN 的兼容性表为准，我这边没有在生产环境用过它。

说实话，如果只是本文这类需求，我现在的做法就是 day.js 起步，遇到 day.js 插件覆盖不到的再考虑 date-fns。工具库的选型逻辑和 [lodash常用API](https://feinterview.poetries.top/blog/lodash-api) 那篇里聊的其实一样，先看原生能不能干，干不了再看谁的边际成本最小。

## 总结

moment 这类库的价值在于把「上个月的今天」「本月最后一天」这种边界判断收进了一行调用里，这部分能力今天依然需要，只是提供者换了人。

这次重写改掉的几处错误值得单独记一下。`format('HH:MM:SS')` 里的 `MM` 是月份不是分钟，`hh` 是 12 小时制不能用来往 `new Date()` 里塞，`day(0)` 是本周周日不是昨天，`weekday()` 的结果跟当前 locale 绑定。这四条都是那种「跑起来不报错，但值是错的」的问题，比语法错误难查。

moment 对象可变这一点，是它被官方自己判为遗留方案的核心原因。日常写代码时凡是要复用一个 moment 对象，先 `clone()`。

新项目直接选 day.js 或者 date-fns，纯展示场景连库都不用引，`Intl.DateTimeFormat` 就够。老项目暂时不迁也没问题，moment 还在修 bug，只是记得把 locale 从打包里排掉。

## 参考

- [Moment.js 官方文档](https://momentjs.com/docs/)
- [Moment.js Project Status](https://momentjs.com/docs/#/-project-status/)
- [Day.js 官方文档](https://day.js.org/docs/zh-CN/installation/installation)
- [date-fns 官方文档](https://date-fns.org/docs/Getting-Started)
- [MDN Intl.DateTimeFormat](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [TC39 Temporal 提案](https://tc39.es/proposal-temporal/docs/)
- [Moment.js常见用法总结](https://www.jianshu.com/p/9c10543420de)
- [前端进阶之旅](https://interview.poetries.top)
