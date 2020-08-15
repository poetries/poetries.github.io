---
title: Typescript+React模板搭建（三）
date: 2018-12-31 23:50:14
tags: 
  - Typescript
  - React
categories: Front-End
---

> 整理于网络

# 一、项目初始化

## 1.1 创建项目

> 确保安装了 `npm install -g typescript`

```bash
# -S 是--save简写
# -D 是--save-dev简写

# 创建目录
mkdir ts-react && cd ts-react

# 生成package.json、tsconfig.json
npm init -y && tsc --init

# 安装开发工具
npm install-D webpack webpack-cli webpack-dev-server

# 安装react相关
npm install -S react react-dom

# 安装react相关的ts验证包
npm install -D @types/react @types/react-dom

# 安装ts-loader(或者awesome-typescript-loader) 这两款loader用于将ts代码编译成js代码
npm install -D babel-loader
```

## 1.2 webpack配置

1. 在项目根目录新建一个`build`文件夹

```
mkdir build && cd build && touch webpack.config.js
```

2. 根目录下新建src文件夹，然后在src里新建index.tsx文件作为项目入口

```
mkdir src && cd src && touch index.tsx
```

3. 编写简单的`webpack`配置，只包含`entry`和`output`


```js
const path = require('path')

module.export = {
    entry: {
        app: path.join(__dirname, '../', 'src/index.tsx)
    },
    output: {
        path.join(__dirname, '../', 'dist),
        filename: '[name].js
    }
}
```

4. 编写`awesome-typescript-loader`配置项:
在`webpack`中的`module`是专门用来决定如何处理各种模块的配置项，例如本例中的`typescript`，这里主要用的配置项就是`module.rules`，而当前只需要简单配置解析`.tsx`文件类型即可

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f6ab875f614)


5. 在`src/index.tsx`中写入口文件

```js
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import Test from '@components/Test'

const render = () => {
    ReactDOM.render(
        <div>1234</div>,
        document.querySelector('#app')
    )
}
render()
```

> 但是这时候你会发现有一个错误没有处理


