---
title: webpack plugin原理分析与实践 手写四个实用插件
description: 从 apply 与 compiler 的传递讲到 Tapable 九种钩子，梳理 Compiler 与 Compilation 的分工、插件常用 API，并手写四个可以直接抄走的 webpack plugin。
date: 2021-01-05 12:30:23
tags: 
  - webpack
  - 插件
  - 前端工程化
categories: Front-End
---

配置文件里的 `plugins` 数组我抄了好几年，塞进去七八个插件都能跑，可一旦某个插件行为不对，我完全不知道该从哪儿开始查。真正逼我把这块弄明白的是个很小的需求，构建完想自动生成一份「这次打出来哪些文件、各多大」的清单。现成的方案不是没有，只是我想顺手把 plugin 的写法练一遍。

几十行代码写完，事件流、`Compiler` 和 `Compilation` 的分工、`emit` 到底卡在哪个时机，一下子全串起来了。这篇把原理和四个能直接抄走的插件例子记在一起，末尾单独补一段 webpack 4 和 5 之后哪些写法已经不能用了。读完你至少能自己判断一个功能该挂在哪个钩子上。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 一个插件挂到 webpack 上的完整过程，`apply` 和 `compiler` 是怎么传进来的
- `Compiler` 和 `Compilation` 的区别，什么时候该用哪个
- Tapable 的九种钩子，同步、异步串行、异步并行分别怎么注册和触发
- 常用 API，读产物、监听额外文件变化、改写输出、判断当前用了哪些插件
- 四个可以直接抄走的插件实现，构建收尾、文件清单、版权信息、打包 zip
- webpack 4 到 5 之后，文中这些写法哪些废弃了，替代品是什么

## 一、一个插件是怎么挂上去的

webpack 跑起来之后，整个生命周期会广播出一大堆事件。plugin 干的事就一件，监听它关心的那个事件，在那个时机用 webpack 给的 API 改变输出结果。

先看最小的一个插件长什么样。

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

这段代码里其实只有一个约定，插件就是一个带 `apply` 方法的类。构造函数拿用户传进来的配置，`apply` 拿 webpack 给的 `compiler`，别的都是你自己的事。

在配置里用它的时候是这样：

```js
const BasicPlugin = require('./BasicPlugin.js');
module.exports = {
  plugins:[
    new BasicPlugin(options),
  ]
}
```

顺着这两段代码把流程串一遍。webpack 启动后读配置，先执行 `new BasicPlugin(options)` 拿到实例，这一步只是把你的配置存下来，还没有任何 webpack 的东西可用。等 `compiler` 对象初始化完，webpack 才回过头调用 `basicPlugin.apply(compiler)`，把 `compiler` 交到插件手里。从这一刻起插件才算真正接入了构建流程，可以通过 `compiler.plugin(事件名称, 回调函数)` 监听广播出来的事件，也可以直接操作 `compiler` 上的配置。

所以插件的构造函数里不要写任何依赖 webpack 状态的逻辑，那时候什么都还没有。

原文这里有个笔误我顺手改了，配置导出应该是 `module.exports` 而不是 `module.export`，后者 webpack 读不到，表现是插件像不存在一样，一点报错都没有。这种错最难查，因为你会一直怀疑是钩子挂错了。

到这里最简的模型就跑通了，但实际开发绕不开两个对象，下面单独说。

## 二、Compiler 和 Compilation 到底该用哪个

开发 plugin 时最常打交道的就是这两个对象，它们是插件和 webpack 之间的桥梁。

`Compiler` 对象包含了 webpack 环境所有的配置信息，`options`、`loaders`、`plugins` 这些都挂在上面。它在 webpack 启动时被实例化，全局唯一，可以简单地把它理解为 webpack 实例本身。

`Compilation` 对象包含的是当前这一次编译的模块资源、编译生成资源、变化的文件等等。webpack 以开发模式运行时，每检测到一个文件变化就会创建一次新的 `Compilation`。它同样提供了很多事件回调供插件扩展，并且通过它也能反过来读到 `Compiler`。

