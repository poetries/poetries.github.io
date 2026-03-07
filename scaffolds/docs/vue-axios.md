---
title: vue-axios封装请求（十二）
date: 2018-08-28 15:35:32
tags: Vue
categories: Front-End
---

## 一、axios 简介


> `axios` 是一个基于`Promise `用于浏览器和 `nodejs` 的 `HTTP` 客户端，它本身具有以下特征：

- 从浏览器中创建 `XMLHttpRequest`
- 从 `node.js` 发出 `http` 请求
- 支持` Promise API`
- 拦截请求和响应
- 转换请求和响应数据
- 取消请求
- 自动转换`JSON`数据
- 客户端支持防止` CSRF/XSRF`



## 二、axios基础


- `axios.request（config）`
- `axios.get（url [，config]）`
- `axios.delete（url [，config]）`
- `axios.head（url [，config]）`
- `axios.options（url [，config]）`
- `axios.post（url [，data [，config]]`）
- `axios.put（url [，data [，config]]）`
- `axios.patch（url [，data [，config]]）`



## 三、执行 GET 请求


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

## 四、执行 POST 请求



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

## 五、通过配置方式发送请求


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


## 六、执行多个并发请求


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

## 七、全局拦截


```javascript
new Vue({
    el:"app",
    data:{
        msg:""
    },
    // 初始化生命周期的一个函数
    mounted:function(){
     //拦截请求之前
       axios.interceptors.request.use(config=>{
           //这里做一些拦截操作,拦截用户的请求 请求之前做一些loading处理
           return config;
       })
       //拦截响应之后处理
       axios.interceptors.response.use(response=>{
           //这里做一些拦截操作,响应以后做什么，在返回数据
           return response;
       })
    },

    methods: {
        get: function() {
        
        },
        post:function() {
           
        }
    }
})
```

## 八、请求封装、异常统一处理

> vue中采用axios处理网络请求，避免请求接口重复代码，以及各种网络情况造成的异常情况的判断，采用axios请求封装和异常拦截操作

### 8.1 axios 请求封装

```javascript
//  引入axios文件包
import axios from 'axios'

// POST 方法封装  (参数处理)
export const postRequest = (url, params) => {
  return axios({
    method: 'post',
    url: url,
    data: params,
    transformRequest: [function (data) {
      let ret = ''
      for (let it in data) {
        ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
      }
      return ret
    }],
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

// POST 方法封装  (文件上传)
export const uploadFileRequest = (url, params) => {
  return axios({
    method: 'post',
    url: url,
    data: params,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

//  GET 方法封装
export const getRequest = (url) => {
  return axios({
    method: 'get',
    url: url
  });
}

//  PUT 方法封装
export const putRequest = (url, params) => {
  return axios({
    method: 'put',
    url: url,
    data: params,
    transformRequest: [function (data) {
      let ret = ''
      for (let it in data) {
        ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
      }
      return ret
    }],
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

//  DELETE 方法封装
export const deleteRequest = (url) => {
  return axios({
    method: 'delete',
    url: url
  });
}
```

### 8.2 axios请求异常统一处理

```javascript
// 引入依赖包
import axios from 'axios'
import {Message} from 'element-ui'

//  REQUEST 请求异常拦截
axios.interceptors.request.use(config=> {
 //==========  所有请求之前都要执行的操作  ==============
  return config;
}, err=> {
 //==================  错误处理  ====================
  Message.error({message: '请求超时!'});
  return Promise.resolve(err);
})

//  RESPONSE 响应异常拦截
axios.interceptors.response.use(data=> {
//==============  所有请求完成后都要执行的操作  ==================

// 第一种方式

    // 根据返回的code值来做不同的处理（和后端约定）
    switch (data.code) {
        case '0':
            // exp: 修复iPhone 6+ 微信点击返回出现页面空白的问题
            if (isIOS()) {
                // 异步以保证数据已渲染到页面上
                setTimeout(() => {
                    // 通过滚动强制浏览器进行页面重绘
                    document.body.scrollTop += 1
                }, 0)
            }
            // 这一步保证数据返回，如果没有return则会走接下来的代码，不是未登录就是报错
            return data

        // 需要重新登录
        case 'SHIRO_E5001':
            // 微信生产环境下授权登录
            if (isWeChat() && IS_PRODUCTION) {
                axios.get(apis.common.wechat.authorizeUrl).then(({ result }) => {
                    location.replace(global.decodeURIComponent(result))
                })
            } else {
                // 否则跳转到h5登录并带上跳转路由
                const search = encodeSearchParams({
                    next: location.href,
                })

                location.replace(`/user/login`)
            }

            // 不显示提示消息
            data.description = ''
            break

        default:
    }
    // 若不是正确的返回code，且已经登录，就抛出错误
    const err = new Error(data.description)

    err.data = data
    err.response = response

  // 第二种方式，仅对200和error状态处理
  if (data.status && data.status == 200 && data.data.status == 'error') {
    Message.error({message: data.data.msg});
    return;
  }
  return data;
}, err=> {
//==============  错误处理  ====================
   if (err && err.response) {
        switch (err.response.status) {
            case 400: err.message = '请求错误(400)'; break;
            case 401: err.message = '未授权，请重新登录(401)'; break;
            case 403: err.message = '拒绝访问(403)'; break;
            case 404: err.message = '请求出错(404)'; break;
            case 408: err.message = '请求超时(408)'; break;
            case 500: err.message = '服务器错误(500)'; break;
            case 501: err.message = '服务未实现(501)'; break;
            case 502: err.message = '网络错误(502)'; break;
            case 503: err.message = '服务不可用(503)'; break;
            case 504: err.message = '网络超时(504)'; break;
            case 505: err.message = 'HTTP版本不受支持(505)'; break;
            default: err.message = `连接出错(${err.response.status})!`;
        }
    } else {
        err.message = '连接服务器失败!'
    }
  Message.err( {message: err.message } )
  return Promise.resolve(err);
})
```

