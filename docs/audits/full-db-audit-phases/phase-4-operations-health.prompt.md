# Phase 4 Prompt: Operations Health (Jobs + Runtime Paths)

Copy/paste into Claude Code:

```text
You are running Phase 4 of a full database audit.

Inputs:
- Repo root: c:\Users\NewAdmin\Projects\crispy-crm
- Prior reports:
  - docs/audits/full-db-audit-phases/phase-1-report.md
  - docs/audits/full-db-audit-phases/phase-2-report.md
  - docs/audits/full-db-audit-phases/phase-3-report.md

Constraints:
- PLAN MODE, read-only
- Supabase MCP for local/cloud
- Use supabase-postgres-best-practices skill

Goal:
Audit operational reliability of database-related automation and runtime DB paths.

Must evaluate:
- scheduled jobs (digest, cleanup, snapshots, overdue checks)
- job status, failures, and likely root causes
- whether critical functions/jobs still point to legacy objects
- whether current paths align with the new data structure

Output file:
- docs/audits/full-db-audit-phases/phase-4-report.md

Output structure:
1) Job inventory and health status
2) Failing path analysis
3) Priority operational risks
4) Immediate non-destructive mitigations
5) Multiple-choice questions for tradeoffs (disable vs patch vs defer)

Question rules:
- Ask 2-3 multiple-choice questions
- Recommended option first with "(Recommended)"
```
