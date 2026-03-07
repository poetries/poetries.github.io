---
title: React 18完全指南：新特性、并发模式与升级攻略
date: 2024-01-05 20:40:12
description: 深入解析React 18带来的所有新特性，包括Concurrent Mode并发模式、Automatic Batching自动批处理、新Hooks、Suspense增强、流式SSR等，配以完整代码示例。
tags:
- React
- React 18
- 前端开发
- Hooks
- Concurrent Mode
categories: Front-End
---

React 18于2022年3月29日正式发布，这是React历史上最重要的版本迭代之一。React 18引入了Concurrent Mode并发模式，带来了自动批处理、过渡更新、流式服务端渲染等革命性新特性，同时也为React的未来发展奠定了坚实基础。

本文将全面解析React 18的所有新特性和重大变化，并提供详细的代码示例，帮助你深入理解这个版本的核心改进。

## 一、Concurrent Mode并发模式

### 什么是并发模式

Concurrent Mode（并发模式）是React 18最核心的底层架构更新。官方称之为"你永远不需要关心"的功能，因为它是一个底层机制，上层应用开发者通常感知不到它的存在。

并发模式的核心能力是：**让React能够同时准备多个版本的UI**。

在传统渲染模式中，React执行状态更新时，整个渲染流程是串行的。一旦开始渲染，就会一直执行到完成，期间无法中断。这就像看电影时，门铃响了必须等电影播放完才能去开门。

而在并发模式下，React会判断是否有更高优先级的任务。如果有，当前低优先级的渲染会被暂停，先执行高优先级任务，之后再继续执行或重新执行。这就像看电影时，可以暂停电影先去开门，拿完快递再继续看电影。

### 并发模式的特点

1. **渲染可中断**：React可能在渲染中途暂停，之后继续执行，甚至完全放弃重新开始
2. **UI一致性保证**：即使渲染被中断，React也能保证UI显示一致
3. **后台准备**：React可以在后台准备新屏幕，无需阻塞主线程
4. **渐进式升级**：React 18的并发模式是渐进式的，默认不启用新特性

### 默认行为不变

重要的是，**升级到React 18后，现有代码不会有任何变化**。并发模式默认是关闭的，只有当你使用新特性时才会启用。

## 二、Automatic Batching自动批处理

### 批处理概念

批处理是指React将多个状态更新合并到一次渲染中执行，以提升性能。

```jsx
// React会自动将这两个状态更新合并为一次渲染
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  // React只会re-render一次
}
```

### React 18之前的限制

在React 18之前，批处理只发生在React事件处理器内部。Promise、setTimeout、原生事件等场景下，状态更新不会自动批处理：

```jsx
// React 18之前：只在事件处理器中批处理
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  // 自动批处理，只渲染一次
}

setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // 不会批处理，会渲染两次
}, 1000);
```

### React 18的改进

在React 18中，所有状态更新都会自动批处理，无论发生在什么场景下：

```jsx
// React 18：所有场景都自动批处理
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  // 自动批处理，只渲染一次
}

setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // 自动批处理，只渲染一次
}, 1000);

// Promise同样适用
fetch('/api').then(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // 自动批处理，只渲染一次
});
```

### 退出批处理

如果需要退出自动批处理，可以使用`flushSync`强制同步执行：

```jsx
import { flushSync } from 'react-dom';

function handleClick() {
  flushSync(() => {
    setCounter(c => c + 1);
  });
  // DOM已经更新

  flushSync(() => {
    setFlag(f => !f);
  });
  // DOM已经更新
}
```

## 三、Transitions：区分优先级

### 紧急更新vs过渡更新

React 18引入了更新的优先级概念：

- **紧急更新（Urgent updates）**：打字、点击、拖动等直接交互，需要立即响应
- **过渡更新（Transition updates）**：UI从一个视图过渡到另一个视图，可以有延迟

例如搜索框场景：用户输入时，输入框需要立即更新（紧急），但搜索结果列表可以延迟更新（过渡）。

### startTransition API