两者的区别就一句话，`Compiler` 代表整个 webpack 从启动到关闭的生命周期，`Compilation` 只代表一次编译。

判断该用哪个有个很好用的经验：跟「这一次打包出来什么」有关的，找 `Compilation`；跟「整个进程什么时候开始、什么时候结束」有关的，找 `Compiler`。`watch` 模式下你会更容易理解这层关系，进程只启动一次，`Compiler` 就一个，但你改一次文件就多一个 `Compilation`。如果你把状态缓存在了 `Compiler` 上，watch 时它会一直累积，这个坑我踩过，插件在单次构建时正常，开着 dev server 改几次文件之后输出就重复了。

那这些钩子是哪来的？webpack 源码里 `compiler` 的钩子函数是借助 tapable 库实现的。

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

这一大段构造函数看着吓人，其实信息量很集中。`this.hooks` 就是这个 `Compiler` 能广播的全部事件，每个事件都被声明成了某一种钩子类型，注释里的 `SyncHook<Compilation>` 这类泛型标注说明了回调能拿到什么参数。你要写插件，第一件事就是来这里翻，看看有没有一个钩子的时机正好是你要的。

上面这些钩子分布在 webpack 解析代码的不同周期上。tapable 一共提供了九种钩子，同步的四种，异步并行两种，异步串行三种。同步钩子里只能做同步操作，异步钩子才允许你在回调里等 IO。

`compiler` 和 `compilation` 里的钩子都出自这九种。它们的工作机制和浏览器的事件监听很像，一边注册，一边触发。

注册这一侧，同步钩子用 `tap` 方法监听，异步钩子有两种写法，`tapAsync` 接一个回调函数，`tapPromise` 要求你返回一个 promise。另外还可以用 `intercept` 做拦截，在所有监听器前后插一层，调试的时候挺好用。

触发这一侧，同步钩子走 `call`，异步钩子走 `callAsync` 或者 promise。这部分平时用不上，因为触发是 webpack 自己干的，除非你想在自己的插件里广播新事件给别的插件听。

回到写插件这件事，你只要记住选钩子的两个维度就够了：这个时机拿得到我要的数据吗，以及我的处理是同步还是异步。选错第二个维度的表现很典型，构建卡住不动，或者产物里少了你写进去的东西。

### 2.1 事件流机制

webpack 就像一条生产线，源文件要经过一系列处理流程才能变成输出结果。这条线上每个流程的职责都很单一，流程之间有依赖关系，当前这步做完才能交给下一步。插件就是插到这条生产线里的一个功能，在特定时机对线上的资源做处理。

组织这条生产线的正是 Tapable。webpack 在运行过程中不停广播事件，插件只监听自己关心的那个，就能加入进来改变生产线的运作。这套事件流机制保证了插件的有序性，扩展性也因此很好，用的是观察者模式，和 Node.js 里的 EventEmitter 很像。

`Compiler` 和 `Compilation` 都继承自 Tapable，所以可以直接在这两个对象上广播和监听事件：

```js
/**
* 广播出事件
* event-name 为事件名称，注意不要和现有的事件重名
* params 为附带的参数
*/
compiler.applyPlugins('event-name',params);

/**
* 监听名称为 event-name 的事件，当 event-name 事件发生时，函数就会被执行。
* 同时函数中的 params 参数为广播事件时附带的参数。
*/
compiler.plugin('event-name',function(params) {
  
});
```

这里我改了原文一处，广播事件用的是 `applyPlugins`，不是 `apply`。老版本 Tapable 里 `apply` 是用来挂载插件实例的，跟广播不是一回事，写成 `apply` 你会得到一个「没报错也没反应」的结果。`compilation` 上这两个方法的用法完全一致。

