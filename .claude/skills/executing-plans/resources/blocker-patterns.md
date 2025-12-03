# Blocker Patterns Reference

Common blockers encountered during plan execution and how to investigate them.

## Table of Contents

1. [Missing Dependencies](#missing-dependencies)
2. [Test Failures](#test-failures)
3. [Type Errors](#type-errors)
4. [Runtime Errors](#runtime-errors)
5. [Unclear Instructions](#unclear-instructions)
6. [Constitution Violations](#constitution-violations)

---

## Missing Dependencies

### Symptoms
- Import errors: `Cannot find module 'x'`
- Type not found: `Cannot find name 'X'`
- File not found errors

### Investigation via Zen

```typescript
// mcp__zen__debug
{
  step: "Missing dependency: [module/file name]",
  hypothesis: "Package not installed or wrong import path",
  files_checked: ["package.json", "tsconfig.json"],
  confidence: "exploring",
  next_step_required: true
}
```

### Common Fixes
1. Check if package is in `package.json` → `npm install`
2. Check import path (relative vs absolute)
3. Check tsconfig paths configuration
4. Verify the file/module exists in codebase

---

## Test Failures

### Symptoms
- Jest/Vitest test failures
- Assertion errors
- Timeout errors

### Investigation via Zen

```typescript
// mcp__zen__debug
{
  step: "Test failure in [test file]",
  hypothesis: "Implementation doesn't match expected behavior",
  findings: "[Error message from test output]",
  relevant_files: ["path/to/test.ts", "path/to/implementation.ts"],
  confidence: "low",
  next_step_required: true
}
```

### Common Fixes
1. Read test expectations carefully
2. Check if test setup/teardown is correct
3. Verify mock data matches expected types
4. Check for async timing issues

---

## Type Errors

### Symptoms
- TypeScript compilation errors
- Property missing on type
- Type mismatch errors

### Investigation via Zen

```typescript
// mcp__zen__debug
{
  step: "Type error: [error message]",
  hypothesis: "Interface/type definition mismatch",
  files_checked: ["path/to/types.ts", "path/to/usage.ts"],
  confidence: "medium",
  next_step_required: true
}
```

### Common Fixes
1. Check interface definitions in validation schemas
2. Verify Zod schema matches TypeScript types
3. Check for optional vs required fields
4. Look for recent type definition changes

---

## Runtime Errors

### Symptoms
- Null/undefined access errors
- Network request failures
- Database connection errors

### Investigation via Zen

```typescript
// mcp__zen__thinkdeep
{
  problem_context: "Runtime error: [full error message with stack trace]",
  focus_areas: ["root cause", "data flow", "error propagation"],
  thinking_mode: "high"
}
```

### Common Fixes
1. Check data flow from source to error point
2. Verify environment variables are set
3. Check database connection and RLS policies
4. Trace null/undefined through call chain

---

## Unclear Instructions

### Symptoms
- Ambiguous task description
- Multiple valid interpretations
- Missing context in plan

### Investigation Approach

**Do NOT guess.** Escalate immediately:

```markdown
## CLARIFICATION NEEDED

**Task:** [Task number and description]

**Ambiguity:** [What's unclear]

**Interpretations:**
1. [Interpretation A] → would do X
2. [Interpretation B] → would do Y

**Context checked:**
- [ ] Plan header/architecture section
- [ ] Related tasks in plan
- [ ] Existing code patterns

**Question:** Which interpretation is correct?
```

---

## Constitution Violations

### Symptoms
- Plan asks for retry logic
- Plan includes hardcoded form defaults
- Plan bypasses unified data provider

### Handling

**Do NOT implement violations.** Report immediately:

```markdown
## CONSTITUTION VIOLATION IN PLAN

**Task:** [Task number]

**Violation:** [Which principle]

**Plan says:** "[Quoted instruction from plan]"

**Constitution says:** "[Quoted principle]"

**Options:**
1. Revise task to comply with constitution
2. Skip task and continue (with explanation)
3. Architect review of exception request

**Recommendation:** [Your recommendation with rationale]
```

---

## Escalation Decision Tree

```
Blocker encountered
        │
        ▼
┌───────────────────┐
│ Is it technical?  │
│ (code/test/type)  │
└───────────────────┘
        │
    YES │           NO
        │           │
        ▼           ▼
  Use Zen MCP    Is it unclear
  for analysis   instructions?
        │           │
        │       YES │           NO
        │           │           │
        │           ▼           ▼
        │      Ask for       Is it a
        │    clarification   constitution
        │                    violation?
        │                       │
        │                   YES │
        │                       ▼
        │                   Report and
        │                   await decision
        │
        ▼
  Confidence
  >= high?
        │
    YES │           NO
        │           │
        ▼           ▼
   Fix and      Escalate to
   continue     human review
```
