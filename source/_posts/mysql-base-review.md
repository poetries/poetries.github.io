---
title: MySQL 基础复习 从建表到查询的完整梳理
description: 一份 MySQL 基础复习笔记，覆盖 mac 环境搭建、库表操作、列类型选型、增删改查、连接与子查询、索引触发器视图和常用函数，并标注了 MySQL 8 的变化点。
tags: 
 - Mysql
 - 数据库
 - SQL
categories: DataBase
date: 2019-01-22 15:26:48
---

上一个项目前端后端一把抓，SQL 天天写；这个项目接口全由后端提供，我半年没碰过数据库，前两天要自己查一段线上数据，`group by` 和 `having` 谁在前谁在后都得想半天。翻出以前的学习笔记，发现里面攒了不少当时踩过的东西，干脆重新整理一遍，把每条命令背后的取舍也补上。

这篇不是 SQL 教程的替代品，它更像一份查得动的复习清单。每一节我都尽量说清楚「什么时候会用到」和「用错了会怎样」，而不是只列语法。顺带一提，我之前也整理过一篇 [MongoDB 的复习笔记](https://feinterview.poetries.top/blog/mongodb-review-1)，关系型和文档型对照着看，对「什么数据该放哪儿」这件事会更有感觉。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- mac 上装 MySQL、起服务、登录，以及连接参数各是什么意思
- 库、表、列三级操作的完整命令，以及改表时容易翻车的地方
- 列类型怎么选，整型宽度、char 和 varchar、日期时间类型的坑
- 增删改查四类语句，重点讲 select 的执行顺序
- 连接查询、子查询、union，配一整套基于商品表的实战练习
- 索引、触发器、视图、存储引擎这些进阶概念
- 常用函数速查，数学、字符串、日期、加密、格式化各一组
- MySQL 8 相对 5.x 改了什么，哪些写法已经不能用了

先说一句时效性。这些笔记是在 MySQL 5.x 时代写的，MySQL 8 之后有几处默认行为变了，比较明显的是默认字符集从 `latin1` 换成了 `utf8mb4`、默认认证插件换成了 `caching_sha2_password`、还有一批老函数被移除。我会在对应章节单独起一小段标出来，原文的写法保留不动，因为你维护老库的时候还是会碰到。具体某个特性落在哪个小版本上，以官方文档为准。

## 一、环境搭建

mac 上装 MySQL，用 Homebrew 最省事，它会把二进制、配置文件、启动脚本一起装好。

```
brew install mysql
```

装完之后终端会打印一大段提示，包括数据目录位置、怎么启动、以及初始的 root 账号说明。这段值得看一眼再往下走，尤其是它告诉你安全初始化命令怎么跑。

![Homebrew 安装 MySQL 完成后的终端输出提示](https://s.poetries.top/gitee/2019/10/355.png)

启动服务用下面这条。它是 Homebrew 提供的包装脚本，比直接调 `mysqld` 省心。

```bash
# 启动

mysql.server start
```

服务起来之后就能连了。刚装好的 root 一般没密码，直接 `-uroot` 进去。

```bash
#登录
mysql -uroot 
```

这里有个坑要注意。MySQL 8 的默认认证插件换成了 `caching_sha2_password`，一些老的客户端库连不上，报的错通常是 `Authentication plugin 'caching_sha2_password' cannot be loaded`。遇到这个不是密码错了，是客户端不支持新插件，解决办法要么升级客户端，要么把这个账号的认证方式改回 `mysql_native_password`。我第一次撞上的时候在密码上纠结了半天，完全找错了方向。

## 二、基础知识

这一章是所有操作的地基，库、表、列三层，每一层都有增删改查。命令看着琐碎，但结构其实很整齐。

### 1、数据库的连接

```bash
# 例子
mysql -u root -p 123456 -h 127.0.0.1 
```

三个参数的含义分别是：

- `-u` 用户名
- `-p` 密码
- `-h` `host` 主机地址，不写默认连本机

`-p` 这个参数有讲究。上面这种把密码直接跟在后面的写法能跑，但它会把密码留在 shell 历史记录里，而且 `-p` 和密码之间不能有空格，有空格 MySQL 会把它当成数据库名。生产环境更推荐只写 `-p` 不带值，回车之后它会提示你输入，输入的内容不回显也不进历史。

### 2、库级知识

每条命令后面都要加分号，这是 MySQL 客户端判断语句结束的标志。少了分号它会一直等着，光标停在 `->` 那里，很多人第一次会以为是卡住了。

- 显示数据库: `show databases;`
- 选择数据库: `use dbname;`
- 创建数据库: `create database dbname charset utf8;`
- 删除数据库: `drop database dbname;`

建库时指定字符集这个习惯很重要，不指定就跟随服务器默认值，几年后迁移的时候各个库字符集不一致会很难受。这里再补一句 MySQL 8 的变化，原文写的 `charset utf8` 在 MySQL 里其实是 `utf8mb3`，一个字符最多三字节，存不下 emoji 和部分生僻字。MySQL 8 把默认字符集改成了 `utf8mb4`，四字节，才是真正完整的 UTF-8。新库建议显式写 `charset utf8mb4`，老库里那些 `utf8` 就是历史遗留。

`drop database` 这条要格外小心，它没有确认没有回收站，敲下回车整个库就没了。我的习惯是在生产库上永远不手敲这条命令。

### 3、表级操作

#### 3.1 显示库下面的表

```bash
show tables;
```

#### 3.2 查看表的结构

```bash
desc tableName;
```

`desc` 输出的是列名、类型、能否为空、键类型、默认值这些，是最快速的一览。

#### 3.3 查看表的创建过程: 

```bash
show create table  tableName;
```

这条比 `desc` 更有用，它把完整的建表语句还原出来，包括引擎、字符集、索引定义、自增起始值。要在另一个库里复制一张同样结构的表，直接把它的输出粘过去就行，不用一列列比对。

#### 3.4 创建表

建表语句的骨架长这样，方括号里的部分是可选项。

```bash
create table tbName (
列名称1　列类型　[列参数]　[not null default ],
列名称N　列类型　[列参数]　[not null default ]
) engine myisam/innodb charset utf8/gbk
```

**例子**

```bash
create table user (
    id    int         auto_increment,
    name  varchar(20) not null default '',
    age   tinyint unsigned not null default 0,
    index id (id)
)engine=innodb charset=utf8;

# 注:innodb是表引擎,也可以是myisam或其他,但最常用的是myisam和innodb,
# charset 常用的有utf8,gbk;
```

这个例子里有几处值得拆开看。`auto_increment` 让 `id` 自增，但用它有个前提，这一列必须建索引，所以下面跟了一句 `index id (id)`。`not null default ''` 这个组合是个好习惯，理由放到 6.5 节讲默认值时展开。

关于引擎的选择，原文说「最常用的是 myisam 和 innodb」，这是 2019 年之前的语境。现在基本不用纠结了，新表一律 InnoDB，因为它支持事务、行级锁和外键，MyISAM 只有在纯读、能接受表锁的老场景里才见得到。MySQL 从 5.5.5 开始默认引擎就是 InnoDB 了。

#### 3.5 修改表

改表这块命令多，但可以按「加什么、改什么、删什么」归成三组来记。真正要小心的是，`alter table` 在大表上是重操作，MySQL 5.6 之后虽然支持了在线 DDL，但仍然可能锁表或者产生大量 IO。线上大表改结构，我的做法是先在从库或者影子表上试一遍，估算耗时。

**3.5.1	修改表之增加列**

```bash
alter table tbName add 列名称１　列类型　[列参数]　[not null default ]　

#(add之后的旧列名之后的语法和创建表时的列声明一样)
```

**3.5.2	修改表之修改列**

```bash
alter table tbName change 旧列名  新列名  列类型　[列参数]　[not null default ]

# (注:旧列名之后的语法和创建表时的列声明一样)
```

`change` 和 `modify` 的区别经常有人搞混。`change` 能改列名，所以要写两个列名；`modify` 只改类型和属性，写一个列名就够。两者都必须把完整的列定义重写一遍，漏写 `not null` 或者 `default`，那些属性就没了。这个我踩过，改个字段长度顺手把默认值弄丢了，上线之后插入报错。

**3.5.3	修改表之减少列**

```bash
alter table tbName drop 列名称;
```

**3.5.4	修改表之增加主键**

```bash
alter table tbName add primary key(主键所在列名);
```

比如 `alter table goods add primary key(id)` 就是把主键建在 `id` 列上。要注意这一列里不能有重复值也不能有 `NULL`，有一条不满足这条语句就失败。

**3.5.5	修改表之删除主键**

```bash
alter table tbName　drop primary key;
```

这里有个陷阱。如果这一列还带着 `auto_increment`，直接删主键会报错，因为自增列必须有索引。得先 `modify` 把自增属性去掉，再删主键。

**3.5.6	修改表之增加索引**

```bash
alter table tbName add [unique|fulltext] index 索引名(列名);
```

**3.5.7	修改表之删除索引**

```bash
alter table tbName drop index 索引名;
```

索引名建议有规律，比如 `idx_列名`、唯一索引用 `uk_列名`。表一大、索引一多，光看名字就能知道它是干什么的，省得每次都去 `show index`。

**3.5.8	清空表的数据**

```bash
truncate tableName;
```

`truncate` 和 `delete from 表名` 效果看着一样，内部完全是两回事。`truncate` 是 DDL，相当于把表删了重建，速度极快、自增计数归零、不写 binlog 的行记录，也没法回滚。`delete` 是 DML，一行行删，能带 `where`、能回滚、自增计数不重置。要清空一张大表用 `truncate`，要删部分数据用 `delete`，别搞反了。

### 4、列类型讲解

选列类型这件事，前期多想五分钟，后期能省几个小时。核心原则就一条，在能装下的前提下选最小的那个，因为每一行都要占这么多空间，索引也跟着变大。

#### 4.1 列类型

- `tinyint (0~255/-128~127) `
- `smallint (0~65535/-32768~32767) `
- `mediumint `
- `int` 
- `bigint`


**参数解释**

整型有两个常见的附加参数，`unsigned` 表示无符号也就是不能为负，`zerofill` 表示用 0 填充到指定宽度，括号里的 `M` 就是那个宽度。

- 举例:

```bash
tinyint unsigned;
tinyint(6) zerofill;   
```

这里有个特别容易误解的点。`int(11)` 里的 11 不是「能存 11 位数字」，它只是显示宽度，跟存储范围一点关系都没有。`int` 永远占 4 字节，写 `int(1)` 照样能存 20 亿。这个宽度只有配合 `zerofill` 时才有实际效果。补一句演进，MySQL 8 已经把整型的显示宽度标记为废弃了，新版本里写了会有告警，这个设计确实误导了太多人。

#### 4.2 数值型

- 浮点型:`float` `double`
- 格式:`float(M,D)`  `unsigned\zerofill;`

浮点数有精度损失，这不是 MySQL 的问题，是二进制表示小数的固有限制。所以钱绝对不要用 `float` 或 `double` 存，`0.1 + 0.2` 那个经典问题在数据库里一样会出现，对账时能把人逼疯。要存金额用 `decimal`，它是定点数，内部按字符串方式精确存储，`decimal(10,2)` 表示一共 10 位、小数占 2 位。

#### 4.3 字符型

- `char(m)` 定长
- `varchar(m)`变长
- `text`

下面这张表对比了 `char` 和 `varchar` 的空间占用，`i` 表示实际存了多少字符。

|列      |  实存字符i   |     实占空间    |        利用率|
|---|---|---|---|
|`char(M)`   |   `0<=i<=M`        |    `M `       |        `i/m<=100%`|
|`varchar(M) `  | `0<=i<=M `  |       `i+1,2`     |        `i/i+1/2<100%`|

`char(M)` 不管你实际存了几个字符，都占满 M 的空间，取出来的时候尾部空格会被自动去掉。`varchar(M)` 用多少占多少，但要额外花 1 到 2 个字节记录长度，超过 255 个字符就用 2 字节。

所以怎么选？长度基本固定的用 `char`，比如手机号、身份证号、MD5 值、性别标识；长度差异大的用 `varchar`，比如用户昵称、地址。`char` 的定长带来寻址优势，理论上会快一点，但在现代硬件上这点差距通常不是瓶颈，空间浪费反而更值得关心。

#### 4.4 日期时间类型


- `year`       `YYYY`	范围:`1901~2155`. 可输入值`2`位和`4`位(如`98`,`2012`)
- `date`       `YYYY-MM-DD` 如:`2010-03-14`
- `time`       `HH:MM:SS`	如:`19:26:32`
- `datetime`   `YYYY-MM-DD`  `HH:MM:SS` 如:`2010-03-14 19:26:32`
- `timestamp`  `YYYY-MM-DD`  `HH:MM:SS` 

`timestamp` 有个方便的特性，可以配置成插入或更新时自动填当前时间，不用应用层操心。

不过 `datetime` 和 `timestamp` 的差别值得多说两句，选错了很难受。`timestamp` 内部按 UTC 存，取出来时按当前时区转换，好处是跨时区业务天然正确，坏处是它的可表示范围只到 2038 年，也就是那个著名的 2038 问题。`datetime` 存的是字面上的年月日时分秒，不带时区概念，范围能到 9999 年。我的选择标准是，需要精确记录「某个时刻」的用 `timestamp`，记录「某个日历时间」比如生日、合同到期日的用 `datetime`。

另外原文提到 `year` 可以输入 2 位值，这个用法在 MySQL 5.7 已经被标记废弃，MySQL 8 里 `YEAR(2)` 这种声明方式已经不支持了。老库里如果有，迁移时要留意。

### 5、增删改查基本操作

这四类语句是日常写得最多的，但危险程度差别很大。`select` 写错顶多查不到，`update` 和 `delete` 写错就是事故。

#### 5.1 插入数据 

```bash
insert into 表名(col1,col2,……) values(val1,val2……); # -- 插入指定列

insert into 表名 values (,,,,); # -- 插入所有列

insert into 表名 values	# -- 一次插入多行 
(val1,val2……),
(val1,val2……),
(val1,val2……);
```

三种写法各有用处。指定列名的最稳，表结构加了新列也不会崩；不写列名的写法一旦有人改了表就全乱套，我基本不用。批量插入那种一次插多行的写法性能提升非常明显，因为它把多次网络往返和多次事务提交合并成了一次，导数据的时候差距能到数量级。

#### 5.2 修改数据

```bash
update tablename 

set 

col1=newval1,  
col2=newval2,
...
...
colN=newvalN
where 条件;
```

`where` 这一行是生命线，忘了它就是全表更新。一个自保的习惯是，先用同样的条件写一条 `select` 跑一遍，确认影响的行数对得上，再把 `select *` 换成 `update ... set ...`。MySQL 客户端还有个 `--safe-updates` 选项，开了之后不带 `where` 的 `update` 和 `delete` 会直接被拒绝，线上操作强烈建议开着。

#### 5.3 删除数据    

```bash
delete from tablenaeme where 条件;
```

同样的道理，`delete` 不带 `where` 就是清空全表。删之前先 `select count(*)` 看看要删多少行，这个动作花不了三秒。

#### 5.4 select 查询

`select` 是这里面最复杂的，它的各个子句有严格的书写顺序，也有和书写顺序不同的执行顺序。

1. 条件查询   `where`

- 条件表达式为真的行才会被取出，可以把它理解成对每一行做一次判断
- 比较运算符  `=` ，`!=`，`<>` `<=` `>=`，其中 `!=` 和 `<>` 是等价的
- `like` , `not like`，其中 `%` 匹配任意多个字符，`_` 匹配任意单个字符，另外还有 `in`, `not in` , `between and`
- `is null` , `is not null`

判空必须用 `is null`，不能写 `= null`。因为 `NULL` 在 SQL 里表示「未知」，任何值和未知比较结果都是未知，不是真也不是假，所以 `where col = null` 永远查不出东西来。这条规则第一次遇到会觉得反直觉，但想通「未知」这层含义就顺了。

`like '%关键词%'` 这种前面带通配符的写法用不上索引，会走全表扫描。数据量小无所谓，上了百万行就要考虑全文索引或者搜索引擎了。

2. 分组 `group by`，一般要配合 5 个聚合函数使用，也就是 `max`, `min`, `sum`, `avg`, `count`
3. 筛选 `having`
4. 排序 `order by`
5. 限制 `limit`

`where` 和 `having` 的区别是这一节最值得记的东西。`where` 在分组之前过滤原始行，所以它里面不能用聚合函数；`having` 在分组之后过滤分组结果，所以它能用 `sum()`、`avg()` 这些，也能直接用 `select` 里定义的别名。3.3 节那道练习题把这个差别演示得很清楚。

### 6、连接查询

一张表装不下所有信息，商品表里存 `cat_id`，栏目名在栏目表里，要一起显示就得连表。

#### 6.1 左连接

```bash
.. left join .. on
```

```bash
table A left join table B on tableA.col1 = tableB.col2 ; 
```

> 例句:
 
```bash
select 列名 from table A left join table B on tableA.col1 = tableB.col2
```
 
#### 6.2 右链接

```bash
right join
```

右连接和左连接是镜像关系，把两张表的位置换一下，`right join` 就能写成 `left join`。所以实际项目里几乎只见到 `left join`，统一成一种方向读起来负担小很多。

#### 6.3 内连接

```bash
inner join
```

三种连接的区别用一句话概括就是保留谁的行：

- 左连接以左边表的数据为准，沿着左表查右表，右表没匹配上的位置补 `NULL`
- 右连接反过来，以右表为准
- 内连接只保留两张表都能匹配上的行，也就是左右连接结果的交集

这里有个高频错误值得单独说。`left join` 之后如果在 `where` 里写了右表列的条件，比如 `where b.status = 1`，那些右表没匹配上、被补成 `NULL` 的行会被这个条件过滤掉，左连接就退化成内连接了。要保留它们得把条件写进 `on` 里而不是 `where`。这个我排查过一下午，报表里的数据总比预期少一截，最后就是栽在这上面。

### 7、子查询

子查询就是把一条查询的结果喂给另一条查询。按它出现的位置分成几类，最常见的是 `where` 型和 `from` 型。

`where` 型子查询把内层 SQL 的返回值当作 `where` 后面条件表达式的一部分。

```bash
# 例句: select * from tableA where colA = (select colB from tableB where ...);
```

用 `=` 的时候内层只能返回一行一列，返回多行会直接报错，这种情况得换成 `in`。

`from` 型子查询把内层 SQL 的结果当成一张临时表，供外层再查一次。注意这张临时表必须起别名，不然语法通不过。

```bash
例句:select * from (select * from ...) as tableName where ....
```

子查询和连接查询经常能互相替换。一般来说连接查询的执行计划更容易被优化器优化，子查询在早期 MySQL 版本上性能不太好，尤其是 `in` 加子查询那种。新版本优化器改进了不少，但如果你的查询慢，把子查询改写成 `join` 试试往往有效。

### 8、字符集

乱码问题九成出在这三个变量对不上。数据从客户端发出去、在服务器上转换、再返回来，每一步都有自己的编码设定。

- 客户端`sql`编码 `character_set_client`
- 服务器转化后的`sql`编码 `character_set_connection`
- 服务器返回给客户端的结果集编码`character_set_results`
- 快速把以上`3`个变量设为相同值: `set names` 字符集

`set names utf8mb4` 这一条命令就是同时设置上面三个变量，所以它是排查乱码时最先该试的。真正麻烦的是数据已经用错误编码存进去了，那时候改设置只会让乱码换个样子，得靠转码修复。

**存储引擎 engine=1\2**

- `Myisam`  速度快 不支持事务 回滚
- `Innodb`  速度慢 支持事务,回滚

上面这个对比是当年的普遍说法，现在得打个折扣。「InnoDB 慢」这个印象来自很早的版本，经过多年优化，InnoDB 在绝大多数场景下性能不比 MyISAM 差，在并发写入上更是压倒性优势，因为它是行级锁而 MyISAM 是表级锁。加上它支持事务和崩溃恢复，MySQL 从 5.5.5 起就把默认引擎换成了 InnoDB。除非你在维护老系统，否则不用再纠结这个选择。

**事务**

- 开启事务  `start transaction`
- 运行`sql; `      
- 提交,同时生效\回滚 `commit\rollback`

事务的价值在于「要么都成功要么都不做」。经典例子是转账，扣款和入账必须绑在一起，中间断电了也不能出现钱凭空消失的情况。注意 MySQL 默认是自动提交的，每条语句自成一个事务，所以要手动控制就得先 `start transaction` 或者关掉 `autocommit`。

**触发器**

触发器是挂在表上的自动执行逻辑，某个操作发生时它自动跑一段 SQL。定义一个触发器要说清楚四件事：

- 触发器 `trigger`
- 监视地点:表
- 监视行为:增 删 改
- 触发时间:`after\before`
- 触发事件:增删改


**创建触发器语法**

```bash
create trigger tgName
after/before insert/delete/update 
on tableName
for each row
sql; # -- 触发语句
```

`for each row` 表示逐行触发，影响了几行就跑几次。触发语句里可以用 `new` 和 `old` 两个关键字拿到变化前后的值，insert 只有 `new`，delete 只有 `old`，update 两个都有。3.7 节末尾那三个库存触发器就是典型用法。

不过触发器我个人用得很克制。它的逻辑藏在数据库里，应用层看代码完全看不出来，出问题排查非常费劲，团队新人更是不可能想到。除非是审计日志这类和业务解耦的需求，否则我更愿意把逻辑放在应用层。

- 删除触发器:

```bash
drop trigger tgName;
```

**索引**

索引是这一章里最值得花时间理解的东西，因为它直接决定查询快慢。
 
- 提高查询速度,但是降低了增删改的速度,所以使用索引时,要综合考虑.
- 索引不是越多越好,一般我们在常出现于条件表达式中的列加索引.
- 值越分散的列，索引的效果越好

第三条尤其关键。索引的作用是快速缩小范围，如果一列只有「男」和「女」两个值，走索引也得扫掉一半数据，优化器多半直接放弃它走全表。这个特性叫选择性，选择性越高索引越有效。所以在性别、状态这类列上单独建索引通常是浪费。

**索引类型**
 
 - `primary key`主键索引
 - `index` 普通索引
 - `unique index` 唯一性索引
 - `fulltext index` 全文索引

唯一索引除了加速，还兼具约束作用，能从数据库层面挡住重复数据。应用层的判重逻辑在并发下是靠不住的，两个请求同时查完都发现没有然后都插入，这种竞态只有唯一索引能兜住。

**综合练习:**

下面这套练习是这篇笔记的核心资产，后面第三章所有查询都基于它。建议真的照着建一遍表、插一遍数据，光看是记不住的。

- 连接上数据库服务器
- 创建一个`gbk`编码的数据库
- 建立商品表和栏目表,字段如下:

**商品表:goods**

- `goods_id`　--主键,
- `goods_name` -- 商品名称
- `cat_id`  -- 栏目`id`
- `brand_id` -- 品牌`id`
- `goods_sn` -- 货号
- `goods_number` -- 库存量
- `shop_price`  -- 价格
- `goods_desc`　--商品详细描述

**栏目表:category**

- cat_id --主键 
- cat_name -- 栏目名称
- parent_id -- 栏目的父id

栏目表这里有个设计值得注意，`parent_id` 指向同一张表的 `cat_id`，这是用一张表表达树形结构的经典做法，叫邻接表模型。好处是结构简单，坏处是查整棵子树要递归。3.1.10 那道题「1 栏目下面没商品但子栏目有」，考的就是这个。

建表完成后，接着练习改表的各种操作。

- 删除goods表的goods_desc 字段,及货号字段
- 并增加字段:click_count  -- 点击量
- 在goods_name列上加唯一性索引
- 在shop_price列上加普通索引
- 在clcik_count列上加普通索引
- 删除click_count列上的索引

倒数第二条里的 `clcik_count` 是原文的笔误，正确拼写是 `click_count`。这种拼写错误在 SQL 里的表现是直接报「未知列」，还算好排查。

**对goods表插入以下数据:**

```
+----------+------------------------------+--------+----------+-----------+--------------+------------+-------------+
| goods_id | goods_name                   | cat_id | brand_id | goods_sn  | goods_number | shop_price | click_count |
+----------+------------------------------+--------+----------+-----------+--------------+------------+-------------+
|        1 | KD876                        |      4 |        8 | ECS000000 |           10 |    1388.00 |           7 |
|        4 | 诺基亚N85原装充电器          |      8 |        1 | ECS000004 |           17 |      58.00 |           0 |
|        3 | 诺基亚原装5800耳机           |      8 |        1 | ECS000002 |           24 |      68.00 |           3 |
|        5 | 索爱原装M2卡读卡器           |     11 |        7 | ECS000005 |            8 |      20.00 |           3 |
|        6 | 胜创KINGMAX内存卡            |     11 |        0 | ECS000006 |           15 |      42.00 |           0 |
|        7 | 诺基亚N85原装立体声耳机HS-82 |      8 |        1 | ECS000007 |           20 |     100.00 |           0 |
|        8 | 飞利浦9@9v                   |      3 |        4 | ECS000008 |           17 |     399.00 |           9 |
|        9 | 诺基亚E66                    |      3 |        1 | ECS000009 |           13 |    2298.00 |          20 |
|       10 | 索爱C702c                    |      3 |        7 | ECS000010 |            7 |    1328.00 |          11 |
|       11 | 索爱C702c                    |      3 |        7 | ECS000011 |            1 |    1300.00 |           0 |
|       12 | 摩托罗拉A810                 |      3 |        2 | ECS000012 |            8 |     983.00 |          14 |
|       13 | 诺基亚5320 XpressMusic       |      3 |        1 | ECS000013 |            8 |    1311.00 |          13 |
|       14 | 诺基亚5800XM                 |      4 |        1 | ECS000014 |            4 |    2625.00 |           6 |
|       15 | 摩托罗拉A810                 |      3 |        2 | ECS000015 |            3 |     788.00 |           8 |
|       16 | 恒基伟业G101                 |      2 |       11 | ECS000016 |            0 |     823.33 |           3 |
|       17 | 夏新N7                       |      3 |        5 | ECS000017 |            1 |    2300.00 |           2 |
|       18 | 夏新T5                       |      4 |        5 | ECS000018 |            1 |    2878.00 |           0 |
|       19 | 三星SGH-F258                 |      3 |        6 | ECS000019 |            0 |     858.00 |           7 |
|       20 | 三星BC01                     |      3 |        6 | ECS000020 |           13 |     280.00 |          14 |
|       21 | 金立 A30                     |      3 |       10 | ECS000021 |           40 |    2000.00 |           4 |
|       22 | 多普达Touch HD               |      3 |        3 | ECS000022 |            0 |    5999.00 |          15 |
|       23 | 诺基亚N96                    |      5 |        1 | ECS000023 |            8 |    3700.00 |          17 |
|       24 | P806                         |      3 |        9 | ECS000024 |          148 |    2000.00 |          36 |
|       25 | 小灵通/固话50元充值卡        |     13 |        0 | ECS000025 |            2 |      48.00 |           0 |
|       26 | 小灵通/固话20元充值卡        |     13 |        0 | ECS000026 |            2 |      19.00 |           0 |
|       27 | 联通100元充值卡              |     15 |        0 | ECS000027 |            2 |      95.00 |           0 |
|       28 | 联通50元充值卡               |     15 |        0 | ECS000028 |            0 |      45.00 |           0 |
|       29 | 移动100元充值卡              |     14 |        0 | ECS000029 |            0 |      90.00 |           0 |
|       30 | 移动20元充值卡               |     14 |        0 | ECS000030 |            9 |      18.00 |           1 |
|       31 | 摩托罗拉E8                   |      3 |        2 | ECS000031 |            1 |    1337.00 |           5 |
|       32 | 诺基亚N85                    |      3 |        1 | ECS000032 |            1 |    3010.00 |           9 |
+----------+------------------------------+--------+----------+-----------+--------------+------------+-------------+
```


## 三、查询知识

这一章全是练习题，基于 `ecshop` 网站的商品表 `ecs_goods`。这些题看着朴素，但覆盖面很全，从最简单的等值查询一路排到多表连接和子查询，是我见过性价比最高的一套 SQL 练手题。

练习时可以只 `select` 几个关心的列，别一上来 `select *`，输出刷屏了反而看不清结果对不对。这个习惯到了生产环境更重要，`select *` 会把用不上的大字段也拉出来，浪费网络和内存，还可能让本来能走覆盖索引的查询退化。

### 3.1 基础查询 where的练习

先把 `where` 的各种条件写法过一遍。

#### 3.1.1 主键为32的商品

```bash
select goods_id,goods_name,shop_price 
     from ecs_goods
     where goods_id=32;
```

#### 3.1.2 不属第3栏目的所有商品

```bash
select goods_id,cat_id,goods_name,shop_price  from ecs_goods
     where cat_id!=3;
```

#### 3.1.3 本店价格高于3000元的商品

```bash
select goods_id,cat_id,goods_name,shop_price  from ecs_goods
     where shop_price >3000;
```

#### 3.1.4 本店价格低于或等于100元的商品

```bash
select goods_id,cat_id,goods_name,shop_price  from ecs_goods where shop_price <=100;
```

#### 3.1.5 取出第4栏目或第11栏目的商品(不许用or)

题目限制不许用 `or`，就是逼你想到 `in`。这两种写法在这里等价，但 `in` 后面跟一长串值时可读性好得多，优化器对 `in` 的处理通常也更友好。

```bash
select goods_id,cat_id,goods_name,shop_price  from ecs_goods
     where cat_id in (4,11);
```

#### 3.1.6 取出100<=价格<=500的商品(不许用and)

同理，不许用 `and` 就用 `between and`。注意它是闭区间，两端都包含，这一点经常有人记错。

```bash
select goods_id,cat_id,goods_name,shop_price  from ecs_goods
     where shop_price between 100 and 500;
```

#### 3.1.7 取出不属于第3栏目且不属于第11栏目的商品(and,或not in分别实现)

```bash
select goods_id,cat_id,goods_name,shop_price from ecs_goods where cat_id!=3 and cat_id!=11;

select goods_id,cat_id,goods_name,shop_price from ecs_goods where cat_id not in (3,11);
```

#### 3.1.8 取出价格大于100且小于300,或者大于4000且小于5000的商品

这题考的是运算符优先级。`and` 的优先级高于 `or`，所以下面这条不加括号也能得到正确结果。

```bash
select goods_id,cat_id,goods_name,shop_price from ecs_goods where shop_price>100 and shop_price <300 or shop_price >4000 and shop_price <5000;
```

话虽如此，我还是建议该加括号就加。依赖优先级写出来的条件，三个月后自己看都要愣一下，更别说同事了。下一题就是必须加括号的情况。

#### 3.1.9 取出第3个栏目下面价格<1000或>3000,并且点击量>5的系列商品

```bash
select goods_id,cat_id,goods_name,shop_price,click_count from ecs_goods where
cat_id=3 and (shop_price <1000 or shop_price>3000) and click_count>5;
```

这里的括号是必须的。不加的话按优先级会被解析成「cat_id=3 且价格小于 1000」或者「价格大于 3000 且点击量大于 5」，跟题意完全不是一回事。

#### 3.1.10 取出第1个栏目下面的商品(注意:1栏目下面没商品,但其子栏目下有)

```bash
select goods_id,cat_id,goods_name,shop_price,click_count from ecs_goods
     where cat_id in (2,3,4,5);
```

这个答案是把 1 栏目的子栏目 id 手写进去了，能得到结果但不通用，栏目一变就废。正经做法是先查出所有 `parent_id = 1` 的栏目 id，用子查询喂进 `in`。要处理任意深度的子孙栏目，得靠递归，MySQL 8 支持了递归 CTE 也就是 `with recursive`，5.x 时代只能在应用层循环查询或者改用其它树形存储方案。这也是前面提到的邻接表模型的代价。

#### 3.1.11 取出名字以"诺基亚"开头的商品

```bash
select goods_id,cat_id,goods_name,shop_price  from ecs_goods     where goods_name like '诺基亚%';
```

#### 3.1.12 取出名字为"诺基亚Nxx"的手机

两个下划线表示正好两个任意字符，跟 `%` 的「任意多个」区别开。要匹配「诺基亚N」后面跟三位的就写三个下划线。

```bash
select goods_id,cat_id,goods_name,shop_price  from ecs_goods  
   where goods_name like '诺基亚N__';
```

#### 3.1.13 取出名字不以"诺基亚"开头的商品

```bash
select goods_id,cat_id,goods_name,shop_price from ecs_goods
     where goods_name not like '诺基亚%';
```

原文这条里表名写成了 `ecs_goos`，少了一个字母 d，这里已经改过来了。

这里还有个陷阱值得提。如果 `goods_name` 里有 `NULL` 值，`not like` 是查不出来的，因为 `NULL` 参与任何比较结果都是未知。想把它们也捞出来得额外写 `or goods_name is null`。这就是为什么建表时能加 `not null default ''` 就加上，能省掉大量这类判断。

#### 3.1.14 取出第3个栏目下面价格在1000到3000之间,并且点击量>5 "诺基亚"开头的系列商品

```bash
select goods_id,cat_id,goods_name,shop_price from ecs_goods where 
cat_id=3 and shop_price>1000 and shop_price <3000 and click_count>5 and goods_name like '诺基亚%';
```

```bash
select goods_id,cat_id,goods_name,shop_price  from ecs_goods where 
shop_price between 1000 and 3000 and cat_id=3  and click_count>5 and goods_name like '诺基亚%';
```

上面两条写法结果一样，只是条件顺序不同。SQL 里 `where` 各个条件的书写顺序不影响结果，优化器会自己决定先用哪个条件缩小范围。所以别指望「把最能过滤的条件写前面」能提速，那是优化器的活。

#### 3.1.15 一道面试题

这题考的是把列当变量参与运算的思路，是从「只会查」到「会算」的分水岭。

有如下表和数据，要求：

- 把`num`值处于`[20,29]`之间,改为`20`
- `num`值处于`[30,39]`之间的,改为`30`

```
+------+
| num  |
+------+
|    3 |
|   12 |
|   15 |
|   25 |
|   23 |
|   29 |
|   34 |
|   37 |
|   32 |
|   45 |
|   48 |
|   52 |
+------+
```

思路是用整除和乘法把数字压到十位，比如 `num div 10 * 10` 能把 25 变成 20、37 变成 30，再配合 `where num between 20 and 39` 限定范围。也可以用 `case when` 分支写，逻辑更直白但更长。

#### 3.1.16 练习题:

把 `goods` 表中商品名为「诺基亚xxxx」的商品，改成「HTCxxxx」，也就是只换前缀保留后面的型号。

提示是大胆把列看成变量，参与运算，甚至调用函数来处理，这里会用到 `substring()` 和 `concat()`。

具体思路是先用 `substring(goods_name, 4)` 截掉前三个汉字拿到型号部分，再用 `concat('HTC', ...)` 拼上新前缀，最后配合 `where goods_name like '诺基亚%'` 限定范围。原文这里把 `substring()` 写成了 `ubstring()`，掉了首字母，这里已经补上。

要提醒一句，字符串函数里的位置和长度在 MySQL 里是按字符算的，不是按字节，前提是字符集设置正确。字符集不对的时候截中文会截出半个字，那种乱码非常有迷惑性。

### 3.2	分组查询group

聚合和分组是从「查明细」跨到「出报表」的关键一步。先把五个聚合函数各练一遍。

#### 3.2.1 查出最贵的商品的价格

```bash
select max(shop_price) from ecs_goods;
```

#### 3.2.2 查出最大(最新)的商品编号

```bash
select max(goods_id) from ecs_goods;
```

#### 3.2.3 查出最便宜的商品的价格

```bash
select min(shop_price) from ecs_goods;
```

#### 3.2.4 查出最旧(最小)的商品编号

```bash
select min(goods_id) from ecs_goods;
```

#### 3.2.5 查询该店所有商品的库存总量

```bash
select sum(goods_number) from ecs_goods;
```

#### 3.2.6 查询所有商品的平均价

```bash
select avg(shop_price) from ecs_goods;
```

#### 3.2.7 查询该店一共有多少种商品

```bash
select count(*) from ecs_goods;
```

`count(*)`、`count(1)`、`count(列名)` 三者有区别。前两个统计行数，行为一致，性能上现代 MySQL 也基本没差；`count(列名)` 只统计该列不为 `NULL` 的行数，所以结果可能小于总行数。要数总行数就老老实实用 `count(*)`。

#### 3.2.8 查询每个栏目下面

上面几题都是对全表求聚合，加上 `group by` 之后就变成对每一组分别求聚合了。这题要一次性算出每个栏目下的：

- 最贵商品价格
- 最低商品价格
- 商品平均价格
- 商品库存量
- 商品种类

五个聚合函数 `sum`、`avg`、`max`、`min`、`count` 配合 `group by` 一起用，先从最简单的形式起步。

```bash
select cat_id,max(shop_price) from ecs_goods  group by cat_id;
```

然后把其它四个函数并排加进 `select` 列表就行，`group by` 那一句不用动。

这里有个必须知道的规则。`select` 里出现的非聚合列，必须也出现在 `group by` 里，否则语义是不确定的。MySQL 5.7 之前默认放行这种写法，随便给你返回组内某一行的值；5.7 开始默认打开了 `ONLY_FULL_GROUP_BY` 这个 sql_mode，直接报错。所以老代码迁到新版本上，这类查询是最容易集中爆雷的地方，3.7 节那个 from 子查询的例子也踩在这条线上。

### 3.3 having与group综合运用查询

这一节的主线是「先算出一个派生值，再拿这个派生值做筛选」。

#### 3.3.1 查询该店的商品比市场价所节省的价格

```bash
select goods_id,goods_name,market_price-shop_price as j 
     from ecs_goods ;
```

#### 3.3.2 查询每个商品所积压的货款(提示:库存*单价)

```bash
select goods_id,goods_name,goods_number*shop_price  from ecs_goods
```

#### 3.3.3 查询该店积压的总货款

```bash
select sum(goods_number*shop_price) from ecs_goods;
```

#### 3.3.4 查询该店每个栏目下面积压的货款.

```bash
select cat_id,sum(goods_number*shop_price) as k from ecs_goods group by cat_id;
```

#### 3.3.5 查询比市场价省钱200元以上的商品及该商品所省的钱(where和having分别实现)

这题最能说明 `where` 和 `having` 的差别，值得盯着看一会儿。

```bash
select goods_id,goods_name,market_price-shop_price  as k from ecs_goods
where market_price-shop_price >200;
```

```bash
select goods_id,goods_name,market_price-shop_price  as k from ecs_goods
having k >200;
```

两种写法结果一样，区别在于 `where` 里必须把表达式重写一遍，不能用别名 `k`；`having` 里可以直接用别名。

为什么？因为 SQL 的执行顺序是 `from` 到 `where` 到 `group by` 到 `having` 到 `select` 到 `order by` 到 `limit`。`where` 执行的时候 `select` 还没跑，别名根本不存在。`having` 排在 `select` 之后，别名已经有了。想通这条执行顺序，很多「为什么这里能用那里不能用」的疑问会一次性消失。

至于选哪个，能用 `where` 就用 `where`。它在分组前过滤，处理的数据量更小，而且能用上索引，`having` 是在结果集上再筛一遍。

#### 3.3.6 查询积压货款超过2W元的栏目,以及该栏目积压的货款

```bash
select cat_id,sum(goods_number*shop_price) as k from ecs_goods group by cat_id
having k>20000
```

#### 3.3.7 where-having-group综合练习题

这是整章我最喜欢的一道题，因为它把「布尔值可以参与运算」这个思路演示得非常漂亮。

有如下表及数据

```
+------+---------+-------+
| name | subject | score |
+------+---------+-------+
| 张三 | 数学    |    90 |
| 张三 | 语文    |    50 |
| 张三 | 地理    |    40 |
| 李四 | 语文    |    55 |
| 李四 | 政治    |    45 |
| 王五 | 政治    |    30 |
+------+---------+-------+
```

> 要求:查询出2门及2门以上不及格者的平均成绩

先查看每个人的平均成绩

```bash
mysql> select name,avg(score) from stu group by name;
```

```
+------+------------+
| name | avg(score) |
+------+------------+
| 张三 |    60.0000 |
| 李四 |    50.0000 |
| 王五 |    30.0000 |
| 赵六 |    99.0000 |
+------+------------+
4 rows in set (0.00 sec)
```

看每个人的挂科情况。关键就在这一步，`score < 60` 这个比较表达式可以直接写在 `select` 里，MySQL 会把它算成 1 或者 0。

```
mysql> select name,score < 60 from stu;
```

```
+------+------------+
| name | score < 60 |
+------+------------+
| 张三 |          0 |
| 张三 |          1 |
| 张三 |          1 |
| 李四 |          1 |
| 李四 |          1 |
| 王五 |          1 |
| 赵六 |          0 |
| 赵六 |          0 |
| 赵六 |          0 |
+------+------------+
9 rows in set (0.00 sec)
```

既然是 1 和 0，那把它 `sum` 起来就是挂科门数了。这一步是整道题的转折点。

```bash
mysql> select name,sum(score < 60) from stu group by name;
```

```
+------+-----------------+
| name | sum(score < 60) |
+------+-----------------+
| 张三 |               2 |
| 李四 |               2 |
| 王五 |               1 |
| 赵六 |               0 |
+------+-----------------+
4 rows in set (0.00 sec)
```

> 同时计算每人的平均分

```bash
mysql> select name,sum(score < 60),avg(score) as pj from stu group by name;
```

```
+------+-----------------+---------+
| name | sum(score < 60) | pj      |
+------+-----------------+---------+
| 张三 |               2 | 60.0000 |
| 李四 |               2 | 50.0000 |
| 王五 |               1 | 30.0000 |
| 赵六 |               0 | 99.0000 |
+------+-----------------+---------+
4 rows in set (0.00 sec)
```

最后用 `having` 按挂科门数筛。这里 `gk` 是聚合结果的别名，`where` 里是写不了的，只能用 `having`，正好呼应了上一节讲的执行顺序。


```bash
mysql> select name,sum(score < 60) as gk ,avg(score) as pj from stu group by name having gk >=2; 
```


```
+------+------+---------+
| name | gk   | pj      |
+------+------+---------+
| 张三 |    2 | 60.0000 |
| 李四 |    2 | 50.0000 |
+------+------+---------+
2 rows in set (0.00 sec)
```


这套解法的通用价值很大。凡是「统计满足某条件的行数」，都可以写成 `sum(条件表达式)`，比写一堆 `case when` 简洁得多。多个统计口径并排放在一个查询里，一次扫表全算完，比分开查几次快。

### 3.4、order by 与 limit查询

排序和分页，做列表页天天用。

#### 3.4.1 按价格由高到低排序

```bash
select goods_id,goods_name,shop_price from ecs_goods order by shop_price desc;
```

#### 3.4.2 按发布时间由早到晚排序

```bash
select goods_id,goods_name,add_time from ecs_goods order by add_time;
```

#### 3.4.3 按栏目由低到高排序,栏目内部按价格由高到低排序

多列排序用逗号隔开，先按第一列排，第一列相同的再按第二列排。每一列可以单独指定升降序，`desc` 只作用于它前面那一列。

```bash
select goods_id,cat_id,goods_name,shop_price from ecs_goods
     order by cat_id ,shop_price desc;
```

#### 3.4.4 取出价格最高的前三名商品

```bash
select goods_id,goods_name,shop_price from ecs_goods order by shop_price desc limit 3;
```

#### 3.4.5 取出点击量前三名到前5名的商品

`limit` 带两个参数时，第一个是偏移量从 0 开始数，第二个是取几条。所以 `limit 2,3` 是跳过前两条再取三条，也就是第三到第五名。

```bash
select goods_id,goods_name,click_count from ecs_goods order by click_count desc limit 2,3;
```

分页这里有个绕不开的性能问题。`limit 1000000,10` 这种深分页，数据库要先把前一百万行扫出来再丢掉，越翻越慢。常见的优化是记住上一页最后一条的 id，下一页用 `where id > 上次的id limit 10`，把偏移量换成条件过滤。这招要求排序列有序且唯一，做「加载更多」这种交互很合适，做「跳到第 500 页」就不行了。

还有个坑，`order by` 的列如果有重复值，相同值之间的顺序是不确定的，翻页时可能出现某条记录重复出现或者漏掉。稳妥做法是在排序列后面再补一个唯一列，比如 `order by click_count desc, goods_id desc`。

### 3.5	连接查询

前面 6.1 到 6.3 讲了连接的语法，这一节是实战。

#### 3.5.1 取出所有商品的商品名,栏目名,价格


```bash
select goods_name,cat_name,shop_price from 
ecs_goods left join ecs_category
on ecs_goods.cat_id=ecs_category.cat_id;
```

#### 3.5.2 取出第4个栏目下的商品的商品名,栏目名,价格

```bash
select goods_name,cat_name,shop_price from 
ecs_goods left join ecs_category
on ecs_goods.cat_id=ecs_category.cat_id
where ecs_goods.cat_id = 4;
```


#### 3.5.3 取出第4个栏目下的商品的商品名,栏目名,与品牌名

连接可以串联，一个 `left join ... on` 接一个，每接一次就把结果集横向拓宽一次。三张表以上的连接读起来会有点绕，我的办法是从左往右一次只看一对表。

```bash
select goods_name,cat_name,brand_name from 
ecs_goods left join ecs_category
on ecs_goods.cat_id=ecs_category.cat_id
left join ecs_brand 
on ecs_goods.brand_id=ecs_brand.brand_id
where ecs_goods.cat_id = 4;
```

连接性能上有一条铁律，`on` 后面用到的列必须有索引。缺了索引，数据库只能对每一行去另一张表全表扫一遍，两张十万行的表连起来就是天文数字。查询慢的时候第一件事就是 `explain` 看看有没有走上索引。

#### 3.5.4 面试题

这道题实际考的是自连接，也就是同一张表连接自己两次。

根据给出的表结构按要求写出 `SQL` 语句。

**Match 赛程表**

|字段名称|	字段类型|	描述|
|---|---|---|
|`matchID`	|`int`|	主键|
|`hostTeamID`|	`int`|	主队的`ID`|
|`guestTeamID`|	`int`|	客队的`ID`|
|`matchResult`|	`varchar(20)`|	比赛结果，如（`2:0`）|
|`matchTime` | `date` |	比赛开始时间|


**Team 参赛队伍表**

|字段名称|	字段类型|	描述|
|---|---|---|
|`teamID`|	`int`|主键|
|`teamName`	|`varchar(20)`|	队伍名称|

`Match` 的 `hostTeamID` 与 `guestTeamID` 都与 `Team` 中的 `teamID` 关联。要求查出 `2006-6-1` 到 `2006-7-1` 之间举行的所有比赛，用「拜仁 2:0 不来梅 2006-6-21」这样的形式列出。

难点在于一行比赛记录里有两个队伍 id，都要换成队名。一次 `join` 只能换一个，所以得把 `Team` 表连接两次，用不同的别名区分。先看两张表的原始数据。

```bash
mysql> select * from m;
```


```
+-----+------+------+------+------------+
| mid | hid  | gid  | mres | matime     |
+-----+------+------+------+------------+
|   1 |    1 |    2 | 2:0  | 2006-05-21 |
|   2 |    2 |    3 | 1:2  | 2006-06-21 |
|   3 |    3 |    1 | 2:5  | 2006-06-25 |
|   4 |    2 |    1 | 3:2  | 2006-07-21 |
+-----+------+------+------+------------+
4 rows in set (0.00 sec)
```


```bash
mysql> select * from t;
```

```
+------+----------+
| tid  | tname    |
+------+----------+
|    1 | 国安     |
|    2 | 申花     |
|    3 | 公益联队 |
+------+----------+
3 rows in set (0.00 sec)
```

关键写法是 `t as t1` 和 `t as t2`，同一张表起两个别名，对数据库来说就成了两张独立的表，各连各的。

```bash
mysql> select hid,t1.tname as hname ,mres,gid,t2.tname as gname,matime
    -> from 
    -> m left join t as t1
    -> on m.hid = t1.tid
    -> left join t as t2
    -> on m.gid = t2.tid;
```

```
+------+----------+------+------+----------+------------+
| hid  | hname    | mres | gid  | gname    | matime     |
+------+----------+------+------+----------+------------+
|    1 | 国安     | 2:0  |    2 | 申花     | 2006-05-21 |
|    2 | 申花     | 1:2  |    3 | 公益联队 | 2006-06-21 |
|    3 | 公益联队 | 2:5  |    1 | 国安     | 2006-06-25 |
|    2 | 申花     | 3:2  |    1 | 国安     | 2006-07-21 |
+------+----------+------+------+----------+------------+
4 rows in set (0.00 sec)
```

上面这条还差最后一步，题目要求的是 6 月 1 日到 7 月 1 日之间的比赛，所以还得补一句 `where matime between '2006-06-01' and '2006-07-01'`。原文这里只做到了连接，筛选留给读者自己补。

### 3.6、union查询

连接是横向拼接，把两张表的列并到一行；`union` 是纵向拼接，把两个结果集的行摞在一起。

- 把`ecs_comment`,`ecs_feedback`两个表中的数据,各取出`4`列,并把结果集`union`成一个结果集

```
A表:
+------+------+
| id   | num  |
+------+------+
| a    |    5 |
| b    |   10 |
| c    |   15 |
| d    |   10 |
+------+------+
```

```
B表:
+------+------+
| id   | num  |
+------+------+
| b    |    5 |
| c    |   15 |
| d    |   20 |
| e    |   99 |
+------+------+
```

要求查询出以下效果:

```
+------+----------+
| id   |    num   |
+------+----------+
| a    |        5 |
| b    |       15 |
| c    |       30 |
| d    |       30 |
| e    |       99 |
+------+----------+
```

```bash
create table a (
id char(1),
num int
) engine myisam charset utf8;

insert into a values ('a',5),('b',10),('c',15),('d',10);

create table b (
id char(1),
num int
) engine myisam charset utf8;

insert into b values ('b',5),('c',15),('d',20),('e',99);
```

先把两张表原样摞起来看看效果。原文这里的表名写成了 `ta` 和 `tb`，和上面建的 `a`、`b` 对不上，直接跑会报表不存在，这里已经改成一致的。

```bash
mysql> # 合并 ,注意all的作用
mysql> select * from a 
    -> union all
    -> select * from b;
```

```
+------+------+
| id   | num  |
+------+------+
| a    |    5 |
| b    |   10 |
| c    |   15 |
| d    |   10 |
| b    |    5 |
| c    |   15 |
| d    |   20 |
| e    |   99 |
+------+------+
```


**参考答案:**

思路是先 `union all` 摞成一张临时表，再对这张临时表按 `id` 分组求和。这里必须用 `union all` 不能用 `union`，因为 `union` 会去重，`b` 表里那条和 `a` 表完全相同的行会被合掉，求和结果就少了。

```bash
mysql> # sum,group求和
mysql> select id,sum(num) from (select * from a union all select * from b) as tmp group by id; 
```

```
+------+----------+
| id   | sum(num) |
+------+----------+
| a    |        5 |
| b    |       15 |
| c    |       30 |
| d    |       30 |
| e    |       99 |
+------+----------+
5 rows in set (0.00 sec)
```

### 3.7、子查询:

子查询的几种类型这里各来一个例子。

**查询出最新一行商品(以商品编号最大为最新,用子查询实现)**

```bash
select goods_id,goods_name from 
     ecs_goods where goods_id =(select max(goods_id) from ecs_goods);
```


- 查询出编号为`19`的商品的栏目名称(用左连接查询和子查询分别)
- 用`where`型子查询把`ecs_goods`表中的每个栏目下面最新的商品取出来


```bash
select goods_id,goods_name,cat_id from ecs_goods where goods_id in (select max(goods_id) from ecs_goods group by cat_id);
```


**用from型子查询把ecs_goods表中的每个栏目下面最新的商品取出来**


```bash
select * from (select goods_id,cat_id,goods_name from ecs_goods order by goods_id desc) as t group by cat_id;
```

这条得重点提醒一下，它在今天多半跑不通。它依赖的是「先在子查询里排好序，外层 group by 取每组第一条」这个行为，而这个行为从来就不是 SQL 标准保证的。MySQL 5.7 之后默认开启 `ONLY_FULL_GROUP_BY`，这条语句会直接报错；就算关掉这个模式，优化器也可能把子查询合并掉，子查询里的 `order by` 被丢弃，结果就变成随机的了。

正确做法还是上一条那种 `where ... in (select max(...) group by ...)` 的写法，或者用 MySQL 8 的窗口函数 `row_number() over (partition by cat_id order by goods_id desc)` 打个序号再筛。这类「取每组最新一条」的需求在业务里极其常见，值得专门记一下。

**用exists型子查询,查出所有有商品的栏目**

`exists` 只关心子查询有没有返回行，不关心返回的内容，所以里面写 `select *` 还是 `select 1` 都一样。它和 `in` 的区别是，`exists` 是关联子查询，外层每一行都会去执行一次内层，适合外层结果集小、内层有索引的场景。

```bash
select * from category
where exists (select * from goods where goods.cat_id=category.cat_id);
```

**创建触发器:**

这三个触发器合起来是一个完整的库存联动逻辑。下单时扣库存，删单时加回来，改单时按差额调整。

```bash
CREATE  trigger tg2
after insert on ord
for each row
update goods set goods_number=goods_number-new.num where id=new.gid

CREATE trigger tg3
after delete on ord
for each row
update goods set goods_number=goods_number+old.num where id=old.gid


CREATE  trigger tg4
after update on ord
for each row
update goods set goods_number=goods_number+old.num-new.num where id=old.gid
```

原文 `tg3` 里写的是 `good_number`，少了一个 s，这里已经改正。触发器里的这类拼写错误特别阴险，因为它在建触发器的时候未必报错，等到真的插入数据时才炸，而且报错信息指向的是那条 insert 语句，第一眼根本想不到是触发器的问题。

`tg4` 这个用 `old.num - new.num` 算差额的写法很聪明，一条语句同时覆盖了加量和减量两种情况。不过实际项目里我还是更倾向把库存扣减放在应用层的事务里，理由前面说过，藏在数据库里的逻辑维护成本太高。

## 四、常用表管理语句

这一节纯速查，是我当年贴在显示器边上的那张清单。命令都很短，但真到要用的时候想不起来就很卡。

- 设置字符编码 `set names gbk;`
- 查看所有数据库：`show databases;`
- 查看所有表：`show tables`
- 查看表结构：`desc 表名/视图名`
- 选择表 `use 表名;`
- 查看建表过程：`show  create table  表名`
- 查看建视图过程：`show create view 视图`
- 查看所有详细表信息：`show table status\G(让结果显示好看一些)`
- 查看某张表详细信息：`show table status where name='goods（表名）'\G`
- 删除表：`drop table 表名`
- 删除视图：`drop view 视图名；`
- 删除列：`alter table drop column 指定列`
- 改表名：`rename table oldName to newName`
- 更新表：`update 表名 set 字段`
- 插入数据：`insert into 表名 value()`
- 清空数据：`truncate 表名;(相当于删除表在重建)`
- 写错语句退出:`\c`
- 让结果显示好看一些:`\G`

最后两个不太起眼但特别实用。语句敲到一半发现写错了，不用一路删回去，敲 `\c` 直接放弃这条。查询结果列太多在终端里横向折行糊成一团时，把结尾的分号换成 `\G`，它会把每一行竖着排开，一个字段一行，看宽表的时候救命。

## 五、增删改查语句速查

前面第二章讲的是语法，这一章补的是使用时的注意事项，两边有一点重叠，但视角不同。

### 5.1 insert

- `insert into 表名` 插入的列与值要严格对应，顺序和数量都得一致
- 数字不必加单引号，字符串必须加单引号
- 例子：`insert into test(age,name)values(10,'小明');`

	
### 5.2 update操作

```js
// 例子：
update user set age=8 where name='lianying';
//（注意where条件不加会影响所有行，需要小心）
```

原文这里的 `name=lianying` 少了引号，MySQL 会把它当成列名去找，报「未知列」。字符串必须加单引号这条规则，写起来简单，实际却是新手最常犯的错误之一，因为报错信息说的是「列不存在」，很容易往表结构上想。

### 5.3 delete操作

- 删除的最小单位是行，没法只删某一列的值，那个叫更新不叫删除
- `delete from 表名 where 条件`
- `delete from user where uid=1;`，必须加上条件，否则整表数据都会被删掉

原文这两条里的「添加」是「条件」的笔误，已经改过来了。

### 5.4 select查找

- `select * from 表名`，全部查出
- `select uid,name from user where uid>10;`
- `select * from user where uid=11;`


### 5.5 select查询模型（重要）

这一小节虽然短，但它是理解 SQL 的一把钥匙。

`select * from 表名 where 1` 这个写法能跑，因为 `where` 后面跟的是一个表达式，表达式为真就取出这一行，为假就跳过。常数 1 恒为真，所以等价于不加条件。很多框架拼 SQL 时喜欢先写 `where 1=1`，后面的条件一律用 `and` 接，就是利用了这个特性，省掉判断「我是不是第一个条件」的麻烦。

再往前一步，把列看成变量，既然是变量就能参与运算，这个过程叫广义投影。取出两列相减、把列丢进函数里加工，本质都是这回事。3.3 节算差价、3.3.7 用 `sum(score < 60)` 数挂科门数，靠的都是这个思路。想通这一层，SQL 从「查询语言」变成了「能算东西的语言」。

查 `NULL` 要用 `select * from test where name is null` 或者 `is not null`，这个前面强调过，用 `=` 是查不出来的。

	
### 5.6 limit用法（做分页类能用到）

`limit` 限制取出的条目数，有两个参数，前面是偏移量，后面是取几条。

```bash
select goods_id,goods_name,shop_price
	-> from goods
	-> order by shop_price desc
	-> limit  0,3;
```


### 5.7 子句的查询陷阱

这五个子句有严格的书写顺序，`where`、`group by`、`having`、`order by`、`limit`，不能颠倒。写反了不是结果不对，是直接语法报错。

顺带把执行顺序也放在一起对比。书写顺序是 `select` 打头，执行顺序却是 `from` 打头，接着 `where`、`group by`、`having`，然后才轮到 `select`，最后是 `order by` 和 `limit`。3.3.5 那道题里「为什么 having 能用别名而 where 不能」，答案就藏在这个差异里。
		
		
```bash
# 例子:语句有严格的顺序
mysql> select id,sum(num) 
					-> from
					-> (select * from a union select * from b) as temp
					-> group by id
					-> having sum(num)>10
					-> order by sum(num) desc
					-> limit 0,1;
```
		
	
### 5.8 子查询
	
**where 型子查询，内层的查询结果作为外层的比较条件**

对比静态和动态两种写法，能很直观看出子查询解决了什么问题。
	
- 静态的：`select goods_id,goods_name from goods where goods_id=32;`
- 动态的：`select goods_id,goods_name from goods where goods_id=(select max(goods_id) from goods);`

静态写法里的 32 是你先查了一遍再手填进去的，数据一变就得重填。动态写法把这个「先查一遍」的动作直接嵌进 SQL，一条语句自洽。
		
```bash
#取出每个栏目下最新的商品：
select goods_id,cat_id,goods_name from goods where goods_id in (select max(goods_id) from goods group by cat_id);
```
	
### 5.9 from子查询

内层查询的结果被当成一张临时表，外层再对它查一次。

```bash
#每个栏目下最新的商品：
		mysql> select goods_id,goods_name from (select * from goods where 1 order by cat_id desc) as tmp
			-> group by cat_id;
```

跟 3.7 节那条一样，这个写法在开了 `ONLY_FULL_GROUP_BY` 的新版本上会报错，别直接搬到生产用。

### 5.10 exists子查询
	
```bash
#查询栏目下是否有商品
		mysql> select * from category
			-> where exists(select * from goods where goods.cat_id=category.cat_id)
```
	
注意内层的 `where` 里引用了外层的 `category.cat_id`，这叫关联子查询。它的执行方式是外层每取一行就把这一行的值代进内层跑一次，所以外层结果集大的时候要格外注意性能。
	
### 5.11 内连接查询（重要）

内连接的结果是左连接和右连接的交集，只保留两边都匹配上的行。

```bash
select xxx from
			table1 inner join table2 on table1.xx=table2.xx
			
		
mysql> select boy.hid,boy.bname,girl.hid,girl.gname
			-> from
			-> boy inner join girl on boy.hid=girl.hid;
```

原文这里把 `inner join` 写成了 `inner jion`，字母顺序颠倒了，已修正。
		

### 5.12 左连接特点

以左表的数据为准，拿左表每一行去找右表，找不到的位置填 `NULL`。这是它和内连接唯一但关键的区别。
		
```bash
#左连接
mysql> select boy.hid,boy.bname,girl.hid,girl.gname
	-> from
	-> boy left join girl on boy.hid=girl.hid;

#右连接
mysql> select boy.hid,boy.bname,girl.hid,girl.gname
-> from
-> boy right join girl on boy.hid=girl.hid;


mysql> select goods_id,cat_name,goods_name,shop_price
	-> from
	-> goods left join category on goods.cat_id= category.cat_id
	-> where goods.cat_id=4;
```
			

### 5.13 union查询

把 2 条或多条查询的结果合并成 1 个结果集。


- `sql1 N行`
- `sql2 M行`
- `sql1 union sql2，N+M行`

用 `union` 有几条规则要记住：

- 各条语句取出的列数必须相同，列的类型也要能兼容，否则直接报错
- 子句里一般不写 `order by`，因为合并之后得到的是总结果集，各分支自己排的序没有意义。要排就在最外层整体排一次
- 典型场景是两条语句各自的 `where` 都很复杂，拆成两条简单条件再 `union` 起来，可读性比一个巨大的 `or` 表达式好得多
- `union` 会把完全相同的行合并掉，去重是个耗时操作。不需要去重就用 `union all`，速度提升很明显

```bash
mysql> select * from a
	-> union all #union all 可以避免重复语句合并
	-> select * from b;

mysql> select goods_id,cat_id,goods_name,shop_price from goods where cat_id=2
	-> union
	-> select goods_id,cat_id,goods_name,shop_price from goods where cat_id=4;
```			


## 六、建表与列类型深入

这一章是第二章 4 节的展开版，把每类列的取舍讲透。建表这一步花的时间，回报周期特别长。

```bash
create table 表名 （
	列1 列类型 [列属性 默认值]
	列2 列类型 [列属性 默认值]
	...
	);
	engine = 存储引擎
	chartset = 字符集
```
		
建表就是声明表头的过程，说到底就是声明列。每一列要决定两件事，选什么类型，给什么属性。
	
- 选择合理的列类型和列宽度，既能放下内容又不浪费磁盘空间
- 数值型分整型、浮点型、定点型三类
- 字符串型主要是 `char`、`varchar`、`text`
- 日期时间类型形如 `2012-12-13 14:25:36`


### 6.1 整型列

|类型   |     字节    |  有符号最小值         |         无符号最大值|
|---|---|---|---|
|`bigint`|     `8`字节|        `-9223372036854775808`	|	`18446744073709551615`|
|`int`|        `4`字节	|	   `-2147483648`          |   `4294967295`|
|`mediumint`|  `3`字节	|	   `-8388608`                | `16777215`|
|`smallint`|   `2`字节  |      `-32768`                 |  `65535`|
|`tinyint `|   `1`字节  |      `-128`                    | `255`|

这张表得解释一下口径，原文那版把有符号的最小值和无符号的最大值混在一起，容易看晕，而且 `mediumint` 的最大值写成了有符号的 `8388607`，`smallint` 的 `32767` 被反引号截断成了乱码。这里统一成「有符号下限」和「无符号上限」两列，`mediumint` 和 `tinyint` 的无符号上限也补正了。要记有符号的上限也简单，就是无符号上限减一再除以二。原文的 `mediunint` 拼写也已改成 `mediumint`。

选型上有个实用建议，主键 id 用 `int unsigned` 能撑到 42 亿，绝大多数业务够用；预计会超的直接上 `bigint`，别等到快溢出了再改，改主键类型在大表上是一场硬仗。
		
整型列有两个可选参数。
		
- `unsigned` 无符号，列的值从 0 开始不能为负
- `zerofill` 配合宽度，适合学号、编码这类固定宽度的数字，不足位用 0 补齐，比如学号 1 显示成 0001
- 注意，加了 `zerofill` 会自动带上 `unsigned`，这两个属性是绑定的

原文说「zerofill 属性默认决定是 unsigned」，意思对但表述含糊，实际就是加了 `zerofill` 之后 MySQL 会自动给这一列加上 `unsigned`。


### 6.2 浮点列与定点列
		

- `float(M,D)` 里 `M` 是总位数，`D` 是小数点后的位数
- `float` 和 `double` 是浮点型，存储有精度损失
- `decimal` 是定点型，精确存储

再强调一次，涉及钱的字段一律用 `decimal`。浮点数的精度损失不是概率问题，是必然的，只是小到平时看不出来。等到几十万条记录求和之后对不上账，再回头改字段类型就晚了。
			

		
### 6.3 字符型列


- `char(M)` 比如 `char(10)` 只能存 10 个字符
- `char` 型如果不够 M 个字符，内部会用空格补齐，取出时再把右侧空格删掉
	- 注意这里有个副作用，你自己存进去的右侧空格也会一起丢掉
- `varchar(M)` 用多少占多少，自动扩展
- `varchar` 不会丢失空格
- 速度上定长 `char` 快一些，在一定范围内定长寻址更直接
- `M` 比较短，20 个以内的一般用 `char`
- `text` 存大段文本
- `blob` 是二进制类型，用来存图像、音频这类二进制信息
  - `blob` 的意义在于避开字符集转换，防止信息在编码转换中损坏
- `enum` 枚举类型，值只能是预先定义好的那几个之一
  - 比如 `gender enum('男','女')`，插入时只能选其中之一

原文这里 `enum` 被写成了 `emum`，已修正。

关于 `enum` 我的态度比较保留。它省空间、有约束，听起来很美，但改枚举值要 `alter table`，在大表上是个重操作，而且不同语言的驱动对它的支持参差不齐。可选值稳定的场景可以用，会变的还是老老实实用 `tinyint` 加一张字典表。

`text` 和 `blob` 还有一点要注意，它们不能有默认值，而且在有些场景下会单独存储、影响查询性能。大字段能拆到单独的表里就拆出去，主表保持紧凑。
						  

				  
### 6.4 日期时间类型


- `year` 存年份
- `date` 存年月日，比如 `2016-12-18`
- `time` 存时分秒
- `datetime` 存年月日时分秒

原文 `date` 那一条的示例写成了 `2016-18`，缺了月份，这里补成了完整格式。

			
```bash
mysql> create table t8(
	-> ya year,
	-> dt date,
	-> tm time,
	-> dttm datetime);
	-> insert into t8 (ya,dt,tm) values(2015,'2015-12-18','18:28:36');
```


### 6.5 列的默认值
	
- `NULL` 查询不方便，必须用 `is null` 而不能用等号
- `NULL` 参与运算的结果还是 `NULL`，一列里混进一个 `NULL`，`sum` 之外的很多计算就会出意外
- 实际中尽量避免列的值为 `NULL`

避免的方法就是建表时声明 `NOT NULL` 并给一个 `default` 默认值。数字列默认 0，字符串列默认空串，这样应用层拿到的永远是一个可用的值，不用到处判空。

这条建议我执行得比较彻底，几乎所有列都会加上 `not null default`。唯一的例外是那种「有值和没值语义不同」的字段，比如「审核时间」，没审核过就该是 `NULL` 而不是 `1970-01-01`。这种情况下 `NULL` 是在表达真实的业务含义，那就该留着。

	
```bash
mysql> create table t10(
		-> id int not null default 0,
		-> name char(10) not null default ''
		-> );
```

					
### 6.6 主键与自增

- 主键 `primary key` 的值不重复，能唯一区分每一行
- `primary key` 和 `auto_increment` 一般成对出现
- 注意一张表只能有一列是 `auto_increment`，而且这一列必须加索引

关于主键选什么，InnoDB 里有个不太直观的点值得知道。InnoDB 的数据是按主键顺序物理组织的，所以主键最好是单调递增的，比如自增 id。用随机的 UUID 当主键，插入时会不断在中间位置插数据导致页分裂，写性能明显下降，索引也更占空间。业务上确实需要 UUID，可以留一个自增 id 当主键，UUID 单独建唯一索引。

表结构层面还有几条优化经验：

  - 定长的 `char` 列和变长的 `varchar` 列分离到不同的表
  - 常用列和不常用列分离，主表保持窄，查询时读取的页更少
  - 这两条都能提高查询效率，代价是要多一次连接，权衡着来


### 6.7 列的删除与增加（列的增删改）

- `alter table 表名 add 列名 列类型 列属性`，新列默认加在表的最后
- `alter table 表名 drop column 指定列`，删除列
- `alter table 表名 add 列名 列类型 列属性 after 指定列`，插到指定列的后面
- `alter table 表名 change 旧列名 新列名 列类型`，比如把 `height` 改名成 `shengao` 并改成 `smallint`
- `alter table 表名 modify 列名 新类型和属性`，只改属性不改名

删列这个操作要格外谨慎，数据没了就是没了，没有撤销。线上删列的标准流程是先在代码里停止使用，观察一段时间确认没有遗漏的引用，再执行删除，中间最好留一份备份。

### 6.8 视图（存储的是语句）

`view` 被称为虚拟表，它存的不是数据而是一条 SQL 语句。查视图的时候数据库现去查底层的物理表，所以物理表一变，视图看到的结果也跟着变。

**1. view好处**

- 权限控制
  - 比如一张表里有几列敏感数据，只想开放其中几列给某个用户
  - 建一个只包含那几列的视图，把视图的权限给他，物理表不给
- 简化复杂的查询，把一坨三表连接封装成一个视图，业务查询就变成 `select * from 视图`
- 视图能不能更新要看情况
  - 视图的每一行和物理表一一对应的可以更新
  - 视图的行是由物理表多行计算得来的，比如带了聚合函数，那就不能更新
				

**2. 视图的algorithm**
			
- 对于简单查询形成的视图，查视图时带上 `order by`、`where` 这些条件
- 数据库可以把建视图的语句和查视图的语句合并成一条直接查物理表的语句
- 这种视图算法叫 `MERGE` 合并算法，另一种叫 `TEMPTABLE`，会先把视图结果物化成临时表

原文这里写的是「merger」，MySQL 里的正式名称是 `MERGE`。两种算法的性能差别很大，`MERGE` 能把外层条件下推到底层表用上索引，`TEMPTABLE` 得先把整个视图结果算出来。带聚合、`distinct`、`union` 的视图只能用 `TEMPTABLE`，这也是复杂视图容易慢的原因。

			
### 6.9 引擎的概念

- MySQL 从 5.5.5 开始默认引擎就是 `InnoDB` 了，建表时一般还是显式写出来更清楚
- `MyISAM` 引擎的数据文件可以直接拷贝到别的机器上用
- `InnoDB` 的数据在共享表空间或者独立表空间里，迁移要走正规的导出导入

原文写的是「mysql 5.0 以上默认引擎是 innoDB」，这个版本号不准确，5.0 和 5.1 的默认引擎还是 MyISAM，切换发生在 5.5.5。

`MyISAM` 和 `InnoDB` 的对比：
		
|对比项 | MyISAM   |  InnoDB |
|---|---|---|
|批量插入的速度|  高   |       相对低|
|存储上限|	 没有硬性限制   |     `64TB`|
|锁粒度| 表级锁 | 行级锁 |
|事务与崩溃恢复| 不支持 | 支持 |
|外键| 不支持 | 支持 |

原文这张表的表头只有两列而数据行有三列，Markdown 渲染出来是错位的，这里补成了三列并多加了两行关键差异。结论前面说过，新项目直接 InnoDB，别犹豫。

		
### 6.10 字符集与乱码问题

- 涉及三个概念，字符集、校对集也就是排序规则、以及乱码
- 乱码的成因就一条，文字本来的字符集和解读时用的字符集不一致
- 客户端编码设置 `set names gbk/utf8;`
- 建表时设置 `create table ()charset utf8;`
- 服务器端 `utf8/gbk` 都可以，但整条链路要统一
- 网页端在 HTML 里声明 `<meta charset="utf-8">`

原文最后一条写成了 `mate:charset=utf8;`，`mate` 是 `meta` 的笔误，写法也不是合法的 HTML，这里改成了标准形式。

校对集这个概念容易被忽略，它决定字符串怎么比较和排序。比如 `utf8mb4_general_ci` 里的 `ci` 表示大小写不敏感，所以 `'ABC' = 'abc'` 在这个校对集下是成立的。要区分大小写得选 `_bin` 或者 `_cs` 结尾的校对集。查重逻辑对大小写有要求的话，这个坑一定要提前想到。

再补一次 MySQL 8 的变化，默认字符集从 `latin1` 变成了 `utf8mb4`，默认校对集也换成了 `utf8mb4_0900_ai_ci`。新库基本不用再手动指定字符集了，但跨版本迁移时两边校对集不一致会导致连表查询用不上索引，这个坑很隐蔽。

### 6.11 索引

- 索引是数据的目录，能快速定位到行数据的位置
- 索引提高查询速度，同时降低增删改的速度，所以并非越多越好
- 一般在查询频繁的列上加，而且在重复度低的列上效果最好
- `key` 普通索引
- `unique key` 唯一键
- `primary key` 主键索引
- 索引长度，建索引时可以只索引列的前一部分，比如前十个字符 `key email(email(10))`，能显著减小索引体积
- 多列索引，把 2 列或多列的值看成一个整体建索引
- 冗余索引，同一个列上存在多个索引，属于浪费，应该清理

多列索引这里有条必须知道的规则，叫最左前缀。给 `(a, b, c)` 建了联合索引，查询条件里有 `a`、有 `a` 和 `b`、有 `a` 和 `b` 和 `c` 都能用上，但只有 `b` 或者只有 `c` 是用不上的。所以联合索引里列的顺序不是随便排的，要把最常单独查询的列放在最左边。这条规则我见过太多人栽跟头，建了索引却发现查询还是慢，`explain` 一看压根没走。

判断索引有没有生效，唯一可靠的办法是在语句前面加 `explain`，看 `key` 那一列是不是你期望的索引、`rows` 估算扫了多少行。凭感觉猜是猜不准的。

### 6.12 索引操作

- 查看索引：`show index from goods\G`
- 删除索引：`alter table 表名 drop index 索引名`
  - 或者：`drop index 索引名 on 表名`
- 添加：`alter table 表名 add [index \unqiue]索引名(列名)`
- 添加主键索引：`alter table 表名 add primary key 列名`
- 删除主键索引：`alter table 表名 drop primary key`

`show index from 表名\G` 这条值得多用，它会列出这张表所有索引的名字、包含哪些列、列的顺序、以及 `Cardinality` 也就是基数估计值。基数越接近总行数，说明这个索引选择性越好。接手一张陌生的表，我一般先跑 `show create table` 看结构，再跑 `show index` 看索引，心里就有底了。

## 七、常用函数

这一章是纯速查表，按用途分了八组。函数不用背，知道有这么个东西、大概叫什么名字，用的时候查一下就行。

### 7.1 数学函数

- `abs(x)`   返回x的绝对值
- `bin(x)`   返回x的二进制（oct返回八进制，hex返回十六进制）
- `ceiling(x)`   返回大于x的最小整数值
- `exp(x)`   返回值`e`（自然对数的底）的`x`次方
- `floor(x)`   返回小于`x`的最大整数值
- `greatest(x1,x2,...,xn)`返回集合中最大的值
- `least(x1,x2,...,xn)`      返回集合中最小的值
- `ln(x)`                    返回x的自然对数
- `log(x,y)`返回`x`的以`y`为底的对数
- `mod(x,y)`                 返回x/y的模（余数）
- `pi()`返回`pi`的值（圆周率）
- `rand()`返回 `0` 到 `1` 内的随机值,可以通过提供一个参数(种子)使`rand()`随机数生成器生成一个指定的值。
- `round(x,y)`返回参数`x`的四舍五入的有`y`位小数的值
- `sign(x) `返回代表数字`x`的符号的值
- `sqrt(x) `返回一个数的平方根
- `truncate(x,y)`            返回数字`x`截短为`y`位小数的结果

`round` 和 `truncate` 的区别是前者四舍五入、后者直接截断，算金额时选错会有几分钱的差异，看着小，对账时是硬伤。另外 `order by rand()` 这个随机取数据的写法虽然常见，但它要给全表每行生成随机数再排序，大表上极慢，数据量上来了得换别的方案。

### 7.2 聚合函数(常用于group by从句的select查询中)

- `avg(col)`返回指定列的平均值
- `count(col)`返回指定列中非`null`值的个数
- `min(col)`返回指定列的最小值
- `max(col)`返回指定列的最大值
- `sum(col)`返回指定列的所有值之和
- `group_concat(col) `返回由属于一组的列值连接组合而成的结果

`group_concat` 是这几个里最容易被忽略的，它能把一组的多行值拼成一个字符串，做「每个栏目下的商品名列表」这类需求一句就够。用它有个坑，结果长度受 `group_concat_max_len` 限制，默认值不大，超了会被静默截断，不报错。数据一多你会发现列表莫名其妙少了后半截。

### 7.3 字符串函数

- `ascii(char)`返回字符的`ascii`码值
- `bit_length(str)`返回字符串的比特长度
- `concat(s1,s2...,sn)`将s`1,s2...,sn`连接成字符串
- `concat_ws(sep,s1,s2...,sn)`将`s1,s2...,sn`连接成字符串，并用`sep`字符间隔
- `insert(str,x,y,instr)`将字符串`str`从第`x`位置开始，`y`个字符长的子串替换为字符串`instr`，返回结果
- `find_in_set(str,list)`分析逗号分隔的`list`列表，如果发现`str`，返回`str`在`list`中的位置
- `lcase(str)`或`lower(str)` 返回将字符串`str`中所有字符改变为小写后的结果
- `left(str,x)`返回字符串`str`中最左边的`x`个字符
- `length(str)`返回字符串`str`占用的字节数
- `char_length(str)`返回字符串`str`中的字符数
- `ltrim(str)` 从字符串`str`中切掉开头的空格
- `position(substr,str)` 返回子串`substr`在字符串`str`中第一次出现的位置
- `quote(str)` 用反斜杠转义`str`中的单引号
- `repeat(str,x)`返回字符串`str`重复`x`次的结果
- `replace(str,srchstr,rplcstr)`把`str`中的`srchstr`全部替换成`rplcstr`
- `reverse(str)` 返回颠倒字符串`str`的结果
- `right(str,x)` 返回字符串`str`中最右边的`x`个字符
- `rtrim(str)` 去掉字符串`str`尾部的空格
- `strcmp(s1,s2)`比较字符串`s1`和`s2`
- `trim(str)`去除字符串首部和尾部的所有空格
- `ucase(str)`或`upper(str)` 返回将字符串`str`中所有字符转变为大写后的结果

这一组原文里有几处错误，一并说明。`length()` 返回的是字节数不是字符数，一个中文在 utf8 下占三个字节，所以 `length('中文')` 是 6 不是 2，要数字符得用 `char_length()`，这两个混用是很常见的 bug 来源，上面已经补全并区分开。`repeat` 的参数被误写成了 `replace` 的参数列表，两个函数已经拆开各归各位。`rtrim` 的说明原文写成了「返回尾部的空格」，实际是去掉尾部空格，也已改正。另外 `reverse`、`right`、`rtrim` 三条的反引号缺了配对，渲染出来是乱的，也一并修好了。

### 7.4 日期和时间函数

- `curdate()`或`current_date()` 返回当前的日期
- `curtime()`或`current_time()` 返回当前的时间
- `date_add(date,interval int - keyword)`返回日期`date`加上间隔时间`int`的结果(`int`必须按照关键字进行格式化),如：`selectdate_add(current_date,interval 6 month);`
- `date_format(date,fmt)`  依照指定的`fmt`格式格式化日期`date`值
- `date_sub(date,interval int - keyword)`返回日期`date`加上间隔时间`int`的结果(`int`必须按照关键字进行格式化),如：`selectdate_sub(current_date,interval 6 month);`
- `dayofweek(date) `  返回date所代表的一星期中的第几天(`1~7`)
- `dayofmonth(date)`  返回date是一个月的第几天(`1~31`)
- `dayofyear(date) `  返回date是一年的第几天(`1~366`)
- `dayname(date)  ` 返回date的星期名，如：`select dayname(current_date);`
- `from_unixtime(ts,fmt) ` 根据指定的`fmt`格式，格式化`unix`时间戳`ts`
- `hour(time) `  返回time的小时值`(0~23)`
- `minute(time) `  返回time的分钟值`(0~59)`
- `month(date) `  返回`date`的月份值`(1~12)`
- `monthname(date)  ` 返回`date`的月份名，如：`select monthname(current_date);`
- `now() `   返回当前的日期和时间
- `quarter(date) `  返回`date`在一年中的季度`(1~4)`，如 `select quarter(current_date);`
- `week(date)`   返回日期`date`为一年中第几周(`0~53`)
- `year(date)`   返回日期`date`的年份(`1000~9999`)

用日期函数有条实践上的忠告，别在 `where` 里对索引列套函数。像 `where year(add_time) = 2019` 这种写法会让索引失效，因为数据库没法拿函数的结果去查索引树，只能全表算一遍。正确写法是把条件改成范围，`where add_time >= '2019-01-01' and add_time < '2020-01-01'`，这样索引就用上了。这一条我见过的性能问题里占比很高。

**一些示例**

- 获取当前系统时间：


```bash
select from_unixtime(unix_timestamp());

select extract(year_month from current_date);

select extract(day_second from current_date);

select extract(hour_minute from current_date);
```

- 返回两个日期值之间的差值(月数)：

```bash
select period_diff(200302,199802);
```

- 在`mysql`中计算年龄：

```bash
select date_format(from_days(to_days(now())-to_days(birthday)),'%y')+0 as age from employee;
```

> 这样，如果`brithday`是未来的年月日的话，计算结果为`0`。

下面的`sql`语句计算员工的绝对年龄，即当`birthday`是未来的日期时，将得到负值

```bash
select date_format(now(), '%y') - date_format(birthday, '%y') -(date_format(now(), '00-%m-%d') <date_format(birthday, '00-%m-%d')) as age from employee
```

### 7.5 加密函数

先泼一盆冷水。这一组函数里有好几个在 MySQL 8 已经被移除了，包括 `encode`、`decode`、`encrypt` 和 `password`。就算你的库还是 5.x，也强烈建议别用它们存密码，`md5` 和 `sha1` 早就不适合做密码哈希了，它们太快，暴力破解成本极低。密码正确的做法是在应用层用 bcrypt、scrypt 或者 argon2 这类专门的慢哈希算法，加盐存储，数据库只负责存那串结果。这几个函数留在这里当历史资料看就行。

- `aes_encrypt(str,key)`  返回用密钥`key`对字符串`str`利用高级加密标准算法加密后的结果，调用`aes_encrypt`的结果是一个二进制字符串，以`blob`类型存储
- `aes_decrypt(str,key) ` 返回用密钥`key`对字符串`str`利用高级加密标准算法解密后的结果
- `decode(str,key) `  使用`key`作为密钥解密加密字符串`str`
- `encrypt(str,salt)`   使用`unixcrypt()`函数，用关键词`salt`(一个可以惟一确定口令的字符串，就像钥匙一样)加密字符串`str`
- `encode(str,key) `  使用key作为密钥加密字符串str，调用`encode()`的结果是一个二进制字符串，它以`blob`类型存储
- `md5() `   计算字符串`str`的`md5`校验和
- `password(str)`  返回字符串`str`的加密版本，这个加密过程是不可逆转的，和`unix`密码加密过程使用不同的算法。
- `sha()`  计算字符串`str`的安全散列算法(`sha`)校验和
		

```bash
# 示例：
select encrypt('root','salt');
select encode('xufeng','key');
select decode(encode('xufeng','key'),'key');#加解密放在一起
select aes_encrypt('root','key');
select aes_decrypt(aes_encrypt('root','key'),'key');
select md5('123456');
select sha('123456');
```


### 7.6 格式化函数

`inet_aton` 和 `inet_ntoa` 这一对值得单独说。存 IP 地址时，用 `int unsigned` 存它的数字形式比用 `varchar(15)` 存字符串省一半以上空间，而且能直接做范围比较，判断某个 IP 在不在某个网段里就是一次简单的区间查询。存进去之前用 `inet_aton` 转，取出来用 `inet_ntoa` 转回去。这个设计是真的舒服，只是现在 IPv6 场景下要换成 `inet6_aton` 那一对。

- `date_format(date,fmt)`  依照字符串`fmt`格式化日期`date`值
- `format(x,y) `  把`x`格式化为以逗号隔开的数字序列，`y`是结果的小数位数
- `inet_aton(ip) `  返回`ip`地址的数字表示
- `inet_ntoa(num)`   返回数字所代表的`ip`地址
- `time_format(time,fmt) ` 依照字符串`fmt`格式化时间`time`值
- 其中最简单的是`format()`函数，它可以把大的数值格式化为以逗号间隔的易读的序列。


```
# 示例：

select format(34234.34323432,3);

select date_format(now(),'%w,%d %m %y %r');

select date_format(now(),'%y-%m-%d');

select date_format(19990330,'%y-%m-%d');

select date_format(now(),'%h:%i %p');

select inet_aton('10.122.89.47');

select inet_ntoa(175790383);
```

### 7.7 类型转化函数

为了做数据类型转换，`mysql` 提供了 `cast()` 函数，可以把一个值转成指定类型，可选类型有 `binary`、`char`、`date`、`time`、`datetime`、`signed`、`unsigned`。原文这里的 `igned` 掉了首字母，正确写法是 `signed`。

显式转换用得不多，但知道它存在很重要，因为 MySQL 的隐式转换更常出事。比如一个 `varchar` 类型的列你拿数字去比较，`where phone = 13800138000`，MySQL 会把整列转成数字再比，索引直接失效，而且结果可能出乎意料。字符串列就用字符串条件，这条要成肌肉记忆。

```bash
# 示例：

select cast(now() as signed integer),curdate()+0;
select 'f'=binary 'f','f'=cast('f' as binary);
```

### 7.8 系统信息函数

这一组排查问题的时候用得上，尤其是 `database()` 和 `version()`。连了好几个环境的时候，先跑一句 `select database(), version(), user();` 确认自己现在在哪儿、是谁、什么版本，比凭记忆强。在生产库上执行任何写操作之前，我都会先跑这一句。

- `database() `  返回当前数据库名
- `benchmark(count,expr) ` 将表达式`expr`重复运行`count`次
- `connection_id()`   返回当前客户的连接`id`
- `found_rows()`   返回最后一个`select`查询进行检索的总行数
- `user()`或`system_user()`  返回当前登陆用户名
- `version()`   返回`mysql`服务器的版本


```bash
# 示例：

select database(),version(),user();

#该例中,mysql计算log(rand()*pi())表达式9999999次。
selectbenchmark(9999999,log(rand()*pi()));
```

## 八、MySQL 十条常用语句

这是我当年写在便签上的十条，闭着眼睛也得能敲出来的那种。把这十条串起来就是一条完整的最小路径，连库、建表、写数据、读数据、清空，一个都不少。

**1. 链接到数据库服务器**

```
mysql -h 地址 -u root -p 密码
```

**2. 查看所有库**

```
show databases;
```

**3. 选库**

```
use 库名
```

**4. 查看库下面的表**

```
show tables;
```

**5. 建表**

```
create table msg(
    id int auto_increment primary key,
    content varchar(200),
    pubtime int
)charset utf8;
```

原文这条有三处笔误，外面的花括号应该是圆括号，行尾的全角逗号应该是半角，`varcha` 少了个 r，照原样敲进去是跑不通的，这里都改正了。

**6. 告诉服务器你的字符集**

`set names gbk;` 或者 `set names utf8;`，原文的 `utg8` 是笔误。

**7. 添加数据**

```
insert into msg(id,content,pubtime) values(1,'哈哈哈哈',13445);
```

**8. 查询所有数据**

```
select * from msg;
```

**9. 按id查询**

```
select * from msg where id = 2;
```

原文这条漏了表名，`from` 后面直接跟了 `where`，已补上。

**10. 快速清空表**

```
truncate 表名
```


## 九、可视化管理数据

命令行熟练之后依然建议配一个可视化工具，看表结构、翻数据、导入导出比敲命令快太多。我的用法是查数据和改结构在 GUI 里，跑复杂查询和线上操作在命令行，两边各有各的场合。

- [navicat-for-mysql](https://www.navicat.com.cn/download/navicat-for-mysql)

Navicat 是收费的，如果只是自己学习，DBeaver、Sequel Ace 这类免费工具也够用，功能上没有本质差别。

这里提供一份数据表供学习使用，导入方式可以参考 [导入 sql 数据到 navicat](https://blog.csdn.net/qq_33699659/article/details/79261661) 这篇。

数据文件地址是 http://blog.poetries.top/sql/mysql-table.sql 。

## 总结

这篇梳理下来，我自己最大的收获是把几个「知道但没串起来」的点连上了。

第一个是 SQL 的执行顺序。`from` 到 `where` 到 `group by` 到 `having` 到 `select` 到 `order by` 到 `limit`，记住这条链，`where` 里为什么不能用别名、`having` 里为什么能用聚合函数、`where` 和 `having` 该选哪个，全都不用死记了。

第二个是把列当变量。`market_price - shop_price` 能直接放进 `select`，`score < 60` 的结果能被 `sum` 起来，`substring` 和 `concat` 能拼出新的列值。想通这层，SQL 就从查询语言变成了能算东西的语言，很多绕圈子的写法都能一句解决。

第三个是索引的边界。索引不是加了就快，选择性低的列加了没用，`like '%xx'` 用不上，`where` 里对列套函数用不上，隐式类型转换也会让它失效。判断的唯一可靠办法是 `explain`，别凭感觉。

最后说一下版本这件事。这份笔记是 MySQL 5.x 时代写的，MySQL 8 之后 `utf8mb4` 成了默认字符集、认证插件换了、`ONLY_FULL_GROUP_BY` 默认开启、一批老函数被移除，还多了窗口函数和递归 CTE 这些相当好用的新东西。文中那些老写法我都原样保留了，因为维护老库时它们还会出现，但你要写新代码，具体行为请以你所用版本的官方文档为准。

## 参考

- [MySQL 官方文档](https://dev.mysql.com/doc/)
- [MySQL 数据类型参考](https://dev.mysql.com/doc/refman/8.0/en/data-types.html)
- [MySQL 函数与操作符参考](https://dev.mysql.com/doc/refman/8.0/en/functions.html)
- [Navicat for MySQL 下载](https://www.navicat.com.cn/download/navicat-for-mysql)
- [导入 sql 数据到 navicat](https://blog.csdn.net/qq_33699659/article/details/79261661)
- [MongoDB 基础复习笔记](https://feinterview.poetries.top/blog/mongodb-review-1)
- [前端进阶之旅](https://interview.poetries.top)
