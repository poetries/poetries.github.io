---
title: 云开发cloudbase从入门到实践
date: 2022-06-25 14:40:12
tags: 
  - 部署
  - 云开发
categories: Front-End
---


## 一、关于云开发介绍

**云开发与serverless的区别**

- `Serverless Framework` 是无服务器应用框架，提供将云函数` SCF`、`API` 网关、对象存储 `COS`、云数据库 `DB` 等资源组合的业务框架，开发者可以直接基于框架编写业务逻辑，而无需关注底层资源的配置和管理。
- 云开发（`Tencent CloudBase，TCB`）是腾讯云提供的云原生一体化开发环境和工具平台，为开发者提供高可用、自动弹性扩缩的后端云服务，包含计算、存储、托管等 `serverless` 化能力，可用于云端一体化开发多种端应用（小程序、公众号、`Web` 应用、`Flutter` 客户端等），帮助开发者统一构建和管理后端服务和云资源，避免了应用开发过程中繁琐的服务器搭建及运维，开发者可以专注于业务逻辑的实现，开发门槛更低，效率更高。
- **二者最大的区别是**：给开发者使用的平台支持不一样，云开发支持web端、QQ、微信小程序级静态网站托管等这些平台服务。


## 二、使用云开发创建一个nestjs项目

在产品中选择云开发产品

