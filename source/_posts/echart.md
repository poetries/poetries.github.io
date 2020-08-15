---
title: echart使用小结
date: 2018-01-12 10:05:43
tags: Echart
categories: Front-End
---

> 十一个组件选项主要用来进行交互

一、Timeline选项
---

- 时间轴，每个图表最多仅有一个时间轴控件

![](https://poetries1.gitee.io/img-repo/2019/10/45.png)

二、Title选项
---

- 每个图表最多仅有一个标题控件，每个标题控件可设主副标题

> 可以对标题文字的大小样式进行设置

![](https://poetries1.gitee.io/img-repo/2019/10/46.png)


三、toolbox
---

- 工具箱，每个图表最多仅有一个工具箱。工具箱里面可以实现图表类型的切换，保存图片，刷新，查看数据等功能。可以对其像素进行设置

![](https://poetries1.gitee.io/img-repo/2019/10/47.png)


```javascript
{

    mark : {

        show : false,

        title : {

            mark : '辅助线开关',

            markUndo : '删除辅助线',

            markClear : '清空辅助线'

        },

        lineStyle : {

            width : 2,

            color : '#1e90ff',

            type : 'dashed'

        }

    },

    dataZoom : {

        show : false,

        title : {

            dataZoom : '区域缩放',

            dataZoomReset : '区域缩放后退'

        }

    },

    dataView : {

        show : false,

        title : '数据视图',

        readOnly: false,

        lang: ['数据视图', '关闭', '刷新']

    },

    magicType: {

        show : false,

        title : {

            line : '折线图切换',

            bar : '柱形图切换',

            stack : '堆积',

            tiled : '平铺',

            force: '力导向布局图切换',

            chord: '和弦图切换',

            pie: '饼图切换',

            funnel: '漏斗图切换'

        },

        option: {

            // line: {...},

            // bar: {...},

            // stack: {...},

            // tiled: {...},

            // force: {...},

            // chord: {...},

            // pie: {...},

            // funnel: {...}

        },

        type : []

    },

    restore : {

        show : false,

        title : '还原'

    },

    saveAsImage : {

        show : false,

        title : '保存为图片',

        type : 'png',

        lang : ['点击保存']

    }

}

```

四、tooltip
---

- 提示框，鼠标悬浮交互时的信息提示

![](https://poetries1.gitee.io/img-repo/2019/10/48.png)

五、legend
---

- 图例，每个图表最多仅有一个图例，混搭图表共享

![](https://poetries1.gitee.io/img-repo/2019/10/49.png)

六、dataRange
---

- 值域选择，每个图表最多仅有一个值域控件

![](https://poetries1.gitee.io/img-repo/2019/10/50.png)

七、dataZoom
---

- [数据区域缩放](http://echarts.baidu.com/echarts2/doc/example/dataZoom.html)。与toolbox.feature.dataZoom同步，仅对直角坐标系图表有效

roamController
---

- [缩放漫游组件](http://echarts.baidu.com/echarts2/doc/example/map1.html)，仅对地图有效

![](https://poetries1.gitee.io/img-repo/2019/10/51.png)

八、grid
---

> 直角坐标系内绘图网格

![](https://poetries1.gitee.io/img-repo/2019/10/52.png)

九、xAxis
---

> 直角坐标系中横轴数组，数组中每一项代表一条横轴坐标轴，仅有一条时可省略数组。最多同时存在2条横轴，单条横轴时可指定安放于grid的底部（默认）或顶部，2条同时存在时位置互斥，默认第一条安放于底部，第二条安放于顶部

十、yAxis
---

> 直角坐标系中纵轴数组，数组中每一项代表一条纵轴坐标轴，仅有一条时可省略数组。最多同时存在2条纵轴，单条纵轴时可指定安放于grid的左侧（默认）或右侧，2条同时存在时位置互斥，默认第一条安放于左侧，第二条安放于右侧

- 坐标轴有三种类型，类目型、数值型和时间型，纵轴通常为数值型，但条形图时则纵轴为类目型

十一、series（通用）
---

> 驱动图表生成的数据内容数组，数组中每一项为一个系列的选项及数据，其中个别选项仅在部分图表类型中有效，请注意适用类型
