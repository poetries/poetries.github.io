---
title: React 19 新特性全解析与升级避坑指南
date: 2025-02-11 10:00:00
description: 拆解 React 19 的 Actions、useActionState、useOptimistic、use API、ref 清理函数与文档元数据支持，附被移除 API 清单和一份可照做的升级步骤。
tags:
  - React
  - React 19
  - 前端开发
  - Hooks
  - TypeScript
categories: Front-End
---

React 19 升级最劝退的往往不是新 API，而是升上去之后控制台里那一片报错。`useRef()` 不传参数过不了类型检查，ref 回调写成箭头函数的隐式返回会被 TypeScript 判错，`propTypes` 和函数组件的 `defaultProps` 干脆没了。这些都不是 bug，是 React 团队有意做的取舍。这篇把新特性和破坏性变更放在一起讲，Actions、`use`、ref 清理函数各自解决什么问题，哪些老写法必须改，升级按什么顺序走最不容易翻车。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- React 19 的安装方式、JSX Transform 要求和升级前的准备工作
- Actions 是什么，它把表单里的哪些样板状态接管掉了
- `useActionState`、`useFormStatus`、`useOptimistic` 三个新 Hook 的分工
- 全新的 `use` API 为什么可以写在条件语句里面
- ref 的两处变化，清理函数和 ref 作为普通 prop
- 文档元数据、样式表 precedence、资源预加载这几个渲染层能力
- 错误处理与 hydration 报错的改进
- Server Components 与 Server Actions 的定位
- 被移除的 API 清单、TypeScript 变更和一份可以照着做的升级步骤

## 一、升级前先把环境理顺

安装本身没什么可说的，官方推荐锁死版本号，避免依赖树里混进不同的 React 副本。

```bash
# npm
npm install --save-exact react@^19.0.0 react-dom@^19.0.0

# yarn
yarn add --save-exact react@^19.0.0 react-dom@^19.0.0
```

用 TypeScript 的项目要同步更新类型定义，否则新增的 API 在编辑器里全是红线。

```bash
npm install --save-exact @types/react@^19.0.0 @types/react-dom@^19.0.0
```

真正会卡住人的是 JSX Transform。React 19 要求使用新的 JSX Transform，如果项目里还是老的，启动时会看到这样一段警告。

```
Your app (or one of its dependencies) is using an outdated JSX transform.
Update to the modern JSX transform for faster performance.
```

大多数项目其实不受影响，Vite、Next.js、CRA 这些脚手架早就默认开了新 Transform。会中招的一般是自己维护 babel 配置的老项目，或者某个很久没更新的第三方组件库。这里有个坑要注意，警告文案里提到的「依赖」不是随口一说，有时候是你自己没问题，是 `node_modules` 里某个包在用旧的 `React.createElement` 路径。

## 二、Actions 把表单的样板状态接管掉了

先说结论，Actions 不是一个新函数，而是一套约定。凡是传给 `startTransition` 或者传给 `<form action={...}>` 的异步函数，React 都把它当成 Action 来处理，自动帮你管 pending、错误和乐观更新的回滚。

看一下老写法长什么样。

```jsx
// 传统写法，三个状态全靠手动维护
function UpdateName() {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async () => {
    setIsPending(true);
    const error = await updateName(name);
    setIsPending(false);

    if (error) {
      setError(error);
      return;
    }
    redirect("/path");
  };

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleSubmit} disabled={isPending}>
        Update
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}
```

`isPending` 这个状态最烦人的地方在于，它必须在 `await` 前后各设一次，中间只要多一个提前 return 的分支，就有可能漏掉复位，按钮永远卡在禁用态。这个我踩过。

换成 React 19 的写法，`useTransition` 直接给你一个 `isPending`。

```jsx
// React 19，pending 状态交给 transition
function UpdateName() {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const error = await updateName(name);
      if (error) {
        setError(error);
        return;
      }
      redirect("/path");
    });
  };

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleSubmit} disabled={isPending}>
        Update
      </button>
    </div>
  );
}
```

React 19 允许在 `startTransition` 里传异步函数，这是和 React 18 最大的区别。React 18 的 transition 只接受同步回调，异步逻辑得自己在外面裹一层状态。

