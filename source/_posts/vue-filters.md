---
title: Vue 过滤器 filters 全局与局部注册用法（八）
description: 讲清 Vue 2 过滤器的注册方式、参数传递规则、串联写法和适用边界，附一套可复用的 filters 目录组织方案，以及 Vue 3 移除过滤器后用计算属性和方法替代的迁移思路。
date: 2018-08-27 10:20:32
tags:
  - Vue
  - 过滤器
  - filters
categories: Front-End
---

后端返回的时间戳是 `1535337632`，页面上要显示成 `2018-08-27 10:20:32`；金额字段是 `1234567`，要显示成 `1,234,567`；状态码是 `2`，要显示成「已发货」。这类「数据是一套，展示是另一套」的转换，几乎每个列表页都要来一遍。要是每个组件都写一个 `formatTime` 方法，同一段逻辑很快就散落到十几个文件里。Vue 2 给这类场景准备了过滤器，一个竖线就能把值管道式地丢进转换函数。这篇讲清楚过滤器怎么注册、参数怎么传、能用在哪不能用在哪，最后说说 Vue 3 为什么把它整个删掉了。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 过滤器要解决的到底是什么问题，它和方法、计算属性的分工
- 全局过滤器 `Vue.filter` 的注册方式和参数传递规则
- 一套能直接抄走的 filters 目录组织方案
- 局部过滤器 `filters` 选项，以及它和全局过滤器的优先级
- 过滤器串联，以及只能用在插值和 `v-bind` 两个位置的限制
- Vue 3 为什么移除了过滤器，老项目怎么迁

## 一、过滤器在解决什么问题

过滤器的定位很窄，它只做一件事，把一个值转成另一个值用来显示。

它不改数据，不发请求，不碰组件状态。你传进去一个时间戳，它吐出来一个格式化字符串，原来的 data 一点没动。这个特性决定了它天然适合放在模板层，因为模板本来就是「展示」的地方。

那为什么不直接写在模板里？比如这样：

```html
<h1>{{ new Date(item.time).getFullYear() + '-' + (new Date(item.time).getMonth() + 1) }}</h1>
```

能跑，但模板一下子就脏了。模板里的表达式设计初衷是做简单运算，塞进去一堆逻辑之后，谁都不想再动它。过滤器把这段逻辑挪出去，模板恢复成一行 `item.time | date`，可读性差别很大。

和方法比呢？`methods` 里写一个 `formatDate` 当然也行，写法是 `formatDate(item.time)`。区别在于过滤器是全局可复用的，注册一次全项目都能用，而 `methods` 绑在组件实例上，换个组件就得重新引一遍。

