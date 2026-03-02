---
title: Next.js 16带来哪些变革？深度解析新版本核心特性与升级指南
date: 2025-11-03 20:40:12
description: 全面解析Next.js 16新特性：Turbopack默认启用、异步API全面化、React Compiler稳定版、缓存策略更新、middleware更名proxy等重大变化，附详细升级指南。
tags:
- Next.js
- React
- 前端开发
- Turbopack
- React Compiler
- 升级指南
categories: Front-End
---

作为React生态中最强大的全栈框架，Next.js的每一次更新都牵动着无数开发者的心。Next.js 16带来了自App Router推出以来最重大的一次版本迭代：Turbopack正式取代Webpack成为默认构建工具，整个路由和导航系统得到全面优化，React Compiler也终于稳定可用。

本文将基于官方文档，系统性地解析Next.js 16的所有重要变化。无论你是正在考虑升级的老用户，还是准备深入学习Next.js的新人，这篇文章都将帮助你全面理解新版本的特性和升级策略。

## 升级准备工作

### 环境要求变化

Next.js 16对运行环境提出了更高的要求：

| 要求 | 变化详情 |
|------|----------|
| Node.js | 最低版本20.9.0（必须为LTS），Node.js 18不再支持 |
| TypeScript | 最低版本5.1.0 |
| 浏览器 | Chrome 111+、Edge 111+、Firefox 111+、Safari 16.4+ |

### 一键升级

Next.js官方提供了强大的Codemod工具，可以自动完成大部分迁移工作：

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

Codemod能够自动完成以下工作：

- 更新next.config.js使用新的turbopack配置
- 从next lint迁移到ESLint CLI
- 将废弃的middleware convention迁移到proxy
- 移除stable APIs的unstable_前缀
- 移除pages和layouts中的experimental_ppr配置

### AI辅助升级

如果你使用支持MCP（Model Context Protocol）的AI编码助手，还可以使用Next.js DevTools MCP来自动化升级过程：

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

配置完成后，只需告诉AI助手"帮助我升级到Next.js 16"即可自动完成升级。

### 手动升级

如果 prefer 手动升级，需要安装最新版本：

```bash
# pnpm
pnpm add next@latest react@latest react-dom@latest

# npm
npm install next@latest react@latest react-dom@latest

# yarn
yarn add next@latest react@latest react-dom@latest
```

> **注意**：如果使用TypeScript，记得同时升级`@types/react`和`@types/react-dom`。

## Turbopack默认启用

### 重大变化

Next.js 16最重要的变化之一是Turbopack正式稳定，并在`next dev`和`next build`中默认使用。在此之前，你需要通过`--turbopack`或`--turbo`标志手动启用。

```json filename="package.json"
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

不再需要添加`--turbopack`标志。

### 解决Webpack配置冲突

如果你的项目有自定义Webpack配置，运行`next build`（现在默认使用Turbopack）将会失败，以防止配置错误带来的问题。

有以下几种解决方案：

1. **继续使用Turbopack**：运行`next build --turbopack`，忽略你的webpack配置
2. **完全迁移到Turbopack**：将webpack配置迁移为Turbopack兼容选项
3. **继续使用Webpack**：使用`--webpack`标志来退出Turbopack

```json filename="package.json"
{
  "scripts": {
    "dev": "next dev",
    "build": "next build --webpack",
    "start": "next start"
  }
}
```

### Turbopack配置位置变化

`experimental.turbopack`配置已经移出experimental，现在是顶层配置项：

```ts filename="next.config.ts"
import type { NextConfig } from 'next'

// Next.js 15 - experimental.turbopack
const nextConfig: NextConfig = {
  experimental: {
    turbopack: {},
  },
}

// Next.js 16 - 顶层turbopack
const nextConfig: NextConfig = {
  turbopack: {},
}
```

### Turbopack文件系统缓存（Beta）

Turbopack现在支持开发模式下的文件系统缓存，可以在重启之间存储编译产物，显著加快编译速度：

```ts filename="next.config.ts"
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
}
```

### Sass导入语法变化

Turbopack完全支持从node_modules导入Sass文件。但需要注意，Webpack允许的波浪号（~）前缀语法不再支持：

```scss
// Webpack写法（不再支持）
@import '~bootstrap/dist/css/bootstrap.min.css';

// Turbopack写法
@import 'bootstrap/dist/css/bootstrap.min.css';
```

## 异步Request APIs：完全异步化

### 重要变化

Next.js 15引入了异步Request APIs作为重大变化，并提供了临时的同步兼容性。从Next.js 16开始，同步访问已完全移除，这些API只能异步访问。

需要异步访问的API包括：

- `cookies`
- `headers`
- `draftMode`
- `layout.js`、`page.js`、`route.js`等文件中的`params`
- `page.js`中的`searchParams`

```tsx
// Next.js 15（过渡期兼容）
const cookieStore = cookies()

