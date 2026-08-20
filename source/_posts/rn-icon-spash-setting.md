---
title: React Native Icon 与启动图设置 iOS 和 Android 双端配置实战
date: 2019-10-04 15:10:12
description: React Native 项目替换应用图标和启动屏的完整流程，包含用图标工厂批量生成各尺寸资源、Android mipmap 与 drawable 目录替换、react-native-splash-screen 接入、iOS AppIcon 与 LaunchImage 配置，以及启动瞬间白屏的处理办法。
tags:
 - RN
 - react
 - iOS
 - Android
 - 启动图
 - 应用图标
categories: Front-End
---

功能都写完了，准备打个包给产品看看，结果桌面上蹲着一个 React Native 默认的灰色图标，点开还先闪一屏白，然后才是首页。这时候你会发现，改图标和加启动页这件事，在 RN 里根本不是「换张图」那么简单：iOS 要一整套 `AppIcon.appiconset`，Android 要六套 `mipmap`，启动页两端的机制还完全不一样，Android 压根没有原生启动图这个概念。

这篇把我配一次图标和启动屏踩到的东西整理成了一条流水线，从批量生成资源开始，到 Android 和 iOS 各自往哪个目录放、要改哪几个文件，再到那个恼人的启动白屏怎么消掉。每一步都有截图，做完应该长什么样也写在图后面。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- iOS 和 Android 各自需要哪些尺寸的图标和启动图，为什么两端差别这么大
- 怎么用一张 1024×1024 的原图批量生成全套资源，不用手动裁
- Android 端替换 `mipmap` 图标、改应用名称的具体位置
- `react-native-splash-screen` 的接入方式，以及原生侧那两行代码分别在做什么
- iOS 端替换 `AppIcon.appiconset`、配置 `LaunchImage` 的完整路径
- 启动瞬间那一屏白色是哪来的，怎么用 `windowIsTranslucent` 处理掉

## 一、先搞清楚两端各自要什么

动手之前先把资源需求理一遍，不然生成完一堆图不知道往哪塞。

iOS 这边，应用图标放在 `ios/项目名/Images.xcassets/AppIcon.appiconset` 这个目录里。它是一个「资源集」，里面有一份 `Contents.json` 声明每个槽位对应多大的图，Xcode 按这份清单去找文件。少一个尺寸，编译时 Xcode 会在 `Images.xcassets` 那一屏给你标黄警告，上传 App Store Connect 的时候则会直接被校验打回来。所以 iOS 的图标不能只放一张。

Android 这边简单一些，图标放在 `android/app/src/main/res/` 下面的一组 `mipmap-*` 目录里，按屏幕密度分成 `mdpi`、`hdpi`、`xhdpi`、`xxhdpi`、`xxxhdpi` 几档，系统会自己挑最合适那一档来用。

启动图的差别就大了。iOS 系统层面就支持启动图，App 冷启动时先渲染 `LaunchScreen`，等 RN 的 JS 环境跑起来再切到首页，这个过程是系统托管的。Android 没有这个东西，你必须自己拿一个 `Activity` 的主题背景去顶住，或者装 `react-native-splash-screen` 这类库，手动控制显示和隐藏。

这就是为什么同样一句「加个启动页」，Android 那边要多改三个文件。

## 二、用图标工厂批量生成全套资源

手动裁十几个尺寸是纯粹的体力活，交给工具就行。

**方式一**

