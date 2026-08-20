---
title: Next.js 15 新特性完全指南 异步API与缓存策略的全部变化
date: 2025-05-11 14:40:12
description: Next.js 15 升级要点全解析，React 19 全面支持、cookies/headers/params 异步化、fetch 默认不再缓存、客户端路由缓存策略调整，逐条给出改法、原因和迁移节奏建议。
tags:
- Next.js
- React
- 前端开发
- React 19
- 升级指南
- 缓存
categories: Front-End
---

把一个 App Router 项目从 Next.js 14 升到 15，最先跳出来的往往不是报错，是数据库的监控曲线。原本靠 `fetch` 自动缓存扛住的列表接口，升级后每次请求都真的打到了后端，QPS 直接翻几倍。紧接着才是编辑器里那一片红，`cookies()` 拿不到值了，`params.slug` 变成了 `undefined`。

这两件事都不是 bug，是 Next.js 15 有意为之的行为变更。这篇把 15 的核心改动逐条拆开，讲清楚改法、背后的原因，以及哪些可以先放着不动。读完你会有一份能直接排期的迁移清单，而不是只知道「要加 await」。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 升级前的环境要求和官方 codemod 能覆盖的范围
- React 19 带来的 `useActionState`、`useFormStatus` 增强和 Actions
- 异步 Request API 的完整清单，以及 layout 里怎么用 `use` 保持同步
- `fetch` 默认不缓存这一刀砍下去，你的项目该怎么补
- 客户端路由缓存调整和 `staleTimes` 配置
- `@next/font`、`experimental-edge`、`NextRequest.geo` 等一批 API 变更
- 一套渐进式迁移的节奏建议

## 一、升级前的准备工作

Next.js 15 的环境要求比 14 高一档，但没到 16 那种「Node 18 直接不给跑」的程度：

- Node.js 18.17.0 或更高
- 用 TypeScript 的话，`@types/react` 和 `@types/react-dom` 要跟着升
- 包管理器建议 pnpm 8+、npm 10+ 或 yarn 1.22+

类型包这条别跳过。React 19 的类型定义变化不小，老版本 `@types/react` 配新版 React 会在 JSX 返回值、`ref` 类型这些地方报一堆看起来毫无道理的错，找半天原因才发现是类型包没动。

### 一键升级

官方 codemod 能吃掉大部分机械劳动：

```bash
# 使用 pnpm
pnpm dlx @next/codemod@canary upgrade latest

# 使用 npm
npx @next/codemod@canary upgrade latest

# 使用 yarn
yarn dlx @next/codemod@canary upgrade latest

# 使用 bun
bunx @next/codemod@canary upgrade latest
```

它主要处理三类事，异步 API 的 `await` 补全、`@next/font` 到 `next/font` 的导入替换、以及几个配置项的重命名。剩下的业务逻辑调整还是得人工过。

### 手动升级

```bash
# pnpm
pnpm add next@latest react@latest react-dom@latest eslint-config-next@latest

# npm
npm install next@latest react@latest react-dom@latest eslint-config-next@latest

# yarn
yarn add next@latest react@latest react-dom@latest eslint-config-next@latest
```

> **注意**：升级过程中如果遇到 peer dependencies 报警，可能需要手动指定 React 版本，或者临时用 `--force` / `--legacy-peer-deps` 绕过。生态里的第三方库跟上 React 19 需要时间，这类警告在过渡期很常见。

## 二、React 19 全面支持

Next.js 15 把 React 和 ReactDOM 的最低版本抬到了 19，所以 19 的新能力可以直接用。对日常业务影响最大的是表单这一块。

### useFormState 换成 useActionState

`useFormState` 被 `useActionState` 取代，前者还能用但已经标记废弃。新 API 最实用的改动是把 pending 状态直接返回出来了：

