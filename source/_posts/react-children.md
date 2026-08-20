---
title: React children 详解，Children 工具方法与 cloneElement 实践
date: 2019-09-01 16:10:40
description: 从 props.children 的真实结构讲起，梳理 React.Children 的 map、forEach、count、toArray、only 五个工具方法各自的边界，以及用 React.cloneElement 给子元素批量注入属性的完整写法和踩坑点。
tags:
   - React
   - React.cloneElement
   - React.Children
   - 组件设计
categories: Front-End
---

写一个 `RadioGroup` 组件，想给里面每个 `RadioButton` 自动补上同一个 `name`，最直觉的写法是 `this.props.children.map(...)`。跑一下，控制台丢出来一句 `this.props.children.map is not a function`。定睛一看，调用方只传了一个子元素，`props.children` 这时候压根不是数组。

这篇就是把 `props.children` 的真实形态、`React.Children` 那几个工具方法各自能兜住什么、以及 `React.cloneElement` 怎么给子元素批量注入属性，一次讲清楚。顺带把原文里三处经不起验证的说法改对了，我在 React 19.2.8 上一条条跑过。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `props.children` 到底是什么类型，为什么它有时是数组有时不是
- 任何值都能当 children，JSX 对空白字符做了哪些处理
- 把函数当 children 传进去，也就是 render props 的雏形写法
- `React.Children` 的 map、forEach、count、toArray、only 分别兜住哪些边界
- 用 `React.cloneElement` 给子元素统一注入属性，实现 RadioGroup 这类联动组件
- 2026 年这个时间点，这套 API 在新项目里还该不该用

## 一、子组件

假设我们有一个组件 `<Grid />`，里面包含了几个 `<Row />`。你可能会这么使用它：

```html
<Grid>
  <Row />
  <Row />
  <Row />
</Grid>
```

这三个 `Row` 组件都成为了 `Grid` 的 `props.children`。父组件用一个表达式容器，就能把它们渲染出来：

```js
class Grid extends React.Component {
  render() {
    return <div>{this.props.children}</div>
  }
}
```

这里有个容易被忽略的点。`children` 是通过 props 传进来的，所以它对父组件来说只是一份数据，父组件完全可以选择不渲染，或者渲染之前先加工一遍。下面这个 `<Fullstop />` 就把子组件全丢掉了：

```js
class Fullstop extends React.Component {
  render() {
    return <h1>Hello world!</h1>
  }
}
```

这个行为不是 bug，是设计。React 的组合模型建立在「子元素只是描述，什么时候渲染由父级决定」之上，条件渲染、插槽、包裹层这些能力全从这一条推出来。

## 二、任何东西都能是一个 child

`React` 中的 `children` 不一定是组件，它可以是任何东西。比如直接把一段文字传给 `<Grid />`：

```html
<Grid>Hello world!</Grid>
```

JSX 在编译这段结构时会自动删除每行开头和结尾的空格以及空行，还会把字符串中间的空白行压缩为一个空格。所以你为了排版好看而缩进的那些空格，不会莫名其妙跑进渲染结果里。

多种类型的 children 也可以混着传：

```html
<Grid>
  Here is a row:
  <Row />
  Here is another row:
  <Row />
</Grid>
```

回到开头那个报错。`props.children` 的类型完全取决于调用方怎么写：传一个子元素时它就是那个元素本身，传多个时它是数组，传文字时它是字符串，什么都不传时它是 `undefined`。这四种形态在同一个组件里都可能出现，所以直接当数组用一定会翻车。

这就是 `React.Children` 这套工具方法存在的全部理由。

## 三、把函数当 child 传进去

我们能够传递任何的 JavaScript 表达式作为 children，包括函数。下面这个组件会把接到的 child 当函数执行：

```js
class Executioner extends React.Component {
  render() {
    // See how we're calling the child as a function?
    //                        ↓
    return this.props.children()
  }
}
```

调用方这么写：

```html
<Executioner>
  {() => <h1>Hello World!</h1>}
</Executioner>
```

这个写法在 2016 年前后挺流行，后来演化成了 render props 模式，再后来大部分场景被自定义 Hook 接管了。它解决的问题是「渲染什么由调用方决定，什么时候渲染、拿什么数据渲染由组件决定」，Formik、React Router 的旧版 API、以及各种虚拟列表库都用过这一套。

我一直觉得这个模式比高阶组件好懂，因为数据是怎么流下来的，你在 JSX 里一眼能看到，不用去猜某个 HOC 到底往 props 里塞了什么。

## 四、操作 children

