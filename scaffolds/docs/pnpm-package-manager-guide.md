---
title: 拯救磁盘空间 为什么pnpm是更好的包管理工具
date: 2023-05-26 14:40:12
description: 深度解读pnpm包管理工具，对比npm/yarn的差异，详解硬链接与软链接原理，分析pnpm的性能优势、磁盘空间优化和安全性保障，包含Workspace工作空间完整用法。
tags:
- pnpm
- npm
- yarn
- 包管理工具
- 前端工程化
- Workspace
categories: Front-End
---

在前端开发中，我们每天都会与各种`npm`包打交道，选择一个合适的包管理工具能显著提升开发体验和构建效率。近年来，`pnpm`作为一款新兴的包管理工具逐渐受到越来越多开发者青睐，它究竟有何魅力能让众多开源项目纷纷转投其怀抱？本文将带你深入了解`pnpm`的原理与优势。

## 一、为什么需要更好的包管理工具

### 1.1 npm与yarn的发展历程

在早期`npm 1`、`npm 2`时代，项目的`node_modules`会呈现出嵌套结构：

```text
node_modules
└─ foo
   ├─ index.js
   ├─ package.json
   └─ node_modules
      └─ bar
         ├─ index.js
         └─ package.json
```

这种嵌套依赖树设计存在三个严重问题：

**问题一：依赖层级太深**

这会导致文件的路径过长的问题，尤其在Windows系统下文件路径默认最多支持256个字符。

**问题二：包重复安装**

比如`foo`和`zoo`都依赖于`bar`，那么`bar`就会在两者的`node_modules`中被安装两次，导致项目体积暴涨。

**问题三：模块实例不能共享**

比如React有一些内部变量，在两个不同包引入的React不是同一个模块实例，因此无法共享内部变量，导致一些不可预知的bug。

后来`yarn`横空出世解决了这些问题，`npm`也在3.0版本中沿用了`yarn`的解决方案，这个解决方案就是**扁平化依赖**。

### 1.2 扁平化依赖带来的新问题

所谓的扁平化依赖就是将所有依赖铺平，放到同一级目录下：

```text
node_modules
├─ foo
│  ├─ index.js
│  └─ package.json
└─ bar
   ├─ index.js
   └─ package.json
```

虽然之前的问题得到了解决，但这种扁平化的处理方式自身也存在许多问题：

**问题一：幽灵依赖**

所谓的幽灵依赖是指我们明明没有在`package.json`的`dependencies`里声明某个依赖，但在代码里却可以`import`进来。因为项目依赖被铺平了，那么依赖的依赖自然也是可以被引入到项目中。

幽灵依赖带来的弊端很明显：我们显式依赖了A，A又依赖了B，这时候我们在项目中直接使用B是可以的，但如果某一天A不再依赖于B，那么我们项目中使用B的地方就会报错。

**问题二：依赖结构不确定性**

举例来说，如果项目同时依赖`foo`和`bar`，而它们都依赖不同版本的`lodash`，那么最终安装哪个版本是不确定的，完全取决于`package.json`中的声明顺序。

这就是为什么会产生依赖结构的`不确定`问题，也是`lock文件`诞生的原因，无论是`package-lock.json`还是`yarn.lock`，都是为了保证install之后都产生确定的`node_modules`结构。

**问题三：非法访问依赖**

由于扁平化结构，如果A依赖B，B依赖C，那么A当中是可以直接使用C的，但A并没有声明C这个依赖，这就是非法访问。

在monorepo项目中，如果A依赖X，B依赖X，还有一个C，它不依赖X，但它代码里面用到了X。由于依赖提升的存在，npm/yarn会把X放到根目录的node_modules中，这样C在本地是能够跑起来的。但试想一下，一旦C单独发包出去，用户单独安装C，那么就找不到X了，执行到引用X的代码时就直接报错了。

正是这些问题促使了`pnpm`的诞生。

## 二、pnpm是什么

`pnpm`（Performant NPM）是一个**快速的**、**节省磁盘空间**的包管理工具，同时它还对`monorepo`有良好的支持。

```bash
# 安装pnpm
npm i pnpm -g
```

它的用处与`npm`和`yarn`并没有什么本质区别，甚至连用法都十分相似，但却在性能和安全性方面有显著优势。

## 三、pnpm核心优势

### 3.1 安装速度快

根据官方文档的benchmark测试数据，`pnpm`在大多数场景下的安装速度都要优于`npm`和`yarn`。

可以看到，`pnpm`在绝多大数场景下，包安装的速度都是明显优于`npm/yarn`，速度会比`npm/yarn`快2-3倍。

对yarn比较熟悉的同学可能会说，yarn不是有`PnP安装模式`吗？直接去掉`node_modules`，将依赖包内容写在磁盘，节省了node文件I/O的开销，这样也能提升安装速度。

但总体而言，`pnpm`的包安装速度还是明显优于`yarn` `npm`。

这是因为`pnpm`采用了并行的网络请求和本地缓存策略，减少了等待时间。

### 3.2 节省磁盘空间

