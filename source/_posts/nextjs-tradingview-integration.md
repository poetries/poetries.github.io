---
title: 在Next.js中接入TradingView图表实践总结
date: 2026-02-09 17:30:00
description: 详细讲解如何在Next.js项目中接入TradingView Charts，包括环境配置、数据馈送实现、自定义指标、主题定制、性能优化等完整流程。
tags:
  - TradingView
  - Next.js
  - K线图
  - 图表集成
  - React
categories: Front-End
---

> 原文地址：https://feinterview.poetries.top/blog/nextjs-tradingview-integration

## 导语

TradingView 是全球最专业的金融图表可视化库之一，提供了功能强大的 K 线图、指标系统和技术分析工具。在金融行情类 Web 应用中，接入 TradingView 是提升用户体验的首选方案。

本文将基于实际项目代码，系统讲解如何在 **Next.js** 项目中接入 TradingView Charts，包括环境配置、Datafeed 数据馈送实现、自定义指标开发、主题样式定制、以及关键的性能优化策略。

## 一、项目准备与环境配置

### 1.1 获取 TradingView 图表库

TradingView 图表库需要从官方获取授权后下载。获取后将文件放置在项目的 `public/static/charting_library` 目录下：

```
public/
  └── static/
      └── charting_library/
          ├── charting_library.standalone.js
          └── bundles/
              ├── *.js
              └── *.css
```

### 1.2 组件目录结构

```
src/components/Tradingview/
├── index.tsx              # 主组件
├── datafeed.ts            # 数据馈送实现
├── widgetOpts.tsx         # 图表配置选项
├── widgetMethods.ts       # 图表方法工具
├── theme.ts               # 主题配置
├── constant.ts           # 常量定义
└── customIndicators/      # 自定义指标
    ├── ma.ts
    ├── macd.ts
    ├── kdj.ts
    └── customerRSI.ts
```

## 二、核心组件实现

### 2.1 主组件：TradingView 图表容器

