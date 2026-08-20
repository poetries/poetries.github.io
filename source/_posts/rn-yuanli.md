---
title: React Native原理浅析从JavaScriptCore到Bridge
description: 拆开 React Native 的运行原理，讲清 JavaScriptCore 提供了什么、Bridge 如何打通 JS 与原生、MessageQueue 怎么转发调用、三个线程各管什么，以及新架构 JSI 出现后这套模型变成了什么样。
date: 2019-10-02 18:30:12
tags:
  - RN
  - react
  - 原理
categories: Front-End
---

第一次接手 `React Native` 项目的时候我有个疑问一直没想通。写的明明是 `JSX`，跑出来的却是货真价实的原生控件，中间那一步到底是怎么发生的？后来又碰到几次奇怪的问题，动画在 `JS` 线程忙的时候会卡，某个原生方法调过去半天没反应，报错栈里全是 `RCT` 开头的类名。这类问题不理解底层模型是修不掉的，只能靠碰运气。

这篇是我把 `React Native` 运行原理捋了一遍之后的笔记。从 `JavaScriptCore` 这个发动机讲起，到 `Bridge` 怎么把两个世界接上，再到初始化时那几步都发生了什么、三个线程各自在忙什么。最后会补一段现状，因为 2019 年这套基于 `Bridge` 的模型，现在已经被新架构替换掉了。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `JavaScriptCore` 在 `React Native` 里扮演什么角色，为什么 `iOS` 上绕不开它
- 拿浏览器的工作方式做参照，看清 `RN` 到底替换掉了哪一环
- `React Native` 的四层架构分别是什么，哪一层是你会动的
- `React`、`React Native`、`JavaScriptCore` 三者的关系，谁驱动谁
- `Bridge` 的作用，以及为什么 `JS` 和原生之间只能传字符串
- `RCTRootView` 到 `MessageQueue`，`Bridge` 各个模块分别管什么
- `RN` 初始化的四个步骤，从空引擎到第一帧渲染
- `Shadow queue`、主线程、`JS` 线程三条线各自的职责
- `Android` 侧的层次架构和 `Java` 与 `JS` 的双向通信机制
- 新架构（`JSI` / `Fabric` / `TurboModules`）把这套模型改成了什么样

## 一、JavaScriptCore 是这一切的发动机

讲 `React Native` 之前，先得知道 `JavaScriptCore` 是什么，这个绕不过去。

`React Native` 的核心驱动力就来自 `JS` 引擎。你写的所有 `JS` 和 `JSX` 代码都要交给它执行，没有 `JS` 引擎的参与，`React` 那套东西一行都跑不起来。在 `iOS` 上默认用的是系统自带的 `JavaScriptCore`，`iOS 7` 之后的设备都支持。这里有个硬约束，苹果不允许第三方应用带自己的 `JIT` 编译器，所以你没法在 `iOS` 上随意换一个自己的 `JS` 引擎。`JavaScriptCore` 出自 `WebKit`，`Android` 早期也是打包了一份 `JavaScriptCore` 进来用。

所以我一直觉得，深入了解 `React Native` 的第一站应该是 `JavaScriptCore`。

它在 `iOS` 平台上给 `React Native` 提供的接口其实只有那么几个，核心就是「求值一段 `JS` 源码」「往全局对象上注入一个原生函数」「把 `JS` 的返回值转成原生类型」。听着少得可怜，但这几个接口就是全部的入口。把它们弄明白了，`React Native` 剩下的那些看起来像魔法的东西，都可以顺藤摸瓜分析出来。

后面几节要讲的，就是 `Facebook` 围绕这几个接口，加上一个 `React`，做出了怎样一套设计。

## 二、拿浏览器做参照，看清 RN 替换掉了哪一环

理解 `RN` 最快的路子，是先想清楚浏览器怎么干活，然后看 `RN` 在哪一步分了岔。

浏览器的流程大致是这样。它读懂 `HTML` 和 `CSS`，`HTML` 告诉它要画什么控件，`CSS` 告诉它每个控件长什么样。解析 `HTML` 形成 `DOM` 树，再用 `CSS` 去装饰树上的每一个节点。浏览器内部有一整套按 `HTML` 标准实现的 `UI` 控件，最后由这些控件调用操作系统的绘图指令，把像素画到屏幕上。在这个流程里 `JavaScript` 其实可有可无，它主要负责响应用户事件、操作 `DOM`、发异步请求、做点简单计算。

这套设计最值钱的地方，是把「`UI` 的描述」和「`UI` 的呈现」分开了。

拆成四步看更清楚。第一步，`HTML` 文本描述页面有哪些元素，`CSS` 描述它们该长什么样。第二步，浏览器引擎解析这两者，翻译成一系列预定义的 `UI` 控件。第三步，`UI` 控件调用操作系统绘图指令绘制图像展现给用户。第四步，`JavaScript` 在旁边处理交互逻辑。

`React Native` 保留了第一步和第二步的思路。你依然是用一种声明式的语法描述页面有哪些元素，用 `StyleSheet` 描述它们长什么样，而且执行这套逻辑的还是同一个 `JS` 引擎。

分岔发生在第三步。

