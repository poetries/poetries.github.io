---
title: 日常频繁使用的Linux命令
date: 2018-02-25 09:32:41
tags: Linux
categories: Back-end
---

一、文件管理
---

**1.1 创建删除文件**

- `mkdir`(`-p`多层创建)
- `touch`
- `cp`(`-r`递归复制)
- `rm -rf`
- `mv`(改名、移动剪切)
- `cat` (打印)

**1.2 创建删除软连接**

> linux下的软链接类似于windows下的快捷方式。常用于实际路径很深，每次进入的时候需要花费一定时间，此时我们在根目录创建一个软链接指向该目录，那么我们进入该软连接其实就是进入了软链接指向的实际目录。


```bash
ln  -s  /data/elastic/plugin/ik/custom  myES
```

- 以上命令中的 `/data/elastic/plugin/ik/custom` 就是源文件，`myES` 是链接文件名， 其作用是当进入 `myES` 目录，实际上是链接进入了 `/data/elastic/plugin/ik/custom` 目录
- **删除软链接** `rm -rf  myES` 
  - 注意不是 `rm -rf  myES/`


**1.3 重定向命令**

- `ls  -l  /etc > /home/myback.txt`     (覆盖重定向)　把显示的结果覆盖到`/home/myback.txt`中去
- `ls  -l  /etc >> /home/myback.txt`     (追加重定向)　把显示的结果追加到`/home/myback.txt`中去 
  
**1.4 查看文件大小**

- 查看某个文件夹当前所占用的空间使用 `du -h file`
- 查看当前目录下的所有文件各个大小 `du -sh *`  

二、搜索命令
---

**2.1 管道过滤**

- 使用管道命令过滤搜索的内容 ` ls -l /etc | more`

**2.2 查询命令**  

- **which**

> 在`PATH`变量指定的路径中，搜索某个系统命令的位置，并且返回第一个搜索结果

```bash
# `-a`：将所有由`PATH`目录中可以找到的命令均列出来，而不是只列出第一个被找到的命令
[root@www ~] # which ifconfig
/sbin/ifconfig
```

- **whereis**
  - `-b` 只查找二进制格式的文件
  - `-m` 只查找在说明文件manual路径下的文件
  - `-s` 只招`source`源文件
  - `-u` 查找不在上述三个选项当中的其他特殊文件

> 只能用于程序名的搜索，而且只搜索二进制文件（参数`-b`）、`man`说明文件（参数`-m`）和源代码文件（参数`-s`）

```
whereis [-bmsu] 文件或目录名
```

```bash
[root@www ~] # whereis ifconfig
ifconfig: /sbin/ifconfig /usr/share/man/man8/ifconfig.8.gz
[root@www ~] # whereis -m ifconfig
ifconfig: /usr/share/man/man8/ifconfig.8.gz
```

- **locate**
  - `-i`：忽略大小写差异；
  - `-r`：后面可接正则表达式的实现方式。

> 相当于`find -name`，可快速查找文件

```bash
locate [-ir] keyword
```

```bash
[root@www ~] # locate passwd
/etc/passwd
/etc/passwd-
/etc/news/passwd.nntp
/etc/pam.d/passwd
```

- **find查找任何文件**

> 最常用和最强大的查找命令，可以用它找到任何想找的文件


```
find [PATH] [option] [action]
```

**find参数：基于文件名的搜索**

- 与文件名有关的参数如下
  - `-name filename`：查找文件名为`filename`的文件。`filename`可使用正则表达式表示

```
[root@www ~] # find / -name passwd
```
查找文件名为`passwd`的文件

**find参数：基于文件大小的搜索**

- 与文件大小有关的参数如下
  - `-size SIZE`：查找文件大小刚好等于SIZE的文件
  - `-size -SIZE`：查找文件大小大于SIZE的文件
  - `-size +SIZE`：查找文件大小小于SIZE的文件


> 其中，SIZE的单位有

- `c` —— `byte`，字节；
- `w` —— 字（2字节）；
- `b` —— `bit`，块（512字节）；
- `k` —— 千字节；
- `M` —— 兆字节；
- `G` —— 吉字节

```bash
[root@www ~] # find . -type f -size +10k
搜索大于10KB的文件
[root@www ~] # find . -type f -size 10k
搜索等于10KB的文件
```

