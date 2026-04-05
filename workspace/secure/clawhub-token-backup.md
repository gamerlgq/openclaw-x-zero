# ClawHub API Token 备份

## Token 信息
- **Token**: `clh_ga8Sl7JgBSo61qQsNIpL-G2uBPEo1-0kQEwynIqMxYM`
- **账户**: @gamerlgq
- **获取时间**: 2026-04-05 20:31
- **测试状态**: ✅ 已验证可用（退出后重新登录成功）

## 验证命令
```bash
# 验证 token 是否有效
clawhub whoami

# 使用 token 登录
clawhub login --token "clh_ga8Sl7JgBSo61qQsNIpL-G2uBPEo1-0kQEwynIqMxYM" --no-browser
```

## 配置文件位置
- 主配置: `~/.config/clawhub/config.json`
- 备份位置: 本文件

## 安全注意事项
1. 此 token 具有账户访问权限
2. 不要分享或公开此 token
3. 如果怀疑泄露，立即在 ClawHub 设置中撤销
4. 定期验证 token 有效性

## 使用场景
1. 安装技能: `clawhub install <skill-name>`
2. 更新技能: `clawhub update`
3. 搜索技能: `clawhub search <query>`
4. 发布技能: `clawhub publish <path>`

## 测试记录
- 2026-04-05 20:31: 首次获取 token
- 2026-04-05 20:36: 退出后重新登录成功 ✅
- 2026-04-05 20:36: 安装 self-improving-agent 成功 ✅

## 重要提醒
此 token 很可能是长期有效的 API token，除非手动撤销，否则不会自动过期。