![](https://poetries1.gitee.io/img-repo/2019/10/550.png)

> 这是因为在`tsconfig`里面没有指定`JSX`的版本，这时候在`tsconfig`的`compilerOptions`中添加`"jsx": "react"`配置项即可消除错误

- 此外还需要注意一点，以后需要`import xxx from 'xxx'`这样的文件的话需要在`webpack`中的`resolve`项中配置`extensions`，这样以后引入文件就不需要带扩展名

```js
module.exports = {
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx']
    }
}
```

6. 添加页面模板

> 在`public`文件夹下新建文件夹`tpl`，然后在`tpl`中新建一个`index.html`，如下

```bash
mkdir public && cd public && touch index.html
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <div id="app"></div>
</body>
</html>
```

> 这时候有了页面模板还是不够的，还需要将页面模板和打包出来的`js`文件关联起来，因为考虑到以后打包出来的`js`的文件不会是一个固定的名称，所以这里需要使用一个`webpack`的插件`html-webpack-plugin`

7. 配置`html-webpack-plugin`

```js
module.exports = {
    plugins: [
        new HtmlwebpackPlugin({
            template: 'public/index.html'
        })
    ]
}
```

> 配置完成后就可以启动项目了


8. 配置`tsconfig`

- **编译目标** 这时候我们切回`tsconfig`配置中，会发现在`compilerOptions`配置项的`target`是`es5`，也就是说把`ts`代码编译成`es5`规范的代码，如果不做兼容的话，我们可以将它设置为`es6`，使其编译成`es6`的代码
- **模块处理** 在`module`项中，会发现生成的是`commonjs`的模块系统，因为不考虑兼容，所以这里我也将其设定为最新的`esnext`，并且将模块处理方式改为用`node`来处理，设置`moduleResolution`项为`node`，不做模块处理方式设置的话可能会有报错

![](https://poetries1.gitee.io/img-repo/2019/10/551.png)


9. 项目启动

> 这时候我们可以在`package.json`中添加启动命令

```js
"dev": "webpack-dev-server --config build/webpack.config.js --mode development"
```

> 其中`--mode development`用于指定开发模式，否则在`webpack4+`版本下会有警告
然后直接`npm run dev`即可

**总结**

> 其实这个时候项目其实就已经跑起来了，完全可以不用往下看，但是实际上的工作并没有做完，下一章就开始讲解如何提高开发体验

# 二、提升开发体验

> 本章主要介绍的是建立在项目初始化的基础上如何优化开发体验 内容包含如下:

- 支持`sass`
- 支持`css module`
- 配置公用的`sass`属性
- 支持装饰器
- 路径优化
- 构建缓存
- 构建加速

## 2.1 支持sass

```bash
# 安装相应包
npm install -D node-sass sass-loader style-loader css-loader
```

> `webpack`进行`loader`编译的顺序是从下到上的:知道上面的顺序后我们在`webpack`中的配置就非常简单了，直接在`module.rules`下面加上`.scss`文件类型的编译配置即可

![](https://poetries1.gitee.io/img-repo/2019/10/552.png)


> 查看效果,这时候我们在`src`下面新建一个`index.scss`，然后在`index.tsx`里面引入这个文件查看

![](https://poetries1.gitee.io/img-repo/2019/10/553.png)
![](https://poetries1.gitee.io/img-repo/2019/10/554.png)
![](https://poetries1.gitee.io/img-repo/2019/10/555.png)
![](https://poetries1.gitee.io/img-repo/2019/10/556.png)

## 2.2 支持css module

> `css module`是针对`css`类名作用域做出限定的一种规范，用以解决`css`类名冲突的问题

- 安装对应的包 因为在这里我们用的是`TypeScript`，所以可以用`typings-for-css-modules-loader`这个包，这个包也可以替代`css-loader`的功能，此外这个包还能根据`.scss`文件里面的类名自动生成对应的`.d.ts`文件

```bash
npm install -D typings-for-css-modules-loader
```

> 配置`webpack` 这个配置接非常简单了，因为要用`typings-for-css-modules-loader`替代`css-loader`的功能，所以直接替换即可，将前面`sass`的配置修改为如下:

![](https://poetries1.gitee.io/img-repo/2019/10/557.png)


> 修改为这样既可，但是同时我们也发现一个问题:

![](https://poetries1.gitee.io/img-repo/2019/10/558.png)

- 这个问题导致的原因是因为`.scss`文件中并没有类似`export`这样的关键词用于导出一个模块，所以也就导致报错找不到模块，这个问题可以通过`ts`的模块声明(`declare module`)来解决。
- 解决模块声明问题,这时候我们在根目录下新建一个`typings`文件夹，用于存放`.scss`的模块声明，以及后续需要用到的全局校验接口，然后新建`typed-css-modules.d.ts`文件用于存放`.scss`模块声明，目录结构和声明内容如下

![](https://poetries1.gitee.io/img-repo/2019/10/559.png)

> 这个时候回到`index.tsx`文件中你会发现错误标红消失了，然后我们在`index.scss`文件中新增如下代码

![](https://poetries1.gitee.io/img-repo/2019/10/560.png)


> 保存后你会发现当前目录下新增了一个`index.scss.d.ts`文件，打开里面可以发现是针对每个类名的类型校验，当以后新增类名的时候，`typed-css-modules.d.ts`都会自动在`index.scss.d.ts`里面新增对应的类型校验

![](https://poetries1.gitee.io/img-repo/2019/10/561.png)


这时候回到页面查看，你会发现类名变成了一个`hash`值，这样可以有效地避免类名全局污染问题

![](https://poetries1.gitee.io/img-repo/2019/10/562.png)


## 2.3 配置公共sass属性

> 既然已经可以使用`sass`进行更加简便的`css`代码编写，那么我们也可以将常用的一些样式代码和`sass`变量写入公共文件中，当使用的时候就可以直接引入使用，这可以提高一定的效率节约时间

1. 新建公共样式目录 

> 首先在`src`目录下新建`styles`文件夹，然后在`styles`文件夹下新建`var.scss`文件用于存放样式变量。 之后在`var.scss`文件里写入一个颜色变量和一个样式:

![](https://poetries1.gitee.io/img-repo/2019/10/563.png)

2. 查看效果 

> 然后在`index.scss`文件里面引入`var.scss`，接着就可以直接使用里面的变量了

![](https://poetries1.gitee.io/img-repo/2019/10/564.png)
![](https://poetries1.gitee.io/img-repo/2019/10/565.png)

3. 优化

> 上面的效果其实已经达成，但还是存在一个不好的问题，就是在引入`var.scss`的路径上要根据每个文件夹的路径相对来引入非常麻烦，那么我们能否做到只需要`@import var.scss`就行呢？答案是可以的，我们可以使用一个`node-sass`的属性`includePaths`进行路径优化:


![](https://poetries1.gitee.io/img-repo/2019/10/566.png)
![](https://poetries1.gitee.io/img-repo/2019/10/567.png)


## 2.4 支持装饰器

> 前置工作 在`src`目录下新建一个`components`文件夹，用于存放通用组件，然后在`components`文件及里面新建一个组件`Test`，然后在网页入口引入这个组件，如下图所示:

![](https://poetries1.gitee.io/img-repo/2019/10/568.png)

![](https://poetries1.gitee.io/img-repo/2019/10/569.png)

> 什么是装饰器，为什么需要装饰器 装饰器本质上就是一个函数，这个函数对类(`class`)本身进行一些处理，也可以将装饰器的写法当做一种语法糖，如果不用装饰器的话，可以写成下图这样

![](https://poetries1.gitee.io/img-repo/2019/10/570.png)

> 设置装饰器可用 根据装饰器的语法，我们可以将上面的代码写成如下:

![](https://poetries1.gitee.io/img-repo/2019/10/571.png)


> 但是你会发现这里报了一个错误，这是因为装饰器语法在`es6`标准中还只是一个提案，并未正式支持，但是在`ts`中，装饰器已经被正式支持了，不用`ts`的可以自行安装`babel`相关包进行支持

![](https://poetries1.gitee.io/img-repo/2019/10/572.png)


> 那么怎么解决这个错误呢？我们根据错误提示进入到`tsconfig`文件中，将`experimentalDecorators`设置为`true`即可，然后回到页面查看`log`装饰器已经生效了

## 2.5 优化路径

> 在上面的例子中我们新建了`components`文件夹，然后在入口处引入了其中的`Test`组件


但是这时候需要考虑到一个问题，如果以后在一个层级比较深的文件中引入这个组件会不会产生如下这种情况呢?

```
import Test from '../../../../components/Test'
```

> 这样不仅书写起来麻烦还容易出错，因此这时候就需要进行一些路径上的优化，使得无论在哪个地方引入这些组件都能用同一种写法，例如:

```
import Test from '@comonents/Test'
```

> 这里针对路径的优化有两种方案，第一种是直接在`webpack.resolve.alias`中进行路径配置:

![](https://poetries1.gitee.io/img-repo/2019/10/573.png)

> 但是在这里我们使用了`ts`，所以还需要在`tsconfig`中进行配置:

![](https://poetries1.gitee.io/img-repo/2019/10/574.png)

> 这样也能用，不过我们还可以用`tsconfig-paths-webpack-plugin`这个包将`tsconfig`中对路径的设置映射`到webpack`配置中去，这样就不需要在`webpack`中再进行一次路径的配置了，首先安装:

```
npm install -D tsconfig-paths-webpack-plugin
```

> 然后就采用前面`tsconfig`里面对`baseUrl`和`paths`的配置。
之后进入`webpack`配置中，引入`tsconfig-paths-webpack-plugin`

```
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
```

> 接着在`webpack.resolve`中新增配置项`plugins`(这里要注意的是新增的不是`webpack.plugins`，而是`webpack.resolve.plugins`)，配置如下代码

![](https://poetries1.gitee.io/img-repo/2019/10/575.png)

接着我们就可以愉快地使用简化后的路径了：

![](https://poetries1.gitee.io/img-repo/2019/10/576.png)

## 2.6 构建缓存

> 我们一般会使用`webpack-dev-server`来进行项目开发，当我们运行`webpack-dev-server`的时候它会在内存中进行项目的构建，但是当使用了`babel`之类的代码转换工具后，会对项目构建产生较大的性能影响，这是因为每一次的构建都会对代码进行重新转换。而构建缓存就是将构建的公用代码缓存在磁盘上，这样做的效果就是第一次构建的时间花销会比不用缓存的构建大，但是在之后每次构建的时间花销都会大大减少

- **对比** 我们拿一个较大的项目来看区别。 注: 左边是没有设置构建缓存，右边进行了构建缓存。 首先进行对比的是第一次构建时候的时间花销:

![](https://poetries1.gitee.io/img-repo/2019/10/577.png)


- 然后是第二次构建的时间花销

![](https://poetries1.gitee.io/img-repo/2019/10/578.png)


可以看出在第二次构建的时候时间花销减少了百分之五十以上。

**设置构建缓存**


> 在设置构建缓存之前我们首先要考虑的是那些地方需要进行设置，那么在前面的配置过程中，可以看出花销较大的地方有对`ts(x)`的转换并且以后还会添加对应的`babel`进去，然后还有针对`sass`类型的转换，那么我们就先对这两个地方的转换进行配置

1. 对`ts(x)`的转换

> 这里因为我们使用的是`awesome-typescript-loader`，这个库本身自带了开启缓存的选项`useCache`，然后我们需要指定一个保存缓存文件的地方`cacheDirectory`，所以配置改为如下:

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f824c8eb2f6)



2. 对`sass`类型的转换

> 这个地方我们需要使用到一个库`cache-loader`

```
npm install -D cache-loader
```

> 然后在对`.scss`文件类型的转换配置中使用它，在这里我们主要是针对转换出来的`css`进行缓存，所以需要写在`typings-for-css-modules-loader`配置的前面:


![](https://poetries1.gitee.io/img-repo/2019/10/579.png)

> 这样就配置好当前的构建缓存了，当你`npm run dev`的时候会发现根目录下生成了缓存文件`.cache-loader`

![](https://poetries1.gitee.io/img-repo/2019/10/580.png)

打开它看会发现有对应的缓存代码:

![](https://poetries1.gitee.io/img-repo/2019/10/581.png)


# 三、整理杂项

> 在上一篇提升开发体验中，我们一下子集成了一堆插件和功能进去，导致项目结构比教混乱，重点问题就在`webpack`的相关配置项目录`build`文件夹中，所以今天的工作较为轻松，重点就是进行项目结构整理，然后再进行一些杂项的添加

- 整理项目结构
- 集成`Ant Design`并进行主题修改
- 整合常用函数，并且让所有组件继承这些函数
- 集成`mobx`进行项目的状态管理
- 使用`react-hot-loader`进行热加载
- 集成`svg-component`

## 3.1 整理项目结构

在做这一步的时候首先我们来看看现在的项目结构是怎么样的

![](https://poetries1.gitee.io/img-repo/2019/10/582.png)


> 那么当前最先需要做的工作就是进行build文件夹下`webapck`的配置项整理

针对`webpack`配置项的整理。做这一步的时候首先需要确定一点就是，我们根据什么来整理`webpack`配置项目录呢？要确定这一点只需要查看一下`webpack`中有些什么配置，然后就可以根据每个配置项进行模块划分


![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8c2b307da5)

> 在这份配置项中，因为`entry`、`output`、`resolve`内容相对较少，往后也不会有太多内容的添加，所以可以忽略

**首先将plugins相关内容移出来**

1. 首先在`build`中新建文件`plugins.js`，然后将原先的`plugin`里面的代码拷贝过去


![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8c2c047254)

2. 在`webpack.config.js`中将`plugins.js`的内容引入进来即可

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8c2c12d407)

**整合路径选择**在`webpack.config.js`中你会看到许多使用`path.join`的地方，这一块也可以抽取出来作为一个工具模块。新建`build/utils.js`文件，然后写入如下代码，将路径的目标指向根目录，详细路径则通过参数的形式传入

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8c2c08d84e)

之后在任何需要使用的地方引入这个函数使用即可

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8c2c233b37)

**将module相关内容移出来** 

> 因为在`module`项中相关的配置相对较多，涵盖了对`ts(x)`和`scss`等相关文件的`loader`，以后还需要添加针对图片等文件类型的`loader`，所以这一块需要分的更加细一些:

1. 在`build`中新建`rules`目录，里面新建`jsRules`和`styleRules`文件

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8c64eb6fa0)

2. 将之前`module`中的`loader`配置一如对应文件中并导出，然后在`webpack.config.js`中引入: 首先是`jsRules`内容

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8c68636d4a)

> 然后是`styleRules`内容

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8c6fac503d)

最后是引入`rules`后的`webpack.config.js`

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8c79f0f5c4)

> 至此我们就将`webpack`的配置项分离了出来，接下来我们集成`Ant DesignUI`库(简称`antd`)，并且修改其主题色。

## 3.2 集成antd

> 集成`antd` 要集成`antd`非常简单，只需要`npm install -S antd`即可，然后我们在`components/Test`组件中引入其中一个组件

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8c97991436)

**修改`antd`的主题配色**

> 通常在开发中，我们采用的配色不是`antd`原本的配色，如果大面积引用`antd`组件的话，一个个去修改配色确实是非常麻烦的事情，于是这个时候就需要一次性对`antd`的主题色进行修改


1. `antd`的样式使用`less`进行编写，对其主题的修改也就是对其中的`less`变量进行修改，所以想要修改主题需要安装`less`和`less-loader: npm install -D less less-loader`
2. 然后我们在根目录下添加一个`theme.js`文件，里面是需要修改的主题样式代码，具体有什么主题可以进行修改可以点击[这里查看](https://ant.design/docs/react/customize-theme-cn):

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8d0b747b7c)

3. 然后编写在`build/rules/styleRules`中添加针对`less`文件的`loader`，如下图: 引入上一步的主题文件

```js
const theme = require('../../../theme')
```

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8d1e9baa99)

4. 最后我们在`components/Test`组件中引入`Button`组件的样式`less`文件

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8d2765fc0e)

> 此时可以查看效果，发现已经主题已经修改成功

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8d27a7dca3)

5. 存在的问题

> 这个时候进行`antd`组件的引入和主题修改的步骤中还是存在一些问题的，比如在引入某个组件的同时还需要手动引入其对应的`less`文件，这是非常麻烦的一件事，那么找我们需要解决的就是在引入`antd`组件的同时也自动引入其对应的`less`文件。
另外，使用`import {Button } from 'antd'`这样的引入方式存在一个很大的弊端，就是在引入其中某个组件的同时会把整个`antd`文件都引入进来，影响构建速度，而且打包后体积会变大，这样的话我们还需要做`antd`的按需加载。所以接下来我们需要解决掉这两个问题，而这两个问题也是可以同时解决的

**antd按需加载**

- 在`antd`官网中推荐使用`babel-plugin-import`来做按需加载，但是我们的项目用的是`typescript`，走的是`awesome-typescript-loader`编译，所以在我们的项目中`babel-plugin-import`是不生效的，这时候需要就需要一个叫做`ts-import-plugin`的插件
`npm install -D ts-import-plugin`
- 第二步我们需要在`build/rules/jsRules.js`中进行配置，根据`ts-import-plugin`的教程直接配置即可

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8d44294d39)

- 回到`Test`组件中 将`import 'antd/lib/button/style/index.less'`这句话删掉，然后重新运行查看效果

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8d564985fd)

## 3.3 整合常用函数

> 在上一步中，我们集成了`antdUI`库，在这个库中有许多东西是非常常用的，例如消息组件`message`和通知组件`notification`，但是要用到这两个组件的话就得引入，当使用次数较多的时候，我们可以考虑将其整合在一个`react`组件中，然后所有的组件都继承这个组件即可，这样做的好处是当以后添加了例如`axios`这样的常用库的时候也可以整合到这个`react`组件中，使继承这个`react`组件的组件都可以用到

**整合常用函数**

1. 我们先在`src`下新建`utils`目录，然后在`utils`中新建`reactExt.tsx`文件

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8d5b6090f8)

2. 然后在`tsconfig.json`中设置好`utils`的路径，方便以后的路径引用

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8d5c1006a2)

3. 在`reactExt.tsx`中引入`antd`常用组件，然后导出这个整合了`antd`组件的组件，当然你也可以把它叫做类，其中需要注意的是，因为以后的每个`react`组件使用的都是`componentExt`，然后在这里我们需要使用`typescript`的`interface`来对`react`组件的`state`和`props`进行数据类型上的限制，但与此同时并不能知道每个`react`组件针对`state`和`props`的`interface`是怎么样的，所以在`componentExt`中需要用到泛型来灵活化`interface`

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8d6e8951c5)

4. 最后在`components/Test`组件中引入`comonentExt`进行测试:

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8d7b30cfdc)


![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8d904c2d8c)

> 以后如果有常用的功能性函数也可以往`components/reactExt`中进行添加。

## 3.4 集成mobx

> `mobx`是`react`技术栈中一款优秀的状态管理工具，它具有数据监测的功能，并且比`redux`用起来更加方便，也能脱离`react`进行单独使用，安装`mobx`只需要`npm install -S mobx`即可，同时也要安装他和`react`连接的工具`npm install -S mobx-react`。接下来就以一个经典的计算器组件来测试`mobx`。

准备工作 在进行测试之前，我们还需要整理一下组件存放的目录。首先区分一下组件目录的作用

1. `components`目录用于存放通用组件，该目录存放的组件不包含任何业务性功能。
2. 新建`src/containers/views`目录，这个目录是用于存放业务组件的，并且这些组件不能复用。
3. 新建`src/containers/shared`目录，这个目录用于存放可以复用的业务组件。
4. 在`tsconfig.json`中设置简短路径方便以后调用

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8d962b539a)

这一步在该博客中作用体现不大，但是对真实项目的条理性是存在较好作用的。 如下图


![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8dad2a591e)


**创建store**

1. 新建`src/store`目录用于存放`store`文件，然后在该目录下新建`globalStore`目录和其中的`index.tsx`文件


![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8db62a7861)


2. 然后在这个`index.tsx`文件中有如下代码:其中的`observable`和`action`的功能请自行查看`mobx`文档

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8db645466b)

3. 然后新建`src/store/index.tsx`文件用于导出这些`store`

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8dc2c22e8a)

> 连接`store` 创建了`store`之后我们还需要将其和`react`进行连接，这个时候就需要用到`mobx-react`这个库，我们去到`src/index.tsx`中进行修改


![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8dd42b6277)


> 这里面的`configure({enforceActions: 'observed'})`用于限制被`observable`(也就是`store`中添加了`@observable`)的数据的修改方式，让其只能添加了`@action`的函数中进行修改

**编写Counter组件进行测试**

1. 我们去到`src/containers/views`目录中，新增`Counter/index.tsx`，并写入如下代码:


![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8e6498d5b6)



2. 然后将这个组件用`mobx-react`变为可观测对象，并使用`@inject`注入`globalStore`

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8ebe0fe5a8)

3. 最后我们在`src/index.tsx`中引入`Counter`组件，顺便看看它的`props`中是否带有数据

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8ebdf84fcb)

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8ec7ec007f)

4. 最后回到`Counter`组件中编写方法检验功能是否正常

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8ec93a6e97)

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8ed83a36e1)

**给`store`添加全局`typescript`校验**

> 在上面的例子中虽然我们在功能上已经可以正常的使用了，但是显而易见的是有报错，这个错误是因为没有填写针对组件`props`的验证接口导致`typescript`认为`globalStore`不存在而导致的。我们可以写成如下代码解决问题

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8ed94ef498)

> 但是每个引入了`globalStore`的组件都需要写一次显得非常麻烦，那么我们可以将`IGlobalStore`这个校验接口写成全局的校验接口，直接以如下图形式验证即可:

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8ef763161e)

1. 我们在`src/store/globalStore`下新建`type.d.ts`

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8efd0a612d)

2. 去到`globalStore/index.tsx`中，将`GlobalStore`类导出，我们将会利用这个类作为`typescript`校验接口来使用([这种用法可以点这里查看详情](https://www.tslang.cn/docs/handbook/classes.html)):

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8f0c4f3793)

3. 在`type.d.ts`中引入这个类，然后定义并导出一个全局命名空间(该用法详解点这里)，接着在这个命名空间中把接口导出:

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8f0d3eb028)

4. 回到`Counter`组件中，将接口改写为如下

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8f228cde5d)

> 这里注意需要添加`?`，因为这个属性是从`store`中拿过来的，不填写的话，父组件会报错说没有传这个值。 但是因为添加了`?`，所以这个`globalStore`验证为不一定有，从而在组件中会有如下报错:

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8f2cbe58cd)

> 这个时候我们可以去`tsconfig.json`中将`strictNullChecks`项置为`false`，去掉`null`和`undefined`的检测即可

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8f3ae218f9)

5. 到了这一步我们集成`Mobx`就成功了，并且也针对`store`添加了对应的`typescript`验证:

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8fb0f9a40b)

