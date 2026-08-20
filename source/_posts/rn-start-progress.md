---
title: React Native启动流程源码拆解从MainActivity到第一帧
description: 跟着源码走一遍 React Native 在 Android 上的冷启动全过程，从 MainApplication、ReactActivityDelegate、ReactInstanceManager 到 C++ 层的 JSCExecutor，最后回到 AppRegistry.runApplication 完成首帧渲染。
date: 2019-10-02 15:40:12
tags:
  - RN
  - react
  - 源码
categories: Front-End
---

`React Native` 的项目跑起来之后，最让人好奇的一件事是，你在 `index.js` 里就写了一行 `AppRegistry.registerComponent`，`Android` 那边一个 `MainActivity` 里就写了个返回字符串的方法，这两头是怎么对上的？中间隔着 `Java`、`C++`、`JavaScript` 三层，`bundle` 从哪儿读、`JS` 引擎什么时候创建、第一帧是谁触发的，光看业务代码是一点线索都没有。

这篇跟着源码把 `Android` 侧的冷启动完整走一遍。从 `MainApplication` 出发，一层层往下到 `C++` 的 `JSCExecutor`，再从 `JS` 侧的 `AppRegistry.js` 折返回来完成首帧渲染。读完你应该能在脑子里画出这条完整的调用链，看到启动慢或者白屏的时候知道该往哪一段查。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `JS` 侧的入口 `AppRegistry.registerComponent`，那个字符串名字是干什么用的
- `MainApplication` 和 `MainActivity` 各自负责什么，`SoLoader` 在加载谁
- `ReactActivity` 为什么把所有活都委托给 `ReactActivityDelegate`
- `ReactRootView.startReactApplication` 的三个参数分别是什么
- `ReactInstanceManager` 怎么在后台线程里创建 `ReactContext`
- `CatalystInstance` 构造时的 `initializeBridge` 到底桥接了什么
- `JSBundleLoader` 在 `Debug` 和 `Release` 下分别从哪里读 `bundle`
- 下到 `C++` 层，`Instance.cpp` 到 `JSCExecutor.cpp` 这一段发生了什么
- 回到 `Java` 侧，`setupReactContext` 和 `runApplication` 怎么触发首帧
- 这条链路在新架构下变成了什么样

## 一、先给一张地图

具体的类名很多，先把主干记住，后面看细节才不会迷路。

整条链路可以概括成一句话，`Java` 侧准备好环境和模块表，交给 `C++` 侧把 `JS bundle` 喂进引擎执行，`JS` 侧执行完注册好组件，`Java` 侧再回头喊一声「跑吧」，`JS` 才开始渲染。

按调用顺序排一遍是这样。

```
MainApplication (SoLoader 加载 C++ 库)
  → MainActivity → ReactActivity → ReactActivityDelegate.onCreate
  → ReactRootView.startReactApplication
  → ReactInstanceManager.createReactContextInBackground
  → createReactContext (建两张模块注册表 + CatalystInstance)
  → CatalystInstanceImpl.initializeBridge (JNI 下到 C++)
  → JSBundleLoader.loadScript → CatalystInstanceImpl.cpp
  → Instance.cpp → NativeToJsBridge.cpp → JSCExecutor.cpp (真正执行 JS)
  → 回到 Java：setupReactContext → rootView.runApplication
  → AppRegistry.js runApplication → 开始渲染
```

注意中间有一次「下到 `C++` 再折回 `Java`」的往返，这是最容易看晕的地方，遇到的时候回来看这张图。

## 二、JS 侧的入口

先从最熟悉的那一端看起。`JS` 程序的入口做的事只有一件，把当前 `App` 的根组件注册到 `AppRegistry` 这个 `JS` 模块里。

```js
import { AppRegistry } from 'react-native'
// ...省略代码

AppRegistry.registerComponent('demo', () => Index)
```

`registerComponent` 的第一个参数是组件名，第二个是一个返回根组件的工厂函数。注意它只是「注册」，登记在一张表里，并没有渲染任何东西。真正的渲染要等原生侧准备好之后回过头来调 `runApplication`，那时候才会按这个名字去表里找组件。

那个字符串 `'demo'` 是两端约定的暗号，记住它，第三节马上会再见到。

## 三、MainApplication 和 MainActivity

新建一个 `RN` 项目，原生代码里会生成 `MainActivity` 和 `MainApplication` 两个 `Java` 类。顾名思义，`MainActivity` 就是原生侧的入口。

先看 `MainApplication` 做了哪些事。

```java
public class MainApplication extends Application implements ReactApplication {
    //ReactNativeHost：持有ReactInstanceManager实例，做一些初始化操作。
  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage()
      );
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    //SoLoader：加载C++底层库，准备解析JS。
    SoLoader.init(this, /* native exopackage */ false);
  }
}
```

这个类里有三处值得留意。

