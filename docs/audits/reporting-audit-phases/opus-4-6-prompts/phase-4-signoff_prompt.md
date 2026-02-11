# Phase 4 Prompt: Final Signoff And Execution Pack

Copy/paste into Claude Code (Opus 4.6):

```text
<context>
You are running Phase 4 (final) of the reporting audit for Crispy-CRM.

Repo root: c:\Users\NewAdmin\Projects\crispy-crm
Mode: PLAN MODE (verification and signoff only)
Goal: verify the audit is coherent, complete, and ready for implementation across data correctness and UI/UX trust.
</context>

<pre_work>
Read in order:
1. docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-1-report.md
2. docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-2-report.md
3. docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-3-report.md
4. docs/audits/reporting-audit-phases/opus-4-6-prompts/reporting-audit-policy.md
5. docs/audits/reporting-audit-phases/opus-4-6-prompts/ui-ux-audit-rubric.md
6. docs/audits/reporting-audit-phases/opus-4-6-prompts/project-rules-skills-alignment.md

Verify:
- No mismatch from Phase 2 is missing in Phase 3 decisions.
- Every Phase 3 action has validation and rollback notes.
- Every `MAJOR_UX_CHANGE` has explicit owner permission status.
- Every Phase 3 action has rules/skills alignment status.
</pre_work>

<instructions>
Perform six verification tasks:

TASK 1: Audit Integrity
- Check consistency across phases.
- Check traceability from evidence to decisions.
- Flag contradictions or dropped items.

TASK 2: Final Metric Truth Statement
- Publish final plain-language statements for:
  - what each audited metric should count
  - what it should not count
  - which filters can change it
- Note known edge-case behavior (task/activity crossover).

TASK 3: Go/No-Go Decision
Issue one:
- GO
- CONDITIONAL_GO
- NO_GO

Use gates:
- evidence coverage complete
- unresolved P0/P1 count
- policy conflicts resolved
- validation plan ready
- unresolved UX P0/P1 count
- owner permission recorded for all `MAJOR_UX_CHANGE` items
- unresolved `RULE_CONFLICT` count
- unresolved `SKILL_GAP` count

TASK 4: Execution Queue
- Produce exact implementation order from Phase 3.
- Include dependencies and owner checkpoints.

TASK 5: UI/UX Signoff
- Publish final UI/UX trust statement for the 4 required areas:
  - visual layout quality
  - UX flow quality
  - accessibility and mobile behavior
  - empty/loading/error state usability
- Include final statement for filter layout/design quality on all audited report surfaces.
- Confirm unresolved UX severity counts (P0/P1/P2/P3).
- State whether UI/UX is acceptable for average CRM users to interpret reports correctly.

TASK 6: Rules And Skills Compliance Signoff
- Publish final status of the Project Rules And Skills Alignment Register.
- Confirm recommendations used relevant project-local skill reviews from `.claude/skills/skill-index.json`.
- Confirm DB-related recommendations used `.claude/skills/supabase-postgres-best-practices/SKILL.md`.
- List unresolved `RULE_CONFLICT` and `SKILL_GAP` items (if any) with disposition.
</instructions>

<constraints>
- Do not implement.
- Do not introduce new exploratory scope.
- If a gap is found, recommend returning to the relevant phase.
</constraints>

<output_format>
Create/update file:
docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-4-report.md

Structure:

1) Executive Summary
2) Audit Integrity Check
3) Final Metric Truth Statement
4) Final UI/UX Truth Statement
5) Go/No-Go Decision
6) Prioritized Execution Queue
7) Major UI/UX Approval Status
8) Project Rules And Skills Compliance Status
9) Final Risk Register
10) Multiple-Choice Questions
</output_format>

<reasoning_guidance>
Treat this as an audit of the audit.
Do not invent new findings unless they are contradictions in prior material.
Confidence should be reduced when cross-phase claims conflict.
No final GO if UI/UX P0/P1 findings remain without accepted guardrails.
No final GO if any `MAJOR_UX_CHANGE` lacks explicit owner permission status.
No final GO if unresolved `RULE_CONFLICT` or `SKILL_GAP` remains.
</reasoning_guidance>

<question_rules>
Ask 2-3 final multiple-choice questions.
Format:

[Q1] <clear question>
A) <option> (Recommended) - <one-line impact>
B) <option> - <one-line impact>
C) <option> - <one-line impact>

Rules:
- Recommended option is always A
- No "Other" or "Skip" options
- Questions must be strategic execution choices
</question_rules>
```
