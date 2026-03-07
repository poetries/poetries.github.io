---
title: JavaScript中property和attribute的区别 
date: 2016-07-27 13:50:20
tags: 
    - JavaScript
categories: Front-End
---

- **1. 定义**

   -  `property`（元素属性）：`DOM` 节点是一个对象，因此，可以添加自定义的属性以及方法。`property` 的值可以是任何的数据类型，对大小写敏感。自定义的` property `不会出现在 `html` 中，只存在 `JavaSctipt` 中。
  -  `attribute`（标签属性）：`attribute` 只能是字符串，大小写不敏感，出现在 `innerHTML` 中，通过类数组` attributes `可以罗列所有的 `attribute`。
- **2. 相同之处**
<!--more-->
  - 标准 `DOM` 的 `properties`（元素属性）与` attributes`（标签属性）是同步的。公认的 `attributes`（标签属性）会添加到` DOM `对象 `property`（元素属性）上，如 `id、style、className、disabled、checked `等。这时候直接操作 `property  (el. checked)` 或者使用 `el.getAttribute() / el.setAttribute() `效果一致。但是参数不一定相同，如：`el.className 与 el.getAttribute('class')`

- **3. 不同之处**

- 对于有些标准的特性的操作，`el.getAttribute 与 el.property `获取的值存在差异性。如: `href、src、value、style、onclic 等

- `Demo1：`el.getAttribute 获取的是 href 的实际值，el.property 获取的是完整的 url
```javascript
    alEl.href = '/';
    alert(alEl.getAttribute('href'));  // '/'
    alert(alEl.href);  				 // full URL
```

- `Demo2：`el.property 可以从 el.setAttribute 获得同步
  
```javascript
inputEl.setAttribute('value', 'hello');
alert(inputEl.value );	 		    // 'hello' -- property changed!
```

- Demo3： el.getAttribute 不能从 el.property 获得同步

```javascript
    inputEl.value = 'bye';
    alert(inputEl.getAttribute('value')); // 'hello' – attribute not changed!
```

- Demo4：el.getAttribute 只能获取输入框的原始值，el.property 可以获取输入框修改后值

用户输入 'good'，inputEl.value 获得 'good'，inputEl.getAttribute('value') 获得原始值 'hello'。
可以利用 inputEl.value == inputEl.getAttribute('value') 检验 input 是否变化

- Demo5：checkbox 未选中时 -- el.getAttribute 返回 null，el.property 返回 false

checkbox 选中时 -- el.getAttribute 仍返回 null，el.property 返回 ture
```javascript
alert(checkboxEl.checked); 					//  boolean true
alert(checkboxEl.getAttribute('checked')); 		//  object null
```

- Demo6：style -- el.getAttribute 返回 string, el.property 返回 object

```javascript
alert(divEl.style); 					// 'width:200px;height:200px;'
alert(divEl.getAttribute('style') ) 	//  [object CSSStyleDeclaration]
```

- **4. 浏览器兼容性上的差别**

  - 1)` IE<9` 浏览器中，el.property 和 el.getAttribute 可以相互访问自定义属性
  - 2)` IE<8`（包括IE8种的IE7兼容模式），el.property 和 el.getAttribute 相同
  - 因为 `attribute` 对大小写不敏感，在这种情况下，用 el.getAttribute 访问特性时，浏览器会选择第一次出现的值。
 
```javascript
document.body.abba = 1 // assign property (now can read it by getAttribute)
document.body.ABBA = 5 // assign property with another case
// must get a property named 'ABba' in case-insensitive way.
alert( document.body.getAttribute('ABba') ) // 1
```

- **5. 优先选择 property**

 - 在实际应用中，98% 的 DOM 操作都是使用 properties。

 - 总结：只有两种情形需要使用` attributes ：`
   - 1) 自定义的 `HTML attributes`，因为它并不同步到` DOM property`
   - 2) 访问内置的` HTML attributes`（设置的初始值），这些 `attribute `不能从` property` 同步过来。例如` input `标签的 value 值
