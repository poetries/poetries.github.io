---
title: React Native图片宽高与字体的平台适配实战
description: React Native 双端适配落地笔记，讲清 Platform.OS 分支、API 文档里的 android/ios 标记、@2x@3x 倍图规则、PixelRatio 与 Dimensions 换算宽高字号，并修掉老工具函数里一处判断写错的坑。
date: 2019-10-02 12:50:12
tags:
  - RN
  - react
  - 移动端适配
categories: Front-End
---

同一份 `React Native` 代码，装到 iPhone 上标题栏顶进了状态栏，换到一台 720p 的老安卓上，字又小得看不清。这类问题在模拟器上很难一次暴露干净，你手边能开的分辨率就那么几种，真机一到就全冒出来了。适配这事说难不难，麻烦在于它散在四五个地方，平台判断、`API` 的双端支持、图标倍图、字号和间距的换算，漏掉任意一块都会露馅。

这篇把这几块串成一条线讲清楚，从最基础的 `Platform.OS` 一直到基于 `PixelRatio` 的等比换算工具，最后还会把老工具函数里一处一直没被发现的判断错误改掉。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 为什么 RN 写了一遍代码还是要做双端适配，适配到底在补哪个缺口
- 用 `Platform.OS` 和 `Platform.select` 做平台分支，以及它们的取舍
- 怎么读懂官方 API 文档里那些 `android` / `ios` 前缀标记
- 组件选型时该怎么判断一个组件是不是真的双端可用
- 图标的 `1x` / `2x` / `3x` 倍图规则，以及引用时最容易犯的那个错
- 用 `PixelRatio` + `Dimensions` 写一套字号和宽高的等比换算工具
- 老版工具函数里那处 `PixelRatio === 2` 的判断为什么永远不成立
- 这套 2019 年的写法放到现在，哪些该换、哪些还能用

## 一、RN 的适配到底在补什么缺口

先把概念理顺，后面的 `API` 才不会记成八股。

`React Native` 里写的所有尺寸数字都是无单位的。你写 `width: 100`，`iOS` 上它是 `100pt`，`Android` 上它是 `100dp`。这两个单位背后是同一个思路，就是「与设备无关的逻辑像素」，系统会拿设备的像素密度把它换算成真正的物理像素。所以你不需要像写 `CSS` 那样纠结 `px` 还是 `rem`，`RN` 已经帮你抹掉了一层。

那既然抹掉了，为什么还要适配呢？

因为 `RN` 只抹平了「像素密度」，没抹平另外三件事。一是屏幕的逻辑宽高本身不一样，`iPhone SE` 是 320pt 宽，`iPhone 11 Pro Max` 是 414pt 宽，同样写 `width: 300` 在两台机器上占的视觉比例差了一大截。二是两个系统的原生行为不一样，比如 `iOS` 的根视图默认是顶到状态栏下面的，`Android` 不是。三是 `API` 本身就有单端独占的部分。

所以适配要干的活其实就三样，判断平台、按比例换算、给资源准备多套倍图。下面一个个说。

## 二、Platform.OS 做平台分支

最直接的一招就是运行时判断当前平台。原文里那个状态栏的例子非常典型。

在 `iOS` 上，如果你没有用 `SafeAreaView` 之类的容器包一层，根视图默认会占据状态栏的位置，导航栏的内容就会和时间、电量图标糊在一起。`Android` 上系统会自己留出状态栏的空间，不需要你补。于是就有了这种写法，给 `StatusBar` 的外层容器按平台设一个高度。

```html
<View style={{height: Platform.OS === 'ios' ? 20:0}}>
    <StatusBar {...this.props.statusBar} />
</View>;
```

这里的 `20` 是那个年代 `iOS` 状态栏的经典高度。这个数字现在已经不能写死了，后面第八节会展开说。

如果分支不止一个属性，用三元表达式会很快糊掉。`Platform.select` 更适合成块的样式，它接收一个以平台名为键的对象，返回当前平台对应的那份。

```js
import { Platform } from 'react-native'

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: { paddingTop: 20, shadowOpacity: 0.2 },
      android: { paddingTop: 0, elevation: 4 }
    })
  }
})
```

这个写法的好处是把两端的差异集中在一处，别人接手时一眼能看出「这里两端不一样」。散在各处的三元判断就没这个效果了。

还有一种更彻底的做法是按文件名分平台，同一个组件写成 `Toast.ios.js` 和 `Toast.android.js`，引用时只写 `import Toast from './Toast'`，打包器会自动挑对应平台的那份。差异大到样式分支已经写不动的时候，用这招比在一个文件里塞满 `if` 干净得多。

