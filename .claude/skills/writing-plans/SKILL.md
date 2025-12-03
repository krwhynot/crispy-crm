---
name: writing-plans
description: Use when creating implementation plans, execution plans, task plans, or agent plans. Applies TDD principles to planning - write plans that guide AI agents with zero context. Integrates with engineering constitution, uses persuasion principles for compliance, includes process visualization via Graphviz. Trigger terms - plan, planning, implementation plan, execution plan, task breakdown, agent instructions, zero context, write plan.
---

# Writing Plans Skill

## Purpose

Write implementation plans for AI agents that have **zero context** about this codebase. Plans must be self-contained, unambiguous, and executable without prior knowledge.

## When to Use

- Creating implementation plans for features
- Breaking down complex tasks for agent execution
- Writing step-by-step instructions for parallel agents
- Documenting task dependencies and execution order

---

## CRITICAL: Ask Questions First

**BEFORE writing ANY plan, use `AskUserQuestion` to gather context through multiple-choice questions.**

### Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: GATHER CONTEXT                                     │
│  Ask multi-choice questions (3 rounds)                      │
│  ───────────────────────────────────────────────────────── │
│  STEP 2: SUMMARIZE                                          │
│  Present understanding, confirm with user                   │
│  ───────────────────────────────────────────────────────── │
│  STEP 3: WRITE PLAN                                         │
│  Only after confirmation, generate the plan                 │
└─────────────────────────────────────────────────────────────┘
```

### Question Round 1: Type & Scope

Use `AskUserQuestion` with these questions:

| Question | Header | Options |
|----------|--------|---------|
| "What type of work is this plan for?" | Plan Type | New Feature, Refactoring, Bug Fix, Integration |
| "What is the scope of this work?" | Scope | Single file, Single feature, Cross-feature, Full stack |
| "Which CRM areas are involved?" | Areas | Contacts/Orgs, Opportunities/Pipeline, Activities/Tasks, Data Provider/Validation |

### Question Round 2: Execution Preferences

| Question | Header | Options |
|----------|--------|---------|
| "What task granularity do you prefer?" | Granularity | Atomic (2-5 min), Standard (5-15 min), Chunked (15-30 min) |
| "How should this plan be executed?" | Execution | Sequential, Parallel groups, Hybrid |
| "What level of code examples do you need?" | Examples | Full code, Skeletons + key parts, Minimal |

### Question Round 3: Constraints (if applicable)

| Question | Header | Options |
|----------|--------|---------|
| "Are there any database changes involved?" | Database | No DB changes, New migrations, RLS policies, Edge Functions |
| "What testing approach?" | Testing | TDD strict, Tests after, E2E focus, Minimal |

### After Questions: Summarize & Confirm

```markdown
## Plan Summary

**Type:** [answer]
**Scope:** [answer]
**Areas:** [answer]
**Granularity:** [answer]
**Execution:** [answer]
**Database:** [answer]
**Testing:** [answer]

Does this look correct? Any adjustments before I write the plan?
```

---

## STEP 4: Zen MCP Review (After Writing)

**After the plan is written, use Zen MCP to review for issues and gaps.**

### Review Checklist

| Check | Description |
|-------|-------------|
| **Gaps** | Missing steps, unclear dependencies, incomplete tasks |
| **Principle Violations** | Retry logic, validation in wrong layer, direct Supabase imports |
| **Ambiguity** | Vague instructions that zero-context agents could misinterpret |
| **Risk Areas** | Tasks that could introduce bugs or break existing functionality |
| **Parallelization** | Missed opportunities for parallel execution |
| **Testing Gaps** | Missing test coverage for critical paths |

### Tool Selection

| Tool | Use When |
|------|----------|
| `mcp__zen__thinkdeep` | Complex plans, deep analysis needed |
| `mcp__zen__chat` | Simple plans, quick sanity check |
| `mcp__zen__debug` | Plans involving bug fixes |

### Review → Revise Loop

```
Plan Written → Zen Review → Issues? → Revise → Re-review → Ready
```

**Output from Zen should include:**
- Issues found (prioritized)
- Suggested fixes
- Quality score (1-10)
- Recommendation: Ready / Needs revision

---

## The Iron Law

> **NO PLAN WITHOUT A FAILING SCENARIO FIRST**
>
> Watch agents fail without the plan. Then write documentation that addresses those failures. Then close rationalization loopholes.

## Core Assumptions About Executing Agents

| Assumption | Implication |
|------------|-------------|
| Zero codebase knowledge | Spell out every path, pattern, convention |
| No prior conversation | Don't reference "what we discussed" |
| Literal interpretation | Ambiguity causes drift |
| No intuition | Explicit > implicit |
| Not read constitution | Embed compliance checks in every task |

## Plan Document Structure

### Required Header

```markdown
# [Feature Name] Implementation Plan

