---
title: Next.js 16 升级指南 从Turbopack默认启用到异步API全面化
description: Next.js 16 的核心变化逐条拆解，Turbopack 成为默认构建器、异步 Request API 强制化、React Compiler 稳定、middleware 改名 proxy、next/image 默认值调整，附改法与踩坑点。
date: 2025-11-03 20:40:12
tags:
- Next.js
- React
- 前端开发
- Turbopack
- React Compiler
- 升级指南
categories: Front-End
---

把一个跑在 Next.js 15 上的 App Router 项目直接装上 `next@16`，`next dev` 大概率还能起来，`next build` 却会直接失败。问题不在业务代码，在 `next.config` 里那几行自定义 webpack 配置。Next.js 16 把 Turbopack 提成了默认构建器，顺手把 15 时代留下的一堆兼容口子全关了，异步 API 的同步降级、`middleware` 的文件名、`experimental_ppr` 的路由级开关，这次一并收走。

这篇按官方升级文档把 16 的改动过了一遍，排序标准只有一个，就是「会不会让你的构建直接红掉」。每条都写清楚改法、为什么这么改、以及什么情况下可以先不动。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 升级前必须先满足的环境基线，以及 codemod 能帮你干掉多少活
- Turbopack 默认启用之后，自定义 webpack 配置的三条出路
- 异步 Request API 彻底移除同步兼容，`params` / `searchParams` / `id` 全都变 Promise
- React 19.2 与 React Compiler 稳定版怎么开，代价是什么
- 缓存 API 新增的 `updateTag` 和 `refresh`，和老的 `revalidateTag` 怎么分工
- `middleware` 改名 `proxy` 带来的运行时限制
- `next/image` 一口气改掉的七个默认值
- 其余会让构建失败的零碎改动，以及被移除的功能

## 一、升级前先把环境和退路准备好

Next.js 16 抬高了运行环境的门槛，这一步没过，后面全都白搭。

| 要求 | 变化详情 |
|------|----------|
| Node.js | 最低 20.9.0，且必须是 LTS，Node.js 18 不再支持 |
| TypeScript | 最低 5.1.0 |
| 浏览器 | Chrome 111+、Edge 111+、Firefox 111+、Safari 16.4+ |

Node 18 被砍掉这条最容易在 CI 上翻车。本地 nvm 里装的是 20，Dockerfile 里的基础镜像还写着 `node:18-alpine`，本地构建绿了推上去照样挂。升级第一件事是把 CI 镜像、Dockerfile、`package.json` 里的 `engines` 字段一起改掉，别只改本地。

浏览器基线抬到 Chrome 111 意味着产物里会直接使用更新的语法特性，如果你的用户群里还有大量老设备，这一条要单独评估，它不像 Node 版本那样有明显报错，只会在特定机型上白屏。

### 官方 codemod 能帮你做的事

Next.js 提供的升级 codemod 覆盖面比很多人以为的要广：

```bash
# pnpm
pnpm dlx @next/codemod@canary upgrade latest

# npm
npx @next/codemod@canary upgrade latest

# yarn
yarn dlx @next/codemod@canary upgrade latest

# bun
bunx @next/codemod@canary upgrade latest
```

它会自动处理这几件事：

- 把 `next.config.js` 里的 turbopack 配置改成新写法
- 从 `next lint` 迁移到 ESLint CLI
- 把废弃的 `middleware` 约定迁移到 `proxy`
- 去掉已稳定 API 上的 `unstable_` 前缀
- 移除 layout 和 page 里的 `experimental_ppr` 配置

跑完 codemod 一定要看 diff。我的经验是它对标准写法处理得很干净，但对那种被包了一层工具函数的动态 API 调用会漏掉，最后还是得自己搜一遍。

### AI 辅助升级

如果你在用支持 MCP 的 AI 编码工具，官方还提供了 Next.js DevTools MCP：

```json filename=".mcp.json"
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

配好之后直接让助手帮你升级即可。这块我只在小项目上试过，几千个文件的老仓库有没有坑我没验证。

### 手动升级

不想跑 codemod 就手动装：

```bash
# pnpm
pnpm add next@latest react@latest react-dom@latest

# npm
npm install next@latest react@latest react-dom@latest

