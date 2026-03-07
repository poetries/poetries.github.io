---
title: vue 表单控件与绑定（七）
date: 2018-08-27 10:10:32
tags: Vue
categories: Front-End
---

## 一、文本框

### 1.1 普通文本框

```html
<div id="app-1">
    <p><input v-model="textBox" placeholder="输入内容...">输入的内容：{{ textBox }}</p>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            textBox: ''
        }
    })
</script>
```

### 1.2 数字文本框

```html
<div id="app-1">
    <p><input v-model.number="numberTextBox" type="number" placeholder="输入内容..."> 输入的内容：{{ numberTextBox }}</p>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            numberTextBox: ''
        }
    })
</script>
```

> `.number`参数会强制把返回值转成`Number`类型，因为就算是`type="number"`，返回的也是字符串型

### 1.3 多行输入框

```html
<div id="app-1">
    <p><textarea v-model="multiTextBox" placeholder="输入内容..."></textarea></p>
    <p>输入的内容：</p>
    <p style="white-space:pre">{{ multiTextBox }}</p>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            multiTextBox: ''
        }
    })
</script>
```

> `style="white-space:pre"`表示空白会被浏览器保留。其行为方式类似 `HTML` 中的 `<pre>` 标签

## 二、复选框

### 2.1 单个复选框

```html
<div id="app-1">
    <input type="checkbox" id="checkbox" v-model="singleCheckBox">
    <label for="checkbox">{{ singleCheckBox }}</label>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            singleCheckBox: false
        }
    })
</script>
```

### 2.2 定义属性单个复选框

```html
<div id="app-1">
    <input type="checkbox" id="checkbox" v-model="customSingleCheckBox" v-bind:true-value="customTrue" v-bind:false-value="customFalse">
    <label for="checkbox">{{ customSingleCheckBox }}</label>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            customTrue: '真',
            customFalse: '假',
            customSingleCheckBox: '假'
        }
    })
</script>
```

> `v-bind:true-value`设置为真时的属性，`v-bind:false-value`设置为假时的属性

### 2.3 多个复选框

```html
<div id="app-1">
    <input type="checkbox" id="tansea" value="TanSea" v-model="multiCheckBox">
    <label for="tansea">TanSea</label>
    <input type="checkbox" id="google" value="Google" v-model="multiCheckBox">
    <label for="google">Google</label>
    <input type="checkbox" id="baidu" value="Baidu" v-model="multiCheckBox">
    <label for="baidu">Baidu</label>
    <p>选择的项：{{ multiCheckBox }}</p>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            multiCheckBox: []
        }
    })
</script>
```

## 三、单选框

```html
复制代码
<div id="app-1">
    <input type="radio" id="male" value="男" v-model="radioBox">
    <label for="male">男</label>
    <input type="radio" id="female" value="女" v-model="radioBox">
    <label for="female">女</label>
    <p>选择的项：{{ radioBox }}</p>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            radioBox: ''
        }
    })
</script>
```

## 四、下拉框


### 4.1 普通下拉框

```html
<div id="app-1">
    <select v-model="comboBox">
        <option disabled value="">请选择一项</option>
        <option>男</option>
        <option>女</option>
    </select>
    <p>选择的项：{{ comboBox }}</p>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            comboBox: ''
        }
    })
</script>
```

### 4.2 动态绑定下拉框

```html
<div id="app-1">
    <select v-model="dynamicComboBox">
        <option v-for="optionItem in optionItems" v-bind:value="optionItem.value">
            {{ optionItem.text }}
        </option>
    </select>
    <p>选择的项：{{ dynamicComboBox }}</p>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            dynamicComboBox: '',
                optionItems: [
                    { value: 'TanSea', text: '双子宫殿' },
                    { value: 'Google', text: '谷歌搜索' },
                    { value: 'Baidu', text: '百度搜索' }
                ]
        }
    })
</script>
```

### 4.3 多选列表

```html
<div id="app-1">
    <p><select v-model="multiComboBox" multiple>
        <option>双子宫殿</option>
        <option>谷歌搜索</option>
        <option>百度搜索</option>
    </select></p>
    <p>选择的项：{{ multiComboBox }}</p>
</div>
<script type="text/javascript">
    var vm1 = new Vue({
        el: '#app-1',
        data: {
            multiComboBox: []
        }
    })
</script>
```
