# Git Hooks (Husky) Patterns

Git hooks enforcing code quality gates at commit time. Implements fail-fast philosophy with security-first checks.

## Architecture Overview

```
.husky/
├── _/
│   ├── h              # Hook dispatcher (Husky v9 internal)
│   └── husky.sh       # DEPRECATED - v10 migration warning
├── pre-commit         # Security + Types + Discovery (BLOCKING)
└── post-merge         # Migration notifications (ADVISORY)

Hook Execution Flow:
┌─────────────────────────────────────────────────────────────┐
│ git commit                                                   │
│     │                                                        │
│     ▼                                                        │
│ .husky/_/h (dispatcher)                                      │
│     │                                                        │
│     ▼                                                        │
│ .husky/pre-commit                                            │
│     ├── 1. Security: Block .env files (exit 1)              │
│     ├── 2. Types: tsc --noEmit on TS files (exit 1)         │
│     └── 3. Discovery: Auto-regenerate if stale (git add)    │
│     │                                                        │
│     ▼                                                        │
│ Commit proceeds (or blocked)                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Pattern A: Pre-Commit Security Gates

Block dangerous files BEFORE any other checks. Security violations cause immediate exit.

**When to use**: Any file type that must NEVER be committed (secrets, credentials, local configs)

### .env File Blocking

```bash
# .husky/pre-commit
# ANSI color codes for visibility
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get staged files ONCE at start (performance)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Security check FIRST - block .env files
env_files=$(echo "$STAGED_FILES" | grep -E '\.env$|\.env\.' || true)

if [ -n "$env_files" ]; then
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}❌ COMMIT BLOCKED: .env file(s) detected${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo
  echo -e "${YELLOW}The following .env files are staged for commit:${NC}"
  echo "$env_files" | sed 's/^/  - /'
  echo
  echo "To fix: git reset HEAD $env_files"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  exit 1
fi
```

**Key points:**
- Security checks run FIRST before expensive operations
- `|| true` prevents grep from failing on no match
- Clear remediation instructions in error message
- `exit 1` blocks commit - no fallback

**Example:** `.husky/pre-commit` lines 14-30

---

## Pattern B: Staged File Filtering

Filter staged files by extension and directory for targeted checks. Prevents running expensive operations on unrelated files.

**When to use**: Any hook that runs expensive tooling (TypeScript, linters, generators)

### Extension-Based Filtering

```bash
# .husky/pre-commit
# Get staged files once, filter multiple times
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# TypeScript files only
ts_files=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx)$' || true)

if [ -n "$ts_files" ]; then
  echo "⚡ Type-checking staged files..."
  npx tsc --noEmit 2>/dev/null
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ TypeScript errors found. Run 'npx tsc --noEmit' for details.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Types OK${NC}"
fi
```

### Directory + Extension Filtering

```bash
# Only run discovery for atomic-crm source files
discovery_files=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx)$' | grep -E 'src/atomic-crm/' || true)

if [ -n "$discovery_files" ]; then
  # Run discovery regeneration
fi
```

**Key points:**
- `--diff-filter=ACM` = Added, Copied, Modified (excludes Deleted)
- Get staged files ONCE, filter multiple times (performance)
- Pipe chains: extension filter | directory filter
- Empty check with `[ -n "$var" ]` before running commands

**Example:** `.husky/pre-commit` lines 35-45

---

## Pattern C: Auto-Regeneration with Stage-Fixed

Automatically regenerate files when source changes, then stage the generated output. Prevents stale generated files from diverging.

**When to use**: Any generated files that must stay in sync with source (types, indexes, discovery)

### Discovery Auto-Regeneration

```bash
# .husky/pre-commit
discovery_files=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx)$' | grep -E 'src/atomic-crm/' || true)

if [ -n "$discovery_files" ]; then
  echo "🔍 Checking discovery freshness..."
  if ! npx tsx scripts/discover/index.ts --check 2>/dev/null; then
    echo -e "${YELLOW}🔄 Auto-regenerating discovery files...${NC}"
    just discover           # Regenerate
    git add .claude/state/  # Stage generated files
    echo -e "${GREEN}✓ Discovery auto-updated and staged${NC}"
  else
    echo -e "${GREEN}✓ Discovery files are fresh${NC}"
  fi
