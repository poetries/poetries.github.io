---
title: React 组件通信方式全解与选型取舍
date: 2018-07-29 23:20:24
description: 把 React 里父传子、子传父、跨级、无嵌套关系四类组件通信场景的写法讲透，附上 props、context、事件总线、状态库各自的适用边界和踩坑点。
tags:
 - 组件通信
 - react
 - context
 - 前端进阶
categories: Front-End
---

一个中后台页面写到第三个迭代，组件树已经有五六层深。这时候产品说，筛选栏改了条件之后，右上角的导出按钮要跟着变成禁用。筛选栏和导出按钮离得很远，中间隔了四层布局组件。这个 prop 该怎么传？

React 的数据流规则本身很简单，就一句「单向、自上而下」，但真到了工程里，组件之间的位置关系千变万化，能用的手段也不止 props 一种。这篇把四类通信场景的写法都过一遍，重点不在于代码怎么写，而在于什么情况下该选哪一种，以及选错了会付出什么代价。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 父传子、子传父、跨级、无嵌套关系四类场景各自的标准解法
- 回调函数传参时 `bind` 和箭头函数的取舍
- 跨级通信为什么官方长期不推荐 context
- 事件总线的写法，以及它为什么容易把项目搞乱
- 四种方式的横向对比和选型判断
- Hooks 时代这几种写法各自变成了什么样

