---
title: 真机调试 WebView 看不到 iOS Safari 与 Android Chrome 远程调试完整指南
description: 一份 iOS + Android 真机 WebView 调试的踩坑实录。iOS 侧讲透 16.4 起 WKWebView isInspectable 默认关闭、react-native-webview 的 webviewDebuggingEnabled 与 __DEV__ 陷阱、设备端网页检查器开关、Safari 开发菜单；Android 侧用 chrome://inspect 完整走一遍真机连接、设备列表、inspect 进 DevTools 的全流程，附两端差异对照、Release 包临时开调安全红线，以及 TradingView 这类 file:// 本地内容的调试技巧。
date: 2026-05-31 10:32:40
tags:
  - iOS
  - Android
  - WebView
  - Safari
  - Chrome DevTools
  - React Native
  - 调试技巧
categories: Front-End
---

混合开发里，`WebView` 是个又爱又恨的东西：它让你能把一套 `H5`、一张 `TradingView` 图表、一段第三方页面塞进原生 `App` 里复用，但一旦它出问题，你想看看里面的 `console`、`DOM`、网络请求，麻烦就来了。更糟的是，`iOS` 和 `Android` 两端的「真机调 WebView」入口、开关、坑点**各不相同**——`iOS` 走 `Safari` 网页检查器，`Android` 走 `Chrome` 的 `chrome://inspect`，一边的经验搬到另一边经常水土不服。

最近我在一个 `React Native` 股票项目里调 `K` 线详情页——这页用 `react-native-webview` 加载了一份本地打包的 `TradingView Charting Library`。我把 `iPhone` 真机连上 `Mac`，打开 `Safari` 的「开发」菜单，想连进 `WebView` 看图表里的报错，结果**设备子菜单下空空如也，那个 WebView 死活不出现**；换到 `Android` 真机用 `chrome://inspect` 时，又卡在「列表空白 / DevTools 加载不出来」。

