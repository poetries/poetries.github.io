---
title: webpack学习总结(二)
date: 2017-01-14 17:40:43
tags: webpack
categories: Build
---

> 声明 本教程整理于互联网

> `webpack`是当下最热门的前端资源模块化管理和打包工具。它可以将许多松散的模块按照依赖和规则打包成符合生产环境部署的前端资源。还可以将按需加载的模块进行代码分隔，到实际需要的时候再异步加载。通过 `loader` 的转换，任何形式的资源都可以视作模块，比如` CommonJs `模块、 `AMD` 模块、 `ES6` 模块、`CSS`、图片、 `JSON`、`Coffeescript`、 LESS等


## 一、模块系统的演进
---

- 模块系统主要解决模块的定义、依赖和导出，先来看看已经存在的模块系统

- `<script>`标签

```
<script src="module1.js"></script>
<script src="module2.js"></script>
<script src="libraryA.js"></script>
<script src="module3.js"></script>
```

- 这是最原始的 `JavaScript` 文件加载方式，如果把每一个文件看做是一个模块，那么他们的接口通常是暴露在全局作用域下，也就是定义在 `window` 对象中，不同模块的接口调用都是一个作用域中，一些复杂的框架，会使用命名空间的概念来组织这些模块的接口，典型的例子如 `YUI` 库

- 这种原始的加载方式暴露了一些显而易见的弊端
  - 全局作用域下容易造成变量冲突
  - 文件只能按照 `<script> `的书写顺序进行加载
  - 开发人员必须主观解决模块和代码库的依赖关系
  - 在大型项目中各种资源难以管理，长期积累的问题导致代码库混乱不堪

### 1.1 CommonJS
---

- 服务器端的 `Node.js `遵循 `CommonJS`规范，该规范的核心思想是允许模块通过` require `方法来同步加载所要依赖的其他模块，然后通过 `exports` 或 `module.exports` 来导出需要暴露的接口

```
require("module");
require("../file.js");
exports.doStuff = function() {};
module.exports = someValue;
```

- 优点：
  - 服务器端模块便于重用
  - `NPM` 中已经有将近`20`万个可以使用模块包
  - 简单并容易使用
- 缺点：
  - 同步的模块加载方式不适合在浏览器环境中，同步意味着阻塞加载，浏览器资源是异步加载的
  - 不能非阻塞的并行加载多个模块

- 实现
 - 服务器端的 `Node.js`
 - `Browserify`，浏览器端的 `CommonJS` 实现，可以使用 `NPM `的模块，但是编译打包后的文件体积可能很大
 - `modules-webmake`，类似`Browserify`，还不如 `Browserify` 灵活
 - `wreq`，`Browserify `的前身

### 1.2 AMD
---

>`Asynchronous Module Definition` 规范其实只有一个主要接口`define(id?, dependencies?,factory)` ，它要在声明模块的时候指定所有的依赖 `dependencies `，并且还要当做形参传到`factory` 中，对于依赖的模块提前执行，依赖前置

```
define("module", ["dep1", "dep2"], function(d1, d2) {
return someExportedValue;
});require(["module", "../file"], function(module, file) { /* ... */ });
```

- 优点：
  - 适合在浏览器环境中异步加载模块
  - 可以并行加载多个模块

- 缺点：
  - 提高了开发成本，代码的阅读和书写比较困难，模块定义方式的语义 不顺畅
  - 不符合通用的模块化思维方式，是一种妥协的实现

- 实现：
  - `RequireJS`
  - `curl`

### 1.3 CMD
---

- `Common Module Definition` 规范和 `AMD `很相似，尽量保持简单，并与 `CommonJS` 和`Node.js` 的 `Modules `规范保持了很大的兼容性

```
define(function(require, exports, module) {
var $ = require('jquery');
var Spinning = require('./spinning');
exports.doSomething = ...
module.exports = ...
})
```

- 优点：
  - 依赖就近，延迟执行
  - 可以很容易在 `Node.js` 中运行
- 缺点：
  - 依赖 `SPM` 打包，模块的加载逻辑偏重
- 实现：
  - `Sea.js`
  - `coolie`

### 1.4 ES6 模块
---

- `EcmaScript6` 标准增加了 `JavaScript `语言层面的模块体系定义。`ES6` 模块的设计思想，是尽量的静态化，使得编译时就能确定模块的依赖关系，以及输入和输出的变量。`CommonJS` 和`AMD` 模块，都只能在运行时确定这些东西

