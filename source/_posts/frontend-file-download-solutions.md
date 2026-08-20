---
title: 前端文件下载完全指南 12 种方案对比与实战代码
date: 2023-06-08 14:40:12
description: 前端文件下载的 12 种实现方式全整理，含 a 标签、location.href、fetch/axios + Blob、XHR 进度监听、Canvas 与 CSV 生成、iframe 表单提交、分片与流式下载，配完整代码、跨域限制说明和选型对比表。
tags:
- JavaScript
- 文件下载
- 前端开发
- Blob
- axios
- 浏览器
categories: Front-End
---

前端做下载，最容易翻车的往往不是「下不下来」，而是那些细节：接口要带 `token`，一个 `a` 标签直接甩过去就丢了鉴权；后端返回的是二进制流，浏览器却直接把乱码渲染在页面上；导出的 `CSV` 用 `Excel` 打开中文全是问号；文件五百兆，用户点完之后页面卡死好几秒才开始下。

这些坑我基本都撞过一遍。这篇把前端下载的十二种做法整理成一份可以照抄的清单，但更重要的是先讲清楚**浏览器凭什么决定「下载」还是「打开」**，把这个搞明白了，选方案就不是背代码了。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 浏览器到底是根据什么决定下载还是预览的，`download` 属性和 `Content-Disposition` 谁说了算
- `a` 标签、`location.href`、`window.open` 三种基础方案各自的边界在哪
- 接口返回二进制流时，`fetch + Blob` 和 `axios + Blob` 怎么写才不出问题
- 想要进度条为什么只能用 `XMLHttpRequest` 或 `axios` 的进度事件
- 前端自己生成文件（`Canvas` 图片、`JSON`、`CSV`）的完整写法和中文乱码的解法
- 分片下载和流式下载的真实适用边界，以及它们其实还没解决的问题
- 一张选型对比表，加上几个跨所有方案都会遇到的通用坑

## 一、先搞清楚是谁决定了「下载」

写代码之前先回答一个问题：同样是访问一个 `PDF` 链接，为什么有的直接在浏览器里打开预览，有的却弹出保存对话框？

决定权其实主要在**服务端的响应头** `Content-Disposition` 上。它是 `inline` 的时候浏览器倾向于内联展示，是 `attachment` 的时候浏览器就走下载流程，后面还能跟一个 `filename` 指定文件名。

前端能插手的地方只有两个。一个是 `a` 标签的 `download` 属性，它相当于前端这边说「不管你返回什么，我要下载并且叫这个名字」。另一个是把数据先取到内存里变成 `Blob`，再自己造一个 `blob:` 的 URL 去触发下载，这时候内容已经在你手上了，服务端说什么都不重要。

但 `download` 属性有个硬限制必须记住：**它只对同源 URL、`blob:` URL 和 `data:` URL 生效**。跨域链接上写 `download`，浏览器会直接无视这个属性，既不下载也不改名，行为退化成普通跳转。这是浏览器出于安全考虑的规定，不是 bug，也没有前端侧的绕法。

搞清楚这一条，后面所有方案的取舍就有了统一的判断依据：**下载链接是不是同源的，要不要带鉴权，要不要进度，文件有多大**。

## 二、基础方案

### 1. a 标签下载

最简单直接的下载方式，适合静态资源或可直接访问的 URL。

```js
// 基础下载 - 触发浏览器默认行为
const link = document.createElement('a')
link.href = 'https://example.com/file.pdf'
link.click()

// 带下载文件名 - 使用download属性
const link = document.createElement('a')
link.href = 'https://example.com/file.pdf'
link.download = '自定义文件名.pdf' // 告诉浏览器触发下载
document.body.appendChild(link)
link.click()
document.body.removeChild(link)

// 注意事项：download属性有跨域限制
// 仅适用于同源URL或 blob:、data: URL
```

第二段里那个 `appendChild` 再 `removeChild` 的动作，很多人觉得是多余的。它其实是历史包袱：早期 `Firefox` 要求 `a` 元素必须在文档树里，`click()` 才会生效，游离节点点了没反应。现在主流浏览器都不需要这一步了，但加上也不亏，兼容成本几乎为零。

**适用场景**：同源静态文件下载、可控服务器资源。