```jsx
import { startTransition } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  function handleChange(e) {
    const value = e.target.value;

    // 紧急更新：立即更新输入框
    setQuery(value);

    // 标记为过渡更新：搜索结果可以延迟
    startTransition(() => {
      setResults(searchData(value));
    });
  }

  return (
    <input value={query} onChange={handleChange} />
  );
}
```

### useTransition Hook

`useTransition` Hook提供了`isPending`状态来跟踪过渡更新：

```jsx
import { useTransition } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  function handleChange(e) {
    const value = e.target.value;

    setQuery(value);

    startTransition(() => {
      setResults(searchData(value));
    });
  }

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <ResultsList results={results} />
    </div>
  );
}
```

### useDeferredValue

`useDeferredValue`是另一种标记非紧急更新的方式，适用于无法修改源码的场景：

```jsx
import { useDeferredValue } from 'react';

function SearchResults({ query }) {
  // query的变化会被标记为非紧急
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    return searchData(deferredQuery);
  }, [deferredQuery]);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ResultsList results={results} />
    </div>
  );
}
```

## 四、Suspense增强

### 服务端渲染的Suspense

React 18增强了Suspense在服务端渲染中的能力，支持流式SSR：

```jsx
// 传统SSR：必须等待所有数据准备好才能返回
// React 18 SSR：可以流式返回，逐步交付

function App() {
  return (
    <Layout>
      <NavBar />
      <Sidebar />
      <RightPane>
        <Post />
        <Suspense fallback={<Spinner />}>
          <Comments />
        </Suspense>
      </RightPane>
    </Layout>
  );
}
```

服务端首先返回不含Comments的HTML，Comments部分显示Spinner。当Comments数据准备好后，React会通过同一流发送并替换到相应位置。

### 与Transition结合

Suspense与Transition结合时，React会防止已显示内容被fallback替换：

```jsx
function handleFilterChange(filter) {
  // 标记为过渡更新
  startTransition(() => {
    setFilter(filter);
  });
}

// 如果在过渡期间suspend，React会继续显示当前内容
// 而不是显示fallback
<Suspense fallback={<Loading />}>
  <FilterResults filter={filter} />
</Suspense>
```

## 五、新Hooks详解

### useId：生成唯一ID

`useId`用于在客户端和服务端生成相同的唯一ID，避免hydration不匹配：

```jsx
import { useId } from 'react';

function PasswordInput() {
  const passwordId = useId();
  const hintId = useId();

  return (
    <div>
      <label htmlFor={passwordId}>Password</label>
      <input id={passwordId} type="password" />
      <p id={hintId}>Must be at least 8 characters</p>
    </div>
  );
}
```

生成的ID类似`:r0:`，格式确保了服务端和客户端一致。

### useSyncExternalStore：外部状态管理

`useSyncExternalStore`用于在并发模式下安全读取外部数据源：

```jsx
import { useSyncExternalStore } from 'react';

// 订阅外部store
function useStore(store) {
  return useSyncExternalStore(
    store.subscribe,    // 订阅函数
    store.getSnapshot,  // 客户端获取快照
    store.getServerSnapshot // 服务端获取快照
  );
}
```

这个Hook主要是为第三方状态管理库（如Redux、Zustand）使用，普通应用开发者很少直接使用。

### useInsertionEffect：CSS-in-JS优化

`useInsertionEffect`在DOM更新后、layout effects之前执行，主要供CSS-in-JS库使用：

```jsx
import { useInsertionEffect } from 'react';

// 仅供库作者使用
function useStyledComponent(styles) {
  useInsertionEffect(() => {
    // 在这里注入style标签
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    return () => {
      // 清理函数
      document.head.removeChild(styleElement);
    };
  }, [styles]);
}
```

## 六、新的Client/Server渲染API

### Client端API更新

```jsx
// React 18之前
import { render } from 'react-dom';
render(<App />, container);

// React 18
import { createRoot } from 'react-dom/client';
const root = createRoot(container);
root.render(<App />);

// 卸载
root.unmount();
```

### Hydration更新

