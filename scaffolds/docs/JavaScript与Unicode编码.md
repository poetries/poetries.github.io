---
title: JavaScript与Unicode编码
date: 2016-07-27 11:40:43
tags: JavaScript
categories: Front-End
---

- 字符集的概念：
- 字符集：就是--编码-->字符的映射
 <!--more-->
   - 例如：`65-->A`
 
-  `ASCII `字符集`:0-255` ` -128---127`
 
-  在中国：

   - `[00000000] ` 汉字 最多也不过`256`个 常用的汉字`3000`多 全部`3w+`

- **` [00000000][11111111] 0--65535之间`**
   - 用两个字节表示一个汉字：`gb2312`(只存了7000左右的汉字  少)-->GBK

- **Unicode编码集**：

  - `Unicode`规定：国 为例 在 `Unicode`有一个独特的号 假设是`2976`
  - `Unicode`编码集给世界上大部分的语言每个字符都分配了一个号码

- 国`[gbk]`-->`unicode[2976]`-->日本-->从`Unicode`得到 国 字

 - 把字符转化成对应Unicode对应的编码 以适应不同的计算机平台


- `escape`  把字符转化成各平台通用的Unicode编码

```javascript
	var str = '中国';
	var  enc = escape(str);
	alert(enc);
	alert(unescape(enc));// unescape 对escape转化的Unicode编码 解密
```
