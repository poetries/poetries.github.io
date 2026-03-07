---
title: SqlServer2005学习总结
date: 2016-05-17 17:42:17
tags: sql
categories: DataBase 
---


### **第一部分：数据库相关概念**

**什么是数据库**
<!--more-->
- 狭义:
 - 存情数据的仓库

- 广义:
 - 可以对数据进行存储和管理的软件以及数据本身统称为数据库

数据库是由表、  关系、  操作组成

**为什么需要数据库**

- 几乎所有的应用软件的后台都需要数据库
- 数据库存储数据占用空间小容易持久保存
- 存储比较安全
- 容易维护和升级
- 数据库移植比较容易
- 简化对数据的操作
- 为将来学习0racle做准备
- B/s架构里面包含数据库
**数据库的安装和卸载**

- sq12000
- 解决挂起的问题

**预备知识**

- 学习SqlServer2005必须的先学一门编程语言么
- 不需要,但是懂一门编程语言的话会有助于学习sqlserver2005 的TL SQ

**数据结构和数据库的区别**

- 数据库是在应用软件级别研究数据的存储和操作数据结构是在系统软件级别研究数据的存储和操作

**什么是连接 【重点】**

- 有了编程语言为什么还需要数据库
- 对内存数据操作是编程语言的强项,   但是对硬盘数据操作却是编程语言的弱项对硬盘数据操作是数据库的强项, 是数据库研究的核心同题

**建议初学者从三个方面学习数据库数据库是如何存储数据的**

- 字段记录表约束(主键外键唯一键非空 check default触发器)
- 数据库是如何操作数据的
`insert  update delete T-SQL` 存储过程函数触发器

- 数据库是如何显示数据的
`select`(重点的重点)

**必各的一些操作**

- 如何建数据库
- 如何删除数据库
- 如何附加和分高数据库
- 设置登录用户名和密码
- 如何创建用户

**数据库是如何解决数据存储问题的 【最基础内容, 必须掌握】**

**1.表的相关数据**

- 字段
 - 一个事物的某一个特征

- 记录
 - 字段的组合表示的是一个具体的事物

- 表
 - 记录的组合表示的是同一类型事物的集合

**表和字段、记录的关系**

- 字段是事物的属性
- 记录是事物本身
- 表是事物的集合

- 列
 - 字段的另一种称谓

- 属性
 - 字段的另一种称谓

- 元组
 - 记录的另一种称谓

**2.   create table命令**

- 通过图形化界面建表
create table最后一个字段的后面建议不要写逗号说明:简単掌握后面我们会再详细的介绍

**3.    什么是约束**

- 定义
  - 对一个表中属性操作的限制叫做约束

- 分类

 - 主键约束
  不允许重复元素選免了数据的冗余

- 外键约束
  - 通过外键约束从语法上保证了本事物所
  - 关联的其他事物一定是存在的

事物和事物之间的关系是通过外键来体现的

- check约束
 - 保证事物属性的取值在合法的范围之内

- default约束
 - 保证事物的属性一定会有一个值

- 唯一约束
 - 保证了事物属性的取值不允许重复,,但允许其中有一列且只能有一列为空
 
**间题:**

ul,i que键是否允许多列为空?

答:

 - SqlServer2005只允许一个uni que列为空
 - Oracle1 IG允许多个uni que列为空


**not null**
 - 要求用户必须的为该属性赋一个值,否则语法出错!

- 如果一个字段不写n,11也不行not n,11
- 则默认是rm11即默认允许为空,用户可以不给该字段赋值
- 如果用户没有为该字段赋值,则该字段的值默认是nd1


**要注意nu11和 default的区别**

- 相同点:
 - 都允许用户不赋值
- 不同点:
 - nu11修饰的字段如果用户不赋值则默认是nu1 1
 - default修饰的字段如果用户不赋値则默认是default指定的那个值

**4.    表和约束的异同**

- 数据库是通过表来解决事物的存備同题的
- 数据库是通过约束来解决事物取值的有效性和合法性的问题
- 建表的过程就是指定事物属性及其事物属性各种约束的过程

