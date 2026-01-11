---
description: Deep root cause analysis using backward call chain tracing
argument-hint: [error-description or symptom-location]
allowed-tools: Read, Grep, Glob, Bash(git log:*), Bash(git diff:*), Bash(git bisect:*), mcp__zen__debug, TodoWrite
---

# Root Cause Analysis: $ARGUMENTS

Use the `root-cause-tracing` skill for systematic backward tracing through call chains.

> **SKILL ACTIVATION:** Using `root-cause-tracing` skill to enforce investigation before fixes.

## Phase 1: Evidence Collection

**Gather context before tracing:**

1. **Error Details** - Capture exact error message, stack trace, and symptom location
2. **Recent Changes** - Check git history for related modifications:
   ```bash
   git log --oneline -15 --all
   git diff HEAD~5 --name-only
   ```
3. **Reproduction Steps** - Document how to trigger the error

## Phase 2: Call Chain Tracing (The 5-Step Method)

Follow this methodology **before** proposing any fix:

| Step | Action | Question to Answer |
|------|--------|-------------------|
| 1. OBSERVE | Note where error appears | What is the symptom location? |
| 2. IMMEDIATE | Find direct cause | What code directly triggered this? |
| 3. TRACE UP | Go one level back | What called this? What values were passed? |
| 4. KEEP GOING | Continue backward | Each level reveals more context |
| 5. FIND SOURCE | Locate origin | Where did invalid data/state originate? |

**Use Read and Grep to trace the call chain backward at least 2 levels.**

## Phase 3: Hypothesis Formation

Use `mcp__zen__debug` for structured hypothesis tracking:

```
Hypothesis: [Your theory about root cause]
Confidence: [high/medium/low]
Evidence FOR: [What supports this theory]
Evidence AGAINST: [What contradicts it]
Next verification step: [How to confirm/refute]
```

**Anti-patterns to avoid:**
- Fixing at symptom location without tracing
- Adding defensive guards (`contact?.name`) without understanding why null
- Try-catch wrappers that swallow errors

## Phase 4: Root Cause Report

**Output this format when analysis is complete:**

```markdown
## Root Cause Analysis Report

**Symptom:** [Where error appeared]
**Root Cause:** [Actual origin] [Confidence: XX%]

**Call Chain:**
1. [Origin file:line] - Invalid state created here
2. [Intermediate file:line] - Passed through
3. [Symptom file:line] - Error surfaced here

**Evidence:**
- [What confirmed this diagnosis]

**Fix Recommendation:**
- [Specific change at ROOT location, not symptom]

**Prevention:**
- [How to avoid recurrence - test, validation, etc.]
```

## Related Commands

- `/troubleshooting` - General debugging with RAPID framework
- `/fail-fast-debugging` - Hypothesis-driven investigation
