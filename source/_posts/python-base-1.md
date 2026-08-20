---
title: Python基础小结(一) 从语法到标准库的入门笔记
description: 一个前端为了做数据分析补 Python 基础的完整笔记，覆盖注释命名、基本类型、序列、运算符、闭包装饰器、面向对象、正则、异常、JSON、爬虫与常用标准库。
date: 2019-12-10 17:40:39
tags:
  - python
  - 编程基础
categories: Back-end
---

起因很具体：手上有一堆埋点数据要做分析，Excel 已经拉不动了，同事甩过来一句「用 Python 吧，pandas 十行搞定」。我平时写前端，JavaScript 用得熟，本以为换个语言就是换套语法，结果第一天就被缩进、元组和 `is` 这几个东西绊住了好几次。

这篇是我边学边记的整理稿。它不是教程，更像是一份「JavaScript 写多了的人来学 Python 会在哪里卡住」的对照笔记，每个知识点后面尽量补一句为什么这么设计、什么时候会翻车。代码能跑的都跑过一遍，跑不通的地方我也标出来了。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Python 的定位和特点，以及它为什么慢却还是数据分析首选
- 注释、命名、保留字这些语法地基，和 `input` / `eval` / `print` 三个入门函数
- 基本类型的分类，以及类型判断为什么推荐 `isinstance` 而不是 `type`
- 序列的共性，可变类型与不可变类型的分界线在哪
- 运算符里最容易记混的 `is` 与 `==`
- 循环、条件、枚举的写法
- 闭包、`lambda`、`map` / `reduce` / `filter` 与装饰器
- 面向对象的类变量、实例变量、私有成员和继承
- 正则、内建函数、标准库全景
- 异常处理与 JSON 序列化
- 一个能跑的原生爬虫例子
- `datetime` 和 `random` 两个高频库的用法
- 列表推导式等日常提效技巧

