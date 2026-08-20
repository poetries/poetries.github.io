---
title: jQuery基础之插件（六）
date: 2016-08-07 22:10:08
tags: jQuery
categories: Front-End
---

- 什么是插件
 插件(`Plugin`)也称为`jQuery`的扩展。以``jQuery核心代码为基础编写的符合一定规范的应用程序。通过`js文件的方式引用。
<!--more-->
- 插件分为哪几类
  - UI类、表单及验证类、输入类、特效类、`Ajax`类、滑动类、图形图像类、导航类、综合工具类、动画类等等
	
- 引入插件的步骤
	- a.引入`jquery.js`文件，而且在所以插件之前引入
	- b.引入插件
	- c.引入插件相关文件，比如皮肤、中文包

- 使用插件（验证`demo`）

- 如何自定义插件：	
	
  - 插件形式分为3类：
	- a. 封装对象方法插件
	- b. 封装全局函数插件
	- c. 选择器插件(类似于.find())

  - 自定义插件的规范（解决各种插件的冲突和错误，增加成功率）
	- 命名：`jquery.插件名.js`
	- 所有的新方法附加在`jquery.fn`对象上面，所有新功能附加在`jquery`上
	- 所有的方法或插件必须用分号结尾，避免出问题
	-  插件必须返回`jQuery`对象，便于链式连缀
	-  避免插件内部使用`$`，如果要使用，请传递`jQuery`(`$`并不是总等于`jQuery`，另外其他`js`框架也可能使用`$`)
	- 插件中的`this`应该指向`jQuery`对象
	- 使用`this.each()`迭代元素

- 自定义插件案例
    
	- 为了方便用户创建插件，`jQuery`提供了 `jQuery.extend()` 和 `jQuery.fn.extend()`
	- `jQuery.extend()`：创建工具函数或者是选择器
	- `jQuery.fn.extend()`：创建`jQuery`对象命令  （`fn`相当于`prototype`的别名）

	- 自定义`jQuery`函数：

```javascript
(function($){
		$.extend({
			test: function(){
				alert("hello plugin");
			}
		})
	})(jQuery);
```

- 自定义`jQuery`命令：

 形式1：
	  
```javascript
(function($){
			$.fn.extend({
				say : function(){
					alert("hello plugin");
				}
			})
		})(jQuery);
```

形式2：

```javascript
(function($){
			$.fn.say = function(){
					alert("hello plugin");
			};
			
		})(jQuery);
```


	
