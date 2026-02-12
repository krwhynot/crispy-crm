# Reporting Audit Execution Runbook (Opus 4.6 Style)

Use this runbook to execute the reporting audit consistently from discovery through signoff.

## Scope

Round 1 scope:
- Dashboard widgets
- Principal-focused reporting surfaces
- CSV exports tied to those surfaces
- UI/UX checks for the 4 required areas:
  - visual layout quality
  - UX flow quality
  - accessibility and mobile behavior
  - empty/loading/error state usability
- Filter layout and design quality for each report surface

Reference files:
- `docs/audits/reporting-audit-phases/opus-4-6-prompts/reporting-audit-policy.md`
- `docs/audits/reporting-audit-phases/opus-4-6-prompts/ui-ux-audit-rubric.md`
- `docs/audits/reporting-audit-phases/opus-4-6-prompts/project-rules-skills-alignment.md`
- `docs/audits/reporting-audit-phases/opus-4-6-prompts/default-skill-stack-by-phase.md`
- `docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-1-discovery_prompt.md`
- `docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-2-reconciliation_prompt.md`
- `docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-3-decisions_prompt.md`
- `docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-4-signoff_prompt.md`
- `docs/audits/reporting-audit-phases/opus-4-6-prompts/phase-5-automation-progress_prompt.md` (optional)

## Execution Conditions (must all be true)

1. `reporting-audit-policy.md` has been reviewed in the current month.
2. Audit is run as read-only for discovery/reconciliation/decision/signoff phases.
3. The task/activity constraint is acknowledged:
   - tasks are represented in activities (`activity_type = 'task'`)
4. Scope is fixed to round-1 surfaces unless owner approves expansion.
5. Visual checks are run on localhost pages with Claude Chrome.
6. Ref MCP best-practice benchmarking is performed or explicitly marked unavailable.
7. Any proposed `MAJOR_UX_CHANGE` has an owner-permission checkpoint before implementation.
8. Rules/skills alignment is completed using project-local skills from `.claude/skills/skill-index.json`.

If any condition fails, stop and resolve before continuing.

## Ownership Split

- Auditor (Codex/Claude + engineer):
  - Run prompts phase by phase
  - Capture evidence and confidence
  - Maintain report files and mismatch register
  - Capture UI/UX visual evidence and benchmark mapping
- Product owner:
  - Clarify ambiguous business rules
  - Approve tolerance overrides (if any)
  - Approve final GO/CONDITIONAL_GO/NO_GO

## Step 1: Pre-Audit Setup

1. Confirm active files are present and not placeholders only.
2. Confirm `docs/features/reporting-counts-cheat-sheet.md` is available for plain-language checks.
3. Confirm `ui-ux-audit-rubric.md` is available and current.
4. Confirm `project-rules-skills-alignment.md` is available and current.
5. Confirm `.claude/skills/skill-index.json` is available and current.
6. Confirm `default-skill-stack-by-phase.md` is available and choose the stack for the current phase.
7. Start app locally and confirm localhost target URL:
   - recommended: `http://localhost:5173`
8. Create a session log from:
   - `docs/audits/reporting-audit-phases/opus-4-6-prompts/session-log-template.md`
9. Fill the session header at minimum:
   - start date/time
   - auditor
   - repo commit SHA
   - target environment (staging first)
   - localhost URL used

## Step 2: UI/UX Baseline Pass (Claude Chrome + Ref MCP)

1. Use Claude Chrome to visually inspect all round-1 reporting surfaces on localhost.
2. Evaluate each surface against the 4 required areas in `ui-ux-audit-rubric.md`.
3. Explicitly audit filter layout/design on each surface:
   - grouping, visibility, label clarity, active-state visibility, clear/reset behavior
4. Use Ref MCP to collect 3-5 best-practice references for reporting UX/data visualization/accessibility.
5. Record source links/titles and map initial findings to references.
6. If Ref MCP is unavailable:
   - record `REF_MCP_UNAVAILABLE`
   - use fallback primary-source references and note why

Gate to continue:
- All 4 areas have at least baseline PASS/PASS_WITH_NOTE/FAIL status recorded.
- Filter layout/design findings are recorded for each audited report surface.

## Step 3: Run Phase 1 (Discovery)

1. Open `phase-1-discovery_prompt.md`.
2. Copy the XML-style prompt block into Opus 4.6 in PLAN MODE.
3. Save output to `phase-1-report.md`.
4. Ensure output includes:
   - Metric inventory
   - Full lineage table (UI -> provider -> DB)
   - Include/exclude rules per metric
   - High-risk metric list
   - UI/UX heuristic baseline by 4 areas
   - Filter layout/design findings
   - Ref MCP best-practice references
   - 2-3 multiple-choice questions

Gate to continue:
- Every metric in scope has a lineage entry or is listed in Unknowns.
- UI/UX baseline is present for all four areas.

## Step 4: Run Phase 2 (Reconciliation)

