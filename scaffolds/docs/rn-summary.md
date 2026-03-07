---
title: React Native学习之适配Android/IOS总结篇
date: 2019-06-08 14:50:12
tags: 
 - RN
 - react
categories: Front-End
---


## 一、环境搭建

### 1.1 React Native环境搭建

#### 1.1.1 IOS环境搭建

> 环境：`MacOS`

```bash
# 如果你已经安装了 Node，请检查其版本是否在 v8.3 以上
brew install node 

# Watchman则是由 Facebook 提供的监视文件系统变更的工具。安装此工具可以提高开发时的性能
brew install watchman
```

- **注意**：不要使用 `cnpm`！`cnpm` 安装的模块路径比较奇怪，`packager` 不能正常识别！

```
npm install -g yarn react-native-cli
```

**1. 创建新项目**

> `init` 命令默认会创建最新的版本，而目前最新的`0.45` 及以上版本需要下载 `boost` 等几个第三方库编译。这些库在国内即便翻墙也很难下载成功，导致很多人无法运行`iOS`项目。可以暂时创建`0.44.3`的版本

```
react-native init MyApp --version 0.44.3
```

**2. 编译并运行 React Native 应用**

1). **运行方式一** 在你的项目目录中运行`react-native run-ios`

```
cd MyApp
react-native run-ios
```

2). **运行方式二** 在`xCode`中运行

> 打开`xcode`选择项目中`myApp/ios/myApp.xcodeproj`，然后点击左上角运行即可


> 更多详情 https://reactnative.cn/docs/getting-started.html

**3. 远程调试**

- `ctrl + R`刷新
- `ctrl + D` 选择对应的工具调试

