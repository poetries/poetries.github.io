---
title: JavaScript语言基础之DOM操作(九)
date: 2016-07-27 00:05:43
tags: JavaScript
categories: Front-End
---

**DOM 操作**
<!--more-->
- 图片切换的相册效果
- tab切换效果
- 表单验证
- 特效就是DOM操作的具体应用 DOM操作就是用js来写HTML代码

- 节点/元素/标签：

  - 三种常用的节点类型：

    - 元素节点
    - 属性节点
    - 文本节点

- **操作DOM对象：**

    - 修改：--找到这个节点
    - 删除：--找到这个节点
    - 添加：--先造出一个节点 然后插入 插入到哪里？找节点来定位

- 这些都离不开节点的查找

- **节点的查找：**（最重要）

 - 1、`document.getElementById`---根据`id`查找节点 [返回的是节点本身]
 - 2、`document.getElementsByTagName`--根据标签名字来查找[返回的是数组]document.getElementsByTagName[i]
 - 3、`document.getElemenstByName`--根据`name`属性来查找节点（一般用在表单中）[返回的是数组]`document.getElemenstByName[i]``

- **注意：**早期浏览器都认为name只出现在表单中 

- 因此`document.getElemenstByName`只对表单中的元素发挥作用 后来部分浏览器把`Name`属性扩展到一般的元素 如：`div` 但是IE浏览器还是只能对表单使用`byName `因此处于兼容性 我们只能对表单使用` byName`

- **`DOM`中查找节点的思路：**（由大到小 个别情况 由子到父）

  - 由大到小：（通过下面的来定位）

    - 1、`document.getElementById`---根据id查找节点 [返回的是节点本身]
    - 2、`document.getElementsByTagName`--根据标签名字来查找[返回的是数组]document.getElementsByTagName[i]
    - 3、`document.getElemenstByName`--根据`name`属性来查找节点（一般用在表单中）[返回的是数组]`document.getElemenstByName[i]`

- 如果还没有查到自己想要的节点，还可以继续根据上面已经找到的节点再次定位来查找

- **怎么继续定位？**

  - 答案：childNodes/child

- **继续查找：**

- 1、查找子元素 `children[index]/childNodes`

- 2、查找父元素 `node.parentNode` -->获取父元素

- 3、查找兄弟元素 `nextSibling` `previousSibling`

- 4、`nextSibling` `previousSibling` `firstChild` `lastChild `这四个属性容易受到`空白文本`的影响 `建议不用`

```javascript
//============给Object原型加一个方法 消除文本节点对DOM操作的影响 例如：nextSibling` `previousSibling` `firstChild` `lastChild （受到换行 和文本节点影响）

Object.prototype.next = function(){
  //NodeType == 3 text的代号
  //NodeType == 1 tag的代号
  if(this.nextSibling){//判断下一个兄弟节点是否存在
  switch(this.nextSibling.nodeType){
    case 1:
      return this.nextSibling;
    case 3:
      return this.nextSibling.nextSibling;
  }
}else{
  return null;
}
console.log(div1.next().next().innerText);
```

- 5、对于查到的某个元素里面的子元素非常多 这时候还可利用`getElementsByTagname`进一步筛选
       
**注意：**对于元素对象和document对象相比 元素对象只能利用getElementsByTagName函数 其他两个不能用


- 节点查找也是通过由大到小来定位：找到大的元素进一步细化 完全可以找到页面上任意一个元素控制他

- 子元素 不好找 就找他的父元素

- 要过滤空白文本节点，用children取他的文本节点

- **DOM与节点的关系：**

  - **node:**

    - `childNodes[]`
    - `parentNode`
    - `firstChild`
    - `getElementsByTagName('元素标签')`
    - `lastchild`
    - `nextSibling`
    - `previousSibling`

    - `children[index]` `children` 不是w3c标准 但是各大浏览器兼容性很好


---


通过给原型添加方法在元素后面创建标签

启示：在项目中，很多很多地方都需要一个方法但是系统没提供，这时可以通过原型扩展

```javascript
//var p = document.createElement('p');
//p.innerHTML = "this is a p";
//var child = document.getElementsByTagName('div');

//给Div的HTMLDivElement构造器原型加一个创建元素的方法 要所有的元素都有这个方法 改成 Object
HTMLDivElement.prototype.createElement = function(tagName){
  var child = document.createElement(tagName);
  this.appendChild(child);
  return child;
}
var child = document.getElementsByTagName('div')[2].createElement("p");
child.innerHTML = 'pppppp';

```

---

### 附录：思维导图总结

![](http://7xq6al.com1.z0.glb.clouddn.com/DOM%20%E5%9F%BA%E6%9C%AC%E6%93%8D%E4%BD%9C.gif)
