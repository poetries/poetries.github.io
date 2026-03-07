---
title: webpack4配置详解
date: 2018-11-18 14:32:12
tags: webpack
categories: Front-End
---

> 来源网络

## 一、entry

```js
//方式一：单文件写法
entry: {
	index: './src/pages/route.js',
	//about: './src/pages/about.js',
	//other:()=>{...}
}

//方式二：多文件写法
entry: {
	/*index:[
		'webpack-hot-middleware/client',
		'./src/root.js'
	],*/
	index: ['./src/root.js'],
	vendors : ['react','react-dom','redux','react-router','classnames'],
}
```

## 二、output 

- `path`: 输出文件的目录，
- `filename`:输出的文件名，它一般跟你`entry`配置相对应，如：`js/[name].js` `name`在这里表示的是`[index、vendors]`，
- `chunkFilename`：块，配置了它，非入口`entry`的模块，会帮自动拆分文件，也就是大家常说的按需加载，与路由中的 `require.ensure`相互应
- `publicPath`：文件输出的公共路径，
- `pathinfo`：即保留相互依赖的包中的注释信息，这个基本不用主动设置它，它默认 - `development` 模式时的默认值是 `true`，而在 `production` 模式时的默认值是 `false`，
- 主要的就是这些，还有一些其他的`library`、`libraryTarget`、`auxiliaryComment`等

```js
output: {
	path: path.resolve(__dirname, '../assets'),
	filename: 'js/[name].js',
	chunkFilename: 'js/[name].[chunkhash:8].js',
	publicPath: '/_static_/', //最终访问的路径就是：localhost:3000/_static_/js/*.js
	//pathinfo:true,
}
```

## 三、hash

> 常用的有三种

|模板 |描述 |
|---|---|
|`hash`| 模块标识符的`hash`,一般应用于`filename：'[name].[hash].js'`|
|`chunkhash` |按需加载块内容的`hash`，根据chunk自身的内容计算而来,`'js/[name].[chunkhash:8].js'`|
|`contenthash` |这个没有用过，看了下文档它是在提取`css`文件时根据内容计算而来的 `hash` ，结合`ExtractTextWebpackPlugin`插件使用|
|`hash`长度 |默认`20`，可自定:`[hash:8]`、`[chunkhash:16]`|


## 四、mode

- 这个属于`webpack4`才新增的，4之前大家一般用`DefinePlugin`插件设置
- `mode：development``，`production`，`none`，
- `development` : 开发模式，打包的代码不会被压缩，开启代码调试，
- `production` : 生产模式，则正好反之。

```js

//方法一
webpack --mode development/production

//方法二
……
mode:'development/production'
……

```

## 五、devtool

- 控制是否生成，以及如何生成 `source map`文件，开发环境下更有利于定位问题，默认 `false`
- 当然它的开启，也会影响编译的速度，所以生产环境一定一定记得关闭
- 常用的值
  - `cheap-eval-source-map`
  - `eval-source-map`
  - `cheap-module-eval-source-map`
  - `inline-cheap-module-source-map`等等，
  - 更详细的可以去[官方查看](https://webpack.js.org/concepts/)
- 一般使用：`eval-source-map`较多，每个都有它不一样的特性

![](https://user-gold-cdn.xitu.io/2018/11/10/166fb92aa53f846f)

## 六、optimization

- `optimization`是`webpack4`新增的，主要是用来让开发者根据需要自定义一些优化构建打包的策略配置
- `minimize：true/false`,告诉`webpack`是否开启代码最小化压缩
- `minimizer`：自定`js`优化配置，会覆盖默认的配置，结合`UglifyJsPlugin`插件使用
- `removeEmptyChunks: bool` 值，它检测并删除空的块。将设置为`false`将禁用此优化
- `nodeEnv`：它并不是`node`里的环境变量，设置后可以在代码里使用 `process.env.NODE_ENV === 'development'`来判断一些逻辑，生产环境`UglifyJsPlugin`会自动删除无用代码
- `splitChunks` ：取代了`CommonsChunkPlugin`，自动分包拆分、代码拆分，详细默认默认配置，只会作用于异步加载的代码块 —— `chunks:'async'`，它有三个值：`all`,`async`,`initial`

```js
//环境变更也可以直接 在启动中设置
 //webpack --env.NODE_ENV=local --env.production --progress

//splitChunks 默认配置
splitChunks: {
  chunks: 'async',
  minSize: 30000,
  maxSize: 0,
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
    default: {
      minChunks: 2,
      priority: -20,
      reuseExistingChunk: true
    }
  }
}
```

- `runtimeChunk`: 提取 `webpack `运行时代码,它可以设置为：`boolean`、`Object`
- 该配置开启时，会覆盖 入口指定的名称

```js
optimization: {
	runtimeChunk:true,//方式一
  runtimeChunk: {
    name: entrypoint => `runtimechunk~${entrypoint.name}` //方式二
  }
}
```

![](https://user-gold-cdn.xitu.io/2018/11/10/166fb92b5f33e92c)

## 七、resolve - 配置模块如何解析

- `extensions`：自动解析确定的扩展,省去你引入组件时写后缀的麻烦，
- `alias`：非常重要的一个配置，它可以配置一些短路径，
- `modules`：`webpack `解析模块时应该搜索的目录，
其他 `plugins`、`unsafeCache`、`enforceExtension`，基本没有怎么用到

```js
//extensions 后缀可以省略，
import Toast from 'src/components/toast'; 