![](https://s.poetries.work/uploads/2022/06/97bfb6a300ede8cb.png)

> 创建一个项目, 这里要选择好区域，下次创建了项目，区域不一样，可能项目就看不到

![](https://s.poetries.work/uploads/2022/06/4a9fa09df00ae121.png)
![](https://s.poetries.work/uploads/2022/06/f91fc2a56fd7d19f.png)
![](https://s.poetries.work/uploads/2022/06/111082e4a79965b8.png)
![](https://s.poetries.work/uploads/2022/06/3cae71f70a9723d2.png)
![](https://s.poetries.work/uploads/2022/06/4cccec9f4013b9aa.png)



## 三、使用脚手架的方式创建

### 3.1 安装

全局安装脚手架包[官方地址](https://docs.cloudbase.net/cli-v1/quick-start)

```
npm i -g @cloudbase/cli
```

> 为了简化输入，cloudbase 命令可以简写成 tcb

测试安装是否成功

```
tcb -v
```

查看命令

```
tcb -h
```

### 3.2 登录

```
# CloudBase CLI 会自动打开云开发控制台获取授权，您需要点击同意授权按钮允许 CloudBase CLI 获取授权。如您没有登录，您需要登录后才能进行此操作。

tcb login
```

也可以使用下面的方式通过 API 秘钥直接登录，避免交互式输入

```
tcb login --apiKeyId xxx --apiKey xxx
```

### 3.3 创建项目

本地创建项目

```bash
tcb new [options] [appName] [templateUri]
# 比如
tcb new nest-cloundbase nest-starter
```

> 云开发项目是和云开发环境资源关联的实体，云开发项目聚合了云函数、数据库、文件存储等服务，您可以在云开发项目中编写函数，存储文件，并通过 CloudBase 快速的操作您的云函数、文件存储、数据库等资源。

**云开发项目文件结构：**

```
.
├── .gitignore
├── functions // 云函数目录
│   └── node-app
│       └── index.js
└── cloudbaserc.json // 项目配置文件
```

选择自己已经创建的环境,如果没有就 创建新环境,这时候会打开浏览器

![](https://s.poetries.work/uploads/2022/06/6b018bec4591c9aa.png)

本地打开项目并且安装依赖包

```
npm install
npm run dev
```

部署到线上

```bash
# 调用 tcb framework deploy
npm run deploy
```

![](https://s.poetries.work/uploads/2022/06/c9016bdd4a84dac4.png)
![](https://s.poetries.work/uploads/2022/06/00b5a9d585e5f5ee.png)

部署完成后可以使用 `tcb fn list` 命令查看已经部署完成的函数列表

![](https://s.poetries.work/uploads/2022/06/d83d3bfc9b7d025b.png)

### 3.4 环境

**查看所有环境**

```
tcb env list
```

![](https://s.poetries.work/uploads/2022/06/417413944366f8e2.png)

**安全域名**

> 当您需要在网页应用中使用云开发的身份验证服务时，您需要将您的网站的域名（发起请求的页面的域名）加入安全域名名单中。安全域名是云开发服务认可的用户请求来源域名，所有来自非安全域名名单中的请求都不会被响应。

使用下面的命令查看所有配置的安全域名

```
tcb env domain list
```

![](https://s.poetries.work/uploads/2022/06/efa5ad40c4f22218.png)

新增安全域名

```
# 添加一个域名
tcb env domain create www.xxx.com

# 添加多个域名
tcb env domain create www.domain1.com/www.domain2.com/www.domain3.com
```

删除安全域名

```
tcb env domain delete
```

![](https://s.poetries.work/uploads/2022/06/0f6c3726e168a64b.png)

**登录方式**

> 当您需要使用云开发的身份验证服务时，您需要配置您想使用的登录方式。目前云开发支持自定义登录、微信公众平台、微信开放平台登录等多种登录方式。

```
# 您可以使用下面的命令列出环境配置的登录方式列表，查看环境配置的登录方式，以及相关的状态。

tcb env login list
```

![](https://s.poetries.work/uploads/2022/06/0afa72546600b36a.png)

您可以使用下面的命令新建登录方式：

```
tcb env login create
```

> 您需要选择配置的平台，登录方式状态，以及对应的 AppId 和 AppSecret，登录方式请选择启用。在添加方式时不会校验 AppId 和 AppSecret 的有效性，只有在请求时，AppId 和 AppSecret 才会被校验，所以请确保您添加的 AppId 和 AppSecret 是有效的。

![](https://s.poetries.work/uploads/2022/06/14072565a7df9cfc.png)

修改登录方式

> 您也可以使用 `tcb env login update` 修改已经配置的登录方式，如切换启用状态，修改 AppId 和 AppSecret。

![](https://s.poetries.work/uploads/2022/06/4c5a0f883f8093dd.png)

#### 动态变量

> 在 `cloudbaserc.json` 中声明 `"version": "2.0"` 即可启用新的特性，新版配置文件只支持 JSON 格式


```js
// 动态变量特性允许在 `cloudbaserc.json` 配置文件中使用动态变量，从环境变量或其他数据源获取动态的数据。使用 `{{}}` 包围的值定义为动态变量，可以引用数据源中的值。如下所示
{
  "version": "2.0",
  "envId": "envId",
  "functionRoot": "./functions",
  "functions": [
    {
      "name": "{{variable}}"
    }
  ]
}
```

#### 环境变量

CloudBase 支持使用 `.env` 类型文件作为主要数据源，使用不同的后缀区分不同的阶段、场景，如 `.env.development` 可以表示开发阶段的配置，`.env.production` 可以表示生产环境的配置

> 当指定 `--mode [mode]` 时，会再加载 `.env.[mode]` 文件，并按照如下的顺序合并覆盖同名变量：`.env.[mode] > .env.local > .env` 即 `.env.[mode]` 中的同名变量会覆盖 `.env.local` 和 `.env` 文件中的同名变量

> 当使用 `tcb framework deploy --mode test` 命令时，会自动加载 `.env`，`.env.local` 以及 `.env.test` 等三个文件中的环境变量合并使用。

我们建议你将秘钥等私密配置放在 `.env.local` 文件中，并将 `.env.local` 加入 `.gitignore` 配置中

如 `.env.local` 文件中存在以下变量

```
DB_HOST = localhost
DB_USER = root
DB_PASSWORD = s1mpl3
```

则可以在配置文件中使用

```js
{
  "version": "2.0",
  "envId": "xxx",
  "functionRoot": "./functions",
  "functions": [
    {
      "name": "test",
      "envVariables": {
        "PASSWORD": "{{env.DB_PASSWORD}}"
      }
    }
  ]
}
```




### 3.5 云函数操作

#### 函数配置cloudbaserc.json

参考配置

```js
// https://docs.cloudbase.net/cli/functions/configs
// https://docs.cloudbase.net/cli-v1/functions/configs
{
  // version 表示当前配置文件的版本，目前支持的版本号有："2.0"。当 version 字段不存在时，默认当前配置文件为 "1.0" 版本。
  "version": "",
  // 关联环境 ID
  "envId": "dev-xxxx",
  "functionRoot": "./functions", // 云函数函数代码存放的文件夹路径，相对于根目录的路径。
  // region 指定了当前环境的地域信息，上海地域的环境可以不填，其他地域的环境则必须填写。
  "region": "",
  // 函数配置项组成的数组
  "functions": [
    {
      // functions 文件夹下函数文件夹的名称，即函数名
      "name": "app",
      // 超时时间，单位：秒 S
      "timeout": 5,
      // 环境变量
      "envVariables": {
        "key": "value"
      },
      // 私有网络配置，如果不使用私有网络，可不配置
      "vpc": {
        // vpc id
        "vpcId": "vpc-xxx",
        // 子网 id
        "subnetId": "subnet-xxx"
      },
      // 运行时，目前可选运行包含：Nodejs8.9, Nodejs10.15, Php7, Java8
      // 此参数可以省略，默认为 Nodejs10.15
      "runtime": "Nodejs10.15",
      // 是否云端安装依赖，仅支持 Node.js 项目
      "installDependency": true,
      // 函数触发器，说明见文档: https://cloud.tencent.com/document/product/876/32314
      "triggers": [
        {
          // name: 触发器的名字
          "name": "myTrigger",
          // type: 触发器类型，目前仅支持 timer （即定时触发器）
          "type": "timer",
          // config: 触发器配置，在定时触发器下，config 格式为 cron 表达式
          "config": "0 0 2 1 * * *"
        }
      ],
      // 函数处理入口，Node.js 和 PHP 项目可以省略，默认值为 index.main
      // 因 Java 的 handler 配置较为特殊，所以当运行时为 Java 时，handler 不能省略
      // 如：package.Class::mainHandler
      "handler": "index.main",
      // functions:invoke 本地触发云函数时的调用参数
      "params": {},
      // 部署/更新云函数时忽略的文件
      "ignore": [
        // 忽略 markdown 文件
        "*.md",
        // 忽略 node_modules 文件夹
        "node_modules",
        "node_modules/**/*"
      ]
    }
  ]
}
```

下面为目前所有支持的配置项

| 配置项            | 是否必填 | 类型                                                         | 描述                                                         |
| ----------------- | -------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| name              | 是       | String                                                       | 云函数名称，即为函数部署后的名称                             |
| params            | 否       | Object/JSONObject                                            | CIL 调用云函数时的函数入参                                   |
| triggers          | 否       | [`Array`](https://docs.cloudbase.net/cli-v1/functions/configs#cloudfunctiontrigger) | 触发器配置                                                   |
| handler           | 否       | String                                                       | 函数处理方法名称，名称格式支持“文件名称.函数名称”形式        |
| ignore            | 否       | `String/Array<String>`                                       | 部署/更新云函数代码时的忽略文件，支持 glob 匹配规则          |
| timeout           | 否       | Number                                                       | 函数超时时间（1 - 60S）                                      |
| envVariables      | 否       | Object                                                       | 包含环境变量的键值对对象                                     |
| vpc               | 否       | [VPC](https://docs.cloudbase.net/cli-v1/functions/configs#vpc) | 私有网络配置                                                 |
| runtime           | 否       | String                                                       | 运行时环境配置，可选值： `Nodejs8.9, Nodejs10.15 Php7, Java8` |
| memorySize        | 否       | Number                                                       | 函数内存，默认值为 256，可选 128、256、512、1024、2048       |
| installDependency | 否       | Boolean                                                      | 是否云端安装依赖，目前仅支持 Node.js                         |
| codeSecret        | 否       | String                                                       | 代码加密秘钥，格式为 36 位大小写字母、数字                   |

- **注：`runtime` 默认为 `Nodejs10.15`，使用 Node.js 运行时可不填，使用 Php 和 Java 则必填。**
- **启用代码加密后，将无法在小程序 IDE、腾讯云控制台中查看云函数的代码和信息**

**CloudFunctionTrigger**

| 名称   | 是否必填 | 类型   | 描述                                                  |
| ------ | -------- | ------ | ----------------------------------------------------- |
| name   | 是       | String | 触发器名称                                            |
| type   | 是       | String | 触发器类型，可选值：timer                             |
| config | 是       | String | 触发器配置，在定时触发器下，config 格式为 cron 表达式 |

**VPC**

| 名称     | 是否必填 | 类型   | 描述        |
| -------- | -------- | ------ | ----------- |
| vpcId    | 是       | String | VPC Id      |
| subnetId | 是       | String | VPC 子网 Id |

**更新函数运行时配置**

> 创建函数式，Cloudbase CLI 会为函数提供一些默认的配置，所以您不需要添加配置信息也可以直接部署函数。您也可以通过下面的命令修改函数的运行时配置

```
# 更新 app 函数的配置
tcb fn config update app

# 更新配置文件中所有函数的配置信息
tcb fn config update
```

目前支持修改的函数配置包含超时时间 `timeout`、环境变量 `envVariables`、运行时 `runtime`，vpc网络以及 `installDependency` 等选项。

CloudBase CLI 会从配置文件中读取函数的配置信息并更新，CloudBase CLI 会更新配置文件中存在的函数的所有配置，暂不支持指定更新单个配置选项。



#### 部署

> `fn deploy` 命令部署函数的文件大小总计不能超过 `50 M`，否则可能会部署失败。

在一个包含 `cloudbaserc.json` 配置文件的项目下，您可以直接使用下面的命令部署云函数：

```
tcb fn deploy <functionName>
```

使用 `fn deploy` 时，`functionName` 选项是可以省略的，当 `functionName` 省略时，Cloudbase CLI 会部署配置文件中的全部函数：

```bash
# 部署配置文件中的全部函数
tcb fn deploy
```

全部参数

```
Usage: tcb fn deploy [options] [name]

部署云函数

Options:
  -e, --envId <envId>         环境 Id
  --code-secret <codeSecret>  传入此参数将保护代码，格式为 36 位大小写字母和数字
  --force                     如果存在同名函数，上传后覆盖同名函数
  --path <path>               自动创建HTTP 访问服务访问路径
  --all                       部署配置文件中的包含的全部云函数
  --dir <dir>                 指定云函数的文件夹路径
  -h, --help                  查看命令帮助信息
```

**默认选项**

Cloudbase CLI 为 Node.js 云函数提供了默认选项，您在部署 Node.js 云函数时可以不用指定云函数的配置，使用默认配置即可部署云函数。

云函数默认配置：

```json
{
  // 超时时间 5S
  "timeout": 5,
  // 运行时
  "runtime": "Nodejs10.15",
  // 自动安装依赖
  "installDependency": true,
  // 处理入口
  "handler": "index.main",
  // 忽略 node_modules 目录
  "ignore": ["node_modules", "node_modules/**/*", ".git"]
}
```

**deploy 命令做了啥**

`fn deploy` 会读取 `cloudbaserc.json` 文件中指定函数的配置，并完成以下几项工作

- 将函数打包成压缩文件，并上传函数代码。
- 部署函数配置，包括超时时间、网络配置等。
- 部署函数触发器。


#### 管理云函数

- 您可以使用下面的命令列出所有云函数，查看函数的基本信息：

```
tcb fn list
```

![](https://s.poetries.work/uploads/2022/06/7f14d68f7629334e.png)

- 指定返回条数和偏移量

> 默认情况下，`fn list` 命令只会列出前 `20` 个函数，如果您的函数较多，需要列出其他的函数，您可以通过下面的选项指定命令返回的数据长度以及数据的偏移量：

```
-l, --limit <limit>    返回数据长度，默认值为 20
-o, --offset <offset>  数据偏移量，默认值为 0
```

```
# 返回前 10 个函数的信息
tcb fn list -l 10
# 返回第 3 - 22 个函数的信息（包含 3 和 22）
tcb fn list -l 20 -o 2
```

- 下载云函数代码

```
tcb fn code download <functionName> [destPath]
```

默认情况下，函数代码会下载到 `functionRoot` 下，以函数名称作为存储文件夹，您可以指定函数存放的文件夹地址，函数的所有代码文件会直接下载到指定的文件夹中。

![](https://s.poetries.work/uploads/2022/06/d3b9aed0b63bb50b.png)
![](https://s.poetries.work/uploads/2022/06/c4dc431bcd542129.png)

- 查看函数详情

```
# 查看 vue-echo 函数的详情
tcb fn detail vue-echo
```

![](https://s.poetries.work/uploads/2022/06/2437d329c6b5e767.png)

- 删除函数

```
# 删除 app 函数
tcb fn delete app

# 删除配置文件中的所有的函数
tcb fn delete
```

- 复制函数

```
# 复制 app 函数为 app2 函数
tcb fn copy app app2
```

#### 触发器

触发器是按照一定规则触发函数的模块的抽象，CloudBase 云函数目前仅支持定时触发器。

> 如果云函数需要定时/定期执行，即定时触发，您可以使用云函数定时触发器。已配置定时触发器的云函数，会在相应时间点被自动触发，函数的返回结果不会返回给调用方。

```js
{
  "version": "2.0",
  "envId": "xxx",
  "functions": [
    {
      // triggers 字段是触发器数组，目前仅支持一个触发器，即数组只能填写一个，不可添加多个
      "triggers": [
        {
          // name: 触发器的名字，规则见下方说明
          "name": "myTrigger",
          // type: 触发器类型，目前仅支持 timer （即定时触发器）
          "type": "timer",
          // config: 触发器配置，在定时触发器下，config 格式为 cron 表达式，规则见下方说明
          "config": "0 0 2 1 * * *"
        }
      ]
    }
  ]
}
```

**创建函数触发器**

```
# 创建 app 函数配置的触发器
tcb fn trigger create app
```

> Cloudbase CLI 会自动读取 `cloudbaserc.json` 文件中指定函数配置的定时触发器，并创建云函数触发器。如果配置文件中没有包含触发器配置，则会创建失败。

一个函数可以包含多个触发器，一个触发器包含了以下 3 个主要信息：`name`, `type`, `config`

```js
{
  // name: 触发器的名字，规则见下方说明
  "name": "myTrigger",
  // type: 触发器类型，目前仅支持 timer （即定时触发器）
  "type": "timer",
  // config: 触发器配置，在定时触发器下，config 格式为 cron 表达式
  "config": "0 0 2 1 * * *"
}
```

当没有指定函数名时，Cloudbase CLI 会创建 `cloudbaserc.json` 文件包含的所有函数的所有触发器

**删除函数触发器**

```
# 删除 app 函数的名为 trigger 的触发器
tcb fn trigger delete app trigger
```

> 当没有指定函数名时，Cloudbase CLI 会删除 `cloudbaserc.json` 文件包含的所有函数的所有触发器。当只指定了函数名时，Cloudbase CLI 会删除指定函数的所有触发器，当同时指定了函数名称和触发器名称时，Cloudbase CLI 只会删除指定的触发器。

```bash
# 删除 cloudbaserc.json 文件中所有函数的所有触发器
tcb fn trigger delete

# 删除函数 app 的所有触发器
tcb fn trigger delete app

# 删除函数 app 的触发器 trigger
tcb fn trigger delete app trigger
```

**触发器规则**

- 定时触发器名称（name） ：最大支持 `60` 个字符，支持 `a-z`, `A-Z`, `0-9`, `-` 和 `_`。必须以字母开头，且一个函数下不支持同名的多个定时触发器。
- 定时触发器触发周期（config）：指定的函数触发时间。填写自定义标准的 Cron 表达式来决定何时触发函数。有关 Cron 表达式的更多信息，请参考以下内容。

Cron 表达式有七个必需字段，按空格分隔。其中，每个字段都有相应的取值范围：

| 排序   | 字段 | 值                                                           | 通配符    |
| ------ | ---- | ------------------------------------------------------------ | --------- |
| 第一位 | 秒   | 0 - 59 的整数                                                | `, - * /` |
| 第二位 | 分钟 | 0 - 59 的整数                                                | `, - * /` |
| 第三位 | 小时 | 0 - 23 的整数                                                | `, - * /` |
| 第四位 | 日   | 1 - 31 的整数（需要考虑月的天数）                            | `, - * /` |
| 第五位 | 月   | 1 - 12 的整数或 JAN、FEB、MAR、APR、MAY、JUN、JUL、AUG、SEP、OCT、NOV 和 DEC | `, - * /` |
| 第六位 | 星期 | 0 - 6 的整数或 MON、TUE、WED、THU、FRI、SAT 和 SUN，其中 0 指周日，1 指星期一，以此类推 | `, - * /` |
| 第七位 | 年   | 1970 - 2099 的整数                                           | `, - * /` |


**通配符**

| 通配符        | 含义                                                         |
| ------------- | ------------------------------------------------------------ |
| `，`（逗号）  | 代表取用逗号隔开的字符的并集。例如：在“小时”字段中 1，2，3 表示 1 点、2 点和 3 点 |
| `-`（短横线） | 包含指定范围的所有值。例如：在“日”字段中，1 - 15 包含指定月份的 1 号到 15 号 |
| `*`（星号）   | 表示所有值。在“小时”字段中，`*` 表示每个小时                 |
| `/`（正斜杠） | 指定增量。在“分钟”字段中，输入 1/10 以指定从第一分钟开始的每隔十分钟重复。例如，第 11 分钟、第 21 分钟和第 31 分钟，以此类推 |

> !在 Cron 表达式中的“日”和“星期”字段同时指定值时，两者为“或”关系，即两者的条件均生效。

**下面列举一些 `Cron` 表达式和相关含义：**

- `*/5 * * * * * *` 表示每 5 秒触发一次
- `0 0 2 1 * * *` 表示在每月的 1 日的凌晨 2 点触发
- `0 15 10 * * MON-FRI *` 表示在周一到周五每天上午 10:15 触发
- `0 0 10,14,16 * * * *` 表示在每天上午 10 点，下午 2 点，下午 4 点触发
- `0 */30 9-17 * * * *` 表示在每天上午 9 点到下午 5 点内每半小时触发
- `0 0 12 * * WED *` 表示在每个星期三中午 12 点触发

#### 代码更新

当您的函数代码发生改变时，您可以使用下面的命令更新您的云函数的代码：

```bash
# 更新 app 函数的代码
tcb fn code update app
```

> `fn code update` 命令和 `fn deploy` 命令的主要区别是：`fn code update` 命令只会更新函数的代码以及执行入口，不会修改函数的其他配置，而 `fn deploy` 命令则会修改函数的代码、配置以及触发器等。

#### 函数版本

您可以通过下面的命令查看函数版本：

```
tcb fn list-function-versions <name>
```

![](https://s.poetries.work/uploads/2022/06/88eb3713574d7f1b.png)

#### 函数日志

您可以通过下面的命令打印云函数的运行日志，使用此命令时必须指定函数的名称：

```
# 查看 vue-echo 函数的调用日志
tcb fn log vue-echo
```

![](https://s.poetries.work/uploads/2022/06/8f3777524f8f6e77.png)

默认情况下，Cloudbase CLI 会打印最近的 20 条日志，您可以通过在命令后附加下面的可用选项指定返回日志的筛选条件：

```
-i, --reqId <reqId>  函数请求 Id
-o, --offset <offset>                        数据的偏移量，Offset + Limit不能大于10000
-l, --limit <limit>                          返回数据的长度，Offset + Limit不能大于10000
--order <order>                              以升序还是降序的方式对日志进行排序，可选值 desc 和 asc
--orderBy <orderBy>                          根据某个字段排序日志,支持以下字段：function_name,duration, mem_usage, start_time
--startTime <startTime>                      查询的具体日期，例如：2019-05-16 20:00:00，只能与endtime 相差一天之内
--endTime <endTime>                          查询的具体日期，例如：2019-05-16 20:59:59，只能与startTime 相差一天之内
-e, --error                                  只返回错误类型的日志
-s, --success                                只返回正确类型的日志
```

如：`tcb fn log app -l 2` 打印 `app` 函数的最新 2 条日志信息


#### 部署示例

- 编写`cloudbaserc.json文件`

![](https://s.poetries.work/uploads/2022/06/705a1f9853edda3a.png)

```json
{
  "version": "2.0",
  "envId": "poetry-prod-xx",
  "functionRoot": "./cloudfunctions",
  "functions": [
    {
      "name": "vue-echo",
      "timeout": 5,
      "runtime": "Nodejs10.15",
      "installDependency": true
    }
  ]
}
```

- 部署，执行以下命令，部署指定函数名称

```
tcb fn deploy vue-echo
```

![](https://s.poetries.work/uploads/2022/06/840a923b27e4ee59.png)

- 查看已部署的函数

```
tcb fn list
```

![](https://s.poetries.work/uploads/2022/06/7f14d68f7629334e.png)



### 3.6 静态网站托管

> 云开发为开发者提供静态网页托管的能力，静态资源（HTML、CSS、JavaScript、字体等）的分发由对象存储 COS 和拥有多个边缘网点的 CDN 提供支持。您可在腾讯云控制台进行静态网站的部署，提供给您的用户访问。目前云开发静态网页托管能力仅在腾讯云云开发控制台支持，小程序 IDE 侧控制台暂不支持。

仅有付费方式为按量付费的环境可开通静态网页托管能力，预付费方式环境不可开通。

使用 CLI 操作静态网站服务前请先到[云开发控制台开通静态网站服务](https://console.cloud.tencent.com/tcb)。

**全量部署**

> 云开发 CLI 提供了直接部署网站文件的命令，在您需要部署的文件夹目录下，直接运行 `tcb hosting deploy` 命令即可将当前目前下所有的文件部署静态网站中。

```bash
# dist 构建目录
cd dist
# 部署全部文件
tcb hosting deploy -e envId
```

![](https://s.poetries.work/uploads/2022/06/cd6fa613aa0ba32c.png)

**您可以使用下面的命令展示静态网站的状态，访问域名等信息**

![](https://s.poetries.work/uploads/2022/06/08f8a4eed05f40c3.png)

**删除文件**

您可以使用下面的命令删除静态网站的存储空间中的文件或文件夹

```
# cloudPath 为文件或文件夹的相对根目录的路径，为 目录/文件名 的形式，如 index.js、static/css/index.js 等

tcb hosting delete cloudPath -e envId
```

**删除全部文件**

云端路径为空时，表示删除全部文件

```
tcb hosting delete -e envId
```

**查看文件列表**

您可以使用下面的命令部署展示静态网站存储空间中文件

```
tcb hosting list -e envId
```

![](https://s.poetries.work/uploads/2022/06/68112e40d3a20d26.png)


## 四、云开发登录鉴权

> CloudBase 提供跨平台的登录鉴权功能，您可以基于此为自己的应用构建用户体系，包括但不限于：

- 为用户分配全局唯一的身份标识 uid；
- 储存和管理用户个人信息；
- 关联多种登录方式；
- 管理用户对数据、资源的访问权限；
- 用户行为的收集和分析。

> 同时，CloudBase 登录鉴权还是保护您的服务资源的重要手段，CloudBase 对用户端发来的每一个请求，都会进行身份和权限的检查，避免您的资源被恶意攻击者消耗或者盗用。

### 4.1 登录鉴权

![](https://s.poetries.work/uploads/2022/06/015d7200d6f0ed7b.png)

> 每个登录 CloudBase 的用户，都有一个对应的 CloudBase 账号，用户通过此账号访问调用 CloudBase 的数据与资源。

- 每个账号都有全局唯一的 UID，即账号 ID，作为用户的唯一身份标识
- 每个账号可以添加、修改用户信息
- 每个账号除了最初的登录方式之外，还可以关联其它登录方式

**登录状态的持久化**

您可以指定登录状态如何持久保留。默认为 `local`，相关选项包括

![](https://s.poetries.work/uploads/2022/06/aafc37032a793f1c.png)

例如，对于网页应用，最佳选择是 `local`，即在用户关闭浏览器之后仍保留该用户的会话。这样，用户不需要每次访问该网页时重复登录，避免给用户带来诸多不便体验。

**访问令牌与刷新令牌**

用户登录 CloudBase 之后，会获得访问令牌（`Access Token`） 作为访问 `CloudBase` 的凭证，访问令牌默认具有两小时有效期。

登录时还会获得刷新令牌（Refresh Token），默认有效期 30 天，用于访问令牌过期后，获取新的访问令牌。

CloudBase 用户端 SDK 会自动维护令牌的刷新和有效期，开发者无需特别关注此流程。

> 匿名登录 的刷新令牌（`Refresh Token`）会在到期后自动续期，以实现长期的匿名登录状态。

#### 管理用户

**获取当前登录的用户**

- 订阅登录状态变化的回调函数

> 获取当前用户，推荐在 `Auth` 对象上设置一个回调函数，每当用户登录状态转变时，会触发这个回调函数，并且获得当前的 `LoginState`：

```js
import cloudbase from "@cloudbase/js-sdk";

const app = cloudbase.init({
  env: "your-env-id"
});
const auth = app.auth();

// 设置一个观察者
auth.onLoginStateChanged((loginState) => {
  if (loginState) {
    // 此时用户已经登录
  } else {
    // 没有登录
  }
});
```

- 直接获取当前用户

> 您还可以使用 `Auth.currentUser` 属性来获取当前登录的用户。如果用户未登录，则 `currentUser` 为 null

您还可以使用 `Auth.currentUser` 属性来获取当前登录的用户。如果用户未登录，则 `currentUser` 为 `null`

```js
const user = auth.currentUser;

if (user) {
  // 此时用户已经登录
} else {
  // 没有登录
}
```

**获取用户个人资料**

> 您可以通过 `User` 对象的各个属性来获取用户的个人资料信息：

```js
const user = auth.currentUser;
let uid, nickName, gender, avatarUrl, location;

if (user) {
  // 云开发唯一用户 id
  uid = user.uid;

  // 昵称
  nickName = user.nickName;

  // 性别
  gender = user.gender;

  // 头像URL
  avatarUrl = user.avatarUrl;

  // 用户地理位置
  location = user.location;
}
```

**更新用户个人资料**

您可以使用 `User.update` 方法来更新用户的个人资料信息。例如：

```js
const user = auth.currentUser;

user
  .update({
    nickName: "Tony Stark",
    gender: "MALE",
    avatarUrl: "https://..."
  })
  .then(() => {
    // 更新用户资料成功
  });
```

**刷新用户资料信息**

对于一个多端应用，用户可能在其中某个端上更新过自己的个人资料信息，此时其它端上可能需要刷新信息：

```js
const user = auth.currentUser;

// 刷新用户信息
user.refresh().then(() => {
  // 刷新后，获取到的用户信息即为最新的信息
  const { nickName, gender, avatarUrl } = user;
});
```


#### 账户关联

**关联微信登录**

- 用户以任意一种登录方式（除微信登录）登录云开发
- 获取 Provider：

```js
const auth = app.auth();
const provider = auth.weixinAuthProvider({
  appid: "....",
  scope: "snsapi_base"
});
```

- 重定向到提供方的页面进行登录：

```js
auth.currentUser.linkWithRedirect(provider);
```

用户在微信的页面登录之后，会被重定向回您的页面。然后，可以在页面加载时通过调用 `Provider.getLinkRedirectResult()` 来获取关联结果：

```js
const provider = auth.weixinAuthProvider();

provider.getLinkRedirectResult().then((result) => {
  // 关联成功
});
```

**关联自定义登录**

- 用户以任意一种登录方式（除自定义登录）登录云开发；
- 使用 `User.linkWithTicket`，获取自定义登录 `Ticket` 后，关联自定义用户：

```js
const auth = app.auth();
const ticket = "......"; // 自定义登录 Ticket
auth.currentUser.linkWithTicket(ticket).then((result) => {
  // 关联成功
});
```

**关联邮箱密码登录**

- 用户以任意一种登录方式登录云开发
- 更新用户的密码：

```js
const auth = app.auth();
auth.currentUser.updatePassword(password).then(() => {
  // 设置密码成功
});
```

- 更新用户的邮箱，用户点击验证邮件之后，便关联成功：

```js
auth.currentUser.updateEmail(email).then(() => {
  // 发送验证邮件成功
});
```

**关联用户名密码登录**

- 用户以任意一种登录方式（除匿名登录）登录云开发：

```js
// 以邮箱登录为例
await app.auth().signInWithEmailAndPassword(email, password);
```

- 绑定登录的用户名：

```js
await app.auth().currentUser.updateUsername(username); // 绑定用户名
```

- 绑定成功后，便可以使用用户名密码登录：

```js
const loginState = await app.auth().signInWithUsernameAndPassword(username, password); // 用户名密码登录
```


#### 最佳实践

**避免重复登录**

> 执行登录流程之前，我们非常建议您先判断用户端是否已经登录 CloudBase，如已经登录，那么不需要执行登录流程，以避免无意义的重复登录。

```js
const auth = app.auth();

// 应用初始化时
if (auth.hasLoginState()) {
  // 此时已经登录
} else {
  // 此时未登录，执行您的登录流程
}
```

**登录状态的持久保留**

> 对于网页应用，最佳选择是 `local`，即在用户关闭浏览器之后仍保留该用户的会话。这样，用户不需要每次访问该网页时重复登录，避免给用户带来诸多不便体验

```js
const auth = app.auth({
  persistence: "local"
});
```


### 4.2 登录方式

#### 匿名登录

> 登录 腾讯云 CloudBase 控制台，在 [登录授权页面中](https://console.cloud.tencent.com/tcb/env/login)，将匿名登录一栏打开或关闭。

![](https://s.poetries.work/uploads/2022/06/e95ddf99a0e2939c.png)

**添加安全域名（可选）**

Web 应用需要将域名添加到 CloudBase 控制台的[Web 安全域名](https://console.cloud.tencent.com/tcb/env/safety)列表中，否则将被识别为非法来源：

![](https://s.poetries.work/uploads/2022/06/3404d8f9e5a8d4cf.png)

```js
import cloudbase from '@cloudbase/js-sdk';

const app = cloudbase.init({
  env: 'xxxx-yyy';
});

const auth = app.auth();

async function login(){
  await auth.anonymousAuthProvider().signIn();
  // 匿名登录成功检测登录状态isAnonymous字段为true
  const loginState = await auth.getLoginState();
  console.log(loginState.isAnonymousAuth); // true
}

login();
```

![](https://s.poetries.work/uploads/2022/06/b34c3d3acc92627a.png)

可以看到token缓存到了本地

![](https://s.poetries.work/uploads/2022/06/501a1e7be7791960.png)

> 每个 `CloudBase` 环境的匿名用户数量不超过 `1000` 万个

匿名用户在安全规则中的`auth.loginType`值为`ANONYMOUS`，配合安全规则可以限制匿名用户的 云数据库 和 云存储 的访问权限。比如下述代码展示的安全规则为：

- 云数据库匿名用户不可读写；
- 云存储所有用户可读，匿名用户不可写。

![](https://s.poetries.work/uploads/2022/06/f49d51410d41a7e2.png)

**转化为正式用户**

- 如果用户在匿名状态下产生了一些私有数据（例如游戏中获取了个人成就和装备），想将此匿名账号转化为正式账号长久持有。
- 针对这种需求，您可以 将匿名账号与任意一种登录方式关联，关联后，便可以永久使用该种登录方式登录 CloudBase，达成”匿名账号转正“的效果。详情请参考：账户关联。

**问题**

- 匿名登录与未登录有什么区别？

![](https://s.poetries.work/uploads/2022/06/d8b255edaee3b012.png)

- 匿名登录的用户达到上限后怎么办？

> CloudBase 限制每个环境的匿名用户数量不超过 1000 万个，如果达到上限可以在 CloudBase 控制台 的“用户管理”页面查看匿名用户的活跃情况，针对长期不登录的匿名用户可以考虑将其删除以释放空间。

- 匿名用户是否会过期？

> CloudBase 对匿名用户的有效期限策略是：每个设备同时只存在一个匿名用户，并且此用户永不过期。当然，如果用户手动清除了设备或浏览器的本地数据，那么匿名用户的数据便会被同步清除，再次调用 CloudBase 匿名登录 API 会产生一个新的匿名用户。


#### 未登录

> CloudBase 允许客户端在未登录的情况下调用 CloudBase 的资源，开发者可以配合安全规则限制未登录对资源的访问权限。

登录 云开发 CloudBase 控制台，在 [登录授权](https://console.cloud.tencent.com/tcb/env/login) 中，将未登录一栏打开或关闭。

![](https://s.poetries.work/uploads/2022/06/46c9989ef1cea582.png)

**添加安全域名（可选）**

Web 应用需要将域名添加到 CloudBase 控制台的[Web 安全域名](https://console.cloud.tencent.com/tcb/env/safety)列表中，否则将被识别为非法来源：

![](https://s.poetries.work/uploads/2022/06/3404d8f9e5a8d4cf.png)

**使用流程**

1. 设置自定义安全规则，放通未登录访问

您需要使用自定义安全规则，来放通未登录模式下的资源访问。

> 基于安全性的考虑，基础的四种权限设置下，均不允许未登录进行访问。

如，您可以这样设置云数据库的权限：

```
{
    "read": "doc._openid==auth.openid || auth == null"
}
```

在原始私有读 `doc._openid==auth.openid` 的基础上，允许了所有未登录用户进行读资源。详细可查看 [编写安全规则](https://docs.cloudbase.net/rule/rule-example)。

![](https://s.poetries.work/uploads/2022/06/4bf8025e0f47dce5.png)

2. 初始化 SDK 发起调用

```js
import cloudbase from '@cloudbase/js-sdk';

const app = cloudbase.init({
  env: 'xxxx-yyy';
});
```

SDK 初始化完成后可以正常发起云开发资源的调用。

![](https://s.poetries.work/uploads/2022/06/c81cf50a598dd81f.png)

#### 邮箱登录

> 使用邮箱登录，您可以让您的用户使用自己的邮箱和密码注册、登录 CloudBase，并且还可以更新登录使用的邮箱和密码。

**开通邮箱登录**

1. 开启邮箱登录

进入 云开发 CloudBase 控制台，在 登录授权 设置页面中，开启邮箱登录:

![](https://s.poetries.work/uploads/2022/06/bdff32d173347663.png)

2. 配置发件邮箱

> 填入您邮箱的 SMTP 账号信息

![](https://s.poetries.work/uploads/2022/06/d5760279a4e8d4b9.png)

3. 设置应用名称及自动跳转链接

打开右侧「应用配置」页面，设置您的应用名称和自动跳转链接。

- 您设置的应用名称将会出现在验证邮件的内容中；
- CloudBase 发送的邮件中会包含一个 URL，用户打开邮件中的 URL 后，会自动跳转到您设置的自动跳转链接。

![](https://s.poetries.work/uploads/2022/06/75fe3a786ac2f19b.png)

**登录流程**

1. 初始化 SDK

```js
import cloudbase from "@cloudbase/js-sdk";

const app = cloudbase.init({
  env: "your-env-id"
});
```

2. 使用邮箱注册账号

首先需要用户填入自己的邮箱和密码，然后调用 SDK 的注册接口：

```js
app
  .auth()
  .signUpWithEmailAndPassword(email, password)
  .then(() => {
    // 发送验证邮件成功
  });
```

调用注册接口之后，`CloudBase` 会使用您预先设置的邮箱，发送一封验证邮件到用户的邮箱。邮件中包含一个激活链接，用户在点击激活链接后，账号才会正式注册成功。

> 密码强度要求:密码长度不小于 8 位，不大于 32 位，需要包含字母和数字。

![](https://s.poetries.work/uploads/2022/06/8dfd1a122cf97ef9.png)

可以看到注册成功的账户

![](https://s.poetries.work/uploads/2022/06/88c3a1a2a39dab05.png)

3. 使用邮箱+密码登录 CloudBase

```js
app
  .auth()
  .signInWithEmailAndPassword(email, password)
  .then((loginState) => {
    // 登录成功
  });
```

![](https://s.poetries.work/uploads/2022/06/3dbf8e6a924809df.png)


#### 微信授权登录

经微信授权的网页应用可以直接使用微信登录 CloudBase，包括两种授权类型：

- 微信公众平台（公众号网页）；
- 微信开放平台（普通网站应用及移动应用等）

**开通流程**

1. 开通平台账号

首先需要一个微信公众平台 / 开放平台的注册账号，如果没有，请前往 [微信公众平台](https://mp.weixin.qq.com/) 或 [微信开放平台申请](https://open.weixin.qq.com/)

然后在微信公众平台/开放平台的管理后台中，查看开发者 ID（AppId）和开发者密码（AppSecret）。

以微信公众平台为例，在“开发 - 基本配置”中有以下内容：

![](https://s.poetries.work/uploads/2022/06/d9590e7139fec14a.png)

> 开发者密码（AppSecret）是非常私密的信息，每次点击上图中的「重置」按钮都会获取一个新的 AppSecret。

2. 开启微信登录

![](https://s.poetries.work/uploads/2022/06/c6f20fd79e5cf432.png)

点击启用按钮后在弹窗的对应位置填入 AppId 和 AppSecret。

3. 添加安全域名（可选）

Web 应用需要将域名添加到 CloudBase 控制台的[Web 安全域名](https://console.cloud.tencent.com/tcb/env/safety)列表中，否则将被识别为非法来源：

![](https://s.poetries.work/uploads/2022/06/3404d8f9e5a8d4cf.png)

**微信登录流程**

在使用微信登录 CloudBase 前，请先在控制台中 [启用微信登录](https://docs.cloudbase.net/authentication/method/wechat-login#%E5%BC%80%E9%80%9A%E6%B5%81%E7%A8%8B)。

1. 初始化 SDK

```js
import cloudbase from "@cloudbase/js-sdk";

const app = cloudbase.init({
  env: "your-env-id"
});
```

2. 使用 SDK 处理登录流程

创建 Provider：首先我们创建一个 Provider 实例，并且填入参数：

```js
const auth = app.auth();

const provider = auth.weixinAuthProvider({
  appid: "...",
  scope: "xxxx"
});
```

![](https://s.poetries.work/uploads/2022/06/befa9164c6b90b3f.png)

- 如果用户使用 `snsapi_userinfo` 或 `snsapi_login` 登录，并且是首次登录，那么 CloudBase 将会自动拉取、同步微信的用户基本信息。
- 如果用户不是首次登录，将不会有此行为。

使用 Provider 进行登录

> 首先调用 `Provider.signInWithRedirect()`，用户将会跳转到微信 OAuth 授权页面：

```
provider.signInWithRedirect();
```

在授权页面内，需要用户对登录行为进行授权，成功后，会返回至当前页面。

然后调用 `Provider.getRedirectResult()`，获取登录结果：

```js
provider.getRedirectResult().then((loginState) => {
  if (loginState) {
    // 登录成功！
  }
});
```

#### 自定义登录

> 开发者可以使用自定义登录，在自己的服务器或者云函数内，为用户签发带有自定义身份 ID 的自定义登录凭证 Ticket，随后用户端 SDK 便可以使用 Ticket 登录 CloudBase。

自定义登录一般用于下面几种场景：

- 开发者希望将自有的账号体系与云开发 CloudBase 账号进行一对一关联；
- 开发者希望自行接管鉴权流程。

自定义登录需要以下几个步骤：

- 获取 CloudBase 自定义登录私钥；
- 使用 CloudBase 服务端 SDK，通过私钥签发出 Ticket，并返回至用户端；
- 用户端 SDK 使用 Ticket 登录 CloudBase。

1. 获取自定义登录私钥

> 登录 CloudBase 控制台，在 [环境 -> 登录授权](https://console.cloud.tencent.com/tcb/env/login)下的自定义登录栏中，点击「私钥下载」或者「私钥复制」：

![](https://s.poetries.work/uploads/2022/06/0d8163e0ab3193ec.png)

> 私钥是一份携带有 JSON 数据的文件，请将下载或复制的私钥文件保存到您的服务器或者云函数中，假设路径为`/path/to/your/tcb_custom_login.json`。

- 私钥文件是证明管理员身份的重要凭证，请务必妥善保存，避免泄漏；
- 每次生成私钥文件都会使之前生成的私钥文件在 2 小时后失效。

2. 签发 Ticket

调用 CloudBase 服务端 SDK，在初始化时传入自定义登录私钥，随后便可以签发出 Ticket，并返回至用户端

```js
const cloudbase = require("@cloudbase/node-sdk");

// 1. 初始化 SDK
const app = cloudbase.init({
  env: "your-env-id",
  // 传入自定义登录私钥
  credentials: require("/path/to/your/tcb_custom_login.json")
});

// 2. 开发者自定义的用户唯一身份标识
const customUserId = "your-customUserId";

// 3. 创建ticket
const ticket = app.auth().createTicket(customUserId);

// 4. 将ticket返回至客户端
return ticket;
```

> 开发者也可以编写一个云函数用于生成 Ticket，并为其设置 HTTP 访问服务，随后用户端便可以通过 HTTP 请求的形式获取 Ticket，详细的方案请参阅 [使用 HTTP 访问云函数](https://docs.cloudbase.net/service/access-cloud-function)。

customUserId 必须满足以下需求：

- 4-32 位字符；
- 字符只能是大小写英文字母、数字、以及 `_-#@(){}[]:.,<>+#~` 中的字符。

3. 使用 Ticket 登录 CloudBase

> 用户端应用获取到 Ticket 之后，便可以调用客户端 SDK 提供的 `auth.signInWithTicket()` 登录 CloudBase：

```js
import cloudbase from '@cloudbase/js-sdk';

const app = cloudbase.init({
  env: 'your-env-id'
});

const auth = app.auth();

async function login(){
  const loginState = await auth.getLoginState();
  // 1. 建议登录前检查当前是否已经登录
  if(!loginState){
    // 2. 请求开发者自有服务接口获取ticket
    const ticket = await fetch('...')；
    // 3. 登录 CloudBase
    await auth.customAuthProvider().signIn(ticket);
  }
}

login();
```

![](https://s.poetries.work/uploads/2022/06/bf6484c27c260614.png)

**自定义登录一定需要自己假设用于创建 Ticket 的服务器吗？**

- 自定义登录必须有一个创建 Ticket 的服务，但是开发者并非一定要自己搭建服务器。
- 开发者还可以编写一个云函数来创建 Ticket，然后客户端使用 HTTP 请求调用这个云函数获取 Ticket，详细请参阅 [使用 HTTP 访问云函数](https://docs.cloudbase.net/service/access-cloud-function)


#### 用户名密码登录

- 使用用户名密码登录，您可以让您的用户绑定用户名，并使用用户名密码登录 CloudBase。您可以更改用户名和密码，还可以查询用户名是否绑定过。
- 如果用户名未被绑定过，需要先使用其他登录方式完成登录后，才可以绑定用户名。绑定成功后，可以使用用户名和密码完成登录。

进入 云开发 CloudBase 控制台，在 登录授权 设置页面中，开启用户名密码登录:

![](https://s.poetries.work/uploads/2022/06/6d0258075bf46615.png)

**绑定用户名流程**

1. 初始化 SDK

```js
import cloudbase from "@cloudbase/js-sdk";

const app = cloudbase.init({
  env: "your-env-id"
});
```

2. 使用其他方式进行登录

绑定用户名之前，用户需要先使用其他方式进行登录，例如邮箱登录、微信公众号登录等，但不包括匿名登录

下面以邮箱登录为例：

```js
const auth = app.auth();
await auth.signInWithEmailAndPassword(email, password); // 邮箱登录
```

![](https://s.poetries.work/uploads/2022/06/acd1fb389d6c9a6d.png)


3. 绑定用户名

绑定用户名时，可以检查在当前云开发环境下，此用户名是否存在。然后再调用绑定用户名的接口

```js
const auth = app.auth();
if (!(await auth.isUsernameRegistered(username))) {
  // 检查用户名是否绑定过
  await auth.currentUser.updateUsername(username); // 绑定用户名
}
```

**使用用户名+密码登录 CloudBase**

```js
const auth = app.auth();
const loginState = await auth.signInWithUsernameAndPassword(username, password); // 用户名密码登录
```

> 注意：用户名登录和邮箱登录的密码是相同的


#### 短信验证码登录

> 使用短信验证码登录，您可以让用户使用自己的手机号，结合短信验证码或密码注册、登录 CloudBase，并且还可以更新或者解绑登录使用的手机号。

**开通短信验证码登录**

![](https://s.poetries.work/uploads/2022/06/e4eac02d22f679e0.png)

**登录流程**

1. 初始化 SDK

```js
import cloudbase from "@cloudbase/js-sdk";

const app = cloudbase.init({
  env: "your-env-id"
});
```

2. 使用手机号注册账号

> 首先需要用户填入自己的手机号，然后调用 SDK 的发送短信验证码接口：

```js
app
  .auth()
  .sendPhoneCode(phoneNumber)
  .then(() => {
    // 发送短信验证码
  });
```

> 调用发送短信接口后，手机将会收到云开发的短信验证码。用户填入短信验证码，以及自定义密码后，调用注册账号接口

```js
app
  .auth()
  .signUpWithPhoneCode(phoneNumber, phoneCode, password)
  .then(() => {
    // 手机短信注册账号
  });
```

3. 使用手机号 + 密码 or 手机号 + 短信验证码登录 CloudBase

```js
app
  .auth()
  .signInWithPhoneCodeOrPassword({
    phoneNumber,
    phoneCode, // 非必填，验证码和密码至少二选一
    password // 非必填，验证码和密码至少二选一
  })
  .then((loginState) => {
    // 登录成功
  });
```



## 五、CloudBase Framework一体化部署（推荐方式）

> 文档地址 https://docs.cloudbase.net/framework/index

> CloudBase Framework 是云开发官方出品的云原生一体化部署工具，可以帮助开发者将静态网站、后端服务和小程序等应用，一键部署到云开发 Serverless 架构的云平台上，自动伸缩且无需关心运维，聚焦应用本身，无需关心底层配置和资源。


### 5.1 云开发应用介绍

> 云开发应用可以理解为运行在云开发环境的应用，例如一个包含前后端、数据库等能力等服务，可以通过一键部署，直接部署在云开发环境中，使用云开发底层的各项 Serverless 资源，享受弹性免运维的优势。

![](https://s.poetries.work/uploads/2022/06/40bd0c9ceadc339e.png)

一个云开发应用可以拆解为三个部分，包括代码、声明式配置和环境变量信息。

![](https://s.poetries.work/uploads/2022/06/7215d3f021c80ef9.png)

**如何开发一个云开发应用**

![](https://s.poetries.work/uploads/2022/06/3731b6c2de7002eb.png)


### 5.2 cloudbase framework配置文件

> 在使用 CloudBase Framework 之前，您需要需要创建一个 `cloudbaserc.json` 配置文件，`cloudbaserc.json` 文件是 CloudBase CLI 、CloudBase VSCode 插件和 CloudBase 应用的配置文件，配置文件会关系到云开发如何构建和部署您的应用。


默认情况下，使用 `cloudbase init` 初始化项目时，会生成 `cloudbaserc.json` 文件作为配置文件，您也可以使用 `--config-file` 指定其他文件作为配置文件，文件必须满足格式要求。

**CloudBase Framework 配置文件包含以下几类配置信息：**

![](https://s.poetries.work/uploads/2022/06/3e69b0ecfb4b5b1c.png)

1. plugins：描述您的应用依赖哪些 CloudBase Framework 插件，以便根据配置来构建和部署您的应用，应用可以使用多个插件，具体插件配置方式参考下文。

> 目前支持的插件名称请参阅 https://github.com/Tencent/cloudbase-framework#目前支持的插件列表

示例

```js
{
  "framework": {
    "plugins": {
      "client": {
        // 使用的插件 npm 包名，例如 @cloudbase/framework-plugin-website支持指定插件版本，例如@cloudbase/framework-plugin-website@1.3.5
        "use": "@cloudbase/framework-plugin-website",
        // 插件入参配置，不同的插件，支持的入参不同，请查阅对应插件的 README 或者文档
        "inputs": {
          "buildCommand": "npm run build",
          "outputPath": "dist",
          "cloudPath": "/vue"
        }
      },
      "server": {
        "use": "@cloudbase/framework-plugin-function",
        "inputs": {
          "functionRootPath": "cloudfunctions",
          "functions": [{
            "name": "vue-echo"
          }]
        }
      }
    }
  }
}
```

2. 生命周期

> 配置在构建部署生命周期前后，需要执行的自定义动作

```js
{
  "framework": {
    "hooks": {
       // 前置钩子，在执行 Framework 完整的构建部署动作之前执行的钩子，可以执行一些命令行命令
      "preDeploy": {
        // 前置钩子的类型，目前仅支持 execCommand，表示执行命令行命令
        "type": "execCommand",
        "commands": [// 要执行的 command 命令列表
          "sudo npm install -g lerna",
          "lerna bootstrap"
        ]
      },
      //后置钩子，在执行 Framework 部署之后，在云端调用的钩子，可以调用一些云函数
      "postDeploy": {
        // 后置钩子钩子的类型，目前仅支持 callFunction 代表在云端执行云函数
        "type": "callFunction",
        "functions":[ // 要调用的云函数列表，支持数组，例如
          {
            "functionName": "echo", // 调用的云函数的函数名
            "params": { // 调用云函数的参数信息
              "foo": "bar"
            }
          }
        ]
      }
    }
  }
}
```

3. 应用依赖

> 在云端一键部署场景下，您需要完善应用依赖配置来声明应用依赖的扩展资源和环境变量参数

```js
  "framework": {
    // 描述项目通过控制台一键安装部署时依赖的其他资源信息、环境变量等业务参数。
    "requirement": {
        // 应用部署过程中用到的外部云上资源，包括 cfs、cynosdb、redis 等
      "addons": [
        {
          "type": "CynosDB",// 资源类型，目前支持 CFS 和 CynosDB
          "name": "wordpress",// 资源名称，只支持 a-z 0-9 和 -
          "envMap": {// 环境变量映射文件，会将云资源产生的 IP 、PORT 通过右侧定义的名称来映射为对应的环境变量名称，并注入环境变
            "IP": "WORDPRESS-IP",
            "PORT": "WORDPRESS-PORT",
            "USERNAME": "WORDPRESS-USERNAME",
            "PASSWORD": "WORDPRESS-PASSWORD"
          }
        }
      ],
      // 应用在构建时和运行时的环境变量配置声明，默认注入计算环境中(云函数、云应用)，也会在云端构建时作为构建部署的环境变量，可以在 cloudbaserc.json 中通过 {{env.ENV_NAME}}引用
      "environment": {
        "SECRET_TOKEN": {
            // 环境变量描述，会在输入时进行提示
          "description": "A secret key for verifying the integrity of signed cookies.",
          "required": true, //是否必填
          "default": "default_value",
          "validation": {// 校验规则配置
            "rule": {//校验规则信息
              "type": "RegExp",//校验规则类型，目前支持"RegExp" 代表正则类型
              "pattern": "[3-9]",//正则的 Pattern
              "flag": "g"//正则的 Flag
            },
            "errorMessage": "数值范围3-9"//校验失败时的错误信息
          }
        }
      }
    }
  }
}
```

4. 模板变量

配置文件支持动态变量的特性。在 `cloudbaserc.json` 中声明 `"version": "2.0"` 即可启用。

> 动态变量特性允许`cloudbaserc.json` 配置文件中使用动态变量，从环境变量中获取动态的数据。使用`{}`包围的值定义为动态变量，可以引用数据源中的值。例如`{env.ENV_ID}:

- 第一步：在项目根目录下创建 `cloudbaserc.json` 和 `.env` 文件

```
.
├─cloudbaserc.json
├─.env
```

- 第二步：在 .env 文件内添加变量

```
ENV_ID=pro-123
DB_NAME=pro_user
```
- 第三步：在 `cloudbaserc.json` 文件内通过 `env` 注入模板变量

```js
{
  "version": "2.0",
  "envId": "{{env.ENV_ID}}",
  "framework": {
    "name": "node-capp",
    "plugins": {
      "node": {
        "use": "@cloudbase/framework-plugin-node",
        "inputs": {
          "name": "node-capp",
          "path": "/node-capp",
          "platform": "container",
          "containerOptions": {
            "envVariables": {
              "env": "{{env.ENV_ID}}",
              "db": "{{env.DB_NAME}}"
            }
          }
        }
      }
    }
  }
}
```

- 第四步：一键部署应用

```
tcb framework deploy
```

5. 模式切换

假设你已经完成了以上模板变量的配置

- 第一步：在项目根目录额外添加 `.env.dev` 文件

```
.
├─cloudbaserc.json
├─.env
├─.env.dev
```

- 第二步：在 `.env.dev` 文件添加变量

```
ENV_ID=dev-123
DB_NAME=dev_user
```

- 第三步：部署应用时使用 --mode 指定模式

```
cloudbase framework deploy --mode dev
```

**完整示例**

```js
// https://docs.cloudbase.net/framework/config
{
  "version": "2.0",
  "envId": "{{env.ENV_ID}}",
  "$schema": "https://framework-1258016615.tcloudbaseapp.com/schema/latest.json",
  "framework": {
    "plugins": {
      "admin": {
        "use": "@cloudbase/framework-plugin-website",
        "inputs": {
          "outputPath": "./packages/admin/dist",
          "installCommand": "echo \"Skip Install\"",
          "buildCommand": "npm run build",
          "cloudPath": "{{env.deployPath}}"
        }
      },
      "init": {
        "use": "@cloudbase/framework-plugin-function",
        "inputs": {
          "functionRootPath": "./packages",
          "functions": [
            {
              "name": "cms-init",
              "timeout": 60,
              "envVariables": {
                "CMS_ADMIN_USER_NAME": "{{env.administratorName}}",
                "CMS_ADMIN_PASS_WORD": "{{env.administratorPassword}}",
                "CMS_OPERATOR_USER_NAME": "{{env.operatorName}}",
                "CMS_OPERATOR_PASS_WORD": "{{env.operatorPassword}}",
                "CMS_DEPLOY_PATH": "{{env.deployPath}}",
                "ACCESS_DOMAIN": "{{env.accessDomain}}"
              },
              "installDependency": true,
              "handler": "index.main"
            }
          ]
        }
      },
      "service": {
        "use": "@cloudbase/framework-plugin-node",
        "inputs": {
          "name": "tcb-ext-cms-service",
          "entry": "app.js",
          "projectPath": "./packages/service",
          "path": "/tcb-ext-cms-service",
          "functionOptions": {
            "timeout": 15,
            "envVariables": {
              "NODE_ENV": "production"
            }
          }
        }
      },
      "db": {
        "use": "@cloudbase/framework-plugin-database",
        "inputs": {
          "collections": [
            {
              "collectionName": "tcb-ext-cms-projects",
              "description": "CMS 系统项目数据（请不要手动修改）",
              "aclTag": "ADMINONLY"
            },
            {
              "collectionName": "tcb-ext-cms-schemas",
              "description": "CMS 系统内容模型数据（请不需要手动修改）",
              "aclTag": "ADMINONLY"
            },
            {
              "collectionName": "tcb-ext-cms-users",
              "description": "CMS 系统系统用户数据，存储 CMS 的用户信息，包括管理员账号信息，角色信息等（请不要手动修改）",
              "aclTag": "ADMINONLY"
            },
            {
              "collectionName": "tcb-ext-cms-webhooks",
              "description": "CMS 系统系统 webhook 集合，存储 CMS 系统的回调接口配置，CMS 系统数据的变更可以通过回调来进行同步 （请不要手动修改）",
              "aclTag": "ADMINONLY"
            },
            {
              "collectionName": "tcb-ext-cms-settings",
              "description": "CMS 系统系统配置集合，存储 CMS 系统的设置（请不要手动修改）",
              "aclTag": "ADMINONLY"
            },
            {
              "collectionName": "tcb-ext-cms-user-roles",
              "description": "CMS 系统系统用户角色配置集合，存储 CMS 系统的自定义用户角色信息（请不要手动修改）",
              "aclTag": "ADMINONLY"
            }
          ]
        }
      }
    },
    "requirement": {
      "addons": [],
      "environment": {
        "administratorName": {
          "description": "管理员账户名，账号名长度需要大于 4 位，支持字母和数字",
          "required": true,
          "default": "admin",
          "validation": {
            "rule": {
              "type": "RegExp",
              "pattern": "[^[a-zA-Z0-9]+[a-zA-Z0-9_-]?[a-zA-Z0-9]+$]",
              "flag": "g"
            },
            "errorMessage": "字母和数字的组合，不能为纯数字，长度范围是 1 ~ 32"
          }
        }
      }
    }
  }
}
```

**其他项目配置文件示例**

```js
// https://docs.cloudbase.net/framework/config
{
  "version": "2.0",
  "envId": "{{env.ENV_ID}}",
  "$schema": "https://framework-1258016615.tcloudbaseapp.com/schema/latest.json",
  "framework": {
    "plugins": {
      "admin": {
        "use": "@cloudbase/framework-plugin-website",
        "inputs": {
          "outputPath": "./packages/admin/dist",
          "installCommand": "echo \"Skip Install\"",
          "buildCommand": "npm run build",
          "cloudPath": "{{env.deployPath}}"
        }
      },
      "init": {
        "use": "@cloudbase/framework-plugin-function",
        "inputs": {
          "functionRootPath": "./packages",
          "functions": [
            {
              "name": "cms-init",
              "timeout": 60,
              "envVariables": {
                "CMS_ADMIN_USER_NAME": "{{env.administratorName}}",
                "CMS_ADMIN_PASS_WORD": "{{env.administratorPassword}}",
                "CMS_OPERATOR_USER_NAME": "{{env.operatorName}}",
                "CMS_OPERATOR_PASS_WORD": "{{env.operatorPassword}}",
                "CMS_DEPLOY_PATH": "{{env.deployPath}}",
                "ACCESS_DOMAIN": "{{env.accessDomain}}"
              },
              "installDependency": true,
              "handler": "index.main"
            }
          ]
        }
      },
      "service": {
        "use": "@cloudbase/framework-plugin-node",
        "inputs": {
          "name": "tcb-ext-cms-service",
          "entry": "app.js",
          "projectPath": "./packages/service",
          "path": "/tcb-ext-cms-service",
          "functionOptions": {
            "timeout": 15,
            "envVariables": {
              "NODE_ENV": "production"
            }
          }
        }
      },
      "db": {
        "use": "@cloudbase/framework-plugin-database",
        "inputs": {
          "collections": [
            {
              "collectionName": "tcb-ext-cms-projects",
              "description": "CMS 系统项目数据（请不要手动修改）",
              "aclTag": "ADMINONLY"
            },
            {
              "collectionName": "tcb-ext-cms-schemas",
              "description": "CMS 系统内容模型数据（请不需要手动修改）",
              "aclTag": "ADMINONLY"
            },
            {
              "collectionName": "tcb-ext-cms-users",
              "description": "CMS 系统系统用户数据，存储 CMS 的用户信息，包括管理员账号信息，角色信息等（请不要手动修改）",
              "aclTag": "ADMINONLY"
            },
            {
              "collectionName": "tcb-ext-cms-webhooks",
              "description": "CMS 系统系统 webhook 集合，存储 CMS 系统的回调接口配置，CMS 系统数据的变更可以通过回调来进行同步 （请不要手动修改）",
              "aclTag": "ADMINONLY"
            },
            {
              "collectionName": "tcb-ext-cms-settings",
              "description": "CMS 系统系统配置集合，存储 CMS 系统的设置（请不要手动修改）",
              "aclTag": "ADMINONLY"
            },
            {
              "collectionName": "tcb-ext-cms-user-roles",
              "description": "CMS 系统系统用户角色配置集合，存储 CMS 系统的自定义用户角色信息（请不要手动修改）",
              "aclTag": "ADMINONLY"
            }
          ]
        }
      }
    },
    "requirement": {
      "addons": [],
      "environment": {
        "administratorName": {
          "description": "管理员账户名，账号名长度需要大于 4 位，支持字母和数字",
          "required": true,
          "default": "admin",
          "validation": {
            "rule": {
              "type": "RegExp",
              "pattern": "[^[a-zA-Z0-9]+[a-zA-Z0-9_-]?[a-zA-Z0-9]+$]",
              "flag": "g"
            },
            "errorMessage": "字母和数字的组合，不能为纯数字，长度范围是 1 ~ 32"
          }
        }
      }
    }
  }
}
```

### 5.3 插件

插件可以处理应用中的一些独立单元的构建、部署、开发、调试等流程。例如 website 插件可以处理静态网站等单元，node 插件可以处理 koa 、express 等 node 应用。

插件的配置写在 cloudbaserc.json 文件中，具体请参考配置说明中的 插件配置可以手动填写，也可以自动生成。

**自动检测生成插件配置**

可以在项目目录下直接运行 `cloudbase` 命令进行自动检测生成插件配置文件并部署

```
cloudbase


✔ 是否使用云开发部署当前项目 <Projects/test/test-vue> ？ (Y/n) · true
✔ 选择关联环境 · webpage - [webpage:按量计费]
   ______ __                   __ ____
  / ____// /____   __  __ ____/ // __ ) ____ _ _____ ___
 / /    / // __ \ / / / // __  // __  |/ __ `// ___// _ \
/ /___ / // /_/ // /_/ // /_/ // /_/ // /_/ /(__  )/  __/
\_________\____/ \__,_/ \__,_//_____/ \__,_//____/ \___/       __
   / ____/_____ ____ _ ____ ___   ___  _      __ ____   _____ / /__
  / /_   / ___// __ `// __ `__ \ / _ \| | /| / // __ \ / ___// //_/
 / __/  / /   / /_/ // / / / / //  __/| |/ |/ // /_/ // /   / ,<
/_/    /_/    \__,_//_/ /_/ /_/ \___/ |__/|__/ \____//_/   /_/|_|


 CloudBase Framework  info     Version v1.2.10
 CloudBase Framework  info     Github: https://github.com/Tencent/cloudbase-framework

 CloudBase Framework  info     EnvId webpage
? 检测到当前项目包含 Vue.js 项目

  🔨 构建脚本 `npm run build`
  📦 本地静态文件目录 `dist`

  是否需要修改默认配置 No
? 请输入应用唯一标识(支持大小写字母数字及连字符, 同一账号下不能相同) test-vue
? 是否需要保存当前项目配置，保存配置之后下次不会再次询问 Yes
 CloudBase Framework  info     📦 install plugins
```

**手动填写插件配置**

```
{
  "framework": {
    "plugins": {
      "client": {
        "use": "@cloudbase/framework-plugin-website",
        "inputs": {
          "buildCommand": "npm run build",
          "outputPath": "dist",
          "cloudPath": "/vue"
        }
      },
      "server": {
        "use": "@cloudbase/framework-plugin-function",
        "inputs": {
          "functionRootPath": "cloudfunctions",
          "functions": [
            {
              "name": "vue-echo"
            }
          ]
        }
      }
    }
  }
}
```

**官方插件列表**

- [@cloudbase/framework-plugin-website 一键部署网站应用](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-website)
- [@cloudbase/framework-plugin-node 一键部署 Node 应用（支持底层部署为函数或者 云托管）](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-node)
- [@cloudbase/framework-plugin-nuxt 一键部署 Nuxt SSR 应用](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-nuxt)
- [@cloudbase/framework-plugin-function 一键部署函数资源](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-function)
- [@cloudbase/framework-plugin-container 一键部署云托管容器服务](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-container)
- [@cloudbase/framework-plugin-database 一键声明式部署云开发 NoSQL 云数据库](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-database)
- [@cloudbase/framework-plugin-deno 一键部署 Deno 应用](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-deno)
- [@cloudbase/framework-plugin-next 一键部署 Next SSR 应用](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-next)
- [@cloudbase/framework-plugin-mp 一键部署微信小程序应用](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-mp)
- [	@cloudbase/framework-plugin-auth 一键设置登录配置](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-auth)

> 常用插件介绍

#### 静态网站插件

> 云开发 CloudBase Framework 框架「Function」插件： 通过云开发 CloudBase Framework 框架将静态网站一键部署云开发环境，提供生产环境可用的 CDN 加速、自动弹性伸缩的高性能网站服务。可以搭配其他插件如 Node 插件、函数插件实现云端一体开发。

- 节约成本: 资源伸缩，弹性扩缩容，灵活计费，极大节约资源成本
- 极简配置：自动检测框架，无须配置，同时支持没有使用框架的纯静态项目
- 框架支持: 无缝支持原生和前端框架构建的项目
  - Vue
  - React
  - Next SPA
  - Nuxt SPA
  - VuePress


> 如果想全新开始一个项目，可以直接执行 init 来从模板开始一个网站项目

```
# 部署
cloudbase framework deploy
```

> cloudbase init 之后会创建云开发的配置文件 cloudbaserc.json，可在配置文件的 plugins 里修改和写入插件配置

```js
{
  "envId": "{{envId}}",
  "framework": {
    "plugins": {
      "client": {
        "use": "@cloudbase/framework-plugin-website",
        "inputs": {
          "installCommand": "npm install --prefer-offline --no-audit --progress=false",
          "buildCommand": "npm run build", // 构建命令，如npm run build，没有可不传
          "outputPath": "dist", // 网站静态文件的路径。
          "cloudPath": "/path", // 静态资源部署到云开发环境的路径，默认为根目录。
          "ignore": [".git", ".github", "node_modules", "cloudbaserc.js"] // 静态资源部署时忽略的文件路径，支持通配符
        }
      }
    }
  }
}
```

#### 云函数插件

**功能特性**

- 节约成本: 资源伸缩，弹性扩缩容，灵活计费，极大节约资源成本
- 极简配置：自动检测框架，无须配置
- 语言支持:
  - Node.JS
  - PHP
  - Java

```js
{
  "envId": "{{envId}}",
  "framework": {
    "plugins": {
      "function": {
        "use": "@cloudbase/framework-plugin-function",
        "inputs": {
            // 函数根目录
          "functionRootPath": "./cloudfunctions",
          "publishIncludeList": "{{env.publishIncludeList}}",
          // 云函数默认配置, 配置格式和单个函数配置格式相同
          "functionDefaultConfig": {
            "timeout": 5,
            "envVariables": {
              "FOO": "bar"
            },
            "runtime": "Nodejs10.15",
            "memorySize": 128
          },
          // 函数配置数组，每个函数的配置格式要求如下：
          "functions": [
            {
                // 云函数名称，即为函数部署后的名称
              "name": "helloworld",
              "envVariables": {// 包含环境变量的键值对对象
                "ABC": "xyz"
              }
            }
          ],
          // 服务路径配置
          "servicePaths": {
            "helloworld": "/helloworld"
          }
        }
      }
    }
  }
}
```

#### 登录鉴权插件

> 云开发 CloudBase Framework 框架「登录配置」插件： 通过云开发 CloudBase Framework 框架一键设置环境下的登录配置。

- 支持未登录、匿名登录登录设置
- 后续会支持开放平台、公众号、账号密码等其他登录方式配置

```js
// https://docs.cloudbase.net/framework/plugins/framework-plugin-auth
{
  "envId": "YOU_ENV_ID",
  "framework": {
    "plugins": {
      "auth": {
        "use": "@cloudbase/framework-plugin-auth",
        "inputs": {
          "configs": [
            {
              "platform": "NONLOGIN",
              "status": "ENABLE"
            }
          ]
        }
      }
    }
  }
}
```

#### 云数据库插件

> 云开发 CloudBase Framework 框架「Database」插件： 通过云开发 CloudBase Framework 框架一键配置云开发数据库集合、索引，使用高性能的 Serverless 化的 NoSQL 数据库服务。可以搭配其他插件如 Website 插件、Node 插件实现云端一体开发。

```js
// https://docs.cloudbase.net/framework/plugins/framework-plugin-database
{
  "envId": "{{envId}}",
  "framework": {
    "plugins": {
      "client": {
        "use": "@cloudbase/framework-plugin-database",
        "inputs": {
          "collections": [
            {
              "collectionName": "test-collection", //集合名称
              "description": "test", // 描述信息
            }
          ]
        }
      }
    }
  }
}
```

#### 微信小程序插件

> 云开发 CloudBase Framework 框架「小程序」插件： 通过云开发 CloudBase Framework 框架一键部署微信小程序应用。

```js
// https://docs.cloudbase.net/framework/plugins/framework-plugin-mp
{
  "envId": "{{envId}}",
  "framework": {
    "plugins": {
      "client": {
        "use": "@cloudbase/framework-plugin-mp",
        "inputs": {
          "appid": "",//必填，小程序应用的 appid
          //选填，小程序应用的部署私钥内容，需要经过 base64 编码 可以使用 小程序部署密钥转换小工具 来转换为 Base64
          // https://framework-1258016615.tcloudbaseapp.com/mp-key-tool/
          "privateKeyPath": "",
          "localPath": "./",
          "ignores": ["node_modules/**/*"],
          "deployMode": "preview",
          "previewOptions": {
            "desc": "CloudBase Framework 一键预览",
            "setting": {
              "es6": true
            },
            "qrcodeOutputPath": "./qrcode.jpg",
            "pagePath": "pages/index/index"
          }
        }
      }
    }
  }
}
```

> 默认模板的 appid 和 privateKeyPath 为空，需要开发者填入

#### Node 插件

> 云开发 CloudBase Framework 框架「Node.js App」插件： 通过云开发 CloudBase Framework 框架将 Node 应用一键部署云开发环境，提供自动弹性伸缩的高性能 Node 应用服务，支持底层部署为函数或者 云托管，可以搭配其他插件如 Website 插件、函数插件实现云端一体开发。

**功能特性**

- 无须关心底层架构: 只需要开发业务服务，不用适配函数或者容器
- 节约成本: 资源伸缩，弹性扩缩容，灵活计费，极大节约资源成本
- 框架支持: 无缝支持原生和前端框架构建的项目
  - 原生 Node.js
  - Express
  - Koa

如果目前已有 Node 应用项目

```
cloudbase
```

如果想全新开始一个项目，可以直接执行 init 来从模板开始一个项目

```
cloudbase init
```

```js
// https://docs.cloudbase.net/framework/plugins/framework-plugin-node
{
  "envId": "{{envId}}",
  "framework": {
    "plugins": {
      "server": {
        "use": "@cloudbase/framework-plugin-node",
        "inputs": {
        // 默认app.js
        // Node 服务入口文件，相对于projectPath,需要导出 app 或者 server 的实例，同时也支持导出异步获取 app 的 tcbGetApp 方法，方法的返回值为 app 或者 server 的实例。
          "entry": "app.js",
          "path": "/nodeapp", // 必填，访问子路径，如 /node-app
          "name": "nodeapp", // 必填，服务名，如node-app
          "projectPath": "", // 选填，指定 Node 服务所在目录，相对于当前项目根目录
          "buildCommand": "", // 选填，指定构建命令，比如npm run build
          "platform": "", // 选填，底层使用平台，支持 container（ 云托管） 和 function （云函数）, 默认是 function
          "containerOptions": {// 选填，当 platform 选择 container 时，可以支持自定义更多高级设置，例如 CPU 内存等
            "cpu": 2,
            "mem": 2,
          },
          "functionOptions": {
                "timeout": 5,
                "envVariables": {
                    "TEST_ENV": 1
                },
                "vpc": {
                    "vpcId": "xxx",
                    "subnetId": "xxx"
                }
            }
        }
      }
    }
  }
}
```

- `entry`

默认 `app.js`

> Node 服务入口文件，相对于projectPath,需要导出 app 或者 server 的实例，同时也支持导出异步获取 app 的 tcbGetApp 方法，方法的返回值为 app 或者 server 的实例。

如 koa 服务的 `app.js`

```js
const Koa = require('koa');
const { router } = require('./routes/');

const app = new Koa();

app.use(router.routes());

module.exports = app;
```

nest 服务的 `app.js`

```js
const express = require('express');
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { AppModule } = require('./dist/app.module');

const expressApp = express();
const adapter = new ExpressAdapter(expressApp);

exports.tcbGetApp = async () => {
  const app = await NestFactory.create(AppModule, adapter);
  await app.init();
  return expressApp;
};
```



#### 云托管容器插件

**功能特性**

- 节约成本: 资源伸缩，弹性扩缩容，灵活计费，极大节约资源成本
- 极简配置：自动检测框架，无须配置
- 语言支持和框架支持广泛
  - Node.JS
  - PHP
  - Java
  - Go
  - Dart
  - Deno


```js
// https://docs.cloudbase.net/framework/plugins/framework-plugin-container
{
  "envId": "{{envId}}",
  "framework": {
    "plugins": {
      "client": {
        "use": "@cloudbase/framework-plugin-container",
        "inputs": {
          "serviceName": "node-api", // 必填，服务名，字符串格式，如 node-api
          "servicePath": "/node-api",// 必填，服务路径配置, 字符串格式, 如 /node-api
          "localPath": "./" // 选填，本地代码文件夹相对于项目根目录的路径，默认值 ./
        }
      }
    }
  }
}
```

### 5.4 一键部署按钮制作

> 参考 https://docs.cloudbase.net/framework/deploy-button

### 5.5 云开发部署应用演示

> 云开发部署模板参考：https://github.com/TencentCloudBase/cloudbase-templates

#### 云开发部署Egg

> node插件文档 https://docs.cloudbase.net/framework/plugins/framework-plugin-node

```
# 初始化egg项目
tcb new egg-demo
```

![](https://s.poetries.work/uploads/2022/06/627d5a83ca20f2ae.png)

**编写cloudbaserc.json**

```js
{
  "version": "2.0",
  "envId": "test-xx",
  "$schema": "https://framework-1258016615.tcloudbaseapp.com/schema/latest.json",
  "framework": {
    "name": "egg-starter",
    "plugins": {
      "node": {
        "use": "@cloudbase/framework-plugin-node",
        "inputs": {
          "entry": "app.js",
          "name": "egg-starter",
          "path": "/egg-starter"
        }
      }
    }
  },
  "functionRoot": "./functions",
  "functions": [],
  "region": "ap-guangzhou"
}
```

添加启动入口文件

```js
'use strict';

const { Application } = require('egg');

exports.tcbGetApp = () => {
  return new Application({
    env: 'prod',
  });
};
```

部署

```
tcb framework deploy
```

![](https://s.poetries.work/uploads/2022/06/2f3e27804bd7105b.png)
![](https://s.poetries.work/uploads/2022/06/c2500d4d92e0da5e.png)


#### 云开发部署Koa

> node插件文档 https://docs.cloudbase.net/framework/plugins/framework-plugin-node

```
# 初始化koa项目
tcb new koa-demo
```

**编写cloudbaserc.json**

```js
{
  "version": "2.0",
  "envId": "test-xxx",
  "framework": {
    "name": "koa-starter",
    "plugins": {
      "node": {
        "use": "@cloudbase/framework-plugin-node",
        "inputs": {
          "name": "koa-starter",
          "path": "/koa-starter"
        }
      }
    }
  },
  "functionRoot": "./functions",
  "functions": [],
  "region": "ap-guangzhou"
}
```

> 修改`app.js`，导出 `module.exports = app`

部署

```
tcb framework deploy
```

![](https://s.poetries.work/uploads/2022/06/e287aea2c9821cc4.png)
![](https://s.poetries.work/uploads/2022/06/966fc0e7f631cba5.png)

#### 云开发部署React

```
# 初始化react项目
tcb new react-demo
```

**编写cloudbaserc.json**

```js
{
  "version": "2.0",
  "envId": "test-xx",
  "$schema": "https://framework-1258016615.tcloudbaseapp.com/schema/latest.json",
  "functionRoot": "cloudfunctions", // 云函数目录
  "framework": {
    "name": "react-starter",
    "plugins": {
      "client": {
        // 插件文档 https://docs.cloudbase.net/framework/plugins/framework-plugin-website
        "use": "@cloudbase/framework-plugin-website",
        "inputs": {
          "buildCommand": "npm run build",
          "outputPath": "build",
          "cloudPath": "/react-starter", // 当前静态托管的 /react-starter 目录下
          "envVariables": {
            "REACT_APP_ENV_ID": "{{env.ENV_ID}}"
          }
        }
      },
      "server": {
        "use": "@cloudbase/framework-plugin-function",
        "inputs": {
          "functionRootPath": "cloudfunctions",
          "functions": [
            {
              "name": "helloworld",
              "timeout": 5,
              "envVariables": {},
              "runtime": "Nodejs10.15",
              "memory": 256,
              "aclRule": {
                "invoke": true
              }
            }
          ]
        }
      },
      "auth": {
        "use": "@cloudbase/framework-plugin-auth",
        "inputs": {
          "configs": [
            {
              "platform": "NONLOGIN",
              "status": "ENABLE"
            }
          ]
        }
      }
    }
  },
  "functions": [],
  "region": "ap-guangzhou"
}
```

部署

```
tcb framework deploy
```

![](https://s.poetries.work/uploads/2022/06/50d7e5c2d8654dff.png)
![](https://s.poetries.work/uploads/2022/06/ad02ca3fac62bdec.png)

#### 云开发部署Vue

```
# 初始化vue项目
tcb new vue-demo
```

![](https://s.poetries.work/uploads/2022/06/4af41bcbd091b686.png)

**编写cloudbaserc.json**

```js
{
    "envId": "test-xx",
    "version": "2.0",
    "$schema": "https://framework-1258016615.tcloudbaseapp.com/schema/latest.json",
    "functionRoot": "./functions",
    "functions": [],
    "region": "ap-guangzhou", // 默认是ap-shanghai
    "framework": {
        "name": "vue-hello-world",
        "plugins": {
            "vue": {
                // 插件文档 https://docs.cloudbase.net/framework/plugins/framework-plugin-website
                "use": "@cloudbase/framework-plugin-website",
                "inputs": {
                    "buildCommand": "npm run build",
                    "outputPath": "dist"
                }
            }
        }
    }
}
```

部署

```
tcb framework deploy
```

![](https://s.poetries.work/uploads/2022/06/c34f69c797a05e2b.png)
![](https://s.poetries.work/uploads/2022/06/569a41e7e44d4911.png)

#### 部署hexo

```
# 初始化hexo项目
tcb new hexo-demo
```

**编写cloudbaserc.json**

```js
{
    "envId": "poetry-xx",
    "version": "2.0",
    "$schema": "https://framework-1258016615.tcloudbaseapp.com/schema/latest.json",
    "functionRoot": "./functions",
    "functions": [],
    "region": "ap-guangzhou", // 默认是ap-shanghai
    "framework": {
        "name": "hexo-hello-world",
        "plugins": {
            "hexo": {
                // 插件文档 https://docs.cloudbase.net/framework/plugins/framework-plugin-website
                "use": "@cloudbase/framework-plugin-website",
                "inputs": {
                    "buildCommand": "npx hexo generate",
                    "outputPath": "./public"
                }
            }
        }
    }
}

```

部署

```
tcb framework deploy
```

![](https://s.poetries.work/uploads/2022/06/fb0f146a969d6506.png)
![](https://s.poetries.work/uploads/2022/06/f09f236c850cdbc6.png)

## 六、使用云开发部署web应用

### 6.1 部署hexo

**使用 hexo 命令行初始化一个项目**

```
npx hexo init hexo-hello-world
```

**部署项目**

```bash
# tcb env list 查看环境列表

# 部署
cloudbase framework deploy -e <your-env-id>
```

![](https://s.poetries.work/uploads/2022/06/8a0f9b7b169f862a.png)
![](https://s.poetries.work/uploads/2022/06/2e99b96c91ea6bf4.png)


### 6.2 部署Vue

**初始化项目**

```
npx vue create vue-hello-world
```

**发布项目**

```
# tcb env list 查看环境列表

# 部署
tcb framework deploy -e <your-env-id>
```

![](https://s.poetries.work/uploads/2022/06/bc8ba28de42ff604.png)

## 七、在云开发中使用NoSQL数据库

> 在面板上创建一个`NoSQL`的数据库，[参考地址](https://docs.cloudbase.net/database/introduce)

![](https://s.poetries.work/uploads/2022/06/fd5954cd15c3e0e9.png)

> 在项目中安装连接数据库的`SDK`[参考文档](https://docs.cloudbase.net/api-reference/server/node-sdk/introduction)


```
npm install @cloudbase/node-sdk
```

> 初始化数据库连接[参考地址](https://docs.cloudbase.net/api-reference/server/node-sdk/initialization)

```js
import cloudbase from '@cloudbase/node-sdk';

// 注意以下几个参数是必填的,文档上说的是非必填
const app = cloudbase.init({
    secretId: 'xx',
    secretKey: 'yy',
    env: 'xx',
    // 根据你创建的区域来写,目前只有上海(ap-shanghai)、广州(ap-guangzhou)
    region: 'ap-shanghai'
})

// 1. 获取数据库引用
const db = app.database();
```

`env`的获取地址

![](https://s.poetries.work/uploads/2022/06/45dad89cf73176e3.png)

`secretId` 和`secretKey`获取：https://console.cloud.tencent.com/cam/capi

![](https://s.poetries.work/uploads/2022/06/8cab74708230b661.png)

## 八、在VS Code中使用Toolkit管理云开发项目 

### 8.1 基本使用介绍

> Tencent CloudBase Toolkit 是腾讯云 - 云开发发布的 VS Code（Visual Studio Code）插件。该插件可以让您更好地在本地进行云开发项目开发和代码调试，并且轻松将项目部署到云端。

**通过 Tencent CloudBase Toolkit 插件，您可以：**

- 在本地快速创建云开发项目
- 从多种模板快速创建云函数
- 同步云端的云函数列表，并下载函数代码到本地
- 部署云函数到云端，并进行云端安装依赖
- 对云函数进行管理，如删除云函数、查看云函数详细信息
- 增量更新云函数文件
- 删除云端的云函数文件
- 部署静态托管文件到云端

同时，VS Code 插件也支持了云函数本地调试与云端调试，帮助你快速定位代码问题

![](https://s.poetries.work/uploads/2022/06/b09bcd56a8afaba5.png)


**登录**

![](https://s.poetries.work/uploads/2022/06/79fedf80af936261.png)
![](https://s.poetries.work/uploads/2022/06/d64d37ed50ab8a11.png)

**创建新项目**

![](https://s.poetries.work/uploads/2022/06/8398b4d1b46da096.png)

> **注意**：`CloudBase Toolkit` 插件依赖于 `cloudbaserc.json` 配置文件，`只有当前项目的根目录下存在 cloudbaserc.json 配置文件时`，才能使用 `CloudBase Toolkit` 插件进行相关操作。

如果您还没有云开发项目，可以使用初始化操作创建一个全新的云开发项目，CloudBase Toolkit 提供了部分模板项目供选择。

> `打开一个空的文件夹作为根目录`，点击侧边栏的云开发图标，点击下图示例中的条目

- 选择地区

![](https://s.poetries.work/uploads/2022/06/6e62d9caf3ead536.png)

- 选择地区关联的环境ID

![](https://s.poetries.work/uploads/2022/06/c0077a6f7d345269.png)

- 选择对应的模板

![](https://s.poetries.work/uploads/2022/06/2fe16d3cb23b86fe.png)

- 项目创建成功

![](https://s.poetries.work/uploads/2022/06/c274c86297e0037e.png)

- 项目目录结构

![](https://s.poetries.work/uploads/2022/06/d0ea2cb4f67df0a8.png)

> VS Code 插件会默认使用当前窗口打开文件夹的根目录下的 `cloudbaserc.json` 配置文件，如果你使用了 VS Code 工作区，则会使用工作区中的第一个项目文件夹根目录下的配置文件

关于 `cloudbaserc.json` [配置文件的详情可以参考这里 🔗](https://docs.cloudbase.net/cli-v1/config)

- 以上操作可以使用`tcb framework deploy`一键部署

```
# 函数和静态网站一起部署
tcb framework deploy
```

![](https://s.poetries.work/uploads/2022/06/7841d0aab3b6def2.png)

### 8.2 云函数操作

> 对云函数进行`部署/删除/下载`代码等操作时，`必须选中云函数文件夹`，否则会因为无法解析到准确的函数名称，而导致操作失败。

右键选中函数文件夹，点击部署云函数即可。CloudBase Toolkit 支持同时选择多个云函数进行部署。

**CloudBase Toolkit 支持两种部署云函数的方式：**

- 部署云函数（上传全部文件）：即将函数目录下的所有文件上传，也包含 `node_modules` 目录
- 部署云函数（云端安装依赖）：只部署代码文件，会忽略 `node_modules` 目录，云函数会自动在线安装依赖

![](https://s.poetries.work/uploads/2022/06/7164c1d025fed2f2.png)
![](https://s.poetries.work/uploads/2022/06/f6436c7624819c45.png)
![](https://s.poetries.work/uploads/2022/06/27161771a757fa8c.png)

- 查看函数配置信息

![](https://s.poetries.work/uploads/2022/06/75030965e7dc604d.png)

**下载函数代码**

使用下载函数代码功能，可以将云端函数代码下载到本地，进行操作时，需要选择云函数名称对应的目录。CloudBase Toolkit 支持同时选择多个云函数，下载云函数代码。

![](https://s.poetries.work/uploads/2022/06/715c72c283832c56.png)

**增量更新**

CloudBase Toolkit 支持上传单个文件或文件夹到云函数中，而无需重新上传整个云函数

![](https://s.poetries.work/uploads/2022/06/b474aafabd470e8e.png)

### 8.3 静态网站

> CloudBase Toolkit 支持上传文件/文件夹到静态网站存储中，同时支持文件多选，既可以同时选择多个文件上传。

CloudBase Toolkit 提供了两种上传方法：

- 上传到静态托管：需要输入云端存放文件（夹）的文件夹路径，选中的文件（夹）将被上传到此路径下。
- 上传到静态托管（根目录）：选中的文件（夹）将被直接上传到根目录下

![](https://s.poetries.work/uploads/2022/06/5fda60ae03e5f96c.png)

## 九、cloudBase之CMS内容管理系统

> - 文档：https://docs.cloudbase.net/cms/intro
> - Github：https://github.com/TencentCloudBase/cloudbase-extension-cms

- CloudBase CMS 是云开发推出的，基于 Node.js 的 Headless 内容管理平台，提供了丰富的内容管理功能。CloudBase CMS 基于模型配置，动态生成内容管理界面，无须编写代码即可使用，快速管理云开发中的业务数据。支持字符串、数字、多媒体、图片、文件、富文本、Markdown、关联类型等数十种内容类型的可视化编辑。
- CloudBase CMS 已在腾讯云扩展应用、小程序开发者工具中上线，支持一键安装到已有的环境中，管理小程序 / Web 等多端产生的内容数据。
- 同时，CloudBase CMS 已经在 GitHub 开源，可以直接在 CloudBase CMS 上进行二次开发，满足业务的多样化需求。

> 使用 CMS 扩展时将在当前环境创建云函数、云数据库等资源

工作原理

![](https://s.poetries.work/uploads/2022/06/eb1db5b08062b46c.png)

### 9.1 控制台部署CMS

> 环境需要使用按量付费

![](https://s.poetries.work/uploads/2022/06/f475b1efc04f182a.png)
![](https://s.poetries.work/uploads/2022/06/fa0e23cb97283134.png)

安装完成可以看到已经部署好的云函数、静态资源、云数据库

![](https://s.poetries.work/uploads/2022/06/0078ed499a50ee78.png)
![](https://s.poetries.work/uploads/2022/06/ae2ae82d69b699f2.png)
![](https://s.poetries.work/uploads/2022/06/eb3ef08b8ab0bc95.png)

登录部署的CMS界面操作演示

![](https://s.poetries.work/uploads/2022/06/b00248881e212a34.png)
![](https://s.poetries.work/uploads/2022/06/1ff5d829ce888659.png)

![](https://s.poetries.work/uploads/2022/06/a4850b81e9666030.png)
![](https://s.poetries.work/uploads/2022/06/5f57eee40dfb7381.png)
![](https://s.poetries.work/uploads/2022/06/f298c715b04eaf35.png)
![](https://s.poetries.work/uploads/2022/06/87fbb479196de69b.png)

### 9.2 如有二次修改，我们可以使用源码方式部署

> - 源码部署方式 https://docs.cloudbase.net/cms/install/source
> - 二次开发 https://docs.cloudbase.net/cms/reference/dev

- 安装 `npm install -g @cloudbase/cli@latest`
- [开通云开发服务，并创建按量计费环境](https://console.cloud.tencent.com/tcb/env/index?from=cli&source=cloudbase-cms&action=CreateEnv)

#### 项目结构

> 下面是基本的目录结构，采用了 Monorepo 的组织规范，并使用 lerna 进行管理

- `admin`： 前端管理界面
- `cms-api`：`RESTful API` 服务
- `cms-init`：CMS 部署初始化相关脚本
- `service`：后端服务，提供系统管理相关的服务

```
.
├── build
├── community
├── packages
│   ├── admin
│   │   ├── config
│   │   ├── dist
│   │   ├── public
│   │   ├── src
│   │   │   ├── assets
│   │   │   ├── common
│   │   │   ├── components
│   │   │   ├── layout
│   │   │   ├── locales
│   │   │   ├── models
│   │   │   ├── pages
│   │   │   ├── services
│   │   │   └── utils
│   │   └── typings
│   ├── cms-api
│   │   ├── dist
│   │   ├── src
│   │   │   ├── api
│   │   │   ├── common
│   │   │   ├── guards
│   │   │   ├── interceptors
│   │   │   ├── middlewares
│   │   │   ├── services
│   │   │   └── utils
│   │   └── typings
│   ├── cms-init
│   └── service
│       ├── dist
│       ├── src
│       │   ├── common
│       │   ├── config
│       │   ├── decorators
│       │   ├── guards
│       │   ├── interceptors
│       │   ├── middlewares
│       │   ├── modules
│       │   │   ├── auth
│       │   │   ├── file
│       │   │   ├── projects
│       │   │   ├── role
│       │   │   ├── setting
│       │   │   └── user
│       │   ├── services
│       │   └── utils
│       └── typings
└── scripts
```

#### 配置

> 复制项目根目录下的 `.env.example` 为 `.env.local`，并填写相关的配置

```bash
# 您的云开发环境 Id
TCB_ENVID=envId
# 管理员账户名，账号名长度需要大于 4 位，支持字母和数字
administratorName=admin
# 管理员账号密码，8~32位，密码支持字母、数字、字符、不能由纯字母或存数字组成
administratorPassword=123456
# CMS 控制台路径，如 /tcb-cms/，建议使用根路径 /
deployPath=/
# 云接入自定义域名（选填），如 tencent.com
accessDomain=
TENCENTCLOUD_REGION=ap-guangzhou # 环境ID所在的地区
```

#### 安装依赖

在项目根目录下运行下面的命令：

```
npm install && npm run setup
```

> 如果你使用 `npm run setup` 命令出现异常，你可以分别到 `packages` 目录下的文件内，手动执行 `npm install` 命令。

在项目根目录下运行下面的命令，会将 `CloudBase CMS` 的管理控制台部署到静态网站，Node 服务部署到云函数中

```
npm run deploy
```

![](https://s.poetries.work/uploads/2022/06/d937a67646160b02.png)
![](https://s.poetries.work/uploads/2022/06/39a38172b39daa80.png)

**控制台管理**

- 我的应用

![](https://s.poetries.work/uploads/2022/06/4f48480646204dd2.png)
![](https://s.poetries.work/uploads/2022/06/6742f2c96f05ad0e.png)

- 云托管服务

![](https://s.poetries.work/uploads/2022/06/ac2eddfa13237bd9.png)

> `tcb-ext-cms-servic`：该服务提供登录鉴权功能，用户在 CMS 管理界面通过通过用户名和密码来进行登录时，会通过 HTTP 来请求该函数；提供 API 接口功能，所有对内容的操作和管理都会经过此函数调用，内容操作会根据用户权限来进行数据库操作。

- 管理云函数

![](https://s.poetries.work/uploads/2022/06/107b9e3f346af8a5.png)

> - `tcb-ext-cms-init`：提供初始化应用功能，安装扩展后，会通过该函数来进行静态资源的部署和密码的生成和设置，修改账号密码或者部署路径等扩展参数都会再次执行该函数来进行更新
> - `tcb-ext-cms-api`：提供 `CMS RESTful API` 访问能力，所有 `RESTful API` 请求都会经过此函数调用

- 云存储，存放静态网站

![](https://s.poetries.work/uploads/2022/06/eaad8e647a753095.png)

> 存储图片、文件等 CMS 系统上传的文件。

- 云数据库

![](https://s.poetries.work/uploads/2022/06/4b866be7e0bf7cfe.png)

- `tcb-ext-cms-projects` 集合：CMS 系统项目数据
- `tcb-ext-cms-schemas` 集合：CMS 系统内容配置数据，CMS 所有的系统内容类型配置、字段配置等信息都存储在该集合内
- `tcb-ext-cms-users` 集合：CMS 系统用户数据，存储 CMS 的用户信息，包括管理员和运营者的账号信息，包括角色信息等
- `tcb-ext-cms-webhooks` 集合： CMS 系统 webhook 集合，存储 CMS 系统的回调接口配置，CMS 系统数据的变更可以通过回调来进行同步。
- `tcb-ext-cms-user-roles` 集合：CMS 系统用户角色配置集合，存储 CMS 系统的自定义用户角色信息
- `tcb-ext-cms-settings` 集合：CMS 系统配置集合，存储 CMS 系统的设置

#### 安装失败

> 请查看环境下云函数 `tcb-ext-cms-init` 的执行日志，获取失败原因。CloudBase CMS 安装时需要使用 `tcb-ext-cms-init` 函数执行初始化的工作，当出现异常时，会导致安装失败。

#### 本地开发

1. 复制根目录下的 `.env.example` 为 `.env.local`，并根据文件中的内容进行配置

```bash
# 您的云开发环境 Id
ENV_ID=envId
# 管理员账户名，账号名长度需要大于 4 位，支持字母和数字
administratorName=admin
# 管理员账号密码，8~32位，密码支持字母、数字、字符、不能由纯字母或存数字组成
administratorPassword=123456
# CMS 控制台路径，如 /tcb-cms/，建议使用根路径 /
deployPath=/
# 云接入自定义域名（选填），如 tencent.com
accessDomain=
TENCENTCLOUD_REGION=ap-guangzhou # 环境ID所在的地区
```

2. 复制 `packages/service/.env.example` 为 `packages/service/.env.local`，并根据文件中的内容进行配置

```bash
TCB_ENVID=test-xx # 环境ID
SECRETID=密钥ID # 密钥ID
SECRETKEY=密钥KEY # 密钥KEY
TENCENTCLOUD_REGION=ap-guangzhou # 环境ID所在的地区
```

3. 复制 `packages/admin/public/config.example.js` 为 `packages/admin/public/config.js`，并根据文件中的内容进行配置
 
```js
window.TcbCmsConfig = {
  // 可用区，默认上海，可选：ap-shanghai 或 ap-guangzhou
  region: "ap-guangzhou",
  // 路由方式：hash 或 browser
  history: "hash",
  // 环境 Id
  envId: "test-9g9512mccb349a321275b",
  // 禁用通知
  disableNotice: false,
  // 禁用帮助按钮
  disableHelpButton: false,
  // 云接入默认域名/自定义域名 + 云接入路径，不带 https 协议符
  // https://console.cloud.tencent.com/tcb/env/access
  // 环境id+API密钥中的appid（https://console.cloud.tencent.com/cam/capi）
  // API密钥中的appid：1258157827
  cloudAccessPath: 'test-9g9512mccb349a321275b-1258157827.service.tcloudbase.com/tcb-ext-cms-service',
};
```

4. 添加安全域名，否则本地开发会报跨域错误

![](https://s.poetries.work/uploads/2022/06/c9c7dc7c0ebba705.png)
![](https://s.poetries.work/uploads/2022/06/c15711674e3c175d.png)

**安装依赖**

```
# 安装 lerna 依赖
npm install
# 安装 package 依赖
npm run setup
```

**初始部署**

通过部署动作，触发初始化操作

```
npm run deploy
```

**启动开发**

运行下面的命令，成功后，可以访问 `http://localhost:8000/` 打开 CMS 管理界面

```
cd packages/admin && npm run dev
cd packages/service && npm run dev
```

![](https://s.poetries.work/uploads/2022/06/17ff255d213e43ac.png)

#### 微应用开发

**1. vue微应用接入**

> 接入文档 https://docs.cloudbase.net/cms/microapp/dev

```bash
# 新建 Vue 微应用项目
tcb new vue-app cms-microapp-vue
```

- 打包vue应用`npm run build`

![](https://s.poetries.work/uploads/2022/06/065be64fc55c529a.png)

- 上传微应用

![](https://s.poetries.work/uploads/2022/06/ea112b0d249492c2.png)

新建

![](https://s.poetries.work/uploads/2022/06/8c672f52136b621a.png)

![](https://s.poetries.work/uploads/2022/06/710cbc17f21b8d93.png)

> 上传成功后，可以在管理后台中查看

![](https://s.poetries.work/uploads/2022/06/534042fe753270f5.png)

- 自定义菜单展示微应用

![](https://s.poetries.work/uploads/2022/06/44a89633db979007.png)

- 设置后，在关联的项目中可见

![](https://s.poetries.work/uploads/2022/06/48a0980a8ea7075a.png)

**2. react微应用接入**

> 接入文档 https://docs.cloudbase.net/cms/microapp/dev

```bash
# 新建 React 微应用项目
tcb new react-app cms-microapp-react
```


#### Resful API 形式访问

> 文档 https://docs.cloudbase.net/cms/usage/restful/intro

**在系统设置中开启API访问**

![](https://s.poetries.work/uploads/2022/06/359d527fd134c1a3.png)

![](https://s.poetries.work/uploads/2022/06/a066957524d06f9d.png)

**在项目设置中的 API 访问 Tab 设置允许通过 RESTful API 访问**

![](https://s.poetries.work/uploads/2022/06/19a698c8050fa3eb.png)

然后复制访问连接，在postman中访问查看效果

![](https://s.poetries.work/uploads/2022/06/3fefbba31221042c.png)

**API鉴权访问**

在系统设置中开启API鉴权访问，并创建token

![](https://s.poetries.work/uploads/2022/06/26f7c1f886045461.png)

提示需要接口授权才可以访问

![](https://s.poetries.work/uploads/2022/06/33b9b9370a87a245.png)

在请求头加入创建好的token即可

> 当使用 API Token 调用 RESTful API 时，需要在 HTTP 请求 `Header` 中添加下面的配置

```
Authorization: Bearer API_TOKEN
```

`API_Token` 为在系统设置中生成的 `Token`，`Bearer` 为固有字段，两者通过空格连接。

![](https://s.poetries.work/uploads/2022/06/e083278e128641d0.png)

![](https://s.poetries.work/uploads/2022/06/2baff45a779d611a.png)

### 9.3 微信开发者工具部署

> 参考 https://docs.cloudbase.net/cms/install/mp

![](https://s.poetries.work/uploads/2022/06/4ba6ed3a0a6541da.png)
![](https://s.poetries.work/uploads/2022/06/81875bb480c85e7d.png)

## 十、云开发部署腾讯微搭低代码

> 文档地址 https://docs.cloudbase.net/lowcode/introduce

控制台 https://console.cloud.tencent.com/lowcode/overview/index

## 十一、参考文档

### 参考文档

- [云开发 CloudBase 云原生一体化应用开发平台，快速构建小程序、Web、移动应用](https://cloudbase.net/)
- [云开发 CloudBase文档](https://docs.cloudbase.net/database/introduce)
- [云开发 CloudBase官方文档](https://cloud.tencent.com/document/product/876)
- [CloudBase CLI](https://docs.cloudbase.net/cli-v1/quick-start)
- [CloudBase SDK](https://cloud.tencent.com/document/product/876/46332)
- [CloudBase 应用中心拥有各类热门应用，以及大量的生产级项目模板，案例模板，开发者可以自由选择，并将项目一键部署到云开发](https://www.cloudbase.net/marketplace.html)
- [云开发 Tencent CloudBase Github Action 可以将 Github 项目自动部署到云开发环境](https://github.com/TencentCloudBase/cloudbase-action)
- [cloudbase-framework-github](https://github.com/Tencent/cloudbase-framework/tree/master/packages/framework-plugin-container)
- [Tencent CloudBase Github](https://github.com/TencentCloudBase)
- [cloudbaserc.json 配置文件](https://docs.cloudbase.net/cli-v1/config)
- [云开发 React UI 组件 是云开发官方维护的 UI 组件库，提供基于云开发封装的一系列能力，目前已支持统一登录能力](https://docs.cloudbase.net/cloudbase-ui/introduce)
- [云开发 Vue 插件是云开发官方维护的 Vue 插件，提供全局入口、Vue 逻辑组件等功能](https://docs.cloudbase.net/cloudbase-vue/introduce)
- [Cloudbase Server Node.js SDK 让您可以在服务端（如腾讯云云函数或 云主机 等）使用 Node.js 服务访问 TCB 的的服务，如云函数调用，文件上传下载，数据库集合文档操作等，方便快速搭建应用](https://docs.cloudbase.net/api-reference/server/node-sdk/introduction)
- [@cloudbase/js-sdk 让您可以在 Web 端（如 PC Web 页面、微信公众平台 H5 等）使用 JavaScript 访问 Cloudbase 服务和资源](https://docs.cloudbase.net/api-reference/webv2/initialization)
- [CloudBase CMS 是云开发推出的，基于 Node.js 的 Headless 内容管理平台，提供了丰富的内容管理功能](https://docs.cloudbase.net/cms/intro)
- [云开发 Webify：专为 Web 开发者打造的应用托管平台，极速开发、部署、上线](https://webify.cloudbase.net/)
- [云开发工程模板示例，可通过 CloudBaseFramework 一键创建和部署](https://github.com/TencentCloudBase/cloudbase-templates)
- [微信小程序密钥工具](https://framework-1258016615.tcloudbaseapp.com/mp-key-tool/)

### 社区提问

- 「腾讯云·云开发」相关：[腾讯兔小巢](https://support.qq.com/products/148793) （云开发能力相关的首选这里）
- 「微信·云开发」相关：[微信开放社区](https://developers.weixin.qq.com/community/minihome/mixflow/1286298401038155776) （微信相关的都在这里问）
- 「微信·云托管」相关：[微信开放社区](https://developers.weixin.qq.com/community/minihome/mixflow/1919566493118201863) （云托管相关的都在这里问）
