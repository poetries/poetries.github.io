---
title: 学会使用Sublime Text Snippets提高编码速度
date: 2016-08-13 22:10:08
tags: sublime
categories: 工欲善其事必先利其器
---


我们在编写代码的时候，总会遇到一些需要反复使用的代码片段。这时候就需要反复的复制和黏贴，大大影响效率。我们利用`Sublime Text`的`snippet`功能，就能很好的解决这一问题。通俗的讲，就是把我们常用的代码分别保存起啦，然后通过插件的形式来反复调用。
<!--more-->
- 创建方法：`Tools` > `New Snippet`


这时你会看到如下示例代码：

```html
<snippet>
     <content><![CDATA[
Hello, ${1:this} is a ${2:snippet}.
]]></content>
     <!-- Optional: Set a tabTrigger to define how to trigger the snippet -->
     <!-- <tabTrigger>hello</tabTrigger> -->
     <!-- Optional: Set a scope to limit where the snippet will trigger -->
     <!-- <scope>source.python</scope> -->
</snippet>
```

我们接着来看下完整的结构和说明

```html

<snippet>
    <content><![CDATA[ 你需要插入的代码片段${1:name} ]]></content>
    <!-- 可选：快捷键，利用Tab自动补全代码的功能 -->
    <tabTrigger>xyzzy</tabTrigger>
    <!-- 可选：使用范围，不填写代表对所有文件有效。附：source.css和test.html分别对应不同文件。 -->
    <scope>source.python</scope>
    <!-- 可选：在snippet菜单中的显示说明（支持中文）。如果不定义，菜单则显示当前文件的文件名。 -->
    <description>My Fancy Snippet</description>
</snippet>
```

`${1:name}`表示代码插入后，光标所停留的位置，可同时插入多个。其中`:name`为自定义参数（可选）。
`${2}`表示代码插入后，按Tab键，光标会根据顺序跳转到相应位置（以此类推）

开始自己动手编写一个实例：

```html
<snippet>
     <content>
     <![CDATA[
     <footer>
          <p>Copyright © 2008-2012 ${1:bluesdream}.com</p>
          <p>增值电信业务经营许可证 沪B2-${2} <a href="#">沪ICP备号${3}</a></p>
     </footer>
     ]]>
     </content>
     <tabTrigger>cft</tabTrigger>
     <description>custom-footer</description>
     <scope>text.html</scope>
</snippet>
```

创建完毕以后，保存在`\Packages\User`目录下（例 `X:\Sublime Text 2.0\Data\Packages\User`），文件命名为`cft-code`，后缀名`.sublime-snippet`。

此时我们打开一个`html`文件，输入`cft`，再按`Tab`键，刚才我们所编写的代码段，就插入了进来。并且此时的光标停留在我们所标记的`${1}`位置处，如果我们再按下`Tab`，那么光标就跳转到${2}的位置。由于我们在`scope`中定义了仅在`html`文件中使用，所以此时如果我们打开的是css或其他格式的文件，那将无法插入代码段。
 

- [常用的Sublime Text Snippets](https://github.com/poetries/Snippet/tree/master/Sublime-Super-Snippets)
