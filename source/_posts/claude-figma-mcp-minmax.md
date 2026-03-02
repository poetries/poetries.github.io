---
title: 基于Claude Code + MinMax + Figma MCP高精度还原设计稿
date: 2026-03-02 21:20:00
description: 详解如何使用Claude Code配合MinMax大模型和Figma MCP实现设计稿到代码的高精度自动还原，大幅提升前端开发效率
tags:
  - Claude
  - AI 工具
  - 提示词工程
  - 效率提升
  - Agent
  - Figma
  - MinMax
categories: AI
---

本文详细介绍如何通过 Claude Code + MinMax + Figma MCP 的组合方案，实现设计稿到代码的高精度自动还原。

## 安装 Figma MCP

首先在终端中执行以下命令安装 Figma MCP：

```bash
claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp
```

安装完成后，使用 `claude mcp list` 查看已安装的 MCP 列表：

![](https://s.poetries.top/uploads/2026/03/415ed438e1b1e769.png)

## 授权 Figma 账户

MCP 安装成功后，需要在 Claude Code 界面中完成 Figma 账户的授权操作。点击授权按钮后会跳转到 Figma 官网的 OAuth 页面，登录并确认授权即可。

![](https://s.poetries.top/uploads/2026/03/da22995d65af2d99.png)

![](https://s.poetries.top/uploads/2026/03/5bdd1d4c83d93146.png)

授权成功后，MCP 即可正常连接并读取你的 Figma 文件：

![](https://s.poetries.top/uploads/2026/03/63ea70d820fc7da8.png)

## 配置 MinMax 模型（可选）

如果你希望降低 API 调用成本，可以在 Claude Code 中配置 MinMax 作为模型供应商。使用 `claude switch` 命令调出模型切换面板，添加新的供应商：

![](https://s.poetries.top/uploads/2026/03/4ffa433b7d7e8912.png)

详细配置步骤可参考 [MinMax 官方文档](https://platform.minimaxi.com/docs/guides/text-ai-coding-tools#%E5%AE%89%E8%A3%85-claude-code)。

## 使用 Figma MCP 还原设计稿

接下来演示如何使用 Figma MCP 从设计稿自动生成代码。

### 选择目标设计稿

本示例使用的是 Figma Community 上的一个咖啡馆落地页设计稿：

- [设计稿地址](https://www.figma.com/files/team/1578338715267053469/resources/community/file/1444331896024589155?fuid=1578338713432883311)

打开设计稿后，点击【Open in Figma】进入画布页面：

![](https://s.poetries.top/uploads/2026/03/7dc808eb2ec0ba78.png)

### 获取设计元素链接

在 Figma 画布中选择你想要复刻的 Layer 层或 Frame，点击右键选择【Copy link to selection】获取元素链接：

![](https://s.poetries.top/uploads/2026/03/f93117a0957eac99.png)

### 调用 Claude Code 生成代码

切换到 Claude Code 界面，输入以下提示词即可自动还原设计稿：

```
请使用Figma MCP，在 @test.html 页面还原落地页设计：https://www.figma.com/design/zZQZmhP0lSw4OeCsBvuzFG/Bean-Scene-Coffee--Community-?node-id=1-4&t=2TnBNPKQMGuHxi8w-4
```

> 注意：提示词中的 `@test.html` 指定了输出文件名，Figma 链接包含了文件 ID 和节点 ID 信息，MCP 会据此解析设计元素属性并生成对应代码。

MCP 会自动读取设计稿的颜色、字体、间距等属性，并生成对应的 HTML 和 CSS 代码：

![](https://s.poetries.top/uploads/2026/03/e36ec0df89daabaf.png)

![](https://s.poetries.top/uploads/2026/03/a0e0152712e0e967.png)

### 验证还原效果

代码生成完成后，打开生成的 test.html 文件查看效果：还原度还是很高的

![](https://s.poetries.top/uploads/2026/03/8a87a46853f9f488.png)


## 参考资料

- [Figma MCP Server 官方文档](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/#claude-code)
- [MinMax Claude Code 接入指南](https://platform.minimaxi.com/docs/guides/text-ai-coding-tools#%E5%AE%89%E8%A3%85-claude-code)
