---
title: React之JSX语法及非DOM操作属性（二）
date: 2017-11-19 10:11:24
tags: 
 - JavaScript
 - react
categories: Front-End
---

一、JSX是什么
---

- 一个语法或者说是语法糖
- 基于`ECMAScript`一种新的特性
- 一种定义带属性（`DOM`节点）树结构（`DOM`结构）的语法

**JSX不是**

- 一门新的语言
- `XML`或者`HTML`
- 一种限制，可以不使用`JSX`


二、JSX的特点
---

- 类`XML`语法，易于接受
- 增强`JS`语义，在`js`中编辑`HTML`
- 结构清晰
- 抽象程度高（核心）：避免手`动DOM`操作，跨平台
- 代码模块化


三、JSX语法
---

![](https://poetries1.gitee.io/img-repo/2019/10/463.png)

```javascript
/*
    JSX（javaScriptXML）语法入门：
        1、不是一门语言，是一个语法或者说是语法糖
        2、JSX标签其实就是HTML标签，只不过在javascript中这些标签的时候，
            不使用“”,遇到HTML标签（以<开始），就用HTML规则解析，遇到代码块
            （以{开始），就用javascript规则解析
        3、JSX语法浏览器无法解析，需要使用插件将其转化为js代码
        4、代码更加直观
*/
/*
    1、首字母必须大写
    2、驼峰命名
    3、使用className与htmlFor代替class和for
    4、组件与组件之间是可以嵌套的
    5、在JSX语法中只能使用求值表达式，不能使用语句
    6、只有一个顶层标签
*/
var Demo = React.createClass({
    change:function (){
        return 'demo'
    },
    handleClick:function(){
        alert(1)
    },
    render: function(){
        // this指向整个（当前的组件）组件
        return <div className="demo" onClick={this.handleClick}>这是一个{this.change()}</div>
    }
})
// console.log(Demo)
ReactDOM.render(<Demo />,document.getElementById('app'))
```

四、JSX的注释
---

- 在`JSX`语法中，添加注释需要写在 `{ }` 中
- 可以使用多行注释与单行注释

```javascript
var HelloWorld = React.createClass({
    render:function(){
        // 现在这里是属于js的部分,不属于JSX语法的部分
        return (
            <div className="box" // class名字
            >
                {/*这是一个标题*/}
                <h1 className="title">Hello World</h1>
                {/*这是说明*/}
                <p>你好世界！</p>
                <div className="box2">你好</div>
            </div>
        )
    }
})
ReactDOM.render(<HelloWorld/>,document.getElementById("app"))
```

五、JSX中使用样式
---

- 内联样式
- 对象样式
- 选择器样式（`CSS`样式）

```javascript
/*
组件的样式:
    1、行内样式：写行内样式的时候需要使用两个{}  ==>{{}}
    2、对象样式：在return前面定义一个样式对象，注意样式的写法，与HTML的不同点
    3、CSS样式

注意事项，在HTML5中与在React中的样式的书写区别：
    1、HTML5中以;结束
        在React中以,结束
    2、在HTML5中属性与值都不需要加上引号
        在React中，属于javascript对象，key中不能存在 - ,
        需要使用驼峰命名，如果是value值，需要加上引号
    3、在HTML中，设置带数字的值，宽度，高度==，需要带上单位
        在React中可以不用带单位，直接写数字
        这里是指那些规定了默认单位的值。比如说像素px，如果要使用em或者是rem则需要加上单位
*/
/*
{} 插值符号
在使用插值符号的是有，里面需要时一个对象或者是一个表达式
*/
var HelloWorld = React.createClass({
render:function(){
    var styles = {
        color: 'blue',
        fontSize: '30'
    }
    return (
        <div className="box">
            <h3 className="title" style={{color:'red',backgroundColor:'lime'}}>默认标题</h3>
            <p className="subtitle" style={styles}>说明</p>
            <p className="details">这个是用来教学的案例</p>
        </div>
    )
}
})
ReactDOM.render(<HelloWorld/>,document.getElementById("app"))
```

六、条件判断的四种写法
---

- 三元表达式		?	:
- 使用变量，通过函数使用条件判断语句，返回一个字符串
- 直接在`{}`中调用函数
- 使用比较运算符	`&&`   `||  `！`

```javascript
/*
1、三元表达式		?	:
2、使用变量，通过函数使用条件判断语句，返回一个字符串
3、直接在{}中调用函数
4、使用比较运算符	&&   ||  ！
*/
var Demo = React.createClass({
    // 设置初始的状态
    getInitialState:function(){
        return {
            onOff:true
        }
    },
    // 自定义一个点击事件
    handleClick:function() {
        this.setState({
            onOff:!this.state.onOff
        })
    },
    render:function(){
        return <div className={this.state.onOff?"box2":"box1"} onClick={this.handleClick}>我是一个盒子</div>
    }
})
ReactDOM.render(<Demo/>,document.body)
```

七、非DOM（元素）属性
---

- `dangerouslySetInnerHTML`：在`JSX`中直接插入`HTML`代码，动态的添加`HTML`内容，由用户添加。需要使用属性，`__html`
- `ref`：父组件引用子组件	`this.refs.name`
- `key`：目的提高渲染性能 ，涉及到`React diff`算法，`React`通过`key`值判断是否重新渲染
