# Phase 3 Report: Decisions And Remediation Plan

**Status:** COMPLETE
**Date:** 2026-02-10
**Auditor:** Claude Opus 4.6
**Overall Confidence:** 91% [Confidence: 91%]
**To Increase:** Verify M6 local migration gap with `supabase db diff`; confirm campaign RPC signature for M9 fix.

**Locked Inputs (from Phase 2 owner decisions):**
- Q1-P2 = A: Add `last_activity_date` computed column to `opportunities_summary`
- Q2-P2 = A: Align activity counts to one weekly window + one timezone rule with server-side counting
- Q3-P2 = A: Add explicit `Tasks` bucket/column in Weekly Activity
- Guardrail G1: Never silently default KPI values to `0` on query failure; show explicit error/unknown state

---

## 1) Carried Forward Mismatch List

All FAIL and UX_FAIL items from Phase 2 carried forward:

| # | Metric(s) | Phase 2 Status | Severity | Carried Forward |
|---|-----------|---------------|----------|-----------------|
| M1 | D-KPI-1 vs R-OV-1 (definition divergence) | LATENT FAIL | P1 | YES |
| M2 | D-KPI-3 vs R-OV-2 (scope + timezone) | FAIL | P1 | YES |
| M3 | D-KPI-3 label (scope confusion UX) | UX_FAIL | P1 | YES |
| M4 | D-PERF-2 (updated_at proxy for Deals Moved) | FAIL | P1 | YES |
| M5 | D-KPI-4 vs R-OV-4 (silent query error) | FAIL | **P0** | YES |
| M6 | D-PIP-6 (missing completed column) | FAIL | P1 | YES |
| M7 | R-WA task classification (tasks as notes) | FAIL | P2 | YES |
| M8 | Report 1000-row cap (latent) | LATENT FAIL | P2 | YES |
| M9 | R-CA Campaign error state | FAIL | P2 | YES |
| M10 | D-TSK null due_date default | PASS_WITH_NOTE | P3 | NO (accepted) |

**M10 disposition:** Classified ACCEPT_AS_DESIGNED per reporting-audit-policy.md. The `parseDateSafely(null) ?? new Date()` behavior is intentional defensive coding. The task correctly appears in a column (Today). P3 severity with no metric misinterpretation risk. No action required.

**Tolerance verification:**
- M2 delta=5 → exceeds tolerance (core integer KPI count, exact match required) → FAIL confirmed
- M5 delta=4 → exceeds tolerance (core integer KPI count) → FAIL confirmed
- All other FAIL items are exact-match violations or structural defects

---

## 2) Decision Table

### M5: D-KPI-4 Silent Stale Deals Error [P0]

| Field | Value |
|-------|-------|
| **Primary fix layer** | DB (view) + UI (error handling) |
| **Decision** | **FIX_NOW** |
| **Rationale** | `last_activity_date` column missing from `opportunities_summary` causes PostgREST 42703 error. `Promise.allSettled` masks error → KPI displays 0 when actual count is 4. Violates G1 guardrail. Root-cause fix per Q1-P2 = A. |
| **User/business impact if wrong** | Reps skip follow-up on all stale deals. Manager sees "0 stale" on dashboard, trusts it, while Reports shows 4. Core workflow failure. |
| **Confidence** | 99% — Column absence confirmed via PostgREST, error code 42703 captured live. |
| **Evidence** | Phase 2 H4, S0 evidence table D-KPI-4 row |
| **UX area** | Area 4 (empty/loading/error state) |
| **Misleads metric interpretation** | YES — displays 0 instead of 4, 100% undercount |
| **Change class** | MINOR_UX_CHANGE (error state display) + DB migration (new computed column) |

### M4: D-PERF-2 Deals Moved Proxy [P1]

| Field | Value |
|-------|-------|
| **Primary fix layer** | Provider logic |
| **Decision** | **FIX_NOW** |
| **Rationale** | `useMyPerformance.ts` queries `updated_at >= weekStart` as proxy for stage changes. Any field edit triggers count. Phase 1 Decision Q1-A mandates switching to `opportunity_stage_changes` view. |
| **User/business impact if wrong** | "Deals Moved" number inflated — reps get false confidence, managers make wrong performance assessments. Bonus/commission risk. |
| **Confidence** | 95% — Live evidence: D-PERF-2=2 (updated_at) vs 4 stage changes (all initial creates). |
| **Evidence** | Phase 2 H3, S0 evidence table D-PERF-2 row |
| **Change class** | N/A (data logic, not UX) |

