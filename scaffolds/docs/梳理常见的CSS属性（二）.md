---
title: 梳理常见的CSS属性（二）
date: 2016-06-25 23:56:31
tags: CSS
categories: Front-End
---


---
<!--more-->


|**一、CSS 文字属性**||
|:---|:---|
|语 言 | 功  能  |
|color : #999999;  | 文字颜色  |
|font-family:宋体,sans-serif;   |文字字体  |
|font-size:9pt;    | 文字大小  |
|font-style:itelic;  |文字斜体 |
|font-variant:small-caps;  |小字体 |
|letter-spacing:1pt; | 字间距离 |
|line-height : 200%;    |  设置行高 |
|font-weight:bold;   | 文字粗体 |
|vertical-align:sub;  |下标字 |
|vertical-align:super;  |上标字 |
|text-decoration:line-through;  |加删除线 |
|text-decoration:overline;   | 加顶线 |
|text-decoration:underline;  |加下画线 |
|text-decoration:none;  |删除链接下画线 |
|text-transform:capitalize;   | 首字大写 |
|text-transform:uppercase;    |英文大写 |
|text-transform:lowercase;   | 英文小写 |
|text-align:right;  |  文字右对齐 |
|text-align:left; |   文字左对齐 |
|text-align:center;   | 文字居中对齐 |
|text-align:justify; | 文字两端对齐 |
|**vertical-align属性** ||
|vertical-align:top; | 垂直向上对齐 |
|vertical-align:bottom; | 垂直向下对齐 |
|vertical-align:middle;   | 垂直居中对齐 |
|vertical-align:text-top;   | 文字垂直向上对齐 |
|vertical-align:text-bottom;   | 文字垂直向下对齐 |
|||
|**二、CSS 项目符号**||   
|||
|list-style-type:none;    |  不编号 |
|list-style-type:decimal;    |  阿拉伯数字 |
|list-style-type:lower-roman; |   小写罗马数字 |
|list-style-type:upper-roman;  |  大写罗马数字 |
|list-style-type:lower-alpha; | 小写英文字母 |
|list-style-type:upper-alpha;  |大写英文字母 |
|list-style-type:disc;   | 实心圆形符号 |
|list-style-type:circle; | 空心圆形符号 |
|list-style-type:square; | 实心方形符号 |
|list-style-image:url(/dot.gif) | 图片式符号 |
|list-style-position:outside; | 凸排 |
|list-style-position:inside; | 缩进 |
|||
|**三、CSS 背景样式** ||
|||
|background-color:#F5E2EC; | 背景颜色 |
|background:transparent;   |   透视背景 |
|background-image:url(image/bg.gif); | 背景图片 |
|background-attachment:fixed;   | 浮水印固定背景 |
|background-repeat:repeat;   | 重复排列-网页默认 |
|background-repeat:no-repeat; | 不重复排列 |
|background-repeat:repeat-x; | 在 X 轴重复排列 |
|background-repeat:repeat-y;  |  在 Y 轴重复排列 |
|background-position:90% 90%; | 背景图片 X 与 Y 轴的位置 |
|background-position:top;  |  向上对齐 |
|background-position:buttom; | 向下对齐 |
|background-position:left; | 向左对齐 |
|background-position:right;    |  向右对齐 |
 | background-position:center;  |  居中对齐 |
 |||
 |**四、CSS 链接属性** ||
 |||
  |a  所有超链接  |
 | a:link  | 超链接文字格式  |
 |a:visited   |浏览过的链接文字格式  |
 |a:active  | 按下链接的格式  |
 |a:hover  | 鼠标转到链接  |
 |cursor:crosshair   |十字体  |
 |cursor:s-resize   |箭头朝下 | 
 |cursor:help  | 加一问号  |
 |cursor:w-resize   |箭头朝左  |
 |cursor:n-resize   |箭头朝上  |
 |cursor:ne-resize  | 箭头朝右上  |
 |cursor:nw-resize   |箭头朝左上  |
 |cursor:text  | 文字 I 型  |
 |cursor:se-resize   |箭头斜右下  |
 |cursor:sw-resize  | 箭头斜左下  |
 |cursor:wait  |漏斗  |
  | | |
    |**五、CSS 边框属性**  | |
     | | |
     | border-top:1px solid #6699cc; |  上框线  |
 |border-bottom:1px solid #6699cc;  | 下框线  |
 |border-left:1px solid #6699cc;  | 左框线  |
 |border-right:1px solid #6699cc;  | 右框线  |
 |solid  | 实线框 2+6010  |
 |47dotted  | 虚线框  |
 |double  | 双线框  |
 |groove   |立体内凸框  |
 |ridge   |立体浮雕框  |
 |inset   |凹框  |
 |outset  | 凸框  |
  | | |
   |**六、CSS 表单** | |
    | | |
    |`<input type="text" name="T1" size="15">` | 文本域 |
   | `<input type="submit" value="submit" name ="B1">` | 按钮 |
|`<input type="checkbox" name="C1">` | 复选框 |
|`<input type="radio" value="V1" checked name="R1">` | 单选按钮| 
|`<select size="1" name="D1"><option>选项1</option>`|
|`<option>选项 2</option></select>` | 列表菜单 |
|`<textarea rows="1" name="1"  cols="15">` |多行文本域 |
|||
|**七、CSS 边界样式**   ||
|||
|margin-top:10px;|  上边界 |
|margin-right:10px;  |右边界值 |
|margin-bottom:10px;  |下边界值 |
|margin-left:10px;  |左边界值 |
|||
|**八、CSS 边框空白**||
|||
|padding-top:10px; | 上边框留空白 |
|padding-right:10px; | 右边框留空白 |
|padding-bottom:10px; | 下边框留空白 |
|padding-left:10px; | 左边框留空白 |



--- 


### 附录

![css常用属性思维导图总结](http://7xq6al.com1.z0.glb.clouddn.com/css%E5%B8%B8%E7%94%A8%E5%B1%9E%E6%80%A7%E6%80%BB%E7%BB%93.png)
