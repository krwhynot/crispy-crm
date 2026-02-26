# Husky Pre-Commit Patterns

Documentation of the git hook execution flow and patterns used in `.husky/pre-commit`.
Regenerated from the actual hook source; line numbers reference `.husky/pre-commit` directly.

## Architecture Overview

```
.husky/
  _/                 # INTERNAL: Managed by Husky - do not modify
    h                # Hook dispatcher (resolves hook path, runs with sh -e)
    husky.sh         # DEPRECATED - v10 migration warning
  pre-commit         # 7-step quality gate (BLOCKING)
  post-merge         # Migration notification (ADVISORY, always exit 0)
  PATTERNS.md        # This file

Pre-Commit Execution Flow (7 steps):
  git commit
      |
      v
  .husky/_/h (dispatcher: adds node_modules/.bin to PATH, runs pre-commit)
      |
      v
  .husky/pre-commit
      |
      +-- [Fast Mode?] SKIP_SLOW_HOOKS=1 disables steps 3, 4, 7  (lines 14-23)
      |
      +-- Step 1: Security scan           BLOCKING   always runs    (lines 25-41)
      +-- Step 2: UI Patterns gate         BLOCKING   .tsx staged    (lines 43-84)
      +-- Step 3: TypeScript type-check    BLOCKING   .ts/.tsx staged, skippable  (lines 86-98)
      +-- Step 4: Discovery staleness      WARNING    src/atomic-crm staged, skippable  (lines 100-114)
      +-- Step 5: Semantic colors          BLOCKING   .tsx staged    (lines 116-130)
      +-- Step 6: Migration validation     BLOCKING   migrations staged  (lines 132-150)
      +-- Step 7: Migration drift          BLOCKING   migrations staged, skippable  (lines 152-200)
      |
      v
  "Pre-commit checks passed" (line 204)
```

---

## Fast Mode: SKIP_SLOW_HOOKS

### Problem

Full pre-commit takes several seconds due to `tsc`, discovery checks, and Supabase
network calls. During rapid iteration this slows the developer loop.

### Solution

Set `SKIP_SLOW_HOOKS=1` to disable the three slowest steps (type-check, discovery,
drift detection) while keeping all security and style gates active.

### Implementation

```bash
# .husky/pre-commit lines 14-23
# Usage: SKIP_SLOW_HOOKS=1 git commit -m "message"
if [ "$SKIP_SLOW_HOOKS" = "1" ]; then
  echo -e "${YELLOW}Fast mode: skipping type-check, discovery, and drift checks${NC}"
  SKIP_TYPECHECK=1
  SKIP_DISCOVERY=1
  SKIP_DRIFT=1
fi
```

**Key points:**
- Steps 1, 2, 5, and 6 always run regardless of fast mode
- Steps 3 (`SKIP_TYPECHECK`), 4 (`SKIP_DISCOVERY`), and 7 (`SKIP_DRIFT`) are disabled
- CI enforces full checks; fast mode is a local-only convenience

---

## Step 1: Security Scan -- Block .env Files

### Problem

Accidentally committing `.env` files leaks secrets (API keys, database URLs) into
version control history, which is difficult to fully purge.

### Solution

Scan staged files for any `.env` or `.env.*` patterns and block the commit immediately
with remediation instructions.

### Implementation

```bash
# .husky/pre-commit lines 25-41
env_files=$(echo "$STAGED_FILES" | grep -E '\.env$|\.env\.' || true)

if [ -n "$env_files" ]; then
  echo -e "${RED}COMMIT BLOCKED: .env file(s) detected${NC}"
  echo -e "${YELLOW}The following .env files are staged for commit:${NC}"
  echo "$env_files" | sed 's/^/  - /'
  echo "To fix: git reset HEAD $env_files"
  exit 1
fi
```

**Key points:**
- Runs FIRST before any expensive operations (security-first ordering)
- `|| true` prevents grep from returning non-zero on no match
- BLOCKING: `exit 1` on any match -- no bypass short of `--no-verify`
- Cannot be skipped by `SKIP_SLOW_HOOKS`

