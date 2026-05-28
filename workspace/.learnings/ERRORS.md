# Errors

Command failures and integration errors.

---

## [ERR-20260528-001] openclaw_agents_set_identity

**Logged**: 2026-05-28T15:24:00+08:00
**Priority**: low
**Status**: resolved
**Area**: config

### Summary
`openclaw agents set-identity --agent <id> --from-identity` reads the default workspace unless `--workspace` is supplied.

### Error
```text
No identity data found in ~/.openclaw/workspace/IDENTITY.md.
```

### Context
- Attempted to set identity for `story-director`.
- The agent's `IDENTITY.md` existed under `/home/ubuntu/.openclaw/workspace-story-director`.
- Fix was to run with `--workspace /home/ubuntu/.openclaw/workspace-story-director`.

### Suggested Fix
For non-main agents, always pass the agent workspace explicitly:

```bash
openclaw agents set-identity --agent <id> --workspace <workspace-dir> --from-identity
```

### Metadata
- Reproducible: yes
- Related Files: `docs/openclaw-docs/agents.md`

---
