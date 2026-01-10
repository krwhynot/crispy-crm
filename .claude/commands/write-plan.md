---
name: write-plan
description: Creates detailed implementation plans for AI agent execution - integrates with /atomic-crm-constitution for principle enforcement, includes exact file paths, adaptive code examples, verification steps, and task dependency mapping for parallel agent execution
---

# Writing Plans

> **SKILL ACTIVATION:** I'm using the `writing-plans` skill.

**Required skills:** `writing-plans`, `enforcing-principles`

---

## STEP 1: Gather Context via Multi-Choice Questions

**BEFORE writing any plan, you MUST ask the user multiple-choice questions using the `AskUserQuestion` tool to gather clarity.**

### Question Set 1: Plan Type & Scope

Ask these questions FIRST:

```
Question 1: "What type of work is this plan for?"
Header: "Plan Type"
Options:
- "New Feature" - Adding new functionality to the CRM
- "Refactoring" - Improving existing code without changing behavior
- "Bug Fix" - Fixing broken functionality
- "Integration" - Connecting to external systems or APIs

Question 2: "What is the scope of this work?"
Header: "Scope"
Options:
- "Single file" - Changes to one file only
- "Single feature" - Changes within one feature module (e.g., contacts/)
- "Cross-feature" - Changes across multiple feature modules
- "Full stack" - Frontend, backend, database changes

Question 3: "Which CRM areas are involved?" (multiSelect: true)
Header: "Areas"
Options:
- "Contacts/Organizations" - Contact and org management
- "Opportunities/Pipeline" - Sales pipeline and deals
- "Activities/Tasks" - Activity logging and task management
- "Data Provider/Validation" - Core data layer changes
```

### Question Set 2: Execution Preferences

Ask these questions SECOND:

```
Question 1: "What task granularity do you prefer?"
Header: "Granularity"
Options:
- "Atomic (2-5 min)" - Very small, highly parallelizable tasks
- "Standard (5-15 min)" - Balanced task size
- "Chunked (15-30 min)" - Larger, more self-contained tasks

Question 2: "How should this plan be executed?"
Header: "Execution"
Options:
- "Sequential" - One task at a time, in order
- "Parallel groups" - Independent tasks run simultaneously
- "Hybrid" - Some parallel, some sequential based on dependencies

Question 3: "What level of code examples do you need?"
Header: "Examples"
Options:
- "Full code" - Complete implementations for all tasks
- "Skeletons + key parts" - Structure with important logic filled in
- "Minimal" - Just pseudocode and key patterns
```

### Question Set 3: Constraints & Special Considerations

Ask these questions THIRD (if needed based on scope):

```
Question 1: "Are there any database changes involved?"
Header: "Database"
Options:
- "No DB changes" - Frontend/logic only
- "New migrations" - Creating new tables, columns, or views
- "RLS policies" - Adding or modifying row-level security
- "Edge Functions" - Supabase Edge Function work

Question 2: "What testing approach?"
Header: "Testing"
Options:
- "TDD strict" - Write failing tests BEFORE implementation
- "Tests after" - Write tests after implementation
- "E2E focus" - Prioritize end-to-end tests
- "Minimal" - Only critical path tests
```

---

## STEP 2: Summarize Understanding

After gathering answers, summarize back to the user:

```markdown
## Plan Summary

**Type:** [New Feature / Refactoring / Bug Fix / Integration]
**Scope:** [Single file → Full stack]
**Areas:** [List of affected areas]
**Granularity:** [Atomic / Standard / Chunked]
**Execution:** [Sequential / Parallel / Hybrid]
**Database:** [Changes needed]
**Testing:** [Approach]

Does this look correct? Any adjustments before I write the plan?
```

---

## STEP 3: AI Estimation

**BEFORE writing the plan, use `mcp__zen__consensus` for multi-model estimation:**

```typescript
mcp__zen__consensus({
  step: `Estimate implementation effort for: [feature name from Step 2]

Project context:
- React 19 + TypeScript + React Admin + Supabase CRM
- Pre-launch (fail-fast principle, no retry logic)
- Scope: [from Step 1-2 answers]

Evaluate these aspects:
1. EFFORT: Story points (1, 2, 3, 5, 8, 13) with justification
2. RISK: Low/Medium/High with specific risk factors
3. COMPLEXITY: Simple/Moderate/Complex with reasoning
4. PARALLELIZATION: How many tasks can run simultaneously?
5. CRITICAL PATH: Which tasks must be sequential?
6. AGENT RECOMMENDATIONS: Which specialized agents should be used?`,
  step_number: 1,
  total_steps: 3, // 1: your analysis, 2-3: model consultations
  next_step_required: true,
  findings: "Starting estimation for [feature]",
  models: [
    { model: "gemini-2.5-pro", stance: "neutral" },
    { model: "gpt-5.2", stance: "neutral" }
  ]
})
```

**Include the consensus results in the Executive Summary table.**

---

## STEP 4: Write the Plan

Only after confirmation and estimation, write the plan following the `writing-plans` skill structure.

### Task Template with Agent Hints

Each task in the Task Breakdown MUST include an Agent Hint:

```markdown
### Task N: [Task Name]

**Agent Hint:** `[agent-name]` ([reason for this agent])
**File:** `exact/path/to/file.ts`
**Line:** [if modifying existing code]
**Effort:** X story points
**Dependencies:** [Task IDs this depends on, or "None"]

#### What to Implement
[Clear description of the change]

#### Code Example
[Implementation code with constitution compliance markers]

#### Verification
- [ ] [Test command or check]

#### Constitution Checklist
- [ ] Zod validation at API boundary only
- [ ] No retry logic or fallbacks
- [ ] Semantic Tailwind colors only
```

