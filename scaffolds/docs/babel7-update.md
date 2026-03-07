---
title: babel升级7.xx总结
date: 2018-11-28 14:40:08
tags: babel
categories: Front-End
---


## 一、自动升级


```
npx babel-upgrade --write --install
```

## 二、手动升级

### 2.1 安装依赖

```js
// Babel-loader 8.x
"babel-loader"

// Babel-core 7.x
"@babel/core"

// Env
"@babel/preset-env"

// Runtime
"@babel/runtime"
"@babel/plugin-transform-runtime"

// React
"@babel/preset-react"

// Stage 0
"@babel/plugin-proposal-function-bind"

// Stage 1
"@babel/plugin-proposal-export-default-from"
"@babel/plugin-proposal-logical-assignment-operators"
"@babel/plugin-proposal-optional-chaining"
"@babel/plugin-proposal-pipeline-operator"
"@babel/plugin-proposal-nullish-coalescing-operator"
"@babel/plugin-proposal-do-expressions"

// Stage 2
"@babel/plugin-proposal-decorators"
"@babel/plugin-proposal-function-sent"
"@babel/plugin-proposal-export-namespace-from"
"@babel/plugin-proposal-numeric-separator"
"@babel/plugin-proposal-throw-expressions"

// Stage 3
"@babel/plugin-syntax-dynamic-import"
"@babel/plugin-syntax-import-meta"
"@babel/plugin-proposal-class-properties"
"@babel/plugin-proposal-json-strings"
```

### 2.2 修改.babelrc

```js
{
  "presets": [
    ["@babel/preset-env", {
      "targets": {
        "browsers": [
          "last 2 versions",
          "Firefox ESR",
          "> 1%",
          "ie >= 9",
          "iOS >= 8",
          "Android >= 4"
        ]
      }
    }], "@babel/preset-react"
  ],
  "plugins": [
    "@babel/plugin-transform-runtime",

    "@babel/plugin-proposal-function-bind",

    "@babel/plugin-proposal-export-default-from",
    "@babel/plugin-proposal-logical-assignment-operators",
    ["@babel/plugin-proposal-optional-chaining", { "loose": false }],
    ["@babel/plugin-proposal-pipeline-operator", { "proposal": "minimal" }],
    ["@babel/plugin-proposal-nullish-coalescing-operator", { "loose": false }],
    "@babel/plugin-proposal-do-expressions",

    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    "@babel/plugin-proposal-function-sent",
    "@babel/plugin-proposal-export-namespace-from",
    "@babel/plugin-proposal-numeric-separator",
    "@babel/plugin-proposal-throw-expressions",

    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-syntax-import-meta",
    ["@babel/plugin-proposal-class-properties", { "loose": true }],
    "@babel/plugin-proposal-json-strings"
  ],
  "comments": false,
  "compact": false
}
```


## 三、更多参考

- [babel7使用手册](https://mp.weixin.qq.com/s/AURDiWwspdfRExopNf4YLQ)
- [webpack - babel 篇](https://juejin.im/post/5bfe541bf265da6179748834?utm_source=gold_browser_extension)
- [babel 升级到7.X采坑总结](https://segmentfault.com/a/1190000016458913)
- [一口气了解 babel](https://juejin.im/post/5c19c5e0e51d4502a232c1c6?utm_source=gold_browser_extension)
