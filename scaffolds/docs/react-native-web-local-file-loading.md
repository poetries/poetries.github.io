---
title: React Native + Web 本地文件加载方案与踩坑总结
date: 2026-02-10 14:40:12
description: 总结 React Native 中加载本地 Web 静态资源的完整方案，包括 Next.js 打包配置、RN 集成步骤、通信机制实现等核心内容。
tags:
- React Native
- WebView
- 本地加载
- 混合开发
categories: Front-End
---

## 导语

在 React Native 项目中加载 Web 页面时，如果直接使用网络 URL，不仅需要等待资源加载，还可能面临网络不稳定导致的页面空白问题。将 Web 资源打包到 App 本地，可以实现**秒开体验**，大幅提升用户体验。

本文总结了在 React Native 中加载本地 Web 静态资源的完整方案，包含打包配置、RN 集成、RN 与 Web 通信等核心内容。

## 一、Next.js 打包配置

### 1.1 打包命令

首先需要修改 `package.json` 中的打包命令：

```json
"build:app": "cross-env APP_MODE=1 next build && sh ./scripts/buildAfter.sh"
```

### 1.2 构建后处理脚本

创建 `scripts/buildAfter.sh` 脚本，处理构建产物：

```bash
cd dist

# 重命名，避免在安卓端加载不出来
mv ./_next ./next

# 替换代码中的 _next 为 next
grep -rli '_next' * | xargs -I@ sed -i '' 's/_next/next/g' @
```

**为什么要重命名？**

在安卓端，`assets` 目录下的文件以下划线开头可能会导致加载失败。将 `_next` 重命名为 `next` 可以避免这个问题。

## 二、Next.js 端接收数据

### 2.1 获取注入参数

通过 `window.injectParams` 获取 React Native WebView 注入的参数：

```javascript
// 获取 react-native webview 注入的 window.injectParams 参数
export const getInjectParams = () => {
  const query = typeof window !== 'undefined' ? window?.injectParams || {} : {}
  return query as InjectParams
}
```

### 2.2 监听 RN 消息

实现 RN 与 Web 双向通信，接收来自 RN 的消息：

```javascript
useEffect(() => {
  if (process.env.APP_MODE !== '1') return

  const messageHandler = (e: any) => {
    const data = e?.data ? JSON.parse(e?.data) : undefined
    const type = data?.type // 消息类型
    const payload = data?.payload // 消息内容

    // 处理行情同步
    if (type === 'syncQuote') {
      ws.syncUpdateRNKlineData(payload)
    }

    // 处理品种切换
    if (type === 'changeSymbol' && payload?.symbol) {
      stores.global.setSymbolInfo(payload)
      stores.ws.lastbar = {} // 重置上一根 K 线
      mitt.emit('symbol_change')

      const symbolName = payload?.symbol
      setTimeout(() => {
        if (ws.tvWidget) {
          ws.tvWidget.onChartReady(() => {
            ws.tvWidget.activeChart().resetData()
            ws.tvWidget.activeChart().setSymbol(symbolName, {
              dataReady: () => {
                console.log('切换品种成功')
              }
            })
          })
        }
      }, 100)
    }
  }

  // iOS 使用 window 监听，Android 使用 document 监听
  if (isAndroid) {
    document.addEventListener('message', messageHandler)
  } else {
    window.addEventListener('message', messageHandler)
  }

  return () => {
    if (isAndroid) {
      document.removeEventListener('message', messageHandler)
    } else {
      window.removeEventListener('message', messageHandler)
    }
  }
}, [])
```

## 三、集成到 React Native

### 3.1 Android 配置

修改 `android/app/build.gradle`：

```javascript
android {
    sourceSets {
        main {
            // 把项目根目录 public 下的所有文件拷贝到安卓的 src/main/assets 目录下
            assets.srcDirs = ['src/main/assets', '../../app/public']
        }
    }
}
```

### 3.2 iOS 配置

将打包后的 bundle 文件添加到 Xcode 项目中：

