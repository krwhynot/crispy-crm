# Phase 7 Prompt: Final Signoff and Decision Pack

Copy/paste into Claude Code:

```text
You are running Phase 7 (final signoff) of a full database audit.

Inputs:
- Repo root: c:\Users\NewAdmin\Projects\crispy-crm
- Prior reports:
  - docs/audits/full-db-audit-phases/phase-1-report.md
  - docs/audits/full-db-audit-phases/phase-2-report.md
  - docs/audits/full-db-audit-phases/phase-3-report.md
  - docs/audits/full-db-audit-phases/phase-4-report.md
  - docs/audits/full-db-audit-phases/phase-5-report.md
  - docs/audits/full-db-audit-phases/phase-6-report.md

Constraints:
- PLAN MODE
- No schema/data changes
- Supabase MCP verification for any unresolved items
- Use supabase-postgres-best-practices skill

Goal:
Deliver final audit signoff package with clear go/no-go and next actions.

Required outputs:
1) Confirmed findings (high confidence)
2) Remaining uncertainties and how to resolve them
3) Final canonical data structure statement
4) Prioritized implementation queue
5) Go/No-Go recommendation with confidence

Output file:
- docs/audits/full-db-audit-phases/phase-7-report.md

Output structure:
1) Executive summary
2) Confirmed facts table
3) Open risks table
4) Final data structure confirmation
5) Go/No-Go decision
6) Multiple-choice decision questions

Question rules:
- Ask 2-3 final multiple-choice questions
- Recommended option first and marked "(Recommended)"
```