和计算属性比，计算属性有缓存，过滤器没有。过滤器每次重新渲染都会执行一遍。所以过滤器只适合放轻量的字符串转换，遇到要遍历大数组、做大量计算的场景，请用计算属性。这块在 [Vue 计算属性与数据监听](https://feinterview.poetries.top/blog/vue-computed-watch) 里有更细的对比。

## 二、全局过滤器

### 2.1 注册语法

`Vue.filter` 接两个参数，名字和函数：

```javascript
// 第一个参数表示：过滤器的名称
// 第二个参数表示：函数，使用过滤器的时候，这个函数中的代码会被执行
Vue.filter('filterName', function (value) {
  // value 表示要过滤的内容
})
```

注册必须在创建 Vue 实例之前，也就是在 `new Vue()` 上面。放到后面注册，先渲染的那些组件是找不到这个过滤器的，控制台会报 `Failed to resolve filter`。

函数的第一个参数是固定的，永远是竖线左边那个值。这一点是过滤器最容易搞错的地方，后面单独讲。

### 2.2 一个完整的例子

下面这个日期格式化过滤器，是老项目里出镜率最高的一个：

```javascript
Vue.filter('date', function (input, format = 'yyyy-MM-dd hh:mm:ss') {
      var o = {
        "M+": input.getMonth() + 1, //月份 
        "d+": input.getDate(), //日 
        "h+": input.getHours(), //小时 
        "m+": input.getMinutes(), //分 
        "s+": input.getSeconds(), //秒 
        "q+": Math.floor((input.getMonth() + 3) / 3), //季度 
        "S": input.getMilliseconds() //毫秒 
      };

      if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (input.getFullYear() + "").substr(4 - RegExp.$1.length));
      // 不够2位的前面补0
      for (var k in o)
        if (new RegExp("(" + k + ")").test(format)) 
        format = format.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
      return format;
    })
```

原文这段的函数参数列表结尾误用了全角右括号，直接复制会报语法错误，这里换成了半角的 `)`。

代码本身的思路是先建一张占位符到实际值的映射表，年份单独处理是因为它可能要截取后两位（`yy` 和 `yyyy` 都要支持），其余字段统一走「前面补两个零再从后往前截」的补位技巧。

有个隐藏前提要注意，这个函数假设 `input` 已经是 `Date` 对象了，直接调 `getMonth()`。要是后端给的是秒级时间戳，你得先 `new Date(ts * 1000)`。生产环境里更稳妥的做法是在函数开头加一层判断，字符串和数字都先转成 `Date`，转不出来就原样返回。

使用的时候这样写：

```html
<h1>{{item.time | date('yyyy-MM-dd hh:mm:ss')}}</h1>
```

### 2.3 参数是怎么传的

这里是过滤器最反直觉的一处。看上面这行调用，`date` 接了一个参数，但函数定义里是两个形参。

规则是这样的：竖线左边的值自动作为第一个参数，括号里写的参数从第二个开始往后排。

```javascript
// 模板里写：value | myFilter('a', 'b')
// 实际调用：myFilter(value, 'a', 'b')
```

所以你定义过滤器时，第一个形参名字叫什么都行，但位置是被占死的，只能是待过滤的值。很多人第一次写会把格式串放在第一个参数，结果拿到的是时间对象，然后一脸疑惑。

括号里的参数是 JavaScript 表达式，可以传变量、可以传对象。`item.time | date(userFormat)` 里的 `userFormat` 会从当前组件作用域取值。

### 2.4 过滤器可以串联

竖线能一路接下去，前一个的返回值就是后一个的输入：

```html
<p>{{ money | toFixed2 | thousands | prefixYuan }}</p>
```

执行顺序是从左到右，等价于 `prefixYuan(thousands(toFixed2(money)))`。串联的好处是每个过滤器只做一件小事，组合起来解决复杂问题；坏处是链子长了之后，中间某一环出错很难定位，因为报错栈里看不到是哪个过滤器抛的。我自己的经验是串到三个就该考虑合并成一个了。

## 三、把过滤器集中管起来

一个项目里可能要用到很多过滤器来处理数据。多个组件公用的，注册成全局过滤器；单个组件使用的，挂到实例的 `filters` 里。项目做得多了以后，可以整理一套常用的 filters 反复复用，比如时间格式化、数据格式转换、单位换算、部分字段的 `md5` 加密等等。

下面这几张图是一个实际项目里的组织方式，从建目录到页面使用走一遍。

先在 `src` 下建一个 `filters` 目录，专门放各种过滤器，和 `utils`、`api` 这些平级：

![在 src 目录下新建 filters 文件夹集中存放过滤器](https://s.poetries.top/gitee/2019/10/622.png)

重点是别把过滤器散在各个组件里。集中一个目录之后，新人接手时搜「这个格式是哪来的」只要看这一处。

`filter.js` 里逐个导出过滤器函数。注意这里导出的是纯函数，不带 Vue 的任何依赖：

![filter.js 中以具名导出的方式定义各个过滤器函数](https://s.poetries.top/gitee/2019/10/623.png)

这一步的关键是「纯函数」三个字。函数不依赖 Vue，就意味着它能被单元测试直接调用，也能在非模板场景下当普通工具函数用。这是后面迁移到 Vue 3 时最省事的一点，因为函数本身不用改，只是调用方式换了。

`main.js` 里遍历这些导出，批量注册成全局过滤器：

![main.js 中遍历 filters 对象批量调用 Vue.filter 完成全局注册](https://s.poetries.top/gitee/2019/10/624.png)

批量注册用的是 `Object.keys(filters).forEach(key => Vue.filter(key, filters[key]))` 这个套路。易错点在于顺序，这段代码必须在 `new Vue()` 之前执行，写反了首屏渲染的组件就用不上。

注册完之后，页面上直接用「竖线 + 过滤器名」就能用：

![页面模板中用竖线加过滤器名的方式调用已注册的全局过滤器](https://s.poetries.top/gitee/2019/10/625.png)

这里要留意的是过滤器名不要和组件里的方法重名。过滤器和 `methods` 在两套命名空间里，重名不会报错，但读代码的人会分不清那个竖线后面到底调的是谁。

如果项目小，懒得单开目录，也可以直接在 `main.js` 里自定义全局过滤器：

![在 main.js 中直接调用 Vue.filter 定义全局过滤器](https://s.poetries.top/gitee/2019/10/626.png)

这种写法适合过滤器只有两三个的情况。超过五个就别这么干了，`main.js` 会迅速膨胀成一个什么都往里塞的杂物间，这个我见过太多次。

## 四、局部过滤器

在某一个 Vue 实例内部创建的过滤器，只在当前实例中起作用：

```javascript
new Vue({
  data:{
      
  },
   // 通过 filters 属性创建局部过滤器
   // 注意：此处为 filters
  filters: {
    filterName: function(value, format) {}
  }
})
```

注意选项名是复数的 `filters`，全局注册的方法是单数的 `Vue.filter`。这两个名字差一个字母，写错了不会有明显报错，只是过滤器死活不生效，找起来挺费劲的。

局部和全局同名时，局部优先。Vue 查找过滤器的顺序是先看组件自己的 `filters` 选项，找不到再往全局找。利用这一点可以做局部覆盖，比如某个页面的时间格式要特殊处理，不用改全局的，在这个组件里同名定义一份就行。

什么时候用局部？判断标准很简单，只有这一个组件用得上的，就放局部。比如某个后台管理页面里「审核状态码转文字」这种业务性极强的映射，放全局就是污染。

## 五、过滤器只能用在两个地方

这是过滤器一个很硬的限制，很多人可能没注意到。

Vue 2.1 之前，过滤器只能用在插值表达式里。2.1 之后扩展到了 `v-bind`：

```html
<!-- 插值 -->
<span>{{ message | capitalize }}</span>

<!-- v-bind -->
<div v-bind:id="rawId | formatId"></div>
```

除此之外的地方都不行。`v-if="status | isActive"` 不行，`v-for` 的表达式里不行，`@click="handler | wrap"` 更不行。碰到这些场景只能老老实实用 `methods` 或者计算属性。

原因在于过滤器是 Vue 模板编译器在解析插值和绑定表达式时做的特殊处理，它把竖线语法翻译成了 `_f("filterName")(value)` 这样的函数调用。指令的表达式走的是另一条编译路径，那条路上根本没有处理竖线的逻辑，竖线在那里会被当成 JavaScript 的按位或运算符。

这也解释了为什么过滤器语法看着像 Unix 管道，实际上完全是 Vue 自己发明的一套东西，和 JavaScript 语言本身没有任何关系。

## 六、Vue 3 为什么把过滤器删了

Vue 3 移除了过滤器，官方迁移指南里写得很直接，建议用方法调用或者计算属性替代。

我一开始也觉得可惜，用了这么多年的语法说没就没。后来看了 RFC 里的讨论，理由确实站得住：

第一条是竖线和 JavaScript 的按位或运算符冲突。在模板里 `a | b` 到底是过滤器还是位运算，只能靠 Vue 自己的解析规则去猜，这让模板表达式不再是合法的 JavaScript 子集。对工具链来说这是个大麻烦，IDE 没法用标准 JS 解析器分析模板，类型推导也做不了。

第二条是过滤器引入了一套额外的语法概念。同样是「调一个函数」，模板里却有两种写法，新人要多学一套东西，收益却只是少打一对括号。

第三条是过滤器有自己的解析和作用域查找逻辑，编译器要为它单独维护一条路径，运行时也要多一个 `resolveFilter` 的查找过程。删掉之后编译产物更小，行为也更好预测。

迁移办法有两种。全局过滤器改成挂在 `app.config.globalProperties` 上：

```javascript
// Vue 2
Vue.filter('date', dateFilter)

// Vue 3
app.config.globalProperties.$filters = {
  date: dateFilter
}
```

模板里的调用从竖线换成函数调用：

```html
<!-- Vue 2 -->
<span>{{ item.time | date('yyyy-MM-dd') }}</span>

<!-- Vue 3 -->
<span>{{ $filters.date(item.time, 'yyyy-MM-dd') }}</span>
```

组合式 API 下更省事，直接 import 那个函数就能在模板里用：

```javascript
import { date } from '@/filters/filter'
// script setup 里 import 进来的变量，模板里可以直接访问
```

这也是前面强调「过滤器函数要写成纯函数」的原因。函数体一个字不用改，改的只是注册和调用方式。

要是转换逻辑依赖组件内的响应式数据，并且在同一次渲染里被多次用到，那更好的选择是计算属性，因为它有缓存。这套取舍我在 [Vue 计算属性与数据监听](https://feinterview.poetries.top/blog/vue-computed-watch) 里展开讲过。至于组件内部怎么组织这些方法和属性，可以看 [Vue 实例方法与属性](https://feinterview.poetries.top/blog/vue-$vm-method-props)。

## 总结

过滤器这个东西，用起来爽，代价是引入了一套非标准语法。回头看它的几条要点：

- 第一个参数被待过滤的值占死了，括号里的参数从第二位开始排，这是最容易写错的地方
- 全局用 `Vue.filter`（单数），局部用 `filters` 选项（复数），同名时局部优先
- 只能用在插值和 `v-bind` 两处，`v-if`、`v-for`、事件绑定里都不行
- 没有缓存，每次重渲染都跑一遍，重计算请用计算属性
- 注册必须在 `new Vue()` 之前

Vue 3 移除它不是因为它不好用，是因为它让模板表达式不再是合法 JavaScript，工具链的代价太高。如果你现在维护的还是 Vue 2 项目，过滤器该用就用，但把函数写成不依赖 Vue 的纯函数，将来迁移时能少改很多东西。

## 参考

- [Vue 2 官方文档 - 过滤器](https://v2.cn.vuejs.org/v2/guide/filters.html)
- [Vue 3 迁移指南 - 过滤器](https://v3-migration.vuejs.org/breaking-changes/filters.html)
- [Vue RFCs - Drop support for filters](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0015-remove-filters.md)
- [Vue 3 官方文档 - 计算属性](https://cn.vuejs.org/guide/essentials/computed.html)
- [前端进阶之旅](https://interview.poetries.top)