如果你的项目里正好也有 Ionic 那一套，可以直接复用它的资源生成能力，参考 [Ionic 项目里生成不同尺寸的启动图和图标](https://feinterview.poetries.top/blog/ionic3-summary)。Ionic CLI 的做法是让你只准备 `resources/icon.png` 和 `resources/splash.png` 两张原图，命令跑完自动铺满两端所有尺寸。

**方式二**

纯 RN 项目用在线的图标工厂更直接。

**各种尺寸 Icon 图标生成**

工具地址是 https://icon.wuruihong.com/ ，上传一张 1024×1024 的 PNG，勾选要生成的平台，几秒钟就能拿到一个压缩包。原图这里有个要求，**必须是不带圆角、不带透明通道的正方形 PNG**，圆角是系统自己裁的，你自己先裁好反而会出现二次圆角；带 alpha 通道的图上传 App Store 会被直接拒绝。

拿到压缩包之后分两端放：

1. 安卓下替换 `andriod/app/src/main/res/` 下的 mipmap 文件即可
2. iOS 下替换如下

下面这张图是 iOS 端图标资源该放的位置，也就是 Xcode 工程里 `Images.xcassets` 下的 `AppIcon` 资源集。

![iOS 端图标资源在 Images.xcassets 的 AppIcon.appiconset 目录中的文件结构](https://s.poetries.top/gitee/2019/10/750.png)

替换完之后回 Xcode 点开 `Images.xcassets > AppIcon`，每个槽位都应该有缩略图，没有空槽就说明尺寸齐了。如果某个格子是空的，多半是文件名和 `Contents.json` 对不上，把工厂生成的整个文件夹连同 `Contents.json` 一起覆盖过去最省事。

**各种尺寸启动图图标生成**

启动图也可以使用图标工厂生产了 https://icon.wuruihong.com/splash ，入口和图标是分开的，别在图标那个页面上传启动图原图。

1. 安卓下拷贝生成的文件到 `andriod/app/src/main/res/` 目录下

生成结果按密度分好了目录，下面这张图是 Android 启动图生成后的目录结构。

![图标工厂生成的 Android 启动图按屏幕密度分成多个 drawable 目录](https://s.poetries.top/gitee/2019/10/751.png)

对照着往 `res/` 下面拷就行，同名目录直接合并。这张是拷贝完成后 `res/` 目录里应该呈现的样子。

![拷贝完成后 Android res 目录下的资源分布](https://s.poetries.top/gitee/2019/10/750.png)

2. iOS 下拷贝生成的该文件夹替换即可

iOS 的启动图会生成成一个 `LaunchImage.launchimage` 资源集，同样是整个文件夹替换。

![图标工厂生成的 iOS 启动图资源集目录](https://s.poetries.top/gitee/2019/10/752.png)

替换后在 Xcode 的 `Images.xcassets` 里能看到多出来一个 `LaunchImage` 条目，里面按设备型号分好了槽位。

![在 Xcode 的 Images.xcassets 中看到生成好的 LaunchImage 资源集](https://s.poetries.top/gitee/2019/10/753.png)

这里有个坑要注意，图标工厂是第三方工具，它对新机型尺寸的支持是滞后的。我当时生成出来的槽位就少了几个新设备的，Xcode 里那几格是空的。空槽不会导致编译失败，但那些机型上启动图会被拉伸或者留黑边，介意的话得手动补。

## 三、Android 端替换图标和名称

资源到位了，接下来是两端各自的接线工作，先说 Android。

**修改图标和名称**

找到根目录 `/android/app/src/main/res`，把生成好的 `mipmap-*` 目录整个覆盖进去。

![Android 项目 res 目录下按密度划分的 mipmap 图标目录](https://s.poetries.top/gitee/2019/10/540.png)

覆盖完成后，`res/` 下每个 `mipmap-` 开头的目录里都应该有一个 `ic_launcher.png`（有些模板还会带 `ic_launcher_round.png`，圆形图标，Android 7.1 之后的启动器会用它）。文件名不要改，`AndroidManifest.xml` 里 `android:icon="@mipmap/ic_launcher"` 是按这个名字找的。

应用名称改的是另一个地方，在 `android/app/src/main/res/values/strings.xml` 里的 `app_name` 字段，改完重新编译就能在桌面上看到新名字。

**启动页**

Android 的启动页要靠库来做，原文这几条说明我原样保留：

> - 在 `react-native` 的 `android` 中的启动图和 `IOS` 不相同点在于，`android` 没有默认的启动图，在 `IOS` 里面有
> - 使用插件 `import SplashScreen from 'react-native-splash-screen';`
> - https://github.com/crazycodeboy/react-native-splash-screen

把生成好的启动页按下图这个格式处理即可，也就是按密度放进 `drawable-*` 系列目录。

![Android 启动页图片按 drawable 密度目录分类存放的格式](https://s.poetries.top/gitee/2019/10/541.png)

放完之后目录里应该出现 `launch_image.png` 这类文件，名字要和后面 XML 里引用的 `@drawable/launch_image` 保持一致。这一步做错的表现很典型：编译报 `resource drawable/launch_image not found`，一眼就能定位。

## 四、iOS 端改 App 名称和图标

**修改 app 名称**

编辑 `ios/test/Info.plist` 文件（`test` 换成你自己的工程名），改 `CFBundleDisplayName` 这一项。

```
<key>CFBundleDisplayName</key>
- <string>$(PRODUCT_NAME)</string>
+ <string>测试程序</string>
```

这段改的是「显示在桌面图标下面的名字」。默认值 `$(PRODUCT_NAME)` 是个变量，会取工程的 `Product Name`，通常是英文工程名。要注意 `CFBundleDisplayName` 和 `CFBundleName` 是两个字段，前者是给用户看的显示名，后者是包内部的短名，长度限制更严；桌面显示不对的时候优先改前者。中文名直接写中文即可，`Info.plist` 是 UTF-8 的。

**修改应用图标**

应用图标对尺寸有要求，比较简单的方式是准备一张 `1024*1024` 的图片，然后使用[图标工厂](https://icon.wuruihong.com/)在线生成。

这里直接从 Sketch iOS 图标设计模板中选取了一张图片，生成后的结果如下。

![用图标工厂生成的 iOS 全套尺寸图标结果预览](https://s.poetries.top/gitee/2019/10/744.png)

生成结果是一个完整的 `AppIcon.appiconset` 文件夹，里面每个 PNG 的文件名都带着尺寸标识。

![生成结果中 AppIcon.appiconset 文件夹内的各尺寸图标文件](https://s.poetries.top/gitee/2019/10/745.png)

我们可以直接用生成好的内容替换默认的图标即可，也就是替换 `ios/test/Images.xcassets/AppIcon.appiconset` 中的内容。如果不需要全部尺寸，可以用 Xcode 打开项目，点击 `Images.xcassets > AppIcon` 拖入相应尺寸的图标。

替换完记得在 Xcode 里 `Command + Shift + K` 清一次编译缓存再跑，不然模拟器上大概率还是老图标。这个我踩过，以为是资源没替对，翻了半天目录，其实只是缓存没清。

## 五、接入 react-native-splash-screen

添加启动页可以使用 [react-native-splash-screen](https://github.com/crazycodeboy/react-native-splash-screen) 库，通过它可以控制启动页的显示和隐藏。

它解决的问题是什么呢？RN 应用冷启动时，原生容器起来得很快，但 JS bundle 加载和首屏渲染需要时间，这中间那段空档如果不遮住，用户看到的就是一片白。这个库做的事就是在原生侧先把一张全屏图盖上去，等你在 JS 里确认首屏数据准备好了，再手动调用 `SplashScreen.hide()` 把它撤掉。

```
$ yarn add react-native-splash-screen

$ react-native link react-native-splash-screen
```

这两条命令，第一条装包，第二条把原生依赖自动接进 iOS 和 Android 工程。补充一句时效性的说明：`react-native link` 是当年（RN 0.60 之前）的做法，0.60 之后 RN 引入了 autolinking，装完包直接 `cd ios && pod install` 就行，不需要也不应该再跑 `link`，跑了反而可能导致重复链接。老项目沿用上面这套写法没问题，新项目按 autolinking 走。

**Android**

编辑 `MainActivity.java`，添加显示启动页的代码。

```js
import android.os.Bundle; // here
import com.facebook.react.ReactActivity;
// react-native-splash-screen >= 0.3.1
import org.devio.rn.splashscreen.SplashScreen; // here
// react-native-splash-screen < 0.3.1
import com.cboy.rn.splashscreen.SplashScreen; // here

public class MainActivity extends ReactActivity {
   @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.show(this);  // here
        super.onCreate(savedInstanceState);
    }
    // ...other code
}
```

这段的关键在两处。一是那两行版本不同的 `import`，包名在 `0.3.1` 这个版本上换过，两行只能留一行，留错了编译直接报找不到符号。二是 `SplashScreen.show(this)` 必须写在 `super.onCreate()` **前面**，写后面的话 Activity 已经开始走视图创建流程了，启动图盖上去会有一帧闪烁。

在 `android/app/src/main/res/layout` 文件夹下创建启动页布局文件 `launch_screen.xml`：

```html
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:orientation="vertical" android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/launch_image">
</LinearLayout>
```

这个布局本身没有任何内容，它唯一的作用就是把 `@drawable/launch_image` 铺满整屏。文件名 `launch_screen.xml` 是库里写死约定的，改名了库找不到。

将启动页图片放置在 `drawable` 文件夹下：

```
drawable-ldpi
drawable-mdpi
drawable-hdpi
drawable-xhdpi
drawable-xxhdpi
drawable-xxxhdpi
```

- Android 会自动缩放 drawable 下的图片，所以我们不必为所有分辨率的设备准备启动图
- 完成上述操作后，重新打包应用，再启动时就可以看到启动页了。不过，启动页显示之前会有短暂的白屏，我们可以通过设置透明背景来处理。编辑 `android/app/src/main/res/values/styles.xml` 文件，修改如下

```html
<resources>
    <!-- Base application theme. -->
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <!-- Customize your theme here. -->
+        <item name="android:windowIsTranslucent">true</item>
    </style>
</resources>
```

那为什么加一个 `windowIsTranslucent` 就不白屏了呢？因为那一瞬间的白色并不是你的 App 画出来的，是系统在 Activity 真正渲染之前，先按主题里的窗口背景色画了一屏「预览窗口」。默认主题的背景是白的，所以你看到白屏。把窗口设成半透明之后，系统就不画这个预览窗口了，视觉上直接从桌面切到启动图。

代价是这段时间里用户会多看到一会儿桌面（或者上一个应用的画面），有些团队更倾向另一种做法：不设透明，而是把 `android:windowBackground` 直接指向启动图，让预览窗口画的就是启动图本身。这两种我都在项目里用过，后者过渡更自然，但对图片尺寸适配要求高一点。

## 六、iOS 端配置 LaunchImage

**iOS**

图标资源的目录结构可以参考这个开源项目的组织方式：[图标配置参考](https://github.com/phodal/growth/tree/master/ios/growth/Images.xcassets/AppIcon.appiconset)。

原生侧同样要加一行代码，编辑 `AppDelegate.m`：

```js
#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import "RNSplashScreen.h"  // here

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    // ...other code

    [RNSplashScreen show];  // here
    return YES;
}

@end
```

注意 `[RNSplashScreen show]` 这一行要放在 `return YES` 之前、`rootView` 创建之后，位置放错了要么盖不住，要么盖上去撤不掉。撤掉的动作在 JS 侧，通常写在首页组件的 `componentDidMount` 里调 `SplashScreen.hide()`。这一步很多人漏掉，表现就是启动图一直挂着不走，看起来像卡死了。

接下来是 Xcode 里的配置。用 Xcode 打开项目，选中 `LaunchScreen.xib` 中的 `View`，取消选中 `Use Launch Screen`。

![在 Xcode 中打开 LaunchScreen.xib 并取消勾选 Use Launch Screen 选项](https://s.poetries.top/gitee/2019/10/746.webp)

这一步在做的事，是把启动屏的来源从 xib 切成资源目录。iOS 有两套启动屏方案，一套是 `LaunchScreen.storyboard` / `.xib`（用界面文件描述，能自适应任意尺寸），另一套是老的 `LaunchImage`（一堆按机型准备的位图）。两套只能生效一套，不把 xib 摘掉，你配的 `LaunchImage` 不会被用到。

选中项目，在 `General` 配置中设置 `Launch Images Source`，点击 `Use Asset Catalog`，弹出对话框中使用默认即可（此操作会在 `Images.xcassets` 中创建 `LaunchImage`），然后设置 `Launch Screen File` 为空。

![在 General 配置中设置 Launch Images Source 并点击 Use Asset Catalog](https://s.poetries.top/gitee/2019/10/747.webp)

点完 `Use Asset Catalog` 之后，`Images.xcassets` 里会自动多出一个 `LaunchImage` 条目，`Launch Screen File` 那一栏要手动清空，两项都配着的话以 `Launch Screen File` 优先，你的位图还是不生效。

![在 Images.xcassets 中生成的 LaunchImage 条目及其槽位](https://s.poetries.top/gitee/2019/10/754.png)

![在右侧属性栏中勾选要支持的设备类型和屏幕尺寸](https://s.poetries.top/gitee/2019/10/755.png)

点击 `Images.xcassets > LaunchImage`，在右侧属性栏处选择要支持的设备。勾了哪些设备，左边就会出现对应的空槽位。接着，添加对应分辨率的图片，分辨率对照如下。

|设备	|分辨率|
|---|---|
|`iOS 11+	`| `1125*2436`|
|`iOS 8+ Retina HD 5.5`| 	`1242*2208`|
|`iOS 8+ Retina HD 4.7`| 	`750*1334`|
|`iOS 7+ 2x	`| `640*960`|
|`iOS 7+ Retina 4`| 	`640*1136`|
|`iOS 5,6 1x`| 	`320*480`|
|`iOS 5,6 2x`| 	`640*960`|
|`iOS 5,6 Retina 4`| 	`640*1136`|

**安卓的尺寸**

|设备	|分辨率|
|---|---|
|`mdpi:`|`375*667`|
|`hdpi:`|`563*1001`|
|`xhdpi:`|`750*1334`|
|`xxhdpi:`|`1125*2001`|
|`xxxhdpi:`|`1500*2668`|

这两张表按 2019 年当时的主流机型整理，后面苹果又出了不少新的屏幕尺寸和刘海形态，`LaunchImage` 这套位图方案已经补不过来了。补充一句时效性说明：从 iOS 14 那个时期开始，Apple 就在推 `LaunchScreen.storyboard`，上架审核也要求新提交的 App 用 storyboard 而不是 `LaunchImage`。老项目沿用位图方案还能跑，新项目建议直接用 storyboard，做一个居中的 logo + 纯色背景就能自适应所有机型，省掉整张对照表。

把图片按表拖进对应槽位，最终应该是这个样子。

![LaunchImage 各槽位填满对应分辨率图片后的完整状态](https://s.poetries.top/gitee/2019/10/748.webp)

完成上述操作之后，重新安装 APP 再启动时就可以看到启动页。这里强调一下「重新安装」，改启动图之后光点 Run 覆盖安装，系统缓存的启动快照不一定会刷新，看到的还是旧图。先把设备上的 App 删掉再装，是最省事的验证方式。

## 总结

这一整套配下来，真正需要记住的其实是三条。

第一，资源生成交给工具，别手裁。一张 1024×1024 的无圆角、无透明通道 PNG 是唯一的输入，剩下的让图标工厂或者 Ionic CLI 铺开。

第二，两端的启动屏机制根本不是一回事。iOS 是系统托管，你配的是资源和开关；Android 需要一个库加三处改动（`MainActivity.java` 显示、`launch_screen.xml` 布局、`drawable` 放图），JS 侧还得记得调 `hide()`。忘了 `hide()` 的表现就是启动图挂着不动，看着像崩了。

第三，白屏和「图没换」这两类问题，八成不是配错了，是缓存。Android 那一瞬白屏是系统预览窗口，用 `windowIsTranslucent` 或者 `windowBackground` 处理；iOS 图标没变就清编译缓存，启动图没变就删了重装。

如果你接着要打包发版，配置图标和启动图之后就可以往下走了，流程可以参考 [React Native iOS 打包发布全流程](https://feinterview.poetries.top/blog/rn-ios-distribute)。

## 参考

- React Native 官方文档：Publishing to Apple App Store <https://reactnative.dev/docs/publishing-to-app-store>
- Apple Human Interface Guidelines：App Icons <https://developer.apple.com/design/human-interface-guidelines/app-icons>
- Apple Human Interface Guidelines：Launch Screens <https://developer.apple.com/design/human-interface-guidelines/launching>
- Android 开发者文档：App icons <https://developer.android.com/develop/ui/views/launch/icon_design_adaptive>
- react-native-splash-screen 仓库 <https://github.com/crazycodeboy/react-native-splash-screen>
- 图标工厂 <https://icon.wuruihong.com/>
- [前端进阶之旅](https://interview.poetries.top)
