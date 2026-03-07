---
title: 一次node文件操作过多排查过程总结
date: 2022-02-16 15:55:24
tags: Node
categories: Front-End
---


最近在优化公司内部的脚手架，遇到一个问题，`Error: EMFILE, too many open files`也就是nodejs打开文件过多会导致错误，一次次排查，最后找到了一个有效的方法，总结记录一下

当我尝试去操作大量文件的时候

```js
for(var i=0; i<200000; i++) {
    fq.readFile('./somefile.txt', {encoding: 'utf8'}, function(err, somefile) {
        console.log("data from somefile.txt without crashing!", somefile);
    });
}
```

> 以上导致`Error: EMFILE: too many open files`错误。我不必关闭文件，因为显然可以`fs.readFile`对文件进行操作并为我关闭文件。我在`Mac OS`上，我的`ulimit`设置为`8192`

```
$ ulimit -a
-t: cpu time (seconds)              unlimited
-f: file size (blocks)              unlimited
-d: data seg size (kbytes)          unlimited
-s: stack size (kbytes)             8192
-c: core file size (blocks)         0
-v: address space (kbytes)          unlimited
-l: locked-in-memory size (kbytes)  unlimited
-u: processes                       1392
-n: file descriptors                256
```

![](https://blog.poetries.top/img/static/images/202202161407524.png)

可以通过修改系统配置，但是不太推荐

```
$ echo kern.maxfiles=65536 | sudo tee -a /etc/sysctl.conf
$ echo kern.maxfilesperproc=65536 | sudo tee -a /etc/sysctl.conf
$ sudo sysctl -w kern.maxfiles=65536
$ sudo sysctl -w kern.maxfilesperproc=65536
$ ulimit -n 65536 
```

> - 由于`node.js`的异步特性，因此会发生此错误。进程试图打开的文件超出允许的数量，因此会产生错误。
> - 可以通过创建打开`文件队列`来解决此问题，`以使它们永远不会超过限制`，以下是一些可以为您完成此操作的库：

我们可以使用文件队列来限制每次打开的文件数量

> Instantiate Filequeue with a maximum number of files to be opened at once (default is 200)

**how to use**

```js
var FileQueue = require('filequeue');
var fq = new FileQueue(100);

// additional instances will attempt to use the same instance (and therefore the same maxfiles)

var FileQueue2 = require('filequeue');
var fq2 = new FileQueue2(100);

console.log(fq === fq2); // => true

// you can force a new instance of filequeue with the `newQueue` parameter

var fq3 = new FileQueue(100, true);

console.log(fq === fq3); // => false
```

**filequeue支持以下方法**

```
readFile
writeFile
readdir
rename
symlink
mkdir
stat
exists
createReadStream
createWriteStream
```

使用`filequeue`就可以正常运行了

```js
var FileQueue = require('filequeue');
var fq = new FileQueue(100); // 限制每次打开的文件数量

for(var i=0; i<200000; i++) {
    fq.readFile('./demo.txt', {encoding: 'utf8'}, function(err, somefile) {
        console.log("data from somefile.txt without crashing!", somefile);
    });
}
```

