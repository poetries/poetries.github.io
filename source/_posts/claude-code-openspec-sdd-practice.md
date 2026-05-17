---
title: Claude Code 加 OpenSpec 让 AI 编程从临场发挥进化到工程化交付
description: 一篇文章讲透 Claude Code 配 OpenSpec 的 SDD 工作流，proposal/design/tasks 怎么写、何时必走、和 superpowers/gstack 怎么分工，配套从零到 archive 的完整实战。
date: 2026-05-18 11:00:00
tags:
  - Claude Code
  - OpenSpec
  - Spec-Driven Development
  - AI Coding
  - 工程化
categories: AI
---

> 「让 AI 写一段代码」很简单，「让 AI 交付一份能上线的需求」很难。本文用一份真实项目的实战流程，讲清楚 `Claude Code` 加 `OpenSpec` 怎么把 AI 编程从临场发挥推到工程化交付，并明确什么时候是刚需、什么时候是过度工程。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 为什么 AI 编程到真实业务就开始翻车
- `OpenSpec` 三件套（`proposal` / `design` / `tasks`）各自的角色
- `Claude Code` 怎么和 `OpenSpec` 协同：规范层、流程层、执行层
- 从一句话需求到 archive 的完整 13 步实战
- 任务分流：轻 / 中 / 大什么时候走 SDD，什么时候直接做
- 三件套常见反模式与失败逃生路径
- 一份可直接复制的 `CLAUDE.md` 配置片段

## 痛点与解决方案

「让 AI 写一段代码」和「让 AI 交付一个能上线的功能」之间，差的不是模型能力，是工程化。我们都遇到过这些场景：

- **需求理解偏差**：一句话「加个登录」，AI 实现完发现接口契约、UI 风格、错误码全和现有系统对不齐，返工三轮
- **决策记录缺失**：为什么用 `JWT` 不用 `Session`？两周后再翻代码完全想不起来理由
- **工程纪律失守**：测试没写、类型没过、构建没跑就声称「完成」，CI 一跑红一片
- **多人协作冲突**：两个工程师各让 AI 帮自己加同一个模块，两套方案在 review 时打架

问题不在 AI，在我们没给它**一份能跟着走的蓝图**。`OpenSpec` 就是解决这个问题的：它把「一句话需求」拆解成 `proposal.md` + `design.md` + `tasks.md` 三份结构化文档，让 AI 和人都按同一份规范执行。配合 `Claude Code` 的 Agent runtime，整个流程就跑通了。

## 一、为什么要 Spec 先行

`Spec-Driven Development`（SDD，规范驱动开发）不是新概念，传统 PRD / RFC 都是它的形态。但传统文档的问题是**重、慢、写完就锁死**。AI 时代需要新的 SDD 范式：

| 维度 | 传统 PRD / RFC | OpenSpec |
| --- | --- | --- |
| 文档形态 | 重型，几千字 | 轻量 `Markdown`，三个文件 |
| 编写周期 | 评审会几轮，几天到几周 | 一次会话 30-60 分钟 |
| 变更方式 | 评审锁定，改动成本高 | 实施中可随时迭代 |
| 工具支持 | 通常锁定单一平台 | 25+ AI Assistant 通用 |
| 状态管理 | 文档系统外维护 | 同仓 `changes/` + `archive/` |
| 谁来写 | 产品 / 架构师 | 人和 AI 一起写 |

`OpenSpec` 的核心思想是**轻、可迭代、谁实施谁也参与写规范**。这和「先评审三个月再开工」的传统 SDD 是两套哲学。

## 二、OpenSpec 三件套各自的角色

每份变更落在 `openspec/changes/<change-id>/` 下，标配三个文件加一个 `specs/` 目录：

```
openspec/
├── specs/                    # 当前系统的事实来源（项目规范）
└── changes/
    └── <change-id>/
        ├── proposal.md       # 为什么要做：背景、目标、成功标准
        ├── design.md         # 怎么做：架构决策、接口设计、数据流
        ├── tasks.md          # 实施清单：可执行的具体任务
        └── specs/            # 本次变更涉及的 capability 规范
            └── <capability>/
                └── spec.md
```

三个文件的边界要划清楚，否则会写串：

- **`proposal.md`** —— 「为什么做」。说清楚痛点、目标、不做会怎样、成功标准。**不写实现细节**
- **`design.md`** —— 「怎么做」。架构选型、接口契约、数据流、依赖关系、关键决策的取舍理由。**不写任务清单**
- **`tasks.md`** —— 「做什么」。可执行的产品 / 规范层任务，用户视角的可验证成果项。**不写文件级实现步骤**

