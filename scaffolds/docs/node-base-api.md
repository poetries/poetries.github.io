---
title: Nodejs之基础API（三）
date: 2017-10-15 20:50:35
tags: 
   - JavaScript
   - Node
categories: Back-end
---

Path
---

> 提供了一些工具函数，用于处理文件与目录的路径

**basename、dirname与extname**

- 返回一个 `path `的最后一部分
- 返回一个 `path` 的目录名
- 返回 `path` 的扩展名
  
```javascript
const {basename,dirname,extname} = require("path");

const filePath = "/usr/local/bin/test.txt";

console.log(basename(filePath)); // test.txt
console.log(dirname(filePath)); // /usr/local/bin
console.log(extname(filePath)); // .txt

```


**join、normalize与resolve**

- `path.join() `方法使用平台特定的分隔符把全部给定的 `path` 片段连接到一起，并规范化生成的路径
- `path.normalize()` 方法会规范化给定的 `path`，并解析 `'..' `和 `'.' `片段
- `path.resolve()` 方法会把一个相对路径解析为一个绝对路径

```javascript
path.join('/foo', 'bar', 'baz/asdf', 'quux', '..');
// 返回: '/foo/bar/baz/asdf'

path.join('foo', {}, 'bar');
// 抛出 'TypeError: Path must be a string. Received {}'
```


**path.format与path.parse**

- `path.format() `方法会从一个对象返回一个路径字符串。 与 `path.parse()` 相反
- `path.parse() `方法返回一个对象，对象的属性表示 `path` 的元素


```javascript
const {parse,format} = require("path");

const filePath = "/usr/local/bin/test.txt";

const parse_ret = parse(filePath);
const format_ret = format(parse_ret)

console.log(parse_ret);
console.log(format_ret);
```
- 结果

```javascript
{ root: '/',
  dir: '/usr/local/bin',
  base: 'test.txt',
  ext: '.txt',
  name: 'test' }
/usr/local/bin\test.txt
```


**sep、delimiter、win32、posix**

> 和操作系统有关的东西

- `sep`：提供了平台特定的路径片段分隔符
  - `Windows` 上是` \`
  - `POSIX` 上是 `/`
- `path.win32`提供了 `path` 方法针对` Windows` 的实现
- `posix`   属性提供了 `path `方法针对 `POSIX` 的实现
- `delimiter` 就是 `":"`


```javascript
const {sep,delimiter,win32,posix} = require("path");

const filePath = "/usr/local/bin/test.txt";


console.log("sep ",sep);
console.log("posix sep ",posix.sep);
console.log("win32 sep ",win32.sep);
console.log("PATH",process.env.PATH);
console.log("delimiter ",delimiter);

```

```javascript
sep  \
posix sep  /
win32 sep  \
PATH C:\Python27\;C:\Python27\Scripts;C:\Windows\system32;C:\Windows;C:\Windows\
System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0\;C:\Program Files\Git\b
in;C:\Program Files\nodejs;;e:\Program Files\VS Code\bin;C:\Users\Administrator\
AppData\Roaming\npm;.;;.;;.;
delimiter  ;
```

**回顾小结**

```javascript
const path = require("path")

// 路径相关
console.log("__dirname", __dirname); //文件夹
console.log("__filename", __filename); //文件名
console.log("process.cwd()", process.cwd()); //绝对路径
console.log("./", path.resolve()); //根据相对路径取得绝对路径
```

- `__dirname`、`__filename` 总是返回文件的绝对路径
- `process.cwd()`总是返回`node`命令所在文件夹（就是用户在哪里启动的`node`脚本的路径）



Buffer
---
> - buffer用来处理二进制数据流的
> - 类似于整数数组，大小固定

> Buffer 类在 Node.js 中是一个全局变量，因此无需使用 require('buffer').Buffer


```javascript
// 创建一个长度为 10、且用 0 填充的 Buffer。
const buf1 = Buffer.alloc(10)

// 创建一个长度为 10、且用 0x1 填充的 Buffer。 
const buf2 = Buffer.alloc(10, 1);

// 创建一个包含 [0x1, 0x2, 0x3] 的 Buffer。
const buf4 = Buffer.from([1, 2, 3]);
```

**Buffer类常用的方法**

- `byteLength` 计算字符串占了几个字节
- `Buffer.isBuffer`判断是否是`buffer`对象
- `Buffer.concat`拼接`Buffer`

```javascript
// byteLength 计算字符串占了几个字节
console.log(Buffer.byteLength("test")) // 4 
console.log(Buffer.byteLength("测试"))  // 6字节

