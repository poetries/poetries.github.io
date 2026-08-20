---
title: Webpack 5 构建性能优化实战，持久化缓存 Tree-shaking 与分包配置
date: 2023-09-17 11:40:12
description: 从构建三阶段拆解 Webpack 5 的优化点，讲透持久化缓存、Tree-shaking 两步机制、SplitChunks 分包与并行构建，附可直接复制的生产配置和上线前 checklist。
tags:
- Webpack
- 构建工具
- 前端工程化
- 性能优化
- 打包优化
categories: Front-End
---

改一行 CSS，dev server 转了十几秒才刷新；提一个 PR，CI 上的生产构建能跑掉大半杯咖啡的时间。这种项目大概率你也遇到过，而且越到项目后期越难受。Webpack 5 在这件事上给的东西不少，持久化缓存、更聪明的 `Tree-shaking`、更灵活的分包策略，但配置项太多，很容易开了一堆结果没开在关键路径上。

这篇按「构建慢在哪一段」的顺序把优化手段串起来，每个配置都说清它作用在哪个阶段、什么场景有效、边界在哪，最后给一份可以直接复制的生产配置和一份上线前的 checklist。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Webpack 构建的三个阶段，以及每个优化手段对应哪一段
- 持久化缓存怎么开、各配置项管什么、失效规则是什么
- `babel-loader` / ESLint / Stylelint 这一层的缓存怎么叠
- `Tree-shaking` 的两步机制，以及让它失效的六种常见写法
- `SplitChunks` 的 Chunk 模型、缓存组配置和长期缓存的坑
- 并行构建的四种方案，以及它什么时候是负优化
- HMR、SourceMap 选型和构建分析工具的正确用法
- 一份可直接复制的生产配置 + 上线前 checklist

## 一、先搞清楚构建慢在哪一段

在改任何配置之前，得先知道 Webpack 一次构建到底干了什么。整个过程大致分三段，每一段慢的原因和药方都不一样：

```
        entry
          │
 ┌────────▼──────────────────────────────────────────────┐
 │ 初始化阶段                                             │
 │   读 config → 注册内置插件 → 创建 compiler             │
 │   耗时占比很小，基本不用管                              │
 └────────┬──────────────────────────────────────────────┘
          │
 ┌────────▼──────────────────────────────────────────────┐
 │ Make 阶段                                              │
 │   读文件 → Loader 转译 → acorn 生成 AST                │
 │   → 分析依赖 → 递归下去 → 产出 ModuleGraph             │
 │                                                        │
 │   慢在：babel-loader / ts-loader / eslint / sass       │
 │   药方：持久化缓存、Loader 级缓存、thread-loader、      │
 │         收窄 resolve 与 include 范围                    │
 └────────┬──────────────────────────────────────────────┘
          │
 ┌────────▼──────────────────────────────────────────────┐
 │ Seal 阶段                                              │
 │   遍历 ModuleGraph → 生成 Chunk → 代码转译 →           │
 │   产物优化（Tree-shaking）→ 写出文件                    │
 │                                                        │
 │   慢在：Terser 压缩、SplitChunks 启发式计算             │
 │   药方：TerserPlugin parallel、精简 cacheGroups         │
 └────────┬──────────────────────────────────────────────┘
          │
        dist/
```

先说结论，绝大多数项目的时间都花在 Make 阶段的 Loader 转译上，其次是 Seal 阶段的压缩。所以优化的第一顺位永远是「让 Loader 少干活」，持久化缓存就是干这个的；第二顺位才是「让压缩并行」。

你要是也在调构建，建议先用 `speed-measure-webpack-plugin` 跑一次，看清楚耗时分布再动手，不要凭感觉一顿加插件。

## 二、持久化缓存，二次构建的最大杠杆

### 2.1 一行配置开启

持久化缓存（Persistent Caching）是 Webpack 5 最有分量的新特性。它把首次构建的过程和结果数据序列化到本地文件系统，下次构建时直接把 `Module`、`ModuleGraph`、`Chunk` 这些对象的状态读回来，跳过解析、转译、链接这些真正花时间的操作。

