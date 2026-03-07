---
title: vue计算属性与数据监听（十）
date: 2018-08-28 14:10:42
tags: Vue
categories: Front-End
---

## 一、监听属性

> 我们在工作中常常需要监听某一个属性值的变化，这个时候我们就需要用到了监听属性`watch`

### 1.1 基础版监听

> 场景如下：输入框输入你的年龄，如果年龄在0-15岁提示信息：你还是个小孩，如果年龄在 15-25岁，提示信息：你已经是个少年，如果年龄在25岁以上，提示信息：你已经长大了

```html
<template>
 <div id="app">
  年齡：<input type="number" v-model="age"><br>
  提示信息：<span>{{infoMsg}}</span>
 </div>
</template>

<script>
export default {
 data() {
  return {
   age: "",
   infoMsg:""
  }
 },
 watch:{
  age:function(val,oldval){
   if(val>0 && val<15){
    this.infoMsg="你还是个小孩"
   }else if(val>15 && val<25){
    this.infoMsg="你已经是个少年"
   }else{
    this.infoMsg="你已经长大了"
   }
  }
 }
}
</script>
```

### 1.2 进阶版监听

> 下面我们改变一下需求：基础规则不变，但是因为后台数据库的更改,我们需要提交一个这样的数据结构

```javascript
data() {
  return {
   info: {
    age: ""
   },
   infoMsg: ""
  };
 }
```

- 由于我们监听的是对象`info`中的属性`age`值的变化，所以我们需要使用到的是深度监听，具体代码如下

```html
<template>
 <div id="app">
  年齡：<input type="number" v-model="info.age"><br>
  提示信息：<span>{{infoMsg}}</span>
 </div>
</template>

<script>
export default {
 data() {
  return {
   info: {
    age: ""
   },
   infoMsg: ""
  };
 },
 watch: {
  info: {
   handler: function(val, oldval) {
    var that = this;
    if (val.age > 0 && val.age < 15) {
     that.infoMsg = "你还是个小孩";
    } else if (val.age > 15 && val.age < 25) {
     that.infoMsg = "你已经是个少年";
    } else {
     that.infoMsg = "你已经长大了";
    }
   },
   deep: true
  }
 }
};
</script>
```

- 这里的`function`不能使用箭头函数替代，如果使用箭头函数的话，`this`的指向会是全局
- 你会注意到这里多加入一个属性是`deep`，它的含义表示是否开启深度监听，如果开启值为`true`，反之为`false`

### 1.3 高级版监听

```html
<template>
 <div id="app">
  年齡：<input type="number" v-model="info.age"><br>
  提示信息：<span>{{infoMsg}}</span>
 </div>
</template>
<script>
export default {
 data() {
  return {
   info: {
    age: "",
    name: "",
    hobit: ""
   },
   infoMsg: ""
  };
 },
 computed: {
  ageval: function() {
   return this.info.age;
  }
 },
 watch: {
  ageval: {
   handler: function(val, oldval) {
    var that = this;
    if (val > 0 && val < 15) {
     that.infoMsg = "你还是个小孩";
    } else if (val > 15 && val < 25) {
     that.infoMsg = "你已经是个少年";
    } else {
     that.infoMsg = "你已经长大了";
    }
   },
   deep: true
  }
 }
};
</script>
```

> 这次我们监听的是计算属性`ageval`，而计算属性返回的则是`info`对象中`age`的值，与第二次的代码进行比较我们可以发现两次代码中监听的一个是对象`info`，一个是`info`对象中`age`的值

## 二、计算属性

### 2.1 什么是计算属性

> 模板内的表达式非常便利，但是设计它们的初衷是用于简单运算的。在模板中放入太多的逻辑会让模板过重且难以维护。例如

```html
<div id="example">
  {{ message.split('').reverse().join('') }}
</div>
```

> 遇到复杂逻辑时应该使用Vue特带的计算属性`computed`来进行处理

### 2.2 计算属性的用法

> 在一个计算属性里可以完成各种复杂的逻辑，包括运算、函数调用等，只要最终返回一个结果就可以

```html
<div id="example">
  <p>Original message: "{{ message }}"</p>
  <p>Computed reversed message: "{{ reversedMessage }}"</p>　<!--我们把复杂处理放在了计算属性里面了-->
</div>
```

