---
title: shell入门
date: 2018-12-24 10:32:41
tags: 
  - Linux
  - Shell
categories: Back-end
---

> 最近使用`shell`比较多，这里记录一下

## 一、初识shell

### 1.1 Shell 环境

> `Linux` 的 `Shell` 种类众多，常见的有

- `/usr/bin/sh`或`/bin/sh`
- `/bin/bash`
- `C Shell（/usr/bin/csh）`
- `K Shell（/usr/bin/ksh）`
- `Shell for Root（/sbin/sh）`

> `Bash` 在日常工作中被广泛使用。同时，`Bash` 也是大多数`Linux` 系统默认的 `Shell`


- 打开文本编辑器(可以使用 `vi/vim` 命令来创建文件)，新建一个文件 `test.sh`，扩展名为 `sh`（`sh`代表`shell`），扩展名并不影响脚本执行，见名知意就好

```bash
#!/bin/bash
echo "Hello World !"
```

- `#!` 是一个约定的标记，它告诉系统这个脚本需要什么解释器来执行，即使用哪一种 `Shell`
- `echo` 命令用于向窗口输出文本

### 1.2 运行 Shell 脚本有两种方法

**作为可执行程序**

```
chmod +x ./test.sh  #使脚本具有执行权限
./test.sh  #执行脚本
```

> 注意，一定要写成 `./test.sh`，而不是 `test.sh`，运行其它二进制的程序也一样，直接写 `test.sh`，`linux` 系统会去 `PATH` 里寻找有没有叫 `test.sh` 的，而只有 `/bin`, `/sbin,` `/usr/bin`，`/usr/sbin` 等在 `PATH` 里，你的当前目录通常不在 `PATH` 里，所以写成 `test.sh` 是会找不到命令的，**要用 ./test.sh 告诉系统说，就在当前目录找**

**作为解释器参数**

- 这种运行方式是，直接运行解释器，其参数就是 `shell` 脚本的文件名

```bash
/bin/sh test.sh
/bin/php test.php
```

- 这种方式运行的脚本，不需要在第一行指定解释器信息，写了也没用


## 二、shell变量

- 定义变量时，变量名不加美元符号
- 注意，变量名和等号之间不能有空格
- 命名只能使用英文字母，数字和下划线，首个字符不能以数字开头
- `中间不能有空格`，可以使用下划线（`_`）
- 不能使用标点符号
- 不能使用`bash`里的关键字（可用`help`命令查看保留关键字）

```bash
your_name="poetries" #中间不能有空格
```

- 有效的 `Shell` 变量名示例如下

```bash
RUNOOB
LD_LIBRARY_PATH
_var
var2
```

### 2.1 使用变量


- 使用一个定义过的变量，只要在变量名前面加美元符号即可

```bash
your_name="poetries"
echo $your_name
echo ${your_name}
```

- 变量名外面的花括号是可选的，加不加都行，加花括号是为了帮助解释器识别变量的边界，比如下面这种情况
- 如果不给`skill`变量加花括号，写成`echo "I am good at $skillScript"`，解释器就会把`$skillScript`当成一个变量（其值为空），代码执行结果就不是我们期望的样子了
- 推荐给所有变量加上花括号，这是个好的编程习惯

```
for skill in Ada Coffe Action Java; do
    echo "I am good at ${skill}Script"
done
```

- 已定义的变量，可以被重新定义，如：

```bash
your_name="tom"
echo $your_name
your_name="alibaba"
echo $your_name
```

### 2.2 只读变量

- 使用 `readonly` 命令可以将变量定义为只读变量，只读变量的值不能被改变
- 下面的例子尝试更改只读变量，结果报错

```bash
#!/bin/bash
myUrl="http://www.w3cschool.cc"
readonly myUrl
myUrl="http://www.runoob.com"
```

```
/bin/sh: NAME: This variable is read only.
```

### 2.3 删除变量


- 使用 `unset` 命令可以删除变量。
- 语法 `unset variable_name`
- 变量被删除后不能再次使用。`unset` 命令不能删除只读变量

```bash
#!/bin/sh
myUrl="http://www.runoob.com"
unset myUrl
echo $myUrl
```

### 2.4 变量类型

**运行shell时，会同时存在三种变量**

- **局部变**量 局部变量在脚本或命令中定义，仅在当前`shell`实例中有效，其他`shell`启动的程序不能访问局部变量
- **环境变量** 所有的程序，包括`shell`启动的程序，都能访问环境变量，有些程序需要环境变量来保证其正常运行。必要的时候`shell`脚本也可以定义环境变量
- **`shell`变量** `shell`变量是由`shell`程序设置的特殊变量。`shell`变量中有一部分是环境变量，有一部分是局部变量，这些变量保证了`shell`的正常运行

