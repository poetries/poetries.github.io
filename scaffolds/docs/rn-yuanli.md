---
title: React Native之原理浅析
date: 2019-10-02 18:30:12
tags: 
 - RN
 - react
categories: Front-End
---

## 一、JavaScriptCore

> 讲React Native之前，了解JavaScriptCore会有帮助，也是必要的。React Native的核心驱动力就来自于JS Engine. 你写的所有JS和JSX代码都会被JS Engine来执行, 没有JS Engine的参与，你是无法享受ReactJS给原生应用开发带来的便利的。在iOS上，默认的就是JavaScriptCore， iOS 7之后的设备都支持. iOS 不允许用自己的JS Engine. JavaScriptCore来自于WebKit, 所以，安卓上默认也是用JavaScriptCore

> 你深入了解`React Native`的第一站应该是 `JavaScriptCore`

- `JavaScriptCore`在`iOS`平台上给`React Native`提供的接口也仅限于那几个接口，你弄明白了`JavaScriptCore`那几个接口, React Native 剩下的魔法秘密都可以顺藤摸瓜来分析了。
- 接下来要讲解的就是Facebook围绕这几个接口以及用一个React来颠覆整个native开发所做的精妙设计和封装

## 二、浏览器工作原理

- 浏览器通过`Dom Render`来渲染所有的元素.
- 浏览器有一整套的UI控件，样式和功能都是按照html标准实现的
- 浏览器能读懂html和css。
- html告诉浏览器绘制什么控件(html tag)，css告诉浏览器每个类型的控件(html tag)具体长什么样。
- 浏览器的主要作用就是通过解析html来形成dom树，然后通过css来点缀和装饰树上的每一个节点

**UI的描述和呈现分离开了**

1. html文本描述了页面应该有哪些功能，css告诉浏览器该长什么样。
2. 浏览器引擎通过解析html和css，翻译成一些列的预定义UI控件，
3. 然后UI控件去调用操作系统绘图指令去绘制图像展现给用户。
4. Javascript可有可无，主要用于html里面一些用户事件响应，DOM操作、异步网络请求和一些简单的计算

> 在react native 里面，1和2是不变的，也是用html语言描述页面有哪些功能，然后stylesheet告诉浏览器引擎每个控件应该长什么样。并且和浏览器用的是同一个引擎

> 在步骤3里面UI控件不再是浏览器内置的控件，而是`react native`自己实现的一套UI控件（两套，android一套，ios一套），这个切换是在`MessageQueque`中进行的，并且还可以发现，他们tag也是不一样的

**Javascript在react native里面非常重要**

- 它负责管理UI component的生命周期，管理Virtual DOM
- 所有业务逻辑都是用javascript来实现或者衔接
- 调用原生的代码来操纵原生组件。
- Javascript本身是无绘图能力的，都是通过给原生组件发指令来完成

## 三、React Native 架构