### 2. location.href 跳转

最简单的下载方式，浏览器会直接打开或下载目标资源。

```js
// 直接跳转下载
location.href = 'https://example.com/file.pdf'

// 优点：简单直接
// 缺点：会跳转当前页面，无法获取下载进度
```

这里有个很多人没注意的点：如果服务端返回的是 `Content-Disposition: attachment`，浏览器识别出这是个下载，**当前页面并不会真的跳走**，只是弹个下载条。但要是服务端没设这个头、返回的又是浏览器能渲染的类型，页面就真跳过去了，用户填了一半的表单全没。所以这个方案只在你能确定服务端行为的时候用。

**适用场景**：不关心下载状态、一次性下载。

### 3. window.open 打开

通过新窗口打开资源，适合浏览器直接支持预览的文件类型。

```js
// 新窗口打开下载
window.open('https://example.com/file.pdf', '_blank')

// 适用于PDF、图片等浏览器可直接预览的文件
```

它避免了上一个方案「跳走」的风险，代价是**容易被浏览器的弹窗拦截**。规则大致是：在用户手势（点击事件）的同步调用栈里执行不会被拦，但如果你把它放在 `await` 之后或者 `setTimeout` 里，就大概率被拦。所以「请求接口拿到地址再 `window.open`」这种写法是高危写法，用户会一脸懵地看到什么都没发生。

**适用场景**：需要浏览器预览的文件、需要在新标签页查看。

## 三、接口返回二进制流时怎么办

上面三种方案有个共同前提：URL 能被浏览器直接访问。可后台系统里的下载接口通常要带 `Authorization` 请求头，浏览器发起的导航请求根本带不上自定义 header，这时候就必须先用 `fetch` 或 `axios` 把数据取到内存里。

### 4. fetch + Blob

处理接口返回的二进制数据，灵活控制下载行为。

```js
// fetch下载文件（推荐方式）
async function downloadFile(url, filename) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('下载失败')

    // 获取Blob对象
    const blob = await response.blob()

    // 创建下载链接
    const blobUrl = URL.createObjectURL(blob)

    // 创建a标签触发下载
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()

    // 清理
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl) // 释放内存
  } catch (error) {
    console.error('下载失败:', error)
  }
}

// 使用
downloadFile('https://example.com/api/download', 'file.pdf')
```

这段是最通用的骨架，思路是「取回来变成 `Blob`，造一个 `blob:` URL，再用 `a` 标签点一下」。因为 `blob:` URL 天然同源，`download` 属性一定生效，跨域那个限制就绕过去了。

有个地方我要提醒一下：`URL.revokeObjectURL` 紧跟在 `click()` 后面同步调用，在部分浏览器上会把还没开始的下载给掐断。稳妥的写法是延迟一点再释放：

```js
link.click()
setTimeout(() => {
  document.body.removeChild(link)
  URL.revokeObjectURL(blobUrl)
}, 1000)
```

另一个坑更隐蔽。后端接口出错时，返回的可能是一个 `JSON` 错误对象而不是文件，但 `response.ok` 依然是 `true`（`HTTP 200`）。这时候上面的代码会老老实实把这段 `JSON` 存成一个 `.pdf` 文件给用户。稳妥做法是先看 `Content-Type`，是 `application/json` 就当错误处理：

```js
const contentType = response.headers.get('Content-Type') || ''
if (contentType.includes('application/json')) {
  const err = await response.json()
  throw new Error(err.message || '下载失败')
}
```

### 5. axios + Blob

类似 `fetch`，适合已有 `axios` 项目的场景，好处是能直接复用项目里配好的拦截器、`baseURL` 和 token 注入。

```js
import axios from 'axios'

async function downloadWithAxios(url, filename) {
  const response = await axios.get(url, {
    responseType: 'blob', // 关键：指定响应类型为blob
  })

  const blob = new Blob([response.data])
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// 带请求头的下载
async function downloadWithToken(url, filename) {
  const response = await axios.get(url, {
    responseType: 'blob',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const blob = new Blob([response.data])
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
```

`responseType: 'blob'` 这一行是命根子，忘了写的话 `axios` 会按文本解析二进制内容，存下来的文件必定损坏，而且过程中一声不吭。