### M2: D-KPI-3 vs R-OV-2 Activity Count Divergence [P1]

| Field | Value |
|-------|-------|
| **Primary fix layer** | Shared/multi-layer (provider + UI) |
| **Decision** | **FIX_NOW** |
| **Rationale** | Dashboard uses EST-adjusted ISO week (500), Reports uses 30-day total (505). Per Q2-P2 = A, both must align to one canonical weekly window with server-side counting and a single business timezone. |
| **User/business impact if wrong** | Manager sees 500 on dashboard, 505 in reports. Erodes trust in reporting system. |
| **Confidence** | 92% — Timezone offset proven (500 EST vs 501 UTC). Scope difference confirmed (505 = all activities). |
| **Evidence** | Phase 2 H2, activity date distribution table |
| **Change class** | N/A (data logic) |

### M3: D-KPI-3 Label Scope Confusion [P1]

| Field | Value |
|-------|-------|
| **Primary fix layer** | UI |
| **Decision** | **FIX_NOW** |
| **Rationale** | "Activities This Week"=500 (team) vs "Activities"=3 (personal) use same label family with no scope indicator. Per Q2-P2 = A, rename dashboard KPI to "Team Activities This Week" and performance metric to "My Activities This Week". |
| **User/business impact if wrong** | Users compare 500 vs 3 and question data accuracy. |
| **Confidence** | 95% |
| **Evidence** | Phase 2 UX2, S0 evidence |
| **UX area** | Area 2 (UX flow — label clarity) |
| **Misleads metric interpretation** | YES — conflates team total with personal count |
| **Change class** | **MINOR_UX_CHANGE** |

### M1: D-KPI-1 vs R-OV-1 Definition Divergence [P1, Latent]

| Field | Value |
|-------|-------|
| **Primary fix layer** | UI (filter alignment) |
| **Decision** | **FIX_NOW** |
| **Rationale** | Dashboard KPI filters `stage@not_in: ["closed_won","closed_lost"]`; Reports Overview does not filter by stage. Both say "Total/Open Opportunities" but will diverge when closed opps exist. Must align definition. |
| **User/business impact if wrong** | Dashboard and Reports show different opp counts → loss of trust. |
| **Confidence** | 95% — Both query `opportunities_summary` but with different filters. Latent because no closed opps exist yet. |
| **Evidence** | Phase 2 M1 row, H1 |
| **Change class** | MINOR_UX_CHANGE (label clarification or filter alignment) |

### M6: D-PIP-6 Missing Completed Column [P1]

| Field | Value |
|-------|-------|
| **Primary fix layer** | DB (view) |
| **Decision** | **FIX_NOW** |
| **Rationale** | `principal_pipeline_summary` view in local DB lacks `completed_tasks_30d` column. Cloud DB has it (all zeros). UI shows '-'. Migration gap between cloud and local. |
| **User/business impact if wrong** | Pipeline table shows no completion data. Managers cannot track task throughput per principal. |
| **Confidence** | 98% — Column verified absent from local view via PostgREST. |
| **Evidence** | Phase 2 H5, S0 D-PIP-6 row |
| **Change class** | N/A (DB migration) |

### M7: R-WA Task Classification [P2]

| Field | Value |
|-------|-------|
| **Primary fix layer** | UI logic |
| **Decision** | **FIX_NOW** |
| **Rationale** | Per Q3-P2 = A, add a dedicated Tasks column. Current code: `if type===call... else if email... else if meeting... else → notes++`. Tasks (activity_type=task) fall into else → notes. |
| **User/business impact if wrong** | Task activity miscounted as notes, misleading activity breakdown. |
| **Confidence** | 92% — Live evidence: 6 task records in else→notes bucket. |
| **Evidence** | Phase 2 H6, M7 row |
| **UX area** | Area 2 (UX flow — data categorization) |
| **Misleads metric interpretation** | YES — tasks counted as notes inflates notes, hides task effort |
| **Change class** | **MINOR_UX_CHANGE** |

### M8: Report 1000-Row Cap Warning [P2, Latent]

| Field | Value |
|-------|-------|
| **Primary fix layer** | UI + Provider |
| **Decision** | **FIX_NOW** |
| **Rationale** | No user-visible warning when data is truncated at 1000 rows. Current dataset (505) is under limit but approaching. Weekly Activity alone has 501 records in seed data. |
| **User/business impact if wrong** | Reports silently truncate. Manager sees incomplete data, makes wrong decisions. |
| **Confidence** | 90% — 505/1000 = 50.5% of cap used in seed data alone. |
| **Evidence** | Phase 2 UX6, M8 row |
| **UX area** | Area 4 (empty/loading/error state) |
| **Misleads metric interpretation** | YES — truncated data shows lower totals without warning |
| **Change class** | **MINOR_UX_CHANGE** |

