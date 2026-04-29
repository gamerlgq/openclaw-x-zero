# MEMORY.md - 长期记忆

_这里记录重要的事情、偏好、决定、教训_

---

## OpenClaw 文档学习

- **文档库位置**: `/home/ubuntu/.openclaw/workspace/docs/openclaw-docs/` (1.4MB)
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

## 飞书私聊绑定

- **当前**: 用户 ou_22bcccc95a09d7521b0d7a59992738da 绑定到 agent:main
- **通道**: feishu accountId: default

---

## 小游戏投放知识库

- **位置**: `docs/mini-game-ad/`
- **文件**:
  - `knowledge-base.md` — 平台概览、投放流程、激励政策、市场数据、SDK 索引
  - `api-examples.md` — Token获取、创建广告、转化回传的完整 curl 示例
- **覆盖**: 微信小游戏（腾讯广告 Marketing API）+ 抖音小游戏（巨量引擎开放平台 API）
- **触发关键词**: 小游戏投放/买量、腾讯广告API、巨量引擎、oCPM/ROI出价、转化回传、IAA/IAP激励
- **待补充**: 数据归因与回传配置细节、素材审核规则、出价策略优化、跨平台联合买量

---

*每次会话结束，我会自动更新这个文件。*