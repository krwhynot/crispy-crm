# Full DB Audit Prompt Pack v2 (Opus 4.6 Optimized)

Restructured from 7 phases to 4 phases for deeper analysis per phase.

## Architecture Changes from v1

| v1 Phases | v2 Phase | Rationale |
|-----------|----------|-----------|
| Phase 1: Baseline Inventory | Phase 1: Discovery & Inventory | Same scope, better reasoning scaffolds |
| Phase 2: Drift Analysis | Phase 2: Deep Analysis | Merged - drift, dependencies, and ops health |
| Phase 3: Dependency Mapping | (merged into Phase 2) | are tightly coupled and benefit from |
| Phase 4: Operations Health | (merged into Phase 2) | single-pass cross-referencing |
| Phase 5: Legacy Candidates | Phase 3: Decisions & Risk | Merged - decisions need the cleanup plan |
| Phase 6: Cleanup Plan | (merged into Phase 3) | context to be meaningful |
| Phase 7: Final Signoff | Phase 4: Final Signoff | Same scope, stronger verification |

## How to Run

1. Open Claude Code with Opus 4.6 model selected
2. Copy the prompt from the next phase file and paste it
3. Let Claude complete the phase and write the report
4. Answer Claude's multiple-choice questions
5. Proceed to next phase

## Rules for Every Phase

- Read-only audit (PLAN MODE, no schema/data changes)
- Use Docker for local database verification (Supabase local containers / local Postgres in Docker)
- Use Supabase MCP for cloud database verification
- Use `supabase-postgres-best-practices` as the audit lens
- Every claim requires evidence and confidence level
- Multiple-choice questions for ambiguous decisions
- Hybrid context: read prior reports + verify critical assertions
- Beta-data safety first: no destructive recommendation without backup, rollback, and reconciliation evidence

## File Map

| Phase | Prompt | Report |
|-------|--------|--------|
| 1 | `phase-1-discovery_prompt.md` | `phase-1-report.md` |
| 2 | `phase-2-deep-analysis_prompt.md` | `phase-2-report.md` |
| 3 | `phase-3-decisions_prompt.md` | `phase-3-report.md` |
| 4 | `phase-4-signoff_prompt.md` | `phase-4-report.md` |

All prompt/report paths above are relative to this subfolder:
`docs/audits/full-db-audit-phases/opus-4-6-prompts/`
