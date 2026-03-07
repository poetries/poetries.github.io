---
title: 浅析React children
date: 2019-09-01 16:10:40
tags: 
   - React
   - React.cloneElement
categories: Front-End
---


## 一、子组件

> 我们有一个组件 `<Grid />` 包含了几个组件 `<Row />` 。你可能会这么使用它

```html
<Grid>
  <Row />
  <Row />
  <Row />
</Grid>
```

> 这三个 `Row` 组件都成为了 `Grid` 的 `props.children` 。使用一个表达式容器，父组件就能够渲染它们的子组件


```js
class Grid extends React.Component {
  render() {
    return <div>{this.props.children}</div>
  }
}
```


> 父组件也能够决定不渲染任何的子组件或者在渲染之前对它们进行操作。例如，这个 `<Fullstop />` 组件就没有渲染它的子组件

```js
class Fullstop extends React.Component {
  render() {
    return <h1>Hello world!</h1>
  }
}
```


## 二、任何东西都能是一个child

> `React`中的`Children`不一定是组件，它们可以使任何东西。例如，我们能够将上面的文字作为`children`传递我们的 `<Grid /> `组件

```html
<Grid>Hello world!</Grid>
```

- `JSX`将会自动删除每行开头和结尾的空格，以及空行。它还会把字符串中间的空白行压缩为一个空格
- 你也可以将多种类型的`children`完美的结合在一起：

```html
<Grid>
  Here is a row:
  <Row />
  Here is another row:
  <Row />
</Grid>
```

## 三、child 的功能

- 我们能够传递任何的JavaScript表达式作为children，包括函数

> 为了说明这种情况，以下是一个组件，它将执行一个传递过来的作为child的函数


```js
class Executioner extends React.Component {
  render() {
    // See how we're calling the child as a function?
    //                        ↓
    return this.props.children()
  }
}
```


你会像这样的使用这个组件


```html
<Executioner>
  {() => <h1>Hello World!</h1>}
</Executioner>
```

## 四、操作children

> 从本质上来讲， `props.children` 可以使任何的类型，比如数组、函数、对象等

> React提供了一系列的函数助手来使得操作children更加方便

### 4.1 循环

> 两个最显眼的函数助手就是 `React.Children.map` 以及 `React.Children.forEach`。它们在对应数组的情况下能起作用，除此之外，当函数、对象或者任何东西作为`children`传递时，它们也会起作用

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

> `<IgnoreFirstChild />` 组件在这里会遍历所有的`children`，忽略第一个`child`然后返回其他的

```html
<IgnoreFirstChild>
  <h1>First</h1>
  <h1>Second</h1> // <- Only this is rendered
</IgnoreFirstChild>
```

> 在这种情况下，我们也可以使用``this.props.children.map` 的方法。但将一个函数作为child传递过来将会发生什么呢？`this.props.children` 会是一个函数而不是一个数组，接着我们就会产生一个error

> 然而使用 `React.Children.map`函数，无论什么都不会报错

```html
<IgnoreFirstChild>
  {() => <h1>First</h1>} // <- Ignored 💪
</IgnoreFirstChild>
```

### 4.2 计数


> 因为`this.props.children` 可以是任何类型的，检查一个组件有多少个`children`是非常困难的。天真的使用 `this.props.children.length` ，当传递了字符串或者函数时程序便会中断。假设我们有个child："Hello World!" ，但是使用 `.length` 的方法将会显示为12。

这就是为什么我们有 `React.Children.count` 方法的原因

```js
class ChildrenCounter extends React.Component {
  render() {
    return <p>React.Children.count(this.props.children)</p>
  }
}
```

> 无论时什么类型它都会返回`children`的数量

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

// Renders "3"
<ChildrenCounter>
  {() => <h1>First!</h1>}
  Second!
  <p>Third!</p>
</ChildrenCounter>
```

### 4.3 转换为数组

