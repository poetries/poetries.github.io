---
title: Git开发流程分支管理方案实战梳理
description: 完整梳理 Git 开发流程的分支管理方案，讲清 master 与 develop 的职责边界、feature/release/fixbug 三类临时分支的开关时机，以及 --no-ff 合并为什么必须加。
date: 2021-11-26 16:16:12
tags:
  - Git
  - 分支管理
  - 团队协作
categories: VCS
---

团队人数从两三个涨到六七个之后，仓库的提交记录通常会先乱起来。有人把半成品直接推到 master，有人发版前才发现某个功能还没测完，想 revert 一下又怕把别人的提交一起带走。这类问题很少是 Git 命令用得不对，多数时候是压根没约定「哪条分支上的代码代表什么状态」。

这篇把 git flow 这套分支模型从头梳理一遍。master 和 develop 分别承担什么、feature 与 release 与 fixbug 三类临时分支该在什么时机开、什么时机删，以及 `--no-ff` 这个参数到底改变了什么。读完你可以直接照着在自己的仓库里把规矩立起来。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 为什么要先定分支模型，再谈 Git 命令
- 主分支 master 的定位与打 tag 的时机
- 开发分支 develop 如何承接日常提交
- `--no-ff` 与快进式合并的区别，以及它对回滚的影响
- 功能分支 feature 的命名与生命周期
- 预发布分支 release 为什么要合并两次
- 修补分支 fixbug 与 feature 的关键差异
- 这套模型在什么规模下会显得太重

## 一、先想清楚分支是给谁看的

分支模型看起来是给开发者用的，其实真正的服务对象是「不写代码的人」。

测试同学要知道去哪个环境验，运维要知道拉哪个 commit 打包，产品要知道这个版本包含了哪些需求。如果仓库里只有一条 master，这三个问题的答案全靠口头传递，出错是迟早的事。

所以定分支模型的第一步，不是背命令，而是给每条分支写一句话的定义。定义写得越死，后面吵架越少。git flow 这套方案给出的答案是两条常设分支加三类临时分支，常设的那两条永远不删，临时的那三类用完就删。

## 二、主分支 master

代码库应该有一个、且仅有一个主分支，就是 master。所有提供给用户使用的正式版本，都在这条分支上发布。

这里的关键约束是「master 上的任意一个 commit 都应该是可以直接上线的」。做不到这一点，master 就失去了作为发布基线的意义，回滚的时候你没办法闭着眼睛往前退一个 commit。

每次发布打一个 `tag`，例如 `tag v1.0.0`、`tag v2.0.0`。

```shell
# 发布时在 master 上打一个带说明的标签
git tag -a v1.0.0 -m "release v1.0.0"
git push origin v1.0.0
```

`-a` 表示创建一个附注标签（annotated tag），它会作为一个独立对象存进 Git 数据库，带上打标签的人、时间和说明。相对的，不加 `-a` 的轻量标签只是一个指向 commit 的别名，查不到是谁在什么时候打的。发布用的标签建议一律用 `-a`，出问题时这几行元信息很值钱。

顺带说一句，`git tag -a v1.0.0` 如果不带 `-m`，Git 会打开编辑器让你写说明，在 CI 脚本里执行会直接卡住。这个我踩过，脚本里记得把 `-m` 补上。

