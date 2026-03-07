---
title: HTML5之API总结
date: 2016-11-26 14:35:24
tags: 
  - HTML5
  - API
categories: Front-End
---

### 一、Canvas API
---

`canvas API`是`H5`标准中最复杂的部分， 它提供几种属性和方法，可以在`canvas`元素上创建图形应用

#### 方法
---
<!--more-->
以下方法专门用于调用canvas API

- `getContext(context)`创建可绘制图形的画布上下文，接受两个值，`2d`和`3d`

- `fillRect(x,y,width,height) `绘制实心矩形

- `strokeRect(x,y,width,height)`绘制矩形轮廓

- `clearRect(x,y,width,height)`清除画布指定区域内容

- `createLinearGradient(x1,y1,x2,y2)`创建一个线性渐变效果

- `createRadialGradient(x1,y1,r1,x2,y2,r2)`创建一个放射渐变效果

- `addColorStop(position,color)`用于声明渐变颜色` position`范围是`0.0-1.0` 用于确定颜色开始变化位置

- `beginPath() `开始一条新路径

- `closePath()`在路径最后实现封闭该路径，它会生成一条直线，连接笔触的最后一个位置与路径的起点。如想要保持路径开放，使用`fill()`绘图，不用这个方法

- `stroke()` 用于创建路径轮廓

- `fill()`用于绘制实心形状

- `clip()`用于创建一个由路径定义的裁剪区域，只有在落入形状内的内容才绘制到画布上

- `moveTo(x,y)`将虚拟笔触移到新位置，下一个方法会从改点的开始继续设置路径

- `lineTo(x,y)`在新路径上添加一条直线

- `rect(x,y,width,height)`在路径为`(x,y)`位置上添加`width`和`height`矩形

- `arc(x,y,radius,startAngle,endAngle,direction)`在路径上添加一条弧线 ,`x`,`y`指定弧线的中心，角度单位为弧度，`direction`是一个表示顺时针或逆时针的布尔值。使用公式 `Math.PI/180x`角度，将角度转换为半径

- `strokeText(text,x,y,max)` 直接在画布上绘制文字轮廓。可选参数，max声明文字最大尺寸

- `fillText(text,x,y,max)`直接在画布上绘制实心文字。可选参数，`max`声明文字最大尺寸

- `translate(x,y) `将画布原点移到点`(x,y)`处，原点`（0,0）`初始位置位于`canvas`所在区域的左上角

- `rorate(angle) `这个方法可以使画布原点为中心发生旋转，角度必须是弧度。使用公式` Math.PI/180x` 将角度转换为弧度

- `scale(x,y)` 改变画布比例 默认值是`（1.0,1.0）`这些值可以是负值

- `transform（m1,m2,m3,m4,dx,dy）`修改画布的转换矩阵。新矩阵是基于之前的矩阵得到的

- `setTransform（m1,m2,m3,m4,dx,dy）`修改画布的转换矩阵。重置之前的值，声明新的值

- `save()`保存画布状态，包括转换矩阵、样式属性、裁剪遮罩

- `restore()` 恢复上一次保存的状态

- `drawImage()` 在画布上绘制图像


#### 属性
---
`canvas API`专用属性列表

- `rect( x, y, width, height ) `  绘制矩形
- `fillRect( x, y, width, height ) ` 绘制被填充的矩形
- `strokeRect( x, y, width, height ) ` 绘制矩形（无填充）
- `clearRect( x, y, width, height )` 清除指定的矩形内的像素

- `fill() ` 填充当前绘图（路径）
- `stroke() `绘制已定义的路径
- `beginPath()`  起始（重置）当前路径
- `moveTo( x, y ) ` 将笔触移动到指定的坐标(x,y)
- `lineTo( x, y )`  绘制一条从当前位置到指定的坐标(x,y)的直线
- `clip() ` 从原始画布剪切任意形状和尺寸的区域
- `quadraticCurveTo() ` 创建二次贝塞尔曲线
- `bezierCurveTo()`   创建三次贝塞尔曲线
- `arc( x, y, radius, startAngle, endAngle, anticlockwise) ` 绘制圆或圆弧
- `arcTo( x1, y1, x2, y2, radius) ` 根据给定点画圆弧，再以直线连接两个点
- `isPointInPath( x, y )`  检测指定的点是否在当前路径中，在则返回true。

