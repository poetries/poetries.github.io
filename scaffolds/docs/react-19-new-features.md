---
title: React 19完全指南：新特性、重大变化与升级攻略
date: 2025-02-11 10:00:00
description: 深入解析React 19带来的所有新特性，包括Actions、useActionState、useOptimistic、use新API、Ref清理函数等，配以完整代码示例，帮你快速掌握React最新版本。
tags:
- React
- React 19
- 前端开发
- Hooks
- TypeScript
categories: Front-End
---

React 19已正式发布，这是自React 18以来最重要的版本迭代。React 19引入了诸多革命性的新特性，包括Actions表单处理、全新的`use`API、Ref清理函数、Server Components支持等，同时清理了大量废弃API，让React更加精简高效。

本文将全面解析React 19的所有新特性和重大变化，并提供详细的代码示例，帮助你快速掌握这个最新版本。

## 安装与环境准备

### 安装React 19

```bash
# 使用npm安装
npm install --save-exact react@^19.0.0 react-dom@^19.0.0

# 使用yarn安装
yarn add --save-exact react@^19.0.0 react-dom@^19.0.0
```

如果使用TypeScript，还需要更新类型定义：

```bash
npm install --save-exact @types/react@^19.0.0 @types/react-dom@^19.0.0
```

### 新JSX Transform

React 19要求使用新的JSX Transform。如果未启用，会看到警告：

```
Your app (or one of its dependencies) is using an outdated JSX transform.
Update to the modern JSX transform for faster performance.
```

大多数项目不受影响，因为新Transform已在大多数环境中默认启用。

## 一、Actions：表单处理的革命

Actions是React 19最核心的新特性，专门用于处理表单提交和数据变更。它能自动管理pending状态、错误处理和乐观更新。

### 传统写法 vs Actions写法

```jsx
// 传统写法：手动管理所有状态
function UpdateName({}) {
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

// React 19 Actions写法：简洁优雅
function UpdateName({}) {
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

Actions会自动管理：
- **Pending状态**：请求开始时自动设为true，完成后自动重置
- **乐观更新**：配合`useOptimistic`显示即时反馈
- **错误处理**：自动显示Error Boundary并回滚乐观更新
- **表单重置**：成功提交后自动重置表单

## 二、useActionState：简化Actions

`useActionState`是专门为Actions设计的Hook，简化了常见的数据提交场景：

```jsx
import { useActionState } from 'react';

