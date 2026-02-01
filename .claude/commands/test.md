---
description: Run tests - accepts optional file path or pattern argument
---

# Run Tests

Run the Vitest test suite. Accepts an optional argument for targeted testing.

## Determine Scope

**Argument provided:** `$ARGUMENTS`

| Argument | Command |
|----------|---------|
| (empty / "all") | `npx vitest run` |
| File path (e.g., `src/atomic-crm/validation/__tests__/contact.test.ts`) | `npx vitest run <path>` |
| Pattern (e.g., `"contact validation"`) | `npx vitest run -t "<pattern>"` |
| Directory (e.g., `src/atomic-crm/contacts/`) | `npx vitest run <dir>` |

If the argument looks like a file path (contains `/` or `\` or ends in `.test.ts`), use it as a path.
If it looks like a quoted string or words, use it as a `-t` pattern.

## Execute

Run the determined command and capture the output.

## Report Results

Summarize concisely:

```
Tests: X passed, Y failed, Z total
Duration: N seconds
```

**If failures exist:**
- Show the first 3 failing test names and their error messages
- Suggest: "Run `/test <failing-file>` to re-run just the failures"

**If all pass:**
- Report the pass count and duration
- If a specific file/pattern was tested, suggest: "Run `/test` for the full suite"
