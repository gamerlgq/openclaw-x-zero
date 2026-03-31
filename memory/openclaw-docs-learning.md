# OpenClaw 文档学习计划

_创建时间: 2026-03-31_

---

## 学习大纲（共10个部分）

### Part 1: 核心概念 (Core Concepts)
- [ ] agent.md - Agent Runtime 运行机制
- [ ] session.md - Session Management 会话管理
- [ ] memory.md - Memory 记忆系统
- [ ] context.md - Context 上下文机制
- [ ] agent-loop.md - Agent Loop 消息循环
- [ ] queue.md - Command Queue 命令队列
- [ ] streaming.md - Streaming 流式输出
- [ ] compaction.md - Compaction 历史压缩

**学习目标**: 理解我如何运行、会话如何管理、记忆如何持久化

---

### Part 2: Gateway 架构
- [ ] architecture.md - Gateway 敶体架构
- [ ] gateway.md - Gateway CLI 命令
- [ ] config.md - 配置管理
- [ ] configuration-reference.md - 配置参考
- [ ] protocol.md - Gateway 协议
- [ ] security.md - 安全机制
- [ ] heartbeat.md - 心跳机制

**学习目标**: 理解 Gateway 如何运行、如何配置、安全机制

---

### Part 3: CLI 命令
- [ ] cli/sessions.md - sessions 命令
- [ ] cli/cron.md - cron 命令
- [ ] cli/hooks.md - hooks 命令
- [ ] cli/plugins.md - plugins 命令
- [ ] cli/flows.md - flows 命令
- [ ] cli/doctor.md - doctor 诊断命令
- [ ] model.md - 模型配置

**学习目标**: 掌握所有 CLI 命令，能够自我管理

---

### Part 4: 自动化系统
- [ ] automation/index.md - 自动化概述
- [ ] cron-jobs.md - Cron Jobs 定时任务
- [ ] heartbeat.md - Heartbeats 心跳
- [ ] cron-vs-heartbeat.md - Cron vs Heartbeat 对比
- [ ] standing-orders.md - Standing Orders 固定指令
- [ ] hooks.md - Hooks 事件触发
- [ ] tasks.md - Background Tasks
- [ ] clawflow.md - ClawFlow 流程

**学习目标**: 理解如何设置自动化任务、定时汇报

---

### Part 5: Skills 系统
- [ ] skills/index.md → tools/skills.md - Skills 概述
- [ ] skill-creator skill - 创建 Skills
- [ ] 查看已安装的 Skills

**学习目标**: 理解 Skills 如何工作、如何创建新 Skills

---

### Part 6: Plugins 系统
- [ ] plugins/index.md → plugin.md - Plugins 概述
- [ ] plugins/architecture.md - Plugins 架构
- [ ] plugins/bundles.md - Plugins Bundles

**学习目标**: 理解 Plugins 扩展机制

---

### Part 7: Channels 通道
- [ ] channels/index.md - Channels 概述
- [ ] channels/feishu.md - 飞书通道 (当前使用)
- [ ] channels/discord.md - Discord 通道
- [ ] channels/telegram.md - Telegram 通道
- [ ] channels/signal.md - Signal 通道
- [ ] channels/whatsapp.md - WhatsApp 通道
- [ ] channels/imessage.md - iMessage 通道

**学习目标**: 理解各通道配置和使用

---

### Part 8: Nodes 节点
- [ ] nodes/index.md - Nodes 概述

**学习目标**: 理解 Node 连接和配对

---

### Part 9: 部署和运维
- [ ] install/docker.md - Docker 部署
- [ ] help/faq.md - FAQ
- [ ] help/troubleshooting.md - 故障排除

**学习目标**: 理解部署方式和常见问题解决

---

### Part 10: 实践演练
- [ ] 实际运行 `openclaw gateway status`
- [ ] 实际运行 `openclaw doctor`
- [ ] 实际查看配置文件
- [ ] 设置定时汇报 cron job
- [ ] 创建一个自定义 Skill

**学习目标**: 将知识转化为实际能力

---

## 学习进度

| Part | 状态 | 完成时间 | 汇报摘要 |
|------|------|----------|----------|
| 1 | ✅ 已完成 | 2026-03-31 22:10 | 核心：Agent循环、Session管理、Memory系统、Context构建、Queue队列、Streaming流式输出、Compaction压缩 |
| 2 | ✅ 已完成 | 2026-03-31 22:12 | Gateway架构、CLI命令、配置管理、协议、安全机制、心跳机制 |
| 3 | ✅ 已完成 | 2026-03-31 22:14 | CLI命令：sessions、cron、hooks、plugins、flows、doctor、model配置 |
| 4 | ✅ 已完成 | 2026-03-31 22:16 | 自动化：Cron Jobs、Heartbeats对比、Standing Orders、Hooks事件触发、Tasks后台任务、ClawFlow流程层 |
| 5 | ✅ 已完成 | 2026-03-31 22:18 | Skills系统概述、skill-creator Skill创建指南 |
| 6 | ✅ 已完成 | 2026-03-31 22:20 | Plugins架构、Bundles(Codex/Claude/Cursor格式)、MCP映射 |
| 7 | ✅ 已完成 | 2026-03-31 22:22 | Channels：飞书、Discord、Telegram、Signal、WhatsApp、iMessage配置和使用 |
| 8 | ✅ 已完成 | 2026-03-31 22:24 | Nodes：节点连接和配对机制、QR码/手动连接 |
| 9 | ✅ 已完成 | 2026-03-31 22:26 | 部署：Docker部署、FAQ常见问题、Troubleshooting故障排除 |
| 10 | ✅ 已完成 | 2026-03-31 22:30 | 实践演练：Gateway运行正常、doctor诊断完成、配置已查看、定时汇报cron已设置、自定义Skill已创建 |

---

## 汇报机制

- **频率**: 每完成一个 Part 汇报一次
- **方式**: 通过飞书消息发送进度摘要
- **存储**: 更新此文件的进度表 + MEMORY.md

---

_学习完成后，我将具备完整的自我管理能力。_