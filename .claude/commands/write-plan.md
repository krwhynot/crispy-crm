---
name: writing-plans
description: Creates detailed implementation plans for AI agent execution - integrates with /atomic-crm-constitution for principle enforcement, includes exact file paths, adaptive code examples, verification steps, and task dependency mapping for parallel agent execution
---

# Writing Plans

## Overview

Write implementation plans for AI agents that have **zero context** about this codebase, zero memory of previous conversations, and no intuition about our conventions. They are executing cold.

**Assume the executing agent:**
- Has never seen this repo before
- Doesn't know our file structure, naming conventions, or patterns
- Will take instructions literally - ambiguity causes drift
- Cannot infer intent - spell everything out
- Needs exact paths, exact commands, exact expected outputs
- Has NOT read the Engineering Constitution

**Principles:** DRY. YAGNI. TDD (mandatory). Frequent commits. **Engineering Constitution compliance.**

**Announce at start:** "I'm using /writing-plans to create the implementation plan."

**Context:** Run in a dedicated worktree.

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

---

## Plan Document Structure

### Required Header

```markdown
# [Feature Name] Implementation Plan

> **For Executing Agent:**
> 1. **FIRST:** Read `docs/claude/engineering-constitution.md`
> 2. **THEN:** Use `/atomic-crm-constitution` to verify each task
> 3. Follow tasks exactly. Do not improvise. Zero context assumed.

**Goal:** [One sentence - what does "done" look like?]

**Architecture:** [2-3 sentences - key design decisions, patterns used]

**Tech Stack:** [Technologies, libraries, versions if relevant]

**Task Granularity:** [Specify for this plan: atomic (2-5 min) | standard (5-15 min) | chunked (15-30 min)]

**Parallelization:** [Which task groups can run simultaneously - reference dependency map below]

**Constitution Principles In Play:**
- [ ] Error handling (fail fast - NO retry logic)
- [ ] Validation (Zod at API boundary only)
- [ ] Form state (derived from schema)
- [ ] Data access (unified provider only)
- [ ] Types (`interface` for objects, `type` for unions)

---
```

### Dependency Map

Include after header for plans with 5+ tasks:

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

### Resources Appendix

Include at end of every plan:

```markdown
## Resources

**Required Reading:**
- `docs/claude/engineering-constitution.md`: Core principles - READ FIRST

**Related Commands:**
- `/atomic-crm-constitution`: Verify implementation compliance
- `/command-name`: Why it's relevant

**Constitution Pattern Files:**
- `resources/error-handling.md`: Fail-fast patterns
- `resources/validation-patterns.md`: Zod at API boundary
- `resources/form-state-management.md`: Schema-derived defaults
- `resources/database-patterns.md`: GRANT + RLS

**Reference Files:**
- `path/to/similar/implementation.py`: Pattern to follow
```

---

## Task Structure Template

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
- Validation: `src/atomic-crm/validation/feature.ts` (if needed)

**Step 1: Write the failing test**

```typescript
describe('specificBehavior', () => {
  it('should do expected thing', () => {
    // Arrange
    const input = {...}
    
    // Act
    const result = functionUnderTest(input)
    
    // Assert
    expect(result).toEqual(expected)
  })
})
```

**Step 2: Verify test fails**

```bash
npm test -- tests/path/test_file.test.ts -t "should do expected thing"
```

Expected output:
```
FAIL - functionUnderTest is not defined
```

**Step 3: Implement minimal code**

```typescript
// ✅ CONSTITUTION COMPLIANT
export function functionUnderTest(input: InputType): OutputType {
  // Let errors throw - NO try/catch with retry
  const data = await dataProvider.getOne('resource', { id: input.id })
  return data
}

// ❌ CONSTITUTION VIOLATION - DO NOT WRITE
// No retry logic, no circuit breakers, no graceful fallbacks
```

**Step 4: Verify test passes**

```bash
npm test -- tests/path/test_file.test.ts -t "should do expected thing"
```

Expected output:
```
PASS
```

**Step 5: Constitution compliance check**

Before committing, verify:
- [ ] No `try/catch` with retry logic
- [ ] No `CircuitBreaker` classes
- [ ] No `MAX_RETRIES` constants
- [ ] Validation uses Zod in `src/atomic-crm/validation/`
- [ ] Form defaults use `schema.partial().parse({})`
- [ ] Boy Scout Rule: Fixed any issues in edited files

**Step 6: Commit**

```bash
git add tests/path/test_file.test.ts src/path/file.ts
git commit -m "feat(component): add specific behavior"
```
```

---

## Code Example Guidelines

**Provide FULL code when:**
- Pattern is unfamiliar to this codebase
- Complex business logic
- Error handling (to ensure fail-fast compliance)
- Validation logic (to ensure Zod-only compliance)
- Form state setup (to ensure schema-derived defaults)

**Provide SKELETON code when:**
- Following established patterns in codebase
- Simple CRUD operations
- Repetitive tasks with clear precedent

Skeleton format:
```typescript
function featureName(params: ParamsType): ReturnType {
  // 1. Access data via unified provider (NOT direct API)
  // 2. Let errors throw (NO try/catch with retry)
  // 3. Validate at API boundary only (Zod schema)
  // 4. Return result
}
```

---

## Constitution Red Flags

**STOP the plan and revise if any task includes:**

| Red Flag | Constitution Violation | Fix |
|----------|----------------------|-----|
| `for (let i = 0; i < MAX_RETRIES` | No retry logic | Let it throw |
| `class CircuitBreaker` | No circuit breakers | Delete entirely |
| `catch { return cachedData }` | No graceful fallbacks | Let errors propagate |
| `const isValid = (x) => ...` in component | Validation outside Zod | Move to `src/atomic-crm/validation/` |
| `defaultValues: { stage: 'new' }` | Hardcoded form defaults | Use `schema.partial().parse({})` |
| `import { api } from './api'` | Bypassing unified provider | Use `dataProvider` |
| `type Contact = { ... }` for objects | Wrong type construct | Use `interface` |
| `<input type="text" />` | Raw HTML in forms | Use React Admin components |
| `color: #7CB342` | Hardcoded colors | Use `var(--semantic-token)` |

---

## Execution Handoff

After saving the plan, output:

```
Plan saved to `docs/plans/<filename>.md`

## Pre-Execution Requirement

Executing agent MUST read before starting:
- `docs/claude/engineering-constitution.md`

## Parallel Execution Strategy

Independent task groups (can run simultaneously):
- Group A: Tasks [1, 2, 3]
- Group B: Tasks [4, 5] (after Group A completes)
- Group C: Task [6] (after Group B completes)

## To Execute

Option 1: Single agent sequential
> Execute docs/plans/<filename>.md task by task
> Run /atomic-crm-constitution check before each commit
> Commit after each task

Option 2: Parallel agents (recommended for 5+ tasks)
> Spawn separate Claude Code sessions per task group
> Each agent: "Read engineering-constitution.md, then execute Task N from docs/plans/<filename>.md exactly as written"
> Run /atomic-crm-constitution before merging
> Coordinate merges at group boundaries
```

---

## Remember

- Executing agent has ZERO context - overcommunicate
- Executing agent has NOT read the constitution - embed compliance checks in every task
- Exact file paths - no "in the appropriate directory"
- Complete commands with expected output - no "run the tests"
- Reference slash commands with `/command-name` syntax
- TDD is non-negotiable
- Map dependencies for parallel execution
- Adaptive code depth based on complexity
- **Every task must include constitution compliance checklist**
- **Flag constitution violations explicitly in code examples**