---

## Step 2: UI Patterns Enforcement

### Problem

Feature code drifts from the design system when developers use native HTML elements
or hardcoded Tailwind color classes instead of project wrappers and semantic tokens.

### Solution

Scan staged `.tsx` files under `src/atomic-crm/` (excluding tests) for three specific
anti-patterns and block the commit if any are found.

### Implementation

```bash
# .husky/pre-commit lines 43-84
tsx_feature_files=$(echo "$STAGED_FILES" | grep -E '^src/atomic-crm/.*\.tsx$' \
  | grep -v -E '\.test\.|\.spec\.|__tests__' || true)

if [ -n "$tsx_feature_files" ]; then
  ui_violations=0

  # Check 1: Native <select> elements (use SelectInput from ra-wrappers)
  # lines 52-58

  # Check 2: Hardcoded border colors (border-neutral-*, border-gray-*, border-[#...])
  # lines 60-66

  # Check 3: Hardcoded background colors (bg-neutral-*, bg-gray-*)
  # lines 68-74

  if [ $ui_violations -eq 1 ]; then
    echo -e "${RED}UI pattern violations detected. See UI_STANDARDS.md for guidance.${NC}"
    exit 1
  fi
  echo -e "${GREEN}UI patterns OK${NC}"
fi
```

**Detected anti-patterns:**

| Check | Pattern | Replacement |
|-------|---------|-------------|
| Native select | `<select` | `SelectInput` from `@/components/ra-wrappers` |
| Border colors | `border-(neutral\|gray)-`, `border-[#` | `border-muted`, `border-border`, `border-destructive` |
| Background colors | `bg-(neutral\|gray)-` | `bg-muted`, `bg-background`, `bg-card` |

**Key points:**
- Only scans `src/atomic-crm/**/*.tsx`, excluding test files
- Accumulates all violations before exiting (shows all problems, not just first)
- Shows up to 10 matching lines per check via `head -10`
- BLOCKING: `exit 1` if any violation found
- Cannot be skipped by `SKIP_SLOW_HOOKS`
- Enforces rules from `UI_STANDARDS.md` (UI-001, UI-006)

---

## Step 3: TypeScript Type-Check

### Problem

TypeScript errors in staged code break the build. Catching them at commit time is
faster feedback than waiting for CI.

### Solution

Run `tsc --noEmit --incremental` when any `.ts` or `.tsx` file is staged.
Skippable via `SKIP_SLOW_HOOKS` for rapid iteration.

### Implementation

```bash
# .husky/pre-commit lines 86-98
ts_files=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx)$' || true)

if [ -n "$ts_files" ] && [ "$SKIP_TYPECHECK" != "1" ]; then
  echo "Type-checking (incremental)..."
  if ! npx tsc --noEmit --incremental 2>/dev/null; then
    echo -e "${RED}TypeScript errors found. Run 'npx tsc --noEmit' for details.${NC}"
    exit 1
  fi
  echo -e "${GREEN}Types OK${NC}"
fi
```

**Key points:**
- Uses `--incremental` for speed (reuses previous type-check cache)
- `2>/dev/null` suppresses tsc output; developer re-runs manually for details
- BLOCKING: `exit 1` on type errors
- Skippable: `SKIP_SLOW_HOOKS=1` or `SKIP_TYPECHECK=1`

---

## Step 4: Discovery Staleness Check

### Problem

The discovery index (`.claude/state/`) can become stale when component or hook files
change. Stale indexes degrade code intelligence quality.

### Solution

Run a hash-based staleness check on staged `src/atomic-crm/` TypeScript files.
If stale, emit a WARNING but do NOT auto-regenerate or block the commit.
CI enforces full freshness.

### Implementation

