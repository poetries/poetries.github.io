---
title: React 之 context 跨层级传值原理与重渲染范围
date: 2018-07-23 09:50:12
description: 从旧版 childContextTypes 写法讲到新 Context API 的订阅机制，说清楚 context 为什么能跨层级传值、旧 API 为什么被废弃、以及 Provider 的 value 变化会带来多大的重渲染范围。
tags:
 - JavaScript
 - react
 - context
 - React 原理
categories: Front-End

---

页面顶部有个主题切换按钮，切换之后整个页面几十个组件的配色都要跟着变。按 React 的单向数据流，主题值要从最外层一路作为 props 往下传，中间那些压根不关心主题的布局组件、卡片组件全都得加一个 `theme` 参数负责往下递。这种传法有个很形象的叫法，props drilling，钻井。

context 就是给这种场景准备的旁路通道。这篇把旧版 context 的写法完整讲一遍，讲清楚它为什么会被废弃，再把新 Context API 的订阅机制和重渲染范围说明白。重渲染范围这块尤其值得细看，很多人拿 context 当状态管理用，最后卡在这里。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- context 解决的到底是哪一类问题，它和状态提升的分工
- 旧版 `getChildContext` 加 `contextTypes` 的完整写法
- react-redux 的 `Provider` 和 `connect` 是怎么用 context 实现的
- 旧 context 被 `shouldComponentUpdate` 截断的致命缺陷
- 新 Context API 的订阅模型，为什么它不会被截断
- Provider 的 `value` 变化会引起多大范围的重渲染，怎么控制
- 这套 API 到 React 19 的现状

## 一、简介

React 组件之间的通信是基于 props 的单向数据流，即父组件通过 props 向子组件传值，亦或是子组件执行传入的函数来更新父组件的 `state`，这都满足了我们大部分的使用场景。

一般地，对于兄弟组件之间的通信，是通过它们共同的祖先组件进行的，即 Lifting State Up，官方文档也有介绍。组件一通过事件将状态变更通知它们共同的祖先组件，祖先组件再将状态同步到组件二。

但是，如果组件之间嵌套得比较深，即使提升状态到共同父组件，再同步状态到相应的组件，还是需要一层一层地传递下去，可能会比较繁琐。

在对应的场景中，`context` 就可以缩短父组件到子组件的属性传递路径。

这里要先划一条线。context 缩短的是传递路径，它没有取消掉「状态放在上层」这件事。数据依然存在某个祖先组件的 state 里，依然是自上而下流动，变的只是中间那些组件不用再当搬运工。所以状态提升和 context 不是二选一的关系，是先提升，再决定要不要用 context 送下去。

什么时候值得用？我的判断标准很简单：这个值是不是「整棵子树都可能要，但中间大部分组件不关心」。主题、语言包、当前登录用户、路由信息，这几类都符合。反过来，一个只往下传两层的值，老老实实写 props 更清楚。

