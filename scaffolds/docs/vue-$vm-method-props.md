---
title: vue实例方法（十三)
date: 2018-08-28 16:04:43
tags: Vue
categories: Front-End
---

## 一、Vue之实例属性

![](https://poetries1.gitee.io/img-repo/2019/10/613.png)

> `Vue` 实例暴露了一些有用的实例属性与方法。这些属性与方法都有前缀 `$`，以便与代理的数据属性区分

**组件树**

- `$parent`：用来访问组件实例的父实例
- `$root`: 用来访问当前组件树的根实例
- `$children`:用来访问当前组件实例的直接子组件实例
- `$refs`:用来访问`v-ref`指令的子组件

**DOM访问**

- `$el`：用来挂载当前组件实例的`dom`元素
- `$els`：用来访问`$el`元素中使用了`v-el`指令的`DOM`元素

```html
<div id="app2">
    {{ message }}
</div>
<script>
    var vm2 = new Vue({
        el:"#app2",
        data:{
            message : "I am message."
        }
    });
    console.log(vm2.$el);          //vm2.$el === 原生js中document.getElementById("app2") 
    vm2.$el.style.color = "red";   //变成红色
</script>
```

**数据访问**

- `$data`：用来访问组件实例观察的数据对象
- `$options`：用来访问组件实例化时的初始化选项对象

**DOM方法的使用**

- `$appendTo(elementOrSelector, callback)`：将`el`所指的`DOM`元素插入目标元素
- `$before(elementOrSelector, callback)`：将`el`所指的`DOM`元素或片段插入目标元素之前
- `$after(elementOrSelector, callback)`：将`el`所指的`DOM`元素或片段插入目标元素之后
- `$remove(callback)`：将`el`所指的`DOM`元素或片段从`DOM`中删除
- `$nextTick(callback)`：用来在下一次`DOM`更新循环后执行指定的回调函数

**event方法的使用**

- **监听**
  - `$on(event, callback)`：监听实例的自定义事件
  - `$once(event, callback)`：同上，但只能触发一次
  
- **触发**
  - `$dispatch(event, args)`：派发事件，先在当前实例触发，再沿父链一层层向上，对应的监听函数返回`false`停止
  - `$broadcast(event, args)`：广播事件，遍历当前实例的`$children`，如果对应的监听函数返回false，就停止
  - `$emit(event, args)`：触发事件
  
```html
<div id="ap2">
    <p>{{ num }}</p>
    <button @click="increase1"> add </button>
</div>
<button onclick="reduce2()"> reduce2 </button> <button onclick="offReduce()"> off reduce </button>
<script>
    var ap2 = new Vue({
        el:"#ap2",
        data:{
            num:5
        },
        methods:{
            increase1:function () {
                this.num ++;
            }
        }
    });
    // .$on定义事件 .$once定义只触发一次的事件
    ap2.$on("reduce",function (diff) {
        ap2.num -= diff ;
    });
 
    // .$emit触发事件
    function reduce2() {
        ap2.$emit("reduce", 2);
    }
 
    // .$off解除事件 解除后，定义的reduce事件将不再执行
    function offReduce() {
        ap2.$off("reduce");
    }
</script>
```


## 二、实例方法

### 2.1 $.watch()

```javascript

var data = { a: 1 }
var vm = new Vue({
  el: '#example',
  data: data
})
 
vm.$data === data // -> true
vm.$el === document.getElementById('example') // -> true
 
// $watch 是一个实例方法
vm.$watch('a', function (newVal, oldVal) {
    
})
  // 这个回调将在 `vm.a`  改变后调用

```

### 2.2 vm.$nextTick

> 将回调延迟到下次 `DOM` 更新循环之后执行。在修改数据之后立即使用它，然后等待 DOM 更新。它跟全局方法 `Vue.nextTick` 一样，不同的是回调的 `this` 自动绑定到调用它的实例上


```html
<div id="app">
</div>
<button onclick="vm.$destroy()">销毁实例 $destroy</button>
<button onclick="vm.$forceUpdate()">刷新构造器 $forceUpdate</button>
<button onclick="edit()">更新 $.nextTick(fn)</button>
<script>
    var Header = Vue.extend({
        template:`<p>{{ message }}</p>`,
        data:function () {
            return {
                message:"I am message"
            }
        },
        updated:function () {
            console.log("updated 更新之后");
        },
        destroyed:function () {
            console.log("destroy 销毁之后");
        }
    });
    var vm = new Header().$mount("#app");
 
    function edit() {
        vm.message = "new message";     //更新数据
        vm.$nextTick(function () {      //更新完成后调用
            console.log("更新完后，我被调用");
        })
    }

```

> 放在`Vue.nextTick()`回调函数中的执行的应该是会对`DOM`进行操作的 `js`代码

**什么时候需要用的Vue.nextTick()**

- 你在`Vue`生命周期的`created()`钩子函数进行的`DOM`操作一定要放在`Vue.nextTick()`的回调函数中。原因是什么呢，原因是在`created()`钩子函数执行的时候`DOM` 其实并未进行任何渲染，而此时进行`DOM`操作无异于徒劳，所以此处一定要将`DOM`操作的js代码放进`Vue.nextTick()`的回调函数中。与之对应的就是`mounted`钩子函数，因为该钩子函数执行时所有的`DOM`挂载和渲染都已完成，此时在该钩子函数中进行任何`DOM`操作都不会有问题 。
- 在数据变化后要执行的某个操作，而这个操作需要使用随数据改变而改变的`DOM`结构的时候，这个操作都应该放进`Vue.nextTick()`的回调函数中
- 为了在数据变化之后等待 `Vue` 完成更新 `DOM` ，可以在数据变化之后立即使用 `Vue.nextTick(callback)` 。这样回调函数在 `DOM` 更新完成后就会调用