```tsx
// src/components/Tradingview/index.tsx
import { useEffect, useRef, useState } from 'react'
import { widget } from 'public/static/charting_library'
import { useStores } from '@/context/mobxProvider'
import { STORAGE_GET_CHART_PROPS, STORAGE_REMOVE_CHART_PROPS, ThemeConst } from './constant'
import { ColorType, applyOverrides, createWatermarkLogo, setCSSCustomProperty, setChartStyleProperties } from './widgetMethods'
import getWidgetOpts from './widgetOpts'
import { useConfig } from '@/context/configProvider'
import { useRouter } from 'next/router'
import stores from '@/stores'
import { observer } from 'mobx-react'
import { STORAGE_SET_TRADINGVIEW_RESOLUTION } from '@/utils/storage'

const Tradingview = () => {
  const chartContainerRef = useRef<HTMLDivElement>()
  const { ws } = useStores()
  const { isMobile, isPc } = useConfig()
  const router = useRouter()
  const [isChartLoading, setIsChartLoading] = useState(true)
  const [loading, setLoading] = useState(true)

  const query = {
    ...router.query,
    ...getInjectParams()
  } as any

  const datafeedParams = {
    setActiveSymbolInfo: ws.setActiveSymbolInfo,
    removeActiveSymbol: ws.removeActiveSymbol,
    getDataFeedBarCallback: ws.getDataFeedBarCallback,
    dataSourceCode: query.dataSourceCode
  }

  const params = {
    symbol: (query.symbolName || 'BTCUSDT') as string,
    locale: (query.locale || 'en') as LanguageCode,
    theme: (query.theme || 'light') as ThemeName,
    colorType: Number(query.colorType || 1) as ColorType,
    isMobile,
    bgGradientStartColor: query.bgGradientStartColor ? `#${query.bgGradientStartColor}` : '',
    bgGradientEndColor: query.bgGradientEndColor ? `#${query.bgGradientEndColor}` : ''
  }

  useEffect(() => {
    console.log('Tradingview组件初始化')
    const showBottomMACD = Number(query.showBottomMACD || 1)
    const chartType = (query.chartType !== '' ? Number(query.chartType || 1) : 1) as ChartStyle
    const theme = params.theme

    // 切换主题时清除本地缓存，避免颜色闪烁
    const defaultBgColor = theme === 'dark' ? ThemeConst.black : ThemeConst.white
    if (theme && defaultBgColor !== STORAGE_GET_CHART_PROPS('paneProperties.background')) {
      STORAGE_REMOVE_CHART_PROPS()
    }

    const widgetOptions = getWidgetOpts(params, chartContainerRef.current, datafeedParams)
    const tvWidget = new widget(widgetOptions)

    setTimeout(() => {
      setLoading(false)
    }, 200)

    tvWidget.onChartReady(async () => {
      setIsChartLoading(false)

      // 动态设置 CSS 变量
      setCSSCustomProperty({ tvWidget, theme })

      // 监听时间周期变化
      tvWidget
        .activeChart()
        .onIntervalChanged()
        .subscribe(null, (interval, timeframeObj) => {
          // 记录当前分辨率
          STORAGE_SET_TRADINGVIEW_RESOLUTION(interval)

          // 日周月级别使用 UTC 时区，分钟级别使用上海时区
          if (['D', 'W', 'M', 'Y'].some((item) => interval.endsWith(item))) {
            tvWidget.activeChart().getTimezoneApi().setTimezone('Etc/UTC')
          } else {
            tvWidget.activeChart().getTimezoneApi().setTimezone('Asia/Shanghai')
          }

          ws.activeSymbolInfo.onResetCacheNeededCallback?.()
          setTimeout(() => {
            tvWidget.activeChart().resetData()
          }, 100)
        })

      // 默认显示 MACD 指标
      if (showBottomMACD === 1) {
        tvWidget.activeChart().createStudy(
          'MACD',
          false,
          false,
          { in_0: 12, in_1: 26, in_3: 'close', in_2: 9 },
          {
            'Histogram.color.3': 'rgba(197, 71, 71, 0.7188)',
            showLabelsOnPriceScale: !!isPc
          }
        )
      }

      // 创建自定义 MA 指标
      tvWidget.activeChart().createStudy('Customer Moving Average', false, false, {}, { showLabelsOnPriceScale: false })

      // 动态切换主题
      if (query.theme && !params.bgGradientStartColor) {
        await tvWidget.changeTheme(theme)
      }

      // 设置 K 线柱样式（绿涨红跌 / 红涨绿跌）
      setChartStyleProperties({ colorType: params.colorType, tvWidget })

      // 应用覆盖样式
      applyOverrides({
        tvWidget,
        chartType,
        bgGradientStartColor: params.bgGradientStartColor,
        bgGradientEndColor: params.bgGradientEndColor
      })

      // 添加水印 Logo
      if (query.hideWatermarkLogo !== '0' && query.watermarkLogoUrl) {
        createWatermarkLogo(query.watermarkLogoUrl)
      }

      // 记录实例
      ws.setTvWidget(tvWidget)
      window.tvWidget = tvWidget
    })

    return () => {
      tvWidget.remove()
      mitt.off('symbol_change')
    }
  }, [router.query])

  return (
    <div style={{ position: 'relative' }}>
      <div id="tradingview" ref={chartContainerRef} style={{ height: 'calc(100vh - 60px)', opacity: loading ? 0 : 1 }} />
      {isChartLoading && (
        <div className="loading-container">
          <div className="loading"></div>
        </div>
      )}
    </div>
  )
}

export default observer(Tradingview)
```

### 2.2 Datafeed 数据馈送实现

Datafeed 是 TradingView 与后端数据交互的核心接口，需要实现以下方法：

```typescript
// src/components/Tradingview/datafeed.ts
class DataFeedBase {
  configuration: DatafeedConfiguration

