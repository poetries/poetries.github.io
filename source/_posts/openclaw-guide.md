---
title: OpenClaw搭建24小时帮你干活的AI员工,支持本地/云服务并打通飞书/Telegram/Discord
date: 2026-03-04 16:30:00
description: 详细讲解如何在本地和云服务器上搭建OpenClaw AI助手平台，集成MiniMax M2.1模型，并配置飞书、Telegram、Discord多渠道接入，实现24小时帮你干活的虚拟AI团队。
tags:
  - OpenClaw
  - AI助手
  - MiniMax
  - 飞书机器人
  - Telegram
  - Discord
  - Agent
categories: 效率工具
---

## 内容总结

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- OpenClaw 平台的基本概念和核心优势
- 本地部署 OpenClaw 并集成 MiniMax M2.1 模型
- 打通飞书、Telegram、Discord 三大即时通讯渠道
- 配置多 Agent 团队，实现分工协作
- Skill 技能扩展使用方法
- 云服务器部署完整流程

---

## 导语

在 AI 时代，如何让 AI 真正成为你的工作助手？市面上有很多 AI 聊天工具，但它们都有一个共同的问题——无法真正帮你操作电脑、执行任务。

**OpenClaw**（原名 ClawdBot）是一个开源的个人 AI 助手平台，它能直接在你的设备上运行，通过多种渠道与你互动帮你完成实际工作。本文将详细介绍如何在本地和云端部署 OpenClaw，集成国产优秀的 MiniMax M2.1 大模型，并配置飞书、Telegram、Discord 等多渠道接入，最终搭建出一个24小时帮你干活的 AI 团队。

---

## 什么是 OpenClaw

OpenClaw（原名 ClawdBot）是一个开源的个人 AI 助手平台，运行在你自己的设备上。它支持通过 WhatsApp、Telegram、Slack、Discord、飞书、钉钉、QQ、企业微信等多个平台与你互动。

其特点包括：

- **本地优先**：运行在本地设备，数据完全由自己掌控
- **多平台支持**：支持 macOS、Linux、Windows（WSL2）
- **多通道连接**：可接入 WhatsApp、Telegram、Slack、Discord、飞书、钉钉、QQ、企业微信等
- **24⁄7 在线**：以后台服务形式持续运行
- **高度可定制**：支持技能扩展与自定义配置

