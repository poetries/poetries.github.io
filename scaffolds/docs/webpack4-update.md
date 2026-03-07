---
title: webpack4升级篇
date: 2018-11-25 19:10:08
tags: 
   - webpack
   - 升级
categories: Front-End
---

## 一、环境及依赖库更新

> 由于`Webpack`的更新，很多`Loader`也必须更新才能适应`Webpack`的最新版本

|必须更新的loader	|最低要求版本	|功能说明|
|---|---|---|
|`babel-loader`|	`7.1.3`|	对最新的ES语法进行转换|
|`eslint-loader`|	`2.0.0`|	代码检查|
|`file-loader`|	`1.1.10`|	批量修改文件路径，或者指定编译后文件存储路径|
|`vue-loader`|	`15.0.0`|	解析、编译`vue`单文件组件|
|`vue-style-loader`|	`4.1.0`|	解析、编译`vue`单文件组件中的样式|

## 二、Webpack 4.x 的破坏性变更

> 由于`Webpack 4.x`的重大变更，导致其不再支持部分插件和`Loader`，其中最闹心的是`Chunk`分离及文件分离

|失效的插件或loader|	类型	|功能说明|
|---|---|---|
|`webpack.optimize.CommonsChunkPlugin`	|内置插件|	分离`Chunk`。将多次出现的代码统一打包到一个文件中。`Vue`工程中用来打包`vendor`及`mainfest`|
|`webpack.optimize.UglifyJsPlugin`	|内置插件|	压缩JS|
|`extract-text-webpack-plugin`|	`Loader`|	分离文件。将部分代码或文件提取到单独文件中。Vue工程里用来分离CSS到指定文件|

### 2.1 使用config.optimization代替

> 在`Webpack 4.x`中，新增了`optimization`的选项来代替之前版本中的`webpack.optimize`等。在`optimization`选项中，我们可以进行详细的设置，以达到分离`CSS`，分离`Chunk`，压缩文件等等操作

```js
module.exports = {
    //...
    optimization: {}
};
```

### 2.2 压缩JS及CSS文件

> 由于`Webpack 4.x`中取消了其内置插件，所以之前的方法都不管用了。这里我推荐大家使用`UglifyJsPlugin`及`OptimizeCSSPlugin`插件来代替之前的内置插件，当然如果你只是想简单的压缩，而不做任何配置的话，可以按照官方文档中给出的方法使用`optimization.minimizer: true`即可

```js
const UglifyJsPlugin = require("uglifyjs-webpack-plugin")
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')

module.exports = {
    //...
    optimization: {
        minimizer: [
            // js mini
            new UglifyJsPlugin({
              cache: true,
              parallel: true,
              sourceMap: false // set to true if you want JS source maps
            }),
            // css mini
            new OptimizeCSSPlugin({})
        ]
    }
}
```

### 2.3 分离JS文件

> 在之前版本中，我们使用`CommonsChunkPlugin`进行文件分离，而在`Webpack 4.x`中，我们则借助于`config.optimization`来实现

```js
// webpack 3.xx
module.exports = {
    //...
    plugins:[
         new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: function(module) {
                // any required modules inside node_modules are extracted to vendor
                return (
                    module.resource &&
                    /\.js$/.test(module.resource) &&
                    module.resource.indexOf(
                        path.join(__dirname, '../node_modules')
                    ) === 0
                )
            }
        }),
    ]
}
```

```js
// webpack4
module.exports = {
    //...
    optimization: {
        splitChunks: {
            chunks: 'async',
            // 大于30KB才单独分离成chunk
            minSize: 30000,
            maxAsyncRequests: 5,
            maxInitialRequests: 3,
            name: true,
            cacheGroups: {
                default: {
                    priority: -20,
                    reuseExistingChunk: true,
                },
                vendors: {
                    name: 'vendors',
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10,
                    chunks: "all"
                },
                echarts: {
                    name: 'echarts',
                    chunks: 'all',
                    // 对echarts进行单独优化，优先级较高
                    priority: 20,
                    test: function(module){
                        var context = module.context;
                        return context && (context.indexOf('echarts') >= 0 || context.indexOf('zrender') >= 0)
                    }
                }
            }
        }
    }
}    
```


#### 2.3.1 公共代码抽取

> `CommonsChunkPlugin` 已弃用，使用`optimization.splitChunks`代替

**配置项**

- `cacheGroups` 自定义配置主要使用它来决定生成的文件
- `test` 限制范围，可以是正则，匹配文件夹或文件
- `name` 生成文件名
- `priority` 优先级，多个分组冲突时决定把代码放在哪块
- `minSize` 最小尺寸必须大于此值，默认`30000B`
- `minChunks` 其他`entry`引用次数大于此值，默认1(`minChunks`指的是被不同`entry`引入的次数)
  - 为`1`时，适合分离 `node_moudles` 里的第三方库（很多人认为这个值设成2其实不合理）
- maxInitialRequests entry文件请求的chunks不应该超过此值（请求过多，耗时）
- maxAsyncRequests 异步请求的chunks不应该超过此值
- automaticNameDelimiter 自动命名连接符
- `chunks` 值为`"initial"`, `"async"`（默认） 或 `"all"`
  - `initial` 入口`chunk`，对于异步导入的文件不处理
  - `async` 异步`chunk`，只对异步导入的文件处理（个人理解）
  - `all` 全部`chunk`（我反正选`all`，不甚理解）