  constructor(props: Partial<ChartingLibraryWidgetOptions>) {
    this.configuration = {
      supports_time: true,
      supports_timescale_marks: true,
      supports_marks: true,
      // 支持的分辨率
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
      intraday_multipliers: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M']
    } as DatafeedConfiguration

    this.setActiveSymbolInfo = props.setActiveSymbolInfo
    this.removeActiveSymbol = props.removeActiveSymbol
    this.getDataFeedBarCallback = props.getDataFeedBarCallback
    this.isZh = props.locale === 'zh_TW'
  }

  // 图表初始化时调用，设置支持的配置
  onReady(callback) {
    setTimeout(() => {
      callback(this.configuration)
    }, 0)
  }

  // 解析品种信息
  async resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback, extension) {
    const resolution = String(STORAGE_GET_TRADINGVIEW_RESOLUTION() || '')
    const ENV = getEnv()
    const urlPrefix = ENV.isApp ? getInjectParams().baseUrl : ''

    let symbolInfo
    if (!ENV.isApp) {
      // HTTP 请求获取品种信息
      const res = await request(`${urlPrefix}/api/trade-core/coreApi/symbols/symbol/detail?symbol=${symbolName}`)
      symbolInfo = res?.data || {}
    } else {
      // APP 内获取 RN 传递的数据
      symbolInfo = {
        ...(ENV?.injectParams?.symbolInfo || {}),
        ...(stores.global.symbolInfo || {})
      }
    }

    const currentSymbol = {
      ...symbolInfo,
      precision: symbolInfo?.symbolDecimal || 2,
      description: symbolInfo?.remark || '',
      exchange: '',
      session: '24x7',
      name: symbolInfo.symbol,
      dataSourceCode: symbolInfo.dataSourceCode
    }

    const commonSymbolInfo = {
      has_intraday: true,
      has_daily: true,
      has_weekly_and_monthly: true,
      intraday_multipliers: this.configuration.intraday_multipliers,
      supported_resolutions: this.configuration.supported_resolutions,
      data_status: 'streaming',
      format: 'price',
      minmov: 1,
      pricescale: Math.pow(10, currentSymbol.precision),
      ticker: currentSymbol?.name
    } as LibrarySymbolInfo

    const currentSymbolInfo = {
      ...commonSymbolInfo,
      ...currentSymbol,
      description: this.isZh ? currentSymbol.description : currentSymbol?.name,
      exchange: this.isZh ? currentSymbol?.exchange : '',
      session: '0000-0000|0000-0000:1234567;1',
      timezone: ['D', 'W', 'M', 'Y'].some((item) => resolution.endsWith(item)) ? 'Etc/UTC' : 'Asia/Shanghai'
    } as LibrarySymbolInfo

    setTimeout(() => {
      onSymbolResolvedCallback(currentSymbolInfo)
    }, 0)
  }

  // 搜索品种
  searchSymbols(userInput, exchange, symbolType, onResultReadyCallback) {
    const keyword = userInput || ''
    const resultArr = symbolInfoArr
      .filter((item) => item.name.includes(keyword))
      .map((item) => ({
        symbol: item.name,
        name: item.name,
        full_name: `${item.name}`,
        description: this.isZh ? item.description : item.name,
        exchange: this.isZh ? item.exchange : '',
        type: item.type,
        ticker: item.name
      }))

    setTimeout(() => {
      onResultReadyCallback(resultArr)
    }, 0)
  }

  // 获取 K 线历史数据（核心方法）
  getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
    const { from, to, firstDataRequest, countBack } = periodParams
    this.setActiveSymbolInfo({ symbolInfo, resolution })
    this.getDataFeedBarCallback({
      symbolInfo,
      resolution,
      from,
      to,
      countBack,
      onHistoryCallback,
      onErrorCallback,
      firstDataRequest
    })
  }

  // 订阅实时数据更新
  subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
    this.setActiveSymbolInfo({
      symbolInfo,
      resolution,
      onRealtimeCallback,
      subscriberUID,
      onResetCacheNeededCallback
    })
    mitt.on('symbol_change', () => {
      onResetCacheNeededCallback()
    })
  }

  // 取消订阅
  unsubscribeBars(subscriberUID) {
    this.removeActiveSymbol(subscriberUID)
  }
}

