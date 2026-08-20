---
title: Node.js系列之WebSocket与socket.io实战
description: 从原生 WebSocket 的用法、断线重连与心跳机制，讲到用 socket.io 在原生 Node、Express、Koa 三种环境下实现聊天室与智能机器人，附可运行的完整代码与常见踩坑点说明。
date: 2019-01-24 15:00:43
tags: 
   - Socket
   - Websocket
   - Node
categories: Back-end
---

做一个订单状态实时刷新的功能时，我最早的方案是每三秒轮询一次接口。上线之后运维找过来，说那个接口的 QPS 涨了几十倍，而且绝大多数请求返回的都是「没有变化」。这才是我真正开始认真看 WebSocket 的起点。

这篇分两部分。前半部分讲原生 WebSocket，从最小可运行的例子到封装成 class，再到断线重连和心跳保活这两个绕不开的问题。后半部分讲 socket.io，分别在原生 Node、Express、Koa 三种环境下把服务端和客户端跑通，顺带说清楚 `socket.emit` 和 `io.emit` 这两个方法为什么能分别做出机器人和聊天室。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 轮询到底浪费在哪，WebSocket 解决的是什么问题
- 一个最小的 WebSocket 例子，四个回调分别在什么时候触发
- 把 WebSocket 封装成 class，以及原文那个 class 里的一处真实 bug
- WebSocket 为什么会莫名断开，重连和心跳两种方案的取舍
- `readyState` 的四个状态值，以及发送二进制数据的写法
- WebSocket 的优点，以及「没有同源限制」这句话背后的安全隐患
- socket.io 在原生 Node、Express、Koa 三种环境下的接法
- `socket.emit` 和 `io.emit` 的区别，聊天室和智能机器人的实现原理
- socket.io 新旧版本的 API 差异，老代码迁移时要注意什么

## 一、WebSocket 解决了什么问题

客户端（浏览器）和服务器端进行通信，只能由客户端发起 ajax 请求才能进行通信，服务器端无法主动向客户端推送信息。

当出现类似体育赛事、聊天室、实时位置之类的场景时，客户端要获取服务器端的变化，就只能通过轮询（定时请求）来了解服务器端有没有新的信息变化。

轮询效率低，非常浪费资源，需要不断发送请求、不停连接服务器。

这个浪费具体在哪？每次轮询都是一次完整的 HTTP 请求，要走 TCP 连接（没有 keep-alive 的话还要三次握手）、要带上完整的请求头和 Cookie、服务端要走一遍鉴权和路由。而这一整套开销换来的往往是一句「数据没变」。你把轮询间隔调短，服务器压力线性上升；调长，实时性又不够。这是个没有最优解的取舍。

WebSocket 的出现，让服务器端可以主动向客户端发送信息，使得浏览器具备了实时双向通信的能力，这就是 WebSocket 解决的问题。

原文这句话写的是「让服务器端可以主动向服务器端发送信息」，前后都是服务器端，是个笔误，正确的是服务端主动推给客户端。

它的做法是：先用一个普通的 HTTP 请求发起握手（带上 `Upgrade: websocket` 头），服务端同意之后，这条 TCP 连接就从 HTTP 协议切换成 WebSocket 协议，之后双方都可以随时往这条连接上发数据，不需要再有请求响应的配对关系。

### 1.1 一个超简单的例子

新建一个 html 文件，把下面这段找个地方跑一下，就算入门 WebSocket 了。

```js
function socketConnect(url) {
    // 客户端与服务器进行连接
    let ws = new WebSocket(url); // 返回WebSocket对象，赋值给变量ws
    // 连接成功回调
    ws.onopen = e => {
        console.log('连接成功', e)
        ws.send('我发送消息给服务端'); // 客户端与服务器端通信
    }
    // 监听服务器端返回的信息
    ws.onmessage = e => {
        console.log('服务器端返回：', e.data)
        // do something
    }
    return ws; // 返回websocket对象
}
let wsValue = socketConnect('ws://121.40.165.18:8800'); // websocket对象
```

这段代码信息量不大但每一行都有讲究。

`new WebSocket(url)` 是立刻发起连接的，构造函数返回时连接还没建好。所以 `ws.send()` 必须写在 `onopen` 里面，写在构造函数后面会报 `InvalidStateError`，因为那时候连接还处于 CONNECTING 状态。这是新手第一个会撞的墙。

`onmessage` 拿到的 `e.data` 是原始数据。服务端如果发的是 JSON 字符串，这里拿到的是字符串不是对象，得自己 `JSON.parse`。而且要包一层 `try/catch`，因为服务端偶尔会发一些非 JSON 的控制消息（比如心跳的 `pong`），直接 parse 会抛异常把整个 `onmessage` 打断。

