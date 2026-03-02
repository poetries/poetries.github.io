---
title: Next.js 15新特性完全指南：升级须知与核心变化解析
date: 2025-05-11 14:40:12
description: 深入解析Next.js 15带来的重大更新，包括React 19支持、异步Request APIs、fetch默认不缓存等核心变化，提供详细的升级指南和代码示例。
tags:
- Next.js
- React
- 前端开发
- React 19
- 升级指南
categories: Front-End
---

作为React生态中最流行的全栈框架，Next.js每次版本更新都牵动着无数开发者的心。Next.js 15带来了自App Router推出以来最重要的变化——全面拥抱React 19，同时对多个核心API进行了异步化改造。这些变化不仅影响着代码的编写方式，更深刻改变了我们对服务端渲染的认知。

本文将基于官方文档，系统性地解析Next.js 15的所有重要变化。无论你是正在考虑升级的现有项目开发者，还是准备学习Next.js的新人，这篇文章都将帮助你全面理解新版本的特性和升级策略。

## 升级准备工作

### 环境要求

在升级到Next.js 15之前，需要确保你的开发环境满足以下要求：

- Node.js 18.17.0 或更高版本
- 如果使用TypeScript，需要安装最新的`@types/react`和`@types/react-dom`
- 建议使用pnpm 8+、npm 10+或yarn 1.22+

### 一键升级

Next.js官方提供了Codemod工具，可以自动完成大部分迁移工作。在项目根目录下运行以下命令：

```bash
# 使用pnpm
pnpm dlx @next/codemod@canary upgrade latest

# 使用npm
npx @next/codemod@canary upgrade latest

# 使用yarn
yarn dlx @next/codemod@canary upgrade latest

# 使用bun
bunx @next/codemod@canary upgrade latest
```

### 手动升级

如果你 prefer 手动升级，需要同时更新Next.js和React相关依赖：

```bash
# pnpm
pnpm add next@latest react@latest react-dom@latest eslint-config-next@latest

# npm
npm install next@latest react@latest react-dom@latest eslint-config-next@latest

# yarn
yarn add next@latest react@latest react-dom@latest eslint-config-next@latest
```

> **注意**：如果遇到peer dependencies警告，可能需要手动指定React版本或使用`--force`/`--legacy-peer-deps`参数。这在Next.js 15和React 19正式稳定后将不再需要。

## React 19全面支持

### 版本要求

Next.js 15要求React和ReactDom的最低版本为19。这意味着你可以直接使用React 19带来的所有新特性，包括：

- **useActionState**：取代原来的useFormState，提供更强大的表单状态管理能力
- **useFormStatus增强**：新增`data`、`method`、`action`等属性
- **Actions**：支持在服务端定义可调用函数

### useFormState迁移到useActionState

`useFormState`已被`useActionState`替代，虽然前者仍然可用，但已标记为废弃。`useActionState`提供了更丰富的API，包括直接读取`pending`状态的能力：

```tsx
import { useActionState } from 'react'

async function submitForm(prevState, formData) {
  // 表单提交逻辑
  const result = await fetch('/api/submit', {
    body: formData
  })
  return result.json()
}

export default function Form() {
  const [state, submitAction, isPending] = useActionState(submitForm, null)

  return (
    <form action={submitAction}>
      {/* 表单字段 */}
      <button type="submit" disabled={isPending}>
        {isPending ? '提交中...' : '提交'}
      </button>
    </form>
  )
}
```

### useFormStatus增强

在React 19中，`useFormStatus`增加了更多有用的属性：

```tsx
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? '提交中...' : '提交'}
    </button>
  )
}
```

> **提示**：如果你还未升级到React 19，`useFormStatus`仍然只提供`pending`属性。

## 异步Request APIs：重大架构变化

这是Next.js 15最重要的变化之一。原本同步的动态API（如cookies、headers、draftMode）现在需要异步调用。这些API依赖运行时信息，异步化后能更好地支持React 19的并发渲染能力。

### cookies异步化

```tsx
import { cookies } from 'next/headers'

// Next.js 14（同步）
const cookieStore = cookies()
const token = cookieStore.get('token')

// Next.js 15（异步）
const cookieStore = await cookies()
const token = cookieStore.get('token')
```

如果你暂时不想修改所有代码，可以使用类型转换保持同步调用（仅作为过渡方案）：

```tsx
import { cookies, type UnsafeUnwrappedCookies } from 'next/headers'

// 临时同步用法（不推荐，仅作过渡）
const cookieStore = cookies() as unknown as UnsafeUnwrappedCookies
// 开发模式下会收到警告
const token = cookieStore.get('token')
```

### headers异步化

```tsx
import { headers } from 'next/headers'

// Next.js 14（同步）
const headersList = headers()
const userAgent = headersList.get('user-agent')

// Next.js 15（异步）
const headersList = await headers()
const userAgent = headersList.get('user-agent')
```

### draftMode异步化

```tsx
import { draftMode } from 'next/headers'

// Next.js 14（同步）
const { isEnabled } = draftMode()

// Next.js 15（异步）
const { isEnabled } = await draftMode()
```

### params和searchParams异步化

在Next.js 15中，layout和page组件的`params`和`searchParams`都变成了Promise类型。

#### 异步Page组件

```tsx
// Next.js 14
type Params = { slug: string }
type SearchParams = { [key: string]: string | string[] | undefined }

export default async function Page({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { slug } = params
  const { query } = searchParams
}

// Next.js 15
type Params = Promise<{ slug: string }>
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function Page(props: {
  params: Params
  searchParams: SearchParams
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { slug } = params
  const { query } = searchParams
}
```