注意 `tasks.md` 不是 plan。它说「做什么」，不说「怎么做」。如果你要文件级的实施步骤，那是 `superpowers` 的 `writing-plans` 该干的事。

## 三、Claude Code 怎么和 OpenSpec 协同

`OpenSpec` 只产规范，不写代码。`Claude Code` 是 Agent runtime，能跑代码、跑工具、跑测试。两者协同的关键是**职责分层**：

- **规范层（`OpenSpec`）**：产出 `proposal` / `design` / `tasks`，不写代码
- **流程层（`superpowers`）**：plan / brainstorm / debug / TDD / verify / review
- **执行层（`gstack`）**：浏览器 / QA / ship / deploy / canary / 护栏

类比一下：`OpenSpec` 是蓝图，`superpowers` 是大脑，`gstack` 是手脚。

三者通过**文件和命令**传递信息，不靠隐式状态：

- `OpenSpec` 把 `tasks.md` 交给 `superpowers` 的 `executing-plans`
- `superpowers` 把执行结果交给 `gstack` 验证
- `gstack` 把验证结果反馈给 `superpowers` 决定下一步
- 出现契约错误时回到 `OpenSpec` 修订 `design.md`

## 四、典型工作流：从一句话到 archive

下面是一个真实项目里跑过的完整流程。需求是「给面试题站点加一个收藏夹功能」，影响数据库、API、UI、SEO，属于典型中型任务。

### 第 1 步 propose 阶段

```bash
/opsx:propose 给面试题站点加收藏夹功能，登录用户可以收藏题目，能在个人中心查看
```

`Claude Code` 会拉起 `OpenSpec` 流程，引导你回答几个关键问题：

- 这个功能解决什么问题？（**proposal**）
- 目标用户是谁？典型使用路径？
- 不做会怎样？什么是「失败」？
- 哪些已有 capability 受影响？

产出 `openspec/changes/add-favorites/proposal.md`。

### 第 2 步 design 阶段

```bash
/opsx:continue
```

进入设计环节。`Claude Code` 会和你一起讨论：

- 数据存哪里？（Prisma 加 `Favorite` 表 vs 复用 `User.meta` JSON 字段）
- API 怎么设计？（REST `/api/favorites` vs Server Action）
- UI 入口在哪？（题目页面右上角按钮 / 个人中心 Tab）
- 鉴权怎么做？（已有 NextAuth session）
- SEO 怎么处理？（收藏页要不要进 sitemap）

每个决策都写进 `design.md`，并标明取舍理由。**这一步省略掉，三个月后你就忘了为什么不用 JSON 字段了**。

### 第 3 步 tasks 阶段

```bash
/opsx:continue
```

把 design 落到可执行任务：

```markdown
## Tasks

- [ ] T1: 扩展 Prisma schema，加 Favorite 模型与 User 关联
- [ ] T2: 实现 Server Action：addFavorite / removeFavorite / listFavorites
- [ ] T3: 题目页面加收藏按钮（shadcn Button + 收藏状态）
- [ ] T4: 个人中心新增 Tab：我的收藏
- [ ] T5: 收藏页支持分页 + 取消收藏
- [ ] T6: 更新 sitemap 排除个人收藏页（非公开内容）
- [ ] T7: 加 e2e 测试覆盖收藏 → 取消 → 列表
```

每条都是「可验证的成果」，不写「修改 src/xxx/yyy.tsx」这种实现细节。

### 第 4 步 brainstorm 收敛（可选）

如果 `design.md` 里有大决策没确定，调用 `superpowers` 的 `brainstorming` skill 探索 2-3 个方案，挑一个写回 `design.md`。**不要在 design 之后再 brainstorm**，那是返工信号。

### 第 5 步 writing-plans

```bash
# 调用 superpowers writing-plans skill
```

把 `tasks.md` 翻译成文件级、命令级的实施计划，落到 `openspec/changes/add-favorites/plan.md`（注：`OpenSpec` 项目下覆盖 `superpowers` 默认 `docs/superpowers/plans/` 路径）。

### 第 6 步 创建 worktree

```bash
# 调用 using-git-worktrees skill
```

把工作分支隔离到独立 worktree，避免主分支被脏掉。

### 第 7 步 executing-plans + TDD

```bash
# 调用 executing-plans skill
```

按 plan 执行，每个任务先写测试、再写实现。重要的是：**每个 subtask 完成立即跑 `yarn tsc`、`yarn lint`，不要攒到最后**。