**使用方式**

1. 使用默认配置

> 不配置时再`production`模式下开启`async`

```js
optimization:{
    splitChunks:{
        chunks:"all"
    }
}
```

> 生成的文件 `vendors~xx.js` ，xx与入口名对应

默认配置

```js
optimization: {
    splitChunks: {
        chunks: "async",
        minSize: 30000,
        minChunks: 1,
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
        automaticNameDelimiter: '~',
        name: true,
        cacheGroups: {
            vendors: {
                test: /[\\/]node_modules[\\/]/,
                priority: -10
            },
            default: {//cacheGroups重写继承配置，设为false不继承
                minChunks: 2,
                priority: -20,
                reuseExistingChunk: true
            }
        }
    }
}
```

2. 自定义配置

> 生成的文件 `xx.js` ，`xx`指`name`的值

```js
optimization: {
    //打包 第三方库
    //打包 公共文件
    splitChunks: {
        cacheGroups: {
            vendor:{//node_modules内的依赖库
                chunks:"all",
                test: /[\\/]node_modules[\\/]/,
                name:"vendor",
                minChunks: 1, //被不同entry引用次数(import),1次的话没必要提取
                maxInitialRequests: 5,
                minSize: 0,
                priority:100,
                // enforce: true?
            },
            common: {// ‘src/js’ 下的js文件
                chunks:"all",
                test:/[\\/]src[\\/]js[\\/]/,//也可以值文件/[\\/]src[\\/]js[\\/].*\.js/,  
                name: "common", //生成文件名，依据output规则
                minChunks: 2,
                maxInitialRequests: 5,
                minSize: 0,
                priority:1
            }
        }
    }
}
```

**配合 runtimeChunk**

> `runtimeChunk`，将入口提取出来，这样入口文件可以很快加载，并且当哪里有改动的时候，只有改动的地方和这个文件有变化。
`optimization.runtimeChunk` 用来提取 `entry` `chunk `中的 `runtime`部分函数，形成一个单独的文件，这部分文件不经常变换，方便做缓存

```js
runtimeChunk: {
  name: 'manifest'
}
```

### 2.4 提取CSS到单独文件

> 在之前版本中我们使用`extract-text-webpack-plugin`来提取`CSS`文件，不过在`webpack 4.x`中则应该使用`mini-css-extract-plugin`来提取`CSS`到单独文件中

```js
// webpack 3.xx
const utils = require('./utils')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
module.exports = {
    //...
    new ExtractTextPlugin({
        filename: utils.assetsPath('css/[name].[contenthash:7].css')
    })
}
```

```js
// webpack 4.xx
const utils = require('./utils')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
module.exports = {
    //...
    new MiniCssExtractPlugin({
        filename: utils.assetsPath('css/[name].[contenthash:7].css')
    })
}
```

```js
// webpack4 生产环境下的配置优化

const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
module.exports = {
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: true 
      }),
      new OptimizeCSSAssetsPlugin({})  // use OptimizeCSSAssetsPlugin
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/app.[name].css',
      chunkFilename: 'css/app.[contenthash:12].css'  // use contenthash *
    })
  ]
  ....
}
```

**将多个css chunk合并成一个css文件**

```js
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        styles: {            
          name: 'styles',
          test: /\.scss|css$/,
          chunks: 'all',    // merge all the css chunk to one file
          enforce: true
        }
      }
    }
  }
}
```



### 2.5 用更加快捷的mode模式来优化配置文件

> `webpack4`中提供的`mode`有两个值：`development`和`production`，默认值是 `production`。`mode`是我们为减小生产环境构建体积以及节约开发环境的构建时间提供的一种优化方案，提供对应的构建参数项的默认开启或关闭，降低配置成本

```js
// 开启方式 1：直接在启动命令后加入参数

"scripts": {
  "dev": "webpack --mode development",
  "build": "webpack --mode production"
}
```

```js
// 开启方式 2：可以在配置文件中加入一个mode属性：
module.exports = {
  mode: 'production' // development
};
```

### 2.6 其他调整项备忘

- `NoEmitOnErrorsPlugin`- > `optimization.noEmitOnErrors`（默认情况下处于生产模式）
- `ModuleConcatenationPlugin- > `optimization.concatenateModules`（默认情况下处于生产模式）
- `NamedModulesPlugin`- > `optimization.namedModules`（在开发模式下默认开启）
- `webpack`命令优化 -> 发布了独立的 `webpack-cli` 命令行工具包
- `webpack-dev-server `-> 建议升级到最新版本
- `html-webpack-plugin` -> 建议升级到的最新版本
- `file-loader` -> 建议升级到最新版本
- `url-loader` -> 建议升级到最新版本

## 三、更多参考

- [一些优化wepback的库](https://github.com/GoogleChromeLabs/webpack-libs-optimizations)
- [webpack4配置详解](http://blog.poetries.top/2018/11/18/webpack4-config/)
- [webpack4.x配置指南](https://segmentfault.com/a/1190000015592264)
- [webpack4 化繁为简（二)](https://segmentfault.com/a/1190000015970277)
- [记一次webpack3升级webpack4的踩坑](https://www.cnblogs.com/carrotWu/p/8665720.html)
- [webpack4.0让编译速度飙升](https://segmentfault.com/a/1190000015263836)