这篇偏细节和代码，配套的[Python基础小结(二)](https://feinterview.poetries.top/blog/python-base-2)是一整套思维导图，负责把知识结构串起来，两篇搭配着看会顺一些。

## 一、导语

先说 Python 是个什么语言。它是解释型语言，源码不需要提前编译成机器码，交给解释器逐行执行。改完就能跑，跨平台成本很低，代价是执行速度比 C、Java 这类编译型语言慢。

那它能做什么：

- 大数据分析
- 自动化运维与自动化测试
- web 开发，常用框架有 `flask`、`django`
- 机器学习，比如 `TensorFlow`
- 胶水语言，比如混合 C++、Java 编程，把其他语言编写的模块连接在一起

最后那条「胶水语言」值得多说一句。Python 自己跑得不快，但它能很轻松地把 C 写的高性能库包起来调用。所以做数据分析时你写的是 Python，真正干活的是 NumPy 里的 C 代码。这就解释了那个常见的疑问，既然慢为什么大家还都用它？因为慢的那部分早就被换掉了，留给你的是开发效率。

**Python 语言的特点**

- 语法简洁
- 可跨平台
- 应用广泛
- 支持中文
- 强制可读：通过强制缩进体现语句间的逻辑关系，提高了程序的可读性
- 模式多样：语法层面同时支持面向过程和面向对象两种编程方式
- 粘性扩展：通过接口和函数集成其他语言编写的代码
- 开源理念
- 库类丰富

「强制可读」这条是从 JavaScript 转过来最不习惯的地方。别的语言用花括号划分代码块，缩进只是风格；Python 把缩进写进了语法，缩进错了直接是语法错误。适应之后其实挺好，团队里再也不会有人为大括号换不换行吵架。这里有个坑要注意，Tab 和空格混用会报 `TabError`，官方推荐统一用 4 个空格，编辑器里配好自动转换。

**Python 语言开发环境配置**

- `Python` 解释器
- `IDLE` 开发环境
- 交互式启动
- 文件式启动
- `Python` 语言集成开发环境 `PyCharm`

刚入门用自带的 IDLE 或者命令行的交互式解释器就够了，写一行看一行结果，学语法最快。项目大起来再换 PyCharm 或者 VS Code 配 Python 插件。

## 二、基本知识

这一节是语法地基，看着枯燥，但后面每一处报错基本都能追回到这里。

### 注释

注释是辅助性文字，不被执行。单行注释以 `#` 开头：

```python
# 这是注释
```

多行注释以 `'''`（3 个单引号）开头和结尾：

```python
'''
这是注释
这也是注释
这还是注释
'''
```

三引号那种严格来说不是注释语法，它是一个没有赋值给任何变量的字符串字面量，解释器算出来之后就丢掉了，效果上等同于注释。写在函数或类的第一行时它有正式身份，叫文档字符串，`help()` 和 IDE 的提示都读它。

### 命名

命名是为变量关联标识符的过程，用于确保程序元素的唯一性。规则有四条：

- 标识符由字母、数字、下划线（和汉字）等字符及其组合构成
- 标识符的首字符不能是数字，且中间不能出现空格
- 标识符对大小写敏感
- 不能和保留字重名

汉字确实能当变量名，但除了写演示代码没什么实用价值，团队协作里别这么干。命名风格上，Python 社区用下划线分隔的 `user_name` 而不是驼峰的 `userName`，这一点和 JavaScript 相反，PEP 8 里写得很明确。

### 保留字

保留字（`Keyword`）也被称为关键字，是被编程语言内部定义并保留使用的标识符，不能拿来当变量名。

`Python` 的标准库提供了一个 `keyword` 模块，可以输出当前版本的所有关键字：

```python
>>> import keyword
>>> ls = keyword.kwlist
>>> ls
>>> len(ls)
33
```

**Python 3 早期版本有 33 个保留字**

- `True`
- `False`
- `None`
- `and`
- `as`
- `assert`
- `break`
- `class`
- `continue`
- `def`
- `del`
- `elif`
- `else`
- `except`
- `finally`
- `for`
- `from`
- `global`
- `if`
- `import`
- `in`
- `is`
- `lambda`
- `nonlocal`
- `not`
- `or`
- `pass`
- `raise`
- `return`
- `try`
- `while`
- `with`
- `yield`

这个 33 是当时跑出来的数字，现在得改一下。从 Python 3.7 开始 `async` 和 `await` 正式成为关键字，`keyword.kwlist` 的长度变成了 35。3.10 之后又引入了 `match`、`case`、`_` 这三个软关键字，它们不在 `kwlist` 里，而是单独放在 `keyword.softkwlist`，仍然可以当变量名用。所以别背数字，直接在你自己的解释器里跑一次 `len(keyword.kwlist)` 最靠谱。

### input() 函数

使用 `input()` 函数从控制台获得用户输入，它以字符串类型返回结果。

这里有个新手必踩的坑：不管用户输入的是不是数字，`input()` 拿到的永远是 `str`。想做加法得先 `int()` 转一次，否则 `'1' + '2'` 会得到 `'12'` 而不是 `3`。

### eval() 函数

`eval(<字符串>)` 函数的作用是把输入的字符串当成 Python 表达式来求值并执行。

```python
x = eval(input("请输入："))
```

这样写确实省事，用户输入 `1+2` 直接得到 `3`。但生产代码里别用它接用户输入，因为 `eval` 会执行任意表达式，输入里塞一句删文件的代码它也照跑。只需要把字符串转成数字或者列表字典，用 `int()`、`float()` 或者 `ast.literal_eval()`，后者只解析字面量，不执行代码。

### print() 函数

`print()` 函数可以输出字符信息，也可以用字符的形式输出变量。输出字符信息时，直接把待输出内容传给它；输出变量值时，用槽格式配合 `format()` 方法将变量和字符串结合到一起输出。

```python
print('{}今年{}岁'.format('poetries', 22))
```

Python 3.6 之后有了更短的 f-string 写法，`print(f'{name}今年{age}岁')`，直接把变量写进大括号里，可读性好很多，现在基本是首选。原来的 `%` 格式化和 `format()` 仍然能用，读老代码时会遇到。

### 函数

函数可以理解为对一组表达特定功能的表达式的封装，把特定功能的代码写在一个函数里，程序的模块化更好，也便于阅读和复用。通过保留字 `def` 自定义函数。

### 文件操作

文件读写是最容易忘记收尾的一类操作。

![Python 文件操作的模式与常用方法](https://s.poetries.top/gitee/2019/12/107.png)

图里 `r`、`w`、`a`、`b`、`+` 这几个模式要分清。`w` 是写入并清空原有内容，`a` 是追加，用错一个字母就是把文件清空了。带 `b` 的是二进制模式，读图片、压缩包必须用它。

```py
# 使用with操作文件
with open(os.path.dirname(__file__) + '/blog.text','w') as f:
    f.write(json.dumps(data))
```

这段用的是 `with` 语句。它的价值在于不管代码块里发生什么，哪怕中间抛异常，退出时都会自动帮你关闭文件句柄。手写 `f = open(...)` 加 `f.close()` 也能跑，但只要中间抛了异常，`close` 就执行不到，句柄一直被占着。所以文件操作一律用 `with`，这条没有例外。

顺带补一个坑，`open()` 在不同系统上的默认编码不一样，读中文文本时最好显式写 `encoding='utf-8'`，不然在 Windows 上很容易撞上 `UnicodeDecodeError`。

除了纯文本，日常还会碰到路径、图片、Excel 这几类操作，标准库和常用第三方库的分工是这样的。

![Python 路径操作模块 os.path 与 pathlib](https://s.poetries.top/gitee/2019/12/131.png)
![Python 图片处理相关库](https://s.poetries.top/gitee/2019/12/132.png)
![Python 操作 Excel 的常用库](https://s.poetries.top/gitee/2019/12/133.png)
![文本与其他格式文件的处理方式](https://s.poetries.top/gitee/2019/12/134.png)

路径这块推荐直接上 `pathlib`。它把路径当对象处理，拼接用 `/` 运算符，`Path('a') / 'b' / 'c.txt'` 比 `os.path.join` 直观，而且天然跨平台，不用操心 Windows 的反斜杠。老代码里 `os.path` 更常见，新写的建议换。


## 三、基本类型

先看全景。

![Python 基本数据类型分类](https://s.poetries.top/gitee/2019/12/112.png)

**类型判断的两个方式**

- `type` 判断基本类型，如 `type(10) == int`，不推荐
- `isinstance(值, 类型)`，也可以传一个元组一次判断多种，如 `isinstance(值, (int, float, str))`
  - 例：`isinstance(1, int)`

为什么不推荐 `type`？因为它做的是精确相等比较，不认继承关系。一个继承自 `int` 的子类实例，`type(x) == int` 是 `False`，而 `isinstance(x, int)` 是 `True`。面向对象里子类应该能当父类用，`isinstance` 才符合这个预期。

下面是各个类型的细节：

- `Number`
  - `int`
  - `float`
  - `complex` 复数，如 `36j`
- `Bool`
  - `bool('')` / `bool([])` / `bool({})` / `bool(0)` / `bool(None)`
  - 都会转化为 `False`
- 字符串 `str`（序列）
  - 单引号
  - 双引号
  - 三引号（可以换行写多行字符串，和 ES6 的反引号类似）
  - 在字符串前面加一个 `r`，它就不是普通字符串而是原始字符串，会原样输出，`print(r'\n88fafa')` 里的 `\n` 不会被转义
- `list` 列表（序列）
- `tuple` 元组（序列）
- 集合 `set`（无序，没有索引，不能切片，元素唯一不能重复，只有 `value` 没有 `key`），写法如 `{1,2,3,4}`
  - `1 in {1,2,3}`
  - `1 not in {1,2,3,4}`
  - 两个集合求差集 `{1,2,3} - {4,5}`
  - 两个集合求交集 `{1,2,3,4} & {2,3}`
  - 并集 `{1,2,3,4,5,6} | {3,4,7}`
  - 定义一个空的集合用 `set()`
- 字典 `dict`（key-value 成对出现，这是它和只有 value 的集合最大的差别）
  - 由很多 `key-value` 组成，不能有相同的键
  - `key` 必须是不可变类型，可以是 `int` / `str` / `tuple`
  - `value` 可以是 `int` / `str` / `float` / `list` / `set` / `dict`
  - 定义一个空的字典用 `{}`

原文这里把字典写成了「有 key 无 value」，是笔误，字典当然是键值成对的，我按实际行为改过来了。倒是空集合那条要记牢，`{}` 得到的是空字典不是空集合，想要空集合只能写 `set()`。

那为什么字典的 key 必须用不可变类型呢？因为字典靠 key 的哈希值决定数据存在哪个槽位。如果 key 存进去之后还能被修改，哈希值就变了，之前存的那条数据再也定位不到。列表可变，所以不能当 key；元组不可变，可以。

除法这里也纠正一下原文。在 Python 3 里 `1 / 2` 得到的是 `0.5`，类型是 `float`，哪怕两边都是整数；`1 // 2` 才是整除，结果是 `0`，类型是 `int`。可以自己验证一下：

```python
type(1 / 2)     # <class 'float'>
type(1 // 2)    # <class 'int'>
```

Python 2 里 `/` 对两个整数做的是整除，很多老教程按那个行为写的，抄过来在 Python 3 上结果就不对。

进制相关的写法和转换函数是这些：

```python
# 二进制字面量，每一位只能是 0 或 1
0b1001

# 八进制字面量
0o101

# 十六进制字面量
0x10

# 十进制转二进制字符串
bin(10)        # '0b1010'

# 八进制转二进制字符串
bin(0o101)     # '0b1000001'

# 二进制、八进制转十进制
int(0b1000)    # 8

# 十进制转十六进制字符串
hex(88891)     # '0x15b7b'

# 转八进制字符串
oct(0b100)     # '0o4'
```

原文这段里 `0b10012` 和 `bin(o09012)` 都是写错的，前者二进制里出现了 `2`，后者八进制前缀少了 `0` 而且 `9` 也不合法，直接跑会抛 `SyntaxError`。我按原意改成了能跑通的写法，注释也从 `//` 换成了 Python 的 `#`。

要注意 `bin()`、`hex()`、`oct()` 返回的都是字符串，不是数字，想拿去做运算得先 `int()` 转回来。

**转义字符**

```py
\n 换行
\t 横向制表符
```

**内置的字符串处理函数**

|函数|	描述|
|---|---|
|`len('x')`|	返回字符串`x`的长度，也可返回其他组合数据类型元素个数|
|`str('x')`|	返回任意类型`x`所对应的字符串形式|
|`chr(x)`|	返回`Unicode`编码`x`对应的单字符|
|`ord('x')`|	返回单字符表示的`Unicode`编码|
|`hex(x)`|	返回整数`x`对应十六进制数的小写形式字符串|
|`oct(x)`|	返回整数`x`对应八进制数的小写形式字符串|

这几个函数属于内建函数，接收字符串或者返回字符串，和下面的字符串方法不是一回事。`chr()` 和 `ord()` 这对是互逆的，处理编码问题时用得上。

**内置的字符串处理方法（共 43 个，常用 16 个）**

在 `Python` 解释器内部，所有数据类型都采用面向对象的方式实现，封装为一个类。字符串是一个类，具有类似 `<a>.<b>()` 形式的字符串处理函数，称为方法。

|方法|	描述|
|---|---|
|`str.lower()`|	返回字符串`str`的副本，全部字符小写|
|`str.upper()	`|返回字符串`str`的副本，全部字符大写|
|`str.islower()`|	当str所有字符都是小写时，返回`True`，否则返回`False`|
|`str.isprintable()`|	当str所有字符都是可打印的，返回`True`，否则返回`False`|
|`str.isnumeric()`|	当str所有字符都是数字时，返回`True`，否则返回`False`|
|`str.isspace()`|	当str所有字符都是空格，返回`True`，否则返回`False`|
|`str.endswith(suffix[,start[,end]])`|	`str[start:end]`以`suffix`结尾返回`True`，否则返回`False`|
|`str.startswith(prefix[,start[,end]])`|	`str[start:end]`以`prefix`开始返回`True`，否则返回`False`|
|`str.split(sep=None,maxsplit=-1)`|	返回一个列表，由`str`根据`sep`被分割的部分构成|
|`str.count(sub[,start[,end]]`|	返回`str[start:end]`中`sub`子串出现的次数|
|`str.replace(old,new[,count])`|	返回字符串`str`的副本，所有`old`子串被替换为`new`，如果`count`给出，则前`count`次`old`出现被替换|
|`str.center(width[,fillchar])`|	字符串居中函数|
|`str.strip([chars])`|返回字符串`str`的副本，在其左侧和右侧去掉`chars`中列出的字符|
|`str.zfill(width)`|返回字符串`str`副本，长度为`width`。不足部分在其左侧添加`0`|
|`str.format()`|返回字符串`str`的一种排版格式|
|`str.join(iterable)`|返回一个新字符串，由组合数据类型`iterable`变量的每个元素组成，元素间用`str`分隔|

这张表里所有方法都有一个共同点：它们全部返回新字符串，一个都不会在原地修改。因为字符串是不可变类型，改不了。所以 `s.upper()` 单独占一行是没有效果的，必须写成 `s = s.upper()` 把返回值接住。这个我踩过，当时对着一行没生效的 `strip()` 排查了一下午，最后发现是自己没赋值。

`join` 这个方法值得单独提一句。循环里用 `+` 拼字符串，每次都在生成新对象，拼几万次会明显变慢；`''.join(列表)` 是一次性算好总长度再分配，处理大量片段时差距很大。

## 四、序列，元组、字符串、列表

字符串、列表、元组这三个类型有一批共同的能力，Python 把它们统称为序列。理解了这层共性，学任何一个新的序列类型都会很快。

**序列共性**

- 切片
- 序号
- `in` 判断符，`2 in [1,2,3]`、`2 not in [1,2,3]`
- `len()`
- `max(list)`
- `min(list)`

![序列类型的分类](https://s.poetries.top/gitee/2019/12/109.png)

![序列的基本操作](https://s.poetries.top/gitee/2019/12/108.png)

这两张图把序列的操作列全了。切片的语法是 `s[start:end:step]`，区间左闭右开，`s[0:3]` 拿的是下标 0、1、2 三个元素不含 3。负数下标从右往左数，`s[-1]` 是最后一个，`s[::-1]` 是反转序列的常见写法。三个参数都可以省略。

真正影响写代码的是下面这条分界线。

**可变类型**

- `list`，需要动态改变就用列表
- `dict`
- `set`

**不可变类型**

- `str`
- `tuple`，定义之后不可变，安全性较高
- `int`

可变和不可变的区别不只是「能不能改」。不可变类型可以计算哈希，所以能当字典的 key 和集合的元素；可变类型不行。函数传参时也有影响，传一个列表进函数，函数里改它，外面看到的也变了；传一个整数或字符串，函数里怎么改都不影响外面。

由此还引出一条经常被写进面试题的坑：函数的默认参数不要用可变对象。`def f(items=[])` 这种写法，那个空列表只在函数定义时创建一次，之后每次调用共享同一个，调三次会发现里面的元素在累加。正确写法是默认值给 `None`，进函数体再判断赋值。

**字符串基本操作**

```python
# + 号运算，拼接
str1 = 'hell'
str2 = 'world'
s = str1 + str2

# 乘法运算，重复 3 次
str1 * 3

# 切片
str1[1:2]
```

原文这里把拼接结果赋给了 `str`，会把内建的 `str()` 函数遮住，同一段作用域里再调 `str(123)` 就报错了。我换成了 `s`。这类无意中覆盖内建名的问题在 Python 里很隐蔽，`list`、`dict`、`type`、`id` 都是高频受害者。

序列还支持解包赋值，一行把元组拆到多个变量上：

```python
# 赋值操作
year, month, day = (2019, 10, 12)
```

如果只有一个元素，元组要写成 `(1,)`，那个逗号不能省，`(1)` 只是一个加了括号的整数。一个元素都没有的元组是 `type( () )`。

类型之间的转换关系是这样：

![Python 各类型之间的转换函数](https://s.poetries.top/gitee/2019/12/126.png)


## 五、运算符

![Python 运算符的分类与优先级](https://s.poetries.top/gitee/2019/12/113.png)

大部分运算符和别的语言没差别，挑几个不一样的说。

**列表元组都可以比较**

```python
(1, 2, 3) > (1, 1, 1)   # True，两两比较第一个、第二个……元素
```

比较规则是逐位比，第一个分出胜负的位置就决定结果，前面相等才往后看。这一点让「按多个字段排序」变得很省事，直接把排序键组成元组返回就行。

**字典的成员运算符**

```python
# 只针对 key
'a' in {'a': '1'}   # True
```

想判断某个值在不在字典里，得写 `'1' in d.values()`。

**身份运算符**

这里是原文写错的地方，得纠正一下。`is` 比较的不是「取值是否相等」，而是两个变量是不是指向同一个对象，比的是内存地址：

- `is`：两个变量指向同一个对象时返回 `True`
- `is not`：指向不同对象时返回 `True`

```python
# 关系运算符比较的是两个值是否相等
1 == 1.0    # True

# is 比较的是两个变量的内存地址是否相同，id(值) 可以获取内存地址
1 is 1.0    # False
```

原文举的 `'1' is '1'` 确实会返回 `True`，但那是 CPython 对短字符串和小整数做了缓存复用，属于实现细节，不是语言保证。换一种构造方式，比如 `a = 'hel' + 'lo'` 和 `b = 'hello'`，结果可能就不一样了。Python 3.8 之后，对字面量用 `is` 会直接给你一条 `SyntaxWarning`。

判断值相等一律用 `==`，`is` 只留给 `None`、`True`、`False` 这三个单例，写 `if x is None` 是标准做法。

**对象的三个特征**

- `id`（身份）用 `is` 判断
- `value`（值）用 `==` 判断
- `type`（类型）用 `isinstance` 判断

这三行是上面所有讨论的总纲，记住它，什么时候该用哪个运算符就不会犹豫。

**位运算符**

把数字当二进制进行运算，非二进制会先转成二进制再计算。

- `&` 按位与
- `|` 按位或
- `^` 按位异或
- `~` 按位取反
- `<<` 左移
- `>>` 右移

日常业务代码用得不多，做权限标志位、图像处理、和硬件打交道时会遇到。

## 六、循环、条件、枚举

流程控制就三样：

- `if else`
- `while`
- `for in`

多分支用 `elif` 而不是 `else if`。Python 长期没有 `switch` 语句，传统做法是用字典做分发或者写一串 `elif`（3.10 之后有了 `match` 语句，但它是结构化模式匹配，能力比 C 系的 `switch` 大得多，也不是简单替代关系）。

**range**

Python 的 `for` 是「遍历可迭代对象」，不是 C 那种计数循环。要按下标走就得配 `range()`：

```python
# JavaScript 里的写法大概是这样
# for (var i = 0; i < len; i++) {}

# Python 用 range
for i in range(0, 10):
    pass

# 第三个参数 2 是步长
for i in range(0, 10, 2):
    pass

# 按下标取出 1、3、5、7
a = [1, 2, 3, 4, 5, 6, 7, 8]
for i in range(0, len(a), 2):
    print(a[i])

# 同样的效果用切片写更短
a[0:len(a):2]
```

原文这段用了 `//` 注释和 JavaScript 的循环写法混排，我改成了能直接跑的 Python。

实际写代码时，如果只是想遍历元素就直接 `for item in a`，需要下标就用 `for i, item in enumerate(a)`，用 `range(len(a))` 再去索引是从别的语言带过来的习惯，Python 里不太地道。

还有一个别的语言基本没有的语法：`for` 和 `while` 都可以带 `else` 分支，循环正常结束才执行，被 `break` 中断就跳过。写「遍历完都没找到就报错」这种逻辑挺顺手，但团队里不熟的人多就别用，可读性一般。

## 七、枚举

代码里散落着 `status == 1`、`status == 2` 这种魔法数字，过两个月自己都不记得 2 是什么意思。枚举解决的就是这个问题，给每个取值一个有名字的身份，而且定义之后不能被改。

Python 的枚举在标准库 `enum` 模块里，用法是继承 `Enum`：

```py
''' 
枚举
''' 

from enum import Enum

class VIP(Enum):
  # 值可以相同 但是py会把第二个设置别名
  yellow = 1
  green = 2
  red = 3
  black = 4

# 枚举不能被修改
# VIP.red = 10
print(VIP.yellow)

# 获取枚举值
print(VIP.yellow.value)

# 获取枚举标签
print(VIP.yellow.name)

# 根据名称获取枚举类
print(VIP['red']) # VIP.red

# 枚举遍历 获取每个成员
for i in VIP:
  print(i)


for v in VIP.__members__.items():
  print(v)

''' 
('yellow', <VIP.yellow: 1>)
('green', <VIP.green: 2>)
('red', <VIP.red: 3>)
('black', <VIP.black: 4>)
'''

# 成员之间进行比较 不持续大小比较
res = VIP.red == VIP.black
print(res) # False

# 身份比较
print(VIP.red is VIP.red)

# 枚举类型转换
print(VIP(1)) # VIP.yellow
```

这段代码里有几处值得留意。成员名唯一但值可以重复，重复的那个会被当成别名，遍历时不会重复出现。取值用 `.value`，取名字用 `.name`，按名字反查用 `VIP['red']`，按值反查用 `VIP(1)`，四种访问方式各有各的场景。

比较的时候只能用 `==` 或者 `is` 判断是不是同一个成员，不能比大小，因为普通 `Enum` 没定义顺序关系。真要比大小得改用 `IntEnum`。

## 八、闭包、模块、函数、变量作用域

这一节是 Python 里最容易「看懂但写不对」的部分，尤其是作用域和闭包。

### 模块

![Python 模块与包的组织方式](https://s.poetries.top/gitee/2019/12/110.png)

模块就是一个 `.py` 文件，包是一个装着模块的目录。

```python
# 在目录中放一个 __init__.py 只是标注这是一个包，文件里可以什么都不写
```

补一句，从 Python 3.3 开始有了命名空间包，不放 `__init__.py` 目录也能被当成包导入。但显式放一个空文件仍然是更稳妥的做法，它能明确表达「这是一个包」的意图，也避免同名目录被误当成包。

**导入模块重新命名**

```python
import test as t
```

`as` 起别名在数据分析里几乎是肌肉记忆，`import numpy as np`、`import pandas as pd` 是社区约定，别自己另起一个。

**函数**

函数内部没有 `return`，返回的结果就是 `None`。

```python
# 函数可以返回多个值
def test():
    return x, y, z

# 接收返回的值
x, y, z = test()   # 其实就是返回了一个元组，再解包
```

「返回多个值」这个说法不严谨，实际是打包成一个元组返回，接收时再解包。知道这一层，你就明白为什么可以写 `result = test()` 拿到整个元组，也可以只取一部分 `x, *rest = test()`。

### 闭包

```py
''' 
闭包 = 函数+环境变量（在函数外部）
'''

def test():
  num = 10
  def fun(x):
    return num * x
  return fun

f = test()
print(f(10))

origin = 0
def go(step):
  global origin 
  new_pos = step + origin 
  origin = new_pos
  return new_pos

print(go(1))
print(go(2))
print(go(3))
```

上半段的 `test` 是标准闭包。`fun` 引用了外层的 `num`，`test` 执行完返回之后 `num` 并没有被销毁，它跟着 `fun` 一起活了下来，所以 `f(10)` 能算出 100。

下半段的 `go` 演示的是 `global`。为什么非要写这一行？因为 Python 有个规则：函数里只要对某个名字有赋值动作，这个名字就默认被当成局部变量，哪怕外面有同名的全局变量。`origin = new_pos` 就是赋值，不加 `global` 的话解释器会认为 `origin` 是局部的，而上一行又读了它，于是抛 `UnboundLocalError`。

要修改的是外层函数的变量而不是模块级变量，用的是 `nonlocal` 而不是 `global`。这两个关键字我一开始老搞混，记住「global 找模块顶层，nonlocal 找外层函数」就分得清了。

只读不写的话两个都不用加，直接读就行。

### 匿名函数 lambda

```py
''' 
函数式编程：匿名函数 lambda
'''

def add(x,y):
  return x + y 

add(1,2)

# 匿名函数定义
f = lambda x,y: x+y

print(f(1,2))

arr = [{'key': 'poetries','value': 100},{'key': 'jing','value': 10}]

# 处理键值对
res = map(lambda item: {'name': item['key'],'score': item['value']}, arr)

print(list(res))
```

`lambda` 写的是匿名函数，只能放一个表达式，表达式的值就是返回值。它适合当作参数临时传给 `map`、`filter`、`sorted` 这些高阶函数，逻辑一复杂就该老老实实 `def` 一个具名函数，PEP 8 也不建议把 `lambda` 赋值给变量。

### map函数

```py
''' 
map函数
'''


arr = [1,2,3,4,5,6]
arr2 = [10,12,14,16,12,14]

# 列表推导式
a = [i*i for i in arr ]

# print(a)

# map函数
b = map(lambda x: x*x,arr)
print(list(b))

c = map(lambda x,y: x*x + y,arr,arr2) # 可以传多个list，个数要相同
print(list(c))
```

这里有个必须记住的点：在 Python 3 里 `map` 返回的是迭代器不是列表，直接 `print(b)` 只会看到一个 `<map object>`，得套一层 `list()` 才看得见内容。而且迭代器只能消费一次，第二次 `list(b)` 会拿到空列表。Python 2 返回的是列表，老代码迁过来经常栽在这。

传多个列表时，`map` 会并行地取每个列表的同位置元素，长度不一致就按最短的那个截断，不报错。

代码里那行 `a = [i*i for i in arr]` 是列表推导式，和 `map` 做的是同一件事。日常我更偏向推导式，因为它读起来是顺着的，而且直接得到列表。`map` 的优势在于配合已有的具名函数时更简洁，比如 `map(int, ['1', '2'])`。

### reduce函数

```py
''' 
reduce函数
'''

from functools import reduce

arr = [1,2,3,4,5,6]

# 连续调用lambda
r = reduce(lambda x,y:x+y,arr)

print(r)
```

`reduce` 在 Python 3 里被从内建函数挪进了 `functools`，所以那行 `from functools import reduce` 不能省。它的执行方式是把前两个元素喂给函数，拿结果再和第三个元素算，一路滚下去，最终收敛成一个值。

Guido 当年把它移出内建，理由就是可读性。求和用 `sum()`、找最值用 `max()` / `min()`、拼接用 `join`，绝大多数场景都有更直白的写法，`reduce` 留给那些确实需要自定义累积逻辑的情况。

### filter函数

```py
''' 
filter函数
'''

arr = [1,2,3,4,5,6,7,0,0,False,'']

# 过滤空字符串
res = filter(lambda x: not not x,arr)

print(list(res)) # [1,2,3,4,5,6,7]
```

这个例子里 `not not x` 的作用是把任意值转成布尔，写 `bool(x)` 更直白。原数组里的 `0`、`False`、`''` 都是假值，会被过滤掉，所以结果只剩 `1` 到 `7`。要注意 `0` 和 `False` 在 Python 里是相等的，如果业务上 `0` 是有意义的数据，这种「过滤假值」的写法会把它一起吃掉。

`filter` 和 `map` 一样返回迭代器，要看内容得 `list()` 一下。

## 九、装饰器

装饰器是这门语言里我觉得最值得学的语法之一。它解决的是「一堆函数都需要同一段前置或后置逻辑」这类问题，比如打日志、算耗时、校验权限、加缓存。这些逻辑和业务无关，塞进每个函数里既重复又难维护。

```py
''' 
装饰器:特性、注解
'''

import time 

def decorator1(func):
  def wrapper(name):
    print(time.time())
    func(name)
  return wrapper

@decorator1 
def f1(name):
  print('this is a func',name)

# f1('poetries')

def decorator2(func):
  def wrapper(*args,**kw):
    print(time.time())
    print(args,'args')
    print(kw,'kw')
    func(*args,**kw)
  return wrapper

@decorator2
def f2(p1,p2):
  print('this is a func',p1,p2)

f2('静观流叶','1')
```

两个例子的差别在参数上。`decorator1` 的 `wrapper` 写死了只接一个 `name`，所以它只能装饰单参数函数，换个函数就报参数不匹配。`decorator2` 用 `*args` 和 `**kw` 把所有位置参数和关键字参数原样收下再原样转发，这才是通用写法，实际项目里一律照这个来。

`@decorator1` 这个语法只是糖，展开就是 `f1 = decorator1(f1)`。想明白这一句，装饰器就没什么神秘的了，它就是「接收一个函数、返回一个新函数」的普通函数，前面讲的闭包是它的地基。

这里有个坑要注意：被装饰之后，`f1.__name__` 会变成 `'wrapper'`，文档字符串也丢了。调试时看到一堆函数都叫 wrapper 会很难受，某些依赖函数名注册的框架（比如 Flask 的路由）还会直接报重名错误。解决办法是给内层加一个 `@functools.wraps(func)`，它会把原函数的元信息复制过来。这个我一开始没在意，直到用 Flask 撞上重名报错才明白它的必要性。

例子里还漏了一件事：`wrapper` 调用了 `func` 却没有 `return` 它的结果，所以被装饰的函数如果有返回值，装饰之后就全变成 `None` 了。自己写的时候记得把 `return func(*args, **kw)` 补上。

## 十、面向对象

![Python 类的定义与组成](https://s.poetries.top/gitee/2019/12/115.png)

```py
'''
面向对象
类=面向对象

行为、特征

类最基本的作用封装代码
'''

__author__ = 'poetries'

class Student(Human):
  # 类变量 静态属性
  author = 'poetry' 
  SUM = 10
  num = 999
  score = 98
  text = '小明今年'


  def __init__(self,name,age):
    # 构造函数 初始化对象属性
    # 成员可见性 __外部不能访问
    self.__name = name 
    self.__age = age 

  # 实例方法 第一个参数默认是self
  def getAge(self):
    # 实例中可调用类变量
    # print(self.author)
    return self.__getText() + str(self.__age)
  def getName(self):
    return self.__name
  def setName(self,name):
    self.__name = name
  
  # 私有方法，外部不可以访问
  def __getText(self):
    return self.text

  # 静态方法
  # 没有self
  # 实例和类都可以调用
  @staticmethod
  def test():
    # 内部可以访问类变量
    print('静态方法',Student.SUM)
  
  # 类方法 操作和类相关的
  # cls代表student这个类
  # 使用方式 student.testd()
  # 实例和类都可以调用，不要使用实例调用
  # 推荐使用类方法代替静态方法
  @classmethod
  def testd(cls):
    print('classMethod')
  
stu = Student('poetries',22)

print(stu.getAge())

# 修改内部变量值，通过内部定义一个方法，可以在内部进行判断，起到保护作用
stu.setName('静观流叶')

print(stu.getName())

# print(Student.author)
# print(Student.__dict__)
# print(Student.test())
```

这段代码信息密度不低，拆开说几处。

`author`、`SUM` 这些写在 `class` 下面、方法外面的是类变量，所有实例共享一份；`self.__name` 这种在 `__init__` 里挂到 `self` 上的是实例变量，各归各的。如果类变量是列表这类可变对象，某个实例把它改了，所有实例都会看到变化，这一点很容易埋雷。

`__name` 前面的双下划线不是真正的私有。解释器只是做了名字改写，把它变成 `_Student__name`，外部照样能访问，只是得绕一下。所以它更像一个「别碰我」的约定，而不是编译期强制，和 Java 的 `private` 不是一回事。

静态方法和类方法的分界线是要不要访问类本身。`@staticmethod` 什么都不接，纯粹是一个逻辑上归属这个类的工具函数；`@classmethod` 第一个参数是 `cls` 指向类本身，做工厂方法或者操作类变量时用它。原文里写的「推荐使用类方法代替静态方法」，我的理解是当你不确定以后会不会需要访问类的时候，`classmethod` 留了余地。

还要说一句这段代码本身的问题：它写的是 `class Student(Human)`，但 `Human` 定义在下面那个代码块里，两段单独跑第一段会抛 `NameError`。当成笔记看没问题，照抄进文件里要记得把顺序调过来。

```py
'''
继承
'''

class Human(object):
  num =10
  def __init__(self,name,age):
    self.__name = name
    self.__age = age 
    
  def getName(self):
    return self.__name

# 继承父类Human
class Student(Human):
  def __init__(self,school,name,age):
    self.school = school
    # 子类调用父类构造函数 
    # 方式1
    # Human.__init__(self,name,age)
    # 方式2 推荐super
    super(Student,self).__init__(name,age)

  def getInfo(self): 
    return self.getName() + self.school

stu = Student('中山大学','poetry',22)
print(stu.getInfo())
```

继承这段的重点是子类怎么调父类的构造函数。注释里给了两种方式，`Human.__init__(self, name, age)` 是硬编码父类名，改继承关系时得跟着改；`super(Student, self).__init__(name, age)` 走的是方法解析顺序，多重继承时只有它能保证每个父类都被正确初始化一次。

在 Python 3 里 `super()` 可以不带参数直接写，`super().__init__(name, age)` 就够了，两个参数是 Python 2 遗留的写法。

另外注意 `getInfo` 里调的是 `self.getName()` 而不是 `self.__name`。因为 `__name` 在 `Human` 里被改写成了 `_Human__name`，在子类里直接写 `self.__name` 会被改写成 `_Student__name`，取不到值。这正好说明了名字改写机制的实际影响。

## 十一、正则表达式

正则是一个特殊的字符序列，用来描述一种匹配规则，然后判断某个字符串是否符合这个规则，或者从中把符合规则的部分抠出来。Python 里对应的标准库是 `re`。

```python
# 替换所有非数字字符，\D 表示非数字
s = re.sub(r'\D', '', '9fafjla9dfaldfah-dfal+++)@#--9912')

# 第二个参数可以传函数，根据匹配结果动态生成替换内容
def convert(value):
    match = value.group()
    return '!!' + match

re.sub('#c', convert, 'pythonc#fda')
```

模式串前面记得加 `r` 变成原始字符串。不加的话反斜杠会先被 Python 的字符串转义吃掉一层，正则拿到的就不是你写的那个东西了。这是新手最常撞的一堵墙。

```python
# findall 可以加上第三个参数，re.I 忽略大小写
# re.S 改变 . 的匹配行为，让它可以匹配换行符 \n
# 返回 ['99999']
re.findall(r'\d+', 'kfdafd99999fa', re.I | re.S)

# 量词只对紧挨着它前面那一个字符起作用
# 这里的 ? 修饰的是 n，表示 n 出现 0 次或 1 次
re.findall('python?', 'pythonnn')
```

四个常用函数的区别是这一节最该记牢的：

- `re.match` 只从字符串开头匹配，没匹配上返回 `None`
- `re.search` 扫描整个字符串，找到第一个匹配就停
- `re.sub` 做替换
- `re.findall` 返回所有匹配组成的列表，日常用得最多，推荐

`match` 和 `search` 的差别坑过不少人。`re.match('\d+', 'abc123')` 返回 `None`，因为开头不是数字；换成 `search` 就能找到 `123`。

如果同一个正则要在循环里反复用，先 `pattern = re.compile(r'\d+')` 编译一次再复用，比每次现编快。

## 十二、内建函数

内建函数是不用导入任何模块就能直接调的函数，完整列表在官方文档里：https://docs.python.org/3/library/functions.html

![Python 内建函数一览](https://s.poetries.top/gitee/2019/12/114.png)

这张表值得整个扫一遍，很多需求标准答案就在里面。比如同时要下标和值用 `enumerate`，多个序列并行遍历用 `zip`，排序用 `sorted` 加 `key`，求和用 `sum`，判断可迭代对象里有没有满足条件的用 `any` / `all`。写了半天循环最后发现有个现成的内建函数，这种事我干过不止一次。

## 十三、标准库

常用模块

- 文字处理 re
- 日期类型 time、datetime
- 随机数、数学类型  math、random
- 文件和目录访问 pathlib os.path
- 数据压缩 tarfile
- 通用操作系统 os、logging、argparse
- 多线程 threading、queue
- 网络数据处理 base64 json urllib
- 结构化标记处理工具 html xml
- 调试工具 timeit
- 软件包发布 venv
- 运行服务的 __main__

Python 常被说「自带电池」，指的就是这份清单的覆盖面。装环境之前先翻一眼标准库，很多需求根本不用装第三方包。

`venv` 这条我想多说一句。不同项目依赖的包版本经常打架，全装在系统 Python 里迟早出事，所以每个项目都应该建一个虚拟环境，`python -m venv .venv` 然后激活，装什么都关在里面。这是我从前端 `node_modules` 那套习惯迁过来后最不适应的一点，Python 默认是全局装的，得自己动手隔离。

## 十四、异常处理

![Python 内置异常类型的继承体系](https://s.poetries.top/gitee/2019/12/127.png)

这张图是异常的继承树。捕获时写的类型越靠上，范围越大，写 `except Exception` 基本能兜住所有业务异常。

最基本的 `try-except` 语句：

```python
try:
    <语句块1>
except <异常类型>:
    <语句块2>
```

`try-except` 语句可以支持多个 `except`，从上往下依次匹配，命中第一个就不再往下走：

```python
try:
    <语句块1>
except <异常类型1>:
    <语句块2>
...
except <异常类型N>:
    <语句块N+1>
except <异常类型N+1>:
    <语句块N+2>
```

写多个 `except` 时顺序有讲究，范围小的放前面，范围大的放后面。把 `except Exception` 写在最上面，后面那些具体类型永远轮不到。

还有两个子句原文没提到但很常用。`else` 在没有异常时执行，`finally` 无论有没有异常都会执行，一般用来释放资源。

最后是一条实践建议：别写光秃秃的 `except:`，它连 `KeyboardInterrupt` 都会吞掉，你按 `Ctrl + C` 都停不下来。至少写成 `except Exception as e`，并且把 `e` 打出来，不然出了问题连线索都没有。

## 十五、JSON操作

- `json`库主要包括两类函数，操作类函数和解析类函数
- 操作类函数主要完成外部`JSON`格式和程序内部数据类型之间的转换功能
解析类函数主要用于解析键值对内容
- `json`格式包括对象和数组
- 对象用大括号 `{}` 表示，对应键值对的组合关系（被 `json` 库解析为字典）
- 数组用中括号 `[]` 表示，对应元素的对等关系（被 `json` 库解析为列表）

原文这里把数组的符号也写成了 `{}`，是笔误，JSON 数组用的是方括号。

**json库解析**

`json` 库包含编码（`encoding`）和解码（`decoding`）两个过程。编码是把 `Python` 数据类型变换成 JSON 格式，解码是从 `JSON` 格式中解析数据、对应到 `Python` 数据类型。

`json` 库的操作类函数：

|函数|	描述|
|---|---|
|`json.dumps(obj,sort_keys=False,indent=None)`|	将Python的数据类型转换为`JSON`格式，编码过程|
|`json.loads(string)`|将`JSON`格式字符串转换为Python的数据类型，解码过程|
|`json.dump(obj,fp,sort_keys=False,indent=None)`|	与`dumps()`功能一致，输出到文件`fp`|
|`json.load(fp)`|	与`loads()`功能一致，从文件`fp`读入|

带 `s` 的处理字符串，不带 `s` 的直接对接文件对象，这是记住这四个函数的最快办法。

- `json.dumps()` 中的 `obj` 可以是 `Python` 的列表或字典类型，当输入字典类型时，`dumps()` 函数将其变为 `JSON` 格式字符串
- 默认生成的字符串按原有顺序存放，`sort_keys` 可以让字典元素按照 `key` 排序后输出
- `indent` 参数用于增加数据缩进，使得生成的 `JSON` 格式字符串更具可读性

```python
import json

# 反序列化，注意 JSON 里的字符串必须用双引号
s = '{"name": "poetries"}'
json.loads(s)          # {'name': 'poetries'}

# 序列化
json.dumps([{'name': 'poetries'}])   # '[{"name": "poetries"}]'
```

原文这两行代码都跑不通，反序列化那行用了单引号的伪 JSON，`json.loads` 会抛 `JSONDecodeError`；序列化那行括号也没配对，而且 `name` 少了引号。这里一并改成了能跑的写法。

单引号这个坑挺常见的，因为 Python 打印字典时用的是单引号，看着像 JSON 其实不是。JSON 规范只认双引号，键也必须加引号。

处理中文时还要记得加 `ensure_ascii=False`，否则中文会被转成 `\uXXXX` 转义序列，存进文件根本没法看。

> json数据类型和python对比

|JSON|python|
|---|---|
|`object`|`dict`|
|`array`|`list`|
|`string`|`str`|
|`number`|`int`|
|`number`|`float`|
|`true`| `True`|
|`false`| `False`|
|`null` | `None`|

这张对照表里最容易出问题的是最后三行。Python 的 `True` / `False` / `None` 首字母大写，JSON 的 `true` / `false` / `null` 全小写，手写 JSON 字符串时经常写混。还有一点，Python 的元组序列化之后会变成 JSON 数组，再反序列化回来就是列表，类型回不去了。

## 十六、爬虫

学完前面这些，写个小爬虫是最好的练手方式，它把网络请求、正则、文件操作、列表推导全用上了。

![Python 爬虫相关的模块](https://s.poetries.top/gitee/2019/12/111.png)

下面这段是当时写来爬自己博客文章列表的，能跑：

```py
''' 
原生爬虫: 分页爬取我的博客文章列表
'''

from urllib import request
import re,json,os

baseUrl = 'http://blog.poetries.top'
class Spider():
  url = baseUrl + '/archives/'
  pattern = '<a class="post-title" href="(.*)">([\w]*?)</a>'

  def __init__(self,page=1):
    self.page = page 

  def __fetch_content(self):
    url = Spider.url
    if self.page != 1: 
      url = Spider.url + 'page/' + str(self.page)

    r = request.urlopen(url)
    #bytes
    htmls = str(r.read(), encoding='utf-8')
    return htmls

  def _analyse(self, htmls):
    res = re.findall(Spider.pattern, htmls)

    return res

  def start(self):
    htmls = self.__fetch_content()
    return self._analyse(htmls)



# 分页获取所有文章标题
result = [] # 保存多页数据 [[],[],[]]
for page in range(1,15):
  print('开始趴取，第(%d/%d)页文章.......'%(page,14))
  spider = Spider(page)
  res = spider.start()
  result.append(res)
  if page == 14:
    print('所有页面已趴取完...')

data = [] # 处理后的数据
if len(result) != 0:
  for i in result:
    res = list(map(lambda item: {
        'url': baseUrl + item[0],
        'title': item[1]
      },i))
    # 合并两个数组 [] + []
    data += res
  
  # 保存到当前文件夹
  with open(os.path.dirname(__file__) + '/blog.text','w') as f:
    f.write(json.dumps(data))

print(data)
```

这段代码的结构是这样：`__fetch_content` 负责发请求拿 HTML，`_analyse` 用正则把标题和链接抠出来，`start` 把两步串起来。类变量 `url` 和 `pattern` 是所有实例共用的配置，`page` 是每个实例自己的。

有几个细节值得留意。`request.urlopen` 返回的 `read()` 是 `bytes` 不是 `str`，必须 `str(r.read(), encoding='utf-8')` 转一次，不转的话后面正则匹配会报类型错误。方法名前的双下划线是私有约定，单下划线是「内部使用」的弱约定，这段代码里两种都出现了，实际项目里建议统一。

用正则解析 HTML 是这段代码最脆弱的地方。页面结构一改正则就失效，标签嵌套稍微复杂一点就写不出来。练手可以，正经做解析该上 `BeautifulSoup` 或者 `lxml` 的 XPath。请求也一样，`urllib` 够用但接口偏底层，实际项目里基本都换成了 `requests`。

还有一点得提：这里是连续 14 次请求打过去，中间没有任何间隔。爬自己的站没关系，爬别人的记得加延时、看一眼 `robots.txt`，别把自己写进去。

## 十七、常用库

### datetime库

> `datetime`库可以从系统中获得时间，并以用户选择的格式输出

> - `datetime`库以格林威治时间为基础，每天由`3600*24`秒精准定义
> - `datetime`库以类的方式提供多种日期和时间

- `datetime.date`：日期表示类，可以表示年、月、日等。
- `datetime.time`：时间表示类，可表示小时、分钟、秒、毫秒等。
- `datetime.datetime`：日期和时间表示类，功能覆盖date和time类。
- `datetime.timedelta`：与时间间隔有关的类。
- `datetime.tzinfo`：与时区有关的信息表示类。

日常九成场景用 `datetime.datetime` 就够了。`timedelta` 用来做时间加减，算「七天前」直接 `now - timedelta(days=7)`，比自己掰日历靠谱得多。

**datetime库解析**

1. `datetime.now()`：返回一个`datetime`类型，表示当前日期和时间，精确到毫秒

```py
>>>from datetime import datetime
>>>now=datetime.now()
>>>now
datetime.datetime(2018, 5, 13, 16, 49, 38, 627464)
```

2. `datetime.utcnow()`：返回一个`datetime`类型，表示当前日期和时间的`UTC`（世界标准时间）表示，精确到毫秒

```py
>>>from datetime import datetime
>>>utcnow=datetime.utcnow()
>>>utcnow
datetime.datetime(2018, 5, 13, 8, 53, 59, 788612)
```

原文这里写的是 `datetime.now()`，和上一条重复了，按输出结果（比北京时间少 8 小时）看应该是 `utcnow()`，我改了过来。存数据库、写日志建议统一存 UTC，展示的时候再转成本地时区，否则跨时区一定出乱子。

3. 直接使用`datetime()`构造一个日期和时间对象：

> datetime(Y,M,D,hour=0,minute=0,second=0,microsecond=0)

```py
>>>some=datetime(2018,5,13,17,0,0,0)
>>>some
datetime.datetime(2018, 5, 13, 17, 0)
```

**datetime类的常用属性**

|属性|	描述|
|---|---|
|`some.min`|	固定返回`datetime`的最小时间对象，`datetime(1,1,1,0,0)`|
|`some.max`|	固定返回datetime的最大时间对象，`datetime(9999,12,31,23,59,59,999999)`|
|`some.year`|	返回`some`包含的年份|
|`some.month`|	返回`some`包含的月份|
|`some.day`|	返回`some`包含的日期|
|`some.hour`|	返回`some`包含的小时|
|`some.minute`|	返回`some`包含的分钟|
|`some.second`|	返回`some`包含的秒钟|
|`some.microsecond`|	返回`some`包含的毫秒|

**datetime类的常用时间格式化方法**

|方法|	描述|
|---|---|
|`some.isoformat()`	|采用`ISO8601`标准显示时间|
|`some.isoweekday()`	|根据日期计算星期|
|`some.strftime()`	|根据格式化字符串`format`进行格式显示的方法|

原文这张表少了 Markdown 的表头分隔行，渲染出来是一坨文字，方法名也拼错成了 `isofomat`，一并修好了。跨系统传时间戳优先用 `isoformat()`，它是标准格式，另一端 `fromisoformat()` 能直接解析回来。

**strftime()方法用于输出特定格式时间**

|格式化字符串|	对象|	取值范围|
|---|---|---|
|`%Y`|	年|	`0001~9999`|
|`%m`|	月|	`1~12`|
|`%B`|	月名|	`January~December`|
|`%b`|	月名缩写|	`Jan~Dec`|
|`%d`|	日期|	`01~31`|
|`%A`|	星期|	`Monday~Sunday`|
|`%a`|	星期缩写|	`Mon~Sun`|
|`%H`|	小时（`24h`制）|	`00~23`|
|`%I`|	小时（`12h`制）|	`01~12`|
|`%p`|	上、下午|	`AM/PM`|
|`%M`|	分钟|	`00~59`|
|`%S`|	秒|	`00~59`|

```py
>>>some=datetime(2018,5,13,17,0,0,0)
>>>some.strftime("%Y年%m月%d日，%H时%M分%S秒")
'2018年05月13日，17时00分00秒'

>>>print('今天是{0:%Y}年{0:%m}月{0:%d}日'.format(some))
今天是2018年05月13日
```

`strftime` 是把 datetime 转成字符串，反过来把字符串解析成 datetime 用 `strptime`，格式符是同一套。这两个名字只差一个字母，我到现在还得想一秒，记法是「f 是 format 输出，p 是 parse 解析」。

### random库

> random库采用梅森旋转算法生成伪随机数序列，可用于除随机性要求更高的加解密算法外的大多数工程应用

- `Python`内置的`random`库主要用于产生各种分布的伪随机数序列
- `random`库提供`9`个常用函数

|函数|	描述|
|---|---|
|`seed(a=None)`|	初始化随机数种子，默认值为当前系统时间|
|`random()`|	生成一个`[0.0,1.0)`之间的随机小数，取不到 1.0|
|`randint(a,b)`|	生成一个`[a,b]`之间的整数，两端都能取到|
|`getrandbits(k)`|	生成一个`k`比特长度的随机整数|
|`randrange(start,stop[,step])`|	生成一个`[start,stop)`之间以`step`为步数的随机整数，取不到 stop|
|`uniform(a,b)`|	生成一个`[a,b]`之间的随机小数|
|`choice(seq)`|	从序列类型，例如列表中随机返回一个元素|
|`shuffle(seq)`|	将序列类型中的元素原地随机排列|
|`sample(pop,k)`|	从`pop`中随机选取`k`个不重复的元素，以列表类型返回|

区间的开闭在这张表里最容易记错，原文写成了闭区间，实际 `random()` 和 `randrange()` 都取不到右端点，只有 `randint` 是两端都含。`randint(1, 6)` 能掷出 1 到 6，模拟骰子正好合适。

`shuffle` 是原地打乱、返回 `None`，写 `a = random.shuffle(a)` 会把列表变成 `None`，这和前面说的列表 `sort` 是同一类坑。想拿新列表用 `random.sample(a, len(a))`。

生成随机数之前可通过 `seed()` 函数指定随机数种子，种子一般是一个整数，只要种子相同，每次生成的随机数序列也相同。调试时先 `random.seed(42)`，问题能稳定复现。

最后一条很重要：`random` 用的是梅森旋转算法，属于伪随机，序列是可以被推算出来的。抽奖、洗牌、造测试数据没问题，但生成密码、token、验证码这类涉及安全的场景必须换成 `secrets` 模块，官方文档里专门写了这条提醒。

## 十八、技巧

这一节是平时攒下来的零碎写法，都是能直接用的。

**查看命令信息**

```python
# 例如
help(filter)
```

`help()` 在交互式解释器里非常好用，忘了某个函数的参数顺序，直接 `help(它)` 比切出去翻文档快。想知道一个对象有哪些方法就用 `dir(它)`。

**列表中取出符合条件的元素**

```python
# 取出大于 5 的元素
arr = [1, 2, 3, 4, 5, 6, 7, 8]

arr1 = filter(lambda x: x > 5, arr)

# filter 返回迭代器，转化为列表才能看到内容
list(arr1)
```

**列表推导式**

用来代替 `for` 和 `if` 的嵌套循环，是 Python 里最常用的写法之一。

```python
# for 循环的写法
result = []

for x in range(10):
    if x % 2 == 0:
        result.append(x * x)
```

```python
# 等价于上面的写法
[x * x for x in range(10) if x % 2 == 0]
```

原文这里把结果变量命名成了 `list`，会把内建的 `list()` 遮住，后面再调用就报 `TypeError`，我换成了 `result`。这类覆盖内建名的问题在 Python 里非常隐蔽，编辑器一般也不报错。

推导式的可读性有个临界点。一层 `for` 加一个 `if` 是清晰的，套到两层 `for` 再加条件就该拆回普通循环了，别为了写成一行牺牲可读性。

数据量大的时候，把方括号换成圆括号就变成生成器表达式，按需产出、不占内存，处理大文件时差别很明显。

**字典推导式**

```python
# 一般写法
d = {}
for i in 'xxx':
    d[i] = i

# 字典推导写法
{i: i for i in 'xxx'}
```

同样的语法套在花括号里、只写一个表达式就是集合推导式，`{x for x in arr}` 能一步去重。


**文件读取**

```py
# f = open('test.txt',encoding='utf-8')

# data = f.readlines()
# for line in data:
#   print(line.strip('\n'))
  
# f.close()

# 推荐用with处理
with open('test.txt') as f:
  for line in f.readlines():
    print(line.strip('\n'))
```


这段里被注释掉的是手动 `open` 加 `close` 的写法，下面才是推荐的 `with`。两者的差别前面讲过，异常时能不能保证关掉句柄。

再补一个细节：`f.readlines()` 会把整个文件一次性读进内存，大文件会直接把内存吃满。直接写 `for line in f` 就行，文件对象本身就是可迭代的，它按行惰性读取。

**函数作用域**

```python
def test():
    global a    # 声明 a 用的是模块级的全局变量
```

严格说 `global` 不是「定义一个全局变量」，而是声明这个名字在函数里指向模块级的那一个，别当成局部变量。要改外层函数的变量用 `nonlocal`。

**装饰器**

它返回的是一个闭包。

```py
def log(func):
    def wrapper():
        print('start')
        func()
        print('end')
    return wrapper
    
@log
def test():
    print('测试')
```

这个最小例子只能装饰无参函数，实际用要把 `wrapper` 的签名换成 `(*args, **kw)`，并且 `return func(*args, **kw)` 把返回值传出去，前面第九节讲过。

**交换两个变量**

```py
>>> x = 10
>>> y = 20
>>> x,y = y,x
```

不需要中间变量，右边先算成一个元组，再解包赋给左边。这也是序列解包的一个应用。

## 十九、Python知识体系

把上面十八节收拢一下，整套知识大概分五层。

最底下是**语法层**，缩进、命名、保留字、注释，加上 `input` / `print` / `eval` 这几个入门函数。这一层没有理解成本，练几天就熟。

往上是**类型层**，数字、字符串、列表、元组、字典、集合。这一层真正的分水岭是可变与不可变，它一路影响到字典的 key 能放什么、函数默认参数为什么不能写空列表、传参改不改得动外面的对象。

第三层是**结构层**，条件、循环、函数、模块、异常。规则不多，但决定了代码的组织方式，比如为什么文件操作一律用 `with`，为什么 `except` 的顺序要从窄到宽。

第四层是**抽象层**，闭包、装饰器、`lambda` 与 `map` / `filter` / `reduce`、面向对象的类与继承。这一层是 Python 从「能写」到「写得好」的分界，装饰器和闭包在框架代码里到处都是，读源码绕不开。

最上面是**生态层**，标准库加第三方库。`re`、`json`、`datetime`、`random`、`os.path` 这几个标准库覆盖了日常大半需求，再往上是 NumPy、Pandas、requests 这些按方向选的工具。

学习顺序按这五层从下往上走比较稳。我自己走过一次弯路，一上来直接啃 Pandas，结果每碰到一个报错都要回头补语法，效率反而低。

## 二十、更多参考

- [廖雪峰python3教程](https://www.liaoxuefeng.com/wiki/1016959663602400)
- [Jupyter Notebook](https://jupyter.org/)

Jupyter Notebook 对做数据分析特别友好，代码分块跑、结果就地显示、图表直接嵌在下面，调参数时不用每次从头执行。学基础语法我还是用普通的 `.py` 文件加解释器，进入分析阶段之后基本全在 Notebook 里。

## 总结

回头看，从 JavaScript 转过来学 Python，真正需要重新建立认知的其实就那么几处。

缩进是语法不是风格，Tab 和空格不能混用。变量是贴在对象上的标签，所以传一个列表进函数，函数里改了外面也变。`==` 比值、`is` 比身份，`is` 只留给 `None` 这类单例。可变与不可变这条线一路贯穿到字典 key、函数默认参数和集合元素，理解它比背 API 有用得多。

坑最集中的地方是「原地修改返回 None」这一类，`list.sort()`、`random.shuffle()`、字符串的所有方法，写 `a = a.sort()` 就会拿到 `None`。碰到变量莫名其妙变成 `None`，先往这个方向查。

装饰器是最值得花时间的一块。它是闭包的应用，`@log` 只是 `f = log(f)` 的语法糖，想通这一句之后，Flask 的路由、pytest 的 fixture、functools 的缓存就都能看懂了。写自己的装饰器时记得加 `functools.wraps`，并且把返回值 `return` 出去。

原文里有一批笔误我在对应位置都标了出来并改正，包括 33 个关键字（3.7 起是 35 个）、`/` 与 `//` 的除法行为、`is` 的语义、JSON 数组的括号、`random` 区间的开闭，以及几段跑不通的示例代码。老笔记的价值在于覆盖面，但抄进项目前最好自己跑一遍。

## 参考

- [Python 官方教程](https://docs.python.org/zh-cn/3/tutorial/index.html)
- [Python 内置函数列表](https://docs.python.org/zh-cn/3/library/functions.html)
- [PEP 8 Python 代码风格指南](https://peps.python.org/pep-0008/)
- [re 正则表达式模块文档](https://docs.python.org/zh-cn/3/library/re.html)
- [random 模块文档](https://docs.python.org/zh-cn/3/library/random.html)
- [datetime 模块文档](https://docs.python.org/zh-cn/3/library/datetime.html)
- [廖雪峰 Python3 教程](https://www.liaoxuefeng.com/wiki/1016959663602400)
- [前端进阶之旅](https://interview.poetries.top)