#### 同步Layout组件（使用use hook）

如果你需要保持Layout组件同步，可以使用React 19的`use` hook：

```tsx
import { use } from 'react'

type Params = Promise<{ slug: string }>

export default function Layout(props: {
  children: React.ReactNode
  params: Params
}) {
  const params = use(props.params)
  const { slug } = params

  return <div>{slug}</div>
}
```

#### Route Handlers中的params

```tsx
// Next.js 14
type Params = { slug: string }
export async function GET(request: Request, segmentData: { params: Params }) {
  const params = segmentData.params
}

// Next.js 15
type Params = Promise<{ slug: string }>
export async function GET(request: Request, segmentData: { params: Params }) {
  const params = await segmentData.params
}
```

## Fetch请求默认行为变化

### 默认不再缓存

Next.js 15中，`fetch`请求默认不再自动缓存。这意味着你需要在使用时明确指定缓存策略：

```tsx
export default async function RootLayout() {
  // 不缓存（默认行为）
  const a = await fetch('https://example.com/api/data')

  // 强制缓存
  const b = await fetch('https://example.com/api/data', {
    cache: 'force-cache'
  })
}
```

### 批量启用缓存

如果你希望整个layout或page中的fetch请求都默认缓存，可以使用`fetchCache`配置：

```tsx
// 根布局中设置默认缓存策略
export const fetchCache = 'default-cache'

export default async function RootLayout() {
  // 默认缓存
  const a = await fetch('https://example.com/api/data')

  // 明确不缓存
  const b = await fetch('https://example.com/api/data', {
    cache: 'no-store'
  })
}
```

### Route Handlers的GET请求

GET请求默认不再缓存。如果需要缓存，需要显式设置：

```tsx
// 强制静态
export const dynamic = 'force-static'

export async function GET() {
  return Response.json({ data: 'Hello' })
}
```

## 客户端路由缓存策略调整

### 页面导航不再复用缓存

在使用`<Link>`或`useRouter`进行页面导航时，页面组件不再从客户端路由缓存中复用。这意味着每次导航都会获取最新数据。

不过，浏览器后退前进导航和共享布局仍然会复用缓存。

### 配置缓存时间

你可以通过`staleTimes`配置来控制页面缓存时间：

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,  // 动态路由30秒后过期
      static: 180,  // 静态路由180秒后过期
    },
  },
}

module.exports = nextConfig
```

> **注意**：Layouts和loading状态在导航时仍然会被复用。

## 其他重要API变更

### @next/font包移除

`@next/font`包已被移除，统一使用内置的`next/font`。Codemod会自动处理迁移：

```js
// 旧写法
import { Inter } from '@next/font/google'

// 新写法
import { Inter } from 'next/font/google'
```

### runtime配置简化

`experimental-edge`运行时已被废弃，统一使用`edge`：

```js
// 旧写法（报错）
export const runtime = 'experimental-edge'

// 新写法
export const runtime = 'edge'
```

### 配置项重命名

两个实验性配置项已正式稳定：

```js
// bundlePagesExternals → bundlePagesRouterDependencies
const nextConfig = {
  // 旧写法
  experimental: {
    bundlePagesExternals: true,
  },
  // 新写法
  bundlePagesRouterDependencies: true,
}

// serverComponentsExternalPackages → serverExternalPackages
const nextConfig = {
  // 旧写法
  experimental: {
    serverComponentsExternalPackages: ['package-name'],
  },
  // 新写法
  serverExternalPackages: ['package-name'],
}
```

### NextRequest地理位置移除

`NextRequest`上的`geo`和`ip`属性已被移除，因为这些值应由托管平台提供。使用Vercel时，可以改用`@vercel/functions`包：

```ts
import { geolocation, ipAddress } from '@vercel/functions'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { city } = geolocation(request)
  const ip = ipAddress(request)

  // ...
}
```

### Speed Insights自动埋点移除

Next.js 15移除了Speed Insights的自动埋点功能。继续使用需要遵循[Vercel Speed Insights快速入门指南](https://vercel.com/docs/speed-insights/quickstart)进行配置。

## 升级建议与最佳实践

### 渐进式迁移

由于异步API变化较大，建议采用以下策略：

1. **先运行Codemod**：官方提供的迁移工具可以自动处理大部分变更
2. **逐个文件修改**：不要一次性修改所有文件，按需修改
3. **使用过渡方案**：如`UnsafeUnwrappedCookies`类型可以在过渡期使用
4. **充分测试**：特别是涉及cookies、headers的中间件和API路由

### 类型安全

升级时特别注意TypeScript类型的变化：

```bash
# 确保更新类型定义
npm install @types/react@latest @types/react-dom@latest
```

### 运行时选择

如果你使用Edge Runtime，确保将`experimental-edge`改为`edge`，避免部署时报错。

## 总结

Next.js 15是一次重要的版本迭代，带来了以下核心变化：

- **React 19全面支持**：可以使用所有React 19新特性
- **异步API改造**：cookies、headers、params等改为异步模式
- **Fetch默认不缓存**：需要显式指定缓存策略
- **路由缓存调整**：页面导航行为有所变化
- **配置项正式化**：多个实验性配置稳定可用

虽然升级需要一定工作量，但这些变化都是为了更好地支持React 19的并发渲染能力，提升应用性能。建议尽快规划升级计划，享受新版本带来的改进。

如果在使用过程中遇到问题，可以查阅[官方升级指南](https://nextjs.org/docs/app/guides/upgrading/version-15)或参与社区讨论。

## 参考资料

- [Next.js 15 Official Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-15)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights/quickstart)
