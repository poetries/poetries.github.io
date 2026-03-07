---
title: vue中的数据绑定（二）
date: 2018-08-26 14:01:32
tags: Vue
categories: Front-End
---

> Vue 对象的改变会直接影响到 HTML 的标签的变化，而且标签的变化也会反过来影响 Vue 对象的属性的变化

![](https://malun666.github.io/aicoder_vip_doc/pages/vue/imgs/02vue%E5%8F%8C%E5%90%91%E7%BB%91%E5%AE%9A.jpg)

## 一、数据渲染


```html
  <div>{message} </div><!--数据绑定-->
  <div v-html="htmlMess"></div> <!--html绑定-->   
  <div v-text="message"></div>  <!--数据绑定-->  
```

## 二、属性绑定


```html
<h1 v-bind:title="message">aaa</h1>  <!--属性绑定-->
<a v-bind:href="url">百度</a>  <!--属性绑定-->
<a :href="url">百度</a>    <!--简写-->
```

## 三、类名绑定

```html
<!--类绑定，当isActive为true时类名生效-->
<div v-bind:class="active : isActive"></div>    

<!--多类名绑定，用逗号隔开-->
<div v-bind:class="active:isActive,red:isRed"></div>

<!--对象类名绑定-->
<div v-bind:class="classObj"></div>    

<!--类名数组绑定-->
<div v-bind:class="[active,red]"></div>   

<!--三元运算符类名绑定-->
<div v-bind:class="isActive ? active : red"></div>    
```

## 四、样式绑定

```html
<!--内联样式绑定-->
<div v-bind:style="{width:width,height:height}"></div> 

<!--内联样式对象绑定-->
<div v-bind:sytle="styleObj"></div> 

<!--内联样式对象数组绑定-->
<div v-bind:style="[styleObj1,styleObj2]"></div>    
```

## 五、条件绑定

```html
<!--条件为真时显示，css中直接有无此元素-->
<p v-if="seen">hahah</p>    

<!--效果同if，css中为display：none-->
<p v-show="seen">hah</p>     


<!--循环绑定-->
<p v-for="list in lists">{{alist.text}}</p>  

<!--绑定lists数组-->
<p v-for="value in lists">{{value}}</p>     

<!--值循环输出-->
<p v-for="(key value) in lists">{{key}}:{{value}}</p>     

<!--键值对输出-->
<p v-for="(index key value) in lists">{{index}}:{{key}}:{{value}} </p>   

<!--索引加键值对输出-->
<p v-for="n in 10">{{n}}</p>   
```

## 六、事件绑定


```html
<!--事件对应fun1方法-->
<a v-on:click="fun1">点击</a>    

<!--事件绑定简写-->
<a @click="fun1">点击</a>     

<!--事件修饰符：-->

<!-- 阻止单击事件冒泡 -->
<a v-on:click.stop="doThis"></a>

<!-- 提交事件不再重载页面 -->
<form v-on:submit.prevent="onSubmit"></form>

<!-- 修饰符可以串联  -->
<a v-on:click.stop.prevent="doThat"></a>

<!-- 只有修饰符 -->
<form v-on:submit.prevent></form>

<!-- 添加事件侦听器时使用事件捕获模式 -->
<div v-on:click.capture="doThis">...</div>

<!-- 只当事件在该元素本身（而不是子元素）触发时触发回调 -->
<div v-on:click.self="doThat">...</div>

<!-- click 事件只能点击一次，2.1.4版本新增 -->
<a v-on:click.once="doThis"></a>
```

## 七、按键绑定

> 相应按键按下时触发


```html
<input v-on:keyup.enter="submit">
<input @keyup.enter="submit">   
```

> 全部的按键别名：
 
- `.enter`  
- `.tab  `
- `.delete` (捕获 "删除" 和 "退格" 键) 
- `.esc  `
- `.space ` 
- `.up  `
- `.down ` 
- `.left ` 
- `.right`  
- `.ctrl  `
- `.alt  `
- `.shift ` 
- `.meta`

## 八、双向绑定

```html
<p>{message}</p>   

<!--input输入值将传入Vue中的message-->
<input type="text" v-model="message"/> 

<select v-model="message" id="aa">     
    <option>百度</option>
    <option>腾讯</option>
    <option>阿里</option>
</select>
```

**绑定修饰符**

- `v-model.lazy` 将`input`同步改为`change`同步    -
- `v-model.mumber` 将能转化为数字的字符串转化为数字
- `v-model.trim` 过滤空格

