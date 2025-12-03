---
name: executing-plans
description: Use when executing implementation plans, running plan tasks, working through planned work. Provides batch execution with smart dependency grouping, Zen MCP integration for blockers, and constitution compliance checkpoints. Pairs with writing-plans skill. Trigger terms - execute plan, run plan, implement plan, work through tasks, follow plan, plan execution, batch execution, checkpoint, blocker.
---

# Executing Plans Skill

## Purpose

Execute implementation plans through **smart batch grouping** with review checkpoints, blocker investigation via Zen MCP, and constitution compliance verification.

## When to Use

- Executing a plan created by `writing-plans` skill
- Working through documented task lists
- Following step-by-step implementation instructions
- Resuming partially completed plans

## The Execution Protocol

```
┌─────────────────────────────────────────────────────────────────┐
│  ANNOUNCE: "Using executing-plans skill for [Plan Name]"       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. LOAD & REVIEW                                               │
│     • Read entire plan                                          │
│     • Identify dependency groups (natural batches)              │
│     • Flag concerns BEFORE starting                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. EXECUTE BATCH                                               │
│     • Work through one dependency group                         │
│     • Follow tasks EXACTLY - no improvisation                   │
│     • Run verification steps for each task                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. CONSTITUTION CHECK (via enforcing-principles)               │
│     • Verify no anti-patterns introduced                        │
│     • Check: fail-fast, Zod validation, form state              │
│     • Block commit if violations found                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. CHECKPOINT REPORT                                           │
│     • Present completed work                                    │
│     • Show what was done + verification results                 │
│     • Await architect approval before next batch                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ More batches?      │
                    └────────────────────┘
                         │         │
                        YES        NO
                         │         │
                         ▼         ▼
                    [Go to 2]   [Complete]
```

## Smart Batch Grouping

Instead of fixed batch sizes, use the plan's dependency structure:

```markdown
## From Plan's Dependency Map:

| Task | Depends On | Can Parallelize With |
|------|------------|---------------------|
| 1    | None       | 2, 3                |
| 2    | None       | 1, 3                |
| 3    | None       | 1, 2                |
| 4    | 1, 2       | 5                   |
| 5    | 3          | 4                   |
| 6    | 4, 5       | None                |

## Natural Batches:

**Batch A:** Tasks 1, 2, 3 (independent - can use dispatching-parallel-agents)
**Batch B:** Tasks 4, 5 (after Batch A)
**Batch C:** Task 6 (after Batch B)
```

## Blocker Protocol (Zen MCP Integration)

When you hit a blocker, DO NOT force through. Use this escalation:

### Level 1: Quick Investigation
```
Use mcp__zen__debug with:
- step: "Investigating blocker: [description]"
- hypothesis: "Suspected cause"
- confidence: "exploring"
- next_step_required: true
```

### Level 2: Deep Analysis
If Level 1 doesn't resolve, escalate:
```
Use mcp__zen__thinkdeep with:
- problem_context: "[Full blocker details]"
- focus_areas: ["root cause", "workarounds", "plan revision"]
- thinking_mode: "high"
```

### Level 3: Human Escalation
If still blocked after Zen analysis:
```markdown
## BLOCKER REPORT

**Task:** [Task number and name]
**Blocker:** [What's preventing progress]
**Investigation:** [Summary of Zen analysis]
**Options:**
1. [Option A with tradeoffs]
2. [Option B with tradeoffs]
3. Skip task and continue (risk: [describe])

**Awaiting guidance before proceeding.**
```

## Constitution Compliance Checkpoints

After each batch, run the enforcing-principles checklist:

```markdown
### Batch N Constitution Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| No retry logic | ✅ / ❌ | [file:line or N/A] |
| No circuit breakers | ✅ / ❌ | [file:line or N/A] |
| Zod at API boundary only | ✅ / ❌ | [file:line or N/A] |
| Form defaults from schema | ✅ / ❌ | [file:line or N/A] |
| Using unified data provider | ✅ / ❌ | [file:line or N/A] |
| interface for objects | ✅ / ❌ | [file:line or N/A] |
| type for unions | ✅ / ❌ | [file:line or N/A] |

**Verdict:** PASS / FAIL (fix before commit)
```

## Checkpoint Report Template

After each batch, present this report:

```markdown
## Checkpoint: Batch [N] Complete

### Tasks Completed
- [x] Task N: [Name] - [brief outcome]
- [x] Task N+1: [Name] - [brief outcome]

### Verification Results
| Task | Test Command | Result |
|------|--------------|--------|
| N    | `npm test [path]` | ✅ Pass |
| N+1  | `npm test [path]` | ✅ Pass |

### Constitution Compliance
[Abbreviated checklist - all ✅ or list violations]

### Files Modified
- `path/to/file1.ts` (created)
- `path/to/file2.ts` (modified lines 45-67)

### Next Batch Preview
**Batch [N+1]:** Tasks [X, Y, Z]
- Dependencies satisfied: ✅
- Estimated scope: [brief]

**Ready to proceed?** Awaiting approval for next batch.
```

## Integration Points

### With writing-plans
Plans created by writing-plans include:
- Task dependency map → Use for smart batching
- Constitution principles checklist → Use for compliance checks
- Exact file paths → Follow precisely

### With enforcing-principles
After each batch:
1. Review all edited files for anti-patterns
2. Block commit if violations found
3. Fix before proceeding

### With dispatching-parallel-agents
For independent task groups (Batch A example above):
1. Identify truly independent tasks
2. Spawn parallel agents via Task tool
3. Coordinate at batch boundary

## Execution Announcements

Always announce state changes:

```markdown
📋 **Starting:** Using executing-plans for [Plan Name]
📦 **Batch N:** Executing tasks [X, Y, Z]
🔍 **Verifying:** Running tests for Task X
⚠️ **Blocker:** [Description] - investigating via Zen
✅ **Checkpoint:** Batch N complete - awaiting approval
🎯 **Complete:** All tasks executed, plan finished
```

## When to STOP and Ask

**STOP IMMEDIATELY if:**
- Missing dependency (file, package, API endpoint)
- Tests failing unexpectedly
- Instructions unclear or ambiguous
- Plan assumes something that doesn't exist
- Constitution violation cannot be fixed

**DON'T force through blockers. Ask first.**

## Related Skills

- `writing-plans` - Creates plans this skill executes
- `enforcing-principles` - Constitution compliance verification
- `dispatching-parallel-agents` - Parallel execution of independent batches

## Related Commands

- `/write-plan` - Create a new plan to execute

---

**Philosophy:** Batch execution with checkpoints. Follow exactly. Don't improvise. Investigate blockers with Zen. Verify constitution compliance.