- 什么是关系
 - 定义:
表和表之间的联系

- 实现方式
 - 通过设置不同形式的外键来体现表和表的不同关系

- 分类(假设是A表和B表)
 - 一对一
既可以把表A 的主键充当表B的外键
也可以把表B的主键充当表A的外键

 - 一对多【重点】
把表A 的主键充当表B的外键
或者讲: 把A表的主键添加到B表来充当B表的外键

在多的一方添加外键

 - 多对多
多对多必须的通过単独的一张表来表示

**例子**

- 班级和教师
- 班级是一张表
- 教师是一张表
- 班级和教师的关系也是一张表

**6.  主键**

- 定义
 - 能够唯一标示一个事物的一个字段或者多个字段的组合, 被称为主键

- 主键的特点【重点】:

 - 含有主键的表叫做主键表
 - 主键通常都是整数不建议使用字符串当主體(如果主體是用于集群式服务,才可以考虑用字符串当主體)
 - 主键的值通常都不允许修改, 除非本记录被删除
 - 主键不要定义成i d, 而要定义成表名 Id或者表名_i d
 - 要用代理主键,不要用业务主键
 - 任何一张表, 强烈建议不要使用有业务含义的字段充当主键
 - 我们通常都是在表中単独添加一个整型的编号充当主键字段
 - 主键是否连续增长不是十分重要

**7.  外键**

- 定义:
 - 如果一个表中的若干个字段是来自另外若干个表的主键或唯一键
则这若干个字段就是外键

**注意:**

- 外键通常是来自另外表的主键而不是唯一键, 因为唯一键可能为M11
- 外键不一定是来自另外的表, 也可能来自本表的主键
- 含有外键的表叫外建表, 外键字段来自的那一张表叫做主键表

**问题:**

- 先删主键表还是外建表?

答集:  先删外建表
如果先删主键表,会报错,因为这会导致外建表中的数据引用失败


----------
### **第二部分：查询**

**査询【最重要难度最大,考试必考内容,强烈建议所有的学生都要熟练掌握査询的内容】**

**1.计算列**

```select* from emp;```

- -- *表示所有的
- -- from emp 表示从emp表査询

```select empno,  ename from emp```

```seleot ename,  sa1 from emp;```

- select ename, sa1*12 as″年薪″ from emp;
- --as可以省略记住:″年薪″不要写成'年薪'也不要写成年薪

- select ename,  sa1*12 as″年薪″, sa1″月薪″, job from emp;

```select888 from emp;```
--ok
-一输出的行数是emp表的行数 每行只有一个字段,

`select5;`   --ok
-一不推荐

**注意:**

- 在0racle中字段的别名不允许用单引号括起来
- 但是sqlserver2005却允许,,因此为了兼容性 -最好字段别名用双引号括起来, 不要用单引号


**2.  distinct【不允许重复的】**

```select distinct deptno from emp;```
```--distince deptno会过滤掉重复的deptno```
```select distinct comm from emp;```
--distinct也可以过滤掉重复的nu11  或者说如果有多个nu11只输出一个
```select distinct comm, deptno from emp;```-一把comm和deptno的组合进行过滤```select deptno, distinct comn from emp1```--error逻辑上有冲突


**3. between【在某个范围】**

- -一査找工资在1 500到3000之间(包括和)的所有的员工的信息
```select* from e1lIp
where sa1>=1500 and sa1<=3000```
等价于
```selelit* from emp
where sa1 between1500 and3000```

- -一査找工资小于3ooo或大于1 5oo的所有的员工的信息```select* from emp where sa1<1500 or sa1>3000```
等价于
```select* from emp  where sa1 not between1500 and3000```

**4.  in【属于若干个弧立的值】**

