---
title: 在sublime-text中设置浏览器预览
date: 2016-05-28 14:24:49
tags: sublime
categories: 工欲善其事必先利其器
---

配置在Chrome,Firefox中打开
<!--more-->
安装 SideBarEnhancements

然后通过ctrl + k, ctrl + b打开侧边栏，在侧边栏的文件中右击，找到 open width -> edit applications

然后在这里边设置firefox打开的方式。


application : 路径要修改为自己默认安装的路径。
```
[
    {"id": "side-bar-files-open-with",
        "children":
        [
            //application firefox
            {
                "caption": "firefox",
                "id": "side-bar-files-open-with-firefox",

                "command": "side_bar_files_open_with",
                "args": {
                            "paths": [],
                            "application": "D:\\Program Files\\Mozilla Firefox\\firefox.exe",
                            "extensions":".*" //any file with extension
                        }
            },

            {"caption":"-"},
            {
                "caption": "chrome",
                "id": "side-bar-files-open-with-chrome",

                "command": "side_bar_files_open_with",
                "args": {
                            "paths": [],
                            "application": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
                            "extensions":".*" //any file with extension
                        }
            }
        ]
    }
]

```

Key bindings -> User

```
[
     { "keys": ["ctrl+shift+c"], "command": "copy_path" },
     { "keys": ["alt+f12"], "command": "open_in_browser" },
     { "keys": ["f12"], "command": "side_bar_files_open_with",
             "args": {
                "paths": [],
                "application": "D:\\Program Files\\Mozilla Firefox\\firefox.exe",
                "extensions":".*" //any file with extension
            } },
    { "keys": ["ctrl+f12"], "command": "side_bar_files_open_with",
            "args": {
                "paths": [],
                "application": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
                "extensions":".*" //any file with extension
            } 
     }     
    
]
```

这样就可以用这三个键在浏览中预览页面了：

F12 : Firefox

alt + F12 : IE

ctrl + F12 : chrome

