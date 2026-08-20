---
title: React Native相机扫码实战从权限配置到扫描线动画
description: 用 react-native-camera 做二维码扫码页的完整实现，覆盖 Android 原生配置与权限清单、四块遮罩布局、Animated 扫描线动画、重复扫码的去抖处理，以及取景框组件的封装思路。
date: 2019-10-02 11:30:12
tags:
  - RN
  - react
  - 扫码
categories: Front-End
---

给运动手表做绑定功能，最自然的交互就是扫机身上那个二维码。听起来是个一天能搞完的活，实际做下来在原生配置上卡了大半天，`Android` 编译报 `missingDimensionStrategy` 相关的错，权限给了相机还是黑屏，扫到码之后弹框弹了三四次。这些坑一个都不在业务代码里。

这篇把当时用 `react-native-camera` 做扫码页的完整过程拆开讲，从原生工程配置、权限声明，一路讲到遮罩布局、扫描线动画和重复扫码的去抖处理。更多详情可以看官方文档 https://github.com/react-native-community/react-native-camera 。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 一个扫码页到底要解决哪几件事，为什么它比看上去麻烦
- `react-native-camera` 的原生配置，`missingDimensionStrategy` 那一行是干什么的
- `AndroidManifest.xml` 里哪些权限是扫码必需的，哪些是顺带声明的
- 用四块半透明遮罩围出中间的扫码区，这种布局怎么搭
- 用 `Animated` 做上下往复的扫描线，以及动画循环的写法
- 扫到码之后为什么会连续触发多次，怎么做去抖
- 取景框 `ViewFinder` 组件的封装，四个角是怎么画出来的
- 这个库现在已经归档了，社区转向了什么

先看做出来的效果。

