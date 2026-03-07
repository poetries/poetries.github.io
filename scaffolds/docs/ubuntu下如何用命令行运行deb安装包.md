---
title: ubuntu下如何用命令行运行deb安装包
date: 2016-07-07 02:55:20
tags: 
    - Ubuntu
    - Linux
categories: Back-end
---

如果`ubuntu`要安装新软件，已有`deb`安装包（例如：`iptux.deb`），但是无法登录到桌面环境。那该怎么安装？答案是：使用`dpkg`命令。
<!--more-->
`dpkg`命令常用格式如下：

- `sudo dpkg -I iptux.deb` 查看iptux.deb软件包的详细信息，包括软件名称、版本以及大小等（其中-I等价于--info）

- `sudo dpkg -c iptux.deb` 查看iptux.deb软件包中包含的文件结构（其中-c等价于--`contents`）
- `sudo dpkg -i iptux.deb` 安装iptux.deb软件包（其中-i等价于--install）

- `sudo dpkg -l iptux` 查看iptux软件包的信息（软件名称可通过dpkg -I命令查看，其中-l等价于--list）

- `sudo dpkg -L iptux` 查看iptux软件包安装的所有文件（软件名称可通过dpkg -I命令查看，其中-L等价于--listfiles）

- `sudo dpkg -s iptux` 查看iptux软件包的详细信息（软件名称可通过dpkg -I命令查看，其中-s等价于--status）

- `sudo dpkg -r iptux` 卸载iptux软件包（软件名称可通过dpkg -I命令查看，其中-r等价于--remove）

**注：** `dpkg`命令无法自动解决依赖关系。如果安装的deb包存在依赖包，则应避免使用此命令，或者按照依赖关系顺序安装依赖包。
