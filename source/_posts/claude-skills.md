---
title: Claude Skills：如何将提示词升级为可复用技能
date: 2026-02-23 20:20:00
description: 深入解析 Claude Skills 的核心原理、渐进披露架构和最佳实践，手把手教你创建自定义技能，实现从临时提示词到可复用资产的升级。
tags:
  - Claude
  - AI 工具
  - 提示词工程
  - 效率提升
  - Agent
categories: AI
---

> 阅读完本文你将掌握：Claude Skills 的核心概念与渐进披露原理、官方 Skills 的启用方法、自定义 Skills 的创建流程，以及 Skills 与 Projects、Subagents、MCP 的协同工作方式。

## 痛点与解决方案

在日常使用 `Claude` 的过程中，你是否经常遇到这些困扰：每次让 `Claude` 生成品牌宣传材料，都要重新解释一遍品牌规范；每次做数据分析，都要重复强调输出格式和注意事项；换了一个对话窗口，之前积累的「最佳实践」全部丢失。这些问题都指向同一个根本原因：**纯提示词模式的局限性**。

当你依赖对话中的即时指令时，`Claude` 无法跨对话保持一致性，也难以处理需要精确执行的复杂任务。传统方式下，让 `Claude` 画图，它只能生成简单的 `HTML` 页面，输出质量完全不可控。

**`Claude Skills`** 正是为解决这些问题而设计。它将「临时起意的提示词」升级为「可以积累的技能资产」，让你能够把专业经验、工作流程和偏好设置持久化地沉淀下来。使用 `Skills` 后，`Claude` 会调用 `Python` 代码执行精确的视觉渲染，输出质量更稳定、可控。

## Skills基础知识

### 什么是Skills

> Agent Skills 是扩展 Claude 功能的模块化能力。每个 Skill 打包了指令、元数据和可选资源（脚本、模板），Claude 会在相关时自动使用它们