```bash
# .husky/pre-commit lines 100-114
discovery_files=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx)$' \
  | grep -E 'src/atomic-crm/' || true)

if [ -n "$discovery_files" ] && [ "$SKIP_DISCOVERY" != "1" ]; then
  echo "Checking discovery freshness (hash-only)..."
  if ! npx tsx scripts/discover/check-staleness.ts 2>/dev/null; then
    echo -e "${YELLOW}Discovery index may be stale. Run 'just discover' after commit.${NC}"
    # Don't auto-regenerate - let CI enforce freshness
  else
    echo -e "${GREEN}Discovery files are fresh${NC}"
  fi
fi
```

**Key points:**
- WARNING ONLY: does NOT `exit 1` on staleness, does NOT auto-regenerate
- Does NOT run `just discover` or `git add` -- the old auto-regeneration pattern is removed
- Uses `scripts/discover/check-staleness.ts` for fast hash comparison
- Only triggers on `src/atomic-crm/**/*.ts{,x}` files (not all TS)
- Skippable: `SKIP_SLOW_HOOKS=1` or `SKIP_DISCOVERY=1`

---

## Step 5: Semantic Colors Validation

### Problem

After 243 color-fix commits, the project established a "no hardcoded colors" policy.
Without a gate, developers re-introduce hardcoded Tailwind color utilities.

### Solution

Run the project's `validate:semantic-colors` npm script against staged `.tsx` files.
This is a full validation script, not the inline grep checks in Step 2.

### Implementation

```bash
# .husky/pre-commit lines 116-130
tsx_files=$(echo "$STAGED_FILES" | grep -E '\.tsx$' || true)

if [ -n "$tsx_files" ]; then
  echo "Validating semantic colors..."
  if ! npm run validate:semantic-colors 2>/dev/null; then
    echo -e "${RED}Hardcoded colors detected. Run 'npm run validate:semantic-colors' for details.${NC}"
    echo -e "${YELLOW}Fix: Replace legacy Tailwind colors with semantic tokens${NC}"
    exit 1
  fi
  echo -e "${GREEN}Semantic colors OK${NC}"
fi
```

**Key points:**
- Broader scope than Step 2: checks ALL staged `.tsx` files, not just `src/atomic-crm/`
- Delegates to `npm run validate:semantic-colors` for comprehensive checking
- BLOCKING: `exit 1` on failure
- Cannot be skipped by `SKIP_SLOW_HOOKS`

---

## Step 6: Migration Validation

### Problem

SQL migrations that violate project conventions (missing soft-delete columns,
non-idempotent policies) cause runtime failures that are expensive to fix post-deploy.

### Solution

Run `scripts/validate-migrations.sh --staged` against staged SQL migration files.
Degrades gracefully if the validator script does not exist.

### Implementation

```bash
# .husky/pre-commit lines 132-150
migration_files=$(echo "$STAGED_FILES" | grep -E '^supabase/migrations/.*\.sql$' || true)

if [ -n "$migration_files" ]; then
  echo "Validating migration files..."
  if [ -x "./scripts/validate-migrations.sh" ]; then
    if ! ./scripts/validate-migrations.sh --staged 2>/dev/null; then
      echo -e "${RED}Migration validation failed.${NC}"
      echo -e "${YELLOW}Fix: Check for missing columns, idempotent policies, and soft-delete patterns${NC}"
      exit 1
    fi
    echo -e "${GREEN}Migrations OK${NC}"
  else
    echo -e "${YELLOW}Migration validator not found, skipping...${NC}"
  fi
fi
```

**Key points:**
- Only scans `supabase/migrations/*.sql` (not all SQL files)
- Uses `[ -x ... ]` to check the script is executable before running
- Graceful degradation: warns and skips if validator not found
- BLOCKING: `exit 1` on validation failure (when validator exists)
- Cannot be skipped by `SKIP_SLOW_HOOKS`
- The `$migration_files` variable is reused by Step 7

---

## Step 7: Migration Drift Detection

### Problem

Local and cloud migration histories can diverge when migrations are applied
directly to the Supabase cloud instance, causing deploy failures and data conflicts.

