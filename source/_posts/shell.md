---
title: shell入门，从变量语法到能上生产的脚本
description: Shell 脚本编程入门笔记，讲清变量、条件、循环、函数、参数处理、重定向管道，以及 set -euo pipefail 和变量没加引号这类真正会咬人的坑。
date: 2018-12-24 10:32:41
tags: 
  - Linux
  - Shell
  - Bash
  - 脚本
categories: Back-end
---

前端写多了迟早要碰 shell。CI 里的构建步骤、服务器上的发布脚本、清理日志的定时任务，最后都会落到一个 `.sh` 文件里。语法看起来简单，`if`、`for`、函数都有，跟 JavaScript 一比好像还更少东西要记。

然后你就会遇到这样的事：脚本里某一步明明失败了，后面的步骤还是照常往下跑，最后部署了一个空目录上去；或者路径里带了个空格，`rm -rf $DIR` 直接把不该删的删了。这些不是你逻辑写错了，是 shell 的默认行为跟大多数语言不一样，它默认「出错也继续」，默认「变量展开后再做一次分词」。

这篇把 shell 编程从变量、条件、循环、函数一路理下来，每个语法点都说清楚它在什么场景用、边界在哪。最后单独用一节讲怎么把一个能跑的脚本变成一个不会坑你的脚本。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- shell 的种类，`#!` 那一行到底做了什么，两种执行方式的差别
- 变量的定义、只读、删除，以及三种变量作用域
- 字符串和数组的常用操作，单双引号的关键区别
- 位置参数 `$1`、`$#`、`$@` 和 `$*`，以及它们在函数里的复用
- 四类运算符，`expr`、`[ ]`、`[[ ]]`、`$(( ))` 该用哪个
- `echo` 和 `printf` 的取舍，为什么脚本里推荐 `printf`
- `test` 命令的数值、字符串、文件三类测试
- `if`、`for`、`while`、`until`、`case` 以及 `break`/`continue`
- 函数的定义、传参和返回值，`return` 和 `echo` 的区别
- 重定向和管道，`2>&1` 的写法顺序为什么不能反
- `set -euo pipefail` 每个字母在防什么
- 变量不加引号会出什么事，以及几个高频踩坑点

## 一、初识shell

### 1.1 Shell 环境

Shell 是包在内核外面的一层命令解释器，你敲的每一条命令都由它翻译后交给系统执行。`Linux` 的 `Shell` 种类众多，常见的有

- `/usr/bin/sh`或`/bin/sh`
- `/bin/bash`
- `C Shell（/usr/bin/csh）`
- `K Shell（/usr/bin/ksh）`
- `Shell for Root（/sbin/sh）`

`Bash` 在日常工作中被广泛使用，同时它也是大多数 `Linux` 系统默认的 `Shell`。

这里有个坑值得先说。`/bin/sh` 在很多系统上是指向别的 shell 的软链接，Debian 和 Ubuntu 上它指向的是 `dash`，一个精简的 POSIX shell。你在 bash 里跑得好好的脚本，换成 `sh script.sh` 执行可能就报语法错误，因为 `[[ ]]`、数组、`+=` 这些都是 bash 扩展，dash 不支持。这个我排查过一下午，最后发现只是因为 CI 的镜像里 `sh` 不是 bash。

用 `vi/vim` 新建一个文件 `test.sh`，扩展名为 `sh`（`sh` 代表 `shell`）。扩展名并不影响脚本执行，见名知意就好。

```bash
#!/bin/bash
echo "Hello World !"
```

`#!` 是一个约定的标记，通常叫 shebang，它告诉系统这个脚本需要什么解释器来执行。`echo` 命令用于向窗口输出文本。

要写 `#!/bin/bash` 还是 `#!/usr/bin/env bash`？后者会去 `PATH` 里找 bash，在 bash 装在非标准路径的系统（比如 macOS 上用 Homebrew 装的新版 bash）上更通用。脚本只在自家服务器上跑，写死路径没问题；要发出去给别人用，`env` 那种写法更保险。

### 1.2 运行 Shell 脚本有两种方法

**作为可执行程序**

```bash
chmod +x ./test.sh  # 使脚本具有执行权限
./test.sh  # 执行脚本
```

注意一定要写成 `./test.sh`，而不是 `test.sh`。运行其它二进制程序也一样，直接写 `test.sh` 的话，`linux` 系统会去 `PATH` 里找有没有叫 `test.sh` 的东西，而 `PATH` 里通常只有 `/bin`、`/sbin`、`/usr/bin`、`/usr/sbin` 这些目录，你的当前目录不在里面，所以会报「找不到命令」。写成 `./test.sh` 是在告诉系统，就在当前目录找。

为什么当前目录不在 `PATH` 里？这是个安全设计。要是当前目录在 `PATH` 里，别人往共享目录放一个叫 `ls` 的恶意脚本，你 `cd` 进去随手敲个 `ls` 就中招了。

