---
name: execute-plan
description: Execute plan in batches with intelligent agent routing, checkpoint/rollback, and live TodoWrite tracking
allowed-tools: Read, Glob, Grep, Task, Bash, TodoWrite, mcp__zen__debug, mcp__zen__thinkdeep, AskUserQuestion
argument-hint: [plan-file-path or "latest"]
---

# Executing Plans

> **SKILL ACTIVATION:** Using `executing-plans` skill.

**Required skills:** `executing-plans`, `verification-before-completion`

---

## Phase 0: Plan Selection

**IMMEDIATELY ask user using AskUserQuestion:**

### Question 1: Plan to Execute
```
Header: "Plan"
Question: "Which plan do you want to execute?"
Options:
- "Latest plan" - Execute most recent from docs/archive/plans/
- "Specific plan" - You'll be asked for the path
- "List available" - Show all plans, then choose
```

### Question 2: Execution Mode
```
Header: "Mode"
Question: "How should the plan be executed?"
Options:
- "Full execution" - Run all tasks automatically
- "Batch-by-batch" - Pause for review after each batch
- "Single task" - Execute one specific task only
- "Dry run" - Show what would happen without executing
```

---

## Phase 1: Plan Validation

1. **Read plan file** from docs/archive/plans/ (or specified path)
2. **Verify required sections exist:**
   - [ ] Executive Summary
   - [ ] Dependency Analysis
   - [ ] Task Breakdown (with TDD tests)
   - [ ] Execution Plan (parallel groups)
   - [ ] Success Criteria

3. **Extract task list** and build dependency graph
4. **Identify parallel groups** from Dependency Analysis

**If plan is malformed, use AskUserQuestion:**
```
Header: "Invalid Plan"
Options:
- "Abort" - Go back and fix plan with /write-plan
- "Proceed anyway" - Execute with available info (not recommended)
```

---

## Phase 2: Pre-Execution Checkpoint

**CRITICAL: Before ANY code changes:**

```bash
~/.claude/checkpoint-manager.sh force
```

**Record the checkpoint commit hash:**
```bash
git rev-parse HEAD
```

Store this hash for rollback reference. Report to user:
```
Checkpoint created: abc1234
  Rollback command: git reset --hard abc1234
```

---

## Phase 3: TodoWrite Setup

Create todos for ALL tasks before starting execution:

```typescript
TodoWrite([
  // For each task in plan:
  {
    content: "Task 1: [Task name from plan]",
    status: "pending",
    activeForm: "[Task name in -ing form]"
  },
  {
    content: "Task 2: [Task name from plan]",
    status: "pending",
    activeForm: "[Task name in -ing form]"
  },
  // ... all tasks
  // Add verification task for each batch
  {
    content: "Batch 1 verification",
    status: "pending",
    activeForm: "Verifying batch 1"
  },
])
```

---

## Phase 4: Agent Routing

For each task, select the best specialized agent. Use **explicit Agent Hint** if provided in plan, otherwise use **keyword matching**:

### Routing Table (Priority Order)

| Priority | Pattern Match | Agent | Model | Reason |
|----------|---------------|-------|-------|--------|
| 1 | Agent Hint in task | (as specified) | - | Explicit override |
| 2 | "test", "vitest", "failing" | test-fixer | haiku | Test debugging |
| 3 | "create form", "scaffold" | form-builder | default | Form patterns |
| 4 | "validate migration" | migration-validator | default | Migration safety |
| 5 | "RLS", "policy", "security" | rls-auditor | default | Security audit |
| 6 | "schema audit" | schema-auditor | default | DB consistency |
| 7 | "fix colors", "semantic" | color-fixer | haiku | Design system |
| 8 | "find", "locate", "where" | code-finder | haiku | Code discovery |
| 9 | (default) | task-implementor | default | General impl |

### Display Routing Analysis

Before dispatching, show the user:

```
Agent Routing Analysis:
+-------------------------------------------------------------+
| Task                        | Agent              | Reason   |
+-------------------------------------------------------------+
| Fix ContactList test        | test-fixer         | "test"   |
| Create Samples form         | form-builder       | "form"   |
| Implement activity tracking | task-implementor   | default  |
+-------------------------------------------------------------+
```

---

## Phase 5: Parallel Subagent Dispatch

For each parallel group in the Execution Plan:

### Step 5.1: Mark Batch In Progress
Update TodoWrite to mark current batch tasks as `in_progress`.

### Step 5.2: Dispatch Parallel Tasks

**CRITICAL: Dispatch ALL tasks in the group in a SINGLE message:**

```typescript
// Example: 3 independent tasks -> 3 parallel agents
Task({
  subagent_type: "test-fixer",
  prompt: `## Task from Plan: Fix ContactList test

[Include full task section from plan]