# yarn
yarn add next@latest react@latest react-dom@latest
```

> **注意**：用 TypeScript 的项目记得同步升 `@types/react` 和 `@types/react-dom`，否则异步 `params` 的类型会一路飘红。

## 二、Turbopack 默认启用后的三条出路

Turbopack 在 16 里正式稳定，`next dev` 和 `next build` 默认都走它。以前那个 `--turbopack` / `--turbo` 标志可以从脚本里删掉了：

```json filename="package.json"
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

### 自定义 webpack 配置会让构建失败

这是升级路上第一个真正的拦路虎。项目里只要还有 `webpack(config) { ... }` 这样的自定义配置，`next build` 就会直接失败，而不是默默忽略。官方这么设计是有道理的，静默忽略一份配置比报错危险得多，你的 alias、loader、externals 悄无声息地失效，问题会在运行时以最难排查的形态冒出来。

三条出路：

1. **继续用 Turbopack 但忽略旧配置**，跑 `next build --turbopack`
2. **把 webpack 配置翻译成 Turbopack 的对应选项**，一劳永逸
3. **退回 webpack**，构建脚本加 `--webpack` 标志

```json filename="package.json"
{
  "scripts": {
    "dev": "next dev",
    "build": "next build --webpack",
    "start": "next start"
  }
}
```

我自己维护的一个站升到 16 之后走的就是第三条，构建脚本里保留了 `--webpack`。不是说 Turbopack 不行，而是那份 webpack 配置里挂了几个自定义 loader，翻译成本高于收益，先把版本升上去，构建器的迁移单独排期。这种「分两步走」的思路在大项目上比一次性梭哈稳得多。

### 配置从 experimental 提到了顶层

`experimental.turbopack` 移出实验区，现在是顶层字段：

```ts filename="next.config.ts"
import type { NextConfig } from 'next'

// Next.js 15 写法
const nextConfig: NextConfig = {
  experimental: {
    turbopack: {},
  },
}

// Next.js 16 写法
const nextConfig: NextConfig = {
  turbopack: {},
}
```

### 文件系统缓存还在 Beta

Turbopack 现在支持开发模式的文件系统缓存，把编译产物存到磁盘，重启 dev server 之后不用从头编一遍：

```ts filename="next.config.ts"
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
}
```

它还挂在 `experimental` 下面，说明官方自己也没打包票。冷启动慢是 Turbopack 目前最被吐槽的点，这个开关就是冲着它去的，值得开来试试，但别在 CI 上依赖它。

### Sass 的波浪号前缀不能用了

Turbopack 完整支持从 `node_modules` 导入 Sass，但 webpack 时代那个 `~` 前缀语法不认了：

```scss
// Webpack 写法，Turbopack 下报错
@import '~bootstrap/dist/css/bootstrap.min.css';

// 现在的写法
@import 'bootstrap/dist/css/bootstrap.min.css';
```

这个坑很隐蔽，因为报错信息指向的是找不到文件，第一直觉会去怀疑依赖没装。老项目里的样式文件往往是几年前写的，`~` 散落在十几个 `.scss` 里，全局搜一遍 `@import '~` 是最快的办法。

## 三、异步 Request API 这次真的没有退路了

Next.js 15 把 `cookies`、`headers`、`draftMode` 改成异步的时候，留了一个同步访问的过渡期，开发模式下打印警告但不报错。16 把这个口子彻底关掉了。

需要异步访问的完整清单：

- `cookies`
- `headers`
- `draftMode`
- `layout.js`、`page.js`、`route.js` 里的 `params`
- `page.js` 里的 `searchParams`

```tsx
// Next.js 15，过渡期还能这么写
const cookieStore = cookies()

// Next.js 16，必须 await
const cookieStore = await cookies()
```