## 3.5 使用react-hot-loader进行热加载


> 这一步主要针对的是`webpack-dev-server`的页面自动刷新功能不能保持数据一直都在，有时候在更新组件代码后需要保持数据不变的场景就会很不方便，所以这个时候就需要用到`react-hot-loader`来进行页面代码变更检测并找到变更部分进行更新，同时保证数据不变

1. 首先我们安装它`npm install -D react-hot-loader`
2. 然后我们还要用到它里面的`react-hot-loader/babel`，但是因为我们使用了`awesome-typescript-loader`，所以不需要在根目录添加`.babelrc`文件了，直接进到`build/rules/jsRules.js`中进行配置即可

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8fe0254e3e)

3. 接着我们去到`Counter`组件中引入`react-hot-loader`中的`hot`方法，直接以装饰器的形式包裹组件

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8fe202cfc4)

4. 最后再去`package.json`中，在`dev`命令后面加上`--hot`即可

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8fec22bb00)

5. 回到`Counter`组件中做个检测，先增加一些数字，然后在增加字样后面加上几个字符，可以看到页面更新的同时保留了数据

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f8fee77cede)

> 实际上我们在控制台看到输出这个字样就已经成功了

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9017aa3c1c)

## 3.6 集成svg-component

> 在前端开发中，`svg`格式的图片使用的是非常频繁的，而集成了`svg-component`后，我们可以将`svg`图片以组件的形式引入并使用

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9049d9e78d)

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9053dc41a4)