![Safari 开发菜单里选中真机后，「在设备上启用网页检查器」按钮置灰，App 内的 WKWebView 没有出现在列表里](https://s.poetries.top/uploads/2026/05/eaef641d60be7371.png)

第一反应是「WebView 没加载成功吧？」——但页面上图表明明渲染出来了，`onLoadEnd` 也回调了。折腾一圈后发现，这根本不是加载问题：`iOS` 侧是 `16.4` 起 `WebKit` 的一个**默认行为变更**叠加了 `Debug / Release` 构建的差异；`Android` 侧则是调试开关、`USB` 调试、`chrome://inspect` 资源拉取三处任一没到位。这篇文章把 **iOS（Safari Web Inspector）+ Android（chrome://inspect）两端**的排查链路和最终的「可复制检查清单」完整复盘，对任何在原生里嵌 `WebView`（`TradingView`、`H5` 活动页、内嵌文档、第三方 `SDK` 页面）的场景都通用。

在本篇文章中，我们将从浅入深，一起搞定以下内容：

- 为什么「WebView 加载成功」和「调试器能看到它」是两回事（两端通用的认知）
- `iOS 16.4` 的关键变更：`WKWebView` 的 `isInspectable` 默认变成了 `false`
- `react-native-webview` 的 `webviewDebuggingEnabled` 一行抹平双端差异
- `__DEV__` 陷阱：为什么你的 `TestFlight / Release` 包永远连不上
- `iOS` 端设备网页检查器开关、`Safari` 开发菜单、一张真机检查清单
- **`Android` 端 `chrome://inspect` 真机调试完整流程（含 DevTools 实操截图）**
- `iOS` 与 `Android` 调试入口、开关、坑点的逐项对照
- 临时给 `Release` 包开调试的正确姿势与安全红线
- 进阶：怎么调 `file://` 本地加载的 `TradingView` 图表

## 一、先分清两个独立的事实

排查这类问题，最容易掉的坑是把两件不相干的事混在一起，**iOS 和 Android 都一样**：

1. **WebView 有没有把内容加载出来**——这是 `App` 内部的事，看 `onLoadEnd` / `onError` 回调、看页面有没有渲染就知道。
2. **调试器（Safari / Chrome）能不能连进这个 WebView**——这是底层引擎「**是否允许被远程检查**」的开关，跟加载成不成功**完全无关**。

我一开始就栽在这：图表渲染出来了 → 我默认「加载成功 = 应该能被调试器看到」。但这两件事在现代 `WebView` 里被彻底解耦了。一个加载得好好的 `WebView`，只要它的「可检查」开关是关的（`iOS` 的 `isInspectable=false` / `Android` 的 `setWebContentsDebuggingEnabled(false)`），调试器里就**永远不会列出它**，哪怕你真机连得再对。

所以正确的排查顺序是：**先确认 WebView 允许被检查，再去折腾连接链路**。顺序反了，你会在「检查数据线、重插 USB、重启调试器」上浪费一下午。

## 二、iOS 16.4 的关键变更：isInspectable 默认关了

这是 `iOS` 侧整件事的根因，也是最容易被老经验坑到的地方。

`iOS 16.3` 及更早：只要 `App` 是 `Debug`（开发签名）构建，里面所有的 `WKWebView` / `SFSafariViewController` **默认就能被 Safari 网页检查器连上**，你不需要写任何额外代码。很多人「以前真机调 WebView 一直好好的」就是吃了这个默认红利。

从 **`iOS 16.4` / `iPadOS 16.4` / `macOS 13.3`** 开始，`Apple` 在 `WKWebView` 上加了一个新属性 `isInspectable`（`Objective-C` 里是 `inspectable`），并且**默认值是 `false`**。也就是说：

> 从 iOS 16.4 起，任何 WKWebView 默认都不可被检查。无论 Debug 还是 Release，你必须显式把 `webView.isInspectable = true`，Safari 的开发菜单才会列出它。

官方原文档对应的说法是：

```objc
// iOS 16.4+ / macOS 13.3+
// 默认 NO，必须显式打开才能被 Web Inspector 连接
webView.inspectable = YES;
```

```swift
// Swift
if #available(iOS 16.4, *) {
    webView.isInspectable = true
}
```

这个改动的动机是安全：上架的 `App` 里如果 `WebView` 默认可被检查，意味着任何能物理接触设备的人都能撬开你的内嵌页面看逻辑、改 `DOM`。所以 `Apple` 把它改成了「默认关、按需开」。

代价就是：**所有「以前能调、升级系统后突然调不了」的 WebView，根本原因都在这一行**。`Android` 没有这个系统级「默认关」的变更，但它也有自己的等价开关（见下一节）。

## 三、react-native-webview 里对应的开关：webviewDebuggingEnabled

如果你用的是 `react-native-webview`，你不需要去原生层分别手写 `isInspectable` 和 `setWebContentsDebuggingEnabled`，库已经封装好了一个跨端 `prop`：

```tsx
<WebView
  source={{ uri: 'https://example.com' }}
  // ✅ 关键开关：iOS 映射到 isInspectable，Android 映射到 setWebContentsDebuggingEnabled
  webviewDebuggingEnabled={true}
/>
```

`webviewDebuggingEnabled` 是 `react-native-webview` **13.x 起**新增的跨端 `prop`，它在内部：

- **iOS**：当系统 `≥ 16.4` 时，把底层 `WKWebView.isInspectable` 设成你传的值；
- **Android**：调 `WebView.setWebContentsDebuggingEnabled(...)`，决定 `chrome://inspect` 能不能看到它。

一行 `prop` 抹平了双端差异，这也是为什么我建议混合开发优先用 `react-native-webview` 而不是自己包原生 `WKWebView` / `android.webkit.WebView`——这些系统版本相关的坑库都替你填了。

## 四、__DEV__ 陷阱：为什么你的 Release 包永远连不上

我那个项目里，`WebView` 其实**已经写了这个开关**，长这样：

```tsx
<WebView
  ref={webviewRef}
  source={{ html: TRADINGVIEW_HTML, baseUrl: TRADINGVIEW_BASE_URL }}
  javaScriptEnabled
  domStorageEnabled
  // 👇 注意这里：只在 __DEV__ 为 true 时才开
  webviewDebuggingEnabled={__DEV__}
  onMessage={handleMessage}
/>
```

`webviewDebuggingEnabled={__DEV__}` 是个很常见、也很合理的写法——开发包能调，上架包自动关掉以防泄漏。但它埋了一个非常隐蔽的陷阱，而且**双端都中招**：

`__DEV__` 是 `React Native` 的全局编译期常量，它的值取决于**你打的是什么包**：

| 构建方式 | `__DEV__` | WebView 可检查吗 |
|---|---|---|
| `yarn ios` / `yarn android` / Metro Debug 包 / `Debug` scheme | `true` | ✅ 能 |
| `Release` 包 / `Archive` / `TestFlight` / `release` apk / 上架包 | `false` | ❌ **永远不能** |

所以如果你装到真机上的是一个 **`Release` 包**（比如同事甩给你的 `ipa` / `apk`、`TestFlight` 内测包、或者你自己手滑跑了 `Release` scheme），`__DEV__` 就是 `false`，`isInspectable` / `setWebContentsDebuggingEnabled` 跟着是 `false`，`Safari` 或 `Chrome` 里**怎么都不会出现这个 WebView**——而且没有任何报错提示你「因为是 Release 包所以关了」。

**这是排查的第一刀**：先确认你手机上跑的到底是 Debug 还是 Release 包。最快的判断方式：

- 是不是连着 `Metro`（终端有 `bundling` 日志）？连着基本就是 `Debug`。
- 摇一摇 / `Cmd+D`（iOS）/ `Cmd+M`（Android）能不能弹出 `RN` 的开发菜单？能弹就是 `Debug`。
- `Xcode` 看当前 scheme 的 `Build Configuration`；`Android` 看装的是 `app-debug.apk` 还是 `app-release.apk`。

如果是 `Release` 包，先换成 `Debug` 包，别在 `Release` 包上死磕。

## 五、iOS 设备端那个置灰的开关：网页检查器

确认是 `Debug` 包、`webviewDebuggingEnabled` 也为 `true` 之后，如果 `Safari` 里还是看不到，那就是**设备本身没开网页检查器**。

回头看文章开头那张图——`Safari`「开发」菜单里选中 `iPhone` 后，有一行**置灰的「在设备上启用网页检查器」**。这行灰字不是 `bug`，它是在提示你：这台设备的网页检查器开关还没打开，请去 `iPhone` 设置里开。

路径（`iOS 18` / `iOS 26` 新版设置 `App` 重构后）：

```
设置 → 应用 → Safari 浏览器 → 高级 → 网页检查器  → 打开
```

旧版 `iOS` 路径：

```
设置 → Safari 浏览器 → 高级 → 网页检查器 → 打开
```

打开之后，回到 `Mac` 的 `Safari`「开发」菜单，那行灰字会变成可点，设备子菜单下才会开始列出 `App` 内允许被检查的 `WebView`。

> 小坑：有些版本第一次打开后需要把数据线**重插一次**、或者把手机**锁屏再解锁**，列表才会刷新出来。

## 六、iOS Mac 端别忘了开「开发」菜单

这一步大部分人早就开过了，但为了清单完整还是列一下。`Safari` 的「开发」菜单默认是隐藏的：

```
Safari → 设置（偏好设置）→ 高级 → 勾选「在菜单栏中显示『开发』菜单」
```

勾上之后菜单栏才会出现「开发」。另外真机第一次连 `Mac`，手机上会弹「**是否信任此电脑**」，必须点**信任**并输入锁屏密码，否则 `Mac` 根本枚举不到这台设备。

## 七、一张可复制的 iOS 真机 WebView 调试检查清单

把上面的排查顺序固化成一张清单，下次再遇到「iOS WebView 看不到」直接照着过一遍，从最容易被忽略的开始：

1. **包类型**：手机上跑的是 `Debug` 包吗？（连着 `Metro` / 能弹 `RN` 开发菜单）`Release` 包直接出局，先换 `Debug`。
2. **WebView 开关**：`webviewDebuggingEnabled` 是 `true` 吗？如果写的是 `={__DEV__}`，确认当前 `__DEV__` 真的是 `true`。原生 `WKWebView` 则确认 `isInspectable = true`（`iOS 16.4+`）。
3. **设备端开关**：`iPhone` 设置 → Safari → 高级 → 网页检查器，**打开**。
4. **信任电脑**：数据线连上后，手机弹窗点了「信任」。
5. **Mac 端菜单**：`Safari` 设置 → 高级 → 勾选「显示开发菜单」。
6. **页面在前台**：要被检查的 `WebView` 所在页面得**正停留在前台**——退到后台或被回收的 `WebView` 不会出现在列表里。让 `K` 线页 / `H5` 页保持打开。
7. **刷新列表**：还是没有？重插数据线、锁屏再解锁、或退出重进 `Safari` 开发菜单。

我那次的实际情况是：第 1 条（其实是 `Debug` 包，`__DEV__` 没问题）排除后，卡在第 3 条——**设备端网页检查器没开**。开了之后 `WebView` 立刻就出现在列表里了。

## 八、Android 真机调试：chrome://inspect 完整流程

`Android` 没有 `Safari` 那套「开发菜单」，它的真机 `WebView` 调试统一走 `Chrome` 浏览器自带的 `chrome://inspect`。原理和 `iOS` 一样（先开「可检查」开关，再连真机），但工具链和坑点完全不同。下面一步步走完整个流程。

### 8.1 第一步：打开 WebView 的调试开关

和 `iOS` 一样，先让这个 `WebView` 允许被远程检查。`react-native-webview` 仍然是那个跨端 `prop`：

```tsx
<WebView
  source={{ uri: 'https://example.com' }}
  webviewDebuggingEnabled={true}  // Android 内部映射到 setWebContentsDebuggingEnabled
/>
```

原生 `Android`（`Kotlin` / `Java`）则在 `Application` 或 `WebView` 初始化处调一次静态方法（注意它是**进程级**的，对该进程内所有 `WebView` 生效）：

```kotlin
// Application.onCreate() 或 WebView 创建前
if (BuildConfig.DEBUG) {
    WebView.setWebContentsDebuggingEnabled(true)
}
```

和 `iOS` 的差异点先记住：`Android` **没有** `iOS 16.4` 那种系统级「默认关」的变更，可不可检查**完全由 `setWebContentsDebuggingEnabled` / `webviewDebuggingEnabled` 这一个开关控制**——你不用关心系统版本，只用关心这行有没有被执行到（同样别忘了 `__DEV__` / `BuildConfig.DEBUG` 陷阱）。

### 8.2 第二步：手机开启 USB 调试

`chrome://inspect` 走的是 `adb`（`Android Debug Bridge`）那一套，所以真机必须打开开发者选项里的 `USB` 调试：

```
设置 → 关于手机 → 连续点「版本号」7 次  →  开启开发者选项
设置 → 系统 → 开发者选项 → 打开「USB 调试」
```

然后用数据线把手机连上电脑，手机会弹一个「**是否允许 USB 调试**」的对话框，勾上「一律允许使用这台计算机进行调试」再点**确定**。这一步等价于 `iOS` 的「信任此电脑」——不点确定，电脑枚举不到设备。

> 国产 `ROM`（`MIUI` / `ColorOS` / `Funtouch OS` 等）有时还有一个额外的「**USB 安装 / USB 调试（安全设置）**」开关，藏得比较深，连不上设备时回来翻一遍开发者选项里所有带 `USB` 的项。

### 8.3 第三步：电脑 Chrome 打开 chrome://inspect

在**电脑端**的 `Chrome`（或基于 `Chromium` 的 `Edge`）地址栏输入：

```
chrome://inspect/#devices
```

勾上 **`Discover USB devices`**。如果前两步都到位，下面的 `Remote Target` 区域就会列出你的真机，以及该 `App` 进程里所有**允许被检查**的 `WebView`：

![Chrome 的 chrome://inspect/#devices 页面，勾选 Discover USB devices 后，Remote Target 下列出了 vivo X20 真机里 App 的 WebView，红色箭头指向每个 WebView 后面的 inspect 入口](https://s.poetries.top/uploads/2026/05/76f08d6d6e082438.jpg)

如上图，设备名（这里是 `vivo X20`）下面会列出每一个可检查的 `WebView`，标题通常是 `WebView in <你的包名>`，后面跟着内核版本号（图里是 `62.0.3202.84`）。每个 `WebView` 条目下都有一排操作链接：`inspect` / `pause` / `inspect fallback`。**点 `inspect`**，就会弹出一个独立的 `Chrome DevTools` 窗口连进这个 `WebView`。

> 注意截图里两个细节：
> - 上面的 `localhost:9222` 那一组是「网络转发目标」，跟真机 `USB` 调试无关，别看错行；真机的 `WebView` 在 `vivo X20` 那一组下。
> - `WebView` 标题里的内核版本号（`62.0.3202.84`）就是这个 `WebView` 实际用的 `Chromium` 内核。它由系统 `WebView` 组件 / `App` 内置内核决定，**和你电脑上的 Chrome 版本无关**，排查渲染兼容性时这个号很关键。

### 8.4 第四步：在 DevTools 里调试

点 `inspect` 之后，会弹出一个完整的 `Chrome DevTools`，左侧是真机 `WebView` 的实时镜像画面，右侧就是你熟悉的「元素 / 控制台 / 网络 / 源代码 / 性能 / 内存 / 应用」全套面板：

![点击 inspect 后弹出的 Chrome DevTools，左侧是真机 WebView 的实时画面，右侧是网络（Network）面板，工具栏可见保留日志、停用缓存、节流模式等选项，可以像调普通网页一样审查这个真机里的 WebView](https://s.poetries.top/uploads/2026/05/acba5543c96babea.jpg)

到这一步，调真机 `WebView` 和调电脑上一个普通网页**没有任何区别**：

- **元素 / 控制台**：实时看 `DOM`、改样式、在 `Console` 里执行 `JS` 读 `window` 上的对象。
- **网络**：抓 `WebView` 里发出的所有请求（图里就是网络面板），勾上「保留日志」防止跳转后清空，勾「停用缓存」强制走网络，还能用「节流模式」模拟弱网。
- **源代码 / 来源**：给 `WebView` 里的脚本打断点、单步调试。
- 左侧镜像画面**可直接用鼠标点**，操作会同步到真机上，反之亦然。

体验上 `Android` 这套甚至比 `iOS` 的 `Safari` 网页检查器还顺手——毕竟就是你天天用的 `Chrome DevTools`。

### 8.5 Android 端常见坑

- **`chrome://inspect` 列表空白**：八成是 `8.1` 的调试开关没开（`Release` 包 / 忘了 `setWebContentsDebuggingEnabled`），或 `8.2` 的 `USB` 调试没授权。先回这两步核对。
- **点 `inspect` 后 DevTools 一直白屏 / 转圈**：`chrome://inspect` 的 `DevTools` 前端资源默认从 `Google` 的服务器（`chrome-devtools-frontend.appspot.com`）拉取，**国内网络经常拉不到**导致白屏。两个解法：① 科学上网；② 点条目里的 **`inspect fallback`**（截图里那个），它用本地内置的旧版 `DevTools` 前端，不依赖外网，**断网也能用**，这也是国内调 `Android WebView` 最实用的一招。
- **设备列出来了但没有 WebView 条目**：确认要调的页面**正在前台**，且这个 `WebView` 真的初始化了（懒加载的 `WebView` 没创建时不会出现）。
- **完全枚举不到设备**：多半是 `adb` / `USB` 驱动问题。`adb devices` 看能不能列出设备；`Windows` 下常要装对应手机厂商的 `USB` 驱动；换一根**支持数据传输**的线（很多线只能充电）。
- **内核太老**：截图里那个 `62.0.3202.84` 已经很老了，老内核的 `DevTools` 功能受限、也可能复现一些只在旧 `Chromium` 上出现的 `bug`——这恰恰是真机调试的价值，能看到用户实际内核下的真实表现。

## 九、iOS 与 Android 调试对照表

把两端的差异拉出来横向对比，避免拿一边的经验硬套另一边：

| 维度 | iOS | Android |
|------|-----|---------|
| 调试器 | `Safari` 网页检查器（开发菜单）| `Chrome` 的 `chrome://inspect` |
| 底层「可检查」开关 | `WKWebView.isInspectable`（`iOS 16.4+` 默认 `false`）| `WebView.setWebContentsDebuggingEnabled`（无系统默认值变更）|
| RN 统一开关 | `webviewDebuggingEnabled`（映射 `isInspectable`）| `webviewDebuggingEnabled`（映射 `setWebContentsDebuggingEnabled`）|
| 系统级「默认关」变更 | ✅ `iOS 16.4` 起默认不可检查 | ❌ 无，全靠代码开关 |
| 设备端额外开关 | 设置 → Safari → 高级 → 网页检查器 | 开发者选项 → USB 调试 |
| 电脑端授权 | 手机弹「信任此电脑」 | 手机弹「允许 USB 调试」 |
| 连接传输 | `usbmuxd`（Safari 直接枚举）| `adb`（`chrome://inspect` 走它）|
| 常见白屏坑 | 列表不刷新（重插线 / 锁屏）| DevTools 前端拉不到（用 `inspect fallback` 兜底）|
| 内核 | `WebKit`（随系统）| `Chromium`（随系统 WebView 组件 / App 内核，版本独立）|

一句话记忆：**两端都先开「可检查」开关 + 设备端调试授权，再连调试器**；`iOS` 多一道 `16.4` 的系统默认坑，`Android` 多一道国内网络拉不到 `DevTools` 前端的坑。

## 十、临时给 Release 包开调试：可以，但有红线

有时候你就是得调一个 `Release` 包——比如只有内测包能复现的 `bug`、或者要看生产环境配置下 `WebView` 的真实表现。这时候可以**临时**把开关从 `__DEV__` 解绑（`iOS` / `Android` 同理）：

```tsx
// ⚠️ 临时调试用，调完必须改回 __DEV__
<WebView
  webviewDebuggingEnabled={true}
  // ...
/>
```

但这里有几条**安全红线**，两端务必都守住：

- **绝不能把 `webviewDebuggingEnabled={true}`（或 `isInspectable = true` / `setWebContentsDebuggingEnabled(true)`）的代码合进主干 / 发上架包**。上架包里 `WebView` 可被检查，等于把内嵌页面的逻辑、`token`、接口结构全部暴露给任何能接触设备的人——`Android` 上更危险，因为 `adb` 接入门槛比 `iOS` 更低。
- 调完**立刻改回** `={__DEV__}`，并且 `code review` 时把它当成 `P0` 卡点——这类「临时开关忘了关」是最典型的线上安全事故来源。
- 如果团队经常要调 `Release`，更稳的做法是引入一个独立的构建变体（`iOS` 的 `Staging` scheme / `Android` 的 `buildType` / `productFlavor`），用它自己的 `BuildConfig` flag 控制，而不是去动 `Release` 的行为。

一句话：**调试便利和上架安全是一对反向需求，开关的归属一定要让「上架包默认关」成为不可绕过的默认值。**

## 十一、进阶：调 file:// 本地加载的 TradingView

回到我最初的场景——`TradingView` 不是从 `http` 加载的，而是从 `App` 包内的 `file://` 路径加载本地打包的图表库，`iOS` 和 `Android` 各有各的本地路径：

```tsx
const TRADINGVIEW_BASE_URL =
  Platform.OS === 'ios'
    ? `file://${RNFS.MainBundlePath}/Tradingview.bundle/`
    : 'file:///android_asset/Tradingview.bundle/'

<WebView
  source={{ html: TRADINGVIEW_HTML, baseUrl: TRADINGVIEW_BASE_URL }}
  allowFileAccess
  allowFileAccessFromFileURLs
  allowUniversalAccessFromFileURLs
  webviewDebuggingEnabled={__DEV__}
/>
```

一旦按上面的清单把 `WebView` 连进了 `Safari` 网页检查器（iOS）或 `Chrome DevTools`（Android），调 `file://` 加载的内容和调普通网页**没有任何区别**，你能拿到完整能力：

- **Console**：直接看图表库的报错、`postMessage` 桥接日志，比在 `RN` 侧 `onMessage` 里打 `log` 直观一万倍。
- **Sources / 源代码**：断点调 `TradingView` 的初始化、`resolveSymbol`、数据回调，看注入参数对不对。
- **Network / 网络**：看图表去拉历史 `K` 线、订阅实时行情的请求有没有发出、返回了什么——`file://` 页面里发起的 `http` 请求一样能抓。
- **Console 里直接执行 JS**：在调试器的 `Console` 输入 `window.xxx` 直接读图表实例状态、手动触发 `setSymbol`，验证桥接逻辑。

这才是调内嵌 `WebView` 真正的价值——你不用反复改 `RN` 代码、重新打包、再 `onMessage` 回传，而是像调一个普通网页一样，在里面随便点、随便看、随便断点。

## 总结

「WebView 加载了但调试器看不到」这个问题，看着玄学，根因其实就一条链路，`iOS` 和 `Android` 两端按优先级排：

1. **是不是 Release 包** → `__DEV__` / `BuildConfig.DEBUG` 为 `false` 导致 `webviewDebuggingEnabled` 关闭（最隐蔽，先查这条，两端通用）。
2. **可检查开关没开** → `iOS` 显式 `isInspectable = true`（注意 `16.4+` 默认关）；`Android` 显式 `setWebContentsDebuggingEnabled(true)`。
3. **设备端调试没授权** → `iOS` 是设置 → Safari → 高级 → 网页检查器；`Android` 是开发者选项 → USB 调试。
4. **连接 / 前端链路** → `iOS` 信任电脑 + 开发菜单 + 页面前台；`Android` 用 `chrome://inspect`，白屏时点 `inspect fallback` 兜底。

把这套清单固化下来，以后真机调 `WebView`、`H5`、`TradingView`——不管 `iOS` 还是 `Android`——再也不用从头猜。这套技巧在混合开发里出场率极高，`App` 里只要有内嵌网页，迟早会两端都用到它。

> 配套提醒：`webviewDebuggingEnabled={true}` 的临时开关调完一定要改回 `{__DEV__}`，别让它跟着上架包出门——`Android` 上尤其危险。