`RN` 里的 `UI` 控件不再是浏览器内置的那套，而是自己实现的一套原生控件，`Android` 一套、`iOS` 一套。这个切换动作是在 `MessageQueue` 里完成的，顺带你会发现两端控件的 `tag` 命名也不一样。所以最终画到屏幕上的是货真价实的原生控件，不是模仿原生外观的网页元素，这也是 `RN` 相比 `WebView` 方案在体验上的根本优势。

那 `JavaScript` 的地位就完全不同了。在浏览器里它是配角，在 `RN` 里它是绝对的主角。它负责管理 `UI` 组件的生命周期，管理 `Virtual DOM`，所有业务逻辑都靠它实现或者衔接，还要负责调用原生代码去操纵原生组件。有一点要记住，`JavaScript` 自己是没有任何绘图能力的，它做的全部事情就是算出「该画成什么样」，然后把指令发给原生组件去画。

记住这句话，后面讲 `Bridge` 的时候会反复回到它。

## 三、React Native 的四层架构

下面这张图把 `RN` 的分层画得很清楚，用颜色区分了每一层由谁负责。

![React Native 架构分层图，绿色为业务代码，蓝色为跨平台引擎，黄色为平台相关的 bridge，红色为系统平台](https://s.poetries.top/gitee/2019/10/680.jpeg)

绿色是应用开发的部分，也就是你写的业务代码，日常 90% 的时间都花在这一层。

蓝色是公用的跨平台代码和工具引擎，`React` 本身、`Virtual DOM` 的调和逻辑、`Yoga` 布局引擎都在这里。这层一般不会动，除非你要给上游提 `PR`。

黄色是平台相关的代码，做定制化的时候会在这里增删。它不跨平台，得针对每个平台单独写，`iOS` 写 `Objective-C`，`Android` 写 `Java`，`Web` 写 `JS`。不过每个 `bridge` 都有一个对应的 `JS` 文件，这部分是可以共享的，写一份就够了。要做三端融合，你必须理解这一层；要自己封装一个原生控件给 `JS` 用，你写的就是这一层。

红色是系统平台本身，`UIKit`、`Android View` 体系、各种系统服务。注意红色上面那条虚线，它表示所有平台相关的东西都被 `bridge` 隔在了外面，上层看不到具体平台。

分层的价值就在那条虚线上。它意味着你可以在完全不碰红色和黄色的前提下，写出一个能同时跑在两端的应用。

## 四、React、React Native 和 JavaScriptCore 的关系

这三个名字经常被混着说，理清它们的关系是理解 `RN` 的关键。

`React` 是一个纯 `JS` 库。所有 `React` 代码和其它 `JS` 代码一样，都需要 `JS` 引擎来解释执行。因为安全模型的限制，浏览器里的 `JS` 代码不允许调用自定义的原生代码，而 `React` 最初就是为浏览器 `JS` 开发的一套库。它封装了一套 `Virtual DOM` 的概念，实现了数据驱动的编程模式，为复杂的 `Web UI` 提供了一种状态管理机制。标准 `HTML` 和 `CSS` 之外的事情，它无能为力。调用原生控件、驱动摄像头、读写磁盘文件、自定义网络库，这些 `React` 都做不到。

可以简单把 `React` 理解成一个纯函数，接受特定格式的数据，输出计算好的描述数据。`JS` 引擎负责调用并运行这个函数。

那 `React Native` 呢？它复杂得多，复杂在两个地方。

第一点是驱动关系反过来了。在浏览器里，是 `JS` 引擎驱动 `React` 脚本执行，`React` 最终由浏览器驱动。到了 `React Native` 这里，是原生代码（`Timer` 和用户事件）在驱动 `JS` 引擎，`JS` 引擎解析执行 `React` 和相关的 `JS` 代码，把计算好的结果返回给原生代码，然后原生代码根据这个结果去驱动设备上所有能驱动的硬件。注意是所有硬件。在 `RN` 这里，`JS` 代码已经摆脱了浏览器沙箱的限制，能调用任何原生接口。

第二点是绘制方式不一样。它利用 `React` 的 `Virtual DOM` 和数据驱动模式简化了原生应用的开发，但它自己不负责绘制，只算出绘制指令，最终的绘制交给原生控件，用户体验和纯原生是一致的。

顺着上面聊，驱动硬件的能力决定了一个软件能做多大的事。写过底层或者汇编的同学都清楚，我们平时写的大多是受限代码，很多特权指令用不了，很多设备不允许直接驱动。`RN` 干的就是把这道限制在 `JS` 侧打开。

从这个角度看，`React Native` 和 `Node.js` 有异曲同工之妙。两者都是通过扩展 `JavaScript` 引擎，让它具备调用本地资源和原生接口的能力，然后借助 `JavaScript` 丰富的生态和稳定的跨平台特性，把 `JS` 的能力发挥到浏览器之外的地方去。

所以可以把等式写成这样，`JavaScriptCore` 加 `React` 加 `Bridge`，就是 `React Native`。

- `JavaScriptCore` 负责 `JS` 代码的解释执行
- `React` 负责描述和管理 `Virtual DOM`，指挥原生组件绘制和更新，大量计算逻辑也在 `JS` 里进行。它自身不直接绘制 `UI`，因为绘制是非常耗时的操作，原生组件最擅长这事
- `Bridge` 负责把 `React` 的绘制指令翻译给原生组件，同时把原生组件收到的用户事件反馈回 `React`。要在不同平台实现不同效果，定制 `Bridge` 就行

### 4.1 深入 Bridge

前面反复提到，`RN` 厉害的地方在于它打通了 `JS` 和原生代码，让 `JS` 能调用丰富的原生接口，充分发挥硬件能力，同时保证效率和跨平台性。

打通这条路的关键组件就是 `Bridge`。

如果没有 `Bridge`，`JS` 还是那个 `JS`，只能调用引擎提供的有限接口。摄像头、指纹、`3D` 加速、声卡、视频播放定制这些东西，`JS` 一个都摸不着，原生的、平台相关的、设备相关的效果统统做不了。

`Bridge` 的作用就是给 `RN` 内嵌的 `JS` 引擎扩展出一批原生接口供 `JS` 调用。本地存储、图片资源访问、图形绘制、网络访问、震动、`NFC`、原生控件绘制、地图、定位、通知，全都是通过 `Bridge` 封装成 `JS` 接口之后注入引擎的。理论上任何原生代码能实现的效果，都可以通过 `Bridge` 封装成 `JS` 能调用的组件和方法。

具体的组织方式是这样的。每一个支持 `RN` 的原生功能，必须同时有一个原生模块和一个 `JS` 模块，`JS` 模块是原生模块的封装，方便 `JavaScript` 调用。`Bridge` 负责管理这两者之间的沟通。

有一个设计细节很关键，`RN` 里 `JS` 和原生的分隔非常干净。`JS` 不会直接持有原生层的对象实例，原生也不会直接持有 `JS` 层的对象实例，所有互调都要经过 `Bridge` 层那几个最基础的方法转接。

那两边的对象是怎么对上号的呢？

答案是编号加映射。`JS` 和原生两边分别给所有实例编号，维护一张映射表，跨界调用时传的是那个数字或字符串编号，接收方拿编号去表里查找对应的真实对象。`JS` 和原生之间不存在任何指针传递，所有参数都是序列化成字符串传过去的。

`MessageQueue.js` 是 `Bridge` 在 `JS` 层的代理，所有 `JS` 调原生和原生调 `JS` 的请求都要经过它转发。这个「所有跨界调用都必须序列化成字符串再走一遍队列」的设计，是老架构性能瓶颈的根源，也是后来新架构要解决的核心问题，第十二节会展开。

## 五、Bridge 各模块分别在管什么

上一节讲的是 `Bridge` 的设计思路，这一节拆开看具体由哪些类承担。下面这些是 `iOS` 侧老架构的类名，`Android` 侧概念对应但命名不同，第十一节会讲。

### 5.1 RCTRootView

`RCTRootView` 是 `React Native` 加载的地方，可以说是万物之源。从这里开始才有了 `JS` 引擎，`JS` 代码被加载进来，对应的原生模块也被加载进来，然后 `JS` 的事件循环开始运行。这个循环的驱动来源是 `Timer` 和用户事件，一旦跑起来，应用就可以持续不停地运转下去。

如果你想通过调试来理解 `RN` 底层原理，也应该从 `RCTRootView` 着手往下摸。

每个项目的 `AppDelegate.m` 里，`application:didFinishLaunchingWithOptions:` 方法中都能看到 `RCTRootView` 的初始化代码。这个初始化一完成，整个 `React Native` 运行环境就绪，`JS` 代码也加载完毕，之后所有 `React` 的绘制都由它来管。

它具体做四件事。创建并持有 `RCTBridge`；加载 `JS Bundle` 并初始化 `JS` 运行环境；`JS` 环境就绪后用 `RCTRootContentView` 替换掉加载视图；最后调用 `AppRegistry.runApplication` 正式启动 `JS` 代码，从根组件开始绘制 `UI`。

中间那个加载视图值得单独说一下。初始化 `JS` 运行环境的时候，`App` 里会显示一个 `loadingView`，注意不是屏幕顶部那条下拉的悬浮进度提示条。`RN` 第一次加载之后每次启动都非常快，一般感知不到这个过程。`loadingView` 默认为空，也就是默认没有任何视觉效果，你可以直接覆盖 `RCTRootView.loadingView` 来自定义。

想看清楚它长什么样，可以强制触发一次完整的重新打包。

```bash
# 清掉所有缓存，让开发模式下重新完整打包一次 JS
watchman watch-del-all && rm -rf node_modules/ && yarn install && yarn start --reset-cache
```

跑完之后杀掉 `App` 重启，就能看到一个很明显的加载过程了。

还有两个细节。一个 `App` 里可以有多个 `RCTRootView`，初始化时需要手动把 `Bridge` 作为参数传进去。全局可以有多个 `RCTRootView`，但只能有一个 `Bridge`。

另一个是混编。如果你做过 `RN` 和原生代码的混合开发，会发现所谓混编就是把 `AppDelegate` 里那段初始化 `RCTRootView` 的代码搬到需要混编的地方，然后把 `RCTRootView` 当成一个普通 `subview` 加到原生的 `view` 里去，就这么简单。要注意的是别搞出多个 `Bridge` 实例，另外 `RCTRootView` 如果销毁过早，正在飞行中的 `JS` 回调可能会导致崩溃。

### 5.2 RCTRootContentView

`RCTRootContentView` 的 `reactTag` 默认是 1。在 `Xcode` 的 `View Hierarchy Debugger` 里能看到，最顶层是 `RCTRootView`，里面嵌套的是 `RCTRootContentView`，从它开始每个 `View` 都带一个 `reactTag`。这个 `tag` 就是前面说的「编号映射」在视图层的体现，`JS` 侧发绘制指令时指的就是这个编号。

两者的继承关系和分工不同。`RCTRootView` 继承自 `UIView`，主要负责初始化 `JS` 环境和 `React` 代码，管理整个运行环境的生命周期。`RCTRootContentView` 继承自 `RCTView`，`RCTView` 再继承自 `UIView`，它封装了 `React` 组件节点更新和渲染的逻辑，管理所有 `React UI` 组件，同时负责处理所有触摸事件。

### 5.3 RCTBridge

这是一个加载和初始化专用类，负责前期 `JS` 的初始化和原生代码的加载。

它干三件事，加载各个 `Bridge` 模块供 `JS` 调用；找到并注册所有实现了 `RCTBridgeModule` 协议的类；创建和持有 `RCTBatchedBridge`。

### 5.4 RCTBatchedBridge

如果说 `RCTBridge` 是发号施令的那个，`RCTBatchedBridge` 就是干活落地的那个。

它负责原生和 `JS` 之间的相互调用，也就是消息通信本身。它持有 `JSExecutor`，实例化所有在 `RCTBridge` 里注册过的原生模块，创建 `JS` 运行环境并注入原生钩子和模块，然后执行 `JS bundle`。跑起来之后它管理 `JS` 的运行循环，批量把 `JS` 到原生的调用翻译成原生调用，也批量把原生到 `JS` 的调用翻译成消息发给 `JS executor`。

名字里的 `Batched` 是重点。跨界调用不是一次一发的，而是攒一批一起发。因为每次跨界都要序列化再反序列化，单次开销不小，攒批能显著降低总开销。这个设计也解释了为什么老架构下 `JS` 调原生天然是异步的，你没法同步拿到返回值。

### 5.5 RCTJavaScriptLoader

这是实现远程代码加载的核心。热更新、开发环境的代码加载、静态 `jsbundle` 的加载，都离不开它。

它从指定位置（本地 `bundle` 文件或者 `HTTP` 服务器）加载脚本，把加载完的内容以字符串形式返回，并处理获取和打包过程中遇到的所有错误。开发时 `Metro` 提供的那个 `HTTP` 服务，就是被它读取的。

### 5.6 RCTContextExecutor

它封装了 `JS` 和原生代码互调的基础逻辑，是 `JS` 引擎可替换的基础。通过换用不同的 `Executor` 来适配不同的 `JS` 引擎，同一份 `React` 代码可以在 `iOS`、`Android`、`Chrome` 甚至自定义引擎里执行。当年能在 `Chrome` 里直接调试 `JS` 代码，靠的就是这个抽象，把执行环境换成了 `Chrome` 的 `V8`。

它同时负责管理和执行所有原生调 `JS` 的请求。

### 5.7 RCTModuleData

它加载和管理所有与 `JS` 有交互的原生代码，按固定规则把这些代码自动封装成 `JS` 模块，并收集所有桥接模块的信息用于注入 `JS` 运行环境。

### 5.8 RCTModuleMethod

`JS` 里是不能直接持有原生对象的，那 `JS` 怎么知道该调哪个原生函数呢？

靠这个类。它记录所有原生导出函数的地址，同时生成对应的字符串映射到该地址。`JS` 调用原生函数的时候，实际发过来的是一条消息，由它翻译成真正的方法调用。它还会记录所有 `block` 的地址并映射到唯一的 `id`。

两种调用的处理略有不同。如果是普通原生方法，`MessageQueue` 会把方法名翻译成 `MethodID`，连同函数签名和参数一起转发给原生侧，最终由 `RCTModuleMethod` 解析并调用。

如果 `JS` 传过去的是一个回调函数，`MessageQueue` 会把它转成一个一次性的 `block id` 传给原生侧。流程和方法调用差不多，区别在生命周期。`block` 是动态生成的，用完必须及时销毁，不然会内存泄漏。这个坑在写自定义原生模块时很容易踩到，回调只调用一次就得释放，重复调用同一个回调 `id` 会直接崩。

补充一点，原生层其实并不存在一个叫 `MessageQueue` 的对象模块。`JS` 侧的 `MessageQueue` 对应到原生层，就是 `RCTModuleData` 和 `RCTModuleMethod` 这一对组合。

### 5.9 MessageQueue

这是核心中的核心，前面每一节都绕不开它，这里正式讲。

先说一个容易被忽略的事实。整个 `React Native` 没有对 `JS` 引擎做任何定制，完全依赖引擎的标准接口在运作。那它是怎么实现完全自定义的 `UI` 的呢？

答案是它压根没使用引擎附带的任何 `UI` 绘制功能。它利用 `JavaScript` 强大的对象管理能力来维护所有 `UI` 节点，每次刷新前把节点信息在 `JS` 侧更新完毕，交给 `Yoga` 做排版计算，然后调用原生组件去绘制。`JavaScript` 是整个系统的核心语言，但它只负责算，不负责画。

可以把 `JS` 引擎想象成一个封闭的盒子。引擎是盒子里的总管，`DOM`（在浏览器环境里）是引擎内置的，两者无缝连接。`React Native` 要跳出这个盒子去调用外部的原生组件，秘密就在 `MessageQueue`。

它的实现方式并不神秘。引擎对原生代码的调用都走一套固定接口，这套接口做的事就是记录原生接口的地址和对应的 `JS` 函数名，然后在 `JS` 调用该函数时把调用转发给原生接口。

所以 `MessageQueue` 就是那个盒子上唯一的洞。所有的跨界流量都从这里过，这也是为什么老架构下它一旦被打爆，整个应用就开始卡。

## 六、React Native 的初始化过程

`React Native` 的初始化从 `RootView` 开始。默认在 `AppDelegate.m` 的 `application:didFinishLaunchingWithOptions:` 方法里能找到 `RootView` 的初始化逻辑，调试的时候从这里入手最直接。

整个过程分四步。

第一步，原生代码加载。第二步，`JS` 引擎初始化，生成一个空的引擎实例。第三步，`JS` 基础设施初始化，主要是加载 `require` 这类基本模块并替换掉引擎默认的实现，自定义的 `require`、警告窗口、`Alert` 窗口、`fetch` 都是在这一步替换的，基础设施就绪之后才能开始加载业务 `JS` 代码。第四步，遍历所有要导出给 `JS` 的原生模块和方法，生成对应的模块信息，打包成 `JSON` 格式交给 `JS` 引擎，准确地说是交给 `MessageQueue`。

这里有个概念要澄清。导出过去的东西里没有对象，只有模块名和方法名。`JS` 不是一个标准的面向对象语言，刚从 `Java` 转过来的同学最容易在这里栽跟头，以为原生那边的实例能直接拿到手里用，实际拿到的只是一串名字。

### 6.1 原生代码初始化

这里说的是 `RN` 自身的原生代码，加上你自定义的原生模块，它们的加载分两步走。

第一步是静态加载。`iOS` 没有动态加载原生代码的接口，所有代码在编译期就已经编译成静态代码并链接好，程序启动时全部一次性加载完。这也正是 `iOS` 上没法做原生代码热更新的原因，`JS` 部分能热更，原生部分不行。

第二步是模块解析和注入。在 `RootView` 初始化时，会遍历所有被标记为 `RCTModule` 的原生模块，生成一份 `JSON` 格式的模块信息，里面包含模块名称和方法名称，然后注入到 `JS` 引擎，由 `MessageQueue` 记下来。与此同时，原生这边也会维护一个名称字典，把模块名和方法名映射到真正的函数地址上，这就是第 5.8 节讲的那套翻译机制的数据来源。

两边各存一份表，靠名字对上号，跨界调用才成立。

### 6.2 JavaScript 环境初始化

`RN` 的初始化从 `RCTRootView` 开始，所有绘制都在这个 `RootView` 里进行（`Alert` 是个例外，它走的是系统弹窗）。

`RootView` 做的第一件事是初始化一个空的 `JS` 引擎。这个空引擎里只有最基础的模块和方法，`fetch`、`require`、`alert` 之类，完全没有 `UI` 绘制能力。`RN` 接下来要做的就是替换掉这些基础模块，再把自己的 `UI` 绘制模块注入进去。

那 `UI` 到底是被谁驱动着刷新的呢？

不是 `JS` 引擎。所有绘制都由原生侧的 `UI` 事件和 `Timer` 触发。一个会影响界面的事件发生之后，一部分会被原生控件直接消化掉，就地更新原生控件，根本不惊动 `JS`（比如 `ScrollView` 的滚动）。剩下的部分通过 `Bridge` 派发给 `MessageQueue`，在 `JS` 层跑业务逻辑，由 `React` 做 `Virtual DOM` 的管理和 `diff`，算出变更之后再通过 `MessageQueue` 把重绘指令发回给对应的原生组件。

这一来一回就是 `RN` 的完整渲染回路。理解了它，你就明白为什么 `JS` 线程一卡，动画和交互就跟着卡。

### 6.3 NativeModules 是怎么加载的

在 `Objective-C` 里，所有原生模块要被加载进 `JS` 引擎，都必须遵循一套约定。

模块类需要声明实现 `RCTBridgeModule` 协议，然后在类实现里调用 `RCT_EXPORT_MODULE()` 宏，这个宏定义了一个接口来告诉 `JS` 当前模块叫什么名字。它接受一个可选参数用来指定模块名，不指定就取类名。对应的 `JS` 模块在初始化时会调用原生类的 `new` 方法。

只声明协议还不够，那样得到的是一个空模块。要把方法导出给 `JS` 用，必须手动用 `RCT_EXPORT_METHOD` 宏一个一个导出。

所有原生模块都会挂在 `NativeModules` 这一个 `JS` 模块下面。如果你想让自己的模块成为一个顶级模块，得再写一个 `JS` 文件把 `NativeModules` 里的方法包一层。这也是社区里所有原生库的标准做法，你 `import` 的那个 `JS` 文件就是这层包装。

理论上你也可以直接调 `JavaScriptCore` 的接口把方法注入成全局函数，但不建议，那样会失去跨引擎的便利性，换到 `Android` 或者别的引擎上就得重写。

除了方法，常量也能导出。模块初始化时会检查你有没有实现 `constantsToExport` 方法，实现了就把返回的字典注入过去。

```objectivec
- (NSDictionary *)constantsToExport
{
  return @{ @"firstDayOfTheWeek": @"Monday" };// JS里面可以直接调用 ModuleName.firstDayOfTheWeek获取这个常量
}
```

这里有个坑要注意，常量只在初始化时读取一次，之后动态改这个方法的返回值是不会生效的。需要动态变化的值应该做成方法而不是常量。

还有一点，所有标记了 `RCT_EXPORT_MODULE` 的模块在程序启动时都会自动完成注册，注册的内容主要是模块名和方法名。注册不等于初始化，模块实例是懒加载的，第一次被 `JS` 调用时才真正创建。这个设计对启动性能很重要，几十个原生模块要是启动时全部实例化，冷启动会明显变慢。

导出宏的完整用法以官方的 `Native Modules` 文档为准。

### 6.4 三个线程各管什么

`React Native` 里有三条重要的执行线，搞混它们是性能问题排查不下去的常见原因。

`Shadow queue`，布局引擎 `Yoga` 计算布局用的。`JS` 侧算出节点树之后，排版计算在这里做，算完的结果才交给主线程去应用。

`Main thread`，主线程，也就是操作系统的 `UI` 线程。无论 `iOS` 还是 `Android`，一个进程只有一个 `UI` 线程，`React Native` 所有 `UI` 绘制也由它维护。任何耗时操作放到这里，界面就直接冻住。

`JavaScript thread`，`JS` 线程。`JavaScript` 是单线程、事件驱动的异步模型，`RN` 用了 `JS` 引擎，所以必须有一条独立的 `JS` 线程。所有 `JS` 和原生代码的交互都发生在这条线上，死锁和异常也最容易出在这里。

有个命名上的细节值得留意，`Shadow queue` 是 `queue` 不是 `thread`。在 `iOS` 里 `queue` 是 `thread` 之上的一层抽象，属于 `GCD` 的概念，创建时可以指定并行还是串行。也就是说一个 `queue` 背后可能对应多个 `thread`。

排查卡顿的时候，先分清是主线程卡还是 `JS` 线程卡，两者的优化方向完全不同。具体怎么分别测这两条线的占用，我在[React Native 真机性能调优实战](https://feinterview.poetries.top/blog/react-native-ios-android-device-performance-profiling)里写过完整的方法。

## 七、内部机制与调用时序

把前面几节的东西合起来看，整体的内部机制是这样的。

![React Native 内部机制示意图，展示 JS 层、Bridge 层与原生层的协作关系](https://s.poetries.top/gitee/2019/10/681.jpg)

图里最值得盯的是中间那条 `Bridge`。上面的 `JS` 层和下面的原生层之间没有任何直连的通道，所有交互都必须穿过它，而且穿过时数据要序列化一次。

再看一次调用的时序。

![React Native 中 JS 调用的时序图，展示一次跨界调用的完整流转过程](https://s.poetries.top/gitee/2019/10/682.png)

时序图能看清一个关键事实，`JS` 发出的调用不会立刻执行，它先进队列，等一个批次凑齐或者时机到了才统一发过去，原生执行完再把结果排队发回来。这就是老架构下一切跨界调用都是异步的根本原因。

明白了这一点，很多现象就说得通了。比如为什么读一个原生模块的值也得写成 `async`，为什么手势跟手的动画不用 `Reanimated` 那类方案就一定会飘，都是因为中间隔着这条队列。

## 八、Android 侧的框架结构

前面几节主要是从 `iOS` 侧的类名讲的，`Android` 这边概念对应但组织方式不同，值得单独看一遍。

![React Native 框架分析图，展示 Java 层、C++ 层与 JS 层的整体结构](https://s.poetries.top/gitee/2019/10/683.png)

`Android` 侧分成三层，`Java` 层、`C++` 层、`JS` 层。

**Java 层**主要提供 `Android` 的 `UI` 渲染器 `UIManager`，负责把 `JavaScript` 描述的节点映射成真正的 `Android Widget`，另外还有一批功能组件，比如图片加载的 `Fresco`、网络请求的 `OkHttp`。这些在 `Java` 层统一封装为 `Module`。核心 `jar` 包是 `react-native.jar`，里面封装了上层用到的各种接口，`Module`、`Registry`、`Bridge` 之类。

**C++ 层**主要处理 `Java` 与 `JavaScript` 的通信，以及执行 `JavaScript` 代码。这一层封装了 `JavaScriptCore`，负责对 `JS` 的解析。因为跑在 `JavaScriptCore` 里而不是浏览器里，你可以放心用 `ES6` 的新特性，`class`、箭头函数这些，完全不存在浏览器兼容问题。`Bridge` 是这一层桥接 `Java` 和 `JS` 通信的核心接口，`JSLoader` 负责把来自 `assets` 目录或本地文件的脚本加载进 `JavaScriptCore`，再由 `JSCExecutor` 解析执行。

**JS 层**提供各种供开发者使用的组件和工具库。这一层用 `JS` 和 `JSX` 编写的 `Virtual DOM` 来构建组件，`Virtual DOM` 是 `DOM` 在内存中的一种轻量表达，同一份描述可以通过不同的渲染引擎生成不同平台下的 `UI`。组件这个概念在 `React` 里极为重要，正是因为有它，计算 `diff` 才能做得高效。`ReactReconciler` 负责管理顶层组件和子组件的挂载、卸载、重绘。

补充一句关于引擎的。`JSCore` 就是 `JavaScriptCore`，`JS` 解析的核心部分。`iOS` 用的是系统内置的那份，`Android` 上早期打包的是来自 https://webkit.org 的 `jsc.so`。后来 `Hermes` 成为默认引擎之后，这一块换掉了，第十二节会说。

### 8.1 Java 层的核心类

这几个类名在读 `Android` 侧源码和看崩溃栈时会反复出现，先混个脸熟。

`ReactContext` 继承自 `ContextWrapper`，是 `React Native` 应用的上下文，通过 `getContext()` 获得，拿到它就能访问 `RN` 各个核心类的实现。

`ReactInstanceManager` 是应用总的管理类，负责创建 `ReactContext` 和 `CatalystInstance`，解析 `ReactPackage` 生成映射表，并配合 `ReactRootView` 管理 `View` 的创建和生命周期。

`ReactRootView` 是启动入口的核心类，负责监听和分发事件并重新渲染元素。`App` 启动后它就是整个应用的根视图，地位和 `iOS` 侧的 `RCTRootView` 对应。

`CatalystInstance` 是 `Java` 层、`C++` 层、`JS` 层三端通信的总管理类，总管两侧的核心模块映射表与回调，是三端通信的入口和桥梁。它对应的就是 `iOS` 侧 `RCTBridge` 加 `RCTBatchedBridge` 那一套。

`JavaScriptModule` 负责声明 `JS` 到 `Java` 的映射调用格式，`NativeModule` 负责声明 `Java` 到 `JS` 的映射调用格式，两者都由 `CatalystInstance` 统一管理。

`JavaScriptModuleRegistry` 是 `JS` 模块映射表，负责把所有 `JavaScriptModule` 注册到 `CatalystInstance`，通过 `Java` 动态代理调用到 `JS` 侧。`NativeModuleRegistry` 是 `Java` 模块映射表，也就是暴露给 `JS` 的 `API` 集合。

`CoreModulePackage` 定义核心框架模块，负责创建那批内置的 `NativeModules` 和 `JsModules`。

### 8.2 启动过程速览

把上面这些类串起来，一次冷启动大致是这么走的。

`ReactInstanceManager` 创建时配置好应用所需的 `Java` 模块与 `JS` 模块，然后通过 `ReactRootView` 的 `startReactApplication` 启动应用。创建 `ReactInstanceManager` 的同时会创建用于加载 `JS Bundle` 的 `JSBundleLoader`，传递给 `CatalystInstance`。`CatalystInstance` 创建 `Java` 模块注册表和 `JavaScript` 模块注册表，遍历实例化模块。最后 `CatalystInstance` 通过 `JSBundleLoader` 拿到 `JS Bundle`（开发模式下向 `Metro` 服务请求，正式包从 `assets` 读），传给 `JSCJavaScriptExecutor`，最终交给 `JavaScriptCore` 执行，再通过 `ReactBridge` 通知 `ReactRootView` 完成渲染。

这一节只是给个轮廓。每一步的源码细节、具体调用了哪些方法、`C++` 那一层是怎么接住的，我单独写了一篇[React Native 启动流程](https://feinterview.poetries.top/blog/rn-start-progress)逐行拆过，想跟着源码走一遍的可以看那篇。这篇偏重「架构是怎么设计的」，那篇偏重「一次冷启动代码是怎么跑的」，两篇配着看会顺很多。

## 九、Java 与 JS 的双向通信

通信机制的核心，是两边各存一份同样的模块配置表。

所有调用最终都会被转化成一个四元组，`{moduleID, methodID, callbackID, args}`。接收端拿着这个四元组去自己的模块配置表里查找注册过的模块与方法，找到之后调用。整个过程不传对象、不传指针，只传编号和序列化后的参数，这就是第四节说的那套设计在具体实现上的样子。

### 9.1 Java 调用 JS

`Java` 侧通过注册表调用到 `CatalystInstance` 实例，透过 `ReactBridge` 的 `JNI` 层调到 `OnLoad.cpp` 中的 `callFunction`，最后通过 `JavaScriptCore` 调用 `BatchedBridge.js`，根据参数里的 `moduleID` 和 `methodID` 找到相应的 `JS` 模块执行。

![Java 调用 JS 的完整流程图，从注册表经 JNI 到 BatchedBridge.js](https://s.poetries.top/gitee/2019/10/684.png)

### 9.2 JS 调用 Java

反方向要绕一点。`JS` 需要调用 `Java` 模块方法时，会把 `moduleID`、`methodID` 这些数据先存进 `MessageQueue`，等待 `Java` 侧的事件触发时把队列内容取走，再根据模块注册表找到相应模块处理。

这里有个兜底机制。如果消息队列里有等待 `Java` 处理的逻辑，而 `Java` 侧超过 `5ms` 都没来取走，那么 `JavaScript` 会主动去调 `Java` 的方法把队列推过去。

![JS 调用 Java 的完整流程图，经 MessageQueue 排队后由 Java 侧取走执行](https://s.poetries.top/gitee/2019/10/685.webp)

这个「攒批加超时兜底」的设计是老架构的典型特征。它把大量零碎的跨界调用合并成少数几次，总开销确实降下来了，代价是每一次调用都天然带上了延迟，而且延迟不可预测。手势跟手这类对延迟极度敏感的场景，在这套模型下先天吃亏。

## 十、这套模型现在变成了什么样

上面讲的全部是老架构，也就是社区里说的 `Bridge` 架构。这套东西在 2019 年是全部，现在已经不是了。必须把现状说清楚，不然照着这篇去理解新项目会对不上。

变化的起点是 `JSI`（`JavaScript Interface`）。它是一层用 `C++` 写的轻量接口，让 `JS` 侧可以直接持有原生对象的引用并同步调用，不再需要把一切序列化成 `JSON` 塞进队列。前面反复强调的「所有跨界调用必须序列化、必须异步、必须排队」这三条限制，从根上被拆掉了。

在 `JSI` 之上长出了两块新东西。`TurboModules` 是原生模块的新形态，模块按需加载，调用可以同步返回，启动时不用再一次性注入那张大 `JSON` 表。`Fabric` 是新的渲染系统，用 `C++` 实现的 `ShadowTree` 取代了原来跨越 `Java` 和 `C++` 的那套节点管理，`JS` 侧和原生侧共享同一棵树，`commit` 和 `mount` 的流程也重写了。

引擎那边也换了。`Hermes` 是专门为 `React Native` 做的 `JS` 引擎，编译期就把 `JS` 预编译成字节码，省掉了运行时的解析开销，冷启动和内存占用都比 `JavaScriptCore` 好。它现在是默认引擎。

所以这篇里的 `RCTBatchedBridge`、`MessageQueue` 攒批、`5ms` 超时兜底这些细节，在新架构下要么已经不存在，要么走的是完全不同的路径。

那这篇还有价值吗？我觉得有。

理解老架构的意义在于，它把「跨语言边界调用」这个问题的难点暴露得非常清楚，序列化成本、异步不可避免、批处理与延迟的权衡。新架构解决的正是这些问题，你要是没见过问题长什么样，也就体会不到 `JSI` 解决的到底是什么。而且线上还有大量项目跑在老架构上，看到 `RCT` 开头的崩溃栈时，这篇里的类名对照表是能直接用上的。

具体到某个版本上新架构的启用方式、`API` 名称和迁移步骤，以官方文档为准，这块变化很快，我不敢按记忆写。

## 总结

把整篇串一遍。`React Native` 的底子是一个 `JS` 引擎，`iOS` 上早期用系统的 `JavaScriptCore`，`Android` 上打包一份进来。它只提供了「执行 `JS`」和「注入原生函数」这几个基础能力。

在这之上，`React` 负责用 `Virtual DOM` 描述界面并算出变更，但它自己不画；原生侧提供两套真正的 `UI` 控件负责画；中间靠 `Bridge` 把两边接起来。`Bridge` 的实现方式是两边各存一份模块映射表，跨界时只传编号和序列化后的参数，不传对象也不传指针，`MessageQueue` 是这条通道在 `JS` 侧的唯一出入口。

初始化的顺序是原生代码静态加载、创建空的 `JS` 引擎、替换基础设施、注入模块信息表，然后 `AppRegistry.runApplication` 拉起第一帧。运行起来之后三条线各干各的，`JS` 线程算逻辑，`Shadow queue` 算布局，主线程画像素。

`Bridge` 这套设计最大的代价是所有跨界调用都得序列化并异步排队，这也正是新架构用 `JSI` 要解决的问题。老架构的知识没有白学，它是理解新架构为什么长成那样的前提。

如果你想接着往下走，建议顺着[React Native 启动流程](https://feinterview.poetries.top/blog/rn-start-progress)把一次冷启动的源码路径走一遍，那是把这篇的架构图落到具体函数上最有效的方式。

## 参考

- [React Native 新架构官方文档](https://reactnative.dev/architecture/overview)
- [React Native Native Modules 官方文档](https://reactnative.dev/docs/native-modules-intro)
- [Hermes 引擎官方文档](https://hermesengine.dev/)
- [Yoga 布局引擎官网](https://www.yogalayout.dev/)
- [JavaScriptCore 官方参考](https://developer.apple.com/documentation/javascriptcore)
- [React Native 启动流程](https://feinterview.poetries.top/blog/rn-start-progress)
- [前端进阶之旅](https://interview.poetries.top)
