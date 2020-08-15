---
title: vue生命周期（五）
date: 2018-08-26 17:21:32
tags: Vue
categories: Front-End
---

> 每个Vue实例在被创建之前都要经过一系列的初始化过程,这个过程就是vue的生命周期

![](https://cn.vuejs.org/images/lifecycle.png)

## 一、生命周期钩子函数

- `beforeCreate`
- `created`
- `beforeMount`
- `mounted`
- `beforeUpdate`
- `updated`
- `beforeDestroy`
- `destroyed`

```javascript
var vm = new Vue({
    el: '#app',
    data: {
      message: 'Vue的生命周期'
    },
    beforeCreate: function() {
      console.group('------beforeCreate创建前状态------');
      console.log("%c%s", "color:red" , "el     : " + this.$el); //undefined
      console.log("%c%s", "color:red","data   : " + this.$data); //undefined 
      console.log("%c%s", "color:red","message: " + this.message) 
    },
    created: function() {
      console.group('------created创建完毕状态------');
      console.log("%c%s", "color:red","el     : " + this.$el); //undefined
      console.log("%c%s", "color:red","data   : " + this.$data); //已被初始化 
      console.log("%c%s", "color:red","message: " + this.message); //已被初始化
    },
    beforeMount: function() {
      console.group('------beforeMount挂载前状态------');
      console.log("%c%s", "color:red","el     : " + (this.$el)); //已被初始化
      console.log(this.$el);
      console.log("%c%s", "color:red","data   : " + this.$data); //已被初始化  
      console.log("%c%s", "color:red","message: " + this.message); //已被初始化  
    },
    mounted: function() {
      console.group('------mounted 挂载结束状态------');
      console.log("%c%s", "color:red","el     : " + this.$el); //已被初始化
      console.log(this.$el);    
      console.log("%c%s", "color:red","data   : " + this.$data); //已被初始化
      console.log("%c%s", "color:red","message: " + this.message); //已被初始化 
    },
    beforeUpdate: function () {
      console.group('beforeUpdate 更新前状态===============》');
      console.log("%c%s", "color:red","el     : " + this.$el);
      console.log(this.$el);   
      console.log("%c%s", "color:red","data   : " + this.$data); 
      console.log("%c%s", "color:red","message: " + this.message); 
    },
    updated: function () {
      console.group('updated 更新完成状态===============》');
      console.log("%c%s", "color:red","el     : " + this.$el);
      console.log(this.$el); 
      console.log("%c%s", "color:red","data   : " + this.$data); 
      console.log("%c%s", "color:red","message: " + this.message); 
    },
    beforeDestroy: function () {
      console.group('beforeDestroy 销毁前状态===============》');
      console.log("%c%s", "color:red","el     : " + this.$el);
      console.log(this.$el);    
      console.log("%c%s", "color:red","data   : " + this.$data); 
      console.log("%c%s", "color:red","message: " + this.message); 
    },
    destroyed: function () {
      console.group('destroyed 销毁完成状态===============》');
      console.log("%c%s", "color:red","el     : " + this.$el);
      console.log(this.$el);  
      console.log("%c%s", "color:red","data   : " + this.$data); 
      console.log("%c%s", "color:red","message: " + this.message)
    }
  })
```

![](https://poetries1.gitee.io/img-repo/2019/10/627.png)


## 二、生命周期详解

> `vue`实例在创建过程中调用的几个生命周期钩子

### 2.1 beforeCreate、created

> 在beforeCreate和created钩子函数之间的生命周期

- 在这个生命周期之间，进行初始化事件，进行数据的观测，可以看到在`created`的时候数据已经和`data`属性进行绑定（放在`data`中的属性当值发生改变的同时，视图也会改变）,此时还是没有el选项

### 2.2 created、beforeMount

> created钩子函数和beforeMount间的生命周期

![](https://poetries1.gitee.io/img-repo/2019/10/628.png)

- 首先会判断对象是否有el选项。如果有的话就继续向下编译，如果没有`el`选项，则停止编译，也就意味着停止了生命周期，直到在该vue实例上调用`vm.$mount(el)`。
- 此时注释掉代码中 `el: '#app',` 然后运行可以看到到`created`的时候就停止了

![](https://poetries1.gitee.io/img-repo/2019/10/629.png)


> 如果我们在后面继续调用`vm.$mount(el)`,可以发现代码继续向下执行了

- ` vm.$mount(el) ` //这个el参数就是挂在的dom接点

**template参数选项的有无对生命周期的影响**

- 如果vue实例对象中有template参数选项，则将其作为模板编译成`render`函数
- 如果没有`template`选项，则将外部HTML作为模板编译
- 可以看到`template`中的模板优先级要高于`outer HTML`的优先级

> 修改代码如下, 在HTML结构中增加了一串html，在`vue`对象中增加了`template`选项

```html
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>vue生命周期学习</title>
  <script src="https://cdn.bootcss.com/vue/2.4.2/vue.js"></script>
</head>
<body>
  <div id="app">
    <!--html中修改的-->
    <h1>{{message + '这是在outer HTML中的'}}</h1>
  </div>
</body>
<script>
  var vm = new Vue({
    el: '#app',
    template: "<h1>{{message +'这是在template中的'}}</h1>", //在vue配置项中修改的
    data: {
      message: 'Vue的生命周期'
    }
</script>
</html>
```

> 输出 `Vue的生命周期--这是在template中的`

那么将vue对象中`template`的选项注释掉后打印如下信息

> 输出 `Vue的生命周期--这是在outer HTML中的`

- 可以想想什么el的判断要在template之前了~是因为vue需要通过el找到对应的outer template
- 在vue对象中还有一个render函数，它是以createElement作为参数，然后做渲染操作，而且我们可以直接嵌入JSX.

```javascript
new Vue({
    el: '#app',
    render: function(createElement) {
        return createElement('h1', 'this is createElement')
    }
})
```

**所以综合排名优先级**

- `render`函数选项 > `template`选项 > `outer HTML`

### 2.3 beforeMount、mounted

> beforeMount和mounted钩子函数间的生命周期

![](https://poetries1.gitee.io/img-repo/2019/10/630.png)

> 可以看到此时是给`vue`实例对象添加`$el`成员，并且替换掉挂在的`DOM`元素。因为在之前`console`中打印的结果可以看到`beforeMount`之前`el`上还是`undefined`

### 2.4 mounted

![](https://poetries1.gitee.io/img-repo/2019/10/631.png)

> 在`mounted`之前h1中还是通过`{message}`进行占位的，因为此时还有挂在到页面上，还是JavaScript中的虚拟DOM形式存在的。在`mounted`之后可以看到h1中的内容发生了变化

### 2.5 beforeUpdate、updated

> `beforeUpdate`钩子函数和`updated`钩子函数间的生命周期

![](https://poetries1.gitee.io/img-repo/2019/10/632.png)

> 当vue发现data中的数据发生了改变，会触发对应组件的重新渲染，先后调用`beforeUpdate`和`updated`钩子函数。我们在console中输入

```
vm.message = '触发组件更新'
```

发现触发了组件的更新

![](https://poetries1.gitee.io/img-repo/2019/10/633.png)


### 2.6 beforeDestroy、destroyed

> `beforeDestroy`和`destroyed`钩子函数间的生命周期

![](https://poetries1.gitee.io/img-repo/2019/10/634.png)

- `beforeDestroy`钩子函数在实例销毁之前调用。在这一步，实例仍然完全可用。
- `destroyed`钩子函数在`Vue` 实例销毁后调用。调用后，`Vue`实例指示的所有东西都会解绑定，所有的事件监听器会被移除，所有的子实例也会被销毁

