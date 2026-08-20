---
title: TanStack Query 实战指南 缓存机制与 Next.js 集成
date: 2025-10-06 16:20:00
description: 讲清 TanStack Query 的 QueryKey 设计、staleTime 与 gcTime 的区别、useMutation 乐观更新回滚，以及 Next.js App Router 下的预取和水合写法。
tags:
  - React Query
  - TanStack Query
  - 数据获取
  - 状态管理
  - 前端工程化
categories: Front-End
---

一个列表页写到第三遍，你会发现自己一直在重复同样的四段代码，`useState` 存数据、`useState` 存 loading、`useState` 存 error、`useEffect` 里发请求外加一个取消标志位。等到产品说「切回这个页面别再转圈了，先显示旧数据」，这套手写方案就开始崩。TanStack Query（原名 React Query）做的就是把这一整套接管掉，同时把缓存、去重、重试、后台刷新一并给你。这篇按 QueryKey、缓存时间、变更与乐观更新、Next.js 集成这个顺序走一遍，重点讲那些默认值背后的取舍。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 服务端状态和客户端状态到底差在哪，为什么不能用同一套工具管
- QueryKey 的设计规则，以及顺序敏感这个容易踩的点
- `status` 和 `fetchStatus` 两套状态的分工
- `staleTime` 与 `gcTime` 的区别，这是最容易搞混的一对
- `useMutation` 的乐观更新三段式和失败回滚
- 依赖查询、并行查询、分页与无限滚动的写法
- Next.js App Router 下的服务端预取加客户端水合
- 结构化共享、保持查询活跃、窗口焦点刷新这几个优化点

## 一、服务端状态凭什么要单独管

先把概念摆清楚。Zustand、Redux 这些库管的是客户端状态，它们的隐含前提是「这份数据归你所有，你改了它就是改了」。

服务端状态不满足这个前提，它有四个特性是客户端状态没有的。数据存在你不控制的服务器上；读写都得走异步接口，没法同步拿到；它是共享的，别人随时可能改掉；你手上这份不主动刷新就会过期，而且你不知道它什么时候过期的。

正是这四条，让服务端状态成了前端里最难处理的一块。

在没有专门工具之前，常见的做法有三种。一种是组件里 `useEffect` 加 `useState` 手撸；一种是把接口数据往 Redux 这类通用状态库里塞；还有一种是用 SWR 这样的轻量方案。

三种都能跑，但代价不一样。手撸意味着加载态、错误处理、缓存、重试、请求竞态这些逻辑每个页面写一遍，写十遍就有十种不同的写法。塞进 Redux 的问题是 store 会长满 `userListLoading`、`userListError` 这种伴生字段，而且 Redux 本身对异步没有任何内建支持，得靠 thunk 或者 saga 补。关于客户端状态该怎么选库，可以看这篇 [React 状态管理库选型指南](https://feinterview.poetries.top/blog/react-state-management-comparison)，这里就不展开了。

TanStack Query 是专门为服务端状态设计的，零配置就有一套合理的默认行为，同时几乎每个行为都能改。

## 二、QueryKey 和两套状态

### QueryKey 是缓存的身份证

每个查询都要有一个唯一的 key，这个 key 决定了缓存命中、数据共享和失效范围。

基础写法很直接，取待办列表用 `['todos']`，取某个用户用 `['user', userId]`，带筛选条件的用 `['todos', { status: 'done', page: 1 }]`。TanStack Query 会对 key 做确定性哈希，相同 key 的查询共享同一份缓存，同时同一时刻只会发出一个请求。

数组元素的顺序是敏感的。`['todos', status, page]` 和 `['todos', page, status]` 会被当成两个不同的查询。但 key 里的对象是顺序无关的，`{ a: 1, b: 2 }` 和 `{ b: 2, a: 1 }` 哈希结果一样，这个设计挺贴心的。

这里有个坑要注意，很多人第一次用会把 key 写死成 `['user']`，然后靠 `queryFn` 里的闭包变量去取不同的 userId。结果就是切换用户时缓存永远命中同一条，界面不更新。凡是 `queryFn` 里用到的外部变量，都要放进 key 里。

按层级组织 key 还有一个附带好处，失效的时候可以按前缀批量处理。

```tsx
// 只失效第一页
queryClient.invalidateQueries({ queryKey: ['todos', 'list', 1] })

// 失效所有 todos 相关查询
queryClient.invalidateQueries({ queryKey: ['todos'] })
```

### 两个维度的状态

`useQuery` 返回的状态有两套，搞混了会写出很奇怪的加载逻辑。

第一套是 `status`，回答的是「数据有没有」。`isPending` 表示还没有数据，`isError` 表示查询失败可以从 `error` 拿错误，`isSuccess` 表示数据在 `data` 里。

第二套是 `fetchStatus`，回答的是「请求在不在跑」。`fetching` 表示正在发请求，`paused` 表示因为断网之类的原因暂停了，`idle` 表示当前没有请求。

两套是正交的，所以会出现 `status` 为 `success` 同时 `fetchStatus` 为 `fetching` 的组合，含义是「有缓存数据可以先渲染，同时后台正在拉新的」。这正是 stale-while-revalidate 的样子，也是 TanStack Query 体验好的核心原因。

所以判断「首次加载中」用 `isPending`，判断「有没有请求在跑」用 `isFetching`。用 `isFetching` 控制全屏 loading，页面每次后台刷新都会闪一下。这个我踩过。

## 三、上手

### 安装和 Provider

```bash
npm install @tanstack/react-query
# 或
pnpm add @tanstack/react-query
# 或
yarn add @tanstack/react-query
```

根组件包一层 `QueryClientProvider`。

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  )
}
```

`QueryClient` 实例在纯客户端应用里可以放模块作用域，SSR 场景不行，第七节会说原因。

### 第一个查询

```tsx
import { useQuery } from '@tanstack/react-query'

