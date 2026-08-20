---
title: React 18 新特性与升级指南，createRoot 自动批处理与 Suspense SSR
date: 2024-01-05 20:40:12
description: React 18 面向使用者的新 API 和升级注意事项全梳理，包含 createRoot 入口迁移、自动批处理的生效条件、Suspense 流式 SSR、useId 与 useSyncExternalStore、严格模式二次挂载，以及一份可照着跑的升级 checklist。
tags:
- React
- React 18
- 前端开发
- Hooks
- 升级迁移
categories: Front-End
---

把一个项目从 React 17 升到 18，`package.json` 改两行、`yarn install` 跑一遍，最快五分钟。麻烦的是跑起来之后那一堆现象：控制台冒出 `ReactDOM.render is no longer supported`，某个 `useEffect` 里的接口请求发了两次，TypeScript 突然报一堆 `Property 'children' does not exist`，还有几个原本靠「setState 之后立刻读 DOM」的地方悄悄失效了。

这篇就是把这些坑一次讲清楚。内容聚焦在 React 18 面向使用者的那一层，也就是你实际要改的 API 和要处理的行为差异；至于并发渲染底下的 Fiber 可中断、Lane 优先级、时间切片这些机制原理，我拆到了 [React 18 并发机制深度解析](https://feinterview.poetries.top/blog/react-18-concurrency) 那篇里，这里不重复。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `createRoot` / `hydrateRoot` 入口迁移，以及它为什么是所有新特性的开关
- 自动批处理的真实生效条件，什么时候需要 `flushSync` 退出批处理
- `Suspense` 在服务端渲染里的流式能力，`onShellReady` 和 `onAllReady` 怎么选
- `useId`、`useSyncExternalStore`、`useInsertionEffect` 三个新 Hook 分别是给谁用的
- 严格模式二次挂载会炸出哪些问题，为什么不建议直接关掉它
- 一份可以照着跑的升级 checklist 和废弃 API 对照表
- 2026 年这个时间点，React 18 和 19 该怎么取舍

React 18 是 2022 年 3 月 29 日发布的，到现在已经是很多项目的存量基线。哪怕你今天直接上 19，下面这些行为差异也一样绕不开，因为 19 是在 18 的基础上继续往前走的。

## 一、先把入口换成 createRoot

### 1.1 改法本身很简单

客户端渲染的入口从 `react-dom` 换到 `react-dom/client`：

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

服务端渲染的注水入口同理：

```jsx
// React 18之前
import { hydrate } from 'react-dom';
hydrate(<App />, container);

// React 18
import { hydrateRoot } from 'react-dom/client';
hydrateRoot(container, <App />);
```

注意 `hydrateRoot` 的参数顺序和老的 `hydrate` 是反过来的，容器在前、元素在后。这个我踩过，改的时候手快按老顺序写，页面白屏也不报错，找了一会儿才反应过来。

### 1.2 为什么这一步不能跳过

先说结论：不换 `createRoot`，React 18 装了等于没装。

装上 `react@18` 之后继续用 `ReactDOM.render`，React 会打一条 deprecation warning，然后把你的应用跑在 legacy 模式下。legacy 模式意味着调度行为和 React 17 完全一致，自动批处理不生效，`startTransition` 之类的并发 API 也起不了作用。

所以升级顺序应该是这样：先只改入口，把项目跑起来，观察一轮行为差异并修掉；等稳定了再考虑要不要引入 `startTransition`、流式 SSR 这些主动开启的能力。这两件事分两次做，出问题的时候好定位得多。

顺带说一句，`ReactDOM.unmountComponentAtNode(container)` 也一起废弃了，对应写法是先把 `createRoot` 的返回值存下来，卸载时调 `root.unmount()`。很多项目在微前端子应用的生命周期钩子里会用到这个，别漏。

## 二、自动批处理

### 2.1 批处理是什么

批处理指的是 React 把一次同步流程里的多个状态更新合并成一次渲染：

```jsx
// React会自动将这两个状态更新合并为一次渲染
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  // React只会re-render一次
}
```

这个能力 React 17 就有，只不过范围窄得多。

### 2.2 React 18 之前的边界在哪

老版本的批处理只在 React 合成事件的处理器里生效。跳出这个范围，比如 `setTimeout`、`Promise` 回调、原生事件监听器里，每个 setState 都会各自触发一次渲染：

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

这个割裂一直挺别扭的，同样两行代码，放在不同位置渲染次数不一样，老项目里为了绕它写 `unstable_batchedUpdates` 的地方不少。

### 2.3 React 18 统一了

18 之后所有场景都批处理，不管你在哪里调 setState：

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

这里有个前提条件很多人漏掉：自动批处理只在 `createRoot` 创建的根上生效。如果你还在用 `ReactDOM.render`，行为和 17 一模一样。所以第一节那步入口迁移不是可选项。

### 2.4 什么时候需要退出批处理

绝大多数情况下批处理只会让你的应用更快，但有一类代码会被它打破，就是「改完状态立刻读 DOM」：

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

`flushSync` 会强制在回调结束时同步刷新这一批更新，DOM 立刻变。典型用途是列表新增一条之后要滚到底部、或者展开面板之后要测量高度，这类需要拿到最新 DOM 尺寸的场景。

但别拿它当万金油。`flushSync` 等于主动放弃批处理和并发调度，在循环里连着调几次，性能会明显掉下来。我的用法是先想能不能用 `useLayoutEffect` 或者 ref 回调解决，实在不行才上 `flushSync`，并且只包必要的那一行 setState。

## 三、Suspense 在 SSR 里终于能用了

### 3.1 老 SSR 的两个瓶颈

传统 SSR 的流程是四步串行：服务端取全部数据，渲染出完整 HTML，客户端加载全部 JS，然后一次性 hydrate。任何一步慢，整页都得等。

一个评论区接口慢 800ms，整个页面的 HTML 就晚 800ms 才发出去，哪怕文章正文早就准备好了。

React 18 的解法是让 `Suspense` 在服务端也起作用，把页面切成几块，好了一块发一块：

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

服务端先把不含 `Comments` 的 HTML 发出去，`Comments` 的位置先占一个 Spinner。等数据好了，React 通过同一条流把这块 HTML 补发过来，再用一小段内联脚本把它替换到正确位置。选择性 hydration 也是配套的能力，哪块的 JS 先到就先 hydrate 哪块，用户点了谁就优先 hydrate 谁。

### 3.2 服务端 API 换了

`renderToString` 是同步的，撑不起流式，所以 React 18 给了两套新 API。Node 环境用 `renderToPipeableStream`：

```jsx
import { renderToPipeableStream } from 'react-dom/server';

function handleRequest(req, res) {
  const stream = renderToPipeableStream(<App />, {
    bootstrapScripts: ['/main.js'],
    onShellReady() {
      // 外壳渲染完成，可以开始往响应里灌数据
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      stream.pipe(res);
    },
    onShellError(err) {
      res.statusCode = 500;
      res.send('<h1>Something went wrong</h1>');
    },
  });
}
```

Edge / Cloudflare Workers 这类 Web Streams 环境用 `renderToReadableStream`：

```jsx
import { renderToReadableStream } from 'react-dom/server';

const stream = await renderToReadableStream(<App />, {
  bootstrapScripts: ['/main.js'],
});
```

`onShellReady` 和 `onAllReady` 的选择是个容易搞错的点。`onShellReady` 表示最外层那圈非 Suspense 的内容渲染完了，这时候开始 pipe，用户最快看到首屏，代价是搜索引擎爬到的初始 HTML 里 Suspense 内容还是 fallback；`onAllReady` 会等所有 Suspense 边界都 resolve，适合爬虫和静态生成。真实项目里常见做法是判断 User-Agent，爬虫走 `onAllReady`，普通用户走 `onShellReady`。

顺便提一句，如果你用的是 Next.js App Router，上面这些 API 已经被框架包掉了，你只要写 `Suspense` 就行。相关的取数与流式实践我在 [Next.js 15 如何让 React 应用更快](https://feinterview.poetries.top/blog/nextjs-15-performance-react-apps) 里写过。

### 3.3 Suspense 和过渡更新配合的那个细节

`Suspense` 遇上过渡更新时有个专门的行为：如果这次更新被 `startTransition` 包着，中途组件 suspend 了，React 不会把已经在屏幕上的内容换成 fallback，而是继续显示旧内容直到新内容准备好。

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

这条规则解决的是「切个筛选条件，整块列表闪一下白」的体验问题。`startTransition` 和 `useDeferredValue` 具体是怎么被调度的，我在 [React 18 并发机制深度解析](https://feinterview.poetries.top/blog/react-18-concurrency) 里从 Lane 一路讲到了让出主线程，这里就不铺开了。

## 四、三个新 Hook，两个不是给你用的

### 4.1 useId

`useId` 生成的 ID 在服务端和客户端保证一致，专门用来解决表单元素 `htmlFor` / `aria-describedby` 这类关联属性的 hydration 不匹配：

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

在此之前大家的做法是 `Math.random()` 或者一个自增计数器，两者在 SSR 下都会导致服务端和客户端生成的 ID 对不上。

有个坑要注意。React 18 生成的 ID 形如 `:r0:`，里面带冒号，这个字符在 CSS 选择器里是有特殊含义的，直接 `document.querySelector('#' + id)` 会报语法错误，要用 `CSS.escape` 或者 `[id="..."]` 属性选择器。而且这个格式在 React 19 里还改过一次，所以别把它当稳定契约，更别拿它当业务主键。它就是给 DOM 属性关联用的，仅此而已。

另外别用它给列表项当 key，`useId` 是按组件实例生成的，跟数据没关系。

### 4.2 useSyncExternalStore

这个 Hook 是给状态管理库作者用的，普通业务代码基本不会直接写：

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

它存在的原因和并发渲染直接相关。渲染可以被中断，那么一棵树的上半部分和下半部分就可能读到外部数据的两个不同版本，同一屏里出现不一致的值，这个问题叫撕裂（tearing）。`useSyncExternalStore` 通过在渲染前后校验快照、必要时同步重渲来堵住这个口子。

Redux、Zustand、MobX、Jotai 这些库都已经切到它上面了，所以你升级 React 18 时要顺手把状态库也升到支持的版本，否则并发特性一开可能出怪问题。这几个库的取舍我在 [React 状态管理方案对比](https://feinterview.poetries.top/blog/react-state-management-comparison) 里单独写过。

真要自己写全局状态的话，也应该走这个 Hook，而不是用 `useEffect` 加手动订阅那套老写法。

### 4.3 useInsertionEffect

同样是库作者向的，服务对象是 CSS-in-JS：

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

它的触发时机早于 `useLayoutEffect`。为什么需要这么早？因为 `useLayoutEffect` 里经常要读取元素尺寸，如果样式是在 `useLayoutEffect` 阶段才插进去的，读到的布局就是没应用样式的布局，会引发额外的重排。把插样式提前到 `useInsertionEffect`，读布局的代码就能拿到正确结果。

代价是这个阶段限制很多，拿不到 ref，也不能在里面更新 state。业务代码基本没有理由用它。

## 五、严格模式的二次挂载

### 5.1 它到底做了什么

React 18 的 `StrictMode` 在开发环境下会给每个组件加一轮模拟的卸载重挂：

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

同时组件函数本身也会被调用两次，而且 React 18 不再像以前那样把第二次的 `console.log` 静默掉，所以你会看到日志明显变多。

只在开发环境，生产构建不会有这个行为。

### 5.2 它炸出来的都是真问题

升级后最常见的抱怨是「接口请求发了两次」。写法通常长这样：

```jsx
useEffect(() => {
  fetchData().then(setData);
}, []);
```

没有清理函数，组件卸载或者依赖变化时那个 Promise 还在飞，回来照样 setState。严格模式把这个隐患直接演示给你看了。正确写法是带上中止逻辑：

```jsx
useEffect(() => {
  const controller = new AbortController();
  fetchData({ signal: controller.signal })
    .then(setData)
    .catch(err => {
      if (err.name !== 'AbortError') throw err;
    });
  return () => controller.abort();
}, []);
```

同类问题还有一批：只订阅不退订的事件监听、只 `setInterval` 不 `clearInterval`、在 effect 里做一次性初始化（比如埋点上报、地图实例创建）而没有幂等保护。这些在生产里迟早会以内存泄漏或者重复上报的形式冒出来，只是平时不容易复现。

所以我的建议是别去关 `StrictMode`。关掉只是把问题藏回去，而且 React 官方明确说过，未来的可复用状态特性会依赖组件对多次挂载卸载的健壮性。

### 5.3 一个例外

有些第三方库确实对二次挂载不友好，尤其是一些老的图表库、编辑器封装。碰到这种情况，可以只把那个子树从 `StrictMode` 里摘出来，而不是全局关掉。`StrictMode` 是可以嵌套使用、按子树生效的。

说实话我也没完全跑通所有第三方库的兼容情况，遇到实在改不动的，局部摘出来加个注释说明原因，比全局一关了事要好。

## 六、升级 checklist

### 6.1 装包

```bash
npm install react@18 react-dom@18

# 如果使用TypeScript
npm install @types/react@18 @types/react-dom@18
```

TypeScript 项目这里有个大坑。`@types/react@18` 把 `React.FC` 隐式包含的 `children` 拿掉了，所有靠 `const Foo: React.FC = ({ children }) => ...` 写法的组件都会红。修法是显式声明：

```tsx
// 之前（@types/react 17 隐式带 children）
const Card: React.FC = ({ children }) => <div>{children}</div>;

// 之后
const Card = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
```

项目里组件多的话，这一步的改动量可能比 React 本身还大，做升级排期时要算进去。

### 6.2 改入口

```jsx
// 之前
import { render } from 'react-dom';
render(<App />, document.getElementById('root'));

// 之后
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

注水入口同理换成 `hydrateRoot`，参数顺序别写反。

### 6.3 配测试环境

```jsx
// 在测试文件开头添加
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
```

不加这行，`react-dom/test-utils` 的 `act` 会在 React 18 下报警告。用 `@testing-library/react` 13 及以上版本的话它已经帮你设好了，自己搭的测试环境要手动加。

### 6.4 废弃 API 对照

| 废弃API | 替代方案 |
|---------|----------|
| `ReactDOM.render` | `createRoot` |
| `ReactDOM.hydrate` | `hydrateRoot` |
| `ReactDOM.unmountComponentAtNode` | `root.unmount()` |
| `renderToNodeStream` | `renderToPipeableStream` |

### 6.5 其余行为变更

这几条不会报错，但会悄悄改变运行结果，升级后值得逐条对一遍。

离散事件（点击、按键这类）触发的 effect 现在会同步执行，之前有些代码依赖它异步执行的时序，可能会出现顺序错乱。

hydration 不匹配从警告升级成了错误，React 会丢掉这棵子树的服务端 HTML 在客户端重新渲染一遍。之前一直在报警告但没人管的项目，升级后会看到首屏闪烁，得老老实实修数据一致性问题，常见元凶是 `Date.now()`、`Math.random()`、`localStorage` 直接参与首屏渲染。

组件返回 `undefined` 不再警告了，和返回 `null` 等价。方便是方便，但忘写 `return` 的低级错误也不会被 React 提醒了，建议靠 ESLint 规则兜住。

对已卸载组件调用 setState 的那条内存泄漏警告被移除了。React 团队的判断是这条警告误报太多，反而促使大家写出更复杂的取消逻辑。注意警告没了不等于问题没了，该清理的订阅还是要清理。

严格模式下两次渲染的 `console.log` 都会输出，不再被抑制。

## 七、2026 年这个时间点怎么选

写这篇的时候 React 19 已经发布一段时间了。如果你现在才准备动手，我的看法是这样。

存量项目从 17 起步的话，还是建议先落到 18 稳一版。18 的行为变更集中在本文这几条，范围可控，跑通之后再往 19 走，中间的坑是分层暴露的，好排查。一次跨两个大版本，出问题你很难分清是哪一层引入的。

如果是新项目，直接上 19 没什么理由不这么做，`use` Hook、Actions、`ref` 作为普通 prop、以及去掉 `forwardRef` 这些改进用起来是真的舒服。React 19 具体带来了什么，我单独写过一篇 [React 19 新特性](https://feinterview.poetries.top/blog/react-19-new-features)。

不是说 18 不行，而是它现在的定位更像一个稳定的中转站。这篇里讲的每一条行为差异，在 19 上依然成立，因为 19 没有把它们改回去。

## 总结

React 18 面向使用者这一层，真正需要你动手的其实就三件事。

第一件是入口迁移。`createRoot` 不是换个写法那么简单，它是所有新行为的总开关，不换等于没升级，自动批处理和并发 API 全都不生效。

第二件是行为差异排查。自动批处理会打破「setState 之后立刻读 DOM」的代码，靠 `flushSync` 局部兜底；hydration 不匹配从警告变成错误，逼你把首屏的随机值和客户端专属数据清理干净；离散事件的 effect 时序也变了。

第三件是把严格模式二次挂载炸出来的问题修掉。请求不取消、订阅不退订、初始化不幂等，这些本来就是 bug，只是以前不容易复现。关掉 `StrictMode` 是最省事也最亏的做法。

至于 `useId`、`useSyncExternalStore`、`useInsertionEffect` 这三个新 Hook，只有 `useId` 是给业务代码用的，另外两个知道它们为什么存在就够了，真正用到的场景是写库。而 `Suspense` 流式 SSR 和并发 API 属于主动开启的能力，升级完先别急着用，等基础行为稳定了再一个个引入。

## 参考

- [React v18.0 发布公告](https://react.dev/blog/2022/03/29/react-v18)
- [React 18 升级指南](https://react.dev/blog/2022/03/08/react-18-upgrade-guide)
- [Automatic batching for fewer renders in React 18](https://github.com/reactwg/react-18/discussions/21)
- [New Suspense SSR Architecture in React 18](https://github.com/reactwg/react-18/discussions/37)
- [createRoot - React 官方文档](https://react.dev/reference/react-dom/client/createRoot)
- [useId - React 官方文档](https://react.dev/reference/react/useId)
- [renderToPipeableStream - React 官方文档](https://react.dev/reference/react-dom/server/renderToPipeableStream)
- [StrictMode - React 官方文档](https://react.dev/reference/react/StrictMode)
- [前端进阶之旅](https://interview.poetries.top)
