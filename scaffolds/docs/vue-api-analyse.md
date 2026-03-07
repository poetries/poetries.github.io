---
title: Vue API 盲点解析
date: 2019-06-02 00:40:12
tags: Vue
categories: Front-End
---

## 使用 performance 开启性能追踪

> `performance API` 是 `Vue `全局配置 `API` 中的一个，我们可以使用它来进行网页性能的追踪，我们可以在入口文件中添加

```js
if (process.env.NODE_ENV !== 'production') {
    Vue.config.performance = true;
}
```

> 来开启这一功能，该 API（2.2.0 新增）功能只适用于开发模式和支持 performance.mark API 的浏览器上，开启后我们可以下载 Vue Performance Devtool 这一 chrome 插件来看查看各个组件的加载情况，如图

![](https://user-gold-cdn.xitu.io/2018/8/7/165100a377b1bac9)

- 从中我们可以清晰的看到页面组件在每个阶段的耗时情况，而针对耗时比较久的组件，我们便可以对其进行相应优化

> 而其在 Vue 源码中主要使用了 `window.performance` 来获取网页性能数据，其中包含了 `performance.mark` 和 `performance.measure`

- `performance.mark` 主要用于创建标记
- `performance.measure` 主要用于记录两个标记的时间间隔

```js
performance.mark('start'); // 创建 start 标记
performance.mark('end'); // 创建 end 标记

performance.measure('output', 'start', 'end'); // 计算两者时间间隔

performance.getEntriesByName('output'); // 获取标记，返回值是一个数组，包含了间隔时间数据
```

> 熟练的使用 `performance` 我们可以查看并分析网页的很多数据，为我们项目优化提供保障。除了上述介绍的两个方法，我们还可以使用 `performance.timing` 来计算页面各个阶段的加载情况

## 使用 errorHandler 来捕获异常

> 在浏览器异常捕获的方法上，我们熟知的一般有：`try ... catch` 和 `window.onerror`，这也是原生 JavaScript 提供给我们处理异常的方式。但是在 Vue 2.x 中如果你一如既往的想使用 `window.onerror` 来捕获异常，那么其实你是捕获不到的，因为异常信息被框架自身的异常机制捕获了，你可以使用 `errorHandler` 来进行异常信息的获取

```js
Vue.config.errorHandler = function (err, vm, info) {
    let { 
        message, // 异常信息
        name, // 异常名称
        stack  // 异常堆栈信息
    } = err;

    // vm 为抛出异常的 Vue 实例
    // info 为 Vue 特定的错误信息，比如错误所在的生命周期钩子
}
```

> 在入口文件中加入上述代码后，我们便可以捕获到 `Vue` 项目中的一些异常信息了，但是需要注意的是 `Vue 2.4.0` 起的版本才支持捕获 `Vue` 自定义事件处理函数内部的错误，比如


```html
<template>
    <my-component @eventFn="doSomething"></my-component>
</template>

<script>
export default {
    methods: {
        doSomething() {
            console.log(a); // a is not defined
        }
    }
}
</script>
```

## 使用 nextTick 将回调延迟到下次 DOM 更新循环之后执行

在某些情况下，我们改变页面中绑定的数据后需要对新视图进行一些操作，而这时候新视图其实还未生成，需要等待 `DOM` 的更新后才能获取的到，在这种场景下我们便可以使用 `nextTick` 来延迟回调的执行。比如未使用 `nextTick` 时的代码

```html
<template>
    <ul ref="box">
        <li v-for="(item, index) in arr" :key="index"></li>
    </ul>
</template>

<script>
export default {
    data() {
        return {
            arr: []
        }
    },
    mounted() {
    	this.getData();
    },
    methods: {
        getData() {
            this.arr = [1, 2, 3];
            this.$refs.box.getElementsByTagName('li')[0].innerHTML = 'hello';
        }
    }
}
</script>
```

上方代码我们在实际运行的时候肯定会报错，因为我们获取 `DOM` 元素 `li` 的时候其还未被渲染，我们将方法放入 `nextTick` 回调中即可解决该问题

```js
this.$nextTick(() => {
    this.$refs.box.getElementsByTagName('li')[0].innerHTML = 'hello';
})
```

> 当然你也可以使用 ES6 的 `async/await` 语法来改写上述方法

```js
methods: {
    async getData() {
        this.arr = [1, 2, 3];
        
        await this.$nextTick();
        
        this.$refs.box.getElementsByTagName('li')[0].innerHTML = 'hello';
    }
}
```

那么接下来我们来分析下 Vue 是如何做到的，其源码中使用了 3 种方式：

- `promise.then` 延迟调用
- `setTimeout(func, 0)` 延迟功能
- `MutationObserver `监听变化

> 前两种方式相信大家都比较熟悉，其都具备延迟执行的功能，我们也可以直接替换 `nextTick` 为这两种方式中的一种，同样可以解决问题。这里主要介绍下 `MutationObserver` 这一 `HTML5 `新特性，那么什么是 `MutationObserver` 呢？用一句话介绍就是：我们可以使用它创建一个观察者对象，其会监听某个 DOM 元素，并在它的 DOM 树发生变化时执行我们提供的回调函数。实例化代码及配置如下

```js
// 传入回调函数进行实例化
var observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        console.log(mutation.type);
    })
});

// 选择目标节点
var target = document.querySelector('#box');
 
// 配置观察选项
var config = { 
    attributes: true, // 是否观察属性的变动
    childList: true, // 是否观察子节点的变动（指新增，删除或者更改）
    characterData: true // 是否观察节点内容或节点文本的变动
};
 
// 传入目标节点和观察选项
observer.observe(target, config);
 
// 停止观察
observer.disconnect();
```

> 这样我们便可以观察 id 为 box 下的 DOM 树变化，一旦发生变化就会触发相应的回调方法，实现延迟调用的功能

## 使用 watch 的深度遍历和立即调用功能

相信很多同学使用 watch 来监听数据变化的时候通常只使用过其中的 handler 回调，其实其还有两个参数，便是

- `deep` 设置为 `true` 用于监听对象内部值的变化
- `immediate` 设置为 `true` 将立即以表达式的当前值触发回调

```html
<template>
    <button @click="obj.a = 2">修改</button>
</template>
<script>
export default {
    data() {
        return {
            obj: {
                a: 1,
            }
        }
    },
    watch: {
        obj: {
            handler: function(newVal, oldVal) {
                console.log(newVal); 
            },
            deep: true,
            immediate: true
        }
    }
}
</script>
```

> 以上代码我们修改了 obj 对象中 a 属性的值，我们可以触发其 `watch` 中的 `handler `回调输出新的对象，而如果不加 `deep: true`，我们只能监听 obj 的改变，并不会触发回调。同时我们也添加了 `immediate: true` 配置，其会立即以 obj 的当前值触发回调。