需要提前说明的是，`compiler.plugin` 和 `applyPlugins` 都是 webpack 3 及更早的写法，webpack 4 之后统一换成了 `compiler.hooks.xxx.tap()` 和 `compiler.hooks.xxx.call()`。本文前半部分沿用原来的老写法讲原理，是因为这套 API 看起来更直白，理解成本低；实际项目里请按第六节的对照表换成新写法。

真正开始写插件时最容易卡住的地方，往往不是不会写代码，而是不知道该监听哪个事件。这就回到上一节说的那句话，先去 `Compiler` 的 `hooks` 定义里翻，找一个「数据已经就绪但还没输出」的时机。

另外有三点得放在心上。

只要拿得到 `Compiler` 或 `Compilation`，你就能广播出新事件，所以你自己写的插件也可以对外暴露事件给别的插件监听，插件之间的协作就是这么做的。

传给每个插件的 `Compiler` 和 `Compilation` 都是同一个引用。一个插件改了对象上的属性，后面的插件全都受影响。这个特性有用也危险，写共享状态之前先想清楚顺序。

还有异步事件的回调问题。异步事件会附带两个参数，第二个是 `callback`，处理完必须调用它通知 webpack，流程才会往下走：

```js
compiler.plugin('emit',function(compilation, callback) {
  // 支持处理逻辑

  // 处理完毕后执行 callback 以通知 Webpack 
  // 如果不执行 callback，运行流程将会一直卡在这不往下执行 
  callback();
});
```

漏掉 `callback` 的表现是构建进度条停在某个百分比上再也不动，没有任何报错。我第一次写异步钩子就是这么卡了半天，一直以为是自己的逻辑死循环了。异步逻辑里有 `try/catch` 的，记得在 `catch` 分支里也把 `callback` 调掉。

## 三、写插件绕不开的几个 API

插件能修改输出文件、增加输出文件、甚至提升 webpack 性能，靠的都是调 webpack 提供的 API。这类 API 数量很多，大部分平时用不上，下面挑几个真正高频的说。

### 3.1 读取输出资源、代码块、模块及其依赖

有些插件需要先读到 webpack 的处理结果，比如输出资源、代码块、模块及其依赖，才好做下一步处理。

`emit` 事件发生时，源文件的转换和组装已经完成，这里能读到最终将要输出的资源、代码块、模块以及依赖关系，并且还能改内容。它是整条流水线上最适合「既看得全又来得及改」的位置。

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

这段代码把三层结构走了一遍，`compilation.chunks` 是所有代码块，一个 chunk 由多个 module 组成，每个 module 的 `fileDependencies` 记着它依赖了哪些文件路径。最后 `chunk.files` 是这个代码块会产出的文件名，注意一个 chunk 可能对应多个文件，代码里的注释举的例子就是含 CSS 模块时会同时产出 `.js` 和 `.css`。

拿到文件名之后去 `compilation.assets` 里取，调 `source()` 就是内容。分析类插件基本都是这个套路，先遍历再统计。

提醒一句，`chunk.forEachModule` 这个方法在 webpack 4 就废弃了，webpack 5 里遍历 chunk 的模块要走 `compilation.chunkGraph.getChunkModules(chunk)`。第六节还会再提。

### 3.2 监听文件变化

webpack 会从配置的入口模块出发，依次找出所有依赖模块，入口或者其依赖发生变化时就触发一次新的 `Compilation`。

开发插件时经常需要知道是哪个文件的变化导致了这次重新编译，可以这么拿：

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

这里还有个更常见的需求。默认情况下 webpack 只监视入口和它依赖的模块，可有些文件根本不在依赖图里，比如一个 HTML 模板。JavaScript 不会去 import 一个 HTML 文件，webpack 自然不知道它的存在，你改了模板，页面不会热更新。

那怎么办？手动把它塞进依赖列表：

```js
compiler.plugin('after-compile', (compilation, callback) => {
  // 把 HTML 文件添加到文件依赖列表，好让 Webpack 去监听 HTML 模块文件，在 HTML 模版文件发生变化时重新启动一次编译
    compilation.fileDependencies.push(filePath);
    callback();
});
```

