---
name: subagent-driven-development
description: Execute implementation plans by dispatching fresh subagents per task with code review between feature areas. Enables fast iteration with quality gates, TDD practices, and final test suite verification. Triggers on execute plan, dispatch subagent, task execution, quality gates, fresh agent.
---

# Subagent-Driven Development

Execute plans by dispatching fresh subagents per task, with code review after each feature area.

**Core principle:** Fresh subagent per task + review between feature areas = high quality, fast iteration

## Overview

### vs. Other Execution Approaches

| Approach | Context | Review | Speed |
|----------|---------|--------|-------|
| **This skill** | Same session, fresh subagent per task | After feature areas | Fast, automated |
| **executing-plans** | Batch execution with checkpoints | At batch boundaries | Moderate |
| **dispatching-parallel-agents** | Multiple agents concurrently | After all complete | Fastest for independent work |

### When to Use

- Staying in current session
- Tasks are mostly independent
- Want continuous progress with quality gates
- Plan has clear feature groupings

### When NOT to Use

- Need to review plan first (use executing-plans)
- Tasks are tightly coupled (manual execution better)
- Plan needs revision (brainstorm first)
- Tasks can run in parallel with no dependencies (use dispatching-parallel-agents)

## The Process

### 1. Load Plan

Read plan file from `docs/plans/`, create TodoWrite with all tasks.

```
[Load docs/plans/YYYY-MM-DD-feature-name.md]
[Create TodoWrite with all tasks from plan]
[Identify feature areas for batched reviews]
```

### 2. Execute Task with Subagent

For each task, dispatch a fresh subagent:

```
Task tool (general-purpose):
  description: "Implement Task N: [task name]"
  prompt: |
    You are implementing Task N from [plan-file].

    Read that task carefully. Your job is to:
    1. Write tests FIRST (TDD - test the expected behavior)
    2. Implement to make tests pass
    3. Verify implementation works (npm test)
    4. Report back with summary

    Project context:
    - React 19 + TypeScript + React Admin + Supabase
    - Use unifiedDataProvider for all DB access
    - Zod validation at API boundary only
    - Tailwind v4 semantic colors only

    Work from: /home/krwhynot/projects/crispy-crm

    Report: What you tested, what you implemented, test results, files changed
```

**Subagent reports back** with summary of work.

### 3. Review After Feature Area

Group tasks by feature area, review when area is complete:

**Feature Area Examples:**
- Contact management tasks → Review together
- Opportunity pipeline tasks → Review together
- Dashboard/reporting tasks → Review together

**Dispatch code-reviewer after feature area:**

```
Task tool (code-reviewer or general-purpose):
  prompt: |
    Review the implementation for [feature area].

    Tasks completed: [list of task numbers]
    Files changed: [from subagent reports]

    Check for:
    1. Constitution compliance (fail-fast, no retry logic)
    2. Design system compliance (Tailwind v4 semantic colors)
    3. Test coverage (TDD followed?)
    4. Data provider usage (unifiedDataProvider only)

    Return: Strengths, Issues (Critical/Important/Minor), Assessment
```

### 4. Apply Review Feedback

**If issues found:**
- Fix Critical issues immediately (dispatch fix subagent)
- Fix Important issues before next feature area
- Note Minor issues for later

**Dispatch follow-up subagent if needed:**

```
Task tool:
  prompt: "Fix issues from code review: [list issues]"
```

### 5. Mark Complete, Next Task

- Mark task as completed in TodoWrite
- Continue to next task in feature area
- After feature area complete → Review (step 3)
- Repeat until all tasks done

### 6. Final Test Suite Verification

After all tasks complete, run full verification:

```bash
npm test          # All unit tests pass
npm run build     # TypeScript compiles cleanly
```

**If failures:**
- Dispatch fix subagent for each failing test
- Re-run verification
- Do not proceed until green

### 7. Report Completion

Announce completion with summary:
- Tasks completed
- Features implemented
- Test results
- Any noted Minor issues for future consideration

## Example Workflow

```
You: I'm using Subagent-Driven Development to execute this plan.

[Load docs/plans/2025-12-02-contact-management.md]
[Create TodoWrite: Task 1-3 = Contact feature, Task 4-5 = Organization feature]

--- Feature Area: Contacts ---

Task 1: Contact form validation
[Dispatch implementation subagent]
Subagent: TDD - wrote 5 tests, implemented ContactForm validation, 5/5 passing

Task 2: Contact list filtering
[Dispatch implementation subagent]
Subagent: TDD - wrote 3 tests, added filter component, 3/3 passing

Task 3: Contact slide-over panel
[Dispatch implementation subagent]
Subagent: Implemented ContactSlideOver, added to list view

[Dispatch code-reviewer for Contact feature area]
Reviewer:
  Strengths: Good TDD, proper data provider usage
  Issues (Important): Missing touch targets on filter buttons
  Assessment: Ready after fix

[Dispatch fix subagent]
Fix subagent: Added h-11 w-11 to filter buttons

[Mark Tasks 1-3 complete]

--- Feature Area: Organizations ---

[Continue with Tasks 4-5...]

--- Final Verification ---

[npm test] All 45 tests passing
[npm run build] Clean compilation

Done! All tasks complete, tests green.
```

## Integration with Existing Skills

### Required Skills

| Skill | Purpose |
|-------|---------|
| **writing-plans** | Creates the plan this skill executes |
| **enforcing-principles** | Constitution compliance in reviews |
| **ui-ux-design-principles** | Design system compliance in reviews |

### Optional Integration

| Skill | When to Use |
|-------|-------------|
| **dispatching-parallel-agents** | If multiple independent tasks in same feature area |
| **executing-plans** | Alternative for batch-style execution |

## Red Flags

**Never:**
- Skip code review between feature areas
- Proceed with unfixed Critical issues
- Dispatch multiple implementation subagents in parallel within same feature area
- Implement without reading plan task
- Skip final test suite verification

**If subagent fails task:**
- Dispatch fix subagent with specific instructions
- Don't try to fix manually (context pollution)

## Quick Reference

```
1. Load plan → TodoWrite with all tasks
2. Group tasks by feature area
3. For each task:
   a. Dispatch fresh subagent (TDD)
   b. Subagent reports back
   c. Mark task complete
4. After feature area → Code review
5. Fix any issues
6. Repeat for next feature area
7. Final: npm test + npm run build
8. Report completion
```
