-- Migration: Add DEPRECATED comments to tasks_v and tasks_summary views
-- Tier A, Seq 3 — Gate 1 closure
-- These views have zero app code consumers (verified Phase 2).
-- Scheduled for removal in Tier D (Seq 13-14) after Gate 3 passage.

COMMENT ON VIEW public.tasks_v IS
  'DEPRECATED (2026-02-10, Audit Phase 4). '
  'Compatibility view: Presents activities (type=task) as tasks table. '
  'Zero app code consumers — only referenced by auto-generated types. '
  'Scheduled for DROP in Tier D (Seq 14). Do not build new features on this view.';

COMMENT ON VIEW public.tasks_summary IS
  'DEPRECATED (2026-02-10, Audit Phase 4). '
  'Tasks with joined entity names for list/detail displays. Filters to activity_type=task only. '
  'Zero app code consumers — superseded by activities_summary. '
  'Scheduled for DROP in Tier D (Seq 13). Do not build new features on this view.';
