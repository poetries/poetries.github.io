---
title: JavaScript运动框架之速度时间版本
date: 2017-01-12 15:50:43
tags: 
   - JavaScript
   - 运动框架
categories: Front-End
---

### 一、JavaScript运动框架之速度版
---

#### 1.1 运动框架的实现思路
---

运动，其实就是在一段时间内改变 `left` 、 `right` 、 `width` 、 `height` 、 `opactiy` 的值，到达目的地之后停止

- 位移  `top`,`left`
- 折叠  `width`,`height`
- 淡入淡出 `opacity`
- 时间有关系
  - `setInterval`
  - `setTimeout`
                

- 用javascript直接获取行间样式很容易，但如果要获取非行间样式那我们只能借助函数了。我这里编写了一个名为getStyle的函数，专门处理取非行间的样式

```javascript
function getStyle(obj,attr){
	return getComputedStyle(obj)[attr]?getComputedStyle(obj)[attr]:obj.currentStyle[attr];
}
```

#### 1.2 一些案例演示
---


##### 1.2.1 运动之速
---


```html
<div id="box"></div>
```

```css
#box {
	width: 100px;
	height: 100px;
	background: red;
	 position: relative;
	left: 0;
}
```

```javascript
var box = document.getElementById("box");
var speed = 0; //步长
var target = 600;
var timer = null;
timer = setInterval(function(){
	var curr = parseInt(getStyle(box,"left")); //去除getStyle(box,"left")的单位
	if(curr == target){
		clearInterval(timer);
		speed = 0;
		alert("运动结束");
	}else{
		speed +=10;
		box.style.left = speed + "px";
	}
	

},1000/30);

//监控left的值的变化 怎么样拿到left的值
//alert(getComputedStyle(box)["width"]);
//alert(box.currentStyle["left"]);
// currentStyle --IE 
// getComputedStyle -- 非IE

function getStyle(obj,attr){
	return getComputedStyle(obj)[attr]?getComputedStyle(obj)[attr]:obj.currentStyle[attr];
}
```