![Git 分支模型中 master 主分支与版本 tag 的关系示意](https://blog.poetries.top/img/static/images/20211126173718.png)

## 三、开发分支 develop

主分支只用来发布重大版本，日常开发应该在另一条分支上完成。开发用的这条分支叫做 develop。

这条分支可以用来生成代码的最新隔夜版本（nightly）。团队里所有人的日常提交最终都会汇聚到这里，它代表的是「下一个版本的当前进度」。如果想正式对外发布，就在 master 分支上，对 develop 分支进行合并（merge）。

创建 develop 分支：

```shell
git checkout -b develop master
```

把 develop 发布到 master：

```shell
# 切换到 master 分支
git checkout master

# 对 develop 分支进行合并
git merge --no-ff develop
```

这两条命令看着简单，真正有讲究的是第二条里的 `--no-ff`。

![develop 分支与 master 分支的合并关系示意](https://blog.poetries.top/img/static/images/20211126173805.png)

## 四、--no-ff 到底改变了什么

默认情况下，Git 执行的是「快进式合并」（fast-forward merge）。当 master 的提交历史完全是 develop 的祖先时，Git 不会生成新的提交，只是把 master 这个指针直接挪到 develop 的位置上。

结果就是合并这件事在历史里消失了。你事后去看 master 的 `git log`，只能看到一串平铺的提交，完全分辨不出哪几个 commit 属于同一次发布。

加上 `--no-ff` 之后，Git 会执行正常合并，在 master 上生成一个新的合并节点，这个节点有两个父提交，一个指向合并前的 master，一个指向 develop。

这个差别在回滚的时候才真正体现价值。有了合并节点，撤销整次发布就是 `git revert -m 1 <合并commit>` 一条命令的事，`-m 1` 表示保留第一个父提交那条线。没有合并节点的话，你得先自己数清楚这次发布到底涉及哪些 commit，再一个一个 revert，中间漏一个就是线上事故的开始。

想看清楚这条主线，可以用这个命令：

```shell
git log --graph --oneline --first-parent master
```

`--first-parent` 会让 Git 只沿着每个合并节点的第一个父提交走。在 `--no-ff` 的模型下，这条命令输出的就是一份干净的发布流水账，一行一个版本。

所以为了保证版本演进的清晰，团队约定里应该把 `--no-ff` 写死。嫌每次敲麻烦的话，可以在仓库配置里关掉快进合并：

```shell
git config merge.ff false
```

## 五、临时性分支

版本库的两条主要分支是 master 和 develop，前者用于正式发布，后者用于日常开发。常设分支只需要这两条就够了。

但除了常设分支以外，还有一些临时性分支，用于应对特定目的的版本开发。临时性分支主要有三种：

- 功能分支（feature）
- 预发布分支（release）
- 修补 bug 分支（fixbug）

这三种分支都属于临时性需要，使用完以后应该删除，使得代码库的常设分支始终只有 master 和 develop。

一个个来看这三种临时分支。

### 5.1 功能分支 feature

功能分支是为了开发某种特定功能，从 develop 分支上面分出来的。开发完成后，要再并入 develop。

功能分支的名字可以采用 `feature-*` 的形式命名。

```shell
# 创建一个功能分支
git checkout -b feature-user-profile develop

# 开发完成后，将功能分支合并到 develop 分支
git checkout develop
git merge --no-ff feature-user-profile

# 删除 feature 分支
git branch -d feature-user-profile
```

这里有个坑要注意，分支名尽量用英文。原文示例里用的是 `feature-开发一个新功能` 这种中文名，Git 本身支持，但一旦经过 CI 脚本、Docker 构建参数或者某些老版本的 Web 界面，中文分支名很容易被转成一串百分号编码，排查起来非常费劲。

删除用的是 `git branch -d` 而不是 `-D`。小写的 `-d` 会检查这条分支是否已经被合并进当前分支，没合并就拒绝删除；大写的 `-D` 是强制删除，不做任何检查。日常一律用 `-d`，它能在你忘记合并的时候拦你一次。

### 5.2 预发布分支 release

预发布分支指的是发布正式版本之前（即合并到 master 分支之前），我们可能需要有一个预发布的版本进行测试。

预发布分支是从 develop 分支上面分出来的，预发布结束以后，必须合并进 develop 和 master 两条分支。它的命名可以采用 `release-*` 的形式。

```shell
# 创建一个预发布分支
git checkout -b release-1.2.0 develop

# 确认没有问题后，合并到 master 分支
git checkout master
git merge --no-ff release-1.2.0

# 对合并生成的新节点，做一个标签
git tag -a v1.2.0 -m "release 1.2.0"

# 再合并到 develop 分支
git checkout develop
git merge --no-ff release-1.2.0

# 最后，删除预发布分支
git branch -d release-1.2.0
```

很多人第一次看到这段会问，既然最后都要合进 master，为什么还要多此一举再往 develop 合一次？

原因在于 release 分支存在期间是会产生新提交的。测试提出的小问题、改版本号、更新 changelog，这些改动都发生在 release 分支上，develop 那边并不知情。如果只往 master 合，下一个版本从 develop 拉出来的时候，这些修复就凭空消失了，而且往往要等到线上复现同一个 bug 才会被发现。

回到这条规矩本身，release 分支的存在意义是「冻结功能范围」。它一旦拉出来，develop 就可以继续接收下一个版本的功能，两边互不干扰。这是 git flow 相比单条开发分支最实在的收益。

### 5.3 修补 bug 分支 fixbug

软件正式发布以后，难免会出现 bug。这时就需要创建一个分支，进行 bug 修补。

修补 bug 分支是从 master 分支上面分出来的，修补结束以后，再合并进 master 和 develop。它的命名可以采用 `fixbug-*` 的形式。

```shell
# 创建一个修补 bug 分支
git checkout -b fixbug-0.1 master

# 修补结束后，合并到 master 分支
git checkout master
git merge --no-ff fixbug-0.1
git tag -a v0.1.1 -m "hotfix 0.1.1"

# 再合并到 develop 分支
git checkout develop
git merge --no-ff fixbug-0.1

# 最后，删除修补 bug 分支
git branch -d fixbug-0.1
```

fixbug 和 feature 长得很像，唯一的区别就在起点，一个从 master 拉，一个从 develop 拉。

这一个字的差别恰恰是线上救火的全部意义所在。线上跑的是 master 的代码，develop 上可能已经堆了三个还没发的新功能。如果你图省事从 develop 拉分支修 bug，修完往 master 一合，那三个没测过的功能就跟着上线了。

从 master 拉分支修 bug，这条规矩再赶时间也不能破。

## 六、这套模型什么时候会嫌重

git flow 是 2010 年 Vincent Driessen 在那篇 A successful Git branching model 里提出来的，背景是有明确版本号、需要同时维护多个已发布版本的桌面软件或客户端项目。

放到今天的前端项目上，它有时候确实偏重。如果你的团队一天发好几次版，走的是持续部署，那 release 分支这一层基本是空转的，每次拉出来当天就合掉，纯粹增加操作成本。这种场景下 GitHub Flow 更合适，只保留一条 master 加若干短命的功能分支，功能分支通过 PR 合入并自动部署。

作者本人在 2020 年也给原文加过一段附注，提到对于持续交付的产品，更简单的工作流比 git flow 更合适。这块的判断标准其实不在团队人数，而在于「你需不需要同时维护多个线上版本」。需要，就上 git flow；只维护最新一个版本，GitHub Flow 或者 trunk-based 会轻松很多。

不是说 git flow 不行，而是它解决的问题你得真的有。关于 Git 日常命令的更多整理，可以顺带看看 [Git 常用操作回顾](https://feinterview.poetries.top/blog/git-review)。

## 总结

这套模型压缩成几句话就是：master 只放能上线的代码并且每次发布打 tag，develop 承接日常提交，feature 从 develop 拉、fixbug 从 master 拉、release 从 develop 拉但要往两边合，所有合并加 `--no-ff`。

真正需要记牢的只有两个点。一个是 fixbug 必须从 master 拉，否则会把未测试的功能带上线；另一个是 `--no-ff` 生成的合并节点是整套模型可回滚的前提，省掉它，前面所有约定的收益都会打折。

至于要不要用完整的 git flow，先问自己需不需要同时维护多个已发布版本。答案是否定的话，直接上更轻的工作流反而更省事。

## 参考

- [A successful Git branching model](https://nvie.com/posts/a-successful-git-branching-model/)
- [Git 官方文档 git-merge](https://git-scm.com/docs/git-merge)
- [Git 官方文档 git-tag](https://git-scm.com/docs/git-tag)
- [Git 分支管理策略 阮一峰](https://www.ruanyifeng.com/blog/2012/07/git.html)
- [前端进阶之旅](https://interview.poetries.top)
