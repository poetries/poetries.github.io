---
title: Hexo博客接入gitalk评论系统
date: 2018-11-20 17:09:08
tags: Hexo
categories: Front-End
---

> 官方文档 https://github.com/gitalk/gitalk/blob/master/readme-cn.md

## 一、申请GitHub Application

> https://github.com/settings/applications/new

![](https://poetries1.gitee.io/img-repo/2019/10/226.png)

- `Application name`： # 应用名称，随意
- `Homepage URL`： # 网站URL，如http://blog.poetries.top
- `Application description` # 描述，随意
- `Authorization callback URL`：# 网站URL，http://blog.poetries.top

> 点击注册后，页面跳转如下，其中`Client ID`和`Client Secret`在后面的配置中需要用到，到时复制粘贴即可

## 二、fexo配置主题

这里以我个人博客的主题来配置

> `themes/fexo/layout/_partial/component/`新建一个`gitalk.ejs`

```html
<% if (page.comments && theme.gitalk.enable){ %>
  <div id="gitalk-container"></div>
  <link rel="stylesheet" href="https://unpkg.com/gitalk/dist/gitalk.css">
  <script src="https://unpkg.com/gitalk/dist/gitalk.min.js"></script>
  <script type="text/javascript">
      var gitalk = new Gitalk({
        clientID: '<%=theme.gitalk.ClientID%>',
        clientSecret: '<%=theme.gitalk.ClientSecret%>',
        repo: '<%=theme.gitalk.repo%>',
        owner: '<%=theme.gitalk.githubID%>',
        admin: ['<%=theme.gitalk.adminUser%>'],
        id: location.pathname,
        distractionFreeMode: '<%=theme.gitalk.distractionFreeMode%>'
      })
      gitalk.render('gitalk-container')           
     </script>
<% } %>
```

> 在`themes/fexo/layout/_partial/component/comments.ejs`中加入

```html
<div class="fexo-comments <%= className %>">
  <%- partial('disqus') %>
  <%- partial('duoshuo') %>
  <%- partial('gitalk') %> <!-- 加入上面新建的 -->
</div>
```

> 在`themes/fexo/layout/_partial/article.ejs`中的article文章后面加入 

```html
<!-- 使用gitalk作为评论系统 -->
<%- partial('gitalk') %>
```

> `/theme/fexo/source/css/style.css`中加入

```css
/**gitalk css**/
.gt-header a, .gt-comments a, .gt-popup a{
  border-bottom: none;
}
.gt-container .gt-popup .gt-action.is--active:before{
  top: 0.7em;
}
```

> 在主题配置文件`_config.yml`加入

```bash
# 评论配置
gitalk:
  enable: true
  githubID: poetries
  repo: poetries.github.io   # 例：poetries.github.io
  owner: poetries
  ClientID: ''
  ClientSecret: ''
  adminUser: poetries #指定可初始化评论账户
  distractionFreeMode: true
 ```
  
  然后回到文章页面，刷新页面后授权初始化就看到了
  
  ## 三、next主题配置
  
  > 新建`/layout/_third-party/comments/gitalk.swig`文件，并添加内容
  
  ```html
  {% if page.comments && theme.gitalk.enable %}
  <link rel="stylesheet" href="https://unpkg.com/gitalk/dist/gitalk.css">
  <script src="https://unpkg.com/gitalk/dist/gitalk.min.js"></script>
   <script type="text/javascript">
        var gitalk = new Gitalk({
          clientID: '{{ theme.gitalk.ClientID }}',
          clientSecret: '{{ theme.gitalk.ClientSecret }}',
          repo: '{{ theme.gitalk.repo }}',
          owner: '{{ theme.gitalk.githubID }}',
          admin: ['{{ theme.gitalk.adminUser }}'],
          id: location.pathname,
          distractionFreeMode: '{{ theme.gitalk.distractionFreeMode }}'
        })
        gitalk.render('gitalk-container')           
       </script>
{% endif %}
```

> 修改`/layout/_partials/comments.swig`，添加内容如下，与前面的`elseif`同一级别上

```
{% elseif theme.gitalk.enable %}
 <div id="gitalk-container"></div>
 ```
 
 > 修改`layout/_third-party/comments/index.swig`，在最后一行添加内容：
 
 ```
 {% include 'gitalk.swig' %}
```

> 新建`/source/css/_common/components/third-party/gitalk.styl`文件，添加内容：

```css
.gt-header a, .gt-comments a, .gt-popup a
  border-bottom: none;
.gt-container .gt-popup .gt-action.is--active:before
  top: 0.7em;
```

> 修改`/source/css/_common/components/third-party/third-party.styl`，在最后一行上添加内容，引入样式

```
@import "gitalk";
```

> 在主题配置文件`next/_config.yml`中添加如下内容

```bash
# 评论配置
gitalk:
  enable: true
  githubID: poetries
  repo: poetries.github.io   # 例：poetries.github.io
  owner: poetries
  ClientID: ''
  ClientSecret: ''
  adminUser: poetries #指定可初始化评论账户
  distractionFreeMode: true
 ```
