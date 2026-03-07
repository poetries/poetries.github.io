---
title: Canvas 绘制粒子动画背景
date: 2016-12-02 20:30:24
tags: 
  - HTML5
  - Canvas
categories: Front-End
---

```html
<canvas id="canvas">您的浏览器不支持，请升级最新的版本!</canvas>
```
<!--more-->
```css
*{
	margin:0px;
	padding:0px;
}
body{
	background:#000;
}
canvas{
	position:absolute;
	width:100%;
	height:100%;
}
```

```javascript
window.requestAnimFrame = ( function() {
		return window.requestAnimationFrame ||
					window.webkitRequestAnimationFrame ||
					window.mozRequestAnimationFrame ||
					function( callback ) {
						window.setTimeout( callback, 1000 / 60 );
					};
		})();
		var can = document.getElementById("canvas");
		var cxt = can.getContext("2d");
		can.width = window.innerWidth;
		can.height = window.innerHeight;
		cxt.lineWidth = 0.3;
		//初始链接线条显示位置
		var mousePosition = {
			x : 30*can.width/100,
			y : 30*can.height/100
		}
		//圆形粒子对象参数
		var dots = {
			n : 500,//圆形粒子个数
			distance : 50,//圆形粒子之间的距离
			d_radius : 100,//粒子距离鼠标点的距离
			array : []//保存n个圆形粒子对象
		}
		//创建随即颜色值
		function colorValue(min){
			return Math.floor(Math.random()*255 + min);
		}
		function createColorStyle(r,g,b){
			return "rgba("+r+","+g+","+b+", 1)";
		}
		//混合两个圆形粒子的颜色
		function mixConnect(c1,r1,c2,r2){//圆的颜色 半径
			return (c1*r1+c2*r2)/(r1+r2);
		};
		//生成线条的颜色
		function lineColor(dot1,dot2){//获取具体的圆的颜色再计算
			var color1 = dot1.color,
				color2 = dot2.color;
			var r = mixConnect(color1.r,dot1.radius,color2.r,dot2.radius);
			var g = mixConnect(color1.g,dot1.radius,color2.g,dot2.radius);
			var b = mixConnect(color1.b,dot1.radius,color2.b,dot2.radius);
			return createColorStyle(Math.floor(r),Math.floor(g),Math.floor(b));
		}
		//生成圆形粒子的颜色对象
		function Color(min){
			min = min || 0;
			this.r = colorValue(min);
			this.g = colorValue(min);
			this.b = colorValue(min);
			this.style = createColorStyle(this.r,this.g,this.b);
		}
		//创建圆形粒子对象
		function Dot(){
			//圆形粒子随机圆心坐标点
			this.x = Math.random()*can.width;
			this.y = Math.random()*can.height;
			//x y 方向运动的速度值
			this.vx = -0.5 + Math.random();
			this.vy = -0.5 + Math.random();
			this.radius = Math.random()*5;
			//this.color = "#ff3333";
			this.color = new Color();
		}
		//绘制出圆形粒子
		Dot.prototype.draw = function(){
			cxt.beginPath();
			cxt.fillStyle = this.color.style;
			cxt.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
			cxt.fill();
		}
		//添加圆形粒子
		function createCircle(){
			for (var i=0;i<dots.n ;i++ )
			{
				dots.array.push(new Dot());
			}
		}
		//绘制出圆形粒子
		function drawDots(){
			for (var i=0;i<dots.n ;i++ )
			{
				var dot = dots.array[i];
				dot.draw();
			}
		}
		
		//drawDots();
		//移动
		function moveDots(){
			for (var i=0;i<dots.n ;i++ ){
				var dot = dots.array[i];
				//当圆形粒子对象碰壁的时候就反弹回来
				if (dot.y < 0 || dot.y > can.height)
				{
					dot.vx = dot.vx;
					dot.vy = -dot.vy;
				}else if (dot.x < 0 || dot.x > can.width)
				{
					dot.vx = -dot.vx;
					dot.vy = dot.vy;
				}
				//给圆形粒子圆心坐标加上速度值移动圆形粒子
				dot.x += dot.vx;
				dot.y += dot.vy;
			}
		}
		//链接粒子对象
		function connectDots(){
			for (var i=0;i<dots.n ; i++)
			{
				for ( var j=0;j<dots.n ; j++)
				{
					iDot = dots.array[i];
					jDot = dots.array[j];
					if ((iDot.x - jDot.x) < dots.distance && (iDot.y - jDot.y) < dots.distance && (iDot.x - jDot.x) > -dots.distance && (iDot.y - jDot.y) > -dots.distance)
					{
						if ((iDot.x - mousePosition.x) < dots.d_radius && (iDot.y - mousePosition.y) < dots.d_radius && (iDot.x - mousePosition.x) > -dots.d_radius && (iDot.y - mousePosition.y) > -dots.d_radius)
						{
							cxt.beginPath();
							//cxt.strokeStyle = "yellow";
							cxt.strokeStyle = lineColor(iDot,jDot);
							cxt.moveTo(iDot.x,iDot.y);
							cxt.lineTo(jDot.x,jDot.y);
							cxt.closePath();
							cxt.stroke();
						}
						
					}
				}
			}
		}
		createCircle();
		//让圆形粒子不断的移动
		function animateDots(){
			cxt.clearRect(0,0,can.width,can.height);
			moveDots();
			connectDots()
			drawDots();
			requestAnimFrame(animateDots);
		}
		animateDots();
		
		can.onmousemove = function(ev){
			var ev = ev || window.event;
			mousePosition.x = ev.pageX;
			mousePosition.y = ev.pageY;
		}
		can.onmouseout = function(){
			mousePosition.x = can.width/2;
			mousePosition.y = can.height/2;
		}
```