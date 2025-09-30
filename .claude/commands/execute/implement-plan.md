---
description: Execute parallel tasks from planning documentation
argument-hint: [plan-directory]
allowed-tools: Bash(ls:*), Bash(cat:*), Bash(get_compilation_errors:*)

---

## Prerequisites Check
Files to verify: !`ls -la $ARGUMENTS/*.md 2>/dev/null | head -10`

Required files must exist:
- `$ARGUMENTS/parallel-plan.md` 
- `$ARGUMENTS/shared.md`

## Task Execution Protocol

1. **Read Core Documentation**
   - Read `@$ARGUMENTS/parallel-plan.md` and `@$ARGUMENTS/shared.md`
   - Read all files listed at the top of parallel-plan.md
   - FAIL FAST: Stop immediately if any required file is missing

2. **Create Comprehensive Todo List**
   - Create todo item for each task in `parallel-plan.md`
   - Mark dependencies for each task
   - Exclude testing steps except final compilation check: `get_compilation_errors /src`
   - FAIL FAST: Stop if parallel-plan.md structure is invalid

3. **Parallel Agent Delegation**
   
   **Batch Execution Rules:**
   - Maximum 5 agents per batch
   - Deploy ALL eligible tasks in each batch simultaneously
   - Tasks eligible when: marked independent OR all dependencies complete
   
   **Each Agent Must:**
   - Read only their specific task from documentation
   - Access: `@$ARGUMENTS/parallel-plan.md`, `@$ARGUMENTS/shared.md`, relevant docs
   - Implement ONLY their assigned step
   - Run `get_compilation_errors` on modified files
   - FAIL FAST: Stop batch if compilation errors detected
   - Return: {taskId, filesModified, changesSummary}

   **Critical:** Deploy all agents in a batch with a SINGLE function call

4. **Batch Progress Tracking**
   After each batch completes:
   - Report: "Batch X complete: Y tasks executed"
   - Identify next eligible tasks (dependencies satisfied)
   - Continue with next parallel batch
   - FAIL FAST: Stop all execution if any task fails

## Completion
Final compilation check: !`get_compilation_errors /src | tail -5`

Upon success: "✅ Plan execution complete. Run /report for detailed analysis."
Upon failure: "❌ Execution failed at [taskId]. Fix errors and restart."