---
title: 好物快应用、H5端开发小结
date: 2018-10-19 16:50:43
tags: 
   - JavaScript
   - 快应用
categories: Front-End
---

## 一、deepLink跳转

### 1.1 快应用中呼起deepLink

**第一步：检测是安装了app**

> 前提条件：需要知道app的包名

```javascript
// 判断用户是否安装了app
export const checkInstalledApp = (pkg_name) => {
  const pkg = require('@system.package')
  return new Promise((resolve,reject)=>{
    pkg.hasInstalled({
      package: pkg_name,
      success: function (data) {
        resolve(data.result) //返回true、false
      },
      fail: function (data, code) {
        reject(code)
      }
    })
  })
}
```

**第二步：调起deepLink**

```javascript
let pkg = 'com.newsqq.fda' // 传入包名
let deep_link = '' // 跳转到app的地址
let params = {}

checkInstalledApp(pkg).then(hasInstalledApp=>{
    // 用户已经安装了app, deep_link直接跳转
    if(hasInstalledApp && deep_link){
      params = {uri:deep_link}
    }else{ // 否则跳转到H5地址
      params = {
        uri:'Webview',//对应于manifest中的配置
        params:{
          url,
          title:goods_name
        }
      }
    }
    this.$app.$def.router.push(params)
})

```

### 1.2 `H5`页面呼起快应用

