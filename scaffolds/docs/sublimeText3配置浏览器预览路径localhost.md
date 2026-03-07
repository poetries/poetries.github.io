---
title: sublimeText3配置浏览器预览路径localhost
date: 2016-05-29 08:45:35
tags: sublime
categories: 工欲善其事必先利其器
---

Sublime Text 2 Sublime Text 3 都可以使用:

<!--more-->
### 菜单 --> Tools --> New Pugin

清掉内容, 添加如下代码
```
import sublime, sublime_plugin
import webbrowser

url_map = {
    'E:\phpStudy\WWW' : 'http://localhost',
}

class OpenBrowserCommand(sublime_plugin.TextCommand):
    def run(self,edit):
        window = sublime.active_window()
        window.run_command('save')
        url = self.view.file_name()
        flag = False
        for path, domain in url_map.items():
            if url.startswith(path):
                url = url.replace(path, domain).replace('\\', '/')
                flag = True
                break
        if not flag:
            url = 'file://' + url
        webbrowser.open_new(url)
```

然后保存文件, 保存的路径类似如下:

`C:\Users\XXXX\AppData\Roaming\Sublime Text 3\Packages\User\open_browser.py`

XXXX 为 Windows 7 系统用户, 该目录可以直接通过 Sublime 菜单找到

### 菜单 --> Preferences --> Browse Packages 点击后打开的就是该目录



### 注意:
    E:\phpStudy\WWW 请替换成你 Web 文档根目录所在路径


绑定快捷键

### 菜单 --> Preferences --> Key Bindings-User

添加如下代码

`[{ "keys": ["ctrl+b"], "command": "open_browser" }]`
