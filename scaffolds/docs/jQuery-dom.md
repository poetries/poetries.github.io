---
title: jQuery之DOM操作小结
date: 2017-01-14 10:20:43
tags: 
   - jQuery
   - DOM
categories: Front-End
---

### 一、过滤器
---


#### 1 匹配指定元素的父						
---

- `elem.parent([exp])`

#### 2 匹配指定元素的子元素				
---
<!--more-->
- `elem.children([exp])`

#### 3 匹配指定元素的父、祖元素... 		
---

- `elem.parents([exp])`

#### 4 匹配指定元素的子、孙元素...		
---

- `elem.find([exp])`

#### 5 匹配指定元素的后一个兄弟元素	
---

- `elem.next([exp])`

#### 6 匹配指定元素的后面所有兄弟元素	
---

- `elem.nextAll([exp])`

#### 7 匹配指定元素的前一个兄弟元素	
---

- `elem.prev([exp])`

#### 8 匹配指定元素的前面所有兄弟元素	
---

- `elem.prevAll([exp])`

#### 9 匹配指定元素的所有兄弟元素		
---

- `elem.siblings([exp])`

#### 10 匹配指定以外的元素				
---

- `elem.not(exp)`

#### 11 包括自身在内的全部元素			
---

- `elem.andSelf()`

#### 12 返回指定索引值的元素				
---

- `elem.eq(index)`

#### 13 判断元素是否包含指定的类	
---

- `elem.hasClass(className)`


### 二、文档处理
---


#### 1 在指定元素内的未尾追加一个子元素
---

- 语法 :` Elem.append(ele)`

#### 2 把元素的追加到指定父级元素内的末尾
---

- 语法 : `ele.appendTo(Elem)`
- 说明 : 要求`ele`必须为`JQuery`元素，可以通过`Elem.children`(':last')引用

#### 3 在指定元素内的开始添加一个子元素
---

- 语法 : `Elem.prepend(ele)`

#### 4 把元素的加入指定父级元素内的开始
---

- 语法 : `ele.prependTo(Elem)`
- 说明 : 要求`ele`必须为`JQuery`元素，可以通过`Elem.children().eq(0)`引用

#### 5 使元素逐一被指定的HTML标记包裹起来
---

- 语法 : `Elem.wrap(Tag)`
- 说明: `Tag`将成为元素的父元素，可以通过`Elem.parent() `引用

#### 6 使元素集合被指定的HTML标记包裹起来
---

- 语法 :` Elem.wrapAll(Tag)`
- 说明:
`wrap`把每个子元素逐一都包裹起来，`wrapAll`是把所有的子元素作为整体包裹起来。

#### 7 包裹指定元素的子元素，相当于在元素和子元素中间加了隔离层
---

- 语法 : `elem.wrapInner(Tag)`

#### 8 在元素之后添加兄弟元素。新添加的元素可以通过elem.next() 引用。
---

- 语法 : `elem.after(ele)`

#### 9 在元素之前添加兄弟元素。新添加的元素可以通过elem.prev() 引用。
---

- 语法 : `elem.before(ele)`

#### 10 将元素A移动到元素B之后
---

- 语法 : `elA.insertAfter(elB)`

#### 11 将元素A移动到元素B之前
---

- 语法 : `elA.insertBefore(elB)`

#### 12 清空元素的子节点(元素本身及其属性仍然存在)
---

- 语法 : `elem.empty()`

#### 13 从DOM中删除所有匹配的元素
---

- 语法 : `elems.remove([条件])`

#### 14 将元素A替换为B
---

- 语法 : `elA.replaceWith(elB);`	

