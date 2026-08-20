---
title: 浅析 React 高阶组件 HOC 的两种实现与常见陷阱
date: 2018-07-23 00:10:24
description: 讲清楚 React 高阶组件 HOC 的属性代理和反向继承两种写法，以及静态方法丢失、ref 不透传、命名冲突这些实战里绕不开的坑和现在的替代方案。
tags:
 - JavaScript
 - react
 - 高阶组件
 - 组件复用
categories: Front-End
---

项目里有三个页面都要做同一件事：进页面先查登录态，没登录跳登录页，登录了再拉数据。第一遍是复制粘贴，第二遍改需求的时候发现有一个页面漏改了。这种「逻辑一样、UI 完全不同」的复用需求，用继承解决不了，因为它们的渲染内容毫无共同点；抽成工具函数也不行，因为它要挂在组件的生命周期上。

高阶组件就是 React 给这类问题的答案。这篇把它的两种实现方式讲透，顺带把我在实际项目里踩过的几个坑摊开说，最后聊聊今天还该不该用它。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 高阶组件到底是什么，它和高阶函数的关系
- 属性代理的写法，以及为什么它是最常用的那一种
- 反向继承能做到属性代理做不到的什么事
- 静态方法丢失、ref 断链、props 命名冲突这三个必踩的坑
- HOC、render props、Hooks 三者的取舍
- 这套模式在今天的位置

## 一、高阶组件是什么

高阶组件其实就是一个函数，传入一个组件返回一个新的组件。它接受一个组件作为参数，返回一个新的组件。这个新的组件会使用你传给它的组件作为子组件。

高阶组件的作用其实不言而喻，就是为了组件之间的代码复用。组件可能有着某些相同的逻辑，把这些逻辑抽离出来，放到高阶组件中进行复用。高阶组件内部的包装组件和被包装组件之间通过 props 传递数据。

名字里的「高阶」和函数式编程里的高阶函数是一回事。高阶函数接收函数返回函数，高阶组件接收组件返回组件。签名写出来就很直观：

```javascript
// 高阶函数
const withLog = fn => (...args) => {
  console.log('调用参数', args)
  return fn(...args)
}

// 高阶组件
const withAuth = Component => props => {
  // 返回一个新组件
}
```

有一点要先说清楚，HOC 不是 React 提供的 API，你在 React 的文档目录里找不到一个叫 `createHOC` 的东西。它纯粹是一种约定俗成的写法，是从 React 组件即函数这个特性里自然长出来的模式。这也是为什么不同库里的 HOC 长相各不相同，redux 的 `connect`、react-router 的 `withRouter`、antd 的 `Form.create`，写法细节都有出入，但骨架都是「组件进，组件出」。

## 二、如何实现高阶组件

高阶组件其实就是处理 react 组件的函数。那么我们如何实现一个高阶组件？有两种方法。

### 2.1 属性代理

属性代理是最常见的实现方式，将被处理组件的 props 和新的 props 一起传递给新组件。

```javascript
export default function withHeader(WrappedComponent) {
  return class HOC extends Component {
    render() {
      return <div>
        <div className="demo-header">
          我是标题
        </div>
        <WrappedComponent {...this.props}/>
      </div>
    }
  }
}
```

这段代码干的事是：包一层 `div`，塞一个标题进去，再把外面收到的所有 props 原封不动透传给被包装的组件。`{...this.props}` 这一行是属性代理的灵魂，少了它，被包装组件就一个 prop 都收不到。

在其他组件里，我们引用这个高阶组件，用来强化它。

```javascript
@withHeader
export default class Demo extends Component {
  render() {
    return (
      <div>
        我是一个普通组件
      </div>
    );
  }
}
```

使用 ES6 写法可以更加简洁。

```javascript
export default(title) => (WrappedComponent) => class HOC extends Component {
  render() {
    return <div>
      <div className="demo-header">
        {title
          ? title
          : '我是标题'}
      </div>
      <WrappedComponent {...this.props}/>
    </div>
  }
}
```

这个版本多包了一层函数，先收配置再收组件，用的时候是 `withHeader('订单详情')(Demo)`。这种柯里化的写法在 HOC 里非常普遍，`connect(mapStateToProps)(Component)` 就是同一个套路。好处是配置和组件分离，`withHeader('订单详情')` 本身可以被存下来复用。

从代码中看，就是使用 HOC 这个函数，向被处理的组件 `WrappedComponent` 上面添加一些属性，并返回一个包含原组件的新组件。

属性代理能做的事其实相当宽：注入 props、包裹额外的 DOM 结构、劫持 props 做转换、在自己的生命周期里做订阅和清理、甚至根据条件决定渲不渲染原组件。回到开头那个登录态的需求，用属性代理写出来大概是这样：

