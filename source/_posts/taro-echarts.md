---
title: Taro中使用ECharts小结 小程序与H5双端图表组件封装
date: 2019-08-31 17:30:21
description: 在 Taro 项目里接入 echarts-for-weixin，处理编译排除和定制构建减包，并封装一个小程序与 H5 两端共用同一套 option 的图表组件。
tags:
  - Taro
  - ECharts
  - 小程序
categories: Front-End
---

需求是给一个健康类小程序加折线图，展示用户一周的静息心率。听起来十分钟的活，实际卡了大半天。小程序里没有 DOM，ECharts 那句 `echarts.init(document.getElementById(...))` 直接就跑不通；换成小程序的 canvas 组件，Taro 又会把 ECharts 那个巨大的单文件一起编译一遍，构建慢到怀疑人生。更麻烦的是这个页面 H5 端也要有，两端不能维护两套图表配置。这篇把当时的解法完整记一遍，从接入 `echarts-for-weixin`、排除编译、定制构建减包，到封装一个小程序和 H5 共用同一份 option 的图表组件。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 小程序里为什么不能直接用 ECharts，`echarts-for-weixin` 补了哪一层
- 接入的三步，拷贝 `ec-canvas`、排除 Taro 编译、定制构建减包
- 怎么封装一个双端共用的 `Chart` 组件，两端的 init 差异藏在哪
- 用 `shouldComponentUpdate` 和深比较控制图表刷新，避免无意义的重绘
- 一个完整的折线图 option 长什么样，哪些字段是小程序端必须调的
- tooltip 贴边、loading 状态、按端切换这几个常见问题怎么处理

## 一、小程序里画图表卡在哪

ECharts 是给浏览器写的，它要一个真实的 DOM 节点，内部还会摸 `window`、`document` 这些全局对象。小程序的逻辑层跑在一个没有 DOM 的 JS 环境里，视图层是另一套渲染引擎，两边靠 `setData` 通信。这套结构决定了 ECharts 的初始化那一步天然就走不通。

小程序官方给的画图能力是 `canvas` 组件。它有 canvas 上下文，能画线能填色，但它的 API 和浏览器的 `CanvasRenderingContext2D` 并不完全一致，事件系统也不一样。

`echarts-for-weixin` 补的就是中间这一层。它提供一个叫 `ec-canvas` 的自定义组件，内部把小程序的 canvas 包装成 ECharts 认得的样子，再把小程序的触摸事件转成 ECharts 的鼠标事件。ECharts 那边基本不用改，改的是它下面那层画布。

理解了这个分层，后面的接入步骤和踩坑就都好解释了。

## 二、接入 echarts-for-weixin

### 2.1 把 ec-canvas 拷进项目

下载 `https://github.com/ecomfe/echarts-for-weixin` 下的 `ec-canvas` 文件夹到项目的 `components` 中。

这一步是拷贝源码而不是装 npm 包，原因是 `ec-canvas` 本身是一个小程序原生自定义组件，需要作为原生组件被引用，走不了常规的模块打包流程。

### 2.2 排除 Taro 编译选项

在 `config/index.js` 配置文件中找到并加上：

```
...
compile: {
    exclude: ['src/components/ec-canvas/echarts.js']
}
```

这一步是整个接入过程里最容易漏、漏了最难查的。`echarts.js` 是一个几万行的单文件产物，本身已经是编译好的，再让 Taro 的编译链路过一遍，一是没有任何收益，二是构建时间会直接翻几倍，三是压缩或转译过程有可能把它改坏。加上 `exclude` 之后，这个文件会被原样拷贝过去。

我当时就是没配这条，看着构建卡在那里以为是机器问题，重启了两次才想明白。

### 2.3 定制 echarts 减小包体积

完整版 ECharts 把所有图表类型、所有组件都打进去了，体积相当可观，而小程序主包有明确的大小上限。所以按需定制一份是必要的，不是可选优化。

在线定制入口在这里，勾选你实际用到的图表类型和组件，生成之后替换 `src/components/ec-canvas/echarts.js` 文件即可：