// Buffer.isBuffer判断是否是buffer对象
console.log(Buffer.isBuffer({}))
console.log(Buffer.isBuffer(Buffer.from([1,2,3])))

// Buffer.concat拼接Buffer

const buf1 = Buffer.from("This ")
const buf2 = Buffer.from("is ")
const buf3 = Buffer.from("a ")
const buf4 = Buffer.from("test ")
const buf5 = Buffer.from("buffer")

const buf = Buffer.concat([buf1,buf2,buf3,buf4,buf5]);

console.log(buf.toString());

/**
4
6
false
true
This is a test buffer
**/
```

**Buffer实例常用方法**

- `buf.length` 
- `buf.toString()`
- `buf.fill()` 填充一些值
- `buf.equals()` 两个`buffer`的内容是否相等
- `buf.indexOf()` 找到字符的位置
- `buf.copy()`


```javascript
const buf = Buffer.from("This is a test!");

console.log(buf.length); // 15

console.log(buf.toString("base64")); 

const buf1 = Buffer.allocUnsafe(10);

// buf1.fill填充一些值
//<Buffer a0 b4 25 00 00 00 00 00 01 00>
//<Buffer a0 b4 0a 0a 0a 0a 00 00 01 00>
console.log(buf1)
console.log(buf1.fill(10,2,6)) // 从第二个开始到第六个填充10

// buf.equals两个buffer的内容是否相等

const buf2 = Buffer.from("test")
const buf3 = Buffer.from("test")
const buf4 = Buffer.from("test!")

console.log(buf2.equals(buf3)) // true
console.log(buf2.equals(buf4)) // false


// buf.indexOf() 找到字符的位置

console.log(buf2.indexOf("es")); // 1
console.log(buf2.indexOf("esa")); // -1


// 解决中文乱码问题
const StringDecoder = require("string_decoder").StringDecoder;
const decoder = new StringDecoder("utf8");
const buf5 = Buffer.from("中文字符串");

 // 乱码
for (let i=0;i<buf5.length;i+=5) {
	const b = Buffer.allocUnsafe(5);
	buf5.copy(b,0,i);
	console.log(b.toString());
}

// 不在乱码
for (let i=0;i<buf5.length;i+=5) {
	const b = Buffer.allocUnsafe(5);
	buf5.copy(b,0,i);
	console.log(decoder.write(b));
}
```


event
---


> 大多数 Node.js 核心 API 都采用惯用的异步事件驱动架构，其中某些类型的对象（触发器）会周期性地触发命名事件来调用函数对象（监听器）

- `eventEmitter.on()` 方法用于注册监听器，`eventEmitter.emit()` 方法用于触发事件
- 这和在浏览器上不同，在浏览器上靠的是用户做的一些UI的操作触发，如`click\hover`

```javascript
const EventEmitter = require("events");

// 继承EventEmitter类
class CustomEvent extends EventEmitter {}

const ce = new CustomEvent();

// 绑定一个事件名 test，完成事件处理程序
ce.on("test",()=>{
	console.log("This is a test");
})

setInterval(()=>{
	// emit触发事件
	ce.emit("test");
},500)
```

```javascript
const EventEmitter = require("events");

// 继承EventEmitter类
class CustomEvent extends EventEmitter {}

const ce = new CustomEvent();

// 绑定事件处理程序
ce.on("error",(err,time) => {
	console.log(err);
	console.log(time);
})

// 给事件处理程序传递多个参数
ce.emit("error", new Error("出错了"),Date.now())

```

```javascript
const EventEmitter = require("events");

// 继承EventEmitter类
class CustomEvent extends EventEmitter {}

const ce = new CustomEvent();

// once只响应一次事件 如jQuery中的once()
ce.once("test",()=> {
	console.log("test event once");
})

setInterval(()=>{
	// emit触发事件
	ce.emit("test");
},500)

```

```javascript
const EventEmitter = require("events");

// 继承EventEmitter类
class CustomEvent extends EventEmitter {}

function fn1() {
	console.log("fn1")
}
function fn2() {
	console.log("fn2")
}

const ce = new CustomEvent();

ce.on("test",fn1);
ce.on("test",fn2);