`props.children` 可以是任何类型，比如数组、函数、对象、字符串。React 提供了一系列函数助手来让操作 children 变得可控。

### 4.1 循环

两个最常用的助手是 `React.Children.map` 和 `React.Children.forEach`。它们在 children 是数组时能起作用，在 children 是单个元素、字符串、数字这类非数组值时也能正常工作，不会像原生数组方法那样直接抛错。

```js
class IgnoreFirstChild extends React.Component {
  render() {
    const children = this.props.children
    return (
      <div>
        {React.Children.map(children, (child, i) => {
          // Ignore the first child
          if (i < 1) return
          return child
        })}
      </div>
    )
  }
}
```

`<IgnoreFirstChild />` 会遍历所有的 children，忽略第一个然后返回其他的：

```html
<IgnoreFirstChild>
  <h1>First</h1>
  <h1>Second</h1> // <- Only this is rendered
</IgnoreFirstChild>
```

这种情况下我们当然也可以用 `this.props.children.map`。但如果调用方传进来的是一个函数呢？`this.props.children` 就是一个函数而不是数组，`.map` 直接报错。

用 `React.Children.map` 就不会：

```html
<IgnoreFirstChild>
  {() => <h1>First</h1>} // <- Ignored 💪
</IgnoreFirstChild>
```

这里要把话说准一点。`React.Children.map` 面对函数类型的 child，做法不是「把它当成一个 child 遍历一遍」，而是**根本不会调用你的回调**，直接返回空结果。我在 React 19.2.8 上验证过，回调被触发的次数是 0。所以上面那句「Ignored」的实际含义是这个函数被整个丢掉了，不是被跳过了第一个。

### 4.2 计数

因为 `this.props.children` 可以是任何类型，检查一个组件有多少个 children 是件麻烦事。直接用 `this.props.children.length`，在传字符串或者函数时会给出离谱的结果。假设我们有个 child 是 `"Hello World!"`，`.length` 会告诉你有 12 个。

这就是 `React.Children.count` 存在的原因：

```js
class ChildrenCounter extends React.Component {
  render() {
    return <p>{React.Children.count(this.props.children)}</p>
  }
}
```

**原文这段代码漏了外层的花括号**，写成了 `<p>React.Children.count(this.props.children)</p>`，那样渲染出来的是这一行字符串本身，不是数字。这个 typo 我改了。

它对元素、字符串、混合结构都能给出合理数字：

```html
// Renders "1"
<ChildrenCounter>
  Second!
</ChildrenCounter>

// Renders "2"
<ChildrenCounter>
  <p>First</p>
  <ChildComponent />
</ChildrenCounter>
```

原文接下来还给了一个例子，说下面这种混了函数的结构会渲染成 `3`：

```html
<ChildrenCounter>
  {() => <h1>First!</h1>}
  Second!
  <p>Third!</p>
</ChildrenCounter>
```

这个结论是错的，实际是 `2`。原因和上一节一样，`React.Children.count` 内部走的是同一套遍历逻辑，函数既不是合法元素也不是可迭代对象，所以它不被计入。这个我在 React 19.2.8 上单独跑过一遍确认。

也就是说，`React.Children.count` 数的是「React 认得的可渲染节点」，不是「你传了几个东西进来」。

### 4.3 转换为数组

如果以上方法都不趁手，你可以用 `React.Children.toArray` 把 children 转成真正的数组。需要排序、过滤、取前 N 个的时候，这个方法最省事：

```js
class Sort extends React.Component {
  render() {
    const children = React.Children.toArray(this.props.children)
    // Sort and render the children
    return <p>{children.sort().join(' ')}</p>
  }
}
```

```html
<Sort>
  // We use expression containers to make sure our strings
  // are passed as three children, not as one string
  {'bananas'}{'oranges'}{'apples'}
</Sort>
```

上例会渲染为三个排好序的字符串。

`toArray` 还有一个不太起眼但很重要的副作用，它会给返回数组里的每个元素重新分配 `key`，加上一段前缀做前缀命名空间。所以你如果先 `toArray` 再排序再渲染，React 不会因为顺序变了而误判成删除加新建。这个设计是真的舒服，省掉了自己补 key 的活儿。

### 4.4 执行单一 child

回过头看刚才的 `<Executioner />` 组件，它只能在传单一 child、而且 child 必须是函数的情况下使用：

```js
class Executioner extends React.Component {
  render() {
    return this.props.children()
  }
}
```

原文给的第一个方案是用 `propTypes` 约束：

```js
Executioner.propTypes = {
  children: React.PropTypes.func.isRequired,
}
```

