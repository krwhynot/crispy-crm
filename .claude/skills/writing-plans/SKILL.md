---
name: writing-plans
description: Plan authoring skill with quality gates and AI estimation. Triggers on write-plan, implementation plan, design plan, feature plan, execution plan. Enforces zero-context clarity, TDD requirements, constitution compliance checklists, and agent hints for intelligent task routing.
---

# Writing Plans

## Purpose

Create implementation plans that zero-context agents can execute correctly. Plans must be explicit, complete, and verifiable without requiring the executing agent to have prior knowledge of the codebase.

## When to Use

- User invokes `/write-plan` command
- Creating implementation strategies for features
- Breaking down complex features into tasks
- Planning migrations or refactoring work
- Designing multi-step integrations

## Zero-Context Principle

**Assume the executing agent:**
- Has never seen this repository
- Has NOT read the engineering constitution
- Takes instructions literally without inference
- Needs exact file paths, not "appropriate directory"
- Needs complete commands with expected output
- Will not guess at missing information

**Every task must be self-contained with all context needed to execute.**

---

## Plan Template Structure

### Required Sections (7)

1. **Executive Summary** - Who, What, Why, Effort estimate (from AI consensus)
2. **AI Estimation** - Effort/Risk/Complexity from `mcp__zen__consensus`
3. **Dependency Analysis** - Task graph showing parallel groups
4. **Task Breakdown** - Per task: current code, test first (TDD), implementation, verification, constitution checklist
5. **Execution Plan** - Parallel groups, agent assignments with hints
6. **Rollback Plan** - Checkpoint strategy per group
7. **Success Criteria** - Verification commands with expected output

---

## AI Estimation Integration

Use `mcp__zen__consensus` BEFORE writing the plan:

**Models:** gemini-2.5-pro, gpt-5.2 (neutral stance)

**Evaluate:**
- **Effort:** 1-13 story points (Fibonacci: 1, 2, 3, 5, 8, 13)
- **Risk:** Low / Medium / High
- **Complexity:** Simple / Moderate / Complex

**Include estimation in Executive Summary:**

```markdown
## Executive Summary

**Feature:** [Name]
**Owner:** [Team/Individual]
**Estimated Effort:** 8 story points (AI consensus)
**Risk Level:** Medium
**Complexity:** Moderate

**What:** [1-2 sentence description]
**Why:** [Business value]
```

---

## Agent Hints

Each task should include an optional agent hint for intelligent routing:

| Hint | When to Use |
|------|-------------|
| `test-fixer` | Test debugging, fixing failing tests |
| `form-builder` | Form scaffolding, new entity forms |
| `migration-validator` | Validating SQL migrations |
| `rls-auditor` | RLS policy and security audits |
| `schema-auditor` | Database schema consistency |
| `color-fixer` | Tailwind semantic color fixes |
| `code-finder` | Code discovery tasks |
| `task-implementor` | General implementation (default) |

---

## Task Template

```markdown
### Task N: [Task Name]

**Agent Hint:** `task-implementor` (general implementation)
**File:** `/home/user/project/src/exact/path/to/file.ts`
**Effort:** X story points
**Dependencies:** Task M (if any)

#### Current Code (if modifying)
```typescript
// Show the exact code being modified
// Include line numbers if helpful
```

#### Test First (TDD)
```typescript
// Test that should pass AFTER implementation
// Include exact file path for test
// File: src/atomic-crm/contacts/__tests__/newFeature.test.ts
describe('newFeature', () => {
  it('does the expected thing', () => {
    // Test implementation
  });
});
```

#### Implementation
```typescript
// Implementation code or detailed steps
// Include imports, context, and any setup needed
```

#### Verification
```bash
# Commands to verify success with expected output
just test src/atomic-crm/contacts/__tests__/newFeature.test.ts
# Expected: PASS newFeature > does the expected thing

# Check for TypeScript errors
npx tsc --noEmit
# Expected: No output (success)
```

#### Constitution Checklist
- [ ] Fail-fast: No retry logic, circuit breakers, or graceful fallbacks
- [ ] Zod at boundary: Validation in unifiedDataProvider only, not forms
- [ ] Single source: All DB access through unifiedDataProvider
- [ ] Form defaults: From `zodSchema.partial().parse({})`
- [ ] Touch targets: All buttons/links are 44x44px minimum (h-11 w-11)
- [ ] Semantic colors: No raw hex/oklch values
```