## 三、留意 API 文档里的 android 和 ios 标记

并不是所有 `React Native` 的 `API` 或组件属性都同时兼容两端。官方文档在这类属性和方法前面会加上平台前缀。

```
android renderToHardwareTextureAndroid bool
ios shouldRasterizeIOS bool
```

上面这两行，`renderToHardwareTextureAndroid` 只在 `Android` 上生效，`shouldRasterizeIOS` 只在 `iOS` 上生效。它俩其实是同一件事的两端实现，都是把视图提升成一层独立的纹理交给 `GPU`，做动画时能省掉重复的重绘。

这里有个坑要注意。这类单端属性写到另一端上通常不会报错，只是静默失效。你在 `Android` 上加了 `shouldRasterizeIOS` 想优化动画，跑起来一点变化都没有，还以为是自己参数没调对，实际上这个属性压根没被消费。查这类问题最快的方式就是回文档看前缀，比在代码里瞎试快得多。

同理，某些方法在两端都存在但行为不同。`Alert` 的按钮数量、`StatusBar` 的部分属性、`Linking` 能识别的 `scheme`，都属于这一类。写之前扫一眼文档下方的平台说明，能省不少事。

## 四、组件选型先看双端支持

2019 年那会儿导航组件是个典型例子。当时 `RN` 里同时存在 `NavigatorIOS` 和 `Navigator` 两个选择，从文档能看出 `NavigatorIOS` 只支持 `iOS`，`Navigator` 两端都支持。要做双端应用，`Navigator` 才是那个能用的。

选组件的判断标准我一般看三条。第一条是文档或 `README` 里有没有明确写双端支持，只写了一端的直接排除。第二条是看仓库的 `example` 工程里有没有 `android` 目录，只有 `ios` 目录的多半是单端库。第三条是翻 `issue` 列表搜一下另一端的关键字，很多库名义上支持双端，实际上另一端的 `bug` 挂了一年没人修。

我自己的感受是，第三条最有用，也最容易被跳过。

顺带说一句时效性。`NavigatorIOS` 和 `Navigator` 这两个组件在后续版本里都已经被移除了，现在做导航基本都用 `React Navigation` 这类社区方案。原文这一节的结论依然成立，只是例子换了主角，「选组件前先确认双端支持」这条判断标准并没有过时。

## 五、图片适配用 1x 2x 3x 三套图

无论 `Android` 还是 `iOS`，现在不同分辨率的设备越来越多，图标要在这些设备上都不糊，就得为每个图标准备 `1x`、`2x`、`3x` 三种尺寸。`React Native` 会根据屏幕的像素密度动态挑选合适的那张。

目录结构长这样。

```
└── img
    ├── check.png
    ├── check@2x.png
    └── check@3x.png
```

引用的时候只写标准分辨率那一张。

```html
<Image source={require('./img/check.png')} />
```

这里就是最容易犯错的地方了。如果你写成 `require('./img/check@2x.png')`，那么应用在所有设备上都只会加载 `check@2x.png`，自动挑选的机制直接失效。在 `2x` 屏上看不出问题，到了 `3x` 屏上图标就开始发虚，而且这种糊法很轻微，不对比着看根本发现不了。

原因不复杂。`RN` 的打包器在解析 `require` 的时候，会把 `check.png`、`check@2x.png`、`check@3x.png` 归成同一个资源的三个变体，运行时按 `PixelRatio` 挑一个。你直接指名 `@2x`，等于告诉它「这就是一个独立资源」，变体关系就断了。

所以规则很简单，文件按 `@2x` `@3x` 命名放好，代码里永远只引用不带后缀的那个名字。

## 六、字体和宽高的等比换算

前面几节解决的是「有没有」的问题，这一节解决「大小对不对」的问题。

设计稿一般按某个固定宽度出，`iOS` 常见的是 750，`Android` 早年常见 720。你拿到的标注是设计稿上的物理像素，要变成代码里的逻辑像素，就得按当前屏幕宽度做一次等比缩放。原文的做法是封装两个工具函数，一个管字号，一个管宽高间距。

先看字号这个。

