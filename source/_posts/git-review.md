---
title: Git操作清单 从撤销到rebase的日常命令梳理
description: 按「出错了怎么救」的思路梳理 Git 常用操作，覆盖工作区暂存区回退、commit 修补、reset 与 revert 的区别、pull --rebase 与 merge --no-ff、SSH 配置和 fork 同步。
date: 2019-08-31 19:50:12
tags:
  - Git
  - 版本控制
categories: VCS
---

Git 的命令我一直是「用到再查」的状态，直到有一次把改了一整天的代码 `git reset --hard` 掉，才认真坐下来把这些命令的边界搞清楚。后来发现绝大多数慌张的时刻，起因都是同一个问题：不知道自己现在这次改动躺在哪个区域里，是工作区、暂存区，还是已经进了本地仓库。

搞清楚这四个区域之后，撤销操作就变成了一道选择题，选哪条命令看的是「我要退回到哪一层」。这篇按这个思路把日常会用到的 Git 命令过一遍，重点放在出错之后怎么救，以及 `rebase` 和 `merge` 这两条路各自适合什么场景。

如果你想看的是分支模型层面的约定，可以配合[Git Flow 工作流总结](https://feinterview.poetries.top/blog/git-flow-summary)一起看，那篇讲的是团队怎么分支，这篇讲的是命令怎么用。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- Git 的四个区域，以及每条命令在这四个区域之间怎么搬运数据
- `git add` 之后反悔了，两种场景分别怎么退回去
- commit 信息写错、漏提交文件、提交了不该提交的东西，分别怎么补救
- `git reset` 和 `git revert` 到底差在哪，什么时候不能用 reset
- `git pull --rebase` 和 `git merge --no-ff` 这对相反的策略各自解决什么问题
- SSH 公钥的生成与配置
- `git stash` 暂存现场的用法
- `.gitignore` 改了不生效、克隆时文件名过长这类杂症
- 怎么把 fork 出来的仓库同步上游更新

## 一、必备知识点

先把地图铺开。

![Git 工作区、暂存区、本地仓库与远程仓库的关系](https://upload-images.jianshu.io/upload_images/1480597-e53fe40cce1f8eeb.png)

![Git 常用命令在四个区域之间的流转](https://upload-images.jianshu.io/upload_images/1480597-d907599b730fdeb0.png)

这两张图说的是同一件事，四个区域各自是什么：

- `Remote`：远程主仓库
- `Repository/History`：本地仓库
- `Stage/Index`：Git 追踪树，也就是暂存区
- `workspace`：本地工作区，即你编辑器里看到的代码

代码从左到右走一遍就是完整的提交流程：在工作区改完，`git add` 送进暂存区，`git commit` 落到本地仓库，`git push` 推到远程。

反过来，所有的「撤销」都是在问同一个问题：我要把改动从哪一层退回到哪一层。想通这一点，下面的命令就不用死记了。

## 二、git add 提交到暂存区，出错怎么办

一般的代码提交流程是这样：工作区改动，`git status` 查看状态，`git add .` 把所有修改加入暂存区，`git commit -m "提交描述"` 提交到本地仓库，`git push` 更新到远程仓库。

在这条链路上反悔，分两种情况。

**场景 1**

改乱了工作区某个文件，还没 `add`，想直接丢弃修改：

```bash
# 丢弃工作区的修改
git checkout -- <文件名>
```

这条命令是用暂存区（或者最近一次 commit）的版本覆盖工作区文件，被覆盖的内容 Git 从来没记录过，找不回来。所以执行之前一定要确认这些改动真的不要了。

**场景 2**

不但改乱了内容，还 `git add` 进了暂存区。这时候分两步：先用 `git reset HEAD <文件名>` 把它从暂存区退回工作区，就回到了场景 1；然后按场景 1 处理。

这两条命令都用了 `checkout` 和 `reset` 这种一词多义的老接口，Git 2.23 之后提供了语义更清楚的替代写法：`git restore <文件名>` 对应场景 1，`git restore --staged <文件名>` 对应场景 2 的第一步。老命令仍然可用，新项目建议直接上新的，少一次「这个 checkout 到底在干嘛」的思考。

## 三、git commit 提交到本地仓库，出错怎么办

### 3.1 提交信息写错了

改最近一次 commit 的信息：

```bash
git commit --amend -m "新提交消息"
```

`--amend` 是把这次提交重写一遍，生成的是一个全新的 commit 对象，哈希会变。只在还没 push 的时候用它，已经推到远程再 amend，别人拉下来就会冲突。

### 3.2 漏提交了文件

commit 完发现有个文件忘了带上，有两种解决方案。

方案一，再提交一次：

```bash
git commit -m "提交消息"
```

代价是 Git 上会出现两次 commit，历史里多一条没什么信息量的记录。

方案二，把遗漏的文件补到之前那次 commit 上：

```bash
git add missed-file    # missed-file 为遗漏提交的文件
git commit --amend --no-edit
```

`--no-edit` 表示提交消息保持不变，不弹编辑器。最终在 Git 上仅为一次提交，历史干净。

小改动我基本都走方案二，但同样受前面那条限制，push 之前用。

### 3.3 提交了错误文件，想回退版本

这里有两条路，`reset` 和 `revert`，它们的差别是这一节的重点。

**`git reset` 删除指定的 commit**

```bash
# 修改版本库，修改暂存区，修改工作区

# 把暂存区的修改撤销掉（unstage），重新放回工作区
git reset HEAD <文件名>

# 版本回退，回退到特定的 commit_id 版本
# 可以通过 git log 查看提交历史，确定要回退到哪个版本（commit 之后的即为 ID）
git reset --hard commit_id

# 将版本库回退 1 个版本
# 不仅把本地版本库的头指针重置到指定版本，也会重置暂存区，并把工作区代码一起回退
git reset --hard HEAD~1

# 修改版本库，保留暂存区，保留工作区
# 软回退 1 个版本，头指针重置到指定版本，且把这次提交之后的所有变更移动到暂存区
git reset --soft HEAD~1
```

三个参数的区别记住一句话就行：`--soft` 只动版本库，`--mixed`（默认值）动版本库和暂存区，`--hard` 三个区域全动。

`--hard` 是这份清单里最危险的一条，它会直接抹掉工作区的未提交改动。这个我踩过，当时以为只是回退提交记录，结果一天的活没了。真的执行错了也别急着放弃，`git reflog` 里还留着 HEAD 的移动记录，能找回刚才那个 commit 的哈希再 `reset` 回去，前提是那些改动至少 commit 过一次。没 commit 过的工作区内容，谁也救不了。

**`git revert` 撤销某次操作**

这次操作之前和之后的 commit 和 history 都会保留，撤销动作本身也会作为一次新的提交记录下来。

```bash
# 撤销前一次 commit
git revert HEAD

# 撤销前前一次 commit
git revert HEAD^

# 撤销指定的版本（比如 fa042ce57ebbe5bb9c8db709f719cec2c58ee7ff）
# 撤销也会作为一次提交进行保存
git revert commit
```

`git revert` 是提交一个新的版本，把需要 revert 的那个版本的内容反向修改回去，版本号继续递增，不影响之前提交的内容。

**git revert 和 git reset 的区别**

- `git revert` 是用一次新的 commit 来回滚之前的 commit，`git reset` 是直接删除指定的 commit
- 单看回滚这一步，两者效果差不多。区别出现在日后 merge 老分支的时候。`git revert` 是用一次逆向的 commit 中和之前的提交，日后合并老 branch 时，这部分改变不会再次出现；而 `git reset` 是直接把某些 commit 在某个 branch 上删掉，再和老 branch 合并时，这些被回滚的 commit 还会被引入
- `git reset` 是把 HEAD 往后移，`git revert` 是 HEAD 继续往前走，只是新 commit 的内容和要 revert 的内容正好相反，能够抵消掉被 revert 的部分

实际用的时候有一条简单的判断：**改动已经 push 到共享分支上了，就只能用 revert**。因为 reset 会改写历史，你本地删掉的那些 commit 在别人的仓库里还在，下次同步会互相打架。只在自己本地没推出去的分支上，才可以放心 reset。

## 四、常用命令

### 4.1 初始开发的 git 操作流程

新进项目时基本就是这一串：

- 克隆最新主分支项目代码 `git clone 地址`
- 创建本地分支 `git branch 分支名`
- 查看本地分支 `git branch`
- 查看远程分支 `git branch -a`
- 切换分支 `git checkout 分支名`（一般修改未提交则无法切换，大小写问题经常会有，可强制切换 `git checkout 分支名 -f`，非必须慎用）
- 将本地分支推送到远程分支 `git push <远程仓库> <本地分支>:<远程分支>`

强制切换那条要格外小心，`-f` 会丢掉未提交的改动。有改动又想切分支，正确做法是先 `git stash` 收起来，后面第七节会讲。

### 4.2 git fetch

把某个远程主机的更新全部或按分支取回本地，此时只更新了 Repository，取回的代码对你本地的开发代码没有影响。想彻底更新还需要手动合并，或者直接用 `git pull`。

平时想看看远程有什么新东西又不想动自己的代码，`fetch` 是最安全的选择。

### 4.3 git pull

拉取远程主机某分支的更新，再与本地的指定分支合并，相当于 `fetch` 加上了合并分支的操作。

### 4.4 git push

将本地分支的更新推送到远程主机，命令格式与 `git pull` 相似。

### 4.5 分支操作

这一段是纯清单，用到查一下就行：

- 下载指定分支：`git clone -b <分支名> <仓库地址>`
- 拉取远程新分支：`git checkout -b serverfix origin/serverfix`
- 合并本地分支：`git merge hotfix`（将 `hotfix` 分支合并到当前分支）
- 合并远程分支：`git merge origin/serverfix`
- 删除本地分支：`git branch -d hotfix`
- 删除远程分支：`git push origin --delete serverfix`
- 上传新命名的本地分支：`git push origin newName`
- 创建新分支：`git branch branchName`
- 切换到新分支：`git checkout branchName`
- 创建并切换分支：`git checkout -b branchName`（相当于以上两条命令的合并）
- 查看本地分支：`git branch`
- 查看远程仓库所有分支：`git branch -a`
- 本地分支重命名：`git branch -m oldName newName`
- 把修改后的本地分支与远程分支关联：`git branch --set-upstream-to origin/newName`

删除本地分支时 `-d` 会检查这个分支是否已经合并过，没合并会拒绝删除，这是一道保护。确实要删没合并的分支才用 `-D`。

同样地，Git 2.23 之后 `git switch <分支名>` 和 `git switch -c <新分支>` 是更清楚的写法，把「切分支」从 `checkout` 里独立了出来。

## 五、优化操作

### 5.1 拉取代码用 pull --rebase

团队协作时，假设你和同伴在本地分别有各自的新提交，而同伴先于你 push 了代码到远程分支，所以你必须先执行 `git pull` 获取同伴的提交，然后才能 push 自己的提交。

按照 Git 的默认策略，如果远程分支和本地分支之间的提交线图有分叉（即不是 fast-forwarded），Git 会执行一次 merge 操作，因此产生一次没意义的提交记录，把线图搞得很乱。

其实在 pull 的时候加上 `--rebase` 就能很好地解决这个问题。加上这个参数的作用是，提交线图有分叉的话，Git 会用 rebase 策略代替默认的 merge 策略。

假设提交线图在执行 pull 前是这样的：

```
        A---B---C  remotes/origin/master
       /
D---E---F---G  master
```

如果是执行 `git pull` 后，提交线图会变成这样：

```
        A---B---C  remotes/origin/master
       /         \
D---E---F---G------H  master
```

结果多出了 H 这个没必要的提交记录。如果是执行 `git pull --rebase` 的话，提交线图就会变成这样：

```
                remotes/origin/master
                    |
D---E---A---B---C---F'---G'  master
```

F、G 两个提交通过 rebase 方式重新拼接在 C 之后，多余的分叉去掉了，目的达到。

多数时候使用 `git pull --rebase` 是为了让提交线图更好看，方便 code review。

不过如果你对 Git 还不是十分熟练，我的建议是多练几次再用，因为 rebase 在 Git 里算得上是「危险行为」，它改写的是提交历史。另外还要注意，`git pull --rebase` 比直接 pull 更容易产生冲突，而且是逐个 commit 地冲突，如果预期冲突比较多的话，建议还是直接 pull。

两条等式记一下：

```
git pull = git fetch + git merge
git pull --rebase = git fetch + git rebase
```

想每次都默认走 rebase，可以配一次 `git config --global pull.rebase true`，省得每回都加参数。

### 5.2 合代码用 merge --no-ff

上面的 `git pull --rebase` 目的是修整提交线图，让它形成一条直线；而 `git merge --no-ff <branch-name>` 偏偏是反行其道，刻意弄出分叉。

那这两个策略不是自相矛盾吗？

其实针对的场景不一样。前者处理的是「同一条线上的并行开发」，那些分叉纯属噪声；后者处理的是「一个功能分支的合入」，这个分叉是有信息量的，它告诉别人这一串提交是为了同一件事。

假设你在本地准备合并两个分支，而刚好这两个分支是 fast-forwarded 的，直接合并后你得到一条直线，这样没什么坏处，但如果你想更清晰地告诉同伴这一系列提交都是为了实现同一个目的，就可以刻意制造一次分叉。

执行 `git merge --no-ff <branch-name>` 的结果大概是这样：

![使用 merge --no-ff 之后清晰的分叉提交线图](https://upload-images.jianshu.io/upload_images/1480597-140cfe6932a62a57.png)

中间的分叉线路很清晰地显示这些提交都是为了实现 complete adjusting user domains and tags 这件事。

在合并分支之前（假设要在本地把 `feature` 合并到 `dev`），先检查 `feature` 是否「部分落后」于远程 `dev`：

```bash
git checkout dev
git pull            # 更新 dev 分支
git log feature..dev
```

如果没有输出任何提交信息，表示 `feature` 对于 `dev` 是 up-to-date 的。如果有输出，却马上执行了 `git merge --no-ff`，提交线图会变成这样：

![feature 落后于 dev 时直接 merge 产生的混乱线图](https://upload-images.jianshu.io/upload_images/1480597-6d83bae1d4f45a86.png)

所以这时在合并前，我通常会先执行：

```bash
git checkout feature
git rebase dev
```

这样就可以把 `feature` 重新拼接到更新后的 `dev` 之后，然后再合并，最终得到一个干净舒服的提交线图。

再提醒一次，rebase 是「危险行为」，建议你足够熟悉 Git 时才这么做，否则得不偿失。判断标准很实用：只 rebase 那些还没推给别人的提交。

**这一节的结论**

使用 `git pull --rebase` 和 `git merge --no-ff`，跟直接使用 `git pull`、`git merge` 得到的代码内容应该是一样的，差别只在提交历史的形状上。`git pull --rebase` 是把提交线图平坦化，`git merge --no-ff` 则是刻意制造分叉。

## 六、SSH 配置

**1. 查看是否生成了 SSH 公钥**

```bash
cd ~/.ssh
ls
# id_rsa      id_rsa.pub      known_hosts
```

其中 `id_rsa` 是私钥，`id_rsa.pub` 是公钥。私钥不要外传，也别提交进任何仓库。

**2. 如果没有那就开始生成，先设置全局的 user.name 与 user.email**

```bash
git config --list    # 查看是否设置了 user.name 与 user.email，没有的话去设置

# 设置全局的 user.name 与 user.email
git config --global user.name "XX"
git config --global user.email "XX"
```

**3. 输入 ssh-keygen 即可**

也可以写成 `ssh-keygen -t rsa -C "email"`：

```
$ ssh-keygen
Generating public/private rsa key pair.
Enter file in which to save the key (/Users/schacon/.ssh/id_rsa):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /Users/schacon/.ssh/id_rsa.
Your public key has been saved in /Users/schacon/.ssh/id_rsa.pub.
The key fingerprint is:
```

补一句现在的推荐做法。RSA 密钥仍然能用，但 GitHub 官方文档现在推荐 `ssh-keygen -t ed25519 -C "your_email@example.com"`，密钥更短、生成更快、安全性也更好。旧机器上如果 OpenSSH 版本太老不支持 ed25519，再退回 RSA 并把长度指定为 4096。

**4. 生成之后获取公钥内容**

输入 `cat ~/.ssh/id_rsa.pub` 即可，复制从 `ssh-rsa` 一直到结尾这一整段内容：

```
$ cat ~/.ssh/id_rsa.pub
ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAklOUpkDHrfHY17SbrmTIpNLTGK9Tjom/BWDSU
GPl+nafzlHDTYW7hdI4yZ5ew18JH4JW9jbhUFrviQzM7xlELEVf4h9lFX5QVkbPppSwg0cda3
Pbv7kOdJ/MTyBlWXFCR+HAo3FXRitBqxiX1nKhXpHAZsMciLq8V6RjsNAQwdsdMFvSlVK/7XA
t3FaoJoAsncM1Q9x5+3V0Ww68/eIFmb1zuUFljQJKprrX88XypNDvjYNby6vw/Pb0rwert/En
mZ+AW4OZPnTPI89ZPmVMLuayrD2cE86Z/il8b+gw3r3+1nKatmIkjn2so1d01QraTlMqVSsbx
NrRFi9wrf+M7Q== schacon@agadorlaptop.local
```

**5. 打开 GitLab 或者 GitHub，点击头像，找到设置页**

**6. 左侧找到 SSH keys 按钮并点击，输入刚刚复制的公钥即可**

配完可以用 `ssh -T git@github.com` 验证一下，看到欢迎信息就说明通了。

## 七、暂存

`git stash` 用来暂存当前正在进行的工作。比如想 pull 最新代码又不想 commit，或者为了修一个紧急 bug，先 stash 让工作区回到上一个 commit 的状态，改完 bug 之后再 `stash pop` 继续原来的活。

- 添加缓存栈：`git stash`
- 查看缓存栈：`git stash list`
- 弹出缓存栈：`git stash pop`
- 取出特定缓存内容：`git stash apply stash@{1}`

`pop` 和 `apply` 的区别是前者取出后会把这条记录从栈里删掉，后者会保留。不确定能不能干净还原的时候先用 `apply`，稳妥一些。

还有一个容易忽略的点，`git stash` 默认不会收走未被 Git 跟踪的新文件，得加 `-u`。新建了文件又 stash 之后发现它还躺在工作区，原因就在这。

## 八、克隆时提示文件名过长

在 Windows 上克隆某些仓库会报：

```
Filename too long warning: Clone succeeded, but checkout failed.
```

打开长路径支持即可：

```bash
git config --system core.longpaths true
```

这是 Windows 路径长度限制导致的，macOS 和 Linux 上遇不到。`--system` 需要管理员权限。

## 九、邮箱和用户名

**查看**

- `git config user.name`
- `git config user.email`

**修改**

- `git config --global user.name "username"`
- `git config --global user.email "email"`

`--global` 是全局配置。如果你的公司仓库和个人仓库要用不同的邮箱，就在具体仓库目录下去掉 `--global` 单独设一次，仓库级配置优先级更高。提交记录里的邮箱对不上，GitHub 的贡献图不会亮，很多人排查半天其实是这个原因。

## 十、.gitignore 更新后不生效

`.gitignore` 只对未被跟踪的文件起作用。已经被 Git 跟踪过的文件，你事后再加进 `.gitignore` 是没用的，得先把它们从索引里清掉：

```bash
git rm -r --cached .
git add .
git commit -m ".gitignore is now working"
```

`--cached` 表示只从 Git 的索引里移除，磁盘上的文件不动，这一点很关键，写成 `git rm -r .` 就是真删文件了。

## 十一、同步 GitHub fork 出来的分支

fork 别人的仓库之后，上游有了新提交，你的 fork 不会自动跟着更新，得手动同步。

**1. 配置 remote，指向原始仓库**

```bash
git remote add upstream https://github.com/InterviewMap/InterviewMap.git
```

`upstream` 只是个约定俗成的名字，你的 fork 本身叫 `origin`。

**2. 从上游仓库获取分支及相关的提交信息**

它们将被保存在本地的 `upstream/master` 分支：

```bash
git fetch upstream
# remote: Counting objects: 75, done.
# remote: Compressing objects: 100% (53/53), done.
# remote: Total 62 (delta 27), reused 44 (delta 9)
# Unpacking objects: 100% (62/62), done.
# From https://github.com/ORIGINAL_OWNER/ORIGINAL_REPOSITORY
# * [new branch] master -> upstream/master
```

**3. 切换到本地的 master 分支**

```bash
git checkout master
# Switched to branch 'master'
```

**4. 把 upstream/master 合并到本地 master**

这样本地的 master 分支就跟上游仓库保持同步了，并且没有丢失本地的修改：

```bash
git merge upstream/master
# Updating a422352..5fdff0f
# Fast-forward
# README | 9 -------
# README.md | 7 ++++++
# 2 files changed, 7 insertions(+), 9 deletions(-)
# delete mode 100644 README
# create mode 100644 README.md
```

**5. 上传到自己的远程仓库中**

```bash
git push
```

顺便提一句，新仓库的默认分支名现在多数是 `main` 而不是 `master`，上面的命令按你实际的分支名改。GitHub 网页端也提供了 Sync fork 按钮，简单场景点一下就行，命令行这套主要用在需要处理冲突的时候。

## 总结

这份清单真正需要记住的其实不多。

四个区域是所有撤销操作的坐标系，先问自己改动现在在哪一层，再选命令。工作区用 `git checkout --` 或 `git restore`，暂存区用 `git reset HEAD` 或 `git restore --staged`，本地仓库用 `git reset`，已经推出去的用 `git revert`。

`reset` 和 `revert` 的分界线是「有没有 push 过」。没推出去随便 reset，推出去了只能 revert，这条规则能挡掉团队协作里绝大多数的历史冲突。

`--hard` 是唯一会真正吃掉工作区改动的参数，执行前确认一遍。真出事了先想起 `git reflog`，它能救回已经 commit 过的东西。

`pull --rebase` 和 `merge --no-ff` 看着矛盾，其实分工明确：前者清理并行开发带来的无意义分叉，后者保留一个功能分支的完整轮廓。rebase 的使用边界只有一条，别去 rebase 已经推给别人的提交。

## 参考

- [Pro Git 中文版](https://git-scm.com/book/zh/v2)
- [Git 官方命令参考](https://git-scm.com/docs)
- [git-restore 与 git-switch 的引入说明](https://git-scm.com/docs/git-restore)
- [GitHub 文档 生成新的 SSH 密钥](https://docs.github.com/zh/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- [GitHub 文档 同步 fork](https://docs.github.com/zh/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork)
- [前端进阶之旅](https://interview.poetries.top)