![React 组件通信的四类场景示意图](https://s.poetries.top/gitee/2019/10/413.png)

组件之间进行通信的几种情况：

- 父组件向子组件通信
- 子组件向父组件通信
- 跨级组件通信
- 没有嵌套关系组件之间的通信

## 一、父组件向子组件通信

React 数据流动是单向的，父组件向子组件通信也是最常见的。父组件通过 `props` 向子组件传递需要的信息。

```javascript
// Child.jsx
import React from 'react';
import PropTypes from 'prop-types';

export default function Child({ name }) {
    return <h1>Hello, {name}</h1>;
}

Child.propTypes = {
    name: PropTypes.string.isRequired,
}


// Parent.jsx
import React, { Component } from 'react';

import Child from './Child';

class Parent extends Component {
    render() {
        return (
            <div>
                <Child name="Sara" />
            </div>
        );
    }
}

export default Parent;
```

这段代码没什么可解释的，但有两个点值得多说。

一是 `propTypes` 加 `isRequired` 这个习惯。它在开发环境下会做运行时校验，父组件忘了传 `name` 会直接在控制台报警告。2018 年这是标配，今天更常见的做法是用 TypeScript 在编译期就把类型卡死，效果更好也更早。顺带一提，React 19 已经移除了对函数组件 `propTypes` 的支持，老项目升级时这类声明会静默失效，得留意。

二是「父传子」这条路走得再远也是有代价的。开头那个筛选栏到导出按钮的例子，如果硬用 props 传，中间四层布局组件每一层都要加一个自己根本不用的参数往下递。这种传法通常叫 props drilling，层数一多，改一个字段名要动五个文件。

所以 props 适合的是两三层以内的直接传递。再深就该考虑第三节的方案了。

## 二、子组件向父组件通信

数据是单向往下流的，那子组件怎么往上说话？两条路：

- 利用回调函数
- 利用自定义事件机制

回调函数是主流。原理很朴素，父组件把一个自己的方法当 props 传下去，子组件在合适的时机调它，函数体是在父组件的作用域里跑的，自然就能改父组件的 state。

下面这个例子实现的功能是，在子组件中点击隐藏组件按钮可以将自身隐藏。

```javascript
import React, { Component } from 'react';
import PropTypes from 'prop-types';

class List3 extends Component {
    static propTypes = {
        hideConponent: PropTypes.func.isRequired,
    }
    render() {
        return (
            <div>
                哈哈,我是List3
                <button onClick={this.props.hideConponent}>隐藏List3组件</button>
            </div>
        );
    }
}

export default List3;
```

子组件这一侧非常干净，它甚至不知道点了之后会发生什么，只负责在按钮被点的时候把消息喊出去。这种「子组件不持有业务语义」的设计是对的，换个父组件复用它，行为就可以完全不同。

父组件这一侧：

```javascript
//app.jsx

import React, { Component } from 'react';

import List3 from './components/List3';
export default class App extends Component {
    constructor(...args) {
        super(...args);
        this.state = {
            isShowList3: false,
        };
    }
    showConponent = () => {
        this.setState({
            isShowList3: true,
        });
    }
    hideConponent = () => {
        this.setState({
            isShowList3: false,
        });
    }
    render() {
        return (
            <div>
                <button onClick={this.showConponent}>显示Lists组件</button>
                {
                    this.state.isShowList3 ?
                        <List3 hideConponent={this.hideConponent} />
                    :
                    null
                }

            </div>
        );
    }
}
```

真正的状态 `isShowList3` 在父组件手里，子组件只能通过调函数来请求改变。这就是「状态提升」的标准形态，也是 React 里兄弟组件通信的默认解法：两个兄弟要通信，把共享的那部分 state 提到它们最近的共同父组件上去。

这里有个坑要注意，`showConponent = () => {}` 这种类属性加箭头函数的写法不是随便写的，它保证了 `this` 绑定。如果你写成普通的类方法 `showConponent() {}`，传下去之后 `this` 就丢了，调用时会报 `Cannot read property 'setState' of undefined`。老代码里常见的替代方案是在 `constructor` 里写 `this.showConponent = this.showConponent.bind(this)`。

需要传参的时候，写法是 `onClick={() => this.handleClick(id)}`。这样每次渲染都会生成一个新的函数引用，如果子组件做了 `React.memo` 或者 `shouldComponentUpdate` 的浅比较优化，这个新引用会让优化直接失效。数据量小无所谓，长列表里就得注意，通常的做法是把 `id` 通过 `data-` 属性挂在 DOM 上，或者把每一项抽成独立组件，让每一项自己持有自己的 id。

## 三、跨级组件通信

跨级指的是隔了不止一层，比如爷爷组件要和孙子组件说话。

### 3.1 层层组件传递 props

例如 A 组件和 B 组件之间要进行通信，先找到 A 和 B 公共的父组件 C，A 先向 C 组件通信，C 组件通过 props 和 B 组件通信，此时 C 组件起的就是中间件的作用。

这条路的好处是不引入任何新概念，数据流向一眼能看清，坏处第一节已经说了，层数一多就是灾难。

我自己的判断线大概在三层。三层以内老实传，超过三层就该换方案了。

### 3.2 使用 context

context 是一个全局变量，像是一个大容器，在任何地方都可以访问到。我们可以把要通信的信息放在 context 上，然后在其他组件中可以随意取到。

但是 React 官方不建议使用大量 context，尽管它可以减少逐层传递，但是当组件结构复杂的时候，我们并不知道 context 是从哪里传过来的；而且 context 是一个全局变量，全局变量正是导致应用走向混乱的罪魁祸首。

这段是 2018 年的判断，那时候官方的态度确实很保守。原因不只是「全局变量容易乱」这一条，更硬的技术原因是旧版 context 的传播会被中间组件的 `shouldComponentUpdate` 截断，导致值改了但下游收不到。React 16.3 换成新的 `createContext` 之后这个缺陷被修掉了，官方态度也从「不推荐」转成了「主题、语言、当前用户这类场景推荐用」。这一段的机制细节我在 [React 之 context 跨层级传值原理](https://feinterview.poetries.top/blog/react-context) 里展开讲了，包括新 API 的重渲染范围问题。

下面例子中的组件关系是，ListItem 是 List 的子组件，List 是 app 的子组件。

```javascript
// ListItem.jsx
import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ListItem extends Component {
    // 子组件声明自己要使用context
    static contextTypes = {
        color: PropTypes.string,
    }
    static propTypes = {
        value: PropTypes.string,
    }
    render() {
        const { value } = this.props;
        return (
            <li style={{ background: this.context.color }}>
                <span>{value}</span>
            </li>
        );
    }
}

export default ListItem;
```

消费方要显式声明 `contextTypes`，不声明的话 `this.context` 就是空对象。这个强制声明当年是为了让隐式依赖变得可见。

提供方这一侧：

```javascript
// List.jsx
import ListItem from './ListItem';

class List extends Component {
    // 父组件声明自己支持context
    static childContextTypes = {
        color: PropTypes.string,
    }
    static propTypes = {
        list: PropTypes.array,
    }
    // 提供一个函数,用来返回相应的context对象
    getChildContext() {
        return {
            color: 'red',
        };
    }
    render() {
        const { list } = this.props;
        return (
            <div>
                <ul>
                    {
                        list.map((entry, index) =>
                            <ListItem key={`list-${index}`} value={entry.text} />,
                       )
                    }
                </ul>
            </div>
        );
    }
}

export default List;
```

注意 `List` 把 `color` 发下去之后，`ListItem` 就能直接读到，中间不需要任何 props 中转。这就是 context 省掉的那部分工作。

最外层：

```javascript
// App.jsx

import React, { Component } from 'react';
import List from './components/List';

const list = [
    {
        text: '题目一',
    },
    {
        text: '题目二',
    },
];
export default class App extends Component {
    render() {
        return (
            <div>
                <List
                    list={list}
                />
            </div>
        );
    }
}
```

这套 `childContextTypes` 加 `getChildContext` 的写法在 React 19 里已经被移除了，老项目升级前必须先改成 `React.createContext`。

## 四、没有嵌套关系的组件通信

两个组件在树上八竿子打不着，共同祖先在很上面甚至就是根节点，这时候状态提升的成本太高了，提到根上会让根组件变成一个什么都管的巨型组件。

这种场景可以用自定义事件机制，也就是发布订阅模式。

在 `componentDidMount` 事件中，如果组件挂载完成，再订阅事件；在组件卸载的时候，在 `componentWillUnmount` 事件中取消事件的订阅。以常用的发布订阅模式举例，借用 Node.js Events 模块的浏览器版实现。

下面例子中的组件关系是，List1 和 List2 没有任何嵌套关系，App 是它们的父组件。要实现的功能是，点击 List2 中的一个按钮，改变 List1 中的信息显示。

```
npm install events --save
```

在 src 下新建一个 util 目录，里面建一个 events.js，导出一个全局单例：

```
import { EventEmitter } from 'events';

export default new EventEmitter();
```

订阅方：

```javascript
// List1.jsx
import React, { Component } from 'react';
import emitter from '../util/events';

class List1 extends Component {
    constructor(props) {
        super(props);
        this.state = {
            message: 'List1',
        };
    }
    handleMessage = (message) => {
        this.setState({ message });
    }
    componentDidMount() {
        // 组件装载完成以后声明一个自定义事件
        emitter.addListener('changeMessage', this.handleMessage);
    }
    componentWillUnmount() {
        emitter.removeListener('changeMessage', this.handleMessage);
    }
    render() {
        return (
            <div>
                {this.state.message}
            </div>
        );
    }
}

export default List1;
```

这里我改了原文两处。原文写的是 `this.eventEmitter = emitter.addListener(...)`，然后 `emitter.removeListener(this.eventEmitter)`。Node 的 `EventEmitter.addListener` 返回的是 emitter 自身，不是一个可退订的句柄，而 `removeListener` 的签名是 `(eventName, listener)`，只传一个参数退订不掉。这个写法源自 fbemitter 那一类库的 API，混用 Node 的 `events` 会静默失败，组件卸载后监听器还挂着，下次触发就往已卸载的实例上 `setState`。另外原文类名写的是 `List`，但 App 里 import 的是 `List1`，对不上，一并统一了。

发布方：

```javascript
//List2.jsx
import React, { Component } from 'react';
import emitter from '../util/events';

class List2 extends Component {
    handleClick = (message) => {
        emitter.emit('changeMessage', message);
    };
    render() {
        return (
            <div>
                <button onClick={this.handleClick.bind(this, 'List2')}>点击我改变List1组件中显示信息</button>
            </div>
        );
    }
}

export default List2;
```

最外层把两个组件平铺出来：

```javascript
// APP.jsx

import React, { Component } from 'react';
import List1 from './components/List1';
import List2 from './components/List2';


export default class App extends Component {
    render() {
        return (
            <div>
                <List1 />
                <List2 />
            </div>
        );
    }
}
```

自定义事件是典型的发布订阅模式，通过向事件对象上添加监听器和触发事件来实现组件之间的通信。

这个方案好用，但我得把它的代价说清楚，因为它是四种里最容易把项目搞乱的一种。

事件名是字符串，没有任何类型约束。你把 `'changeMessage'` 拼错成 `'chnageMessage'`，代码照常运行，就是没反应，编译器和 lint 都帮不了你。数据流向也彻底看不见了，看到一个组件在 `emit`，你没法从代码里知道谁在听；看到一个组件在 `addListener`，你也不知道谁会触发它，只能全局搜字符串。项目里这类事件超过十个，维护成本就开始失控。

再加上退订这件事，忘一次就是一个内存泄漏，而且泄漏不报错，表现是页面用久了越来越卡。

所以我的态度是，事件总线可以用，但要克制。真正合适的场景是那种「一次性的、跨模块的通知」，比如全局的登录过期广播、多标签页之间的同步。常规的业务状态同步，还是老实上状态管理库。

## 五、四种方式怎么选

把上面四种放一起对比一下：

| 场景 | 方案 | 适用范围 | 主要代价 |
|------|------|----------|----------|
| 父传子 | props | 任意层级，实际控制在 2 到 3 层 | 层数深了要层层中转 |
| 子传父 | 回调函数 | 直接父子，或状态提升后的兄弟 | 状态要提到共同祖先，祖先容易变胖 |
| 跨级 | context | 同一棵子树内，变化不频繁的值 | value 变化时全部消费者重渲染 |
| 无嵌套 | 事件总线 | 任意两点，跨模块通知 | 数据流不可见，退订易漏 |
| 复杂全局状态 | Redux / Zustand 等 | 多方读写、需要时间旅行调试 | 引入额外概念和样板代码 |

选的时候我一般按这个顺序问自己。

先问能不能用 props 直接传，两三层以内就别想别的。传不了就问这两个组件有没有共同祖先，有的话状态提升，把 state 挪上去，回调传下来。祖先离得太远、中间层太多，就看这个值是不是「变化不频繁、整棵子树都可能要」，是的话上 context。到这一步还搞不定的，通常说明你需要的是一个真正的状态管理方案，而不是通信技巧。

事件总线放在最后，它更像是逃生通道而不是常规工具。

还有两种手段这篇没展开但值得知道。一是 `ref`，父组件可以拿到子组件实例直接调它的方法，属于命令式的口子，适合「让这个输入框获得焦点」「让这个弹窗打开」这类不适合用状态表达的动作。二是 `props.children` 加组件组合，很多看起来需要跨级通信的需求，把组件的组织方式改一下就消失了，这也是官方文档里反复强调的思路。

## 六、Hooks 时代这些写法变成了什么样

这篇写于 2018 年，上面全是类组件。今天写法变了，但通信的分类和选型逻辑一点没变。

父传子还是 props，没区别。子传父的回调函数不用再操心 `this` 绑定了，函数组件里定义的函数天然闭包捕获，不过要留意闭包捕获的是那一次渲染的值，配合 `useCallback` 的依赖数组容易写出读到旧值的 bug。

跨级通信从 `contextTypes` 换成了 `useContext`，写法短了一大截，也不用再声明字段。事件总线的订阅从 `componentDidMount` 加 `componentWillUnmount` 两个钩子合成了一个 `useEffect`，返回的清理函数就是退订，忘写清理的概率反而低了一些。这几个 Hook 的用法和坑我整理在 [React Hooks 详解](https://feinterview.poetries.top/blog/react-hooks) 里。

还有一点和并发渲染有关。React 18 之后渲染可以被中断，一棵树的上下两半可能读到不同时刻的外部数据，这个现象叫撕裂。用第四节那种自己写的全局事件总线加 `setState` 来同步状态，在并发模式下是有风险的，官方给外部数据源准备的解法是 `useSyncExternalStore`。背景可以看 [React 18 并发机制深度解析](https://feinterview.poetries.top/blog/react-18-concurrency)。

## 总结

四类场景的标准答案先摆这里：

- 父组件向子组件通信用 `props`
- 子组件向父组件通信用回调函数，或者自定义事件
- 跨级组件通信用层层传递 `props`，或者 `context`
- 没有嵌套关系组件之间的通信用自定义事件

但答案背后的逻辑比答案本身重要。React 的数据流只有一个方向，所有通信手段都是在这个约束下想办法，要么顺着流向传（props），要么把控制权借出去再收回来（回调），要么开一条绕过中间层的旁路（context），要么干脆跳出组件树自建一套广播（事件总线）。越往后走，能力越强，数据流向也越不可见。

我的经验是，优先用最弱的那个能解决问题的方案。能用 props 就不用 context，能用 context 就不上事件总线。通信手段选得越强，将来排查「这个值到底是谁改的」就越费劲。

## 参考

- [组件间通信 - React 官方文档](https://react.dev/learn/sharing-state-between-components)
- [使用 Context 深层传递参数 - React 官方文档](https://react.dev/learn/passing-data-deeply-with-context)
- [使用 Ref 操作 DOM - React 官方文档](https://react.dev/learn/manipulating-the-dom-with-refs)
- [Node.js Events 模块文档](https://nodejs.org/api/events.html)
- [useSyncExternalStore - React 官方文档](https://react.dev/reference/react/useSyncExternalStore)
- [前端进阶之旅](https://interview.poetries.top)