Action 帮你托管的东西一共四类。pending 状态在请求发起时自动置位、结束时自动复位；配合 `useOptimistic` 可以在等待期间先把界面改掉；请求抛错时会交给最近的 Error Boundary，同时把乐观更新回滚回去；如果是通过 `<form action>` 提交的，成功之后表单会自动 reset。

## 三、useActionState 与 useFormStatus

`useActionState` 是 Actions 的常用封装，把「提交函数 + 返回值 + pending」打包成一个 Hook。

```jsx
import { useActionState } from 'react';

function ChangeName() {
  const [error, submitAction, isPending] = useActionState(
    async (previousState, formData) => {
      const error = await updateName(formData.get("name"));

      if (error) {
        return error; // 返回值会成为下一次的 state
      }

      redirect("/path");
      return null;
    },
    null // 初始 state
  );

  return (
    <form action={submitAction}>
      <input type="text" name="name" />
      <button type="submit" disabled={isPending}>
        {isPending ? '提交中...' : '更新'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
```

第一个返回值叫 `error` 只是这个例子里的命名习惯，它的实际含义是「上一次 Action 的返回值」。你返回校验对象、返回成功提示，它就是那个东西。第二个是包装后的 action，直接挂到 `<form action>` 上；第三个是 pending。

Action 函数的第一个参数是上一次的 state，第二个才是 `formData`。很多人可能没注意到这一点，写成只接 `formData` 的单参数函数，结果拿到的是上一次的返回值。

`useFormStatus` 解决的是另一个问题，设计系统里的提交按钮是个独立组件，它需要知道外层表单在不在提交中，但你又不想为此加一路 props。

```jsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? '提交中...' : '提交'}
    </button>
  );
}

function MyForm() {
  return (
    <form action={async () => { /* ... */ }}>
      <input type="text" name="username" />
      {/* 子组件自己去读表单状态，不用父组件透传 */}
      <SubmitButton />
    </form>
  );
}
```

它从 `react-dom` 导入而不是 `react`，因为这是 DOM 特有的能力。另外它只能读到父级 `<form>` 的状态，在 `<form>` 本身所在的那个组件里调用是拿不到的，必须放在子组件里。

## 四、useOptimistic 让等待期间界面先动起来

网络慢的时候，点了按钮界面纹丝不动，用户第一反应是再点一次。乐观更新就是为了填这段空白。

```jsx
import { useOptimistic } from 'react';

function ChangeName({ currentName, onUpdateName }) {
  const [optimisticName, setOptimisticName] = useOptimistic(currentName);

  const submitAction = async (formData) => {
    const newName = formData.get("name");

    // 先把界面改掉
    setOptimisticName(newName);

    // 再等服务端
    const updatedName = await updateName(newName);
    onUpdateName(updatedName);
  };

  return (
    <form action={submitAction}>
      <p>当前名字 {optimisticName}</p>
      <input
        type="text"
        name="name"
        disabled={currentName !== optimisticName}
      />
      <button type="submit">修改</button>
    </form>
  );
}
```

`useOptimistic` 的关键点在于它的「自动还原」。Action 执行期间读到的是乐观值，Action 结束之后 React 会把它丢掉，重新读你传进去的真实值。请求失败也一样，不需要你写回滚逻辑。

我一开始也是这么想的，觉得这跟自己维护一个临时 state 没区别。区别在于失败路径。手写的临时 state，失败时得记得清掉，还得考虑并发提交时后一次覆盖前一次的顺序问题。这些 React 都替你处理了。

`setOptimisticName` 必须在 Action 内部调用，在普通事件回调里调用是无效的，因为它需要依附于一次 transition 才知道什么时候该还原。

## 五、全新的 use API

`use` 可以在渲染阶段读 Promise 和 Context，它不是 Hook，所以不受 Hook 规则约束。

```jsx
import { use, Suspense } from 'react';

function Comments({ commentsPromise }) {
  // Promise 未 resolve 时组件 suspend，由外层 Suspense 兜底
  const comments = use(commentsPromise);

  return comments.map(comment => (
    <p key={comment.id}>{comment.text}</p>
  ));
}

function Page({ commentsPromise }) {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  );
}
```

这里有个前提条件容易被忽略，`use` 接收的 Promise 必须是「稳定」的。在组件渲染函数里现场 `fetch()` 出来的 Promise，每次渲染都是新的，会导致无限挂起。正确做法是在 Server Component 里创建后作为 prop 传下来，或者用支持缓存的数据层去拿。

