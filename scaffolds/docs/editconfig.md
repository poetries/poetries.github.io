---
title: editconfig配置
date: 2018-01-27 22:48:24
tags: 
  - 规范
  - editconfig
categories: Front-End
---

简介
---

> 在团队开发中，统一的代码格式是必要的。但是不同开发人员的代码风格不同，代码编辑工具的默认格式也不相同，这样就造成代码的`differ`。而`editorConfig`可以帮助开发人员在不同的编辑器和IDE中定义和维护一致的编码风格


editorconfig
---

- 一个`editorconfig`文件例子，用于设置`Python`和`JavaScript`行尾和缩进风格的配置文件


```bash
# EditorConfig is awesome: http://EditorConfig.org

# top-most EditorConfig file
root = true

# Unix-style newlines with a newline ending every file
[*]
end_of_line = lf
insert_final_newline = true

# Matches multiple files with brace expansion notation
# Set default charset
[*.{js,py}]
charset = utf-8

# 4 space indentation
[*.py]
indent_style = space
indent_size = 4

# Tab indentation (no size specified)
[*.js]
indent_style = tab

# Indentation override for all JS under lib directory
[lib/**.js]
indent_style = space
indent_size = 2

# Matches the exact files either package.json or .travis.yml
[{package.json,.travis.yml}]
indent_style = space
indent_size = 2
```

安装editorconfig
---

> 当打开一个文件时，`EditorConfig`插件会在打开文件的目录和其每一级父目录查找`.editorconfig`文件，直到有一个配置文件`root=true`。`EditorConfig`配置文件从上往下读取，并且路径最近的文件最后被读取。匹配的配置属性按照属性应用在代码上，所以最接近代码文件的属性优先级最高。

文件格式
---

> `EditorConfig`文件使用INI格式。斜杠`(/)`作为路径分隔符，`#`或者`;`作为注释。`EditorConfig`文件使用`UTF-8`格式、`CRLF`或`LF`作为换行符

**通配符**


|||
|---|---|
|`*`|匹配除/之外的任意字符串|
|`**`|匹配任意字符串|
|`?`|	匹配任意单个字符|
|`[name`]	|匹配name字符|
|`[!name]`|	匹配非name字符|
|`{s1,s2,s3}`|	匹配任意给定的字符串(since 0.11.0)|

**属性**

|||
|---|---|
|`indent_style`| 设置缩进风格，tab或者空格。tab是hard tabs，space为soft tabs。|
|`indent_size`| 缩进的宽度，即列数，整数。如果indent_style为tab，则此属性默认为tab_width。|
|`tab_width`| 设置tab的列数。默认是indent_size。|
|`end_of_line`| 换行符，lf、cr和crlf|
|`charset`| 编码，latin1、utf-8、utf-8-bom、utf-16be和utf-16le，不建议使用utf-8-bom。|
|`trim_trailing_whitespace`| 设为true表示会除去换行行首的任意空白字符。|
|`insert_final_newline`| 设为true表明使文件以一个空白行结尾|
|`root`| 表明是最顶层的配置文件，发现设为true时，才会停止查找.editorconfig文件|

例子
---

> 下面以`sublime text`为例，测试`editorconfig`是否起作用。首先需要给`sublime`安装`EditorConfig`插件，然后在项目的根目录新建文件"`.editorconfig`"，内容如下


```bash
# EditorConfig is awesome: <a onclick="javascript:pageTracker._trackPageview('/outgoing/EditorConfig.org');" href="http://EditorConfig.org">http://EditorConfig.org</a>

# top-most EditorConfig file
root = true

# Unix-style newlines with a newline ending every file
[*]
end_of_line = lf
insert_final_newline = true

# Matches multiple files with brace expansion notation
# Set default charset
[*.{js,html,css}]
charset = utf-8

# Tab indentation (no size specified)
[*.js]
indent_style = tab
tab_width = 50
```
