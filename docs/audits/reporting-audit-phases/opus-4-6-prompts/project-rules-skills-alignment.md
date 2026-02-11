# Project Rules And Skills Alignment Guide

Use this guide to ensure audit findings and recommended changes align with project standards before implementation.

## Required Project Rule Sources

Review these rule files and apply all relevant constraints:

- `.claude/rules/CODE_QUALITY.md`
- `.claude/rules/UI_STANDARDS.md`
- `.claude/rules/PROVIDER_RULES.md`
- `.claude/rules/DATABASE_LAYER.md`
- `.claude/rules/DOMAIN_INTEGRITY.md`
- `.claude/rules/MODULE_CHECKLIST.md`
- `.claude/rules/STALE_STATE_STRATEGY.md`

## Project-Local Skills Source Of Truth

Use only the project-local skills for this audit:

- `.claude/skills/skill-index.json`
- `.claude/skills/<skill-name>/SKILL.md`

## Reporting-Relevant Local Skills

- `.claude/skills/discovery-first/SKILL.md`
- `.claude/skills/comprehensive-tracing/SKILL.md`
- `.claude/skills/ui-ux-design-principles/SKILL.md`
- `.claude/skills/three-tier-architecture-audit/SKILL.md`
- `.claude/skills/crispy-data-provider/SKILL.md`
- `.claude/skills/soft-delete-rls-audit/SKILL.md`
- `.claude/skills/supabase-postgres-best-practices/SKILL.md`
- `.claude/skills/cache-invalidation-audit/SKILL.md`
- `.claude/skills/data-integrity-guards/SKILL.md`
- `.claude/skills/enforcing-principles/SKILL.md`
- `.claude/skills/testing-patterns/SKILL.md`
- `.claude/skills/fail-fast-debugging/SKILL.md`
- `.claude/skills/troubleshooting/SKILL.md`
- `.claude/skills/verification-before-completion/SKILL.md`

## Skill Applicability Matrix

| Skill | Use When | Required Condition |
|---|---|---|
| `discovery-first`, `comprehensive-tracing` | Metric inventory and lineage tracing | Required in discovery/reconciliation phases |
| `ui-ux-design-principles`, `three-tier-architecture-audit` | UI/filter layout and report UX findings | Required for UI/UX recommendations |
| `crispy-data-provider` | Provider mapping/filter/resource handler recommendations | Required for provider-layer recommendations |
| `soft-delete-rls-audit`, `supabase-postgres-best-practices` | DB/RLS/view/RPC/schema/index recommendations | Required for DB-related recommendations |
| `cache-invalidation-audit` | Stale/filter/refetch/invalidation issues | Required when stale-state or cache behavior is in scope |
| `data-integrity-guards`, `enforcing-principles` | Validation/defaults/coercion/data contract recommendations | Required for integrity/validation recommendations |
| `testing-patterns`, `verification-before-completion` | Test/verification rollout and acceptance criteria | Required for remediation validation planning |
| `fail-fast-debugging`, `troubleshooting` | Unstable, flaky, or contradictory evidence runs | Required for `UNSTABLE`/diagnostic follow-up |

## Alignment Register Format (Required In Reports)

For each recommended action, capture:

- action ID
- affected layer (`UI`, `provider`, `DB`, `shared`)
- mapped project rules (exact rule file names)
- local skills considered (skill names)
- primary local skill applied (`skill-name` or `N/A`)
- skill required (`YES`/`NO`)
- skill applied (`YES`/`NO`)
- compliance status:
  - `COMPLIANT`
  - `RULE_CONFLICT`
  - `SKILL_GAP`
  - `RULE_AND_SKILL_GAP`
- notes / required follow-up

## Decision Rules

1. No action can be marked ready for implementation without rule mapping.
2. Any DB-related action without `supabase-postgres-best-practices` review is a `SKILL_GAP`.
3. Any action without relevant local skill application (per matrix) is a `SKILL_GAP`.
4. If an action conflicts with any `.claude/rules` file, classify `RULE_CONFLICT`.
5. Unresolved `RULE_CONFLICT` or `SKILL_GAP` blocks final `GO`.
6. `MAJOR_UX_CHANGE` still requires explicit owner permission.

## Common Mapping Guidance

- UI layout/filter design changes:
  - `UI_STANDARDS.md`
  - `CODE_QUALITY.md`
  - `MODULE_CHECKLIST.md`
  - `ui-ux-design-principles`
  - `three-tier-architecture-audit`
- Provider handler/query-mapping changes:
  - `PROVIDER_RULES.md`
  - `STALE_STATE_STRATEGY.md`
  - `DOMAIN_INTEGRITY.md`
  - `crispy-data-provider`
  - `cache-invalidation-audit`
- DB view/RPC/schema/RLS changes:
  - `DATABASE_LAYER.md`
  - `DOMAIN_INTEGRITY.md`
  - `soft-delete-rls-audit`
  - `supabase-postgres-best-practices`
- Validation/data contract changes:
  - `DOMAIN_INTEGRITY.md`
  - `enforcing-principles`
  - `data-integrity-guards`

## Evidence Requirement

Every Phase 3/4 report must include a completed alignment register.
If uncertain, mark the action as non-compliant and ask for owner clarification.
