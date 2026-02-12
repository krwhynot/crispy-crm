# Business Logic Policy (Audit Source of Truth)

## Status
- Owner: Crispy-CRM product owner
- Last owner review: 2026-02-10 (Q1-Q12 confirmation set approved)
- Priority rule: full business-logic review is equal priority to database/schema changes
- Freshness rule: this policy must be owner-reviewed in the current calendar month
- Ambiguity rule: if logic is unclear, STOP and request immediate owner clarification
- Tier D execution rule: removal can run immediately when owner approval is explicit and preflight dependency/data checks pass
- Tier D timing scope: no waiting window is required; execution timing is owner-driven
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
| 17 | Legacy object with no confirmed use is removal-eligible | TRUE | Immediate removal allowed with explicit owner approval + preflight safety checks |
| 18 | If logic is unclear, keep for now | FALSE | Replaced by immediate-clarification rule |
| 24 | Closing an opportunity as "won" should automatically close all open tasks tied to it | FALSE | Keep follow-up tasks open; add note that attached opportunity is closed |

## Additional Owner Directives
- Timeline scope directive: timeline must include tasks plus any owner-connected action (opportunity changes, notes, and other relevant lifecycle events).
- Reporting directive: principal reporting should focus on tasks, especially completed tasks.

## Owner Confirmation Set (Q1-Q12, Approved)

| Q | Statement | Approved | Notes |
|---|---|---|---|
| Q1 | Timeline should include every owner-connected action (tasks, notes, opportunity updates, activities) | TRUE | Extends timeline scope directive |
| Q2 | Completed tasks should remain visible in timeline/history indefinitely | TRUE | Reinforces ID 6 |
| Q3 | Closing opportunity should NOT auto-close follow-up tasks | TRUE | Keep follow-up open; include closed-opportunity context note |
| Q4 | Principal reporting should prioritize completed tasks | TRUE | Reinforces reporting directive |
| Q5 | Notes should appear on timeline immediately after save | TRUE | User trust and activity completeness |
| Q6 | Soft-deleted records should stay hidden across lists/timeline/reports | TRUE | Reinforces ID 13 |
| Q7 | Tasks without an assigned owner should be blocked | TRUE | Prevent orphaned work |
| Q8 | Tasks without due date are allowed | TRUE | Due date is optional |
| Q9 | Duplicate detection should warn, not hard-block save | TRUE | Beta-safe workflow |
| Q10 | Email digest behavior is excluded from MVP success criteria | TRUE | Matches ID 11 = FALSE |
| Q11 | In-app notifications are excluded from MVP success criteria | TRUE | Matches ID 12 = FALSE |
| Q12 | Unresolved business-logic ambiguity blocks implementation until owner decision | TRUE | Reinforces ambiguity rule |

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
| 2026-02-10 | Owner selected a temporary waiting-window model for Tier D removals (later superseded same day) | Owner decision |
| 2026-02-10 | Added approved Q1-Q12 confirmation set (timeline completeness, task ownership, due-date optionality, duplicate warn-only, MVP exclusions, ambiguity stop rule) | Owner approval |
| 2026-02-10 | Tier D gate removed: no waiting window; owner-approved immediate execution with preflight safety checks | Owner override |