setInterval(()=>{
	// emit触发事件
	ce.emit("test");
},500)

// removeListener移除事件
setTimeout(()=>{
	// ce.removeListener("test",fn2)
	ce.removeAllListeners("test"); //移除test绑定的事件
},1500)
```

fs
---

- 异步方法的最后一个参数都是一个回调函数。 
- 传给回调函数的参数取决于具体方法，但回调函数的第一个参数都会保留给异常。 如果操作成功完成，则第一个参数会是 `null` 或 `undefined`
- 当使用同步方法时，任何异常都会被立即抛出。 可以使用   `try/catch ` 来处理异常，或让异常向上冒泡

```javascript
// 读文件
const fs = require("fs");

// readFile 异步操作
// 规范：回调函数的第一个参数都会保留给异常
fs.readFile("./fs.js","utf8",(err,data)=>{
	if (err) throw err;
	console.log(data);
});

// readFile 同步操作（同步先执行）
const data = fs.readFileSync("./path.js","utf8");
console.log(data)
```


```javascript
// 写文件
const fs = require("fs");

fs.writeFile("./write.js","This is a  test",{encoding:"utf8"},err=>{
	if (err) throw err;

	console.log("done");
});

```

```javascript
const fs = require("fs");

//stat文件信息
fs.stat("./fs.js",(err,stats)=>{
	if (err) {
		console.log("文件不存在");
		return;
	};

	console.log(stats.isFile()) //true
	console.log(stats.isDirectory()) //false

	console.log(stats)
	/**
		Stats {
		  dev: -835755091,
		  mode: 33206,
		  nlink: 1,
		  uid: 0,
		  gid: 0,
		  rdev: 0,
		  blksize: undefined,
		  ino: 562949953557826,
		  size: 216,
		  blocks: undefined,
		  atime: 2017-10-15T12:24:01.933Z,
		  mtime: 2017-10-15T12:49:00.341Z,
		  ctime: 2017-10-15T12:49:00.341Z,
		  birthtime: 2017-10-15T12:24:01.871Z
	    }
  */
})

```

```javascript
// rename修改文件名
const fs = require("fs");

fs.rename("./write.js","test.js",err=>{
	if (err) throw err;

	console.log("done");
})


```

```javascript
// unlink删除文件
const fs = require("fs");

fs.unlink("./test.js",err=>{
	if (err) throw err;
	console.log("done");
})
```

```javascript
// 读文件夹相关操作
const fs = require("fs");

fs.readdir("./",(err,files)=>{
	if (err) throw err;
	console.log(files);
	/**
		[ '.vscode',
	  'buffer.js',
	  'events.js',
	  'fs.js',
	  'path.js',
	  'test1.js',
	  'test2.js',
	  'test3.js',
	  'test4.js' ]
	 **/
})
```

```javascript
// 创建文件夹
const fs = require("fs");

fs.mkdir("test",err=>{});
```

```javascript
// 删除文件夹
const fs = require("fs");

fs.rmdir("./test",err=>{});
```

```javascript
// watch监视文件变化
const fs = require("fs");

fs.watch("./",{
	recursive: true //是否循环递归
},(eventType,filename) => {
	console.log(eventType, filename)
})
```

```javascript
// readStream 流 (从一个方向流向另一个方向)
const fs = require("fs");

const rs = fs.createReadStream("./fs.js");

rs.pipe(process.stdout) // process.stdout控制台
```

```javascript
// writeStream 
const fs = require("fs");

const ws = fs.createWriteStream("./test5.js");

const time = setInterval(()=>{
	const num = parseInt(Math.random() * 10);

	if (num < 7) {
		ws.write(num + ""); // 需要转成字符串或者buffer才能写入
	} else {
		clearInterval(time);
		ws.end();// 写完数据
	}
},200)

// 用事件判断是否写完数据
ws.on("finish", () => {
	console.log("done!");
})
```

异步解决方案
---

```javascript
// 异步回调 Node.js v8.0.0版本增加了util.promisify函数

const fs = require("fs");
const promisify = require("util").promisify;

const read = promisify(fs.readFile); 

read("./callback.js").then(data=>{
	console.log(data.toString());
}).catch(ex=>{
	console.log(ex)
})

// async awit
async function test() {
	try {
		const content = awit read("./callback.js");
		console.log(content.toString())
	} catch (ex) {
		console.log(ex)
	}
}
test()
```