> 请求出错的时候执行的是：`Promise.resolve(err)`;，而不是`Promise.reject(err)`;，这样无论请求成功还是失败，在成功的回调中都能收到通知


### 8.3 vue 项目中使用该方法


> 在main.js中导入所有请求方法

```javascript
//  导入所有请求方法
import {getRequest,postRequest,deleteRequest,putRequest} from './utils/api'
```


> 将请求方法添加至 `Vue.prototype` 上

```javascript
//  向VUE的原型上添加请求方法
Vue.prototype.getRequest = getRequest;
Vue.prototype.postRequest = postRequest;
Vue.prototype.deleteRequest = deleteRequest;
Vue.prototype.putRequest = putRequest;
```

> 发送请求（请求方法的调用）

```javascript
//  发送网络请求
this.postRequest('/login', {userName，password}).then(resp=> {
        ...
    }
});

```

## 九、接口封装处理

> `vue`中`Axios`的封装与`API`接口的管理详解

### 9.1 axios的封装

> 在`vue`项目中，和后台交互获取数据这块，我们通常使用的是`axios`库，它是基于`promise`的`http`库，可运行在浏览器端和`node.js`中。他有很多优秀的特性，例如拦截请求和响应、取消请求、转换`json`、客户端防御`XSRF`等

- 一般我会在项目的`src`目录中，新建一个`request`文件夹，然后在里面新建一个`http.js`和一个`api.js`文件。`http.js`文件用来封装我们的`axios`，`api.js`用来统一管理我们的接口

```javascript
// 在http.js中引入axios
import axios from 'axios'; // 引入axios
import QS from 'qs'; // 引入qs模块，用来序列化post类型的数据，后面会提到
// vant的toast提示框组件，大家可根据自己的ui组件更改。
import { Toast } from 'vant';
```

### 9.2 环境的切换

> 我们的项目环境可能有开发环境、测试环境和生产环境。我们通过`node`的环境变量来匹配我们的默认的接口`url`前缀。`axios.defaults.baseURL`可以设置`axios`的默认请求地址就不多说了

```javascript
// 环境的切换
if (process.env.NODE_ENV == 'development') { 
 axios.defaults.baseURL = 'https://www.baidu.com';} 
else if (process.env.NODE_ENV == 'debug') { 
 axios.defaults.baseURL = 'https://www.ceshi.com';
} 
else if (process.env.NODE_ENV == 'production') { 
 axios.defaults.baseURL = 'https://www.production.com';
}
```


### 9.3 设置请求超时

> 通过`axios.defaults.timeout`设置默认的请求超时时间。例如超过了10s，就会告知用户当前请求超时，请刷新等

```
axios.defaults.timeout = 10000;
```

> `post`请求头的设置`post`请求的时候，我们需要加上一个请求头，所以可以在这里进行一个默认的设置，即设置`post`的请求头为`application/x-www-form-urlencoded;charset=UTF-8`

```
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencode
```

### 9.4 请求拦截

> 我们在发送请求前可以进行一个请求的拦截，为什么要拦截呢，我们拦截请求是用来做什么的呢？比如，有些请求是需要用户登录之后才能访问的，或者post请求的时候，我们需要序列化我们提交的数据。这时候，我们可以在请求被发送之前进行一个拦截，从而进行我们想要的操作

