---
title: webpack plugin原理分析与实践
date: 2021-01-05 12:30:23
tags: 
  - webpack
  - 插件
categories: Front-End
---

## 原理分析

> 在 Webpack 运行的生命周期中会广播出许多事件，Plugin 可以监听这些事件，在合适的时机通过 Webpack 提供的 API 改变输出结果

### 如何实现一个插件

> 一个最基础的 Plugin 的代码是这样的：

```js
class BasicPlugin{
  // 在构造函数中获取用户给该插件传入的配置
  constructor(options){
  }
  
  // Webpack 会调用 BasicPlugin 实例的 apply 方法给插件实例传入 compiler 对象
  apply(compiler){
    compiler.plugin('compilation',function(compilation,callback) {

    })
  }
}

// 导出 Plugin
module.exports = BasicPlugin;
```

**在使用这个 Plugin 时，相关配置代码如下：**

```js
const BasicPlugin = require('./BasicPlugin.js');
module.export = {
  plugins:[
    new BasicPlugin(options),
  ]
}
```

- Webpack 启动后，在读取配置的过程中会先执行 `new BasicPlugin(options)` 初始化一个 `BasicPlugin` 获得其实例。
- 在初始化 `compiler` 对象后，再调用 `basicPlugin.apply(compiler)` 给插件实例传入 `compiler` 对象。
- 插件实例在获取到 compiler 对象后，就可以通过 `compiler.plugin(事件名称, 回调函数)` 监听到 Webpack 广播出来的事件。
- 并且可以通过 `compiler `对象去操作 Webpack。

通过以上最简单的 Plugin 相信你大概明白了 Plugin 的工作原理，但实际开发中还有很多细节需要注意，下面来详细介绍。



### Compiler 和 Compilation

> 在开发 Plugin 时最常用的两个对象就是 Compiler 和 Compilation，它们是 Plugin 和 Webpack 之间的桥梁。


- Compiler 对象包含了 Webpack 环境所有的的配置信息，包含 options，loaders，plugins 这些信息，这个对象在 Webpack 启动时候被实例化，它是全局唯一的，可以简单地把它理解为 Webpack 实例；
- Compilation 对象包含了当前的模块资源、编译生成资源、变化的文件等。当 Webpack 以开发模式运行时，每当检测到一个文件变化，一次新的 Compilation 将被创建。Compilation 对象也提供了很多事件回调供插件做扩展。通过 Compilation 也能读取到 Compiler 对象。

**Compiler 和 Compilation 的区别在于**：`Compiler` 代表了整个 Webpack 从启动到关闭的生命周期，而 Compilation 只是代表了一次新的编译。

> webpack 的源码compiler钩子函数是借助tapable库实现的

