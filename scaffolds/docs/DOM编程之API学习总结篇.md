---
title: DOM编程之API学习总结篇
date: 2016-09-22 17:10:43
tags: 
  - JavaScript
  - DOM
categories: Front-End
---


> 原文 [链接](http://blog.poetries.top/2016/09/22/DOM%E7%BC%96%E7%A8%8B%E4%B9%8BAPI%E5%AD%A6%E4%B9%A0%E6%80%BB%E7%BB%93%E7%AF%87/)


### 一、基本类型介绍


#### 1.1 Node类型


- `DOM1`级定义了一个`Node`接口，该接口由`DOM`中所有节点类型实现。这个`Node`接口在`JS`中是作为`Node`类型实现的。在`IE9`以下版本无法访问到这个类型，`JS`中所有节点都继承自`Node`类型，都共享着相同的基本属性和方法
- `Node`有一个属性`nodeType`表示`Node`的类型，它是一个整数，其数值分别表示相应的`Node`类型


![](http://7xq6al.com1.z0.glb.clouddn.com/d1.png)

<!--more-->
![](http://7xq6al.com1.z0.glb.clouddn.com/d2.png)

- 假设我们要判断一个`Node`是不是元素，我们可以这样判断

```javascript
if(someNode.nodeType == 1){
console.log("Node is a element");
}
```

-  这些`Node`类型中，我们最常用的就是`element`，`text`，`attribute`，`comment`，`document`，`document_fragment`这几种类型

##### 1.2 Element类型
---


![](http://7xq6al.com1.z0.glb.clouddn.com/d3.png)

- `Element`提供了对元素标签名，子节点和特性的访问，我们常用`HTML`元素比如`div`，`span`，`a`等标签就是`element`中的一种。
- **`Element`有下面几条特性：**

    - `nodeType`为`1`
    - `nodeName`为元素标签名，`tagName`也是返回标签名
    - `nodeValue`为`null`
    - `parentNode`可能是`Document`或`Element`
    - 子节点可能是 `Element`，`Text`，`Comment`，`Processing_Instruction`，`CDATASection` 或 `EntityReference`

##### 1.3 Text类型
---

![](http://7xq6al.com1.z0.glb.clouddn.com/d4.png)

- `Text`表示文本节点，它包含的是纯文本内容，不能包含`html`代码，但可以包含转义后的`html`代码。`Text`有下面的特性：
    - `nodeType`为`3`
    - `nodeName`为`#text`
    - `nodeValue`为文本内容
    - `parentNode`是一个`Element`
    - 没有子节点

##### 1.4 Attr类型
---

![](http://7xq6al.com1.z0.glb.clouddn.com/d5.png)

- `Attr`类型表示元素的特性，相当于元素的`attributes`属性中的节点，它有下面的特性：
    - `nodeType`值为2
    - `nodeName`是特性的名称
    - `nodeValue`是特性的值
    - `parentNode`为`null`

##### 1.5 Comment类型
---

- `Comment`表示`HTML`文档中的注释，它有下面的几种特征：
  - `nodeType`为8
  - `nodeName`为`#comment`
  - `nodeValue`为注释的内容
  - `parentNode`可能是`Document`或`Element`
  - 没有子节点

##### 1.6 Document
---


![](http://7xq6al.com1.z0.glb.clouddn.com/d6.png)

- `Document`表示文档，在浏览器中，`document`对象是`HTMLDocument`的一个实例，表示整个页面，它同时也是`window`对象的一个属性。`Document`有下面的特性：
  - `nodeType`为`9`
  - `nodeName`为`#document`
  - `nodeValue`为 `null`
  - `parentNode`为 `null`
  - 子节点可能是一个`DocumentType`或`Element`

##### 1.7 DocumentFragment类型
---
- `DocumentFragment`是所有节点中唯一一个没有对应标记的类型，它表示一种轻量级的文档，可能当作一个临时的仓库用来保存可能会添加到文档中的节点。`DocumentFragment`有下面的特性：
  - `nodeType`为`11`
  - `nodeName`为`#document-fragment`
  - `nodeValue`为`null`
  - `parentNode`为`null`

- 我们简单地介绍了几种常见的`Node`类型，要记住，`HTML`中的节点并不只是包括元素节点，它还包括文本节点，注释节点等等。在这里我们只是简单地说明了几种常见的节点.

### 二、 DOM提供的几个属性
---
#### 2.1 childNodes属性
---
- 在一棵节点树上，`childNodes`属性可以用来获取任何一个元素的所有子节点，它是一个包含这个元素全部子元素的数组

```javascript
element.childNodes
```

#### 2.2 nodeType属性
---

- 节点之间的关系构成了节点层次，`html` 页面的可以画出一个以`html`标签为根节点的树形结构
`DOM` 会把文档看作是一棵树，同时定义了很多方法来操作这棵数中的每一个元素（节点）

```html
<html lang="en">
<head>
    <title>Document</title>
</head>
<body>
    <p>hello world!!!</p>
</body>
</html>
```

![](http://7xq6al.com1.z0.glb.clouddn.com/d7.png)

- 每一个节点都有`nodeType`属性

```javascript
node.nodeType
```
- `nodeType`属性总共有12中可能取值，但其中仅有3种有实用价值
    - 元素节点的`nodeType`属性值是1
    - 属性节点的`nodeType`属性值是2
    - 文本节点的`nodeType`属性值是3


```javascript
description.firstChild.nodeValue = text;
```

#### 2.3 nodeValue属性
---

- `nodeValue`属性
    - 如果想改变一个文本节点的值，那就使用`DOM`提供的`nodeValue`,它用来得到一个节点的值 `node.nodeValue` 
    - 需要注意：`nodeValue`属性获取对象的值时，得到的并不是包含在这个段落里的文本
    - nodeValue属性不仅可以用来检测节点的值，还可以设置节点的值


#### 2.4 firstChild和lastChild属性
---
- 数组元素`childNodes[0]`有个更直观的同义词。无论如何，只要访问`childNodes`数组的第一个元素，都可以把它写成`firstChild`

```javascript
node.firstChild
```
与下面等价

```javascript
node.childNodes[0]
```

- `DOM`还提供了一个与之对应的`lastChild`属性

```javascript
node.lastChild
```

 ### 三、节点创建型API
 ---
 
 - 在这里，我将常用的`DOM`操作`api`进行分类，首先要介绍的是创建型的`api`。这一类型的`api`，简而言之就是用来创建节点的
 
#### 3.1 createElement
---

- `createElement`通过传入指定的一个标签名来创建一个元素，如果传入的标签名是一个未知的，则会创建一个自定义的标签，注意：`IE8`以下浏览器不支持自定义标签

```javascript

var div = document.createElement("div");
```

- 使用`createElement`要注意：通过`createElement`创建的元素并不属于`html`文档，它只是创建出来，并未添加到`html`文档中，要调用`appendChild`或`insertBefore`等方法将其添加到`HTML`文档树中

#### 3.2 createTextNode
---

- `createTextNode`用来创建一个文本节点，用法如下

```javascript

var textNode = document.createTextNode("一个TextNode");
```
- `createTextNode`接收一个参数，这个参数就是文本节点中的文本，和`createElement`一样，创建后的文本节点也只是独立的一个节点，同样需要`appendChild`将其添加到`HTML`文档树中

#### 3.3 cloneNode

- `cloneNode`是用来返回调用方法的节点的一个副本，它接收一个`bool`参数，用来表示是否复制子元素，使用如下：

```javascript
var parent = document.getElementById("parentElement"); 
var parent2 = parent.cloneNode(true);// 传入true
parent2.id = "parent2";
```

- 这段代码通过`cloneNode`复制了一份`parent`元素，其中`cloneNode`的参数为`true`，表示`parent`的子节点也被复制，如果传入`false`，则表示只复制了`parent`节点

```html
<div id="parent">
    我是父元素的文本
    <br/>
    <span>
        我是子元素
    </span>
</div>
<button id="btnCopy">复制</button>

var parent = document.getElementById("parent");
document.getElementById("btnCopy").onclick = function(){
	var parent2 = parent.cloneNode(true);
	parent2.id = "parent2";
	document.body.appendChild(parent2);
}
```

- 这段代码很简单，主要是绑定`button`事件，事件内容是复制了一个`parent`，修改其`id`，然后添加到文档中

- **这里有几点要注意：**
     - 和`createElement`一样，`cloneNode`创建的节点只是游离有`html`文档外的节点，要调用`appendChild`方法才能添加到文档树中
     - 如果复制的元素有`id`，则其副本同样会包含该`id`，由于`id`具有唯一性，所以在复制节点后必须要修改其id
     - 调用接收的`bool`参数最好传入，如果不传入该参数，不同浏览器对其默认值的处理可能不同

- 除此之外，我们还有一个需要注意的点：

  - 如果被复制的节点绑定了事件，则副本也会跟着绑定该事件吗？这里要分情况讨论：
     - 如果是通过`addEventListener`或者比如`onclick`进行绑定事件，则副本节点不会绑定该事件
     - 如果是内联方式绑定比如

```html

<div onclick="showParent()"></div>

```
- 这样的话，副本节点同样会触发事件

#### 3.4 createDocumentFragment
---

- `createDocumentFragment`方法用来创建一个`DocumentFragment`。在前面我们说到`DocumentFragment`表示一种轻量级的文档，它的作用主要是存储临时的节点用来准备添加到文档中

- `createDocumentFragment`方法主要是用于添加大量节点到文档中时会使用到。假设要循环一组数据，然后创建多个节点添加到文档中

```javascript
<ul id="list"></ul>
<input type="button" value="添加多项" id="btnAdd" />

document.getElementById("btnAdd").onclick = function(){
	var list = document.getElementById("list");
	for(var i = 0;i < 100; i++){
		var li = document.createElement("li");
		li.textContent = i;
		list.appendChild(li);
	}
}
```

- 这段代码将按钮绑定了一个事件，这个事件创建了100个`li`节点，然后依次将其添加`HTML`文档中。这样做有一个缺点：每次一创建一个新的元素，然后添加到文档树中，这个过程会造成浏览器的回流。所谓回流简单说就是指元素大小和位置会被重新计算，如果添加的元素太多，会造成性能问题。这个时候，就是使用`createDocumentFragment了`

- `DocumentFragment`不是文档树的一部分，它是保存在内存中的，所以不会造成回流问题。我们修改上面的代码如下

```javascript
document.getElementById("btnAdd").onclick = function(){
	var list = document.getElementById("list");	
	var fragment = document.createDocumentFragment();

	for(var i = 0;i < 100; i++){
	  var li = document.createElement("li");
		li.textContent = i;
		fragment.appendChild(li);
	}

	list.appendChild(fragment);
}
```
- 优化后的代码主要是创建了一个`fragment`，每次生成的`li`节点先添加到`fragment`，最后一次性添加到`list`

#### 3.5 创建型API总结
---

- 创建型`api`主要包括`createElement`，`createTextNode`，`cloneNode`和`createDocumentFragment`四个方法，需要注意下面几点：
    
    - 它们创建的节点只是一个孤立的节点，要通过`appendChild`添加到文档中
    - `cloneNode`要注意如果被复制的节点是否包含子节点以及事件绑定等问题
    - 使用`createDocumentFragment`来解决添加大量节点时的性能问题

### 四、页面修改型API
---

- 前面我们提到创建型`api`，它们只是创建节点，并没有真正修改到页面内容，而是要调用`appendChild`来将其添加到文档树中。我在这里将这类会修改到页面内容归为一类。
修改页面内容的`api`主要包括：`appendChild`，`insertBefore`，`removeChild`，`replaceChild`

#### 4.1 appendChild
---

- `appendChild`我们在前面已经用到多次，就是将指定的节点添加到调用该方法的节点的子元素的末尾。调用方法如下：

```javascript
parent.appendChild(child);
```
- `child`节点将会作为`parent`节点的最后一个子节点

- `appendChild`这个方法很简单，但是还有有一点需要注意：如果被添加的节点是一个页面中存在的节点，则执行后这个节点将会添加到指定位置，其原本所在的位置将移除该节点，也就是说不会同时存在两个该节点在页面上，相当于把这个节点移动到另一个地方

```html
<div id="child">
    要被添加的节点
</div>
<br/>
<br/>
<br/>
<div id="parent">
    要移动的位置
</div>		
<input id="btnMove" type="button" value="移动节点" />

document.getElementById("btnMove").onclick = function(){
	var child = document.getElementById("child");
	document.getElementById("parent").appendChild(child);
}

```

- 这段代码主要是获取页面上的`child`节点，然后添加到指定位置，可以看到原本的`child`节点被移动到`parent`中了。
这里还有一个要注意的点：如果`child`绑定了事件，被移动时，它依然绑定着该事件

#### 4.2 insertBefore
---

- `insertBefore`用来添加一个节点到一个参照节点之前，用法如下

```javascript

parentNode.insertBefore(newNode,refNode);
```

- `parentNode`表示新节点被添加后的父节点
- `newNode`表示要添加的节点
- `refNode`表示参照节点，新节点会添加到这个节点之前

```html
<div id="parent">
    父节点
    <div id="child">				
        子元素
    </div>
</div>
<input type="button" id="insertNode" value="插入节点" />

var parent = document.getElementById("parent");
var child = document.getElementById("child");
document.getElementById("insertNode").onclick = function(){
	var newNode = document.createElement("div");
	newNode.textContent = "新节点"
	parent.insertBefore(newNode,child);
}
```

- 这段代码创建了一个新节点，然后添加到`child`节点之前
- 和`appendChild`一样，如果插入的节点是页面上的节点，则会移动该节点到指定位置，并且保留其绑定的事件。

- **关于第二个参数参照节点还有几个注意的地方：**
  - `refNode`是必传的，如果不传该参数会报错
  - 如果`refNode`是`undefined`或`null`，则`insertBefore`会将节点添加到子元素的末尾
 
#### 4.3 removeChild
---

- `removeChild`顾名思义，就是删除指定的子节点并返回，用法如下

```javascript

var deletedChild = parent.removeChild(node);

```

- `deletedChild`指向被删除节点的引用，它等于`node`，被删除的节点仍然存在于内存中，可以对其进行下一步操作。

- **注意**：如果被删除的节点不是其子节点，则程序将会报错。我们可以通过下面的方式来确保可以删除：

```javascript
if(node.parentNode){
    node.parentNode.removeChild(node);
}
```

- 通过节点自己获取节点的父节点，然后将自身删除

#### 4.4 replaceChild
---

- `replaceChild`用于使用一个节点替换另一个节点，用法如下

```javascript

parent.replaceChild(newChild,oldChild);

```
- `newChild`是替换的节点，可以是新的节点，也可以是页面上的节点，如果是页面上的节点，则其将被转移到新的位置
- `oldChild`是被替换的节点

#### 4.5 页面修改型API总结
---

- 页面修改型api主要是这四个接口，**要注意几个特点**：
     - 不管是新增还是替换节点，如果新增或替换的节点是原本存在页面上的，则其原来位置的节点将被移除，也就是说同一个节点不能存在于页面的多个位置
     - 节点本身绑定的事件会不会消失，会一直保留着

### 五、节点查询型API
---

- 节点查询型`API`也是非常常用的

#### 5.1 document.getElementById
---

- 这个接口很简单，根据元素`id`返回元素，返回值是`Element`类型，如果不存在该元素，则返回`null`

- **使用这个接口有几点要注意：**

  - 元素的`Id`是大小写敏感的，一定要写对元素的`id`
  - `HTML`文档中可能存在多个`id`相同的元素，则返回第一个元素
  - 只从文档中进行搜索元素，如果创建了一个元素并指定`id`，但并没有添加到文档中，则这个元素是不会被查找到的

#### 5.2 document.getElementsByTagName
---

- 这个接口根据元素标签名获取元素，返回一个即时的`HTMLCollection`类型，什么是即时的`HTMLCollection`类型呢？

```html
<div>div1</div>
<div>div2</div>
		
<input type="button" value="显示数量" id="btnShowCount"/>
<input type="button" value="新增div" id="btnAddDiv"/>	

var divList = document.getElementsByTagName("div");
document.getElementById("btnAddDiv").onclick = function(){
	var div = document.createElement("div");
	div.textContent ="div" + (divList.length+1);
	document.body.appendChild(div);
}
	
document.getElementById("btnShowCount").onclick = function(){
        alert(divList.length);
}
```

- 这段代码中有两个按钮，一个按钮是显示`HTMLCollection`元素的个数，另一个按钮可以新增一个div标签到文档中。前面提到`HTMLCollcetion`元素是即时的表示该集合是随时变化的，也就是是文档中有几个`div`，它会随时进行变化，当我们新增一个`div`后，再访问`HTMLCollection`时，就会包含这个新增的`div`

- **使用document.getElementsByTagName这个方法有几点要注意**：
  - 如果要对`HTMLCollection`集合进行循环操作，最好将其长度缓存起来，因为每次循环都会去计算长度，暂时缓存起来可以提高效率
  - 如果没有存在指定的标签，该接口返回的不`是null`，而是一个空的`HTMLCollection`
  - `“*”`表示所有标签
 
#### 5.3 document.getElementsByName
---

- `getElementsByName`主要是通过指定的`name`属性来获取元素，它返回一个即时的`NodeList`对象。一般用于获取表单元素的·name·属性

- **使用这个接口主要要注意几点：**
  - 返回对象是一个即时的`NodeList`，它是随时变化的
  - 在`HTML`元素中，并不是所有元素都有`name`属性，比如`div`是没有`name`属性的，但是如果强制设置`div的`name`属性，它也是可以被查找到的
  - 在`IE`中，如果`id`设置成某个值，然后传入`getElementsByName`的参数值和`id`值一样，则这个元素是会被找到的，所以最好不好设置同样的值给`id`和`name`
  
#### 5.4 document.getElementsByClassName
---

- 这个`API`是根据元素的`class`返回一个即时的`HTMLCollection`，用法如下

```javascript
var elements = document.getElementsByClassName(names);
```

- **这个接口有下面几点要注意：**
  - 返回结果是一个即时的`HTMLCollection`，会随时根据文档结构变化
  - `IE9`以下浏览器不支持
  - 如果要获取`2`个以上`classname`，可传入多个`classname`，每个用空格相隔，例如
  
```javascript

var elements = document.getElementsByClassName("test1 test2");
```

#### 5.5 document.querySelector和document.querySelectorAll
---

- 这两个`api`很相似，通过`css`选择器来查找元素，注意选择器要符合`CSS`选择器的规则

- 首先来介绍一下`document.querySelector`
- `document.querySelector`返回第一个匹配的元素，如果没有匹配的元素，则返回`null`。
- **注意**，由于返回的是第一个匹配的元素，这个`api`使用的深度优先搜索来获取元素

```html
<div>
    <div>
        <span class="test">第三级的span</span>	
    </div>
</div>
<div class="test">			
    同级的第二个div
</div>
<input type="button" id="btnGet" value="获取test元素" />

document.getElementById("btnGet").addEventListener("click",function(){
	var element = document.querySelector(".test");
	alert(element.textContent);
})
```

- 这个例子很简单，就是两个`class`都包`含“test”`的元素，一个在文档树的前面，但是它在第三级，另一个在文档树的后面，但它在第一级，通过`querySelector`获取元素时，它通过深度优先搜索，拿到文档树前面的第三级的元素

- `document.querySelectorAll`的不同之处在于它返回的是所有匹配的元素，而且可以匹配多个选择符

```html
<div class="test">
    class为test
</div>
<div id="test">
    id为test
</div>
<input id="btnShow" type="button" value="显示内容" />

document.getElementById("btnShow").addEventListener("click",function(){
	var elements = document.querySelectorAll("#test,.test");	
	for(var i = 0,length = elements.length;i<length;i++){
		alert(elements[i].textContent);
	}	
})
```
- 这段代码通过`querySelectorAll`，使用`id`选择器和`class`选择器选择了两个元素，并依次输出其内容。要注意两点：
  - `querySelectorAll`也是通过深度优先搜索，搜索的元素顺序和选择器的顺序无关
  - 返回的是一个非即时的`NodeList`，也就是说结果不会随着文档树的变化而变化

- **兼容性问题**：`querySelector`和`querySelectorAll`在`ie8`以下的浏览器不支持

- **小结**：
    - `document.getElementById`返回一个对象
    - `document.getElementsByName`和`document.getElementsByClasName`返回一个对象数组

### 六、节点关系型API
---

![](http://7xq6al.com1.z0.glb.clouddn.com/d8.png)

- 在`html`文档中的每个节点之间的关系都可以看成是家谱关系，包含父子关系，兄弟关系等等

#### 6.1 父关系型API
---

- `parentNode`：每个节点都有一个`parentNode`属性，它表示元素的父节点。`Element`的父节点可能是`Element`，`Document`或`DocumentFragment`
- `parentElement`：返回元素的父元素节点，与`parentNode`的区别在于，其父节点必须是一个`Element`，如果不是，则返回`null`

#### 6.2 兄弟关系型API
---

- `previousSibling`：节点的前一个节点，如果该节点是第一个节点，则为`null`。注意有可能拿到的节点是文本节点或注释节点，与预期的不符，要进行处理一下
- `previousElementSibling`：返回前一个元素节点，前一个节点必须是`Element`，注意`IE9`以下浏览器不支持

- `nextSibling` `previousSibling` 存在兼容性问题

- `nextElementSibling` `previousElementSibling` 推荐使用

```javascript
<script>
    var oUl = document.getElementById('ul1');

    var firstEle = oUl.firstElementChild;
    var lastEle = oUl.lastElementChild;

    firstEle.nextElementSibling.style.background = 'red';
    lastEle.previousElementSibling.style.background = 'green';

</script>
```

![](http://7xq6al.com1.z0.glb.clouddn.com/d9.png)


- `nextSibling`：节点的后一个节点，如果该节点是最后一个节点，则为`null`。注意有可能拿到的节点是文本节点，与预期的不符，要进行处理一下
- `nextElementSibling`：返回后一个元素节点，后一个节点必须是`Element`，注意`IE9`以下浏览器不支持

#### 6.3 子关系型API
---

- `childNodes`：
    - 返回一个即时的`NodeList`，表示元素的子节点列表，子节点可能会包含文本节点，注释节点等。`childNodes `子节点列表集合（只读属性 有兼容性问题 ）

```html
<ul id="ul1">
    <li>11111</li>
    <li>22222</li>
    <li>3333</li>
    <li>44444</li>
</ul>
<script>
    var oUl = document.getElementById('ul1');
    console.log(oUl.childNodes);
</script>
```

![](http://7xq6al.com1.z0.glb.clouddn.com/d10.png)

- 从截图中可以看出 这段代码中`ul`的子节点有`9`个，这说明使用`childNodes`获取的节点包括了文本节点和元素节点

- `childNodes` 在低版本的`ie` 浏览器下获取的节点只包括元素节点，这就导致了兼容性问题
- 如何解决兼容性？？
  - 根据子节点的`nodeType`属性值判断

```javascript
for (var i=0; i<oUl.childNodes.length; i++) {

     if ( oUl.childNodes[i].nodeType == 1 ) {
        oUl.childNodes[i].style.background = 'red';
     }

 }
```

- `children`：
   -  一个即时的`HTMLCollection`，子节点都是`Element`，`IE9`以下浏览器不支持。`children `子节点列表集合（只读属性 推荐使用 ）

- `children` 获取的子节点只包含元素节点

```javascript
for (var i = 0; i<oUl.children.length; i++){
    oUl.children[i].style.background = 'red';
}
```


- `firstNode`：第一个子节点
- `lastNode`：最后一个子节点

- `firstChild` （firstElementChild） `lastChild `(lastElementChild) 第一个子节点 最后一个子节点

- `firstChild` 、`lastChild` 和`childNodes`同样的存在兼容性问题，在低版本`ie`浏览器中只能获取到元素节点

- `firstElementChild `、 `lastElementChild` 获取第一个元素子节点，最后一个元素子节点 推荐使用

```javascript
var oUl = document.getElementById('ul1');

//    oUl.firstChild.style.background = 'red';//标准浏览器 报错
//    oUl.lastChild.style.background = 'red';//标准浏览器 报错

oUl.firstElementChild.style.background = 'red';
oUl.lastElementChild.style.background = 'red';
```

![](http://7xq6al.com1.z0.glb.clouddn.com/d11.png)

- `hasChildNodes`方法：可以用来判断是否包含子节点


### 七、元素属性型
---

#### 7.1 setAttribute
---

- `setAttribute`：它允许我们对元素属性值做出修改与`getAttribute`一样`setAttribute`也能用于元素节点
- 通过`setAttribute`对文档做出修改后，在通过浏览器的查看源码选项看到的任然是改变之前的属性值，也就是说`setAttribue`做出的修改，不会反应到文档本身的源码里
- `setAttribute`优势在于可以修改文档中的任何一个属性

```javascript

element.setAttribute(name, value);
```

- 其中`name`是特性名，`value`是特性值。如果元素不包含该特性，则会创建该特性并赋值。
- 如果元素本身包含指定的特性名为属性，则可以访问属性进行赋值，比如下面两条代码是等价

```javascript

element.setAttribute("id","test");

element.id = "test";
```

- **非DOM的解决方案**

    - 其实不用`setAttribute`也可以改变元素的属性
    - `setAttribute`方法是第一级`DOM`的组成部分，它可以设计任何元素节点的任意属性。在第1级`DOM`出现之前，你可以通过另外一种办法设置大部分元素的属性

```javascript
element.value = "the new value";
```
与下面语句等价

```javascript
element.setAttribute("value","the new value");
```


####  7.2 getAttribute
---

- `getAttribute`返回指定的特性名相应的特性值，如果不存在，则返回`null`或空字符串。
- `getAttribute`不属性`doucment`对象，不能通过`document`对象调用，只能通过元素节点对象调用
- 例如可以与`getElementsByTagName`方法合用，获取每个`p`的`title`属性

```javascript
var paras = document.getElementsByTagName("p");
for(var i=0;i<para.lenght;i++){
    alert(paras.getAttrtitube("title"));
}
```

###  八、表格操作
---

![](http://7xq6al.com1.z0.glb.clouddn.com/d12.png)

### 九、样式操作
---


![](http://7xq6al.com1.z0.glb.clouddn.com/d13.png)

### 十、大小和偏移
---

![](http://7xq6al.com1.z0.glb.clouddn.com/d14.png)

###  十一、网上的一张思维导图总结
---

![](http://7xq6al.com1.z0.glb.clouddn.com/d15.png)

---
- 参考
  - `JavaScript DOM`编程艺术
  - [常用DOM操作](http://www.jianshu.com/p/e1391dc17361)

---

- [本文mardown原文件](https://github.com/poetries/poetries.github.io/blob/dev/source/_posts/DOM%E7%BC%96%E7%A8%8B%E4%B9%8BAPI%E5%AD%A6%E4%B9%A0%E6%80%BB%E7%BB%93%E7%AF%87.md)