> https://www.echartsjs.com/zh/builder.html

我们那个项目只用了折线图和柱状图，加上 tooltip、legend、grid 这几个组件，定制之后的体积比完整版小了一大截。判断标准很简单，你的图表里没出现过的类型就别勾。

有一点要提醒：以后新增图表类型的时候，得记得回来重新定制一次，否则线上会静默地画不出来，控制台还不一定给你清楚的报错。这个坑建议在项目 README 里写一行，不然过几个月换了人接手根本想不到。

## 三、封装一个双端复用的图表组件

目标很明确：业务代码只写一份 option，小程序和 H5 两端都能画出来，数据变了图表自动刷新。

差异集中在初始化那一步，H5 端要拿 DOM 节点，小程序端要走 `ec-canvas` 的 `init` 回调。把这块差异挡住，上层就统一了。

### 3.1 依赖与运行时的 Taro 引用

```js
// src/compoments/Chart.js

import Taro, { Component } from '@tarojs/taro'
import { View } from '@tarojs/components'
import PropTypes from 'prop-types'
import _isEqual from 'lodash/isEqual.js'
import Nerv from 'nervjs'
import * as echarts from '../ec-canvas/echarts'

let Taro_ = Taro
if (process.env.TARO_ENV === 'h5') {
  Taro_ = require('@tarojs/taro-h5').default
}
```

最后这三行是当时 Taro 1.x 的一个适配写法。H5 端的组件基类来自 `@tarojs/taro-h5`，跟小程序端不是同一个，所以要按 `process.env.TARO_ENV` 换一下。前面讲过这个变量是编译期就被替换掉的，所以这个 `if` 在产物里只会保留一个分支。

Taro 3 之后运行时架构变了，这段适配已经不需要，直接继承 React 的 `Component` 就行。这里保留原始写法，是因为它能说明当时为什么要这么绕。

### 3.2 两端各自的初始化逻辑

先抽一个两端共用的收尾函数，它做三件事：调用外部传进来的钩子、把图表实例存起来、按 `loading` 决定是显示加载态还是直接 `setOption`。

```js
const commonFunc = (_this, chart) => {
  const { option, loading, loadingConf } = _this.props
  _this.beforeSetOption()
  _this.chartInstance = chart
  if (loading) {
    _this.chartInstance.showLoading('default', loadingConf)
  } else {
    _this.chartInstance.setOption(option)
  }
}
```

`beforeSetOption` 这个钩子留得很有必要。ECharts 有些能力需要拿到 `echarts` 这个模块对象本身才能用，比如注册主题、注册地图、构造渐变色。把它作为参数抛给外面，业务方就能在 `setOption` 之前插一脚。

然后是两端的 init。这里用了一个立即执行函数，在模块加载时就根据编译目标选好实现，避免每次初始化都判断一次：

```js
const initChart = ((type) => {
  switch (type) {
    case 'h5':
      return (_this) => {
        const { chartId } = _this.props
        let node = document.getElementById(chartId)
        let chart = echarts.init(node)
        commonFunc(_this, chart)
      }
    case 'weapp':
      return (_this) => {
        _this.chartRef.init((canvas, width, height) => {
          const chart = echarts.init(canvas, null, {
            width: width,
            height: height
          })
          canvas.setChart(chart)
          commonFunc(_this, chart)
          return chart
        })
      }
  }
})(process.env.TARO_ENV)
```

两边的差别值得说一下。H5 那条就是标准的 ECharts 用法，拿节点、init、设 option。小程序那条要经过 `ec-canvas` 的 `init` 回调，回调会把 canvas 对象和它的实际宽高交给你，`echarts.init` 的第三个参数必须显式传宽高，因为小程序端读不到 DOM 的尺寸。`canvas.setChart(chart)` 这句也不能省，它是把图表实例回填给 `ec-canvas`，触摸事件的转发要靠它。

小程序端的 canvas 尺寸拿不到就画不出来，这一点是和 Web 最不一样的地方。