``select*from emp where sa1 in(1500,  3000,  5000)```
等价于
```select* from emp
where sa1=1500 or sa1=3000 or sa1=5000```


```select*from emp where salnot in(1500, 3000, 5000)``` 

- -一把sa1既不是也不是也不是的记录输出等价于

```select* from enp
where sa1〇1500 and sat〇3000 and sat〇5000```

- -一数据库中不等于有两种表示:   `!=     <>`   **推荐使用第二种**
- -一对或取反是并且对并且取反是或

**5.  top【最前面的若干个记录专属于sqlserver的语法,不可移植到其他数据库】**

```select top5 *from emp;```
``select top15 percent* from emp; ```  -一输出的是3个,不是2个
``select top5  from emp;``` --error

**6. nu11【没有值空值】**

- 零和rm11是不一样的, nu11表示空值,投有值,零表示一个确定的值

- nu11不能参与如下运算: 〇  !=  =
- n111可以参与如下运算:   is     not is
- select* from emp where comm is nu11;  -一输出奖金为空的员工的信息
```select* from emp where comm is not nu11;``` 

- 一输出奖金不为空的员工的信息

```select* from e叩 where comm 〇 null; ```-一输出为空error
```select*from emp where comm !=nu11; ```-一输出为空error
```select* from emp where comm = nu11; ``` -一输出为空error

- 任何类型的数据都允许为 nu1 1

```create table t1 (:l,lamenvarchar(20), cnt int, riqi datetime);
insert into t1 values(nu1l, nu11, nu11);``` -0K

- 任何数字与rm1 1参与数学运算的结果永远是nu1 1

- 一输出每个员工的姓名年薪(包含了奖金)   comn假设是一年的奖金
```select empno, ename, sa1*12+comm ″年薪" from emp;```
- -一本程序证明了: r,u11不能参与任何数据运算否则结果永远为空
- 一正确的写法是:
```select ename, sa1*12+isnu11(comm, 0)″年薪″ from emp;```
--is null(comm, 0)如果comm是nu11就返回零否则返回comm的值


**7.  order by  【以某个字段排序】**

- `order by a, b`                       --a和b都是升序
- `order by a, b desc`               --a升序 b降序
- `order by a desc, b`        -a降序 b升序
- `order by a desc, b desc`       --a和b都是降序


- 文字描述:
 - 如果不指定排序的标准,则默认是升序升序用asc表示默认可以不写

 - 为一个字段指定的排序标准并不会对另一个字段产生影响强烈建议为每一个字段都指定排序的标准

**例子:**

 - asc是升序的意思默认可以不写 desc是降序

`select* from emp order by sa1;` 一默认是按照升序排序

    select*from emp order by deptno, sa1;

- -一先按照deptno升序排序,如果deptno相同,再按照sa1升序排序

    select* from emp order by deptno desc, sa1;

- -一先按deptno降序排序如果deptno相同再按照sal升序排序
- -一记住sa1是升序不是降序
`--orderby a desc, b, c, d`     desc只对a产生影响不会对后面的b  c d产生影响

```select*from emp order by deptno, sa1 desc```

- -一问题: desc是否会对deptno产生影响?
- -一答案:不会
- -一先按deptno升序,如果deptno相同,再按sa1降序


**8.模糊査询 【搜索时经常使用】**

- 格式:
select字段的集合 from表名 where某个字段的名字1ike匹配的条件
匹配的条件通常含有通配符



- 通配符:
%
表示任意o个或多个字符
```select*from emp  where enamelike'%A%'  ``` 

- --ename只要含有字母A就输出
```select*from emp where enamelike'A%'  ``` 

- -ename只要首字母是A的就输出
```select*    from emp     where enamelike'%A'  ```

- -ename只要尾字母是A的就输出

- [这是下划线不是減号]
- 表示任意单个字符
```select* from emp where enamelike'_A%'```

- -ename只要第二个字母是A的就输出

**[a-f]**

- a到f中的任意单个字符只能是a b c d e f中的任意一个字符
`select* from emp where` 

- `enamelike'_[A-F]%'''`-一把ename中第二个字符是A或B或c或D或E或F的记录输出

**[a, f]**

- a或f


**[a-c]**

- 不是a也不是b也不是c的任意单个字符

`select* from emp where enamelike'_[A-F]%'''`-一把ename中第二个字符不是A也不是B也不是c也不是D也不是E也不是F的记录输出

**注意:**