### M9: R-CA Campaign Error State [P2]

| Field | Value |
|-------|-------|
| **Primary fix layer** | UI (error handling) |
| **Decision** | **FIX_NOW** |
| **Rationale** | Campaign tab shows "Failed to load campaign activities" error when no campaign is selected. Should show instructional empty state instead. |
| **User/business impact if wrong** | Users see red error text, perceive system broken. |
| **Confidence** | 88% — Error captured in screenshot. Need to confirm if RPC fails or if UI fails to handle null campaign gracefully. |
| **Evidence** | Phase 2 UX8, M9 row |
| **UX area** | Area 4 (empty/loading/error state) |
| **Misleads metric interpretation** | NO — error is clear, not a false number |
| **Change class** | **MINOR_UX_CHANGE** |

---

## 3) Tiered Remediation Plan (A/B/C/D)

### Tier A: Safety and Observability

| Action ID | Description | Target Files/Objects | Dependencies | Validation | Rollback | Metric Impact | UX Impact |
|-----------|-------------|---------------------|-------------|------------|----------|---------------|-----------|
| **A1** | Add error/unknown state for KPI query failures (G1 guardrail) | `src/atomic-crm/dashboard/useKPIMetrics.ts` | None | 1. Trigger error by querying non-existent column. 2. Verify UI shows error state, NOT "0". | Revert `useKPIMetrics.ts` to prior version | D-KPI-4 shows error indicator instead of false "0" | Error badge/icon on failed KPIs |
| **A2** | Add structured logging for all reporting query failures | `src/atomic-crm/dashboard/useKPIMetrics.ts`, `src/atomic-crm/dashboard/useMyPerformance.ts`, `src/atomic-crm/reports/tabs/OverviewTab.tsx` | A1 (error states must exist before logging) | 1. Trigger query error. 2. Check logger output for structured error context (resource, query, error code). | Remove logger.error calls | None (observability) | None |

### Tier B: Low-Risk Fixes

| Action ID | Description | Target Files/Objects | Dependencies | Validation | Rollback | Metric Impact | UX Impact |
|-----------|-------------|---------------------|-------------|------------|----------|---------------|-----------|
| **B1** | Rename D-KPI-3 label to "Team Activities This Week" | `src/atomic-crm/dashboard/useKPIMetrics.ts` or KPI card component | None | 1. Visual check: card title reads "Team Activities This Week". 2. No logic change. | Revert label string | M3 resolved | Label text change only |
| **B2** | Rename D-PERF-1 label to "My Activities This Week" | `src/atomic-crm/dashboard/useMyPerformance.ts` or performance card component | B1 (consistent naming) | 1. Visual check: performance card reads "My Activities This Week". | Revert label string | M3 resolved (companion) | Label text change only |
| **B3** | Align D-KPI-1 and R-OV-1 definitions | `src/atomic-crm/dashboard/useKPIMetrics.ts` OR `src/atomic-crm/reports/tabs/OverviewTab.tsx` | None | 1. Add closed opps to seed data. 2. Verify D-KPI-1 = R-OV-1 or labels clarify difference. | Revert filter logic | M1 resolved | Label or filter change |
| **B4** | Add "Tasks" column to Weekly Activity breakdown | `src/atomic-crm/reports/WeeklyActivitySummary.tsx` | None | 1. With task data: verify tasks appear in "Tasks" column, NOT in "Notes". 2. CSV export includes Tasks column. | Revert grouping logic | M7 resolved | New column in table |
| **B5** | Add truncation warning banner for 1000-row cap | Report list components (OverviewTab, WeeklyActivitySummary) | None | 1. Mock data >1000 rows. 2. Verify warning banner appears. | Remove warning component | M8 resolved | Warning banner when data truncated |
| **B6** | Replace Campaign error with instructional empty state | `src/atomic-crm/reports/tabs/CampaignTab.tsx` or equivalent | None | 1. Navigate to Campaign tab with no campaign selected. 2. Verify instructional message (not red error). | Revert to error display | M9 resolved | Empty state message |

### Tier C: Medium-Risk Fixes