`html-webpack-plugin` 这类插件内部干的就是这件事。顺带说一句，webpack 4 之后 `fileDependencies` 从数组变成了集合，`push` 要改成 `add`，这也是老文章直接抄过去会报错的地方之一。

### 3.3 修改输出资源

有些场景下插件需要修改、增加、删除输出的资源。做这件事要监听 `emit`，因为 `emit` 触发时所有模块的转换和代码块对应的文件都已经生成好，资源马上就要写到磁盘上，这是你能改产物的最后时机。

所有待输出的资源都存放在 `compilation.assets` 里，它是一个键值对，键是文件名，值是文件对应的内容对象。这个对象至少要提供 `source()` 和 `size()` 两个方法，前者返回内容，后者返回字节数。

设置 `compilation.assets` 的代码如下：

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

`source()` 的返回值既可以是字符串，也可以是 `Buffer`，所以往产物里塞图片、压缩包这类二进制文件同样走这条路。第五节的 zip 插件就是这么干的。

反过来读取 `compilation.assets` 是这样：

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

### 3.4 判断当前用了哪些插件

写插件时可能需要根据「配置里有没有用另一个插件」来决定自己的行为，比如提取 CSS 的插件在不在，决定了你要不要处理 `.css` 产物。这时候需要读 webpack 当前的插件配置。以判断有没有用 `ExtractTextPlugin` 为例：

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


`compiler.options.plugins` 就是你配置文件里那个数组本身，插件实例原封不动躺在里面，所以拿构造函数比对就能认出来。这里用 `plugin.__proto__.constructor` 是老写法，现在直接写 `plugins.some(p => p instanceof ExtractTextPlugin)` 更直观，效果一样。

## 四、四个能直接抄走的插件

原理讲完了，下面四个例子由浅入深，每一个都对应一类真实需求。

### 4.1 构建结束后做点别的事

这个插件叫 `EndWebpackPlugin`，作用是在 webpack 即将退出时附加一些额外操作，典型场景是编译成功、文件写完之后执行发布，把产物传到服务器。同时它还要能区分构建是成功还是失败，失败时就别发布了。

用法是这样：

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

实现它只需要借助两个事件。`done` 在成功构建并且输出了文件后、webpack 即将退出时触发；`failed` 在构建出现异常导致失败、webpack 即将退出时触发。两个事件正好把成功和失败两条分支分开了，插件里不需要自己判断状态。

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

整个插件不到二十行，含金量全在选对了 `done` 和 `failed` 这两个时机上。写插件这件事，找到合适的事件点比写代码本身重要得多。

有一点要留意，`done` 里拿到的 `stats` 是本次构建的统计对象，异步操作（比如真的去传文件）在这里发起时，webpack 进程可能已经准备退出了。真要做发布，更稳的是把上传逻辑放到构建脚本里等 webpack 回调结束之后再执行，或者用异步钩子。

### 4.2 生成一份文件清单

