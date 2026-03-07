---
title: bootstrap常用类小结
date: 2017-11-04 22:55:24
tags: bootstrap
categories: Front-End
---

网格选项
---

**`row`** :行

**`col-*-*`: 列**

- 第一个`*`可以为`xs[超小]`/`sm[小型]`/`md[中型]`/`lg[大型]`
- 第二个`*`必须为`12`以内的[列数]

**`col-*-offset-*` :列偏移**

- 第一个`*`和上面一样,第二个`*`范围是`1`到`11`,表示把该列的左外边距(`margin`)增加`*`列

**`col-*-*-*`:列排序**

- 第一个`*`和上面一样
- 第二个`*`可以为`push`[向右]/`pull`[向左]
- 第三个`*`范围是`1`到`11`[列数]

排版
---

- `small`:内联子标题
- `lead`:引导主体副本

**`text-*`:文本样式**

- `*`号可以为 
`left[左对齐]`/`center[居中对齐]`/`right[右对齐]`/`muted[减弱文本]` 
/`primary`/`success`/`info`/`warning`/`danger `
/`justify`[自动换行]/`nowrap`[不换行] 
/`lowercase`[小写]/`uppercase`[大写]/`capitalize`[首字母大写]

- `list-inline`:列表置于同一行

表格
---

- **table**:基本样式(只有横向分隔线)
- `table-*`:表格样式
  - `*`可以为`striped[添加条纹]`/`bordered[添加边框]`/`hover[启用悬停]`/`condensed[更加紧凑]`
 
- **tr/th/td 有** 
  - `active`/`success`/`info`/`warning`/`danger`来改变背景颜色
  
- **将任意的table放在table-responsive内,实现响应式表格**

> `bootstrap`里`active`/`success`/`info`/`warning`/`danger`对应的背景颜色

![](http://img.blog.csdn.net/20160530130233175)

表单
---

**创建基本表单(垂直表单)的步骤**

- 向父 `<form>` 元素添加 `role="form"`
- 把标签和控件放在一个带有` .form-group` 的 `<div>` 中。这是获取最佳间距所必需的
- 向所有的文本元素 `<input>`、`<textarea>` 和 `<select>` 添加` .form-control`

**创建水平表单的步骤**

- 向父 `<form>` 元素添加  `.form-horizontal`
- 把标签和控件放在一个带有 ` .form-group` 的 `<div>` 中
- 向标签添加 `.control-label`


**常见的表单控件主要是**

> - `input`、`textarea`、`checkbox`、`radio` 和 `select`
> - `input`: 声明`type`有`text`、`password`、`datetime`、`datetime-local`、`date`、`month`、`time`、`week`、 `number`、`email`、`url`、`search`、`tel` 和 `color`

- 对父元素添加验证状态`has-*:`验证样式(`*`可以为`warning`/`error`/`success`)

按钮
---

- **btn:基本样式**

- **`btn-*`**:其他样式
  - `*`可以为`default`/`primary`/`success`/`info`/`warning`/`danger `
/`link`[让按钮看起来像个链接]/`lg`/`sm`/`xs`/`block`[块级按钮,拉伸至父元素100%的宽度]/`active`/`disabled`

图片
---

- `img-*`:图片样式(`*`可以为`rounded[圆角6px]` 
/`circle[圆形] `
/`thumbnail`[添加内边距和一个灰色的边框]/`responsive`)


辅助类
---

> `Bootstrap`里的一些辅助类,除了上面的`active`/`success`/`info`/`warning`/`danger` 还有 

- `pull-left`/`right` 元素浮动到左边/右边 
- `center-block` 设置元素为 `display:block` 并居中显示 
- `clearfix` 清除浮动 
- `show`/`hidden` 强制显示/隐藏

- `close` 显示关闭按钮 
- `caret` 显示下拉式功能 
- `divider` 分隔线

字体图标
---

> 在 `fonts` 文件夹内可以找到字体图标，它包含了下列这些文件

```
glyphicons-halflings-regular.eot
glyphicons-halflings-regular.svg
glyphicons-halflings-regular.ttf
glyphicons-halflings-regular.woff
```

- 图标参考：http://www.runoob.com/bootstrap/bootstrap-glyphicons.html


下拉菜单
---

- `dropdown`:下拉菜单

- `dropdown-menu`: 下拉菜单

- `dropdown-header`:下拉菜单区域标题

按钮组
---

- `btn-group`:里面放置一系列`btn`

- `btn-toolbar`:里面放置几组`btn-group`

- `btn-group-*`:调整按钮组的样式(`*`可以为`xs`/`sm`/`lg`/`vertical`)

- `.btn-group` 容器添加 `.dropup`实现按钮上拉菜单

输入框组
---

**向 .form-control 添加前缀或后缀元素的步骤**

- 把前缀或后缀元素放在一个带有 ` .input-group` 的 `<div> `中
- 接着，在相同的 `<div>` 内，在 `class` 为 `.input-group-addon` 的 `<span>` 内放置额外的内容
- 把该 `<span>` 放置在 `<input>` 元素的前面或者后面

导航元素
---

- `nav nav-tabs` :标签式的导航菜单 
- `nav nav-pills`: 胶囊式的导航菜单 