fi
```

**Key points:**
- Freshness check prevents unnecessary regeneration
- `git add` stages generated files automatically (stage-fixed pattern)
- Uses `just discover` - project task runner, not raw npm
- Silent check (`2>/dev/null`) keeps output clean

**Example:** `.husky/pre-commit` lines 47-63

---

## Pattern D: Post-Merge Developer Notifications

Detect changes in specific directories after merge/pull and notify developer of required actions. Advisory (non-blocking) pattern.

**When to use**: Changes that require manual intervention after sync (migrations, dependency updates)

### Migration Detection

```bash
# .husky/post-merge
# Detect new migrations after git pull/merge
if git diff-tree -r --name-only --no-commit-id HEAD@{1} HEAD 2>/dev/null | grep -q "supabase/migrations/"; then
  YELLOW='\033[1;33m'
  RED='\033[0;31m'
  NC='\033[0m' # No Color

  echo ""
  echo "${YELLOW}========================================================${NC}"
  echo "${RED}⚠️  New database migrations detected!${NC}"
  echo "${YELLOW}========================================================${NC}"
  echo "Your local database schema might be out of date."
  echo ""
  echo "Run: ${YELLOW}npm run db:migrate${NC}"
  echo ""
  echo "${RED}NOTE: This will reset your local Docker database.${NC}"
  echo "${YELLOW}========================================================${NC}"
  echo ""
fi

exit 0  # ADVISORY - never block merge
```

**Key points:**
- `git diff-tree HEAD@{1} HEAD` compares before/after merge
- `grep -q` for silent matching (exit code only)
- `2>/dev/null` handles edge cases (fresh clone, no reflog)
- `exit 0` makes this advisory - merge always succeeds
- Clear action instructions with specific command

**Example:** `.husky/post-merge` lines 1-23

---

## Pattern Comparison Table

| Aspect | Security Gates | Staged Filtering | Auto-Regeneration | Post-Merge Notify |
|--------|----------------|------------------|-------------------|-------------------|
| **Purpose** | Block dangerous files | Target expensive checks | Keep generated files in sync | Inform of required actions |
| **Blocking** | Yes (exit 1) | Yes (exit 1) | No (auto-fix) | No (exit 0) |
| **When runs** | Always first | When file types match | When source files staged | After merge/pull |
| **Git command** | diff --cached | diff --cached + grep | git add | diff-tree |

---

## Anti-Patterns to Avoid

### 1. Running Checks on All Files

```bash
# BAD: Runs on entire codebase - slow, irrelevant noise
npx tsc --noEmit
npx eslint .

# GOOD: Only check staged files
ts_files=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx)$' || true)
if [ -n "$ts_files" ]; then
  npx tsc --noEmit
fi
```

### 2. Blocking on Advisory Hooks

```bash
# BAD: post-merge should never block
if [ -n "$migrations" ]; then
  echo "Run migrations first!"
  exit 1  # Blocks checkout/merge unexpectedly
fi

# GOOD: Advisory notification only
if [ -n "$migrations" ]; then
  echo "New migrations detected - run: npm run db:migrate"
fi
exit 0  # Always allow merge to complete
```

### 3. Silent Failures

```bash
# BAD: Error hidden, no remediation
env_files=$(echo "$STAGED_FILES" | grep -E '\.env' || true)
[ -n "$env_files" ] && exit 1

# GOOD: Clear error with fix instructions
if [ -n "$env_files" ]; then
  echo "COMMIT BLOCKED: .env files detected"
  echo "To fix: git reset HEAD $env_files"
  exit 1
fi
```

### 4. Forgetting to Stage Generated Files

```bash
# BAD: Generates but doesn't stage - diverges on next commit
just discover

