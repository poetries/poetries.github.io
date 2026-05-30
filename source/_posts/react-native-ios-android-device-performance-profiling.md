---
title: React Native真机性能调优实战-iOS与安卓从打Release包到定位卡顿发热
description: 一份可落地的React Native真机性能定位手册。覆盖Xcode Instruments打Release包Profile、Hermes火焰图、pymobiledevice3命令行长稳采集、Android adb gfxinfo/meminfo/thermal一键脚本，以及App内置内存与GC监控面板的完整脱敏代码，配前后对比验收阈值。
date: 2026-05-30 15:10:24
tags:
  - RN
  - 性能优化
  - iOS
categories: Front-End
---

接手一个股票行情类 `React Native` App，最难受的不是写不出功能，而是用户反馈"看一会儿行情手机就发烫、列表滑动一卡一卡的"。这种问题在模拟器上永远复现不出来——`Debug` 包带着 `Metro` 热更新和未优化的 `JS bundle`，性能特征和上架的 `Release` 包完全是两码事。你在 Mac 上用 `Chrome DevTools` 看得再爽，真机 `Release` 包里的 `Hermes` 字节码根本不认识你的 `JS` 函数名。

折腾了大半个月，我把整套真机性能定位流程沉淀成了一条可重复、可自动化、能进 `CI` 的链路。这篇文章把 `iOS` 和 `Android` 两端从「打 `Release` 包」到「采数据」到「前后对比验收」的每一步都讲透，所有脚本和监控面板代码都已脱敏，可以直接抄进你的项目。

在本篇文章中，我们将从浅入深，一起搞定以下内容：

- 为什么真机 `Release` 性能问题在模拟器和 `Debug` 包里永远复现不出来
- 开发阶段用 `JS FPS` + 火焰图快速粗筛热点
- `iOS` 用 `Xcode Instruments` 打 `Release` 包做 `Time Profiler` / `Core Animation FPS` 的完整操作流
- `Instruments` 的致命盲区与 `react-native-release-profiler` 出 `Hermes` 火焰图
- 用 `pymobiledevice3` 搭一条命令行长稳采集 + 自动 `diff` 的第二数据源（可进 `CI`）
- `Android` 用 `adb dumpsys` 一键抓 `gfxinfo` / `meminfo` / `thermal` / `batterystats`
- 给 `App` 内置一个实时内存、`GC`、事件循环延迟监控面板（完整代码）
- 用前后对比阈值表给「优化是否生效」一个客观判定

## 一、真机 Release 性能为什么这么难定位

先把最容易踩的认知坑说清楚，否则你采到的所有数据都是错的。

`React Native` 是双线程模型：原生 `UI` / 主线程负责布局、绘制、手势；`JS` 线程负责业务逻辑和 `React` 渲染调度（新架构 `Fabric` 下还有 `ShadowTree` 的 `commit` 与 `mount transaction`）。卡顿和发热的根因可能落在任意一条线程上，甚至是两条线程互相打架——`JS` 线程频繁写动画属性，把主线程的 `mount transaction` 顶到每秒几十次。只盯 `JS` 或只盯原生，都会漏。

更关键的是 `Debug` 包和 `Release` 包的差异：

| 维度      | Debug 包                                 | Release 包                                  |
| --------- | ---------------------------------------- | ------------------------------------------- |
| JS 引擎   | 常带 `Metro` + 远程调试，可能跑 `JSC`    | `Hermes` 字节码，无远程调试                 |
| 代码优化  | 未做 `DCE`、未压缩、`__DEV__` 分支全在   | `Tree-shaking` + 压缩，`__DEV__` 分支被裁掉 |
| 内存 / GC | 带开发期对象、`source map`、warning 缓存 | 接近线上真实占用                            |
| FPS       | 受 `Metro` bridge 噪音干扰               | 真实渲染表现                                |

结论很硬：**任何要上架的性能数据，都必须在真机 `Release` 包上采。** 模拟器没有真实 `GPU`、没有热节流、`CPU` 调度也不一样，模拟器上「流畅」不代表用户手里不烫。后面所有流程都围绕「真机 + `Release`」展开。

我的整套定位链路按"成本由低到高、覆盖由粗到细"分四层：

```
开发期粗筛(JS FPS + DevTools 火焰图)
        ↓ 锁定可疑页面
真机 Release 精测(Xcode Instruments / Android adb)
        ↓ 拿到主线程/JS线程热点
Hermes 火焰图(release-profiler) 看 JS 函数名
        ↓ 长期稳态 + CI 可自动 gate
命令行长稳采集(pymobiledevice3 / adb) + 前后 diff
```

## 二、开发阶段先用 JS FPS 和火焰图粗筛

不要一上来就打 `Release` 包，那太重。开发期先用最轻的手段把可疑页面圈出来。

`React Native` 的开发菜单（摇一摇或 `Cmd+D` / `Cmd+M`）里有 `Perf Monitor`，能看到 `JS FPS` 和 `UI FPS` 两个数。判断阈值我一般这么记：

- `50-60`：流畅，用户无感知
- `30-50`：轻微掉帧，快速滚动时能察觉
- `< 30`：明显卡顿，操作有"拖泥带水"感

行情列表、动画密集页要尽量保持 `JS FPS ≥ 55`。哪个页面一滑就掉到 30 以下，就是它了。

