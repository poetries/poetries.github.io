---
title: Emmet常用快捷键
date: 2016-09-09 21:00:08
tags: Emmet
categories: 工欲善其事必先利其器
---

### 基本语法
---

- `div+div>p>span+em^bq`
<!--more-->
```html
<div></div>
<div>
    <p><span></span><em></em></p>
    <blockquote></blockquote>
</div>
```

- `div+div>p>span+em^^bq`

```html
<div></div>
<div>
    <p><span></span><em></em></p>
</div>
<blockquote></blockquote>
```



- `div>(header>ul>li*2>a)+footer>p`

```html
<div>
    <header>
        <ul>
            <li><a href=""></a></li>
            <li><a href=""></a></li>
        </ul>
    </header>
    <footer>
        <p></p>
    </footer>
</div>
```
- `(div>dl>(dt+dd)*3)+footer>p`

```html
<div>
    <dl>
        <dt></dt>
        <dd></dd>
        <dt></dt>
        <dd></dd>
        <dt></dt>
        <dd></dd>
    </dl>
</div>
<footer>
    <p></p>
</footer>
```
- `ul>li.item$*5`

```html
<ul>
    <li class="item1"></li>
    <li class="item2"></li>
    <li class="item3"></li>
    <li class="item4"></li>
    <li class="item5"></li>
</ul>
```

- `h$[title=item$]{Header $}*3`

```html
<h1 title="item1">Header 1</h1>
<h2 title="item2">Header 2</h2>
<h3 title="item3">Header 3</h3>
```

- `ul>li.item$$$*5`

```html
<ul>
    <li class="item001"></li>
    <li class="item002"></li>
    <li class="item003"></li>
    <li class="item004"></li>
    <li class="item005"></li>
</ul>
```

- `ul>li.item$@-*5`

```html
<ul>
    <li class="item5"></li>
    <li class="item4"></li>
    <li class="item3"></li>
    <li class="item2"></li>
    <li class="item1"></li>
</ul>
```

- `ul>li.item$@3*5`

```html
<ul>
    <li class="item3"></li>
    <li class="item4"></li>
    <li class="item5"></li>
    <li class="item6"></li>
    <li class="item7"></li>
</ul>
```

- `form#search.wide`

```html
<form id="search" class="wide"></form>
```
- `p.class1.class2.class3`

```html
<p class="class1 class2 class3"></p>
```

- `td[rowspan=2 colspan=3 title]`

```html
<td rowspan="2" colspan="3" title=""></td>
```

---

### HTML
---

- **`!`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Document</title>
</head>
<body>
    
</body>
</html>
```

- **`a:link`**

```html
<a href="http://"></a>
```
- **`a:mail`**

```html
<a href="mailto:"></a>
```

- **` link:css`**

```html
<link rel="stylesheet" href="style.css" />
```

- **` link:favicon`**

```html
<link rel="shortcut icon" type="image/x-icon" href="favicon.ico" />
```

- **`link:rss`**

```html
<link rel="alternate" type="application/rss+xml" title="RSS" href="rss.xml" />
```

- **`meta:utf`**

```html
<meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />
```

- **`script:src`**

```html
<script src=""></script>
```
- `form:get`

```html
<form action="" method="get"></form>
```
---

- **`input:hidden`,` input:h`**

```html
<input type="hidden" name="" />
```

- `input:text`, `input:t`
- `input:password,` `input:p`
- `input:checkbox`, `input:c`
- `input:radio`,` input:r`
- `input:file`, `input:f`
- `input:submit`, `input:s`
- `input:image`,` input:i`
- `input:button`, `input:b`

---

- **`option`, `opt`**

```html
<option value=""></option>
```

- `button:disabled`,` button:d`, `btn:d`

```html
<button disabled="disabled"></button>
```

- **`ifr`**

```html
<iframe src="" frameborder="0"></iframe>
```

- `btn`

```html
<button></button>
```

- **`ul+`**

```html
<ul>
    <li></li>
</ul>
```
- **`dl+`**

```html
<dl>
    <dt></dt>
    <dd></dd>
</dl>
````

- **` table+`**

```html
<table>
    <tr>
        <td></td>
    </tr>
</table>
```
- **`tr+`**

```html
<tr>
    <td></td>
</tr>
```

- **`select+`**

```html
<select name="" id="">
    <option value=""></option>
</select>
```

- **`c`**

```html
<!-- -->
```

- **`cc:ie6`**

```html
<!--[if lte IE 6]>
    ${child}
<![endif]-->
```


###  CSS

#### visual formating
---

- `pos:s`
```css
position:static;
```
- `pos:a`
```css
position:absolute;
```
- `pos:r`
```css
position:relative;
```
- `pos:f`
```css
position:fixed;
```
- ` t`
```css
top:;
```
- `b:a`
```css
bottom:auto;
```
- `l`
```css
left:;
```
- `l:a`
```css
left:auto;
```
- `z`
```css
z-index:;
```
- `z:a`
```css
z-index:auto;
```
- `fl`
```css
float:left;
```
- `fl:n`
```css
float:none;
```
- `fl:l`
```css
float:left;
```
- `fl:r`
```css
float:right;
```
- `cl`
```css
clear:both;
```
- `cl:n`
```css
clear:none;
```
- `cl:l`
```css
clear:left;
```
- `cl:r`
```css
clear:right;
```
- `cl:b`
```css
clear:both;
```
- `d`
```css
display:block;
```
- `d:n`
```css
display:none;
```
- `d:b`
```css
display:block;
```
- `d:i`
```css
display:inline;
```
- `d:ib`
```css
display:inline-block;
```
- `d:itb`
```css
display:inline-table;
```
- `d:tbc`
```css
display:table-cell;
```
- `v`
```css
visibility:hidden;
```
- `v:v`
```css
visibility:visible;
```
- `v:h`
```css
visibility:hidden;
```
- `ov`
```css
overflow:hidden;
```
- `ov:v`
```css
overflow:visible;
```
- `ov:h`
```css
overflow:hidden;
```
- `ov:s`
```css
overflow:scroll;
```
- `zoo, zm`
```css
zoom:1;
```
- `cur:d`
```css
cursor:default;
```
- `cur:ha`
```css
cursor:hand;
```
- `cur:p`
```css
cursor:pointer;
```

