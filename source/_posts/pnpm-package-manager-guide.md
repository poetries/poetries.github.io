---
title: 拯救磁盘空间 为什么 pnpm 是更好的包管理工具
date: 2023-05-26 14:40:12
description: 从 npm 早期嵌套 node_modules 到扁平化带来的幽灵依赖，讲清 pnpm 的硬链接与软链接机制、内容寻址存储、虚拟存储目录 .pnpm 的结构原理，以及 Workspace 工作空间的完整用法和踩坑点。
tags:
- pnpm
- npm
- yarn
- 包管理工具
- 前端工程化
- Workspace
- monorepo
categories: Front-End
---

有天我清理 `Mac` 硬盘，跑了一句 `du -sh ~/projects/*/node_modules`，结果加起来三十多个 G。十几个项目，每个都装了自己那一份 `react`、`lodash`、`webpack`，同一个版本的同一份代码在磁盘上被写了十几遍。删了一轮，过两周装回来又是三十个 G。

这就是我当初换 `pnpm` 的直接动机。后来用下来发现省空间只是它顺手做到的事，真正让我不想再回去的是它把 `node_modules` 那套混乱的扁平结构给理清楚了。这篇把 `pnpm` 为什么这么设计、它的软硬链接到底怎么工作、`Workspace` 怎么用，从头捋一遍。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `npm` 早期的嵌套 `node_modules` 踩过哪三个坑，为什么后来全行业改成扁平化
- 扁平化又带来了幽灵依赖、结构不确定、非法访问这三个新问题
- 硬链接和软链接的区别，以及 `pnpm` 的内容寻址存储是怎么省下磁盘的
- `node_modules/.pnpm` 这个虚拟存储目录的结构长什么样，为什么这么设计
- `Workspace` 从建目录到 `filter` 过滤、内部依赖、发布配置的完整用法
- `pnpm` / `yarn` / `npm` 的功能对比，以及什么情况下别用 `pnpm`

## 一、npm 早期的嵌套 node_modules 是怎么把自己坑死的

在早期 `npm 1`、`npm 2` 的年代，项目的 `node_modules` 是严格的嵌套结构，你依赖谁，谁的依赖就装在谁自己的目录里：

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

这个结构其实很符合直觉，依赖关系一目了然。但它有三个致命问题。

**问题一是依赖层级太深**。依赖套依赖套依赖，路径长度会指数级增长。这在 `Windows` 上直接要命，因为文件路径默认最多支持 256 个字符，层级一深就会出现「路径过长导致文件删不掉」这种诡异情况，很多老前端应该都被这个折磨过。

**问题二是包重复安装**。比如 `foo` 和 `zoo` 都依赖于 `bar`，那么 `bar` 就会在两者的 `node_modules` 中被安装两次。项目一大，同一个包被装几十份是常态，磁盘和安装时间都撑不住。

**问题三是模块实例不能共享**。这个最阴。`React` 有一些内部变量（比如那个著名的 hooks dispatcher），如果两个包各自引入了自己那份 `React`，它们拿到的**不是同一个模块实例**，内部变量自然对不上，跑出来就是各种玄学 bug。`Invalid hook call` 那个经典报错里专门列了「你可能有多份 React」这一条原因，说的就是这个。

后来 `yarn` 横空出世解决了这些问题，`npm` 也在 3.0 版本中沿用了 `yarn` 的解决方案，这个方案就是**扁平化依赖**。

## 二、扁平化解决了老问题，又造出三个新问题

所谓扁平化，就是把所有依赖（包括依赖的依赖）都铺平，尽量放到 `node_modules` 的同一级目录下：

```text
node_modules
├─ foo
│  ├─ index.js
│  └─ package.json
└─ bar
   ├─ index.js
   └─ package.json
```

`Node` 的模块解析规则是逐层向上找 `node_modules`，所以铺平之后 `foo` 依然能找到 `bar`。层级深、重复装、实例不共享这三个问题一次性解决了。

但这套处理方式自己也带来了新麻烦。

**幽灵依赖**。你明明没有在 `package.json` 的 `dependencies` 里声明某个包，代码里却能直接 `require` 或 `import` 进来。因为它是被依赖的依赖提升上来的，物理上就躺在 `node_modules` 根目录，`Node` 当然找得到。

这东西的危害不在当下，在未来。你显式依赖了 A，A 依赖了 B，你在项目里直接用 B 一点问题没有。但某天 A 升级不再依赖 B 了，或者 A 把 B 换成了别的版本，你项目里所有用 B 的地方就集体报错，而你的 `package.json` 上看不出任何线索。这个我踩过，排查了一下午才想明白是自己一直在偷用一个从没声明过的包。