```jsx
// React 18之前
import { hydrate } from 'react-dom';
hydrate(<App />, container);

// React 18
import { hydrateRoot } from 'react-dom/client';
hydrateRoot(container, <App />);
```

### Server端API更新

```jsx
// 新API：支持流式SSR
import { renderToPipeableStream } from 'react-dom/server';
import { createReadableStreamFromReadable } from '@react-router/node';

// Node环境流式渲染
function handleRequest(req, res) {
  const stream = renderToPipeableStream(<App />, {
    onShellReady() {
      // 流准备好时开始返回
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      stream.pipe(createReadableStreamFromReadable(res));
    },
  });
}

// Edge环境
import { renderToReadableStream } from 'react-dom/server';
const stream = await renderToReadableStream(<App />);
```

## 七、Strict Mode增强

React 18的Strict Mode新增了开发模式下的检查，会自动模拟组件的挂载和卸载：

```jsx
// 开发模式下，React会：
// 1. 挂载组件 -> 执行layout effects -> 执行effects
// 2. 模拟卸载 -> 销毁layout effects -> 销毁effects
// 3. 重新挂载 -> 再次执行layout effects -> 再次执行effects

function App() {
  useEffect(() => {
    console.log('Effect执行');
    return () => console.log('Cleanup');
  }, []);

  return <div>Hello</div>;
}

// 开发模式下会看到：
// Effect执行 -> Cleanup -> Effect执行
```

这有助于发现组件是否对多次挂载/卸载具有弹性，确保代码可以支持未来的可复用状态特性。

## 八、升级指南

### 安装React 18

```bash
npm install react@18 react-dom@18

# 如果使用TypeScript
npm install @types/react@18 @types/react-dom@18
```

### 迁移createRoot

```jsx
// 之前
import { render } from 'react-dom';
render(<App />, document.getElementById('root'));

// 之后
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

### 迁移hydrate

```jsx
// 之前
import { hydrate } from 'react-dom';
hydrate(<App />, document.getElementById('root'));

// 之后
import { hydrateRoot } from 'react-dom/client';
hydrateRoot(document.getElementById('root'), <App />);
```

### 测试环境配置

```jsx
// 在测试文件开头添加
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
```

## 九、重大变更与废弃API

### 废弃的API

| 废弃API | 替代方案 |
|---------|----------|
| `ReactDOM.render` | `createRoot` |
| `ReactDOM.hydrate` | `hydrateRoot` |
| `ReactDOM.unmountComponentAtNode` | `root.unmount()` |
| `renderToNodeStream` | `renderToPipeableStream` |

### 其他重要变更

1. **一致性Effect时序**：离散用户事件（如点击）触发的effect会同步执行
2. **更严格的Hydration错误**：hydration不匹配现在被视为错误而非警告
3. **组件可以返回undefined**：不再警告，但建议使用linter防止忘记return
4. **移除setState内存泄漏警告**：移除了对已卸载组件调用setState的警告
5. **移除console.log抑制**：Strict Mode下两次渲染都会输出日志

## 十、总结

React 18是一次里程碑式的版本更新，核心变化包括：

- **Concurrent Mode**：底层架构更新，支持渲染可中断
- **Automatic Batching**：所有场景自动批处理，提升性能
- **Transitions**：区分紧急和过渡更新，改善用户体验
- **Suspense增强**：支持流式SSR，加快首屏加载
- **新Hooks**：useId、useSyncExternalStore、useInsertionEffect
- **Strict Mode增强**：帮助发现潜在的兼容性问题

虽然并发模式是底层变化，但大多数现有代码可以直接在React 18上运行。建议逐步引入新特性，享受性能提升带来的用户体验改善。

## 参考资料

- [React 18官方发布公告](https://react.dev/blog/2022/03/29/react-v18)
- [React 18升级指南](https://react.dev/blog/2022/03/08/react-18-upgrade-guide)
- [Automatic Batching深度解析](https://github.com/reactwg/react-18/discussions/21)
- [Suspense SSR架构深度解析](https://github.com/reactwg/react-18/discussions/37)
