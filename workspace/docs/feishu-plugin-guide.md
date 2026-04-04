# OpenClaw 飞书官方插件使用指南

## 概述

飞书官方插件让 OpenClaw 可以直接以**用户身份**操作飞书：
- 💬 消息：读取历史、发送消息、搜索、下载图片/文件
- 📄 文档：创建、更新、读取云文档
- 📊 多维表格：创建/管理 App、数据表、字段、记录（增删改查、批量操作、高级筛选）
- 📊 电子表格：创建、编辑、查看
- 📅 日历日程：日历管理、日程管理、参会人管理、忙闲查询
- ✅ 任务：任务管理、清单管理、子任务、评论

## 高级配置

### 流式输出
```shell
openclaw config set channels.feishu.streaming true
```

### 多任务并行（话题独立上下文）
```shell
openclaw config set channels.feishu.threadSession true
```

### 群回复模式

**模式1：仅响应主人 @机器人的消息（推荐）**
```json
{
  "channels": {
    "feishu": {
      "requireMention": true,
      "groupPolicy": "allowlist",
      "groupAllowFrom": ["ou_主人openid"]
    }
  }
}
```

**模式2：只有 @机器人才回复，响应所有人**
```shell
openclaw config set channels.feishu.requireMention true --json
```

**模式3：不用 @，所有消息都回复（慎用！）**
```shell
openclaw config set channels.feishu.requireMention false --json
```

**模式4：特定群不同规则**
```json
{
  "channels": {
    "feishu": {
      "requireMention": "open",
      "groups": {
        "oc_特定群ID": { "requireMention": true }
      }
    }
  }
}
```

## 诊断命令

在对话中发送：
- `/feishu start` - 确认安装成功
- `/feishu doctor` - 检查配置
- `/feishu auth` - 批量完成用户授权

命令行：
```shell
npx @larksuite/openclaw-lark doctor
npx @larksuite/openclaw-lark doctor --fix
npx @larksuite/openclaw-lark info
```

## 升级插件

```shell
npx -y @larksuite/openclaw-lark update
```

## 常见问题

### 权限不足
1. 飞书开放平台 → 权限管理 → 批量导入权限
2. 导入所需权限 scopes
3. 发布应用

### 以用户身份发消息
需额外开通 `im:message.send_as_user` 权限，部分企业不支持。

## 安全提示

- AI 可能存在"幻觉"
- 部分操作不可逆转
- 发送/修改等重要操作务必先预览再确认
- 建议先用个人账号测试

---

*来源：https://bytedance.larkoffice.com/docx/MFK7dDFLFoVlOGxWCv5cTXKmnMh*