![React Native 开发菜单里的 JS FPS 性能指标面板](https://s.poetries.top/uploads/2026/05/a3a921b9f2f7225a.png)

圈定页面后，用 `Hermes` 自带的 `Sampling Profiler` 录一段火焰图。`Debug Hermes` 下可以直接在开发菜单里 `Enable Sampling Profiler`，操作完再 `Disable`，会在设备上落一个 `.cpuprofile`，拉到本地丢进 `Chrome DevTools` 的 `Performance` 面板 `Load profile` 就能看 `JS` 火焰图。

![Chrome DevTools 加载 cpuprofile 后看到的 JS 火焰图](https://s.poetries.top/uploads/2026/05/015d3dcd0bfcac70.png)

火焰图的价值在于**把热点函数的调用栈和耗时占比直接画出来**。我习惯把导出的 `profile` 文件交给 `AI` 一起分析，改完代码后再录一次核对是否真的压下去了——这个"录制→改→再录制核对"的闭环很重要，凭感觉优化十次有八次是白干。

![把导出的性能录制文件交给 AI 分析热点](https://s.poetries.top/uploads/2026/05/89a48631dad1d0e5.png)

## 三、iOS 用 Xcode Instruments 打 Release 包做 Profile

这是 `iOS` 端最权威的工具，能看到 `RN bridge` 内部细节（`mountingTransaction`、`reanimated worklet`、`Hermes` 解释器 `inclusive` 时间）。完整操作流如下。

### 第一步：把 Build Configuration 改成 Release

`Xcode` 顶部菜单 `Product → Scheme → Edit Scheme`，左侧选 `Run`（或 `Profile`），把 `Build Configuration` 从 `Debug` 改成 `Release`。

![Xcode Edit Scheme 把 Build Configuration 改成 Release](https://s.poetries.top/uploads/2026/05/5e1c55de20db9639.png)

> 踩坑提醒：测完一定要改回 `Debug`，否则本地开发的热更新（`Fast Refresh`）不会生效，你会以为是别的 bug，白白浪费半小时。

### 第二步：用 Profile 启动而不是 Run

菜单 `Product → Profile`（快捷键 `Cmd+I`）。它会用刚才的 `Release` 配置编译并把 `App` 装到真机，然后弹出 `Instruments` 的模板选择窗。选 **`Time Profiler`**。

![Product → Profile 启动 Instruments](https://s.poetries.top/uploads/2026/05/384fb02e6d3faeec.png)

### 第三步：录制 Time Profiler

`Time Profiler` 会看主线程 / `JS` 相关线程的 `CPU` 是否长期打满、热点是不是落在 `completeRoot`、`Hermes` 这类关键字上。

![Instruments Time Profiler 主线程与 JS 线程 CPU 占用](https://s.poetries.top/uploads/2026/05/dd919f0d52a4aedc.png)

点左上角红色录制按钮，在真机上把待测场景跑一遍（比如行情列表停留 30 秒 + 来回滑动）。录完点停止。

![点击录制按钮采集性能数据](https://s.poetries.top/uploads/2026/05/2049d8b525c63d78.png)

录完得到一份性能报告，重点看：

- 主线程 / `JS` 相关线程的 `CPU` 是不是长期打满
- 热点是不是落在 `completeRoot`、`Hermes` 解释器、`mountingTransaction` 这类关键字上

![Instruments 采集出的性能报告](https://s.poetries.top/uploads/2026/05/561c03d043128bad.png)

### 第四步：导出 Call Tree 文本给 AI 分析

`Instruments` 的二进制 `trace` 没法直接喂 `AI`（直接复制导出的是二进制不可用），要导出文本。左下角 `Call Tree` 设置勾选（`RN` 项目常用组合）：

- `Separate by Thread`：分线程看，主线程和 `JS` 线程分开
- `Invert Call Tree`：反转调用树，直接看谁最耗（叶子函数自顶向上）
- `Hide System Libraries`：藏掉系统库，只看业务代码
- 可选 `Top Functions` / `Flatten Recursion`

![Call Tree 左下角勾选 Separate by Thread / Invert Call Tree / Hide System Libraries](https://s.poetries.top/uploads/2026/05/02fd5ba085911207.png)

设置好之后，右键 `Call Tree` 选 `Copy` 把文本复制出来，丢给 `AI` 让它帮你归类热点。

![导出 Call Tree 文本给 AI 分析](https://s.poetries.top/uploads/2026/05/4e639e0349b723b5.png)

### 第五步：加一个 Core Animation FPS 看真实帧率

`Time Profiler` 默认不带 `FPS`。在 `Instruments` 里点 `+` 从模板加一个 **`Core Animation FPS`** 仪器，重新录制就能看到逐秒帧率曲线。

![从 Time Profiler 模板增加 Core Animation FPS 看帧率](https://s.poetries.top/uploads/2026/05/c91773e254c6aa29.png)

行情稳态期如果 `FPS` 在 `0~60` 之间周期性震荡，那就是典型的「有一批高频任务周期性冲击渲染管线」，往往对应某个永不停的 `setInterval` 或动画 `worklet`。

我自己那次的 `trace` 数据很说明问题：`iPhone 16 Pro Max` 的 `Release` 包，`18.67s` 采样里**主线程 51%、JS 线程 36% 双饱和**，`updateClippedSubviewsWithClipRect` 关键字 `inclusive` 占到 `76s`、`mountingTransaction` 占 `92s`、`reanimated`+`worklet` 累计 `207s`。这些关键字 `inclusive` 时间就是后续优化的靶子（具体怎么打掉这几个黑洞，是另一篇文章的事，这里只讲怎么把它们量出来）。

## 四、Instruments 的盲区与 Hermes 火焰图

`Instruments` 的 `Time Profiler` 有个致命盲区：**它看不到 `Hermes` 字节码里的 `JS` 函数名**。你在 `Call Tree` 里只能看到一坨 `Hermes` 解释器的 `inclusive` 时间，知道"`JS` 在烧 `CPU`"，但不知道是哪个业务函数烧的。

而 `iOS Release Hermes` 二进制又不暴露 `JS-side` 的 `Sampling Profiler API`（`Debug Hermes` 才有）。要在 `Release` 包里采到 `JS` 火焰图，必须靠 `native` 路径的 `react-native-release-profiler`：

```bash
# 安装（iOS 还要回 ios 目录 pod install）
yarn add react-native-release-profiler
cd ios && pod install && cd ..
```

`package.json` 里配好命令：

```json
{
  "scripts": {
    "perf:profile:local": "react-native-release-profiler --local",
    "perf:profile:android": "react-native-release-profiler --fromDownload --appId com.example.app"
  }
}
```

操作流是：在 `App` 里触发开始采样（下一节的监控面板里我做了个按钮），录 `30-60s` 并保持前台触发可疑场景，停止后导出 `.cpuprofile`（`iOS` 落 `Library/Caches`，`Android` 落 `Downloads`）。然后 Mac 终端跑 `yarn perf:profile:local <path>` 解出 `JS` 函数名 + `source map`，再丢进 `Chrome DevTools` 或 `Speedscope` 看火焰图。这一步是 `Release` 包定位 `JS` 热点的唯一靠谱路径。

## 五、用 pymobiledevice3 搭一条命令行长稳采集

`Instruments` 很强，但有三个弱点：单次采样窗口实际可用 `≤ 60s`、不好自动化、没有 `CI` 友好的阈值判定。所以我额外搭了一条**第二数据源**——用 `pymobiledevice3`（`iOS 17+` 真机做命令行性能采集的唯一靠谱路径）做静置 `60s` 长稳采集，可脚本化、可进 `CI`、可前后 `diff`。

两条数据源是强制互补的：`Instruments` 看 `RN bridge` 内部分布，`pymobiledevice3` 看长时间稳态 + 自动 gate。

### 5.1 环境准备

`iOS 17+` 真机的所有 `dvt` 服务都要走 `RemoteXPC tunnel`，必须 `sudo` 起一个 `tunneld` 守护进程。我把它包成了脚本：

```json
{
  "scripts": {
    "perf:ios:tunneld": "bash scripts/perf/tunneld.sh start",
    "perf:ios:tunneld:bg": "bash scripts/perf/tunneld.sh start --bg",
    "perf:ios:tunneld:stop": "bash scripts/perf/tunneld.sh stop",
    "perf:ios:tunneld:status": "bash scripts/perf/tunneld.sh status",
    "perf:ios": "bash scripts/perf/run-ios.sh",
    "perf:diff:ios": "python3 tools/perf/diff.py reports/perf/baseline-2026-05-24",
    "perf:trace": "python3 tools/perf/parse-trace.py"
  }
}
```

有两个坑必须提前知道，否则会卡很久：

1. **`NO_PROXY='*'`**：本机如果开了 `Clash` / `V2Ray` 这类 `HTTP` 代理，会拦截 `127.0.0.1:49151` 的 `tunneld` 请求，导致 `JSONDecodeError`。所有调用都要绕过 `localhost` 代理。
2. **`iOS 18.2+` 必须用 `Python 3.13`**：旧版本会因 `QUIC` 不可用而失败。

### 5.2 tunneld 守护脚本

`scripts/perf/tunneld.sh`，负责检测、启动、停止、查状态。`sudo` 会清掉 `PATH`，所以 `Python 3.13` 的二进制路径写死：

```bash
#!/usr/bin/env bash
# tunneld 守护脚本：检测 → 启动 → 停止 → 状态
set -euo pipefail

# Python 3.13 framework 绝对路径（sudo 会清 PATH，必须写死）
PY313_BIN="/Library/Frameworks/Python.framework/Versions/3.13/bin/pymobiledevice3"
TUNNELD_HEALTH_URL="http://127.0.0.1:49151/"
TUNNELD_LOG="/tmp/app-tunneld.log"
TUNNELD_PID_FILE="/tmp/app-tunneld.pid"

CMD="${1:-start}"

# 健康检查：绕开本机 HTTP 代理（关键！否则 Clash/V2Ray 会拦截 localhost）
check_health() {
  env -u http_proxy -u https_proxy -u all_proxy -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY \
    NO_PROXY='*' \
    curl -fs --max-time 3 "$TUNNELD_HEALTH_URL" > /dev/null 2>&1
}

cmd_status() {
  if check_health; then
    echo "✅ tunneld 在跑 ($TUNNELD_HEALTH_URL)"
  else
    echo "❌ tunneld 未运行（$TUNNELD_HEALTH_URL 无响应）"
    return 1
  fi
}

cmd_stop() {
  if [[ -f "$TUNNELD_PID_FILE" ]]; then
    local pid; pid="$(cat "$TUNNELD_PID_FILE")"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      sudo kill "$pid" 2>/dev/null || true
      rm -f "$TUNNELD_PID_FILE"; sleep 1
    fi
  fi
  # 兜底：强杀所有残留 tunneld
  if pgrep -f "pymobiledevice3 remote tunneld" >/dev/null; then
    sudo pkill -f "pymobiledevice3 remote tunneld" 2>/dev/null || true; sleep 1
  fi
  check_health && { echo "❌ tunneld 仍在响应"; exit 1; } || echo "✅ tunneld 已停止"
}

# 前台模式：保持窗口开着，去另一个终端跑采集
cmd_start_foreground() {
  echo "⚠️ 接下来会提示输入 sudo 密码，启动后请保持窗口开着。"
  exec sudo "$PY313_BIN" remote tunneld
}

# 后台模式：输一次密码后可关窗口
cmd_start_background() {
  sudo -v  # 先缓存密码，避免 nohup 内无法弹密码
  sudo nohup "$PY313_BIN" remote tunneld > "$TUNNELD_LOG" 2>&1 &
  echo $! > "$TUNNELD_PID_FILE"; disown 2>/dev/null || true
  for i in $(seq 1 10); do
    check_health && { echo " OK"; cmd_status; exit 0; }
    sleep 1; echo -n "."
  done
  echo "❌ tunneld 10s 内未就绪。看日志：tail -50 $TUNNELD_LOG"; exit 1
}

case "$CMD" in
  status) cmd_status ;;
  stop)   cmd_stop ;;
  start|"")
    check_health && { echo "✅ tunneld 已在跑"; exit 0; }
    if [[ "${2:-}" == "--bg" ]]; then cmd_start_background; else cmd_start_foreground; fi
    ;;
  *) echo "用法：tunneld.sh [start|stop|status] [--bg]"; exit 1 ;;
esac
```

### 5.3 一次完整采集

`tools/perf/capture.sh`，采进程级 `CPU`/内存/`wakeups`/`syscall` + `GPU`/`FPS` + 系统级快照。`pymobiledevice3` 的 `dvt` 同一时刻只能稳定服务一个 `instrument`，所以必须**串行采**（并发会触发 `DTX channel` 抢占报 "Device is not connected"）：

```bash
#!/usr/bin/env bash
# iOS 真机性能采集（pymobiledevice3，iOS 17+）
set -euo pipefail
DURATION="${1:-60}"
BUNDLE_ID="${2:-com.example.app}"
OUT_DIR="${3:-reports/perf/$(date +%Y%m%d-%H%M%S)}"

# tunneld 与本机 HTTP 代理冲突，所有调用都绕过 localhost 代理
export NO_PROXY='*' http_proxy='' https_proxy='' all_proxy=''

# 前置：tunneld 必须在跑
curl -fs http://127.0.0.1:49151/ >/dev/null 2>&1 || {
  echo "❌ tunneld 未运行，先在另一个终端跑：sudo pymobiledevice3 remote tunneld"; exit 1; }

# 找到真机上运行中的进程 pid
PID="$(pymobiledevice3 developer dvt process-id-for-bundle-id "$BUNDLE_ID" --tunnel '' 2>/dev/null \
  | tail -1 | tr -d '[:space:]')"
[[ "$PID" =~ ^[0-9]+$ ]] || { echo "❌ 未找到 $BUNDLE_ID 进程（确认 app 已在前台）"; exit 1; }
mkdir -p "$OUT_DIR"

# Phase 1: 进程级 CPU/内存/wakeups/syscalls（1Hz）
pymobiledevice3 developer dvt sysmon process monitor process \
  --filter "pid=$PID" \
  --key name --key cpuUsage --key physFootprint --key memResidentSize \
  --key intWakeups --key ctxSwitch --key sysCallsMach --key sysCallsUnix \
  --key threadCount --key cpuTotalSystem --key cpuTotalUser \
  --interval 1000 --output "$OUT_DIR/proc.jsonl" --tunnel '' >"$OUT_DIR/proc.err" 2>&1 &
P1=$!; sleep "$DURATION"; kill "$P1" 2>/dev/null || true; wait "$P1" 2>/dev/null || true

# Phase 2: GPU + FPS（固定 30s）
pymobiledevice3 developer dvt graphics --tunnel '' >"$OUT_DIR/gpu.log" 2>&1 &
P2=$!; sleep 30; kill "$P2" 2>/dev/null || true; wait "$P2" 2>/dev/null || true

# Phase 3: 系统级一次性快照
pymobiledevice3 developer dvt sysmon system --tunnel '' >"$OUT_DIR/sys.log" 2>&1 || true

echo "✅ 采集完成。运行分析：python3 tools/perf/analyze.py $OUT_DIR"
```

### 5.4 前后对比与 CI gate

`analyze.py` 把原始数据读成结构化的 `stats.json`，`diff.py` 拿基线和改造后两份 `stats.json` 做对比，按阈值表给 `✅/🟡/🔴` 判定，退出码 `1` 表示有指标恶化——这一点让它能直接进 `CI` 阻塞合并。核心阈值表（与团队 `proposal` 文档保持单一事实来源）：

```python
# tools/perf/diff.py 节选：gate 阈值与判定
THRESHOLDS = [
    {"path": "cpu.usagePct.mean",          "label": "CPU usage mean %",        "lower_is_better": True, "target": 30,    "unit": "%"},
    {"path": "cpu.usagePct.p95",           "label": "CPU usage p95 %",         "lower_is_better": True, "target": 80,    "unit": "%"},
    {"path": "syscalls.sysCallsMach.mean", "label": "mach syscalls / s mean",  "lower_is_better": True, "target": 3000,  "unit": "/s"},
    {"path": "ctxSwitch.mean",             "label": "context switch / s mean", "lower_is_better": True, "target": 1500,  "unit": "/s"},
    {"path": "wakeups.intWakeups.mean",    "label": "intWakeups / s mean",     "lower_is_better": True, "target": 50,    "unit": "/s"},
    {"path": "memory.physFootprintDelta",  "label": "memory delta(end-start)", "lower_is_better": True, "target": 10 * 1024 * 1024, "unit": "bytes"},
]

def _delta_pct(before, after):
    if before is None or after is None or before == 0:
        return None
    return (after - before) / abs(before) * 100

# 对每个阈值：恶化且未达标 → 🔴；达标 → ✅；改善但没达标 → 🟡。
# regressed > 0 时 sys.exit(1)，CI 红灯。
```

> 一个反直觉的点：`FPS=0` 帧占比方向是反的。`App` 静置无操作时**本就不该渲染**，所以优化后应当仍然 `≥ 80%` 时间 `FPS=0`，关键是 `CPU` 要同时降到 `30%` 以下。`FPS=0 + CPU 高` = 病态；`FPS=0 + CPU 低` = 健康。这个指标专门用来验证「那些永不停的定时器不再触发 `mount transaction`」。

## 六、Android 真机性能定位

`Android` 端不需要 `tunneld` 这套，`adb` 直接全搞定，反而更顺手。我把整套包成 `run-android.sh`，采 `CPU`/内存/线程数 + `gfxinfo`（帧统计）+ `meminfo` + `thermal`（温度）+ `batterystats`：

```bash
#!/usr/bin/env bash
# Android 真机性能采集一键流程
set -euo pipefail
DURATION="${1:-60}"
PACKAGE="${2:-com.example.app}"
OUT_DIR="reports/perf/after-android-$(date +%Y%m%d-%H%M%S)"

# 前置：adb 已连真机，app 已在前台（建议 release build）
command -v adb >/dev/null || { echo "❌ 装 adb：brew install android-platform-tools"; exit 1; }
PID="$(adb shell pidof "$PACKAGE" | tr -d '\r\n' | awk '{print $1}')"
[[ -z "$PID" ]] && { echo "❌ $PACKAGE 未在前台运行"; exit 1; }
mkdir -p "$OUT_DIR"

# 重置 gfxinfo（拿干净的 frame stats）+ batterystats
adb shell dumpsys gfxinfo "$PACKAGE" reset > /dev/null 2>&1 || true
adb shell dumpsys batterystats --reset > /dev/null 2>&1 || true

# 1Hz 采样 CPU / RSS / 线程数 / 温度
PROC_FILE="$OUT_DIR/proc.jsonl"; > "$PROC_FILE"
for i in $(seq 1 "$DURATION"); do
  TS_MS=$(date +%s%3N)
  TOP_LINE="$(adb shell "top -n 1 -p $PID -b -o PID,%CPU,RES,THREADS,NAME" 2>/dev/null | tail -1 | tr -s ' ')"
  CPU_PCT="$(echo "$TOP_LINE" | awk '{print $2}')"
  RES_KB="$(echo  "$TOP_LINE" | awk '{print $3}' | tr -d 'K')"
  THREADS="$(echo "$TOP_LINE" | awk '{print $4}')"
  # 温度（thermal_zone0，单位 m°C）—— 排查发热的关键信号
  TEMP="$(adb shell cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null | tr -d '\r' || echo 0)"
  echo "{\"ts\":$TS_MS,\"cpuPct\":\"$CPU_PCT\",\"resKB\":\"$RES_KB\",\"threads\":\"$THREADS\",\"thermalMilliC\":$TEMP}" >> "$PROC_FILE"
  sleep 0.9
done

# 全量快照：帧统计 / 内存 / 电量 / 温度 zones
adb shell dumpsys gfxinfo "$PACKAGE" > "$OUT_DIR/gfxinfo.txt" 2>&1 || true
adb shell dumpsys gfxinfo "$PACKAGE" framestats > "$OUT_DIR/gfxinfo-framestats.txt" 2>&1 || true
adb shell dumpsys meminfo "$PACKAGE" > "$OUT_DIR/meminfo.txt" 2>&1 || true
adb shell dumpsys batterystats --charged "$PACKAGE" > "$OUT_DIR/batterystats.txt" 2>&1 || true
adb shell 'for z in /sys/class/thermal/thermal_zone*; do echo "[$z]"; cat $z/type; cat $z/temp; done' \
  > "$OUT_DIR/thermal.txt" 2>&1 || true

echo "✅ Android 采集完成：$OUT_DIR"
```

`gfxinfo` 是 `Android` 端最值钱的数据，重点看这几个字段：

| 指标                           | 含义               | 健康标准                   |
| ------------------------------ | ------------------ | -------------------------- |
| `Janky frames`                 | 卡顿帧数与占比     | 占比越低越好               |
| `90th/95th/99th percentile`    | 帧耗时分位         | `90%` 应 `< 16ms`（60fps） |
| `Number Missed Vsync`          | 错过垂直同步次数   | 越少越好                   |
| `Number Frame deadline missed` | 错过帧截止时间次数 | 越少越好                   |
| `Number Slow UI thread`        | `UI` 线程慢的帧数  | 定位主线程瓶颈             |

`meminfo` 里重点看 `TOTAL PSS`（进程实际占用）、`Native Heap`、`Java Heap`、`Graphics`——如果停留时间越长 `TOTAL PSS` 只涨不回落，基本就是内存泄漏。`Android` 的 `Release` 包同样可以用 `react-native-release-profiler --fromDownload` 抓 `Hermes` 火焰图，路径在 `Downloads`。

## 七、给 App 内置一个实时监控面板

命令行采集是「事后分析」，但很多发热问题需要**用户在真实场景里一边操作一边看实时数据**。所以我在 `App` 里内置了一个浮窗监控面板，只在测试 / 灰度包挂载，生产正式包整段被 `DCE` 裁掉。

### 7.1 浮窗入口

一个可拖动、自动吸附边缘的悬浮按钮，点击弹出全屏面板：

```tsx
import React, { useState } from 'react'
import { Modal, useWindowDimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const FAB_SIZE = 44
const EDGE_MARGIN = 12

/** 仅在 Config.enableDevtools === true 时挂载（测试/灰度包），生产正式包整段被 DCE。 */
export const DevtoolsFab = () => {
  if (!__DEV__ && !global.__ENABLE_DEVTOOLS__) return null
  const [open, setOpen] = useState(false)
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()

  const rightEdgeX = width - FAB_SIZE - EDGE_MARGIN
  const translateX = useSharedValue(rightEdgeX)
  const translateY = useSharedValue(height - 200)
  const startX = useSharedValue(0)
  const startY = useSharedValue(0)

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value
      startY.value = translateY.value
    })
    .onUpdate((e) => {
      // worklet 内联 clamp，避免跨线程函数调用
      translateX.value = Math.min(Math.max(startX.value + e.translationX, EDGE_MARGIN), rightEdgeX)
      translateY.value = Math.max(startY.value + e.translationY, insets.top + EDGE_MARGIN)
    })
    .onEnd(() => {
      // 松手吸附到最近的左/右边
      const center = translateX.value + FAB_SIZE / 2
      translateX.value = withSpring(center < width / 2 ? EDGE_MARGIN : rightEdgeX, { damping: 40, stiffness: 200 })
    })

  const tapGesture = Gesture.Tap()
    .maxDistance(10)
    .onEnd((_e, ok) => {
      if (ok) scheduleOnRN(() => setOpen(true))
    })
  const gesture = Gesture.Race(panGesture, tapGesture)
  const animatedStyle = useAnimatedStyle(() => ({ left: translateX.value, top: translateY.value }))

  return (
    <>
      <GestureDetector gesture={gesture}>
        <Animated.View
          className="absolute items-center justify-center rounded-full"
          style={[{ width: FAB_SIZE, height: FAB_SIZE, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 9999, elevation: 20 }, animatedStyle]}
        >
          {/* DBG 字样 */}
        </Animated.View>
      </GestureDetector>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        {/* <DevPanel onClose={() => setOpen(false)} /> 内含「内存监控」「网络检测」等 tab */}
      </Modal>
    </>
  )
}
```

### 7.2 内存 / GC / 事件循环延迟采样器

面板的核心是一个 `1s` 周期的采样器，只在面板打开时跑（面板关掉零开销，避免"监控本身拖慢业务线程加热"）。它采三类信号：进程 `RSS`、`Hermes` `JS` 堆 + `GC`、`JS` 线程事件循环延迟：

```ts
import DeviceInfo from 'react-native-device-info'

export interface MemorySample {
  ts: number // 采样时刻
  rss: number // 进程常驻内存 RSS（byte），只涨不回落 = 泄漏嫌疑
  jsHeap: number // Hermes JS 堆大小
  numGCs: number // Hermes 累计 GC 次数，频繁 GC 直接烧 CPU 发热
  gcCpuMs: number // Hermes 累计 GC CPU 时间
  driftMs: number // 事件循环延迟，>0 表示 JS 线程当时繁忙
}

const INTERVAL_MS = 1000
const MAX_SAMPLES = 120 // 2 分钟 @1s
let samples: MemorySample[] = []
let timer: ReturnType<typeof setInterval> | null = null
let lastTickAt = 0

/** 读 Hermes getInstrumentedStats()——仅 Hermes 引擎可用，远程调试/JSC 下拿不到。 */
const readHermesStats = () => {
  const hermes = (global as any).HermesInternal
  const stats = hermes?.getInstrumentedStats?.()
  if (!stats) return { jsHeap: 0, numGCs: 0, gcCpuMs: 0 }
  const num = (k: string) => (typeof stats[k] === 'number' ? stats[k] : 0)
  return {
    jsHeap: num('js_heapSize'),
    numGCs: num('js_numGCs'),
    gcCpuMs: num('js_gcCPUTime') * 1000 // 秒转 ms
  }
}

const tick = () => {
  const now = Date.now()
  const driftMs = computeEventLoopLag(now, lastTickAt, INTERVAL_MS)
  lastTickAt = now
  const hermes = readHermesStats()
  let rss = 0
  try {
    rss = DeviceInfo.getUsedMemorySync()
  } catch {
    rss = samples.at(-1)?.rss ?? 0
  }
  samples.push({ ts: now, rss, ...hermes, driftMs })
  if (samples.length > MAX_SAMPLES) samples = samples.slice(-MAX_SAMPLES)
}

export const startMemorySampling = () => {
  if (timer) return
  lastTickAt = 0
  tick()
  timer = setInterval(tick, INTERVAL_MS)
}
export const stopMemorySampling = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
export const getMemorySamples = () => samples
```

事件循环延迟（`driftMs`）这个指标有个巨坑必须处理：`App` 进后台 / 锁屏 / 命中断点时，`setInterval` 会被宿主**整体挂起**，回前台才补跑一次回调，此时"实际间隔"可达几十秒。这反映的是「`JS` 引擎被挂起」而**不是**「前台 `JS` 真卡」，却会被记成天文数字的 `Max Lag`（线上真出现过 `58s` 的假尖峰，一度把排查带偏）。所以拆一个纯函数把这种假象过滤掉：

```ts
/** 单帧延迟的可信上限（ms）；超过即判为宿主挂起假象，归零。 */
export const MAX_VALID_EVENT_LOOP_LAG_MS = 5000

/**
 * 计算一帧事件循环延迟并过滤宿主挂起假象。
 * 取 5000：前台真实卡顿几乎不会连续 5s 不出让事件循环（已接近 ANR 会被系统杀进程），
 * 5s 以内保留为「真卡顿」，5s 以上视为后台冻结/断点/OS 挂起。
 */
export function computeEventLoopLag(
  now: number,
  lastTickAt: number,
  intervalMs: number,
  maxValidLagMs = MAX_VALID_EVENT_LOOP_LAG_MS
): number {
  if (!lastTickAt) return 0 // 首帧无基线
  const lag = now - lastTickAt - intervalMs
  if (lag <= 0) return 0 // 准时或提前
  if (lag > maxValidLagMs) return 0 // 宿主挂起假象，不计入
  return lag
}
```

面板把这些数据用纯 `View` 画的迷你柱状图实时展示，并按阈值着色——比如每分钟 `GC` 超 `30` 次标红、事件循环延迟超 `150ms` 标红。下面是真机 `Release` 包上这个面板的实际样子：

![App 内置内存监控面板真机截图：运行环境、内存占用、GC、界面卡顿、Hermes Sampling Profile 录制](https://s.poetries.top/uploads/2026/05/0655a371da9f4cca.jpg)

截图里一眼能读到几个关键信号：当前是 `Hermes` 引擎的**正式包真机**（绿色标注，说明数据 production-representative，可信）；进程内存稳定在 `338.5 MB`、峰值 `338.8 MB`（没有持续上涨，排除泄漏）；但"每分钟回收次数 `53.8`、近 10 秒回收 `9` 次、回收耗时 `60ms`"全部标红——`GC` 太频繁，这就是发热的直接嫌疑，说明有高频对象分配（往往是高频 `JSON.parse`）在烧 `CPU`；界面卡顿当前 `4ms`、最大 `16ms` 是绿的，说明此刻主线程还扛得住。底部 `Hermes Sampling Profile` 的 `Backend` 显示 `native (release-profiler)`、状态"采样中 3s"——正在录 `.cpuprofile`，停止后导出就能解出 `JS` 函数名看火焰图。一张截图把"内存有没有泄漏 / `GC` 烫不烫 / 主线程卡不卡 / 正在不正在录制"四件事全交代了。

测试同学一边操作一边就能看到"是不是这个页面 `GC` 在狂飙"，比事后翻日志直观一百倍。`getInstrumentedStats` 这种 `Hermes` 内部接口在官方 `Hermes` 文档里有说明，是稳定可用的。

## 八、前后对比与验收阈值

性能优化最怕"凭感觉"。每次改完都要拿同一台设备、同一套操作脚本，跑 `Instruments` + `pymobiledevice3` 两路数据，填进一张前后对比表。下面是我那次行情页优化的真实验收阈值（`iPhone 16 Pro Max` / `iOS 26.4.2` / `Release` 包 `60s` 静置）：

| 指标                             | 优化前基线 | 目标           | 数据源             |
| -------------------------------- | ---------- | -------------- | ------------------ |
| 主线程 CPU %                     | 51%        | ≤ 30%          | Instruments        |
| JS 线程 CPU %                    | 36%        | ≤ 25%          | Instruments        |
| CPU usage mean %                 | 100.5%     | ≤ 30%          | pymobiledevice3    |
| CPU usage p95 %                  | 156.5%     | ≤ 80%          | pymobiledevice3    |
| mach syscalls / s                | 14000      | ≤ 3000         | pymobiledevice3    |
| context switch / s               | 4723       | ≤ 1500         | pymobiledevice3    |
| `mountingTransaction` inclusive  | 92s        | ≤ 30s          | Instruments 关键字 |
| `reanimated`+`worklet` inclusive | 207s       | ≤ 80s          | Instruments 关键字 |
| Core Animation FPS（稳态期）     | 0~60 震荡  | ≥ 55 持续      | Instruments        |
| Thermal State                    | Nominal    | Nominal 不退化 | 系统状态           |

把基线归档进 `git`（比如 `reports/perf/baseline-2026-05-24/`），之后每次改造跑一次 `yarn perf:diff:ios reports/perf/after-xxx --auto`，退出码非 0 就别合并。这套机制让"性能没回归"从一句口头承诺变成了一条 `CI` 流水线上的硬门禁。

## 九、一条可复制的完整操作流程

工具讲完了，但真正能落地的是把它们串成一条「从用户报发热到给出优化结论」的标准作业流程。下面这条 `SOP` 我每次性能任务都照着走，不用重新设计，你可以直接抄成团队的排查清单。

![React Native 真机性能调优五阶段闭环流程：复现圈定、采基线、定位热点、改一刀验一刀、验收进 CI](https://s.poetries.top/uploads/2026/05/bebfc76af7c8d848.jpg)

**阶段 0 ｜ 复现与圈定（约 10 分钟）**

1. 真机装 `Release` / 灰度包，唤出 `App` 内置监控面板浮窗
2. 按用户反馈路径操作，盯面板三个数：内存是否只涨不回落、`GC` 每分钟次数、最大卡顿
3. 同时用开发包的 `Perf Monitor` 看 `JS FPS`，圈出一滑就掉到 30 以下的页面
4. 把能稳定复现的「页面 + 操作步骤」写下来——**后面每次采样都必须用这同一套脚本**，否则前后数据没有可比性

**阶段 1 ｜ 采基线（iOS）**

5. 终端 A 起隧道：`yarn perf:ios:tunneld`（保持窗口开着）
6. 终端 B 采 60s：`tools/perf/capture.sh 60 com.example.app reports/perf/baseline-YYYYMMDD`
7. 生成结构化数据：`python3 tools/perf/analyze.py reports/perf/baseline-YYYYMMDD`
8. 再用 `Xcode Profile → Time Profiler + Core Animation FPS` 录 30-60s，导出 `Call Tree` 文本
9. 把 `baseline` 目录归档进 `git`（`Android` 端并行跑 `yarn perf:android`，看 `gfxinfo` 的 `Janky` / `meminfo` 的 `PSS` / `thermal`）

**阶段 2 ｜ 定位热点**

10. 把 `Call Tree` 文本 + `stats.json` 一起丢给 `AI`，按 `inclusive` 时间排序找 top 关键字
11. `Release` 包要看 `JS` 函数名时，监控面板点「开始采样」录 `.cpuprofile`，`yarn perf:profile:local <path>` 解出火焰图
12. 收敛到 3-5 个明确热点（精确到函数名或 `trace` 关键字），其余的先放着

**阶段 3 ｜ 改一刀验一刀**

13. **一次只改一个热点**，绝不"一次改五处再一起测"
14. 重新采样并对比：`yarn perf:diff:ios reports/perf/baseline-YYYYMMDD reports/perf/after-xxx --auto`
15. `diff` 退出码 0 且目标关键字 `inclusive` 真降了，这刀就保留；没降或反而恶化，立刻回滚换思路
16. 回到第 13 步处理下一个热点，直到阈值表全绿

**阶段 4 ｜ 验收并接进 CI**

17. 全部改完对照阈值表逐项核对，把 `baseline` / `after` / `diff.txt` 三份数据写进 `PR` 描述
18. 把 `diff.py` 的退出码接进 `CI` gate——以后任何人提交导致性能回归，流水线直接红灯挡住合并

这条流程的灵魂是阶段 3 的「改一刀验一刀」闭环：性能优化最容易翻车的就是一口气改一堆，最后分不清是哪改生效、哪改帮了倒忙。逼自己每次只动一处、每处都有前后 `diff` 背书，慢一点，但每一步都踩实。

## 十、最佳实践清单

把这些年踩出来的经验浓缩成几条可执行的规则：

- **测性能只认真机 `Release` 包**，模拟器和 `Debug` 包的数据没有参考价值，反而误导。
- **两条数据源强制互补**：`Instruments` 看 `RN` 内部分布，命令行采集看长稳 + 进 `CI`，缺一不可。
- **`Release` 包要看 `JS` 函数名只能靠 `release-profiler`**，`Instruments` 看不到 `Hermes` 字节码里的 `JS` 符号。
- **监控面板只在测试/灰度包挂载**，用 `__DEV__` 或编译期开关确保生产包被 `DCE`，监控本身不能成为新的性能负担。
- **事件循环延迟一定要过滤后台挂起假象**，否则 `Max Lag` 全是几十秒的噪音。
- **每次优化都走"采基线→改→再采→`diff`"闭环**，凭感觉优化等于没优化。
- **`iOS 17+` 命令行采集记得绕过 `localhost` 代理 + 用 `Python 3.13`**，这俩坑能让你卡一下午。

## 总结

真机性能定位的本质，是把"用户说手机烫"这种主观抱怨，翻译成一组可测量、可对比、可自动判定的客观指标。`iOS` 这边用 `Xcode Instruments` 看 `RN bridge` 内部、用 `react-native-release-profiler` 补上 `Hermes` 火焰图盲区、用 `pymobiledevice3` 搭一条可进 `CI` 的长稳采集线；`Android` 这边 `adb dumpsys` 一把梭抓 `gfxinfo` / `meminfo` / `thermal`；再给 `App` 内置一个实时内存 + `GC` + 事件循环延迟的监控面板覆盖真实操作场景。四层手段从粗到细、从开发期到 `CI`，最后用一张前后对比阈值表把"优化是否生效"钉死。

工具和脚本只是手段，真正的价值在于把性能这件事**流程化、自动化、可回归**。下一篇我会接着讲，拿到这些数据之后，怎么把行情列表那几个"永不停的 `CPU` 黑洞"一个个打掉，让股票行情在高频推送下也能稳稳跑满 `60` 帧。

## 参考

- [React Native Performance 官方文档](https://reactnative.dev/docs/performance)
- [Hermes Engine 官方文档](https://hermesengine.dev/)
- [react-native-release-profiler](https://github.com/margelo/react-native-release-profiler)
- [pymobiledevice3](https://github.com/doronz88/pymobiledevice3)
- [Android dumpsys gfxinfo 官方文档](https://developer.android.com/topic/performance/measuring-performance)
- [Profiling with Xcode Instruments](https://developer.apple.com/documentation/xcode/improving-your-app-s-performance)