> 引入快应用[官方提供的代码](https://doc.quickapp.cn/tutorial/platform/url-jump-configuration.html),这里做了一下处理

```javascript
export const quickapp = (function(){
  !function(e) {
        "use strict";
        window.appRouter = function(e, t, a, o) {
            return a = a || {},
            o && (a.__PROMPT__ = 1, a.__NAME__ = o),
            n(e, t, a)
        },
        window.installShortcut = function(e, t) {
            return n("command", "", {
                type: "shortcut",
                package: e,
                name: t
            })
        },
        window.channelReady = function(e) {
            var n = {
                available: new Function,
                availableTimeout: 2e3
            };
            return "function" == typeof e ? n.available = e: "object" == typeof e &&
            function(e, n) {
                n = n || {};
                for (var t in n) e[t] = n[t]
            } (n, e),
            function(e) {
                var n = "http://thefatherofsalmon.com/images",
                t = document.createElement("img");
                if (t.style.width = "1px", t.style.height = "1px", t.style.display = "none", n += "/" + 1e20 * Math.random(), t.src = n, document.body.appendChild(t), t.complete) e.available.call(null, !0);
                else {
                    t.onload = function() {
                        clearTimeout(a),
                        e.available.call(null, !0)
                    };
                    var a = setTimeout(function() {
                        e.available.call(null, !1)
                    },
                    e.availableTimeout)
                }
            } (n)
        };
        function n(e, n, t) {
            var a = "http://thefatherofsalmon.com/",
            o = "";
            if (e && (a = a + "?i=" + e), n && (a = a + "&p=" + n),
            function(e) {
                if (!e) return ! 0;
                var n = void 0;
                for (n in e) return ! 1;
                return ! 0
            } (t)) {
                var i = window.location.search;
                i.indexOf("?") > -1 && (o = i.substr(1))
            } else {
                o = Object.keys(t).map(function(e) {
                    return e + "=" + encodeURIComponent(t[e])
                }).join("&")
            }
            "" !== o && (a = a + "&a=" + encodeURIComponent(o));
            var l = document.createElement("img");
            l.src = a,
            l.style.width = "1px",
            l.style.height = "1px",
            l.style.display = "none",
            document.body.appendChild(l)
        }

    } ();

    return {
      appRouter:window.appRouter,
      installShortcut:window.installShortcut,
      channelReady:window.channelReady
    }
})()
```

> 或者在网页中嵌入以下 `js`，支持`HTTP`与`HTTPS`访问。上面的代码和这个一样的，只是做了一下模块化处理


```html
<script type="text/javascript" src="//statres.quickapp.cn/quickapp/js/routerinline.min.js"></script>
```

**调起应用**

> `appRouter(packageName, path, params, confirm)`，[更多详情](https://doc.quickapp.cn/tutorial/platform/url-jump-configuration.html)

**第一步：检测手机型号**

> 只有在对应的应用商店上架才可以打开

- 主要用到了这个库 https://github.com/hgoebl/mobile-detect.js

```javascript
// 检测手机型号
export const checkPhone = ()=>{
  const MobileDetect = require('mobile-detect')
  let device_type = navigator.userAgent;//获取userAgent信息
  let md = new MobileDetect(device_type);//初始化mobile-detect
  let os = md.os();//获取系统
  let model = "";

  //判断数组中是否包含某字符串
  Array.prototype.contains = function(needle) {
      for (i in this) {
          if (this[i].indexOf(needle) > 0)
              return i;
      }
      return -1;
  }

  if (os == "iOS") {//ios系统的处理
      os = md.os() + md.version("iPhone");
      model = md.mobile();
  } else if (os == "AndroidOS") {//Android系统的处理
      os = md.os() + md.version("Android");
      var sss = device_type.split(";");
      var i = sss.contains("Build/");
      if (i > -1) {
          model = sss[i].substring(0, sss[i].indexOf("Build/"));
      }
  	let phoneModel = model.toLocaleLowerCase()
      //判断是否是oppo
      if(phoneModel.indexOf('oppo')!==-1){
      	return true
      }

  }
  return false
}
```

**第二步：调起快应用**

> 以呼起`OPPO`手机下已经上架的快应用为例

```javascript
// H5页面中呼起快应用

// page你所在的页面标志，goods_id是传递的参数
export const openQuickapp = ({page,goods_id})=>{
  const appRouter = (path,params={})=>quickapp.appRouter('com.yesdat.poem',`/${path}`,params)

  // 检测OPPO手机下呼起唐诗三百首快应用首页
  if(!checkPhone()){
    return false
  }
  if(page == 'home'){
    appRouter('Home')
  }else if(page == 'detail'){
    appRouter('Detail',{goods_id})
  }else if(page == 'search'){
    appRouter('Search')
  }

}
```




### 1.3 H5页面呼起deepLink

> H5 页检测手机是否安装 app 相关流程

**uri获取**

> 这里的`uri`,指得就是通过 `Url scheme` 来实现的`H5`与安卓、苹果应用之间的跳转链接。


我们需要找到客户端的同事，来获取如下格式的链接。

```
xx://'跳转页面'/'携带参数'
```

> 简单解释下`url scheme`。

- `url` 就是我们平常理解的链接。
- `scheme` 是指`url`链接中的最初位置，就是上边链接中 `‘xx’`的位置。
- 详细介绍可以看这里：[使用url scheme详解](https://sspai.com/post/31500)

> 用这个链接我们可以跳转到 应用中的某个页面,并可以携带一定的参数


**具体实现**

**第一步：通过iframe打开App**

> `Android`平台则各个`app`厂商差异很大，比如`Chrome`从25及以后就不再支持通过`js`触发（非用户点击），所以这里使用`iframe src`地址等来触发`scheme`。

```javascript
//在iframe 中打开APP
var ifr = document.createElement('iframe');
ifr.src = openUrl;
ifr.style.display = 'none';
```

**第二步： 判断是否安装某应用**

> 原理：若通过`url scheme` 打开`app`成功，那么当前`h5`会进入后台，通过计时器会有明显延迟。利用时间来判断。

- 由于安卓手机,页面进入后台，定时器`setTimeout`仍会不断运行，所以这里使用`setInterval`,较小间隔时间重复多次。来根据累计时间判断。
- 根据返回`true` `false`来判断是否安装。
- `document.hidden`对大于`4.4` `webview`支持很好，为页面可见性`api`

```javascript
// 检测app是否安装 
export const hasInstalledApp = (deepLink)=>{
  return new Promise((resolve,reject)=>{
      var timeout, t = 1000, hasApp = true;
      setTimeout(function () {
        if (hasApp) {
          resolve(true)
        } else {
          resolve(false)
        }
        document.body.removeChild(ifr);
      }, 2000)

      var t1 = Date.now();
      var ifr = document.createElement("iframe");
      ifr.setAttribute('src', deepLink);
      ifr.setAttribute('style', 'display:none');
      document.body.appendChild(ifr);

      timeout = setTimeout(function () {
         var t2 = Date.now();
         if (!t1 || t2 - t1 < t + 100) {
           hasApp = false;
         }
      }, t);
  })
}
```

> 使用方式

```javascript
// deep_link与h5链接跳转区分
if(deepLink){
	Toast.loading('正在跳转中...',0)
	hasInstalledApp(deepLink).then(hasInstall=>{
		Toast.hide()
 		if(!hasInstall){//未安装 直接跳H5
 		  window.location.href = h5Url
 		}
 	})
}else{
	window.location.href = h5Url
}
```


## 二、剪贴板分享 

> 主要是使用到`clipboard`简化

```javascript
import ClipboardJS from 'clipboard'

class Test extends Component {
    showShare = ()=>{
    	//实例化 ClipboardJS对象;
        const copyBtn = new ClipboardJS('.copyBtn');
        
        copyBtn.on("success",function(e){
            // 复制成功
        	Toast.info('复制成功，可分享到微信、浏览器打开',2);
        });
        copyBtn.on("error",function(e){
            //复制失败；
            Toast.fail(`复制失败${e.action}`,1);
        });
    }
}

//复制功能：需要复制的文本内容传递data-clipboard-text，定义类copyBtn用于实例化 
<Flex.Item
	data-clipboard-text={window.location.href}
	className="copyBtn"
	onClick={()=>showShare()}>
	<IconWrapper><IoMdShare/></IconWrapper>复制
</Flex.Item>
```

> 更多使用方式详情：https://github.com/zenorocha/clipboard.js


## 三、加载更多  

> `h5`页面需要分页加载优化，`react`中为例

**第一步：封装一个loadMore组件**

```javascript
import React from 'react'
import PropTypes from 'prop-types';
import { Spin } from 'antd';
import styled from 'styled-components'

const LoadMoreWrapper = styled.div`
  border-top: 1px dashed #ddd;
  .load-more{
    text-align: center;
    padding: 10px 0;
    background-color: #fff;
    color: #999;
  }
`
class LoadMore extends React.Component {
    constructor(props, context) {
        super(props, context);
    }
    _loadMoreHandle(){
        // 执行传递过来的loadMoreData
        this.props.loadMoreFn()
    }
    render() {
        const {hasMore} = this.props

        return (
            <LoadMoreWrapper>
              <div className="load-more" ref='wrapper'>
                 {
                     this.props.isLoadingMore && hasMore
                     ? <span className="loading"><Spin tip="Loading..."/> </span>
                     : (hasMore?<span onClick={this._loadMoreHandle.bind(this)}>加载更多</span>:<span>没有更多了</span>)
                 }
              </div>
            </LoadMoreWrapper>
        )
    }
    componentDidMount(){
        const wrapper = this.refs.wrapper;

        let timeoutId;
        window.addEventListener('scroll',()=>{
            if (this.props.isLoadingMore) return;
            if(timeoutId) clearTimeout(timeoutId);

            timeoutId = setTimeout(()=>{
                // 获取加载更多这个节点距离顶部的距离
                const top = wrapper.getBoundingClientRect().top;
                const windowHeight = window.screen.height;

                if (top && top < windowHeight) {
                    // 当wrapper已经在页面可视范围之内触发
                    this.props.loadMoreFn();
                }
            },50)
        },false)
    }
}

LoadMore.propTypes = {
  isLoadingMore:PropTypes.bool.isRequired,
  hasMore:PropTypes.bool.isRequired,
  loadMoreFn:PropTypes.func.isRequired
}

export default LoadMore
```

**第二步：处理分页**

> 需要后台支持分页

```javascript
import React, {Component} from 'react'

class Home extends Component {
	state = {
		goodsList:[], // 存储列表信息
		hasMore:true, // 记录当前状态下还有没有更多的数据可供加载
		isLoadingMore:false, //记录当前状态下，是加载中，还是点击可加载更多
		page:1, //页码
	}

	constructor(props) {
		super(props)
	}
	componentDidMount() {
		// 获取首屏数据
		this.props.fetchTopGoods({page:this.state.page})
	}
	// 加载更多
	 _loadMoreData(){
		const {topGoods} = this.props
		const _this = this

		_this.setState({
			isLoadingMore:true
		})

		if(_this.state.hasMore){
			_this.setState({page:++_this.state.page})// 页码累加

			_this.props.fetchGoods({page:_this.state.page}).then(res=>{

				const data = res.goods.list
				let dataList = _this.state.goodsList

				if(!dataList.length){
					dataList = topGoods.data
				}

				if(data && data.length < PAGE_SIZE) {
					_this.setState({
						hasMore:false
					})
				}else{
					_this.setState({
						goodsList:dataList.concat(data),
						hasMore:true,
						isLoadingMore:false
					})
				}

			})

		}else{
			this.setState({
				isLoadingMore:false
			})
		}

	}

	render() {
		return <LoadMore isLoadingMore={this.state.isLoadingMore} hasMore={this.state.hasMore} loadMoreFn={this._loadMoreData.bind(this)} />
	}
}


```


## 四、搜索历史

**封装cache**

```javascript
import storage from 'good-storage'

const SEARCH_KEY = '__search__'
const SEARCH_MAX_LEN = 15 // 最大保存15条

// 搜索条目更新到数组中
function insertArray(arr, val, compare, maxLen) {
  const index = arr.findIndex(compare)
  if (index === 0) {
    return
  }
  if (index > 0) {
    arr.splice(index, 1)
  }
  arr.unshift(val)
  if (maxLen && arr.length > maxLen) {
    arr.pop()
  }
}

// 从数组中移除
function deleteFromArray(arr, compare) {
  const index = arr.findIndex(compare)
  if (index > -1) {
    arr.splice(index, 1)
  }
}

// 暴露方法：保存搜索关键词 query传入的关键词
export function saveSearch(query) {
  let searches = storage.get(SEARCH_KEY, [])
  insertArray(searches, query, (item) => {
    return item === query
  }, SEARCH_MAX_LEN)
  storage.set(SEARCH_KEY, searches)
  return searches
}

// 暴露方法: 逐条删除搜索记录 query传入的历史记录
export function deleteSearch(query) {
  let searches = storage.get(SEARCH_KEY, [])
  deleteFromArray(searches, (item) => {
    return item === query
  })
  storage.set(SEARCH_KEY, searches)
  return searches
}

// 暴露方法: 清空所有历史
export function clearSearch() {
  storage.remove(SEARCH_KEY)
  return []
}
// 暴露方法: 加载所有历史记录
export function loadSearch() {
  return storage.get(SEARCH_KEY, [])
}
```

![search-history](https://upload-images.jianshu.io/upload_images/1480597-34867938a0263a19.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


## 五、骨架屏的应用

> 封装一个骨架屏组件

```javascript
import React,{PureComponent} from 'react'
import PropTypes from 'prop-types';
import { Spin } from 'antd';
import styled from 'styled-components'

const Wrapper = styled.div`
    .skeleton {
      display: flex;
      padding: 10px;
      width: 380px;
    }

    .skeleton .skeleton-head,
    .skeleton .skeleton-title,
    .skeleton .skeleton-content {
        background: rgba(220, 228, 232, 0.41);
    }
    .skeleton .skeleton-head{
      padding:20px;
      margin-right:10px;
    }

    .skeleton-body {
        width: 100%;
    }

    .skeleton-title {
        width: 100%;
        height: 15px;
        transform-origin: left;
        animation: skeleton-stretch .5s linear infinite alternate;
        border-radius: 5px;
    }

    .skeleton-content {
        width: 100%;
        height: 15px;
        margin-top: 10px;
        transform-origin: left;
        animation: skeleton-stretch .5s -.3s linear infinite alternate;
        border-radius: 5px;
    }

    @keyframes skeleton-stretch {
        from {
            transform: scalex(1);
        }
        to {
            transform: scalex(.3);
        }
    }

`
export default class Skeleton extends PureComponent {
    constructor(props, context) {
        super(props, context);
    }

    render() {
        const {count} = this.props
        const arr = []
        if(count){
          for(let i=0;i<count;i++){
            arr.push({})
          }
        }
        return (
            <Wrapper>
              {arr.map(v=><div className="skeleton">
                <div className="skeleton-head"></div>
                <div className="skeleton-body">
                   <div className="skeleton-title"></div>
                   <div className="skeleton-content"></div>
                </div>
              </div>)}
            </Wrapper>
        )
    }
}

Skeleton.propTypes = {
  count:PropTypes.number.isRequired
}

```

使用

```
// count 显示的条数
<Skeleton count={10}/>
```

![Skeleton](https://upload-images.jianshu.io/upload_images/1480597-497efe18e83ceac7.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


## 六、游客点赞

> 由于服务器不能及时返回点赞次数、点赞状态信息（点赞、举报信息服务器都是cache延迟返回的），因此把每次操作产生的记录存储在客户端

```javascript
// 检测是否举报、点赞数据

import storage from 'good-storage'

export const isOverReportOrLike = ({goodsId,action})=>{
  const arr = storage.get(GOODS_DATA,[])
  let goodsItem = arr.find(v=>v.goodsId==goodsId) || {}

  if(goodsItem && goodsItem.report && action ==='report' || goodsItem && goodsItem.like && action ==='like'){
    return true
  }

  if(goodsItem.goodsId == goodsId){
    if(action=='like'){
      goodsItem.like = true
    }else{
      goodsItem.report = true
    }
  }else{
    if(action=='like'){
      goodsItem.like = true
    }else{
      goodsItem.report = true
    }

    goodsItem.goodsId = goodsId
    arr.unshift(goodsItem)
  }

  storage.set(GOODS_DATA,arr)
}
```

```javascript
hanldeLike(data,obj={}){
	const {goodsId} = data
	const {goodsList,detailInfo} = this.props

	let goods = goodsList.find(v=>v.goodsId==goodsId)

	if(isOverReportOrLike({goodsId,action:'like'})){
		return Toast.success('您已喜欢过~',1);
	}else{
		// 处理详情页点赞
		if(obj && obj.page=='detail'){
			detailInfo.likeCount = (parseInt(goods.likeCount) || 0) +1
			this.setState({detailData:detailInfo})
		}

		goods.like = true
		goods.likeCount = (parseInt(goods.likeCount) || 0) +1
		this.setState({goodsData:goodsList})
	}

	storage.set('__curr_like_time__',Date.now()) // 记录当前点赞时间
	this.props.dataReport({goodsId,dataType:DataReportType.DataReportType_LIKE})
}
handleOverReport(data){
	const {goodsId} = data

	if(isOverReportOrLike({goodsId,action:'report'})){
		return Toast.success('您已举报过~',1);
	}

	this.props.dataReport({goodsId,dataType:DataReportType.DataReportType_REPORT})
}

```

刷新页面，还原数据

```javascript
//上次点赞时间和当前时间差值 >=10分钟 更新服务器cache的likeCount
const updateCacheTime = moment(Date.now()).diff(moment(storage.get('__curr_like_time__')), 'minute') 

const goodsCache = storage.get(GOODS_DATA,[])

const list = goodsList.map(v=>{
    // 从缓存中找出标志like的商品合并到列表
    goodsCache.forEach(vv=>{
    	if(v.goodsId == vv.goodsId){
    		v.like = true
    		
    		// 时间差小于10分钟，从本地读取，否则直接拉取服务器点赞数据
    		if(parseInt(updateCacheTime) < 10){
    			v.likeCount = (parseInt(v.likeCount) || 0) +1 	// 前台缓存
    		}
    	}
    })
    return {
    	...v
    }
})
```

**红心点赞动画**

> 一张20帧长图片，点击的时候按帧率进行播放

![](https://upload-images.jianshu.io/upload_images/3230869-797b8806204eafdf.png)

```html
<section class="fave"></section>
<script type="text/javascript" src="./jquery.min.js"></script>
<script type="text/javascript">
  $(function() {
    $('.fave').on('click', function() {
      $(this).toggleClass("active");
    })
  })
</script>
```

```css
.fave {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1px solid #EA6F5A;
  background: url(https://upload-images.jianshu.io/upload_images/3230869-797b8806204eafdf.png) no-repeat;
  background-position: left;
  background-size: auto 100%;
}

.fave.active {
  background-color: #EA6F5A;
  background-position: right;
  /* 主要在这一步 */
  transition: background .6s steps(19);
}
```

> `transition`属性的`steps`方法把过渡切分成很多步，像动画的帧数一样

![](https://upload-images.jianshu.io/upload_images/3230869-a5760a54cfca635d.gif)

## 七、nodejs递归文件夹上传到阿里云

```javascript
const fs = require('fs');
const path = require('path');
const OSS = require('ali-oss');

const filePath = path.join(__dirname,'../outCDN');
const excludeFiles = ['index.html']

const client = new OSS({
  region: 'oss-cn-shenzhen',
  accessKeyId: '',
  accessKeySecret: '',
  bucket: ''
});

// 遍历文件夹中所有文件
async function uploadFile(filePath){
    //根据文件路径读取文件，返回文件列表
    fs.readdir(filePath,async function(err,files){
        if(err){
            console.warn(err)
        }else{
            //遍历读取到的文件列表
            files.forEach(async function(filename){
                //获取当前文件的绝对路径
                const filedir = path.join(filePath,filename);
                //根据文件路径获取文件信息，返回一个fs.Stats对象
                fs.stat(filedir,async function(eror,stats){
                    if(eror){
                        console.warn('获取文件stats失败');
                    }else{
                        const isFile = stats.isFile();//是文件
                        const isDir = stats.isDirectory();//是文件夹
                        if(!excludeFiles.includes(filename) && isFile){
                            const fileKey = `${filedir.split('outCDN/').pop()}`

                            try {
                                // object表示上传到OSS的Object名称，localfile表示本地文件或者文件路径
                                let data = await client.put(fileKey,filedir);

                                console.error('upload success: %j', data);
                            } catch(err) {
                                console.error('upload failed: %j', err);
                            }
                        }
                        if(isDir){
                            uploadFile(filedir);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
                        }
                    }
                })
            });
        }
    });
}


uploadFile(filePath)
```

## 八、nodejs实现复制目录到指定文件夹

```javascript
const fs = require( 'fs' ),
    stat = fs.stat;

const path = require('path')

const includeFiles = ['package.json','server.js','next.config.js','ecosystem.json']

/*
 * 复制目录中的所有文件包括子目录
 * @param{ String } 需要复制的目录
 * @param{ String } 复制到指定的目录
 */
const readDir = function( src, dst ){
    // 读取目录中的所有文件/目录
    fs.readdir( src, function( err, paths ){
        if( err ){
            throw err;
        }
        paths.forEach(function( filename ){
            var _src = src + '/' + filename,
                _dst = dst + '/' + filename,
                readable, writable;

            stat( _src, function( err, st ){
                if( err ){
                    throw err;
                }
                // 判断是否为文件
                if( st.isFile()){
                    // 创建读取流
                    readable = fs.createReadStream( _src );
                    // 创建写入流
                    writable = fs.createWriteStream( _dst );
                    // 通过管道来传输流
                    readable.pipe( writable );
                }
                // 如果是目录则递归调用自身
                else if( st.isDirectory()){
                    copyDir( _src, _dst, readDir );
                }
            });
        });
    });
};

// 在复制目录前需要判断该目录是否存在，不存在需要先创建目录
const copyDir = function( src, dst, callback ){
    fs.exists( dst, function( exists ){
        // 已存在
        if( exists ){
            callback( src, dst );
        }
        // 不存在
        else{
            fs.mkdir( dst, function(){
                callback( src, dst );
            });
        }
    });
};

const copyFile = ()=>{
  includeFiles.forEach(filename=>{
    fs.createReadStream(path.join(__dirname,'../'+filename)).pipe(fs.createWriteStream(path.join(__dirname,'../deployBuildFiles',filename)))
    console.log('拷贝完成!')
  })
}

// 复制目录
copyDir( './next', './deployBuildFiles', readDir);

// 拷贝文件
copyFile()
```


## 九、优化

- `webpack tree shaking` 去除多余代码
- 服务端开发`gzip`压缩静态资源
- 图片`CDN`存储
- next服务端渲染
- 骨架屏加载细节

- `H5`端在线体验 http://goods.yesdat.com
- 快应用端在`OPPO`应用商店搜“好物”（标有快应用的那个）