1. 要集成`svg-component`我们首先要安装`@svgr/webpack: npm install -D @svgr/webpack`，这是一个`loader`；
2. 然后我们在`build/rules`中新建`fileRules.js`文件，将`svg`格式文件用这个`loader`进行编译

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f90590b139a)

> 然后在`webpack.config.json`中导入并重启项目

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f906b6a9866)

3. 接着我们随便找一个`svg`格式图片在`Counter`中引入并测试，虽然可以使用了，但是也导致了一个`typescript`的报错说找不到模块

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f90846eb8ae)

> 导致这个错误的原因是`svg`图片本身并不具备模块化的功能，也不提供模块导出，所以在导入的时候是不能识别的，要解决这个问题可以模仿我们之前使用`css moudles`的方式，给它声明一个模块:我们在`typings`目录下新建`svg.d.ts`文件，并写入如下代码


![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9087ba0a45)

> 这个时候还可以为`svg-component`的使用提供代码提示和传入属性校验的支持: 我们声明一个接口，然后在声明的模块中用这个接口作为内容

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f908ff2a12b)

> 这个接口使用的是`react`的无状态组件声明，传入属性则为`svg`文件自带的属性比如`col` or `width`之类的，然后我们就可以愉快地使用`svg-comonent`了

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9099a156a0)



