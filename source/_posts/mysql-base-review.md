---
title: Mysql基础复习
date: 2019-01-22 15:26:48
tags: Mysql
categories: DataBase
---


> 好久没用`sql`，都忘得干干净净，翻阅以前的学习笔记，觉得有些可记录的点，放在这里以便备用查阅

## 一、环境搭建

> `mac`安装`MySQL`

```
brew install mysql
```

![](https://poetries1.gitee.io/img-repo/2019/10/355.png)

```bash
# 启动

mysql.server start
```

```bash
#登录
mysql -uroot 
```

## 二、基础知识


### 1、数据库的连接

```bash
# 例子
mysql -u root -p 123456 -h 127.0.0.1 
```

- `-u` 用户名
- `-p` 密码
- `-h` `host`主机


### 2、库级知识

> 命令后面加上分号

- 显示数据库: `show databases;`
- 选择数据库: `use dbname;`
- 创建数据库: `create database dbname charset utf8;`
- 删除数据库: `drop database dbname;`


### 3、表级操作

#### 3.1 显示库下面的表

```bash
show tables;
```

#### 3.2 查看表的结构

```bash
desc tableName;
```

#### 3.3 查看表的创建过程: 

```bash
show create table  tableName;
```

#### 3.4 创建表

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

#### 3.5 修改表

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

**3.5.3	修改表之减少列**

```bash
alter table tbName drop 列名称;
```

**3.5.4	修改表之增加主键**

```bash
alter table tbName add primary key(主键所在列名);
```

> 例:`alter table goods add primary key(id)` 该例是把主键建立在`id`列上

**3.5.5	修改表之删除主键**

```bash
alter table tbName　drop primary key;
```

**3.5.6	修改表之增加索引**

```bash
alter table tbName add [unique|fulltext] index 索引名(列名);
```

**3.5.7	修改表之删除索引**

```bash
alter table tbName drop index 索引名;
```

**3.5.8	清空表的数据**

```bash
truncate tableName;
```

### 4、列类型讲解

#### 4.1 列类型

- `tinyint (0~255/-128~127) `
- `smallint (0~65535/-32768~32767) `
- `mediumint `
- `int` 
- `bigint`


**参数解释**

> `unsigned` 无符号(不能为负)  `zerofill 0`填充  `M` 填充后的宽度

- 举例:

```bash
tinyint unsigned;
tinyint(6) zerofill;   
```

#### 4.2 数值型

- 浮点型:`float` `double`
- 格式:`float(M,D)`  `unsigned\zerofill;`


#### 4.3 字符型

- `char(m)` 定长
- `varchar(m)`变长
- `text`

|列      |  实存字符i   |     实占空间    |        利用率|
|---|---|---|---|
|`char(M)`   |   `0<=i<=M`        |    `M `       |        `i/m<=100%`|
|`varchar(M) `  | `0<=i<=M `  |       `i+1,2`     |        `i/i+1/2<100%`|
    

#### 4.4 日期时间类型


- `year`       `YYYY`	范围:`1901~2155`. 可输入值`2`位和`4`位(如`98`,`2012`)
- `date`       `YYYY-MM-DD` 如:`2010-03-14`
- `time`       `HH:MM:SS`	如:`19:26:32`
- `datetime`   `YYYY-MM-DD`  `HH:MM:SS` 如:`2010-03-14 19:26:32`
- `timestamp`  `YYYY-MM-DD`  `HH:MM:SS` 

> 特性:不用赋值,该列会为自己赋当前的具体时间


### 5、增删改查基本操作

#### 5.1 插入数据 

```bash
insert into 表名(col1,col2,……) values(val1,val2……); # -- 插入指定列

insert into 表名 values (,,,,); # -- 插入所有列

insert into 表名 values	# -- 一次插入多行 
(val1,val2……),
(val1,val2……),
(val1,val2……);
```

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


#### 5.3 删除数据    

```bash
delete from tablenaeme where 条件;
```


#### 5.4 select 查询

1. 条件查询   `where`

- 条件表达式的意义，表达式为真，则该行取出
- 比较运算符  `=` ，`!=`，`< >` `<=` `>=`
- `like` , `not like` ('`%`'匹配任意多个字符,'`_`'匹配任意单个字符) `in`, `not in` , `between and`
- `is null` , `is not null`

2. 分组 `group by` 一般要配合`5`个聚合函数使用 `max`, `min`, `sum`, `avg`, `count`
3. 筛选`having`
4. 排序`order by`
5. 限制`limit`



### 6、连接查询

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


#### 6.3 内连接

```bash
inner join
```

- 左右连接都是以在左边的表的数据为准,沿着左表查右表.
- 内连接是以两张表都有的共同部分数据为准,也就是左右连接的数据之交集

### 7、子查询

> `where` 型子查询:内层`sql`的返回值在`where`后作为条件表达式的一部分

```bash
# 例句: select * from tableA where colA = (select colB from tableB where ...);
```


> `from` 型子查询:内层`sql`查询结果,作为一张表,供外层的`sql`语句再次查询
  
```bash
例句:select * from (select * from ...) as tableName where ....
```

### 8、字符集

- 客户端`sql`编码 `character_set_client`
- 服务器转化后的`sql`编码 `character_set_connection`
- 服务器返回给客户端的结果集编码`character_set_results`
- 快速把以上`3`个变量设为相同值: `set names` 字符集

**存储引擎 engine=1\2**

- `Myisam`  速度快 不支持事务 回滚
- `Innodb`  速度慢 支持事务,回滚
  
**事务**

- 开启事务  `start transaction`
- 运行`sql; `      
- 提交,同时生效\回滚 `commit\rollback`

**触发器**

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

- 删除触发器:

```bash
drop trigger tgName;
```

**索引**
 
- 提高查询速度,但是降低了增删改的速度,所以使用索引时,要综合考虑.
- 索引不是越多越好,一般我们在常出现于条件表达式中的列加索引.
- 值越分散的列，索引的效果越好

**索引类型**
 
 - `primary key`主键索引
 - `index` 普通索引
 - `unique index` 唯一性索引
 - `fulltext index` 全文索引


**综合练习:**

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



> 建表完成后,作以下操作:

- 删除goods表的goods_desc 字段,及货号字段
- 并增加字段:click_count  -- 点击量
- 在goods_name列上加唯一性索引
- 在shop_price列上加普通索引
- 在clcik_count列上加普通索引
- 删除click_count列上的索引


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

> 注:以下查询基于`ecshop`网站的商品表(`ecs_goods`)

> 在练习时可以只取部分列,方便查看.

### 3.1 基础查询 where的练习

> 查出满足以下条件的商品

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

```bash
select goods_id,cat_id,goods_name,shop_price  from ecs_goods
     where cat_id in (4,11);
```

#### 3.1.6 取出100<=价格<=500的商品(不许用and)

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

```bash
select goods_id,cat_id,goods_name,shop_price from ecs_goods where shop_price>100 and shop_price <300 or shop_price >4000 and shop_price <5000;
```

#### 3.1.9 取出第3个栏目下面价格<1000或>3000,并且点击量>5的系列商品

```bash
select goods_id,cat_id,goods_name,shop_price,click_count from ecs_goods where
cat_id=3 and (shop_price <1000 or shop_price>3000) and click_count>5;
```

#### 3.1.10 取出第1个栏目下面的商品(注意:1栏目下面没商品,但其子栏目下有)

```bash
select goods_id,cat_id,goods_name,shop_price,click_count from ecs_goods
     where cat_id in (2,3,4,5);
```

#### 3.1.11 取出名字以"诺基亚"开头的商品

```bash
select goods_id,cat_id,goods_name,shop_price  from ecs_goods     where goods_name like '诺基亚%';
```

#### 3.1.12 取出名字为"诺基亚Nxx"的手机

```bash
select goods_id,cat_id,goods_name,shop_price  from ecs_goods  
   where goods_name like '诺基亚N__';
```

#### 3.1.13 取出名字不以"诺基亚"开头的商品

```bash
select goods_id,cat_id,goods_name,shop_price from ecs_goos
     where goods_name not like '诺基亚%';
```

#### 3.1.14 取出第3个栏目下面价格在1000到3000之间,并且点击量>5 "诺基亚"开头的系列商品

```bash
select goods_id,cat_id,goods_name,shop_price from ecs_goods where 
cat_id=3 and shop_price>1000 and shop_price <3000 and click_count>5 and goods_name like '诺基亚%';
```

```bash
select goods_id,cat_id,goods_name,shop_price  from ecs_goods where 
shop_price between 1000 and 3000 and cat_id=3  and click_count>5 and goods_name like '诺基亚%';
```

#### 3.1.15 一道面试题

> 有如下表和数组

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

#### 3.1.16 练习题:

> 把`good`表中商品名为'诺基亚xxxx'的商品,改为'HTCxxxx',

- 提示:大胆的把列看成变量,参与运算,甚至调用函数来处理 。`ubstring()`, `concat()`

### 3.2	分组查询group

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

#### 3.2.8 查询每个栏目下面

- 最贵商品价格
- 最低商品价格
- 商品平均价格
- 商品库存量
- 商品种类

> 提示:(`5`个聚合函数,`sum`, `avg`, `max`, `min`, `count`与`group`综合运用)
`select cat_id,max(shop_price) from ecs_goods  group by cat_id;`

### 3.3 having与group综合运用查询

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

```bash
select goods_id,goods_name,market_price-shop_price  as k from ecs_goods
where market_price-shop_price >200;
```

```bash
select goods_id,goods_name,market_price-shop_price  as k from ecs_goods
having k >200;
```

#### 3.3.6 查询积压货款超过2W元的栏目,以及该栏目积压的货款

```bash
select cat_id,sum(goods_number*shop_price) as k from ecs_goods group by cat_id
having k>20000
```

#### 3. 3.7 where-having-group综合练习题

> 有如下表及数据

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

> 看每个人挂科情况

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

> 计算每个人的挂科科目

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

> 利用`having`筛选挂科`2`门以上的.


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


### 3.4、order by 与 limit查询

#### 3.4.1 按价格由高到低排序

```bash
select goods_id,goods_name,shop_price from ecs_goods order by shop_price desc;
```

#### 3.4.2 按发布时间由早到晚排序

```bash
select goods_id,goods_name,add_time from ecs_goods order by add_time;
```

#### 3.4.3 接栏目由低到高排序,栏目内部按价格由高到低排序

```bash
select goods_id,cat_id,goods_name,shop_price from ecs_goods
     order by cat_id ,shop_price desc;
```

#### 3.4.4 取出价格最高的前三名商品

```bash
select goods_id,goods_name,shop_price from ecs_goods order by shop_price desc limit 3;
```

#### 3.4.5 取出点击量前三名到前5名的商品

```bash
select goods_id,goods_name,click_count from ecs_goods order by click_count desc limit 2,3;
```

### 3.5	连接查询

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

```bash
select goods_name,cat_name,brand_name from 
ecs_goods left join ecs_category
on ecs_goods.cat_id=ecs_category.cat_id
left join ecs_brand 
on ecs_goods.brand_id=ecs_brand.brand_id
where ecs_goods.cat_id = 4;
```

#### 3.5.4 面试题

>根据给出的表结构按要求写出`SQL`语句。

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

- `Match`的`hostTeamID`与`guestTeamID`都与`Team`中的`teamID`关联
- 查出 `2006-6-1` 到`2006-7-1`之间举行的所有比赛，并且用以下形式列出：
- 拜仁  `2：0` 不来梅 `2006-6-21`


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

### 3.6、union查询

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


```bash
mysql> # 合并 ,注意all的作用
mysql> select * from ta 
    -> union all
    -> select * from tb;
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

```bash
mysql> # sum,group求和
mysql> select id,sum(num) from (select * from ta union all select * from tb) as tmp group by id; 
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


**用exists型子查询,查出所有有商品的栏目**

```bash
select * from category
where exists (select * from goods where goods.cat_id=category.cat_id);
```

**创建触发器:**

```bash
CREATE  trigger tg2
after insert on ord
for each row
update goods set goods_number=goods_number-new.num where id=new.gid

CREATE trigger tg3
after delete on ord
for each row
update goods set goods_number=good_number+old.num where id=old.gid


CREATE  trigger tg4
after update on ord
for each row
update goods set goods_number=goods_number+old.num-new.num where id=old.gid
```


## 四、常用表管理语句

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

## 五、查询总结

### 5.1 insert

- `insert into 表名` 插入列与值要严格对应
- 数字不必加单引号 字符串必须加单引号
- 例子：`insert into test(age,name)values(10,'小明');`

	
### 5.2 update操作

```js
// 例子：
update user set age=8 where name=lianying;
//（注意where条件不加会影响所有行，需要小心）
```

### 5.3 delete操作

- 不可能针对某一列删除 要删必须一行
- `delete from 表名 where 添加`
- `delete from user where uid=1;`（必须加上添加，否则全部数据删除）

### 5.4 select查找

- `select * from 表名`（全部查出）
- `select uid,name from user where uid>10;`
- `select * from user where uid=11;`


### 5.5 select查询模型（重要）

- `select * from 表名 where 1`（`where`是一个表达式 为真则取出来 为假不取）
- 把列看成变量，既然是变量就能参与运。这个过程称为广义投影（比如：取出两列参与运算）也可以带到函数里面计算
	

> 注意：`NULL`：查询方法： `select * from test where name is （not）null`

	
### 5.6 limit用法（做分页类能用到）

> 限制取出条目（limit有两个参数 ：偏移量 取出的条目）

```bash
select goods_id,goods_name,shop_price
	-> from goods
	-> order by shop_price desc
	-> limit  0,3;
```


### 5.7 子句的查询陷阱

> `5`种语句有严格的顺序，`where` ，`group by`,`having`,`order by`,`limit`
不能颠倒顺序
		
		
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
	
**where字查询：（内层的查询结果作为外层的比较条件）**
	
- 静态的：select goods_id,goods_name from goods where goods_id=32;
- 动态的：select goods_id,goods_name from goods where goods_id=(select max(goods_id) from goods);
		
```bash
#取出每个栏目下最新的商品：
select goods_id,cat_id,goods_name from goods where goods_id in (select max(goods_id) from goods group by cat_id);
```
	
### 5.9 from子查询

```bash
#每个栏目下最新的商品：
		mysql> select goods_id,goods_name from (select * from goods where 1 order by cat_id desc) as tmp
			-> group by cat_id;
```

### 5.10 exists子查询：
	
```bash
#查询栏目下是否有商品
		mysql> select * from category
			-> where exists(select * from goods where goods.cat_id=category.cat_id)
```
	
	
### 5.11 内连接查询（重要）

> 内连接是左右连接结果的交集

```bash
select xxx from
			table1 inner jion table2 on table1.xx=table2.xx
			
		
mysql> select boy.hid,boy.bname,girl.hid,girl.gname
			-> from
			-> boy inner join girl on boy.hid=girl.hid;
```
		

### 5.12 左连接特点

> 以左表的数据为标准，去找右表的数据，查不到的为`NULL`
		
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

> 把`2`条或多条的额查询结果，合并成`1`个结果集


- `sql1 N行`
- `sql2 M行`
- `sql1 union sql2，N+M行`


> - `union`语句必须满足一个条件：各语句取出的列数要相同
> - `union`语句中不用写`order by` 因为`sql`合并后得到总的结果集可以`order by `字句`order by`失去意义
> - 场景：`2`条语句，各自的`where`非常复杂，可以简化成简单的条件在`union`
> - 注意：使用`union`时，完全相等的行将会被合并。合并是比较耗时的操作，一般不让`union`合并，使用`union all `可以避免合并 对速度有提升

```bash
mysql> select * from a
	-> union all #union all 可以避免重复语句合并
	-> select * from b;

mysql> select goods_id,cat_id,goods_name,shop_price from goods where cat_id=2
	-> union
	-> select goods_id,cat_id,goods_name,shop_price from goods where cat_id=4;
```			


## 六、建表总结

```bash
create table 表名 （
	列1 列类型 [列属性 默认值]
	列2 列类型 [列属性 默认值]
	...
	);
	engine = 存储引擎
	chartset = 字符集
```
		
> 建表过程：声明表头的过程，也就是声明列的过程
	
- 选择合理的列类型 合理的列宽度（即放下内容 又不浪费磁盘空间）
- 列选什么类型的列 列给什么样的属性
- 数值型--整形，浮点型，定点型
- 字符串型--`char` `varchar` `text`
- 日期时间类型--`2012-12-13 14.25.36`


### 6.1 整型列

|类型：   |     字节：    |  最小值：         |         最大值：|
|---|---|---|---|
|`bigint`|     `8`字节|        `-9223372036854775808`	|	18446744073709551615
|`int`|        `4`字节	|	   `-2147483648`          |   `4294967295`|
|`mediunint`|  `3`字节	|	   `-8388608`                | `8388607`|
|`smallint`|   `2字节  |      `-32768`                 |  `3276`7|
|`tinyint `|   `1`字节  |      `-128`                    | `127`|

	
> 整型列的可选参数
		
- `unsigned` 无符号，列的值从`0`开始不为负
- `zerofill M`（宽度）适合用于 学号 编码等固定宽度的数字，可以用0填充至固定宽度
- 学号：`1--0001`
- 注意：`zerofill`属性默认决定是`unsigned`
		


### 6.2 浮点列与定点列
		

- `float（M，D）` `M`是精度总位数 `D`代表小数点后面的位数
- `float/double` 范围区别和`decimal`相比：浮点数存储有精度的损失
- `decimal` 定点型更精确
			

		
### 6.3 字符型列


- `char(M)`--`char(10)`只能存`10`个字符
- `char`型:如果不够`M`个字符，内部会用空格补齐，取出时在把右侧空格删掉
	- 注意：这意味着右侧本身有空格将会丢失
- `varchar(M)`--用多少占多少--自动扩展		
- `varchar`不会丢失空格
- 速度上：定长`char`快一些  在一定范围内用`char`定长寻址快 速度快
- `M`比较短`20`个以内用`char`
- `text` 存大段文本
- `blob` 是二进制类型 用来存图像信息 音频等二进制信息
  - `blob`意义在于防止因为字符集的问题导致信息丢失
- `enum`枚举类型：是定义好 值就在某几个枚举范围内
  - `gender emum('男','女') insert` 只能选其中之一
						  

				  
### 6.4 日期时间类型


- `year`：存年份
- `date`:存年份日期2016-18
- `time`：存时分秒
- `datetime`:年月日时分秒

			
```bash
mysql> create table t8(
	-> ya year,
	-> dt date,
	-> tm time,
	-> dttm datetime);
	-> insert into t8 (ya,dt,tm) values(2015,'2015-12-18','18:28:36');
```


### 6.5 列的默认值
	
- `NULL`查询不方便
- `NULL`索引效率不高
- 实际中避免列的值为`NULL`

> 如何避免：声明列`NOT NULL default`默认值

	
```bash
mysql> create table t10(
		-> id int not null default 0,
		-> name char(10) not null default ''
		-> );
```

					
### 6.6 主键与自增

- 主键`primary key` 此列不重复，能区分每一行
- `primary key,auto_increment(一般那两个一起出现)`
- 注意：一张表列只能有一列为`auto_increment` 且此列必须加索引（`index` `key`）
- 优化：
  - 定长（`char`）与变长（`varchar`）分离
  - 常用与不常用列分离
  - 能提高表的查询效率


### 6.7 列的删除与增加：（列的增删改）

- `alter  table 表名 add 列名 列类型 列属性` 默认在表的最后
- `alter  table  表名 drop column 指定列`--删除列
- `alter  table  表名 add 列名  列类型 列属性` [`after` 指定列的后面]
- `alter table  表名 change height(要修改的) shengao（被修改后的） smallint`
- `alter table 表名 modify 列名` 要改成的新的属性

### 6.8 视图：（存储的都是语句）

> `view`被称为虚拟表，view是sql语句的查询结果（物理表的一个映射结果，物理表一改变，视图表也改变）

**1. view好处**

- 权限控制可用：
  - 比如某几个列允许用户查询，其他不允许
  - 可通过视图开放其中一列或几列，起到权限控制作用
- 简化复杂的查询
- 视图能更新？
  - 如果视图的每一行是与物理表一一对应的可以
  - view的行是由物理表多行经过计算得到的结果，view不可以更新
				

**2. 视图的algorithm**
			
- 对于检查查询形成的view，在对view查询时，如order by where
- 可以把建视图语句+查视图的语句===合并成==>查物理的语句
- 这种视图的算法叫merger（合并）

			
### 6.9 引擎的概念

- `mysql 5.0`以上默认的引擎是`innoDB`  一般建表时指定引擎
- `myisam`引擎存储的数据可以直接考出来拿去用
- `innDB`要把数据导出来

> `myisam`和`innDB`引擎区别
		
|mysiam   |  innDB |
|---|---|
|批量插入的速度：|  高   |       低|
|存储限制：	|	 没有   |     `64TB`|

		
### 6.10 字符集与乱码问题

- 字符集、校对集(排序规则)、乱码
- 文字本来的字符集与展示的字符集不一致导致
- 客户端编码设置：`set names gbk/utf8;`
- 表设置编码:`create table ()charset utf8;`
- 服务器端`utf8/gbk` 都可
- 网页的话：`mate:charset=utf8;`


### 6.11 索引

- 索引是数据的目录，能快速定位行数据的位置
- 索引提高了查询的速度，降低了增删改的速度，并非越多越好
- 一般在查询频率的列上加，而且在重复低列上加效果好
- `key` 普通索引
- `unique key` 唯一键
- `primary key` 主键索引
- 索引长度：建索引时，可以只索引列的前一部分的内容比如：前十个字符 `key email(email(10));`
- 多列索引:就是把`2`列或者多列的值，看成一个整体，然后键索引
- 冗余索引：在某个列上可能存在多个索引


### 6.12 索引操作

- 查看索引：`show index from goods\G`
- 删除索引：`alter table 表名 drop index 索引名`
  - 或者：`drop index 索引名 on 表名`
- 添加：`alter table 表名 add [index \unqiue]索引名(列名)`
- 添加主键索引：`alter table 表名 add primary key 列名`
- 删除主键索引：`alter table 表名 drop primary key`

## 七、常用函数

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
- `rand()`返回`０`到`1`内的随机值,可以通过提供一个参数(种子)使`rand()`随机数生成器生成一个指定的值。
- `round(x,y)`返回参数`x`的四舍五入的有`y`位小数的值
- `sign(x) `返回代表数字`x`的符号的值
- `sqrt(x) `返回一个数的平方根
- `truncate(x,y)`            返回数字`x`截短为`y`位小数的结果

### 7.2 聚合函数(常用于group by从句的select查询中)

- `avg(col)`返回指定列的平均值
- `count(col)`返回指定列中非`null`值的个数
- `min(col)`返回指定列的最小值
- `max(col)`返回指定列的最大值
- `sum(col)`返回指定列的所有值之和
- `group_concat(col) `返回由属于一组的列值连接组合而成的结果

### 7.3 字符串函数

- `ascii(char)`返回字符的`ascii`码值
- `bit_length(str)`返回字符串的比特长度
- `concat(s1,s2...,sn)`将s`1,s2...,sn`连接成字符串
- `concat_ws(sep,s1,s2...,sn)`将`s1,s2...,sn`连接成字符串，并用`sep`字符间隔
- `insert(str,x,y,instr)`将字符串`str`从第`x`位置开始，`y`个字符长的子串替换为字符串`instr`，返回结果
- `find_in_set(str,list)`分析逗号分隔的`list`列表，如果发现`str`，返回`str`在`list`中的位置
- `lcase(str)`或`lower(str)` 返回将字符串`str`中所有字符改变为小写后的结果
- `left(str,x)`返回字符串`str`中最左边的`x`个字符
- `length(s)`返回字符串`str`中的字符数
- `ltrim(str)` 从字符串`str`中切掉开头的空格
- `position(substr,str)` 返回子串`substr`在字符串`str`中第一次出现的位置
- `quote(str)` 用反斜杠转义`str`中的单引号
- `repeat(str,srchstr,rplcstr)`返回字符串`str`重复`x`次的结果
- `reverse(str) 返回颠倒字符串`str`的结果
- `right(str,x) 返回字符串`str`中最右边的`x`个字符
- `rtrim(str) 返回字符串`str`尾部的空格
- `strcmp(s1,s2)`比较字符串`s1`和`s2`
- `trim(str)`去除字符串首部和尾部的所有空格
- `ucase(str)`或`upper(str)` 返回将字符串`str`中所有字符转变为大写后的结果


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
- `quarter(date) `  返回`date`在一年中的季度`(1~4)`，如`select quarter(current_date);``
- `week(date)`   返回日期`date`为一年中第几周(`0~53`)
- `year(date)`   返回日期`date`的年份(`1000~9999`)

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

> 为了进行数据类型转化，`mysql`提供了`cast()`函数，它可以把一个值转化为指定的数据类型。类型有：`binary`,`char`,`date`,`time`,`datetime`,`igned`,`unsigned`

```bash
# 示例：

select cast(now() as signed integer),curdate()+0;
select 'f'=binary 'f','f'=cast('f' as binary);
```

### 7.8 系统信息函数

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

## 八、Mysql十条常用语句

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
create table msg{
    id int auto_increment primary key，
	content varcha(200)，
	pubtime int
}charset utf8;
```

**6. 告诉服务器你的字符集：set names gbk/utg8;**

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
select * from where id = 2...
```

**10. 快速清空表**

```
truncate 表名
```


## 九、可视化管理数据

> 一般为了方便管理数据，我们都需要用到可视化工具

- [navicat-for-mysql](https://www.navicat.com.cn/download/navicat-for-mysql)


> 这里提供一份数据表，供学习使用，[导入sql数据到navicat](https://blog.csdn.net/qq_33699659/article/details/79261661)

> http://blog.poetries.top/sql/mysql-table.sql