| Action ID | Description | Target Files/Objects | Dependencies | Validation | Rollback | Metric Impact | UX Impact |
|-----------|-------------|---------------------|-------------|------------|----------|---------------|-----------|
| **C1** | Switch D-PERF-2 "Deals Moved" from updated_at proxy to `opportunity_stage_changes` view | `src/atomic-crm/dashboard/useMyPerformance.ts` | M5 must be resolved first (view column dependencies) | 1. Create an opportunity and change its stage. 2. Verify D-PERF-2 increments by 1 (not by updated_at touches). 3. Verify no double-counting initial creates. | Revert `useMyPerformance.ts` query to updated_at | M4 resolved — accurate stage change count | None |
| **C2** | Align activity counts to single canonical ISO week + server-side counting | `src/atomic-crm/dashboard/useKPIMetrics.ts`, `src/atomic-crm/reports/tabs/OverviewTab.tsx`, `src/atomic-crm/reports/WeeklyActivitySummary.tsx` | A1 (error states), B1/B2 (labels) | 1. Verify D-KPI-3 = R-WA total for same week. 2. Verify R-OV-2 "Activities This Week" shows weekly count, not 30-day total. 3. Check timezone alignment (server-side date boundaries). | Revert date logic in all three files | M2 resolved — consistent activity counts across surfaces | R-OV-2 value changes from 505 to ~500 |

### Tier D: High-Risk Fixes (DB View Changes)

| Action ID | Description | Target Files/Objects | Dependencies | Validation | Rollback | Metric Impact | UX Impact |
|-----------|-------------|---------------------|-------------|------------|----------|---------------|-----------|
| **D1** | Add `last_activity_date` computed column to `opportunities_summary` view | `supabase/migrations/YYYYMMDD_add_last_activity_date.sql`, `opportunities_summary` view definition | None (foundational) | 1. Run migration. 2. Query `SELECT last_activity_date FROM opportunities_summary LIMIT 5`. 3. Verify non-null dates where activities exist. 4. Verify D-KPI-4 returns actual stale count (not 0). | `DROP VIEW opportunities_summary; CREATE VIEW ...` with old definition | M5 resolved — D-KPI-4 shows accurate stale deal count | D-KPI-4 changes from 0 to actual stale count |
| **D2** | Add `completed_tasks_30d` and `total_tasks_30d` columns to `principal_pipeline_summary` view (local) | `supabase/migrations/YYYYMMDD_fix_pipeline_completed.sql`, `principal_pipeline_summary` view definition | D1 (run migrations in order) | 1. Run migration. 2. Query `SELECT completed_tasks_30d FROM principal_pipeline_summary`. 3. Verify numeric values (not null). 4. UI shows numbers instead of '-'. | Recreate view without new columns | M6 resolved — Pipeline shows completion data | '-' replaced with numeric values |

---

## 4) Validation Checklist Per Action

### D1 (Critical Path — M5 Fix)
- [ ] Migration SQL reviewed for correct JOIN to activities table
- [ ] `last_activity_date` computed as `MAX(a.date)` from activities joined to opportunities
- [ ] Soft-delete filter: `WHERE a.deleted_at IS NULL` in subquery
- [ ] Run `supabase db reset` locally
- [ ] Query: `SELECT id, last_activity_date FROM opportunities_summary` → non-null dates
- [ ] D-KPI-4 on dashboard shows actual stale count (expected: 4 with seed data)
- [ ] R-OV-4 on reports still shows 4 (no regression)
- [ ] D-KPI-4 = R-OV-4 (surfaces aligned)

### A1 (G1 Guardrail)
- [ ] `Promise.allSettled` rejection handler shows error state, not 0
- [ ] KPI card renders error indicator (icon/badge/text)
- [ ] Intentionally break a query → verify error indicator appears
- [ ] No `console.error` in production code (use logger)

### C1 (Deals Moved)
- [ ] Query targets `opportunity_stage_changes` table/view
- [ ] Filters by `sales_id` or `opportunity_owner_id` for current user
- [ ] Filters by ISO week date range
- [ ] Excludes initial creates (`from_stage IS NOT NULL`)
- [ ] Returns count, not list

### C2 (Activity Count Alignment)
- [ ] Single date boundary function used by all three surfaces
- [ ] Server-side `Prefer: count=exact` with date range filter
- [ ] No client-side `toISOString()` date boundary construction
- [ ] D-KPI-3 = R-OV-2 = R-WA total for same week window

### B4 (Tasks Column)
- [ ] `activity_type === 'task'` checked BEFORE type-based bucket sort
- [ ] New "Tasks" column in Weekly Activity table
- [ ] CSV export includes "Tasks" column
- [ ] Notes count decreases by task count (regression check)

---

## 5) Rollback Notes

