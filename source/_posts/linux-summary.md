---
title: Linux与Docker系统运维总结 从命令排查到上线部署
description: 一份面向前端和全栈的 Linux 与 Docker 运维笔记，覆盖文件权限、进程端口排查、yum 与源码安装、ssh 免密、Nginx 反向代理与负载均衡、HTTPS、Docker 镜像容器网络与 Dockerfile 实战。
date: 2022-06-30 15:32:41
tags:
  - Linux
  - Docker
  - 运维
categories: Back-end
---

前端做到一定阶段，总有那么一天，项目要上线，运维排不开，一台空的 CentOS 和一串 root 密码直接甩到你手上。ssh 上去之后才发现，装 Node、配 Nginx、开端口、看进程、翻日志，每一步都得自己来。我这几年陆陆续续把踩过的命令和部署流程记在一个文件里，越攒越多，干脆整理成这篇。

这篇不按「命令字母顺序」排，而是按「什么场景下你会用到这组命令」排。从最基础的文件权限，到 Nginx 反向代理和负载均衡，再到 Docker 的镜像容器网络，你可以当手册翻，出问题的时候直接跳到对应那节。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Linux 的定位，以及为什么服务器基本都是 CentOS 和 Ubuntu
- 文件、目录、权限这组命令，以及 `rwx` 和 `755` 到底在说什么
- 软件安装的三条路，rpm、yum 和源码编译分别什么时候用
- 服务器变慢或者端口不通时，`top`、`ps`、`netstat`、`df` 的排查顺序
- `systemctl` 管服务，firewalld 和 SELinux 管端口
- ssh 别名、免密登录和连接保活，把每天的登录成本降下来
- 环境变量、`printenv` 与前端最常用的 `NODE_ENV` 写法
- 用 rsync 替代 cp，本地和远程都能用
- MongoDB、MySQL、Redis 的裸机安装与远程连接配置
- Nginx + Node 的反向代理、多站点、负载均衡与 HTTPS 配置
- Docker 的镜像、容器、仓库三个核心概念
- 用 Docker 跑 Node、Nginx、MySQL、Redis、MongoDB
- Dockerfile 指令详解与自动部署 Node 程序
- Docker 的四种网络模式与容器互通

## 一、先把 Linux 这套东西的定位说清楚

很多前端第一次登服务器会有点懵，因为平时用的是 macOS 或者 Windows，图形界面点两下就完事。到了服务器上，只剩一个黑框和一个闪烁的光标。

Linux 是一套开源操作系统，它有稳定、消耗资源小、功能很强、安全性高等特点，让它在服务器领域有庞大的用户群体。它跑起来不需要占用几个 G 内存去画界面，同样一台 2 核 4G 的机器，装 Windows Server 可能开机就吃掉一半资源，装 CentOS 剩下的几乎全能给你的应用用。这是它在服务器上统治多年的直接原因。

目前市面上较知名的发行版有 RedHat、Ubuntu、CentOS、Debian、Fedora、SuSE、OpenSUSE、Arch Linux、SolusOS 等。发行版之间的差异主要在包管理器和默认软件版本上，内核是同一套。

常见的服务器操作系统主要有 `CentOS`、`Ubuntu`、`Debian`，本文写作时 `CentOS` 市场占有率第一。这里要补一句，CentOS 8 已于 2021 年底停止维护，CentOS 7 也在 2024 年 6 月结束生命周期，官方推荐的迁移路径是 CentOS Stream、Rocky Linux 或 AlmaLinux。本文所有命令写的是 CentOS 7 那一套（`yum`、`firewalld`、`systemctl`），迁移到 Rocky Linux 之后 `yum` 会变成 `dnf`，其余用法基本不变，`yum` 也仍然被保留为软链接。

顺着上面聊，Ubuntu 那条线用的是 `apt` 系列，命令名不同但思路完全一样，看懂一边基本能推另一边。

## 二、文件、目录与权限，登上服务器最先用到的一组命令

刚 ssh 上一台陌生的服务器，你要做的第一件事其实是搞清楚自己在哪、有什么、能动什么。这一节的命令使用频率最高，闭着眼睛也得能敲出来。

### 2.1 上机第一分钟要敲的几条命令

先看方向感这几条。`pwd` 告诉你人在哪个目录，`ls` 告诉你这个目录里有什么，`cd` 负责走位。

```bash
init 0        # 关机
init 6        # 重启

ls            # 列出当前目录下的文件
ls -l         # 长格式，带权限、属主、大小、时间
ll            # 大多数发行版给 ls -l 配的别名

cd /root      # 切换目录
pwd           # 查看当前路径
```

还有两个快捷键得先记住，不然容易卡住。`ctrl + c` 中断当前程序，`ctrl + l`（等价于 `clear`）清屏。很多人第一次跑 `ping` 或者 `tail -f` 之后不知道怎么退出，就是不知道有 `ctrl + c`。

```bash
ifconfig            # 查看网卡信息（Linux）
ipconfig            # Windows 下的对应命令

ping 127.0.0.1      # 看网络是否通畅
```

这里有个坑要注意。`ifconfig` 属于 `net-tools` 包，很多精简版镜像默认不装，敲下去会提示 `command not found`，要么 `yum install -y net-tools` 补上，要么直接用现在更推荐的 `ip addr`，后者是 `iproute2` 提供的，基本所有发行版都自带。`ipconfig` 是 Windows 的命令，Linux 上没有，别记混了。

至于 `ping 127.0.0.1`，它 ping 的是本机回环地址，通只能说明本机 TCP/IP 协议栈没坏，不代表能上外网。想验证外网，ping 一个公网地址更实在。

### 2.2 创建用户与修改密码

生产机上不建议什么都用 root 跑。给应用单独开一个用户，权限出问题时炸不到整台机器。

```bash
useradd zhangsan        # 添加用户
passwd zhangsan         # 设置密码，回车后交互式输入两次
userdel -rf zhangsan    # 删除用户
```

`userdel` 的两个参数分别是，`-r` 递归删除该用户目录下面的文件以及子目录下的文件，`-f` 强制删除。不加 `-r` 的话用户没了但 `/home/zhangsan` 还留着，久了机器上全是孤儿目录。

### 2.3 文件管理

日常改配置、看日志，来回就是这几条。

```bash
touch file            # 创建文件
rm -rf file           # 删除文件
mv file1 file11       # 修改文件名
cat file1             # 查看文件内容
cp file2 file22       # 复制文件
mv file1 file11       # 移动文件（同一条命令，改名和移动是一回事）
vi file1              # 编辑文件
```

`rm` 的两个参数要单独说一下，`-r` 是递归删除目录下面文件以及子目录下文件，`-f` 是强制删除，忽略不存在的文件，从不给出提示。

`rm -rf` 在服务器上是真能删掉你整个职业生涯的命令，敲之前先 `pwd` 一下确认路径，别在 `/` 下面手滑。

批量创建和删除用花括号展开，测试环境造数据很方便。

```bash
touch file{1..10}       # 一次创建 file1 到 file10
rm -rf file{1..10}      # 一次删掉
```

日志文件动辄几百兆，`cat` 整个刷屏没意义，只看头尾就行。

```bash
cat file1 | head -3     # 查看文件前 3 行
cat file1 | tail -3     # 查看文件后 3 行
```

补一句实战用法，排查线上问题时最常用的其实是 `tail -f 日志文件`，它会挂在那里持续输出新增内容，你在浏览器点一下，日志立刻滚出来，比反复 `cat` 高效得多。

### 2.4 在服务器上找文件和找内容

这是两件事，很多人会搞混。找文件名用 `find`，找文件里的内容用 `grep`。

```bash
find / -name httpd.conf     # 从根目录开始，查找文件名为 httpd.conf 的文件
find 目录 -name 文件名        # 通用格式
```

`find /` 会扫全盘，机器上文件多的时候要等一会儿，能缩小范围就缩小，比如 `find /etc -name '*.conf'`。

找内容这块，典型场景是「我知道 `httpd.conf` 里有个 `listen` 配置，但不知道在第几行」。

```bash
cat httpd.conf | grep listen           # 找出含 listen 的行
cat httpd.conf | grep -i listen        # 忽略大小写
```

原文这里写过 `grep -ignore listen` 这种形式，实测在 GNU grep 上会报 `invalid option`，正确的长选项是 `--ignore-case`，短选项就是 `-i`。另外 `cat 文件 | grep 关键字` 多起了一个进程，直接 `grep -i listen httpd.conf` 效果一样且更省。

如果已经在 `vi` 里面了，就用 vi 自带的搜索。

```bash
vi httpd.conf
# 然后输入 /Listen 回车，跳到第一处匹配
# 按 n 跳下一个，按 N 跳上一个
```

`n` 和 `N` 的方向别记反了，小写往下，大写往上。

### 2.5 目录管理

```bash
mkdir dir1 dir2 dir3        # 一次创建多个目录
rm -rf dir1 dir2            # 删除目录
rm -rf dir*                 # 删除所有以 dir 开头的文件和目录
mv dir1 dir11               # 重命名目录或移动目录
ls                          # 查看目录
ll                          # 长格式查看
```

`rm -rf` 的 `-r` 依然是递归删除目录下面文件以及子目录下文件，`-f` 依然是强制删除，忽略不存在的文件，从不给出提示。带通配符的那条尤其危险，`rm -rf dir *` 中间多打一个空格，就变成删掉当前目录下所有东西了。

部署时经常要一次性建出好几层目录，一个个 `mkdir` 太慢。

```bash
mkdir -p a/b/c/d/e/f/g      # 递归创建多层级目录，中间不存在的自动补
tree a                      # 递归查看目录结构
yum install tree -y         # tree 命令不存在的话需要先装
cp -rf wwwroot/ mywwwroot/  # 复制目录
```

`mkdir -p` 还有个附带好处，目录已存在时它不会报错，写在部署脚本里很省心。

### 2.6 打包压缩，zip、tar.gz、tar 和 xz

前端把 `dist` 传到服务器、或者从服务器上把日志拉回来分析，第一步都是打包。这几种格式在 Linux 上的地位不一样，用错场合会很难受。

zip 的好处是 Windows 那边双击就能开，跨系统传文件优先选它。

```bash
yum install -y unzip zip        # 安装 zip 解压软件

zip -r public.zip public        # -r 递归，把指定目录下的所有子目录以及文件一起处理
unzip public.zip                # 解压到当前目录
unzip public.zip -d dir         # 解压到指定目录 dir
unzip -l public.zip             # 只看包里有什么，不解压
```

`unzip -l` 这个习惯值得养成。拿到一个来路不明的压缩包，先列一下内容再解，免得它没有顶层目录，一解压把当前目录糊得到处都是文件。

gz 这条线是 Linux 上的默认选择，源代码分发基本都是 `.tar.gz`。这里要先分清 tar 和 gz 是两件事。Linux 下最常用的打包程序就是 tar 了，使用 tar 程序打出来的包我们常称为 tar 包，tar 包文件的命名通常都是以 `.tar` 结尾的。生成 tar 包后，就可以用其它的程序来进行压缩，所以先讲 tar 命令的基本用法。

```bash
tar czvf public.tar.gz public   # 制作 gz 包
tar xzvf public.tar.gz          # 解压 gz 包
tar tf public.tar.gz            # 查看 gz 包内容
```

这几个字母拆开看就不用背了。`c` 是 create 建包，`x` 是 extract 解包，`t` 是 list 列内容，`z` 表示走 gzip，`v` 是 verbose 打印过程，`f` 后面跟文件名。所以 `czvf` 是「建包，走 gzip，打印过程，文件名是」，`xzvf` 就是把 `c` 换成 `x`。

只打包不压缩的场景也有，比如本来就是一堆已经压过的图片，再压一遍纯属浪费 CPU。

```bash
tar cvf wwwroot.tar wwwroot     # 仅打包，不压缩
tar xvf wwwroot.tar             # 解压 tar 包
```

xz 这个压缩相信很多人陌生，但 xz 是绝大多数 Linux 默认就带的一个压缩工具，压缩率相当高。原文里写 xz 格式比 7z 还要小，这个结论得看具体文件类型，对文本和二进制的表现差别不小，不能一概而论。它的代价是压缩很慢，适合「压一次、分发很多次」的场景。

xz 本身只管压缩单个文件，不负责打包，所以要先 tar 再 xz。

```bash
# 制作
tar cvf xxx.tar xxx     # 先创建 xxx.tar 文件
xz xxx.tar              # 压缩成 xxx.tar.xz，删除原来的 tar 包
xz -k xxx.tar           # 压缩成 xxx.tar.xz，保留原来的 tar 包

# 解压
xz -d  ***.tar.xz       # 先解压 xz，删除原来的 xz 包
xz -dk ***.tar.xz       # 先解压 xz，保留原来的 xz 包
tar -xvf ***.tar        # 再解压 tar

# 查看
xz -l ***.tar.xz        # 看压缩率等信息
```

`-k` 就是 keep，不加它原文件会被吃掉，这个我踩过一次，压完发现源文件没了，还好那次是可以重新生成的。

补一个更省事的写法，现代 tar 直接支持 `-J` 参数走 xz，`tar cJvf xxx.tar.xz xxx` 一步到位，不用分两次敲。

### 2.7 alias 别名管理

服务器上有些路径长得离谱，每天敲十几次很折磨。别名就是给一长串命令起个短名字。

```bash
alias chttp='cat /etc/httpd/conf/httpd.conf'    # 添加别名
chttp                                            # 直接用短名字

unalias chttp                                    # 删除别名
alias                                            # 查看当前所有别名
```

这样定义的别名只在当前会话有效，退出登录就没了。想永久生效，写进 `~/.bashrc`（如果你的 shell 是 zsh 就写 `~/.zshrc`），然后 `source ~/.bashrc` 让它立刻生效。

我自己在服务器上常挂两个，一个是 `alias ll='ls -alh'`，另一个是把项目日志目录起个短名，排查时少敲十几个字符。

### 2.8 用户与用户组

上面提过一次 `useradd`，这里补全一整套。

```bash
useradd lisi        # 添加用户
passwd lisi         # 设置密码
userdel -r lisi     # 删除用户，-r 递归删除该用户目录下的文件以及子目录下文件
id lisi             # 查看用户属于哪些组、uid 和 gid 是多少
```

有个行为要留意，删除用户的时候，同名的用户组也会被一起删掉。如果你把别的用户也挂在这个组下面，删之前先确认一下。

组的作用是批量授权。与其给十个用户挨个授权，不如把他们放进一个组，然后给组授权。

```bash
gpasswd -a testuser root    # 把用户 testuser 加入到 root 组
gpasswd -d testuser root    # 把用户 testuser 移出 root 组
```

把用户 `testuser` 加入到 `root` 组之后，`testuser` 会同时获取到自己主组及 `root` 组的所有权限。生产环境上这条命令要慎用，等于给了这个账号一大片权限。更常见的做法是配 `sudoers`，按命令粒度授权，而不是直接塞进 root 组。

### 2.9 权限管理，rwx 与 755 到底在说什么

先看一行 `ll` 的输出。

```bash
drwxr-xr-x.   2 root root 6 4月  11 2022 mnt
```

开头那一串把它拆成四段读就清楚了。第一个字符 `d` 表示这是个目录，普通文件是 `-`。后面九个字符三个一组。

- `rwx` 所有者对 `mnt` 有读、写、执行权限，对应 `u`
- `r-x` 所有者所在的组对 `mnt` 有读和执行权限，对应 `g`
- `r-x` 其他用户对 `mnt` 也具有读和执行权限，对应 `o`

三种权限的含义是，`r` 读，`w` 写，`x` 执行。

四种身份的写法是，所有者 `user u`，所属组 `group g`，其他用户 `other o`，所有用户 `all a`，其中 `u + g + o = a`，也就是所有人。

同样是 `rwx` 三个字母，落在目录上和落在文件上，含义完全不一样，这块是最容易想当然的地方。

目录的 rwx：

- `r` 查看目录里面的文件，权重 4
- `w` 在目录里创建或删除文件，权重 2
- `x` 切换进目录，权重 1

文件的 rwx：

- `r` 查看文件内容
- `w` 在文件里写内容
- `x` 执行该文件（文件不是普通文件，是程序或脚本）

有个反直觉的点，删掉一个文件靠的不是这个文件的 `w` 权限，而是它所在目录的 `w` 权限。这也是为什么有时候你对某个文件明明没有写权限，却照样能把它删掉。

那 `755` 这种数字又是怎么来的呢？把每一组的 `r=4`、`w=2`、`x=1` 加起来就是了。`rwx` 是 4+2+1=7，`r-x` 是 4+0+1=5，所以 `rwx r-x r-x` 写成数字就是 `755`。

改权限用 `chmod`，`+` 增加权限，`-` 删除权限。

```bash
chmod u+x my.sh                 # 给所有者分配执行 my.sh 的权限
chmod o+r,o+w file.txt          # 给其他用户分配对 file.txt 的读写权限
chmod o+r,o+w,o+x mnt/          # 给所有其他用户分配对 mnt 目录的进入、读取、写入权限
chmod -R o+r,o+w,o+x mnt/       # -R 递归，修改目录下的所有文件的权限
chmod 755 file                  # 用数字一次设定三组权限
chmod -R 777 wwwroot/           # 递归改成所有人可读可写可执行
```

`chmod -R 777` 是新手最爱、也是安全审计最恨的一条。权限不对的时候一律 777 确实能立刻解决问题，但它等于把这个目录对机器上所有账号敞开。Web 目录给 `755`、需要写入的上传目录给 `775` 并配好属主，是更稳的做法。