![添加 Bundle 到 Xcode](https://s.poetries.top/uploads/2026/03/38493fce112c9f87.png)

![选择文件](https://s.poetries.top/uploads/2026/03/2867f4bd230557df.png)

![确认添加](https://s.poetries.top/uploads/2026/03/5c4f1b74f837df22.png)

### 3.3 WebView 组件实现

核心代码实现 RN 加载本地 Web 资源：

```tsx
import WebView from 'react-native-webview'

function Tradingview() {
  const webviewRefs = useRef<any>(null)
  const { symbol, dataSourceCode, dataSourceSymbol, accountGroupId } = useParams()
  const { theme, locale } = useTheme()

  // 本地 bundle 路径
  const sourceUri = Platform.OS === 'ios'
    ? 'Tradingview.bundle/index.html'
    : 'file:///android_asset/Tradingview.bundle/index.html'

  // 注入 JavaScript 参数
  const injectedJavaScript = `
    window.injectParams = {
      'symbolName': '${symbol}',
      'dataSourceCode': '${dataSourceCode}',
      'dataSourceSymbol': '${dataSourceSymbol}',
      'accountGroupId': '${accountGroupId}',
      'locale': '${locale}',
      'colorType': '${theme.direction + 1}',
      'token': '${token}',
      'baseUrl': '${baseUrl}',
      'wsUrl': '${wsUrl}',
      'symbolInfo': ${JSON.stringify(symbolInfo)},
      'debug': ${__DEV__},
      'watermarkLogoUrl': '${watermarkLogoUrl}',
    };
    true;
  `

  // 切换品种
  const switchSymbol = useCallback(() => {
    const message = JSON.stringify({
      type: 'changeSymbol',
      payload: getSymbolInfo()
    })
    webviewRefs?.current?.postMessage?.(message)
  }, [symbol])

  // 同步行情数据
  useEffect(() => {
    if (currentQuote) {
      const message = JSON.stringify({
        type: 'syncQuote',
        payload: currentQuote
      })
      webviewRefs?.current?.postMessage?.(message)
    }
  }, [currentQuote])

  return (
    <WebView
      source={{ uri: sourceUri }}
      injectedJavaScript={injectedJavaScript}
      javaScriptEnabled={true}
      allowFileAccess={true}
      allowFileAccessFromFileURLs={true}
      originWhitelist={['*']}
      scalesPageToFit={false}
      scrollEnabled={false}
      domStorageEnabled={true}
      mixedContentMode="always"
      onMessage={(event) => {
        // iOS 必须加上 onMessage 否则加载不出本地资源
        console.log('event.nativeEvent.data', event.nativeEvent.data)
      }}
    />
  )
}
```

### 3.4 应用前后台处理

处理 App 进入前台/后台时的逻辑：

```typescript
import useAppState from '@/hooks/useAppState'

const checkTradingviewReload = async () => {
  // 缓存时间大于 5 分钟，reload 整个实例
  const updateTime = await STORAGE_GET_TRADINGVIEW_RELOAD_TIME()
  if ((updateTime && Date.now() - updateTime > 5 * 60 * 1000) || !updateTime) {
    STORAGE_SET_TRADINGVIEW_RELOAD_TIME(Date.now())
    return true
  }
  return false
}

useAppState(
  async () => {
    // 应用回到前台
    const shouldReload = await checkTradingviewReload()
    if (shouldReload && webviewRefs?.current) {
      // 刷新整个 WebView，避免长时间不进入导致页面空白
      webviewRefs?.current?.reload?.()
    } else {
      // 不刷新页面，只切换品种
      switchSymbol()
    }
  },
  () => {
    // 应用进入后台
    STORAGE_SET_TRADINGVIEW_RELOAD_TIME(Date.now())
    // 清空缓存，否则绘制有问题
    ws.quotes = new Map()
  }
)
```

## 四、关键配置说明

### 4.1 WebView 重要属性

| 属性 | 说明 |
|------|------|
| `source.uri` | 本地资源路径（iOS/Android 不同） |
| `injectedJavaScript` | 注入 JS 参数到 Web 页面 |
| `javaScriptEnabled` | 启用 JavaScript |
| `allowFileAccess` | 允许通过 file:// 形式加载资源 |
| `scalesPageToFit` | 禁止页面缩放 |
| `domStorageEnabled` | 启用 DOM 存储 |
| `mixedContentMode` | 允许加载非 HTTPS 内容 |

### 4.2 RN 与 Web 通信方式

- **RN → Web**：通过 `postMessage` 发送消息，Web 端通过监听 `message` 事件接收
- **Web → RN**：Web 端调用 `window.ReactNativeWebView.postMessage()`，RN 端通过 `onMessage` 接收

## 五、实现效果

- 在 React Native 端加载 Web 静态资源可以做到**十几 MB 文件秒开**
- 完全不涉及网络请求，直接从本地加载
- 用户体验接近原生应用

## 六、常见问题

### 6.1 安卓端资源加载失败

- 检查 `assets.srcDirs` 配置是否正确
- 确保文件命名没有以下划线开头

### 6.2 iOS 白屏

- 确保 Bundle 文件已正确添加到 Xcode 项目
- 检查 `onMessage` 是否正确实现

### 6.3 长时间不进入页面空白

- 实现应用前后台监听，5 分钟以上重新加载 WebView

## 总结

本文详细总结了 React Native 加载本地 Web 静态资源的完整方案，包括：

1. **打包配置**：Next.js 构建命令和后处理脚本
2. **数据接收**：Web 端获取 RN 注入参数的实现
3. **RN 集成**：Android 和 iOS 的配置差异
4. **双向通信**：RN 与 Web 的消息传递机制
5. **性能优化**：应用前后台处理策略

通过以上方案，可以在 React Native 中实现 Web 资源的本地加载，提供流畅的用户体验。