| Action | Rollback Strategy | Blast Radius | Rollback Time |
|--------|-------------------|-------------|---------------|
| D1 | Recreate `opportunities_summary` view without `last_activity_date` column. Re-deploy. D-KPI-4 reverts to 0 (broken but same as before). | High — affects D-KPI-4, R-OV-4, staleness calculations | ~10 min (migration + deploy) |
| D2 | Recreate `principal_pipeline_summary` view without task columns. Pipeline reverts to '-'. | Medium — pipeline table only | ~10 min |
| A1 | Revert `useKPIMetrics.ts` error handling to `Promise.allSettled` silent default. D-KPI-4 shows 0 again. | Low — only affects KPI error display | ~2 min (file revert) |
| C1 | Revert `useMyPerformance.ts` to `updated_at` proxy query. D-PERF-2 shows inflated count. | Low — performance card only | ~2 min |
| C2 | Revert date boundary logic in 3 files. Counts diverge again. | Medium — 3 files affected | ~5 min |
| B1-B6 | Revert individual label/component changes. | Minimal — isolated UI changes | ~1 min each |

---

## 6) Priority Queue (Execution Order)

Based on owner-approved order, optimized for dependency resolution:

| Order | Action(s) | Mismatch | Tier | Rationale |
|-------|-----------|----------|------|-----------|
| **1** | D1 → A1 → A2 | M5 (P0) | D → A | D1 adds missing column (root cause). A1 adds error state guardrail (G1). A2 adds logging. Must be sequential: D1 first enables the fix, A1 prevents future silent failures. |
| **2** | C1 | M4 (P1) | C | Switches Deals Moved to stage_changes view. Independent of M5 once D1 migration is stable. |
| **3** | B1 + B2 → C2 | M2 + M3 (P1) | B → C | B1/B2 rename labels (low-risk). C2 aligns date logic (depends on labels being correct). |
| **4** | D2 | M6 (P1) | D | Adds missing pipeline columns. Independent DB migration. |
| **5** | B4 | M7 (P2) | B | Adds Tasks column to Weekly Activity. Independent. |
| **6** | B5 + B6 | M8 + M9 (P2) | B | B5 adds cap warning. B6 fixes campaign empty state. Both are independent low-risk UI changes. |
| **7** | B3 | M1 (P1, latent) | B | Align D-KPI-1/R-OV-1 definitions. Low urgency (latent, no visible divergence with current data). |

**Dependency graph:**
```
D1 ──→ A1 ──→ A2
            └──→ C1 (can start after D1)
B1 + B2 ──→ C2
D2 (independent)
B3, B4, B5, B6 (independent)
```

**Parallelization opportunities:**
- After D1 completes: A1, C1, and D2 can proceed in parallel
- B1+B2+B3+B4+B5+B6 can all proceed in parallel (no DB dependencies)

---

## 7) UI/UX Guardrails For Implementation

### G1: No Silent Zero on Query Failure
- **Applies to:** A1, D1, and all future KPI queries
- **Rule:** If any `useKPIMetrics` query returns `status:'rejected'` from `Promise.allSettled`, the corresponding KPI card MUST display an error indicator (e.g., dash "—" with tooltip "Unable to load"), NOT numeric `0`.
- **Implementation pattern:**
  ```
  if (result.status === 'rejected') → render <ErrorIndicator />
  if (result.status === 'fulfilled' && result.value === 0) → render "0" (valid zero)
  ```
- **Test:** Intentionally break a query. Verify error indicator appears.

### G2: Consistent Label Scoping
- **Applies to:** B1, B2, C2
- **Rule:** Every numeric KPI must have an explicit scope prefix: "Team" (all users) or "My" (current user). Every time-scoped metric must show the time window in the label or subtitle.
- **Pattern:** "Team Activities This Week" / "My Activities This Week"

### G3: Data Completeness Warning
- **Applies to:** B5
- **Rule:** When a report query returns exactly 1000 rows, display a warning banner: "Showing first 1,000 results. Export CSV for complete data."
- **Position:** Above the data table, below filters.

### G4: Empty State Over Error State
- **Applies to:** B6
- **Rule:** When a report tab has no data due to missing filter selection (not a system error), show an instructional empty state: "Select a campaign to view activity breakdown." Do NOT show a red error message.

### G5: Task/Activity Separation
- **Applies to:** B4
- **Rule:** The Weekly Activity grouping logic must check `activity_type` BEFORE `type` to prevent task records from falling into the catch-all `else` bucket.
- **Order:** `if activity_type === 'task' → tasks++` THEN `if type === 'call' → calls++` etc.

---

