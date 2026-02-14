-- ============================================================================
-- Migration: Deprecate get_activity_log RPC
-- ============================================================================
-- The get_activity_log RPC is replaced by the entity_timeline view.
-- This migration adds a deprecation notice to the function comment.
--
-- Replacement: Use entity_timeline view via timelineHandler instead.
-- Timeline: Function will be removed in a future release after all consumers migrate.
-- ============================================================================

-- Add deprecation notice to function documentation
COMMENT ON FUNCTION get_activity_log IS
'@deprecated Use entity_timeline view instead.

This RPC is deprecated and will be removed in a future release.
Replacement: Query entity_timeline view via timelineHandler.ts

Migration guide:
- Old: dataProvider.getActivityLog({ organizationId: 123 })
- New: useGetList("entity_timeline", { filter: { organization_id: 123 } })

Deprecation timeline:
- Phase A: This deprecation notice (current)
- Phase B: Console warnings in development
- Phase C: Function removal

Original description:
Returns activity entries for a contact or organization with formatted data.
Supports pagination and ordering.';