![](https://poetries1.gitee.io/img-repo/2019/10/680.jpeg)

- 绿色的是我们应用开发的部分。我们写的代码基本上都是在这一层
- 蓝色代表公用的跨平台的代码和工具引擎，一般我们不会动蓝色部分的代码
- 黄色代码平台相关的代码，做定制化的时候会添加修改代码。不跨平台，要针对平台写不同的代码。iOS写OC, android写java，web写js. 每个bridge都有对应的js文件，js部分是可以共享的，写一份就可以了。如果你想做三端融合，你就得理解这一个东西。如果你要自己定制原生控件，你就得写bridge部分
- 红色部分是系统平台的东西。红色上面有一个虚线，表示所有平台相关的东西都通过bridge隔离开来了
- 大部分情况下我们只用写绿色的部分，少部分情况下会写黄色的部分。你如果对基础架构和开源感兴趣，你可以写蓝色部分，然后尝试给那些大的开源项目提交代码。红色部分是独立于React Native的

## 四、React Native、React和JavascriptCore的关系

> React Native最重要的三个概念应该就是`React Native`、`React`和`JavascriptCore`

- React是一个纯JS库，所有的React代码和所有其它的js代码都需要JS Engine来解释执行。因为种种原因，浏览器里面的JS代码是不允许调用自定义的原生代码的，而React又是为浏览器JS开发的一套库，所以，比较容易理解的事实是React是一个纯JS库，它封装了一套Virtual Dom的概念，实现了数据驱动编程的模式，为复杂的Web UI实现了一种无状态管理的机制, 标准的HTML/CSS之外的事情，它无能为力。调用原生控件，驱动声卡显卡，读写磁盘文件，自定义网络库等等，这是JS/React无能为力的
- 你可以简单理解为React是一个纯JS 函数， 它接受特定格式的字符串数据，输出计算好的字符串数据
- JS Engine负责调用并解析运行这个函数
- `React Native`呢？ 它比较复杂。复杂在哪里？前面我们说了React 是纯JS库，意味着React只能运行JS代码，通过JS Engine提供的接口(Html Tag)绘制html支持的那些元素，驱动有限的声卡显卡。简单点说, React只能做浏览器允许它做的事情, 不能调用原生接口， 很多的事情也只能干瞪眼

**React Native它可不一样**

- 第一点，驱动关系不一样。前面我们说的是, JS Engine来解析执行React脚本, 所以，React由浏览器(最终还是JS Engine)来驱动. 到了React Native这里，RN的原生代码(Timer和用户事件)驱动JS Engine, 然后JS Engine解析执行React或者相关的JS代码，然后把计算好的结果返回给Native code. 然后, Native code 根据JS计算出来的结果驱动设备上所有能驱动的硬件。重点，所有的硬件。也就是说，在RN这里，JS代码已经摆脱JS Engine(浏览器)的限制，可以调用所有原生接口啦
- 第二点, 它利用React的Virtual Dom和数据驱动编程概念，简化了我们原生应用的开发, 同时，它不由浏览器去绘制，只计算出绘制指令，最终的绘制还是由原生控件去负责，保证了原生的用户体验

**React Native组件结构**

> 驱动硬件的能力决定能一个软件能做多大的事情，有多大的主控性。研究过操作系统底层东西或者汇编的同学明白，我们大部分时候写的代码是受限的代码，很多特权指令我们是没法使用的，很多设备我们是不允许直接驱动的。我们现在的编程里面几乎已经没有人提中断了，没有中断，硬件的操作几乎会成为一场灾难.

在一定程度上，React Native和NodeJS有异曲同工之妙。它们都是通过扩展JavaScript Engine, 使它具备强大的本地资源和原生接口调用能力，然后结合JavaScript丰富的库和社区和及其稳定的跨平台能力，把javascript的魔力在浏览器之外的地方充分发挥出来

**JavaScriptCore + ReactJS + Bridges 就成了React Native**

- `JavaScriptCore`负责JS代码解释执行
- `ReactJS`负责描述和管理`VirtualDom`,指挥原生组件进行绘制和更新，同时很多计算逻辑也在js里面进行。ReactJS自身是不直接绘制UI的，UI绘制是非常耗时的操作，原生组件最擅长这事情。
- `Bridges`用来翻译ReactJS的绘制指令给原生组件进行绘制，同时把原生组件接收到的用户事件反馈给`ReactJS`。
要在不同的平台实现不同的效果就可以通过定制`Bridges`来实现

> 深入 `Bridge` 前面有提到, RN厉害在于它能打通JS和Native Code, 让JS能够调用丰富的原生接口,充分发挥硬件的能力, 实现非常复杂的效果,同时能保证效率和跨平台性。

> 打通RN任督二脉的关键组件就是`Bridge`. 在RN中如果没有Bridge, JS还是那个JS，只能调用JS Engine提供的有限接口，绘制标准html提供的那些效果,那些摄像头，指纹，3D加速,声卡, 视频播放定制等等，JS都只能流流口水，原生的、平台相关的、设备相关的效果做不了， 除非对浏览器进行定制

- Bridge的作用就是给RN内嵌的JS Engine提供原生接口的扩展供JS调用。所有的本地存储、图片资源访问、图形图像绘制、3D加速、网络访问、震动效果、NFC、原生控件绘制、地图、定位、通知等都是通过Bridge封装成JS接口以后注入JS Engine供JS调用。理论上，任何原生代码能实现的效果都可以通过Bridge封装成JS可以调用的组件和方法, 以JS模块的形式提供给RN使用。
- 每一个支持RN的原生功能必须同时有一个原生模块和一个JS模块，JS模块是原生模块的封装，方便Javascript调用其接口。Bridge会负责管理原生模块和对应JS模块之间的沟通, 通过Bridge, JS代码能够驱动所有原生接口，实现各种原生酷炫的效果。
- RN中JS和Native分隔非常清晰，JS不会直接引用Native层的对象实例，Native也不会直接引用JS层的对象实例(所有Native和JS互掉都是通过Bridge层会几个最基础的方法衔接的)。
- `Bridge` 原生代码负责管理原生模块并生成对应的JS模块信息供JS代码调用。每个功能JS层的封装主要是针对ReactJS做适配，让原生模块的功能能够更加容易被用ReactJS调用。`MessageQueue.js`是`Bridge`在JS层的代理，所有JS2N和N2JS的调用都会经过`MessageQueue.js`来转发。JS和Native之间不存在任何指针传递，所有参数都是字符串传递。所有的instance都会被在JS和Native两边分别编号，然后做一个映射,然后那个数字/字符串编号会做为一个查找依据来定位跨界对象。

## 五、Bridge各模块简介

### 5.1 RCTRootView

- `RCTRootView`是`React Native`加载的地方,是万物之源。从这里开始，我们有了JS Engine, JS代码被加载进来，对应的原生模块也被加载进来，然后js loop开始运行。 js loop的驱动来源是Timer和Event Loop(用户事件). js loop跑起来以后应用就可以持续不停地跑下去了。
- 如果你要通过调试来理解RN底层原理，你也应该是从RCTRootView着手，顺藤摸瓜。
- 每个项目的`AppDelegate.m`的- (BOOL)application:didFinishLaunchingWithOptions:里面都可以看到RCTRootView的初始化代码，RCTRootView初始化完成以后，整个React Native运行环境就已经初始化好了，JS代码也加载完毕，所有React的绘制都会有这个RCTRootView来管理。

**RCTRootView做的事情如下**

- 创建并且持有`RCTBridge`
- 加载`JS Bundle`并且初始化JS运行环境.
- 初始化JS运行环境的时候在App里面显示`loadingView`, 注意不是屏幕顶部的那个下拉悬浮进度提示条. RN第一次加载之后每次启动非常快，很少能意识到这个加载过程了。loadingView默认情况下为空, 也就是默认是没有效果的。loadingView可以被自定义，直接覆盖RCTRootView.loadingView就可以了.开发模式下RN app第一次启动因为需要完整打包整个js所以可以很明显看到加载的过程，加载第一次以后就看不到很明显的加载过程了，可以执行下面的命令来触发重新打包整个js来观察`loadingView`的效果 `watchman watch-del-all && rm -rf node_modules/ && yarn install && yarn start – –reset-cache`, 然后杀掉`app`重启你就会看到一个很明显的进度提示.
- `JS`运行环境准备好以后把加载视图用`RCTRootContentView`替换加载视图
- 有准备工作就绪以后调用`AppRegistry.runApplication`正式启动RN JS代码，从`Root Component()`开始UI绘制

> 一个App可以有多个`RCTRootView`, 初始化的时候需要手动传输`Bridge`做为参数，全局可以有多个`RCTRootView`, 但是只能有一个`Bridge`

> 如果你做过`React Native`和原生代码混编，你会发现混编就是把`AppDelegate`里面那段初始化`RCTRootView`的代码移动到需要混编的地方，然后把`RCTRootView`做为一个普通的`subview`来加载到原生的`view`里面去，非常简单。不过这地方也要注意处理好单Bridge实例的问题，同时，混编里面要注意`RCTRootView`如果销毁过早可能会引发JS回调奔溃的问题

### 5.2 RCTRootContentView

- `RCTRootContentView reactTag`在默认情况下为1. 在`Xcode view Hierarchy debugger` 下可以看到，最顶层为`RCTRootView`, 里面嵌套的是`RCTRootContentView`, 从`RCTRootContentView`开始，每个View都有一个`reactTag`
- `RCTRootView`继承自UIView, RCTRootView主要负责初始化`JS Environment`和React代码，然后管理整个运行环境的生命周期。 `RCTRootContentView`继承自`RCTView`, `RCTView`继承自UIView, RCTView封装了React Component Node更新和渲染的逻辑， `RCTRootContentView`会管理所有react ui components. `RCTRootContentView`同时负责处理所有touch事件

### 5.3 RCTBridge

> 这是一个加载和初始化专用类，用于前期JS的初始化和原生代码的加载

- 负责加载各个Bridge模块供JS调用
- 找到并注册所有实现了`RCTBridgeModule protocol`的类, 供JS后期使用.
- 创建和持有 `RCTBatchedBridge`

### 5.4 RCTBatchedBridge

> 如果RCTBridge是总裁, 那么RCTBatchedBridge就是副总裁。前者负责发号施令，后者负责实施落地

- 负责Native和JS之间的相互调用(消息通信)
- 持有`JSExecutor`
- 实例化所有在RCTBridge里面注册了的`native node_modules`
- 创建JS运行环境, 注入`native hooks` 和`modules`, 执行 JS bundle script
- 管理JS run loop, 批量把所有JS到native的调用翻译成`native invocations`
- 批量管理原生代码到JS的调用，把这些调用翻译成JS消息发送给`JS executor`

### 5.5 RCTJavaScriptLoader

> 这是实现远程代码加载的核心。热更新，开发环境代码加载，静态`jsbundle`加载都离不开这个工具。

- 从指定的地方(`bundle`, `http server`)加载 `script bundle`
- 把加载完成的脚本用`string`的形式返回
- 处理所有获取代码、打包代码时遇到的错误

### 5.6 RCTContextExecutor

- 封装了基础的JS和原生代码互掉和管理逻辑，是JS引擎切换的基础。通过不同的RCTCOntextExecutor来适配不同的JS Engine，让我们的React JS可以在iOS、Android、chrome甚至是自定义的js engine里面执行。这也是为何我们能在chrome里面直接调试js代码的原因
- 管理和执行所有N2J调用

### 5.7 RCTModuleData

- 加载和管理所有和JS有交互的原生代码。把需要和JS交互的代码按照一定的规则自动封装成JS模块
- 收集所有桥接模块的信息，供注入到JS运行环境

### 5.8 RCTModuleMethod

> 记录所有原生代码的导出函数地址(JS里面是不能直接持有原生对象的)，同时生成对应的字符串映射到该函数地址。JS调用原生函数的时候会通过message的形式调用过来

- 记录所有的原生代码的函数地址，并且生成对应的字符串映射到该地址
- 记录所有的block的地址并且映射到唯一的一个id
- 翻译所有`J2N call`，然后执行对应的native方法

> - 如果是原生方法的调用则直接通过方法名调用，MessageQueue会帮忙把Method翻译成MethodID, 然后转发消息给原生代码，传递函数签名和参数给原生MessageQueue, 最终给RCTModuleMethod解析调用最终的方法
> - 如果JS调用的是一个回调block，MessageQueue会把回调对象转化成一个一次性的block id, 然后传递给RCTModuleMethod, 最终由RCTModuleMethod解析调用。基本上和方法调用一样，只不过生命周期会不一样，block是动态生成的，要及时销毁，要不然会导致内存泄漏

> 实际上是不存在原生MessageQueue对象模块的，JS的MessageQueue对应到原生层就是RCTModuleData & RCTModuleMethod的组合, MessageQueue的到原生层的调用先经过RCTModuleData和RCTModuleMethod翻译成原生代码调用，然后执行

### 5.9 MessageQueue

- 这是核心中的核心。整个react native对浏览器内核是未做任何定制的，完全依赖浏览器内核的标准接口在运作。它怎么实现UI的完全定制的呢？它实际上未使用浏览器内核的任何UI绘制功能，注意是未使用UI绘制功能。它利用javascript引擎强大的DOM操作管理能力来管理所有UI节点，每次刷新前把所有节点信息更新完毕以后再给yoga做排版，然后再调用原生组件来绘制。javascript是整个系统的核心语言。
- 我们可以把浏览器看成一个盒子，javascript引擎是盒子里面的总管，DOM是javascript引擎内置的，javascript和javascript引擎也是无缝链接的。react native是怎么跳出这个盒子去调用外部原生组件来绘制UI的呢？秘密就在MessageQueue。
- javascript引擎对原生代码的调用都是通过一套固定的接口来实现，这套接口的主要作用就是记录原生接口的地址和对应的javascript的函数名称，然后在javascript调用该函数的时候把调用转发给原生接口

## 六、React Native 初始化

> `React Native`的初始化从`RootView`开始，默认在`AppDelegate.m:- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions ` 里面会有`RootViewd`的初始化逻辑，调试的时候可以从这里入手

**React Native的初始化分为几个步骤**

- 原生代码加载
- `JS Engine`初始化(生成一个空的JS引擎)
- JS基础设施初始化. 主要是require等基本模块的加载并替换JS默认的实现。自定义`require`, `Warning window`, `Alert window`, `fetch`等都是在这里进行的。基础设施初始化好以后就可以开始加载js代码了
- 遍历加载所有要导出给JS用的原生模块和方法, 生成对应的JS模块信息，打包成json的格式给JS Engine, 准确地说是给MessageQueue. 

**这里需要提一下的是**

> 这里的导出是没有对象的，只有方法和模块。JS不是一个标准的面向对象语言，刚从Java转JavaScript的同学都会在面向对象这个概念上栽跟头，这里特别提醒一下

### 6.1 原生代码初始化

> 这里讨论的主要是RN相关的原生代码和用户自定义的RN模块的原生代码的加载和初始化。原生代码初始化主要分两步

- 静态加载。iOS没有动态加载原生代码的接口，所有的代码都在编译的初期就已经编译为静态代码并且链接好，程序启动的时候所有的原生代码都会加载好。这是原生代码的静态加载，iOS里面没有动态加载原生代码的概念，这也是为何没有静态代码热更新的原因
- RN模块解析和注入JS。这是加载的第二步。在RootView初始化的时候会遍历所有被标记为RCTModule的原生模块，生成一个json格式的模块信息，里面包含模块名称和方法名称，然后注入到JS Engine, 由MessageQueue记录下来。原生代码在生成json模块信息的时候同时会在原生代码这边维护一个名称字典，用来把模块和方法的名称映射到原生代码的地址上去，用于JS调用原生代码的翻译

### 6.2 Javascript环境初始化


- RN的初始化是从RCRootView开始的，所有的绘制都会在这个RootView里面进行(Alert除外)
- RootView做的第一件事情就是初始化一个空的JS Engine。 这个空的JS Engine里面包含一些最基础的模块和方法(fetch, require, alert等), 没有UI绘制模块。 RN的工作就是替换这些基础的模块和方法，然后把RN的UI绘制模块加载并注入到JS Engine.

**JS Engine不直接管理UI的绘制**

- 所有的绘制由原生控制的UI事件和Timer触发
- 影响界面刷新的事件发生以后一部分直接由原生控件消化掉，直接更新原生控件。剩下的部分会通过`Bridge`派发给MessageQueue，然后在JS层进行业务逻辑的计算，再由`React`来进行Virtual Dom的管理和更新。`Virtual Dom`再通过MessageQueue发送重绘指令给对应的原生组件进行UI更新

### 6.3 NativeModules加载

- 在OC里面，所有NativeModules要加载进JS Engine都必须遵循一定的协议(protocol)。
- 模块(OC里面的类)需要声明为<RCTBridgeModule>, 然后在类里面还必须调用宏RCT_EXPORT_MODULE() 用来定义一个接口告诉JS当前模块叫什么名字。这个宏可以接受一个可选的参数，指定模块名，不指定的情况下就取类名。
- 对应的JS模块在初始化的时候会调用原生类的[xxx new]方法- 模块声明为`<RCTBridgeModule>`后只是告诉Native Modules这有一个原生模块，是一个空的模块。要导出任何方法给JS使用都必须手动用宏RCT_EXPORT_METHOD来导出方法给JS用.
- 所有的原生模块都会注册到`NativeModules`这一个JS模块下面去，你如果想要让自己的模块成为一个顶级模块就必须再写一个JS文件封装一遍NativeModules里面的方法。
- 你如果想自己的方法导出就默认成为顶级方法，那么你需要一个手动去调用JSC的接口，这个在前面章节有讲解。 不建议这样做，因为这样你会失去跨JS引擎的便利性。
- 你可以导出常量到JS里面去, 模块初始化的时候会坚持用户是否有实现`constantsToExport` 方法, 接受一个常量词典

```
- (NSDictionary *)constantsToExport
{
  return @{ @"firstDayOfTheWeek": @"Monday" };// JS里面可以直接调用 ModuleName.firstDayOfTheWeek获取这个常量
}
```

- 常量只会在初始化的时候调用一次，动态修改该方法的返回值无效
- 所有标记为RCT_EXPORT_MODULE的模块都会在程序启动的时候自动注册好这些模块，主要是记录模块名和方法名。只是注册，不一定会初始化。
- `Native Modules`导出宏具体使用方法见官方文档`Native Modules`


### 6.4 三个线程

> React Native有三个重要的线程:

- Shadow queue. 布局引擎(yoga)计算布局用的
- Main thread. 主线程。就是操作系统的UI线程。无论是iOS还是android，一个进程都只有一个UI线程，我们常说的主线程. React Native所有UI绘制也是由同一个UI线程来维护
- `Javascript thread. javascript`线程。 大家都知道javascript是单线程模型，event驱动的异步模型。React Native用了JS引擎，所以也必需有一个独立的js 线程. 所有JS和原生代码的交互都发生在这个线程里。死锁，异常也最容易发生在这个线程

> 可以看到Shadow queue是queue而不是thread, 在iOS里面queue是thread之上的一层抽象,GCD里面的一个概念，创建queue的时候可以指定是并行的还是串行的。也就是说，一个queue可能对应多个thread

## 七、内部机制

**内部机制**

![](https://poetries1.gitee.io/img-repo/2019/10/681.jpg)

**JS用时序**

![](https://poetries1.gitee.io/img-repo/2019/10/682.png)

## 八、总结

### 8.1 React Native 框架分析

![](https://poetries1.gitee.io/img-repo/2019/10/683.png)

### 8.2 层次架构

- **Java层**：该层主要提供了Android的UI渲染器`UIManager`（将JavaScript映射成`Android Widget`）以及一些其他的功能组件（例如：Fresco、Okhttp）等，在java层均封装为Module，java层核心jar包是react-native.jar，封装了众多上层的interface，如Module，Registry，bridge等
- **C++层**：主要处理Java与JavaScript的通信以及执行JavaScript代码工作，该层封装了JavaScriptCore，执行对js的解析。基于`JavaScriptCore`，`Web`开发者可以尽情使用ES6的新特性，如class、箭头操作符等，而且 React Native运行在`JavaScriptCore`中的，完全不存在浏览器兼容的情况。Bridge桥接了java ， js 通信的核心接口。JSLoader主要是将来自assets目录的或本地file加载javascriptCore，再通过`JSCExectutor`解析js文件
- **Js层**：该层提供了各种供开发者使用的组件以及一些工具库。
`Component`：Js层通js/jsx编写的`Virtual Dom`来构建`Component`或Module，Virtual DOM是DOM在内存中的一种轻量级表达方式，可以通过不同的渲染引擎生成不同平台下的UI。component的使用在 React 里极为重要, 因为component的存在让计算 DOM diff 更高效。
ReactReconciler : 用于管理顶层组件或子组件的挂载、卸载、重绘

> 注：JSCore，即JavaScriptCore，JS解析的核心部分，IOS使用的是内置的`JavaScriptCore`，Androis上使用的是 https://webkit.org 家的jsc.so。

**Java层核心类及原理，如下所示**

**ReactContext**

- ReactContext继承于ContextWrapper，是ReactNative应用的上下文，通过getContext()去获得，通过它可以访问ReactNative核心类的实现。

**ReactInstanceManager**

- `ReactInstanceManager`是ReactNative应用总的管理类，创建`ReactContext`、`CatalystInstance`等类，解析`ReactPackage`生成映射表，并且配合`ReactRootView`管理View的创建与生命周期等功能。

**ReactRootView**

- 为启动入口核心类，负责监听及分发事件并重新渲染元素，App启动后，其将作为App的`root view`。

**CatalystInstance**

- `CatalystInstance`是`ReactNative`应用Java层、C++层、JS层通信总管理类，总管Java层、JS层核心`Module`映射表与回调，三端通信的入口与桥梁。

**JavaScriptModule**

- `JavaScriptModule`是`JS Module`，负责JS到Java的映射调用格式声明，由`CatalystInstance`统一管理。

**NativeModule**

- `NativeModule`是`java Module`，负责Java到Js的映射调用格式声明，由`CatalystInstance`统一管理。

**JavascriptModuleRegistry**

- JS Module映射表,负责将所有JavaScriptModule注册到CatalystInstance，通过Java动态代理调用到Js。

**NativeModuleRegistry**

- 是Java Module映射表,即暴露给Js的API集合。

**CoreModulePackage**

- 定义核心框架模块，创建`NativeModules&JsModules`

### 8.3 启动过程的解析

1. ReactInstanceManager创建时会配置应用所需的java模块与js模块，通过ReactRootView的startReactApplication启动APP。
2. 在创建ReactInstanceManager同时会创建用于加载JsBundle的JSBundlerLoader，并传递给CatalystInstance。
3. CatalystInstance会创建Java模块注册表及Javascript模块注册表，并遍历实例化模块。
4. CatalystInstance通过JSBundlerLoader向Node Server请求Js Bundle，并传递给JSCJavaScriptExectutor，最后传递给javascriptCore，再通过ReactBridge通知ReactRootView完成渲染

### 8.4 Js与Java通信机制

> Java与Js之间的调用，是以两边存在两边存在同一份模块配置表，最终均是将调用转化为{moduleID,methodID，callbackID，args}，处理端在模块配置表里查找注册的模块与方法并调用。

**Java 调用Js**

> Java通过注册表调用到CatalystInstance实例，透过ReactBridge的jni，调用到Onload.cpp中的callFunction，最后通过javascriptCore，调用BatchedBridge.js，根据参数｛moduleID,methodID｝require相应Js模块执行。流程如下图：

![](https://poetries1.gitee.io/img-repo/2019/10/684.png)

**Js 调用Java**

> 如果消息队列中有等待Java 处理的逻辑，而且 Java 超过 5ms 都没有来取走，那么 JavaScript 就会主动调用 Java 的方法,在需要调用调Java模块方法时，会把参数｛moduleID,methodID｝等数据存在MessageQueue中，等待Java的事件触发，把MessageQueue中的｛moduleID,methodID｝返回给Java，再根据模块注册表找到相应模块处理。流程如下图：

![](https://poetries1.gitee.io/img-repo/2019/10/685.webp)


## 九、更多参考

- [React Native for Android 原理分析与实践：实现原理](https://juejin.im/post/5a6460f8f265da3e4f0a446d)
- [深入剖析 JavaScriptCore](https://www.jianshu.com/p/e220e1f34a0b)