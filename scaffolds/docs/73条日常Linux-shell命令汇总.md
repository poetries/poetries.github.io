---
title: 73条日常Linux shell命令汇总
date: 2016-04-17 09:32:41
tags: Linux
categories: Back-end
---


####  检查远程端口是否对bash开放：

<!--more-->
	echo >/dev/tcp/8.8.8.8/53 && echo "open"

####  让进程转入后台：

    Ctrl + z

####  将进程转到前台：

    fg

####  产生随机的十六进制数，其中n是字符数：

    openssl rand -hex n

####  在当前shell里执行一个文件里的命令：

    source /home/user/file.name

####  截取前5个字符：

    ${variable:0:5}

####  SSH debug 模式:

    ssh -vvv user@ip_address

####  SSH with pem key:

    ssh user@ip_address -i key.pem

####  用wget抓取完整的网站目录结构，存放到本地目录中：

    wget -r --no-parent --reject "index.html*" http://hostname/ -P /home/user/dirs

####  一次创建多个目录：

    mkdir -p /home/user/{test,test1,test2}

####  列出包括子进程的进程树：

    ps axwef

####  创建 war 文件:

    jar -cvf name.war file

####  测试硬盘写入速度：

    dd if=/dev/zero of=/tmp/output.img bs=8k count=256k; rm -rf /tmp/output.img

####  测试硬盘读取速度：

    hdparm -Tt /dev/sda

####  获取文本的md5 hash：

    echo -n "text" | md5sum

####  检查xml格式：

    xmllint --noout file.xml

####  将tar.gz提取到新目录里：

    tar zxvf package.tar.gz -C new_dir

####  使用curl获取HTTP头信息：

    curl -I http://www.example.com

####  修改文件或目录的时间戳(YYMMDDhhmm):

    touch -t 0712250000 file

####  用wget命令执行ftp下载：

    wget -m ftp://username:password@hostname

####  生成随机密码(例子里是16个字符长):

    LANG=c < /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c${1:-16};echo;

####  快速备份一个文件：

    cp some_file_name{,.bkp}

####  访问Windows共享目录：

    smbclient -U "DOMAIN\user" //dc.domain.com/share/test/dir

####  执行历史记录里的命令(这里是第100行):

    !100

####  解压:

    unzip package_name.zip -d dir_name

####  输入多行文字(CTRL + d 退出):

    cat > test.txt

####  创建空文件或清空一个现有文件：

    \> test.txt

####  与Ubuntu NTP server同步时间：

    ntpdate ntp.ubuntu.com

####  用netstat显示所有tcp4监听端口：

    netstat -lnt4 | awk '{print $4}' | cut -f2 -d: | grep -o '[0-9]*'

####  qcow2镜像文件转换：

    qemu-img convert -f qcow2 -O raw precise-server-cloudimg-amd64-disk1.img \precise-server-cloudimg-amd64-disk1.raw

####  重复运行文件，显示其输出（缺省是2秒一次）：

    watch ps -ef

####  所有用户列表：

    getent passwd

####  Mount root in read/write mode:

    mount -o remount,rw /

####  挂载一个目录（这是不能使用链接的情况）:

    mount --bind /source /destination

####  动态更新DNS server:

    nsupdate < <EOF
    update add $HOST 86400 A $IP
    send
    EOF

####  递归grep所有目录：

    grep -r "some_text" /path/to/dir

####  列出前10个最大的文件：

    lsof / | awk '{ if($7 > 1048576) print $7/1048576 "MB "$9 }' | sort -n -u | tail

####  显示剩余内存(MB):

    free -m | grep cache | awk '/[0-9]/{ print $4" MB" }'

####  打开Vim并跳到文件末：

    vim + some_file_name

####  Git 克隆指定分支(master):

    git clone git@github.com:name/app.git -b master

####  Git 切换到其它分支(develop):

    git checkout develop

####  Git 删除分支(myfeature):

    git branch -d myfeature

####  Git 删除远程分支

    git push origin :branchName

####  Git 将新分支推送到远程服务器：

    git push -u origin mynewfeature

####  打印历史记录中最后一次cat命令：

    !cat:p

####  运行历史记录里最后一次cat命令：

    !cat

####  找出/home/user下所有空子目录:

    find /home/user -maxdepth 1 -type d -empty

####  获取test.txt文件中第50-60行内容：

    < test.txt sed -n '50,60p'

####  运行最后一个命令(如果最后一个命令是mkdir /root/test, 下面将会运行: `sudo mkdir /root/test)：`

    sudo !!

####  创建临时RAM文件系统 – ramdisk (先创建/tmpram目录):

    mount -t tmpfs tmpfs /tmpram -o size=512m

####  Grep whole words:

    grep -w "name" test.txt

####  在需要提升权限的情况下往一个文件里追加文本：

    echo "some text" | sudo tee -a /path/file

####  列出所有kill signal参数:

    kill -l

####  在bash历史记录里禁止记录最后一次会话：

    kill -9 $$

####  扫描网络寻找开放的端口：

    nmap -p 8081 172.20.0.0/16

####  设置git email:

    git config --global user.email "me@example.com"

####  To sync with master if you have unpublished commits:

    git pull --rebase origin master

####  将所有文件名中含有”txt”的文件移入/home/user目录:

    find -iname "*txt*" -exec mv -v {} /home/user \;

####  将文件按行并列显示：

    paste test.txt test1.txt

####  shell里的进度条:

    pv data.log

####  使用netcat将数据发送到Graphite server:

    echo "hosts.sampleHost 10 `date +%s`" | nc 192.168.200.2 3000

####  将tabs转换成空格：

    expand test.txt > test1.txt

####  Skip bash history:

    < space >cmd

####  去之前的工作目录：

    cd -

####  拆分大体积的tar.gz文件(每个100MB)，然后合并回去：

    split –b 100m /path/to/large/archive /path/to/output/files
    cat files* > archive

####  使用curl获取HTTP status code:

    curl -sL -w "%{http_code}\\n" www.example.com -o /dev/null

####  设置root密码，强化MySQL安全安装:

    /usr/bin/mysql_secure_installation

####  当Ctrl + c不好使时:

    Ctrl + \

####  获取文件owner:

    stat -c %U file.txt

####  block设备列表：

    lsblk -f

####  找出文件名结尾有空格的文件：

    find . -type f -exec egrep -l " +$" {} \;

####  找出文件名有tab缩进符的文件

    find . -type f -exec egrep -l $'\t' {} \;

####  用”=”打印出横线:全选复制放进笔记

    printf '%100s\n' | tr ' ' =


