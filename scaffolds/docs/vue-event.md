---
title: vue事件（六）
date: 2018-08-27 00:10:32
tags: Vue
categories: Front-End
---

## 一、方法传参

```html
<div id="test">
    <button @click="sayHi('你好')">说你好</button> <!--这里使用@-->
    <button @click="sayHi('我被点击了')">说我被点击了</button> <!--这里使用@-->
</div>
<script type="text/javascript">
    var myVue = new Vue({
        el: '#test',
        methods: {      //这里使用methods
            sayHi: function (message) {
                alert(message)
            }
        }
    })
</script>

```

## 二、vue访问原生 DOM 事件

> 用`$event`获取

```html
<button @click="changeColor('你好',$event)">点击我</button> <!--这里使用@-->
<div style="height: 100px;width: 100px;background-color: red;" @mouseover="over('鼠标从我上面滑过',$event)">
    鼠标从我上面滑过试试
</div>
           
            
<script type="text/javascript">
    var myVue = new Vue({
        el: '#test',
        methods: {      //这里使用methods
            changeColor: function (message, event) {
                alert(message+event);    //弹出我被点击了,事件是[object MouseEvent]
            },
            over :function (message, event) {
                alert(message+event);   //弹出鼠标从我上面滑过,事件是[object MouseEvent]
            }
        }
    })
</script>

```

## 三、事件修饰符

> 事件修饰符有基本的6种

**.stop阻止事件冒泡**

```html
<a v-on:click.stop="doThis"></a>
```

**.prevent阻止默认事件**

```html
<form v-on:submit.prevent="onSubmit"></form>
```

**.capture时间捕获（从上到下）**

```html
<div v-on:click.capture="doThis">...</div>
```

**.self只在元素自身回调**

```html
<div v-on:click.self="doThat">...</div>
```

**.once只触发一次**

```html
<a v-on:click.once="doThis"></a>
```

> 使用修饰符时，顺序很重要；相应的代码会以同样的顺序产生。因此，用 `@click.prevent.self` 会阻止所有的点击，而 `@click.self.prevent` 只会阻止元素上的点击


## 四、键值修饰符

> 在监听键盘事件时，我们经常需要监测常见的键值。 Vue 允许为 v-on 在监听键盘事件时添加关键修饰符

```html
<div id="app">
    {{msg}}
    <input type="text" v-on:keydown="ke"/>
</div>
<script>
var app = new Vue({
        el:"#app",
        data:{
            msg:"事件处理",
            counter:0
        },
        methods:{
            ke:function(e){
                if(e.keyCode == 13){
                    this.msg = e.target.value;
                    e.target.value = "";
                }
            }
        }
});
</script>
```

- `enter`(回车)
- `tab`（tab切换）
- `delete` (捕获 “删除” 和 “退格” 键)
- `esc`（esc键）
- `space`（退档键）
- `up`（上键）
- `down`（下键）
- `left`（左键）
- `right`（右键）

> 我们也可以通过全局` config.keyCodes` 对象自定义键值修饰符别名


```
Vue.config.keyCodes.f1 = 112
```


、