**作为解释器参数**

这种方式是直接运行解释器，把脚本文件名当参数传给它。

```bash
/bin/sh test.sh
/bin/php test.php
```

这么跑的脚本不需要在第一行指定解释器信息，写了也不起作用，因为解释器已经在命令行里定死了。同理，这种方式也不需要给脚本加执行权限。

还有第三种执行方式值得提一下，`source test.sh`（或者简写 `. test.sh`）。前两种都是开一个子进程去跑脚本，脚本里定义的变量在脚本结束后就没了；`source` 是在当前 shell 里执行，变量会留下来。所以配环境变量的脚本必须用 `source`，而不是 `./`。「我脚本里明明 export 了，退出来怎么就没了」这个问题，答案就在这。

## 二、shell变量

变量的命名规则和大多数语言差不多，但有一条是 shell 独有的，赋值时等号两边不能有空格。

- 定义变量时，变量名不加美元符号
- 变量名和等号之间不能有空格，等号和值之间也不能有
- 命名只能使用英文字母、数字和下划线，首个字符不能以数字开头
- 中间不能有空格，可以使用下划线（`_`）
- 不能使用标点符号
- 不能使用 `bash` 里的关键字（可用 `help` 命令查看保留关键字）

```bash
your_name="poetries" # 等号两边都不能有空格
```

为什么这么严格？因为 shell 是按空格切分命令的。写成 `your_name = "poetries"`，shell 会理解成「执行 `your_name` 这个命令，给它两个参数 `=` 和 `poetries`」，然后报 command not found。这个规则和 `[ $a == $b ]` 里必须有空格的规则看起来矛盾，其实是同一个道理，`[` 本身就是个命令，它的参数当然要用空格分开。

有效的 `Shell` 变量名示例如下。

```bash
RUNOOB
LD_LIBRARY_PATH
_var
var2
```

### 2.1 使用变量

使用一个定义过的变量，只要在变量名前面加美元符号即可。

```bash
your_name="poetries"
echo $your_name
echo ${your_name}
```

变量名外面的花括号是可选的，加不加都行，加花括号是为了帮助解释器识别变量的边界。看下面这个例子。

```bash
for skill in Ada Coffe Action Java; do
    echo "I am good at ${skill}Script"
done
```

如果不给 `skill` 加花括号，写成 `echo "I am good at $skillScript"`，解释器会把 `$skillScript` 整个当成一个变量名（它没被定义过，值为空），输出就成了 `I am good at`，跟预期完全不一样。

推荐给所有变量都加上花括号，这是个好习惯。花括号还解锁了一批很实用的展开语法，后面几节的字符串截取、长度获取都建立在它上面。

已定义的变量可以被重新定义。

```bash
your_name="tom"
echo $your_name
your_name="alibaba"
echo $your_name
```

### 2.2 只读变量

使用 `readonly` 命令可以把变量定义为只读，之后它的值就不能再改了。下面这个例子尝试更改只读变量，结果会报错。

```bash
#!/bin/bash
myUrl="http://www.w3cschool.cc"
readonly myUrl
myUrl="http://www.runoob.com"
```

```
/bin/sh: NAME: This variable is read only.
```

这个特性在脚本里挺有用。把不该被改的配置项（部署根目录、备份保留天数）声明成 `readonly`，后面代码里手滑覆盖掉的时候会直接报错，而不是带着错误的值一路跑下去。有点像 JavaScript 里的 `const`，只不过 shell 里没人强制你用。

### 2.3 删除变量

使用 `unset` 命令可以删除变量，语法是 `unset variable_name`。变量被删除后不能再次使用，另外 `unset` 命令不能删除只读变量。

```bash
#!/bin/sh
myUrl="http://www.runoob.com"
unset myUrl
echo $myUrl
```

要说明的是，shell 里「变量不存在」和「变量为空字符串」是两种状态，但 `echo` 出来都是空的，肉眼分不出来。真要区分得用 `${var+x}` 这类展开语法，或者在开头 `set -u`（第十二节会讲），让引用未定义变量直接报错。

### 2.4 变量类型

运行 shell 时会同时存在三种变量。

**局部变量** 在脚本或命令中定义，仅在当前 `shell` 实例中有效，其他 `shell` 启动的程序不能访问它。

**环境变量** 所有程序都能访问，包括 `shell` 启动的子程序。有些程序需要环境变量才能正常运行，必要的时候脚本里也可以自己定义环境变量。

**`shell` 变量** 由 `shell` 程序自己设置的特殊变量，其中一部分是环境变量，一部分是局部变量，这些变量保证了 `shell` 的正常运行。

三者的实际区别在于「子进程能不能看到」。普通赋值 `FOO=bar` 只在当前 shell 有效，加上 `export FOO=bar` 之后它才会被子进程继承。你在脚本里设了个变量，然后调用另一个脚本却读不到，多半就是漏了 `export`。

