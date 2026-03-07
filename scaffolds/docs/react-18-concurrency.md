---
title: React 18 并发机制深度解析
slug: react-18-concurrent-rendering
date: 2024-12-28 17:00:00
description: 深入解析React 18并发渲染机制，包含Lane模型、时间切片、源码分析，以及面试必备的简洁版本。帮你彻底理解React 18如何实现可中断渲染。
tags:
- React
- React 18
- 并发渲染
- 前端进阶
categories: Front-End
---

## 导语

React 18 最重要的更新就是引入了**并发机制（Concurrent Features）**，这是 React 团队多年研发的结晶。简单来说，并发机制让 React 可以**同时准备多个版本的 UI**，根据用户设备的性能动态调整渲染优先级，从而提供更流畅的用户体验。

本文将深入浅出地讲解 React 18 并发渲染的核心原理，包括 **Lane 模型**、**时间切片**、**useTransition** 等关键技术，并通过源码分析帮助大家彻底理解这一革命性的架构升级。

## 一、React 渲染流程与问题

### 1.1 传统渲染流程

在 React 18 之前，React 的渲染过程是**同步且不可中断**的。假设我们有这样一个组件树：

```jsx
function App() {
  return (
    <div>
      <Header />
      <Sidebar />
      <Content>
        <ComponentA />
        <ComponentB />
      </Content>
      <Footer />
    </div>
  );
}
```

React 会以 **DFS（深度优先搜索）** 的顺序遍历整棵树：

```
App -> Header -> Sidebar -> Content -> ComponentA -> ComponentB -> Footer
```

对于每个组件，React 都会创建对应的 **Fiber Node**（Fiber 节点），用于保存渲染所需的信息如 props、key、ref、lanes 等。这就是 React 的 **Fiber 架构**。

### 1.2 渲染触发时机

React 会在两种情况下触发渲染：

1. **mount**：首次渲染，例如 `ReactDOM.createRoot(document.querySelector('#root')).render(<App />)`
2. **update**：状态更新，例如通过 `useState`、`useReducer` 等 Hook 触发重新渲染

### 1.3 核心问题：渲染不可中断

在 React 18 之前，**整个渲染过程是不能被中断的**。这意味着：

- 如果某个组件渲染开销较大（如包含大量列表项），用户会明显感觉到页面卡顿
- 在渲染过程中，浏览器无法响应用户的交互操作
- 即使有更高优先级的任务（如用户点击），也必须等待当前渲染完成

React 官方提供了一个典型例子来展示这个问题：

```jsx
function App() {
  const [tab, setTab] = useState('posts');

  return (
    <div>
      <button onClick={() => setTab('posts')}>Posts</button>
      <button onClick={() => setTab('about')}>About</button>
      {tab === 'posts' ? <PostsTab /> : <AboutTab />}
    </div>
  );
}

// PostsTab 包含500个渲染开销大的组件
function PostsTab() {
  return (
    <div>
      {Array(500).fill(0).map((_, i) => (
        <SlowPost key={i} index={i} />
      ))}
    </div>
  );
}

// 每个SlowPost组件渲染需要1ms
function SlowPost({ index }) {
  // 模拟渲染开销
  let startTime = performance.now();
  while (performance.now() - startTime < 1) {}

  return <div>Post #{index}</div>;
}
```

在这个例子中：
- 点击 Posts 按钮后，页面会出现明显卡顿
- 在渲染完成前，其他按钮点击无法响应
- 用户体验非常糟糕

**这就是 React 18 并发机制要解决的核心问题。**

## 二、并发渲染的核心解决方案

React 18 通过两个核心技术实现了并发渲染：

1. **Lane 模型**：为每次渲染分配优先级
2. **时间切片**：将连续渲染拆分为可中断的片段

### 2.1 解决方案一：useTransition

React 18 提供了 `useTransition` Hook 来解决上述问题：

```jsx
import { useState, useTransition } from 'react';

function App() {
  const [tab, setTab] = useState('posts');
  const [isPending, startTransition] = useTransition();

  function handleTabChange(nextTab) {
    // 使用 startTransition 包裹低优先级更新
    startTransition(() => {
      setTab(nextTab);
    });
  }

  return (
    <div>
      <button onClick={() => handleTabChange('posts')}>Posts</button>
      <button onClick={() => handleTabChange('about')}>About</button>
      {isPending ? <Loading /> : tab === 'posts' ? <PostsTab /> : <AboutTab />}
    </div>
  );
}
```

使用 `useTransition` 后：
- 点击按钮会立即响应，页面不会卡顿
- 低优先级的渲染任务可以被高优先级任务中断
- 用户可以继续与其他元素交互

这就是**并发更新**的典型应用场景。

## 三、 Lane 模型详解

### 3.1 什么是 Lane

**Lane**（中文意为"赛道"）是 React 18 引入的优先级管理机制。简单来说，Lane 模型会给每次渲染分配一个**优先级**，React 根据这些优先级决定哪些更新应该优先处理。