`pnpm`内部使用**基于内容寻址存储（CAS - Content-addressable store）**的方式来存储依赖。

**硬链接与软链接机制**

- **硬链接**（hard link）：多个文件平等地共享同一个文件存储单元
- **符号链接/软链接**（Symbolic link）：一种特殊的文件，包含有一条指向其它文件或者目录的引用

软链接其实很好理解，它就相当于Windows系统中的快捷方式。一个符号链接文件仅包含有一个文本字符串，其被操作系统解释为一条指向另一个文件或者目录的路径。它是一个独立文件，其存在并不依赖于目标文件。

硬链接可以理解成给同一个文件创建了多个入口，它们都指向磁盘上的同一个存储位置。删除任何一个硬链接不影响其他链接，只有当所有硬链接都被删除时，文件才会被真正删除。

`pnpm`的磁盘空间优化策略包括：

1. **不会重复安装同一个包**：用`npm/yarn`的时候，如果100个项目都依赖`lodash`，那么`lodash`很可能就被安装了100次，磁盘中就有100个地方写入了这部分代码。但使用`pnpm`则只会安装一次，磁盘中只有一个地方写入，后面再次使用都会直接使用**硬链接**。

2. **不同版本复用**：即使一个包的不同版本，`pnpm`也会极大程度地复用之前版本的代码。比如`lodash`有100个文件，更新版本之后多了一个文件，那么磁盘当中并不会重新写入101个文件，而是保留原来100个文件的硬链接，**仅仅写入那一个新增的文件**。

### 3.3 安全性高

`pnpm`自创了一套依赖管理方式——**虚拟存储目录**，很好地解决了幽灵依赖和非法访问的问题。

在`pnpm`中，只有在`package.json`中显式声明的依赖才能被访问，未声明的依赖是无法引入的，这保证了项目的安全性。

### 3.4 支持Monorepo

`pnpm`对`monorepo`的支持体现在各个子命令的功能上：

```bash
# 在根目录下执行，所有package都会被添加依赖
pnpm add A -r

# 使用filter指定package
pnpm add lodash --filter package-a
```

## 四、pnpm依赖管理原理

### 4.1 npm/yarn的安装原理

当执行`npm/yarn install`命令之后，首先会构建依赖树，然后针对每个节点下的包会经历以下四个步骤：

1. 将依赖包的版本区间解析为某个具体的版本号
2. 下载对应版本依赖的tar包到本地离线镜像
3. 将依赖从离线镜像解压到本地缓存
4. 将依赖从缓存拷贝到当前目录的node_modules目录

### 4.2 node_modules目录结构

使用`pnpm`安装`express`后，目录结构如下：

```text
node_modules
├─ .pnpm
│  ├─ express@4.17.1
│  │  └─ node_modules
│  │     ├─ accept
│  │     └─ express
│  └─ accepts@1.3.7
│     └─ node_modules
│        └─ accepts
└─ express  → 软链接，指向.pnpm/express@4.17.1/node_modules/express
```

可以明显感觉到`pnpm`的目录结构更加合理：项目只依赖了`express`，那么`node_modules`中就只存在`express`的文件。

展开`.pnpm`文件夹，我们可以找到其真正的位置：`express`的真正位置位于`.pnpm/express@4.17.1/node_modules/express`。

这也代表了`pnpm`中的依赖规律，也是`<package-name>@version/node_modules/<package-name>`这种目录结构。

### 4.3 软链接与硬链接的协作

`pnpm`的依赖规律是`<package-name>@version/node_modules/<package-name>`这种目录结构：

1. 所有的依赖都是从全局`store`**硬链接**到了`node_modules/.pnpm`下
2. 项目中的直接依赖通过**软链接**指向`.pnpm`中的实际位置
3. 依赖包中的每个文件再硬链接到`.pnpm store`

```text
.pnpm
├─ accepts@1.3.7
│  └─ node_modules
│     └─ accepts  → 硬链接到store
├─ express@4.17.1
│  └─ node_modules
│     ├─ accepts  → ../accepts@1.3.7/node_modules/accepts (软链接)
│     └─ express
│        └─ index.js → 硬链接到store
```

这种设计将`包本身`和`依赖`放在同一个`node_module`下面，与原生Node完全兼容，又能将package与相关的依赖很好地组织到一起，设计十分精妙。

## 五、pnpm工作空间(Workspace)完全指南

### 5.1 什么是Monorepo

Monorepo（单体仓库）是一种将多个项目存放在同一个代码仓库中的开发策略。相比传统的多仓库方案，Monorepo可以让代码共享更加方便版本管理更加统一。

`pnpm`从设计上就原生支持Monorepo，通过`workspace`功能可以轻松管理多个包。

### 5.2 创建Workspace项目

首先在项目根目录创建`pnpm-workspace.yaml`文件：

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

然后创建项目结构：

```text
my-monorepo/
├── pnpm-workspace.yaml
├── package.json
├── packages/
│   ├── pkg1/
│   │   ├── package.json
│   │   └── src/index.js
│   └── pkg2/
│       ├── package.json
│       └── src/index.js
└── apps/
    └── web/
        ├── package.json
        └── src/index.js
```

