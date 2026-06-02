# Errors

Command failures and integration errors.

---

## [ERR-20260603-001] jq_cron_jobs_shape

**Logged**: 2026-06-03T00:04:00+08:00
**Priority**: low
**Status**: resolved
**Area**: config

### Summary
Initial jq patch assumed `../cron/jobs.json` was a top-level array, but it is an object with a `jobs` array.

### Error
```text
jq: error (at ../cron/jobs.json:59): Cannot index number with string "name"
```

### Context
- Task was to update the `backup-github-repo` cron model.
- Incorrect filter used `.[] | select(.name == "backup-github-repo")`.
- Correct filter is `.jobs[] | select(.name == "backup-github-repo")`.
- The failed command did not write back because the `mv` was guarded behind `&&`.

### Suggested Fix
Inspect JSON shape before patching cron storage, or use `openclaw cron edit <id> --model <model>` as the canonical update path.

### Metadata
- Source: error
- Related Files: `../cron/jobs.json`
- Tags: jq, cron, openclaw

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
