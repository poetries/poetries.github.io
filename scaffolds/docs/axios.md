---
title: Axios异步请求的那些事
date: 2017-11-08 18:55:24
tags: 
 - Axios
 - react
categories: Front-End
---

一、axios 简介
---

> `axios` 是一个基于`Promise `用于浏览器和 `nodejs` 的 `HTTP` 客户端，它本身具有以下特征：

- 从浏览器中创建 `XMLHttpRequest`
- 从 `node.js` 发出 `http` 请求
- 支持` Promise API`
- 拦截请求和响应
- 转换请求和响应数据
- 取消请求
- 自动转换`JSON`数据
- 客户端支持防止` CSRF/XSRF`


二、axios基础
---

- `axios.request（config）`
- `axios.get（url [，config]）`
- `axios.delete（url [，config]）`
- `axios.head（url [，config]）`
- `axios.options（url [，config]）`
- `axios.post（url [，data [，config]]`）
- `axios.put（url [，data [，config]]）`
- `axios.patch（url [，data [，config]]）`


三、执行 GET 请求
---

```javascript
// 向具有指定ID的用户发出请求
axios.get('/user?ID=12345')
.then(function (res) {
    console.log(res);
})
.catch(function (error) {
    console.log(error);
});
 
// 也可以通过 params 对象传递参数
axios.get('/user', {
    params: {
        ID: 12345
    }
})
.then(function (response) {
    console.log(response);
})
.catch(function (error) {
    console.log(error);
});
```

四、执行 POST 请求
---

```javascript
axios.post('/user', {
    userId:"123"
},{
    headers:{
        token:"abc"
    }
})
.then(function (res) {
    console.log(res);
})
.catch(function (error) {
    console.log(error);
});
```

五、通过配置方式发送请求
---

> `get`请求是发送参数，在`params`中定义。而`POST`请求是发送`request body`,需要在`data`中定义

```javascript
// get 在params中定义
axios({
    url:"pakage.json",
    method:"get",
    params:{
        userId:"123"
    },
    headers:{
        token:"http-test"
    }
}).then(res=>{
    console.log(res.data);
})

// post 在data中定义
axios({
    url:"pakage.json",
    method:"post",
    data:{
        userId:"123"
    },
    headers:{
        token:"http-test"
    }
}).then(res=>{
    console.log(res.data);
})
```


六、执行多个并发请求
---

```javascript
function getUserAcount(){
    // 返回一个promise对象
    return axios.get("/user/1234");
}
function getUserPermissions(){
    // 返回一个promise对象
    return axios.get("/user/1234/getUserPermissions");
}

//一次性返回两个接口
axios.all([getUserAccount(),getUserPerssions()]).then(axios.spread((acct, perms) => {
    // spread展开两个返回的结果
    //两个请求现已完成
}))
```

七、在react的应用
---

> 组件首次“挂载”（`mount`）时，该方法就会执行。在组件生命周期中，该方法只会执行一次

```javascript
componentDidMount() {
    axios.get(`http://www.reddit.com/r/${this.props.subreddit}.json`)
      .then(res => {
        const posts = res.data.data.children.map(obj => obj.data);
        this.setState({ posts });
      });
  }
```

八、参考
---

- https://github.com/axios/axios