为什么非要异步？因为这些值只有在真实请求到来时才能确定，同步读取会强制整棵树在这一点上等住。改成 Promise 之后，React 的并发渲染才能在等待请求信息的同时继续渲染别的分支。关于这套异步化改造的来龙去脉，我在 [Next.js 15 新特性完全指南](https://feinterview.poetries.top/blog/nextjs-15-performance-react-apps) 里写得更细。

回到升级本身，这块强烈建议交给 codemod，手改几百处 `await` 太容易漏。

### 用 typegen 生成类型助手

异步 `params` 最烦的不是加 `await`，是类型。手写 `Promise<{ slug: string }>` 既啰嗦又容易和路由实际结构对不上。16 里跑一次 `npx next typegen`，就能拿到全局可用的类型助手：

- `PageProps`，页面组件属性
- `LayoutProps`，布局组件属性
- `RouteContext`，路由上下文

```tsx filename="app/blog/[slug]/page.tsx"
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
  const query = await props.searchParams
  return <h1>Blog Post: {slug}</h1>
}
```

这个设计是真的舒服。路由路径字符串直接当泛型参数，`slug` 的类型是从文件结构推出来的，改了目录名类型立刻报错，比手写接口靠谱得多。

### 图片元数据和 sitemap 里的参数也变了

容易被漏掉的是这两处。传给 `opengraph-image`、`twitter-image`、`icon`、`apple-icon` 的 props 现在都是 Promise：

```js filename="app/shop/[slug]/opengraph-image.js"
export async function generateImageMetadata({ params }) {
  const { slug } = params
  return [{ id: '1' }, { id: '2' }]
}

// Next.js 16，params 和 id 都要 await
export default async function Image({ params, id }) {
  const { slug } = await params
  const imageId = await id
  // ...
}
```

`sitemap` 的 `id` 同理：

```js filename="app/product/sitemap.js"
export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }]
}

// Next.js 16，id 要 await
export default async function sitemap({ id }) {
  const resolvedId = await id
  const start = Number(resolvedId) * 50000
  // ...
}
```

这两个文件平时没人动，构建时才会执行，问题往往在部署前最后一次 `next build` 才暴露出来。升级时主动去 `app` 目录搜一遍 `opengraph-image` 和 `sitemap`，比等构建报错省事。

## 四、React 19.2 与 React Compiler 稳定版

Next.js 16 跟的是最新的 React Canary，带上了 19.2 的这几个能力：

- **View Transitions**，在 transition 或导航中更新元素时加过渡动画
- **useEffectEvent**，把非响应式逻辑从 Effect 里抽成可复用的 Effect Event
- **Activity**，用 `display: none` 隐藏 UI，同时保住状态并清理 Effect，用来渲染「后台活动」

`Activity` 这个我一直觉得是被低估的一个。以前做 Tab 切换要么销毁重建丢状态，要么手动缓存一堆东西，现在有官方语义了。

### React Compiler 转正

`reactCompiler` 配置项从 experimental 升为稳定：

```ts filename="next.config.ts"
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
}
```

还要装插件：

```bash
npm install -D babel-plugin-react-compiler
```

编译器会自动做 memo，理论上手写的 `useMemo` / `useCallback` / `memo()` 大部分可以删了。

代价写在官方文档里，很明确。

> **注意**：开启后开发和构建的编译时间都会变长，因为 React Compiler 依赖 Babel。

这里有个坑要注意。你刚把构建器换成号称快很多的 Turbopack，转头开了 React Compiler 又把 Babel 拉回链路里，两边收益容易互相抵消。建议先各自开一段时间量一量构建耗时，别一次性全打开然后发现比升级前还慢。至于哪些手写 memo 该删，可以对照 [React 19 新特性](https://feinterview.poetries.top/blog/react-19-new-features) 那篇一起看。

## 五、缓存 API 多了两个入口

### revalidateTag 支持第二个参数

`revalidateTag` 新增签名，可以把 `cacheLife` 配置名当第二个参数传进去：

```ts filename="app/actions.ts"
'use server'

import { revalidateTag } from 'next/cache'

export async function updateArticle(articleId: string) {
  // 标记这篇文章的数据为过时
  revalidateTag(`article-${articleId}`, 'max')
}
```

### updateTag 解决「改完看不到」

`updateTag` 是新增的 Server Actions 专用 API，语义是「读到自己刚写的」。用户提交修改后 UI 立刻显示新值，而不是先闪一下旧数据：

```ts filename="app/actions.ts"
'use server'

import { updateTag } from 'next/cache'

export async function updateUserProfile(userId: string, profile: Profile) {
  await db.users.update(userId, profile)

  // 立即过期并刷新缓存，用户马上看到改动
  updateTag(`user-${userId}`)
}
```

这个和 `revalidateTag` 的区别值得说清楚。`revalidateTag` 是「标记为过时」，下次访问才重新取；`updateTag` 是当前这次响应就带上新数据。表单、用户设置这类「改完立刻要看到结果」的场景，用后者体验差别很明显。

### refresh 刷新客户端路由

```ts filename="app/actions.ts"
'use server'

import { refresh } from 'next/cache'

export async function markNotificationAsRead(notificationId: string) {
  await db.notifications.markAsRead(notificationId)
  refresh()
}
```

### cacheLife 和 cacheTag 去掉了前缀

```ts
// 之前
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from 'next/cache'

// 现在
import { cacheLife, cacheTag } from 'next/cache'
```

codemod 会自动处理这一批重命名，手改的话记得全局搜 `unstable_`。

## 六、路由和导航的改动不用你动手

16 对路由和导航做了一轮重写，两个改进直接生效：

- **布局去重**，预取多个共享同一布局的 URL 时，布局只下载一次
- **增量预取**，只预取缓存里没有的那部分，不再整页拉

这两条不需要改代码。收益大小取决于你的路由结构，共享布局层级越深、预取的链接越多，省下来的越明显。侧边栏挂几十个 `Link` 的后台系统会比只有三个页面的落地页受益大得多。

## 七、middleware 改名 proxy

`middleware` 这个文件名废弃了，改叫 `proxy`，官方的说法是让它的职责更贴近网络边界和路由，而不是一个什么都能塞的万能中间层。

```bash
# 重命名文件
mv middleware.ts proxy.ts
# 或
mv middleware.js proxy.js
```

命名导出也要跟着改：

```ts filename="proxy.ts"
export function proxy(request: Request) {}
```

带 `middleware` 字样的配置标志同样重命名，比如 `skipMiddlewareUrlNormalize` 现在叫 `skipProxyUrlNormalize`。

有一个限制必须提前知道。`proxy` 的运行时固定是 `nodejs`，不支持 `edge`，而且这个运行时不可配置。所以如果你的中间层逻辑依赖 Edge Runtime 的低延迟特性，或者部署形态就是跑在边缘节点上的，那就继续用 `middleware`，别急着改名。这一条是我觉得 16 里最需要按项目情况分别决策的地方，不是无脑跟着 codemod 走就行。

## 八、next/image 一口气改了七个默认值

`next/image` 这次的改动几乎全是默认值收紧，逻辑一致，都是往「更安全、更省资源」的方向调。

**带查询字符串的本地图片需要显式配置。** 为了防枚举攻击，现在要在 `images.localPatterns` 里声明允许的 `search`：

```ts filename="next.config.ts"
const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/assets/**',
        search: '?v=1',
      },
    ],
  },
}
```

**`minimumCacheTTL` 默认值从 60 秒变成 4 小时（14400 秒）。** 针对的是那些没带 `cache-control` 头的图片，以前每分钟就要重新验证一次，成本白花。需要旧行为就手动设回 60。

**`imageSizes` 默认数组里去掉了 16。** 真正提供 16 像素宽图片的项目极少，去掉它能让 `next/image` 生成的 `srcset` 属性短一截，省的是每个页面每张图的 HTML 体积。

**`qualities` 默认值从「全部允许」收紧到只允许 `[75]`。** 这一条要小心，如果你在某些图片上手写了 `quality={90}`，升级后会失效，得把 90 加进配置。

**默认阻止本地 IP 的图片优化。** 私有网络里确实需要的话，把 `images.dangerouslyAllowLocalIP` 设为 `true`，名字里的 `dangerously` 已经说明态度了。

**`maximumRedirects` 从无限制变成最多 3 次。** 图片 URL 后面挂着一串跳转的场景要检查一下。

**两个废弃。** `next/legacy/image` 组件废弃，改用 `next/image`；`images.domains` 配置废弃，改用 `images.remotePatterns`，后者支持协议、端口、路径的精确匹配，安全性高一档。

## 九、其余会让构建直接失败的改动

这一节里的每一条都可能在 `next build` 时给你一个红色的停止符，升级前扫一遍能省不少时间。

### 并行路由必须有 default.js

所有并行路由槽位现在都要求显式的 `default.js`，缺一个构建就失败：

```tsx filename="app/@modal/default.tsx"
import { notFound } from 'next/navigation'

export default function Default() {
  notFound()
}
```

不想走 404 就返回 null：

```tsx filename="app/@modal/default.tsx"
export default function Default() {
  return null
}
```

以前没写 `default.js` 时的行为是隐式兜底，现在强制你自己决定「这个槽位在不匹配时到底该显示什么」。用拦截路由做模态框的项目一定会中招。

### PPR 换成了 cacheComponents

实验性的 PPR 标志和路由级 `experimental_ppr` 都被移除，改用顶层配置：

```js filename="next.config.js"
const nextConfig = {
  cacheComponents: true,
}
```

> **注意**：Next.js 16 的 PPR 和 15 canary 里的 PPR 工作方式不同。如果现在正在用 PPR，官方建议先留在当前的 15 canary 版本上。

这条我想强调一下，它和其他改动不一样。别的改动都是「改法明确，改完就好」，这条是官方明说了行为有差异并建议暂缓。生产环境依赖 PPR 的项目，升级窗口要单独评估。

### ESLint 与 next lint

`@next/eslint-plugin-next` 默认使用 ESLint Flat Config 格式，向 ESLint v10 对齐。同时 `next lint` 命令被移除，`next build` 也不再顺手跑 lint，改用 Biome 或直接调 ESLint CLI：

```bash
npx @next/codemod@canary next-lint-to-eslint-cli .
```

构建不再跑 lint 这点有利有弊。构建确实快了，但如果你的 CI 只有一个 `next build` 步骤，那从此刻开始 lint 就形同虚设了，记得单独加一步。Flat Config 的完整配置我在 [ESLint 9 与 Next.js 16 配置指南](https://feinterview.poetries.top/blog/eslint9-nextjs16-setup-guide) 里写过一版可以直接抄。

### 滚动行为不再被覆盖

以前只要你在 html 元素上全局设了 `scroll-behavior: smooth`，Next.js 会在 SPA 路由切换期间把它盖掉。16 默认不再覆盖。想要回到旧行为，加一个属性：

```tsx filename="app/layout.tsx"
export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  )
}
```

这条不会报错，只会让路由切换时的滚动手感变了，属于那种「用户反馈说怪怪的但说不出哪里怪」的改动。

### dev 和 build 可以并发跑了

`next dev` 和 `next build` 现在输出到不同目录，`next dev` 走 `.next/dev`，两条命令可以同时执行。开发时一边跑 dev server 一边验证生产构建，不用再互相等着，这个改进日常体感很强。

### 三处移除

- **AMP 支持全部移除。** 采用率一路下滑，维护成本却实打实，所有 AMP API 和配置都没了。
- **`serverRuntimeConfig` 和 `publicRuntimeConfig` 移除。** 服务端的值直接在 Server Component 里读环境变量，客户端要用的加 `NEXT_PUBLIC_` 前缀。
- **`devIndicators` 里的 `appIsrStatus`、`buildActivity`、`buildActivityPosition` 移除。** 指标本身还在，只是不给你配了。

## 总结

Next.js 16 的升级工作量集中在三个地方，按耗时从多到少排：

- **构建器**。自定义 webpack 配置会让 `next build` 直接失败，先决定是翻译成 Turbopack 选项还是加 `--webpack` 拖一拖，Sass 的 `~` 前缀顺手全局搜掉
- **异步 API**。同步兼容彻底移除，`cookies` / `headers` / `params` / `searchParams` 一个不落，`opengraph-image` 和 `sitemap` 里的 `id` 最容易漏，交给 codemod 再人工复查
- **一堆默认值和文件约定**。并行路由缺 `default.js` 会构建失败，`middleware` 要改名 `proxy` 且只能跑 nodejs 运行时，`next/image` 的 `qualities` 收到 `[75]`

React Compiler 和 `cacheComponents` 这两个可以放到第二阶段。前者会拉长编译时间，和 Turbopack 的收益打架；后者官方自己都说了和 15 canary 的行为不同。

我的建议是把升级拆成两个 PR，第一个只做「让它能跑起来」的必改项，第二个再谈性能开关。另外别忘了安全更新，15.x 和 16.0.x 有一批版本受 RSC 反序列化漏洞影响，详见 [Next.js CVE-2025-66478 升级提醒](https://feinterview.poetries.top/blog/nextjs-CVE-2025-66478)，升级 16 的时候顺手把小版本也钉到修复版以上。

## 参考

- [Next.js 16 官方升级指南](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js 16 发布博客](https://nextjs.org/blog/next-16)
- [React 19.2 发布说明](https://react.dev/blog/2025/10/01/react-19-2)
- [Turbopack 配置文档](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack)
- [前端进阶之旅](https://interview.poetries.top)