[在线演示](http://codepen.io/poetries/pen/wgGqzr)


##### 1.2.2 运动速度之封装1
---

```html
<div id="ball"></div>
```

```css
#ball {
	width: 100px;
	height: 100px;
	background: blue;
}
```

```javascript
var ball = document.getElementById("ball");

ball.onmouseover = function(){
	//同时变换 用的最多
	//move(this,"width",500,10);
	//move(this,"height",500,10);
	move(ball,{"width":400,"height":300},10);
}
ball.onmouseout = function(){
	//move(this,"width",100,-10);
	//move(this,"height",100,-10);
	move(ball,{"width":100,"height":100},-10);
}
function move(obj,json,speed){
	clearInterval(obj.timer);
	var mark = true;
	obj.timer = setInterval(function(){
		for(var attr in json){
			var curr = parseInt(getStyle(obj,attr));
			var target = json[attr];
			if(curr != target){
				obj.style[attr] = curr+speed+"px";
				mark = false;
		  }
		}
		if(mark){
			clearInterval(obj.timer);
		}
	},1000/30);
}


function getStyle(obj,attr){
	return getComputedStyle(obj)[attr]?getComputedStyle(obj)[attr]:obj.currentStyle[attr];
}
```

- 需要注意的地方
  - 当需要两个动画的时候，会执行后面一个，解决办法如下，回调函数
  - 当需要两个以上的时候，需要考虑是否可写一行代码变换多个属性
  - 变换不一致的时候，定时器被提前清除


[在线演示](http://codepen.io/poetries/pen/KazvNe)

##### 1.2.3 运动速度之封装2--增加opacity

```html
<div id="ball"></div>
```

```css
#ball {
  position: relative;
  left: 0;
  top: 0;
  width: 100px;
  height: 100px;
  background: blue;
  opacity: 1;
}
```

```javascript
var ball = document.getElementById("ball");
ball.onmouseover = function(){
	move(ball,{"width":300,"height":300,"opacity":0.3});
}
//			ball.onmouseout = function(){
//				move(ball,{"width":100,"height":100},-10);
//			}
function move(obj,json){
	clearInterval(obj.timer);
	var mark = true;
	obj.timer = setInterval(function(){
		for(var attr in json){
			var curr = null;
			var target = json[attr];
			var speed = null;
			if(attr == "opacity"){
				curr = getStyle(obj,attr)*100;
				speed = (target*100-curr)*0.15;
			}else {
				curr = parseInt(getStyle(obj,attr));
				speed = (target - curr)*0.15;
			}
			speed = speed>0 ? Math.ceil(speed):Math.floor(speed);
			if(curr != target){
				if(attr == "opacity"){
					obj.style[attr] = (curr+speed)/100;
				}else {
					obj.style[attr] = curr+speed+"px";
				}
				
				mark = false;
		  }
		}
		if(mark){
			clearInterval(obj.timer);
		}
	},1000/30);
}


function getStyle(obj,attr){
	return getComputedStyle(obj)[attr]?getComputedStyle(obj)[attr]:obj.currentStyle[attr];
}
```

[在线演示](http://codepen.io/poetries/pen/PWNKmj)


- 需要注意的地方
    - 当需要两个动画的时候，会执行后面一个，解决办法如下，回调函数
    - 当需要两个以上的时候，需要考虑是否可写一行代码变换多个属性
    - 变换不一致的时候，定时器被提前清除
    - 速度`speed`不要写死



#### 1.3 运动框架之应用

##### 1.3.1 分享按钮

```html
<div id="ball"></div>
<div id="box1">
  <div id="box2">分享到</div>
</div>
```
```javascript
var box1 = document.getElementById("box1");
var ball = document.getElementById("ball");

box1.onmouseover = function(){
  move(this,"left",0,10);
}
box1.onmouseout = function(){
  move(this,"left",-100,-10);
}
//问题一：当需要两个动画的时候，会执行后面一个，解决办法如下，回调函数
ball.onmouseover = function(){
  //同时变换 用的最多
  //move(this,"width",500,10);
  //move(this,"height",500,10);
  //列队在执行
  move(ball,"width",500,10,function(){
    move(ball,"height",500,10);
  });
}
ball.onmouseout = function(){
  //move(this,"width",100,-10);
  //move(this,"height",100,-10);
  move(ball,"width",100,-10,function(){
    move(ball,"height",100,-10);
  });
}
var timer = null;
function move(obj,attr,target,speed,callback){
  clearInterval(timer); //obj.timer缓存到各自的obj下
  timer = setInterval(function(){
    var curr = parseInt(getStyle(obj,attr));
    if(curr == target){
      clearInterval(timer);
      callback && callback();
    }else {
      obj.style[attr] = curr+speed+"px";
    }
  },1000/30);
}




function getStyle(obj,attr){
  return getComputedStyle(obj)[attr]?getComputedStyle(obj)[attr]:obj.currentStyle[attr];
}
```

[在线演示](http://codepen.io/poetries/pen/LxNjzp)


##### 1.3.2运动框架之轮播图应用


- [焦点轮播--基本版本--在线演示](http://codepen.io/poetries/pen/JEXyaG)
- [焦点轮播--淡入淡出--在线演示](http://codepen.io/poetries/pen/apNyPv)
- [焦点轮播--左右--在线演示](http://codepen.io/poetries/pen/ggrxqo)
- [ 焦点轮播--上下--在线演示](http://codepen.io/poetries/pen/mRPMoq)


###### 1.3.2.1 焦点轮播--左右-无缝-速度版实现
---

```html
<div id="box">
	<ul id="imgBox">
		<li>![](http://upload-images.jianshu.io/upload_images/1480597-c72819402fb928e8.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)</li>
		<li>![](http://upload-images.jianshu.io/upload_images/1480597-6830ca74fe1e6fcd.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)</li>
		<li>![](http://upload-images.jianshu.io/upload_images/1480597-5d38376e63ffd0b0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)</li>
		<li>![](http://upload-images.jianshu.io/upload_images/1480597-2aa932ffbba4091e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)</li>
		<li>![](http://upload-images.jianshu.io/upload_images/1480597-c72819402fb928e8.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)</li>
	</ul>
	<ol id="btn">
		<li class="active">1</li>
		<li>2</li>
		<li>3</li>
		<li>4</li>
	</ol>
</div>
<script src="http://7xq6al.com1.z0.glb.clouddn.com/Animate.min.js"></script>
<script type="text/javascript">
    var box = document.querySelector("#box");
	var imgUl = document.querySelector("#imgBox");
	var btns = document.querySelector("#btn").querySelectorAll("li");
	var len = btns.length;
	var lenImg = imgUl.querySelectorAll("li").length;
	var index = 0; //控制img的索引
	var cindex = 0;//控制按钮的索引
	var timer = null;
	
	for (var i=0;i<len;i++) {
			(function(index){
				btns[index].onmouseover = function(){
					for (var j=0;j<len;j++){
						btns[j].className = "";
				}
					cindex = index;//保持索引同步
					animateSpeed(imgUl,{"left":-970*index});
					this.className = "active";
				}
			})(i);
	}
	function autoPlay(){
		index++;
		cindex++;
		cindex %=len;//限制长度
		for (var j=0;j<len;j++){
			btns[j].className = "";
		}
		animateSpeed(imgUl,{"left":-970*index},function(){
			
			if(index == lenImg-1){
				this.style.left = 0;
				index = 0;
			}
		});
		btns[cindex].className = "active";
	}
	timer = setInterval(autoPlay,2000);
	box.onmouseover = function(){
		clearInterval(timer);
	}
	box.onmouseout = function(){
		timer = setInterval(autoPlay,2000);
	}
</script>
		
```

```css
*{
  padding: 0;
  margin: 0;
}
body{
  font-size: 14px;
  font-family: "微软雅黑";
}
ul,li{
  list-style: none;
}
#box {
  position: relative;
  width: 970px;
  height: 350px;
  margin: 30px auto;
  overflow: hidden;
}
#imgBox {
  width:1000%;/*自动计算百分比*/
  position: absolute;
  left: 0;
}
#imgBox li{
  width: 970px;
  height: 350px;
  float: left;
}

#imgBox li img {
  width: 970px;
  height: 350px;
}
#btn {
  width: 120px;
  position: absolute;
  right: 10px;
  bottom: 10px;
}
#btn li {
  width: 20px;
  height: 20px;
  line-height: 20px;
  border-radius: 50%;
  text-align: center;
  cursor: pointer;
  background: #fff;
  margin: 0 2px;
  float: left;
}
#btn li.active {
  background: #F17A5C;
  color: #fff;
}
```

```javascript

//速度版本
(function(win){
    function move(obj,json,callback){
        clearInterval(obj.timer);
        obj.timer = setInterval(function(){
            var mark = true;
            for(var attr in json){
                var cur = null;
                if(attr == "opacity"){
                    cur = getStyle(obj,attr)*100;
                }else{
                    //如果没写 默认填充成0
                    cur = parseInt(getStyle(obj,attr))||0;
                }
                var target = json[attr];
                var speed = (target - cur)*0.2;
                speed = speed>0?Math.ceil(speed):Math.floor(speed);
                if(cur != target){
                    if(attr == "opacity"){
                        //IE opacity兼容问题
                        obj.style.filter = "alpha(opacity="+(cur+speed)+")";
                        obj.style[attr] = (cur + speed)/100;
                    }else{
                        obj.style[attr] = cur + speed + "px";
                    }
                    mark = false;

                };
            }
            if(mark){
                clearInterval(obj.timer);
                callback && callback.call(obj);
            }
        },1000/30);
    }
    win.animateSpeed = move;
})(window);

 	
function getStyle(obj,attr){
	return getComputedStyle(obj)[attr]?getComputedStyle(obj)[attr]:obj.currentStyle[attr];
}

function getId(id){
	return document.getElementById(id);
}
```



### 二、JavaScript运动框架之时间版
---


#### 2.1 关于运动
---

- 速度的运动 通过速度来控制元素的 位移 / 折叠 / 淡入淡出
- 时间的运动 通过时间来控制元素的 位移 / 折叠 / 淡入淡出(jQuery)
- 时间的运动 基于一些数学公式 匀速运动 在路程的每一个点 速度都一样


#### 2.2 一些案例演示
---


- [运动框架之时间版本-1](http://codepen.io/poetries/pen/jyqGPR)
- [运动框架之时间版本-2](http://codepen.io/poetries/pen/apNLZB)
- [运动框架之时间版本-3](http://codepen.io/poetries/pen/zNqEKB)
- [运动框架之时间版本-4](http://codepen.io/poetries/pen/MJyEbY)



#### 2.3 运动框架之时间版本-借助animate一些函数实现--综合完整版
---


```html
<div id="box2"></div>
<div id="box3"></div>
<div id="box4"></div>
<div id="box5"></div>
<script type="text/javascript">

 //时间版本
 getId("box2").onclick = function(){
 	animateTime(getId("box2"),{
 		"left":500,
 		"opacity":100
 	},1000,"elasticOut",function(){
 		this.innerHTML = "我是时间版本";
 	});
 }
getId("box3").onclick = function(){
 	animateTime(getId("box3"),{
 		"left":500,
 		"opacity":100
 	},1000,"backIn",function(){
 		this.innerHTML = "我是时间版本";
 	});
 }
getId("box4").onclick = function(){
 	animateTime(getId("box4"),{
 		"left":500,
 		"opacity":100
 	},1000,"bounceIn",function(){
 		this.innerHTML = "我是时间版本";
 	});
 }
getId("box5").onclick = function(){
 	animateTime(getId("box5"),{
 		"left":500,
 		"opacity":100
 	},1000,"bounceBoth",function(){
 		this.innerHTML = "我是时间版本";
 	});
 }

 
 
</script>
```

```css
#box1,#box2,#box3,#box4,#box5 {
	position: relative;
	width: 100px;
	height: 100px;
	line-height: 100px;
	text-align: center;
	background: red;
	color: #fff;
	font-size: 12px;
	opacity: 0.5;
	filter:alpha(opcity=20);/**兼容IE*/
	margin: 10px;
	
}
```

```javascript

/*t b c d
t current time   :nTime-sTime
b begining time  :curr
c chang in value :变化量end-curr
d duration       :持续时间 time */
/**
* 
* @param {Object} obj 元素对象
* @param {Object} json 多个属性
* @param {Object} time 变化时间
* @param {Object} prop 运动函数
* @param {Object} callback 回调函数
*/
//时间版本
(function(win){ 
function move(obj,json,time,prop,callback){
//一般定时器结束后最好清除
clearInterval(obj.timer);
var curr = {};
var end = {};
//通过for in 在上车前把所有东西装到包里
for(var attr in json){
	if(attr == "opacity"){//opacity特殊东西特殊对待
		curr[attr] = getStyle(obj,attr)*100;//化为整数好计算
	}else{
		curr[attr] = parseInt(getStyle(obj,attr))||0;
	}
	end[attr] = json[attr];
	
}


//如果没写默认值 默认就是0 不然在IE出问题
//var curr = parseInt(getStyle(obj,attr))||0;
//var end = target;
var sTime = new Date();//开始时间T0
//开始变换了
obj.timer = setInterval(function(){
	var nTime = new Date();//当前时间Tt
	var t = nTime -sTime;
	var d = time;
	//St = (Tt-T0)/Time*(S-S0)+S0
	//(nTime-sTime)/time 比例最多为1
	/*var prop = (nTime-sTime)/time; */
	if(t >=d){
		t = d;
		clearInterval(obj.timer);
		callback && callback.call(obj);
	}
	for(var attr in json){
		var b = curr[attr];
		var c = end[attr] - b;
		if(attr == "opacity"){
			//var s = prop*(end[attr]-curr[attr])+curr[attr];
			var s = Tween[prop](t,b,c,d);
			obj.style[attr] = s/100;
			obj.style.filter = "alpha(opacity="+s+")";
		}else{
			//var s = prop*(end[attr]-curr[attr])+curr[attr];
			var s = Tween[prop](t,b,c,d);
			obj.style[attr] = s+"px";
		}

	}

	
},13);
var Tween = {
    linear: function (t, b, c, d){  //匀速
        return c*t/d + b;   //  t/d = prop;
    },
    easeIn: function(t, b, c, d){  //加速曲线
        return c*(t/=d)*t + b;
    },
    easeOut: function(t, b, c, d){  //减速曲线
        return -c *(t/=d)*(t-2) + b;
    },
    easeBoth: function(t, b, c, d){  //加速减速曲线
        if ((t/=d/2) < 1) {
            return c/2*t*t + b;
        }
        return -c/2 * ((--t)*(t-2) - 1) + b;
    },
    easeInStrong: function(t, b, c, d){  //加加速曲线
        return c*(t/=d)*t*t*t + b;
    },
    easeOutStrong: function(t, b, c, d){  //减减速曲线
        return -c * ((t=t/d-1)*t*t*t - 1) + b;
    },
    easeBothStrong: function(t, b, c, d){  //加加速减减速曲线
        if ((t/=d/2) < 1) {
            return c/2*t*t*t*t + b;
        }
        return -c/2 * ((t-=2)*t*t*t - 2) + b;
    },
    elasticIn: function(t, b, c, d, a, p){  //正弦衰减曲线（弹动渐入）
        if (t === 0) {
            return b;
        }
        if ( (t /= d) == 1 ) {
            return b+c;
        }
        if (!p) {
            p=d*0.3;
        }
        if (!a || a < Math.abs(c)) {
            a = c;
            var s = p/4;
        } else {
            var s = p/(2*Math.PI) * Math.asin (c/a);
        }
        return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
    },
    elasticOut: function(t, b, c, d, a, p){    //正弦增强曲线（弹动渐出）
        if (t === 0) {
            return b;
        }
        if ( (t /= d) == 1 ) {
            return b+c;
        }
        if (!p) {
            p=d*0.3;
        }
        if (!a || a < Math.abs(c)) {
            a = c;
            var s = p / 4;
        } else {
            var s = p/(2*Math.PI) * Math.asin (c/a);
        }
        return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
    },
    elasticBoth: function(t, b, c, d, a, p){
        if (t === 0) {
            return b;
        }
        if ( (t /= d/2) == 2 ) {
            return b+c;
        }
        if (!p) {
            p = d*(0.3*1.5);
        }
        if ( !a || a < Math.abs(c) ) {
            a = c;
            var s = p/4;
        }
        else {
            var s = p/(2*Math.PI) * Math.asin (c/a);
        }
        if (t < 1) {
            return - 0.5*(a*Math.pow(2,10*(t-=1)) *
                    Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
        }
        return a*Math.pow(2,-10*(t-=1)) *
                Math.sin( (t*d-s)*(2*Math.PI)/p )*0.5 + c + b;
    },
    backIn: function(t, b, c, d, s){     //回退加速（回退渐入）
        if (typeof s == 'undefined') {
           s = 1.70158;
        }
        return c*(t/=d)*t*((s+1)*t - s) + b;
    },
    backOut: function(t, b, c, d, s){
        if (typeof s == 'undefined') {
            s = 3.70158;  //回缩的距离
        }
        return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
    },
    backBoth: function(t, b, c, d, s){
        if (typeof s == 'undefined') {
            s = 1.70158;
        }
        if ((t /= d/2 ) < 1) {
            return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
        }
        return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
    },
    bounceIn: function(t, b, c, d){    //弹球减振（弹球渐出）
        return c - Tween['bounceOut'](d-t, 0, c, d) + b;
    },
    bounceOut: function(t, b, c, d){
        if ((t/=d) < (1/2.75)) {
            return c*(7.5625*t*t) + b;
        } else if (t < (2/2.75)) {
            return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
        } else if (t < (2.5/2.75)) {
            return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
        }
        return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
    },
    bounceBoth: function(t, b, c, d){
        if (t < d/2) {
            return Tween['bounceIn'](t*2, 0, c, d) * 0.5 + b;
        }
        return Tween['bounceOut'](t*2-d, 0, c, d) * 0.5 + c*0.5 + b;
        }
};
}
win.animateTime = move;	
})(window);
 
 ```

[在线演示](http://codepen.io/poetries/pen/ggrGLj)



### 三、运动框架之时间速度版完整封装

```javascript
/*t b c d
t current time   :nTime-sTime
b begining time  :curr
c chang in value :变化量end-curr
d duration       :持续时间 time */
/**
 * 
 * @param {Object} obj 元素对象
 * @param {Object} json 多个属性
 * @param {Object} time 变化时间
 * @param {Object} prop 运动函数
 * @param {Object} callback 回调函数
 */
//时间版本
(function(win){ 
	function move(obj,json,time,prop,callback){
	//一般定时器结束后最好清除
	clearInterval(obj.timer);
	var curr = {};
	var end = {};
	//通过for in 在上车前把所有东西装到包里
	for(var attr in json){
		if(attr == "opacity"){//opacity特殊东西特殊对待
			curr[attr] = getStyle(obj,attr)*100;//化为整数好计算
		}else{
			curr[attr] = parseInt(getStyle(obj,attr))||0;
		}
		end[attr] = json[attr];
		
	}
	
	
	//如果没写默认值 默认就是0 不然在IE出问题
	//var curr = parseInt(getStyle(obj,attr))||0;
	//var end = target;
	var sTime = new Date();//开始时间T0
	//开始变换了
	obj.timer = setInterval(function(){
		var nTime = new Date();//当前时间Tt
		var t = nTime -sTime;
		var d = time;
		//St = (Tt-T0)/Time*(S-S0)+S0
		//(nTime-sTime)/time 比例最多为1
		/*var prop = (nTime-sTime)/time; */
		if(t >=d){
			t = d;
			clearInterval(obj.timer);
			callback && callback.call(obj);
		}
		for(var attr in json){
			var b = curr[attr];
			var c = end[attr] - b;
			if(attr == "opacity"){
				//var s = prop*(end[attr]-curr[attr])+curr[attr];
				var s = Tween[prop](t,b,c,d);
				obj.style[attr] = s/100;
				obj.style.filter = "alpha(opacity="+s+")";
			}else{
				//var s = prop*(end[attr]-curr[attr])+curr[attr];
				var s = Tween[prop](t,b,c,d);
				obj.style[attr] = s+"px";
			}

		}

		
	},13);
	var Tween = {
        linear: function (t, b, c, d){  //匀速
            return c*t/d + b;   //  t/d = prop;
        },
        easeIn: function(t, b, c, d){  //加速曲线
            return c*(t/=d)*t + b;
        },
        easeOut: function(t, b, c, d){  //减速曲线
            return -c *(t/=d)*(t-2) + b;
        },
        easeBoth: function(t, b, c, d){  //加速减速曲线
            if ((t/=d/2) < 1) {
                return c/2*t*t + b;
            }
            return -c/2 * ((--t)*(t-2) - 1) + b;
        },
        easeInStrong: function(t, b, c, d){  //加加速曲线
            return c*(t/=d)*t*t*t + b;
        },
        easeOutStrong: function(t, b, c, d){  //减减速曲线
            return -c * ((t=t/d-1)*t*t*t - 1) + b;
        },
        easeBothStrong: function(t, b, c, d){  //加加速减减速曲线
            if ((t/=d/2) < 1) {
                return c/2*t*t*t*t + b;
            }
            return -c/2 * ((t-=2)*t*t*t - 2) + b;
        },
        elasticIn: function(t, b, c, d, a, p){  //正弦衰减曲线（弹动渐入）
            if (t === 0) {
                return b;
            }
            if ( (t /= d) == 1 ) {
                return b+c;
            }
            if (!p) {
                p=d*0.3;
            }
            if (!a || a < Math.abs(c)) {
                a = c;
                var s = p/4;
            } else {
                var s = p/(2*Math.PI) * Math.asin (c/a);
            }
            return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
        },
        elasticOut: function(t, b, c, d, a, p){    //正弦增强曲线（弹动渐出）
            if (t === 0) {
                return b;
            }
            if ( (t /= d) == 1 ) {
                return b+c;
            }
            if (!p) {
                p=d*0.3;
            }
            if (!a || a < Math.abs(c)) {
                a = c;
                var s = p / 4;
            } else {
                var s = p/(2*Math.PI) * Math.asin (c/a);
            }
            return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
        },
        elasticBoth: function(t, b, c, d, a, p){
            if (t === 0) {
                return b;
            }
            if ( (t /= d/2) == 2 ) {
                return b+c;
            }
            if (!p) {
                p = d*(0.3*1.5);
            }
            if ( !a || a < Math.abs(c) ) {
                a = c;
                var s = p/4;
            }
            else {
                var s = p/(2*Math.PI) * Math.asin (c/a);
            }
            if (t < 1) {
                return - 0.5*(a*Math.pow(2,10*(t-=1)) *
                        Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
            }
            return a*Math.pow(2,-10*(t-=1)) *
                    Math.sin( (t*d-s)*(2*Math.PI)/p )*0.5 + c + b;
        },
        backIn: function(t, b, c, d, s){     //回退加速（回退渐入）
            if (typeof s == 'undefined') {
               s = 1.70158;
            }
            return c*(t/=d)*t*((s+1)*t - s) + b;
        },
        backOut: function(t, b, c, d, s){
            if (typeof s == 'undefined') {
                s = 3.70158;  //回缩的距离
            }
            return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
        },
        backBoth: function(t, b, c, d, s){
            if (typeof s == 'undefined') {
                s = 1.70158;
            }
            if ((t /= d/2 ) < 1) {
                return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
            }
            return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
        },
        bounceIn: function(t, b, c, d){    //弹球减振（弹球渐出）
            return c - Tween['bounceOut'](d-t, 0, c, d) + b;
        },
        bounceOut: function(t, b, c, d){
            if ((t/=d) < (1/2.75)) {
                return c*(7.5625*t*t) + b;
            } else if (t < (2/2.75)) {
                return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
            } else if (t < (2.5/2.75)) {
                return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
            }
            return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
        },
        bounceBoth: function(t, b, c, d){
            if (t < d/2) {
                return Tween['bounceIn'](t*2, 0, c, d) * 0.5 + b;
            }
            return Tween['bounceOut'](t*2-d, 0, c, d) * 0.5 + c*0.5 + b;
            }
    };
 }
	win.animateTime = move;	
 })(window);


//速度版本
(function(win){
    function move(obj,json,callback){
        clearInterval(obj.timer);
        obj.timer = setInterval(function(){
            var mark = true;
            for(var attr in json){
                var cur = null;
                if(attr == "opacity"){
                    cur = getStyle(obj,attr)*100;
                }else{
                    //如果没写 默认填充成0
                    cur = parseInt(getStyle(obj,attr))||0;
                }
                var target = json[attr];
                var speed = (target - cur)*0.2;
                speed = speed>0?Math.ceil(speed):Math.floor(speed);
                if(cur != target){
                    if(attr == "opacity"){
                        //IE opacity兼容问题
                        obj.style.filter = "alpha(opacity="+(cur+speed)+")";
                        obj.style[attr] = (cur + speed)/100;
                    }else{
                        obj.style[attr] = cur + speed + "px";
                    }
                    mark = false;

                };
            }
            if(mark){
                clearInterval(obj.timer);
                callback && callback.call(obj);
            }
        },1000/30);
    }
    win.animateSpeed = move;
})(window);

 	
function getStyle(obj,attr){
	return getComputedStyle(obj)[attr]?getComputedStyle(obj)[attr]:obj.currentStyle[attr];
}

function getId(id){
	return document.getElementById(id);
}
```

- 更多使用记录，详情 https://github.com/poetries/Animate