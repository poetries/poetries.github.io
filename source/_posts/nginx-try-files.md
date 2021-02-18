---
title: 浅析Nginx之try_files
date: 2021-02-08 09:58:20
tags: 
   - Nginx
   - 部署
categories: Back-end
---

> `Nginx`的配置语法灵活，可控制度非常高。在0.7以后的版本中加入了一个`try_files`指令，配合命名`location`，可以部分替代原本常用的`rewrite`配置方式，提高解析效率。



### **try_files指令：**

- 语法：`try_files file ... uri` 或 `try_files file ... = code`
- 默认值：无
- 作用域：`server location`

![image-20210208093424322](http://img-repo.poetries.top/images/image-20210208093424322.png)

- 当用户在浏览器输入`blog.zsc.com`或者`blog.zsc.com/index.html`或者`blog.zsc.com/index.php`时，根据`try_files`规则，可以找到该域名对应的`web`页面
- 当用户在浏览器输入`blog.zsc.com/fjdklfjaldkfjlads/zjklfjdslfjds`等不存在的域名时，根据`try_files`规则，`“$uri”`和`“$uri”`都不符合，所以`nginx`就自动把域名转换为`blog.zsc.com/index.php`，然后将`blog.zsc.com/index.php`页面内容反馈给客户端。
- `try_files`的作用是按顺序检查文件是否存在，返回第一个找到的文件或文件夹（结尾加斜线表示为文件夹），如果所有的文件或文件夹都找不到，会进行一个内部重定向到最后一个参数。

> 需要注意的是，只有最后一个参数可以引起一个内部重定向，之前的参数只设置内部URI的指向（如下图）。最后一个参数是回退`URI`且必须存在，否则会出现内部`500`错误。命名的`location`也可以使用在最后一个参数中。与`rewrite`指令不同，如果回退`URI`不是命名的`location`那么`$args`不会自动保留，如果你想保留`$args`，则必须明确声明。

![image-20210208093626879](http://img-repo.poetries.top/images/image-20210208093626879.png)



> 将`try_files`的最后一个参数设置为`@tornado`（`@`，内部重定向时会用到），当`“$uri”`找不到时，就做一个内部重定向，将请求抛给`“location @tornado”