### 3.2 二进制表示的优势

React 使用**二进制**来表示不同的 Lane：

```javascript
// React 源码中的 Lane 定义（简化）
const Lane = {
  NoLane: 0b0000000000000000000000000000000,
  SyncLane: 0b0000000000000000000000000000001,  // 最高优先级
  InputContinuousLane: 0b0000000000000000000000000000100,
  DefaultLane: 0b0000000000000000000000000010000,
  IdleLane: 0b0000000000000000000001000000000,   // 最低优先级
};
```

为什么采用二进制？

1. **性能**：计算机底层对二进制的处理效率更高
2. **位运算**：可以轻松完成合并、比较等操作

```javascript
// 合并多个 Lane
export function mergeLanes(a, b) {
  return a | b;  // 位运算 OR
}

// 移除某个 Lane
export function removeLanes(set, subset) {
  return set & ~subset;  // 位运算 AND NOT
}
```

### 3.3 事件优先级映射

不同的浏览器事件对应不同的 Lane 优先级：

```javascript
export function getEventPriority(domEventName) {
  switch (domEventName) {
    case 'click':
    case 'input':
    case 'keydown':
      return DiscreteEventPriority;  // 最高优先级
    case 'scroll':
    case 'wheel':
    case 'mouseenter':
      return ContinuousEventPriority; // 中等优先级
    default:
      return DefaultEventPriority;    // 默认优先级
  }
}
```

优先级顺序：`DiscreteEventPriority` > `ContinuousEventPriority` > `DefaultEventPriority`

这意味着：
- 用户点击输入等操作会立即响应
- 滚动、拖拽等连续事件次之
- 数据渲染等后台任务优先级最低

## 四、时间切片详解

### 4.1 什么是时间切片

**时间切片（Time Slicing）** 是将连续不可中断的渲染过程变成可中断的、离散的渲染片段。

这样做的好处是：
1. 在渲染间隙可以判断是否有更高优先级的任务
2. 可以及时渲染 UI 界面
3. 可以响应用户的交互操作

### 4.2 为什么需要时间切片

我们先理解浏览器的刷新机制：
- 常见显示器刷新率有 60Hz、120Hz、144Hz
- 60Hz 意味着每秒钟刷新 60 次，即每次间隔约 **16.7ms**
- 浏览器需要在 16.7ms 内完成 JS 执行和 UI 渲染

问题在于：React 的渲染和 JS 执行都运行在**主线程**上，当渲染时间过长时，会阻塞 UI 渲染导致卡顿。

**时间切片的解决方案**：把连续的渲染过程切分成小块，每个小块执行时间不超过 5ms，执行完后让出主线程，让浏览器有机会渲染 UI。

### 4.3 React 如何实现时间切片

React 并没有直接使用 `requestIdleCallback`（因为 Safari 不兼容且浏览器执行不够积极），而是基于 `MessageChannel` 实现了自己的调度器。

#### MessageChannel 实现原理

```javascript
// React Scheduler 源码简化版
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

// 调度函数
function requestHostCallback(callback) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    port.postMessage(null);  // 发送消息触发调度
  }
}

// 核心工作循环
function workLoop() {
  let currentTask = taskQueue[0];
  while (currentTask) {
    if (shouldYieldToHost()) {  // 判断是否需要让出主线程
      break;  // 让出主线程，等待下次调度
    }
    const callback = currentTask.callback;
    callback();
    taskQueue.shift();
    currentTask = taskQueue[0];
  }
  return currentTask !== null;  // 是否还有任务
}

// 判断是否需要让出主线程
function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime;
  return timeElapsed >= 5;  // 默认5ms时间片
}
```

#### 工作流程

```
1. 调用 unstable_scheduleCallback 添加任务
2. 通过 port.postMessage 发送消息
3. 消息被作为宏任务处理，执行 performWorkUntilDeadline
4. 在 workLoop 中执行渲染任务
5. 每执行 5ms 后判断 shouldYieldToHost()
6. 如果需要让出主线程，停止渲染，等待下次调度
```

### 4.4 与 requestAnimationFrame 的关系

时间切片与浏览器渲染时机的关系：

```
1. 取出宏任务执行
2. 处理微任务队列
3. 执行 requestAnimationFrame 回调
4. 浏览器渲染
5. 执行 requestIdleCallback（空闲时）
6. 重复...
```

React 的时间切片就是在步骤 3-5 之间找到执行渲染任务的机会。

## 五、并发模式下的渲染流程

### 5.1 非并发模式 vs 并发模式

**非并发模式**：
```
用户点击 About -> 渲染 PostsTab -> 渲染 AboutTab -> 完成
                (阻塞等待)     (阻塞等待)
```

**并发模式**：
```
用户点击 About -> 渲染部分 PostsTab -> 检测到高优先级任务
                -> 中断 -> 渲染 AboutTab -> 完成
                -> 继续渲染剩余 PostsTab
```

### 5.2 React 18 的并发特性

React 18 的并发机制包含以下特性：

