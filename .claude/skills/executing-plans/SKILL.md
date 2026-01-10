---
name: executing-plans
description: Plan execution skill with subagent parallelization, checkpoint/rollback, TodoWrite tracking, and intelligent agent routing. Triggers on execute-plan, run plan, implement plan, execute tasks.
---

# Executing Plans

## Purpose

Execute implementation plans from `docs/archive/plans/` using parallel subagent swarms with safety guarantees, intelligent agent selection, and automatic rollback capability.

**Core Mandate:** SAFE EXECUTION WITH VERIFICATION AT EVERY BATCH

## When to Use

**Explicit triggers:**
- `/execute-plan` command
- "execute plan", "run plan", "implement plan"
- "start execution", "execute tasks"

**Prerequisites:**
- Plan file exists in `docs/archive/plans/`
- Plan has passed Zen MCP review (quality score 8+)

---

## Execution Process (7 Phases)

### Phase 0: Plan Selection

**Ask user via multiple-choice questions:**

```
Question 1: "Which plan do you want to execute?"
Header: "Plan Selection"
Options:
- "Latest plan" - Most recently created plan
- "Specific plan" - I'll provide the filename
- "List available" - Show all plans in docs/archive/plans/

Question 2: "How do you want to execute?"
Header: "Execution Mode"
Options:
- "Full execution" - Run all batches automatically
- "Batch-by-batch" - Pause for approval between batches
- "Single task" - Execute one specific task
- "Dry run" - Show what would happen without changes
```

---

### Phase 1: Plan Validation

1. Read plan file from `docs/archive/plans/`
2. Verify required sections exist:
   - Executive Summary
   - Dependency Analysis
   - Task Breakdown (with Agent Hints)
   - Execution Plan (batch groupings)
   - Success Criteria
3. Extract task list and dependency graph
4. Identify parallel groups from batch definitions

**Validation Failure:**
```
Plan validation failed:
- Missing section: [section name]
- Invalid dependency: Task X depends on non-existent Task Y
- No batch groupings defined

Action: Return to /write-plan to fix issues
```

---

### Phase 2: Pre-Execution Checkpoint

**CRITICAL: Before ANY code changes, create checkpoint:**

```bash
~/.claude/checkpoint-manager.sh force
```

**Record the checkpoint commit hash for rollback reference.**

Display to user:
```
Checkpoint created: abc1234
Rollback command: git reset --hard abc1234
```

---

### Phase 3: TodoWrite Setup

Create todos for ALL tasks before starting execution:

```typescript
TodoWrite([
  { content: "Task 1: [description]", status: "pending", activeForm: "[present participle form]" },
  { content: "Task 2: [description]", status: "pending", activeForm: "[present participle form]" },
  { content: "Batch 1 verification", status: "pending", activeForm: "Verifying batch 1" },
  // ... all tasks and verifications
])
```

**Rules:**
- One todo per task
- Add verification todo after each batch
- Mark only ONE task as `in_progress` at a time

---

### Phase 4: Agent Routing

For each task, select the best specialized agent based on:
1. **Explicit Agent Hint** in plan (highest priority)
2. **Keyword matching** from task description
3. **Default agent** if no match

#### Agent Routing Table

| Task Contains | Agent Selected | Model | Best For |
|---------------|----------------|-------|----------|
| `test`, `failing`, `vitest`, `spec` | test-fixer | haiku | Fixing test failures |
| `create form`, `scaffold form`, `new form` | form-builder | default | Building React Admin forms |
| `validate migration`, `check migration` | migration-validator | default | SQL migration review |
| `RLS`, `policy`, `security`, `row level` | rls-auditor | default | RLS policy creation/audit |
| `schema`, `Zod`, `validation schema` | schema-auditor | default | Zod schema work |
| `fix colors`, `semantic`, `tailwind` | color-fixer | haiku | Design system compliance |
| `find`, `locate`, `search`, `where is` | code-finder | haiku | Codebase navigation |
| `refactor`, `extract`, `rename` | refactorer | default | Code refactoring |
| `type`, `interface`, `typescript` | type-specialist | default | TypeScript work |
| (default) | task-implementor | default | General implementation |

**Priority Order:** Explicit Agent Hint > Keyword matching > Default

---

### Phase 5: Parallel Subagent Dispatch

For each batch/parallel group:

#### Step 1: Route Tasks
Determine the best agent for each task in the batch.

#### Step 2: Dispatch in Parallel
**Send ALL independent tasks in a SINGLE message for parallelization:**

```typescript
// Example: 3 tasks in parallel with different agents
Task({
  subagent_type: "test-fixer",
  prompt: "Fix the failing test in ContactList.test.tsx. Error: ...",
  files: ["/path/to/file.test.tsx"]
})

Task({
  subagent_type: "form-builder",
  prompt: "Create ContactCreate form following existing patterns...",
  files: ["/path/to/ContactCreate.tsx"]
})

Task({
  subagent_type: "task-implementor",
  prompt: "Implement the data provider method...",
  files: ["/path/to/provider.ts"]
})
```