# 四、项目打包

> 本章节内容

- 添加打包命令
- 进行`css`和`js`分离
- 修改`html-webpack-plugin`配置项
- 添加`react-loadable`和`react-router`,进行代码分离和按需加载
- 添加`optimization`,进行第三方库代码分离
- 进行代码压缩
- 关于`externals`

## 4.1 添加打包命令

> 我们先去`webpack.config.js`中观察一下`output`这个配置项

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f94ef778e90)

> 该配置项指定了打包路径和打包后的`js`文件名，在`webpack`的配置项中，`output`是必须有的。 接着我们去到`package.json`中在`script`中添加打包命令`build`，该命令引用我们的`webpack.config.js`配置文件

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f94ef97e678)

> 之后试试运行`npm run build`，会发现已经将项目打包出来了


**添加打包路径工具**

> 在上一步中，我们已经知道打包出来的文件位于根目录下的`dist`文件夹中，所以这个路径工具的添加指向`dist`文件夹： 我们去到`build/utils.js`文件中，添加如下代码:

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f94f05a96c6)

以后指定打包文件存放路径的时候就可以直接使用这个工具进行指定





## 4.2 分离css文件

> 在上面打包的结果中，我们会发现只有一个`app.js`文件，而实际上我们是有写`css`样式的，但是现在的却并没有这个`css`文件，这是因为`webpack`将所有的资源(包含`js,` `css`等等)都看成是`chunk`，然后一起打包进一个文件中，这样会导致打包出来的`js`文件体积巨大，从而拖累页面的加载速度