### 5.3 Workspace常用命令

**安装所有依赖**

```bash
# 安装workspace下所有packages的依赖
pnpm install

# 或使用-r递归安装
pnpm install -r
```

**在所有package中安装依赖**

```bash
# 在根目录执行，所有package都会被添加lodash依赖
pnpm add lodash -r

# 指定添加到某个package
pnpm add lodash --filter pkg1
```

**使用filter过滤**

```bash
# 只在pkg1中安装
pnpm add lodash --filter pkg1

# 只在以@apps开头的package中安装
pnpm add lodash --filter '@apps/*'
```

**在特定package中执行命令**

```bash
# 在pkg1中执行构建命令
pnpm --filter pkg1 run build

# 简写形式
pnpm -F pkg1 run build
```

### 5.4 Workspace内部依赖

在workspace中，不同package之间可以相互引用：

```bash
# 将pkg2添加到pkg1的依赖中
pnpm add pkg2 --filter pkg1
```

这会自动在`packages/pkg1/package.json`中添加：

```json
{
  "dependencies": {
    "pkg2": "workspace:*"
  }
}
```

使用`workspace:*`可以引用当前workspace中的版本，确保所有package使用一致的内部依赖版本。

### 5.5 发布配置

在根目录的`package.json`中配置发布相关设置：

```json
{
  "name": "my-monorepo",
  "private": true,
  "publishConfig": {
    "access": "public"
  }
}
```

## 六、pnpm基本使用

`pnpm`的使用成本非常低，因为它的基础命令和`npm/yarn`基本相似。

### 6.1 安装依赖

```bash
# 安装项目所有依赖
pnpm install

# 安装 lodash
pnpm install lodash

# 添加至 devDependencies
pnpm install lodash -D

# 添加至 dependencies
pnpm install lodash -S
```

### 6.2 更新与卸载

```bash
# 更新依赖到最新版本
pnpm update

# 卸载依赖
pnpm uninstall lodash
```

### 6.3 运行脚本

```json
// package.json
{
  "scripts": {
    "dev": "webpack serve",
    "build": "webpack build"
  }
}
```

```bash
# 运行脚本
pnpm run dev
# 或简写
pnpm dev
```

### 6.4 其他常用命令

```bash
# 查看依赖信息
pnpm list

# 清理缓存
pnpm store prune

# 查看store路径
pnpm store path

# 动态执行包（类似npx）
pnpm dlx create-react-app my-app
```

## 七、三者功能对比一览

| 功能 | pnpm | Yarn | npm |
|------|:----:|:----:|:---:|
| 工作空间支持 | ✅ | ✅ | ✅ |
| 隔离的node_modules | ✅ | ✅ | ✅ |
| 提升的node_modules | ✅ | ✅ | ✅ |
| Plug'n'Play | ✅ | ✅ | ❌ |
| 自动安装对等依赖 | ✅ | ❌ | ✅ |
| 零安装 | ❌ | ✅ | ❌ |
| 修补依赖项 | ✅ | ✅ | ❌ |
| 管理Node.js版本 | ✅ | ❌ | ❌ |
| 内容可寻址存储 | ✅ | ✅ | ❌ |
| 动态包执行 | ✅ | ✅ | ✅ |
| 副作用缓存 | ✅ | ❌ | ❌ |
| 目录(Catalogs) | ✅ | ❌ | ❌ |
| 配置依赖项 | ✅ | ❌ | ❌ |
| 脚本运行前自动安装 | ✅ | ❌ | ❌ |
| 列出许可证 | ✅ | ✅ | ❌ |

### 核心差异解读

1. **pnpm vs npm/yarn 最大的区别**在于node_modules的结构：
   - npm/yarn采用扁平化结构，会产生幽灵依赖
   - pnpm采用虚拟存储目录，依赖严格隔离

2. **内容可寻址存储**让pnpm能够：
   - 同一包的不同项目只安装一次
   - 不同版本之间复用相同文件

3. **pnpm独有的功能**：
   - `pnpm env`：管理Node.js版本
   - `pnpm patch`：修补依赖项
   - `Catalogs`：目录功能

## 八、总结

`pnpm`相比`npm/yarn`的核心优势在于：

1. **更快**：安装速度比`npm/yarn`快2-3倍
2. **更省空间**：通过硬链接机制避免重复安装，节省大量磁盘空间
3. **更安全**：严格的依赖管理避免幽灵依赖和非法访问
4. **更规范**：清晰的目录结构，原生支持Monorepo

综合来看，`pnpm`是一个相比`npm/yarn`更为优秀的包管理方案。推荐在新项目中使用，体验现代包管理工具带来的效率提升。

---

*参考资料：*
- [pnpm官方文档](https://pnpm.io/zh/motivation)
- [pnpm性能基准测试](https://pnpm.io/zh/benchmarks)
- [Yarn PnP特性](https://classic.yarnpkg.com/en/docs/pnp/)