```bash
FOO=bar           # 只有当前 shell 看得见
export FOO=bar    # 子进程也能看见
env | grep FOO    # 确认它进了环境变量表
```

### 2.5 Shell 字符串

字符串是 shell 编程中最常用的数据类型（除了数字和字符串，也没什么别的类型好用了）。字符串可以用单引号，也可以用双引号，还可以不用引号，三种写法的行为完全不同。

**单引号**

```bash
str='this is a string'
```

单引号里的任何字符都会原样输出，里面的变量不会被展开。单引号字符串中也不能出现单引号，对单引号用转义符也不行。

**双引号**

```bash
author='poetries'
echo "hello,I'm ${author}"
```

双引号里可以有变量，可以出现转义字符。

这个区别在写脚本时非常关键，一句话记：要变量展开用双引号，要一字不差的原文用单引号。传给 `awk`、`sed` 的表达式里全是 `$1`、`$2` 这种符号，必须用单引号包住，不然 shell 会先把它们当成自己的变量给替换掉，你会拿到一个空表达式。

至于不加引号，那是最危险的一种，第十二节会专门讲它会出什么事。

### 2.6 拼接字符串

shell 里没有拼接运算符，把两个东西写在一起就是拼接。

```bash
your_name="poetries"
greeting="hello, "$your_name" !"
greeting_1="hello, ${your_name} !"
echo $greeting $greeting_1
```

两种写法结果一样，但第二种可读性明显更好。第一种靠引号的开合来切分，多拼几段之后自己都数不清哪个引号配哪个。拼路径的时候尤其推荐第二种，`"${BASE_DIR}/${APP_NAME}/dist"` 一眼就看得出结构。

### 2.7 获取字符串长度

```bash
author='poetries'
echo "length:${#author}" # length:8
```

`${#变量名}` 取长度。这里的 `#` 和注释符号是同一个字符但完全无关，它只在 `${}` 内部的开头有这个含义。

### 2.8 提取子字符串

以下实例从字符串第 2 个字符开始截取 4 个字符。

```bash
author='poetries'
echo "提取字符串：${author:1:4}" # oetr
```

语法是 `${变量:起始位置:长度}`，起始位置从 0 开始算，所以 `1` 对应的是第 2 个字符。

顺着这个语法往下，还有几个截取写法在处理路径和文件名时特别顺手。

```bash
file="app-1.2.3.tar.gz"
echo "${file%.tar.gz}"   # app-1.2.3   从右边删掉最短匹配的后缀
echo "${file%%-*}"       # app         从右边删掉最长匹配
echo "${file#app-}"      # 1.2.3.tar.gz  从左边删掉前缀
echo "${file/1.2.3/2.0.0}"  # app-2.0.0.tar.gz  替换
```

记法是 `#` 从头砍、`%` 从尾砍，单个是最短匹配、双写是最长匹配。这套语法比调用 `basename`、`sed` 快，因为它是 shell 内建的，不用 fork 新进程。脚本里循环处理几千个文件名的时候，差距很明显。

### 2.9 Shell 数组

`bash` 支持一维数组（不支持多维数组），并且没有限定数组的大小。

跟 C 语言类似，数组元素的下标由 0 开始编号。获取数组中的元素要利用下标，下标可以是整数或算术表达式，其值应大于或等于 0。

### 2.10 定义数组

在 `Shell` 中用括号来表示数组，数组元素用空格分割开。定义数组的一般形式为：

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

读取数组元素值的一般格式是这样。

```
${数组名[下标]}
```

```
valuen=${array_name[n]}
```

使用 `@` 符号可以获取数组中的所有元素。

```
echo ${array_name[@]}
```

这里必须提醒一句，`"${arr[@]}"` 和 `"${arr[*]}"` 看着像，行为差很远。前者展开成多个独立的词，元素里带空格也不会被拆开；后者会把所有元素用空格连成一个字符串。遍历数组一律用 `"${arr[@]}"` 并且带上双引号，这是唯一不会出错的写法。

### 2.12 获取数组的长度

获取数组长度的方法与获取字符串长度的方法相同。

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

echo "读取数组元素：${like[@]}" # @读取数组所有元素
```

### 2.13 Shell 注释

以 `#` 开头的行就是注释，会被解释器忽略。`sh` 里没有多行注释语法，只能每一行加一个 `#`，像下面这样。

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

想临时注释掉一大段代码又不想每行都加 `#`，可以用 here document 的写法把它包起来，效果等价于多行注释。

```bash
:<<'EOF'
这中间的内容不会被执行
可以放很多行
EOF
```

`:` 是 shell 的空命令，什么都不做，后面跟一段 here document 输入，输入被读进去之后直接丢弃。`EOF` 加单引号是为了防止里面的 `$` 被展开。

把前面几节的东西串起来跑一遍，大概是这个样子。