回到开头说的那个需求，每次构建完输出一份「有哪些文件、各多大」的清单。这个插件叫 `FileListPlugin`：

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
            Object.entries(assets).forEach(([fileName, asset]) => {
                content += `- ${fileName} : ${Math.ceil(asset.size() / 1024)}kb\r\n`
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

这个插件把第三节讲的两件事合在一起做了。先遍历 `compilation.assets` 拿到每个产物的名字和体积，拼成一段 markdown 文本；再把这段文本本身当成一个新资源写回 `assets`，webpack 输出的时候就会顺手把它写到磁盘上。所以你不需要自己调 `fs.writeFile`，产物目录、hash、publicPath 这些 webpack 都替你处理好了。

注意钩子用的是 `compiler.hooks.emit.tap`，这是 webpack 4 的新写法，`tap` 说明这里做的是同步操作。另外原文这段模板字符串里的分隔符是长破折号，我换成了普通符号，避免生成的 markdown 在部分编辑器里排版跑掉。

在 vue-cli 3 里这么用：

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

`filename` 用了 `path.join('..','filelist.md')`，也就是把清单写到了 dist 的上一级。这在本地看着方便，但要清楚一点，写到输出目录之外的路径不属于 webpack 的正常管辖范围，`clean` 之类的插件不会去清理它。构建产物还是尽量待在 `output.path` 里比较省心。

跑完之后生成的清单长这样：

![FileListPlugin 生成的构建产物清单文件内容](https://s.poetries.top/gitee/2021/01/13.png)

### 4.3 给产物加一份版权信息

上一个插件用的是同步钩子，这个换成异步的看看区别在哪：

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
          const content = 'copyRight by poetries'
          compilation.assets[this.options.filename] = {
              source() {
                  return content
              },
              size() {
                  return content.length
              }
          }
          cb()
      })
  }
}
module.exports = CopyRightWebpackPlugin
```

这里有两个点。一是 `compile` 用 `tap`、`emit` 用 `tapAsync`，同一个插件里挂两个不同类型的钩子完全没问题，各按各的规矩来，异步的那个记得调 `cb`。二是 `size()` 原文写死成了 25，而 `copyRight by poetries` 实际是 21 个字符，我改成了按内容长度算。产物尺寸和实际内容对不上，轻则 stats 里的数字不准，重则被下游做完整性校验的工具判定异常，能算就别写死。

`compile` 钩子那句 `console.log('compiler')` 是用来观察触发顺序的，实际用的时候删掉就行。想知道每个钩子什么时候被调用，最快的办法就是这样挨个 `tap` 一遍打日志，比翻文档直观。

在 vue-cli 3 里的用法：

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

构建完就能在产物目录里看到多出来的版权文件：

![CopyRightWebpackPlugin 在构建产物中生成的版权信息文件](https://s.poetries.top/gitee/2021/01/14.png)

### 4.4 把产物打成 zip

前面三个都是同步或者简单异步的场景，最后这个用 `tapPromise`，因为打包压缩本身是个 promise 流程：

```js
const JsZip = require('jszip');