```javascript
function withAuth(WrappedComponent) {
  return class extends Component {
    state = { checked: false }

    componentDidMount() {
      checkLogin().then(ok => {
        if (!ok) return redirectToLogin()
        this.setState({ checked: true })
      })
    }

    render() {
      if (!this.state.checked) return <Loading />
      return <WrappedComponent {...this.props} />
    }
  }
}
```

三个页面各自 `export default withAuth(PageA)`，逻辑就只有一份了。

顺便说一句上面那个装饰器写法。`@withHeader` 这种语法在 2018 年需要 Babel 的 legacy decorators 插件才能用，它当时还是一个提案。装饰器提案后来经历过重写，语义和早期的 legacy 版本并不完全一致。老项目里 `@connect` 这类写法很常见，新项目要不要用，建议先确认你的构建链支持哪一个版本的提案，具体以 Babel 和 TypeScript 的官方文档为准。稳妥的做法是直接写成函数调用 `export default withHeader(Demo)`，没有任何兼容性负担。

### 2.2 反向继承

```javascript
function HOC(WrappedComponent){
    return class HOC extends WrappedComponent {
        //继承了传入的组件
        test1(){
            return this.test2() + 5;
        }
 
        componentDidMount(){
            console.log('1');
            this.setState({number:2});
        }
 
        render(){
            //使用super调用传入组件的render方法
            return super.render();
        }
    }
}
 
@HOC
class OriginComponent extends Component {
    constructor(props){
        super(props);
        this.state = {number:1}
    }
 
    test2(){
        return 4;
    }
    componentDidMount(){
        console.log('2');
    }
 
    render(){
        return (
            <div>
                {this.state.number}{'and'}
                {this.test1()}
                这是原始组件
            </div>
        )
    }
}
 
//const newComponent = HOC(OriginComponent)
```

和属性代理最大的区别在第一行：`extends WrappedComponent` 而不是 `extends Component`。返回的组件继承了被包装组件，于是它能直接访问对方的 `state`、`props` 和实例方法，这是属性代理做不到的。

跑一下这个例子，控制台只会打印 `1`，不会打印 `2`。因为子类的 `componentDidMount` 覆盖了父类的同名方法，父类那个 `console.log('2')` 根本没被调用。想让两个都执行，得在子类里显式 `super.componentDidMount()`。这个细节很容易翻车，尤其当被包装组件是别人写的、你不知道它在生命周期里做了什么的时候。

`render` 里的 `super.render()` 是反向继承的招牌用法，业内叫渲染劫持。因为你拿到的是原组件 `render` 的返回值，也就是一棵 React 元素树，可以在返回之前对它做手脚，比如用 `React.cloneElement` 改属性、根据条件替换某个子节点、或者干脆返回 `null` 把整个组件藏起来。

不过我得说实话，反向继承在实际项目里用得非常少。原因有几个。它对被包装组件是有侵入性的，你必须知道对方是类组件（函数组件没有 `render` 方法可以 `super`，直接就用不了）。渲染劫持能改的也只是 `render` 返回的元素树，元素树里嵌套的子组件返回了什么，你依然看不到也改不了。再加上继承链一长，`this` 上的东西来自哪一层就没人说得清了。

React 官方文档里明确推荐组合优于继承，属性代理就是组合。绝大多数场景选属性代理就对了。

## 三、HOC 的三个坑

这几个坑我都实打实撞过，写出来省得你再撞一遍。

### 3.1 静态方法会丢

```javascript
class Page extends Component { /* ... */ }
Page.fetchData = () => { /* SSR 预取数据 */ }

const Wrapped = withAuth(Page)
Wrapped.fetchData // undefined
```

属性代理返回的是一个全新的类，原组件挂在类上的静态属性一个都不会跟过来。做服务端渲染时这个坑特别致命，因为 SSR 框架常常靠 `Component.fetchData` 这类静态方法来预取数据，包一层 HOC 之后数据就没了，页面白屏，还不报错。

解决办法是手动拷贝，或者用 `hoist-non-react-statics` 这个包自动拷贝所有非 React 内置的静态属性：

```javascript
import hoistNonReactStatic from 'hoist-non-react-statics'

function withAuth(WrappedComponent) {
  class HOC extends Component { /* ... */ }
  return hoistNonReactStatic(HOC, WrappedComponent)
}
```

redux 的 `connect` 内部就用了它，所以 `connect` 过的组件静态方法是保得住的。

### 3.2 ref 拿不到里面的实例

`ref` 不是普通的 prop，`{...this.props}` 展开的时候它不在里面。你在外面给 `Wrapped` 挂一个 `ref`，拿到的是 HOC 那一层的实例，而不是你真正想操作的那个组件。

标准解法是 `React.forwardRef`：

