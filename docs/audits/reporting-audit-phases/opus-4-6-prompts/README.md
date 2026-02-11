# Reporting Audit Prompt Pack (Opus 4.6 Style)

This prompt pack mirrors the existing database audit format:
- One prompt file per phase
- One paired report file per phase
- XML-style prompt sections inside a copy/paste block

## Approved Audit Profile

These defaults are based on owner-approved recommendations:

| Decision Area | Approved Default |
|---|---|
| Goal | Correctness + lineage + performance confidence |
| First Layer | End-to-end (UI -> provider -> DB) |
| Round 1 Scope | Dashboard + principal-focused reports |
| Source of Truth | Compare UI vs DB vs CSV |
| Validation Depth | Full lineage per metric |
| Main Risk | Task vs activity classification (plus filter mismatch) |
| Environment | Staging first, then production read-only verification |
| Output | Summary + technical evidence + ticket backlog |
| Tolerance | Metric-specific (see policy) |
| Automation | Manual first, then automate validated checks |
| UI/UX Coverage | Visual layout + filter layout/design + UX flow + accessibility/mobile + empty/loading/error states |

Policy file:
- `reporting-audit-policy.md`

Runbook:
- `reporting-audit-runbook.md`

Session log template:
- `session-log-template.md`

UI/UX rubric:
- `ui-ux-audit-rubric.md`

Project rules + skills alignment guide:
- `project-rules-skills-alignment.md`

Default skill stack by phase:
- `default-skill-stack-by-phase.md`

## How To Run

1. Open Claude Code with Opus 4.6.
2. Start the app locally and use localhost for UI checks (recommended `http://localhost:5173`).
3. Use Claude Chrome for visual checks on dashboard and principal-report surfaces.
4. Use Ref MCP to research reporting UX/data-viz best practices and capture references.
5. Read `project-rules-skills-alignment.md` and `default-skill-stack-by-phase.md`.
6. Read relevant `.claude/rules/*` and relevant `.claude/skills/*/SKILL.md` before planning changes.
7. Copy the prompt block from the phase prompt file.
8. Run in PLAN MODE (read-only audit).
9. Save output into the paired phase report file.
10. Answer the multiple-choice questions at the end of each phase.
11. Continue phase by phase.

## Rules For Every Phase

- Read-only audit first (no schema changes, no data writes, no app code edits).
- Require evidence for every claim and include confidence levels.
- Keep UI, provider, and DB analysis at equal priority.
- Cover all four UI/UX areas in every audit cycle (see `ui-ux-audit-rubric.md`).
- Explicitly audit filter layout/design on each reporting surface.
- Use localhost evidence from Claude Chrome and cite Ref MCP best-practice references.
- Require explicit owner permission before any `MAJOR_UX_CHANGE` proceeds to implementation.
- Require a rules/skills alignment check for every recommended action before signoff.
- Use project-local skills from `.claude/skills/skill-index.json` as the skills source of truth.
- Start each phase with the default stack in `default-skill-stack-by-phase.md`, then add conditional skills as needed.
- If the policy is unclear, stop and ask for clarification.
- Keep a strict separation between findings and recommended fixes.

## File Map

| Phase | Prompt | Paired Report |
|---|---|---|
| 1 | `phase-1-discovery_prompt.md` | `phase-1-report.md` |
| 2 | `phase-2-reconciliation_prompt.md` | `phase-2-report.md` |
| 3 | `phase-3-decisions_prompt.md` | `phase-3-report.md` |
| 4 | `phase-4-signoff_prompt.md` | `phase-4-report.md` |
| 5 (optional) | `phase-5-automation-progress_prompt.md` | `phase-5-automation-progress-report.md` |

All paths above are relative to:
- `docs/audits/reporting-audit-phases/opus-4-6-prompts/`
