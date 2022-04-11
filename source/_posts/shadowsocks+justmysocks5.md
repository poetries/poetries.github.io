
---
title: 教你使用shadowsocks+justmysocks5搭建一个高效稳定的翻墙服务
date: 2022-01-04 13:50:32
tags: VPN
categories: Tools
---


# 一、名词简介

## VPN

> VPN英文全称：`Virtual Private Network`（虚拟专用网络）。`VPN`被定义为通过一个公用互联网络建立一个临时的、安全的连接，是一条穿过混乱的公用网络的安全、稳定隧道，使用这条隧道可以对数据进行几倍加密达到安全使用互联网的目的

> 具体的实现方式包括`PPTP`,`L2TP`,`IPsec`和`openvpn`。`vpn`是一种加密通讯技术，目的是保证数据传输完全和网络匿名。

## Proxy（代理）

- 反向代理：反向代理的主要作用为服务器做缓存和负载均衡。反向代理的负载均衡是指在多个真正的服务器之前架设一个代理服务器，用户所有的数据都发给代理服务器，代理服务器根据每一个真实服务器的状态将数据转发给一个流量比较少的服务器处理，用户也只需要记住一个域名或IP就可以了。
- 正向代理：正向代理主要有`HTTP`、`HTTP over TLS(HTTPS)`、`Socks`、`Socks over TLS`几种。

## VPS

- VPS就是`Virtual Private Server`，又叫虚似专用服务器。它就相当于是一种技术，可以将一部服务器分割成多个虚似专享服务器。这种技术可以为大家提供优质服务，每一个VPS都可以分派独立公网IP地址、独立操作系统、独立超大空间、独立运行内存、独立CPU资源、独立执行程序和独立系统配置等，可以从根本上防止关联
- VPS（虚拟专用服务器）是由VPS提供商维护，不是一台独立的电脑，而是将一台巨型服务器通过虚拟化技术分割成若干个看似独立的服务器。（ISP运营商面向普通网民提供的是动态ip，绑定域名很不方便，再加上宽带上网上下行网速不对等、网络稳定性不高等问题，大部分人还是选择使用vps建站）。
- `vps可以用来搭建网站`，同时也可以成为VPN服务器，代理服务器。

## shadowsocks

`shadowsocks`同样是一种代理协议。相对于VPN有极强的隐匿性，相对于HTTP代理有较为完善的加密方案，相较于HTTPS配置简单。

# 二、如何使用Shadowsocks代理

> `Shadowsocks`作为一个翻墙利器自然不仅仅局限于Windows电脑端，还可以用于`iOS`, `Android`以`Mac`上

## 各平台客户端下载地址

- Android客户端(https://github.com/shadowsocks/shadowsocks-android/releases) 
- iOS客户端(搜索`wingy`)
- Windows客户端(https://github.com/shadowsocks/shadowsocks-windows/releases)   
- MAC客户端(https://github.com/shadowsocks/ShadowsocksX-NG/releases)

**配置描述:**

![](https://blog.poetries.top/img/static/images/20220104123619.png)

- `自动代理模式`：表示连接国内不通过vpn，可加快访问速度
- `全局模式`：所有连接都通过vpn
- `服务器`：vpn的服务器配置
  - 打开服务器设置
  - 加密方式为: `aes-256-cfb`，地址和密码
- 选择服务器，打开小飞机。即可翻墙了。

## 搭建服务端代理

服务端一键安装脚本

```bash
wget --no-check-certificate -O shadowsocks-go.sh https://raw.githubusercontent.com/poetries/shadowsocks_install/master/shadowsocks-go.sh

chmod +x shadowsocks-go.sh
./shadowsocks-go.sh 2>&1 | tee shadowsocks-go.log
```

安装完成后，脚本提示如下：

```
Congratulations, Shadowsocks-go install completed!
Your Server IP:your_server_ip
Your Server Port:your_server_port
Your Password:your_password
Your Local Port:1080
Your Encryption Method:aes-256-cfb

Welcome to visit:https://teddysun.com/392.html
Enjoy it!
```

卸载方法

```
./shadowsocks-go.sh uninstall
```

> 可以查看 `Shadowsocks-go` 进程是否已经启动。 本脚本安装完成后，已将 `shadowsocks-go` 加入开机自启动。

使用命令：

- 启动：`/etc/init.d/shadowsocks start`
- 停止：`/etc/init.d/shadowsocks stop`
- 重启：`/etc/init.d/shadowsocks restart`
- 状态：`/etc/init.d/shadowsocks status`


多用户多端口配置文件示例： 配置文件路径：`/etc/shadowsocks/config.json`

```
{
    "port_password":{
         "8989":"password0",
         "9001":"password1",
    },
    "method":"aes-256-cfb",
    "timeout":600
}
```

## 使用第三方服务

> 自己搭建的会有被封ip的风险。推荐使用`justmysocks5`(https://justmysocks5.net/members/cart.php)去代理，这些一个月一个月续费就好，不要一次性买几个月。因为不知道是不是用一段时间就费封了。不推荐使用蓝灯，蓝灯不稳定，容易被封杀。现在国内的防火墙封杀蓝灯一抓一个准，只要是国内有两会、或者其他敏感政治事件。基本上都会被封杀。

![](https://blog.poetries.top/img/static/images/20220104130036.png)
![](https://blog.poetries.top/img/static/images/20220104130233.png)

购买后填入地址、端口、密码即可

![](https://blog.poetries.top/img/static/images/20220104124637.png)
![](https://blog.poetries.top/img/static/images/20220104124612.png)

> 我是程序员小月，专注分享前端领域编程经验和技术干货，更多干货在公 号：前端进阶之旅
