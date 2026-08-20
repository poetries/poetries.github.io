---
title: 大文件上传实战，Node.js 分片上传断点续传与秒传完整落地
date: 2024-10-05 14:40:12
description: 从零实现大文件分片上传、断点续传与秒传，含前端切片与 Hash 计算、Node 端接收合并、Web Worker 与抽样 Hash 优化、并发控制，以及上线前 checklist。
tags:
- 大文件上传
- 分片上传
- 断点续传
- 秒传
- Node.js
- Web Worker
categories: Front-End
---

用户传一个 2GB 的培训视频，点了上传，进度条走到 80% 网络抖了一下，整个请求超时，回来得从 0 重传。运维那边还会顺带告诉你 Nginx 的 `client_max_body_size` 被打爆了，网关日志里全是 413。这类问题单靠调大超时时间和请求体上限是解决不了的，得换一套上传姿势。

这篇把分片上传、断点续传、秒传这三件事从原理到代码完整走一遍，前端切片和 Hash 计算、Node 端接收与合并、Web Worker 和抽样 Hash 优化、并发控制，最后附一份上线前的 checklist 和面试速答版，照着做能直接落到项目里。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 分片上传、断点续传、秒传三者的关系和各自的代价
- 一张图看清浏览器和 Node 服务端之间的四次交互
- `File` / `Blob.slice` / `FileReader` / `FormData` 这几个 API 在链路里各干什么
- 前端切片与 `spark-md5` 计算文件指纹的完整实现，以及内存上的坑
- Node 端接收分片、校验状态、流式合并的实现，含几个容易写错的地方
- Web Worker、抽样 Hash、并发控制、失败重试四种优化手段
- 上线前的安全与稳定性 checklist
- 面试里怎么用两分钟把这套方案讲清楚

## 一、三个概念和它们之间的关系

先把名词捋清楚，这三件事是层层递进的，不是三个平行选项。

**分片上传**是地基。把一个大文件按固定大小切成若干个 Chunk，每个 Chunk 单独发一个 HTTP 请求，服务端收齐之后再拼回完整文件。