// Next.js 16（必须异步）
const cookieStore = await cookies()
```

建议使用codemod来自动迁移到异步API。

### 类型迁移助手

为了帮助迁移异步params和searchParams，可以运行`npx next typegen`自动生成全局可用的类型助手：

- `PageProps`：页面组件属性
- `LayoutProps`：布局组件属性
- `RouteContext`：路由上下文

```tsx filename="app/blog/[slug]/page.tsx"
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
  const query = await props.searchParams
  return <h1>Blog Post: {slug}</h1>
}
```

### icon和opengraph-image的异步参数

传递到`opengraph-image`、`twitter-image`、`icon`和`apple-icon`中的props现在都是Promise：

```js filename="app/shop/[slug]/opengraph-image.js"
export async function generateImageMetadata({ params }) {
  const { slug } = params
  return [{ id: '1' }, { id: '2' }]
}

// Next.js 16 - 异步params和id访问
export default async function Image({ params, id }) {
  const { slug } = await params
  const imageId = await id
  // ...
}
```

### sitemap的异步id参数

```js filename="app/product/sitemap.js"
export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }]
}

// Next.js 16 - 异步id访问
export default async function sitemap({ id }) {
  const resolvedId = await id
  const start = Number(resolvedId) * 50000
  // ...
}
```

## React 19.2与React Compiler

### React 19.2新特性

Next.js 16使用最新的React Canary版本，包含React 19.2的新特性：

- **View Transitions**：在Transition或导航中更新元素时添加动画
- **useEffectEvent**：将非响应式逻辑从Effect提取到可重用的Effect Event函数中
- **Activity**：通过`display: none`隐藏UI同时保持状态和清理Effect来渲染"后台活动"

### React Compiler稳定支持

React Compiler的内置支持在Next.js 16中正式稳定。React Compiler可以自动memoize组件，减少不必要的重渲染，无需手动修改代码。

`reactCompiler`配置项已从experimental升级为稳定版：

```ts filename="next.config.ts"
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
}
```

安装最新版本的React Compiler插件：

```bash
npm install -D babel-plugin-react-compiler
```

> **注意**：启用此选项后，开发和构建时的编译时间可能会更长，因为React Compiler依赖Babel。

## 缓存API更新

### revalidateTag新增签名

`revalidateTag`有新函数签名，可以传递`cacheLife`配置文件作为第二个参数：

```ts filename="app/actions.ts"
'use server'

import { revalidateTag } from 'next/cache'

export async function updateArticle(articleId: string) {
  // 标记文章数据为过时
  revalidateTag(`article-${articleId}`, 'max')
}
```

### updateTag：立即读取写入

`updateTag`是一个新的Server Actions专用API，提供"读取即写入"语义——用户做出更改后，UI立即显示更改，而不是显示过时数据。

```ts filename="app/actions.ts"
'use server'

import { updateTag } from 'next/cache'

export async function updateUserProfile(userId: string, profile: Profile) {
  await db.users.update(userId, profile)

  // 立即过期并刷新缓存 - 用户立即看到更改
  updateTag(`user-${userId}`)
}
```

这确保交互功能立即反映更改，非常适合表单、用户设置等场景。

### refresh：刷新客户端路由

`refresh`允许从Server Action内部刷新客户端路由：

```ts filename="app/actions.ts"
'use server'

import { refresh } from 'next/cache'

export async function markNotificationAsRead(notificationId: string) {
  await db.notifications.markAsRead(notificationId)
  refresh()
}
```

### cacheLife和cacheTag稳定

`cacheLife`和`cacheTag`现在稳定了，不再需要`unstable_`前缀：

```ts
// 之前
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from 'now/cache'

