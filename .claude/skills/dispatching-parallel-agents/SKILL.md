---
name: dispatching-parallel-agents
description: Use when facing 3+ independent tasks, failures, or file changes that can be worked on without shared state - dispatches multiple Claude agents to work concurrently. Triggers on parallel, concurrent, dispatch agents, multiple failures, independent tasks, batch fix.
---

# Dispatching Parallel Agents

## Purpose

When multiple unrelated tasks exist across different files or subsystems, sequential work wastes time. **Dispatch one agent per independent problem domain. Let them work concurrently.**

## When to Use This Skill

### Trigger Conditions (ANY of these)

| Condition | Example |
|-----------|---------|
| 3+ test files failing with distinct root causes | `ContactList.test.tsx`, `OpportunityEdit.test.tsx`, `useActivities.test.ts` |
| Multiple unrelated features to implement | API endpoint + UI component + E2E test |
| Independent refactoring across subsystems | Rename in providers + update in components + fix in validation |
| Parallel bug investigations | Auth issue + form bug + query error |

### Decision Framework

```
┌─────────────────────────────────────────────────────┐
│ Can problems be solved independently?               │
│                                                     │
│   YES → Are there 3+ distinct problem domains?      │
│         │                                           │
│         ├── YES → DISPATCH PARALLEL AGENTS          │
│         │                                           │
│         └── NO  → Work sequentially                 │
│                                                     │
│   NO  → Work sequentially (shared state/deps)       │
└─────────────────────────────────────────────────────┘
```

### DO NOT Use When

- Failures are interconnected (fixing A affects B)
- Full system understanding is required first
- Agents would conflict (editing same files)
- Investigation phase needed before action

---

## The Four-Step Pattern

### Step 1: Group by Independence

Identify distinct problem domains that don't share state:

```
Failures:
  ✓ ContactList.test.tsx      → Contact feature domain
  ✓ OpportunityEdit.test.tsx  → Opportunity feature domain
  ✓ useActivities.test.ts     → Activities hook domain
  ✗ ActivityList.test.tsx     → Also Activities domain (group with above)
```

### Step 2: Create Focused Agent Tasks

Each agent needs:
- **Scope**: Exact files and boundaries
- **Goal**: Specific deliverable
- **Constraints**: What NOT to touch
- **Context**: Relevant background

**Template:**
```
TASK: [Brief title]
SCOPE: [Files/directories agent owns]
GOAL: [Specific, measurable outcome]
CONSTRAINTS:
- Only modify files in [scope]
- Do not change [shared resources]
CONTEXT: [Relevant background info]
DELIVERABLE: [What success looks like]
```

### Step 3: Dispatch Concurrently

Use the Task tool with multiple parallel invocations:

```typescript
// In a single message, dispatch multiple Task tool calls:
Task({ subagent_type: "task-implementor", prompt: "Task 1..." })
Task({ subagent_type: "task-implementor", prompt: "Task 2..." })
Task({ subagent_type: "task-implementor", prompt: "Task 3..." })
```

### Step 4: Integrate Results

After agents complete:
1. Review each agent's summary
2. Check for unexpected conflicts
3. Run full test suite
4. Commit as cohesive change

---

## Crispy CRM Examples

### Example 1: Multiple Test Failures

**Scenario:** 3 test files failing after React Admin upgrade

```
AGENT 1 - Contact Tests
SCOPE: src/atomic-crm/contacts/__tests__/
GOAL: Fix all failing tests in ContactList.test.tsx
CONSTRAINTS:
- Only modify test files, not source
- Use renderWithAdminContext from src/tests/utils/render-admin.tsx
CONTEXT: React Admin upgraded to 5.x, some APIs changed
DELIVERABLE: All contact tests passing

---

AGENT 2 - Opportunity Tests
SCOPE: src/atomic-crm/opportunities/__tests__/
GOAL: Fix all failing tests in OpportunityEdit.test.tsx
CONSTRAINTS:
- Only modify test files, not source
- Mock Supabase per src/tests/setup.ts patterns
CONTEXT: React Admin upgraded to 5.x, form APIs changed
DELIVERABLE: All opportunity tests passing

---

AGENT 3 - Hook Tests
SCOPE: src/atomic-crm/activities/__tests__/
GOAL: Fix useActivities.test.ts hook tests
CONSTRAINTS:
- Only modify test files
- Follow React Testing Library patterns
CONTEXT: Hook testing patterns may need act() updates
DELIVERABLE: All activity hook tests passing
```

