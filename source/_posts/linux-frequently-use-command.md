---
title: 日常频繁使用的Linux命令，按排查场景整理
description: 把日常运维排查的 Linux 命令按查进程、查端口、查磁盘、查日志、查网络分组整理，讲清每组命令的使用顺序、参数含义和常见误判。
date: 2018-02-25 09:32:41
tags: 
  - Linux
  - 运维排查
  - 命令行
categories: Back-end
---

服务突然 502，你 ssh 上去，第一条命令敲什么？

这个问题我问过好几个刚接手服务器的同学，答案五花八门。有人直接 `tail` 日志，有人上来就 `top`，也有人愣在那不知道从哪开始。命令本身大家都认识，卡住的是顺序，不知道该先确认什么再确认什么。

单纯背命令清单意义不大，网上一搜一大把，背完第二天就忘。真正有用的是把命令和排查场景绑在一起：进程还在不在、端口通不通、磁盘满没满、日志里写了什么、网络能不能出去。这篇按这个思路把日常用得最多的 Linux 命令重新归拢一遍，每组都说清楚为什么先查这个。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 服务出问题时的排查顺序，先看哪一层
- 查进程：`ps`、`pstree`、`top`、`pkill` 各自的位置
- 查端口和防火墙：端口没监听和端口被拦是两回事
- 查磁盘和内存：`df`、`du`、`free` 以及 inode 满了的诡异现象
- 查日志：管道组合怎么把几百兆的日志缩到几行
- 查网络：源、DNS、连通性
- 文件管理的基本功：软链接、重定向、压缩解压
- 找文件的四个命令，为什么 `find` 排最后
- vi 在服务器上的应急操作
- 看机器配置和系统版本

## 一、先想清楚排查顺序

线上服务出问题，我的顺序基本是固定的这五步。

进程还在吗。服务被 OOM Killer 干掉、被人手动杀了、启动就崩了，这三种情况都表现为「访问不通」，但原因天差地别。先确认进程存在与否，能砍掉一大半的可能性。

进程在，那端口有没有监听。进程活着不等于服务可用，配置写错端口、绑定到了 127.0.0.1 而不是 0.0.0.0，进程都好好的但外面就是连不上。

端口在监听，那是不是被防火墙拦了。这一步和上一步的现象很像，都是「连不上」，但一个是本机没监听，一个是包根本没进来。

前面都正常，看资源。磁盘满了、内存被吃光了、CPU 跑满了，服务会表现出各种奇怪的间歇性故障。

最后才是看日志。不是说日志不重要，而是前面四步能快速缩小范围，带着假设去看日志比漫无目的地翻要快得多。

顺着这个顺序，下面一组一组说。

## 二、查进程

### 2.1 ps

`ps` 列出系统中运行的进程，包括进程号、命令、CPU 使用量、内存使用量。日常最常用的就两种写法。

```bash
# 找特定的进程
ps -ef | grep nginx

# 显示所有进程的完整信息，带 CPU 和内存占用
ps -aux
```

`ps -ef` 是 System V 风格，输出里有 PPID（父进程 ID），排查「谁把它拉起来的」时候有用。`ps -aux` 是 BSD 风格，多了 `%CPU` 和 `%MEM` 两列。两套参数混用一般也能跑，但看到的列不一样，知道有这么回事就行。

`ps -ef | grep nginx` 有个人人都会遇到的现象，输出里总会多出一行 `grep nginx` 自己。因为 `grep` 也是个进程，`ps` 抓快照的那一刻它正好在跑。经典的绕法是把首字母用中括号括起来。

```bash
ps -ef | grep [n]ginx
```

`[n]ginx` 作为正则匹配 `nginx`，但 `grep` 自己的命令行里写的是 `[n]ginx` 这个带括号的字符串，匹配不上自己。或者干脆用 `pgrep`，它就是为这个场景生的。

```bash
pgrep -a nginx
```

### 2.2 pstree

Linux 里每一个进程都是由父进程创建的。`pstree` 用树状图展示进程之间的父子关系。

用得最多的场景是看 master/worker 结构的服务。Nginx 的 master 带几个 worker、PM2 的守护进程下面挂了几个 Node 实例，一眼就看清楚了。`ps` 是平铺的列表，同样的信息得自己在 PPID 里对着找。

