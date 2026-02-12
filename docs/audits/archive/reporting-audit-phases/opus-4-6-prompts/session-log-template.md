# Reporting Audit Session Log Template

Use one copy of this template per audit session.

## Session Header

- Session date:
- Start time:
- End time:
- Auditor:
- Reviewer:
- Environment:
  - `Staging`
  - `Production (read-only verification)`
- Localhost URL used:
- Claude Chrome visual pass completed: Yes/No
- Ref MCP research completed: Yes/No
- Filter layout/design audit completed: Yes/No
- Repo commit SHA:
- Audit phase(s) run this session:
  - `Phase 1`
  - `Phase 2`
  - `Phase 3`
  - `Phase 4`
  - `Phase 5 (optional)`

## Scope Confirmed For This Session

- Dashboard widgets in scope: Yes/No
- Principal-focused reports in scope: Yes/No
- CSV parity surfaces in scope: Yes/No
- 4 UI/UX areas in scope: Yes/No
- Any approved scope expansion: Yes/No
- If yes, list expansion approval and details:

## Inputs Reviewed

- [ ] `reporting-audit-policy.md`
- [ ] `phase-1-report.md` (if exists)
- [ ] `phase-2-report.md` (if exists)
- [ ] `phase-3-report.md` (if exists)
- [ ] `phase-4-report.md` (if exists)
- [ ] `docs/features/reporting-counts-cheat-sheet.md`
- [ ] `ui-ux-audit-rubric.md`
- [ ] `project-rules-skills-alignment.md`
- [ ] `default-skill-stack-by-phase.md`
- [ ] `.claude/rules/CODE_QUALITY.md`
- [ ] `.claude/rules/UI_STANDARDS.md`
- [ ] `.claude/rules/PROVIDER_RULES.md`
- [ ] `.claude/rules/DATABASE_LAYER.md`
- [ ] `.claude/rules/DOMAIN_INTEGRITY.md`
- [ ] `.claude/rules/MODULE_CHECKLIST.md`
- [ ] `.claude/rules/STALE_STATE_STRATEGY.md`
- [ ] `.claude/skills/skill-index.json`
- [ ] Relevant `.claude/skills/*/SKILL.md` files reviewed for this session
- [ ] `.claude/skills/supabase-postgres-best-practices/SKILL.md` (if DB changes are in scope)

## Policy And Constraint Check

- Policy reviewed this month: Yes/No
- Task/activity model acknowledged (`activity_type='task'`): Yes/No
- Tolerance rules confirmed active: Yes/No
- Any policy conflicts found: Yes/No
- If yes, list `POLICY_CONFLICT` items:
- Ref MCP unavailable in this session: Yes/No
- If yes, list fallback best-practice sources used:
- Any MAJOR_UX_CHANGE identified this session: Yes/No
- If yes, list action IDs tagged `OWNER_APPROVAL_REQUIRED`:
- Any `RULE_CONFLICT` identified this session: Yes/No
- Any `SKILL_GAP` identified this session: Yes/No
- Default phase skill stack applied: Yes/No
- If no, document approved reason:

## Work Completed

1. Actions taken:
2. Files reviewed:
3. Evidence captured:
4. Metric IDs touched:
5. Scenario filters used:
6. Localhost report surfaces reviewed:
7. Best-practice references captured:

## Findings Summary

- PASS count:
- PASS_WITH_NOTE count:
- FAIL count:
- UNSTABLE count:
- High-risk metrics identified:
- UX_PASS count:
- UX_PASS_WITH_NOTE count:
- UX_FAIL count:
- UX P0/P1 open count:
- Filter layout/design FAIL count:

## Decisions Made

- Decisions finalized this session:
  - `FIX_NOW`
  - `DEFER_WITH_GUARDRAIL`
  - `ACCEPT_AS_DESIGNED`
- Decision IDs:
- Owner approvals captured:
- Major UI/UX permissions requested this session:
- Major UI/UX permissions granted/denied:
- Rules/skills alignment register updated: Yes/No

## Open Questions

1.
2.
3.

## Blockers / Stop Conditions Hit

- Any stop condition hit (Yes/No):
- If yes, which:
  - `POLICY_CONFLICT`
  - `UNSTABLE_RESULTS`
  - `TASK_ACTIVITY_AMBIGUITY`
  - `SCOPE_CREEP`
  - `LOCALHOST_UNAVAILABLE`
  - `REF_MCP_UNAVAILABLE`
  - `MAJOR_UX_CHANGE_UNAPPROVED`
  - `RULE_CONFLICT`
  - `SKILL_GAP`
- Escalated to owner: Yes/No
- Escalation timestamp:

## Next Session Plan

1.
2.
3.

## Signoff

- Auditor signoff:
- Reviewer signoff:
- Owner decision for current checkpoint:
  - `GO`
  - `CONDITIONAL_GO`
  - `NO_GO`
- UI/UX checkpoint status:
  - `APPROVED`
  - `APPROVED_WITH_GUARDRAIL`
  - `NOT_APPROVED`
- Major UI/UX approval status:
  - `ALL_APPROVED`
  - `PARTIAL_APPROVAL`
  - `PENDING_OR_REJECTED`