> **For Executing Agent:**
> 1. **FIRST:** Read `docs/claude/engineering-constitution.md`
> 2. **THEN:** Use `/atomic-crm-constitution` to verify each task
> 3. Follow tasks exactly. Do not improvise. Zero context assumed.

**Goal:** [One sentence - what does "done" look like?]

**Architecture:** [2-3 sentences - key design decisions]

**Task Granularity:** atomic (2-5 min) | standard (5-15 min) | chunked (15-30 min)

**Parallelization:** [Which task groups can run simultaneously]

**Constitution Principles In Play:**
- [ ] Error handling (fail fast - NO retry logic)
- [ ] Validation (Zod at API boundary only)
- [ ] Form state (derived from schema)
- [ ] Data access (unified provider only)
- [ ] Types (`interface` for objects, `type` for unions)
```

### Dependency Map (5+ tasks)

```markdown
## Task Dependencies

| Task | Depends On | Can Parallelize With |
|------|------------|---------------------|
| 1    | None       | 2, 3                |
| 2    | None       | 1, 3                |
| 3    | None       | 1, 2                |
| 4    | 1, 2       | 5                   |
| 5    | 3          | 4                   |
| 6    | 4, 5       | None                |
```

## Task Template

```markdown
### Task N: [Component Name]

**Depends on:** Task X, Y (or "None - can start immediately")

**Constitution Check:**
- [ ] No retry logic / circuit breakers
- [ ] Validation in `src/atomic-crm/validation/` only
- [ ] Form defaults via `schema.partial().parse({})`
- [ ] Using unified data provider
- [ ] `interface` for objects, `type` for unions

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts` (lines 123-145)
- Test: `tests/exact/path/to/test_file.test.ts`

**Step 1: Write the failing test**
[Complete test code]

**Step 2: Verify test fails**
[Exact command + expected output]

**Step 3: Implement minimal code**
[Code with constitution compliance markers]

**Step 4: Verify test passes**
[Exact command + expected output]

**Step 5: Constitution compliance check**
[Checklist before commit]

**Step 6: Commit**
[Exact git commands]
```

## Code Example Guidelines

| Provide FULL code when | Provide SKELETON when |
|------------------------|----------------------|
| Pattern is unfamiliar | Following established patterns |
| Complex business logic | Simple CRUD |
| Error handling (fail-fast) | Repetitive with precedent |
| Validation logic (Zod-only) | |
| Form state setup | |

## Constitution Red Flags

**STOP the plan and revise if any task includes:**

| Red Flag | Violation | Fix |
|----------|-----------|-----|
| `for (let i = 0; i < MAX_RETRIES` | No retry logic | Let it throw |
| `class CircuitBreaker` | No circuit breakers | Delete entirely |
| `catch { return cachedData }` | No graceful fallbacks | Let errors propagate |
| `defaultValues: { stage: 'new' }` | Hardcoded defaults | Use `schema.partial().parse({})` |
| `import { api } from './api'` | Bypassing provider | Use `dataProvider` |

## Persuasion Principles for Compliance

Apply these to ensure plans are followed under pressure:

| Principle | Application | Example |
|-----------|-------------|---------|
| **Authority** | Imperative language | "YOU MUST", "Never", "No exceptions" |
| **Commitment** | Force announcements | "Announce: I'm starting Task N" |
| **Scarcity** | Time-bound actions | "IMMEDIATELY after X, do Y" |
| **Social Proof** | Universal patterns | "Every time X without Y = failure" |

See [persuasion-principles.md](resources/persuasion-principles.md) for complete guide.

## Process Visualization

Use Graphviz DSL for process flows. See [graphviz-conventions.dot](resources/graphviz-conventions.dot).

**Quick Reference:**
- Diamond = Decision (`?`)
- Box = Action
- Plaintext = Command
- Octagon (red) = Warning
- Doublecircle = Entry/Exit

## Execution Handoff Template

```markdown
Plan saved to `docs/plans/YYYY-MM-DD-<feature>.md`

## Pre-Execution Requirement
Executing agent MUST read: `docs/claude/engineering-constitution.md`

## Parallel Execution Strategy
- Group A: Tasks [1, 2, 3] (independent)
- Group B: Tasks [4, 5] (after Group A)
- Group C: Task [6] (after Group B)

## To Execute

**Sequential:**
> Execute each task. Run /atomic-crm-constitution before commits.

**Parallel:**
> Spawn agents per task group. Coordinate at boundaries.
```

## Resources

- [persuasion-principles.md](resources/persuasion-principles.md) - Psychology of effective plans
- [graphviz-conventions.dot](resources/graphviz-conventions.dot) - Process diagram DSL
- [anthropic-best-practices.md](resources/anthropic-best-practices.md) - Skill authoring standards

## Related Commands

- `/write-plan` - Slash command that uses this skill
- `/atomic-crm-constitution` - Verify compliance during execution

---

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`