```js
// utils/FontSize.js
import { PixelRatio, Dimensions } from 'react-native';

let { width, height } = Dimensions.get('window');

export let FontSize = (size) => {
  if (PixelRatio === 2) {
    // iphone 5s and older Androids
    if (width < 360) {
      return size * 0.95;
    }
    // iphone 5
    if (height < 667) {
      return size;
      // iphone 6-6s
    } else if (height >= 667 && height <= 735) {
      return size * 1.15;
    }
    // older phablets
    return size * 1.25;
  }
  if (PixelRatio === 3) {
    // catch Android font scaling on small machines
    // where pixel ratio / font scale ratio => 3:3
    if (width <= 360) {
      return size;
    }
    // Catch other weird android width sizings
    if (height < 667) {
      return size * 1.15;
      // catch in-between size Androids and scale font up
      // a tad but not too much
    }
    if (height >= 667 && height <= 735) {
      return size * 1.2;
    }
    // catch larger devices
    // ie iphone 6s plus / 7 plus / mi note 等等
    return size * 1.27;
  }
  // if older device ie pixelRatio !== 2 || 3 || 3.5
  return size;
};
```

这段的思路是按像素密度分档，再在每档里按屏幕宽高细分，给出一个手工调过的缩放系数。相比纯线性缩放，它的好处是字号不会在大屏上被放得过大，毕竟大屏用户的阅读距离没变。

但这段代码有个致命问题，我当时也是排查了半天才看出来。

`PixelRatio` 是从 `react-native` 里 `import` 进来的模块对象，拿它去和数字 `2` 做 `===` 比较，永远是 `false`。也就是说上面三个 `if` 分支一个都进不去，函数不管传什么都直接走到最后 `return size`，等于什么都没做。要拿到真正的像素密度，得调 `PixelRatio.get()`。

改法是这样。

```js
// 修正：先取出真实的像素密度再比较
const ratio = PixelRatio.get();

export const FontSize = (size) => {
  if (ratio === 2) { /* ...原逻辑不变... */ }
  if (ratio === 3) { /* ...原逻辑不变... */ }
  return size;
};
```

顺带提一句，原文注释里提到了 `3.5` 这一档，但实际代码里 `3.5` 那个分支和 `3` 的逻辑几乎重合，合并掉也不影响结果。真实设备上 `PixelRatio.get()` 常见的返回值是 `1`、`1.5`、`2`、`3`、`3.5`，`Android` 碎片化更严重，硬编码分档迟早会漏。

再看宽高换算这个工具。

```js
// 统一常用工具入口 utils/tool.js
import { Dimensions, Platform, PixelRatio } from 'react-native';
import {FontSize} from './FontSize';

let { width, height } = Dimensions.get('window');
let pixelRatio = PixelRatio.get();
let screenPxW = PixelRatio.getPixelSizeForLayoutSize(width);
let basePx = Platform.OS === 'ios' ? 750 : 720;

// 像素转dp
let Px2Dp = function px2dp(px) {
  var scaleWidth = px * screenPxW*2 / basePx;
  size = Math.round((scaleWidth/pixelRatio + 0.5));
  return size;
};

export default {
  SCREEN_WIDTH: width,
  SCREEN_HEIGHT: height,
  iOS: Platform.OS === 'ios',
  Android: Platform.OS === 'android',
  Px2Dp,
  FontSize
};
```

这段值得拆开算一遍。`screenPxW` 是 `PixelRatio.getPixelSizeForLayoutSize(width)`，结果是屏幕的物理像素宽度，也就是 `width * pixelRatio`。代入进去化简，`px * width * pixelRatio * 2 / basePx / pixelRatio`，`pixelRatio` 上下约掉，剩下 `px * width * 2 / basePx`。

`basePx` 取 750 的时候，这个式子就是 `px * width / 375`。设计稿宽 750，对应逻辑宽度 375，所以它做的正是「设计稿标注按屏幕逻辑宽度等比缩放」。绕了一圈，结果是对的，只是写法拐了个弯，看代码的人容易被 `getPixelSizeForLayoutSize` 和那个 `*2` 带偏。

这段里还藏着第二个 `bug`。`size = Math.round(...)` 这一行，`size` 没有用 `let` 或 `var` 声明。`RN` 的模块经过 `Babel` 转译后是跑在严格模式下的，给一个未声明的标识符赋值会直接抛 `ReferenceError`。补上声明就好。

```js
const Px2Dp = (px) => {
  const scaleWidth = px * screenPxW * 2 / basePx;
  // 补上 const，否则严格模式下 size 是未声明标识符
  const size = Math.round(scaleWidth / pixelRatio + 0.5);
  return size;
};
```