class ZipPlugin {
  constructor(options) {
    this.options = options;
  }
  apply(compiler) {
    // emit是一个异步串行钩子
    compiler.hooks.emit.tapPromise('ZipPlugin', (compilation) => {
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

这段代码的思路很清楚，遍历 `assets` 把每个产物塞进 JSZip 实例，`generateAsync` 生成一个 `nodebuffer`，再把这个 buffer 当成新资源写回 `assets`。前面说过 `source()` 可以返回 `Buffer`，用的就是这一点。类型这里别选错，`nodebuffer` 是 Node 环境的二进制形式，浏览器环境才用 `blob`。

原文里插件名传的是 `'1'`，我改成了 `ZipPlugin`。这个字符串会出现在 stats 和报错堆栈里，随手写个数字，出问题的时候你根本认不出是谁干的。

末尾那个 `return new Promise((resolve, reject) => resolve(compilation))` 其实可以省掉，`tapPromise` 只关心你返回的 promise 什么时候 resolve，值是什么它不用。写成 `return` 一个空 promise 效果一样。

在 `webpack.config.js` 里这么用：

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

## 五、这几年 webpack 变了什么

这篇写于 2021 年初，那会儿手上项目还有一半跑在 webpack 4 上。原文里混着 webpack 3 和 4 两代写法，直接抄到现在的项目里多半跑不起来，这一节单独对照一下。

最大的变化是注册方式。webpack 4 起，`compiler.plugin('emit', fn)` 这种写法被 `compiler.hooks.emit.tapAsync('MyPlugin', fn)` 取代，事件名也从短横线改成了小驼峰，`watch-run` 变成 `watchRun`，`after-compile` 变成 `afterCompile`。前面第一、二节沿用老写法只是为了讲清楚模型，动手写的时候请用 `hooks`。同理，广播事件的 `applyPlugins` 也已经不在了，换成 `compiler.hooks.myHook.call(params)`。

几个具体 API 的对照：

| 老写法 | 现在的做法 |
|--------|-----------|
| `compiler.plugin('emit', fn)` | `compiler.hooks.emit.tapAsync('Name', fn)` |
| `compiler.applyPlugins('name', p)` | `compiler.hooks.name.call(p)` |
| `chunk.forEachModule(fn)` | `compilation.chunkGraph.getChunkModules(chunk)` |
| `compilation.fileDependencies.push(f)` | `compilation.fileDependencies.add(f)` |
| `compilation.assets[name] = { source, size }` | `compilation.emitAsset(name, new RawSource(content))` |

后两条值得多说一句。`fileDependencies` 在 webpack 4 之后是集合而不是数组，所以只能 `add`，照着老文章写 `push` 会直接报「不是函数」。资源写入这块 webpack 5 也推荐换路子，用 `compilation.emitAsset` 和 `updateAsset`，资源对象从 `webpack-sources` 里取 `RawSource` 这类现成实现，比自己手写 `source()` 和 `size()` 安全，尺寸算错的问题也就不存在了。时机上 webpack 5 更建议挂 `compilation.hooks.processAssets`，它比 `emit` 更靠前，还能通过 stage 参数控制多个插件之间的先后顺序。

监听变化那段同样要改。webpack 5 里 `compiler.modifiedFiles` 和 `compiler.removedFiles` 就能拿到这次变化的文件集合，不用再去掏 `watchFileSystem.watcher.mtimes` 这种内部结构。老写法依赖的是没有公开保证的私有字段，升级版本就断。

还有例子里的 `ExtractTextPlugin`，webpack 4 之后它的位置被 `mini-css-extract-plugin` 接替了，判断插件存在与否的那段代码逻辑不变，换个类名就行。

说实话我没有把这四个插件在 webpack 5 上全部重跑一遍，上面这些对照是按官方文档和迁移指南整理的。真要用，建议先写个最小 demo 验证钩子能不能触发，再往业务项目里搬。构建这块的整体优化思路我在[webpack 5 构建优化](https://feinterview.poetries.top/blog/webpack-5-build-optimization)里另外写过，可以配合着看。

## 总结

插件这套东西拆开看其实很朴素。一个带 `apply` 方法的类，webpack 在合适的时机把 `compiler` 递给你，你挑一个钩子挂上去，在回调里读或者改数据。难的从来不是语法，是知道该挂哪个钩子。

判断钩子的标准前面反复说过：跟整个进程生命周期有关的找 `Compiler`，跟这一次编译产物有关的找 `Compilation`；要改产物就盯住 `emit` 这个「最后时机」，要做收尾就用 `done` 和 `failed`。四个例子分别演示了 `tap`、`tapAsync`、`tapPromise` 三种注册方式，同步逻辑用哪个都行，只要有异步操作就必须选后两种，并且把 `callback` 或者 promise 收干净，否则构建会静默卡死。

顺手修的几处也一并记着：配置导出是 `module.exports`，广播事件是 `applyPlugins`，`size()` 按内容长度算别写死，插件名别偷懒写成一个数字。这些都不会立刻报错，但排查起来特别费时间。

最后，写完自己的第一个插件之后再回头看 `html-webpack-plugin` 这类常用插件的源码，你会发现它们用的还是同一套东西，只是钩子选得更精准。

## 参考

- [编写一个插件-webpack官方教程](https://www.webpackjs.com/contribute/writing-a-plugin/)
- [Writing a Plugin - webpack 官方文档](https://webpack.js.org/contribute/writing-a-plugin/)
- [Compiler Hooks - webpack 官方文档](https://webpack.js.org/api/compiler-hooks/)
- [Compilation Object - webpack 官方文档](https://webpack.js.org/api/compilation-object/)
- [tapable 仓库](https://github.com/webpack/tapable)
- [前端进阶之旅](https://interview.poetries.top)