function RepoInfo() {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ['repoData'],
    queryFn: () =>
      fetch('https://api.github.com/repos/TanStack/query')
        .then((res) => res.json())
  })

  if (isPending) return <div>加载中...</div>

  if (isError) {
    return <div>错误 {error.message}</div>
  }

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.description}</p>
      <div>{data.stargazers_count} Stars</div>
      <div>{data.forks_count} Forks</div>
    </div>
  )
}
```

`queryKey` 指定身份，`queryFn` 负责取数，剩下的加载态、错误态、缓存全是库在管。

用 `fetch` 时有个细节，`fetch` 对 4xx 和 5xx 不会 reject，所以上面这段代码在接口返回 404 时会把错误 JSON 当成正常数据渲染。正确做法是在 `queryFn` 里检查 `res.ok` 并手动 throw，或者干脆用 axios，它默认会对非 2xx 抛错。

## 四、默认配置里那几个关键值

TanStack Query 的默认值挺激进，不理解它们就会觉得「怎么老在发请求」。

`staleTime` 默认是 0。数据一拿到就被标记为过时，之后只要组件重新挂载、窗口重新获得焦点、网络重连，就会触发一次后台刷新。想少发请求就把它调大。

```tsx
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 5 * 60 * 1000 // 5 分钟内不主动刷新
})
```

`gcTime` 默认 5 分钟，管的是「没有组件在用这份数据之后，缓存还留多久」。超时之后被垃圾回收。这个值和 `staleTime` 经常被搞混。

先说结论，`staleTime` 决定「要不要重新请求」，`gcTime` 决定「缓存什么时候删掉」。数据 stale 了缓存还在，所以重新进页面时会先渲染旧数据再后台刷新，界面不会空白。数据被 gc 掉了缓存就没了，重新进页面会走完整的 pending 状态。

我一开始也是这么想的，以为把 `staleTime` 设长就够了。结果用户切走五分钟再回来，页面还是白了一下。原因就是 `gcTime` 到期把缓存清了。两个值要一起调，一般让 `gcTime` 大于等于 `staleTime`。

`retry` 默认 3 次，指数退避。这对偶发的网络抖动很有用，但对 404 这种确定性错误是浪费。建议按状态码定制。

```tsx
useQuery({
  queryKey: ['user', id],
  queryFn: fetchUser,
  retry: (failureCount, error) => {
    if (error.status === 404) return false
    return failureCount < 3
  }
})
```

`refetchOnWindowFocus` 默认 true，用户切回标签页时自动刷新。对看板、消息这类数据是加分项，对一个正在填的长表单页面就是干扰。

## 五、useMutation 与乐观更新

### 基础用法

增删改走 `useMutation`，它和 `useQuery` 最大的区别是不会自动执行，得你手动 `mutate`。

```tsx
function CreateTodo() {
  const mutation = useMutation({
    mutationFn: (newTodo) =>
      axios.post('/api/todos', newTodo)
  })

  return (
    <button
      onClick={() => {
        mutation.mutate({ title: '学习 TanStack Query', completed: false })
      }}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? '创建中...' : '创建待办'}
    </button>
  )
}
```

状态有四个，`isIdle` 还没触发过、`isPending` 执行中、`isSuccess` 成功、`isError` 失败。另外 `mutate` 不返回 Promise，需要 await 结果的话用 `mutateAsync`，但记得自己 try catch，不然会有未处理的 rejection。

### 乐观更新的三段式

乐观更新就是在服务端响应之前先把界面改掉。`onMutate`、`onError`、`onSettled` 这三个钩子刚好对应「先改、失败回滚、最后对齐」。

```tsx
const queryClient = useQueryClient()

useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    // 先把在飞的同名请求取消掉，否则它的响应会盖掉乐观值
    await queryClient.cancelQueries({ queryKey: ['todos'] })

    // 存一份旧数据，失败时用来回滚
    const previousTodos = queryClient.getQueryData(['todos'])

    // 直接改缓存，界面立刻更新
    queryClient.setQueryData(['todos'], (old) =>
      old.map((todo) =>
        todo.id === newTodo.id ? newTodo : todo
      )
    )

    // 返回值会作为 context 传给 onError 和 onSettled
    return { previousTodos }
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previousTodos)
  },
  onSettled: () => {
    // 不管成功失败，最后都跟服务端对一次
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  }
})
```

`onMutate` 里那句 `cancelQueries` 特别容易被漏掉。少了它，如果乐观更新发生时正好有一个 `['todos']` 的请求在路上，那个请求返回后会把你刚改好的缓存覆盖回旧值，界面就会出现「先变了又变回去」的诡异效果。

`onSettled` 里的 `invalidateQueries` 也别省。乐观更新写进去的是你猜的值，服务端实际存的可能不一样，比如后端会补 `updatedAt` 字段。最后拉一次真实数据，界面才算真的和服务端对齐了。

### 只做失效不做乐观更新

大部分场景其实不需要乐观更新，改完直接失效就够了。

```tsx
const mutation = useMutation({
  mutationFn: addTodo,
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  }
})
```

代码短，也不会有回滚逻辑写错的风险。我的判断是，只有在交互频次高、等待感明显的地方才上乐观更新，比如点赞、勾选待办、拖拽排序这类。

## 六、依赖查询、并行、分页

### 依赖查询

第二个查询需要第一个的结果时，用 `enabled` 控制它什么时候开跑。

```tsx
function UserProfile({ userId }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  })

  const { data: posts } = useQuery({
    queryKey: ['posts', user?.id],
    queryFn: () => fetchUserPosts(user.id),
    enabled: !!user?.id // user 没到位之前不发请求
  })
}
```

`enabled` 为 false 时查询处于 `pending` 且 `fetchStatus` 为 `idle`，所以判断「是不是在等依赖」要看 `fetchStatus`，光看 `isPending` 会误以为在加载。

另一种写法是在一个 `queryFn` 里串起来。

```tsx
const { data: userPosts } = useQuery({
  queryKey: ['userPosts', userId],
  queryFn: async () => {
    const userData = await fetchUser(userId)
    return fetchUserPosts(userData.id)
  }
})
```

区别在缓存粒度。拆成两个查询，`user` 这份数据别的地方也能复用；串在一起就是一份不可拆的缓存。多数情况下我倾向拆开。

### 并行查询

数量固定的话直接写多个 `useQuery` 就行，它们天然并行。数量动态的时候用 `useQueries`。

```tsx
const results = useQueries({
  queries: [
    { queryKey: ['users'], queryFn: fetchUsers },
    { queryKey: ['posts'], queryFn: fetchPosts },
    { queryKey: ['comments'], queryFn: fetchComments }
  ]
})
```

为什么数量动态时必须用 `useQueries`？因为 `useQuery` 是 Hook，不能写在循环或者条件里。`useQueries` 把这个限制绕开了，它内部只占一个 Hook 槽位。

### 分页

把页码放进 key 里，每页各自缓存。

```tsx
function PaginatedList({ page }) {
  const { data, isPending } = useQuery({
    queryKey: ['posts', 'list', page],
    queryFn: () => fetchPosts({ page, limit: 10 })
  })
}
```

这么写翻页时会闪一下，因为新页码是全新的 key，走的是完整的 pending。加上 `placeholderData` 就能保留上一页内容。

```tsx
import { keepPreviousData } from '@tanstack/react-query'

