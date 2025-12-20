/**
 * Per-stage rotting thresholds for the opportunity pipeline
 *
 * PRD Reference: Pipeline PRD Section "Stage Configuration"
 * - Thresholds define when an opportunity is "stuck" in a stage
 * - Closed stages (won/lost) have no rotting threshold (null)
 *
 * WARNING: Do NOT add retry/backoff logic. These are simple lookups.
 */

import type { OpportunityStageValue } from "@/atomic-crm/validation/opportunities";

/**
 * Days before an opportunity is considered "rotting" in each stage.
 * null = no rotting (closed stages)
 */
export const STAGE_ROTTING_THRESHOLDS: Record<OpportunityStageValue, number | null> = {
  new_lead: 7,
  initial_outreach: 10,
  sample_visit_offered: 14,
  feedback_logged: 7,
  demo_scheduled: 5,
  closed_won: null,
  closed_lost: null,
};

/**
 * Status indicator for stage health
 * Order matters for priority: rotting/expired > warning > healthy > closed
 */
export type StageStatus = "rotting" | "expired" | "warning" | "healthy" | "closed";

/**
 * Check if an opportunity is rotting (over threshold for its stage)
 */
export function isRotting(stage: string, daysInStage: number): boolean {
  const threshold = STAGE_ROTTING_THRESHOLDS[stage as OpportunityStageValue];
  return threshold !== null && daysInStage > threshold;
}

/**
 * Get warning threshold (75% of rotting threshold)
 */
export function getWarningThreshold(stage: string): number | null {
  const threshold = STAGE_ROTTING_THRESHOLDS[stage as OpportunityStageValue];
  return threshold !== null ? Math.floor(threshold * 0.75) : null;
}

/**
 * Determine stage status for visual indicators
 *
 * Priority order (first match wins):
 * 1. closed - Closed stages never rot
 * 2. expired - Past expected close date (most urgent)
 * 3. rotting - Over stage threshold
 * 4. warning - 75%+ of threshold
 * 5. healthy - Below warning threshold
 */
export function getStageStatus(
  stage: string,
  daysInStage: number,
  expectedCloseDate?: Date | null
): StageStatus {
  if (stage === "closed_won" || stage === "closed_lost") {
    return "closed";
  }

  if (expectedCloseDate && expectedCloseDate < new Date()) {
    return "expired";
  }

  const threshold = STAGE_ROTTING_THRESHOLDS[stage as OpportunityStageValue];

  if (threshold === null) {
    return "healthy";
  }

  if (daysInStage > threshold) {
    return "rotting";
  }

  const warningThreshold = Math.floor(threshold * 0.75);
  if (daysInStage > warningThreshold) {
    return "warning";
  }

  return "healthy";
}
