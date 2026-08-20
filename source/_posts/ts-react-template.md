---
title: Typescript+React模板搭建（三）从零配到可上线
description: 手写 webpack 搭一套 TypeScript + React 工程模板，覆盖 sass、css module、装饰器、路径别名、构建缓存、antd 按需加载、mobx、代码分割与压缩、tslint 和 pre-commit。
date: 2018-12-31 23:50:14
tags: 
  - Typescript
  - React
  - webpack
  - 前端工程化
categories: Front-End
---

前两篇把 TypeScript 的语法过完了，但语法会写不等于项目能跑。真正卡人的是工程那一层：`.scss` 引进来编译器说找不到模块，路径写成七八层 `../`，装饰器一加就报错，打包出来一个几兆的 `app.js` 塞满第三方库。这些问题跟类型系统没半点关系，却能让人一整天挪不动。

这篇就是把这些坑一个个填掉的记录，从 `npm init` 开始，一直配到构建缓存、按需加载、代码压缩和提交前的 lint 卡口。跟完之后你手上会有一份能直接拿去改的模板，而且每一行配置你都知道它在解决什么。

> 整理于网络

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 从零建目录、装依赖、写第一份只有 `entry` 和 `output` 的 webpack 配置
- `tsconfig.json` 里 `jsx`、`target`、`module`、`moduleResolution` 这几项分别在管什么
- sass、css module、公共变量、装饰器、路径别名、构建缓存这六项开发体验优化
- 把臃肿的 `webpack.config.js` 按 plugins / rules / utils 拆成模块
- 集成 antd 并改主题色，顺带把按需加载一起解决掉
- 用 mobx 做状态管理，以及怎么给 store 补上全局的 TypeScript 校验
- 打包阶段的 css 分离、代码分割、第三方库抽离、js 和 css 压缩、`externals`
- tslint、stylelint、prettier、pre-commit 这一套团队规范怎么落地

