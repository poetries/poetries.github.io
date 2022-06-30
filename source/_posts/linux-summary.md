---
title: Linux与Docker系统运维总结
date: 2022-06-30 15:32:41
tags: Linux
categories: Back-end
---

## Linux简单介绍

- Linux 是一套开源操作系统，它有稳定、消耗资源小、功能很强、安全性高等特点，让它在 服务器领域有庞大的用户群体
- 目前市面上较知名的发行版有：RedHat、Ubuntu、CentOS、Debian、Fedora、SuSE、OpenSUSE、 Arch Linux、SolusOS 等
- 常见的服务器操作系统主要有 `CentOS` 、`Ubuntu`、`Debian`,`CentOS` 现在市场占有率第一

## Linux常用命令

- `init 0 `  关机 
- `init 6`   重启   
- `ls`  、 `ls -l`  、  `ll` 列出出当前目录下的文件 
- `cd`  切换目录
- `pwd` 查看当前路径
- `ctrl+c`     中断当前程序
- `ctrl+l  / (clear)`   清屏
- `ifconfig/ipconfig`    查看网卡信息
- `ping 127.0.0.1`   看网络是否通畅
- Linux 创建用户修改密码
  - 添加用户 `useradd zhangsan`
  - 设置密码 `passwd zhangsan`
  - 删除用户 `userdel -rf zhangsan`  `-r`：递归的删除目录下面文件以及子目录下文件。
- 文件管理
  - 创建文件 `touch file`
  - 删除文件 `rm -rf file`
    - `-r`：递归的删除目录下面文件以及子目录下文件。
		- `-f`：强制删除，忽略不存在的文件，从不给出提示	
  - 修改文件名 `mv file1 file11`
  - 查看文件内容 `cat file1`
  - 复制文件 `cp file2 file22`
  - 移动文件 `mv file1 file11`
  - 编辑文件 `vi file1`
  - 批量创建文件 `touch file{1..10}` 	`rm -rf file{1..10}`
  - 查看文件前3行 `cat file1 | head -3`
  - 查看文件后3行	`cat file1 | tail -3`
  - liunx服务器上面查找文件
    - `find` 查找文件
      - `find / -name httpd.conf` 查找当前目录下的文件名为 `httpd.conf` 的文件
      - `find` 目录 `-name`  文件名
  - 查找文件里面内容找到`httpd.conf` 里面有`listen`
    - `cat httpd.conf | grep listen`
    - `cat httpd.conf | grep -ignore listen   /  cat httpd.conf | grep -i listen`  忽略大小写
  - 查找文件里面内容  vi搜索 
    - `vi  httpd.conf`
    - 输入 `/Listen` 搜索`Listen` `N`下一个
- Linux 目录管理
  - 创建目录 `mkdir dir1 dir2 dir3`
  - 删除目录 `rm -rf dir1 dir2`
    - `-r`：递归的删除目录下面文件以及子目录下文件。
		- `-f`：强制删除，忽略不存在的文件，从不给出提示
		- `rm -rf  dir* ` 以`dir`开头的所有文件删除
  - 重命名目录或移动目录	`mv dir1 dir11`
  - 查看目录 `ls  / ll`
  - 递归创建目录 `mkdir -p a/b/c/d/e/f/g` 创建多层级目录
  - 递归查看目录 `tree a`  tree命令不存在的话需要安装 `yum install tree -y`
  - 复制目录 `cp  -rf  wwwroot/ mywwwroot/`
- Linux 打包压缩别名管理
  - zip压缩包
    - 安装zip减压软件 `yum install -y unzip zip`
    - zip压缩包 `zip -r public.zip public` `-r` 递归 表示将指定的目录下的所有子目录以及文件一起处理
    - 解压 `unzip public.zip` `unzip public.zip -d dir`
    - 查看 `unzip -l public.zip`
  - gz压缩包:  (源代码压缩)
    - Linux下最常用的打包程序就是tar了，使用tar程序打出来的包我们常称为tar包，tar包文件的命令通常都是以.tar结尾的。生成tar包后，就可以用其它的程序来进行压缩了，所以首先就来讲讲tar命令的基本用法
    - 制作gz包 `tar czvf public.tar.gz public`
    - 解压gz包 `tar xzvf public.tar.gz`
    - 查看gz包 `tar tf public.tar.gz`
  - tar包
    - `tar cvf wwwroot.tar wwwroot` 仅打包，不压缩！
    - 解压tar包 `tar xvf wwwroot.tar` 
  - xz压缩包
    - 对于xz这个压缩相信很多人陌生，但xz是绝大数linux默认就带的一个压缩工具，xz格式比7z还要小。
    - 制作
			- `tar  cvf xxx.tar xxx`  这样创建xxx.tar文件先，
			- `xz  xxx.tar`      将 xxx.tar压缩成为 xxx.tar.xz	   删除原来的tar包
			- `xz  -k xxx.tar`     将 xxx.tar压缩成为 xxx.tar.xz	  保留原来的tar包
    - 解压
			- `xz   -d  ***.tar.xz`   先解压xz   删除原来的xz包
			- `xz  -dk  ***.tar.xz`   先解压xz  保留原来的xz包
			- `tar  -xvf  ***.tar` 再解压tar
      - 查看 `xz  -l  ***.tar.xz`   先解压xz
  - 别名管理
    - 添加别名
		  - `alias chttp='cat /etc/httpd/conf/httpd.conf'`
			- `chttp`
    - 删除别名 `unalias chttp`
    - 查看别名 `alias`
- 用户管理、用户权限管理
  - 用户管理
    - 添加用户 `useradd lisi`
    - 设置密码 `passwd lisi`
    - 删除用户
      - `userdel -r lisi`
      - `-r`：递归的删除目录下面文件以及子目录下文件。
			- 备注：删除用户的时候用户组被删除
    - 查看用户 `id user`
    - 把用户加入组 
      - `gpasswd -a testuser root`
      - 把用户`testuser`加入到`root`组，加入组后`testuser`获取到`user`组及`root`组所有权限
    - 把用户移出租 `gpasswd -d testuser root`
  - 用户权限管理
    - drwxr-xr-x.   2 root root 6 4月  11 2022 mnt
		- `rwx`   当前用户对mnt有读写执行权限      `u`
		- `r-x`   当前用户的组对mnt文件有读和执行  `g`
		- `r-x`   其他用户对mnt也具有读和执行      `o`
    - 权限:
      `r` 读
      `w` 写
      `x` 执行
    - 用户:
      - 所有者   `user u`
      - 所属组   `group  g`
      - 其他用户 `other  o`
      - 所有用户 `all     a`  `u+g+o=a`(表示所有人) 
    - 目录的rwx
      - `r`  查看目录里面的文件(4)
      - `w` 在目录里创建或删除文件(2)
      - `x`  切换进目录(1)
    - 文件的rwx
      - `r` 查看文件内容
      - `w` 在文件里写内容
      - `x` 执行该文件(文件不是普通文件，是程序或脚本)
    - chmod权限分配
      - `+`增加权限         -删除权限
      - `chmod u+x my.sh`   给当前用户分配执行`my.sh`的权限
      - `chmod o+r,o+w file.txt`    给其他用户分配对`file.txt`的读写权限
      - `chmod o+r,o+w,o+x mnt/`     给所有其他用户分配对mnt目录的进入、读取、写入权限
      - `chmod -R o+r,o+w,o+x mnt/`       修改目录下的所有文件的权限为可读、可修改、可执行
      - `chmod 755 file`
      - `chmod -R 777 wwwroot/`  修改目录下的所有文件的权限为可读、可修改、可执行