### 2.5 Shell 字符串

- 字符串是`shell`编程中最常用最有用的数据类型（除了数字和字符串，也没啥其它类型好用了），字符串可以用单引号，也可以用双引号，也可以不用引号。单双引号的区别跟`PHP`类似。

**单引号**

```
str='this is a string'
```

- 单引号里的任何字符都会原样输出，单引号字符串中的变量是无效的
- 单引号字串中不能出现单引号（对单引号使用转义符后也不行）

**双引号**

```bash
author='poetries'
echo "hello,I'm ${author}"
```

- 双引号里可以有变量
- 双引号里可以出现转义字符

### 2.6 拼接字符串

```bash
your_name="poetries"
greeting="hello, "$your_name" !"
greeting_1="hello, ${your_name} !"
echo $greeting $greeting_1
```

### 2.7 获取字符串长度


```bash
author='poetries'
echo "length:${#author}" # length:8
```

### 2.8 提取子字符串

- 以下实例从字符串第 `2` 个字符开始截取 `4` 个字符：

```bash
author='poetries'
echo "提取字符串：${author:1:4}" # oetr
```

### 2.9 Shell 数组

- `bash`支持一维数组（不支持多维数组），并且没有限定数组的大小
- 类似与`C`语言，数组元素的下标由`0`开始编号。获取数组中的元素要利用下标，下标可以是整数或算术表达式，其值应大于或等于0

### 2.10 定义数组


- 在`Shell`中，用括号来表示数组，数组元素用"空格"符号分割开。定义数组的一般形式为：

```
数组名=(值1 值2 ... 值n)
```

```
array_name=(value0 value1 value2 value3)
```

或者

```
array_name=(
value0
value1
value2
value3
)
```

还可以单独定义数组的各个分量

```
array_name[0]=value0
array_name[1]=value1
array_name[n]=valuen
```

### 2.11 读取数组

- 读取数组元素值的一般格式是

```
${数组名[下标]}
```

```
valuen=${array_name[n]}
```

- 使用`@`符号可以获取数组中的所有元素，例如

```
echo ${array_name[@]}
```

### 2.12 获取数组的长度


- 获取数组长度的方法与获取字符串长度的方法相同，例如

```
# 取得数组元素的个数
length=${#array_name[@]}
# 或者
length=${#array_name[*]}
# 取得数组单个元素的长度
lengthn=${#array_name[n]}
```

```bash
like=(
  'running'
  'reading'
  'play'
)

echo "读取数组元素：${like[@]}" # @读取数组所有长度
```

### 2.13 Shell 注释

- 以`"#"`开头的行就是注释，会被解释器忽略
- `sh`里没有多行注释，只能每一行加一个#号。只能像这样

```bash
#--------------------------------------------
# 这是一个注释
# author：poetry
# site：www.poetries.top！
#--------------------------------------------
##### 用户配置区 开始 #####
#
#
# 这里可以添加脚本描述信息
# 
#
##### 用户配置区 结束  #####
```


```bash
# 学习记录

#!/bin/sh

echo '====学习变量===='
author='poetries'
like=(
  'running'
  'reading'
  'playing'
)

echo "读取数组元素：${like[@]}" # @读取数组所有长度
echo "提取字符串：${author:1:4}"
echo "字符串length:${#author}"
echo "hello,I'm ${author}"
```

## 三、shell传递参数

- 我们可以在执行 `Shell` 脚本时，向脚本传递参数，脚本内获取参数的格式为：`$n`。`n` 代表一个数字，`1` 为执行脚本的第一个参数，`2` 为执行脚本的第二个参数，以此类推
- 以下实例我们向脚本传递三个参数，并分别输出，其中 `$0` 为执行的文件名

```bash
# sh test.sh 1 2 3 4

#!/bin/bash
# author:poetries
# url:blog.poetries.top

echo "Shell 传递参数实例！";
echo "执行的文件名：$0";
echo "第一个参数为：$1";
echo "第二个参数为：$2";
echo "第三个参数为：$3";
```

- 为脚本设置可执行权限，并执行脚本，输出结果如下所示

```bash
$ chmod +x test.sh 
$ ./test.sh 1 2 3
Shell 传递参数实例！
执行的文件名：./test.sh
第一个参数为：1
第二个参数为：2
第三个参数为：3
```

## 四、数组