**依赖结构不确定**。假设项目同时依赖 `foo` 和 `bar`，两者又依赖不同版本的 `lodash`。谁的版本被提升到根目录、谁被留在自己的 `node_modules` 里，取决于 `package.json` 里的声明顺序和解析先后。同样一份 `package.json`，两台机器装出来的 `node_modules` 结构可能不一样。

这正是 `lock` 文件诞生的原因。无论是 `package-lock.json` 还是 `yarn.lock`，都是为了把这个不确定的结构钉死，保证每次 `install` 之后产生一致的结果。

**非法访问依赖**。跟幽灵依赖是一体两面，但在 `monorepo` 里危害更大。假设包 A 依赖 X、包 B 依赖 X，还有一个包 C 不依赖 X 但代码里用了 X。由于依赖提升，X 被放在了根目录的 `node_modules`，C 在本地跑得好好的。可一旦 C 被单独发布出去，用户单独安装 C，运行到引用 X 的代码就直接崩了。**本地跑通不代表发出去能跑**，这类问题往往要到用户手上才暴露。

正是这些问题促使了 `pnpm` 的诞生。

## 三、pnpm 是什么

`pnpm`（`Performant NPM`）是一个快速的、节省磁盘空间的包管理工具，同时它对 `monorepo` 有原生的良好支持。

```bash
# 安装pnpm
npm i pnpm -g
```

现在更推荐的装法是用 `Node` 自带的 `Corepack`，在项目 `package.json` 里写一行 `"packageManager": "pnpm@9.x.x"`，然后 `corepack enable`，团队所有人用的版本就自动对齐了，不用挨个叮嘱「你的 pnpm 版本是多少」。原文那种全局 `npm i -g` 的装法当然也能用，只是版本容易在团队里跑偏。

它的用处和 `npm`、`yarn` 没有本质区别，命令都长得差不多，`pnpm install`、`pnpm add`、`pnpm run` 上手几乎零成本。差别全在底层怎么组织 `node_modules`。

## 四、pnpm 快在哪，省在哪

### 4.1 安装速度

按官方文档的 benchmark 数据，`pnpm` 在大多数场景下的安装速度都优于 `npm` 和 `yarn`，原文记录的量级是快 2 到 3 倍。这个数字受缓存状态、`lock` 文件是否存在、网络环境影响很大，你自己项目上跑出来的比例可能完全不同，建议实测再下结论。

快的原因主要是两条：并行的网络请求，以及本地那个全局 store 的复用。装过一次的包再装就是本地建链接，几乎不耗时。

对 `yarn` 熟悉的同学可能会说，`yarn` 不是有 `PnP` 安装模式吗，直接干掉 `node_modules`，把依赖内容写进 `.yarn/cache`，省掉大量文件 `I/O`，也能提速。这话没错，`PnP` 在纯安装速度上确实很猛。不是说 `PnP` 不行，而是它改变了 `Node` 的模块解析方式，很多工具链（尤其是那些自己实现了模块查找的老工具）需要专门适配，迁移成本不低。`pnpm` 走的是「保留 `node_modules`、但把结构做对」这条更保守的路，兼容性上省心得多。

### 4.2 节省磁盘空间

这才是 `pnpm` 最直观的杀手锏。它内部使用**基于内容寻址的存储**（`Content-addressable store`，简称 CAS）来存放依赖，所有包的文件按内容哈希存在一个全局 store 里，项目里的 `node_modules` 只是指向它的链接。

要理解这套机制，得先分清两种链接。

- **硬链接**（hard link）：多个文件名平等地指向磁盘上的同一份数据。删掉其中任何一个都不影响其他，只有当所有硬链接都被删除时，这份数据才真正被回收。
- **软链接 / 符号链接**（symbolic link）：一个独立的小文件，里面存的是一条指向另一个文件或目录的路径。它相当于 `Windows` 里的快捷方式，本身的存在不依赖目标文件，目标没了它就变成一个断掉的链接。

差别记住一点就够了：硬链接指向的是**数据本身**，软链接指向的是**路径**。

有了硬链接，`pnpm` 的省空间策略就好理解了。

**同一个包只在磁盘上存一份**。用 `npm` 或 `yarn` 时，如果 100 个项目都依赖 `lodash`，`lodash` 很可能就被完整写入磁盘 100 次。用 `pnpm` 则只写一次，后面 99 次都是硬链接过去，几乎不占额外空间。

