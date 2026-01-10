# Batch Execution Patterns

## Parallel Dispatch

**CRITICAL:** To run agents in parallel, dispatch ALL in a SINGLE message:

```typescript
// CORRECT: Single message with multiple Task calls
Task({ subagent_type: "test-fixer", prompt: "Task 1..." })
Task({ subagent_type: "form-builder", prompt: "Task 2..." })
Task({ subagent_type: "task-implementor", prompt: "Task 3..." })

// WRONG: Separate messages (runs sequentially)
// Message 1:
Task({ subagent_type: "test-fixer", prompt: "Task 1..." })
// Message 2:
Task({ subagent_type: "form-builder", prompt: "Task 2..." })
```

## Batch Verification

After each parallel group completes:

```bash
# Required checks
npm run build
npx tsc --noEmit

# Optional (if tests exist for modified files)
npm test -- --grep "[pattern]"
```

## Decision Matrix

| Build | Types | Tests | Action |
|-------|-------|-------|--------|
| ✓ | ✓ | ✓ | Continue to next batch |
| ✓ | ✓ | ✗ | Ask: Continue or fix? |
| ✓ | ✗ | - | STOP, show type errors |
| ✗ | - | - | STOP, show build errors |

## Rollback Strategy

```bash
# Before any execution
checkpoint_hash=$(git rev-parse HEAD)

# On failure
git reset --hard $checkpoint_hash
npm run build  # Verify clean state
```

## TodoWrite Integration

```typescript
// Before batch
TodoWrite([
  { content: "Task 1", status: "in_progress", activeForm: "Implementing Task 1" },
  { content: "Task 2", status: "in_progress", activeForm: "Implementing Task 2" },
])

// After batch success
TodoWrite([
  { content: "Task 1", status: "completed", activeForm: "Implementing Task 1" },
  { content: "Task 2", status: "completed", activeForm: "Implementing Task 2" },
])
```
