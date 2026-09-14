---
title: React Native 0.87 解读与升级要点
description: React Native 0.87 版本分析，梳理严格 TypeScript API、Metro 性能改进、实验性 SwiftPM 和 AGP 9 支持，结合代码示例说明对现有项目的影响与升级评估重点。
date: 2026-09-10 13:49:55
tags:
  - React Native
  - TypeScript
  - 移动端开发
categories: Front-End
---

> 文章首发于: https://feinterview.poetries.top/blog/react-native-0-87-release-overview

本文围绕四个问题展开：

- 严格 `TypeScript API` 成为默认后，哪些报错需要修改业务代码？
- `Metro` 的性能提升落在哪一段开发流程，应该怎样验证？
- `SwiftPM` 给 `iOS` 工程带来了什么，又有哪些试用边界？
- 接入 `AGP 9` 时，为什么还要保留兼容配置？

升级 `React Native` 时，真正占时间的往往是依赖和工程配置：一个旧的内部路径导入、一段原生构建脚本，都可能卡住整个过程。2026 年 8 月 11 日发布的 `React Native 0.87`，恰好集中调整了这些位置。这篇文章基于[官方发布公告](https://reactnative.dev/blog/2026/08/11/react-native-0.87)做版本解读，并给出便于评估改动范围的小例子；侧重解释变化及其影响，不承诺一套命令就能迁移所有项目。

![React Native 0.87 的严格类型、Metro、SwiftPM 与 AGP 9 更新概览](https://s.poetries.top/uploads/2026/09/65381cfe1152d2f9.jpg)

## 一、先按影响范围看这次更新

把公告里的变化映射到日常工作，可以得到这样一张表：

| 关注方向 | 先检查什么 | 谁更需要关注 |
| --- | --- | --- |
| 类型与公开接口 | 业务导入路径、组件引用、依赖暴露的类型 | 应用开发者、组件库维护者 |
| 开发工具 | 配置文件、调试加载时间、开发机内存 | 经常调试大体量应用的团队 |
| `iOS` 依赖管理 | 原生库的接入方式、工程定制、干净环境构建 | 原生集成负责人 |
| `Android` 工程 | 插件版本、构建脚本、持续集成环境 | 构建与发布负责人 |

这张表也是我建议的评估顺序：先找到项目实际依赖了什么，再决定要测试哪些变化。一个主要使用公开组件的小应用，和维护多个自定义原生模块的工程，即使从同一版本升级，工作量也会相差很大。

尤其不要把“依赖安装成功”当作升级终点。类型检查、打包、原生编译、实际交互，各自只能验证一部分问题。把它们拆开记录，失败时才能知道应该找业务代码、第三方库，还是构建环境。

## 二、严格类型 API 把公开接口边界落到了工具里

### 为什么需要从源码生成类型

`React Native` 的实现使用 `Flow`，而大量应用使用 `TypeScript`。过去单独维护的类型声明，相当于在实现之外再维护一份接口说明：实现和说明更新不同步，就会出现“编辑器说能用，实际行为却对不上”的情况。从源码生成类型的方向，在 `0.80` 的[稳定 JavaScript API 设计说明](https://reactnative.dev/blog/2025/06/12/moving-towards-a-stable-javascript-api)中已经提出。

我的理解是，这项工作的价值在维护阶段更明显。开发者可以把类型错误当作检查接口使用方式的入口，库维护者也能更清楚地知道哪些东西属于公开契约。一个内部文件恰好能被导入，并不意味着它适合成为长期依赖。

`0.87` 默认启用严格类型接口。常见调整包括把深层路径导入改为根入口导入，以及为组件引用使用专门的实例类型。下面以 `TextInput` 为例，只展示导入路径的变化：

```diff
- import TextInput from 'react-native/Libraries/Components/TextInput/TextInput';
+ import {TextInput} from 'react-native';
```

这个替换适用于根入口已有对应导出的情况。遇到只有内部实现、没有公开替代的能力，需要重新检查用途，不能把每个路径都机械地改成同名根导出。

### 组件引用该怎么写

下面是一个完整的组件示例：输入框引用使用 `TextInputInstance`，按钮点击时调用实例的 `focus()` 方法。

```tsx
import {useRef} from 'react';
import {Button, TextInput, View} from 'react-native';
import type {TextInputInstance} from 'react-native';

export default function SearchField() {
  const inputRef = useRef<TextInputInstance>(null);

  return (
    <View>
      <TextInput ref={inputRef} placeholder="输入关键词" />
      <Button
        title="开始输入"
        onPress={() => inputRef.current?.focus()}
      />
    </View>
  );
}
```

这里明确区分了用于渲染的组件和用于调用方法的实例。已有的 `React.ComponentRef<typeof TextInput>` 也仍然有效，无须为了统一写法全部替换。具体规则见[严格类型 API 的引用迁移说明](https://reactnative.dev/docs/strict-typescript-api#refs-now-use-instance-types)。

![React Native 严格类型接口将内部路径导入迁移到公开入口和 TextInputInstance](https://s.poetries.top/uploads/2026/09/06b3cdb23742c247.jpg)

迁移时，我建议先按错误所在文件分组：自己维护的业务组件直接修；依赖相关错误先找兼容版本；历史测试辅助代码单独检查。这样比先添加一批类型断言更容易留下可维护的结果。

还要注意第三方包交付的内容。官方文档建议保留默认的 `skipLibCheck`，但它针对声明文件；如果依赖让应用直接导入原始 `TypeScript` 源文件，例如某个测试入口，这部分仍可能参与应用检查。[迁移前准备说明](https://reactnative.dev/docs/strict-typescript-api#before-you-start)解释了这个边界。

### 临时退出只解决类型检查这一层

确实被依赖阻塞时，可以在现有 `tsconfig.json` 中合并下面的配置；如果已有其他自定义条件，要一并保留：

```json
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": {
    "customConditions": [
      "react-native",
      "react-native-legacy-deep-imports"
    ]
  }
}
```

这个开关会切回旧类型。严格类型模式本身不替换运行时的 `JavaScript`；`0.87` 对 `src/private/*` 导出的移除是另一项会影响运行时的变化，不能靠此配置恢复。参见[官方常见问题](https://reactnative.dev/docs/strict-typescript-api#faqs)。

公告给出的旧类型退出窗口覆盖 `0.88`，并计划在随后版本移除旧类型。若团队采用这个过渡方案，我建议在升级任务中记录具体阻塞依赖和退出条件，避免兼容开关被遗忘。[退出窗口说明](https://reactnative.dev/blog/2026/08/11/react-native-0.87#opting-out)

## 三、Metro 的收益要在开发流程里衡量

本次 `Metro` 从 `0.84` 更新到 `0.87`。官方报告的收益包括：`source map` 生成速度约为此前两倍，因映射存储优化而使 `Metro` 内存占用约减半；`TypeScript` 和 `ESM` 配置支持也进入稳定状态。[Metro 更新说明](https://reactnative.dev/blog/2026/08/11/react-native-0.87#faster-leaner-metro)

这些数字描述的是工具链。它们没有给出应用滚动帧率、启动耗时或手机端内存的相同比例收益。写升级报告时，最好保留指标的对象：开发机上的打包进程，和用户设备上的应用进程，要分别观察。

如果想判断团队是否从中受益，我会做三组对照：

1. 固定业务代码、机器和启动方式，记录冷缓存与热缓存下的打包时间。
2. 打开相同页面和调试工具，记录源码及映射加载完成的时间。
3. 固定一次调试操作路径，记录 `Metro` 进程的峰值内存，多跑几轮观察波动。

这个方案是本文的测量建议，本文没有提供本地性能实测结果。对照时还应记录锁文件和配置差异，否则同时升级了插件或更换了缓存策略，就很难解释收益来自哪里。

配置迁移同样值得单独安排。通用的 [Metro 配置文档](https://metrobundler.dev/docs/configuration/)列出了 `metro.config.mjs`、`metro.config.mts` 等形式，并说明了原生加载 `TypeScript` 配置对 `Node.js` 的要求。选用新格式时，要把配置加载能力纳入开发机和持续集成检查。

另外，通用配置页仍有将 `YAML` 标为弃用的文字，而 `0.87` 公告明确将 `YAML` 和 `.es6` 配置列为移除项。针对这次升级，应按版本公告检查旧配置，并在实际锁定的工具版本下验证加载结果。

如果关注的是应用卡顿，可以接着看站内的[React Native 真机性能定位文章](./react-native-ios-android-device-performance-profiling.md)，把调试效率和真机体验放在各自的测量环节里。

## 四、SwiftPM 值得试验，现有生产工程仍需审慎评估

`Swift Package Manager` 是 `0.87` 新增的实验性 `iOS` 接入路径，默认方案仍是 `CocoaPods`。官方明确要求暂不用于生产。[SwiftPM 发布说明](https://reactnative.dev/blog/2026/08/11/react-native-0.87#experimental-swift-package-manager-support-for-ios)

对团队来说，它值得观察的地方是原生依赖管理能否更贴近 `Xcode` 工作流。不过，工程是否更省心，最终取决于应用里那些原生依赖能否顺利接入，尤其是带自定义脚本和二进制资源的库。

在已经保存改动的独立试验分支中，可以按官方入口尝试切换。注意 `--deintegrate` 会移除工程中的 `CocoaPods` 集成：

```bash
cd ios
npx react-native spm --deintegrate
```

这条命令会修改工程。试验后应检查版本差异、构建应用并验证原生能力；不要把命令退出成功当作所有依赖已经兼容。

需要撤销集成时，官方提供了反向命令。在同一个 `ios` 目录执行：

```bash
npx react-native spm deinit
```

首次克隆和持续集成构建前仍需执行一次 `npx react-native spm`。社区库需要提供 `Package.swift`；缺失时可以尝试官方的 `scaffold` 工具，但生成清单之后仍要验证库的实际构建行为。[SwiftPM 初始化与限制](https://reactnative.dev/blog/2026/08/11/react-native-0.87#experimental-swift-package-manager-support-for-ios)

相关 [RFC #994](https://github.com/react-native-community/discussions-and-proposals/pull/994)也讨论了已有原生应用集成、构建脚本和打包形式。它适合帮助理解设计背景；具体可用范围应以版本公告和实际工具输出为准。

我的建议是选一条有代表性的验证路径，例如“启动应用、打开相机、获取权限、返回业务页”，再加一次全新环境构建。空白工程通过只能证明基础接入可行，加入关键原生依赖后，结果才更接近自己的项目。

## 五、AGP 9 支持需要连同工具链一起看

先把 `React Native 0.87` 公告中的几个版本要求记清楚：

| 项目 | 公告给出的要求或版本 |
| --- | --- |
| `Node.js` | 至少 `22.13.0` |
| `Kotlin` | 最低 `2.0+`，随版本提供的是 `2.2.0` |
| `Android minCompileSdk` | `34` |
| `Android compileSdk` / `buildTools` | 提升到 `37` |

这些数据来自[最低工具链要求](https://reactnative.dev/blog/2026/08/11/react-native-0.87#minimum-toolchain-requirements)。其中编译相关字段不能用来直接推断最低可安装系统版本；评估设备覆盖范围时还要检查应用自身的 `minSdk` 配置。

`AGP 9` 默认带来了内置 `Kotlin` 支持和新的构建配置接口，会影响已有插件如何接入构建过程。Android 官方要求在升级时选择迁移到内置支持或退出该行为，见 [AGP 9 发布说明](https://developer.android.com/build/releases/agp-9-0-0-release-notes)。

`React Native 0.87` 当前建议在 `android/gradle.properties` 中保留下面两项过渡配置：

```properties
android.builtInKotlin=false
android.newDsl=false
```

它们用于退出 `AGP 9` 新增的默认行为。升级时应将这段配置与目标版本的工程差异一起检查，不要只更新插件版本号。[React Native 的 AGP 9 接入建议](https://reactnative.dev/blog/2026/08/11/react-native-0.87#android-gradle-plugin-agp-v9)

我会把构建结果按阶段保存：依赖解析、原生源码编译、资源处理、产物安装。假设本地能够生成调试包，但持续集成的发布包失败，优先比对的应是环境版本、构建变体和第三方插件输出。直接回到业务组件里改代码，通常会偏离报错发生的位置。

## 六、InteractionManager 的替换要保留业务语义

公告还包含若干接口清理，其中 `InteractionManager` 被移除，官方推荐使用 `requestIdleCallback`。但旧代码的用途值得先读一遍：它究竟只是推迟非紧急任务，还是依赖某个动画或交互完成的时机？[接口移除清单](https://reactnative.dev/blog/2026/08/11/react-native-0.87#api-removals)

旧版[InteractionManager 文档](https://reactnative.dev/docs/0.86/interactionmanager)描述了等待交互结束的调度方式；[requestIdleCallback 文档](https://reactnative.dev/docs/global-requestIdleCallback)对应的是空闲任务调度。对明确依赖动画结束的业务，我建议接到所用动画库的完成回调，而不是用空闲时机间接猜测。

下面是可独立使用的非紧急任务队列示例。每个任务都应很短；回调检查剩余时间，在后续空闲时段继续处理：

```ts
export function scheduleSmallTasks(tasks: Array<() => void>) {
  const pending = [...tasks];
  let cancelled = false;
  let handle: ReturnType<typeof requestIdleCallback> | undefined;

  const schedule = () => {
    handle = requestIdleCallback(deadline => {
      while (!cancelled && pending.length > 0) {
        if (deadline.timeRemaining() <= 1) break;
        pending.shift()?.();
      }
      if (!cancelled && pending.length > 0) schedule();
    });
  };

  if (pending.length > 0) schedule();

  return () => {
    cancelled = true;
    if (handle !== undefined) cancelIdleCallback(handle);
  };
}
```

返回函数用于页面卸载或任务作废时取消后续执行。这个示例没有设置超时，只适合允许延后的工作；持续繁忙时可能长时间没有进展。必须及时完成的任务，需要另行设计超时与处理预算。一个已经开始执行的长同步任务也不会被它切开，任务粒度仍要由业务控制。这些限制符合[空闲回调的调度语义](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)。

## 七、把升级评估变成可复查的记录

对于已有项目，我建议先用 [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)选择当前版本和目标版本，阅读模板差异，然后列出项目自己的特殊配置。下面这份清单可以作为评估记录：

![React Native 升级从环境版本、类型检查到双端构建和真机验证的流程](https://s.poetries.top/uploads/2026/09/32b98a499d2a2087.jpg)

- 开发机与持续集成使用的工具版本已经逐项记录。
- 业务代码、测试代码和自定义原生模块中的内部导入已经检查。
- 类型检查通过，或者每个临时兼容项都有明确的阻塞原因。
- 两个平台分别完成实际使用的构建变体，关键原生依赖已验证。
- 登录、输入、键盘、导航、权限请求等核心交互完成回归。
- 性能记录区分开发工具数据和设备端应用数据。
- 试验性依赖管理变更有独立记录，可单独撤销。

这份清单是本文建议，不是官方承诺的完整升级流程。它的作用是让每次失败都能对应到一个已知环节，也让接手的人知道哪些结论已经验证，哪些只是暂时假设。

如果项目通过 `Expo` 管理版本，则应先核对所用 `SDK` 对应的 `React Native` 版本。`0.87` 公告发布时提到的是 `expo@canary`，不能据此推断所有稳定 `SDK` 都已经支持。[公告中的 Expo 说明](https://reactnative.dev/blog/2026/08/11/react-native-0.87#expo)

## 八、总结

我对 `React Native 0.87` 的判断是：它值得认真评估，因为类型契约和原生工具链都会影响后续维护成本。实际安排升级时，先识别项目已有依赖，再逐层验证，会比一次性合并所有新选项更容易定位问题。

对应用开发者，最直接的准备是整理导入、引用类型和旧接口调用；对构建负责人，则是核对环境与原生依赖。把这些工作留下可复查的记录，后续版本升级时就能复用，而不必重新摸索工程为什么能构建。

## 九、参考

- [React Native 0.87 官方发布公告](https://reactnative.dev/blog/2026/08/11/react-native-0.87)
- [严格 TypeScript API 与迁移说明](https://reactnative.dev/docs/strict-typescript-api)
- [稳定 JavaScript API 的设计背景](https://reactnative.dev/blog/2025/06/12/moving-towards-a-stable-javascript-api)
- [Metro 配置文档](https://metrobundler.dev/docs/configuration/)
- [Swift Package Manager RFC #994](https://github.com/react-native-community/discussions-and-proposals/pull/994)
- [Android Gradle Plugin 9 官方发布说明](https://developer.android.com/build/releases/agp-9-0-0-release-notes)
- [React Native requestIdleCallback](https://reactnative.dev/docs/global-requestIdleCallback)
- [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)