> 如果以上的方法你都不适合，你能将`children`转换为数组通过 `React.Children.toArray` 方法。如果你需要对它们进行排序，这个方法是非常有用的

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

上例会渲染为三个排好序的字符串


### 4.4 执行单一child


> 如果你回过来想刚才的 `<Executioner />` 组件，它只能在传递单一`child`的情况下使用，而且`child`必须为函数

```js
class Executioner extends React.Component {
  render() {
    return this.props.children()
  }
}
```

> 我们可以试着去强制执行 `propTypes` ，就像下面这样


```js
Executioner.propTypes = {
  children: React.PropTypes.func.isRequired,
}
```

> 这会使控制台打印出一条消息，部分的开发者将会把它忽视。相反的，我们可以使用在 `render` 里面使用 `React.Children.only`

```js
class Executioner extends React.Component {
  render() {
    return React.Children.only(this.props.children)()
  }
}
```

这样只会返回一个`child`。如果不止一个`child`，它就会抛出错误，让整个程序陷入中断——完美的避开了试图破坏组件的懒惰的开发者


## 五、编辑children

> 我们可以将任意的组件呈现为`children`，但是任然可以用父组件去控制它们，而不是用渲染的组件。为了说明这点，让我们举例一个 能够拥有很多 `RadioButton` 组件的 `RadiaGroup` 组件

> `RadioButtons` 不会从 `RadioGroup` 本身上进行渲染，它们只是作为`children`使用。这意味着我们将会有这样的代码


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

- 这段代码有一个问题。`input` 没有被分组
- 为了把 `input` 标签弄到同组，必须拥有相同的`name` 属性。当然我们可以直接给每个`RadioButton` 的`name` 赋值


```html
<RadioGroup>
  <RadioButton name="g1" value="first">First</RadioButton>
  <RadioButton name="g1" value="second">Second</RadioButton>
  <RadioButton name="g1" value="third">Third</RadioButton>
</RadioGroup>
```

### 5.1 改变children的属性

> 在`RadioGroup` 中我们将会添加一个叫做 `renderChildren` 的方法，在这里我们编辑`children`的属性

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

> 让我们开始遍历`children`获得每个`child`

```js
renderChildren() {
  return React.Children.map(this.props.children, child => {
    // TODO: Change the name prop to this.props.name
    return child
  })
}
```

我们如何编辑它们的属性呢？


### 5.2 React.cloneElement克隆元素

> `React.cloneElement` 会克隆一个元素。我们将想要克隆的元素当作第一个参数，然后将想要设置的属性以对象的方式作为第二个参数。

```js
const cloned = React.cloneElement(element, {
  new: 'yes!'
})
```

**React.cloneElement参数**

```
React.cloneElement(
  element,
  [props],
  [...children]
)
```

- 第一个参数：element
- 必须是一个存在的React组件或者原生DOM，以下都可以

```html
React.cloneElement(<div />)
React.cloneElement(<Child />)
```

> 但我们通常发现用的最多的是搭配`React.Children.map`和`this.props.children`使用，如下

```js
React.Children.map(this.props.children,child=>{
    React.cloneElement(child,{...props},children)
})
```

> 这正是我们的 `RadioGroup` 所需的。我们克隆所有的`child`并且设置`name` 属性

```js
renderChildren() {
  return React.Children.map(this.props.children, child => {
    return React.cloneElement(child, {
      name: this.props.name
    })
  })
}
```

> 最后一步就是传递一个唯一的 `name` 给`RadioGroup`

```js
<RadioGroup name="g1">
  <RadioButton value="first">First</RadioButton>
  <RadioButton value="second">Second</RadioButton>
  <RadioButton value="third">Third</RadioButton>
</RadioGroup>
```

> 没有手动添加 `name` 属性给所有的 `RadioButton` ，我们只是告诉了 `RadioGroup` 所需的`name`而已。
