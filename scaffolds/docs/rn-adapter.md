---
title: React Native之图片/宽高/字体平台适配
date: 2019-10-02 12:50:12
tags: 
 - RN
 - react
categories: Front-End
---

## 一、Platform.OS

> 为了提高代码的兼容性，我们有时需要判断当前系统的平台，然后做一些适配。比如，我们在使用`StatusBar`做导航栏的时候，在`iOS`平台下根视图的位置默认情况下是占据状态栏的位置的，我们通常希望状态栏下面能显示一个导航栏，所以我们需要为`StatusBar`的外部容器设置一个高度

```html
<View style={{height: Platform.OS === 'ios' ? 20:0}}>
    <StatusBar {...this.props.statusBar} />
</View>;
```

## 二、留意api doc的android或ios标识

> 并不是所有`React Native`的一些`api`或组件的一些属性和方法都兼容`Android`和`iOS`，在`React Native`的`api doc`中通常会在一些属性或方法的前面加上`android`或`ios`的字样来标识该属性或方法所支持的平台，如

```
android renderToHardwareTextureAndroid bool
ios shouldRasterizeIOS bool
```

> 在上述代码中，`renderToHardwareTextureAndroid bool`只支持`Android`平台，`ios shouldRasterizeIOS bool`只支持`iOS`平台，所有我们在使用这些带有标记的属性或方法的时候就需要考虑对于它们不兼容的平台我们是否需要做相应的适配了

##  三、组件选择

> 比如，我们要开发一款应用需要用到导航组件，`在React Native`组件中有`NavigatorIOS`与`Navigator`两个导航组件来供我们选择，从`api doc`中我们可以看出`NavigatorIOS`只支持`iOS`平台，`Navigator`则两个平台都支持。
所以如果我们要开发的应用需要适配`Android`和`iOS`，那么`Navigator`才是最佳的选择。

为了提高代码的复用性与兼容性建议大家在选择`React Native`组件的时候要多留意该组件是不是兼容`Android`和`iOS`，尽量选择`Android`和`iOS`平台都兼容的组件。

## 四、图片适配


> 开发一款应用少不了的需要用到图标。无论是`Android`还是`iOS`，现在不同分辨率的设备越来越多，我们希望这些图标能够适配不同分辨率的设备。为此我们需要为每个图标提供`1x`、`2x`、`3x`三种大小的尺寸`，React Native`会根据屏幕的分辨率来动态的选择显示不同尺寸的图片。比如：在`img`目录下有如下三种尺寸的`check.png`

```
└── img
    ├── check.png
    ├── check@2x.png
    └── check@3x.png
```

那么我们就可以通过下面的方式来使用`check.png`


```html
<Image source={require('./img/check.png')} />
```

> 提示：我们在使用具有不同分辨率的图标时，一定要引用标准分辨率的图片如`require('./img/check.png')`，如果我们这样写`require('./img/check@2x.png')`，那么应用在不同分辨率的设备上都只会显示`check@2x.png`图片，也就无法达到图片自适配的效果。

## 五、字体/宽高适配

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
  if (PixelRatio === 3.5) {
    // catch Android font scaling on small machines
    // where pixel ratio / font scale ratio => 3:3
    if (width <= 360) {
      return size;
      // Catch other smaller android height sizings
    }
    if (height < 667) {
      return size * 1.2;
      // catch in-between size Androids and scale font up
      // a tad but not too much
    }
    if (height >= 667 && height <= 735) {
      return size * 1.25;
    }
    // catch larger phablet devices
    return size * 1.4;
  }
  // if older device ie pixelRatio !== 2 || 3 || 3.5
  return size;
};
```

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