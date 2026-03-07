---
title: python 3.5下xadmin的使用方法
date: 2017-05-05 11:35:24
tags: python
categories: Back-end
---

### 安装方法
- 复制 xadmin 目录到你的项目
- `pip install httplib2 django-formtools django-crispy-forms`
```python
# setting.py
INSTALLED_APPS = [
    ...,
    'xadmin',
    'crispy_forms',
]

```

```python
# urls.py
import xadmin

urlpatterns = [
    url(r'^admin/', xadmin.site.urls)
]
```

### xadmin 「自带的」BUG 修复方法
当我们重写了 Django 的 User 表后，xadmin 就会出现 bug。
master 分支里，我用 `users/models.py` 里的 `UserProfile` 重写了自带的 `auth_user` 表。
这里会出现两个 BUG：
- xadmin 无法管理重写后的User表
- 在 xadmin 后台页面点击右上角修改密码时，会报错

[点击查看解决办法](http://www.cnblogs.com/vincenshen/articles/6528344.html)


