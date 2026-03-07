---
title: TortoiseSVN的基使用方法
date: 2016-07-08 15:25:20
tags: SVN
categories: VCS
---


#### 签出源代码到本机

在本机创建文件夹`StartKit`，右键点击`Checkout`，弹出如下图的窗体：
<!--more-->
![enter description here][5]

文本框中输入`svn server`中的代码库的地址，其他默认，点击OK按钮,就开始签出源代码了

上图中的`Checkout Depth`，有4个选项，分别是迁出全部、只签出下一级子目录和文件、只签出文件、只签出空项目，默认的是第一项。上面的例子中，我们也可以使用web的方式访问代码库，在浏览器中输入`http://zt.net.henu.edu.cn/svn/StartKit/`
这时候也会弹出对话框，要求输入用户名和密码，通过验证后即可浏览代码库中的内容。

到此，源代码已经成功签出到刚才新建的StartKit目录中

打开StartKit目录，可以看到如下图的文件夹结构：

![enter description here][6]

一旦你对文件或文件夹做了任何修改，那么文件或文件夹的显示图片机会发生变化

![enter description here][7]

- **不同状态所对应的图片**

![enter description here][8]

---

#### 提交修改过的文件到SVN服务器

注意：提交源代码到服务器时，一定确保本机的代码是最新版本，否则可能提交失败，或者造成版本冲突

![enter description here][9]

- 添加新文件到SVN服务器

点击`TortoiseSVN=>>Add`；再`SVN Commit`这个文件一次，才可以将其真正提交到SVN服务器上的代码库中

更新本机代码与SVN服务器上最新的版本一致

只要在需要更新的文件夹上点击右键或在该文件下的空白处点击右键，点击`SVN Update`，就可以

注意：更新操作可能会因为版本冲突而失败，这是可以使用合并【`Merge`】或其他方法解决；也可能因为锁定【`Get Lock`】而失败，这是需要先解锁【`Release Lock`】。

- **重命名文件或文件夹，并将修改提交到SVN服务器**

要在需要重命名的文件或文件夹上点击右键，点击`TortiseSVN=>>Rename`…，在弹出的窗体中输入新名称，点击OK按钮，就可以了。此方法也不是直接重命名，而是将该文件或文件夹的名称标记为重命名后名称，也需要我们使用`SVN Commit`提交到SVN服务器后才真正重命名

- **删除文件或文件夹，并将修改提交到SVN服务器**

最简单就是，你直接删除文件或文件夹，然后使用`SVN Commit`提交更新到SVN服务器。另外一种方法是在你要删除的文件或文件夹上点击右键`=>>TortoiseSVN=>>Delete`删除,此方法也不是直接删除，而是将该文件或文件夹的状态置为删除，也需要我们使用SVN Commit提交到SVN服务器后才真正删除。


![enter description here][10]


 
  [5]: http://blog.chinaunix.net/attachment/201402/19/27004869_13927803776NBs.png
  [6]: http://blog.chinaunix.net/attachment/201402/19/27004869_1392780401u5bf.png
  [7]: http://blog.chinaunix.net/attachment/201402/19/27004869_13927804137Lrz.png
  [8]: http://blog.chinaunix.net/attachment/201402/19/27004869_1392780423j7W7.png
  [9]: http://blog.chinaunix.net/attachment/201402/19/27004869_139278051015SO.png
  [10]:http://blog.chinaunix.net/attachment/201402/19/27004869_1392780878aoOo.png
