# Phase 3 Prompt: Decisions And Remediation Plan

Copy/paste into Claude Code (Opus 4.6):

```text
<context>
You are running Phase 3 of the reporting audit for Crispy-CRM.

Repo root: c:\Users\NewAdmin\Projects\crispy-crm
Mode: PLAN MODE (read-only planning)
Goal: convert reconciliation findings (data and UI/UX) into a dependency-aware remediation plan.
</context>

<locked_inputs>
Owner-approved decisions are already recorded from Phase 2 and are fixed inputs for this phase:
- Q1-P2 = A: Add `last_activity_date` computed column to `opportunities_summary` (root-cause fix for M5).
- Q2-P2 = A: Align activity counts to one weekly window + one timezone rule with server-side counting.
- Q3-P2 = A: Add explicit `Tasks` bucket/column in Weekly Activity (do not classify tasks as notes).
- Guardrail G1: Never silently default KPI values to `0` on query failure; show explicit error/unknown state.

Use these as locked assumptions. Do not re-open these decisions unless new contradictory evidence is found and documented.
</locked_inputs>

<pre_work>
Read:
- docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-1-report.md
- docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-2-report.md
- docs/audits/reporting-audit-phases/opus-4-6-prompts/reporting-audit-policy.md
- docs/audits/reporting-audit-phases/opus-4-6-prompts/ui-ux-audit-rubric.md
- docs/audits/reporting-audit-phases/opus-4-6-prompts/project-rules-skills-alignment.md
- .claude/rules/CODE_QUALITY.md
- .claude/rules/UI_STANDARDS.md
- .claude/rules/PROVIDER_RULES.md
- .claude/rules/DATABASE_LAYER.md
- .claude/rules/DOMAIN_INTEGRITY.md
- .claude/rules/MODULE_CHECKLIST.md
- .claude/rules/STALE_STATE_STRATEGY.md
- .claude/skills/skill-index.json
- .claude/skills/discovery-first/SKILL.md
- .claude/skills/comprehensive-tracing/SKILL.md
- .claude/skills/ui-ux-design-principles/SKILL.md
- .claude/skills/three-tier-architecture-audit/SKILL.md
- .claude/skills/crispy-data-provider/SKILL.md
- .claude/skills/soft-delete-rls-audit/SKILL.md
- .claude/skills/supabase-postgres-best-practices/SKILL.md
- .claude/skills/cache-invalidation-audit/SKILL.md
- .claude/skills/data-integrity-guards/SKILL.md
- .claude/skills/enforcing-principles/SKILL.md
- .claude/skills/testing-patterns/SKILL.md
- .claude/skills/verification-before-completion/SKILL.md

Verify:
- All FAIL items from Phase 2 are carried forward.
- All UX_FAIL items from Phase 2 are carried forward.
- Tolerance rules were applied consistently.
- Locked inputs (Q1-P2/Q2-P2/Q3-P2 + G1) are reflected in all Phase 3 actions.
</pre_work>

<instructions>
Build decisions in three parts.

PART 1: Decision Table For Each Mismatch
For every mismatch from Phase 2:
- Decide primary fix layer:
  - UI
  - provider
  - DB (view/RPC)
  - shared/multi-layer
- Choose decision:
  - FIX_NOW
  - DEFER_WITH_GUARDRAIL
  - ACCEPT_AS_DESIGNED (only if policy supports it)
- Include:
  - Why this decision is correct
  - User/business impact if wrong
  - Confidence and evidence
- For UX mismatches, include:
  - affected UI/UX area (1-4 from rubric)
  - whether issue can mislead metric interpretation
  - change class:
    - MINOR_UX_CHANGE
    - MAJOR_UX_CHANGE
  - if MAJOR_UX_CHANGE, tag OWNER_APPROVAL_REQUIRED

PART 2: Phased Remediation Plan
Create a practical sequence:

Tier A: Safety and observability
- Add tracing/logging checkpoints for disputed metrics
- Add reproducible audit fixtures/check scripts

Tier B: Low-risk fixes
- Pure filter corrections
- Label/text corrections when math is already correct
- export-format alignment with existing counts
- lightweight UX clarity improvements (labels, helper text, state messaging)

Tier C: Medium-risk fixes
- provider resource/remap changes
- stale logic harmonization
- task/activity segmentation behavior updates
- report interaction and layout improvements with moderate UI impact

Tier D: High-risk fixes
- DB view/RPC logic changes with broad blast radius
- changes affecting many metrics at once
- broad report UX redesign or multi-surface interaction changes

Required execution order baseline (optimize around this unless evidence forces a change):
1) M5
2) M4
3) M2 + M3
4) M6
5) M7
6) M8 + M9

For each action include:
- action ID
- target files/objects
- dependency prerequisites
- validation steps
- rollback approach
- expected metric impact
- expected UX impact (if applicable)
- owner permission status if `MAJOR_UX_CHANGE`

PART 3: Project Rules And Skills Alignment Register
For every proposed action:
- map exact project rule files that apply
- list local skills considered from `.claude/skills/skill-index.json`
- mark primary local skill applied
- mark whether required local skill is required (`YES`/`NO`)
- mark whether required local skill was applied (`YES`/`NO`)
- for DB actions, explicitly mark Supabase skill usage
- classify:
  - COMPLIANT
  - RULE_CONFLICT
  - SKILL_GAP
  - RULE_AND_SKILL_GAP
- include remediation note for any non-compliant action
</instructions>

<constraints>
- Do not implement fixes.
- Do not edit app code or DB objects.
- No action without a validation step.
- Any ACCEPT_AS_DESIGNED must cite policy.
- Any MAJOR_UX_CHANGE must include explicit owner permission checkpoint.
- Any DB-related action without local Supabase skill application must be marked `SKILL_GAP`.
- Do not re-ask Q1-P2, Q2-P2, or Q3-P2. They are approved and locked.
- Any action that can display a false numeric "0" on data failure is non-compliant.
</constraints>

<output_format>
Create/update file:
docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-3-report.md

Structure:

1) Carried Forward Mismatch List
2) Decision Table (per mismatch)
3) Tiered Remediation Plan (A/B/C/D)
4) Validation Checklist Per Action
5) Rollback Notes
6) Priority Queue (execution order)
7) UI/UX Guardrails For Implementation
8) Owner Permission Checkpoints (Major UI/UX Changes)
9) Project Rules And Skills Alignment Register
10) Multiple-Choice Questions
</output_format>

<reasoning_guidance>
Optimize for fastest risk reduction.
Prefer fixes that reduce ambiguity across many metrics first.
If a single provider-layer change can eliminate repeated failures, prioritize that.
Prioritize UX changes that directly reduce metric misinterpretation risk.
Do not recommend implementation start for `MAJOR_UX_CHANGE` until owner approval is recorded.
Do not mark any action implementation-ready with unresolved `RULE_CONFLICT` or `SKILL_GAP`.
</reasoning_guidance>

<question_rules>
Ask 2-3 multiple-choice questions at the end.
Format:

[Q1] <clear question>
A) <option> (Recommended) - <one-line impact>
B) <option> - <one-line impact>
C) <option> - <one-line impact>

Rules:
- Recommended option is always A
- No "Other" or "Skip" options
- Questions should be implementation tradeoffs only
- Include at least one permission-decision question if any MAJOR_UX_CHANGE exists.
- Include at least one rules/skills compliance decision question if conflicts exist.
- Do NOT ask owner to re-decide Q1-P2/Q2-P2/Q3-P2.
</question_rules>
```