```javascript
function withAuth(WrappedComponent) {
  class HOC extends Component {
    render() {
      const { forwardedRef, ...rest } = this.props
      return <WrappedComponent ref={forwardedRef} {...rest} />
    }
  }

  return React.forwardRef((props, ref) => (
    <HOC {...props} forwardedRef={ref} />
  ))
}
```

这里有个细节，`forwardRef` 是 React 16.3 才有的。这块请以你项目实际使用的 React 版本文档为准。

### 3.3 props 命名冲突和调试困难

HOC 往下注入 props，如果注入的名字恰好和使用者手动传的重名，就会互相覆盖，而且覆盖谁取决于 JSX 里属性的书写顺序。多层 HOC 嵌套时这个问题会放大，`withRouter(connect(...)(withForm(Page)))` 这种组合出问题基本只能一层层注释掉来排查，我为这种事排查过一下午。

有两个习惯能缓解。一是给注入的 props 加统一前缀，比如 `auth_user` 而不是 `user`。二是给 HOC 设置 `displayName`：

```javascript
HOC.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
```

设了之后 React DevTools 里显示的是 `WithAuth(OrderDetail)` 而不是一串 `HOC`，看组件树的时候能省很多事。

另外有一条硬规则：不要在 `render` 方法里创建 HOC。

```javascript
render() {
  const Enhanced = withAuth(MyComponent) // 错误写法
  return <Enhanced />
}
```

每次渲染都会生成一个新的组件类型，React 在 diff 时发现类型不同，会把旧子树整个卸载再重新挂载，组件内部的 state 全丢，DOM 全重建。HOC 一律在模块顶层调用。

## 四、今天还用 HOC 吗

这篇写于 2018 年，那时候 React 的逻辑复用只有两条路，HOC 和 render props。这两种模式都能工作，但代价是组件树里多出一堆只为了传数据而存在的包装层，DevTools 里点开一个业务组件，先要往下翻五六层。

2019 年 React 16.8 带来了 Hooks，情况变了。自定义 Hook 能把带状态的逻辑抽出来，还不产生任何额外的组件层级。前面那个登录态的例子用 Hook 写出来是这样：

```javascript
function useAuth() {
  const [checked, setChecked] = useState(false)
  useEffect(() => {
    checkLogin().then(ok => ok ? setChecked(true) : redirectToLogin())
  }, [])
  return checked
}
```

页面里 `const checked = useAuth()`，一行搞定，没有包装组件，没有 props 冲突，静态方法和 ref 的坑自然也不存在。Hooks 的完整用法和它自己的一套坑，我写在 [React Hooks 详解](https://feinterview.poetries.top/blog/react-hooks) 里。

不是说 HOC 就完全没用了。有两类场景它还是合适的。一类是要在组件外层包裹额外 DOM 结构或者做条件渲染的，比如权限不足时整个组件不渲染，这件事 Hook 做不了，Hook 只能返回数据不能替换你的返回值。另一类是给第三方组件统一注入能力，你改不到它内部代码，只能从外面包。

所以我的判断是：新写的逻辑复用优先自定义 Hook；需要「包一层」或者「换掉渲染结果」的时候，HOC 依然是对的工具。至于反向继承，除非你在写调试工具或者做渲染劫持，否则可以直接忘掉。

组件之间数据怎么传，除了 HOC 注入这一条路，还有 props、回调、context、事件总线几种，各自的适用范围我在 [React 组件通信方式全解](https://feinterview.poetries.top/blog/react-comp-communicate) 里做了横向对比。

## 总结

高阶组件是一个函数，吃进一个组件，吐出一个增强过的组件。它不是 React 的 API，只是从「组件是函数」这个事实里长出来的复用约定。

实现上分两派。属性代理用组合，包一层新组件，透传 props 再注入自己的东西，能力足够、边界清晰，日常用它就够了。反向继承用继承，能碰到原组件的实例和 `render` 返回值，能力更大但侵入性强、只支持类组件，属于特殊需求才动用的手段。

用之前记住三件事：静态方法要用 `hoist-non-react-statics` 搬过去，ref 要用 `forwardRef` 转发，HOC 必须在模块顶层创建而不是在 `render` 里。

一句话概括它在今天的位置：纯逻辑复用交给自定义 Hook，需要在外层包点什么的时候才请出 HOC。

## 参考

- [高阶组件 - React 官方文档](https://legacy.reactjs.org/docs/higher-order-components.html)
- [组合优于继承 - React 官方文档](https://legacy.reactjs.org/docs/composition-vs-inheritance.html)
- [forwardRef - React 官方文档](https://react.dev/reference/react/forwardRef)
- [hoist-non-react-statics](https://github.com/mridgway/hoist-non-react-statics)
- [前端进阶之旅](https://interview.poetries.top)