### 3.3 组件主体与刷新策略

```js
export default class Chart extends Taro_.Component {

  config = {
    component: true,
    usingComponents: {
      'ec-canvas': '../ec-canvas/ec-canvas'
    }
  }

  componentDidMount() {
    initChart(this)
  }

  componentWillReceiveProps(nextProps) {
    const { option: newOption } = nextProps
    if (!_isEqual(nextProps, this.props)) {
      this.refreshChart(newOption)
    }
  }

  shouldComponentUpdate(nextProps) {
    return !_isEqual(this.props, nextProps)
  }
```

`config` 里的 `usingComponents` 是把 `ec-canvas` 作为原生自定义组件注册进来，这是 Taro 引用小程序原生组件的标准做法。

刷新策略这块是这个组件的关键。ECharts 的实例是自己管理画布的，它不参与 React 的渲染流程，所以图表的更新不能靠 `render`，只能靠手动调 `setOption`。这里用 `componentWillReceiveProps` 捕获新 props，用 `lodash` 的深比较判断是不是真的变了，变了才刷新。

配上 `shouldComponentUpdate` 里同样的深比较，父组件任何一次无关的重渲染都不会波及到图表。图表这类组件的重绘成本很高，尤其在小程序端还牵扯 canvas 重画，这层拦截是必要的。

接着是刷新和渲染部分：

```js
  refreshChart = (newOption) => {
    const { option, loading, loadingConf } = this.props
    if (this.chartInstance) {
      if (loading) {
        this.chartInstance.showLoading('default', loadingConf)
      } else {
        this.chartInstance.hideLoading()
        this.chartInstance.setOption(newOption || option, true)
      }
    }
  }

  beforeSetOption = () => {
    const { onBeforeSetOption } = this.props
    onBeforeSetOption && onBeforeSetOption(echarts)
  }

  setChartRef = node => this.chartRef = node
```

`setOption` 的第二个参数传了 `true`，这是 `notMerge`。默认情况下 ECharts 会把新 option 和旧的合并，对于数据长度会变的场景（比如从七天切到三十天），合并会留下上一次的残留。这里选择整份替换，行为更可预期。代价是每次都全量重绘，如果你的场景是高频小幅更新，可以考虑改回合并模式。

`this.chartInstance` 前面那个 `if` 判断也别删。异步数据回来的时机是不定的，图表还没初始化完就收到新 props 的情况真的会发生。

### 3.4 render 与 props 定义

```js
  render() {
    const { chartId, width, height, customStyle } = this.props
    let chartContainerStyle = `${customStyle}width:${width};height:${height};`

    return (
      <View style={chartContainerStyle}>
        {
          {
            'h5': <View style={`width:${width};height:${height};`} id={chartId} />,
            'weapp': <ec-canvas ref={this.setChartRef} canvasId={chartId} ec={{ lazyLoad: false,disableTouch: true }} />
          }[process.env.TARO_ENV]
        }
      </View>
    )
  }
}
```

这里用对象取值代替 `if` 分支，两端渲染不同的容器。H5 端是一个带 `id` 的普通 `View`，小程序端是 `ec-canvas` 组件。

外层那个 `View` 必须有明确的宽高，这是硬要求。ECharts 的画布尺寸取自容器，容器高度塌成 0 的话，图表就是一片空白，控制台还什么都不报。图表画不出来的时候先去 F12 看容器高度，这条能省你半小时。

`disableTouch: true` 表示禁用触摸事件转发。开着的话 tooltip 之类的交互能用，但会带来额外的 `setData` 开销；如果你的图表是纯展示的，关掉更划算。

最后是 props 的类型和默认值：

```js
Chart.propTypes = {
  chartId: PropTypes.string.isRequired,
  width: PropTypes.string,
  height: PropTypes.string,
  customStyle: PropTypes.string,
  loading: PropTypes.bool,
  loadingConf: PropTypes.object,
  option: PropTypes.object.isRequired,
  onBeforeSetOption: PropTypes.func
}

Chart.defaultProps = {
  width: '100%',
  height: '200px',
  customStyle: '',
  loading: null,
  loadingConf: null,
  onBeforeSetOption: null
}
```

