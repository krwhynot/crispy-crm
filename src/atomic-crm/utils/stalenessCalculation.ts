/**
 * Staleness Calculation Utilities
 *
 * Per-stage stale thresholds as defined in PRD Section 6.3.
 * These thresholds determine when an opportunity is considered "stale"
 * based on how long it has been since the last activity.
 *
 * Stage-specific thresholds reflect the expected engagement cadence:
 * - new_lead: 7 days - New leads need quick follow-up
 * - initial_outreach: 14 days - Standard engagement cycle
 * - sample_visit_offered: 14 days - Critical stage where deals often stall
 * - feedback_logged: 21 days - Allow time for evaluation
 * - demo_scheduled: 14 days - Standard engagement cycle
 * - closed_won/closed_lost: N/A - Closed deals don't go stale
 */

import { z } from "zod";
import { parseDateSafely } from "@/lib/date-utils";
import {
  STAGE,
  ACTIVE_STAGES,
  CLOSED_STAGES,
} from "@/atomic-crm/opportunities/constants/stageConstants";

// Re-export for backward compatibility with existing imports
export {
  ACTIVE_STAGES as ACTIVE_PIPELINE_STAGES,
  CLOSED_STAGES,
} from "@/atomic-crm/opportunities/constants/stageConstants";

// Derive types from the canonical source
export type ActivePipelineStage = (typeof ACTIVE_STAGES)[number];
export type ClosedStage = (typeof CLOSED_STAGES)[number];

/**
 * Per-stage stale thresholds in days (PRD Section 6.3)
 * Closed stages are excluded from staleness calculations.
 */
export const STAGE_STALE_THRESHOLDS: Record<ActivePipelineStage, number> = {
  [STAGE.NEW_LEAD]: 7,
  [STAGE.INITIAL_OUTREACH]: 14,
  [STAGE.SAMPLE_VISIT_OFFERED]: 14,
  [STAGE.FEEDBACK_LOGGED]: 21,
  [STAGE.DEMO_SCHEDULED]: 14,
};

/**
 * Zod schema for validating stage stale threshold configuration.
 * Useful for runtime validation or API boundary checks.
 */
export const StageStaleThresholdsSchema = z.strictObject({
  [STAGE.NEW_LEAD]: z.number().int().positive().default(7),
  [STAGE.INITIAL_OUTREACH]: z.number().int().positive().default(14),
  [STAGE.SAMPLE_VISIT_OFFERED]: z.number().int().positive().default(14),
  [STAGE.FEEDBACK_LOGGED]: z.number().int().positive().default(21),
  [STAGE.DEMO_SCHEDULED]: z.number().int().positive().default(14),
});

export type StageStaleThresholds = z.infer<typeof StageStaleThresholdsSchema>;

/**
 * Check if a stage is a closed stage (won or lost).
 */
export function isClosedStage(stage: string): stage is ClosedStage {
  return CLOSED_STAGES.includes(stage as ClosedStage);
}

/**
 * Check if a stage is an active pipeline stage (not closed).
 */
export function isActivePipelineStage(stage: string): stage is ActivePipelineStage {
  return ACTIVE_STAGES.includes(stage as ActivePipelineStage);
}

/**
 * Get the stale threshold for a given stage.
 * Returns undefined for closed stages (they cannot be stale).
 */
export function getStaleThreshold(stage: string): number | undefined {
  if (isActivePipelineStage(stage)) {
    return STAGE_STALE_THRESHOLDS[stage];
  }
  return undefined;
}

/**
 * Calculate if an opportunity is stale based on its stage and last activity date.
 *
 * @param stage - The current pipeline stage
 * @param lastActivityDate - ISO date string of the last activity, or null if never contacted
 * @param referenceDate - The date to compare against (defaults to now)
 * @returns true if the opportunity is stale, false otherwise
 *
 * @example
 * // Check if a new lead is stale (7+ days without activity)
 * isOpportunityStale("new_lead", "2025-11-20T00:00:00Z"); // true if >7 days ago
 *
 * // Closed stages are never stale
 * isOpportunityStale("closed_won", null); // false
 *
 * // No activity date means the opportunity is stale (needs attention)
 * isOpportunityStale("initial_outreach", null); // true
 */
export function isOpportunityStale(
  stage: string,
  lastActivityDate: string | null,
  referenceDate: Date = new Date()
): boolean {
  const threshold = getStaleThreshold(stage);

  // Closed stages are never stale
  if (threshold === undefined) {
    return false;
  }

  // If no activity date, the opportunity is considered stale (needs immediate attention)
  if (!lastActivityDate) {
    return true;
  }

  const lastActivity = parseDateSafely(lastActivityDate);
  if (!lastActivity) {
    return true;
  }

  const daysSinceActivity = Math.floor(
    (referenceDate.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceActivity > threshold;
}

/**
 * Calculate days since last activity.
 *
 * @param lastActivityDate - ISO date string of the last activity, or null
 * @param referenceDate - The date to compare against (defaults to now)
 * @returns Number of days since last activity, or Infinity if no activity date
 */
export function getDaysSinceActivity(
  lastActivityDate: string | null,
  referenceDate: Date = new Date()
): number {
  if (!lastActivityDate) {
    return Infinity;
  }

  const lastActivity = parseDateSafely(lastActivityDate);
  if (!lastActivity) {
    return Infinity;
  }

  return Math.floor((referenceDate.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Count stale opportunities in a collection.
 * Convenience function for calculating KPIs.
 *
 * @param opportunities - Array of opportunities with stage and last_activity_date
 * @param referenceDate - The date to compare against (defaults to now)
 * @returns Count of stale opportunities
 */
export function countStaleOpportunities<
  T extends { stage: string; last_activity_date?: string | null; last_activity_at?: string | null },
>(opportunities: T[], referenceDate: Date = new Date()): number {
  return opportunities.filter((opp) => {
    // Support both field names (last_activity_date and last_activity_at)
    const lastActivity = opp.last_activity_date ?? opp.last_activity_at ?? null;
    return isOpportunityStale(opp.stage, lastActivity, referenceDate);
  }).length;
}

/**
 * Filter to get only stale opportunities.
 * Useful for displaying stale deals lists.
 *
 * @param opportunities - Array of opportunities with stage and last_activity_date
 * @param referenceDate - The date to compare against (defaults to now)
 * @returns Filtered array of stale opportunities
 */
export function filterStaleOpportunities<
  T extends { stage: string; last_activity_date?: string | null; last_activity_at?: string | null },
>(opportunities: T[], referenceDate: Date = new Date()): T[] {
  return opportunities.filter((opp) => {
    const lastActivity = opp.last_activity_date ?? opp.last_activity_at ?? null;
    return isOpportunityStale(opp.stage, lastActivity, referenceDate);
  });
}