const { data, isPlaceholderData } = useQuery({
  queryKey: ['posts', 'list', page],
  queryFn: () => fetchPosts({ page, limit: 10 }),
  placeholderData: keepPreviousData
})
```

翻页时旧数据继续显示，`isPlaceholderData` 为 true，可以拿它给列表加个半透明效果表示正在加载。这个设计是真的舒服。

### 无限滚动

```tsx
function InfinitePosts() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['posts', 'infinite'],
    queryFn: ({ pageParam }) => fetchPosts({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined
  })

  return (
    <div>
      {data?.pages.map((page) =>
        page.posts.map((post) => <PostCard key={post.id} post={post} />)
      )}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? '加载中...' : '加载更多'}
      </button>
    </div>
  )
}
```

v5 里 `initialPageParam` 是必填的，不能再靠 `pageParam = 1` 这种默认参数。`getNextPageParam` 返回 `undefined` 表示没有下一页了，`hasNextPage` 会变成 false。

## 七、Next.js App Router 集成

### QueryClient 实例的处理

服务端和客户端都要有 QueryClient，但不能共用一个模块级实例，否则不同用户的请求会共享缓存。客户端这边用 `useState` 保证只创建一次。

```tsx
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // SSR 下 staleTime 设成 0 会在水合后立刻重发一次请求
            staleTime: 60 * 1000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

根布局里挂上。

```tsx
// app/layout.tsx
import Providers from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

那个 `staleTime: 60 * 1000` 不是随手写的。默认值 0 的情况下，服务端预取的数据一到客户端就被判定为过时，水合完立刻又发一遍请求，服务端预取白做了。

### 服务端预取加客户端水合

服务端组件里预取，`dehydrate` 序列化，客户端 `HydrationBoundary` 接住。

```tsx
// app/posts/page.tsx，服务端组件
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import PostsList from './PostsList'
import { getPosts } from '@/api/posts'

export default async function PostsPage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostsList />
    </HydrationBoundary>
  )
}
```

```tsx
// app/posts/PostsList.tsx，客户端组件
'use client'

import { useQuery } from '@tanstack/react-query'
import { getPosts } from '@/api/posts'