```bash
#!/bin/sh
# 学习记录

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

脚本要能复用，参数化是第一步。执行 `Shell` 脚本时可以向脚本传递参数，脚本内用 `$n` 获取，`n` 代表一个数字，`1` 是第一个参数，`2` 是第二个，以此类推。`$0` 比较特殊，它是执行的文件名。

下面这个实例向脚本传递三个参数并分别输出。

```bash
#!/bin/bash
# author:poetries
# url:blog.poetries.top

echo "Shell 传递参数实例！";
echo "执行的文件名：$0";
echo "第一个参数为：$1";
echo "第二个参数为：$2";
echo "第三个参数为：$3";
```

为脚本设置可执行权限并执行，输出结果如下。

```bash
$ chmod +x test.sh 
$ ./test.sh 1 2 3
Shell 传递参数实例！
执行的文件名：./test.sh
第一个参数为：1
第二个参数为：2
第三个参数为：3
```

除了 `$n`，还有几个特殊变量在实际脚本里用得比 `$1` 还多。

| 变量 | 含义 |
| :--- | :--- |
| `$#` | 参数个数，用来做参数校验 |
| `$@` | 所有参数，每个参数是独立的一个词 |
| `$*` | 所有参数，合并成一个字符串 |
| `$?` | 上一条命令的退出码，0 表示成功 |
| `$$` | 当前脚本的进程 PID |

`$?` 是这里面最关键的一个，脚本的错误处理全靠它。命令成功返回 0，失败返回非 0，判断上一步做没做成就看它。

参数校验建议写在脚本最开头，缺参数直接退出，别让脚本带着空值往下跑。

```bash
if [ $# -lt 2 ]; then
    echo "用法: $0 <环境> <版本号>" >&2
    exit 1
fi

ENV="$1"
VERSION="$2"
```

这段有三个细节。`$#` 判断参数够不够；用法提示用 `>&2` 打到标准错误，这样调用方用管道接标准输出时不会被提示信息污染；`exit 1` 用非 0 退出码告诉调用方失败了，CI 才能识别出这一步挂了。

参数多的时候手工解析会很乱，可以用 `getopts` 处理短选项。

```bash
while getopts "e:v:h" opt; do
    case $opt in
        e) ENV="$OPTARG" ;;
        v) VERSION="$OPTARG" ;;
        h) echo "用法: $0 -e prod -v 1.2.3"; exit 0 ;;
        *) echo "未知选项"; exit 1 ;;
    esac
done
```

`getopts` 后面那个字符串里，冒号跟在哪个字母后面就表示那个选项需要带值，值通过 `$OPTARG` 拿。它只支持短选项（`-e`），要支持 `--env` 这种长选项得自己写循环解析 `$1` 和 `shift`。

## 四、数组

数组这块前面提过一次，这里把读写操作完整过一遍。

数组中可以存放多个值，`Bash Shell` 只支持一维数组，初始化时不需要定义大小。与大部分编程语言类似，数组元素的下标由 0 开始。

`Shell` 数组用括号来表示，元素用空格分割开，语法格式如下。

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

下标越界不会报错，只会得到一个空字符串，这点和很多语言不一样，调试时要留意。

### 4.2 获取数组中的所有元素

使用 `@` 或 `*` 可以获取数组中的所有元素。

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

这两种写法在不加引号时输出一样，加了双引号就分化了，`"${arr[@]}"` 保持元素独立，`"${arr[*]}"` 拼成一个字符串。前面提过这个区别，实际写循环的时候几乎总是要用 `@`。

### 4.3 获取数组的长度

获取数组长度的方法与获取字符串长度的方法相同。

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

shell 里所有变量本质上都是字符串，没有原生的数字类型，所以做数学运算得借助别的工具。原生 `bash` 不支持简单的数学运算，但可以通过 `awk` 和 `expr` 这类命令来实现，其中 `expr` 最常用。

`expr` 是一款表达式计算工具，用它能完成表达式的求值操作。比如两个数相加，注意用的是反引号而不是单引号。

```bash
#!/bin/bash

val=`expr 2 + 2` # 注意 表达式和运算符之间要有空格
echo "两数之和为 : $val"
```

有两个语法要求容易踩。表达式和运算符之间必须有空格，`2+2` 是不对的，必须写成 `2 + 2`，这跟大多数编程语言的习惯相反。原因还是那个，`expr` 是个独立的命令，`2`、`+`、`2` 是传给它的三个参数，参数之间当然要用空格分开。另外完整的表达式要被反引号包住，这个字符在键盘左上角，不是常用的单引号。

反引号的作用是命令替换，把命令的输出结果拿出来当值用。现在更推荐的写法是 `$( )`，功能一样但可以嵌套，而且不容易和单引号看混。

```bash
val=$(expr 2 + 2)
```

**做纯数字运算的话，其实完全不用 `expr`，bash 内建的 `$(( ))` 更好用。**

