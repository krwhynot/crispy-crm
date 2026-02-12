# Phase 3 Prompt: Dependency Mapping

Copy/paste into Claude Code:

```text
You are running Phase 3 of a full database audit.

Inputs:
- Repo root: c:\Users\NewAdmin\Projects\crispy-crm
- Prior reports:
  - docs/audits/full-db-audit-phases/phase-1-report.md
  - docs/audits/full-db-audit-phases/phase-2-report.md

Constraints:
- PLAN MODE, read-only
- Use Supabase MCP for local/cloud metadata
- Use supabase-postgres-best-practices skill

Goal:
Map dependencies from legacy/suspicious objects to active objects and workflows.

Must include dependency mapping for at least:
- tasks_deprecated
- digest functions and digest cron flow
- legacy task-related views/functions
- entity_timeline related objects
- exec_sql

For each candidate object:
- who depends on it (views/functions/jobs/code)
- what breaks if removed
- replacement target in the new structure

Output file:
- docs/audits/full-db-audit-phases/phase-3-report.md

Output structure:
1) Dependency graph table
2) Breakage risk table
3) Recommended replacement targets
4) Data structure confirmation updates
5) Multiple-choice questions

Question rules:
- Ask 2-3 multiple-choice questions
- Recommended option first, mark "(Recommended)"
```
