---
description: Stage, commit with conventional message, optionally push
allowed-tools: Bash
argument-hint: [-p to push]
---

# Commit Command

Create a conventional commit with automatic message generation.

## Current State

**Status:**
!`git status --short`

**Branch:**
!`git branch --show-current`

**Recent commits (for style reference):**
!`git log --oneline -5`

## Process

1. Review unstaged and staged changes
2. Stage appropriate files (respect .gitignore)
3. Generate conventional commit message:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation only
   - `style:` Formatting, no code change
   - `refactor:` Code change that neither fixes nor adds
   - `perf:` Performance improvement
   - `test:` Adding tests
   - `chore:` Maintenance tasks
4. Include scope if changes are localized: `feat(opportunities):`
5. If `-p` flag provided, push to remote after commit

## Commit Message Format

```
<type>(<scope>): <description>

<body - optional>

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Rules

- NEVER use `--amend` unless explicitly requested
- NEVER use `--force` push
- NEVER skip hooks (`--no-verify`)
- Always include Co-Authored-By footer