### 第 8 步 跑 verification

```bash
yarn tsc && yarn lint && yarn build:feinterview-poetries-top
```

并真实输出全部日志。`superpowers` 的 `verification-before-completion` 会拦截「无证据声明完成」。

### 第 9 步 跑 /browse 或 /qa

UI 改动用 `/browse` 抽查关键路由（`/blog`、`/docs`、个人中心收藏 Tab），并切换移动端 UA。截图存档。

### 第 10 步 requesting-code-review

```bash
# 调用 superpowers requesting-code-review skill
```

开独立通道做 code review。**不要在同一上下文里合并 verification 和 review**，会互相污染判断。

### 第 11 步 ship

```bash
/ship
```

走 commit + push + PR，附验证证据和截图。这一步必须用户明确确认，不能 AI 自决。

### 第 12 步 land-and-deploy

```bash
/land-and-deploy
```

CI 通过后合并 + 部署。腾讯云 Docker 链路本地跑 `yarn deploy:local:feinterview-poetries-top`。

### 第 13 步 archive

```bash
/opsx:archive
```

变更归档到 `openspec/changes/archive/2026-05-18-add-favorites/`，主 `specs/favorites/spec.md` 同步更新。**这一步是 SDD 闭环的关键**：今天的变更变成下一次的事实来源。

## 五、什么时候走 SDD，什么时候直接做

不是所有任务都值得走 13 步。判定标准只有一条：**变更是否影响对外可观察行为、接口契约、数据形状或公共 API？**

| 任务类型 | 典型场景 | 推荐 |
| --- | --- | --- |
| 只读 | 解释代码 / 排查 bug 但不改 | 直接答 |
| 轻量 | 文案、配置、单点 bug、内部重构 | 跳过 `OpenSpec`，直接实现 + 定向验证 |
| 中等 | 新功能、明确重构、API 改动 | 走 `OpenSpec`，简化版流程（spec + 短 plan + 实现 + 验证） |
| 重量 | 跨模块、新架构、公共 API、部署形态变更 | 完整 13 步 |

具体例子：

- ✅ **轻量**：修一个 `border-radius` 样式问题 → 直接改
- ✅ **轻量**：补一个英文翻译 → 直接改
- ⚠️ **中等**：给现有 API 加一个新字段 → 走 `OpenSpec`（影响契约）
- ⚠️ **中等**：把 antd 表单换成 shadcn → 走 `OpenSpec`（影响 UI 形态）
- 🔥 **重量**：加完整鉴权体系 → 13 步完整流程
- 🔥 **重量**：从 Pages Router 迁到 App Router → 13 步完整流程

## 六、常见反模式

下面这些坑社区里反复出现，避开能省 80% 的返工。

### 反模式 1：用 OpenSpec 写所有任务

「我要严谨，所以每个改动都走 spec」。结果改一个错别字花 30 分钟。

**修复**：影响对外行为才走 spec。其他直接做。`OpenSpec` 是工具不是宗教。

### 反模式 2：proposal 和 design 写串

`proposal.md` 里塞架构图，`design.md` 里写「为什么我们需要这个功能」。两份文档都看不下去。

**修复**：`proposal` 答「为什么」，`design` 答「怎么做」。一句话错位都不行。

### 反模式 3：tasks 写成文件级 plan

「修改 src/app/api/favorites/route.ts 加 POST handler」—— 这是 plan 不是 task。

**修复**：`tasks.md` 写用户视角的可验证成果。文件级步骤交给 `writing-plans`。

### 反模式 4：跳过 archive

每次变更上线就忘了归档。半年后 `openspec/changes/` 一坨没归档的烂账。

**修复**：`/ship` 之后必跑 `/opsx:archive`。把它列入 Change Delivery Gate。

### 反模式 5：实施中发现规范错了还硬扛

写代码时发现 `design.md` 的接口契约和实际不可行，但因为「已经评审过」不改 spec，强行让代码绕一圈。

**修复**：回退到 `design.md` 修订，再继续。规范是活的，不是石碑。

### 反模式 6：把 OpenSpec、superpowers、gstack 视作三个并列工具

「我开三个会话同时跑」结果三套上下文打架。

**修复**：三者是**职责分层**，不是并列。同一任务里按规范层 → 流程层 → 执行层串行流转，靠文件和命令传递信息。

## 七、刚需还是过度工程