### Solution

When migration files are staged, run `supabase db push --dry-run` with a 10-second
timeout to compare local and cloud migration histories. Block on history mismatch;
warn on pending migrations.

### Implementation

```bash
# .husky/pre-commit lines 152-200
if [ -n "$migration_files" ] && [ "$SKIP_DRIFT" != "1" ]; then
  echo "Checking migration drift (local vs cloud)..."

  # Check if supabase is linked
  if [ -f "supabase/.temp/project-ref" ] || npx supabase projects list &>/dev/null; then

    # Dry-run with 10-second timeout
    if drift_output=$(timeout 10 npx supabase db push --dry-run 2>&1); then

      # BLOCKING: history mismatch means cloud has unknown migrations
      if echo "$drift_output" | grep -q "migration history does not match"; then
        echo -e "${RED}MIGRATION DRIFT DETECTED${NC}"
        echo "To investigate:"
        echo "  npx supabase db pull"
        echo "  npx supabase db push --dry-run"
        echo "To fix:"
        echo "  npx supabase migration repair --status reverted <version>"
        echo "  npx supabase migration repair --status applied <version>"
        exit 1
      fi

      # WARNING: pending migrations are informational only
      if echo "$drift_output" | grep -qE "Would apply|migrations? to apply"; then
        echo -e "${YELLOW}Pending migrations will be applied on next deploy${NC}"
      fi

      echo -e "${GREEN}Migration sync OK${NC}"
    else
      echo -e "${YELLOW}Migration drift check skipped (Supabase unavailable or timeout)${NC}"
    fi
  else
    echo -e "${YELLOW}Supabase not linked, skipping drift check${NC}"
  fi
fi
```

**Key points:**
- Reuses `$migration_files` from Step 6 (no redundant grep)
- 10-second `timeout` prevents network hangs from stalling commits
- Three graceful-degradation paths: not linked, network timeout, command failure
- BLOCKING: `exit 1` only on confirmed history mismatch
- WARNING: pending migrations (local ahead of cloud) do not block
- Skippable: `SKIP_SLOW_HOOKS=1` or `SKIP_DRIFT=1`

**Drift types:**

| Condition | Severity | Behavior |
|-----------|----------|----------|
| History mismatch (cloud has unknown migrations) | Critical | `exit 1` |
| Pending migrations (local ahead of cloud) | Info | Warning message |
| Supabase not linked | N/A | Skip silently |
| Network timeout / unavailable | N/A | Skip with warning |

---

## Post-Merge Hook (Advisory)

Separate from the pre-commit pipeline. Detects new migration files after
`git pull` or `git merge` and reminds the developer to run `npm run db:migrate`.

```bash
# .husky/post-merge lines 1-23
if git diff-tree -r --name-only --no-commit-id HEAD@{1} HEAD 2>/dev/null \
  | grep -q "supabase/migrations/"; then
  echo "New database migrations detected!"
  echo "Run: npm run db:migrate"
fi
exit 0  # ADVISORY - never blocks merge
```

---

## Anti-Patterns

### 1. Running Checks on All Files

```bash
# BAD: Runs on entire codebase regardless of what changed
npx tsc --noEmit
npx eslint .

# GOOD: Filter to staged files first
ts_files=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx)$' || true)
if [ -n "$ts_files" ]; then
  npx tsc --noEmit --incremental
fi
```

### 2. Auto-Regenerating in Pre-Commit

```bash
# BAD: Auto-regenerates and stages generated files (stale pattern, removed)
just discover
git add .claude/state/

# GOOD: Warn only; let CI enforce freshness
if ! npx tsx scripts/discover/check-staleness.ts 2>/dev/null; then
  echo "Discovery index may be stale. Run 'just discover' after commit."
fi
```

### 3. Blocking on Advisory Hooks

```bash
# BAD: post-merge should never block
exit 1

# GOOD: Always exit 0 in post-merge
exit 0
```