这里有两处已经过时了，得说明一下。`React.PropTypes` 从 React 15.5 起就被标记废弃，React 16 里正式移除，正确写法是单独装 `prop-types` 包然后 `PropTypes.func.isRequired`。而到了 React 19，函数组件上的 `propTypes` 和 `defaultProps` 也一并被移除了，运行时不再做任何校验，这类约束现在统一交给 TypeScript。

原文接着提出了第二个方案，说可以在 `render` 里用 `React.Children.only`：

```js
class Executioner extends React.Component {
  render() {
    return React.Children.only(this.props.children)()
  }
}
```

**这段代码是跑不通的**，我在 React 19.2.8 上试了一下，直接抛 `React.Children.only expected to receive a single React element child.`。原因是 `React.Children.only` 内部用 `isValidElement` 做校验，而函数不是合法的 React 元素，所以只要 child 是函数它就一定会抛错，跟只传一个还是传多个没关系。

`React.Children.only` 真正的用途是「我只接受一个 React 元素，多了就报错」，典型场景是那种需要拿到唯一子元素往上挂 ref 或者克隆属性的包裹型组件。要约束「child 必须是函数」，得自己写：

```js
class Executioner extends React.Component {
  render() {
    const { children } = this.props
    if (typeof children !== 'function') {
      throw new Error('Executioner 只接受一个函数作为 children')
    }
    return children()
  }
}
```

排查这个错误的路径其实挺固定的。看到 `React.Children.only` 报错，先在报错处把 children 打出来看一眼类型，是函数就说明选错了工具，是数组就说明调用方多传了元素，是 `undefined` 就说明调用方压根没写 children。

## 五、编辑 children

我们可以把任意组件当作 children 传进来，同时仍然由父组件来控制它们，而不是由渲染它们的地方控制。举个例子，一个 `RadioGroup` 组件里放很多 `RadioButton`。

`RadioButton` 不是从 `RadioGroup` 内部渲染出来的，它们只是作为 children 传进来：

```js
render() {
  return(
    <RadioGroup>
      <RadioButton value="first">First</RadioButton>
      <RadioButton value="second">Second</RadioButton>
      <RadioButton value="third">Third</RadioButton>
    </RadioGroup>
  )
}
```

这段代码有一个问题，`input` 没有被分组。原生 radio 要互斥，必须拥有相同的 `name` 属性。最笨的办法是每个都手写一遍：

```html
<RadioGroup>
  <RadioButton name="g1" value="first">First</RadioButton>
  <RadioButton name="g1" value="second">Second</RadioButton>
  <RadioButton name="g1" value="third">Third</RadioButton>
</RadioGroup>
```

能用，但很脆。多加一个选项忘了写 `name`，它就从这一组里掉出去了，而且不报错，只是行为变得诡异。这个我踩过，页面上表现为「明明是单选，却能同时选中两个」，找了半天才想起来是 `name` 漏了。

### 5.1 改变 children 的属性

在 `RadioGroup` 里我们加一个 `renderChildren` 方法，在这里编辑 children 的属性：

```js
class RadioGroup extends React.Component {
  constructor() {
    super()
    // Bind the method to the component context
    this.renderChildren = this.renderChildren.bind(this)
  }

  renderChildren() {
    // TODO: Change the name prop of all children
    // to this.props.name
    return this.props.children
  }

  render() {
    return (
      <div className="group">
        {this.renderChildren()}
      </div>
    )
  }
}
```

先把遍历部分补上，拿到每个 child：

```js
renderChildren() {
  return React.Children.map(this.props.children, child => {
    // TODO: Change the name prop to this.props.name
    return child
  })
}
```

那我们如何编辑它们的属性呢？直接 `child.props.name = this.props.name` 是不行的，React 元素是冻结对象，改不动，严格模式下还会直接抛错。

### 5.2 React.cloneElement 克隆元素

`React.cloneElement` 会克隆一个元素。把想要克隆的元素当作第一个参数，把想要设置的属性以对象的方式作为第二个参数：

```js
const cloned = React.cloneElement(element, {
  new: 'yes!'
})
```

完整签名是这样：

```
React.cloneElement(
  element,
  [props],
  [...children]
)
```

第一个参数必须是一个已存在的 React 元素，自定义组件和原生 DOM 都可以：

```html
React.cloneElement(<div />)
React.cloneElement(<Child />)
```

实际项目里用得最多的是搭配 `React.Children.map` 和 `this.props.children`：

```js
React.Children.map(this.props.children, child => {
    React.cloneElement(child, {...props}, children)
})
```

