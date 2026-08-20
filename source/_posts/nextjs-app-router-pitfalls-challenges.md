---
title: Next.js App Router 避坑指南 10个高频错误与正确写法
date: 2025-06-23 14:40:12
description: 总结 Next.js App Router 开发中最常见的 10 个错误，服务端组件绕道 API 路由、Route Handler 被静态化、Suspense 位置放错、Context Provider 拖垮整页、redirect 被 try/catch 吞掉，逐条给出正确写法。
tags:
- Next.js
- App Router
- React
- 前端工程化
- SSR
- 服务端组件
categories: Front-End
---

从 Pages Router 换到 App Router 的第一个月，最常见的现象是代码能跑、页面能出，但性能和预期完全对不上。服务端组件写着写着变成了一堆 `'use client'`，明明用了 `Suspense` 首屏还是白等两秒，Server Action 改完数据页面纹丝不动。这些都不是 bug，是新架构下的心理惯性没转过来。

这篇把 App Router 里最容易踩的 10 个坑摆出来，每个都给出错误写法、为什么错、以及正确做法。全部基于 Next.js 官方文档的行为约定，读完你能拿走一份可以直接对着自己项目做 review 的清单。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 服务端组件到底该怎么取数，为什么不需要中间那层 API 路由
- Route Handler 静默静态化导致数据不更新的三种破解办法
- `Suspense` 放在哪一层才真的能流式上屏
- Context Provider 怎么写才不会把整页拖成客户端渲染
- `'use client'` 的边界规则，哪些组件根本不用加
- 服务端组件和客户端组件怎么组合，为什么 children 能穿透边界
- Server Action 之后的数据重新验证，`revalidatePath` 和 `revalidateTag` 怎么选
- `redirect` 为什么会被 `try/catch` 吃掉
- Metadata API 的正确用法，以及 Next.js 15 之后 `params` 的变化

## 一、在服务端组件里调自己的 API 路由

这是从 Pages Router 迁过来的人第一个会犯的错。以前的思维定式是「数据要从接口拿」，于是在服务端组件里 `fetch` 自己项目的 `/api/posts`。

