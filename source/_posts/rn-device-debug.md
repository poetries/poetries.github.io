---
title: React Native真机调试完整流程与连不上的排查顺序
description: React Native 真机调试从头到尾走一遍，覆盖 Android USB 调试开启、adb devices 确认连接、adb reverse 端口转发的原理、摇一摇开发者菜单、iOS 真机的差异，以及连不上 Metro 时该按什么顺序排查。
date: 2019-09-26 09:10:12
tags:
  - RN
  - react
  - 真机调试
categories: Front-End
---

模拟器上跑得好好的页面，装到真机上白屏了。或者更常见的一种，`App` 起来了，但一直卡在红屏，写着 `Unable to load script`。做 `React Native` 只要涉及相机、蓝牙、定位、推送这几类原生能力，模拟器就帮不上忙了，必须上真机。而真机调试第一次配起来，卡住的往往不是代码，是设备连不上、`Metro` 找不着、开发者菜单调不出来这几件小事。

这篇把 `Android` 和 `iOS` 两端的真机调试流程完整走一遍，重点讲清楚 `adb reverse` 到底在做什么、开发者菜单有几种调出方式、真机和模拟器的行为差在哪，最后给一份连不上时按顺序往下走的排查清单。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 为什么有些问题必须上真机才能复现
- `Android` 怎么开启 `USB` 调试，开发者选项藏在哪
- 用 `adb devices` 确认设备真的连上了，`unauthorized` 和 `offline` 分别是什么意思
- `adb reverse` 的端口转发原理，以及它和「同一个局域网」方案的区别
- 调出开发者菜单的三种方式，摇一摇、快捷键、`adb shell input keyevent 82`
- `iOS` 真机调试和 `Android` 的差异，证书、签名、`Metro` 地址
- 真机和模拟器到底有哪些行为差异，哪些问题只会在真机上出现
- 连不上时按什么顺序排查，一条一条往下走

## 一、为什么非得上真机

先说清楚这件事，不然会觉得配环境太折腾不值得。

模拟器其实就是跑在你电脑上的一个虚拟设备，它模拟的是系统层面的 `API`，硬件那一层大多是假的。相机在 `iOS` 模拟器上直接不可用，`Android` 模拟器上是一张滚动的测试图；蓝牙在两端的模拟器上都没有真正的射频能力，扫不到任何设备；定位是你手动设的固定坐标；推送、指纹、`NFC`、传感器同理。