// alias ,短路径
import Modal from '../../../components/modal' 
//简写
import Modal from 'src/components/modal' 


resolve: {
  extensions: ['.js', '.jsx','.ts','.tsx', '.scss','.json','.css'],
  alias: {
    src :path.resolve(__dirname, '../src'),
    components :path.resolve(__dirname, '../src/components'),
    utils :path.resolve(__dirname, '../src/utils'),
  },
  modules: ['node_modules'],
},
```

## 八、module.rules - 编译规则

- `rules`：也就是之前的`loaders`，
- `test` ： 正则表达式，匹配编译的文件，
- `exclude`：排除特定条件，如通常会写`node_modules`，即把某些目录`/`文件过滤掉，
- `include`：它正好与`exclude`相反，
- `use -loader` ：必须要有它，它相当于是一个 `test` 匹配到的文件对应的解析器，`babel-loader`、`style-loader`、`sass-loader`、`url-loader`等等，
- `use - options`：它与`loader`配合使用，可以是一个字符串或对象，它的配置可以直接简写在`loader`内一起，它下面还有`presets`、`plugins`等属性

```js

module: {
	rules: [
		{
			test: /\.(js|jsx)$/,
			exclude: /node_modules/,
			use: [
				{
					loader: 'babel-loader',
					options: {
						presets: [
							['env',
							{
								targets: {
								browsers: CSS_BROWSERS,
							},
						}],'react', 'es2015', 'stage-0'
						],
						plugins: [
							'transform-runtime',
							'add-module-exports',
						],
					},
				},
			],
		},
		{
			test: /\.(scss|css)$/,
			use: [
				'style-loader',
				{loader: 'css-loader',options:{plugins: [require('autoprefixer')({browsers: CSS_BROWSERS,}),],sourceMap: true}},
				{loader: 'postcss-loader',options:{plugins: [require('autoprefixer')({browsers: CSS_BROWSERS,}),],sourceMap: true}},
				{loader: 'sass-loader',options:{sourceMap: true}}
			]
		},
		{
			test: /\.(png|jpg|jpeg|gif)$/,
			exclude: /node_modules/,
			use: [
				{
					loader: 'url-loader?limit=12&name=images/[name].[hash:8].[ext]',
				},
			],
		},
		{
			test: /\.(woff|woff2|ttf|eot|svg)$/,
			exclude: /node_modules/,
			use: [
				{
					loader: 'file-loader?name=fonts/[name].[hash:8].[ext]',
				},
			],
		},
	],
},
```


## 九、项目中常用loader

- `babel-loader`、`awesome-typescript-loader` js*/ts编译，
- `css-loader`、`postcss-loader`、`sass-loader`、`less-loader`、`style-loader` 等`css`样式处理
- `file-loader`、`url-loader`、`html-loader`等图片`/svg/html`等的处理

## 十、plugins - 插件

- `UglifyJsPlugin`
- `HotModuleReplacementPlugin`
- `NoEmitOnErrorsPlugin`
- `HtmlWebPackPlugin`
- `ExtractTextPlugin`
- `PreloadWebpackPlugin`

## 十一、plugins/loader 区别

- `loader`的作用在于解析文件，比如把`ES6`转换成`es5`,甚至`ES3`,毕竟还有万恶的IE嘛；把`Sass`、`Less`解析成`CSS`，给`CSS`自动加上兼容的前缀；对图片进行一个解析等等
- `plugins`对`loader`干的事情进行优化分类、提取精华(公共代码提取)、做压缩处理(`js/css/html`压缩)、输出指定的目录等

## 十二、webpack-dev-server

- `contentBase` ：告诉服务(`dev server`)在哪里查找文件，默认不指定会在是当期项目根目录，
- `historyApiFallback`:可以是`boolean`、 `object`，默认响应的入口文件，包括`404`都会指向这里，`object`见下面示例
- `compress`：启用 `gzip` 压缩，
- `publicPath`：它其实就是 `output.publicPath`，当你改变了它，即会覆盖了`output`的配置，
- `stats`： 可以自定控制要显示的编译细节信息，
- `proxy`：它其实就是`http-proxy-middleware`，可以进行处理一些代理的请求

```js
//方式一：不配置方式二的内容
 webpack-dev-server --config webpack/webpack.config.dev.js
//指定 端口： --port=8080 
//开启热更新：--hot
//gzip： --compress

//方式二
devServer : 
	contentBase:'./assets',
	host: '0.0.0.0',
	port: 9089,
	publicPath: '/assets/',
	historyApiFallback: {
		index: '/views/index.html'
	},
	/*
	匹配路径，进入不同的入口文件，首席填坑官∙苏南的专栏,公Z好：honeyBadger8
	rewrites: [
			{ from: /^\/$/, to: '/views/landing.html' },
			{ from: /^\/subpage/, to: '/views/subpage.html' },
			{ from: /./, to: '/views/404.html' }
		]
	}
	*/
	compress: true,
	noInfo: true,
	inline: true,
	hot: true,
	stats: {
		colors: true,
		chunks: false
	},
	proxy:{
		'/mockApi': 'https://easy-mock.com/project/5a0aad39eace86040263d' ,//请求可直接写成  /mockApi/api/login...
	}
}
```

## 十三、webpack4删除的点

- `module.loaders`
- `NoErrorsPlugin`
- `CommonsChunkPlugin`
- `DefinePlugin`
- `OccurenceOrderPlugin`