```js
const {
    Tapable,
    SyncHook,
    SyncBailHook,
    AsyncParallelHook,
    AsyncSeriesHook
} = require("tapable");

class Compiler extends Tapable {
  constructor(context) {
      super();
      this.hooks = {
          /** @type {SyncBailHook<Compilation>} */
          shouldEmit: new SyncBailHook(["compilation"]),
          /** @type {AsyncSeriesHook<Stats>} */
          done: new AsyncSeriesHook(["stats"]),
          /** @type {AsyncSeriesHook<>} */
          additionalPass: new AsyncSeriesHook([]),
          /** @type {AsyncSeriesHook<Compiler>} */
          beforeRun: new AsyncSeriesHook(["compiler"]),
          /** @type {AsyncSeriesHook<Compiler>} */
          run: new AsyncSeriesHook(["compiler"]),
          /** @type {AsyncSeriesHook<Compilation>} */
          emit: new AsyncSeriesHook(["compilation"]),
          /** @type {AsyncSeriesHook<string, Buffer>} */
          assetEmitted: new AsyncSeriesHook(["file", "content"]),
          /** @type {AsyncSeriesHook<Compilation>} */
          afterEmit: new AsyncSeriesHook(["compilation"]),

          /** @type {SyncHook<Compilation, CompilationParams>} */
          thisCompilation: new SyncHook(["compilation", "params"]),
          /** @type {SyncHook<Compilation, CompilationParams>} */
          compilation: new SyncHook(["compilation", "params"]),
          /** @type {SyncHook<NormalModuleFactory>} */
          normalModuleFactory: new SyncHook(["normalModuleFactory"]),
          /** @type {SyncHook<ContextModuleFactory>}  */
          contextModuleFactory: new SyncHook(["contextModulefactory"]),

          /** @type {AsyncSeriesHook<CompilationParams>} */
          beforeCompile: new AsyncSeriesHook(["params"]),
          /** @type {SyncHook<CompilationParams>} */
          compile: new SyncHook(["params"]),
          /** @type {AsyncParallelHook<Compilation>} */
          make: new AsyncParallelHook(["compilation"]),
          /** @type {AsyncSeriesHook<Compilation>} */
          afterCompile: new AsyncSeriesHook(["compilation"]),

          /** @type {AsyncSeriesHook<Compiler>} */
          watchRun: new AsyncSeriesHook(["compiler"]),
          /** @type {SyncHook<Error>} */
          failed: new SyncHook(["error"]),
          /** @type {SyncHook<string, string>} */
          invalid: new SyncHook(["filename", "changeTime"]),
          /** @type {SyncHook} */
          watchClose: new SyncHook([]),

          /** @type {SyncBailHook<string, string, any[]>} */
          infrastructureLog: new SyncBailHook(["origin", "type", "args"]),

          // TODO the following hooks are weirdly located here
          // TODO move them for webpack 5
          /** @type {SyncHook} */
          environment: new SyncHook([]),
          /** @type {SyncHook} */
          afterEnvironment: new SyncHook([]),
          /** @type {SyncHook<Compiler>} */
          afterPlugins: new SyncHook(["compiler"]),
          /** @type {SyncHook<Compiler>} */
          afterResolvers: new SyncHook(["compiler"]),
          /** @type {SyncBailHook<string, Entry>} */
          entryOption: new SyncBailHook(["context", "entry"])
      };
  }}
```

> 上面的钩子函数是在`webpack`解析代码的不同周期执行的

- 其中同步四种，异步并行两种，异步串行3种。
- 同步钩子进行同步操作；异步钩子中进行异步操作。

> `compiler`和`compilation`中的钩子都是自称自这9种钩子。钩子的工作机制类似于浏览器的事件监听。

- 生成的钩子可以注册监听事件，其中同步钩子通过tap方法监听，异步钩子通过tapAsync(+回调函数)和tapPromise(+返回promise)进行监听。
- 还可以进行拦截，通过intercept方法。
- 对于监听事件的触发，同步钩子通过call方法; 异步钩子通过callAsync方法和promise

### 事件流

- Webpack 就像一条生产线，要经过一系列处理流程后才能将源文件转换成输出结果。
- 这条生产线上的每个处理流程的职责都是单一的，多个流程之间有存在依赖关系，只有完成当前处理后才能交给下一个流程去处理
- 插件就像是一个插入到生产线中的一个功能，在特定的时机对生产线上的资源做处理。
- Webpack 通过 Tapable 来组织这条复杂的生产线。
- Webpack 在运行过程中会广播事件，插件只需要监听它所关心的事件，就能加入到这条生产线中，去改变生产线的运作。
- Webpack 的事件流机制保证了插件的有序性，使得整个系统扩展性很好。
- Webpack 的事件流机制应用了观察者模式，和 Node.js 中的 EventEmitter 非常相似。
- `Compiler` 和 `Compilation` 都继承自 Tapable，可以直接在 Compiler 和 Compilation 对象上广播和监听事件，方法如下：

```js
/**
* 广播出事件
* event-name 为事件名称，注意不要和现有的事件重名
* params 为附带的参数
*/
compiler.apply('event-name',params);

/**
* 监听名称为 event-name 的事件，当 event-name 事件发生时，函数就会被执行。
* 同时函数中的 params 参数为广播事件时附带的参数。
*/
compiler.plugin('event-name',function(params) {
  
});
```