- rpm软件安装卸载
  - rpm命令安装卸载查找rpm包
    - 挂载光盘
      - `mount dev/cdrom /media`  挂载
      - `df`  查看光盘是否挂载
			- 卸载`umount /media`
    - rpm安装
			- `rpm -ivh` `rpm`软件包
		- `rpm`卸载软件
      - `rpm -e net-tools` `net-tools`表示要卸载的软件包
		- 查看`rpm`软件包的安装位置 / 软件包是否安装 `rpm -ql net-tools`
  - Yum安装rpm 卸载rpm 查看rpm包
    - yum安装rpm包
			- `yum install -y net-tools`              包括 `netstat` `ifconfig`等命令
			- `yum install -y unzip zip`               `zip`压缩减压
			- `yum install -y mlocate`                 `updatedb`
			- `yum install -y wget`                    下载文件包
			- `yum -y install psmisc`                   `pstree | grep httpd`   查看进程    `pstree -p`   显示进程以及子进程
		- `yum`卸载`rpm`包
			- `yum -y remove wget`
		- `yum`搜索`npm`包
			- `yum search` 名称
		- `yum`查看`rpm`包
			- `yum list `
			- `yum list | grep httpd`
			- `yum list updates`  列出所有可更新的软件包
			- `yum list installed`   列出所有已安装的软件包
		- yum显示rpm包信息
			- `yum info package1`
			- `yum info httpd`   
			- `yum info zip`
			- `yum info unzip`
    - yum 安装Apache 
			- `yum -y install httpd`  `service httpd start`   安装启动`apache`
			- 启动`apache`
			- 关闭防火墙  `systemctl stop firewalld`
	  - `yum`的主配置文件 `etc/yum.conf`
	  - `yum`的仓库配置文件 `/etc/yum.repo.d/*.repo`
    - Yum 安装Nginx：
      - 安装nginx源
        - `sudo rpm -ivh http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-7-0.el7.ngx.noarch.rpm`
      - 查看Nginx源是否配置成功　
        - 通过`yum search nginx`看看是否已经添加源成功。如果成功则执行下列命令安装Nginx。
        - 或者 `npm info nginx`也可以看看`nginx`源是否添加成功
      - 安装Nginx `sudo yum install -y nginx`
      - 启动Nginx并设置开机自动运行 
        - `sudo systemctl start nginx.service`
        - `sudo systemctl enable nginx.service`
- 源代码包的安装
  - 先安装源代码编译的软件`gcc`，`make`，`openssl` 如下：
  - `yum install -y gcc make gcc-c++ openssl-devel`
  - 检查系统中是否已经安装 gcc：`rpm -qa | grep gcc  /  rpm -ql  gcc ` 
  - 编译安装源代码包
		- 生成编译配置文件(`Makefile`)
		- 开始编译(`make`)
		- 开始安装(`make install`)
	- 安装`httpd-2.2.9.tar.gz`源代码:
		- 减压并cd到对应目录
		- `./configure --prefix=/usr/local/nodejs`              安装路径设置为`/usr/local/apache`
		- `make   /  make -j4`
		- `make install`
  - 删除源代码包
		- 结束当前源代码进程
		- 删除源代码
		  - 如：结束进程
			  - `pstree|grep httpd`
				- `pkill httpd`
			- 删除源代码
			  - `cd  /usr/local/`
			  - 直接删除源代码 `rm -rf apache/`
	- linux下源代码安装nodejs:
		- 下载nodejs源码包
		- 减压到`usr/local/nodejs` 目录
		- `./configure`
		- `make   /  make -j4`
		- `make install`
- Linux 内存、cpu、进程、端口、硬盘管理 
  - top命令 查看内存 cpu 进程 以及服务器负载
    - top命令的第一行：
			- `top` - 15:31:47 up  9:30,  3 users,  load average: 0.00, 0.02, 0.05
			- 依次对应：系统当前时间 up 系统到目前为止i运行的时间， 当前登陆系统的用户数量， load average后面的三个数字分别表示距离现在一分钟，五分钟，十五分钟的负载情况。
		- top命令的第二行：
			- Tasks: 133 total,   1 running, 132 sleeping,   0 stopped,   0 zombie
			- 依次对应：tasks表示任务（进程），133 total则表示现在有133 个进程，其中处于运行中的有1个，132 个在休眠（挂起），stopped状态即停止的进程数为0，zombie状态即僵尸的进程数为0个。
		- top命令的第三行，cpu状态：
			- %Cpu(s):  0.2 us,  0.4 sy,  0.0 ni, 99.3 id,  0.0 wa,  0.0 hi,  0.1 si,  0.0 st
			- 只看空闲就可以了：cpu空闲率为99.3%
		- top命令的第四行，内存状态：
			- KiB Mem :  2897496 total,  1995628 free,   191852 used,   710016 buff/cache
			- 总内存:2.76g  空闲：1995628/1024/1024=1.9g   已经使用0.18g   缓存区内存0.67g  
			- 缓冲区是从主内存中特地预留出的内存，用来存放特定的一些信息，例如从磁盘中取得的文件表，程序正在读取的内容等等
	- 看当前登录的账户who、查看最新操作电脑的用户last
		- `who`命令: 显示当前正在系统中的所有用户名字，使用终端设备号，注册时间。 
		- `whoami` : 显示出当前终端上使用的用户。 
		- `last`: `last`作用是显示近期用户或终端的登录情况
	- 查看进程关闭进程
    - 查看进程
			- `pstree`        查看进程树
			- `pstree -ap`     显示所有信息
			- `pstree | grep httpd`
			- `pstree -ap | grep httpd`
			- `ps -au`
			- `ps -au |grep httpd`
			- `ps -aux`
		  - `ps` 中`aux`的含义:
			  - 显示现行终端机下的所有程序，包括其他用户的程序（`a`）
			  - 以用户为主的格式来显示程序状况。 （`x`）
			  - 显示所有程序，不以终端机来区分（`u`）
		- 关闭进程
			- `pkill httpd`   `pkill`进程的名字
			- `kill 2245`    `kill`进程号
			- `kill -9 1234`   `kill -9`进程号  强制杀死
			- `kill：执行`kill`命令，系统会发送一个SIGTERM信号给对应的程序。当程序接收到该signal信号后，将会发生以下事情：
			程序立刻停止
			- 当程序释放相应资源后再停止
			- 程序可能仍然继续运行
			- 大部分程序接收到SIGTERM信号后，会先释放自己的资源，然后再停止。但是也有程序可能接收信号后，做一些其他的事情（如果程序正在等待IO，可能就不会立马做出响应，我在使用wkhtmltopdf转pdf的项目中遇到这现象），也就是说，SIGTERM多半是会被阻塞的。
			- `kill -9`:  `kill -9`命令，系统给对应程序发送的信号是SIGKILL，即`exit`。`exit`信号不会被系统阻塞，所以`kill -9`能顺利杀掉进程。
  	- 查看端口 `netstat -tunpl |grep httpd`
  - 查看硬盘信息：
		- `df`命令作用是列出文件系统的整体磁盘空间使用情况。可以用来查看磁盘已被使用多少空间和还剩余多少空间。
		- `df -h`  以人们易读的方式显示，总共多少g用了多少g
		- `df /home`   查看该文件夹所在磁盘的使用情况
- Linux `systemctl`管理服务
	- `yum`安装`httpd`
		- `yum install -y httpd`
		- `systemctl start httpd`
	- `systemctl`管理服务
		- 启动服务：`systemctl start httpd`
		- 关闭服务：`systemctl stop httpd`
		- 重启服务：`systemctl restart httpd`
		- 查看一个服务的状态：`systemctl status httpd`
		- 查看一个服务是否在运行：`systemctl is-active httpd`
		- 查看当前已经运行的服务：`systemctl list-units -t service`
		- 列出所有服务：  `systemctl list-units -at service` 注意顺序 
		- 设置开机自启动：	`systemctl enable httpd`
		- 停止开机自启动：	`systemctl disable httpd`
		- 列出所有自启动服务：
			- `systemctl list-unit-files|grep enabled``
			- `systemctl list-unit-files|grep disabled``
			- `systemctl list-unit-files|grep disabled | grep httpd``
		- 使指定服务从新加载配置：`systemctl reload httpd`    
