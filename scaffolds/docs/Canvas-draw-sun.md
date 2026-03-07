---
title: Canvas 绘制八大行星
date: 2016-12-02 23:50:24
tags: 
  - HTML5
  - Canvas
categories: Front-End
---

> 原文链接 http://blog.poetries.top/2016/12/02/Canvas-draw-sun/
> 在线演示地址 http://codepen.io/poetries/pen/KNZLJZ


```html
<canvas width="1000" height="1000" id="canvas" style="background:#000;">
	您的浏览器不支持，请升级浏览器!
</canvas>
```

<!--more-->

```javascript
//设置2d绘图环境
var ctx = document.getElementById("canvas").getContext("2d");

//轨道
function drawTrack(){
  for(var i = 0;i < 8;i++){
    ctx.beginPath();
    ctx.arc(500,500,(i+1) * 50,0,360,false);
    ctx.strokeStyle = "#fff";//设置笔触颜色
    ctx.stroke();
    ctx.closePath();
  }
}


//星球

function Star(x,y,radius,cycle,sColor,eColor){
  //画出星球需要的属性
  //星球的坐标点 星球的半径 星球的颜色（开始颜色、结束颜色）
  //公转周期
  
  //星球坐标点
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.cycle = cycle;
  this.eColor = eColor;
  this.sColor = sColor;
  
  
  this.color = null;//渐变颜色空对象
  this.time = 0;//设置一个计时器
  
  this.draw = function(){
    //save()可以这样理解 原来的画布内容不变 把save（）和restore()之间的内容画好了 在塞进来
    ctx.save();//保存之前的画布内容
    ctx.translate(500,500);//重置0,0坐标点
    ctx.rotate(this.time * (360/this.cycle) * Math.PI / 180);//设置旋转角度
    
    //画星球
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.radius,0,360,false);
    ctx.closePath();
    
    //设置星球的填充颜色
    
    this.color = ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.radius);
    this.color.addColorStop(0,this.sColor);//渐变颜色开始点
    this.color.addColorStop(0,this.eColor);//渐变颜色结束点
    ctx.fillStyle = this.color;
    ctx.fill();//执行填充命令
    
    //填充星球
    
    
    ctx.restore();//恢复之前保存的画布内容
    this.time +=1;
  }
}

 //创建一个太阳对象的构造函数
function Sun(){
  Star.call(this,0,0,20,0,"#F00","#f90");
}
//创建一个水星的对象构造方法
function Mercury(){
  Star.call(this,0,-50,10,87.70,"#A69697","#5C3E40");
}
//创建一个金星的对象构造方法
function Venus(){
  Star.call(this,0,-100,10,224.701,"#C4BBAC","#1F1315");
}
//创建一个地球的对象构造方法
function Earth(){
  Star.call(this,0,-150,10,365.224,"#78B1E8","#050C12");
}
//创建一个火星的对象构造方法
function Mars(){
  Star.call(this,0,-200,10,686.98,"#CEC9B6","#76422D");
}
//创建一个木星的对象构造方法
function Jupiter(){
  Star.call(this,0,-250,10,4332.589,"#C0A48E","#322222");
}
//创建一个土星的对象构造方法
function Saturn(){
  Star.call(this,0,-300,10,10759.5,"#F7F9E3","#5C4533");
}
 //创建一个天王星的对象构造方法
function Uranus(){
  Star.call(this,0,-350,10,30799.095,"#A7E1E5","#19243A");
}
//创建一个海王星的对象构造方法
function Neptune(){
  Star.call(this,0,-400,10,60152,"#0661B2","#1E3B73");
}

 //创建太阳对象实例
var sun=new Sun();

//创建水星对象实例
var water=new Mercury();

//创建金星对象实例
var gold=new Venus();

//创建一个地球对象实例
var diqiu=new Earth();

//创建一个火星对象实例
var fire=new Mars();

//创建一个木星对象实例
var wood=new Jupiter();

//创建一个土星对象实例
var soil=new Saturn();

//创建一个天王星对象实例
var god=new Uranus();

//创建一个海王星对象实例
var sea=new Neptune();


 function move(){
   //清除画布
   ctx.clearRect(0,0,1000,1000);
   //画出轨道
   drawTrack();
   //画出每个星球
   sun.draw();
   water.draw();
   gold.draw();
   diqiu.draw();
   fire.draw();
   wood.draw();
   soil.draw();
   god.draw();
   sea.draw();
 }

//使让星球进行运动
setInterval(move,10);
```