```tsx
import { useActionState } from 'react'

async function submitForm(prevState, formData) {
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

以前拿 pending 得往下再套一层组件用 `useFormStatus`，因为那个 Hook 必须在 `form` 的子树里才生效。现在同一层就能拿到，为了一个 loading 态而拆组件的日子结束了。

这个改动看着小，实际上它改变了表单组件的组织方式。

### useFormStatus 拿到了更多信息

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

多出来的 `data`、`method`、`action` 用在做通用提交按钮组件时很方便，比如根据 `method` 决定按钮文案，或者从 `data` 里读出正在提交的条目 ID 做局部高亮。

> **提示**：如果还没升到 React 19，`useFormStatus` 依然只有 `pending` 一个属性。

React 19 本身还有 `use`、`ref` 作为 prop、文档元数据托管这些改动，我在 [React 19 新特性](https://feinterview.poetries.top/blog/react-19-new-features) 那篇里单独写过。

## 三、异步 Request API

这是 15 里最影响面积的改动。原本同步的动态 API 全部改成异步。

### cookies

```tsx
import { cookies } from 'next/headers'

// Next.js 14，同步
const cookieStore = cookies()
const token = cookieStore.get('token')

// Next.js 15，异步
const cookieStore = await cookies()
const token = cookieStore.get('token')
```

如果一时改不完，官方给了一个过渡用的类型转换：

```tsx
import { cookies, type UnsafeUnwrappedCookies } from 'next/headers'

// 临时同步用法，开发模式会打警告
const cookieStore = cookies() as unknown as UnsafeUnwrappedCookies
const token = cookieStore.get('token')
```

名字里带 `Unsafe` 就是在提醒你这是个临时口子。Next.js 16 已经把它彻底移除了，所以别把它当长期方案，升级到 15 的同时就该把这些点排进计划。

### headers 和 draftMode

```tsx
import { headers } from 'next/headers'

// Next.js 14
const headersList = headers()
const userAgent = headersList.get('user-agent')

// Next.js 15
const headersList = await headers()
const userAgent = headersList.get('user-agent')
```

```tsx
import { draftMode } from 'next/headers'

// Next.js 14
const { isEnabled } = draftMode()

// Next.js 15
const { isEnabled } = await draftMode()
```

那为什么非要改成异步呢？这几个 API 读的都是当次请求才存在的信息。同步读取意味着渲染必须停在这里等，整棵组件树被一个 UA 判断卡住。改成 Promise 之后，React 可以在等待请求信息落定的同时先去渲染不依赖它的分支，并发渲染和后来的 PPR 都建立在这个前提上。

### params 和 searchParams

layout 和 page 组件里的 `params`、`searchParams` 也变成了 Promise：

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

这里有个容易漏的地方。TypeScript 不会拦住你写 `props.params.slug`，因为 Promise 上确实没有 `slug`，但如果你的类型标注还停在旧版本，编译期一片安静，运行时才拿到 `undefined`。所以类型包必须同步升级，这一条前面提过一次，这里再强调一遍。

### layout 里想保持同步就用 use

不是所有组件都适合改成 async，尤其是 layout。React 19 的 `use` Hook 可以在同步组件里解开 Promise：

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

### Route Handler 里的 params

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

Route Handler 这块最容易被忘掉，因为它们通常没有页面那么频繁地被打开，问题往往在灰度期间才暴露。升级时直接全局搜 `params` 过一遍最稳。

## 四、fetch 默认不再缓存

开头说的监控曲线异常就出在这里。

Next.js 14 及以前，`fetch` 默认相当于 `cache: 'force-cache'`，写代码时不声明任何东西，框架也会帮你缓存。15 把这个默认值改成了不缓存：

```tsx
export default async function RootLayout() {
  // 不缓存，这是 15 的新默认行为
  const a = await fetch('https://example.com/api/data')

  // 想要缓存必须显式声明
  const b = await fetch('https://example.com/api/data', {
    cache: 'force-cache'
  })
}
```

我一开始也觉得这是个倒退，缓存明明是好事，为什么要关掉。后来遇到过一次数据「明明改了但页面死活不更新」的排查，才理解官方的取舍。默认缓存最大的问题是它是隐式的，新人写了一个取实时数据的 `fetch`，框架悄悄给缓存住了，这类 bug 表现为「偶发的脏数据」，比多打几次接口难查得多。改成默认不缓存之后，性能问题会立刻反映在监控上，而正确性问题被消灭了。

用错误的性能换正确性，通常是划算的。

### 整段批量开缓存

如果某个 layout 或 page 下的请求确实都该缓存，不用一个个加参数：

```tsx
// 在根布局里设置默认缓存策略
export const fetchCache = 'default-cache'

