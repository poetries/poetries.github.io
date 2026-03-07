---
title: 实现一个迷你版的redux
date: 2018-07-23 09:20:24
tags: 
 - JavaScript
 - react
categories: Front-End
---

### 迷你版redux实现

```javascript
export const createStore = (reducer,enhancer)=>{
	if(enhancer) {
		return enhancer(createStore)(reducer)
	}
	let currentState = {}
	let currentListeners = []

	const getState = ()=>currentState
	const subscribe = (listener)=>{
		currentListeners.push(listener)
	}
	const dispatch = action=>{
		currentState = reducer(currentState, action)
		currentListeners.forEach(v=>v())
		return action
	}
	dispatch({type:'@@INIT'})
	return {getState,subscribe,dispatch}
}

//中间件实现
export applyMiddleWare(...middlewares){
	return createStore=>...args=>{
		const store = createStore(...args)
		let dispatch = store.dispatch

		const midApi = {
			getState:store.getState,
			dispatch:...args=>dispatch(...args)
		}
		const middlewaresChain = middlewares.map(middleware=>middleware(midApi))
		dispatch = compose(...middlewaresChain)(store.dispatch)
		return {
			...store,
			dispatch
		}
	}

// fn1(fn2(fn3())) 把函数嵌套依次调用
export function compose(...funcs){
	if(funcs.length===0){
		return arg=>arg
	}
	if(funs.length===1){
		return funs[0]
	}
	return funcs.reduce((ret,item)=>(...args)=>ret(item(...args)))
}


//bindActionCreator实现

function bindActionCreator(creator,dispatch){
    return ...args=>dispatch(creator(...args))
}
function bindActionCreators(creators,didpatch){
    //let bound = {}
    //Object.keys(creators).forEach(v=>{
   //     let creator = creator[v]
     //   bound[v] = bindActionCreator(creator,dispatch)
    //})
    //return bound
    
    return Object.keys(creators).reduce((ret,item)=>{
	    ret[item] = bindActionCreator(creators[item],dispatch)
    	return ret
    },{})
}
```

### react-redux实现

> 例子 provider组件就是使用context，把store放到context里，所有的子元素可以直接取到store

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

- 负责接收一个组件，把`state里`的一些数据放进去，返回一个组件
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


**自己造一个中间件**

```javascript
const thunk = ({dispatch,getState})=>next=>action=>{

	if(typeof action == 'function'){
		return action(dispatch,getState)
	}
	if(Array.isArray(action){
		return action.forEach(v=>dispatch(v))
	}
	//默认 什么都不做
	return next(action)
}
```
