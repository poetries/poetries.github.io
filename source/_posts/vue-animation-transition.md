---
title: vue过渡与动画（十五）
date: 2018-08-28 20:10:32
tags: Vue
categories: Front-End
---

## 一、transition标签结合css

![](https://poetries1.gitee.io/img-repo/2019/10/614.png)

> `vue.2.0`中的过渡动画利用自身的`transition`组件实现

**有四种情形可以实现过渡效果**

- 利用`v-if`渲染元素时
- 利用`v-show`展示或者隐藏元素时应用过渡生效
- 动态组件(把几个组件挂载到一个父节点上，在父节点绑定变量来决定显示哪个子组件)
- 组件根节点

> - 过渡有两种总的状态：即`enter`(过渡开始)和`leave`(过渡结束) 
> - 这两中状态再细分，可分出6种状态，对应6个类名
> - 在进入/离开的过渡中，会有 6 个 `class` 切换


![](https://poetries1.gitee.io/img-repo/2019/10/615.png)

![](https://poetries1.gitee.io/img-repo/2019/10/616.png)

![](https://poetries1.gitee.io/img-repo/2019/10/617.png)


> 控制元素的滑入与滑出，例如：`DOM`结构，要在`transition`组件上添加`name`属性，并在`css`中使用`name`的属性值替代以上`v-`状态种的`v`作为类名

```html
<transition name="slide">
    <div class="food" v-show="showFlag" @click="hide">
        <div class="food-content">
          <div class="imang-header">
            <img :src="food.image" >
          </div>
        </div>
    </div>
  </transition>
 ```
 
 css样式
 
```css
  .food
    position :fixed
    left:0
    top:0
    bottom: 48px
    z-index:30
    width :100%
    background :#fff
    /*定义元素最终移动到的位置，以及移动到此位置需要的时间*/
  .slide-enter-active
    transition: all .5s ease
    transform:translate3d(0,0,0)
    /*定义元素从什么位置离开，以及离开岛指定位置所需的时间*/
  .slide-leave-active
    transition: all .5s ease
    transform:translate3d(0,0,0)
    /*定义元素从100%的位置移入到0，过渡结束后再从0回到100%的位置*/
  .slide-enter,.slide-leave-to
    transform:translate3d(100%,0,0)
```

**单组件过渡**

```html
<transition name="fade">
    <p v-if="show">hello</p>
</transition>
```

```css
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
```

**类似的只需要在过度类中填写动画即可**

```css
.fade-enter-active, .fade-leave-active {
  animation: fade-in .5s;
}
.fade-enter, .fade-leave-to {
  animation:fade-in .5s reverse;
}
@keyframes bounce-in {
  0% {
    ooacity: 0;
  }
  50% {
    ooacity: .5;
  }
  100% {
    ooacity: 1;
  }
}
```


## 二、自定义过渡类名实现动画

![](https://poetries1.gitee.io/img-repo/2019/10/618.png)

> `animate.css`结合`transition`

> https://daneden.github.io/animate.css/

```html
<div id="app">
     <button @click="toggle">显示/隐藏</button><br>
     <transition 
     enter-active-class="animated fadeInRight"
     leave-active-class="animated fadeOutRight"
     >
       <!-- 坑：span行内元素（行内元素没有宽） 应该改为块级元素 -->
       <!-- <span class="show" v-show="isshow">it创业</span> -->
      <div style="width:200px" class="show" v-show="isshow">it创业</div> 
     </transition>
 </div>
```

## 三、js钩子函数实现动画

![](https://poetries1.gitee.io/img-repo/2019/10/619.png)

> 这些钩子函数可以结合 `CSS transitions/animations `使用，也可以单独使用。


```html
<transition
  v-on:before-enter="beforeEnter"
  v-on:enter="enter"
  v-on:after-enter="afterEnter"
  v-on:enter-cancelled="enterCancelled"

  v-on:before-leave="beforeLeave"
  v-on:leave="leave"
  v-on:after-leave="afterLeave"
  v-on:leave-cancelled="leaveCancelled"
>
  <!-- ... -->
</transition>
```

```javascript
// ...
methods: {
  // --------
  // 进入中
  // --------

  beforeEnter: function (el) {
    // ...
  },
  // 此回调函数是可选项的设置
  // 与 CSS 结合时使用
  enter: function (el, done) {
    // ...
    done()
  },
  afterEnter: function (el) {
    // ...
  },
  enterCancelled: function (el) {
    // ...
  },

  // --------
  // 离开时
  // --------

  beforeLeave: function (el) {
    // ...
  },
  // 此回调函数是可选项的设置
  // 与 CSS 结合时使用
  leave: function (el, done) {
    // ...
    done()
  },
  afterLeave: function (el) {
    // ...
  },
  // leaveCancelled 只用于 v-show 中
  leaveCancelled: function (el) {
    // ...
  }
}
```

> 当只用 `JavaScript` 过渡的时候，在 `enter` 和 `leave` 中必须使用 `done` 进行回调。否则，它们将被同步调用，过渡会立即完成
