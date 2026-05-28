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

## 代理配置（大陆服务器 + Clash）

- **服务器位置**: 大陆（腾讯云），需翻墙访问 OpenAI
- **Clash 代理**: `http://127.0.0.1:7890`
- **OpenClaw 代理配置**: `proxy.enabled: true`（当前开启，VMess 节点可用）
- **Clash 节点**: 已从 Trojan-SG 切换为 VMess-US（`190.92.207.174:39113`），旧配置备份为 `config.yaml.trojan.bak`
- **Clash Restart=always**: 防止进程静默退出
- **Clash 规则**: 国内 API + 飞书走 DIRECT，海外走 Proxy
- **⚠️ NO_PROXY Patch**: OpenClaw `proxy.enabled=true` 时会清空 `NO_PROXY`
  - 当前 patch 文件: `/home/ubuntu/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/proxy-lifecycle-CZCC_XuX.js`
  - 替换 `for (const key of NO_PROXY_ENV_KEYS) process.env[key] = "";` 为保留飞书+火山域名
  - **OpenClaw 升级后文件名会变，需重新查找并打 patch**
- **使用国内模型(opencode-go/glm-5.1等)时**: 不需要开代理，保持 `proxy.enabled=false` 也可以
- **使用海外模型(OpenAI/Codex)时**: 需要开代理，VMess 节点可用

## 火山引擎模型配置

- **Provider**: custom-ark-cn-beijing-volces-com
- **当前模型列表**:
  - MiniMax-M2.7 (alias: minimax-2.7)
  - Kimi-K2.6 (alias: kimi-2.6)
  - glm-5.1 (alias: ark-glm)
  - deepseek-v4-pro (alias: ark-deepseek-pro) ← 新增
  - deepseek-v4-flash (alias: ark-deepseek-flash) ← 新增
  - 已删除: Doubao-Seed-2.0-Code, Doubao-Seed-2.0-pro, Doubao-Seed-2.0-Lite
  - 已删除: deepseek-v3.2（确认原本就不存在）

## Codex 账号

- **旧账号**: `ggjky5ncq5@privaterelay.appleid.com` — 额度用完
- **当前账号**: `18664778270@163.com` — JWT 显示 free plan，用户声称有 98% 额度（可能 Codex 计费独立于 ChatGPT 网页端）
- **换号命令**: `openclaw onboard --auth-choice openai-codex`

## 换号/重建 checklist

1. `openclaw onboard --auth-choice openai-codex` 登录新账号
2. 确认 `proxy.enabled: true`（改 `openclaw.json`）
3. 确认 Clash 在运行 (`http://127.0.0.1:7890`)
4. 检查 NO_PROXY patch 是否还在（升级后需重新打）
5. 重启 gateway：`openclaw gateway restart`
6. 验证飞书 bot identity：日志 `bot open_id resolved` 不是 `unknown`
7. 验证 Codex 模型：飞书切换模型发消息测试

---

*每次会话结束，我会自动更新这个文件。*