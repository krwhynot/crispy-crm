---
description: "Weekly code health summary - churn analysis, Kaizen score trends, and architectural hotspots"
---

# Code Health Summary

Generate a comprehensive weekly code health report for the Crispy CRM codebase.

## Reports to Generate

### 1. Top Churned Files (Kintsugi Candidates)
Run: `git log --since="14 days ago" --name-only --pretty=format: | sort | uniq -c | sort -rn | head -10`

For each file with >= 6 commits:
- Analyze WHY it's changing frequently
- Recommend: refactor, split, or accept (with justification)

### 2. Kaizen Score Trend
Read `.claude/kaizen_metrics.json` and report:
- Current score and streak
- Commit type distribution (feat/fix/refactor ratio)
- Trend assessment: Are we improving or firefighting?

### 3. Commit Type Distribution
Run: `git log --since="7 days ago" --oneline | head -50`
Categorize commits and calculate:
- Feature velocity (feat commits)
- Bug fix rate (fix commits)
- Improvement ratio (refactor commits)

### 4. Architectural Hotspots
Identify files that are:
- Frequently modified together (coupling)
- Growing in size without refactoring
- Missing test coverage (compare src/ changes vs test/ changes)

## Output Format

```
🎌 Ronin Health Summary - Week of [DATE]
═══════════════════════════════════════════════════

📊 KAIZEN METRICS
   Score: [X] | Streak: [Y] days
   Commits: [feat: N] [fix: N] [refactor: N] [other: N]
   Health: [🟢 Improving | 🟡 Stable | 🔴 Firefighting]

🔥 KINTSUGI CANDIDATES (High Churn)
   1. [file] - [N] commits - [recommendation]
   2. ...

🏛️ ARCHITECTURAL INSIGHTS
   [Observations about coupling, test coverage, growth patterns]

💭 RECOMMENDATION
   [One actionable suggestion for the week]
```

## Philosophy
This report embodies:
- **Kaizen**: Continuous small improvements compound
- **Kintsugi**: High-churn files need golden repair (refactoring)
- **Omoiyari**: Code with empathy for future maintainers