export default function PostsList() {
  const { data, isPending, error } = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  })

  if (isPending) return <div>加载中...</div>
  if (error) return <div>错误 {error.message}</div>

  return (
    <ul>
      {data?.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

两边的 `queryKey` 必须一模一样，差一个字符就命中不了，客户端会重新发请求，你还不容易发现，因为页面看起来是正常的。排查这类问题最快的办法是打开 Network 面板看水合之后有没有多余请求。

对博客、文档这种静态内容，`staleTime` 可以设得很长。

```tsx
// app/blog/[slug]/page.tsx
export default async function BlogPost({ params }: { params: { slug: string } }) {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['blog', params.slug],
    queryFn: () => getBlogPost(params.slug),
    staleTime: 60 * 60 * 1000, // 1 小时内视为新鲜
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BlogPostContent slug={params.slug} />
    </HydrationBoundary>
  )
}
```

`staleTime` 是 `prefetchQuery` 的顶层选项，直接和 `queryKey`、`queryFn` 平级写，别嵌到别的对象里去。

### 配合 Server Actions

Server Actions 负责写，TanStack Query 负责读，两边通过失效连起来。

```tsx
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const title = formData.get('title')

  const res = await fetch('https://api.example.com/posts', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })

  revalidatePath('/posts')

  return res.json()
}
```

```tsx
// app/posts/CreatePost.tsx
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPost } from '@/app/actions'

export function CreatePost() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (formData: FormData) => createPost(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        mutation.mutate(new FormData(e.currentTarget))
      }}
    >
      <input name="title" placeholder="输入标题" />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? '提交中...' : '创建'}
      </button>
    </form>
  )
}
```

这里有两套缓存要各自处理。`revalidatePath` 清的是 Next.js 的服务端路由缓存，`invalidateQueries` 清的是 TanStack Query 的客户端缓存。它们互不感知，只清一边就会出现「刷新页面数据对了，不刷新还是旧的」这种情况。

说到这个，路由参数变化会自动触发新查询，因为 key 变了。

```tsx
// app/posts/[id]/PostDetail.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { getPost } from '@/api/posts'

export default function PostDetail({ postId }: { postId: string }) {
  // postId 一变，queryKey 就变，自动发新请求
  const { data, isPending } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPost(postId),
  })
}
```

不是说这套组合没缺点，服务端组件预取加客户端组件订阅意味着同一份取数逻辑在两个文件里都要写一遍。抽成共享的 query options 对象能缓解，但样板代码是省不掉的。

## 八、几个性能相关的点

### 结构化共享

TanStack Query 默认开启结构化共享。接口返回的数据如果和缓存里的内容一样，它会保持原来的引用不变，只替换真正变化的那部分。

好处是 `data` 的引用稳定，传给子组件时 `React.memo` 能生效，`useMemo` 和 `useCallback` 的依赖数组也不会无谓失效。

```tsx
function PostList() {
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts
  })

  const handleClick = useCallback((id) => {
    console.log('Clicked:', id)
  }, [])

  return (
    <ul>
      {data?.map((post) => (
        <PostItem key={post.id} post={post} onClick={handleClick} />
      ))}
    </ul>
  )
}
```

代价是每次响应回来都要做一次深比较。数据量特别大的时候这个比较本身有成本，可以把 `structuralSharing` 设成 false 关掉。默认开着适合绝大多数场景。

### 让查询保持活跃

所有用到某个查询的组件卸载之后，查询变成非活跃状态，`gcTime` 到期就被回收。有些场景我们希望它别被回收。

```tsx
// 数据永不过期，只在手动 invalidate 时刷新
const { data } = useQuery({
  queryKey: ['config'],
  queryFn: fetchConfig,
  staleTime: Infinity
})
```

配置项、字典表这类几乎不变的数据适合这么写。但 `staleTime: Infinity` 只管「不主动刷新」，不管「不被回收」，要真正留住缓存还得把 `gcTime` 也调大。

### 窗口焦点刷新的取舍

```tsx
// 全局关掉
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false }
  }
})

// 或者单个查询关
useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  refetchOnWindowFocus: false
})
```

我自己的做法是全局关掉，然后在真正需要实时性的查询上单独打开。默认全开的话，用户切个窗口回来，页面上十几个查询同时往服务端发请求，接口压力和体验都不太好看。

## 九、常见场景速查

用户资料展示，`useQuery` 加长 `staleTime`，这类数据变化频率低。

待办事项管理，增删改用 `useMutation` 配乐观更新，操作反馈即时。

实时看板，配 `refetchInterval` 做定时轮询，配合 `refetchIntervalInBackground` 决定标签页不可见时要不要继续轮。

搜索框，输入做 debounce，再用 `enabled` 控制关键词为空时不发请求。

分页表格，`placeholderData: keepPreviousData` 保留上一页，翻页不闪。

## 总结

TanStack Query 真正值钱的地方不是省掉了几个 `useState`，是它把「服务端数据会过期」这件事变成了框架层的默认假设。你不用再手写 stale-while-revalidate，也不用担心两个组件同时请求同一个接口。

几个我认为必须记住的点。QueryKey 里要放进 `queryFn` 用到的所有变量，漏一个就是缓存串号。`staleTime` 管请求、`gcTime` 管缓存生命周期，两个要一起调。乐观更新的 `onMutate` 里 `cancelQueries` 不能省。SSR 场景下 `staleTime` 默认 0 会让服务端预取失效。

`fetch` 不会对 4xx 抛错这一条也顺手记一下，它跟 TanStack Query 无关，但会让你的错误处理整个失灵。

最后提一句，这些结论我主要是在 Next.js App Router 的项目里验证的，Pages Router 和纯 CSR 应用在水合环节的细节会有出入，用之前对着官方文档确认一遍更稳妥。

## 参考

- [TanStack Query 官方文档](https://tanstack.com/query/latest)
- [Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [Advanced Server Rendering](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- [Practical React Query](https://tkdodo.eu/blog/practical-react-query)
- [前端进阶之旅](https://interview.poetries.top)
