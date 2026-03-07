---
title: webpack回顾篇
date: 2018-11-21 17:40:08
tags: 
   - webpack
   - 优化
categories: Front-End
---


> 基于`webpack3`

## 一、webpack简介

### 1.1 版本更迭

![](https://poetries1.gitee.io/img-repo/2019/10/644.png)

**大版本变化**

![](https://poetries1.gitee.io/img-repo/2019/10/645.png)

### 1.2 功能进化

**Webpack V1**

- 编译、打包
- `HMR` (模块热更新)
- 代码分割
- 文件处理

**Webpack V2**

- `Tree Shaking`
- `ES module`
- 动态 `Import`
- 新的文档

**Webpack V3**

- `Scope Hoisting` (作用域提升)
- `Magic Comments` （配合动态`import`使用）

> 版本迁移

**V1 -> V2**

迁移指南 https://doc.webpack-china.org/guides/migrating/

**V2 -> V3**

更新升级即可

## 二、webpack核心概念

### 2.1 Entry

- 代码的入口
- 打包的入口
- 单个或多个

> 写法建议使用键值对写法

```js
module.exports = {
  entry: 'index.js'
}
```

```js
module.exports = {
  entry: '[index.js','vendor.js']
}
```

```js
module.exports = {
  entry: {
      index:'index.js'
  }
}
```


```js
module.exports = {
  entry: {
      index:['index.js','app.js'],
      vendor: 'vendor.js'
  }
}
```


### 2.2 Output

- 打包成的文件(`bundle`)
- 一个或多个
- 自定义规则
- 配合`CDN`

```js
module.exports = {
  entry: 'index.js',
  output: {
      filename: 'index.min.js'
  }
}
```

```js
module.exports = {
  entry: {
    index: 'index.js',
    vendor: 'vendor.js'
  },
  output: {
      filename: '[name].min[hash:5].js'
  }
}
```


### 2.3 Loaders

- 处理文件
- 转化为模块

```js
module.exports = {
  module: {
      rules: [
        {
            test: /\.css$/,
            use: 'css-loader'
        }
      ]
  }
}
```

#### 2.3.1 常用Loader

**编译相关**

- `babel-loader`
- `ts-loader`

**样式相关**

- `style-loader`
- `css-loader`
- `less-loader`
- `postcss-loader`

**文件相关**

- `file-loader`
- `url-loader`


### 2.4 Plugins

- 参与打包整个过程
- 打包优化和压缩
- 配置编译时的变量
- 极其灵活

```js
module.exports = {
 plugins: [
    new webpack.optimize.UglifyJsPlugin()
 ]
}
```

#### 2.4.1 常用plugins

**优化相关**

- `CommonsChunkPlugin`
- `UglifyJsWebpackPlugin`

**功能相关**

- `ExtractTextWebpackPlugin` 提取css
- `HtmlWebpackPlugin` 生成HTML模板
- `HotModuleReplacementPlugin` 热模块替换
- `CopyWebpackPlugin` 拷贝文件

### 2.5 名词

- `Chunk` 打包过程分割的代码块
- `Bundle` 打包后的文件
- `Module` 

## 三、初探 webpack 

### 3.1 使用babel打包es6

#### 3.1.1 编译 ES 6/7

**Babel**

```bash
npm install babel-loader@8.0.0-beta.0 @babel/core
npm install –save-dev babel-loader babel-core 
```

**Babel Presets**

> 主要有几种类型选择

- `es2015`
- `es2016`
- `es2017`
- `env`
- `babel-preset-react`
- `babel-preset-stage 0 - 3`


```bash
npm install @babel/preset-env –save-dev
npm install babel-preset-env –save-dev
```

**Babel Polyfill**


> 针对一些不能处理的函数方法(`Generator`、`Set`、`Map`、`Array.from...`)需要用到`babel-Polyfill`处理

- 全局垫片
- 为应用准备

```bash
npm install babel-polyfill –save
```

```
import “babel-polyfill”
```

**Babel Runtime Transform**

- 局部垫片
- 为开发框架准备

```bash
npm install babel-plugin-transform-runtime –save-dev

npm install babel-runtime –save
```


例子

```js
module.exports = {
    entry: {
       app: 'app.js'
    },
    output: {
        filename: '[name].[hash:8].js'
    },
    module: {
        rules:[
            test: /\.js$/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [
                        '@babel/preset-env',{
                            //指定target为根据哪些语法编译
                            targets: {
                                browsers: ['> 1%','last 2 versions']
                            }
                        }
                    ]
                }
            },
            exclude: '/node_modules'
        ]
    }
}
```

> 对于`webpack`中`babel`的配置可以单独提取处理`.babelrc`统一管理

```json
{
    "presets": [
        ["@babel/preset-env",{
            targets: {
                browsers: ['> 1%','last 2 versions']
            }
        }]
    ],
    "plugins": [
      "transform-runtime"
    ]
]
```

### 3.2 打包 Typescript


```bash
npm i typescipt ts-loader  --save-dev
npm i typescipt awesome-typescript-loader  --save-dev
```

配置

- `tsconfig.json`
- `webpack.config.js`

**tsconfig**

- 配置选项:官网`/docs/handbook/compiler-options.html`
- 常用选项 `compilerOptions` `include` `exclude`

**声明文件**

> 用于编译时检查错误

以`loadsh`为例，需要安装`@types/lodash`带有声明文件的，而不是安装`lodash`

```bash
npm install @types/lodash
npm install @types/vue
```

**Typings**

> 也可以这样安装带有`type`的包

```bash
npm install typings
typings install lodash
```

例子

```js
module.exports = {
    entry: {
        'app': 'app.js'
    },
    output: {
        filename: '[name].bundle.js'
    },
    module: {
        rules: [
            test: /\.tsx?$/,
            use: {
                loader: 'ts-loader'
            }
        ]
    }
}
```

> 在项目根目录创建`tsconfig.json`

```js
 {
    "compilerOptions": {
         "module": "comonjs",
         "target": "es5", //编译后的文件在哪个环境运行
         "allowJs": true,//允许js语法
    },
    "include": [
        //编译路径
        "./src/*"
    ],
    "exclude": [
        //排除编译文件
        "./node_modules"
    ]
 }
```


### 3.3 提取 js 的公用代码

- 减少代码冗余
- 提高加载速度

> 主要使用内置插件实现`webpack.optimize.CommonsChunkPlugin`

```js
{
	plugins: [
	     new webpack.optimize.CommonsChunkPlugin(option)
	]
}
```

例子

```js
module.exports = {
    entry: {
        "pageA": "./src/pageA",
        "pageB": "./src/pageB",
        "vendor": ['loash']//业务代码和第三方代码区分开,给loash单独打一个包
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].bundle.js',
        chunkFilename: '[name].chunk.js'
    },
    plugins: [
    // 提取common
    new webpack.optimize.CommonsChunkPlugin({
         name: 'common',
         minChunks:2,//出现两次就打包成common代码
         chunks: ['pageA','pageB']//指定范围提取公共代码
     })
        
    // 提取vendor、取业务代码manifest
     new webpack.optimize.CommonsChunkPlugin({
         //把entry的vendor代码和这里的common（webpack打包的）代码合并
         names: ['vendor','manifest']
         minChunks: Infinity
     })
     // ==== 提取业务代码manifest== 合并到上面names中
     // 如果不想把webpack打包的代码和vendor代码合并 需要提取到manifest
     //new webpack.optimize.CommonsChunkPlugin({
         // webpack代码和vendordiam区分开
       //  name: 'manifest' //manifest即生成
       //  minChunks: Infinity
    // })
     
    ]
}
```

![](https://poetries1.gitee.io/img-repo/2019/10/646.png)


### 3.4 代码分割和懒加载

**第一种方式：通过wepack内置方法**

> `require.ensure`动态加载一个模块，接收四个参数

- `[]:dependencies` 初次并不会执行
- `callback`的时候才会执行
- `errorCallback` 可省略
- `chunkName`

**第二种方式：通过ES2015 Loader Spec**

> `System.import()`后面演变为`import()`来动态加载模块

`import()`方式返回一个`promise`在`import`中传入需要依赖的明，动态加载模块，就可以像使用`Promise`一样使用`import().then()`


**代码分割场景**

- 分离业务代码 和 第三方依赖
- 分离业务代码 和 业务公共代码 和 第三方依赖
- 分离首次加载 和 访问后加载的代码

例子

```js
module.exports = {
    entry: {
        "pageA": "./src/pageA"
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        publicPath: './dist/',//动态加载路径
        filename: '[name].bundle.js',
        chunkFilename: '[name].chunk.js'
    }
}
```

> 目标是提取`pageA`、`pageB`中公共的模块`moduleA`

```js
//src/pageA.js

import './subPageA'
import './subPageB'

//ensure的时候代码不会执行 需要在下面加载一次
require.ensure(['lodash'],function(){
    var _ = require('lodash')
    _.join([1,2,3])
},'vendor')// 指定chunk名称


export default 'pageA'
```

运行打包这时`loadash`提取到`vendor`中

![](https://poetries1.gitee.io/img-repo/2019/10/647.png)

这时候还不是我们想要的

```js
//src/pageA.js

require.include('./moduleA')

if(page === 'subPageA'){
  require.ensure(['./subPageA'],function(){
    var subPageA = require('./subPageA')
    },'subPageA')// 指定chunk名称
}else{
  require.ensure(['./subPageB'],function(){
    var subPageB = require('./subPageB')
    },'subPageB')// 指定chunk名称
}


//ensure的时候代码不会执行 需要在下面加载一次
require.ensure(['lodash'],function(){
    var _ = require('lodash')
    _.join([1,2,3])
},'vendor')// 指定chunk名称


export default 'pageA'
```

![](https://poetries1.gitee.io/img-repo/2019/10/648.png)

> 这时候这有`pageA`中才有`moduleA`

![](https://poetries1.gitee.io/img-repo/2019/10/649.png)

> 新建一个html验证是否动态加载

```html
<html>
    <body>
        <script src="./dist/pageA.bundle.js"></script>
    </body>
</html>
```


![](https://poetries1.gitee.io/img-repo/2019/10/650.png)


**import()动态加载的写法**

```js
//src/pageA.js

require.include('./moduleA')

var page = 'subPageA'

if(page === 'subPageA'){
 // 指定chunkName /** webpackChunkName: 'subPageA' **/ 
  import(/** webpackChunkName: 'subPageA' **/,'./subPageA').then(function(subPageA){
      console.log(subPageA)
  })
}else{
  import(/** webpackChunkName: 'subPageB' **/'./subPageB').then(function(subPageB){
      console.log(subPageB)
  })
}

// 异步加载lodash
//ensure的时候代码不会执行 需要在下面加载一次
require.ensure(['lodash'],function(){
    var _ = require('lodash')
    _.join([1,2,3])
},'vendor')// 指定chunk名称


export default 'pageA'
```

> 如果`/** webpackChunkName: 'subPageA' **/`相同，则会合并处理

合并了`subPageA`和`subPageB`

![](https://poetries1.gitee.io/img-repo/2019/10/651.png)

来看看打包后的文件，既有A、B

![](https://poetries1.gitee.io/img-repo/2019/10/652.png)

**在`webpack`代码分割中使用`async`异步加载**

```js
module.exports = {
    entry: {
        "pageA": "./src/pageA",
        "pageB": "./src/pageB",
        "vendor": ['loash']//业务代码和第三方代码区分开,给loash单独打一个包
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].bundle.js',
        chunkFilename: '[name].chunk.js'
    },
    plugins: [
    // add 异步模块
    new webpack.optimize.CommonsChunkPlugin({
        aysnc:'async-common',//异步共同的东西
        children: true,
        names: ['vendor','manifest']
        minChunks: Infinity
    })
     
     
    // 提取vendor、取业务代码manifest
     new webpack.optimize.CommonsChunkPlugin({
         //把entry的vendor代码和这里的common（webpack打包的）代码合并
         names: ['vendor','manifest']
         minChunks: Infinity
     })
     
    ]
}
```

```js
//src/subPageA.js


import './moduleA'

console.log('this. is subPageA')

export default 'subPageA'
```

```js
//src/subPageB.js


import './moduleA'

console.log('this. is subPageB')

export default 'subPageB'
```

```js
//src/subPageB.js


import './moduleA'

console.log('this. is moduleA')

export default 'moduleA'
```


```js
//src/pageA.js

// 异步加载不能include 否则会和pageA打包到一起
// require.include('./moduleA')

import _ from 'lodash'

var page = 'subPageA'

if(page === 'subPageA'){
 // 指定chunkName /** webpackChunkName: 'subPageA' **/ 
  import(/** webpackChunkName: 'subPageA' **/,'./subPageA').then(function(subPageA){
      console.log(subPageA)
  })
}else{
  import(/** webpackChunkName: 'subPageB' **/'./subPageB').then(function(subPageB){
      console.log(subPageB)
  })
}

// === lodash不在异步加载
//ensure的时候代码不会执行 需要在下面加载一次
//require.ensure(['lodash'],function(){
//    var _ = require('lodash')
//    _.join([1,2,3])
//},'vendor')// 指定chunk名称


export default 'pageA'
```

```js
//src/pageB.js

import _ from 'lodash'

var page = 'subPageB'

if(page === 'subPageA'){
 // 指定chunkName /** webpackChunkName: 'subPageA' **/ 
  import(/** webpackChunkName: 'subPageA' **/,'./subPageA').then(function(subPageA){
      console.log(subPageA)
  })
}else{
  import(/** webpackChunkName: 'subPageB' **/'./subPageB').then(function(subPageB){
      console.log(subPageB)
  })
}

// === lodash不在异步加载
//ensure的时候代码不会执行 需要在下面加载一次
//require.ensure(['lodash'],function(){
//    var _ = require('lodash')
//    _.join([1,2,3])
//},'vendor')// 指定chunk名称


export default 'pageB'
```

![](https://poetries1.gitee.io/img-repo/2019/10/653.png)
![](https://poetries1.gitee.io/img-repo/2019/10/654.png)


> 这样就把`subpageA`和`subPageB`共同依赖的`moduleA`异步提取出来


### 3.5 处理 CSS 和 CSS 模块化

**引入css**

> 需要两个`loader`，`style-loader`(创建标签到文档流中)、`css-loader`(可以`import`一个样式文件，使得在`js`中可以使用)

**Style-Loader**

> `style-loader`除了本身，还有这几个`loader`

- `style-loader/url` 可以注入link标签到页面
- `style-loader/useable` 控制样式是否插入到页面中

Style-Loader的options

- `insertAt` （插入位置）
- `insertInto` （插入到`dom`）
- `singleton` （是否只使用一个`style` 标签）
- `transform` （转化，浏览器环境下，插入页面前）

例子

```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: './dist/', //指定从项目中哪里引入资源 
        filename: '[name].bundle.js'
    },
    module: {
        // loader解析从后往前处理
        rules: [
            {
                test: /\.css$/,
                use: [
                    {
                        //loader: 'style-loader',
                        loader: 'style-loader/url', //使用这个可以往页面注入link标签 而不是style,这个并不常用
                    },
                    {
                        //loader: 'css-loader',
                        loader: 'file-loader'//使用这个可以往页面注入link标签 而不是style 这个并不常用
                    }
                ]
            }
        ]
    }
}
```

**CSS-Loader**

options

- `alias` （解析的别名）
- `importLoader` （`@import` ）
- `Minimize` （是否压缩）
- `modules` （启用`css-modules`）

**CSS-Modules**

```
localIdentName: '[path][name]__[local]--[hash:base64:5]'
```

例子

```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: './dist/', //指定从项目中哪里引入资源 
        filename: '[name].bundle.js'
    },
    module: {
        // loader解析从后往前处理
        rules: [
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader',
                        options: { 
                           //合并多个style为一个
                            singleton:true
                        }
                    },
                    {
                        loader: 'css-loader',
                        options: {
                           minimize:true,
                           modules: true,
                           // css模块化
                           localIdentName: '[path][name]_[local]_[hash:base64:5]'
                        }
                    }
                ]
            }
        ]
    }
}
```


**配置Less / Sass**

```bash
npm install less-loader less  --save-dev
npm install sass-loader node-sass --save-dev
```


例子

```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: './dist/', //指定从项目中哪里引入资源 
        filename: '[name].bundle.js'
    },
    module: {
        // loader解析从后往前处理
        rules: [
            {
                test: /\.(css|less)$/,
                use: [
                    {
                        loader: 'style-loader',
                        options: { 
                           //合并多个style为一个
                            singleton:true
                        }
                    },
                    {
                        loader: 'css-loader',
                        options: {
                           minimize:true,
                           modules: true,
                           // css模块化
                           localIdentName: '[path][name]_[local]_[hash:base64:5]'
                        }
                    },
                    {
                        loader: 'less-loader'
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            }
        ]
    }
}
```


**提取 CSS**

- `extract-loader`
- `ExtractTextWebpackPlugin`


例子

```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: './dist/', //指定从项目中哪里引入资源 
        filename: '[name].bundle.js'
    },
    module: {
        // loader解析从后往前处理
        rules: [
            {
                test: /\.(css|less)$/,
                use:
                ExtractTextWebpackPlugin.extra({
                    // 提取css并不会自动加入到文档中，需要在HTML手动加入css文件
                    fallback: {
                        loader: 'style-loader',
                        options: { 
                           //合并多个style为一个
                            singleton:true
                        }
                    },
                    // 处理css
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                               minimize:true,
                               modules: true,
                               // css模块化
                               localIdentName: '[path][name]_[local]_[hash:base64:5]'
                        }
                        },
                        {
                            loader: 'less-loader'
                        },
                        {
                            loader: 'sass-loader'
                        }
                    ]
                })
            }
        ]
    },
    plugins: [
        new ExtractTextWebpackPlugin({
            filename: '[name].min.css',
            allChunks: false //指定提取css范围，true所有import进来的css
        })
    ]
}
```

![](https://poetries1.gitee.io/img-repo/2019/10/655.png)

### 3.6 PostCSS in Webpack

安装

- `postcss`
- `postcss-loader`
- `Autoprefixer`
- `cssnano`
- `postcss-cssnext`

例子

```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: './dist/', //指定从项目中哪里引入资源 
        filename: '[name].bundle.js'
    },
    module: {
        // loader解析从后往前处理
        rules: [
            {
                test: /\.(css|less)$/,
                use:
                ExtractTextWebpackPlugin.extra({
                    // 提取css并不会自动加入到文档中，需要在HTML手动加入css文件
                    fallback: {
                        loader: 'style-loader',
                        options: { 
                           //合并多个style为一个
                            singleton:true
                        }
                    },
                    // 处理css
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                               minimize:true,
                               modules: true,
                               // css模块化
                               localIdentName: '[path][name]_[local]_[hash:base64:5]'
                        }
                        },
                        {
                            loader: 'less-loader'
                        },
                        {
                            loader: 'sass-loader'
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                ident: 'postcss',
                                plugins: [
                                    require('antoprefixer')()
                                ]
                            }
                        }
                    ]
                })
            }
        ]
    },
    plugins: [
        new ExtractTextWebpackPlugin({
            filename: '[name].min.css',
            allChunks: false //指定提取css范围，true所有import进来的css
        })
    ]
}
```

### 3.7 Tree shaking

#### 3.7.1 JS Tree shaking

**使用场景**

- 常规优化
- 引入第三方库的某一个功能

 例子

```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: './dist/', //指定从项目中哪里引入资源 
        filename: '[name].bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['env'],
                            plugins: [
                                // lodash Tree shaking
                                'lodash'
                            ]
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new ExtractTextWebpackPlugin({
            filename: '[name].min.css',
            allChunks: false //指定提取css范围，true所有import进来的css
        })
        // Tree shaking
        new webpack.optimize.UglifyJsPlugin({
            
        })
    ]
}
```

> 有些库不是es模块写的，并不能`tree shaking`。需要借助其他工具 

```
npm i babel-loader babel-core babel-preset-env babel-plugin-lodash --save
```

> lodash Tree不生效

- `lodash-es` --> no
- `babel-lugin-lodash` --->working

> 查看模块是否Tree Shaking方式：去第三方库index.js中看模块书写方式是否是es

#### 3.7.2 CSS Tree shaking

> 主要使用 `purifycss-webpack`

例子

```js
const glob = require('glob-all')

module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: './dist/', //指定从项目中哪里引入资源 
        filename: '[name].bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['env'],
                            plugins: [
                                // lodash Tree shaking
                                'lodash'
                            ]
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new ExtractTextWebpackPlugin({
            filename: '[name].min.css',
            allChunks: false //指定提取css范围，true所有import进来的css
        })
        
        // 放到ExtractTextWebpackPlugin后面
        new PurifyCss({
            paths: glob.sync([
                path.join(__dirname,'./*.html'),
                path.join(__dirnname,'./src/*.js')
            ])
        })
        
        // Tree shaking
        new webpack.optimize.UglifyJsPlugin({
            
        })
    ]
}
```


## 四、由浅入深Webpack

### 4.1 文件处理 

#### 4.1.1 图片处理

- `css`中引入图片
- 自动合成雪碧图
- 压缩图片
- `Base64`编码

> 处理需要用到的`loader`

- `file-loader` `css`中引入图片
- `url-loader` `base64`编码
- `img-loader` 压缩图片
- `postcss-sprites`合成雪碧图

#### 4.1.2 处理雪碧图、base64、压缩图片

```js
module.exports = {
    module: {
         rules: [
            {
                test: /\.(css|less)$/,
                use:
                extractLess.extract({
                    // 提取css并不会自动加入到文档中，需要在HTML手动加入css文件
                    fallback: {
                        loader: 'style-loader',
                        options: { 
                           //合并多个style为一个
                            singleton:true
                        }
                    },
                    // 处理css
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                               minimize:true,
                               modules: true,
                               // css模块化
                               localIdentName: '[path][name]_[local]_[hash:base64:5]'
                        }
                        },
                        {
                            loader: 'less-loader'
                        },
                        {
                            loader: 'sass-loader'
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                ident: 'postcss',
                                plugins: [
                                    // 合并雪碧图
                                    require('postcss-sprites')({
                                        // 指定雪碧图输出路径
                                        spritePath: 'dist/assets/imgs/sprites',
                                        retina: true // 处理苹果高清retina 图片命名需要 xx@2x.png,对应的图片的css大小设置也要减小一半 
                                    })
                                ]
                            }
                        }
                    ]
                })
            },
            {
                test: /\.(png|jpg|gif)$/,
                use:[
                    //{
                    //    loader: //'file-loader',//处理图片
                    //    options: {
                    //       publicPath:'',// 使得图片地址可以访问
                    //       outputPath: 'dist/'
                    //       useRelativePath:true
                        //}
                    
                    //}
                    // url-loader会把图片转成base64
                    {
                        loader: 'url-loader',
                        options: {
                            name: '[name].min.[ext]' //5kb内会转成base64 ,否则输出图片路径
                            limit: 1000, 
                            publicPath:'',
                            outputPath: 'dist/',
                            useRelativePath:true
                        }
                    },
                    // 压缩图片
                    {
                        loader: 'img-loader',
                        options: {
                            pngquant: {
                                //图片质量
                                quality:80
                            }
                        }
                    },
                    
                ]
            }
        ]
    }
}
```

#### 4.1.2 处理字体文件

- `file-loader`
- `url-loader`

```js
module.exports = {
    module: {
         rules: [
            {
                test: /\.(css|less)$/,
                use:
                extractLess.extract({
                    // 提取css并不会自动加入到文档中，需要在HTML手动加入css文件
                    fallback: {
                        loader: 'style-loader',
                        options: { 
                           //合并多个style为一个
                            singleton:true
                        }
                    },
                    // 处理css
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                               minimize:true,
                               modules: true,
                               // css模块化
                               localIdentName: '[path][name]_[local]_[hash:base64:5]'
                        }
                        },
                        {
                            loader: 'less-loader'
                        },
                        {
                            loader: 'sass-loader'
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                ident: 'postcss',
                                plugins: [
                                    // 合并雪碧图
                                    require('postcss-sprites')({
                                        // 指定雪碧图输出路径
                                        spritePath: 'dist/assets/imgs/sprites',
                                        retina: true // 处理苹果高清retina 图片命名需要 xx@2x.png,对应的图片的css大小设置也要减小一半 
                                    })
                                ]
                            }
                        }
                    ]
                })
            },
            {
                test: /\.(png|jpg|gif)$/,
                use:[
                    //{
                    //    loader: //'file-loader',//处理图片
                    //    options: {
                    //       publicPath:'',// 使得图片地址可以访问
                    //       outputPath: 'dist/'
                    //       useRelativePath:true
                        //}
                    
                    //}
                    // url-loader会把图片转成base64
                    {
                        loader: 'url-loader',
                        options: {
                            name: '[name].min.[ext]' //5kb内会转成base64 ,否则输出图片路径
                            limit: 1000, 
                            publicPath:'',
                            outputPath: 'dist/',
                            useRelativePath:true
                        }
                    },
                    // 压缩图片
                    {
                        loader: 'img-loader',
                        options: {
                            pngquant: {
                                //图片质量
                                quality:80
                            }
                        }
                    },
                    // 处理字体文件
                    {
                        test: /\.(eot|woff2|woff|ttf|svg)$/,
                        use: [
                            {
                                loader:'url-loader',
                                options: {
                                    name: '[name].min.[ext]' //5kb内会转成base64 ,否则输出图片路径
                                    limit: 5000, 
                                    publicPath:'',
                                    outputPath: 'dist/',
                                    useRelativePath:true
                                }
                            }
                        ]
                    }
                    
                ]
            }
        ]
    }
}
```


#### 4.1.3 处理第三方 JS 库

> 处理第三方库 用到`providePlugin`、`imports-loader`

**1.providePlugin**

以引入`jQuery`为例

```
npm i jquery
```

```js
module.exports = {
    plugins: [
        new webpack.ProvidePlugin({
            // 在全局注入jQuery变量
            $:'jquery'
        })
    ]
}
```

引入本地`libs`中的`jQuery`

```js
module.exports = {
    resolve: {
        alias: {
            // $确切匹配 把jQuery这个关键字解析到某个目录下
            jquery$:path.resolve(__dirname,'src/libs/jquery.min.js')
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            // 在全局注入jQuery变量
            $:'jquery'
        })
    ]
}
```

**2.imports-loader**

```js
module.exports = {
    module:{
        rules:[
            {
                test:path.resolve(__dirname,'src/app.js'),
                use:[
                    {
                        loader: 'imports-loader',
                        options: {
                            $: 'jquery'
                        }
                    }
                ]
            }
        ]
    }
}
```


### 4.2 HTML in webpack(自动生成HTML)

> 自动生成`HTML`，把这个页面需要的`js`、`css`插入到页面中


#### 4.2.1 生成 HTML


> `htmlWebpackPlugin`

options

- `template`
- `filename`
- `minify` 是否压缩
- `chunks` 
- `inject` 是否让`css、js`通过标签形式插入到页面中


```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js'
    },
    plugin:[
        new htmlWebpackPlugin({
            filename:'index.html', // 不传默认index.html
            template: './index.html',//传入模板
            inject:true,//控制js\css是否插入到页面
            minify: {
                collapseWhitespace:true //压缩空格
            },
            chunks:['app']//指定chunks会把跟这个入口相关的chunks插入到页面中
        })
    ]
}
```


#### 4.2.2 HTML 中引入图片

> 需要用到`html-loader`

**html-loader**

options

- `attrs: [img:src]`

```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
        publicPath:'/' //网站路径为/ 图片等资源引用不会发生错误
    },
    module:{
        rules:[
            {
                loader: 'url-loader',
                options: {
                    name: '[name].min.[ext]' //5kb内会转成base64 ,否则输出图片路径
                    limit: 1000, 
                    publicPath:'',
                    outputPath: 'assets/imgs/',
                    //useRelativePath:true // 这里不能使用这个 因为图片路径在HTML中、css中都存在，打包的时候图片会放错地方。需要用到绝对路径，在output指定publicPath:'/'
                }
            },
            // 处理HTML中的图片引用路径问题
            {
                test: /\.html$/,
                use: [
                    {
                        loader: 'html-loader',
                        options: {
                            attrs: ['img:src','img:data-src']
                        }
                    }
                ]
            }
        ]
    }
}
```

**require在HTML中引入图片**

```html
<img src="${require('./public/imgs/xx.png)}" />
```


#### 4.2.3 配合优化

> 提前载入webpack加载代码

- `inline-manifest-webpack-plugin`
- `html-webpack-inline-chunk-plugin`

建议使用 `html-webpack-inline-chunk-plugin`

```
npm i html-webpack-inline-chunk-plugin
```

```js
var HTMLInlieChunk = require('html-webpack-inline-chunk-plugin')

module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
        publicPath:'/'
    },
    plugin:[
        new htmlWebpackPlugin({
            filename:'index.html', // 不传默认index.html
            template: './index.html',//传入模板
            inject:true,//控制js\css是否插入到页面
            minify: {
                collapseWhitespace:true //压缩空格
            },
            chunks:['app']//指定chunks会把跟这个入口相关的chunks插入到页面中
        })
        new webpack.mdtimize.CommonsChunkPlugin({
            name: 'manifest'
        })
        new HTMLInlieChunk({
            inlineChunks: ['manifest'] //把webpack生成的manifest提取到HTML文件script中，减少请求
        })
    ]
}
```


## 五、Webpack 环境配置

### 5.1 Webpack Watch Mode

```js
webpack --watch

// 简写
webpack -w
```

```js
//webpack.config.js

var webpack = require('wepback')
var PurifyWebpack = require('pruifycss-webpack')
var ExtractTextWebpackPlugin = require('extract-text-webpack-plugin')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var CleanWebpack = require('clean-webpacl-plugin')

var path = require('path')
var glob = rquire('glob-all')//处理多个路径

var extractLess = new ExtractTextWebpackPlugin({
    filename: 'css/[name]-bundle-[hash:5].css'
})

module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name]-bundle-[hash:5].js'
    },
    module:{
        rules: [
            {
                test: /\.(css|less)$/,
                use:
                extractLess.extract({
                    // 提取css并不会自动加入到文档中，需要在HTML手动加入css文件
                    fallback: {
                        loader: 'style-loader',
                        options: { 
                           //合并多个style为一个
                            singleton:true
                        }
                    },
                    // 处理css
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                               minimize:true,
                               modules: true,
                               // css模块化
                               localIdentName: '[path][name]_[local]_[hash:base64:5]'
                        }
                        },
                        {
                            loader: 'less-loader'
                        },
                        {
                            loader: 'sass-loader'
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                ident: 'postcss',
                                plugins: [
                                    // 合并雪碧图
                                    require('postcss-sprites')({
                                        // 指定雪碧图输出路径
                                        spritePath: 'dist/assets/imgs/sprites',
                                        retina: true // 处理苹果高清retina 图片命名需要 xx@2x.png,对应的图片的css大小设置也要减小一半 
                                    })
                                ]
                            }
                        }
                    ]
                })
            }
        ]
    }
    plugin: [
        new CleanWebpack()
    ]
}
```


### 5.2 Webpack Dev Server

#### 5.2.1 Dev Server

> 不能用来直接打包文件，`Dev Server`搭建本地开发，文件存在内存中

**特性**

- `live reloading`
- 路径重定向
- 支持`HTTPS`
- 浏览器中显示编译错误
- 接口代理
- 模块热更新


**dev server**

- `inline`
- `contentBase`
- `port`
- `histApiFllback`
- `https`
- `proxy`
- `hot`
- `openpage`
- `lazy`
- `overlay` 开启错误遮罩

**使用**

```
"script"{
    // 启动
    "server": "webpack-dev-server --open" 
}
```

```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        filename: '[name].[hash:5].js'
    },
    
    devServer: {
        port: 9001,
        // 输入任意路径都不会出现404 都会重定向
       // historyApiFallback: true
        historyApiFallback: {
            //从一个确定的url指向对应的文件
            //rewrites: [
            //    {
            //        from: '/pages/a',// 可以写正则
           //         to: '/pages/a.html'
            //    }
            rewrites: [
                {
                    from: /^\/([a-zA-Z0-9]+\/?)([a-zA-Z0-9]+)/
                    to: function(context){
                        return '/' + context.match[1] + context.match[2] + '.html'
                    }
                }
            ]
            ]
        }
    }
}
```


#### 5.2.2 proxy代理远程接口

- 代理远程接口请求
- `http-proxy-middleware`
- `devServer.proxy`

```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        filename: '[name].[hash:5].js'
    },
    
    devServer: {
        port: 9001,
        // 输入任意路径都不会出现404 都会重定向
       // historyApiFallback: true
        historyApiFallback: {
            //从一个确定的url指向对应的文件
            //rewrites: [
            //    {
            //        from: '/pages/a',// 可以写正则
           //         to: '/pages/a.html'
            //    }
            rewrites: [
                {
                    from: /^\/([a-zA-Z0-9]+\/?)([a-zA-Z0-9]+)/
                    to: function(context){
                        return '/' + context.match[1] + context.match[2] + '.html'
                    }
                }
            ]
            ]
        },
        proxy: {
            '/api': {
                target: 'https://blog.poetries.top',//代理到服务器
                changeOrigin:true,
                logLevel: 'debug',
                // pathRewite: { },
                headers:{}// 请求头
            }
        }
    }
}
```

#### 5.2.3 模块热更新

- 保持应用的数据状态
- 节省调试时间
- 不需要刷新

- `devServer.hot`
- `webpack.HotModleReplacementPlugin`
- `webpack.NamedModulesPlugin` 看到模块更新的路径


**Module Hot Reloading**

- `module.hot`
- `module.hot.accept`


```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        filename: '[name].[hash:5].js'
    },
    
    devServer: {
        port: 9001,
        // 输入任意路径都不会出现404 都会重定向
       // historyApiFallback: true
        historyApiFallback: {
            //从一个确定的url指向对应的文件
            //rewrites: [
            //    {
            //        from: '/pages/a',// 可以写正则
           //         to: '/pages/a.html'
            //    }
            rewrites: [
                {
                    from: /^\/([a-zA-Z0-9]+\/?)([a-zA-Z0-9]+)/
                    to: function(context){
                        return '/' + context.match[1] + context.match[2] + '.html'
                    }
                }
            ]
            ]
        },
        hot:true,//开启模块热更新
        hotOnly:true,
        proxy: {
            '/api': {
                target: 'https://blog.poetries.top',//代理到服务器
                changeOrigin:true,
                logLevel: 'debug',
                // pathRewite: { },
                headers:{}// 请求头
            }
        }
    },
    plugin:[
        // 模块热更新插件
        new webpack.HotModuleReplacementPlugin()
        
        // 输出热更新路径
        new webpack.NamedModulesPlugin()
    ]
}
```

**模块热更新配置**

> 需要通过module.hot

```js
f (module.hot) {
  module.hot.accept('./library.js', function() {
    // Do something with the updated library module...
  })
}
```



#### 5.2.4 开启调试SourceMap

**Source Map调试**

把生成以后代码和之前的做一个映射

> 开启Source Map方式

**`JS Source Map`设置**

develpoment

- `eval`
- `eval-source-map`
- `cheap-eval-source-map`
- `cheap-module-eval-source-map`

> 推荐使用`cheap-module-source-map`

production

- `source-map`
- `hidden-source-map`
- `nosource-source-map`

> 推荐使用`source-map`

**`CSS Source Map`设置**

> 改变`loader`的`options`选项

- `css-loader.options.soucemap`
- `less-loader.options.soucemap`
- `sass-loader.options.soucemap`


```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        filename: '[name].[hash:5].js'
    },
    module: {
        // 处理css的每个loader加上sourceMap: true 观察css样式 可以看到对应的行号
        rules: [
            test: /\.less/,
            use: [
                {
                    loader: 'style-loader',
                    options: {
                        // singleton: true,会导致css的sourceMap不生效
                        //singleton: true,
                        sourceMap: true
                    }
                },
                {
                    loader: 'css-loader',
                    options: {
                        importLoaders: 2,
                        sourceMap: true
                    }
                },
                {
                    loader: 'less-loader',
                    options: {
                        sourceMap: true
                    }
                }
            ]
        ]
    },
    devtool: 'cheap-module-eval-source-map',//开启sourcemap
    devServer: {
        port: 9001,
        // 输入任意路径都不会出现404 都会重定向
       // historyApiFallback: true
        historyApiFallback: {
            //从一个确定的url指向对应的文件
            //rewrites: [
            //    {
            //        from: '/pages/a',// 可以写正则
           //         to: '/pages/a.html'
            //    }
            rewrites: [
                {
                    from: /^\/([a-zA-Z0-9]+\/?)([a-zA-Z0-9]+)/
                    to: function(context){
                        return '/' + context.match[1] + context.match[2] + '.html'
                    }
                }
            ]
            ]
        },
        hot:true,//开启模块热更新
        hotOnly:true,
        overlay:true,//错误提示
        proxy: {
            '/api': {
                target: 'https://blog.poetries.top',//代理到服务器
                changeOrigin:true,
                logLevel: 'debug',
                // pathRewite: { },
                headers:{}// 请求头
            }
        }
    },
    plugin:[
        // 模块热更新插件
        new webpack.HotModuleReplacementPlugin()
        
        // 输出热更新路径
        new webpack.NamedModulesPlugin()
    ]
}
```

#### 5.2.5 设置 ESLint 检查代码格式

- `eslint`
- `eslint-loader`
- `esling-plugin-html`
- `eslint-frindly-formatter` 友好提示错误

**配置eslint**

- `wepback config` 新增`loader`
- `.eslintrc`或者在`package.json`的`eslintConfig`中写

> 配置eslint的规范，推荐使用JavaScript standard style(https://standardjs.com)

需要安装以下插件

- `eslint-config-standard`
- `eslint-plugin-promise`
- `eslint-plugin-standard`
- `eslint-plugin-import`
- `eslint-plugin-node`


**eslint-loader**

- `options.failOnWarning` 出现警告
- `options.failOnError`
- `options.formatter`
- `options.outputReport`

> 设置 `devServer.overlay`在浏览器中看提示的错误

```js
// .eslintrc

module.exports = {
    root: true,
    extends: 'standard',
    plugins: [],
    env: {
        browsers: true,
        node: true // node环境
    },
    rules: {
        // 缩进
        indent: ['error', 4],
        
        //换行
        "eol-last": ['error', 'never']
    }
}
```

```js
module.exports = {
    entry: {
        app: './src/app.js'
    },
    
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        filename: '[name].[hash:5].js'
    },
    module: {
        // 处理css的每个loader加上sourceMap: true 观察css样式 可以看到对应的行号
        rules: [
            {
                test: /\.js$/,
                include: [path.resolve(__dirname,'src/')],
                exclude: [path.resolve(__dirname,'src/libs')],
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['env']
                        }
                    },
                    //eslint-loader需要在babel-loader之后处理
                    {
                        loader: 'eslint-loader',
                        options: {
                            formatter: require('eslint-frindly-formatter')
                        }
                    }
                ]
            },
            {
                test: /\.less/,
                use: [
                    {
                        loader: 'style-loader',
                        options: {
                            // singleton: true,会导致css的sourceMap不生效
                            //singleton: true,
                            sourceMap: true
                        }
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 2,
                            sourceMap: true
                        }
                    },
                    {
                        loader: 'less-loader',
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            }
        ]
    },
    devtool: 'cheap-module-eval-source-map',//开启sourcemap
    devServer: {
        port: 9001,
        // 输入任意路径都不会出现404 都会重定向
       // historyApiFallback: true
        historyApiFallback: {
            //从一个确定的url指向对应的文件
            //rewrites: [
            //    {
            //        from: '/pages/a',// 可以写正则
           //         to: '/pages/a.html'
            //    }
            rewrites: [
                {
                    from: /^\/([a-zA-Z0-9]+\/?)([a-zA-Z0-9]+)/
                    to: function(context){
                        return '/' + context.match[1] + context.match[2] + '.html'
                    }
                }
            ]
            ]
        },
        hot:true,//开启模块热更新
        hotOnly:true,
        overlay:true,//错误提示
        proxy: {
            '/api': {
                target: 'http://blog.poetries.top',//代理到服务器
                changeOrigin:true,
                logLevel: 'debug',
                // pathRewite: { },
                headers:{}// 请求头
            }
        }
    },
    plugin:[
        // 模块热更新插件
        new webpack.HotModuleReplacementPlugin()
        
        // 输出热更新路径
        new webpack.NamedModulesPlugin()
    ]
}
```

#### 5.2.6 区分开发环境 和 生产环境

**开发环境**

- 模块热更新
- `sourceMap`
- 接口代理
- 代码规范检查

**生产环境**

- 提取公共代码
- 压缩
- 文件压缩或`base64`编码
- 去除无用的代码

**共同点**

- 入口一致
- loader处理
- 解析配置一致

> 使用`webpack-merge`合并公共配置

- `webpack.dev.conf.js`
- `wepback.prod.conf.js`
- `webpack.common.conf.js`

```json
"scripts":{
    "server": "wepback-dev-server --env development --open --config build/webpack.common.config.js",
    "build": "wepback --env production --open --config build/webpack.common.config.js"
}
```

> 公共配置 `build/webpack.common.conf.js`

```js
const merge = require('webpack-merge')
const webpack = require('webpack')
const path = require('path')

const chalk = require('chalk')
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')

const developmentConfig = require('./webpack.dev.conf')
const productionConfig = require('./webpack.prod.conf')


// 根据环境变量生成配置
const generateConfig = env =>{
    const extractLess = new ExtractTextWebpackPlugin({
        filename: 'css/[name]-bundle-[hash:5].css'
    })
    const scriptLoader = [
      'babel-loader'
    ].concat(env === 'production'
      ? []
      : [{
          loader: 'eslint-loader',
          options: {
              formatter: require('eslint-friendly-formatter')
          }
      }]
    )
    const cssLoaders = [
      {
          loader: 'css-loader',
          options: {
              importLoaders: 2,
              sourceMap: env==='development'
          }
      },
      {
        loader: "postcss-loader",
        options: {
          ident: "postcss",
          sourceMap: env==='development',
          plugins: [

          ].concat(env==='production'
            ? require('postcss-sprites')({
              spritePath: 'build/assets/imgs/sprites',
              retina: true
            })
            :[]
          )
        }
      },
      {
          loader: 'less-loader',
          options: {
              sourceMap: env==='development'
          }
      }
    ]
    const styleLoader = env === 'production'
          // 线上需要提取css成文件
          ? extractLess.extract({
            fallback:'style-loader',
            use: cssLoaders
          })
          : ['style-loader'].concat(cssLoaders)

    const fileLoader = env === 'development'
        ? [{
            loader: 'file-loader',
            options: {
              name: '[name]-[hash:5].[ext]',
              outputPath: 'assets/imgs/'
            }
          }]
        : [{
          loader: 'url-loader',
          options: {
            name: '[name]-[hash:5].[ext]',
            limit: 1000,//1k
            outputPath: 'assets/imgs/'
          }
        }]

    return {
      entry: {
          app: './src/index.js'
      },
      output: {
          path: path.resolve(__dirname, '../build'),
          publicPath: '/',
          filename: '[name]-bundle-[hash:5].js'
      },
      // 路径解析
      resolve: {
          alias: {
              // jquery$: path.resolve(__dirname, '../src/libs/jquery.min.js')
          }
      },
      module: {
          rules: [
              {
                  test: /\.(js|jsx)$/,
                  include: [path.resolve(__dirname,'../src/')],
                  exclude : /node_modules/,
                  use: scriptLoader
              },
              {
                  test: /\.(less|css|scss)/,
                  use: styleLoader
              },
              {
                test: /\.(png|jpg|jpeg|gif)$/,
                use: fileLoader.concat(env==='production'
                  ? [
                    {
                      loader: 'img-loader',
                      options: {
                        pngquant: {
                          quality: 80
                        }
                      }
                    }
                  ]
                  : []
                )
              },
              {
                test: /\.(eot|woff2?|ttf|svg)$/,
                use: fileLoader
              }
          ]
      },
      plugins: [
        extractLess,

        new ProgressBarPlugin({
          format: '  build [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
          clear: false
        }),
        new HtmlWebpackPlugin({
    			inject: true,
    			template: path.resolve(__dirname,'../public/index.html'),
          minify: {
            collapseWhitespace: true
          }
    		}),
        new webpack.ProvidePlugin({
          $: 'jquery'
        })
      ]
    }
}


module.exports = env =>{
  const config = env==='development' ? developmentConfig : productionConfig
  return merge(generateConfig(env),config)
}
```


> 开发环境配置 `build/webpack.dev.conf.js`

```js
const webpack = require('webpack')
const path = require('path')

module.exports = {
    devtool: 'cheap-module-eval-source-map',//开启sourcemap
    devServer: {
        port: 9001,
        // 输入任意路径都不会出现404 都会重定向
        historyApiFallback: true,
        // historyApiFallback: {
            //从一个确定的url指向对应的文件
            //rewrites: [
            //    {
            //        from: '/pages/a',// 可以写正则
           //         to: '/pages/a.html'
            //    }
            // rewrites: [
            //     {
            //         from: /^\/([a-zA-Z0-9]+\/?)([a-zA-Z0-9]+)/
            //         to: function(context){
            //             return '/' + context.match[1] + context.match[2] + '.html'
            //         }
            //     }
            // ]
        // },
        hot:true,//开启模块热更新
        hotOnly:true,
        overlay:true,//错误提示
        proxy: {
            '/api': {
                // target: 'http://blog.poetries.top',//代理到服务器
                changeOrigin:true,
                logLevel: 'debug',
                // pathRewite: { },
                headers:{}// 请求头
            }
        }
    },
    plugins: [
      // 模块热更新插件
       new webpack.HotModuleReplacementPlugin(),

       // 输出热更新路径
       new webpack.NamedModulesPlugin()
    ]
}


```


> 生产环境配置 `build/webpack.prod.conf.js`

```js
const webpack = require('webpack')
const PurifyCssWebpack = require('purifycss-webpack')
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')

const path = require('path')
const glob = require('glob-all')//处理多个路径

module.exports = {
  plugins: [
    new PurifyCssWebpack({
      paths: glob.sync([
        './*html',
        './src/*js'
      ])
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest'
    }),
    new HtmlWebpackPlugin({
      inlineChunks: ['manifest']
    }),
    new webpack.optimize.UglifyJsPlugin(),
    new CleanWebpackPlugin(['../build'])
  ]
}
```


### 5.3 使用 middleware 来搭建开发环境

> 可以更灵活配置,需要以下插件搭建

- `Express or koa`
- `webpack-dev-middleware`
- `webpack-hot-middleware` 热更新
- `http-proxy-middleware` 代理
- `connect-history-api-fallback` 地址rewrite
- `opn` 命令工具打开浏览器页面

```js
// build/server.js

/**
 * 使用middleware搭建服务:更灵活配置,不在使用webpack-dev-server
 * @type {[type]}
 */

const express = require('express')
const webpack = require('webpack')
const opn = require('opn')

const app = express()
const port = 3000

//把express和配置联合起来 需要用到middleware
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const proxyMiddleware = require('http-proxy-middleware')
const historyApiFallback = require('connect-history-api-fallback')

const config = require('./webpack.common.conf')({env:'development'})
const compiler = webpack(config) //给express使用

const proxyTable = require('./proxy')

for(let context in proxyTable){
  app.use(proxyMiddleware(context, proxyTable[context]))
}

app.use(historyApiFallback(require('./historyfallback')))

app.use(webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath
}))

app.use(webpackHotMiddleware(compiler))


app.listen(port, function(){
  console.log('> Ready on:' + port)
  opn('http://localhost:' + port)
})
```


## 六、webpack实战场景

### 6.1 分析打包结果

> http://blog.poetries.top/2018/11/20/webpack-bundleAnalyzer/


### 6.2 优化打包速度


#### 6.2.1 方法一：分开vendor和app

> 分开第三方代码和业务代码，借助`DllPlugin`和`DllReferencePlugin`

**之前的打包时间**

> 现在我们来优化这个时间

![](https://poetries1.gitee.io/img-repo/2019/10/656.png)

**第一步：新建`webpack.dll.conf.js`**

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
    path: path.resolve(__dirname, "../dll/"),
    filename: '[name].dll.js',
    library: '[name]'
  },
  plugins: [
    new webpack.DllPlugin({
      path: path.join(__dirname,'../dll/','[name]-manifest.json'),
      name: '[name]'
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

![](https://poetries1.gitee.io/img-repo/2019/10/657.png)

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

![](https://poetries1.gitee.io/img-repo/2019/10/658.png)

编译时间大大减少了


#### 6.2.2 方法二：UglifyJsPlugin并行处理

**UglifyJsPlugin**

- `parallel`
- `cache`

```js
// build/webpack.prod.conf.js
module.exports = {
   plugins: [
        new UglifyJsPlugin({
          parallel:true, //并行处理
          cache: true
        })
   ]
}
```


#### 6.2.3 方法三：happyPack

> `happyPack`把所有串行的东西并行处理,使得`loader`并行处理，较少文件处理时间

https://www.npmjs.com/package/happypack

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

![](https://poetries1.gitee.io/img-repo/2019/10/659.png)


#### 6.2.4 方法四：较少babel-loader编译时间

**babel-loader**

> 开启缓存，指定编译范围

- `options.cache`
- `include`
- `exclude`

#### 6.2.5 其他

- 减少`resolve`
- `Devtool`去除`sourcemap`
- `cache-loader`
- 升级`node`
- 升级`webpack`


### 6.3 长缓存优化

**场景**

> 改变`app`代码，`vendor`变化

**解决**

- 提取`vendor`
- `hash`--> `chunkhash`(把`hash`变为代码块的`hash`，而不是文件的`hash`)
- 提取`webpack runtime`

```js
output: {
    path: path.resolve(__dirname, '../build/'),
    filename: 'static/js/[name].[chunkhash:5].js',
    chunkFilename: 'static/js/[name].[chunkhash:8].chunk.js',
    publicPath: '/' //浏览器中访问资源的路径
}
```

![](https://poetries1.gitee.io/img-repo/2019/10/660.png)

> 每次打包`vendor`都不会变化，这样就达到了缓存的目的（服务端开启`cache-ctrol`）

**场景：引入新模块，模块顺序变化，vendor hash变化**

> 解决： `NamedChunksPlugin` `NamedModulesPlugin`

对于动态模块引入需要给名称

### 6.4 多页面应用

#### 6.4.1 多页面特点

- 多入口
- 多页面`HTML`
- 每个页面不同的`chunk`
- 每个页面不同的参数

#### 6.4.2 多页面多配置

> `wepback从3.1.0`开始支持

 **优点**：
 - 可以使用`parallel-webpack`(并行处理多份配置)提高打包速度
- 配置更独立、灵活

**缺点**

- 不能多页面之间共享代码

```js
//package.json

{
  "name": "多页面配置",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "clean-webpack-plugin": "^1.0.0",
    "css-loader": "^1.0.1",
    "ejs-loader": "^0.3.1",
    "file-loader": "^2.0.0",
    "html-loader": "^0.5.5",
    "html-webpack-plugin": "^3.2.0",
    "react": "^16.3.1",
    "style-loader": "^0.23.1",
    "webpack": "^4.26.0",
    "webpack-merge": "^4.1.4"
  },
  "scripts": {},
  "devDependencies": {
    "extract-text-webpack-plugin": "^4.0.0-beta.0"
  }
}

```


```js
/**
 * 多页面多配置
 * @type {[type]}
 */

const merge = require('webpack-merge')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpack = require('clean-webpack-plugin')
const ExtractTextwebpack = require('extract-text-webpack-plugin')

const path = require('path')

const baseConfig = {
    mode: 'development',
    entry: {
        react: 'react'
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ExtractTextwebpack.extract({
            fallback: 'style-loader',
            use: 'css-loader'
          })
        }
      ]
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name].[chunkhash].js'
    },
    plugins: [
        new ExtractTextwebpack({
          filename: 'css/[name].[hash].css'
        }),
        new CleanWebpack(['./dist'])
    ],
    optimization: {
      splitChunks: {
          cacheGroups: {
              commons: {
                  // commons里面的name就是生成的共享模块bundle的名字
                  name: "react",
                  // chunks 有三个可选值，”initial”, “async” 和 “all”. 分别对应优化时只选择初始的chunks，所需要的chunks 还是所有chunks
                  chunks: "initial",
                  minChunks: Infinity
              }
          }
      }
    }
}

//生成每个页面配置
const generatePage = function({
    title = '',
    entry = '',
    template = './src/index.html',
    name = '',
    chunks = []
} = {}){
    return {
        entry,
        plugins: [
            new HtmlWebpackPlugin({
                chunks,
                template:`!!html-loader!${template}`,
                filename: name + '.html'
            })
        ]
    }
}

const pages = [
  generatePage({
      title: 'page A',
      entry: {
        a: './src/pages/a'
      },
      name: 'a',
      chunks: ['react','a']
  }),
  generatePage({
      title: 'page B',
      entry: {
        b: './src/pages/b'
      },
      name: 'b',
      chunks: ['react','b']
  }),
  generatePage({
      title: 'page C',
      entry: {
        c: './src/pages/c'
      },
      name: 'c',
      chunks: ['react','c']
  })
]

module.exports = pages.map(page=>merge(baseConfig, page))

```





#### 6.4.3 多页面单配置

> 多个页面共享一个配置

- 优点：可以共享各个`entry`之间公用代码
- 缺点：打包速度比较慢，输出的内容比较复杂



```js
/**
 * 多页面单配置
 */

 const merge = require('webpack-merge')
 const webpack = require('webpack')
 const HtmlWbpackPlugin = require('html-webpack-plugin')
 const CleanWebpack = require('clean-webpack-plugin')
 const ExtractTextwebpack = require("extract-text-webpack-plugin")

 const path = require('path')

 const baseConfig = {
     mode: 'development',
     entry: {
         react: 'react'
     },
     module: {
       rules: [
         {
           test: /\.css$/,
           use: ExtractTextwebpack.extract({
             fallback: 'style-loader',
             use: 'css-loader'
           })
         }
       ]
     },
     output: {
         path: path.resolve(__dirname, 'dist'),
         filename: 'js/[name].[chunkhash].js'
     },
     plugins: [
         new ExtractTextwebpack({
           filename: 'css/[name].[hash].css'
         }),
         new CleanWebpack(path.resolve(__dirname, 'dist'))
     ],
     optimization: {
       splitChunks: {
           cacheGroups: {
               commons: {
                   // commons里面的name就是生成的共享模块bundle的名字
                   name: "react",
                   // chunks 有三个可选值，”initial”, “async” 和 “all”. 分别对应优化时只选择初始的chunks，所需要的chunks 还是所有chunks
                   chunks: "initial",
                   minChunks: Infinity
               }
           }
       }
     }
 }

 //生成每个页面配置
 const generatePage = function({
     title = '',
     entry = '',
     template = './src/index.html',
     name = '',
     chunks = []
 } = {}){
     return {
         entry,
         plugins: [
             new HtmlWbpackPlugin({
                 chunks,
                 template:`!!html-loader!${template}`,
                 title,
                 filename: name + '.html'
             })
         ]
     }
 }

 const pages = [
   generatePage({
       title: 'page A',
       entry: {
         a: './src/pages/a'
       },
       name: 'a',
       chunks: ['react','a']
   }),
   generatePage({
       title: 'page B',
       entry: {
         b: './src/pages/b'
       },
       name: 'b',
       chunks: ['react','b']
   }),
   generatePage({
       title: 'page C',
       entry: {
         c: './src/pages/c'
       },
       name: 'c',
       chunks: ['react','c']
   })
 ]

 module.exports = merge([baseConfig].concat(pages))

```

> 完整例子 https://github.com/poetries/webpack-config-demo


## 七、更多学习

- [webpack4.0 入门篇 - 构建前端开发的基本环境](https://juejin.im/post/5bb089e86fb9a05cd84935d0)
- [用于前端开发的webpack4配置[带注释]](https://juejin.im/post/5be45723e51d45305c2ceaf0?utm_source=gold_browser_extension#heading-2)
