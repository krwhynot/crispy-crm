# Phase 3 Report: Decisions & Cleanup Plan (Backfilled)

**Date:** 2026-02-10
**Auditor:** Claude Code (Opus 4.6, Docker local + Supabase MCP cloud)
**Mode:** PLAN + EXECUTION BACKFILL
**Status:** UPDATED AFTER TIER B
**Overall Confidence:** [Confidence: 90%]

> Historical snapshot note: this report captures status immediately after Tier B.
> For current status after Tier C and latest owner decisions, use `phase-4-report.md` and `business-logic-policy.md`.

---

## 1) What This Backfill Updates

This file now reflects the latest confirmed state from Tier A and Tier B execution.
Superseded assumptions from earlier drafts were corrected:

- `daily-digest` is **deferred** (not MVP scope), not an active Tier B fix.
- The "4 SELECT policies missing soft-delete filter" item is **closed as N/A by design** because those tables do not have a `deleted_at` column.
- Tier D table-removal timing now follows the business-logic policy: **10-day no-use window** + owner signoff (not 30 days).
- `contact_duplicates` and `duplicate_stats` are treated as **cloud drift candidates for DROP**, pending explicit owner confirmation.

---

## 2) Decision Table (Current)

| Object | Decision | Current Rationale | Confidence |
|---|---|---|---|
| `tasks_v` | DEPRECATE -> DROP (Tier D) | Compatibility view only; no app code dependency. | [90%] |
| `tasks_summary` | DEPRECATE -> DROP (Tier D) | Compatibility aggregation; no app code dependency. | [90%] |
| `contactNotes`, `opportunityNotes`, `organizationNotes` | KEEP | Actively used by app/resource handlers. | [100%] |
| `opportunity_stage_changes` | FIXED (Tier B) | Deployed to cloud with `security_invoker = on`. | [95%] |
| `contact_duplicates`, `duplicate_stats` | PENDING OWNER DECISION (Tier D candidate DROP) | They were intentionally removed by product decision previously, but still exist in cloud due drift. | [85%] |
| `migration_history` | DEPRECATE -> DROP (Tier D) | 0 rows and no app references. | [90%] |
| `tutorial_progress` | DEPRECATE -> DROP (Tier D) | 0 rows and no app references. | [90%] |
| `dashboard_snapshots` | KEEP + FIXED (Tier B deploy done) | Edge Function deployed and corrected for STI task model. | [95%] |
| `daily-digest` | DEFERRED | Out of MVP scope per business logic policy. | [95%] |
| `exec_sql` | KEEP (restricted usage) | Admin/script utility with guardrails; no immediate action in Tier B. | [85%] |

---

## 3) Tier A/Tier B Execution Backfill

### Gate 1

**Status: PASSED (11/11)** [Confidence: 95%]

Completed:
- PITR confirmed.
- Baselines captured.
- DEPRECATED comments added to `tasks_v` and `tasks_summary`.
- Vault secrets and Edge Function environment variables verified.

### Tier B Summary

| Seq | Action | Result | Confidence |
|---|---|---|---|
| 4 | Deploy `capture-dashboard-snapshots` Edge Function | DONE. Updated non-existent `tasks` queries to `activities` + `activity_type='task'`. | [95%] |
| 4 | Deploy `opportunity_stage_changes` view | DONE on cloud. | [95%] |
| 4 | Add `deleted_at IS NULL` to 4 SELECT policies | N/A by design (target tables do not have `deleted_at`). | [95%] |
| 5 | Redeploy `daily-digest` | DEFERRED (not MVP). | [95%] |
| 6 | Batch 1 trigger deploy | DONE. Cloud triggers moved 52 -> 62. `tasks_deprecated` skipped (not present). | [95%] |
| 7 | Batch 2 trigger deploy | N/A (already present on cloud). | [90%] |
| 8 | Local parity for duplicate views | REVERSED. Moved to Tier D cloud-drift decision. | [90%] |

**Gate 2:** Ready to proceed to Tier C. [Confidence: 90%]

---

## 4) Remaining Plan (Tier C and Tier D)

### Tier C (Medium Risk)

1. Deploy remaining trigger batches for:
   - audit immutability,
   - soft-delete cascades,
   - critical-field audit logging,
   - timeline event logging.
2. Validate each batch with explicit SQL checks before moving on.

### Tier D (Removals, Owner-Controlled)

1. Drop duplicate indexes after verification.
2. Drop `tasks_summary` then `tasks_v`.
3. Evaluate `migration_history` and `tutorial_progress` for drop.
4. Evaluate cloud drift views `contact_duplicates` and `duplicate_stats` for drop.

**Tier D timing rule:**
- No automatic 30-day hold.
- Use business policy: **10-day no-use window + explicit owner signoff + dependency checks**.

---

## 5) Updated Risk Register

| ID | Severity | Finding | Current State | Planned Mitigation |
|---|---|---|---|---|
| P1-1 | HIGH | Cloud trigger gap (remaining batches) | OPEN | Tier C deploy + validation |
| P1-2 | MEDIUM | Snapshot chain operational confidence | PARTIAL FIX | Continue runtime verification after deployment |
| P1-3 | MEDIUM | Duplicate DELETE policy overlap (notes) | OPEN | Tier C policy cleanup |
| P2-1 | LOW | `daily-digest` 401 | DEFERRED | Post-MVP backlog |
| P2-3 | LOW | Duplicate indexes | OPEN | Tier D cleanup |
| P2-4 | LOW | Cross-env view drift | OPEN | Tier D owner decision |
| P2-5 | INFO | 4 SELECT policies "missing soft-delete" | CLOSED (N/A) | No action required |
| P4-1 | LOW | `product_features` parity drift | RESOLVED | Migration `20260210000006` applied |

---

## 6) Owner Decisions Still Needed

1. Should `contact_duplicates` and `duplicate_stats` be dropped from cloud now?
2. Should Tier D table drops execute as soon as the 10-day no-use window is satisfied?
3. Should `daily-digest` remain deferred until MVP scope changes?

---

## 7) Recommended Next Step

Proceed to **Tier C** execution with strict batch validation and business-logic conflict checks against:

`docs/audits/full-db-audit-phases/opus-4-6-prompts/business-logic-policy.md`

---

*Backfilled to align with Tier A/Tier B outcomes and current business logic policy.*
