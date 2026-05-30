---
title: WebSocket高频行情渲染不卡顿-React Native解决手机发热掉帧与内存暴涨
description: 一份React Native高频行情列表的性能实战。从主线程51%与JS线程36%双饱和的真机trace出发，拆解四个永不停的CPU黑洞，给出按需订阅、per-symbol精准订阅、FlashList渲染稳定性、心跳边沿侦测四刀解法的完整脱敏代码，配实时入站帧率与GC监控面板。
date: 2026-05-30 16:20:36
tags:
  - RN
  - WebSocket
  - 性能优化
categories: Front-End
---

做股票行情类 `App` 绕不开一个场景：一屏列表里几十个品种，每个品种的买价、卖价、涨跌幅都在通过 `WebSocket` 长连接每秒推好几次，价格一变还要闪一下涨跌色。功能写出来不难，难的是用户停在行情页两分钟后开始抱怨：手机背面发烫、列表滑动一卡一卡、内存监控里数字只涨不回落。

我接手的那个项目最严重时，`iPhone 16 Pro Max` 的 `Release` 包在行情页**主线程 51%、JS 线程 36% 双线饱和**，`FPS` 在稳态期周期性掉到 `0~10`，虽然没触发系统热降频，但持续发烫已经成了投诉点。这篇文章把整个排查和优化过程完整复盘，所有代码已脱敏，核心是四刀解法——它们对任何"高频数据 + 长列表"的场景（行情、弹幕、IM、实时大屏）都通用。

在本篇文章中，我们将从浅入深，一起搞定以下内容：

- 高频行情渲染为什么会同时引发发热、掉帧、内存三个问题
- 用真机 `trace` 定位四个"永不停"的 `CPU` 黑洞
- 第一刀：按需订阅，只为可视区品种建立 `WebSocket` 订阅
- 第二刀：per-symbol 精准订阅，切断"心跳让全表 `rerender`"
- 第三刀：`FlashList` 渲染稳定性，让滑动复用链不断
- 第四刀：心跳降频 + 边沿侦测 + `AppState` 启停，杀掉后台空转
- 给 `App` 内置实时入站帧率、断连原因、`GC` 监控面板
- 用量化阈值表验收"优化到底有没有生效"

## 一、问题现场为什么三个症状一起来

发热、掉帧、内存暴涨看起来是三个问题，根子其实是同一个：**`CPU` 在被持续无意义地烧**。

`WebSocket` 把行情帧推到 `JS` 线程，每帧都要 `JSON.parse`、写状态、触发 `React` 重渲染、再走 `Fabric` 的 `ShadowTree commit` 和原生 `mount transaction`。这条链路里任何一环只要频率失控，就会：

- **发热**：`CPU` 长期高占用，芯片功耗上去了，热量自然来——`GC` 频繁、`mount transaction` 每秒几十次都是元凶。
- **掉帧**：主线程被 `mount transaction` 和 `clipping` 递归占满，渲染管线挤不进 `16ms` 一帧的预算，`FPS` 就塌了。
- **内存暴涨**：高频 `JSON.parse` 产生海量临时对象，`Hermes` 堆反复扩张；如果订阅没按需回收，可见区外的几百个品种状态还挂在内存里只涨不回落。

所以优化的总目标只有一句话：**让 `CPU` 只在"真的有价格变化、且这个品种用户真的看得到"的时候才干活，其余时间一律闲着。** 四刀解法全是围绕这句话展开的。

## 二、定位四个永不停的 CPU 黑洞

光说"`CPU` 高"没用，得拿真机 `Release` 包的 `Instruments` `trace` 把热点钉死。交叉审计 `trace` 关键字和源码后，我定位到四组"持续运行、永不停"的隐性黑洞：

**黑洞一：全局心跳定时器永不停。** 一个 `80ms`（`12.5Hz`）的全局 `setInterval`，模块加载就起、息屏后台都不停，每次都写一个 `SharedValue`，触发每个挂载过的行情文本组件的 `useDerivedValue worklet` 重算"价格新鲜度"。`trace` 里 `reanimated`+`worklet` 关键字 `inclusive` 累计 `207s`，是 `18.67s` 采样的绝对头部。