这是社区里争议最大的问题。引用 [heyuan110 的实践总结](https://www.heyuan110.com/zh/posts/ai/2026-04-09-claude-code-openspec-superpowers/)，加上我自己的判断：

| 场景 | 推荐组合 | 理由 |
| --- | --- | --- |
| < 2 小时原型 / Demo | 仅 `Claude Code` | 需求未定，spec 无价值 |
| 2-8 小时个人功能 | `Claude Code` + `superpowers` | TDD 防翻车，无需决策追溯 |
| 4-16 小时团队功能 | 三件套全用 | 多人协作需对齐与记录 |
| 跨团队 / 长生命周期 | 三件套 + 治理 hooks + 审计 | 决策可追溯是核心价值 |

更通用的建议：**从「`Claude Code` + `superpowers`」双件套起步，等遇到「决策追溯成为真实瓶颈」再加 `OpenSpec`**。一开始就上三件套容易把流程做成枷锁。

## 八、一份可复制的 CLAUDE.md 片段

下面这段可以直接放到你项目的 `CLAUDE.md` 里：

```markdown
## 三件套分工

按全局规则的三层分工：

- **OpenSpec** —— 规范层（proposal / design / tasks），影响对外行为时必须
- **superpowers** —— 思考层（plan / brainstorm / debug / TDD / review / verify）
- **gstack** —— 执行层（browser / QA / ship / canary）

## 文档落盘位置

当工作目录里存在 `openspec/` 时，所有规范、设计、计划文档必须落到
`openspec/changes/<change-id>/` 下：

| superpowers 默认路径 | OpenSpec 项目下应改为 |
|---|---|
| `docs/superpowers/specs/<topic>-design.md` | `openspec/changes/<id>/design.md` |
| `docs/superpowers/plans/<feature>.md` | `openspec/changes/<id>/tasks.md` 或 plan.md |
| —— | `openspec/changes/<id>/proposal.md` |
| —— | `openspec/changes/<id>/specs/<capability>/spec.md` |

## 任务分流

变更是否影响对外可观察行为 / 接口契约 / 数据形状 / 公共 API？

- 是 → 走 OpenSpec `/opsx:propose`
- 否 → 跳过 spec，直接实现 + 定向验证

## 双向回退

1. 编码中发现规范遗漏或错误 → 回退到 OpenSpec 更新 `design.md`
2. review / QA 发现：
   - 行为偏差（实现没按设计走）→ 就地修复
   - 契约错误（设计本身错了）→ 回退到 `design.md`
```

## 九、失败逃生通道

工作流卡住时有几条退路，别死磕：

- **OpenSpec 三轮迭代仍无定论** → 升级人类决策，停下来用 `AskUserQuestion`，不要继续改 design
- **E2E / 集成测试反复 flaky** → 标记 flaky，隔离到独立 suite，单独排查根因，不阻塞当前 PR
- **subagent 报告冲突或 race condition** → 立刻 fallback 到串行执行
- **review 反复 ping-pong** → 三轮以上未收敛时，把分歧点列出来交给用户裁决
- **某个 skill 反复失败** → 不要在同一会话里反复重试同一命令，换更小切片或人工介入

## 总结

`Claude Code` 加 `OpenSpec` 不是「让流程更复杂」，而是**让 AI 编程从临场发挥进化到工程化交付**。它的价值在三件事：

1. **规范先行让需求理解收敛**：避免「实现完才发现理解错了」
2. **决策留痕让团队能追溯**：避免「三个月后没人记得为什么这么做」
3. **职责分层让流程能扩展**：规范、流程、执行各管各的，互不污染

但记住一条：**工具是手段，不是目的**。轻量任务直接做，中等任务简化跑，重型任务完整闭环。一开始就上完整流程是过度工程，遇到瓶颈再升级才是工程化的真实节奏。

最朴素的判断只有一句话：**变更是否影响对外行为？是 → 走 spec；否 → 直接做**。把这条用熟，三件套的边界就清楚了。

## 参考

- [OpenSpec GitHub](https://github.com/Fission-AI/OpenSpec)
- [OpenSpec 官方文档与命令清单](https://github.com/Fission-AI/OpenSpec#readme)
- [Claude Code 官方文档](https://docs.claude.com/en/docs/claude-code)
- [Claude Code + OpenSpec + Superpowers 三件套到底是刚需还是过度工程](https://www.heyuan110.com/zh/posts/ai/2026-04-09-claude-code-openspec-superpowers/)
- [重新认识 Claude Code 架构治理与团队工程化实战全景](https://feinterview.poetries.top/blog/claude-code-engineering-architecture-governance)
