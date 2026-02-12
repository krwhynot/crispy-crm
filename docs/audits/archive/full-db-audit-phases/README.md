# Full DB Audit Prompt Pack (Claude)

This folder contains copy/paste prompts and report templates for a 7-phase database audit.

## How to run

1. Open Claude Code.
2. Copy the prompt file for the next phase and paste it.
3. Let Claude complete the phase and write/update the matching report file.
4. Review Claude's multiple-choice questions and answer them before the next phase.
5. Continue in order from Phase 1 to Phase 7.

## Phase order

1. `phase-1-baseline-inventory.prompt.md` -> `phase-1-report.md`
2. `phase-2-drift-analysis.prompt.md` -> `phase-2-report.md`
3. `phase-3-dependency-mapping.prompt.md` -> `phase-3-report.md`
4. `phase-4-operations-health.prompt.md` -> `phase-4-report.md`
5. `phase-5-legacy-candidates.prompt.md` -> `phase-5-report.md`
6. `phase-6-cleanup-plan.prompt.md` -> `phase-6-report.md`
7. `phase-7-final-signoff.prompt.md` -> `phase-7-report.md`

## Rules for every phase

- Read-only audit (no schema/data changes).
- Use Supabase MCP tools for local and cloud verification.
- Use `supabase-postgres-best-practices` as the audit lens.
- Ask multiple-choice questions when business intent is unclear.
- Always confirm current data structure assumptions before recommendations.
