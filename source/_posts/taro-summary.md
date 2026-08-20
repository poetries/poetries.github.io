---
title: Taro跨平台开发实践 多端编译原理与踩坑总结
date: 2019-06-08 15:30:21
description: 从编译原理讲清 Taro 怎么把 React-like 代码转成小程序，再复盘多端开发里的样式差异、端能力差异、React Native 限制和条件编译技巧。
tags:
  - Taro
  - 小程序
  - 跨平台
categories: Front-End
---

老板给的需求是「小程序、H5、App 都要有，人只有这几个」。这种时候多端框架就成了必选项。我们那阵子用 Taro 做了一个三端并行的项目，写一套 React-like 代码同时出微信小程序、H5 和 React Native 包。真跑起来才发现，「一套代码多端运行」这句话里，省掉的是重复的业务逻辑，省不掉的是对每个端的了解。样式在哪一端会失效、哪个 API 只有小程序有、RN 为什么点不动 View，这些都得自己踩。这篇把 Taro 的编译原理先讲清楚，再把当时记下来的坑和技巧归拢成几类，方便你上手前先有个心理预期。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Vue-like、React-like 的代码凭什么能在小程序里跑起来
- 编译时处理和运行时适配各自负责什么，AST 在中间起什么作用
- Taro 的多端能力是怎么拼出来的，runtime、组件、redux、router 分别对应什么
- React-like 不等于 React，具体差在哪些地方
- 样式、端能力、UI 组件库这三类差异怎么填坑
- 条件编译、`process.env.TARO_ENV`、多端同名文件这三个技巧怎么用
- React Native 端的启动流程和样式限制
- 2019 年的 Taro 1.x 和现在的版本差在哪，哪些结论已经过期

## 一、小程序开发框架解决的是什么问题

小程序有自己的一套 DSL，`wxml` 加 `wxss` 加 `js`，跟你熟悉的 React 或者 Vue 都不一样。业务方要的是同一套页面在多个端上跑，开发者想用的是自己顺手的语法，中间这道鸿沟就是多端框架存在的理由。