---

## Dependency Analysis

### Task Graph Format

Show which tasks can run in parallel:

```
Group 1 (Parallel):
├── Task 1: Create schema
├── Task 2: Create test fixtures
└── Task 3: Create type definitions

Group 2 (Sequential - depends on Group 1):
└── Task 4: Implement data provider handler

Group 3 (Parallel - depends on Group 2):
├── Task 5: Create form component
└── Task 6: Create list component

Group 4 (Sequential - depends on Group 3):
└── Task 7: Integration tests
```

### Dependency Rules

- Tasks in same group can run in parallel
- Groups execute sequentially in order
- Explicitly mark dependencies: `Dependencies: Task 4`
- If no dependencies: `Dependencies: None`

---

## Quality Gates Checklist

**Before a plan is ready:**

- [ ] Every task has TDD test first (test written BEFORE implementation)
- [ ] Every task has constitution checklist
- [ ] Every task has exact file paths (absolute, no "appropriate directory")
- [ ] Every task has verification commands with expected output
- [ ] Every task has optional Agent Hint
- [ ] Zero ambiguity - agent with no context can execute
- [ ] AI estimation completed and included
- [ ] Dependency graph shows parallel opportunities
- [ ] Rollback plan exists for each parallel group

---

## Rollback Plan

Each parallel group needs a rollback strategy:

```markdown
## Rollback Plan

### Group 1 Checkpoint
**Files to restore:** `schema.ts`, `types.ts`
**Command:** `git checkout HEAD -- src/atomic-crm/validation/schema.ts`
**When to rollback:** If any Group 1 task fails verification

### Group 2 Checkpoint
**Files to restore:** `handler.ts`
**Command:** `git stash && git checkout HEAD -- src/providers/handlers/`
**When to rollback:** If data provider integration fails
```

---

## Success Criteria

Define measurable success:

```markdown
## Success Criteria

### Automated Verification
```bash
# All tests pass
just test
# Expected: Tests: X passed, 0 failed

# Type check passes
npx tsc --noEmit
# Expected: No output (success)

# Lint passes
just lint
# Expected: No errors
```

### Manual Verification
- [ ] Feature accessible at `/contacts/create`
- [ ] Form submits successfully with valid data
- [ ] Validation errors display correctly
- [ ] Data appears in database after submit
```

---

## Anti-Patterns to Avoid

**Vague instructions:**
```markdown
# BAD
Create the component in the appropriate directory.

# GOOD
Create the component at `/home/user/project/src/atomic-crm/contacts/ContactSlideOver.tsx`
```

**Missing context:**
```markdown
# BAD
Update the schema.

# GOOD
Update the schema at `/home/user/project/src/atomic-crm/validation/contacts.ts`:
- Add `phone` field with z.string().max(20).optional()
- Add `company_role` field with z.enum(['buyer', 'decision_maker', 'influencer'])
```

**No verification:**
```markdown
# BAD
Test that it works.

# GOOD
Run: `just test src/atomic-crm/contacts/__tests__/ContactCreate.test.tsx`
Expected output: `PASS ContactCreate > submits form with valid data`
```

---

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| `enforcing-principles` | Constitution checklist items |
| `verification-before-completion` | Run verification before marking complete |
| `testing-patterns` | TDD test examples and patterns |
| `crispy-data-provider` | Data access patterns |

---

## Quick Reference

**Core principles:**
- Zero context - overcommunicate everything
- Exact file paths - absolute, never relative or vague
- Complete commands with expected output
- Every task includes constitution checklist
- Flag violations in code examples with checkmarks

**Plan output location:** `docs/archive/plans/YYYY-MM-DD-<feature-name>.md`

**Quality bar:** Plan is ready when a developer who has never seen the codebase can execute every task without asking questions.

---

## Reference Files

For detailed templates and checklists:
- See `PLAN_TEMPLATE.md` for full plan template
- See `QUALITY_CHECKLIST.md` for detailed quality gates
- See `/write-plan` command for interactive plan creation workflow
