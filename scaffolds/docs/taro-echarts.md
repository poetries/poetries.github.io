---
title: Taro中使用Echart小结
date: 2019-08-31 17:30:21
tags: Taro
categories: Front-End
---

## 一、使用echarts-for-weixin

1. 下载 `https://github.com/ecomfe/echarts-for-weixin` 下的 `ec-canvas` 文件到项目 `components`中

2. **排除Taro编译选项** `config/index.js`配置文件中找到如下

```
...
compile: {
    exclude: ['src/components/ec-canvas/echarts.js']
}
```

3. 定制`echart`文件大小可减少小程序构建包的大小。然后替换`src/components/ec-canvas/echarts.js`文件即可

> https://www.echartsjs.com/zh/builder.html

## 二、封装一个刷新图表的组件

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

**使用例子**

```js
 <Chart
    chartId='chart-heartRate-line'
    height={'400px'}
    onBeforeSetOption={echarts=>{
        console.log(echarts)
    }}
    option={{
    // tooltip: {
    //     trigger: 'axis',
    //     axisPointer: {
    //         type: 'cross'
    //     },
    //     triggerOn: 'click',
    //     // @FIX tooltip到了容器边缘不改变位置。 给 position return 百分数数组无效，返回[number,number]是有效果的
    //     position: function (pos, params, dom, rect, size) {
    //         // 鼠标在左侧，tooltip 鼠标在右侧
    //         if (pos[0] < size.viewSize[0] / 2) {
    //             return [pos[0] + 10, pos[1] - 30];
    //         } else {
    //             // 鼠标在右侧，tooltip 鼠标在左侧
    //             return [pos[0] - size.contentSize[0] - 15, pos[1] - 15];
    //         }
    //     }
    // },
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
        splitLine: {
            show: false
        },
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
}}
/>
```

## 三、使用问题查询

> https://github.com/ecomfe/echarts-for-weixin/issues