- `fillStyle`  设置或返回用于填充绘画的颜色、渐变或模式
- `strokeStyle ` 设置或返回用于笔触的颜色、渐变或模式
- `shadowColor ` 设置或返回用于阴影的颜色
- `shadowBlur`   设置或返回用于阴影的模糊级别
- `shadowOffsetX ` 设置或返回阴影与形状的水平距离
- `shadowOffsetY ` 设置或返回阴影与形状的垂直距离

- `lineCap ` 设置或返回线条的结束点样式（`butt`、`round`、`square`）
- `lineJoin ` 设置或返回当两条线交汇时，边角的类型（`bevel`、`round`、miter）
- `lineWidth ` 设置或返回当前的线条宽度
- `miterLimit ` 设置或返回最大斜接长度

- `createLinearGradient( x0, y0, x1, y1 ) ` 创建线性渐变
- `createPattern( image/canvas/video, repeat ) ` 在指定的方向内重复绘制指定的元素
- `createRadialGradient( x0, y0, r0, x1, y1, r1 ) `创建径向渐变
- `addColorStop( stop, color ) ` 规定渐变对象中的颜色和停止位置

- `font`  设置或返回文本内容的当前字体属性（和css的font一样）
- `textAlign ` 设置或返回文本内容的当前对齐方式
- `textBaseline ` 设置或返回在绘制文本时使用的当前文本基线
- `fillText( text, x, y ) ` 在画布上绘制“被填充”的文本
- `strokeText( text, x, y ) ` 在画布上绘制文本（无填充）
- `measureText( text )`  返回包含指定文本宽度的对象（属性width获取宽度）

- `drawImage( image/canvas, x, y )`、drawImage( image/canvas, x, y, width, height )、drawImage( image/canvas, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight )`  在画布上绘制图像、画布或视频

- `createImageData( width, height )`、createImageData(imageData)  绘制ImageData对象
- `getImageData( x, y, width, height )`  返回ImageData对象，该对象为画布上指定的矩形复制像素数据。
- `putImageData( ImageData, x, y )`、putImageData( imageData, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight )  把图像数据放回画布上。
- `width`  返回ImageData对象的宽度
- `height`  返回`ImageData`对象的高度
- `data`  返回一个对象，包含指定的ImageData对象的图像数据

- `globalAlpha`  设置或返回绘图的当前alpha或透明度
- `globalCompositeOperation`  设置或返回新图像如何绘制到已有的图像上。

- `scale( x, y ) ` 缩放当前绘图
- `translate( x, y ) ` 重新设置画布上的(0,0)位置
- `rotate( angle ) ` 选择当前绘图，单位为“弧度”，角度转弧度公式`（ degrees*Math.PI/180）`
- `transform( m11, m12, m21, m22, dx, dy ) ` 替换绘图的当前转换矩阵
- `setTransform() ` 将当前转换重置为单元矩阵，然后运行transform()

- `save()`  保存当前环境的状态
- `restore()`  恢复之前保存过的路径状态和属性

- `getContext('2d')`  获取`2d`对象
- `toDataURL() ` 将canvas转换成图片，返回地址


#### canvas常用总结
---

- 标签 `<canvas>`
  - 不支持`canvas` 的浏览器可以看到的内容
- `<canvas>` 绘制环境
  - `getContext("2d")`;目前支持`2d`的场景
  

- 绘制矩形
  - `rect(L,T,W,H)`:创建一个矩形
  - `fillRect(L,T,W,H)`:绘制填充的矩形
  - `strokeRect(L,T,W,H)`绘制矩形(无填充)
    - 默认一像素黑色边框
- 设置绘图
  - `fillStyle`:填充颜色(绘制`canvas`是有顺序的)
  - `lineWidth`:线宽度，笔迹粗细
  - `strokeStyle`:边线颜色
- 绘制路径
  - `stroke` ：绘制，划线(黑色默认)
  - `fill` :填充(黑色默认)
  - `rect(矩形区域)` 
  - `clearRect` 擦除一个矩形区域
  - `save` 进入到XXX（高逼格）状态
  - `restore` 退出xxx（高逼格）状态
 
- 绘制圆形
  - `arc(x,y,半径,起始弧度,结束弧度,旋转方向)`
  - `x`，`y`起始位置
  - 弧度与角度：`弧度=角度 x π / 180`
  - 旋转方向：顺时针（默认：`false`），逆时针（`true`）
- **绘制字体**
  - `font`：设置字体大小
  - `fillText`：填充字体
  - `strokeText`：绘制字体

	
### 二、视频音频
---

- 视频音频格式的简单介绍
  - 常见的视频格式
    - 视频的组成部分：画面、音频、编码格式
    - 视频编码：H.264、Theora、VP8(google开源)
  - 常见的音频格式
    - 视频编码：ACC、MP3、Vorbis


- `HTML5`能在完全脱离插件的情况下播放音视频,但是不是所有格式都支持。
- 支持的视频格式：
    - `Ogg=`带有`Theora`视频编码`+Vorbis`音频编码的`Ogg`文件
    - `MEPG4=`带有H.264视频编码`+AAC`音频编码的`MPEG4`文件
    - `WebM=`带有`VP8`视频编码`+Vorbis`音频编码的`WebM`格式

#### `Video`的使用
---

- 单独用法
  - `<video src="文件地址" controls="controls"></video>`
- 带提示用法

```html
< video src="文件地址" controls="controls">
	您的浏览器暂不支持video标签。播放视频
