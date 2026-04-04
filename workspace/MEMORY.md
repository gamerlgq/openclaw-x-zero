# MEMORY.md - 长期记忆

_这里记录重要的事情、偏好、决定、教训_

---

## OpenClaw 文档学习

- **文档库位置**: `/home/ubuntu/.openclaw/workspace/memory/openclaw-docs/` (1.4MB)
- **已保存**: concepts、gateway、automation、cli、channels 目录下所有 .md 文件
- **用法**: 直接从 memory/openclaw-docs/ 读取，无需每次去原始安装目录读

## 飞书插件

- **已安装**: OpenClaw 飞书官方插件 (2026.3.31)
- **能力**: 消息、文档、多维表格、电子表格、日历日程、任务
- **诊断命令**: `/feishu start`、`/feishu doctor`、`/feishu auth`
- **文档**: 已保存到 `docs/feishu-plugin-guide.md`
- **高级配置**: 流式输出、话题独立上下文、群回复模式

---

## 关于用户

- GitHub: gamerlgq
- 仓库: openclaw-x-zero
- **授权**: GitHub 仓库操作（已配置 SSH key，可直接 push/pull/创建），**删除仓库需要授权**
- **敏感操作**: 删除文件是重要操作，**必须先授权才能执行**
- **偏好**: 日常操作不要问确认，直接做

## 定时任务

- backup-github-repo: 每天 23:59 自动 git push 备份

---

## 多 Agent 架构讨论 (2026.4.4)

### 两种方案

**方案一**: 私人助理 + sessions_spawn 子 agent
- 子 agent 临时执行任务，完成后销毁
- **隔离**: 完全独立 session，不会污染父 agent 的 MEMORY.md
- **缺点**: 子 agent 没有 SOUL.md/个性化配置

**方案二**: 多个独立 agent (视频管理员、新闻管理员等)
- 每个 agent 有独立 workspace + agentDir + SOUL.md
- **通信**: `tools.agentToAgent` + `sessions_send`
- **文档共享**: 需要创建共享目录 `shared-output/`

### 推荐方案

混合方案：
```
用户 → 私人助理(agent:main) → sessions_send → 专业agent → 共享目录 → 私人助理回复
```

### 关键配置点

1. `tools.agentToAgent.enabled: true` + `allow: [...]`
2. 共享输出目录: `/home/ubuntu/.openclaw/shared-output/`
3. 每个 agent 用绝对路径访问共享目录
4. 视频管理员/新闻管理员需要第二个飞书机器人账号

---

## 飞书私聊绑定

- **当前**: 用户 ou_22bcccc95a09d7521b0d7a59992738da 绑定到 agent:main
- **通道**: feishu accountId: default

---

*每次会话结束，我会自动更新这个文件。*