#### Step 3: Wait and Update
- Wait for all tasks in batch to complete
- Update TodoWrite as each task completes
- Collect results from all subagents

#### Step 4: Batch Verification
Run verification before proceeding to next batch.

---

### Phase 6: Batch Verification

Between batches, run verification suite:

```bash
npm run build
npx tsc --noEmit
```

**For test-related batches, also run:**
```bash
npm test -- --run
```

#### Decision Matrix

| Result | Action |
|--------|--------|
| All pass | Continue to next batch |
| Build fails | STOP, show errors, offer rollback |
| Types fail | STOP, show errors, offer rollback |
| Tests fail | STOP, show errors, offer rollback |
| Partial success | Ask user: continue, fix, or rollback? |

**If issues found:**
1. Use `mcp__zen__debug` for investigation
2. Present options to user:
   - Fix and retry batch
   - Skip failed task and continue
   - Rollback to checkpoint

---

### Phase 7: Completion

After all batches complete successfully:

1. **Full verification suite:**
   ```bash
   npm run build && npx tsc --noEmit && npm test -- --run
   ```

2. **Update all todos to completed**

3. **Generate execution summary**

---

## Rollback Procedure

**When to rollback:**
- Build failures that cannot be quickly fixed
- Type errors across multiple files
- User requests rollback
- 2+ failed fix attempts on same issue

**Rollback command:**
```bash
git reset --hard <checkpoint-hash>
```

**After rollback:**
1. Report what failed and why
2. Suggest plan modifications
3. Offer to retry with different approach

---

## Output Summary Format

```markdown
## Execution Summary

**Plan:** docs/archive/plans/[plan-file].md
**Status:** [Success / Partial / Failed / Rolled Back]
**Checkpoint:** [commit-hash]

### Batch Results

| Batch | Tasks | Status | Duration |
|-------|-------|--------|----------|
| 1 | 3 | Pass | 2m 15s |
| 2 | 2 | Pass | 1m 30s |
| 3 | 4 | FAIL | - |

### Agent Usage

| Agent | Tasks | Success | Avg Time |
|-------|-------|---------|----------|
| test-fixer | 2 | 2/2 | 45s |
| form-builder | 1 | 1/1 | 2m |
| task-implementor | 4 | 3/4 | 1m 30s |

### Completed Tasks

| Task | Agent | Files Modified |
|------|-------|----------------|
| Task 1: Create ContactList | task-implementor | ContactList.tsx |
| Task 2: Add Zod schema | schema-auditor | contact.schema.ts |

### Failed Tasks

| Task | Agent | Error |
|------|-------|-------|
| Task 7: Fix RLS policy | rls-auditor | Policy syntax error |

### Verification Results

| Check | Result |
|-------|--------|
| Build | Pass |
| Types | Pass |
| Tests | 45/47 pass (2 skipped) |

### Next Steps
- [Actionable items if partial/failed]
```

---

## Error Handling

### Build Failure
```
Build failed at batch 2.

Error: Cannot find module './ContactForm'
File: src/atomic-crm/contacts/ContactCreate.tsx:3

Options:
1. [Fix] Create missing ContactForm component
2. [Rollback] git reset --hard abc1234
3. [Skip] Continue without this task
```

### Type Error
```
Type check failed at batch 3.

Error: Property 'company_id' does not exist on type 'Contact'
File: src/atomic-crm/contacts/ContactEdit.tsx:45

Note: company_id is deprecated. Use contact_organizations junction table.

Options:
1. [Fix] Update to use junction table
2. [Rollback] git reset --hard abc1234
```

---

## Integration with Other Skills

### Required Skills
- `verification-before-completion` - Enforced between batches
- `fail-fast-debugging` - Used when issues arise

### Zen MCP Tools

| Tool | When |
|------|------|
| `mcp__zen__debug` | Batch failures, unexpected errors |
| `mcp__zen__thinkdeep` | Complex issues requiring analysis |
| `mcp__zen__chat` | Quick clarifications |

---

## Quick Reference Checklist

Before each batch:
- [ ] Previous batch verified (build + types)
- [ ] Checkpoint exists and hash recorded
- [ ] Tasks routed to appropriate agents
- [ ] TodoWrite updated with current status

Before claiming completion:
- [ ] Full verification suite passed
- [ ] All todos marked complete or accounted for
- [ ] Summary generated with agent usage
- [ ] Checkpoint can be discarded

---

**Skill Status:** ACTIVE
**Line Count:** ~230 (within 250 limit)
**Related Files:**
- `/write-plan` command for creating plans
- `verification-before-completion` skill for verification
- `fail-fast-debugging` skill for error handling
