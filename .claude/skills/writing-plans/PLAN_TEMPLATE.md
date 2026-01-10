# [Feature Name] Implementation Plan

**Date:** YYYY-MM-DD
**Type:** [New Feature / Refactoring / Bug Fix / Integration]
**Scope:** [Single file / Single feature / Cross-feature / Full stack]
**Author:** Claude Code

---

## Executive Summary

| Field | Value |
|-------|-------|
| **Effort** | X story points (AI consensus) |
| **Risk** | Low / Medium / High |
| **Complexity** | Simple / Moderate / Complex |
| **Execution** | Sequential / Parallel / Hybrid |
| **Testing** | TDD Strict / Tests After / E2E Focus |
| **Parallelization** | X tasks can run simultaneously |

### AI Estimation Details
[Include full mcp__zen__consensus output here]

---

## Dependency Analysis

```
Task Graph:
├── Group A (Independent - Run in Parallel):
│   ├── Task 1: [name]
│   ├── Task 2: [name]
│   └── Task 3: [name]
│
├── Group B (Depends on A):
│   └── Task 4: [name] → depends on Task 1
│
└── Group C (Depends on B):
    └── Task 5: [name] → depends on Task 4
```

---

## Task Breakdown

### Task 1: [Task Name]

**Agent Hint:** `[agent-name]` ([reason for selection])
**File:** `exact/path/to/file.ts`
**Line:** [if modifying existing code]
**Effort:** X story points
**Dependencies:** None / Task N

#### Current Code (if modifying)
```typescript
// Show the exact code that will be changed
// Include enough context (5-10 lines)
```

#### Root Cause / Rationale
[Explain WHY this change is needed]

#### Test First (TDD)
```typescript
// Write the test that should pass after implementation
describe("[Feature]", () => {
  it("should [expected behavior]", () => {
    // Arrange
    // Act
    // Assert
  });
});
```

#### Implementation
```typescript
// Show the implementation code
// Or detailed step-by-step instructions
```

#### Verification
```bash
# Commands to verify this task succeeded
npm test -- --grep "[test name]"
npm run build
```

**Expected output:**
```
[Show what success looks like]
```

#### Constitution Checklist
- [ ] Fail-fast: No retry logic, circuit breakers, or graceful fallbacks
- [ ] Zod at boundary: Validation in unifiedDataProvider only, not in forms
- [ ] Single source: Using unifiedDataProvider for all data access
- [ ] Form defaults: From zodSchema.partial().parse({})
- [ ] Form mode: onSubmit or onBlur, never onChange
- [ ] Touch targets: 44px minimum (h-11 w-11)
- [ ] Semantic colors: No hardcoded hex values

---

[Repeat for each task...]

---

## Execution Plan

### Parallel Groups

| Group | Tasks | Dependencies | Est. Time |
|-------|-------|--------------|-----------|
| 1 | Tasks 1, 2, 3 | None | 5 min |
| 2 | Task 4 | Group 1 | 3 min |
| 3 | Task 5 | Group 2 | 2 min |

### Agent Assignments

| Task | Agent | Reason |
|------|-------|--------|
| Task 1 | test-fixer | Test debugging |
| Task 2 | form-builder | Form scaffolding |
| Task 3 | task-implementor | General impl |
| Task 4 | migration-validator | Migration safety |
| Task 5 | color-fixer | Design system |

---

## Rollback Plan

**Checkpoint Strategy:**
1. Create checkpoint before execution: `~/.claude/checkpoint-manager.sh force`
2. Record commit hash: `git rev-parse HEAD`
3. On failure, rollback: `git reset --hard [hash]`

**Recovery Points:**
- Pre-execution: [checkpoint description]
- After Group 1: [if partial rollback needed]

---

## Success Criteria

### Automated Verification
```bash
# All must pass before plan is complete
npm run build          # Exit 0
npx tsc --noEmit       # Exit 0
npm test               # All tests pass
```

### Manual Verification
- [ ] [Feature] works as expected in browser
- [ ] No console errors
- [ ] Touch targets are 44px+
- [ ] Semantic colors only