```bash
a=10
b=20
echo $(( a + b ))        # 30，变量前面连 $ 都可以省
echo $(( a * b ))        # 200，乘号不用转义
echo $(( (a + b) / 3 ))  # 10，可以带括号
```

`$(( ))` 是 shell 内建语法，不用 fork 子进程，比 `expr` 快得多，也不需要给 `*` 转义。`expr` 现在主要是为了在极简的 POSIX 环境里保持兼容才用。下面的内容还是按原文以 `expr` 展开，理解运算符的含义为主，实际写脚本时把 `expr` 换成 `$(( ))` 即可。

要注意的是，这两种方式都只支持整数运算，`$(( 5 / 2 ))` 得到的是 2 不是 2.5。要算小数得上 `bc` 或者 `awk`。

```bash
echo "scale=2; 5 / 2" | bc   # 2.50
```

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

跑一下会发现 `expr $a / $b` 的结果是 0 而不是 0.5，这就是前面说的整数除法。乘号那里写的是 `\*`，因为 `*` 在 shell 里是通配符，不转义的话会被展开成当前目录的文件列表。

条件表达式要放在方括号之间，并且两边要有空格。`[$a==$b]` 是错误的，必须写成 `[ $a == $b ]`。

### 5.2 关系运算符

关系运算符只支持数字，不支持字符串，除非字符串的值是数字。

下表列出了常用的关系运算符，假定变量 `a` 为 `10`，变量 `b` 为 `20`。

|运算符	|说明|	举例|
|---|---|---|
|`-eq`	|检测两个数是否相等，相等返回 `true`|	`[ $a -eq $b ]` 返回 `false`|
|`-ne`	|检测两个数是否相等，不相等返回 `true`|	`[ $a -ne $b ]` 返回 `true`|。
|`-gt`|	检测左边的数是否大于右边的，如果是，则返回 `true`|	`[ $a -gt $b ]` 返回 `false`|
|`-lt`	|检测左边的数是否小于右边的，如果是，则返回 `true`|	`[ $a -lt $b ]` 返回 `true`|
|`-ge`	|检测左边的数是否大于等于右边的，如果是，则返回 `true`|	`[ $a -ge $b ] `返回 `false`|
|`-le`	|检测左边的数是否小于等于右边的，如果是，则返回 `true`|	`[ $a -le $b ] `返回 `true`|

为什么数字比较用 `-gt` 这种字母形式，而不是直观的 `>`？因为 `>` 在 shell 里是重定向符号。你写 `[ $a > $b ]`，shell 会当成「执行 `[ $a` 然后把输出重定向到名叫 `$b` 的文件」，结果是当前目录莫名多出个文件，而且条件判断永远为真。这个坑很隐蔽，因为它不报错。

反过来，字符串比较用的是 `=` 和 `!=`，数字比较用 `-eq` 和 `-ne`。用错了不一定报错但结果可能不对，比如 `[ "10" = "10.0" ]` 是假，`[ 10 -eq 10 ]` 是真。

### 5.3 布尔运算符

下表列出了常用的布尔运算符，假定变量 `a` 为 `10`，变量 `b` 为 `20`。

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

以下是 Shell 的逻辑运算符，假定变量 `a` 为 `10`，变量 `b` 为 `20`。

|运算符|	说明|	举例|
|---|---|---|
|`&&`	|逻辑的 `AND`|	`[[ $a -lt 100 && $b -gt 100 ]]` 返回 `false`|
|`\|\|`	|逻辑的 `OR`	|`[[ $a -lt 100 \|\| $b -gt 100 ]]` 返回 `true`|

原文这张表里的 `||` 没有转义，管道符会被 Markdown 当成表格分列符，整行都被切乱了，这里改成 `\|\|` 修正显示。

关键区别在于外层用的是双中括号 `[[ ]]` 而不是单中括号 `[ ]`。`&&` 和 `||` 只在 `[[ ]]` 里可用，单括号里得用上一节的 `-a` 和 `-o`。

`[[ ]]` 是 bash 的扩展语法，比 `[ ]` 好用不少：变量不加引号也不会因为空格被拆开、支持 `=~` 做正则匹配、支持 `<` `>` 做字符串比较而不会被当成重定向。代价是它不是 POSIX 标准，`dash` 之类的 shell 不认。

我的选择是这样：脚本第一行写了 `#!/bin/bash` 就放心用 `[[ ]]`，需要用 `#!/bin/sh` 保证可移植性时才退回 `[ ]`。

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

下表列出了常用的字符串运算符，假定变量 `a` 为 `"abc"`，变量 `b` 为 `"efg"`。

