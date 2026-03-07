---
title: php基础之字符串常用函数
date: 2016-05-24 15:35:57
tags: PHP
categories: Back-end
---
---
<!--more-->
```php
//heredoc nowdoc 适用于定义大段文本
header("Content-type:text/html;charset=utf-8");
$str3 = <<<INFO
hello
world abc 
    ok now
INFO;
echo $str3."<br />";


echo '\'\\ \n \t \v \$'."</br>";
echo "\'\\ \n \t \v \$ '' "."</br>";
echo '单引号只能转义\或\'';
echo '双引号可以转义多字符，运行速度来说，单引号更快。另外，单引号不能输出变量值'."</br>";
$str1 = "liubei";
echo "老大是$str1"."<br />";
echo '老大是$str1'."<br />";
echo strlen('你好')."<br />";//返回6个字节。utf-8编码一个中文占3个字节。gbk编码一个中文占2个字符。
echo mb_strlen('你好','utf-8')."<br />";//指定字符集，返回字节数。
echo strpos('abcdefg', 'c')."<br />";//返回数组索引位置。否则结果返回boolean值。

//有趣的运算:strpos返回的数组索引下标为0，在布尔值运算过程中，变为0了。
if(strpos('abcdefg','a') !== false){
    echo '存在'."<br />";
}else{
    echo '不存在'."<br />";
}

//替换字符串
$str = 'fuck you';
echo str_replace('fuck', '萌萌', $str)."<br />";

//替换一批字符串
$str ='男人，女人，男孩，女孩';
echo strtr($str, array('男'=>'女','女'=>'男'))."<br />";

//截取子字符串
$str = 'tommrow is another day';
echo substr($str, 0,3)."<br />";//tom
echo substr($str, 0,-3)."<br />";//tommrow is another 

//拆分字符串变数组.
$str = 'tech,linux,mysql';
$arr = explode(',', $str);
print_r($arr);
echo "<br />";

//拆分数组被字符串.
$str = implode(',', $arr);
echo $str;
echo "<br />";

//字符串大小写转换.
echo strtolower('abcdEFG')."<br />";//abcdefg
echo strtoupper('abcdEFG')."<br />";//ABCDEFG
```
