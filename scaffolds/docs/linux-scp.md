---
title: Linux之scp传输文件
date: 2018-12-03 18:32:41
tags: 
  - Linux
  - SCP
categories: Back-end
---


## 一、基础使用

> 利用scp传输文件

### 1.1 从服务器下载文件

在本地电脑上执行
 
```bash
scp username@servername:/path/filename /tmp/local_destination
```

- 例如`scp root@192.168.0.101:/home/poetry/test.txt `
- 把`192.168.0.101`上的`/home/kimi/test.txt`的文件下载到 `~/Downloads/`本地

**递归拷贝**

> `-r`拷贝目录 `-P`服务器端口

```bash
scp  -P 36000 -r user_00@192.168.1.201:/usr/local/services/nginx/conf ~/Downloads/
```

### 1.2 传目录到服务器

在本地电脑上执行

```bash
scp -r /tmp/local_dir username@servername:remote_dir
```

```bash
# 注意：如`deployBuildFiles`下的 `.next`默认不上传到服务器
scp -P36000  -r deployBuildFiles/** user_00@192.168.1.201:/home/data/services/goods-prev.yesdat.com/
```


## 二、进阶

> 12个scp传输文件的命令案例 https://www.cnblogs.com/voidy/p/4215891.html

 
