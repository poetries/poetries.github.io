---
title: Nodejs之环境&调试（二）
date: 2017-10-15 16:30:15
tags: 
   - JavaScript
   - Node
categories: Back-end
---

一、环境
---

**commonJS**

- `nodejs`模块管理规范
  - 每一个文件是一个模块，有自己的作用域
  - 在模块内部`module`变量代表模块本身
  - `module.exports`属性代表模块对外接口

**exports与module.exports**

- `exports = module.exports` `exports`是`module.exports`的快捷方式，不能修改`exports`的指向

```javascript
// 这种方式修改了exports的指向，这样是不行的
exports = {
    a:"",
    b:""
}
```

```javascript
// 这样没问题
module.exports = {
    a:"",
    b:""
}
```

**global**

> 全局访问的属性和方法挂载到global对象中

- `global`下的全局属性方法
  - `commonJS`
  - `Buffer`、`process`、`console`
  - `timer` (`setInterval`、`setTimeout`、`setImmediate`)


**process**

- **process.argv**
  - 参数相关的东西 `argv`
  - `argv0`是`argv`的第一个参数
  - `execArgv`是调用`node`所传入的一些参数 如`node --inspect test.js`
  - `exevPath`调用脚本的路径 `C:\Program Files\nodejs\node.exe`
  - `>node test3.js a=1 a=2 a=3 a=4`执行的时候，传入一些外部的命令

```javascript
const {argv, argv0, execArgv, exevPath} = process;

argv.forEach(item => {
    console.log(item);
    //C:\Program Files\nodejs\node.exe
    //C:\Users\Administrator\Desktop\learn_node\test3.js
})
```

- **process.env**
 
```javascript
 const {env} = process;

```

- **process.cwd**
  - 打印当前路径
  
```javascript
C:\Users\Administrator\Desktop\learn_node
```

- **process.nextTick与setImmediate**
  - 执行速度： `nextTick` > `setTimeout` > `setImmediate`
  - `nextTick`在异步之前执行
  
```javascript
// nextTick比setImmediate执行得早
process.nextTick(()=>{
   // 当前事件队列执行完之后再执行
   console.log("nextTick") 
})

setTimeout(()=>{
    console.log("setTimeout")
})

// 在大部分情况下使用setImmediate就行
setImmediate(()=>{
    console.log("setImmediate")
})
//nextTick
//setImmediate
```

二、调试
---

- 官方调试方法 https://nodejs.org/en/docs/inspector/

**方法一：使用inspect**

- Option 1: Open `chrome://inspect` in a Chromium-based browser. Click the Configure button and ensure your target host and port are listed. Then select your Node.js app from the list
- Option 2: `Install the Chrome `Extension NIM (Node Inspector Manager): https://chrome.google.com/webstore/detail/nim-node-inspector-manage/gnhhdgbaldcilmgcpfddgdbkhjohddkj


**方法二：使用VS code**