```bash
pstree -p | grep node
```

### 2.3 top

`top` 监视系统中不同进程使用的资源，显示的数据包括 PID、进程属主、优先级、`%CPU`、`%MEM` 等，可以用这些指示出资源使用量。

进去之后有几个交互键值得记住。`P` 按 CPU 排序，`M` 按内存排序，`1` 展开显示每个 CPU 核心的负载，`q` 退出。

看 `top` 的第一行还有个关键信息，load average 那三个数分别是 1 分钟、5 分钟、15 分钟的平均负载。判断标准是拿它和 CPU 核心数比，核心数是 4 而 load 长期在 8 以上，说明确实排队了。这里有个常见误判，load 高不一定是 CPU 忙，大量进程卡在磁盘 IO 上（状态 D）也会把 load 顶起来，这时候盯着 `%CPU` 看是找不到原因的。

### 2.4 pkill

`pkill` 根据进程名杀死进程，不用先查 PID 再 `kill`。

```bash
pkill nginx
```

但这个命令要小心，它是按名字模糊匹配的，名字写得太短可能会误杀。**动手之前先用 `pgrep -a` 看一眼到底会命中哪些进程，这个习惯能避免很多事故。**

另外 `pkill` 默认发的是 SIGTERM（15），进程可以捕获它做优雅退出。真的杀不掉才用 `-9` 发 SIGKILL，那个信号不能被捕获，进程没有机会清理临时文件和释放连接。习惯性上来就 `-9` 不是好事。

## 三、查端口和防火墙

进程活着但连不上，接下来看端口。

```bash
# 看所有监听中的 TCP 端口，带进程名
ss -tlnp

# 老一点的机器上可能只有 netstat
netstat -tlnp

# 看某个端口被谁占了
lsof -i:8080
```

重点看监听地址那一列。`0.0.0.0:3000` 表示所有网卡都能连，`127.0.0.1:3000` 表示只有本机能连。Node 服务用 `app.listen(3000)` 在某些环境下会绑到回环地址，本机 `curl` 一切正常，外面死活连不上，就是这个原因。

确认端口在监听但外部还是连不上，那就轮到防火墙了。

`linux` 查看防火墙状态及开启关闭命令，老的 CentOS 6 系用 service 方式。

```bash
# 查看防火墙状态
[root@centos6 ~]# service iptables status

# 开启防火墙
[root@centos6 ~]# service iptables start

# 关闭防火墙
[root@centos6 ~]# service iptables stop
```

也可以直接调 init 脚本。

```bash
[root@centos6 ~]# cd /etc/init.d/

# 查看状态
[root@centos6 init.d]# /etc/init.d/iptables status

# 暂时关闭防火墙 
[root@centos6 init.d]# /etc/init.d/iptables stop

# 重启
[root@centos6 init.d]# /etc/init.d/iptables restart
```

想确认 80 端口是不是被放行了，直接查规则。

```bash
iptables -vnL | grep ":80 "
```

返回有内容说明开通，没返回内容则说明被阻止。

这块要补一句时效性的说明。上面这套是 CentOS 6 时代的做法，CentOS 7 之后 init 脚本换成了 systemd，防火墙前端也换成了 `firewalld`，对应的命令变成这样。

```bash
systemctl status firewalld
firewall-cmd --list-all
firewall-cmd --zone=public --add-port=80/tcp --permanent
firewall-cmd --reload
```

更新一点的发行版（Debian/Ubuntu 系）常用的是 `ufw`。原文那套命令在老机器上依然有效，遇到新系统换个前端工具就行，底层还是 netfilter 那一套。

还有个特别容易忽略的地方，云服务器除了系统防火墙，云厂商控制台上还有一层安全组。系统里 `iptables` 全开了外面还是不通，八成是安全组没放行。这个我踩过，在机器上折腾了半天规则，最后发现问题在网页控制台上。

## 四、查磁盘和内存

### 4.1 磁盘空间

```bash
# 查看各分区的使用情况
df -h

# 查看某个目录占了多少空间
du -h file

# 查看当前目录下各个文件/目录的大小
du -sh *
```

`df` 是从文件系统层面看，`du` 是从目录层面统计。日常排查是 `df -h` 先看哪个分区满了，再 `du -sh *` 逐层往下找是谁占的。

