# OpenClaw Docs Learning Report Skill

_自动汇报 OpenClaw 文档学习进度_

## Description

定期汇报 OpenClaw 文档学习进度，检查学习进度文件并发送汇报消息。

## Trigger

- 用户要求汇报学习进度
- cron job 定时触发学习进度汇报

## Steps

1. 读取 `memory/openclaw-docs-learning.md` 文件
2. 检查进度表，汇总已完成的 Part
3. 发送进度汇报消息到当前通道

## Output Format

```
📚 OpenClaw 文档学习进度汇报

已完成：X/10 Parts
当前进度：Part X (状态)

学习摘要：
- Part 1: ...
- Part 2: ...
...

下一步：继续学习 Part X
```

## Notes

- 进度文件路径: `memory/openclaw-docs-learning.md`
- 汇报频率: 每小时一次（cron job）