社区里被反复引用的一组实测数据是这样的：一个约 360 份 JS 文件、合计 3 万行代码的中大型项目，配了 `babel-loader` 和 `eslint-loader`，不开缓存时构建耗时在 11000 毫秒到 18000 毫秒之间；开了缓存之后，第二次构建降到 500 毫秒到 800 毫秒，差了将近 50 倍。这个量级和我自己在中等规模项目上的体感是对得上的，不过具体倍数跟项目结构关系很大，别把它当成承诺。

开启只需要一行：

```javascript
module.exports = {
  //...
  cache: {
    type: 'filesystem'
  },
  //...
};
```

`type` 的另一个取值是 `memory`，那是开发模式的默认值，进程一退就没了。要跨进程复用就必须用 `filesystem`。

### 2.2 配置项逐个说清

**`cache.cacheDirectory`** 是缓存文件的落盘位置，默认在 `node_modules/.cache/webpack`。放在这里的好处是天然被 `.gitignore` 覆盖；改到项目根目录下的话，记得自己加一条忽略规则。

**`cache.buildDependencies`** 是最容易漏配的一项。它声明「哪些文件变了就整个缓存作废」，通常填各种配置文件：

```javascript
module.exports = {
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [
        path.join(__dirname, 'webpack.dll_config.js'),
        path.join(__dirname, '.babelrc')
      ],
    },
  },
};
```

不配这个会出什么事？你改了 `.babelrc` 里的 preset，构建却还在用旧规则转译出来的缓存产物，然后开始怀疑人生。这种问题排查起来特别费劲，因为代码看着完全没问题。最省事的写法是 `config: [__filename]`，把 webpack 配置文件自己加进去，再把 babel、postcss 这类配置文件补上。

**`cache.managedPaths`** 是受控目录，命中的路径会跳过新旧内容哈希和时间戳的比对，直接用缓存副本，默认值是 `['./node_modules']`。这个假设成立的前提是你不会手改 `node_modules` 里的文件，用 `patch-package` 之类工具的项目要留个心眼。新版本里 `snapshot.managedPaths` 也控制同一类行为，具体取哪个以你用的 Webpack 版本文档为准。

**`cache.maxAge`** 是缓存失效时间，默认 `5184000000` 毫秒，也就是 60 天。**`cache.profile`** 打开后会输出缓存处理过程的详细日志，默认 `false`，排查「为什么缓存没生效」时很有用。

完整配置长这样：

```javascript
const path = require('path');

module.exports = {
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
    buildDependencies: {
      config: [__filename],
    },
    managedPaths: [/^(.+?[\\/]node_modules[\\/])/],
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
    compression: 'gzip',
    profile: true,
  },
};
```

`compression` 值得单独说一句。开 `gzip` 能把缓存目录体积压下来，代价是每次读写都要多一次压缩解压。本地磁盘够用的话不开更快，CI 上要把缓存目录当 artifact 传来传去时再考虑开。

### 2.3 缓存到底缓存了什么

Webpack 的构建过程可以拆成三段。**初始化阶段**根据配置装配内置插件。**Make 阶段**从 `entry` 开始，读文件、调 `Loader` 转译、用 `acorn` 生成 `AST`、分析出依赖列表，然后对每个依赖递归重复这套流程，最终产出完整的模块依赖图 `ModuleGraph`。**Seal 阶段**遍历这张图，把每个模块做代码转译（比如 `import` 转成 `require` 调用），分析运行时依赖，合并模块代码和运行时代码生成 `chunk`，执行 `Tree-shaking` 这类产物优化，最后写出文件。

持久化缓存做的事情就是在首次构建结束后，把 `Module`、`Chunk`、`ModuleGraph` 这三类对象的状态序列化存下来；下次构建开始时尝试读回来并恢复。恢复成功的部分，`Loader` 链、`AST` 解析、依赖分析就全都不用再跑了。

明白了这一点就能理解它的边界。缓存加速的是 Make 阶段，Seal 阶段的压缩该跑还得跑。所以开了缓存之后你会发现开发构建快得飞起，生产构建的提升却没那么夸张，那是因为生产构建的大头在 Terser 上。

### 2.4 Loader 层再叠一层缓存

Webpack 原生缓存之外，各个 `Loader` 自己也有缓存能力，两层可以叠加。

`babel-loader` 的写法：

```javascript
module.exports = {
  module: {
    rules: [{
      test: /\.m?js$/,
      loader: 'babel-loader',
      options: {
        cacheDirectory: true,
        cacheCompression: false, // 关闭压缩以提升缓存读写速度
      },
    }]
  },
};
```

