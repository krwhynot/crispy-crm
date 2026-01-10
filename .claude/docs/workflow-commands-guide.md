# Claude Code Workflow Commands & Agents Guide

Quick reference for the new workflow automation tools created in the 5-week optimization plan.

## Quick Reference

| Need To... | Use This |
|------------|----------|
| Fix failing tests | `/quick-test` or `test-fixer` agent |
| Fix color violations | `color-fixer` agent |
| Create a commit | `/commit` |
| Create a PR | `/pr` |
| Scaffold a new form | `form-builder` agent |
| Validate migrations | `migration-validator` agent |
| Audit RLS policies | `rls-auditor` agent |
| Audit database schema | `schema-auditor` agent |
| Refresh discovery caches | `/discover-refresh` |
| Create a migration | `/db-migrate <name>` |

---

## Commands (Slash Commands)

### `/quick-test [pattern]`
Run targeted tests and fix failures automatically.

**Examples:**
```
/quick-test                           # Run all tests
/quick-test CampaignActivity          # Run tests matching pattern
/quick-test src/atomic-crm/contacts   # Run tests in directory
```

**What it does:**
1. Runs tests matching the pattern
2. Analyzes failures and stack traces
3. Applies minimal fixes following testing-patterns skill
4. Re-runs to verify fixes
5. Reports what was fixed

---

### `/commit [-p]`
Stage changes and create a conventional commit.

**Examples:**
```
/commit                    # Create commit (no push)
/commit -p                 # Create commit and push
```

**What it does:**
1. Shows current git status
2. Generates conventional commit message (feat/fix/docs/style/perf/chore)
3. Adds scope if changes are localized (e.g., `feat(contacts):`)
4. Creates commit with Co-Authored-By line
5. Optionally pushes to remote

---

### `/pr [base-branch]`
Create a pull request with summary and test plan.

**Examples:**
```
/pr                        # PR against main
/pr develop                # PR against develop branch
```

**What it does:**
1. Analyzes all commits on current branch vs base
2. Generates PR title from branch/commits
3. Creates body with Summary + Test plan sections
4. Creates PR via `gh pr create`
5. Returns PR URL

---

### `/db-migrate <name>`
Create and validate a new database migration.

**Examples:**
```
/db-migrate add-customer-notes
/db-migrate update-contacts-rls
```

**What it does:**
1. Creates migration file: `just db-migrate <name>`
2. Opens file for review
3. Runs `just db-reset` to test migration
4. Regenerates types: `just db-types`
5. Validates types compile

---

### `/discover-refresh`
Refresh stale discovery caches for MCP code intelligence.

**Examples:**
```
/discover-refresh          # Check and refresh if needed
```

**What it does:**
1. Checks staleness: `just discover-staleness`
2. Runs incremental refresh if stale
3. Runs full refresh if major changes
4. Verifies MCP tools work

---

### `/fix-lint`
Fix all linting and formatting issues.

**Examples:**
```
/fix-lint                  # Auto-fix everything possible
```

**What it does:**
1. Runs `just lint-fix` (ESLint auto-fix)
2. Runs `just fmt` (Prettier)
3. Runs `just colors` (semantic color validation)
4. Reports remaining issues needing manual attention

---

## Agents (Autonomous Problem Solvers)

Agents are triggered by natural language. Just describe what you need.

### `test-fixer` (Red)
**Trigger phrases:** "fix tests", "failing tests", "test errors", "vitest failed"

**Example prompts:**
```
Fix the failing tests in CampaignActivityReport

The tests in contacts/__tests__ are broken, please fix them

I'm getting "Card is not defined" errors in tests
```

**What it does:**
1. Runs failing tests with verbose output
2. Analyzes error messages and stack traces
3. Identifies root cause (missing mock, bare render, async issues)
4. Applies minimal fix
5. Re-runs to verify
6. Reports root cause and solution

---

### `color-fixer` (Pink)
**Trigger phrases:** "fix colors", "semantic colors", "theme drift", "color violations"

**Example prompts:**
```
Fix the color violations in the codebase

Replace hardcoded Tailwind colors with semantic tokens

The pre-commit hook is failing on colors, fix them
```

**What it does:**
1. Searches for legacy color patterns (`text-gray-*`, `bg-amber-*`, etc.)
2. Maps to semantic tokens (`text-muted-foreground`, `bg-warning`, etc.)
3. Applies edits
4. Verifies with `npm run validate-semantic-colors`

---

### `form-builder` (Green)
**Trigger phrases:** "create form", "new form", "scaffold form", "add entity form"

**Example prompts:**
```
Create a form for tracking samples

Scaffold CRUD forms for the new Vendors entity

I need create/edit forms for Products
```

**What it does:**
1. Creates Zod schema in `src/atomic-crm/validation/`
2. Creates Create form with proper patterns
3. Creates Edit form
4. Creates reusable CompactForm component
5. Creates TypeScript types
6. Follows all project patterns (onBlur mode, ARIA, semantic colors)

---

### `schema-auditor` (Blue)
**Trigger phrases:** "schema audit", "missing columns", "view sync", "summary view"

**Example prompts:**
```
Audit the database schema for consistency

Check if all summary views have required columns

Validate the contacts table has all required fields
```

**What it does:**
1. Reads all migrations
2. Compares table vs view definitions
3. Flags missing required columns (id, created_at, updated_at, deleted_at)
4. Generates fix migration SQL

---

### `migration-validator` (Orange)
**Trigger phrases:** "validate migration", "check migration", "migration review"

**Example prompts:**
```
Validate this migration before I deploy

Review the new migration for safety issues

Check if my migration follows project patterns
```

**What it does:**
1. Checks reversibility
2. Verifies data preservation
3. Validates RLS compliance
4. Ensures soft deletes used (not hard deletes)
5. Checks for idempotent policies (DROP IF EXISTS)

---

### `rls-auditor` (Purple)
**Trigger phrases:** "rls audit", "policy check", "security audit", "soft delete blocking"

**Example prompts:**
```
Audit RLS policies for soft-delete filtering

Check if SELECT policies include deleted_at IS NULL

Security audit on the contacts table policies
```

**What it does:**
1. Extracts all RLS policies from migrations
2. Verifies SELECT policies filter `deleted_at IS NULL`
3. Checks tenant isolation
4. Checks user ownership verification
5. Generates fix migration SQL

---

## Fixing the 24 Pre-existing Test Failures

The test suite currently has 24 failures in 3 files. Here's how to fix them:

### Option 1: Use `/quick-test` Command
```
/quick-test CampaignActivityReport
```

### Option 2: Describe the Problem (triggers test-fixer)
```
Fix the failing tests - there's a "Card is not defined" error in CampaignActivityReport.tsx
```

### Option 3: Direct Fix Request
```
The CampaignActivityReport.tsx is missing a Card import at line 496. Fix it and verify tests pass.
```

### Known Issues to Fix

| File | Error | Likely Fix |
|------|-------|------------|
| `CampaignActivityReport.tsx:496` | `Card is not defined` | Add missing import from `@/components/ui/card` |

---

## Best Practices

1. **Use commands for routine tasks** - `/commit`, `/pr`, `/fix-lint` are faster than typing full instructions

2. **Use agents for complex problems** - Describe the issue naturally, the right agent will activate

3. **Combine tools** - Fix tests with agent, then `/commit -p` to push

4. **Trust but verify** - Agents report what they did; review the changes

5. **Use justfile** - All commands prefer `just` over `npm run` for consistency