```javascript
var vm = new Vue({
    el: '#example',
    data: {
        message: 'Hello'
    },
    computed: {
        reversedMessage: function () {
            // `this` 指向 vm 实例
            return this.message.split('').reverse().join('')
        }
    }
});
```

> 计算属性还可以依赖多个Vue 实例的数据，只要其中任一数据变化，计算属性就会重新执行，视图也会更新

```html
<div id="app">
    <button @click="add()">补充货物1</button>
    <div>总价为：{{price}}</div>
</div>
```

```javascript
var app = new Vue({        
       el: '#app', 
   data: {
       package1: {
           count: 5,
           price: 5
       },
       package2: {
           count: 10,
           price: 10
       }
    },
    computed: {
     price: function(){
         return this.package1.count*this.package1.price+this.package2.count*this.package2.price　　//总价随着货物或价格的改变会重新计算
     }
    },
    methods: {   //对象的方法
        add: function(){
            this.package1.count++
        }
    }
});
```

- 每一个计算属性都包含一个`getter` 和一个`setter` ，我们上面的两个示例都是计算属性的默认用法， 只是利用了`getter` 来读取
- 在你需要时，也可以提供一个`setter` 函数， 当手动修改计算属性的值就像修改一个普通数据那样时，就会触发`setter` 函数，执行一些自定义的操作，例如

```javascript
var vm = new Vue({
    el: '#demo',
    data: {
        firstName: 'Foo',
        lastName: 'Bar'
    },
    computed: {
        fullName: {
            // getter
            get: function () {
                return this.firstName + ' ' + this.lastName
            },
            // setter
            set: function (newValue) {
                var names = newValue.split(' ');
                this.firstName = names[0];
                this.lastName = names[names.length - 1];
            }
        }
    }
});
//现在再运行 vm.fullName = 'John Doe' 时，setter 会被调用，vm.firstName 和 vm.lastName 也会相应地被更新。
```

> 绝大多数情况下，我们只会用默认的`getter` 方法来读取一个计算属性，在业务中很少用到`setter`,所以在声明一个计算属性时，可以直接使用默认的写法，不必将`getter` 和`setter `都声明

### 2.3 计算属性缓存

> 除了使用计算属性外，我们也可以通过在表达式中调用方法来达到同样的效果

```html
<div>{{reverseTitle()}}</div>
```

```javascript
// 在组件中
methods: {
  reverseTitle: function () {
    return this.title.split('').reverse().join('')
  }
}
```

- 我们可以将同一函数定义为一个方法而不是一个计算属性，两种方式的最终结果确实是完全相同的。只是一个使用`reverseTitle()`取值，一个使用`reverseTitle`取值。
- 然而，不同的是计算属性是基于它们的依赖进行缓存的。计算属性只有在它的相关依赖发生改变时才会重新求值。
- 这就意味着只要 `title`还没有发生改变，多次访问`reverseTitle`计算属性会立即返回之前的计算结果，而不必再次执行函数。

```html
<div>{{reverseTitle}}</div>
<div>{{reverseTitle1()}}</div>
<button @click="add()">补充货物1</button>
<div>总价为：{{price}}</div>

<script>
    computed: {
      reverseTitle: function(){
          return this.title.split('').reverse().join('')　　//而使用计算属性，只要title没变，页面渲染是不会重新进这里来计算的，而是使用了缓存。
      },
      price: function(){
         return this.package1.count*this.package1.price+this.package2.count*this.package2.price
      }
     },
    methods: {   //对象的方法
    add: function(){
        this.package1.count++
    },
    reverseTitle1: function(){
        return this.title.split('').reverse().join('')　　//点击补充货物，也会进这个方法，再次计算。不是刷新，而是只要页面渲染，就会进方法里重新计算。
    }
</script>
```
    
- 相比之下，每当触发重新渲染时，调用方法将总会再次执行函数。 
- 我们为什么需要缓存？假设我们有一个性能开销比较大的的计算属性 A，它需要遍历一个巨大的数组并做大量的计算。然后我们可能有其他的计算属性依赖于 A 
- 如果没有缓存，我们将不可避免的多次执行 A 的`getter`！如果你不希望有缓存，请用方法来替代