`cacheCompression: false` 这一项建议一定要加。Babel 默认会 gzip 压缩缓存文件，省下来的磁盘空间远不如压缩解压花掉的时间值钱。

ESLint 和 Stylelint 走插件形式，各有各的缓存文件：

```javascript
const ESLintPlugin = require('eslint-webpack-plugin');
const StylelintPlugin = require('stylelint-webpack-plugin');

module.exports = {
  plugins: [
    new ESLintPlugin({
      cache: true,
      cacheLocation: './.eslintcache',
    }),
    new StylelintPlugin({
      files: '**/*.css',
      cache: true,
      cacheLocation: './.stylelintcache',
    }),
  ],
};
```

顺带提一句，老项目里常见的 `eslint-loader` 已经废弃了，官方推荐换成上面这个 `eslint-webpack-plugin`。原因是 loader 形态会把 lint 塞进转译链路里串行执行，插件形态可以并行跑，构建阻塞更少。

这两层缓存都开上之后，构建性能通常还能再有三成到八成的提升，具体幅度看你的 lint 规则有多重。

## 三、Tree-shaking，把没用的代码摇下来

### 3.1 三个前提缺一不可

`Tree-shaking` 是基于 `ES Module` 规范的 Dead Code Elimination。它静态分析模块之间的导入导出关系，找出那些从来没被别人用过的导出值，然后删掉。Webpack 从 2.0 就支持了，但真正好用是在 5 之后。

要让它跑起来，三个条件必须同时满足：

1. 模块代码用 `ESM` 规范编写
2. `optimization.usedExports` 为 `true`，开启标记功能
3. 开启代码优化，也就是 `mode: 'production'` 或者手动把 `optimization.minimize` 设成 `true`

```javascript
module.exports = {
  entry: "./src/index",
  mode: "production",
  devtool: false,
  optimization: {
    usedExports: true,
  },
};
```

实际写生产配置时，`mode: 'production'` 已经把 `usedExports` 和 `minimize` 都默认打开了，显式写出来主要是为了让配置更好读，或者你要在 `development` 下调试 `Tree-shaking` 效果时用。

### 3.2 它其实是两步

很多人以为 `Tree-shaking` 是一步搞定的，其实是标记和删除两个独立环节，分别由两拨代码负责。

**第一步是标记。** `optimization.usedExports` 打开后，Webpack 会分析出哪些导出没被用到，然后把对应的导出语句删掉。注意，只删导出语句，变量定义还留着。

```javascript
// bar.js
export const bar = 'bar';
export const foo = 'foo';

// index.js
import { bar } from './bar';
console.log(bar);
```

这段代码经过标记后，产物里 `foo` 的导出语句没了，但 `const foo = 'foo'` 这行还在。

**第二步才是删除。** 上一步之后，`foo` 已经变成一段不可能被执行到的死代码，这时候由 `Terser` 的 DCE 能力把定义语句一并干掉，`Tree-shaking` 才算完整完成。

理解这个分工很有用。你在开发模式下看不到摇树效果，不是配置错了，是因为压缩器根本没跑。

### 3.3 六条实践，每条都对应一种失效场景

**实践一，坚持写 ESM。** 静态分析的前提是导入导出关系在编译期就能确定，所以 ESM 要求所有导入导出语句只能出现在模块顶层，模块名必须是字符串常量。

```javascript
// ✅ 推荐：ESM写法
import { bar, foo } from './bar';
export const baz = 'baz';

// ❌ 不推荐：动态导入
const moduleName = 'bar';
import(moduleName);

// ❌ 不推荐：条件导出
if (process.env.NODE_ENV === 'development') {
  export const devTool = 'dev';
}
```

模块名是变量，Webpack 在编译期就不知道你要引什么，只能把整个目录都打进去。

**实践二，别让 Babel 把 ESM 转成 CommonJS。** 这是老项目里最常见的一个坑。`@babel/preset-env` 默认会把 `import`/`export` 转成 `require`，转完之后 Webpack 面对的就是一堆动态的 `require` 调用，静态分析直接失效，摇树全废。

```javascript
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', {
      modules: false, // 关键：关闭模块转换，保留ESM
    }],
  ],
};
```