|运算符	|说明|	举例|
|---|---|---|
|`=`|	检测两个字符串是否相等，相等返回 `true`|	`[ $a = $b ]` 返回 `false`。|
|`!=`|	检测两个字符串是否相等，不相等返回 `true`。|	`[ $a != $b ] `返回 `true`。|
|`-z`|	检测字符串长度是否为`0`，为`0`返回 `true`。|	`[ -z $a ] `返回 `false`|。
|`-n`|	检测字符串长度是否为`0`，不为`0`返回 `true`。|	`[ -n $a ]` 返回 `true`。|
|`str`|	检测字符串是否为空，不为空返回 `true`。|	`[ $a ]` 返回 `true`。|

`-z` 和 `-n` 是判断空值最常用的两个，部署脚本里判断某个环境变量有没有配就靠它。

**但这里有个必须知道的坑，`-z` 和 `-n` 的变量一定要加双引号。**

```bash
a=""
[ -n $a ] && echo "非空"   # 会输出「非空」，明明是空的
[ -n "$a" ] && echo "非空" # 正确，不输出
```

为什么？`$a` 为空且没加引号时，它在展开后直接消失了，`[ -n $a ]` 变成了 `[ -n ]`。而单参数的 `[ ]` 判断的是「这个字符串非空吗」，`-n` 这个字符串当然非空，于是返回真。加了引号之后它展开成 `[ -n "" ]`，才是我们要的语义。

这个我踩过，脚本判断「版本号参数为空就报错退出」，结果空值时判断反而通过了，带着空版本号一路部署下去。变量加引号这件事，在第十二节还会再强调一次。

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

文件测试运算符用于检测 `Unix` 文件的各种属性，写部署脚本时用得非常频繁，动文件之前先确认它存不存在、能不能读写。

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

日常真正高频的就四个：`-e` 存在、`-f` 是普通文件、`-d` 是目录、`-s` 非空。其它的（块设备、SUID、粘着位）在应用层脚本里基本用不上，知道有这么回事即可。

```bash
#!/bin/bash

file="/homee/shell/test1.sh"
if [ -r "$file" ]
then
   echo "文件可读"
else
   echo "文件不可读"
fi
```

要注意的是，`-w` 返回真只说明「按权限位你有写的资格」，不代表真的能写成功。磁盘满了、文件系统被挂成只读、目录被 SELinux 拦了，`-w` 都还是真但写入照样失败。所以这类检查是「提前拦掉明显错误」，不能替代对写入结果的判断。

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

`echo` 用于输出字符串，是脚本里出现频率最高的命令，没有之一。命令格式很简单。

```bash
echo string
```

### 6.1 显示普通字符串

```bash
echo "It is a test"
```

这里的双引号完全可以省略，下面这条命令效果一致。

```bash
echo It is a test
```

但省略引号是个坏习惯。内容里一旦出现 `*`、`>`、`;` 这些字符，shell 会拿去做通配符展开或者当成语法符号，输出就跑偏了。`echo *` 打出来的是当前目录的文件列表，不是一个星号。

### 6.2 显示转义字符

```bash
echo "\"It is a test\""
```

```
"It is a test"
```

### 6.3 显示变量

`read` 命令从标准输入中读取一行，并把输入行的每个字段的值指定给 shell 变量。

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


`read` 还有几个参数在交互脚本里很好用。`-p` 直接带提示语，`-s` 输入时不回显（读密码用），`-t` 设置超时秒数，避免脚本无人值守时卡死。

```bash
read -p "确认要部署到生产环境吗? (y/N) " -t 30 answer
```

### 6.4 显示换行

```bash
echo -e "OK! \n" # -e 开启转义
echo "It is a test"
```

原文这行把 `It is a test` 写成了 `It it a test`，是个 typo，顺手改了。

`-e` 是关键，不加的话 `\n` 会被原样打出来而不是换行。

### 6.5 显示不换行

```bash
#!/bin/sh

echo -e "OK! \c" # -e 开启转义 \c 不换行
echo "It is a test"
```

要说明的是，`echo` 的行为在不同系统上并不统一。有的 `echo` 默认就解释转义序列，有的必须加 `-e`；`\c` 在某些实现里也不生效。这是 `echo` 最让人头疼的地方，写跨平台脚本时它是个不确定因素，下一节的 `printf` 就是为了解决这个问题。

### 6.6 显示结果定向至文件

```bash
echo "It is a test" > myfile
```

### 6.7 显示命令执行结果

```bash
echo `date`
```

注意这里使用的是反引号而不是单引号，结果会显示当前日期。

```
Thu Feb 22 14:34:57 GMT 2018
```

这就是前面提过的命令替换，现在更推荐写成 `echo $(date)`。给日志加时间戳、给备份文件名加日期，用的都是这个。

```bash
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始部署"
tar -czf "backup-$(date +%Y%m%d).tar.gz" ./data
```

## 七、printf用法

`printf` 命令模仿 `C` 程序库里的 `printf()` 函数，由 `POSIX` 标准所定义，所以用 `printf` 的脚本比用 `echo` 移植性好。这就是上一节说的那个问题的解法，`printf` 的行为在各个系统上是一致的。