**不同版本之间复用未变的文件**。因为 store 是按文件内容寻址的，假设 `lodash` 有 100 个文件，升级之后只新增了 1 个、改了 2 个，那磁盘上不会重新写 101 个文件，而是复用没变的那 97 个，只写入新增和改动的那几个。包体越大、版本迭代越频繁，这个收益越明显。

这里有个前提条件很多人不知道：**硬链接只能在同一个文件系统内建立**。如果你的全局 store 和项目目录不在同一个磁盘分区（比如项目放在外接移动硬盘上），`pnpm` 建不了硬链接，会退化成直接拷贝，省空间的效果就没了。用 `pnpm store path` 可以看到 store 的实际位置，遇到「怎么装完还是这么大」的时候先查这个。

### 4.3 安全性

`pnpm` 自创了一套虚拟存储目录的依赖管理方式，把幽灵依赖和非法访问这两个问题从结构上堵死了。

在 `pnpm` 装出来的项目里，`node_modules` 根目录**只会出现你在 `package.json` 里显式声明过的包**。没声明的，物理上就不在那个位置，`Node` 的解析规则找不到，代码里 `import` 直接报错。

这个设计刚上手会有点不适应，因为它会把你项目里潜藏的幽灵依赖全部暴露出来，从 `npm` 迁过来第一次跑经常一堆红。但这些错误本来就该报，只是之前被扁平化结构掩盖了而已。

### 4.4 对 monorepo 的支持

`pnpm` 的 `monorepo` 支持体现在几乎每个子命令上，都能配合 `-r`（递归）和 `--filter`（过滤）：

```bash
# 在根目录下执行，所有package都会被添加依赖
pnpm add A -r

# 使用filter指定package
pnpm add lodash --filter package-a
```

这块第五、六节会展开讲。

## 五、pnpm 的 node_modules 结构拆解

### 5.1 先看 npm/yarn 是怎么装的

执行 `npm install` 或 `yarn install` 之后，工具会先构建依赖树，然后对树上的每个节点做四件事：

1. 把依赖包的版本区间解析成一个具体的版本号
2. 下载对应版本的 tar 包到本地离线镜像
3. 把依赖从离线镜像解压到本地缓存
4. 把依赖从缓存**拷贝**到当前目录的 `node_modules`

注意最后一步是拷贝。这就是为什么 100 个项目会在磁盘上留下 100 份 `lodash`。`pnpm` 改的就是这一步，它不拷贝，改成建链接。

### 5.2 装一个 express 看看长什么样

用 `pnpm` 安装 `express` 之后，`node_modules` 是这样的：

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

第一眼就能看出区别：项目只依赖了 `express`，那么 `node_modules` 根目录下就**只有 `express` 这一个入口**，`express` 自己那一堆依赖全被收进了 `.pnpm` 这个虚拟存储目录里，不会污染根目录。幽灵依赖就是这么被堵掉的。

展开 `.pnpm` 能找到包的真正位置，`express` 实际躺在 `.pnpm/express@4.17.1/node_modules/express`。这个 `<package-name>@version/node_modules/<package-name>` 的目录规律，是 `pnpm` 整套结构的基础。

### 5.3 软链接和硬链接是怎么配合的

这套结构里两种链接各司其职，分三层：

1. 全局 store 里的文件通过**硬链接**落到 `node_modules/.pnpm` 下对应的包目录里
2. 项目的直接依赖，在 `node_modules` 根目录下通过**软链接**指向 `.pnpm` 里的实际位置
3. 包与包之间的依赖关系，也是在各自的 `node_modules` 里用**软链接**互相指

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

为什么非要套这么一层 `<package>@<version>/node_modules/<package>` 呢？因为这样一来，包本身和它的依赖就处在同一个 `node_modules` 层级下，`Node` 原生的逐层向上查找规则不用做任何改动就能正常工作。既拿到了严格隔离，又保持了和 `Node` 的完全兼容，这个设计是真的舒服。

顺便一提，也正因为大量使用了软链接，某些对符号链接不友好的工具（早期的 `React Native` 打包器、部分 `Electron` 构建工具、一些 `Windows` 下的老脚本）在 `pnpm` 项目里会出问题。这类情况可以在 `.npmrc` 里配 `node-linker=hoisted` 退回扁平结构，代价是丢掉严格隔离。

## 六、pnpm 工作空间 Workspace 完全指南

