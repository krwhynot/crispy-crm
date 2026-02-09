/**
 * Feature Flags Configuration
 *
 * Runtime feature toggles for gradual rollout and rollback capability.
 * All flags default to their target state (enabled) for production.
 *
 * Usage:
 *   import { UNIFIED_TIMELINE_ENABLED } from '@/atomic-crm/config/featureFlags';
 *   if (UNIFIED_TIMELINE_ENABLED) { ... }
 *
 * Rollback:
 *   Set environment variable UNIFIED_TIMELINE=false to disable
 */

/**
 * Unified Timeline feature flag
 *
 * CURRENT STATUS: Always enabled (legacy path removed)
 *
 * This flag exists for:
 * 1. Documentation of the migration state
 * 2. Future rollback capability if issues arise (would require restoring ActivityLog)
 * 3. Observability metric correlation
 *
 * When enabled (default - current state):
 * - Uses UnifiedTimeline component for activity/task display
 * - Uses entity_timeline view instead of get_activity_log RPC
 * - Stage changes recorded with type='stage_change'
 *
 * When disabled (emergency rollback - requires code restore):
 * - Would need to restore deleted ActivityLog component
 * - Would use get_activity_log RPC (deprecated but still exists)
 * - Stage changes still work (DB trigger is source of truth)
 *
 * NOTE: Not wired to runtime conditionals because legacy ActivityLog was removed.
 * If rollback is needed, restore ActivityLog from git history and add conditional.
 *
 * @see docs/decisions/timeline-remediation.md
 */
export const UNIFIED_TIMELINE_ENABLED = process.env.UNIFIED_TIMELINE !== "false";
