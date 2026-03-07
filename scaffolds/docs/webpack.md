---
title: webpack学习总结(一)
date: 2017-01-13 18:40:43
tags: webpack
categories: Build
---

> 声明 本教程整理于互联网

先看一个例子

```js
// webpack.config.js
module.exports = {
    // 入口
    entry: {
        'index': './index.js'
    },
    // 输出
    output: {
        path: './',
        /*
            [name] 是 entry 中的 key
            entry: {
                key: value
            }
        */
        filename: "[name].b.js"
    }
};
```
module.exports 是 CommonJS 规范中定义一个文件对外接口的语法，[webpack.config.js](webpack.config.js) 文件对外的接口是一个 object ，其中定义了一些配置参数。

<!--more-->

###  一、参数详解
---

#### 1.1 entry
---

最初 webpack 是为了构建 SPA (Single Page Application) ，`entry` 是『入口』配置。在 `entry` 中的文件才会被编译。

#### 1.2 output
---

`output` 控制构建后的文件的存放位置和命名。 `path` 定义所有构建后文件的所在目录，本例中构建到当前文件夹。

#### 1.3 filename
---

`filename` 控制构建后文件的文件名

#### 1.4 源码和构建结果
---

```js
// index.js
var content = require("./content.js")

document.body.innerHTML = document.body.innerHTML + content
```
```js
// content.js
module.exports = "some string"
```

```html
<body>
<a target="_blank" href="https://github.com/nimojs/webpack-book/blob/gh-pages/1-modules/README.md">本例说明</a>
<script src="index.b.js"></script>
</body>
```

建议尽量理解构建后的代码，这样有助于理解 `webpack`

```js
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var content = __webpack_require__(1)

	document.body.innerHTML = document.body.innerHTML + content

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = "some string"

/***/ }
/******/ ]);
```

前面带 `/******/ `的代码都是 `webpack `的模块化代码，它内置了一个模块加载器

模块 0 是 `index.js` 的代码，模块 1 是 `require("./content.js")` 的代码。如果你再  `require` 一个模块那么就会有模块 3。


### 二、JS包含样式
---


安装时间可能会比较久

```shell
# 安装所需 style-loader 和 css-loader
npm install css-loader style-loader -D

# less 和 less-loader 可以选择不安装 （如果安装了请去掉 index.js 中引入 less 的注释）
npm install less-loader -D
npm install less -g
```
```shell
webpack --watch
```


```js
module.exports = {
    entry: {
        'index': './index.js'
    },    
    output: {
        path: './',
        filename: "[name].b.js"
    },
    module: {
        loaders: [
            {
                test: /\.css$/,
                loader: "style!css"
            },
            {
                test: /\.less$/,
                loader: "style!css!less"
            }
        ]
    }
};
```

`module.loaders` 定义 `require` 的模块代码会被如何编译。 [官方文档 using-loaders](http://webpack.github.io/docs/using-loaders.html)

#### 2.1 module.loaders[].test
---

`test` 参数是一个正则表达式，用于匹配模块。`'./index.css'.test(/\.css&/)`

#### 2.2 module.loaders[].loader
---

`loader` 参数定义被 `test` 匹配到的模块会执行哪些构建操作

本例中 .css 后缀的文件会被 `style-loader` 和 `css-loader` 构建


#### 2.3 require 时配置 loader
---

如果你不想在 webpack.config.js 配置，你还可以在 require 时单独定义一个文件会使用哪些 loader

```js
require('!style!css!./index.css')
```

#### 2.4 被嵌入 `<head>`
---

查看 [在线预览构建结果页面](http://nimojs.github.io/webpack-book/2-style/) 源码可以看到样式通过 JS 嵌入到 `<head>` 中使用的
```html
<head>
<style type="text/css">body {
    background-color:#ABCDEF;
}</style>
</head>
```

### 三、JS包含图片
---


```shell
npm install url-loader file-loader -D
```

```shell
webpack --watch
```

> 代码解释待补充

### 四、使用全局变量
---


```shell
webpack -w
```

### 五、暴露全局变量
---

> 有些模块依赖全局变量 `windows.jQuery` 才能使用，可以通过 [expose-loader](https://github.com/webpack/expose-loader) 暴露全局变量

```shell
npm install jquery --save
npm install expose-loader -D
```

```shell
webpack -w
```

### 六、提取单独样式文件
---

有时候我们需要编译单独的 CSS 文件，这就需要 [extract-text-webpack-plugin](https://github.com/webpack/extract-text-webpack-plugin) 插件


```shell
npm install extract-text-webpack-plugin -D
npm install style-loader css-loader -D
```

```shell
webpack -w
```

### 七、自动打包公用资源
---

```shell
npm install jquery paging --save
```

```shell
webpack -w
```

### 八、文件指纹 hash
---

```shell
webpack --watch
```

### 九、异步加载
---

```shell
webpack --watch
```