- 数组中可以存放多个值。`Bash Shell` 只支持一维数组（不支持多维数组），初始化时不需要定义数组大小
- 与大部分编程语言类似，数组元素的下标由`0`开始
- `Shell` 数组用括号来表示，元素用"空格"符号分割开，语法格式如下

```bash
#!/bin/bash
# author:poetry
# url:blog.poetries.top

my_array=(A B "C" D)
```

- 我们也可以使用下标来定义数组:

```
array_name[0]=value0
array_name[1]=value1
array_name[2]=value2
```

### 4.1 读取数组

```bash
${array_name[index]}
```

```bash
#!/bin/bash
# author:poetry
# url:www.poetries.top

my_array=(A B "C" D)

echo "第一个元素为: ${my_array[0]}"
echo "第二个元素为: ${my_array[1]}"
echo "第三个元素为: ${my_array[2]}"
echo "第四个元素为: ${my_array[3]}"
```

```bash
$ chmod +x test.sh 
$ ./test.sh
第一个元素为: A
第二个元素为: B
第三个元素为: C
第四个元素为: D
```

### 4.2 获取数组中的所有元素

- 使用`@` 或 `*` 可以获取数组中的所有元素，例如：

```bash
#!/bin/bash
# author:poetries
# url:www.poetries.top

my_array[0]=A
my_array[1]=B
my_array[2]=C
my_array[3]=D

echo "数组的元素为: ${my_array[*]}"
echo "数组的元素为: ${my_array[@]}"
```

```bash
$ chmod +x test.sh 
$ ./test.sh
数组的元素为: A B C D
数组的元素为: A B C D
```

### 4.3 获取数组的长度

- 获取数组长度的方法与获取字符串长度的方法相同，例如

```bash
#!/bin/bash
# author:poetries
# url:www.poetries.top

my_array[0]=A
my_array[1]=B
my_array[2]=C
my_array[3]=D

echo "数组元素个数为: ${#my_array[*]}"
echo "数组元素个数为: ${#my_array[@]}"
```

```bash
$ chmod +x test.sh 
$ ./test.sh
数组元素个数为: 4
数组元素个数为: 4
```

## 五、基本运算符

