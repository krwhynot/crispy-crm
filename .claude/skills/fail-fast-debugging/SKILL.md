---
name: fail-fast-debugging
description: Systematic debugging discipline that enforces root cause investigation BEFORE fixes. Includes backward call-chain tracing to find where bugs originate. Triggers on - bug, error, failing, broken, fix, not working, crash, issue, debug, investigate, diagnose, trace, root cause, call stack, why is, undefined, null, 500 error, RLS, timeout, infinite loop, exception, stack trace, test pollution, flaky test, bisect, find the source, where does this come from, track down. Integrates with TodoWrite and verification-before-completion. Aligns with fail-fast engineering principle.
---

# Fail-Fast Debugging

## Purpose

Enforce disciplined debugging that finds root causes BEFORE attempting fixes. This skill prevents wasted effort from symptom-chasing and aligns with the fail-fast engineering principle.

**Core Mandate:** NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST

## When to Use

Automatically activates when you mention:
- Error terms: bug, error, failing, broken, crash, issue, exception
- Investigation terms: debug, investigate, diagnose, trace, root cause, call stack, why is
- Tracing terms: find the source, where does this come from, track down, bisect
- Test terms: test pollution, flaky test
- Symptoms: undefined, null, 500 error, RLS policy, timeout, infinite loop
- Fix attempts: fix, not working, still failing, try again

## The Four Phases

### Phase 1: Root Cause Investigation (MANDATORY)

**STOP. Do not propose any fixes until completing these steps:**

1. **Examine the error** - Read the FULL error message and stack trace
2. **Reproduce consistently** - Confirm you can trigger the issue reliably
3. **Check recent changes** - `git log -5 --oneline` and `git diff` for context
4. **Gather diagnostic evidence** - Console logs, network tab, RLS policies
5. **Trace data flow backward** - Use the 5-Step Backward Trace (below)

#### 5-Step Backward Trace (Call-Chain Tracing)

**This sub-process BLOCKS edits to symptom-location files until tracing is complete.**

```
1. OBSERVE     -> Note where error appears (symptom location)
2. IMMEDIATE   -> Identify direct code causing the symptom
3. TRACE UP    -> Ask: "What called this? What passed these values?"
4. KEEP GOING  -> Follow the chain - each level reveals context
5. FIND SOURCE -> Locate where invalid data/state ORIGINATED
```

**Guardrail triggers (BLOCKS edits):**
- Editing files where errors manifest without investigation
- Adding try/catch, null checks, or defensive guards without tracing
- Quick-fix patterns that treat symptoms
- Phrases like "the error is in X" followed by editing X

**Before edits are unblocked, you must:**
1. Identify symptom location - Where does error appear?
2. Trace at least 2 levels up - What called this? What called that?
3. State hypothesis - Where do you believe root cause is?
4. Use extended thinking to structure your investigation

**Quick reference - trace targets:**

| Symptom | DON'T Fix Here | Trace To |
|---------|----------------|----------|
| Null in component | Component file | Data provider / API |
| Type error in form | Form component | Schema / validation |
| Test flaky | Test file | Shared state / isolation |
| API error 500 | Error handler | Request construction |
| Render loop | Component | State management |

**Required Approach:** Structure your investigation with deep analysis:
```
Investigating [error]. Evidence gathered: [list].
Hypothesis: [theory]. Next diagnostic step: [action].
```

**Required Action:** Create investigation todos BEFORE any fix attempts:
```
TodoWrite: [
  {"content": "Reproduce error consistently", "status": "in_progress"},
  {"content": "Trace data flow to origin point", "status": "pending"},
  {"content": "Identify root cause (not symptom)", "status": "pending"},
  {"content": "Implement targeted fix", "status": "pending"},
  {"content": "Verify fix resolves issue", "status": "pending"}
]
```

### Phase 2: Pattern Analysis

1. **Find working examples** - Locate similar code that DOES work
2. **Compare implementations** - List ALL differences (imports, types, props, queries)
3. **Check dependencies** - Verify versions, configurations, environment
4. **Review assumptions** - What are you assuming that might be wrong?

### Phase 3: Hypothesis Testing

1. **Form a specific hypothesis** - "The error occurs because X"
2. **Test with minimal change** - ONE change at a time
3. **Verify before proceeding** - Confirm the hypothesis was correct
4. **Admit uncertainty** - Say "I don't know" rather than guessing

### Phase 4: Implementation