- 匹配的条件必须的用单引号括起来   不能省略也不能改用双引号
通配符作为不同字符使用的同题


```select* from student where namelike'%\%%' escape'\'  ``` -一把name中包含有%的输出```select* from student where namelike'%\_%' escape'\'``` 一把name中包含有_的输出

**9.聚合函数【多行记录返回至一个值通常用于统计分组的信息】函数的分类**

- 単行函数
 - 每一行返回一个值

- 多行函数
 - 多行返回一个值
 - 聚合函数是多行函数

 **例子:**
```selectlower(ename) from emp;``` 一最终返回的是行1ower0是单行函数
`select max(sa1) from emp;` 一返回行max0是多行函数


**聚合函数的分类**

- max()
-min()
-avg()  平均值
-count()求个数
-count(*)

返回表中所有的记录的个数

`select count(*) from emp;`  -一返回emp表所有记录的个数
count(字段名)

- 返回字段值非空的记录的个数, 重复的记录也会被当做有效的记录
```select courlt(deptno) from emp;```

- -一返回值是这说明deptno重复的记录也被当做有效的记录
```select coul,it(l1omm) from emp;``

- -一返回値是这说明 c omm为ru」1 1的记录不会被当做有效的记录

- count(distinct字段名)
 - 返回字段不重复并且非空的记录的个数

```select count(distinct deptno) from emp;```
-一返回值是 统计deptno不重复的记录的个数


**注意的问题**

- 判断如下sq1语句是否正确

```select ma:x(sa1), min(sa1), count(*) from emp; ```--ok
select max(sa1) -最高工资″, min(sa1)″最低工资″, count(*)″员工人数″ from emp; --ok
```select max(sa1), 1ower(ename) from emp;``` --error单行函数和多行函数不能混用
```select ma;x(sa1) from emp;``` --ok默认把所有的信息当做一组

**10. group by  【分组难点】**

- 格式:
 - group by字段的集合

- 功能:
 - 把表中的记录按照字段分成不同的组

**例子**

- 査询不同部门的平均工资
```select deptno, avg(sa1)```

as″部门平均工资⊠   from emp group by deptno

**注意:**

- 理解:  gro·up by a, b, c的用法
- 先按a分组,如果a相同,再按b分组,如果b相同,再按c分组
- 最终统计的是最小分组的信息
- 一定要明自下列语句为什么是错误的

select deptno, avg(sa1) as″部门平均工资⊠, ename
from emp
解oup by deptno


select deptno,  ename
from emp
解oup by deptno


select deptno, job, sa1
from emp
解oup by deptno, job
记住:使用了gro1」p by之后select 不能出现组内的详细信息中只能出现分组后的整体信息,


**11. having【对分组之后的信息进行过滤难点】**

- having子句是用来对分组之后的数据进行过滤
因此使用having时通常都会先使用group by

- 如果没使用gro·L!p by但使用了having
则意味着having把所有的记录当做一组来进行过滤
极少用
```select count(*)
from emp
having avg(sa1) > 1000```

- having子句出现的字段必须的是分组之后的组的整体信息having子句不允许出现组内的详细信息

- 尽管select字段中可以出现别名
- 但是having子句中不能出现字段的别名, 
- 只能使用字段最原始的名字原因不得而知

- **having和where的异同**

- 相同的:
 - 都是对数据过滤,只保留有效的数据
where和having一样, 

 - 都不允许出现字段的别名,,只允许出现最原始的字段的名字,本结论在S‘11Server2005和Olracle11G都成立
- 不同:
 - where是对原始的记录过滤 having是对分组之后的记录过滤
 - where必须的写在having的前面,顺序不可颠倒否则运行出错

**例子:**

一把工资大于,
-一统计输出部门平均工资大于的部门的部门编号部门的平均工资select deptno, avg(sa1)″平均工资″, count(*)″部门人数″,,max(sa1) ″部门的最高工资″
from emp
where sa1 >2000  --where是对原始的记录过滤
group by deptno
having avg(sa1) > 3000  -一对分组之后的记录过滤


一判断入选语句是否正确

> select deptno, avg(sal)″平均工资″, count(*)″部门人数″,,max(sa1) ″部门的最高工资″ from
> emp group by deptno having avg(sa1) >3000  -一对分组之后的记录过滤 where sa1 >
> 2000  一一where写在了having的后面  error



**12.连接査询**

- 定义
 - 将两个表或者两个以上的表以一定的连接条件连接起来
 - 从中检索出满足条件的数据

- 分类

**内连接【重点的重点也是难点的难点】**

- 1. `select... fromA, B`的用法
产生的结果:
- 行数是A和B的乘积
- 列数是A和B之和

- 或者说
油表的每一条记录都和B表的每一条记录组合在一起形成的是个笛卡尔积

- 或者说:
 - 把B表的每一条记录都和A表的每一条记录组合在一起形成的是个笛卡尔积

**注意:**

```select* from A, B```
输出结果和
```select* from B, A```
是一模一样的

**例子**
-一输出70行11列
```select* from emp, dept```

**2. select... from A, Bwhere... 的用法**

```select... from A, B ``` --A和B可以互换
产生的簡卡尔积, 用where中的条件进行过滤
**例子:**
-一输出5行11列
select*
from emp, dept  --dept和emp互换输出结果不变
where empno= 7369

-   select... from A join B on... select...  from A join B on
-  SQL92标准和 SQL99标准的区别
```select...  from A, B where.```
```select... from A join B on```
输出结果是一样


**推荐使用 sQL99标准**

- sq199更容易理解
- 在sq199标准中, on和,rhere可以做不同的分工
on指定连接条件
where对连接之后临时表的数据进行过糖

**示例:**

一把工资大于2000的员工的姓名和部门的名称输出 和 工资的等级
-sc1199标准明显的优于sq192

    select″E″.enae,″D″.hme,″S".grade
    from e叩 "E″
    join dept″D″
    on″E″.deptno=″D〟.deptno
    Join salgrade″S″
    on″E″.sa1>=″S″.1osal md"E″.sa1 <=″S″.hisal
    where″E".sa1 > 2000

一把工资大于2ooo的员工的姓名和部门的名称输出 和 工资的等级-sq192标准

    select″E″.en訓e,″D″.如ae,″S″.grade
    from e叩 ″E″, dept"D〟, salpade″S″
    where″E",sa1 > 2000  md  "E″,deptno=″D″,deptno md
    (″E″.sa1>=″S″.1osa1 md -E″.sa1 <=″S″.hisa1)


**5.  select、   from、   where、   Join、   on、   group、     order、   top、   having的混合使用**

**査询的顺序**

- select top....
- from A
- join B
- on....
- join C
- on....
- where,.....
- group by...
- having. , , . .
- order by.....
**例子:**

- -一把工资大于的所有的员工按部门分组把部门平均工资大于的最
- -一高前个的部门的编号部门的名称部 「J平均工资的等级

- **一第一种写法**

>     select"T″,*,  "D″,如ae,  "S″.grade
>     from dept″D″
>     join(select top2″E".deptno,  avg(sa1)″avg_sa1″
>     from emp″E″
>     join dept″D″
>     on″E″.deptno=″D".deptno
>     Join salpade″S"
>     on -E″.sa1 between〃S".1osa1 nd″S".hisa1
>     where ⊠E".sa1 > 1500
>     group by ⊠E″.deptno
>     having avg(″E〟.sat) > 2000
>     order by avg("E".sat) desc
>     ) ″T″
>     on"D〟.deptno=″T″.deptno
>     imer join salgrade″S"
>     on″T".″avg_sa1" between"S″.1osa1 nd"S″.hisa1


- **一第二种写法**

> select″T-.*,  ″D-. hae,  ″S".grade from dept″D″ join(select top2
> deptno,  avg(sa1)    as″avg_sa1″ from emp where sa1 > 1500 group by
> deptno having avg(sa1)  > 2000 order by″avg_sa1″ desc )  ″T″
> on″D″.deptno=″T″.deptno Join salgrade″S" on″T".″avg_sa1″
> between″S″.1osa1 nd″S″,hisal

**6. 习题**

- 判断以下语句输出是几行
```select'l: from emp, dept where emp.deptno= 10```
```select* from emp, dept where dept.deptno= 10 ```