### 6.1 什么是 Monorepo

Monorepo（单体仓库）是把多个项目放在同一个代码仓库里管理的策略。相比多仓库方案，它的好处是代码共享方便、版本管理统一、跨包重构一次搞定。

`pnpm` 从设计上就原生支持 Monorepo，不需要额外装 `lerna` 之类的工具，`workspace` 是内置能力。

### 6.2 创建 Workspace 项目

在项目根目录建一个 `pnpm-workspace.yaml`，声明哪些目录下的子目录算作 package：

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

这个文件是 `pnpm` 识别 workspace 的唯一开关，没有它，`-r` 和 `--filter` 都不会生效。然后按声明的路径建目录：

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

每个子目录下必须有自己的 `package.json` 且 `name` 字段唯一，否则 `--filter` 没法定位。根目录的 `package.json` 建议加上 `"private": true`，防止手滑把整个仓库发到 npm 上去。

### 6.3 常用命令

**安装所有依赖**：

```bash
# 安装workspace下所有packages的依赖
pnpm install

# 或使用-r递归安装
pnpm install -r
```

在 workspace 根目录跑 `pnpm install`，会一次性把所有子包的依赖都装好，不用挨个进目录。

**给 package 装依赖**：

```bash
# 在根目录执行，所有package都会被添加lodash依赖
pnpm add lodash -r

# 指定添加到某个package
pnpm add lodash --filter pkg1
```

`-r` 是「所有包都装」，`--filter` 是「只给指定的包装」。日常用得最多的是后者，前者慎用，很容易给一堆用不上的包塞进无关依赖。

**用 filter 做更细的过滤**：

```bash
# 只在pkg1中安装
pnpm add lodash --filter pkg1

# 只在以@apps开头的package中安装
pnpm add lodash --filter '@apps/*'
```

`--filter` 还支持一些很实用的高级写法，比如 `--filter pkg1...` 表示 `pkg1` 以及所有依赖它的包，`--filter ...pkg1` 表示 `pkg1` 以及它依赖的所有包，`--filter '...[origin/main]'` 表示只处理相对某个 git 分支有改动的包。CI 里做增量构建全靠这几个。

**在特定 package 中执行命令**：

```bash
# 在pkg1中执行构建命令
pnpm --filter pkg1 run build

# 简写形式
pnpm -F pkg1 run build
```

### 6.4 Workspace 内部依赖

workspace 里的包可以互相引用，这是 monorepo 的核心价值：

```bash
# 将pkg2添加到pkg1的依赖中
pnpm add pkg2 --filter pkg1
```

执行完 `packages/pkg1/package.json` 里会自动多出一行：

```json
{
  "dependencies": {
    "pkg2": "workspace:*"
  }
}
```

`workspace:*` 这个协议是关键。它告诉 `pnpm`「这个依赖去本地 workspace 里找，别去 registry 下载」，`pnpm` 会在 `node_modules` 里建一条软链接直接指向 `packages/pkg2`，改了 `pkg2` 的源码，`pkg1` 立刻就能看到，不用发版也不用 `npm link`。

发布的时候 `pnpm publish` 会自动把 `workspace:*` 替换成当时的真实版本号，所以发出去的包对外部用户是正常的，不用手动处理。

### 6.5 发布配置

在根目录的 `package.json` 里配好发布相关设置：

```json
{
  "name": "my-monorepo",
  "private": true,
  "publishConfig": {
    "access": "public"
  }
}
```

`private: true` 保证根仓库本身不会被发布，`publishConfig.access` 对带 scope 的包（比如 `@myorg/utils`）是必需的，不写默认是私有包，发布会因为没有付费账号而失败。

## 七、日常命令速查

`pnpm` 的迁移成本低，很大程度上就因为命令跟 `npm` 高度一致。

**安装依赖**：

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

**更新与卸载**：

```bash
# 更新依赖到最新版本
pnpm update

# 卸载依赖
pnpm uninstall lodash
```

**运行脚本**：

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

这里有个细节比 `npm` 舒服：`pnpm dev` 可以直接省掉 `run`，而且不像 `npm` 那样需要 `--` 来传参，`pnpm dev --port 3001` 会直接把参数透传过去。

**其他常用命令**：

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

`pnpm store prune` 值得单独说一句，它会清掉全局 store 里已经没有任何项目引用的那些包。用久了 store 会慢慢变大，半年跑一次这个能回收不少空间，而且完全安全，还在用的包不会被删。