export default DataFeedBase
```

### 2.3 图表配置选项

```typescript
// src/components/Tradingview/widgetOpts.tsx
import ma from './customIndicators/ma'

export default function getWidgetOpts(props, containerRef: any, datafeedParams: any): ChartingLibraryWidgetOptions {
  const ENV = getEnv()
  const theme = props.theme
  const bgColor = theme === 'dark' ? ThemeConst.black : ThemeConst.white
  const toolbar_bg = theme === 'dark' ? ThemeConst.black : '#fff'

  // 禁用的功能
  const disabled_features: ChartingLibraryFeatureset[] = [
    'header_compare',
    'symbol_search_hot_key',
    'study_templates',
    'header_saveload',
    'save_shortcut',
    'header_undo_redo',
    'symbol_info',
    'timeframes_toolbar',
    'scales_date_format',
    'header_fullscreen_button',
    'display_market_status'
  ]

  // 移动端额外禁用
  if (props.isMobile) {
    disabled_features.push(
      'header_symbol_search',
      'context_menus',
      'show_chart_property_page',
      'header_screenshot',
      'adaptive_logo',
      'left_toolbar'
    )
  }

  const widgetOptions: ChartingLibraryWidgetOptions = {
    fullscreen: true,
    autosize: true,
    timezone: 'exchange',
    library_path: `${ENV.isApp ? '.' : ''}/static/charting_library/`,
    datafeed: new DataFeedBase(datafeedParams),
    symbol: props.symbol,
    client_id: 'tradingview.com',
    user_id: 'public_user_id',
    locale: props.locale as LanguageCode,
    interval: isPC() ? '15' : '1',
    theme,
    toolbar_bg,
    container: containerRef,
    symbol_search_request_delay: 1000,
    auto_save_delay: 5,
    study_count_limit: 5,
    allow_symbol_change: true,
    overrides: {
      'paneProperties.background': `${bgColor}`
    },
    disabled_features,
    enabled_features: ['hide_resolution_in_legend', 'display_legend_on_all_charts'],
    custom_css_url: ENV.isApp ? `./styles/index.css` : `/static/styles/index.css`,
    favorites: {
      intervals: ['1', '5', '15', '30', '60']
    },
    custom_indicators_getter: function (PineJS) {
      return Promise.resolve([ma(PineJS)])
    },
    loading_screen: {
      backgroundColor: 'transparent',
      foregroundColor: 'transparent'
    }
  }

  return widgetOptions
}
```

## 三、K线数据与WebSocket实时更新

### 3.1 WebSocket Store 实现

```typescript
// src/stores/ws.ts
class WsStore {
  tvWidget = null
  @observable lastbar = {}
  @observable activeSymbolInfo = {}

  // HTTP 获取历史 K 线数据
  getHttpHistoryBars = async (symbolInfo, resolution, from, to, countBack, firstDataRequest) => {
    const klineType =
      {
        1: '1min',
        5: '5min',
        15: '15min',
        30: '30min',
        60: '60min',
        240: '4hour',
        '1D': '1day',
        '1W': '1week',
        '1M': '1mon'
      }[resolution] || '1min'

    const res = await request.get(`${url}/api/trade-market/marketApi/kline/symbol/klineList`, {
      params: {
        symbol: symbolInfo.symbol,
        first: firstDataRequest,
        current: 1,
        size: document.documentElement.clientWidth >= 1200 ? 500 : 200,
        klineType,
        klineTime: to * 1000
      }
    })

    const list = res?.data || []
    return list
      .map((item) => {
        const [klineTime, open, high, low, close] = (item || '').split(',')
        return {
          open: Number(open),
          close: Number(close),
          high: Number(high),
          low: Number(low),
          time: resolution.includes('M') ? Number(klineTime) + 8 * 60 * 60 * 1000 : Number(klineTime)
        }
      })
      .reverse()
  }