- -一过滤条件不是连接条件

考虑如何把
selelit:* from emp, dept where dept.dept:lio= 10 以sq199标准来输出


1>求出每个员工的姓名部门编号薪水和薪水的等级
2>査找每个部门的编号该部门所有员工的平均工资平均工资的等级
3>査找每个部门的编号部门名称该部门所有员工的平均工资平均工资的等级
4>求出emp表中所有领导的信息
5> 求出平均薪水最高的部门的编号和部门的平均工资
6>把工资大于所有员工中工资最低的前3个人的姓名工资部门编号部门名称工资等级输出


**自连接**

- 定义
 - 一张表自己和自己连接起来査询数据

 **例子**
 
- 不准用聚合函数求薪水最高的员工的信息


**联合**

- 定义
 - 表和表之间的数据以纵向的方式连接在一起
 - **注意:** 我们以前讲的所有的连接是以横向的方式连接在一起的

**例子:**

- 输出每个员工的姓名工资上司的姓名

```select"E1″,enae,″E1″.sa1,   ″E2″.en訓e″上司的姓名″
from emp″E1″
Join emp″磁″
on"E1".m解 =″E2″.empno
uni on
select ename, sa1, '已是最大老板' from emp where mgr is nul1```

**注意:**

- 若干个select子句要联合成功的话,必须的满足两个条件
 - 这若干个select子句输出的列数必须是相等的
 - 这若干个se1 ect子句输出列的数据类型至少是兼容的


