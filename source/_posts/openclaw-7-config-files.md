---
title: 搞懂这7个配置文件让你的OpenClaw变智能助手
date: 2026-03-08 09:00:00
description: 很多人装了满满一堆Skills，却觉得OpenClaw还是"傻白甜"。其实决定AI智商的，不是插件有多少，而是这几个藏在系统底层的配置文件。
tags:
  - OpenClaw
  - AI助手
  - Skills
categories: AI
---


![](https://s.poetries.top/uploads/2026/03/0b28aa4ef0f9df64.png)

装了满满一堆 `Skills`，`OpenClaw` 还是那个“一问一答”的傻白甜？

别急着怪大模型变笨，也别急着骂 `Skills` 没用。真正的问题在于：**你从来没有认真配置过这几个关键文件。**

今天这篇教程，带你搞懂 OpenClaw 的 7 个核心配置文件，轻松实现从“傻白甜”到“智能助手”的蜕变。

## 先找到这些文件在哪

在开始之前，先知道这些关键配置文件藏在哪儿。

### 命令行方式

```bash
# 查看工作空间下的文件
ls ~/.openclaw/workspace/

# 进入工作空间
cd ~/.openclaw/workspace/
```

文件层级如下：

![](https://s.poetries.top/uploads/2026/03/077e12872de83bba.png)

```bash
~/.openclaw/workspace/
├── AGENTS.md       # 代理调度规则与标准作业程序
├── BOOTSTRAP.md    # 初始化序列与核心系统提示词
├── HEARTBEAT.md    # 定时执行逻辑与主动任务状态自检
├── IDENTITY.md     # 代理身份定义与系统边界约束
├── MEMORY.md       # 长期上下文数据与既定规则的持久化存储
├── SOUL.md         # 响应语气、行为特征及输出格式配置
├── TOOLS.md        # 工具授权注册表及调用参数规范
├── USER.md         # 用户画像数据，包含特定偏好与交互限制配置
├── memory/         # 日常运行日志与短期上下文存储
└── skills/         # 已安装的第三方技能扩展目录
```

### WebUI 方式

1. 访问：`http://localhost:18789/overview`
2. 点击“连接”
3. 左侧选择“代理” -> 当前 Agent
4. 点击文件，选择对应的 md 文件进行修改

## 这 7 个文件，决定了 AI 的“智商”

![](https://s.poetries.top/uploads/2026/03/891c713891744feb.png)

### 1. `SOUL.md` —— AI 的灵魂性格

![](https://s.poetries.top/uploads/2026/03/3b62d9a28d232b77.png)

`SOUL.md `是整个 `OpenClaw `身份架构中最基础的文件，定义了代理的性格、核心价值观和长期指令。

一个好的 `SOUL.md`，应该包含这几个部分：

```markdown
## 1. 核心身份与人格

- **角色设定**：你是主人的专属AI助手
- **沟通风格**：简单问题一针见血，复杂问题详细拆解
- **术语与排版**：技术术语必须保留英文，关键结论用加粗

## 2. 核心价值观与绝对红线

- **隐私与边界**：绝对禁止泄露任何项目代码或个人隐私
- **行动派原则**：能直接干的活儿直接干，拒绝废话
- **风险阻断机制**：高危操作前必须请求确认

## 3. 长期指令与生存法则

- **记忆连续性**：每次响应前先读取记忆文件
- **生物钟感知**：深夜时段降低主动输出频率
```

**关键点**：`SOUL.md `越具体，AI 行为越明确。模糊的指令如“要有帮助”会产生模糊的行为，而“最多 5 个要点，确认后再删除任何文件”会产生特定的行为。

### 2. `AGENTS.md` —— AI 的工作指南

![](https://s.poetries.top/uploads/2026/03/cb1bbfac8ee8f6ce.png)

`AGENTS.md `是 `OpenClaw `的日常行为配置文件，详细记录了任务处理流程、工具使用策略和决策规范。

核心内容包括：

```markdown
## 1. 唤醒协议

每次会话开始前必须执行：

- 读取`SOUL.md` - 确认AI是谁
- 读取`USER.md` - 确认用户是谁
- 读取`memory/` - 获取最近上下文

## 2. 记忆库新陈代谢

- 每日流水：当天灵感、废稿存入`memory/YYYY-MM-DD.md`
- 精华提炼：定期回顾并更新到`MEMORY.md`

## 3. 护主与绝对红线

- 隐私锁死：禁止泄露未发布的草稿
- 破坏性拦截：文件删除前必须询问
- 懂就问：绝不靠幻觉瞎编
```

### 3. `USER.md` —— AI 的用户说明书

![](https://s.poetries.top/uploads/2026/03/9f0b69e9f4847c19.png)

`USER.md `是写给 OpenClaw 的“使用说明书”，决定了 AI 如何服务你。

```markdown
## 1. 基础参数

- 称呼：poetry
- 时区：Asia/Shanghai
- 角色：前端工程师

## 2. 沟通与排版癖好

- 排版要求：少用Emoji，不要"首先其次最后"
- 语言风格：短句优先，结论前置
- 黑名单词汇：禁止"祝您生活愉快"类废话

## 3. 当前焦点

- 最近在筹备什么项目
- 这样AI才能给出相关建议

## 4. 隐秘的细节与雷区

- 雷区：不要随便改我的笔记库结构
- 偏好：只要数据，不需要情绪
```

**这是过滤“AI 味”最重要的一环。**

### 4. `HEARTBEAT.md` —— 让 AI 具备“自主意识”

![](https://s.poetries.top/uploads/2026/03/d026703c0f229859.png)

`HEARTBEAT.md `决定了 AI 能否主动为你工作，而不是只能等你下命令。

```markdown
# 主动请求

- 每半小时抓取指定推特的最新数据
- 检查GitHub仓库CI/CD是否有构建失败
- 瞄一眼BTC/ETH价格和Gas费

# 每日07:30早报

生成并推送《早间简报》，包含：

- 美股和加密大盘核心数据
- 过去24小时的阅读量最高的推文
- 昨天代码有没有遗留Bug

# 条件触发

- 推文被大V转发 → 立刻提醒
- BTC 15分钟波动超3% → 最高级别警报
```

这才是 OpenClaw 最强大的地方——**当服务器凌晨 3 点宕机时，心跳机制会捕获问题并通过 Telegram 提醒你**。

### 5. `TOOLS.md` —— 技能配置清单

![](https://s.poetries.top/uploads/2026/03/5e619c768dcf57ef.png)

`TOOLS.md `定义了 `OpenClaw `能用什么工具。

要理解 `Tools `和 `Skills `的区别：

- **Tools 是器官** —— 决定了 AI 是否能做某事

- **Skills 是教科书** —— 教 AI 如何组合工具完成任务

```markdown
# Skills配置

## 1. 社交媒体采集

- 主阵地：@你的账号
- 盯盘名单：Web3、AI赛道的关键账号
- 屏蔽词库：过滤抽奖垃圾推文

## 2. 本地存储映射

- 灵感暂存区：~/.openclaw/workspace/inspiration/
- 草稿输出目录：~/.openclaw/workspace/Drafts/
- 日志回收站：~/.openclaw/workspace/trash/
```

### 6. `IDENTITY.md` —— 对外身份形象

`IDENTITY.md `负责定义 AI 的“外在形象”——显示名称、表情符号、主题和问候语。

- `SOUL.md `告诉 AI“你是谁”

- `IDENTITY.md `告诉用户 AI“长什么样”

```markdown
# IDENTITY.md

- 姓名：poetry
- 物种：全自动化打工犬
- 氛围：硬核、极客、话少干活快
```

这种分离设计很强大——你可以随时调整 AI 的对外形象，但保持核心人格不变。

### 7. `BOOTSTRAP.md` —— 初始化引导

![](https://s.poetries.top/uploads/2026/03/bc8516b22b8de50d.png)

`BOOTSTRAP.md `是全新工作空间的一次性引导文件。

核心功能是引导用户完成：命名 AI、设置人格、填写 `USER.md`。

```markdown
# 引导流程

## 1. 拷打

"系统上线，记忆为空。咱们定一下规矩：我是谁？"

## 2. 基因重组

- 覆写`IDENTITY.md`
- 覆写`USER.md`
- 敲定`SOUL.md`的红线

## 3. 连接渠道

- 仅限本地
- Telegram（推荐）
- WhatsApp
```

**关键**：完成后必须删除 `BOOTSTRAP.md`。你已经有了灵魂，不再是空白机器了。

## 写在最后

看完这篇，你会发现：**OpenClaw 的“智商”根本不是由 Skills 数量决定的，而是由这 7 个配置文件决定的。**

- `SOUL.md` → 性格
- `AGENTS.md` → 怎么干活
- `USER.md` → 怎么服务你
- `HEARTBEAT.md` → 自主意识
- `TOOLS.md` → 能用什么工具
- `IDENTITY.md` → 长什么样
- `BOOTSTRAP.md` → 初始引导

这才是让 AI 从“傻白甜”变成“智能助手”的关键。