  // 更新最后一条 K 线
  updateBar = (socketData, currentSymbol) => {
    const precision = currentSymbol.precision
    const lastBar = this.lastbar
    const resolution = currentSymbol.resolution
    const serverTime = socketData?.priceData?.id / 1000
    const bid = socketData?.priceData?.buy

    let rounded = serverTime
    if (!isNaN(resolution) || resolution.includes('D')) {
      const coeff = (resolution.includes('D') ? 1440 : Number(resolution)) * 60
      rounded = Math.floor(serverTime / coeff) * coeff
    }

    const lastBarSec = lastBar?.time / 1000

    if (rounded > lastBarSec) {
      // 新建 K 线
      return {
        time: rounded * 1000,
        open: Number(bid),
        high: Number(bid),
        low: Number(bid),
        close: Number(bid)
      }
    } else {
      // 更新当前 K 线
      return {
        time: lastBar.time,
        open: lastBar.open,
        high: Math.max(lastBar.high, Number(bid)),
        low: Math.min(lastBar.low, Number(bid)),
        close: Number(bid)
      }
    }
  }

  // 处理 WebSocket 消息
  @action
  message(res) {
    if (res?.header?.msgId === 'symbol') {
      const quoteBody = this.parseQuoteBodyData(res?.body)
      if (quoteBody?.symbol === this.activeSymbolInfo?.symbolInfo?.name) {
        const newLastBar = this.updateBar(quoteBody, {
          resolution: this.activeSymbolInfo.resolution,
          precision: this.activeSymbolInfo.symbolInfo.precision,
          symbolInfo: this.activeSymbolInfo.symbolInfo
        })
        if (newLastBar) {
          this.activeSymbolInfo.onRealtimeCallback?.(newLastBar)
          this.lastbar = newLastBar
        }
      }
    }
  }

  // Datafeed 回调
  @action
  getDataFeedBarCallback = (obj = {}) => {
    const { symbolInfo, resolution, firstDataRequest, from, to, countBack, onHistoryCallback } = obj
    this.getHttpHistoryBars(symbolInfo, resolution, from, to, countBack, firstDataRequest).then((bars) => {
      if (bars?.length) {
        onHistoryCallback(bars, { noData: false })
        this.lastbar = bars.at(-1)
      } else {
        onHistoryCallback(bars, { noData: true })
      }
    })
  }
}

export default wsStore
```

## 四、自定义指标开发

### 4.1 自定义 MA 指标示例

```typescript
// src/components/Tradingview/customIndicators/ma.ts
const customerMovingAverage = (PineJS: PineJS) => {
  const indicators: CustomIndicator = {
    name: 'Customer Moving Average',
    metainfo: {
      _metainfoVersion: 51,
      id: 'Customer Moving Average@tv-basicstudies-1',
      name: 'Customer Moving Average',
      description: 'Customer Moving Average',
      shortDescription: 'MA',
      is_price_study: true,
      isCustomIndicator: true,
      format: { type: 'price' },
      defaults: {
        styles: {
          plot_0: { linestyle: 0, linewidth: 1, plottype: 0, trackPrice: false, transparency: 35, visible: true, color: '#FF0000' },
          plot_1: { linestyle: 0, linewidth: 1, plottype: 0, trackPrice: false, transparency: 35, visible: true, color: '#00FF00' },
          plot_2: { linestyle: 0, linewidth: 1, plottype: 0, trackPrice: false, transparency: 35, visible: true, color: '#00FFFF' }
        },
        inputs: { in_0: 5, in_1: 10, in_2: 30 },
        precision: 4
      },
      plots: [
        { id: 'plot_0', type: 'line' },
        { id: 'plot_1', type: 'line' },
        { id: 'plot_2', type: 'line' }
      ],
      inputs: [
        { id: 'in_0', name: 'Length', defval: 9, type: 'integer', min: 1, max: 1e4 },
        { id: 'in_1', name: 'Length1', defval: 10, type: 'integer', min: 1, max: 1e4 },
        { id: 'in_2', name: 'Length2', defval: 30, type: 'integer', min: 1, max: 1e4 }
      ]
    },
    constructor: function (this: LibraryPineStudy<IPineStudyResult>) {
      this.main = function (context, inputCallback) {
        const close = PineJS.Std.close(context)
        const len1 = inputCallback(0)
        const len2 = inputCallback(1)
        const len3 = inputCallback(2)

        const value1 = PineJS.Std.sma(close, len1, context)
        const value2 = PineJS.Std.sma(close, len2, context)
        const value3 = PineJS.Std.sma(close, len3, context)

        return [
          { value: value1, offset: 0 },
          { value: value2, offset: 0 },
          { value: value3, offset: 0 }
        ]
      }
    }
  }
  return indicators
}

