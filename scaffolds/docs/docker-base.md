---
title: Docker入门基础篇
date: 2018-11-20 10:12:08
tags: 
   - Docker
   - 部署
categories: Back-end
---

> 来源掘金小册docker资料


## 一、`Docker` 的四大组成对象

> 在 `Docker` 体系里，有四个对象 (` Object `) 是我们不得不进行介绍的，因为几乎所有 `Docker` 以及周边生态的功能，都是围绕着它们所展开的。它们分别是：镜像 ( `Image` )、容器 ( `Container` )、网络 ( `Network` )、数据卷 ( `Volume` )...

### 1.1 镜像

> 所谓镜像，可以理解为一个只读的文件包，其中包含了虚拟环境运行最原始文件系统的内容

### 1.2 容器

> 容器就是用来隔离虚拟环境的基础设施，而在 `Docker` 里，它也被引申为隔离出来的虚拟环境。

- 如果把镜像理解为编程中的类，那么容器就可以理解为类的实例。镜像内存放的是不可变化的东西，当以它们为基础的容器启动后，容器内也就成为了一个“活”的空间

**`Docker` 的容器应该有三项内容组成**

- 一个 `Docker` 镜像
- 一个程序运行环境
- 一个指令集合

### 1.3 网络

> 在 `Docker` 中，实现了强大的网络功能，我们不但能够十分轻松的对每个容器的网络进行配置，还能在容器间建立虚拟网络，将数个容器包裹其中，同时与其他网络环境隔离