```javascript
// 错误：在服务端组件中调用自己的 API 路由
export default async function Page() {
  // 需要多写一个 API 路由，而且地址被硬编码了
  const data = await fetch('http://localhost:3000/api/posts').then(res => res.json())

  return (
    <ul>
      {data?.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

这段代码在开发环境跑得好好的，上线之后 `localhost:3000` 直接失效，于是又得引入一个 `NEXT_PUBLIC_BASE_URL` 环境变量来拼地址。绕了一大圈，问题是这一整圈本来就不该存在。

服务端组件本身就跑在服务器上，它有数据库连接、有环境变量、有内网访问权限。多调一次自己的 API 路由，等于让服务器给自己发了一个 HTTP 请求，白白付出一次完整的网络往返加一次序列化开销。

```javascript
// 正确：直接在服务端组件中获取数据
export default async function Page() {
  const data = await fetch('https://api.example.com/posts', {
    // Next.js 15 起 fetch 默认不缓存，要缓存得显式声明
    next: { revalidate: 3600 }
  }).then(res => res.json())

  return (
    <ul>
      {data.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

这里有个细节要注意。Next.js 14 及以前 `fetch` 默认是缓存的，15 之后改成了默认不缓存，所以老教程里那些「不用管，框架会帮你缓存」的说法已经过期，现在必须自己写 `next: { revalidate }` 或 `cache: 'force-cache'`。这块的完整变化我在 [Next.js 15 新特性完全指南](https://feinterview.poetries.top/blog/nextjs-15-performance-react-apps) 里写过。

那什么时候还需要 API 路由呢？给外部系统调用的 webhook、给移动端复用的接口、需要单独做限流鉴权的端点，这些场景 Route Handler 依然有价值。它只是不该成为自己页面取数的必经之路。

## 二、Route Handler 被静态化，数据永远不变

Next.js 默认会对 Route Handler 做静态优化。开发模式下一切正常，一部署到生产环境就出事。

```javascript
// app/api/time/route.js
export async function GET() {
  console.log('API 被调用')
  // 生产环境下会被静态缓存，时间永远停在构建那一刻
  return Response.json({ time: new Date().toLocaleTimeString() })
}
```

部署完刷新一百次，返回的时间一模一样，日志里一条 `API 被调用` 都不打。第一直觉会怀疑是 CDN 缓存，去清了半天缓存也没用。

真正的原因是这个 handler 在构建期就被执行过一次，结果被固化成了静态文件。Next.js 判断的依据很简单，它看不出这个函数有任何依赖运行时信息的地方，那就默认它是个常量。

破解办法有三种，本质都是告诉框架「这个函数必须每次请求都跑」：

```javascript
// 方法一：读取只有请求时才存在的信息
export async function GET(request) {
  const token = request.cookies.get('token')
  return Response.json({ time: new Date().toLocaleTimeString() })
}

// 方法二：同一文件里存在非 GET 方法
export async function GET() {
  return Response.json({ time: new Date().toLocaleTimeString() })
}

export async function POST() {
  return Response.json({ time: new Date().toLocaleTimeString() })
}

// 方法三：显式声明路由段配置
export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json({ time: new Date().toLocaleTimeString() })
}
```

前两种是「被动触发」，靠 `cookies`、`headers`、非 GET 方法这些运行时才能确定的东西让框架自动切换到动态模式。第三种是「主动声明」。

我的建议是能显式就显式。

`export const dynamic = 'force-dynamic'` 只有一行，读代码的人一眼就知道这个路由是动态的。靠 `request.cookies.get('token')` 这种副作用来触发，几个月后有人做重构把这行没用到的代码删了，问题又会原地复活，而且这次更难查。

## 三、客户端组件也不必绕道 API 路由

上一条的反面版本。有人以为客户端组件里只能请求自己的 `/api/*`，于是又造了一层转发。

```javascript
'use client'

import { useState } from 'react'

export default function PostsPage() {
  const [posts, setPosts] = useState([])

  return (
    <>
      <ul>
        {posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
      <button onClick={async () => {
        // 绕道自己创建的 API 路由
        const res = await fetch('/api/posts')
        const data = await res.json()
        setPosts(data)
      }}>
        获取文章
      </button>
    </>
  )
}
```

客户端组件运行在浏览器里，浏览器能请求任何允许跨域的地址，中间这层转发纯属多余：

```javascript
'use client'

import { useState } from 'react'

export default function PostsPage() {
  const [posts, setPosts] = useState([])

  return (
    <>
      <ul>
        {posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
      <button onClick={async () => {
        // 直接调外部 API
        const res = await fetch('https://api.example.com/posts')
        const data = await res.json()
        setPosts(data)
      }}>
        获取文章
      </button>
    </>
  )
}
```

不过这条有明确的例外，得说清楚，不然容易被带偏。需要藏 API key 的、目标接口没开 CORS 的、要在服务端做数据裁剪减少传输量的，这三种情况该加转发层就得加。判断标准不是「客户端能不能直连」，而是「直连会不会泄露东西或者根本连不上」。

## 四、Suspense 放错位置，流式渲染白写

`Suspense` 是 App Router 流式渲染的核心，也是最容易写成摆设的一个。

```javascript
import { Suspense } from 'react'

async function fetchPosts() {
  // 假设这里有 2 秒延迟
}

// 错误：页面组件自己 await 了，Suspense 拦不住
export default async function Page() {
  const data = await fetchPosts()

  return (
    <div>
      <h1>文章列表</h1>
      <Suspense fallback={<div>加载中...</div>}>
        <PostList data={data} />
      </Suspense>
    </div>
  )
}
```

代码里有 `Suspense`，看起来该有的都有了，但用户体验和没写一样，整整两秒白屏，连 `文章列表` 这个标题都出不来。

那为什么加了 `Suspense` 还是白屏呢？因为 `Suspense` 能流式补上的只有它包裹的那棵子树。页面组件自己在最外层 `await`，整个返回值都还没产生，React 连 `Suspense` 的 fallback 都拿不到，自然什么都渲染不出来。

正确做法是把取数下沉到子组件里，让页面组件保持同步：

```javascript
import { Suspense } from 'react'

async function Posts() {
  const data = await fetchPosts()
  return (
    <ul>
      {data.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

// 正确：页面组件不 await，异步子组件被 Suspense 包住
export default function Page() {
  return (
    <div>
      <h1>文章列表</h1>
      <Suspense fallback={<div>加载中...</div>}>
        <Posts />
      </Suspense>
    </div>
  )
}
```

改完之后标题和页面骨架立刻上屏，两秒后数据流式补进列表位置。规则可以简化成一句话，谁 await 谁被阻塞，所以要让 await 发生在尽可能深的地方。

这里也有不适用的场景。会影响布局定位的关键数据、需要被搜索引擎抓到的首屏内容、以及快到不值得付出布局抖动代价的小请求，这三类硬拆成 `Suspense` 反而是负优化，用户看到的是骨架屏闪一下然后内容跳动。关于取数编排的更多手法，Vercel 官方那份 [React 性能优化清单](https://feinterview.poetries.top/blog/vercel-react-best-practices) 里讲得比我细。

## 五、Context Provider 把整页拖下水

Context 必须在客户端组件里创建，这条大家都知道。问题出在放置的位置。

```javascript
'use client'

import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext('light')

function ThemeButton() {
  const theme = useContext(ThemeContext)
  return <button>主题: {theme}</button>
}

// 错误：为了用 Context，整个页面都变成了客户端组件
export default function Page() {
  return (
    <ThemeContext.Provider value="dark">
      <ThemeButton />
    </ThemeContext.Provider>
  )
}
```

因为 Provider 写在了 page 里，这个文件被迫加上 `'use client'`，于是整个页面连同它引入的所有子组件全部退化成客户端渲染。服务端渲染的优势没了，首屏 HTML 里什么内容都没有。

正确做法是把 Provider 单独抽成一个文件，只让这个文件是客户端组件：

```javascript
// app/theme-provider.js
'use client'

import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
```

然后在布局里包一层：

```javascript
// app/layout.js
import { ThemeProvider } from './theme-provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

页面本身依然是服务端组件：

```javascript
// app/page.js
import ThemeButton from './theme-button'

export default function Page() {
  return <ThemeButton />
}
```

关键在于 `children` 这个位置。`ThemeProvider` 虽然是客户端组件，但它接收的 `children` 是在服务端渲染好之后作为 props 传进来的，并不会被它「污染」成客户端组件。这个机制是下面第七条的基础，很多人没注意到。

## 六、`'use client'` 到处撒

见过最夸张的项目是每个组件文件第一行都写着 `'use client'`，问为什么，答「加上就不报错了」。

得先说清楚这个指令的语义。它标记的不是「这个组件是客户端组件」，而是**服务端和客户端之间的那条边界**。写在文件顶部之后，这个文件以及它 import 进来的所有模块，全部进入客户端捆绑。

```javascript
// 父组件是客户端组件
'use client'

import { useState } from 'react'
import Button from './button'  // 这个文件不需要再写 'use client'

export default function Parent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <span>{count}</span>
      {/* Button 自动成为客户端组件的一部分 */}
      <Button onClick={() => setCount(c => c + 1)} />
    </div>
  )
}
```

所以只有边界上的那个文件需要声明。真正需要写 `'use client'` 的场景就四类，用到 `useState` / `useEffect` 这类 Hook、绑定了事件处理函数、访问了 `window` / `localStorage` 这类浏览器 API、自己创建了 Context Provider。

我一开始也是能加就加，觉得反正不影响功能。后来跑了一次 bundle analyzer 才发现，一个纯展示的卡片组件因为顶部那行指令，把它 import 的日期格式化库整个打进了首包。这个我踩过，代价是首屏多了几十 KB。

## 七、服务端组件塞进客户端组件

想在客户端组件里用服务端组件，直接 import 是不行的。

```javascript
'use client'

import ServerComponent from './server-component'

export default function ClientComponent() {
  return (
    <div>
      {/* 错误：服务端组件不能被客户端组件直接 import */}
      <ServerComponent />
    </div>
  )
}
```

一旦被客户端组件 import，那个所谓的服务端组件也会被拉进客户端捆绑，里面的数据库调用、环境变量读取全都会在浏览器里执行，轻则报错重则泄密。

解法是通过 props 传，最常用的就是 `children`：

```javascript
// app/page.js，这是服务端组件
import ClientComponent from './client-component'
import ServerComponent from './server-component'

export default function Page() {
  return (
    <ClientComponent>
      <ServerComponent />
    </ClientComponent>
  )
}
```

```javascript
// app/client-component.js
'use client'

export default function ClientComponent({ children }) {
  return (
    <div>
      <p>客户端组件</p>
      {/* children 就是已经渲染好的服务端组件 */}
      {children}
    </div>
  )
}
```

差别在于传的东西不一样。直接 import 传的是组件本身，也就是一段需要在某个环境里执行的代码；通过 props 传的是已经在服务端渲染完的结果，客户端组件拿到的只是一份可序列化的描述，它负责把这份东西放到 DOM 树的某个坑位里，仅此而已。

顺着这个思路，还有一条隐性开销要提。跨边界传的所有 props 都会被序列化进 HTML，一个有 50 个字段的 `user` 对象，哪怕客户端只用一个 `name`，也会整份传过去。传之前先挑字段，这一步在列表页上省下来的体积很可观。

## 八、Server Action 改完数据页面不刷新

表单提交成功了，数据库也写进去了，页面上还是旧数据，手动刷新一下才对。

```javascript
// app/actions.js
'use server'

export async function createPost(formData) {
  const title = formData.get('title')

  await db.posts.create({ title })

  // 漏了重新验证这一步
  return { success: true }
}
```

原因在于 App Router 的取数结果是被缓存的，你在 action 里写数据库，框架并不知道哪些页面的缓存因此失效了，得你自己告诉它。

按路径失效：

```javascript
// app/actions.js
'use server'

import { revalidatePath } from 'next/cache'

export async function createPost(formData) {
  const title = formData.get('title')

  await db.posts.create({ title })

  revalidatePath('/posts')

  return { success: true }
}
```

按标签失效：

```javascript
// app/actions.js
'use server'

import { revalidateTag } from 'next/cache'

export async function createPost(formData) {
  const title = formData.get('title')

  await db.posts.create({ title })

  revalidateTag('posts')

  return { success: true }
}

// 取数时打上标签
export async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { tags: ['posts'] }
  })
  return res.json()
}
```

两者怎么选？如果同一份数据只在一两个固定路径上出现，`revalidatePath` 更直接。如果这份数据散落在首页、列表页、详情页侧边栏好几个地方，就该用 `revalidateTag`，一次调用把所有挂了这个标签的取数全部标记为过时，不用去数到底有哪些路径。

Next.js 16 在这块又加了新东西，`updateTag` 提供「读到自己刚写的」语义，`refresh` 可以从 Server Action 里刷新客户端路由，细节可以看 [Next.js 16 升级指南](https://feinterview.poetries.top/blog/nextjs16-changes-overview)。

## 九、redirect 被 try/catch 吞掉

这个坑排查起来最费时间，因为代码看着完全正常，就是不跳转。

```javascript
'use server'