1. 在`webpack 4+`版本中，我们可以使用`mini-css-extract-plugin`进行`css`代码的分离，所以首先安装它`npm install -D mini-css-extract-plugin`。
2. 然后我们到`build/plugins.js`中添加这个插件

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f94f05a22d8)

3. 最后需要注意，之前在提升开发体验这一章中有提到过一点，`style-loader`用于将`css-loader`编译出来的代码转为`js`代码并写入`js`文件中，所以在这里，我们需要用`mini-css-extract-plugin`中的`loader`去替换掉`style-loader`，让它写入单独的`css`文件而不是js文件中:

> 我们去到`build/rules/styleRules.js`中，将原本的`style-loader`全都替换成`mini-css-extract-plugin`的`loader`(这一步可以进行开发环境和生产环境的区分，在文章中不进行区分

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f94f074b032)

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f95243b1af2)

4. 经过上面的步骤，我们可以打包进行测试: 运行`npm run build`可以发现打包结果中`css`文件已经进行了分离

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f95246e0168)


> 而在打包出来的`index.html`中也可以发现这个`css`文件被引入了

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9525da2e2b)

> 最后我们再在打包路径中将打包出来的`js`文件用`js`文件夹包裹起来即可

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9525f9c958)

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f952c7c1a74)



## 4.3 修改`html-webpack-plugin`配置项

