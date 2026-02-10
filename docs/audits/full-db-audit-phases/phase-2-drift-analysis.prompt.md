# Phase 2 Prompt: Drift Analysis (Local vs Cloud)

Copy/paste into Claude Code:

```text
You are running Phase 2 of a full database audit.

Inputs:
- Repo root: c:\Users\NewAdmin\Projects\crispy-crm
- Prior report: docs/audits/full-db-audit-phases/phase-1-report.md

Mode and constraints:
- PLAN MODE, read-only
- Use Supabase MCP for both local and cloud
- Use supabase-postgres-best-practices skill
- No migrations, no data writes

Goal:
Create a drift report that shows differences between local and cloud schemas and operational objects.

Compare:
- tables, views, functions, triggers
- function signatures
- indexes and constraints
- RLS policy counts and names
- cron jobs and schedules

Also include:
- which drifts are expected vs dangerous
- whether current data structure assumptions still hold in both environments

Output file:
- docs/audits/full-db-audit-phases/phase-2-report.md

Output structure:
1) Drift matrix (object, local, cloud, severity)
2) Confirmed structural mismatches
3) Priority drift fixes (not implementation, only plan)
4) Multiple-choice questions for ambiguous drifts

Question rules:
- Ask 2-3 multiple-choice questions
- Recommended option first, with "(Recommended)"
- Short impact line per option
```