> 同理，`compilation.apply` 和 `compilation.plugin` 使用方法和上面一致。

在开发插件时，你可能会不知道该如何下手，因为你不知道该监听哪个事件才能完成任务。

**在开发插件时，还需要注意以下两点：**

- 只要能拿到 `Compiler` 或 `Compilation` 对象，就能广播出新的事件，所以在新开发的插件中也能广播出事件，给其它插件监听使用。
- 传给每个插件的 Compiler 和 Compilation 对象都是同一个引用。也就是说在一个插件中修改了 Compiler 或 Compilation 对象上的属性，会影响到后面的插件
- 有些事件是异步的，这些异步的事件会附带两个参数，第二个参数为回调函数，在插件处理完任务时需要调用回调函数通知 Webpack，才会进入下一处理流程。例如：

```js
compiler.plugin('emit',function(compilation, callback) {
  // 支持处理逻辑

  // 处理完毕后执行 callback 以通知 Webpack 
  // 如果不执行 callback，运行流程将会一直卡在这不往下执行 
  callback();
});
```

## 常用 API

> 插件可以用来修改输出文件、增加输出文件、甚至可以提升 Webpack 性能、等等，总之插件通过调用 Webpack 提供的 API 能完成很多事情。由于 Webpack 提供的 API 非常多，有很多 API 很少用的上，又加上篇幅有限，下面来介绍一些常用的 API。

### 读取输出资源、代码块、模块及其依赖

有些插件可能需要读取 `Webpack` 的处理结果，例如输出资源、代码块、模块及其依赖，以便做下一步处理。

> 在 emit 事件发生时，代表源文件的转换和组装已经完成，在这里可以读取到最终将输出的资源、代码块、模块及其依赖，并且可以修改输出资源的内容。

```js
class Plugin {
  apply(compiler) {
    compiler.plugin('emit', function (compilation, callback) {
      // compilation.chunks 存放所有代码块，是一个数组
      compilation.chunks.forEach(function (chunk) {
        // chunk 代表一个代码块
        // 代码块由多个模块组成，通过 chunk.forEachModule 能读取组成代码块的每个模块
        chunk.forEachModule(function (module) {
          // module 代表一个模块
          // module.fileDependencies 存放当前模块的所有依赖的文件路径，是一个数组
          module.fileDependencies.forEach(function (filepath) {
          });
        });

        // Webpack 会根据 Chunk 去生成输出的文件资源，每个 Chunk 都对应一个及其以上的输出文件
        // 例如在 Chunk 中包含了 CSS 模块并且使用了 ExtractTextPlugin 时，
        // 该 Chunk 就会生成 .js 和 .css 两个文件
        chunk.files.forEach(function (filename) {
          // compilation.assets 存放当前所有即将输出的资源
          // 调用一个输出资源的 source() 方法能获取到输出资源的内容
          let source = compilation.assets[filename].source();
        });
      });

      // 这是一个异步事件，要记得调用 callback 通知 Webpack 本次事件监听处理结束。
      // 如果忘记了调用 callback，Webpack 将一直卡在这里而不会往后执行。
      callback();
    })
  }
}
```

### 监听文件变化

> Webpack 会从配置的入口模块出发，依次找出所有的依赖模块，当入口模块或者其依赖的模块发生变化时,就会触发一次新的 Compilation。

在开发插件时经常需要知道是哪个文件发生变化导致了新的 Compilation，为此可以使用如下代码

```js
// 当依赖的文件发生变化时会触发 watch-run 事件
compiler.plugin('watch-run', (watching, callback) => {
    // 获取发生变化的文件列表
    const changedFiles = watching.compiler.watchFileSystem.watcher.mtimes;
    // changedFiles 格式为键值对，键为发生变化的文件路径。
    if (changedFiles[filePath] !== undefined) {
      // filePath 对应的文件发生了变化
    }
    callback();
});
```

