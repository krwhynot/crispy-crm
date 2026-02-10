# Phase 6 Prompt: Cleanup Plan (Phased, Safe, Reversible)

Copy/paste into Claude Code:

```text
You are running Phase 6 of a full database audit.

Inputs:
- Repo root: c:\Users\NewAdmin\Projects\crispy-crm
- Prior reports:
  - docs/audits/full-db-audit-phases/phase-1-report.md
  - docs/audits/full-db-audit-phases/phase-2-report.md
  - docs/audits/full-db-audit-phases/phase-3-report.md
  - docs/audits/full-db-audit-phases/phase-4-report.md
  - docs/audits/full-db-audit-phases/phase-5-report.md

Constraints:
- PLAN MODE only (no implementation yet)
- Supabase MCP for confirmation
- Use supabase-postgres-best-practices skill

Goal:
Produce a phased cleanup implementation plan to remove old structure and reinforce the new one.

Plan requirements:
- Phase A: safety and observability prep
- Phase B: low-risk rewires/fixes
- Phase C: medium-risk deprecations
- Phase D: high-risk removals
- each step needs rollback strategy
- each step needs validation checklist

Must include:
- dependencies to clear before dropping legacy objects
- local/cloud rollout order
- stop/go criteria per phase

Output file:
- docs/audits/full-db-audit-phases/phase-6-report.md

Output structure:
1) Phased plan table
2) Rollback plan per phase
3) Validation checklist per phase
4) Sequencing and ownership suggestions
5) Multiple-choice questions for timing/risk tradeoffs

Question rules:
- Ask 2-3 multiple-choice questions
- Recommended option first and marked "(Recommended)"
```