## Context
- Plan file: [path]
- This is Task 1 of 5 in this plan
- Parallel group: 1 (independent)

## Expected Deliverables
1. Modified test file with fix
2. Passing test result
3. Summary of root cause

## Constitution Checklist (verify before completing)
- [ ] Fail-fast: No retry logic added
- [ ] Test uses renderWithAdminContext
- [ ] Uses vi.resetAllMocks in beforeEach`
})

Task({
  subagent_type: "form-builder",
  prompt: `## Task from Plan: Create Samples form

[Include full task section from plan]
...`
})

Task({
  subagent_type: "task-implementor",
  prompt: `## Task from Plan: Implement activity tracking

[Include full task section from plan]
...`
})
```

### Step 5.3: Collect Results
Wait for all subagents in the group to complete.

### Step 5.4: Update TodoWrite
Mark completed tasks as `completed`.

### Step 5.5: Batch Verification

Run verification commands:
```bash
npm run build
npx tsc --noEmit
```

**If batch-by-batch mode:** Ask user before continuing to next batch.

---

## Phase 6: Verification Decision Points

After each batch verification:

| Verification Result | Action |
|---------------------|--------|
| All pass | Continue to next batch |
| Build fails | STOP -> Show errors -> Offer rollback |
| Type errors | STOP -> Show errors -> Offer rollback |
| Partial success | Ask user: Fix and continue? Rollback? Skip? |

**On failure, use mcp__zen__debug to investigate:**

```typescript
mcp__zen__debug({
  step: "Investigating batch execution failure",
  step_number: 1,
  total_steps: 1,
  next_step_required: false,
  findings: "[Paste build/type errors here]",
  hypothesis: "Likely cause based on error messages",
  confidence: "medium",
  relevant_files: ["files-modified-in-batch"],
  model: "gemini-2.5-pro"
})
```

---

## Phase 7: Completion

### On Success

1. Run full verification suite:
   ```bash
   npm run build
   npx tsc --noEmit
   npm test
   ```

2. Update all todos to `completed`

3. Report execution summary:
   ```markdown
   ## Execution Complete

   **Plan:** docs/archive/plans/2026-01-10-feature.md
   **Duration:** X minutes
   **Status:** Success

   ### Agent Usage
   | Agent | Tasks | Time |
   |-------|-------|------|
   | test-fixer | 2 | 45s |
   | form-builder | 1 | 2m |
   | task-implementor | 3 | 5m |

   ### All Verifications Passed
   - Build: npm run build
   - Types: npx tsc --noEmit
   - Tests: npm test
   ```

### On Failure

1. STOP execution immediately
2. Report which batch/task failed
3. Show detailed error
4. Offer rollback:

```markdown
## Execution Failed

**Failed at:** Batch 2, Task 3 (Implement activity tracking)

**Error:**
[Error details]

**Options:**
1. **Rollback** - Restore to checkpoint: `git reset --hard [checkpoint-hash]`
2. **Fix and continue** - Address error manually, then resume
3. **Abort** - Stop execution, keep current state
```

---

## Rollback Procedure

If user chooses rollback:

```bash
# Restore to checkpoint
git reset --hard <checkpoint-commit-hash>

# Verify restoration
git log -1 --oneline
npm run build
```

Report:
```
Rolled back to checkpoint: [hash]
Build verified
```

---

## Dry Run Mode

If user selected "Dry run":

1. Parse plan and extract tasks
2. Show agent routing analysis
3. Show parallel group structure
4. Show what would be executed
5. Do NOT make any changes

```markdown
## Dry Run Results

### Plan: docs/archive/plans/2026-01-10-feature.md

### Tasks (5 total)
1. Fix ContactList test -> test-fixer
2. Create Samples form -> form-builder
3. Validate migration -> migration-validator
4. Implement activity -> task-implementor
5. Fix colors -> color-fixer

### Parallel Groups
- **Group 1:** Tasks 1, 2, 5 (3 agents in parallel)
- **Group 2:** Task 3 (sequential after Group 1)
- **Group 3:** Task 4 (sequential after Group 2)

### Estimated Execution
- Parallel batches: 3
- Sequential batches: 2
- Est. duration: ~10 minutes

No changes were made. Run with "Full execution" to proceed.
```

---

## Quick Reference

| Phase | Action |
|-------|--------|
| 0 | AskUserQuestion for plan and mode |
| 1 | Validate plan structure |
| 2 | Create checkpoint |
| 3 | Setup TodoWrite |
| 4 | Route tasks to agents |
| 5 | Dispatch parallel agents |
| 6 | Verify and decide |
| 7 | Complete or rollback |

---

## Related

- `/write-plan` - Create plans
- `verification-before-completion` skill
- `enforcing-principles` skill