**黑洞二：`Fabric` mount transaction 每秒 66 次。** 每次 `commit` 都递归遍历整棵子视图树做 `clipping`（`updateClippedSubviewsWithClipRect` 主线程占 `17.2%`，递归 `30+` 层）。源头多半是黑洞一频繁写动画样式属性触发的 `ShadowTree commit`。

**黑洞三：把超大业务 store 当订阅源。** 行情单元格订阅了一个杂烩 `store`（订单、持仓、余额、设置几十个字段都在里面），结果任意业务字段写入（下单、切 tab、`HTTP` 刷新）都把全部可见单元格的 `selector` 同步跑一遍。`trace` 里 `Hermes` 解释器 `34s inclusive`。

**黑洞四：单元格视图层级太深 + 多层圆角裁剪。** `Pressable → View → View → ... → Icon` 嵌套 `8+` 层，每层 `rounded-xl` 都触发圆角图片绘制和 `clipping` 递归向更深扫描，把前三条的 `CPU` 成本进一步放大。

四条同时存在、叠加放大，导致**单独优化任何一条都看不出效果，必须一次性收口**。下面按 `ROI` 从高到低逐刀拆解，整体解法和收口效果先看这张全景图：

![WebSocket 高频行情渲染四刀解法全景：按需订阅、精准订阅、渲染稳定、心跳治理，收口后发热掉帧内存三症状一起消失](https://s.poetries.top/uploads/2026/05/628e9af35aa6293c.jpg)

## 三、第一刀按需订阅只为可视区建立订阅

最大的浪费是：列表里有几百个品种，但用户一屏只看得到十几个，却给全部品种都开了 `WebSocket` 订阅、全部都在接收推送、全部都在 `parse` 和写状态。

解法是「可视区订阅」：只为当前屏幕可见的品种 + 上下各 `5` 个缓冲建立订阅，滑出去的退订。`FlashList` 的 `onViewableItemsChanged` 给我们可见区索引，`debounce` 合并滚动过程中的高频回调：

```tsx
import type { ViewToken, ListRenderItemInfo } from '@shopify/flash-list'
import { useCallback, useRef } from 'react'
import { setVisibleSymbols, VISIBLE_BUFFER_RADIUS, VISIBLE_DEBOUNCE_MS } from '@/lib/ws'

function useVisibleSubscription(scopeKey: 'list' | 'modal', listRef: React.RefObject<Item[]>) {
  const lastIndicesRef = useRef<{ first: number; last: number }>({ first: -1, last: -1 })
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 把"可见区 ± buffer"的品种算出来，提交给订阅层 reconcile
  const flushVisible = useCallback((reason: string) => {
    const list = listRef.current
    const { first, last } = lastIndicesRef.current
    if (first < 0 || last < 0 || !list.length) {
      setVisibleSymbols(scopeKey, [], `${reason}:empty`)
      return
    }
    const lo = Math.max(0, first - VISIBLE_BUFFER_RADIUS)
    const hi = Math.min(list.length - 1, last + VISIBLE_BUFFER_RADIUS)
    const symbols: string[] = []
    for (let i = lo; i <= hi; i++) {
      const s = list[i]?.symbol
      if (s) symbols.push(s)
    }
    setVisibleSymbols(scopeKey, symbols, reason)
  }, [scopeKey, listRef])

  const onViewableItemsChanged = useCallback((info: { viewableItems: ViewToken<Item>[] }) => {
    const viewable = info.viewableItems
    if (!viewable.length) {
      lastIndicesRef.current = { first: -1, last: -1 }
    } else {
      let first = Infinity, last = -Infinity
      for (const v of viewable) {
        if (v.index == null) continue
        first = Math.min(first, v.index)
        last = Math.max(last, v.index)
      }
      if (!isFinite(first) || !isFinite(last)) return
      lastIndicesRef.current = { first, last }
    }
    // debounce：滚动中合并多次回调，停止 200ms 后再发 reconcile
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      flushVisible('viewable')
    }, VISIBLE_DEBOUNCE_MS)
  }, [flushVisible])

  return { onViewableItemsChanged, flushVisible }
}
```

光"算出该订阅哪些"还不够，真正发订阅 / 退订协议时还有两个工程问题：滚动来回会产生大量 `sub/unsub` 协议噪音；切 tab 瞬间会有短暂"全退又全订"。所以订阅层再加一个 `flush` 调度器做批量合并——订阅立即发、退订冷却 `5s` 后才发，冷却期内同一品种又滚回来就取消退订：

```ts
import { FLUSH_DEBOUNCE_MS, UNSUB_COOLDOWN_MS } from '../config' // 50ms / 5000ms

const pendingAdd = new Set<string>()          // 待订阅
const pendingRemove = new Map<string, number>() // 待退订 key → 入队时间戳
let flushTimer: ReturnType<typeof setTimeout> | null = null

/** 新订阅入队；若该品种正在 pendingRemove 冷却中，则取消退订（来回滚动不再抖动协议）。 */
export function enqueueAdds(keys: string[]) {
  for (const k of keys) { pendingAdd.add(k); pendingRemove.delete(k) }
}

/** 退订入队，冷却 UNSUB_COOLDOWN_MS 后才真正发包；保留原入队时间戳，避免反复滚动永远发不出 cancel。 */
export function enqueueRemoves(keys: string[]) {
  const now = Date.now()
  for (const k of keys) {
    pendingAdd.delete(k)
    if (!pendingRemove.has(k)) pendingRemove.set(k, now)
  }
}

export function scheduleFlush(delayMs = FLUSH_DEBOUNCE_MS) {
  if (flushTimer) return // 短时间内多次 reconcile 合并到一次发包
  flushTimer = setTimeout(() => { flushTimer = null; flush() }, delayMs)
}

function flush() {
  // 1. 立即发 subscribe
  const toSubscribe = Array.from(pendingAdd); pendingAdd.clear()
  if (toSubscribe.length) sendSubscribe(toSubscribe)
  // 2. 只发冷却到期的 cancel
  const now = Date.now()
  const dueCancel: string[] = []
  for (const [k, ts] of pendingRemove) if (now - ts >= UNSUB_COOLDOWN_MS) dueCancel.push(k)
  if (dueCancel.length) { sendCancel(dueCancel); dueCancel.forEach((k) => pendingRemove.delete(k)) }
  // 3. 仍有未到期项 → 按最早入队时间精确调度下一次 flush
  if (pendingRemove.size) {
    let earliest = Infinity
    for (const ts of pendingRemove.values()) earliest = Math.min(earliest, ts)
    scheduleFlush(Math.max(UNSUB_COOLDOWN_MS - (now - earliest), FLUSH_DEBOUNCE_MS))
  }
}
```

这一刀直接把"同时活跃的订阅数"从几百压到十几二十个，`JSON.parse` 的量级和写状态的频率都跟着掉一个数量级。`debounce 200ms` + `冷却 5s` 这两个常量是反复调出来的——太短了滚动有协议噪音，太长了切 tab 残留订阅浪费带宽。

## 四、第二刀per-symbol精准订阅切断心跳rerender

按需订阅解决了"接收多少帧"，但还有个更隐蔽的问题：**就算只订阅可视区，单元格订阅 store 的方式不对，照样会被无关更新带起重渲染。**

最典型的坑是把整个业务 `store` 当订阅源（黑洞三）。解法是给行情元数据单独切一个 `sub-store`，让单元格只订阅"自己这个品种"的关键字段，用 `zustand` 的 `useShallow` 做浅比较：

```ts
import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useWsStore } from '../internal'
import { useQuoteMetaStore } from '../state/quoteMeta'

/**
 * 单品种行情派生 hook（FlashList 滚动性能关键路径专用）。
 * 只对目标 symbol 做 per-symbol 订阅 + useShallow 浅比较，仅当本品种关键字段
 * （buy/sell/diff）变化时才触发组件重渲；其它几十个品种的 tick 不会带起本组件。
 */
export function useSymbolQuote(symbol?: string): SymbolQuoteResult {
  // 1. 元数据切片：只订阅本品种的 digits / ticker，与业务 store 字段解耦
  const symbolMeta = useQuoteMetaStore(
    useShallow((s) => {
      if (!symbol) return null
      const info = s.symbolMapAll?.[symbol]
      if (!info) return null
      const dataSourceKey = `${s.accountGroupId ?? 'visitor'}/${symbol}`
      return {
        dataSourceKey,
        digits: Number(info.symbolDecimal || 2),
        tickerOpen: s.tickerMap?.[symbol]?.open,
        tickerHigh: s.tickerMap?.[symbol]?.high,
        tickerLow: s.tickerMap?.[symbol]?.low,
      }
    })
  )
  const dataSourceKey = symbolMeta?.dataSourceKey

  // 2. 行情切片：⚠ 关键——不要把时间戳 ts 放进比较字段！
  //    心跳类 tick 会让 ts 单调推进而买卖价完全不变，把 ts 列入比较会让所有可见
  //    cell 跟着心跳 rerender，在 24 cell × 12 ticks/s 下产生 ~290/s 的 mountingTransaction。
  const tickFlat = useWsStore(
    useShallow((s) => {
      const q = dataSourceKey ? s.quotes.get(dataSourceKey) : undefined
      return {
        buy: Number(q?.priceData?.buy ?? 0),
        sell: Number(q?.priceData?.sell ?? 0),
        bidDiff: q?.bidDiff ?? 0,
        askDiff: q?.askDiff ?? 0,
        hasQuote: !!q?.priceData?.buy,
      }
    })
  )

  // 3. 派生字段（涨跌幅、最高最低、涨跌色信号）在 useMemo 内重算，
  //    不会因为别的 symbol tick 而重渲。
  return useMemo<SymbolQuoteResult>(() => {
    if (!symbol || !symbolMeta) return EMPTY_RESULT
    const { digits, tickerOpen, tickerHigh, tickerLow } = symbolMeta
    const bidNum = tickFlat.buy
    const open = Number(tickerOpen || 0)
    const percent = bidNum && open ? (((bidNum - open) / open) * 100).toFixed(2) : 0
    // 涨跌色：仅 diff !== 0 那一帧 override 静息色，形成短暂闪烁；其余帧维持涨跌底色
    const restingDir = Number(percent) > 0 ? 'up' : Number(percent) < 0 ? 'down' : 'same'
    const bidColor = tickFlat.hasQuote && tickFlat.bidDiff !== 0
      ? (tickFlat.bidDiff > 0 ? 'up' : 'down') : restingDir
    return {
      symbol, digits,
      bid: bidNum.toFixed(digits),
      ask: tickFlat.sell.toFixed(digits),
      high: Math.max(Number(tickerHigh || 0), bidNum > 0 ? bidNum : 0).toFixed(digits),
      low: bidNum > 0 ? Math.min(Number(tickerLow || 0), bidNum).toFixed(digits) : tickerLow,
      percent, bidColor, hasQuote: tickFlat.hasQuote,
    }
  }, [symbol, symbolMeta, tickFlat])
}
```

这里有个**全文最值钱的细节**，我用注释专门标了：**绝对不要把行情时间戳 `ts` 放进 `useShallow` 的比较字段。** 服务端的心跳类 `tick` 会让 `ts` 单调推进，但买卖价、`diff` 完全不变。如果你图省事把 `ts` 列进比较，结果就是所有可见单元格跟着心跳一起 `rerender`——`24` 个单元格 × `12 ticks/s` 实测会产生约 `290/s` 的 `mountingTransaction`，主线程直接被打爆。需要 `ts` 的地方就在 `useMemo` 里用 `getState()` 实时读，它只用于派生输出字段、不参与订阅触发语义。

## 五、第三刀FlashList渲染稳定性让复用链不断

订阅和数据派生都精准了，还要保证 `FlashList` 这一层不自己制造重渲染。这一刀有四个要点。

**要点一：`renderItem` 引用必须稳定。** `FlashList` 的 `renderItem` 引用或返回组件类型一变，会把全部可见单元格 `unmount → remount`，十几个 `useSymbolQuote` 同帧重建，`JS FPS` 直接掉到个位数。所以把布局模式作为 prop 传进单元格内部条件渲染，而不是在外面切换组件类型：

```tsx
const renderItem = useCallback(
  ({ item }: ListRenderItemInfo<Item>) => (
    <QuoteCell item={item} layoutMode={quoteMode} theme={cellTheme} onPressItem={onPressItem} />
  ),
  [cellTheme, onPressItem, quoteMode]
)
const keyExtractor = useCallback((item: Item) => item.symbol, [])
```

**要点二：主题用快照而不是整对象。** 主题对象引用一抖动，全表重 `paint`。所以在列表层把单元格真正用到的几个字段拍成一个 `memo` 快照传下去：

```tsx
// 行情 cell 主题快照：仅随涨跌色 / colors 变，避免 theme 整对象引用抖动触发整表重渲
const cellTheme = useMemo(
  () => ({ up: theme.up, down: theme.down, colors: theme.colors }),
  [theme.up, theme.down, theme.colors]
)
```

**要点三：单元格 `memo` 用自定义相等函数。** 默认浅比较挡不住派生对象每帧新建。手写一个"只比视觉相关字段"的相等函数，价格没变就不重渲：

```tsx
function symbolQuoteVisualEqual(a: SymbolQuoteResult, b: SymbolQuoteResult): boolean {
  return (
    a.bid === b.bid && a.ask === b.ask && a.percent === b.percent &&
    a.low === b.low && a.high === b.high && a.hasQuote === b.hasQuote
  )
}
function layoutPropsAreEqual(prev: LayoutProps, next: LayoutProps): boolean {
  return (
    prev.item.symbol === next.item.symbol &&
    prev.marketOpen === next.marketOpen &&
    prev.onPress === next.onPress &&
    prev.theme === next.theme &&            // 引用比较：靠上面的快照保证稳定
    symbolQuoteVisualEqual(prev.res, next.res)
  )
}

const CFDLayout = memo(({ item, res, theme, onPress }: LayoutProps) => {
  // ...渲染一个股票行情单元格：品种名 + 买卖价 + 涨跌幅 badge
}, layoutPropsAreEqual)
```

**要点四：`Fabric` 下关掉原生裁剪 + 压扁视图层级。** 在 `mount transaction` 频率高的场景，让 `RN` 跳过"全树 `clip` 扫描"反而更快。配合把单元格视图嵌套从 `8` 层压到 `5` 层以内：

```tsx
<FlashList
  data={finalList}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  estimatedItemSize={estimatedItemSize}
  drawDistance={QUOTE_DRAW_DISTANCE}
  onViewableItemsChanged={onViewableItemsChanged}
  viewabilityConfig={{ itemVisiblePercentThreshold: 30, minimumViewTime: 0 }}
  // 可见域已由"可视区 ± 5 buffer"控制在 16-18 条，FlashList 自己做复用，
  // 关掉原生 clipped subviews 不会暴涨内存，却能砍掉 updateClippedSubviewsWithClipRect
  // 占用的主线程时间（trace 实测占主线程约 30%）。
  removeClippedSubviews={false}
/>
```

> 还有个排序闪烁的坑顺带提一句：`FlashList` 在 `data` 重排时会用单元格复用 + 位移动画保留"原本可见那一项"，结果部分 item 会"闪一下"飘到顶部。单靠 `scrollToOffset(0)` 修不掉，因为复用过渡帧已经在原生层画了。叠加一个 `key={排序状态}` 让列表在排序切换时整体重挂载，没有任何复用过渡就没有闪烁，代价只在点击瞬间产生一次，可接受。

## 六、第四刀心跳降频边沿侦测与AppState启停

最后回头收拾黑洞一那个永不停的全局心跳。它不能直接删——价格新鲜度的"由 `stale` 升级到 `frozen`"判定需要时间流逝信号，`socket` 断了也得让单元格自然过渡到 `frozen` 灰态。所以是"改"不是"删"，三个动作：

**动作一：降频。** `80ms`（`12.5Hz`）改成 `250ms`（`4Hz`）。`stale` 阈值通常 `≥ 1s`，`4Hz` 完全够用，频率直接降到原来的三分之一。

**动作二：按需启停。** `setInterval` 改成"有监听者才启、最后一个监听者注销就停"，并监听 `AppState`，进后台 / 锁屏主动停、回前台按当前监听者数决定是否重启：

```ts
import { AppState } from 'react-native'

const QUOTE_HEARTBEAT_MS = 250
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
const tickListeners = new Set<() => void>()

function startHeartbeat() {
  if (heartbeatTimer) return
  heartbeatTimer = setInterval(() => {
    quoteHeartbeat.value = Date.now()
  }, QUOTE_HEARTBEAT_MS)
}
function stopHeartbeat() {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null }
}

/** 唯一启停闸门：有监听者才启，0 监听者就停。 */
export function subscribeQuoteTick(cb: () => void): () => void {
  tickListeners.add(cb)
  if (tickListeners.size > 0) startHeartbeat()
  return () => {
    tickListeners.delete(cb)
    if (tickListeners.size === 0) stopHeartbeat()
  }
}

// 进后台主动停，回前台按监听者数决定是否重启
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    if (tickListeners.size > 0) startHeartbeat()
  } else {
    stopHeartbeat()
  }
})
```

**动作三：边沿侦测，中间帧不写原生属性。** 这是降 `mount transaction` 的核心。原来的实现是把新鲜度三态接到 `useAnimatedStyle` 的 `color`，每次心跳写 `SharedValue` 就触发原生 `View` 的 `color` prop 更新 → `Fabric mount transaction` → 全树 `clipping`。但新鲜度其实只在**阈值跨越那一帧**需要切换颜色，中间帧完全不用动原生属性。改成内层 `worklet` 算离散态（`0/1/2`），外层只在**离散态真正变化**时通过一次 `runOnJS(setState)` 触发渲染：

```ts
import { useDerivedValue, runOnJS } from 'react-native-reanimated'
import { useState } from 'react'

type Freshness = 'live' | 'stale' | 'frozen'

function useFreshness(lastTick: SharedValue<number>, heartbeat: SharedValue<number>): Freshness {
  const [state, setState] = useState<Freshness>('live')
  useDerivedValue(() => {
    const age = heartbeat.value - lastTick.value
    // 内层：UI 线程算离散态
    const next: Freshness = age < 1000 ? 'live' : age < 5000 ? 'stale' : 'frozen'
    // 外层：仅在离散态切换那一帧才 runOnJS 触发一次 React 渲染，中间帧不写原生 prop
    runOnJS(setState)(next)
  }, [])
  return state
}
```

颜色应用走 `React state → style`，不再走 `useAnimatedStyle`。改完 `mount transaction` 从 `66/s` 降到接近 `1/s`（只在新鲜度真切换时）。这一刀是杠杆最大的一刀，主线程占用直接释放二十多个百分点。

## 七、给 App 内置实时行情监控面板

优化要可观测才能验证。我在测试包里内置了一个"网络检测"面板，实时读 `WebSocket` 的入站帧率、字节率、断连原因分桶、保活状态——这些数字是判断"行情卡顿到底是渲染问题还是网络问题"的直接证据。采样器只在面板打开时跑：

```tsx
import { useEffect, useState } from 'react'
import { getWsDiagnostics, getKeepAliveStatus } from '@/lib/ws'

export const NetCheckTab = () => {
  const [rate, setRate] = useState({ framesPerSec: 0, bytesPerSec: 0 })
  const [rateHistory, setRateHistory] = useState<number[]>([])

  useEffect(() => {
    let prev = getWsDiagnostics()
    let prevAt = Date.now()
    const refresh = () => {
      const diag = getWsDiagnostics()
      const now = Date.now()
      const dtSec = Math.max(0.001, (now - prevAt) / 1000)
      // 用相邻采样的 cumulative 增量推瞬时速率
      const framesPerSec = Math.max(0, diag.inboundFrames - prev.inboundFrames) / dtSec
      const bytesPerSec = Math.max(0, diag.inboundBytes - prev.inboundBytes) / dtSec
      prev = diag; prevAt = now
      setRate({ framesPerSec, bytesPerSec })
      setRateHistory((h) => [...h, framesPerSec].slice(-60))
    }
    refresh()
    const id = setInterval(refresh, 1000)
    return () => clearInterval(id) // 切走即停，面板未打开零开销
  }, [])

  // 入站帧率着色（启发式）：静止首页约 10 品种应 < 40/s；> 120/s 高度疑似 JSON.parse churn 源
  const framesColor = rate.framesPerSec > 120 ? '#F6465D' : rate.framesPerSec > 40 ? '#f5a623' : '#fff'

  return (
    <ScrollView>
      <StatRow label="每秒条数（每秒收到多少条行情）" value={rate.framesPerSec.toFixed(1)} color={framesColor} />
      <StatRow label="每秒流量（下行数据量）" value={`${(rate.bytesPerSec / 1024).toFixed(1)} KB`} color={framesColor} />
      {/* RateSparkline：纯 View 画的迷你柱状走势图，无第三方依赖 */}
    </ScrollView>
  )
}
```

面板里还有一块是连接诊断，把 `close` 事件按原因分桶——这是把"行情老断"这种模糊抱怨拆成可定位根因的关键。判定一定要用"真实 `open`/`close` 计数"，而不是扫日志里的订阅字符串（每 `60s` 的周期重订也会打那条日志，会被误判成"每 `60s` 重连一次"）：

```ts
export interface WsCloseReasons {
  handshakeTimeout: number  // 握手超时：连不上的典型信号
  abnormal1006: number      // code=1006 wasClean=false：跨境链路/代理粗暴掐断 TCP
  serverClose: number       // code=1000/1001：服务端正常关闭
  manualClose: number       // 业务侧主动关（清僵尸连接/重连前清理），稳态恒为 0
  other: number             // 其他业务码
}

// 面板上：handshakeTimeout / abnormal1006 > 0，就是行情卡顿、断流、频繁重连的直接证据。
// 而"每 60 秒一次"是保活刷新，不是重连——这个区分能省掉一大半误报排查。
```

把"连接成功次数""断开次数""重连尝试次数""断开原因分桶""距上次收到服务端消息多久"这些都实时摊在面板上，测试同学不用懂 `WebSocket` 协议，看一眼颜色就知道"现在是网络问题还是 `App` 问题"。配合上一篇讲的内存 + `GC` 面板，发热掉帧的现场证据就齐了。

## 八、量化验收优化到底有没有生效

老规矩，优化必须用同一台真机、同一套操作脚本、`Release` 包前后对比，不能凭感觉。这是那次行情页四刀下来的真实验收阈值：

| 指标 | 优化前 | 目标 | 关键字 / 来源 |
|---|---|---|---|
| 主线程 CPU % | 51% | ≤ 30% | Instruments 主线程占比 |
| JS 线程 CPU % | 36% | ≤ 25% | Instruments JS 线程占比 |
| `updateClippedSubviewsWithClipRect` | 76s | ≤ 25s | Instruments 关键字 inclusive |
| `mountingTransaction` | 92s / 5930 次 | ≤ 30s / 2000 次 | Instruments 关键字 inclusive |
| `reanimated`+`worklet` | 207s / 46k 次 | ≤ 80s / 16k 次 | Instruments 关键字 inclusive |
| Yoga `roundLayoutResultsToPixelGrid` | 1700 次（91/s） | ≤ 600 次（32/s） | Instruments 关键字 occur |
| Core Animation FPS（稳态期） | 0~60 周期震荡 | ≥ 55 持续 | Instruments FPS 表 |
| CPU usage mean %（静置 60s） | 100.5% | ≤ 30% | pymobiledevice3 |
| 入站帧率（静止首页） | 失控 | < 40/s | App 监控面板 |
| Thermal State | Nominal（但发烫） | Nominal 不退化 | 系统状态 |

把 `mountingTransaction`、`worklet`、`clipping` 这三个关键字的 `inclusive` 时间当作核心 KPI，每改一刀就重采一次 `trace` 核对它们有没有真的掉下来。四刀全部落地后，主线程和 `JS` 线程从双饱和回到 `30%` 以下，稳态 `FPS` 稳稳压住 `55+`，手机不再发烫，内存也回落到平稳波动——三个症状一起消失，正好印证了它们本就是同一个根因。

## 九、四刀的落地顺序与逐刀验证

四刀不是随便挑一刀做就行，落地是有顺序的，而且每一刀都要单独验证生效再做下一刀——这正是性能优化最容易翻车的地方：一口气全改完，最后分不清谁帮了忙、谁帮了倒忙。给一条可直接照搬的落地流程。

**第 0 步 · 先让现场可观测。** 别急着改代码，先把第七节那个监控面板接进测试包。没有"入站帧率 / `GC` 次数 / 断连原因"的实时读数，你根本不知道四刀里哪一刀对你的项目最值钱。装好面板，真机 `Release` 包停在行情页两分钟，记下基线：帧率多少、`GC` 每分钟多少次、主线程占用多少。

**第 1 步 · 先开第一刀（按需订阅），因为它 `ROI` 最高且最安全。** 把"全量订阅"改成"可视区 ± 缓冲订阅"，几乎不碰渲染逻辑，风险最低，却能把接收量和 `parse` 量直接砍一个数量级。改完盯监控面板：入站帧率应该从失控掉到 `< 40/s`。这一刀没生效，后面三刀都白搭。

**第 2 步 · 再开第二刀（精准订阅），它和第一刀是乘法关系。** 第一刀管"收多少帧"，第二刀管"每帧唤醒多少单元格"。重点就一句：把订阅源从大杂烩 `store` 切到 per-symbol，**并且确认时间戳没混进比较字段**。改完用 `Instruments` 录一段，看 `mountingTransaction` 的 `occur` 次数有没有断崖式下降——这是第二刀生效的硬证据。

**第 3 步 · 第三刀（渲染稳定）配合第二刀一起验。** `renderItem` 引用稳定、主题快照、`memo` 自定义相等、关原生裁剪，这几个要点一起上，单独验意义不大。验收看滑动时的 `JS FPS` 和 `updateClippedSubviewsWithClipRect` 占主线程的比例。

**第 4 步 · 最后开第四刀（心跳治理），收尾后台空转。** 前三刀解决"前台干活时别浪费"，第四刀解决"后台和稳态别空转"。降频 + 按需启停 + 边沿侦测三个动作一起做，验收看 `App` 切后台后 `CPU` 是否真的归零、稳态期 `mountingTransaction` 是否降到接近 `1/s`。

**第 5 步 · 整体复测 + 钉死阈值表。** 四刀全落地后，用和第 0 步完全相同的操作脚本再测一次，对照下一节的阈值表逐项核对。把前后数据写进 `PR`，并把命令行采集的 `diff` 退出码接进 `CI`，让后人改回任何一刀都会被红灯挡住。

这套顺序的核心逻辑是**按 `ROI` 和风险排序、逐刀留下可验证的证据**。慢一点，但每一刀都站得住脚，不会出现"改了一堆、烫还是烫、却不知道问题在哪"的尴尬。

## 十、最佳实践清单

把四刀和踩过的坑浓缩成可执行规则：

- **只为可视区品种建立订阅**，可视区 ± 缓冲，`debounce` 合并滚动回调，退订加冷却避免协议抖动。
- **单元格只做 per-symbol 精准订阅**，用 `useShallow` 浅比较，**绝不把单调递增的时间戳放进比较字段**。
- **`renderItem` 引用稳定**，布局模式作为 prop 进单元格内部条件渲染，别在外面切组件类型。
- **主题传快照不传整对象**，单元格 `memo` 用"只比视觉字段"的自定义相等函数。
- **高频 `mount transaction` 场景关掉原生裁剪 + 压扁视图层级**，圆角和深嵌套是隐性成本放大器。
- **永不停的定时器要么降频、要么按需启停、要么边沿侦测**，后台一定要停。
- **状态变化用边沿侦测**，只在离散态真切换那一帧写原生属性，中间帧一律不动。
- **给 `App` 内置可观测面板**，把入站帧率、断连原因、`GC` 实时摊开，让验证有据可依。

## 总结

高频行情渲染的发热、掉帧、内存暴涨从来不是三个独立问题，而是同一个"`CPU` 被持续无意义地烧"的三种表象。解题思路也只有一句：**让 `CPU` 只在"真有价格变化、且用户真看得到"时才干活。** 围绕这句话的四刀——按需订阅砍掉接收量、per-symbol 精准订阅砍掉无关重渲、`FlashList` 稳定性保住复用链、心跳边沿侦测杀掉后台空转——彼此叠加，缺一不可。

这套方法不止适用于行情，任何"高频数据流 + 长列表"的场景（弹幕、`IM`、实时监控大屏）都能照搬。核心方法论就两条：先用真机 `Release` `trace` 把热点关键字钉死，再用内置监控面板让每一刀的效果可观测、可量化、可回归。性能优化最怕自我感动，把它变成一张能进 `CI` 的阈值表，才算真正把"用户说手机烫"这件事闭环了。

## 参考

- [React Native Optimizing FlatList Configuration](https://reactnative.dev/docs/optimizing-flatlist-configuration)
- [Shopify FlashList 官方文档](https://shopify.github.io/flash-list/)
- [Zustand useShallow 官方文档](https://zustand.docs.pmnd.rs/hooks/use-shallow)
- [React Native Reanimated 官方文档](https://docs.swmansion.com/react-native-reanimated/)
- [React.memo 官方文档](https://react.dev/reference/react/memo)
- [Hermes Engine 官方文档](https://hermesengine.dev/)
