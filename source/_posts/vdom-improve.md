---
title: 虚拟DOM（二）diff算法与patch的实现细节
description: 从浏览器渲染流水线讲起，手写一个 Element 虚拟节点，把 diff 的 REPLACE、PROPS、TEXT、REORDER 四种变化类型和 patch 的深度遍历应用过程完整拆开。
date: 2018-10-20 23:10:14
tags: 
   - JavaScript
   - 虚拟DOM
   - diff算法
categories: Front-End
---

上一篇把虚拟 DOM 是什么、核心 API 有哪两个讲完了，但最关键的那块还没动：新旧两棵树到底怎么比，比出来的结果长什么样，又是怎么落到真实 DOM 上的。这篇就补这一块。会先从浏览器加载一个 HTML 要跑哪几步说起，说清楚「操作 DOM 贵」到底贵在哪一步，然后手写一个最小的 `Element` 实现，把 diff 的四种变化类型逐个拆开，最后把补丁应用回真实 DOM。看完你能自己解释「为什么 React 一定要你写 key」。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 浏览器渲染一个页面要跑哪五步，DOM 操作的代价具体产生在哪
- 手写一个 `Element` 构造函数，虚拟节点上除了标签属性子节点还要存什么
- `render()` 怎么把虚拟节点映射成真实 DOM
- 树 diff 的复杂度为什么必须从 `O(n^3)` 降到 `O(n)`
- REPLACE、PROPS、TEXT、REORDER 这四种变化各自怎么处理
- 没有 key 的时候插入一个节点会退化成什么样
- diff 的产物长什么样，怎么用深度遍历把它应用到 DOM 上

## 一、为什么需要虚拟DOM

先介绍浏览器加载一个 `HTML` 文件需要做哪些事，帮助我们理解为什么我们需要虚拟 `DOM`。所有浏览器的引擎工作流程都差不多，以 webkit 引擎为例，大致分 5 步：创建 `DOM tree` 、创建 `Style Rules` 、构建 `Render tree` 、布局 `Layout` 、绘制 `Painting`。

- 第一步，用 `HTML` 分析器，分析 `HTML` 元素，构建一颗 `DOM` 树。
- 第二步：用 `CSS` 分析器，分析 `CSS` 文件和元素上的 `inline` 样式，生成页面的样式表。
- 第三步：将上面的 `DOM` 树和样式表，关联起来，构建一颗 `Render` 树。这一过程又称为 `Attachment`。每个 `DOM` 节点都有 `attach` 方法，接受样式信息，返回一个 `render` 对象（又名 `renderer`）。这些 `render` 对象最终会被构建成一颗 `Render` 树。
- 第四步：有了 `Render` 树后，浏览器开始布局，会为每个 `Render` 树上的节点确定一个在显示屏上出现的精确坐标值。
- 第五步：`Render` 树有了，节点显示的位置坐标也有了，最后就是调用每个节点的 `paint` 方法，让它们显示出来。

真正吃性能的是第四步和第五步。前三步在页面首次加载时跑一遍就够了，但布局和绘制会被反复触发，你每改一次几何属性，这一段就得重来。

当你用传统的原生 `api` 或 `jQuery` 去操作 `DOM` 时，浏览器会从构建 `DOM` 树开始从头到尾执行一遍流程。比如当你在一次操作时，需要更新 `10` 个 `DOM` 节点，理想状态是一次性构建完 `DOM` 树，再执行后续操作。但浏览器没这么智能，收到第一个更新 `DOM` 请求后，并不知道后续还有 9 次更新操作，因此会马上执行流程，最终执行 10 次流程。显然例如计算 `DOM` 节点的坐标值等都是白白浪费性能，可能这次计算完，紧接着的下一个 `DOM` 更新请求，这个节点的坐标值就变了，前面的一次计算是无用功。

这里得补一句现在的情况。现代浏览器其实做了写操作合并，多次样式修改会被攒进一个队列，等到帧末尾统一刷新，并不是真的老老实实跑十遍。但只要你在两次写之间读了一个布局属性，比如 `offsetHeight`、`getBoundingClientRect`，浏览器为了给你一个准确的值就必须立刻把队列刷掉，重新算布局。这个叫强制同步布局，也就是俗称的布局抖动。所以「10 次更新触发 10 次流程」这个说法在极端的读写交替代码里是成立的，只是触发条件比原文写的更具体一点。