1. Open `phase-2-reconciliation_prompt.md`.
2. Run in PLAN MODE using Phase 1 metric IDs and UI/UX findings.
3. Save output to `phase-2-report.md`.
4. Ensure output includes:
   - Scenario matrix
   - UI vs provider vs DB vs CSV reconciliation table
   - PASS / PASS_WITH_NOTE / FAIL status using policy tolerances
   - Mismatch register with root-cause hypothesis
   - UI/UX behavior mismatch register
   - Filter layout/design mismatch register

Gate to continue:
- Every FAIL has reproducible evidence and severity.

## Step 5: Run Phase 3 (Decisions)

1. Open `phase-3-decisions_prompt.md`.
2. Run in PLAN MODE using Phase 2 mismatches.
3. Save output to `phase-3-report.md`.
4. Ensure output includes:
   - Decision per mismatch (FIX_NOW / DEFER_WITH_GUARDRAIL / ACCEPT_AS_DESIGNED)
   - Tiered plan A/B/C/D
   - Validation steps per action
   - Rollback notes per action
   - `MINOR_UX_CHANGE` vs `MAJOR_UX_CHANGE` classification for UI/UX actions
   - owner permission status for each `MAJOR_UX_CHANGE`
   - rules/skills alignment register for all actions

Gate to continue:
- No mismatch is dropped.
- Any `ACCEPT_AS_DESIGNED` cites policy explicitly.
- Every `MAJOR_UX_CHANGE` is tagged `OWNER_APPROVAL_REQUIRED` and permission status is explicit.
- No unresolved `RULE_CONFLICT` or `SKILL_GAP` without documented owner decision.

## Step 5A: Owner Permission Gate (Major UI/UX Changes)

Run this checkpoint before moving major UI/UX actions into implementation:

1. List all `MAJOR_UX_CHANGE` actions from `phase-3-report.md`.
2. Present each action with:
   - why it is major
   - user impact if changed
   - rollback/safety note
3. Record owner decision per action:
   - `APPROVED`
   - `APPROVED_WITH_GUARDRAIL`
   - `REJECTED`
4. Do not schedule implementation for `REJECTED` or unresolved actions.

## Step 6: Run Phase 4 (Signoff)

1. Open `phase-4-signoff_prompt.md`.
2. Run in PLAN MODE.
3. Save output to `phase-4-report.md`.
4. Ensure output includes:
   - Final metric truth statements in plain language
   - Final UI/UX truth statement for the 4 areas
   - Audit integrity check across phases
   - GO / CONDITIONAL_GO / NO_GO decision
   - Prioritized execution queue
   - Project rules and skills compliance status

Gate to close audit:
- No unresolved policy conflict.
- No unresolved UX `P0`/`P1` blocking issues for `GO`.
- No unresolved `MAJOR_UX_CHANGE` permission checkpoints for `GO`.
- No unresolved `RULE_CONFLICT` or `SKILL_GAP` for `GO`.
- Final decision is explicit and justified.

## Step 7: Optional Phase 5 (Automation Progress)

Run only after manual findings are stable.

1. Open `phase-5-automation-progress_prompt.md`.
2. Run in PLAN MODE unless implementation is explicitly requested.
3. Save output to `phase-5-automation-progress-report.md`.

Use this phase to define CI-safe checks for proven metrics only.

## Evidence Standards

For each significant claim, include:
- Source path(s)
- Metric ID (if metric-related)
- Scenario/filter context
- Localhost page/surface checked
- Reproducible comparison basis (UI/provider/DB/CSV)
- Confidence percentage
- Best-practice reference link/title for UI/UX findings
- UX action class (`MINOR_UX_CHANGE` or `MAJOR_UX_CHANGE`) where relevant
- Owner permission status for major UX/layout actions
- Project rule mappings per action
- Skill application evidence for DB-related actions

Minimum evidence bar:
- No claim without source references.
- No FAIL without reproduction steps.
- No UX FAIL without explicit area mapping (1-4 from rubric).

## Stop Conditions

Stop the phase and escalate to owner if any of the following occurs:
1. Policy conflict that changes metric meaning.
2. Ambiguous task/activity handling that cannot be proven from lineage.
3. Inconsistent results across repeated runs (`UNSTABLE`).
4. Scope creep beyond approved round-1 surfaces.
5. Localhost visual checks cannot be completed.
6. Ref MCP benchmark cannot be completed and no fallback references are accepted.
7. A `MAJOR_UX_CHANGE` is queued without explicit owner permission.
8. A recommendation has unresolved `RULE_CONFLICT` or `SKILL_GAP`.

## Final Deliverables Checklist

- [ ] `phase-1-report.md` completed
- [ ] `phase-2-report.md` completed
- [ ] `phase-3-report.md` completed
- [ ] `phase-4-report.md` completed
- [ ] Optional `phase-5-automation-progress-report.md` completed (if run)
- [ ] Session log completed from `session-log-template.md`
- [ ] Final owner decision recorded (GO / CONDITIONAL_GO / NO_GO)
- [ ] Implementation queue copied to delivery tracker (tickets/issues)
