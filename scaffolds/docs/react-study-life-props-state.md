---
title: React之组件的生命周期以及属性状态（三）
date: 2017-11-19 10:12:24
tags: 
 - JavaScript
 - react
categories: Front-End
---

一、什么是生命周期
---

![](https://poetries1.gitee.io/img-repo/2019/10/464.png)

- 组件本质是状态机，输入确定，输出一定确定
- 一个`state`对应一个`render`，状态转换的时候会触发不同的函数，从而让开发者有机会做出响应，可以用事件的思路理解状态，但是事件与事件之间没有关联，而状态与状态之间可能会有关联

![](https://poetries1.gitee.io/img-repo/2019/10/465.png)

二、初始化阶段
---

**设置初始的属性与状态**

- `getDefaultProps`：设置初始的属性，只在第一次调用，实例之间共享引用
- `getInitialState`：设置初始的状态
- `componentWillMount`：组件将要加载，`render`之前最后一次修改状态的机会
- `render`：只能访问`this.props`与`this.state`，只有一个顶层标签（组件），不允许修改状态和`DOM`输出
- `componentDidMount`：成功`render`并渲染完成真实`DOM`之后出发，可以修改`DOM`，要操作`DOM`也必须在这个阶段完成

```javascript
var Demo = React.createClass({
    // 第一步执行顺序：设置初始的属性，指执行一次
    getDefaultProps:function(){
        return {
            name:'一个盒子',
            title:'box'
        }
    },
    // 第二步执行顺序：设置初始的状态
    getInitialState:function(){
        return {
            sss: this.props.name
        }
    },
    // 第三步执行：组件将要加载的时候，最后一次可以修改状态的机会
    componentWillMount:function(){
        this.setState({
            sss:'修改状态'
        })
        // alert('componentWillMount')
        // 这里是没有办法获取到这个节点的
        // var box = this.refs.box;
        // alert(box.clientWidth)
    },
    // 第四步：render渲染
    render:function(){
        // console.log(this)
        var styles = {
            position:'absolute',
            width: '100px',
            height: '100px',
            color: 'red',
            background: 'lime'
        }
        return <div ref="box" style={styles}>{this.props.title}{this.state.sss}</div>
    },
    // 第五步：组件加载完成，只有在这一个阶段，我们才可以操作DOM节点
    componentDidMount:function(){
        // alert('componentDidMount')
        // 下面的this指向组件
        console.log(this)
        var box = this.refs.box;
        var timer = null;
        var n = 0;
        box.onclick = function(){
            console.log(1)
            // 这个this指向box
            console.log(this)
            var This = this;
            timer = setInterval(function(){
                // 这个this指向window
                // console.log(this)
                n++;
                This.style.left = n + 'px';
                This.style.top = n + 'px';
            },60)
        }
    }
})
ReactDOM.render(<Demo/>,document.getElementById("app"))
```


三、运行中阶段	
---

- `componentWillReceiveProps`：父组件修改属性触发，可以修改新属性，修改状态
- `shouldCompoenntUpdate`：组件是否更新，返回`false`会阻止`render`调用，`render`后面的函数都不会执行
- `componentWillUpdate`：不能修改属性与状态，用于日志打印与数据获取
- `reder`：只能访问`this.props与this.state`，只有一个顶层标签（组件），不允许修改状态和`DOM`输出
- `componentDidUpdate`：可以修改`DOM`

```javascript
var HelloReact = React.createClass({
    // 组件将要接收新的属性
    componentWillReceiveProps:function(newProps){
        console.log('componnetWillReceiveProps',1)
        console.log(newProps)
    },
    // 是否允许组件更新，返回true或者false，一般不会改变它的默认值：true
    shouldComponentUpdate:function(newProps,newState){
        console.log('shouldComponentUpdate',2)
        console.log(newProps,newState)
        return true;
    },
    // 组件将要更新
    componentWillUpdate:function(){
        console.log('componentWillUpdate',3)
    },
    render:function(){
        console.log('render',4)
        return <p>Hello {this.props.name?this.props.name:'React'}</p>
    },
    // 组件更新完毕
    componentDidUpdate:function(){
        console.log('componentDidUpdate',5)
    }
})
var Demo = React.createClass({
    getInitialState:function(){
        return {
            name:''
        }
    },
    handleChange:function(e){
        this.setState({
            name:e.target.value
        })
    },
    render:function(){ 
        return(
            <div>
                <HelloReact name={this.state.name}/>
                <input type="text" onChange={this.handleChange} />
            </div>
        )
    }
})
ReactDOM.render(<Demo/>,document.getElementById("app"))
```


四、销毁阶段
---

- `componentWillUnmount`：组件将要卸载
- 在`ReactDOM`中提供一个方法`unmountComponentAtNode`(删除节点的名字)

```javascript
var HelloReact = React.createClass({
    // 组件将要接收新的属性
    componentWillReceiveProps:function(newProps){
        console.log('componnetWillReceiveProps',1)
        console.log(newProps)
    },
    // 是否允许组件更新，返回true或者false，一般不会改变它的默认值：true
    shouldComponentUpdate:function(newProps,newState){
        console.log('shouldComponentUpdate',2)
        console.log(newProps,newState)
        return true;
    },
    // 组件将要更新
    componentWillUpdate:function(){
        console.log('componentWillUpdate',3)
    },
    render:function(){
        console.log('render',4)
        return <p>Hello {this.props.name?this.props.name:'React'}</p>
    },
    // 组件更新完毕
    componentDidUpdate:function(){
        console.log('componentDidUpdate',5)
    },
    componentWillUnmount:function(){
        console.log('BOOOOOOOOOOOOOOOOOM')
    }
})
var Demo = React.createClass({
    getInitialState:function(){
        return {
            name:''
        }
    },
    handleChange:function(e){
        // 利用input输入的内容来卸载组件
        if(e.target.value == '1234'){
            ReactDOM.unmountComponentAtNode(document.getElementById("app"))
            // 写上这个return是为了不执行下面的语句，减少代码执行时间
            return ;
        }
        this.setState({
            name:e.target.value
        })
    },
    render:function(){
        // 通过判断state的状态来卸载组件
       /* if( this.state.name == '1234'){
            return <div>1234</div>
        }*/
        return(
            <div>
                <HelloReact name={this.state.name}/>
                <input type="text" onChange={this.handleChange} />
            </div>
        )
    }
})
ReactDOM.render(<Demo/>,document.getElementById("app"))
```

五、属性状态
---

**属性的含义与用法**

- 含义：`props = properties`
- 属性：一个事物的性质与关系，属性往往是与生俱来，无法自己改变的

```javascript
// 组件传递props
var Demo = React.createClass({
    render:function(){
        return <div>{this.props.title}</div>
    }
})
ReactDOM.render(<Demo title={"Demo"}/>,document.getElementById("app"))
``` 

```javascript
/*
    ...this.props
    props的一个语法糖，可以将父组件中的全部属性复制给子组件，
    如果是这个标签本身拥有的这个属性
*/
var Demo = React.createClass({
    render:function(){
        return (<div>
            <div>{this.props.title}</div>
            <a {...this.props}>{this.props.title}</a>
        </div>)
    }
})
var props = {
    title:'百度',
    href:'http://www.baidu.com'
}
ReactDOM.render(<Demo {...props}/>,document.getElementById("app"))
```

- `this.props.chilidren`

```javascript
/*
    this.props.children
    children没有与组件的属性一一对应，表示组件的所有子节点
    一般用于列表
*/
console.log(React)
var List = React.createClass({
    render:function(){
        return(<ul>
            {
                /*
                    列表项的数量以及内容不确定，在创建模板的时候需确定
                    利用this.props.chilidren从父组件获取需要的内容
                    利用React.Children.map方法进行children的遍历
                */
                React.Children.map(this.props.children,function(child){
                    return <li>{child}</li>
                })
            }
        </ul>)
    }
})
ReactDOM.render(
    <List>
        <h1><a href="">百度</a></h1>
        <a href="http://www.baidu.com">http://www.baidu.com</a>
    </List>,
    document.getElementById("app")
)
```

- `PropTypes`

```javascript
// 属性验证：PropTypes   
// 验证组件的属性是否符合要求
var Demo = React.createClass({
    PropTypes:{
        // 要求title的类型必须是一个字符串
        title:React.PropTypes.string.isRequired
    },
    render:function(){
        return <div>{this.props.title}</div>
    }
})
ReactDOM.render(<Demo title={'title'} />,document.getElementById("app"))
```

**属性的两种用法**

- `<Demo   title=?  />` **`？`中的内容可以是**
  - 字符串
  - 对象`{}`
  - 数组`{[1,2,3]}`
  - 变量`{var}`

```javascript
<Demo  {…props} />
var  props = {
	one:”123”,
	two:”456”
}
```

**状态的含义与用法**

- `state`
- 状态：事物所处的状况
- 状态是由事物自行处理，不断变化的。父组件与子组件都无法改变他的状态

状态的用法
---

- `getInitialState`：初始化状态
- `setState`：更新状态

```javascript
/*
    state 状态的意思，一般在页面中存在状态的变化以及涉及到与状态相关的
        东西的时候会用他
    作用：根据不同的状态显示不同的UI界面
*/

var Demo = React.createClass({
    // 设置初始的状态
    getInitialState: function(){
        return {
            // 这里的值可以是一个boolean，string，function
            onOff: true
        }
    },
    handleClick:function(){
        // 通过点击事件来修改状态值，原来的状态值需要使用this.state获取
        this.setState({
            onOff: !this.state.onOff
        })
    },
    render: function(){
        // 每一个更新状态的时候，这个render函数都会重新被调用
        return (<div onClick={this.handleClick}>{this.state.onOff?'data1':'data2'}</div>)
    }
})
ReactDOM.render(<Demo />,document.getElementById("app"))
```

```javascript
var Demo = React.createClass({
    // 设置默认的属性
    getDefaultProps: function(){
        return {
            name: '现在的时间是：'
        }
    },
    // 设置初始的状态
    getInitialState: function(){
        return {
            time: new Date().toLocaleTimeString()
        }
    },
    changTime:function(){
        // 在定时器中使用this.setState的时候需要将这个this变保存起来
        var that = this;
        setInterval(function(){
            that.setState({
                time:new Date().toLocaleTimeString()
            })
        },1000)
    },
    render: function(){
        // 每一个更新状态的时候，这个render函数都会重新被调用
        return (<div onClick={this.changTime()}>{this.props.name}{this.state.time}</div>)
    }
})
ReactDOM.render(<Demo name='北京时间'/>,document.getElementById("app"))
```


**属性与状态的对比**

- 都是纯`JS`对象，使用`｛｝`创建的对象
- 都会触发`render`更新
- 都具有确定性，给定相同的属性或者是相同的状态，结果是相同的

**属性与状态的区分**

- 组件在运行时需要修改的数据就是状态
- 所有的数据都可以变成状态
