---
title: Python基础小结(一)
date: 2019-12-10 17:40:39
tags: python
categories: Back-end
---


> 最近需要用`python`做数据分析，决定开始学`python`，总结一些基础笔记

## 一、导语

- `python`是解析性语言
- `python`能做什么
    - 大数据分析
    - 自动化运维与自动化测试
    - web开发：`flask`、`jdango`
    - 机器学习 `TensorFlow`
    - 胶水语言：如混合c++、java编程，能够把其他语法编写的模块连接在一起

**Python语言的特点**

- 语法简洁
- 可跨平台
- 应用广泛
- 支持中文
- 强制可读：通过强制缩进体现语句间的逻辑关系提高了程序的可读性
- 模式多样：语法层面同时支持面向过程和面向对象两种编程方式
- 粘性扩展：通过接口和函数集成其他语言编写的代码
- 开源理念
- 库类丰富

**Python语言开发环境配置**

- `Python`解释器
- `IDLE`开发环境
- 交互式启动
- 文件式启动
- `Python`语言集成开发环境——`PyCharm`

## 二、基本知识

### 注释

- 注释是辅助性文字，不被执行
- 单行注释：以`#`开头

```
#这是注释
```

> 多行注释：以`'''`(3个单引号)开头和结尾

```
'''
这是注释
这也是注释
这还是注释
'''
```

### 命名

- 命名是为变量关联标识符的过程，用于确保程序元素的唯一性
- 标识符由字母、数字、下划线（和汉字）等字符及其组合构成
- 标识符的首字符不能是数字 ，且中间不能出现空格
- 标识符对大小写敏感

### 保留字

- 保留字（`Keyword`）也被称为关键字，是被编程语言内部定义并保留使用的标识符
- `Python` 的标准库提供了一个 `keyword` 模块，可以输出当前版本的所有关键字：

```
>>> import keyword
>>> ls=keyword.kwlist
>>> ls
>>>len(ls)
33
```

**Python 3 有33个保留字**

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

### input()函数

- 使用`input()`函数从控制台获得用户输入
- `input()`函数以字符串类型返回结果

### eval()函数

- `eval(<字符串>)`函数的作用是间输入的字符串变成Python语句并执行

```
x=eval(input("请输入："))
```

### print()函数

- `print()`函数可以输出字符信息，也可以用字符的形式输出变量
- 输出字符信息时，可以直接将待输出内容传递给`print()`函数
- 输出变量值时，`print()`函数用槽格式和过`format()`方法将变量和字符串结合到一起输出

### 函数

- 函数可以理解为对一组表达特定功能表达式的封装，将特定功能代码编写在一个函数里，使程序模块化更好，便于阅读和复用
- 可通过保留字`def`自定义函数

### 文件操作