**注意**
- 通常`find`不很常用，因为速度慢！
- 通常都是先使用`whereis`或者`locate`来检查，当真的找不到了，才用`find`查找

三、压缩解压命令
---

- `*.tar` 用 `tar -xvf` 解压
- `*.gz` 用 `gzip -d`或者`gunzip` 解压
- `*.tar.gz`和`*.tgz` 用 `tar -xzf` 解压
- `*.bz2` 用` bzip2 -d`或者用`bunzip2` 解压
- `*.tar.bz2`用`tar -xjf` 解压
- `*.Z` 用 `uncompress` 解压
- `*.tar.Z` 用`tar -xZf` 解压
- `*.rar` 用 `unrar e`解压
- `*.zip` 用 `unzip` 解压


四、VI相关
---

- 定位到头尾 
  - `G` 定位到尾
  - `1G` 定位到头
  - `nG` 定位到指定行
- 复制
  - 复制一行 
     - `yy` 复制当前行
  - 复制多行
     - `7yy` 从当前行开始复制`７`行
  - 复制当前到行尾的内容 
     - `y$`
- 粘贴
  - `p` 
  - 大写`P`代表贴至游标前
- 选择复制
  - `v`进入可视化
- 删除
  - 删除一行
    - `dd`
  - 剪切至行首 
    - `d^`
  - 剪切至行尾 
    - `d$`
- 搜索 `/`搜索的关键字，按`n`切换下一个关键字



五、磁盘管理
---

- 查看内存使用情况： `free -m`  (`m`为`MB`，`g`为`GB`)
- 查看对应磁盘使用情况： `df -h`

六、进程管理
---

- `pkill`  根据进程名杀死进程
- `ps` 列出系统中运行的进程，包括进程号、命令、CPU使用量、内存使用量
  - `ps -a` 列出所有运行中/激活进程
  - `ps -ef |grep processName` 列出需要进程
  - `ps -aux` 显示进程信息
- `pstree` `linux`中，每一个进程都是由其父进程创建的。此命令以可视化方式显示进程，通过显示进程的树状图来展示进程间关系
- `top` 
  - 可以监视系统中不同的进程所使用的资源
  - 显示进程的数据包括`PID`、进程属主、优先级、`%CPU`、`%memory`等。可以使用这些显示指示出资源使用量

七、网络管理
---

**7.1 下载源管理**

- `yum list | grep nginx` 查看是否有`Nginx`源

**7.2 防火墙相关**

> `linux`查看防火墙状态及开启关闭命令

- **service方式**

```bash
# 查看防火墙状态

[root@centos6 ~]# service iptables status

# 开启防火墙

[root@centos6 ~]# service iptables start

# 关闭防火墙
[root@centos6 ~]# service iptables stop
```

**iptables方式**

```bash
[root@centos6 ~]# cd /etc/init.d/

# 查看状态
[root@centos6 init.d]# /etc/init.d/iptables status

# 暂时关闭防火墙 
[root@centos6 init.d]# /etc/init.d/iptables stop

# iptables
[root@centos6 init.d]# /etc/init.d/iptables restart

```


- `linux`的防火墙是否阻止80端口
  - 返回有内容说明开通，没返回内容，则说明阻止
  - `iptables -vnL | grep ":80 "`
  

八、上传文件相关
---

- 从远处复制文件到本地目录 
  - `scp root@10.10.10.10:/opt/soft/nginx-0.5.38.tar.gz /opt/soft/`
- 上传本地目录到远程机器指定目录(拷贝目录带上`-r`,递归复制)
  - `scp -r /opt/soft/mongodb root@10.10.10.10:/opt/soft/scptest`
  

九、系统相关
---

**9.1 CPU管理**

- 查看对应CPU使用情况
  - `cat /proc/cpuinfo`
- 只显示一行对应的CPU型号以及其他信息 
  - ` cat  /proc/cpuinfo | grep "model name" | head -1`
- 系统有几个核就会显示几行
  - `cat  /proc/cpuinfo | grep "model name" `
- 统计出一共有多少核
  - `cat  /proc/cpuinfo | grep "model name" | wc -l`

**9.2其他**

- 查看对应服务器版本当前操作系统发行版信息
  - `cat /etc/issue`  或  `cat /etc/redhat-release`
- 查看更为底层的版本信息： `cat /proc/version`
  
