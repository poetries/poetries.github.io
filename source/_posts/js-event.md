---
title: JavaScript事件机制
date: 2018-12-21 22:40:21
tags: 
  - JavaScript
  - 事件机制
categories: Front-End
---

## 一、简介

> 事件流是一个事件沿着特定数据结构传播的过程。冒泡和捕获是事件流在`DOM`中两种不同的传播方法

**事件流有三个阶段**

- 事件捕获阶段
- 处于目标阶段
- 事件冒泡阶段

**事件捕获**

> 事件捕获（`event capturing`）：通俗的理解就是，当鼠标点击或者触发`dom`事件时，浏览器会从根节点开始由外到内进行事件传播，即点击了子元素，如果父元素通过事件捕获方式注册了对应的事件的话，会先触发父元素绑定的事件

**事件冒泡**

> 事件冒泡（dubbed bubbling）：与事件捕获恰恰相反，事件冒泡顺序是由内到外进行事件传播，直到根节点

无论是事件捕获还是事件冒泡，它们都有一个共同的行为，就是事件传播

![](https://poetries1.gitee.io/img-repo/2019/10/319.png)

## 二、捕获和冒泡

```html
<div id="div1">
  <div id="div2"></div>
</div>

<script>
    let div1 = document.getElementById('div1');
    let div2 = document.getElementById('div2');
    
    div1.onClick = function(){
        alert('1')
    }
    
    div2.onClick = function(){
        alert('2');
    }

</script>
```

> 当点击 `div2`时，会弹出两个弹出框。在 `ie8/9/10`、`chrome`浏览器，会先弹出"2"再弹出“1”，这就是事件冒泡：事件从最底层的节点向上冒泡传播。事件捕获则跟事件冒泡相反

> W3C的标准是先捕获再冒泡， `addEventListener`的第三个参数决定把事件注册在捕获（`true`）还是冒泡(`false`)

## 三、事件对象

![](https://poetries1.gitee.io/img-repo/2019/10/320.png)


## 四、事件流阻止

> 在一些情况下需要阻止事件流的传播，阻止默认动作的发生

- `event.preventDefault()`：取消事件对象的默认动作以及继续传播。
- `event.stopPropagation()/ event.cancelBubble = true`：阻止事件冒泡。

**事件的阻止在不同浏览器有不同处理**

- 在`IE`下使用 `event.returnValue= false`，
- 在非`IE`下则使用 `event.preventDefault()`进行阻止

**preventDefault与stopPropagation的区别**

- `preventDefault`告诉浏览器不用执行与事件相关联的默认动作（如表单提交）
- `stopPropagation`是停止事件继续冒泡，但是对IE9以下的浏览器无效

## 五、事件注册

- 通常我们使用 `addEventListener` 注册事件，该函数的第三个参数可以是布尔值，也可以是对象。对于布尔值 `useCapture` 参数来说，该参数默认值为 `false`。`useCapture` 决定了注册的事件是捕获事件还是冒泡事件
- 一般来说，我们只希望事件只触发在目标上，这时候可以使用 `stopPropagation` 来阻止事件的进一步传播。通常我们认为 `stopPropagation` 是用来阻止事件冒泡的，其实该函数也可以阻止捕获事件。`stopImmediatePropagation` 同样也能实现阻止事件，但是还能阻止该事件目标执行别的注册事件

```js
node.addEventListener('click',(event) =>{
	event.stopImmediatePropagation()
	console.log('冒泡')
},false);
// 点击 node 只会执行上面的函数，该函数不会执行
node.addEventListener('click',(event) => {
	console.log('捕获 ')
},true)
```


## 六、事件委托

- 在`js`中性能优化的其中一个主要思想是减少`dom`操作。

> 假设有`100`个`li`，每个`li`有相同的点击事件。如果为每`个Li`都添加事件，则会造成`dom`访问次数过多，引起浏览器重绘与重排的次数过多，性能则会降低。
使用事件委托则可以解决这样的问题

**原理**

> 实现事件委托是利用了事件的冒泡原理实现的。当我们为最外层的节点添加点击事件，那么里面的`ul`、`li`、`a`的点击事件都会冒泡到最外层节点上，委托它代为执行事件

```html
<ul id="ul">
    <li>1</li>
    <li>2</li>
    <li>3</li>
</ul>
```

```js
window.onload = function(){
    var ulEle = document.getElementById('ul');
    ul.onclick = function(ev){
        //兼容IE
        ev = ev || window.event;
        var target = ev.target || ev.srcElement;
        
        if(target.nodeName.toLowerCase() == 'li'){
            alert( target.innerHTML);
        }
        
    }
}
```