- 默认情况下 Webpack 只会监视入口和其依赖的模块是否发生变化，在有些情况下项目可能需要引入新的文件，例如引入一个 HTML 文件。
- 由于 JavaScript 文件不会去导入 HTML 文件，Webpack 就不会监听 HTML 文件的变化，编辑 HTML 文件时就不会重新触发新的 Compilation。
- 为了监听 HTML 文件的变化，我们需要把 HTML 文件加入到依赖列表中，为此可以使用如下代码

```js
compiler.plugin('after-compile', (compilation, callback) => {
  // 把 HTML 文件添加到文件依赖列表，好让 Webpack 去监听 HTML 模块文件，在 HTML 模版文件发生变化时重新启动一次编译
    compilation.fileDependencies.push(filePath);
    callback();
});
```

### 修改输出资源

> 有些场景下插件需要修改、增加、删除输出的资源，要做到这点需要监听 emit 事件，因为发生 emit 事件时所有模块的转换和代码块对应的文件已经生成好，需要输出的资源即将输出，因此 emit 事件是修改 Webpack 输出资源的最后时机。

所有需要输出的资源会存放在 `compilation.assets` 中，`compilation.assets` 是一个键值对，**键为需要输出的文件名称，值为文件对应的内容**。

**设置 compilation.assets 的代码如下：**

```js
compiler.plugin('emit', (compilation, callback) => {
  // 设置名称为 fileName 的输出资源
  compilation.assets[fileName] = {
    // 返回文件内容
    source: () => {
      // fileContent 既可以是代表文本文件的字符串，也可以是代表二进制文件的 Buffer
      return fileContent;
    },
    // 返回文件大小
    size: () => {
      return Buffer.byteLength(fileContent, 'utf8');
    }
  };
  callback();
});
```

读取 `compilation.assets` 的代码如下：

```js
compiler.plugin('emit', (compilation, callback) => {
  // 读取名称为 fileName 的输出资源
  const asset = compilation.assets[fileName];
  // 获取输出资源的内容
  asset.source();
  // 获取输出资源的文件大小
  asset.size();
  callback();
});
```

### 判断 Webpack 使用了哪些插件

> 在开发一个插件时可能需要根据当前配置是否使用了其它某个插件而做下一步决定，因此需要读取 Webpack 当前的插件配置情况。以判断当前是否使用了 ExtractTextPlugin 为例，可以使用如下代码：

```js
// 判断当前配置使用使用了 ExtractTextPlugin，
// compiler 参数即为 Webpack 在 apply(compiler) 中传入的参数
function hasExtractTextPlugin(compiler) {
  // 当前配置所有使用的插件列表
  const plugins = compiler.options.plugins;
  // 去 plugins 中寻找有没有 ExtractTextPlugin 的实例
  return plugins.find(plugin=>plugin.__proto__.constructor === ExtractTextPlugin) != null;
}
```


## 实践


### 在 Webpack 即将退出时再附加一些额外的操作

- 该插件的名称取名叫 EndWebpackPlugin，作用是在 Webpack 即将退出时再附加一些额外的操作，例如在 Webpack 成功编译和输出了文件后执行发布操作把输出的文件上传到服务器。
- 同时该插件还能区分 Webpack 构建是否执行成功。使用该插件时方法如下

```js
module.exports = {
  plugins:[
    // 在初始化 EndWebpackPlugin 时传入了两个参数，分别是在成功时的回调函数和失败时的回调函数；
    new EndWebpackPlugin(() => {
      // Webpack 构建成功，并且文件输出了后会执行到这里，在这里可以做发布文件操作
    }, (err) => {
      // Webpack 构建失败，err 是导致错误的原因
      console.error(err);        
    })
  ]
}
```

**要实现该插件，需要借助两个事件：**

- `done`：在成功构建并且输出了文件后，Webpack 即将退出时发生；
- `failed`：在构建出现异常导致构建失败，Webpack 即将退出时发生；