用 `axios` 还有个额外收益，文件名可以从响应头里读，不用前端硬编码：

```js
const disposition = response.headers['content-disposition'] || ''
const match = /filename\*?=(?:UTF-8'')?["']?([^;"']+)/i.exec(disposition)
const filename = match ? decodeURIComponent(match[1]) : '下载文件'
```

但跨域场景下想读到这个头，服务端必须额外返回 `Access-Control-Expose-Headers: Content-Disposition`。默认情况下浏览器只把几个基础响应头暴露给 JS，`Content-Disposition` 不在其中。这个我排查过一次，前端代码怎么看都对，最后是后端加了一行配置解决的。

## 四、要进度条就得换 API

`fetch(...).blob()` 是个黑盒，你只能等它整个下完，中间什么都拿不到。所以只要产品要求进度条，方案就得换。

### 6. XMLHttpRequest 下载

可以获取下载进度，适合大文件或需要显示进度条的场景。

```js
function downloadWithProgress(url, filename, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)

    // 获取响应类型为blob
    xhr.responseType = 'blob'

    // 进度监听
    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress && onProgress(percent)
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = xhr.response
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = filename
        link.click()
        resolve()
      } else {
        reject(new Error('下载失败'))
      }
    }

    xhr.onerror = () => reject(new Error('网络错误'))
    xhr.send()
  })
}

// 使用 - 显示进度条
downloadWithProgress(
  'https://example.com/big-file.zip',
  'big-file.zip',
  (percent) => {
    console.log(`下载进度: ${percent}%`)
    // 更新UI进度条
    document.getElementById('progress').style.width = `${percent}%`
  }
)
```

`XMLHttpRequest` 这个 API 确实老，但在进度这件事上它至今没被完全替代。代码里那个 `event.lengthComputable` 判断不能省，它为 `false` 意味着这次响应没有可靠的总长度。

什么情况下会没有总长度呢？服务端用了 `Transfer-Encoding: chunked` 分块传输，或者启用了 `gzip` 压缩导致 `Content-Length` 和实际解压后的字节数对不上。这时候 `event.total` 是 0，算出来的百分比就是 `Infinity` 或 `NaN`。**大文件下载的进度条不准，八成就是这个原因**，得让后端把 `Content-Length` 补上。

### 7. axios + onDownloadProgress

`axios` 也支持进度监听，底层其实就是包了 `XMLHttpRequest`。

```js
import axios from 'axios'

async function downloadWithAxiosProgress(url, filename) {
  const response = await axios.get(url, {
    responseType: 'blob',
    onDownloadProgress: (progressEvent) => {
      const percent = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      )
      console.log(`下载进度: ${percent}%`)
    },
  })

  const blob = new Blob([response.data])
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
```

同样的问题在这里也存在，`progressEvent.total` 可能是 `undefined`，算出来是 `NaN`。写业务的时候记得兜一下：拿不到总长度就别显示百分比，改成显示已下载的字节数，或者干脆换成不确定态的进度动画。

## 五、前端自己造文件

前面几种都是「服务端给什么我存什么」。还有一类需求是文件压根不存在，需要前端现造，比如把 `Canvas` 上的图导出、把表格数据导成 `CSV`。

### 8. Base64 与 Canvas 图片下载

下载页面中已存在的 `Base64` 图片或 `canvas` 生成的图片。

```js
// Base64字符串下载
function downloadBase64(base64Data, filename, mimeType = 'image/png') {
  const link = document.createElement('a')
  link.href = base64Data
  link.download = filename
  link.click()
}

// Canvas图片下载
function downloadCanvasImage(canvasId, filename) {
  const canvas = document.getElementById(canvasId)
  // 转换为Base64
  const dataUrl = canvas.toDataURL('image/png')

  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}

// 从图片元素下载
function downloadImageElement(imgElement, filename) {
  const canvas = document.createElement('canvas')
  canvas.width = imgElement.naturalWidth
  canvas.height = imgElement.naturalHeight

  const ctx = canvas.getContext('2d')
  ctx.drawImage(imgElement, 0, 0)

  canvas.toBlob((blob) => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  })
}
```

