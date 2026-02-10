# Business Logic Policy (Audit Source of Truth)

## Status
- Owner: Crispy-CRM product owner
- Last owner review: 2026-02-10
- Priority rule: full business-logic review is equal priority to database/schema changes
- Freshness rule: this policy must be owner-reviewed in the current calendar month
- Ambiguity rule: if logic is unclear, STOP and request immediate owner clarification
- Removal eligibility rule: object is removal-eligible after 10 days with no confirmed business use, plus explicit owner signoff and dependency checks
- Tier D timing scope: the 10-day eligibility rule applies to both view drops and table drops unless an explicit owner exception is recorded
- Defaulting rule: if an item is not explicitly answered by owner, use the current recommended answer and mark it provisional

## Current Business Logic Decisions (Owner Approved)

| ID | Statement | Current | Notes |
|---|---|---|---|
| 1 | Organizations and contacts are core MVP and must fully work | TRUE | Core workflow |
| 2 | Opportunities are core MVP and must fully work | TRUE | Core workflow |
| 3 | Tasks are core MVP and must fully work | TRUE | Core workflow |
| 4 | Activities and tasks should appear in one unified timeline | TRUE | Timeline must include any owner-related action |
| 5 | Snoozed tasks should be hidden until snooze time | TRUE | Active behavior |
| 6 | Completed tasks should remain visible in history/timeline | TRUE | Reporting/history requirement |
| 7 | Notes (contact/opportunity/organization) are required for MVP | TRUE | Core support workflow |
| 8 | Product feature management is required for MVP | FALSE | Out of current MVP scope |
| 9 | Duplicate detection is required for MVP | TRUE | Keep capability |
| 10 | Dashboard trend snapshots are required for MVP | FALSE | Defer unless owner reclassifies |
| 11 | Email digest sending is required for MVP | FALSE | Out of MVP scope |
| 12 | In-app notifications are required for MVP | FALSE | Out of MVP scope unless owner reclassifies |
| 13 | Soft-deleted records should be hidden, not hard-deleted | TRUE | Data safety rule |
| 14 | Soft-delete on parent should also hide related notes | TRUE | Consistency rule |
| 15 | updated_at should auto-update on edits | TRUE | Data integrity rule |
| 16 | Admin-only actions must stay restricted | TRUE | Security rule |
| 17 | Legacy object with no confirmed use is removal-eligible | TRUE | 10-day window applies to both views and tables |
| 18 | If logic is unclear, keep for now | FALSE | Replaced by immediate-clarification rule |
| 24 | Closing an opportunity as "won" should automatically close all open tasks tied to it | FALSE | Keep follow-up tasks open; add note that attached opportunity is closed |

## Additional Owner Directives
- Timeline scope directive: timeline must include tasks plus any owner-connected action (opportunity changes, notes, and other relevant lifecycle events).
- Reporting directive: principal reporting should focus on tasks, especially completed tasks.

## How Audit Must Use This Policy
1. Every phase prompt must read this file before analysis or decisions.
2. Any conflict between observed behavior and this policy must be flagged as `BUSINESS_LOGIC_CONFLICT`.
3. No Tier D removal may proceed with unresolved `BUSINESS_LOGIC_CONFLICT`.
4. If policy is stale (not reviewed this month), Phase 4 cannot issue `GO`.

## Change Log
| Date | Change | Source |
|---|---|---|
| 2026-02-10 | Created policy and recorded current owner-confirmed truth table | Audit session |
| 2026-02-10 | Added owner decision: ID 24 = FALSE; follow-up tasks stay open and must note closed opportunity linkage | Owner Q&A |
| 2026-02-10 | Owner selected Option 1: use a single 10-day Tier D eligibility window for all objects (views + tables) | Owner decision |