`identity`【主键自动增长,用户不需要为identity修饰的主键赋值】
用户如何手动给被i dent i ty修饰的主键赋值不重要


表中删除数据后又插入数据会导致主键不连续递增 怎么办?
主键是否连续增长不十分重要

**视图**

- 为什么需要视图

**示例**

- 求出平均工资最高的部门的编号和部门的平均工资

- **总结:**

 - 简化査询
 - 避免了代码的冗余
 - 避免了书写大量重复的sq1语句


- 什么是视图
- 视图从代码上看是一个select语句
- 视图从逻辑上看被当做一个虚拟表看待


- **如何创建视图**

`create view`视图的名字
as
-se1 ect的前面不能添加begin
select语句
-se1 ect的后面不能添加end

**注意的问题**

- 创建视图的 se1 ec t语句必须的为所有的计算列指定别名
-error
create view v$_a
as
select avg(sa1) from emp;

-ok
create view v$_a

as
select avg(sa1) as ⊠avg_sa1″ from emp;

- 视图不是物理表,是虚拟表
- 不建议通过视图更新视图所依附的原始表的数据或结构


- **视图的优点**

 - 简化査询
 - 增加数据的保密性

- **视图的缺点**
 - 增加了数据库维护的成本
 - 视图只是简化了査询,但是并不能加快査询的速度这也是视图使用不足的地方

**事务【重要】**

- 初学者必须要理解的三个概念
- 事务是用来研究什么的
 - 避免数据处于不合理的中间状态
 - 转账

- 怎样保证多用户同时访间同一个数据时呈现给用户的数据是合理的
很复杂,现在人类仍然投有设计出很好的解决办法!

- **事务和线程的关系**

 - 事务是通过锁来解决并发访问的
 - 线程同步也是通过锁来解决并发访同的  synchronized

所谓并发访同是指: 多用户同时访同同一个数据

- **事务和第三方插件的关系**

 - 直接使用事务库技术难度很大 很多人是借助第三放插件来实现
 - 因此我们一般人不需要细细的研究数据库中事务的语法细节

- 第三方插件要想完成预期的功能,   一般必须的借助数据库中的事物机制来实现


----------


- 索引
- 存储过程游标
- TL_SQL 触发器


- **分页査询**

 - 总结

假设每页显示n条记录, 当前要显示的是第m页
表名是A  主键是A_id
select top n*
from A
where A_id not in(select top  (m-1)*n   A_id from emp)