- Firewalld防火墙和SELinux防火墙的设置
	- `firewalld`的基本使用:
		- 启动： `systemctl start firewalld`
		- 关闭： `systemctl stop firewalld`
		- 查看状态： `systemctl status firewalld`
		- 开机禁用 ： `systemctl disable firewalld`
		- 开机启用 ： `systemctl enable firewalld`
	- `firewall-cmd`的基本使用:
		- 那怎么开启一个端口呢: `firewall-cmd --zone=public --add-port=80/tcp --permanent` （`–permanent`永久生效，没有此参数重启后失效）
		- 重新载入: `firewall-cmd --reload`  修改`firewall-cmd`配置后必须重启
		- 查看: `firewall-cmd --zone= public --query-port=80/tcp`
		- 删除: `firewall-cmd --zone= public --remove-port=80/tcp --permanent`
		- 查看所有打开的端口：`firewall-cmd --zone=public --list-ports`
  - SELinux防火墙的设置
		- 修改`/etc/selinux/config` 文件
		- 将`SELINUX=enforcing`改为`SELINUX=disabled`

## 配置服务器的免密码快捷登录

### 登录服务器: ssh

> ssh，`secure shell protocol`，以更加安全的方式连接远程服务器

```bash
# root: 用户名
# 192.168.13.21
$ ssh root@192.168.13.21
```

### 配置别名快速登录：ssh-config

> 在本地电脑上配置 `ssh-config`，对自己管理的服务器起别名，可以更方便地登录多台云服务器

**ssh-config 的配置文件**

```bash
/etc/ssh/ssh_config

~/.ssh/config
```

示例

```bash
# 修改~/.ssh/config配置
Host tencent # 服务器别名
  HostName 413.12.151.18
  User root

Host server # 服务器别名
  HostName 192.168.105.130
  User root
```

> 配置成功之后直接 `ssh`  就可以直接登录

```bash
# 登录服务器1
ssh tencent

# 登录服务器2
ssh server
```

### 免密登录：public-key 与 ssh-copy-id

**把自己的公钥放在远程服务器的 authorized_keys 中**

> 把本地文件 `~/.ssh/id_rsa.pub` 中内容复制粘贴到远程服务器 `~/.ssh/authorized_keys`

简单来说，就是 Ctrl-C 与 Ctrl-V 操作，不过还有一个更加有效率的工具: `ssh-copy-id`。

```bash 
# 在本地环境进行操作

# 提示你输入密码，成功之后可以直接 ssh 登录，无需密码
$ ssh-copy-id tencent

# 登陆成功，无需密码
$ ssh tencent
```

```bash
# 登录成功服务器，可以看到authorized_keys中的公钥信息

Last login: Tue Jun 28 09:31:25 2022
[root@VM-8-14-centos ~]# cat ~/.ssh/authorized_keys

ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCf4fy+KhLFADybnII3OOOI0MAghkuYgEqPLAbhQfrL+zjj1qSoX1dnaZ9PULykGU+QN4nyRrduZOgvDaUCMR+vPDJH3Nii45HUuKWBpdyA/L1sQ7pLKsBsOca7HK4U0P7lrux2IfnOmbYCz4xPsbc/RDArkYbc2uIszmwvdtgGL49fJn6VUC0TaQvRX5dQWznyC3HgarBze2NoilXfKsBr5V2Moc83QkUZdU8fFiiiolpDHf2narGwz+r1bhZrazfI72nOUTjXd5GXd+VOnZdxnk8njBeAAW87RwZ3b2Cg5FsEckzKWP5ddvVxoPEv8cmk= xx@qq.com
[root@VM-8-14-centos ~]# 
```

### 保持连接，防止断掉

我们可以通过 `man ssh-config`，找到每一项的详细释义。

```bash 
# 编辑 ~/.ssh/config

Host *
  ServerAliveInterval 30
  TCPKeepAlive yes
  ServerAliveCountMax 6
  Compression yes
```

## Linux环境变量

通过 `printenv` 可获得系统的所有环境变量

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

> 我们也可以通过 `printenv`，来获得某个环境变量的值

```bash
$ printenv NVM_BIN

/Users/poetry/.nvm/versions/node/v16.15.0/bin
```

> 通过 `$var` 或者 `${var}` 可以取得环境变量，并通过 `echo`` 进行打印

```bash
$ echo $path

/Users/poetry/.nvm/versions/node/v16.15.0/bin /opt/anaconda3/bin /usr/local/bin /usr/local/sbin /usr/local/bin /usr/bin /bin /usr/sbin /sbin
```

- `$HOME` 当前用户目录，也就是 `~` 目录
- `$USER` 当前用户名
- `$PATH` 环境变量，指向环境变量的路径
- `$SHELL` 当前用户的 shell，比如 `bash`、`zsh`、`fish` 等
- `export` 可以用来设置环境变量，比如 

```bash
$ export PATH=/usr/local/bin:$PATH 
$ export NODE_ENV=production

$ echo $NODE_ENV
production

# 如果需要使得配置的环境变量永久有效，需要写入 ~/.bashrc 或者 ~/.zshrc
```

> 在执行命令之前置入环境变量，可以用以指定仅在该命令中有效的环境变量。

```bash
# 该环境变量仅在当前命令中有效
$ NODE_ENV=production printenv NODE_ENV
production

# 没有输出
$ printenv NODE_ENV