- [Claude: Agent Skills](https://platform.claude.com/docs/zh-CN/agents-and-tools/agent-skills/overview)
- [Codex: Agent Skills](https://developers.openai.com/codex/skills)
- [Cursor：Agent Skills](https://cursor.com/cn/docs/context/skills#agent-skills)

### 为什么使用 Skills

`Skills` 是可重用的、基于文件系统的资源，为 `Claude` 提供特定领域的专业知识：工作流程、上下文和最佳实践，将通用型智能体转变为专家。与提示词（用于一次性任务的对话级指令）不同，`Skills` 按需加载，消除了在多个对话中重复提供相同指导的需要

**主要优势：**

- 专业化 Claude：为特定领域任务定制能力
- 减少重复：创建一次，自动使用
- 组合能力：组合 Skills 构建复杂工作流程

### Skills 架构

Skills 在代码执行环境中运行，Claude 在该环境中拥有文件系统访问、bash 命令和代码执行能力。可以这样理解：Skills 作为目录存在于虚拟机上，Claude 使用与您在计算机上浏览文件相同的 bash 命令与它们交互。

![](https://s.poetries.top/uploads/2026/03/8c274a2fc57dad1a.png)

### Skills 的核心原理：渐进披露架构

理解 `Skills` 的技术设计，有助于更好地使用它。

`Claude Skills` 采用了一种名为「渐进披露」（Progressive Disclosure）的架构设计。这意味着 `Claude` 不会一次性加载所有技能信息，而是根据任务需要分三层逐步加载。

### 第一层：元数据扫描

当 `Claude` 接收到任务时，它会先扫描所有已安装 `Skills` 的简短描述（约 100 tokens）。这一层的目的是快速判断当前任务与哪些 `Skill` 相关。这个设计确保了 `Claude` 能够快速筛选出可能需要的技能，而不会被大量的技能信息所淹没。

### 第二层：完整说明加载

一旦确定某个 `Skill` 与任务相关，`Claude` 才会加载完整的 `SKILL.md` 文件（官方建议上限约 5k tokens）。这里包含详细的步骤流程、注意事项、输出格式要求和风格偏好。这个层面才是技能的核心定义区域。

### 第三层：代码与资源按需加载

某些 `Skill` 还附带脚本、模板或参考文件。`Claude` 只在真正需要执行相关操作时，才会将这些内容纳入上下文。这种按需加载的方式极大地优化了上下文长度的使用效率。

这种设计的核心优势在于：**你可以安装数十个 Skills，而不会在每次对话开始时就被上下文长度限制压垮**。`Claude` 只会翻阅它认为有用的那本「操作手册」。

## 快速上手：启用官方 Skills

### 安装Skill

- 下载SKILL包后，在`~/.claude/skills`下导入`skill`文件

![](https://s.poetries.top/uploads/2026/03/1b07212169ff587a.png)

- 通过`skillsmp.com`市场来安装，找到合适的skill安装即可

![](https://s.poetries.top/uploads/2026/03/eb48ac7dfa895269.png)

### 官方 Skills 能做什么

`Anthropic` 提供了一系列开箱即用的官方 `Skills`，主要集中在文档处理领域。访问 [官方 Skills 仓库](https://github.com/anthropics/skills/tree/main) 可以查看完整的技能列表。

官方提供的核心 `Skills` 包括：

| 技能名称 | 功能描述                           | 适用场景           |
| -------- | ---------------------------------- | ------------------ |
| `docx`   | Word 文档的创建、编辑、审阅        | 合同流转、合规文档 |
| `pdf`    | PDF 文本提取、表格抽取、合并拆分   | 票据归档、数据抽取 |
| `pptx`   | PPT 布局调整、模板应用、图表生成   | 销售演示、周会汇报 |
| `xlsx`   | Excel 公式编写、格式设置、数据分析 | 报表生成、指标盘   |

## 创建你的第一个自定义 Skill

- 官方 `Skills` 虽然好用，但真正的价值在于创建符合你自身需求的定制技能。
- 创建`.claude/skills/frontend-design`文件夹
- 然后创建`SKILL.md`，将官方给的前端设计的skill粘贴进入

```mardown
---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
```

### 非程序员路径：引导式创建

即使你完全不懂编程，`Claude` 也提供了完整的引导流程：

1. 在对话中直接告诉 `Claude`：「我想创建一个 Skill，请引导我完成」
2. `Claude` 会启动专门的创建引导流程，询问你技能名称、功能描述、预期用途
3. 完成后系统会生成一个 `ZIP` 包
4. 在 `Skills` 设置页面点击上传安装

![](https://s.poetries.top/uploads/2026/03/b9c19bec1a1ddc9e.png)

### 程序员路径：本地自定义

对于有技术背景的用户，你可以手动创建 `Skill` 文件夹结构：

```bash
my-skill/
├── SKILL.md        # 技能说明文档（核心）
├── metadata.json   # 元数据配置
├── scripts/        # 可执行脚本
└── resources/      # 参考资源
```

**`SKILL.md` 是核心文件**，它定义了 `Skill` 的完整行为。基本的结构包括：

```markdown
---
name: 技能名称
description: 技能描述元数据
---

# 技能名称

## 触发条件

描述在什么情况下应该使用这个技能

## 执行步骤

1. 第一步做什么
2. 第二步做什么

## 输出要求

- 格式要求
- 风格要求
- 注意事项
```

### 如何触发Skills

- 我们可以直接用`/`开头，然后去触发对应的 Skills。这种一般是针对于这个 Skills 是重复直接执行的工作流

![](https://s.poetries.top/uploads/2026/03/be799e2a29bad872.png)

- AI主动触发关键字

如果你的提示词里面含有相关的关键字，这个关键词能够命中 `Skills` 的描述，那就会自动触发该 Skill。

- 直接说明（推荐）

最推荐的是直接说明我需要使用某个 Skill，来让 AI 精准的触发

![](https://s.poetries.top/uploads/2026/03/da959cdf5d6f6a84.png)

## Skills 与其他功能的协同

`Claude` 的功能生态并非孤立存在，理解它们之间的关系有助于构建更强大的工作流。

### Skills vs Prompts

这是最需要理清的一对概念。

**Prompts** 是对话中的即时指令，适合一次性任务和临时需求。它不会在不同对话之间自动保留。也就是说，你今天费心写了一个很长的「代码安全审计」提示词，明天开新对话，还得重新粘一遍。

**Skills** 是持久化的能力模块，适合需要反复使用的流程和标准。当你在多个对话中反复输入类似的指令时，就是该升级为 `Skill` 的信号。

一个简单的判断标准：**只说一次的事情用 Prompts，需要累计沉淀的经验用 Skills**。

### Skills vs Projects

**Projects** 提供的是「知识场景」——它解决的是「Claude 需要知道什么」。每个 `Project` 有独立的历史记录、知识库和项目级指令。

**Skills** 提供的是「能力模组」——它解决的是「Claude 应该怎么做」。`Skill` 是全局可用的，而 `Project` 只在特定项目空间内生效。

两者配合使用时，`Project` 负责提供背景知识，`Skill` 负责定义处理方法。

### Skills + Subagents + MCP 的组合拳

对于复杂任务，这三者可以协同工作：

- **MCP** 负责连接外部系统（数据库、文件、API）
- **Skills** 定义如何使用这些外部工具的流程
- **Subagents** 作为专职执行者，调用特定 `Skills` 完成子任务

例如，一个竞品分析 `Agent` 可以这样构建：`Subagent A` 负责市场调研（调用市场分析 `Skill`），`Subagent B` 负责技术分析（调用代码审查 `Skill`），两者通过 `MCP` 获取的外部数据完成各自职责。

## 典型应用场景

基于实际使用经验，以下场景特别适合使用 `Skills`：

### 场景一：品牌规范化管理

将品牌色彩、字体、版式、`LOGO` 使用规范封装为 `Skill`。每次生成营销材料时自动应用，无需重复叮嘱。

### 场景二：标准化文档流程

将合同审阅、数据报告、需求文档的格式标准写入 `Skill`。确保输出的一致性和专业性。

### 场景三：专业领域知识沉淀

将行业特定的分析框架、评审标准、最佳实践固化为 `Skill`。新成员加入后可直接使用团队积累的专业经验。

### 场景四：个人工作习惯

将你的笔记格式、代码风格偏好、研究方法论封装为 `Skill`。在任何对话中都能保持个人习惯的一致性。

## 最佳实践建议

### 从小处着手

不必追求一步到位的完美 `Skill`。先从最简单的重复性任务开始，积累经验后再扩展复杂流程。

### 保持 Skill 的专注性

一个 `Skill` 建议只专注解决一类问题。过于通用的 `Skill` 反而难以提供精准的指导。

### 定期迭代优化

随着使用经验的积累，你会逐渐发现 `Skill` 的不足之处。及时更新 `SKILL.md` 内容，让技能越来越好用。

### 善用渐进披露机制

不要在 `SKILL.md` 中堆积过多信息。只保留当前任务真正需要的流程和规则，其他细节可以通过 `Prompts` 临时补充。

## 推荐Skills

- frontend-design： https://skillsmp.com/zh/skills/anthropics-claude-code-plugins-frontend-design-skills-frontend-design-skill-md
- Nextjs-best-practices：https://skillsmp.com/zh/skills/xenitv1-claude-code-maestro-skills-nextjs-best-practices-skill-md
- tailwind-design-system：https://skillsmp.com/zh/skills/wshobson-agents-plugins-frontend-mobile-development-skills-tailwind-design-system-skill-md
- landing-page-guide-v2：https://skillsmp.com/zh/skills/bear2u-my-skills-claude-skills-landing-page-guide-v2-skill-md
- seo-review：https://skillsmp.com/zh/skills/leonardomso-33-js-concepts-opencode-skill-seo-review-skill-md
- ui-ux-pro-max： https://skillsmp.com/skills/nextlevelbuilder-ui-ux-pro-max-skill-claude-skills-ui-ux-pro-max-skill-md

## 总结

`Claude Skills` 代表了一种从「临时交互」到「能力积累」的范式转变。它不仅仅是一个功能升级，更是一种工作效率思维的进化。当你开始系统性地将重复性工作封装为 `Skills` 时，你会发现 `Claude` 从一个聊天助手，逐步变成了一个真正懂你、能够持续学习你工作方式的智能伙伴。

与其每次都从零开始，不如现在就开始构建你的第一个 `Skill`。

## 参考

- [skillsmp](https://skillsmp.com)
- [awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills)
- [anthropics/skills](https://github.com/anthropics/skills)