`ws://` 和 `wss://` 的关系相当于 `http://` 和 `https://`。页面是 HTTPS 的话，浏览器不允许你连 `ws://`（混合内容会被拦截），必须用 `wss://`。

上述例子中 WebSocket 的接口地址出自 WebSocket 在线测试站点，在开发的时候也可以用于测试后端给的地址是否可用。

![WebSocket 在线测试工具界面](https://s.poetries.top/gitee/2019/10/389.png)

这类公共回声服务的可用性变化很快，2019 年能用的地址现在多半已经下线了。要找可用的测试端点，去搜当下还在维护的在线工具，或者自己用 `ws` 这个 npm 包起一个本地服务，二十行代码就够，比依赖别人的服务靠谱。

## 二、把 WebSocket 封装成 class

当项目中很多地方使用 WebSocket，把它封成一个 class 类是更好的选择。

```js
class WebSocketClass {
    /**
     * @description: 初始化实例属性，保存参数
     * @param {String} url ws的接口
     * @param {Function} msgCallback 服务器信息的回调传数据给函数
     * @param {String} name 可选值 用于区分ws，用于debugger
     */
    constructor(url, msgCallback, name = 'default') {
        this.url = url;
        this.msgCallback = msgCallback;
        this.name = name;
        this.ws = null;  // websocket对象
        this.status = null; // websocket是否关闭
    }
    /**
     * @description: 初始化 连接websocket或重连webSocket时调用
     * @param {*} 可选值 要传的数据
     */
    connect(data) {
        // 新建 WebSocket 实例
        this.ws = new WebSocket(this.url);
        this.ws.onopen = e => {
            // 连接ws成功回调
            this.status = 'open';
            console.log(`${this.name}连接成功`, e)
            // this.heartCheck();
            if (data !== undefined) {
                // 有要传的数据,就发给后端
                return this.ws.send(data);
            }
        }
        // 监听服务器端返回的信息
        this.ws.onmessage = e => {
            // 把数据传给回调函数，并执行回调
            return this.msgCallback(e.data);
        }
        // ws关闭回调
        this.ws.onclose = e => {
            this.closeHandle(e); // 判断是否关闭
        }
        // ws出错回调
        this.ws.onerror = e => {
            this.closeHandle(e); // 判断是否关闭
        }
    }
    // 发送信息给服务器
    sendHandle(data) {
        console.log(`${this.name}发送消息给服务器:`, data)
        return this.ws.send(data);
    }
    closeHandle(e = 'err') {
        // 因为webSocket并不稳定，规定只能手动关闭(调closeMyself方法)，否则就重连
        if (this.status !== 'close') {
            console.log(`${this.name}断开，重连websocket`, e)
            this.connect(); // 重连
        } else {
            console.log(`${this.name}websocket手动关闭`)
        }
    }
    // 手动关闭WebSocket
    closeMyself() {
        console.log(`关闭${this.name}`)
        this.status = 'close';
        return this.ws.close();
    }
}
```

这里我改了一处 bug，得单独说一下。

原文写的是 `this.onerror = e => {...}`，少了中间的 `ws`。这一行是给 `WebSocketClass` 的实例挂了一个叫 `onerror` 的属性，跟那个 WebSocket 对象没有任何关系。结果就是连接出错时这个回调永远不会被触发，出错路径下的重连逻辑整个失效。

它为什么没被发现？因为 `onclose` 是正确的，而 WebSocket 出错时通常也会紧接着触发 `close`，重连凑巧还是能跑起来。这类 bug 最难查，因为表现上「大部分时候是好的」。正确写法是 `this.ws.onerror = ...`，我改过来了。

用法是这样。

```js
function someFn(data) {
    console.log('接收服务器消息的回调：', data);
}
const wsValue = new WebSocketClass('wss://echo.websocket.org', someFn, 'wsName');
wsValue.connect('立即与服务器通信'); // 连接服务器
```

这里的 `wss://echo.websocket.org` 是当年阮一峰老师教程里用的公共回声服务，现在已经不可用了，换成你自己的测试地址即可。

可以把 class 放在一个 js 文件里面 export 出去，然后在需要用的地方再 import 进来，把参数传进去就可以用了。

用这个 class 的时候还有一点要留意：`connect()` 里每次都是 `new WebSocket`，旧的那个实例上的回调如果没解绑，重连多次之后可能会有多份回调同时在跑。生产代码里我会在重连前先把旧实例的四个 handler 置空，再 `close()` 掉。

## 三、WebSocket 为什么会断

WebSocket 并不稳定，在使用一段时间后可能会断开连接，貌似至今没有一个为何会断开连接的公论，所以我们需要让 WebSocket 保持连接状态。

其实原因大多是可以定位的，只是分散在链路的各个环节上。Nginx 有 `proxy_read_timeout`，默认 60 秒没有数据流动就断；很多云负载均衡有更短的空闲超时；企业网络里的代理和防火墙也会主动清理长时间没流量的连接；手机从 WiFi 切到 4G 时整条 TCP 连接直接失效。这些环节没有一个会告诉你「我要断了」，你只会看到一个突如其来的 `onclose`。

针对这个问题，这里推荐两种方法。

### 3.1 设置变量，判断是否手动关闭连接

class 类中就是用的这种方式：设置一个变量，在 WebSocket 关闭或报错的回调中判断是不是手动关闭的，如果不是的话就重新连接。

- 优点：请求较少（相对于心跳连接），易设置
- 缺点：可能会导致丢失数据，在断开重连的这段时间中恰好双方正在通信

补充两条实践经验。重连一定要加退避，别在 `onclose` 里直接 `connect()`。服务端挂了的时候，这种写法会变成一秒几百次的疯狂重连，把服务端和客户端一起拖死。合理的做法是第一次等 1 秒，之后每次翻倍，封顶 30 秒。

另外重连成功之后，之前订阅的频道、发出去但没收到回应的消息，这些状态都需要重新建立。只把连接恢复了、状态没恢复，用户看到的还是一个不动的页面。

### 3.2 心跳机制

因为第一种方案的缺点，并且可能会有其他一些未知情况导致断开连接而没有触发 error 或 close 事件，这样就导致实际连接已经断开了，而客户端和服务端却不知道，还在傻傻的等着消息来。

这种状态叫「假死连接」，是最难受的一种。`readyState` 还是 1，看起来一切正常，但数据永远发不出去也收不到。

于是有了心跳机制：客户端就像心跳一样每隔固定的时间发送一次 ping，来告诉服务器我还活着；而服务器也会返回 pong，来告诉客户端服务器还活着。

具体实现是这样。

```js
heartCheck() {
    // 心跳机制的时间可以自己与后端约定
    this.pingPong = 'ping'; // ws的心跳机制状态值
    this.pingInterval = setInterval(() => {
        if (this.ws.readyState === 1) {
            // 检查ws为链接状态 才可发送
            this.ws.send('ping'); // 客户端发送ping
        }
    }, 10000)
    this.pongInterval = setInterval(() => {
        if (this.pingPong === 'ping') {
            this.closeHandle('pingPong没有改变为pong'); // 没有返回pong 重启webSocket
        }
        // 重置为ping 若下一次 ping 发送失败 或者pong返回失败(pingPong不会改成pong)，将重启
        this.pingPong = 'ping'
    }, 20000)
}
```

配合 `onmessage` 里的这一段，收到 pong 时把状态改掉。

```js
this.ws.onmessage = e => {
    if (e.data === 'pong') {
        this.pingPong = 'pong'; // 服务器端返回pong,修改pingPong的状态
    }
    return this.msgCallback(e.data);
}
```

原文这段注释掉的代码里有个逻辑问题：`pongInterval` 的回调开头写了 `this.pingPong = false;`，紧接着判断 `if (this.pingPong === 'ping')`，这个条件永远是 false，检测逻辑一次都不会触发。我把那行多余的赋值去掉了，判断放在重置之前才对。

心跳的两个间隔也有讲究。发送间隔（10 秒）要明显小于链路上最短的那个空闲超时，Nginx 默认 60 秒的话，10 到 30 秒都是安全的。检测间隔（20 秒）要大于发送间隔，给 pong 留出往返的时间，否则会误判成断线然后疯狂重连。

还有个细节，重连之前要把这两个定时器 `clearInterval` 掉，不然每重连一次就多一组定时器在跑，跑一晚上你会看到心跳消息像洪水一样发出去。

## 四、关于 WebSocket 的几个细节

### 4.1 当前状态 readyState

下面是 `WebSocket.readyState` 的四个值（四种状态）：

- `0` 表示正在连接
- `1` 表示连接成功，可以通信了
- `2` 表示连接正在关闭
- `3` 表示连接已经关闭，或者打开连接失败

我们可以利用当前状态来做一些事情，比如上面例子中当 WebSocket 连接成功后才允许客户端发送 ping。

```js
if (this.ws.readyState === 1) {
    // 检查ws为链接状态 才可发送
    this.ws.send('ping'); // 客户端发送ping
}
```

这个判断在实际项目里几乎是必须的。用户网络抖一下，连接进了重连过程，这时候业务代码调 `send()` 就会抛异常。稳妥的做法是把 `send` 包一层，连接不可用时把消息暂存进一个队列，`onopen` 之后再补发。

顺带一提，这四个数字也有对应的常量 `WebSocket.OPEN` 之类，写 `ws.readyState === WebSocket.OPEN` 比写魔法数字可读性好得多。

### 4.2 发送和接收二进制数据

二进制数据包括 blob 对象和 ArrayBuffer 对象，所以我们需要分开来处理。

```js
 // 接收数据
ws.onmessage = function(event){
    if(event.data instanceof ArrayBuffer){
        // 判断 ArrayBuffer 对象
    }

    if(event.data instanceof Blob){
        // 判断 Blob 对象
    }
}

// 发送 Blob 对象的例子
let file = document.querySelector('input[type="file"]').files[0];
ws.send(file);

// 发送 ArrayBuffer 对象的例子
var img = canvas_context.getImageData(0, 0, 400, 320);
var binary = new Uint8Array(img.data.length);
for (var i = 0; i < img.data.length; i++) {
    binary[i] = img.data[i];
}
ws.send(binary.buffer);
```

接收端拿到的到底是 Blob 还是 ArrayBuffer，是由 `ws.binaryType` 决定的，默认值是 `'blob'`。想直接拿 ArrayBuffer 做位运算的话，连接建立后设一下 `ws.binaryType = 'arraybuffer'` 就行，不用两种都判断。

如果你要发送的二进制数据很大，怎么判断发送完毕？用 `bufferedAmount` 属性，它表示还有多少字节的二进制数据没有发送出去。

```
var data = new ArrayBuffer(10000000);
socket.send(data);
if (socket.bufferedAmount === 0) {
    // 发送完毕
} else {
    // 发送还没结束
}
```

`send()` 这个方法是不阻塞的，它只是把数据塞进发送缓冲区就返回了。传大文件时如果不看 `bufferedAmount` 就一直往里塞，缓冲区会一直涨，内存吃满页面就卡死了。正确的做法是分片发送，每片发完检查 `bufferedAmount`，等它降下来再发下一片。

### 4.3 优点与它的边界

WebSocket 的优点：

- 双向通信
- 数据格式比较轻量，性能开销小，通信高效。协议控制的数据包头部较小，而 HTTP 协议每次通信都需要携带完整的头部
- 更好的二进制支持
- 没有同源限制，客户端可以与任意服务器通信
- 与 HTTP 协议有着良好的兼容性。默认端口也是 80 和 443，并且握手阶段采用 HTTP 协议，因此握手时不容易屏蔽，能通过各种 HTTP 代理服务器

「没有同源限制」这条是优点，但它同时也是一个安全隐患，这里得展开讲一句。

浏览器对 WebSocket 不做同源检查，也就是说任何一个网站的页面都能向你的 WebSocket 服务发起连接，而且浏览器会自动带上你站点的 Cookie。攻击者做一个页面诱导用户打开，这个页面就能以用户的身份连上你的 WebSocket 服务，这个攻击叫跨站 WebSocket 劫持。

防御方式是服务端在握手阶段检查 `Origin` 请求头，只放行白名单里的来源；更稳的是不依赖 Cookie 鉴权，改用握手时传 token 的方式。这一条在只看优点列表的时候很容易被忽略掉。

## 五、原生 Node 结合 socket.io

原生 Node.js 结合 socket.io 实现服务器和客户端的相互通信，官方文档在 https://socket.io

先说 socket.io 和 WebSocket 是什么关系。socket.io 不是 WebSocket 的简单封装，它是一套自己的协议，底层优先用 WebSocket，环境不支持时会退化到 HTTP 长轮询。它额外提供了自动重连、心跳、房间（room）、命名空间（namespace）、消息确认回执这些能力。代价是客户端必须用它配套的库，你没法用原生 `new WebSocket()` 去连一个 socket.io 服务端。

### 5.1 搭建服务

```bash
# 新建目录
mkdir socket && cd socket

# 生成package.json
npm init -y

# 安装socket
npm install socket.io
```

```js
// app.js

var http = require("http");
var fs = require("fs");

var server = http.createServer(function(req,res){
    if(req.url == "/"){ //显示首页
        fs.readFile("./index.html",function(err,data){ 
            res.end(data);
        }); 
    }
});

var io = require('socket.io')(server);

//监听连接事件 
io.on("connection",function(socket){
    console.log("1 个客户端连接了"); 
})

server.listen(3000,"127.0.0.1",function(){
    console.log('app run at 127.0.0.1:3000')
});

// 写完这句话之后，你就会发现，http://127.0.0.1:3000/socket.io/socket.io.js 就是一个 js 文件的地址了
```

原文这段用了 `fs.readFile` 但没有 `require('fs')`，跑起来会报 `fs is not defined`，我补上了。

`require('socket.io')(server)` 这一行做的事情比看起来多。它把 socket.io 挂到了这个 http server 上，同时注册了一个特殊路径 `/socket.io/`，客户端脚本和握手请求都走这个路径。所以你不用单独部署客户端的 js 文件，服务端会自动提供。

这里补一句版本差异：`require('socket.io')(server)` 是 2.x 的写法，socket.io 3.0 之后推荐 `const { Server } = require('socket.io'); const io = new Server(server);`。老写法在一段时间内还兼容，但 3.x 相对 2.x 有一些破坏性变更，最典型的是跨域从默认允许改成了必须显式配 `cors` 选项。老代码升级时这个最容易踩，具体以官方的迁移文档为准。

### 5.2 新建页面

现在需要制作一个 index 页面，这个页面中必须引用那个自动提供的 js 文件，调用 `io` 函数取得 socket 对象。

```html
<!DOCTYPE html> <html lang="en"> <head>
<meta charset="UTF-8">
<title>Document</title> </head>
<body>

<h1>我是 index 页面，我引用了秘密 script 文件</h1>

<script type="text/javascript" src="/socket.io/socket.io.js"></script> <script type="text/javascript">
    var socket = io(); 
    console.log(socket)
</script>

</body> 
</html>
```

至此服务器和客户端都有 socket 对象了。打印出来看一眼服务器的 socket 对象。

![socket.io 服务端 socket 对象的结构](https://s.poetries.top/gitee/2019/10/390.png)

![socket 对象上的属性与方法](https://s.poetries.top/gitee/2019/10/391.png)

图里能看到 socket 对象上挂了 `id`、`rooms`、`handshake` 这些东西。`socket.id` 是每个连接的唯一标识，做一对一推送时会用到；`handshake` 里有握手时的请求头和 query 参数，鉴权信息一般就从这里取。

### 5.3 服务器端通过 emit 广播，通过 on 接收

```js
// app.js

var http = require("http");
var fs = require("fs");

var server = http.createServer(function(req,res){
    if(req.url == "/"){ //显示首页
        fs.readFile("./index.html",function(err,data){ 
            res.end(data);
        }); 
    }
});

var io = require('socket.io')(server);

//监听连接事件 
io.on('connection',function(socket) {
    console.log('和服务器建立连接了');
    
    socket.on('to-server',function(data) {
    
        // 接收客户端传过来的数据
        console.log('客户端说:' + data);
        
        // socket 只给当前发送消息给服务端的客户端发送消息
        socket.emit('to-client','我是服务器返回的数据');
        
    }) 
    socket.on('disconnect',function() {
        console.log('断开连接了');
    })
})

server.listen(3000,"127.0.0.1",function(){
    console.log('app run at 127.0.0.1:3000')
});
```

![socket.emit 只回给发消息的那个客户端](https://s.poetries.top/gitee/2019/10/392.png)

每一个连接上来的用户都有一个 socket。由于我们的 emit 语句是 `socket.emit()` 发出的，所以指的是向这个客户端发出语句。

那广播呢？广播就是给所有当前连接的用户发送信息。

```js
var io = require('socket.io')(server);

io.on('connection',function(socket) {

    console.log('和服务器建立连接了')
    
    socket.on('to-server',function(data) {
    
        console.log('客户端说:' + data);
        
        // io 给所有建立连接的客户端发送数据，不管是哪个客户端发送消息，都会对所有客户端进行广播一次
        io.emit('to-client','我是服务器返回的数据');
    }) 
    socket.on('disconnect',function() {
        console.log('断开连接了');
    })
})

```

![io.emit 广播给所有连接的客户端](https://s.poetries.top/gitee/2019/10/393.png)

![多个客户端同时收到广播消息](https://s.poetries.top/gitee/2019/10/394.png)

这两张图对比着看就很清楚了。前面用 `socket.emit` 的时候，只有发消息的那个窗口收到了回复；换成 `io.emit` 之后，所有打开的窗口都收到了。

所以这两个方法的分工是：

- `io.emit()` 可以实现聊天室消息群发
- `socket.emit()` 可以实现聊天机器人，一对一发送

还有第三个常用的，`socket.broadcast.emit()`，它发给除了自己之外的所有人。做聊天室的时候这个更常用，因为自己发的消息一般在本地就直接上屏了，不需要服务端再推一遍。

再往上还有房间的概念，`socket.join('room1')` 之后用 `io.to('room1').emit()` 就只发给这个房间里的人。做多个聊天群的时候靠它隔离，不用自己维护连接列表。

### 5.4 客户端通过 emit 发送，通过 on 接收

```js
// index.html
<!DOCTYPE html> 
<html lang="en"> 
<head>
    <meta charset="UTF-8">
    <title>socket demo</title> 
</head>
<body>

<h1>我是 index 页面，我引用了秘密 script 文件</h1>
<button id="btn">给服务端发送数据</button>

<script type="text/javascript" src="/socket.io/socket.io.js"></script> <script type="text/javascript">

    // 连接的地址http://localhost:3000 后台提供
    var socket = io.connect('http://localhost:3000');

    // 客户端建立连接
    socket.on('connect',function() {
        console.log('客户端和服务端建立连接了');
    }) 

    socket.on('disconnect',function() {
        console.log('客户端和服务端断开连接了');
    }) 

    // 客户端给服务端发送数据后，监听服务端返回的数据
    socket.on('to-client',function(data) {
        console.log('客户端说:' + data);
    }) 

    var btn = document.getElementById('btn');

    btn.onclick = function() {
        socket.emit('to-server','我是客户端的数据');
    }
</script>

</body> 
</html>
```

客户端这边的 `connect` 和 `disconnect` 是 socket.io 的内置事件，不用自己实现重连，它默认就带自动重连。这一点比裸写 WebSocket 省事太多，前面第三节讲的那一堆重连和心跳逻辑，socket.io 内部都做了。

`io.connect(url)` 这个写法在新版本里已经不推荐了，现在直接写 `io(url)`。功能一样，只是 API 收敛了。

## 六、聊天室与智能机器人的实现原理

### 6.1 Express 结合 socket.io

Express 结合 socket.io 实现服务器和客户端的相互通信，是最常见的组合。

- [express 文档](http://www.expressjs.com.cn/starter/generator.html)
- [socket.io 文档](https://socket.io/docs)

服务端：

```js
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(80);
// WARNING: app.listen(80) will NOT work here!

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});
```

这里那行大写的警告很关键，值得展开。`app.listen(80)` 内部其实也会创建一个 http server 并返回它，但那是 Express 自己创建的另一个实例，和你传给 socket.io 的这个 `server` 不是同一个。结果就是 socket.io 挂在一个没有监听端口的 server 上，客户端怎么连都连不上，而且服务端不报任何错。

所以顺序必须是：先 `require('http').Server(app)` 拿到 server，把它同时交给 socket.io 和 `server.listen()`。这个坑第一次遇到很难自己想明白。

客户端：

```html
<script src="/socket.io/socket.io.js"></script>
<script>
  var socket = io.connect('http://localhost');
  socket.on('news', function (data) {
    console.log(data);
    socket.emit('my other event', { my: 'data' });
  });
</script>
```

### 6.2 用 Express 实现智能机器人

机器人的原理其实很简单：收到消息之后用 `socket.emit` 只回给发消息的那个人，不广播。

页面部分：

```html
<!--views/index.ejx-->
<html>
<head>
  <title></title>

    <script src="/jquery-1.11.3.min.js"></script>

    <script src="/socket.io/socket.io.js"></script>
</head>
<body>

    <input type="text" id="msg"/>

    <br/>
    <br/>

    <button id="send">发送</button>

</body>
</html>

<script>
$(function(){

    var socket = io.connect('http://127.0.0.1:8000');

    //群聊功能--聊天室
    $('#send').click(function(){
        var msg=$('#msg').val();

        socket.emit('message',msg);  /*客户端给服务器发送数据*/

    })
    //接受服务器返回的数据
    socket.on('servermessage',function(data){

        console.log(data)
    })

})
</script>
```

服务端：

```js
// app.js

var express=require('express');

var app=express();

/*第一步*/
var server = require('http').Server(app);
var io = require('socket.io')(server);


app.set('view engine','ejs');
app.use(express.static('public'));

app.get('/',function(req,res){
    res.render('index');
})

app.get('/news',function(req,res){
    res.send('news');
})

//2.监听端口
server.listen(8000,'127.0.0.1');   /*改ip*/

//3、写socket的代码

io.on('connection', function (socket) {
  console.log('建立链接')

    socket.on('message',function(data){

        console.log(data);

        //io.emit  广播 --- 聊天室
        //socket.emit  谁给我发的信息我回返回给谁 --- 智能机器人

        //io.emit('servermessage',data);   /*服务器给客户端发送数据*/

        if(data==1){

            var msg='您当前的话费有2元'
        }else if(data==2){
            var msg='您当前的流量有200M'

        }else{
            var msg='请输入正确的信息'
        }

        socket.emit('servermessage',msg);

    })
});

```

这段代码里的 `var msg` 在三个分支里各声明了一次，能跑是因为 `var` 有变量提升，实际上是同一个变量。这是 2019 年的常见写法，现在应该用 `let msg` 在 if 之前先声明，或者干脆用一个映射对象把这段 if-else 换掉，加新的问答规则时不用改逻辑只用加数据。

另外把 `data==1` 换成 `data === '1'` 更稳妥，`==` 的隐式类型转换在这里刚好帮了忙，但依赖它不是好习惯。

[完整代码在这里](https://github.com/poetries/socket.io-demo/tree/master/express-socket-chat)

### 6.3 结合数据库的智能机器人

前面那个机器人的回答是写死的，接上数据库之后就能做真正的检索式问答了。

```js
// app.js

var express=require('express');

var app=express();

var DB=require('./module/db.js');

/*第一步*/
var server = require('http').Server(app);
var io = require('socket.io')(server);


app.set('view engine','ejs');
app.use(express.static('public'));

app.get('/',function(req,res){
    res.render('index');
})

app.get('/news',function(req,res){
    res.send('news');
})

//2.监听端口
server.listen(8000,'127.0.0.1', function () {
    console.log('app run at 127.0.0.1:8000')
});   /*改ip*/


//3、写socket的代码

io.on('connection', function (socket) {
    console.log('建立链接')

    socket.on('message',function(data){

        console.log(data)

        var msg=data.msg||'';  /*获取客户端的数据*/

        //去服务器查询数据

        DB.find('article',{'title':{$regex:new RegExp(msg)}},{'title':1},function(err,data){

            console.log(data);

            socket.emit('servermessage',{
                result:data
            });
        })

    })
});
```

这里有个安全问题得提一句：`new RegExp(msg)` 直接把用户输入拿去构造正则。用户传一个 `.*.*.*.*.*.*` 这样的表达式过来，正则引擎会出现灾难性回溯，一条查询就能把 CPU 打满。生产环境要么先对输入做转义，要么改用全文索引而不是正则匹配。

这个坑不只在 socket 场景，任何把用户输入拼进查询条件的地方都一样。MongoDB 这块的查询写法我在 [MongoDB 拾遗](https://feinterview.poetries.top/blog/mongodb-review-1) 里整理过，正则查询能不能走索引那部分和这里是相关的。

对应的页面：

```html
<!DOCTYPE>
<html>
<head>
    <title></title>
    <script
  src="https://code.jquery.com/jquery-3.3.1.min.js"
  integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8="
  crossorigin="anonymous"></script>

    <script src="/socket.io/socket.io.js"></script>
    <style>

        .box{
            width: 300px;
            height: 400px;
            margin: 0 auto;
            border: 1px solid #666;
            margin-top:20px;
        }
        .list{
            width: 300px;
            height: 360px;
            overflow-y: auto;
        }
        .message{
            height: 40px;
            line-height: 44px;
            display: flex;
        }
        .message input{

            border: 1px solid #666;
        }
        .message input[type='text']{
            flex: 1;
            height: 38px;
        }
        .message input[type='button']{
            width: 100px;
            height: 40px;
            border: 1px solid #666;
        }
    </style>
</head>
<body>

    <div class="box">
        <div class="list">
            <div id="list">
            </div>
            <div class="footer" id="footer">

            </div>
        </div>
        
        <div class="message">
            <input type="text" id="msg" />
            <input type="button" id="send" value="发送"/>
        </div>

    </div>

</body>
</html>
```

交互脚本：

```js
    $(function(){

        var socket = io.connect('http://127.0.0.1:8000');

        socket.on('servermessage',function(data){

            if(data.result.length)
            {
                var str='<ul>';
                for(var i=0;i<data.result.length;i++){

                    str+='<li>'+data.result[i].title+'</li>';
                }
                str+='</ul>';
            }else{

                var str='<p>没有找到您要的数据，请联系人工客服</p>'
            }
            $('#list').append(str);
            $('#footer').get(0).scrollIntoView();

        })

        var username='zhangsan'+Math.floor(Math.random()*10);

        //群聊功能--聊天室
        $('#send').click(function(){
            var msg=$('#msg').val();
            socket.emit('message',{
                'username':username,
                'msg':msg
            });
            $('#list').append(`<p><strong>${username}:</strong>  ${msg}</p>`);

            $('#msg').val();

        })
    })
```

这段里的 `$('#footer').get(0).scrollIntoView()` 是个挺聪明的小技巧，在消息列表末尾放一个空的占位元素，每次追加完消息滚到它那里，就实现了聊天窗口自动滚到底部。不用去算 `scrollHeight`。

有两个小问题顺带指出来。`$('#msg').val()` 那行本意应该是清空输入框，得写成 `$('#msg').val('')`，不传参数是取值不是赋值，所以现在发完消息输入框里的内容不会清掉。另外用字符串拼接把 `data.result[i].title` 插进 HTML 是有 XSS 风险的，标题里带 `<script>` 就直接执行了，应该用 `.text()` 来设置内容。

[完整代码在这里](https://github.com/poetries/socket.io-demo/tree/master/express-socket-chat-use-db)

## 七、Koa 中使用 socket.io

服务端配置：

```bash
# 1 安装
cnpm i -S koa-socket
```

```js
// app.js

// 2 引入
const IO = require( 'koa-socket' )

// 3 实例化
const io = new IO()

io.attach( app )

// 4 配置服务端

app._io.on( 'connection', socket => {

console.log('建立连接了');
})
```

客户端代码：

```html
 <script src="http://localhost:3000/socket.io/socket.io.js"></script>
 <script>
    var socket=io.connect('http://localhost:3000/')
 </script>
```

`io.attach(app)` 这一步做的是把 socket.io 挂到 Koa 的 http server 上，并在 app 上挂一个 `_io` 属性。和 Express 那边的区别只是拿到底层 server 的方式不同，socket.io 本身的 API 完全一样。

`koa-socket` 这个包后来更新不多，社区里现在更常见的做法是不用中间层，直接用 `app.callback()` 创建原生 http server，再把 socket.io 挂上去。

```js
const http = require('http')
const server = http.createServer(app.callback())
const io = require('socket.io')(server)
server.listen(3000)
```

这样做的好处是少一层封装，socket.io 的版本升级不会被中间层卡住。Koa 本身的中间件机制和 `ctx` 的实现我在 [重新认识 Koa2](https://feinterview.poetries.top/blog/relearn-koa) 里详细写过，理解了 `app.callback()` 返回的是什么，上面这段代码就很好懂了。

[完整代码在这里](https://github.com/poetries/socket.io-demo/tree/master/koa-socket.io)

## 总结

从轮询换到 WebSocket 这件事，收益是实打实的，但它带来的复杂度也是实打实的。

裸用 WebSocket 的话，重连、心跳、状态恢复、消息队列这四件事你都得自己写，而且每一件都有细节坑。重连不加退避会打垮服务端，心跳的检测逻辑写反了会一次都不触发，`onerror` 少写一个 `ws` 会让错误路径静默失效。这些我在上面都一一标出来了。

如果不是有特殊的协议要求，直接上 socket.io 会省很多事。它把重连和心跳都内置了，还额外给了房间和命名空间这两个在业务上非常实用的抽象。代价是客户端必须用它的库，而且 2.x 到 3.x 有破坏性变更，老项目升级要按官方迁移文档逐条对。

`socket.emit`、`io.emit`、`socket.broadcast.emit` 这三个方法的区别是使用 socket.io 的核心：一对一回复用第一个，全员广播用第二个，除自己外的所有人用第三个。聊天室和智能机器人的差别，说到底就是这一行代码的差别。

最后提醒一个部署时才会暴露的问题：WebSocket 走 Nginx 反向代理时，必须配 `proxy_set_header Upgrade $http_upgrade;` 和 `proxy_set_header Connection "upgrade";`，还要把 `proxy_read_timeout` 调大。不配的话本地开发一切正常，一上线就连不上或者连上没几十秒就断，这个我踩过。

## 参考

- [MDN WebSocket API](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket)
- [MDN 编写 WebSocket 客户端应用](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
- [RFC 6455 The WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
- [Socket.IO 官方文档](https://socket.io/docs/v4/)
- [Socket.IO 从 2.x 迁移到 3.x](https://socket.io/docs/v4/migrating-from-2-x-to-3-0/)
- [Nginx WebSocket 代理配置](https://nginx.org/en/docs/http/websocket.html)
- [前端进阶之旅](https://interview.poetries.top)
