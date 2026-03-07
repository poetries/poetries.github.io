---
title: es6在react中的应用
date: 2017-11-07 21:55:24
tags: 
 - JavaScript
 - react
categories: Front-End
---

一、数组遍历显示
---

```javascript
import React,{Component} from 'react';
class RepeatArray extends Component{
  constructor() {
    super();
  }
  render(){
    const names = ['Alice', 'Emily', 'Kate'];
    return (
      <div>
      {
        names.map((name) =>{return <div>Hello, {name}!</div>;} )
      }
      </div>
    );
  }
}
export default RepeatArray;
```

二、ol与li的实现
---

```javascript
import React,{Component} from 'react';
class RepeatLi extends Component{
  render(){
    return (
      <ol>
      {
        this.props.children.map((child)=>{return <li>{child}</li>})
      }
      </ol>
    );
  }
}
class RepeatArray extends Component{
  constructor() {
    super();
  }
  render(){
    return (
      <div>

      <RepeatLi>
        <span>hello</span>
        <span>world</span>
      </RepeatLi>

      </div>
    );
  }
}
export default RepeatArray;
```

三、从服务端获取数据
---

```javascript
import React,{Component} from 'react';
class UserGist extends Component{
  constructor(){
    super();
    this.state={
      username:'',
      lastGistUrl:''
    }
  }
  componentWillMount(){
    $.get(this.props.source, function(result) {
      var lastGist = result[0];
      //if (this.isMounted()) {
        this.setState({
          username: lastGist.owner.login,
          lastGistUrl: lastGist.html_url
        });
      //}
    }.bind(this));
  }
  render(){
    return(
      <div>
        {this.state.username} ..
        <a href={this.state.lastGistUrl} >here</a>
      </div>
    );
  }
}
class RepeatArray extends Component{
  constructor() {
    super();
  }
  render(){
    return (
      <div>
      <UserGist source="https://api.github.com/users/octocat/gists" />
      </div>
    );
  }
}
export default RepeatArray;
```

四、初始化STATE
---

```javascript
class Video extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            loopsRemaining: this.props.maxLoops,
        };
    }
}
```

五、解构与扩展操作符
---

> 在给子组件传递一批属性更为方便了。下面的例子把`className`以外的所有属性传递给`div`标签

```javascript
class AutoloadingPostsGrid extends React.Component {
    render() {
        var {
            className,
            ...others,  // contains all properties of this.props except for className
        } = this.props;
        return (
            <div className={className}>
                <PostsGrid {...others} />
                <button onClick={this.handleLoadMoreClick}>Load more</button>
            </div>
        );
    }
}
```

> 使用`react`开发最常见的问题就是父组件要传给子组件的属性较多时比较麻烦


```javascript
class MyComponent extends React.Component{
//假设MyComponent已经有了name和age属性
  render(){
    return (
      <SubComponent name={this.props.name} age={this.props.age}/>
     )
  }
}

```

> 使用扩展操作符可以变得很简单

```javascript
class MyComponent extends React.Component{
//假设MyComponent已经有了name和age属性
  render(){
    return (
      <SubComponent {...this.props}/>
     )
  }
}

```

> 上述方式是将父组件的所有属性都传递下去，如果这其中有些属性我不需要传递呢？也很简单

```javascript
class MyComponent extends React.Component{
//假设MyComponent有很多属性，而name属性不需要传递给子组件
  var {name,...MyProps}=this.props;
  render(){
    return (
      <SubComponent {...Myprops}/>
     )
  }
}

```
> 上述方法最常用的场景就是父组件的`class`属性需要被单独提取出来作为某个元素的`class`，而其他属性需要传递给子组件



六、创建组件
---

```javascript
import React,{Component} from "react";
class MyComponent extends Component{
//组件内部代码
}
```

七、State/Props/PropTypes
---

> `es6`允许将`props`和`propTypes`当作静态属性在类外初始化

```javascript
class MyComponent extends React.Component{}
MyComponent.defaultProps={
  name:"SunnyChuan",
  age:22
};
MyComponent.propTypes={
  name:React.PropTypes.string.isRequired,
  age:React.PropTypes.number.isRequired
};

```

> `es7`支持直接在类中使用变量表达式

```javascript
class MyComponent extends React.Component{
  static defaultProps={
    name:"SunnyChuan",
    age:22
  }
  static propTypes={
    name:React.PropTypes.string.isRequired,
    age:React.PropTypes.number.isRequired
  }
}
```

- `state`和前两个不同，它不是静态的

```javascript
class MyComponent extends React.Component{
  static defaultProps={
    name:"SunnyChuan",
    age:22
  }
  state={
     isMarried:false
  }
  static propTypes={
    name:React.PropTypes.string.isRequired,
    age:React.PropTypes.number.isRequired
  }
}

```

七、当你构建通用容器时，扩展属性会非常有用
---

```javascript
function App1() {
  return <Greeting firstName="Ben" lastName="Hector" />;
}

function App2() {
  const props = {firstName: 'Ben', lastName: 'Hector'};
  return <Greeting {...props} />;
}
```

八、使用es6的计算属性代替
---

```javascript
this.setState({
   [name]:value
})

//代替
var partialState = {};
partialState[name] = value;
this.setState(partialState);
```
