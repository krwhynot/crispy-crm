---
description: Detect and resolve stuck background processes
argument-hint: "[optional: process-name or shell-id]"
allowed-tools: Skill, Bash(ps:*), Bash(lsof:*), Bash(netstat:*), Bash(ls:*), KillShell, Read, TodoWrite
---

# Stuck Process Detection

Use the `stuck-process-detection` skill to identify and resolve hung processes.

> **SKILL ACTIVATION:** Using `stuck-process-detection` skill to prevent infinite polling loops.

**FIRST:** Invoke `Skill("stuck-process-detection")` to activate guardrails before proceeding.

## Step 1: Process Survey

Scan for common development processes:

```bash
ps aux | grep -E "(node|vitest|playwright|supabase|npm|pnpm|tsx)" | grep -v grep | head -20
```

**Target:** $ARGUMENTS (or all dev processes if not specified)

## Step 2: Port Check

Check for processes holding common development ports:

```bash
lsof -i :5173,54321,54322,3000,8000 2>/dev/null || \
  netstat -tlnp 2>/dev/null | grep -E "5173|54321|54322|3000|8000"
```

| Port | Service |
|------|---------|
| 5173 | Vite dev server |
| 54321 | Supabase API |
| 54322 | Supabase Studio |
| 3000 | Next.js / Node |

## Step 3: Poll State Check

Check for poll counter state files (indicates stuck background monitoring):

```bash
ls -la .claude/hooks/state/bash-polls-*.count 2>/dev/null || echo "No poll counters found"
```

**Red flag:** Any counter file with value > 5 indicates infinite polling.

## Step 4: Stuck Pattern Detection

A process is considered **stuck** if any of these apply:

| Pattern | Indicator | Severity |
|---------|-----------|----------|
| Long runtime | Running >10 min without output | HIGH |
| Poll overflow | bash-polls-*.count > 5 | CRITICAL |
| Zombie | Process state = Z | HIGH |
| Port conflict | Multiple processes on same port | MEDIUM |
| No output | 3+ consecutive empty BashOutput results | HIGH |

## Step 5: Resolution Actions

| Scenario | Action |
|----------|--------|
| Known shell ID | `KillShell` tool with `shell_id` parameter |
| Multiple stuck | `just reset` (kills all dev processes) |
| Specific process | `pkill -f "vitest"` (targeted kill) |

## Output Format

```markdown
## Stuck Process Report

**Processes Scanned:** [count]
**Stuck Detected:** [yes/no]

### Findings
| Process | PID | Runtime | Status | Action |
|---------|-----|---------|--------|--------|

### Recommended Action
[Specific command or KillShell invocation]

### Root Cause
[Why the process got stuck - timeout, missing deps, infinite loop, etc.]
```

## Related Commands

- `/troubleshooting` - General debugging
- `/quick-test` - Run tests with proper timeouts