</ video >
```

- 兼容用法

```html
< video  controls="controls"  width="300">
	<source src="move.ogg" type="video/ogg" >
	<source src="move.mp4" type="video/mp4" >
	您的浏览器暂不支持video标签。播放视频
</ video >
```

- `Video`的常见属性

|属性|	值|	描述|
|---|---|---|
|Autoplay|	Autoplay|	视频就绪自动播放|
|controls|	controls|	向用户显示播放控件|
|Width|	Pixels(像素)|	设置播放器宽度|
|Height|	Pixels(像素)|	设置播放器高度|
|Loop|	Loop|	播放完是否继续播放该视频，循环播放|
|Preload	|load{auto,meta,none}|	规定是否预加载视频。|
|Src	|url	|视频url地址|
|Poster|	Imgurl	|加载等待的画面图片|
|Autobuffer|	Autobuffer	|设置为浏览器缓冲方式，不设置autoply才有效|

- `Video`的`API`方法

|方法|	属性|	事件|
|---|---|---|
|play()|	currentSrc|	play|
|pause()|	currentTime|	pause|
|load()|	videoWidth|	progress|
|canPlayType()|	videoHeight|	error|

### 三、地理信息与本地存储
---

#### 地理位置
---

- 经度  :   南北极的连接线
- 纬度  :   东西连接的线

- 位置信息从何而来
    - `IP`地址
    - `GPS`全球定位系统
    - `Wi-Fi`无线网络
    - 基站

- `avigator.geolocation`
  - 单次定位请求  ：`getCurrentPosition`(请求成功,请求失败,数据收集方式)
  - 请求成功函数
    - 经度 :  `coords.longitude`
    - 纬度 :  `coords.latitude`
    - 准确度 :  `coords.accuracy`
    - 海拔 : ` coords.altitude`
    - 海拔准确度 :  `coords.altitudeAcuracy`
    - 行进方向 :  `coords.heading`
    - 地面速度 :  `coords.speed`
    - 请求的时间: `new Date(position.timestamp)`

  - 请求失败函数
    - 失败编号  ：`code`
      - 0  :  不包括其他错误编号中的错误
      - 1  :  用户拒绝浏览器获取位置信息
      - 2  :  尝试获取用户信息，但失败了
      - 3  :   设置了`timeout`值，获取位置超时了
  - 数据收集 :  json的形式
      - `enableHighAcuracy`  :  更精确的查找，默认`false`
      - `timeout ` :  获取位置允许最长时间，默认`infinity`
      - `maximumAge` :  位置可以缓存的最大时间，默认`0`

  - 多次定位请求*  : ` watchPosition`
      - 移动设备有用，位置改变才会触发
      - 配置参数：`frequency` 更新的频率
      - 关闭更新请求  :  `clearWatch`

  - 百度地图`API`
  
```javascript
<script src="http://api.map.baidu.com/api?v=2.0&ak=qZfInp9MaT9Qa0PoNy4Rmx3Y9W9ZXMfw"></script>
```

#### 本地存储
---

- `Storage`
    - `sessionStorage`
        - `session`临时回话，从页面打开到页面关闭的时间段
        - 窗口的临时存储，页面关闭，本地存储消失
    - `localStorage`
        - 永久存储（可以手动删除数据）
        
- `Storage`的特点
    - 存储量限制 ( 5M )
    - 客户端完成，不会请求服务器处理
    - `sessionStorage`数据是不共享、 `localStorage`共享
    
- `Storage API`
    - `setItem()`:
        - 设置数据，(`key`,`value`)类型，类型都是字符串
        - 可以用获取属性的形式操作
    - `getItem():`
        - 获取数据，通过`key`来获取到相应的`value`
    - `removeItem()`:
        - 删除数据，通过key来删除相应的`value`
    - `clear()`:
        - 删除全部存储的值
        
- 存储事件:
    - 当数据有修改或删除的情况下，就会触发`storage`事件
    - 在对数据进行改变的窗口对象上是不会触发的`
    - `Key` : 修改或删除的`key`值，如果调用`clear()`,`key`为`null`
    - `newValue`  :  新设置的值，如果调用`removeStorage()`,`key`为`null`
    - `oldValue` :  调用改变前的`value`值
    - `storageArea` : 当前的`storage`对象
    - `url` :  触发该脚本变化的文档的url
    - 注：`session`同窗口才可以,例子：`iframe`操作
    
	
