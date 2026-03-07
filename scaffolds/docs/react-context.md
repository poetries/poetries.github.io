---
title: React之context
date: 2018-07-23 09:50:12
tags: 
 - JavaScript
 - react
categories: Front-End
---


## 简介

- `React` 组件之间的通信是基于 `props` 的单向数据流，即父组件通过 `props` 向子组件传值，亦或是子组件执行传入的函数来更新父组件的`state`，这都满足了我们大部分的使用场景
- 一般地，对于兄弟组件之间的通信，是通过它们共同的祖先组件进行的，即 Lifting State Up，官方文档也有介绍。组件一通过事件将状态变更通知它们共同的祖先组件，祖先组再将状态同步到组件二
- 但是，如果组件之间嵌套的比较深，即使提升状态到共同父组件，再同步状态到相应的组件还是需要一层一层的传递下去，可能会比较繁琐
- 在对应的场景中，`context` 就可以缩短父组件到子组件的属性传递路径

## 例1

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

Parent.jsx

```javascript
import React from "react"

const Parent = (props) => (
    <div {...props} />
)

export default Parent
```

ChildOne.jsx

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

ChildTwo.jsx

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

> 在 `Container.childContextTypes` 中进行接口的声明，通过 `getChildContext` 返回更新后的`state`，在 `Child.contextTypes` 中声明要获取的接口，这样在子组件内部就能通过 `this.context` 获取到。通过 `Context` 这样一个中间对象，`ChildOne` 和 `ChildTwo` 就可以相互通信了


## 例2

> 组件嵌套传递属性，在导航里面引用`Page`中的变量

- 使用`context`来传递
- 使用props层级传递

> 使用`context`组件需要定义`propTypes`,需要严格校验、声明类型、字段

```javascript
class Page extends React.Component {
    static childContextTypes = {
       user:PropTypes.string
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
    static childContextTypes = {
       user:PropTypes.string
    }
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
    static childContextTypes = {
       user:PropTypes.string
    }
    render(){
        return (
          <div>
            <p>我是{this.context.user}的导航栏</p>
            <Siderbar />
          </div>
        )
    }
}
```

## context在Provider种应用

> `provider`组件就是使用`context`，把`store`放到`context`里，所有的子元素可以直接取到`store`

```javascript
import PropTypes from 'prop-types'
class Provider extends Component {
    static childContextTypes = {
        store:Protypes.object
    }
    constructor(props,context){
        super(props,context)
        this.store = props.store
    }
    getChildContext(){
        //把传进来的store放进全局
        return {store:this.store}
    }
    render(){
        return this.props.children
    }
}
```

> `connect` 负责连接组件，给到`redux`里的数据放到组件的属性里

- 负责接收一个组件，把`state`里的一些数据放进去，返回一个组件
- 数据变化的时候，能够通知组件

```javascript
//高阶组件写法
const connect = (mapStateToProps=state=>state,mapDispatchToProps={})=>(wrapperComponent)=>{
    return class ConnectComponent extends React.Component {
        //负责接收组件
        static contextTypes = {
            store:PropTypes.obejct
        }
        constructor(props){
            super(props, context){
                this.state = {
                    props:{}
                }
            }
        }
        componentDidMount(){
            const {store} = this.context
            store.subscribe(()=>this.update())
            this.update()
        }
        update(){
            //  获取mapStateToProps、mapDispatchToProps 放入this.props里
            
            const {store}=this.context
            const stateProps = mapStateToProps(store.getState())
            const dispatchProps = bindActionCreators(mapDispatchProps,store.dispatch)
            this.setState({
                props:{
                    ...this.state.props,
                    ...stateProps,
                    ...dispatchProps
                 }
            })
        }
        render(){
            // 把数据放入
            return <wrapperComponent {...this.state.props}/>
        }
    }
}
```
