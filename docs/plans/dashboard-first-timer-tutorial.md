# First-Timer Tutorial for Principal Dashboard V3 — Implementation Plan (Detailed)

## Goals and Definition of Done
- First session (or help-triggered) coach-marks guide that orients a new user in <8 minutes; max 10 steps.
- User can: read KPIs, filter pipeline, open drill-down, move/complete a task, and log an activity (desktop) or open quick action + complete task (mobile).
- Tutorial can be skipped/replayed; persists completion state; never blocks core actions; respects reduced motion.
- Success metrics: ≥60% completion, <15% skip-at-start, ≥40% perform “log activity” OR “task move/complete” within session, <5% error rate on step anchoring.

## Scope and Assumptions
- Target: sales rep persona on Principal Dashboard V3 (`src/atomic-crm/dashboard/v3`).
- Surfaces: desktop + tablet; mobile variant uses quick action bar and task sheet.
- No backend writes required beyond telemetry (localStorage flag acceptable for v1).
- Non-goals v1: deep personalization, multi-role variants, backend persistence, translations.

## Entry, Exit, and State
- Trigger: first login to `/dashboard-v3` (or manual “Help > Replay tutorial”; optional `?tutorial=replay` override).
- Skip: persistent skip/complete flag; cooldown (e.g., 14 days) before re-show if dismissed early.
- Completion: mark when final step viewed OR key action performed (log activity OR move/complete task); store `lastActionStep`.
- Storage shape: localStorage key `principal-dashboard-v3-tutorial` with `{ status: "started"|"completed"|"skipped", lastStep: string, lastActionStep?: string, variant: "desktop"|"mobile", updatedAt: number }`; optional server flag later.
- Guard logic: if `status === "completed"` and `updatedAt < 30d`, do not auto-start unless replay; if `skipped` and <14d, do not re-show.

## Waypoints (Desktop)
1) **Welcome overlay** (`data-tutorial="header"`): “Learn your dashboard in 2 minutes” + “Skip” + “Start”.
2) **KPI Summary Row** (`data-tutorial="kpi-row"`): Copy: “Top health signals” + CTA “Tap a KPI to filter”; note color meaning for overdue/stale.
3) **Pipeline Table** (`data-tutorial="pipeline-table"`): Highlight search, sort, momentum filter; CTA “Try a search” or “Sort by momentum”; fallback copy if empty/loading.
4) **Drill-Down Sheet** (`data-tutorial="pipeline-row"` and sheet): “Click a principal to see deals”; point to stage/amount; CTA “Open details”.
5) **Tasks Kanban** (`data-tutorial="tasks-kanban"`): “Drag to reschedule” + overdue badge; CTA “Move a task”.
6) **My Performance** (`data-tutorial="my-performance"`): “Your week at a glance” + explain trend arrows.
7) **Team Activity Feed** (`data-tutorial="activity-feed"`): “See recent activity” + CTA “Open full list”.
8) **Log Activity FAB** (`data-tutorial="fab-log"`): “Log an activity fast” + mention draft save; CTA “Open log sheet”.
9) **Finish**: “You’re set” + “Replay” + link to dashboard usage guide.

## Waypoints (Mobile/Tablet Variants)
- Replace FAB with **Mobile Quick Action Bar** (`data-tutorial="quick-bar"`): coach-mark on bar; CTA “Log a Check-In”.
- Add **Task Completion Sheet** (`data-tutorial="task-sheet"`): open via quick bar action; highlight overdue badge.
- Same pipeline/KPI/tasks/feed steps but anchor to mobile layouts; ensure hotspots reposition for single-column stacking.

## UX/Technical Decisions
- Delivery: inline coach-marks + small stepper; backdrop with focus trap; ESC/Enter/Space support; respects prefers-reduced-motion (no bounce animations).
- Anchoring: add stable `data-tutorial` attrs; tooltip/coach aligns to anchor bounding box; auto-flip for viewport edges.
- Safety: if target missing/loading/error, auto-advance with toast “Step skipped—content still loading”; never blocks interaction.
- Re-entry: help menu item triggers `startTutorial({ replay: true })` and clears `lastStep`; query param override for QA.
- Layout: ensure overlay doesn’t obscure CTAs; for table rows, anchor to header region, not scroll body, to avoid virtualization issues.

## Engineering Tasks
1) **Scaffold tutorial system** in dashboard scope
   - Components: `TutorialController`, `TutorialStep`, `Hotspot`, `Stepper`, `OverlayPortal` under `src/atomic-crm/dashboard/v3/tutorial/`.
   - State: React context for current step + persistence adapter (localStorage now, pluggable later) + variant detection (mobile/desktop).
   - API: `startTutorial`, `skipTutorial`, `completeStep(id)`, `endTutorial(status)`, `resumeFromLast()`; expose hook `useTutorial()`.
2) **Add anchors to dashboard elements**
   - Add `data-tutorial` attrs to: header, `KPISummaryRow`, `PrincipalPipelineTable` wrapper, table rows (for drill), `TasksKanbanPanel` root, `MyPerformanceWidget`, `ActivityFeedPanel`, FAB button, mobile quick action bar, task completion sheet opener.
   - Provide utility `getAnchorRect(id)` to guard against null and scroll into view when needed.
3) **Copy and step config**
   - Create `steps.ts` with ordered steps (desktop + mobile variants), titles, body, action labels, target ids, and completion criteria (e.g., “anchor exists”, “action invoked”).
   - Include per-step CTA verbs and fallback copy for loading/empty/error states.
4) **Instrumentation**
   - Events: `tutorial_start`, `tutorial_step`, `tutorial_complete`, `tutorial_skip`, `tutorial_replay` with props { stepId, surface: "dashboard_v3", variant: "desktop"|"mobile", status }.
   - Conversions: `tutorial_action_log_activity`, `tutorial_action_task_move`, `tutorial_action_task_complete`, `tutorial_action_drill_down`.
   - Wire to existing telemetry util; add unit coverage for payload shape.
5) **Accessibility**
   - Focus trap in overlay; arrow-key/Tab navigation; aria-labels on tutorial UI; high-contrast outlines; reduced-motion friendly transitions; maintain focus return to prior element on close.
6) **Persistence and gating**
   - LocalStorage adapter; guard to not show if `completed` or `skipped` within cooldown; optional in-memory override for QA; handle parse errors gracefully.
7) **QA and tests**
   - Unit: step config validation; persistence adapter; controller state transitions; reduced-motion branch; anchor lookup.
   - E2E (Playwright): desktop happy path; mobile happy path; skip-at-start; resume from last step; missing-anchor fallback; reduced motion; completion via action (log activity or task move).

## Acceptance Criteria
- Tutorial appears only for first-timers (unless replayed) and can be dismissed without blocking dashboard use.
- Each waypoint highlights the correct element on desktop and mobile layouts; falls back gracefully when data is loading/empty/error.
- Completion tracked when final step viewed or key action taken; skip state respected on reload.
- Accessibility: keyboard/screen-reader operable; focus not lost; meets WCAG AA contrast; honors prefers-reduced-motion.
- Telemetry events fire with step metadata; replay entry point available in help/settings.

## Rollout
- Ship behind feature flag `dashboard_v3_tutorial`.
- Dogfood internally; monitor completion/drop-off and post-tutorial action rates for 1–2 weeks.
- Iterate copy/order if drop-off >30% before pipeline/task steps or if conversions < target.