function ChangeName({ name, setName }) {
  const [error, submitAction, isPending] = useActionState(
    async (previousState, formData) => {
      const error = await updateName(formData.get("name"));

      if (error) {
        return error; // 返回错误信息
      }

      redirect("/path");
      return null; // 成功返回null
    },
    null // 初始状态
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

返回值的结构：
- `error`：Action的返回结果（成功为null，失败为错误信息）
- `submitAction`：包装后的Action函数
- `isPending`：是否处于提交中状态

## 三、useOptimistic：乐观更新

乐观更新让用户看到即时的UI反馈，无需等待服务器响应：

```jsx
import { useOptimistic } from 'react';

function ChangeName({ currentName, onUpdateName }) {
  // 立即显示新名字，同时发起请求
  const [optimisticName, setOptimisticName] = useOptimistic(currentName);

  const submitAction = async (formData) => {
    const newName = formData.get("name");

    // 立即显示乐观更新
    setOptimisticName(newName);

    // 等待服务器响应
    const updatedName = await updateName(newName);
    onUpdateName(updatedName);
  };

  return (
    <form action={submitAction}>
      <p>当前名字: {optimisticName}</p>
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

当请求进行中时显示`optimisticName`，请求完成后自动切换回`currentName`。

## 四、useFormStatus：表单状态共享

在设计系统中，子组件常常需要知道父表单的状态，`useFormStatus`让这变得简单：

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
      {/* 子组件可以获取表单状态，无需props传递 */}
      <SubmitButton />
    </form>
  );
}
```

## 五、全新use API：渲染中读取资源

### use Promise

`use`是React 19引入的全新API，可以在渲染阶段读取Promise和Context：

```jsx
import { use, Suspense } from 'react';

function Comments({ commentsPromise }) {
  // use会Suspend直到Promise resolved
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

### use Context

`use`还可以读取Context，且支持在条件语句后使用（这是useContext做不到的）：

```jsx
import { use } from 'react';
import ThemeContext from './ThemeContext';

function Heading({ children }) {
  if (children == null) {
    return null;
  }

  // useContext无法在early return后使用，use可以
  const theme = use(ThemeContext);

  return <h1 style={{ color: theme.color }}>{children}</h1>;
}
```

## 六、Ref清理函数

React 19支持从ref回调返回清理函数，这是社区呼吁已久的特性：

```jsx
function MyInput() {
  const inputRef = useRef(null);

  return (
    <input
      ref={(ref) => {
        // ref创建
        inputRef.current = ref;

        // 返回清理函数
        return () => {
          // ref清理 - 元素从DOM移除时调用
          inputRef.current = null;
          console.log('Input ref cleaned up');
        };
      }}
    />
  );
}
```

对比之前必须用`null`判断：

```jsx
// React 18及之前的写法
<input
  ref={(ref) => {
    inputRef.current = ref;
    return () => {
      // 清理逻辑
    };
  }}
/>
// 或者
<input
  ref={(ref) => {
    inputRef.current = ref;
  }}
/>

// 组件卸载时React会调用ref(null)
```

## 七、ref作为普通prop

之前函数组件使用ref必须用`forwardRef`，React 19可以直接把ref当作prop传递：

```jsx
// React 19新写法：无需forwardRef
function MyInput({ placeholder, ref }) {
  return <input placeholder={placeholder} ref={ref} />;
}

// 使用
function App() {
  const inputRef = useRef(null);

  return <MyInput ref={inputRef} placeholder="请输入" />;
}
```

## 八、Context作为Provider

React 19简化了Context Provider的写法：

```jsx
// 之前的写法
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>

// React 19新写法：直接渲染Context
<ThemeContext value="dark">
  <App />
</ThemeContext>
```

## 九、文档元数据支持

React 19原生支持在组件中渲染`<title>`、`<link>`、`<meta>`等文档元数据：

```jsx
function BlogPost({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>

      {/* 自动提升到<head> */}
      <title>{post.title}</title>
      <meta name="author" content="作者名" />
      <link rel="canonical" href={post.url} />
      <meta name="keywords" content={post.keywords} />

      <div>{post.content}</div>
    </article>
  );
}
```

React会自动将这些标签提升到文档的`<head>`部分。

## 十、样式表支持

React 19原生支持样式表，并处理加载顺序：

```jsx
function ComponentOne() {
  return (
    <Suspense fallback="加载中...">
      {/* 使用precedence控制优先级 */}
      <link rel="stylesheet" href="foo.css" precedence="default" />
      <link rel="stylesheet" href="bar.css" precedence="high" />

      <div className="foo-class bar-class">内容</div>
    </Suspense>
  );
}

function ComponentTwo() {
  return (
    <div>
      <link rel="stylesheet" href="baz.css" precedence="default" />
      {/* 插入到foo和bar之间 */}
    </div>
  );
}
```

## 十一、资源预加载API

React 19提供了优化资源加载的新API：

```jsx
import { prefetchDNS, preconnect, preload, preinit } from 'react-dom';

function MyComponent() {
  return (
    <div>
      {/* 预连接DNS - 当确定需要连接某域名但不确定具体资源时 */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />

      {/* 预获取DNS - 当可能需要某域名资源时 */}
      <link rel="prefetch-dns" href="https://analytics.com" />

      {/* 预加载字体 */}
      <link rel="preload" href="/fonts.woff" as="font" />

      {/* 预加载样式 */}
      <link rel="preload" href="/styles.css" as="style" />

      {/* 预初始化脚本 - 立即加载并执行 */}
      <script async src="/analytics.js" />
    </div>
  );
}
```

## 十二、错误处理改进

React 19改进了错误处理，减少了重复日志：

```jsx
import { createRoot } from 'react-dom/client';

const root = createRoot(container, {
  // 捕获到的错误（Error Boundary处理）
  onCaughtError: (error, errorInfo) => {
    console.error('捕获的错误:', error, errorInfo);
    // 上报错误监控系统
  },

  // 未捕获的错误
  onUncaughtError: (error, errorInfo) => {
    console.error('未捕获的错误:', error);
  },

  // 可恢复的错误
  onRecoverableError: (error, errorInfo) => {
    console.warn('可恢复的错误:', error);
  },
});
```

## 十三、hydration改进

React 19改进了hydration错误提示，现在会显示具体的差异：

```jsx
// 之前：只显示模糊的错误信息
// "Warning: Text content did not match..."

// 现在：显示具体差异
// "Hydration failed because the server rendered HTML didn't match the client.
// <App>
//   <span>
//     + Client
//     - Server
//   </span>
// </App>"
```

## 十四、Server Components与Server Actions

### Server Components

Server Components允许组件在服务器端运行，减少客户端JavaScript体积：

```jsx
// 这是一个Server Component (默认)
async function BlogPost({ id }) {
  // 直接在服务器端读取数据库
  const post = await db.posts.get(id);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

### Server Actions

Server Actions允许客户端调用服务器端函数：

```jsx
// server/actions.js
'use server';

export async function updateUser(formData) {
  const name = formData.get('name');
  await db.users.update({ name });
  revalidatePath('/profile');
}

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

## 十五、重大变更与废弃API

### 已移除的API

| API | 替代方案 |
|-----|----------|
| `propTypes` | 使用TypeScript或PropTypes库 |
| `defaultProps`(函数组件) | 使用ES6默认参数 |
| 字符串ref | 使用ref回调 |
| `React.createFactory` | 使用JSX |
| `ReactDOM.render` | 使用`createRoot` |
| `ReactDOM.hydrate` | 使用`hydrateRoot` |
| `unmountComponentAtNode` | 使用`root.unmount()` |
| `findDOMNode` | 使用DOM ref |

### TypeScript变更

```tsx
// useRef现在必须传入初始值
const ref = useRef(null); // 必须传参
// 或者
const ref = useRef<HTMLInputElement>(null);

// ref回调的隐式返回被禁止
// 错误写法
<div ref={current => instance = current} />

// 正确写法
<div ref={current => { instance = current; }} />

// useReducer类型推断改进
// 推荐不指定类型参数
const [state, dispatch] = useReducer(reducer, initialState);

// JSX命名空间变更
// 需要在模块声明中扩展
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "my-element": { myProp: string };
    }
  }
}
```

## 升级建议

### 推荐升级步骤

1. **先升级到React 18.3**：它包含React 19所需的所有警告
   ```bash
   npm install react@18.3 react-dom@18.3
   ```

2. **修复所有警告**：确保应用在React 18.3下无警告运行

3. **运行Codemod**：自动迁移大部分变更
   ```bash
   npx codemod@latest react/19/migration-recipe
   ```

4. **升级到React 19**
   ```bash
   npm install react@latest react-dom@latest
   ```

5. **处理TypeScript类型**
   ```bash
   npx types-react-codemod@latest preset-19 ./path-to-app
   ```

## 总结

React 19是一次重大版本更新，带来的核心变化包括：

- **Actions**：革命性的表单处理方案
- **useActionState**：简化Actions使用
- **useOptimistic**：优雅的乐观更新
- **use API**：渲染中读取Promise/Context
- **Ref清理函数**：更优雅的ref管理
- **文档元数据**：原生支持SEO标签
- **样式表支持**：更好的CSS管理
- **资源预加载**：性能优化利器
- **错误处理改进**：更清晰的错误信息
- **Server Components**：全栈React架构

建议尽快规划升级计划，体验React 19带来的开发体验提升。

## 参考资料

- [React 19官方升级指南](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [React 19发布公告](https://react.dev/blog/2024/12/05/react-19)
- [useActionState文档](https://react.dev/reference/react/useActionState)
- [useOptimistic文档](https://react.dev/reference/react/useOptimistic)
- [use API文档](https://react.dev/reference/react/use)
