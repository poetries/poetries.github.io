---
title: 持续集成 Travis CI
date: 2018-02-23 12:12:08
tags: 
   - Travis CI
   - CI
categories: CI
---

> 来源于互联网

#### 一、什么是持续集成？

- `Travis CI` 提供的是持续集成服务（`Continuous Integration`，简称 `CI`）。它绑定 `Github` 上面的项目，只要有新的代码，就会自动抓取。然后，提供一个运行环境，执行测试，完成构建，还能部署到服务器。
- 持续集成指的是只要代码有变更，就自动运行构建和测试，反馈运行结果。确保符合预期以后，再将新代码"集成"到主干。
- 持续集成的好处在于，每次代码的小幅变更，就能看到运行结果，从而不断累积小的变更，而不是在开发周期结束时，一下子合并一大块代码

#### 二、.travis.yml

> Travis 要求项目的根目录下面，必须有一个`.travis.yml`文件。这是配置文件，指定了 `Travis` 的行为。该文件必须保存在 `Github` 仓库里面，一旦代码仓库有新的 `Commit`，`Travis `就会去找这个文件，执行里面的命令

- 这个文件采用 `YAML` 格式。下面是一个最简单的 `Python` 项目的`.travis.yml`文件

```bash
language: python
script: true
```

- `language`字段指定了默认运行环境，这里设定使用 `Python` 环境
- `script`字段指定要运行的脚本，`script: true`表示不执行任何脚本，状态直接设为成功

**面是一个稍微复杂一点的.travis.yml**

```bash
language: python
sudo: required
before_install: sudo pip install foo
script: py.test
```

#### 三、运行流程

- `Travis` 的运行流程很简单，任何项目都会经过两个阶段
  - `install`  阶段：安装依赖
  - `script` 阶段：运行脚本

##### 3.1 install 阶段

> `install`字段用来指定安装脚本

```
install: ./install-dependencies.sh
```

- 如果有多个脚本，可以写成下面的形式

```bash
install:
 - command1
 - command2
```

- 上面代码中，如果`command1`失败了，整个构建就会停下来，不再往下进行。
- 如果不需要安装，即跳过安装阶段，就直接设为`true`。

```
install: true
```

##### 3.2、script 字段

- `script`字段用来指定构建或测试脚本

`script: bundle exec thor build`

- 如果有多个脚本，可以写成下面的形式

```bash
script:
 - command1
 - command2
```

> **注意**，`script`与`install`不一样，如果`command1`失败，`command2`会继续执行。但是，整个构建阶段的状态是失败。如果`command2`只有在`command1`成功后才能执行，就要写成下面这样。

```
script: command1 && command2
```

##### 3.3 实例：Node 项目

- `Node` 项目的环境需要写成下面这样

```bash
language: node_js
node_js:
  - "8"
```

- 上面代码中，`node_js`字段用来指定 `Node` 版本。
- `Node` 项目的`install`和`script`阶段都有默认脚本，可以省略
   - `install`默认值：`npm install`
   - `script`默认值：`npm test`

##### 3.4 部署

- `script`阶段结束以后，还可以设置[通知步骤（notification）](https://docs.travis-ci.com/user/notifications/)和[部署步骤](https://docs.travis-ci.com/user/deployment/)（deployment），它们不是必须的

> 部署的脚本可以在`script`阶段执行，也可以使用 `Travis` 为几十种常见服务提供的快捷部署功能。比如，要部署到 `Github Pages`，可以写成下面这样

```bash
deploy:
  provider: pages
  skip_cleanup: true
  github_token: $GITHUB_TOKEN # Set in travis-ci.org dashboard
  on:
    branch: master
```

- [其他部署方式](https://docs.travis-ci.com/user/deployment/)

##### 3.5 钩子方法

> `Travis` 为上面这些阶段提供了7个钩子


- `before_install`：install 阶段之前执行
- `before_script`：script 阶段之前执行
- `after_failure`：script 阶段失败时执行
- `after_success`：script 阶段成功时执行
- `before_deploy`：deploy 步骤之前执行
- `after_deploy`：deploy 步骤之后执行
- `after_script`：script 阶段之后执行

> 完整的生命周期，从开始到结束是下面的流程

- `before_install`
- `install`
- `before_script`
- `script`
- `aftersuccess or afterfailure`
- `[OPTIONAL] before_deploy`
- `[OPTIONAL] deploy`
- `[OPTIONAL] after_deploy`
- `after_script`

- 下面是一个before_install钩子的例子

```bash
before_install:
  - sudo apt-get -qq update
  - sudo apt-get install -y libxml2-dev
```

> 上面代码表示`before_install`阶段要做两件事，第一件事是要更新依赖，第二件事是安装`libxml2-dev`。用到的几个参数的含义如下：-qq表示减少中间步骤的输出，-y表示如果需要用户输入，总是输入yes


##### 3.6 运行状态

- 最后，`Travis` 每次运行，可能会返回四种状态
  - `passed`：运行成功，所有步骤的退出码都是0
  - `canceled`：用户取消执行
  - `errored`：`before_install`、`install`、`before_script`有非零退出码，运行会立即停止
  - `failed` ：`script`有非零状态码 ，会继续运行

#### 四、使用技巧

##### 4.1 环境变量

- `.travis.yml`的env字段可以定义环境变量,然后，脚本内部就使用这些变量了

```bash
env:
  - DB=postgres
  - SH=bash
  - PACKAGE_VERSION="1.0.*"
```

> 有些环境变量（比如用户名和密码）不能公开，这时可以通过 Travis 网站，写在每个仓库的设置页里面，Travis 会自动把它们加入环境变量。这样一来，脚本内部依然可以使用这些环境变量，但是只有管理员才能看到变量的值,[具体操作文档](https://docs.travis-ci.com/user/environment-variables)

![](http://www.ruanyifeng.com/blogimg/asset/2017/bg2017121903.png)

##### 4.2 加密信息

- 如果不放心保密信息明文存在 `Travis` 的网站，可以使用 `Travis` 提供的加密功能