默认 `printf` 不会像 `echo` 那样自动添加换行符，需要手动加 `\n`。

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

用一个脚本来体现 `printf` 的强大之处，它能对齐输出。

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

拆开看这几个格式符。`%s` `%c` `%d` `%f` 都是格式替代符，分别对应字符串、字符、整数、浮点数。`%-10s` 指宽度为 10 个字符（`-` 表示左对齐，不写则右对齐），不足用空格填充，超过则全部显示出来。`%-4.2f` 是格式化小数，`.2` 表示保留 2 位小数。

脚本里输出表格状的结果（比如列出多台机器的部署状态），用 `printf` 排版比手工敲空格靠谱得多。要注意的是宽度是按字符数算的，中文在终端里占两个字符宽，混排时对齐效果会打折扣。

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

这里最反直觉的是「format-string 被重用」这条。参数比格式符多的时候，`printf` 不会丢掉多余的参数，而是把格式串再走一遍。`printf "%s %s %s\n" a b c d e f` 会打出两行，这个特性拿来批量格式化列表挺方便，但不知道的时候会觉得输出莫名其妙多了几行。

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

`Shell` 中的 `test` 命令用于检查某个条件是否成立，可以进行数值、字符和文件三个方面的测试。

看到这你可能会问，这不就是第五节讲的那些运算符吗？

是的，`test` 和 `[ ]` 其实是同一个东西。`[` 就是 `test` 的另一个名字，唯一的区别是 `[` 要求最后一个参数必须是 `]`。所以 `test $a -eq $b` 和 `[ $a -eq $b ]` 完全等价，写哪个纯看习惯。理解了这点，前面说的「方括号内侧必须有空格」就不再是需要死记的规则了，那只是命令和参数之间的正常间隔。

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

代码中的 `$[]` 执行基本的算术运算。

```bash
#!/bin/bash

a=5
b=6

result=$[a+b] # 注意等号两边不能有空格
echo "result 为： $result"
```

补一句，`$[ ]` 是 bash 早期的算术展开写法，现在已经不推荐了，标准写法是第五节提到的 `$(( ))`。两者效果一样，新写的脚本用 `$(( a + b ))`。

### 8.2 字符串测试

原文这张表的第一行写成了 `=|`，管道符没转义把表格切乱了，下面是修正后的版本。

|参数|	说明|
|---|---|
|`=`|	等于则为真|
|`!=`|	不相等则为真|
|`-z` 字符串|	字符串的长度为零则为真|
|`-n` 字符串|	字符串的长度不为零则为真|

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

`Shell` 还提供了与（`-a`）、或（`-o`）、非（`!`）三个逻辑操作符用于把测试条件连接起来，优先级是 `!` 最高、`-a` 次之、`-o` 最低。

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
至少有一个文件存在
```

原文这里贴的输出是「有一个文件存在!」，和代码里 `echo` 的内容对不上，我按代码改成一致的了。

`-a` 和 `-o` 现在用得越来越少，因为 `[ ]` 里的它们在参数为空时容易产生歧义。更稳的写法是把条件拆开，用命令级别的 `&&` 和 `||` 连接，或者直接上 `[[ ]]`。

```bash
[ -d "$dir" ] || [ -e "$file" ] && echo "至少有一个存在"
[[ -d "$dir" || -e "$file" ]] && echo "至少有一个存在"
```

## 九、流程控制if/while/case

### 9.1 if

`if` 语句的语法格式是这样。

```bash
if condition
then
    command1 
    command2
    ...
    commandN 
fi
```

这里有个很关键的点，`if` 后面跟的是**命令**，不是布尔表达式。它判断的是这条命令的退出码，0 就走 then 分支，非 0 走 else。前面说的 `[ ]` 只是恰好是一个「专门用来做判断的命令」而已。

想明白这一层之后，很多写法就顺理成章了。

```bash
if grep -q "ERROR" app.log; then
    echo "日志里有错误"
fi

if ping -c 1 -W 2 example.com > /dev/null 2>&1; then
    echo "网络通"
fi
```

`if` 后面直接跟 `grep`、`ping`、`curl`，不需要中括号。这比先把输出存进变量再比较要干净得多。

写成一行的话（适合在终端里直接敲），用分号分隔。

```bash
if [ $(ps -ef | grep -c "ssh") -gt 1 ]; then echo "true"; fi
```

顺带说一句，`grep -c "ssh"` 这个计数会把 `grep` 进程自己算进去，所以判断条件写的是 `-gt 1` 而不是 `-gt 0`。这就是上一篇 [日常频繁使用的Linux命令](https://feinterview.poetries.top/blog/linux-frequently-use-command) 里提过的那个经典现象，用 `pgrep` 可以绕开。

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

分支关键字是 `elif`，不是 `else if`，写错了会报语法错误。

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

写成一行是这样。

```bash
for var in item1 item2 ... itemN; do command1; command2; done;
```

变量值在列表里时，`for` 循环对每个取值执行一遍循环体，用变量名获取当前取值。命令可以是任何有效的 shell 命令和语句，`in` 列表里可以放命令替换、字符串和文件名。`in` 列表是可选的，不写的话 `for` 循环使用的是命令行的位置参数（也就是 `"$@"`）。

除了这种 `for in` 写法，bash 还支持 C 风格的写法，需要按次数循环时更顺手。

```bash
for (( i = 1; i <= 5; i++ )); do
    echo "第 $i 次"
