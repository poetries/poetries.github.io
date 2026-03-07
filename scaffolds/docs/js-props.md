---
title: JavaScript及jQuery中的各种宽高属性图解
date: 2016-12-13 23:35:24
tags: JavaScript
categories: Front-End
---

> 原文链接 http://blog.poetries.top/2016/12/13/js-props
> 声明：本文根据慕课网学习视频整理

强烈建议打开控制台自己动手练习一遍，这样印象才会深刻

## 第一部分 JavaScript中的宽高属性
---

###  一、与window相关的宽高属性
---

#### 1.1 window.location和document.location
---

- `window`对象的`location`属性引用的是`location`对象，表示该窗口中当前显示文档的`URL`
- `document`的对象的`location`属性也是引用`location`对象
- 所以 `window.location === document.location`    `//true`
<!--more-->
#### 1.2 window.screen
---

- `window.screen`包含有关用户屏幕的信息。它包括：
  - `window.screen.width`
  - `window.screen.height`
  - `window.screen.availHeight`
  - `window.screen.availWidth`
  - `window.screenTop`
  - `window.screenLeft`


![window.screen](http://upload-images.jianshu.io/upload_images/1480597-d7979b36ca991d9c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


**1.3 与window相关的宽高**

- `window.innerWidth`   内部的宽度
- `window.innerHeight`   内部的高度
- `window.outWidth`   外部的宽度
- `window.outHeight`   外部的高度


![与window相关的宽高](http://upload-images.jianshu.io/upload_images/1480597-7c90cc88a3355d8e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

### 二、与document相关的宽高属性
---

#### 2.1与client相关的宽高 
---

- `document.body.clientWidth` 元素宽度（可视内容区+内边距）
- `document.body.clientHeight`元素高度（可视内容区+内边距）

该属性指的是元素的可视部分宽度和高度，即`padding+content`
如果没有滚动条，即为元素设定的宽度和高度
如果出现滚动条，滚动条会遮盖元素的宽高，那么该属性就是其本来宽高减去滚动条的宽高

example1：

```javascript
body{ 
    border: 20px solid #000; 
    margin: 10px; 
    padding: 40px; 
    background: #eee; 
    height: 350px; 
    width: 500px; 
    overflow: scroll; 
} 
console.log(document.body.clientWidth);  // 350+padding(80) = 430
console.log(document.body.clientHeight);  // 500 + padding(80) = 580
```

example2: 在div中添加文字， 指导出现滚动条

```javascript
#exp2 {
	width:200px;
	height:200px;
	background:red;
	border:1px solid #000;
	overflow:auto;
}

var test = document.getElementById("exp2");

console,log(test.clientHeight); // 200
console.log(test.clientWidth); // 
```

![](https://poetries1.gitee.io/img-repo/2019/10/322.png)

- **小结clientWidth和clientHeight**

  - 无`padding`无滚动 ： `clientWidth` = 盒子的`width`
  - 有`padding`无滚动 ： `clientWidth` = 盒子的`width` + 盒子的`padding * 2`
  - 有`padding`有滚动 ： `clientWidth` = 盒子和`width` + 盒子的`padding * 2 `- 滚动轴宽度


- `document.body.clientLeft`
- `document.body.clientTop`

这两个返回的是元素周围边框的厚度，如果不指定一个边框或者不定位该元素，它的值就是0

例：

```javascript
body{ 
    border: 20px solid #000; 
    margin: 10px; 
    padding: 40px; 
    background: #eee; 
    height: 350px; 
    width: 500px; 
    overflow: scroll; 
} 
console.log(document.body.clientLeft);  // 20
console.log(document.body.clientTop);  // 20
```

**小结clientLeft和clientTop**

- 这一对属性是用来读取元素的`border`的宽度和高度的
  - `clientTop = border-top`
  - `clientLeft = border-left`

#### 2.2 与offset相关的宽高 
---

- **document.body.offsetWidth（元素的border+padding+content的宽度）**
- **document.body.offsetHeight（元素的border+padding+content的高度）**

该属性和其内部的内容是否超出元素大小无关，只和本来设定的border以及width和height有关

例：

```javascript
body{ 
    border: 20px solid #000; 
    margin: 10px; 
    padding: 40px; 
    background: #eee; 
    height: 350px; 
    width: 500px; 
    overflow: scroll; 
} 
console.log(document.body.offsetWidth);  // 470 = padding*2 + 350 + border*2
console.log(document.body.offsetHeight);  // 620 = padding*2 + 500 + border*2
```

**小结offsetWidth和offsetHeight**

- 无`padding`无滚动无`border`
  - offsetWidth = clientWidth = 盒子的宽度
- 有`padding`无滚动有`border`
  - offsetWidth = 盒子的宽度 + 盒子padding*2 + 盒子边框*2 = clientWidth + 边框宽度*2
- 有`padding`有滚动，且滚动是显示的，有`border`
  - offsetWidth = 盒子宽度 + 盒子padding*2 + 盒子边框*2 = clientWidth + 滚动轴宽度 + 边框宽度*2

---

- **document.offsetLeft **
- **document.offsetTop **

了解这两个属性我们必须先了解它，什么是`offsetParent`

- 如果当前元素的父级元素没有进行`CSS`定位（`position`为`absolute`或`relative`）,`offsetParent`为`body.`
- 假如当前元素的父级元素中有`CSS`定位，`offsetParent`取最近的那个父级元素

**offsetLeft的兼容性问题：**

- 在`IE6/7`中
  - `offsetLeft` = offsetParent的padding-left + 当前元素的margin-left

- 在`IE8/9/10`以及`chrome`中
  - `offsetLeft` = offsetParent的margin-left + offsetParent的border宽度 + offsetParent的padding-left + 当前元素的margin-left

- 在`FireFox`中
  - `offsetLeft` = offsetParent的margin-left + 当前元素的margin-left + offsetParent的padding-left


例：

```javascript
body{ 
    border: 20px solid #000; 
    margin: 10px; 
    padding: 40px; 
    background: #eee; 
    height: 350px; 
    width: 500px; 
    overflow: scroll; 
} 

#exp {
   width:400px;
   height:200px;
   padding:20px;
   margin:10px;
   background:red;
   border:20px solid #000;
   overflow:auto;
}
var div = document.getElementById("exp");

```


- 在IE8/9/10以及chrome中：
  - div.offsetLeft  = 本身的margin10 + 父级元素的padding40 + margin10 + border20 = 80
  - div.offsetTop = 本身的margin10 + 父级元素的padding40 + margin10 + border20 = 80

- 在FireFox：（相比chrome中少了border）
  - div.offsetLeft  = 本身的margin10 + 父级元素的padding40 + margin10 = 60
  - div.offsetTop = 本身的margin10 + 父级元素的padding40 + margin10 = 60

- 在IE6/7中：（相比在FireFox，不但少了border还少了父级元素的margin）
  - `div.offsetLeft`  = 本身的`margin10` + 父级元素的`padding40` = 50
  - `div.offsetTop` = 本身的`margin10` + 父级元素的`padding40` = 50


#### 2.3与scroll相关的宽高 (实际项目中用的最多)
---

- **document.body.scrollWidth**
- **document.body.scrollHeight**


document.body的scrollWidth和scrollHeight与div的scrollWidth和scrollHeight是有区别的

例：

```javascript
body{ 
    border: 20px solid #000; 
    margin: 10px; 
    padding: 40px; 
    background: #eee; 
    height: 350px; 
    width: 500px; 
    overflow: scroll; 
}

document.body.scrollHeight; // 
document.body.scrollWidth; //
```

- 当给定宽高小于浏览器窗口的宽高
  - scrollWidth = 通常是浏览器窗口的宽度
  - scrollHeight = 通常是浏览器窗口的高度

- 当给定宽高大于浏览器窗口的宽高，且内容小于给定宽高的时候
  - scrollWidth = 给定宽度 + 其所有的padding + margin + border
  - scrollHeight = 给定高度 + 其所有的padding + margin + border

- 当给定宽高大于浏览器窗口宽高，且内容大于给定宽高
  - scrollWidth = 内容宽度 + 其所有的padding + margin + border
  - scrollHeight = 内容高度 + 其所有的padding + margin + border


**在某div中的scrollWidth和scrollHeight**

- 无滚动轴时：
  - scrollWidth = clientWidth = 盒子宽度 + 盒子padding*2 

![](https://poetries1.gitee.io/img-repo/2019/10/323.png)

- 有滚动轴时：
  - scrollWidth = 实际内容的宽度 + padding*2
  - scrollHeight = 实际内容的高度 + padding*2


![](https://poetries1.gitee.io/img-repo/2019/10/324.png)

- **document.body.scrollLeft**
- **document.body.scrollTop**

与前面不同的是，这对属性是可读写的，指的是当元素其中的超出其宽高的时候，元素被卷起来的高度和宽度

```javascript
#exp {
   width:400px;
   height:200px;
   padding:20px;
   margin:10px;
   background:red;
   border:20px solid #000;
   overflow-y:scroll;
}

var mydiv = document.getElementById("exp");

mydiv.scrollTop ;  //默认情况下是0 
mydiv.scrollLeft ; //默认情况下是0 

//可以改写它

mydiv.scrollTop = 20;
console.log(mydiv.scrollTop)
```

![](https://poetries1.gitee.io/img-repo/2019/10/325.png)

**obj.style.width和obj.style.height**

对于一个`DOM`元素，它的`style`属性返回的是一个对象，这个对象的任意一个属性是可读写的，`style.width`等于`css`属性中的宽度。`style.height`等于`css`属性中的高度

#### 2.4 documentElement和body的关系
---

是父子级的关系

```javascript
body{ 
    border: 20px solid #000; 
    margin: 10px; 
    padding: 40px; 
    background: #eee; 
    height: 350px; 
    width: 500px; 
    overflow: scroll; 
}

#exp {
   width:400px;
   height:200px;
   padding:20px;
   margin:10px;
   background:red;
   border:20px solid #000;
   overflow-y:scroll;
}

console.log(document); //document
console.log(document.documentElement); //html
console.log(document.body); //body
```

![](https://poetries1.gitee.io/img-repo/2019/10/326.png)

- 兼容问题推荐使用 获取浏览器窗口可视区域大小

```javascript
document.body.clientWidth || document.documentElement.clientWidth;
document.body.clientHeight || document.documentElement.clientHeight;
```

### 三、Event对象的5种坐标
---

![](https://poetries1.gitee.io/img-repo/2019/10/327.png)

例：

```html
<div id="example" 
style="width: 200px;height: 200px;background: red;margin: 100px auto;"></div>
```

```javascript
var example = document.getElementById("example");
example.onclick = function(e){
	console.log("clientX "+e.clientX + " : " + " clientY "+e.clientY);
	console.log("screenX "+e.screenX + " : " + " screenY "+e.screenY);
	console.log("offsetX "+e.offsetX + " : " + " offsetY "+e.offsetY);
	console.log("pageX "+e.pageX + " : " + " pageY "+e.pageY);
	console.log("x "+e.x + " : " + " y "+e.y);
}
```

![](https://poetries1.gitee.io/img-repo/2019/10/328.png)

### 四、 js各种宽高的应用
---

- **example1：可视区域加载**


![](https://poetries1.gitee.io/img-repo/2019/10/329.png)

```html
<div id="example1" ></div>
```
```css
#example1 {
			width: 500px;
			height: 350px;
			background: red;
			margin: 1000px auto 0 auto;
		}
		@-webkit-keyframes fadeInLeft{
			0%{
				opacity: 0;
				transform: translate3d(-100%,0,0);
			}
			100%{
				opacity: 1;
				transform: none;
				
			}
		}
			.fadeInLeft {
				animation-name: fadeInLeft;
				animation-duration: 2s;
			}
```
```javascript
function showDiv(){
			var example = document.getElementById("example");
			var clients = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;//可视区域的高度
			var divTop = example.getBoundingClientRect().top;
			if(divTop <= clients){
				example.classList.add("fadeInLeft");
                              //  这里可以通过setAttribute设置图片的src按需加载
			}
			document.title = clients+"---"+divTop;
		}
		
window.onscroll = showDiv;
```

 [在线演示](http://codepen.io/poetries/pen/RoeJgG)


- **example2：网页滚动到顶部或者底部**

```html
<div id="example2" ></div>
```

```css
#example2 {
			width: 500px;
			height: 350px;
			background: red;
			margin: 1000px auto 0 auto;
}
```

```javascript
function scrollTopOrBottom(){
			var example2 = document.getElementById("example");
			var clients = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;//可视区域的高度，兼容性写法
			var scrollTop = document.body.scrollTop;
			var wholeHeight = document.body.scrollHeight;
			if(clients + scrollTop >= wholeHeight){
				alert("我已经到了底部!");
                              // 这里可以调用Ajax分页加载到页面中，实现多页加载功能
			}else if(scrollTop == 0){
				alert("我已经到了顶部了!");
                      
			}
			document.title = (clients + scrollTop)+"---"+wholeHeight+"--"+scrollTop;
		}
		
window.onscroll = scrollTopOrBottom;
```


[在线演示](http://codepen.io/poetries/pen/WoayJy)

- **example3：DIV滚动到底部加载**

```html
<div id="example3" >
			DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载
			DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载
			DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载
			DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载
			DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载
			DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载DIV滚动到底部加载
</div>
```

```css
#example3 {
			width: 500px;
			height: 400px;
			background: red;
			margin: 10px auto;
			padding: 10px;
			overflow-y: scroll;
}
```

```javascript
var div = document.getElementById("example3");
		function divScroll(){
			
			var wholeHeight = div.scrollHeight;//滚动区域高度
			var divScrollTop = div.scrollTop;//卷上去的那部分高度
			var divHeight = div.clientHeight; //div的可视区域的高度
			
			
			if(divScrollTop + divHeight >= wholeHeight){
				alert("我已经到了底部!");
               // 这里可以在div中通过滚动加载分页按需显示
			}else if(divScrollTop == 0){
				alert("我已经到了顶部了!");
			}
			document.title = (divScrollTop + divHeight)+"---"+wholeHeight+"--"+divScrollTop;
}
		
div.onscroll = divScroll;
```

[在线演示](http://codepen.io/poetries/pen/vyVrvm)


- **example4：计算滚动轴的宽度**



```javascript
	//获取滚动轴的宽度
		function getScrollBar(){
			var el = document.createElement("p");
			var styles = {
				width:"100px",
				height:"100px",
				overflowY:"scroll"
			};
			for (var prop in styles){
				el.style[prop] = styles[prop];//把 styles上的属性全部遍历拷贝到el.style上
				
			}
			document.body.appendChild(el);
			var scrollBarWidth = el.offsetWidth - el.clientWidth;
			el.remove();
			return scrollBarWidth;
		}
		alert(getScrollBar());//17
```

[在线演示](http://codepen.io/poetries/pen/RoeBbL)



### 五、js中的宽高属性总结


![](https://poetries1.gitee.io/img-repo/2019/10/330.png)

![](https://camo.githubusercontent.com/3318530334bbc8f5e7ce267866c43ba72fa01f32/687474703a2f2f6f61376436647871742e626b742e636c6f7564646e2e636f6d2f626c6f672f696d616765732f3038313734323039323736363338392e6a7067)

![](https://poetries1.gitee.io/img-repo/2019/10/331.png)
![](https://poetries1.gitee.io/img-repo/2019/10/332.png)


## 第二部分 jQuery中的宽高属性
---

### 一、jquery相关宽高介绍
---

- **1.1 width()**
  - 特殊元素`window.document`只可以读，普通元素可以读写，`width()`返回结果无单位，`css("width")`的结果有单位

![](https://poetries1.gitee.io/img-repo/2019/10/333.png)
![](https://poetries1.gitee.io/img-repo/2019/10/334.png)

- **1.2 innerWidth()**
  - 包含padding（不推荐window,document调用）
- **1.3 innerHeight()**

![](https://poetries1.gitee.io/img-repo/2019/10/335.png)
![](https://poetries1.gitee.io/img-repo/2019/10/336.png)

- **1.4 outerWidth()**
  - 包含padding和border，当传true时包含marging，不传时不包含marging（不推荐window,document调用）
- **1.5 outerHeight()**

![](https://poetries1.gitee.io/img-repo/2019/10/337.png)
![](https://poetries1.gitee.io/img-repo/2019/10/338.png)

- **1.6 scrollLeft():**
  - 相对于水平滚动条左边的距离，如果滚动条非常左、或者元素不能被滚动，这个值为0；
- **1.7 scrollTop():**
  - 相对于垂直滚动条上边的距离，如果滚动条非常上、或者元素不能被滚动，这个值为0；

- **1.8 .offset():**
  - 相对于document的当前坐标值(相对于body左上角的left,top的值)；
- **1.9 .position():**
  - 相对于offset parent的当前坐标值(相对于offset parent元素的左上角的left、top的值)


![](https://poetries1.gitee.io/img-repo/2019/10/339.png)

### 二、jquery相关宽高举例
---

**2.1 exmaple1**

![](https://poetries1.gitee.io/img-repo/2019/10/340.png)

```html
	<div class="parentDiv">
		<div class="childrenDiv"></div>
	</div>
```

```css
html,body {
	margin:10px;
	border:5px solid red;
	padding:20px;
}
.parentDiv {
	width:800px;
	height:500px;
	margin:5px auto;
	background:#FF6600;
	border:5px dashed green;padding:30px;position:relative;

}
.childrenDiv {
	width:300px;
	height:500px;
	margin:5px auto;
	background:yellow;
	border:5px solid black;
	padding:5px;
	box-sizing:border-box;/*包括padding和border的值*/
}
```

```javascript
//特殊元素的高度
//window  document
console.log("$(window).height()"+$(window).height());
console.log("$(document).height()"+$(document).height());

//innerHeight 
console.log("$(window).innerHeight()"+$(window).innerHeight());
console.log("$(document).innerHeight()"+$(document).innerHeight());

//普通child元素的高度

//480 = 500 - border*2 - padding*2 (因为设置了box-sizing，box-sizing把border和padding的值计算了进去)
console.log('$(".childrenDiv").height()'+ $(".childrenDiv").height());

//490 = 500 - border*2 - padding*2（innerHeight不包括padding）
console.log('$(".childrenDiv").innerHeight()'+ $(".childrenDiv").innerHeight());

//500 = 500  不包括margin
console.log('$(".childrenDiv").outerHeight()'+ $(".childrenDiv").outerHeight());

//510 = 500 + margin true包括margin
console.log('$(".childrenDiv").outerHeight()'+ $(".childrenDiv").outerHeight(true));

//scrollTop

$(window).scroll(function(){
	document.title = "scrollTop  "+$(this).scrollTop();
});

// jquery宽高演示之offset和position

console.log('$(".childrenDiv").offset().top '+$(".childrenDiv").offset().top);
console.log('$(".childrenDiv").offset().left '+$(".childrenDiv").offset().left);
console.log('$(".childrenDiv").position().top '+$(".childrenDiv").position().top);
console.log('$(".childrenDiv").position().top '+$(".childrenDiv").position().left);

```

![](https://poetries1.gitee.io/img-repo/2019/10/341.png)
![](https://poetries1.gitee.io/img-repo/2019/10/342.png)


[在线演示](http://codepen.io/poetries/pen/yVRqZO)



### 三、jquery各种宽高应用
---

**3.1 jquery可视区域加载**

```html
<div id="example" ></div>
```

```css
#example {
			width: 500px;
			height: 350px;
			background: red;
			margin: 1000px auto 0 auto;
		}
		@-webkit-keyframes fadeInLeft{
			0%{
				opacity: 0;
				transform: translate3d(-100%,0,0);
			}
			100%{
				opacity: 1;
				transform: none;
				
			}
		}
			.fadeInLeft {
				animation-name: fadeInLeft;
				animation-duration: 2s;
			}
```


```javascript
		$(window).scroll(function(){
			var ks_area = $(window).height();//可视区域高度
			var scrollHeight = $(window).scrollTop();//被卷上去的那部分
			var divTop = $("#example").offset().top;//盒子距离浏览器顶部的距离
			
			if(ks_area + scrollHeight >= divTop){
				$("#example").addClass("fadeInLeft");
			}
			document.title = ks_area+'-'+scrollHeight+'-'+divTop;
		});

```

[在线演示](http://codepen.io/poetries/pen/MbPqVE)

**3.2 jquery滚动到底部和顶部加载**


```html
<div id="example" ></div>
<script src="http://apps.bdimg.com/libs/jquery/2.1.1/jquery.min.js"></script>
```

```css
#example {
			width: 500px;
			height: 350px;
			background: red;
			margin: 1000px auto 0 auto;
}
```


```javascript
$(window).scroll(function(){
	var ks_area = $(window).height();
	var scrollTop = $(window).scrollTop();
	var wholeHeight = $(document).height();
	
	if(ks_area + scrollTop >=wholeHeight ){
		alert("已经到底部了");
	}else if(scrollTop == 0){
		alert("已经到头部了");
	}
})

```
[在线演示](http://codepen.io/poetries/pen/gLBdZa)

（完）