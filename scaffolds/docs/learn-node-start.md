---
title: Nodejs之简单入门（一）
date: 2017-10-15 11:40:43
tags: 
   - JavaScript
   - Node
categories: Back-end
---

一、前言
---


> nodejs是事件驱动、非阻塞I/O模型

- 阻塞：i/o时进程休眠等待完成后进行下一步
- 非阻塞：i/o时函数立即返回，进程不等待i/o返回

> i/o完成后通知主程序，如何告诉呢？通过事件驱动

**事件驱动**

- i/o等异步操作结束后通知
- 内部实现是观察者模式

  
**CPU密集和I/O密集**

- `CPU`密集：压缩、解压、加密、解密
- `I/O`密集：文件操作、网络操作、数据库

**web常见场景(web是一个I/O密集)**

- 静态资源读取
- 数据库操作
- 渲染页面

**高并发应用之道**

- 增加机器数
- 增加每台机器CPU数-多核

![](https://poetries1.gitee.io/img-repo/2019/10/347.png)

**进程、线程**

- 进程：一个运行的程序（进程包括线程，如何水分子里面还有分子原子）
- 线程：进程内一个独立的，可调度的执行单元
- 多线程：启动一个进程，在一个进程内启动多个线程，这样多个线程可以执行多个任务

**Nodejs的单线程**

- 单线程只是针对主进程，I/O操作系统底层多线程调度
- 单线程并不是单进程

**Nodejs原理**

- Node是单线程的，只开一个进程，一个进程也只开一个线程。一个CPU上只开一个进程，一个进程里面只有一个线程

**nodejs高性能的前提**

- 高并发
- `I/O`密集


**常用场景**

- `web Server`
- 本地代码构建 (`webpack/grunt/gulp`)
- 使用工具的开发

二、nodejs与JavaScrip异同
---

- `ECMAScript`
- 语法
- 内置对象、方法

**顶层对象**

- `JavaScript`：`window`
- `nodejs`: `global`

- 在ECMA部分node和JavaScript是一样的，比如数据类型的定义，语法结构、内置对象

三、模块 
---

- 在`node`中文件和模块是一一对应的，也就是一个文件一个模块。__file是每个模块下必有的一个属性，输出文件的绝对路径。`__dirname` 是文件夹名称绝对路径
- 每个模块都有自己的作用域
- 我们通过var声明的变量并非全局，而是该模块作用域下的

**模块加载机制**

- `require`加载模块
- 1、首先按照加载模块的文件名称进行查找
- 2、如果没有找到就会在文件模块文件名称后加载`.js`进行查找
- 3、如果还没有找到，就在文件名称后加载`.json`后缀，进行查找
- 4、如果还没找到，就会在文件名称后加上`.node`进行查找
- 查找流程：**文件名称->.js -> .json->.node**

**exports、module**

- 保存当前模块有关的一些信息
- `module.exports` 一般使用这个,把一个模块中的变量对外提供访问
- 在模块作用域，还有一个内置的模块对象，`exports`其实就是`module.exports`,他们两个都是指向同一个对象

四、node目录的配置
---

- 配置文件 : `package.json`
  - dependencies :  当前项目所使用到的依赖模块
  - 安装方式: `npm install ` 自动读取`package.json`自动安装
- `router`目录 用来存放路由文件
- `views`目录  用来存放`html`模板文件
- `module `目录  自己写的一些模块

五、第一个node服务器
---

```javascript
//   安装好node就有的一个模块
//  用来创建http服务器的
const http = require(`http`);

http.createServer((request,response) => {
    //request 请求对象     浏览器 请求 服务器所有的内容保存在这个对象里
    //response 响应对象     服务器响应浏览器 所有的方法
    response.writeHead(200 , { 'Content-Type':'text/html' } );
    //  .end() 结束响应 同时发送一个 Hello Word
    response.end('Hello Word')
}).listen(233);
//.listen(); 监听端口 233  自定义的端口号
// 如果开启了node服务器  修改完之后的代码必须 重启才能生效
```


