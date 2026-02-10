# Phase 5 Prompt: Legacy Candidate Decisions

Copy/paste into Claude Code:

```text
You are running Phase 5 of a full database audit.

Inputs:
- Repo root: c:\Users\NewAdmin\Projects\crispy-crm
- Prior reports:
  - docs/audits/full-db-audit-phases/phase-1-report.md
  - docs/audits/full-db-audit-phases/phase-2-report.md
  - docs/audits/full-db-audit-phases/phase-3-report.md
  - docs/audits/full-db-audit-phases/phase-4-report.md

Constraints:
- PLAN MODE, read-only
- Supabase MCP required
- Use supabase-postgres-best-practices skill

Goal:
Create a decision table for legacy objects and unclear structures.

For each candidate object, classify one of:
- keep
- fix
- deprecate
- remove

Include:
- business impact
- technical risk
- rollback complexity
- confidence
- removal blockers

Also include explicit data-structure confirmation:
- what is canonical now
- what remains compatibility only

Output file:
- docs/audits/full-db-audit-phases/phase-5-report.md

Output structure:
1) Legacy candidate decision table
2) Canonical vs compatibility structure map
3) High-risk blockers
4) Multiple-choice questions for unresolved decisions

Question rules:
- Ask 2-3 multiple-choice questions
- Recommended option first and labeled "(Recommended)"
```