```javascript
// 先导入vuex,因为我们要使用到里面的状态对象
// vuex的路径根据自己的路径去写
import store from '@/store/index';

// 请求拦截器axios.interceptors.request.use( 
 config => { 
 // 每次发送请求之前判断vuex中是否存在token 
 // 如果存在，则统一在http请求的header都加上token，这样后台根据token判断你的登录情况
 // 即使本地存在token，也有可能token是过期的，所以在响应拦截器中要对返回状态进行判断 
 const token = store.state.token; 
 token && (config.headers.Authorization = token); 
 return config; 
 }, 
 error => { 
 return Promise.error(error); 
})
```

> 一般是在登录完成之后，将用户的`token`通过`localStorage`或者`cookie`存在本地，然后用户每次在进入页面的时候（即在`main.js`中），会首先从本地存储中读取`token`，如果`token`存在说明用户已经登陆过，则更新vuex中的token状态。然后，在每次请求接口的时候，都会在请求的`header`中携带`token`，后台人员就可以根据你携带的`token`来判断你的登录是否过期，如果没有携带，则说明没有登录过。这时候或许有些小伙伴会有疑问了，就是每个请求都携带`token`，那么要是一个页面不需要用户登录就可以访问的怎么办呢？其实，你前端的请求可以携带`token`，但是后台可以选择不接收啊！

### 9.5 响应的拦截

```javascript
// 响应拦截器
axios.interceptors.response.use( 
 response => { 
 // 如果返回的状态码为200，说明接口请求成功，可以正常拿到数据 
 // 否则的话抛出错误
 if (response.status === 200) {  
  return Promise.resolve(response); 
 } else {  
  return Promise.reject(response); 
 } 
 }, 
 // 服务器状态码不是2开头的的情况
 // 这里可以跟你们的后台开发人员协商好统一的错误状态码 
 // 然后根据返回的状态码进行一些操作，例如登录过期提示，错误提示等等
 // 下面列举几个常见的操作，其他需求可自行扩展
 error => {  
 if (error.response.status) {  
  switch (error.response.status) {  
  // 401: 未登录
  // 未登录则跳转登录页面，并携带当前页面的路径
  // 在登录成功后返回当前页面，这一步需要在登录页操作。  
  case 401:   
   router.replace({   
   path: '/login',   
   query: { 
    redirect: router.currentRoute.fullPath 
   }
   });
   break;

  // 403 token过期
  // 登录过期对用户进行提示
  // 清除本地token和清空vuex中token对象
  // 跳转登录页面  
  case 403:
   Toast({
   message: '登录过期，请重新登录',
   duration: 1000,
   forbidClick: true
   });
   // 清除token
   localStorage.removeItem('token');
   store.commit('loginSuccess', null);
   // 跳转登录页面，并将要浏览的页面fullPath传过去，登录成功后跳转需要访问的页面 
   setTimeout(() => {   
   router.replace({    
    path: '/login',    
    query: { 
    redirect: router.currentRoute.fullPath 
    }   
   });   
   }, 1000);   
   break;

  // 404请求不存在
  case 404:
   Toast({
   message: '网络请求不存在',
   duration: 1500,
   forbidClick: true
   });
   break;
  // 其他错误，直接抛出错误提示
  default:
   Toast({
   message: error.response.data.message,
   duration: 1500,
   forbidClick: true
   });
  }
  return Promise.reject(error.response);
 }
 } 
});

```

> 响应拦截器很好理解，就是服务器返回给我们的数据，我们在拿到之前可以对他进行一些处理。例如上面的思想：如果后台返回的状态码是200，则正常返回数据，否则的根据错误的状态码类型进行一些我们需要的错误，其实这里主要就是进行了错误的统一处理和没登录或登录过期后调整登录页的一个操作

- 要注意的是，上面的`Toast()`方法，是我引入的`vant`库中的`toast`轻提示组件，你根据你的`ui`库，对应使用你的一个提示组件

### 9.6 封装get方法和post方法

> 我们常用的`ajax`请求方法有`get`、`post`、`put`等方法。`axios`对应的也有很多类似的方法，不清楚的可以看下文档。但是为了简化我们的代码，我们还是要对其进行一个简单的封装。下面我们主要封装两个方法：`get`和`post`

- `get`方法：我们通过定义一个`get`函数，`get`函数有两个参数，第一个参数表示我们要请求的`url`地址，第二个参数是我们要携带的请求参数。`get`函数返回一个`promise`对象，当`axios`其请求成功时`resolve`服务器返回值，请求失败时`reject`错误值。最后通过`export`抛出`get`函数

```javascript
/**
 * get方法，对应get请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 */
export function get(url, params){ 
 return new Promise((resolve, reject) =>{ 
 axios.get(url, {  
  params: params 
 }).then(res => {
  resolve(res.data);
 }).catch(err =>{
  reject(err.data) 
 }) 
});}
```

- `post`方法：原理同`get`基本一样，但是要注意的是，`post`方法必须要使用对提交从参数对象进行序列化的操作，所以这里我们通过`node`的`qs`模块来序列化我们的参数。这个很重要，如果没有序列化操作，后台是拿不到你提交的数据的

