---
title: 前端文件下载完全指南：10+种方案对比与实战代码
date: 2023-06-08 14:40:12
description: 详细总结前端文件下载的12种方案，包括a标签、fetch、axios、iframe、流式下载、大文件分片等，附完整代码示例和适用场景分析。
tags:
- JavaScript
- 文件下载
- 前端开发
- Blob
- axios
categories: Front-End
---

在前端开发中，文件下载是极其常见的需求。从简单的图片下载到大型文件处理，从静态资源到动态接口数据，不同场景需要不同的实现方案。

本文将全面总结前端文件下载的各种实现方式，包括基础方案、进阶方案和高级方案，并给出完整的代码示例，帮助你根据具体场景选择最适合的实现方式。

## 一、基础下载方案

### 1. a标签下载

最简单直接的下载方式，适合静态资源或可直接访问的URL。

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

**适用场景**：同源静态文件下载、可控服务器资源

### 2. location.href 跳转

最简单的下载方式，浏览器会直接打开或下载目标资源。

```js
// 直接跳转下载
location.href = 'https://example.com/file.pdf'

// 优点：简单直接
// 缺点：会跳转当前页面，无法获取下载进度
```

**适用场景**：不关心下载状态、一次性下载

### 3. window.open 打开

通过新窗口打开资源，适合浏览器直接支持预览的文件类型。

```js
// 新窗口打开下载
window.open('https://example.com/file.pdf', '_blank')

// 适用于PDF、图片等浏览器可直接预览的文件
```

**适用场景**：需要浏览器预览的文件、需要在新标签页查看

---

## 二、Blob文件下载

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

### 5. axios + Blob

类似fetch，适合已有axios项目的场景。

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

---

## 三、带进度下载

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

### 7. axios + onDownloadProgress

axios也支持进度监听。

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

---

## 四、特殊场景下载

### 8. Base64图片下载

下载页面中已存在的Base64图片或canvas生成的图片。

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

### 9. 纯文本/JSON下载

下载纯文本内容或JSON数据。

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

### 10. 隐藏iframe下载

适合不想创建a标签或需要更隐蔽下载的场景。

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

---

## 五、高级下载方案

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

### 12. 流式下载（适合超大文件）

使用ReadableStream边下载边保存，适合真正的大型文件。

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

---

## 六、方案对比总结

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| a标签下载 | 简单、原生 | 无进度、跨域受限 | 同源静态文件 |
| location.href | 最简单 | 无法控制 | 简单跳转下载 |
| fetch + Blob | 灵活、可控 | 需要处理Blob | 接口文件下载 |
| axios + Blob | 适合已有项目 | 额外依赖 | 接口文件下载 |
| XMLHttpRequest | 可监听进度 | API较老 | 大文件下载 |
| Base64下载 | 简单 | 内存占用大 | 图片/Canvas |
| 分片下载 | 内存友好 | 实现复杂 | 超大文件 |
| 流式下载 | 内存最优 | 实现复杂 | 超大文件 |

---

## 最佳实践建议

1. **简单文件下载**：使用a标签或location.href
2. **接口文件下载**：使用fetch + Blob（推荐）或axios + Blob
3. **大文件下载**：使用XMLHttpRequest监听进度，或分片/流式下载
4. **图片/Canvas下载**：使用toDataURL或toBlob
5. **进度显示**：必须使用XMLHttpRequest或axios的progress事件

根据具体业务场景选择合适的方案，既能保证功能完整，又能提供良好的用户体验。