import { redirect } from 'next/navigation'

export async function login(formData) {
  try {
    const email = formData.get('email')

    if (!email) {
      throw new Error('需要邮箱')
    }

    await doLogin(email)
    redirect('/dashboard')
  } catch (error) {
    // redirect 抛出的控制流信号在这里被当成普通错误吃掉了
    return { error: error.message }
  }
}
```

`redirect` 的实现方式是抛出一个特殊错误，框架在更外层捕获它并转成跳转响应。所以它被包在 `try` 里的时候，`catch` 会先一步截住这个信号，跳转自然不会发生，而且用户还会看到一条莫名其妙的错误提示。

最干净的写法是让 `redirect` 待在 `try/catch` 外面：

```javascript
export async function login(formData) {
  const email = formData.get('email')

  if (!email) {
    return { error: '需要邮箱' }
  }

  await doLogin(email)
  redirect('/dashboard')
}
```

也有人用 `finally`：

```javascript
export async function login(formData) {
  try {
    const email = formData.get('email')

    if (!email) {
      throw new Error('需要邮箱')
    }

    await doLogin(email)
  } catch (error) {
    return { error: error.message }
  } finally {
    redirect('/dashboard')
  }
}
```

这个写法机制上确实能跑通，`finally` 在 `catch` 之后执行，跳转信号不会再被拦。但它有个明显的副作用，登录失败的分支也会被跳转带走，`catch` 里那个 `return` 白写了。所以除非你确实是「无论成败都要跳走」，否则我更推荐第一种。社区里还有一种做法是在 `catch` 里判断错误的 `digest` 是不是以 `NEXT_REDIRECT` 开头，是的话原样抛出去。它能用，但依赖的是框架内部实现细节，版本一升就可能失效，我自己不太敢在业务代码里长期用。

## 十、Metadata 不写，SEO 全靠猜

App Router 不会自动帮你生成 title 和 description，不写就是空的。做 C 端页面这一条几乎等于把搜索流量拱手让人。

静态页面直接导出常量：

```tsx
// app/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '页面标题',
  description: '页面描述',
  openGraph: {
    title: '社交分享标题',
    description: '社交分享描述',
    images: ['/og-image.jpg'],
  },
}