### Example 2: Feature Implementation

**Scenario:** Add export functionality to 3 list views

```
AGENT 1 - Contact Export
SCOPE: src/atomic-crm/contacts/
GOAL: Add CSV export button to ContactList
CONSTRAINTS:
- Follow existing button patterns in component
- Use react-admin's ExportButton component
CONTEXT: Design system uses Tailwind v4 semantic colors
DELIVERABLE: Working export button on contact list

---

AGENT 2 - Opportunity Export
SCOPE: src/atomic-crm/opportunities/
GOAL: Add CSV export button to OpportunityList
CONSTRAINTS:
- Match Contact export implementation pattern
- Include pipeline stage in export
CONTEXT: Opportunities have 7 pipeline stages to include
DELIVERABLE: Working export button on opportunity list

---

AGENT 3 - Organization Export
SCOPE: src/atomic-crm/organizations/
GOAL: Add CSV export button to OrganizationList
CONSTRAINTS:
- Match Contact export implementation pattern
- Include organization type in export
CONTEXT: Organizations are typed as principal/distributor/operator
DELIVERABLE: Working export button on organization list
```

### Example 3: Parallel Bug Investigation

**Scenario:** 3 unrelated bugs reported

```
AGENT 1 - Auth Redirect Bug
SCOPE: src/auth/, src/App.tsx
GOAL: Investigate why login redirects to wrong page
CONSTRAINTS: Only read files, propose fix, don't implement
DELIVERABLE: Root cause analysis + proposed fix

---

AGENT 2 - Form Validation Bug
SCOPE: src/atomic-crm/contacts/ContactCreate.tsx, src/atomic-crm/validation/
GOAL: Investigate why phone validation rejects valid numbers
CONSTRAINTS: Only read files, propose fix, don't implement
DELIVERABLE: Root cause analysis + proposed fix

---

AGENT 3 - Query Performance Bug
SCOPE: src/atomic-crm/providers/supabase/
GOAL: Investigate slow opportunity list load time
CONSTRAINTS: Only read files, propose fix, don't implement
DELIVERABLE: Root cause analysis with query optimization recommendations
```

---

## Agent Prompt Best Practices

### DO

- **Be specific**: "Fix ContactList.test.tsx line 45-67 assertions"
- **Set boundaries**: "Only modify files in src/atomic-crm/contacts/"
- **Provide context**: "Using React Admin 5.x with Supabase backend"
- **Define deliverables**: "All tests passing, no type errors"

### DON'T

- **Be vague**: "Fix all the tests"
- **Over-scope**: "Refactor the entire test suite"
- **Under-context**: "Make it work"
- **Skip constraints**: Allow agents to wander into shared code

---

## Conflict Prevention

### Safe Parallel Domains in Crispy CRM

| Domain | Files | Safe to Parallelize |
|--------|-------|---------------------|
| Contacts | `src/atomic-crm/contacts/**` | Yes |
| Opportunities | `src/atomic-crm/opportunities/**` | Yes |
| Organizations | `src/atomic-crm/organizations/**` | Yes |
| Activities | `src/atomic-crm/activities/**` | Yes |
| Validation | `src/atomic-crm/validation/**` | Careful - shared |
| Providers | `src/atomic-crm/providers/**` | No - shared |

### Shared Resources (NEVER parallelize)

- `unifiedDataProvider.ts` - Single entry point for all data
- `supabase/migrations/` - Sequential by nature
- `src/tests/setup.ts` - Global test config
- `tailwind.config.ts` - Shared styling

---

## Quick Reference

```
PARALLEL DISPATCH CHECKLIST:
□ 3+ independent problem domains identified
□ No shared state between domains
□ Clear scope boundaries for each agent
□ Specific goals with measurable outcomes
□ Constraints prevent file conflicts
□ Context provided for each task
□ Integration plan for results
```