**实践三，导出粒度要细。** `Tree-shaking` 作用在 `export` 语句上，一个 `default` 导出的大对象，哪怕你只用其中一个属性，整个对象也会被完整保留。

```javascript
// ❌ 不推荐：整个对象被保留
export default {
  bar: 'bar',
  foo: 'foo',
  baz: 'baz',
};

// ✅ 推荐：按需导出
const bar = 'bar';
const foo = 'foo';
const baz = 'baz';

export { bar, foo, baz };

// ✅ 推荐：独立文件导出
export const bar = 'bar';
export const foo = 'foo';
export const baz = 'baz';
```

**实践四，用 `#pure` 标注。** 对于没有副作用的函数调用，加上 `/*#__PURE__*/` 备注可以明确告诉 Webpack 这次调用不影响上下文，返回值没人用就能整段删掉。

```javascript
// ❌ 不带pure标注，代码被保留
const result = someFunction('retained');

// ✅ 带pure标注，函数调用被删除（如果返回值未使用）
const result = /*#__PURE__*/ someFunction('removed');
```

React 组件用高阶函数包一层时特别值得加：

```javascript
// ✅ 标记组件为pure，可以被Tree-shaking
const MyComponent = /*#__PURE__*/ React.memo(({ name }) => {
  return <div>{name}</div>;
});
```

**实践五，选支持摇树的包。** `lodash` 的 CommonJS 版本整包引入之后一点都摇不掉：

```javascript
// ❌ 不推荐：lodash整个包被引入
import _ from 'lodash';
_.map([1, 2, 3], n => n * 2);

// ✅ 推荐：lodash-es支持Tree-shaking
import { map } from 'lodash-es';
map([1, 2, 3], n => n * 2);

// ✅ 推荐：使用具体函数
import map from 'lodash/map';
```

**实践六，异步模块也能摇。** Webpack 5 支持用魔法注释指定动态导入只取哪几个导出：

```javascript
import(/* webpackExports: ["foo", "default"] */ "./foo").then((module) => {
  console.log(module.foo);
});
```

### 3.4 别忘了 sideEffects

上面六条讲的都是 `usedExports` 这条线，Webpack 还有另一条更狠的路子，就是 `package.json` 里的 `sideEffects` 字段。

`usedExports` 是「看有没有人用到某个导出」，粒度在导出语句上；`sideEffects` 是「这个模块声明自己没有副作用」，Webpack 可以直接把整个模块从依赖图里摘掉，连读都不用读，粒度在文件上，效果更彻底。

```json
{
  "name": "my-lib",
  "sideEffects": ["*.css", "*.scss", "./src/polyfill.js"]
}
```

这里有个坑要注意。写成 `"sideEffects": false` 是在声明「我这个包里所有模块都没有副作用」，如果包里有 `import './style.css'` 这种纯副作用引入，样式会被整个摇掉，页面直接裸奔。所以正确姿势是用数组把 CSS 和 polyfill 这类文件列进白名单，而不是一刀切写 `false`。

## 四、SplitChunks，把包切得更聪明

### 4.1 不分包会怎样

Webpack 默认倾向于把尽可能多的模块打进一个包，好处是页面 HTTP 请求数少。放到今天，这个默认行为有两个明显的问题。

一是首屏包过大，用户要等整个 bundle 下载解析完才能看到东西。二是浏览器缓存基本用不上，`node_modules` 里那些几个月不动的依赖和你每天改十次的业务代码打在一起，业务代码改一行，用户就得重新下载整个 3MB 的包。

`SplitChunksPlugin` 是 Webpack 4 之后内置的分包方案，和 Webpack 3 时代的 `CommonsChunkPlugin` 相比，它用一套启发式规则把 `Module` 编排进不同的 `Chunk`，规则更灵活也更合理。

### 4.2 三种 Chunk

`Chunk` 是 Webpack 组织产物的核心概念。进入 Seal 阶段后，它会先根据 `entry` 创建若干 `Chunk` 对象，然后遍历 Make 阶段找到的所有 `Module`，把同一个 `Entry` 下的模块分配进对应的 `Chunk`，遇到异步模块就新建一个 `Chunk`，最后再用 `SplitChunksPlugin` 的启发式算法对这些 `Chunk` 做裁剪、拆分、合并和调优。

默认产出三类：