这三个函数里，第三个是最容易出问题的那个。往 `canvas` 上画一张跨域图片之后，这张画布会被标记为**被污染**（tainted），再调 `toDataURL` 或 `toBlob` 会直接抛 `SecurityError`。

解法是给 `img` 加上 `crossOrigin="anonymous"`，同时服务端要返回 `Access-Control-Allow-Origin`。两个条件缺一不可，只加前端那个属性没用。海报生成、图表导出这类需求里，图片挂在 CDN 上的场景特别常见，记得提前跟运维确认 CDN 开了 CORS。

另外优先用 `toBlob` 而不是 `toDataURL`。`toDataURL` 返回的 `Base64` 字符串比原始二进制大约三分之一，一张高清大图能撑出几十兆的字符串，内存直接顶上去。

### 9. 纯文本 JSON 与 CSV 下载

```js
// 下载纯文本
function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// 下载JSON
function downloadJSON(data, filename) {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// 下载CSV
function downloadCSV(data, filename) {
  // data为二维数组
  const csvContent = data.map(row => row.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
```

`CSV` 这个函数拿到实际业务里跑，会立刻遇到两个经典问题。

第一个是**中文乱码**。明明写了 `charset=utf-8`，用 `Excel` 打开还是一堆问号。原因是 `Excel` 打开 `CSV` 时不看 `MIME` 里的编码声明，它靠文件开头的 BOM 来判断。解法是在内容前面拼一个 BOM 字符 `\uFEFF`：

```js
const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
```

这一个字符能省掉半天扯皮，我第一次遇到的时候还以为是后端数据的问题。

第二个是 `row.join(',')` 太天真。字段里只要含有逗号、双引号或者换行，整个 `CSV` 的列就会错位。按 `RFC 4180` 的规矩，这类字段要用双引号包起来，字段内部的双引号还要转义成两个：

```js
const escape = (v) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const csvContent = data.map(row => row.map(escape).join(',')).join('\n')
```

## 六、iframe 与表单提交

### 10. 隐藏 iframe 下载

适合不想创建 `a` 标签或需要更隐蔽下载的场景。

```js
// iframe下载
function downloadWithIframe(url, filename) {
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = url
  document.body.appendChild(iframe)

  // 清理
  setTimeout(() => {
    document.body.removeChild(iframe)
  }, 5000)
}

// 表单提交下载（适合POST请求）
function downloadWithForm(url, params) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = url
  form.style.display = 'none'

  // 添加参数
  Object.keys(params).forEach(key => {
    const input = document.createElement('input')
    input.name = key
    input.value = params[key]
    form.appendChild(input)
  })

  // 提交到隐藏的iframe
  const iframe = document.createElement('iframe')
  iframe.name = 'download-frame'
  iframe.style.display = 'none'
  form.target = 'download-frame'

  document.body.appendChild(form)
  document.body.appendChild(iframe)
  form.submit()

  // 清理
  setTimeout(() => {
    document.body.removeChild(form)
    document.body.removeChild(iframe)
  }, 5000)
}
```

`iframe` 这个方案有个前提条件必须说清楚：**它完全依赖服务端返回 `Content-Disposition: attachment`**。服务端不设这个头的话，文件会在 `iframe` 里被渲染出来，而 `iframe` 是隐藏的，用户看到的就是「点了没反应」。

表单提交这个变体，解决的是「参数太多，`GET` 的 URL 长度撑不住」的场景，比如带一堆筛选条件的报表导出。但它有个绕不过去的短板：**你没法知道下载成功还是失败**。服务端返回 500，用户也只是看到什么都没发生，前端拿不到任何回调。

所以我的建议是，这套写法只在必须 `POST` 且参数量大的历史场景里保留。新做的功能优先用 `axios` 发 `POST` 拿 `Blob`，成功失败都能感知，用户体验完全不是一个量级。

## 七、超大文件的两种做法

### 11. 大文件分片下载

处理超大文件，避免一次性加载导致内存溢出。