```
import "jquery";
export function doStuff() {}
module "localModule" {}
```

- 优点：
  - 容易进行静态分析
  - 面向未来的 `EcmaScript`标准
- 缺点：
  - 原生浏览器端还没有实现该标准
  - 全新的命令字，新版的 `Node.js`才支持
- 实现：
  - `Babel`

### 1.5 前端模块加载
---

- 前端模块要在客户端中执行，所以他们需要增量加载到浏览器中
- 模块的加载和传输，我们首先能想到两种极端的方式，一种是每个模块文件都单独请求，另一种是把所有模块打包成一个文件然后只请求一次。显而易见，每个模块都发起单独的请求造成了请求次数过多，导致应用启动速度慢；一次请求加载所有模块导致流量浪费、初始化过程慢。这两种方式都不是好的解决方案，它们过于简单粗暴
-  分块传输，按需进行懒加载，在实际用到某些模块的时候再增量更新，才是较为合理的模块加载方案
- 要实现模块的按需加载，就需要一个对整个代码库中的模块进行静态分析、编译打包的过
程

### 1.6 所有资源都是模块
---

> 在上面的分析过程中，我们提到的模块仅仅是指`JavaScript`模块文件。然而，在前端开发过程中还涉及到样式、图片、字体、`HTML` 模板等等众多的资源。这些资源还会以各种方言的形式存在，比如 `coffeescript`、 `less`、 `sass`、众多的模板库、多语言系统（`i18n`）等

- 如果他们都可以视作模块，并且都可以通过 `require` 的方式来加载，将带来优雅的开发体验，比如

```
require("./style.css");
require("./style.less");
require("./template.jade");
require("./image.png");
```

- 那么如何做到让 `require` 能加载各种资源呢？

### 1.7 静态分析
---

> 在编译的时候，要对整个代码进行静态分析，分析出各个模块的类型和它们依赖关系，然后将不同类型的模块提交给适配的加载器来处理。比如一个用` LESS` 写的样式模块，可以先用`LESS` 加载器将它转成一个`CSS `模块，在通过 `CSS` 模块把他插入到页面的 `<style>` 标签中执行。`Webpack `就是在这样的需求中应运而生


## 二、webpack基础知识
---

### 2.1 什么是 Webpack
---

- `Webpack` 是一个模块打包器。它将根据模块的依赖关系进行静态分析，然后将这些模块按照指定的规则生成对应的静态资源

### 2.2  Webpack 的特点
---

- 代码拆分
  - `Webpack `有两种组织模块依赖的方式，同步和异步。异步依赖作为分割点，形成一个新的块。在优化了依赖树后，每一个异步区块都作为一个文件被打包

- Loader
  - `Webpack` 本身只能处理原生的 `JavaScript` 模块，但是 `loader` 转换器可以将各种类型的资源转换成 `JavaScript` 模块。这样，任何资源都可以成为 `Webpack `可以处理的模块
- 智能解析
  - `Webpack` 有一个智能解析器，几乎可以处理任何第三方库，无论它们的模块形式是`CommonJS`、 `AMD `还是普通的 `JS` 文件。甚至在加载依赖的时候，允许使用动态表达式``require("./templates/" + name + ".jade") ``
- 插件系统
  - `Webpack` 还有一个功能丰富的插件系统。大多数内容功能都是基于这个插件系统运行的，还可以开发和使用开源的 `Webpack` 插件，来满足各式各样的需求
- 快速运行
  - `Webpack` 使用异步 `I/O` 和多级缓存提高运行效率，这使得 `Webpack `能够以令人难以置信的速度快速增量编译

### 2.3 总览
---

- 他的目的就是把有依赖关系的各种文件打包成一系列的静
态资源
- `webpack`简单点来说就就是一个配置文件，所有的魔力都是在这一个文件中发生的。 这个配置文件主要分
为三大块
  - `entry` 入口文件 让`webpack`用哪个文件作为项目的入口
  - `output` 出口 让`webpack`把处理完成的文件放在哪里
  - `module` 模块 要用什么不同的模块来处理各种类型的文件