**Initial Chunk** 是 `entry` 模块及其同步子模块。**Async Chunk** 是通过 `import('./xx')` 导入的异步模块及其子模块。**Runtime Chunk** 是 Webpack 自己的运行时代码，负责模块加载和依赖解析。

### 4.3 核心配置

**`chunks`** 决定分包作用范围：

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all', // 'initial' | 'async' | 'all'
    },
  },
};
```

`'all'` 对两类 Chunk 都生效，也是绝大多数项目该选的值。`'initial'` 只管同步的，`'async'` 只管异步的，默认值就是 `'async'`，所以很多人不改这一项会奇怪「为什么 vendors 没拆出来」。

**`minChunks`** 是引用次数阈值：

```javascript
splitChunks: {
  minChunks: 2, // 被2个以上Chunk引用的模块才会单独分包
}
```

**`minSize` / `maxSize`** 限制分包体积：

```javascript
splitChunks: {
  minSize: 20000,  // 超过20KB才分包
  maxSize: 244000, // 超过244KB尝试进一步拆分
}
```

`minSize` 是在防止把一堆几百字节的小模块拆成几十个文件，那样 HTTP 开销反而更大。`maxSize` 是尽力而为的，Webpack 会尝试拆但不保证一定能拆到那么小，一个不可分割的巨型依赖它也没办法。

**`maxInitialRequests` / `maxAsyncRequests`** 限制并行请求数：

```javascript
splitChunks: {
  maxInitialRequests: 30,
  maxAsyncRequests: 30,
}
```

Webpack 5 里这两个默认都是 30，比 4 的时代宽松很多，因为 HTTP/2 之下多路复用让请求数不再是瓶颈。

### 4.4 缓存组才是重点

缓存组能为不同类型的资源设置各自的分包规则，这才是分包配置真正干活的地方。一个典型的 vendors 拆分：

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          minChunks: 1,
          minSize: 0,
          priority: 10,
          name: 'vendors',
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
          name: 'common',
        },
      },
    },
  },
};
```

`priority` 决定一个模块同时命中多个组时归谁。数字大的赢，所以 `vendors` 的 10 会盖过 `common` 的 5。

生产环境完整一点的写法，把大型依赖再单独拆一层：

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 30,
      maxAsyncRequests: 30,
      minSize: 20000,
      cacheGroups: {
        // 第三方库单独打包
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          chunks: 'initial',
        },
        // 大型第三方库单独打包
        largeVendors: {
          test: /[\\/]node_modules[\\/](react|react-dom|lodash)[\\/]/,
          name: 'large-vendors',
          priority: 20,
          chunks: 'all',
        },
        // 公共模块打包
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    // 运行时独立打包
    runtimeChunk: 'single',
  },
};
```

把 `react`、`react-dom` 这类几乎不变的大依赖单拎出来，是为了让它们的 `contenthash` 长期保持稳定，用户装一次缓存能吃很久。

Webpack 自己内置了两个组，你写的 `cacheGroups` 是和它们合并的：

```javascript
// Webpack内置配置
cacheGroups: {
  default: {
    idHint: "",
    reuseExistingChunk: true,
    minChunks: 2,
    priority: -20
  },
  defaultVendors: {
    idHint: "vendors",
    reuseExistingChunk: true,
    test: /[\\/]node_modules[\\/]/i,
    priority: -10
  }
}
```

内置组的 `priority` 是负数，所以你自己定义的组只要不写负优先级，都会盖过它们。想彻底关掉某个内置组，把它设成 `false` 就行。

### 4.5 runtimeChunk 和长期缓存

`runtimeChunk: 'single'` 这一行看着不起眼，但它是长期缓存能不能生效的关键。

Webpack 的运行时代码里存着「模块 id 到 chunk 文件名」的映射表。如果不把它单独抽出来，运行时会被塞进入口 chunk 里，那么你任何一个异步 chunk 的 `contenthash` 变了，入口 chunk 的内容也会跟着变，`contenthash` 跟着变，用户的入口文件缓存作废。

抽成单独的 runtime 文件之后，变的只是那个几 KB 的 runtime，vendors 和入口都能保持稳定。那为什么还有人不加呢？因为多了一个请求，而且这个请求还必须最先加载。在 HTTP/2 下这个成本基本可以忽略，加上就对了。

## 五、并行构建，什么时候是负优化

### 5.1 Node 单线程带来的天花板

Webpack 跑在 Node 上，所有解析、转译、合并操作本质是在同一个线程里串行执行，多核 CPU 大部分核心都在闲着。绕开的办法只有派生子进程，主流方案有四个：

- **`HappyPack`**，多进程跑 `Loader`，已停止维护
- **`Thread-loader`**，Webpack 官方出品，同样多进程跑 `Loader`
- **`Parallel-Webpack`**，多进程跑多个 Webpack 构建实例
- **`TerserWebpackPlugin`**，多进程执行代码压缩

### 5.2 Thread-loader 用法

它的用法是把自己放在 loader 链的最前面，后面的 loader 就会被丢到 worker 池里跑：

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          "thread-loader",
          "babel-loader",
          "eslint-loader",
        ],
      },
    ],
  },
};
```