# 在前端中大量使用，如
$ NODE_ENV=production npm run build
```

## 使用 rsync进行文件拷贝

> 快速高效，支持断点续传、按需复制的文件拷贝工具，并支持远程服务器拷贝，建议在本地也使用 `rsync` 替换 `cp` 进行文件拷贝

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

> 拷贝目录，则需要看原目录是否以 `/` 结尾

- 不以 `/` 结尾，代表将该目录连同目录名一起进行拷贝
- 以 `/` 结尾，代表将该目录下所有内容进行拷贝

## 服务安装

### mongodb4.x的安装配置

> 官方文档：https://docs.mongodb.com/manual/tutorial/install-mongodb-on-red-hat/

#### Mongodb的安装

**配置yum源**

1. 在路径`/etc/yum.repos.d/`下创建文件`mongodb-org-4.0.repo`


```bash
cd /etc/yum.repos.d/
touch mongodb-org-4.0.repo
```

2. 在文件`mongodb-org-4.0.repo`中写入如下内容(下面内容可以直接复制，也可以复制官方文档)
		
	
```bash 
[mongodb-org-4.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/4.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-4.0.asc
```

3. 安装mongodb  
		
```
yum install -y mongodb-org
```

4. 开启mongodb服务

```bash
systemctl start mongod 

# 进入mongod终端
$ mongo
```

![](https://s.poetries.work/uploads/2022/06/366a505fdb77ca61.png)

5. 设置开机启动mongodb	

```
systemctl enable mongod
```


#### 远程连接mongodb

- 修改mongo.conf文件
	- 命令：`sudo  vi /etc/mongod.conf`
	- 将原来bindIp: `127.0.0.1` 修改为`0.0.0.0`
  ![](https://s.poetries.work/uploads/2022/06/2e64b45acc69230d.png)
- 重启动mongo服务：`service mongod restart`
- 永久开放`27017`端口：
	- `firewall-cmd --zone=public --add-port=27017/tcp --permanent;` （`--permanent`永久生效，没有此参数重启后失效）
	- `firewall-cmd --reload` 
		
#### Mongodb4.x卸载

- 停止服务 `service mongod stop`
- 删除安装的包
  - `rpm -qa | grep mongodb-org`   列出所有的包
  - `yum remove -y $(rpm -qa | grep mongodb-org)`
  - 也可以尝试下面命令卸载 `yum remove -y  mongodb-org*`
- 删除数据及日志
	- `rm -r /var/log/mongodb`
	- `rm -r /var/lib/mongo`

### mysql安装配置

找到`mysql`的`yum`源`rpm`包 https://dev.mysql.com/downloads/repo/yum

> mysql安装源地址：http://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm


查看机器上面是否安装过mysql

```bash
rpm -qa | grep mysql*
yum list installed | grep mysql*
```


**mysql的安装：**

- 安装配置yum源 `rpm -ivh http://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm`
- 安装 `yum -y install mysql-server`
- 启动 `mysql` `systemctl start mysqld`
- mysql开机启动	`systemctl enable mysqld`		
- 修改 mysql 密码	
  - 查看mysql默认安装以后的密码
  - mysql 安装完成之后，在`/var/log/mysqld.log` 文件中给 `root` 生成了一个默认密码。通过下面的方式找到 root 默认密码，然后登录 mysql 进行修改
- `mysql -u root -p`    输入密码
- `ALTER USER 'root'@'localhost' IDENTIFIED BY 'MyNewPass4!'`;
- `ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';`
- 默认情况mysql对密码要求非常严格
  - 修改密码策略 在`/etc/my.cnf` 文件添加 `validate_password_policy` 配置，指定密码策略
  - 选择 `0（LOW），1（MEDIUM），2（STRONG）`其中一种，选择 `2` 需要提供密码字典文件
    - `validate_password_policy=0`
		- 如果不需要密码策略，添加 my.cnf 文件中添加如下配置禁用即可：`validate_password = off`
		- 重新启动 mysql 服务使配置生效：`systemctl restart mysqld`
- 远程管理mysql  添加 `mysql` 远程登录用户
  - 把`host`改为`%`
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
	- 配置防火墙
    - `firewall-cmd --zone=public --add-port=3306/tcp --permanent`
    - `firewall-cmd --reload`
		- 最后注意：重启`mysql`


### 安装redis

1. 检查是否有 `redis` yum 源

```bash
yum search redis 
yum info redis
```

2. 安装 epel 仓库

> EPEL (Extra Packages for Enterprise Linux)是基于 Fedora 的一个项目，为“红帽系”的操作系 统提供额外的软件包，适用于 RHEL、CentOS 和 Scientific Linux.

```
yum install epel-release -y
```

3. 安装 redis 数据库

```bash
yum info redis 
yum install redis -y
```

4. 安装完毕后，使用下面的命令启动 redis 服务

```bash
systemctl start redis
systemctl restart redis

# 开机启动
systemctl enable redis
```

linux 上面进入 Redis 客户端

```
redis-cli
```

### nginx+nodejs 一台服务器站架多个网站

![](https://s.poetries.work/uploads/2022/06/f3bd51d6f4acf247.png)

#### 搭建 Nodejs 生产环境

- 下载 nodejs 二进制代码包，然后减压到 `/usr/local/nodejs`
- **配置环境变量**
  - `vi /etc/profile`
  - 最后面添加： 
    - `export NODE_HOME=/usr/local/nodejs/bin`
    - `export PATH=$NODE_HOME:$PATH`
  - `:wq` 保存，然后运行 `source /etc/profile`

#### nodejs 进程管理器 pm2 的使用

> PM2 是一款非常优秀的 Node 进程管理工具，它有着丰富的特性：能够充分利用多核 CPU 且能够负载均衡、能够帮助应用在崩溃后、指定时间(cluster model)和超出最大内存限制 等情况下实现自动重启。 PM2 是开源的基于 Nodejs 的进程管理器，包括守护进程，监控，日志的一整套完整的功能。

**PM2 的主要特性:**

- 内建负载均衡（使用 Node cluster 集群模块） 
- 后台运行 
- 0 秒停机重载，我理解大概意思是维护升级的时候不需要停机. 
- 具有 Ubuntu 和 CentOS 的启动脚本 
- 停止不稳定的进程（避免无限循环） 
- 控制台检测

**PM2 的常见命令**

```bash
npm install pm2 -g
```

> 运行 `pm2` 的程序并指定 `name`

```bash
pm2 start app.js --name appName 
pm2 start app.js -i 3 --name appName 3 # 启动 3 个进程 （自带负载均衡）
```

- 显示所有进程状态 `pm2 list`
- 显示所有进程状态 `pm2 logs`
- 显示一个进程的日志 `pm2 logs appName`
- 关闭重启所有进程
  - `pm2 stop all` # 停止所有进程
  - `pm2 restart all` # 重启所有进程
  - `pm2 reload all` # 0 秒停机重载进程 (用于 NETWORKED 进程)
- 关闭重启指定进程
  - `pm2 stop 0` # 停止指定的进程 
  - `pm2 restart 0` # 重启指定的进程
  - `pm2 stop appName `
  - `pm2 restart appName`
- 杀死进程
  - `pm2 delete 0` # 杀死指定的进程
  - `pm2 delete all` # 杀死全部进程
  - `pm2 delete appName` # 杀死指定名字的进程
- 显示相应进程/应用的总体信息
  - `pm2 show appName`

#### Nginx 的安装

1. 安装 nginx 源

```
sudo rpm -ivh http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-7-0.el7.ngx.noarch.rpm
```

2. 查看 Nginx 源是否配置成功

- 通过 `yum search nginx` 看看是否已经添加源成功。如果成功则执行下列命令安装 Nginx。 
- 或者 `npm info nginx` 也可以看看 nginx 源是否添加成功

3. 安装 Nginx

```
sudo yum install -y nginx
```

4. 启动 Nginx 并设置开机自动运行

```
sudo systemctl start nginx 
sudo systemctl enable nginx
```

#### Nginx 反向代理配置

1. 关闭 Selinux

```bash
# 修改 SELINUX=enforcing 为 SELINUX=disabled 
vi etc/selinux/config 
# 必须重启 
linux init 6
```

2. 配置 `firewalld` 开启 `80` 端口

```bash
firewall-cmd --zone=public --list-ports

firewall-cmd --zone=public --add-port=80/tcp --permanent
```

3. 配置反向代理

找到 `/etc/nginx/conf.d` 然后在里面新建对应网站的配置文件

![](https://s.poetries.work/uploads/2022/06/34c70c7723b1c5b3.png)

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

**重启 nginx**

```
systemctl restart nginx
```

- `nginx -t` 看配置是否正确 
- `systemctl stop nginx`  停止nginx
- `systemctl start nginx` 启动nginx

**域名测试**

找到 `C:\Windows\System32\drivers\etc\hosts`

```bash
192.168.1.128 
192.168.1.128 www.bbb.com
```

> 浏览器输入 `www.aaa.com` nginx 转发到了 `127.0.0.1:3001`

#### 相关防火墙配置

```bash 
# 添加
firewall-cmd --zone=public --add-port=80/tcp --permanent

#  刷新
firewall-cmd --reload

# 查看所有打开的端口： 
firewall-cmd --zone=public --list-ports

# 删除
firewall-cmd --zone= public --remove-port=3306/tcp --permanent
```

#### nginx+nodejs多台服务器负载均衡

![](https://s.poetries.work/uploads/2022/06/2025927792fe986a.png)

**负载均衡的种类**

- 一种是通过硬件来进行解决，常见的硬件有 NetScaler、F5、Radware 和 Array 等商用的 负载均衡器，但是它们是比较昂贵的
- 一种是通过软件来进行解决的，常见的软件有 LVS、Nginx、apache 等,它们是基于 Linux 系统并且开源的负载均衡策略.

> Nginx 的特点是占有内存少，并发能力强，事实上 nginx 的并发能力确实在同类型的网页服 务器中表现最好，中国大陆使用 nginx 网站用户有：新浪、网易、 腾讯等

**nginx 的 upstream 目前支持 3 种方式的分配**

- 轮询（默认）
  - 每个请求按时间顺序逐一分配到不同的后端服务器，如果后端服务器 down 掉， 能自动剔除。
- `weight 权重` ——you can you up
  - 指定轮询几率，weight 和访问比率成正比，用于后端服务器性能不均的情况
- `ip_hash` ip 哈希算法
  - 每个请求按访问 ip 的 hash 结果分配，这样每个访客固定访问一个后端服务器， 可以解决 session 的问题。
- 配置负载均衡
  - 找到 `/etc/nginx/conf.d` 然后在里面新建对应网站的配置文件

![](https://s.poetries.work/uploads/2022/06/2977a3d908a6b1b3.png)

> 重启 nginx：`systemctl restart nginx`

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

**负载均衡操作演示**

> 我们使用docker跑三个nodejs应用程序作为演示

![](https://s.poetries.work/uploads/2022/06/7bdc4513afb0e8c5.png)

- **使用koa搭建三个服务3001,3002,3003**

1. 3001服务

```js
const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
  ctx.body = 'Hello World 3001';
});

app.listen(3001, ()=>console.log('http://localhost:3001'));
```

2. 3002服务

```js
const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
  ctx.body = 'Hello World 3002';
});

app.listen(3002, ()=>console.log('http://localhost:3002'));
```

3. 3003服务

```js
const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
  ctx.body = 'Hello World 3003';
});

app.listen(3003, ()=>console.log('http://localhost:3003'));
```

> 在本地启动以上三个服务

- **docker运行Nginx**

```bash
# nginx/Dockerfile
FROM daocloud.io/library/nginx:1.13.0-alpine
# 拷贝配置文件到Nginx目录覆盖默认配置
# COPY conf/nginx.conf /etc/nginx/conf/nginx.conf
COPY ./conf.d /etc/nginx/conf.d
```

> 本机`conf.d/default.conf`文件

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

- 构建nginx镜像 `docker build -t nginx-demo .`
- 运行nginx镜像 `ddocker run --name nginx -d -p 8666:80(本机端口:容器端口) -v /Users/poetry/Download/docker/nginx/conf.d:/etc/nginx/conf.d(本机配置文件目录:容器配置文件目录) e00b36d6975b(nginx镜像ID)`
- 运行 `docker ps` 查看启动的服务
- 修改配置`nginx/conf.d`需要重启容器才生效 `docker restart nginx(容器名称)`

> 修改`upstream bakeaaa`中的权重等，可以看到不断刷新页面，可以看到不同的服务器负载均衡的效果

![](https://s.poetries.work/uploads/2022/06/99bc3d74f889990a.png)

### 云服务器部署node项目

1. 安装 nginx

安装nginx源 

```
sudo rpm -ivh http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-7-0.el7.ngx.noarch.rpm
```

查看 Nginx 源是否配置成功

- 通过 `yum search nginx` 看看是否已经添加源成功。如果成功则执行下列命令安装 Nginx。 
- 或者 `npm info nginx` 也可以看看 nginx 源是否添加成功

安装nginx源

```
sudo yum install -y nginx
```

启动 `Nginx` 并设置开机自动运行 

```
sudo systemctl start nginx sudo systemctl enable nginx
```

2. 安装 nodejs

下载 nodejs 二进制代码包，然后减压到 `/usr/local/nodejs` 

配置环境变量 

`vi /etc/profile`

最后面添加

```
export NODE_HOME=/usr/local/nodejs/bin 
export PATH=$NODE_HOME:$PATH
```

`:wq` 保存，然后运行 `source /etc/profile`

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

### nginx配置https

**为什么要使用 https**

> HTTPS（全称：Hyper Text Transfer Protocol over Secure Socket Layer），是以安全为目标的 HTTP 通道，简单讲是 HTTP 的安全版。 

HTTPS 是在 HTTP 的基础上添加了安全层，从原来的明文传输变成密文传输，当然加密与解 密是需要一些时间代价与开销的，不完全统计有 10 倍的差异。在当下的网络环境下可以忽 略不计，已经成为一种必然趋势。 

目前微信小程序请求 Api 必须用 https、Ios 请求 api 接口必须用 https

**配置 https**

证书类型 

- 域名型 https 证书（DVSSL）：信任等级一般，只需验证网站的真实性便可颁发证书保护网站
- 企业型 https 证书（OVSSL）：信任等级强，须要验证企业的身份，审核严格，安全性更高
- 增强型 https 证书（EVSSL）：信任等级最高，一般用于银行证券等金融机构，审核严格，安全性最高， 同时可以激活绿色网址栏


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


## docker系统管理

### docker简介与安装

> Docker 是一个跨平台的开源的应用容器引擎，诞生于 2013 年初，基于 Go 语言 并遵从 Apache2.0 协议开源

刚开始学 Docker 你可以把它理解成我们以前学过的虚拟机，但是 Docke 和传统虚拟化方式 的不同之处。传统虚拟机技术是虚拟出一套硬件后，在其上运行一个完整操作系统，在该系 统上再运行所需应用进程；Docker 相比传统的虚拟化技术要更轻量级，Docker 容器内的应 用程序是直接运行在宿主内核中的，容器内没有自己的内核，也没有进行硬件虚拟

![](https://s.poetries.work/uploads/2022/06/d475d80c46a6b836.png)
![](https://s.poetries.work/uploads/2022/06/5f8aa431399633c4.png)

> 因此 Docker 容器要比传统虚拟机占用资源更小、系统支持量更大、启动速度更快、更容易 维护和扩展。 目前 Docker 是全栈开发者必备的技能之一。 官网：https://hub.docker.com

#### 为什么要使用 Docker

- 开发人员利用 Docker 快速部署 调试我们的应用
- 开发人员利用 Docker 可以消除协作编码时“在我的机器上可正常工作，其他机器不能正 常工作”的问题。Docker 可以提供一致的运行环境，开发过程中一个常见的问题是环境一致 性问题。由于开发环境、测试环境、生产环境不一致，导致有些 bug 并未在开发过程中被 发现。
- 运维人员利用 Docker 可以在隔离容器中并行运行和管理应用
- Serverless 也是基于 docker 容器技术

#### mac docker安装

**本地docker环境搭建**

mac下安装docker: `brew install docker`，或者下载安装 https://docs.docker.com/docker-for-mac/install

> https://hub.docker.com 拉取镜像速度比较慢，我们推荐使用国内的镜像源访问速度较快 https://hub.daocloud.io

设置国内镜像源

![](https://s.poetries.work/uploads/2022/06/82cdc649caaa9a4d.png)

```json
{
  "registry-mirrors": [
    "https://register.docker-cn.com/"
  ],
}
```

进入该网站 `https://hub.daocloud.io` 获取镜像的下载地址

**docker命令基础**

- `docker images` 查看镜像
- `docker ps` 查看启动的容器 (`-a` 查看全部)
- `docker rmi 镜像ID` 删除镜像
- `docker rm 容器ID` 删除容器
- `docker exec -it 1a8eca716169(容器ID:docker ps获取) sh` 进入容器内部
- `docker inspect bf70019da487(容器ID)` 查看容器内的信息 

> 删除none的镜像，要先删除镜像中的容器。要删除镜像中的容器，必须先停止容器。

```bash
$ docker rmi $(docker images | grep "none" | awk '{print $3}')
```

```bash
$ docker stop $(docker ps -a | grep "Exited" | awk '{print $1 }') //停止容器

$ docker rm $(docker ps -a | grep "Exited" | awk '{print $1 }') //删除容器

$ docker rmi $(docker images | grep "none" | awk '{print $3}') //删除镜像
```

`docker info` 命令可以查看 Docker 容器的配置信息，包括镜像源、网络、磁盘、内存、系统等。

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

#### Linux 中安装 docker

**安装工具包**

```bash
yum install yum-utils device-mapper-persistent-data lvm2 -y
```

![](https://s.poetries.work/uploads/2022/06/e0f4f8f2621b11c0.png)

**设置阿里镜像源**

```bash
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

![](https://s.poetries.work/uploads/2022/06/0b017f9a76914c6e.png)

**安装docker**

```bash
yum install docker-ce docker-ce-cli containerd.io -y
```

**启动docker**

```bash
systemctl start docker

# 设为开机启动
systemctl enable docker
```

**设置docker镜像源**

```bash
vi /etc/docker/daemon.json
```

```json
{
  "registry-mirrors": [
    "https://register.docker-cn.com/"
  ],
}
```

后续拉取镜像直接从 https://hub.docker.com 网站拉取速度更快

**重启docker**

```bash
systemctl restart docker
```

#### 安装指定版本的 docker

- 要安装特定版本的 Docker Engine，请在 repo 中列出可用版本，然后选择并安装： 一种。
- 列出并排序您的存储库中可用的版本。此示例按版本号对结果进行排序，从高到低， 并被截断：

```
yum list docker-ce --showduplicates | sort -r
```

![](https://s.poetries.work/uploads/2022/06/717f82025ea75291.png)

```
sudo yum install docker-ce-<VERSION_STRING> docker-ce-cli-<VERSION_STRING> containerd.i o
```

#### 卸载 docker

- 卸载 Docker Engine、CLI 和 Containerd 包：`$ sudo yum remove docker-ce docker-ce-cli containerd.io`
- 主机上的映像、容器、卷或自定义配置文件不会自动删除。删除所有镜像、容器和卷
  - `$ sudo rm -rf /var/lib/docker`
  - `$ sudo rm -rf /var/lib/containerd`
  - 您必须手动删除任何已编辑的配置文件

#### 阿里云 Docker 镜像加速器

访问 https://www.aliyun.com/ 搜索 “容器镜像服务”

![](https://s.poetries.work/uploads/2022/06/dacef356b4101fd5.png)

您可以通过修改daemon配置文件`/etc/docker/daemon.json`来使用加速器

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

### docker镜像容器仓库

![](https://s.poetries.work/uploads/2022/06/311938585465b33b.png)
![](https://s.poetries.work/uploads/2022/06/4c1ecee2ce96588b.png)

#### 镜像

> Docker 镜像就是一个 Linux 的文件系统（Root FileSystem），这个文件系统里面包含可以运 行在 Linux 内核的程序以及相应的数据

- 镜像是分层（Layer）的：即一个镜像可以多个中间层组成，多个镜像可以共享同一中 间层，我们也可以通过在镜像添加多一层来生成一个新的镜像。
- 镜像是只读的（read-only）：镜像在构建完成之后，便不可以再修改，而上面我们所说 的添加一层构建新的镜像，这中间实际是通过创建一个临时的容器，在容器上增加或 删除文件，从而形成新的镜像，因为容器是可以动态改变的

![](https://s.poetries.work/uploads/2022/06/a524edcdba080105.png)

#### 容器

> 类似 linux 系统环境，运行和隔离应用。容器从镜像启动的时候，docker 会在镜像的最上一 层创建一个可写层，镜像本身是只读的，保持不变。容器与镜像的关系，就如同面向编程中 对象与类之间的关系。

- 因为容器是通过镜像来创建的，所以必须先有镜像才能创建容器，而生成的容器是一个独立 于宿主机的隔离进程，并且有属于容器自己的网络和命名空间
- 镜像由多个中间层（layer）组成，生成的镜像是只读的，但容器却是可读 可写的，这是因为容器是在镜像上面添一层读写层（writer/read layer）来实现的，如下图所 示：

![](https://s.poetries.work/uploads/2022/06/2681b9ce8eeab9d5.png)

#### 仓库

> 仓库（Repository）是集中存储镜像的地方，这里有个概念要区分一下，那就是仓库与仓库 服务器(Registry)是两回事，像我们上面说的 Docker Hub，就是 Docker 官方提供的一个仓库 服务器，不过其实有时候我们不太需要太过区分这两个概念。

**公共仓库**

- 公共仓库一般是指 Docker Hub，除了 获取镜像外，我们也可以将自己构建的镜像存放到 Docker Hub，这样，别人也可以使用我们 构建的镜像。
- 不过要将镜像上传到 Docker Hub，必须先在 Docker 的官方网站上注册一个账号

**私有仓库**

有时候自己部门内部有一些镜像要共享时，如果直接导出镜像拿给别人又比较麻烦，使用像 Docker Hub 这样的公共仓库又不是很方便，这时候我们可以自己搭建属于自己的私有仓库服 务，用于存储和分布我们的镜像。

#### Docker 镜像以及仓库

> Docker 镜像就是一个 Linux 的文件系统（Root FileSystem），这个文件系统里面包含可以运 行在 Linux 内核的程序以及相应的数据

镜像结构: `registryname/repositoryname/imagename:tagname` 例如：`docker.io/library/centos:8.3.2011`

- `docker search` 搜索镜像 `docker search centos`
- `docker pull` 下载镜像 `docker pull centos`
  - 下载指定的 tag `docker pull centos:8.3.2011`
- `docker images` 查看本地镜像
- `docker tag` 给镜像打标签
  - 给镜像打标签可以创建自己的镜像
  - 镜像结构: `registryname/repositoryname/imagename:tagname`
  - 例如：`docker.io/library/centos:8.3.2011`
- `docker rmi 镜像ID -f(强制删除)` 删除镜像
  - 这样删除只会删除对应的标签`docker images | grep centos`
- 把本地镜像推送到`dockerHub`仓库
  - 需要在 dockerHub 上面注册一个账户：`https://hub.docker.com/`
  - 使用`docker login`本地登录`dockerHub`
  - `docker login`
  - 查看保存的账户信息 `cat .docker/config.json`
- `docker push` 镜像名称 把本地镜像推送到远程

#### Docker 容器

> 类似 linux 系统环境，运行和隔离应用。容器从镜像启动的时候，docker 会在镜像的最上一 层创建一个可写层，镜像本身是只读的，保持不变。容器与镜像的关系，就如同面向编程中 对象与类之间的关系。

因为容器是通过镜像来创建的，所以必须先有镜像才能创建容器，而生成的容器是一个独立 于宿主机的隔离进程，并且有属于容器自己的网络和命名空间

- 查看所的容器
  - `docker ps`
  - `docker ps -a` 查看所有容器
- `docker run` 参数
  - `docker run` ：创建一个新的容器并运行一个命令
  - `docker run` 是日常用的最频繁用的命令之一，同样也是较为复杂的命令之一 命令格式：`docker run [OPTIONS] IMAGE [COMMAND] [ARG...]`
    - 参数
      - **OPTIONS :选项**
        - `-i`:表示启动一个可交互的容器，并持续打开标准输入
        - `-t`: 表示使用终端关联到容器的标准输入输出上
        - `-d`:表示容器放置后台运行
        - `--rm`:退出后即删除容器
        - `--name` :表示定义容器唯一名称
        - `-p` 映射端口
        - `-v` 指定路径挂载数据卷
        - `-e` 运行容器传递环境变量
      - `IMAGE` :表示要运行的镜像
      - `COMMAND` :表示启动容器时要运行的命令
  - `-it` 启动一个交互式容器
    - `docker run` 启动一个交互式容器在容器内执行`/bin/bash` 命令
    - `docker run -it nginx(镜像ID或名称) /bin/bash`
- 删除容器 `docker rm 容器ID -f`
- 停止容器 `docker stop 容器ID`
- 启动容器 `docker start 容器ID`
- 重启容器 `docker restart 容器ID`
- 进入容器内部
  - 进入容器内部 `docker exec -it 容器ID /bin/bash`
  - `docker exec`：进入容器开启一个新的终端（常用） 执行 `exit` 退出的时候不会停止容器
  - `docker attach`：进入容器正在执行的终端 `exit` 退出会停止容器 
- 查看容器日志 `docker logs 容器ID`
  - 语法`docker logs [OPTIONS] CONTAINER`
  - `-f` : 跟踪日志输出
  - `--since` :显示某个开始时间的所有日志 
  - `-t` : 显示时间戳 
  - `--tail` :仅列出最新 `N` 条容器日志
- `docker commit` 容器转换为镜像
  - 镜像是没有写入权限的，但是我们可以修改容器把容器制作为镜像 
  - 启动一个容器 给容器写入内容
  - `docker exec -it 容器ID /bin/bash` 进入容器内部，写入内容 `echo test > 1.txt`
  - `docker commit 容器ID 自定义镜像名称` 将容器转换为镜像

### docker应用

#### 安装node

进入`https://hub.daocloud.io` 搜索node，切换到版本获取下载地址

- `docker pull daocloud.io/library/node:12.18`
- `docker tag 28faf336034d node` 重命名镜像

重命名镜像后IMAGE ID都是一样的

![](https://s.poetries.work/uploads/2022/06/59d83f0139c878de.png)

也可以导出镜像到本地备份 `docker save -o node.image(导出镜像要起的名称) 28faf336034d(要导出的镜像的ID)`

![](https://s.poetries.work/uploads/2022/06/7b993abfdc8f07b6.png)

我们先删除之前的镜像 `docker rmi 28faf336034d -f` 强制删除

![](https://s.poetries.work/uploads/2022/06/df79f11b704aae4d.png)

再次导入本地镜像

`docker load -i node.image(导入的镜像名称)`

![](https://s.poetries.work/uploads/2022/06/566d2f2270c40840.png)

然后再次重命名镜像即可

`docker tag 28faf336034d node:v1.0(版本v1.0)`

![](https://s.poetries.work/uploads/2022/06/129f0a59b6d7c5d4.png)

#### 安装Nginx

![](https://s.poetries.work/uploads/2022/06/49bb3cc9f49c2dd1.png)

```
docker pull daocloud.io/library/nginx:1.13.0-alpine
```

![](https://s.poetries.work/uploads/2022/06/1f9aea9f1c9a18fc.png)

**启动Nginx镜像**

服务器上启动

```
docker run --name nginx(起一个容器名称) -d(后台运行) -p 80:80(本机:容器) -v(映射Nginx容器的运行目录本机) /root/nginx/log:/var/log/nginx(本机目录:容器目录) -v /root/nginx/conf/nginx.conf:/etc/nginx/nginx.conf(本机目录:容器内nginx配置所在目录) -v /root/nginx/conf.d:/etc/nginx/conf.d -v /root/nginx/html:/usr/share/nginx/html f00ab1b3ac6d(nginx镜像ID)
```

本地电脑启动

```
docker run --name nginx -d -p 8666:80 -v /Users/poetry/Downloads/docker/nginx/log:/var/log/nginx -v /Users/poetry/Downloads/docker/nginx/conf/nginx.conf:/etc/nginx/nginx.conf -v /Users/poetry/Downloads/docker/nginx/conf.d:/etc/nginx/conf.d -v /Users/poetry/Downloads/docker/nginx/html:/usr/share/nginx/html f00ab1b3ac6d
```

> 把docker容器中的Nginx服务配置映射本地方便管理

![](https://s.poetries.work/uploads/2022/06/691129b326f9fb23.png)

访问docker暴露的8666端口即可

![](https://s.poetries.work/uploads/2022/06/6d9b07b85c22e0b5.png)

当我们修改了html中的文件，无需重启容器即可看到效果

![](https://s.poetries.work/uploads/2022/06/d0ded5a28d96ce59.png)
![](https://s.poetries.work/uploads/2022/06/cb0109ef19b551e4.png)

#### 安装mysql

进入`https://hub.daocloud.io` 搜索mysql，切换到版本获取下载地址

![](https://s.poetries.work/uploads/2022/06/a6a34ed8d66f7cdc.png)

- `docker pull daocloud.io/library/mysql:8.0.20`

![](https://s.poetries.work/uploads/2022/06/f7e34f9ea2331ffb.png)

**启动MySQL镜像**

```
docker run -d(后台运行) -p 3307:3306(本机端口:MySQL运行端口) --name mysql(容器名称) -e MYSQL_ROOT_PASSWORD=123456(设置mysql密码) be0dbf01a0f3(mysql镜像ID)
```

**查看当前正在运行的镜像**

```
docker ps -a(正在运行和停止的镜像-a都可见)
```

![](https://s.poetries.work/uploads/2022/06/5ba00266271ef558.png)

**删除容器**

删除之前需要stop：`docker stop bac2692e2b9a(容器ID)`

```
docker rm bac2692e2b9a(容器ID：docker ps获取)
```

**进入容器内部**

```
docker exec -it bac2692e2b9a(容器ID) sh(指定进入方式)
```

![](https://s.poetries.work/uploads/2022/06/16c4541cf84b6e48.png)

我们使用Navicat新建一个连接测试一下

![](https://s.poetries.work/uploads/2022/06/65357b17bf38f12e.png)

说明我们使用docker安装MySQL的方式是没问题的

**查看MySQL容器日志**

```
docker logs -f(查看最后几条)  bac2692e2b9a(容器ID)
```
![](https://s.poetries.work/uploads/2022/06/639c44fb75dfe354.png)

**重启容器**

如果修改了容器配置，我们需要重新启动容器

```
docker restart bac2692e2b9a(容器ID)
```

**设置MySQL权限**

> mysql8.0后，需要设置，否则node连接不上

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

![](https://s.poetries.work/uploads/2022/06/2ce28bda82ab01d4.png)

**挂载配置文件目录**

> 默认数据库的数据是放在容器里面的，这样的话当容器删除会导致数据丢失。我们想的是删 除容器的时候不删除容器里面的 mysql 数据，这个时候启动容器的时候就可以把 mysql 数据 挂载到外部。


```
docker run -d(后台运行) -p 3307:3306(本机端口:MySQL运行端口) -v v /mysql/conf.d:/etc/mysql/conf.d -v /mysql/data:/var/lib/mysql  --name mysql(容器名称) -e MYSQL_ROOT_PASSWORD=123456(设置mysql密码) be0dbf01a0f3(mysql镜像ID)
```

> docker inspect bac2692e2b9a(容器ID) 

```
docker inspect bac2692e2b9a | grep mysql
```

#### 安装redis

![](https://s.poetries.work/uploads/2022/06/b38b5f228f3bcafe.png)

```
docker pull daocloud.io/library/redis:6.0.3-alpine3.11
```

**启动Redis镜像**

```
docker run -d -p 6380:6379 --name redis 29c713657d31(镜像ID) --requirepass 123456(redis登录密码)
```

![](https://s.poetries.work/uploads/2022/06/57a4ce88939753b0.png)

或进入redis镜像后在输入密码

![](https://s.poetries.work/uploads/2022/06/b6183fc0a23c353d.png)

**交互式进入redis容器**

```
docker exec -it 9751cbc96861(容器ID) sh
```

![](https://s.poetries.work/uploads/2022/06/ab4cf5d68cdd846b.png)

#### 安装MongoDB

```
docker pull mongo
```

![](https://s.poetries.work/uploads/2022/06/c40b78b7f3a083f7.png)

启动容器 映射端口 挂载目录

```
docker run --name mongoTest -p 27018:27017 -v ~/Downloads/docker/mongo:/data/db -d mongo(镜像ID或名称)
```

![](https://s.poetries.work/uploads/2022/06/ee188453d7a2fa5d.png)

可以看到通过 `-v`挂载到本地的数据

![](https://s.poetries.work/uploads/2022/06/c7bda56df3a23c53.png)

进入容器内部 `docker exec -it mongoTest(镜像ID或名称) sh`

![](https://s.poetries.work/uploads/2022/06/34f02c9235be1c72.png)

输入mongo，可以看到mongo已经安装成功了，我们从容器外连接容器的mongo

![](https://s.poetries.work/uploads/2022/06/5e31f8c9d31961df.png)

**连接需要密码**

```
docker run -d --name authMongo -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=123456 -p 27019:27017 -v ~/Downloads/docker/authMongo:/data/db mongo(镜像名称或者ID) --auth
```

进入容器内部

![](https://s.poetries.work/uploads/2022/06/7be573b2aa974fb0.png)

远程连接

![](https://s.poetries.work/uploads/2022/06/dcd42440f0686a39.png)

### Dockerfile

#### Dockerfile 构建一个 nginx 镜像

> Dockerfile 构建一个 nginx 镜像,构建好的镜像内会有一个 `/usr/share/nginx/html/index.html` 文件

新建一个名为 Dockerfile 文件，并在文件内添加以下内容

```bash
FROM nginx 
RUN echo '你好 docker' > /usr/share/nginx/html/index.html 
WORKDIR /usr/share/nginx/html
```

- 构建镜像 `docker build -t nginx:v1 .`
- 进入容器 `docker run -it -d -p 8900:80 容器ID`
- [root@localhost ~]# `curl 127.0.0.1` 你好 docker

#### Dockerfile 详解

- `Dockerfile` 文件的文件名建议使用 `Dockerfile` ，如果是其他文件构建的时候需要指定文件 名
- Dockerfile 构建镜像的执行顺序是从上往下
- 每一个指令都会创建一个新的镜像层，并提交

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

- `FROM` 指定哪种镜像作为新镜像的基础镜像，如：`FROM ubuntu:14.04`
- `MAINTAINER` 指明该镜像的作者和其电子邮件，如：`MAINTAINER "xxxxxxx@qq.com"`
- `LABEL` 给镜像添加信息。使用 `docker inspect` 可查看镜像的相关信息，如：
  - `LABEL maintainer="xx@qq.com"`
  - `LABEL version="1.0"`
  - `LABEL description="This is description"`
- `RUN` 在新镜像内部执行的命令
  - 比如安装一些软件、配置一些基础环境，可使用`\`来换行，如： `RUN apt-get update && apt-get install -y vim`
  - 也可以使用 `exec` 格式 `RUN ["executable", "param1", "param2"]`的命令，如
    - `RUN ["apt-get","install","-y","nginx"]`
    - `RUN ["yum","install","-y","nginx"]`
- `COPY`
  - 将主机的文件复制到镜像内，如果目的位置不存在，Docker 会自动创建所有需要的目录结 构，但是它只是单纯的复制，并不会去做文件提取和解压工作。如：
  - `COPY ./src/ /usr/share/nginx/html/`
- `ADD`
  - 将主机的文件复制到镜像内，如果目的位置不存在，Docker 会自动创建所有需要的目录结 构，并且会解压文件。如：
  - `ADD ./src.tar.gz /usr/share/nginx/html/`
- `WORKDIR`
  - 在构建镜像时，指定镜像的工作目录，之后的命令都是基于此工作目录，如果不存在，则会 创建目录
  - `WORKDIR /usr/share/nginx/html`
- `CMD`
  - 在构建镜像时，指定容器启动的命令，如果不存在，则会使用镜像的默认启动命令
  - `CMD ["/bin/bash"]`
- `ENTRYPOINT`
  - 在构建镜像时，指定容器启动的命令，如果不存在，则会使用镜像的默认启动命令
  - `ENTRYPOINT ["/bin/bash"]`
  - `CMD` 和 `ENTRYPOINT` 同样作为容器启动时执行的命令，区别有以下几点
    - `CMD` 的命令会被 `docker run` 的命令覆盖而 `ENTRYPOINT` 不会
    - 如使用 `CMD ["/bin/bash"]`或 `ENTRYPOINT ["/bin/bash"]`后，再使用 `docker run -it image` 启动容 器，它会自动进入容器内部的交互终端，如同使用 `docker run -it image /bin/bash`
    - 但是如果启动镜像的命令为 `docker run -it image /bin/ps`，使用 `CMD` 后面的命令就会被覆盖 转而执行 `bin/ps` 命令，而 `ENTRYPOINT` 的则不会，而是会把 `docker run` 后面的命令当做 `ENTRYPOINT` 执行命令的参数
- `EXPOSE 暴露端口`
  - 在构建镜像时，指定暴露的端口，如果不存在，则会使用镜像的默认端口
  - `EXPOSE 8080`
  - 仅仅是声明了一个暴露的端口
  - 帮助镜像使用者理解这个镜像服务的守护端口，以方便配置映射端口
  - 在运行时使用随机端口映射时，也就是 `docker run -P` 时，会自动随机映射 `EXPOSE` 的端口。
- `VOLUME`
  - 在构建镜像时，指定挂载的卷，如果不存在，则会使用镜像的默认卷
  - `VOLUME /usr/share/nginx/html`
  - 帮助镜像使用者理解这个镜像服务的守护卷，以方便配置映射卷
  - 在运行时使用随机卷映射时，也就是 `docker run -v` 时，会自动随机映射 `VOLUME` 的卷。
  - 我们通过 `docker inspect` 查看通过该 `dockerfile` 创建的镜像生成的容器
- `ENV`
  - 在构建镜像时，指定环境变量，如果不存在，则会使用镜像的默认环境变量
  - `ENV PATH=/usr/bin`
  - 帮助镜像使用者理解这个镜像服务的守护环境变量，以方便配置映射环境变量
  - 在运行时使用随机环境变量映射时，也就是 `docker run -e` 时，会自动随机映射 `ENV` 的环境变量。

#### Dockerfile 构建 Centos 并安装 net-tools yum 软件

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

编译 编译的时候注意最后面的`.`

`docker build -f Dockerfile_centos -t centos:v1.0 .`

查看执行的历史 `docker history 镜像名称或者id`


#### Dockerfile 自动部署 Nodejs 程序

项目目录中新建 `Dockerfile` `COPY . /root/wwwroot/`表示把项目目录中的代码复制到容器里面的`/root/wwwroot` 目录

```bash
FROM node 

COPY . /root/wwwroot/ 

WORKDIR /root/wwwroot/ 

EXPOSE 3000 

RUN npm install cnpm -g --registry=https://registry.nlark.com 

RUN cnpm install 

CMD node app.js
```

构建 `docker build -t nodeimg:v1.0.1 .`

运行镜像并且进入容器 `docker run -tid --name nodeDemo -p 3000:3000 nodeimg:v1.0.1`

### 配置docker网络