组件通信还有别的几种方式，各自的适用边界我在 [React 组件通信方式全解](https://feinterview.poetries.top/blog/react-comp-communicate) 里做过横向对比。

## 二、旧版 context 的写法

下面这套写法是 React 16.3 之前的唯一选择，现在看已经过时了，但老项目里到处都是，而且理解它是理解新 API 为什么这么设计的前提。

先看一个完整例子，需求是让两个互不相邻的子组件通过共同祖先通信。

```javascript
import Parent from './Parent'
import ChildOne from '../components/ChildOne'
import ChildTwo from '../components/ChildTwo'

export default class Container extends React.Component {
    constructor(props) {
        super(props);
        this.state = { value: '' }
    }

    changeValue = value => {
        this.setState({ value })
    }

    getChildContext() {
        return {
            value: this.state.value,
            changeValue: this.changeValue
        }
    }

    render() {
        return (
            <div>
                <Parent>
                    <ChildOne />
                </Parent>
                <Parent>
                    <ChildTwo />
                </Parent>
            </div>
        )
    }
}

Container.childContextTypes = {
    value: PropTypes.string,
    changeValue: PropTypes.func
}
```

`Container` 这个组件做了三件事：把值存在自己的 state 里、声明 `childContextTypes` 告诉 React「我要往下发这两个字段」、实现 `getChildContext` 返回具体的值。注意 `getChildContext` 会在每次渲染时被调用，返回的是当前这一刻的 state 快照。

中间这一层什么都不用做：

```javascript
import React from "react"

const Parent = (props) => (
    <div {...props} />
)

export default Parent
```

`Parent` 完全不知道 context 的存在，它只是把 children 渲染出来。这正是 context 的价值所在，中间层是透明的。

下面是发送方 `ChildOne`：

```javascript
export default class ChildOne extends React.Component {

    handleChange = (e) => {
        const { changeValue } = this.context
        changeValue(e.target.value)
    }

    render() {
        return (
            <div>
                子组件一
                <input onChange={this.handleChange} />
            </div>
        )
    }
}

ChildOne.contextTypes = {
    changeValue: PropTypes.func
}
```

接收方 `ChildTwo`：

```javascript
export default class ChildTwo extends React.Component {
    render() {
        return (
            <div>
                子组件二
                <p>{this.context.value}</p>
            </div>
        )
    }
}

ChildTwo.contextTypes = {
    value: PropTypes.string
}
```

在 `Container.childContextTypes` 中进行接口的声明，通过 `getChildContext` 返回更新后的 `state`，在 `Child.contextTypes` 中声明要获取的接口，这样在子组件内部就能通过 `this.context` 获取到。通过 `Context` 这样一个中间对象，`ChildOne` 和 `ChildTwo` 就可以相互通信了。

有个很容易被忽略的细节：子组件的 `contextTypes` 不是可选的装饰，是必需的。你不声明 `contextTypes`，`this.context` 就是个空对象，什么都拿不到。这个设计当时是为了让依赖关系显式化，代价是每个消费方都得写一遍声明。上面几段代码用到了 `PropTypes` 却没有写 `import PropTypes from 'prop-types'`，实际项目里记得补上，React 15.5 之后 `PropTypes` 已经从 React 主包里拆出去了。

## 三、多层嵌套下的传递

再看一个更贴近实际的例子，需求是在深层的导航栏里读到最外层 `Page` 的变量。

这类需求有两条路，用 `context` 传，或者用 props 一层层传。使用 `context` 的组件需要定义 `propTypes`，需要严格校验、声明类型、字段。

```javascript
class Page extends React.Component {
    static childContextTypes = {
       user: PropTypes.string
    }
    constructor(props){
        super(props)
        this.state = {user:'poetries'}
    }
    getChildContext(){
        return this.state
    }
    render(){
        return (
          <div>
            <p>我是{this.state.user}</p>
            <Siderbar />
          </div>
        )
    }
}

class Siderbar extends React.Component {
    render(){
        return (
          <div>
            <p>侧边栏</p>
            <Navbar />
          </div>
        )
    }
}

class Navbar extends React.Component {
    static contextTypes = {
       user: PropTypes.string
    }
    render(){
        return (
          <div>
            <p>我是{this.context.user}的导航栏</p>
          </div>
        )
    }
}
```

这段和原文相比我改了三处，都是原文的笔误，说明一下免得你照抄踩坑。

第一处，`Siderbar` 和 `Navbar` 原文写的是 `childContextTypes`，那是「我要往下发」的声明。它们俩是消费方不是提供方，应该写 `contextTypes`。写错的后果是 `this.context.user` 永远是 `undefined`，页面上什么都不显示，还不报错。

第二处，`Siderbar` 自己并不读 `user`，那它连 `contextTypes` 都不用写，直接透传就行。这恰好演示了中间层可以完全不感知 context。

第三处，原文的 `Navbar` 里又渲染了一个 `<Siderbar />`，而 `Siderbar` 里渲染 `Navbar`，这是个无限递归，跑起来直接爆栈。删掉了。

`Page` 里 `getChildContext(){ return this.state }` 这个写法能跑，但不推荐直接把整个 state 甩下去。context 是接口，接口应该只暴露需要暴露的字段，全量透传等于把内部实现全公开了，后面你往 state 里加个私有字段，整棵子树都能读到。

## 四、context 在 Provider 中的应用

理解了上面这套机制，react-redux 的实现原理就没什么神秘的了。`Provider` 组件就是使用 `context`，把 `store` 放到 `context` 里，所有的子元素可以直接取到 `store`。

```javascript
import PropTypes from 'prop-types'

class Provider extends Component {
    static childContextTypes = {
        store: PropTypes.object
    }
    constructor(props, context){
        super(props, context)
        this.store = props.store
    }
    getChildContext(){
        //把传进来的store放进全局
        return {store: this.store}
    }
    render(){
        return this.props.children
    }
}
```

这段代码就三十行不到，但它解释了为什么你在 React 应用最外层包一个 `<Provider store={store}>`，任意深度的组件都能连上 store。整个 react-redux 的「连接」能力，地基就是这个 `getChildContext`。

原文这里把 `PropTypes` 误写成了 `Protypes`，我改回来了。

接着看 `connect`。它负责连接组件，把 redux 里的数据放到组件的属性里，具体要做两件事：接收一个组件，把 state 里的一些数据放进去，返回一个新组件；数据变化的时候，能够通知组件。

```javascript
//高阶组件写法
const connect = (mapStateToProps = state => state, mapDispatchToProps = {}) => (WrappedComponent) => {
    return class ConnectComponent extends React.Component {
        //声明要消费的 context
        static contextTypes = {
            store: PropTypes.object
        }
        constructor(props, context){
            super(props, context)
            this.state = {
                props: {}
            }
        }
        componentDidMount(){
            const { store } = this.context
            this.unsubscribe = store.subscribe(() => this.update())
            this.update()
        }
        componentWillUnmount(){
            this.unsubscribe && this.unsubscribe()
        }
        update(){
            //  获取mapStateToProps、mapDispatchToProps 放入this.props里
            const { store } = this.context
            const stateProps = mapStateToProps(store.getState())
            const dispatchProps = bindActionCreators(mapDispatchToProps, store.dispatch)
            this.setState({
                props: {
                    ...this.state.props,
                    ...stateProps,
                    ...dispatchProps
                }
            })
        }
        render(){
            // 把数据放入
            return <WrappedComponent {...this.state.props} />
        }
    }
}
```

这段和原文比修了四处。原文的 `constructor` 里嵌套了一个 `super(props, context){ ... }` 的块，那是语法错误，跑不起来；`PropTypes.obejct` 拼错了；`mapDispatchProps` 和形参 `mapDispatchToProps` 不一致，会报未定义；返回的 `<wrapperComponent>` 首字母小写，JSX 会把它当成一个原生 DOM 标签而不是变量，React 会渲染出一个不存在的标签。另外补了 `componentWillUnmount` 里取消订阅，原文没退订，组件卸载后 store 一变就往已卸载的实例上 `setState`，是典型的内存泄漏。

顺着这段代码可以看出 `connect` 同时用了两个模式：它是一个高阶组件（吃组件吐组件），也是一个 context 消费者。高阶组件这套写法本身的坑我在 [浅析 React 高阶组件 HOC](https://feinterview.poetries.top/blog/react-hoc) 里单独讲了。

## 五、旧 context 为什么被废弃

上面这套东西能跑，为什么 React 还要在 16.3 推翻重来？

核心问题只有一个，旧 context 的传播会被 `shouldComponentUpdate` 截断。

想想 context 值是怎么送到深层组件的。旧实现里它是搭着渲染流程往下走的，父组件重渲染时把新的 context 交给子组件，子组件再往下交。那如果中间某一层的 `shouldComponentUpdate` 返回了 `false` 呢？这一层直接不渲染了，它下面的子树自然也就没有机会拿到新的 context。

于是就出现了这个现象：你在最外层改了主题，`Container` 的 state 更新了，`getChildContext` 也返回了新值，但页面上有一整块区域纹丝不动。去查会发现中间夹了一个做过性能优化的组件，它的 props 确实没变，`shouldComponentUpdate` 老老实实返回了 `false`。

这个坑最难受的地方在于，两段代码分别看都是对的。性能优化没错，context 用法也没错，错在这两件对的事凑到一起就出问题。而且中间那一层往往是别人写的、跟你这次需求毫不相干的组件。

正因为这样，React 官方在很长一段时间里的态度都是「不要用 context」，文档上明确写着这是实验性 API、随时可能变。当时的建议是，如果你不是在写库，就别碰它。

## 六、新 Context API 与重渲染范围

React 16.3 给了一套全新的 context，`React.createContext` 创建，`Provider` 提供，`Consumer` 或者 `useContext` 消费。

```javascript
const ThemeContext = React.createContext('light')

function App() {
  const [theme, setTheme] = React.useState('dark')
  return (
    <ThemeContext.Provider value={theme}>
      <Layout />
    </ThemeContext.Provider>
  )
}

function ThemedButton() {
  const theme = React.useContext(ThemeContext)
  return <button className={theme}>按钮</button>
}
```

关键差别在传播机制。新 API 不再依赖渲染流程一层层往下带，而是订阅模型：每个消费该 context 的组件在渲染时会把自己注册到对应的 Provider 上，`value` 变化时 React 直接找到这些订阅者，绕过中间所有组件强制更新它们。中间层有没有 `shouldComponentUpdate`、有没有 `React.memo`，都拦不住。

第五节那个坑，从机制上被彻底消灭了。

但新的问题也跟着来了，就是重渲染范围。`value` 一变，所有消费者全部重渲染，没有例外，也没有细粒度的筛选。写成下面这样问题就大了：

```javascript
<UserContext.Provider value={{ user, setUser }}>
```

对象字面量每次渲染都是新引用，哪怕 `user` 根本没变，`Object.is` 比较也是 false，于是 `App` 每渲染一次，全部消费者跟着渲染一次。修法是缓存住这个对象：

```javascript
const value = React.useMemo(() => ({ user, setUser }), [user])
<UserContext.Provider value={value}>
```

还有一个更隐蔽的问题。假设你把 `user` 和 `theme` 塞进同一个 context，那么只用到 `theme` 的组件在 `user` 变化时也会重渲染，因为它订阅的是整个 context 而不是其中某个字段。React 的 context 没有 selector 机制，Redux 那种「只订阅我关心的那一小块」在这里做不到。

我一开始也觉得有了 `useContext` 就可以把 Redux、Zustand 全扔了，实际跑起来才发现不行。context 适合传那些「变化频率低、变了确实全局都要动」的值，主题、语言、当前用户就是这类。高频变化的业务数据放进去，等于每次变化都全量重渲染，性能会很难看。真要自己解决，只能按更新频率把 context 拆成好几个，或者请专门的状态库出场。

按 context 拆分这条路我自己在项目里跑过，好用但会写得比较啰嗦，一个页面五六个 Provider 套着，不算优雅。

关于 React 19 的现状，有三点要补。老的 `childContextTypes` 加 `getChildContext` 这套 legacy context 在 React 19 里已经被移除了，也就是说本文第二、三、四节的写法在 React 19 上直接跑不了，老项目升级前必须先迁到 `createContext`。React 19 还允许直接用 `<Context>` 当 provider 用，不用再写 `<Context.Provider>`。另外 React 19 的 `use` API 也能读 context，并且允许在条件分支里调用，这一点是 `useContext` 做不到的。这几个新特性我只在 demo 里试过，具体行为以官方文档为准。

## 总结

context 干的事情很单纯，给一棵组件子树开一条旁路，让数据不必经过中间每一层就能抵达深处。它没有改变数据自上而下流动这个基本盘，只是省掉了搬运工。

旧 API 靠 `childContextTypes` 加 `getChildContext` 声明和提供，靠 `contextTypes` 消费，通过 `this.context` 读取。它的致命伤是传播依附于渲染流程，中间任何一个 `shouldComponentUpdate` 返回 `false` 就会把整条链掐断，所以官方长期不推荐在业务代码里用。

新 API 换成了订阅模型，消费者直接挂在 Provider 上，中间层再怎么优化也拦不住更新。代价是范围粒度太粗，`value` 一变全体消费者重渲染，于是 `useMemo` 稳定引用和按更新频率拆 context 成了必备操作。

判断要不要用它，就问一句：这个值是不是变化不频繁，且整棵子树都可能要？是就用 context，不是就老实传 props 或者上状态库。

## 参考

- [Context - React 官方文档](https://react.dev/learn/passing-data-deeply-with-context)
- [useContext - React 官方文档](https://react.dev/reference/react/useContext)
- [createContext - React 官方文档](https://react.dev/reference/react/createContext)
- [Legacy Context - React 旧版文档](https://legacy.reactjs.org/docs/legacy-context.html)
- [React v19 升级指南](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [前端进阶之旅](https://interview.poetries.top)
