---
title: Taro跨平台开发实践
date: 2019-06-08 15:30:21
tags: Taro
categories: Front-End
---


## 一、小程序开发框架

![image.png](https://poetries1.gitee.io/img-repo/20190930/1.png)

**Vue-like、React-like 代码，如何在小程序中运行?**

![image.png](https://poetries1.gitee.io/img-repo/20190930/2.png)


### 1.1 基本原理

- 编译时处理（转译成小程序语法）
- 运行时适配（管理生命周期、数据，处理事件等）

**编译原理**

> 源代码->词法/语法/语义分析->抽象语法树->转换->目标代码


![image.png](https://poetries1.gitee.io/img-repo/20190930/3.png)


**抽象语法树 AST**


![image.png](https://poetries1.gitee.io/img-repo/20190930/4.png)


### 1.2 小程序框架多端支持情况

![image.png](https://poetries1.gitee.io/img-repo/20190930/5.png)


## 二、Taro原理

> Taro: 多端统一开发框架，支持用 React 的开发方式编写一次代
码，生成能运行在微信小程序、H5、React Native 等的应用

![image.png](https://poetries1.gitee.io/img-repo/20190930/6.png)
![image.png](https://poetries1.gitee.io/img-repo/20190930/7.png)
![image.png](https://poetries1.gitee.io/img-repo/20190930/8.png)
![image.png](https://poetries1.gitee.io/img-repo/20190930/9.png)


**多端能力：提供对应端的runtime、组件、redux、router等实现**

![image.png](https://poetries1.gitee.io/img-repo/20190930/10.png)
![image.png](https://poetries1.gitee.io/img-repo/20190930/11.png)
![image.png](https://poetries1.gitee.io/img-repo/20190930/12.png)
![image.png](https://poetries1.gitee.io/img-repo/20190930/13.png)

- 提供相应端的 `Runtime` 实现，具备适配 `API` 的能力
- 提供统一的基础组件，编译时替换为相应端的组件实现

## 三、Taro项目中遇到的坑

### 3.1 一些坑

**1、React-like，不完全等同 React**

![image.png](https://poetries1.gitee.io/img-repo/20190930/14.png)


**2、端能力差异不可避免：某些功能在相应端上没有支持**

![image.png](https://poetries1.gitee.io/img-repo/20190930/15.png)

**3、样式支持、写法上存在差异**

![image.png](https://poetries1.gitee.io/img-repo/20190930/16.png)
![image.png](https://poetries1.gitee.io/img-repo/20190930/17.png)
![image.png](https://poetries1.gitee.io/img-repo/20190930/18.png)

**4、还没有真正支持多端的 UI 组件库能在 Taro 上使用**

![image.png](https://poetries1.gitee.io/img-repo/20190930/19.png)


**5、React Native 的 view 不支持 click 事件，需要用 Touchable 组件**

![image.png](https://poetries1.gitee.io/img-repo/20190930/20.png)

**6、React Native 不支持 text-overflow，而是提供原生支持（Text 组件传入 numberOfLines={num} 属性）**

> `Taro` 目前没有暴露原生 `RN` T`ext` 组件的 `numberOfLines` 属性。因此目前通过 `Text` 基础组件没法实现多端统一的文本截断

**H5情况较为乐观**

- 主要差异1: 小程序的页面、组件样式都是独立的，H5会受同名样式影响
- 主要差异2: 小程序的组件多了一层标签

![image.png](https://poetries1.gitee.io/img-repo/20190930/21.png)

**7、多端要求较高**

- 对不同端的具体差异有所了解
- 样式实现较为苛刻，需兼顾多端、有所取舍
- 端能力差异可能需要自己填坑

**8、多端填坑方式**

![image.png](https://poetries1.gitee.io/img-repo/20190930/22.png)

**多端实践经验**

- 对多端差异做好封装
- 采用 BEM 命名方式管理样式
- 采用全局样式维护基础组件 `@taro/components` 的样式
- 基于 `@taro/components` 自行封装组件库


### 3.2 注意事项

- 函数需要`on+函数名`来规范命名
- 子组件中接收的`props`需要定义`defaultProps`。否则小程序端报错
- 在 `Taro` 中，`JS` 代码里必须书写单引号，特别是 JSX 中，如果出现双引号，可能会导致编译错误
- `css`样式单位写`PX`大写会转成`rem`单位
- 根据环境变量引入不同平台组件、编译到对应平台
- 小程序端不支持在`render()`之外定义jsx。比如在外面`renderForm()`
- 页面布局：拆分组件方法--由上到下，由左到右拆分
-  Taro 目前还没有支持 `React.Fragment` 语法
- 运行时 报缺少包，需要要在 `.rn_temp` 目录里面安装
- 文字要包在 `Text` 组件里面，否则不显示
- `position:fixed` `React Native` 不支持
- `Animation` 和 `transform` `React Native` 动画不支持
- 状态更新一定是异步的。React的状态更新不一定是异步




## 四、技巧

### 4.1 样式文件条件编译

> 假设目录中同时存在以下文件：

```
- index.scss
- index.rn.scss
```

> 当在 `JS `文件中引用样式文件：`import './index.scss'` 时，`RN` 平台会找到并引入 `index.rn.scss`，其他平台会引入：`index.scss`，方便大家书写跨端样式，更好地兼容 `RN`

### 4.2 内置环境变量

**process.env.TARO_ENV**

> 用于判断当前编译类型，目前有 `weapp / swan / alipay / h5 / rn / tt `六个取值，可以通过这个变量来书写对应一些不同环境下的代码，在编译时会将不属于当前编译类型的代码去掉，只保留当前编译类型下的代码，例如想在微信小程序和 H5 端分别引用不同资源

```js
if (process.env.TARO_ENV === 'weapp') {
  require('path/to/weapp/name')
} else if (process.env.TARO_ENV === 'h5') {
  require('path/to/h5/name')
}
```

> 同时也可以在 `JSX` 中使用，决定不同端要加载的组件

```js
render () {
  return (
    <View>
      {process.env.TARO_ENV === 'weapp' && <ScrollViewWeapp />}
      {process.env.TARO_ENV === 'h5' && <ScrollViewH5 />}
    </View>
  )
}
```

### 4.3 统一接口的多端文件

**多端组件**

- 假如有一个 Test 组件存在微信小程序、百度小程序和 H5 三个不同版本，那么就可以像如下组织代码
- `test.js` 文件，这是 `Test` 组件默认的形式，编译到微信小程序、百度小程序和 H5 三端之外的端使用的版本
- `test.h5.js` 文件，这是 `Test` 组件的 `H5` 版本
- `test.weapp.js` 文件，这是 `Test `组件的 微信小程序 版本
- `test.swan.js` 文件，这是 `Test` 组件的 百度小程序 版本
- 四个文件，对外暴露的是统一的接口，它们接受一致的参数，只是内部有针对各自平台的代码实现
- 而我们使用 `Test` 组件的时候，引用的方式依然和之前保持一致，`import` 的是不带端类型的文件名，在编译的时候会自动识别并添加端类型后缀

```
import Test from '../../components/test'

<Test argA={1} argA={2} />
```

**多端脚本逻辑**

> 例如微信小程序上使用 `Taro.setNavigationBarTitle` 来设置页面标题，H5 使用 `document.title`，那么可以封装一个 `setTitle` 方法来抹平两个平台的差异

增加 `set_title.h5.js`，代码如下

```js
export default function setTitle (title) {
  document.title = title
}
```

> 增加 `set_title.weapp.js`，代码如下

```js
import Taro from '@tarojs/taro'
export default function setTitle (title) {
  Taro.setNavigationBarTitle({
    title
  })
}
```

> 调用的时候，如下使用

```
import setTitle from '../utils/set_title'

setTitle('页面标题')
```

## 五、React Native端的实践

> https://nervjs.github.io/taro/docs/react-native.html

### 5.1 Taro运行RN步骤

**1. 运行 yarn dev:rn**

![image.png](https://upload-images.jianshu.io/upload_images/1480597-4032f18cd94f7871.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> 打开 http://127.0.0.1:8081/index.bundle?platform=ios&dev=true激活编译

![image.png](https://upload-images.jianshu.io/upload_images/1480597-58be0cdf0230802f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

**2. 下载react-native运行壳子**

> https://github.com/poetries/react-native-shell

**3. 打开gemotion安卓模拟器**

> - [参考文章](http://blog.poetries.top/2019/06/08/rn-summary/#1-1-2-%E5%AE%89%E5%8D%93%E7%8E%AF%E5%A2%83%E6%90%AD%E5%BB%BA) 
> - `adb devices` 查看是否有设备在运行


**4. 启动安卓**

> 在壳子中启动命令。`react-native-shell` 放在哪里都可以，建议放到项目根目录即可

```
react-native run-android
```

**5. 打包apk**

把`react-native-shell`中的`android`文件加拷贝到`.rn_temp`文件中，`cd android` 执行打包命令即可

> [参考文章](http://blog.poetries.top/2019/06/08/rn-summary/#%E5%85%AB%E3%80%81%E6%89%93%E5%8C%85)


### 5.2 样式

> Note：如果要支持 `React Native` 端，必须采用 Flex 布局，并且样式选择器仅支持类选择器，且不 支持 组合器

以下选择器的写法都是不支持的，在样式转换时会自动忽略

```bash
.button.button_theme_islands{
  font-style: bold;
}

img + p {
  font-style: bold;
}

p ~ span {
  color: red;
}

div > span {
  background-color: DodgerBlue;
}

div span { background-color: DodgerBlue; }
```

样式上 `H5` 最为灵活，小程序次之，`RN` 最弱，统一多端样式即是对齐短板，也就是要以 `RN` 的约束来管理样式，同时兼顾小程序的限制，核心可以用三点来概括

- 使用 `Flex` 布局
- 基于 `BEM` 写样式
- 采用 `style` 属性覆盖组件样式

> `RN` 中 `View` 标签默认主轴方向是 `column`，如果不将其他端改成与 RN 一致，就需要在所有用到 `display: flex` 的地方都显式声明主轴方向

### 5.3 问题

**尽量避免在 componentDidMount 中调用 this.setState**

> 因为在 `componentDidMount` 中调用 `this.setState` 会导致触发更新


```js
import Taro, { Component } from '@tarojs/taro'
import { View, Input } from '@tarojs/components'

class MyComponent extends Component {
  state = {
    myTime: 12
  }
  
  componentDidMount () {
    this.setState({     // ✗ 尽量避免，可以在 componentWillMount 中处理
      name: 1
    })
  }
  
  render () {
    const { isEnable } = this.props
    const { myTime } = this.state
    return (
      <View className='test'>
        {isEnable && <Text className='test_text'>{myTime}</Text>}
      </View>
    )
  }
}
```

**不要定义没有用到的 state**

```js
import Taro, { Component } from '@tarojs/taro'
import { View, Input } from '@tarojs/components'

class MyComponent extends Component {
  state = {
    myTime: 12,
    noUsed: true   // ✗ 没有用到
  }
  
  render () {
    const { myTime } = this.state
    return (
      <View className='test'>
        <Text className='test_text'>{myTime}</Text>
      </View>
    )
  }
}
```