`ReactNativeHost` 是一个持有 `ReactInstanceManager` 实例的容器，做一些初始化配置。`getUseDeveloperSupport` 返回 `BuildConfig.DEBUG`，这一个布尔值决定了后面一系列分支，包括 `bundle` 从 `Metro` 服务器拉还是从 `assets` 读、红屏错误提示要不要显示、开发者菜单能不能调出来。所以 `Debug` 包和 `Release` 包在启动路径上是真的不一样，测性能必须用 `Release` 包，这一点在[React Native 真机调试完整流程](https://feinterview.poetries.top/blog/rn-device-debug)里也提到过。

`getPackages` 返回的是这个应用要加载的所有 `ReactPackage`。装一个原生库要在这里加一行，说的就是这个位置（后来有了自动链接就不用手动加了）。每个 `Package` 里声明了它提供哪些 `NativeModule` 和 `ViewManager`，第六节创建注册表的时候会遍历这个列表。

`SoLoader.init` 是在加载 `C++` 底层库，为后面解析 `JS` 做准备。这一步失败的话，启动会直接崩在最开始，报的是找不到 `so` 库。

再看 `MainActivity`。

```java
public class MainActivity extends ReactActivity {

    @Override
    protected String getMainComponentName() {
        return "demo";
    }
}
```

它继承了 `ReactActivity`，只重写了 `getMainComponentName` 方法。看这个返回值，`"demo"`，和第二节 `AppRegistry.registerComponent` 的第一个参数是同一个字符串。

这就是那个暗号。原生侧最后会拿这个名字去 `JS` 侧的注册表里查组件，两边不一致就查不到，启动时会报「`Application demo has not been registered`」。这个错误信息在第十一节还会再见到一次。

## 四、ReactActivity 与 ReactActivityDelegate

看 `ReactActivity` 的 `onCreate`。

```java
public abstract class ReactActivity extends Activity
    implements DefaultHardwareBackBtnHandler, PermissionAwareActivity {
    private final ReactActivityDelegate mDelegate;

    ...省略代码

     @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    mDelegate.onCreate(savedInstanceState);
  }    
}
```

一行实际逻辑都没有，全权委托给了 `ReactActivityDelegate`。

这个设计不是多此一举。`Activity` 的继承链只有一条，如果 `RN` 的逻辑全写在 `ReactActivity` 里，那你的 `Activity` 就必须继承它，没法再继承公司内部的 `BaseActivity`。把逻辑抽到 `Delegate` 里之后，任何 `Activity` 都可以自己 `new` 一个 `ReactActivityDelegate` 持有着，在各个生命周期回调里转发一下就行。混合开发的项目基本都是这么接的。

接着看 `Delegate` 里干了什么。

```java
public class ReactActivityDelegate {
      protected void onCreate(Bundle savedInstanceState) {
      // 弹框权限判断
    boolean needsOverlayPermission = false;
    if (getReactNativeHost().getUseDeveloperSupport() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      // Get permission to show redbox in dev builds.
      if (!Settings.canDrawOverlays(getContext())) {
        needsOverlayPermission = true;
        Intent serviceIntent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getContext().getPackageName()));
        FLog.w(ReactConstants.TAG, REDBOX_PERMISSION_MESSAGE);
        Toast.makeText(getContext(), REDBOX_PERMISSION_MESSAGE, Toast.LENGTH_LONG).show();
        ((Activity) getContext()).startActivityForResult(serviceIntent, REQUEST_OVERLAY_PERMISSION_CODE);
      }
    }
        // 加载组建逻辑 mMainComponentName为getMainComponentName返回的值
    if (mMainComponentName != null && !needsOverlayPermission) {
      loadApp(mMainComponentName);
    }
    // 双击判断工具类
    mDoubleTapReloadRecognizer = new DoubleTapReloadRecognizer();
  }

  protected void loadApp(String appKey) {
     //空判断
    if (mReactRootView != null) {
      throw new IllegalStateException("Cannot loadApp while app is already running.");
    }
    // 创建 RN容器根视图
    mReactRootView = createRootView();
    mReactRootView.startReactApplication(
      getReactNativeHost().getReactInstanceManager(),
      appKey,
      getLaunchOptions());
      //将rootview添加入activity
    getPlainActivity().setContentView(mReactRootView);
  }
}
```

`onCreate` 里做了两件事。前半段是弹框权限判断，`Debug` 包下要显示红屏错误提示，而红屏是一个悬浮窗，`Android 6.0` 及以上需要用户授予「显示在其他应用上层」的权限。没有这个权限就得跳到系统设置去申请，这也是为什么有些开发机第一次跑 `RN` 项目会莫名其妙跳到一个设置页面。`Release` 包不需要红屏，所以这段不会执行。

后半段调 `loadApp`，参数就是 `MainActivity` 里 `getMainComponentName` 返回的那个 `"demo"`。

`loadApp` 做的事是创建 `RootView`，把它接到 `ReactInstanceManager` 上，然后设为 `Activity` 的内容视图。

注意 `mReactRootView != null` 那个判断，重复调用 `loadApp` 会直接抛异常。这个约束在混合开发里要留意，同一个 `Delegate` 不能复用来加载第二个页面。

## 五、ReactRootView 与 startReactApplication

`ReactRootView` 是一个自定义的 `View`，父类是 `FrameLayout`。所以可以把整个 `RN` 页面看成一个特殊的「自定义 View」，它和普通的 `Android` 视图没有本质区别，这也是 `RN` 能和原生页面混合的基础。

看它的 `startReactApplication` 方法。

```java
public void startReactApplication(
      ReactInstanceManager reactInstanceManager,
      String moduleName,
      @Nullable Bundle initialProperties) {
        ...省略代码
    try {
        //在UI线程中进行
      UiThreadUtil.assertOnUiThread();

      Assertions.assertCondition(
        mReactInstanceManager == null,
        "This root view has already been attached to a catalyst instance manager");
        // 赋值
      mReactInstanceManager = reactInstanceManager;
      mJSModuleName = moduleName;
      mAppProperties = initialProperties;
        // 判断ReactContext是否初始化，没有就异步进行初始化
      if (!mReactInstanceManager.hasStartedCreatingInitialContext()) {
        mReactInstanceManager.createReactContextInBackground();
      }
        //宽高计算完成后添加布局监听
      attachToReactInstanceManager();
    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }
```

第一行 `UiThreadUtil.assertOnUiThread()` 就把约束定死了，这个方法必须在 `UI` 线程调用。后面的 `attachToReactInstanceManager` 会在视图宽高测量完成后添加布局监听，这个动作也只能在 `UI` 线程做。

三个参数的含义如下。

| 形参 | 描述 |
|---|---|
| `reactInstanceManager` | `ReactInstanceManager` 类型，创建和管理 `CatalystInstance` 的实例 |
| `moduleName` | 就是前面那个组件名，一路从 `getMainComponentName` 传过来 |
| `initialProperties` | 原生向 `JS` 传递的初始数据，默认是 `null`。需要的话要重写 `createReactActivityDelegate`，并在其中重写 `getLaunchOptions` 方法 |

`initialProperties` 这个参数在混合开发里很有用。原生页面跳进 `RN` 页面时想带点参数过去，比如用户 `ID` 或者一个业务单号，就是通过它传的，`JS` 侧在根组件的 `props` 里能直接拿到。

方法里最关键的是这个判断，如果 `ReactContext` 还没开始创建，就调 `createReactContextInBackground` 异步创建。方法名里的 `InBackground` 说明这活是在后台线程做的，不会阻塞 `UI` 线程，这也是为什么 `RN` 页面刚打开时会先白一下再出内容。

## 六、ReactInstanceManager 创建 ReactContext

```java
public void createReactContextInBackground() {
    //首次执行
     mHasStartedCreatingInitialContext = true;
    recreateReactContextInBackgroundInner();
}
```

这个方法在一个应用里只会执行一次。`JS` 热重载的时候走的是 `recreateReactContextInBackground`，两个方法最终都会汇到 `recreateReactContextInBackgroundInner`。

```java
@ThreadConfined(UI)
  private void recreateReactContextInBackgroundInner() {
    // 确保在UI线程中执行
    UiThreadUtil.assertOnUiThread();

    if (mUseDeveloperSupport && mJSMainModuleName != null &&
      !Systrace.isTracing(TRACE_TAG_REACT_APPS | TRACE_TAG_REACT_JSC_CALLS)) {
        // 调试模式，加载服务器bundle
      return;
    }
    // 加载本地bundle
    recreateReactContextInBackgroundFromBundleLoader();
  }

  @ThreadConfined(UI)
  private void recreateReactContextInBackgroundFromBundleLoader() {
    recreateReactContextInBackground(
        new JSCJavaScriptExecutor.Factory(mJSCConfig.getConfigMap()),
        mBundleLoader);
  }
```

这里是 `Debug` 和 `Release` 分叉的地方。开发模式下走上面那个提前 `return` 的分支，去连 `Metro` 服务器要 `bundle`；正式包走下面的 `recreateReactContextInBackgroundFromBundleLoader`，从本地 `assets` 读。

两个参数的含义如下。

| 形参 | 描述 |
|---|---|
| `jsExecutorFactory` | `C++` 和 `JS` 双向通信的中转站的工厂 |
| `jsBundleLoader` | `bundle` 加载器，根据 `ReactNativeHost` 中的配置决定从哪里加载 `bundle` 文件 |

```java
private void recreateReactContextInBackground(
    JavaScriptExecutor.Factory jsExecutorFactory,
    JSBundleLoader jsBundleLoader) {
    UiThreadUtil.assertOnUiThread();

     //创建ReactContextInitParams对象
    final ReactContextInitParams initParams = new ReactContextInitParams(
      jsExecutorFactory,
      jsBundleLoader);
    if (mCreateReactContextThread == null) {
        // 新增线程初始化ReactContext
      runCreateReactContextOnNewThread(initParams);
    } else {
      mPendingReactContextInitParams = initParams;
    }
  }
```

`runCreateReactContextOnNewThread` 里有一个核心方法 `createReactContext` 用来创建 `ReactContext`。下面这段是整条启动链路里信息量最大的一块，值得逐行看。

```java
private ReactApplicationContext createReactContext(
      JavaScriptExecutor jsExecutor,
      JSBundleLoader jsBundleLoader) {
    // 包装ApplicationContext
    final ReactApplicationContext reactContext = new ReactApplicationContext(mApplicationContext);
    //创建JavaModule注册表Builder，用来创建JavaModule注册表，JavaModule注册表将所有的JavaModule注册到CatalystInstance中。
    NativeModuleRegistryBuilder nativeModuleRegistryBuilder = new NativeModuleRegistryBuilder(
      reactContext,
      this,
      mLazyNativeModulesEnabled);
      // 创建JavaScriptModule注册表Builder
    JavaScriptModuleRegistry.Builder jsModulesBuilder = new JavaScriptModuleRegistry.Builder();
    if (mUseDeveloperSupport) {
      // 调试模式下，将错误交给DevSupportManager处理
      reactContext.setNativeModuleCallExceptionHandler(mDevSupportManager);
    }

    ...省略代码

    try {
      //创建CoreModulesPackage，其中封装了RN Framework核心功能，通信、调试等。
      CoreModulesPackage coreModulesPackage =
        new CoreModulesPackage(
          this,
          mBackBtnHandler,
          mUIImplementationProvider,
          mLazyViewManagersEnabled);
          //把各自的Module添加到对应的注册表中
      processPackage(coreModulesPackage, nativeModuleRegistryBuilder, jsModulesBuilder);
    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }
    // 将我们Application中的ReactPackage循环处理，加入对应的注册表中。
   for (ReactPackage reactPackage : mPackages) {
        ...省略代码
      try {
        processPackage(reactPackage, nativeModuleRegistryBuilder, jsModulesBuilder);
      } finally {
        Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
      }
    }
    ...省略代码
    //生成Java注册表，将Java可调用的API暴露给JS
    NativeModuleRegistry nativeModuleRegistry;
    try {
       nativeModuleRegistry = nativeModuleRegistryBuilder.build();
    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
      ReactMarker.logMarker(BUILD_NATIVE_MODULE_REGISTRY_END);
    }

    NativeModuleCallExceptionHandler exceptionHandler = mNativeModuleCallExceptionHandler != null
        ? mNativeModuleCallExceptionHandler
        : mDevSupportManager;
     //构建CatalystInstanceImpl实例
    CatalystInstanceImpl.Builder catalystInstanceBuilder = new CatalystInstanceImpl.Builder()
      .setReactQueueConfigurationSpec(mUseSeparateUIBackgroundThread ?
        ReactQueueConfigurationSpec.createWithSeparateUIBackgroundThread() :
        ReactQueueConfigurationSpec.createDefault())
        //JS执行通信类
      .setJSExecutor(jsExecutor)
      //Java模块注册表
      .setRegistry(nativeModuleRegistry)
      // JS注册表
      .setJSModuleRegistry(jsModulesBuilder.build())
      // Bundle加载工具类
      .setJSBundleLoader(jsBundleLoader)
      // 异常处理器
      .setNativeModuleCallExceptionHandler(exceptionHandler);

    // 省略代码

   final CatalystInstance catalystInstance;
    try {
      catalystInstance = catalystInstanceBuilder.build();
    } finally {
        //省略代码
   }

    if (mBridgeIdleDebugListener != null) {
      catalystInstance.addBridgeIdleDebugListener(mBridgeIdleDebugListener);
    }
    if (Systrace.isTracing(TRACE_TAG_REACT_APPS | TRACE_TAG_REACT_JSC_CALLS)) {
 //调用CatalystInstanceImpl的Native方法把Java Registry转换为Json，再由C++层传送到JS层。     catalystInstance.setGlobalVariable("__RCTProfileIsProfiling", "true");
    }

    //关联ReacContext与CatalystInstance
    reactContext.initializeWithInstance(catalystInstance);
    //通过CatalystInstance开始加载JS Bundle
    catalystInstance.runJSBundle();

    return reactContext;
  }
```

这段代码比较长，拆开看它主要做了四件事。

创建 `JavaModule` 注册表和 `JavaScriptModule` 注册表，交给 `CatalystInstance` 管理。处理 `ReactPackage`，把各自的 `Module` 放进对应的注册表。用前面准备好的各个参数创建 `CatalystInstance` 实例。最后让 `CatalystInstance` 关联 `ReactContext`，开始加载 `JS Bundle`。

两张注册表就是[React Native 原理浅析](https://feinterview.poetries.top/blog/rn-yuanli)里讲的那套「两边各存一份模块映射表」在 `Android` 上的落地。`NativeModuleRegistry` 记录 `Java` 侧暴露给 `JS` 的所有方法，`JavaScriptModuleRegistry` 记录 `JS` 侧暴露给 `Java` 的所有方法。跨界调用时传的 `moduleID` 和 `methodID`，查的就是这两张表。

有个性能上的细节值得注意，`mLazyNativeModulesEnabled` 这个开关控制原生模块是不是懒加载。开着的话注册时只记名字不创建实例，第一次被 `JS` 调到时才真正 `new` 出来。项目里原生模块一多，这个开关对冷启动的影响是能测出来的。

`CoreModulesPackage` 那一块封装的是 `RN` 框架自己的核心功能，通信、调试、`UIManager` 这些，它会先于业务的 `ReactPackage` 被处理。

## 七、CatalystInstance 与 initializeBridge

看 `CatalystInstance` 的实现类 `CatalystInstanceImpl` 的构造方法。

```java
private CatalystInstanceImpl(
      final ReactQueueConfigurationSpec reactQueueConfigurationSpec,
      final JavaScriptExecutor jsExecutor,
      final NativeModuleRegistry registry,
      final JavaScriptModuleRegistry jsModuleRegistry,
      final JSBundleLoader jsBundleLoader,
      NativeModuleCallExceptionHandler nativeModuleCallExceptionHandler) {
    //用来创建JNI相关方法，并返回mHybridData
    mHybridData = initHybrid();
    // Android UI线程、JS线程、NativeMOdulesQueue线程
    mReactQueueConfiguration = ReactQueueConfigurationImpl.create(
        reactQueueConfigurationSpec,
        new NativeExceptionHandler());
    // 省略代码
    //调用 C++ 层代码进行初始化Bridge
    initializeBridge(
      new BridgeCallback(this),
      jsExecutor,
      mReactQueueConfiguration.getJSQueueThread(),
      mNativeModulesQueueThread,
      mUIBackgroundQueueThread,
      mJavaRegistry.getJavaModules(this),
      mJavaRegistry.getCxxModules());

  }
```

`initHybrid()` 返回的 `mHybridData` 是 `JNI` 相关的句柄，它把 `Java` 对象和 `C++` 对象绑在一起。`ReactQueueConfigurationImpl.create` 创建的是那几条消息队列线程，也就是原理篇里说的三条线在 `Android` 上的实现。

真正的重头戏是 `initializeBridge`，它是一个 `native` 方法，调过去就下到 `C++` 层了。

```java
private native void initializeBridge(
      ReactCallback callback,
      JavaScriptExecutor jsExecutor,
      MessageQueueThread jsQueue,
      MessageQueueThread moduleQueue,
      MessageQueueThread uiBackgroundQueue,
      Collection<JavaModuleWrapper> javaModules,
      Collection<ModuleHolder> cxxModules);
```

参数含义如下。

| 形参 | 描述 |
|---|---|
| `ReactCallback` | `CatalystInstanceImpl` 的静态内部类，负责接口回调 |
| `JavaScriptExecutor` | `JS` 执行器，把 `JS` 的调用传给 `C++` 层 |
| `MessageQueueThread jsQueue` | `JS` 线程 |
| `MessageQueueThread moduleQueue` | `Java` 模块所在的线程 |
| `MessageQueueThread uiBackgroundQueue` | `UI` 背景线程 |
| `javaModules` | `Java` 侧的模块集合 |
| `cxxModules` | `C++` 侧的模块集合 |

这一步把线程、模块表、执行器三样东西全都交给了 `C++` 层。从这里开始，`Java` 和 `JS` 之间就真正接通了。

桥接好之后，`createReactContext` 方法里用 `catalystInstance.runJSBundle()` 来加载 `JS bundle`。

```java
@Override
  public void runJSBundle() {

    ...
    mJSBundleLoader.loadScript(CatalystInstanceImpl.this);
    ...
  }
```

## 八、JSBundleLoader 从哪里读 bundle

`runJSBundle()` 会调 `JSBundleLoader` 去加载 `JS Bundle`。不同场景下用的是不同的 `JSBundleLoader` 实现，这里看其中一种。

```java
public abstract class JSBundleLoader {

  /**
   * This loader is recommended one for release version of your app. In that case local JS executor
   * should be used. JS bundle will be read from assets in native code to save on passing large
   * strings from java to native memory.
   */
  public static JSBundleLoader createAssetLoader(
      final Context context,
      final String assetUrl,
      final boolean loadSynchronously) {
    return new JSBundleLoader() {
      @Override
      public String loadScript(CatalystInstanceImpl instance) {
        instance.loadScriptFromAssets(context.getAssets(), assetUrl, loadSynchronously);
        return assetUrl;
      }
    };
  }
```

`createAssetLoader` 就是正式包走的那条路，注释里也写明了这是给 `release` 版本推荐的方式。`JS bundle` 直接在原生代码里从 `assets` 读，避免把一个几 `MB` 的大字符串从 `Java` 传到 `native` 内存，省一次拷贝。

开发模式下用的是另一个实现，从 `Metro` 服务器把 `bundle` 下载下来再加载。这也解释了为什么 `Debug` 包第一次启动明显慢，它要等 `Metro` 完整打包一次。

它会继续调用 `CatalystInstance` 中的 `loadScriptFromAssets` 方法。

```java
public class CatalystInstanceImpl {

  /* package */ void loadScriptFromAssets(AssetManager assetManager, String assetURL) {
    mSourceURL = assetURL;
    jniLoadScriptFromAssets(assetManager, assetURL);
  }

  private native void jniLoadScriptFromAssets(AssetManager assetManager, String assetURL);

}
```

又是一个 `native` 方法，说明马上要下到 `C++` 层了。

下去之前先看一眼源码的目录结构，知道这些文件都在哪儿，跟着看的时候不容易迷路。

![React Native Android 端源码结构图，展示 Java 层、JNI 层与 C++ 层的文件组织](https://s.poetries.top/gitee/2019/10/677.png)

## 九、下到 C++ 层

### 9.1 CatalystInstanceImpl.cpp

在 `ReactAndroid` 的 `JNI` 部分，能找到刚才那个 `native` 方法的实现。

```cpp
void CatalystInstanceImpl::jniLoadScriptFromAssets(
    jni::alias_ref<JAssetManager::javaobject> assetManager,
    const std::string& assetURL,
    bool loadSynchronously) {
  const int kAssetsLength = 9;  // strlen("assets://");
  // 获取soure js Bundle的路径名
  auto sourceURL = assetURL.substr(kAssetsLength);
  // 获取AssetManager
  auto manager = extractAssetManager(assetManager);
  // 读取JS Bundle里的内容
  auto script = loadScriptFromAssets(manager, sourceURL);
  // unbundle命令打包判断
  if (JniJSModulesUnbundle::isUnbundle(manager, sourceURL)) {
    instance_->loadUnbundle(
      folly::make_unique<JniJSModulesUnbundle>(manager, sourceURL),
      std::move(script),
      sourceURL,
      loadSynchronously);
    return;
  } else {
    //bundle命令打包走此流程，instance_是Instance.h中类的实例
    instance_->loadScriptFromString(std::move(script), sourceURL, loadSynchronously);
  }
}
```

这个函数干了四件事，去掉 `assets://` 前缀拿到真实路径，取出 `AssetManager`，把 `bundle` 内容读进内存，然后判断打包方式走不同分支。

`isUnbundle` 那个判断值得说一下，第 9.3 节会展开 `unbundle` 是什么。

### 9.2 Instance.cpp

```cpp
void Instance::loadScriptFromString(std::unique_ptr<const JSBigString> string,
                                    std::string sourceURL,
                                    bool loadSynchronously) {
  SystraceSection s("reactbridge_xplat_loadScriptFromString", "sourceURL", sourceURL);
  if (loadSynchronously) {
    loadApplicationSync(nullptr, std::move(string), std::move(sourceURL));
  } else {
    loadApplication(nullptr, std::move(string), std::move(sourceURL));
  }
}

void Instance::loadApplicationSync(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    std::unique_ptr<const JSBigString> string,
    std::string sourceURL) {
  std::unique_lock<std::mutex> lock(m_syncMutex);
  m_syncCV.wait(lock, [this] { return m_syncReady; });

  SystraceSection s("reactbridge_xplat_loadApplicationSync", "sourceURL", sourceURL);
  //nativeToJsBridge_也是在Instance::initializeBridget()方法里初始化的，具体实现在NativeToJsBridge.cpp里。
  nativeToJsBridge_->loadApplicationSync(std::move(unbundle), std::move(string), std::move(sourceURL));
}
```

这里有个同步和异步的分叉。`loadApplicationSync` 会先拿锁等 `m_syncReady`，阻塞当前线程直到加载完成；`loadApplication` 则是把任务丢到执行队列上异步跑。绝大多数场景走的是异步那条，同步加载只在特定场景下用，因为它会卡住调用方。

### 9.3 NativeToJsBridge.cpp

```cpp
void NativeToJsBridge::loadApplication(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    std::unique_ptr<const JSBigString> startupScript,
    std::string startupScriptSourceURL) {

  //获取一个MessageQueueThread，然后在线程中执行一个Task。
  runOnExecutorQueue(
      m_mainExecutorToken,
      [unbundleWrap=folly::makeMoveWrapper(std::move(unbundle)),
       startupScript=folly::makeMoveWrapper(std::move(startupScript)),
       startupScriptSourceURL=std::move(startupScriptSourceURL)]
        (JSExecutor* executor) mutable {

    auto unbundle = unbundleWrap.move();
    if (unbundle) {
      executor->setJSModulesUnbundle(std::move(unbundle));
    }

    //executor从runOnExecutorQueue()返回的map中取得，与OnLoad中的JSCJavaScriptExecutorHolder对应，也与
    //Java中的JSCJavaScriptExecutor对应。它的实例在JSExecutor.cpp中实现。
    executor->loadApplicationScript(std::move(*startupScript),
                                    std::move(startupScriptSourceURL));
  });
}
```

这里顺带解释一下前面提到的 `unbundle`。

`unbundle` 命令的使用方式和 `bundle` 完全相同，它在 `bundle` 的基础上多做了一件事。除了生成整合后的 `index.android.bundle`，还会把各个模块单独输出成未整合的 `JS` 文件（依然会被优化过），全部放在 `js-modules` 目录下，同时生成一个名为 `UNBUNDLE` 的标识文件一并放进去。这个标识文件的前 4 个字节固定是 `0xFB0BD1E5`，加载前用来做校验，前面 `isUnbundle` 判断的就是它。

拆开的好处是可以按需加载模块，启动时不必把整个 `bundle` 全解析一遍，对大型应用的冷启动有帮助。代价是模块之间的调用要多走一层查找。

回到主线。这个函数进一步调用 `JSExecutor.cpp` 的 `loadApplicationScript()` 方法，到了这一步，就是去真正加载并执行 `JS` 文件了。

### 9.4 JSCExecutor.cpp

```cpp
void JSCExecutor::loadApplicationScript(std::unique_ptr<const JSBigString> script, std::string sourceURL) {

    ...
    //使用Webkit JSC去解释执行JS
    evaluateSourceCode(m_context, bcSourceCode, jsSourceURL);
    flush();
}
```

`evaluateSourceCode` 这一行就是整条链路的终点，你写的所有 `JS` 代码在这一刻被 `JavaScriptCore` 求值执行。第二节那句 `AppRegistry.registerComponent('demo', () => Index)` 也是在这时候跑的，组件被登记进 `JS` 侧的注册表。

执行完立刻 `flush`。

```cpp
void JSCExecutor::flush() {
    ...
    //绑定bridge，核心就是通过getGlobalObject()将JS与C++通过Webkit jSC实现绑定
      bindBridge();
      //返回给callNativeModules
    callNativeModules(m_flushedQueueJS->callAsFunction({}));
    ...
}
```

```cpp
void JSCExecutor::callNativeModules(Value&& value) {
    ...
    //把JS层相关通信数据转换为JSON格式
    auto calls = value.toJSONString();
    //m_delegate为JsToNativeBridge对象。
    m_delegate->callNativeModules(*this, folly::parseJson(calls), true);
    ...
}
```

`m_flushedQueueJS` 指向的是 `MessageQueue.js` 的 `flushedQueue()` 方法。调它一下，就把 `JS` 侧在执行 `bundle` 期间攒下来的所有待发调用一次性取出来。

注意 `toJSONString()` 那一行，跨界的数据在这里被序列化成 `JSON` 字符串。原理篇里说的「`JS` 和原生之间只传字符串不传指针」，落到代码上就是这一行。

到这里 `JS` 已经被加载进队列，等着 `Java` 层来驱动它。

## 十、回到 Java 侧完成首帧

`JS Bundle` 加载并解析完成之后，流程折回 `Java`。在之前的 `runCreateReactContextOnNewThread` 方法里，`createReactContext` 之后还有一句核心代码。

```java
setupReactContext(reactApplicationContext);
```

这就是加载完 `JS Bundle` 之后执行的收尾工作。

```java
public class ReactInstanceManager {
    private void setupReactContext(ReactApplicationContext reactContext) {
        ...
        // Native Java module初始化
    catalystInstance.initialize();
    //重置ReactContext 
    mDevSupportManager.onNewReactContextCreated(reactContext);
   //内存状态回调设置 mMemoryPressureRouter.addMemoryPressureListener(catalystInstance);
    // 复位生命周期
    moveReactContextToCurrentLifecycleState();

    ReactMarker.logMarker(ATTACH_MEASURED_ROOT_VIEWS_START);
    synchronized (mAttachedRootViews) {
    //mAttachedRootViews保存的是ReactRootView
      for (ReactRootView rootView : mAttachedRootViews) {
        attachRootViewToInstance(rootView, catalystInstance);
      }
    }
    ...
    }
}
```

`setupReactContext` 里的顺序是这样，先初始化 `Native Java Module`，重置 `ReactContext`，注册内存压力回调，复位生命周期状态，最后遍历 `mAttachedRootViews` 把每个 `RootView` 挂到实例上。

`mAttachedRootViews` 里存的就是第五节 `attachToReactInstanceManager` 时登记进去的那些 `ReactRootView`。一个 `Activity` 里有几个 `RN` 根视图，这里就会循环几次。

```java
private void attachMeasuredRootViewToInstance (     final ReactRootView rootView,
      CatalystInstance catalystInstance) {
      ...
            //将ReactRootView作为根布局
    UIManagerModule uiManagerModule = catalystInstance.getNativeModule(UIManagerModule.class);
    int rootTag = uiManagerModule.addMeasuredRootView(rootView);
    //设置相关
    rootView.setRootViewTag(rootTag);
    rootView.runApplication();
    ...
      }
```

`addMeasuredRootView` 会给这个根视图分配一个 `rootTag`，这个 `tag` 就是原理篇里说的那个「跨界对象编号」。之后 `JS` 侧发过来的所有绘制指令都会带上它，`UIManagerModule` 靠它找到该往哪棵视图树上挂节点。

分配完 `tag` 就调 `rootView.runApplication()`。

```java
 /* package */ void runApplication() {
        ...
      CatalystInstance catalystInstance = reactContext.getCatalystInstance();

      WritableNativeMap appParams = new WritableNativeMap();
      appParams.putDouble("rootTag", getRootViewTag());
      @Nullable Bundle appProperties = getAppProperties();
      if (appProperties != null) {
        appParams.putMap("initialProps", Arguments.fromBundle(appProperties));
      }

      String jsAppModuleName = getJSModuleName();
      //启动流程入口：由Java层调用启动
      catalystInstance.getJSModule(AppRegistry.class).runApplication(jsAppModuleName, appParams);
      ...
  }
```

最终调用的是 `catalystInstance.getJSModule(AppRegistry.class).runApplication(jsAppModuleName, appParams)`。

`AppRegistry.class` 是 `JS` 层暴露给 `Java` 层的接口声明，`getJSModule` 拿到的其实是一个 `Java` 动态代理对象，调它的方法会被转换成 `{moduleID, methodID, args}` 发到 `JS` 侧去。这就是原理篇里「`Java` 调 `JS`」那条路径的实际用法。

`appParams` 里带了两样东西，`rootTag` 告诉 `JS` 该往哪棵树上渲染，`initialProps` 是第五节说的原生传给 `JS` 的初始数据。

## 十一、AppRegistry.js 收尾

`AppRegistry.js` 在 `Libraries/ReactNative` 目录下，它是运行所有 `RN` 应用的 `JS` 层入口。

```js
runApplication(appKey: string, appParameters: any): void {
    const msg =
      'Running application "' + appKey + '" with appParams: ' +
      JSON.stringify(appParameters) + '. ' +
      '__DEV__ === ' + String(__DEV__) +
      ', development-level warning are ' + (__DEV__ ? 'ON' : 'OFF') +
      ', performance optimizations are ' + (__DEV__ ? 'OFF' : 'ON');
    infoLog(msg);
    BugReporting.addSource('AppRegistry.runApplication' + runCount++, () => msg);
    invariant(
      runnables[appKey] && runnables[appKey].run,
      'Application ' + appKey + ' has not been registered.\n\n' +
      'Hint: This error often happens when you\'re running the packager ' +
      '(local dev server) from a wrong folder. For example you have ' +
      'multiple apps and the packager is still running for the app you ' +
      'were working on before.\nIf this is the case, simply kill the old ' +
      'packager instance (e.g. close the packager terminal window) ' +
      'and start the packager in the correct app folder (e.g. cd into app ' +
      'folder and run \'npm start\').\n\n' +
      'This error can also happen due to a require() error during ' +
      'initialization or failure to call AppRegistry.registerComponent.\n\n'
    );

    SceneTracker.setActiveScene({name: appKey});
    runnables[appKey].run(appParameters);
  }
```

这个函数里最值钱的是那个 `invariant`。它检查 `runnables[appKey]` 存不存在，也就是第二节 `registerComponent` 注册的名字和这里传进来的 `appKey` 对不对得上。对不上就抛出那段很长的错误信息，`Application xxx has not been registered`。

那段提示还列了几种常见原因，包括在错误的目录下启动了打包服务、初始化时 `require` 报错、忘了调 `registerComponent`。我自己遇到最多的是第一种，同时开着两个 `RN` 项目，`Metro` 还连在上一个项目上，装的是这个项目的包，两边的 `appKey` 自然对不上。杀掉旧的 `Metro` 进程重新起就好。

检查通过之后 `runnables[appKey].run(appParameters)`，`JS` 侧正式开始渲染。渲染出来的节点通过 `UIManagerModule` 转换成 `Android` 组件，挂到 `rootTag` 对应的那棵树上，最终显示在 `ReactRootView` 里。

把整条链路收一下。应用启动并创建上下文对象，启动 `JS` 运行时，加载并执行 `bundle`，计算布局，把 `JS` 端算出的节点通过 `C++` 层和 `UIManagerModule` 转化成 `Android` 组件，渲染完成后添加到 `ReactRootView` 上，呈现给用户。

## 十二、两张全景图

前面是逐行走的，这里用两张图把整体再对一遍。

先看系统框架图，能看清 `Java`、`C++`、`JS` 三层之间的关系。

![React Native 系统框架图，展示 Java 层、C++ 层与 JS 层之间的调用关系](https://s.poetries.top/gitee/2019/10/678.png)

再看启动流程图，把这篇讲的每一步串成一条线。

![React Native 启动流程图，从 MainActivity 到 AppRegistry.runApplication 的完整调用链](https://s.poetries.top/gitee/2019/10/679.png)

对着图回想一遍第一节那张地图，如果每一格都能说出它在干什么，这条链路就算是走通了。

## 十三、这条链路在新架构下变了什么

必须补一句时效性，这篇拆的是老架构的源码，也就是基于 `Bridge` 的那一套。现在 `React Native` 已经切到新架构，上面很多类名和路径对不上了。

几个主要变化。`JavaScriptCore` 不再是默认引擎，换成了 `Hermes`，`bundle` 在构建期就被预编译成字节码，所以 `evaluateSourceCode` 那一步的解析开销大幅下降，冷启动更快。`CatalystInstance` 加 `MessageQueue` 这套桥接被 `JSI` 取代，`JS` 可以直接持有原生对象的引用同步调用，不用再把一切序列化成 `JSON`。原生模块变成了 `TurboModules`，按需加载，启动时不再一次性注入那张大模块表。渲染侧换成了 `Fabric`，`ShadowTree` 用 `C++` 实现，`UIManagerModule` 那条路径也重写了。

所以第九节里 `toJSONString()` 那一行代表的序列化开销，正是新架构要干掉的东西。

不过这篇的价值不只在类名。整条链路的骨架是没变的，依然是「原生侧准备环境和模块表 → 把 `bundle` 交给引擎执行 → `JS` 注册组件 → 原生侧回头触发渲染」这个顺序。理解了老架构里每一步为什么存在，看新架构的实现会快很多。而且现在还有大量项目跑在老架构上，看崩溃栈的时候这些类名照样用得着。

具体到某个版本上新架构的类名和目录结构，以官方文档和对应版本的源码为准，这块变化很快，我不敢凭印象写。

## 总结

一次 `React Native` 冷启动，实际是三层语言接力跑完的。

`Java` 侧从 `MainApplication` 的 `SoLoader.init` 开始，`MainActivity` 把活委托给 `ReactActivityDelegate`，`loadApp` 创建 `ReactRootView` 并调 `startReactApplication`，然后 `ReactInstanceManager` 在后台线程里创建 `ReactContext`。这一步里最关键的动作是建两张模块注册表，把 `Java` 和 `JS` 双方能互相调用的方法登记好。

接着 `CatalystInstanceImpl` 的 `initializeBridge` 通过 `JNI` 下到 `C++`，把线程、模块表、执行器一并交过去。`JSBundleLoader` 按 `Debug` 还是 `Release` 决定从 `Metro` 拉还是从 `assets` 读，一路经 `Instance.cpp`、`NativeToJsBridge.cpp` 到 `JSCExecutor.cpp`，`evaluateSourceCode` 真正执行你的 `JS` 代码。

`JS` 执行完，`registerComponent` 把根组件登记进注册表，但什么都还没渲染。流程折回 `Java` 侧的 `setupReactContext`，给根视图分配 `rootTag`，最后通过动态代理调到 `AppRegistry.js` 的 `runApplication`，第一帧才真正开始画。

理解这条链路最实际的收益，是排查启动问题时知道往哪一段看。白屏卡在 `bundle` 加载多半是 `Metro` 或者 `assets` 那一段，`Application has not been registered` 是两端 `appKey` 对不上，找不到 `so` 库是 `SoLoader` 那一步。

想把这套东西和整体架构对起来看，建议再读一遍[React Native 原理浅析](https://feinterview.poetries.top/blog/rn-yuanli)，那篇讲的是「这套架构为什么这么设计」，和这篇的「代码具体怎么跑」正好互补。

## 参考

- [React Native 新架构官方文档](https://reactnative.dev/architecture/overview)
- [React Native Android 源码仓库](https://github.com/facebook/react-native/tree/main/packages/react-native/ReactAndroid)
- [Hermes 引擎官方文档](https://hermesengine.dev/)
- [Android JNI 官方文档](https://developer.android.com/training/articles/perf-jni)
- [React Native 原理浅析](https://feinterview.poetries.top/blog/rn-yuanli)
- [React Native 真机调试完整流程](https://feinterview.poetries.top/blog/rn-device-debug)
- [前端进阶之旅](https://interview.poetries.top)
