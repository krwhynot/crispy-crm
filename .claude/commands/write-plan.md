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

## STEP 3: Write the Plan

Only after confirmation, write the plan following the `writing-plans` skill structure.

**Save to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

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
