# Phase 5 Prompt: Automation Progress (Optional)

Copy/paste into Claude Code (Opus 4.6):

```text
<context>
You are running optional Phase 5 for the reporting audit.

Repo root: c:\Users\NewAdmin\Projects\crispy-crm
Mode: PLAN MODE unless owner explicitly requests implementation.
Goal: convert validated manual audit checks into an automation plan for both data accuracy and UI/UX trust.
</context>

<pre_work>
Read:
- docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-2-report.md
- docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-3-report.md
- docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-4-report.md
- docs/audits/reporting-audit-phases/opus-4-6-prompts/reporting-audit-policy.md
- docs/audits/reporting-audit-phases/opus-4-6-prompts/ui-ux-audit-rubric.md
- docs/audits/reporting-audit-phases/opus-4-6-prompts/project-rules-skills-alignment.md
</pre_work>

<instructions>
Create an automation blueprint:

1. Select checks safe to automate first:
   - deterministic KPI counts
   - provider filter contract checks
   - DB view/RPC contract checks
   - CSV parity checks
   - localhost UI smoke checks for 4 UI/UX areas

2. Propose test layers:
   - unit tests (formula/transform rules)
   - integration tests (hook -> provider)
   - DB contract tests (view/RPC result shape and count logic)
   - E2E smoke checks for top KPIs
   - visual regression snapshots for report layout/states
   - accessibility checks for critical report/filter flows

3. Define CI gating:
   - required on every PR
   - nightly broader reconciliation set

4. Define ownership:
   - who maintains test fixtures
   - who approves tolerance changes

5. Define phased rollout:
   - sprint 1 baseline automation
   - sprint 2 parity expansion
   - sprint 3 regression hardening
   - include which UI/UX checks become required vs advisory

6. Add compliance mapping:
   - which `.claude/rules/*` each automation item enforces
   - whether DB-related automation checks require Supabase skill references
</instructions>

<constraints>
- Do not edit test code unless explicitly requested.
- Keep recommendations aligned with policy tolerance rules.
- No flaky checks as required gates.
</constraints>

<output_format>
Create/update file:
docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-5-automation-progress-report.md

Structure:

1) Candidate Checks For Automation
2) Proposed Test Matrix By Layer
3) CI Gate Proposal
4) Ownership And Governance
5) UI/UX Automation Plan
6) Rollout Plan (Sprint-based)
7) Risks And Mitigations
8) Project Rules And Skills Compliance Mapping
9) Multiple-Choice Questions
</output_format>

<question_rules>
Ask 2-3 multiple-choice questions.
Format:

[Q1] <clear question>
A) <option> (Recommended) - <one-line impact>
B) <option> - <one-line impact>
C) <option> - <one-line impact>

Rules:
- Recommended option is always A
- No "Other" or "Skip" options
</question_rules>
```
