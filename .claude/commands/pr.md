---
description: Create PR with summary and test plan
allowed-tools: Bash
argument-hint: [base-branch, default: main]
---

# Pull Request Command

Create a well-formatted pull request using GitHub CLI.

## Current State

**Branch:**
!`git branch --show-current`

**Commits since main:**
!`git log main..HEAD --oneline`

**Files changed:**
!`git diff main --stat | tail -20`

## Process

1. Ensure all commits are pushed to remote
2. Generate PR title from branch name or commit summary
3. Create PR body with:
   - `## Summary` - 1-3 bullet points
   - `## Test plan` - Verification steps
4. Add footer: `Generated with Claude Code`
5. Create PR via `gh pr create`
6. Return PR URL

## PR Body Format

```markdown
## Summary
- [Key change 1]
- [Key change 2]

## Test plan
- [ ] Verify [specific behavior]
- [ ] Check [edge case]



## Rules

- NEVER force push
- Always push before creating PR
- Use `--base main` unless specified otherwise
- Include meaningful test plan items