### Agent Hint Reference

| Agent | Use When |
|-------|----------|
| `schema-agent` | Zod schemas, type definitions, validation |
| `component-agent` | React components, UI changes |
| `provider-agent` | Data provider, handlers, Supabase queries |
| `test-agent` | Writing tests (unit, integration, E2E) |
| `migration-agent` | Database migrations, RLS policies |
| `style-agent` | Tailwind styling, design system |
| `general-agent` | Config files, documentation, simple edits |

**Save to:** `docs/archive/plans/YYYY-MM-DD-<feature-name>.md`

---

## STEP 4: Zen MCP Review

**AFTER writing the plan, use `mcp__zen__thinkdeep` or `mcp__zen__chat` to review for issues and gaps.**

### Review Prompt Template

Use this prompt with Zen MCP:

```
Review this implementation plan for a Crispy CRM feature.

**Context:**
- React 19 + TypeScript + React Admin + Supabase CRM
- Pre-launch product (fail-fast, no retry logic)
- Must follow: Zod validation at API boundary only, unifiedDataProvider for all data access
- Touch targets: 44x44px minimum

**Plan to Review:**
[Paste or reference the plan file path]

**Check for:**
1. **Gaps:** Missing steps, unclear dependencies, incomplete tasks
2. **Principle Violations:** Retry logic, validation in wrong layer, direct Supabase imports
3. **Ambiguity:** Vague instructions that could be misinterpreted by zero-context agents
4. **Risk Areas:** Tasks that could introduce bugs or break existing functionality
5. **Parallelization:** Missed opportunities for parallel execution
6. **Testing Gaps:** Missing test coverage for critical paths

**Output:**
- List of issues found (Critical / High / Medium / Low)
- Suggested fixes for each issue
- Overall plan quality score (1-10)
- Recommendation: Ready to execute / Needs revision
```

### Zen Tool Selection

| Use This Tool | When |
|---------------|------|
| `mcp__zen__thinkdeep` | Deep analysis, complex plans, multi-step investigation |
| `mcp__zen__chat` | Quick review, simple plans, clarifying questions |
| `mcp__zen__debug` | If plan involves fixing bugs, trace dependencies |

### Review Workflow (Loop Until Clean)

```
Plan Written → Save to docs/archive/plans/
                    ↓
    ┌───────────────────────────────────┐
    │         ZEN MCP REVIEW            │
    │  (Loop until no issues found)     │
    └───────────────────────────────────┘
                    ↓
              Issues Found?
                    │
         ┌─────────┴─────────┐
         │ YES               │ NO
         ↓                   ↓
    ┌─────────────┐    ┌─────────────┐
    │ Show Issues │    │   PASSED!   │
    │ Revise Plan │    │ Ready for   │
    │ Save Update │    │/execute-plan│
    └─────────────┘    └─────────────┘
         │
         └──────→ Loop back to Zen Review
```

### Loop Behavior

**IMPORTANT:** Continue the review loop until Zen returns:
- **Quality Score:** 8+ out of 10
- **Critical Issues:** 0
- **High Issues:** 0
- **Recommendation:** "Ready to execute"

**Each iteration:**
1. Run Zen review on current plan
2. If issues found → Display issues to user
3. Revise plan based on feedback
4. Save updated plan
5. Re-run Zen review
6. Repeat until clean

### Maximum Iterations

- **Soft limit:** 3 iterations (ask user if should continue)
- **Hard limit:** 5 iterations (escalate - plan may need rethinking)

If hitting iteration limits:
```
⚠️ Plan has been revised 3 times but still has issues.
Options:
1. Continue iterating
2. Accept current plan with known issues
3. Rethink approach entirely
```

### Example Review Call

```typescript
mcp__zen__thinkdeep({
  step: "Reviewing implementation plan for [Feature Name]",
  step_number: 1,
  total_steps: 1,
  next_step_required: false,
  findings: "Analyzing plan for gaps, principle violations, and ambiguity",
  hypothesis: "Plan may have issues with [specific concern]",
  confidence: "medium",
  relevant_files: ["docs/archive/plans/2025-12-03-feature-name.md"],
  model: "gemini-2.5-pro",
  thinking_mode: "high"
})
```

---

## Quick Reference

**Principles:** Zero context. TDD mandatory. Constitution compliance. Exact paths.

**Assume executing agent:**
- Has never seen this repo
- Has NOT read the constitution
- Takes instructions literally

---

## Remember

- Zero context - overcommunicate
- Exact file paths - no "appropriate directory"
- Complete commands with expected output
- Every task includes constitution checklist
- Flag violations in code examples with ✅/❌

---

## Example Question Flow

Here's a complete example of the questioning workflow:

### Round 1 Response:
```
Plan Type: "New Feature"
Scope: "Cross-feature"
Areas: ["Opportunities/Pipeline", "Activities/Tasks"]
```

### Round 2 Response:
```
Granularity: "Standard (5-15 min)"
Execution: "Parallel groups"
Examples: "Skeletons + key parts"
```

### Round 3 Response:
```
Database: "New migrations"
Testing: "TDD strict"
```

### Summary Presented:
```markdown
## Plan Summary

**Type:** New Feature
**Scope:** Cross-feature (Opportunities + Activities)
**Areas:** Opportunities/Pipeline, Activities/Tasks
**Granularity:** Standard (5-15 min tasks)
**Execution:** Parallel groups where possible
**Database:** New migrations required
**Testing:** TDD strict - failing tests first

Does this look correct?
```

### User Confirms → Write Plan
