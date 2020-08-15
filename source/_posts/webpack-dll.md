---
title: dll预编译提高webpack打包速度
date: 2018-11-23 11:10:21
tags: 
   - webpack
   - dll
categories: Front-End
---

> 博客链接 http://blog.poetries.top/2018/11/23/webpack-dll

## 一、webpack的dll功能

> 基于`webpack3`构建

### 1.1 dll介绍

> 我们构建前端项目的时候，往往希望第三方库（`vendors`）和自己写的代码可以分开打包，因为第三方库往往不需要经常打包更新。对此`Webpack`的文档建议用`CommonsChunkPlugin`来单独打包第三方库

- 我们这里的`dll.js` 是提前打包好了的，而不是在每次`build`的时候去打包输出的；这样才能做到依赖包一次构建，无限次使用
- `webpack`输出的文件名都带有`hash`值； 而用`dll`构建后输出的文件名是固定的

```js
entry: {
  vendor: ["jquery", "other-lib"],
  app: "./entry"
}
new CommonsChunkPlugin({
  name: "vendor",

  // filename: "vendor.js"
  // (Give the chunk a different name)

  minChunks: Infinity,
  // (with more entries, this ensures that no other module
  //  goes into the vendor chunk)
})
```

> 通常为了对抗缓存，我们会给售出文件的文件名中加入`hash`的后缀——但是——我们编辑了`app`部分的代码后，重新打包，发现`vendor`的`hash`也变化了

![](https://poetries1.gitee.io/img-repo/2019/10/639.png)

> 这么一来，意味着每次发布版本的时候，vendor代码都要刷新，即使我并没有修改其中的代码。这样并不符合我们分开打包的初衷

- `Dll`是`Webpack`最近新加的功能
- `Dll`这个概念应该是借鉴了`Windows`系统的`dll`。一个`dll`包，就是一个纯纯的依赖库，它本身不能运行，是用来给你的`app`引用的
- 打包`dll`的时候，`Webpack`会将所有包含的库做一个索引，写在一个`manifest`文件中，而引用`dll`的代码（`dll user`）在打包的时候，只需要读取这个`manifest`文件，就可以了。

**优势**

- `Dll`打包以后是独立存在的，只要其包含的库没有增减、升级，`hash`也不会变化，因此线上的`dll`代码不需要随着版本发布频繁更新
- `App`部分代码修改后，只需要编译`app`部分的代码，`dll`部分，只要包含的库没有增减、升级，就不需要重新打包。这样也大大提高了每次编译的速度
- 假设你有多个项目，使用了相同的一些依赖库，它们就可以共用一个`dll`

### 1.2 dll使用

> 首先要先建立一个`dll`的配置文件，`entry`只包含第三方库

**第一步：新建webpack.dll.conf.js**

- `webpack.DllPlugin`的选项中，`path`是`manifest`文件的输出路径；`name`是`dll`暴露的对象名，要跟`output.library`保持一致

```js
// build/webpack.dll.conf.js

const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: {
    // 把这些资源打包成dll，提高编译速度
    react: ['react','react-router-dom','redux','redux-immutable','immutable','react-redux','react-router','redux-logger','redux-thunk','styled-components'],
    ui: ['antd-mobile','antd'],
    others: ['react-icons','axios','clipboard','humps','lodash','md5','moment','normalizr']
  },
  output: {
    path: path.resolve(__dirname, "../dist/static/js"),
    filename: `[name].dll.js`,
    library: '[name]_library'
  },
  plugins: [
 ...Object.keys(['react','ui','others']).map(name => {
      return new webpack.DllReferencePlugin({
        context: '.',
        manifest: require(`../static/${name}.manifest.json`),
      })
    }),
    new webpack.optimize.UglifyJsPlugin()
  ]
}
```

**第二步：加一个命令**

```js
// package.json
"scripts": {
  "dll": "webpack --config config/webpack.dll.conf.js"
}
```

> 执行`npm run dll`

- 运行`Webpack`，会输出两个文件一个是打包好的`vendor.js`，一个就是`manifest.json`，长这样

```js
{
  "name": "vendor_ac51ba426d4f259b8b18",
  "content": {
    "./node_modules/antd/dist/antd.js": 1,
    "./node_modules/react/react.js": 2,
    "./node_modules/react/lib/React.js": 3,
    "./node_modules/react/node_modules/object-assign/index.js": 4,
    "./node_modules/react/lib/ReactChildren.js": 5,
    "./node_modules/react/lib/PooledClass.js": 6,
    "./node_modules/react/lib/reactProdInvariant.js": 7,
    "./node_modules/fbjs/lib/invariant.js": 8,
    "./node_modules/react/lib/ReactElement.js": 9,
    
    ............
```

> `Webpack`将每个库都进行了编号索引，之后的`dll user`可以读取这个文件，直接用`id`来引用

![](https://poetries1.gitee.io/img-repo/2019/10/640.png)


**第三步： 在plugins中增加配置**

```js
// build/webpack.prod.conf.js
module.exports = {
   plugins: [
        new webpack.DllReferencePlugin({
          manifest: require('../dll/react-manifest.json')
        }),
        new webpack.DllReferencePlugin({
          manifest: require('../dll/ui-manifest.json')
        }),
        new webpack.DllReferencePlugin({
          manifest: require('../dll/others-manifest.json')
        })
   ]
}
```

> 再次执行`npm run build`

之前
![](https://poetries1.gitee.io/img-repo/2019/10/641.png)

之后
![](https://poetries1.gitee.io/img-repo/2019/10/642.png)


## 二、happypack 多线程打包

> 一般情况下，js是单线程执行的，但`node`不是。利用`node`提供的多线程环境，`happypack `是可以多线程打包的。基本上打开官网看了一下readme就可以配置了，特别是我只针对js的编译进行优化，配置还是比较简单的。

https://www.npmjs.com/package/happypack


- `happyPack`把所有串行的东西并行处理,使得`loader`并行处理，较少文件处理时间

```js
// build/webpack.prod.conf.js

// @file: webpack.config.js
const HappyPack = require('happypack');
 
exports.module = {
  rules: [
    {
      test: /.js$/,
      // 1) replace your original list of loaders with "happypack/loader":
      // loaders: [ 'babel-loader?presets[]=es2015' ],
      use: 'happypack/loader',
      include: [ /* ... */ ],
      exclude: [ /* ... */ ]
    }
  ],
  plugins: [
     // 2) create the plugin:
    new HappyPack({
        // 3) re-add the loaders you replaced above in #1:
        loaders: [ 'babel-loader?presets[]=es2015' ]
    })
  ]
}
```

这时的编译时间也减小了一些

![](https://poetries1.gitee.io/img-repo/2019/10/643.png)

> 更多详情 http://blog.poetries.top/2018/11/21/webpack-review/#6-1-%E5%88%86%E6%9E%90%E6%89%93%E5%8C%85%E7%BB%93%E6%9E%9C

## 三、更多参考

-  [Webpack 打包优化之体积篇](https://www.jeffjade.com/2017/08/06/124-webpack-packge-optimization-for-volume/)
- [Webpack 打包优化之速度篇](https://www.jeffjade.com/2017/08/12/125-webpack-package-optimization-for-speed/)
- [预打包Dll，实现webpack音速编译](https://segmentfault.com/a/1190000007104372)
- [利用DllPlugin分割你的第三方库](https://juejin.im/post/5a4f031b518825733e6040c0)
- [提高webpack的打包速度：happypack和dll打包](https://github.com/p2227/p2227.github.io/issues/21)
