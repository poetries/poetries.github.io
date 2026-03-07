---
title: 浅析React高阶组件HOC
date: 2018-07-23 00:10:24
tags: 
 - JavaScript
 - react
categories: Front-End
---

### 高阶组件是什么

- 高阶组件其实就是一个函数，传入一个组件返回一个新的组件。它接受一个组件作为参数，返回一个新的组件。这个新的组件会使用你传给它的组件作为子组件
- 高阶组件的作用其实不言而喻，其实就是为了组件之间的代码复用。组件可能有着某些相同的逻辑，把这些逻辑抽离出来，放到高阶组件中进行复用。高阶组件内部的包装组件和被包装组件之间通过 props 传递数据

### 如何实现高阶组件

> 高阶组件其实就是处理react组件的函数。那么我们如何实现一个高阶组件？有两种方法

**属性代理**

> 属性代理是最常见的实现方式，将被处理组件的props和新的props一起传递给新组件

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

> 在其他组件里，我们引用这个高阶组件，用来强化它

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

> 使用ES6写法可以更加简洁

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

> 从代码中看，就是使用HOC这个函数，向被处理的组件WrappedComponent上面添加一些属性，并返回一个包含原组件的新组件


**反向继承**

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