1. **Write a failing test first** (when applicable)
2. **Implement the fix** - Target the ROOT CAUSE, not symptoms
3. **Verify the solution** - Run tests, check the specific scenario
4. **Document learnings** - What caused this? How to prevent recurrence?

---

## Critical Rules

### The 2-Attempt Rule

**If TWO fix attempts fail, STOP and question the architecture.**

After 2 failed attempts:
1. Step back from implementation details
2. Ask: "Is the underlying design sound?"
3. Consider: Are we fighting the framework/pattern?
4. Use extended thinking for deep architectural analysis

### One Change at a Time

- NEVER bundle multiple fixes
- Each change must be testable in isolation
- If you can't isolate the fix, you don't understand the problem

### Verify Before Claiming Fixed

- Run the actual failing scenario
- Check related functionality didn't break
- Use `verification-before-completion` skill compliance

---

## Anti-Patterns (RED FLAGS)

See [ANTI-PATTERNS.md](ANTI-PATTERNS.md) for detailed patterns. Summary:

**If you catch yourself thinking any of these, RESTART Phase 1:**

| Anti-Pattern | The Thought | Why It's Wrong |
|--------------|-------------|----------------|
| Quick Fix | "Let me just try..." | Skips investigation |
| Shotgun | "I'll change A, B, and C" | Can't isolate cause |
| Retry Logic | "Add error handling to catch this" | Masks root cause (violates fail-fast) |
| Hope Fix | "Maybe this will work" | Guessing, not investigating |
| Blame Shift | "Must be a library bug" | Avoids looking at your code |
| Defensive Guard | `if (contact?.name) { ... }` without knowing WHY it's null | Hides the origin of invalid state |
| Error Swallowing | `try { ... } catch (e) { console.error("failed") }` | Suppresses root cause; violates fail-fast |
| Symptom-Location Fix | Error in X, immediately edit X | The null/error may originate from API, provider, or transform |

---

## CRM-Specific Debugging

See [CRM-DEBUGGING.md](CRM-DEBUGGING.md) for Crispy CRM patterns. Quick reference:

### React Admin Issues
- Check `unifiedDataProvider` first - ALL data flows through it
- Verify Zod schemas match API responses
- Check React Admin resource registration

### Supabase/RLS Issues
- Test query in Supabase SQL editor first
- Check RLS policies with `auth.uid()` context
- Verify `deleted_at IS NULL` filters

### Data Provider Issues
- Log at API boundary in `unifiedDataProvider`
- Check Zod validation errors (they're intentionally loud)
- Verify junction table relationships (e.g., `contact_organizations`)

---

## Test Pollution Detection

For flaky tests or test pollution, use the find-polluter bisection script:

```bash
# Find which test creates unwanted .git directory
./find-polluter.sh '.git' 'src/**/*.test.ts'

# Find which test leaves database state
./find-polluter.sh 'test.db' 'tests/**/*.spec.ts'
```

See: `.claude/skills/fail-fast-debugging/find-polluter.sh`

---

## Tool Integration

### Required Tools

| Tool | When | Purpose |
|------|------|---------|
| Extended thinking | Phase 1-3 | Structure investigation thinking |
| `TodoWrite` | Before fixes | Track investigation steps |
| `verification-before-completion` | Phase 4 | Verify before claiming done |

---

## Enforcement

**Contextual enforcement based on file criticality:**

| File Pattern | Enforcement | Rationale |
|--------------|-------------|-----------|
| `*/providers/*` | BLOCK | Data layer is critical |
| `*/validation/*` | BLOCK | Schema errors cascade |
| `supabase/migrations/*` | BLOCK | Database changes are permanent |
| `*/components/*` | SUGGEST | UI bugs less critical |
| `*/__tests__/*` | SUGGEST | Test files are experimental |

---

## Quick Reference Checklist

Before proposing ANY fix, confirm:

- [ ] I read the FULL error message and stack trace
- [ ] I can reproduce the issue consistently
- [ ] I checked `git log` and `git diff` for recent changes
- [ ] I traced the problem to its ORIGIN using the 5-step backward trace
- [ ] I traced at least 2 levels up from the symptom location
- [ ] I created investigation todos
- [ ] I used structured analysis to organize my thinking
- [ ] I have a specific hypothesis (not a guess)
- [ ] I'm making ONE change at a time
- [ ] This is attempt #1 or #2 (not #3+)

---

**Remember:** Addressing symptoms without understanding causes guarantees rework. Take the time to investigate FIRST.
