---
name: generate-patterns-husky
directory: .husky/
complexity: HIGH
output: .husky/PATTERNS.md
---

# Generate PATTERNS.md for Git Hooks (Husky)

## Context

The `.husky/` directory contains Git hooks managed by Husky v9. These hooks enforce code quality gates at commit time (pre-commit) and help developers stay synchronized after merges (post-merge). The hooks implement the project's fail-fast philosophy by blocking commits that violate security or type-safety rules.

**Key Integration Points:**
- TypeScript type-checking on staged files
- Security blocking of .env file commits
- Discovery file auto-regeneration
- Database migration notifications post-merge

## Phase 1: Exploration

Read these files in order to understand the hook architecture:

1. `/home/krwhynot/projects/crispy-crm/.husky/pre-commit` - Purpose: Multi-stage pre-commit validation (security, types, discovery)
2. `/home/krwhynot/projects/crispy-crm/.husky/post-merge` - Purpose: Migration detection and developer notifications
3. `/home/krwhynot/projects/crispy-crm/.husky/_/h` - Purpose: Husky v9 hook dispatcher (PATH setup, error handling)
4. `/home/krwhynot/projects/crispy-crm/package.json` - Purpose: Find the "prepare" script that installs Husky

## Phase 2: Pattern Identification

Identify and document these 4 patterns:

### Pattern A: Pre-Commit Security Gates
- .env file blocking with clear error messages
- Fail-fast approach - block immediately, explain clearly
- ANSI color-coded output for visibility

### Pattern B: Staged File Filtering
- Using `git diff --cached --name-only --diff-filter=ACM`
- Filtering by file extension (`.ts|.tsx`)
- Filtering by directory (`src/atomic-crm/`)
- Performance optimization: only check relevant files

### Pattern C: Auto-Regeneration with Stage-Fixed
- Discovery freshness check pattern
- Auto-run `just discover` when stale
- Auto-stage generated files (`git add .claude/state/`)
- Conditional execution based on staged file types

### Pattern D: Post-Merge Developer Notifications
- Detecting changes in specific directories (`supabase/migrations/`)
- Using `git diff-tree` for merge comparison
- Advisory (non-blocking) vs blocking hooks
- Clear action instructions for developers

## Phase 3: Generate PATTERNS.md

Use this structure for the output:

```markdown
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
NC='\033[0m'

# Get staged files ONCE at start (performance)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Security check FIRST - block .env files
env_files=$(echo "$STAGED_FILES" | grep -E '\.env$|\.env\.' || true)

if [ -n "$env_files" ]; then
  echo -e "${RED}COMMIT BLOCKED: .env file(s) detected${NC}"
  echo "$env_files" | sed 's/^/  - /'
  echo "To fix: git reset HEAD $env_files"
  exit 1
fi
```

**Key points:**
- Security checks run FIRST before expensive operations
- `|| true` prevents grep from failing on no match
- Clear remediation instructions in error message
- `exit 1` blocks commit - no fallback

**Example:** `.husky/pre-commit` lines 16-30

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
  echo "Type-checking staged files..."
  npx tsc --noEmit 2>/dev/null
  if [ $? -ne 0 ]; then
    echo -e "${RED}TypeScript errors found${NC}"
    exit 1
  fi
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
  echo "Checking discovery freshness..."

  # Check if regeneration needed (exit code indicates staleness)
  if ! npx tsx scripts/discover/index.ts --check 2>/dev/null; then
    echo "Auto-regenerating discovery files..."
    just discover           # Regenerate
    git add .claude/state/  # Stage generated files
    echo "Discovery auto-updated and staged"
  fi
fi
```

**Key points:**
- Freshness check prevents unnecessary regeneration
- `git add` stages generated files automatically (stage-fixed pattern)
- Uses `just discover` - project task runner, not raw npm
- Silent check (`2>/dev/null`) keeps output clean

**Example:** `.husky/pre-commit` lines 48-63

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
  NC='\033[0m'

  echo "${YELLOW}======================================================${NC}"
  echo "${RED}New database migrations detected!${NC}"
  echo "Your local database schema might be out of date."
  echo ""
  echo "Run: ${YELLOW}npm run db:migrate${NC}"
  echo "${YELLOW}======================================================${NC}"
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

## File Reference

| Pattern | Primary Files |
|---------|---------------|
| **A: Security Gates** | `.husky/pre-commit` (lines 16-30) |
| **B: Staged Filtering** | `.husky/pre-commit` (lines 12, 35, 51) |
| **C: Auto-Regeneration** | `.husky/pre-commit` (lines 48-63) |
| **D: Post-Merge Notify** | `.husky/post-merge` |
| **Hook Dispatcher** | `.husky/_/h` |
```

## Phase 4: Write the File

Write the generated PATTERNS.md to: `/home/krwhynot/projects/crispy-crm/.husky/PATTERNS.md`

Verify the output:
1. All referenced line numbers match actual file content
2. All code examples are from actual hook files (not pseudo-code)
3. ASCII diagram accurately shows the hook execution flow
4. Anti-patterns reflect real issues that could occur in git hooks