性能特征也完全对不上。模拟器跑在你 `Mac` 的 `CPU` 上，内存管够，滚一个长列表流畅得不像话，装到一台三年前的中端安卓机上就开始掉帧。这类问题在模拟器上永远复现不出来，具体的性能定位方法可以看这篇[React Native 真机性能调优实战](https://feinterview.poetries.top/blog/react-native-ios-android-device-performance-profiling)。

还有一类是屏幕相关的。刘海、挖孔、异形屏、系统字体缩放、深色模式，真机上的表现和模拟器有出入。

所以规则很简单，涉及硬件、性能、屏幕特性的，一律真机。日常写业务页面用模拟器就够了，效率高。

## 二、开启 USB 调试

`Android` 设备默认只能从应用市场安装应用，要装开发版本的 `APK`，得先把 `USB` 调试打开。

路径在设置里，但被藏起来了。先进「关于手机」，找到「版本号」那一栏，连续点七次，系统会提示「你已进入开发者模式」。然后回到设置主页，会多出一个「开发者选项」的入口，进去把「`USB` 调试」的开关打开。

不同厂商的路径不太一样。小米那边版本号叫「`MIUI` 版本」，华为在「软件信息」里，`OPPO` 和 `vivo` 又各有各的叫法，找不到就在设置的搜索框里搜「版本号」。

有几个开关顺手也一起打开会省事。「`USB` 安装」允许通过数据线直接装应用，不开的话 `run-android` 装包那一步会失败。「`USB` 调试（安全设置）」在部分小米机型上是修改系统设置必需的。「停用权限监控」这类选项在某些机型上会拦截调试进程的权限申请，遇到权限弹框不出现的情况可以看看这里。

## 三、用 adb devices 确认连接

线插上之后，第一件事不是跑项目，是先确认电脑真的看到了这台设备。

`adb` 是 `Android Debug Bridge` 的缩写，它是电脑和 `Android` 设备之间所有调试通信的入口，装 `Android SDK` 的时候会一起带上。在终端敲这条命令。

```bash
adb devices
```

![adb devices 命令输出，列出已连接的 Android 设备](https://s.poetries.top/gitee/20190926/1.png)

正常情况下会列出设备序列号，后面跟着状态 `device`。这个状态是唯一表示「一切正常」的，其他几种都有问题。

看到 `unauthorized`，说明设备端还没授权这台电脑。手机屏幕上应该弹出了一个「允许 `USB` 调试吗」的对话框，勾上「一律允许使用这台计算机进行调试」再点确定。如果弹框没出现，把线拔了重插一次，或者在开发者选项里点「撤销 `USB` 调试授权」再重连。

看到 `offline`，通常是 `adb` 服务和设备的连接状态错乱了。`adb kill-server` 后再 `adb devices` 重启一次服务就好。

什么都没列出来，那就是线或者驱动的问题。先换一根线试试，很多充电线只有供电线芯没有数据线芯，插上能充电但传不了数据，这个坑非常常见。`Windows` 上还要装对应厂商的 `USB` 驱动。

## 四、把应用装到设备上

设备连上了，就可以装包运行了。

```bash
react-native run-android
```

这条命令做的事比看上去多。它会先编译 `Android` 原生工程生成 `APK`，通过 `adb` 装到设备上，同时在你的电脑上起一个 `Metro` 打包服务（默认监听 `8081` 端口），最后拉起 `App`。

`App` 启动之后，它需要去 `Metro` 那里拉 `JS bundle`。这就是下一节要解决的问题了。

顺带说时效性。`react-native` 这个全局命令行工具在后来的版本里已经不推荐了，现在通常写成 `npx react-native run-android`，或者直接用 `package.json` 里的脚本 `npm run android` / `yarn android`。命令名字变了，底下做的事情是一样的。具体到某个版本用哪个入口，以官方文档为准。

## 五、adb reverse 让真机找到你的电脑

这里是整套流程里最容易卡住的一环，也是最值得讲清楚原理的一环。

`Metro` 跑在你的电脑上，监听 `localhost:8081`。真机是一台独立的设备，它的 `localhost` 是它自己，跟你电脑的 `localhost` 没有半点关系。所以真机上的 `App` 去访问 `localhost:8081` 是访问不到 `Metro` 的，红屏 `Unable to load script` 就是这么来的。

要解决这个问题有两条路。

第一条是让真机和电脑连同一个 `Wi-Fi`，然后在开发者菜单的 `Dev Settings` 里把服务器地址手动改成你电脑的局域网 `IP`，比如 `192.168.1.100:8081`。这条路的问题在于，公司网络经常做客户端隔离，同一个 `Wi-Fi` 下两台设备互相 `ping` 不通；`IP` 还会随着 `DHCP` 续租变化，换个地方办公就得重设一次。

第二条就是 `adb reverse`，`Android 5.0` 及以上支持。

```bash
adb reverse tcp:8081 tcp:8081
```

这条命令的意思是，在设备上开一个 `8081` 端口的监听，所有发到设备这个端口的流量，通过 `USB` 数据线转发到电脑的 `8081` 端口。于是真机上的 `App` 访问自己的 `localhost:8081`，实际拿到的是你电脑上 `Metro` 的响应。

走的是数据线，不依赖网络，公司网、地铁上、飞行模式都能用。这个设计是真的舒服。

两个参数的顺序容易记反。前面那个 `tcp:8081` 是设备端的端口，后面那个是电脑端的端口，两边可以不一样。比如你的 `Metro` 因为端口冲突起在了 `8088`，那就写 `adb reverse tcp:8081 tcp:8088`，设备端还是访问 `8081`，转到电脑的 `8088` 上去。

有个坑要注意。`adb reverse` 的转发规则不是永久的，设备重启、拔插数据线、`adb` 服务重启之后都会失效，需要重新执行。`run-android` 每次跑的时候会自动帮你设一遍，所以平时感知不强，但如果你只是重启 `App` 没有重新 `run`，就得手动补这一条。

## 六、调出开发者菜单

开发者菜单是真机调试的控制面板，热更新、性能监视器、服务器地址设置都在里面。

![React Native 开发者菜单在真机上弹出的样子](https://s.poetries.top/gitee/20190926/2.png)

调出来有三种方式。

最直接的是摇晃手机。`RN` 监听了加速度传感器，晃一下就会弹出菜单。缺点是有时候要晃好几次才响应，在办公室里晃手机的姿势也比较微妙。

第二种是走 `adb` 发送按键事件。

```bash
adb shell input keyevent 82
```

`82` 是 `Android` 里 `KEYCODE_MENU` 的键值，`RN` 把菜单键映射成了打开开发者菜单。这条命令的好处是稳定，敲一次弹一次，不用晃手机。我自己基本只用这种。

第三种是模拟器上的快捷键，`macOS` 下 `iOS` 模拟器是 `Cmd + D`，`Android` 模拟器是 `Cmd + M`（`Windows` 和 `Linux` 上是 `Ctrl + M`）。真机上没有快捷键这一说。

菜单弹出来之后，几个常用项是这样的。`Reload` 重新拉一次 `bundle`，等价于 `RR` 双击。`Enable Fast Refresh`（早期叫 `Enable Live Reload` 和 `Enable Hot Reloading`）打开热更新，改完代码保存就自动刷新。`Debug`（早期叫 `Debug JS Remotely`）把 `JS` 执行环境切到 `Chrome` 里，可以打断点看变量。`Show Perf Monitor` 打开性能浮窗，能看到 `JS FPS` 和 `UI FPS`。`Dev Settings` 里面可以改服务器地址。

这里也有个时效性说明。远程 `JS` 调试那一套在 `Hermes` 成为默认引擎之后已经变了，现在的调试入口是 `React Native DevTools`，直接连 `Hermes` 而不是把代码搬到 `Chrome` 里跑。老的远程调试模式在新版本里陆续被移除了。菜单项的名字和具体行为随版本变化比较大，以官方文档为准。

## 七、iOS 真机调试的不同之处

`iOS` 这边流程不一样，主要卡在签名上。

`Android` 装个包基本没有门槛，`iOS` 必须有一个有效的开发者证书和描述文件，设备的 `UDID` 还得在描述文件的设备列表里。用免费的个人 `Apple ID` 也能装，但证书七天过期，过期后 `App` 就打不开了，得重新签一次。团队开发建议还是走付费开发者账号。证书和描述文件怎么配，可以参考[React Native iOS 证书配置](https://feinterview.poetries.top/blog/rn-ios-cert-config)这篇。

设备连上 `Mac` 之后，在 `Xcode` 里选中你的真机作为运行目标，`Cmd + R` 就能编译安装。第一次运行需要在手机的「设置 - 通用 - `VPN` 与设备管理」里信任你的开发者证书，不信任的话应用图标装上了但点开会报「不受信任的开发者」。

`iOS` 没有 `adb reverse` 这种东西。`RN` 的处理方式是，`Xcode` 编译 `Debug` 包时会把你 `Mac` 的局域网 `IP` 写进 `App`，运行时按这个地址去连 `Metro`。所以 `iOS` 真机调试必须和 `Mac` 在同一个局域网里，而且这个网络不能有客户端隔离。你的 `Mac` 换了网络导致 `IP` 变了，就得重新编译一次，或者在开发者菜单的 `Dev Settings` 里手动改地址。

开发者菜单在 `iOS` 真机上同样靠摇一摇调出，或者连着 `Mac` 时用 `Cmd + D`（需要 `Xcode` 在跑）。

## 八、真机和模拟器差在哪

除了硬件能力，这几类差异是我实际踩过的。

**性能与内存**。模拟器用的是你电脑的 `CPU` 和内存，中低端真机的差距非常大。列表滚动、动画、大图解码这几类，模拟器上完全看不出问题。

**图片资源的选取**。模拟器的像素密度是固定的几档，真机上密度更碎，`@2x` `@3x` 的挑选结果可能和你预期不同，图标发虚这类问题得真机看。

**权限弹框**。`Android` 各家厂商对权限的处理差异很大，模拟器跑的是原生 `AOSP`，弹框行为和小米、华为的定制系统完全不一样。定位、后台运行、自启动这几项尤其明显。

**网络环境**。模拟器走的是你电脑的网络，真机可能在 4G/5G 上。超时时间、弱网表现、`HTTPS` 证书校验，这几块只有真机能测。

**Release 包的差异**。这一点最容易忽略。真机上装的 `Debug` 包依然带着 `Metro` 连接和未优化的 `bundle`，和上架的 `Release` 包还是两码事。做性能验收要打 `Release` 包在真机上测，不然数据不作数。

## 九、连不上时的排查顺序

真到了连不上的时候，别乱试，按这个顺序一条条往下走，基本都能定位。

**第一步，确认设备连上了。** 跑 `adb devices`，状态必须是 `device`。是 `unauthorized` 就去手机上点授权，是 `offline` 就 `adb kill-server` 重启服务，列表为空就换数据线。

**第二步，确认 Metro 在跑。** 在浏览器里打开 `http://localhost:8081/status`，正常会返回 `packager-status:running`。返回不了说明 `Metro` 根本没起来，或者端口被别的进程占了。查占用可以用 `lsof -i :8081`。

**第三步，确认端口转发生效。** 跑 `adb reverse --list` 看有没有那条 `8081` 的规则。没有就手动执行 `adb reverse tcp:8081 tcp:8081`。这一步在设备重启或者重插数据线之后必做。

**第四步，确认 App 里的服务器地址。** 摇一摇打开 `Dev Settings`，看 `Debug server host` 那一项。用 `adb reverse` 方案的话这里应该是空的或者 `localhost:8081`；如果之前手填过一个过期的局域网 `IP`，会一直连不上，清空它。

**第五步，清缓存重来。** `Metro` 的缓存偶尔会脏，尤其是切了分支或者改了 `babel` 配置之后。

```bash
# 清掉 Metro 缓存重启
npx react-native start --reset-cache
```

**第六步，检查防火墙和代理。** 这个坑我自己踩过。`Mac` 上开着 `Clash` 之类的代理软件时，本机的 `HTTP` 请求会被劫持，`Metro` 的连接可能受影响。把代理临时关掉试一次，能很快排除掉这个因素。

**第七步，重装。** 前面都没问题就卸载 `App` 重新 `run` 一次。有时候旧包里缓存了错误的 `bundle` 或者服务器配置，覆盖安装清不掉。

我自己的经验是，八成的问题都停在第一步和第三步，数据线和 `adb reverse` 失效是最高频的两个原因。

顺带一提，如果你想搞明白 `App` 启动时到底做了什么、`bundle` 是怎么被加载和执行的，可以接着看[React Native 启动流程](https://feinterview.poetries.top/blog/rn-start-progress)，那篇把从 `MainActivity` 到 `AppRegistry.runApplication` 的整条链路拆开讲了。

## 总结

真机调试这件事，理清楚之后其实就三层。第一层是物理连接，`USB` 调试开关加一根能传数据的线，用 `adb devices` 验证。第二层是网络可达，`Android` 用 `adb reverse` 通过数据线把设备的 `8081` 转到电脑上，`iOS` 靠同一局域网加编译期写入的 `IP`。第三层是控制入口，开发者菜单靠摇一摇或者 `adb shell input keyevent 82` 调出来，热更新、性能面板、服务器地址都在里面。

三层里任意一层断了，表现都是同一个红屏，所以排查必须按顺序来，从物理连接往上走，别一上来就怀疑代码。

最后再强调一次，真机上跑的 `Debug` 包和上架的 `Release` 包不是一回事。功能验证用 `Debug` 包没问题，性能和内存的结论必须在 `Release` 包上采。

## 参考

- [React Native 在设备上运行官方文档](https://reactnative.dev/docs/running-on-device)
- [React Native 调试官方文档](https://reactnative.dev/docs/debugging)
- [Android Debug Bridge 官方文档](https://developer.android.com/tools/adb)
- [Android 开发者选项官方说明](https://developer.android.com/studio/debug/dev-options)
- [React Native 真机性能调优实战](https://feinterview.poetries.top/blog/react-native-ios-android-device-performance-profiling)
- [前端进阶之旅](https://interview.poetries.top)