export default function Page() {
  return <h1>内容</h1>
}
```

动态路由用 `generateMetadata`：

```tsx
// app/posts/[slug]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params
  const post = await getPost(slug)

  return {
    title: post.title,
    description: post.excerpt,
  }
}
```

这里有个版本差异要提醒。Next.js 15 之前 `params` 是普通对象，可以直接 `params.slug`；15 开始它变成了 Promise，必须 `await`。很多 2024 年的教程还是老写法，照抄会在新版本上拿到一个 `undefined`。

还有一点容易忽略，`generateMetadata` 里的取数和页面组件里的取数如果请求的是同一个接口，Next.js 会自动去重，不会真的发两次。所以别为了「省一次请求」把 metadata 和页面数据硬凑在一起传，该分开写就分开写。

## 总结

回头看这 10 个坑，八成都能归到同一件事上，就是没想清楚这段代码到底跑在哪一端。

- **取数位置**。服务端组件直接连数据库或外部 API，不要绕自己的 Route Handler；客户端组件除非要藏密钥或处理跨域，也不必绕
- **动态与静态**。Route Handler 默认会被静态化，需要动态就写 `export const dynamic = 'force-dynamic'`，别靠副作用触发
- **阻塞边界**。谁 await 谁被阻塞，把取数下沉到 `Suspense` 包裹的子组件里，页面组件保持同步
- **客户端边界**。`'use client'` 标记的是边界不是组件，只有真正用到 Hook、事件、浏览器 API、Context 的文件才需要，Provider 单独抽文件放进 layout
- **跨端组合**。服务端组件通过 `children` 或 props 传给客户端组件，传过去的是渲染结果不是组件，同时记得裁剪字段
- **数据一致性**。Server Action 之后必须 `revalidatePath` 或 `revalidateTag`，`redirect` 不要包在 `try/catch` 里
- **SEO**。Metadata API 该写就写，动态路由记得 `params` 已经是 Promise 了

这份清单可以直接当 code review 的检查项用。我自己的习惯是每次新起一个 App Router 项目，先把第四条和第六条在团队里对齐，因为这两个错误一旦铺开，后面重构的成本最高。

## 参考

- [Server Components 与 Client Components - Next.js 官方文档](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Route Segment Config - Next.js 官方文档](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [redirect - Next.js 官方文档](https://nextjs.org/docs/app/api-reference/functions/redirect)
- [revalidatePath - Next.js 官方文档](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [generateMetadata - Next.js 官方文档](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Suspense - React 官方文档](https://react.dev/reference/react/Suspense)
- [前端进阶之旅](https://interview.poetries.top)
