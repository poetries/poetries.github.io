---
title: ubuntu下无法安装Hexo简单做法
date: 2016-07-07 02:25:41
tags: 
    - Ubuntu
    - Linux
categories: Back-end
---

- 安装 `Git sudo apt-get install git-core`
- 安装 Node.js(安装 Node.js 的最佳方式是使用 `nvm`)
`wget -qO- https://raw.github.com/creationix/nvm/master/install.sh | sh`
<!--more-->
- 安装完成后，重启终端并执行下列命令即可安装 Node.js
 - `nvm install 4`

- 安装 Hexo

    - 所有必备的应用程序安装完成后，即可使用 npm 安装 Hexo
    
    -  错误的写法：`npm install -g hexo-cli`
    - 正确的写法：`sudo npm install -g hexo-cli`

    -  `ubuntu`下一定加上`sudo`否则安装`Hexo`将不会成功