![大文件分片上传示意，一个大文件被切成多个 chunk 分别发送到服务端后合并](https://s.poetries.top/uploads/2026/03/b67367eefca01a72.png)

切开之后立刻带来三个好处。单个请求体从 2GB 变成 1MB，超时和 413 的问题直接消失。多个分片可以并行发，带宽利用率上去了。服务端不用把整个文件读进内存，内存曲线平了。

**断点续传**是建在分片之上的。既然文件已经是一片一片传的，服务端就能记住「哪几片收到了」。客户端每次上传前先问一句「这个文件传到哪了」，服务端返回还缺哪几片，客户端只补那几片就行。

**秒传**是断点续传的极端情况。如果服务端发现这个文件已经完整存在了，那一片都不用传，直接返回成功。实现秒传的前提是能给文件算出一个稳定的唯一标识，通常用 MD5 之类的 Hash 算法生成文件指纹。

所以这三件事共用同一套基础设施，那就是「切片 + 文件指纹」。指纹算出来了，秒传和断点续传就都是顺手的事。

## 二、整体链路，浏览器和服务端聊四次

在写代码之前，先把整条链路的交互顺序画出来，后面每一节都是在填这张图里的某一格：

```
┌──────────────┐                                     ┌──────────────┐
│   浏览器      │                                     │  Node 服务端  │
└──────┬───────┘                                     └──────┬───────┘
       │ ① File.slice 切片 + spark-md5 算 fileHash          │
       │    （大文件放 Web Worker，别卡主线程）              │
       │                                                     │
       │ ② POST /verify  { fileHash, totalCount, extname }   │
       ├────────────────────────────────────────────────────►│
       │                                                     │ 查
       │ ◄────────────────────────────────────────────────── │ chunkFile/<hash>/
       │    neededFileList = []        → 秒传，直接结束       │
       │    neededFileList = [3,7,9]   → 断点续传，只补 3 片  │
       │    neededFileList = [1..N]    → 全量上传             │
       │                                                     │
       │ ③ POST /upload  FormData(chunk,index,hash)  × N     │
       ├════════════════════════════════════════════════════►│ 落盘
       │      并发受控 · 单片失败单片重试 · 更新进度条         │ chunk-<index>
       │                                                     │
       │ ④ POST /merge   { fileHash, extname }               │
       ├────────────────────────────────────────────────────►│ 按索引排序
       │ ◄────────────────────────────────────────────────── │ 流式拼接
       │                  { ok, url }                        │ 删分片目录
```

四次交互里，第二次是整套方案的大脑。秒传、断点续传、全量上传三条分支全靠它的返回值决定，前端只需要照着 `neededFileList` 干活。

## 三、动手前要先认识四个浏览器 API

### 3.1 File 对象

`File` 是一种特殊的 `Blob`，从 `<input type="file">` 或者拖拽事件里拿到，带着这几个只读属性：

| 属性 | 描述 |
|------|------|
| `File.name` | 文件名 |
| `File.size` | 文件大小（字节） |
| `File.type` | 文件 MIME 类型 |
| `File.lastModified` | 最后修改时间 |

这里有个坑要注意，`File.type` 是浏览器根据扩展名猜的，不可信。真要做类型校验得读文件头的 magic number，光看 `type` 很容易被改后缀绕过。

### 3.2 Blob.slice 做切片

切片靠的就是 `Blob.slice(start, end)`，它返回一个新的 `Blob`，指向原文件的一段区间。

```javascript
const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
const chunk = blobSlice.call(file, start, end); // 返回指定范围的 Blob
```

`mozSlice` 和 `webkitSlice` 是很老的前缀写法，现在的浏览器都支持标准的 `File.prototype.slice`，这段兼容代码留着没坏处，但新项目直接写 `file.slice(start, end)` 就够了。

`slice` 有一个特别关键的性质，它是惰性的，不会真的把那段数据读进内存，只是记了一个偏移量。后面讲内存优化的时候会用到这一点。

### 3.3 FileReader 读取内容

要算 Hash 就得拿到二进制内容，这一步靠 `FileReader`：

```javascript
const fileReader = new FileReader();
fileReader.readAsArrayBuffer(blob); // 读取为 ArrayBuffer
fileReader.onload = (e) => {
  console.log(e.target.result); // 读取结果
};
```

`FileReader` 是回调式的老 API。现在 `Blob` 上直接有 `arrayBuffer()` 方法返回 Promise，写起来清爽得多，配合 `for await` 循环读分片会比回调链好维护。老代码里的 `FileReader` 不用急着改，但新写的建议直接用 `await blob.arrayBuffer()`。

### 3.4 FormData 组装请求

分片上传走 `multipart/form-data`，前端用 `FormData` 组装：

```javascript
const formData = new FormData();
formData.append('chunk', new Blob([chunkData])); // 文件分片
formData.append('index', 1); // 分片索引
formData.append('fileHash', 'xxx'); // 文件哈希
```

注意别自己手动设 `Content-Type`。传 `FormData` 时浏览器会自动带上带 boundary 的 `Content-Type`，你手写一个反而会把 boundary 弄丢，服务端解析直接失败。这个我踩过，排查方向很容易跑偏到后端去。

## 四、Step 1 前端切片并计算文件指纹

第一步要同时产出两样东西，分片列表和文件 Hash。因为算 Hash 本来就要把文件整个读一遍，顺手就把分片攒出来了。

```javascript
import SparkMD5 from 'spark-md5';

/**
 * 将目标文件分片并计算文件 Hash
 * @param {File} targetFile 目标上传文件
 * @param {number} baseChunkSize 分片大小（单位 MB）
 * @returns {chunkList: ArrayBuffer[], fileHash: string}
 */
async function sliceFile(targetFile, baseChunkSize = 1) {
  return new Promise((resolve, reject) => {
    // 兼容不同浏览器的分片方法
    const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;

    const chunkSize = baseChunkSize * 1024 * 1024;
    const targetChunkCount = Math.ceil(targetFile.size / chunkSize);
    let currentChunkCount = 0;
    const chunkList = [];

    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      const curChunk = e.target.result;
      spark.append(curChunk); // 追加到 Hash 计算
      currentChunkCount++;
      chunkList.push(curChunk);

      if (currentChunkCount >= targetChunkCount) {
        // 全部读取完成，获取文件 Hash
        const fileHash = spark.end();
        resolve({ chunkList, fileHash });
      } else {
        loadNext();
      }
    };

    fileReader.onerror = () => reject(null);

    const loadNext = () => {
      const start = chunkSize * currentChunkCount;
      const end = Math.min(start + chunkSize, targetFile.size);
      fileReader.readAsArrayBuffer(blobSlice.call(targetFile, start, end));
    };

    loadNext();
  });
}
```

这段代码是串行读的，一片读完在 `onload` 里触发下一片。串行是必须的，因为 `spark.append()` 的调用顺序决定了最终 Hash 值，乱序算出来的指纹每次都不一样，秒传立刻就废了。

`SparkMD5.ArrayBuffer` 这个类的价值就在这里，它支持增量计算。你可以喂它一片一片的数据，最后调 `end()` 拿结果，全程不需要把整个文件驻留在内存里。浏览器原生的 `crypto.subtle.digest()` 只接受一次性的完整数据，做不到流式，这也是大文件场景下大家还在用 `spark-md5` 的原因。

不过这版实现有个明显的内存问题。

`chunkList.push(curChunk)` 把每一片的 `ArrayBuffer` 都留下来了，一个 2GB 的文件读完，内存里就实实在在躺着 2GB 数据，标签页多半会崩。更省内存的做法是只记录偏移量，真正要发请求时再用 `file.slice(start, end)` 现切。前面说过 `slice` 是惰性的，切出来的 `Blob` 几乎不占内存，浏览器会在发请求时按需从磁盘读。

```javascript
// 只存区间，不存数据
function buildChunkRanges(file, baseChunkSize = 1) {
  const chunkSize = baseChunkSize * 1024 * 1024;
  const count = Math.ceil(file.size / chunkSize);
  return Array.from({ length: count }, (_, i) => ({
    index: i + 1,
    start: i * chunkSize,
    end: Math.min((i + 1) * chunkSize, file.size),
  }));
}

// 上传时才真正取数据
const { start, end } = ranges[i];
formData.append('chunk', file.slice(start, end));
```

上面那种把 `chunkList` 全存下来的写法，在几十 MB 的文件上完全没问题，也更好理解，所以下面的示例仍然沿用它。真上大文件的时候记得换成区间版。

## 五、Step 2 上传前先问一句服务端

拿到 `fileHash` 之后，别急着发分片，先打一次 `/verify`。这个请求决定了后面走哪条分支：

```javascript
async function uploadFile(file, baseChunkSize, uploadUrl, verifyUrl, mergeUrl, progressCallback) {
  // 1. 分片并计算 Hash
  const { chunkList, fileHash } = await sliceFile(file, baseChunkSize);

  let neededChunkList = [];
  let progress = 0;

  // 2. 验证文件上传状态
  if (verifyUrl) {
    const { data } = await requestInstance.post(verifyUrl, {
      fileHash,
      totalCount: chunkList.length,
      extname: '.' + file.name.split('.').pop(),
    });

    const { neededFileList, message } = data;

    // 秒传成功
    if (!neededFileList.length) {
      progressCallback(100);
      return;
    }

    neededChunkList = neededFileList;
  }

  // 3. 计算断点续传的初始进度
  progress = ((chunkList.length - neededChunkList.length) / chunkList.length) * 100;
  // ...后面接第 3 步上传
}
```

第 3 行那个初始进度算得很讲究。断点续传时已经有一部分片在服务端了，进度条要直接从 60% 起跳，而不是从 0 开始慢慢爬。用户看到「接着上次传」的反馈，比看到一个从头开始的进度条要安心得多。

`totalCount` 和 `extname` 也要一起传过去。前者让服务端知道完整文件应该有几片，后者决定合并后的文件叫什么名字。

## 六、Step 3 发分片并更新进度

```javascript
  // 4. 上传分片
  if (chunkList.length) {
    const requestList = chunkList.map(async (chunk, index) => {
      if (neededChunkList.includes(index + 1)) {
        await uploadChunk(chunk, index + 1, fileHash, uploadUrl);

        // 更新进度
        progress += Math.ceil(100 / chunkList.length);
        if (progress >= 100) progress = 100;
        progressCallback(progress);
      }
    });

    Promise.all(requestList).then(() => {
      // 5. 通知服务端合并分片
      requestInstance.post(mergeUrl, {
        fileHash,
        extname: '.mp4'
      });
    });
  }

/**
 * 上传单个分片
 */
async function uploadChunk(chunk, index, fileHash, uploadUrl) {
  const formData = new FormData();
  // ArrayBuffer 需要转为 Blob
  formData.append('chunk', new Blob([chunk]));
  formData.append('index', index);
  formData.append('fileHash', fileHash);
  return requestInstance.post(uploadUrl, formData);
}
```

分片索引从 1 开始，所以判断和上传都用的 `index + 1`。这个约定要和服务端保持一致，服务端存的文件名是 `chunk-1`、`chunk-2`，两边差一位就会出现「明明传完了服务端说还缺一片」的怪事。

这段代码有三处需要在上生产前改掉，我按严重程度排一下。

最严重的是 `extname: '.mp4'` 写死了。`/verify` 时传的是真实扩展名，`/merge` 时传的是 `.mp4`，服务端合并出来的文件名和秒传检查的文件名对不上，下次传同一个 png 永远命不中秒传。这个字段应该从外面传进来，和 `/verify` 用同一个值。

其次是进度的累加方式。`Math.ceil(100 / chunkList.length)` 每片都向上取整，100 片的文件每片加 1，最后正好；但 30 片的文件每片加 4，到第 25 片就满 100 了，剩下 5 片传完了进度条早就不动了。更稳的做法是维护一个「已完成片数」的计数器，进度用 `done / total * 100` 现算。

第三是 `map` 里直接发起了全部请求。`Promise.all` 只是等它们结束，并不限制同时在飞的请求数，1000 片的文件会瞬间发出上千个请求，浏览器排队、服务端连接数、带宽全被打满。并发控制放在第八节讲。

## 七、Step 4 服务端接收、校验与合并

### 7.1 接收分片

服务端做的事情很朴素，按 `fileHash` 建一个目录，把每一片按索引命名存进去：

```javascript
const fs = require('fs');
const path = require('path');

uploadChunk(chunk, chunkInfo) {
  const { fileHash, index } = chunkInfo;
  const dirPath = path.join(__dirname, 'uploadedFiles/chunkFile', fileHash);
  const chunkPath = path.join(dirPath, `chunk-${index}`);

  // 检查文件夹是否存在
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // 检查分片是否已存在
  if (fs.existsSync(chunkPath)) {
    return;
  }

  // 写入分片文件
  fs.writeFileSync(chunkPath, chunk.buffer);
}
```

「分片已存在就直接返回」这一句让整个接口天然幂等，前端重试重复片不会写坏数据，这一点在弱网下非常重要。

这里有个安全问题必须处理。`fileHash` 是前端传来的，直接拼进 `path.join` 就是一条路径穿越漏洞，构造一个 `../../etc` 之类的值就能写到目录外面去。上线前一定要加格式校验：

```javascript
const HASH_RE = /^[a-f0-9]{32}$/i;   // MD5 是 32 位十六进制
if (!HASH_RE.test(fileHash)) throw new Error('invalid fileHash');
if (!Number.isInteger(+index) || +index < 1) throw new Error('invalid index');
```

同样的道理，`extname` 也要走白名单，不能让人传一个 `.js` 或者 `.php` 上来。

### 7.2 校验上传状态

这是第二次交互的服务端实现，它要在三种情况里做判断：

```javascript
async function verifyFile(fileHash, totalCount, extname) {
  const dirPath = path.join(__dirname, 'uploadedFiles/chunkFile', fileHash);
  const filePath = path.join(dirPath, fileHash + extname);

  // 完整数组：[1, 2, 3, 4, 5...]
  let res = Array(totalCount).fill(0).map((_, index) => index + 1);

  try {
    // 检查完整文件是否存在 → 秒传
    fs.statSync(filePath);
    return { neededFileList: [], message: '上传成功（秒传）' };
  } catch (fileError) {
    try {
      // 检查分片目录
      const files = fs.readdirSync(dirPath);
      if (files.length < totalCount) {
        // 计算待上传的分片
        res = res.filter(fileIndex => {
          return !files.includes(`chunk-${fileIndex}`);
        });
        return { neededFileList: res }; // 断点续传
      } else {
        // 分片完整，进行合并
        await this.mergeFile(fileHash, extname);
        return { neededFileList: [], message: '上传成功' };
      }
    } catch (dirError) {
      // 目录不存在，需要全部上传
      return { neededFileList: res };
    }
  }
}
```

三条分支对应三种状态，完整文件存在就是秒传，分片目录不全就是断点续传，目录都没有就是全新上传。用异常来做控制流不算优雅，换成 `fs.existsSync` 或者 `fs.promises.access` 会更好读，但逻辑是对的。

有一点要留意，`files.length < totalCount` 这个判断在分片目录里混进了别的文件时会失准。下一节合并的实现恰好就会往这个目录里写完整文件，所以更稳的写法是先过滤出 `chunk-` 开头的项再比数量。

### 7.3 流式合并分片

合并是最后一步，也是最容易写出内存问题的一步：

```javascript
async function mergeFile(fileHash, extname) {
  const dirPath = path.join(__dirname, 'uploadedFiles/chunkFile', fileHash);
  const fullPath = path.join(dirPath, fileHash + extname);

  const writeStream = fs.createWriteStream(fullPath);
  let files = fs.readdirSync(dirPath);

  // 按分片索引排序
  files.sort((a, b) => {
    const indexA = parseInt(a.split('-').pop());
    const indexB = parseInt(b.split('-').pop());
    return indexA - indexB;
  });

  // 按顺序合并
  for (const filename of files) {
    const curFilePath = path.join(dirPath, filename);
    const readStream = fs.createReadStream(curFilePath);

    await new Promise((resolve, reject) => {
      readStream.pipe(writeStream, { end: false });
      readStream.on('end', resolve);
      readStream.on('error', reject);
    });
  }

  writeStream.end();

  // 删除分片目录
  fs.rmdirSync(dirPath, { recursive: true });

  return '合并完成';
}
```

核心手法是 `pipe(writeStream, { end: false })`。`end: false` 让每个读流结束时不要关掉写流，等所有分片都拼完再手动 `writeStream.end()`。整个过程数据是流过去的，内存里只有 64KB 级别的 buffer，多大的文件都不会撑爆进程。这个设计是真的舒服。

那为什么不能直接 `Buffer.concat` 呢？因为那等于把整个文件读进内存，2GB 文件直接触发 Node 的堆上限。

这段代码有三处建议改掉。

第一处，`createWriteStream(fullPath)` 会立刻在 `dirPath` 下创建那个完整文件，紧接着的 `readdirSync(dirPath)` 就把它也读进 `files` 了。`parseInt('a1b2c3-....mp4'.split('-').pop())` 大概率是 `NaN`，排序结果不可控，甚至可能把自己拼进自己。安全的做法是合并产物写到分片目录之外，并且只挑 `chunk-` 前缀的文件：

```javascript
const chunkFiles = fs.readdirSync(dirPath)
  .filter(name => name.startsWith('chunk-'))
  .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)));
```

第二处，`writeStream.end()` 之后应该等 `finish` 事件再返回，否则调用方拿到「合并完成」时数据可能还没落盘：

```javascript
await new Promise((resolve, reject) => {
  writeStream.on('finish', resolve);
  writeStream.on('error', reject);
  writeStream.end();
});
```

第三处，`fs.rmdirSync(dir, { recursive: true })` 在 Node 14.14 之后已经废弃，Node 16 开始会打弃用警告。换成 `fs.rmSync(dir, { recursive: true, force: true })` 就行，语义一样还更宽容。

## 八、性能优化的四个方向

![大文件上传完整流程图，从选择文件、分片计算 Hash、验证状态到分片上传与合并](https://cdn.nlark.com/yuque/0/2024/png/207857/1728637248107-179bf62b-b82b-4430-9d6f-6654eabc948a.png)

### 8.1 Web Worker，把 Hash 计算挪出主线程

文件一大，`spark-md5` 的计算会实打实地占住主线程，页面卡到点不动。Web Worker 能把这段计算放到后台线程去：

```javascript
// 主线程
async function uploadFile(file, baseChunkSize, ...) {
  // 创建 Worker
  const worker = new Worker(new URL('./sliceFileWorker.js', import.meta.url), {
    type: 'module'
  });

  worker.postMessage({ targetFile: file, baseChunkSize });

  worker.onmessage = async (e) => {
    const { chunkList, fileHash } = e.data;
    // 后续上传逻辑...
  };
}
```

```javascript
// sliceFileWorker.js
self.onmessage = async (e) => {
  const { targetFile, baseChunkSize } = e.data;
  const { chunkList, fileHash } = await sliceFile(targetFile, baseChunkSize);
  self.postMessage({ chunkList, fileHash });
};
```

`File` 对象是可结构化克隆的，直接 `postMessage` 传进去没问题，而且传的是引用语义的文件句柄，不会真的复制文件内容。

回传就不一样了。`postMessage({ chunkList })` 里的 `ArrayBuffer` 会被完整复制一份，等于内存又翻了一倍。如果一定要把数据传回主线程，记得用 Transferable 做所有权转移，或者干脆只回传 `fileHash`，分片让主线程自己 `slice`：

```javascript
// 只把 hash 传回去，避免复制整个文件的数据
self.postMessage({ fileHash });
// 若必须传 buffer，用 transfer list 转移所有权
// self.postMessage({ chunkList }, chunkList);
```

### 8.2 抽样 Hash，用一点碰撞概率换速度

即便放进了 Worker，几 GB 的文件算全量 MD5 依然要等很久，用户盯着一个「计算中」的转圈也是很差的体验。抽样 Hash 的思路是不读全部数据，只挑几个位置算：

- 第一个分片整片参与计算
- 中间每个分片只取首尾各一小段
- 最后一个分片整片参与计算

![抽样 Hash 策略示意，首片全取、中间片取首尾片段、尾片全取后拼接计算](https://cdn.nlark.com/yuque/0/2024/png/207857/1728636569044-963d0117-d76b-4ee0-a5e7-7e3f73937aeb.png)

代价是碰撞概率变高。两个文件如果首尾和采样点都一样、只有中间某段不同，抽样 Hash 会认为它们是同一个文件，秒传就传错了。

要不要用，取决于业务能不能承受这个风险。我的做法是分级处理，小于 500MB 走全量 Hash 保证准确，超过就走抽样，同时把 `file.size` 和 `lastModified` 一起并进指纹，进一步降低碰撞的可能。这块我只在自己的 demo 里对比过耗时，没有在大规模线上流量下验证过误判率，真上核心业务前建议自己压一轮。

### 8.3 并发控制，别一次把请求全发出去

先看一版流传比较广的并发控制实现：

```javascript
// 控制并发数为 3
async function uploadWithConcurrency(chunks, concurrency = 3) {
  const results = [];
  const executing = [];

  for (const chunk of chunks) {
    const promise = uploadChunk(chunk);
    results.push(promise);

    if (chunks.length >= concurrency) {
      const executingPromise = promise.then(() => {
        executing.splice(executing.indexOf(executingPromise), 1);
      });
      executing.push(executingPromise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(results);
}
```

思路是对的，用 `Promise.race` 等最快的那个结束再放新的进来。但 `if (chunks.length >= concurrency)` 这个判断写歪了，它比的是总数而不是当前在飞的数量，总数小于并发数时就完全不入池了。下面这版逻辑更直白，也更好排查：

```javascript
async function runWithLimit(tasks, limit = 4) {
  const results = new Array(tasks.length);
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const i = cursor++;
      results[i] = await tasks[i]();
    }
  }

  // 起 limit 个消费者，一起从同一个游标上取任务
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

// 用法：tasks 是一组返回 Promise 的函数
await runWithLimit(ranges.map(r => () => uploadChunk(r)), 4);
```

并发数取多少？浏览器对同域名的 HTTP/1.1 并发连接本来就限制在 6 个左右，再往上加没意义。我一般设 3 到 6，弱网环境往下调，内网环境可以往上试。

### 8.4 失败重试

分片上传天生适合重试，一片失败只重传这一片，其他片不受影响。重试要带指数退避，别失败了立刻重发，弱网下只会雪上加霜：

```javascript
async function uploadChunkWithRetry(task, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await task();
    } catch (err) {
      if (i === retries) throw err;
      // 退避：1s、2s、4s
      await new Promise(r => setTimeout(r, 2 ** i * 1000));
    }
  }
}
```

配合服务端「分片已存在直接返回」的幂等实现，重试是完全安全的。

## 九、方案对比与选择建议

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **普通上传** | 实现简单 | 大文件易超时、内存占用高 | 小文件（< 10MB） |
| **分片上传** | 支持断点续传、减少内存占用 | 实现复杂、服务器存储分片 | 大文件上传 |
| **秒传** | 重复文件极速上传 | 需要存储文件 Hash | 允许重复上传的场景 |
| **Web Worker** | 不阻塞主线程 | 增加复杂度 | 超大文件 |
| **抽样 Hash** | 计算速度快 | 碰撞概率略高 | 超大文件优化 |
| **CDN 加速** | 上传速度快 | 成本较高 | 面向全国用户 |

按文件体量对号入座，大致是这个梯度。小于 10MB 直接普通上传，写一堆分片逻辑纯属自找麻烦。10MB 到 100MB 上分片加断点续传就够了。超过 100MB 再叠上秒传和 Web Worker。超过 1GB 才需要考虑抽样 Hash 和精细的并发控制。

除了体量，还有四件事在设计阶段就要想好。分片会在服务器上产生海量小文件，得有定时清理任务，不然 inode 迟早被耗光。安全上要有配额，不能让人随便传个 100GB 把磁盘打满。用户体验上要有进度、要有错误提示、要能自动重试。弱网场景要考虑把分片调小并延长重试次数。

顺带一提，文件的另一半是下载，需求场景和这篇正好互补，可以配合看这篇：[前端文件下载的几种方案](https://feinterview.poetries.top/blog/frontend-file-download-solutions)。

## 十、上线前 checklist

写完功能不等于能上线，这几条挨个过一遍再发版：

- [ ] `fileHash` 做正则校验（限定十六进制定长），杜绝路径穿越
- [ ] `index` 校验为正整数，`extname` 走扩展名白名单
- [ ] 单文件分片总数设上限，防止有人用 1 字节分片刷爆 inode
- [ ] 上传接口有鉴权，并对单用户设置存储配额和速率限制
- [ ] 分片大小按场景定，公网 1MB 起步，弱网调到 512KB
- [ ] 并发数控制在 3 到 6，不要用裸的 `Promise.all`
- [ ] 单片失败按指数退避重试，最多 3 次，服务端写入保持幂等
- [ ] `/merge` 前校验分片数量和每片大小，缺片直接拒绝
- [ ] 合并走流式 `pipe`，不用 `readFileSync` 或 `Buffer.concat`
- [ ] 合并产物写到分片目录之外，读目录时只挑 `chunk-` 前缀
- [ ] `writeStream` 等 `finish` 事件再返回成功
- [ ] `fs.rmdirSync` 换成 `fs.rmSync(dir, { recursive: true, force: true })`
- [ ] 有定时任务清理超过 24 小时未完成的分片目录
- [ ] Nginx `client_max_body_size` 大于单片大小加冗余
- [ ] 前端把整份 `chunkList` 换成偏移量列表，避免整个文件驻留内存
- [ ] `/merge` 传的 `extname` 和 `/verify` 保持同一个值

## 十一、面试怎么答

这个题在中高级前端面试里出现频率很高，下面是一份能在两分钟内讲完的版本。

一句话概括，大文件上传通常采用分片上传加断点续传加秒传的组合，前端把文件切片并行上传，服务端存分片再合并成完整文件，通过文件 Hash 作为唯一标识来支撑断点续传和秒传。

核心流程四步：

```
1. 前端：File.slice() 分片 + spark-md5 计算文件 Hash
2. 前端：发送验证请求，询问服务端文件上传状态
3. 服务端返回状态：
   - 文件已存在 → 秒传成功
   - 部分分片存在 → 断点续传（只传剩余分片）
   - 文件不存在 → 全部上传
4. 所有分片上传完成后，通知服务端合并
```

关键实现记住三段代码就够了。前端分片：

```javascript
// Blob.slice 分片，FileReader 读取，spark-md5 计算 Hash
const chunk = file.slice(start, end)  // 分片
fileReader.readAsArrayBuffer(chunk)     // 读取
spark.append(chunk)                     // 累加 Hash
```

上传请求：

```javascript
// FormData 格式，包含分片内容、索引、文件 Hash
formData.append('chunk', new Blob([chunk]))
formData.append('index', 1)
formData.append('fileHash', 'abc123')
```

后端合并：

```javascript
// 按索引排序，用流管道按顺序写入
files.sort((a, b) => a.index - b.index)
for (const file of files) {
  readStream.pipe(writeStream, { end: false })
}
```

下面是几个高频追问和我的答法。

**大文件上传如何实现断点续传？**核心是服务端记住已收到的分片。每次上传前先问一次「这个文件传了多少」，服务端返回缺失的分片索引，前端只补这些。前提是文件指纹稳定，同一个文件两次算出来的 Hash 必须一样。

**怎么保证文件唯一性？**用 MD5 之类的 Hash 算法算文件指纹。上传前拿指纹问服务端有没有这个文件，有就直接返回成功，这就是秒传。

**Hash 计算太慢怎么办？**两条路。放进 Web Worker 用后台线程算，不卡主线程；或者用抽样 Hash 只算首片、中间片首尾、尾片，牺牲一点准确性换速度。我一般按文件大小分级，小文件走全量，大文件走抽样。

**分片大小怎么选？**一般 1MB 到 5MB。太小请求数暴涨，HTTP 头和 TCP 握手的开销占比就上来了；太大则断点续传的粒度变粗，断一次要重传的量变多。

**上传失败怎么处理？**单片失败单片重试，带指数退避，服务端写入做成幂等，重复的分片直接跳过。整体不用重来。

**为什么用 spark-md5 不用 crypto.subtle？**`spark-md5` 支持增量计算，可以一片一片喂数据；`crypto.subtle.digest` 只接受完整数据，大文件必须整个读进内存才能算。

**并发数为什么不能无限大？**浏览器对同域名的并发连接本身就有限制，请求再多也只是排队；同时服务端连接数和带宽也是有限的，并发过高反而会让整体耗时变长。

## 总结

这套方案能跑起来，靠的是「切片 + 文件指纹」这两块基础设施。切片解决了单请求过大的问题，指纹让服务端有能力判断「这个文件我见过没有、传了多少」，秒传和断点续传都是顺着这两点自然长出来的。

代码层面有几个地方值得重点盯。前端别把所有分片的 `ArrayBuffer` 都留在内存里，改成偏移量列表按需 `slice`。进度用「已完成片数除以总片数」现算，别用累加取整。并发用游标加固定数量的消费者控制在 3 到 6。服务端的 `fileHash` 必须做格式校验，合并必须走流式 `pipe` 并把产物写到分片目录之外，`writeStream` 要等 `finish` 再返回。

优化手段按需要叠加就好。Web Worker 解决 Hash 卡主线程，抽样 Hash 解决超大文件计算太慢，指数退避重试解决弱网抖动。它们各自都有代价，别一上来全堆上去。

真到了 GB 级别、并发又高的业务，比起自己维护一套分片服务，直接接对象存储的分片上传 SDK 往往更划算。但把这套原理自己走一遍是值得的，接 SDK 时你会知道每个参数在管什么。

## 参考

- [MDN - File](https://developer.mozilla.org/zh-CN/docs/Web/API/File)
- [MDN - Blob.slice()](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob/slice)
- [MDN - FileReader](https://developer.mozilla.org/zh-CN/docs/Web/API/FileReader)
- [MDN - 使用 Web Workers](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Using_web_workers)
- [MDN - FormData](https://developer.mozilla.org/zh-CN/docs/Web/API/FormData)
- [spark-md5 源码仓库](https://github.com/satazor/js-spark-md5)
- [Node.js fs 模块文档](https://nodejs.org/api/fs.html)
- [Node.js Stream pipe 文档](https://nodejs.org/api/stream.html#readablepipedestination-options)
- [前端进阶之旅](https://interview.poetries.top)