![](https://poetries1.gitee.io/img-repo/2019/10/661.png)

### 2.4 安装
---

- 先装好node和npm，因为webpack是一个基于node的项目。然后

```
npm install -g webpack
```

- 此时 `Webpack `已经安装到了全局环境下，可以通过命令行` webpack -h` 试试
- 通常我们会将 `Webpack `安装到项目的依赖中，这样就可以使用项目本地版本的 `Webpack`

```
# 进入项目目录
# 确定已经有 package.json，没有就通过 npm init 创建
# 安装 webpack 依赖
$ npm install webpack --save-dev
```

> `Webpack` 目前有两个主版本，一个是在 master 主干的稳定版，一个是在 `webpack-2` 分支的测试版，测试版拥有一些实验性功能并且和稳定版不兼容，在正式项目中应该使用稳定版

```
# 查看 webpack 版本信息
$ npm info webpack
# 安装指定版本的 webpack
$ npm install webpack@1.12.x --save-dev
```

- 如果需要使用 `Webpack `开发工具，要单独安装

```
$ npm install webpack-dev-server --save-dev
```

### 2.5  建立一个项目
---

```
mkdir webpack
cd webpack
npm init
```

- 如果你使用git管理你的这个项目的话，建议你新建一个`.gitignore`文件，不要让`git`提交一些`node`依赖的模
块
- 创建一个静态页面 `index.html` 和一个 `JS` 入口文件 `entry.js：`

```html
<!-- index.html -->
<html>
<head>
<meta charset="utf-8">
</head>
<body>
<script src="bundle.js"></script>
</body>
</html>
```

```javascript
// entry.js
document.write('It works.')
```

- 然后编译 `entry.js` 并打包到 `bundle.js`：

```
$ webpack entry.js bundle.js
```

- 打包过程会显示日志：

```
Hash: e964f90ec65eb2c29bb9
Version: webpack 1.12.2
Time: 54ms
Asset Size Chunks Chunk Names
bundle.js 1.42 kB 0 [emitted] main
[0] ./entry.js 27 bytes {0} [built]
```

- 用浏览器打开 `index.html` 将会看到 `It works. `
- 接下来添加一个模块 `module.js `并修改入口 `entry.js `：

```
// module.js
module.exports = 'It works from module.js.'
```

```
// entry.js
document.write('It works.')
document.write(require('./module.js')) // 添加模块
```

- 重新打包 `webpack entry.js bundle.js `后刷新页面看到变化 `It works.It works from module.js.`

- `Webpack` 会分析入口文件，解析包含依赖关系的各个文件。这些文件（模块）都打包到`bundle.js` 。`Webpack` 会给每个模块分配一个唯一的` id `并通过这个` id` 索引和访问模块。在页面启动时，会先执`entry.js` 中的代码，其它模块会在运行` require `的时候再执行

## 三、Loader
---

- `Webpack` 本身只能处理 `JavaScript` 模块，如果要处理其他类型的文件，就需要使用 `loader`进行转换
- `Loader` 可以理解为是模块和资源的转换器，它本身是一个函数，接受源文件作为参数，返回转换的结果。这样，我们就可以通过 require 来加载任何类型的模块或文件，比如CoffeeScript、 JSX、 LESS 

### 3.1  loader 有哪些特性
---

- `Loader` 可以通过管道方式链式调用，每个 `loader` 可以把资源转换成任意格式并传递给下一个 `loader` ，但是最后一个 `loader` 必须返回 `JavaScript`
- `Loader `可以同步或异步执行。
- `Loader` 运行在 `node.js` 环境中，所以可以做任何可能的事情。
- `Loader` 可以接受参数，以此来传递配置项给 `loader`。
- `Loader` 可以通过文件扩展名（或正则表达式）绑定给不同类型的文件。
- `Loader `可以通过 `npm `发布和安装。
- 除了通过 `package.json `的 `main `指定，通常的模块也可以导出一个 `loader `来使用。
- `Loader` 可以访问配置。
- 插件可以让 `loader` 拥有更多特性。
- `Loader `可以分发出附加的任意文件

>- `Loader`本身也是运行在 `node.js` 环境中的 `JavaScript `模块，它通常会返回一个函数。大多数情况下，我们通过 npm 来管理 `loader`，但是你也可以在项目中自己写 `loader` 模块
- 按照惯例，而非必须，`loader` 一般以 `xxx-loader` 的方式命名， `xxx` 代表了这个 `loader `要做的转换功能，比如 `json-loader `
- 在引用 `loader` 的时候可以使用全名 `json-loader` ，或者使用短名 `json `。这个命名规则和搜索优先级顺序在` webpack` 的`resolveLoader.moduleTemplates api `中定义

```
Default: ["*-webpack-loader", "*-web-loader", "*-loader", "*"]
```
- `Loader `可以在 `require() `引用模块的时候添加，也可以在 `webpack` 全局配置中进行绑定，还可以通过命令行的方式使用
- 我们要在页面中引入一个` CSS `文件` style.css`，首页将 `style.css `也看成是一个模块，然后用 `css-loader` 来读取它，再用` style-loader `把它插入到页面中

```
/* style.css */
body { 
  background: yellow; 
}
```

修改 entry.js：

```
require("!style!css!./style.css") // 载入 style.css
document.write('It works.')
document.write(require('./module.js'))
```

安装 loader：

```
npm install css-loader style-loader
```

重新编译打包，刷新页面，就可以看到黄色的页面背景了

> 如果每次   require CSS   文件的时候都要写   loader   前缀，是一件很繁琐的事情。我们可以根据模块类型（扩展名）来自动绑定需要的   loader  

- 将   `entry.js `  中的 `require("!style!css!./style.css") `修改为 `require("./style.css") `，然后执行：

```
$ webpack entry.js bundle.js --module-bind 'css=style!css'
# 有些环境下可能需要使用双引号
$ webpack entry.js bundle.js --module-bind "css=style!css"
```
- 显然，这两种使用 `loader` 的方式，效果是一样的

## 四、配置webpack
---

> `Webpack`在执行的时候，除了在命令行传入参数，还可以通过指定的配置文件来执行。默认情况下，会搜索当前目`webpack.config.js` 文件，这个文件是一个 `node.js `模块，返回一个` json` 格式的配置信息对象，或者通过 `--config` 选项来指定配置文件

- 现在开始配置`webpack`，目标是把这两个`js`文件合并成一个文件. 我们可以自己在`build`文件夹里面手动建一个`index.html`文件夹，然后再把合并以后的`js`引用在里面，但是这样有些麻烦，所以我们这里安装一个`plugin`，可以自动快速的帮我们生成`HTML`

- 创建一个配置文件 `webpack.config.js`

```
var webpack = require('webpack')
module.exports = {
entry: './entry.js',
output: {
path: __dirname,
filename: 'bundle.js'
},
module: {
loaders: [
{test: /\.css$/, loader: 'style!css'}
]
}
}
```
- 同时简化 `entry.js` 中的 `style.css` 加载方式
- `require('./style.css')`
- 最后运行 `webpack` ，可以看到 `webpack` 通过配置文件执行的结果和通过命令行`webpack entry.js bundle.js --module-bind 'css=style!css' `执行的结果是一样的


```
npm install html-webpack-plugin --save-dev
```

- 有了这个插件 开始写`config`文件

```
var path = require('path');
var HtmlwebpackPlugin = require('html-webpack-plugin');
//定义了一些文件夹的路径
var ROOT_PATH = path.resolve(__dirname);
var APP_PATH = path.resolve(ROOT_PATH, 'app');
var BUILD_PATH = path.resolve(ROOT_PATH, 'build');
module.exports = {
//项目的文件夹 可以直接用文件夹名称 默认会找index.js 也可以确定是哪个文件名字
entry: APP_PATH,
//输出的文件名 合并以后的js会命名为bundle.js
output: {
path: BUILD_PATH,
filename: 'bundle.js'
},
//添加我们的插件 会自动生成一个html文件
plugins: [
new HtmlwebpackPlugin({
title: 'Hello World app'
})
]
};
```

- 然后在项目根目录运行

```
webpack
```

- 你会发现多出来一个build文件夹，直接点开里面的html文件，你会发现我们可爱的`“hello world”`已经插入到页面了。我们的任务完成了，成功生成`html`，合并`js`，`html`引入了`js`，`js`被执行了

### 4.1 配置webpack-dev-server
---


- 上面任务虽然完成了，但是我们要不断运行程序然后查看页面，所以最好新建一个开发服务器，可以`serve`我们`pack`以后的代码，并且当代码更新的时候自动刷新浏览器

- 安装`webpack-dev-server`

```
npm install webpack-dev-server --save-dev
```

- 安装完毕后在`config`中添加配置

```
module.exports = {

devServer: {
historyApiFallback: true,
hot: true,
inline: true,
progress: true,
},

}
```

- 然后再`package.json`里面配置一下运行的命令,`npm`支持自定义一些命令

```
"scripts": {
"start": "webpack-dev-server --hot --inline"
},
```

- 在项目根目录下输入`npm start`,一堆花花绿绿的信息后server已经起来了，在浏览器里面输入`http://localhost:8080 `发现`hello world`出现了，在`js`里面随便修改一些输出,然后保存,浏览器自动刷新，新的结果出现了

- 拓展阅读 如果你的服务器端使用的是`express`框架，你还可以直接安装`express`的`middleware`，`webpack`配合`express`，很好用

```
npm install webpack-dev-middleware --save-dev
```

### 4.2 添加CSS样式

- 现在来添加一些样式，`webpack`使用`loader`的方式来处理各种各样的资源，比如说样式文件，我们需要两种`loader`，`css-loader `和 `style－loader`，`css-loader`会遍历`css`文件，找到所有的`url(...)`并且处理。`style-loader`会把所有的样式插入到你页面的一个`style tag`中

- 安装我们的`loader`

```
npm install css-loader style-loader --save-dev
```

- 配置`loader`，在`webpack.config.js`中

```
devServer: {
historyApiFallback: true,
hot: true,
inline: true,
progress: true,
},
...
module: {
loaders: [
{
test: /\.css$/,
loaders: ['style', 'css'],
include: APP_PATH
}
]
},
...
plugins: [
new HtmlwebpackPlugin({
title: 'Hello World app'
```

- 看`loaders`的书写方式，test里面包含一个正则，包含需要匹配的文件，`loaders`是一个数组，包含要处理这些程序的`loaders`，这里我们用了`css`和`style`，注意`loaders`的处理顺序是从右到左的，这里就是先运行`css-loader`然后是`style-loader`

- 新建一个样式文件 `main.css`

```
h1 {
color: red;
}
```

- 记得在入口文件`index.js`中引用

```
require('./main.css');
```

- 然后发现标题变成红色的了，`webpack`的理念是基于项目处理的，把对应的文件格式给对应的`loader`处理，然后你就不用管了，它会决定怎么压缩，编译

- 那现在想使用一些有爱的`css`预编译程序，来点`sass`吧。 你可能已经想到了，再来个loader就行啦，确实是
这样简单

```
npm install sass-loader --save-dev
```

- 稍微修改一下`config`，删掉我们先前添加的`css`规则，加上下面的`loader`

```
{
test: /\.scss$/,
loaders: ['style', 'css', 'sass'],
include: APP_PATH
},
```
- 添加两个`sass`文件，`variables.scss`和`main.scss`

`variables.scss`

```
$red: red;
```
`main.scss`

```
@import "./variables.scss";
h1 {
color: $red;
}
```

在`index.js`中引用
```
require('./main.scss');
```

- 然后发现标题如愿变红


### 4.3 处理图片和其他静态文件
---

- 这个和其他一样，也许你也已经会玩了。安装`loader`，处理文件。诸如图片，字体等等，不过有个神奇的地方它可以根据你的需求将一些图片自动转成`base64`编码的，为你减轻很多的网络请求

- 安装`url-loader`

```
npm install url-loader --save-dev
```

- 配置`config`文件

```
{
test: /\.(png|jpg)$/,
loader: 'url?limit=40000'
}
```

- 注意后面那个limit的参数，当你图片大小小于这个限制的时候，会自动启用base64编码图片

新建一个`imgs`文件夹，往里面添加一张照片。在`scss`文件中添加如下的东西

```
@import "./variables.scss";
h1 {
color: $red;
background: url('./imgs/avatar.jpg');
}
```
- npm start, 然后查看图片的url

### 4.4 添加第三方库
---

- 有的时候还想来点`jquery`，`moment`，`undersocre`之类的库`webpack`可以非常容易的做到这一点
- 那么我们现在安装在我们的`app`中添加`jquery`和`moment`的支持

```
npm install jquery moment --save-dev
```

- 在js中引用

```
var sub = require('./sub');
var $ = require('jquery');
var moment = require('moment');
var app = document.createElement('div');
app.innerHTML = '<h1>Hello World it</h1>';
document.body.appendChild(app);
app.appendChild(sub());
$('body').append('<p>look at me! now is ' + moment().format() + '</p>');
```
- 看看浏览器，成功！ `jquery`和`moment`现在都起作用了

### 4.5 添加ES6的支持
---

- 首先 装各种`loader`

```
npm install babel-loader babel-preset-es2015 --save-dev
```

- 配置我们的`config`文件

```
{
test: /\.jsx?$/,
loader: 'babel',
include: APP_PATH,
query: {
presets: ['es2015']
}
},
```

- `es2015`这个参数是`babel`的`plugin`，可以支持各种最新的`es6`的特性，具体的情况看这个链接

- 现在我们可以改掉`CommonJS`风格的文件了

`sub.js`

```
export default function() {
  var element = document.createElement('h2');
  element.innerHTML = "Hello h2 world hahaha";
  return element;
}
```

`index.js`

```
import './main.scss';
import generateText from './sub';
import $ from 'jquery';
import moment from 'moment';
let app = document.createElement('div');
const myPromise = Promise.resolve(42);
myPromise.then((number) => {
$('body').append('<p>promise result is ' + number + ' now is ' + moment().format() + '</p>');
});
app.innerHTML = '<h1>Hello World it</h1>';
document.body.appendChild(app);
app.appendChild(generateText());
```

- 我们上面测试了`import`,` export`，`const`，`let`，`promise`等一系列`es6`的特性

## 五、插件
---

> - 插件可以完成更多 `loader` 不能完成的功能
- 插件的使用一般是在 `webpack` 的配置信息 `plugins` 选项中指定
- `Webpack` 本身内置了一些常用的插件，还可以通过 `npm` 安装第三方插件
- 接下来，我们利用一个最简单的 `BannerPlugin` 内置插件来实践插件的配置和运行，这个插件的作用是给输出的文件头部添加注释信息

修改 `webpack.config.js `，添加 `plugins `

```
var webpack = require('webpack')
module.exports = {
entry: './entry.js',
output: {
path: __dirname,
filename: 'bundle.js'
},
module: {
loaders: [
{test: /\.css$/, loader: 'style!css'}
]
},
plugins: [
new webpack.BannerPlugin('This file is created by zhaoda')
]
}
```

- 然后运行 `webpack` ，打开 `bundle.js` ，可以看到文件头部出现了我们指定的注释信息

```
/*! This file is created by zhaoda */
/******/ (function(modules) { // webpackBootstrap
/******/ // The module cache
/******/ var installedModules = {};
// 后面代码省略
```

## 六、开发环境
---

- 当项目逐渐变大，`webpack` 的编译时间会变长，可以通过参数让编译的输出内容带有进度和颜色

```
$ webpack --progress --colors
```

- 如果不想每次修改模块后都重新编译，那么可以启动监听模式。开启监听模式后，没有变化的模块会在编译后缓存到内存中，而不会每次都被重新编译，所以监听模式的整体速度是很快的

```
$ webpack --progress --colors --watch
```

> 当然，使用 `webpack-dev-server `开发服务是一个更好的选择。它将在 localhost:8080 启动一个 `express` 静态资源 `web `服务器，并且会以监听模式自动运行 webpack，在浏览器打开`http://localhost:8080/ `或 `http://localhost:8080/webpack-dev-server/` 可以浏览项目中的页面和
编译后的资源输出，并且通过一个 `socket.io` 服务实时监听它们的变化并自动刷新页面

```
# 安装
$ npm install webpack-dev-server -g
# 运行
$ webpack-dev-server --progress --colors
```

## 七、故障处理
---

- `Webpack` 的配置比较复杂，很容出现错误，下面是一些通常的故障处理手段
- 一般情况下，`webpack `如果出问题，会打印一些简单的错误信息，比如模块没有找到。我们还可以通过参数 `--display-error-details `来打印错误详情

```
$ webpack --display-error-details
Hash: a40fbc6d852c51fceadb
Version: webpack 1.12.2
Time: 586ms
Asset Size Chunks Chunk Names
bundle.js 12.1 kB 0 [emitted] main
[0] ./entry.js 153 bytes {0} [built] [1 error]
[5] ./module.js 43 bytes {0} [built]
+ 4 hidden modules
ERROR in ./entry.js
Module not found: Error: Cannot resolve 'file' or 'directory' ./badpathmodule in /Users/zhaoda/data/projects/webpack-handbook/examples
resolve file
/Users/zhaoda/data/projects/webpack-handbook/examples/badpathmodule doesn't exist
/Users/zhaoda/data/projects/webpack-handbook/examples/badpathmodule.webpack.js doesn't exist
/Users/zhaoda/data/projects/webpack-handbook/examples/badpathmodule.js doesn't exist
/Users/zhaoda/data/projects/webpack-handbook/examples/badpathmodule.web.js doesn't exist
/Users/zhaoda/data/projects/webpack-handbook/examples/badpathmodule.json doesn't exist
resolve directory
/Users/zhaoda/data/projects/webpack-handbook/examples/badpathmodule doesn't exist (directory default file)
/Users/zhaoda/data/projects/webpack-handbook/examples/badpathmodule/package.json doesn't exist (directory description file)
[/Users/zhaoda/data/projects/webpack-handbook/examples/badpathmodule]
[/Users/zhaoda/data/projects/webpack-handbook/examples/badpathmodule.webpack.js]
[/Users/zhaoda/data/projects/webpack-handbook/examples/badpathmodule.js]
[/Users/zhaoda/data/projects/webpack-handbook/examples/badpathmodule.web.js]
[/Users/zhaoda/data/projects/webpack-handbook/examples/badpathmodule.json]
@ ./entry.js 3:0-26
```

- `Webpack `的配置提供了 `resolve` 和` resolveLoader` 参数来设置模块解析的处理细节， `resolve `用来配置应用层的模块（要被打包的模块）解析， `resolveLoader`用来配置`loader `模块的解析
- 当引入通过 `npm` 安装的 `node.js` 模块时，可能出现找不到依赖的错误。`Node.js `模块的依赖解析算法很简单，是通过查看模块的每一层父目录中的 `node_modules` 文件夹来查询依赖的。当出现 `Node.js `模块依赖查找失败的时候，可以尝试设置 `resolve.fallback `和`resolveLoader.fallback` 来解决问题

```
module.exports = {
resolve: { fallback: path.join(__dirname, "node_modules") },
resolveLoader: { fallback: path.join(__dirname, "node_modules") }
};
```

> `Webpack `中涉及路径配置最好使用绝对路径，建议通过 `path.resolve(__dirname,"app/folder")` 或 `path.join(__dirname, "app", "folder") `的方式来配置，以兼容 `Windows`环境


## 八、开发和部署技巧
---

### 8.1 启用source-map
---

- 现在的代码是合并以后的代码，不利于排错和定位，只需要在config中添加

```
devtool: 'eval-source-map',
```

- 这样出错以后就会采用source-map的形式直接显示你出错代码的位置

### 8.2 使用preLoaders和postLoaders
---

- 也许你想在写代码的时候检查自己的`js`是否符合`jshint`的规范，那么隆重推荐`preLoaders`和`postLoaders`
- `perLoaders`顾名思义就是在`loaders`执行之前处理的，`webpack`的处理顺序是`perLoaders - loaders - postLoaders`

- 安装`jshint`

```
npm install jshint-loader --save-dev
```

- 在`config`文件中配置

```
module: {
...
//和loaders一样的语法，很简单
perLoaders: [
{
test: /\.jsx?$/,
include: APP_PATH,
loader: 'jshint-loader'
}
]
}
...
//配置jshint的选项，支持es6的校验
jshint: {
"esnext": true
},
```

- 好了 现在每次npm run start的时候就可以看到jshint的提示信息啦

### 8.3 部署上线
---

- 刚才说的各种情况都是在开发时候的情况，那么假如项目已经开发完了，需要部署上线了。我们应该新创建一个单独的`config`文件，因为部署上线使用`webpack`的时候我们不需要一些`dev-tools`,`dev-server`和`jshint`校验等

- 复制我们现有的`config`文件，命名`webpack.production.config.js`，将里面关于 `devServer`等和开发有关的东西删掉

- 在`package.json`中添加一个命令

```
"scripts": {
"start": "webpack-dev-server --hot --inline",
"build": "webpack --progress --profile --colors --config webpack.production.config.js"
},
```

- 当要上线的时候,运行

```
npm run build
```

- 可以发现`build`文件夹中生成了所有东西