![React Native 扫码页效果，中间为扫码取景框，四周为半透明遮罩](https://s.poetries.top/gitee/2019/10/676.png)

## 一、扫码页要解决的四件事

动手之前先把要做的事列清楚，代码结构就不会乱。

第一件是把相机预览铺满屏幕。`react-native-camera` 提供的 `RNCamera` 组件本身就是一个 `View`，给它设宽高就能显示预览画面。

第二件是识别二维码。这个库内置了条码识别能力，只要指定要识别的码制类型，识别到就通过回调把结果给你。这一步几乎不用自己写逻辑。

第三件是画界面。相机预览是铺满的，但用户需要一个明确的「把码放这里」的视觉引导。常见做法是在预览上盖一层半透明黑色遮罩，中间挖一个方形的洞，洞里画四个角的取景框，再加一条上下移动的扫描线。这部分是工作量最大的。

第四件是处理扫码结果。识别是持续进行的，同一个码在一秒内会被识别很多次，直接弹框会弹一堆。要做去重和状态控制。

四件事里，第三第四件才是真正花时间的地方。

## 二、装包和原生配置

装完包之后要把原生模块链接进工程。

```
react-native link react-native-camera
```

这条命令会自动修改 `Android` 和 `iOS` 的原生工程文件，把库的代码加进构建流程。需要说明的是，`react-native link` 这套手动链接机制在后来的版本里已经被自动链接（`autolinking`）取代了，装完包直接重新编译就行，不需要再执行 `link`。老项目升级上来的时候如果两套机制并存，反而会因为重复注册报错。

接着改 `Android` 的构建配置。

```js
// 配置andriod/app/src/build.gradle 

defaultConfig {
    applicationId "com.jtyapps"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1
    versionName "1.0"
    ndk {
        abiFilters "armeabi-v7a", "x86"
    }
    // 添加这里
    missingDimensionStrategy 'react-native-camera', 'general'
}

// 配置andriod/gradle/wrapper/gradle-wrapper.properties
// 本教程使用的是这个版本
distributionUrl=https\://services.gradle.org/distributions/gradle-4.10.1-all.zip
```

`missingDimensionStrategy` 这一行值得解释一下，因为不加它编译一定报错，而报错信息又看不出所以然。

`react-native-camera` 这个库在内部定义了一个叫 `react-native-camera` 的构建维度（`flavor dimension`），下面有两个取值。一个是 `general`，用的是 `Android` 自带的条码识别；另一个是 `mlkit`，接的是 `Google` 的机器学习套件，识别更强但要引入 `Google Play` 服务。`Gradle` 在合并依赖时发现你的主工程没有声明这个维度，就不知道该选哪个变体，于是直接报错。`missingDimensionStrategy` 的作用就是告诉它「我这边没这个维度，你就按 `general` 来」。

国内发行的应用一般选 `general`，因为 `mlkit` 依赖 `Google Play` 服务，国行手机上大多没有。

`abiFilters` 那两行是限制打包进 `APK` 的 `CPU` 架构。只留 `armeabi-v7a` 和 `x86` 能显著减小包体积，但要注意 `arm64-v8a` 被排除掉了，在 64 位设备上会以兼容模式运行 32 位库。这在当年问题不大，现在部分应用市场对 64 位支持是有硬性要求的，实际项目里得按上架要求来配。

`gradle-4.10.1` 这个版本是当时的选择，现在肯定要跟着 `Android Gradle Plugin` 的要求走，以官方文档为准。

## 三、权限清单

权限声明在 `andriod/app/src/main/AndroidManifest.xml` 里。

```html
  <uses-permission android:name="android.permission.BLUETOOTH"/>
  <uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
  <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE"/>
  <uses-permission android:name="android.permission.CHANGE_WIFI_STATE"/>
  <uses-permission android:name="android.permission.ACCESS_WIFI_STATE"/>
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
  <uses-permission android:name="android.permission.CAMERA"/> 
  <uses-permission android:name="android.permission.VIBRATE"/>
  <uses-feature android:name="android.hardware.camera" android:required="false"/>
  <uses-feature android:name="android.hardware.camera.front" android:required="false"/>
```

这一长串里，扫码真正需要的只有三条。`CAMERA` 是相机权限，缺了它 `RNCamera` 会一直黑屏。`VIBRATE` 用来在扫码成功时震一下，给用户一个明确的反馈。两条 `uses-feature` 声明相机是可选特性，`required="false"` 很重要，写成 `true` 的话没有摄像头的设备在应用市场里会直接看不到你的应用。

剩下那些是这个项目里其他功能带的。蓝牙和定位是心率带那部分需要的（这块的完整实现在[React Native 蓝牙连接心率带设备](https://feinterview.poetries.top/blog/rn-ble)里），网络状态是断网检测用的，存储权限是保存图片用的。

顺带修一处原文里的拼写错误。原来写的是 `READ_EXTERNAL_STORAGEE`，末尾多了一个 `E`，正确的常量名是 `READ_EXTERNAL_STORAGE`。上面代码块里我已经改过来了。这个错误的表现是权限静默失效，`Android` 不认识这个字符串就当没声明，运行时申请这个权限会一直失败，很容易查半天以为是机型问题。

另外要提醒的是，`Android 6.0` 之后 `CAMERA` 属于危险权限，光在清单里声明不够，运行时还得动态申请。原代码里用的是 `RNCamera` 组件自带的 `permissionDialogTitle` 和 `permissionDialogMessage` 两个属性，由组件内部去申请。这两个属性在后续版本里被 `androidCameraPermissionOptions` 这类新写法替代了，具体以你用的版本文档为准。

`iOS` 那边不用配这么多，只要在 `Info.plist` 里加上 `NSCameraUsageDescription` 说明用途，文案会显示在系统的权限弹框里，审核也会看这句话写得是否合理。

## 四、扫码页的整体结构

先看渲染部分的骨架。

```js
<View style={styles.allContainer}>
    <RNCamera
        barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
        onBarCodeRead={this.barcodeReceived.bind(this)}
        onCameraReady={() => { console.log('ready') }}
        permissionDialogTitle={'Permission to use camera'}
        permissionDialogMessage={'We need your permission to use your camera phone'}
        style={styles.cameraStyle}
    >
        {/* 顶部导航条（半透明黑） */}
        {/* 中间留白（半透明黑） */}
        {/* 扫码行：左遮罩 + 取景框 + 右遮罩 */}
        {/* 底部提示（半透明黑） */}
    </RNCamera> 
</View>
```

`RNCamera` 铺满全屏，所有 `UI` 都作为它的子元素叠在预览画面之上。这里的关键点是 `barCodeTypes`，只声明 `qr` 一种码制。识别的码制越少性能越好，如果还要扫条形码就把对应的类型加进数组。

`onBarCodeRead` 是识别回调，识别到就调用，参数里的 `e.data` 是解析出来的字符串内容。

遮罩的做法是把屏幕纵向切成四段。顶部导航条一段，中间留白一段，扫码行一段，底部提示一段。除了扫码行，其余三段都是 `backgroundColor: '#000'` 加 `opacity: 0.5`。扫码行内部再横向切三块，左右两块是同样的半透明黑，中间那块透明，露出下面的相机预览。四周暗、中间亮的效果就是这么拼出来的。

```js
<View style={{ flexDirection: 'row' }}>
    <View style={styles.fillView} />
    <View style={styles.scan}>
        <ViewFinder />
        {/* 扫描线 */}
    </View>
    <View style={styles.fillView} />
</View>
```

对应的样式里，`fillView` 的宽度是 `(width - scaleSizeH(300)) / 2`，也就是屏幕宽度减去扫码框宽度之后左右平分。这样不管什么屏幕宽度，扫码框都能居中。

```js
    fillView: {
        width: (width - scaleSizeH(300)) / 2,
        height: scaleSizeH(300),
        backgroundColor: '#000',
        opacity: 0.5
    },
    scan: {
        width: scaleSizeH(300),
        height: scaleSizeH(300),
        alignSelf: 'center'
    },
```

`scaleSizeH` 是项目里的尺寸换算函数，把设计稿标注折算成当前屏幕的逻辑像素，这套换算工具的写法可以看[React Native 图片宽高与字体的平台适配](https://feinterview.poetries.top/blog/rn-adapter)。这里宽高都用 `scaleSizeH`，是为了保证扫码框永远是正方形，用 `scaleSizeW` 和 `scaleSizeH` 各算一次的话在某些比例的屏幕上会变成长方形。

顶部导航条那块的高度也做了平台适配。

```js
    container: {
        ...Platform.select({
            ios: {
                height: 64 + StatusBar.currentHeight,
            },
            android: {
                height: 50 + StatusBar.currentHeight,
            }
        }),
        backgroundColor: '#000',
        opacity: 0.5
    },
```

这里有个坑要注意，`StatusBar.currentHeight` 在 `iOS` 上是 `undefined`，`undefined` 参与加法运算结果是 `NaN`，`NaN` 作为高度会被当成 0 处理。所以 `iOS` 分支实际拿到的高度并不是预期的 `64 + 状态栏高度`。要在两端都拿到准确的安全区高度，现在的做法是用 `react-native-safe-area-context`。

## 五、扫描线动画

那条上下往复的扫描线是用 `Animated` 做的。

```js
    //开始动画，循环播放
    _startAnimation = (isEnd) => {
        Animated.timing(this.state.fadeInOpacity, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear
        }).start(
            () => {
                if (isEnd) {
                    this.setState({
                        isEndAnimation: true
                    })
                    return;
                }
                if (!this.state.isEndAnimation) {
                    this.state.fadeInOpacity.setValue(0);
                    this._startAnimation(false)
                }
            }
        );
        // console.log("开始动画");
    }
```

思路是这样。用一个 `Animated.Value` 从 0 线性跑到 1，耗时 3 秒。跑完之后在回调里把值重置为 0，然后递归调用自己开始下一轮，形成循环。`isEndAnimation` 这个状态是循环的刹车，页面要离开的时候把它置成 `true`，下一轮就不会再启动了。

变量名叫 `fadeInOpacity` 有点误导，它实际控制的是位移不是透明度。这是从别处抄来的代码没改名字留下的痕迹，实际项目里建议改成 `scanLineY` 之类，不然过半年自己都看不懂。

渲染时把这个 0 到 1 的值映射成实际的位移距离。

```js
<Animated.View style={[styles.scanLine, {
    opacity: 1,
    transform: [{
        translateY: this.state.fadeInOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: [0, scaleSizeH(300)]
        })
    }]
}]}>
    <Image source={scanLine} />
</Animated.View>
```

`interpolate` 把 `[0, 1]` 映射到 `[0, 扫码框高度]`，扫描线就从框顶滑到框底。

这段有个性能上的改进点。`Animated.timing` 没有传 `useNativeDriver: true`，意味着每一帧的位移计算都要经过 `JS` 线程再发给原生，`JS` 线程一忙动画就会卡。`transform` 和 `opacity` 这类属性是支持原生驱动的，加上这个参数动画会跑在 `UI` 线程上，即使 `JS` 线程在做别的事也不掉帧。

```js
Animated.timing(this.state.scanLineY, {
  toValue: 1,
  duration: 3000,
  easing: Easing.linear,
  // 位移动画交给原生驱动，JS 线程忙的时候也不掉帧
  useNativeDriver: true
}).start(/* ... */)
```

另外，`Animated.loop` 也能实现循环，写起来比递归干净。递归写法的好处是每一轮都能插入自己的逻辑，看需求取舍。

## 六、扫到码之后的去抖

这是最容易翻车的一处。

`onBarCodeRead` 不是扫到一次触发一次，而是相机每识别出一帧带码的画面就触发一次。二维码稳定在取景框里的那一秒钟，这个回调可能被调了十几次。不做处理的话，`Modal.alert` 会连着弹十几个，用户点确定要点到手软。

原代码的处理是这样。

```js
    barcodeReceived (e){
        const {navigation:{navigate}} = this.props;
        if (e.data !== this.transCode) {
            Vibration.vibrate([0, 500, 200, 500]);
            this.transCode = e.data; // 放在this上，防止触发多次，setstate有延时
            if (this.state.flag) {
                this.changeState(false);
            }
            console.log("transCode=" + this.transCode);
            Modal.alert('温馨提示', `确定绑定: ${this.transCode} 吗？`, [
                {
                  text: '取消',
                  onPress: () => console.log('cancel'),
                  style: 'cancel',
                },
                { text: '确定', onPress: () => {
                    navigate('Record')
                } },
            ]);
        }
    }
```

关键在那句注释，`transCode` 放在 `this` 上而不是 `state` 里。

为什么不能用 `state`？因为 `setState` 是异步的，调用之后 `this.state` 不会立刻更新。相机回调触发得非常密集，第二次回调进来的时候第一次的 `setState` 很可能还没生效，判断依然通过，弹框还是会弹多次。直接挂在实例属性上是同步赋值，下一次回调进来立刻就能读到新值。

这是个很实用的小技巧，凡是「高频回调里需要立刻生效的标志位」都适用，不只是扫码。

`Vibration.vibrate([0, 500, 200, 500])` 是震动模式，数组里的数字交替表示等待和震动的毫秒数，这里是立刻震 500 毫秒，停 200 毫秒，再震 500 毫秒。给用户一个「扫到了」的明确反馈，比只弹个框体验好很多。

还有个细节，`componentWillReceiveProps` 里在 `key` 变化时重置了 `this.transCode`。

```js
    componentWillReceiveProps(nProps) {
        const {key } = this.state;
        const {navigation} = nProps;

        let newKey = navigation.getParam('key');

        if(key!=newKey){
            this.transCode = '';
            this.setState({
                key: newKey
            })
        }
        console.log('scan进来了')
      }
```

这是在处理「用户扫完一次，返回，又进来扫同一个码」的场景。不重置的话 `this.transCode` 还留着上次的值，判断 `e.data !== this.transCode` 不成立，第二次扫同一个码就没反应了。用一个路由参数 `key` 作为「这是新的一次扫码」的信号。

`componentWillReceiveProps` 这个生命周期在 `React 16.3` 之后就被标记为不安全了，现在的写法是 `getDerivedStateFromProps`，或者干脆在进入页面时通过 `navigation` 的聚焦事件重置。函数组件的话用 `useEffect` 监听参数变化更直接。

## 七、取景框组件

`ViewFinder` 是那四个角的实现，单独抽成了组件。

```js
// ViewFinder.js
export default class Viewfinder extends Component {
    getEdgeColor = () => ({ borderColor: this.props.color })

    getEdgeSizeStyles = () => ({
        height: this.props.borderLength,
        width: this.props.borderLength,
    })

    render() {
        return (
            <View style={[styles.container, this.getBackgroundColor()]}>
                <View style={[styles.viewfinder, this.getSizeStyles()]}>
                    {/* 左上角：只画左边框和上边框 */}
                    <View style={[ this.getEdgeColor(), this.getEdgeSizeStyles(), styles.topLeftEdge,
                        { borderLeftWidth: this.props.borderWidth, borderTopWidth: this.props.borderWidth } ]} />
                    {/* 右上、左下、右下三个角同理，各画两条边 */}
                </View>
            </View>
        );
    }
}
```

四个角的画法很巧妙，值得说一下。每个角是一个 `20x20` 的 `View`，用绝对定位钉在容器的四个角上，然后只给它两条边框。左上角那个只设 `borderLeftWidth` 和 `borderTopWidth`，另外两边不设，渲染出来就是一个「厂」字形。四个角各转一下方向，拼起来就是常见的那个取景框造型。

比起用图片切好一整张边框图，这种画法的好处是颜色、粗细、边长都能通过 `props` 调，换个主题色不用重新出图。

```js
    topLeftEdge: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    topRightEdge: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
```

容器本身是 `position: 'absolute'` 加四个方向都为 0，也就是完全撑满父容器，然后内部用 `alignItems` 和 `justifyContent` 把取景框居中。这样 `ViewFinder` 可以直接丢进任何一个容器里而不用关心尺寸。

默认值都写在 `defaultProps` 里，边框宽 3、角长 20、颜色是个亮蓝色，尺寸和外面的扫码框保持一致。

```js
Viewfinder.defaultProps = {
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderLength: 20,
    color: '#1DBAF1',
    height: scaleSizeH(300),
    isLoading: false,
    width: scaleSizeH(300),
};
```

`isLoading` 那个属性会在取景框中间显示一个转圈的 `ActivityIndicator`，用在「扫到码之后正在请求接口」的过渡状态上，避免用户以为没扫上继续对着晃。

## 八、页面怎么进

用起来很简单，扫码页作为一个独立路由，从别处 `navigate` 过去就行。

```js
// 使用方式
onScan = ()=>{
    const { navigate } = this.props.navigation;
    // 跳转到扫码页面即可打开
    navigate('Scan')
}
```

`navigationOptions` 里设了 `header: null`，把导航栏隐藏掉，因为扫码页自己画了顶部的返回按钮。返回按钮的处理里要记得把 `isEndAnimation` 置成 `true` 停掉动画循环，不然页面出栈了定时动画还在跑。

```js
    //返回按钮点击事件
    _goBack = () => {
        this.setState({
            isEndAnimation: true,
        });
        this.props.navigation.goBack();
    }
```

这个逻辑我建议顺手挪一份到 `componentWillUnmount` 里。用户用系统返回手势或者硬件返回键退出的时候不会走 `_goBack`，动画就停不下来了。

## 九、这个库现在的情况

必须说清楚时效性。

`react-native-camera` 这个库目前已经归档，不再维护了。仓库的 `README` 里明确建议迁移到其他方案，社区现在的主流选择是 `react-native-vision-camera`，扫码能力由它配合识别插件提供。新项目直接用新库，不要再照抄这篇的依赖配置。

不过这篇里讲的东西大部分不会过时。四块遮罩围出扫码区的布局思路、`Animated` 做扫描线、用实例属性做高频回调去抖、四个角用双边框拼出取景框，这些都和具体的相机库无关，换库之后只是把 `RNCamera` 这个组件换掉，外面那层 `UI` 照抄就行。原生配置那部分（`missingDimensionStrategy`、`abiFilters`）是 `Gradle` 的通用知识，遇到别的库有构建维度冲突也是一样的解法。

新库的具体 `API` 名字和权限配置以它自己的官方文档为准，我这边只在老库上验证过，不敢瞎写。

## 总结

扫码页看着是个小功能，实际是原生配置、权限、布局、动画、状态控制五块东西叠在一起。

原生这一层，`missingDimensionStrategy` 是必加的，不加编译过不去，它解决的是库内部构建维度和主工程不匹配的问题。权限这一层，真正必需的只有 `CAMERA` 和 `VIBRATE` 加两条 `uses-feature`，其余是项目其他功能带的，另外 `READ_EXTERNAL_STORAGEE` 那个拼写错误要改掉。

`UI` 这一层，用四块半透明遮罩围出中间的透明区是最省事的做法，比用 `mask` 或者自定义绘制简单得多。扫描线用 `Animated.Value` 加 `interpolate` 映射位移，记得补 `useNativeDriver: true`。

最容易踩的还是去抖那一处。`onBarCodeRead` 一秒会触发十几次，标志位必须放在实例属性上而不是 `state` 里，因为 `setState` 的异步性会让判断失效。这个坑不是扫码独有的，所有高频回调里都适用。

如果你现在要新做一个扫码页，库换成 `react-native-vision-camera`，上面这些布局和状态处理的思路可以直接搬。

## 参考

- [react-native-camera 官方仓库](https://github.com/react-native-community/react-native-camera)
- [react-native-vision-camera 官方文档](https://react-native-vision-camera.com/)
- [React Native Animated 官方文档](https://reactnative.dev/docs/animated)
- [Android 相机权限官方文档](https://developer.android.com/media/camera/camera-deprecated/camera-api)
- [Gradle 构建维度与 missingDimensionStrategy 官方文档](https://developer.android.com/build/build-variants)
- [React Native 蓝牙连接心率带设备](https://feinterview.poetries.top/blog/rn-ble)
- [前端进阶之旅](https://interview.poetries.top)
