---
title: Canvas 绘制动画时钟
date: 2016-12-02 19:35:24
tags: 
  - HTML5
  - Canvas
categories: Front-End
---

> 在线演示地址 http://codepen.io/poetries/pen/gLoQzo


```html
 <canvas id="clock" width="500" height="500">
    您的浏览器不支持此效果展示，请升级最新版本
</canvas>
```
<!--more-->

```javascript
var clock = document.getElementById("clock");
var context = clock.getContext("2d");

function drawClock(){
  context.clearRect(0,0,500,500);//清空画布 每画一次 都要清除前面的在重新画
  var now = new Date();
  var sec = now.getSeconds();
  var min = now.getMinutes();
  var hour = now.getHours();

  //小时必须获取浮点类型（小时 + 分数转换成的小时）
  hour = hour + min / 60;
  
  //将24小时进制转换为12小时 不然就是 这样的形式不好了 18:30:10
  hour = hour > 12 ? hour - 12 : hour;

  
  //表盘

  context.lineWidth = 10;
  context.strokeStyle = "greenblue"
  context.beginPath();
  context.arc(250,250,200,0,360,false);//true 顺时针
  context.closePath();
  context.stroke();

  //时刻度
  for(var i = 0; i < 12; i++){
    context.save();//保存当前状态
    context.lineWidth = 7;//时针粗细
    context.strokeStyle = "#000";//时针颜色
    context.translate(250,250);//设置0,0点
    context.rotate(i * 30 * Math.PI / 180);//获得每次旋转之后的角度 设置旋转角度 角度 * Math.PI / 180 = 弧度
    context.beginPath();
    context.moveTo(0,-170);
    context.lineTo(0,-190);
    context.stroke(); //笔触
    context.closePath();
    context.restore();//恢复当前状态
  }
  //分刻度
   for(var i = 0;i < 60; i++){
     context.save();
     context.lineWidth = 5;//设置分刻度粗细
     context.strokeStyle = "#000";
     context.translate(250,250);//重置0,0点
     context.rotate(i * 6 * Math.PI / 180);//设置旋转角度
     context.beginPath();
     context.moveTo(0,-180);
     context.lineTo(0,-190);
     context.stroke();
     context.closePath();

     context.restore();
   }

  //时针

  context.save(); //保存当前绘制的状态
  //设置时针风格
  context.lineWidth = 7;
  context.strokeStyle = "#000";
  context.translate(250,250);//设置异次元空间的0,0 点
  context.rotate( hour * 30 * Math.PI / 180);//设置旋转角度
  context.beginPath();
  context.moveTo(0,-140);
  context.lineTo(0,10);
  context.closePath();
  context.stroke();
  context.restore();

  //分针
  context.save();
  context.lineWidth = 5;//设置分针风格
  context.strokeStyle = "#000";
  context.translate(250,250);
  context.rotate(min * 6 * Math.PI / 180);//设置旋转角度
  context.beginPath();
  context.moveTo(0,-160);
  context.lineTo(0,15);
  context.closePath();
  context.stroke();
  context.restore();

  //秒针
  context.save();
  context.lineWidth = 3;//设置分针风格
  context.strokeStyle = "#f00";
  context.translate(250,250);
  context.rotate(sec * 6 * Math.PI / 180);//设置旋转角度 每秒走的角度是6度
  context.beginPath();
  context.moveTo(0,-170);
  context.lineTo(0,20);
  context.closePath();
  context.stroke();
  
  
  //画时针 分针 秒针的交叉点
  context.beginPath();
  context.arc(0,0,5,0,360,false);//FALSE 逆时针
  context.closePath();
  context.fillStyle = "gray";//设置填充样式
  context.fill();
  context.stroke();
 
  //设置秒针的小圆点
  
  context.beginPath();
  context.arc(0,-160,2,0,360,false);//FALSE 逆时针
  context.closePath();
  context.fillStyle = "blue";//设置填充样式
  context.fill();
  context.stroke();
  
  context.restore();
}
drawClock(); //这一句必须加上 因为setInterval 第一秒不执行
setInterval(drawClock,1000);
```