这正是 `RadioGroup` 需要的。克隆所有的 child 并设置 `name` 属性：

```js
renderChildren() {
  return React.Children.map(this.props.children, child => {
    return React.cloneElement(child, {
      name: this.props.name
    })
  })
}
```

最后一步是给 `RadioGroup` 传一个唯一的 `name`：

```js
<RadioGroup name="g1">
  <RadioButton value="first">First</RadioButton>
  <RadioButton value="second">Second</RadioButton>
  <RadioButton value="third">Third</RadioButton>
</RadioGroup>
```

没有手动给每个 `RadioButton` 加 `name`，我们只是告诉了 `RadioGroup` 这一组要用什么名字。

有两个边界条件要留意。`cloneElement` 的第二个参数是浅合并，你传的 props 会覆盖原元素上的同名 props，所以调用方如果自己写了 `name`，会被父组件的值盖掉。另外如果 children 里混进了字符串或者 `null`，直接 `cloneElement` 会报错，稳妥的写法是先 `React.isValidElement(child)` 判一下，不是元素就原样返回。

## 六、2026 年再看这套 API

上面这些写法在今天依然能跑，React 19 没有移除 `React.Children` 和 `cloneElement`。但官方文档已经把 `Children` 归到了 Legacy API 那一栏，明确说这个用法不常见并且容易写出脆弱的代码。

脆的地方在哪？在于它把「结构」当成了「接口」。`RadioGroup` 遍历 children 注入 `name`，隐含假设了每个 child 都是直接子元素、都是 `RadioButton`、都认识 `name` 这个 prop。哪天有人在中间包了一层 `<div>` 做布局，或者用 `.map` 生成了一个数组，注入链路就断了，而且不报错。

现在更推荐的做法是走 Context。`RadioGroup` 用 Provider 往下传 `name`，`RadioButton` 内部用 `useContext` 取，中间隔多少层、怎么包裹都无所谓：

```jsx
const RadioGroupContext = React.createContext(null)

function RadioGroup({ name, children }) {
  return (
    <RadioGroupContext.Provider value={{ name }}>
      <div className="group">{children}</div>
    </RadioGroupContext.Provider>
  )
}

function RadioButton({ value, children }) {
  const { name } = React.useContext(RadioGroupContext)
  return (
    <label>
      <input type="radio" name={name} value={value} />
      {children}
    </label>
  )
}
```

另一条路是把 children 从「元素」换成「配置数据」或者「函数」，也就是让调用方传 `options` 数组或者传一个渲染函数，父组件自己负责渲染。这样你拿到的是数据，不用去拆解别人的 JSX 树。

不是说 `cloneElement` 不能用，而是它适合的场景收窄了。我自己现在只在两种情况下还会用它：给唯一子元素挂一个 ref 或者补一个事件回调，以及写一些明确只服务于内部的复合组件时图省事。跨团队复用的组件，我一律走 Context。

## 总结

`props.children` 的类型是不稳定的，这是所有问题的源头。同一个组件，调用方传一个元素、传三个元素、传一段文字、什么都不传，`props.children` 分别是元素、数组、字符串、`undefined`，直接当数组用必然出事。

`React.Children` 那五个方法各有各的边界，用之前得知道它们兜的是什么。`map` 和 `forEach` 能吃下非数组结构但会静默丢弃函数类型的 child；`count` 数的是 React 认得的可渲染节点，函数不算；`toArray` 会顺手重排 key；`only` 只认单个合法元素，child 是函数时必抛错。原文里关于 `count` 数出 3 和 `only` 能执行函数 child 的两处说法，实测都不成立，我改过来了。

给 children 批量注入属性靠 `React.cloneElement`，配合 `React.Children.map` 是标准写法，记得加 `isValidElement` 判断兜住字符串和 `null`。

至于要不要在新代码里用这套，我的看法是能用 Context 就别遍历 children。Context 传的是约定，遍历传的是结构，前者经得起重构，后者一改布局就断。React 官方把 `Children` 划进 Legacy API，理由也是这个。

## 参考

- [Children - React 官方文档](https://react.dev/reference/react/Children)
- [cloneElement - React 官方文档](https://react.dev/reference/react/cloneElement)
- [isValidElement - React 官方文档](https://react.dev/reference/react/isValidElement)
- [Passing Data Deeply with Context - React 官方文档](https://react.dev/learn/passing-data-deeply-with-context)
- [React v19 发布公告](https://react.dev/blog/2024/12/05/react-19)
- [React 19 新特性](https://feinterview.poetries.top/blog/react-19-new-features)
- [前端进阶之旅](https://interview.poetries.top)