# GOOD: Generate AND stage (stage-fixed pattern)
just discover
git add .claude/state/
```

---

## Git Hook Checklist

When adding/modifying git hooks:

1. [ ] Security checks run FIRST before expensive operations
2. [ ] Blocking hooks (pre-commit) use `exit 1` on failure
3. [ ] Advisory hooks (post-merge) always `exit 0`
4. [ ] Staged file filtering uses `--diff-filter=ACM`
5. [ ] Error messages include remediation command
6. [ ] ANSI colors used for visibility (RED=error, YELLOW=warning, GREEN=success)
7. [ ] Generated files auto-staged with `git add`
8. [ ] Hook is executable: `chmod +x .husky/<hook-name>`
9. [ ] Verify: `git commit --dry-run` or stage a test file

---

## Pattern E: Semantic Colors Validation

Prevents theme drift by blocking commits with hardcoded Tailwind colors. This gate was added after 243 color-fix commits revealed widespread theme inconsistency.

**When to use**: Enforcing design system compliance on all TSX files

### Color Validation Gate

```bash
# .husky/pre-commit
# Only check staged TSX files for performance
tsx_files=$(echo "$STAGED_FILES" | grep -E '\.tsx$' || true)

if [ -n "$tsx_files" ]; then
  echo "🎨 Validating semantic colors..."
  if ! npm run validate:semantic-colors 2>/dev/null; then
    echo -e "${RED}❌ Hardcoded colors detected. Run 'npm run validate:semantic-colors' for details.${NC}"
    echo -e "${YELLOW}Fix: Replace legacy Tailwind colors with semantic tokens (bg-warning, text-destructive, etc.)${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Semantic colors OK${NC}"
fi
```

**Key points:**
- Only runs on `.tsx` files (performance optimization)
- Uses project's `validate:semantic-colors` npm script
- Blocks hardcoded colors like `text-gray-500`, `bg-red-600`
- Enforces semantic tokens: `text-muted-foreground`, `bg-destructive`
- Clear remediation message guides developers to fix

**Example:** `.husky/pre-commit` (lines 66-79)

---

## Pattern F: SQL Migration Validation

Validates migration files against project standards before commit. Checks for idempotent policies, soft-delete patterns, and required columns.

**When to use**: Enforcing database migration quality gates

### Migration Validation Gate

```bash
# .husky/pre-commit
# Only check staged SQL files in migrations directory
migration_files=$(echo "$STAGED_FILES" | grep -E '^supabase/migrations/.*\.sql$' || true)

if [ -n "$migration_files" ]; then
  echo "🗄️ Validating migration files..."
  if [ -x "./scripts/validate-migrations.sh" ]; then
    if ! ./scripts/validate-migrations.sh --staged 2>/dev/null; then
      echo -e "${RED}❌ Migration validation failed. Run './scripts/validate-migrations.sh' for details.${NC}"
      echo -e "${YELLOW}Fix: Check for missing columns, idempotent policies, and soft-delete patterns${NC}"
      exit 1
    fi
    echo -e "${GREEN}✓ Migrations OK${NC}"
  else
    echo -e "${YELLOW}⚠ Migration validator not found, skipping...${NC}"
  fi
fi
```

**Key points:**
- Targets only `supabase/migrations/*.sql` files
- Uses project's `validate-migrations.sh` script with `--staged` flag
- Graceful degradation: skips if validator script not found
- Validates: required columns, RLS policies, soft-delete patterns

**Example:** `.husky/pre-commit` (lines 81-99)

---

## File Reference

| Pattern | Primary Files |
|---------|---------------|
| **A: Security Gates** | `.husky/pre-commit` (lines 14-30) |
| **B: Staged Filtering** | `.husky/pre-commit` (lines 12, 35, 51) |
| **C: Auto-Regeneration** | `.husky/pre-commit` (lines 47-63) |
| **D: Post-Merge Notify** | `.husky/post-merge` |
| **E: Semantic Colors** | `.husky/pre-commit` (lines 66-79) |
| **F: Migration Validation** | `.husky/pre-commit` (lines 81-99) |
| **Hook Dispatcher** | `.husky/_/h` |
