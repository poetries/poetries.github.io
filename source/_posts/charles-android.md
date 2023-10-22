---
title: Charles+模拟器抓安卓7以上https接口过程总结
date: 2023-09-24 10:09:43
tags: 
 - 调试
 - Charles
categories: Tools
---

## 创建安卓模拟器，选择Google APIs的包

![](https://s.poetries.work/uploads/2023/09/167b68ff97543b8f.png)

> 这里我们使用安卓`9.0 Google APIs`的模拟器（装最新版本也可以），记得要装`Google APIs`的，否则执行`adb root`获取`root`权限会报错`adbd cannot run as root in production builds`

## 模拟器我们通过命令行来启动


### 列出当前模拟器

```bash
emulator -list-avds 
```

![](https://s.poetries.work/uploads/2023/09/8a76711c15bfcf3e.png)


### 启动模拟器 Pixel_XL_API_28

```bash
# 需要以这样的方式启动安卓模拟器才可转到包
emulator -avd Pixel_XL_API_28 -writable-system 
```

## 获取Root权限

```bash
adb root
adb remount
```

命令执行完之后，模拟器会重新启动。如果启动成功，那么手机的`root`权限已开启

## 配置抓包工具证书

![](https://s.poetries.work/uploads/2023/09/8068bd69e487f012.png)


### 根据证书计算hash值

```bash
openssl x509 -subject_hash_old -in charles-ssl-proxying-certificate.pem
```

![](https://s.poetries.work/uploads/2023/09/051c22061247f384.png)

### 安装证书到系统目录

```bash
adb push charles-ssl-proxying-certificate.pem /system/etc/security/cacerts/xxx.0
```

- 这里的`xxx.0`是上面的`hash值` 例如`dfaf1.0`
- 安装完成后，进入`adb shell`，执行`reboot`重启模拟器，**切记**：`一定要重启模拟器证书才会生效`

![](https://s.poetries.work/uploads/2023/09/38cdb96a1af15879.png)

看到`charles`证书安装到系统目录才算成功

### 配置模拟器代理即可

![](https://s.poetries.work/uploads/2023/09/4ccabc1ea3295b2d.png)

### 抓包

![](https://s.poetries.work/uploads/2023/09/ba150e9d39dcef21.png)