```js
class ChunkDownloader {
  constructor(url, filename, chunkSize = 1024 * 1024) {
    this.url = url
    this.filename = filename
    this.chunkSize = chunkSize
    this.chunks = []
  }

  async download(onProgress) {
    // 获取文件大小
    const headResponse = await fetch(this.url, { method: 'HEAD' })
    const fileSize = parseInt(headResponse.headers.get('content-length'))

    const chunksCount = Math.ceil(fileSize / this.chunkSize)

    // 分片下载
    for (let i = 0; i < chunksCount; i++) {
      const start = i * this.chunkSize
      const end = Math.min(start + this.chunkSize, fileSize)

      const response = await fetch(this.url, {
        headers: {
          Range: `bytes=${start}-${end - 1}`,
        },
      })

      const blob = await response.blob()
      this.chunks.push(blob)

      // 进度回调
      onProgress && onProgress(((i + 1) / chunksCount) * 100)
    }

    // 合并分片
    this.mergeChunks()
  }

  mergeChunks() {
    const blob = new Blob(this.chunks)
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = this.filename
    link.click()
  }
}

// 使用
const downloader = new ChunkDownloader(
  'https://example.com/big-video.mp4',
  'video.mp4'
)
downloader.download((percent) => {
  console.log(`下载进度: ${percent.toFixed(1)}%`)
})
```

这套代码能跑通有三个前置条件，缺一个都不行。服务端要支持 `Range` 请求（响应头里得有 `Accept-Ranges: bytes`，且能正确返回 `206 Partial Content`）；跨域场景下服务端要允许 `Range` 这个请求头并暴露 `Content-Range`；`HEAD` 请求要能拿到准确的 `content-length`。生产环境里第二条最容易漏，`CORS` 预检直接把 `Range` 头拦下来了。

它真正的价值其实不在「省内存」，而在**失败可重试**。一个 500M 的文件用普通方式下到 90% 断网，只能从头再来；分片之后哪一片失败重试哪一片，还能顺手加并发，把 `for` 循环换成分批的 `Promise.all` 就行。