这是连载的第三篇，前两篇分别是 [Typescript基础及结合React实践(一)](https://feinterview.poetries.top/blog/ts-intro-and-use-in-react) 和 [Typescript总结篇（二）](https://feinterview.poetries.top/blog/ts-summary)。语法部分在那两篇里讲透了，这篇只管工程。

先把时间背景交代清楚。这套模板搭于 2018 年底，webpack 是 4.x，TypeScript 是 3.x，React 是 16.x。这些年工具链换了好几轮，文中不少包已经停止维护。原始配置我一行不动地保留，涉及到现在有替代方案的地方另起一段说明，具体版本行为以各自官方文档为准。如果你只是想快速起一个 TS + React 项目，现在用 `npm create vite@latest` 选 `react-ts` 模板三十秒就好，这篇的价值在于让你看清每一个配置项当初是为了解决什么问题才被加进来的。

## 一、项目初始化

这一章的目标很朴素，让 `npm run dev` 跑起来，浏览器里能看到一个 `<div>1234</div>`。中间会踩到 JSX 版本没配、扩展名没配这两个几乎人人都会踩的坑。

### 1.1 创建项目

> 确保安装了 `npm install -g typescript`

```bash
# -S 是--save简写
# -D 是--save-dev简写

# 创建目录
mkdir ts-react && cd ts-react

# 生成package.json、tsconfig.json
npm init -y && tsc --init

# 安装开发工具
npm install -D webpack webpack-cli webpack-dev-server

# 安装react相关
npm install -S react react-dom

# 安装react相关的ts验证包
npm install -D @types/react @types/react-dom

# 安装ts-loader(或者awesome-typescript-loader) 这两款loader用于将ts代码编译成js代码
npm install -D awesome-typescript-loader
```

这几行装的东西可以分成三类。webpack 三件套负责打包和起开发服务，`react` 和 `react-dom` 是运行时依赖所以用 `-S`，`@types/react` 和 `@types/react-dom` 是 React 的类型说明书，只在编译期用得上所以进 `-D`。最后那个 loader 才是 TypeScript 接进 webpack 的关键，没有它 webpack 根本不认识 `.tsx`。

原文这里有两处笔误我顺手改了：`npm install-D` 缺了空格，装不上；注释写的是 `ts-loader` 或 `awesome-typescript-loader`，命令里却装成了 `babel-loader`，而后文用的一直是 `awesome-typescript-loader`，所以我按后文统一了。

补一句现状。`awesome-typescript-loader` 早就不再维护了，现在这个位置的常见选择是 `ts-loader`，或者干脆用 `babel-loader` 加 `@babel/preset-typescript` 只做转译、把类型检查交给单独的 `tsc --noEmit` 进程。Vite 走的是同一条思路，转译交给 esbuild，检查另开一个进程。这个拆分是这些年构建提速最大的一笔。

### 1.2 webpack配置

先建目录，把 webpack 配置单独放一个 `build` 文件夹，好处是根目录干净，后面配置项拆多了也有地方放。

1. 在项目根目录新建一个`build`文件夹

```
mkdir build && cd build && touch webpack.config.js
```

2. 根目录下新建src文件夹，然后在src里新建index.tsx文件作为项目入口

```
mkdir src && cd src && touch index.tsx
```

3. 编写简单的`webpack`配置，只包含`entry`和`output`

webpack 配置最小可用的形态就两项，从哪进（`entry`）、往哪出（`output`）。因为配置文件放在 `build/` 里，所有路径都要用 `path.join(__dirname, '../', ...)` 先跳回根目录再往下找，这一点后面拆配置的时候会被抽成一个工具函数。

```js
const path = require('path')

module.exports = {
    entry: {
        app: path.join(__dirname, '../', 'src/index.tsx')
    },
    output: {
        path: path.join(__dirname, '../', 'dist'),
        filename: '[name].js'
    }
}
```

原文这段代码里有四处会直接让 Node 报语法错的问题，我都改对了：`module.export` 少了 s，三个字符串少了收尾的引号，`output` 里的 `path.join(...)` 没写 `path:` 这个键名。照原样复制是跑不起来的。

`filename: '[name].js'` 里的 `[name]` 会被替换成 `entry` 的键，也就是 `app`，所以产物是 `app.js`。后面做代码分割的时候，这个占位符会派上真正的用场。

4. 编写`awesome-typescript-loader`配置项:
在`webpack`中的`module`是专门用来决定如何处理各种模块的配置项，例如本例中的`typescript`，这里主要用的配置项就是`module.rules`，而当前只需要简单配置解析`.tsx`文件类型即可

`module.rules` 的写法是「用正则匹配文件名，命中了就交给指定的 loader 处理」。这里只需要一条规则，`test: /\.tsx?$/` 匹配 `.ts` 和 `.tsx`，`loader` 指向上面装的那个。规则的顺序和多个 loader 的执行方向下一节讲 sass 的时候会细说，那里更直观。

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

写完这个文件，编辑器里那句 `ReactDOM.render` 上会立刻飘红。下面这张就是当时的报错，注意红线画在 JSX 那一行上。

> 但是这时候你会发现有一个错误没有处理


![tsconfig 未配置 jsx 选项时 index.tsx 中 JSX 语法报错](https://s.poetries.top/gitee/2019/10/550.png)

看到这个报错说明 TypeScript 已经在工作了，它只是不知道该拿 JSX 怎么办。`.tsx` 后缀只是告诉编译器「这个文件里有 JSX」，具体编译成什么还得靠 `jsx` 这个选项指定。

> 这是因为在`tsconfig`里面没有指定`JSX`的版本，这时候在`tsconfig`的`compilerOptions`中添加`"jsx": "react"`配置项即可消除错误

`"jsx": "react"` 的意思是把 JSX 编译成 `React.createElement(...)`，所以每个 `.tsx` 文件顶部都必须有 React 的引入，否则运行时会报 `React is not defined`。这个值后来多了个 `react-jsx`，对应 React 17 引入的新 JSX 转换，产物走 `react/jsx-runtime`，好处正是不用再手动引 React。新项目建议直接用 `react-jsx`，具体版本要求以 React 官方文档为准。

- 此外还需要注意一点，以后需要`import xxx from 'xxx'`这样的文件的话需要在`webpack`中的`resolve`项中配置`extensions`，这样以后引入文件就不需要带扩展名

```js
module.exports = {
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx']
    }
}
```

这个数组的顺序是有意义的，webpack 按从左到右的顺序挨个试。把 `.ts` 和 `.tsx` 放在 `.js` 前面，意味着同名文件优先用 TypeScript 版本，从 JS 渐进迁移的项目会很依赖这个行为。忘了配的后果是所有不带扩展名的 `import` 全部报模块找不到，大概率你也遇到过。

顺带说一句，上面入口文件里 `import Test from '@components/Test'` 引进来却没用上，那个 `@components` 别名要到 2.5 节才配好，这一步先跑通的话可以把这行注释掉。

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

这个插件解决的是一个很具体的麻烦。产物文件名以后会带上 hash（为了让浏览器缓存能正确失效），你没法在 HTML 里把 script 标签的 src 写死成 `app.js`。`html-webpack-plugin` 干的事就是拿你的模板，自动把当次构建产出的 js 和 css 插进去。

7. 配置`html-webpack-plugin`

```js
module.exports = {
    plugins: [
        new HtmlWebpackPlugin({
            template: 'public/index.html'
        })
    ]
}
```

原文这里的类名写成了 `HtmlwebpackPlugin`，中间的 w 应该大写，`require` 回来的构造函数名是 `HtmlWebpackPlugin`，写错了直接就是 `undefined is not a constructor`。另外注意上面 `mkdir public` 的命令把 `index.html` 建在了 `public/` 根下，而后文 4.7 节又提到 `build/tpl/index.html`，两处路径对不上，以自己项目里的实际位置为准，`template` 指对就行。

> 配置完成后就可以启动项目了


8. 配置`tsconfig`

`tsc --init` 生成的默认配置是为「跑在老浏览器上的纯 TypeScript 项目」准备的，交给 webpack 打包的场景要动两项。

- **编译目标** 这时候我们切回`tsconfig`配置中，会发现在`compilerOptions`配置项的`target`是`es5`，也就是说把`ts`代码编译成`es5`规范的代码，如果不做兼容的话，我们可以将它设置为`es6`，使其编译成`es6`的代码
- **模块处理** 在`module`项中，会发现生成的是`commonjs`的模块系统，因为不考虑兼容，所以这里我也将其设定为最新的`esnext`，并且将模块处理方式改为用`node`来处理，设置`moduleResolution`项为`node`，不做模块处理方式设置的话可能会有报错

`module: "esnext"` 这一项特别关键，它保留 `import` / `export` 原样交给 webpack，webpack 才能做 tree shaking 和后面 4.4 节的按需加载。要是留着 `commonjs`，`import` 早在 TypeScript 那一层就被编译成 `require` 了，webpack 拿到的是一堆运行时调用，静态分析无从下手，代码分割也就白配了。

下面这张是改完之后的 `compilerOptions`，可以对照着看几个键的位置。

![tsconfig.json 中 target 改为 es6、module 改为 esnext、moduleResolution 设为 node 的配置](https://s.poetries.top/gitee/2019/10/551.png)

改完保存，编辑器的红线应该全部消失。如果 `moduleResolution` 那项报「不能与 module 一起使用」，通常是 TypeScript 版本太老，升一下就好。

再补一句现状。`moduleResolution` 现在多了个 `bundler` 取值，专门给交给打包器处理的场景用，它比 `node` 更贴近 Vite、webpack 的真实解析行为，比如允许省略扩展名的同时又能正确读 `package.json` 的 `exports` 字段。新项目走打包器的话，官方推荐的就是这个值，具体取值和兼容矩阵以 TypeScript 官方文档为准。

9. 项目启动

> 这时候我们可以在`package.json`中添加启动命令

```js
"dev": "webpack-dev-server --config build/webpack.config.js --mode development"
```

> 其中`--mode development`用于指定开发模式，否则在`webpack4+`版本下会有警告
然后直接`npm run dev`即可

`--config` 是必须的，因为配置文件没放在默认的根目录而是在 `build/` 里。`--mode` 则是 webpack 4 才引入的概念，它会顺带打开一批默认优化，`development` 下不压缩、带完整 sourcemap，`production` 下自动压缩和 tree shaking。

**总结**

> 其实这个时候项目其实就已经跑起来了，完全可以不用往下看，但是实际上的工作并没有做完，下一章就开始讲解如何提高开发体验

跑起来只是及格线。接下来这一章的每一项都对应一个具体的难受点，写样式没有变量、类名全局冲突、路径写一长串、每次改代码等构建等到走神。

## 二、提升开发体验

> 本章主要介绍的是建立在项目初始化的基础上如何优化开发体验 内容包含如下:

- 支持`sass`
- 支持`css module`
- 配置公用的`sass`属性
- 支持装饰器
- 路径优化
- 构建缓存
- 构建加速

### 2.1 支持sass

原生 CSS 没有变量、没有嵌套、没有 mixin，多写几个页面就会开始复制粘贴。sass 补上了这些，代价是多一道编译。

```bash
# 安装相应包
npm install -D node-sass sass-loader style-loader css-loader
```

这四个包各管一段，串起来才是完整链路。`node-sass` 把 `.scss` 编译成 `.css`，`sass-loader` 是它和 webpack 之间的胶水，`css-loader` 负责解析 CSS 里的 `@import` 和 `url()`，`style-loader` 最后把这段 CSS 塞进一个 `<style>` 标签插到页面上。

> `webpack`进行`loader`编译的顺序是从下到上的:知道上面的顺序后我们在`webpack`中的配置就非常简单了，直接在`module.rules`下面加上`.scss`文件类型的编译配置即可

从下到上这条规则是很多人配错 loader 的根源。数组里写 `['style-loader', 'css-loader', 'sass-loader']`，实际执行顺序是 `sass-loader` 先跑，产物往上交给 `css-loader`，最后才到 `style-loader`。顺序反了会报「无法解析 `$color`」这类看着莫名其妙的错，因为 `css-loader` 拿到了还没编译的 sass 语法。

![webpack module.rules 中新增 scss 文件类型的 loader 配置](https://s.poetries.top/gitee/2019/10/552.png)

配好之后重启一次 dev server，这类改动改的是配置文件本身，热更新是不生效的。

> 查看效果,这时候我们在`src`下面新建一个`index.scss`，然后在`index.tsx`里面引入这个文件查看

下面四张图是这一步的完整过程：新建的 `index.scss` 内容、在 `index.tsx` 里 `import './index.scss'`、页面上样式生效的效果，以及在浏览器里能看到样式确实是通过 `<style>` 标签注入的。

![新建的 index.scss 文件内容](https://s.poetries.top/gitee/2019/10/553.png)
![在 index.tsx 中引入 index.scss](https://s.poetries.top/gitee/2019/10/554.png)
![页面上 scss 样式已经生效](https://s.poetries.top/gitee/2019/10/555.png)
![浏览器开发者工具中看到样式由 style-loader 注入到 head 里](https://s.poetries.top/gitee/2019/10/556.png)

看到样式生效就说明这条链路通了。这里补一条时效性：`node-sass` 是 LibSass 的 Node 绑定，已经被官方标为废弃，主要问题是它带二进制，Node 一升级就要重编译，装包失败率很高。现在统一用 `sass` 这个包（Dart Sass 的 JS 版本），装上之后 `sass-loader` 会自动优先用它，配置基本不用改。这个我踩过好几次，团队里有人 Node 版本不一致，`npm install` 就在 `node-sass` 那里卡住。

### 2.2 支持css module

> `css module`是针对`css`类名作用域做出限定的一种规范，用以解决`css`类名冲突的问题

- 安装对应的包 因为在这里我们用的是`TypeScript`，所以可以用`typings-for-css-modules-loader`这个包，这个包也可以替代`css-loader`的功能，此外这个包还能根据`.scss`文件里面的类名自动生成对应的`.d.ts`文件

```bash
npm install -D typings-for-css-modules-loader
```

> 配置`webpack` 这个配置接非常简单了，因为要用`typings-for-css-modules-loader`替代`css-loader`的功能，所以直接替换即可，将前面`sass`的配置修改为如下:

替换之后 loader 链变成 `style-loader` → `typings-for-css-modules-loader` → `sass-loader`，中间那一环同时做了三件事：解析 CSS、把类名转成 hash、顺手生成类型声明。

![用 typings-for-css-modules-loader 替换 css-loader 后的 webpack 配置](https://s.poetries.top/gitee/2019/10/557.png)

配完之后写法也要跟着变，从 `import './index.scss'` 变成 `import styles from './index.scss'`，然后类名用 `styles.title` 这种方式取。改完你会立刻撞上下面这个报错。

> 修改为这样既可，但是同时我们也发现一个问题:

![TypeScript 报错 找不到 index.scss 模块的声明文件](https://s.poetries.top/gitee/2019/10/558.png)

红线出现在 `import styles from './index.scss'` 这一行，提示大意是找不到这个模块的声明。这个报错来自 TypeScript 而不是 webpack，webpack 那边其实已经处理得好好的。

- 这个问题导致的原因是因为`.scss`文件中并没有类似`export`这样的关键词用于导出一个模块，所以也就导致报错找不到模块，这个问题可以通过`ts`的模块声明(`declare module`)来解决。
- 解决模块声明问题,这时候我们在根目录下新建一个`typings`文件夹，用于存放`.scss`的模块声明，以及后续需要用到的全局校验接口，然后新建`typed-css-modules.d.ts`文件用于存放`.scss`模块声明，目录结构和声明内容如下

这里要理解一件事，TypeScript 只认识 `.ts` 和 `.d.ts`，它根本不知道 webpack 会把 `.scss` 变成一个导出对象。所以你得手写一份声明告诉它：凡是以 `.scss` 结尾的模块，默认导出是一个「字符串到字符串的字典」。

![typings 目录结构与 typed-css-modules.d.ts 里的 scss 模块声明内容](https://s.poetries.top/gitee/2019/10/559.png)

做完这一步红线就该消失了。如果还在报，检查 `tsconfig.json` 的 `include` 有没有把 `typings` 目录圈进去，声明文件不在编译范围内是不会被加载的，这个坑我第一次配的时候排查了挺久。

> 这个时候回到`index.tsx`文件中你会发现错误标红消失了，然后我们在`index.scss`文件中新增如下代码

![在 index.scss 中新增几个类名](https://s.poetries.top/gitee/2019/10/560.png)

> 保存后你会发现当前目录下新增了一个`index.scss.d.ts`文件，打开里面可以发现是针对每个类名的类型校验，当以后新增类名的时候，`typed-css-modules.d.ts`都会自动在`index.scss.d.ts`里面新增对应的类型校验

![自动生成的 index.scss.d.ts 中每个类名对应一条类型声明](https://s.poetries.top/gitee/2019/10/561.png)

这个自动生成才是用这个 loader 而不是普通 `css-loader` 的真正理由。有了它，`styles.titel` 这种拼写错误会在编译期红线，而不是等到页面上样式没生效你才发现。

> 这时候回到页面查看，你会发现类名变成了一个`hash`值，这样可以有效地避免类名全局污染问题

![浏览器中类名被编译成 hash 值 避免全局冲突](https://s.poetries.top/gitee/2019/10/562.png)

看到元素上挂着一串 hash 就说明 css module 生效了。补一条现状：`typings-for-css-modules-loader` 已经不再维护，现在的通常做法是直接用 `css-loader` 的 `modules` 选项做类名隔离，类型那部分交给 `typescript-plugin-css-modules` 这个编辑器插件，或者用 Vite 内置的 css module 支持，它对 `*.module.scss` 是开箱即用的。

### 2.3 配置公共sass属性

> 既然已经可以使用`sass`进行更加简便的`css`代码编写，那么我们也可以将常用的一些样式代码和`sass`变量写入公共文件中，当使用的时候就可以直接引入使用，这可以提高一定的效率节约时间

1. 新建公共样式目录 

> 首先在`src`目录下新建`styles`文件夹，然后在`styles`文件夹下新建`var.scss`文件用于存放样式变量。 之后在`var.scss`文件里写入一个颜色变量和一个样式:

主题色、间距、字号这类东西散落在各个 scss 文件里，改一次要全局搜索替换，抽成变量文件之后改一处就够了。

![src/styles/var.scss 中定义的颜色变量和公共样式](https://s.poetries.top/gitee/2019/10/563.png)

2. 查看效果 

> 然后在`index.scss`文件里面引入`var.scss`，接着就可以直接使用里面的变量了

![在 index.scss 中通过相对路径引入 var.scss 并使用变量](https://s.poetries.top/gitee/2019/10/564.png)
![页面上公共变量定义的颜色已经生效](https://s.poetries.top/gitee/2019/10/565.png)

页面颜色跟着变了就说明引入成功。但这个写法有个明显的别扭之处，下面那一步就是来治它的。

3. 优化

> 上面的效果其实已经达成，但还是存在一个不好的问题，就是在引入`var.scss`的路径上要根据每个文件夹的路径相对来引入非常麻烦，那么我们能否做到只需要`@import var.scss`就行呢？答案是可以的，我们可以使用一个`node-sass`的属性`includePaths`进行路径优化:

`includePaths` 的作用是给 sass 编译器一个「额外的查找目录清单」。把 `src/styles` 加进去之后，任何文件里写 `@import 'var'`，编译器找不到相对路径就会去这个清单里找。组件挪目录的时候再也不用改 import 路径，这一点在重构的时候特别舒服。

![sass-loader 的 options 中配置 includePaths 指向 src/styles](https://s.poetries.top/gitee/2019/10/566.png)
![配置 includePaths 之后可以直接 import var 而不写相对路径](https://s.poetries.top/gitee/2019/10/567.png)

这里有个坑要注意：`includePaths` 只影响 sass 的 `@import`，不影响 `.tsx` 里的模块引入，那个是下面 2.5 节的事，两套机制互不相干。

### 2.4 支持装饰器

装饰器这一节看着是语法问题，实际是为后面 3.4 节的 mobx 铺路。mobx 的 `@observable`、`@action`、`@inject` 全靠它，不先打开这个开关，那一章根本走不下去。

> 前置工作 在`src`目录下新建一个`components`文件夹，用于存放通用组件，然后在`components`文件及里面新建一个组件`Test`，然后在网页入口引入这个组件，如下图所示:

![src/components/Test 组件的目录结构与代码](https://s.poetries.top/gitee/2019/10/568.png)

![在 src/index.tsx 入口中引入并渲染 Test 组件](https://s.poetries.top/gitee/2019/10/569.png)

页面上能看到 Test 组件渲染出来，说明前置工作完成，接下来拿它当装饰器的实验对象。

> 什么是装饰器，为什么需要装饰器 装饰器其实就是一个函数，这个函数对类(`class`)本身进行一些处理，也可以将装饰器的写法当做一种语法糖，如果不用装饰器的话，可以写成下图这样

先看不用装饰器的原始形态，就是一个「拿类进去，返回处理过的类」的普通函数调用。理解了这一层，`@` 语法就没什么神秘的了。

![不使用装饰器时 手动调用函数包装类的写法](https://s.poetries.top/gitee/2019/10/570.png)

> 设置装饰器可用 根据装饰器的语法，我们可以将上面的代码写成如下:

![改写成 @ 装饰器语法后的类定义](https://s.poetries.top/gitee/2019/10/571.png)

两种写法产生的结果完全一样，区别只在于装饰器把「谁包装了这个类」这件事摆到了类定义的正上方，读代码的人一眼就能看到，不用翻到文件底部去找那行调用。

> 但是你会发现这里报了一个错误，这是因为装饰器语法在`es6`标准中还只是一个提案，并未正式支持，但是在`ts`中，装饰器已经被正式支持了，不用`ts`的可以自行安装`babel`相关包进行支持

![TypeScript 提示装饰器是实验性特性 需要开启 experimentalDecorators](https://s.poetries.top/gitee/2019/10/572.png)

报错原文里通常会直接告诉你要开哪个选项，这是 TypeScript 报错信息里比较友好的一类。

> 那么怎么解决这个错误呢？我们根据错误提示进入到`tsconfig`文件中，将`experimentalDecorators`设置为`true`即可，然后回到页面查看`log`装饰器已经生效了

控制台里打出装饰器函数的那行 log，就说明它在类定义的时候确实执行了。

这块的现状变化比较大，值得单独说一句。文中用的是「实验性装饰器」，也就是 TC39 的旧提案，`experimentalDecorators` 这个名字里的 experimental 不是随便叫的。TypeScript 5.0 之后开始支持新版的标准装饰器提案，两套语义并不完全兼容，最明显的差别是新版暂不支持参数装饰器，而且 `emitDecoratorMetadata` 那套元数据机制只在旧版里有。mobx 6 也因此改了推荐写法，从装饰器转向了 `makeObservable`。所以你要是在新项目里照抄这一节，先确认你用的库支持的是哪一套，具体以 TypeScript 和 mobx 官方文档为准。

### 2.5 优化路径

> 在上面的例子中我们新建了`components`文件夹，然后在入口处引入了其中的`Test`组件


但是这时候需要考虑到一个问题，如果以后在一个层级比较深的文件中引入这个组件会不会产生如下这种情况呢?

```
import Test from '../../../../components/Test'
```

> 这样不仅书写起来麻烦还容易出错，因此这时候就需要进行一些路径上的优化，使得无论在哪个地方引入这些组件都能用同一种写法，例如:

```
import Test from '@components/Test'
```

原文这里把 `@components` 拼成了 `@comonents`，我改回来了，别名拼错是不会有任何提示的，只会报模块找不到。

> 这里针对路径的优化有两种方案，第一种是直接在`webpack.resolve.alias`中进行路径配置:

![webpack resolve.alias 中把 @components 指向 src/components](https://s.poetries.top/gitee/2019/10/573.png)

配完这一步项目能跑，但编辑器里还是一片红。因为 webpack 的 alias 只在打包时生效，TypeScript 完全不知道有这回事，这就是下面还要在 `tsconfig` 里配一遍的原因。

> 但是在这里我们使用了`ts`，所以还需要在`tsconfig`中进行配置:

![tsconfig 中通过 baseUrl 和 paths 配置路径别名](https://s.poetries.top/gitee/2019/10/574.png)

`tsconfig` 这边用的是 `baseUrl` 加 `paths` 两个字段配合，`baseUrl` 定基准目录，`paths` 定映射规则。同一套别名要在两个地方各写一遍，只要有人漏改一处，就会出现「能跑但编辑器报错」或者「编辑器不报错但打包失败」这两种拧巴的状态。

> 这样也能用，不过我们还可以用`tsconfig-paths-webpack-plugin`这个包将`tsconfig`中对路径的设置映射`到webpack`配置中去，这样就不需要在`webpack`中再进行一次路径的配置了，首先安装:

```
npm install -D tsconfig-paths-webpack-plugin
```

这个包解决的正是上面那个「配两遍」的问题，让 `tsconfig.json` 成为唯一的事实来源，webpack 那边自动读过去。

> 然后就采用前面`tsconfig`里面对`baseUrl`和`paths`的配置。
之后进入`webpack`配置中，引入`tsconfig-paths-webpack-plugin`

```
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
```

> 接着在`webpack.resolve`中新增配置项`plugins`(这里要注意的是新增的不是`webpack.plugins`，而是`webpack.resolve.plugins`)，配置如下代码

括号里那句提醒很值得记。`webpack.plugins` 装的是参与整个构建流程的插件，`webpack.resolve.plugins` 装的是只影响模块解析的插件，两者是完全不同的位置，放错了不报错也不生效，排查起来非常费劲。

![在 webpack.resolve.plugins 中挂上 TsconfigPathsPlugin](https://s.poetries.top/gitee/2019/10/575.png)

配完之后可以把 `resolve.alias` 里那份重复配置删掉了，留着不会出错，但迟早会跟 `tsconfig` 里的那份走散。

![使用简化后的别名路径引入组件](https://s.poetries.top/gitee/2019/10/576.png)

### 2.6 构建缓存

> 我们一般会使用`webpack-dev-server`来进行项目开发，当我们运行`webpack-dev-server`的时候它会在内存中进行项目的构建，但是当使用了`babel`之类的代码转换工具后，会对项目构建产生较大的性能影响，这是因为每一次的构建都会对代码进行重新转换。而构建缓存就是将构建的公用代码缓存在磁盘上，这样做的效果就是第一次构建的时间花销会比不用缓存的构建大，但是在之后每次构建的时间花销都会大大减少

- **对比** 我们拿一个较大的项目来看区别。 注: 左边是没有设置构建缓存，右边进行了构建缓存。 首先进行对比的是第一次构建时候的时间花销:

先看第一次构建，这一次缓存是空的，还得额外花时间往磁盘上写，所以开了缓存反而更慢一点。

![开启构建缓存前后第一次构建的耗时对比](https://s.poetries.top/gitee/2019/10/577.png)

- 然后是第二次构建的时间花销

第二次才是真正要看的，这时候缓存已经建好，没改动的模块直接从磁盘读结果。

![开启构建缓存前后第二次构建的耗时对比](https://s.poetries.top/gitee/2019/10/578.png)

可以看出在第二次构建的时候时间花销减少了百分之五十以上。

这个数字是原文在那个具体项目上量出来的，换个项目差别会很大，取决于你有多少代码走了这两个 loader。缓存的收益规律倒是通用的：首次构建变慢，之后每次都快，所以它对「一天启动一两次 dev server、改一整天代码」这种工作方式收益最大。

**设置构建缓存**

> 在设置构建缓存之前我们首先要考虑的是那些地方需要进行设置，那么在前面的配置过程中，可以看出花销较大的地方有对`ts(x)`的转换并且以后还会添加对应的`babel`进去，然后还有针对`sass`类型的转换，那么我们就先对这两个地方的转换进行配置

思路是先找瓶颈再配缓存，别一上来给所有 loader 都套一层。缓存本身有读写开销，给一个本来就很快的 loader 加缓存，纯属做无用功。

1. 对`ts(x)`的转换

> 这里因为我们使用的是`awesome-typescript-loader`，这个库本身自带了开启缓存的选项`useCache`，然后我们需要指定一个保存缓存文件的地方`cacheDirectory`，所以配置改为如下:

在 loader 的 `options` 里把 `useCache` 打开、`cacheDirectory` 指到一个目录就行，记得把这个目录写进 `.gitignore`，缓存文件是不该进版本库的。

2. 对`sass`类型的转换

> 这个地方我们需要使用到一个库`cache-loader`

```
npm install -D cache-loader
```

> 然后在对`.scss`文件类型的转换配置中使用它，在这里我们主要是针对转换出来的`css`进行缓存，所以需要写在`typings-for-css-modules-loader`配置的前面:

`cache-loader` 的位置决定了它缓存的是哪一步的产物。回想 2.1 节说的「从下到上」执行，写在 `typings-for-css-modules-loader` 前面（也就是数组更靠前的位置），意味着它拿到的是那一环处理完的结果，下次命中缓存时 sass 编译和 css module 转换这两步都能跳过。位置放错了，缓存的就是别的东西，效果差很多。

![在 scss 的 loader 链中加入 cache-loader 的配置](https://s.poetries.top/gitee/2019/10/579.png)

> 这样就配置好当前的构建缓存了，当你`npm run dev`的时候会发现根目录下生成了缓存文件`.cache-loader`

![根目录下自动生成的 .cache-loader 缓存目录](https://s.poetries.top/gitee/2019/10/580.png)

看到这个目录出现就说明缓存生效了。要是没出现，先确认 `cache-loader` 真的写进了 rules 而不是写到了 plugins 里。

打开它看会发现有对应的缓存代码:

![.cache-loader 目录中保存的编译结果缓存文件内容](https://s.poetries.top/gitee/2019/10/581.png)

缓存是按文件内容算 hash 存的，所以改一个文件只会让那一个文件的缓存失效。这里有个坑：改了 webpack 配置或者升级了 loader 版本，缓存不一定会自动失效，遇到「改了配置没生效」的怪事，先把缓存目录删掉重来。这个我排查过一下午，最后发现就是缓存的问题。

补一句现状。webpack 5 内置了持久化缓存，配置 `cache: { type: 'filesystem' }` 就能覆盖大部分场景，`cache-loader` 已经不再需要，官方也标了废弃。Vite 那边则是靠 esbuild 预构建依赖加上浏览器原生 ESM，压根没有「每次都重新打包」这个问题。

## 三、整理杂项

上一章为了跑通功能，配置是一路往 `webpack.config.js` 里堆的。这种堆法在功能验证阶段没问题，但再往下走就会开始互相绊脚，所以这一章先停下来收拾一遍，再继续往里加东西。

> 在上一篇提升开发体验中，我们一下子集成了一堆插件和功能进去，导致项目结构比较混乱，重点问题就在`webpack`的相关配置项目录`build`文件夹中，所以今天的工作较为轻松，重点就是进行项目结构整理，然后再进行一些杂项的添加

- 整理项目结构
- 集成`Ant Design`并进行主题修改
- 整合常用函数，并且让所有组件继承这些函数
- 集成`mobx`进行项目的状态管理
- 使用`react-hot-loader`进行热加载
- 集成`svg-component`

### 3.1 整理项目结构

在做这一步的时候首先我们来看看现在的项目结构是怎么样的

![当前项目的目录结构 build 文件夹下配置堆在一个文件里](https://s.poetries.top/gitee/2019/10/582.png)

这张图里最扎眼的就是 `webpack.config.js` 这一个文件扛下了所有配置。文件本身跑起来没问题，问题在于以后每加一个 loader 或者插件都往里堆，两百行之后没人愿意再动它。

> 那么当前最先需要做的工作就是进行build文件夹下`webapck`的配置项整理

针对`webpack`配置项的整理。做这一步的时候首先需要确定一点就是，我们根据什么来整理`webpack`配置项目录呢？要确定这一点只需要查看一下`webpack`中有些什么配置，然后就可以根据每个配置项进行模块划分

拆分的依据就是 webpack 配置对象本身的那几个顶级键。这个思路很省心，因为不需要你发明一套目录规范，webpack 的文档结构就是现成的分类标准，新人照着 `plugins`、`module.rules` 这些名字也能猜到文件里装的是什么。

> 在这份配置项中，因为`entry`、`output`、`resolve`内容相对较少，往后也不会有太多内容的添加，所以可以忽略

**首先将plugins相关内容移出来**

`plugins` 是最先该拆的，因为它增长最快。后面几章还要往里加 `mini-css-extract-plugin`、`optimize-css-assets-webpack-plugin` 等等，留在主文件里很快就会淹没 `entry` 和 `output`。

1. 首先在`build`中新建文件`plugins.js`，然后将原先的`plugin`里面的代码拷贝过去

这个文件导出一个数组就行，把原来 `plugins: [...]` 里的内容原封不动搬过去，顺带把 `require` 也一起搬走。

2. 在`webpack.config.js`中将`plugins.js`的内容引入进来即可

主配置里就剩一行 `plugins: require('./plugins')`，干净很多。

**整合路径选择**在`webpack.config.js`中你会看到许多使用`path.join`的地方，这一块也可以抽取出来作为一个工具模块。新建`build/utils.js`文件，然后写入如下代码，将路径的目标指向根目录，详细路径则通过参数的形式传入

这一步解决的是 1.2 节埋下的那个别扭：配置文件在 `build/` 里，每处路径都要写 `path.join(__dirname, '../', xxx)`。抽成一个函数之后，调用方只关心「相对根目录的路径是什么」，`../` 那段跳转逻辑收在一个地方，以后 `build` 目录挪层级也只改一处。

之后在任何需要使用的地方引入这个函数使用即可

**将module相关内容移出来** 

> 因为在`module`项中相关的配置相对较多，涵盖了对`ts(x)`和`scss`等相关文件的`loader`，以后还需要添加针对图片等文件类型的`loader`，所以这一块需要分的更加细一些:

`module.rules` 跟 `plugins` 不一样，它内部本身就有天然的分类，按文件类型分。所以这里不是拆成一个文件，而是拆成一个目录，一类文件一个模块。

1. 在`build`中新建`rules`目录，里面新建`jsRules`和`styleRules`文件

2. 将之前`module`中的`loader`配置移入对应文件中并导出，然后在`webpack.config.js`中引入: 首先是`jsRules`内容

`jsRules` 装的是 `.ts` / `.tsx` 那条规则，也就是 `awesome-typescript-loader` 加上 2.6 节配的缓存选项。

> 然后是`styleRules`内容

`styleRules` 装的是 `.scss` 那条，`cache-loader`、`typings-for-css-modules-loader`、`sass-loader` 三层，顺序要保持原样。3.2 节加 antd 的时候还会往这个文件里再塞一条 `.less` 规则。

最后是引入`rules`后的`webpack.config.js`

主配置最后只剩 `entry`、`output`、`resolve`、`module.rules`（引用）、`plugins`（引用）这几行，一屏就能看完。这是我觉得这一章最有价值的地方，配置文件读起来的成本比它长什么样重要得多。

> 至此我们就将`webpack`的配置项分离了出来，接下来我们集成`Ant DesignUI`库(简称`antd`)，并且修改其主题色。

### 3.2 集成antd

> 集成`antd` 要集成`antd`非常简单，只需要`npm install -S antd`即可，然后我们在`components/Test`组件中引入其中一个组件

装完就能用，但真正的工作量在后面两件事上：改主题色和按需加载。

**修改`antd`的主题配色**

> 通常在开发中，我们采用的配色不是`antd`原本的配色，如果大面积引用`antd`组件的话，一个个去修改配色确实是非常麻烦的事情，于是这个时候就需要一次性对`antd`的主题色进行修改

一个个去覆盖组件样式是最糟糕的做法，不仅要写一堆 `!important`，而且组件库一升级样式结构变了就全部失效。正确的做法是从源头改，也就是改 antd 自己的 less 变量。

1. `antd`的样式使用`less`进行编写，对其主题的修改也就是对其中的`less`变量进行修改，所以想要修改主题需要安装`less`和`less-loader: npm install -D less less-loader`
2. 然后我们在根目录下添加一个`theme.js`文件，里面是需要修改的主题样式代码，具体有什么主题可以进行修改可以点击[这里查看](https://ant.design/docs/react/customize-theme-cn):

`theme.js` 导出的就是一个键值对，键是 antd 的 less 变量名（比如 `@primary-color`），值是你想要的颜色。这份文件建议单独放根目录，因为设计改配色的时候只需要动它。

3. 然后编写在`build/rules/styleRules`中添加针对`less`文件的`loader`，如下图: 引入上一步的主题文件

```js
const theme = require('../../../theme')
```

这行 `require` 的相对层级要按你自己的实际目录数。如果 `styleRules` 是 `build/rules/styleRules.js` 这么一个文件，从它跳回根目录是两层 `../../`；如果是 `build/rules/styleRules/index.js` 这样的目录形式，才是三层。路径写错的表现是构建时报找不到模块，把 `console.log(require.resolve(...))` 打一下就清楚了。

`less-loader` 的 `options.modifyVars` 收下这个对象之后，编译 antd 源码的时候就会用你的值覆盖默认变量，所以最终产出的 CSS 里颜色已经是改过的了，运行时零开销。

4. 最后我们在`components/Test`组件中引入`Button`组件的样式`less`文件

> 此时可以查看效果，发现已经主题已经修改成功

5. 存在的问题

> 这个时候进行`antd`组件的引入和主题修改的步骤中还是存在一些问题的，比如在引入某个组件的同时还需要手动引入其对应的`less`文件，这是非常麻烦的一件事，那么找我们需要解决的就是在引入`antd`组件的同时也自动引入其对应的`less`文件。
另外，使用`import {Button } from 'antd'`这样的引入方式存在一个很大的弊端，就是在引入其中某个组件的同时会把整个`antd`文件都引入进来，影响构建速度，而且打包后体积会变大，这样的话我们还需要做`antd`的按需加载。所以接下来我们需要解决掉这两个问题，而这两个问题也是可以同时解决的

这两个问题能一起解决不是巧合。按需加载插件干的事就是把 `import { Button } from 'antd'` 在编译期改写成 `import Button from 'antd/lib/button'` 加上 `import 'antd/lib/button/style'`，样式那行正是它顺手补上的。

**antd按需加载**

- 在`antd`官网中推荐使用`babel-plugin-import`来做按需加载，但是我们的项目用的是`typescript`，走的是`awesome-typescript-loader`编译，所以在我们的项目中`babel-plugin-import`是不生效的，这时候需要就需要一个叫做`ts-import-plugin`的插件
`npm install -D ts-import-plugin`

这里踩的坑挺典型的：官方文档给的方案默认你走 Babel，而这个项目走的是 TypeScript 自己的编译器，Babel 插件压根没机会执行。`ts-import-plugin` 是同样功能的 TypeScript transformer 版本。这也从侧面说明了为什么后来大家慢慢都转向了「Babel 或 esbuild 转译 + tsc 只做检查」的组合，生态里绝大多数工具是围着 Babel 建的。

- 第二步我们需要在`build/rules/jsRules.js`中进行配置，根据`ts-import-plugin`的教程直接配置即可

- 回到`Test`组件中 将`import 'antd/lib/button/style/index.less'`这句话删掉，然后重新运行查看效果

页面样式没变、按钮还是改过的主题色，就说明插件替你把那行样式引入补上了。

补一句现状。antd 从 5.0 开始改用 CSS-in-JS，样式不再是 less 文件，`babel-plugin-import` 和 `ts-import-plugin` 这套按需加载也不需要了，主题定制换成了运行时的 `ConfigProvider` 加 `theme` 属性。老项目里这套配置还能继续跑，但升级到 antd 5 之后要整段删掉，具体迁移方式以 antd 官方文档为准。

### 3.3 整合常用函数

> 在上一步中，我们集成了`antdUI`库，在这个库中有许多东西是非常常用的，例如消息组件`message`和通知组件`notification`，但是要用到这两个组件的话就得引入，当使用次数较多的时候，我们可以考虑将其整合在一个`react`组件中，然后所有的组件都继承这个组件即可，这样做的好处是当以后添加了例如`axios`这样的常用库的时候也可以整合到这个`react`组件中，使继承这个`react`组件的组件都可以用到

**整合常用函数**

1. 我们先在`src`下新建`utils`目录，然后在`utils`中新建`reactExt.tsx`文件

2. 然后在`tsconfig.json`中设置好`utils`的路径，方便以后的路径引用

跟 2.5 节配 `@components` 一样，往 `paths` 里再加一条 `@utils` 就行，配好之后各处引用统一写 `import ComponentExt from '@utils/reactExt'`。

3. 在`reactExt.tsx`中引入`antd`常用组件，然后导出这个整合了`antd`组件的组件，当然你也可以把它叫做类，其中需要注意的是，因为以后的每个`react`组件使用的都是`componentExt`，然后在这里我们需要使用`typescript`的`interface`来对`react`组件的`state`和`props`进行数据类型上的限制，但与此同时并不能知道每个`react`组件针对`state`和`props`的`interface`是怎么样的，所以在`componentExt`中需要用到泛型来灵活化`interface`

这一段是整节的重点，也是 TypeScript 在这个模板里第一次真正派上用场的地方。基类要写成 `class ComponentExt<P, S> extends React.Component<P, S>`，把两个泛型参数原样透传下去，子类继承时写 `class Test extends ComponentExt<IProps, IState>`，props 和 state 的类型检查一点不丢。要是图省事在基类里把它们写死成 `any`，所有子组件的类型约束就一起废了。

4. 最后在`components/Test`组件中引入`ComponentExt`进行测试:

原文这里把 `ComponentExt` 拼成了 `comonentExt`，前后不一致，我统一了写法。

顺带说一句，用继承来共享 `message`、`notification` 这类能力，在 2018 年的类组件时代是常规操作，但它有个明显的问题：继承是强耦合，基类加一个东西所有组件都被动接收。Hooks 出来之后，同样的需求会写成一个 `useMessage()` 自定义 hook，谁要谁调，组件之间没有继承关系。不是说继承不行，而是在组件复用这件事上，组合的边界确实比继承清楚。

> 以后如果有常用的功能性函数也可以往`components/reactExt`中进行添加。

### 3.4 集成mobx

> `mobx`是`react`技术栈中一款优秀的状态管理工具，它具有数据监测的功能，并且比`redux`用起来更加方便，也能脱离`react`进行单独使用，安装`mobx`只需要`npm install -S mobx`即可，同时也要安装他和`react`连接的工具`npm install -S mobx-react`。接下来就以一个经典的计算器组件来测试`mobx`。

准备工作 在进行测试之前，我们还需要整理一下组件存放的目录。首先区分一下组件目录的作用

1. `components`目录用于存放通用组件，该目录存放的组件不包含任何业务性功能。
2. 新建`src/containers/views`目录，这个目录是用于存放业务组件的，并且这些组件不能复用。
3. 新建`src/containers/shared`目录，这个目录用于存放可以复用的业务组件。
4. 在`tsconfig.json`中设置简短路径方便以后调用

这三个目录的划分标准就一条：这个组件知不知道业务。`components` 里的东西应该能原样搬到另一个项目里去用，一旦它开始读 store、调接口，就该挪到 `containers` 下面。这条线画清楚了，以后要抽组件库的时候不用重新梳理一遍。

这一步在该博客中作用体现不大，但是对真实项目的条理性是存在较好作用的。 如下图

**创建store**

1. 新建`src/store`目录用于存放`store`文件，然后在该目录下新建`globalStore`目录和其中的`index.tsx`文件

一个 store 一个目录，而不是一个文件，是给后面留余地。store 长大之后会带上自己的类型声明、常量、辅助函数，有个目录装着比拆文件方便。

2. 然后在这个`index.tsx`文件中有如下代码:其中的`observable`和`action`的功能请自行查看`mobx`文档

`@observable` 标在字段上，表示这个数据被观测，变了就通知用到它的组件重渲染；`@action` 标在方法上，表示这是唯一允许改动这些数据的地方。这两个装饰器能用，靠的正是 2.4 节打开的 `experimentalDecorators`。

3. 然后新建`src/store/index.tsx`文件用于导出这些`store`

这个文件是所有 store 的汇总出口，往 `Provider` 里传的就是它导出的对象。

> 连接`store` 创建了`store`之后我们还需要将其和`react`进行连接，这个时候就需要用到`mobx-react`这个库，我们去到`src/index.tsx`中进行修改

`mobx-react` 的 `Provider` 跟 react-redux 的 `Provider` 是一个思路，都是借 React context 把数据源挂到组件树顶上，下面任意深度的组件都能取到。

> 这里面的`configure({enforceActions: 'observed'})`用于限制被`observable`(也就是`store`中添加了`@observable`)的数据的修改方式，让其只能添加了`@action`的函数中进行修改

这一行我建议一开始就加上，别嫌麻烦。mobx 默认是允许你在任何地方直接改 observable 数据的，短期很爽，长期就会变成「这个值到底是谁改的」这类查不完的问题。打开 `enforceActions` 之后，所有修改必须走 `@action`，相当于把 Redux 那套「状态变更必须显式声明」的纪律拿了过来，同时又省掉了 action 和 reducer 的样板代码。这个设计是真的舒服。

**编写Counter组件进行测试**

1. 我们去到`src/containers/views`目录中，新增`Counter/index.tsx`，并写入如下代码:

2. 然后将这个组件用`mobx-react`变为可观测对象，并使用`@inject`注入`globalStore`

这里用到两个装饰器，`@inject('globalStore')` 从 `Provider` 里把指定的 store 取出来塞进 props，`@observer` 让这个组件订阅它用到的 observable 数据。两个都得加，只加 `@inject` 拿得到数据但不会自动重渲染，只加 `@observer` 则根本拿不到 store。

3. 最后我们在`src/index.tsx`中引入`Counter`组件，顺便看看它的`props`中是否带有数据

打个 `console.log(this.props)` 看到 `globalStore` 这个键，注入就成功了。

4. 最后回到`Counter`组件中编写方法检验功能是否正常

点按钮数字会变，说明 `@action` 改了数据、`@observer` 收到了通知，整条链路是通的。

**给`store`添加全局`typescript`校验**

> 在上面的例子中虽然我们在功能上已经可以正常的使用了，但是显而易见的是有报错，这个错误是因为没有填写针对组件`props`的验证接口导致`typescript`认为`globalStore`不存在而导致的。我们可以写成如下代码解决问题

功能跑通了但编辑器一片红，这种状态最容易让人放弃类型检查直接标 `any`。这里的报错来源很明确：`@inject` 是运行时往 props 上塞东西，TypeScript 静态分析看不到这个动作，所以它认为 `this.props.globalStore` 不存在。解法就是手动把这个属性声明进 `IProps`。

> 但是每个引入了`globalStore`的组件都需要写一次显得非常麻烦，那么我们可以将`IGlobalStore`这个校验接口写成全局的校验接口，直接以如下图形式验证即可:

1. 我们在`src/store/globalStore`下新建`type.d.ts`

2. 去到`globalStore/index.tsx`中，将`GlobalStore`类导出，我们将会利用这个类作为`typescript`校验接口来使用([这种用法可以点这里查看详情](https://www.tslang.cn/docs/handbook/classes.html)):

这一步用的是 TypeScript 一个很好用的性质：类声明同时产生一个值和一个类型。`GlobalStore` 这个名字既能 `new`，也能直接当类型标注写在 props 上，不需要再手写一遍同样字段的 interface。store 加了新字段，组件那边自动就知道了。

3. 在`type.d.ts`中引入这个类，然后定义并导出一个全局命名空间(该用法详解点这里)，接着在这个命名空间中把接口导出:

`namespace` 加全局声明这套写法，是当时把类型挂到全局最顺手的方式，写完之后任何文件不用 import 就能直接用 `IGlobalStore`。要提醒一句，这个便利是有代价的，全局类型看不出来源，人多的项目里很容易撞名。TypeScript 官方现在也明确建议新代码用 ES module 组织类型，`namespace` 和三斜线指令主要留给声明文件和历史项目。真需要全局类型，更推荐的写法是在 `.d.ts` 里用 `declare global` 配合 `export {}`，而不是自定义命名空间。

4. 回到`Counter`组件中，将接口改写为如下

> 这里注意需要添加`?`，因为这个属性是从`store`中拿过来的，不填写的话，父组件会报错说没有传这个值。 但是因为添加了`?`，所以这个`globalStore`验证为不一定有，从而在组件中会有如下报错:

这个连锁反应很有意思，值得拆开看。不加 `?`，父组件用 `<Counter />` 会被要求传 `globalStore`，可这个属性明明是注入进来的，父组件没理由知道它。加了 `?`，属性类型变成 `GlobalStore | undefined`，组件内部用 `this.props.globalStore.count` 又会被拦，因为它可能是 `undefined`。两头堵。

> 这个时候我们可以去`tsconfig.json`中将`strictNullChecks`项置为`false`，去掉`null`和`undefined`的检测即可

这是原文给的解法，能解决问题，但代价太大了。关掉 `strictNullChecks` 是全局操作，等于整个项目里所有的空值检查一起放弃，为了一个注入属性把整套安全网撤了不划算。我自己后来的做法是保留 `strictNullChecks`，在组件里加一句非空断言 `this.props.globalStore!.count`，把「我知道这里一定有值」这个判断限制在具体那一行。更彻底的做法是写一个带类型的注入辅助函数，把可选性在那一层消化掉。这块我只在自己的小项目里验证过，大项目上的写法以 mobx-react 官方的 TypeScript 指南为准。

5. 到了这一步我们集成`Mobx`就成功了，并且也针对`store`添加了对应的`typescript`验证:

最后补一条现状。这一节用的是 mobx 4/5 时代的装饰器写法，mobx 6 之后默认不再依赖装饰器，改用 `makeObservable(this)` 或 `makeAutoObservable(this)` 在构造函数里声明，好处是不用碰 `experimentalDecorators` 这个实验性开关。`@observer` 则保留了下来，函数组件版本是 `observer(Component)`。老写法在 mobx 6 里通过额外配置仍可用，具体以 mobx 官方迁移文档为准。

### 3.5 使用react-hot-loader进行热加载


> 这一步主要针对的是`webpack-dev-server`的页面自动刷新功能不能保持数据一直都在，有时候在更新组件代码后需要保持数据不变的场景就会很不方便，所以这个时候就需要用到`react-hot-loader`来进行页面代码变更检测并找到变更部分进行更新，同时保证数据不变

先说清楚这一步在解决什么，因为它和 webpack 自带的热更新很容易混淆。`webpack-dev-server` 的默认行为是整页刷新，页面确实更新了，但组件里的所有状态清零。你正调一个填了一半的表单，改个文案，全没了。`react-hot-loader` 做的是只替换变化的组件、保留组件状态。

1. 首先我们安装它`npm install -D react-hot-loader`
2. 然后我们还要用到它里面的`react-hot-loader/babel`，但是因为我们使用了`awesome-typescript-loader`，所以不需要在根目录添加`.babelrc`文件了，直接进到`build/rules/jsRules.js`中进行配置即可

3. 接着我们去到`Counter`组件中引入`react-hot-loader`中的`hot`方法，直接以装饰器的形式包裹组件

`hot(module)` 需要拿到 `module` 这个 webpack 提供的对象，它是热替换 API 的入口。这也是为什么这个包只在 webpack 环境下才工作。

4. 最后再去`package.json`中，在`dev`命令后面加上`--hot`即可

5. 回到`Counter`组件中做个检测，先增加一些数字，然后在增加字样后面加上几个字符，可以看到页面更新的同时保留了数据

这个验证方式设计得很聪明，一次同时验了两件事：文案更新了说明热替换生效，数字没归零说明状态保住了。少验一个都不能确定它真的在工作。

> 实际上我们在控制台看到输出这个字样就已经成功了

补一句现状。`react-hot-loader` 已经被作者本人标为废弃，继任者是 `react-refresh`，webpack 侧对应 `@pmmmwh/react-refresh-webpack-plugin`，Vite 则是内置的，`@vitejs/plugin-react` 装上就自带。它比老方案更可靠，尤其是对 Hooks 的状态保持处理得好得多。

### 3.6 集成svg-component

> 在前端开发中，`svg`格式的图片使用的是非常频繁的，而集成了`svg-component`后，我们可以将`svg`图片以组件的形式引入并使用

把 svg 变成组件的好处不只是写起来短。当成 `<img>` 用的时候，你没法用 CSS 改它的颜色、没法给内部路径挂事件，图标要几个颜色就得存几份文件。变成内联的 React 组件之后，`fill="currentColor"` 一写，颜色跟着文字走，一份文件通吃所有主题。

1. 要集成`svg-component`我们首先要安装`@svgr/webpack: npm install -D @svgr/webpack`，这是一个`loader`；
2. 然后我们在`build/rules`中新建`fileRules.js`文件，将`svg`格式文件用这个`loader`进行编译

新建 `fileRules.js` 而不是塞进已有的两个文件，是延续 3.1 节按文件类型分模块的思路，以后加图片、字体的 loader 都往这里放。

> 然后在`webpack.config.js`中导入并重启项目

原文这里写的是 `webpack.config.json`，多了个 n，配置文件是 `.js` 不是 `.json`。

3. 接着我们随便找一个`svg`格式图片在`Counter`中引入并测试，虽然可以使用了，但是也导致了一个`typescript`的报错说找不到模块

这个报错和 2.2 节那个 `.scss` 找不到模块是同一个病因，也会是同一个解法。webpack 能处理不代表 TypeScript 认识，这两套系统各看各的。

> 导致这个错误的原因是`svg`图片本身并不具备模块化的功能，也不提供模块导出，所以在导入的时候是不能识别的，要解决这个问题可以模仿我们之前使用`css modules`的方式，给它声明一个模块:我们在`typings`目录下新建`svg.d.ts`文件，并写入如下代码

> 这个时候还可以为`svg-component`的使用提供代码提示和传入属性校验的支持: 我们声明一个接口，然后在声明的模块中用这个接口作为内容

声明写得糙一点（比如直接 `declare module '*.svg'` 然后类型给 `any`）也能消掉红线，但那样就只是把编译器堵住了。把默认导出声明成一个接受 svg 属性的组件类型，才能拿到属性补全和拼写校验，这才是写这份声明真正的收益。

> 这个接口使用的是`react`的无状态组件声明，传入属性则为`svg`文件自带的属性比如`col` or `width`之类的，然后我们就可以愉快地使用`svg-component`了

原文这几处把 `css modules` 写成了 `css moudles`、`svg-component` 写成了 `svg-comonent`，都是笔误，我改过来了。

顺带提一句，`React.SFC` 这个类型名在 React 16.7 之后就被 `React.FunctionComponent`（简写 `React.FC`）取代了，旧名字已经移除。而 React 18 起 `FC` 不再隐式带 `children`，所以现在写这类声明更直接的做法是标 `(props: React.SVGProps<SVGSVGElement>) => JSX.Element`，具体类型名以 `@types/react` 的版本为准。

## 四、项目打包

> 本章节内容

- 添加打包命令
- 进行`css`和`js`分离
- 修改`html-webpack-plugin`配置项
- 添加`react-loadable`和`react-router`,进行代码分离和按需加载
- 添加`optimization`,进行第三方库代码分离
- 进行代码压缩
- 关于`externals`

前面三章都在围着开发体验转，这一章换个视角看问题。开发时怎么方便怎么来，构建慢一点无所谓；上线要看的是另外三个数字：产物有多大、首屏要下载多少、缓存能不能复用。下面每一节都在往这三个数字上使劲。

### 4.1 添加打包命令

> 我们先去`webpack.config.js`中观察一下`output`这个配置项

> 该配置项指定了打包路径和打包后的`js`文件名，在`webpack`的配置项中，`output`是必须有的。 接着我们去到`package.json`中在`script`中添加打包命令`build`，该命令引用我们的`webpack.config.js`配置文件

`build` 和 `dev` 用的是同一份配置文件，区别只在 `--mode production`。webpack 4 的 mode 会自动带上一批生产优化，比如把 `process.env.NODE_ENV` 替换成 `production`（React 靠它切到生产版本，体积和性能差很多）、开启 tree shaking、启用默认压缩。

> 之后试试运行`npm run build`，会发现已经将项目打包出来了

**添加打包路径工具**

> 在上一步中，我们已经知道打包出来的文件位于根目录下的`dist`文件夹中，所以这个路径工具的添加指向`dist`文件夹： 我们去到`build/utils.js`文件中，添加如下代码:

跟 3.1 节抽的那个根目录路径函数是一套思路，只是基准从项目根换成了 `dist`。后面 4.2 节把 css 和 js 分目录存放的时候会用到它。

以后指定打包文件存放路径的时候就可以直接使用这个工具进行指定


### 4.2 分离css文件

> 在上面打包的结果中，我们会发现只有一个`app.js`文件，而实际上我们是有写`css`样式的，但是现在的却并没有这个`css`文件，这是因为`webpack`将所有的资源(包含`js,` `css`等等)都看成是`chunk`，然后一起打包进一个文件中，这样会导致打包出来的`js`文件体积巨大，从而拖累页面的加载速度

体积只是其中一半原因，另一半更要命：样式塞在 js 里，浏览器必须等 js 下载完、执行完才能上样式，中间那段时间用户看到的是没有样式的裸 HTML。css 单独成文件之后，它在 `<head>` 里跟 js 并行下载，样式能更早生效。

1. 在`webpack 4+`版本中，我们可以使用`mini-css-extract-plugin`进行`css`代码的分离，所以首先安装它`npm install -D mini-css-extract-plugin`。
2. 然后我们到`build/plugins.js`中添加这个插件

这一步能直接往 `plugins.js` 里加而不用翻主配置，正是 3.1 节拆分留下的好处。

3. 最后需要注意，之前在提升开发体验这一章中有提到过一点，`style-loader`用于将`css-loader`编译出来的代码转为`js`代码并写入`js`文件中，所以在这里，我们需要用`mini-css-extract-plugin`中的`loader`去替换掉`style-loader`，让它写入单独的`css`文件而不是js文件中:

这个插件必须成对配置，plugin 和 loader 缺一不可，只加插件不换 loader 是不会有任何产出的。这是我当时卡住的地方，看着配置没错就是不出 css 文件，回头才发现 loader 那端还是 `style-loader`。

> 我们去到`build/rules/styleRules.js`中，将原本的`style-loader`全都替换成`mini-css-extract-plugin`的`loader`(这一步可以进行开发环境和生产环境的区分，在文章中不进行区分

括号里那句「可以区分环境」值得展开一下。开发环境其实更适合留着 `style-loader`，因为它注入的样式支持热替换，改 scss 不刷新页面就生效；换成抽取插件之后，样式变成外部文件，热更新体验会差一截。真实项目里一般写成三元判断，按 `mode` 切换。

4. 经过上面的步骤，我们可以打包进行测试: 运行`npm run build`可以发现打包结果中`css`文件已经进行了分离

> 而在打包出来的`index.html`中也可以发现这个`css`文件被引入了

`<link>` 标签是 `html-webpack-plugin` 自动插进去的，跟 1.2 节它插 `<script>` 是同一个机制。这就是当初非要用这个插件而不手写 HTML 的原因。

> 最后我们再在打包路径中将打包出来的`js`文件用`js`文件夹包裹起来即可

产物按类型分目录纯粹是为了 `dist` 目录清爽，做法是在 `output.filename` 里写成 `js/[name].js`，webpack 会自动建目录。分不分不影响功能，但部署到 CDN 或者配 Nginx 缓存规则的时候，按目录设策略会方便很多。


### 4.3 修改`html-webpack-plugin`配置项

> 这一步主要用于压缩打包出来的`index.html`文件，但是单页面应用的话`html`内容其实不多，所以做不做也差不多，在本文章中也只是做个介绍:

原文自己就说了做不做差不多，这个判断我认同，单页应用的 HTML 撑死几十行。放在这里主要是让你知道有这个口子，多页应用或者服务端直出 HTML 的场景才用得上。

1. 首先在`html-webpack-plugin`中利用的是`html-minifier`来做压缩工作的，所以详细配置点击进去看即可，常用的如下

常用的几项无非是去空白、删注释、折叠布尔属性。有一项要当心，`removeAttributeQuotes` 去掉属性引号在大多数场景没事，但属性值里带空格或特殊字符时会出问题，模板里有动态占位符的话建议关掉。

2. 第二个需要提一下则是`inject`这个配置项，该项指定资源如何注入，我们直接使用默认的`true`即可，他会将`js`资源注入到`<body>`标签的底部，如果要注入到头部填写`head`即可

默认放 body 底部是有道理的：脚本在解析到那里之前不会阻塞 HTML 渲染，而且 `document.querySelector('#app')` 执行的时候容器已经在文档里了。放 head 的话，脚本跑得比容器出现还早，React 会挂载到一个 `null` 上。

### 4.4 代码分离和按需加载

> 这一步和下一步都是在进行代码的拆分，考虑的是如果所有文件都塞进一个`js`文件中，会导致这个`js`文件体积臃肿，而单页面应用的所有构建又是依赖于这个`js`文件，所以需要进行代码分离，只加载当前页面需要构建的`js`文件。通常来说，我们会根据`react-router`分的页面来进行代码分离，再用`react-loadable`进行分割出来的代码的异步加载(当然你也可以将所有组件都进行代码分离然后异步加载)。所以在这里我们先利用`react-router`分两个页面home和page出来

按路由拆分是个很好的默认策略，因为路由天然就是「用户当前需要什么」的边界。用户停在首页，后台管理那十几个页面的代码他一行都用不上，凭什么要下载。这也是为什么不建议一上来就把每个组件都拆开，拆太细的话请求数暴涨，反而更慢。

1. 首先我们安装`react-router: npm install -S react-router-dom`，然后在`src/containers/views`中新建`Home`和`Page`组件

2. 接着安装`react-loadable: npm install -S react-loadable`, 然后在`src/containers/shared`中新建`App`组件

`App` 放在 `shared` 而不是 `views`，是因为它是路由容器，属于可复用的业务外壳，不对应具体某一个页面。这跟 3.4 节定的目录规则是对得上的。

> 之后在里面的`index.tsx`中引用`react-router`和`react-loadable`进行组件按需加载: 当然不要忘了使用`react-hot-loader`

真正触发代码分割的是 `Loadable` 里那个 `import('./Home')` 动态导入。webpack 看到动态 `import` 就会把它和它的依赖单独打成一个 chunk，这就是为什么 1.2 节非要把 `tsconfig` 的 `module` 设成 `esnext`，设成 `commonjs` 的话这行早就被编译成 `require` 了，webpack 根本认不出来。

> 这一步需要注意的是，`Loadable`这个函数中的`loading`参数是必须有的，至于如何使用可以自行参考`react-loadable`的`github`链接

`loading` 必填不是作者故意刁难。异步加载意味着从点击到组件出现之间一定有空档，网络慢的时候能有好几秒，这段时间总得给用户点东西看。顺带一提，这个参数也是错误兜底的地方，加载失败时它会收到 `error`，别只写个「加载中」就完事。

3. 这个时候去到页面看一下：在`/`路径下，没有加载`page.js`这个文件，而切换到`/page`路径则会加载`page.js`文件，这个时候按需加载就完成了:

验证方式就是开 Network 面板看请求时机，切路由的瞬间才出现的那个 js 请求就是懒加载的 chunk。这比看打包结果直观得多。

4. 最后我们观察一下打包后的`js`文件可以发现已经进行了分离

补一句现状。`react-loadable` 已经不再维护，React 16.6 之后官方内置了 `React.lazy` 加 `<Suspense>`，能覆盖这里的绝大部分场景，`loading` 参数对应的就是 `Suspense` 的 `fallback`。需要服务端渲染或者更细的加载状态控制时，社区常用 `@loadable/component`。新项目直接用官方那套就够了。

### 4.5 添加`optimization`

> `optimization`是`webpack4+`版本中新出的配置项，这个配置项的功能主要是进行代码压缩，优化。在本节中，我们需要将用到的处于`node_modules`中的第三方代码进行分离，在这里主要用到的是两个配置项`optimization.runtimeChunk`和`optimization.splitChunks`，其中`runtimeChunk`用于生成维系各个代码块关系的代码，`splitChunks`则用于指定需要进行分块的代码，和分块后文件名

把第三方库单独抽出来，图的是缓存命中率。`react`、`react-dom`、`antd` 这些东西一个季度可能都不动一次，而你自己的业务代码天天发版。混在一起打包的话，改一行文案就让用户重新下载几百 K 的 React。拆开之后，`vendor.js` 的 hash 不变，浏览器直接走缓存。

`runtimeChunk` 也是为这个服务的。webpack 需要一小段运行时代码来记录「哪个 chunk 对应哪个文件」，这段代码里含有各个 chunk 的 hash，不单独抽出来的话，它会被塞进 `vendor.js`，结果就是你每改一次业务代码，`vendor.js` 的内容跟着变，缓存又白费了。

1. 我们去到`build`目录下，新建`optimization.js`，并添加如下代码

`splitChunks.cacheGroups` 里用 `test: /node_modules/` 匹配，命中的模块全部归到一个叫 `vendor` 的组里。要更细的话可以再拆一组把 antd 单独放，取决于你的依赖有多大。

> 然后在`webpack.config.js`中引入这个配置

2. 最后我们打包试试看可以发现第三方代码都被打包进`vendor.js`文件中了

> 你可以通过比对在添加`optimization`之前和之后打包出来的`app.js`文件来看出效果

对比 `app.js` 的体积是最直观的验证，抽走第三方库之后它通常只剩几十 K。想看得更清楚可以装 `webpack-bundle-analyzer`，它会画一张方块图，哪个包占了多少一目了然，比数字有说服力得多。

### 4.6 代码压缩


> 我们主要是做`js`和`css`的代码压缩和优化

1. 在上面阶段中，我们打包出来的`js`代码是已经经过压缩的

这一句很关键，容易被跳过。webpack 4 在 `production` 模式下已经默认挂了压缩，所以下面这一节做的不是「从无到有加压缩」，而是「换掉默认的、加些自定义选项」，比如去掉 `console.log`、调整注释保留策略。搞不清这一点的话，很容易以为不配这段就没有压缩。

> 所以在这个阶段我们可以利用`uglifyjs-webpack-plugin`进行一些压缩优化:
首先我们需要安装`npm install -D uglifyjs-webpack-plugin`，然后去到`build/optimization.js`中添加如下代码即可，具体的优化见代码

注意它要放进 `optimization.minimizer` 数组，一旦你自己指定了 minimizer，webpack 的默认压缩器就被整个替换掉了，所有想要的选项都得自己写全。

> PS: 这里有一个点需要注意，在`uglifyjs-webpack-plugin`这个插件中，如果是`2.x`版本的话是不支持`es6`规范的，所以建议安装`1.x`版本，而我这里的版本是:

这个版本坑背后的原因值得说一下。UglifyJS 的解析器本身不认识 ES6+ 语法，而 1.2 节我们把 `target` 改成了 `es6`，产物里满是箭头函数和 `class`，压缩器一读就报语法错。这就是当年很多人「一改 target 就打包失败」的根源。

也正因为这个问题，社区后来整体转向了 `terser`，它是 UglifyJS 的 fork，原生支持 ES6+。webpack 5 已经把 `terser-webpack-plugin` 作为内置默认压缩器，`uglifyjs-webpack-plugin` 不再需要，新项目不要再装它了。

2. 然后我们进行`css`代码的压缩，这里需要使用到`optimize-css-assets-webpack-plugin`插件:`npm install -D optimize-css-assets-webpack-plugin`。
我们先去`Home`组件中随意添加一个样式并使用它

先写点样式再压缩，是为了有东西可看。css 太少的话压缩前后没什么差别，验证不出效果。

> 然后再去到`build/optimization.js`添加如下代码:

> 具体的插件使用方式可以自行上`github`查看该插件。 最后查看打包出来后的`css`代码:

打开产物 css 应该是挤成一行、没有空格和注释的。这个插件底层用的是 cssnano，除了去空白它还会做属性合并、颜色值简写这类优化。

同样有个现状要提：这个插件在 webpack 5 时代的替代品是 `css-minimizer-webpack-plugin`，配置方式几乎一样，具体以各自仓库文档为准。

> 到现在压缩代码步骤也做完了，最后将介绍一下`webpack.externals`这个选项

### 4.7 关于`externals`

> `webpack.externals`配置项用于在构建过程中忽略一些常用包的集成，从而降低构建时间和打包后的包大小，它的配置也很简单，在本章中只做简单介绍:在本项目中，我们可以将`react`和`react-dom`添加进`externals`中，然后在`html`模板中引入它们的外部链接:

1. 我们先去到`webpack.config.js`中，添加`externals`选项，并且把`react`和`react-dom`添加进去

> 这个配置项接收的是一个对象(其他形式请自行查阅`webpack`文档)，对象的键是指`webapck`在获取这个模块时候`require`时候的参数，而对应的值则是标明你打算将这个模块挂载的变量名，这里是挂载在`window`对象中的

理解 `externals` 的关键就在这个键值对上。键是你代码里写的模块名（`'react'`），值是运行时去哪个全局变量上取（`'React'`）。配了之后 webpack 遇到 `import React from 'react'` 不会去 `node_modules` 里找，而是直接编译成读 `window.React`。所以这两个名字必须跟 CDN 那个包实际挂的全局变量对得上，写错了就是运行时 `undefined`。

2. 去到`build/tpl/index.html`中，引入`cdn`中`react`和`react-dom`的链接

顺序很重要，这两个 `<script>` 必须在打包产物之前加载，否则业务代码执行时全局变量还不存在。另外记得区分开发和生产版本的 CDN 地址，开发版带完整警告信息，体积大好几倍，别把它带上线。

3. 重启项目，可以发现在`npm run dev`中能够正常使用，并且也已经引入了两者的外部资源

4. 最后我们来对比一下打包后模块占用情况

> 再来对比一下两者打包出来的包体积大小

体积确实降下来了，但这里有个权衡得说清楚，不然容易用错。`externals` 把包从你的产物里挪到了 CDN，用户的总下载量并没有变少，变的是「从哪下」和「能不能复用缓存」。它真正划算的场景有两个：一是团队里多个项目共用同一个 CDN 版本，用户逛完 A 站再去 B 站能直接命中缓存；二是要在多个入口之间共享同一份基础库。

代价也是实打实的。多一个第三方域名意味着多一次 DNS 和 TCP 握手，CDN 挂了整站白屏，版本升级要手动改 HTML 而不是改 `package.json`。我自己的判断是，没有明确的复用场景就别配，4.5 节那个 `vendor.js` 拆分已经能拿到大部分缓存收益，风险还小得多。不是说 `externals` 不行，而是它解决的问题比看上去要窄。





## 五、团队规范

前面四章做的都是「让代码能跑、跑得快」，这一章解决的是另一类问题：人多了之后代码风格散掉。一个人写项目怎么都行，三个人以上就必须有机器来当裁判，靠 code review 里说「这里少个分号」是撑不住的。

> 这篇文章的每一步都基于`vscode`这款编辑器，如果你使用的不是`vscode`，那么就需要自行集成相关插件及其配置。该文章只是简单介绍各个代码检测的流程，至于配置项则需要读者自行前往对应的`lint`官网自己查看、配置需要的。

**在这块中我们需要做的如下**:

- 使用`tslint`做代码检测
- 使用`stylelint`做代码检测
- 添加`npm script`进行检测
- 使用`prettier`进行代码格式化
- 使用`pre-commit`

这五步之间是有递进关系的，前两步定规则，第三步让规则能在命令行跑（CI 才用得上），第四步让违规能自动修，第五步把它卡在提交这道关口上。少了最后一步，前面全靠自觉。

### 5.1 使用tslint进行代码检测

> 我们的项目因为大量使用`typescript`，所以使用的是`tslint`检测工具，如果在你的项目中没有用到`typescript`，那么请使用`eslint`

这个建议在 2018 年是对的，现在得整段更新了。TSLint 已经于 2019 年由 Palantir 官方宣布停止维护，规则不再更新，整个生态迁到了 `typescript-eslint`，也就是让 ESLint 通过一个 TypeScript 解析器来检查 `.ts` / `.tsx`。现在新项目应该直接装 `eslint` 加 `typescript-eslint`，`tslint` 和 `tslint-react` 这两个包不要再引了。官方还提供过 `tslint-to-eslint-config` 这类迁移工具，具体以 typescript-eslint 官网为准。

下面的原始步骤我保留着，因为思路是通用的：装插件看实时提示、写配置文件定规则、跑命令行做批量检查，换成 ESLint 之后每一步都能对上号。

1. 首先我们需要在`vscode`中安装插件:

编辑器插件和命令行工具是两回事，插件负责在你敲代码的时候画红线，命令行负责在 CI 上批量检查。两个都得有，只装插件的话，没装插件的同事写的代码照样能进仓库。

> 然后在项目中安装`npm install -D tslint`。此外，因为我们有大量的`.tsx`文件，所以还需要`npm install -D tslint-react`来指定针对`.tsx`语法的限制

2. 接着在根目录下新建`tslint.json`文件，该文件用于写`tslint`配置文件:

原文这里把文件名写成了 `tsling.json`，少了个 t，文件名写错的表现是配置完全不生效而且不报错，特别难查。

3. 在`tslint.json`中写入配置，配置项参考请[点击这里](https://palantir.github.io/tslint/rules/)

> 这份配置项中，上面的`extends`是指`tslint`的扩展，第一个扩展是稳定且常规的`tslint`检测标准，第二个则是针对`.tsx`文件做的检测

`extends` 的意思是「先继承一整套现成规则，再在下面按需覆盖」。我的建议是尽量少覆盖，团队里为了某条规则争论半天的时间成本，比顺从默认规则高得多。

4. 测试一下是否生效: 我们将`no-console`改为`true`测试一下

> 然后在组件中写一个`console.log`就可以知道这份配置表已经生效

用一条自己能主动触发的规则来验证，比对着文档瞎猜靠谱得多。这个验证习惯在配任何 lint 工具时都适用。

### 5.2 使用`stylelint`做代码检测

1. 首先，在`vscode`安装`stylelint`这个插件，该插件可以对`css`、`less`、`scss`等类型的样式表代码进行格式和样式书写顺序上的检测:

```
npm install -D stylelint
```




2. 我们在根目录下创建`.stylelintrc.js`文件，然后安装官方推荐的配置`stylelint-config-standard`以及针对`scss`代码类型检测的插件`stylelint-scss`:

```bash
npm install -D stylelint-config-standard stylelint-scss
```

3. 然后在`.stylelintrc.js`文件中写入配置项

用 `.js` 而不是 `.json` 当配置文件，好处是能写注释和条件逻辑，规则一多这点很值钱。

4. 但是这时候针对`scss`代码的检测还是有问题的，它不能识别`scss`中例如`@mixin`、`@include`之类的语法:

这个坑几乎人人都会踩。`stylelint-config-standard` 是按标准 CSS 写的，它认识的 at-rule 就 `@media`、`@import` 那几个，`@mixin`、`@include`、`@extend` 在它眼里都是「未知规则」，一片报错。

所以还需要手动写一些规则覆盖掉针对这类语法的检测使其不报错:

具体做法是把 `at-rule-no-unknown` 这条关掉，改用 `stylelint-scss` 提供的 `scss/at-rule-no-unknown`，后者认识 sass 的全套语法。现在更省事的做法是直接 extends `stylelint-config-standard-scss`，这套预设已经把 scss 相关的替换规则都配好了。

### 5.3 添加`npm script`进行检测

> 这一步主要利用`tslint`和`stylelint`附带的命令行命令检测项目中存在的代码规范问题，然后输出到终端查看

编辑器里的红线只有打开那个文件才看得到，命令行检查才能一次性扫全项目，也是接入 CI 的唯一方式。

1. 去到`package.json`中，在`scripts`中添加如下命令

> 这条命令既检查`.tsx`文件也检查`.scss`文件

建议再单独加一条带 `--fix` 的命令。样式顺序、引号、分号这类问题工具能自动改，人去手动改纯属浪费时间，只把真正需要人判断的问题留给自己。

2. 然后再终端中输入一次，就能看到报错如下

然后定位到文件中去修改即可

### 5.4 使用`prettier`进行代码格式化

> 除了上一节中手动定位并修改不规范的代码外，我们还可以依赖于`vscode`的插件来进行符合我们规范的代码格式化，这个插件推荐使用`prettier`

prettier 和 lint 工具的分工要先分清楚，不然配置会打架。prettier 只管排版，缩进、换行、引号、分号，它不理解代码含义；lint 管的是代码质量，比如变量没用到、用了 `any`、写了 `console.log`。两者职责重叠的部分（比如引号风格）容易互相覆盖，社区的解法是装 `eslint-config-prettier` 把 lint 那边的排版类规则整个关掉，格式统一交给 prettier。

1. 首先在`vscode`中安装这个插件

2. 然后去到用户设置表中,进到工作区设置进行配置，下图是该模板的配置，当然你也可以自行配置需要的设置

配到工作区（也就是项目里的 `.vscode/settings.json`）而不是用户设置，这一点很重要。配到用户设置只对你自己生效，别人拉下代码还是各写各的；提交到仓库里的工作区配置才是团队共享的。

3. 回到刚才错误的地方，只要我们一保存就会自动格式化成正确的

保存即格式化这个开关（`editor.formatOnSave`）是我觉得性价比最高的一项，装完之后基本不用再想排版这件事。

### 5.5 使用`pre-commit`

> 在前面的篇幅中，我们有将`lint`命令添加进`npm script`中，但是这个命令如果要自己去运行我想很多人都会忘记，结果就会导致可能有不符合规范的代码被上传到远端代码仓库中。这种情况下我们可以做`pre-commit`进行代码强制检测，也就是在`git commit`之前进行一次代码检测，不符合规范不让`commit`。
实现这个功能我们可以安装`husky`这个插件`npm install -D husky`，然后在`npm script`中添加命令就好了

这一步才是整章的收口。前面四步都依赖自觉，只有钩子是机器强制的。

有个实践经验值得补上：pre-commit 里别直接跑全量 lint，项目大了之后每次提交等十几秒，同事会开始习惯性加 `--no-verify` 绕过去，那这道关口就形同虚设了。正确做法是配合 `lint-staged`，只检查本次暂存的文件，通常一两秒就跑完。

另外 husky 从 4 升到 7 之后配置方式变了，不再写在 `package.json` 的 `husky` 字段里，改成在 `.husky/` 目录下放 shell 脚本，`npx husky init` 会帮你生成。老写法在新版本上是不生效的，升级的时候要注意，具体以 husky 官方文档为准。

## 六、代码

上面所有配置拼起来就是下面这个仓库，包含完整的 `build` 目录、`tsconfig.json` 和各类 lint 配置，拿下来 `npm install` 就能跑。

> 完整代码示例  https://github.com/poetries/ts-react-tpl

## 总结

这一套配下来，最值得留下的其实不是某一份配置文件，而是几个反复出现的判断方式。

第一个是「webpack 处理和 TypeScript 理解是两回事」。`.scss` 找不到模块、`.svg` 找不到模块、路径别名要配两遍，这三个坑长得完全不一样，病根却是同一个：webpack 在打包链路上把事办成了，TypeScript 在类型链路上一无所知。遇到这类报错，先问一句「这是谁在报错」，答案往往就出来了。

第二个是每一项优化都在换东西，没有白拿的。构建缓存拿首次变慢换后续变快，`externals` 拿一个额外域名和运维风险换体积，css 分离拿多一个请求换更早的样式生效，代码分割拿请求数换首屏体积。配之前先想清楚你换的是什么，比照抄配置重要得多。

第三个是配置文件本身也是代码，也需要重构。第三章那次拆分没有带来任何新功能，但它决定了后面两章能不能顺畅地往里加东西。我见过太多项目的 webpack 配置最后变成没人敢动的三百行，起因都是「先堆着，回头再说」。

至于时效性，这篇文章里被时间淘汰的东西是最多的：`awesome-typescript-loader`、`node-sass`、`typings-for-css-modules-loader`、`cache-loader`、`react-hot-loader`、`react-loadable`、`uglifyjs-webpack-plugin`、`tslint`，这一串现在都有了更好的替代品，webpack 5 和 Vite 还把其中一部分变成了内置能力。但这些包当初为什么会存在、它们各自堵的是哪个窟窿，这些理由并没有过期。理解了窟窿在哪，换成新工具你照样知道该配什么。

如果你正准备起一个新项目，我的建议是直接用 Vite，别照抄这份配置。这篇更适合用来读懂你手上那个跑了好几年、没人敢动的老 webpack 项目。

## 参考

- [webpack 官方文档](https://webpack.js.org/concepts/)
- [TypeScript tsconfig 参考](https://www.typescriptlang.org/tsconfig)
- [Vite 官方文档](https://cn.vitejs.dev/)
- [antd 定制主题](https://ant.design/docs/react/customize-theme-cn)
- [MobX 官方文档](https://mobx.js.org/README.html)
- [stylelint 官方文档](https://stylelint.io/)
- [typescript-eslint 官网](https://typescript-eslint.io/)
- [husky 官方文档](https://typicode.github.io/husky/)
- [本文配套模板仓库 ts-react-tpl](https://github.com/poetries/ts-react-tpl)
- [Typescript基础及结合React实践(一)](https://feinterview.poetries.top/blog/ts-intro-and-use-in-react)
- [Typescript总结篇（二）](https://feinterview.poetries.top/blog/ts-summary)
- [Typescript实践总结 从基础类型到工程化与项目实战](https://feinterview.poetries.top/blog/ts-in-action)
- [TypeScript 中 interface 和 type 的区别](https://feinterview.poetries.top/blog/ts-interface-type)
- [前端进阶之旅](https://interview.poetries.top)
