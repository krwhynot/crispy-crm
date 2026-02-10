# Tier D Prompt: Execution & Verification

Copy/paste into Claude Code (Opus 4.6):

```text
<context>
You are executing Tier D cleanup for Crispy-CRM.

Repo root: c:\Users\NewAdmin\Projects\crispy-crm
Execution mode: Controlled execution (not planning)
Required references:
- Business logic source of truth:
  docs/audits/full-db-audit-phases/opus-4-6-prompts/business-logic-policy.md
- Tier D runbook:
  docs/audits/full-db-audit-phases/opus-4-6-prompts/tier-d-execution-runbook.md
- Current signoff report:
  docs/audits/full-db-audit-phases/opus-4-6-prompts/phase-4-report.md
- Tier D migration candidate:
  supabase/migrations/20260210000008_tier_d_drop_legacy_compat_and_unused_objects.sql

Required tools:
- Local DB checks: Docker/Supabase local CLI
- Cloud verification + execution: Supabase MCP (+ Supabase CLI if needed for push)
Audit lens: supabase-postgres-best-practices

Owner policy constraints:
- No hardcoded date gate. Tier D is condition-based.
- Gate conditions: 10-day no-use window + explicit owner signoff + dependency checks.
- If business logic is unclear or conflicts policy: STOP and ask immediately.
- Enforce owner-approved Q1-Q12 confirmation set in business-logic-policy.md.
</context>

<objective>
Execute Tier D safely end-to-end only if all gate conditions pass.
If any condition fails, do not apply migration; produce HOLD report with blockers.
</objective>

<instructions>
Follow these steps exactly:

STEP 0: Load policy + runbook
- Read business-logic-policy.md first.
- Read tier-d-execution-runbook.md and follow it as operational source.
- If anything conflicts between docs, treat business-logic-policy.md as authoritative and flag BUSINESS_LOGIC_CONFLICT.

STEP 1: Gate evaluation
- Validate all three Tier D gate conditions:
  1) 10-day no-use window satisfied
  2) explicit owner signoff present
  3) dependency checks pass
- Provide evidence for each condition with [Confidence: XX%].
- If any condition is not met, STOP and produce HOLD outcome.

STEP 2: Preflight SQL checks (cloud)
- Execute all preflight checks from tier-d-execution-runbook.md:
  - row counts for migration_history/tutorial_progress
  - compatibility view existence
  - dependency check query
  - replacement index presence check
- Capture exact results and classify pass/fail for each.

STEP 3: Dry-run
- Run dry-run push for cloud migrations.
- Confirm only intended Tier D migration action is pending.
- If dry-run reveals unexpected changes, STOP and report.

STEP 4: Owner approval checkpoint (required before apply)
- Present concise GO/NO-GO summary.
- Ask one multiple-choice approval question:
  A) Apply Tier D now (Recommended, if all checks pass)
  B) Hold and investigate further
  C) Abort Tier D for now
- Wait for owner answer before any apply step.

STEP 5: Apply migration (only with explicit A approval)
- Apply migration via standard project command path.
- Record migration apply outcome and resulting schema state.

STEP 6: Post-apply verification
- Run post-apply verification queries from runbook:
  - dropped objects are NULL via to_regclass
  - replacement indexes still exist
- Confirm no BUSINESS_LOGIC_CONFLICT introduced.

STEP 7: Post-drop repo hygiene
- Regenerate types (`npm run gen:types`).
- Run quick reference scan for removed objects in runtime app code.
- Run `npm run typecheck`.
- If failures occur, diagnose and propose minimal corrective actions.

STEP 8: Finalize audit artifacts
- Update:
  - docs/audits/full-db-audit-phases/opus-4-6-prompts/phase-4-report.md
- Create/update:
  - docs/audits/full-db-audit-phases/opus-4-6-prompts/tier-d-execution-report.md
</instructions>

<constraints>
- Do not run destructive SQL manually outside the Tier D migration file.
- Do not modify migration intent (no CASCADE additions, no broadened scope).
- Do not infer owner approval; require explicit approval at checkpoint.
- Every claim must include evidence and [Confidence: XX%].
- If checks fail, output HOLD with exact blockers and recommended next action.
</constraints>

<output_format>
Create/update: docs/audits/full-db-audit-phases/opus-4-6-prompts/tier-d-execution-report.md

Use this structure:
1) Gate Condition Evaluation
2) Preflight SQL Results
3) Dry-Run Results
4) Owner Approval Checkpoint
5) Apply Execution (or HOLD reason)
6) Post-Apply Verification
7) Type Regeneration + Typecheck Results
8) Business Logic Conflict Check
9) Final Verdict (GO COMPLETE / HOLD / ABORT)
10) Next Actions

Also append a concise Tier D status update section to:
docs/audits/full-db-audit-phases/opus-4-6-prompts/phase-4-report.md
</output_format>
```