```javascript
/** 
 * post方法，对应post请求 
 * @param {String} url [请求的url地址] 
 * @param {Object} params [请求时携带的参数] 
 */
export function post(url, params) {
 return new Promise((resolve, reject) => {
  axios.post(url, QS.stringify(params))
 .then(res => {
  resolve(res.data);
 })
 .catch(err =>{
  reject(err.data)
 })
 });
}
```


> `axios.get()`方法和`axios.post()`在提交数据时参数的书写方式还是有区别的。区别就是，`get`的第二个参数是一个`{}`，然后这个对象的`params`属性值是一个参数对象的。而`post`的第二个参数就是一个参数对象

### 9.7 api的统一管理

> 首先我们在`api.js`中引入我们封装的`get`和`post`方法

```javascript
/** 
 * api接口统一管理
 */
import { get, post } from './http'
```

在`api.js`中

```
export const apiAddress = param => post('api/v1/users',param)
```

在我们的页面中可以这样调用我们的`api`接口


```javascript
import { apiAddress } from '@/request/api';// 导入我们的api接口
export default {  
 name: 'Address', 
 created () {
  this.onLoad();
 },
 methods: {   
  // 获取数据   
  onLoad() {
   // 调用api接口，并且提供了两个参数    
   apiAddress({     
    type: 0,     
    sort: 1    
   }).then(res => {
    // 获取数据成功后的其他操作
    ………………    
   })   
  }  
 }
}

```

### 9.8 完整封装代码

```javascript
/**axios封装
 * 请求拦截、相应拦截、错误统一处理
 */
import axios from 'axios';
import QS from 'qs';
import {
	Toast
}
from 'vant';
import store from '../store/index'

// 环境的切换
if (process.env.NODE_ENV == 'development') {
	axios.defaults.baseURL = '/api';
} else if (process.env.NODE_ENV == 'debug') {
	axios.defaults.baseURL = '';
} else if (process.env.NODE_ENV == 'production') {
	axios.defaults.baseURL = 'http://api.123dailu.com/';
}

// 请求超时时间
axios.defaults.timeout = 10000;

// post请求头
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';

// 请求拦截器
axios.interceptors.request.use(
config = > {
	// 每次发送请求之前判断是否存在token，如果存在，则统一在http请求的header都加上token，不用每次请求都手动添加了
	// 即使本地存在token，也有可能token是过期的，所以在响应拦截器中要对返回状态进行判断
	const token = store.state.token;
	token && (config.headers.Authorization = token);
	return config;
}, error = > {
	return Promise.error(error);
})

// 响应拦截器
axios.interceptors.response.use(
response = > {
	if (response.status === 200) {
		return Promise.resolve(response);
	} else {
		return Promise.reject(response);
	}
},
// 服务器状态码不是200的情况 
error = > {
	if (error.response.status) {
		switch (error.response.status) {
			// 401: 未登录    
			// 未登录则跳转登录页面，并携带当前页面的路径    
			// 在登录成功后返回当前页面，这一步需要在登录页操作。    
		case 401:
			router.replace({
				path: '/login',
				query: {
					redirect: router.currentRoute.fullPath
				}
			});
			break;
			// 403 token过期    
			// 登录过期对用户进行提示    
			// 清除本地token和清空vuex中token对象    
			// 跳转登录页面    
		case 403:
			Toast({
				message: '登录过期，请重新登录',
				duration: 1000,
				forbidClick: true
			});
			// 清除token     
			localStorage.removeItem('token');
			store.commit('loginSuccess', null);
			// 跳转登录页面，并将要浏览的页面fullPath传过去，登录成功后跳转需要访问的页面
			setTimeout(() = > {
				router.replace({
					path: '/login',
					query: {
						redirect: router.currentRoute.fullPath
					}
				});
			}, 1000);
			break;
			// 404请求不存在    
		case 404:
			Toast({
				message: '网络请求不存在',
				duration: 1500,
				forbidClick: true
			});
			break;
			// 其他错误，直接抛出错误提示    
		default:
			Toast({
				message: error.response.data.message,
				duration: 1500,
				forbidClick: true
			});
		}
		return Promise.reject(error.response);
	}
});
/** 
 * get方法，对应get请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 */
export
function get(url, params) {
	return new Promise((resolve, reject) = > {
		axios.get(url, {
			params: params
		}).then(res = > {
			resolve(res.data);
		}).
		catch (err = > {
			reject(err.data)
		})
	});
}
/** 
 * post方法，对应post请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 */
export
function post(url, params) {
	return new Promise((resolve, reject) = > {
		axios.post(url, QS.stringify(params)).then(res = > {
			resolve(res.data);
		}).
		catch (err = > {
			reject(err.data)
		})
	});
}
```