---

#### Margin & Padding

---

- `m:a`
```css
margin:auto;
```
- `mt`
```css
margin-top:;
```
- `mt:a`
```css
margin-top:auto;
```
- `mr`
```css
margin-right:;
```
- `mr:a`
```css
margin-right:auto;
```
- `mb`
```css
margin-bottom:;
```
- `mb:a`
```css
margin-bottom:auto;
```
- `ml`
```css
margin-left:;
```
- `ml:a`
```css
margin-left:auto;
```
- `pt`
```css
padding-top:;
```
- `pr`
```css
padding-right:;
```
- `pb`
```css
padding-bottom:;
```
- `pl`
```css
padding-left:;
```

---

#### Font

- `fw`
```css
font-weight:;
```
- `fw:n`
```css
font-weight:normal;
```
- `fw:b`
```css
font-weight:bold;
```
- `fw:br`
```css
font-weight:bolder;
```
- `fw:lr`
```css
font-weight:lighter;
```
- `fs`
```css
font-style:${italic};
```
- `fs:n`
```css
font-style:normal;
```
- `fz`
```css
font-size:;
```
- `ff`
```css
font-family:;
```
- `ff:s`
```css
font-family:serif;
```
- `ff:ss`
```css
font-family:sans-serif;
```
- `ff:m`
```css
font-family:monospace;
```
- `ff:a`
```css
font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
```
- `ff:t`
```css
font-family: "Times New Roman", Times, Baskerville, Georgia, serif;
```
- `ff:v`
```css
font-family: Verdana, Geneva, sans-serif;
```

---

#### Background

- `bg`
```css
background:#000;
```
- `bg+`
```css
background:#fff url() 0 0 no-repeat;
```
- `bg:n`
```css
background:none;
```
- `bgc`
```css
background-color:#fff;
```
- `bgc:t`
```css
background-color:transparent;
```
- `bgi`
```css
background-image:url();
```
- `bgi:n`
```css
background-image:none;
```
- `bgr`
```css
background-repeat:;
```
- `bgr:n`
```css
background-repeat:no-repeat;
```
- `bgr:x`
```css
background-repeat:repeat-x;
```
- `bgr:y`
```css
background-repeat:repeat-y;
```
- `bgr:sp`
```css
background-repeat:space;
```
- `bgr:rd`
```css
background-repeat:round;
```
- `bga`
```css
background-attachment:;
```
- `bga:f`
```css
background-attachment:fixed;
```
- `bga:s`
```css
background-attachment:scroll;
```
- `bgp`
```css
background-position:0 0;
```
- `bgpx`
```css
background-position-x:;
```
- `bgpy`
```css
background-position-y:;
```
- `bgbk`
```css
background-break:;
```
- `bgbk:bb`
```css
background-break:bounding-box;
```
- `bgbk:eb`
```css
background-break:each-box;
```
- `bgbk:c`
```css
background-break:continuous;
```
- `bgcp`
```css
background-clip:padding-box;
```
- `bgcp:bb`
```css
background-clip:border-box;
```
- `bgcp:pb`
```css
background-clip:padding-box;
```
- `bgcp:cb`
```css
background-clip:content-box;
```
- `bgcp:nc`
```css
background-clip:no-clip;
```
- `bgo`
```css
background-origin:;
```
- `bgo:pb`
```css
background-origin:padding-box;
```
- `bgo:bb`
```css
background-origin:border-box;
```
- `bgo:cb`
```css
background-origin:content-box;
```
- `bgsz`
```css
background-size:;
```
- `bgsz:a`
```css
background-size:auto;
```
- `bgsz:ct`
```css
background-size:contain;
```

- `bgsz:cv`
```css
background-size:cover;
```


#### Color
---

- `c`
```css
color:#000;
```

- `c:r`
```css
color:rgb(0, 0, 0);
```

- `c:ra`
```css
color:rgba(0, 0, 0, .5);
```
- `op`
```css
opacity:;
```


#### 其他
---


- **`·@m·`, `@media`·**

```css
@media screen {
    
}
```

- **`@i`, `@import`**

```css
@import url();
```

- **`@kf`**

```css
@keyframes identifier {
    from {  }
    to {  }
}
```
- **`@f+`**

```css
@font-face {
    font-family: 'FontName';
    src: url('FileName.eot');
    src: url('FileName.eot?#iefix') format('embedded-opentype'),
         url('FileName.woff') format('woff'),
         url('FileName.ttf') format('truetype'),
         url('FileName.svg#FontName') format('svg');
    font-style: normal;
    font-weight: normal;
}
```

- **`@f`**

```css
font-face {
    font-family:;
    src:url(|);
}
```
- **`!`**

```css
!important
```