![小程序多端开发框架的整体格局](https://s.poetries.top/gitee/20190930/1.png)

那么问题来了，Vue-like、React-like 的代码，凭什么能在小程序里运行？

![Vue-like 与 React-like 代码在小程序中运行的原理示意](https://s.poetries.top/gitee/20190930/2.png)

### 1.1 基本原理

答案拆开只有两句话：

- 编译时处理，把你写的语法转译成小程序语法
- 运行时适配，管理生命周期、数据，处理事件等

这两件事缺一不可。光有编译，转出来的模板没有数据驱动和生命周期，就是一堆死页面；光有运行时，你写的 JSX 小程序根本不认。Taro 走的是编译加运行时的组合路线，重活压在编译期，运行期只留必要的适配层。

编译这一步的流程，就是编译原理课上那条链路：

> 源代码->词法/语法/语义分析->抽象语法树->转换->目标代码

![编译流程从源代码到目标代码的完整链路](https://s.poetries.top/gitee/20190930/3.png)

中间那个「抽象语法树」是整套方案的支点。源码被解析成一棵结构化的树之后，改代码这件事就从「字符串替换」变成了「操作树节点」。把 JSX 里的 `<View>` 节点换成 `<view>`，把 `onClick` 属性换成 `bindtap`，都是在树上做增删改，改完再打印回目标语法。

![抽象语法树 AST 的结构示意](https://s.poetries.top/gitee/20190930/4.png)

这也解释了后面会讲到的一堆限制。既然是静态分析代码再改写，那你写得越动态，编译器就越猜不到你想干什么。小程序端不支持在 `render()` 之外定义 JSX、JSX 里必须用单引号这些规矩，根子都在这儿。

### 1.2 各家框架的多端支持情况

那几年多端框架扎堆出现，各自支持的端不一样，选型的时候这张对比得先看：

![各小程序框架的多端支持情况对比](https://s.poetries.top/gitee/20190930/5.png)

选型这事我的经验是，别只看支持的端多不多，要看你真正要发的那两三个端做得深不深。支持十个端但每个端都半残，不如支持三个端每个都能上线。

## 二、Taro 的原理

Taro 是一套多端统一开发框架，支持用 React 的开发方式编写一次代码，生成能运行在微信小程序、H5、React Native 等平台的应用。

它的整体架构分成编译和运行两条线，下面这几张图把这两条线拆开了：

![Taro 整体架构，编译时与运行时两条主线](https://s.poetries.top/gitee/20190930/6.png)
![Taro 编译流程的详细拆解](https://s.poetries.top/gitee/20190930/7.png)
![Taro 把 JSX 转换成小程序模板的过程](https://s.poetries.top/gitee/20190930/8.png)
![Taro 编译产物与小程序原生结构的对应关系](https://s.poetries.top/gitee/20190930/9.png)

编译这条线做的事，是把 React-like 的写法拆成小程序认识的两部分，模板结构进 `wxml`，状态和逻辑进 `js`。JSX 里的表达式、条件渲染、列表渲染都要在这一步翻译成 `wx:if`、`wx:for` 这类指令。

光有编译还不够，跑起来还需要每个端各自的一套底座。

![Taro 的多端能力，各端提供各自的 runtime 实现](https://s.poetries.top/gitee/20190930/10.png)
![各端组件库的对应实现](https://s.poetries.top/gitee/20190930/11.png)
![Taro 对 redux 等状态管理方案的多端适配](https://s.poetries.top/gitee/20190930/12.png)
![Taro 路由在各端的实现差异](https://s.poetries.top/gitee/20190930/13.png)

所谓多端能力，落到实处就是两句：

- 提供相应端的 `Runtime` 实现，具备适配 `API` 的能力
- 提供统一的基础组件，编译时替换为相应端的组件实现

前一句管 API。你调 `Taro.request`，在小程序端它转成 `wx.request`，在 H5 端它转成 `fetch` 或者 `XMLHttpRequest`，在 RN 端又是另一套。后一句管组件。你写 `<View>`，编译到小程序变 `<view>`，编译到 H5 变 `<div>`，编译到 RN 变 RN 的 `View`。

理解了这两句，后面所有的坑就都好解释了：只要某个端底下没有对应的实现，这层抽象就漏了。

## 三、Taro 项目中遇到的坑

### 3.1 那些真会绊到人的地方

**1、React-like，不完全等同 React**

![React-like 与标准 React 的差异清单](https://s.poetries.top/gitee/20190930/14.png)

这是最容易掉进去的一个。因为语法长得一模一样，你会下意识按 React 的习惯写，然后在编译期收到一条看不懂的报错。原因前面说过，Taro 1.x 靠静态分析改写代码，凡是它分析不出来的动态写法都会被拒绝。

**2、端能力差异不可避免，某些功能在相应端上没有支持**

![不同端之间能力差异的对照](https://s.poetries.top/gitee/20190930/15.png)

框架能抹平的是写法，抹不平的是能力。小程序有的原生能力，浏览器里根本不存在；RN 有的原生模块，小程序里也调不到。碰到这类差异，只能自己在业务层做分支。

**3、样式支持、写法上存在差异**

![三端样式支持的差异对照之一](https://s.poetries.top/gitee/20190930/16.png)
![三端样式支持的差异对照之二](https://s.poetries.top/gitee/20190930/17.png)
![三端样式支持的差异对照之三](https://s.poetries.top/gitee/20190930/18.png)

样式是多端项目里返工最多的部分。H5 最灵活，小程序次之，RN 最弱。你按 H5 的习惯写一版，到 RN 上会发现选择器全被忽略了。

**4、还没有真正支持多端的 UI 组件库能在 Taro 上使用**

![当时可选的 UI 组件库及其多端支持情况](https://s.poetries.top/gitee/20190930/19.png)

这条是 2019 年的现状，当时组件库生态确实很薄，多数只覆盖小程序端。后面会讲现在的情况。

**5、React Native 的 view 不支持 click 事件，需要用 Touchable 组件**

![React Native 中点击事件需要用 Touchable 系列组件包裹](https://s.poetries.top/gitee/20190930/20.png)

第一次遇到这个会很懵，代码没报错，样式也对，就是点不动。RN 里的 `View` 本来就不是可交互元素，要响应点击得用 `Touchable` 系列组件包一层。

**6、React Native 不支持 text-overflow，而是提供原生支持**

RN 的做法是给 `Text` 组件传入 `numberOfLines={num}` 属性来控制行数。问题在于 `Taro` 当时没有暴露原生 `RN` `Text` 组件的 `numberOfLines` 属性，所以通过 `Text` 基础组件没法实现多端统一的文本截断。

（原文这里的组件名被反引号截断成了两截，这里按 `Text` 改正了。）

H5 端的情况相对乐观，主要差异集中在两点：小程序的页面、组件样式都是独立的，H5 会受同名样式影响；小程序的组件会多出一层标签。

![小程序组件与 H5 组件在 DOM 结构上的层级差异](https://s.poetries.top/gitee/20190930/21.png)

第一条尤其要当心。你在小程序上验证过没问题的样式，搬到 H5 上可能被别的页面的同名 class 覆盖掉，因为小程序天然是样式隔离的，H5 不是。这个差异不会报错，只会让你在某个页面上看到一个诡异的边距。

**7、多端要求较高**

用多端框架并不等于可以不懂各个端，实际要求反而更高：

- 对不同端的具体差异有所了解
- 样式实现较为苛刻，需兼顾多端、有所取舍
- 端能力差异可能需要自己填坑

**8、多端填坑方式**

![多端差异的封装与填坑思路](https://s.poetries.top/gitee/20190930/22.png)

我们当时摸出来的实践就四条：

- 对多端差异做好封装
- 采用 BEM 命名方式管理样式
- 采用全局样式维护基础组件 `@tarojs/components` 的样式
- 基于 `@tarojs/components` 自行封装组件库

（原文这两条里包名写的是 `@taro/components`，实际的包名是 `@tarojs/components`，这里改正了。）

前两条是重点。差异封装的意思是，别在业务组件里到处写 `if (端 === 'weapp')`，而是把这类判断收进一层工具函数或者一层适配组件，业务代码只调统一接口。BEM 则是为了兼容 RN 只支持类选择器这条硬限制，你不可能在 RN 上写嵌套选择器，那就干脆从命名上把层级表达出来。

### 3.2 记在本子上的注意事项

下面这些是当时一条条撞出来的，按类别归了一下：

**命名和写法约束**

- 函数需要 `on+函数名` 来规范命名
- 在 `Taro` 中，`JS` 代码里必须书写单引号，特别是 JSX 中，如果出现双引号，可能会导致编译错误
- 小程序端不支持在 `render()` 之外定义 JSX，比如在外面写 `renderForm()`
- Taro 当时还没有支持 `React.Fragment` 语法

这几条都是编译期静态分析带来的约束，前面讲原理时提过。单引号那条最玄学，报错信息经常指不到真正的位置，排查了一下午才发现是某个属性里混了双引号。

**组件与数据**

- 子组件中接收的 `props` 需要定义 `defaultProps`，否则小程序端报错
- 状态更新一定是异步的，React 的状态更新不一定是异步
- 根据环境变量引入不同平台组件、编译到对应平台
- 页面布局拆分组件的方法，由上到下、由左到右拆分

`defaultProps` 那条是因为小程序的自定义组件要求属性有明确的类型和默认值，编译期需要据此生成 `properties` 声明，缺了它生成不出来。

**样式与 RN 限制**

- `css` 样式单位写 `PX` 大写会转成 `rem` 单位
- 文字要包在 `Text` 组件里面，否则不显示
- `position:fixed` 在 `React Native` 不支持
- `Animation` 和 `transform` 在 `React Native` 动画不支持

**环境相关**

- 运行时报缺少包，需要在 `.rn_temp` 目录里面安装

## 四、几个真正省事的技巧

坑说完了，说点好用的。Taro 处理多端差异的思路很统一，都是「同名不同后缀」，编译时按目标端挑文件。理解了这一条，下面三个技巧就是同一个套路的三种用法。

### 4.1 样式文件条件编译

假设目录中同时存在以下两个文件：

```
- index.scss
- index.rn.scss
```

当在 `JS` 文件中引用样式文件写 `import './index.scss'` 时，`RN` 平台会找到并引入 `index.rn.scss`，其他平台会引入 `index.scss`。

这招解决的是前面那条最难受的限制：RN 不支持组合选择器，也不支持一堆 CSS 属性。你不可能为了迁就 RN 把所有端的样式都写成扁平的类选择器，那 H5 端的表达力就废了一半。有了这个机制，公共样式留在 `index.scss` 里正常写，RN 那份单独降级，两边互不干扰。

### 4.2 内置环境变量 process.env.TARO_ENV

`process.env.TARO_ENV` 用于判断当前编译类型，当时有 `weapp / swan / alipay / h5 / rn / tt` 六个取值。可以通过这个变量来书写不同环境下的代码，编译时会将不属于当前编译类型的代码去掉，只保留当前编译类型下的代码。

关键在「编译时去掉」这几个字。这不是运行时的 `if` 判断，而是构建阶段就把另一个分支整段删掉。所以你在小程序包里不会带上 H5 的那份代码，包体积不会因为多端而膨胀。

比如想在微信小程序和 H5 端分别引用不同资源：

```js
if (process.env.TARO_ENV === 'weapp') {
  require('path/to/weapp/name')
} else if (process.env.TARO_ENV === 'h5') {
  require('path/to/h5/name')
}
```

同时也可以在 `JSX` 中使用，用来决定不同端要加载的组件：

```js
render () {
  return (
    <View>
      {process.env.TARO_ENV === 'weapp' && <ScrollViewWeapp />}
      {process.env.TARO_ENV === 'h5' && <ScrollViewH5 />}
    </View>
  )
}
```

这里有个坑要注意，判断必须写成能被静态分析出来的形式。把 `process.env.TARO_ENV` 先赋值给一个变量再判断，编译器就认不出来了，两个分支都会被打进包里。

新版本的 Taro 支持的端比这六个多，取值列表也扩充了，具体有哪些以你装的版本文档为准，别照抄这个列表。

### 4.3 统一接口的多端文件

这是同一套思路的完整版，适合封装差异比较大的组件和工具。

假如有一个 Test 组件存在微信小程序、百度小程序和 H5 三个不同版本，那么就可以像下面这样组织代码：

- `test.js` 文件，这是 `Test` 组件默认的形式，编译到上述三端之外的端时使用的版本
- `test.h5.js` 文件，`Test` 组件的 `H5` 版本
- `test.weapp.js` 文件，`Test` 组件的微信小程序版本
- `test.swan.js` 文件，`Test` 组件的百度小程序版本

这四个文件对外暴露的是统一的接口，接受一致的参数，只是内部有针对各自平台的代码实现。使用 `Test` 组件的时候，引用方式和之前保持一致，`import` 的是不带端类型的文件名，编译时会自动识别并添加端类型后缀：

```
import Test from '../../components/test'

<Test argA={1} argB={2} />
```

（原文这行示例里两个属性都写成了 `argA`，同名属性后一个会覆盖前一个，这里改成 `argA` 和 `argB`。）

同样的做法也适用于纯逻辑。例如微信小程序上使用 `Taro.setNavigationBarTitle` 来设置页面标题，H5 使用 `document.title`，那么可以封装一个 `setTitle` 方法来抹平两个平台的差异。

增加 `set_title.h5.js`：

```js
export default function setTitle (title) {
  document.title = title
}
```

增加 `set_title.weapp.js`：

```js
import Taro from '@tarojs/taro'
export default function setTitle (title) {
  Taro.setNavigationBarTitle({
    title
  })
}
```

调用的时候就当它是一个普通模块：

```
import setTitle from '../utils/set_title'

setTitle('页面标题')
```

对比一下前面那种在业务代码里写 `process.env.TARO_ENV` 判断的做法，差别在于这套方案把差异挡在了模块边界上。业务代码只认识 `setTitle` 这一个名字，将来多支持一个端，只需要多加一个文件，一行业务代码都不用改。项目一旦超过三个端，这套写法的收益就很明显了。

## 五、React Native 端的实践

RN 是三个端里最折腾的一个，因为它不只是编译问题，还牵扯原生环境。当时参考的是这份文档：

> https://nervjs.github.io/taro/docs/react-native.html

### 5.1 把 Taro 项目跑到 RN 上

**1. 运行 yarn dev:rn**

![执行 yarn dev:rn 后的编译输出](https://upload-images.jianshu.io/upload_images/1480597-4032f18cd94f7871.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

这一步会把项目编译到 `.rn_temp` 目录，同时起一个 Metro 打包服务。打开 http://127.0.0.1:8081/index.bundle?platform=ios&dev=true 可以激活编译，看到 bundle 内容说明打包服务是通的：

![访问 index.bundle 地址激活编译，返回打包后的内容](https://upload-images.jianshu.io/upload_images/1480597-58be0cdf0230802f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

先确认这一步再往下走，能省很多事。后面模拟器白屏的时候，先回来看这个地址通不通，八成问题出在打包服务而不是原生工程。

**2. 下载 react-native 运行壳子**

> https://github.com/poetries/react-native-shell

Taro 编译出来的是 JS 产物，不含原生工程，所以需要一个壳来承载它。这个壳放在哪都可以，建议放到项目根目录。

**3. 打开 genymotion 安卓模拟器**

> - [参考文章](http://blog.poetries.top/2019/06/08/rn-summary/#1-1-2-%E5%AE%89%E5%8D%93%E7%8E%AF%E5%A2%83%E6%90%AD%E5%BB%BA) 
> - `adb devices` 查看是否有设备在运行

`adb devices` 这条命令要养成习惯，跑之前先敲一遍。设备列表是空的就别急着看代码，先解决连接问题。

**4. 启动安卓**

在壳子中执行启动命令：

```
react-native run-android
```

**5. 打包 apk**

把 `react-native-shell` 中的 `android` 文件夹拷贝到 `.rn_temp` 文件夹中，`cd android` 执行打包命令即可。

> [参考文章](http://blog.poetries.top/2019/06/08/rn-summary/#%E5%85%AB%E3%80%81%E6%89%93%E5%8C%85)

React Native 本身的环境搭建和打包细节，我在 [React Native 开发总结](https://feinterview.poetries.top/blog/rn-summary) 那篇里写得更细，这里就不重复了。

### 5.2 样式，以 RN 的约束为准

如果要支持 `React Native` 端，必须采用 Flex 布局，并且样式选择器仅支持类选择器，不支持组合器。

以下选择器的写法都是不支持的，在样式转换时会被自动忽略：

```bash
.button.button_theme_islands{
  font-style: bold;
}

img + p {
  font-style: bold;
}

p ~ span {
  color: red;
}

div > span {
  background-color: DodgerBlue;
}

div span { background-color: DodgerBlue; }
```

注意「自动忽略」这四个字，它不报错。你写了一条 `div > span` 的样式，编译能过，RN 上就是不生效，控制台也不会提醒你。所以多端项目的样式最好从一开始就按 RN 的规矩写，而不是等 RN 端出问题了再回来改。

样式上 `H5` 最为灵活，小程序次之，`RN` 最弱。统一多端样式就是对齐短板，也就是要以 `RN` 的约束来管理样式，同时兼顾小程序的限制，核心可以用三点来概括：

- 使用 `Flex` 布局
- 基于 `BEM` 写样式
- 采用 `style` 属性覆盖组件样式

还有个默认值的差异要记住：`RN` 中 `View` 标签默认主轴方向是 `column`，跟浏览器里 `flex-direction` 默认 `row` 正好相反。如果不把其他端改成与 RN 一致，就需要在所有用到 `display: flex` 的地方都显式声明主轴方向。

我的建议是选后者，处处显式写 `flex-direction`。多敲几个字，换来的是三个端上布局行为完全一致，不用在脑子里维护两套默认值。

### 5.3 两个容易写出来的性能问题

**尽量避免在 componentDidMount 中调用 this.setState**

因为在 `componentDidMount` 中调用 `this.setState` 会触发一次额外的更新，组件刚挂载完就再渲染一遍：

```js
import Taro, { Component } from '@tarojs/taro'
import { View, Input } from '@tarojs/components'

class MyComponent extends Component {
  state = {
    myTime: 12
  }
  
  componentDidMount () {
    this.setState({     // ✗ 尽量避免，可以在 componentWillMount 中处理
      name: 1
    })
  }
  
  render () {
    const { isEnable } = this.props
    const { myTime } = this.state
    return (
      <View className='test'>
        {isEnable && <Text className='test_text'>{myTime}</Text>}
      </View>
    )
  }
}
```

单个组件多渲染一次感知不到，但列表里几十个组件同时这么干，进页面就会有一次明显的卡顿。初始状态能在构造阶段确定的，就别放到挂载后再设。

**不要定义没有用到的 state**

```js
import Taro, { Component } from '@tarojs/taro'
import { View, Input } from '@tarojs/components'

class MyComponent extends Component {
  state = {
    myTime: 12,
    noUsed: true   // ✗ 没有用到
  }
  
  render () {
    const { myTime } = this.state
    return (
      <View className='test'>
        <Text className='test_text'>{myTime}</Text>
      </View>
    )
  }
}
```

这条在小程序端的代价比在 Web 上大得多。小程序的逻辑层和视图层是分开的，`setData` 要跨线程传数据，state 里挂着的每个字段都可能被序列化传一遍。没用到的字段等于白付这份成本。

## 六、这篇写于 2019 年，现在的 Taro 已经不一样了

上面所有内容都基于当时的 Taro 1.x，有几个结论已经过期了，得单独说清楚，免得你照着踩。

最大的变化是架构路线。1.x 和 2.x 走的是重编译路线，靠静态分析把 React-like 的 JSX 转成小程序模板，这也是前面那一堆写法限制的来源，不能在 `render` 外写 JSX、必须用单引号、不支持 `Fragment`，都是编译器分析不动导致的。从 Taro 3 开始，官方改成了运行时方案，在小程序里模拟出一套 DOM 和 BOM 接口，让 React 或 Vue 的运行时直接跑在上面。既然不再依赖静态分析，那些语法限制自然大部分就没了。

同时带来的是框架选择的放开。1.x 时代只能用 React-like 的写法，Taro 3 之后官方支持了 React 和 Vue 等多种框架，你可以按团队习惯选。现在版本已经到了 Taro 4，编译工具链也从单一的 webpack 扩展到支持 Vite，支持的端也比当时那六个多。

所以这篇里哪些还有效？原理那部分的编译加运行时两条线、AST 的作用、多端能力靠 runtime 加组件替换来实现，这些底层思路没变。样式那部分基本也还有效，因为 RN 的样式限制来自 RN 本身，不是 Taro 造成的。多端条件编译和同名文件那套机制也还在。

失效的主要是这几条：React-like 的语法限制、`React.Fragment` 不支持、UI 组件库生态薄弱，还有那个具体的六端取值列表。具体到你要用的版本，还是要以官方文档为准，我这边只在 1.x 上完整跑过项目，Taro 3 之后的版本没有在生产上验证过。

图表相关的多端实践，我另外写过一篇 [Taro 中使用 ECharts 小结](https://feinterview.poetries.top/blog/taro-echarts)，那篇专门讲怎么把 `echarts-for-weixin` 接进 Taro 并封装成一个能在小程序和 H5 两端复用的图表组件，跟这篇的通用踩坑正好互补。

## 总结

用一句话概括多端框架的价值：它帮你省掉的是重复的业务代码，不是对各个端的了解。

真要落地，我会按这个顺序推进。开工前先定死目标端，只发小程序和 H5 的项目，和要带 RN 的项目，复杂度不在一个量级；然后按最弱的那个端定样式规范，也就是 Flex 加 BEM 加类选择器，别等 RN 端跑起来了再回头改；接着把所有端差异收进一层适配模块，用同名不同后缀的文件承载，业务层只认统一接口。

最后留一句提醒。多端框架适合的是「三端页面结构和交互高度一致」的项目。如果产品经理给三个端画了三套完全不同的交互稿，那多端框架反而会拖慢你，因为你要同时对付框架的限制和产品的差异。这种情况下老老实实分开写，可能更快。

## 参考

- [Taro 官方文档](https://docs.taro.zone/docs/)
- [Taro GitHub 仓库](https://github.com/NervJS/taro)
- [React Native 官方文档](https://reactnative.dev/)
- [前端进阶之旅](https://interview.poetries.top)
