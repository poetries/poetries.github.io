---
title: Promise之Promise.all、Promise.race
date: 2018-12-05 10:50:20
tags: 
    - Promise
    - ES6
categories: Front-End
---

## 一、Pomise.all

> `Promise.all`可以将多个`Promise`实例包装成一个新的`Promise`实例。同时，成功和失败的返回值是不同的，成功的时候返回的是一个结果数组，而失败的时候则返回最先被`reject`失败状态的值

```js
let p1 = new Promise((resolve, reject) => {
  resolve('成功了')
})

let p2 = new Promise((resolve, reject) => {
  resolve('success')
})

let p3 = Promse.reject('失败')

Promise.all([p1, p2]).then((result) => {
  console.log(result)               //['成功了', 'success']
}).catch((error) => {
  console.log(error)
})

Promise.all([p1,p3,p2]).then((result) => {
  console.log(result)
}).catch((error) => {
  console.log(error)      // 失败了，打出 '失败'
})
```

- `Promse.all`在处理多个异步处理时非常有用，比如说一个页面上需要等两个或多个`ajax`的数据回来以后才正常显示，在此之前只显示`loading`图标

> `Promise.all` 里的任务列表`[asyncTask(1),asyncTask(2),asyncTask(3)]`,我们是按照顺序发起的。 
但是根据结果来说，它们是异步的，互相之间并不阻塞，每个任务完成时机是不确定的，尽管如此，所有任务结束之 
后，它们的结果仍然是按顺序地映射到`resultList`里,这样就能和`Promise.all`里的任务列表。这带来了一个绝大的好处：在前端开发请求数据的过程中，偶尔会遇到发送多个请求并根据请求顺序获取和使用数据的场景，使用`Promise.all`毫无疑问可以解决这个问题

## 二、Promise.race()

> `Promise.race([p1, p2, p3])`里面哪个结果获得的快，就返回那个结果，不管结果本身是成功状态还是失败状态

- 我们简单看一下例子，返回结果为3，因为我们设置了定时器，第三个`Promise`执行的最快

```js
Promise.race([
  new Promise(function(resolve, reject) {
    setTimeout(() => resolve(1), 1000)
  }),
  new Promise(function(resolve, reject) {
    setTimeout(() => resolve(2), 100)
  }),
  new Promise(function(resolve, reject) {
    setTimeout(() => resolve(3), 10)
  })
]).then(value => {
  console.log(value) // 3
})
```

```js
let p1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('success')
  },1000)
})

let p2 = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject('failed')
  }, 500)
})

Promise.race([p1, p2]).then((result) => {
  console.log(result)
}).catch((error) => {
  console.log(error)  // 打开的是 'failed'
})
```