用起来是这样，样式里所有来自设计稿的数字都过一遍 `Px2Dp`，字号过 `FontSize`。我在[React Native 相机扫码实战](https://feinterview.poetries.top/blog/rn-camera)那篇里画扫码框的时候，用的就是同一套换算，宽高全走一个函数才能保证在各种屏幕上都是正方形。

```js
// 使用方式
import Tool from '../../utils/tool'

const styles = StyleSheet.create({
    header_info: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: Tool.Px2Dp(50),
        paddingTop: Tool.Px2Dp(25),
        paddingBottom: Tool.Px2Dp(10)
    },
    text: {
        fontSize: Tool.FontSize(14),
        color: '#fff',
        paddingLeft: 5
    },
})
```

这里有个执行顺序的细节容易忽略。`Dimensions.get('window')` 是在模块顶层执行的，只跑一次，`StyleSheet.create` 也是模块加载时就求值的。所以整套换算的结果在 `App` 启动那一刻就固定下来了，之后屏幕转向、分屏、折叠屏展开，这些值都不会跟着变。竖屏应用不受影响，要支持横屏就得换思路。

## 七、这套写法放到现在

上面那套 2019 年的方案，核心思路没问题，具体 `API` 有几处该换了。

`Dimensions.get('window')` 现在更推荐用 `useWindowDimensions` 这个 `Hook` 替代。它会在屏幕尺寸变化时触发重渲染，横屏、分屏、折叠屏这些场景下拿到的都是当前值，不再是启动那一刻的快照。代价是你的样式得从模块顶层的 `StyleSheet.create` 挪进组件里，或者把依赖尺寸的那几个属性单独提出来内联。

状态栏那个写死的 `20` 也该换掉。刘海屏之后 `iOS` 的状态栏高度不再是固定值，现在通用做法是用 `SafeAreaView`，或者装 `react-native-safe-area-context` 拿到四个方向的真实安全区数值。`Android` 这边全面屏和挖孔屏同样有这个问题，`SafeAreaView` 在新版本里两端都能用。

字号还有一层原文没提到的东西，就是系统的字体缩放设置。用户在系统里把字体调大之后，`RN` 的 `Text` 默认会跟着放大，布局很容易被撑破。你可以用 `PixelRatio.getFontScale()` 读到这个倍数自己处理，也可以给关键的 `Text` 加上 `allowFontScaling={false}` 直接锁死。我的做法是正文允许缩放，按钮和标签这类固定高度的容器里锁死，两边都照顾到。

社区里也有现成的轮子，比如 `react-native-size-matters`，思路和上面这套 `Px2Dp` 是一样的，多了一个「适度缩放」的变体，可以按一个系数控制缩放的激进程度。自己写和用轮子都行，关键是全项目统一走一个入口，别一半用工具函数一半直接写死数字，那才是维护噩梦。

新架构（`Fabric`）落地之后，布局计算的时机和线程模型有变化，但上面这些 `API` 的语义是稳定的。具体到某个版本上哪些属性有调整，以官方文档为准，我这边只在自己的项目版本上验证过。

## 总结

`React Native` 的适配不是一个 `API` 能搞定的事，它是四件小事叠在一起。平台差异用 `Platform.OS` 和 `Platform.select` 分流，差异大了就拆 `.ios.js` / `.android.js` 文件。单端 `API` 靠读文档前缀提前避开，写错了不报错只静默失效，这是最费时间的一类问题。图标准备 `1x` `2x` `3x` 三套，代码里永远引用不带后缀的名字，写了 `@2x` 就等于关掉了自动挑选。尺寸和字号统一走一个换算入口，基于 `Dimensions` 和 `PixelRatio` 把设计稿标注折算成逻辑像素。

老代码那两处坑值得单独记一下。`PixelRatio === 2` 比的是模块对象不是数值，永远为假；`size = Math.round(...)` 少了声明，严格模式下会抛错。这两个都是那种「跑起来看着正常，实际上功能没生效」的类型，不逐行算一遍很难发现。

如果你也在做 `RN` 项目，建议把换算工具在项目最开始就定下来，后面再补是要把所有样式文件翻一遍的。

## 参考

- [React Native Platform 官方文档](https://reactnative.dev/docs/platform)
- [React Native PixelRatio 官方文档](https://reactnative.dev/docs/pixelratio)
- [React Native Images 官方文档](https://reactnative.dev/docs/images)
- [React Native useWindowDimensions 官方文档](https://reactnative.dev/docs/usewindowdimensions)
- [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context)
- [React Native 真机调试完整流程](https://feinterview.poetries.top/blog/rn-device-debug)
- [前端进阶之旅](https://interview.poetries.top)
