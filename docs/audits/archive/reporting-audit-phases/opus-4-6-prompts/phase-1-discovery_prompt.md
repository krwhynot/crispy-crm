# Phase 1 Prompt: Reporting Discovery And Lineage Inventory

Copy/paste into Claude Code (Opus 4.6):

```text
<context>
You are running Phase 1 of a reporting audit for Crispy-CRM.

Repo root: c:\Users\NewAdmin\Projects\crispy-crm
Mode: PLAN MODE (read-only audit, no DB writes, no migrations, no app code edits)
Primary objectives:
1) discover exactly how each dashboard/report metric is built
2) establish a UI/UX baseline for reporting trust and usability

Required sources:
- docs/audits/reporting-audit-phases/opus-4-6-prompts/reporting-audit-policy.md
- docs/audits/reporting-audit-phases/opus-4-6-prompts/ui-ux-audit-rubric.md
- docs/audits/reporting-audit-phases/opus-4-6-prompts/project-rules-skills-alignment.md
- docs/features/reporting-counts-cheat-sheet.md
- src/atomic-crm/dashboard/*
- src/atomic-crm/reports/*
- src/atomic-crm/providers/supabase/*
- supabase/migrations/*
</context>

<pre_work>
Before analysis:
1. Read reporting-audit-policy.md and enforce it.
2. Verify this scope for round 1:
   - Dashboard widgets
   - Principal-focused reporting surfaces
3. Confirm the task/activity model:
   - tasks are represented through activities with activity_type='task'
4. Confirm localhost target for visual checks:
   - recommended: http://localhost:5173
5. Use Claude Chrome to do a first-pass visual walkthrough on localhost.
6. Use Ref MCP to gather 3-5 reporting UX/data-viz/accessibility best-practice references.
7. If Ref MCP is unavailable, mark REF_MCP_UNAVAILABLE and record fallback references.
8. Read relevant project rules before scoring UI/UX findings:
   - .claude/rules/UI_STANDARDS.md
   - .claude/rules/CODE_QUALITY.md
   - .claude/rules/MODULE_CHECKLIST.md
</pre_work>

<instructions>
Work in this sequence:

STEP 1: Surface Inventory
- List every dashboard widget and report panel that shows a number.
- Include CSV export surfaces where totals are shown/exported.
- Assign a metric ID to each surfaced number.

STEP 2: UI-Level Definition
- For each metric ID, document:
  - User-facing label
  - Plain-language meaning
  - Filters that can change it (date, rep, principal, campaign, stage)

STEP 3: Query-Lineage Mapping
- Trace each metric:
  UI component -> hook -> data provider call -> resource/view/RPC -> DB object
- Capture exact file references and key filter fields.
- Mark whether the metric uses:
  - raw table
  - summary view
  - RPC
  - client-side aggregation after fetch

STEP 4: Include/Exclude Rule Extraction
- For each metric ID, document what is included and excluded:
  - deleted rows behavior
  - closed stage behavior
  - task vs activity behavior
  - owner/rep scoping behavior

STEP 5: Risk Pre-Classification
- Pre-classify each metric as:
  - LOW_RISK
  - MEDIUM_RISK
  - HIGH_RISK
- Use risk triggers:
  - task/activity ambiguity
  - multi-layer filtering
  - client-side-only calculations
  - stale or undocumented logic

STEP 6: UI/UX Heuristic Baseline (4 Required Areas)
- Evaluate each major report surface against:
  - visual layout quality
  - UX flow quality
  - accessibility and mobile behavior
  - empty/loading/error state usability
- Include dedicated filter layout/design checks:
  - filter grouping and placement
  - label clarity for average CRM users
  - active filter visibility near reported metrics
  - clear/reset affordance clarity
  - consistency of filter visual design across report pages
- Use ui-ux-audit-rubric.md scoring:
  - PASS
  - PASS_WITH_NOTE
  - FAIL
- For each FAIL/PASS_WITH_NOTE, include:
  - user-facing issue statement
  - severity (P0/P1/P2/P3)
  - localhost context
  - mapped Ref MCP reference(s)
</instructions>

<constraints>
- Do not change code.
- Do not run write operations.
- Do localhost visual checks only (no production visual testing in this phase).
- Every claim needs evidence with [Confidence: XX%].
- If you cannot prove a lineage step, add it to Unknowns.
- Keep findings factual; remediation comes in Phase 3.
</constraints>

<output_format>
Create/update file:
docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-1-report.md

Report structure:

1) Scope Confirmation
2) Metric Inventory Table
3) Lineage Map Table (UI -> Provider -> DB)
4) Include/Exclude Rules By Metric
5) High-Risk Metrics (with why)
6) Unknowns
7) UI/UX Heuristic Baseline (4 Areas)
8) Filter Layout/Design Findings
9) Ref MCP Best-Practice References
10) Multiple-Choice Questions
</output_format>

<reasoning_guidance>
Prioritize traceability over volume.
If two metrics share the same data source but different filters, treat them as separate lineage entries.
When you see "activities", explicitly check whether task records can flow into that metric.
If UI wording or layout can cause users to misread a metric, treat that as an audit risk.
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
- Options must be concrete actions
</question_rules>
```
