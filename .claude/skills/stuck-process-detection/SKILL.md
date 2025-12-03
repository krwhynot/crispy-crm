---
name: stuck-process-detection
description: Prevents infinite polling loops when monitoring background shells. Triggers when running tests, builds, or long processes. Enforces timeout limits, max poll attempts, and foreground preference. Integrates with KillShell for stuck process recovery.
---

# Stuck Process Detection & Recovery

## Purpose

Prevent the agent from entering infinite polling loops when waiting for background shell output that never arrives. This is a common failure mode when:
- A test suite hangs
- A build process is stuck
- A server fails to start
- A command exits with no output

## When This Skill Activates

### Trigger Conditions (ANY of these)

| Condition | Example |
|-----------|---------|
| Running tests in background | `npm test`, `vitest`, `playwright test` |
| Starting long builds | `npm run build`, `tsc`, `webpack` |
| Starting dev servers | `npm run dev`, `npm start` |
| Any `run_in_background: true` bash call | Launching background processes |
| Multiple consecutive BashOutput calls | Agent polling repeatedly |

### Keywords That Trigger This Skill

- `run_in_background`
- `background`
- `BashOutput`
- `wait for`
- `check output`
- `poll`
- `monitoring`
- `long-running`
- `tests running`
- `build running`
- `server starting`

---

## The Anti-Pattern (What We're Preventing)

```
// BAD - Infinite polling loop
agent: "Let me run tests in background"
Bash(run_in_background: true): npm test
BashOutput: (No content)
BashOutput: (No content)
BashOutput: (No content)
... repeats 50+ times ...
agent: "Let me wait a bit longer"
BashOutput: (No content)
... forever ...
```

---

## The Correct Pattern

### Rule 1: Prefer Foreground with Timeout

For most operations, run in foreground with explicit timeout:

```typescript
// CORRECT - Foreground with timeout
Bash({
  command: "npm test -- --reporter=verbose",
  timeout: 120000,  // 2 minutes
  description: "Run unit tests"
})
```

### Rule 2: If Background Required, Set Max Polls

When background is truly needed (e.g., dev server):

```typescript
// Step 1: Start in background
Bash({
  command: "npm run dev",
  run_in_background: true,
  description: "Start dev server"
})

// Step 2: Poll with strict limit (MAX 5 attempts)
let attempts = 0;
const MAX_ATTEMPTS = 5;

while (attempts < MAX_ATTEMPTS) {
  const output = BashOutput({ bash_id: shellId });
  if (output.includes("ready") || output.includes("listening")) {
    // Success - proceed
    break;
  }
  if (attempts >= MAX_ATTEMPTS) {
    // STOP polling - investigate or kill
    KillShell({ shell_id: shellId });
    throw new Error("Process did not start within expected time");
  }
  attempts++;
}
```

### Rule 3: Detect Stuck After 3 Empty Outputs

If you get **3 consecutive empty BashOutput results**, STOP and:

1. **Check if process is alive**: `ps aux | grep <process>`
2. **Kill the stuck shell**: `KillShell({ shell_id: "..." })`
3. **Try foreground instead**: Re-run with timeout, not background
4. **Investigate the failure**: Don't just retry

---

## Recovery Actions

### When Stuck is Detected

```
1. STOP polling immediately
2. Kill the stuck shell with KillShell
3. Check for error indicators:
   - Port already in use?
   - Missing dependencies?
   - Syntax error in config?
4. Re-run in foreground with timeout
5. If still failing, investigate root cause
```

### KillShell Usage

```typescript
// Always provide the shell_id from your original Bash call
KillShell({ shell_id: "shell-abc123" })
```

---

## Process-Specific Timeouts

| Process Type | Recommended Approach | Max Timeout |
|--------------|---------------------|-------------|
| Unit tests (`npm test`) | Foreground | 2 minutes |
| Type check (`tsc --noEmit`) | Foreground | 1 minute |
| Build (`npm run build`) | Foreground | 3 minutes |
| E2E tests (`playwright`) | Foreground | 5 minutes |
| Dev server | Background, 5 polls max | N/A |
| Database migrations | Foreground | 1 minute |

---

## Warning Signs You're About to Loop

If you catch yourself thinking:
- "Let me wait a bit longer" -> STOP, you're looping
- "I'll check again" (3rd+ time) -> STOP, kill and investigate
- "The output will come eventually" -> STOP, it probably won't
- "No content yet, keep polling" -> STOP after 3 attempts

---

## Integration with Other Skills

### Works With

- **fail-fast-debugging**: If a process is stuck, investigate why before retrying
- **verification-before-completion**: Don't claim tests pass if they never finished
- **root-cause-tracing**: Stuck processes often indicate deeper issues

### Escalation Path

```
3 empty polls -> Kill shell, try foreground
Foreground fails -> Activate fail-fast-debugging
2 attempts fail -> Question the approach (mcp__zen__thinkdeep)
```

---

## Quick Reference

```
BACKGROUND PROCESS CHECKLIST:
[ ] Is background truly necessary? (Prefer foreground)
[ ] Set max poll limit (5 attempts max)
[ ] Have shell_id ready for KillShell
[ ] Know the success indicators to look for
[ ] Have a timeout strategy for foreground fallback

STUCK DETECTION:
- 3 consecutive empty BashOutput = STUCK
- Action: Kill, investigate, foreground retry
- NEVER poll more than 5 times
```
