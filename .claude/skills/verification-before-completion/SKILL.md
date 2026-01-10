---
name: verification-before-completion
description: Evidence-based completion claims - BLOCKS claiming tests pass, builds succeed, features work, or tasks are done without running verification commands first. Enforces TDD for implementation tasks. Triggers on done, complete, fixed, passes, works, ready, finished, verified, all good, ship it, commit, PR, push, merge, implement, create feature, build.
---

# Verification Before Completion

## The Iron Law

**NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE**

Never claim work is complete, fixed, passing, or ready without:
1. Running the verification command
2. Reading the actual output
3. Confirming it matches your claim

## TDD Enforcement (Implementation Tasks)

**For ANY implementation task (new feature, component, handler, schema):**

| Phase | Requirement | Evidence |
|-------|-------------|----------|
| 1. TEST FIRST | Write failing test BEFORE implementation | Test file exists, test fails with expected reason |
| 2. IMPLEMENT | Write minimal code to pass test | Test now passes |
| 3. REFACTOR | Clean up while tests pass | Tests still pass |
| 4. VERIFY | Run full verification suite | Build + Types + Tests pass |

**TDD is NOT optional for:**
- New components (React components, hooks)
- New data provider handlers
- New Zod schemas
- New service classes
- Bug fixes (regression test first)

**TDD Red Flags - STOP if you're about to:**
- Write implementation code without a test file
- Say "I'll add tests later"
- Skip the failing test phase
- Implement multiple features before testing

## Manual E2E for UI Changes

**For ANY UI-facing change, offer Manual E2E Testing:**

When implementing UI changes (forms, lists, slide-overs, buttons), remind user:

> **Manual E2E Available:** This UI change can be verified using Claude Chrome.
> See `docs/tests/e2e/` for existing test prompts or I can generate a new one.
>
> Would you like me to generate a Claude Chrome test prompt for this feature?

**When to generate E2E prompts:**
- New forms (CRUD create/edit)
- New validation rules
- UI workflow changes
- Accessibility improvements
- Any user-facing feature

## The 5-Step Gate

Before ANY completion claim:

| Step | Action | Required Output |
|------|--------|-----------------|
| 1. IDENTIFY | What command proves your claim? | `npm run build`, `npx tsc --noEmit`, etc. |
| 2. RUN | Execute the command fresh | Full terminal output |
| 3. READ | Review complete output | Exit codes, error counts |
| 4. VERIFY | Does output match claim? | YES → proceed, NO → fix first |
| 5. CLAIM | State result WITH evidence | "Build passes (exit 0, 0 errors)" |

**Skip any step = lying, not verifying**

## Crispy CRM Verification Commands

| Claim | Required Command | Success Criteria |
|-------|-----------------|------------------|
| Build passes | `npm run build` | Exit 0, no errors |
| Types are correct | `npx tsc --noEmit` | Exit 0, no type errors |
| Tests pass | `npm test` | All tests pass, 0 failures |
| E2E works | `npx playwright test` | All scenarios pass |
| Feature complete | Checklist verification | All requirements checked |
| Ready to commit | Build + Types + Tests | All three pass |

## Red Flags - STOP

If you're about to say ANY of these, STOP and verify:

| Red Flag | What To Do Instead |
|----------|-------------------|
| "Should work now" | RUN `npm run build` |
| "Types look correct" | RUN `npx tsc --noEmit` |
| "Tests should pass" | RUN `npm test` |
| "I'm confident this works" | Confidence ≠ evidence |
| "The feature is complete" | Verify against requirements |
| "Ready for commit/PR" | Run full verification suite |
| "Looks good" | Show actual output |

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the command |
| "I'm confident" | Confidence ≠ evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter ≠ TypeScript compiler |
| "I checked the code" | Reading ≠ running |
| "It worked before" | Before ≠ now |
| "Partial check is enough" | Partial proves nothing |

## Correct Patterns

### Build Verification
```
✅ CORRECT:
[Run: npm run build]
[See: exit 0, no errors]
"Build passes - exit 0, compiled successfully"

❌ WRONG:
"Build should pass now"
"The code looks correct"
"I fixed the error so it works"
```

### TypeScript Verification
```
✅ CORRECT:
[Run: npx tsc --noEmit]
[See: no output (means success)]
"TypeScript check passes - 0 errors"

❌ WRONG:
"Types look correct"
"Fixed the type error"
"Should compile now"
```

### Feature Completion
```
✅ CORRECT:
Requirements checklist:
- [x] User can create contact (verified via test)
- [x] Validation shows errors (verified via build)
- [x] Form saves to database (verified via E2E)
"Feature complete - all 3 requirements verified"

❌ WRONG:
"Feature is complete"
"All requirements implemented"
"Ready for review"
```

### Git Operations
```
✅ CORRECT:
[Run: npm run build] → exit 0
[Run: npx tsc --noEmit] → 0 errors
"Ready to commit - build and types verified"

❌ WRONG:
"Ready to commit"
"Can push now"
"PR is ready"
```

## When This Applies

**ALWAYS before:**
- Claiming tests pass
- Claiming build succeeds
- Claiming types are correct
- Claiming bug is fixed
- Claiming feature is complete
- Claiming ready for commit/PR/push
- Any variation of "done", "works", "fixed"

**Rule applies to:**
- Exact phrases ("tests pass")
- Paraphrases ("specs are green")
- Implications ("we're good to go")
- Any positive statement about work state

## The Bottom Line

> No shortcuts for verification. Run the command. Read the output.
> THEN claim the result. This is non-negotiable.

Evidence before claims, always.