export default async function RootLayout() {
  // 走缓存
  const a = await fetch('https://example.com/api/data')

  // 单独声明不缓存
  const b = await fetch('https://example.com/api/data', {
    cache: 'no-store'
  })
}
```

### Route Handler 的 GET 同样受影响

```tsx
// 需要静态化就显式声明
export const dynamic = 'force-static'

export async function GET() {
  return Response.json({ data: 'Hello' })
}
```

顺便提一句，这条和 App Router 里另一个经典坑正好相反。以前是 GET handler 被意外静态化导致数据不更新，现在是默认动态导致缓存失效，两个方向的问题我在 [App Router 避坑指南](https://feinterview.poetries.top/blog/nextjs-app-router-pitfalls-challenges) 里都整理过。

升级时的实操建议是这样，先别急着到处加 `force-cache`。跑一遍压测或者看两天监控，把真正高频且能容忍延迟的接口挑出来，只给这些加缓存并配上合适的 `revalidate` 时间。无脑全开等于把 15 的改动又退回去了，那些「其实需要实时」的接口会再次埋雷。

怎么找出哪些 `fetch` 受影响？最笨也最有效的办法是全局搜一遍裸调用，也就是第二个参数为空的那些。这类调用在 14 里全部走缓存，升级后全部变成实时请求，命中率的落差最大。搜出来之后按数据性质分三类处理，配置类和字典类直接加 `cache: 'force-cache'`；列表和详情这种会变但不要求秒级的，配 `next: { revalidate: 60 }` 之类的时间窗；账户余额、库存、消息未读数这些必须实时的，保持默认就对了。

还有一类容易被忽略的是构建期取数。`generateStaticParams` 里的请求、以及被静态渲染的页面在构建时发的请求，这些不受运行时缓存策略影响，但它们的数量会随着页面数线性增长。如果你的站点有几千个静态页，升级后构建时长有没有变化值得单独量一下。

## 五、客户端路由缓存策略调整

用 `<Link>` 或 `useRouter` 做页面跳转时，页面组件不再从客户端路由缓存里复用，每次导航都会重新取数据。浏览器的前进后退，以及跳转前后共享的那部分 layout，仍然走缓存。

这个改动的动机和上一节一致，都是在压缩「用户看到旧数据」的窗口。代价是频繁来回切换的页面会多发请求。

需要调整就用 `staleTimes`：

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,  // 动态路由 30 秒内复用缓存
      static: 180,  // 静态路由 180 秒内复用缓存
    },
  },
}

module.exports = nextConfig
```

配上 `dynamic: 30` 相当于把 14 的行为找回来一部分。什么时候该配？后台管理系统这类「列表页和详情页之间来回横跳」的场景很值得配，用户一分钟内切二十次，每次都重新拉列表既浪费也卡手。而对内容型站点，保持默认更合适。

> **注意**：layout 和 loading 状态在导航时依然会被复用，这部分行为没变。

## 六、其他 API 变更

这一节都是小改动，但漏掉任何一条都会让构建或运行时报错。

### @next/font 包被移除

```js
// 旧写法
import { Inter } from '@next/font/google'

// 新写法
import { Inter } from 'next/font/google'
```

字体功能早就内置进 `next/font` 了，独立包只是历史遗留，codemod 会自动处理。

### experimental-edge 废弃

```js
// 旧写法，现在会报错
export const runtime = 'experimental-edge'

// 新写法
export const runtime = 'edge'
```