> 这一步主要用于压缩打包出来的`index.html`文件，但是单页面应用的话`html`内容其实不多，所以做不做也差不多，在本文章中也只是做个介绍:


1. 首先在`html-webpack-plugin`中利用的是`html-minifier`来做压缩工作的，所以详细配置点击进去看即可，常用的如下

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f95327fdfb4)


2. 第二个需要提一下则是`inject`这个配置项，该项指定资源如何注入，我们直接使用默认的`true`即可，他会将`js`资源注入到`<body>`标签的底部，如果要注入到头部填写`head`即可




## 4.4 代码分离和按需加载

> 这一步和下一步都是在进行代码的拆分，考虑的是如果所有文件都塞进一个`js`文件中，会导致这个`js`文件体积臃肿，而单页面应用的所有构建又是依赖于这个`js`文件，所以需要进行代码分离，只加载当前页面需要构建的`js`文件。通常来说，我们会根据`react-router`分的页面来进行代码分离，再用`react-loadable`进行分割出来的代码的异步加载(当然你也可以将所有组件都进行代码分离然后异步加载)。所以在这里我们先利用`react-router`分两个页面home和page出来

1. 首先我们安装`react-router: npm install -S react-router-dom`，然后在`src/containers/views`中新建`Home`和`Page`组件

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f955223fdb1)

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f955498f237)

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f955a218dfa)

2. 接着安装`react-loadable: npm install -S react-loadable`, 然后在`src/containers/shared`中新建`App`组件

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f956605e8a3)

> 之后在里面的`index.tsx`中引用`react-router`和`react-loadable`进行组件按需加载: 当然不要忘了使用`react-hot-loader`


![](https://user-gold-cdn.xitu.io/2018/9/27/16619f957819d10f)


> 这一步需要注意的是，`Loadable`这个函数中的`loading`参数是必须有的，至于如何使用可以自行参考`react-loadable`的`github`链接

3. 这个时候去到页面看一下：在`/`路径下，没有加载`page.js`这个文件，而切换到`/page`路径则会加载`page.js`文件，这个时候按需加载就完成了:

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f95831e4bd4)

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f958db827e0)

4. 最后我们观察一下打包后的`js`文件可以发现已经进行了分离

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9592077596)



## 4.5 添加`optimization`

> `optimization`是`webpack4+`版本中新出的配置项，这个配置项的功能主要是进行代码压缩，优化。在本节中，我们需要将用到的处于`node_modules`中的第三方代码进行分离，在这里主要用到的是两个配置项`optimization.runtimeChunk`和`optimization.splitChunks`，其中`runtimeChunk`用于生成维系各各代码块关系的代码，`splitChunks`则用于指定需要进行分块的代码，和分块后文件名

1. 我们去到`build`目录下，新建`optimization.js`，并添加如下代码

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f95b234dd4b)


> 然后在`webpack.config.js`中引入这个配置


![](https://user-gold-cdn.xitu.io/2018/9/27/16619f95bd023c85)

2. 最后我们打包试试看可以发现第三方代码都被打包进`vendor.js`文件中了


![](https://user-gold-cdn.xitu.io/2018/9/27/16619f95bd4ac283)

> 你可以通过比对在添加`optimization`之前和之后打包出来的`app.js`文件来看出效果




## 4.6 代码压缩


> 我们主要是做`js`和`css`的代码压缩和优化

1. 在上面阶段中，我们打包出来的`js`代码是已经经过压缩的

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f95dad8cc4a)


> 所以在这个阶段我们可以利用`uglifyjs-webpack-plugin`进行一些压缩优化:
首先我们需要安装`npm install -D uglifyjs-webpack-plugin`，然后去到`build/optimization.js`中添加如下代码即可，具体的优化见代码

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f95e8adf639)

> PS: 这里有一个点需要注意，在`uglifyjs-webpack-plugin`这个插件中，如果是`2.x`版本的话是不支持`es6`规范的，所以建议安装`1.x`版本，而我这里的版本是:



![](https://user-gold-cdn.xitu.io/2018/9/27/16619f95f0555484)

2. 然后我们进行`css`代码的压缩，这里需要使用到`optimize-css-assets-webpack-plugin`插件:`npm install -D optimize-css-assets-webpack-plugin`。
我们先去`Home`组件中随意添加一个样式并使用它

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f960309fb62)

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f961b48fbd1)

> 然后再去到`build/optimization.js`添加如下代码:

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f96298993ed)


> 具体的插件使用方式可以自行上`github`查看该插件。 最后查看打包出来后的`css`代码:

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f962dc1fe47)

> 到现在压缩代码步骤也做完了，最后将介绍一下`webpack.externals`这个选项

## 4.7 关于`externals`

> `webpack.externals`配置项用于在构建过程中忽略一些常用包的集成，从而降低构建时间和打包后的包大小，它的配置也很简单，在本章中只做简单介绍:在本项目中，我们可以将`react`和`react-dom`添加进`externals`中，然后在`html`模板中引入它们的外部链接:

1. 我们先去到`webpack.config.js`中，添加`externals`选项，并且把`react`和`react-dom`添加进去

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9644d33821)