`-h` 是 human-readable，把字节数换算成 K/M/G。`du -sh *` 里的 `-s` 是 summarize，只输出每个参数的汇总，不加的话会把所有子目录一层层都列出来，几千行刷屏。

这里有个坑要注意。`df` 显示还有空间，但写文件就是报 `No space left on device`，这种情况看一眼 inode。

```bash
df -i
```

inode 是文件系统用来记录文件元信息的结构，数量在格式化时就定死了。海量小文件（session 文件、日志切片、缓存碎片）会把 inode 耗光，这时候空间还剩很多但一个新文件都建不了。第一次遇到这个现象是真的会懵。

另一个坑是删了文件空间没释放。有进程还开着那个文件句柄的话，磁盘空间不会回收，`lsof | grep deleted` 能把这些找出来，重启对应进程才会真正释放。前端项目里最常见的场景是日志文件被 `rm` 了但 Node 进程还在往里写。

### 4.2 内存

```bash
free -m
```

`-m` 以 MB 显示，`-g` 是 GB。

看 `free` 输出有个经典误解，很多人看到 free 那一列只剩几十兆就慌了。其实 Linux 会把暂时用不到的内存拿去做文件缓存（buff/cache），需要的时候随时能回收。真正该看的是 available 那一列，它才代表还能给新进程用多少。

## 五、查日志

日志文件动辄几百兆，直接 `cat` 是灾难，终端刷屏几分钟还找不到重点。日志排查的核心是用管道把范围一层层缩小。

管道命令 `|` 的作用是把前一个命令的输出交给后一个命令处理，最简单的例子是分页看。

```bash
ls -l /etc | more
```

真正干活的组合大概是这几种。

```bash
# 实时跟踪最新日志，部署后观察最常用
tail -f /var/log/nginx/error.log

# 只看最后 200 行，再从里面找关键字
tail -n 200 app.log | grep "ERROR"

# 找关键字并带出上下文各 5 行
grep -C 5 "Timeout" app.log

# 统计某个错误出现了多少次
grep -c "500" access.log

# 找出访问量最大的前 10 个 IP
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10
```

最后那条值得拆开说说，它是一个非常典型的管道流水线。`awk '{print $1}'` 取每行第一列（Nginx 默认日志格式里就是客户端 IP），`sort` 排序把相同的 IP 排到一起，`uniq -c` 统计每个 IP 出现的次数，`sort -rn` 按数字倒序排，`head -10` 取前十。

为什么 `uniq` 前面必须先 `sort`？因为 `uniq` 只能去掉**相邻**的重复行，不排序的话分散在各处的相同 IP 它认不出来。这个我一开始也搞错过，写完发现统计结果全是 1。

日志文件太大的时候还有个实用技巧，`less` 比 `vi` 安全得多。`vi` 会把整个文件读进内存，一个 2G 的日志能直接把机器拖死；`less` 是按需加载的，进去之后 `/关键字` 搜索、`G` 跳到末尾、`q` 退出。

## 六、查网络

```bash
# 看软件源里有没有某个包
yum list | grep nginx

# 测连通性
ping api.example.com

# 看 DNS 解析到哪
dig api.example.com
nslookup api.example.com

# 看当前的 TCP 连接状态分布
ss -s
```

装软件之前用 `yum list | grep nginx` 确认源里有没有这个包，是个省事的习惯，免得 `yum install` 报一堆错才发现源没配对。

