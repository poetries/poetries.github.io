---
title: vue之class与style绑定（三）
date: 2018-08-26 14:02:32
tags: Vue
categories: Front-End
---

## 一、绑定HTML class

> 有三种方法 1、直接绑定 2、数据属性绑定 3、计算属性绑定


### 1.1 对象语法

> 如果数据属性 发生改变，`class` 列表将相应地更新


```html
<div id="app">
    <div v-bind:class="{active:isActive}"></div>
</div>
<script>
var app = new Vue({
    el:"#app",
    data:{
        msg:"对象语法",
        isActive:true
    }
});
</script>
```


> `v-bind:class` 指令也可以与普通的 `class` 属性共存


```html
.active{
    width: 100px;
    height: 100px;
    background: red;
}
        
<div id="app">
    <div class = "box" v-bind:class="{active:isActive}"></div>
</div>
<script>
    var app = new Vue({
        el:"#app",
        data:{
            msg:"对象语法",
            isActive:true
        }
    });
</script>
```

**可以直接绑定数据里的一个对象**


```html
.active1{
    width: 100px;
    height: 100px;
    margin-top: 10px;
    border: 1px solid #ccc ;
}

<div id="app">
    <div v-bind:class="classObj"></div>
</div>
<script>
var app = new Vue({
    el:"#app",
    data:{
        classObj:{
            active:true,
            aaa:false
        }
    }
});
</script>
```


**可以在这里绑定返回对象的计算属性。这是一个常用且强大的模式**


```html
<style>
.aaa{
    background: green;
    width: 100px;
    height: 100px;
    margin-top: 10px;
}

</style>
<div id="app">
    <div v-bind:class="Obj"></div>
</div>
<script>
    var app = new Vue({
        el:"#app",
        data:{
            msg:"对象语法",
            isActive:true
        },
        computed:{
            Obj:function(){
                return{
                    aaa:this.isActive
                } 
            }
        }
    });
</script>
```

### 1.2 数组语法

> 我们可以把一个数组传给 `v-bind:class`，以应用一个 `class ` 列表

```html
<style>
    .active{
        width: 100px;
        height: 100px;
        background: red;
    }
    .active1{
        color: yellow;
    }
    .aaa{
       border: 5px solid #ccc;
    }
</style>

<div id="app">
    <div class = "box" v-bind:class="[isActive,isActive1,isActive2]">{{msg}}</div>
</div>
<script>
    var app = new Vue({
        el:"#app",
        data:{
            msg:"对象语法",
            isActive:"active",
            isActive1:"active1",
            isActive2:"aaa"
        }
    });
</script>
```

**可以用三元表达式**

```html
<style>
    .active{
        width: 100px;
        height: 100px;
        background: red;
    }
    .active1{
        color: yellow;
    }
    .aaa{
       border: 5px solid #ccc;
    }
</style>

<div id="app">
    <div class = "box" v-bind:class="[isActive,isActive1,isActive5 ? isActive2 : '']">{{msg}}</div>
</div>
<script>
    var app = new Vue({
        el:"#app",
        data:{
            msg:"对象语法",
            isActive5:false,
            isActive:"active",
            isActive1:"active1",
            isActive2:"aaa"
        }
    });
</script>
```

**当有多个条件 class 时这样写有些繁琐。可以在数组语法中使用对象语法**

```html
<style>
    .active{
        width: 100px;
        height: 100px;
        background: red;
    }
    .active1{
        color: yellow;
    }
    .aaa{
       border: 5px solid #ccc;
    }
</style>

<div id="app">
    <div class = "box" v-bind:class="[isActive,{active1:isActive5},isActive5 ? isActive2 : '']">{{msg}}</div>
</div>
<script>
    var app = new Vue({
        el:"#app",
        data:{
            msg:"对象语法",
            isActive5:true,
            isActive:"active",
            isActive1:"active1",
            isActive2:"aaa"
        }
    });
</script>
```

### 1.3 在组件上

> 在一个自定义组件上用到 class 属性的时候，这些类将被添加到根元素上面，这个元素上已经存在的类不会被覆盖

```html
<style>
    .active1{
        width: 100px;
        background: red;
    }
    .aaa{
        border: 5px solid #ccc;
    }
    .bbb{
        height: 100px;
    }
</style>

<div id="app">
    <tanchu v-bind:class="classObj"></tanchu>
</div>
<script>

    Vue.component('tanchu', {
        template: `<div class="bbb">
                <input type="button" value="弹出"/>
            </div>`
    })
    
    var app = new Vue({
        el:"#app",
        data:{
            classObj:{
                active1:true,
                aaa:true
            }
        }
    })
</script>
```

## 二、绑定内联样式

### 2.1 对象语法

```html
<div id="app">
    <div v-bind:style="{background:a,border:b,width:c}">内联样式</div>
    <div v-bind:style="classObj">内联样式</div>
</div>
<script>

    var app = new Vue({
        el:"#app",
        data:{
            a:"red",
            b:"5px solid #ccc",
            c:"100px"
            classObj:{
                background:"red",
                border:"5px solid #ccc",
                width:"100px",
                marginTop:"10px"
            }
        }
    })
</script>
```

### 2.2 数组语法

```html
<div id="app">
    <!-- 数组语法 -->
    <div v-bind:style="[classObj,classObj1]">内联样式</div>
</div>
<script>

    var app = new Vue({
        el:"#app",
        data:{
            classObj:{
                background:"red",
                border:"5px solid #ccc",
                width:"100px"
            },
            classObj1:{
                height:"100px"
            }
        }
    })
</script>
```

### 2.3 自动添加前缀

> 当 `v-bind:style` 使用需要特定前缀的 CSS 属性时，如 `transform`，`Vue.js` 会自动侦测并添加相应的前缀