// 现在
import { cacheLife, cacheTag } from 'next/cache'
```

## 路由和导航优化

Next.js 16包含路由和导航系统的全面改革，使页面转换更精简、更快速：

- **布局去重**：当预取多个共享布局的URL时，布局只下载一次
- **增量预取**：Next.js只预取缓存中不存在的部分，而不是整个页面

这些变化不需要代码修改，旨在提高所有应用的性能。

## middleware更名proxy

### 重要变化

`middleware`文件名已废弃，重命名为`proxy`，以明确网络边界和路由焦点。

`edge`运行时在`proxy`中不支持。`proxy`运行时是`nodejs`，无法配置。如果想继续使用`edge`运行时，请继续使用`middleware`。

```bash
# 重命名middleware文件
mv middleware.ts proxy.ts
# 或
mv middleware.js proxy.js
```

命名导出`middleware`也已废弃，将函数重命名为`proxy`：

```ts filename="proxy.ts"
export function proxy(request: Request) {}
```

包含`middleware`名称的配置标志也已重命名，例如`skipMiddlewareUrlNormalize`现在是`skipProxyUrlNormalize`。

## next/image重要变化

### 带查询字符串的本地图片

带查询字符串的本地图片现在需要`images.localPatterns.search`配置来防止枚举攻击：

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

### minimumCacheTTL默认值变化

`images.minimumCacheTTL`的默认值从60秒变为4小时（14400秒）。这减少了没有cache-control头的图片的重新验证成本。

如果需要以前的行为，可以将`minimumCacheTTL`设置回60秒。

### imageSizes默认值变化

默认`images.imageSizes`数组中的值16已被移除。很少有项目会提供16像素宽的图片，移除这个设置可以减少next/image发送到浏览器的srcset属性大小。

### qualities默认值变化

`images.qualities`的默认值从允许所有质量变为只允许`[75]`。

### 本地IP限制

新的安全限制默认阻止本地IP优化。只能为私有网络设置`images.dangerouslyAllowLocalIP`为`true`。

### 最大重定向数

`images.maximumRedirects`的默认值从无限制变为最多3次重定向。

### next/legacy/image废弃

`next/legacy/image`组件已废弃，使用`next/image`代替。

### images.domains配置废弃

`images.domains`配置已废弃，使用`images.remotePatterns`代替以提高安全性。

## 并行路由default.js要求

所有并行路由槽位现在需要显式的`default.js`文件。没有它们构建将失败。

```tsx filename="app/@modal/default.tsx"
import { notFound } from 'next/navigation'

export default function Default() {
  notFound()
}
```

或返回null：

```tsx filename="app/@modal/default.tsx"
export default function Default() {
  return null
}
```

## 部分预渲染（PPR）变化

Next.js 16移除了实验性PPR标志和配置选项，包括路由级别的`experimental_ppr`。

从Next.js 16开始，可以通过`cacheComponents`配置来选择使用PPR：

```js filename="next.config.js"
const nextConfig = {
  cacheComponents: true,
}
```

> **注意**：Next.js 16的PPR与Next.js 15 canaries中的PPR工作方式不同。如果现在正在使用PPR，建议保持在当前使用的Next.js 15 canary版本。

## 其他重要变化

### ESLint Flat Config

`@next/eslint-plugin-next`现在默认使用ESLint Flat Config格式，与ESLint v10对齐。

### 滚动行为覆盖

在Previous版本的Next.js中，如果全局在HTML元素上设置了`scroll-behavior: smooth`，Next.js会在SPA路由转换期间覆盖这个设置。

在Next.js 16中，默认情况下Next.js不再覆盖你的滚动行为设置。如果希望Next.js执行覆盖（之前的默认行为），在HTML元素上添加`data-scroll-behavior="smooth"`属性：

```tsx filename="app/layout.tsx"
export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  )
}
```

### 并发dev和build

`next dev`和`next build`现在使用不同的输出目录，启用并发执行。`next dev`命令输出到`.next/dev`。

### AMP支持移除

AMP的采用已显著下降，维护这个功能增加了框架的复杂性。所有AMP API和配置都已移除。

### next lint命令移除

`next lint`命令已被移除，使用Biome或直接使用ESLint。`next build`不再运行linting。

```bash
npx @next/codemod@canary next-lint-to-eslint-cli .
```

### 运行时配置移除

`serverRuntimeConfig`和`publicRuntimeConfig`已被移除，使用环境变量代替。

之前通过运行时配置的值，现在应该：

- 服务器端值：直接在Server Components中访问环境变量
- 客户端可用值：使用`NEXT_PUBLIC_`前缀

### devIndicators选项移除

以下选项已从devIndicators中移除：

- `appIsrStatus`
- `buildActivity`
- `buildActivityPosition`

指标本身仍然可用。

## 总结

Next.js 16是一次里程碑式的版本更新，带来了以下核心变化：

- **Turbopack默认启用**：Webpack不再是默认构建工具
- **异步API完全化**：cookies、headers、params等必须异步访问
- **React Compiler稳定**：自动优化组件渲染性能
- **缓存API增强**：updateTag实现立即读取写入
- **middleware更名proxy**：明确网络边界概念
- **next/image配置调整**：安全性和性能优化
- **多项功能移除**：AMP、next lint、运行时配置等

虽然升级需要一定工作量，但这些变化都将大幅提升应用性能和开发体验。建议尽快规划升级计划，享受新版本带来的改进。

## 参考资料

- [Next.js 16 Official Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [next-16博客](https://nextjs.org/blog/next-16)
- [React 19.2 Announcement](https://react.dev/blog/2025/10/01/react-19-2)
- [Turbopack Documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack)
- [React Compiler](https://react.dev/reference/react/Compiler)