`defaultProps` 在 Taro 里不是可写可不写的。小程序端的自定义组件需要在编译期生成属性声明，缺了默认值会直接报错，这个坑我在 [Taro跨平台开发实践](https://feinterview.poetries.top/blog/taro-summary) 那篇里也提过。

## 四、用起来长什么样

业务侧就是给它一个 `chartId`、一个高度、一份 option。先看外层：

```js
 <Chart
    chartId='chart-heartRate-line'
    height={'400px'}
    onBeforeSetOption={echarts=>{
        console.log(echarts)
    }}
    option={{ /* 见下方 */ }}
/>
```

`chartId` 在页面里必须唯一。H5 端它是 DOM 的 id，小程序端它是 `canvasId`，同一个页面上放两张图却用了同一个 id，第二张会画不出来或者盖掉第一张。

option 里的坐标轴部分是这样，重点在把小程序端多余的装饰全关掉：

```js
    animation: false,
    legend: {
        data:[''],
        y: 'top',
        x: 'center',
        padding: 10,
        show: true,
    },
    xAxis:  {
        type: 'category',
        show : true,
        boundaryGap: false,
        nameTextStyle: {
            color: '#333'
        },
        axisTick: {
            show: false
        },
        splitLine: {
            show: false
        },
        axisLabel: {
            show: true,
            textStyle: {
                fontSize: '15'
            },
            formatter: '{value}'
        },
        data: historyData ? historyData.map(v=>weeks[v.weekDay-1]) : []
    },
```

原文这段 `xAxis` 里 `splitLine` 出现了两次，都是 `show: false`，后一个会覆盖前一个，效果一样但属于冗余，这里合并成了一个。

`animation: false` 这条在小程序端建议默认关掉。动画意味着连续多帧重绘，canvas 在小程序里的绘制成本比浏览器高，低端机上很容易掉帧。数据一次性到位的图表，开动画收益不大。

`data` 那行的三元判断也别省。异步数据没回来之前 `historyData` 是 undefined，直接 `.map` 会抛错，而且这个错发生在渲染阶段，小程序端的报错信息经常指不到真正的位置。

纵轴和数据系列部分：

```js
    yAxis: {
        type: 'value',
        axisLine:{
            show: false
        },
        axisTick:{       //y轴刻度线
            "show":false
        },
        splitLine: {     //网格线
            "show": false
        },
        axisLabel: {
            show: true,
            textStyle: {
                fontSize: '15'
            },
            formatter: '{value}'
        },
        axisPointer: {
            snap: true
        }
    },
    series : [
    {
        name:'安静心率',
        type:'line',
        itemStyle:{  
            normal:{  
                color: '#B0EA32',
            }
        },
        label:{
            normal:{
                show:true,            //显示数字
                position: 'top'        //这里可以自己选择位置
            }
        },
        data: historyData ? historyData.map(v=>v.heartRate) : []
    }
]
```

`itemStyle` 和 `label` 里那层 `normal` 是 ECharts 3 的写法，从 ECharts 4 开始这一层已经可以省掉，直接写 `itemStyle: { color: '#B0EA32' }` 就行。老写法目前还兼容，但新项目没必要跟着写。

`label.show: true` 是在数据点上直接标数字。移动端屏幕窄，数据点一多这些数字会挤在一起糊成一片，点数超过十个左右就建议关掉，或者用 `interval` 隔一个显示一个。

原文这段 option 里还注释掉了一大块 tooltip 配置，那块记录的是一个真实的坑，单独拎出来说。

## 五、几个绕不过去的问题

**tooltip 贴到容器边缘会被截断**

原文注释里那句 `@FIX` 写的是：tooltip 到了容器边缘不改变位置，给 `position` 返回百分数数组无效，返回 `[number, number]` 是有效果的。

解法是自己算位置，判断鼠标或触点在容器的左半边还是右半边，把提示框放到另一侧：

```js
position: function (pos, params, dom, rect, size) {
    // 触点在左侧，tooltip 放右侧
    if (pos[0] < size.viewSize[0] / 2) {
        return [pos[0] + 10, pos[1] - 30];
    } else {
        // 触点在右侧，tooltip 放左侧
        return [pos[0] - size.contentSize[0] - 15, pos[1] - 15];
    }
}
```

配套的 `trigger: 'axis'`、`axisPointer.type: 'cross'`、`triggerOn: 'click'` 也是移动端常用的组合，触摸屏没有 hover，改成点击触发体验会好很多。

**loading 态怎么给**

组件里预留了 `loading` 和 `loadingConf` 两个 props，内部对应 `showLoading` 和 `hideLoading`。接口请求开始时把 `loading` 置 true，数据回来置 false，图表自己会切。比在外面套一层骨架屏省事，也不会有容器高度跳动的问题。

**小程序和 H5 表现不一致**

十有八九是尺寸。H5 端容器有 DOM 撑着，小程序端要靠传进去的 `width` 和 `height`。所以 `height` 建议传具体值，别指望百分比在两端都算得出同样的结果。

**更多问题去哪查**

`echarts-for-weixin` 的 issue 区积累了大量真实场景的排查记录，遇到怪问题先去这里搜关键词，命中率很高：

> https://github.com/ecomfe/echarts-for-weixin/issues

## 六、这篇写于 2019 年，有几处要更新

上面的代码基于 Taro 1.x 和当时的 ECharts 4，有几点现在不一样了，得说清楚。

`Taro_ = require('@tarojs/taro-h5').default` 这段适配是 Taro 1.x 特有的。Taro 3 改成运行时架构之后，组件基类统一了，这段可以直接删掉，改成标准的 React 组件写法。`Nerv` 那个引用同理，那是 Taro 1.x 底层用的 React-like 库，新版本不再需要。

小程序端的 canvas 也升级过。微信基础库后来提供了新的 canvas 接口，接口形态更接近 Web 标准，`echarts-for-weixin` 也跟着做了适配，接入时的初始化写法和老版本不完全一样。具体用哪套，以你项目的基础库版本和仓库里当前的示例为准。

按需定制的方式也多了一条路。除了在线 builder 生成文件，ECharts 5 起支持通过 ES Module 按需引入各个图表和组件，配合打包器做 tree shaking。哪种更合适取决于你的构建链路，小程序端因为要走原生组件那条路，在线定制往往还是更省事。

这些新版本我只在本地 demo 上试过，没有在生产项目上跑完整流程，你要照着做的话建议先在小项目上验一遍。

## 总结

回过头看，在 Taro 里用 ECharts 真正需要解决的就三件事。

一是让 ECharts 能在没有 DOM 的环境里初始化，这件事 `echarts-for-weixin` 的 `ec-canvas` 已经替你做了，你要做的是别让 Taro 的编译链路去动它，也就是那条 `exclude` 配置。二是控制体积，主包有上限，按需定制不是优化项而是必选项。三是把两端的初始化差异封在组件里，让业务层只面对一份 option。

最容易出问题的地方我再点一次：容器高度塌成 0，图表就是一片空白且不报错；`chartId` 在同一页面重复，第二张图画不出来；小程序端 `echarts.init` 不传宽高，同样是白的。这三个现象都不给报错，全靠经验。

图表之外的 Taro 多端踩坑，可以接着看 [Taro跨平台开发实践](https://feinterview.poetries.top/blog/taro-summary)，那篇讲的是编译原理、样式差异和端能力差异这些通用问题，和这篇正好配套。

## 参考

- [echarts-for-weixin](https://github.com/ecomfe/echarts-for-weixin)
- [Apache ECharts 官方文档](https://echarts.apache.org/zh/index.html)
- [ECharts 在线定制](https://echarts.apache.org/zh/builder.html)
- [Taro 官方文档](https://docs.taro.zone/docs/)
- [前端进阶之旅](https://interview.poetries.top)