## 8) Owner Permission Checkpoints (Major UI/UX Changes)

**Assessment:** All UX changes in this plan are classified as **MINOR_UX_CHANGE**:

| Action | Change Class | Justification | Owner Permission |
|--------|-------------|---------------|-----------------|
| A1 (error indicator on KPI) | MINOR_UX_CHANGE | Adds error badge, no layout change | Not required |
| B1/B2 (label rename) | MINOR_UX_CHANGE | Text-only change, no layout or interaction change | Not required |
| B3 (definition alignment) | MINOR_UX_CHANGE | Filter or label change, same layout | Not required |
| B4 (Tasks column) | MINOR_UX_CHANGE | Adds one column to existing table, familiar pattern | Not required |
| B5 (cap warning) | MINOR_UX_CHANGE | Adds warning banner above existing content | Not required |
| B6 (empty state) | MINOR_UX_CHANGE | Replaces error text with instructional text | Not required |
| C1 (query change) | N/A | No UX change, data logic only | N/A |
| C2 (count alignment) | N/A | Numbers change to be correct, no layout change | N/A |
| D1 (DB migration) | N/A | No UX change | N/A |
| D2 (DB migration) | N/A | No UX change | N/A |

**No MAJOR_UX_CHANGE identified.** All changes are either data-logic fixes or minor UI text/indicator updates. No broad report UX redesign or multi-surface interaction changes proposed.

**Note:** If during implementation any action scope expands beyond the described change (e.g., redesigning KPI card layout, adding new dashboard sections, restructuring report tabs), it must be re-evaluated as MAJOR_UX_CHANGE and tagged OWNER_APPROVAL_REQUIRED before proceeding.

---

## 9) Project Rules And Skills Alignment Register

### Action D1: Add `last_activity_date` to `opportunities_summary`

| Field | Value |
|-------|-------|
| **Applicable Rules** | DATABASE_LAYER.md (View Duality, Soft Delete Enforcement), PROVIDER_RULES.md (View/Table Duality), DOMAIN_INTEGRITY.md (Schema Rules) |
| **Skills Considered** | supabase-postgres-best-practices, soft-delete-rls-audit, crispy-data-provider, data-integrity-guards |
| **Primary Skill** | supabase-postgres-best-practices |
| **Required Skill** | YES (DB view change) |
| **Skill Applied** | YES — view must filter `deleted_at IS NULL` in activity join; computed column via LEFT JOIN + aggregate |
| **Classification** | **COMPLIANT** |
| **Notes** | View must preserve existing RLS grant on `opportunities_summary`. New column uses LEFT JOIN to activities with soft-delete filter. Follow supabase-postgres-best-practices for index considerations on join columns. |

### Action D2: Add completed columns to `principal_pipeline_summary`

| Field | Value |
|-------|-------|
| **Applicable Rules** | DATABASE_LAYER.md (View Duality), PROVIDER_RULES.md (View/Table Duality) |
| **Skills Considered** | supabase-postgres-best-practices, soft-delete-rls-audit, crispy-data-provider |
| **Primary Skill** | supabase-postgres-best-practices |
| **Required Skill** | YES (DB view change) |
| **Skill Applied** | YES — view must join to tasks/activities with soft-delete filter, count completed tasks in 30-day window |
| **Classification** | **COMPLIANT** |
| **Notes** | Must align with cloud DB definition. Verify migration brings local in sync with cloud schema. |

### Action A1: Error state for KPI query failures (G1)

| Field | Value |
|-------|-------|
| **Applicable Rules** | CODE_QUALITY.md (no console.error), PROVIDER_RULES.md (Error Handling), STALE_STATE_STRATEGY.md (query patterns) |
| **Skills Considered** | enforcing-principles, data-integrity-guards, ui-ux-design-principles, cache-invalidation-audit |
| **Primary Skill** | enforcing-principles |
| **Required Skill** | YES (error handling pattern) |
| **Skill Applied** | YES — fail-fast principle: surface error, don't mask it. Use logger, not console.error. |
| **Classification** | **COMPLIANT** |
| **Notes** | Must use structured logger per CODE_QUALITY.md. Error UI component should follow three-tier architecture (Tier 2 wrapper if reusable). |

### Action A2: Structured logging for reporting queries

| Field | Value |
|-------|-------|
| **Applicable Rules** | CODE_QUALITY.md (Production Noise Prevention — use logger, not console), PROVIDER_RULES.md (Error Handling) |
| **Skills Considered** | enforcing-principles, data-integrity-guards |
| **Primary Skill** | enforcing-principles |
| **Required Skill** | YES |
| **Skill Applied** | YES — logger.error with context: resource, query, error code |
| **Classification** | **COMPLIANT** |
| **Notes** | Must use `src/lib/logger.ts` structured logging, not console.error. |

