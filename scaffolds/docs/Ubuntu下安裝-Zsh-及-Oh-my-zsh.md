---
title: Ubuntu下安裝 Zsh 及 Oh-my-zsh
date: 2016-06-26 15:35:19
tags: 
   - Linux
   - Ubuntu
categories: Back-end
---



不管是在服务器还是本机上打开终端，默认都会运行名叫 Bash 的 shell，它是目前最为流行的 shell，几乎每个基于UNIX的系统都支持。但是也存在其他的 Bash 替代方案，能帮助开发者更方便快捷地使用终端。

其中之一就是Z shell，也被称为Zsh。Oh-My-Zsh的安装非常简单，只需在命令行输入以下命令并重启即可     
 <!--more-->  
### 一、在 Ubuntu Linux 中安裝 Zsh 及 Oh-my-zsh

- 安裝 zsh 套件

`$ apt-get install zsh `

- 安装git
 
 `$ apt-get install git`
 
- 安装完以上两步，执行下面的代码

`curl -L https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh | sh`

- 把zsh设置成默认-替换bash
 `chsh -s /bin/zsh `

---



### 二、接下来配置适合自己Zsh

- 主题修改，我比较喜欢前面是$符号，所以选择了steeef这款主题
       $ vim ~/.zshrc
       配置文件里找到：（输入`/`即可搜素ZSH_THEME）
       `ZSH_THEME="robbyrussell"`
      修改为：
     ` ZSH_THEME="steeef"`

- 常用命令

    - 查看zsh下有哪些主题
    `$ ls ~/.oh-my-zsh/themes`
    
    - 查看zsh下有哪些插件
    `ls ~/.oh-my-zsh/plugins  `
    
    - 编辑 ~/.zshrc 启用 插件
    ```plugins=(git git-flow debian grails rvm history-substring-search github gradle svn node npm zsh-syntax-highlighting sublime)  ```
    
    -  下載 zsh-syntax-highlighting plugin
    `$ cd ~/.oh-my-zsh/custom/plugins  `
    `$ git clone https://github.com/zsh-users/zsh-syntax-highlighting.git `
    
    - 新增自定 zsh 设定，把 alias 和 PATH 的设定放在这里
   ``` 
    $ cat ~/.oh-my-zsh/custom/xxx.zsh  
       alias df='df -h'  
       alias h='htop'  
       PATH=$PATH:/opt/app/bin/  
  ```
  
---
    
    
- [这里是官方提供的各种主题][1]

- 配置的效果图

![](https://cloud.githubusercontent.com/assets/2618447/6316862/70f58fb6-ba03-11e4-82c9-c083bf9a6574.png)


  [1]: https://github.com/robbyrussell/oh-my-zsh/wiki/External-themes