上面这段是原始写法，其中 `eslint-loader` 现在应该换成 `eslint-webpack-plugin`，前面讲缓存时提过。

带参数的完整版：

```javascript
const threadLoader = require('thread-loader');

const threadLoaderOptions = {
  workers: require('os').cpus().length - 1,
  workerParallelJobs: 50,
  poolTimeout: 500,
  poolRespawn: false,
};

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'thread-loader',
            options: threadLoaderOptions,
          },
          'babel-loader',
        ],
      },
    ],
  },
};
```

`workers` 留一个核给主进程是个好习惯，全占满反而会互相抢。`poolTimeout` 在 watch 模式下建议设成 `Infinity`，让 worker 常驻，否则每次重新编译都要重启进程池。

进程启动本身要花时间，可以提前预热：

```javascript
const threadLoader = require('thread-loader');

// 预热worker进程
threadLoader.warmup(
  {
    workers: 2,
    workerParallelJobs: 50,
  },
  [
    'babel-loader',
    '@babel/preset-env',
  ]
);

module.exports = { /* ... */ };
```

用它有几个硬限制。跑在 `thread-loader` 里的 loader 拿不到 `compilation`、`compiler` 实例，也不能调 `emitAsset` 这类接口，因为子进程和主进程之间只能传可序列化的数据。碰到这类 loader，把它放到 `thread-loader` 前面：

```javascript
// ❌ 错误：style-loader无法正常工作
use: ['thread-loader', 'style-loader', 'css-loader']

// ✅ 正确：style-loader在thread-loader之前
use: ['style-loader', 'thread-loader', 'css-loader']
```

### 5.3 并行压缩

Webpack 5 默认用 `Terser` 压缩，`TerserWebpackPlugin` 的 `parallel` 默认就是开的，一般不用管。要调压缩行为时才需要显式配置：

```javascript
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true, // 默认开启，可设置具体数值
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
          output: {
            comments: false,
          },
        },
      }),
    ],
  },
};
```

`drop_console: true` 用之前想清楚，线上出问题时你会失去所有 `console` 线索。我的做法是只 drop `console.log` 和 `console.debug`，保留 `console.error` 和 `console.warn`。

### 5.4 HappyPack 的写法留个档

Webpack 4 及之前的老项目里还能见到它，迁移时对照着看：

```javascript
const HappyPack = require('happypack');
const os = require('os');

const happyThreadPool = HappyPack.ThreadPool({
  size: os.cpus().length - 1,
});

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'happypack/loader?id=js',
      },
    ],
  },
  plugins: [
    new HappyPack({
      id: 'js',
      threadPool: happyThreadPool,
      loaders: ['babel-loader', 'eslint-loader'],
    }),
  ],
};
```

新项目就别用了，作者已经明确不再维护，直接上 `thread-loader`。

| 方案 | 适用场景 | 特点 |
|------|---------|------|
| `HappyPack` | Webpack 4之前 | 已停止维护 |
| `Thread-loader` | Webpack 4+ | 官方维护，推荐使用 |
| `Parallel-Webpack` | 多入口/MPA | 适合类库打包 |
| `TerserWebpackPlugin` | 生产环境 | 默认开启 |

最后必须提醒一句，多进程不是免费的。派生一个子进程的开销一般认为在 600 毫秒量级，加上进程间通信要序列化反序列化，小项目上这些成本很可能比省下来的转译时间还多。所以顺序应该是：先开持久化缓存和 Loader 缓存，再用 `speed-measure-webpack-plugin` 量一次，确认某个 loader 确实是瓶颈，最后才考虑多进程。

