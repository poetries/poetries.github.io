---
title: React 18 并发机制深度解析，Fiber 可中断渲染与时间切片原理
slug: react-18-concurrent-rendering
date: 2024-12-28 17:00:00
description: 从 Fiber 可中断遍历、Lane 优先级模型、MessageChannel 时间切片讲到 startTransition 与 useDeferredValue 的调度差异，拆清楚 React 18 并发渲染怎么把一次长渲染切成能让出主线程的小片段。
tags:
- React
- React 18
- 并发渲染
- Fiber
- 前端进阶
categories: Front-End
---

搜索框里敲一个字，输入框要过半秒才把字显出来；点一下 Tab 切页签，整个界面像被冻住。打开 Chrome DevTools 的 Performance 面板录一段，看到的往往是一根几百毫秒的黄色长条，一个 Task 里塞满了 React 的 render 调用。这时候再去加 `memo`、加 `useMemo` 基本没用，因为问题不在渲染了几次，而在于这一次渲染太长，并且中途没有任何人能打断它。

React 18 的并发机制就是冲着这个场景来的。这篇不铺 API 清单，只讲一件事：React 是怎么把一次「一口气跑完」的渲染，改造成可以随时暂停、让出主线程、之后再接着跑的。读完你应该能自己解释清楚 Lane、时间切片、`startTransition` 三者是怎么串起来的。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- React 18 之前的渲染为什么「不可中断」，卡的到底是哪一步
- Fiber 架构把递归改成链表遍历，换来了什么
- Lane 模型用二进制位表示优先级的设计动机和位运算技巧
- React 为什么放弃 `requestIdleCallback`，改用 `MessageChannel` 自己实现调度器
- 5ms 时间片、`shouldYieldToHost` 与浏览器一帧的关系
- `startTransition` 和 `useDeferredValue` 在调度行为上的真实差别
- 并发渲染带来的新坑，以及面试里怎么把这套机制讲明白

