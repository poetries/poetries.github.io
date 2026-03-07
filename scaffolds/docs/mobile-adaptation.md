---
title:  移动端适配
date: 2017-05-23 21:35:08
tags: 
   - 移动端
   - HTML5
categories: Front-End
---

- 物理像素:移动端设备的分辨率
- 独立像素:css的像素  320  375 
- 像素比 = 物理像素/独立像素

```
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
```

- `width=device-width`  设备宽度 `640px`(低版本的安卓手机不支持数字) 这个属性在不支持`IE`

- `initial-scale=1.0`(初始缩放比),能够起到和`width=device-width`相同的效果(把理想的视窗设置为设备的宽度)     两个配合使用就能够很好的解决移动端各设备的适配问题

- `maximum-scale=1.0 `最大缩放比例
- `user-scalable=0 `禁止缩放
- `minimum-scale=1.0` 最小缩放比例


### 移动端布局方法
---


- 1、流式布局  与设备等宽 做自适应  100%或者具体的像素值

- 2、`rem`做盒子的宽度，viewport缩放

- 3、固定宽度  `viewport`缩放  `content="width=640, initial-scale=0.5, maximum-scale=0.5, user-scalable=0" `（用的比较少）

- 4、`vw/vh ` 相对于viewport理想视窗(设备)的比例(兼容性不好)
	`1vw = 10%`设备宽 ` 10vw `
	

### meta标签属性设置
---


`<meta http-equiv="X-UA-Compatible" content="IE=edge chrome=1">`

- IE8`浏览器的显示方式:`IE=edge`以`IE`最高版本显示
- chrome=1 以谷歌浏览器模式渲染(GCF(Google Chrome Frame))

```
<meta name="referrer" content="never">
```
- referrer 告诉浏览器链接来源于哪里(计算网页上链接的访问量)
	
```
<meta name="format-detection" content="telephone=no,email=no,adress=no">
```
- 格式检测:（数字、邮箱、地址） no不识别为电话号码、邮箱、地址

```
<meta name="apple-mobile-web-app-capable" content="yes">
```
- 删除默认的苹果工具栏、菜单栏(全屏显示)

```
<meta name="apple-touch-fullscreen" ="yes"> 
```
- 全屏显示


```
<meta name="apple-mobile-web-app-status-bar-style" content="black">
```

- 设置app应用下状态条的颜色
- 默认值default (白色)  black（黑色）
- `black-translucent`（灰色半透明）若果设置为这个值会占据页面的`px`位置浮在页面上方`20px`高度 ` iphone4`是`40px `

```
<meta name="renderer" content="webkit">
```
- `360`模式固定为极速模式
	

### 常见的meta属性
---


```
    <meta name="format-detection" content="telephone=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0，minimum-scale=1.0">
```


### link 扩展
---

```
<link rel="dns-prefetch" href="xxx.com">
```

>  预解析技术，当浏览网页时，浏览器会在加载页面的时对页面中的域名进行解析缓存，当我们点击这些网页的链接时就不需要再进行DNS的解析，减少用户的等待时间，提高用户的体验度


- `rem`  根目录 `html` 的`font-size`尺寸默认为`16px`  `1rem = 16px;`
- `1rem = html`的`font-size`的尺寸大小
	
	
### 参考学习资料
---

- https://h5.m.taobao.com/#index 手机淘宝 rem
- http://m.jd.com/  手机京东 100%
- http://m.lizhi.fm/ 荔枝 640视窗
- http://jx.tmall.com/ 天猫 100%
- http://3g.163.com/touch/all?nav=1&version=v_standard   网易 rem


- http://www.cnblogs.com/2050/p/3877280.html  viewport 解析
- http://ymblog.net/2015/07/01/%E7%A7%BB%E5%8A%A8%E5%89%8D%E7%AB%AFmeta%E6%A0%87%E7%AD%BE%E8%BD%AC/  meta解析
- http://ljinkai.github.io/2015/06/06/mobile-web-skill/  移动端布局注意技巧