## 六、开发体验相关的三件事

### 6.1 HMR

模块热替换（Hot Module Replacement）允许在运行时替换、添加、删除模块，不用刷新整个页面，表单填了一半的状态能保住：

```javascript
const webpack = require('webpack');

module.exports = {
  devServer: {
    hot: true,
    hotOnly: false,
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
};
```

这段配置是 webpack-dev-server 3 时代的写法。dev-server 4 之后，`hotOnly` 被移除了，等价写法是 `hot: 'only'`；而且只要设了 `hot: true`，dev-server 会自动帮你加上 `HotModuleReplacementPlugin`，手动再加一遍会报重复注册的错。用 dev-server 4 的项目把这两行删掉就行。

手写 HMR 逻辑的 API 是这几个：

```javascript
// 判断是否支持HMR
if (module.hot) {
  // 接受模块更新
  module.hot.accept('./module', function() {
    console.log('模块已更新');
    // 重新执行更新逻辑
  });

  // 条件性接受更新
  module.hot.accept(['./module1', './module2'], function() {
    // 处理多个模块更新
  });

  // 拒绝更新（回退到刷新）
  module.hot.decline('./module');
}
```

日常用 React 或 Vue 的项目基本不用自己写这些，`react-refresh-webpack-plugin` 和 `vue-loader` 已经把组件级热更新处理好了。自己写 `accept` 的场景主要是纯 JS 模块，比如一份配置表、一个状态管理的 store。

### 6.2 SourceMap 怎么选

| 类型 | 构建速度 | 调试支持 | 适用场景 |
|------|---------|---------|---------|
| `eval` | 最快 | 仅限业务代码 | 快速开发 |
| `eval-source-map` | 较慢 | 完整 | 开发调试 |
| `cheap-module-source-map` | 中等 | 仅行 | 生产开发 |
| `hidden-source-map` | 较慢 | 完整 | 生产环境 |
| `source-map` | 最慢 | 完整 | 正式发布 |

开发环境的平衡点一般是这个：

```javascript
module.exports = {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
};
```

`cheap` 表示只映射行不映射列，速度快很多，日常调试够用。`module` 表示映射回 loader 处理前的源码，少了它你看到的就是 Babel 转译后的代码。

生产环境的选择是个安全问题：

```javascript
module.exports = {
  mode: 'production',
  devtool: 'hidden-source-map',
  // 或使用nosources-source-map不生成源码内容
  devtool: 'nosources-source-map',
};
```

`hidden-source-map` 会生成 map 文件但不在 bundle 末尾写引用注释，配合 Sentry 这类平台单独上传 map，用户拿不到源码，你还能看到还原后的堆栈。直接用 `source-map` 等于把源码挂在公网上，别这么干。

### 6.3 先量再改

`webpack-bundle-analyzer` 看产物构成，哪个包胖一眼就出来：

```javascript
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-report.html',
    }),
  ],
};
```

`speed-measure-webpack-plugin` 看耗时分布，哪个 loader 拖后腿也一眼就出来：

```javascript
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');

const smp = new SpeedMeasurePlugin();

module.exports = smp.wrap({
  // webpack配置
});
```

这里有个坑要注意，`speed-measure-webpack-plugin` 和一部分插件（尤其是 `mini-css-extract-plugin`）配合会报错，它包装的是 plugin 的 hooks，遇到写法特殊的插件就会崩。所以它只适合临时套上去量一次，量完就注释掉，别常驻在配置里。

## 七、一份可以直接复制的生产配置

把上面的东西合到一起：

```javascript
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    clean: true,
  },
  // 持久化缓存
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
  optimization: {
    // Tree-shaking
    usedExports: true,
    // 代码分割
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
      },
    },
    // 运行时独立
    runtimeChunk: 'single',
    // 并行压缩
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
    ],
  },
  // 性能提示
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};
```

`output.clean: true` 是 Webpack 5 的内置能力，以前要装 `clean-webpack-plugin` 才能做到，现在一行配置就够了。同类的还有 Asset Modules，图片、字体这些资源不再需要 `file-loader` 和 `url-loader`，直接用 `type: 'asset/resource'` 就行，老项目升级时记得把这几个 loader 删掉。

