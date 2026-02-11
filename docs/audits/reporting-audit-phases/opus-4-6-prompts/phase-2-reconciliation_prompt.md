# Phase 2 Prompt: Reconciliation (UI vs DB vs CSV)

Copy/paste into Claude Code (Opus 4.6):

```text
<context>
You are running Phase 2 of the reporting audit for Crispy-CRM.

Repo root: c:\Users\NewAdmin\Projects\crispy-crm
Mode: PLAN MODE (read-only audit)
Goal: reconcile reported values and UI/UX behavior across UI, provider query intent, DB results, and CSV exports.
</context>

<pre_work>
Before starting:
1. Read:
   - docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-1-report.md
   - docs/audits/reporting-audit-phases/opus-4-6-prompts/reporting-audit-policy.md
   - docs/audits/reporting-audit-phases/opus-4-6-prompts/ui-ux-audit-rubric.md
   - docs/audits/reporting-audit-phases/opus-4-6-prompts/project-rules-skills-alignment.md
   - .claude/rules/PROVIDER_RULES.md
   - .claude/rules/DATABASE_LAYER.md
   - .claude/rules/STALE_STATE_STRATEGY.md
2. Confirm metric IDs from Phase 1 are complete.
3. Confirm tolerance rules from policy are active.
4. Confirm localhost target is available for visual behavior checks:
   - recommended: http://localhost:5173
</pre_work>

<instructions>
Execute in order:

STEP 1: Test Matrix Design
- Build a minimum matrix of scenarios:
  - no filters
  - one date filter
  - one rep filter
  - one principal filter
  - one campaign filter (if applicable)
- Include at least one scenario that can expose task/activity ambiguity.

STEP 2: Evidence Capture Per Scenario
For each metric in scope:
- Capture UI value (as displayed).
- Capture provider-level query shape (resource, filter, date field, aggregation mode).
- Capture DB-side expected value using equivalent read-only query logic.
- Capture CSV value if the metric is exported.

STEP 3: Reconciliation
- Compare UI vs DB vs CSV.
- Apply policy tolerances by metric class.
- Tag each as:
  - PASS
  - PASS_WITH_NOTE
  - FAIL

STEP 4: Mismatch Root Cause Hypothesis
For each FAIL:
- Hypothesize layer of fault:
  - UI calculation/presentation
  - provider mapping/filtering
  - DB view/RPC logic
  - mixed-layer interaction
- Include confidence and the specific evidence chain.

STEP 5: Severity And Impact
- Rate each FAIL: P0/P1/P2/P3.
- Describe impact in user language:
  - trust risk
  - sales prioritization risk
  - manager reporting risk
  - operational decision risk

STEP 6: UI/UX Behavior Reconciliation
- Re-run key reporting scenarios on localhost using Claude Chrome.
- Reconcile whether UX behavior matches user expectations and metric context:
  - filter discoverability and clarity
  - filter layout/design consistency across report pages
  - synchronized updates across cards/charts/tables
  - drill-down path clarity
  - CSV/export consistency with visible filters
  - empty/loading/error state clarity
  - desktop vs mobile viewport behavior
- For each mismatch, tag:
  - UX_PASS
  - UX_PASS_WITH_NOTE
  - UX_FAIL
- Map each UX mismatch to at least one Ref MCP best-practice reference.
</instructions>

<constraints>
- No data writes.
- No code changes.
- Do not jump to implementation details yet.
- Every mismatch must have reproducible evidence.
- If evidence conflicts between runs, mark UNSTABLE and explain possible causes.
- Keep visual checks on localhost in this phase.
</constraints>

<output_format>
Create/update file:
docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-2-report.md

Structure:

1) Scenario Matrix
2) Reconciliation Table (UI, Provider, DB, CSV, Status)
3) Mismatch Register
4) Root Cause Hypotheses By Layer
5) Severity And Business Impact
6) UI/UX Behavior Mismatch Register
7) Filter Layout/Design Mismatch Register
8) Unknowns / Unstable Results
9) Multiple-Choice Questions
</output_format>

<reasoning_guidance>
Treat this as an accounting audit.
Do not rely on a single source.
If UI and DB match but CSV differs, that is still a failure path.
If counts differ only when a specific filter is active, prioritize filter-path root cause.
If a user can misinterpret a correct metric due to UI behavior, treat that as a valid audit failure.
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
- Questions should resolve real audit ambiguities
</question_rules>
```
