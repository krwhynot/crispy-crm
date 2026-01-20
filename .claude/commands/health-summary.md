---
description: "Weekly code health summary - churn analysis, coupling detection, and data-driven recommendations"
---

# Code Health Summary

Generate a comprehensive code health report for the Crispy CRM codebase.

## Data Collection

### 1. Commit Activity (14 days)
Run: `git log --since="14 days ago" --oneline | head -100`

Categorize by conventional commit type:
- Features (feat)
- Fixes (fix)
- Refactors (refactor)
- Other (docs, test, chore, etc.)

Calculate Fix Ratio: `fixes / (fixes + features)` - above 50% suggests reactive work.

### 2. High Churn Files
Run: `git log --since="14 days ago" --name-only --pretty=format: | sort | uniq -c | sort -rn | head -10`

For each file with >= 6 edits:
- Note 7-day vs 14-day trend (accelerating or stable)
- Identify if it's test file, config, or production code

### 3. Coupling Detection
Run: `git log --since="14 days ago" --name-only --pretty=format:%H`

Parse to find files that frequently change together (3+ co-changes).
High coupling may indicate:
- Shared responsibility that could be extracted
- Missing abstraction layer
- Tightly bound features

### 4. Recommendations
Based on data, generate actionable recommendations:
- HIGH_CHURN: Files with 10+ edits need attention
- COUPLING: Files with 50%+ co-change rate may need refactoring
- FIREFIGHTING: Fix ratio > 60% suggests reactive mode

## Output Format

```
📊 Code Health Summary - [DATE]
═══════════════════════════════════════════════════

COMMIT ACTIVITY (14 days)
   Features: [N] | Fixes: [N] | Refactors: [N] | Other: [N]
   Fix Ratio: [X]% [assessment if > 50%]

HIGH CHURN FILES
   1. [file] - [N] edits ([7d count] in last 7 days [⚡ if accelerating])
   2. ...

COUPLING DETECTED
   • [file_a] ↔ [file_b] ([N] co-changes)
   • ...

RECOMMENDATIONS
   #1 [[TYPE]] [target]
      [reason]
      → [suggested action]

   #2 ...

PROGRESS
   Pending: [N] | Resolved this week: [N]
═══════════════════════════════════════════════════
```

## Analysis Guidelines

- Focus on **data**, not philosophy
- Provide **specific** file paths and numbers
- Give **actionable** recommendations with concrete next steps
- Track **progress** on previous recommendations when possible