### Action B1: Rename D-KPI-3 label

| Field | Value |
|-------|-------|
| **Applicable Rules** | UI_STANDARDS.md (semantic colors, no hardcoded text), MODULE_CHECKLIST.md (styling rules) |
| **Skills Considered** | ui-ux-design-principles, three-tier-architecture-audit |
| **Primary Skill** | ui-ux-design-principles |
| **Required Skill** | NO (simple text change) |
| **Skill Applied** | N/A |
| **Classification** | **COMPLIANT** |
| **Notes** | Ensure label uses i18n pattern if one exists. Otherwise plain string is acceptable. |

### Action B2: Rename D-PERF-1 label

| Field | Value |
|-------|-------|
| **Applicable Rules** | UI_STANDARDS.md, MODULE_CHECKLIST.md |
| **Skills Considered** | ui-ux-design-principles |
| **Primary Skill** | ui-ux-design-principles |
| **Required Skill** | NO |
| **Skill Applied** | N/A |
| **Classification** | **COMPLIANT** |

### Action B3: Align D-KPI-1 / R-OV-1 definitions

| Field | Value |
|-------|-------|
| **Applicable Rules** | PROVIDER_RULES.md (View/Table Duality), DOMAIN_INTEGRITY.md (Schema Rules) |
| **Skills Considered** | crispy-data-provider, enforcing-principles |
| **Primary Skill** | crispy-data-provider |
| **Required Skill** | NO (filter logic change, not handler change) |
| **Skill Applied** | N/A |
| **Classification** | **COMPLIANT** |
| **Notes** | Decision: either add stage filter to R-OV-1 or remove from D-KPI-1 and clarify labels. Choose the option that matches business intent (are "Open Opps" or "Total Opps"?). |

### Action B4: Add Tasks column to Weekly Activity

| Field | Value |
|-------|-------|
| **Applicable Rules** | UI_STANDARDS.md (component tiers), MODULE_CHECKLIST.md (semantic colors), DOMAIN_INTEGRITY.md (tasks stored as activities with activity_type=task) |
| **Skills Considered** | ui-ux-design-principles, three-tier-architecture-audit, enforcing-principles |
| **Primary Skill** | ui-ux-design-principles |
| **Required Skill** | NO (UI logic change, not data layer) |
| **Skill Applied** | N/A |
| **Classification** | **COMPLIANT** |
| **Notes** | Must respect Known Domain Constraint #1 from audit policy: "Tasks are stored in the `activities` domain model (`activity_type = 'task'`)". Check `activity_type` before `type` field. |

### Action B5: Add truncation warning banner

| Field | Value |
|-------|-------|
| **Applicable Rules** | UI_STANDARDS.md (Tier 2 wrappers, accessibility), CODE_QUALITY.md (accessibility — `role="alert"`) |
| **Skills Considered** | ui-ux-design-principles, three-tier-architecture-audit |
| **Primary Skill** | ui-ux-design-principles |
| **Required Skill** | NO |
| **Skill Applied** | N/A |
| **Classification** | **COMPLIANT** |
| **Notes** | Warning banner should use `role="status"` or `role="alert"` for screen readers. Use semantic color `text-warning` or `bg-warning`. Consider Tier 2 reusable `DataLimitWarning` component if pattern appears on multiple report tabs. |

### Action B6: Campaign empty state

| Field | Value |
|-------|-------|
| **Applicable Rules** | UI_STANDARDS.md (error/empty state patterns), CODE_QUALITY.md (accessibility) |
| **Skills Considered** | ui-ux-design-principles, enforcing-principles |
| **Primary Skill** | ui-ux-design-principles |
| **Required Skill** | NO |
| **Skill Applied** | N/A |
| **Classification** | **COMPLIANT** |
| **Notes** | Replace red error text with instructional empty state component. Use semantic colors. |

### Action C1: Switch D-PERF-2 to stage_changes view

| Field | Value |
|-------|-------|
| **Applicable Rules** | PROVIDER_RULES.md (View/Table Duality — reads from views), DATABASE_LAYER.md (View Duality), STALE_STATE_STRATEGY.md (query key patterns) |
| **Skills Considered** | crispy-data-provider, supabase-postgres-best-practices, cache-invalidation-audit |
| **Primary Skill** | crispy-data-provider |
| **Required Skill** | YES (query references DB view) |
| **Skill Applied** | YES — query targets `opportunity_stage_changes` view with proper filters. Must use query key factory pattern per STALE_STATE_STRATEGY.md. |
| **Supabase Skill** | YES — referenced for view query optimization |
| **Classification** | **COMPLIANT** |
| **Notes** | Must invalidate performance query keys when stage changes. Follow cache-invalidation-audit Check 3 (cross-resource invalidation). |