我一开始也是遇到权限问题就 777，后来在一台被扫描器扒过的机器上看到 upload 目录里躺着一堆 php 文件，才老实下来。

## 三、软件安装的三条路，rpm、yum 与源码编译

在 CentOS 上装东西，说到底就三种方式。理解它们的差别，比记住命令更重要。

`rpm` 是最底层的包管理器，你手上得有一个 `.rpm` 文件，它负责安装这一个文件，依赖不管。`yum` 是套在 `rpm` 外面的一层，它知道去哪个仓库下载、自动把依赖一并装好，日常九成场景都用它。源码编译是最后的退路，当仓库里的版本太老、或者你需要开某个默认没编进去的特性时才走这条路。

### 3.1 rpm 安装、卸载与查找

老一点的环境会从光盘装包，先得把光盘挂载到文件系统上。

```bash
mount /dev/cdrom /media     # 挂载光盘到 /media
df                          # 查看光盘是否挂载成功
umount /media               # 卸载
```

挂好之后就能装了。

```bash
rpm -ivh xxx.rpm            # 安装 rpm 软件包
rpm -e net-tools            # 卸载，net-tools 是要卸载的软件包名
rpm -ql net-tools           # 查看软件包装到哪了，以及是否已安装
```

`-ivh` 三个字母分别是 install、verbose、hash（用 `#` 号画进度条），连在一起是约定俗成的写法。

`rpm` 装包最大的问题是依赖，它会直接告诉你「缺 A、缺 B」然后退出，让你自己去找。所以能用 `yum` 就别手动 `rpm`。

### 3.2 yum 安装、卸载与查询

先看几个前端上服务器基本一定会装的包。

```bash
yum install -y net-tools        # 包括 netstat、ifconfig 等命令
yum install -y unzip zip        # zip 压缩解压
yum install -y mlocate          # 提供 locate，装完先跑一次 updatedb 建索引
yum install -y wget             # 下载文件包
yum -y install psmisc           # 提供 pstree，pstree | grep httpd 查看进程，pstree -p 显示进程及子进程
```

`-y` 的意思是「所有确认一律回答 yes」，写在自动化脚本里必加，不然它会停在那里等你敲回车。

卸载和搜索：

```bash
yum -y remove wget      # 卸载 rpm 包
yum search nginx        # 按名称搜索 rpm 包
```

查询这块命令有好几个，用途各不相同。

```bash
yum list                        # 列出全部
yum list | grep httpd           # 只看 httpd 相关
yum list updates                # 列出所有可更新的软件包
yum list installed              # 列出所有已安装的软件包
```

装之前想先了解一下这个包是干嘛的、版本多少，用 `yum info`。

```bash
yum info package1
yum info httpd
yum info zip
yum info unzip
```

拿 Apache 练个手，从装到启动就三步。

```bash
yum -y install httpd            # 安装 apache
service httpd start             # 启动 apache
systemctl stop firewalld        # 关闭防火墙，否则外网访问不到 80 端口
```

关防火墙只适合本地验证，公网机器上千万别这么干，正确做法是只开你需要的那个端口，第五节会讲。

两个配置文件的位置记一下。yum 的主配置文件是 `/etc/yum.conf`，仓库配置文件在 `/etc/yum.repos.d/*.repo`。后面装 MongoDB、MySQL、Docker，其实都是往 `/etc/yum.repos.d/` 里丢一个 `.repo` 文件，告诉 yum 多一个下载源。

### 3.3 用 yum 装 Nginx

官方仓库里的 Nginx 版本通常偏老，一般会先加 Nginx 官方源。

```bash
sudo rpm -ivh http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-7-0.el7.ngx.noarch.rpm
```

加完之后先确认源生效了再装，不然装到的还是老版本。

```bash
yum search nginx        # 看看是否已经添加源成功
yum info nginx          # 或者看包信息里的 Repo 字段，确认来自 nginx 源
```

原文这里写的是 `npm info nginx`，那是 Node 的包管理器，跟 Nginx 源没有任何关系，应该是 `yum info nginx`，这里一并改掉。

确认无误后安装并设置开机自启。

```bash
sudo yum install -y nginx

sudo systemctl start nginx.service      # 启动
sudo systemctl enable nginx.service     # 设置开机自动运行
```

`start` 和 `enable` 是两件事，很多人只跑了 `start`，结果机器一重启服务就没了。`enable` 才是「下次开机也自动拉起来」。

### 3.4 源码编译安装

走到这一步，通常是因为你需要一个仓库里没有的版本，或者要开某个编译期才能决定的特性。

先把编译工具链装上。

```bash
yum install -y gcc make gcc-c++ openssl-devel
```

检查系统中是否已经安装 gcc：

```bash
rpm -qa | grep gcc      # 看有没有装
rpm -ql gcc             # 看装在哪
```

编译安装源代码包的流程固定是三步，生成编译配置文件（`Makefile`），开始编译（`make`），开始安装（`make install`）。

以安装 `httpd-2.2.9.tar.gz` 为例。

```bash
# 解压并 cd 到对应目录
./configure --prefix=/usr/local/apache      # 安装路径设置为 /usr/local/apache
make            # 单核编译
make -j4        # 4 个核并行编译，快很多
make install
```

原文这条 `./configure` 写的是 `--prefix=/usr/local/nodejs`，但注释说的是安装到 `/usr/local/apache`，前后对不上，装 httpd 应该用 apache 那个路径，这里改正了。

`--prefix` 决定了这个软件所有文件的落脚点。把它指到 `/usr/local/xxx` 而不是让它散落到系统各处，是源码安装的基本纪律，删的时候整个目录一删就干净。

`make -j4` 里的数字建议不要超过你的核数，`nproc` 可以查当前机器几个核。核少的机器上开太大反而会因为内存不够被 OOM 掉。

说到删，源码装的东西没有包管理器帮你记账，卸载得手动来，顺序是先结束进程再删目录。

```bash
# 结束进程
pstree | grep httpd     # 先确认进程还在
pkill httpd             # 结束掉

# 删除源代码
cd /usr/local/
rm -rf apache/          # 直接删掉整个安装目录
```

Node 也可以走源码安装这条路，流程一模一样。

```bash
# 1. 下载 nodejs 源码包
# 2. 解压到 /usr/local/nodejs 目录
./configure
make            # 或者 make -j4
make install
```

不过说实话，前端在服务器上装 Node，我极少走源码编译。Node 源码编译一次十几分钟起步，而官方给的二进制包解压就能用，第十节会讲那种更省事的做法。真要管多版本，`nvm` 比什么都强。

## 四、服务器变慢或者端口不通时的排查顺序

这一节是全篇最实用的部分。线上出问题的时候，你手上只有一个终端，得在几分钟内判断出是 CPU 打满了、内存吃光了、磁盘写满了，还是进程压根没起来。

我自己的顺序固定是这样，先 `top` 看整体，再 `ps` 定位到具体进程，然后 `netstat` 确认端口有没有监听，最后 `df` 排除磁盘满这种低级但高频的原因。

### 4.1 top，一屏看完整机状态

`top` 命令能查看内存、CPU、进程以及服务器负载。它的前四行信息密度最高，值得逐行拆开看。

第一行是整机负载。

```bash
top - 15:31:47 up  9:30,  3 users,  load average: 0.00, 0.02, 0.05
```

依次对应系统当前时间、up 后面是系统到目前为止运行的时间、当前登录系统的用户数量，`load average` 后面的三个数字分别表示距离现在一分钟、五分钟、十五分钟的负载情况。

判断负载高不高，得拿这三个数字跟 CPU 核数比。4 核机器上 `load average` 到 4 就已经满了，到 8 就是严重排队。还有个技巧是看趋势，一分钟的值远大于十五分钟的值，说明压力是刚上来的，多半跟你刚发的版本有关。

第二行是进程数量。

```bash
Tasks: 133 total,   1 running, 132 sleeping,   0 stopped,   0 zombie
```

`tasks` 表示任务（进程），`133 total` 表示现在有 133 个进程，其中处于运行中的有 1 个，132 个在休眠（挂起），`stopped` 状态即停止的进程数为 0，`zombie` 状态即僵尸的进程数为 0 个。

僵尸进程数如果一直涨，那是父进程没有回收子进程，Node 里用 `child_process` 又没处理退出事件时很容易出现，这个数字值得盯一眼。

第三行是 CPU 状态。

```bash
%Cpu(s):  0.2 us,  0.4 sy,  0.0 ni, 99.3 id,  0.0 wa,  0.0 hi,  0.1 si,  0.0 st
```

平时只看空闲那一项就够了，`99.3 id` 就是 CPU 空闲率 99.3%。真出问题的时候多看一个 `wa`，它是等待 IO 的时间占比，这个数字高说明瓶颈在磁盘或者网络，不在 CPU，光加 CPU 没用。

第四行是内存状态。

```bash
KiB Mem :  2897496 total,  1995628 free,   191852 used,   710016 buff/cache
```

换算一下，总内存 2.76G，空闲是 1995628/1024/1024 约等于 1.9G，已经使用 0.18G，缓存区内存 0.67G。缓冲区是从主内存中特地预留出的内存，用来存放特定的一些信息，例如从磁盘中取得的文件表、程序正在读取的内容等等。

很多人第一次看到 `buff/cache` 占了一大块会慌，以为内存快满了。那部分是可回收的，系统需要时会自动让出来，不用管它。

### 4.2 谁登录过这台机器

多人协作的机器上，出了问题第一件事有时候是搞清楚刚才谁动过。

```bash
who         # 显示当前正在系统中的所有用户名字、使用的终端设备号、注册时间
whoami      # 显示出当前终端上使用的用户
last        # 显示近期用户或终端的登录情况
```

`last` 会读 `/var/log/wtmp`，能翻到相当久之前的记录，包括每次登录的来源 IP。机器被人爆破过的话，这里一眼就能看出来。

### 4.3 查看进程

进程这块有两套工具，`pstree` 看的是父子关系，`ps` 看的是扁平列表。排查「服务到底起没起来」用 `ps`，排查「这一堆进程是谁拉起来的」用 `pstree`。

```bash
pstree                      # 查看进程树
pstree -ap                  # 显示所有信息，带命令行参数和 pid
pstree | grep httpd         # 只看 httpd 相关
pstree -ap | grep httpd
```

`ps` 这边最常用的就三条。

```bash
ps -au
ps -au | grep httpd
ps -aux
```

`ps` 中 `aux` 三个字母的含义分别是：

- `a` 显示现行终端机下的所有程序，包括其他用户的程序
- `u` 以用户为主的格式来显示程序状况
- `x` 显示所有程序，不以终端机来区分

原文这里把 `u` 和 `x` 的解释写反了，按 `ps` 的 man 手册，`u` 是 user-oriented 输出格式，`x` 才是「不受终端限制」，这里改正过来。

实战里我最常敲的是 `ps -ef | grep node`，先拿到 pid，再去看它的启动参数对不对，很多「配置没生效」的问题在这一步就能看出来，因为你会发现进程还挂着上一版的参数在跑。

### 4.4 关闭进程

```bash
pkill httpd     # 按进程名字杀
kill 2245       # 按进程号杀
kill -9 1234    # 强制杀死
```

`kill` 和 `kill -9` 的区别值得单独说，很多人上来就 `-9`，习惯不太好。

执行 `kill` 命令，系统会发送一个 SIGTERM 信号给对应的程序。当程序接收到该信号后，可能出现几种情况：程序立刻停止；当程序释放相应资源后再停止；程序可能仍然继续运行。

大部分程序接收到 SIGTERM 信号后，会先释放自己的资源，然后再停止。但是也有程序可能接收信号后做一些其他的事情，如果程序正在等待 IO，可能就不会立马做出响应。我在使用 wkhtmltopdf 转 pdf 的项目中就遇到过这现象，也就是说，SIGTERM 多半是会被阻塞的。

`kill -9` 命令，系统给对应程序发送的信号是 SIGKILL。这个信号不会被程序捕获、忽略或阻塞，内核直接把进程干掉，所以 `kill -9` 能顺利杀掉进程。

代价是进程没有机会做任何收尾。数据库连接不会正常关闭，写到一半的文件可能损坏，PM2 之类的进程管理器也来不及做优雅退出。所以正确顺序是先 `kill`，等几秒还在再 `kill -9`。

### 4.5 查看端口

部署完发现浏览器打不开，先别急着怀疑代码，看端口有没有监听。

```bash
netstat -tunpl | grep httpd
```

这几个参数拆开是，`-t` 看 TCP，`-u` 看 UDP，`-n` 直接显示数字不做域名解析（快很多），`-p` 显示占用端口的进程和 pid，`-l` 只看处于监听状态的。

结果分三种情况。端口压根没出现，说明进程没起来或者起在别的端口上；端口监听在 `127.0.0.1` 上，那外网访问不到，得改成 `0.0.0.0`；端口在监听但外面还是连不上，那就是防火墙或者云厂商的安全组没放行，第五节接着说。

新系统上 `netstat` 可能没装，`ss -tunlp` 是它的现代替代品，参数几乎一样，输出更快，`net-tools` 装不上的时候用它。

### 4.6 查看硬盘

磁盘写满导致服务挂掉，这个原因出现频率比想象中高得多，尤其是日志没做轮转的机器。

```bash
df          # 列出文件系统的整体磁盘空间使用情况
df -h       # 以人们易读的方式显示，总共多少 g 用了多少 g
df /home    # 查看该文件夹所在磁盘的使用情况
```

`df -h` 的 `-h` 就是 human-readable，直接给你 `G` 和 `M`，不用自己数零。

看到某个分区 `Use%` 到 100% 之后，用 `du -sh /* | sort -h` 一层层往下找，通常就是某个日志文件或者 Docker 的 `/var/lib/docker` 目录撑起来的。

还有个坑，`df` 显示还有空间但依然报磁盘满，那多半是 inode 用光了，`df -i` 能看出来，一般是某个目录下堆了几百万个小文件。这个我排查了一下午才想起来看 inode。

## 五、服务与端口，systemctl 管进程，firewalld 管出入口

上一节最后留了个尾巴，端口在监听但外面连不上。原因通常在这一节。服务本身归 `systemctl` 管，能不能被外面访问到归防火墙管，两件事分开看就不会乱。

### 5.1 systemctl 管理服务

还是拿 httpd 当例子。

```bash
yum install -y httpd
systemctl start httpd
```

`systemctl` 是 systemd 提供的统一入口，CentOS 7 之后所有服务都归它管，语法是 `systemctl 动作 服务名`，记住动作就够了。

```bash
systemctl start httpd       # 启动服务
systemctl stop httpd        # 关闭服务
systemctl restart httpd     # 重启服务
systemctl status httpd      # 查看一个服务的状态
systemctl is-active httpd   # 查看一个服务是否在运行
```

`systemctl status` 是排查启动失败的第一现场，它会把最近几行日志一起打出来，配置写错了一般在这里就能看到具体是哪一行。

想知道机器上都跑着什么：

```bash
systemctl list-units -t service      # 查看当前已经运行的服务
systemctl list-units -at service     # 列出所有服务，注意 -at 的顺序
```

开机自启是另一套开关，跟当前是否运行完全独立。

```bash
systemctl enable httpd      # 设置开机自启动
systemctl disable httpd     # 停止开机自启动
```

列出所有自启动服务：

```bash
systemctl list-unit-files | grep enabled
systemctl list-unit-files | grep disabled
systemctl list-unit-files | grep disabled | grep httpd
```

改完配置文件不想中断服务，用 `reload` 而不是 `restart`。

```bash
systemctl reload httpd      # 使指定服务重新加载配置
```

`reload` 和 `restart` 的差别在有没有断连。Nginx 上这个区别尤其明显，`reload` 是平滑的，老连接处理完再退出，线上改配置应该优先用它，实在不行再 `restart`。

### 5.2 firewalld 防火墙

CentOS 7 默认的防火墙是 firewalld，服务本身依然由 `systemctl` 管。

```bash
systemctl start firewalld       # 启动
systemctl stop firewalld        # 关闭
systemctl status firewalld      # 查看状态
systemctl disable firewalld     # 开机禁用
systemctl enable firewalld      # 开机启用
```

规则则由 `firewall-cmd` 来配。那怎么开启一个端口呢？

```bash
firewall-cmd --zone=public --add-port=80/tcp --permanent
```

`--permanent` 表示永久生效，没有此参数重启后失效。这个参数漏掉是新手最常见的坑，当时测着没问题，机器一重启端口又关上了。

改完必须重新载入才会生效。

```bash
firewall-cmd --reload           # 修改 firewall-cmd 配置后必须重载
```

查询、删除和列表：

```bash
firewall-cmd --zone=public --query-port=80/tcp               # 查看某个端口是否放行
firewall-cmd --zone=public --remove-port=80/tcp --permanent  # 删除放行规则
firewall-cmd --zone=public --list-ports                      # 查看所有打开的端口
```

原文这几条里 `--zone=` 后面多了个空格写成 `--zone= public`，实际执行会报参数错误，这里去掉了。

顺着上面聊，如果你用的是腾讯云、阿里云这类云主机，除了机器上的 firewalld，控制台还有一层安全组。两层都放行了才通。我见过太多人在机器上折腾半天，最后发现是安全组没开。遇到端口不通，先去控制台看一眼安全组，能省很多时间。

### 5.3 SELinux

SELinux 是另一层强制访问控制，它跟防火墙不是一回事，但同样能让你的服务莫名其妙访问不了文件或者绑不上端口。教程里通常直接把它关掉。

