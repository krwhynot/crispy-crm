# Default Skill Stack By Phase (Project-Local)

Use this as the default local skill stack for reporting audits.
Source of truth for available skills remains `.claude/skills/skill-index.json`.

## Phase 0: Preflight (Before Phase 1)

Required:
- `discovery-first`
- `comprehensive-tracing`

Recommended:
- `ui-ux-design-principles`
- `verification-before-completion`

Use when needed:
- `fail-fast-debugging`, `troubleshooting` (if setup is unstable)

## Phase 1: Discovery And Lineage

Required:
- `discovery-first`
- `comprehensive-tracing`
- `ui-ux-design-principles`

Recommended:
- `three-tier-architecture-audit`
- `crispy-data-provider`

Use when needed:
- `soft-delete-rls-audit`, `supabase-postgres-best-practices` (if DB lineage is unclear)
- `cache-invalidation-audit` (if stale/refetch behavior appears in UI)

## Phase 2: Reconciliation (UI vs Provider vs DB vs CSV)

Required:
- `comprehensive-tracing`
- `crispy-data-provider`
- `ui-ux-design-principles`

Recommended:
- `soft-delete-rls-audit`
- `cache-invalidation-audit`

Use when needed:
- `supabase-postgres-best-practices` (for query/aggregation mismatches)
- `fail-fast-debugging`, `troubleshooting` (for `UNSTABLE` results)

## Phase 3: Decisions And Remediation Plan

Required:
- `crispy-data-provider`
- `ui-ux-design-principles`
- `verification-before-completion`

Recommended:
- `data-integrity-guards`
- `enforcing-principles`
- `testing-patterns`

Use when needed:
- `supabase-postgres-best-practices`, `soft-delete-rls-audit` (DB action items)
- `cache-invalidation-audit` (cache/refetch remediation)
- `three-tier-architecture-audit` (UI structure refactors)

## Phase 4: Final Signoff

Required:
- `verification-before-completion`
- `testing-patterns`

Recommended:
- `comprehensive-tracing`
- `ui-ux-design-principles`

Use when needed:
- `fail-fast-debugging`, `troubleshooting` (if conflicts remain)

## Phase 5: Optional Automation Progress

Required:
- `testing-patterns`
- `verification-before-completion`

Recommended:
- `cache-invalidation-audit`
- `supabase-postgres-best-practices` (for DB contract checks)

Use when needed:
- `three-tier-architecture-audit` (UI regression checks)
- `data-integrity-guards` (validation contract automation)

## Mandatory Overrides

Always add these skills when conditions apply:

- DB/RLS/view/RPC/schema/index recommendations:
  - `supabase-postgres-best-practices`
  - `soft-delete-rls-audit`
- Provider/resource/filter mapping recommendations:
  - `crispy-data-provider`
- UI/filter layout and design recommendations:
  - `ui-ux-design-principles`
  - `three-tier-architecture-audit`
- Stale/refetch/query-key findings:
  - `cache-invalidation-audit`
- Unstable or contradictory evidence:
  - `fail-fast-debugging`
  - `troubleshooting`

## Evidence Rule

In Phase 3 and Phase 4 reports, list:
- local skills considered
- primary local skill applied
- why the skill selection matched the action layer