![](https://user-gold-cdn.xitu.io/2018/9/5/165a810ad2c81714)

> `Docker` 能够在容器中营造独立的域名解析环境，这使得我们可以在不修改代码和配置的前提下直接迁移容器，`Docker` 会为我们完成新环境的网络适配。对于这个功能，我们甚至能够在不同的物理服务器间实现，让处在两台物理机上的两个 Docker 所提供的容器，加入到同一个虚拟网络中，形成完全屏蔽硬件的效果...

### 1.4 数据卷

1. 除了网络之外，文件也是重要的进行数据交互的资源。在以往的虚拟机中，我们通常直接采用虚拟机的文件系统作为应用数据等文件的存储位置。然而这种方式其实并非完全安全的，当虚拟机或者容器出现问题导致文件系统无法使用时，虽然我们可以很快的通过镜像重置文件系统使得应用快速恢复运行，但是之前存放的数据也就消失了。
2. 为了保证数据的独立性，我们通常会单独挂载一个文件系统来存放数据。这种操作在虚拟机中是繁琐的，因为我们不但要搞定挂载在不同宿主机中实现的方法，还要考虑挂载文件系统兼容性，虚拟操作系统配置等问题。值得庆幸的是，这些在 Docker 里都已经为我们轻松的实现了，我们只需要简单的一两个命令或参数，就能完成文件系统目录的挂载。
3. 能够这么简单的实现挂载，主要还是得益于 `Docker` 底层的 Union File System 技术。在 `UnionFS` 的加持下，除了能够从宿主操作系统中挂载目录外，还能够建立独立的目录持久存放数据，或者在容器间共享。
4. 在 `Docker` 中，通过这几种方式进行数据共享或持久化的文件或目录，我们都称为数据卷 ( `Volume` )...

## 二、搭建运行Docker环境

### 2.1 Docker Engine 的版本

**对于 Docker Engine 来说，其主要分为两个系列**

- 社区版 ( `CE`, Community Edition )
- 企业版 ( `EE`, Enterprise Edition )

1. 社区版 ( `Docker Engine CE` ) 主要提供了 `Docker` 中的容器管理等基础功能，主要针对开发者和小型团队进行开发和试验。而企业版 ( `Docker Engine EE` ) 则在社区版的基础上增加了诸如容器管理、镜像管理、插件、安全等额外服务与功能，为容器的稳定运行提供了支持，适合于中大型项目的线上运行...
2. 社区版和企业版的另一区别就是免费与收费了。对于我们开发者来说，社区版已经提供了 `Docker` 所有核心的功能，足够满足我们在开发、测试中的需求，所以我们直接选择使用社区版进行开发即可。在这本小册中，所有的内容也是围绕着社区版的 `Docker Engine` 展开的...
3. 从另外一个角度，`Docker Engine` 的迭代版本又会分为稳定版 ( `Stable release` ) 和预览版 ( `Edge release` )。不论是稳定版还是预览版，它们都会以发布时的年月来命名版本号，例如如 17 年 3 月的版本，版本号就是 17.03...

![](https://user-gold-cdn.xitu.io/2018/8/29/165863f7df36e81f)

1. `Docker Engine` 的稳定版固定为每三个月更新一次，而预览版则每月都会更新。在预览版中可以及时掌握到最新的功能特性，不过这对于我们仅是使用 `Docker` 的开发者来说，意义并不是特别重大的，所以我还是更推荐安装更有保障的稳定版本。
2. 在主要版本之外，`Docker` 官方也以解决 `Bug` 为主要目的，不定期发布次要版本。次要版本的版本号由主要版本和发布序号组成，如：`17.03.2 `就是对 `17.03` 版本的第二次修正...


### 2.2 Docker 的环境依赖

- 由于 `Docker` 的容器隔离依赖于 `Linux` 内核中的相关支持，所以使用 `Docker` 首先需要确保安装机器的 `Linux kernel`中包含 `Docker` 所需要使用的特性。以目前 Docker 官方主要维护的版本为例，我们需要使用基于 `Linux kernel 3.10` 以上版本的 `Linux` 系统来安装 `Docker.`..
- 也许 `Linux kernel` 的版本还不够直观，下面的表格就直接展示了 `Docker` 对主流几款 `Linux` 系统版本的要求

|操作系统|	支持的系统版本|
|---|---|
|`CentOS`|	`CentOS 7`|
|`Debian`|	`Debian Wheezy 7.7 (LTS) `|
|`Debian `|`Jessie 8 (LTS) `|
|`Debian `|`Stretch 9 `|
|`Debian `|`Buster 10`|
|`Fedora`|	`Fedora 26 `、`Fedora 27`|
|`Ubuntu`|	`Ubuntu Trusty 14.04 (LTS) `|
|`Ubuntu`| `Xenial 16.04 (LTS) `|
|`Ubuntu`|` Artful 17.10...`|

### 2.3 在 Linux 系统中安装 Docker

> 因为 `Docker` 本身就基于 `Linux` 的核心能力，同时目前主流的 `Linux` 系统中所拥有的软件包管理程序，已经可以很轻松的帮助我们处理各种依赖问题，所以在 `Linux `中安装 `Docker` 并非什么难事

**CentOS**

```bash
$ sudo yum install yum-utils device-mapper-persistent-data lvm2
$
$ sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
$ sudo yum install docker-ce
$
$ sudo systemctl enable docker
$ sudo systemctl start docker...
```

**Debian**

```bash
$ sudo apt-get install apt-transport-https ca-certificates curl gnupg2 software-properties-common
$
$ curl -fsSL https://download.docker.com/linux/debian/gpg | sudo apt-key add -
$ sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
$ sudo apt-get update
$ sudo apt-get install docker-ce
$
$ sudo systemctl enable docker
$ sudo systemctl start docker...
```
**Fedora**

```bash
$ sudo dnf -y install dnf-plugins-core
$
$ sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
$ sudo dnf install docker-ce
$
$ sudo systemctl enable docker
$ sudo systemctl start docker...
```

**Ubuntu**

```bash
$ sudo apt-get install apt-transport-https ca-certificates curl software-properties-common
$
$ curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
$ sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
$ sudo apt-get update
$ sudo apt-get install docker-ce
$
$ sudo systemctl enable docker
$ sudo systemctl start docker...
```


### 2.4 上手使用

> 在安装 `Docker` 完成之后，我们需要先启动 `docker daemon` 使其能够为我们提供 `Docker` 服务，这样我们才能正常使用 `Docker`

在我们通过软件包的形式安装 `Docker Engine` 时，安装包已经为我们在 `Linux` 系统中注册了一个 `Docker` 服务，所以我们不需要直接启动 `docker daemon` 对应的 `dockerd` 这个程序，而是直接启动 `Docker` 服务即可。启动的 `Docker` 服务的命令其实我已经包含在了前面谈到的安装命令中，也就是...

```
sudo systemctl start docker
```

> 当然，为了实现 `Docker` 服务开机自启动，我们还可以运行这个命令

```
$ sudo systemctl enable docker
```

**docker version**

> 在 `Docker `服务启动之后，我们先来尝试一个最简单的查看 `Docker` 版本的命令：`docker version`

```
$ sudo docker version
Client:
 Version:           18.06.1-ce
 API version:       1.38
 Go version:        go1.10.3
 Git commit:        e68fc7a
 Built:             Tue Aug 21 17:23:03 2018
 OS/Arch:           linux/amd64
 Experimental:      false

Server:
 Engine:
  Version:          18.06.1-ce
  API version:      1.38 (minimum version 1.12)
  Go version:       go1.10.3
  Git commit:       e68fc7a
  Built:            Tue Aug 21 17:25:29 2018
  OS/Arch:          linux/amd64
  Experimental:     false...
```

> 这个命令能够显示 `Docker C/S `结构中的服务端 ( `docker daemon` ) 和客户端 ( `docker CLI` ) 相关的版本信息。在默认情况下，`docker CLI` 连接的是本机运行的 `docker daemon` ，由于 `docker daemon` 和 `docker CLI` 通过` RESTful` 接口进行了解耦，所以我们也能修改配置用于操作其他机器上运行的 `docker daemon`...

**docker info**

> 如果想要了解 `Docker Engine` 更多相关的信息，我们还可以通过 `docker info` 这个命令

```
$ sudo docker info
Containers: 0
 Running: 0
 Paused: 0
 Stopped: 0
Images: 0
Server Version: 18.06.0-ce
Storage Driver: overlay2
 Backing Filesystem: extfs
 Supports d_type: true
 Native Overlay Diff: true
Logging Driver: json-file
Cgroup Driver: cgroupfs
## ......
Live Restore Enabled: false...
```

**配置国内镜像源**

> 一个由 Docker 官方提供的国内镜像源 registry.docker-cn.com

那么有了地址，我们要如何将其配置到 Docker 中呢？

> 在 Linux 环境下，我们可以通过修改 `/etc/docker/daemon.json` ( 如果文件不存在，你可以直接创建它 ) 这个 Docker 服务的配置文件达到效果

```
{
    "registry-mirrors": [
        "https://registry.docker-cn.com"
    ]
}

```

在修改之后，别忘了重新启动 `docker daemon` 来让配置生效

```
$ sudo systemctl restart docker
```

要验证我们配置的镜像源是否生效，我们可以通过 `docker info` 来查阅当前注册的镜像源列表

```
$ sudo docker info
## ......
Registry Mirrors:
 https://registry.docker-cn.com/
## ......
```


## 三、在 Windows 和 Mac 中使用 Docker

### 3.1 Docker Desktop

**对于 Windows 系统来说，安装 Docker for Windows 需要符合以下条件**

- 必须使用 `Windows 10 Pro` ( 专业版 )
- 必须使用 `64 bit` 版本的 `Windows`

**对于 macOS 系统来说，安装 Docker for Mac 需要符合以下条件**

- `Mac `硬件必须为 `2010` 年以后的型号
- 必须使用 `macOS El Capitan 10.11` 及以后的版本

> 另外，虚拟机软件 `VirtualBox` 与 `Docker Desktop` 兼容性不佳，建议在安装 `Docker for Windows `和 `Docker for Mac` 之前先卸载 `VirtualBox`

在确认系统能够支持 `Docker Desktop` 之后，我们就从 `Docker` 官方网站下载这两个软件的安装程序，这里直接附上 `Docker Store` 的下载链接，供大家直接下载

- [Docker for Windows](https://store.docker.com/editions/community/docker-ce-desktop-windows)
- [Docker for Mac](https://store.docker.com/editions/community/docker-ce-desktop-mac)

### 3.2 启动 Docker

- 像 `Linux` 中一样，我们要在 `Windows` 和 `macOS` 中使用 `Docker` 前，我们需要先将 `Docker `服务启动起来。在这两个系统中，我们需要启动的就是刚才我们安装的 `Docker for Windows` 和 `Docker for Mac` 了...
- 启动两个软件的方式很简单，我们只需要通过操作系统的快捷访问功能查找到 `Docker for Windows` 或 `Docker for Mac` 并启动即可
- 打开软件之后，我们会在` Windows` 的任务栏或者 `macOS` 的状态栏中看到 `Docker` 的大鲸鱼图标

![](https://user-gold-cdn.xitu.io/2018/9/10/165c1d1fb7030b63)

> `Docker Desktop` 为我们在 `Windows` 和 `macOS` 中使用 `Docker `提供了与 `Linux` 中几乎一致的方法，我们只需要打开 `Windows` 中的 `PowerShell` 获得 `macOS` 中的 Terminal，亦或者 `Git Bash`、`Cmder`、`iTerm `等控制台类软件，输入 `docker` 命令即可...

使用 `docker version` 能够看到 `Docker` 客户端的信息，我们可以在这里发现程序运行的平台

```
λ docker version
Client:
## ......
 OS/Arch:  windows/amd64
## ......
```

### 3.3 Docker Desktop 的实现原理

> 我们知道 `Docker` 的核心功能，也就是容器实现，是基于 `Linux `内核中 `Namespaces`、`CGroups` 等功能的。那么大体上可以说，`Docker` 是依赖于 `Linux` 而存在的。那么问题来了，`Docker Desktop` 是如何实现让我们在 `Windows `和 `macOS` 中如此顺畅的使用 Docker 的呢？...

- 其实 `Docker Desktop` 的实现逻辑很简单：既然 `Windows` 和 `macOS` 中没有 `Docker `能够利用的 `Linux` 环境，那么我们生造一个 `Linux` 环境就行啦！`Docker for Windows `和 `Docker for Mac` 正是这么实现的...
- 由于虚拟化在云计算时代的广泛使用，`Windows` 和 `MacOS` 也将虚拟化引入到了系统本身的实现中，这其中就包含了之前我们所提到的通过 `Hypervisor `实现虚拟化的功能。在 `Windows` 中，我们可以通过 `Hyper-V` 实现虚拟化，而在 `macOS` 中，我们可以通过 HyperKit 实现虚拟化...
- `Docker for Windows` 和 `Docker for Mac` 这里利用了这两个操作系统提供的功能来搭建一个虚拟 `Linux` 系统，并在其之上安装和运行 `docker daemon`。

![](https://user-gold-cdn.xitu.io/2018/9/12/165cb3b94b24b951)

> 除了搭建 `Linux` 系统并运行 `docker daemon` 之外，`Docker Desktop` 系列最突出的一项功能就是我们能够直接通过 `PowerShell`、`Terminal` 这类的控制台软件在 `Windows` 和 `macOS` 中直接操作虚拟 Linux 系统中运行的 docker daemon...

### 3.4 主机文件挂载

1. 控制能够直接在主机操作系统中进行，给我们使用 Docker Desktop 系列软件提供了极大的方便。除此之外，文件的挂载也是 Docker Desktop 所提供的大幅简化我们工作效率且简化使用的功能之一。
2. 之前我们谈到了，Docker 容器中能够通过数据卷的方式挂载宿主操作系统中的文件或目录，宿主操作系统在 Windows 和 macOS 环境下的 Docker Desktop 中，指的是虚拟的 Linux 系统。
3. 当然，如果只能从虚拟的 Linux 系统中进行挂载，显然不足以达到我们的期望，因为最方便的方式必然是直接从 Windows 和 macOS 里挂载文件了。
4. 要实现我们所期望的效果，也就是 Docker 容器直接挂载主机系统的目录，我们可以先将目录挂载到虚拟 Linux 系统上，再利用 Docker 挂载到容器之中。这个过程被集成在了 Docker Desktop 系列软件中，我们不需要人工进行任何操作，整个过程已经实现了自动化...

![](https://user-gold-cdn.xitu.io/2018/9/11/165c8400bf8f809e)

> `Docker Desktop` 对 `Windows` 和 `macOS` 到虚拟 `Linux` 系统，再到 `Docker` 容器中的挂载进行了实现，我们只需要直接选择能够被挂载的主机目录 ( 这个过程更多也是为了安全所考虑 )，剩下的过程全部由 Docker Desktop 代替我们完成。...

## 四、使用容器：镜像与容器

### 4.1 Docker 镜像

1. 如果进行形象的表述，我们可以将 `Docker` 镜像理解为包含应用程序以及其相关依赖的一个基础文件系统，在 `Docker` 容器启动的过程中，它以只读的方式被用于创建容器的运行环境。
2. 从另一个角度看，在之前的小节里我们讲到了，`Docker` 镜像其实是由基于 `UnionFS` 文件系统的一组镜像层依次挂载而得，而每个镜像层包含的其实是对上一镜像层的修改，这些修改其实是发生在容器运行的过程中的。所以，我们也可以反过来理解，镜像是对容器运行环境进行持久化存储的结果...

### 4.2 查看镜像

1. 镜像是由 `Docker` 进行管理的，所以它们的存储位置和存储方式等我们并不需要过多的关心，我们只需要利用 `Docker` 所提供的一些接口或命令对它们进行控制即可。
2. 如果要查看当前连接的 `docker daemon` 中存放和管理了哪些镜像，我们可以使用 `docker images `这个命令 ( `Linux`、`macOS` 还是 `Windows` 上都是一致的 )

```
$ docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
php                 7-fpm               f214b5c48a25        9 days ago          368MB
redis               3.2                 2fef532eadb3        11 days ago         76MB
redis               4.0                 e1a73233e3be        11 days ago         83.4MB
cogset/cron         latest              c01d5ac6fc8a        15 months ago       125MB...
```

> 在 `docker images` 命令的结果中，我们可以看到镜像的 `ID` ( `IMAGE ID`)、构建时间 ( `CREATED` )、占用空间 ( `SIZE` ) 等数据

这里需要注意一点，我们发现在结果中镜像 `ID` 的长度只有 `12` 个字符，这和我们之前说的 `64` 个字符貌似不一致。其实为了避免屏幕的空间都被这些看似“乱码”的镜像 `ID` 所挤占，所以 `Docker` 只显示了镜像 `ID` 的前 `12` 个字符，大部分情况下，它们已经能够让我们在单一主机中识别出不同的镜像了...


### 4.3 镜像命名

- 镜像层的 `ID` 既可以识别每个镜像层，也可以用来直接识别镜像 ( 因为根据最上层镜像能够找出所有依赖的下层镜像，所以最上层进行的镜像层 ID 就能表示镜像的 `ID` )，但是使用这种无意义的超长哈希码显然是违背人性的，所以这里我们还要介绍镜像的命名，通过镜像名我们能够更容易的识别镜像...
- 在 `docker images` 命令打印出的内容中，我们还能看到两个与镜像命名有关的数据：`REPOSITORY` 和 `TAG`，这两者其实就组成了 `docker` 对镜像的命名规则

![](https://user-gold-cdn.xitu.io/2018/9/12/165cc15252cc5e51)

**准确的来说，镜像的命名我们可以分成三个部分：username、repository 和 tag**

- `username`： 主要用于识别上传镜像的不同用户，与 GitHub 中的用户空间类似。
- `repository`：主要用于识别进行的内容，形成对镜像的表意描述。
- `tag`：主要用户表示镜像的版本，方便区分进行内容的不同细节

> 对于 `username` 来说，在上面我们展示的 `docker images` 结果中，有的镜像有 `username` 这个部分，而有的镜像是没有的。没有 `username` 这个部分的镜像，表示镜像是由 `Docker` 官方所维护和提供的，所以就不单独标记用户了...

### 4.4 容器的生命周期

**容器运行的状态流转图**

![](https://user-gold-cdn.xitu.io/2018/9/17/165e53743e730432)

> 图中展示了几种常见对 `Docker` 容器的操作命令，以及执行它们之后容器运行状态的变化。这里我们撇开命令，着重看看容器的几个核心状态，也就是图中色块表示的：`Created`、`Running`、`Paused`、`Stopped`、`Deleted`

在这几种状态中，`Running` 是最为关键的状态，在这种状态中的容器，就是真正正在运行的容器了

### 4.5 主进程

1. 如果单纯去看容器的生命周期会有一些难理解的地方，而 `Docker` 中对容器生命周期的定义其实并不是独立存在的。
2. 在 `Docker` 的设计中，容器的生命周期其实与容器中 `PID` 为 `1` 这个进程有着密切的关系。更确切的说，它们其实是共患难，同生死的兄弟。容器的启动，本质上可以理解为这个进程的启动，而容器的停止也就意味着这个进程的停止，反过来理解亦然。
3. 当我们启动容器时，`Docker` 其实会按照镜像中的定义，启动对应的程序，并将这个程序的主进程作为容器的主进程 ( 也就是 `PID` 为 `1` 的进程 )。而当我们控制容器停止时，`Docker` 会向主进程发送结束信号，通知程序退出。
4. 而当容器中的主进程主动关闭时 ( 正常结束或出错停止 )，也会让容器随之停止。
5. 通过之前提到的几个方面来看，`Docker` 不仅是从设计上推崇轻量化的容器，也是许多机制上是以此为原则去实现的。所以，我们最佳的 `Docker` 实践方法是遵循着它的逻辑，逐渐习惯这种容器即应用，应用即容器的虚拟化方式。虽然在 `Docker` 中我们也能够实现在同一个容器中运行多个不同类型的程序，但这么做的话，`Docker` 就无法跟踪不同应用的生命周期，有可能造成应用的非正常关闭，进而影响系统、数据的稳定性...

## 五、使用容器：从镜像仓库获得镜像

### 5.1 镜像仓库

> 如果说我们把镜像的结构用 `Git` 项目的结构做类比，那么镜像仓库就可以看似 `GitLab`、`GitHub` 等的托管平台，只不过 `Docker` 的镜像仓库托管的不是代码项目，而是镜像

当然，存储镜像并不是镜像仓库最值得炫耀的功能，其最大的作用是实现了 `Docker` 镜像的分发。借助镜像仓库，我们得到了一个镜像的中转站，我们可以将开发环境上所使用的镜像推送至镜像仓库，并在测试或生产环境上拉取到它们，而这个过程仅需要几个命令，甚至自动化完成...

![](https://user-gold-cdn.xitu.io/2018/9/18/165eacb6b1b2c1ac)

### 5.2 获取镜像

> 虽然有很多种方式将镜像引入到 `Docker` 之中，但我们最为常用的获取现有镜像的方式还是直接从镜像仓库中拉取，因为这种方式简单、快速、有保障

要拉取镜像，我们可以使用 `docker pull` 命令，命令的参数就是我们之前所提到的镜像仓库名。


```
$ sudo docker pull ubuntu
Using default tag: latest
latest: Pulling from library/ubuntu
124c757242f8: Downloading [===============================================>   ]  30.19MB/31.76MB
9d866f8bde2a: Download complete 
fa3f2f277e67: Download complete 
398d32b153e8: Download complete 
afde35469481: Download complete...
```

- 当我们运行这个命令后，`Docker` 就会开始从镜像仓库中拉取我们所指定的镜像了，在控制台中，我们可以看到镜像拉取的进度。下载进度会分为几行，其实每一行代表的就是一个镜像层。`Docker` 首先会拉取镜像所基于的所有镜像层，之后再单独拉取每一个镜像层并组合成这个镜像。当然，如果在本地已经存在相同的镜像层 ( 共享于其他的镜像 )，那么 `Docker` 就直接略过这个镜像层的拉取而直接采用本地的内容。
- 上面是一个拉取官方镜像并且没有给出镜像标签的例子，大家注意到，当我们没有提供镜像标签时，`Docker` 会默认使用 `latest` 这个标签...

我们也能够使用完整的镜像命名来拉取镜像

```
$ sudo docker pull openresty/openresty:1.13.6.2-alpine
1.13.6.2-alpine: Pulling from openresty/openresty
ff3a5c916c92: Pull complete 
ede0a2a1012b: Pull complete 
0e0a11843023: Pull complete 
246b2c6f4992: Pull complete 
Digest: sha256:23ff32a1e7d5a10824ab44b24a0daf86c2df1426defe8b162d8376079a548bf2
Status: Downloaded newer image for openresty/openresty:1.13.6.2-alpine...
```

镜像在被拉取之后，就存放到了本地，接受当前这个 `Docker` 实例管理了，我们可以通过 `docker images` 命令看到它们

```
$ sudo docker images
REPOSITORY            TAG                 IMAGE ID            CREATED             SIZE
ubuntu                latest              cd6d8154f1e1        12 days ago         84.1MB
openresty/openresty   1.13.6.2-alpine     08d5c926e4b6        3 months ago        49.3MB...
```

### 5.3 Docker Hub

> `Docker Hub` 是 `Docker` 官方建立的中央镜像仓库，除了普通镜像仓库的功能外，它内部还有更加细致的权限管理，支持构建钩子和自动构建，并且有一套精致的 Web 操作页面

Docker Hub 的地址是：hub.docker.com/

![](https://user-gold-cdn.xitu.io/2018/9/19/165efa8f3a706682)

- 由于定位是 `Docker` 的中央镜像仓库系统，同时也是 `Docker Engine` 的默认镜像仓库，所以 `Docker Hub` 是开发者共享镜像的首选，那么也就意味着其中的镜像足够丰富
- 常用服务软件的镜像，我们都能在 `Docker Hub` 中找到，甚至能找到针对它们不同用法的不同镜像。
- 同时，`Docker Hub` 也允许我们将我们制作好的镜像上传到其中，与广大 `Docker` 用户共享你的成果

### 5.4 搜索镜像

- 由于 `Docker Hub` 提供了一套完整的 `Web` 操作界面，所以我们搜索其中的镜像会非常方便

![](https://user-gold-cdn.xitu.io/2018/9/19/165efb39b6076f2e)

> 在 Docker Hub 的搜索结果中，有几项关键的信息有助于我们选择合适的镜像：

- `OFFICIAL `代表镜像为 `Docker` 官方提供和维护，相对来说稳定性和安全性较高
- `STARS` 代表镜像的关注人数，这类似 `GitHub` 的 `Stars`，可以理解为热度
- `PULLS` 代表镜像被拉取的次数，基本上能够表示镜像被使用的频度...

> 除了直接通过 `Docker Hub` 网站搜索镜像这种方式外，我们还可以用 docker CLI 中的 `docker search` 这个命令搜索 `Docker Hub` 中的镜像

```
$ sudo docker search ubuntu
NAME                                                   DESCRIPTION                                     STARS               OFFICIAL            AUTOMATED
ubuntu                                                 Ubuntu is a Debian-based Linux operating sys…   8397                [OK]                
dorowu/ubuntu-desktop-lxde-vnc                         Ubuntu with openssh-server and NoVNC            220                                     [OK]
rastasheep/ubuntu-sshd                                 Dockerized SSH service, built on top of offi…   171                                     [OK]
consol/ubuntu-xfce-vnc                                 Ubuntu container with "headless" VNC session…   129                                     [OK]
ansible/ubuntu14.04-ansible                            Ubuntu 14.04 LTS with ansible                   95                                      [OK]
ubuntu-upstart                                         Upstart is an event-based replacement for th…   89  ...
```

### 5.5 管理镜像

> 对镜像的管理要比搜索和获取镜像更常用，所以了解镜像管理相关的操作以及知识是非常有必要的

除了之前我们所提到的 `docker images `可以列出本地 `Docker` 中的所有镜像外，如果我们要获得镜像更详细的信息，我们可以通过 `docker inspect` 这个命令

```
$ sudo docker inspect redis:3.2
[
    {
        "Id": "sha256:2fef532eadb328740479f93b4a1b7595d412b9105ca8face42d3245485c39ddc",
        "RepoTags": [
            "redis:3.2"
        ],
        "RepoDigests": [
            "redis@sha256:745bdd82bad441a666ee4c23adb7a4c8fac4b564a1c7ac4454aa81e91057d977"
        ],
## ......
    }
]...
```

> 在 `docker inspect` 的结果中我们可以看到关于镜像相当完备的信息

除了能够查看镜像的信息外，·`docker inspect·` 还能查看容器等之前我们所提到的 `Docker` 对象的信息，而传参的方式除了传递镜像或容器的名称外，还可以传入镜像 ID 或容器 `ID`。

```
$ sudo docker inspect redis:4.0
$ sudo docker inspect 2fef532e
```


**参数识别**

> 之前我们所谈到镜像 `ID` 是 `64` 个字符，而 `docker images` 命令里的缩写也有 `12 `个字符，为什么我这里展示的操作命令里只填写了 `8` 个字符呢

- 不论我们是通过镜像名还是镜像 `ID` 传递到 `docker inspect` 或者其他类似的命令 ( 需要指定 `Docker` 对象的命令 ) 里，`Docker` 都会根据我们传入的内容去寻找与之匹配的内容，只要我们所给出的内容能够找出唯一的镜像，那么 `Docker` 就会对这个镜像执行给定的操作。反之，如果找不到唯一的镜像，那么操作不会进行，`Docker` 也会显示错误
- 也就是说，只要我们提供了能够唯一识别镜像或容器的信息，即使它短到只有 1 个字符，`Docker` 都是可以处理的

> 例如我们有五个镜像：

```
REPOSITORY            TAG                 IMAGE ID            CREATED             SIZE
php                   7-fpm               f214b5c48a25        11 days ago         368MB
ubuntu                latest              cd6d8154f1e1        13 days ago         84.1MB
redis                 3.2                 2fef532eadb3        13 days ago         76MB
redis                 4.0                 e1a73233e3be        13 days ago         83.4MB
openresty/openresty   1.13.6.2-alpine     08d5c926e4b6        3 months ago        49.3MB
cogset/cron           latest              c01d5ac6fc8a        16 months ago       125MB...
```

> 我们注意到镜像 `ID` 前缀为` 2` 的只有 `redis:3.2` 这个镜像，那么我们就可以使用 2 来指代这个镜像

```
$ sudo docker inspect 2
```

> 而前缀为 `c` 的镜像有两个，这时候如果我们直接使用 `c` 来指代镜像的话，`Docker` 会提示未能匹配到镜像

```
$ sudo docker inspect c
[]
Error: No such object: c
```

### 5.6 删除镜像

> 虽然 `Docker` 镜像占用的空间比较小，但日渐冗杂的镜像和凌乱的镜像版本会让管理越来越困难，所以有时候我们需要清理一些无用的镜像，将它们从本地的 `Docker Engine` 中移除

删除镜像的命令是 `docker rmi`，参数是镜像的名称或 `ID`

```
$ sudo docker rmi ubuntu:latest
Untagged: ubuntu:latest
Untagged: ubuntu@sha256:de774a3145f7ca4f0bd144c7d4ffb2931e06634f11529653b23eba85aef8e378
Deleted: sha256:cd6d8154f1e16e38493c3c2798977c5e142be5e5d41403ca89883840c6d51762
Deleted: sha256:2416e906f135eea2d08b4a8a8ae539328482eacb6cf39100f7c8f99e98a78d84
Deleted: sha256:7f8291c73f3ecc4dc9317076ad01a567dd44510e789242368cd061c709e0e36d
Deleted: sha256:4b3d88bd6e729deea28b2390d1ddfdbfa3db603160a1129f06f85f26e7bcf4a2
Deleted: sha256:f51700a4e396a235cee37249ffc260cdbeb33268225eb8f7345970f5ae309312
Deleted: sha256:a30b835850bfd4c7e9495edf7085cedfad918219227c7157ff71e8afe2661f63...
```

> - 删除镜像的过程其实是删除镜像内的镜像层，在删除镜像命令打印的结果里，我们可以看到被删除的镜像层以及它们的 `ID`。当然，如果存在两个镜像共用一个镜像层的情况，你也不需要担心 `Docker` 会删除被共享的那部分镜像层，只有当镜像层只被当前被删除的镜像所引用时，`Docker `才会将它们从硬盘空间中移除...
> - `docker rmi` 命令也支持同时删除多个镜像，只需要通过空格传递多个镜像 `ID` 或镜像名即可

```
$ sudo docker rmi redis:3.2 redis:4.0
Untagged: redis:3.2
Untagged: redis@sha256:745bdd82bad441a666ee4c23adb7a4c8fac4b564a1c7ac4454aa81e91057d977
Deleted: sha256:2fef532eadb328740479f93b4a1b7595d412b9105ca8face42d3245485c39ddc
## ......
Untagged: redis:4.0
Untagged: redis@sha256:b77926b30ca2f126431e4c2055efcf2891ebd4b4c4a86a53cf85ec3d4c98a4c9
Deleted: sha256:e1a73233e3beffea70442fc2cfae2c2bab0f657c3eebb3bdec1e84b6cc778b75
## .........
```

## 六、使用容器：运行和管理容器

### 6.1 容器的创建和启动

在了解容器的各项操作之前，我们再来回顾一下之前我们所提及的容器状态流转。

![](https://user-gold-cdn.xitu.io/2018/9/17/165e53743e730432)

> 在这幅图中，我们可以看到，Docker 容器的生命周期里分为五种状态，其分别代表着：

- `Created`：容器已经被创建，容器所需的相关资源已经准备就绪，但容器中的程序还未处于运行状态。
- `Running`：容器正在运行，也就是容器中的应用正在运行。
- `Paused`：容器已暂停，表示容器中的所有程序都处于暂停 ( 不是停止 ) 状态。
- `Stopped`：容器处于停止状态，占用的资源和沙盒环境都依然存在，只是容器中的应用程序均已停止。
- `Deleted`：容器已删除，相关占用的资源及存储在 `Docker` 中的管理信息也都已释放和移除...

### 6.2 创建容器

> 当我们选择好镜像以后，就可以通过 `docker create `这个命令来创建容器了

```
$ sudo docker create nginx:1.12
34f277e22be252b51d204acbb32ce21181df86520de0c337a835de6932ca06c3
```

> 执行` docker create` 后，`Docker` 会根据我们所给出的镜像创建容器，在控制台中会打印出 `Docker` 为容器所分配的容器 `ID`，此时容器是处于 `Created` 状态的

- 之后我们对容器的操作可以通过这个容器 `ID` 或者它的缩略形式进行，但用容器 `ID` 操作容器就和用镜像 `ID` 操作镜像一样烦闷，所以我们更习惯于使用容器名来操作容器。
- 要使用容器名操作容器，就先得给容器命名，在创建容器时，我们可以通过 `--name` 这个选项来配置容器名...

```
$ sudo docker create --name nginx nginx:1.12
```

### 6.3 启动容器

> 通过 `docker create` 创建的容器，是处于 `Created` 状态的，其内部的应用程序还没有启动，所以我们需要通过` docker start` 命令来启动它。

```
$ sudo docker start nginx
```

1. 由于我们为容器指定了名称，这样的操作会更加自然，所以我们非常推荐为每个被创建的容器都进行命名
2. 当容器启动后，其中的应用就会运行起来，容器的几个生命周期也会绑定到了这个应用上，这个之前我们已经提及，这里就不在赘述。只要应用程序还在运行，那么容器的状态就会是 `Running`，除非进行一些修改容器的操作。
3. 在 `Docker` 里，还允许我们通过 `docker run` 这个命令将 `docker create` 和 `docker start` 这两步操作合成为一步，进一步提高工作效率...

```
$ sudo docker run --name nginx -d nginx:1.12
89f2b769498a50f5c35a314ab82300ce9945cbb69da9cda4b022646125db8ca7
```

- 通过 `docker run` 创建的容器，在创建完成之后会直接启动起来，不需要我们再使用 `docker start` 去启动了。
- 这里需要注意的一点是，通常来说我们启动容器会期望它运行在“后台”，而 `docker` run 在启动容器时，会采用“前台”运行这种方式，这时候我们的控制台就会衔接到容器上，不能再进行其他操作了。我们可以通过 `-d` 或 `--detach` 这个选项告诉 `Docker` 在启动后将程序与控制台分离，使其进入“后台”运行...


### 6.4 管理容器

- 容器创建和启动后，除了关注应用程序是否功能正常外，我们也会关注容器的状态等内容。
- 通过 `docker ps `这个命令，我们可以罗列出 `Docker` 中的容器

```
$ sudo docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS               NAMES
89f2b769498a        nginx:1.12          "nginx -g 'daemon of…"   About an hour ago   Up About an hour    80/tcp              nginx...
```

> 默认情况下，`docker ps` 列出的容器是处于运行中的容器，如果要列出所有状态的容器，需要增加 `-a` 或 `--all `选项

```
$ sudo docker ps -a
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS               NAMES
425a0d3cd18b        redis:3.2           "docker-entrypoint.s…"   2 minutes ago       Created                                 redis
89f2b769498a        nginx:1.12          "nginx -g 'daemon of…"   About an hour ago   Up About an hour    80/tcp              nginx...
```

1. 在 `docker ps` 的结果中，我们可以看到几项关于容器的信息。其中 `CONTAINER ID`、`IMAGE`、`CREATED`、`NAMES` 大家都比较容易理解，分别表示容器 `ID`，容器所基于的镜像，容器的创建时间和容器的名称。
2. 结果中的 `COMMAND` 表示的是容器中主程序 ( 也就是与容器生命周期所绑定进程所关联的程序 ) 的启动命令，这条命令是在镜像内定义的，而容器的启动其实质就是启动这条命令
3. 结果中的 `STATUS` 表示容器所处的状态，其值和我们之前所谈到的状态有所区别，主要是因为这里还记录了其他的一些信息。在这里，常见的状态表示有三种：

- `Created` 此时容器已创建，但还没有被启动过。
- `Up [ Time ]` 这时候容器处于正在运行状态，而这里的 `Time` 表示容器从开始运行到查看时的时间。
- `Exited ([ Code ]) [ Time ]` 容器已经结束运行，这里的 `Code` 表示容器结束运行时，主程序返回的程序退出码，而 `Time` 则表示容器结束到查看时的时间...

> 当然，在 `Docker` 逐渐成熟后，命令的命名也没有原来那么随意了，已经逐渐转换为使用大家广泛认可的形式。只是 `docker ps` 这条命令，还保留着复古的风格。


### 6.5 停止和删除容器

> 要将正在运行的容器停止，我们可以使用 `docker stop` 命令

```
$ sudo docker stop nginx
```

正在运行中的容器默认情况下是不能被删除的，我们可以通过增加 `-f` 或 `--force` 选项来让 `docker rm` 强制停止并删除容器，不过这种做法并不妥当

### 6.6 随手删除容器

> 与其他虚拟机不同，`Docker` 的轻量级容器设计，讲究随用随开，随关随删。也就是说，当我们短时间内不需要使用容器时，最佳的做法是删除它而不是仅仅停止它

### 6.7 进入容器

- 很多时间，我们需要的操作并不仅仅是按镜像所给出的命令启动容器而已，我们还会希望进一步了解容器或操作容器，这时候最佳的方式就是让我们进入到容器了。
- 我们知道，容器是一个隔离运行环境的东西，它里面除了镜像所规定的主进程外，其他的进程也是能够运行的，`Docker` 为我们提供了一个命令 `docker exec` 来让容器运行我们所给出的命令...

这里我们试试用容器中的 `more` 命令查看容器的主机名定义。

```
$ sudo docker exec nginx more /etc/hostname
::::::::::::::
/etc/hostname
::::::::::::::
83821ea220ed...

```

- `docker exec` 命令能帮助我们在正在运行的容器中运行指定命令，这对于服务控制，运维监控等有着不错的应用场景。但是在开发过程中，我们更常使用它来作为我们进入容器的桥梁
- 熟悉 `Linux` 的朋友们知道，我们操作 `Linux `这个过程，并不是 `Linux` 内部的某些机能，而是通过控制台软件来完成的。控制台软件分析我们的命令，将其转化为对 `Linux` 的系统调用，实现了我们对 `Linux` 的操作。若不是这样，生涩的系统调用方法对普通开发者来说简直就是黑洞一般的存在，更别提用它们控制系统了...
- 在 `Linux` 中，大家熟悉的控制台软件应该是 `Shell` 和 `Bash `了，它们分别由 `sh` 和 `bash` 这两个程序启动
- 由于 `bash` 的功能要比 `sh `丰富，所以在能够使用 `bash` 的容器里，我们优先选择它作为控制台程序。

```
$ sudo docker exec -it nginx bash
root@83821ea220ed:/#
```

> 在借助 `docker exec` 进入容器的时候，我们需要特别注意命令中的两个选项不可或缺，即 `-i` 和 `-t `( 它们俩可以利用简写机制合并成 `-it` )。


其中 `-i` ( `--interactive` ) 表示保持我们的输入流，只有使用它才能保证控制台程序能够正确识别我们的命令。而 `-t` ( `--tty` ) 表示启用一个伪终端，形成我们与 `bash` 的交互，如果没有它，我们无法看到 `bash` 内部的执行结果...


### 6.8 衔接到容器

> `Docker` 为我们提供了一个 `docker attach` 命令，用于将当前的输入输出流连接到指定的容器上。

```
$ sudo docker attach nginx
```

- 这个命令最直观的效果可以理解为我们将容器中的主程序转为了“前台”运行 ( 与 `docker run` 中的 `-d` 选项有相反的意思 )。
- 由于我们的输入输出流衔接到了容器的主程序上，我们的输入输出操作也就直接针对了这个程序，而我们发送的 `Linux` 信号也会转移到这个程序上。例如我们可以通过 `Ctrl + C` 来向程序发送停止信号，让程序停止 ( 从而容器也会随之停止 )。...


## 七、为容器配置网络

### 7.1 容器网络

> 在之前介绍 `Docker` 核心组成的时候，我们已经简单谈到了容器网络的相关知识。容器网络实质上也是由 `Docker` 为应用程序所创造的虚拟环境的一部分，它能让应用从宿主机操作系统的网络环境中独立出来，形成容器自有的网络设备、IP 协议栈、端口套接字、IP 路由表、防火墙等等与网络相关的模块...

![](https://user-gold-cdn.xitu.io/2018/9/5/165a810ad2c81714)

> 还是回归上面这幅之前展示过的关于 `Docker` 网络的图片。在 Docker 网络中，有三个比较核心的概念，也就是：沙盒 ( Sandbox )、网络 ( Network )、端点 ( Endpoint )

- 沙盒提供了容器的虚拟网络栈，也就是之前所提到的端口套接字、`IP` 路由表、防火墙等的内容。其实现隔离了容器网络与宿主机网络，形成了完全独立的容器网络环境。
- 网络可以理解为 `Docker` 内部的虚拟子网，网络内的参与者相互可见并能够进行通讯。`Docker` 的这种虚拟网络也是于宿主机网络存在隔离关系的，其目的主要是形成容器间的安全通讯环境。
- 端点是位于容器或网络隔离墙之上的洞，其主要目的是形成一个可以控制的突破封闭的网络环境的出入口。当容器的端点与网络的端点形成配对后，就如同在这两者之间搭建了桥梁，便能够进行数据传输了

### 7.2 浅析 Docker 的网络实现

- 容器网络模型为容器引擎提供了一套标准的网络对接范式，而在 `Docker` 中，实现这套范式的是 `Docker` 所封装的 `libnetwork` 模块。
- 而对于网络的具体实现，在 `Docker` 的发展过程中也逐渐抽象，形成了统一的抽象定义。进而通过这些抽象定义，便可以对 `Docker` 网络的实现方式进行不同的变化...

![](https://user-gold-cdn.xitu.io/2018/9/23/166042a49627f8a6)

> 目前 `Docker` 官方为我们提供了五种 `Docker `网络驱动，分别是：`Bridge Driver`、`Host Driver`、`Overlay Driver`、`MacLan Driver`、`one Driver`。

其中，`Bridge` 网络是 `Docker` 容器的默认网络驱动，简而言之其就是通过网桥来实现网络通讯 ( 网桥网络的实现可以基于硬件，也可以基于软件 )。而 `Overlay` 网络是借助 `Docker` 集群模块 `Docker Swarm `来搭建的跨 `Docker Daemon` 网络，我们可以通过它搭建跨物理主机的虚拟网络，进而让不同物理机中运行的容器感知不到多个物理机的存在。

> `Bridge Driver` 和 `Overlay Driver` 在开发中使用频率较高

### 7.4 容器互联

- 由于 `Docker` 提倡容器与应用共生的轻量级容器理念，所以容器中通常只包含一种应用程序，但我们知道，如今纷繁的系统服务，没有几个是可以通过单一的应用程序支撑的。拿最简单的 `Web` 应用为例，也至少需要业务应用、数据库应用、缓存应用等组成。也就是说，在 `Docker` 里我们需要通过多个容器来组成这样的系统。
- 而这些互联网时代的应用，其间的通讯方式主要以网络为主，所以打通容器间的网络，是使它们能够互相通讯的关键所在。
- 要让一个容器连接到另外一个容器，我们可以在容器通过 `docker create` 或 `docker run` 创建时通过 `--link` 选项进行配置。
- 例如，这里我们创建一个 `MySQL` 容器，将运行我们 `Web` 应用的容器连接到这个 `MySQL` 容器上，打通两个容器间的网络，实现它们之间的网络互通...

```
$ sudo docker run -d --name mysql -e MYSQL_RANDOM_ROOT_PASSWORD=yes mysql
$ sudo docker run -d --name webapp --link mysql webapp:latest...
```

- 容器间的网络已经打通，那么我们要如何在` Web `应用中连接到 `MySQL` 数据库呢？`Docker` 为容器间连接提供了一种非常友好的方式，我们只需要将容器的网络命名填入到连接地址中，就可以访问需要连接的容器了。
- 假设我们在 `Web` 应用中使用的是 `JDBC` 进行数据库连接的，我们可以这么填写连接...

```
String url = "jdbc:mysql://mysql:3306/webapp";
```

- 在这里，连接地址中的 `mysql` 就好似我们常见的域名解析，`Docker` 会将其指向 `MySQL` 容器的 `IP` 地址。
- 看到这里，读者们有没有发现 `Docker` 在容器互通中为我们带来的一项便利，也就是我们不再需要真实的知道另外一个容器的 `IP` 地址就能进行连接。再具体来对比，在以往的开发中，我们每切换一个环境 ( 例如将程序从开发环境提交到测试环境 )，都需要重新配置程序中的各项连接地址等参数，而在 `Docker` 里，我们并不需要关心这个，只需要程序中配置被连接容器的别名，映射` IP` 的工作就交给 `Docker` 完成了...

### 7.5 暴露端口

- 需要注意的是，虽然容器间的网络打通了，但并不意味着我们可以任意访问被连接容器中的任何服务。`Docker` 为容器网络增加了一套安全机制，只有容器自身允许的端口，才能被其他容器所访问。
- 这个容器自我标记端口可被访问的过程，我们通常称为暴露端口。我们在 `docker ps` 的结果中可以看到容器暴露给其他容器访问的端口

```
$ sudo docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                 NAMES
95507bc88082        mysql:5.7           "docker-entrypoint.s…"   17 seconds ago      Up 16 seconds       3306/tcp, 33060/tcp   mysql...
```

- 这里我们看到，`MySQL` 这个容器暴露的端口是 `3306` 和 `33060`。所以我们连接到 `MySQL` 容器后，只能对这两个端口进行访问。
- 端口的暴露可以通过 `Docker` 镜像进行定义，也可以在容器创建时进行定义。在容器创建时进行定义的方法是借助 `--expose` 这个选项...

```
$ sudo docker run -d --name mysql -e MYSQL_RANDOM_ROOT_PASSWORD=yes --expose 13306 --expose 23306 mysql:5.7
```

> 这里我们为 `MySQL` 暴露了 `13306` 和 `23306` 这两个端口，暴露后我们可以在 `docker ps` 中看到这两个端口已经成功的打开

```
$ sudo docker ps 
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                                       NAMES
3c4e645f21d7        mysql:5.7           "docker-entrypoint.s…"   4 seconds ago       Up 3 seconds        3306/tcp, 13306/tcp, 23306/tcp, 33060/tcp   mysql...
```

> 容器暴露了端口只是类似我们打开了容器的防火墙，具体能不能通过这个端口访问容器中的服务，还需要容器中的应用监听并处理来自这个端口的请求。

### 7.6 通过别名连接

> 纯粹的通过容器名来打开容器间的网络通道缺乏一定的灵活性，在 `Docker` 里还支持连接时使用别名来使我们摆脱容器名的限制。

```
$ sudo docker run -d --name webapp --link mysql:database webapp:latest
```

> 在这里，我们使用 `--link <name>:<alias>` 的形式，连接到 `MySQL` 容器，并设置它的别名为 `database`。当我们要在 `Web` 应用中使用 `MySQL` 连接时，我们就可以使用 `database` 来代替连接地址了

```
String url = "jdbc:mysql://database:3306/webapp";
```

### 7.7 管理网络

- 容器能够互相连接的前提是两者同处于一个网络中 ( 这里的网络是指容器网络模型中的网络 )。这个限制很好理解，刚才我们说了，网络这个概念我们可以理解为 `Docker` 所虚拟的子网，而容器网络沙盒可以看做是虚拟的主机，只有当多个主机在同一子网里时，才能互相看到并进行网络数据交换。
- 当我们启动 `Docker` 服务时，它会为我们创建一个默认的 `bridge` 网络，而我们创建的容器在不专门指定网络的情况下都会连接到这个网络上。所以我们刚才之所以能够把 `webapp` 容器连接到 `mysql `容器上，其原因是两者都处于 `bridge` 这个网络上。
- 我们通过 `docker inspect `命令查看容器，可以在 `Network` 部分看到容器网络相关的信息...


```
$ sudo docker inspect mysql
[
    {
## ......
        "NetworkSettings": {
## ......
            "Networks": {
                "bridge": {
                    "IPAMConfig": null,
                    "Links": null,
                    "Aliases": null,
                    "NetworkID": "bc14eb1da66b67c7d155d6c78cb5389d4ffa6c719c8be3280628b7b54617441b",
                    "EndpointID": "1e201db6858341d326be4510971b2f81f0f85ebd09b9b168e1df61bab18a6f22",
                    "Gateway": "172.17.0.1",
                    "IPAddress": "172.17.0.2",
                    "IPPrefixLen": 16,
                    "IPv6Gateway": "",
                    "GlobalIPv6Address": "",
                    "GlobalIPv6PrefixLen": 0,
                    "MacAddress": "02:42:ac:11:00:02",
                    "DriverOpts": null
                }
            }
## ......
        }
## ......
    }
]...
```

- 这里我们能够看到 `mysql` 容器在 `bridge `网络中所分配的 `IP` 地址，其自身的端点、`Mac` 地址，`bridge` 网络的网关地址等信息。
- `Docker` 默认创建的这个 `bridge` 网络是非常重要的，理由自然是在没有明确指定容器网络时，容器都会连接到这个网络中。在之前讲解 `Docker for Win` 和 `Docker for Mac` 安装的时候，我们提到过这两个软件的配置中都有一块配置 `Docker` 中默认网络的内容，这块所指的默认网络就是这个 `bridge` 网络...

### 7.8 创建网络

- 在 `Docker` 里，我们也能够创建网络，形成自己定义虚拟子网的目的。
- `docker CLI` 里与网络相关的命令都以 ` network` 开头，其中创建网络的命令是 `docker network create`


```
$ sudo docker network create -d bridge individual
```

- 通过 `-d` 选项我们可以为新的网络指定驱动的类型，其值可以是刚才我们所提及的 `bridge`、`host`、`overlay`、`maclan`、`none`，也可以是其他网络驱动插件所定义的类型。这里我们使用的是 `Bridge Driver` ( 当我们不指定网络驱动时，`Docker `也会默认采用 `Bridge Driver `作为网络驱动 )。
- 通过 `docker network ls` 或是 `docker network list` 可以查看 `Docker` 中已经存在的网络...

```
$ sudo docker network ls
NETWORK ID          NAME                DRIVER              SCOPE
bc14eb1da66b        bridge              bridge              local
35c3ef1cc27d        individual          bridge              local...
```

> 之后在我们创建容器时，可以通过 `--network` 来指定容器所加入的网络，一旦这个参数被指定，容器便不会默认加入到 `bridge` 这个网络中了 ( 但是仍然可以通过 `--network bridge` 让其加入 )。

```
$ sudo docker run -d --name mysql -e MYSQL_RANDOM_ROOT_PASSWORD=yes --network individual mysql:5.7
```

> 我们通过 `docker inspect` 观察一下此时的容器网络

```
$ sudo docker inspect mysql
[
    {
## ......
        "NetworkSettings": {
## ......
            "Networks": {
                "individual": {
                    "IPAMConfig": null,
                    "Links": null,
                    "Aliases": [
                        "2ad678e6d110"
                    ],
                    "NetworkID": "35c3ef1cc27d24e15a2b22bdd606dc28e58f0593ead6a57da34a8ed989b1b15d",
                    "EndpointID": "41a2345b913a45c3c5aae258776fcd1be03b812403e249f96b161e50d66595ab",
                    "Gateway": "172.18.0.1",
                    "IPAddress": "172.18.0.2",
                    "IPPrefixLen": 16,
                    "IPv6Gateway": "",
                    "GlobalIPv6Address": "",
                    "GlobalIPv6PrefixLen": 0,
                    "MacAddress": "02:42:ac:12:00:02",
                    "DriverOpts": null
                }
            }
## ......
        }
## ......
    }
]...

```

- 可以看到，容器所加入网络已经变成了 `individual `这个网络了。
- 这时候我们通过` --link` 让处于另外一个网络的容器连接到这个容器上，看看会发生什么样的效果

```
$ sudo docker run -d --name webapp --link mysql --network bridge webapp:latest
docker: Error response from daemon: Cannot link to /mysql, as it does not belong to the default network.
ERRO[0000] error waiting for container: context canceled...
```

- 可以看到容器并不能正常的启动，而 `Docker` 提醒我们两个容器处于不同的网络，之间是不能相互连接引用的。
- 我们来改变一下，让运行 `Web `应用的容器加入到 `individual` 这个网络，就可以成功建立容器间的网络连接了

```
$ sudo docker run -d --name webapp --link mysql --network individual webapp:latest
```

### 7.9 端口映射

> 刚才我们提及的都是容器直接通过 `Docker` 网络进行的互相访问，在实际使用中，还有一个非常常见的需求，就是我们需要在容器外通过网络访问容器中的应用。最简单的一个例子，我们提供了 Web 服务，那么我们就需要提供一种方式访问运行在容器中的 Web 应用。

- 在 `Docker` 中，提供了一个端口映射的功能实现这样的需求...

![](https://user-gold-cdn.xitu.io/2018/9/23/16605128077de72a)

- 通过 `Docker` 端口映射功能，我们可以把容器的端口映射到宿主操作系统的端口上，当我们从外部访问宿主操作系统的端口时，数据请求就会自动发送给与之关联的容器端口
- 要映射端口，我们可以在创建容器时使用 `-p` 或者是 `--publish `选项...

```
$ sudo docker run -d --name nginx -p 80:80 -p 443:443 nginx:1.12
```

> 使用端口映射选项的格式是 `-p <ip>:<host-port>:<container-port>`，其中 `ip` 是宿主操作系统的监听 `ip`，可以用来控制监听的网卡，默认为 `0.0.0.0`，也就是监听所有网卡。`host-port` 和 `container-port` 分别表示映射到宿主操作系统的端口和容器的端口，这两者是可以不一样的，我们可以将容器的 `80` 端口映射到宿主操作系统的 8080 端口，传入 `-p 8080:80` 即可。

- 我们可以在容器列表里看到端口映射的配置...

```
$ sudo docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                                      NAMES
bc79fc5d42a6        nginx:1.12          "nginx -g 'daemon of…"   4 seconds ago       Up 2 seconds        0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp   nginx...
```

- 打印的结果里用 `->` 标记了端口的映射关系。


### 7.10 在 Windows 和 macOS 中使用映射

> `Docker` 的端口映射功能是将容器端口映射到宿主操作系统的端口上，实际来说就是映射到了 `Linux` 系统的端口上。而我们知道，在 `Windows` 和 `macOS` 中运行的 Docker，其 Linux 环境是被虚拟出来的，如果我们仅仅是将端口映射到 `Linux` 上，由于虚拟环境还有一层隔离，我们依然不能通过` Windows` 或` macOS` 的端口来访问容器。

- 解决这种问题的方法很简单，只需要再加一次映射，将虚拟 `Linux` 系统中的端口映射到 `Windows` 或 `macOS` 的端口即可。...

![](https://user-gold-cdn.xitu.io/2018/9/23/166053965573b1f4)

- 如果我们使用 `Docker for Windows` 或 `Docker for` Mac，这个端口映射的操作程序会自动帮助我们完成，所以我们不需要做任何额外的事情，就能够直接使用 `Windows` 或 `macOS` 的端口访问容器端口了。
- 而当我们使用 `Docker Toolbox` 时，由于其自动化能力比较差，所以需要我们在 `VirtualBox` 里单独配置这个操作系统端口到 `Linux` 端口的映射关系...

![](https://user-gold-cdn.xitu.io/2018/9/23/166053d78b8b1f5c)

> 在 `VirtualBox` 配置中的端口转发一栏里，进行相关的配置即可

## 八、管理和存储数据

### 8.1 数据管理实现方式

**Docker 容器中的文件系统于我们这些开发使用者来说，虽然有很多优势，但也有很多弊端，其中显著的两点就是**

- 沙盒文件系统是跟随容器生命周期所创建和移除的，数据无法直接被持久化存储。
- 由于容器隔离，我们很难从容器外部获得或操作容器内部文件中的数据

> 当然，`Docker` 很好的解决了这些问题，这主要还是归功于 `Docker` 容器文件系统是基于 `UnionFS`。由于 `UnionFS` 支持挂载不同类型的文件系统到统一的目录结构中，所以我们只需要将宿主操作系统中，文件系统里的文件或目录挂载到容器中，便能够让容器内外共享这个文件。

- 由于通过这种方式可以互通容器内外的文件，那么文件数据持久化和操作容器内文件的问题就自然而然的解决了。
- 同时，`UnionFS` 带来的读写性能损失是可以忽略不计的，所以这种实现可以说是相当优秀的...

### 8.2 挂载方式

> 基于底层存储实现，`Docker` 提供了三种适用于不同场景的文件系统挂载方式：Bind `Mount`、`Volume` 和 `Tmpfs Mount`

![](https://user-gold-cdn.xitu.io/2018/9/25/1660eff4b182c891)

- `Bind Mount` 能够直接将宿主操作系统中的目录和文件挂载到容器内的文件系统中，通过指定容器外的路径和容器内的路径，就可以形成挂载映射关系，在容器内外对文件的读写，都是相互可见的。
- `Volume` 也是从宿主操作系统中挂载目录到容器内，只不过这个挂载的目录由 Docker 进行管理，我们只需要指定容器内的目录，不需要关心具体挂载到了宿主操作系统中的哪里。
- `Tmpfs Mount` 支持挂载系统内存中的一部分到容器的文件系统里，不过由于内存和容器的特征，它的存储并不是持久的，其中的内容会随着容器的停止而消失...

### 8.3 挂载文件到容器

> 要将宿主操作系统中的目录挂载到容器之后，我们可以在容器创建的时候通过传递 -v 或 --volume 选项来指定内外挂载的对应目录或文件

```
$ sudo docker run -d --name nginx -v /webapp/html:/usr/share/nginx/html nginx:1.12
```

- 使用 `-v `或 `--volume` 来挂载宿主操作系统目录的形式是 `-v <host-path>:<container-path>` 或 `--volume <host-path>:<container-path>`，其中 `host-path` 和 `container-path` 分别代表宿主操作系统中的目录和容器中的目录。这里需要注意的是，为了避免混淆，`Docker `这里强制定义目录时必须使用绝对路径，不能使用相对路径。
- 我们能够指定目录进行挂载，也能够指定具体的文件来挂载，具体选择何种形式来挂载，大家可以根据具体的情况来选择。
- 当挂载了目录的容器启动后，我们可以看到我们在宿主操作系统中的文件已经出现在容器中了...

```
$ sudo docker exec nginx ls /usr/share/nginx/html
index.html
```

> 在 `docker inspect` 的结果里，我们可以看到有关容器数据挂载相关的信息

```
$ sudo docker inspect nginx
[
    {
## ......
        "Mounts": [
            {
                "Type": "bind",
                "Source": "/webapp/html",
                "Destination": "/usr/share/nginx/html",
                "Mode": "",
                "RW": true,
                "Propagation": "rprivate"
            }
        ],
## ......
    }
]...
```

> 在关于挂载的信息中我们可以看到一个 `RW` 字段，这表示挂载目录或文件的读写性 ( `Read and Write` )。实际操作中，`Docker` 还支持以只读的方式挂载，通过只读方式挂载的目录和文件，只能被容器中的程序读取，但不接受容器中程序修改它们的请求。在挂载选项 `-v `后再接上 `:ro` 就可以只读挂载了...

```
$ sudo docker run -d --name nginx -v /webapp/html:/usr/share/nginx/html:ro nginx:1.12
```

### 8.4 挂载临时文件目录

- `Tmpfs Mount` 是一种特殊的挂载方式，它主要利用内存来存储数据。由于内存不是持久性存储设备，所以其带给 `Tmpfs Mount` 的特征就是临时性挂载。
- 与挂载宿主操作系统目录或文件不同，挂载临时文件目录要通过 `--tmpfs` 这个选项来完成。由于内存的具体位置不需要我们来指定，这个选项里我们只需要传递挂载到容器内的目录即可。...


```
$ sudo docker run -d --name webapp --tmpfs /webapp/cache webapp:latest
```

> 容器已挂载的临时文件目录我们也可以通过 `docker inspect` 命令查看。

```
$ sudo docker inspect webapp
[
    {
## ......
         "Tmpfs": {
            "/webapp/cache": ""
        },
## ......
    }
]...
```

- 挂载临时文件首先要注意它不是持久存储这一特性，在此基础上，它有几种常见的适应场景。
- 应用中使用到，但不需要进行持久保存的敏感数据，可以借助内存的非持久性和程序隔离性进行一定的安全保障。
- 读写速度要求较高，数据变化量大，但不需要持久保存的数据，可以借助内存的高读写速度减少操作的时间...

### 8.5 使用数据卷

- 除了与其他虚拟机工具近似的宿主操作系统目录挂载的功能外，`Docker` 还创造了数据卷 ( `Volume` ) 这个概念。数据卷的本质其实依然是宿主操作系统上的一个目录，只不过这个目录存放在` Docker` 内部，接受 `Docker `的管理。
- 在使用数据卷进行挂载时，我们不需要知道数据具体存储在了宿主操作系统的何处，只需要给定容器中的哪个目录会被挂载即可。
- 我们依然可以使用 `-v `或 `--volume` 选项来定义数据卷的挂载。...

```
$ sudo docker run -d --name webapp -v /webapp/storage webapp:latest
```

> 数据卷挂载到容器后，我们可以通过 `docker inspect` 看到容器中数据卷挂载的信息。

```
$ sudo docker inspect webapp
[
    {
## ......
        "Mounts": [
            {
                "Type": "volume",
                "Name": "2bbd2719b81fbe030e6f446243386d763ef25879ec82bb60c9be7ef7f3a25336",
                "Source": "/var/lib/docker/volumes/2bbd2719b81fbe030e6f446243386d763ef25879ec82bb60c9be7ef7f3a25336/_data",
                "Destination": "/webapp/storage",
                "Driver": "local",
                "Mode": "",
                "RW": true,
                "Propagation": ""
            }
        ],
## ......
    }
]...

```

- 这里我们所得到的信息与绑定挂载有所区别，除了 `Type` 中的类型不一样之外，在数据卷挂载中，我们还要关注一下` Name` 和 `Source` 这两个信息。
- 其中 `Source` 是 `Docker` 为我们分配用于挂载的宿主机目录，其位于 `Docker` 的资源区域 ( 这里是默认的`/var/lib/docker` ) 内。当然，我们并不需要关心这个目录，一切对它的管理都已经在 `Docker `内实现了。
- 为了方便识别数据卷，我们可以像命名容器一样为数据卷命名，这里的 `Name` 就是数据卷的命名。在我们未给出数据卷命名的时候，`Docker `会采用数据卷的 `ID` 命名数据卷。我们也可以通过 `-v <name>:<container-path>` 这种形式来命名数据卷...

```
$ sudo docker run -d --name webapp -v appdata:/webapp/storage webapp:latest
```

> 由于 `-v` 选项既承载了 `Bind Mount` 的定义，又参与了 `Volume` 的定义，所以其传参方式需要特别留意。前面提到了`，-v` 在定义绑定挂载时必须使用绝对路径，其目的主要是为了避免与数据卷挂载中命名这种形式的冲突。

## 九、操作镜像：保存和共享镜像

### 9.1 提交容器更改

- 之前我们已经介绍过了，`Docker` 镜像的本质是多个基于 `UnionFS` 的镜像层依次挂载的结果，而容器的文件系统则是在以只读方式挂载镜像后增加的一个可读可写的沙盒环境。
- 基于这样的结构，`Docker` 中为我们提供了将容器中的这个可读可写的沙盒环境持久化为一个镜像层的方法。更浅显的说，就是我们能够很轻松的在 `Docker` 里将容器内的修改记录下来，保存为一个新的镜像。
- 将容器修改的内容保存为镜像的命令是 `docker` commit，由于镜像的结构很像代码仓库里的修改记录，而记录容器修改的过程又像是在提交代码，所以这里我们更形象的称之为提交容器的更改...

```
$ sudo docker commit webapp
sha256:0bc42f7ff218029c6c4199ab5c75ab83aeaaed3b5c731f715a3e807dda61d19e
```

- `Docker` 执行将容器内沙盒文件系统记录成镜像层的时候，会先暂停容器的运行，以保证容器内的文件系统处于一个相对稳定的状态，确保数据的一致性。
- 在使用 `docker commit` 提交镜像更新后，我们可以得到 `Docker `创建的新镜像的 `ID`，之后我们也能够从本地镜像列表中找到它...

```
$ sudo docker images
REPOSITORY            TAG                 IMAGE ID            CREATED             SIZE
<none>                <none>              0bc42f7ff218        3 seconds ago       372MB
## .........
```

> 像通过 `Git` 等代码仓库软件提交代码一样，我们还能在提交容器更改的时候给出一个提交信息，方便以后查询

```
$ sudo docker commit -m "Configured" webapp
```

### 9.2 为镜像命名

- 在上面的例子里，我们发现提交容器更新后产生的镜像并没 `REPOSITORY` 和 `TAG` 的内容，也就是说，这个新的镜像还没有名字。
- 之前我们谈到过，使用没有名字的镜像并不是很好的选择，因为我们无法直观的看到我们正在使用什么。好在 `Docker` 为我们提供了一个为镜像取名的命令，也就是 `docker tag` 命令...

```
$ sudo docker tag 0bc42f7ff218 webapp:1.0
```

> 使用 `docker tag` 能够为未命名的镜像指定镜像名，也能够对已有的镜像创建一个新的命名

```
$ sudo docker tag webapp:1.0 webapp:latest
```

> 当我们对未命名的镜像进行命名后，`Docker` 就不会在镜像列表里继续显示这个镜像，取而代之的是我们新的命名。而如果我们对以后镜像使用 `docker tag`，旧的镜像依然会存在于镜像列表中。

```
$ sudo docker images
REPOSITORY            TAG                 IMAGE ID            CREATED             SIZE
webapp                1.0                 0bc42f7ff218        29 minutes ago      372MB
webapp                latest              0bc42f7ff218        29 minutes ago      372MB
## .........
```

- 由于镜像是对镜像层的引用记录，所以我们对镜像进行命名后，虽然能够在镜像列表里同时看到新老两个镜像，实质是它们其实引用着相同的镜像层，这个我们能够从镜像 ID 中看得出来 ( 因为镜像 `ID` 就是最上层镜像层的 `ID` )。正是这个原因，我们虽然创建了新的镜像，但对物理存储的占用空间却不是镜像大小直接翻倍，并且创建也在霎那之间。
- 除了使用 `docker tag` 在容器提交为新的镜像后为镜像命名这种方式外，我们还可以直接在 `docker commit` 命令里指定新的镜像名，这种方式在使用容器提交时会更加方便。...

```
$ sudo docker commit -m "Upgrade" webapp webapp：2.0
```

### 9.3 镜像的迁移


- 在我们将更新导出为镜像后，就可以开始迁移镜像的工作了。
- 由于 `Docker` 是以集中的方式管理镜像的，所以在迁移之前，我们要先从 `Docker` 中取出镜像。`docker save` 命令可以将镜像输出，提供了一种让我们保存镜像到 Docker 外部的方式...

```
$ sudo docker save webapp:1.0 > webapp-1.0.tar
```

- 在默认定义下，`docker save` 命令会将镜像内容放入输出流中，这就需要我们使用管道进行接收 ( 也就是命令中的 > 符号 )，这属于 `Linux `等系统控制台中的用法，这里我们不做详细讲解。
- 管道这种用法有时候依然不太友好，`docker save` 命令还为我们提供了 `-o` 选项，用来指定输出文件，使用这个选项可以让命令更具有统一性。...

```
$ sudo docker save -o ./webapp-1.0.tar webapp:1.0
```

> 在镜像导出之后，我们就可以找到已经存储镜像内容的 `webapp-1.0.tar` 这个文件了。有兴趣的朋友，可以使用解压软件查看其中的内容，你会看到里面其实就是镜像所基于的几个镜像层的记录文件

### 9.4 导入镜像

- 我们可以通过很多种方式将导出的镜像文件复制到另一台机器上，在这么操作之后，我们就要将镜像导入到这台新机器中运行的 `Docker` 中
- 导入镜像的方式也很简单，使用与 `docker save` 相对的 `docker load` 命令即可

```
$ sudo docker load < webapp-1.0.tar
```

> 相对的，`docker load` 命令是从输入流中读取镜像的数据，所以我们这里也要使用管道来传输内容。当然，我们也能够使用 `-i` 选项指定输入文件

```
$ sudo docker load -i webapp-1.0.tar
```

> 镜像导入后，我们就可以通过 `docker images` 看到它了，导入的镜像会延用原有的镜像名称

### 9.5 批量迁移

> 通过 `docker save` 和 `docker load `命令我们还能够批量迁移镜像，只要我们在 `docker save` 中传入多个镜像名作为参数，它就能够将这些镜像都打成一个包，便于我们一次性迁移多个镜像。

```
$ sudo docker save -o ./images.tar webapp:1.0 nginx:1.12 mysql:5.7
```

> 装有多个镜像的包可以直接被 `docker load` 识别和读取，我们将这个包导入后，所有其中装载的镜像都会被导入到 `Docker `之中。

### 9.6 导出和导入容器

- 也许 `Docker` 的开发者认为，提交镜像修改，再导出镜像进行迁移的方法还不够效率，所以还为我们提供了一个导出容器的方法。
- 使用 `docker export` 命令我们可以直接导出容器，我们可以把它简单的理解为 `docker commit` 与 `docker save` 的结合体...

```
$ sudo docker export -o ./webapp.tar webapp
```

> 相对的，使用 `docker export` 导出的容器包，我们可以使用 `docker import` 导入。这里需要注意的是，使用 `docker import` 并非直接将容器导入，而是将容器运行时的内容以镜像的形式导入。所以导入的结果其实是一个镜像，而不是容器。在 `docker import` 的参数里，我们可以给这个镜像命名...

```
$ sudo docker import ./webapp.tar webapp:1.0
```

> 在开发的过程中，使用 `docker save` 和 `docker load`，或者是使用 `docker export `和 `docker import` 都可以达到迁移容器或者镜像的目的


## 十、操作镜像：通过 Dockerfile 创建镜像

### 10.1 关于 Dockerfile

> `Dockerfile` 是 `Docker `中用于定义镜像自动化构建流程的配置文件，在 `Dockerfile` 中，包含了构建镜像过程中需要执行的命令和其他操作。通过 `Dockerfile` 我们可以更加清晰、明确的给定 `Docker` 镜像的制作过程，而由于其仅是简单、小体积的文件，在网络等其他介质中传递的速度极快，能够更快的帮助我们实现容器迁移和集群部署...


![](https://user-gold-cdn.xitu.io/2018/10/1/1662ee4fdf802776)

> 通常来说，我们对 `Dockerfile` 的定义就是针对一个名为` Dockerfile` 的文件，其虽然没有扩展名，但本质就是一个文本文件，所以我们可以通过常见的文本编辑器或者 `IDE` 创建和编辑它。

- `Dockerfile` 的内容很简单，主要以两种形式呈现，一种是注释行，另一种是指令行...

```
# Comment
INSTRUCTION arguments
```

> 在 `Dockerfile` 中，拥有一套独立的指令语法，其用于给出镜像构建过程中所要执行的过程。`Dockerfile` 里的指令行，就是由指令与其相应的参数所组成

### 10.2 环境搭建与镜像构建

- 如果具体来说 `Dockerfile` 的作用和其实际运转的机制，我们可以用一个我们开发中的常见流程来比较。
- 在一个完整的开发、测试、部署过程中，程序运行环境的定义通常是由开发人员来进行的，因为他们更加熟悉程序运转的各个细节，更适合搭建适合程序的运行环境。
- 在这样的前提下，为了方便测试和运维搭建相同的程序运行环境，常用的做法是由开发人员编写一套环境搭建手册，帮助测试人员和运维人员了解环境搭建的流程。
- 而 `Dockerfile` 就很像这样一个环境搭建手册，因为其中包含的就是一个构建容器的过程。
- 而比环境搭建手册更好的是，`Dockerfile` 在容器体系下能够完成自动构建，既不需要测试和运维人员深入理解环境中各个软件的具体细节，也不需要人工执行每一个搭建流程。...

### 10.3 编写 Dockerfile

> 相对于之前我们介绍的提交容器修改，再进行镜像迁移的方式相比，使用 `Dockerfile` 进行这项工作有很多优势，我总结了几项尤为突出的。

- `Dockerfile` 的体积远小于镜像包，更容易进行快速迁移和部署。
- 环境构建流程记录了` Dockerfile `中，能够直观的看到镜像构建的顺序和逻辑。
- 使用 `Dockerfile` 来构建镜像能够更轻松的实现自动部署等自动化流程。
- 在修改环境搭建细节时，修改 `Dockerfile` 文件要比从新提交镜像来的轻松、简单。...

> 纸上得来终觉浅，光说很多关于 `Dockerfile` 的概念其实对我们开发使用来说意义不大，这里我们直接学习如何编写一个用于构建镜像的 `Dockerfile`。

- 首先我们来看一个完整的 `Dockerfile `的例子，这是用于构建 `Docker `官方所提供的 `Redis `镜像的 `Dockerfile` 文件...

```
FROM debian:stretch-slim

# add our user and group first to make sure their IDs get assigned consistently, regardless of whatever dependencies get added
RUN groupadd -r redis && useradd -r -g redis redis

# grab gosu for easy step-down from root
# https://github.com/tianon/gosu/releases
ENV GOSU_VERSION 1.10
RUN set -ex; \
	\
	fetchDeps=" \
		ca-certificates \
		dirmngr \
		gnupg \
		wget \
	"; \
	apt-get update; \
	apt-get install -y --no-install-recommends $fetchDeps; \
	rm -rf /var/lib/apt/lists/*; \
	\
	dpkgArch="$(dpkg --print-architecture | awk -F- '{ print $NF }')"; \
	wget -O /usr/local/bin/gosu "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$dpkgArch"; \
	wget -O /usr/local/bin/gosu.asc "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$dpkgArch.asc"; \
	export GNUPGHOME="$(mktemp -d)"; \
	gpg --keyserver ha.pool.sks-keyservers.net --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4; \
	gpg --batch --verify /usr/local/bin/gosu.asc /usr/local/bin/gosu; \
	gpgc...
```

> 其中可以很明确的见到我们之前说的 `Dockerfile` 文件的两种行结构，也就是指令行和注释行，接下来我们着重关注指令行，因为这是构建镜像的关键

### 10.4 Dockerfile 的结构

> 总体上来说，我们可以将 `Dockerfile` 理解为一个由上往下执行指令的脚本文件。当我们调用构建命令让 `Docker` 通过我们给出的`Dockerfile` 构建镜像时，Docker 会逐一按顺序解析 `Dockerfile` 中的指令，并根据它们不同的含义执行不同的操作。

如果进行细分，我们可以将 `Dockerfile` 的指令简单分为五大类。...

- **基础指令**：用于定义新镜像的基础和性质。
- **控制指令**：是指导镜像构建的核心部分，用于描述镜像在构建过程中需要执行的命令。
- **引入指令**：用于将外部文件直接引入到构建镜像内部。
- **执行指令**：能够为基于镜像所创建的容器，指定在启动时需要执行的脚本或命令。
- **配置指令**：对镜像以及基于镜像所创建的容器，可以通过配置指令对其网络、用户等内容进行配置...

### 10.5 常见 Dockerfile 指令

> 熟悉 `Dockerfile` 的指令是编写 `Dockerfile` 的前提，这里我们先来介绍几个最常见的 `Dockerfile` 指令，它们基本上囊括了所有 `Dockerfile` 中` 90% `以上的工作。

**FROM**

- 通常来说，我们不会从零开始搭建一个镜像，而是会选择一个已经存在的镜像作为我们新镜像的基础，这种方式能够大幅减少我们的时间。
- 在 `Dockerfile` 里，我们可以通过 `FROM` 指令指定一个基础镜像，接下来所有的指令都是基于这个镜像所展开的。在镜像构建的过程中，`Docker` 也会先获取到这个给出的基础镜像，再从这个镜像上进行构建操作。
- `FROM` 指令支持三种形式，不管是哪种形式，其核心逻辑就是指出能够被 `Docker` 识别的那个镜像，好让 `Docker `从那个镜像之上开始构建工作...

```
FROM <image> [AS <name>]
FROM <image>[:<tag>] [AS <name>]
FROM <image>[@<digest>] [AS <name>]
```

- 既然选择一个基础镜像是构建新镜像的根本，那么 `Dockerfile` 中的第一条指令必须是` FROM` 指令，因为没有了基础镜像，一切构建过程都无法开展。
- 当然，一个 `Dockerfile` 要以 `FROM` 指令作为开始并不意味着 `FROM `只能是 `Dockerfile `中的第一条指令。在 `Dockerfile` 中可以多次出现 `FROM `指令，当 `FROM` 第二次或者之后出现时，表示在此刻构建时，要将当前指出镜像的内容合并到此刻构建镜像的内容里。这对于我们直接合并两个镜像的功能很有帮助...


**RUN**

- 镜像的构建虽然是按照指令执行的，但指令只是引导，最终大部分内容还是控制台中对程序发出的命令，而 `RUN` 指令就是用于向控制台发送命令的指令。
- 在` RUN `指令之后，我们直接拼接上需要执行的命令，在构建时，`Docker` 就会执行这些命令，并将它们对文件系统的修改记录下来，形成镜像的变化。...

```
RUN <command>
RUN ["executable", "param1", "param2"]
```

> `RUN` 指令是支持` \` 换行的，如果单行的长度过长，建议对内容进行切割，方便阅读。而事实上，我们会经常看到 `\` 分割的命令，例如在上面我们贴出的 `Redis` 镜像的 `Dockerfile` 里

**ENTRYPOINT 和 CMD**

> 基于镜像启动的容器，在容器启动时会根据镜像所定义的一条命令来启动容器中进程号为 `1` 的进程。而这个命令的定义，就是通过 `Dockerfile` 中的 `NTRYPOINT` 和 `CMD` 实现的。

```
ENTRYPOINT ["executable", "param1", "param2"]
ENTRYPOINT command param1 param2

CMD ["executable","param1","param2"]
CMD ["param1","param2"]
CMD command param1 param2...
```

- `ENTRYPOINT` 指令和 `CMD` 指令的用法近似，都是给出需要执行的命令，并且它们都可以为空，或者说是不在 `Dockerfile` 里指出。
- 当 `ENTRYPOINT` 与 `CMD` 同时给出时，`CMD` 中的内容会作为 `ENTRYPOINT` 定义命令的参数，最终执行容器启动的还是 `ENTRYPOINT` 中给出的命令...

**EXPOSE**

> 由于我们构建镜像时更了解镜像中应用程序的逻辑，也更加清楚它需要接收和处理来自哪些端口的请求，所以在镜像中定义端口暴露显然是更合理的做法。

- 通过 `EXPOSE` 指令就可以为镜像指定要暴露的端口。

```
EXPOSE <port> [<port>/<protocol>...]
```

> 当我们通过` EXPOSE `指令配置了镜像的端口暴露定义，那么基于这个镜像所创建的容器，在被其他容器通过 `--link` 选项连接时，就能够直接允许来自其他容器对这些端口的访问了

**VOLUME**

- 在一些程序里，我们需要持久化一些数据，比如数据库中存储数据的文件夹就需要单独处理。在之前的小节里，我们提到可以通过数据卷来处理这些问题。
- 但使用数据卷需要我们在创建容器时通过 `-v` 选项来定义，而有时候由于镜像的使用者对镜像了解程度不高，会漏掉数据卷的创建，从而引起不必要的麻烦。
- 还是那句话，制作镜像的人是最清楚镜像中程序工作的各项流程的，所以它来定义数据卷也是最合适的。所以在 `Dockerfile` 里，提供了 `VOLUME` 指令来定义基于此镜像的容器所自动建立的数据卷...

```
VOLUME ["/data"]
```

> 在 `VOLUME` 指令中定义的目录，在基于新镜像创建容器时，会自动建立为数据卷，不需要我们再单独使用` -v `选项来配置了

**COPY 和 ADD**

> 在制作新的镜像的时候，我们可能需要将一些软件配置、程序代码、执行脚本等直接导入到镜像内的文件系统里，使用 `COPY` 或` ADD` 指令能够帮助我们直接从宿主机的文件系统里拷贝内容到镜像里的文件系统中。

```
COPY [--chown=<user>:<group>] <src>... <dest>
ADD [--chown=<user>:<group>] <src>... <dest>

COPY [--chown=<user>:<group>] ["<src>",... "<dest>"]
ADD [--chown=<user>:<group>] ["<src>",... "<dest>"]...
```

- `COPY` 与` ADD` 指令的定义方式完全一样，需要注意的仅是当我们的目录中存在空格时，可以使用后两种格式避免空格产生歧义。
- 对比` COPY` 与 `ADD`，两者的区别主要在于 `ADD` 能够支持使用网络端的` URL` 地址作为 `src` 源，并且在源文件被识别为压缩包时，自动进行解压，而` COPY` 没有这两个能力。
- 虽然看上去 `COPY` 能力稍弱，但对于那些不希望源文件被解压或没有网络请求的场景，`COPY `指令是个不错的选择。...

### 10.6 构建镜像

> 在编写好 `Dockerfile` 之后，我们就可以构建我们所定义的镜像了，构建镜像的命令为 `docker build`

```
$ sudo docker build ./webapp
```

- `docker build` 可以接收一个参数，需要特别注意的是，这个参数为一个目录路径 ( 本地路径或 URL 路径 )，而并非 Dockerfile` 文件的路径。在 `docker build` 里，这个我们给出的目录会作为构建的环境目录，我们很多的操作都是基于这个目录进行的。
- 例如，在我们使用 `COPY` 或是 `ADD` 拷贝文件到构建的新镜像时，会以这个目录作为基础目录。
- 在默认情况下，`docker build` 也会从这个目录下寻找名为 `Dockerfile` 的文件，将它作为 `Dockerfile `内容的来源。如果我们的 `Dockerfile` 文件路径不在这个目录下，或者有另外的文件名，我们可以通过 `-f `选项单独给出 `Dockerfile `文件的路径。...

```
$ sudo docker build -t webapp:latest -f ./webapp/a.Dockerfile ./webapp
```

> 当然，在构建时我们最好总是携带上 `-t` 选项，用它来指定新生成镜像的名称。

```
$ sudo docker build -t webapp:latest ./webapp
```

## 十一、常见 Dockerfile 使用技巧

### 11.1 构建中使用变量

> 在实际编写 `Dockerfile` 时，与搭建环境相关的指令会是其中占有大部分比例的指令。在搭建程序所需运行环境时，难免涉及到一些可变量，例如依赖软件的版本，编译的参数等等。我们可以直接将这些数据写入到 `Dockerfile` 中完全没有问题，有问题的是这些可变量我们会经常调整，在调整时就需要我们到 `Dockerfile` 中找到它们并进行更改，如果只是简单的 `Dockerfile` 文件尚且好说，但如果是相对复杂或是存在多处变量的 `Dockerfile` 文件，这个工作就变得繁琐而让人烦躁了。

- 在 `Dockerfile` 里，我们可以用 `ARG` 指令来建立一个参数变量，我们可以在构建时通过构建指令传入这个参数变量，并且在 `Dockerfile `里使用它。
- 例如，我们希望通过参数变量控制 `Dockerfile` 中某个程序的版本，在构建时安装我们指定版本的软件，我们可以通过 `ARG` 定义的参数作为占位符，替换版本定义的部分...

```
FROM debian:stretch-slim

## ......

ARG TOMCAT_MAJOR
ARG TOMCAT_VERSION

## ......

RUN wget -O tomcat.tar.gz "https://www.apache.org/dyn/closer.cgi?action=download&filename=tomcat/tomcat-$TOMCAT_MAJOR/v$TOMCAT_VERSION/bin/apache-tomcat-$TOMCAT_VERSION.tar.gz"

## .........
```

- 在这个例子里，我们将 `Tomcat` 的版本号通过 `ARG` 指令定义为参数变量，在调用下载 `Tomcat` 包时，使用变量替换掉下载地址中的版本号。通过这样的定义，就可以让我们在不对 `Dockerfile` 进行大幅修改的前提下，轻松实现对 `Tomcat` 版本的切换并重新构建镜像了。

> 如果我们需要通过这个 `Dockerfile `文件构建 `Tomcat` 镜像，我们可以在构建时通过 `docker build `的 `--build-arg` 选项来设置参数变量...

```
$ sudo docker build --build-arg TOMCAT_MAJOR=8 --build-arg TOMCAT_VERSION=8.0.53 -t tomcat:8.0 ./tomcat
```

### 11.2 环境变量

> 环境变量也是用来定义参数的东西，与 `ARG `指令相类似，环境变量的定义是通过 `ENV` 这个指令来完成的

```
FROM debian:stretch-slim

## ......

ENV TOMCAT_MAJOR 8
ENV TOMCAT_VERSION 8.0.53

## ......

RUN wget -O tomcat.tar.gz "https://www.apache.org/dyn/closer.cgi?action=download&filename=tomcat/tomcat-$TOMCAT_MAJOR/v$TOMCAT_VERSION/bin/apache-tomcat-$TOMCAT_VERSION.tar.gz"...
```

- 环境变量的使用方法与参数变量一样，也都是能够直接替换指令参数中的内容。
- 与参数变量只能影响构建过程不同，环境变量不仅能够影响构建，还能够影响基于此镜像创建的容器。环境变量设置的实质，其实就是定义操作系统环境变量，所以在运行的容器里，一样拥有这些变量，而容器中运行的程序也能够得到这些变量的值。
- 另一个不同点是，环境变量的值不是在构建指令中传入的，而是在 `Dockerfile` 中编写的，所以如果我们要修改环境变量的值，我们需要到 `Dockerfile` 修改。不过即使这样，只要我们将 `ENV` 定义放在 `Dockerfile` 前部容易查找的地方，其依然可以很快的帮助我们切换镜像环境中的一些内容。
- 由于环境变量在容器运行时依然有效，所以运行容器时我们还可以对其进行覆盖，在创建容器时使用 `-e `或是 `--env` 选项，可以对环境变量的值进行修改或定义新的环境变量...

```
$ sudo docker run -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:5.7
```

- 事实上，这种用法在我们开发中是非常常见的。也正是因为这种允许运行时配置的方法存在，环境变量和定义它的 `ENV` 指令，是我们更常使用的指令，我们会优先选择它们来实现对变量的操作。
- 关于环境变量是如何能够帮助我们更轻松的处理 `Docker` 镜像和容器使用等问题，我们会在下一节中进行实际展示，通过例子大家能够更容易理解它的原理。
- 另外需要说明一点，通过 `ENV` 指令和 `ARG` 指令所定义的参数，在使用时都是采用 `$ + NAME` 这种形式来占位的，所以它们之间的定义就存在冲突的可能性。对于这种场景，大家只需要记住，`ENV `指令所定义的变量，永远会覆盖` ARG` 所定义的变量，即使它们定时的顺序是相反的...

### 11.3 合并命令

在上一节我们展示的完整的官方 `Redis` 镜像的 `Dockerfile` 中，我们会发现 RUN 等指令里会聚合下大量的代码。

事实上，下面两种写法对于搭建的环境来说是没有太大区别的

```
RUN apt-get update; \
    apt-get install -y --no-install-recommends $fetchDeps; \
    rm -rf /var/lib/apt/lists/*;
```

```
RUN apt-get update
RUN apt-get install -y --no-install-recommends $fetchDeps
RUN rm -rf /var/lib/apt/lists/*
```

那为什么我们更多见的是第一种形式而非第二种呢？这就要从镜像构建的过程说起了。

看似连续的镜像构建过程，其实是由多个小段组成。每当一条能够形成对文件系统改动的指令在被执行前，`Docker` 先会基于上条命令的结果启动一个容器，在容器中运行这条指令的内容，之后将结果打包成一个镜像层，如此反复，最终形成镜像...


![](https://user-gold-cdn.xitu.io/2018/10/3/166377aa670bb4a4)

所以说，我们之前谈到镜像是由多个镜像层叠加而得，而这些镜像层其实就是在我们 `Dockerfile `中每条指令所生成的。

了解了这个原理，大家就很容易理解为什么绝大多数镜像会将命令合并到一条指令中，因为这种做法不但减少了镜像层的数量，也减少了镜像构建过程中反复创建容器的次数，提高了镜像构建的速度...

### 11.4 构建缓存

- `Docker` 在镜像构建的过程中，还支持一种缓存策略来提高镜像的构建速度。
- 由于镜像是多个指令所创建的镜像层组合而得，那么如果我们判断新编译的镜像层与已经存在的镜像层未发生变化，那么我们完全可以直接利用之前构建的结果，而不需要再执行这条构建指令，这就是镜像构建缓存的原理。
- 那么 `Docker` 是如何判断镜像层与之前的镜像间不存在变化的呢？这主要参考两个维度，第一是所基于的镜像层是否一样，第二是用于生成镜像层的指令的内容是否一样- 基于这个原则，我们在条件允许的前提下，更建议将不容易发生变化的搭建过程放到 `Dockerfile` 的前部，充分利用构建缓存提高镜像构建的速度。另外，指令的合并也不宜过度，而是将易变和不易变的过程拆分，分别放到不同的指令里。
- 在另外一些时候，我们可能不希望 `Docker` 在构建镜像时使用构建缓存，这时我们可以通过 `--no-cache `选项来禁用它...

```
$ sudo docker build --no-cache ./webapp
```

### 11.5 搭配 ENTRYPOINT 和 CMD

> 上一节我们谈到了 `ENTRYPOINT` 和 `CMD` 这两个命令，也解释了这两个命令的目的，即都是用来指定基于此镜像所创建容器里主进程的启动命令的。

- 两个指令的区别在于，`ENTRYPOINT` 指令的优先级高于 `CMD `指令。当 `ENTRYPOINT` 和 `CMD `同时在镜像中被指定时，`CMD` 里的内容会作为 `ENTRYPOINT` 的参数，两者拼接之后，才是最终执行的命令。
- 为了更好的让大家理解，这里索性列出所有的 `ENTRYPOINT` 与`CMD` 的组合，供大家参考...

|ENTRYPOINT|	CMD|	实际执行|
|--|--|--|
|ENTRYPOINT ["/bin/ep", "arge"]	||	/bin/ep arge|
|ENTRYPOINT /bin/ep arge	|	|/bin/sh -c /bin/ep arge|
||CMD ["/bin/exec", "args"]|	/bin/exec args|
||CMD /bin/exec args|	/bin/sh -c /bin/exec args|
|ENTRYPOINT ["/bin/ep", "arge"]|	CMD ["/bin/exec", "argc"]|	/bin/ep arge /bin/exec argc|
|ENTRYPOINT ["/bin/ep", "arge"]|	CMD /bin/exec args|	/bin/ep arge /bin/sh -c /bin/exec args|
|ENTRYPOINT /bin/ep arge	|CMD ["/bin/exec", "argc"]|	/bin/sh -c /bin/ep arge /bin/exec argc|
|ENTRYPOINT /bin/ep arge	|CMD /bin/exec args|	/bin/sh -c /bin/ep arge /bin/sh -c /bin/exec args|

有的读者会存在疑问，既然两者都是用来定义容器启动命令的，为什么还要分成两个，合并为一个指令岂不是更方便吗？

- 这其实在于 `ENTRYPOINT` 和` CMD `设计的目的是不同的。`ENTRYPOINT` 指令主要用于对容器进行一些初始化，而 `CMD` 指令则用于真正定义容器中主程序的启动命令。
- 另外，我们之前谈到创建容器时可以改写容器主程序的启动命令，而这个覆盖只会覆盖 `CMD` 中定义的内容，而不会影响 `ENTRYPOINT `中的内容。
- 我们依然以之前的 `Redis` 镜像为例，这是 `Redis` 镜像中对 `ENTRYPOINT` 和 `CMD` 的定义...

```
## ......

COPY docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["docker-entrypoint.sh"]

## ......

CMD ["redis-server"]...

```

- 可以很清晰的看到，`CMD` 指令定义的正是启动 Redis 的服务程序，而 `ENTRYPOINT `使用的是一个外部引入的脚本文件。
- 事实上，使用脚本文件来作为 `ENTRYPOINT` 的内容是常见的做法，因为对容器运行初始化的命令相对较多，全部直接放置在 `ENTRYPOINT` 后会特别复杂。
- 我们来看看 `Redis` 中的` ENTRYPOINT` 脚本，可以看到其中会根据脚本参数进行一些处理，而脚本的参数，其实就是 `CMD` 中定义的内容。...

```
#!/bin/sh
set -e

# first arg is `-f` or `--some-option`
# or first arg is `something.conf`
if [ "${1#-}" != "$1" ] || [ "${1%.conf}" != "$1" ]; then
	set -- redis-server "$@"
fi

# allow the container to be started with `--user`
if [ "$1" = 'redis-server' -a "$(id -u)" = '0' ]; then
	find . \! -user redis -exec chown redis '{}' +
	exec gosu redis "$0" "$@"
fi

exec "$@"...

```

- 这里我们要关注脚本最后的一条命令，也就是` exec "$@"`。在很多镜像的 `ENTRYPOINT` 脚本里，我们都会看到这条命令，其作用其实很简单，就是运行一个程序，而运行命令就是 `ENTRYPOINT `脚本的参数。反过来，由于 `ENTRYPOINT` 脚本的参数就是 `CMD` 指令中的内容，所以实际执行的就是 `CMD `里的命令。
- 所以说，虽然 `Docker` 对容器启动命令的结合机制为` CMD` 作为 `ENTRYPOINT` 的参数，合并后执行 `ENTRYPOINT `中的定义，但实际在我们使用中，我们还会在 `ENTRYPOINT` 的脚本里代理到 `CMD` 命令上。
- 相对来说，`Redis` 的 `ENTRYPOINT` 内容还是简单的，在掌握了 `ENTRYPOINT` 的相关作用后，大家可以尝试阅读和编写一些复杂的 `ENTRYPOINT` 脚本...

### 11.6 临摹案例

> 上面提及的几项只是几个比较常见的 `Dockerfile` 最佳实践，其实在编写 Dockerfile 时，还有很多不成文的小技巧。

- 想要学好 `Dockerfile` 的编写，阅读和思考前人的作品是必不可少的。
- 前面我们介绍了，`Docker` 官方提供的 `Docker Hub` 是`Docker` 镜像的中央仓库，它除了镜像丰富之外，给我们带来的另一项好处就是其大部分镜像都是能够直接提供 `Dockerfile` 文件给我们参考的。

> 要得到镜像的 `Dockerfile` 文件，我们可以进入到镜像的详情页面，在介绍中，镜像作者们通常会直接把 `Dockerfile` 的连接放在那里。...

![](https://user-gold-cdn.xitu.io/2018/10/3/16637944f4705632)

除此之外，进入到` Dockerfile` 这个栏目下，我们也能够直接看到镜像 `Dockerfile` 的内容。在页面的右侧，还有进入` Dockerfile` 源文件的连接，如果在 `Dockerfile` 中有引入其他的文件，我们可以通过这个连接访问到。...

![](https://user-gold-cdn.xitu.io/2018/10/3/166379581300d9e0)

> 另外，我自己也制作了一些软件的镜像，大家可以访问 `GitHub` 上的项目地址，查阅其中的` Dockerfile` 内容：github.com/cogset

## 十二、使用 Docker Hub 中的镜像

### 12.1 选择镜像与程序版本

- 由于 `Docker` 的容器设计是程序即容器的，所以组成我们服务系统的多个程序一般会搭建在多个容器里，互相之间协作提供服务。例如一套最简单的  服务，我们可能会需要 `Java` 容器来运行基于 `Spring Boot `的程序，需要 `MySQL` 容器来提供数据库支持，需要 `Redis` 容器来作为高速 KV 存储等等。装有这些程序的镜像我们都可以很容易的在 `Docker Hub` 上找到并直接使用，但在我们使用前，光选择镜像还是不够的，我们还得根据需要选择对应程序版本的镜像。
- 虽然我们常把软件的版本放在 `Tag` 里作为镜像名的一部分，但对于一些复杂的应用，除了版本外，还存在很多的变量，镜像的维护者们也喜欢将这些变量一同组合到镜像的 `Tag` 里，所以我们在使用镜像前，一定要先了解不同 `Tag` 对应的不同内容。
- 这里我们来看个例子，下面是由 Docker 官方提供的 OpenJDK 镜像的说明页面...

![](https://user-gold-cdn.xitu.io/2018/10/3/166387eaadcb9fe1)

- 通常来说，镜像的维护者会在镜像介绍中展示出镜像所有的 Tag，如果没有，我们也能够从页面上的 `Tags` 导航里进入到镜像标签列表页面。
- 在 `OpenJDK` 镜像的 `Tag` 列表里，我们可以看到同样版本号的镜像就存在多种标签。在这些不同的标签上，除了定义 `OpenJDK` 的版本，还有操作系统，软件提供者等信息。
- 镜像维护者为我们提供这么多的标签进行选择，其实方便了我们在不同场景下选择不同环境实现细节时，都能直接用到这个镜像，而不需要再单独编写 `Dockerfile` 并构建。
- 但是换句话说，正是有这么多不同标签的镜像存在，所以我们在选择的时候，更要仔细认真，找到我们想要的那个镜像。...

### 12.2 Alpine 镜像

> 如果大家多接触几个镜像，就会发现带有 `Alpine` 的版本是许多镜像中都常见的标签。带有` Alpine` 标签的镜像到底是什么样的存在呢？它与相同软件不同标签的镜像又有什么样的区别呢？

- 镜像标签中的 `Alpine` 其实指的是这个镜像内的文件系统内容，是基于 `Alpine Linux` 这个操作系统的。`Alpine Linux `是一个相当精简的操作系统，而基于它的 `Docker `镜像可以仅有数 MB 的尺寸。如果软件基于这样的系统镜像之上构建而得，可以想象新的镜像也是十分小巧的。

- 在 `Docker` 里，`Alpine` 系统的镜像到底有多小，我们不妨来与其他系统镜像做一个比较...

|操作系统镜像|	占用空间|
|---|---|---|
|alpine:latest|	4.4 MB|
|ubuntu:latest|	84.1 MB|
|debian:latest|	101 MB|
|centos:latest|	200 MB|

> 可以看到，`Alpine` 系统镜像的尺寸要远小于其他常见的系统镜像。让我们再来比较同一个软件在基于普通系统的镜像和基于 Alpine 系统的镜像后尺寸上的区别

|镜像标签|	占用空间|
|---|---|
|python:3.6-alpine|	74.2 MB|
|python:3.6-jessie|	697 MB|

- 由于基于 `Alpine` 系统建立的软件镜像远远小于基于其他系统的软件镜像，它在网络传输上的优势尤为明显。如果我们选择这类的镜像，不但可以节约网络传输的时间，也能减少镜像对硬盘空间的占用。
- 当然，有优点也会有缺点，`Alpine` 镜像的缺点就在于它实在过于精简，以至于麻雀虽小，也无法做到五脏俱全了。在 Alpine 中缺少很多常见的工具和类库，以至于如果我们想基于软件 `Alpine` 标签的镜像进行二次构建，那搭建的过程会相当烦琐。所以如果你想要对软件镜像进行改造，并基于其构建新的镜像，那么 `Alpine` 镜像不是一个很好的选择 (这时候我们更提倡基于 `Ubuntu`、`Debian`、`CentOS` 这类相对完整的系统镜像来构建)。...

### 12.3 对容器进行配置

- 除了合理选择镜像外，许多镜像还为我们提供了更加方便的功能，这些细节我们通常都可以在镜像的详情里阅读到。
- 这里我们以 `MySQL `为例，看看通常我们是怎样阅读和使用镜像的特殊功能的。
- 自己安装过 `MySQL` 的朋友一定知道，搭建 `MySQL` 最麻烦的地方并不是安装的过程，而是安装后进行初始化配置的过程。就拿更改 root 账号的密码来说，在初始的 `MySQL` 里就要耗费不少工作量。
- 如果我们拿到一个 `MySQL` 镜像，运行起来的 MySQL 也就约等于一个刚刚安装好的程序，面临的正好是复杂的初始化过程。
- 好在 `MySQL` 镜像的维护者们为我们打造了一些自动化脚本，通过它们，我们只需要简单的传入几个参数，就能够快速实现对 `MySQL` 数据库的初始化。
- 在 MySQL 镜像的详情里，描述了我们要如何传入这些参数来启动 MySQL 容器。...


![](https://user-gold-cdn.xitu.io/2018/10/3/16639074fdc48422)

> 对于 `MySQL` 镜像来说，进行软件配置的方法是通过环境变量的方式来实现的 ( 在其他的镜像里，还有通过启动命令、挂载等方式来实现的 )。我们只需要通过这些给出的环境变量，就可以初始化 `MySQL` 的配置了。

例如，我们可以通过下面的命令来直接建立 `MySQL` 中的用户和数据库。...

```
$ sudo docker run --name mysql -e MYSQL_DATABASE=webapp -e MYSQL_USER=www -e MYSQL_PASSWORD=my-secret-pw -d mysql:5.7
```
通过这条命令启动的 `MySQL` 容器，在内部就已经完成了用户的创建和数据库的创建，我们通过 `MySQL` 客户端就能够直接登录这个用户和访问对应的数据库了。

如果深究 `MySQL` 是如何实现这样复杂的功能的，大家可以到 `MySQL `镜像的 `Dockerfile` 源码库里，找到 `docker-entrypoint.sh` 这个脚本，所有的秘密正暗藏在其中。`MySQL` 正是利用了 `ENTRYPOINT` 指令进行初始化这种任务安排，对容器中的 `MySQL` 进行初始化的。

通过 `MySQL `镜像这样的逻辑，大家还可以举一反三，了解其他镜像所特用的使用方法，甚至可以参考编写、构建一些能够提供这类方法的 `Dockerfile` 和镜像...

### 12.4 共享自己的镜像

如果我们希望将我们镜像公开给网络上的开发者们，那通过 `Docker Hub` 无疑是最佳的方式。

要在` Docker Hub` 上共享镜像，我们必须有一个` Docker Hub` 的账号，这自不必说了。在登录到我们账号的控制面板后，我们能够找到创建的按钮，在这里选择 Create Automated Build ( 创建自动构建 )。...


![](https://user-gold-cdn.xitu.io/2018/10/3/16638f7a60c3c8a9)

自动构建镜像是 `Docker Hub `为我们提供的一套镜像构建服务，我们只需要提供 `Dockerfile` 和相关的基本文件，`Docker Hub` 就能够在云端自动将它们构建成镜像，之后便可以让其他开发者通过 docker pull 命令拉取到这一镜像。

自动构建让不需要我们再用本机进行镜像的构建，既能节约时间，又能享受高速的云端机器构建。...

![](https://user-gold-cdn.xitu.io/2018/10/3/16638fbdcfee0b77)

在 `Docker Hub` 中并不直接存放我们用于构建的 `Dockerfile` 和相关文件，我们必须将 `Docker Hub` 账号授权到 `GitHub` 或是 `Bitbucket` 来从这些代码库中获取 `Dockerfile `和相关文件。

![](https://user-gold-cdn.xitu.io/2018/10/3/16638fbc9c1ac1c2)

在连接到 `GitHub` 或 `Bitbucket` 后，我们就可以选择我们存放 `Dockerfile` 和相关文件的代码仓库用来创建自动构建了。

![](https://user-gold-cdn.xitu.io/2018/10/3/16638fbbd4f6d20a)


在基本信息填写完成，点击创建按钮后，`Docker Hub` 就会开始根据我们 `Dockerfile` 的内容构建镜像了。而此时，我们也能够访问我们镜像专有的详情页面了。

![](https://user-gold-cdn.xitu.io/2018/10/3/16638fb9fa6cd7f7)

## 十三、组合操作：使用 Docker Compose 管理容器
 

### 13.1 解决容器管理问题

> 拿任何一个相对完整的应用系统来说，都不可能是由一个程序独立支撑的，而对于使用 Docker 来部署的分布式计算服务更是这样。随着时代的发展和技术演进，我们越来越推崇将大型服务拆分成较小的微服务，分别部署到独立的机器或容器中。也就是说，我们的应用系统往往由数十个甚至上百个应用程序或微服务组成。即使是一个小的微服务模块，通常都需要多个应用协作完成工作。

- 我们编写一个小型的微服务模块，虽然我们编写代码主要针对的是其中的应用部分，但如果我们要完整的进行开发、测试，与应用相关的周边软件必然是必不可少的。
- 虽然 Docker Engine 帮助我们完成了对应用运行环境的封装，我们可以不需要记录复杂的应用环境搭建过程，通过简单的配置便可以将应用运行起来了，但这只是针对单个容器或单个应用程序来说的。如果延伸到由多个应用组成的应用系统，那情况就稍显复杂了。
- 就拿最简单的例子来说吧，如果我们要为我们的应用容器准备一个 `MySQL` 容器和一个 `Redis `容器，那么在每次启动时，我们先要将 `MySQL` 容器和 `Redis` 容器启动起来，再将应用容器运行起来。这其中还不要忘了在创建应用容器时将容器网络连接到` MySQL` 容器和 `Redis` 容器上，以便应用连接上它们并进行数据交换。
- 这还不够，如果我们还对容器进行了各种配置，我们最好还得将容器创建和配置的命令保存下来，以便下次可以直接使用。

> 如果我们要想让这套体系像 `docker run` 和 `docker rm` 那样自如的进行无痕切换，那就更加麻烦了，我们可能需要编写一些脚本才能不至于被绕到命令的毛线球里。

说了这么多，其实核心还是缺少一个对容器组合进行管理的东西...

**Docker Compose**

- 针对这种情况，我们就不得不引出在我们开发中最常使用的多容器定义和运行软件，也就是 `Docker Compose `了。
- 如果说 `Dockerfile `是将容器内运行环境的搭建固化下来，那么 `Docker Compose` 我们就可以理解为将多个容器运行的方式和配置固化下来...

![](https://user-gold-cdn.xitu.io/2018/10/4/1663e6a38cd88368)

> 在 `Docker Compose` 里，我们通过一个配置文件，将所有与应用系统相关的软件及它们对应的容器进行配置，之后使用 `Docker Compose` 提供的命令进行启动，就能让 `Docker Compose` 将刚才我们所提到的那些复杂问题解决掉...

### 13.2 安装 Docker Compose

- 虽然 `Docker Compose` 目前也是由 `Docker `官方主要维护，但其却不属于 `Docker Engine` 的一部分，而是一个独立的软件。所以如果我们要在 Linux 中使用它，还必须要单独下载使用。
- `Docker Compose` 是一个由 `Python` 编写的软件，在拥有 `Python` 运行环境的机器上，我们可以直接运行它，不需要其它的操作。
- 我们可以通过下面的命令下载 `Docker Compose` 到应用执行目录，并附上运行权限，这样` Docker Compose `就可以在机器中使用了...

```
$ sudo curl -L "https://github.com/docker/compose/releases/download/1.22.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
$ sudo chmod +x /usr/local/bin/docker-compose
$
$ sudo docker-compose version
docker-compose version 1.21.2, build a133471
docker-py version: 3.3.0
CPython version: 3.6.5
OpenSSL version: OpenSSL 1.0.1t  3 May 2016...
```

我们也能够通过 `Python` 的包管理工具 `pip `来安装` Docker Compose`。

```
$ sudo pip install docker-compose
```

**在 Windows 和 macOS 中的 Docker Compose**

> 在我们更常用于开发的 Windows 和 macOS 中，使用 Docker Compose 会来得更加方便。不论你是使用 Docker for Win 还是 Docker for Mac，亦或是 Docker Toolbox 来搭建 Docker 运行环境，你都可以直接使用 docker-compose 这个命令。这三款软件都已经将 Docker Compose 内置在其中，供我们使用...

### 13.3 Docker Compose 的基本使用逻辑

> 如果将使用 `Docker Compose `的步骤简化来说，可以分成三步。

- 如果需要的话，编写容器所需镜像的 `Dockerfile`；( 也可以使用现有的镜像 )
- 编写用于配置容器的 `docker-compose.yml`；
- 使用 `docker-compose` 命令启动应用

**编写 Docker Compose 配置**

- 配置文件是 `Docker Compose` 的核心部分，我们正是通过它去定义组成应用服务容器群的各项配置，而编写配置文件，则是使用 `Docker Compose `过程中最核心的一个步骤。
- `Docker Compose `的配置文件是一个基于 `YAML `格式的文件。关于 `YAML` 的语法大家可以在网上找到，这里不再细说，总的来说，`YAML` 是一种清晰、简单的标记语言，你甚至都可以在看过几个例子后摸索出它的语法。
- 与` Dockerfile `采用 `Dockerfile` 这个名字作为镜像构建定义的默认文件名一样，`Docker Compose` 的配置文件也有一个缺省的文件名，也就是 docker-compose.yml`，如非必要，我建议大家直接使用这个文件名来做 `Docker Compose` 项目的定义。

> 这里我们来看一个简单的 `Docker Compose `配置文件内容...

```
version: '3'

services:

  webapp:
    build: ./image/webapp
    ports:
      - "5000:5000"
    volumes:
      - ./code:/code
      - logvolume:/var/log
    links:
      - mysql
      - redis

  redis:
    image: redis:3.2
  
  mysql:
    image: mysql:5.7
    environment:
      - MYSQL_ROOT_PASSWORD=my-secret-pw

volumes:
  logvolume: {}...
```


- `Docker Compose `配置文件里可以包含许多内容，从每个容器的各个细节控制，到网络、数据卷等的定义。
- 这里我们看几个主要的细节。首先是 `version` 这个配置，这代表我们定义的 `docker-compose.yml` 文件内容所采用的版本，目前 `Docker Compose` 的配置文件已经迭代至了第三版，其所支持的功能也越来越丰富，所以我们建议使用最新的版本来定义。
- 接下来我们来看 `services `这块，这是整个 `-compose.yml` 的核心部分，其定义了容器的各项细节。
- 在 `Docker Compose` 里不直接体现容器这个概念，这是把 `service` 作为配置的最小单元。虽然我们看上去每个 `service` 里的配置内容就像是在配置容器，但其实 `service` 代表的是一个应用集群的配置。每个 `service` 定义的内容，可以通过特定的配置进行水平扩充，将同样的容器复制数份形成一个容器集群。而 `Docker Compose` 能够对这个集群做到黑盒效果，让其他的应用和容器无法感知它们的具体结构。


**启动和停止**

- 对于开发来说，最常使用的 `Docker Compose` 命令就是 `docker-compose up` 和 `docker-compose down` 了。
- `docker-compose up` 命令类似于` Docker Engine` 中的 `docker run`，它会根据 `docker-compose.yml` 中配置的内容，创建所有的容器、网络、数据卷等等内容，并将它们启动。与 `docker run `一样，默认情况下 `docker-compose up` 会在“前台”运行，我们可以用 `-d` 选项使其“后台”运行。事实上，我们大多数情况都会加上` -d `选项...

```
$ sudo docker-compose up -d
```

> 需要注意的是，`docker-compose `命令默认会识别当前控制台所在目录内的 `docker-compose.yml` 文件，而会以这个目录的名字作为组装的应用项目的名称。如果我们需要改变它们，可以通过选项 -f 来修改识别的 `Docker Compose` 配置文件，通过 -p 选项来定义项目名。...


```
$ sudo docker-compose -f ./compose/docker-compose.yml -p myapp up -d
```

> 与 `docker-compose up` 相反，`docker-compose down` 命令用于停止所有的容器，并将它们删除，同时消除网络等配置内容，也就是几乎将这个 `Docker Compose` 项目的所有影响从` Docker `中清除

```
$ sudo docker-compose down
```

- 如果条件允许，我更建议大家像容器使用一样对待 `Docker Compose` 项目，做到随用随启，随停随删。也就是使用的时候通过` docker-compose up` 进行，而短时间内不再需要时，通过 `docker-compose down` 清理它。
- 借助 `Docker `容器的秒级启动和停止特性，我们在使用 `docker-compose up` 和` docker-compose down` 时可以非常快的完成操作。这就意味着，我们可以在不到半分钟的时间内停止一套环境，切换到另外一套环境，这对于经常进行多个项目开发的朋友来说，绝对是福音。
- 通过 `Docker` 让我们能够在开发过程中搭建一套不受干扰的独立环境，让开发过程能够基于稳定的环境下进行。而 `Docker Compose` 则让我们更近一步，同时让我们处理好多套开发环境，并进行快速切换。...


**容器命令**

- 除了启动和停止命令外，`Docker Compose` 还为我们提供了很多直接操作服务的命令。之前我们说了，服务可以看成是一组相同容器的集合，所以操作服务就有点像操作容器一样。
- 这些命令看上去都和 `Docker Engine` 中对单个容器进行操作的命令类似，我们来看几个常见的。
- 在` Docker Engine` 中，如果我们想要查看容器中主进程的输出内容，可以使用 `docker logs` 命令。而由于在 `Docker Compose`下运行的服务，其命名都是由 `Docker Compose` 自动完成的，如果我们直接使用 `docker logs` 就需要先找到容器的名字，这显然有些麻烦了。我们可以直接使用 `docker-compose logs` 命令来完成这项工作...

```
$ sudo docker-compose logs nginx
```

- 在 `docker-compose logs `衔接的是 `Docker Compose` 中所定义的服务的名称。
- 同理，在 `Docker Compose` 还有几个类似的命令可以单独控制某个或某些服务。
- 通过 `docker-compose create`，`docker-compose start` 和 `docker-compose stop` 我们可以实现与 `docker create`，`docker start `和 `docker stop` 相似的效果，只不过操作的对象由 Docker Engine 中的容器变为了 `Docker Compose` 中的服务。...

```
$ sudo docker-compose create webapp
$ sudo docker-compose start webapp
$ sudo docker-compose stop webapp
```


## 十四、组合操作：常用的 Docker Compose 配置项

### 14.1 定义服务

> 为了理解在开发中常用的 `Docker Compose` 配置，我们通过一个在开发中使用的 `Docker Compose` 文件来进行下面的讲解

```
version: "3"

services:

  redis:
    image: redis:3.2
    networks:
      - backend
    volumes:
      - ./redis/redis.conf:/etc/redis.conf:ro
    ports:
      - "6379:6379"
    command: ["redis-server", "/etc/redis.conf"]

  database:
    image: mysql:5.7
    networks:
      - backend
    volumes:
      - ./mysql/my.cnf:/etc/mysql/my.cnf:ro
      - mysql-data:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=my-secret-pw
    ports:
      - "3306:3306"

  webapp:
    build: ./webapp
    networks:
      - frontend
      - backend
    volumes:
      - ./webapp:/webapp
    depends_on:
      - redis
      - database

  nginx:
    image: nginx:1.12
    networks:
      - frontend
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./webapp/html:/webapp/html
    depends_on:
      - webapp
    ports:
      - "80:80"
      - "443:443"

networks:
  frontend:
  backend:

volumes:
  mysql-data:...
```

- 在这个 `Docker Compose` 的示例中，我们看到占有大量篇幅的就是 `services` 部分，也就是服务定义的部分了。在上一节里，我们已经说到了，`Docker Compose` 中的服务，是对一组相同容器集群统一配置的定义，所以可见，在 `Docker Compose` 里，主要的内容也是对容器配置的定义。
- 在 `Docker Compose` 的配置文件里，对服务的定义与我们之前谈到的创建和启动容器中的选项非常相似，或者说 `Docker Compose` 就是从配置文件中读取出这些内容，代我们创建和管理这些容器的。
- 在使用时，我们首先要为每个服务定义一个名称，用以区别不同的服务。在这个例子里，`redi`s`、`database`、`webapp`、`nginx `就是服务的名称...

**指定镜像**

- 容器最基础的就是镜像了，所以每个服务必须指定镜像。在 `Docker Compose` 里，我们可以通过两种方式为服务指定所采用的镜像。一种是通过 `image` 这个配置，这个相对简单，给出能在镜像仓库中找到镜像的名称即可。
- 另外一种指定镜像的方式就是直接采用 `Dockerfile` 来构建镜像，通过` build` 这个配置我们能够定义构建的环境目录，这与 `docker build` 中的环境目录是同一个含义。如果我们通过这种方式指定镜像，那么 `Docker Compose` 先会帮助我们执行镜像的构建，之后再通过这个镜像启动容器。

> 当然，在 `docker build `里我们还能通过选项定义许多内容，这些在 `Docker Compose` 里我们依然可以...

```
## ......
  webapp:
    build:
      context: ./webapp
      dockerfile: webapp-dockerfile
      args:
        - JAVA_VERSION=1.6
## .........
```

- 在配置文件里，我们还能用` Map` 的形式来定义 `build`，在这种格式下，我们能够指定更多的镜像构建参数，例如 `Dockerfile` 的文件名，构建参数等等。
- 当然，对于一些可以不通过重新构建镜像的方式便能修改的内容，我们还是不建议重新构建镜像，而是使用原有的镜像做简单的修改。
- 例如上面的配置里，我们希望修改 `Redis` 的启动命令，加入配置文件以便对` Redis` 服务进行配置，那么我们可以直接通过` command` 配置来修改。而在 `MySQL` 的定义，我们通过 `environment` 配置为 `MySQL `设置了初始密码。

> 这些对镜像的使用方法我们在之前都已经谈到过了，只不过我们之前用的是 `Docker Engine` 的命令以及其选项来控制的，而在 `Docker Compose` 里，我们直接通过配置文件来定义它们。

由于 `Docker Compose` 的配置已经固化下来，所以我们不需要担心忘记之前执行了哪些命令来启动容器，当每次需要开启或关闭环境时，只需要 `docker-compose up -d `和 `docker-compose down` 命令，就能轻松完成操作...

**依赖声明**

- 虽然我们在 `Docker Compose` 的配置文件里定义服务，在书写上有由上至下的先后关系，但实际在容器启动中，由于各种因素的存在，其顺序还是无法保障的。
- 所以，如果我们的服务间有非常强的依赖关系，我们就必须告知 `Docker Compose` 容器的先后启动顺序。只有当被依赖的容器完全启动后，`Docker Compose` 才会创建和启动这个容器。
- 定义依赖的方式很简单，在上面的例子里我们已经看到了，也就是 `depends_on` 这个配置项，我们只需要通过它列出这个服务所有依赖的其他服务即可。在` Docker Compose` 为我们启动项目的时候，会检查所有依赖，形成正确的启动顺序并按这个顺序来依次启动容器。...

### 14.2 文件挂载

- 在 `Docker Compose` 里定义文件挂载的方式与 `Docker Engine` 里也并没有太多的区别，使用 `volumes` 配置可以像 `docker CLI` 里的 `-v` 选项一样来指定外部挂载和数据卷挂载。
- 在上面的例子里，我们看到了定义几种常用挂载的方式。我们能够直接挂载宿主机文件系统中的目录，也可以通过数据卷的形式挂载内容。
- 在使用外部文件挂载的时候，我们可以直接指定相对目录进行挂载，这里的相对目录是指相对于 `docker-compose.yml` 文件的目录。
- 由于有相对目录这样的机制，我们可以将` docker-compose.yml` 和所有相关的挂载文件放置到同一个文件夹下，形成一个完整的项目文件夹。这样既可以很好的整理项目文件，也利于完整的进行项目迁移。
- 虽然 `Docker` 提倡将代码或编译好的程序通过构建镜像的方式打包到镜像里，随整个` CI` 流部署到服务器中，但对于开发者来说，每次修改程序进行简单测试都要重新构建镜像简直是浪费生命的操作。所以在开发时，我们推荐直接将代码挂载到容器里，而不是通过镜像构建的方式打包成镜像。
- 同时，在开发过程中，对于程序的配置等内容，我们也建议直接使用文件挂载的形式挂载到容器里，避免经常修改所带来的麻烦...

**使用数据卷**

- 如果我们要在项目中使用数据卷来存放特殊的数据，我们也可以让 D`ocker Compose `自动完成对数据卷的创建，而不需要我们单独进行操作。
- 在上面的例子里，独立于 `services` 的 ` 配置就是用来声明数据卷的。定义数据卷最简单的方式仅需要提供数据卷的名称，对于我们在 `Docker Engine `中创建数据卷时能够使用的其他定义，也能够放入 `Docker Compose `的数据卷定义中。
- 如果我们想把属于 `Docker Compose` 项目以外的数据卷引入进来直接使用，我们可以将数据卷定义为外部引入，通过 `external` 这个配置就能完成这个定义...

```
## ......
volumes:
  mysql-data:
    external: true
## ......
```

在加入 `external` 定义后，`Docker Compose` 在创建项目时不会直接创建数据卷，而是优先从 `Docker Engine` 中已有的数据卷里寻找并直接采用


### 14.3 配置网络

- 网络也是容器间互相访问的桥梁，所以网络的配置对于多个容器组成的应用系统来说也是非常重要的。在 `Docker Compose` 里，我们可以为整个应用系统设置一个或多个网络。
- 要使用网络，我们必须先声明网络。声明网络的配置同样独立于 `services` 存在，是位于根配置下的 `networks` 配置。在上面的例子里，我们已经看到了声明 `frontend `和 b`ackend `这两个网络最简单的方式。
- 除了简单的声明网络名称，让 `Docker Compose` 自动按默认形式完成网络配置外，我们还可以显式的指定网络的参数。...

```
networks:
  frontend:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 10.10.1.0/24
## .........
```

在这里，我们为网络定义了网络驱动的类型，并指定了子网的网段。

**使用网络别名**

直接使用容器名或服务名来作为连接其他服务的网络地址，因为缺乏灵活性，常常还不能满足我们的需要。这时候我们可以为服务单独设置网络别名，在其他容器里，我们将这个别名作为网络地址进行访问。

网络别名的定义方式很简单，这里需要将之前简单的网络 List 定义结构修改成 Map 结构，以便在网络中加入更多的定义...

```
## ......
  database:
    networks:
      backend:
        aliases:
          - backend.database
## ......
  webapp:
    networks:
      backend:
        aliases:
          - backend.webapp
      frontend:
        aliases:
          - frontend.webapp
## .........
```

> 在我们进行这样的配置后，我们便可以使用这里我们所设置的网络别名对其他容器进行访问了。

**端口映射**

- 在 `Docker Compose` 的每个服务配置里，我们还看到了 `ports` 这个配置项，它是用来定义端口映射的。
- 我们可以利用它进行宿主机与容器端口的映射，这个配置与` docker CLI` 中` -p` 选项的使用方法是近似的。
- 需要注意的是，由于` YAML `格式对` xx:yy` 这种格式的解析有特殊性，在设置小于 `60` 的值时，会被当成时间而不是字符串来处理，所以我们最好使用引号将端口映射的定义包裹起来，避免歧义。...


## 十五、组合操作：编写 Docker Compose 项目


### 15.1 设计项目的目录结构

> 在这一小节里，我们以一个由 `MySQL`、`Redis`、`PHP-FPM` 和 `Nginx` 组成的小型 PHP 网站为例，介绍通过 Docker 搭建运行这套程序运行环境的方法。

- 既然我们说到这个小型网站是由 MySQL、Redis、PHP-FPM 和 Nginx 四款软件所组成的，那么自然在 Docker 里，我们要准备四个容器分别来运行它们。而为了更好地管理这四个容器所组成的环境，我们这里还会使用到` Docker Compose`。
- 与搭建一个软件开发项目类似，我们提倡将 `Docker Compose` 项目的组成内容聚集到一个文件目录中，这样更利于我们进行管理和迁移。
- 这里我已经建立好了一个目录结构，虽然我们在实践的过程中不一定要按照这样的结构，但我相信这个结构一定对你有所启发...

![](https://user-gold-cdn.xitu.io/2018/10/22/1669c139cbb5b1d8)

> 简单说明一下这个结构中主要目录和文件的功能和作用。在这个结构里，我们可以将根目录下的几个目录分为四类

- 第一类是 Docker 定义目录，也就是 compose 这个目录。在这个目录里，包含了 docker-compose.yml 这个用于定义 Docker Compose 项目的配置文件。此外，还包含了我们用于构建自定义镜像的内容。
- 第二类是程序文件目录，在这个项目里是 mysql、nginx、phpfpm、redis 这四个目录。这些目录分别对应着 Docker Compose 中定义的服务，在其中主要存放对应程序的配置，产生的数据或日志等内容。
- 第三类是代码目录，在这个项目中就是存放 Web 程序的 website 目录。我们将代码统一放在这个目录中，方便在容器中挂载。
- 第四类是工具命令目录，这里指 bin 这个目录。我们在这里存放一些自己编写的命令脚本，我们通过这些脚本可以更简洁地操作整个项目。...

### 15.2 编写 Docker Compose 配置文件

> 接下来我们就要编写 `docker-compose.yml `文件来定义组成这个环境的所有 Docker 容器以及与它们相关的内容了。`docker-compose.yml` 规则和编写的方法在前两小节中已经谈到，这里我们就不再展开，直接来看看编写好的 docker-compose.yml 配置文件。...

```
version: "3"

networks:
  frontend:
  backend:

services:

  redis:
    image: redis:3.2
    networks:
      - backend
    volumes:
      - ../redis/redis.conf:/etc/redis/redis.conf:ro
      - ../redis/data:/data
    command: ["redis-server", "/etc/redis/redis.conf"]
    ports:
      - "6379:6379"

  mysql:
    image: mysql:5.7
    networks:
      - backend
    volumes:
      - ../mysql/my.cnf:/etc/mysql/my.cnf:ro
      - ../mysql/data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: my-secret-pw
    ports:
      - "3306:3306"

  phpfpm:
    build: ./phpfpm
    networks:
      - frontend
      - backend
    volumes:
      - ../phpfpm/php.ini:/usr/local/etc/php/php.ini:ro
      - ../phpfpm/php-fpm.conf:/usr/local/etc/php-fpm.conf:ro
      - ../phpfpm/php-fpm.d:/usr/local/etc/php-fpm.d:ro
      - ../phpfpm/crontab:/etc/crontab:ro
      - ../website:/website
    depends_on:
      - redis
      - mysql
  
  nginx:
    image: nginx:1.12
    networks:
      - frontend
    volumes:
      - ../nginx/nginx.c...
```

> 使用合适的镜像是提高工作效率的途径之一，这里讲解一下我们在这个项目中选择镜像的原由。

- 在这个项目里，我们直接采用了 MySQL、Redis 和 Nginx 三个官方镜像，而对于 PHP-FPM 的镜像，我们需要增加一些功能，所以我们通过 Dockerfile 构建的方式来生成。
- 对于 MySQL 来说，我们需要为它们设置密码，所以原则上我们是需要对它们进行改造并生成新的镜像来使用的。而由于 MySQL 镜像可以通过我们之前在镜像使用方法一节所提到的环境变量配置的方式，来直接指定 MySQL 的密码及其他一些关键性内容，所以我们就无须单独构建镜像，可以直接采用官方镜像并配合使用环境变量来达到目的。
- 对于 Redis 来说，出于安全考虑，我们一样需要设置密码。Redis 设置密码的方法是通过配置文件来完成的，所以我们需要修改 Redis 的配置文件并挂载到 Redis 容器中。这个过程也相对简单，不过需要注意的是，在官方提供的 Redis 镜像里，默认的启动命令是 redis-server，其并没有指定加载配置文件。所以在我们定义 Redis 容器时，要使用 command 配置修改容器的启动命令，使其读取我们挂载到容器的配置文件...


**自定义镜像**

- 相比较于 MySQL、Redis 这样可以通过简单配置即可直接使用的镜像不同，PHP 的镜像中缺乏了一些我们程序中必要的元素，而这些部分我们推荐使用自定义镜像的方式将它们加入其中。
- 在这个例子里，因为需要让 PHP 连接到 MySQL 数据库中，所以我们要为镜像中的 PHP 程序安装和开启 pdo_mysql 这个扩展。
- 了解如何安装扩展，这就要考验我们之前在 Docker Hub 镜像使用一节中学到的知识了。我们通过阅读 PHP 镜像的介绍页面，可以找到 PHP 镜像中已经为我们准备好了扩展的安装和启用命令，这让我们可以很轻松地在镜像中加入扩展。...

![](https://user-gold-cdn.xitu.io/2018/10/23/166a08aa844baae9)

> 在准备好这些使用方法之后，我们就可以开始编写构建 PHP 镜像的 `Dockerfile` 文件了。这里我已经编写好了一份，供大家参考

```
FROM php:7.2-fpm

MAINTAINER You Ming <youming@funcuter.org>

RUN apt-get update \
 && apt-get install -y --no-install-recommends cron

RUN docker-php-ext-install pdo_mysql

COPY docker-entrypoint.sh /usr/local/bin/

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]

CMD ["php-fpm"]...
```

- 由于 Docker 官方所提供的镜像比较精简，所以在这个 Dockerfile 里，我们还执行了 cron 的安装命令，来确保我们可以使用定时任务。
- 大家注意到，这里除了我们进行功能安装外，还将一个脚本拷入了镜像中，并将其作为 ENTRYPOINT 启动入口。这个文件的作用主要是为了启动 cron 服务，以便我们在容器中可以正常使用它。...

```
#!/bin/bash

service cron start

exec "$@"
```

> 在 `docker-entrypoint.sh` 里，除了启动 `cron` 服务的命令外，我们在脚本的最后看到的是 `exec "$@"` 这行命令。`$@ `是 `shell` 脚本获取参数的符号，这里获得的是所有传入脚本的参数，而 `exec` 是执行命令，直接执行这些参数。

- 如果直接看这条命令大家会有些疑惑，参数怎么拿来执行，这不是有问题么？
- 请大家回顾一下，我们之前提到的，如果在镜像里同时定义了 `ENTRYPOINT `和 `CMD `两个指令，`CMD` 指令的内容会以参数的形式传递给 `ENTRYPOINT` 指令。所以，这里脚本最终执行的，是 `CMD `中所定义的命令。...

**目录挂载**

> 在这个例子里，我们会把项目中的一些目录或文件挂载到容器里，这样的挂载主要有三种目的

- 将程序的配置通过挂载的方式覆盖容器中对应的文件，这让我们可以直接在容器外修改程序的配置，并通过直接重启容器就能应用这些配置；
- 把目录挂载到容器中应用数据的输出目录，就可以让容器中的程序直接将数据输出到容器外，对于 `MySQL`、`Redi`s 中的数据，程序的日志等内容，我们可以使用这种方法来持久保存它们；
- 把代码或者编译后的程序挂载到容器中，让它们在容器中可以直接运行，这就避免了我们在开发中反复构建镜像带来的麻烦，节省出大量宝贵的开发时间...

> 上述的几种方法，对于线上部署来说都是不适用的，但在我们的开发过程中，却可以为我们免去大量不必要的工作，因此建议在开发中使用这些挂载结构

### 15.3 编写辅助脚本

> 我们知道，虽然 `Docker Compose` 简化了许多操作流程，但我们还是需要使用 `docker-compose` 命令来管理项目。对于这个例子来说，我们要启动它就必须使用这样的 `docker-compose` 命令来管理项目。对于这个例子来说，我们要启动它就必须使用这样的：...

```
$ sudo docker-compose -p website up -d
```

- 而执行的目录必须是 `docker-compose.yml` 文件所在的目录，这样才能正确地读取 `Docker Compose `项目的配置内容。
- 我编写了一个 `compose` 脚本，用来简化 `docker-compose` 的操作命令

```
#!/bin/bash

root=$(cd `dirname $0`; dirname `pwd`)

docker-compose -p website -f ${root}/compose/docker-compose.yml "$@"...
```

> 在这个脚本里，我把一些共性的东西包含进去，这样我们就不必每次传入这些参数或选项了。同时，这个脚本还能自适应调用的目录，准确找到 `docker-compose.yml` 文件，更方便我们直接调用。

- 通过这个脚本来操作项目，我们的命令就可以简化为：...

```
$ sudo ./bin/compose up -d

$ sudo ./bin/compose logs nginx

$ sudo ./bin/compose down
```

当然，我们还可以编写像代码部署、服务重启等脚本，来提高我们的开发效率。



## 十六、组合操作：应用于服务化开发

### 16.1 服务开发环境

> 在开始之前，我们依然来设定一个场景。在这里，假定我们处于一个` Dubbo` 治下的微服务系统，而工作是开发系统中某一项微服务。

- 微服务开发与上一节里我们提到的小型项目开发在环境搭建上有一定的区别，我们要合理地调整 `Docker` 的使用方法和策略，就必须先了解这些区别。
- 在微服务开发中，我们所开发的功能都不是完整的系统，很多功能需要与其他服务之间配合才能正常运转，而我们开发所使用的机器时常无法满足我们在一台机器上将这些相关服务同时运行起来。
- 我们仅仅是开发某一部分服务的内容，既对其他服务的运转机制不太了解，又完全没有必要在自己的机器上运行其他的服务。所以我们最佳的实践自然就是让参与系统中服务开发的同事，各自维护自己开发服务的环境，而直接提供给我们对应的连接地址使用服务即可。
- 更确切地说，我们在开发中，只需要在本地搭建起自己所开发服务的运行环境，再与其他开发者搭建的环境互联即可...

### 16.2 搭建本地环境

> 在我们的开发机器上，我们只需要运行我们正在开发的服务，这个过程依然可以使用 `Docker Compose` 来完成。这里我给出了一个简单的例子，表示一个简单的小服务运行环境

```
version: "3"

networks:
  backend:
  mesh:

services:

  mysql:
    image: mysql:5.7
    networks:
      - backend
    volumes:
      - ../mysql/my.cnf:/etc/mysql/my.cnf:ro
      - ../mysql/data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: my-secret-pw
    ports:
      - "3306:3306"

  app:
    build: ./spring
    networks:
      - mesh
      - backend
    volumes:
      - ../app:/app
    depends_on:
      - mysql...
```

### 16.3 跨主机网络

- 搭建好本地的环境，我们就需要考虑如何与朋友们所搭建的环境进行互联了。
- 这时候大家也许会想到，可以将服务涉及的相关端口通过映射的方式暴露到我们机器的端口上，接着我们只需要通过各服务机器的 IP 与对应的端口就可以连接了。
- 然而这种方法还不算特别方便，一来除了处理映射外，我们还需要配置防火墙等才能使其他的机器正确访问到容器，二来是这种方式我们依然要记录各个服务的网络地址等配置，而开发中切换它们是个烦琐的过程。
- 在介绍` Docker Compose` 的小节里，我们知道了可以通过设置网络别名 ( `alias` ) 的方式来更轻松地连接其他容器，如果我们在服务化开发里也能这么做就能减少很多烦琐操作了。
- 要实现设置网络别名的目的，自然要先确保所有涉及的容器位于同一个网络中，这时候就需要引出我们之前在网络小节里说到的 `Overlay `网络了...

![](https://user-gold-cdn.xitu.io/2018/10/28/166b9a1165699266)

> `Overlay Network` 能够跨越物理主机的限制，让多个处于不同 `Docker daemon` 实例中的容器连接到同一个网络，并且让这些容器感觉这个网络与其他类型的网络没有区别。



**Docker Swarm**

> 要搭建 `Overlay Network` 网络，我们就要用到 `Docker Swarm` 这个工具了。`Docker Swarm `是 `Docker `内置的集群工具，它能够帮助我们更轻松地将服务部署到 `Docker daemon` 的集群之中。

![](https://user-gold-cdn.xitu.io/2018/10/28/166b9cfc98bedd76)

- 在真实的服务部署里，我们通常是使用 `Docker Compose` 来定义集群，而通过 `Docker Swarm` 来部署集群。
- `Docker Swarm `最初是独立的项目，不过目前已经集成到了` Docker` 之中，我们通过 `docker CLI `的命令就能够直接操控它。
- 对于 `Docker Swarm `来说，每一个 `Docker daemon` 的实例都可以成为集群中的一个节点，而在 `Docker daemon` 加入到集群成为其中的一员后，集群的管理节点就能对它进行控制。我们要搭建的 `Overlay` 网络正是基于这样的集群实现的。
- 既然要将 `Docker `加入到集群，我们就必须先有一个集群，我们在任意一个 `Docker `实例上都可以通过 `docker swarm init` 来初始化集群...

```
$ sudo docker swarm init

Swarm initialized: current node (t4ydh2o5mwp5io2netepcauyl) is now a manager.

To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-4dvxvx4n7magy5zh0g0de0xoues9azekw308jlv6hlvqwpriwy-cb43z26n5jbadk024tx0cqz5r 192.168.1.5:2377...
```

- 在集群初始化后，这个 `Docker` 实例就自动成为了集群的管理节点，而其他 `Docker` 实例可以通过运行这里所打印的 `docker swarm join` 命令来加入集群。
- 加入到集群的节点默认为普通节点，如果要以管理节点的身份加入到集群中，我们可以通过 `ocker swarm join-token` 命令来获得管理节点的加入命令。...

```
$ sudo docker swarm join-token manager
To add a manager to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-60am9y6axwot0angn1e5inxrpzrj5d6aa91gx72f8et94wztm1-7lz0dth35wywekjd1qn30jtes 192.168.1.5:2377...
```

我们通过这些命令来建立用于我们服务开发的 `Docker` 集群，并将相关开发同事的 `Docker` 加入到这个集群里，就完成了搭建跨主机网络的第一步

**建立跨主机网络**

接下来，我们就通过 `docker network create` 命令来建立 `Overlay` 网络。

```
$ sudo docker network create --driver overlay --attachable mesh
```

在创建 `Overlay` 网络时，我们要加入` --attachable` 选项以便不同机器上的 `Docker` 容器能够正常使用到它。

在创建了这个网络之后，我们可以在任何一个加入到集群的` Docker `实例上使用 `docker network ls` 查看一下其下的网络列表。我们会发现这个网络定义已经同步到了所有集群中的节点上...

```
$ sudo docker network ls
NETWORK ID          NAME                DRIVER              SCOPE
## ......
y89bt74ld9l8        mesh                overlay             swarm
## .........
```

接下来我们要修改 `Docker Compose` 的定义，让它使用这个我们已经定义好的网络，而不是再重新创建网络。

我们只需要在` Docker Compose` 配置文件的网络定义部分，将网络的 `external` 属性设置为 `true`，就可以让` Docker Compose` 将其建立的容器都连接到这个不属于 `Docker Compose` 的项目上了。

```
networks:
  mesh:
    external: true
```

> 通过这个实现，我们在开发中就使整个服务都处于一个可以使用别名映射网络中，避免了要对不同功能联调时切换服务 IP 的烦琐流程。在这种结构下，我们只需要让我们开发的 `Docker` 退出和加入不同的集群，就能马上做到切换不同联调项目。...