```bash
# 修改 /etc/selinux/config 文件
# 将 SELINUX=enforcing 改为 SELINUX=disabled
```

改完需要重启机器才彻底生效，临时生效可以用 `setenforce 0`。

不是说关掉它不行，而是这么做等于扔掉了一层防护。规范的做法是用 `semanage` 给对应目录和端口打上正确的标签，只是配置成本高，多数中小项目直接关了。这块我自己也是关掉了事，属于知道更好的做法但没坚持下去的那种。

## 六、把每天的登录成本降下来，ssh 别名、免密与保活

如果你手上只有一台服务器，敲全 IP 也就算了。管三台以上之后，每次都要回想「哪台是测试、哪台是预发」，还要输密码，一天下来光在登录上就耗掉不少时间。这一节的三个配置花十分钟做一次，之后一直受益。

### 6.1 登录服务器，ssh

ssh 的全称是 `secure shell protocol`，以更加安全的方式连接远程服务器。

```bash
# root: 用户名
# 192.168.13.21
$ ssh root@192.168.13.21
```

格式就是 `ssh 用户名@主机地址`，端口不是默认 22 的话再加 `-p 端口号`。

### 6.2 配置别名快速登录，ssh-config

在本地电脑上配置 `ssh-config`，对自己管理的服务器起别名，可以更方便地登录多台云服务器。

配置文件有两个位置。

```bash
/etc/ssh/ssh_config

~/.ssh/config
```

前者是系统级的，对所有用户生效；后者是当前用户的，改它就够了，也不需要 sudo。

示例：

```bash
# 修改~/.ssh/config配置
Host tencent # 服务器别名
  HostName 43.12.151.18
  User root

Host server # 服务器别名
  HostName 192.168.105.130
  User root
```

顺带说一句，原文这里的示例 IP 写的是 `413.12.151.18`，IPv4 每一段最大 255，`413` 不是个合法地址，这里改成了 `43.12.151.18`。

配置成功之后直接 `ssh` 加别名就可以登录了。

```bash
# 登录服务器1
ssh tencent

# 登录服务器2
ssh server
```

这个配置不只对 `ssh` 生效，`scp`、`rsync`、`git` 都认它。所以配好之后，`rsync -avz dist/ tencent:/var/www/` 这种写法也能直接用，后面第八节会用到。

### 6.3 免密登录，public-key 与 ssh-copy-id

原理是把自己的公钥放在远程服务器的 `authorized_keys` 中，也就是把本地文件 `~/.ssh/id_rsa.pub` 中的内容复制粘贴到远程服务器的 `~/.ssh/authorized_keys`。

手动做就是 Ctrl-C 与 Ctrl-V 的操作，不过还有一个更有效率的工具，`ssh-copy-id`。

```bash
# 在本地环境进行操作

# 提示你输入密码，成功之后可以直接 ssh 登录，无需密码
$ ssh-copy-id tencent

# 登陆成功，无需密码
$ ssh tencent
```

它比手动复制强在会顺便处理好权限。`~/.ssh` 必须是 `700`、`authorized_keys` 必须是 `600`，权限太松的话 sshd 会直接拒绝这个公钥，还不给什么明显提示，手动复制最容易栽在这一步。

登录成功后，可以在服务器上看到 `authorized_keys` 中的公钥信息。

```bash
# 登录成功服务器，可以看到authorized_keys中的公钥信息

Last login: Tue Jun 28 09:31:25 2022
[root@VM-8-14-centos ~]# cat ~/.ssh/authorized_keys

ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCf4fy+KhLFADybnII3OOOI0MAghkuYgEqPLAbhQfrL+zjj1qSoX1dnaZ9PULykGU+QN4nyRrduZOgvDaUCMR+vPDJH3Nii45HUuKWBpdyA/L1sQ7pLKsBsOca7HK4U0P7lrux2IfnOmbYCz4xPsbc/RDArkYbc2uIszmwvdtgGL49fJn6VUC0TaQvRX5dQWznyC3HgarBze2NoilXfKsBr5V2Moc83QkUZdU8fFiiiolpDHf2narGwz+r1bhZrazfI72nOUTjXd5GXd+VOnZdxnk8njBeAAW87RwZ3b2Cg5FsEckzKWP5ddvVxoPEv8cmk= xx@qq.com
[root@VM-8-14-centos ~]#
```

一台机器可以放多个公钥，一行一个，团队里几个人各自把自己的公钥追加进去就行，不用共用同一把私钥。

本地要是还没有密钥对，先跑 `ssh-keygen -t ed25519` 生成一对。现在更推荐 ed25519 而不是老的 RSA，密钥更短、验签更快，OpenSSH 6.5 之后就支持了。

### 6.4 保持连接，防止断掉

挂在服务器上看日志，一走神回来发现连接断了，这个体验很糟。我们可以通过 `man ssh_config` 找到每一项的详细释义（原文写的是 `man ssh-config`，实际手册页名是下划线的 `ssh_config`）。

```bash
# 编辑 ~/.ssh/config

Host *
  ServerAliveInterval 30
  TCPKeepAlive yes
  ServerAliveCountMax 6
  Compression yes
```

逐条解释一下这四项在干嘛。`ServerAliveInterval 30` 是客户端每 30 秒主动发一个探测包，让中间的 NAT 和防火墙认为这条连接还活着。`ServerAliveCountMax 6` 是连续 6 次没收到回应才判定断开，配合前一项就是 3 分钟的容错。`TCPKeepAlive yes` 走的是 TCP 层的保活。`Compression yes` 开启传输压缩，网络差的时候体感提升明显，本地内网反而可能因为压缩开销变慢。

`Host *` 表示这些配置对所有主机生效，写在文件最后面。

## 七、环境变量，从 printenv 到前端最常用的 NODE_ENV

前端对环境变量其实不陌生，`process.env.NODE_ENV` 天天在用。但到了服务器上，很多人会卡在「我明明 export 了，重新登录就没了」这种问题上。先把变量从哪来、活多久搞清楚，后面配 Node、Nginx 都会顺。

通过 `printenv` 可获得系统的所有环境变量。

```bash
$ printenv

TERM_SESSION_ID=w0t0p0:5D9702D2-F505-4D4D-B65B-745A4055x4D13
SSH_AUTH_SOCK=/private/tmp/com.apple.launchd.mIeXmJ4KFo/Listeners
LC_TERMINAL_VERSION=3.4.15
COLORFGBG=7;0
ITERM_PROFILE=Default
XPC_FLAGS=0x0
LANG=zh_CN.UTF-8
PWD=/Users/poetry
SHELL=/bin/zsh
TERM_PROGRAM_VERSION=3.4.15
```

输出量不小，一般会接个 `grep` 只看关心的那几个。我们也可以通过 `printenv` 直接获得某个环境变量的值。

```bash
$ printenv NVM_BIN

/Users/poetry/.nvm/versions/node/v16.15.0/bin
```

通过 `$var` 或者 `${var}` 可以取得环境变量，并通过 `echo` 进行打印。

```bash
$ echo $path

/Users/poetry/.nvm/versions/node/v16.15.0/bin /opt/anaconda3/bin /usr/local/bin /usr/local/sbin /usr/local/bin /usr/bin /bin /usr/sbin /sbin
```

这里有个容易踩的点。上面这条在 zsh 下能跑通，是因为 zsh 把小写的 `$path` 维护成一个数组，和大写的 `$PATH` 双向绑定。换到 bash 里 `echo $path` 会输出空的，因为环境变量区分大小写，正确写法是 `echo $PATH`，各段之间用冒号分隔而不是空格。

几个天天见的变量：

- `$HOME` 当前用户目录，也就是 `~` 目录
- `$USER` 当前用户名
- `$PATH` 可执行文件的搜索路径列表
- `$SHELL` 当前用户的 shell，比如 `bash`、`zsh`、`fish` 等

`export` 可以用来设置环境变量。

```bash
$ export PATH=/usr/local/bin:$PATH
$ export NODE_ENV=production

$ echo $NODE_ENV
production

# 如果需要使得配置的环境变量永久有效，需要写入 ~/.bashrc 或者 ~/.zshrc
```

改 `PATH` 时把新路径放在前面还是后面，结果不一样。`PATH=/usr/local/bin:$PATH` 是让新路径优先，`PATH=$PATH:/usr/local/bin` 是垫底。装了多个版本的 Node 之后 `node -v` 显示的到底是哪个，就取决于这个顺序。

回到「重新登录就没了」这个问题。`export` 只在当前 shell 会话内有效，退出就还原。写进 `~/.bashrc` 或者 `~/.zshrc` 才会每次登录自动加载。还有一层要注意，systemd 拉起来的服务不会读你的 `~/.bashrc`，所以用 `systemctl` 跑的 Node 服务拿不到你在终端里配的变量，得写在 service 文件的 `Environment=` 里，或者用 PM2 的 ecosystem 配置来传。

在执行命令之前置入环境变量，可以指定仅在该命令中有效的环境变量。

```bash
# 该环境变量仅在当前命令中有效
$ NODE_ENV=production printenv NODE_ENV
production

# 没有输出
$ printenv NODE_ENV

# 在前端中大量使用，如
$ NODE_ENV=production npm run build
```

这个写法在前端构建脚本里到处都是。跨平台是它唯一的问题，Windows 的 cmd 不认这种前置写法，所以社区才有了 `cross-env` 这个包。现在 npm scripts 里如果只跑在 Linux 和 macOS 上，直接用原生写法就行，没必要多装一个依赖。

## 八、用 rsync 替代 cp

rsync 是一个快速高效、支持断点续传、按需复制的文件拷贝工具，并且支持远程服务器拷贝。我的建议是在本地也用 `rsync` 替换 `cp` 进行文件拷贝。

它比 `cp` 强的地方在于「只传差异」。前端发版时 `dist` 目录动不动几百个文件，改动的可能就三个，`rsync` 会比对之后只传那三个，第二次之后的部署几乎是秒完成。

```bash
# 将本地的test目录拷贝到服务器的/home目录
#
# -l：--links，拷贝符号链接
# -a：--archive，归档模式
# -h：--human-readable，可读化格式进行输出
# -z：--compress，压缩传输
# -v：--verbose，详细输出
$ rsync -lahzv ~/Download/test root@192.168.12.12:/home
```

配合第六节的 ssh 别名，这条命令可以简化成 `rsync -lahzv ~/Download/test tencent:/home`，不用记 IP。

拷贝目录时有个非常容易翻车的细节，要看源目录是否以 `/` 结尾。

- 不以 `/` 结尾，代表将该目录连同目录名一起进行拷贝
- 以 `/` 结尾，代表将该目录下所有内容进行拷贝

也就是说 `rsync -a dist server:/var/www/` 会得到 `/var/www/dist/`，而 `rsync -a dist/ server:/var/www/` 会把 `dist` 里的文件直接铺到 `/var/www/` 下。

这个我踩过，当时少了一个斜杠，线上目录里多套了一层 `dist`，Nginx 的 root 指向不对，页面全 404，愣是找了十几分钟。

再补两个实战里很有用的参数。`--delete` 会把目标端多余的文件删掉，让两边严格一致，做静态资源发布时很需要，但危险，先加 `-n`（也就是 `--dry-run`）空跑一遍看清单再执行。`--exclude='node_modules'` 可以跳过不该传的目录。

## 九、数据库与中间件的裸机安装

这一节讲 MongoDB、MySQL、Redis 直接装在宿主机上的做法。可能有人会问，都 2022 年了为什么不直接上 Docker。原因有两个，一是有些公司的生产规范就是不让数据库跑容器，二是搞懂裸机安装之后，你才知道 Docker 那条 `docker run` 命令背后到底省掉了哪些步骤。Docker 版本的装法在第十二节。

这三个服务的安装套路高度一致，都是「加源、装包、改配置文件放开监听地址、开防火墙端口」四步。看完 MongoDB 那一段，另外两个基本能推出来。

### 9.1 MongoDB 4.x 的安装配置

官方文档在这里，遇到版本差异以它为准：https://docs.mongodb.com/manual/tutorial/install-mongodb-on-red-hat/

第一步是配 yum 源。在路径 `/etc/yum.repos.d/` 下创建文件 `mongodb-org-4.0.repo`。

```bash
cd /etc/yum.repos.d/
touch mongodb-org-4.0.repo
```

然后在文件 `mongodb-org-4.0.repo` 中写入如下内容，直接复制即可，官方文档里也是这一份。

```bash
[mongodb-org-4.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/4.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-4.0.asc
```

这就是第三节说的「往 `/etc/yum.repos.d/` 里丢一个 repo 文件」。`$releasever` 会被 yum 自动替换成系统大版本号，`gpgcheck=1` 表示要校验签名，防止装到被篡改的包。

源配好之后，安装就是一条命令。

```
yum install -y mongodb-org
```

开启 mongodb 服务，然后进终端验证一下。

```bash
systemctl start mongod

# 进入mongod终端
$ mongo
```

看到下面这个交互式终端，就说明服务已经正常起来了。