export default customerMovingAverage
```

## 五、主题与样式定制

### 5.1 主题配置

```typescript
// src/components/Tradingview/theme.ts
export const getTradingviewThemeCssVar = (theme: ThemeName) => {
  const primary = ThemeConst.primary
  const textPrimary = ThemeConst.textPrimary
  const isDark = theme === 'dark'

  return {
    '--tv-color-toolbar-button-text': '#7B7E80',
    '--tv-color-toolbar-button-text-active': textPrimary,
    '--tv-color-toolbar-button-text-active-hover': textPrimary,
    '--tv-color-toolbar-toggle-button-background-active': primary,
    '--tv-color-toolbar-toggle-button-background-active-hover': primary,
    '--tv-color-popup-element-text-active': '#131722',
    '--tv-color-popup-element-background-active': '#f0f3fa',
    ...(isDark ? { '--tv-color-pane-background': ThemeConst.black } : {})
  }
}
```

### 5.2 K线颜色与涨跌色设置

```typescript
// src/components/Tradingview/widgetMethods.ts
export type ColorType = 1 | 2 // 1绿涨红跌 2红涨绿跌

export function setChartStyleProperties(props: { colorType: ColorType; tvWidget: IChartingLibraryWidget }) {
  const { colorType, tvWidget } = props
  const red = ThemeConst.red // #C54747
  const green = ThemeConst.green // #45A48A

  let upColor = Number(colorType) === 2 ? red : green
  let downColor = Number(colorType) === 2 ? green : red

  // 蜡烛图样式
  tvWidget.chart().getSeries().setChartStyleProperties(1, {
    upColor,
    downColor,
    wickUpColor: upColor,
    wickDownColor: downColor,
    borderUpColor: upColor,
    borderDownColor: downColor
  })

  // 空心蜡烛图样式
  tvWidget.chart().getSeries().setChartStyleProperties(9, {
    upColor,
    downColor,
    wickUpColor: upColor,
    wickDownColor: downColor,
    borderUpColor: upColor,
    borderDownColor: downColor
  })
}
```

## 六、性能优化策略

### 6.1 数据加载优化

```typescript
// 1. 按需加载历史数据
getHttpHistoryBars = async (symbolInfo, resolution, from, to, countBack, firstDataRequest) => {
  const size = document.documentElement.clientWidth >= 1200 ? 500 : 200
  // 根据屏幕宽度调整加载数量，移动端减少请求数据量
}

// 2. 数据缓存策略
@action
getDataFeedBarCallback = (obj = {}) => {
  const { firstDataRequest } = obj

  if (firstDataRequest) {
    // 首次请求完整数据
    this.getHttpHistoryBars(symbolInfo, resolution, from, to, countBack, true)
  } else {
    // 后续请求只获取增量数据
    this.getHttpHistoryBars(symbolInfo, resolution, from, this.lastBarTime, countBack, false)
  }
}
```

### 6.2 WebSocket 连接优化

```typescript
// 使用 reconnecting-websocket 实现自动重连
this.socket = new ReconnectingWebSocket(wsUrl, ['WebSocket', token], {
  minReconnectionDelay: 1,
  connectionTimeout: 3000,
  maxEnqueuedMessages: 0,
  maxRetries: 10000
})