![](https://poetries1.gitee.io/img-repo/2019/12/107.png)

```py
# 使用with操作文件
with open(os.path.dirname(__file__) + '/blog.text','w') as f:
    f.write(json.dumps(data))
```

![路径操作模块](https://poetries1.gitee.io/img-repo/2019/12/131.png)
![图片](https://poetries1.gitee.io/img-repo/2019/12/132.png)
![Excel](https://poetries1.gitee.io/img-repo/2019/12/133.png)
![文本其他](https://poetries1.gitee.io/img-repo/2019/12/134.png)


## 三、基本类型

![python基本数据类型](https://poetries1.gitee.io/img-repo/2019/12/112.png)


**类型判断两个方式**

- `type` 判断基本类型 如 `type(10) == int` 不推荐
- `isinstance(值,类型)` 或者 `isinstance(值,(int,float,str))` 三种中任意一种
    - 例 `isinstance(1,int)`

- `Number`
  - `int`
  - `float`
  - `complex` 复数
    - 如`36j`
- `Bool`
  - `bool('')/bool([])/bool({})/bool(0)/bool(None)`
  - 都是转化为`False`
- 字符串`str` （序列）
  - 单引号
  - 双引号
  - 三引号(可以换行写多个字符串和ES6的反引号类似)
  - 在字符串前面加一个`r`，这个字符串就不是一个普通字符串，而是一个原始字符串会原样输出 `print(r'\n88fafa')` 此时`\n`不会转译
- `list` 列表 （序列）
- `tuple` 元组 （序列）
- 集合`set`(无序，没有索引，不能切片，元素唯一，不能重复,只有`value`，没`key`) `{}` 如 `{1,2,3,4}`
  - `1 in {1,2,3}`
  - `1 not in {1,2,3,4}`
  - 两个集合插集`{1,2,3} - {4,5}`
  - 两个集合求交集 `{1,2,3,4} & {2,3}`
  - 并集 `{1,2,3,4,5,6} | {3,4,7}`
  - 定义一个空的集合 `set()`
- 字典`dict`（有`key`无`value`，不同于集合只有`value`）
  - 很多`key-value`组成,不能够有相同的键，
  - `key`键不可变类型，可以是`int/str/tuple` 
  - `value`可以是：`int/str/float/list/set/dict`
  - 定义一个空的字典 `{}`

> 两个整型相除得到整型 type(1//2) ==>int 整除会保留整数

```
// 二进制
0b10012

// 八进制
0o101

// 16进制
0x10

// 10进制转二进制
bin(10)

// 八进制转二进制
bin(o09012)

// 八进制、二进制转十进制
int(0b1000)

// 十进制转16进制
hex(88891)

// 八进制转化
oct(0b100)
```

**转译字符**

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

**内置的字符串处理方法（共43个，常用16个）**

- 在`Python`解释器内部，所有数据类型都采用面向对象的方式实现，封装为一个类
- 字符串是一个类，具有类似`<a>.<b>()`形式的字符串处理函数，称为方法

|方法|	描述|
|---|---|
|`str.lower()`|	返回字符串`str`的副本，全部字符小写|
|`str.upper()	`|返回字符串`str`的副本，全部字符大写|
|`str.islower()`|	当str所有字符都是小写时，返回`Ture`，否则返回`False`|
|`str.isprintable()`|	当str所有字符都是可打印的，返回`Ture`，否则返回`False`|
|`str.isnumeric()`|	当str所有字符都是数字时，返回`Ture`，否则返回`False`|
|`str.isspace()`|	当str所有字符都是空格，返回`Ture`，否则返回`Flase`|
|`str.endswith(suffix[,start[,end]])`|	`str[start:end]`以`suffix`结尾返回`Ture`，否则返回`Flase`|
|`str.srartswith(prefix[,start[,end]])`|	`str[start:end]`以`prefix`开始返回`Ture`，否则返回`Flase`|
|`str.split(sep=None,maxsplit=-1)`|	返回一个列表，由`str`根据`sep`被分割的部分构成|
|`str.count(sub[,start[,end]]`|	返回`str[start:end]`中`sub`子串出现的次数|
|`str.replace(old,new[,count])`|	返回字符串`str`的副本，所有`old`子串被替换为`new`，如果`count`给出，则前`count`次`old`出现被替换|
|`str.center(width[,fillchar])`|	字符串居中函数|
|`str.strip([chars])`|返回字符串`str`的副本，在其左侧和右侧去掉`chars`中列出的字符|
|`str.zfill(width)`|返回字符串`str`副本，长度为`width`。不足部分在其左侧添加`0`|
|`str.format()`|返回字符串`str`的一种排版格式|
|`str.join(iterable)`|返回一个新字符串，由组合数据类型`iterable`变量的每个元素组成，元素间用`str`分隔|


## 四、序列-元组、字符串、列表

**序列共性**

- 切片
- 序号
- `in`判断符 `2 in [1,2,3]` `2 not in [1,2,3]`
- `len()`
- `max(list)`
- `min(list)`

![序列](https://poetries1.gitee.io/img-repo/2019/12/109.png)

![序列基本操作](https://poetries1.gitee.io/img-repo/2019/12/108.png)

**可变类型**

- `list` 需要动态改变，就用列表
- `dict`
- `set`

**不可变类型**

- `str`
- `tuple` 定义之后不可变，安全性较高
- `int`

**字符串基本操作**

```
// +号运算
str1 = 'hell'
str2 = 'world'
str = str1 + str2

// 乘法运算 
str1*3 // 重复3次

// 切片
str1[1:2]
```

```
// 赋值操作
year,month,day = (2019,10,12)
```

> 如果只有一个元素，应该这样表示元组 `(1,)`,一个元素都没有的元组 `type( () )`

![python类型转换](https://poetries1.gitee.io/img-repo/2019/12/126.png)


## 五、运算符

![python运算符](https://poetries1.gitee.io/img-repo/2019/12/113.png)

**列表元组都可以比较**

```js
(1,2,3) > (1,1,1) // 两两比较第一个、第二个...数字
```

**字典的成员运算符**


```js
// 只针对key
'a' in {'a': '1'} // True
```

**身份运算符**

- `is` 两个取值相等才会返回True  `'1' is '1' // True`
- `is not` 不等

```js
// 关系运算符比较的是两个值是否相等 如
1 == 1.0 // True

// is比较的是两个变量内存地址是否相等 id(值) 获取内存地址
1 is 1.0 // False
```

**对象的三个特征**

- `id`(身份) => `is`判断
- `value` => `==` 判断
- `type` => `isinstance` 判断

**位运算符**

> 把数字当二进制进行运算。把非二进制转化为二进制才计算

- `&` 按位与
- `|` 按位或
- `^` 按位异或
- `~ `按位取反
- `<<` 左移动
- `>>` 右移动

## 六、循环、条件、枚举

- `if else`
- `while`
- `for in`

**range**

```js
// 等同于
for(var i=0;i<len;i++){}

// range
for i in range(0,10)

// 2是步长
for i in range(0,10,2)

// 取出1，3，5，7
a = [1,2,3,4,5,6,7,8]
for i in range(0,len(a),2)

//切片写法
a[0:len(a):2]
```

## 七、枚举

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

## 八、闭包、模块、函数、变量作用域


### 模块

![模块](https://poetries1.gitee.io/img-repo/2019/12/110.png)

```js
// 在文件中写`__init__.py` 只是标注这是一个包 可以什么都不用写
```

**导入模块重新命名**

```
import test as t
```

**函数**

> 函数内部没有`return` 返回的结果就是`None`

```js
// 函数可以返回多个值
def test():
  return x, y,z
  
// 接收返回的值
x,y,z = test()  // 其实就是返回了一个元组类型
```

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


## 九、装饰器

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

## 十、面向对象

![类](https://poetries1.gitee.io/img-repo/2019/12/115.png)

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

## 十一、正则表达式

> 是一个特殊的字符序列，一个字符串是否与我们所设定的这样的字符序列相匹配

库re

```js
//替换非数字的
 s = re.sub('\D','','9fafjla9dfaldfah-dfal+++)@#--9912')
 
 
// 例子 传递函数 根据匹配结果替换操作
def convert(value):
  match = value.group()
  return '!!' + match

re.sub('#c', convert, 'pythonc#fda')
```

```js
// findall 可以加上第三个参数模式re.I忽略大小写
// re.S 改变.的匹配行为，可以匹配换行符`/n`  
// 返回 ['99999']
re.findall('\d+','kfdafd99999fa',re.I | re.S)


// 匹配仅仅是对前面那个字符起作用
// n匹配0次或者1次
re.findall('python?', 'pythonnn')
```

- `re.match` 没有找到匹配的，将会返回`None`
- `re.search` 直到搜索到
- `re.sub` 替换
- `re.findall` 推荐 返回一个列表

## 十二、内建函数

https://docs.python.org/3/library/functions.html

![内建函数](https://poetries1.gitee.io/img-repo/2019/12/114.png)

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


## 十四、异常处理

![python异常类型](https://poetries1.gitee.io/img-repo/2019/12/127.png)

> `try-except`语句

```
try:
    <语句块1>
except <异常类型>:
    <语句块2>
```

> try-except语句可以支持多个except语句

```
try:
    <语句块1>
except <异常类型1>：
    <语句块2>
...
except <异常类型N>:
    <语句块N+1>
except <异常类型N+!>:
    <语句块N+2>
```

## 十五、JSON操作

- `json`库主要包括两类函数，操作类函数和解析类函数
- 操作类函数主要完成外部`JSON`格式和程序内部数据类型之间的转换功能
解析类函数主要用于解析键值对内容
- `json`格式包括对象和数组
- 对象用大括号(`{}`)表示，对应键值对的组合关系（被`json`库解析为字典）
- 数组用中括号(`{}`)表示，对应键值对的对等关系（被`json`库解析为列表）


**json库解析**

- `json`库包含编码（`encoding`）和解码（`decoding`）两个过程
编码将`Python`数据类型变换成JSON格式
- 解码是从`JSON`格式中解析数据对应到`Python`数据类型的过程
`json`库的操作类函数

|函数|	描述|
|---|---|
|`json.dumps(obj,sort_keys=Flase,indent=None)`|	将Python的数据类型转换为`JSON`格式，编码过程|
|`json.loads(string)`|将`JSON`格式字符串转换为Python的数据类型，解码过程|
|`json.dump(obj,fp，sort_keys=Flase,indent=None)`|	与`dumps()`功能一致，输出到文件`fp`|
|`json.load(fp)`|	与`loads()`功能一致，从文件`fp`读入|

- `json.dumps()`中的`obj`可以是`Python`的列表或字典类型，当输入字典类型时，`dumps()`函数将其变为`JSON`格式字符串
- 默认生成的字符串是顺序存放的，`sort_keys`可以对字典元素按照`key`进行排序控制输出结果
- `indent`参数用于增加数据缩进，使得生成的`JSON`格式字符串更具可读性

```js
import json

// 反序列化
str = "{'name': 'poetries'}"
json.loads(str)


// 序列化
json.dumps([{name: 'poetries'])
```

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


## 十六、爬虫

![模块](https://poetries1.gitee.io/img-repo/2019/12/111.png)

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

## 十七、常用库

### datetime库

> `datetime`库可以从系统中获得时间，并以用户选择的格式输出

> - `datetime`库以格林威治时间为基础，每天由`3600*24`秒精准定义
> - `datetime`库以类的方式提供多种日期和时间

- `datetime.date`：日期表示类，坑人表示年、月、日等。
- `datetime.time`：时间表示类，可表示小时、分钟、秒、毫秒等。
- `datetime.datetime`：日期和时间表示类，功能覆盖date和time类。
- `datetime.timedelta`：与时间间隔有关的类。
- `datetime.tzinfo`：与时区有关的信息表示类。

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
>>>utcnow=datetime.now()
>>>utcnow
datetime.datetime(2018, 5, 13, 8, 53, 59, 788612)
```

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

|属性|	描述|
|`some.isofomat()`	|采用`ISO8601`标准显示时间|
|`some.isoweekday()`	|根据日期计算星期|
|`some.strftime()`	|根据格式化字符串`format`进行格式显示的方法|

**strftime()方法用于输出特定格式时间**

|格式化字符串|	对象|	取值范围|
|---|---|---|
|`%Y`|	年|	`0001~9999`|
|`%m`|	月|	`1~12`|
|`%B`|	月名|	`January~December`|
|`%b`|	月名缩写|	`Jan~Dec`|
|`%d`|	日期|	`01~31`|
|`%A`|	星期|	`Monday~Sunday`|
|`%a`|	星期缩写|	`Mon~Sum`|
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

### random库

> random库采用梅森旋转算法生成伪随机数序列，可用于除随机性要求更高的加解密算法外的大多数工程应用

- `Python`内置的`random`库主要用于产生各种分布的伪随机数序列
- `random`库提供`9`个常用函数

|函数|	描述|
|---|---|
|`seed(a=None)`|	初始化随机数种子，默认值为当前系统时间|
|`random()`|	生成一个`[0.0,1.0]`之间的随机小数|
|`randint(a,b)`|	生成一个`[a,b]`之间的整数|
|`getrandbits(k)`|	生成一个`k`比特长度的随机整数|
|`randrange(start,stop[,step])`|	生成一个[start,stop]之间以`step`为步数的随机整数|
|`uniform(a,b)`|	生成一个`[a,b]`之间的随机小数|
|`choice(seq)`|	从序列类型，例如列表中随机返回一个元素|
|`shuffle(seq)`|	将序列类型中的元素随机排列，返回打乱后的序列|
|`sample(pok,k)`|	从`pop`类型中随机选取`k`个元素，以列表类型返回|

> 生成随机数之前可通过`seed()`函数指定随机数种子，随机数种子一般是一个整数，只要种子相同，每次生成的随机数序列也相同

## 十八、技巧

**查看命令信息**

```js
// 例如
help(filter)
```

**列表中取出符合条件的元素**

```js
// 取出大于5的元素

arr = [1,2,3,4,5,6,7,8]

arr1 = filter(lambda x: x>5, arr)

// 转化为列表
list(arr1)
```

**列表推导式**

> 代替for和if嵌套循环。最常用的方式

```js
// for循环列子
list = []

for x in range(10):
 if x % 2 == 0:
    list.append(x*x)
```

```js
// 等价于上面写法
[x*x for x in range(10) if x%2 == 0]
```

**字典推导式**

```js
// 一般写法
d = {}
for i in 'xxx':
  d[i] = i
 
// 字典推导写法
{i:i for i in 'xxx'}
```


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


**函数作用域**

```js
def test():
    global a // 定义一个全局变量
```


**装饰器**

> 本质是返回一个闭包

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


**交换两个变量**

```py
>>> x = 10
>>> y = 20
>>> x,y = y,x
```

## 十九、Python知识体系

![Python知识体系](https://poetries1.gitee.io/img-repo/2019/12/181.png)

## 二十、更多参考

- [廖雪峰python3教程](https://www.liaoxuefeng.com/wiki/1016959663602400)
- [Jupyter Notebook](https://jupyter.org/)
