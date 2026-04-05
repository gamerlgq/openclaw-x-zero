# Git 别名配置

已设置的 git 别名，可以大大提高工作效率。

## 基础别名

| 别名 | 命令 | 说明 |
|------|------|------|
| `git st` | `git status` | 查看状态 |
| `git ci` | `git commit` | 提交 |
| `git co` | `git checkout` | 切换分支 |
| `git br` | `git branch` | 分支管理 |
| `git aa` | `git add -A` | 添加所有更改 |
| `git cm` | `git commit -m` | 提交并添加消息 |
| `git df` | `git diff` | 查看差异 |
| `git ds` | `git diff --staged` | 查看暂存区差异 |
| `git pl` | `git pull` | 拉取更新 |
| `git ps` | `git push` | 推送更改 |

## 高级别名

| 别名 | 命令 | 说明 |
|------|------|------|
| `git lg` | `git log --oneline --graph --decorate --all` | 图形化日志 |
| `git last` | `git log -1 HEAD` | 查看最后一次提交 |
| `git undo` | `git reset --soft HEAD~1` | 撤销最后一次提交 |
| `git wip` | `git add -A && git commit -m "WIP"` | 快速保存工作进度 |

## 添加更多别名

### 方法1：命令行添加
```bash
# 添加新别名
git config --global alias.别名 "命令"

# 示例：添加撤销别名
git config --global alias.undo "reset --soft HEAD~1"
```

### 方法2：编辑配置文件
```bash
# 编辑全局配置
vim ~/.gitconfig

# 在 [alias] 部分添加
[alias]
    st = status
    ci = commit
    co = checkout
    br = branch
    # ... 其他别名
```

## 常用工作流

### 1. 日常提交
```bash
git st          # 查看状态
git aa          # 添加所有更改
git cm "提交信息" # 提交
git ps          # 推送
```

### 2. 查看历史
```bash
git lg          # 图形化查看历史
git last        # 查看最后一次提交
```

### 3. 快速保存
```bash
git wip         # 快速保存工作进度（WIP = Work In Progress）
```

## 查看当前别名
```bash
# 查看所有别名
git config --global --list | grep alias

# 查看特定别名
git config --global alias.别名
```

## 删除别名
```bash
git config --global --unset alias.别名
```

## 建议添加的别名
```bash
# 清理未跟踪文件
git config --global alias.cleanup "clean -fd"

# 查看远程仓库
git config --global alias.remote "remote -v"

# 简化的日志
git config --global alias.logs "log --oneline -10"

# 暂存当前更改
git config --global alias.save "stash"

# 恢复暂存
git config --global alias.restore "stash pop"
```

这些别名会显著提高你的 git 工作效率！