- 原生`bash`不支持简单的数学运算，但是可以通过其他命令来实现，例如 `awk` 和 `expr`，`expr` 最常用
- `expr` 是一款表达式计算工具，使用它能完成表达式的求值操作
- 例如，两个数相加(注意使用的是反引号 ` 而不是单引号 ')：

```bash
#!/bin/bash

val=`expr 2 + 2` # 注意 表达式和运算符之间要有空格
echo "两数之和为 : $val"
```

- 表达式和运算符之间要有空格，例如 `2+2` 是不对的，必须写成 `2 + 2`，这与我们熟悉的大多数编程语言不一样。
- 完整的表达式要被 `` 包含，注意这个字符不是常用的单引号

### 5.1 算术运算符

- 下表列出了常用的算术运算符，假定变量 `a` 为 `10`，变量 `b` 为 `20`：

|运算符	|说明|	举例|
|---|---|---|
|`+`|	加法|	`expr $a + $b` 结果为 `30`。|
|`-`|	减法|	`expr $a - $b` 结果为 `-10`。|
|`*`|	乘法|	`expr $a \* $b` 结果为  `200`。|
|`/`|	除法|	`expr $b / $a` 结果为 `2`。|
|`%`|	取余|	`expr $b % $a` 结果为 `0`。|
|`=`|	赋值|	`a=$b` 将把变量 b 的值赋给 a。|
|`==`|	相等。用于比较两个数字，相同则返回 `true`。|	`[ $a == $b ]` 返回 `false`。|
|`!=`|	不相等。用于比较两个数字，不相同则返回 `true`。|	`[ $a != $b ]` 返回 `true`。|

```bash
echo 'shell运算符学习===='
value=`expr 2 + 3`
echo "两数之和:${value}"
a=10
b=20
add=`expr $a + $b`
reduce=`expr $a - $b`
cheng=`expr $a \* $b`
chu=`expr $a / $b`
quyu=`expr $a % $b`

echo "+：${add}"
echo "-：${reduce}"
echo "*：${cheng}"
echo "/：${chu}"
echo "%：${quyu}"
```

- 注意：条件表达式要放在方括号之间，并且要有空格，例如: `[$a==$b]` 是错误的，必须写成 `[ $a == $b ]`

### 5.2 关系运算符


- 关系运算符只支持数字，不支持字符串，除非字符串的值是数字
- 下表列出了常用的关系运算符，假定变量 `a` 为 `10`，变量 `b` 为 `20`：

|运算符	|说明|	举例|
|---|---|---|
|`-eq`	|检测两个数是否相等，相等返回 `true`|	`[ $a -eq $b ]` 返回 `false`|
|`-ne`	|检测两个数是否相等，不相等返回 `true`|	`[ $a -ne $b ]` 返回 `true`|。
|`-gt`|	检测左边的数是否大于右边的，如果是，则返回 `true`|	`[ $a -gt $b ]` 返回 `false`|
|`-lt`	|检测左边的数是否小于右边的，如果是，则返回 `true`|	`[ $a -lt $b ]` 返回 `true`|
|`-ge`	|检测左边的数是否大于等于右边的，如果是，则返回 `true`|	`[ $a -ge $b ] `返回 `false`|
|`-le`	|检测左边的数是否小于等于右边的，如果是，则返回 `true`|	`[ $a -le $b ] `返回 `true`|

### 5.3 布尔运算符


- 下表列出了常用的布尔运算符，假定变量 `a` 为 `10`，变量 `b` 为 `20`：

|运算符	|说明|	举例|
|---|---|---|
|`!`|	非运算，表达式为 `true` 则返回 `false`，否则返回 `true`。|	`[ ! false ]` 返回 `true`|
|`-o`|	或运算，有一个表达式为 `true `则返回 `true`。|	`[ $a -lt 20 -o $b -gt 100 ]` 返回 `true`|
|`-a`|	与运算，两个表达式都为 `true` 才返回 `true`。|	`[ $a -lt 20 -a $b -gt 100 ] `返回 `false`|

```bash
#!/bin/bash
# author:author
# url:blog.poetries.top

a=10
b=20

if [ $a != $b ]
then
   echo "$a != $b : a 不等于 b"
else
   echo "$a != $b: a 等于 b"
fi
```

```bash
if [ $a -lt 100 -a $b -gt 15 ]
then
   echo "$a 小于 100 且 $b 大于 15 : 返回 true"
else
   echo "$a 小于 100 且 $b 大于 15 : 返回 false"
fi
```

```bash
if [ $a -lt 100 -o $b -gt 100 ]
then
   echo "$a 小于 100 或 $b 大于 100 : 返回 true"
else
   echo "$a 小于 100 或 $b 大于 100 : 返回 false"
fi
```

```bash
if [ $a -lt 5 -o $b -gt 100 ]
then
   echo "$a 小于 5 或 $b 大于 100 : 返回 true"
else
   echo "$a 小于 5 或 $b 大于 100 : 返回 false"
fi
```

### 5.4 逻辑运算符

- 以下介绍 Shell 的逻辑运算符，假定变量 `a` 为 `10`，变量 `b `为 `20`

|运算符|	说明|	举例|
|---|---|---|
|`&&`	|逻辑的 `AND`|	`[[ $a -lt 100 && $b -gt 100 ]] `返回 `false`|
|`||`	|逻辑的 `OR`	|`[[ $a -lt 100 || $b -gt 100 ]]` 返回 `true`|

```bash
#!/bin/bash

a=10
b=20

if [[ $a -lt 100 && $b -gt 100 ]]
then
   echo "返回 true"
else
   echo "返回 false"
fi

if [[ $a -lt 100 || $b -gt 100 ]]
then
   echo "返回 true"
else
   echo "返回 false"
fi
```

### 5.5 字符串运算符


- 下表列出了常用的字符串运算符，假定变量 `a` 为 `"abc"`，变量 `b` 为 `"efg"`

|运算符	|说明|	举例|
|---|---|---|
|`=`|	检测两个字符串是否相等，相等返回 `true`|	`[ $a = $b ]` 返回 `false`。|
|`!=`|	检测两个字符串是否相等，不相等返回 `true`。|	`[ $a != $b ] `返回 `true`。|
|`-z`|	检测字符串长度是否为`0`，为`0`返回 `true`。|	`[ -z $a ] `返回 `false`|。
|`-n`|	检测字符串长度是否为`0`，不为`0`返回 `true`。|	`[ -n $a ]` 返回 `true`。|
|`str`|	检测字符串是否为空，不为空返回 `true`。|	`[ $a ]` 返回 `true`。|

```bash
a="abc"
b="efg"

if [ $a = $b ]
then
   echo "$a = $b : a 等于 b"
else
   echo "$a = $b: a 不等于 b"
fi
```

```bash
if [ $a != $b ]
then
   echo "$a != $b : a 不等于 b"
else
   echo "$a != $b: a 等于 b"
fi
```

```bash
if [ -z $a ]
then
   echo "-z $a : 字符串长度为 0"
else
   echo "-z $a : 字符串长度不为 0"
fi
```

```bash
if [ -n $a ]
then
   echo "-n $a : 字符串长度不为 0"
else
   echo "-n $a : 字符串长度为 0"
fi
```

```bash
if [ $a ]
then
   echo "$a : 字符串不为空"
else
   echo "$a : 字符串为空"
fi
```

### 5.6 文件测试运算符

- 文件测试运算符用于检测 `Unix` 文件的各种属性

|操作符	|说明|	举例|
|---|---|---|
|`-b file`	|检测文件是否是块设备文件，如果是，则返回 `true`。|	`[ -b $file ] `返回 `false`。|
|`-c file`	|检测文件是否是字符设备文件，如果是，则返回 `true`。|	`[ -c $file ] `返回 `false`。|
|`-d file`|	检测文件是否是目录，如果是，则返回 `true`。|	`[ -d $file ]` 返回 `false`。|
|`-f file`|	检测文件是否是普通文件（既不是目录，也不是设备文件），如果是，则返回 `true`。|	`[ -f $file ] `返回 `true`。|
|`-g file`	|检测文件是否设置了 `SGID `位，如果是，则返回 `true`。|`[ -g $file ]` 返回 `false`。|
|`-k file`|	检测文件是否设置了粘着位(`Sticky Bit`)，如果是，则返回 `true`。|	`[ -k $file ]` 返回 `false`。|
|`-p file`|	检测文件是否是有名管道，如果是，则返回 `true`。|	`[ -p $file ]` 返回 `false`。|
|`-u file`	|检测文件是否设置了 `SUID` 位，如果是，则返回 `true`。|	`[ -u $file ]` 返回 `false`。|
|`-r file`	|检测文件是否可读，如果是，则返回 `true`。|	`[ -r $file ]` 返回 `true`。|
|`-w file`	|检测文件是否可写，如果是，则返回 `true`。|	`[ -w $file ]` 返回 `true`。|
|`-x file`	|检测文件是否可执行，如果是，则返回 `true`。|	`[ -x $file ]` 返回 `true`。|
|`-s file`|	检测文件是否为空（文件大小是否大于`0`），不为空返回 `true`。|	`[ -s $file ]` 返回 `true`。|
|`-e file`	|检测文件（包括目录）是否存在，如果是，则返回 `true`。|	`[ -e $file ]` 返回 `true`。|

```bash
#!/bin/bash

file="/homee/shell/test1.sh"
if [ -r $file ]
then
   echo "文件可读"
else
   echo "文件不可读"
fi
```

```bash
if [ -w $file ]
then
   echo "文件可写"
else
   echo "文件不可写"
fi
```

```bash
if [ -x $file ]
then
   echo "文件可执行"
else
   echo "文件不可执行"
fi
```

```bash
if [ -f $file ]
then
   echo "文件为普通文件"
else
   echo "文件为特殊文件"
fi
```

```bash
if [ -d $file ]
then
   echo "文件是个目录"
else
   echo "文件不是个目录"
fi
```

```bash
if [ -s $file ]
then
   echo "文件不为空"
else
   echo "文件为空"
fi
```

```bash
if [ -e $file ]
then
   echo "文件存在"
else
   echo "文件不存在"
fi
```

## 六、echo用法

- `Shell` 的 `echo` 指令与 `PHP` 的 `echo` 指令类似，都是用于字符串的输出。命令格式

```bash
echo string
```

### 6.1 显示普通字符串:

```bash
echo "It is a test"
```

- 这里的双引号完全可以省略，以下命令与上面实例效果一致

```bash
echo It is a test
```

### 6.2 显示转义字符


```bash
echo "\"It is a test\""
```

```
"It is a test"
```

### 6.3 显示变量


- `read` 命令从标准输入中读取一行,并把输入行的每个字段的值指定给 shell 变量

```bash
#!/bin/sh

read name 
echo "$name It is a test"
```

- 以上代码保存为 `test.sh`，`name` 接收标准输入的变量，结果将是

```bash
[root@www ~]# sh test.sh
poetry                     #标准输入
poetry It is a test        #输出
```


### 6.4 显示换行

```bash
echo -e "OK! \n" # -e 开启转义
echo "It it a test"
```

### 6.5 显示不换行


```bash
#!/bin/sh

echo -e "OK! \c" # -e 开启转义 \c 不换行
echo "It is a test"
```

### 6.6 显示结果定向至文件


```bash
echo "It is a test" > myfile
```

### 6.7 显示命令执行结果

```bash
echo `date`
```

- 注意： 这里使用的是反引号 `, 而不是单引号 '
- 结果将显示当前日期

```
Thu Feb 22 14:34:57 GMT 2018
```

## 七、printf用法

- `printf` 命令模仿 `C` 程序库（`library`）里的 `printf()` 程序
- `printf` 由 `POSIX` 标准所定义，因此使用 `printf` 的脚本比使用 `echo` 移植性好
- 默认 `printf` 不会像 `echo `自动添加换行符，我们可以手动添加 `\n`

**printf 命令的语法**

```bash
printf  format-string  [arguments...]
```

- `format-string`: 为格式控制字符串
- `arguments`: 为参数列表

```bash
$ echo "Hello, Shell"
Hello, Shell

$ printf "Hello, Shell\n"
Hello, Shell
$
```

- 接下来,用一个脚本来体现`printf`的强大功能

```bash
#!/bin/bash
 
printf "%-10s %-8s %-4s\n" 姓名 性别 体重kg  
printf "%-10s %-8s %-4.2f\n" 郭靖 男 66.1234 
printf "%-10s %-8s %-4.2f\n" 杨过 男 48.6543 
printf "%-10s %-8s %-4.2f\n" 郭芙 女 47.9876 
```

- 执行脚本，输出结果如下所示

```
姓名     性别   体重kg
郭靖     男      66.12
杨过     男      48.65
郭芙     女      47.99
```

- `%s` `%c` `%d` `%f`都是格式替代符
- `%-10s` 指一个宽度为`10`个字符（`-`表示左对齐，没有则表示右对齐），任何字符都会被显示在`10`个字符宽的字符内，如果不足则自动以空格填充，超过也会将内容全部显示出来
- `%-4.2f` 指格式化为小数，其中`.2`指保留`2`位小数

```bash
#!/bin/bash
 
# format-string为双引号
printf "%d %s\n" 1 "abc"

# 单引号与双引号效果一样 
printf '%d %s\n' 1 "abc" 

# 没有引号也可以输出
printf %s abcdef

# 格式只指定了一个参数，但多出的参数仍然会按照该格式输出，format-string 被重用
printf %s abc def

printf "%s\n" abc def

printf "%s %s %s\n" a b c d e f g h i j

# 如果没有 arguments，那么 %s 用NULL代替，%d 用 0 代替
printf "%s and %d \n" 
```

**printf的转义序列**


|序列|	说明|
|---|---|
|`\a	`|警告字符，通常为`ASCII`的`BEL`字符|
|`\b`	|后退|
|`\c`|	抑制（不显示）输出结果中任何结尾的换行字符（只在`%b`格式指示符控制下的参数字符串中有效），而且，任何留在参数里的字符、任何接下来的参数以及任何留在格式字符串中的字符，都被忽略|
|`\f`|	换页（formfeed）|
|`\n`|	换行|
|`\r`|	回车（Carriage return）|
|`\t`	|水平制表符|
|`\v`	|垂直制表符|
|`\\`	|一个字面上的反斜杠字符|
|`\ddd`|	表示1到3位数八进制值的字符。仅在格式字符串中有效|
|`\0ddd`|	表示1到3位的八进制值字符|

## 八、test命令

- `Shell`中的 `test` 命令用于检查某个条件是否成立，它可以进行数值、字符和文件三个方面的测试。

### 8.1 数值测试


|参数|	说明|
|---|---|
|`-eq`	|等于则为真|
|`-ne`	|不等于则为真|
|`-gt`	|大于则为真|
|`-ge`	|大于等于则为真|
|`-lt`	|小于则为真|
|`-le`	|小于等于则为真|

```bash
num1=100
num2=100
if test $[num1] -eq $[num2]
then
    echo '两个数相等！'
else
    echo '两个数不相等！'
fi
```

```
两个数相等！
```

- 代码中的 `[]` 执行基本的算数运算

```bash
#!/bin/bash

a=5
b=6

result=$[a+b] # 注意等号两边不能有空格
echo "result 为： $result"
```

### 8.2 字符串测试


|参数|	说明|
|---|---|
|`=|`	等于则为真|
|`!=`|	不相等则为真|
|`-z` |字符串|	字符串的长度为零则为真|
|`-n` |字符串|	字符串的长度不为零则为真|

```bash
num1="poetries"
num2="poetries1"
if test $num1 = $num2
then
    echo '两个字符串相等!'
else
    echo '两个字符串不相等!'
fi
```

```
两个字符串不相等!
```

### 8.3 文件测试


|参数|	说明|
|---|---|
|`-e` 文件名|	如果文件存在则为真|
|`-r` 文件名|	如果文件存在且可读则为真|
|`-w `文件名|	如果文件存在且可写则为真|
|`-x` 文件名|	如果文件存在且可执行则为真|
|`-s` 文件名|	如果文件存在且至少有一个字符则为真|
|`-d` 文件名|	如果文件存在且为目录则为真|
|`-f` 文件名|	如果文件存在且为普通文件则为真|
|`-c` 文件名|	如果文件存在且为字符型特殊文件则为真|
|`-b` 文件名|	如果文件存在且为块特殊文件则为真|

```bash
file=/home/shell/test.sh

if test -e $file
then
 echo 'test.sh文件存在'
else
 echo 'test.sh不存在'
fi
```

```
test.sh文件存在
```

- 另外，`Shell`还提供了与( `-a` )、或( `-o` )、非( `!` )三个逻辑操作符用于将测试条件连接起来，其优先级为："`!`"最高，"`-a`"次之，"`-o`"最低。例如：

```bash
file=/home/shell/test.sh
file1=/home/poetry

if test -d $file1 -o -e $file
then
 echo '至少有一个文件存在'
else
 echo '两个文件都不存在'
fi
```

```
有一个文件存在!
```

## 九、流程控制if/while/case

### 9.1 if

- `if` 语句语法格式

```bash
if condition
then
    command1 
    command2
    ...
    commandN 
fi
```

- 写成一行（适用于终端命令提示符）

```bash
if [ $(ps -ef | grep -c "ssh") -gt 1 ]; then echo "true"; fi
```

### 9.2 if else


```bash
if condition
then
    command1 
    command2
    ...
    commandN
else
    command
fi
```

### 9.3 if else-if else


```bash
if condition1
then
    command1
elif condition2 
then 
    command2
else
    commandN
fi
```

- 以下实例判断两个变量是否相等

```bash
a=10
b=20

if [ $a == $b ]
then
   echo "a 等于 b"
elif [ $a -gt $b ]
then
   echo "a 大于 b"
elif [ $a -lt $b ]
then
   echo "a 小于 b"
else
   echo "没有符合的条件"
fi
```

```
a 小于 b
```

- `if else`语句经常与`test`命令结合使用，如下所示

```bash
num1=$[2*3]
num2=$[1+5]

if test $[num1] -eq $[num2]
then
    echo '两个数字相等!'
else
    echo '两个数字不相等!'
fi
```

### 9.4 for 循环

```bash
for var in item1 item2 ... itemN
do
    command1
    command2
    ...
    commandN
done
```

- 写成一行

```bash
for var in item1 item2 ... itemN; do command1; command2… done;
```

- 当变量值在列表里，`for`循环即执行一次所有命令，使用变量名获取列表中的当前取值。
- 命令可为任何有效的`shell`命令和语句
- `in`列表可以包含替换、字符串和文件名
- `in`列表是可选的，如果不用它，`for`循环使用命令行的位置参数

```bash
for loop in 1 2 3 4 5
do
    echo "The value is: $loop"
done
```

输出

```bash
The value is: 1
The value is: 2
The value is: 3
The value is: 4
The value is: 5
```

```bash
for str in 'This is a string'
do
  echo $str
done
```

输出

```bash
This is a string
```

### 9.5 while 语句

- `while`循环用于不断执行一系列命令，也用于从输入文件中读取数据；命令通常为测试条件。其格式为

```bash
while condition
do
    command
done
```

- 以下是一个基本的`while`循环，测试条件是：如果`int`小于等于`5`，那么条件返回真。`int`从`0`开始，每次循环处理时，`int`加`1`。运行上述脚本，返回数字`1`到`5`，然后终止
- 使用中使用了 `Bash let` 命令，它用于执行一个或多个表达式，变量计算中不需要加上 `$` 来表示变量

```bash
#!/bin/sh

int=1

while(( $int<=5 ))
do
    echo $int
    let "int++"
done
```

### 9.6 until 循环

- `until`循环执行一系列命令直至条件为真时停止
- `until`循环与`while`循环在处理方式上刚好相反
- 一般`while`循环优于`until`循环，但在某些时候—也只是极少数情况下，`until`循环更加有用

```bash
until condition
do
    command
done
```

### 9.7 case

- `Shell case`语句为多选择语句。可以用`case`语句匹配一个值与一个模式，如果匹配成功，执行相匹配的命令。`case`语句格式如下：


```bash
case 值 in
模式1)
    command1
    command2
    ...
    commandN
    ;;
模式2）
    command1
    command2
    ...
    commandN
    ;;
esac
```

- `case`工作方式如上所示。取值后面必须为单词`in`，每一模式必须以右括号结束。取值可以为变量或常数。匹配发现取值符合某一模式后，其间所有命令开始执行直至
- 取值将检测匹配的每一个模式。一旦模式匹配，则执行完匹配模式相应命令后不再继续其他模式。如果无一匹配模式，使用星号 `*` 捕获该值，再执行后面的命令
- 下面的脚本提示输入`1`到`4`，与每一种模式进行匹配

```bash
echo '输入 1 到 4 之间的数字:'
echo '你输入的数字为:'
read aNum
case $aNum in
    1)  echo '你选择了 1'
    ;;
    2)  echo '你选择了 2'
    ;;
    3)  echo '你选择了 3'
    ;;
    4)  echo '你选择了 4'
    ;;
    *)  echo '你没有输入 1 到 4 之间的数字'
    ;;
esac
```

### 9.8 跳出循环


- 在循环过程中，有时候需要在未达到循环结束条件时强制跳出循环，Shell使用两个命令来实现该功能：`break`和`continue`

**break命令**

- `break`命令允许跳出所有循环（终止执行后面的所有循环）
- 下面的例子中，脚本进入死循环直至用户输入数字大于5。要跳出这个循环，返回到`shell`提示符下，需要使用`break`命令

```bash
#!/bin/bash
while :
do
    echo -n "输入 1 到 5 之间的数字:"
    read aNum
    case $aNum in
        1|2|3|4|5) echo "你输入的数字为 $aNum!"
        ;;
        *) echo "你输入的数字不是 1 到 5 之间的! 游戏结束"
            break
        ;;
    esac
done
```

### 9.9 continue

- `continue`命令与`break`命令类似，只有一点差别，它不会跳出所有循环，仅仅跳出当前循环

```bash
#!/bin/bash

while :
do
    echo -n "输入 1 到 5 之间的数字: "
    read aNum
    case $aNum in
        1|2|3|4|5) echo "你输入的数字为 $aNum!"
        ;;
        *) echo "你输入的数字不是 1 到 5 之间的!"
            continue
            echo "游戏结束"
        ;;
    esac
done
```

## 十、函数

- linux shell 可以定义函数，然后在shell脚本中可以随便调用。
- shell中函数的定义格式如下

```bash
[ function ] funname [()]

{

    action;

    [return int;]

}
```

- 可以带`function fun()` 定义，也可以直接`fun()` 定义,不带任何参数。
- 参数返回，可以显示加：`return` 返回，如果不加，将以最后一条命令运行结果，作为返回值。 `return`后跟数值`n(0-255)`

> 下面的例子定义了一个函数并进行调用

```bash
#!/bin/bash

demoFun(){
    echo "这是我的第一个 shell 函数!"
}
echo "-----函数开始执行-----"
demoFun
echo "-----函数执行完毕-----"
```

```
-----函数开始执行-----
这是我的第一个 shell 函数!
-----函数执行完毕-----
```

- 下面定义一个带有`return`语句的函数

```bash
#!/bin/bash

fun(){
    echo "这个函数会对输入的两个数字进行相加运算..."
    echo "输入第一个数字: "
    read aNum
    echo "输入第二个数字: "
    read anotherNum
    echo "两个数字分别为 $aNum 和 $anotherNum !"
    return $(($aNum+$anotherNum))
}
sum=fun
echo "输入的两个数字之和为 ${sum}"
```

- 输出类似下面

```
这个函数会对输入的两个数字进行相加运算...
输入第一个数字: 
1
输入第二个数字: 
2
两个数字分别为 1 和 2 !
输入的两个数字之和为 3 !
```

- 注意：**所有函数在使用前必须定义**。这意味着必须将函数放在脚本开始部分，直至shell解释器首次发现它时，才可以使用。调用函数仅使用其函数名即可。

**函数参数**


- 在Shell中，调用函数时可以向其传递参数。在函数体内部，通过 `$n` 的形式来获取参数的值，例如，`$1`表示第一个参数，`$2`表示第二个参数..

```bash
#!/bin/bash

funWithParam(){
    echo "第一个参数为 $1 !"
    echo "第二个参数为 $2 !"
    echo "第十个参数为 $10 !"
    echo "第十个参数为 ${10} !"
    echo "第十一个参数为 ${11} !"
    echo "参数总数有 $# 个!"
    echo "作为一个字符串输出所有参数 $* !"
}
funWithParam 1 2 3 4 5 6 7 8 9 34 73
```

```bash
第一个参数为 1 !
第二个参数为 2 !
第十个参数为 10 !
第十个参数为 34 !
第十一个参数为 73 !
参数总数有 11 个!
作为一个字符串输出所有参数 1 2 3 4 5 6 7 8 9 34 73 !
```


