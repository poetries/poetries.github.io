---
title: webpack打包结果依赖分析
date: 2018-11-20 17:40:08
tags: 
   - webpack
   - 优化
categories: Front-End
---

## 一、使用webpack-bundle-analyzer插件分析

**安装插件**

> https://www.npmjs.com/package/webpack-bundle-analyzer

```
npm install webpack-bundle-analyzer –save-dev
```

**配置**

> 在`package.json中`


传入环境变量`ANALYZE`，最后`process.env.ANALYZE`来读取


```
"scripts": {
  "build": "node scripts/build.js",
  "analyze": "cross-env ANALYZE=1 npm run build"
}
```

> 在`build/webpack.prod.config.js`的`plugin`后面加上判断

```js
plugins.concat(process.env.ANALYZE?[
    new BundleAnalyzerPlugin({
    //  可以是`server`，`static`或`disabled`。
    //  在`server`模式下，分析器将启动HTTP服务器来显示软件包报告。
    //  在“静态”模式下，会生成带有报告的单个HTML文件。
    //  在`disabled`模式下，你可以使用这个插件来将`generateStatsFile`设置为`true`来生成Webpack Stats JSON文件。
    analyzerMode: 'server',
    //  将在“服务器”模式下使用的主机启动HTTP服务器。
    analyzerHost: '127.0.0.1',
    //  将在“服务器”模式下使用的端口启动HTTP服务器。
    analyzerPort: 8888,
    //  路径捆绑，将在`static`模式下生成的报告文件。
    //  相对于捆绑输出目录。
    reportFilename: 'report.html',
    //  模块大小默认显示在报告中。
    //  应该是`stat`，`parsed`或者`gzip`中的一个。
    //  有关更多信息，请参见“定义”一节。
    defaultSizes: 'parsed',
    //  在默认浏览器中自动打开报告
    openAnalyzer: true,
    //  如果为true，则Webpack Stats JSON文件将在bundle输出目录中生成
    generateStatsFile: false,
    //  如果`generateStatsFile`为`true`，将会生成Webpack Stats JSON文件的名字。
    //  相对于捆绑输出目录。
    statsFilename: 'stats.json',
    //  stats.toJson（）方法的选项。
    //  例如，您可以使用`source：false`选项排除统计文件中模块的来源。
    //  在这里查看更多选项：https：  //github.com/webpack/webpack/blob/webpack-1/lib/Stats.js#L21
    statsOptions: null,
    logLevel: 'info' // 日志级别。可以是'信息'，'警告'，'错误'或'沉默'。
  	})
  ]:[])
  ```
  
 **启动**
 
 ```
 npm run analyze
 ```
 
 > 在对应地址后面添加端口`8888`，即可得到一个可视化模块大小界面
 
 ![](https://poetries1.gitee.io/img-repo/2019/10/636.png)


> 这个插件就是从`stats.json`中获取`chunks`然后最终使用`Canvas`画图。具体代码位于`analyzer.js`中的`getViewerData`方法

## 二、使用官方提供的在线工具

> `webpack --proile --json > stats.json` 生成一份`json`文件上传到http://webpack.github.io/analyse 分析

 ![](https://poetries1.gitee.io/img-repo/2019/10/637.png)