顺带一提，上传方向的分片逻辑跟这套是镜像的，服务端还要额外处理合并和秒传，我在 [Node.js 大文件上传实践](https://feinterview.poetries.top/blog/large-file-upload-nodejs) 那篇里写过完整实现，两边可以对着看。

### 12. 流式下载

使用 `ReadableStream` 边下载边处理，适合真正的大型文件。

```js
async function streamDownload(url, filename) {
  const response = await fetch(url)
  if (!response.ok) throw new Error('下载失败')

  const reader = response.body.getReader()
  const contentLength = +response.headers.get('Content-Length')
  let receivedLength = 0
  const chunks = []

  while (true) {
    const { done, value } = await reader.read()

    if (done) break

    chunks.push(value)
    receivedLength += value.length

    const percent = ((receivedLength / contentLength) * 100).toFixed(1)
    console.log(`下载进度: ${percent}%`)
  }

  // 合并所有chunk
  const blob = new Blob(chunks)
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
```

这里要泼一盆冷水。这段代码常被叫做「流式下载」，但你仔细看 `chunks.push(value)` 这一行，**所有分块最后还是全都堆在内存里的**，只是拿到了更细的进度而已。一个 2G 的文件用这套下，内存峰值照样是 2G，在移动端和低配机器上一样会崩。

我一开始也以为它能解决内存问题，后来才想明白，瓶颈在于浏览器没给你一个「边收边往磁盘写」的口子。想做到真正的流式落盘，得用 `File System Access API` 的 `showSaveFilePicker`，先让用户选好保存位置拿到可写句柄，再把网络流直接 `pipeTo` 过去。这条路最大的问题是兼容性，`Safari` 和 `Firefox` 目前不支持这个 API，社区里 `StreamSaver.js` 那类库靠 `Service Worker` 做了兜底方案，但配置和 `HTTPS` 要求也不少。

所以实话实说：**浏览器端的真流式下载，到今天仍然没有一个各家都支持的标准解法**。超大文件更靠谱的做法还是让后端提供直链，交给浏览器原生的下载器去处理，它天然支持断点续传和落盘。

## 八、方案对比总结

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| a标签下载 | 简单、原生 | 无进度、跨域受限 | 同源静态文件 |
| location.href | 最简单 | 无法控制 | 简单跳转下载 |
| window.open | 不影响当前页 | 可能被弹窗拦截 | 需要预览的文件 |
| fetch + Blob | 灵活、可控 | 需要处理Blob | 接口文件下载 |
| axios + Blob | 适合已有项目 | 额外依赖 | 接口文件下载 |
| XMLHttpRequest | 可监听进度 | API较老 | 大文件下载 |
| Base64下载 | 简单 | 内存占用大 | 图片/Canvas |
| iframe / 表单 | 支持POST大参数 | 无法感知失败 | 历史报表导出 |
| 分片下载 | 可断点重试 | 需服务端支持Range | 超大文件 |
| 流式下载 | 进度更细 | 仍然全量占内存 | 需要细粒度进度 |

## 九、选型建议与几个通用的坑

选型上没那么复杂，按下面这个顺序判断基本不会错。

同源静态资源，`a` 标签加 `download`，一行搞定。接口返回文件且需要鉴权，`fetch` 或 `axios` 配 `responseType: 'blob'`，这是后台系统里出场率最高的一档。需要进度条，`XMLHttpRequest` 或 `axios` 的 `onDownloadProgress`。文件是前端现造的，`Canvas` 用 `toBlob`、表格用 `Blob` 加 BOM。文件特别大又要能重试，上分片；单纯特别大而没有重试要求，让后端给直链更省事。

除了各方案自己的坑，还有几条是跨方案通用的，单独拎出来。

**内存不是免费的**。凡是走 `Blob` 这条路的方案，文件都会完整驻留在内存里。桌面浏览器扛几百兆没问题，移动端尤其是 iOS 的 `Safari` 限制紧得多，超过一定体积会直接白屏。做移动端导出功能前先估一下量级。

**下载失败要有兜底提示**。前面提过 `HTTP 200` 也可能是错误 `JSON`，加上 `Content-Type` 判断这一步，别让用户拿到一个打不开的空文件还以为是自己电脑的问题。

**移动端 WebView 是另一个世界**。微信内置浏览器、各类 App 的 `WebView` 对 `blob:` URL 和 `download` 属性的支持参差不齐，同一套代码在系统浏览器里好好的，在 App 里点了没反应是常事。这块只能实机一个个试，没有通用解。

**文件名编码要处理**。从 `Content-Disposition` 里取文件名时，中文名一般是按 `RFC 5987` 编码成 `filename*=UTF-8''%E4%B8%AD%E6%96%87.pdf` 这种形式的，不 `decodeURIComponent` 一下用户看到的就是一串百分号。

## 总结

十二种方案听着多，实际选起来只看四个问题：**是不是同源、要不要带鉴权、要不要进度、文件有多大**。

同源又不需要鉴权，`a` 标签配 `download` 就是最优解，别为了「统一封装」把它也改成 `Blob`，白白多占一份内存。需要鉴权就必须走 `fetch` 或 `axios` 拿 `Blob`，这条路上记得补两件事：判断 `Content-Type` 防止把错误 `JSON` 存成文件，延迟 `revokeObjectURL` 防止下载被掐断。要进度就只能回到 `XMLHttpRequest` 这一系，同时接受 `Content-Length` 缺失时进度不准的现实。

至于超大文件，我的结论可能跟很多文章不一样：**分片和所谓的流式下载，都没有真正解决内存问题**，前者的价值在于可重试，后者只是进度更细。真要下几个 G 的东西，把直链交给浏览器原生下载器，比在 JS 里折腾靠谱得多。

最后那几条通用的坑，`CSV` 的 BOM、`Canvas` 的跨域污染、`Content-Disposition` 的暴露头，都是那种「不知道就要查半天，知道了就是一行代码」的东西，值得记在小本本上。

## 参考

- MDN：HTMLAnchorElement download 属性 <https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/a#download>
- MDN：URL.createObjectURL <https://developer.mozilla.org/zh-CN/docs/Web/API/URL/createObjectURL_static>
- MDN：Content-Disposition 响应头 <https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Disposition>
- MDN：使用 Fetch 读取流数据 <https://developer.mozilla.org/zh-CN/docs/Web/API/Streams_API/Using_readable_streams>
- MDN：File System Access API <https://developer.mozilla.org/en-US/docs/Web/API/File_System_API>
- RFC 4180 CSV 格式规范 <https://www.rfc-editor.org/rfc/rfc4180>
- [前端进阶之旅](https://interview.poetries.top)