即使计算机硬件一直在更新迭代，操作 `DOM` 的代价仍旧是昂贵的，频繁操作还是会出现页面卡顿，影响用户的体验。真实的 `DOM` 节点，哪怕一个最简单的 div 也包含着很多属性，可以打印出来直观感受一下：

![打印一个 div 元素的全部属性，可以看到真实 DOM 节点上挂了数百个字段](https://s.poetries.top/gitee/2019/10/606.png)

这张图值得多看两眼。上面那一大坨里绝大多数字段你一辈子都用不到，但它们确实挂在每个节点上。你要在这样的对象上做新旧对比，光是决定「比哪些字段」就无从下手。而一个虚拟节点只有三四个字段，比起来毫无压力。

虚拟 `DOM` 就是为了解决这个浏览器性能问题而被设计出来的。例如前面的例子，假如一次操作中有 `10` 次更新 `DOM` 的动作，虚拟 `DOM` 不会立即操作 `DOM`，而是将这 `10` 次更新的 `diff` 内容保存到本地的一个 js 对象中，最终将这个 js 对象一次性 `attach` 到 `DOM` 树上，通知浏览器去执行绘制工作，这样可以避免大量的无谓的计算量。

## 二、实现虚拟DOM

光看定义没感觉，动手写一个最小的实现最快。假设我们要描述的真实结构是这样：

```html
<div id="real-container">
    <p>Real DOM</p>
    <div>cannot update</div>
    <ul>
        <li class="item">Item 1</li>
        <li class="item">Item 2</li>
        <li class="item">Item 3</li>
    </ul>
</div>
```

用 `js` 对象来模拟 `DOM` 节点如下。三层嵌套，和上面那段 HTML 一一对应：

```javascript
const tree = Element('div', { id: 'virtual-container' }, [
    Element('p', {}, ['Virtual DOM']),
    Element('div', {}, ['before update']),
    Element('ul', {}, [
        Element('li', { class: 'item' }, ['Item 1']),
        Element('li', { class: 'item' }, ['Item 2']),
        Element('li', { class: 'item' }, ['Item 3']),
    ]),
]);

const root = tree.render();
document.getElementById('virtualDom').appendChild(root);
```

用 `js` 对象模拟 `DOM` 节点的好处是，页面的更新可以先全部反映在 `js` 对象上，操作内存中的 `js` 对象的速度显然要快多了。等更新完后，再将最终的 `js` 对象映射成真实的 `DOM`，交由浏览器去绘制。

`Element` 本身很朴素，就是一个把参数挂到 `this` 上的构造函数：

```javascript
function Element(tagName, props, children) {
    if (!(this instanceof Element)) {
        return new Element(tagName, props, children);
    }

    this.tagName = tagName;
    this.props = props || {};
    this.children = children || [];
    this.key = props ? props.key : undefined;

    let count = 0;
    this.children.forEach((child) => {
        if (child instanceof Element) {
            count += child.count;
        }
        count++;
    });
    this.count = count;
}
```

第一个参数是节点名（如 `div`），第二个参数是节点的属性（如 `class`），第三个参数是子节点（如 `ul` 的 `li`）。除了这三个参数会被保存在对象上外，还保存了 `key` 和 `count`。

开头那个 `if (!(this instanceof Element))` 是个小技巧，让你不写 `new` 也能调用，所以上面才能直接写 `Element('div', ...)`。`key` 后面 diff 列表时要用，先存着。`count` 记的是这棵子树一共有多少个节点，它的用处在应用补丁那一步，深度遍历时需要知道每个节点对应的全局序号，有了 `count` 就能直接跳过整棵子树。

![虚拟节点对象的结构，tagName、props、children 之外还保存了 key 和 count](https://s.poetries.top/gitee/2019/10/607.png)

对着这张图理解 `count` 的累加逻辑：子节点如果本身也是 `Element`，先把它的 `count` 加进来，再给它自己算一个，所以最终数出来的是整棵子树的节点总数，不是直接子节点的个数。

有了 `js` 对象后，最终还需要将其映射成真实的 `DOM`：

```javascript
Element.prototype.render = function() {
    const el = document.createElement(this.tagName);
    const props = this.props;

    for (const propName in props) {
        setAttr(el, propName, props[propName]);
    }

    this.children.forEach((child) => {
        const childEl = (child instanceof Element) ? child.render() : document.createTextNode(child);
        el.appendChild(childEl);
    });

    return el;
};
```

根据 `DOM` 名调用原生的 `createElement` 创建真实 `DOM`，将 `DOM` 的属性全都加到这个 `DOM` 元素上，如果有子元素继续递归调用创建子元素，并 `appendChild` 挂到该 `DOM` 元素上。这样就完成了从创建虚拟 `DOM` 到将其映射成真实 `DOM` 的全部工作。

这里有个细节容易忽略：整个递归过程中，`el` 一直是游离的，没有挂进文档。只有最外层那个 `root` 被 `appendChild` 到页面上时，浏览器才会触发一次布局和绘制。这就是前面说的「攒起来一次性提交」，在这个几十行的实现里已经体现出来了。

## 三、Diff算法

我们已经完成了创建虚拟 `DOM` 并将其映射成真实 `DOM` 的工作，这样所有的更新都可以先反映到虚拟 `DOM` 上。怎么反映呢？需要明确一下 `Diff` 算法。

- 两棵树如果完全比较时间复杂度是 `O(n^3)`
- `React` 的 `Diff` 算法的时间复杂度是 `O(n)`。要实现这么低的时间复杂度，意味着只能平层地比较两棵树的节点，放弃了深度遍历
- 这样做，似乎牺牲了一定的精确性来换取速度，但考虑到现实中前端页面通常也不会跨层级移动 `DOM` 元素，所以这样做是最优的。

这笔账值得算一下。`O(n^3)` 里的三次方来自哪里？通用树 diff 要在两棵树之间求最小编辑距离，需要拿第一棵树的每个节点去和第二棵树的每个节点比，还要考虑各种插入删除的组合。一千个节点就是十亿量级的操作，浏览器主线程直接卡死。

放弃跨层匹配之后就简单了，同一层的节点按顺序对一遍，然后各自往下递归。每个节点只被访问一次，复杂度落到 `O(n)`。

我们新创建一棵树，用于和之前的树进行比较：

```javascript
const newTree = Element('div', { id: 'virtual-container' }, [
    Element('h3', {}, ['Virtual DOM']),                     // REPLACE
    Element('div', {}, ['after update']),                   // TEXT
    Element('ul', { class: 'marginLeft10' }, [              // PROPS
        Element('li', { class: 'item' }, ['Item 1']),
        // Element('li', { class: 'item' }, ['Item 2']),    // REORDER remove
        Element('li', { class: 'item' }, ['Item 3']),
    ]),
]);
```

这棵新树是刻意构造的，四种变化各安排了一处，注释里已经标好了对应类型。只考虑平层地 `Diff` 的话，就简单多了，只需要考虑以下 4 种情况。

### 3.1 REPLACE，节点类型变了

第一种是最简单的，节点类型变了，例如下图中的 `P` 变成了 `h3`。我们将这个过程称之为 `REPLACE`。直接将旧节点卸载（`componentWillUnmount`）并装载新节点（`componentWillMount`）就行了。

![节点类型从 p 变成 h3，整棵子树被卸载后重新装载](https://s.poetries.top/gitee/2019/10/608.png)

旧节点包括下面的子节点都将被卸载，如果新节点和旧节点仅仅是类型不同，但下面的所有子节点都一样时，这样做显得效率不高。但为了避免 `O(n^3)` 的时间复杂度，这样做是值得的。这也提醒了 `React` 开发者，应该避免无谓的节点类型的变化，例如运行时将 `div` 变成 `p` 就没什么太大意义。

这条约束在写业务代码时是有实际影响的。条件渲染里如果两个分支的根节点标签不一样，切换的时候整棵子树都会重建，里面组件的 state 全部丢失，正在播放的视频会重新加载。碰到这种情况通常的做法是把两个分支的外层标签统一，只让内部内容变。

### 3.2 PROPS，属性变了

第二种也比较简单，节点类型一样，仅仅属性或属性值变了：

```
renderA: <ul>
renderB: <ul class: 'marginLeft10'>
=> [addAttribute class "marginLeft10"]
```

我们将这个过程称之为 `PROPS`。此时不会触发节点的卸载（`componentWillUnmount`）和装载（`componentWillMount`）动作。而是执行节点更新（`shouldComponentUpdate` 到 `componentDidUpdate` 的一系列方法）。

对比属性的代码是纯粹的两轮遍历，一轮找改掉的，一轮找新增的：

```javascript
function diffProps(oldNode, newNode) {
    const oldProps = oldNode.props;
    const newProps = newNode.props;

    let key;
    const propsPatches = {};
    let isSame = true;

    // find out different props
    for (key in oldProps) {
        if (newProps[key] !== oldProps[key]) {
            isSame = false;
            propsPatches[key] = newProps[key];
        }
    }

    // find out new props
    for (key in newProps) {
        if (!oldProps.hasOwnProperty(key)) {
            isSame = false;
            propsPatches[key] = newProps[key];
        }
    }

    return isSame ? null : propsPatches;
}
```

第一轮遍历旧属性，值不一样就记下新值，属性被删掉的情况下 `newProps[key]` 是 `undefined`，记的也是 `undefined`，后面应用补丁时会当成移除处理。第二轮遍历新属性，专门捞旧对象里压根没有的那些 key。两轮跑完 `isSame` 还是 `true`，就返回 `null`，上层看到 `null` 就知道这个节点的属性完全没变，一条 DOM 操作都不用发。

这里的比较是 `!==`，也就是引用比较。所以你如果每次渲染都传一个新的对象字面量或者新的箭头函数当属性，哪怕内容完全一样，diff 也会判定为「变了」。React 里那些 `useCallback`、`useMemo` 要解决的就是这一层。

### 3.3 TEXT 和 REORDER

第三种是文本变了，文本对也是一个 `Text Node`，也比较简单，直接修改文字内容就行了，我们将这个过程称之为 `TEXT`。

第四种是移动，增加，删除子节点，我们将这个过程称之为 `REORDER`。这一种是四种里最麻烦的。

![子节点发生移动、增加、删除时的 REORDER 处理](https://s.poetries.top/gitee/2019/10/609.png)

在中间插入一个节点，程序员写代码很简单：`$(B).after(F)`。但如何高效地插入呢？简单粗暴的做法是：卸载 C，装载 F，卸载 D，装载 C，卸载 E，装载 D，装载 E。如下图：

![没有 key 时在中间插入节点，后续所有节点被逐个卸载再装载](https://s.poetries.top/gitee/2019/10/610.png)

盯着这张图想一下代价。插入位置之后的每一个节点都被拆了重建一遍，插入点越靠前，浪费越大。往一个一千行的表格头部插一行，等于把一千行全部重建。而实际上真正需要的 DOM 操作只有一个 `insertBefore`。

问题出在哪？出在 diff 只能按位置对齐。它看到旧的第三个位置是 C、新的第三个位置是 F，只能判定「这个位置的节点变了」，它没法知道 C 其实只是往后挪了一格。

我们写 `JSX` 代码时，如果没有给数组或枚举类型定义一个 `key`，就会看到下面这样的 `warning`。`React` 提醒我们，没有 `key` 的话，涉及到移动，增加，删除子节点的操作时，就会用上面那种简单粗暴的做法来更新。虽然程序运行不会有错，但效率太低，因此 `React` 会给我们一个 `warning`：

![React 在数组元素缺少 key 时给出的控制台 warning](https://s.poetries.top/gitee/2019/10/611.png)

如果我们在 `JSX` 里为数组或枚举型元素增加上 `key` 后，`React` 就能根据 `key`，直接找到具体的位置进行操作，效率比较高。如下图：

![有 key 时通过 key 定位节点，只做必要的插入和移动](https://s.poetries.top/gitee/2019/10/612.png)

key 给节点提供的是身份，不是位置。有了身份，diff 才能在旧列表里找到「同一个」节点，进而判断出它只是移动了。

顺着这个逻辑就能推出那条老生常谈的建议：别拿数组下标当 key。下标是位置，不是身份。往头部插一条数据，所有元素的下标全变了，key 跟着变，diff 判定为每一项都不是同一个节点，效果和不写 key 一样糟。真要写就写数据本身的稳定 id。

常见的最小编辑距离问题，可以用 `Levenshtein Distance` 算法来实现，时间复杂度是 `O(M*N)`，但通常我们只要一些简单的移动就能满足需要，降低点精确性，将时间复杂度降低到 `O(max(M, N))` 即可。

最终 `Diff` 出来的结果如下：

```javascript
{
    1: [ {type: REPLACE, node: Element} ],
    4: [ {type: TEXT, content: "after update"} ],
    5: [ {type: PROPS, props: {class: "marginLeft10"}}, {type: REORDER, moves: [{index: 2, type: 0}]} ],
    6: [ {type: REORDER, moves: [{index: 2, type: 0}]} ],
    8: [ {type: REORDER, moves: [{index: 2, type: 0}]} ],
    9: [ {type: TEXT, content: "Item 3"} ],
}
```

这个结构就是所谓的补丁包。key 是节点在深度遍历顺序里的序号，value 是这个节点身上要做的操作列表。一个节点可能同时有多种变化，比如序号 5 那个 `ul`，既改了 class 又删了一个子节点，所以数组里有两项。

到这一步为止，一次真实的 DOM 操作都还没发生。

## 四、映射成真实DOM

虚拟 `DOM` 有了，`Diff` 也有了，现在就可以将 `Diff` 应用到真实 `DOM` 上了。

深度遍历 DOM 将 Diff 的内容更新进去：

```javascript
function dfsWalk(node, walker, patches) {
    const currentPatches = patches[walker.index];

    const len = node.childNodes ? node.childNodes.length : 0;
    for (let i = 0; i < len; i++) {
        walker.index++;
        dfsWalk(node.childNodes[i], walker, patches);
    }

    if (currentPatches) {
        applyPatches(node, currentPatches);
    }
}
```

`walker.index` 是关键。它是一个共享的计数器，跟着深度优先的访问顺序自增，正好和上面补丁包里的 key 对得上。所以 diff 和 apply 这两趟遍历必须用完全一致的顺序，否则序号会错位，补丁会打到别的节点上。前面 `Element` 里存的那个 `count`，作用就是在真正的实现里能按子树规模批量跳过序号。

还有一个顺序上的讲究：这个函数是先递归子节点，最后才处理自己。这样写是为了避免自己被 REPLACE 掉之后，子节点的引用失效。

具体更新的代码如下，其实就是根据 `Diff` 信息调用原生 `API` 操作 `DOM`：

```javascript
function applyPatches(node, currentPatches) {
    currentPatches.forEach((currentPatch) => {
        switch (currentPatch.type) {
            case REPLACE: {
                const newNode = (typeof currentPatch.node === 'string')
                    ? document.createTextNode(currentPatch.node)
                    : currentPatch.node.render();
                node.parentNode.replaceChild(newNode, node);
                break;
            }
            case REORDER:
                reorderChildren(node, currentPatch.moves);
                break;
            case PROPS:
                setProps(node, currentPatch.props);
                break;
            case TEXT:
                if (node.textContent) {
                    node.textContent = currentPatch.content;
                } else {
                    // ie
                    node.nodeValue = currentPatch.content;
                }
                break;
            default:
                throw new Error(`Unknown patch type ${currentPatch.type}`);
        }
    });
}
```

四个 case 各对应前面讲的一种变化类型，一一对上。`REPLACE` 里那个 `typeof === 'string'` 的判断是在区分文本节点和元素节点，字符串直接造 `createTextNode`，`Element` 实例就调它自己的 `render()`。

`TEXT` 那个分支里的 `node.nodeValue` 是给老 IE 兜底的，注释也写了。这个写法现在可以直接删掉了，`textContent` 从 IE 9 开始就支持。不过这里有个坑要注意，`if (node.textContent)` 这个判断条件写得不严谨，如果节点当前的文本恰好是空字符串，条件会为假，代码会走进 IE 分支去改 `nodeValue`。更稳的写法是判断 `'textContent' in node`。这个我在自己的 demo 上验证过，空文本节点确实会走错分支。

虚拟 `DOM` 的目的是将所有操作累加起来，统计计算出所有的变化后，统一更新一次 `DOM`。

## 五、这篇写于 2018 年，后来的变化

上面这套是 React 15 时代的经典模型，思路到今天依然是理解 diff 的基础，但几个主流框架都往前走了。

React 16 引入 Fiber 之后，最大的改变是把「一口气递归比完」换成了可中断的链表遍历。原来的 `dfsWalk` 是纯递归，一旦开始就必须跑完，长列表更新时主线程会被占住，用户输入卡在那里没反应。Fiber 把每个节点变成链表上的一个工作单元，每处理完一个就看一眼还有没有剩余时间，没时间就把控制权交回浏览器，下一帧接着做。所以现在 React 里的 diff 是可以被高优先级更新打断并重来的。这块我在 [React Fiber](https://feinterview.poetries.top/blog/react-fiber) 那篇里展开写过。

Vue 3 走的是另一个方向。它在编译期就分析出模板里哪些是静态节点、动态节点动态在哪个属性上，把这些信息作为标记编进渲染函数，运行时可以整块跳过静态内容。带 key 的列表 diff 换成了「先双端预处理掉头尾相同的部分，中间乱序段求最长递增子序列」的做法，能待在原地不动的节点最多，DOM 移动次数最少。

再往外还有 Svelte 和 Solid 这一派，主张压根不需要虚拟 DOM。它们在编译期就把「哪个变量改了要更新哪个 DOM 节点」算清楚，运行时直接精确更新，中间不造树也不比较。这条路省掉了虚拟树的内存和 diff 的计算，代价是灵活度降低，动态性很强的场景不好处理。

不是说虚拟 DOM 不行了，而是它多出来的那层开销，在某些场景下确实可以省掉。我自己的感受是，这几种方案改的都是「怎么比更省」，没改「为什么要比」，所以上面那套四种变化类型的模型依然值得先吃透。

## 总结

这一篇拆下来的结论：

- 浏览器渲染分五步，反复被触发的是布局和绘制，DOM 操作的代价主要产生在这两步
- 读布局属性会强制刷新样式队列，读写交替是造成布局抖动的直接原因
- 一个虚拟节点除了 `tagName`、`props`、`children`，还要存 `key` 和 `count`，前者给 diff 提供身份，后者给深度遍历提供序号
- `render()` 递归创建的过程中 DOM 一直是游离的，只有最后挂载那一下才触发布局和绘制
- 通用树 diff 是 `O(n^3)`，放弃跨层匹配才降到 `O(n)`，代价是跨层移动会被当成删除加新建
- 平层 diff 只有四种变化：REPLACE 换类型、PROPS 改属性、TEXT 改文本、REORDER 增删移
- REPLACE 会整棵子树重建，条件渲染时尽量别让两个分支的根标签不一样
- 没有 key 的时候中间插入一个节点，后面所有节点都会被拆了重建，key 提供的是身份而不是位置
- diff 的产物是一个以遍历序号为 key 的补丁包，`dfsWalk` 和 diff 必须用完全一致的遍历顺序

前一篇讲的是虚拟 DOM 是什么和 snabbdom 的核心 API，没看的可以回去补 [虚拟DOM（一）](https://feinterview.poetries.top/blog/vdom-base)。想看一份真实库的源码级拆解，[虚拟DOM原理分析 Snabbdom源码与diff算法拆解](https://feinterview.poetries.top/blog/virtual-dom-analysis) 那篇把 snabbdom 的 `updateChildren` 双端比较逐行走了一遍，和这篇的 REORDER 正好对照着看。

## 参考

- [React 官方文档 - Reconciliation](https://legacy.reactjs.org/docs/reconciliation.html)
- [React 官方文档 - Lists and Keys](https://legacy.reactjs.org/docs/lists-and-keys.html)
- [Vue 3 官方文档 - 渲染机制](https://cn.vuejs.org/guide/extras/rendering-mechanism.html)
- [MDN - Node.textContent](https://developer.mozilla.org/zh-CN/docs/Web/API/Node/textContent)
- [MDN - Node.replaceChild](https://developer.mozilla.org/zh-CN/docs/Web/API/Node/replaceChild)
- [web.dev - Avoid large, complex layouts and layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)
- [Snabbdom - GitHub](https://github.com/snabbdom/snabbdom)
- [前端进阶之旅](https://interview.poetries.top)
