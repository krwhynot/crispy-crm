---
description: Run tests matching pattern and fix failures
allowed-tools: Bash, Read, Edit
argument-hint: [test-pattern or file path]
---

# Quick Test Command

Run targeted tests and fix failures iteratively.

## Process

1. Run tests matching the pattern:
   ```bash
   npx vitest run $ARGUMENTS --reporter=verbose
   ```
   Or if no arguments: `just test`

2. If tests pass: Report success and coverage

3. If tests fail:
   - Analyze error messages and stack traces
   - Identify root cause from common patterns:
     | Error | Cause | Fix |
     |-------|-------|-----|
     | "Cannot read property of undefined" | Missing mock | Add mock |
     | "useAdmin must be used within AdminContext" | Bare render | Use renderWithAdminContext |
     | State pollution | clearAllMocks | Use resetAllMocks |
   - Apply minimal fix
   - Re-run tests

4. Repeat until passing or blocked

## Test Patterns

```bash
# Single file
/quick-test contacts/ContactEdit.test.tsx

# Pattern matching
/quick-test "validation/**"

# All tests
/quick-test
```

## Rules

- Use `renderWithAdminContext` not bare `render`
- Use `vi.resetAllMocks()` not `clearAllMocks`
- Don't change test expectations without understanding intent
- Report what was fixed and why