```js
class EndWebpackPlugin {

  constructor(doneCallback, failCallback) {
    // 存下在构造函数中传入的回调函数
    this.doneCallback = doneCallback;
    this.failCallback = failCallback;
  }

  apply(compiler) {
    compiler.plugin('done', (stats) => {
        // 在 done 事件中回调 doneCallback
        this.doneCallback(stats);
    });
    compiler.plugin('failed', (err) => {
        // 在 failed 事件中回调 failCallback
        this.failCallback(err);
    });
  }
}
// 导出插件 
module.exports = EndWebpackPlugin;
```

> 找到合适的事件点去完成功能在开发插件时显得尤为重要


### 生成各个文件的大小到指定目录文件中

```js
// 生成各个文件的大小到指定目录文件中
class FileListPlugin {
    constructor(options) {
        this.options = options
    }
    apply(compiler) {
        compiler.hooks.emit.tap('fileListPlugin', (compilation) => {
            let assets = compilation.assets
            let content = 'In this build:\r\n'

            // 遍历所有编译过的资源文件，
            // 对于每个文件名称，都添加一行内容。
            Object.entries(assets).forEach(([fileName, fileSize]) => {
                content += `--${fileName} —— ${Math.ceil(fileSize.size() / 1024)}kb\r\n`
            })
            console.log('====content====', content)
            // 将这个列表作为一个新的文件资源，插入到 webpack 构建中：
            assets[this.options.filename] = {
                source() {
                    return content
                },
                size() {
                    return content.length
                }
            }
        })
    }
}
module.exports = FileListPlugin
```

**在vue cli3中使用例子**

```js
// const FileListPlugin = require('./plugins/fileListPlugin.js')
configureWebpack: (config) => {
    return {
      plugins: [
        new FileListPlugin({'filename': path.join('..','filelist.md')})
      ]
    }
},
```

![](https://poetries1.gitee.io/img-repo/2021/01/13.png)

### 生成版权信息

```js
class CopyRightWebpackPlugin {
  constructor(options) {
      this.options = options
  }
  apply(compiler) {
      compiler.hooks.compile.tap('webpackCompiler', () => {
          console.log('compiler')
      })
      compiler.hooks.emit.tapAsync('CopyRightWebpackPlugin', (compilation, cb) => {
          compilation.assets[this.options.filename] = {
              source() {
                  return 'copyRight by poetries'
              },
              size() {
                  return 25
              }
          }
          cb()
      })
  }
}
module.exports = CopyRightWebpackPlugin
```

**在vue cli3中使用例子**

```js
// const CopyRightWebpackPlugin = require('./plugins/copyRightWebpackPlugin.js')
configureWebpack: (config) => {
  return {
    plugins: [
      new CopyRightWebpackPlugin({'filename': 'copyRight.md'})
    ]
  }
},
```

![](https://poetries1.gitee.io/img-repo/2021/01/14.png)

### 打包zip插件

```js
const JsZip = require('jszip');

class ZipPlugin {
  constructor(options) {
    this.options = options;
  }
  apply(compiler) {
    // emit是一个异步串行钩子
    compiler.hooks.emit.tapPromise('1', (compilation) => {
      const assets = compilation.assets;
      const zip = new JsZip();
      for(let filename in assets) {
        zip.file(filename, assets[filename].source())
      }
      // nodebuffer是node环境中的二进制形式；blob是浏览器环境
      return zip.generateAsync({type: 'nodebuffer'}).then((content) =>{
        console.log(this.options.filename);
        assets[this.options.filename] = {
          source() {return content}, 
          size() {return content.length} //可以省略
        }
        return new Promise((resolve, reject) => {
          resolve(compilation)
        })   
      })
    })
  }
}

module.exports = ZipPlugin;
```

在`webpack.config.js`中使用

```js
const ZipPlugin = require('./plugins/ZipPlugin');

module.exports = {
  plugins: [
    new ZipPlugin({
      filename: 'my.zip'
    })
  ]
}
```

## 参考

- [编写一个插件-webpack官方教程](https://www.webpackjs.com/contribute/writing-a-plugin/)