> 这个配置项接收的是一个对象(其他形式请自行查阅`webpack`文档)，对象的键是指`webapck`在获取这个模块时候`require`时候的参数，而对应的值则是标明你打算将这个模块挂载的变量名，这里是挂载在`window`对象中的


2. 去到`build/tpl/index.html`中，引入`cdn`中`react`和`react-dom`的链接

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9658bd182f)

3. 重启项目，可以发现在`npm run dev`中能够正常使用，并且也已经引入了两者的外部资源

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9661413f04)


4. 最后我们来对比一下打包后模块占用情况


![](https://user-gold-cdn.xitu.io/2018/9/27/16619f966474b96f)

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9686f0e243)

> 再来对比一下两者打包出来的包体积大小

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f969e86d5c4)

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f96a92a2402)



# 五、团队规范

> 这篇文章的每一步都基于`vscode`这款编辑器，如果你使用的不是`vscode`，那么就需要自行集成相关插件及其配置。该文章只是简单介绍各各代码检测的流程，至于配置项则需要读者自行前往对应的`lint`官网自己查看、配置需要的。

**在这块中我们需要做的如下**:

- 使用`tslint`做代码检测
- 使用`stylelint`做代码检测
- 添加`npm script`进行检测
- 使用`prettier`进行代码格式化
- 使用`pre-commit`

## 5.1 使用tslint进行代码检测

> 我们的项目因为大量使用`typescript`，所以使用的是`tslint`检测工具，如果在你的项目中没有用到`typescript`，那么请使用`eslint`

1. 首先我们需要在`vscode`中安装插件:


![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9dff505830)

> 然后在项目中安装`npm install -D tslint`。此外，因为我们有大量的`.tsx`文件，所以还需要`npm install -D tslint-react`来指定针对`.tsx`语法的限制

2. 接着在根目录下新建`tsling.json`文件，该文件用于写`tslint`配置文件:

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9dffb7feb2)

3. 在`tslint.json`中写入配置，配置项参考请[点击这里](https://palantir.github.io/tslint/rules/)

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9dffa72149)


> 这份配置项中，上面的`extends`是指`tslint`的扩展，第一个扩展是稳定且常规的`tsling`检测标准，第二个则是针对`.tsx`文件做的检测

4. 测试一下是否生效: 我们将`no-console`改为`true`测试一下

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9dff914b71)

> 然后在组件中写一个`console.log`就可以知道这份配置表已经生效

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9e0040ce6a)



## 5.2 使用`stylelint`做代码检测

1. 首先，在`vscode`安装`stylelint`这个插件，该插件可以对`css`、`less`、`scss`等类型的样式表代码进行格式和样式书写顺序上的检测:

```
npm install -D stylelint
```


![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9e005118f4)


2. 我们在根目录下创建`.stylelintrc.js`文件，然后安装官方推荐的配置`stylelint-config-standard`以及针对`scss`代码类型检测的插件`stylelint-scss`:

```bash
npm install -D stylelint-config-standard stylelint-scss
```

3. 然后在`.stylelintrc.js`文件中写入配置项

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9e37e5534d)



4. 但是这时候针对`scss`代码的检测还是有问题的，它不能识别`scss`中例如`@mixin`、`@include`之类的语法:

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9e37d61834)

所以还需要手动写一些规则覆盖掉针对这类语法的检测使其不报错:

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9e3eaf28fa)

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9e4c7fee18)




## 5.3 添加`npm script`进行检测

> 这一步主要利用`tslint`和`stylelint`附带的命令行命令检测项目中存在的代码规范问题，然后输出到终端查看


1. 去到`package.json`中，在`scripts`中添加如下命令

> 这条命令既检查`.tsx`文件也检查`.scss`文件

2. 然后再终端中输入一次，就能看到报错如下

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9e60035ebb)

然后定位到文件中去修改即可

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9e61e4d27e)


## 5.4 使用`prettier`进行代码格式化

> 除了上一节中手动定位并修改不规范的代码外，我们还可以依赖于`vscode`的插件来进行符合我们规范的代码格式化，这个插件推荐使用`prettier`


1. 首先在`vscode`中安装这个插件

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9e6ad151e7)

2. 然后去到用户设置表中,进到工作区设置进行配置，下图是该模板的配置，当然你也可以自行配置需要的设置

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9e6eae3e6f)

3. 回到刚才错误的地方，只要我们一保存就会自动格式化成正确的

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9e7581ebae)

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9e8cf71d5d)




## 5.5 使用`pre-commit`

> 在前面的篇幅中，我们有将`lint`命令添加进`npm script`中，但是这个命令如果要自己去运行我想很多人都会忘记，结果就会导致可能有不符合规范的代码被上传到远端代码仓库中。这种情况下我们可以做`pre-commit`进行代码强制检测，也就是在`git commit`之前进行一次代码检测，不符合规范不让`commit`。
实现这个功能我们可以安装`husky`这个插件`npm install -D husky`，然后在`npm script`中添加命令就好了

![](https://user-gold-cdn.xitu.io/2018/9/27/16619f9e9472379a)


# 六、代码

> 完整代码示例  https://github.com/poetries/ts-react-tpl