[MiniMax](https://www.minimax.io) 是国内领先的 AI 大模型公司，其发布的 **M2.1** 系列模型在编程能力上表现出色，尤其擅长多语言编程、Web/App 开发、Agent 框架集成等场景。

本文将详细介绍如何在 **OpenClaw** 中集成 MiniMax 模型，让你的 AI 助手使用上这个强大的编程模型。

---

## 为什么选择 MiniMax？

MiniMax M2.1 是国产大模型中的性价比之选，特别适合日常开发和办公场景。

| 特性             | 说明                                                                         |
| ---------------- | ---------------------------------------------------------------------------- |
| **多语言编程**   | 全面支持 Rust、Java、Go、C++、Kotlin、Objective-C、TypeScript、JavaScript 等 |
| **Web/App 开发** | 显著提升移动端开发能力，设计美学表现优秀                                     |
| **高性价比**     | 输入成本仅 $0.15/M tokens，输出 $0.60/M tokens                               |
| **Agent 友好**   | 完美兼容 Claude Code、Cline、Kilo Code 等主流 AI 编程工具                    |
| **响应更简洁**   | 相比 M2 代，回答更简洁，token 消耗更低                                       |

> 💡 **小贴士**：MiniMax 还有一个 **Coding Plan**，通过 OAuth 认证可以更便捷地使用，而且有推荐链接可以享受 10% 折扣。

> 📝 **使用建议**：选择国产 MiniMax 可以有效节省 Token 费用，日常对话完全满足需求。如果需要深度编程处理复杂任务，建议还是选择国外的顶级大模型（如 Claude、GPT-4 等）。

---

## 本地部署 OpenClaw

### 第一步：全局安装 OpenClaw

```
npm i openclaw -g
```

进入初始化流程

```
openclaw onboard
```

![执行 onboard 命令启动初始化](https://s.poetries.top/uploads/2026/03/5b07c38e9c49ba41.png)

选择国产模型

![选择 MiniMax 国产模型](https://s.poetries.top/uploads/2026/03/6d0577d801e28895.png)

选择国内渠道

![选择国内渠道](https://s.poetries.top/uploads/2026/03/b4bc022333be19d8.png)

配置模型 API KEY

![填写 MiniMax API Key](https://s.poetries.top/uploads/2026/03/285ba810e676c13e.png)

配置 channel，暂时跳过

![暂时跳过 channel 配置](https://s.poetries.top/uploads/2026/03/03499a2a5fe52723.png)

重启服务

![重启 Gateway 服务](https://s.poetries.top/uploads/2026/03/dd37a585d04a1991.png)

![Gateway 重启成功](https://s.poetries.top/uploads/2026/03/ed22bd95a2994b7a.png)

打开网页聊天窗口

```
http://127.0.0.1:18789/chat
```

可以看到模型已经配置好，正常能对话

![网页端聊天验证](https://s.poetries.top/uploads/2026/03/847549ba069a9ff9.png)

> 📌 **常用命令**
>
> - 重启网关：`openclaw gateway restart`
> - 打开控制台：`openclaw dashboard`

---

## 配置 Channel

### 接入飞书机器人

#### 第一步：创建飞书应用

![在飞书开放平台创建应用](https://s.poetries.top/uploads/2026/03/80e58cc162aea35a.png)

先记录 App ID 和 App Secret 待会用到

![记录 App ID 和 Secret](https://s.poetries.top/uploads/2026/03/02a76ada35b33ef5.png)

#### 第二步：启用飞书插件

在 OpenClaw 中添加飞书 channel，使用 `openclaw plugins enable feishu` 开启 OpenClaw 内置的飞书插件（默认是 disable 状态，loaded 为开启）。

```bash
$ openclaw plugins enable feishu

🦞 OpenClaw 2026.3.1 (2a8ac97) — I'm the reason your shell history looks like a hacker-movie montage.

Config overwrite: /Users/poetry/.openclaw/openclaw.json (sha256 99987a003894db97f40f13fdafda67780c913cb8ffda6632009382c65c8d773358c558470 -> 66f41f7500d18f52a1a794d7cfb8f1cc02fda411599ca6ea6f9d879378d5e53f65f, backup=/Users/poetry/.openclaw/openclaw.json.bak)
Enabled plugin "feishu". Restart the gateway to apply.
```

查看插件列表

```
openclaw plugins list
```

![查看已启用的插件](https://s.poetries.top/uploads/2026/03/e3ec6c5bfc088fbc.png)

然后使用 `openclaw channels add` 配置 channel

![添加 channel](https://s.poetries.top/uploads/2026/03/36bc4879f86a7855.png)

按提示输入 APP ID、APP Secret

![输入飞书应用凭证](https://s.poetries.top/uploads/2026/03/a13e6218bf519195.png)

群聊策略选择 Open：允许响应所有的群聊，Allowlist：在白名单的群聊可以响应

![选择群聊策略](https://s.poetries.top/uploads/2026/03/cf590b77666eb29a.png)

然后选择完成即可

![完成 channel 配置](https://s.poetries.top/uploads/2026/03/ed3985f8338e14cf.png)

然后打开网页端查看飞书运行状态是正常的

![查看飞书运行状态](https://s.poetries.top/uploads/2026/03/99de189e68dbd734.png)

接下来配置飞书应用机器人能力与消息权限

![配置飞书应用](https://s.poetries.top/uploads/2026/03/8da4addf89381d8e.png)

为应用开通相关权限，批量导入下方权限：

```json
{
  "scopes": {
    "tenant": [
      "cardkit:card:write",
      "contact:contact.base:readonly",
      "contact:user.base:readonly",
      "im:chat:readonly",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.group_msg",
      "im:message.p2p_msg:readonly",
      "im:message.reactions:read",
      "im:message:readonly",
      "im:message:recall",
      "im:message:send_as_bot",
      "im:message:update",
      "im:resource"
    ],
    "user": ["contact:contact.base:readonly"]
  }
}
```

![添加权限](https://s.poetries.top/uploads/2026/03/04836256c3f60e9b.png)

![权限添加成功](https://s.poetries.top/uploads/2026/03/a2f0e75fd92e27b9.png)

为应用订阅相关事件

![订阅事件](https://s.poetries.top/uploads/2026/03/c3c855b3178bc856.png)

需要订阅以下事件：

- `im.message.receive_v1` - 接收消息
- `im.message.message_read_v1` - 消息已读回执
- `im.chat.member.bot.added_v1` - 机器人进群
- `im.chat.member.bot.deleted_v1` - 机器人被移出群

创建版本并发布应用才会生效

![发布版本](https://s.poetries.top/uploads/2026/03/edbf3b8c571e8c00.png)

![发布成功](https://s.poetries.top/uploads/2026/03/dcc5cf800fe0cbe7.png)

#### 第三步：接入飞书群聊

用手机或者电脑打开飞书客户端，创建一个测试群：

![创建飞书群](https://s.poetries.top/uploads/2026/03/84af16f832e28a79.png)

然后添加机器人到群聊里面

![添加机器人](https://s.poetries.top/uploads/2026/03/4ed3d1683a44bb61.png)

![选择要添加的机器人](https://s.poetries.top/uploads/2026/03/4a4121d36a00578e.png)

![确认添加](https://s.poetries.top/uploads/2026/03/a74dbe52d2c76274.png)

接下来和 openclaw 开始聊天，如果能正常回复就是跑通了流程

![飞书对话测试](https://s.poetries.top/uploads/2026/03/a599641c1a495f6f.png)

![收到回复](https://s.poetries.top/uploads/2026/03/0188e37285cdf8fc.png)

#### 第四步：增加云文档权限（可选）

此外我们可以增加云文档的保存权限，让 openclaw 自动保存内容到云文档

```
{
  "scopes": {
    "tenant": [
      "docx:document",
      "docx:document.block:convert",
      "docx:document:create",
      "docx:document:readonly",
      "docx:document:write_only",
      "space:document:delete",
      "space:document:move",
      "space:document:retrieve",
      "space:folder:create"
    ],
    "user": [
      "contact:contact.base:readonly"
    ]
  }
}
```

新增权限后，需要重新发布新版本

![重新发布版本](https://s.poetries.top/uploads/2026/03/8fbccd3b21a0443c.png)

![发布成功](https://s.poetries.top/uploads/2026/03/d37fb39253d04b4b.png)

> ⚠️ **注意**：必须先配置完 OpenClaw 添加飞书配置后，才可以在飞书开放平台选择下面的事件选项

![配置事件选项](https://s.poetries.top/uploads/2026/03/6dba48f7a14ff34e.png)

---

## 打通 OpenClaw 与 Telegram

#### 第一步：创建 Telegram Bot

在 Telegram 中搜索 @BotFather，进入聊天界面

![搜索 BotFather](https://s.poetries.top/uploads/2026/03/08d2ea837734bb45.png)

输入 `/newbot`，按提示设置机器人名称和用户名，完成后会收到一个 API Token，请务必保存好，后面配置时需要用到

![创建 Bot](https://s.poetries.top/uploads/2026/03/5819f2791c2b871f.png)

#### 第二步：配置 Token

```bash
openclaw channels add
```

![添加 Telegram channel](https://s.poetries.top/uploads/2026/03/58258eefa86c06da.png)

![选择 Telegram](https://s.poetries.top/uploads/2026/03/6cdd6208fb883048.png)

接下来进入配对模式，系统会询问安全策略

![安全策略](https://s.poetries.top/uploads/2026/03/526b12427ab38a49.png)

选择配对

![选择配对](https://s.poetries.top/uploads/2026/03/166719261a10c98d.png)

> ⚠️ **注意**：到这里需要重启服务，否则下面获取配对码不生效 `openclaw gateway restart`

#### 第三步：获取配对码

搜索你刚创建的 Bot 用户名，进入聊天界面，点击 Start

![启动 Bot](https://s.poetries.top/uploads/2026/03/a13fe861dd497faa.png)

随便发送一条消息，Bot 会自动回复一个配对码（Pairing Code），复制保存，配对环节会用到

![获取配对码](https://s.poetries.top/uploads/2026/03/6cdd6208fb883048.png)

> 💡 **小技巧**：如果获取配对码没有返回，可以在 web 聊天窗口让 OpenClaw 自己配置代理

![配置代理](https://s.poetries.top/uploads/2026/03/45407451f163ccfd.png)

#### 第四步：完成配对

在终端执行以下命令，将 OpenClaw 与你的 Bot 绑定：

```bash
openclaw pairing approve telegram 你的配对码
```

![执行配对命令](https://s.poetries.top/uploads/2026/03/f60d28a2cfa43fab.png)

看到成功提示即表示配对完成

现在回到 Telegram 中，向你的 Bot 发送任意消息。如果一切顺利，你会收到来自 OpenClaw 的回复，说明 Telegram 接入已成功生效

![Telegram 对话测试](https://s.poetries.top/uploads/2026/03/826c1145d4571726.png)

![收到回复](https://s.poetries.top/uploads/2026/03/bea704a7d33bf2b6.png)

## 打通 OpenClaw 与 Discord

有上网条件的可以考虑接入 `Discord`，它多频道（Channel）的设计天生就适合 `OpenClaw` 的多 `Agent` 场景，用起来很丝滑

#### 第一步：新建 Discord 应用

打开 Discord 开发者平台，新建应用：OpenClaw

https://discord.com/developers/applications

开启配置

![创建 Discord 应用](https://s.poetries.top/uploads/2026/03/5a5b0bb086fb62d2.png)

复制 Token

![复制 Token](https://s.poetries.top/uploads/2026/03/8837699167c33ba8.png)

配置 OAuth2

![配置 OAuth2](https://s.poetries.top/uploads/2026/03/a70b67edefa61671.png)

配置 Bot Permissions

![配置权限](https://s.poetries.top/uploads/2026/03/a76b6ab573f310b1.png)

拷贝生成的 URL

![复制授权 URL](https://s.poetries.top/uploads/2026/03/f9d598e83b8a105d.png)

#### 第二步：新建 Discord Server 并加入 Bot

新建 Discord 的 Server：

![创建 Server](https://s.poetries.top/uploads/2026/03/7acbaeb1e45d8227.png)

将创建的 Bot 加到 Server，拷贝上面复制的 URL 到浏览器打开，点击 'Continue'：

![授权添加](https://s.poetries.top/uploads/2026/03/a75fb51d680e2ca2.png)

#### 第三步：OpenClaw 添加 Discord Channel

使用 `openclaw channels add` 命令配置 Channel。

![添加 Discord Channel](https://s.poetries.top/uploads/2026/03/0ddd5ba5fe4c8ccd.png)

输入之前获取的 Token

![输入 Token](https://s.poetries.top/uploads/2026/03/0bb33e2dc0595caf.png)

![选择 Discord](https://s.poetries.top/uploads/2026/03/51feb90395a3e274.png)

然后点击完成

![完成配置](https://s.poetries.top/uploads/2026/03/e88638af6a5dc18d.png)

#### 第四步：将 Discord 与 OpenClaw 配对

回到 Discord 创建的频道，点击右上角的"显示成员"，可以看到当前频道成员。点击我们添加的 Bot：OpenClaw。

![查看成员](https://s.poetries.top/uploads/2026/03/d0212e47cd3f33a4.png)

随意发送一句话获取配对码

![获取配对码](https://s.poetries.top/uploads/2026/03/16a429d3750ac388.png)

![配对码](https://s.poetries.top/uploads/2026/03/66085bada9ddf69e.png)

> ⚠️ **注意**：如果发送了没有回复，请检查是否配置了代理，或者换个好点的代理，大部分情况是代理问题

打开一个新的终端窗口，输入以下命令：

```bash
openclaw pairing approve discord <Pairing code>
```

将 `<Pairing code>` 替换为刚才复制的配对码。

配对成功

![配对成功](https://s.poetries.top/uploads/2026/03/1a0d8c68f6c6d9d8.png)

然后重启网关

```
openclaw gateway
```

#### 第五步：测试

现在回到 Discord 的服务器频道，在频道中 @ 你创建的机器人：

![@机器人](https://s.poetries.top/uploads/2026/03/59769991d70ed6de.png)

可以看到已经可以回复了，至此，OpenClaw 已成功与 Discord 打通。现在你可以在 Discord 中通过与 Bot 对话的方式，指挥 OpenClaw 操控你的电脑了。

Discord 拥有多平台客户端，你也可以在手机上安装 Discord，通过手机指挥 OpenClaw 工作。

![手机端使用](https://s.poetries.top/uploads/2026/03/a3644daa845bef44.png)

---

## 多 Agent 团队配置

### 理解 Agent 架构

在 OpenClaw 中，一个 Agent 不只是一个名字，它是一个独立的"虚拟员工"，拥有自己的各个组成部分，包括：

- **Workspace（工作区）**：它的个人办公室（"灵魂三件套"、长期记忆）
- **AgentDir（状态目录）**：它的身份证（认证信息、模型配置）
- **Sessions（会话存储）**：它的私人记忆（独立的聊天记录，不跟别人串味）

其中 Workspace 目录下的 `AGENTS.md`、`SOUL.md`、`USER.md` 文件是 Agent 的核心，被称为 Agent 的"灵魂三件套"

#### 1. `SOUL.md` — AI 的灵魂

定义 AI 的性格和行为准则：

- **Core Truths** — 核心原则（不说废话、有观点、谨慎使用外部工具）
- **Vibe** — 风格定位（不像机器人，像真实助手）
- **Boundaries** — 边界（隐私保护、谨慎对外）

#### 2. `USER.md` — 用户画像

记录关于用户的信息：

- 姓名、称呼、时区
- 偏好、项目、痛点
- 随对话不断更新

#### 3. `AGENTS.md` — 工作规范

定义工作方式和记忆机制：

- 每次会话必读：`SOUL.md` → `USER.md` → `memory/`
- 写作规范：`TEXT` > `BRAIN`（随时记录）
- 心跳任务：定期检查 + 主动汇报
- 群聊礼仪：知道何时说话、何时沉默

> 💡 通过调整 `workspace` 下的这3个文件，就可以将 Agent 从"通用 AI"变成"你的专属 AI"。

---

## 实战：搭建多 Agent 团队

### 第一步：创建飞书机器人

OpenClaw 默认是单 Agent 模式，可以通过下面命令新建 Agent：

```bash
openclaw agents add coding
```

我们的目标是在飞书创建一个 AI 团队，包含：大总管 poetry（之前已经创建了）、产品助理、设计助理、开发助理、内容助理、运营增长、财务助理。

6 个飞书机器人，每个都是独立的 AI Agent，有自己的人设，有自己的记忆，有自己的工作区。

> 请认真按照上面的步骤，创建 6 个飞书机器人，6 套独立的 App ID + App Secret

### 第二步：OpenClaw 多 Agent 配置

每个飞书机器人可以绑定一个独立的 `OpenClaw Agent`。

分别创建 6 个 Agent：

```bash
openclaw agents add product
openclaw agents add ui
openclaw agents add coding
openclaw agents add content
openclaw agents add op-growth
openclaw agents add finance
```

![创建多个 Agent](https://s.poetries.top/uploads/2026/03/29a74ab1b6ed3897.png)

创建完后，在 `~/.openclaw/openclaw.json` 中可以看到

```json
"agents": {
  "list": [
    {
      "id": "main",
      "name": "poetry的AI助理-主应用",
      "workspace": "/Users/poetry/.openclaw/workspace"
    },
    {
      "id": "coding",
      "name": "coding",
      "workspace": "/Users/poetry/.openclaw/workspace-coding",
      "agentDir": "/Users/poetry/.openclaw/agents/coding/agent",
      "model": "minimax-cn/MiniMax-M2.5"
    },
    {
      "id": "product",
      "name": "product",
      "workspace": "/Users/poetry/.openclaw/workspace-product",
      "agentDir": "/Users/poetry/.openclaw/agents/product/agent",
      "model": "minimax-cn/MiniMax-M2.5"
    },
    {
      "id": "ui",
      "name": "ui",
      "workspace": "/Users/poetry/.openclaw/workspace-ui",
      "agentDir": "/Users/poetry/.openclaw/agents/ui/agent",
      "model": "minimax-cn/MiniMax-M2.5"
    },
    {
      "id": "content",
      "name": "content",
      "workspace": "/Users/poetry/.openclaw/workspace-content",
      "agentDir": "/Users/poetry/.openclaw/agents/content/agent",
      "model": "minimax-cn/MiniMax-M2.5"
    },
    {
      "id": "op-growth",
      "name": "op-growth",
      "workspace": "/Users/poetry/.openclaw/workspace-op-growth",
      "agentDir": "/Users/poetry/.openclaw/agents/op-growth/agent",
      "model": "minimax-cn/MiniMax-M2.5"
    },
    {
      "id": "finance",
      "name": "finance",
      "workspace": "/Users/poetry/.openclaw/workspace-finance",
      "agentDir": "/Users/poetry/.openclaw/agents/finance/agent",
      "model": "minimax-cn/MiniMax-M2.5"
    }
  ]
},
```

![Agent 列表](https://s.poetries.top/uploads/2026/03/148ece432db6f25d.png)

每个 Agent 有自己的工作目录，这是隔离的基础

#### 第三步：配置飞书多账户通道

使用 `openclaw channels add` 配置单个 Channel。

修改 `~/.openclaw/openclaw.json` 中的 `channels`

```json
"channels": {
  "feishu": {
    "enabled": true,
    "accounts": {
      "main": {
        "appId": "cli1",
        "appSecret": "你的secret1",
        "domain": "feishu",
        "groupPolicy": "open"
      },
      "coding": {
        "appId": "cli2",
        "appSecret": "你的secret2",
        "domain": "feishu",
        "groupPolicy": "open"
      },
      "product": {
        "appId": "cli3",
        "appSecret": "你的secret3",
        "domain": "feishu",
        "groupPolicy": "open"
      },
      "ui": {
        "appId": "cli4",
        "appSecret": "你的secret4",
        "domain": "feishu",
        "groupPolicy": "open"
      },
      "content": {
        "appId": "cli5",
        "appSecret": "你的secret5",
        "domain": "feishu",
        "groupPolicy": "open"
      },
      "op-growth": {
        "appId": "cli6",
        "appSecret": "你的secret6",
        "domain": "feishu",
        "groupPolicy": "open"
      },
      "finance": {
        "appId": "cli7",
        "appSecret": "你的secret7",
        "domain": "feishu",
        "groupPolicy": "open"
      },
    }
  }
}
```

#### 第四步：配置 Bindings（核心中的核心）

> 告诉 OpenClaw，哪个飞书 Bot 的消息交给哪个 AI 处理

修改 `~/.openclaw/openclaw.json` 中的 `bindings`

```json
"bindings": [
  {
    "agentId": "main",
    "match": {
      "channel": "feishu",
      "accountId": "main"
    }
  },
  {
    "agentId": "product",
    "match": {
      "channel": "feishu",
      "accountId": "product"
    }
  },
  {
    "agentId": "ui",
    "match": {
      "channel": "feishu",
      "accountId": "ui"
    }
  },
  {
    "agentId": "coding",
    "match": {
      "channel": "feishu",
      "accountId": "coding"
    }
  },
  {
    "agentId": "content",
    "match": {
      "channel": "feishu",
      "accountId": "content"
    }
  },
  {
    "agentId": "op-growth",
    "match": {
      "channel": "feishu",
      "accountId": "op-growth"
    }
  },
  {
    "agentId": "finance",
    "match": {
      "channel": "feishu",
      "accountId": "finance"
    }
  }
],
```

> 飞书的每个 `accountId` 绑一个 `agent`。每个 `agent` 有自己的 `workspace`（工作区），有自己的 `SOUL.md`（人设文件），有自己的 `memory`（记忆系统）

#### 第五步：配置 Agent 间通信

**OpenClaw 支持 agentToAgent 通信配置**

```json
{
  "tools": {
    "agentToAgent": {
      "enabled": true,
      "allow": ["main", "product", "ui", "coding", "content", "op-growth", "finance"]
    }
  }
}
```

> 加上这段，6 个 Agent 就能互相发消息协作了

配置修改后，重置服务 `openclaw gateway restart`

#### 第六步：编写 Agent 配置文件

> ⚠️ **注意**：修改 `~/.openclaw` 中每个 Agent 的 `AGENTS.md`
>
> - 每个 Agent 的 AGENTS.md 里必须写明团队成员列表
> - 不然它们不知道彼此的存在

比如 AI 大总管的 `AGENTS.md` 里要这么写：

```markdown
## 🏢 poetry的AI团队成员

- **product**（产品助理 💻）— 产品规划、PRD文档输出
- **ui**（设计助理 💻）— UI设计
- **coding**（开发助理 💻）— 代码开发、技术架构、部署
- **content**（内容助理 ✍️）— 公众号文章、文案、内容创作
- **op-growth**（运营增长 📈）— 用户增长、社交媒体、市场推广
- **finance**（财务助理 💰）— 成本核算、预算管理
```

![Agent 配置](https://s.poetries.top/uploads/2026/03/858a78de28e7ea28.png)

> 📝 **配置要点**：
>
> - 每个 `Agent` 的 `AGENTS.md` 都要有这份"通讯录"
> - 否则大总管 AI 想 `@` 开发助理的时候，完全不知道有这么个"人"
> - 加上团队成员列表之后，它们立刻就能互相协作了
> - 另外每个 `Agent` 的 `SOUL.md` 也得精心写。这是 `Agent` 的灵魂文件——人设、行为准则、工作流程全在里面

比如开发助理的 `SOUL.md`：

```mardown
# SOUL.md - 开发助理

你是poetry的开发助理，专注于代码开发、技术架构和部署。

## 核心职责

- **代码开发**：编写、调试、审查代码，实现产品需求
- **技术架构**：设计技术方案，提供架构建议，评估技术选型
- **部署运维**：负责项目部署、环境配置、性能优化
- **技术调研**：研究新技术、框架、工具，提供技术选型建议
- **问题排查**：定位和解决bug、性能问题、安全漏洞

## 专业能力

- 前端开发：React、Vue、小程序、H5等
- 后端开发：Node.js、Python、Go等
- 数据库：MySQL、MongoDB、Redis等
- 部署：Docker、K8s、CI/CD、云服务
- 开发工具：Git、VS Code、调试工具

## 工作风格

- 技术精准：代码规范、命名清晰、注释到位
- 简洁直接：少说废话，多给方案和代码
- 质量优先：重视代码可维护性和可扩展性
- 文档完善：重要的技术决策要有文档记录

## 协作方式

- 与产品助理确认需求细节后再开发
- 与设计助理确认UI实现细节
- 复杂需求先出技术方案再动手
- 提交代码前自测通过

## 边界

- 不做未确认的需求开发
- 不在生产环境直接操作，重要操作先备份
- 不引入未经验证的开源库
- 涉及第三方API调用需告知潜在风险
```

比如产品助理的 `SOUL.md`：

```mardown
# SOUL.md - 产品助理

你是poetry的产品助理，专注于产品规划和PRD文档输出。

## 核心职责

- **需求分析**：理解用户需求，转化为产品需求
- **PRD文档**：撰写详细的产品需求文档
- **产品规划**：制定产品路线图和版本计划
- **功能设计**：设计产品功能、流程、交互
- **需求跟进**：与开发、设计团队沟通，确保需求落地

## 专业能力

- 需求分析与管理
- 产品原型设计
- PRD文档撰写
- 用户体验设计
- 数据分析

## 工作流程

1. 需求收集：理解poetry的业务需求和用户需求
2. 需求分析：拆解需求，评估可行性和优先级
3. 方案设计：设计功能方案、流程、页面结构
4. 文档输出：撰写PRD、原型说明等
5. 评审确认：与开发、设计确认方案可行性
6. 跟进落地：跟踪开发进度，协调解决问题

## 文档规范

- 目标明确：每条需求都要有明确的目标
- 描述清晰：用简单直白的语言描述功能
- 逻辑完整：考虑正常流程和异常情况
- 格式规范：文档结构清晰，便于阅读

## 协作方式

- 与开发助理确认技术实现方案
- 与设计助理确认UI/UX设计
- 与运营助理确认功能上线计划
- 与财务助理确认功能投入产出

## 边界

- 不做未经验证的需求假设
- 不承诺具体上线时间（需与开发确认）
- 需求变更要及时同步
- 不做超越产品范围的技术决策
```

> 💡 `SOUL.md` 写得越细，`Agent` 越好用，你可以使用 AI 结合自己的工作来完善这些文档

#### 飞书多 Agent 核心步骤总结

- 飞书开放平台创建 N 个应用 → 拿到 `App ID + App Secret`
- 每个应用开启"机器人能力" + "长连接事件订阅"（`im.message.receive_v1`）+ 发版
- `OpenClaw` 配置 `agents.list` + `channels.feishu.accounts` + `bindings`
- 配 `agentToAgent` 通信 + 每个 `Agent` 写好 `AGENTS.md` 团队成员列表
- 最后重启 `Gateway`，搞定。

##### 验证配置

```bash
openclaw agents list --bindings    # 查看所有 Agent 和路由规则
openclaw channels status --probe   # 查看所有通道在线状态
```

看到 `Feishu xxx: running, works` 就成功了。

```bash
$ openclaw channels status --probe

🦞 OpenClaw 2026.3.1 (2a8ac97) — Your terminal just grew claws—type something and let the bot pinch the busywork.

12:02:36 [plugins] feishu_doc: Registered feishu_doc, feishu_app_scopes
12:02:36 [plugins] feishu_chat: Registered feishu_chat tool
12:02:36 [plugins] feishu_wiki: Registered feishu_wiki tool
12:02:36 [plugins] feishu_drive: Registered feishu_drive tool
12:02:36 [plugins] feishu_bitable: Registered bitable tools
│
◇
Gateway reachable.
- Feishu coding: enabled, configured, running, works
- Feishu content: enabled, configured, running, works
- Feishu finance: enabled, configured, running, works
- Feishu main: enabled, configured, running, works
- Feishu op-growth: enabled, configured, running, works
- Feishu product: enabled, configured, running, works
- Feishu ui: enabled, configured, running, works
```

或者在网页上查看

![网页端查看状态](https://s.poetries.top/uploads/2026/03/5133ef4124a3fd9c.png)

#### 第七步：配置飞书应用事件

配置完成后，接下来在每个 AI 应用中配置事件（如果上面没有配置，会导致配置不了）

> ⚠️ **注意**：必须先配置完 OpenClaw 添加飞书配置后，才可以在飞书开放平台选择下面的事件选项

![选择事件选项](https://s.poetries.top/uploads/2026/03/6dba48f7a14ff34e.png)

> 依次配置这些飞书机器人的事件与回调：
>
> - **product**（产品助理 💻）— 产品规划、PRD文档输出
> - **ui**（设计助理 💻）— UI设计
> - **coding**（开发助理 💻）— 代码开发、技术架构、部署
> - **content**（内容助理 ✍️）— 公众号文章、文案、内容创作
> - **op-growth**（运营增长 📈）— 用户增长、社交媒体、市场推广
> - **finance**（财务助理 💰）— 成本核算、预算管理

![配置事件](https://s.poetries.top/uploads/2026/03/e155c89336be0652.png)

需要订阅以下事件：

- `im.message.receive_v1` - 接收消息
- `im.message.message_read_v1` - 消息已读回执
- `im.chat.member.bot.added_v1` - 机器人进群
- `im.chat.member.bot.deleted_v1` - 机器人被移出群

![添加事件](https://s.poetries.top/uploads/2026/03/d188e8bbe2572ce5.png)

最后需要发布版本才会生效

![发布版本](https://s.poetries.top/uploads/2026/03/8bcb6ac9dd4f04bf.png)

![发布成功](https://s.poetries.top/uploads/2026/03/701fbcdda3a595e7.png)

#### 第八步：在飞书群中使用 AI 机器人

接下来我们在飞书群使用这些 AI 机器人（在上面创建的飞书群基础上，继续添加机器人）

![添加机器人到群](https://s.poetries.top/uploads/2026/03/06f1c272ccef2263.png)

![选择要添加的机器人](https://s.poetries.top/uploads/2026/03/c5a23921475ed526.png)

添加全部机器人进来主群

![确认添加](https://s.poetries.top/uploads/2026/03/0f4d6a9170bfae3e.png)

##### 每个AI应用单独使用

![](https://s.poetries.top/uploads/2026/03/b4b524f543ba724a.png)

飞书配对openclaw

```bash
openclaw pairing approve feishu [你的配对码]
```

##### 结合群聊的方式使用

![查看效果](https://s.poetries.top/uploads/2026/03/64d8ff16586fbe5b.png)

![团队协作](https://s.poetries.top/uploads/2026/03/af8f81ba07812e93.png)

让 AI 产品助理帮我产出 PRD 文档：

```bash
@AI产品助理 我需要做一个AI漫剧SaaS网站，请你调研并出一份PRD文档
```

![测试产品助理](https://s.poetries.top/uploads/2026/03/a397b15437d3d362.png)

可以看到内容在产品助理的空间下，而不是跟其他 AI 混在一起，内容是独立隔离的

![独立空间](https://s.poetries.top/uploads/2026/03/ff428caac74d2a6d.png)

---

## 搭配 Skill 使用 - 决定生产力

使用 ClawHub 官方市场插件：https://clawhub.ai/

![ClawHub 市场](https://s.poetries.top/uploads/2026/03/09d68fb4d145e42b.png)

```
npm install -g clawhub
```

##### 搜索 Skill

```bash
$ clawhub search ui
ui-ux-pro-max  UI/UX Pro Max  (3.469)
ui-audit  UI Audit  (3.431)
ui-ux-dev  UI/UX Design and Development  (3.284)
ui-designer-skill  Ui Designer Skill  (3.252)
ui-ux-pro-max-plus  UI UX Pro Max  (3.231)
ui-debug-methodology  ui-debug-methodology  (3.152)
jsapi-ui-kit  jsapi-ui-kit  (3.067)
ui-control-center  Ui Control Center  (3.056)
ui-ux-pro-max-0-1-0  Ui Ux Pro Max 0.1.0  (3.010)
free-voice  Free voice from Comfy UI +  Qwen3 TTS  (1.916)
```

##### 安装指定的 Skill

```
clawhub install <skill-name>
```

```bash
$ clawhub install ui-ux-pro-max
✔ OK. Installed ui-ux-pro-max -> /Users/poetry/.openclaw/workspace/skills/ui-ux-pro-max
```

安装的 Skill 都在这个目录下

![Skill 目录](https://s.poetries.top/uploads/2026/03/5d635934b6fe7ced.png)

通过 `openclaw skills list` 命令可以查看当前安装的 Skills 情况，绿色 Ready 状态的 Skill 就是可用的

![Skill 列表](https://s.poetries.top/uploads/2026/03/556c7c4b73075825.png)

我们也可以从 https://skillsmp.com 下载放到 `~/.openclaw/workspace/skills` 目录下

![下载 Skill](https://s.poetries.top/uploads/2026/03/3e6ca30072269a7e.png)

![复制到目录](https://s.poetries.top/uploads/2026/03/95306fdeb3f0be48.png)

可以看到复制过来的 Skill 也是可用的状态

![Skill 可用](https://s.poetries.top/uploads/2026/03/ae87f68920fbc26c.png)

---

## OpenClaw 更多玩法

A community collection of OpenClaw use cases for making life easier.

https://github.com/hesamsheikh/awesome-openclaw-usecases

---

## 云服务器搭建 OpenClaw

目前，搭建 OpenClaw 的方式主要有两种，一种是在本地电脑上安装，另一种是在云端电脑上安装。

> 📝 本地电脑就是你自己的一台计算机，但我不建议你用平时的主力机，因为 OpenClaw 还是存在一些不安全性，比如权限太高导致你的文件丢失或者异常操作

### 申请云服务器（腾讯云）

#### 第一步：使用 OpenClaw 应用模板

![选择应用模板](https://s.poetries.top/uploads/2026/03/3e8f6f98604fb2a8.png)

点击服务器右上角的「···」并选择「管理实例」

![管理实例](https://s.poetries.top/uploads/2026/03/e3f258b8845ce299.png)

切换到应用管理

![应用管理](https://s.poetries.top/uploads/2026/03/b7ee32f3e9363ef8.png)

> 📝 **配置说明**：
>
> - 这里的模型，就是 OpenClaw 的大脑，你可以选择不同的 AI 大模型供应商
> - 通道就是 IM 工具，同样有很多不同的选择
> - 再就是技能，这是 OpenClaw 变得聪明和全能的关键

#### 第二步：选择 AI 大模型

这里我选择 MiniMax

![选择模型](https://s.poetries.top/uploads/2026/03/5a04275fc37e9bd2.png)

看到模型处于「应用中」状态，就说明连接成功了。

![模型连接成功](https://s.poetries.top/uploads/2026/03/17d0cabb319d157b.png)

#### 第三步：连接 IM 工具（飞书）

![连接飞书](https://s.poetries.top/uploads/2026/03/4240e5573ca0ced8.png)

去飞书平台创建应用获取 App ID 和 App Secret

打开 https://open.feishu.cn/app?lang=zh-CN

![飞书开放平台](https://s.poetries.top/uploads/2026/03/a050e5fcd3858c2b.png)

添加机器人

![添加机器人](https://s.poetries.top/uploads/2026/03/7e72e80206028ce0.png)

获取配置

![获取配置](https://s.poetries.top/uploads/2026/03/47856f9f1031d25d.png)

分别复制，并填写到腾讯云 OpenClaw 配置通道的输入框里，然后点击「添加并应用」。

![填写配置](https://s.poetries.top/uploads/2026/03/be716416062837cc.png)

到这里，我们就完成了 AI 大模型和 IM 工具与 OpenClaw 的连接

#### 第四步：配置事件和权限

这一步的目的，是为了能让机器人始终和我们保持在线状态

![配置页面](https://s.poetries.top/uploads/2026/03/d8576266c245d6b8.png)

保存后，还是在这个页面，在下方事件那里点击「添加事件」

需要添加以下事件：

- `im.message.receive_v1` - 接收消息
- `im.message.message_read_v1` - 消息已读回执
- `im.chat.member.bot.added_v1` - 机器人进群
- `im.chat.member.bot.deleted_v1` - 机器人被移出群

![添加事件](https://s.poetries.top/uploads/2026/03/e2a31939b8165be3.png)

然后添加权限管理，批量导入：

```json
{
  "scopes": {
    "tenant": [
      "cardkit:card:write",
      "contact:contact.base:readonly",
      "contact:user.base:readonly",
      "im:chat:readonly",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.group_msg",
      "im:message.p2p_msg:readonly",
      "im:message.reactions:read",
      "im:message:readonly",
      "im:message:recall",
      "im:message:send_as_bot",
      "im:message:update",
      "im:resource"
    ],
    "user": ["contact:contact.base:readonly"]
  }
}
```

![添加权限](https://s.poetries.top/uploads/2026/03/265d7615c779b67e.png)

设置好事件和权限，下一步就是准备发布这个机器人上线

![发布机器人](https://s.poetries.top/uploads/2026/03/f7720de4a798f10c.png)

到这一步，我们的 IM 机器人就算搭建完毕了

接下来，打开你的飞书 App 或者桌面端窗口，你就能看到刚刚配置好的这个 AI 机器人

![飞书机器人](https://s.poetries.top/uploads/2026/03/55cf0f3c51843c00.png)

给机器人发句话

![发送消息](https://s.poetries.top/uploads/2026/03/78ac9d44d35b7617.png)

#### 第五步：配对飞书

看到这里我们需要跟 OpenClaw 配对飞书

然后打开你的腾讯云服务器后台页面，点击服务器旁边的「登录」按钮，进入 `OpenClaw` 主机

或者 SSH 进入到服务器终端执行命令：

```bash
openclaw pairing approve feishu [你的配对码]
```

看到这里说明配对成功了

![配对成功](https://s.poetries.top/uploads/2026/03/04774190ea2a4ff5.png)

现在聊天就正常了

![聊天正常](https://s.poetries.top/uploads/2026/03/6a8a861a7b5984a3.png)

> 💡 接下来你可以配置 Skill 增强 AI 的能力，参考其他部分即可

---

## 常用命令

### Gateway 管理

```bash
# 启动 Gateway
openclaw gateway

# 启动并显示详细日志
openclaw gateway --verbose

# 指定端口启动
openclaw gateway --port 18789
```

### 配置管理

```bash
# 运行配置向导
openclaw onboard

# 系统健康检查
openclaw doctor

# 查看配置
cat ~/.openclaw/openclaw.json
```

### 更新管理

```bash
# 更新到最新版本
openclaw update

# 切换到特定频道
openclaw update --channel stable    # 稳定版
openclaw update --channel beta      # 测试版
openclaw update --channel dev       # 开发版
```