### Action C2: Align activity count date boundaries

| Field | Value |
|-------|-------|
| **Applicable Rules** | PROVIDER_RULES.md (server-side counting), STALE_STATE_STRATEGY.md (staleTime patterns), CODE_QUALITY.md (no console.log) |
| **Skills Considered** | crispy-data-provider, cache-invalidation-audit, enforcing-principles |
| **Primary Skill** | crispy-data-provider |
| **Required Skill** | YES (multi-surface data logic) |
| **Skill Applied** | YES — single canonical date boundary function, server-side counting via `Prefer: count=exact` |
| **Classification** | **COMPLIANT** |
| **Notes** | All three surfaces (D-KPI-3, R-OV-2, R-WA) must use the same date boundary utility. Create shared function in `src/atomic-crm/utils/` or `src/lib/`. |

### Alignment Summary

| Classification | Count | Actions |
|---------------|-------|---------|
| **COMPLIANT** | 12 | D1, D2, A1, A2, B1, B2, B3, B4, B5, B6, C1, C2 |
| **RULE_CONFLICT** | 0 | — |
| **SKILL_GAP** | 0 | — |
| **RULE_AND_SKILL_GAP** | 0 | — |

All actions are COMPLIANT with project rules and applicable skills. No blockers for final GO from a rules/skills perspective.

---

## 10) Multiple-Choice Questions

**[Q1-P3]** Action C2 requires a single canonical date boundary function shared across Dashboard KPIs, Reports Overview, and Weekly Activity. Where should this utility live?

A) `src/atomic-crm/utils/weekBoundary.ts` (Recommended) — Co-located with business domain utilities. Exports `getISOWeekRange(timezone: string): { start: Date, end: Date }`. All three surfaces import from here. Single source of truth.
B) `src/lib/dateUtils.ts` — Generic library location. Same function but more general-purpose location. Risk: may accumulate unrelated date helpers.
C) Server-side RPC `get_week_boundaries(tz text)` — Compute in Postgres, eliminate all client-side date math. Most robust but requires an RPC call before every count query.

**[Q2-P3]** Action B3 requires aligning D-KPI-1 and R-OV-1 definitions. The dashboard uses "Open Opps" (excludes closed_won/closed_lost). Reports Overview shows all opportunities. Which alignment strategy?

A) Add stage filter to R-OV-1 to match Dashboard (Recommended) — Both surfaces show "Open Opportunities" with identical filter. Users see same number everywhere. Simple filter addition.
B) Remove stage filter from D-KPI-1 to match Reports — Dashboard shows "Total Opportunities" including closed. Changes Dashboard KPI meaning. May confuse users expecting "open" count.
C) Keep both definitions but add explicit labels — D-KPI-1 labeled "Open Opportunities", R-OV-1 labeled "Total Opportunities". Different numbers but clearly different metrics.

**[Q3-P3]** Action C1 switches D-PERF-2 from `updated_at` proxy to `opportunity_stage_changes` view. Should initial opportunity creation events (from_stage=NULL) count as a "deal moved"?

A) Exclude initial creates — filter `WHERE from_stage IS NOT NULL` (Recommended) — "Deals Moved" means stage progression, not creation. Cleaner semantic. Current seed data would show 0 (no real stage changes yet) which is accurate.
B) Include initial creates — count all stage_change rows — Every opportunity entering the pipeline counts as "moved." Higher numbers but includes non-progression events.
C) Separate metric — "Deals Created" + "Deals Progressed" — Two metrics instead of one. Most precise but adds dashboard complexity.

### Owner Decision Record (2026-02-11)

- Q1-P3: **A** — Place shared week-boundary utility in `src/atomic-crm/utils/weekBoundary.ts`. Dashboard, Reports Overview, and Weekly Activity all import from this single business-domain source.
- Q2-P3: **A** — Align R-OV-1 to Dashboard open-opportunity logic (exclude `closed_won`, `closed_lost`). Users see one consistent open-opps number across all surfaces.
- Q3-P3: **A** — Exclude initial creates (`from_stage IS NULL`) from "Deals Moved". Only real stage progressions count. Filter: `WHERE from_stage IS NOT NULL`.