done

# 或者用序列展开
for i in {1..5}; do
    echo "第 $i 次"
done
```

**遍历文件时有个高频错误，别用 `for f in $(ls)`。**

`ls` 的输出是一整个字符串，shell 会按空格把它切开，文件名里带空格的话就被拆成两个了。正确的做法是直接用通配符，它展开出来的每一项天然是独立的。

```bash
# 有坑
for f in $(ls *.log); do rm "$f"; done

# 正确
for f in *.log; do rm "$f"; done
```

再稳一点的是配合 `find` 和 `while read`，能处理文件名里带换行这种极端情况。

```bash
find . -name "*.log" -print0 | while IFS= read -r -d '' f; do
    echo "处理 $f"
done
```

`-print0` 和 `-d ''` 是用空字节做分隔符，因为空字节是唯一不可能出现在文件名里的字符。`IFS=` 防止行首尾的空格被吃掉，`-r` 防止反斜杠被当成转义符。这一串参数看着吓人，但它是遍历文件最稳的写法，抄下来当模板用就行。

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

`while` 循环用于不断执行一系列命令，也常用于从输入文件中读取数据，条件部分通常是一个测试命令。格式如下。

```bash
while condition
do
    command
done
```

下面是一个基本的 `while` 循环。测试条件是 `int` 小于等于 5 时返回真，`int` 从 1 开始，每次循环加 1，运行结果是打印 1 到 5 然后终止。这里用到了 bash 的 `let` 命令，它用于执行一个或多个表达式，表达式里引用变量不需要加 `$`。

```bash
#!/bin/sh

int=1

while(( $int<=5 ))
do
    echo $int
    let "int++"
done
```

`while` 更实用的场景是逐行读文件，这是脚本处理日志和配置的标准姿势。

```bash
while IFS= read -r line; do
    echo "读到: $line"
done < input.txt
```

注意 `done` 后面那个 `< input.txt`，是把文件重定向给整个循环的标准输入。写成 `cat input.txt | while ...` 也能跑，但管道会开一个子 shell，循环里改的变量出了循环就没了，这个坑很多人栽过。

### 9.6 until 循环

`until` 循环执行一系列命令直至条件为真时停止，处理方式和 `while` 刚好相反。一般 `while` 用得更多，只有极少数情况下 `until` 更顺手。

```bash
until condition
do
    command
done
```

它最合适的场景是「等某件事发生」。比如等服务启动完成再往下走。

```bash
until curl -sf http://localhost:3000/health > /dev/null; do
    echo "等待服务启动..."
    sleep 2
done
```

用 `while` 写的话得在条件前面加个取反的 `!`，读起来没这么直白。这种等待循环记得加最大重试次数，不然服务真起不来的话脚本会一直转下去。

### 9.7 case

`Shell` 的 `case` 语句是多选择语句，用一个值去匹配一系列模式，匹配成功就执行对应的命令。格式如下。


```bash
case 值 in
模式1)
    command1
    command2
    ...
    commandN
    ;;
模式2)
    command1
    command2
    ...
    commandN
    ;;
esac
```

原文这里第二个模式后面写的是全角括号 `）`，是输入法切换时留下的，实际必须用半角 `)`，否则语法错误。

取值后面必须是单词 `in`，每个模式必须以右括号结束，取值可以是变量或常数。一旦某个模式匹配上，执行完对应的命令就结束，不会像 C 语言那样往下贯穿。都没匹配上时用星号 `*` 兜底。

结尾的 `;;` 也不能少，它标记一个分支的结束。忘了写的话 bash 会报 `syntax error near unexpected token`，而且指向的行号常常不是出错的那一行，找起来有点费劲。

`case` 的模式支持通配符，这让它在处理参数时比一串 `elif` 清爽得多。

```bash
case "$1" in
    start)   echo "启动" ;;
    stop)    echo "停止" ;;
    restart) echo "重启" ;;
    *.log)   echo "这是个日志文件" ;;
    -h|--help) echo "帮助" ;;
    *)       echo "用法: $0 {start|stop|restart}"; exit 1 ;;
esac
```

用 `|` 可以让一个分支匹配多个模式，上面 `-h|--help` 就是这么写的。系统的服务管理脚本几乎都是这个结构。

下面的脚本提示输入 1 到 4，与每一种模式进行匹配。

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