读 Context 是另一半能力，它可以写在提前 return 之后。

```jsx
import { use } from 'react';
import ThemeContext from './ThemeContext';

function Heading({ children }) {
  if (children == null) {
    return null;
  }

  // useContext 放在这里会违反 Hook 规则，use 不会
  const theme = use(ThemeContext);

  return <h1 style={{ color: theme.color }}>{children}</h1>;
}
```

那为什么 `use` 就能破例呢？因为 Hook 规则的存在是为了保证每次渲染的调用顺序一致，React 靠顺序来对齐 state。`use` 不持有任何 state 槽位，它只是在渲染过程中同步地去读一个外部资源，顺序变了也没关系。

## 六、ref 的两处变化

第一处是 ref 回调可以返回清理函数了。

```jsx
function MyInput() {
  const inputRef = useRef(null);

  return (
    <input
      ref={(ref) => {
        inputRef.current = ref;

        // 元素从 DOM 上摘掉时，React 会调用这个函数
        return () => {
          inputRef.current = null;
          console.log('Input ref cleaned up');
        };
      }}
    />
  );
}
```

React 18 及之前没有这个能力，卸载时 React 会拿 `null` 再调一次同一个回调，所以老代码里到处是 `if (node) { ... } else { ... }` 这样的分支。改成清理函数之后，挂载逻辑和卸载逻辑各自成块，读起来清楚很多。这个设计是真的舒服。

跟着来的是一条硬约束，返回了清理函数之后，React 不会再用 `null` 调一次回调。所以两种写法不能混用，要么全走清理函数，要么保留老的 null 判断。

也正因为返回值现在有意义了，TypeScript 里 ref 回调的隐式返回被禁掉了。

```tsx
// 报错，箭头函数隐式返回了赋值表达式的结果
<div ref={current => instance = current} />

// 正确，用花括号包起来，明确不返回东西
<div ref={current => { instance = current; }} />
```

第二处变化是函数组件可以直接把 `ref` 当普通 prop 收了。

```jsx
// React 19，不需要 forwardRef
function MyInput({ placeholder, ref }) {
  return <input placeholder={placeholder} ref={ref} />;
}

function App() {
  const inputRef = useRef(null);

  return <MyInput ref={inputRef} placeholder="请输入" />;
}
```

`forwardRef` 还能用，官方说的是后续版本会废弃，也提供了 codemod 帮你批量改。组件库作者可以先不动，业务代码新写的组件建议直接用新写法。

## 七、Context 可以直接当 Provider 用

这个改动很小，但每天都会遇到。

```jsx
// 老写法
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>

// React 19
<ThemeContext value="dark">
  <App />
</ThemeContext>
```

`Context.Provider` 没有立刻移除，属于「后续废弃」的行列，同样有 codemod。`Context.Consumer` 也一样，新代码用 `use(Context)` 或者 `useContext` 就够了。

## 八、文档元数据与样式表

React 19 之前，页面标题和 meta 标签基本都得靠 `react-helmet` 这类库，或者交给框架的元数据方案。现在这些标签写在组件里，React 会自动提到 `<head>`。

```jsx
function BlogPost({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>

      {/* 下面这几行会被提升到 head */}
      <title>{post.title}</title>
      <meta name="author" content="作者名" />
      <link rel="canonical" href={post.url} />
      <meta name="keywords" content={post.keywords} />

      <div>{post.content}</div>
    </article>
  );
}
```

