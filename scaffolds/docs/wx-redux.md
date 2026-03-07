---
title: 在小程序中集成redux/immutable/thunk第三方库
date: 2018-08-11 13:30:43
tags: 
  - 小程序
  - redux
categories: Front-End
---

### 一、前言

> 小程序给我们暴露了两个参数`require`和`module`，`require`用来在模块中加载其他模块，`module`用来将模块中的方法暴露出去

```javascript
module.exports = function(){}
```
> 所以只要需要让第三方库的代码使用这种形式的`export`就可以了

### 二、构建Redux的微信小程序包

> 打一个`Redux`包，让它可以兼容微信小城的加载方式

```shell
git clone https://github.com/reactjs/redux.git

npm install

# 详细内容可以到redux项目的package.json中查看
# 这些命令是是使用webpack构建UMD模式的包。也就是说所有的代码，包括依赖的库都会被打包到一个文件中，并且自带一段模块加载代码，文件可以在dist目录下找到
npm run build:umd && npm run build:umd
```

> 用编辑器打开`dist`目录下的`redux.js`文件

```javascript
(function webpackUniversalModuleDefinition(root, factory) {
    if(typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if(typeof define === 'function' && define.amd)
        define([], factory);
    else if(typeof exports === 'object')
        exports["Redux"] = factory();
    else
        root["Redux"] = factory();
})(this, function() {
...  
})
```

- 这段代码是用来加载模块的，里面的factory函数的返回的内容是用webpack提供的loader组织起来的redux的代码和第三方依赖。
- 如果我们把这个文件拷贝到小程序中，只需要让程序能正常进入第三行代码，就能把Redux加载进来
- 将第二行代码：`if(typeof exports === 'object' && typeof module === 'object')` 修改成：`if(typeof module === 'object')`
- 这样修改的原因是，在微信小程序的环境中是没有exports变量的，所以就没办法正确进入这个分支，删除之后就可以正确进入
- 我们拷贝到`libs`目录下，那么我们在程序中使用时，只要当做是一个本地模块去`require`就可以了 `var redux = require('./libs/redux.js')`
- 我们可以通过类似的方法，使用`Webpack`打包第三方库，就可以集成任何库了

### 三、集成Redux-devtools

> 因为微信小程序的开发环境是定制的，暂时没有发现办法直接安装`redux-devtool`的插件

**安装remote-redux-devtools**

- 原版的`remote-redux-devtools`使用的一个`websocket`的依赖会使用原生的`WebSocket`，小程序是不支持的，所以需要改成小程序的`websocket`实现,修改好的代码 https://github.com/poetries/wx-redux-immutable-template/blob/master/wx-redux-immutable-template/public/libs/remote-redux-devtools.js
- 把代码下载到工程目录里面就可以用了

**安装和启动remotedev-server**

```shell
npm install -g remotedev-server
remotedev --hostname=localhost --port=5678
```

> 因为没办法用`npm`安装到本地（微信小程序会尝试去加载项目目录中的所有js），所以这里使用全局安装，第二条命令是启动`remotedev-server`，`hostname`和`port`分别指定为`localhost`和`5678`

**集成devtool**

> 在`store`下集成`devtool`

```javascript
const {createStore, compose} = require('./libs/redux.js');
const devTools = require('./libs/remote-redux-devtools.js').default;
const reducer = require('./reducers/index.js')

function configureStore() {
  return createStore(reducer, compose(devTools({
    hostname: 'localhost',
    port: 5678,
    secure: false
  })));
}

module.exports = configureStore;
```
> 把`devtool`使用`redux`的`compose`加到`store`中去。`hostname`和`port`是指定为之前启动`remotedev-server`启动时候指定的参数。保存之后重启一下小程序，如果没有报错的话就OK了

- 可以在浏览器中访问`localhost:5678`

### 四、小程序中集成immutable

> `Immutable` 是 `Facebook` 开发的不可变数据集合。不可变数据一旦创建就不能被修改，是的应用开发更简单，允许使用函数式编程技术，比如惰性评估。微信小程序无法直接使用`Immutable.js`，下面就来说说微信小程序如何使用第三方库`Immutable.js`

**Immutable使用了UMD模块化规范**

```javascript
(function (global, factory) {
 typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
 typeof define === 'function' && define.amd ? define(factory) :
 (global.Immutable = factory());
}(this, function () { 'use strict';var SLICE$0 = Array.prototype.slice;

....

}));
```

> 修改`Immutable`代码，注释原有模块导出语句，使用`module.exports = factory()` 强制导出

```javascript
(function(global, factory) {
 /*
 typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
 typeof define === 'function' && define.amd ? define(factory) :
 (global.Immutable = factory());
 */

 module.exports = factory();

}(this, function() {
```

> 导入修改好的`immutable`到小程序中即可 https://github.com/poetries/wx-redux-immutable-template/blob/master/wx-redux-immutable-template/public/libs/immutable.js

### 五、小程序集成redux、immutable模板

> https://github.com/poetries/wx-redux-immutable-template