1. **自动批处理**：多个状态更新自动合并为一次渲染
2. **useTransition**：标记非紧急更新为"过渡"
3. **useDeferredValue**：延迟非关键 UI 更新
4. **Suspense**：优雅处理异步加载
5. **useId**：生成稳定的唯一 ID

## 六、源码分析：完整的调度流程

### 6.1 整体架构

React 18 的调度流程可以分为以下几个层次：

```
用户触发更新
    ↓
调度中心（Scheduler）← Lane 优先级
    ↓
Fiber 协调器（Reconciler）
    ↓
渲染器（Renderer）
```

### 6.2 核心源码解析

#### 1. 状态更新入口

```javascript
// useState 内部实现简化
function useState(initialState) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}

function updateState(initialState) {
  return dispatchAction(fiber, queue, action);
}
```

#### 2. 调度优先级计算

```javascript
function dispatchAction(fiber, queue, action) {
  const lane = requestUpdateLane(fiber);  // 根据事件类型获取 Lane
  const update = {
    lane,
    action,
    eagerReducer: null,
    next: null,
  };

  // 将更新加入队列
  const root = scheduleUpdateOnFiber(fiber, lane);
}
```

#### 3. 渲染阶段的让出机制

```javascript
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }

  if (workInProgress !== null) {
    // 还有工作没完成，让出主线程
    return true;
  }
}
```

### 6.3 useTransition 的实现

```javascript
function useTransition() {
  const dispatcher = resolveDispatcher();
  return dispatcher.useTransition();
}

function mountTransition() {
  const [isPending, setPending] = useState(false);
  const startTransition = (callback) => {
    setPending(true);
    const prevTransition = ReactCurrentBatchConfig.transition;
    ReactCurrentBatchConfig.transition = {};

    try {
      callback();  // 执行低优先级更新
      setPending(false);
    } finally {
      ReactCurrentBatchConfig.transition = prevTransition;
    }
  };

  return [isPending, startTransition];
}
```

核心原理：将 `callback` 的执行标记为**过渡优先级**，允许被高优先级任务中断。

## 七、面试简洁版本

### 7.1 一句话概括

**React 18 的并发机制通过 Lane 模型分配优先级、时间切片拆分渲染，实现了可中断的渲染能力，让高优先级任务（如用户交互）能够优先响应。**

### 7.2 核心概念

1. **Lane 模型**：用二进制位表示渲染优先级，支持高效合并和比较
2. **时间切片**：将渲染拆分为 5ms 的小片段，执行后让出主线程
3. **useTransition**：将低优先级更新标记为"过渡"，可被中断

### 7.3 常见面试题

**Q1: React 18 并发渲染是什么？**

A: 并发渲染是 React 18 引入的新能力，可以让 React 同时准备多个版本的 UI。它不是并行（同时执行多个），而是可中断的渲染——当有更高优先级的任务时，会暂停当前渲染先去处理高优先级任务。

**Q2: 为什么需要时间切片？**

A: 因为 JS 执行和 UI 渲染都在主线程，之前的渲染是同步且不可中断的，会阻塞页面响应。时间切片将渲染拆分成小片段，每片段执行后让出主线程，让浏览器有机会渲染 UI 和响应用户交互。

**Q3: Lane 模型的优势？**

A: 用二进制表示优先级，可以利用位运算高效地进行合并、比较操作。React 可以根据不同事件（点击 > 滚动 > 渲染）分配不同优先级。

**Q4: useTransition 和 useDeferredValue 的区别？**

A: `useTransition` 用于状态更新场景，标记某次更新为低优先级；`useDeferredValue` 用于值变化场景，延迟子组件的渲染更新。两者都是处理"紧急更新"和"慢速更新"竞争的问题。

**Q5: React 18 自动批处理？**

A: React 18 之前只在事件处理函数中自动批处理，Promise、setTimeout 等场景需要手动处理。React 18 默认所有场景都自动批处理，减少不必要的渲染。

### 7.4 代码示例

```jsx
// 优化前：卡顿
function App() {
  const [query, setQuery] = useState('');

  return (
    <input value={query} onChange={e => setQuery(e.target.value)} />
    <Results query={query} />  // 大量数据渲染
  );
}

// 优化后：使用 useTransition
function App() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleChange(e) {
    startTransition(() => {
      setQuery(e.target.value);  // 低优先级，可中断
    });
  }

  return (
    <input value={query} onChange={handleChange} />
    {isPending ? <Loading /> : <Results query={query} />}
  );
}
```

## 总结

React 18 并发机制的核心在于：

1. **Lane 模型**：用二进制位运算高效管理渲染优先级
2. **时间切片**：基于 MessageChannel 实现可中断渲染
3. **useTransition**：让开发者控制哪些更新可以被打断

这套机制解决了 React 长年被诟病的"渲染阻塞交互"问题，让应用能够根据用户设备的性能动态调整，提供更流畅的用户体验。

理解并发机制，对于深入掌握 React 架构和应对面试都至关重要。
