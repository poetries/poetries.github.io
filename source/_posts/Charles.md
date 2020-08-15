---
title: Mac下抓包工具Charles的使用
date: 2018-03-22 10:09:43
tags: 
 - 调试
 - Charles
categories: Tools
---

> 来源于互联网

## 一、简介

> `Charles`是目前最强大的`http`调试工具，在界面和功能上远强于`Fiddler`

### 1.1 界面功能

![](https://poetries1.gitee.io/img-repo/2019/10/24.png)


> 工具条包含了`Charles`的大部分功能

![](https://poetries1.gitee.io/img-repo/2019/10/25.png)

> 右键请求出现菜单，Charles的右键菜单功能比fiddler强大太多了

![](https://poetries1.gitee.io/img-repo/2019/10/26.png)

- 双击请求进入列表视图，类似fiddler，方便查看和过滤请求

![](https://poetries1.gitee.io/img-repo/2019/10/27.png)

> 请求详情跟fiddler相似，但直观不少

![](https://poetries1.gitee.io/img-repo/2019/10/28.png)

> 工具视图基本讲解完毕，接下来我们用Charles做点事情


## 二、本地代理和远程代理


> `Charles`的代理服务器端口跟`fiddler`一样都是`8888`，即你的本机`ip:8888`

![](https://poetries1.gitee.io/img-repo/2019/10/29.png)

- 点击“Map Local”后：

![](https://poetries1.gitee.io/img-repo/2019/10/30.png)

![](https://poetries1.gitee.io/img-repo/2019/10/31.png)

> index-min.js代理成index.js，刷新页面试试。

![](https://poetries1.gitee.io/img-repo/2019/10/32.png)

- `Charles`的树状视图比`fiddler`的列表视图好的地方在于，多次刷新后的请求会被归纳到树里面，更加一目了然，用`fiddler`的时候，有点强迫症的同学，都要点击`clear`
- `Charles`是支持子目录代理哦，非常实用的功能：(使用通配符`*`)

![](https://poetries1.gitee.io/img-repo/2019/10/33.png)


> 本地地址选择个子目录，不需要通配符

**如何判断是否代理成功呢?**

- 这点`Charles`比`fiddler`人性化多了

![](https://poetries1.gitee.io/img-repo/2019/10/34.png)


> 校验是否代理成功，最省力的方式是点击工具条上的刷新按钮，刷新单个请求，如果代理成功，`Charles`会往“`Notes`”界面打个`log`，比如`Mapped to local file: C:\www\htdocs\gallery\uploader\1.5\build\index-min.js`

**去除代理配置**

> 小技巧：所有的配置开关都可以通过工具条上的“工具”设置(倒数第二个按钮)

- 去掉代理配置：

> 小技巧：建议开启No Caching，不缓存请求

![](https://poetries1.gitee.io/img-repo/2019/10/35.png)

## 三、mobile代理功能

- 手机或平板页面的调试，我们需要把请求代理到`pc`端的`Charles`上
- 必须确保`mobile`端和`pc`端连的是相同的无线网络
- 终端获取`IP` `ifconfig`

![](https://poetries1.gitee.io/img-repo/2019/10/36.png)

## 四、网速模拟功能

- `throttle`功能对于前端来说非常实用，可以看页面在低网速下的表现，从而找出优化的点
- 首先先配置下`throttle`

![](https://poetries1.gitee.io/img-repo/2019/10/37.png)


> 我们要看页面在3G环境下的表现

![](https://poetries1.gitee.io/img-repo/2019/10/38.png)

- `Bandwidth`(带宽)
- `Utilistation`(利用百分比)
- `Round-trip`(往返延迟)
- `MTU`(字节)

## 五、断点功能

> `Charles`另一个非常实用的功能，对于开发者和测试人员来说，堪称神器。`Charles`能够断到发送请求前(篡改`Request`)和请求后(篡改`Response`)。

- 场景：`ajax`发送请求，我们需要测试接口的各种边界情况，比如出错、超时等表现，`Charles`的断点+随意篡改，非常方便测试

![](https://poetries1.gitee.io/img-repo/2019/10/39.png)

- `upload.php`是我们要测试的上传接口，右键选择“`BreakPoints`”，开启断点
- 小技巧：不用在`web`界面中操作，使用`repeat`功能，就可再次发送一样的请求：

![](https://poetries1.gitee.io/img-repo/2019/10/40.png)

## 六、重复发送请求

- `repeat`功能对于测试同学特别有用，可以检验接口的健壮性。
- `repeat`功对于前端的价值是不需要刷新页面，只需要`repeat`请求，比如检验代理是否成功，修改请求后执行等

![](https://poetries1.gitee.io/img-repo/2019/10/41.png)


- “`repeat`”重复发送一次请求。
- “`repeat Advances`”可以自定义重复次数和重复间隔

![](https://poetries1.gitee.io/img-repo/2019/10/42.png)


## 七、过滤请求

> 捕获的请求太多，容易产生干扰，`Charles`可以对捕获记录进行过滤。

![](https://poetries1.gitee.io/img-repo/2019/10/43.png)

![](https://poetries1.gitee.io/img-repo/2019/10/44.png)


**相关文章阅读**

- [windows下使用Fiddler做抓包分析](http://blog.poetries.top/2017/11/04/fiddler/)
