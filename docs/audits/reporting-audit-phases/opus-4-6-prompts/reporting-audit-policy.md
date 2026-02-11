# Reporting Audit Policy (Source Of Truth)

## Status

- Owner: Crispy-CRM product owner
- Last owner review: 2026-02-10
- Freshness rule: this policy should be reviewed in the current month
- Ambiguity rule: if logic is unclear, stop and request owner clarification
- Safety rule: staging-first validation before production read-only verification

## Approved Audit Defaults

| ID | Decision | Approved |
|---|---|---|
| 1 | Audit goal includes correctness, lineage, and performance confidence | TRUE |
| 2 | Start with end-to-end lineage (UI -> provider -> DB) | TRUE |
| 3 | Round 1 scope is dashboard + principal-focused reporting | TRUE |
| 4 | Source of truth is UI vs DB vs CSV comparison | TRUE |
| 5 | Validation depth is full metric lineage | TRUE |
| 6 | Primary risk is task vs activity classification | TRUE |
| 7 | Secondary risk is filter mismatch | TRUE |
| 8 | Environment order: staging first, production read-only verification second | TRUE |
| 9 | Output must include summary + evidence + remediation tickets | TRUE |
| 10 | Execution mode: manual audit first, automation second | TRUE |
| 11 | UI/UX audit must cover 4 areas (layout, flow, accessibility/mobile, state handling) | TRUE |
| 12 | Localhost visual evidence via Claude Chrome is required for UI/UX findings | TRUE |
| 13 | Ref MCP best-practice benchmarking is required (or explicit fallback) | TRUE |
| 14 | Any MAJOR_UX_CHANGE needs explicit owner permission before implementation | TRUE |
| 15 | Every recommended action must map to project rule files before signoff | TRUE |
| 16 | DB-related recommendations must use local Supabase skill at `.claude/skills/supabase-postgres-best-practices/SKILL.md` | TRUE |
| 17 | Recommendations must apply relevant project-local skills from `.claude/skills/skill-index.json` | TRUE |

## Counting And Tolerance Rules

| Metric Class | Rule |
|---|---|
| Core integer KPI counts | Exact match required (0 difference) |
| Report totals and group subtotals | Exact match required (0 difference) |
| CSV row counts and exported totals | Exact match required (0 difference) |
| Derived percentages and trend deltas | Up to 1 percentage point difference allowed if caused by rounding |
| Currency sums in charts/cards | Up to 0.5% difference allowed only if rounding/formatting is proven |

If a mismatch exceeds tolerance, classify as `FAIL`.
If mismatch is within tolerance, classify as `PASS_WITH_NOTE`.

## UI/UX Coverage Rules

1. The audit must explicitly evaluate these 4 areas:
   - visual layout quality
   - UX flow quality
   - accessibility and mobile behavior
   - empty/loading/error state usability
2. Filter layout and filter visual design are mandatory checks for all reporting surfaces.
3. UI/UX checks must use localhost visual inspection (Claude Chrome).
4. Best-practice benchmarking must use Ref MCP and be cited in reports.
5. If Ref MCP is unavailable, classify as `REF_MCP_UNAVAILABLE` and cite fallback sources.
6. Any UI defect that can mislead users about metric meaning or context is a `FAIL` even if raw math is correct.
7. Unresolved UX `P0`/`P1` items block final `GO`.
8. Proposed UX/layout changes must be classified as:
   - `MINOR_UX_CHANGE`
   - `MAJOR_UX_CHANGE`
9. Any `MAJOR_UX_CHANGE` must be tagged `OWNER_APPROVAL_REQUIRED`.
10. No `MAJOR_UX_CHANGE` can proceed to implementation planning without recorded owner permission.

## Project Rules And Skills Compliance Rules

1. Recommended changes must be checked against:
   - `.claude/rules/CODE_QUALITY.md`
   - `.claude/rules/UI_STANDARDS.md`
   - `.claude/rules/PROVIDER_RULES.md`
   - `.claude/rules/DATABASE_LAYER.md`
   - `.claude/rules/DOMAIN_INTEGRITY.md`
   - `.claude/rules/MODULE_CHECKLIST.md`
   - `.claude/rules/STALE_STATE_STRATEGY.md`
2. Any recommendation that touches DB queries/schema/indexes/RLS/views/RPC must apply:
   - `.claude/skills/supabase-postgres-best-practices/SKILL.md`
3. Recommendations must use relevant local skills based on:
   - `.claude/skills/skill-index.json`
4. Missing rule mapping is `RULE_CONFLICT`.
5. Missing required skill application is `SKILL_GAP`.
6. Any unresolved `RULE_CONFLICT` or `SKILL_GAP` blocks final `GO`.

## Known Domain Constraints To Enforce During Audit

1. Tasks are stored in the `activities` domain model (`activity_type = 'task'`).
2. Some "activity" queries may include task rows unless explicitly filtered.
3. Deleted records should not appear in reporting counts.
4. Stale/open opportunity logic should exclude closed won/lost records.
5. UI presentation must not hide the active filter context for reported numbers.

## How Phases Must Use This Policy

1. Every phase must read this file before analysis.
2. Any conflict must be labeled `POLICY_CONFLICT`.
3. No final signoff can be issued with unresolved `POLICY_CONFLICT`.
4. Tolerance decisions must follow this file unless owner overrides in writing.
5. Any `MAJOR_UX_CHANGE` in Phase 3/4 must include explicit owner approval status.
6. Phase 3 and Phase 4 must include a completed rules/skills alignment register.