顺便说一下 `Module Federation`，它也是 Webpack 5 带来的能力，属于跨应用共享模块的方案，配置和取舍我在另一篇里展开写了：[微前端落地方案对比](https://feinterview.poetries.top/blog/micro-frontend-comparison)。依赖安装这一层如果也想提速，可以看看 [pnpm 的用法与原理](https://feinterview.poetries.top/blog/pnpm-package-manager-guide)。

## 八、上线前 checklist

调完配置别急着发版，这几条挨条过一遍：

- [ ] `mode: 'production'`，别靠手动开 `usedExports` 和 `minimize` 拼凑
- [ ] `cache.type: 'filesystem'` 已开，`buildDependencies.config` 覆盖了 webpack、babel、postcss 所有配置文件
- [ ] 缓存目录进 `.gitignore`，CI 上把它配成可复用的 cache
- [ ] `babel-loader` 开 `cacheDirectory` 且 `cacheCompression: false`
- [ ] `eslint-loader` 已换成 `eslint-webpack-plugin` 并开缓存
- [ ] `@babel/preset-env` 的 `modules` 设为 `false`
- [ ] `package.json` 的 `sideEffects` 用数组白名单，CSS 和 polyfill 都列进去了
- [ ] `output.filename` 用 `[contenthash]`，配合 `runtimeChunk: 'single'`
- [ ] `splitChunks.chunks` 设成 `'all'`，vendors 拆出来了
- [ ] 跑一次 `webpack-bundle-analyzer`，确认没有把全量 `lodash`、`moment` 的全部 locale 打进主包
- [ ] 生产 `devtool` 用 `hidden-source-map` 或 `nosources-source-map`，map 文件不要发到 CDN 公开目录
- [ ] `performance.hints` 打开并设了合理阈值
- [ ] `output.clean: true`，避免旧产物残留
- [ ] 上多进程之前先用 `speed-measure-webpack-plugin` 量过，确认瓶颈真在 loader 上
- [ ] 小项目不要上 `thread-loader`，进程创建成本可能盖过收益
- [ ] 改过 webpack 或 babel 配置后，确认缓存确实失效了，别拿旧产物发版

## 总结

Webpack 5 的优化不是配置项越多越好，关键是把手段对准阶段。Make 阶段慢就上持久化缓存和 Loader 缓存，这是投入产出比最高的一步，一行 `cache.type: 'filesystem'` 加上正确的 `buildDependencies` 就能吃到大部分收益。Seal 阶段慢就开并行压缩，Terser 默认已经开了，多数时候不用额外做什么。

产物体积这条线上，`Tree-shaking` 要同时满足 ESM、`usedExports`、压缩三个前提，最容易踩的坑是 Babel 把模块转成了 CommonJS；`sideEffects` 比 `usedExports` 更彻底，但一定要用数组白名单而不是 `false`。分包的核心是让稳定的依赖和易变的业务代码分开，`chunks: 'all'` 加上 vendors 缓存组是起点，`runtimeChunk: 'single'` 是长期缓存能不能生效的开关。

多进程这类方案要放在最后考虑，先量再改，别在小项目上引入 600 毫秒起步的进程开销。

Webpack 5 还带来了 `Module Federation`、`Asset Modules`、`output.clean` 这些能力，老项目升级时顺手把 `file-loader`、`url-loader`、`clean-webpack-plugin` 这几个依赖删掉，配置会清爽不少。

## 参考

- [Webpack - Cache 配置](https://webpack.js.org/configuration/cache/)
- [Webpack - Tree Shaking 指南](https://webpack.js.org/guides/tree-shaking/)
- [Webpack - SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/)
- [Webpack - Devtool 配置](https://webpack.js.org/configuration/devtool/)
- [Webpack - Asset Modules](https://webpack.js.org/guides/asset-modules/)
- [Webpack - Module Federation](https://webpack.js.org/concepts/module-federation/)
- [thread-loader 仓库](https://github.com/webpack-contrib/thread-loader)
- [terser-webpack-plugin 仓库](https://github.com/webpack-contrib/terser-webpack-plugin)
- [eslint-webpack-plugin 仓库](https://github.com/webpack-contrib/eslint-webpack-plugin)
- [前端进阶之旅](https://interview.poetries.top)