![](https://poetries1.gitee.io/img-repo/2019/10/513.png)

**Enable Live Reload**

> 当你的js代码发生变化后，`React Native`会自动生成bundle然后传输到模拟器或手机上

![](https://poetries1.gitee.io/img-repo/2019/10/514.gif)



> 在浏览器中打开 http://localhost:8081/debugger-ui

![](https://poetries1.gitee.io/img-repo/2019/10/515.png)

**巧用Sources面板**


![](https://raw.githubusercontent.com/crazycodeboy/RNStudyNotes/master/React%20Native%E8%B0%83%E8%AF%95%E6%8A%80%E5%B7%A7%E4%B8%8E%E5%BF%83%E5%BE%97/images/Sourcesmianban.jpg)


**指定模拟的设备类型**

- 你可以使用`--simulator`参数，在其后加上要使用的设备名称来指定要模拟的设备类型（目前默认为`"iPhone X"`）。如果你要模拟 `iPhone 4s`，那么这样运行命令即可：`react-native run-ios --simulator "iPhone 4s"`。
- 你可以在终端中运行`xcrun simctl list devices`来查看具体可用的设备名称

![](https://poetries1.gitee.io/img-repo/2019/10/516.png)

#### 1.1.2 安卓环境搭建

**安装依赖**

> 必须安装的依赖有：`Node`、`Watchman` 和 `React Native` 命令行工具以及 JDK 和 `Android Studio`

```
brew install node
brew install watchman
```

```
npm install -g yarn react-native-cli
```

**Java Development Kit**

> `React Native` 需要 `Java Development Kit [JDK] 1.8`（暂不支持 `1.9` 及更高版本）。你可以在命令行中输入

- `javac -version`来查看你当前安装的 `JDK `版本。如果版本不合要求，则可以到 [官网](https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)上下载


**1. 安装 Android Studio**

> 首先下载和安装 [`Android Studio`](https://developer.android.com/studio/index.html)，国内用户可能无法打开官方链接，请自行使用搜索引擎搜索可用的下载链接。安装界面中选择"Custom"选项，确保选中了以下几项

- `Android SDK`
- `Android SDK Platform`
- `Performance (Intel ® HAXM)`
- `Android Virtual Device`

> 然后点击"`Next`"来安装选中的组件。安装完成后，看到欢迎界面时，就可以进行下面的操作了

**2. 安装 Android SDK**

> `Android Studio` 默认会安装最新版本的 `Android SDK`。目前编译 `React Native` 应用需要的是`Android 8.1 (Oreo)`版本的 `SDK`。你可以在 `Android Studio` 的 `SDK Manager` 中选择安装各版本的 `SDK`

你可以在 `Android Studio` 的欢迎界面中找到 `SDK Manager`。点击"`Configure`"，然后就能看到"`SDK Manager`"。

![](https://poetries1.gitee.io/img-repo/2019/10/517.png)

> 在 `SDK Manager `中选择"`SDK Platforms`"选项卡，然后在右下角勾选"`Show Package Details`"。展开`Android 8.1 (Oreo)`选项，确保勾选了下面这些组件（重申你必须使用稳定的翻墙工具，否则可能都看不到这个界面）：

- `Android SDK Platform 27`
- `Intel x86 Atom_64 System Image`（官方模拟器镜像文件，使用非官方模拟器不需要安装此组件）

![](https://poetries1.gitee.io/img-repo/2019/10/518.png)


> `SDK Manager` 还可以在` Android Studio` 的"Preferences"菜单中找到。具体路径是`Appearance & Behavior → System Settings → Android SDK`


- 然后点击"`SDK Tools`"选项卡，同样勾中右下角的"`Show Package Details`"。展开"`Android SDK Build-Tools`"选项，确保选中了 `React Native` 所必须的`27.0.3`版本。你可以同时安装多个其他版本

![](https://poetries1.gitee.io/img-repo/2019/10/519.png)

> 最后点击"`Apply`"来下载和安装这些组件。

**3. 配置 ANDROID_HOME 环境变量**

> `React Native` 需要通过环境变量来了解你的 `Android SDK` 装在什么路径，从而正常进行编译

- 具体的做法是把下面的命令加入到`~/.bash_profile`文件中

```bash
# 如果你不是通过Android Studio安装的sdk，则其路径可能不同，请自行确定清楚。
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
```

> 如果你的命令行不是 `bash`，而是例如 `zsh` 等其他，请使用对应的配置文件

> 使用`source $HOME/.bash_profile`命令来使环境变量设置立即生效（否则重启后才生效）。可以使用`echo $ANDROID_HOME`检查此变量是否已正确设置

**4. 编译并运行 React Native 应用**

> 确保你先运行了模拟器或者连接了真机，然后在你的项目目录中运行`react-native run-android`

**Android Studio自带工具运行**

![](https://poetries1.gitee.io/img-repo/2019/10/520.png)

**使用genymotion模拟器**

> 去官网需要注册并下载https://www.genymotion.com/，需要注册登录再下载的。注意下载`with virtualBox`版本，然后安装完成后需要登录，就是刚才注册的账号。登录后进入这个页面做两个操作

![](https://poetries1.gitee.io/img-repo/2019/10/521.png)

> 点击`settings`，选择`adb`设置`sdk`就是刚才一直用的`sdk`安装路径,如下

![](https://poetries1.gitee.io/img-repo/2019/10/522.png)

> 启动项目，点击`genymotion`里的`start`启动我们刚才安装好的的虚拟设备，是这个样子的，此时我们刚才初始化的项目还没连上虚拟设备

![](https://poetries1.gitee.io/img-repo/2019/10/523.png)

> 然后在我们的工程项目里执行`adb devices`会列出当前启动的虚拟设备，能检测到说明没问题，如下图里最后一行显示的就是刚才我们开启的`genymotion`那台虚拟设备

![](https://poetries1.gitee.io/img-repo/2019/10/524.png)


最后项目目录里执行

```
react-native run-android
```

> 打开`genymotion`，欢迎页面出来了，成功，修改一下文字，重新加载一遍，成功

- 第一次默认不是热加载形式，就是改变文件内容需要手动刷新的，这里设置一下热加载，以后内容这里就会自动刷新，`mac`是执行`command+r`，选择第四个`hot reloading`

![](https://poetries1.gitee.io/img-repo/2019/10/525.png)

> 运行`react-native run-andriod` 会下载很多东西，然后出现这个标志说明编译没有问题，还缺少一个模拟设备

![](https://poetries1.gitee.io/img-repo/2019/10/526.png)
![](https://poetries1.gitee.io/img-repo/2019/10/527.png)
![](https://poetries1.gitee.io/img-repo/2019/10/528.png)

**如果是安卓5.0以下需要配置一下IP**

![](https://poetries1.gitee.io/img-repo/2019/10/529.png)

### 1.2 安卓设备真机调试

**1. 开启 USB 调试**

> 在默认情况下 `Android` 设备只能从应用市场来安装应用。你需要开启 `USB` 调试才能自由安装开发版本的 `APP`

**2. 通过 USB 数据线连接设备**

> 下面检查你的设备是否能正确连接到 `ADB（Android Debug Bridge）`，使用`adb devices`命令：

![](https://poetries1.gitee.io/img-repo/2019/10/530.png)

**3. 运行应用**

> 现在你可以运行`react-native run-android`来在设备上安装并启动应用了

**从设备上访问开发服务器**

- 运行`adb reverse tcp:8081 tcp:8081`
- 在命令行执行 `adb shell input keyevent 82`弹出开发者工具。打开热更新和远程调试

![](https://poetries1.gitee.io/img-repo/2019/10/531.png)

### 1.3 移除vscode装饰器报错

> 点击`Visual Studio Code`左下角的配置按钮。在搜索框内输入“experimentalDecorators”，发现竟然能够找到选项，如下

```
"javascript.implicitProjectConfig.experimentalDecorators": false
```

试着将`false`改为`true`，重启`Visual Studio Code`

> https://blog.csdn.net/yiifaa/article/details/78862507


## 二、矢量图标的运用

https://github.com/oblador/react-native-vector-icons

> `react-native-vector-icons` 是可以直接使用图片名就能加载图片的第三方,类似于`web的 iconfont`矢量图，使用很方便, 你不需要在工程文件夹里塞各种图片, 节省很多空间,下面就来看看怎么使用吧


```
npm install react-native-vector-icons --save
npm install rnpm -g
```

### 2.1 android平台

**1. 自动配置**

```bash
react-native link react-native-vector-icons
# 或者
npm install -g rnpm
rnpm link react-native-vector-icons
```

> 会为你配置好所有，但是这是成功的情况下，你不需要操心任何事，但是往往不能如愿。如果你这步成功了，而且能够正常运行，下面这些你就可以跳过


**2. 手动配置**

- 第一步：复制字体文件（这一步千万不能忘记，不然就算运行成功你也看不到图标）

> 找到项目`node_modules/react-native-vector-icons/Fonts`，里面有很多已经内置的图标库字体文件，依照自己的需求，复制你需要的字体文件到 `android/app/src/main/assets/fonts`，（如果没有这个目录就自行创建）

![](https://poetries1.gitee.io/img-repo/2019/10/532.png)


- 第二步：配置 `android/settings.gradle`

在现有的代码基础上添加如下代码


```
include ':react-native-vector-icons'
project(':react-native-vector-icons').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-vector-icons/android')
```

- 第三步：配置`android/app/build.gradle`

```js
dependencies {
    compile project(':react-native-vector-icons') //添加
    compile fileTree(dir: "libs", include: ["*.jar"])
    compile "com.android.support:appcompat-v7:23.0.1"
    compile "com.facebook.react:react-native:+"  // From node_modules
    compile project(':react-native-navigation')
}
```

- 第四步：配置 `android/app/src/main/java/com/xxxx/MainApplication.java`

```js
import com.oblador.vectoricons.VectorIconsPackage;
@Override
  protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
      new MainReactPackage()
+   , new VectorIconsPackage()
    );
  }
```

> 到这里配置就全部完成，接下来就可以在`rn`项目中使用`iconfont`



![](https://poetries1.gitee.io/img-repo/2019/10/533.png)

### 2.2 IOS平台

> 打开你的`Xcode`项目工程，右键工程文件，选择`react`项目下的`node_modules/react-native-vector-icons/Fonts`文件

![](https://poetries1.gitee.io/img-repo/2019/10/534.png)

**在xcode的Info.plist文件中,加入: Fonts provided by application数组**

![](https://poetries1.gitee.io/img-repo/2019/10/535.png)

> 打开终端，输入：`rnpm link`，回车后会看到`Fonts provided by application`下加入如下字体

![](https://poetries1.gitee.io/img-repo/2019/10/536.png)

> 重新运行`react`项目，终端输入：`react-native run-ios`，可以看到效果了


## 三、react-native-router-flux的使用

> https://github.com/aksonov/react-native-router-flux

### 3.1 简介

**特性**


> `react-native-router-flux` 是一个路由包.在一个中心区域定义可切换`scene`模块。在使用过程中，跟`react-native`提供的`navigator`的区别是你不需要有`navigator`对象。你可以在任意地方使用简单的语法去控制`scene`的切换，如：` Actions.login({username, password})`  or `Actions.profile({profile})` or 甚至`Actions.profile(123)` ,其中`login` `profile`等是路由的`key`，通过调用`key`来切换路由

- 所有的参数将被注入到`this.props`中给`Sene`组件使用

**功能和亮点**

- 可定制的导航条：由`Scene`或者`Scene`的`state`去控制导航条的`show`／`hide`
- 嵌套导航：每一个`tab`都可以有自己的导航，该导航被嵌套在`root`导航中
- 使用`Action sheet` 来自定义场景渲染器
- 动态路由：动态路由将允许你通过应用的`state`去选着哪个`scene`将被渲染
- `Reset History stack`重置历史栈：新的`reset` 类型将提供清除历史栈河消除导航的返回按钮的功能
- 更加强大的状态控制：在多个`scene`中可以有不同的`state`

```
npm i react-native-router-flux --save
```

**使用方式一**

> 在你的`src/index.js`级别的文件中使用`Scene`组件定义你的`scenes`，并且`Scene`组件作为`Router`的子节点。定义好的`Scene`将由`Router`来控制其行为

```js
import {Scene, Router, Actions} from 'react-native-router-flux';

import {Router, Scene} from "react-native-router-flux";
import PageOne from "./Component/PageOne"; 
import PageTwo from "./Component/PageTwo";

const Root = () => {
  return (
    <Router>
      {/* 这种写法是将全部的跳转页面都放在Root下面 */}
      <Scene key="root">
        {/* key 就是给页面的标签,供Actions使用 */}
        {/* component 设置关联的页面 */}
        {/* title 就是给页面标题 */}
        {/* initial 就是设置默认页面*/}
        <Scene
          key="one"
          component={PageOne}
          title="PageOne"
          initial={true}
        />
        <Scene key="two" component={PageTwo} title="PageTwo" />

      </Scene>
    </Router>
  );
};
```


**第二种使用方式**

> 你可以在编译期定义你所有的`scenes`，并在后面的`Router`里面使用

```jsx
import {Actions, Scene, Router} from 'react-native-router-flux';

const scenes = Actions.create(
  <Scene key="root">
    <Scene key="login" component={Login} title="Login"/>
    <Scene key="register" component={Register} title="Register"/>
    <Scene key="home" component={Home}/>
  </Scene>
);

/* ... */

class App extends React.Component {
  render() {
    return <Router scenes={scenes}/>
  }
}
 {Actions, Scene, Router} from 'react-native-router-flux';

const scenes = Actions.create(
  <Scene key="root">
    <Scene key="login" component={Login} title="Login"/>
    <Scene key="register" component={Register} title="Register"/>
    <Scene key="home" component={Home}/>
  </Scene>
);

/* ... */

class App extends React.Component {
  render() {
    return <Router scenes={scenes}/>
  }
}
```

在任意地方通过导入

```js
import {Actions} from 'react-native-router-flux'
```

> 获得`Actions` 对象，`Actions`对象将是我们操作`Scenes`的遥控器。通过`Actions`我们可以向`Router`发出动作让`Router`控制`Scene`变化。

- 调用`Actions.ACTION_NAME(PARAMS)`可以展示一个`scene`，参数将被注入`scene`中
 (如`Actions.login()`切换到登录页面)
- `Actions.pop()`方法将会弹出当前的`scene`，他接受如下可选参数 
  - `{popNum:[number]}`允许你去一次弹出多个`scene`
  - `{refresh:{...propsToSetOnPreviousScene}}`允许你去刷新`pop`后的`scene`
- `Actions.refresh(PARAMS)`会更新当前`scene`的属性

### 3.2 简单例子

```js
import {Router, Scene} from "react-native-router-flux";
import PageOne from "./Component/PageOne"; 
import PageTwo from "./Component/PageTwo";

const Root = () => {
  return (
    <Router>
      {/* 这种写法是将全部的跳转页面都放在Root下面 */}
      <Scene key="root">
        {/* key 就是给页面的标签,供Actions使用 */}
        {/* component 设置关联的页面 */}
        {/* title 就是给页面标题 */}
        {/* initial 就是设置默认页面*/}
        <Scene
          key="one"
          component={PageOne}
          title="PageOne"
          initial={true}
        />
        <Scene key="two" component={PageTwo} title="PageTwo" />

      </Scene>
    </Router>
  );
};
```

```js
// PageOne 的核心代码，点击 Text 跳转到下一个页面

//导入Action的包,处理页面跳转
import { Actions } from 'react-native-router-flux'; 

const PageOne = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.welcome}
        onPress={()=>Actions.two()} >
        我是Page One
      </Text>
    </View>
  );
};
```

```js
// PageTwo 的核心代码

export default class PageTwo extends Component {
    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.welcome}>我是Page Two </Text>
            </View>)
    }
}
```

运行就可以看到下面的效果：

![](https://poetries1.gitee.io/img-repo/2019/10/537.png)

简单就完成了两个页面之间的切换


**每一个`Scene component` 有如下属性**

- `key`：一个唯一的字符串，用来标识一个`Scene`，可以理解为`scene`的一个身份牌号码
- `component`：当切换到该`scene`时，`component`属性引用的组件将被渲染出来
- `title`：当切换到对应的`scene`时，屏幕顶部的导航条中间将显示该`title`
- `initial={true}` 表示默认为初始化`scene`

> 在`pageOne`中有一个`Text`组件，当点击`onPress`方法，该方法将调用`Actions.pageTwo`

- 会调用`Actions.SCENE_KEY(PARAMS) `,`SCENE_KEY`即为之前定义的`key`值，参数为可选的
- 我们的`Actions`就会通知`Router`，把`key=pageTwo`的`Scene`显示出来，如果传有参数的话，参数也会传入`Scene`组件中

```js
render() {
  const goToPageTwo = () => Actions.pageTwo({text: 'Hello World!'}); 
  return (
    
      This is PageOne!
    
  )
}
```

> 我们传递一个参数名为`text` 。值为`Hello World`！如下所示，我们就可以在`key=pageTwo`的`scene`的`component`属性置顶的组件中通过`props`获取该参数值

```js
render() {
  return (
    
      This is PageTwo!
      {this.props.text}
    
  )
}
```

> 我们从`pageOne`跳转到了`pageTwo`，如果我们想跳回`pageOne`怎么办呢

- 官方提供的导航栏早已提供了一个`back icon`，我们也可以通过调用`Actions.pop()`方法将当前`scene`弹出栈，我们的`pageOne`就在栈顶了，此时显示的就是`pageOne`了，如果跳回来后我们需要刷新当前`scene`，我们可以调用`Actions.refresh(PARAMS)`

**数据传递与刷新**

> 页面之间的切换自然不会缺少数据的传递，而且这个路由框架可以实时 `refresh` 当前页面

- 先看页面之间传递数据吧，这里添加一个 `PageThree `

```js
import {Actions} from "react-native-router-flux"

const PageThree = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.welcome}
                //Actions.pop是退回到上一层
                  onPress={() => Actions.pop({
                      //refresh用于刷新数据
                      refresh: {
                          data: '从 three 回到 two'
                      }
                  })}>我是Page Three </Text>
        </View>
    );
};
```

`PageTwo` 也要修改一下代码

```js
import {Actions} from 'react-native-router-flux'; // New code

export default class PageTwo extends Component {

    render() {
        const data = this.props.data || "null";
        return (
            <View style={styles.container}>
                <Text style={styles.welcome}
                     //添加点击事件并传递数据到PageThree
                      onPress={() => Actions.three({data: "从 two 传递到 three"})}
                >我是Page Two </Text>
               <Text style={styles.refresh}
                //展示从PageThree传回来的数据
                > refresh:{data}</Text>
            </View>)
    }
}
```

> 最后到 `Root.js` 添加新的 `Scence`

```js
const Root = () => {
    return (
        <Router>
               //...........
                <Scene key="three"
                       component={PageThree}
                       title="PageThree"/>
            </Scene>
        </Router>
    );
};
```

此时运行就可以看到页面数据传递的效果了


![](https://poetries1.gitee.io/img-repo/2019/10/538.png)

> 可以看到从 `PageThree` 回到 `PageTwo` 数据传递并刷新页面的效果，不过如果需要实时刷新当前页面呢？这时就需要使用 `Actions.refresh` 方法了

```js
export default class PageTwo extends Component {

    render() {
        const data = this.props.data || "null";
        return (
            <View style={styles.container}>
                <Text style={styles.welcome}
                      onPress={() => Actions.three({data: "从 two 传递到 three"})}
                >我是Page Two </Text>
                <Text style={styles.refresh}
                      onPress={() => Actions.refresh({
                          data: 'Changed data',
                      })}
                > refresh:{data}</Text>
            </View>)
    }
}
```

**Tab Scene**

> 通过设置 `Scene` 属性的 `Tabs` 可以设置 `Tabs` 。这个也开发中经常用到的页面效果

```js
//设置tab选中时的字体颜色和标题
const TabIcon = ({focused , title}) => {
    return (
        <Text style={{color: focused  ? 'blue' : 'black'}}>{title}</Text>
    );
};

const Root = () => {
    return (<Router>
        {/*tabBarPosition设置tab是在top还是bottom */}
        <Scene hideNavBar tabBarPosition="bottom">
            <Tabs
                key="tabbar"
                swipeEnabled
                wrap={false}
                // 是否显示标签栏文字
                showLabel={false}
                tabBarStyle={{backgroundColor: "#eee"}}
                //tab选中的颜色
                activeBackgroundColor="white"
                //tab没选中的颜色
                inactiveBackgroundColor="red"
            >
                <Scene
                    key="one"
                    icon={TabIcon}
                    component={PageOne}
                    title="PageOne"
                />

                <Scene
                    key="two"
                    component={PageTwo}
                    title="PageTwo"
                    icon={TabIcon}
                />

                <Scene
                    key="three"
                    component={PageThree}
                    title="PageThree"
                    icon={TabIcon}
                />
            </Tabs>
        </Scene>
    </Router>)
};
```

![](https://poetries1.gitee.io/img-repo/2019/10/539.png)

### 3.3 react-native-router-flux之API

> 英文版：https://github.com/aksonov/react-native-router-flux/blob/master/docs/API.md

#### 3.3.1 Router

|Property| Type|	Default|	Description|
|---|---|---|---|
|`children`||`required`|页面根组件|
|`wrapBy`	|`Function`||允许集成诸如`Redux`（`connect`）和`Mobx`（`observer`）之类的状态管理方案|
|`sceneStyle`|	`Style`	||	适用于所有场景的`Style`（可选）|
|`backAndroidHandler`|	`Function`||	允许在`Android`中自定义控制返回按钮（可选）|

**backAndroidHandler用法**

```js
const onBackPress = () => {
    if (Actions.state.index !== 0) {
      return false
    }
    Actions.pop()
    return true
}

backAndroidHandler={onBackPress}
```

#### 3.3.2 Scene

> 此路由器的最重要的组件， 所有 `<Scene>` 组件必须要有一个唯一的 `key`。父节点`<Scene>`不能将`component`作为`prop`，因为它将作为其子节点的组件

|Property| Type|	Default|	Description|
|---|---|---|---|
|`key`|`string`|`required`|将用于标识页面，例如`Actions.name(params)`。必须是独一无二的|
|`path`|	`string`|	|将被用来匹配传入的深层链接和传递参数，例如：`/user/:id/`将从`/user/1234/`用`params {id：1234}`调用场景的操作。接受`uri`的模板标准|
|`component`|`React.Component`|`semi-required`|要显示的组件，定义嵌套时不需要`Scene`。|
|`back`|`boolean`|`false`|如果是`true`，则显示后退按钮，而不是由上层容器定义的左侧`/drawer`按钮|
|`backButtonImage`|	`string`||设置返回按钮的图片|
|`backButtonTintColor`|	`string`||自定义后退按钮色调|
|`init`|`boolean`|`false`|如果是`true`后退按钮不会显示|
|`clone`|	`boolean`|	`false`|标有`clone`的场景将被视为模板，并在被推送时克隆到当前场景的父节点中|
|`contentComponent`|`React.Component`|	|用于呈现抽屉内容的组件（例如导航）|
|`drawer`|	`boolean`|	`false`|	载入`DrawerNavigator`内的子页面|
|`failure`|	`Function` || 如果`on`返回一个`“falsey”`值，那么`failure`将被调用|
|`backTitle`	|`string`	||	指定场景的后退按钮标题|
|`backButtonTextStyle`|	`Style`||		用于返回按钮文本的样式|
|`rightTitle`|	`string`||		为场景指定右侧的按钮标题|
|`headerMode` |`string`| `float`|指定标题应该如何呈现：（`float`渲染单个标题，保持在顶部，动画随着屏幕的变化，这是`iOS`上的常见样式。）`screen`（每个屏幕都有一个标题，并且标题淡入，与屏幕一起出现，这是`Android`上的常见模式）如果为`none`（不会显示标题）|
|`hideNavBar`|	`boolean`	|`false`|	隐藏导航栏|
|`hideTabBar`|	`boolean`|	`false`|隐藏标签栏（仅适用于拥有`tabs`指定的场景）|
|`hideBackImage`| `boolean`	| `false` |隐藏返回图片|
|`initial`|`boolean`|	`false`	|设置为`true`后，会默认显示该页面|
|`leftButtonImage`|	`Image`	||	替换左侧按钮图片|
|`leftButtonTextStyle`|	`Style`||		左侧按钮的文字样式|
|`leftButtonStyle`	|`Style`		||左侧按钮的样式|
|`leftButtonIconStyle`|	`Style`		||左侧按钮的图标样式|
|`modal`|	`boolean`|	`false`|将场景容器定义为`modal`，即所有子场景都将从底部弹起到顶部。它仅适用于`containers`（与`v3`版本的语法不同）|
|`navBar`|	`React.Component`||		可以使用自定义的`React`组件来定义导航栏|
|`navBarButtonColor`|	`string`	|	|设置导航栏返回按钮的颜色|
|`navigationBarStyle`|	`Style`	||	导航栏的样式|
|`navigationBarTitleImage`	|`Object`||导航栏中的图像中覆盖`title`的`Image`|
|`navigationBarTitleImageStyle`|	`object`	||	`navigationBarTitleImage`的样式|
|`navTransparent`|	`boolean`|	`false`|	导航栏是否透明|
|`on`	|`Function`	||	又名 `onEnter`|
|`onEnter`|	`Function`	||	当Scene要被跳转时调用。props将被作为参数提供。只支持定义了`component`的场景。|
|`onExit`	|`Function`||当`Scene`要跳转离开时调用。只支持定义了`component`的场景|
|`onLeft`|	`Function`	|	|当导航栏左侧按钮被点击时调用|
|`onRight`|	`Function`	||	当导航栏右侧按钮被点击时调用|
|`renderTitle`	|`React.Component`||		使用`React`组件显示导航栏的`title`|
|`renderLeftButton`	|`React.Component	`	||使用`React`组件显示导航栏的左侧按钮|
|`renderRightButton`|	`React.Component`||使用`React`组件显示导航栏的右侧按钮|
|`renderBackButton`	|`React.Component`		||使用`React`组件显示导航栏的返回按钮|
|`rightButtonTextStyle`	|`Style`|	|	右侧按钮文字的样式|
|`success`|	`Function`	||	如`on`返回一个"真实"的值，那么`success`将被调用|
|`tabs`	|`boolean`|	`false`|将子场景加载为`TabNavigator`。其他标签导航器属性也是适用|
|`title`	|`string`	||	要显示在导航栏中心的文本|
|`titleStyle`|	`Style`||		`title`的样式|
|`type`|	`string`|	`push`|可选的导航操作。你可以使用`replace`来替换此场景中的当前场景|

#### 3.3.3 Tabs (<Tabs> or <Scene tabs>)

标签栏组件

> 你可以使用`<Scene>`中的所有`props`来作为`<Tabs>`的属性。 如果要使用该组件需要设置 ` <Scene tabs={true}>`

|Property| Type|	Default|	Description|
|---|---|---|---|
|`wrap`|	`boolean`	|`true`|	自动使用自己的导航栏包装每个场景（如果不是另一个容器）。|
|`activeBackgroundColor`	|`string`	||	指定焦点的选项卡的选中背景颜色|
|`activeTintColor`	|`string`		||指定标签栏图标的选中色调颜色|
|`inactiveBackgroundColor`|	`string`	||	指定非焦点的选项卡的未选中背景颜色|
|`inactiveTintColor`|	`string`	||	指定标签栏图标的未选中色调颜色|
|`labelStyle`|`object`|		|设置`tabbar`上文字的样式|
|`lazy`|	`boolean`|	`false`|在选项卡处于活动状态之前，不会渲染选项卡场景(推荐设置成`true`)|
|`tabBarComponent`|	`React.Component`	||	使用`React`组件以自定义标签栏|
|`tabBarPosition`|	`string`||		指定标签栏位置。`iOS`上默认为`bottom`，安卓上是`top`|
|`tabBarStyle`|	`object`	||	标签栏样式|
|`tabStyle`	|`object`		||单个选项卡的样式|
|`showLabel`|	`boolean`|	`true`	|是否显示标签栏文字|
|`swipeEnabled`|	`boolean`|	true`	|是否可以滑动选项卡|
|`animationEnabled`|	`boolean`|	`true`|	切换动画|
|`tabBarOnPress`|	`function`	||	自定义`tabbar`点击事件|
|`backToInitial`|	`boolean`|	`false`	|如果选项卡图标被点击，返回到默认选项卡|

#### 3.3.4 Stack (<Stack>)

> 将场景组合在一起的组件，用于自己的基于堆栈实现的导航。使用它将为此堆栈创建一个单独的`navigator`，因此，除非您添加`hideNavBar`，否则将会出现两个导航条

#### 3.3.5 Tab Scene (child <Scene> within Tabs)

> 用于实现`Tabs`的效果展示，可以自定义`icon`和`label`

|Property| Type|	Default|	Description|
|---|---|---|---|
|`icon`|	`component`|	`undefined`|	作为选项卡图标放置的`RN`组件|
|`tabBarLabel`|	`string`||		`tabbar`上的文字|

#### 3.3.6 Drawer (<Drawer> or <Scene drawer>)

> 用于实现抽屉的效果，如果要使用该组件需要设置 `<drawer tabs={true}>`。

|Property| Type|	Default|	Description|
|---|---|---|---|
|`drawerImage`|	`Image`		||替换抽屉`hamburger`图标，你必须把它与`drawer`一起设置|
|`drawerIcon`|	`React.Component`|	|用于抽屉`hamburger`图标的任意组件，您必须将其与`drawer`道具一起设置|
|`hideDrawerButton`|`boolean`|	`false`	|是否显示`drawerImage`或者`drawerIcon`|
|`drawerPosition`|	`string`	||	抽屉是在右边还是左边。可选属性r`ight`或`left`|
|`drawerWidth`	|`number`		||抽屉的宽度（以像素为单位）（可选）|


#### 3.3.7 Modals (<Modal> or <Scene modal>)

> 想要实现模态，您必须将其`<Modal>`作为您`Router`的根场景。在`Modal`将正常呈现第一个场景（应该是你真正的根场景），它将渲染第一个元素作为正常场景，其他所有元素作为弹出窗口（当它们 被`push`）

示例：在下面的示例中，`root`场景嵌套在`<Modal>`中，因为它是第一个嵌套`Scene`，所以它将正常呈现。如果要`push`到`statusModal`，`errorModal`或者`loginModal`，他们将呈现为`Modal`，默认情况下会从屏幕底部向上弹出。重要的是要注意，目前`Modal`不允许透明的背景。


```jsx
//... import components
<Router>
  <Modal>
    <Scene key="root">
      <Scene key="screen1" initial={true} component={Screen1} />
      <Scene key="screen2" component={Screen2} />
    </Scene>
    <Scene key="statusModal" component={StatusModal} />
    <Scene key="errorModal" component={ErrorModal} />
    <Scene key="loginModal" component={LoginModal} />
  </Modal>
</Router>
```

#### 3.3.8 Lightbox (<Lightbox>)

> `Lightbox`是用于将组件渲染在当前组件上`Scene`的组件 。与`Modal`不同，它将允许调整大小和背景的透明度

在下面的示例中，`root`场景嵌套在中`<Lightbox>`，因为它是第一个嵌套`Scene`，所以它将正常呈现。如果要`push`到`loginLightbox`，他们将呈现为`Lightbox`，默认情况下将放置在当前场景的顶部，允许透明的背景

```jsx
//... import components
<Router>
  <Lightbox>
    <Scene key="root">
      <Scene key="screen1" initial={true} component={Screen1} />
      <Scene key="screen2" component={Screen2} />
    </Scene>

    {/* Lightbox components will lay over the screen, allowing transparency*/}
    <Scene key="loginLightbox" component={loginLightbox} />
  </Lightbox>
</Router>
```

#### 3.3.9 Actions

- 该对象的主要工具是为您的应用程序提供导航功能。 假设您的`Router`和`Scenes`配置正确，请使用下列属性在场景之间导航。 有些提供添加的功能，将`React`道具传递到导航场景
- 这些可以直接使用，例如，`Actions.pop()`将在源代码中实现的操作，或者，您可以在场景类型中设置这些常量，当您执行`Actions.main()`时，它将根据您的场景类型或默认值来执行动作

|Property| Type|	Default|	Description|
|---|---|---|---|
|`[key]`|	`Function`	|`Object`|	`Actions`将'自动'使用路由器中的场景`key`进行导航。如果需要跳转页面，可以直接使用`Actions.key()`或`Actions[key].call()`|
|`currentScene`|	`String`	||	返回当前活动的场景|
|`jump`|	`Function`	|`(sceneKey: String, props: Object)`	|用于切换到新选项卡. For Tabs only.|
|`popTo`|	`Function`|	`(sceneKey: String, props: Object)`|	返回到指定的页面|
|`push`|	`Function`|	`(sceneKey: String, props: Object)`	|跳转到新页面|
|`refresh`|	`Function`|	`(props: Object)`|重新加载当前页面|
|`replace`|	`Function`|	`(sceneKey: String, props: Object)`|	从堆栈中弹出当前场景，并将新场景推送到导航堆栈。没有过度动画|
|`reset`|	`Function`|	`(sceneKey: String, props: Object)`|	清除路由堆栈并将场景推入第一个索引. 没有过渡动画|
|`drawerOpen`	| `Function` | |如果可用，打开`Drawer` |
|`drawerClose`|`Function`||如果可用，关闭`Drawer`|

#### 3.3.10 ActionConst

> 键入常量以确定`Scene`转换，这些是优先于手动键入其值，因为项目更新时可能会发生更改

|Property| Type|	Default|	Description|
|---|---|---|---|
|`ActionConst.JUMP`	|`string`|	`'REACT_NATIVE_ROUTER_FLUX_JUMP'`|	`jump`|
|`ActionConst.PUSH`|	`string`|	`'REACT_NATIVE_ROUTER_FLUX_PUSH'`|	`push|
|`ActionConst.PUSH_OR_POP`|	`string`|	`'REACT_NATIVE_ROUTER_FLUX_PUSH_OR_POP'`|	`push`|
|`ActionConst.REPLACE`|	`string`|	`'REACT_NATIVE_ROUTER_FLUX_REPLACE'`|	`replace`|
|`ActionConst.BACK`	|`string`|	`'REACT_NATIVE_ROUTER_FLUX_BACK'`|	`pop`|
|`ActionConst.BACK_ACTION`|	`string`|	`'REACT_NATIVE_ROUTER_FLUX_BACK_ACTION'`|	`pop`|
|`ActionConst.POP_TO`|	`string`|	`'REACT_NATIVE_ROUTER_FLUX_POP_TO'`|	`popTo`|
|`ActionConst.REFRESH`|	`string`|	`'REACT_NATIVE_ROUTER_FLUX_REFRESH'`|	`refresh`|
|`ActionConst.RESET`|	`string`|	`'REACT_NATIVE_ROUTER_FLUX_RESET'`|	`reset`|
|`ActionConst.FOCUS`	|`string`|	`'REACT_NATIVE_ROUTER_FLUX_FOCUS'`|	`N/A`|
|`ActionConst.BLUR`	|`string`|	`'REACT_NATIVE_ROUTER_FLUX_BLUR'`|	`N/A`|
|`ActionConst.ANDROID_BACK`|	`string`	|`'REACT_NATIVE_ROUTER_FLUX_ANDROID_BACK'`	|`N/A`|

#### 3.3.11 Universal and Deep Linking

- 考虑这样一个`web`应用程序和`app`配对,这可能有一个`urlhttps://thesocialnetwork.com/profile/1234/`
- 如果我们同时构建一个`web`应用程序和一个移动应用程序，我们希望能够通过`path /profile/:id/`
- 在web上，我们可能想要用一个路由器来打开我们的`<Profile />`和参数`{ id: 1234 }`
- 在移动设备上，如果我们正确地设置了`Android / iOS`环境来启动我们的应用程序并打开`RNRF<Router />`,，那么我们还需要导航到我们的移动`<Profile />`场景和参数`{ id: 1234 }`

```html
<Router uriPrefix={'thesocialnetwork.com'}>
  <Scene key="root">
     <Scene key={'home'} component={Home} />
     <Scene key={'profile'} path={"/profile/:id/"} component={Profile} />
     <Scene key={'profileForm'} path={"/edit/profile/:id/"} component={ProfileForm} />
  </Scene>
</Router>
```

> 如果用户点击`http://thesocialnetwork.com/profile/1234/`在他们的设备,他们会打开`<Router/ >`,然后调用操作`Actions.profile({ id:1234 })`


## 四、React Native基础知识

### 4.1 常见组件

- `Image` 图片
- `Text` 文本
- `View` 包裹最外层

### 4.2 样式


> 实际开发中组件的样式会越来越复杂，我们建议使用`StyleSheet.create`来集中定义组件的样式

```javascript
import React, { Component } from 'react';
import { AppRegistry, StyleSheet, Text, View } from 'react-native';

export default class LotsOfStyles extends Component {
  render() {
    return (
      <View>
        <Text style={styles.red}>just red</Text>
        <Text style={styles.bigblue}>just bigblue</Text>
        <Text style={[styles.bigblue, styles.red]}>bigblue, then red</Text>
        <Text style={[styles.red, styles.bigblue]}>red, then bigblue</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  bigblue: {
    color: 'blue',
    fontWeight: 'bold',
    fontSize: 30,
  },
  red: {
    color: 'red',
  },
});

AppRegistry.registerComponent('LotsOfStyles', () => LotsOfStyles);
```


> 常见的做法是按顺序声明和使用`style`属性，以借鉴`CSS`中的“层叠”做法（即后声明的属性会覆盖先声明的同名属性）


### 4.3 高度与宽度


> 最简单的给组件设定尺寸的方式就是在样式中指定固定的`widt`h和`height`。`React Native`中的尺寸都是无单位的，表示的是与设备像素密度无关的逻辑像素点


```javascript
import React, { Component } from 'react';
import { AppRegistry, View } from 'react-native';

class FixedDimensionsBasics extends Component {
  render() {
    return (
      <View>
        <View style={{width: 50, height: 50, backgroundColor: 'powderblue'}} />
        <View style={{width: 100, height: 100, backgroundColor: 'skyblue'}} />
        <View style={{width: 150, height: 150, backgroundColor: 'steelblue'}} />
      </View>
    );
  }
};
// 注册应用(registerComponent)后才能正确渲染
// 注意：只把应用作为一个整体注册一次，而不是每个组件/模块都注册
AppRegistry.registerComponent('AwesomeProject', () => FixedDimensionsBasics);
```

- 在组件样式中使用`flex`可以使其在可利用的空间中动态地扩张或收缩。一般而言我们会使用`flex:1`来指定某个组件扩张以撑满所有剩余的空间。如果有多个并列的子组件使用了`flex:1`，则这些子组件会平分父容器中剩余的空间。如果这些并列的子组件的`flex`值不一样，则谁的值更大，谁占据剩余空间的比例就更大（即占据剩余空间的比等于并列组件间`flex`值的比）
- 组件能够撑满剩余空间的前提是其父容器的尺寸不为零。如果父容器既没有固定的`width`和`height`，也没有设定`flex`，则父容器的尺寸为零。其子组件如果使用了`flex`，也是无法显示的。


```javascript
import React, { Component } from 'react';
import { AppRegistry, View } from 'react-native';

class FlexDimensionsBasics extends Component {
  render() {
    return (
      // 试试去掉父View中的`flex: 1`。
      // 则父View不再具有尺寸，因此子组件也无法再撑开。
      // 然后再用`height: 300`来代替父View的`flex: 1`试试看？
      <View style={{flex: 1}}>
        <View style={{flex: 1, backgroundColor: 'powderblue'}} />
        <View style={{flex: 2, backgroundColor: 'skyblue'}} />
        <View style={{flex: 3, backgroundColor: 'steelblue'}} />
      </View>
    );
  }
};

AppRegistry.registerComponent('AwesomeProject', () => FlexDimensionsBasics);
```


### 4.4 处理文本输入


> `TextInput`是一个允许用户输入文本的基础组件。它有一个名为`onChangeText`的属性，此属性接受一个函数，而此函数会在文本变化时被调用。另外还有一个名为`onSubmitEditing`的属性，会在文本被提交后（用户按下软键盘上的提交键）调用


```javascript
import React, { Component } from 'react';
import { AppRegistry, Text, TextInput, View } from 'react-native';

export default class PizzaTranslator extends Component {
  constructor(props) {
    super(props);
    this.state = {text: ''};
  }

  render() {
    return (
      <View style={{padding: 10}}>
        <TextInput
          style={{height: 40}}
          placeholder="Type here to translate!"
          onChangeText={(text) => this.setState({text})}
        />
        <Text style={{padding: 10, fontSize: 42}}>
          {this.state.text.split(' ').map((word) => word && '🍕').join(' ')}
        </Text>
      </View>
    );
  }
}
```


### 4.5 如何使用滚动视图


> `ScrollView`是一个通用的可滚动的容器，你可以在其中放入多个组件和视图，而且这些组件并不需要是同类型的。`ScrollView`不仅可以垂直滚动，还能水平滚动（通过`horizontal`属性来设置）

- `ScrollView`适合用来显示数量不多的滚动元素。放置在`ScollView`中的所有组件都会被渲染，哪怕有些组件因为内容太长被挤出了屏幕外。如果你需要显示较长的滚动列表，那么应该使用功能差不多但性能更好的`ListView`组件


```javascript
import React, { Component } from 'react';
import{ ScrollView, Image, Text, View } from 'react-native'

export default class IScrolledDownAndWhatHappenedNextShockedMe extends Component {
  render() {
      return(
        <ScrollView>
          <Text style={{fontSize:96}}>Scroll me plz</Text>
          <Image source={require('./img/favicon.png')} />
          <Image source={require('./img/favicon.png')} />
          <Image source={require('./img/favicon.png')} />
        </ScrollView>
    );
  }
}
```

### 4.6 如何使用长列表


- `FlatList`组件用于显示一个垂直的滚动列表，其中的元素之间结构近似而仅数据不同
- `FlatList`更适于长列表数据，且元素个数可以增删。和`ScrollView`不同的是，`FlatList`并不立即渲染所有元素，而是优先渲染屏幕上可见的元素
- `FlatList`组件必须的两个属性是`data`和`renderItem`。`data`是列表的数据源，而`renderItem`则从数据源中逐个解析数据，然后返回一个设定好格式的组件来渲染


```javascript
import React, { Component } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

export default class FlatListBasics extends Component {
  render() {
    return (
      <View style={styles.container}>
        <FlatList
          data={[
            {key: 'Devin'},
            {key: 'Jackson'},
            {key: 'James'},
            {key: 'Joel'},
            {key: 'John'},
            {key: 'Jillian'},
            {key: 'Jimmy'},
            {key: 'Julie'},
          ]}
          renderItem={({item}) => <Text style={styles.item}>{item.key}</Text>}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
   flex: 1,
   paddingTop: 22
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
})
```


### 4.7 网络

> 默认情况下，`iOS`会阻止所有非`https`的请求。如果你请求的接口是`http`协议，那么首先需要添加一个`App Transport Security`的例外


## 五、React Native布局

### 5.1 宽和高

- 一个组件的高度和宽度决定了它在屏幕上的尺寸，也就是大小
- 在`React Native`中尺寸是没有单位的，它代表了设备独立像素

```html
<View style={ {width:100,height:100,margin:40,backgroundColor:'gray'}}>
 <Text style={ {fontSize:16,margin:20}}>尺寸</Text>
</View>
```

### 5.2 和web中的差异


> `React Native`中的`FlexBox` 和`Web CSSS`上`FlexBox`的不同之处


- `flexDirection`:  `React Native`中默认为`flexDirection:'column'`，在`Web CSS`中默认为`flex-direction:'row'`
- `alignItems`:  `React Native`中默认为`alignItems:'stretch'`，在`Web CSS`中默认`align-items:'flex-start'`
- `flex`: 相比`Web CSS`的`flex`接受多参数，如:`flex: 2 2 10%`;，但在 `React Native`中`flex`只接受一个参数
- 不支持属性：`align-content`，`flex-basis`，`order`，`flex-basis`，`flex-flow`，`flex-grow`，`flex-shrink`

### 5.3 Layout 

> 以下属性是`React Native`所支持的`Flex`属性

#### 5.3.1 容器属性

- `flexDirection`: `row` `column` `row-reverse` `column-reverse`
- `flexWrap`: `wrap` `nowrap` 
- `justifyContent`: `flex-start` `flex-end` `center` `space-between` `space-around`
- `alignItems`: `flex-start` `flex-end` `center` `stretch`

#### 5.3.2 横轴和竖轴

> 主轴即水平方向的轴线，可以理解成横轴，侧轴垂直于主轴，可以理解为竖轴

![](https://mdn.mozillademos.org/files/12998/flexbox.png)

#### 5.3.3 flexDirection

> - `flexDirection`: `row` `column` `row-reverse` `column-reverse`
> - `flexDirection`属性定义了父视图中的子元素沿横轴或侧轴方片的排列方式

- `row`: 从左向右依次排列
- `row-reverse`: 从右向左依次排列
- `column(default)`: 默认的排列方式，从上向下排列
- `column-reverse`: 从下向上排列

```html
<View style={ {flexDirection:'row-reverse',backgroundColor:"darkgray",marginTop:20}}>
  <View style={ {width:40,height:40,backgroundColor:"darkcyan",margin:5}}>
    <Text style={ {fontSize:16}}>1</Text>
  </View>
  <View style={ {width:40,height:40,backgroundColor:"darkcyan",margin:5}}>
    <Text style={ {fontSize:16}}>2</Text>
  </View>
  <View style={ {width:40,height:40,backgroundColor:"darkcyan",margin:5}}>
    <Text style={ {fontSize:16}}>3</Text>
  </View>
  <View style={ {width:40,height:40,backgroundColor:"darkcyan",margin:5}}>
    <Text style={ {fontSize:16}}>4</Text>
  </View>
</View>
```

![](https://raw.githubusercontent.com/crazycodeboy/RNStudyNotes/develop/React%20Native%E5%B8%83%E5%B1%80/React%20Native%E5%B8%83%E5%B1%80%E8%AF%A6%E7%BB%86%E6%8C%87%E5%8D%97/images/flexDirection.jpg)


#### 5.3.4 flexWrap

> `flexWrap`属性定义了子元素在父视图内是否允许多行排列，默认为`nowrap`

- `nowrap flex`的元素只排列在一行上，可能导致溢出
- `wrap flex`的元素在一行排列不下时，就进行多行排列

```html
<View  style={ {flexWrap:'wrap',flexDirection:'row',backgroundColor:"darkgray",marginTop:20}}>

</View>
```

![](https://raw.githubusercontent.com/crazycodeboy/RNStudyNotes/develop/React%20Native%E5%B8%83%E5%B1%80/React%20Native%E5%B8%83%E5%B1%80%E8%AF%A6%E7%BB%86%E6%8C%87%E5%8D%97/images/flexWrap.jpg)

#### 5.3.5 justifyContent

> - `justifyContent`属性定义了浏览器如何分配顺着父容器主轴的弹性（`flex`）元素之间及其周围的空间，默认为`flex-start`
> - `justifyContent`: `flex-start` `flex-end` `center` `space-between` `space-around`


- `flex-start(default)`从行首开始排列。每行第一个弹性元素与行首对齐，同时所有后续的弹性元素与前一个对齐
- `flex-end` 从行尾开始排列。每行最后一个弹性元素与行尾对齐，其他元素将与后一个对齐。
- `center` 伸缩元素向每行中点排列。每行第一个元素到行首的距离将与每行最后一个元素到行尾的距离相同。
- `space-between` 在每行上均匀分配弹性元素。相邻元素间距离相同。每行第一个元素与行首对齐，每行最后一个元素与行尾对齐。
- `space-around` 在每行上均匀分配弹性元素。相邻元素间距离相同。每行第一个元素到行首的距离和每行最后一个元素到行尾的距离将会是相邻元素之间距离的一半。


```html
<View  style={ {justifyContent:'center',flexDirection:'row',backgroundColor:"darkgray",marginTop:20}}>

</View>
```


![](https://raw.githubusercontent.com/crazycodeboy/RNStudyNotes/develop/React%20Native%E5%B8%83%E5%B1%80/React%20Native%E5%B8%83%E5%B1%80%E8%AF%A6%E7%BB%86%E6%8C%87%E5%8D%97/images/justifyContent.jpg)

#### 5.3.6 alignItems

> `alignItems` 属性以与`justify-content`相同的方式在侧轴方向上将当前行上的弹性元素对齐，默认为`stretch`。

- `flex-start` 元素向侧轴起点对齐。
- `flex-end` 元素向侧轴终点对齐。
- `center` 元素在侧轴居中。如果元素在侧轴上的高度高于其容器，那么在两个方向上溢出距离相同。
- `stretch` 弹性元素被在侧轴方向被拉伸到与容器相同的高度或宽度

```html
<View  style={ {justifyContent:'center',flexDirection:'row',backgroundColor:"darkgray",marginTop:20}}>

</View>
```

![](https://raw.githubusercontent.com/crazycodeboy/RNStudyNotes/develop/React%20Native%E5%B8%83%E5%B1%80/React%20Native%E5%B8%83%E5%B1%80%E8%AF%A6%E7%BB%86%E6%8C%87%E5%8D%97/images/alignItems.jpg)


#### 5.3.7 alignSelf

> `alignSelf`属性以属性定义了`flex`容器内被选中项目的对齐方式。注意：`alignSelf` 属性可重写灵活容器的 `alignItems` 属性

- `stretch` 元素被拉伸以适应容器。
- `center` 元素位于容器的中心。
- `flex-start` 元素位于容器的开头。
- `flex-end` 元素位于容器的结尾

```html
<View style={ {alignSelf:'baseline',width:60,height:    20,backgroundColor:"darkcyan",margin:5}}>
   <Text style={ {fontSize:16}}>1</Text>
</View>
```

![](https://raw.githubusercontent.com/crazycodeboy/RNStudyNotes/develop/React%20Native%E5%B8%83%E5%B1%80/React%20Native%E5%B8%83%E5%B1%80%E8%AF%A6%E7%BB%86%E6%8C%87%E5%8D%97/images/alignSelf.jpg)

#### 5.3.8 flex

> `flex` 属性定义了一个可伸缩元素的能力，默认为`0`

```html
<View style={ {flexDirection:'row',height:40, backgroundColor:"darkgray",marginTop:20}}>
  <View style={ {flex:1,backgroundColor:"darkcyan",margin:5}}>
    <Text style={ {fontSize:16}}>flex:1</Text>
  </View>
  <View style={ {flex:2,backgroundColor:"darkcyan",margin:5}}>
    <Text style={ {fontSize:16}}>flex:2</Text>
  </View>
  <View style={ {flex:3,backgroundColor:"darkcyan",margin:5}}>
    <Text style={ {fontSize:16}}>flex:3</Text>
  </View>          
</View>
```


![](https://raw.githubusercontent.com/crazycodeboy/RNStudyNotes/develop/React%20Native%E5%B8%83%E5%B1%80/React%20Native%E5%B8%83%E5%B1%80%E8%AF%A6%E7%BB%86%E6%8C%87%E5%8D%97/images/flex.jpg)


### 5.4 视图边框

- `borderBottomWidth number`  底部边框宽度
- `borderLeftWidth number` 左边框宽度
- `borderRightWidth number`  右边框宽度
- `borderTopWidth number` 顶部边框宽度
- `borderWidth number` 边框宽度
- `border<Bottom|Left|Right|Top>Color` 个方向边框的颜色
- `borderColor` 边框颜色

### 5.5 尺寸

- `width number`
- `height number`

### 5.6 外边距

- `margin number` 外边距
- `marginBottom number` 下外边距
- `marginHorizontal number`  左右外边距
- `marginLeft number` 左外边距
- `marginRight number` 右外边距
- `marginTop number` 上外边距
- `marginVertical number` 上下外边距

### 5.7 内边距


- `padding number` 内边距
- `paddingBottom number` 下内边距
- `paddingHorizontal number` 左右内边距
- `paddingLeft number` 做内边距
- `paddingRight number`  右内边距
- `paddingTop number`  上内边距
- `paddingVertical number`  上下内边距

### 5.8 边缘


- `left number` 属性规定元素的左边缘。该属性定义了定位元素左外边距边界与其包含块左边界之间的偏移。
- `right number` 属性规定元素的右边缘。该属性定义了定位元素右外边距边界与其包含块右边界之间的偏移
- `top number`  属性规定元素的顶部边缘。该属性定义了一个定位元素的上外边距边界与其包含块上边界之间的偏移。
- `bottom number` 属性规定元素的底部边缘。该属性定义了一个定位元素的下外边距边界与其包含块下边界之间的偏移。


### 5.9 定位(position)


> `position:absolute|relative`属性设置元素的定位方式，为将要定位的元素定义定位规则。

- `absolute`：生成绝对定位的元素，元素的位置通过 "`left`", "`top`", "`right`" 以及 "`bottom`" 属性进行规定。
- `relative`：生成相对定位的元素，相对于其正常位置进行定位。因此，"`left:20`" 会向元素的 `LEFT` 位置添加 `20` 像素。


## 六、React Native适配

### 6.1 Platform.OS

> 为了提高代码的兼容性，我们有时需要判断当前系统的平台，然后做一些适配。比如，我们在使用`StatusBar`做导航栏的时候，在`iOS`平台下根视图的位置默认情况下是占据状态栏的位置的，我们通常希望状态栏下面能显示一个导航栏，所以我们需要为`StatusBar`的外部容器设置一个高度


```html
<View style={{height: Platform.OS === 'ios' ? 20:0}}>
    <StatusBar {...this.props.statusBar} />
</View>;
```

### 6.2 留意api doc的android或ios标识

> 并不是所有`React Native`的一些`api`或组件的一些属性和方法都兼容`Android`和`iOS`，在`React Native`的`api doc`中通常会在一些属性或方法的前面加上`android`或`ios`的字样来标识该属性或方法所支持的平台，如

```
android renderToHardwareTextureAndroid bool
ios shouldRasterizeIOS bool
```

> 在上述代码中，`renderToHardwareTextureAndroid bool`只支持`Android`平台，`ios shouldRasterizeIOS bool`只支持`iOS`平台，所有我们在使用这些带有标记的属性或方法的时候就需要考虑对于它们不兼容的平台我们是否需要做相应的适配了

### 6.3 组件选择

> 比如，我们要开发一款应用需要用到导航组件，`在React Native`组件中有`NavigatorIOS`与`Navigator`两个导航组件来供我们选择，从`api doc`中我们可以看出`NavigatorIOS`只支持`iOS`平台，`Navigator`则两个平台都支持。
所以如果我们要开发的应用需要适配`Android`和`iOS`，那么`Navigator`才是最佳的选择。

为了提高代码的复用性与兼容性建议大家在选择`React Native`组件的时候要多留意该组件是不是兼容`Android`和`iOS`，尽量选择`Android`和`iOS`平台都兼容的组件。

### 6.4 图片适配


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


## 七、react-navigation

> 文档 https://reactnavigation.org/docs/zh-Hans/getting-started.html


### 7.1 页面切换

- 跳转到新的页面(将新路由推送到堆栈导航器，如果它尚未在堆栈中，则跳转到该页面) `this.props.navigation.navigate('Details',{})`
- 不考虑现有导航历史的情况下添加其他路由 `this.props.navigation.push`
- 返回 `this.props.navigation.goBack()`
- 返回到堆栈中的第一个页面 `navigation.popToTop()`

### 7.2 传递参数给路由

- `navigate`接受可选的第二个参数，以便将参数传递给要导航到的路由。 例如：`this.props.navigation.navigate('RouteName', {paramName: 'value'})`。
- 我们可以使用`this.props.navigation.getParam`读取参数
- 你也可以使用 `this.props.navigation.state.params`作为`getParam`的替代方案， 如果未指定参数，它的值是 `null`


```js
/* 1. Navigate to the Details route with params */
this.props.navigation.navigate('Details', {
  itemId: 86,
  otherParam: 'anything you want here',
});

/* 2. Get the param, provide a fallback value if not available */
const { navigation } = this.props;
const itemId = navigation.getParam('itemId', 'NO-ID');
const otherParam = navigation.getParam('otherParam', 'some default value');
```

### 7.3 配置标题栏

> 每个页面组件可以有一个名为`navigationOptions`的静态属性，它是一个对象或一个返回包含各种配置选项的对象的函数。我们用于设置标题栏的标题的是`title`这个属性，如以下示例所示

```js
class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'Home',
  };

  /* render function, etc */
}

class DetailsScreen extends React.Component {
  static navigationOptions = {
    title: 'Details',
  };

  /* render function, etc */
}
```

> `createStackNavigator`默认情况下按照平台惯例设置，所以在`iOS`上标题居中，在`Android`上左对齐

#### 7.3.1 动态设置标题

```js
class DetailsScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.getParam('otherParam', 'A Nested Details Screen'),
    };
  };

  /* render function, etc */
}
```

#### 7.3.2 使用setParams更新navigationOptions

> 通常有必要从已加载的页面组件本身更新当前页面的`navigationOptions`配置。 我们可以使用`this.props.navigation.setParams`来做到这一点

```html
 /* Inside of render() */
  <Button
    title="Update the title"
    onPress={() => this.props.navigation.setParams({otherParam: 'Updated!'})}
  />
```

#### 7.3.3 调整标题样式

> 定制标题样式时有三个关键属性：headerStyle、headerTintColor和headerTitleStyle

- `headerStyle`：一个应用于 `header` 的最外层 `View` 的 样式对象， 如果你设置 `backgroundColor` ，他就是`header` 的颜色
- `headerTintColor`：返回按钮和标题都使用这个属性作为它们的颜色。 在下面的例子中，我们将 `tint color` 设置为白色（#fff），所以返回按钮和标题栏标题将变为白色
- `headerTitleStyle`：如果我们想为标题定制`fontFamily`，`fontWeight`和其他`Text`样式属性，我们可以用它来完成。

```js
class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'Home',
    headerStyle: {
      backgroundColor: '#f4511e',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  };

  /* render function, etc */
}
```

#### 7.3.4 统一配置所有页面头部defaultNavigationOptions

> 在初始化时，还可以在 `stack navigator` 的配置中指定共享的`navigationOptions` 静态属性优先于该配置

```js
const Home = createStackNavigator(
  {
    Feed: ExampleScreen,
    Profile: ExampleScreen,
  }, {
    defaultNavigationOptions: {
      headerTintColor: '#fff',
      headerStyle: {
        backgroundColor: '#000',
      },
    },
    navigationOptions: {
      tabBarLabel: 'Home!',
    },
  }
);
```

#### 7.3.5 覆盖共享的navigationOptions

```js
class DetailsScreen extends React.Component {
  static navigationOptions = ({ navigation, navigationOptions }) => {
    const { params } = navigation.state;

    return {
      title: params ? params.otherParam : 'A Nested Details Screen',
      /* These values are used instead of the shared configuration! */
      headerStyle: {
        backgroundColor: navigationOptions.headerTintColor,
      },
      headerTintColor: navigationOptions.headerStyle.backgroundColor,
    };
  };

  /* render function, etc */
}
```

### 7.4 标题栏和其所属的页面之间的交互

```js
class HomeScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    return {
      headerTitle: <LogoTitle />,
      headerRight: (
        <Button
          onPress={navigation.getParam('increaseCount')} //执行事件
          title="+1"
          color="#fff"
        />
      ),
    };
  };

  componentDidMount() {
    // 设置事件
    this.props.navigation.setParams({ increaseCount: this._increaseCount });
  }

  state = {
    count: 0,
  };

  _increaseCount = () => {
    this.setState({ count: this.state.count + 1 });
  };

  /* later in the render function we display the count */
}
```


## 八、打包

### 8.1 修改app名称、logo、启动图

**修改图标和名称**

> 找到根目录`/android/app/src/main/res`

![](https://poetries1.gitee.io/img-repo/2019/10/540.png)

**启动页**

> - 在`react-native`的`android`中的启动图和`IOS`不相同点在于，`android`没有默认的启动图，在`IOS`里面有
> - 使用插件 `import SplashScreen from 'react-native-splash-screen';`
> - https://github.com/crazycodeboy/react-native-splash-screen

![](https://poetries1.gitee.io/img-repo/2019/10/541.png)

**react-native ios端icon和启动图的设置**

> https://www.jianshu.com/p/b49629529a95

### 8.2 Android打包APK

**1. 在Android/app目录下执行这条命令**

```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

![](https://poetries1.gitee.io/img-repo/2019/10/542.png)

```
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=123456
MYAPP_RELEASE_KEY_PASSWORD=123456
```

**2. 在app/build.gradle中配置**

```
signingConfigs {
      release {
          if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
              storeFile file(MYAPP_RELEASE_STORE_FILE)
              storePassword MYAPP_RELEASE_STORE_PASSWORD
              keyAlias MYAPP_RELEASE_KEY_ALIAS
              keyPassword MYAPP_RELEASE_KEY_PASSWORD
          }
      }
  }
  buildTypes {
      release {
          minifyEnabled enableProguardInReleaseBuilds
          proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
          signingConfig signingConfigs.release
      }
  }
 ```
 
 
 ![](https://poetries1.gitee.io/img-repo/2019/10/543.png)
 
 **3. 减少打包apk大小**
 
![](https://poetries1.gitee.io/img-repo/2019/10/544.png)
 

 **4. 输出目录**
 
 > `android/app/build/outputs/apk/`


### 8.3 IOS打包


## 九、更多参考

- [常用的react-native组件整理](https://github.com/poetries/react-native-components)
- [React Native 研究与实践](https://github.com/crazycodeboy/RNStudyNotes/)
- [从navigator到react-navigation进阶教程](http://www.devio.org/2018/05/15/navigator-to-react-navigation/)
- [React Native0.50+开发指导](http://www.devio.org/2017/12/12/React-Native0.50-Development-Guide-Chinese-update-instructions/)
- [React Native 集成分享第三方登录功能分享第三方登录模块开发(iOS)](http://www.devio.org/2017/09/30/React-Native-integration-share-third-party-login-function-ios/)
- [React Native 集成分享第三方登录功能分享第三方登录模块开发(Android)](http://www.devio.org/2017/09/10/React-Native-integration-share-third-party-login-function/)
- [教你轻松在React Native中集成统计的功能](http://www.devio.org/2017/09/03/React-Native-Integrated-analysis-function/)
- [教你轻松修改React Native端口](http://www.devio.org/2017/08/18/Modify-the-React-Native-listening-port/)
- [React Native Android iOS 教程快速创建React Native App](http://www.devio.org/2017/07/12/quickly-create-react-native-app/)
- [Mac(OSX)平台搭建React Native开发环境](http://www.devio.org/2016/05/20/React-Native-development-environment-build-mac-platform/)