回到这块，如果你已经在用 Next.js 的 Metadata API 或者别的框架方案，就别混着写，两套机制同时往 head 里塞标签容易出现重复。React 的原生支持更适合纯客户端渲染的应用，或者框架没覆盖到的边角场景。关于框架层面的元数据处理，可以对照看下 [Next.js 16 的变化梳理](https://feinterview.poetries.top/blog/nextjs16-changes-overview)。

样式表这块引入了 `precedence` 属性，用来声明加载顺序。

```jsx
function ComponentOne() {
  return (
    <Suspense fallback="加载中...">
      <link rel="stylesheet" href="foo.css" precedence="default" />
      <link rel="stylesheet" href="bar.css" precedence="high" />

      <div className="foo-class bar-class">内容</div>
    </Suspense>
  );
}

function ComponentTwo() {
  return (
    <div>
      {/* precedence 相同，会被插到 foo 和 bar 之间的合适位置 */}
      <link rel="stylesheet" href="baz.css" precedence="default" />
    </div>
  );
}
```

React 会保证同一 precedence 的样式表按声明顺序排列，不同 precedence 之间按你给的层级排。它还会去重，同一个 href 在多个组件里声明只会真正插入一次。这解决的是组件级 CSS 最难受的一个问题，样式加载顺序不可控导致的覆盖失效。

## 九、资源预加载 API

`react-dom` 导出了四个函数，对应 HTML 里那几个 resource hint。

```jsx
import { prefetchDNS, preconnect, preload, preinit } from 'react-dom';

function MyComponent() {
  // 只做 DNS 解析，适合「可能会用到」的域名
  prefetchDNS('https://analytics.example.com');

  // 建立完整连接，适合确定要连但还不知道具体资源
  preconnect('https://fonts.googleapis.com');

  // 明确知道要哪个文件，提前下载但不执行
  preload('/fonts/inter.woff2', { as: 'font', type: 'font/woff2' });
  preload('/styles/theme.css', { as: 'style' });

  // 下载并立即执行
  preinit('/scripts/analytics.js', { as: 'script' });

  return <div>内容</div>;
}
```

这四个的强度是递增的。`prefetchDNS` 最轻，只省一次 DNS 查询；`preconnect` 会把 TCP 和 TLS 握手也提前做掉；`preload` 真的把文件下下来放进缓存；`preinit` 下完直接跑。用错了反而是负担，把一堆没必要的资源 preload 进来会抢占关键渲染路径的带宽。

我自己的感受是，这几个 API 在 SSR 场景下价值最大，因为 React 可以在流式输出 HTML 的过程中就把 hint 写进去，比等 JS 执行完再插要早得多。纯 CSR 应用里，收益要小不少。

## 十、错误处理与 hydration 报错

React 19 把根节点的错误回调拆成了三个，不再是一股脑往 console 里打。

```jsx
import { createRoot } from 'react-dom/client';

const root = createRoot(container, {
  // 被 Error Boundary 接住的错误
  onCaughtError: (error, errorInfo) => {
    console.error('捕获的错误', error, errorInfo);
    // 这里适合接监控上报
  },

  // 没有 Error Boundary 兜住的
  onUncaughtError: (error, errorInfo) => {
    console.error('未捕获的错误', error);
  },

  // React 自己恢复过来的，比如 hydration 不匹配后重新渲染
  onRecoverableError: (error, errorInfo) => {
    console.warn('可恢复的错误', error);
  },
});
```

分成三档的好处是上报策略可以分开。`onUncaughtError` 通常要当成故障告警，`onRecoverableError` 更适合当成质量指标观察趋势，不然监控面板一天能被 hydration 警告刷爆。

hydration 报错的信息也重写了。老版本只会甩一句 `Text content did not match`，你得自己去猜是哪个节点。React 19 会把服务端和客户端渲染结果的差异 diff 出来。

```
Hydration failed because the server rendered HTML didn't match the client.
<App>
  <span>
    + Client
    - Server
  </span>
</App>
```

同时它不再对同一次不匹配连续打多条日志，一次 hydration 失败只报一条，带完整 diff。

## 十一、Server Components 与 Server Actions

Server Components 在 React 19 里从实验特性转为稳定 API，但它需要框架配合才能用起来，React 本身只提供协议。

```jsx
// 默认就是 Server Component
async function BlogPost({ id }) {
  // 可以直接读数据库，这段代码不会进客户端 bundle
  const post = await db.posts.get(id);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

Server Actions 是反方向的，让客户端组件能调用跑在服务端的函数。

```jsx
// server/actions.js
'use server';

export async function updateUser(formData) {
  const name = formData.get('name');
  await db.users.update({ name });
  revalidatePath('/profile');
}
```

```jsx
// client/Component.jsx
'use client';

import { updateUser } from './server/actions';

function ProfileForm() {
  return (
    <form action={updateUser}>
      <input type="text" name="name" />
      <button type="submit">更新</button>
    </form>
  );
}
```

说到这个，`'use server'` 这个指令很容易被误解成「把这个文件标记为服务端代码」。它的实际含义是「把这个文件里导出的函数暴露成可被客户端调用的服务端接口」。所以它等于在生成 HTTP 端点，参数校验和权限判断一个都不能省。这块我只在 Next.js App Router 场景验证过，别的框架的实现细节可能有出入。

## 十二、被移除的 API 与 TypeScript 变更

这是升级过程中真正会让构建挂掉的部分。

| 已移除的 API | 替代方案 |
|-----|----------|
| `propTypes` | 改用 TypeScript，或单独装 `prop-types` |
| `defaultProps`（函数组件） | 用 ES6 默认参数 |
| 字符串 ref | 改用 ref 回调或 `useRef` |
| `React.createFactory` | 直接写 JSX |
| `ReactDOM.render` | `createRoot` |
| `ReactDOM.hydrate` | `hydrateRoot` |
| `unmountComponentAtNode` | `root.unmount()` |
| `findDOMNode` | 挂一个 DOM ref |

类组件的 `defaultProps` 还在，被移除的只有函数组件那份。这个区别在 codemod 报告里经常被扫成一大片，实际要改的没那么多。

TypeScript 侧有几处需要手动调整。

```tsx
// useRef 现在必须传初始值
const ref = useRef(null);
const inputRef = useRef<HTMLInputElement>(null);

// ref 回调禁止隐式返回
<div ref={current => { instance = current; }} />

// useReducer 的类型推断改了，一般不再需要手写类型参数
const [state, dispatch] = useReducer(reducer, initialState);

// 全局 JSX 命名空间没了，自定义元素要写到 react 模块声明里
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "my-element": { myProp: string };
    }
  }
}
```

最后这条影响面比想象中大。很多老项目在 `global.d.ts` 里直接 `declare namespace JSX`，React 19 之后 JSX 命名空间挪进了 `react` 模块，那份声明会静默失效，自定义元素全部变成未知标签。

## 十三、升级步骤

顺着上面聊到的那些变更，实际操作按这个顺序走踩坑最少。

Step 1，先升到 React 18.3。这个版本代码上和 18.2 没差别，只是把 React 19 要移除的用法全部加了警告。

```bash
npm install react@18.3 react-dom@18.3
```

Step 2，把控制台跑干净。这一步是整个升级里最花时间的，但也是收益最高的。在 18.3 下修掉的每一条警告，都是 19 里会直接报错的地方。

Step 3，跑官方 codemod，大部分机械改动它能搞定。

```bash
npx codemod@latest react/19/migration-recipe
```

Step 4，正式升级依赖。

```bash
npm install react@latest react-dom@latest
```

Step 5，处理类型。

```bash
npx types-react-codemod@latest preset-19 ./path-to-app
```

codemod 不是万能的，`findDOMNode`、字符串 ref 这类需要人判断语义的地方它改不了，会留给你手工处理。另外第三方库是最大的不确定项，如果依赖里还有没适配 React 19 的组件库，前面四步做得再干净也白搭，先去看它的 peerDependencies。

## 总结

React 19 的改动可以分成两拨看。一拨是往上加的能力，Actions 和三个配套 Hook 把表单提交的状态机收进了框架，`use` 让渲染期读资源成为一等公民，文档元数据和样式表 precedence 补上了组件级资源管理的短板，资源预加载 API 给 SSR 提供了更早的介入点。另一拨是往下减的，`propTypes`、字符串 ref、`ReactDOM.render` 这些活了很多年的 API 集中出清。

如果只挑三个最值得立刻用起来的，我会选 `useActionState`、ref 清理函数和 ref 作为 prop。前者能删掉最多重复代码，后两者能让组件写法变干净，而且都不依赖 SSR 环境。

升级本身别急。先在 18.3 上把警告清零，这一步做扎实了，后面几步基本是走流程。真正的风险点永远在第三方依赖上，不在你自己的代码里。

## 参考

- [React 19 升级指南](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [React 19 发布公告](https://react.dev/blog/2024/12/05/react-19)
- [useActionState 文档](https://react.dev/reference/react/useActionState)
- [useOptimistic 文档](https://react.dev/reference/react/useOptimistic)
- [use API 文档](https://react.dev/reference/react/use)
- [前端进阶之旅](https://interview.poetries.top)