### 4. Silent Failures

```bash
# BAD: No remediation guidance
[ -n "$env_files" ] && exit 1

# GOOD: Clear error message with fix command
echo "COMMIT BLOCKED: .env files detected"
echo "To fix: git reset HEAD $env_files"
exit 1
```

### 5. Missing Graceful Degradation

```bash
# BAD: Fails hard if external tool missing
./scripts/validate-migrations.sh --staged

# GOOD: Check existence before calling
if [ -x "./scripts/validate-migrations.sh" ]; then
  ./scripts/validate-migrations.sh --staged
else
  echo "Migration validator not found, skipping..."
fi
```

---

## Step Summary Table

| Step | Name | Lines | Blocking | Skippable | Trigger |
|------|------|-------|----------|-----------|---------|
| -- | Fast mode setup | 14-23 | -- | -- | `SKIP_SLOW_HOOKS=1` |
| 1 | Security scan | 25-41 | Yes | No | Any staged `.env` file |
| 2 | UI Patterns | 43-84 | Yes | No | `src/atomic-crm/**/*.tsx` (non-test) |
| 3 | Type-check | 86-98 | Yes | Yes (`SKIP_TYPECHECK`) | Any `.ts`/`.tsx` staged |
| 4 | Discovery staleness | 100-114 | No (warning) | Yes (`SKIP_DISCOVERY`) | `src/atomic-crm/**/*.ts{,x}` |
| 5 | Semantic colors | 116-130 | Yes | No | Any `.tsx` staged |
| 6 | Migration validation | 132-150 | Yes | No | `supabase/migrations/*.sql` |
| 7 | Migration drift | 152-200 | Yes (on mismatch) | Yes (`SKIP_DRIFT`) | `supabase/migrations/*.sql` |

## Exit Code Semantics

| Code | Meaning | Source |
|------|---------|--------|
| 0 | All checks passed | Line 204 (end of script) |
| 1 | Security violation (Step 1) | Line 40 |
| 1 | UI pattern violation (Step 2) | Line 80 |
| 1 | TypeScript error (Step 3) | Line 95 |
| 1 | Semantic color violation (Step 5) | Line 127 |
| 1 | Migration validation failure (Step 6) | Line 143 |
| 1 | Migration drift detected (Step 7) | Line 185 |

Note: Step 4 (discovery staleness) never returns a non-zero exit code.

## File Reference

| File | Purpose | Lines |
|------|---------|-------|
| `.husky/pre-commit` | 7-step blocking quality gate | 205 lines |
| `.husky/post-merge` | Advisory migration notification | 23 lines |
| `.husky/_/h` | Husky dispatcher (adds PATH, runs hook with `sh -e`) | 22 lines |
| `scripts/discover/check-staleness.ts` | Hash-based discovery freshness check | Referenced by Step 4 |
| `scripts/validate-migrations.sh` | SQL migration convention validator | Referenced by Step 6 |
| `npm run validate:semantic-colors` | Semantic color enforcement script | Referenced by Step 5 |

## Migration Checklist

When modifying `.husky/pre-commit`:

1. [ ] Update step numbers and line references in this PATTERNS.md
2. [ ] Security checks (Step 1) remain the first gate after fast-mode setup
3. [ ] New blocking steps use `exit 1` with remediation instructions
4. [ ] New skippable steps check their `SKIP_*` variable AND are listed in fast-mode setup
5. [ ] Staged file filtering uses `--diff-filter=ACM` (Added, Copied, Modified)
6. [ ] `|| true` on all grep pipes to prevent set -e failures
7. [ ] ANSI colors: RED for errors, YELLOW for warnings, GREEN for success
8. [ ] Graceful degradation for external tools (check existence before calling)
9. [ ] Advisory hooks (post-merge) always `exit 0`
10. [ ] Hook is executable: `chmod +x .husky/pre-commit`
11. [ ] Test with: `git commit --dry-run` or stage a test file