排查「服务器访问不了某个外部接口」的时候，我的顺序是 `ping` 看基础连通性，`dig` 看域名解析对不对，最后用 `curl -v` 看具体是哪一层失败。`curl` 这块的细节我单独写过一篇 [学会用Curl调试接口，从常用参数到耗时排查](https://feinterview.poetries.top/blog/linux-curl)，包括怎么用 `-w` 把 DNS、握手、服务端处理各阶段的耗时拆开看。

## 七、文件管理的基本功

排查之外，日常操作里高频的就这几类。

### 7.1 创建和删除

- `mkdir`，加 `-p` 可以一次创建多层目录，父目录不存在也不报错
- `touch`，创建空文件，文件已存在时只更新时间戳
- `cp`，加 `-r` 递归复制目录
- `rm -rf`，强制递归删除
- `mv`，改名和移动是同一个命令
- `cat`，打印文件内容

`rm -rf` 这个组合威力太大，在服务器上敲它之前我一般会先 `ls` 一遍确认路径。尤其要提防变量没取到值的情况，脚本里写 `rm -rf $DIR/`，`DIR` 恰好为空的话，这条命令就变成了 `rm -rf /`。这类问题在 [shell入门](https://feinterview.poetries.top/blog/shell) 那篇里有更系统的防范写法。

### 7.2 软链接

Linux 下的软链接类似于 Windows 下的快捷方式。常用于实际路径很深，每次进入都要花时间，这时候在根目录创建一个软链接指向该目录，进入这个软链接其实就是进入了它指向的实际目录。

```bash
ln -s /data/elastic/plugin/ik/custom myES
```

上面命令中的 `/data/elastic/plugin/ik/custom` 是源目录，`myES` 是链接名。进入 `myES` 目录，实际上是进入了 `/data/elastic/plugin/ik/custom`。

删除软链接用 `rm -rf myES`，注意不是 `rm -rf myES/`。

这个细节值得展开一句。末尾多一个斜杠，语义就从「删除这个链接文件」变成了「操作链接指向的那个目录」，某些系统上会把源目录里的东西删掉。链接本身就是个特殊文件，删它不需要 `-r`，`rm myES` 就够了，`-rf` 反而增加了误伤的可能。

部署场景里软链接还有个经典用法。把 `current` 做成软链接指向具体的版本目录，发布新版本时改一下链接指向，回滚就是把链接指回去，秒级完成。

### 7.3 重定向

```bash
# 覆盖重定向，把结果覆盖写到文件
ls -l /etc > /home/myback.txt

# 追加重定向，把结果追加到文件末尾
ls -l /etc >> /home/myback.txt
```

一个 `>` 会清空原文件，两个 `>>` 是追加。手滑写成一个 `>` 把配置文件清空的事，我是听说过的，所以往已有文件里写东西之前想一秒钟。

还有一点很多人没注意，`>` 只重定向标准输出（stdout），错误信息走的是标准错误（stderr），不会被它捕获。所以下面这条命令，报错还是会打在屏幕上。

```bash
ls -l /not-exist > out.txt
```

要连错误一起收进去，得这么写。

```bash
命令 > out.txt 2>&1
# 或者更简洁的写法
命令 &> out.txt
```

`2>&1` 的意思是把文件描述符 2（stderr）重定向到文件描述符 1（stdout）当前指向的地方。写定时任务的时候这个尤其重要，不这么写的话报错信息会以邮件形式发给 root，然后堆在那里没人看。

### 7.4 压缩解压速查

看到扩展名就知道用什么解压，这张表贴在手边比什么都实用。

| 扩展名 | 解压命令 |
| :--- | :--- |
| `*.tar` | `tar -xvf` |
| `*.gz` | `gzip -d` 或 `gunzip` |
| `*.tar.gz` 和 `*.tgz` | `tar -xzf` |
| `*.bz2` | `bzip2 -d` 或 `bunzip2` |
| `*.tar.bz2` | `tar -xjf` |
| `*.Z` | `uncompress` |
| `*.tar.Z` | `tar -xZf` |
| `*.rar` | `unrar e` |
| `*.zip` | `unzip` |

规律其实很清楚。`tar` 本身只负责打包不负责压缩，`z` 对应 gzip、`j` 对应 bzip2、`Z` 对应 compress，`x` 是解包、`c` 是打包、`f` 后面跟文件名、`v` 是显示过程。所以打包一个 gz 就是 `tar -czvf app.tar.gz app/`，把 `x` 换成 `c` 而已。

比较新的 GNU tar 能根据扩展名自动判断压缩格式，`tar -xf` 不带 `z`/`j` 也能解开，但显式写出来更保险，老机器上不一定支持。

## 八、找文件的四个命令

这四个命令的差别在于「去哪找」，搞清楚这点就不会用错了。

### 8.1 which

在 `PATH` 变量指定的路径中，搜索某个系统命令的位置，并且返回第一个搜索结果。

```bash
# -a 把 PATH 里所有能找到的都列出来，而不是只列第一个
[root@www ~] # which ifconfig
/sbin/ifconfig
```

排查「命令找到的不是我想要的那个版本」时特别有用，比如机器上装了多个 Node，`which node` 一敲就知道当前用的是哪个。

### 8.2 whereis

只能用于程序名的搜索，而且只搜索二进制文件（参数 `-b`）、man 说明文件（参数 `-m`）和源代码文件（参数 `-s`）。

- `-b` 只查找二进制格式的文件
- `-m` 只查找在说明文件 manual 路径下的文件
- `-s` 只找 source 源文件
- `-u` 查找不在上述三个选项当中的其他特殊文件

```
whereis [-bmsu] 文件或目录名
```

```bash
[root@www ~] # whereis ifconfig
ifconfig: /sbin/ifconfig /usr/share/man/man8/ifconfig.8.gz
[root@www ~] # whereis -m ifconfig
ifconfig: /usr/share/man/man8/ifconfig.8.gz
```

### 8.3 locate

相当于 `find -name`，可快速查找文件。

- `-i` 忽略大小写差异
- `-r` 后面可接正则表达式

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

`locate` 快是因为它查的是一个预先建好的数据库，不是实时遍历磁盘。代价是数据库有更新周期（一般靠 cron 定时跑 `updatedb`），刚创建的文件可能查不到。急着找新文件时手动跑一次 `updatedb` 就行。

### 8.4 find

最常用和最强大的查找命令，可以用它找到任何想找的文件。

```
find [PATH] [option] [action]
```

按文件名找。

```
[root@www ~] # find / -name passwd
```

`-name` 后面可以用通配符，注意要加引号，不然会被 shell 先展开掉。

按文件大小找，参数如下。

- `-size SIZE`：查找文件大小刚好等于 SIZE 的文件
- `-size +SIZE`：查找文件大小**大于** SIZE 的文件
- `-size -SIZE`：查找文件大小**小于** SIZE 的文件

原文这里把 `+` 和 `-` 的含义写反了，我改过来了。判断依据是原文自己的示例 `find . -type f -size +10k` 注释写的就是「搜索大于 10KB 的文件」，前后是矛盾的。记法上跟着直觉走就行，`+` 是更大，`-` 是更小。

SIZE 的单位有这几个。

- `c` 表示 byte，字节
- `w` 表示字（2 字节）
- `b` 表示块（512 字节）
- `k` 表示千字节
- `M` 表示兆字节
- `G` 表示吉字节

原文把 `b` 写成了 bit，实际上 `find` 里的 `b` 是 block（512 字节），也是不带单位时的默认值，这个默认值很容易让人算错，所以查大小时习惯性带上单位比较好。

```bash
[root@www ~] # find . -type f -size +10k
搜索大于10KB的文件
[root@www ~] # find . -type f -size 10k
搜索等于10KB的文件
```

按时间找在清理日志时很常用。

```bash
# 找出 7 天前修改过的 .log 文件
find /var/log -name "*.log" -mtime +7

# 找出来直接删掉
find /var/log -name "*.log" -mtime +7 -delete
```

带 `-delete` 或者 `-exec rm` 的命令，先去掉删除动作跑一遍看看命中了哪些文件，确认无误再加上。这个习惯值多少钱，出过一次事就知道了。

关于这四个命令的选择顺序，原文有个建议是对的：`find` 通常不很常用，因为速度慢，一般先用 `whereis` 或者 `locate` 检查，真的找不到了才用 `find`。原因是 `find` 会实时遍历目录树，在大文件系统上可能跑很久，而 `whereis` 和 `locate` 查的都是索引。

不过现在的机器 SSD 普及，`find` 在指定了较小的起始目录时其实很快，真正要避免的是 `find /` 这种从根目录开始的全盘扫描。

## 九、vi 的应急操作

服务器上改个配置，你未必有编辑器可选，vi 基本是保底选项。不需要精通，记住这些够应付了。

定位。

- `G` 定位到文件尾
- `1G` 定位到文件头
- `nG` 定位到第 n 行

复制粘贴。

- `yy` 复制当前行
- `7yy` 从当前行开始复制 7 行
- `y$` 复制当前位置到行尾
- `p` 粘贴到光标后，大写 `P` 粘贴到光标前
- `v` 进入可视化模式，可以选中一段再复制

删除。

- `dd` 删除（剪切）一行
- `d^` 剪切到行首
- `d$` 剪切到行尾

搜索用 `/关键字`，按 `n` 跳到下一个匹配，`N` 回上一个。

再补两个保命的。改错了想全部撤销不保存，`:q!` 强制退出；只想撤销最近一步，普通模式下按 `u`。误按了 `Ctrl+S` 导致终端卡住的话，`Ctrl+Q` 能恢复，这个不是 vi 的问题而是终端流控，但发生在 vi 里的时候特别容易误以为是编辑器崩了。

## 十、上传下载文件

从远程复制文件到本地目录。

```bash
scp root@10.10.10.10:/opt/soft/nginx-0.5.38.tar.gz /opt/soft/
```

上传本地目录到远程机器指定目录，拷贝目录要带上 `-r` 递归复制。

```bash
scp -r /opt/soft/mongodb root@10.10.10.10:/opt/soft/scptest
```

`scp` 的坑不少，端口是大写 `-P`、通配符由本地 shell 展开、目标父目录必须存在，还有什么时候该换成 `rsync`，这些我单独写在了 [Linux之scp传输文件](https://feinterview.poetries.top/blog/linux-scp) 里。

## 十一、看机器配置和系统版本

接手一台不熟悉的机器，先摸清底细。

CPU 相关的信息都在 `/proc/cpuinfo` 里。

```bash
# 查看完整的 CPU 信息
cat /proc/cpuinfo

# 只显示一行 CPU 型号
cat /proc/cpuinfo | grep "model name" | head -1

# 有几个核就显示几行
cat /proc/cpuinfo | grep "model name"

# 直接统计出核数
cat /proc/cpuinfo | grep "model name" | wc -l
```

最后那条是很典型的 `grep` 加 `wc -l` 组合，`wc -l` 数行数，多少行就是多少核。现在更省事的是直接 `nproc`，一个命令输出核数，但 `/proc/cpuinfo` 的好处是能看到型号、缓存大小这些细节，选机器规格时用得上。

系统版本这块。

```bash
# 查看当前操作系统发行版信息
cat /etc/issue
cat /etc/redhat-release

# 查看更底层的内核版本信息
cat /proc/version
```

补充一个更通用的，现在多数发行版都提供 `/etc/os-release`，Debian、Ubuntu、CentOS 都能读到，写跨发行版的脚本时比 `/etc/redhat-release` 靠谱。

```bash
cat /etc/os-release
uname -a
```

`/proc` 这个目录本身也值得了解一下，它不是真实的磁盘文件，是内核暴露出来的虚拟文件系统。CPU、内存、每个进程的状态，全都能在这里以读文件的方式拿到。很多监控工具底层做的就是定时读 `/proc` 下的文件然后做差值计算。

## 总结

这些命令单个都不难，难的是知道什么时候用哪个。

线上排查按这个顺序走基本不会跑偏：`pgrep` 确认进程在不在，`ss -tlnp` 确认端口有没有监听、监听在哪个地址，`iptables -vnL` 或 `firewall-cmd --list-all` 加上云控制台的安全组确认包能不能进来，`df -h` 和 `free -m` 看资源（磁盘满了记得顺手 `df -i` 看 inode），最后带着假设去 `grep` 日志。

几个反直觉的点单独记一下。`free` 要看 available 而不是 free，buff/cache 是可回收的；`df` 有空间却写不进去八成是 inode 满了或者有进程占着已删除的文件句柄；`load average` 高不一定是 CPU 忙，也可能是磁盘 IO 在排队；`uniq` 之前必须先 `sort`，不然统计结果全是 1。

管道是这里面最值钱的东西。`awk` 取列、`sort` 排序、`uniq -c` 计数、`sort -rn` 倒排、`head` 取前几名，这套组合能把几百兆的日志压成十行结论，比装任何工具都快。

最后是习惯。`rm -rf`、`pkill`、`find -delete` 这三类命令，动手之前先用 `ls`、`pgrep -a`、去掉删除动作的 `find` 各跑一遍确认命中范围。多花十秒，少熬一个通宵。

## 参考

- [GNU Coreutils 官方手册](https://www.gnu.org/software/coreutils/manual/coreutils.html)
- [Linux man-pages 项目](https://www.kernel.org/doc/man-pages/)
- [Red Hat 官方文档 · 使用 firewalld 配置防火墙](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/configuring_firewalls_and_packet_filters/index)
- [前端进阶之旅](https://interview.poetries.top)