### 两个实验配置转正

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

`serverExternalPackages` 这个平时用得不多，但只要你依赖了带原生模块的库，比如某些数据库驱动或者图像处理库，它就是刚需，写错名字的表现是构建时报一堆奇怪的模块解析错误。

### NextRequest 上的 geo 和 ip 没了

`NextRequest` 的 `geo` 和 `ip` 属性被移除，理由是这些值本来就该由托管平台提供，框架不该假设自己跑在哪。用 Vercel 的话改成这样：

```ts
import { geolocation, ipAddress } from '@vercel/functions'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { city } = geolocation(request)
  const ip = ipAddress(request)

  // ...
}
```

自建部署的项目就得自己从请求头里取了，通常是 `x-forwarded-for` 或者网关约定的自定义头。这里有个坑要注意，`x-forwarded-for` 是可以被伪造的，如果这个 IP 要用于风控或限流，必须在网关层做过滤，只信任最靠近你的那一跳。

### Speed Insights 自动埋点移除

Next.js 15 拿掉了 Speed Insights 的自动埋点，继续用需要按 [Vercel 的快速入门](https://vercel.com/docs/speed-insights/quickstart) 手动接。

## 七、迁移节奏建议

异步 API 的改动面积太大，一次性梭哈很容易做成一个几百文件的巨型 PR，review 不动也不敢合。我的建议是拆开走。

**Step 1 先跑 codemod。** 让工具把机械替换做完，然后仔细看 diff，重点检查那些被工具改过但你不认识的文件。

**Step 2 分模块提交。** 按路由分组，一次改一个业务模块，每组单独跑一遍构建和主流程测试。中间态用 `UnsafeUnwrappedCookies` 顶着，让主干始终可发布。

**Step 3 重点测中间件和 API 路由。** 涉及 `cookies`、`headers` 的地方最容易出事，而且这类问题在页面上看不出来，得靠接口测试或者灰度流量。

**Step 4 最后处理缓存策略。** 把 `fetch` 缓存和 `staleTimes` 放到最后，因为这一步需要参考真实流量数据，不看监控拍脑袋配没有意义。

类型这块单独提醒一句：

```bash
npm install @types/react@latest @types/react-dom@latest
```

如果项目里用了 Edge Runtime，记得把 `experimental-edge` 全部改成 `edge`，这个在本地开发时不一定报错，部署时才炸。

## 总结

Next.js 15 的改动可以归成三条主线：

- **异步化**。`cookies`、`headers`、`draftMode`、`params`、`searchParams` 全部变成 Promise，为并发渲染让路。层级浅的组件用 `async` 加 `await`，需要保持同步的 layout 用 React 19 的 `use`
- **缓存默认值反转**。`fetch` 和 Route Handler 的 GET 默认不再缓存，客户端路由导航也不复用页面缓存。框架把「正确性」设成了默认，性能得你自己按需要加回来
- **API 清理**。`@next/font`、`experimental-edge`、`NextRequest.geo` 这批老接口下线，两个实验配置转正

从升级成本看，异步化是工作量最大的一块，但它有 codemod 兜底；缓存策略调整工作量小，风险却最高，因为它不报错，只在监控曲线和账单上体现。

还有一点要提前想到，15 里那个 `UnsafeUnwrappedCookies` 过渡方案在 Next.js 16 里已经彻底移除了。所以升 15 的时候留下的技术债，下一次升级会连本带利收回去，具体改了哪些可以看 [Next.js 16 升级指南](https://feinterview.poetries.top/blog/nextjs16-changes-overview)。能一次改干净就别留尾巴。

## 参考

- [Next.js 15 官方升级指南](https://nextjs.org/docs/app/guides/upgrading/version-15)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [useActionState - React 官方文档](https://react.dev/reference/react/useActionState)
- [cookies - Next.js 官方文档](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights/quickstart)
- [前端进阶之旅](https://interview.poetries.top)