###  四、HTML5拖拽
---

- 图片自带拖拽功能
- 其他元素可设置`draggable`属性
- `draggable ：true`
    - 拖拽元素(被拖拽元素对象)事件 :  
        - `ondragstart` : 拖拽前触发 
        - `ondrag` :拖拽前、拖拽结束之间，连续触发
        - `ondragend` :拖拽结束触发
    - 目标元素(拖拽元素被拖到的对象)事件 :  
        - `ondragenter` :进入目标元素触发
        - `ondragover `:进入目标、离开目标之间，连续触发
        - `ondragleave` :离开目标元素触发
        - `ondrop` :在目标元素上释放鼠标触发
            - 需要在`ondragover`事件里面阻止默认事件

- 拖拽兼容问题
  - 火狐浏览器下需设置`dataTransfer`对象才可以拖拽除图片外的其他标签
    - `dataTransfer`对象
    - `setData()` : 设置数据 `key`和`value`(必须是字符串)
    - `getData()` : 获取数据，根据`key`值，获取对应的`value`
    - `effectAllowed` : 设置光标样式(`none`, `copy`, `copyLink`, `copyMove`, `link`, `linkMove`,` move`, `all` 和` uninitialized`)
	
    - `setDragImage` ：三个参数（指定的元素，坐标`X`，坐标`Y`）
    - `files`： 获取外部拖拽的文件，返回一个`filesList`列表
        - `filesList`下有个`type`属性，返回文件的类型
- 读取文件信息
    - `FileReader`(读取文件信息)
        - `readAsDataURL`
    - 参数为要读取的文件对象
        - `onload`当读取文件成功完成的时候触发此事件
        - `this. result` 获取读取的文件数据

### 五、跨文档操作
---

- 跨文档请求

- 同域跨文档
	- `iframe`内页：
		- 父页面操作子页面：`contentWindow`
		- 子页面操作父页面：`window.top`(找到最顶级的父页面)/`parent`(第一父页面)
		- 新窗口页：
			- 父页面操作子页面：`window.open`
			- 子页面操作父页面：`window.opener`
			
- 不同域跨文档
	- `postMessage（“发送的数据”,”接收的域”）`
		- `message`事件监听
		- `ev.origin `发送数据来源的域
		- `ev.data ` 发送的数据
	- 通过判断发送的数据来执行相应的需求

- ajax跨域

    - `XMLHttpRequest` 新增功能
	 	- 跨域请求：修改服务端头信息
		- I`E`兼容：`XDomaiRequest`
		
    - 进度事件：
		- `upload.onprogress(ev) ` 上传进度(实现文件上传进度条)
			- `ev.total`  发送文件的总量
			- `ev.loaded` 已发送的量
		- `FormData`  构建提交二进制数据