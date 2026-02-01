---
description: Stage, verify, and commit changes with a conventional commit message
---

# Smart Commit

Analyze changes, run quality checks, and create a conventional commit.

## Phase 1: Understand Changes

Run these commands in parallel to gather context:

```bash
git status
```

```bash
git diff --cached --stat
```

```bash
git diff --stat
```

```bash
git log --oneline -5
```

**From the output, determine:**
- Which files are staged vs unstaged vs untracked
- The nature of the changes (new feature, bug fix, refactor, etc.)
- Recent commit message style for consistency

---

## Phase 2: Stage Files

**If there are unstaged or untracked changes:**
- Ask the user which files to stage (show a numbered list)
- If all changes are related, suggest staging everything
- Stage the approved files with `git add`

**If all changes are already staged:**
- Skip to Phase 3

---

## Phase 3: Generate Commit Message

Analyze the staged diff to produce a conventional commit message:

```bash
git diff --cached
```

**Format:** `type(scope): concise description`

**Types:**
- `feat` - New feature or capability
- `fix` - Bug fix
- `chore` - Maintenance, dependencies, config
- `refactor` - Code restructuring (no behavior change)
- `test` - Adding or updating tests
- `docs` - Documentation only

**Scope:** Infer from the primary directory or module changed (e.g., `contacts`, `organizations`, `validation`, `providers`).

**Rules:**
- First line under 72 characters
- Use imperative mood ("add", "fix", "update", not "added", "fixes")
- Add body paragraph if changes are complex (separated by blank line)
- Always end with `Co-Authored-By: Claude <noreply@anthropic.com>`

---

## Phase 4: Quality Verification

Run type checking and linting before committing. Execute in parallel:

```bash
npx tsc --noEmit
```

```bash
npm run lint
```

**Decision matrix:**

| TypeCheck | Lint | Action |
|-----------|------|--------|
| Pass | Pass | Proceed to commit |
| Pass | Warnings only | Proceed to commit (note warnings) |
| Fail | Any | STOP - show errors, do not commit |
| Any | Errors | STOP - show errors, suggest running `/fix-lint` |

If verification fails, report the errors and stop. Do not commit broken code.

---

## Phase 5: Commit

Create the commit using the generated message:

```bash
git commit -m "$(cat <<'EOF'
type(scope): description

Optional body with additional context.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

Then show the result:

```bash
git log --oneline -1
```

---

## Output

After committing, report:

```
Committed: type(scope): description
Files: N files changed, +X/-Y lines
Hash: abc1234
```

If there are remaining unstaged changes, mention them.