![MongoDB 安装完成后通过 mongo 命令进入交互式终端](https://s.poetries.top/uploads/2022/06/366a505fdb77ca61.png)

补一句版本上的变化，MongoDB 5.0 之后官方把 `mongo` 这个客户端换成了 `mongosh`，命令名不一样，用法基本兼容。装 4.x 用 `mongo` 没问题，装新版本记得改。

别忘了设置开机启动，不然重启机器服务就没了。

```
systemctl enable mongod
```

#### 远程连接 mongodb

装完之后本机能连、远程连不上，几乎百分之百是这两件事没做，改绑定地址和开端口。

先修改 mongo 配置文件。

```bash
sudo vi /etc/mongod.conf
```

把原来的 `bindIp: 127.0.0.1` 修改为 `0.0.0.0`。

![修改 mongod.conf 把 bindIp 从 127.0.0.1 改成 0.0.0.0](https://s.poetries.top/uploads/2022/06/2e64b45acc69230d.png)

`127.0.0.1` 只监听回环网卡，也就是只有机器自己能连；`0.0.0.0` 表示所有网卡都监听。这块要提醒一句，一旦放开到 `0.0.0.0`，务必同时开启认证并设置强密码。互联网上被扫库的 MongoDB 实例，绝大多数都是「改成 0.0.0.0 但没开认证」这一种。

改完重启服务。

```bash
service mongod restart
```

然后永久开放 `27017` 端口。

```bash
firewall-cmd --zone=public --add-port=27017/tcp --permanent
firewall-cmd --reload
```

`--permanent` 依然是永久生效的意思，没有此参数重启后失效。云主机的话别忘了安全组也要放行。

#### MongoDB 4.x 卸载

卸载比安装麻烦一点，因为数据和日志不会跟着包一起走。

先停服务：

```bash
service mongod stop
```

再删包。先列出所有相关的包，再一次性卸掉。

```bash
rpm -qa | grep mongodb-org                      # 列出所有的包
yum remove -y $(rpm -qa | grep mongodb-org)     # 按列出的结果批量卸载
yum remove -y mongodb-org*                      # 也可以尝试这条
```

最后手动清数据和日志，这一步不做的话磁盘一直被占着。

```bash
rm -r /var/log/mongodb
rm -r /var/lib/mongo
```

删之前最好先确认这台机器上确实不再需要这些数据了，`/var/lib/mongo` 里躺的就是你所有的集合。

### 9.2 MySQL 安装配置

先去官网找 `mysql` 的 `yum` 源 `rpm` 包：https://dev.mysql.com/downloads/repo/yum

本文用的安装源地址是：http://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm

动手前先查一下机器上是不是已经装过了，重复安装会出各种奇怪问题。

```bash
rpm -qa | grep mysql*
yum list installed | grep mysql*
```

安装流程和 MongoDB 一样，加源、装、启动、设开机自启。

```bash
rpm -ivh http://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm    # 安装配置 yum 源
yum -y install mysql-server                                                      # 安装
systemctl start mysqld                                                           # 启动 mysql
systemctl enable mysqld                                                          # 开机启动
```

顺带说一句，MySQL 5.7 的官方支持已于 2023 年 10 月结束，新项目建议直接上 8.0。这里保留 5.7 的写法是因为存量机器上它还非常多，命令本身通用。

#### 改密码这一步最容易卡住

mysql 安装完成之后，在 `/var/log/mysqld.log` 文件中给 `root` 生成了一个默认密码。得先把它捞出来才能登录。

```bash
grep 'temporary password' /var/log/mysqld.log
```

拿到密码后登录，然后立刻改掉。

```bash
mysql -u root -p        # 输入刚才查到的临时密码
```

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'MyNewPass4!';
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';
```

上面第二条大概率会失败，因为默认情况 mysql 对密码要求非常严格，`123456` 这种过不了强度校验。想改宽松一些，就调密码策略。

在 `/etc/my.cnf` 文件添加 `validate_password_policy` 配置来指定密码策略，可选值是 `0（LOW）`、`1（MEDIUM）`、`2（STRONG）`，选择 `2` 需要提供密码字典文件。

```ini
validate_password_policy=0

# 如果不需要密码策略，添加到 my.cnf 中禁用即可
validate_password = off
```

改完重新启动 mysql 服务使配置生效。

```bash
systemctl restart mysqld
```

这里我的态度是，开发和测试环境为了省事关掉无所谓，生产环境别关。数据库是被爆破的头号目标，弱密码加上放开 `0.0.0.0`，基本等于把数据摆在门口。

#### 远程管理 mysql

默认的 `root` 用户只允许从 `localhost` 连，远程要用得把 `host` 改为 `%`。

```bash
	mysql -u root -p
	mysql> use mysql;
	mysql> update user set host = '%' where user = 'root';
	mysql> select host, user from user;
	mysql> select host, user from user;
	+-----------+---------------+
	| host      | user          |
	+-----------+---------------+
	| localhost | mysql.session |
	| localhost | mysql.sys     |
	| localhost | root          |
	+-----------+---------------+
	3 rows in set (0.00 sec)
	mysql> update user set host = '%' where user = 'root';
	Query OK, 1 row affected (0.00 sec)
	Rows matched: 1  Changed: 1  Warnings: 0

	mysql> select host, user from user;
	+-----------+---------------+
	| host      | user          |
	+-----------+---------------+
	| %         | root          |
	| localhost | mysql.session |
	| localhost | mysql.sys     |
	+-----------+---------------+
	3 rows in set (0.00 sec)

	退出mysql

	exit;
```

对照上下两次 `select` 的结果就能看明白，`root` 那一行的 `host` 从 `localhost` 变成了 `%`，`%` 是通配符，表示任意来源地址。

改完 `user` 表之后建议再跑一次 `FLUSH PRIVILEGES;`，让权限表立刻重新加载。另外更规范的做法其实是不动 root，而是单独建一个业务账号并只授予它需要的库，`root` 依然锁死在 `localhost`。

最后配置防火墙，放开 3306。

```bash
firewall-cmd --zone=public --add-port=3306/tcp --permanent
firewall-cmd --reload
```

最后注意，重启一下 `mysql` 让所有配置彻底生效。

### 9.3 安装 Redis

Redis 在前端项目里通常拿来做 session 存储和接口缓存，装起来是这三个里最省事的。

先检查是否有 `redis` 的 yum 源。

```bash
yum search redis
yum info redis
```

CentOS 官方源里通常是没有的，得先装 EPEL 仓库。EPEL（Extra Packages for Enterprise Linux）是基于 Fedora 的一个项目，为「红帽系」的操作系统提供额外的软件包，适用于 RHEL、CentOS 和 Scientific Linux。

```
yum install epel-release -y
```

装完 EPEL 再回头看，这次就能搜到了。

```bash
yum info redis
yum install redis -y
```

安装完毕后，使用下面的命令启动 redis 服务。

```bash
systemctl start redis
systemctl restart redis

# 开机启动
systemctl enable redis
```

Linux 上面进入 Redis 客户端：

```
redis-cli
```

进去之后敲个 `ping`，返回 `PONG` 就说明通了。这里也提醒一句，Redis 的配置文件在 `/etc/redis.conf`，默认同样只绑 `127.0.0.1`，如果要远程连，改 `bind` 的同时一定要设 `requirepass`。裸奔的 Redis 被植入挖矿脚本是最经典的事故之一，我见过不止一次。

## 十、Nginx + Node 部署，一台机器撑起多个站点

到这里前置知识差不多够了，开始干正事。这一节是全篇最贴近前端日常的部分，目标是在一台服务器上跑多个 Node 站点，各自绑不同域名，全部走 80 端口。

整体结构长这样，Nginx 站在最前面监听 80，根据请求的域名把流量分发给后面不同端口的 Node 进程。

![Nginx 作为反向代理在一台服务器上分发多个 Node 站点的架构示意](https://s.poetries.top/uploads/2022/06/f3bd51d6f4acf247.png)

为什么非要在 Node 前面套一层 Nginx？Node 自己不是也能监听 80 吗。能是能，但几件事它做得不如 Nginx 好，静态资源分发、gzip、HTTPS 证书、多域名共用一个端口、限流。而且 80 和 443 是特权端口，Node 直接监听需要 root 权限，安全上不划算。

### 10.1 搭建 Node.js 生产环境

服务器上装 Node 最省事的方式不是源码编译，而是直接用官方二进制包。

下载 nodejs 二进制代码包，然后解压到 `/usr/local/nodejs`，接着配置环境变量。

```bash
vi /etc/profile

# 在文件最后面添加这两行
export NODE_HOME=/usr/local/nodejs/bin
export PATH=$NODE_HOME:$PATH
```

`:wq` 保存，然后运行 `source /etc/profile` 让它立刻生效。

这里写的是 `/etc/profile` 而不是 `~/.bashrc`，区别在于前者对所有用户生效。服务器上如果你的应用是用别的账号跑的，写在 `/etc/profile` 才能保证那个账号也找得到 `node` 命令。

验证一下 `node -v` 和 `npm -v` 都有输出，这一步就算完了。

### 10.2 用 pm2 管理 Node 进程

直接 `node app.js` 跑起来的进程，ssh 一断就没了，崩溃了也不会自己起来。生产环境必须有进程管理器。

PM2 是一款非常优秀的 Node 进程管理工具，它有着丰富的特性，能够充分利用多核 CPU 且能够负载均衡，能够帮助应用在崩溃后、指定时间（cluster model）和超出最大内存限制等情况下实现自动重启。PM2 是开源的基于 Node.js 的进程管理器，包括守护进程、监控、日志的一整套完整功能。

PM2 的主要特性：

- 内建负载均衡（使用 Node cluster 集群模块）
- 后台运行
- 0 秒停机重载，也就是维护升级的时候不需要停机
- 具有 Ubuntu 和 CentOS 的启动脚本
- 停止不稳定的进程（避免无限循环）
- 控制台检测

先全局装上。

```bash
npm install pm2 -g
```

运行 `pm2` 的程序并指定 `name`，起名字这一步别省，不然后面全靠 id 去认进程，很容易操作错。

```bash
pm2 start app.js --name appName
pm2 start app.js -i 3 --name appName    # 启动 3 个进程，自带负载均衡
```

`-i` 后面还可以写 `max`，PM2 会按 CPU 核数自动决定开几个。这块的前提是你的应用本身是无状态的，如果你把 session 存在进程内存里，开多进程之后用户会随机掉登录态，这个坑很典型。

查看状态和日志：

```bash
pm2 list                # 显示所有进程状态
pm2 logs                # 显示所有进程的日志
pm2 logs appName        # 显示一个进程的日志
```

批量控制所有进程：

```bash
pm2 stop all            # 停止所有进程
pm2 restart all         # 重启所有进程
pm2 reload all          # 0 秒停机重载进程，用于 NETWORKED 进程
```

`restart` 和 `reload` 这组区别跟前面 Nginx 那组是一个道理。`restart` 是先杀后起，中间有一小段时间没人接请求；`reload` 在 cluster 模式下会一个一个替换进程，服务全程可用。线上发版应该用 `reload`。

控制指定进程，既可以用 id 也可以用名字：

```bash
pm2 stop 0              # 停止指定的进程
pm2 restart 0           # 重启指定的进程
pm2 stop appName
pm2 restart appName
```

杀掉进程：

```bash
pm2 delete 0            # 杀死指定的进程
pm2 delete all          # 杀死全部进程
pm2 delete appName      # 杀死指定名字的进程
```

`stop` 只是停，进程还在列表里；`delete` 是从 PM2 的列表里彻底移除。看到 `pm2 list` 里一堆 `stopped` 的僵尸条目，就是只 `stop` 没 `delete` 留下的。

看某个应用的详细信息，包括重启次数、内存占用、日志路径：

```bash
pm2 show appName
```

我自己最常看的是 `restarts` 这个字段。如果它在几分钟内涨到几十，那就是应用启动即崩溃、PM2 在疯狂重拉，这时候去看 `pm2 logs` 一定有堆栈。

关于把 PM2 配置写成 ecosystem 文件、以及配合 Docker 一起用的完整流程，我在另一篇里写得更细，可以参考 [用 PM2 和 Docker 部署 Node 项目](https://feinterview.poetries.top/blog/pm2-docker-node-deploy)。

### 10.3 安装 Nginx

跟第三节讲的一样，先加官方源。

1. 安装 nginx 源

```
sudo rpm -ivh http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-7-0.el7.ngx.noarch.rpm
```

2. 查看 Nginx 源是否配置成功

通过 `yum search nginx` 看看是否已经添加源成功。如果成功则执行下列命令安装 Nginx。或者用 `yum info nginx` 也可以看看 nginx 源是否添加成功（原文此处误写为 `npm info nginx`）。

3. 安装 Nginx

```
sudo yum install -y nginx
```

4. 启动 Nginx 并设置开机自动运行

```
sudo systemctl start nginx
sudo systemctl enable nginx
```

装完先在浏览器访问一下服务器 IP，看到 Nginx 默认欢迎页就说明 80 端口通了。看不到的话，回头查第五节的防火墙和安全组。

### 10.4 配置反向代理

1. 关闭 Selinux

```bash
# 修改 SELINUX=enforcing 为 SELINUX=disabled
vi etc/selinux/config
# 必须重启
init 6
```

不关掉的话，SELinux 会拦住 Nginx 向本机其他端口发起连接，典型症状是 Nginx 报 `13: Permission denied while connecting to upstream`。如果不想整个关掉，也可以只放开这一项，`setsebool -P httpd_can_network_connect 1`。

2. 配置 `firewalld` 开启 `80` 端口

```bash
firewall-cmd --zone=public --list-ports

firewall-cmd --zone=public --add-port=80/tcp --permanent
```

加完记得 `firewall-cmd --reload`，前面反复强调过。

3. 配置反向代理

找到 `/etc/nginx/conf.d`，然后在里面新建对应网站的配置文件。Nginx 主配置 `/etc/nginx/nginx.conf` 里有一行 `include /etc/nginx/conf.d/*.conf`，所以这个目录下的每个 `.conf` 都会被自动加载，一个站点一个文件，管理起来清楚。

![在 /etc/nginx/conf.d 目录下为每个站点单独新建配置文件](https://s.poetries.top/uploads/2022/06/34c70c7723b1c5b3.png)

```bash
server {
  listen 80;
  server_name www.bbb.com;
  location / {
    #设置主机头和客户端真实地址，以便服务器获取客户端真实 IP
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #禁用缓存
    proxy_buffering off;
    #反向代理的地址
    proxy_pass http://127.0.0.1:3001;
  }
}
```

这个配置里有三行是必须理解的。`server_name` 决定这份配置管哪个域名，Nginx 靠请求头里的 `Host` 来匹配，这就是一个 80 端口能服务多个域名的原理。`proxy_pass` 是把请求转给谁。中间那三个 `proxy_set_header` 负责把真实的客户端信息带下去，不加的话 Node 里拿到的 IP 全是 `127.0.0.1`，做限流和日志统计就废了。

`proxy_buffering off` 这一条要按场景来。关掉它，响应会立刻往客户端吐，做 SSE 或者流式输出必须关；但普通接口关掉之后，慢客户端会一直占着后端连接，反而降低吞吐。默认是开的，没有流式需求就别动。

改完重启 nginx：

```
systemctl restart nginx
```

几条配套命令：

```bash
nginx -t                    # 看配置是否正确
systemctl stop nginx        # 停止 nginx
systemctl start nginx       # 启动 nginx
```

`nginx -t` 请养成习惯，每次改完配置先跑它。配置有语法错误的时候 `restart` 会直接让 Nginx 起不来，整站 502，而 `nginx -t` 只花零点几秒就能拦住这个事故。

**域名测试**

本地还没做 DNS 解析的话，改 hosts 文件模拟一下就行。Windows 上找到 `C:\Windows\System32\drivers\etc\hosts`。

```bash
192.168.1.128
192.168.1.128 www.bbb.com
```

格式是「IP 空格 域名」，第二行才是有效的那条。macOS 和 Linux 对应的文件是 `/etc/hosts`，写法一样。

改完在浏览器输入 `www.bbb.com`，nginx 就会把请求转发到 `127.0.0.1:3001`。

### 10.5 相关防火墙配置

这几条前面零散提过，这里集中放一份，方便直接抄。

```bash
# 添加
firewall-cmd --zone=public --add-port=80/tcp --permanent

#  刷新
firewall-cmd --reload

# 查看所有打开的端口：
firewall-cmd --zone=public --list-ports

# 删除
firewall-cmd --zone=public --remove-port=3306/tcp --permanent
```

### 10.6 多台服务器负载均衡

单机跑单进程，流量一大就顶不住了。下一步是把请求分给多台机器（或者同一台机器上的多个端口），这就是负载均衡。

![Nginx upstream 把请求分发到多台后端服务器的负载均衡结构](https://s.poetries.top/uploads/2022/06/2025927792fe986a.png)

负载均衡的种类分两类。一种是通过硬件来解决，常见的硬件有 NetScaler、F5、Radware 和 Array 等商用的负载均衡器，性能强但价格昂贵。另一种是通过软件来解决，常见的软件有 LVS、Nginx、Apache 等，它们基于 Linux 系统并且开源。

Nginx 的特点是占有内存少、并发能力强，事实上 nginx 的并发能力确实在同类型的网页服务器中表现最好，中国大陆使用 nginx 的网站用户有新浪、网易、腾讯等。

nginx 的 upstream 目前支持 3 种方式的分配：

- 轮询（默认）。每个请求按时间顺序逐一分配到不同的后端服务器，如果后端服务器 down 掉，能自动剔除
- `weight` 权重。指定轮询几率，weight 和访问比率成正比，用于后端服务器性能不均的情况，谁的机器配置好就多分点给谁
- `ip_hash` ip 哈希算法。每个请求按访问 ip 的 hash 结果分配，这样每个访客固定访问一个后端服务器，可以解决 session 的问题

这三种怎么选？如果你的应用是无状态的（session 存在 Redis 里，或者用 JWT），直接用默认轮询，机器配置不一样就加 `weight`。只有在 session 存在单机内存里、又暂时改不动的情况下，才用 `ip_hash` 兜一下。`ip_hash` 的代价是一台机器挂掉，绑在它上面的那批用户会全部掉线，而且经过 CDN 或者公司出口 NAT 之后，大量用户共用一个出口 IP，分配会严重不均。

配置的位置还是老地方，找到 `/etc/nginx/conf.d`，然后在里面新建对应网站的配置文件。

![conf.d 目录下为三个域名分别建立带 upstream 的配置文件](https://s.poetries.top/uploads/2022/06/2977a3d908a6b1b3.png)

改完重启 nginx，`systemctl restart nginx`。

下面是三个站点的完整配置，注意每个 `upstream` 的名字必须唯一，`proxy_pass` 里写的就是这个名字。

**www_aaa_com.conf**

```bash
upstream bakeaaa {
	ip_hash;
	server 127.0.0.1:3001;
}


server {
    listen       80;
    server_name  www.aaa.com;

    #charset koi8-r;
    #access_log  /var/log/nginx/host.access.log  main;

    location / {
      # 获取客户端的 IP 地址
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      # 禁用缓存
      proxy_buffering off;

      proxy_pass http://bakeaaa;
    }

    #error_page  404              /404.html;

    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```

第二个站点除了域名、upstream 名字和端口，其余一模一样。

**www_bbb.com.conf**

```bash

upstream bakebbb {

	ip_hash;
	server 127.0.0.1:3002 ;

}


server {
    listen       80;
    server_name  www.bbb.com;

    #charset koi8-r;
    #access_log  /var/log/nginx/host.access.log  main;

    location / {
      #获取客户端真实IP
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      #关闭缓存
      proxy_buffering off;

      proxy_pass http://bakebbb;
    }

    #error_page  404              /404.html;

    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }

}

```

第三个站点把后端指向了另一台机器的 IP，这才是真正的跨机负载均衡，前两个都还在本机。

**www_ccc_com.conf**

```bash
upstream bakeccc {
	ip_hash;
	server 192.168.1.129:3001;
}

server {
    listen       80;
    server_name  www.ccc.com;

    #charset koi8-r;
    #access_log  /var/log/nginx/host.access.log  main;

    location / {
      # 获取客户端真实IP
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      # 关闭缓存
      proxy_buffering off;

      proxy_pass http://bakeccc;
    }

    #error_page  404              /404.html;

    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }

}
```

`error_page 500 502 503 504 /50x.html` 这几行别删。后端全挂的时候，用户至少能看到一个静态错误页，而不是浏览器自己那个白屏。

#### 负载均衡操作演示

光看配置没感觉，跑一遍就清楚了。我们使用 docker 跑三个 nodejs 应用程序作为演示。

![用 Docker 运行 Nginx 容器配合本机三个 Node 服务做负载均衡演示](https://s.poetries.top/uploads/2022/06/7bdc4513afb0e8c5.png)

**使用 koa 搭建三个服务 3001、3002、3003**

三份代码只有端口和返回文案不同，故意这么写是为了刷新页面时能一眼看出请求落到了哪台。

1. 3001 服务

```js
const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
  ctx.body = 'Hello World 3001';
});

app.listen(3001, ()=>console.log('http://localhost:3001'));
```

2. 3002 服务

```js
const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
  ctx.body = 'Hello World 3002';
});

app.listen(3002, ()=>console.log('http://localhost:3002'));
```

3. 3003 服务

```js
const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
  ctx.body = 'Hello World 3003';
});

app.listen(3003, ()=>console.log('http://localhost:3003'));
```

在本地启动以上三个服务。

**docker 运行 Nginx**

Nginx 这边不装在本机，用容器跑，好处是配置改坏了删掉容器重来就行，不会污染环境。

```bash
# nginx/Dockerfile
FROM daocloud.io/library/nginx:1.13.0-alpine
# 拷贝配置文件到Nginx目录覆盖默认配置
# COPY conf/nginx.conf /etc/nginx/conf/nginx.conf
COPY ./conf.d /etc/nginx/conf.d
```

本机 `conf.d/default.conf` 文件是这样，三个后端都指向宿主机的 IP，因为 Node 服务跑在宿主机上，容器里的 `127.0.0.1` 指的是容器自己。

```bash
upstream bakeaaa {
	ip_hash;
	server 192.168.1.34:3001 weight=1;  # 192.168.1.34本机ip
	server 192.168.1.34:3002 weight=1;
	server 192.168.1.34:3003 weight=3;
}

server {
    listen       80;
    # server_name  www.aaa.com;

    #charset koi8-r;
    #access_log  /var/log/nginx/host.access.log  main;

    location / {
      # 获取客户端真实IP
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      # 关闭缓存
      proxy_buffering off;

      proxy_pass http://bakeaaa;
    }

    #error_page  404              /404.html;

    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }

}
```

这份配置里有个坑，我当时也是照着抄完刷新半天没反应才反应过来。`ip_hash` 和 `weight` 写在一起的时候，同一个客户端 IP 会被固定分到同一台后端，你在浏览器上怎么刷新看到的都是同一个数字，看不出权重效果。想演示权重，把 `ip_hash;` 那一行注释掉，让它走默认轮询，才能看到 3003 出现的次数大约是另外两个的三倍。

接下来构建和运行：

```bash
docker build -t nginx-demo .                    # 构建 nginx 镜像

# 运行 nginx 镜像
# -p 8666:80        本机端口:容器端口
# -v 本机配置目录:容器配置目录
# 最后是 nginx 镜像 ID
docker run --name nginx -d -p 8666:80 -v /Users/poetry/Download/docker/nginx/conf.d:/etc/nginx/conf.d e00b36d6975b

docker ps                                        # 查看启动的服务
docker restart nginx                             # 修改 conf.d 配置后需要重启容器才生效
```

原文这里的运行命令误写成了 `ddocker run`，多了一个字母，直接复制会提示 command not found，上面已改正。

修改 `upstream bakeaaa` 中的权重等参数，不断刷新页面，就可以看到不同的服务器负载均衡的效果。

![刷新页面看到请求被分发到不同端口的 Node 服务上](https://s.poetries.top/uploads/2022/06/99bc3d74f889990a.png)

### 10.7 云服务器部署 Node 项目的完整流程

前面几节是拆开讲的，这里把它串成一条从零到上线的流水线。买一台新的云主机，照着这四步走就能把 Node 项目跑起来。

1. 安装 nginx

先安装 nginx 源：

```
sudo rpm -ivh http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-7-0.el7.ngx.noarch.rpm
```

查看 Nginx 源是否配置成功。通过 `yum search nginx` 看看是否已经添加源成功，如果成功则执行下列命令安装 Nginx。或者用 `yum info nginx` 也可以看看 nginx 源是否添加成功（原文这里同样误写成了 `npm info nginx`）。

安装 nginx：

```
sudo yum install -y nginx
```

启动 `Nginx` 并设置开机自动运行。这两条是两个独立命令，原文挤在了一行里，直接复制会报错。

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

2. 安装 nodejs

下载 nodejs 二进制代码包，然后解压到 `/usr/local/nodejs`，接着配置环境变量。

```bash
vi /etc/profile
```

在最后面添加：

```
export NODE_HOME=/usr/local/nodejs/bin
export PATH=$NODE_HOME:$PATH
```

`:wq` 保存，然后运行 `source /etc/profile`。

3. 配置 nginx

```bash
server {
  listen       80;
  server_name  koa.test.com;

  #charset koi8-r;
  #access_log  /var/log/nginx/host.access.log  main;

  location / {
    # 获取客户端真实IP
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # 关闭缓存
    proxy_buffering off;

    proxy_pass http://127.0.0.1:3001;
  }

  #error_page  404              /404.html;

  # redirect server error pages to the static page /50x.html
  #
  error_page   500 502 503 504  /50x.html;
  location = /50x.html {
      root   /usr/share/nginx/html;
  }
}
```

4. 用 PM2 把应用跑起来，然后 `nginx -t` 加 `systemctl reload nginx`。到这一步，域名解析生效之后就能访问了。

关于 Nginx 更细的配置，比如 `location` 的匹配规则、`try_files` 处理前端路由的 history 模式，我在 [Nginx 配置总结](https://feinterview.poetries.top/blog/nginx-config) 那篇里写得更全，前端最容易踩的几个坑都在那。

### 10.8 nginx 配置 https

**为什么要使用 https**

HTTPS（全称 Hyper Text Transfer Protocol over Secure Socket Layer）是以安全为目标的 HTTP 通道，简单讲是 HTTP 的安全版。

HTTPS 是在 HTTP 的基础上添加了安全层，从原来的明文传输变成密文传输。加密与解密确实需要一些时间代价与开销，原文提到有 10 倍的差异，这个数字更多是早年的经验值，现代 CPU 普遍带 AES-NI 硬件加速，再加上 HTTP/2 的多路复用，实际差距早就不是这个量级了，在当前的网络环境下基本可以忽略不计。

现实层面更直接的原因是，微信小程序请求 Api 必须用 https，iOS 的 ATS 策略也要求接口走 https。所以这已经不是选不选的问题。

**配置 https**

先说证书类型，按验证严格程度分三档：

- 域名型 https 证书（DVSSL），信任等级一般，只需验证网站的真实性便可颁发证书保护网站
- 企业型 https 证书（OVSSL），信任等级强，需要验证企业的身份，审核严格，安全性更高
- 增强型 https 证书（EVSSL），信任等级最高，一般用于银行证券等金融机构，审核严格，安全性最高，同时可以激活绿色网址栏

个人项目和大多数业务站点，DV 证书完全够用，各家云厂商都有免费额度，Let's Encrypt 配合 certbot 还能做到自动续期。EV 那种绿色地址栏，主流浏览器从 Chrome 77 开始已经不再特殊显示了，所以为了这个去买 EV 意义不大。

拿到证书之后的 Nginx 配置：

```bash
server {
  listen 443; # 监听443端口
  server_name a.test.com;
  ssl on; # 开启ssl
  ssl_certificate /root/nginxssl/1_a.expressjiaocheng.com_bundle.crt; # ssl证书
  ssl_certificate_key /root/nginxssl/2_a.expressjiaocheng.com.key; # ssl私钥
  ssl_session_timeout 5m; # ssl会话超时时间
  ssl_protocols TLSv1 TLSv1.1 TLSv1.2; # ssl协议
  ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE; # ssl加密算法
  ssl_prefer_server_ciphers on; # ssl优先选择服务器端加密算法

  location / {
    # 获取客户端真实IP
    proxy_set_header Host $host; # 设置Host头信息
    proxy_set_header X-Real-IP $remote_addr; # 设置客户端IP
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; # 设置反向代理IP
    # 关闭缓存
    proxy_buffering off;

    proxy_pass http://127.0.0.1:3001;
  }

  #error_page  404              /404.html;

  # redirect server error pages to the static page /50x.html
  #
  error_page   500 502 503 504  /50x.html;
  location = /50x.html {
    root   /usr/share/nginx/html;
  }
}
```

这份配置是 2022 年的写法，放到今天有两处得改，我把它们单独列出来，照抄的话新版本 Nginx 会直接起不来。

第一处是 `ssl on;`。这个指令从 nginx 1.15.0 起就被标记废弃，1.25 版本彻底移除了，正确写法是把 ssl 声明合并到监听那一行，也就是 `listen 443 ssl;`。

第二处是 `ssl_protocols TLSv1 TLSv1.1 TLSv1.2;`。TLS 1.0 和 1.1 已经被各大浏览器全面弃用，现在的推荐值是 `ssl_protocols TLSv1.2 TLSv1.3;`。同时 `ssl_ciphers` 那一长串也可以简化，直接用 Mozilla SSL 配置生成器给出的 intermediate 档配置更省心。

还有一件原配置里没写但生产必备的事，把 80 端口的请求重定向到 443，不然用户敲 `http://` 进来就是明文。

```nginx
server {
  listen 80;
  server_name a.test.com;
  return 301 https://$host$request_uri;
}
```

## 十一、Docker 入门，先把它和虚拟机分清楚

前面所有的安装步骤，你大概已经感受到了，装一次挺麻烦，换台机器还得再来一遍，而且不同机器上的版本很难保证一致。Docker 解决的就是这件事。

Docker 是一个跨平台的开源应用容器引擎，诞生于 2013 年初，基于 Go 语言并遵从 Apache 2.0 协议开源。

刚开始学 Docker，你可以把它理解成我们以前学过的虚拟机，但 Docker 和传统虚拟化方式有明显的不同。传统虚拟机技术是虚拟出一套硬件后，在其上运行一个完整操作系统，在该系统上再运行所需应用进程。Docker 相比传统的虚拟化技术要更轻量级，Docker 容器内的应用程序是直接运行在宿主内核中的，容器内没有自己的内核，也没有进行硬件虚拟。

下面这两张图把两者的分层结构画出来了，对着看一眼就明白差在哪一层。

![传统虚拟机的分层结构，每个虚拟机都带一个完整的 Guest OS](https://s.poetries.top/uploads/2022/06/d475d80c46a6b836.png)
![Docker 容器的分层结构，容器共享宿主机内核没有独立的操作系统](https://s.poetries.top/uploads/2022/06/5f8aa431399633c4.png)

差别就在那一层 Guest OS。虚拟机每多开一个就多一个完整操作系统，几个 G 起步、启动要几十秒；容器只是一组被隔离的进程，镜像可能才几十兆，启动是毫秒级的。

因此 Docker 容器要比传统虚拟机占用资源更小、系统支持量更大、启动速度更快、更容易维护和扩展。目前 Docker 是全栈开发者必备的技能之一。官网是 https://hub.docker.com。

有一点要说清楚，容器共享宿主机内核，所以 Linux 容器只能跑在 Linux 内核上。你在 macOS 或 Windows 上用 Docker Desktop，它底下其实偷偷跑了一个 Linux 虚拟机，容器再跑在那里面。搞清楚这一层，后面遇到「Mac 上性能为什么这么差」「文件挂载为什么慢」就不奇怪了。

### 11.1 为什么要使用 Docker

- 开发人员利用 Docker 快速部署、调试我们的应用
- 开发人员利用 Docker 可以消除协作编码时「在我的机器上可正常工作，其他机器不能正常工作」的问题。Docker 可以提供一致的运行环境。开发过程中一个常见的问题是环境一致性问题，由于开发环境、测试环境、生产环境不一致，导致有些 bug 并未在开发过程中被发现
- 运维人员利用 Docker 可以在隔离容器中并行运行和管理应用
- Serverless 也是基于 docker 容器技术

对前端来说还有一条特别实在的理由。你的项目要 Node 16，另一个老项目卡在 Node 10，本地用 nvm 切来切去还行，CI 上就很痛苦。镜像里写死版本之后，这个问题直接消失了。

### 11.2 Mac 上搭建本地 Docker 环境

mac 下安装 docker 用 `brew install docker`，或者直接下载安装包：https://docs.docker.com/docker-for-mac/install

https://hub.docker.com 拉取镜像速度比较慢，当年我们推荐使用国内的镜像源，比如 https://hub.daocloud.io。

设置国内镜像源在 Docker Desktop 的设置界面里改就行。

![Docker Desktop 设置界面中配置国内 registry-mirrors 镜像加速地址](https://s.poetries.top/uploads/2022/06/82cdc649caaa9a4d.png)

```json
{
  "registry-mirrors": [
    "https://register.docker-cn.com/"
  ]
}
```

这里补两点。原文这份 JSON 的数组后面多了一个逗号，标准 JSON 不允许尾逗号，Docker 会拒绝加载整个配置文件并且报错信息很不友好，上面已经去掉。另外 `register.docker-cn.com` 这个官方中国区镜像早就下线了，daocloud 的入口也几经变化，现在更常用的是各家云厂商给你账号专属的加速地址，第 11.5 节会讲阿里云那个。

进入 https://hub.daocloud.io 这个网站可以获取镜像的下载地址。

### 11.3 docker 命令基础

先把最高频的六条记住，日常八成操作就在这里面。

```bash
docker images                   # 查看镜像
docker ps                       # 查看启动的容器，加 -a 查看全部（包括已停止的）
docker rmi 镜像ID                # 删除镜像
docker rm 容器ID                 # 删除容器
docker exec -it 1a8eca716169 sh # 进入容器内部，容器 ID 由 docker ps 获取
docker inspect bf70019da487     # 查看容器的详细信息
```

镜像和容器的关系，简单记就是镜像相当于类、容器相当于实例，所以删的顺序也是反过来的。要删除 none 的镜像，得先删除该镜像创建出来的容器；要删除容器，必须先停止容器。

```bash
$ docker rmi $(docker images | grep "none" | awk '{print $3}')
```

那些 tag 是 `<none>` 的镜像叫悬空镜像，是你反复 `docker build` 同一个 tag 时留下的旧层，不清理会白白占几个 G 磁盘。

一整套清理组合拳：

```bash
$ docker stop $(docker ps -a | grep "Exited" | awk '{print $1 }') //停止容器

$ docker rm $(docker ps -a | grep "Exited" | awk '{print $1 }') //删除容器

$ docker rmi $(docker images | grep "none" | awk '{print $3}') //删除镜像
```

这三条 `awk` 的写法看着唬人，其实就是把上一条命令输出的第 1 列或第 3 列（也就是容器 ID 和镜像 ID）抠出来喂给后面的命令。现在 Docker 官方提供了更简单的等价命令，`docker container prune` 清理已停止的容器，`docker image prune` 清理悬空镜像，`docker system prune -a` 一把梭全清。用官方的这几个更安全，因为 `grep "none"` 有可能误伤名字里带 none 的镜像。

`docker info` 命令可以查看 Docker 的配置信息，包括镜像源、网络、磁盘、内存、系统等。输出比较长，分两段看。

前半段是客户端信息，主要是版本和装了哪些插件。

```
$ docker info
Client:
 Context:    default
 Debug Mode: false
 Plugins:
  buildx: Docker Buildx (Docker Inc., v0.8.2)
  compose: Docker Compose (Docker Inc., v2.4.1)
  sbom: View the packaged-based Software Bill Of Materials (SBOM) for an image (Anchore Inc., 0.6.0)
  scan: Docker Scan (Docker Inc., v0.17.0)
```

后半段是服务端信息，排查问题时真正有用的是这一段。重点看四个地方，`Containers` 和 `Images` 的数量、`Storage Driver`（现在基本都是 overlay2）、`Registry Mirrors`（确认你配的加速地址生效没有）、以及 `Total Memory`（Docker Desktop 默认只给几 G，构建大项目时不够用得去设置里调）。

```
Server:
 Containers: 3
  Running: 1
  Paused: 0
  Stopped: 2
 Images: 5
 Server Version: 20.10.14
 Storage Driver: overlay2
  Backing Filesystem: extfs
  Supports d_type: true
  Native Overlay Diff: true
  userxattr: false
 Logging Driver: json-file
 Cgroup Driver: cgroupfs
 Cgroup Version: 2
 Plugins:
  Volume: local
  Network: bridge host ipvlan macvlan null overlay
  Log: awslogs fluentd gcplogs gelf journald json-file local logentries splunk syslog
 Swarm: inactive
 Runtimes: io.containerd.runc.v2 io.containerd.runtime.v1.linux runc
 Default Runtime: runc
 Init Binary: docker-init
 containerd version: 3df54a852345ae127d1fa3092b95168e4a88e2f8
 runc version: v1.0.3-0-gf46b6ba
 init version: de40ad0
 Security Options:
  seccomp
   Profile: default
  cgroupns
 Kernel Version: 5.10.104-linuxkit
 Operating System: Docker Desktop
 OSType: linux
 Architecture: x86_64
 CPUs: 2
 Total Memory: 3.843GiB
 Name: docker-desktop
 ID: PLR7:VYHP:QZEW:EDCY:4EDN:K77K:M7H5:CHIG:VRZE:OD34:TACY:4MI5
 Docker Root Dir: /var/lib/docker
 Debug Mode: false
 HTTP Proxy: http.docker.internal:3128
 HTTPS Proxy: http.docker.internal:3128
 No Proxy: hubproxy.docker.internal
 Registry: https://index.docker.io/v1/
 Labels:
 Experimental: false
 Insecure Registries:
  hubproxy.docker.internal:5000
  127.0.0.0/8
 Registry Mirrors:
  https://register.docker-cn.com/
 Live Restore Enabled: false
```

顺便注意 `Operating System: Docker Desktop` 和 `Kernel Version: 5.10.104-linuxkit` 这两行，它们就是前面说的那个隐藏 Linux 虚拟机留下的痕迹。

### 11.4 在 Linux 中安装 docker

服务器上装 Docker 是四步，装工具包、配源、装、启动。

**安装工具包**

```bash
yum install yum-utils device-mapper-persistent-data lvm2 -y
```

这三个包里，`yum-utils` 提供了下一步要用的 `yum-config-manager` 命令，后两个是存储驱动的依赖。

![执行 yum install yum-utils device-mapper-persistent-data lvm2 的安装输出](https://s.poetries.top/uploads/2022/06/e0f4f8f2621b11c0.png)

**设置阿里镜像源**

```bash
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

这条命令做的事，就是往 `/etc/yum.repos.d/` 里写一个 repo 文件，和第九节手写 MongoDB 那个 repo 是一回事，只不过这次有现成命令代劳。用阿里的镜像而不是 Docker 官方源，纯粹是因为国内拉官方源太慢。

![yum-config-manager 添加阿里云 docker-ce 源成功的输出](https://s.poetries.top/uploads/2022/06/0b017f9a76914c6e.png)

**安装 docker**

```bash
yum install docker-ce docker-ce-cli containerd.io -y
```

这三个包各管一摊。`docker-ce` 是守护进程，`docker-ce-cli` 是你敲的那个 `docker` 命令，`containerd.io` 是底层真正负责跑容器的运行时。

**启动 docker**

```bash
systemctl start docker

# 设为开机启动
systemctl enable docker
```

**设置 docker 镜像源**

```bash
vi /etc/docker/daemon.json
```

```json
{
  "registry-mirrors": [
    "https://register.docker-cn.com/"
  ]
}
```

这份 JSON 同样去掉了原文里的尾逗号。前面说过 `register.docker-cn.com` 已经停止服务，实际配置时换成下一小节里阿里云给你的专属加速地址。

**重启 docker**

```bash
systemctl restart docker
```

改完 `daemon.json` 一定要 `restart`，`reload` 对它不生效。改完之后跑 `docker info` 看最后的 `Registry Mirrors` 那一行，确认新地址在里面，这是唯一可靠的验证方式。

### 11.5 安装指定版本的 docker

生产环境上通常需要锁版本，跟测试环境保持一致。要安装特定版本的 Docker Engine，先在 repo 中列出可用版本，然后选择并安装。

下面这条命令会列出并排序仓库中可用的版本，按版本号从高到低排列。

```
yum list docker-ce --showduplicates | sort -r
```

![yum list docker-ce --showduplicates 列出仓库中所有可用的 docker 版本](https://s.poetries.top/uploads/2022/06/717f82025ea75291.png)

从列表里挑一个版本号，填到下面这条命令的 `<VERSION_STRING>` 位置。

```
sudo yum install docker-ce-<VERSION_STRING> docker-ce-cli-<VERSION_STRING> containerd.io
```

原文这条命令的结尾被断行成了 `containerd.i o`，中间多了个空格，复制过去会提示找不到包，上面已经修正。另外要注意 `docker-ce` 和 `docker-ce-cli` 的版本号要写成一样的，混着装容易出现客户端和服务端 API 版本不匹配的报错。

### 11.6 卸载 docker

卸载 Docker Engine、CLI 和 Containerd 包：

```bash
sudo yum remove docker-ce docker-ce-cli containerd.io
```

主机上的映像、容器、卷或自定义配置文件不会自动删除。要删除所有镜像、容器和卷，得手动来。

```bash
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
```

另外你必须手动删除任何已编辑的配置文件，比如刚才那个 `/etc/docker/daemon.json`。

`/var/lib/docker` 这个目录是磁盘杀手。第四节提到的「`df` 显示磁盘满了」，在跑 Docker 的机器上十有八九是它撑的，里面装着所有镜像层、容器可写层和日志。真要清理，优先用 `docker system prune -a`，别直接 `rm -rf`，除非你确实打算连 Docker 一起卸掉。

### 11.7 阿里云 Docker 镜像加速器

访问 https://www.aliyun.com/ 搜索「容器镜像服务」，在控制台里能拿到一个专属于你账号的加速地址。

![阿里云容器镜像服务控制台中的镜像加速器地址页面](https://s.poetries.top/uploads/2022/06/dacef356b4101fd5.png)

拿到地址之后，通过修改 daemon 配置文件 `/etc/docker/daemon.json` 来使用加速器。

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://l6of9ya6.mirror.aliyuncs.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

这段用 `tee` 而不是 `vi`，好处是可以直接粘进终端一次执行完，写在自动化脚本里很方便。`<<-'EOF'` 这种写法叫 heredoc，单引号包住 EOF 表示中间的内容不做变量替换，原样写入。

上面那个 `l6of9ya6` 是示例账号的前缀，你要换成自己控制台里的那一串，直接抄是用不了的。

## 十二、镜像、容器、仓库，Docker 的三个核心概念

命令记得再熟，概念不清照样会懵。这三个词的关系用两张图说明白。

![Docker 镜像、容器与仓库三者之间的关系示意图](https://s.poetries.top/uploads/2022/06/311938585465b33b.png)
![docker pull、run、build、push 在镜像容器仓库之间的流转关系](https://s.poetries.top/uploads/2022/06/4c1ecee2ce96588b.png)

### 12.1 镜像

Docker 镜像就是一个 Linux 的文件系统（Root FileSystem），这个文件系统里面包含可以运行在 Linux 内核的程序以及相应的数据。

它有两个关键性质：

- 镜像是分层（Layer）的。一个镜像可以由多个中间层组成，多个镜像可以共享同一中间层，我们也可以通过在镜像上添加一层来生成一个新的镜像
- 镜像是只读的（read-only）。镜像在构建完成之后便不可以再修改。上面所说的添加一层构建新镜像，实际是通过创建一个临时的容器，在容器上增加或删除文件，从而形成新的镜像，因为容器是可以动态改变的

![Docker 镜像的分层结构，多个镜像共享底层的中间层](https://s.poetries.top/uploads/2022/06/a524edcdba080105.png)

分层这件事直接决定了你写 Dockerfile 的姿势。每一条指令都是一层，层是带缓存的，只要这一层的输入没变就直接复用。所以 `COPY package.json` 加 `RUN npm install` 要写在 `COPY . .` 前面，业务代码改动时依赖那一层的缓存才不会失效。这个顺序写反，每次构建都要重装一遍依赖，几分钟就没了。这一点我在写第一个 Dockerfile 的时候完全没意识到，后来构建慢得受不了才回头去查。

### 12.2 容器

容器类似 linux 系统环境，用来运行和隔离应用。容器从镜像启动的时候，docker 会在镜像的最上一层创建一个可写层，镜像本身是只读的，保持不变。容器与镜像的关系，就如同面向对象编程中对象与类之间的关系。

因为容器是通过镜像来创建的，所以必须先有镜像才能创建容器。生成的容器是一个独立于宿主机的隔离进程，并且有属于容器自己的网络和命名空间。

镜像由多个中间层（layer）组成，生成的镜像是只读的，但容器却是可读可写的，这是因为容器是在镜像上面添了一层读写层（writer/read layer）来实现的，如下图所示。

![容器在只读镜像层之上叠加一个可写层的结构示意](https://s.poetries.top/uploads/2022/06/2681b9ce8eeab9d5.png)

那个可写层是理解「为什么容器一删数据就没了」的关键。你在容器里写的所有文件都落在这一层，容器删掉，这一层跟着消失。所以数据库容器必须挂载数据卷，第十三节会反复用到 `-v` 这个参数。

### 12.3 仓库

仓库（Repository）是集中存储镜像的地方。这里有个概念要区分一下，仓库与仓库服务器（Registry）是两回事，像我们上面说的 Docker Hub，就是 Docker 官方提供的一个仓库服务器，不过日常其实不太需要太过区分这两个概念。

**公共仓库**

公共仓库一般是指 Docker Hub。除了获取镜像外，我们也可以将自己构建的镜像存放到 Docker Hub，这样别人也可以使用我们构建的镜像。不过要将镜像上传到 Docker Hub，必须先在 Docker 的官方网站上注册一个账号。

**私有仓库**

有时候自己部门内部有一些镜像要共享，直接导出镜像拿给别人比较麻烦，使用像 Docker Hub 这样的公共仓库又不是很方便，这时候我们可以自己搭建属于自己的私有仓库服务，用于存储和分发我们的镜像。

现在更常见的做法是直接用云厂商的容器镜像服务，腾讯云和阿里云都提供私有 registry，几分钟就能开通，比自己搭一套 Harbor 省事得多。

### 12.4 镜像相关命令

镜像的完整结构是 `registryname/repositoryname/imagename:tagname`，比如 `docker.io/library/centos:8.3.2011`。平时我们敲 `docker pull centos`，Docker 会自动把前面的 registry 和 repository 补全成默认值。

```bash
docker search centos            # 搜索镜像
docker pull centos              # 下载镜像，不指定 tag 默认拉 latest
docker pull centos:8.3.2011     # 下载指定的 tag
docker images                   # 查看本地镜像
```

生产环境别用 `latest`。它不是「最新版」的语义保证，只是一个默认标签，今天拉到的和三个月后拉到的可能是完全不同的版本，出问题很难复现。

给镜像打标签，这也是创建自己的镜像的方式：

```bash
docker tag 原镜像ID docker.io/library/centos:8.3.2011
```

`docker tag` 不会复制任何数据，它只是给同一个镜像 ID 挂一个新名字，所以打完标签你会看到两条记录但 IMAGE ID 一样，占的还是同一份磁盘。

删除镜像：

```bash
docker rmi 镜像ID           # 删除镜像
docker rmi 镜像ID -f        # 强制删除
```

如果这个镜像 ID 上挂着多个标签，`docker rmi` 只会删掉你指定的那个标签，镜像本体还在，用 `docker images | grep centos` 就能看出来。

把本地镜像推送到 dockerHub 仓库：

```bash
docker login                    # 本地登录 dockerHub，需要先在 https://hub.docker.com/ 注册账户
cat .docker/config.json         # 查看保存的账户信息
docker push 镜像名称              # 把本地镜像推送到远程
```

`config.json` 里存的是 base64 编码的账号密码，不是加密的，别把这个文件提交到代码仓库里。

### 12.5 容器相关命令

先看容器列表：

```bash
docker ps           # 查看正在运行的容器
docker ps -a        # 查看所有容器，包括已经停止的
```

`docker run` 是创建一个新的容器并运行一个命令，它是日常用得最频繁的命令之一，同样也是较为复杂的命令之一。命令格式是 `docker run [OPTIONS] IMAGE [COMMAND] [ARG...]`。

常用的 OPTIONS 有这些：

- `-i` 表示启动一个可交互的容器，并持续打开标准输入
- `-t` 表示使用终端关联到容器的标准输入输出上
- `-d` 表示容器放置后台运行
- `--rm` 退出后即删除容器
- `--name` 表示定义容器唯一名称
- `-p` 映射端口
- `-v` 指定路径挂载数据卷
- `-e` 运行容器传递环境变量

后面两个位置参数是，`IMAGE` 表示要运行的镜像，`COMMAND` 表示启动容器时要运行的命令。

`-it` 组合起来就是启动一个交互式容器。

```bash
docker run -it nginx /bin/bash      # 启动一个交互式容器并在容器内执行 /bin/bash
```

这几个参数里，`-p`、`-v`、`-e` 是部署时真正的主力。`-p` 决定外面能不能访问到，`-v` 决定容器删掉之后数据还在不在，`-e` 决定配置怎么传进去。剩下的 `-d` 和 `--name` 属于必写的习惯，不起名字过两天你就不知道哪个容器是哪个了。

容器的生命周期控制：

```bash
docker rm 容器ID -f        # 删除容器，-f 表示运行中也强制删
docker stop 容器ID         # 停止容器
docker start 容器ID        # 启动容器
docker restart 容器ID      # 重启容器
```

进入容器内部有两种方式，区别很重要。

```bash
docker exec -it 容器ID /bin/bash
```

`docker exec` 是进入容器开启一个新的终端，这是最常用的方式，执行 `exit` 退出的时候不会停止容器。而 `docker attach` 是接入容器正在执行的那个主终端，`exit` 退出会把容器一起停掉。搞混这两个，会出现「我只是进去看一眼日志，怎么服务就挂了」的情况。

还有一点，很多精简镜像（尤其是 alpine 系）里没有 `bash`，只有 `sh`，所以 `/bin/bash` 进不去的时候换成 `sh` 试试。

查看容器日志：

```bash
docker logs 容器ID
```

语法是 `docker logs [OPTIONS] CONTAINER`，常用参数有：

- `-f` 跟踪日志输出
- `--since` 显示某个开始时间的所有日志
- `-t` 显示时间戳
- `--tail` 仅列出最新 `N` 条容器日志

我最常用的组合是 `docker logs -f --tail 100 容器名`，先看最近 100 行再跟着滚，直接 `-f` 会把几万行历史日志全刷出来。

最后是 `docker commit`，把容器转换为镜像。镜像本身是没有写入权限的，但是我们可以修改容器，再把容器制作成镜像。

```bash
docker exec -it 容器ID /bin/bash    # 进入容器内部
echo test > 1.txt                   # 在容器里写点东西

docker commit 容器ID 自定义镜像名称    # 将容器转换为镜像
```

这条命令适合做临时快照，但不建议用它来生产镜像。因为你没法从结果反推出「这个镜像里到底做了什么改动」，换个人接手完全看不懂。正经做法是写 Dockerfile，第十四节就讲这个。

## 十三、用 Docker 跑起常用服务

第九节我们把 MongoDB、MySQL、Redis 用裸机方式装了一遍，加源、装包、改配置、开端口，每个都要十几步。这一节用 Docker 再来一遍，你会看到同样的事情基本上一条命令就完了。

这几个例子的套路完全一致，`docker pull` 拉镜像，`docker run` 带上 `-p` 映射端口、`-v` 挂载数据、`-e` 传配置，然后 `docker exec` 进去验证。看完 Node 和 Nginx 这两个，后面三个基本可以跳着看。

### 13.1 安装 node

进入 https://hub.daocloud.io 搜索 node，切换到需要的版本获取下载地址。

```bash
docker pull daocloud.io/library/node:12.18      # 拉取镜像
docker tag 28faf336034d node                     # 重命名镜像
```

从 daocloud 拉下来的镜像名带一长串前缀，敲着累，所以用 `docker tag` 起个短名。重命名之后 IMAGE ID 都是一样的，因为前面说过，`tag` 只是加个别名，不复制数据。

![docker tag 重命名后两条记录的 IMAGE ID 完全相同](https://s.poetries.top/uploads/2022/06/59d83f0139c878de.png)

镜像也可以导出到本地做备份，内网机器拉不到外部镜像的时候，这招很实用。

```bash
# -o 后面是导出镜像要起的名称，最后是要导出的镜像 ID
docker save -o node.image 28faf336034d
```

![docker save 把镜像导出成本地文件](https://s.poetries.top/uploads/2022/06/7b993abfdc8f07b6.png)

为了验证导出的文件确实能用，我们先把本地这个镜像强制删掉。

```bash
docker rmi 28faf336034d -f
```

![docker rmi -f 强制删除本地镜像](https://s.poetries.top/uploads/2022/06/df79f11b704aae4d.png)

然后再从刚才的文件里导回来。

```bash
docker load -i node.image
```

![docker load 从本地镜像文件恢复镜像](https://s.poetries.top/uploads/2022/06/566d2f2270c40840.png)

导回来的镜像是没有友好名字的，再重命名一次，顺便带上版本号。

```bash
docker tag 28faf336034d node:v1.0
```

![重新为导入的镜像打上 node:v1.0 标签](https://s.poetries.top/uploads/2022/06/129f0a59b6d7c5d4.png)

顺带提一句，`docker save` 和 `docker export` 长得像但不是一回事。`save` 操作的是镜像，会完整保留所有分层和元数据；`export` 操作的是容器，导出的是那一刻的文件系统快照，分层信息全丢了。要做镜像备份就用 `save`。

### 13.2 安装 Nginx

![在 daocloud 镜像站搜索 nginx 获取镜像下载地址](https://s.poetries.top/uploads/2022/06/49bb3cc9f49c2dd1.png)

```
docker pull daocloud.io/library/nginx:1.13.0-alpine
```

选 alpine 版本是因为它体积小得多，几兆到十几兆的量级，而完整版动辄一百多兆。代价是里面很多工具没有，进容器排查问题时会觉得手脚被绑住，连 `bash` 都没有。

![docker pull 拉取 nginx alpine 镜像的输出](https://s.poetries.top/uploads/2022/06/1f9aea9f1c9a18fc.png)

**启动 Nginx 镜像**

服务器上启动，把日志目录、主配置、站点配置、静态文件目录全部挂到宿主机上。

```
docker run --name nginx(起一个容器名称) -d(后台运行) -p 80:80(本机:容器) -v(映射Nginx容器的运行目录本机) /root/nginx/log:/var/log/nginx(本机目录:容器目录) -v /root/nginx/conf/nginx.conf:/etc/nginx/nginx.conf(本机目录:容器内nginx配置所在目录) -v /root/nginx/conf.d:/etc/nginx/conf.d -v /root/nginx/html:/usr/share/nginx/html f00ab1b3ac6d(nginx镜像ID)
```

本地电脑启动，只是把宿主机路径换成 Mac 上的目录，端口换成 8666 避开本机可能已占用的 80。

```
docker run --name nginx -d -p 8666:80 -v /Users/poetry/Downloads/docker/nginx/log:/var/log/nginx -v /Users/poetry/Downloads/docker/nginx/conf/nginx.conf:/etc/nginx/nginx.conf -v /Users/poetry/Downloads/docker/nginx/conf.d:/etc/nginx/conf.d -v /Users/poetry/Downloads/docker/nginx/html:/usr/share/nginx/html f00ab1b3ac6d
```

这条命令看着吓人，其实就是四个 `-v` 而已，把 docker 容器中的 Nginx 服务配置映射到本地方便管理。

![宿主机上映射出来的 nginx 配置与静态文件目录结构](https://s.poetries.top/uploads/2022/06/691129b326f9fb23.png)

`-v 宿主机路径:容器内路径` 这个顺序千万别写反，写反了 Docker 会拿容器里的空目录去覆盖你宿主机的目录，这个我干过一次，配置文件当场没了。挂载单个文件（比如上面的 `nginx.conf`）时还有个坑，宿主机上那个文件必须先存在，否则 Docker 会给你创建一个同名目录，然后 Nginx 启动失败。

启动之后访问 docker 暴露的 8666 端口就能看到页面。

![浏览器访问 localhost:8666 看到 Nginx 默认页面](https://s.poetries.top/uploads/2022/06/6d9b07b85c22e0b5.png)

因为静态目录是挂载出来的，当我们修改了 html 中的文件，无需重启容器即可看到效果。

![修改宿主机上的 html 文件内容](https://s.poetries.top/uploads/2022/06/d0ded5a28d96ce59.png)
![刷新浏览器立刻看到修改后的页面，不需要重启容器](https://s.poetries.top/uploads/2022/06/cb0109ef19b551e4.png)

这个特性对前端很友好，本地调试的时候改一行 CSS 直接刷新就行。但要区分清楚，改静态文件不用重启，改 `conf.d` 下的 Nginx 配置是要重启容器的，或者 `docker exec -it nginx nginx -s reload` 让它重新加载。

### 13.3 安装 mysql

进入 https://hub.daocloud.io 搜索 mysql，切换到需要的版本获取下载地址。

![在 daocloud 镜像站搜索 mysql 并选择 8.0.20 版本](https://s.poetries.top/uploads/2022/06/a6a34ed8d66f7cdc.png)

```
docker pull daocloud.io/library/mysql:8.0.20
```

![docker pull 拉取 mysql 8.0.20 镜像的输出](https://s.poetries.top/uploads/2022/06/f7e34f9ea2331ffb.png)

**启动 MySQL 镜像**

```
docker run -d(后台运行) -p 3307:3306(本机端口:MySQL运行端口) --name mysql(容器名称) -e MYSQL_ROOT_PASSWORD=123456(设置mysql密码) be0dbf01a0f3(mysql镜像ID)
```

对比一下第九节裸机装 MySQL 的流程，加源、装包、去日志里翻临时密码、改密码策略、改 host、开防火墙，前后十几步。这里一条命令就出来了，密码通过 `-e MYSQL_ROOT_PASSWORD` 直接指定，官方镜像的启动脚本会帮你初始化好。

端口映射写的是 `3307:3306`，左边是宿主机端口，右边是容器内端口。故意错开是因为本机可能已经装了 MySQL 占着 3306。外部连接时连 3307。

**查看当前正在运行的镜像**

```
docker ps -a(正在运行和停止的镜像-a都可见)
```

![docker ps -a 列出所有容器包括已停止的](https://s.poetries.top/uploads/2022/06/5ba00266271ef558.png)

**删除容器**

删除之前需要先 stop，`docker stop bac2692e2b9a(容器ID)`。

```
docker rm bac2692e2b9a(容器ID：docker ps获取)
```

**进入容器内部**

```
docker exec -it bac2692e2b9a(容器ID) sh(指定进入方式)
```

这里用的是 `sh` 而不是 `/bin/bash`，前面提过，很多官方镜像做了精简，`sh` 是最保险的选择。

![docker exec 进入 mysql 容器内部的终端](https://s.poetries.top/uploads/2022/06/16c4541cf84b6e48.png)

我们使用 Navicat 新建一个连接测试一下，主机填 `127.0.0.1`，端口填映射出来的 `3307`。

![使用 Navicat 连接映射到 3307 端口的 Docker MySQL](https://s.poetries.top/uploads/2022/06/65357b17bf38f12e.png)

能连上，说明我们使用 docker 安装 MySQL 的方式是没问题的。

**查看 MySQL 容器日志**

```
docker logs -f bac2692e2b9a(容器ID)
```

原文这里给 `-f` 的注释是「查看最后几条」，其实 `-f` 是 follow，也就是持续跟踪新日志。要看最后几条得用 `--tail`，比如 `docker logs --tail 50 容器ID`，两个参数可以一起用。

![docker logs 跟踪 mysql 容器的启动日志](https://s.poetries.top/uploads/2022/06/639c44fb75dfe354.png)

**重启容器**

如果修改了容器配置，我们需要重新启动容器。

```
docker restart bac2692e2b9a(容器ID)
```

**设置 MySQL 权限**

mysql 8.0 之后有个变化，默认的身份验证插件从 `mysql_native_password` 换成了 `caching_sha2_password`，老版本的 Node MySQL 驱动不认这个，连接会直接报错。所以需要手动改回来，否则 node 连接不上。

```
docker exec -it bac2692e2b9a sh

mysql -uroot -p
```

```bash
# 远程连接权限
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

# 刷新权限
FLUSH PRIVILEGES;

# 更新加密规则
ALTER USER 'root'@'localhost' IDENTIFIED BY 'password' PASSWORD EXPIRE NEVER;

# 更新用户密码
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';

# 刷新权限
FLUSH PRIVILEGES;
```

关键是 `IDENTIFIED WITH mysql_native_password` 那一句。如果你用的是 `mysql2` 这类较新的驱动，其实已经支持 `caching_sha2_password` 了，不用降级加密方式，安全性也更好。

![执行完权限语句后 mysql 容器内的输出](https://s.poetries.top/uploads/2022/06/2ce28bda82ab01d4.png)

**挂载配置文件目录**

默认数据库的数据是放在容器里面的，这样的话当容器删除会导致数据丢失。我们想要的是删除容器的时候不删除里面的 mysql 数据，这个时候启动容器就可以把 mysql 数据挂载到外部。

```
docker run -d(后台运行) -p 3307:3306(本机端口:MySQL运行端口) -v /mysql/conf.d:/etc/mysql/conf.d -v /mysql/data:/var/lib/mysql  --name mysql(容器名称) -e MYSQL_ROOT_PASSWORD=123456(设置mysql密码) be0dbf01a0f3(mysql镜像ID)
```

原文这条命令里写成了 `-v v /mysql/conf.d:...`，中间多了一个孤零零的 `v`，会被当成参数解析失败，上面已经去掉。

回到十二节说的那个可写层。数据库容器不挂 `-v`，等于把数据放在一个随时会被删掉的临时层里。这条规则没有例外，凡是有状态的服务，`-v` 必须写。

看挂载有没有生效，用 `docker inspect`。

```
docker inspect bac2692e2b9a | grep mysql
```

`docker inspect` 输出的是一大坨 JSON，配合 `grep` 或者 `--format` 才好用，用 `--format` 指定 `.Mounts` 字段，就能直接把挂载信息单独拎出来。

### 13.4 安装 redis

![在 daocloud 镜像站搜索 redis 并选择 alpine 版本](https://s.poetries.top/uploads/2022/06/b38b5f228f3bcafe.png)

```
docker pull daocloud.io/library/redis:6.0.3-alpine3.11
```

**启动 Redis 镜像**

```
docker run -d -p 6380:6379 --name redis 29c713657d31(镜像ID) --requirepass 123456(redis登录密码)
```

注意 `--requirepass 123456` 的位置，它在镜像 ID 后面，属于传给容器内 `redis-server` 的参数，不是 `docker run` 自己的参数。写到前面去会报错，这个位置关系很多人第一次都会弄错。

![带 requirepass 启动 redis 容器后的运行状态](https://s.poetries.top/uploads/2022/06/57a4ce88939753b0.png)

或者进入 redis 容器之后再输入密码认证。

![进入 redis 客户端后使用 auth 命令输入密码](https://s.poetries.top/uploads/2022/06/b6183fc0a23c353d.png)

**交互式进入 redis 容器**

```
docker exec -it 9751cbc96861(容器ID) sh
```

![交互式进入 redis 容器并执行 redis-cli](https://s.poetries.top/uploads/2022/06/ab4cf5d68cdd846b.png)

进去之后先 `redis-cli`，再 `auth 123456`，然后 `ping` 一下，返回 `PONG` 就通了。

### 13.5 安装 MongoDB

```
docker pull mongo
```

这个直接从官方 Docker Hub 拉，不带任何前缀，前面加速器配好的话速度不会太慢。

![docker pull mongo 拉取官方 MongoDB 镜像](https://s.poetries.top/uploads/2022/06/c40b78b7f3a083f7.png)

启动容器，映射端口，挂载目录。

```
docker run --name mongoTest -p 27018:27017 -v ~/Downloads/docker/mongo:/data/db -d mongo(镜像ID或名称)
```

`/data/db` 是 MongoDB 存数据的默认路径，把它挂到宿主机的 `~/Downloads/docker/mongo`，容器删了数据还在。

![启动 mongoTest 容器并映射 27018 端口](https://s.poetries.top/uploads/2022/06/ee188453d7a2fa5d.png)

可以看到通过 `-v` 挂载到本地的数据文件已经生成出来了。

![宿主机目录里出现 MongoDB 生成的数据文件](https://s.poetries.top/uploads/2022/06/c7bda56df3a23c53.png)

进入容器内部，`docker exec -it mongoTest(镜像ID或名称) sh`。

![docker exec 进入 mongoTest 容器内部](https://s.poetries.top/uploads/2022/06/34f02c9235be1c72.png)

输入 `mongo`，可以看到 mongo 已经安装成功了，接着我们从容器外连接容器里的 mongo。

![容器内执行 mongo 命令进入 MongoDB 交互终端](https://s.poetries.top/uploads/2022/06/5e31f8c9d31961df.png)

**连接需要密码**

上面那个容器是不带认证的，任何人连上就能读写，只适合本地玩。加上认证的写法是这样。

```
docker run -d --name authMongo -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=123456 -p 27019:27017 -v ~/Downloads/docker/authMongo:/data/db mongo(镜像名称或者ID) --auth
```

两个 `-e` 传的是初始管理员账号密码，结尾的 `--auth` 是传给 mongod 的参数，表示开启认证。这两部分要一起写，只写 `--auth` 不建账号，你自己也进不去。还有一点，这两个环境变量只在数据目录为空时才生效，挂载的目录里已经有数据了再改密码是没用的。

进入容器内部验证。

![进入 authMongo 容器并使用账号密码认证](https://s.poetries.top/uploads/2022/06/7be573b2aa974fb0.png)

从容器外远程连接，连接串里要带上账号密码。

![使用客户端工具远程连接带认证的 MongoDB 容器](https://s.poetries.top/uploads/2022/06/dcd42440f0686a39.png)

这五个服务跑下来，你应该能感觉到 Docker 真正省掉的是什么。不是敲命令的那几秒，而是「这台机器上装过什么、改过哪个配置文件」这类没人说得清的历史包袱。容器删掉重建，环境就是干净的。

## 十四、Dockerfile，把部署过程写成文件

上一节都是手敲 `docker run`。参数一多就记不住，换台机器还得翻聊天记录找那条命令。Dockerfile 解决的是这个问题，把「这个镜像里装了什么、怎么启动」写成一个能提交到 git 的文本文件。

### 14.1 用 Dockerfile 构建一个 nginx 镜像

先来个最小例子。构建好的镜像内会有一个 `/usr/share/nginx/html/index.html` 文件。

新建一个名为 Dockerfile 的文件，并在文件内添加以下内容。

```bash
FROM nginx
RUN echo '你好 docker' > /usr/share/nginx/html/index.html
WORKDIR /usr/share/nginx/html
```

三行分别在说，基于官方 nginx 镜像、往首页文件里写一句话、把工作目录设成 html 目录。然后构建和运行。

```bash
docker build -t nginx:v1 .              # 构建镜像，最后那个点是构建上下文
docker run -it -d -p 8900:80 nginx:v1   # 启动容器
curl 127.0.0.1                          # 输出：你好 docker
```

原文这条 `docker run` 后面写的是「容器ID」，其实这个位置应该填镜像 ID 或者镜像名，容器是 `run` 之后才有的，这里改成了 `nginx:v1`。

`docker build` 结尾那个 `.` 也值得说一句，它是构建上下文目录，Docker 会把这个目录下的所有文件打包发给守护进程。所以在一个带着 `node_modules` 的目录里 build，光是发送上下文就要几十秒。写个 `.dockerignore` 把 `node_modules`、`.git`、`dist` 排除掉，构建速度立刻不一样。

### 14.2 Dockerfile 指令详解

几条基本规则先立住：

- `Dockerfile` 文件的文件名建议就叫 `Dockerfile`，用其他文件名构建的时候需要通过 `-f` 指定
- Dockerfile 构建镜像的执行顺序是从上往下
- 每一个指令都会创建一个新的镜像层，并提交

第三条就是十二节讲的分层缓存的来源，指令顺序直接决定构建快慢。

常用指令一览：

```bash
FROM # 基础境像,一切从这里开始构建
MAINTAINER # 镜像是谁写的,姓名+邮箱
LABEL # LABEL 指令用来给镜像添加一些元数据
RUN # 编译镜像时运行的脚本
COPY # 编译镜像时复制文件到镜像中 不会解压
ADD # 编译镜像时复制文件到镜像中 tar.gz 文件会自动解压
WORKDIR # 镜像的工作目录
CMD # 设置容器启动的命令
ENTRYPOINT # 设置容器启动的命令
EXPOSE # 设置镜像暴露的端口
VOLUME # 设置容器挂载的卷
ENV # 设置容器的环境变量
```

下面逐条展开。

`FROM` 指定哪种镜像作为新镜像的基础镜像，如 `FROM ubuntu:14.04`。这里同样建议写死版本号，别用 `latest`。

`MAINTAINER` 指明该镜像的作者和其电子邮件，如 `MAINTAINER "xxxxxxx@qq.com"`。这个指令官方已标记为废弃，现在推荐用 `LABEL maintainer="xx@qq.com"` 代替，功能一样但更统一。

`LABEL` 给镜像添加信息，使用 `docker inspect` 可查看镜像的相关信息，如：

- `LABEL maintainer="xx@qq.com"`
- `LABEL version="1.0"`
- `LABEL description="This is description"`

`RUN` 在新镜像内部执行的命令，比如安装一些软件、配置一些基础环境，可使用 `\` 来换行，如 `RUN apt-get update && apt-get install -y vim`。也可以使用 exec 格式 `RUN ["executable", "param1", "param2"]`，如 `RUN ["apt-get","install","-y","nginx"]` 或者 `RUN ["yum","install","-y","nginx"]`。

多条 `RUN` 用 `&&` 串成一条是个重要习惯。每条 `RUN` 都是一层，分开写不但层数多，而且第一层装的缓存文件即使在第二层删掉了，磁盘占用也还在，因为分层是只增不减的。

`COPY` 将主机的文件复制到镜像内，如果目的位置不存在，Docker 会自动创建所有需要的目录结构，但是它只是单纯的复制，并不会去做文件提取和解压工作，如 `COPY ./src/ /usr/share/nginx/html/`。

`ADD` 将主机的文件复制到镜像内，如果目的位置不存在，Docker 会自动创建所有需要的目录结构，并且会解压文件，如 `ADD ./src.tar.gz /usr/share/nginx/html/`。

这两个怎么选？官方的建议很明确，能用 `COPY` 就别用 `ADD`。`ADD` 会自动解压、还能从 URL 下载，行为不够可预测，只有确实需要解压 tar 包时才用它。

`WORKDIR` 在构建镜像时指定镜像的工作目录，之后的命令都是基于此工作目录，如果不存在则会创建目录，如 `WORKDIR /usr/share/nginx/html`。

`CMD` 指定容器启动时执行的命令，如 `CMD ["/bin/bash"]`。

`ENTRYPOINT` 同样指定容器启动时执行的命令，如 `ENTRYPOINT ["/bin/bash"]`。

`CMD` 和 `ENTRYPOINT` 同样作为容器启动时执行的命令，区别有以下几点。`CMD` 的命令会被 `docker run` 后面跟的命令覆盖，而 `ENTRYPOINT` 不会。

举例说明，使用 `CMD ["/bin/bash"]` 或 `ENTRYPOINT ["/bin/bash"]` 后，再使用 `docker run -it image` 启动容器，它会自动进入容器内部的交互终端，效果如同 `docker run -it image /bin/bash`。但是如果启动镜像的命令为 `docker run -it image /bin/ps`，使用 `CMD` 时后面的命令就会被覆盖，转而执行 `bin/ps` 命令；而 `ENTRYPOINT` 则不会被覆盖，它会把 `docker run` 后面的命令当做 `ENTRYPOINT` 执行命令的参数。

实际项目里常见的组合是两个一起用，`ENTRYPOINT` 写死程序，`CMD` 给默认参数，这样 `docker run` 时传的参数就变成了覆盖默认参数，很灵活。

`EXPOSE` 声明镜像暴露的端口，如 `EXPOSE 8080`。这里要说清楚，它仅仅是声明了一个暴露的端口，作用是帮助镜像使用者理解这个镜像服务的守护端口，以方便配置映射端口。真正让外面能访问到，还是得靠 `docker run -p`。在运行时使用随机端口映射，也就是 `docker run -P`（大写）时，会自动随机映射 `EXPOSE` 声明的端口。

`VOLUME` 声明容器需要挂载的卷，如 `VOLUME /usr/share/nginx/html`。它的作用是告诉使用者「这个路径下的数据需要持久化」，容器启动时 Docker 会为它创建一个匿名卷。我们通过 `docker inspect` 查看通过该 dockerfile 创建的镜像生成的容器，就能在 `Mounts` 里看到这个卷。原文这里写的是「在运行时使用随机卷映射，也就是 `docker run -v` 时会自动随机映射 VOLUME 的卷」，这个说法不准确，`-v` 是你显式指定宿主机路径，不存在随机映射，实际的行为是不指定 `-v` 时 Docker 自动建一个匿名卷。

`ENV` 设置容器的环境变量，如 `ENV PATH=/usr/bin`。它在构建期和运行期都生效，后面的 `RUN` 指令能读到它，容器跑起来之后进程也能读到。原文这里同样有一句「随机环境变量映射」的描述，属于前面几条的复制粘贴残留，环境变量没有随机映射这回事，运行时想覆盖用 `docker run -e KEY=VALUE`。

### 14.3 用 Dockerfile 构建 CentOS 并安装 net-tools

把上面的指令串起来看一个完整例子。

```bash
# Dockerfile_centos
FROM centos
MAINTAINER xx.com
ENV MyLocal /usr/local
WORKDIR $MyLocal
EXPOSE 80
VOLUME ["volume1","volume2"]
RUN yum install -y net-tools
RUN yum install -y vim
ADD test.tar.gz /root
COPY test.tar.gz /usr/local
CMD /bin/bash
```

这个例子里 `ADD` 和 `COPY` 同一个 `test.tar.gz` 是故意的，进容器之后你会看到 `/root` 下是解压后的目录，`/usr/local` 下是原封不动的压缩包，一眼就能看出两者的差别。

编译的时候注意最后面的 `.`：

```bash
docker build -f Dockerfile_centos -t centos:v1.0 .
```

因为文件名不叫 `Dockerfile`，所以要用 `-f` 指定。

查看构建历史用 `docker history 镜像名称或者id`，它会把每一层是哪条指令产生的、占多大体积列出来。镜像太胖的时候，先用它找出是哪一层撑大的。

### 14.4 用 Dockerfile 自动部署 Node.js 程序

这个才是前端最常用的场景。项目目录中新建 `Dockerfile`，其中 `COPY . /root/wwwroot/` 表示把项目目录中的代码复制到容器里面的 `/root/wwwroot` 目录。

```bash
FROM node

COPY . /root/wwwroot/

WORKDIR /root/wwwroot/

EXPOSE 3000

RUN npm install cnpm -g --registry=https://registry.nlark.com

RUN cnpm install

CMD node app.js
```

```bash
docker build -t nodeimg:v1.0.1 .                                  # 构建
docker run -tid --name nodeDemo -p 3000:3000 nodeimg:v1.0.1       # 运行镜像并进入容器
```

这份 Dockerfile 能跑，但有三个地方按今天的标准会改。

先说最要命的那个。`COPY . /root/wwwroot/` 写在了 `cnpm install` 前面，意味着你改一行业务代码，`COPY` 这一层的哈希就变了，后面所有层的缓存全部失效，依赖要重装一遍。正确顺序是先 `COPY package.json package-lock.json ./`，再 `RUN npm ci`，最后才 `COPY . .`。这样只要依赖没变，安装那一层永远命中缓存。

第二个是 `FROM node` 没有版本号。哪天官方把 latest 推到新的大版本，你的构建就可能莫名其妙挂掉，写成 `FROM node:16-alpine` 这种明确的标签。

第三个是 cnpm。2022 年国内网络下装 cnpm 确实能提速，但它是个额外依赖，而且对 lockfile 的处理跟 npm 不完全一致。现在更干净的做法是 `RUN npm config set registry https://registry.npmmirror.com && npm ci`，不引入新工具。

再补一句，生产镜像值得做多阶段构建，`FROM node AS builder` 里跑构建，然后 `FROM nginx` 只把产物 `dist` 拷过去。前端项目这样处理，最终镜像能从几百兆降到几十兆，因为 `node_modules` 和构建工具压根不会进最终镜像。

## 十五、Docker 网络，容器之间怎么通信

跑单个容器不用管网络，一旦你的 Node 容器要连 MySQL 容器，网络这块就绕不开了。核心问题就一个，多个容器之间如何通信，是否可以直接连接。

![多个 Docker 容器之间的网络连接关系示意](https://s.poetries.top/uploads/2022/06/26463dace73153a0.png)

先看看宿主机上的网卡信息。

![宿主机上由 Docker 创建的 docker0 网桥等网卡信息](https://s.poetries.top/uploads/2022/06/d994954b9bc09429.png)

默认情况下，同一台主机上面的容器是可以互相通信的，同一台主机上面的容器和主机之间也是可以互相通信的。

**通信原理**

我们每启动一个 Docker 容器，Docker 就会给容器分配一个 ip。只要安装了 Docker，宿主机上就会有一个网卡 `docker0`，`docker0` 使用的是桥接模式，用到的技术是 veth-pair（原文写成了 evth-pair，是笔误）。

veth-pair 可以理解成一根虚拟网线，一头插在容器里，另一头插在 `docker0` 这个虚拟交换机上。所以容器之间能互相 ping 通，走的就是这台虚拟交换机。

### 15.1 docker network 命令

```bash
docker network --help                   # 查看 network 相关的全部子命令
docker network ls                       # 查看网络列表
docker network inspect 网络ID            # 查看网络详情，网络 ID 由 docker network ls 获取
```

`docker network ls` 出来的默认三条 `bridge`、`host`、`none`，正好对应下面要讲的三种模式。

### 15.2 Docker 网络的四种模式

|Docker 网络模式|配置|说明|
|---|---|---|
|`host` 模式|`--net=host`|容器和宿主机共享 `Network namespace`|
|`container` 模式| `--net=container:NAMEorID` |容器和另外一个容器共享 `Network namespace`。 `kubernetes` 中的 `pod` 就是多个容器共享一个 `Network namespace`。|
|`none` 模式| `--net=none` |容器有独立的 `Network namespace`，但并没有对其 进行任何网络设置，如分配 `veth pair `和网桥连 接，配置 `IP` 等。|
|`bridge` 模式| `--net=bridge` |（默认为该模式）|

**host 模式**

如果启动容器的时候使用 host 模式，那么这个容器将不会获得一个独立的 Network Namespace，而是和宿主机共用一个 Network Namespace。容器将不会虚拟出自己的网卡、配置自己的 IP 等，而是使用宿主机的 IP 和端口。但是容器的其他方面，如文件系统、进程列表等还是和宿主机隔离的。

使用 host 模式的容器可以直接使用宿主机的 IP 地址与外界通信，容器内部的服务端口也可以使用宿主机的端口，不需要进行 NAT。host 最大的优势就是网络性能比较好，但是 docker host 上已经使用的端口就不能再用了，网络的隔离性不好。

![host 模式下容器与宿主机共享网络命名空间的结构](https://s.poetries.top/uploads/2022/06/c6301becc0c6096b.png)

这里有个坑要注意，host 模式在 Docker Desktop for Mac 上长期不生效，因为容器实际跑在那个隐藏的 Linux 虚拟机里，共享的是虚拟机的网络而不是你的 Mac。本地按 host 模式调通的东西，别以为在 Mac 上也一样。

**container 模式**

这个模式指定新创建的容器和已经存在的一个容器共享一个 Network Namespace，而不是和宿主机共享。新创建的容器不会创建自己的网卡、配置自己的 IP，而是和一个指定的容器共享 IP、端口范围等。同样，两个容器除了网络方面，其他的如文件系统、进程列表等还是隔离的。两个容器的进程可以通过 lo 网卡设备通信。

![container 模式下两个容器共享同一个网络命名空间](https://s.poetries.top/uploads/2022/06/eb659e57bfedb72b.png)

Kubernetes 的 Pod 就是靠这个模式实现的，一个 Pod 里的多个容器共用一套网络，互相之间用 `localhost` 就能访问。理解了这一条，再去看 K8s 的 sidecar 模式会顺很多。

**none 模式**

使用 none 模式，Docker 容器拥有自己的 Network Namespace，但是并不为容器进行任何网络配置。也就是说，这个容器没有网卡、IP、路由等信息，需要我们自己为它添加网卡、配置 IP 等。

这种网络模式下容器只有 lo 回环网络，没有其他网卡。none 模式可以在容器创建时通过 `--network=none` 来指定。这种类型的网络没有办法联网，封闭的网络能很好地保证容器的安全性。

![none 模式下容器只有 lo 回环网卡没有对外网络](https://s.poetries.top/uploads/2022/06/9edcca445e5df197.png)

跑一些纯计算、完全不需要联网的任务时可以用它，从网络层面把风险降到零。

**bridge 模式**

当 Docker 进程启动时，会在主机上创建一个名为 docker0 的虚拟网桥，此主机上启动的 Docker 容器会连接到这个虚拟网桥上。虚拟网桥的工作方式和物理交换机类似，这样主机上的所有容器就通过交换机连在了一个二层网络中。

![bridge 模式下容器通过 docker0 虚拟网桥互相连接](https://s.poetries.top/uploads/2022/06/69625851feead1f2.png)

这是默认模式，九成场景用的都是它。

创建网络以及启动容器指定网络的完整参数，可以用 help 查：

```
docker network create --help
```

### 15.3 容器网络连接实操

理论看完，动手跑一遍才踏实。先拉个 centos 镜像当测试容器。

```
docker pull centos
```

**创建一个 mysqlNet 网络**

三个参数的含义分别是：

- `--driver bridge` 配置网络类型，`bridge` 桥接
- `--subnet 192.168.1.0/24` 配置子网，建议每个网络的范围尽量小
- `--gateway 192.168.1.1` 配置网关

```
docker network create --driver bridge --subnet 192.168.1.0/24 --gateway 192.168.1.1 mysqlNet
```

原文这条命令末尾的网络名被断成了 `mysql Net`，中间多个空格会被当成两个参数，实际执行会报错，上面已经合成 `mysqlNet`。

自建网络相比默认的 `docker0` 有个很实用的好处，容器之间可以直接用容器名互相访问，Docker 内置的 DNS 会帮你解析。默认 bridge 网络上是没有这个能力的，只能靠 IP。

**启动容器指定网络**

我们启动容器的时候可以加上 `--net` 参数指定使用的网络，如果不加表示默认使用 `docker0` 网络。`--net bridge` 就表示使用 `docker0` 网络。

```bash
docker run -tid --name centos01 centos /bin/bash

# 或者
docker run -tid --name centos01 --net bridge centos /bin/bash
```

`--net mysqlNet` 表示使用我们自定义的网络。

```
docker run -tid --name centos04 --net mysqlNet centos /bin/bash
docker run -tid --name centos05 --net mysqlNet centos /bin/bash
```

同一个自定义网络里，使用主机名称就可以 ping 通。

```
# 进入centos05
docker exec -it centos05 /bin/bash

$ ping centos04
```

结果：

```bash
$ docker exec -it centos05 /bin/bash
[root@5d8bd8036698 /]# ping centos04

PING centos04 (192.168.1.2) 56(84) bytes of data.
64 bytes from centos04.mysqlNet (192.168.1.2): icmp_seq=1 ttl=64 time=1.58 ms
64 bytes from centos04.mysqlNet (192.168.1.2): icmp_seq=2 ttl=64 time=0.177 ms
64 bytes from centos04.mysqlNet (192.168.1.2): icmp_seq=3 ttl=64 time=0.123 ms
```

注意它解析出来的名字是 `centos04.mysqlNet`，网络名成了域名后缀，这就是刚才说的内置 DNS 在起作用。

**不同网络的容器默认没法通信**

我们在 `centos05` 容器内 ping `centos01` 容器，结果是不成功的，因为 `centos01` 在默认的 `docker0` 网络上。

```bash
# 进入centos05
docker exec -it centos05 /bin/bash

# ping centos01容器网络 (172.17.0.2是centos01网络ip `ip addr`获取)
ping 172.17.0.2
```

这样我们就把 centos04 和 centos05 加入了自定义的 mysqlNet 网络，centos04 和 centos05 之间是互通的，但是 mysqlNet 网络和 docker0 网络默认是不互通的。

![mysqlNet 网络与 docker0 网络相互隔离的拓扑关系](https://s.poetries.top/uploads/2022/06/a45d6c71c3c73341.png)

这种隔离其实是好事。生产上把不同业务线的容器放进不同网络，谁也扫不到谁，是很自然的一层边界。

**docker network connect 实现不同网络之间的连通**

如上图，我们想让 centos01 能访问 mysqlNet 里面的 centos04 和 centos05，这时候就需要使用 `docker network connect`。

```bash
docker network connect mysqlNet centos01
```

它做的事，是给 centos01 再插一块网卡到 mysqlNet 上。所以连完之后 centos01 会同时拥有两个 IP，一个在 docker0 网段，一个在 192.168.1.0/24 网段。

```bash
# 查看本地网络
docker network ls
```

查看网络详情：

```bash
$ docker network inspect mysqlNet

[
    {
        "Name": "mysqlNet",
        "Id": "854913f194cab31417f3f589a7970bf0d14a88d74d67bbfbfd15acd79ce774f1",
        "Created": "2022-06-30T03:13:47.053474447Z",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": {},
            "Config": [
                {
                    "Subnet": "192.168.1.0/24",
                    "Gateway": "192.168.1.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "56c1371a31196943da831b3e938d4c0c750e0654d8f103e0745baa125dd6ec81": {
                "Name": "centos01",
                "EndpointID": "22c7b14acbd9c4ded534e80bd248486a19ccba56a80445788457df1fd8e2e018",
                "MacAddress": "02:42:c0:a8:01:04",
                "IPv4Address": "192.168.1.4/24",
                "IPv6Address": ""
            },
            "5d8bd803669872ed21488f6b61077933d50e8009d105c1798da30fd0fcb0ad65": {
                "Name": "centos05",
                "EndpointID": "bc016cfdfdaa01288d33aa33ad08ff687e32b720c654396bda4d068852c1330c",
                "MacAddress": "02:42:c0:a8:01:03",
                "IPv4Address": "192.168.1.3/24",
                "IPv6Address": ""
            },
            "c34b6f27e3a7a8c4956cb3ca965fe63fbabab99c22a3846c8b5aaaa7643de905": {
                "Name": "centos04",
                "EndpointID": "daf09599773b09cbfd7b92fd14a426dc030c2ce5250277b0726366e2b2c79806",
                "MacAddress": "02:42:c0:a8:01:02",
                "IPv4Address": "192.168.1.2/24",
                "IPv6Address": ""
            }
        },
        "Options": {},
        "Labels": {}
    }
]
```

重点看 `Containers` 这一段，centos01 已经出现在里面了，拿到的 IP 是 `192.168.1.4`。这就证明连接生效了。

再 ping 一次，可以看到是成功的。

```bash
$ docker exec centos01 ping centos05

PING centos05 (192.168.1.3) 56(84) bytes of data.
64 bytes from centos05.mysqlNet (192.168.1.3): icmp_seq=1 ttl=64 time=2.28 ms
64 bytes from centos05.mysqlNet (192.168.1.3): icmp_seq=2 ttl=64 time=0.093 ms
64 bytes from centos05.mysqlNet (192.168.1.3): icmp_seq=3 ttl=64 time=0.112 ms
64 bytes from centos05.mysqlNet (192.168.1.3): icmp_seq=4 ttl=64 time=0.105 ms
64 bytes from centos05.mysqlNet (192.168.1.3): icmp_seq=5 ttl=64 time=0.154 ms
64 bytes from centos05.mysqlNet (192.168.1.3): icmp_seq=6 ttl=64 time=0.077 ms
64 bytes from centos05.mysqlNet (192.168.1.3): icmp_seq=7 ttl=64 time=0.158 ms
64 bytes from centos05.mysqlNet (192.168.1.3): icmp_seq=8 ttl=64 time=0.099 ms
```

回到实际项目。绝大多数情况你不需要手动敲这些，`docker-compose` 会自动给一组服务建一个专属网络，服务之间直接用服务名互访。但底下发生的事就是这一节讲的这些，手动跑一遍之后，compose 里那些配置就不再是黑盒了。

## 总结

这篇从 `ls` 一路写到 `docker network connect`，内容确实杂，但如果只让我留三条，我会留这三条。

第一条，出问题时的排查顺序比记住命令更值钱。`top` 看整机，`ps` 找进程，`netstat` 看端口，`df` 看磁盘，四步走完，绝大多数「服务访问不了」都能定位。云主机上还要多看一眼安全组，那一层在机器外面，`firewall-cmd` 是查不出来的。

第二条，Nginx 那层不是可有可无的。反向代理带来的不只是多域名共用 80 端口，还有 HTTPS 终结、静态资源分发、平滑 reload。前端做部署，把 `proxy_set_header` 那三行和 `nginx -t` 这个习惯刻进肌肉记忆，能少踩一半的坑。

第三条，Docker 真正解决的是环境一致性，不是省几条命令。裸机装 MySQL 那十几步和 `docker run` 那一条，表面看是效率差异，实际差异在于前者会在机器上留下没人说得清的历史，后者删掉重建就是干净的。理解了镜像分层和可写层这两件事，你写 Dockerfile 的顺序和挂载策略自然就对了。

这篇里的命令绝大部分是 CentOS 7 环境下验证过的，Docker 部分是在 Docker Desktop 20.10 上跑的。CentOS 7 已经 EOL，迁到 Rocky Linux 之后 `yum` 换成 `dnf`，其余基本通用。文中标注的那几处 SSL 和 Dockerfile 的过时写法，照抄新版本会直接报错，记得改。

如果你想要一份更纯粹的命令速查，我在 2016 年还整理过一篇 [73 条日常 Linux shell 命令汇总](https://feinterview.poetries.top/blog/73条日常Linux-shell命令汇总)，那篇偏工具书，和这篇按场景组织的思路刚好互补。

## 参考

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Hub](https://hub.docker.com)
- [Nginx 官方文档](https://nginx.org/en/docs/)
- [PM2 官方文档](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [MongoDB 在 Red Hat 系上的安装文档](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-red-hat/)
- [MySQL Yum 仓库下载页](https://dev.mysql.com/downloads/repo/yum)
- [Mozilla SSL 配置生成器](https://ssl-config.mozilla.org/)
- [前端进阶之旅](https://interview.poetries.top)