顺着构建这条线说，依赖装得快只是开发体验的一半，另一半在打包环节，这块我另外写过一篇 [Webpack 5 构建优化](https://feinterview.poetries.top/blog/webpack-5-build-optimization)，两边配合下来提升会更明显。

## 八、三者功能对比一览

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

这张表照抄自 `pnpm` 官方文档的对比页，里面有几行值得单独解读。

`pnpm` 和 `npm`、`yarn` 最大的区别在 `node_modules` 的结构上。后两者默认走扁平化，天生带幽灵依赖；`pnpm` 走虚拟存储目录，依赖严格隔离。这一条决定了其他所有差异。

内容可寻址存储带来的是两个直接收益：同一个包在多个项目里只落盘一次，不同版本之间还能复用没变的文件。

表里那几个 `pnpm` 独有的功能，实际用起来最有价值的是 `pnpm patch`。它让你能给某个三方依赖打补丁并把补丁提交进仓库，团队所有人 `install` 之后自动生效。以前遇到依赖有 bug 又等不及上游修，只能 fork 一份自己发包，现在几行命令就解决了。`pnpm env` 用来管理 `Node` 版本，能替掉一部分 `nvm` 的场景。`Catalogs` 是在 workspace 里统一声明版本号的功能，monorepo 里几十个包依赖同一个 `react` 版本时特别省事，注意它是较新版本才加上的。

## 九、什么情况下别急着换 pnpm

聊完优点，把我遇到过的几个坑也摆出来，免得你换过去之后骂街。

**依赖了幽灵依赖的老项目**。这是最常见的翻车点。老项目从 `npm` 迁到 `pnpm`，第一次 `install` 完启动，一堆 `Cannot find module` 报错。这些包其实一直在被偷用，只是之前扁平结构给兜住了。正确做法是老老实实按报错把缺的依赖补进 `package.json`，虽然烦，但补完项目的依赖声明才是真实的。实在赶时间，可以在 `.npmrc` 里临时加 `shamefully-hoist=true` 恢复成扁平结构，不过这等于放弃了 `pnpm` 最大的价值，只能当过渡手段。

**对软链接不友好的工具链**。前面提过一句，这里再强调下。`React Native`、部分 `Electron` 打包工具、某些自己实现模块解析的老构建脚本，碰到 `pnpm` 的软链接结构会解析失败。这类项目要么配 `node-linker=hoisted`，要么就先别迁。

**store 和项目不在同一分区**。硬链接跨不了文件系统，这时候 `pnpm` 会退化成拷贝，省空间的效果直接归零。

**依赖 postinstall 脚本的场景**。较新的 `pnpm` 版本出于供应链安全考虑，默认不再自动执行依赖包的构建脚本，需要在 `package.json` 里用 `onlyBuiltDependencies` 显式放行。第一次遇到会一头雾水，因为它不报错，只是某个包该生成的二进制没生成。这块的默认行为不同大版本之间调整过，升级时留意一下 changelog。

## 总结

`pnpm` 值得换，但理由不该只是「快」和「省空间」。

省空间是硬链接和内容寻址存储的自然结果，你项目越多、依赖越重，这个收益越明显；快是并行请求加本地 store 复用带来的，具体倍数看你自己的环境，别拿官方 benchmark 当承诺。

真正长期有价值的是第三条：**严格的依赖隔离**。`node_modules` 根目录里只有你声明过的包，这一条从结构上消灭了幽灵依赖和非法访问，让「本地跑通」和「发出去能跑」重新划上等号。代价是迁移时会暴露一堆历史欠账，但那些欠账本来就存在，早暴露比晚暴露强。

如果你在做 monorepo，那基本不用犹豫，`pnpm` 的 `workspace` 加 `--filter` 那套过滤语法是目前体验最顺的方案之一。如果你手上是个跑了多年、依赖关系一团麻的老项目，先在一个小项目上试，把 `.npmrc` 那几个逃生开关搞清楚了再往主力项目上推。

## 参考

- pnpm 官方文档：动机 <https://pnpm.io/zh/motivation>
- pnpm 官方文档：性能基准测试 <https://pnpm.io/zh/benchmarks>
- pnpm 官方文档：Workspace <https://pnpm.io/zh/workspaces>
- pnpm 官方文档：功能对比 <https://pnpm.io/zh/feature-comparison>
- Yarn PnP 特性 <https://classic.yarnpkg.com/en/docs/pnp/>
- [前端进阶之旅](https://interview.poetries.top)