// 心跳保活
startHeartbeat() {
  this.heartbeatInterval = setInterval(() => {
    this.send({}, { msgId: 'heartbeat' })
  }, 20000)
}
```

### 6.3 图表渲染优化

```typescript
// 1. 使用 loading 状态避免闪烁
const [loading, setLoading] = useState(true)
setTimeout(() => {
  setLoading(false)
}, 200)

// 2. 延迟初始化避免阻塞
useEffect(() => {
  // 延迟加载图表
  setTimeout(() => {
    const tvWidget = new widget(widgetOptions)
  }, 100)
}, [])

// 3. 缓存主题配置
const defaultBgColor = theme === 'dark' ? ThemeConst.black : ThemeConst.white
if (theme && defaultBgColor !== STORAGE_GET_CHART_PROPS('paneProperties.background')) {
  STORAGE_REMOVE_CHART_PROPS()
}
```

### 6.4 内存管理与清理

```typescript
useEffect(() => {
  return () => {
    // 组件卸载时清理
    tvWidget.remove() // 销毁图表实例
    mitt.off('symbol_change') // 取消事件订阅
    this.stopHeartbeat() // 停止心跳
    this.socket?.close() // 关闭 WebSocket
  }
}, [])
```

## 七、常见问题与解决方案

### 7.1 主题切换不生效

```typescript
// 问题：切换主题后图表颜色不变
// 解决：清除本地缓存 + 动态调用 changeTheme

// 1. 切换主题时清除缓存
STORAGE_REMOVE_CHART_PROPS()

// 2. 动态切换主题
tvWidget.changeTheme(theme)

// 3. 设置 CSS 变量
setCSSCustomProperty({ tvWidget, theme })
```

### 7.2 数据请求重复

```typescript
// 问题：多次调用 getBars
// 解决：使用 lastBarTime 缓存截止时间

this.lastBarTime = bars[0]?.time / 1000
if (this.lastBarTime === bars[0]?.time / 1000) {
  this.datafeedBarCallbackObj.onHistoryCallback([], { noData: true })
}
```

### 7.3 移动端适配

```typescript
// 移动端禁用多余功能
if (props.isMobile) {
  disabled_features.push('header_symbol_search', 'context_menus', 'show_chart_property_page', 'header_screenshot', 'left_toolbar')
}

// 禁止双指缩放
document.body.addEventListener(
  'touchstart',
  (e) => {
    if (e.touches.length > 1) {
      e.preventDefault()
    }
  },
  { passive: false }
)
```

## 八、完整调用示例

```tsx
// src/pages/index.tsx
import Tradingview from '@/components/Tradingview'

export default function ChartPage() {
  return (
    <div>
      <Tradingview />
    </div>
  )
}
```

URL 参数说明：

- `symbolName`: 交易品种，如 BTCUSDT
- `theme`: 主题，light 或 dark
- `locale`: 语言，如 en、zh_TW
- `colorType`: 涨跌颜色，1 绿涨红跌，2 红涨绿跌
- `chartType`: 图表类型，1 蜡烛图、2 折线图等

## 总结

本文详细讲解了 Next.js 项目中接入 TradingView 图表的完整方案，涵盖了：

1. **环境配置**：类型定义、目录结构
2. **核心实现**：主组件、Datafeed、配置选项
3. **数据交互**：HTTP 历史数据 + WebSocket 实时更新
4. **自定义开发**：自定义指标、主题定制
5. **性能优化**：数据加载、WebSocket、渲染优化、内存管理
6. **常见问题**：主题切换、数据重复、移动端适配

通过以上方案，可以在 Next.js 项目中快速构建专业的金融图表应用。如需更高级的功能（如图表保存加载、自定义交易品种等），可以参考 [TradingView 官方文档](https://www.tradingview.com/charting-library-docs/latest/getting_started/)。