面向使用者的那一批新 API 和升级注意事项，比如 `createRoot`、自动批处理、`Suspense` SSR、`useId`、严格模式二次挂载，我拆到了另一篇里讲，见 [React 18 新特性与升级指南](https://feinterview.poetries.top/blog/react-18-new-features)。这篇只聚焦调度机制本身。

## 一、卡顿卡在哪一步

### 1.1 渲染是一次深度优先遍历

假设我们有这样一棵组件树：

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

React 会以 DFS（深度优先搜索）的顺序走完整棵树：

```
App -> Header -> Sidebar -> Content -> ComponentA -> ComponentB -> Footer
```

每走到一个组件，React 都会为它创建或复用一个 Fiber Node，把 props、key、ref、lanes 这些渲染需要的信息挂在上面。整棵树对应一张 Fiber 链表结构，这就是从 React 16 开始的 Fiber 架构。

触发这次遍历的场景只有两类。一类是 mount，也就是首次渲染，入口是 `ReactDOM.createRoot(document.querySelector('#root')).render(<App />)`；另一类是 update，由 `useState`、`useReducer` 这些 Hook 的 setter 触发。两类走的是同一套协调流程，区别只在于有没有可复用的老 Fiber。

### 1.2 真正的问题是这次遍历停不下来

React 18 之前，这次遍历一旦开始就必须走到底。

后果有三条。渲染开销大的组件（比如几百个列表项）会把主线程占满，用户看到的是页面完全没反应；遍历期间浏览器拿不到主线程，没法处理点击、没法重绘；哪怕这时候来了个明显更紧急的任务，比如用户点了另一个按钮，也只能排队等这一轮渲染跑完。

React 官方文档里有个很直白的例子，把这三条一次性演出来：

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

500 个组件、每个 1ms，这一轮渲染就是 500ms 的同步任务。点 Posts 之后页面明显卡一下，卡住期间点 About 完全没反应，等前一次渲染结束才会一起处理。

我一开始也是这么想的：把 `SlowPost` 包一层 `React.memo` 不就好了？没用。`memo` 解决的是「不该渲染的组件被重渲染」，而这里的 500 个组件是第一次挂载，本来就得渲染一遍。要解决的是「这 500ms 能不能分几次跑」，这是调度问题，不是记忆化问题。

这就是并发机制要处理的核心矛盾。

## 二、Fiber 让什么变成了可中断的

很多人可能没注意到，Fiber 架构本身（React 16）就已经为可中断做好了地基，只是 React 16、17 没把这个能力对外开放。

React 15 的协调是递归的。父组件调子组件，子组件再调孙组件，整个过程压在 JS 调用栈上。调用栈这个东西的特点是，你没法在中间「存档退出」，一旦 return 回去，中间状态就丢了。所以老架构想中断也中断不了。

Fiber 做的事情是把这棵树的遍历从「递归」改写成「循环 + 链表指针」。每个 Fiber 节点上有 `return`（指向父节点）、`child`（指向第一个子节点）、`sibling`（指向下一个兄弟节点）三根指针，遍历过程变成了一个 while 循环，当前进度就是一个全局变量 `workInProgress`。

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

看这段循环的条件就懂了。跳出 while 之后，`workInProgress` 还留在原地指着下一个要处理的节点，下次调度进来接着从这里跑就行。进度存在堆上的一个变量里，而不是存在调用栈里，这就是「可中断」的物理基础。

对照 React 15 的同步版本，循环条件里没有 `shouldYield()`，只有 `workInProgress !== null`，那就是一路跑到底。

顺着上面聊，还有一个配套设计叫双缓存。React 同时维护 current 树（当前屏幕上的）和 workInProgress 树（正在构建的），中途放弃 workInProgress 树不会影响屏幕，因为屏幕上挂的一直是 current。只有构建完整、进入 commit 阶段的那一刻，才会把 current 指针切过去。所以 render 阶段可以被中断甚至被完全丢弃重来，commit 阶段则必须一次性同步跑完，不然用户会看到画到一半的界面。

记住这条分界线，后面很多行为都能从这里推出来：render 可中断，commit 不可中断。

## 三、Lane 模型，优先级怎么编码

### 3.1 Lane 是什么

有了可中断的能力还不够，得有人告诉 React「什么时候该中断」「先做哪个」。这就是 Lane 模型的职责。

Lane 直译是赛道。React 给每一次更新分配一条或多条赛道，赛道的位置代表优先级高低，然后调度器按优先级决定这一轮先处理哪些更新。

### 3.2 为什么用二进制位

React 用二进制位来表示 Lane，源码里长这样（简化过）：

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

为什么非要用二进制，而不是 0 到 10 的数字？

一个原因是 JS 的位运算跑在 32 位整数上，快且没有内存分配。更关键的原因是，一个 Fiber 上可能同时挂着好几种优先级的更新，用位掩码可以把「一组优先级」压进一个数字里，合并和判断都是一步位运算：

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

如果换成数组或者对象来存这一组优先级，每次合并都要遍历、去重、分配新对象，而这套逻辑在一次渲染里会被调用成千上万次。React 还有个叫 `getHighestPriorityLane` 的函数，实现就是 `lanes & -lanes`，取出最低位的那个 1，一行搞定「找出这组里最紧急的那条赛道」。这类小技巧是 Lane 用位表示的直接收益。

### 3.3 事件类型决定初始优先级

那一次 `setState` 的优先级是谁定的？答案是触发它的那个事件。React 在事件系统里维护了一张映射表：

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

优先级顺序是 `DiscreteEventPriority` 大于 `ContinuousEventPriority` 大于 `DefaultEventPriority`。

背后的判断标准挺朴素的。点击、输入、按键这类离散事件，用户预期是「按下去立刻有反应」，慢一帧就能感知到，所以给最高优先级；滚动、滚轮、鼠标移入这类连续事件本来就会高频触发，中间丢几帧影响不大；剩下的网络回调、定时器里的更新，默认优先级就够。

所以你在 `onClick` 里写的 `setState` 和在 `fetch().then()` 里写的 `setState`，走的调度路径是不一样的，哪怕代码看起来一模一样。这个点面试里问得挺多。

## 四、时间切片，5ms 是怎么来的

### 4.1 先看浏览器这一侧的约束

时间切片（Time Slicing）就是把一段连续的渲染工作切成一小段一小段，每段跑完主动把主线程还给浏览器。

为什么要还？因为 JS 执行和页面绘制共用同一根主线程。常见显示器刷新率是 60Hz、120Hz、144Hz，60Hz 意味着浏览器每约 16.7ms 要出一帧，这 16.7ms 里既要跑 JS，又要做样式计算、布局、绘制。你的 JS 占满了 16.7ms，这一帧就没了，用户看到的就是掉帧。

React 定的时间片是 5ms，比一帧短得多。这个值留了足够余量给浏览器做剩下的事，同时又不会因为切得太碎导致调度本身的开销吃掉收益。

### 4.2 为什么不用 requestIdleCallback

`requestIdleCallback` 看起来就是为这个场景生的，浏览器空闲时回调，还给你 `timeRemaining()`。React 团队试过，最后没用，原因主要两条。

一是兼容性，Safari 长期不支持，直到比较晚才跟上，React 不能把核心调度压在一个可能缺席的 API 上。二是执行不够积极，`requestIdleCallback` 只在浏览器认为「确实空闲」时才调，一帧里如果有别的活动，它可能几帧都不触发一次，对 React 来说太被动了。

于是 React 在 `scheduler` 包里基于 `MessageChannel` 造了自己的调度器。选它是因为 `MessageChannel` 的回调是宏任务，会排在当前微任务队列清空、浏览器有机会渲染之后执行，而 `Promise.then` 是微任务，会在同一轮里连着跑完，起不到让出的效果；`setTimeout(fn, 0)` 则有最小 4ms 的钳制，白白浪费时间。

### 4.3 调度器的核心循环

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
```

`postMessage` 之后，`onmessage` 回调会作为一个宏任务被排进队列。等这一轮同步代码和微任务都跑完、浏览器有机会渲染之后，`performWorkUntilDeadline` 才会执行，里面进入工作循环：

```javascript
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

整条链路串起来是这样：

```
1. 调用 unstable_scheduleCallback 添加任务
2. 通过 port.postMessage 发送消息
3. 消息被作为宏任务处理，执行 performWorkUntilDeadline
4. 在 workLoop 中执行渲染任务
5. 每执行 5ms 后判断 shouldYieldToHost()
6. 如果需要让出主线程，停止渲染，等待下次调度
```

这里有个坑要注意。`shouldYieldToHost` 的检查发生在两个工作单元之间，不是发生在一个组件的 render 函数内部。也就是说，如果你单个组件的渲染函数就跑了 200ms（比如在 render 里做了一次大数组排序），时间切片救不了你，这 200ms 照样把主线程焊死。并发能拆的是「组件多」，拆不了「单个组件慢」。

### 4.4 和 requestAnimationFrame 的位置关系

浏览器一轮事件循环的大致顺序是这样的：

```
1. 取出宏任务执行
2. 处理微任务队列
3. 执行 requestAnimationFrame 回调
4. 浏览器渲染
5. 执行 requestIdleCallback（空闲时）
6. 重复...
```

React 的时间切片任务是以宏任务身份排在第 1 步的，跑满 5ms 就退出，把第 2 到 5 步的机会让出去。所以你能观察到的现象是，长渲染期间页面仍然在正常重绘、动画仍然在走，因为每 5ms 就有一个空档。

## 五、startTransition 与 useDeferredValue

有了 Lane 和时间切片，还差最后一环：谁来告诉 React 哪些更新是可以晚一点的？React 18 把这个决定权交给了开发者，入口就是 `startTransition` 和 `useDeferredValue`。

### 5.1 startTransition 做的事

回到第一节那个 500 个 `SlowPost` 的例子，用 `useTransition` 改造之后：

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

点击按钮立刻有反应，页签内容的渲染在后台分片进行，期间再点别的按钮能被优先响应。

它的实现比想象中朴素，核心就是往一个全局开关上打标记：

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

关键在 `ReactCurrentBatchConfig.transition` 这个全局变量。`callback` 执行期间它是有值的，这段时间里任何 `setState` 走到 `requestUpdateLane` 时，都会拿到 `TransitionLane` 而不是事件本身对应的高优先级 Lane：

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

由此推出两条实用结论。第一，`startTransition` 的回调必须是同步的，因为标记只在 `callback()` 同步执行的那一段有效，你在里面写 `await` 或者 `setTimeout`，之后的 `setState` 已经丢了 transition 标记。第二，被包裹的更新走的是低优先级 Lane，所以受控输入框的 value 千万别包进去，包了就会出现「输入框跟不上手速」的诡异现象。

### 5.2 useDeferredValue 差在哪

两个 API 常被当成一回事，我自己的感受是差别就在「你能不能改到那次 setState」。

`startTransition` 作用于更新的产生端，你得能拿到那行 `setState` 并把它包起来。`useDeferredValue` 作用于消费端，它接一个值，返回一个「滞后版本」的值：

```jsx
import { useDeferredValue } from 'react';

function SearchResults({ query }) {
  // query 的变化会被标记为非紧急
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => searchData(deferredQuery), [deferredQuery]);

  return <ResultsList results={results} />;
}
```

`query` 一变，React 先用旧的 `deferredQuery` 快速渲染一遍（输入框立刻响应），然后在低优先级里用新值再渲染一遍。如果这期间 `query` 又变了，前一次低优先级渲染直接作废重来。

所以 `useDeferredValue` 天然带防抖效果，但它不是 `debounce`。`debounce` 是按固定时间等，设备快也得等；`useDeferredValue` 是按「主线程有没有空」来决定，设备快的时候几乎察觉不到延迟，设备慢的时候自动多让几次。这个设计是真的舒服。

什么时候用哪个？值来自 props、或者来自你改不动的第三方 Hook，就用 `useDeferredValue`；值就在你自己的组件里、`setState` 那行你说了算，就用 `startTransition`，还能顺手拿到 `isPending` 画个加载态。

### 5.3 从卡顿到不卡的完整对照

非并发模式下的时间线是这样的：

```
用户点击 About -> 渲染 PostsTab -> 渲染 AboutTab -> 完成
                (阻塞等待)     (阻塞等待)
```

并发模式下：

```
用户点击 About -> 渲染部分 PostsTab -> 检测到高优先级任务
                -> 中断 -> 渲染 AboutTab -> 完成
                -> 继续渲染剩余 PostsTab
```

对应到经典的搜索框场景，改造前后的代码差别很小，体感差别很大：

```jsx
// 优化前：卡顿
function App() {
  const [query, setQuery] = useState('');

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <Results query={query} />
    </>
  );
}
```

```jsx
// 优化后：query 走紧急更新，结果列表走过渡更新
function App() {
  const [query, setQuery] = useState('');
  const [list, setList] = useState([]);
  const [isPending, startTransition] = useTransition();

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);                       // 紧急：输入框立刻更新
    startTransition(() => {
      setList(searchData(value));          // 过渡：可被中断
    });
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending ? <Loading /> : <Results list={list} />}
    </>
  );
}
```

注意 `setQuery` 是留在 `startTransition` 外面的，这一点必须记牢，写反了整个输入体验反而更差。

## 六、并发之后多出来的坑

这套机制不是白拿的，它把一些以前不会暴露的假设变成了真 bug。

最典型的是撕裂（tearing）。渲染可以被中断，就意味着一棵树的上半部分和下半部分可能是在两个不同时刻读到的数据。如果这份数据来自 React 之外，比如一个手写的全局单例 store，中间被别人改了，同一次渲染里就会出现两个组件显示不一致的值。React 18 给外部数据源准备的解法是 `useSyncExternalStore`，Redux、Zustand、MobX 这些库都已经接上了，我们自己写全局状态时也应该走这个 Hook 而不是 `useEffect` 加订阅。关于这几个状态库在并发下的表现差异，我在 [React 状态管理方案对比](https://feinterview.poetries.top/blog/react-state-management-comparison) 里展开过。

第二个坑是 render 阶段的副作用。render 可能被丢弃重来，也可能被执行多次，所以在 render 函数里写计数器自增、写日志上报、改外部变量，行为都会变得不可预期。React 18 的严格模式在开发环境下故意二次调用组件函数和 effect，就是为了把这类问题提前炸出来。这块的具体表现和排查方式在 [React 18 新特性与升级指南](https://feinterview.poetries.top/blog/react-18-new-features) 里有更细的说明。

第三个是心理预期上的坑。并发不是并行，React 依然只有一根线程在跑，它没有让你的代码变快，只是让长任务变得可以插队。如果你的 CPU 时间总量本来就超标，加 `startTransition` 只会让「一直卡」变成「一直转圈」。不是说 `startTransition` 不行，而是它治的是响应性，不是吞吐量，真要减少总耗时还得靠虚拟列表、按需渲染、把重计算挪到 Worker 这些老办法。

还有一点值得提一句。React 19.2 之后有了 `<Activity>` 这类新的原语，可以把子树标记为隐藏并在后台以低优先级预渲染，底下复用的还是这套 Lane 调度。这块我只在 demo 里试过，没在生产项目上验证，具体行为建议以官方文档为准。

## 七、面试里怎么答

### 7.1 一句话概括

React 18 的并发机制通过 Lane 模型给每次更新分配优先级、通过时间切片把渲染拆成 5ms 的片段并在片段之间让出主线程，从而实现了可中断的渲染，让用户交互这类高优先级任务能够插队优先响应。

### 7.2 高频追问

**Q1：并发渲染到底是什么？**

它是一种可中断的渲染能力，不是并行。React 依然单线程，但它能在渲染中途暂停，先去处理更高优先级的任务，之后再继续或者干脆丢弃重来。能做到这一点，靠的是 Fiber 把递归改成了链表循环，渲染进度存在 `workInProgress` 变量里而不是调用栈里。

**Q2：为什么需要时间切片？**

JS 执行和页面绘制共用主线程，同步渲染一旦超过一帧的预算就会掉帧。时间切片把渲染拆成 5ms 的小块，每块跑完让出主线程，浏览器就有机会绘制和响应交互。

**Q3：Lane 模型为什么用二进制？**

因为一个 Fiber 上可能同时存在多个优先级的更新，位掩码可以把一组优先级压进一个 32 位整数，合并是 `a | b`，剔除是 `set & ~subset`，取最高优先级是 `lanes & -lanes`，全是单步位运算，没有内存分配。这套逻辑在一次渲染里会被调用极多次，常数开销很重要。

**Q4：React 为什么不用 requestIdleCallback？**

兼容性不够（Safari 长期缺席），并且触发不够积极，浏览器可能连续几帧都不给你回调。React 改用 `MessageChannel`，它的回调是宏任务，能保证在浏览器有机会渲染之后再执行，也不像 `setTimeout` 那样有 4ms 钳制。

**Q5：`useTransition` 和 `useDeferredValue` 的区别？**

`useTransition` 作用在更新产生端，把一段同步执行的 `setState` 标记成过渡优先级，还附赠 `isPending`；`useDeferredValue` 作用在值的消费端，返回一个滞后版本的值，适合你改不到源头 `setState` 的场景，比如值是从 props 传下来的。两者最终都落到同一条 TransitionLane 上。

**Q6：并发模式下有什么新风险？**

主要是撕裂和 render 阶段副作用。外部数据源要走 `useSyncExternalStore`，render 函数必须保持纯净，严格模式的二次执行就是用来暴露这类问题的。

## 总结

把这套机制拆开看，其实是四层能力叠出来的。

Fiber 把树的遍历从递归改成链表循环，让渲染进度可以存在变量里，这是可中断的物理前提；Lane 用二进制位给每次更新编码优先级，回答了「先做谁」；调度器基于 `MessageChannel` 实现 5ms 时间片，回答了「什么时候停」；`startTransition` 和 `useDeferredValue` 把「哪些更新可以晚点」的决定权交给开发者，回答了「谁说了算」。

四层里，前三层是 React 内部的事，你升到 18 之后自动就有了；第四层要你自己动手，不写就没有并发效果。这也是为什么很多人升级完感觉「没什么变化」，因为并发特性在 React 18 里是渐进启用的，不主动用 `startTransition` 之类的 API，行为和以前基本一致。

最后再强调一次，并发治的是响应性不是吞吐量。它让 500ms 的渲染从「卡死 500ms」变成「分 100 次跑、期间随时能插队」，总耗时并没有变短。搞清楚这条边界，才不会在错误的地方投入优化精力。

## 参考

- [React v18.0 发布公告](https://react.dev/blog/2022/03/29/react-v18)
- [useTransition - React 官方文档](https://react.dev/reference/react/useTransition)
- [useDeferredValue - React 官方文档](https://react.dev/reference/react/useDeferredValue)
- [useSyncExternalStore - React 官方文档](https://react.dev/reference/react/useSyncExternalStore)
- [React Fiber Architecture - acdlite](https://github.com/acdlite/react-fiber-architecture)
- [React scheduler 包源码](https://github.com/facebook/react/tree/main/packages/scheduler)
- [MessageChannel - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/MessageChannel)
- [前端进阶之旅](https://interview.poetries.top)
