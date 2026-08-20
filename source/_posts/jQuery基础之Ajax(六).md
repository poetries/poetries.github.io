---
title: jQuery基础之Ajax（六）
date: 2016-08-07 22:30:08
tags: jQuery
categories: Front-End
---

- **ajax** : `Asynchronous Javascript And XML` （异步的`JavaScript`和`XML`）

- 创建`ajax`对象 `var xhr = new XMLHttpRequest();`
<!--more-->
- 准备发送请求

- `get `
	- 传递的数据放在URL后面
	- 中文编码  `encodeURI( '' );`
	- 缓存 在数据后面加上随机数或者日期对象或者……;
	
- ` post`
	- 传递的数据放在`send()`里面，并且一定要规定数据格式
	- 没有缓存问题


- form表单中:
	- `action`:
	- `method`:(默认是` get`)
	- `get`: 会在url里面以 `name=value` , 两个数据之间用 `&` 连接
	- `post`:

- `enctype`: `"application/x-www-form-urlencoded"`
- `url`
- 是否异步
	- 同步(`false`)：阻塞
	- 异步(`true`)：非阻塞
	

- 正式发送请求

	- `ajax`请求处理过程

    
案列：
    
  ```javascript
  	var ajx = null;

			if(window.XMLHttpRequest){//兼容处理
				var ajx = new XMLHttpRequest();//一般浏览器
			}else
			{
				ajx = new ActiveXObject("Microsoft.XMLHTTP");//IE6+
			}
			
			//准备发送请求
			ajx.open("get","ajax.txt",true);

			//正式发送请求
			ajx.send();
			
			//处理请求
			ajx.onreadystatechange = function(){
				if(ajx.readState == 4){
					if (ajx.status == 200)//200是HTTP 请求成功的状态码
					{
						console.log(ajx.responseText);
					}else{
						alert("请求出错");
					}
				}
			}
```

- `onreadystatechange` ：当处理过程发生变化的时候执行下面的函数

- `readyState` ：`ajax`处理过程
    - 0：请求未初始化（还没有调用` open()`）。
    - 1：请求已经建立，但是还没有发送（还没有调用 `send()`）。
    - 2：请求已发送，正在处理中（通常现在可以从响应中获取内容头）。
    - 3：请求在处理中；通常响应中已有部分数据可用了，但是服务器还没有完成响应的生成。
    - 4：响应已完成；您可以获取并使用服务器的响应了。

- `responseText `：请求服务器返回的数据存在该属性里面
- `status :` http状态码


	
